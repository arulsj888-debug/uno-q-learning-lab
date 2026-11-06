// Free-build electrical model: turns the parts and wires the learner placed into a DC circuit and solves it
// (modified nodal analysis, Newton iteration for the LEDs). It decides what works, what does not, and why.
//
// Modelling choices (all are simplifications, and the app tells the learner so):
//  * Breadboard strips: columns 1-30, holes a-e are one strip and f-j another; each of the four power rails is one strip.
//  * Wires and metal legs have no resistance. Resistors, the potentiometer (10 kOhm) and the LDR follow their data.
//  * LED: exponential diode; typical forward voltage at 20 mA: red 2.0 V, yellow 2.1 V, green 2.2 V, blue/white 3.1 V.
//  * GPIO outputs and supply pins are voltage sources with an internal resistance (simulation values, not datasheet figures).
//  * Passive buzzer: a capacitor - no DC current; it sounds when the voltage across it changes quickly (tone / PWM / blink).
//  * Pin limits come from the datasheets: Raspberry Pi 4 GPIO is 3.3 V only, 16 mA per pin, VIL 0.8 V, VIH 2.0 V;
//    STM32U585 (UNO Q) 20 mA absolute maximum per pin, D3 and A0-A5 are 3.3 V-only (3.6 V max).

const HOLE_RE = /^([a-j])(\d{1,2})$/;
const RAIL_RE = /^r:(top[+-]|bot[+-]):(\d+)$/;
export const LED_TYPES = {
  red: { vf: 2.0, hex: 0xff2a12, name: 'Red' }, yellow: { vf: 2.1, hex: 0xffc400, name: 'Yellow' },
  green: { vf: 2.2, hex: 0x1fd24a, name: 'Green' }, blue: { vf: 3.1, hex: 0x2a5bff, name: 'Blue' }, white: { vf: 3.1, hex: 0xf4f4ff, name: 'White' },
};
const NVT = 0.065;                           // ideality x thermal voltage of the LED model (V)
export const LDR_OHMS = lux => 15000 * Math.pow(Math.max(lux, 0.001) / 10, -0.6);   // GL5528, as in the lessons

export function nodeOfRef(ref) {
  let m = HOLE_RE.exec(ref); if (m) return `c${+m[2]}${m[1] <= 'e' ? 'T' : 'B'}`;
  m = RAIL_RE.exec(ref); if (m) return 'rail:' + m[1];
  return 'pin:' + ref;
}
export const isHoleRef = ref => HOLE_RE.test(ref) || RAIL_RE.test(ref);

/** terminals of a placed part: [[terminalName, holeRef], ...] */
export function terminals(d) {
  const row = d.row, c = d.col;
  switch (d.type) {
    case 'resistor': case 'ldr': return [['a', d.a], ['b', d.b]];
    case 'led': return [['anode', d.anode], ['cathode', d.cathode]];
    case 'buzzer': return [['plus', d.plus], ['minus', d.minus]];
    case 'button': return [['e1', `e${c}`], ['e2', `e${c + 2}`], ['f1', `f${c}`], ['f2', `f${c + 2}`]];
    case 'pot': return [['A', `${row}${c}`], ['W', `${row}${c + 2}`], ['B', `${row}${c + 4}`]];
    case 'tmp36': return d.flip ? [['VS', `${row}${c + 2}`], ['OUT', `${row}${c + 1}`], ['GND', `${row}${c}`]] : [['VS', `${row}${c}`], ['OUT', `${row}${c + 1}`], ['GND', `${row}${c + 2}`]];
    case 'wire': case 'fwire': return [['from', d.from], ['to', d.to]];
    default: return [];
  }
}

// ------------------------------------------------------------------ linear algebra
function gauss(A, b, n) {
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    if (Math.abs(A[p][i]) < 1e-30) return null;
    if (p !== i) { [A[p], A[i]] = [A[i], A[p]]; [b[p], b[i]] = [b[i], b[p]]; }
    for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; if (!f) continue; for (let k = i; k < n; k++) A[r][k] -= f * A[i][k]; b[r] -= f * b[i]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let k = i + 1; k < n; k++) s -= A[i][k] * x[k]; x[i] = s / A[i][i]; }
  return x;
}

/** elems: {t:'R',a,b,g} | {t:'S',a,b:0,g,i} (Norton source: current i into a, conductance g to ground) | {t:'D',a,b,Is} | {t:'T',vs,out,gnd} (TMP36)
 *  Node 0 is the ground reference. Returns the node voltages. */
export function solveDC(n, elems, temp = 25) {
  const v = new Array(n).fill(0), dv = new Map();
  for (let it = 0; it < 150; it++) {
    const m = n - 1, A = Array.from({ length: m }, () => new Array(m).fill(0)), z = new Array(m).fill(0);
    const G = (a, b, g) => { if (a) A[a - 1][a - 1] += g; if (b) A[b - 1][b - 1] += g; if (a && b) { A[a - 1][b - 1] -= g; A[b - 1][a - 1] -= g; } };
    const I = (a, i) => { if (a) z[a - 1] += i; };
    for (let i = 1; i < n; i++) G(i, 0, 1e-12);
    for (const e of elems) {
      if (e.t === 'R') G(e.a, e.b, e.g);
      else if (e.t === 'S') { G(e.a, e.b, e.g); I(e.a, e.i); I(e.b, -e.i); }
      else if (e.t === 'T') {   // TMP36 output: 0.5 V + 10 mV/degC when supplied with at least 2.7 V
        const vs = v[e.vs] - v[e.gnd], ramp = Math.min(1, Math.max(0, (vs - 2.4) / 0.3));
        const out = ramp * Math.min(2.0, Math.max(0.1, 0.5 + 0.01 * temp)), g = 1 / 50;
        G(e.out, e.gnd, g); I(e.out, out * g); I(e.gnd, -out * g);
      } else if (e.t === 'D') {
        const old = dv.has(e) ? dv.get(e) : 0, ex = Math.exp(Math.min(old, 6) / NVT);
        const gd = e.Is / NVT * ex + 1e-12, id = e.Is * (ex - 1), ieq = id - gd * old;
        G(e.a, e.b, gd); I(e.a, -ieq); I(e.b, ieq);
      }
    }
    const x = gauss(A, z, m); if (!x) return { v, ok: false };
    let maxd = 0; const nv = [0, ...x];
    for (let i = 1; i < n; i++) maxd = Math.max(maxd, Math.abs(nv[i] - v[i]));
    for (let i = 0; i < n; i++) v[i] = nv[i];
    let diodeMove = 0;
    for (const e of elems) if (e.t === 'D') {
      const want = v[e.a] - v[e.b], old = dv.has(e) ? dv.get(e) : 0;
      diodeMove = Math.max(diodeMove, Math.abs(want - old));
      dv.set(e, Math.max(old - 0.5, Math.min(old + 0.2, want)));
    }
    if (maxd < 1e-9 && diodeMove < 1e-7) break;
  }
  return { v, ok: true };
}

// ------------------------------------------------------------------ board description
/** What a header pin is. boardKind 'unoq' | 'pi4'. info comes from findPin (UNO Q) or the J8 table (Pi). */
export function pinKind(boardKind, id, info) {
  if (!info) return { k: 'nc', name: id };
  if (boardKind === 'pi4') {
    if (info.gpio !== null && info.gpio !== undefined) return { k: 'gpio', gpio: info.gpio, v3: true, pwm: [12, 13, 18, 19].includes(info.gpio), name: 'GPIO' + info.gpio, vil: 0.8, vih: 2.0, imax: 16, pull: 47000 };
    if (info.label === '5V') return { k: '5v', name: '5V' };
    if (info.label === '3V3') return { k: '3v3', name: '3V3' };
    if (info.label === 'GND') return { k: 'gnd', name: 'GND' };
    return { k: 'nc', name: info.label || id };
  }
  if (info.kind === 'gnd') return { k: 'gnd', name: 'GND' };
  if (id === '5V' || id === 'SPI_5V') return { k: '5v', name: '5V' };
  if (id === '3V3') return { k: '3v3', name: '3V3' };
  if (/^D\d+$/.test(id) || /^A\d$/.test(id)) {
    const analog = /^A\d$/.test(id);
    return { k: 'gpio', name: id, v3: id === 'D3' || analog, pwm: !!info.pwm, analog, vil: 0.3 * 3.3, vih: 0.7 * 3.3, imax: 20, pull: 40000 };
  }
  return { k: 'nc', name: info.label || id };
}

export const PIN_MODES = {
  out0: 'Output LOW', out1: 'Output HIGH', blink: 'Blink (1 Hz)', pwm: 'PWM (duty cycle)', tone: 'Tone (frequency)',
  in: 'Input (no pull resistor)', up: 'Input with pull-up', down: 'Input with pull-down', analog: 'Analog input (ADC)',
};
const OUTPUT_MODES = ['out0', 'out1', 'blink', 'pwm', 'tone'];

// ------------------------------------------------------------------ the whole circuit
/**
 * model: { boardKind, pinInfo(id), parts:[def...], pinCfg:{id:{mode,duty,freq}}, powered, burnt:Set, damaged:Set,
 *          env:{lux, tempC, pressed:{id:bool}, pot:{id:0..1}}, t: seconds }
 */
export function evaluate(model) {
  const { boardKind, pinInfo, parts, pinCfg = {}, powered, env, t = 0 } = model;
  const burnt = model.burnt || new Set(), damaged = model.damaged || new Set(), burnWhy = model.burnWhy || {};
  const notes = [], newBurn = new Set(), newDamage = new Set();
  const note = (lvl, text, id) => notes.push({ lvl, text, id });

  // ---- union-find over node keys
  const parent = new Map();
  const find = k => { if (!parent.has(k)) parent.set(k, k); let r = k; while (parent.get(r) !== r) r = parent.get(r); while (parent.get(k) !== r) { const nx = parent.get(k); parent.set(k, r); k = nx; } return r; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
  const T = (d, name) => nodeOfRef(terminals(d).find(([n]) => n === name)[1]);
  for (const d of parts) {
    for (const [, ref] of terminals(d)) find(nodeOfRef(ref));
    if (d.type === 'wire' || d.type === 'fwire') union(nodeOfRef(d.from), nodeOfRef(d.to));
    if (d.type === 'button') { union(T(d, 'e1'), T(d, 'e2')); union(T(d, 'f1'), T(d, 'f2')); }   // the two legs on one side of a tactile switch are joined inside it
  }
  const ids = new Map([['GROUND', 0]]);
  const nid = key => { const r = find(key); if (!ids.has(r)) ids.set(r, ids.size); return ids.get(r); };
  const nodeOf = ref => nid(nodeOfRef(ref));

  const usedPins = new Map();
  for (const d of parts) if (d.type === 'wire' || d.type === 'fwire') for (const ref of [d.from, d.to]) if (!isHoleRef(ref)) usedPins.set(ref, pinKind(boardKind, ref, pinInfo(ref)));
  for (const [id] of usedPins) nodeOf(id);
  for (const d of parts) for (const [, ref] of terminals(d)) nodeOf(ref);
  const n = ids.size;

  const gpioIds = [...usedPins].filter(([, k]) => k.k === 'gpio').map(([id]) => id);
  const hasFast = gpioIds.some(id => ['tone', 'pwm'].includes((pinCfg[id] || {}).mode));
  const N = hasFast ? 10 : 1;
  const result = { parts: {}, pins: {}, notes, newBurn, newDamage, tripped: false };
  const sums = {};
  const acc = (id, k, val, how = 'mean') => { const o = sums[id] || (sums[id] = {}); if (how === 'mean') o[k] = (o[k] || 0) + val / N; else if (how === 'max') o[k] = Math.max(o[k] ?? -Infinity, val); else o[k] = Math.min(o[k] ?? Infinity, val); };
  let lastV = null, floating = new Set(), srcMax = 0;

  for (let step = 0; step < N; step++) {
    const elems = [], pinSrc = [];
    const level = cfg => {
      switch (cfg.mode) {
        case 'out1': return 1; case 'out0': return 0;
        case 'blink': return Math.floor(t * 2) % 2 === 0 ? 1 : 0;
        case 'pwm': return (step + 0.5) / N < (cfg.duty ?? 0.5) ? 1 : 0;
        case 'tone': return step % 2;
        default: return 0;
      }
    };
    const src = (node, V, r, extra = {}) => { const e = { t: 'S', a: node, b: 0, g: 1 / r, i: V / r }; elems.push(e); pinSrc.push({ e, V, ...extra }); };
    if (powered) {
      for (const [id, k] of usedPins) {
        const node = nodeOf(id);
        if (k.k === '5v') src(node, 5, 0.2, { id, supply: true });
        else if (k.k === '3v3') src(node, 3.3, 0.3, { id, supply: true });
        else if (k.k === 'gnd') src(node, 0, 0.01, { id, supply: true });
        else if (k.k === 'gpio') {
          const cfg = pinCfg[id] || { mode: 'in' };
          if (!damaged.has(id)) {
            if (OUTPUT_MODES.includes(cfg.mode)) { const lv = level(cfg); src(node, lv ? 3.3 : 0, 50, { id, gpioOut: true }); }
            else if (cfg.mode === 'up') src(node, 3.3, k.pull, { id, pull: true });
            else if (cfg.mode === 'down') src(node, 0, k.pull, { id, pull: true });
          }
          if (boardKind === 'pi4' && (k.gpio === 2 || k.gpio === 3)) src(node, 3.3, 1800, { id, pull: true });   // fixed 1.8 kOhm pull-up on the board
        }
      }
    }
    const pe = {};
    for (const d of parts) {
      const dead = burnt.has(d.id);
      if (d.type === 'resistor') { const r = Math.max(0.01, d.ohms), a = nodeOf(d.a), b = nodeOf(d.b); if (!dead) elems.push({ t: 'R', a, b, g: 1 / r }); pe[d.id] = { a, b, r }; }
      else if (d.type === 'led') { const lt = LED_TYPES[d.color || 'red'], Is = 0.02 / Math.exp(lt.vf / NVT), e = { t: 'D', a: nodeOf(d.anode), b: nodeOf(d.cathode), Is }; if (!dead) elems.push(e); pe[d.id] = { a: e.a, b: e.b, Is }; }
      else if (d.type === 'ldr') { const r = LDR_OHMS(env.lux), a = nodeOf(d.a), b = nodeOf(d.b); elems.push({ t: 'R', a, b, g: 1 / r }); pe[d.id] = { a, b, r }; }
      else if (d.type === 'button') { const down = !!(env.pressed || {})[d.id]; if (down) elems.push({ t: 'R', a: nid(T(d, 'e1')), b: nid(T(d, 'f1')), g: 20 }); pe[d.id] = { down }; }
      else if (d.type === 'pot') { const f = (env.pot || {})[d.id] ?? 0.5, r1 = Math.max(1, f * 10000), r2 = Math.max(1, (1 - f) * 10000); const A = nid(T(d, 'A')), W = nid(T(d, 'W')), B = nid(T(d, 'B')); elems.push({ t: 'R', a: A, b: W, g: 1 / r1 }, { t: 'R', a: W, b: B, g: 1 / r2 }); pe[d.id] = { W }; }
      else if (d.type === 'buzzer') pe[d.id] = { a: nodeOf(d.plus), b: nodeOf(d.minus) };
      else if (d.type === 'tmp36') { const vs = nid(T(d, 'VS')), out = nid(T(d, 'OUT')), g = nid(T(d, 'GND')); elems.push({ t: 'R', a: vs, b: g, g: 1 / 66000 }, { t: 'T', vs, out, gnd: g }); pe[d.id] = { vs, out, g }; }
    }
    const { v } = solveDC(n, elems, env.tempC ?? 25);
    lastV = v;
    for (const p of pinSrc) {
      if (!p.id) continue;
      const cur = p.e.i - p.e.g * v[p.e.a];
      const o = result.pins[p.id] || (result.pins[p.id] = { I: 0, Imax: 0, V: 0 });
      if (p.gpioOut) { o.Imax = Math.max(o.Imax, Math.abs(cur)); o.I += cur / N; }
      if (p.supply) srcMax = Math.max(srcMax, Math.abs(cur));
    }
    for (const d of parts) {
      const q = pe[d.id]; if (!q) continue;
      if (d.type === 'resistor' || d.type === 'ldr') { const V = v[q.a] - v[q.b], I = V / q.r; acc(d.id, 'V', V); acc(d.id, 'I', I); acc(d.id, 'P', V * I); acc(d.id, 'Pmax', V * I, 'max'); }
      else if (d.type === 'led') { const V = v[q.a] - v[q.b], I = burnt.has(d.id) ? 0 : q.Is * (Math.exp(Math.min(V, 6) / NVT) - 1); acc(d.id, 'V', V); acc(d.id, 'I', I); acc(d.id, 'Imax', I, 'max'); }
      else if (d.type === 'buzzer') { const V = v[q.a] - v[q.b]; acc(d.id, 'Vmax', V, 'max'); acc(d.id, 'Vmin', V, 'min'); acc(d.id, 'V', V); }
      else if (d.type === 'pot') acc(d.id, 'Vw', v[q.W]);
      else if (d.type === 'tmp36') { acc(d.id, 'Vs', v[q.vs] - v[q.g]); acc(d.id, 'Vout', v[q.out] - v[q.g]); }
    }
    if (step === N - 1) {   // floating nets: no conducting path to any source
      const adj = new Map(); const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
      for (const e of elems) { if (e.t === 'R' || e.t === 'D') link(e.a, e.b); else if (e.t === 'S') link(e.a, 0); else if (e.t === 'T') { link(e.out, e.gnd); link(e.vs, e.gnd); } }
      const seen = new Set([0]), q = [0]; while (q.length) { const x = q.pop(); for (const y of adj.get(x) || []) if (!seen.has(y)) { seen.add(y); q.push(y); } }
      floating = new Set(); for (let i = 1; i < n; i++) if (!seen.has(i)) floating.add(i);
    }
  }

  // ------------------------------------------------------------ results and explanations
  const v = lastV;
  result.nodeV = ref => (powered && ids.has(find(nodeOfRef(ref))) ? v[nodeOf(ref)] : 0);
  result.isFloating = ref => powered && ids.has(find(nodeOfRef(ref))) && floating.has(nodeOf(ref));
  const attach = new Map();
  for (const d of parts) for (const [name, ref] of terminals(d)) { const r = find(nodeOfRef(ref)); (attach.get(r) || attach.set(r, []).get(r)).push({ d, name }); }
  const dangling = (d, name) => (attach.get(find(T(d, name))) || []).filter(o => !(o.d === d && o.name === name)).length === 0;

  if (!powered) note('info', 'The board has no power. Press “Plug in power” to see the circuit work.');

  const burn = (id, why) => { newBurn.add(id); note('bad', why, id); };
  for (const d of parts) {
    const s = sums[d.id] || {}, R = result.parts[d.id] = { id: d.id, type: d.type, status: 'ok', ...s };
    const label = nameOf(d);
    if (d.type === 'led') {
      const dn = dangling(d, 'anode') ? 'anode (long leg)' : dangling(d, 'cathode') ? 'cathode (short leg)' : null;
      const Ipk = s.Imax ?? 0, I = s.I ?? 0, V = s.V ?? 0, vf = LED_TYPES[d.color || 'red'].vf;
      R.level = Math.pow(Math.min(1, Math.max(0, I / 0.015)), 0.6);
      if (burnt.has(d.id)) { R.status = 'bad'; R.level = 0; R.msg = 'Burnt out: it got too much current. Delete it and use a new one.'; note('bad', burnWhy[d.id] || `${label} is burnt out (too much current earlier). Delete it and place a new one.`, d.id); }
      else if (Ipk > 0.030) { R.level = 1; R.status = 'bad'; R.msg = 'Burnt out'; burn(d.id, `${label} burns out! ${Ipk > 0.2 ? 'Far more than 200 mA' : 'About ' + (Ipk * 1000).toFixed(0) + ' mA'} flowed through it (a 5 mm LED is rated about 20 mA). An LED always needs a series resistor. It stays burnt out until you delete it.`); }
      else if (I > 0.0008) {
        R.msg = `Lit: ${(I * 1000).toFixed(1)} mA, ${V.toFixed(2)} V across it.`;
        if (Ipk > 0.021) { R.status = 'warn'; note('warn', `${label}: ${(Ipk * 1000).toFixed(0)} mA is above the usual 20 mA rating. Use a larger resistor.`, d.id); }
        else note('ok', `${label} lights: ${(I * 1000).toFixed(1)} mA${I < 0.002 ? ' (dim)' : ''}.`, d.id);
      } else if (!powered) { R.status = 'off'; R.msg = 'Off: no power.'; }
      else {
        R.status = 'off'; let why;
        if (dn) why = `its ${dn} is not connected to anything`;
        else if (V < -0.5) why = 'it is the wrong way round: current only flows from the long leg (anode, +) to the short leg (cathode, −). Turn it around';
        else if (V > 0.3 && V < vf - 0.35) why = `only ${V.toFixed(2)} V reach it, and a ${d.color || 'red'} LED needs about ${vf.toFixed(1)} V`;
        else if (Math.abs(V) <= 0.3) why = 'there is no voltage across it: the circuit is not complete (check the wires and the power, and that the pin is set to Output HIGH)';
        else why = 'almost no current flows (is the resistor much too large?)';
        R.msg = 'Off: ' + why + '.'; note('bad', `${label} stays dark: ${why}.`, d.id);
      }
    } else if (d.type === 'resistor') {
      const dn = dangling(d, 'a') || dangling(d, 'b'), P = s.Pmax ?? 0;
      if (burnt.has(d.id)) { R.status = 'bad'; R.msg = 'Burnt out.'; note('bad', burnWhy[d.id] || `${label} is burnt out. Delete it and place a new one.`, d.id); }
      else if (P > 0.5) { R.status = 'bad'; burn(d.id, `${label} burns out: it had to turn ${P.toFixed(2)} W into heat, but this resistor is rated 0.25 W.`); }
      else if (P > 0.25) { R.status = 'warn'; note('warn', `${label} gets very hot: ${(P * 1000).toFixed(0)} mW is more than its 0.25 W rating.`, d.id); }
      else R.msg = powered ? `${((s.I ?? 0) * 1000).toFixed(2)} mA, ${(s.V ?? 0).toFixed(2)} V across it, ${((s.P ?? 0) * 1000).toFixed(1)} mW.` : '';
      if (dn && !burnt.has(d.id)) { if (R.status === 'ok') R.status = 'warn'; note('warn', `${label}: one leg is not connected to anything, so it does nothing.`, d.id); }
    } else if (d.type === 'buzzer') {
      const dn = dangling(d, 'plus') ? '+' : dangling(d, 'minus') ? '−' : null, swing = (s.Vmax ?? 0) - (s.Vmin ?? 0), Vp = s.V ?? 0;
      R.loud = Math.min(1, swing / 3.3);
      if (!powered) R.status = 'off';
      else if (dn) { R.status = 'off'; R.msg = `Silent: its ${dn} leg is not connected.`; note('bad', `${label} is silent: its ${dn} leg is not connected to anything.`, d.id); }
      else if (R.loud > 0.05) { R.msg = `Sounding: the voltage across it changes by ${swing.toFixed(1)} V.`; note('ok', `${label} sounds: the pin switches the voltage across it back and forth.`, d.id); }
      else {
        R.status = 'off'; const steady = Math.abs(Vp) > 0.5;
        R.msg = steady ? 'Only a steady voltage: a passive buzzer needs a changing signal.' : 'Silent: no signal reaches it.';
        note('bad', `${label} is silent: ` + (steady ? 'a passive buzzer only clicks when the voltage switches on or off. Set the pin to “Tone” so the voltage changes quickly.' : 'no changing voltage reaches it. Check the wires and set the pin to “Tone”.'), d.id);
      }
    } else if (d.type === 'pot') {
      const dn = ['A', 'W', 'B'].filter(x => dangling(d, x)); if (dn.length) { R.status = 'warn'; note('warn', `${label}: leg ${dn.join(', ')} is not connected to anything.`, d.id); }
      R.msg = powered ? `Wiper voltage ${(s.Vw ?? 0).toFixed(2)} V.` : ''; if (powered && !dn.length) note('ok', `${label}: ${R.msg}`, d.id);
    } else if (d.type === 'ldr') {
      if (dangling(d, 'a') || dangling(d, 'b')) { R.status = 'warn'; note('warn', `${label}: one leg is not connected to anything.`, d.id); }
      R.msg = `${(LDR_OHMS(env.lux) / 1000).toFixed(1)} kΩ at ${env.lux < 1 ? 'under 1' : Math.round(env.lux)} lux`;
    } else if (d.type === 'tmp36') {
      const vs = s.Vs ?? 0;
      if (powered && vs < -0.5) { R.status = 'bad'; R.msg = 'Connected backwards.'; note('bad', `${label} is connected backwards (+VS and GND swapped). With the flat face toward you and the legs down, the pins are +VS, VOUT, GND from left to right. A real TMP36 would get hot and could be damaged.`, d.id); }
      else if (powered && vs < 2.7) { R.status = 'off'; R.msg = `Supply is only ${vs.toFixed(1)} V; it needs 2.7 V … 5.5 V.`; note('bad', `${label} is not supplied properly (${vs.toFixed(1)} V; it needs at least 2.7 V). Connect +VS to 3.3 V or 5 V and GND to GND.`, d.id); }
      else if (powered) { R.msg = `Output ${(s.Vout ?? 0).toFixed(3)} V = ${(((s.Vout ?? 0) - 0.5) * 100).toFixed(1)} °C.`; note('ok', `${label}: ${R.msg}`, d.id); }
    }
  }
  if (powered && srcMax > 1.5 && newBurn.size === 0) { result.tripped = true; notes.unshift({ lvl: 'bad', text: `Short circuit! About ${srcMax.toFixed(1)} A would flow out of a power pin. A real power supply or the board's protection would cut the power. Find the wire or part that joins 5 V or 3.3 V directly to GND.` }); }
  for (const [id, k] of usedPins) {
    const o = result.pins[id] || (result.pins[id] = { I: 0, Imax: 0, V: 0 }), cfg = pinCfg[id] || { mode: 'in' };
    if (k.k === 'nc') { note('warn', `${k.name}: this pin is not modelled in free-build (it is not a normal I/O or power pin).`, id); continue; }
    if (k.k !== 'gpio') { if (powered) o.V = v[nodeOf(id)]; continue; }
    const net = nodeOf(id), V = v[net];
    o.V = V; o.floating = powered && floating.has(net);
    if (damaged.has(id)) { o.status = 'bad'; o.msg = 'Damaged (simulation).'; note('bad', `${k.name} is damaged: it was driven beyond its limits. Press “Replace broken parts”.`, id); continue; }
    if (!powered) continue;
    const isOut = OUTPUT_MODES.includes(cfg.mode), mA = o.Imax * 1000;
    if (!isOut) {
      o.read = o.floating ? 'floating' : V >= k.vih ? 1 : V <= k.vil ? 0 : 'undefined';
      if (cfg.mode === 'analog') o.adc = Math.round(Math.min(1, Math.max(0, V / 3.3)) * 1023);
    }
    if (V > 3.6 && (k.v3 || isOut || boardKind === 'pi4')) { newDamage.add(id); o.status = 'bad'; note('bad', `${k.name} sees ${V.toFixed(1)} V. ${boardKind === 'pi4' ? 'Raspberry Pi GPIO pins are 3.3 V only (not 5 V tolerant)' : k.v3 ? 'This pin tolerates at most 3.6 V' : 'An output pin must not be forced above 3.3 V'}: the board can be damaged. Never connect 5 V to it.`, id); }
    else if (isOut && mA > k.imax * 2) { newDamage.add(id); o.status = 'bad'; note('bad', `${k.name} has to deliver ${mA.toFixed(0)} mA, far above its ${k.imax} mA limit, and would be damaged (in this simulation: more than twice the limit damages the pin).`, id); }
    else if (isOut && mA > k.imax) { o.status = 'warn'; note('warn', `${k.name} delivers ${mA.toFixed(1)} mA, above the ${k.imax} mA limit of one pin. Use a larger resistor.`, id); }
    else if (isOut && mA > 0.1) o.msg = `${mA.toFixed(1)} mA`;
    if (!isOut && cfg.mode === 'in' && o.floating) note('warn', `${k.name} is an input with nothing driving it (it “floats”) and reads random values. Use a pull-up or pull-down (set the pin to “Input with pull-up”), or connect it to 3.3 V or GND through a button.`, id);
    if (!isOut && cfg.mode === 'analog' && boardKind === 'pi4') note('warn', 'The Raspberry Pi has no analog inputs (no ADC). Analog sensors need an extra ADC chip.', id);
    if (!isOut && !isOut) { /* inputs: nothing else to check */ }
  }
  for (const [id, k] of usedPins) if (k.k === 'gpio' && OUTPUT_MODES.includes((pinCfg[id] || {}).mode)) {
    const net = nodeOf(id);
    for (const [id2, k2] of usedPins) if (id2 !== id && ['gnd', '5v', '3v3'].includes(k2.k) && nodeOf(id2) === net) note('bad', `${k.name} is an output wired straight to ${k2.name}: the pin fights the supply.`, id);
  }
  if (powered) for (const [id, k] of usedPins) if (k.k === 'gpio' && !(pinCfg[id] && pinCfg[id].mode) && !damaged.has(id)) note('info', `${k.name} is an input by default. Choose what the pin should do (Output HIGH, Blink, ...) in the Pins list.`, id);
  if (powered && parts.length && !notes.some(x => x.lvl === 'bad' || x.lvl === 'warn' || x.lvl === 'ok')) note('info', 'Nothing is wrong, but nothing is happening yet: add a part, wire it to a pin and give the pin a job.');
  result.srcMax = srcMax;
  return result;
}

export function nameOf(d) {
  const nm = { resistor: 'Resistor', led: 'LED', button: 'Push button', pot: 'Potentiometer', buzzer: 'Buzzer', ldr: 'Light sensor', tmp36: 'TMP36', wire: 'Wire', fwire: 'Wire' }[d.type] || d.type;
  const extra = d.type === 'resistor' ? ` ${fmtOhms(d.ohms)}` : d.type === 'led' ? ` (${d.color || 'red'})` : '';
  return `${nm}${extra} ${String(d.id).toUpperCase()}`;
}
export function fmtOhms(r) { return r >= 1e6 ? `${+(r / 1e6).toFixed(2)} MΩ` : r >= 1000 ? `${+(r / 1000).toFixed(2)} kΩ` : `${r} Ω`; }

/** colour bands of a 4-band resistor with 5 % tolerance */
export function resistorBands(ohms) {
  const names = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
  if (ohms < 10) return ['brown', 'black', 'gold', 'gold'];
  let mult = 0, v = ohms; while (v >= 100 && mult < 9) { v /= 10; mult++; }
  v = Math.round(v); if (v >= 100) { v = Math.round(v / 10); mult++; }
  return [names[Math.floor(v / 10)], names[v % 10], names[mult], 'gold'];
}

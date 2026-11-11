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
export const RGB_VF = { R: 2.0, G: 3.0, B: 3.1 };   // typical forward voltages of the three dice of a 5 mm RGB LED (green and blue are InGaN)
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
/** a pin of a module standing on the desk, e.g. "pir1.VCC" */
export const isModRef = ref => /^[a-z]+\d+\.[A-Z][A-Z0-9]*$/.test(ref);

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
    case 'sht31': return [['VIN', `${row}${c}`], ['GND', `${row}${c + 1}`], ['SCL', `${row}${c + 2}`], ['SDA', `${row}${c + 3}`], ['ADDR', `${row}${c + 4}`], ['RST', `${row}${c + 5}`], ['ALRT', `${row}${c + 6}`]];
    case 'thermo': case 'pixels': return [['QA', `${d.id}.QA`], ['QB', `${d.id}.QB`]];
    case 'l293d': { const out = []; for (let i = 1; i <= 16; i++) out.push([`p${i}`, i <= 8 ? `f${c + i - 1}` : `e${c + 16 - i}`]); return out; }
    case 'motor': return [['M1', `${d.id}.M1`], ['M2', `${d.id}.M2`]];
    case 'relay': return [['DCP', `${d.id}.DCP`], ['DCN', `${d.id}.DCN`], ['IN', `${d.id}.IN`], ['NO', `${d.id}.NO`], ['COM', `${d.id}.COM`], ['NC', `${d.id}.NC`]];
    case 'battery': return [['POS', `${d.id}.POS`], ['NEG', `${d.id}.NEG`]];
    case 'lamp': return [['L1', `${d.id}.L1`], ['L2', `${d.id}.L2`]];
    case 'hcsr04': return [['VCC', `${row}${c}`], ['TRIG', `${row}${c + 1}`], ['ECHO', `${row}${c + 2}`], ['GND', `${row}${c + 3}`]];
    case 'servo': return [['GND', `${row}${c}`], ['V', `${row}${c + 1}`], ['SIG', `${row}${c + 2}`]];
    case 'joystick': return [['GND', `${row}${c}`], ['VCC', `${row}${c + 1}`], ['VRX', `${row}${c + 2}`], ['VRY', `${row}${c + 3}`], ['SW', `${row}${c + 4}`]];
    case 'encoder': return [['CLK', `${row}${c}`], ['DT', `${row}${c + 1}`], ['SW', `${row}${c + 2}`], ['VCC', `${row}${c + 3}`], ['GND', `${row}${c + 4}`]];
    case 'dht': return [['VCC', `${row}${c}`], ['DATA', `${row}${c + 1}`], ['NC', `${row}${c + 2}`], ['GND', `${row}${c + 3}`]];
    case 'rgbled': return [['R', `${row}${c}`], ['C', `${row}${c + 1}`], ['G', `${row}${c + 2}`], ['B', `${row}${c + 3}`]];
    case 'pir': return [['VCC', `${d.id}.VCC`], ['OUT', `${d.id}.OUT`], ['GND', `${d.id}.GND`]];
    case 'wire': case 'fwire': case 'lead': case 'qwiic': return [['from', d.from], ['to', d.to]];
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
      } else if (e.t === 'H') {   // one output of the L293D H-bridge: high = VCC2 through 2.3 ohm, low = GND through 2 ohm, off = high impedance
        const gd = v[e.gnd];
        if (e.grounded && v[e.en] - gd >= 2.3 && v[e.vcc1] - gd >= 4.5) {
          const high = v[e.a] - gd >= 2.3, g = 1 / (high ? 2.3 : 2), val = high ? Math.max(0, v[e.vcc2] - gd) : 0;
          e.on = true; e.high = high; G(e.y, e.gnd, g); I(e.y, val * g); I(e.gnd, -val * g); e.target = val; e.g = g;
        } else e.on = false;
      } else if (e.t === 'M') {   // module output: voltage out = fn(supply voltage), measured against the module's own GND
        const out = e.fn(v[e.vs] - v[e.gnd]), g = 1 / (e.r || 100);
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
    if (info.gpio !== null && info.gpio !== undefined) return { k: 'gpio', gpio: info.gpio, v3: true, i2c: info.gpio === 2 ? 'sda' : info.gpio === 3 ? 'scl' : undefined, bus: 'i2c1', pwm: [12, 13, 18, 19].includes(info.gpio), name: 'GPIO' + info.gpio, vil: 0.8, vih: 2.0, imax: 16, pull: 47000 };
    if (info.label === '5V') return { k: '5v', name: '5V' };
    if (info.label === '3V3') return { k: '3v3', name: '3V3' };
    if (info.label === 'GND') return { k: 'gnd', name: 'GND' };
    return { k: 'nc', name: info.label || id };
  }
  if (boardKind === 'esp32') {
    if (info.kind === 'gnd') return { k: 'gnd', name: 'GND' };
    if (id === 'VIN') return { k: '5v', name: 'VIN (5 V from USB)' };
    if (id === 'EN') return { k: 'en', name: 'EN (reset)', vmax: 3.6 };   // chip-enable input: LOW holds the chip in reset (the EN button does this)
    if (id === '3V3') return { k: '3v3', name: '3V3' };
    if (info.gpio !== undefined && info.gpio !== null) {
      // ESP32 datasheet v5.3: VIH 0.75 VDD, VIL 0.25 VDD, internal pull resistors about 45 kOhm (none on GPIO34-39), IOH 40 mA / IOL 28 mA at the strongest drive setting, pins accept up to 3.6 V
      const i2c = { 21: 'sda', 22: 'scl' }[info.gpio];
      return { k: 'gpio', name: 'GPIO' + info.gpio, i2c, bus: i2c ? 'wire' : undefined, pwm: !info.inOnly, analog: !!info.adc, adcMax: 4095, inOnly: !!info.inOnly, vil: 0.25 * 3.3, vih: 0.75 * 3.3, imax: 28, limitText: '28 mA sink / 40 mA source at the strongest drive setting', pull: 45000, vmax: 3.6 };
    }
    return { k: 'nc', name: info.label || id };
  }
  if (boardKind === 'uno3') {
    if (info.kind === 'gnd') return { k: 'gnd', name: 'GND' };
    if (id === '5V' || id === 'IOREF') return { k: '5v', name: id === 'IOREF' ? 'IOREF (5 V)' : '5V' };
    if (id === '3V3') return { k: '3v3', name: '3.3V' };
    if (/^D\d+$/.test(id) || /^A\d$/.test(id) || id === 'SDA' || id === 'SCL') {
      const i2c = { A4: 'sda', SDA: 'sda', A5: 'scl', SCL: 'scl' }[id];
      // ATmega328P at 5 V: VIL 0.3 VCC, VIH 0.6 VCC, pull-up 20–50 kOhm, 40 mA absolute maximum per pin (20 mA recommended)
      return { k: 'gpio', name: id === 'SDA' ? 'SDA (A4)' : id === 'SCL' ? 'SCL (A5)' : id, pwm: !!info.pwm, analog: /^A\d$/.test(id), i2c, bus: i2c ? 'wire' : undefined,
        vdd: 5, vref: 5, vil: 1.5, vih: 3.0, imax: 20, limitText: '20 mA recommended (40 mA absolute maximum)', pull: 35000, vmax: 5.5, rout: 40 };
    }
    return { k: 'nc', name: info.label || id };
  }
  if (info.kind === 'gnd') return { k: 'gnd', name: 'GND' };
  if (id === '5V' || id === 'SPI_5V') return { k: '5v', name: '5V' };
  if (id === '3V3') return { k: '3v3', name: '3V3' };
  if (/^D\d+$/.test(id) || /^A\d$/.test(id)) {
    const analog = /^A\d$/.test(id);
    const i2c = { D20: ['sda', 'wire'], D21: ['scl', 'wire'], A4: ['sda', 'i2c3'], A5: ['scl', 'i2c3'] }[id] || [];
    return { k: 'gpio', name: id, i2c: i2c[0], bus: i2c[1], v3: id === 'D3' || analog, pwm: !!info.pwm, analog, vil: 0.3 * 3.3, vih: 0.7 * 3.3, imax: 20, pull: 40000 };
  }
  return { k: 'nc', name: info.label || id };
}

export const PIN_MODES = {
  out0: 'Output LOW', out1: 'Output HIGH', blink: 'Blink (1 Hz)', pwm: 'PWM (duty cycle)', tone: 'Tone (frequency)',
  i2c: 'I²C bus (SDA / SCL)', servo: 'Servo angle (50 Hz pulses)', pulse: 'Trigger pulses (HC-SR04)',
  dht: 'Single-wire data (DHT11 / DHT22)', in: 'Input (no pull resistor)', up: 'Input with pull-up', down: 'Input with pull-down', analog: 'Analog input (ADC)',
};
const OUTPUT_MODES = ['out0', 'out1', 'blink', 'pwm', 'tone', 'servo', 'pulse'];

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
    if (d.type === 'wire' || d.type === 'fwire' || d.type === 'lead' || d.type === 'qwiic') union(nodeOfRef(d.from), nodeOfRef(d.to));
    if (d.type === 'thermo' || d.type === 'pixels') union(T(d, 'QA'), T(d, 'QB'));   // the two Qwiic sockets of a module are the same bus
    if (d.type === 'button') { union(T(d, 'e1'), T(d, 'e2')); union(T(d, 'f1'), T(d, 'f2')); }
    if (d.type === 'l293d') { union(T(d, 'p4'), T(d, 'p5')); union(T(d, 'p4'), T(d, 'p12')); union(T(d, 'p4'), T(d, 'p13')); }   // the four middle pins are one ground   // the two legs on one side of a tactile switch are joined inside it
  }
  if (boardKind === 'uno3') { union('pin:SDA', 'pin:A4'); union('pin:SCL', 'pin:A5'); }   // the top-header SDA/SCL pins are the same signals as A4/A5
  const ids = new Map([['GROUND', 0]]);
  const nid = key => { const r = find(key); if (!ids.has(r)) ids.set(r, ids.size); return ids.get(r); };
  const nodeOf = ref => nid(nodeOfRef(ref));

  const usedPins = new Map();
  for (const d of parts) if (d.type === 'wire' || d.type === 'fwire' || d.type === 'lead' || d.type === 'qwiic') for (const ref of [d.from, d.to]) if (!isHoleRef(ref) && !isModRef(ref) && ref !== 'QWIIC') usedPins.set(ref, pinKind(boardKind, ref, pinInfo(ref)));
  for (const [id] of usedPins) nodeOf(id);
  for (const d of parts) for (const [, ref] of terminals(d)) nodeOf(ref);
  const n = ids.size;

  const gpioIds = [...usedPins].filter(([, k]) => k.k === 'gpio').map(([id]) => id);
  const hasFast = gpioIds.some(id => ['tone', 'pwm', 'servo', 'pulse'].includes((pinCfg[id] || {}).mode));
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
        case 'servo': return (step + 0.5) / N < 0.08 ? 1 : 0;
        case 'pulse': return step === 0 ? 1 : 0;
        default: return 0;
      }
    };
    const src = (node, V, r, extra = {}) => { const e = { t: 'S', a: node, b: 0, g: 1 / r, i: V / r }; elems.push(e); pinSrc.push({ e, V, ...extra }); };
    // EN wired straight to a GND pin: the chip is held in reset, so no GPIO pin drives anything
    const enLow = [...usedPins].some(([id, k]) => k.k === 'en' && [...usedPins].some(([id2, k2]) => k2.k === 'gnd' && find(nodeOfRef(id2)) === find(nodeOfRef(id))));
    if (powered) {
      for (const [id, k] of usedPins) {
        const node = nodeOf(id);
        if (k.k === '5v') src(node, 5, 0.2, { id, supply: true });
        else if (k.k === '3v3') src(node, 3.3, 0.3, { id, supply: true });
        else if (k.k === 'gnd') src(node, 0, 0.01, { id, supply: true });
        else if (k.k === 'en') src(node, 3.3, 10000, { id, pull: true });   // EN is pulled up to 3.3 V on the board (the EN button pulls it to GND)
        else if (k.k === 'gpio') {
          const cfg = pinCfg[id] || { mode: 'in' };
          if (!damaged.has(id) && !enLow) {
            if (OUTPUT_MODES.includes(cfg.mode)) { const lv = level(cfg); src(node, lv ? (k.vdd || 3.3) : 0, k.rout || 50, { id, gpioOut: true }); }
            else if (cfg.mode === 'up') src(node, k.vdd || 3.3, k.pull, { id, pull: true });
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
      else if (d.type === 'joystick') {
        const gn = nid(T(d, 'GND')), vn = nid(T(d, 'VCC')), jx = nid(T(d, 'VRX')), jy = nid(T(d, 'VRY')), sw = nid(T(d, 'SW')), J = (env.joy || {})[d.id] || { x: 0.5, y: 0.5 };
        if (!dead) {
          for (const [w, f] of [[jx, J.x], [jy, J.y]]) elems.push({ t: 'R', a: vn, b: w, g: 1 / Math.max(1, (1 - f) * 10000) }, { t: 'R', a: w, b: gn, g: 1 / Math.max(1, f * 10000) });
          if ((env.pressed || {})[d.id]) elems.push({ t: 'R', a: sw, b: gn, g: 20 });
        }
        pe[d.id] = { vn, gn, jx, jy, sw };
      }
      else if (d.type === 'encoder') {
        const gn = nid(T(d, 'GND')), clk = nid(T(d, 'CLK')), dt = nid(T(d, 'DT')), sw = nid(T(d, 'SW')), vn = nid(T(d, 'VCC')), ph = ((env.enc || {})[d.id] ?? 0) & 3;
        if (!dead) {
          if (ph === 1 || ph === 2) elems.push({ t: 'R', a: clk, b: gn, g: 20 });
          if (ph === 2 || ph === 3) elems.push({ t: 'R', a: dt, b: gn, g: 20 });
          if ((env.pressed || {})[d.id]) elems.push({ t: 'R', a: sw, b: gn, g: 20 });
        }
        pe[d.id] = { vn, gn, ph };
      }
      else if (d.type === 'dht') { const vn = nid(T(d, 'VCC')), gn = nid(T(d, 'GND')); if (!dead) elems.push({ t: 'R', a: vn, b: gn, g: 1 / 20000, load: true }); pe[d.id] = { vn, gn }; }
      else if (d.type === 'rgbled') {
        // three LED dice with one common leg: common cathode (d.ca falsy) = colour pins are the anodes, common anode = colour pins are the cathodes
        const C = nid(T(d, 'C')), dice = ['R', 'G', 'B'].map(k => { const lt = RGB_VF[k], Is = 0.02 / Math.exp(lt / NVT), pin = nid(T(d, k)), e = d.ca ? { t: 'D', a: C, b: pin, Is } : { t: 'D', a: pin, b: C, Is }; if (!dead) elems.push(e); return { a: e.a, b: e.b, Is }; });
        pe[d.id] = { dice };
      }
      else if (d.type === 'ldr') { const r = LDR_OHMS(env.lux), a = nodeOf(d.a), b = nodeOf(d.b); elems.push({ t: 'R', a, b, g: 1 / r }); pe[d.id] = { a, b, r }; }
      else if (d.type === 'button') { const down = !!(env.pressed || {})[d.id]; if (down) elems.push({ t: 'R', a: nid(T(d, 'e1')), b: nid(T(d, 'f1')), g: 20 }); pe[d.id] = { down }; }
      else if (d.type === 'pot') { const f = (env.pot || {})[d.id] ?? 0.5, r1 = Math.max(1, f * 10000), r2 = Math.max(1, (1 - f) * 10000); const A = nid(T(d, 'A')), W = nid(T(d, 'W')), B = nid(T(d, 'B')); elems.push({ t: 'R', a: A, b: W, g: 1 / r1 }, { t: 'R', a: W, b: B, g: 1 / r2 }); pe[d.id] = { W }; }
      else if (d.type === 'buzzer') pe[d.id] = { a: nodeOf(d.plus), b: nodeOf(d.minus) };
      else if (d.type === 'pir' || d.type === 'hcsr04' || d.type === 'servo') {
        const vn = nid(T(d, d.type === 'servo' ? 'V' : 'VCC')), gn = nid(T(d, 'GND'));
        const load = { pir: 100000, hcsr04: 330, servo: 100 }[d.type];
        if (!dead) elems.push({ t: 'R', a: vn, b: gn, g: 1 / load });
        if (d.type === 'pir' && !dead) elems.push({ t: 'M', out: nid(T(d, 'OUT')), vs: vn, gnd: gn, r: 100, fn: vs => (vs >= 4.5 && env.motion ? 3.3 : 0) });
        if (d.type === 'hcsr04' && !dead) elems.push({ t: 'M', out: nid(T(d, 'ECHO')), vs: vn, gnd: gn, r: 100, fn: vs => (vs >= 4.5 ? Math.min(vs, 5.5) : 0) });
        pe[d.id] = { vn, gn };
      }
      else if (d.type === 'sht31') {
        const vn = nid(T(d, 'VIN')), gn = nid(T(d, 'GND'));
        if (!dead) elems.push({ t: 'R', a: vn, b: gn, g: 1 / 3300 }, { t: 'R', a: nid(T(d, 'SDA')), b: vn, g: 1 / 10000 }, { t: 'R', a: nid(T(d, 'SCL')), b: vn, g: 1 / 10000 });   // power LED; 10 kOhm pull-ups on the breakout
        pe[d.id] = { vn, gn };
      }
      else if (d.type === 'l293d') {
        const N_ = k => nid(T(d, 'p' + k)), gnd = N_(4), vcc1 = N_(16), vcc2 = N_(8);
        pe[d.id] = { H: [] };
        if (!dead) {
          elems.push({ t: 'R', a: vcc1, b: gnd, g: 1 / 300, load: true });
          for (const [en, a, y] of [[1, 2, 3], [1, 7, 6], [9, 10, 11], [9, 15, 14]]) { const e = { t: 'H', y: N_(y), a: N_(a), en: N_(en), gnd, vcc1, vcc2 }; elems.push(e); pe[d.id].H.push(e); }
        }
        Object.assign(pe[d.id], { gnd, vcc1, vcc2, en1: N_(1), en2: N_(9) });
      }
      else if (d.type === 'motor') { const a = nid(T(d, 'M1')), b = nid(T(d, 'M2')); if (!dead) elems.push({ t: 'R', a, b, g: 1 / 6 }); pe[d.id] = { a, b }; }
      else if (d.type === 'battery') { const a = nid(T(d, 'POS')), b = nid(T(d, 'NEG')); if (!dead) elems.push({ t: 'S', a, b, g: 1 / 0.6, i: 6 / 0.6 }); pe[d.id] = { a, b, S: elems[elems.length - 1] }; }
      else if (d.type === 'lamp') { const a = nid(T(d, 'L1')), b = nid(T(d, 'L2')); if (!dead) elems.push({ t: 'R', a, b, g: 1 / 20 }); pe[d.id] = { a, b }; }
      else if (d.type === 'relay') {
        const dcp = nid(T(d, 'DCP')), dcn = nid(T(d, 'DCN')), inn = nid(T(d, 'IN')), com = nid(T(d, 'COM')), no = nid(T(d, 'NO')), nc = nid(T(d, 'NC'));
        elems.push({ t: 'R', a: dcp, b: dcn, g: 1 / 100 }, { t: 'R', a: dcp, b: inn, g: 1 / 1000 });   // coil + LED, optocoupler path (simulation values)
        const contact = { t: 'R', a: com, b: nc, g: 20 }; elems.push(contact);
        pe[d.id] = { dcp, dcn, inn, contact, no, nc };
      }
      else if (d.type === 'tmp36') { const vs = nid(T(d, 'VS')), out = nid(T(d, 'OUT')), g = nid(T(d, 'GND')); elems.push({ t: 'R', a: vs, b: g, g: 1 / 66000 }, { t: 'T', vs, out, gnd: g }); pe[d.id] = { vs, out, g }; }
    }
    const reach = list => {
      const adj = new Map(); const link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
      for (const e of list) { if (e.t === 'R' || e.t === 'D') link(e.a, e.b); else if (e.t === 'S') link(e.a, e.b); else if (e.t === 'T' || e.t === 'M') { link(e.out, e.gnd); link(e.vs, e.gnd); } }
      const seen = new Set([0]), q = [0]; while (q.length) { const x = q.pop(); for (const y of adj.get(x) || []) if (!seen.has(y)) { seen.add(y); q.push(y); } }
      return seen;
    };
    { const seen0 = reach(elems.filter(e => !e.load)); for (const e of elems) if (e.t === 'H') e.grounded = seen0.has(e.gnd); }
    let { v } = solveDC(n, elems, env.tempC ?? 25);
    // relay modules: the coil state follows the voltages (low-level trigger); then the contacts switch and the circuit is solved again
    let flipped = false;
    for (const d of parts) if (d.type === 'relay' && pe[d.id]) {
      const q = pe[d.id], sup = v[q.dcp] - v[q.dcn], dv = v[q.dcp] - v[q.inn];
      q.sup = sup; q.dv = dv; q.on = sup >= 4 && dv >= 2.5 && !burnt.has(d.id);
      if (q.on) { q.contact.b = q.no; flipped = true; }
    }
    if (flipped) ({ v } = solveDC(n, elems, env.tempC ?? 25));
    lastV = v;
    for (const d of parts) { const q = pe[d.id]; if (!q) continue;
      if (d.type === 'relay') { acc(d.id, 'on', q.on ? 1 : 0); acc(d.id, 'sup', q.sup); acc(d.id, 'dv', q.dv); }
      else if (d.type === 'lamp') { const V = v[q.a] - v[q.b]; acc(d.id, 'V', V); acc(d.id, 'Vmax', V, 'max'); }
      else if (d.type === 'motor') { const V = v[q.a] - v[q.b]; acc(d.id, 'V', V); }
      else if (d.type === 'l293d') {
        acc(d.id, 'v1', v[q.vcc1] - v[q.gnd]); acc(d.id, 'v2', v[q.vcc2] - v[q.gnd]); acc(d.id, 'en1', v[q.en1] - v[q.gnd]); acc(d.id, 'en2', v[q.en2] - v[q.gnd]);
        acc(d.id, 'grounded', q.H.length && q.H[0].grounded ? 1 : 0);
        let mx = 0; for (const e of q.H) if (e.on) mx = Math.max(mx, Math.abs((e.target - (v[e.y] - v[e.gnd])) * e.g)); acc(d.id, 'Imax', mx, 'max');
        acc(d.id, 'on', q.H.some(e => e.on) ? 1 : 0);
      }
      else if (d.type === 'battery') { const V = v[q.a] - v[q.b]; acc(d.id, 'V', V); acc(d.id, 'Imax', Math.abs(q.S.i - q.S.g * V), 'max'); }
    }
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
      else if (d.type === 'rgbled') { q.dice.forEach((e, i) => { const V = v[e.a] - v[e.b], I = burnt.has(d.id) ? 0 : e.Is * (Math.exp(Math.min(V, 6) / NVT) - 1); acc(d.id, 'V' + i, V); acc(d.id, 'I' + i, I); acc(d.id, 'Imax' + i, I, 'max'); }); }
      else if (d.type === 'buzzer') { const V = v[q.a] - v[q.b]; acc(d.id, 'Vmax', V, 'max'); acc(d.id, 'Vmin', V, 'min'); acc(d.id, 'V', V); }
      else if (d.type === 'pot') acc(d.id, 'Vw', v[q.W]);
      else if (d.type === 'pir' || d.type === 'hcsr04' || d.type === 'servo' || d.type === 'sht31' || d.type === 'dht') acc(d.id, 'Vs', v[q.vn] - v[q.gn]);
      else if (d.type === 'joystick') { acc(d.id, 'Vs', v[q.vn] - v[q.gn]); acc(d.id, 'Vx', v[q.jx] - v[q.gn]); acc(d.id, 'Vy', v[q.jy] - v[q.gn]); }
      else if (d.type === 'encoder') acc(d.id, 'Vs', v[q.vn] - v[q.gn]);
      else if (d.type === 'tmp36') { acc(d.id, 'Vs', v[q.vs] - v[q.g]); acc(d.id, 'Vout', v[q.out] - v[q.g]); }
    }
    if (step === N - 1) {   // floating nets: no conducting path to any source
      const extra = elems.filter(e => e.t === 'H' && e.on).map(e => ({ t: 'R', a: e.y, b: e.gnd, g: 1 }));
      const seen = reach([...elems, ...extra]);
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

  const netPins = new Map();
  for (const [id, k] of usedPins) if (k.k === 'gpio') { const key = find(nodeOfRef(id)); (netPins.get(key) || netPins.set(key, []).get(key)).push(id); }
  const supplyNets = new Set([...usedPins].filter(([, k]) => ['gnd', '5v', '3v3'].includes(k.k)).map(([id]) => find(nodeOfRef(id))));
  const resAdj = new Map();
  for (const d of parts) if (d.type === 'resistor' && !burnt.has(d.id)) { const x = find(T(d, 'a')), y = find(T(d, 'b')); (resAdj.get(x) || resAdj.set(x, []).get(x)).push(y); (resAdj.get(y) || resAdj.set(y, []).get(y)).push(x); }
  /** board pins reached from a module pin directly or through series resistors (for example a voltage divider) */
  const gpioOn = (d, name) => {
    const start = find(T(d, name)), seen = new Set([start]), q = [start], out = [];
    while (q.length) { const x = q.pop(); for (const id of netPins.get(x) || []) out.push(id); for (const y of resAdj.get(x) || []) if (!seen.has(y) && !supplyNets.has(y)) { seen.add(y); q.push(y); } }
    return out;
  };
  const modeOf = id => (pinCfg[id] || {}).mode || 'in';
  const INPUT_MODES = ['in', 'up', 'down', 'analog'];
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
    } else if (d.type === 'joystick') {
      const vs = s.Vs ?? 0, J = (env.joy || {})[d.id] || { x: 0.5, y: 0.5 }, rx = gpioOn(d, 'VRX'), ry = gpioOn(d, 'VRY'), sw = gpioOn(d, 'SW'), pressed = !!(env.pressed || {})[d.id];
      let bad = null;
      if (!powered) R.status = 'off';
      else if (vs < -0.5) { R.status = 'bad'; R.msg = 'Connected backwards.'; note('bad', `${label} is connected backwards (VCC and GND swapped).`, d.id); }
      else if (vs < 1) { R.status = 'off'; R.msg = 'No supply'; note('bad', `${label} has no supply: connect VCC to ${boardKind === 'uno3' ? '5V (or 3.3V)' : '3V3'} and GND to GND.`, d.id); }
      else if (!rx.length || !ry.length) bad = `${!rx.length ? 'VRx' : 'VRy'} is not connected to a board pin`;
      else if (boardKind === 'pi4') bad = 'the Raspberry Pi has no analog inputs, so it cannot read VRx and VRy (it needs an extra ADC chip)';
      else if ([...rx, ...ry].some(id => !usedPins.get(id).analog)) bad = 'VRx and VRy must go to analog (ADC) pins';
      else if (![...rx, ...ry].every(id => modeOf(id) === 'analog')) bad = 'set the pins on VRx and VRy to “Analog input (ADC)”';
      if (powered && vs >= 1) {
        if (bad) { R.status = 'warn'; R.msg = bad[0].toUpperCase() + bad.slice(1) + '.'; note('bad', `${label}: ${bad}.`, d.id); }
        else {
          R.msg = `Stick at X ${Math.round(J.x * 100)} %, Y ${Math.round(J.y * 100)} %: VRx ${(s.Vx ?? 0).toFixed(2)} V, VRy ${(s.Vy ?? 0).toFixed(2)} V${pressed ? ', pressed' : ''}.`;
          note('ok', `${label}: ${R.msg}`, d.id);
          if (sw.length && !sw.some(id => modeOf(id) === 'up')) note('warn', `${label}: SW closes to GND when the stick is pressed, so its pin needs the internal pull-up (set it to “Input with pull-up”), otherwise it floats.`, d.id);
        }
      }
    } else if (d.type === 'encoder') {
      const vs = s.Vs ?? 0, ph = ((env.enc || {})[d.id] ?? 0) & 3, clk = gpioOn(d, 'CLK'), dtp = gpioOn(d, 'DT'), sw = gpioOn(d, 'SW'), pressed = !!(env.pressed || {})[d.id];
      let bad = null;
      if (!clk.length || !dtp.length) bad = `${!clk.length ? 'CLK' : 'DT'} is not connected to a board pin`;
      else if (![...clk, ...dtp, ...sw].every(id => ['up', 'in', 'down'].includes(modeOf(id)))) bad = 'the CLK, DT and SW pins must be inputs';
      else if (![...clk, ...dtp, ...sw].every(id => modeOf(id) === 'up')) bad = 'set CLK, DT and SW to “Input with pull-up” (the contacts only connect to GND; the module’s own pull-up resistors, if any, are not relied on)';
      const clkLow = ph === 1 || ph === 2, dtLow = ph === 2 || ph === 3;
      R.msg = `Pattern CLK ${clkLow ? 'LOW' : 'HIGH'}, DT ${dtLow ? 'LOW' : 'HIGH'}${pressed ? ', SW pressed' : ''}.`;
      if (powered) {
        if (bad) { R.status = 'warn'; R.msg = bad[0].toUpperCase() + bad.slice(1) + '.'; note('bad', `${label}: ${bad}.`, d.id); }
        else note('ok', `${label}: ${R.msg} Turn the knob: the two signals change one after the other, and the order tells the direction.`, d.id);
        if (vs > 3.6 && boardKind !== 'uno3') note('warn', `${label}: + is at ${vs.toFixed(1)} V. If your module has pull-up resistors to +, they pull CLK, DT and SW up to that voltage, too high for a 3.3 V pin. Use 3.3 V.`, d.id);
      } else R.status = 'off';
    } else if (d.type === 'dht') {
      const vs = s.Vs ?? 0, data = gpioOn(d, 'DATA'), is11 = (d.model || 'dht11') === 'dht11', nm = is11 ? 'DHT11' : 'DHT22';
      const vcc = find(T(d, 'VCC')), dn = find(T(d, 'DATA'));
      const pull = parts.find(p => p.type === 'resistor' && !burnt.has(p.id) && ((find(T(p, 'a')) === dn && find(T(p, 'b')) === vcc) || (find(T(p, 'b')) === dn && find(T(p, 'a')) === vcc)));
      let bad = null;
      if (!powered) R.status = 'off';
      else if (vs < -0.5) { R.status = 'bad'; R.msg = 'Connected backwards.'; note('bad', `${label} is connected backwards (VCC and GND swapped). A real sensor can be destroyed this way.`, d.id); }
      else if (vs < 3) { R.status = 'off'; R.msg = `Only ${Math.max(0, vs).toFixed(1)} V`; note('bad', `${label} gets only ${Math.max(0, vs).toFixed(1)} V, but the ${nm} needs 3 V to 5 V: connect VCC to the 3.3 V (or 5 V) pin and GND to GND.`, d.id); }
      else if (!data.length) bad = 'DATA is not connected to a board pin';
      else if (!pull) bad = 'there is no pull-up resistor between DATA and VCC (10 kΩ in the Adafruit Arduino example, 1 – 5 kΩ in the CircuitPython documentation), so the line cannot go high and no reading arrives';
      else if (pull.ohms < 1000 || pull.ohms > 22000) bad = `the pull-up resistor is ${fmtOhms(pull.ohms)}: use about 1 kΩ to 10 kΩ between DATA and VCC`;
      else if (!data.some(id => modeOf(id) === 'dht')) bad = 'the pin on DATA is not set to “Single-wire data (DHT)”';
      if (powered && vs >= 3) {
        if (bad) { R.status = 'warn'; R.msg = bad[0].toUpperCase() + bad.slice(1) + '.'; note('bad', `${label}: ${bad}.`, d.id); }
        else {
          const t = env.tempC ?? 25, h = env.hum ?? 45, lim = is11 ? { t0: 0, t1: 50, h0: 20, h1: 80 } : { t0: -40, t1: 80, h0: 0, h1: 100 };
          R.msg = `Reads ${t.toFixed(1)} °C and ${h.toFixed(0)} %RH.`;
          for (const id of data) (result.pins[id] ||= { I: 0, Imax: 0, V: 0 }).dht = `${nm}: ${t.toFixed(1)} °C, ${h.toFixed(0)} %RH`;
          if (t < lim.t0 || t > lim.t1 || h < lim.h0 || h > lim.h1) { R.status = 'warn'; note('warn', `${label}: ${t.toFixed(1)} °C / ${h.toFixed(0)} %RH is outside what the ${nm} is specified for (${lim.t0} – ${lim.t1} °C, ${lim.h0} – ${lim.h1} %RH): the reading is not reliable.`, d.id); }
          else note('ok', `${label} reads ${t.toFixed(1)} °C and ${h.toFixed(0)} %RH (at most one reading every ${is11 ? '1 s' : '2 s'}).`, d.id);
        }
      }
    } else if (d.type === 'rgbled') {
      const names = ['red', 'green', 'blue'], I = [0, 1, 2].map(i => s['I' + i] ?? 0), Ipk = [0, 1, 2].map(i => s['Imax' + i] ?? 0), V = [0, 1, 2].map(i => s['V' + i] ?? 0);
      R.levels = I.map(x => Math.pow(Math.min(1, Math.max(0, x / 0.015)), 0.6));
      const dn = ['R', 'G', 'B', 'C'].filter(t => dangling(d, t));
      if (burnt.has(d.id)) { R.status = 'bad'; R.levels = [0, 0, 0]; R.msg = 'Burnt out.'; note('bad', burnWhy[d.id] || `${label} is burnt out (too much current earlier). Delete it and place a new one.`, d.id); }
      else if (Ipk.some(x => x > 0.030)) { const k = Ipk.findIndex(x => x > 0.030); R.levels = [1, 1, 1]; R.status = 'bad'; R.msg = 'Burnt out'; burn(d.id, `${label} burns out! About ${(Ipk[k] * 1000).toFixed(0)} mA flowed through its ${names[k]} die (rated about 20 mA). Every colour needs its own series resistor.`); }
      else if (I.some(x => x > 0.0008)) {
        const lit = names.map((n, i) => (I[i] > 0.0008 ? `${n} ${(I[i] * 1000).toFixed(1)} mA` : null)).filter(Boolean);
        R.msg = `Lit: ${lit.join(', ')}.`;
        const r = R.levels[0], g = R.levels[1], b = R.levels[2];
        const colour = Math.max(r, g, b) < 0.02 ? '' : (() => { const m = Math.max(r, g, b), n = [r, g, b].map(x => x / m); const on = n.map(x => x > 0.35); const nm = { '100': 'red', '010': 'green', '001': 'blue', '110': 'yellow', '011': 'cyan', '101': 'magenta', '111': 'white' }[on.map(x => (x ? 1 : 0)).join('')]; return nm ? ` The colours mix to ${nm}${on.filter(Boolean).length > 1 ? '' : ''}.` : ''; })();
        if (Ipk.some(x => x > 0.021)) { R.status = 'warn'; note('warn', `${label}: ${(Math.max(...Ipk) * 1000).toFixed(0)} mA is above the usual 20 mA rating of one colour. Use a larger resistor.`, d.id); }
        else note('ok', `${label} lights: ${lit.join(', ')}.${colour}`, d.id);
      } else if (!powered) { R.status = 'off'; R.msg = 'Off: no power.'; }
      else {
        R.status = 'off'; let why;
        if (dn.length) why = `${dn.map(t => (t === 'C' ? 'the common leg' : 'the ' + { R: 'red', G: 'green', B: 'blue' }[t] + ' leg')).join(' and ')} ${dn.length > 1 ? 'are' : 'is'} not connected to anything`;
        else if (V.some(x => x < -0.5)) why = d.ca ? 'with a common-anode LED the common leg must go to the supply (3.3 V or 5 V) and a colour pin must be driven LOW; the voltage here is the wrong way round' : 'with a common-cathode LED the common leg must go to GND and a colour pin must be driven HIGH; the voltage here is the wrong way round. (Is it a common-anode LED? Choose “common anode” and place it again.)';
        else if (V.every(x => Math.abs(x) <= 0.3)) why = 'there is no voltage across any colour: the circuit is not complete (check the common leg, the resistors and that a colour pin is set to Output HIGH, or LOW for a common anode)';
        else why = 'almost no current flows. On a 3.3 V pin the green and blue dice (about 3 V) get hardly any: use a small resistor, or drive them from 5 V';
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
    } else if (d.type === 'thermo' || d.type === 'pixels') {
      const bus = find(nodeOfRef('QWIIC')), on = find(T(d, 'QA')) === bus, dangling2 = !on;
      const same = parts.filter(p => p.type === d.type && find(T(p, 'QA')) === bus), thermo = parts.find(p => p.type === 'thermo' && find(T(p, 'QA')) === bus);
      R.onBus = on && powered;
      if (!powered) R.status = 'off';
      else if (dangling2) { R.status = 'off'; R.msg = 'Not on the Qwiic bus.'; note('bad', `${label} gets no power and no data: it is not joined to the board's Qwiic port by a Qwiic cable (directly or through another module).`, d.id); }
      else if (same.length > 1) { R.status = 'warn'; R.msg = 'Address clash.'; note('bad', `${label}: two ${d.type === 'thermo' ? 'Thermo' : 'Pixels'} modules on one bus answer at the same address (${d.type === 'thermo' ? '0x45' : '0x6C'}), so the board cannot tell them apart. Use only one of each (or change an address in software).`, d.id); }
      else if (d.type === 'thermo') { R.msg = `Answers at 0x45: ${(env.tempC ?? 25).toFixed(1)} °C, ${(env.hum ?? 45).toFixed(0)} %RH.`; note('ok', `${label}: ${R.msg}`, d.id); }
      else {
        if (thermo) { const t = env.tempC ?? 25, n = Math.max(0, Math.min(8, Math.floor((t - 15) / 2))); R.colors = Array.from({ length: 8 }, (_, i) => (i < n ? (i < 2 ? [20, 80, 255, 1] : i < 5 ? [20, 220, 60, 1] : [255, 40, 20, 1]) : [0, 0, 0, 0])); R.msg = `Answers at 0x6C. Example sketch: thermometer bar, ${n} of 8 LEDs (1 LED per 2 °C above 15 °C).`; note('ok', `${label}: ${R.msg}`, d.id); }
        else { R.msg = 'Answers at 0x6C, nothing to show (no Thermo on the bus).'; note('info', `${label} is on the bus, but there is no sensor to show: the example sketch draws the Thermo temperature as a bar. Add a Modulino Thermo.`, d.id); }
      }
    } else if (d.type === 'motor') {
      const V = s.V ?? 0, sp = Math.max(-1, Math.min(1, V / 3.4)); R.speed = Math.abs(V) < 0.6 ? 0 : sp;
      const dn = dangling(d, 'M1') || dangling(d, 'M2');
      if (burnt.has(d.id)) { R.status = 'bad'; R.msg = 'Burnt out.'; }
      else if (!powered) R.status = 'off';
      else if (dn) { R.status = 'warn'; R.msg = 'A motor wire is not connected.'; note('bad', `${label}: one of the two motor wires is not connected, so no current can flow.`, d.id); }
      else if (R.speed) { R.msg = `${V > 0 ? 'Direction 1' : 'Direction 2'}, ${Math.round(Math.abs(R.speed) * 100)} % (${Math.abs(V).toFixed(1)} V across the motor).`; note('ok', `${label} spins: ${R.msg}`, d.id); }
      else { R.status = 'off'; R.msg = 'Stopped: almost no voltage across the motor.'; note('info', `${label} is stopped (${Math.abs(V).toFixed(1)} V across it). Check the driver's enable and input pins, and the motor supply.`, d.id); }
    } else if (d.type === 'l293d') {
      const v1 = s.v1 ?? 0, v2 = s.v2 ?? 0, on = (s.on ?? 0) > 0.5, I = s.Imax ?? 0;
      if (burnt.has(d.id)) { R.status = 'bad'; R.msg = 'Burnt out.'; note('bad', burnWhy[d.id] || `${label} is burnt out. Delete it and place a new one.`, d.id); }
      else if (!powered) R.status = 'off';
      else if (I > 1.2) { R.status = 'bad'; burn(d.id, `${label} is destroyed: ${I.toFixed(1)} A flowed through one output, above its 1.2 A peak rating (0.6 A continuous). A stalled or too-big motor does this.`); }
      else if (!(s.grounded > 0.5)) { R.status = 'off'; R.msg = 'No common ground.'; note('bad', `${label}: its ground is not connected to the board's GND. Every supply and signal must share one ground: join the battery − and the driver's GND pins (4, 5, 12, 13) to a GND pin of the board.`, d.id); }
      else if (v1 < 4.5) { R.status = 'off'; R.msg = `Logic supply is ${Math.max(0, v1).toFixed(1)} V.`; note('bad', `${label}: pin 16 (VCC1, logic supply) has only ${Math.max(0, v1).toFixed(1)} V. It needs 4.5 V … 7 V: connect it to 5 V.`, d.id); }
      else if (!on) { R.status = 'warn'; R.msg = 'Outputs off.'; note('warn', `${label}: the outputs are off because the enable pin (pin 1 or 9) is not HIGH.`, d.id); }
      else {
        if (v2 < 2.5) { R.status = 'warn'; R.msg = `Motor supply (pin 8) only ${Math.max(0, v2).toFixed(1)} V.`; note('bad', `${label}: pin 8 (VCC2, motor supply) has only ${Math.max(0, v2).toFixed(1)} V: the motor gets no power. Connect it to the battery +.`, d.id); }
        else { R.msg = `Outputs on, motor supply ${v2.toFixed(1)} V.`; if (I > 0.6) { R.status = 'warn'; note('warn', `${label}: ${I.toFixed(2)} A in one output is above the 0.6 A continuous rating.`, d.id); } else note('ok', `${label}: outputs enabled, motor supply ${v2.toFixed(1)} V.`, d.id); }
      }
    } else if (d.type === 'battery') {
      R.msg = `${(s.V ?? 0).toFixed(1)} V`;
      if (powered || true) { if ((s.Imax ?? 0) > 2) { R.status = 'bad'; note('bad', `${label} is short-circuited: about ${(s.Imax).toFixed(0)} A would flow and the batteries would get very hot. Remove the wire that joins + and −.`, d.id); } }
    } else if (d.type === 'lamp') {
      const V = s.V ?? 0, Vm = s.Vmax ?? 0; R.level = Math.min(1, Math.max(0, (V * V / 20) / 1.8));
      if (burnt.has(d.id)) { R.status = 'bad'; R.level = 0; R.msg = 'Blown.'; note('bad', burnWhy[d.id] || `${label} is blown. Delete it and place a new one.`, d.id); }
      else if (Vm > 8) { R.status = 'bad'; burn(d.id, `${label} burns out: it is made for 6 V and got ${Vm.toFixed(1)} V.`); }
      else if (V > 1.5) { R.msg = `Lit: ${V.toFixed(1)} V across the filament.`; if (Math.abs(V) > 7) R.status = 'warn'; note('ok', `${label} lights (${V.toFixed(1)} V).`, d.id); }
      else if (V < -1.5) { R.msg = 'Polarity does not matter for a filament: it lights.'; R.level = Math.min(1, (V * V / 20) / 1.8); note('ok', `${label} lights (${Math.abs(V).toFixed(1)} V).`, d.id); }
      else { R.status = 'off'; R.msg = 'Dark: no voltage across it.'; }
    } else if (d.type === 'relay') {
      const on = (s.on ?? 0) > 0.5, sup = s.sup ?? 0, dv = s.dv ?? 0; R.on = on;
      if (!powered) R.status = 'off';
      else if (sup < -0.5) { R.status = 'bad'; R.msg = 'Connected backwards.'; note('bad', `${label} is connected backwards (DC+ and DC− swapped). A real module can be damaged.`, d.id); }
      else if (sup < 4) { R.status = 'off'; R.msg = `Only ${Math.max(0, sup).toFixed(1)} V on DC+.`; note('bad', `${label} gets only ${Math.max(0, sup).toFixed(1)} V between DC+ and DC−. The 5 V relay needs 5 V: connect DC+ to 5 V and DC− to GND.`, d.id); }
      else if (on) { R.msg = 'Coil energised: COM–NO closed (click).'; note('ok', `${label} is ON: the input is pulled LOW (${dv.toFixed(1)} V across the optocoupler), so COM connects to NO.`, d.id); }
      else {
        R.msg = 'Coil off: COM–NC closed.';
        if (dv >= 1.5) { R.status = 'warn'; note('warn', `${label}: ${dv.toFixed(1)} V across the optocoupler is not clearly “off” (3.3 V HIGH from a pin leaves the 5 V input partly on). Release the relay by setting the pin to an input instead.`, d.id); }
        else note('info', `${label} is OFF: COM–NC closed. This module is low-level triggered: the IN wire must be pulled LOW (pin set to Output LOW) to switch it on.`, d.id);
      }
    } else if (d.type === 'sht31') {
      const vs = s.Vs ?? 0, sda = gpioOn(d, 'SDA'), scl = gpioOn(d, 'SCL'), kind = id => usedPins.get(id) || {};
      const where = boardKind === 'pi4' ? 'SDA must go to GPIO2 (pin 3) and SCL to GPIO3 (pin 5)' : boardKind === 'uno3' ? 'SDA must go to A4 (or SDA) and SCL to A5 (or SCL)' : boardKind === 'esp32' ? 'SDA must go to GPIO21 and SCL to GPIO22 (the default I²C pins of the Arduino core)' : 'SDA must go to D20 (or A4) and SCL to D21 (or A5)';
      let bad = null;
      if (!powered) R.status = 'off';
      else if (vs < -0.5) { R.status = 'bad'; bad = 'it is connected backwards (VIN and GND swapped)'; }
      else if (vs < 2.5) { R.status = 'off'; bad = `it gets only ${Math.max(0, vs).toFixed(1)} V, and the SHT31-D needs 2.5 V … 5 V: connect VIN to 3.3 V`; }
      else if (!sda.length || !scl.length) bad = `${!sda.length ? 'SDA' : 'SCL'} is not connected to a board pin`;
      else if (sda.some(id => kind(id).i2c === 'scl') && scl.some(id => kind(id).i2c === 'sda')) bad = 'SDA and SCL are swapped: SDA (data) belongs on the data pin and SCL (clock) on the clock pin';
      else if (!sda.some(id => kind(id).i2c === 'sda') || !scl.some(id => kind(id).i2c === 'scl')) bad = `the wires are not on I²C pins: ${where}`;
      else if (kind(sda.find(id => kind(id).i2c === 'sda')).bus !== kind(scl.find(id => kind(id).i2c === 'scl')).bus) bad = 'SDA and SCL belong to two different I²C buses; use the pair of one bus';
      else if (![...sda, ...scl].every(id => modeOf(id) === 'i2c')) bad = 'the SDA/SCL pins are not set to the I²C bus function. Set both pins to “I²C bus”';
      if (bad) { if (R.status === 'ok') R.status = 'warn'; R.msg = bad[0].toUpperCase() + bad.slice(1) + '.'; if (powered) note('bad', `${label}: ${bad}.`, d.id); }
      else if (powered) {
        const t = env.tempC ?? 25, h = env.hum ?? 45; R.msg = `Found at address 0x44: ${t.toFixed(1)} °C, ${h.toFixed(0)} %RH.`;
        for (const id of [...sda, ...scl]) (result.pins[id] ||= { I: 0, Imax: 0, V: 0 }).i2c = `SHT31-D answers at 0x44`;
        note('ok', `${label}: ${R.msg}`, d.id);
        if (boardKind === 'pi4' && vs > 4) note('warn', `${label} runs from ${vs.toFixed(1)} V: its 10 kΩ pull-ups pull SDA/SCL up to that voltage. On a Raspberry Pi power VIN from 3.3 V (pin 1), not from 5 V.`, d.id);
      }
    } else if (d.type === 'pir' || d.type === 'hcsr04' || d.type === 'servo') {
      const vs = s.Vs ?? 0, dn = terminals(d).map(x => x[0]).filter(x => dangling(d, x));
      const needs = { pir: 'the PIR sensor needs 4.5 V … 20 V: connect VCC to 5 V', hcsr04: 'the HC-SR04 is made for 5 V: connect VCC to 5 V', servo: 'an SG90 servo needs 4.8 V … 6 V: connect the red wire (middle pin) to 5 V' }[d.type];
      if (!powered) R.status = 'off';
      else if (vs < -0.5) { R.status = 'bad'; R.msg = 'Connected backwards.'; note('bad', `${label} is connected backwards (supply and GND swapped). A real module can be destroyed this way.`, d.id); }
      else if (vs < 4.5) { R.status = 'off'; R.msg = `Only ${Math.max(0, vs).toFixed(1)} V`; note('bad', `${label} gets only ${Math.max(0, vs).toFixed(1)} V, but ${needs}.`, d.id); }
      else if (d.type === 'pir') {
        const out = gpioOn(d, 'OUT'); R.motion = !!env.motion;
        R.msg = env.motion ? 'Motion detected: OUT is HIGH (3.3 V).' : 'No motion: OUT is LOW.';
        if (!out.length) { R.status = 'warn'; note('warn', `${label}: OUT is not connected to a board pin, so no program can read it.`, d.id); }
        else if (out.some(id => !INPUT_MODES.includes(modeOf(id)))) { R.status = 'warn'; note('warn', `${label}: OUT is wired to a pin that is an output. Set that pin to an input.`, d.id); }
        else note('ok', `${label}: ${R.msg}`, d.id);
      } else if (d.type === 'hcsr04') {
        const trig = gpioOn(d, 'TRIG'), echo = gpioOn(d, 'ECHO'), cm = Math.min(400, Math.max(2, env.dist ?? 40)), us = Math.round(cm * 58);
        let bad = null;
        if (!trig.length) bad = 'TRIG is not connected to a board pin, so nothing starts a measurement';
        else if (!trig.some(id => modeOf(id) === 'pulse')) bad = 'TRIG is wired, but its pin does not send trigger pulses. Set that pin to “Trigger pulses”';
        else if (!echo.length) bad = 'ECHO is not connected to a board pin, so the result never arrives';
        else if (echo.some(id => !INPUT_MODES.includes(modeOf(id)))) bad = 'the pin on ECHO must be an input';
        if (bad) { R.status = 'warn'; R.msg = bad + '.'; note('bad', `${label}: ${bad}.`, d.id); }
        else { R.msg = `Echo pulse ${us} µs = ${cm.toFixed(0)} cm (58 µs per cm).`; for (const id of echo) (result.pins[id] ||= { I: 0, Imax: 0, V: 0 }).echo = { us, cm }; note('ok', `${label} measures ${cm.toFixed(0)} cm: the echo pulse lasts ${us} µs.`, d.id); }
      } else {
        const sig = gpioOn(d, 'SIG'), sp = sig.find(id => modeOf(id) === 'servo');
        if (!sig.length) { R.status = 'warn'; R.msg = 'Signal wire not connected.'; note('bad', `${label} does not move: its signal wire (orange, third pin) is not connected to a board pin.`, d.id); }
        else if (!sp) { R.status = 'warn'; R.msg = 'No servo pulses.'; note('bad', `${label} does not move: its signal wire needs 50 Hz pulses. Set the pin to “Servo angle”.`, d.id); }
        else { R.angle = (pinCfg[sp] || {}).angle ?? 90; R.msg = `Horn at ${Math.round(R.angle)}°.`; note('ok', `${label}: powered with ${vs.toFixed(1)} V and receiving pulses: the horn turns to ${Math.round(R.angle)}°.`, d.id); }
      }
      if (powered && dn.length && vs >= 4.5) { const v2 = R.status === 'ok' ? 'warn' : R.status; R.status = v2; note('warn', `${label}: pin ${dn.join(', ')} is not connected to anything.`, d.id); }
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
    if (k.k === 'en') {
      if (!powered) continue;
      const Ven = v[nodeOf(id)]; o.V = Ven;
      if (damaged.has(id)) { o.status = 'bad'; o.msg = 'Damaged (simulation).'; note('bad', `${k.name} is damaged: it was driven beyond its limits. Press “Replace broken parts”.`, id); continue; }
      if (Ven > 3.6) { newDamage.add(id); o.status = 'bad'; note('bad', `${k.name} sees ${Ven.toFixed(1)} V. The EN pin is a 3.3 V input: the board can be damaged. Never connect 5 V to it.`, id); }
      else if (Ven < 0.8) { o.status = 'warn'; o.msg = 'LOW: chip held in reset'; note('warn', `${k.name} is LOW (${Ven.toFixed(2)} V): the ESP32 is held in reset, so your program does not run and no pin is driven. This is what happens while you hold the EN button. Release EN (let it float to 3.3 V) to start the program.`, id); }
      else o.msg = 'HIGH: chip running';
      continue;
    }
    if (k.k !== 'gpio') { if (powered) o.V = v[nodeOf(id)]; continue; }
    const net = nodeOf(id), V = v[net];
    o.V = V; o.floating = powered && floating.has(net);
    if (damaged.has(id)) { o.status = 'bad'; o.msg = 'Damaged (simulation).'; note('bad', `${k.name} is damaged: it was driven beyond its limits. Press “Replace broken parts”.`, id); continue; }
    if (!powered) continue;
    const isOut = OUTPUT_MODES.includes(cfg.mode), mA = o.Imax * 1000;
    if (!isOut && cfg.mode === 'i2c') { o.read = undefined; if (!k.i2c) note('warn', `${k.name} cannot be an I²C pin on this board.`, id); }
    else if (!isOut) {
      o.read = o.floating ? 'floating' : V >= k.vih ? 1 : V <= k.vil ? 0 : 'undefined';
      if (cfg.mode === 'analog') o.adc = Math.round(Math.min(1, Math.max(0, V / (k.vref || 3.3))) * (k.adcMax || 1023));
    }
    if (V > (k.vmax || 3.6) && (k.v3 || isOut || boardKind === 'pi4' || boardKind === 'uno3' || boardKind === 'esp32')) { newDamage.add(id); o.status = 'bad'; note('bad', `${k.name} sees ${V.toFixed(1)} V. ${boardKind === 'esp32' ? 'ESP32 GPIO pins are 3.3 V only (3.6 V at most)' : boardKind === 'uno3' ? 'An ATmega328P pin must stay below 5.5 V (VCC + 0.5 V)' : boardKind === 'pi4' ? 'Raspberry Pi GPIO pins are 3.3 V only (not 5 V tolerant)' : k.v3 ? 'This pin tolerates at most 3.6 V' : 'An output pin must not be forced above 3.3 V'}: the board can be damaged. Never connect 5 V to it.`, id); }
    else if (isOut && mA > k.imax * 2) { newDamage.add(id); o.status = 'bad'; note('bad', `${k.name} has to deliver ${mA.toFixed(0)} mA, far above its ${k.limitText || k.imax + ' mA limit'}, and would be damaged (in this simulation: more than twice the limit damages the pin).`, id); }
    else if (isOut && mA > k.imax) { o.status = 'warn'; note('warn', `${k.name} delivers ${mA.toFixed(1)} mA, above the ${k.limitText || k.imax + ' mA limit'} of one pin. Use a larger resistor.`, id); }
    else if (isOut && mA > 0.1) o.msg = `${mA.toFixed(1)} mA`;
    if (!isOut && cfg.mode === 'in' && o.floating && !k.i2c) note('warn', `${k.name} is an input with nothing driving it (it “floats”) and reads random values. Use a pull-up or pull-down (set the pin to “Input with pull-up”), or connect it to 3.3 V or GND through a button.`, id);
    if (!isOut && cfg.mode === 'analog' && boardKind === 'pi4') note('warn', 'The Raspberry Pi has no analog inputs (no ADC). Analog sensors need an extra ADC chip.', id);
    if (!isOut && !isOut) { /* inputs: nothing else to check */ }
  }
  for (const [id, k] of usedPins) if (k.k === 'gpio' && OUTPUT_MODES.includes((pinCfg[id] || {}).mode)) {
    const net = nodeOf(id);
    for (const [id2, k2] of usedPins) if (id2 !== id && ['gnd', '5v', '3v3'].includes(k2.k) && nodeOf(id2) === net) note('bad', `${k.name} is an output wired straight to ${k2.name}: the pin fights the supply.`, id);
  }
  if (powered) for (const [id, k] of usedPins) if (k.k === 'gpio' && !(pinCfg[id] && pinCfg[id].mode) && !damaged.has(id)) note('info', `${k.name} is an input by default. Choose what the pin should do (Output HIGH, Blink, ...) in the Pins list.`, id);
  if (powered && parts.length && !notes.some(x => x.lvl === 'bad' || x.lvl === 'warn' || x.lvl === 'ok')) note('info', 'Nothing is wrong, but nothing is happening yet: add a part, wire it to a pin and give the pin a job.');
  // ---- wiring checklist: for every part, which board pin each leg should go to, and what it is connected to now
  {
    const pi = boardKind === 'pi4', u3 = boardKind === 'uno3', e32 = boardKind === 'esp32';
    const name = { '5v': pi ? '5V (pin 2 or 4)' : '5V', '3v3': pi ? '3V3 (pin 1 or 17)' : '3V3', gnd: pi ? 'GND (for example pin 6)' : 'GND', gpio: 'a signal pin' };
    const reachPins = (d, term) => {
      const start = find(T(d, term)), seen = new Set([start]), q = [start], out = [];
      while (q.length) {
        const x = q.pop(); let stop = false;
        for (const [id, k] of usedPins) if (find(nodeOfRef(id)) === x) { out.push(id); if (['5v', '3v3', 'gnd'].includes(k.k)) stop = true; }
        if (!stop) for (const y of resAdj.get(x) || []) if (!seen.has(y)) { seen.add(y); q.push(y); }
      }
      return out;
    };
    const item = (d, term, kinds, what, tip = '', okFn) => {
      const ids = reachPins(d, term), have = ids.map(id => usedPins.get(id).name);
      const good = ids.filter(id => kinds.includes(usedPins.get(id).k) && (!okFn || okFn(usedPins.get(id), id)));
      if (good.length && good.length === ids.length) return { ok: true, text: `${term}: ${what}` };
      if (ids.length) return { ok: false, text: `${term} is on ${have.join(', ')}, but it should go to ${what}${tip ? '. ' + tip : ''}.` };
      return { ok: false, text: `${term} is not connected to a board pin yet. It should go to ${what}${tip ? '. ' + tip : ''}.` };
    };
    const sig = pi ? 'a GPIO pin' : e32 ? 'a GPIO pin (for example GPIO16)' : 'a digital pin (for example D7)';
    const adcTxt = pi ? 'a GPIO pin' : e32 ? 'an ADC pin (for example GPIO34)' : 'an analog pin A0–A5';
    // ECHO behind a voltage divider: the divider's lower resistor ends on GND, so the net legitimately reaches GND as well as one GPIO pin
    const echoDivider = d => {
      const what = 'a GPIO pin through a 1 kΩ + 2.2 kΩ voltage divider', ids = reachPins(d, 'ECHO'), gp = ids.filter(id => usedPins.get(id).k === 'gpio');
      if (gp.length && ids.every(id => ['gpio', 'gnd'].includes(usedPins.get(id).k))) return { ok: true, text: `ECHO: ${what}` };
      const have = ids.map(id => usedPins.get(id).name);
      return { ok: false, text: ids.length ? `ECHO is on ${have.join(', ')}, but it should go to ${what}. Its 5 V echo would damage the pin directly.` : `ECHO is not connected to a board pin yet. It should go to ${what}. Its 5 V echo would damage the pin directly.` };
    };
    // DATA reaches its board pin and, through the pull-up resistor, the supply: both are correct
    const dhtData = d => {
      const what = (pi ? 'a GPIO pin' : 'a digital pin') + ' (plus the pull-up resistor to VCC)', ids = reachPins(d, 'DATA'), gp = ids.filter(id => usedPins.get(id).k === 'gpio');
      if (gp.length && ids.every(id => ['gpio', '3v3', '5v'].includes(usedPins.get(id).k))) return { ok: true, text: 'DATA: ' + what };
      return { ok: false, text: (ids.length ? 'DATA is on ' + ids.map(id => usedPins.get(id).name).join(', ') + ', but it should go to ' : 'DATA is not connected to a board pin yet. It should go to ') + what + '.' };
    };
    const SPEC = {
      led: d => [item(d, 'anode', ['gpio', '3v3', '5v'], pi ? 'a GPIO pin (through a resistor)' : 'a pin (through a resistor)'), item(d, 'cathode', ['gnd'], name.gnd)],
      buzzer: d => [item(d, 'plus', ['gpio'], sig), item(d, 'minus', ['gnd'], name.gnd)],
      pot: d => [item(d, 'A', ['3v3'], name['3v3'], 'The end legs are the supply; the middle leg is the output'), item(d, 'B', ['gnd'], name.gnd), item(d, 'W', ['gpio'], adcTxt, pi ? 'The Raspberry Pi has no analog inputs, so it can only read HIGH or LOW' : '', (k) => pi || k.analog)],
      tmp36: d => [item(d, 'VS', ['3v3', '5v'], name['3v3']), item(d, 'GND', ['gnd'], name.gnd), item(d, 'OUT', ['gpio'], adcTxt, pi ? 'The Raspberry Pi has no analog inputs' : '', (k) => pi || k.analog)],
      hcsr04: d => [item(d, 'VCC', ['5v'], name['5v'], 'The HC-SR04 is made for 5 V'), item(d, 'GND', ['gnd'], name.gnd), item(d, 'TRIG', ['gpio'], sig), (pi || e32 ? echoDivider(d) : item(d, 'ECHO', ['gpio'], pi || e32 ? 'a GPIO pin through a 1 kΩ + 2.2 kΩ voltage divider' : u3 ? 'a digital pin (for example D8)' : 'D8 (a 5 V-tolerant pin)', pi || e32 ? 'Its 5 V echo would damage the pin directly' : u3 ? '' : 'Not D3 or A0–A5: they are 3.3 V only', (k, id) => !pi && !e32 ? !k.v3 : true))],
      joystick: d => [item(d, 'GND', ['gnd'], name.gnd), item(d, 'VCC', ['3v3', '5v'], pi ? name['3v3'] : u3 ? '5V (or 3.3V)' : name['3v3'] + ': the analog pins of this board are 3.3 V only', 'The wipers go up to this voltage'), item(d, 'VRX', ['gpio'], adcTxt, pi ? 'The Raspberry Pi has no analog inputs' : '', k => pi || k.analog), item(d, 'VRY', ['gpio'], adcTxt, pi ? 'The Raspberry Pi has no analog inputs' : '', k => pi || k.analog), item(d, 'SW', ['gpio'], sig + ' (set to input with pull-up)')],
      encoder: d => [item(d, 'CLK', ['gpio'], sig + ' (input with pull-up)'), item(d, 'DT', ['gpio'], sig + ' (input with pull-up)'), item(d, 'SW', ['gpio'], sig + ' (input with pull-up)'), item(d, 'VCC', ['3v3', '5v'], pi ? name['3v3'] : u3 ? '5V (or 3.3V)' : name['3v3'], 'On a 3.3 V board use 3.3 V'), item(d, 'GND', ['gnd'], name.gnd)],
      dht: d => [item(d, 'VCC', ['3v3', '5v'], pi ? name['3v3'] + ': on a 3.3 V board power the sensor from 3.3 V' : u3 ? '5V (or 3.3V)' : name['3v3'] + ': on a 3.3 V board power the sensor from 3.3 V', 'The DATA pull-up goes to the same supply, so the DATA level is that voltage'), dhtData(d), item(d, 'GND', ['gnd'], name.gnd)],
      rgbled: d => [item(d, 'C', d.ca ? ['3v3', '5v'] : ['gnd'], d.ca ? 'the supply (common anode): 3.3 V or 5 V' : name.gnd + ' (common cathode)', d.ca ? 'This is a common-anode LED: the common leg goes to the supply' : 'The common leg is the longest one'), item(d, 'R', ['gpio'], sig + ' (through a resistor)'), item(d, 'G', ['gpio'], sig + ' (through a resistor)'), item(d, 'B', ['gpio'], sig + ' (through a resistor)')],
      pir: d => [item(d, 'VCC', ['5v'], name['5v']), item(d, 'GND', ['gnd'], name.gnd), item(d, 'OUT', ['gpio'], sig)],
      servo: d => [item(d, 'GND', ['gnd'], name.gnd + ' (brown wire, first pin)'), item(d, 'V', ['5v'], name['5v'] + ' (red wire, middle pin)'), item(d, 'SIG', ['gpio'], sig + ' (orange wire)')],
      sht31: d => [item(d, 'VIN', u3 ? ['3v3', '5v'] : ['3v3'], u3 ? '3.3V or 5V (the breakout accepts 2.5–5 V)' : name['3v3'], pi ? 'On a Raspberry Pi use 3.3 V, not 5 V' : ''), item(d, 'GND', ['gnd'], name.gnd), item(d, 'SCL', ['gpio'], pi ? 'GPIO3 (pin 5), the I²C clock' : e32 ? 'GPIO22, the I²C clock' : u3 ? 'A5 (or SCL), the I²C clock' : 'D21 (or A5), the I²C clock', '', k => k.i2c === 'scl'), item(d, 'SDA', ['gpio'], pi ? 'GPIO2 (pin 3), the I²C data' : e32 ? 'GPIO21, the I²C data' : u3 ? 'A4 (or SDA), the I²C data' : 'D20 (or A4), the I²C data', '', k => k.i2c === 'sda')],
      relay: d => [item(d, 'DCP', ['5v'], name['5v']), item(d, 'DCN', ['gnd'], name.gnd), item(d, 'IN', ['gpio'], sig, 'Pulling IN LOW switches it on')],
      l293d: d => [item(d, 'p16', ['5v'], name['5v'] + ' (pin 16, logic supply)'), item(d, 'p4', ['gnd'], name.gnd + ' (one of the GND pins 4, 5, 12, 13)'), item(d, 'p1', ['gpio'], sig + ' (pin 1, enable)'), item(d, 'p2', ['gpio'], sig + ' (pin 2, input 1)'), item(d, 'p7', ['gpio'], sig + ' (pin 7, input 2)')],
    };
    result.guides = {};
    for (const d of parts) if (SPEC[d.type]) result.guides[d.id] = { label: nameOf(d), items: SPEC[d.type](d) };
  }
  result.srcMax = srcMax;
  return result;
}

export function nameOf(d) {
  const nm = { thermo: 'Modulino Thermo', pixels: 'Modulino Pixels', l293d: 'L293D driver', motor: 'DC motor', relay: 'Relay module', battery: 'Battery pack (4 × AA)', lamp: 'Lamp 6 V', sht31: 'SHT31-D', joystick: 'Joystick module', encoder: 'Rotary encoder', dht: 'DHT sensor', rgbled: 'RGB LED', pir: 'PIR sensor', hcsr04: 'HC-SR04', servo: 'Servo SG90', resistor: 'Resistor', led: 'LED', button: 'Push button', pot: 'Potentiometer', buzzer: 'Buzzer', ldr: 'Light sensor', tmp36: 'TMP36', wire: 'Wire', fwire: 'Wire' }[d.type] || d.type;
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

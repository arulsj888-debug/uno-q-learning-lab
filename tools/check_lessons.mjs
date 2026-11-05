// Electrical + text audit of every lesson circuit.
//  - every wire end lands on a real header pin or breadboard hole
//  - no hole is used twice, no two different header signals are shorted together
//  - each I/O works electrically (LED path to GND with resistor, button pull-down to GND, pot 3V3/wiper/GND, buzzer)
//  - every "PIN → hole" / "hole → PIN" sentence in the step text matches a wire in the 3D circuit
//  - every hole label shown in a step is a leg of a part that is on the breadboard in that step
//  - header print (what is written on the 3D headers) matches the pin data
import { LESSONS } from '../src/data/lessons.js';
import { JDIGITAL, JANALOG, JSPI } from '../src/data/pins.js';

const PINS = new Set([...JDIGITAL.pins, ...JANALOG.pins, ...JSPI.pins].map(p => p.id));
const HOLE = /^([a-j])(\d{1,2})$/;
const isHole = r => HOLE.test(r);
const MOD = /^(\w+)\.(VCC|OUT|GND)$/;          // pin of an off-board module, e.g. pir1.OUT
const isMod = r => MOD.test(r);
const isWire = d => d.type === 'wire' || d.type === 'fwire';
const node = e => (isHole(e) ? colNet(e) : isMod(e) ? e : 'PIN:' + sigOf(e));
const sigOf = r => (/^GND\d?$|^SPI_GND$/.test(r) ? 'GND' : r);            // all GND pins are one net
const colNet = h => { const [, row, c] = HOLE.exec(h); return `col${c}${'abcde'.includes(row) ? 'top' : 'bot'}`; };
let problems = 0;
const bad = (L, msg) => { problems++; console.log(`✗ Lesson ${L.num}: ${msg}`); };

function legs(d) {
  switch (d.type) {
    case 'resistor': return { [d.id + '.1']: d.a, [d.id + '.2']: d.b };
    case 'led': return { [d.id + '.A']: d.anode, [d.id + '.K']: d.cathode };
    case 'button': return { [d.id + '.1']: `e${d.col}`, [d.id + '.2']: `f${d.col}`, [d.id + '.3']: `e${d.col + 2}`, [d.id + '.4']: `f${d.col + 2}` };
    case 'pot': return { [d.id + '.1']: `${d.row}${d.col}`, [d.id + '.W']: `${d.row}${d.col + 2}`, [d.id + '.3']: `${d.row}${d.col + 4}` };
    case 'buzzer': return { [d.id + '.+']: d.plus, [d.id + '.-']: d.minus };
    case 'ldr': return { [d.id + '.1']: d.a, [d.id + '.2']: d.b };
    case 'hcsr04': return { [d.id + '.VCC']: `${d.row}${d.col}`, [d.id + '.TRIG']: `${d.row}${d.col + 1}`, [d.id + '.ECHO']: `${d.row}${d.col + 2}`, [d.id + '.GND']: `${d.row}${d.col + 3}` };
    case 'servo': return { [d.id + '.GND']: `${d.row}${d.col}`, [d.id + '.VCC']: `${d.row}${d.col + 1}`, [d.id + '.SIG']: `${d.row}${d.col + 2}` };
    case 'tmp36': return { [d.id + '.VS']: `${d.row}${d.col}`, [d.id + '.VO']: `${d.row}${d.col + 1}`, [d.id + '.GND']: `${d.row}${d.col + 2}` };
    default: return {};
  }
}

function nets(defs, pressed = false) {
  const parent = {};
  const f = a => { parent[a] ??= a; while (parent[a] !== a) a = parent[a] = parent[parent[a]] ?? parent[a]; return a; };
  const u = (a, b) => { parent[f(a)] = f(b); };
  for (const d of defs) {
    if (isWire(d)) { u(node(d.from), node(d.to)); continue; }
    for (const [leg, h] of Object.entries(legs(d))) u(leg, colNet(h));
    if (d.type === 'button') { u(d.id + '.1', d.id + '.2'); u(d.id + '.3', d.id + '.4'); if (pressed) u(d.id + '.1', d.id + '.3'); }
  }
  return { same: (a, b) => f(a) === f(b), f };
}

for (const L of LESSONS) {
  if (!L.circuit) continue;
  const all = L.circuit;
  const byId = Object.fromEntries(all.map(d => [d.id, d]));
  // 1. endpoints exist, holes used once
  const used = {};
  for (const d of all) {
    const ends = isWire(d) ? [d.from, d.to] : Object.values(legs(d));
    for (const e of ends) {
      if (isHole(e)) { const [, , c] = HOLE.exec(e); if (+c < 1 || +c > 30) bad(L, `${d.id}: hole ${e} out of range`); (used[e] ??= []).push(d.id); }
      else if (isMod(e)) { const [, pid] = MOD.exec(e); if (!byId[pid] || byId[pid].type !== 'pir') bad(L, `${d.id}: unknown module pin ${e}`); }
      else if (!PINS.has(e)) bad(L, `${d.id}: unknown header pin ${e}`);
    }
  }
  for (const [h, ids] of Object.entries(used)) if (ids.length > 1) bad(L, `hole ${h} used twice (${ids.join(', ')})`);
  // header sockets may take only one wire each
  const sock = {};
  for (const d of all) if (isWire(d)) for (const e of [d.from, d.to]) if (!isHole(e) && !isMod(e)) (sock[e] ??= []).push(d.id);
  for (const [p, ids] of Object.entries(sock)) if (ids.length > 1) bad(L, `header socket ${p} has ${ids.length} wires`);
  // 2. no short between different header signals
  const N = nets(all), sigs = [...new Set(all.filter(isWire).flatMap(d => [d.from, d.to]).filter(e => !isHole(e) && !isMod(e)).map(sigOf))];
  for (let i = 0; i < sigs.length; i++) for (let j = i + 1; j < sigs.length; j++)
    if (N.same('PIN:' + sigs[i], 'PIN:' + sigs[j])) bad(L, `SHORT: ${sigs[i]} and ${sigs[j]} are connected together`);
  // 2b. 5 V signals must only reach 5 V-tolerant digital pins (UNO Q datasheet §9.6/9.7)
  for (const d of all.filter(x => x.type === 'hcsr04')) {
    for (const bad5 of ['D3', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', '3V3', 'IOREF', 'AREF'])
      if (N.same(d.id + '.ECHO', 'PIN:' + bad5)) bad(L, `5 V ECHO of ${d.id} reaches ${bad5}, which is not 5 V-tolerant`);
  }
  // 3. each I/O works
  for (const [pin, io] of Object.entries(L.io || {})) {
    for (const id of io.needs) if (!byId[id]) bad(L, `io ${pin} needs missing part ${id}`);
    const P = 'PIN:' + pin, G = 'PIN:GND';
    if (io.kind === 'led') {
      const r = all.find(d => d.type === 'resistor' && (N.same(d.id + '.1', P) || N.same(d.id + '.2', P)));
      if (!r) { bad(L, `${pin}: no resistor connected to the pin`); continue; }
      const far = N.same(r.id + '.1', P) ? r.id + '.2' : r.id + '.1';
      if (!N.same(far, io.item + '.A')) bad(L, `${pin}: resistor does not reach the LED anode`);
      if (!N.same(io.item + '.K', G)) bad(L, `${pin}: LED cathode is not on GND`);
      if (N.same(io.item + '.A', io.item + '.K')) bad(L, `${pin}: LED is shorted`);
      if (N.same(P, io.item + '.A')) bad(L, `${pin}: LED anode connects to the pin without the resistor`);
    }
    if (io.kind === 'button') {
      if (N.same(P, G)) bad(L, `${pin}: pin is on GND even when the button is NOT pressed`);
      if (!nets(all, true).same(P, G)) bad(L, `${pin}: pressing the button does not connect the pin to GND`);
    }
    if (io.kind === 'pot') {
      const id = io.item;
      if (!N.same(id + '.W', P)) bad(L, `${pin}: wiper is not on ${pin}`);
      const ends = [id + '.1', id + '.3'];
      if (!ends.some(e => N.same(e, 'PIN:3V3'))) bad(L, `${pin}: pot end not on 3V3`);
      if (ends.some(e => N.same(e, 'PIN:5V'))) bad(L, `${pin}: pot end on 5V (A0 is not 5 V-tolerant)`);
      if (!ends.some(e => N.same(e, G))) bad(L, `${pin}: pot end not on GND`);
    }
    if (io.kind === 'ldr') {
      const id = io.item, legs2 = [id + '.1', id + '.2'];
      if (!legs2.some(l => N.same(l, P))) bad(L, `${pin}: no LDR leg on ${pin}`);
      if (!legs2.some(l => N.same(l, 'PIN:3V3'))) bad(L, `${pin}: LDR not fed from 3V3`);
      if (legs2.some(l => N.same(l, 'PIN:5V'))) bad(L, `${pin}: LDR on 5V (A0 is not 5 V-tolerant)`);
      const r = all.find(d => d.type === 'resistor' && ((N.same(d.id + '.1', P) && N.same(d.id + '.2', G)) || (N.same(d.id + '.2', P) && N.same(d.id + '.1', G))));
      if (!r) bad(L, `${pin}: no fixed resistor from ${pin} to GND (voltage divider incomplete)`);
      else if (r.hw !== 'resistor10k') bad(L, `${pin}: divider resistor ${r.id} is not the 10 kΩ part`);
    }
    if (io.kind === 'tmp36') {
      const id = io.item;
      if (!N.same(id + '.VS', 'PIN:3V3')) bad(L, `${pin}: TMP36 +VS not on 3V3`);
      if (!N.same(id + '.VO', P)) bad(L, `${pin}: TMP36 VOUT not on ${pin}`);
      if (!N.same(id + '.GND', G)) bad(L, `${pin}: TMP36 GND not on GND`);
    }
    if (io.kind === 'hcsr04') {
      const id = io.item;
      if (!N.same(id + '.VCC', 'PIN:5V')) bad(L, `${pin}: HC-SR04 Vcc not on 5V (datasheet: 5 V supply)`);
      if (!N.same(id + '.GND', G)) bad(L, `${pin}: HC-SR04 Gnd not on GND`);
      if (!N.same(id + '.ECHO', P)) bad(L, `${pin}: HC-SR04 Echo not on ${pin}`);
      if (!N.same(id + '.TRIG', 'PIN:' + io.trig)) bad(L, `${pin}: HC-SR04 Trig not on ${io.trig}`);
    }
    if (io.kind === 'pir') {
      const id = io.item;
      if (!N.same(id + '.VCC', 'PIN:5V')) bad(L, `${pin}: PIR VCC not on 5V (datasheet: 5–20 V; 3.3 V is too low)`);
      if (!N.same(id + '.GND', G)) bad(L, `${pin}: PIR GND not on GND`);
      if (!N.same(id + '.OUT', P)) bad(L, `${pin}: PIR OUT not on ${pin}`);
    }
    if (io.kind === 'servo') {
      const id = io.item;
      if (!N.same(id + '.VCC', 'PIN:5V')) bad(L, `${pin}: servo + (red) not on 5V (SG90: 4.8 V)`);
      if (!N.same(id + '.GND', G)) bad(L, `${pin}: servo brown not on GND`);
      if (!N.same(id + '.SIG', P)) bad(L, `${pin}: servo signal not on ${pin}`);
    }
    if (io.kind === 'buzzer') {
      const r = all.find(d => d.type === 'resistor' && (N.same(d.id + '.1', P) || N.same(d.id + '.2', P)));
      if (!r) { bad(L, `${pin}: no series resistor`); continue; }
      const far = N.same(r.id + '.1', P) ? r.id + '.2' : r.id + '.1';
      if (!N.same(far, io.item + '.+')) bad(L, `${pin}: resistor does not reach buzzer +`);
      if (!N.same(io.item + '.-', G)) bad(L, `${pin}: buzzer − not on GND`);
    }
  }
  // 4. text claims
  const wires = all.filter(isWire);
  const hasWire = (a, b) => wires.some(w => [[w.from, w.to], [w.to, w.from]].some(([x, y]) => sigOf(x) === sigOf(a) && y === b));
  L.steps.forEach((S, k) => {
    const txt = S.body.replace(/<[^>]+>/g, '');
    for (const m of txt.matchAll(/\b(D\d{1,2}|A[0-5]|3V3|5V|VIN|GND)\b(?: on [A-Z]+)?\s*→\s*(?:hole\s+)?([a-j]\d{1,2})\b/g))
      if (!hasWire(m[1], m[2])) bad(L, `step ${k + 1}: text says "${m[1]} → ${m[2]}" but no such wire`);
    for (const m of txt.matchAll(/\b(?:hole\s+)?([a-j]\d{1,2})\s*→\s*(D\d{1,2}|A[0-5]|3V3|5V|VIN|GND)\b/g))
      if (!hasWire(m[2], m[1])) bad(L, `step ${k + 1}: text says "${m[1]} → ${m[2]}" but no such wire`);
    // hole labels must be legs of parts present in this step
    let have = []; for (let j = 0; j <= k; j++) if (L.steps[j].have) have = L.steps[j].have;
    const legHoles = {};
    for (const id of have) if (byId[id] && byId[id].type !== 'wire') for (const [leg, h] of Object.entries(legs(byId[id]))) legHoles[h] = leg;
    for (const lab of S.holes || []) {
      const h = lab.split(/\s/)[0];
      if (!legHoles[h]) bad(L, `step ${k + 1}: label ${lab} is not a leg of any part on the board`);
      if (/anode/.test(lab) && !/\.A$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled anode but is ${legHoles[h]}`);
      if (/cathode/.test(lab) && !/\.K$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled cathode but is ${legHoles[h]}`);
      if (/wiper/.test(lab) && !/\.W$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled wiper but is ${legHoles[h]}`);
      if (/·\s*\+(?!VS|5V)/.test(lab) && !/\.\+$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled + but is ${legHoles[h]}`);
      if (/·\s*−/.test(lab) && !/\.-$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled − but is ${legHoles[h]}`);
      if (/\+VS/.test(lab) && !/\.VS$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled +VS but is ${legHoles[h]}`);
      if (/VOUT/.test(lab) && !/\.VO$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled VOUT but is ${legHoles[h]}`);
      if (/·\s*VCC/.test(lab) && !/\.VCC$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled VCC but is ${legHoles[h]}`);
      if (/·\s*TRIG/.test(lab) && !/\.TRIG$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled TRIG but is ${legHoles[h]}`);
      if (/·\s*ECHO/.test(lab) && !/\.ECHO$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled ECHO but is ${legHoles[h]}`);
      if (/·\s*signal/.test(lab) && !/\.SIG$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled signal but is ${legHoles[h]}`);
      if (/·\s*\+5V/.test(lab) && !/\.VCC$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled +5V but is ${legHoles[h]}`);
      if (/·\s*GND/.test(lab) && !/\.GND$/.test(legHoles[h] || '')) bad(L, `step ${k + 1}: ${h} labelled GND but is ${legHoles[h]}`);
    }
    for (const p of S.pins || []) if (!PINS.has(p)) bad(L, `step ${k + 1}: marker for unknown pin ${p}`);
    for (const id of S.have || []) if (!byId[id]) bad(L, `step ${k + 1}: unknown part ${id}`);
  });
  console.log(`✓ Lesson ${L.num} circuit checked (${all.length} items)`);
}
console.log(problems ? `\n${problems} PROBLEM(S) FOUND` : '\nAll lesson circuits and texts are consistent.');
process.exit(problems ? 1 : 0);

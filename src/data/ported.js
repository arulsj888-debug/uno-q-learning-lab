// UNO Q versions of lessons that were first written for the UNO R3.
// The UNO Q uses the same header layout and breadboard circuits, but its pins are 3.3 V, its ADC is 14-bit (0 ... 16383) and its
// I²C bus (Wire) is on D20 / D21. Each lesson is copied and adapted with the explicit rules below; the sketches keep their line
// numbers (changes are made on the same line) so the simulator programs still match the listings.
import { U3_LESSONS } from '../uno3/lessons.js';

const ADC = [[/analogReadResolution\(14\);?/, '']];   // marker only (kept for documentation)

const CAV = '<p class="warn">UNO Q: this lesson is checked in the simulator. Whether this library is available and works on the UNO Q board (Zephyr core) is <b>not verified</b>: check the library page before you build it.</p>';

const NOT5 = /(?<!\+)\b5V\b/g;
const SUP = [[NOT5, '3V3']];
const LIM = [[/The ATmega328P datasheet allows 40 mA absolute maximum per pin \(20 mA recommended\)\./g, 'A microcontroller pin supplies only a few milliamps to a few tens of milliamps (see the UNO Q datasheet for its limit).']];
const I2C = [[/\bA4\b/g, 'D20'], [/\bA5\b/g, 'D21']];

// order = lesson order on the UNO Q
const CFG = [
  { from: 'u26', module: 9, rep: [[/HIGH \(5 V\)/g, 'HIGH (3.3 V)'], [/220 Ω/g, '100 Ω']], circuit: L => resistors(L, 100) },
  { from: 'u24', module: 9, rep: [...LIM, [/1 kΩ/g, '470 Ω']], circuit: L => { resistors(L, 470, 'r1'); L.qdefault = 470; } },
  { from: 'u25', module: 9, rep: [...LIM, [/the gate gets 5 V/g, 'the gate gets 3.3 V'], [/The UNO R3 pin gives <b>5 V<\/b>: the datasheet guarantees 25 mΩ at 5 V\./g, 'The UNO Q pin gives only <b>3.3 V</b>. The datasheet gives on-resistance values for 4 V and above, and none for 3.3 V: for a small lamp it works, for a big motor it is <b>not guaranteed</b>.']] },
  { from: 'u17', module: 9, rep: [[/so on 5 V the green and blue look a little dimmer than red/g, 'so on 3.3 V the green and blue look much dimmer than red (their forward voltage is close to 3.3 V)'], ...SUP] },
  { from: 'u19', module: 10, adc: true, rep: [[/5 V: the UNO R3 works at 5 V and its ADC reference is 5 V/g, '3.3 V: the UNO Q works at 3.3 V and its ADC reference is 3.3 V'], ...SUP, [/0 … 1023, about 512 at the centre/g, '0 … 16383, about 8192 at the centre'], [/0 … 1023/g, '0 … 16383'], [/\b1023\b/g, '16383'], [/2\.5 V/g, '1.65 V']], program: 'q_joy' },
  { from: 'u20', module: 10, rep: SUP },
  { from: 'u37', module: 10, rep: [] },
  { from: 'u21', module: 10, rep: I2C, warn: ['The code', CAV] },
  { from: 'u22', module: 10, rep: I2C, warn: ['The code', CAV] },
  { from: 'u18', module: 11, rep: [[/<p class="warn">On a 3\.3 V board[^]*?<\/p>/g, '<p class="warn">The UNO Q pins are 3.3 V: the sensor is powered from <b>3.3 V</b> so that the pulled-up DATA line never exceeds the 3.3 V of the pin.</p>'], ...SUP], warn: ['Install the library', '<p class="warn">Reports say the Adafruit DHT library can return NaN on the UNO Q (Zephyr core): <b>not verified here</b>. If your reading is NaN, check the library page.</p>'] },
  { from: 'u29', module: 11, rep: [[/The sensor works from 5 V here/g, 'The sensor works from 3.3 V here'], ...SUP], warn: ['Install the libraries', CAV] },
  { from: 'u33', module: 11, rep: I2C },
  { from: 'u31', module: 11, rep: I2C },
  { from: 'u34', module: 11, adc: true, rep: SUP, program: 'q_soil', code: [[/dryValue = 512;/, 'dryValue = 12412;'], [/wetValue = 205;/, 'wetValue = 4965;']] },
  { from: 'u35', module: 11, adc: true, rep: SUP, program: 'q_snd', code: [[/threshold = 40;/, 'threshold = 640;']] },
  { from: 'u30', module: 11, rep: SUP, warn: ['Install the library', CAV] },
  { from: 'u27', module: 12, rep: [] },
  { from: 'u32', module: 12, rep: [] },
  { from: 'u36', module: 13, adc: true, rep: SUP, program: 'q_plant', code: [[/dryValue = 512;/, 'dryValue = 12412;'], [/wetValue = 205;/, 'wetValue = 4965;']] },
  { from: 'u38', module: 13, rep: [] },
];
export const PORTED_MODULES = { 9: 'Module 9 — Components that switch', 10: 'Module 10 — Controls and displays', 11: 'Module 11 — More sensors', 12: 'Module 12 — Timing and motion', 13: 'Module 13 — Projects' };

function resistors(L, ohms, only) { for (const d of L.circuit || []) if (d.type === 'resistor' && (!only || d.id === only) && d.ohms !== 10000 && d.ohms !== 4700) d.ohms = ohms; }

function walk(o, f) {
  if (typeof o === 'string') return f(o);
  if (Array.isArray(o)) return o.map(x => walk(x, f));
  if (o && typeof o === 'object') { const r = {}; for (const k of Object.keys(o)) r[k] = walk(o[k], f); return r; }
  return o;
}

export function buildPorted(firstNum) {
  const out = [];
  CFG.forEach((c, i) => {
    const src = U3_LESSONS.find(l => l.id === c.from); if (!src) return;
    const rules = [...(c.rep || []), [/Arduino UNO R3/g, 'Arduino UNO Q'], [/UNO R3/g, 'UNO Q'], ...(c.i2c === false ? [] : [])];
    const f = s => { for (const [re, to] of rules) s = s.replace(re, to); return s; };
    let L = walk(JSON.parse(JSON.stringify(src)), f);
    if ((c.rep || []).includes(I2C[0])) {}
    // io keys follow the pin renames
    if (c.rep === I2C) { const io = {}; for (const k of Object.keys(L.io || {})) io[k === 'A4' ? 'D20' : k === 'A5' ? 'D21' : k] = L.io[k]; L.io = io; }
    if (c.adc && typeof L.code === 'string') L.code = L.code.replace(/Serial\.begin\(9600\);/, 'Serial.begin(9600); analogReadResolution(14);');
    if (c.code) for (const [re, to] of c.code) L.code = L.code.replace(re, to);
    if (c.circuit) c.circuit(L);
    if (c.program) L.program = c.program;
    if (c.warn) { const st = (L.steps || []).find(s => s.title && s.title.includes(c.warn[0])); if (st) st.body += c.warn[1]; }
    L.id = 'q' + (firstNum + i); L.num = firstNum + i; L.module = c.module; L.ported = c.from;
    out.push(L);
  });
  return out;
}

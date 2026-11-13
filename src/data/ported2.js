// UNO Q versions of the UNO R3 lessons 40-59 (src/uno3/lessons3.js). Same header layout and breadboard circuits, but: 3.3 V pins, 14-bit ADC,
// I²C (Wire) on D20/D21, SPI on D10 to D13, the hardware UART Serial1 on D0/D1 (these pin facts are in src/data/pins.js). The interrupt, TimerOne and
// EEPROM lessons are not ported: their UNO Q equivalents are not verified. Library support on the UNO Q (Zephyr core) is NOT verified for any of them.
import { U3_LESSONS_3 } from '../uno3/lessons3.js';

const CAV = '<p class="warn">UNO Q: this lesson is checked in the simulator. Whether this library is available and works on the UNO Q board (Zephyr core) is <b>not verified</b>: check the library page before you build it.</p>';
const NOT5 = /(?<!\+)\b5V\b/g;
const V5 = /\b5 V\b/g;

function walk(o, f) {
  if (typeof o === 'string') return f(o);
  if (Array.isArray(o)) return o.map(x => walk(x, f));
  if (o && typeof o === 'object') { const r = {}; for (const k of Object.keys(o)) r[k] = walk(o[k], f); return r; }
  return o;
}
const part = (L, id) => L.circuit.find(d => d.id === id);
const setEnd = (L, id, field, val) => { part(L, id)[field] = val; };
const drop = (L, ids) => { L.circuit = L.circuit.filter(d => !ids.includes(d.id)); for (const io of Object.values(L.io)) io.needs = io.needs.filter(i => !ids.includes(i)); L.steps.forEach(s => { if (s.have) s.have = s.have.filter(i => !ids.includes(i)); }); };
const addParts = (L, parts, fromStep = 2) => { L.circuit.push(...parts); for (const io of Object.values(L.io)) io.needs = [...io.needs, ...parts.map(p => p.id)]; L.steps.forEach((st, i) => { if (i >= fromStep && st.have && st.have.includes('gs1')) st.have = [...st.have, ...parts.map(p => p.id)]; }); };
const renamePins = (L, map) => { const io = {}; for (const [k, v] of Object.entries(L.io)) io[map[k] || k] = v; L.io = io; L.steps.forEach(s => { if (s.pins) s.pins = s.pins.map(p => map[p] || p); }); };
const fixPins = (L, a, b) => L.steps.forEach(s => { if (s.pins) s.pins = s.pins.map(p => (p === a ? b : p)); });
const pwTo = (L, a, b) => { for (const io of Object.values(L.io)) if (io.pw) io.pw = io.pw.map(([m, n]) => [m, n === a ? b : n]); };
const body = (L, i, html) => { L.steps[i].body = html; };
const code = (L, pairs) => { for (const [a, b] of pairs) { if (!L.code.includes(a)) throw new Error('ported2 code: ' + L.id + ' missing ' + a); L.code = L.code.split(a).join(b); } };
const ADC = ['Serial.begin(9600);', 'Serial.begin(9600); analogReadResolution(14);'];

// order = lesson order on the UNO Q
const CFG = [
  { from: 'u40', module: 14, rep: [[/the pin gives 5 V/, 'the pin gives 3.3 V'], [/Active buzzer \(5 V type\)/, 'Active buzzer (3.3 V or 5 V type: check your part)'], [/A pin should supply about 20 mA at most \(the ATmega328P datasheet gives 40 mA as the absolute maximum\)\./, 'A pin supplies only a few milliamps to a few tens of milliamps (see the UNO Q datasheet for its limit), and some 5 V buzzers are quiet or silent at 3.3 V.']] },
  { from: 'u41', module: 14, adc: true, rep: [[/the pin is at 5 V/, 'the pin is at 3.3 V'], [/reading × 5 ÷ 1023/, 'reading × 3.3 ÷ 16383 (14 bit)'], [/must be above the 5 V used here/, 'must be above the 3.3 V used here'], [/near 3\.2 V after 1 s \(63 % of 5 V\)/, 'near 2.1 V after 1 s (63 % of 3.3 V)']], code: [ADC, ['* 5.0 / 1023.0', '* 3.3 / 16383.0']] },
  { from: 'u42', module: 14, rep: [[V5, '3.3 V'], [/<b>5V<\/b>/g, '<b>3V3</b>']], fix: L => { setEnd(L, 'w3', 'from', '3V3'); fixPins(L, '5V', '3V3'); } },
  { from: 'u43', module: 14, rep: [[/220 Ω/g, '100 Ω'], [/COM goes to 5 V and the segment pins go LOW to light/, 'COM goes to the supply and the segment pins go LOW to light'], [/With a 5 V pin and 100 Ω a segment gets about \(5 − 2\.1\) ÷ 220 ≈ 13 mA\./, 'With a 3.3 V pin and 100 Ω a segment gets about (3.3 − 2.1) ÷ 100 ≈ 12 mA (the datasheet allows 20 mA continuous).']], fix: L => L.circuit.forEach(d => { if (d.type === 'resistor') d.ohms = 100; }) },
  { from: 'u47', module: 15, rep: [[/Supply 4\.0 to 5\.5 V \(datasheet\)\./, 'Supply 4.0 to 5.5 V (datasheet). The UNO Q pins give 3.3 V, below the datasheet minimum HIGH level of 3.5 V at a 5 V supply: it often works but is <b>not guaranteed</b>; use a level shifter for a reliable build.']], warn: ['The code', CAV] },
  { from: 'u48', module: 15, rep: [[/<p class="warn">The ST7735 chip itself[^]*?<\/p>/, '<p class="warn">The ST7735 chip itself is a 3.3 V part, which suits the UNO Q pins: power it from <b>3V3</b>. Pin order and names differ between modules; read the printing on yours. Many modules tie the backlight pin BL to VCC already; if the screen stays dark, connect BL to 3V3.</p>'], [/<b>GND → GND<\/b>, <b>VCC → 5V<\/b>/, '<b>GND → GND</b>, <b>VCC → 3V3</b>'], [/<li><b>BL → 3V3<\/b> \(backlight\)<\/li>/, '<li>BL (backlight): not connected here</li>'], [/Which two UNO Q pins/, 'Which two UNO Q pins'], [/A4 and A5/, 'D20 and D21']],
    fix: L => { drop(L, ['f8']); setEnd(L, 'f2', 'to', '3V3'); pwTo(L, '5V', '3V3'); L.steps.forEach(s => { if (s.pins) s.pins = s.pins.filter((p, i, a) => !(p === '3V3' && a.indexOf(p) !== i)).map(p => p); }); fixPins(L, '5V', '3V3'); }, warn: ['The code', CAV] },
  { from: 'u49', module: 15, rep: [[/The UNO Q drives the SPI lines at 5 V, but the chip is a 3\.3 V part\. Many tutorials connect them directly, which is outside what the datasheet promises: a level shifter \(or resistor dividers\) is the safe choice\./, 'The UNO Q SPI pins give 3.3 V, which matches the 3.3 V chip: no level shifter is needed.']], warn: ['The code', CAV] },
  { from: 'u50', module: 15, rep: [[/far bigger than the EEPROM/, 'far bigger than the variables in RAM'], [/Modules with a regulator and level shifters accept 5 V logic; a bare socket does not\. Check yours\./, 'The UNO Q pins give 3.3 V: a module with a regulator and level shifters is fine; power a bare socket from 3V3. Check yours.']], warn: ['The code', CAV] },
  { from: 'u51', module: 16, adc: true, code: [ADC, ['alarmLevel = 450;', 'alarmLevel = 7200;'], ['doPin = 2;', 'doPin = 8;']], program: 'q3_gas',
    rep: [[/The raw level, 0 to 1023\./, 'The raw level, 0 to 16383 (14 bit).'], [/<li>It needs <b>5 V<\/b> for the heater and gets hot: do not touch the metal mesh\.<\/li>/, '<li>It needs <b>5 V</b> for the heater and gets hot: do not touch the metal mesh.</li><li>Its AO output can rise towards 5 V, but the <b>analog pins of the UNO Q are not 5 V tolerant</b>: a divider of <b>10 kΩ</b> and <b>20 kΩ</b> reduces it to 2/3 before A0. DO goes to pin 8, a 5 V-tolerant digital input (UNO Q datasheet).</li>'], [/<b>AO → A0<\/b>, <b>DO → pin 2<\/b>/, '<b>AO → a12</b>, <b>DO → pin 8</b>; the 10 kΩ resistor from column 12 to column 16, the 20 kΩ resistor from column 16 to column 17, <b>A0 → b16</b>, <b>GND → b17</b>']],
    fix: L => { setEnd(L, 'f3', 'to', 'D8'); setEnd(L, 'f4', 'to', 'a12'); addParts(L, [{ id: 'ra', type: 'resistor', a: 'c12', b: 'c16', ohms: 10000 }, { id: 'rb', type: 'resistor', a: 'd16', b: 'd17', ohms: 20000 }, { id: 'wa1', type: 'wire', from: 'A0', to: 'b16', color: 'yellow', lift: 14 }, { id: 'wa2', type: 'wire', from: 'GND3', to: 'b17', color: 'black', lift: 14 }]); renamePins(L, { D2: 'D8' }); L.io.A0.div = 2 / 3; L.io.A0.mp = ''; L.steps[2].pins = ['5V', 'GND2', 'A0', 'D8', 'GND3']; }, warn: ['The code', CAV] },
  { from: 'u52', module: 16, adc: true, code: [ADC], rep: [[/<b>VCC → 5V<\/b>/, '<b>VCC → 3V3</b>'], [/<li>The LED is wired as in Lesson 4, on pin 5\.<\/li>/, '<li>The LED is wired as in Lesson 4, on pin 5. The module runs from 3.3 V (the LM393 comparator works from about 3 V), so its outputs stay within the 3.3 V of the pins.</li>']], program: 'q3_flame', fix: L => { setEnd(L, 'f1', 'to', '3V3'); pwTo(L, '5V', '3V3'); fixPins(L, '5V', '3V3'); L.io.A0.vs = 3.3; }, warn: ['The code', CAV] },
  { from: 'u53', module: 16, rep: [[/through SoftwareSerial/, 'on the hardware UART Serial1'], [/<li><b>VCC → 5V<\/b>, <b>GND → GND<\/b><\/li><li><b>TX → pin 4<\/b> \(the Arduino receives here\), <b>RX → pin 3<\/b><\/li>/, '<li><b>VCC → 3V3</b>, <b>GND → GND</b></li><li><b>TX → pin 0</b> (the board receives here: Serial1 RX), <b>RX → pin 1</b> (Serial1 TX)</li>'], [/SoftwareSerial is a built-in library; install TinyGPSPlus/, 'Serial1 is the hardware UART on pins 0 and 1 (UNO Q pinout); install TinyGPSPlus'], [/Cross TX and RX; use SoftwareSerial to keep the USB serial free\./, 'Cross TX and RX; Serial1 keeps the USB serial free.'], [/An Arduino receive pin\|An Arduino transmit pin/, 'A board receive pin|A board transmit pin'], [/Click lines <b>4<\/b>, <b>13<\/b> and <b>14<\/b>/, 'Click lines <b>4</b>, <b>13</b> and <b>14</b>']],
    code: [['#include <SoftwareSerial.h>', '// Serial1: hardware UART on D0 (RX) and D1 (TX)'], ['SoftwareSerial gpsSerial(4, 3);    // Arduino RX = pin 4 (from the module TX), TX = pin 3', '#define gpsSerial Serial1          // RX = D0 (from the module TX), TX = D1']],
    fix: L => { setEnd(L, 'f1', 'to', '3V3'); setEnd(L, 'f3', 'to', 'D0'); setEnd(L, 'f4', 'to', 'D1'); renamePins(L, { D4: 'D0', D3: 'D1' }); pwTo(L, '5V', '3V3'); fixPins(L, '5V', '3V3'); }, warn: ['The code', CAV] },
  { from: 'u54', module: 16, rep: [[/VCC → 5V/, 'VCC → 3V3'], [/<b>SDA → A4<\/b>, <b>SCL → A5<\/b> \(the I²C pins of the UNO Q\)/, '<b>SDA → D20</b>, <b>SCL → D21</b> (the I²C pins of the UNO Q)'], [/A4 and A5\|/, 'D20 and D21|'], [/SDA is A4, SCL is A5\./, 'SDA is D20, SCL is D21.']],
    fix: L => { setEnd(L, 'f1', 'to', '3V3'); setEnd(L, 'f3', 'to', 'D20'); setEnd(L, 'f4', 'to', 'D21'); renamePins(L, { A4: 'D20', A5: 'D21' }); pwTo(L, '5V', '3V3'); fixPins(L, '5V', '3V3'); L.steps.forEach(s => { if (s.body) s.body = s.body.replace(/Wire is on A4/g, 'Wire is on D20'); }); }, warn: ['The code', CAV] },
  { from: 'u55', module: 17, rep: [[/<b>VDD → 5V<\/b>/, '<b>VDD → 3V3</b>']], fix: L => { setEnd(L, 'f5', 'to', '3V3'); pwTo(L, '5V', '3V3'); fixPins(L, '5V', '3V3'); } },
  { from: 'u56', module: 17, rep: [[/the datasheet gives its on-resistance at 4 V and 5 V gate voltage, so a 5 V pin drives it fully\./, 'the datasheet gives its on-resistance at 4 V and 5 V gate voltage and <b>none at 3.3 V</b>: the UNO Q pin gives only 3.3 V, so a small motor works but a big one is <b>not guaranteed</b>.'], [/<code>analogWrite\(\)<\/code> makes a 490 Hz PWM signal on pin 9 \(UNO Q\)\./, '<code>analogWrite()</code> makes a PWM signal on pin 9 (500 Hz on the UNO Q, per its manual).']], warn: ['The code', CAV] },
  { from: 'u57', module: 17, rep: [[/Two 5 V boards \(like two UNO Q\) can be connected directly\. A 3\.3 V board needs a level shifter on its RX pin\./, 'The UNO Q pins are 3.3 V: connect it directly to another 3.3 V board. A 5 V board’s TX can only go to a 5 V-tolerant input (see the UNO Q datasheet), otherwise use a level shifter.'], [/The UNO Q has one hardware UART on pins 0 and 1, shared with the USB connection\. <b>SoftwareSerial<\/b> makes another port on any pins; the Arduino reference lists its limits, for example that only one software port can receive at a time\./, 'The UNO Q has a hardware UART, <b>Serial1</b>, on pins 0 (RX) and 1 (TX); it is separate from the USB serial, so the monitor stays free.'], [/<li>SoftwareSerial gives extra ports; the hardware port on pins 0\/1 is also used by USB\.<\/li>/, '<li>Serial1 is a hardware UART on pins 0 and 1.</li>'], [/Board B <b>TX → pin 10<\/b> \(our receive pin\)/, 'Board B <b>TX → pin 0</b> (our receive pin)'], [/Board B <b>RX → pin 11<\/b> \(our transmit pin\)/, 'Board B <b>RX → pin 1</b> (our transmit pin)'], [/Click lines <b>3<\/b>, <b>12<\/b> and <b>18<\/b>/, 'Click lines <b>3</b>, <b>12</b> and <b>18</b>']],
    code: [['#include <SoftwareSerial.h>', '// Serial1: hardware UART on D0 (RX) and D1 (TX)'], ['SoftwareSerial link(10, 11);    // RX = pin 10, TX = pin 11', '#define link Serial1            // RX = D0, TX = D1']],
    fix: L => { setEnd(L, 'f1', 'to', 'D0'); setEnd(L, 'f2', 'to', 'D1'); renamePins(L, { D10: 'D0', D11: 'D1' }); L.quiz = L.quiz.map(q => (q.q.startsWith('Why not use pins 0 and 1') ? { q: 'Which hardware UART does the UNO Q offer on pins 0 and 1?', a: ['Serial1', 'Serial (USB)', 'SoftwareSerial', 'None'], c: 0, why: 'Pin data of the UNO Q: D0 is Serial1 RX, D1 is Serial1 TX.' } : q)); }, warn: ['The code', CAV] },
  { from: 'u58', module: 17, rep: [[/use SoftwareSerial on pins 10\/11/, 'use Serial1 on pins 0 and 1'], [/<li>The RXD input needs a divider from 5 V logic\.<\/li>/, '<li>The UNO Q pins give 3.3 V: the RXD input needs no divider.</li>']],
    code: [['#include <SoftwareSerial.h>', '// Serial1: hardware UART on D0 (RX) and D1 (TX)'], ['SoftwareSerial bt(10, 11);      // RX = pin 10 (module TXD), TX = pin 11 (module RXD)', '#define bt Serial1                // RX = D0 (module TXD), TX = D1 (module RXD)']],
    fix: L => {
      drop(L, ['ra', 'rb', 'wa', 'wb']); setEnd(L, 'f3', 'to', 'D0'); setEnd(L, 'f4', 'to', 'D1'); renamePins(L, { D10: 'D0', D11: 'D1' }); L.io.D1.mp = 'hc1.RXD';
      body(L, 1, '<p>The HC-05’s <b>RXD</b> input is a 3.3 V input, and the UNO Q pin gives <b>3.3 V</b>: they connect directly, with no divider. The other direction is fine too: the module’s TXD HIGH of 3.3 V is read as HIGH by the UNO Q pin (check the input levels in the UNO Q datasheet). The module’s own supply is usually 3.6 to 6 V, so it takes the 5V pin; read the sheet of your module.</p>');
      body(L, 2, '<ul><li><b>VCC → 5V</b>, <b>GND → GND</b></li><li><b>TXD → pin 0</b> (Serial1 RX), <b>RXD → pin 1</b> (Serial1 TX)</li><li>The LED is wired as in Lesson 4, on pin 5.</li></ul>');
      L.steps[1].have = ['hc1']; L.steps[1].title = 'Voltage levels'; L.steps[2].pins = ['5V', 'GND1', 'D0', 'D1'];
      L.quiz = L.quiz.map(q => (q.q.startsWith('Why is a voltage divider') ? { q: 'Does the UNO Q need a voltage divider on the HC-05 RXD?', a: ['No: the UNO Q pin gives 3.3 V, like the module input', 'Yes, always', 'Only at night', 'Only with SoftwareSerial'], c: 0, why: 'The module input is a 3.3 V input.' } : q));
      L.hardware = L.hardware.filter(h => !/divider/.test(h)); }, warn: ['The code', CAV] },
  { from: 'u59', module: 17, rep: [[/The data inputs tolerate 5 V, so the UNO Q can drive them\./, 'The UNO Q pins give 3.3 V, which matches the module.']], warn: ['The code', CAV] },
];

export const PORTED2_MODULES = { 14: 'Module 14 — Buzzers, capacitors, switches, displays', 15: 'Module 15 — SPI devices', 16: 'Module 16 — Environment, position and time', 17: 'Module 17 — Motors and serial links' };

export function buildPorted2(firstNum) {
  const out = [];
  CFG.forEach((c, i) => {
    const src = U3_LESSONS_3.find(l => l.id === c.from); if (!src) return;
    const rules = [[/Arduino UNO R3/g, 'Arduino UNO Q'], [/UNO R3/g, 'UNO Q'], ...(c.rep || [])];
    const f = s => { for (const [re, to] of rules) s = s.replace(re, to); return s; };
    const L = walk(JSON.parse(JSON.stringify(src)), f);
    if (c.code) code(L, c.code);
    if (c.fix) c.fix(L);
    L.program = c.program || 'q3_' + src.program.slice(3);
    if (c.warn) { const st = L.steps.find(s => s.title && s.title.includes(c.warn[0])); if (st) st.body += c.warn[1]; }
    L.id = 'q' + (firstNum + i); L.num = firstNum + i; L.module = c.module; L.ported = c.from;
    out.push(L);
  });
  return out;
}

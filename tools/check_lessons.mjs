// Electrical + text audit of every lesson circuit.
//  - every wire end lands on a real header pin or breadboard hole
//  - no hole is used twice, no two different header signals are shorted together
//  - each I/O works electrically (LED path to GND with resistor, button pull-down to GND, pot 3V3/wiper/GND, buzzer)
//  - every "PIN → hole" / "hole → PIN" sentence in the step text matches a wire in the 3D circuit
//  - every hole label shown in a step is a leg of a part that is on the breadboard in that step
//  - header print (what is written on the 3D headers) matches the pin data
import { LESSONS } from '../src/data/lessons.js';
import { PI_LESSONS } from '../src/pi4/lessons.js';
import { U3_LESSONS } from '../src/uno3/lessons.js';
import { U3_PINS } from '../src/uno3/data.js';
import { E32_LESSONS } from '../src/esp32/lessons.js';
import { E32_PINS } from '../src/esp32/data.js';
import { JDIGITAL, JANALOG, JSPI } from '../src/data/pins.js';

const UQ_PINS = new Set([...JDIGITAL.pins, ...JANALOG.pins, ...JSPI.pins].map(p => p.id));
// Raspberry Pi 4 J8: physical pins p1..p40; power/ground per the datasheet pinout (Figure 3)
const PI_PINS = new Set(Array.from({ length: 40 }, (_, i) => 'p' + (i + 1)));
const PI_SIG = { p1: '3V3', p17: '3V3', p2: '5V', p4: '5V', p6: 'GND', p9: 'GND', p14: 'GND', p20: 'GND', p25: 'GND', p30: 'GND', p34: 'GND', p39: 'GND' };
const U3_SET = new Set(U3_PINS.map(p => p.id));
const E32_SET = new Set(E32_PINS.map(p => p.id));
let PINS = UQ_PINS, PI = false, U3 = false, E32 = false, SUP = '3V3';    // SUP = the supply pin the analog sensors are fed from
PINS.add('QWIIC');                                         // the UNO Q Qwiic connector (I2C4 / Wire1)
const HOLE = /^([a-j])(\d{1,2})$/;
const isHole = r => HOLE.test(r);
const MOD = /^(\w+)\.(VCC|OUT|GND|POS|NEG|M1|M2|DCP|DCN|IN|NO|COM|NC|L1|L2|QA|QB|SDA|SCL|DIN|IN1|IN2|IN3|IN4|AOUT)$/;          // pin of an off-board module, e.g. pir1.OUT
const isMod = r => MOD.test(r);
const isWire = d => d.type === 'wire' || d.type === 'fwire' || d.type === 'lead' || d.type === 'qwiic';
const node = e => (isHole(e) ? colNet(e) : isMod(e) ? e : 'PIN:' + sigOf(e));
const sigOf = r => (PI ? (PI_SIG[r] || r) : (/^GND\d?$|^SPI_GND$/.test(r) ? 'GND' : r));            // all GND pins are one net
const colNet = h => { const [, row, c] = HOLE.exec(h); return `col${c}${'abcde'.includes(row) ? 'top' : 'bot'}`; };
let problems = 0;
const bad = (L, msg) => { problems++; console.log(`✗ ${PI ? 'Pi 4 ' : U3 ? 'UNO R3 ' : E32 ? 'ESP32 ' : ''}Lesson ${L.num}: ${msg}`); };

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
    case 'l293d': { const o = {}; for (let i = 1; i <= 8; i++) { o[`${d.id}.p${i}`] = `f${d.col + i - 1}`; o[`${d.id}.p${17 - i}`] = `e${d.col + i - 1}`; } return o; }
    case 'sht31': return { [d.id + '.VIN']: `${d.row}${d.col}`, [d.id + '.GND']: `${d.row}${d.col + 1}`, [d.id + '.SCL']: `${d.row}${d.col + 2}`, [d.id + '.SDA']: `${d.row}${d.col + 3}`, [d.id + '.ADDR']: `${d.row}${d.col + 4}`, [d.id + '.RST']: `${d.row}${d.col + 5}`, [d.id + '.ALRT']: `${d.row}${d.col + 6}` };
    case 'joystick': return { [d.id + '.GND']: `${d.row}${d.col}`, [d.id + '.VCC']: `${d.row}${d.col + 1}`, [d.id + '.VRX']: `${d.row}${d.col + 2}`, [d.id + '.VRY']: `${d.row}${d.col + 3}`, [d.id + '.SW']: `${d.row}${d.col + 4}` };
    case 'encoder': return { [d.id + '.CLK']: `${d.row}${d.col}`, [d.id + '.DT']: `${d.row}${d.col + 1}`, [d.id + '.SW']: `${d.row}${d.col + 2}`, [d.id + '.VCC']: `${d.row}${d.col + 3}`, [d.id + '.GND']: `${d.row}${d.col + 4}` };
    case 'diode': return { [d.id + '.A']: d.a, [d.id + '.K']: d.k };
    case 'ds18b20': return { [d.id + '.GND']: `${d.row}${d.col}`, [d.id + '.DQ']: `${d.row}${d.col + 1}`, [d.id + '.VDD']: `${d.row}${d.col + 2}` };
    case 'irrx': return { [d.id + '.OUT']: `${d.row}${d.col}`, [d.id + '.GND']: `${d.row}${d.col + 1}`, [d.id + '.VS']: `${d.row}${d.col + 2}` };
    case 'mosfet': return { [d.id + '.G']: `${d.row}${d.col}`, [d.id + '.D']: `${d.row}${d.col + 1}`, [d.id + '.S']: `${d.row}${d.col + 2}` };
    case 'npn': return { [d.id + '.E']: `${d.row}${d.col}`, [d.id + '.B']: `${d.row}${d.col + 1}`, [d.id + '.C']: `${d.row}${d.col + 2}` };
    case 'rgbled': return { [d.id + '.R']: `${d.row}${d.col}`, [d.id + '.C']: `${d.row}${d.col + 1}`, [d.id + '.G']: `${d.row}${d.col + 2}`, [d.id + '.B']: `${d.row}${d.col + 3}` };
    case 'dht': return { [d.id + '.VCC']: `${d.row}${d.col}`, [d.id + '.DATA']: `${d.row}${d.col + 1}`, [d.id + '.NC']: `${d.row}${d.col + 2}`, [d.id + '.GND']: `${d.row}${d.col + 3}` };
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
    if (d.type === 'l293d') { for (const k of [5, 12, 13]) u(d.id + '.p4', d.id + '.p' + k); }   // TI block diagram: pins 4, 5, 12, 13 = one ground
    if (d.type === 'thermo' || d.type === 'pixels') u(d.id + '.QA', d.id + '.QB');   // datasheet: the two Qwiic connectors are wired in parallel
    if (d.type === 'relay') u(d.id + '.COM', d.id + (pressed ? '.NO' : '.NC'));   // contact position: energised (pressed) = COM–NO
    if (d.type === 'button') { u(d.id + '.1', d.id + '.2'); u(d.id + '.3', d.id + '.4'); if (pressed) u(d.id + '.1', d.id + '.3'); }
  }
  return { same: (a, b) => f(a) === f(b), f };
}

for (const [boardName, list] of [['UNO Q', LESSONS], ['Pi 4', PI_LESSONS], ['UNO R3', U3_LESSONS], ['ESP32', E32_LESSONS]]) {
PI = boardName === 'Pi 4'; U3 = boardName === 'UNO R3'; E32 = boardName === 'ESP32'; SUP = U3 ? '5V' : '3V3'; PINS = PI ? PI_PINS : U3 ? U3_SET : E32 ? E32_SET : UQ_PINS;
for (const L of list) {
  if (!L.circuit) continue;
  const all = L.circuit;
  const byId = Object.fromEntries(all.map(d => [d.id, d]));
  // 1. endpoints exist, holes used once
  const used = {};
  for (const d of all) {
    const ends = isWire(d) ? [d.from, d.to] : Object.values(legs(d));
    for (const e of ends) {
      if (isHole(e)) { const [, , c] = HOLE.exec(e); if (+c < 1 || +c > 30) bad(L, `${d.id}: hole ${e} out of range`); (used[e] ??= []).push(d.id); }
      else if (isMod(e)) { const [, pid] = MOD.exec(e); if (!byId[pid] || !['pir', 'battery', 'motor', 'relay', 'lamp', 'thermo', 'pixels', 'lcd1602', 'oled', 'neopixel', 'mpu6050', 'bmp280', 'soil', 'stepper'].includes(byId[pid].type)) bad(L, `${d.id}: unknown module pin ${e}`); }
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
  for (const d of U3 ? [] : all.filter(x => x.type === 'hcsr04')) {
    for (const bad5 of ['D3', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', '3V3', 'IOREF', 'AREF'])
      if (N.same(d.id + '.ECHO', 'PIN:' + bad5)) bad(L, `5 V ECHO of ${d.id} reaches ${bad5}, which is not 5 V-tolerant`);
  }
  // 3. each I/O works
  for (const [pin, io] of Object.entries(L.io || {})) {
    for (const id of io.needs) if (!byId[id]) bad(L, `io ${pin} needs missing part ${id}`);
    const P = 'PIN:' + pin, G = 'PIN:GND';
    if (io.kind === 'led' && io.diode) {
      const r = all.find(d => d.type === 'resistor' && (N.same(d.id + '.1', P) || N.same(d.id + '.2', P)));
      if (!r) { bad(L, `${pin}: no resistor connected to the pin`); continue; }
      const far = N.same(r.id + '.1', P) ? r.id + '.2' : r.id + '.1', D1 = io.diode;
      if (!N.same(far, D1 + '.A')) bad(L, `${pin}: resistor does not reach the anode of ${D1}`);
      if (!N.same(D1 + '.K', io.item + '.A')) bad(L, `${D1}: cathode does not reach the LED anode`);
      if (!N.same(io.item + '.K', G)) bad(L, `${pin}: LED cathode is not on GND`);
      const rv = io.rev;
      if (rv) {
        if (!N.same(rv.r + '.1', P) && !N.same(rv.r + '.2', P)) bad(L, `${rv.r} is not fed from the pin`);
        const f2 = N.same(rv.r + '.1', P) ? rv.r + '.2' : rv.r + '.1';
        if (!N.same(f2, rv.diode + '.K')) bad(L, `${rv.diode}: cathode should face the resistor (turned round)`);
        if (!N.same(rv.diode + '.A', rv.led + '.A')) bad(L, `${rv.diode}: anode does not reach ${rv.led}`);
        if (!N.same(rv.led + '.K', G)) bad(L, `${rv.led}: cathode not on GND`);
      }
    } else if (io.kind === 'led') {
      const r = all.find(d => d.type === 'resistor' && (N.same(d.id + '.1', P) || N.same(d.id + '.2', P)));
      if (!r) { bad(L, `${pin}: no resistor connected to the pin`); continue; }
      const far = N.same(r.id + '.1', P) ? r.id + '.2' : r.id + '.1';
      if (!N.same(far, io.item + '.A')) bad(L, `${pin}: resistor does not reach the LED anode`);
      if (!N.same(io.item + '.K', G)) bad(L, `${pin}: LED cathode is not on GND`);
      if (N.same(io.item + '.A', io.item + '.K')) bad(L, `${pin}: LED is shorted`);
      if (N.same(P, io.item + '.A')) bad(L, `${pin}: LED anode connects to the pin without the resistor`);
    }
    if (io.kind === 'touch') {
      const w = byId[io.item];
      if (!w || w.type !== 'fwire' || w.from !== pin) bad(L, `${pin}: touch pad wire is not connected to the pin`);
    }
    if (io.kind === 'mosfet') {
      const id = io.item, r = all.find(d => d.type === 'resistor' && ((N.same(d.id + '.1', P) && N.same(d.id + '.2', id + '.G')) || (N.same(d.id + '.2', P) && N.same(d.id + '.1', id + '.G'))));
      if (!r) bad(L, `${pin}: no gate resistor between the pin and the gate of ${id}`);
      if (N.same(P, id + '.G') && !r) bad(L, `${pin}: the pin is wired straight to the gate`);
      if (!all.some(d => d.type === 'resistor' && d.ohms >= 4700 && ((N.same(d.id + '.1', id + '.G') && N.same(d.id + '.2', G)) || (N.same(d.id + '.2', id + '.G') && N.same(d.id + '.1', G))))) bad(L, `${id}: no pull-down resistor from the gate to GND`);
      if (!N.same(id + '.S', G)) bad(L, `${id}: source not on GND`);
      if (!N.same(id + '.D', io.lamp + '.L2')) bad(L, `${id}: drain not on the lamp (L2)`);
      if (!N.same(io.lamp + '.L1', 'bat1.POS')) bad(L, `lamp L1 not on the battery +`);
      if (!N.same('bat1.NEG', G)) bad(L, `battery − not on GND (no common ground)`);
    }
    if (io.kind === 'npn') {
      const id = io.item, r = all.find(d => d.type === 'resistor' && ((N.same(d.id + '.1', P) && N.same(d.id + '.2', id + '.B')) || (N.same(d.id + '.2', P) && N.same(d.id + '.1', id + '.B'))));
      if (!r) bad(L, `${pin}: no base resistor between the pin and the base of ${id}`);
      if (N.same(P, id + '.B')) bad(L, `${pin}: the pin is wired straight to the base`);
      if (!N.same(id + '.E', G)) bad(L, `${id}: emitter not on GND`);
      if (!N.same(id + '.C', io.lamp + '.L2')) bad(L, `${id}: collector not on the lamp (L2)`);
      if (!N.same(io.lamp + '.L1', 'bat1.POS')) bad(L, `lamp L1 not on the battery +`);
      if (!N.same('bat1.NEG', G)) bad(L, `battery − not on GND (no common ground)`);
    }
    if (io.kind === 'neo') {
      const id = io.item, v = (U3 || PI) ? 'PIN:5V' : 'PIN:VIN';
      if (!N.same(id + '.DIN', P)) bad(L, `neopixel DIN not on ${pin}`);
      if (!N.same(id + '.VCC', v)) bad(L, `neopixel VCC not on ${v.slice(4)}`);
      if (!N.same(id + '.GND', G)) bad(L, `neopixel GND not on GND`);
    }
    if (io.kind === 'lcd' || io.kind === 'oled') {
      const id = io.item, lcd = io.kind === 'lcd', sda = pin, scl = io.scl;
      if (!N.same(id + '.SDA', 'PIN:' + sda)) bad(L, `${io.kind}: SDA not on ${sda}`);
      if (!N.same(id + '.SCL', 'PIN:' + scl)) bad(L, `${io.kind}: SCL not on ${scl}`);
      if (!N.same(id + '.GND', G)) bad(L, `${io.kind}: GND not on GND`);
      const v = lcd ? ((U3 || PI) ? 'PIN:5V' : 'PIN:VIN') : (PI ? 'PIN:3V3' : 'PIN:3V3');
      if (!N.same(id + '.VCC', v)) bad(L, `${io.kind}: VCC not on ${v.slice(4)}${lcd ? ' (the LCD backpack is made for 5 V)' : ''}`);
    }
    if (io.kind === 'joyax') {
      const id = io.item, leg = io.ax === 'x' ? 'VRX' : 'VRY';
      if (!N.same(id + '.' + leg, P)) bad(L, `${pin}: joystick ${leg} not on ${pin}`);
      if (!N.same(id + '.VCC', 'PIN:' + SUP)) bad(L, `${pin}: joystick VCC not on ${SUP}`);
      if (!N.same(id + '.GND', G)) bad(L, `${pin}: joystick GND not on GND`);
    }
    if (io.kind === 'joysw') { if (!N.same(io.item + '.SW', P)) bad(L, `${pin}: joystick SW not on ${pin}`); }
    if (io.kind === 'enc') {
      const id = io.item, leg = { clk: 'CLK', dt: 'DT', sw: 'SW' }[io.role];
      if (!N.same(id + '.' + leg, P)) bad(L, `${pin}: encoder ${leg} not on ${pin}`);
      if (io.role === 'clk') { if (!N.same(id + '.VCC', 'PIN:' + SUP)) bad(L, `${pin}: encoder + not on ${SUP}`); if (!N.same(id + '.GND', G)) bad(L, `${pin}: encoder GND not on GND`); }
    }
    if (io.kind === 'rgb') {
      const leg = ['R', 'G', 'B'][io.ch], id = io.item;
      const r = all.find(d => d.type === 'resistor' && ((N.same(d.id + '.1', P) && N.same(d.id + '.2', id + '.' + leg)) || (N.same(d.id + '.2', P) && N.same(d.id + '.1', id + '.' + leg))));
      if (!r) bad(L, `${pin}: no resistor between the pin and the ${leg} leg of ${id}`);
      if (!N.same(id + '.C', G)) bad(L, `${pin}: common leg of ${id} is not on GND (common cathode)`);
      if (N.same(P, id + '.' + leg)) bad(L, `${pin}: the ${leg} leg is connected to the pin without a resistor`);
    }
    if (io.kind === 'soil') {
      const id = io.item;
      if (!N.same(id + '.AOUT', P)) bad(L, `soil: AOUT not on ${pin}`);
      if (!N.same(id + '.GND', G)) bad(L, 'soil: GND not on GND');
      if (!N.same(id + '.VCC', 'PIN:' + (U3 ? '5V' : '3V3'))) bad(L, 'soil: VCC not on the supply pin');
    }
    if (io.kind === 'bmp') {
      const id = io.item;
      if (!N.same(id + '.SDA', 'PIN:' + pin)) bad(L, `bmp: SDA not on ${pin}`);
      if (!N.same(id + '.SCL', 'PIN:' + io.scl)) bad(L, `bmp: SCL not on ${io.scl}`);
      if (!N.same(id + '.GND', G)) bad(L, 'bmp: GND not on GND');
      if (!N.same(id + '.VCC', 'PIN:3V3')) bad(L, 'bmp: VCC not on 3V3');
    }
    if (io.kind === 'stepper') {
      const id = io.item;
      if (!N.same(id + '.IN' + io.idx, P)) bad(L, `${pin}: stepper IN${io.idx} not on ${pin}`);
      if (!N.same(id + '.GND', G)) bad(L, `stepper: GND not on GND`);
      if (!N.same(id + '.VCC', 'PIN:' + (U3 ? '5V' : 'VIN'))) bad(L, `stepper: VCC not on ${U3 ? '5V' : 'VIN'}`);
    }
    if (io.kind === 'mpu') {
      const id = io.item, sda = pin, scl = io.scl;
      if (!N.same(id + '.SDA', 'PIN:' + sda)) bad(L, `mpu: SDA not on ${sda}`);
      if (!N.same(id + '.SCL', 'PIN:' + scl)) bad(L, `mpu: SCL not on ${scl}`);
      if (!N.same(id + '.GND', G)) bad(L, `mpu: GND not on GND`);
      if (!N.same(id + '.VCC', 'PIN:3V3')) bad(L, `mpu: VCC not on 3V3`);
    }
    if (io.kind === 'irrx') {
      const id = io.item;
      if (!N.same(id + '.VS', 'PIN:' + SUP)) bad(L, `${pin}: IR receiver VS not on ${SUP}`);
      if (!N.same(id + '.GND', G)) bad(L, `${pin}: IR receiver GND not on GND`);
      if (!N.same(id + '.OUT', P)) bad(L, `${pin}: IR receiver OUT not on ${pin}`);
    }
    if (io.kind === 'ds18b20') {
      const id = io.item;
      if (!N.same(id + '.VDD', 'PIN:' + SUP)) bad(L, `${pin}: DS18B20 VDD not on ${SUP}`);
      if (!N.same(id + '.GND', G)) bad(L, `${pin}: DS18B20 GND not on GND`);
      if (!N.same(id + '.DQ', P)) bad(L, `${pin}: DS18B20 DQ not on ${pin}`);
      const pull = all.find(d => d.type === 'resistor' && ((N.same(d.id + '.1', id + '.DQ') && N.same(d.id + '.2', id + '.VDD')) || (N.same(d.id + '.2', id + '.DQ') && N.same(d.id + '.1', id + '.VDD'))));
      if (!pull) bad(L, `${pin}: no pull-up resistor between DS18B20 DQ and VDD`);
    }
    if (io.kind === 'dht') {
      const id = io.item;
      if (!N.same(id + '.VCC', 'PIN:' + SUP)) bad(L, `${pin}: DHT VCC not on ${SUP}`);
      if (!N.same(id + '.GND', G)) bad(L, `${pin}: DHT GND not on GND`);
      if (!N.same(id + '.DATA', P)) bad(L, `${pin}: DHT DATA not on ${pin}`);
      const pull = all.find(d => d.type === 'resistor' && ((N.same(d.id + '.1', id + '.DATA') && N.same(d.id + '.2', id + '.VCC')) || (N.same(d.id + '.2', id + '.DATA') && N.same(d.id + '.1', id + '.VCC'))));
      if (!pull) bad(L, `${pin}: no pull-up resistor between DHT DATA and VCC`);
    }
    if (io.kind === 'button') {
      if (N.same(P, G)) bad(L, `${pin}: pin is on GND even when the button is NOT pressed`);
      if (!nets(all, true).same(P, G)) bad(L, `${pin}: pressing the button does not connect the pin to GND`);
    }
    if (io.kind === 'pot') {
      const id = io.item;
      if (!N.same(id + '.W', P)) bad(L, `${pin}: wiper is not on ${pin}`);
      const ends = [id + '.1', id + '.3'];
      if (!ends.some(e => N.same(e, 'PIN:' + SUP))) bad(L, `${pin}: pot end not on ${SUP}`);
      if (!U3 && ends.some(e => N.same(e, 'PIN:5V'))) bad(L, `${pin}: pot end on 5V (A0 is not 5 V-tolerant)`);
      if (!ends.some(e => N.same(e, G))) bad(L, `${pin}: pot end not on GND`);
    }
    if (io.kind === 'ldr') {
      const id = io.item, legs2 = [id + '.1', id + '.2'];
      if (!legs2.some(l => N.same(l, P))) bad(L, `${pin}: no LDR leg on ${pin}`);
      if (!legs2.some(l => N.same(l, 'PIN:' + SUP))) bad(L, `${pin}: LDR not fed from ${SUP}`);
      if (!U3 && legs2.some(l => N.same(l, 'PIN:5V'))) bad(L, `${pin}: LDR on 5V (A0 is not 5 V-tolerant)`);
      const r = all.find(d => d.type === 'resistor' && ((N.same(d.id + '.1', P) && N.same(d.id + '.2', G)) || (N.same(d.id + '.2', P) && N.same(d.id + '.1', G))));
      if (!r) bad(L, `${pin}: no fixed resistor from ${pin} to GND (voltage divider incomplete)`);
      else if (r.hw !== 'resistor10k') bad(L, `${pin}: divider resistor ${r.id} is not the 10 kΩ part`);
    }
    if (io.kind === 'tmp36') {
      const id = io.item;
      if (!N.same(id + '.VS', 'PIN:' + SUP)) bad(L, `${pin}: TMP36 +VS not on ${SUP}`);
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
    if (io.kind === 'motor') {
      const u1 = io.drv, P_ = n => `${u1}.p${n}`;
      if (!N.same(P_(16), 'PIN:5V')) bad(L, `L293D VCC1 (pin 16) not on 5V`);
      if (!N.same(P_(8), io.bat + '.POS')) bad(L, `L293D VCC2 (pin 8) not on battery +`);
      if (!N.same(P_(4), G)) bad(L, `L293D ground not on UNO Q GND`);
      if (!N.same(io.bat + '.NEG', G)) bad(L, `battery − not on UNO Q GND (no common ground)`);
      if (!N.same(P_(1), 'PIN:' + io.en)) bad(L, `L293D EN (pin 1) not on ${io.en}`);
      if (!['D3', 'D5', 'D6', 'D9', 'D10', 'D11'].includes(io.en)) bad(L, `EN pin ${io.en} is not a PWM pin`);
      if (!N.same(P_(2), 'PIN:' + io.in1)) bad(L, `L293D 1A (pin 2) not on ${io.in1}`);
      if (!N.same(P_(7), 'PIN:' + io.in2)) bad(L, `L293D 2A (pin 7) not on ${io.in2}`);
      if (!N.same(io.item + '.M1', P_(3)) || !N.same(io.item + '.M2', P_(6))) bad(L, `motor not between 1Y (pin 3) and 2Y (pin 6)`);
      for (const p of ['5V', '3V3', 'IOREF', 'VIN', 'D5', 'D7', 'D8']) if (N.same(io.bat + '.POS', 'PIN:' + p)) bad(L, `battery + is connected to UNO Q ${p}!`);
    }
    if (io.kind === 'relay') {
      const r = io.item, lamp = io.lamp, bat = io.bat;
      if (!N.same(r + '.DCP', 'PIN:5V')) bad(L, `relay DC+ not on 5V`);
      if (!N.same(r + '.DCN', G)) bad(L, `relay DC− not on GND`);
      if (!N.same(r + '.IN', P)) bad(L, `relay IN not on ${pin}`);
      const on = nets(all, true), off = nets(all, false);
      if (!on.same(bat + '.POS', lamp + '.L1') || !on.same(lamp + '.L2', bat + '.NEG')) bad(L, `lamp circuit is not closed when the relay is ON (battery + → COM → NO → lamp → battery −)`);
      if (off.same(bat + '.POS', lamp + '.L1')) bad(L, `lamp is powered even when the relay is OFF`);
      if (on.same(bat + '.POS', bat + '.NEG')) bad(L, `battery is shorted`);
      for (const nm of [bat + '.POS', bat + '.NEG']) for (const p of ['5V', '3V3', 'IOREF', 'VIN', 'GND', 'D4', 'D5', 'D7', 'D8']) if (on.same(nm, 'PIN:' + p)) bad(L, `load battery is connected to UNO Q ${p} — the load circuit must stay separate`);
    }
    if (io.kind === 'thermo') {
      const th = io.item, cab = byId[io.cable];
      if (!cab || cab.type !== 'qwiic') bad(L, `thermo: no Qwiic cable ${io.cable}`);
      else {
        const ends = [cab.from, cab.to];
        if (!ends.includes('QWIIC')) bad(L, `thermo: Qwiic cable does not start at the UNO Q Qwiic connector`);
        if (!ends.some(e => e === th + '.QA' || e === th + '.QB')) bad(L, `thermo: Qwiic cable does not reach a Qwiic connector of ${th}`);
      }
      if (!N.same(th + '.QA', P) || !N.same(th + '.QB', P)) bad(L, `thermo: module is not on the UNO Q Qwiic bus`);
      for (const p of ['5V', '3V3', 'VIN', 'IOREF', 'GND', 'D4', 'D5']) if (N.same(th + '.QA', 'PIN:' + p)) bad(L, `thermo: Qwiic bus is connected to ${p} — Qwiic is its own 3.3 V I²C bus`);
      const cabs = [io.cable, io.cable2].filter(Boolean);
      if (all.some(d => !cabs.includes(d.id) && isWire(d) && [d.from, d.to].some(e => e.startsWith(th + '.') || (io.pix && e.startsWith(io.pix + '.'))))) bad(L, `thermo: extra wire on a module besides the Qwiic cables`);
      if (io.pix) {
        const c2 = byId[io.cable2];
        if (!c2 || c2.type !== 'qwiic') bad(L, `pixels: no Qwiic cable ${io.cable2}`);
        else if (!(c2.from.startsWith(th + '.') && c2.to.startsWith(io.pix + '.'))) bad(L, `pixels: cable 2 does not join ${th} to ${io.pix}`);
        if (!N.same(io.pix + '.QA', P)) bad(L, `pixels: module is not on the UNO Q Qwiic bus`);
        if (cab && c2 && cab.to === c2.from) bad(L, `pixels: both cables use the same Thermo connector`);
      }
    }
    if (io.kind === 'i2c') {                       // Raspberry Pi I2C sensor: SDA1 = pin 3 (GPIO2), SCL1 = pin 5 (GPIO3), 3.3 V only
      const id = io.item;
      if (U3) {                                      // UNO R3: 5 V board, SDA = A4, SCL = A5
        if (!N.same(id + '.VIN', 'PIN:5V')) bad(L, `sensor VIN is not on 5V`);
        if (!N.same(id + '.SDA', 'PIN:A4')) bad(L, `sensor SDA is not on A4`);
        if (!N.same(id + '.SCL', 'PIN:A5')) bad(L, `sensor SCL is not on A5`);
      } else {
        if (!N.same(id + '.VIN', 'PIN:3V3')) bad(L, `sensor VIN is not on 3V3 (the Pi GPIO is 3.3 V only)`);
        if (N.same(id + '.VIN', 'PIN:5V')) bad(L, `sensor VIN is on 5V`);
        if (!N.same(id + '.SDA', 'PIN:p3')) bad(L, `sensor SDA is not on pin 3 (GPIO2 / SDA1)`);
        if (!N.same(id + '.SCL', 'PIN:p5')) bad(L, `sensor SCL is not on pin 5 (GPIO3 / SCL1)`);
        for (const nm of ['SDA', 'SCL']) if (N.same(id + '.' + nm, 'PIN:5V')) bad(L, `${nm} is connected to 5V`);
      }
      if (!N.same(id + '.GND', G)) bad(L, `sensor GND is not on GND`);
      if (N.same(id + '.SDA', id + '.SCL')) bad(L, `SDA and SCL are shorted`);
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
    const txt = S.body.replace(/<[^>]+>/g, ' ').replace(/[ 	]+/g, ' ');   // tags become spaces so words never glue together
    for (const m of txt.matchAll(/\b(D\d{1,2}|A[0-5]|3V3|5V|VIN|GND)\b(?: on [A-Z]+)?\s*→\s*(?:hole\s+)?([a-j]\d{1,2})\b/g))
      if (!hasWire(m[1], m[2])) bad(L, `step ${k + 1}: text says "${m[1]} → ${m[2]}" but no such wire`);
    if (PI || U3) for (const m of txt.matchAll(/\bpin (\d{1,2})\b[^→\n(),]{0,24}→\s*([a-j]\d{1,2})\b/g))
      if (!hasWire((PI ? 'p' : 'D') + m[1], m[2])) bad(L, `step ${k + 1}: text says "pin ${m[1]} → ${m[2]}" but no such wire`);
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
  console.log(`✓ ${PI ? 'Pi 4 ' : U3 ? 'UNO R3 ' : E32 ? 'ESP32 ' : ''}Lesson ${L.num} circuit checked (${all.length} items)`);
}
}
console.log(problems ? `\n${problems} PROBLEM(S) FOUND` : '\nAll lesson circuits and texts are consistent.');
process.exit(problems ? 1 : 0);

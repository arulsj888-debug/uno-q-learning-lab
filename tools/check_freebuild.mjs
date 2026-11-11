// Sanity tests of the free-build circuit model: classic working and not-working circuits.
import { evaluate, resistorBands } from '../src/freebuild/circuit.js';
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const uno = id => ({ D4: { id: 'D4' }, A1: { id: 'A1' }, D7: { id: 'D7' }, D5: { id: 'D5', pwm: true }, D2: { id: 'D2' }, D8: { id: 'D8' }, D3: { id: 'D3' }, A0: { id: 'A0' }, '5V': { id: '5V' }, '3V3': { id: '3V3' }, GND2: { id: 'GND2', kind: 'gnd' } }[id]);
const pi = id => ({ p11: { gpio: 17 }, p3: { gpio: 2 }, p6: { label: 'GND', gpio: null }, p9: { label: 'GND', gpio: null }, p1: { label: '3V3', gpio: null }, p2: { label: '5V', gpio: null }, p12: { gpio: 18 } }[id]);
const env = { lux: 300, tempC: 25, pressed: {}, pot: {} };
const base = o => ({ boardKind: 'unoq', pinInfo: uno, parts: [], pinCfg: {}, powered: true, env, t: 0, ...o });
const W = (id, from, to) => ({ id, type: 'wire', from, to });
const led = (id, anode, cathode, color = 'red') => ({ id, type: 'led', anode, cathode, color });
const res = (id, a, b, ohms) => ({ id, type: 'resistor', a, b, ohms });

let parts = [W('w1', 'D5', 'a10'), res('r1', 'b10', 'b14', 220), led('l1', 'c14', 'c15'), W('w2', 'GND2', 'd15')];
let r = evaluate(base({ parts, pinCfg: { D5: { mode: 'out1' } } }));
console.log(r.parts.l1, r.pins.D5, r.notes.map(n => n.text));
ok(r.parts.l1.status === 'ok' && r.parts.l1.I > 0.003 && r.parts.l1.I < 0.01, 'LED with 220 ohm lights at a few mA');
r = evaluate(base({ parts })); ok(r.parts.l1.status === 'off', 'LED dark when pin is an input');
r = evaluate(base({ parts: [W('w1', 'D5', 'a10'), res('r1', 'b10', 'b14', 220), led('l1', 'c15', 'c14'), W('w2', 'GND2', 'd15')], pinCfg: { D5: { mode: 'out1' } } }));
ok(r.parts.l1.status === 'off' && /wrong way/.test(r.parts.l1.msg), 'reversed LED does not light');
r = evaluate(base({ parts: [W('w1', '5V', 'a10'), led('l1', 'c10', 'c11'), W('w2', 'GND2', 'd11')] }));
ok(r.newBurn.has('l1') && !r.tripped, 'LED straight on 5 V burns out (no short trip)');
r = evaluate(base({ parts: [W('w1', '5V', 'a10'), W('w2', 'GND2', 'b10')] })); ok(r.tripped, '5V wired to GND trips');
r = evaluate(base({ powered: false, parts, pinCfg: { D5: { mode: 'out1' } } })); ok(r.parts.l1.status === 'off', 'unpowered: LED off');
r = evaluate(base({ parts: [W('w1', '5V', 'a10'), res('r1', 'b10', 'b14', 10), led('l1', 'c14', 'c15'), W('w2', 'GND2', 'd15')] })); ok(r.newBurn.has('l1'), 'LED + 10 ohm on 5 V burns');
const btn = { id: 'b1', type: 'button', col: 10 };
parts = [btn, W('w1', 'D2', 'a10'), W('w2', 'GND2', 'j12')];
r = evaluate(base({ parts, pinCfg: { D2: { mode: 'up' } } })); ok(r.pins.D2.read === 1, 'button released with pull-up reads 1');
r = evaluate(base({ parts, pinCfg: { D2: { mode: 'up' } }, env: { ...env, pressed: { b1: true } } })); ok(r.pins.D2.read === 0, 'button pressed reads 0');
r = evaluate(base({ parts, pinCfg: { D2: { mode: 'in' } } })); ok(r.pins.D2.read === 'floating', 'no pull-up -> floating');
const pot = { id: 'p1', type: 'pot', row: 'e', col: 10 };
parts = [pot, W('w1', '3V3', 'a10'), W('w2', 'GND2', 'a14'), W('w3', 'A0', 'a12')];
r = evaluate(base({ parts, pinCfg: { A0: { mode: 'analog' } }, env: { ...env, pot: { p1: 0.25 } } })); console.log(r.pins.A0); ok(Math.abs(r.pins.A0.V - 2.475) < 0.02, 'pot wiper at 25 % from the 3V3 end gives 2.48 V');
r = evaluate({ boardKind: 'pi4', pinInfo: pi, parts: [W('w1', 'p2', 'a10'), W('w2', 'p11', 'b10')], pinCfg: { p11: { mode: 'in' } }, powered: true, env, t: 0 }); ok(r.newDamage.has('p11'), '5 V into Pi GPIO damages it');
r = evaluate({ boardKind: 'pi4', pinInfo: pi, parts: [W('w1', 'p11', 'a10'), res('r1', 'b10', 'b14', 220), led('l1', 'c14', 'c15'), W('w2', 'p9', 'd15')], pinCfg: { p11: { mode: 'out1' } }, powered: true, env, t: 0 }); ok(r.parts.l1.status === 'ok', 'Pi LED works');
const bz = { id: 'z1', type: 'buzzer', plus: 'e10', minus: 'e13' };
parts = [bz, W('w1', 'D8', 'a10'), W('w2', 'GND2', 'a13')];
r = evaluate(base({ parts, pinCfg: { D8: { mode: 'tone', freq: 440 } } })); ok(r.parts.z1.loud > 0.5, 'buzzer sounds with tone');
r = evaluate(base({ parts, pinCfg: { D8: { mode: 'out1' } } })); ok(r.parts.z1.status === 'off', 'buzzer silent with steady HIGH');
parts = [W('w1', 'D5', 'a10'), res('r1', 'b10', 'b14', 220), led('l1', 'c14', 'c15'), W('w2', 'GND2', 'd15')];
const a = evaluate(base({ parts, pinCfg: { D5: { mode: 'pwm', duty: 0.2 } } })), b = evaluate(base({ parts, pinCfg: { D5: { mode: 'pwm', duty: 0.9 } } }));
ok(a.parts.l1.level < b.parts.l1.level, 'PWM duty changes brightness');
parts = [{ id: 't1', type: 'tmp36', row: 'e', col: 10 }, W('w1', '3V3', 'a10'), W('w2', 'A0', 'a11'), W('w3', 'GND2', 'a12')];
r = evaluate(base({ parts, pinCfg: { A0: { mode: 'analog' } }, env: { ...env, tempC: 30 } })); console.log(r.pins.A0); ok(Math.abs(r.pins.A0.V - 0.8) < 0.02, 'TMP36 at 30 C = 0.80 V');
parts = [{ id: 't1', type: 'tmp36', row: 'e', col: 10 }, W('w1', 'GND2', 'a10'), W('w3', '3V3', 'a12')];
r = evaluate(base({ parts })); ok(r.parts.t1.status === 'bad', 'TMP36 backwards is flagged');
// ---- modules
const hc = { id: 'us1', type: 'hcsr04', row: 'j', col: 11 };
let hparts = [hc, W('w1', '5V', 'i11', 'red'), W('w2', 'D7', 'i12', 'yellow'), W('w3', 'D8', 'i13', 'blue'), W('w4', 'GND2', 'i14', 'black')];
r = evaluate(base({ parts: hparts, pinCfg: { D7: { mode: 'pulse' }, D8: { mode: 'in' } }, env: { ...env, dist: 40 } }));
ok(r.parts.us1.status === 'ok' && r.pins.D8.echo.us === 2320 && !r.newDamage.size, 'HC-SR04 on 5 V with echo on a 5 V-tolerant UNO Q pin works (40 cm = 2320 us)');
r = evaluate(base({ parts: hparts.map(p => p.id === 'w3' ? W('w3', 'D3', 'i13', 'blue') : p), pinCfg: { D7: { mode: 'pulse' }, D3: { mode: 'in' } } }));
ok(r.newDamage.has('D3'), 'HC-SR04 echo (5 V) on D3 damages it');
r = evaluate(base({ parts: hparts, pinCfg: { D8: { mode: 'in' } } })); ok(r.parts.us1.status === 'warn' && /Trigger pulses/.test(r.parts.us1.msg), 'HC-SR04 without trigger pulses is flagged');
r = evaluate(base({ parts: hparts.map(p => p.id === 'w1' ? W('w1', '3V3', 'i11', 'orange') : p), pinCfg: { D7: { mode: 'pulse' }, D8: { mode: 'in' } } })); ok(r.parts.us1.status === 'off', 'HC-SR04 on 3.3 V does not work');
r = evaluate({ boardKind: 'pi4', pinInfo: id => ({ p2: { label: '5V', gpio: null }, p11: { gpio: 17 }, p13: { gpio: 27 }, p9: { label: 'GND', gpio: null }, p14: { label: 'GND', gpio: null } }[id]), powered: true, env, t: 0,
  parts: [{ id: 'us1', type: 'hcsr04', row: 'j', col: 11 }, W('w1', 'p2', 'i11', 'red'), W('w2', 'p11', 'i12', 'yellow'), { id: 'r1', type: 'resistor', a: 'h13', b: 'h17', ohms: 1000 }, { id: 'r2', type: 'resistor', a: 'g17', b: 'g21', ohms: 2200 }, W('w3', 'p13', 'i17', 'blue'), W('w4', 'p9', 'i14', 'black'), W('w5', 'p14', 'i21', 'black')], pinCfg: { p11: { mode: 'pulse' }, p13: { mode: 'in' } } });
ok(r.parts.us1.status === 'ok' && !r.newDamage.size && r.pins.p13.V > 3.2 && r.pins.p13.V < 3.6, 'HC-SR04 with a 1k/2.2k divider is safe for a Pi GPIO pin');
r = evaluate({ boardKind: 'pi4', pinInfo: id => ({ p2: { label: '5V', gpio: null }, p11: { gpio: 17 }, p13: { gpio: 27 }, p9: { label: 'GND', gpio: null } }[id]), powered: true, env, t: 0,
  parts: [{ id: 'us1', type: 'hcsr04', row: 'j', col: 11 }, W('w1', 'p2', 'i11', 'red'), W('w2', 'p11', 'i12', 'yellow'), W('w3', 'p13', 'i13', 'blue'), W('w4', 'p9', 'i14', 'black')], pinCfg: { p11: { mode: 'pulse' }, p13: { mode: 'in' } } });
ok(r.newDamage.has('p13'), 'HC-SR04 echo straight into a Pi GPIO pin damages it');
const pirParts = [{ id: 'pir1', type: 'pir' }, W('w1', '5V', 'pir1.VCC', 'red'), W('w2', 'D2', 'pir1.OUT', 'yellow'), W('w3', 'GND2', 'pir1.GND', 'black')];
r = evaluate(base({ parts: pirParts, pinCfg: { D2: { mode: 'in' } }, env: { ...env, motion: true } })); ok(r.pins.D2.read === 1 && r.parts.pir1.status === 'ok', 'PIR motion -> OUT HIGH');
r = evaluate(base({ parts: pirParts, pinCfg: { D2: { mode: 'in' } }, env: { ...env, motion: false } })); ok(r.pins.D2.read === 0, 'PIR no motion -> LOW');
const sv = { id: 'sv1', type: 'servo', row: 'j', col: 11 };
const svParts = [sv, W('w1', 'GND2', 'i11', 'black'), W('w2', '5V', 'i12', 'red'), W('w3', 'D5', 'i13', 'orange')];
r = evaluate(base({ parts: svParts, pinCfg: { D5: { mode: 'servo', angle: 45 } } })); ok(r.parts.sv1.angle === 45 && r.parts.sv1.status === 'ok', 'servo moves with pulses and 5 V');
r = evaluate(base({ parts: svParts, pinCfg: { D5: { mode: 'out1' } } })); ok(/Servo angle/.test(r.notes.map(n => n.text).join()), 'servo without pulses is explained');
r = evaluate(base({ parts: svParts.map(p => p.id === 'w2' ? W('w2', '3V3', 'i12', 'orange') : p), pinCfg: { D5: { mode: 'servo' } } })); ok(r.parts.sv1.status === 'off', 'servo on 3.3 V does not move');
const shtParts = (sdaPin, sclPin, vin = '3V3') => [{ id: 'sen1', type: 'sht31', row: 'g', col: 10 }, W('w1', vin, 'j10', 'red'), W('w2', 'GND2', 'j11', 'black'), W('w3', sclPin, 'j12', 'yellow'), W('w4', sdaPin, 'j13', 'blue')];
const unoI2c = id => ({ D20: { id: 'D20' }, D21: { id: 'D21' }, D8: { id: 'D8' }, A4: { id: 'A4' }, A5: { id: 'A5' }, '3V3': { id: '3V3' }, '5V': { id: '5V' }, GND2: { id: 'GND2', kind: 'gnd' } }[id]);
r = evaluate(base({ pinInfo: unoI2c, parts: shtParts('D20', 'D21'), pinCfg: { D20: { mode: 'i2c' }, D21: { mode: 'i2c' } } })); ok(r.parts.sen1.status === 'ok' && /0x44/.test(r.parts.sen1.msg), 'SHT31 on D20/D21 works');
r = evaluate(base({ pinInfo: unoI2c, parts: shtParts('D21', 'D20'), pinCfg: { D20: { mode: 'i2c' }, D21: { mode: 'i2c' } } })); ok(r.parts.sen1.status !== 'ok' && /swapped/.test(r.parts.sen1.msg), 'SHT31 with SDA/SCL swapped is flagged');
r = evaluate(base({ pinInfo: unoI2c, parts: shtParts('D20', 'D21'), pinCfg: {} })); ok(/I²C bus/.test(r.parts.sen1.msg), 'SHT31 with pins not in I2C mode is flagged');
r = evaluate(base({ pinInfo: unoI2c, parts: shtParts('D8', 'D21'), pinCfg: { D8: { mode: 'in' }, D21: { mode: 'i2c' } } })); ok(/not on I²C pins/.test(r.parts.sen1.msg), 'SHT31 on a non-I2C pin is flagged');
r = evaluate(base({ pinInfo: unoI2c, parts: shtParts('A4', 'D21'), pinCfg: { A4: { mode: 'i2c' }, D21: { mode: 'i2c' } } })); ok(/different I²C buses/.test(r.parts.sen1.msg), 'SHT31 across two buses is flagged');
r = evaluate({ boardKind: 'pi4', pinInfo: id => ({ p1: { label: '3V3', gpio: null }, p2: { label: '5V', gpio: null }, p6: { label: 'GND', gpio: null }, p3: { gpio: 2 }, p5: { gpio: 3 } }[id]), powered: true, env, t: 0, pinCfg: { p3: { mode: 'i2c' }, p5: { mode: 'i2c' } },
  parts: [{ id: 'sen1', type: 'sht31', row: 'g', col: 10 }, W('w1', 'p1', 'j10', 'red'), W('w2', 'p6', 'j11', 'black'), W('w3', 'p5', 'j12', 'yellow'), W('w4', 'p3', 'j13', 'blue')] });
ok(r.parts.sen1.status === 'ok' && r.pins.p3.V > 3.2 && !r.newDamage.size, 'SHT31 on the Pi (GPIO2/GPIO3, 3.3 V) works');
const L = (id, from, to) => ({ id, type: 'lead', from, to });
const relayParts = [{ id: 'rel1', type: 'relay' }, { id: 'bat1', type: 'battery' }, { id: 'lamp1', type: 'lamp' }, L('a', 'rel1.DCP', '5V'), L('b', 'rel1.DCN', 'GND2'), L('c', 'rel1.IN', 'D4'), L('d', 'bat1.POS', 'rel1.COM'), L('e', 'rel1.NO', 'lamp1.L1'), L('f', 'lamp1.L2', 'bat1.NEG')];
const unoR = id => ({ D4: { id: 'D4' }, '5V': { id: '5V' }, GND2: { id: 'GND2', kind: 'gnd' } }[id]);
r = evaluate(base({ pinInfo: unoR, parts: relayParts, pinCfg: { D4: { mode: 'out0' } } })); ok(r.parts.rel1.on && r.parts.lamp1.level > 0.3 && r.parts.lamp1.status === 'ok', 'relay with pin LOW switches the lamp on');
r = evaluate(base({ pinInfo: unoR, parts: relayParts, pinCfg: { D4: { mode: 'in' } } })); ok(!r.parts.rel1.on && r.parts.lamp1.status === 'off', 'relay released (pin input): lamp off');
r = evaluate(base({ pinInfo: unoR, parts: relayParts, pinCfg: { D4: { mode: 'out1' } } })); ok(!r.parts.rel1.on && r.parts.rel1.status === 'warn', 'relay with pin HIGH stays off and warns');
r = evaluate(base({ pinInfo: unoR, parts: [{ id: 'bat1', type: 'battery' }, L('x', 'bat1.POS', 'bat1.NEG')] })); ok(r.parts.bat1.status === 'bad', 'battery short is flagged');
const unoM = id => ({ D5: { id: 'D5' }, D7: { id: 'D7' }, D8: { id: 'D8' }, '5V': { id: '5V' }, GND2: { id: 'GND2', kind: 'gnd' }, GND3: { id: 'GND3', kind: 'gnd' } }[id]);
const motor = ground => [{ id: 'u1', type: 'l293d', col: 12 }, { id: 'bat1', type: 'battery' }, { id: 'mot1', type: 'motor' }, W('w1', '5V', 'a12', 'red'), W('w3', 'D5', 'j12', 'orange'), W('w4', 'D7', 'j13', 'yellow'), W('w5', 'D8', 'j18', 'blue'),
  ...(ground ? [W('w6', 'GND3', 'a15', 'black')] : []), L('l1', 'bat1.POS', 'j19'), L('l2', 'bat1.NEG', 'j16'), L('l3', 'mot1.M1', 'j14'), L('l4', 'mot1.M2', 'j17')];
r = evaluate(base({ pinInfo: unoM, parts: motor(true), pinCfg: { D5: { mode: 'out1' }, D7: { mode: 'out1' }, D8: { mode: 'out0' } } })); ok(r.parts.mot1.speed > 0.5, 'L293D drives the motor in direction 1');
r = evaluate(base({ pinInfo: unoM, parts: motor(true), pinCfg: { D5: { mode: 'out1' }, D7: { mode: 'out0' }, D8: { mode: 'out1' } } })); ok(r.parts.mot1.speed < -0.5, 'L293D reverses the motor');
r = evaluate(base({ pinInfo: unoM, parts: motor(true), pinCfg: { D5: { mode: 'out1' }, D7: { mode: 'out1' }, D8: { mode: 'out1' } } })); ok(r.parts.mot1.speed === 0, 'equal inputs brake the motor');
r = evaluate(base({ pinInfo: unoM, parts: motor(true), pinCfg: { D5: { mode: 'out0' }, D7: { mode: 'out1' }, D8: { mode: 'out0' } } })); ok(r.parts.mot1.speed === 0 && r.parts.u1.status === 'warn', 'enable LOW stops the motor');
r = evaluate(base({ pinInfo: unoM, parts: motor(false), pinCfg: { D5: { mode: 'out1' }, D7: { mode: 'out1' }, D8: { mode: 'out0' } } })); ok(r.parts.mot1.speed === 0 && /ground/.test(r.parts.u1.msg), 'no common ground is detected');
const Q = (id, from, to) => ({ id, type: 'qwiic', from, to });
r = evaluate(base({ parts: [{ id: 'th1', type: 'thermo' }, Q('c1', 'QWIIC', 'th1.QA')], env: { ...env, tempC: 30 } })); ok(r.parts.th1.status === 'ok' && /0x45/.test(r.parts.th1.msg), 'Thermo on Qwiic answers');
r = evaluate(base({ parts: [{ id: 'th1', type: 'thermo' }, { id: 'pix1', type: 'pixels' }, Q('c1', 'QWIIC', 'th1.QA'), Q('c2', 'th1.QB', 'pix1.QA')], env: { ...env, tempC: 25 } })); ok(r.parts.pix1.colors && r.parts.pix1.colors.filter(c => c[3] > 0).length === 5, 'Pixels bar: 25 C = 5 of 8 LEDs');
r = evaluate(base({ parts: [{ id: 'th1', type: 'thermo' }, { id: 'pix1', type: 'pixels' }, Q('c2', 'th1.QB', 'pix1.QA')] })); ok(r.parts.th1.status === 'off' && r.parts.pix1.status === 'off', 'modules without a cable to the board are off');
r = evaluate(base({ parts: [{ id: 'th1', type: 'thermo' }, { id: 'th2', type: 'thermo' }, Q('c1', 'QWIIC', 'th1.QA'), Q('c2', 'th1.QB', 'th2.QA')] })); ok(r.parts.th1.status === 'warn', 'two Thermos clash');
// ---- Arduino UNO R3 (5 V logic)
const u3 = id => ({ D4: { id: 'D4' }, D6: { id: 'D6', pwm: true }, D7: { id: 'D7' }, D9: { id: 'D9', pwm: true }, A1: { id: 'A1' }, D5: { id: 'D5', pwm: true }, D13: { id: 'D13' }, D2: { id: 'D2' }, A0: { id: 'A0' }, A4: { id: 'A4' }, A5: { id: 'A5' }, SDA: { id: 'SDA' }, '5V': { id: '5V', kind: 'pwr' }, '3V3': { id: '3V3', kind: 'pwr' }, GND2: { id: 'GND2', kind: 'gnd' } }[id]);
const b3 = o => ({ boardKind: 'uno3', pinInfo: u3, parts: [], pinCfg: {}, powered: true, env, t: 0, ...o });
r = evaluate(b3({ parts: [W('w1', 'D5', 'a10'), res('r1', 'b10', 'b14', 220), led('l1', 'c14', 'c15'), W('w2', 'GND2', 'd15')], pinCfg: { D5: { mode: 'out1' } } }));
ok(r.parts.l1.status === 'ok' && r.parts.l1.I > 0.010 && r.parts.l1.I < 0.016 && r.pins.D5.V > 4.3, 'UNO R3: 5 V pin + 220 ohm + LED gives about 12 mA');
r = evaluate(b3({ parts: [W('w1', 'D5', 'a10'), W('w2', 'GND2', 'b10')], pinCfg: { D5: { mode: 'out1' } } })); ok(r.newDamage.has('D5'), 'UNO R3: output HIGH shorted to GND damages the pin');
r = evaluate(b3({ parts: [{ id: 'p1', type: 'pot', row: 'e', col: 10 }, W('w1', '5V', 'a10'), W('w2', 'GND2', 'a14'), W('w3', 'A0', 'a12')], pinCfg: { A0: { mode: 'analog' } }, env: { ...env, pot: { p1: 0.5 } } }));
ok(Math.abs(r.pins.A0.adc - 512) < 3, 'UNO R3: pot in the middle on 5 V reads about 512');
r = evaluate(b3({ parts: [W('w1', '5V', 'a10'), W('w2', 'D2', 'b10')], pinCfg: { D2: { mode: 'in' } } })); ok(!r.newDamage.size && r.pins.D2.read === 1, 'UNO R3: 5 V on an input is fine and reads HIGH');
r = evaluate(b3({ parts: [{ id: 'sen1', type: 'sht31', row: 'g', col: 10 }, W('w1', '5V', 'j10'), W('w2', 'GND2', 'j11'), W('w3', 'A5', 'j12'), W('w4', 'SDA', 'j13')], pinCfg: { A5: { mode: 'i2c' }, SDA: { mode: 'i2c' } } }));
ok(r.parts.sen1.status === 'ok', 'UNO R3: SHT31 on SDA (= A4) and A5 works');
// ---- ESP32 DevKit V1 (3.3 V logic, 12-bit ADC)
import { findPinE32 } from '../src/esp32/data.js';
import { EXAMPLES } from '../src/freebuild/examples.js';
const e32 = o => ({ boardKind: 'esp32', pinInfo: findPinE32, parts: [], pinCfg: {}, powered: true, env, t: 0, ...o });
r = evaluate(e32({ parts: [W('w1', 'G16', 'a10'), res('r1', 'b10', 'b14', 220), led('l1', 'c14', 'c15'), W('w2', 'GND2', 'd15')], pinCfg: { G16: { mode: 'out1' } } }));
ok(r.parts.l1.status === 'ok' && r.parts.l1.I > 0.004 && r.parts.l1.I < 0.008, 'ESP32: 3.3 V pin + 220 ohm + LED gives about 6 mA');
r = evaluate(e32({ parts: [W('w1', 'VIN', 'a10'), W('w2', 'G17', 'b10')], pinCfg: { G17: { mode: 'in' } } })); ok(r.newDamage.has('G17'), 'ESP32: 5 V (VIN) on a GPIO pin damages it');
r = evaluate(e32({ parts: [{ id: 'p1', type: 'pot', row: 'e', col: 10 }, W('w1', '3V3', 'a10'), W('w2', 'GND2', 'a14'), W('w3', 'G34', 'a12')], pinCfg: { G34: { mode: 'analog' } }, env: { ...env, pot: { p1: 0.5 } } }));
ok(Math.abs(r.pins.G34.adc - 2048) < 8, 'ESP32: pot in the middle reads about 2048 (12-bit)');
r = evaluate(e32({ parts: [{ id: 'sw1', type: 'button', col: 10 }, W('w1', 'G17', 'a10'), W('w2', 'GND2', 'j12')], pinCfg: { G17: { mode: 'up' } } })); ok(r.pins.G17.read === 1, 'ESP32: pull-up input reads HIGH when released');
for (const x of EXAMPLES('esp32')) { r = evaluate(e32({ parts: x.parts, pinCfg: x.pins })); ok(r && r.pins, 'ESP32 example evaluates: ' + x.title); }
r = evaluate(e32({ parts: [{ id: 'us1', type: 'hcsr04', row: 'j', col: 11 }, W('w1', 'VIN', 'i11'), W('w2', 'G16', 'i12'), W('w3', 'G17', 'i13'), W('w4', 'GND2', 'i14')], pinCfg: { G16: { mode: 'pulse' }, G17: { mode: 'in' } } })); ok(r.newDamage.has('G17'), 'ESP32: HC-SR04 5 V echo straight into a GPIO damages it');
{ const x = EXAMPLES('esp32').find(e => e.title.includes('voltage divider')); r = evaluate(e32({ parts: x.parts, pinCfg: x.pins })); ok(!r.newDamage.size && r.parts.us1.status === 'ok', 'ESP32: HC-SR04 with the 1k + 2.2k divider is safe and works'); }
{ const x = EXAMPLES('esp32').find(e => e.title.includes('SHT31') && e.title.startsWith('✔')); r = evaluate(e32({ parts: x.parts, pinCfg: x.pins })); ok(r.parts.sen1.status === 'ok', 'ESP32: SHT31 on GPIO21 (SDA) and GPIO22 (SCL) works'); }
{ const x = EXAMPLES('esp32').find(e => e.title.startsWith('✔ Servo')); r = evaluate(e32({ parts: x.parts, pinCfg: x.pins })); ok(r.parts.sv1.status === 'ok', 'ESP32: servo on VIN (5 V) with pulses works'); }
{ const x = EXAMPLES('esp32').find(e => e.title.startsWith('✖ Servo')); r = evaluate(e32({ parts: x.parts, pinCfg: x.pins })); ok(r.parts.sv1.status !== 'ok', 'ESP32: servo on 3.3 V does not work'); }
// ---- RGB LED (all boards): three dice with one common leg
const rgbOK = (kind, info, ex, label) => { const x = EXAMPLES(kind).find(e => e.title.startsWith(ex)); const r0 = evaluate({ boardKind: kind, pinInfo: info, parts: x.parts, pinCfg: x.pins, powered: true, env, t: 0 }); return r0; };
for (const [kind, info, name] of [['unoq', uno, 'UNO Q'], ['uno3', u3, 'UNO R3'], ['esp32', findPinE32, 'ESP32']]) {
  r = rgbOK(kind, info, '✔ RGB LED'); ok(r.parts.rgb1.status === 'ok' && r.parts.rgb1.levels[0] > 0.05, name + ': RGB LED with three resistors lights');
  r = rgbOK(kind, info, '✖ RGB LED without'); ok(kind === 'uno3' ? r.newBurn.has('rgb1') : r.parts.rgb1.status === 'warn', name + (kind === 'uno3' ? ': RGB LED without resistors burns out on 5 V pins' : ': RGB LED without resistors is flagged (red die above 20 mA)'));
}
r = rgbOK('esp32', findPinE32, '✔ RGB LED'); ok(r.parts.rgb1.levels[0] > r.parts.rgb1.levels[1] * 1.5 || r.parts.rgb1.levels[1] < 0.6, 'ESP32: green die gets much less than red at 3.3 V');
r = rgbOK('uno3', u3, '✖ Common-anode'); ok(r.parts.rgb1.status === 'off', 'UNO R3: common-anode LED wired like a common-cathode one stays dark');
r = evaluate({ boardKind: 'uno3', pinInfo: u3, parts: [{ id: 'rgb1', type: 'rgbled', row: 'e', col: 10, ca: true }, ...[['a10', 'a16'], ['a12', 'a17'], ['a13', 'a18']].map(([a, b], i) => res('r' + i, a, b, 220)), W('w1', 'D5', 'b16'), W('w2', 'D6', 'b17'), W('w3', 'D9', 'b18'), W('w4', '5V', 'a11')], pinCfg: { D5: { mode: 'out0' }, D6: { mode: 'out0' }, D9: { mode: 'out1' } }, powered: true, env, t: 0 });
ok(r.parts.rgb1.status === 'ok' && r.parts.rgb1.levels[0] > 0.05 && r.parts.rgb1.levels[2] < 0.01, 'UNO R3: common-anode LED on 5 V lights when the pin is LOW (and not when HIGH)');
// ---- DHT11 / DHT22: 4 pins, needs a pull-up between DATA and VCC, reading from the room
for (const [kind, info, name] of [['unoq', uno, 'UNO Q'], ['uno3', u3, 'UNO R3']]) {
  r = rgbOK(kind, info, '✔ DHT11'); ok(r.parts.dht1.status === 'ok' && /25\.0/.test(r.parts.dht1.msg), name + ': DHT11 with its pull-up resistor reads the room temperature');
  r = rgbOK(kind, info, '✖ DHT without'); ok(r.parts.dht1.status === 'warn', name + ': DHT without the pull-up resistor is flagged');
}
r = rgbOK('esp32', findPinE32, '✔ DHT22'); ok(r.parts.dht1.status === 'ok' && !r.newDamage.size, 'ESP32: DHT22 on 3V3 works and nothing is damaged');
r = rgbOK('esp32', findPinE32, '✖ DHT22 powered from VIN'); ok(r.newDamage.has('G4'), 'ESP32: DHT22 pulled up to 5 V (VIN) damages the GPIO pin');
r = evaluate({ boardKind: 'unoq', pinInfo: uno, parts: [{ id: 'dht1', type: 'dht', model: 'dht11', row: 'e', col: 10 }, W('w1', '3V3', 'a10'), W('w2', 'D5', 'a11'), res('r1', 'c10', 'c16', 10000), W('w3', 'b11', 'b16'), W('w4', 'GND2', 'a13')], pinCfg: { D5: { mode: 'dht' } }, powered: true, env: { ...env, tempC: 70 }, t: 0 });
ok(r.parts.dht1.status === 'warn', 'DHT11 at 70 degrees C is outside its 0 - 50 degrees C range');
{ const x = EXAMPLES('esp32').find(e => e.title.startsWith('✖ EN pin')); r = evaluate(e32({ parts: x.parts, pinCfg: x.pins })); ok(r.parts.l1 === undefined && r.parts.led1.status !== 'ok' && r.notes.some(n => /held in reset/.test(n.text)), 'ESP32: EN wired to GND holds the chip in reset (LED dark, note shown)'); }
r = evaluate(e32({ parts: [W('w1', 'VIN', 'a10'), W('w2', 'EN', 'b10')] })); ok(r.newDamage.has('EN'), 'ESP32: 5 V on the EN pin damages it');
r = evaluate(e32({ parts: [W('w1', 'EN', 'a10'), W('w2', 'G17', 'b10')], pinCfg: { G17: { mode: 'in' } } })); ok(r.pins.EN.msg === 'HIGH: chip running', 'ESP32: EN left alone is pulled HIGH');
// ---- Joystick module and rotary encoder
for (const [kind, info, name] of [['unoq', uno, 'UNO Q'], ['uno3', u3, 'UNO R3'], ['esp32', findPinE32, 'ESP32']]) {
  r = rgbOK(kind, info, '✔ Joystick'); ok(r.parts.joy1.status === 'ok' && !r.newDamage.size, name + ': joystick example works');
  const jx = EXAMPLES(kind).find(e => e.title.startsWith('✔ Joystick'));
  r = evaluate({ boardKind: kind, pinInfo: info, parts: jx.parts, pinCfg: jx.pins, powered: true, env: { ...env, joy: { joy1: { x: 1, y: 0 } } }, t: 0 });
  const adcMax = kind === 'esp32' ? 4095 : kind === 'uno3' ? 1023 : 1023, ax = kind === 'esp32' ? 'G34' : 'A0', ay = kind === 'esp32' ? 'G35' : 'A1';
  ok(r.pins[ax].adc > adcMax * 0.95 && r.pins[ay].adc < adcMax * 0.05, name + ': stick fully right and up reads about full scale on VRx and about 0 on VRy');
  r = evaluate({ boardKind: kind, pinInfo: info, parts: jx.parts, pinCfg: jx.pins, powered: true, env: { ...env, pressed: { joy1: true } }, t: 0 });
  ok(r.pins[kind === 'esp32' ? 'G17' : 'D2'].read === 0, name + ': pressing the stick pulls SW LOW');
  const enc = EXAMPLES(kind).find(e => e.title.startsWith('✔ Rotary encoder')), pk = kind === 'esp32' ? ['G16', 'G17'] : ['D2', 'D4'];
  const phases = [0, 1, 2, 3].map(ph => { const q = evaluate({ boardKind: kind, pinInfo: info, parts: enc.parts, pinCfg: enc.pins, powered: true, env: { ...env, enc: { enc1: ph } }, t: 0 }); return `${q.pins[pk[0]].read}${q.pins[pk[1]].read}`; });
  ok(phases.join() === '11,01,00,10', name + ': encoder gives the quadrature pattern 11, 01, 00, 10 (got ' + phases.join() + ')');
}
{ const x = EXAMPLES('unoq').find(e => e.title.startsWith('✖ Joystick')); r = evaluate({ boardKind: 'unoq', pinInfo: uno, parts: x.parts, pinCfg: x.pins, powered: true, env: { ...env, joy: { joy1: { x: 1, y: 1 } } }, t: 0 }); } ok(r.newDamage.has('A0'), 'UNO Q: joystick on 5 V damages the 3.3 V analog pin');
{ const x = EXAMPLES('esp32').find(e => e.title.startsWith('✖ Joystick')); r = evaluate({ boardKind: 'esp32', pinInfo: findPinE32, parts: x.parts, pinCfg: x.pins, powered: true, env: { ...env, joy: { joy1: { x: 1, y: 1 } } }, t: 0 }); } ok(r.newDamage.has('G34') || r.newDamage.has('G35'), 'ESP32: joystick on VIN (5 V) damages an ADC pin');
r = rgbOK('uno3', u3, '✖ Rotary encoder'); ok(r.parts.enc1.status === 'warn', 'UNO R3: encoder pins without pull-up are flagged');
ok(resistorBands(220).join() === 'red,red,brown,gold' && resistorBands(10000).join() === 'brown,black,orange,gold' && resistorBands(4700).join() === 'yellow,violet,red,gold', 'resistor bands');
console.log(fail ? `${fail} FAILED` : 'all free-build checks passed');
process.exit(fail ? 1 : 0);

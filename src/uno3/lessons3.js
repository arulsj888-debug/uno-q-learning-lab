// UNO R3 lessons 40-59: buzzer, RC circuit, switches, 7-segment, interrupts, timer, EEPROM, SPI devices (MAX7219, TFT, RFID, SD),
// gas / flame / GPS / RTC, stepper driver, fan on a MOSFET, serial links (board to board, Bluetooth, nRF24L01).
// Facts come from the datasheets listed in each lesson's `sources`. Simulated devices: src/devices.js. Listings: ./code3.js.
import { SRC, LED_CIRCUIT, LED_IDS, IO_LED } from './common.js';
import { CODE3 } from './code3.js';

const R = (t, u) => ({ t, u });
const S = {
  dw: R('Arduino reference: digitalWrite()', 'https://docs.arduino.cc/language-reference/en/functions/digital-io/digitalwrite/'),
  rcsrc: R('All About Circuits: RC and L/R time constants (DC textbook, chapter 16)', 'https://www.allaboutcircuits.com/textbook/direct-current/chpt-16/voltage-current-calculations/'),
  irq: R('Arduino reference: attachInterrupt()', 'https://docs.arduino.cc/language-reference/en/functions/external-interrupts/attachInterrupt/'),
  timer1: R('TimerOne library (Paul Stoffregen)', 'https://github.com/PaulStoffregen/TimerOne'),
  eeprom: R('Arduino EEPROM library', 'https://docs.arduino.cc/learn/built-in-libraries/eeprom/'),
  max: R('MAX7219/MAX7221 datasheet (Analog Devices)', 'https://www.analog.com/media/en/technical-documentation/data-sheets/MAX7219-MAX7221.pdf'),
  ledctl: R('LedControl library (Eberhard Fahle)', 'https://github.com/wayoda/LedControl'),
  tftguide: R('Adafruit 1.8" TFT display guide', 'https://learn.adafruit.com/1-8-tft-display'),
  st7735: R('Adafruit ST7735 and ST7789 library', 'https://github.com/adafruit/Adafruit-ST7735-Library'),
  mfrc: R('MFRC522 datasheet (NXP)', 'https://www.nxp.com/docs/en/data-sheet/MFRC522.pdf'),
  mfrclib: R('MFRC522 Arduino library (miguelbalboa)', 'https://github.com/miguelbalboa/rfid'),
  sdlib: R('Arduino SD library', 'https://docs.arduino.cc/libraries/sd/'),
  mq2: R('MQ-2 semiconductor gas sensor datasheet (Hanwei, hosted by Pololu)', 'https://www.pololu.com/file/0J309/MQ2.pdf'),
  lm393: R('LM393 dual comparator datasheet (Texas Instruments)', 'https://www.ti.com/lit/ds/symlink/lm393.pdf'),
  gps: R('TinyGPSPlus library (Mikal Hart)', 'https://github.com/mikalhart/TinyGPSPlus'),
  softser: R('Arduino SoftwareSerial library', 'https://docs.arduino.cc/learn/built-in-libraries/software-serial/'),
  ds3231: R('DS3231 datasheet (Analog Devices)', 'https://www.analog.com/media/en/technical-documentation/data-sheets/DS3231.pdf'),
  rtclib: R('RTClib (Adafruit)', 'https://github.com/adafruit/RTClib'),
  a4988: R('Pololu A4988 stepper motor driver carrier (product page)', 'https://www.pololu.com/product/1182'),
  a4988ds: R('A4988 datasheet (Allegro)', 'https://www.allegromicro.com/-/media/files/datasheets/a4988-datasheet.pdf'),
  nrf: R('nRF24L01+ product specification (Nordic Semiconductor)', 'https://www.sparkfun.com/datasheets/Components/SMD/nRF24L01Pluss_Preliminary_Product_Specification_v1_0.pdf'),
  rf24: R('RF24 library (TMRh20)', 'https://github.com/nRF24/RF24'),
  serial: R('Arduino reference: Serial', 'https://docs.arduino.cc/language-reference/en/functions/communication/serial/'),
};

const w = (id, from, to, color, lift = 12) => ({ id, type: 'wire', from, to, color, lift });
const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const mod = (id, model, x = 20, z = 138) => ({ id, type: 'mod', model, x, z });
const ids = a => a.map(d => d.id);
/** io entries of a module: { pin: [role, modulePin] }, power wires in `pw` */
const mio = (kind, item, needs, map, pw) => { const o = {}; let first = true; for (const [pin, [role, mp, it]] of Object.entries(map)) { o[pin] = { kind: 'dev:' + kind, role, item: it || item, mp, needs }; if (first && pw) { o[pin].pw = pw; first = false; } } return o; };

// ---- parts ------------------------------------------------------------------------------------
const ABUZ = [{ id: 'r1', type: 'resistor', a: 'c19', b: 'c23', ohms: 220 }, { id: 'bz1', type: 'buzzer', active: true, plus: 'e23', minus: 'e26' }, w('w1', 'D8', 'a19', 'orange'), w('w2', 'a26', 'GND3', 'black', 9)];
const RC = [{ id: 'r1', type: 'resistor', a: 'a5', b: 'a10', ohms: 10000 }, { id: 'c1', type: 'cap', uf: 100, a: 'd10', k: 'd12' }, w('w1', 'D8', 'b5', 'orange', 20), w('w2', 'A0', 'c10', 'green', 14), w('w3', 'GND2', 'b12', 'black', 18)];
const SWT = [
  { id: 'ssw1', type: 'slidesw', row: 'e', col: 5 }, { id: 'reed1', type: 'reed', a: 'e12', k: 'e17' }, { id: 'tilt1', type: 'tilt', a: 'e22', k: 'e23' },
  w('w1', 'GND2', 'a5', 'black', 12), w('w2', 'D2', 'a6', 'yellow', 16), w('w3', '5V', 'a7', 'red', 12),
  w('w4', 'GND3', 'a12', 'black', 14), w('w5', 'D3', 'a17', 'green', 18), w('w6', 'GND1', 'a22', 'black', 16), w('w7', 'D4', 'a23', 'blue', 20)];
const SEG = (() => {
  const p = [{ id: 'seg1', type: 'sevenseg', x: 30, z: 138 }];
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'violet', 'white'];
  for (let i = 0; i < 7; i++) {
    const c = 3 + 2 * i;
    p.push(w('w' + (i + 1), 'D' + (2 + i), 'a' + c, colors[i], 10 + i), { id: 'r' + (i + 1), type: 'resistor', a: 'd' + c, b: 'g' + c, ohms: 220 }, fw('f' + (i + 1), 'seg1.' + 'ABCDEFG'[i], 'j' + c, colors[i], 24 + 3 * i));
  }
  p.push(fw('f8', 'seg1.COM', 'GND2', 'black', 60));
  return p;
})();
const BTN2 = [{ id: 'btn1', type: 'button', col: 20 }, w('w3', 'D2', 'a20', 'blue'), w('w4', 'j22', 'GND3', 'black', 14)];
const MX = [mod('mx1', 'mod_max7219'), fw('f1', 'mx1.VCC', '5V', 'red', 30), fw('f2', 'mx1.GND', 'GND2', 'black', 24), fw('f3', 'mx1.DIN', 'D11', 'blue', 36), fw('f4', 'mx1.CS', 'D10', 'green', 42), fw('f5', 'mx1.CLK', 'D13', 'yellow', 48)];
const TFT = [mod('tf1', 'mod_tft', 20, 150), fw('f1', 'tf1.GND', 'GND2', 'black', 24), fw('f2', 'tf1.VCC', '5V', 'red', 30), fw('f3', 'tf1.SCK', 'D13', 'yellow', 36), fw('f4', 'tf1.SDA', 'D11', 'blue', 42), fw('f5', 'tf1.RES', 'D8', 'white', 48), fw('f6', 'tf1.DC', 'D9', 'green', 54), fw('f7', 'tf1.CS', 'D10', 'orange', 60), fw('f8', 'tf1.BL', '3V3', 'violet', 66)];
const RFID = [mod('rf1', 'mod_rfid', 30, 140), fw('f1', 'rf1.3V3', '3V3', 'orange', 24), fw('f2', 'rf1.GND', 'GND2', 'black', 30), fw('f3', 'rf1.RST', 'D9', 'white', 36), fw('f4', 'rf1.SDA', 'D10', 'green', 42), fw('f5', 'rf1.MOSI', 'D11', 'blue', 48), fw('f6', 'rf1.MISO', 'D12', 'violet', 54), fw('f7', 'rf1.SCK', 'D13', 'yellow', 60)];
const SD = [mod('sd1', 'mod_sd', 25, 138), fw('f1', 'sd1.GND', 'GND2', 'black', 24), fw('f2', 'sd1.VCC', '5V', 'red', 30), fw('f3', 'sd1.MISO', 'D12', 'violet', 36), fw('f4', 'sd1.MOSI', 'D11', 'blue', 42), fw('f5', 'sd1.SCK', 'D13', 'yellow', 48), fw('f6', 'sd1.CS', 'D10', 'green', 54)];
const GAS = [mod('gs1', 'mod_mq2'), fw('f1', 'gs1.VCC', '5V', 'red', 30), fw('f2', 'gs1.GND', 'GND2', 'black', 24), fw('f3', 'gs1.DO', 'D2', 'green', 36), fw('f4', 'gs1.AO', 'A0', 'yellow', 42)];
const FLAME = [mod('fl1', 'mod_flame'), fw('f1', 'fl1.VCC', '5V', 'red', 30), fw('f2', 'fl1.GND', 'GND1', 'black', 24), fw('f3', 'fl1.DO', 'D2', 'green', 36), fw('f4', 'fl1.AO', 'A0', 'yellow', 42)];
const GPS = [mod('gp1', 'mod_gps'), fw('f1', 'gp1.VCC', '5V', 'red', 30), fw('f2', 'gp1.GND', 'GND2', 'black', 24), fw('f3', 'gp1.TX', 'D4', 'green', 36), fw('f4', 'gp1.RX', 'D3', 'yellow', 42)];
const RTC = [mod('rt1', 'mod_rtc'), fw('f1', 'rt1.VCC', '5V', 'red', 30), fw('f2', 'rt1.GND', 'GND2', 'black', 24), fw('f3', 'rt1.SDA', 'A4', 'blue', 36), fw('f4', 'rt1.SCL', 'A5', 'yellow', 42)];
const A4 = [
  mod('dv1', 'mod_a4988', 30, 138), { id: 'mot1', type: 'nema17', x: 90, z: 120 },
  fw('f1', 'dv1.STEP', 'D3', 'green', 30), fw('f2', 'dv1.DIR', 'D4', 'blue', 36), fw('f3', 'dv1.ENABLE', 'D5', 'yellow', 42), fw('f4', 'dv1.SLEEP', 'dv1.RESET', 'white', 12),
  fw('f5', 'dv1.VDD', '5V', 'red', 48), fw('f6', 'dv1.GND', 'GND2', 'black', 54),
  { id: 'l1', type: 'lead', from: 'mot1.A1', to: 'dv1.1A', color: 'red', lift: 14 }, { id: 'l2', type: 'lead', from: 'mot1.A2', to: 'dv1.1B', color: 'blue', lift: 18 },
  { id: 'l3', type: 'lead', from: 'mot1.B1', to: 'dv1.2A', color: 'green', lift: 22 }, { id: 'l4', type: 'lead', from: 'mot1.B2', to: 'dv1.2B', color: 'yellow', lift: 26 }];
const FAN = [
  { id: 'q1', type: 'mosfet', row: 'e', col: 10 }, { id: 'r1', type: 'resistor', a: 'a5', b: 'a10', ohms: 220 }, w('w1', 'D9', 'b5', 'yellow', 24),
  { id: 'r2', type: 'resistor', a: 'd10', b: 'd12', ohms: 10000 }, w('w2', 'GND2', 'b12', 'black', 18),
  { id: 'dio1', type: 'diode', a: 'b11', k: 'b14' },
  { id: 'bat1', type: 'battery', x: 45, z: 120 }, { id: 'mot1', type: 'motor', x: -40, z: 116, rotY: Math.PI },
  { id: 'l1', type: 'lead', from: 'bat1.POS', to: 'c14', color: 'red', lift: 14 }, { id: 'l2', type: 'lead', from: 'mot1.M1', to: 'd14', color: 'white', lift: 12 },
  { id: 'l3', type: 'lead', from: 'mot1.M2', to: 'c11', color: 'green', lift: 16 }, { id: 'l4', type: 'lead', from: 'bat1.NEG', to: 'c12', color: 'black', lift: 18 }];
const UART = [mod('pr1', 'mod_peer', 30, 138), fw('f1', 'pr1.TX', 'D10', 'green', 30), fw('f2', 'pr1.RX', 'D11', 'yellow', 36), fw('f3', 'pr1.GND', 'GND2', 'black', 24)];
const HC = [
  mod('hc1', 'mod_hc05', 30, 138), { id: 'ra', type: 'resistor', a: 'c20', b: 'c24', ohms: 1000 }, { id: 'rb', type: 'resistor', a: 'd24', b: 'd28', ohms: 2000 },
  w('wa', 'D11', 'a20', 'yellow', 16), w('wb', 'b28', 'GND3', 'black', 14),
  fw('f1', 'hc1.VCC', '5V', 'red', 30), fw('f2', 'hc1.GND', 'GND1', 'black', 24), fw('f3', 'hc1.TXD', 'D10', 'green', 36), fw('f4', 'hc1.RXD', 'a24', 'blue', 42)];
const NRF = [mod('nr1', 'mod_nrf24', 30, 138), fw('f1', 'nr1.VCC', '3V3', 'red', 30), fw('f2', 'nr1.GND', 'GND2', 'black', 24), fw('f3', 'nr1.CE', 'D9', 'white', 36), fw('f4', 'nr1.CSN', 'D10', 'green', 42), fw('f5', 'nr1.SCK', 'D13', 'yellow', 48), fw('f6', 'nr1.MOSI', 'D11', 'blue', 54), fw('f7', 'nr1.MISO', 'D12', 'violet', 60)];

// ---- builder ------------------------------------------------------------------------------------
const STEP = (title, view, have, body, o = {}) => ({ title, view, have, power: false, body, ...o });
const base = (n, key, o) => ({ id: 'u' + n, num: n, level: 'Intermediate', time: '25 min', code: CODE3[key], file: o.file, program: 'u3_' + key, fast: true, ...o });

const pw = (item, vcc, gnd = 'GND') => [[item + '.VCC', vcc], [item + '.GND', gnd]];

export const U3_LESSONS_3 = [
  // ============================================================ 40 active buzzer
  base(40, 'abuz', {
    module: 14, title: 'Active buzzer: a beep with one pin', level: 'Beginner', time: '15 min', file: 'ActiveBuzzer.ino',
    goal: 'Make an active buzzer beep with digitalWrite(), and see how it differs from the passive buzzer of Lesson 6.',
    hardware: ['Arduino UNO R3', 'Active buzzer (5 V type)', '220 Ω resistor', '2 × jumper wires', 'Breadboard'],
    widgets: ['audio', 'dv:abuz'], circuit: ABUZ, io: mio('abuz', 'bz1', ids(ABUZ), { D8: ['bz', ''] }),
    explain: { 1: 'The output pin. The 220 Ω resistor between the pin and the buzzer limits the current.', 4: 'The pin is an output.', 5: 'Serial output on.', 9: 'HIGH: the pin gives 5 V. The buzzer’s own circuit starts its oscillator and it <b>sounds</b>.', 10: 'Print a message so you can see the timing.', 11: 'Wait half a second.', 12: 'LOW: no voltage, no sound.', 13: 'Wait half a second.' },
    steps: [
      STEP('Active or passive?', 'bench', [], `<p>A <b>passive</b> buzzer (Lesson 6) is only a piezo disc: it makes a sound only when <code>tone()</code> sends it a square wave, and you choose the pitch.</p><p>An <b>active</b> buzzer has a small oscillator <b>inside</b>. Give it power and it beeps at one fixed pitch; take the power away and it is silent. One <code>digitalWrite()</code> is enough.</p><p class="warn">From outside they look alike. A reliable test: an active buzzer beeps when you connect it straight to a battery; a passive one only clicks.</p>`),
      STEP('The parts', 'bench', ['r1', 'bz1'], `<p>Resistor <b>c19 to c23</b>, buzzer with its <b>+</b> leg in <b>e23</b> and the other leg in <b>e26</b>. <b>Click the buzzer</b> in the 3D view.</p><ul><li>Active buzzers are polarised: the <b>+</b> mark on the case goes to the pin side.</li><li>Seller listings give a rated current of roughly 30 mA or less and a rated voltage of 3 to 5 V, but there is no standard datasheet: <b>read your own part’s page</b>.</li></ul><p class="warn">A pin should supply about 20 mA at most (the ATmega328P datasheet gives 40 mA as the absolute maximum). The 220 Ω resistor keeps the current safely low. If your buzzer is too quiet this way, drive it with a transistor (Lesson 24) instead.</p>`, { holes: ['c19', 'c23', 'e23 · +', 'e26'] }),
      STEP('Wire it', 'bench', ids(ABUZ), `<ul><li>Orange: <b>pin 8</b> → <b>a19</b></li><li>Black: <b>a26</b> → <b>GND</b></li></ul>`, { pins: ['D8', 'GND3'] }),
      STEP('The code', 'bench', ids(ABUZ), `<p>Click lines <b>9</b> and <b>12</b>. HIGH = sound, LOW = silence.</p>`, { showCode: true, power: true }),
      STEP('Run it and listen', 'bench', ids(ABUZ), `<p>Press <b>▶ Run</b> and switch the sound on in the panel. The buzzer beeps for half a second, then pauses. In the 3D view the buzzer shakes while it sounds.</p><p class="sim">The tone is made by your browser (about 2.5 kHz). A real active buzzer has its own fixed pitch that depends on the part.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', ids(ABUZ), `<ul><li>Active buzzer: built-in oscillator, fixed pitch, on/off with <code>digitalWrite()</code>.</li><li>Passive buzzer: you supply the frequency with <code>tone()</code>.</li><li>Limit the current with a resistor or drive it through a transistor.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does an active buzzer contain that a passive one does not?', a: ['An oscillator that makes the tone itself', 'A battery', 'A microphone', 'A relay'], c: 0, why: 'The oscillator inside makes the sound when power is applied.' },
      { q: 'You want a different pitch from the buzzer. Which type do you need?', a: ['A passive buzzer with tone()', 'An active buzzer with digitalWrite()', 'Either, with delay()', 'Neither'], c: 0, why: 'The active type has one fixed pitch.' },
      { q: 'Why is there a 220 Ω resistor?', a: ['To keep the pin current low', 'To raise the pitch', 'To make it louder', 'To store the sound'], c: 0, why: 'A pin supplies only a few tens of milliamps.' },
    ],
    sources: [S.dw, SRC.ds, SRC.atm],
  }),

  // ============================================================ 41 RC circuit
  base(41, 'rc', {
    module: 14, title: 'Capacitor: charging and discharging (RC circuit)', time: '25 min', file: 'RCCircuit.ino',
    goal: 'Charge and discharge a 100 µF capacitor through a 10 kΩ resistor, read its voltage with analogRead() and see the time constant τ = R × C.',
    hardware: ['Arduino UNO R3', '10 kΩ resistor', '100 µF electrolytic capacitor (16 V or more)', '3 × jumper wires', 'Breadboard'],
    widgets: ['dv:rc'], circuit: RC,
    io: { D8: { kind: 'dev:rc', role: 'drive', item: 'c1', r: 10000, c: 100e-6, needs: ids(RC), mp: '' }, A0: { kind: 'dev:rc', role: 'cap', item: 'c1', needs: ids(RC), mp: '' } },
    explain: { 1: 'This pin charges and discharges the capacitor through the resistor.', 2: 'The analog input measures the voltage across the capacitor. The ADC input draws almost no current, so it does not disturb the circuit.', 5: 'The drive pin is an output.', 6: 'Serial output on.', 10: 'HIGH: the pin is at 5 V and the capacitor charges through 10 kΩ.', 11: 'Take six readings, half a second apart…', 12: '…the voltage in volts: reading × 5 ÷ 1023.', 15: 'LOW: the pin is at 0 V and the capacitor discharges through the same resistor.' },
    steps: [
      STEP('A capacitor stores charge', 'bench', [], `<p>A capacitor can store electric charge. Its voltage cannot jump: to change it, current has to flow in or out, and through a resistor that takes time.</p><p class="formula">τ = R × C = 10 000 Ω × 0.0001 F = 1 s</p><p>After <b>one τ</b> a charging capacitor has reached about <b>63 %</b> of the final voltage, after <b>5 τ</b> about <b>99 %</b> (the standard result for an RC circuit).</p>`),
      STEP('The parts', 'bench', ['r1', 'c1'], `<p>Resistor <b>a5 to a10</b>. The capacitor: the <b>long leg (+)</b> in <b>d10</b>, the leg next to the <b>stripe with the “−” signs</b> in <b>d12</b>. <b>Click the capacitor</b>.</p><p class="warn">An electrolytic capacitor is <b>polarised</b>. Connected the wrong way round it can overheat and burst. The voltage rating (16 V) must be above the 5 V used here. The real value of such a capacitor can differ from the printed one by 20 % or more, so your measured τ will differ.</p>`, { holes: ['a5', 'a10', 'd10 · +', 'd12 · −'] }),
      STEP('Wire it', 'bench', ids(RC), `<ul><li>Orange: <b>pin 8</b> → <b>b5</b> (to the resistor)</li><li>Green: <b>c10</b> → <b>A0</b> (between the resistor and the capacitor)</li><li>Black: <b>b12</b> → <b>GND</b></li></ul>`, { pins: ['D8', 'A0', 'GND2'] }),
      STEP('The code', 'bench', ids(RC), `<p>Click lines <b>10</b> and <b>15</b>. HIGH charges, LOW discharges.</p>`, { showCode: true, power: true }),
      STEP('Run it and watch the curve', 'bench', ids(RC), `<p>Press <b>▶ Run</b>. The graph shows the voltage rising like a curve and then falling back. The dashed lines mark τ, 2τ, 3τ … Check that the voltage is near 3.2 V after 1 s (63 % of 5 V).</p><p class="sim">The simulation uses the ideal values 10 kΩ and 100 µF. Your parts will give a slightly different time.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', ids(RC), `<ul><li>τ = R × C is the time scale of an RC circuit.</li><li>Charging: 63 % after τ, about 99 % after 5τ. Discharging: 37 % left after τ.</li><li>Electrolytic capacitors have a <b>+</b> and a <b>−</b> leg; never reverse them.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'R = 10 kΩ and C = 100 µF. What is τ?', a: ['1 second', '1 millisecond', '10 seconds', '100 seconds'], c: 0, why: '10 000 × 0.0001 = 1 s.' },
      { q: 'Roughly what fraction of the final voltage is reached after one τ while charging?', a: ['63 %', '10 %', '99 %', '50 %'], c: 0, why: '1 − e⁻¹ ≈ 0.63.' },
      { q: 'What happens if an electrolytic capacitor is connected backwards?', a: ['It can overheat and burst', 'Nothing', 'It charges faster', 'It becomes a resistor'], c: 0, why: 'It is polarised.' },
    ],
    sources: [S.rcsrc, SRC.atm, SRC.ar],
  }),

  // ============================================================ 42 three switches
  base(42, 'swt', {
    module: 14, title: 'Slide, reed and tilt switches', time: '25 min', file: 'ThreeSwitches.ino',
    goal: 'Read three kinds of switch: a slide switch (SPDT), a reed switch operated by a magnet and a tilt switch.',
    hardware: ['Arduino UNO R3', 'Slide switch (SPDT, 3 legs)', 'Reed switch with a magnet', 'Tilt switch (ball type)', '8 × jumper wires', 'Breadboard'],
    widgets: ['dv:swt'], circuit: SWT,
    io: mio('swt', 'ssw1', ids(SWT), { D2: ['slide', '', 'ssw1'], D3: ['reed', '', 'reed1'], D4: ['tilt', '', 'tilt1'] }),
    explain: { 1: 'The slide switch is on pin 2.', 2: 'The reed switch is on pin 3.', 3: 'The tilt switch is on pin 4.', 6: 'A slide switch connects the pin to 5 V or to GND all the time, so a plain INPUT is enough.', 7: 'A reed switch only <b>closes</b> to GND, or is open. INPUT_PULLUP gives the open state a defined HIGH.', 8: 'The tilt switch is the same: closed = LOW, open = HIGH.', 14: 'The slide switch reads HIGH on one side and LOW on the other.', 16: 'The reed switch reads <b>0 (LOW)</b> when the magnet is close, 1 when it is away.', 18: 'The tilt switch reads 0 when its contacts are closed by the ball.' },
    steps: [
      STEP('Three ways to switch', 'bench', [], `<p>A <b>slide switch</b> (SPDT: single pole, double throw) connects its middle leg to one of two outer legs. A <b>reed switch</b> is two thin metal contacts in a glass capsule that a magnet pulls together. A <b>tilt switch</b> has a small metal ball (or other conductor) that closes two contacts when the part is tilted.</p><p>All three end up as “pin connected to something” or not. The difference is how you wire them.</p>`),
      STEP('The parts', 'bench', ['ssw1', 'reed1', 'tilt1'], `<p>Slide switch in <b>e5, e6, e7</b>. Reed switch in <b>e12</b> and <b>e17</b>. Tilt switch in <b>e22</b> and <b>e23</b>. <b>Click each one</b> in the 3D view.</p><p class="warn">Tilt switches differ: some conduct in one position only, some are mercury types (which you should avoid). Read the data of your own part.</p>`, { holes: ['e5', 'e6 · middle', 'e7', 'e12', 'e17', 'e22', 'e23'] }),
      STEP('Wire it', 'bench', ids(SWT), `<ul><li>Slide switch: black <b>a5</b> → <b>GND</b>, red <b>a7</b> → <b>5V</b>, yellow <b>a6</b> → <b>pin 2</b> (the middle leg is the one that goes to the pin)</li><li>Reed switch: black <b>a12</b> → <b>GND</b>, green <b>a17</b> → <b>pin 3</b></li><li>Tilt switch: black <b>a22</b> → <b>GND</b>, blue <b>a23</b> → <b>pin 4</b></li></ul>`, { pins: ['D2', '5V', 'D3', 'D4', 'GND2', 'GND3'] }),
      STEP('The code', 'bench', ids(SWT), `<p>Click lines <b>6</b>, <b>7</b> and <b>8</b> and compare the pin modes.</p>`, { showCode: true, power: true }),
      STEP('Run it and use the switches', 'bench', ids(SWT), `<p>Press <b>▶ Run</b>, then use the three buttons in the panel (or compare the 3D parts: the slide knob moves, a magnet appears over the reed switch, the tilt switch leans). Watch the three numbers change in the Serial monitor.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', ids(SWT), `<ul><li>Slide switch (SPDT): pin always connected to 5 V or GND → <code>INPUT</code>.</li><li>Reed and tilt switch: open/closed only → <code>INPUT_PULLUP</code>, closed = LOW.</li><li>A reed switch reacts to a magnet, a tilt switch to the angle.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'The reed switch is wired between the pin and GND with INPUT_PULLUP. The magnet is close. What does digitalRead() return?', a: ['LOW (0)', 'HIGH (1)', 'Random', 'Nothing'], c: 0, why: 'Closed contacts connect the pin to GND.' },
      { q: 'Why does the slide switch not need a pull-up?', a: ['It always connects the pin to either 5 V or GND', 'It has a built-in resistor', 'It is analog', 'It uses I²C'], c: 0, why: 'The pin is never left floating.' },
      { q: 'What operates a reed switch?', a: ['A magnetic field', 'Light', 'Sound', 'Heat'], c: 0, why: 'The magnet pulls the two contacts together.' },
    ],
    sources: [SRC.pinmode, SRC.ds, SRC.atm],
  }),

  // ============================================================ 43 seven segment
  base(43, 'seg7', {
    module: 14, title: '7-segment display: count from 0 to 9', time: '30 min', file: 'SevenSegment.ino',
    goal: 'Light the segments of a common-cathode 7-segment display to show the digits 0 to 9.',
    hardware: ['Arduino UNO R3', '7-segment display 5161AS (common cathode) on its breakout board', '7 × 220 Ω resistors', '15 × jumper wires', 'Breadboard'],
    widgets: ['dv:seg7'], circuit: SEG, io: mio('seg7', 'seg1', ids(SEG), { D2: ['a', ''], D3: ['b', ''], D4: ['c', ''], D5: ['d', ''], D6: ['e', ''], D7: ['f', ''], D8: ['g', ''] }),
    explain: { 1: 'The seven pins that drive segments a to g, in order.', 2: 'One byte per digit. Bit 0 is segment a, bit 6 is segment g; a 1 lights the segment.', 3: 'Digit 0 lights a, b, c, d, e and f: bits 0 to 5.', 12: 'Digit 9.', 16: 'All seven segment pins are outputs.', 21: 'Digits 0 to 9 in turn.', 22: 'For each segment, take its bit from the digit byte and write it to the pin: <code>(digits[d] >> s) & 1</code>.', 24: 'Wait 0.8 s so you can read the digit.' },
    steps: [
      STEP('Seven LEDs in one case', 'dispq', [], `<p>A 7-segment display is <b>eight LEDs</b> in one case: seven bars (a to g) and a decimal point (dp). In a <b>common-cathode</b> display all the cathodes are joined to one pin (COM), which goes to GND. A segment lights when its own pin is <b>HIGH</b>.</p><p>Each segment needs its own resistor, as a normal LED does.</p>`),
      STEP('The display', 'dispq', ['seg1'], `<p><b>Click the display</b> in the 3D view.</p><ul><li>5161AS datasheet: common cathode, red, forward voltage 2.1 V typical (2.5 V maximum) at 20 mA.</li><li>On this breakout board the nine pins are labelled <b>A B C D E F G DP COM</b>.</li><li>A <b>common-anode</b> display (5161BS) works the other way round: COM goes to 5 V and the segment pins go LOW to light.</li></ul>`),
      STEP('Wire it', 'dispq', ids(SEG), `<p>Each segment pin goes through its own 220 Ω resistor (on the breadboard) to a pin of the board: segment <b>A → pin 2</b>, <b>B → pin 3</b>, <b>C → pin 4</b>, <b>D → pin 5</b>, <b>E → pin 6</b>, <b>F → pin 7</b>, <b>G → pin 8</b>. <b>COM</b> goes to <b>GND</b>. The decimal point (DP) is not used.</p><p>With a 5 V pin and 220 Ω a segment gets about (5 − 2.1) ÷ 220 ≈ 13 mA.</p>`, { pins: ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'GND2'] }),
      STEP('The code', 'dispq', ids(SEG), `<p>Click line <b>3</b> (the pattern of the digit 0) and line <b>22</b> (it copies the pattern to the pins).</p>`, { showCode: true, power: true }),
      STEP('Run it and count', 'dispq', ids(SEG), `<p>Press <b>▶ Run</b>. The display counts 0 to 9 and starts again. The panel names the segments that are lit.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(SEG), `<ul><li>Common cathode: COM to GND, segment HIGH = lit. Common anode is the opposite.</li><li>One resistor per segment.</li><li>A table of bit patterns turns a digit into seven pin levels.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'A common-cathode display: which level lights a segment?', a: ['HIGH on the segment pin', 'LOW on the segment pin', 'A PWM signal only', 'COM must be HIGH'], c: 0, why: 'COM is at GND, so the segment pin must be higher.' },
      { q: 'Which segments form the digit 1?', a: ['b and c', 'a and d', 'e and f', 'only g'], c: 0, why: 'The two right-hand bars.' },
      { q: 'Why one resistor per segment?', a: ['Each segment is an LED that needs its own current limit', 'To change the colour', 'To slow the count', 'The library requires it'], c: 0, why: 'Without it the current is not limited.' },
    ],
    sources: [SRC.ds, SRC.ref, SRC.atm],
  }),

  // ============================================================ 44 interrupts
  base(44, 'irq', {
    module: 15, title: 'Interrupts: react to a button at once', time: '25 min', file: 'ButtonInterrupt.ino',
    goal: 'Use attachInterrupt() on pin 2 so a button press runs a function immediately, even while loop() is busy, and see why contact bounce matters.',
    hardware: ['Arduino UNO R3', 'The LED circuit of Lesson 4', 'Push button (4 legs)', '2 × jumper wires'],
    widgets: ['button', 'dv:irq'], circuit: [...LED_CIRCUIT, ...BTN2], io: { D5: IO_LED, D2: { kind: 'button', item: 'btn1', needs: ids(BTN2) } },
    explain: { 1: 'On the UNO R3 only <b>pins 2 and 3</b> can be used for <code>attachInterrupt()</code>.', 3: '<b>volatile</b> tells the compiler that an interrupt can change the variable at any moment.', 6: 'The <b>interrupt service routine</b> (ISR). It runs when the pin changes, no matter what loop() is doing. Keep it short.', 7: 'Count the press.', 8: 'Tell loop() that something happened.', 12: 'The button is wired to GND, so the pin needs the pull-up.', 15: 'Run onPress() on the <b>FALLING</b> edge: HIGH to LOW, i.e. when the button is pressed.', 20: 'A 2-byte <code>int</code> is read in two steps on the 8-bit AVR, so interrupts are switched off while we copy it.', 24: 'Odd count: LED on; even count: LED off.' },
    steps: [
      STEP('Polling versus interrupts', 'bench', [], `<p>So far the sketch <b>asked</b> the button in loop() (polling). If loop() is busy, for example in a long <code>delay()</code>, a short press can be missed.</p><p>An <b>interrupt</b> makes the processor stop what it is doing, run a small function, and go back. The ATmega328P of the UNO R3 has two external interrupt pins, <b>2 and 3</b> (INT0 and INT1), plus pin-change interrupts on others.</p>`),
      STEP('The circuit', 'bench', [...LED_IDS, ...ids(BTN2)], `<p>The LED circuit of Lesson 4 on pin 5, and the push button between <b>pin 2</b> and GND. The button needs the internal pull-up: released = HIGH, pressed = LOW.</p><ul><li>Blue: <b>pin 2</b> → <b>a20</b></li><li>Black: <b>j22</b> → <b>GND</b></li></ul>`, { pins: ['D2', 'GND3'] }),
      STEP('The code', 'bench', [...LED_IDS, ...ids(BTN2)], `<p>Click lines <b>6</b> to <b>8</b> (the ISR) and line <b>15</b> (which connects it to pin 2).</p><p class="warn">In an ISR do not use <code>delay()</code>, and do not print: keep it to a few instructions and set flags.</p>`, { showCode: true, power: true }),
      STEP('Run it and press', 'bench', [...LED_IDS, ...ids(BTN2)], `<p>Press <b>▶ Run</b>, then press the button (in the panel or in the 3D view). Each press toggles the LED and prints the count.</p><p>Now switch <b>“Contact bounce”</b> on and press again. A real switch does not close cleanly: its contacts bounce for a few milliseconds, and the interrupt can fire several times for one press. The count jumps by more than one. The cure is a debounce: ignore edges that come within about 20 ms of the last one (compare <code>millis()</code> inside the ISR) or add a small capacitor.</p><p class="sim">The bounce here is simulated with random short bursts. Real bounce time depends on the switch.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', [...LED_IDS, ...ids(BTN2)], `<ul><li>UNO R3 external interrupts: pins 2 and 3. Modes: LOW, CHANGE, RISING, FALLING.</li><li>Share data with <code>volatile</code> variables; keep the ISR short.</li><li>Real buttons bounce: debounce them.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which UNO R3 pins support attachInterrupt()?', a: ['2 and 3', '0 and 1', '5 and 6', 'All digital pins'], c: 0, why: 'INT0 and INT1 are on pins 2 and 3.' },
      { q: 'Why is the variable shared with the ISR declared volatile?', a: ['It can change at any time, outside the normal program flow', 'To save memory', 'To make it faster', 'To make it constant'], c: 0, why: 'The compiler must not cache it.' },
      { q: 'What is contact bounce?', a: ['A switch’s contacts open and close several times when pressed', 'A button that is too loud', 'A pull-up resistor', 'A software bug in the library'], c: 0, why: 'Mechanical contacts rebound for some milliseconds.' },
    ],
    sources: [S.irq, SRC.atm, SRC.pinmode],
  }),

  // ============================================================ 45 timer interrupt
  base(45, 'timer', {
    module: 15, title: 'Timer interrupt: a blink that never stops', time: '20 min', file: 'TimerBlink.ino',
    goal: 'Use the TimerOne library to run a function every 0.5 s, independent of what loop() is doing.',
    hardware: ['Arduino UNO R3', 'The LED circuit of Lesson 4', 'TimerOne library'],
    widgets: [], circuit: LED_CIRCUIT, io: { D5: IO_LED },
    explain: { 1: 'The TimerOne library controls the 16-bit hardware Timer1 of the ATmega328P.', 4: 'Changed inside the interrupt, so <b>volatile</b>.', 7: 'This function runs every time the timer expires.', 8: 'Toggle the LED state.', 10: 'Count the interrupts.', 16: 'Set the period in <b>microseconds</b>: 500 000 µs = 0.5 s.', 17: 'Call timerISR() at the end of every period.', 25: 'loop() is busy with a 2 s delay, yet the LED keeps blinking every 0.5 s.' },
    steps: [
      STEP('Time without delay()', 'bench', [], `<p>A <code>delay()</code> stops the sketch. A hardware <b>timer</b> keeps counting by itself and can interrupt the program at regular intervals. The ATmega328P has three timers; Timer1 is the 16-bit one. The <b>TimerOne</b> library makes it easy.</p><p class="warn">Using Timer1 takes away the PWM function of pins <b>9 and 10</b> (<code>analogWrite()</code> on them). Install the TimerOne library with the Library Manager.</p>`),
      STEP('The circuit', 'bench', LED_IDS, `<p>The LED circuit of Lesson 4 (LED on pin 5). Nothing else is needed.</p>`),
      STEP('The code', 'bench', LED_IDS, `<p>Click lines <b>16</b> and <b>17</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'bench', LED_IDS, `<p>Press <b>▶ Run</b>. The LED toggles every 0.5 s while loop() only prints every 2 s. The printed number is the count of timer interrupts so far (4 per 2 s).</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', LED_IDS, `<ul><li><code>Timer1.initialize(µs)</code> sets the period; <code>Timer1.attachInterrupt(f)</code> sets the function.</li><li>The ISR runs even while loop() waits.</li><li>Timer1 PWM on pins 9 and 10 stops working.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Timer1.initialize(250000) gives a period of…', a: ['0.25 s', '250 s', '25 ms', '2.5 s'], c: 0, why: 'The unit is microseconds.' },
      { q: 'What does using Timer1 disable?', a: ['analogWrite() on pins 9 and 10', 'Serial', 'digitalWrite()', 'Pin 13'], c: 0, why: 'Those PWM outputs use Timer1.' },
      { q: 'Why does the LED keep blinking during delay(2000)?', a: ['The interrupt is run by the hardware timer', 'delay() is short', 'The LED has memory', 'It does not'], c: 0, why: 'Interrupts run while loop() waits.' },
    ],
    sources: [S.timer1, SRC.atm, S.irq],
  }),

  // ============================================================ 46 EEPROM
  base(46, 'eeprom', {
    module: 15, title: 'EEPROM: a memory that survives power-off', level: 'Beginner', time: '15 min', file: 'EepromCounter.ino',
    goal: 'Store a number in the EEPROM so that it is still there after the board restarts.',
    hardware: ['Arduino UNO R3'],
    widgets: ['dv:eeprom'], circuit: [], io: {},
    explain: { 1: 'The EEPROM library is built into the Arduino IDE.', 3: 'The address of the byte we use: 0 to 1023 on the ATmega328P.', 7: 'Read one byte.', 8: 'A fresh EEPROM contains 255 (0xFF) in every byte, so treat 255 as “never written”.', 9: 'Count this start.', 10: '<b>update()</b> writes only when the value is different, which saves write cycles.' },
    steps: [
      STEP('Memory that remembers', 'bench', [], `<p>Variables are lost when the power is off. The ATmega328P also has <b>1024 bytes of EEPROM</b>, which keeps its contents without power. Use it for settings and counters.</p><p class="warn">Each cell is specified for about <b>100 000 write/erase cycles</b> (ATmega328P datasheet). Never write to it in a fast loop. <code>update()</code> avoids needless writes.</p>`),
      STEP('The code', 'bench', [], `<p>No wiring is needed. Click lines <b>7</b> to <b>10</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it several times', 'bench', [], `<p>Press <b>▶ Run</b>, stop, and run again: the count goes up every time because it is read from the EEPROM. The panel shows the first bytes. Reload the page and run once more: the value is still there.</p><p class="sim">The simulation keeps the 1024 bytes in your browser’s storage so that they survive a reload, like the chip keeps them without power. Use “Erase” to go back to 255.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', [], `<ul><li>1024 bytes on the ATmega328P; <code>EEPROM.read(addr)</code> and <code>EEPROM.update(addr, value)</code>.</li><li>A new EEPROM reads 255.</li><li>About 100 000 writes per cell: do not write in a fast loop.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does a fresh, never-written EEPROM byte contain?', a: ['255 (0xFF)', '0', 'A random value', '1'], c: 0, why: 'Erased cells read as all ones.' },
      { q: 'Why use update() instead of write()?', a: ['It writes only if the value changed, saving write cycles', 'It is faster to type', 'It writes two bytes', 'It encrypts the value'], c: 0, why: 'Fewer writes means a longer life.' },
      { q: 'How many bytes of EEPROM does the ATmega328P have?', a: ['1024', '32', '2048 × 1024', '256'], c: 0, why: 'See the datasheet.' },
    ],
    sources: [S.eeprom, SRC.atm],
  }),

  // ============================================================ 47 MAX7219
  base(47, 'max7219', {
    module: 16, title: 'MAX7219 LED matrix: a picture on 64 LEDs (SPI-style bus)', time: '30 min', file: 'MatrixMax7219.ino',
    goal: 'Draw a picture on an 8×8 LED matrix driven by a MAX7219, and understand how three wires (DIN, CLK, CS) carry the data.',
    hardware: ['Arduino UNO R3', 'MAX7219 8×8 LED matrix module', '5 × female jumper wires', 'LedControl library'],
    widgets: ['dv:max7219'], circuit: MX, io: mio('max7219', 'mx1', ids(MX), { D11: ['din', 'DIN'], D10: ['cs', 'CS'], D13: ['clk', 'CLK'] }, pw('mx1', '5V')),
    explain: { 1: 'The LedControl library speaks the MAX7219 serial protocol.', 3: 'Data in: the bits go out on this pin.', 4: 'Clock: each bit is accepted on the clock edge.', 5: 'Chip select (also called LOAD): the chip keeps the message when this pin goes from LOW to HIGH.', 6: 'One MAX7219 on the chain. The constructor already sets the chip up and puts it in shutdown mode.', 8: 'The picture: one byte per row, the leftmost LED is bit 7.', 14: 'The chip starts in shutdown mode: wake it up first.', 15: 'Brightness from 0 to 15.', 16: 'Clear all rows.', 17: 'Send each row: the library writes register row + 1.', 22: 'Change the brightness in 16 steps.' },
    steps: [
      STEP('A chip that does the multiplexing', 'dispq', [], `<p>Sixty-four LEDs would need 64 pins. The <b>MAX7219</b> chip drives them itself: it scans the rows and columns, and sets the current for each LED. The Arduino only sends it a short message when the picture changes.</p><p>A message is <b>16 bits</b>: 8 bits for the register (the row number, or a setting) and 8 bits for the data. The bits are sent most significant bit first on <b>DIN</b>, each one with a pulse on <b>CLK</b>; <b>CS</b> LOW to HIGH tells the chip to take the message. This is the idea of a synchronous serial bus such as SPI. (This library sends the bits itself with ordinary pins; a real SPI peripheral would do the same job faster.)</p>`),
      STEP('The module', 'dispq', ['mx1'], `<p><b>Click the module</b>.</p><ul><li>Supply 4.0 to 5.5 V (datasheet).</li><li>After power-up the chip is in <b>shutdown mode</b> and the display is blank until you write the shutdown register.</li><li>The pin order on your module may differ: read the printing.</li></ul>`),
      STEP('Wire it', 'dispq', ids(MX), `<ul><li><b>VCC → 5V</b>, <b>GND → GND</b></li><li><b>DIN → pin 11</b>, <b>CS → pin 10</b>, <b>CLK → pin 13</b></li></ul>`, { pins: ['5V', 'GND2', 'D11', 'D10', 'D13'] }),
      STEP('The code', 'dispq', ids(MX), `<p>Click lines <b>9</b> and <b>10</b> (the picture as bits), line <b>14</b> (wake up) and line <b>17</b> (send the rows).</p>`, { showCode: true, power: true }),
      STEP('Run it', 'dispq', ids(MX), `<p>Press <b>▶ Run</b>. A smiley face appears and gets brighter in 16 steps. The panel lists the messages the chip received: first the setup of the constructor, then your rows.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(MX), `<ul><li>MAX7219: 3 data wires for 64 LEDs; messages of address + data.</li><li>Wake it with <code>shutdown(0, false)</code>; brightness 0 to 15.</li><li>Each byte is one row; each bit one LED.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'How many bits are in one MAX7219 message?', a: ['16', '8', '64', '1'], c: 0, why: '8 address bits and 8 data bits (datasheet).' },
      { q: 'The display stays dark after power-up. What do you check first?', a: ['That the chip has been taken out of shutdown mode', 'The IDE version', 'The USB cable colour', 'Nothing'], c: 0, why: 'The chip starts in shutdown mode.' },
      { q: 'What does CS going from LOW to HIGH do?', a: ['Makes the chip take the 16 bits it received', 'Resets the Arduino', 'Turns off the LEDs', 'Sets the brightness to 15'], c: 0, why: 'It latches the message.' },
    ],
    sources: [S.max, S.ledctl, SRC.ds],
  }),

  // ============================================================ 48 TFT
  base(48, 'tft', {
    module: 16, title: 'Colour TFT display (ST7735) on the SPI bus', time: '35 min', file: 'TftDemo.ino',
    goal: 'Draw text, a frame, a progress bar and a circle on a 1.8 inch 128×160 colour display.',
    hardware: ['Arduino UNO R3', '1.8 inch ST7735 TFT module (128×160)', '8 × female jumper wires', 'Adafruit GFX and Adafruit ST7735 libraries'],
    widgets: ['dv:tft'], circuit: TFT, io: mio('tft', 'tf1', ids(TFT), { D13: ['sck', 'SCK'], D11: ['sda', 'SDA'], D8: ['res', 'RES'], D9: ['dc', 'DC'], D10: ['cs', 'CS'] }, pw('tf1', '5V')),
    explain: { 8: 'The display object: chip select, data/command and reset pins. The data pins are the hardware SPI pins: MOSI = 11, SCK = 13.', 10: 'The width of the progress bar.', 13: 'Initialise the controller. <code>INITR_BLACKTAB</code> must match the tab colour of your module (black, green or red).', 14: 'Fill the whole screen with black.', 15: 'Text size 2: every character is twice the size of the basic 5×7 font.', 16: 'Colours are 16-bit values (RGB565).', 17: 'Where the text starts: x = 8, y = 8.', 18: 'Print text on the screen.', 19: 'A white frame for the bar.', 23: 'Make the bar longer in steps of 8 pixels.', 24: 'Erase the old bar…', 25: '…and draw the new one in green.', 26: 'A filled red circle.' },
    steps: [
      STEP('A display with its own memory', 'dispq', [], `<p>A TFT display like this has a controller chip (ST7735) that keeps the picture in its own memory. The Arduino only sends drawing commands over <b>SPI</b> (a fast serial bus with a clock wire SCK, a data wire MOSI, and a chip-select wire CS), plus a <b>DC</b> pin that tells the display whether a byte is a command or pixel data.</p><p>Colours are 16 bits per pixel (RGB565): 5 bits red, 6 green, 5 blue.</p>`),
      STEP('The module', 'dispq', ['tf1'], `<p><b>Click the module</b>.</p><p class="warn">The ST7735 chip itself works at 3.3 V. Breakouts such as Adafruit’s 1.8" TFT include a regulator and level shifters so that they accept 5 V; plain cheap modules differ. <b>Check the page of your own module</b> before you connect 5 V to VCC and the signals. Pin order also varies.</p>`),
      STEP('Wire it', 'dispq', ids(TFT), `<ul><li><b>GND → GND</b>, <b>VCC → 5V</b></li><li><b>SCK → pin 13</b>, <b>SDA → pin 11</b> (this is the MOSI line)</li><li><b>RES → pin 8</b>, <b>DC → pin 9</b>, <b>CS → pin 10</b></li><li><b>BL → 3V3</b> (backlight)</li></ul>`, { pins: ['GND2', '5V', 'D13', 'D11', 'D8', 'D9', 'D10', '3V3'] }),
      STEP('The code', 'dispq', ids(TFT), `<p>Click line <b>13</b> (start the controller) and lines <b>24</b> to <b>26</b> (drawing).</p>`, { showCode: true, power: true }),
      STEP('Run it', 'dispq', ids(TFT), `<p>Press <b>▶ Run</b>. The title appears, then a bar grows, restarts, and the red circle stays.</p><p class="sim">The text in the picture uses a similar font, not exactly the library font. Colours and positions follow the commands.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(TFT), `<ul><li>SPI: SCK, MOSI, CS (plus DC and RES for this display).</li><li>The pixel memory is in the display; draw only what changes (erase the old bar, draw the new one).</li><li>Check the voltage rules of your module.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which two UNO R3 pins carry the SPI clock and data (MOSI) to the display?', a: ['13 and 11', '2 and 3', 'A4 and A5', '0 and 1'], c: 0, why: 'SCK is pin 13 and MOSI is pin 11 on the UNO R3.' },
      { q: 'What is the DC pin for?', a: ['It tells the display whether a byte is a command or pixel data', 'Direct current supply', 'The backlight', 'The clock'], c: 0, why: 'Data/command select.' },
      { q: 'Why erase the old bar before drawing the new one?', a: ['The display keeps the old pixels until you draw over them', 'To save power', 'To reset the Arduino', 'It is not necessary'], c: 0, why: 'The picture stays in the display memory.' },
    ],
    sources: [S.tftguide, S.st7735, SRC.ds],
  }),

  // ============================================================ 49 RFID
  base(49, 'rfid', {
    module: 16, title: 'RFID reader RC522: read a card number', time: '30 min', file: 'RfidReader.ino',
    goal: 'Read the unique number (UID) of an RFID card or tag with the MFRC522 chip over SPI.',
    hardware: ['Arduino UNO R3', 'RC522 RFID module with a card or tag', '7 × female jumper wires', 'MFRC522 library (miguelbalboa)'],
    widgets: ['dv:rfid'], circuit: RFID, io: mio('rfid', 'rf1', ids(RFID), { D10: ['ss', 'SDA'], D9: ['rst', 'RST'], D11: ['mosi', 'MOSI'], D12: ['miso', 'MISO'], D13: ['sck', 'SCK'] }, [['rf1.3V3', '3V3'], ['rf1.GND', 'GND']]),
    explain: { 6: 'The reader object: SS (chip select) pin 10 and reset pin 9.', 10: 'Start the SPI bus.', 11: 'Start the reader chip.', 16: 'Is a new card in the field, and can its number be read? If not, leave loop() and try again.', 18: 'A UID has 4, 7 or 10 bytes.', 19: 'Print a leading zero for small bytes…', 20: '…and the byte in hexadecimal.', 23: 'Stop talking to this card, so it is not read again and again.' },
    steps: [
      STEP('Cards without contact', 'dispq', [], `<p>The RC522 module contains the <b>MFRC522</b> chip and a printed antenna. It sends a 13.56 MHz field; a passive card or tag takes its power from that field and answers with its <b>UID</b>, a unique number.</p><p class="warn">The reader’s UID is useful as a key, but it can be copied. It is not a secure password on its own.</p>`),
      STEP('The module', 'dispq', ['rf1'], `<p><b>Click the module</b>.</p><ul><li>Datasheet: carrier 13.56 MHz, supply 2.5 to 3.3 V: use the <b>3V3</b> pin, never 5 V.</li><li>Reading distance: a few centimetres.</li></ul><p class="warn">The UNO R3 drives the SPI lines at 5 V, but the chip is a 3.3 V part. Many tutorials connect them directly, which is outside what the datasheet promises: a level shifter (or resistor dividers) is the safe choice.</p>`),
      STEP('Wire it', 'dispq', ids(RFID), `<ul><li><b>3V3 → 3V3</b>, <b>GND → GND</b></li><li><b>SDA → pin 10</b> (this pin is the chip select here), <b>RST → pin 9</b></li><li><b>MOSI → pin 11</b>, <b>MISO → pin 12</b>, <b>SCK → pin 13</b></li></ul>The <b>IRQ</b> pin stays unconnected.`, { pins: ['3V3', 'GND2', 'D10', 'D9', 'D11', 'D12', 'D13'] }),
      STEP('The code', 'dispq', ids(RFID), `<p>Click lines <b>16</b> and <b>18</b> to <b>20</b>. Install the library with the Library Manager (“MFRC522”).</p>`, { showCode: true, power: true }),
      STEP('Run it and hold a card near', 'dispq', ids(RFID), `<p>Press <b>▶ Run</b>, then use <b>Card A near</b> or <b>Card B near</b> in the panel. The UID is printed once per presentation. Take the card away and bring it back to read it again.</p><p class="sim">The two UIDs in the simulation are made up. A real card has its own number.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(RFID), `<ul><li>RC522: SPI device, 3.3 V supply, 13.56 MHz.</li><li><code>PICC_IsNewCardPresent()</code> and <code>PICC_ReadCardSerial()</code> give the UID in <code>rfid.uid</code>.</li><li>A UID identifies a card but is not secret.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which supply does the RC522 chip need?', a: ['About 3.3 V', '12 V', '5 V only', 'No supply'], c: 0, why: 'The datasheet gives 2.5 to 3.3 V.' },
      { q: 'What is a UID?', a: ['The unique number of a card', 'A password you choose', 'The reader’s address', 'A kind of antenna'], c: 0, why: 'It identifies the card.' },
      { q: 'Why call PICC_HaltA() after reading?', a: ['So the same card is not read again and again', 'To turn off the reader', 'To erase the card', 'To save power in the card'], c: 0, why: 'A halted card is ignored until it leaves the field.' },
    ],
    sources: [S.mfrc, S.mfrclib, SRC.ds],
  }),

  // ============================================================ 50 SD card
  base(50, 'sd', {
    module: 16, title: 'microSD card: write a log file', time: '30 min', file: 'SdLogger.ino',
    goal: 'Append a line to a text file on a microSD card every two seconds, and read the card on a computer afterwards.',
    hardware: ['Arduino UNO R3', 'microSD card module (SPI)', 'microSD card, FAT16 or FAT32', '6 × female jumper wires'],
    widgets: ['dv:sd'], circuit: SD, io: mio('sd', 'sd1', ids(SD), { D10: ['cs', 'CS'], D11: ['mosi', 'MOSI'], D12: ['miso', 'MISO'], D13: ['sck', 'SCK'] }, pw('sd1', '5V')),
    explain: { 4: 'The chip-select pin of the card module.', 9: '<code>SD.begin()</code> starts the card. It returns false if there is no card or the wiring is wrong.', 11: 'Stop here if the card is missing.', 17: 'Open (or create) the file for writing. New data is added at the end.', 19: 'Write text…', 20: '…and the number plus a line break.', 21: '<b>close()</b> makes sure the data is really written to the card. Never skip it.' },
    steps: [
      STEP('Files for a microcontroller', 'dispq', [], `<p>An SD card module lets the Arduino keep data that is far bigger than the EEPROM, and in a format that a computer can read. The Arduino <b>SD</b> library supports <b>FAT16 and FAT32</b>; file names use the old 8.3 style (<code>LOG.TXT</code>).</p><p class="warn">Cards of 64 GB or more are usually formatted exFAT: reformat them to FAT32 or use a smaller card.</p>`),
      STEP('The module', 'dispq', ['sd1'], `<p><b>Click the module</b>. The SPI pins of the UNO R3 are fixed: MOSI = 11, MISO = 12, SCK = 13. The chip-select pin is chosen in the sketch (here 10).</p><p class="warn">A card works at 3.3 V. Modules with a regulator and level shifters accept 5 V logic; a bare socket does not. Check yours.</p>`),
      STEP('Wire it', 'dispq', ids(SD), `<ul><li><b>VCC → 5V</b>, <b>GND → GND</b></li><li><b>MISO → pin 12</b>, <b>MOSI → pin 11</b>, <b>SCK → pin 13</b>, <b>CS → pin 10</b></li></ul>`, { pins: ['5V', 'GND2', 'D12', 'D11', 'D13', 'D10'] }),
      STEP('The code', 'dispq', ids(SD), `<p>Click lines <b>9</b> and <b>17</b> to <b>21</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'dispq', ids(SD), `<p>Press <b>▶ Run</b>. Every two seconds a line is added to <code>LOG.TXT</code>; the panel shows the file. Use <b>“Card: removed”</b> and run again to see the error path. Run the sketch again with the card inserted: the counter starts at 0 again, but the new lines are added after the old ones, because the file is opened for appending.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(SD), `<ul><li>SD library: <code>SD.begin(cs)</code>, <code>SD.open(name, FILE_WRITE)</code>, <code>print()</code>, <code>close()</code>.</li><li>FAT16/FAT32 cards, 8.3 file names.</li><li>Always <code>close()</code> (or <code>flush()</code>) so the data is written.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does SD.begin() return if no card is inserted?', a: ['false', 'true', 'The card size', 'Nothing'], c: 0, why: 'The initialisation fails.' },
      { q: 'Why call f.close()?', a: ['To make sure the data is written to the card', 'To eject the card', 'To format the card', 'To start the clock'], c: 0, why: 'Unwritten data can be lost.' },
      { q: 'Which UNO R3 pin is MISO?', a: ['12', '10', '11', '13'], c: 0, why: 'MISO 12, MOSI 11, SCK 13.' },
    ],
    sources: [S.sdlib, SRC.ds],
  }),

  // ============================================================ 51 gas
  base(51, 'gas', {
    module: 17, title: 'MQ-2 gas sensor: smoke and combustible gas', time: '25 min', file: 'GasSensor.ino',
    goal: 'Read the analog and digital outputs of an MQ-2 module and print a warning when the level is high.',
    hardware: ['Arduino UNO R3', 'MQ-2 gas sensor module (AO and DO)', '4 × female jumper wires'],
    widgets: ['dv:gas'], circuit: GAS, io: mio('gas', 'gs1', ids(GAS), { A0: ['ao', 'AO'], D2: ['do', 'DO'] }, pw('gs1', '5V')),
    explain: { 1: 'The analog output AO.', 2: 'The digital output DO: it switches when the level passes the trimmer setting on the module.', 3: 'Your alarm threshold. Choose it after you measured clean air with your own sensor.', 9: 'The heating element needs time to reach its working temperature.', 13: 'The raw level, 0 to 1023.', 16: 'Warn above the threshold.', 18: 'The comparator output, 0 or 1.' },
    steps: [
      STEP('A sensor that needs heat', 'dispq', [], `<p>The MQ-2 has a tin-oxide element that a small <b>heater</b> keeps hot. Combustible gases and smoke change the element’s resistance, and the module turns that into a voltage on <b>AO</b>. A comparator (the trimmer sets the level) also gives a digital output <b>DO</b>.</p><p class="warn">It reacts to LPG, propane, methane, hydrogen, alcohol and smoke and <b>cannot tell them apart</b>. Without calibration against a known gas, the number is not ppm, and this part is <b>not a safety alarm</b>.</p>`),
      STEP('The module', 'dispq', ['gs1'], `<p><b>Click the module</b>.</p><ul><li>It needs <b>5 V</b> for the heater and gets hot: do not touch the metal mesh.</li><li>The datasheet asks for a pre-heat time of the sensor before readings are stable (many minutes on a new sensor).</li><li>On most modules AO rises with more gas; check yours.</li></ul>`),
      STEP('Wire it', 'dispq', ids(GAS), `<ul><li><b>VCC → 5V</b>, <b>GND → GND</b></li><li><b>AO → A0</b>, <b>DO → pin 2</b></li></ul>`, { pins: ['5V', 'GND2', 'A0', 'D2'] }),
      STEP('The code', 'dispq', ids(GAS), `<p>Click lines <b>13</b> and <b>16</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and add smoke', 'dispq', ids(GAS), `<p>Press <b>▶ Run</b> and move the <b>Smoke / gas</b> slider. AO rises from about 0.4 V; above the alarm level the sketch prints GAS!. Move the trimmer slider to change when DO switches (on this module DO goes LOW above the setting).</p><p class="sim">The voltages are typical values for an MQ-2 module, not measurements. Your sensor needs its own calibration.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(GAS), `<ul><li>MQ-2: heated element, AO = analog level, DO = threshold output.</li><li>Needs warm-up and calibration; cannot identify the gas.</li><li>Not a replacement for a certified smoke or gas alarm.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Why does an MQ-2 get warm?', a: ['It has a heater that keeps the sensing element hot', 'It is broken', 'It is charging', 'It is transmitting'], c: 0, why: 'The element works at a high temperature.' },
      { q: 'Can an MQ-2 tell methane from smoke?', a: ['No, it reacts to several gases', 'Yes, always', 'Only with DO', 'Only at night'], c: 0, why: 'It is not selective.' },
      { q: 'What sets the level at which DO switches?', a: ['The trimmer potentiometer on the module', 'The Arduino', 'The USB cable', 'The pin number'], c: 0, why: 'It sets the comparator threshold.' },
    ],
    sources: [S.mq2, SRC.ar, SRC.ds],
  }),

  // ============================================================ 52 flame
  base(52, 'flame', {
    module: 17, title: 'Flame sensor: an infrared eye', level: 'Beginner', time: '20 min', file: 'FlameSensor.ino',
    goal: 'Detect an infrared light source such as a flame with the DO output of a flame sensor module and light an LED.',
    hardware: ['Arduino UNO R3', 'The LED circuit of Lesson 4', 'Flame sensor module (AO and DO)', '4 × female jumper wires'],
    widgets: ['dv:flame'], circuit: [...LED_CIRCUIT, ...FLAME], io: { D5: IO_LED, ...mio('flame', 'fl1', [...LED_IDS, ...ids(FLAME)], { A0: ['ao', 'AO'], D2: ['do', 'DO'] }, pw('fl1', '5V')) },
    explain: { 1: 'The digital output of the module.', 2: 'The analog output.', 3: 'The LED of Lesson 4.', 12: 'On most modules DO goes LOW when the infrared level passes the trimmer setting. Check yours.', 13: 'Light the LED when a flame is seen.', 15: 'The analog level, for fine tuning.' },
    steps: [
      STEP('Seeing infrared', 'dispq', [], `<p>A flame gives off infrared light. The sensor is an <b>infrared photodiode</b> followed by a comparator (an LM393 on most modules) with a trimmer: DO switches when the level passes the setting, and AO gives the level itself.</p><p class="warn">It is not a fire alarm: sunlight and many lamps also contain infrared and can trigger it. It does not measure temperature.</p>`),
      STEP('The module', 'dispq', ['fl1'], `<p><b>Click the module</b>.</p><ul><li>Seller listings give a spectral range of about 760 to 1100 nm and a viewing angle of about 60°. There is no maker datasheet, so treat these as <b>typical</b> values.</li></ul>`),
      STEP('Wire it', 'dispq', [...LED_IDS, ...ids(FLAME)], `<ul><li><b>VCC → 5V</b>, <b>GND → GND</b></li><li><b>AO → A0</b>, <b>DO → pin 2</b></li><li>The LED is wired as in Lesson 4, on pin 5.</li></ul>`, { pins: ['5V', 'GND1', 'A0', 'D2'] }),
      STEP('The code', 'dispq', [...LED_IDS, ...ids(FLAME)], `<p>Click lines <b>12</b> and <b>13</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and bring a flame near', 'dispq', [...LED_IDS, ...ids(FLAME)], `<p>Press <b>▶ Run</b> and raise the <b>Infrared from the flame</b> slider. Past the trimmer level the output switches, the LED lights and the sketch prints FLAME. AO falls as more infrared arrives.</p><p class="sim">Typical behaviour for this kind of module: your board may be wired the other way round.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', [...LED_IDS, ...ids(FLAME)], `<ul><li>An infrared photodiode plus a comparator: DO = threshold, AO = level.</li><li>Adjust with the trimmer.</li><li>Sunlight and lamps can trigger it.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does the flame sensor actually detect?', a: ['Infrared light', 'Heat directly', 'Smoke', 'Sound'], c: 0, why: 'An infrared photodiode.' },
      { q: 'On most modules, what does DO do when a flame is seen?', a: ['Goes LOW', 'Goes HIGH', 'Blinks', 'Turns into AO'], c: 0, why: 'Typical for these boards, but check yours.' },
      { q: 'Why can a flame sensor give false alarms?', a: ['Sunlight and lamps contain infrared', 'It hears noise', 'The USB cable is long', 'It is too small'], c: 0, why: 'Other infrared sources trigger it.' },
    ],
    sources: [S.lm393, SRC.ds, SRC.pinmode],
  }),

  // ============================================================ 53 GPS
  base(53, 'gps', {
    module: 17, title: 'GPS NEO-6M: where am I?', time: '30 min', file: 'GpsPosition.ino',
    goal: 'Receive NMEA text from a GPS module through SoftwareSerial and print latitude, longitude and satellite count with TinyGPSPlus.',
    hardware: ['Arduino UNO R3', 'NEO-6M GPS module with antenna', '4 × female jumper wires', 'TinyGPSPlus library'],
    widgets: ['dv:gps'], circuit: GPS, io: mio('gps', 'gp1', ids(GPS), { D4: ['tx', 'TX'], D3: ['rx', 'RX'] }, pw('gp1', '5V')),
    explain: { 4: 'A second, software serial port: Arduino RX = pin 4 (it listens to the module’s TX), Arduino TX = pin 3.', 5: 'TinyGPSPlus turns the NMEA text into numbers.', 9: 'The NEO-6M sends at 9600 baud by default.', 13: 'Read every character the module sent and feed it to the decoder.', 14: 'Has the receiver found a position?', 15: 'Latitude with 6 decimals.', 19: 'Number of satellites used.', 21: 'No fix yet: indoors this stays the case.' },
    steps: [
      STEP('Position from the sky', 'dispq', [], `<p>The GPS module receives signals from satellites and sends its result once per second as lines of text in the <b>NMEA</b> format (for example <code>$GPGGA,…</code>) over a serial port. The u-blox NEO-6 data sheet gives 9600 baud as the default and 1 Hz as the default update rate.</p><p class="warn">It needs a clear view of the sky. A first fix from a cold start takes tens of seconds or longer, and indoors you usually get no fix at all.</p>`),
      STEP('The module', 'dispq', ['gp1'], `<p><b>Click the module</b>. The wires are <b>crossed</b>: the module’s <b>TX</b> goes to an Arduino <b>receive</b> pin and its <b>RX</b> to an Arduino <b>transmit</b> pin.</p><p>The u-blox chip itself is a 3.3 V part. The common boards add a regulator, and listings give a supply of about 3.3 to 5 V: check your board.</p>`),
      STEP('Wire it', 'dispq', ids(GPS), `<ul><li><b>VCC → 5V</b>, <b>GND → GND</b></li><li><b>TX → pin 4</b> (the Arduino receives here), <b>RX → pin 3</b></li></ul>`, { pins: ['5V', 'GND2', 'D4', 'D3'] }),
      STEP('The code', 'dispq', ids(GPS), `<p>Click lines <b>4</b>, <b>13</b> and <b>14</b>. SoftwareSerial is a built-in library; install TinyGPSPlus from the Library Manager.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'dispq', ids(GPS), `<p>Press <b>▶ Run</b>. The panel shows a raw NMEA line. At first the sketch prints “Waiting for a fix…”; after 6 s (much longer in reality) it prints the position. Switch <b>Open sky</b> to “no (indoors)” to see that no fix arrives.</p><p class="sim">The position is an example, not where you are.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(GPS), `<ul><li>GPS modules send NMEA text over a serial port (9600 baud by default on the NEO-6M).</li><li>Cross TX and RX; use SoftwareSerial to keep the USB serial free.</li><li>Indoors there is usually no fix.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'The module TX wire goes to…', a: ['An Arduino receive pin', 'An Arduino transmit pin', 'GND', '5V'], c: 0, why: 'One side’s transmit is the other side’s receive.' },
      { q: 'Why is there often no fix indoors?', a: ['The satellite signals are too weak through the roof', 'The Arduino is too slow', 'The baud rate is wrong', 'GPS needs WiFi'], c: 0, why: 'The signals are weak.' },
      { q: 'What does NMEA mean here?', a: ['A text format for GPS data', 'A kind of antenna', 'A voltage', 'A baud rate'], c: 0, why: 'It is the standard sentence format.' },
    ],
    sources: [S.gps, S.softser, SRC.ds],
  }),

  // ============================================================ 54 RTC
  base(54, 'rtc', {
    module: 17, title: 'DS3231 real-time clock: the time without WiFi', time: '25 min', file: 'RtcClock.ino',
    goal: 'Read the date and time from a DS3231 clock over I²C, set it once, and read its temperature.',
    hardware: ['Arduino UNO R3', 'DS3231 RTC module with a coin cell', '4 × female jumper wires', 'RTClib library'],
    widgets: ['dv:rtc'], circuit: RTC, io: mio('rtc', 'rt1', ids(RTC), { A4: ['sda', 'SDA'], A5: ['scl', 'SCL'] }, pw('rt1', '5V')),
    explain: { 4: 'The clock chip object.', 8: 'Start the chip on the I²C bus (address 0x68).', 12: '<code>lostPower()</code> is true when the oscillator stopped (for example the first time, or with a flat cell): the time is not valid.', 13: 'Set it to the time at which this sketch was compiled. Do this once; the chip keeps counting.', 18: 'Read the time.', 31: 'The DS3231 also has a temperature sensor (used to correct its crystal).' },
    steps: [
      STEP('A clock that keeps running', 'dispq', [], `<p>The Arduino forgets the time when it is switched off, and <code>millis()</code> counts from the start only. The <b>DS3231</b> is a clock chip with its own crystal and a coin cell: it keeps counting while the Arduino is off.</p><ul><li>Datasheet: accuracy ±2 ppm from 0 to +40 °C, roughly one minute per year; I²C address <b>0x68</b>.</li></ul><p class="warn">0x68 is also the default address of the MPU6050 (Lesson 31): the two cannot share one I²C bus unless you change an address.</p>`),
      STEP('The module', 'dispq', ['rt1'], `<p><b>Click the module</b>. Many boards also carry a small EEPROM at 0x57. Some have a charging circuit for a rechargeable cell: do not fit a normal CR2032 on those without checking the board page.</p>`),
      STEP('Wire it', 'dispq', ids(RTC), `<ul><li><b>VCC → 5V</b>, <b>GND → GND</b></li><li><b>SDA → A4</b>, <b>SCL → A5</b> (the I²C pins of the UNO R3)</li></ul>`, { pins: ['5V', 'GND2', 'A4', 'A5'] }),
      STEP('The code', 'dispq', ids(RTC), `<p>Click lines <b>12</b> and <b>13</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'dispq', ids(RTC), `<p>Press <b>▶ Run</b>. The first time, the clock reports lost power and is set to the time of your computer (in a real sketch, the time of compilation). Stop and run again: the time is not set again and keeps running. Use the “Remove the coin cell” button to see the lost-power path again.</p><p class="sim">The simulated clock starts from your computer’s time. Numbers are printed without leading zeros, as the sketch does.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(RTC), `<ul><li>DS3231: I²C 0x68, ±2 ppm, coin-cell backup, temperature sensor.</li><li><code>rtc.lostPower()</code> tells you if the time must be set.</li><li>Set the time once, then only read it.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What I²C address does the DS3231 use?', a: ['0x68', '0x3C', '0x27', '0x76'], c: 0, why: 'Datasheet: 0x68.' },
      { q: 'What does lostPower() tell you?', a: ['The oscillator stopped, so the time is not valid', 'The USB is unplugged', 'The battery is full', 'The time zone changed'], c: 0, why: 'The time must be set again.' },
      { q: 'Which two Arduino pins carry I²C on the UNO R3?', a: ['A4 and A5', '2 and 3', '10 and 11', '0 and 1'], c: 0, why: 'SDA is A4, SCL is A5.' },
    ],
    sources: [S.ds3231, S.rtclib, SRC.ds],
  }),

  // ============================================================ 55 A4988
  base(55, 'a4988', {
    module: 18, title: 'A4988 driver and a NEMA 17 stepper motor', level: 'Advanced', time: '35 min', file: 'StepperA4988.ino',
    goal: 'Drive a bipolar stepper motor with an A4988 driver: one pulse on STEP is one step, DIR sets the direction.',
    hardware: ['Arduino UNO R3', 'A4988 stepper driver carrier', 'NEMA 17 bipolar stepper motor (1.8° per step)', 'Motor supply 8 to 35 V (for example 12 V)', '100 µF capacitor across the motor supply', 'Jumper wires'],
    widgets: ['dv:a4988'], circuit: A4, io: mio('a4988', 'mot1', ids(A4), { D3: ['step', 'dv1.STEP'], D4: ['dir', 'dv1.DIR'], D5: ['en', 'dv1.ENABLE'] }, pw('dv1', '5V', 'GND').map(([a, b]) => [a.replace('VCC', 'VDD'), b])),
    explain: { 1: 'Each pulse on STEP moves the motor one step.', 2: 'DIR chooses the direction.', 3: 'ENABLE is <b>active LOW</b>: the driver works when it is LOW.', 4: 'A 1.8° motor has 200 full steps per revolution.', 10: 'Enable the driver.', 14: 'Direction one.', 15: 'One revolution: 200 pulses.', 16: 'STEP HIGH…', 17: '…for 1 ms…', 18: '…and LOW for 1 ms: 2 ms per step, 500 steps per second.', 22: 'Direction two.' },
    steps: [
      STEP('A driver between the Arduino and the motor', 'dispq', [], `<p>A stepper motor needs a few hundred milliamps to amperes through its coils, in a precise sequence. The <b>A4988</b> driver does that: each pulse on <b>STEP</b> moves the motor one step (or a fraction of a step) and <b>DIR</b> sets the direction. The Arduino only provides two logic signals.</p><ul><li>Pololu A4988 carrier: motor supply (VMOT) <b>8 to 35 V</b>, logic supply (VDD) 3 to 5.5 V, about 1 A per coil without a heat sink and up to about 2 A with good cooling.</li></ul>`),
      STEP('Safety rules', 'dispq', ['dv1', 'mot1'], `<p><b>Click the driver and the motor.</b></p><p class="warn">Never connect or disconnect the motor while the motor supply is on: the voltage spikes can destroy the driver. Put a capacitor of at least 47 µF across VMOT and GND close to the driver. Set the current limit with the trimmer (I = VREF ÷ (8 × R<sub>sense</sub>), where R<sub>sense</sub> depends on the board version: read yours) <b>before</b> you run a motor for long. The <b>RESET</b> and <b>SLEEP</b> pins must not be left floating: the simplest way is to join them.</p>`),
      STEP('Wire it', 'dispq', ids(A4), `<ul><li><b>STEP → pin 3</b>, <b>DIR → pin 4</b>, <b>ENABLE → pin 5</b></li><li><b>VDD → 5V</b> and <b>GND → GND</b> (logic side)</li><li><b>SLEEP</b> joined to <b>RESET</b></li><li>The motor’s two coils: find each coil with a multimeter (low resistance between its two wires), then one coil to <b>1A / 1B</b> and the other to <b>2A / 2B</b>.</li><li>The motor supply (VMOT and its GND, 8 to 35 V) is <b>not drawn</b>: it must share the GND with the board. The panel has a switch for it.</li></ul>`, { pins: ['D3', 'D4', 'D5', '5V', 'GND2'] }),
      STEP('The code', 'dispq', ids(A4), `<p>Click lines <b>10</b>, <b>15</b> and <b>16</b> to <b>19</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'dispq', ids(A4), `<p>Switch the <b>motor supply</b> on in the panel first, then press <b>▶ Run</b>. The shaft turns exactly one revolution, waits, and turns back. Try running without the supply: the sketch counts steps but the motor does not move.</p><p class="sim">Timing is slower than the 2 ms of the code, because the simulator cannot wait less than a few milliseconds. The step count and angle are exact.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(A4), `<ul><li>STEP pulse = one step; DIR = direction; ENABLE is active LOW.</li><li>Motor supply 8 to 35 V with a capacitor; never plug the motor in while it is on.</li><li>200 steps per turn for a 1.8° motor (microstepping with MS1 to MS3 gives more).</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'How many full steps does a 1.8° motor need for one revolution?', a: ['200', '360', '18', '2048'], c: 0, why: '360 ÷ 1.8 = 200.' },
      { q: 'Why must the motor never be unplugged while the supply is on?', a: ['The voltage spikes can destroy the driver', 'The motor would spin', 'The Arduino would reset', 'Nothing happens'], c: 0, why: 'Pololu warns about this.' },
      { q: 'ENABLE is active LOW. What does that mean?', a: ['The driver works when the pin is LOW', 'The driver works when the pin is HIGH', 'The pin must float', 'The pin is analog'], c: 0, why: 'LOW enables the outputs.' },
    ],
    sources: [S.a4988, S.a4988ds, SRC.ds],
  }),

  // ============================================================ 56 fan
  base(56, 'fan', {
    module: 18, title: 'Fan or pump: speed control with a MOSFET and PWM', level: 'Advanced', time: '30 min', file: 'FanSpeed.ino',
    goal: 'Control the speed of a small DC motor (a fan or a pump) from a PWM pin through a logic-level MOSFET, with a flyback diode.',
    hardware: ['Arduino UNO R3', 'IRLZ44N MOSFET', '220 Ω and 10 kΩ resistors', '1N4007 diode', 'Small DC motor (fan or pump) and a battery pack of 6 V', 'Jumper wires'],
    widgets: ['dv:fan'], circuit: FAN, io: mio('fan', 'mot1', ids(FAN), { D9: ['gate', ''] }),
    explain: { 1: 'A PWM pin (9) goes to the MOSFET gate through 220 Ω.', 9: 'Speed 0, 51, 102, 153, 204, 255: six steps.', 10: '<code>analogWrite()</code> makes a 490 Hz PWM signal on pin 9 (UNO R3). The MOSFET switches the motor on and off with that duty cycle, so the motor sees an average voltage.', 14: 'Stop.' },
    steps: [
      STEP('Speed control with PWM', 'farq', [], `<p>Lesson 25 switched a lamp with a MOSFET. A <b>PWM</b> signal switches the MOSFET fast, so the motor receives the supply voltage for only part of each period: the average voltage, and therefore the speed, follows the duty cycle. Pumps and fans are small DC motors, so the same circuit works for both.</p>`),
      STEP('The circuit', 'farq', ids(FAN), `<ul><li>The <b>IRLZ44N</b> is a logic-level MOSFET: the datasheet gives its on-resistance at 4 V and 5 V gate voltage, so a 5 V pin drives it fully.</li><li>A <b>220 Ω</b> resistor from the pin to the gate, and a <b>10 kΩ</b> resistor from the gate to GND.</li><li>The motor is between the battery + and the <b>drain</b>; the battery − joins the source column and the board GND.</li><li>The <b>1N4007 diode</b> across the motor, <b>band toward the battery +</b>: a motor is an inductor, and when the MOSFET switches off, the diode absorbs the voltage spike (flyback diode).</li></ul><p class="warn">Without the diode the spikes can destroy the MOSFET. Do not power a motor from the 5 V pin of the board; use its own supply.</p>`),
      STEP('Wire it', 'farq', ids(FAN), `<ul><li>Yellow: <b>pin 9</b> → <b>b5</b></li><li>Black: <b>b12</b> → <b>GND</b></li></ul><p>The motor circuit is separate: battery + → motor → <b>drain</b> (column 11); battery − → the <b>source column</b> (column 12), joined to the board GND.</p>`, { pins: ['D9', 'GND2'] }),
      STEP('The code', 'farq', ids(FAN), `<p>Click lines <b>9</b> and <b>10</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'farq', ids(FAN), `<p>Press <b>▶ Run</b>. The motor goes through six speeds. At the lowest setting it does not turn at all: a small DC motor needs a minimum voltage to overcome friction.</p><p class="sim">The start threshold of about 25 % duty is a typical assumption, not a measurement.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'farq', ids(FAN), `<ul><li>PWM on a logic-level MOSFET gives speed control.</li><li>Flyback diode across every motor or relay coil.</li><li>Separate supply for the motor, common GND with the board.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does PWM change?', a: ['The fraction of time the motor is on, so its average voltage', 'The battery voltage', 'The motor’s size', 'The wire colour'], c: 0, why: 'Duty cycle sets the average.' },
      { q: 'What is the diode across the motor for?', a: ['It absorbs the voltage spike when the current is switched off', 'It makes the motor faster', 'It charges the battery', 'It is decoration'], c: 0, why: 'A flyback diode protects the MOSFET.' },
      { q: 'Why does the motor not start at a very low duty cycle?', a: ['The average voltage is too low to overcome friction', 'PWM only works above 50 %', 'The MOSFET is off', 'The code is wrong'], c: 0, why: 'A minimum voltage is needed.' },
    ],
    sources: [SRC.irlz44n, SRC.d1n4007, SRC.aw],
  }),

  // ============================================================ 57 UART board to board
  base(57, 'uart', {
    module: 18, title: 'Two boards talk: a serial link (UART)', time: '30 min', file: 'SerialLink.ino',
    goal: 'Connect two Arduino boards with three wires (TX, RX, GND) and exchange text lines with SoftwareSerial.',
    hardware: ['Arduino UNO R3 (board A)', 'A second Arduino board with its own sketch (board B)', '3 × jumper wires'],
    widgets: ['dv:peer'], circuit: UART, io: mio('peer', 'pr1', ids(UART), { D10: ['rx', 'TX'], D11: ['tx', 'RX'] }),
    explain: { 3: 'A second serial port on pins 10 (receive) and 11 (transmit). The built-in <code>Serial</code> stays free for the USB monitor.', 12: 'Send text to board B…', 13: '…with a line break at the end.', 14: 'Show on the monitor what we sent.', 16: 'Remember the start time.', 17: 'For one second…', 18: '…copy everything board B sends back to the monitor.' },
    steps: [
      STEP('Two boards, one conversation', 'dispq', [], `<p>A <b>UART</b> link needs two data wires and a common ground. Each side has a <b>TX</b> (transmit) and an <b>RX</b> (receive) pin. They are <b>crossed</b>: my TX goes to your RX and my RX to your TX. Both sides must use the <b>same baud rate</b> (here 9600).</p><p>The UNO R3 has one hardware UART on pins 0 and 1, shared with the USB connection. <b>SoftwareSerial</b> makes another port on any pins; the Arduino reference lists its limits, for example that only one software port can receive at a time.</p><p class="warn">Two 5 V boards (like two UNO R3) can be connected directly. A 3.3 V board needs a level shifter on its RX pin.</p>`),
      STEP('Board B', 'dispq', ['pr1'], `<p><b>Click board B</b>. This picture is a simplified drawing of a second board; it runs a sketch that answers every line it gets with “ACK” and the same number.</p>`),
      STEP('Wire it', 'dispq', ids(UART), `<ul><li>Board B <b>TX → pin 10</b> (our receive pin)</li><li>Board B <b>RX → pin 11</b> (our transmit pin)</li><li><b>GND → GND</b></li></ul>`, { pins: ['D10', 'D11', 'GND2'] }),
      STEP('The code', 'dispq', ids(UART), `<p>Click lines <b>3</b>, <b>12</b> and <b>18</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and break it', 'dispq', ids(UART), `<p>Press <b>▶ Run</b>. Every second the sketch sends a line, and board B answers “ACK n”. Now press <b>“TX and RX not crossed”</b> (a classic mistake: nothing arrives) and <b>“Board B uses 4800 baud”</b> (garbage arrives). Both are the two most common errors in serial links.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(UART), `<ul><li>UART: TX crosses to RX, common GND, same baud rate.</li><li>SoftwareSerial gives extra ports; the hardware port on pins 0/1 is also used by USB.</li><li>Match the voltage levels.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Board A TX goes to…', a: ['Board B RX', 'Board B TX', 'GND', '5V'], c: 0, why: 'Transmit meets receive.' },
      { q: 'The two boards use different baud rates. What do you see?', a: ['Garbage characters', 'Nothing', 'A faster link', 'An error message from the IDE'], c: 0, why: 'The bits are sampled at the wrong times.' },
      { q: 'Why not use pins 0 and 1 for the link?', a: ['They are shared with the USB connection to the computer', 'They are analog', 'They are PWM', 'They do not exist'], c: 0, why: 'The USB serial chip is connected to them.' },
    ],
    sources: [S.softser, S.serial, SRC.ds],
  }),

  // ============================================================ 58 HC-05
  base(58, 'hc05', {
    module: 18, title: 'Bluetooth HC-05: control an LED from a phone', level: 'Advanced', time: '30 min', file: 'BluetoothLed.ino',
    goal: 'Use an HC-05 Bluetooth serial module to switch an LED with the characters 1 and 0 typed in a phone terminal app.',
    hardware: ['Arduino UNO R3', 'HC-05 Bluetooth module', 'The LED circuit of Lesson 4', '1 kΩ and 2 kΩ resistors (voltage divider)', 'A phone with a Bluetooth serial terminal app (Android)', 'Jumper wires'],
    widgets: ['dv:hc05'], circuit: [...LED_CIRCUIT, ...HC], io: { D5: IO_LED, ...mio('hc05', 'hc1', [...LED_IDS, ...ids(HC)], { D10: ['tx', 'TXD'], D11: ['rx', ''] }, pw('hc1', '5V')) },
    explain: { 3: 'Pin 10 listens to the module’s TXD, pin 11 talks to its RXD.', 9: 'The usual data-mode speed of an HC-05 is 9600 baud (check your module; the AT-command mode often uses 38400).', 13: 'Did the phone send a character?', 14: 'Read one character.', 17: 'The character 1 turns the LED on…', 18: '…and 0 turns it off.', 19: 'Answer the phone.' },
    steps: [
      STEP('A wireless serial cable', 'dispq', [], `<p>The HC-05 is a <b>classic Bluetooth</b> module with the serial port profile: bytes you send from a phone app appear on its TXD pin, and bytes you send to its RXD pin appear in the app. To the Arduino it is just another serial port.</p><p class="warn">Android phones and computers support the serial port profile; iPhones do not (use a BLE module there). The PIN is usually 1234, but read the sheet of your own module.</p>`),
      STEP('The voltage divider', 'dispq', ['hc1', 'ra', 'rb'], `<p>The module’s <b>RXD</b> input is a 3.3 V input, but the Arduino pin gives 5 V. A divider of <b>1 kΩ</b> and <b>2 kΩ</b> reduces it to 5 V × 2 ÷ 3 ≈ <b>3.3 V</b>. The other direction is fine: the module’s 3.3 V HIGH on TXD is above the minimum the ATmega328P accepts as HIGH (0.6 × Vcc = 3 V at 5 V).</p>`),
      STEP('Wire it', 'dispq', [...LED_IDS, ...ids(HC)], `<ul><li><b>VCC → 5V</b>, <b>GND → GND</b></li><li>Divider: yellow <b>pin 11</b> → <b>a20</b> (the 1 kΩ resistor), the middle point <b>a24</b> goes to <b>RXD</b>, and the 2 kΩ resistor ends at <b>b28</b> → <b>GND</b></li><li><b>TXD</b> goes to <b>pin 10</b></li><li>The LED is wired as in Lesson 4, on pin 5.</li></ul>`, { pins: ['5V', 'GND1', 'D10', 'D11', 'GND3'] }),
      STEP('The code', 'dispq', [...LED_IDS, ...ids(HC)], `<p>Click lines <b>14</b>, <b>17</b> and <b>18</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and use the phone', 'dispq', [...LED_IDS, ...ids(HC)], `<p>Press <b>▶ Run</b>, then <b>Pair</b> in the panel. Press <b>1</b> and <b>0</b> (or type text and Send). The LED switches and the sketch answers “LED is on/off”, which appears on the phone. Without pairing nothing is sent.</p><p class="sim">The phone here is simulated; the pairing PIN step is not shown.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', [...LED_IDS, ...ids(HC)], `<ul><li>HC-05 = Bluetooth serial port; use SoftwareSerial on pins 10/11.</li><li>The RXD input needs a divider from 5 V logic.</li><li>Not for iPhones; BLE modules are different.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Why is a voltage divider used on the module’s RXD?', a: ['Its input is 3.3 V and the Arduino pin gives 5 V', 'To make it faster', 'To save power', 'To pair with the phone'], c: 0, why: '5 V × 2/3 ≈ 3.3 V.' },
      { q: 'Which phones can use the serial port profile?', a: ['Android phones', 'iPhones', 'Both, always', 'Neither'], c: 0, why: 'iOS does not support the classic serial port profile.' },
      { q: 'The phone sends the character 1. What happens?', a: ['bt.read() returns \'1\' and the LED turns on', 'The Arduino resets', 'The module turns off', 'Nothing'], c: 0, why: 'See the sketch.' },
    ],
    sources: [S.softser, SRC.ds, SRC.atm],
  }),

  // ============================================================ 59 nRF24L01
  base(59, 'nrf', {
    module: 18, title: 'nRF24L01+: a radio link between two boards', level: 'Advanced', time: '30 min', file: 'RadioSender.ino',
    goal: 'Send a message with an nRF24L01+ radio module, and see that a receiver only hears it when the channel and the address match.',
    hardware: ['Arduino UNO R3', 'nRF24L01+ module (and a second one for a receiver)', '7 × female jumper wires', 'RF24 library'],
    widgets: ['dv:nrf'], circuit: NRF, io: mio('nrf', 'nr1', ids(NRF), { D9: ['ce', 'CE'], D10: ['csn', 'CSN'], D11: ['mosi', 'MOSI'], D12: ['miso', 'MISO'], D13: ['sck', 'SCK'] }, pw('nr1', '3V3')),
    explain: { 4: 'The radio object: CE on pin 9, CSN (chip select) on pin 10.', 5: 'The 5-byte address of the receiving pipe. Sender and receiver must use the same one.', 10: 'Start the radio. It returns false if the chip is not answering (wiring or power).', 14: 'The channel from 0 to 125: the frequency is 2400 MHz + channel. Both sides must use the same one.', 15: 'Send to this address.', 16: 'This board only sends.', 22: '<code>write()</code> returns true if the receiver answered with an acknowledge.' },
    steps: [
      STEP('A small radio', 'dispq', [], `<p>The nRF24L01+ is a 2.4 GHz radio chip for short messages between modules of the same kind. It is <b>not</b> WiFi and not Bluetooth. Data rates are 250 kbit/s, 1 Mbit/s and 2 Mbit/s, and the channel number (0 to 125) sets the frequency to 2400 MHz + channel.</p><p>With the auto-acknowledge feature the receiver answers each packet, so <code>write()</code> tells you whether it arrived.</p>`),
      STEP('The module', 'dispq', ['nr1'], `<p><b>Click the module</b>. It has a 2×4 header: the pin order here is GND, CE, SCK, MISO on one row and VCC, CSN, MOSI, IRQ on the other.</p><p class="warn">The supply is <b>1.9 to 3.6 V</b> (Nordic): use the <b>3V3</b> pin, <b>never 5 V</b>. The data inputs tolerate 5 V, so the UNO R3 can drive them. The 3.3 V pin of the UNO supplies up to 50 mA, enough for this module. A 10 µF capacitor between VCC and GND close to the module is common advice when the link is unreliable.</p>`),
      STEP('Wire it', 'dispq', ids(NRF), `<ul><li><b>VCC → 3V3</b>, <b>GND → GND</b></li><li><b>CE → pin 9</b>, <b>CSN → pin 10</b></li><li><b>SCK → pin 13</b>, <b>MOSI → pin 11</b>, <b>MISO → pin 12</b></li></ul>The <b>IRQ</b> pin stays unconnected.`, { pins: ['3V3', 'GND2', 'D9', 'D10', 'D13', 'D11', 'D12'] }),
      STEP('The code', 'dispq', ids(NRF), `<p>Click lines <b>14</b>, <b>15</b> and <b>22</b>. Install the RF24 library from the Library Manager.</p>`, { showCode: true, power: true }),
      STEP('Run it and change the receiver', 'dispq', ids(NRF), `<p>Press <b>▶ Run</b>. The simulated receiver (Node B) gets “hello 0”, “hello 1” … and the sketch prints “delivered”. Now change the receiver’s <b>channel</b> or <b>address</b>, or switch it off: the sender prints “no answer”.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'dispq', ids(NRF), `<ul><li>nRF24L01+: SPI plus CE and CSN; 1.9 to 3.6 V supply.</li><li>Same channel, data rate and address on both sides.</li><li><code>write()</code> returns true when the packet was acknowledged.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which supply voltage does the nRF24L01+ need?', a: ['1.9 to 3.6 V', '5 V', '12 V', '24 V'], c: 0, why: 'Nordic specification: 1.9 to 3.6 V.' },
      { q: 'Channel 76 is at which frequency?', a: ['2476 MHz', '76 MHz', '2.4 MHz', '7.6 GHz'], c: 0, why: '2400 MHz + 76.' },
      { q: 'write() returns false. What can be the reason?', a: ['The receiver is off or uses another channel or address', 'The code has a comment', 'The USB cable is red', 'The sketch is too short'], c: 0, why: 'No acknowledge came back.' },
    ],
    sources: [S.nrf, S.rf24, SRC.ds],
  }),
];

export const U3_MODULES_3 = { 14: 'Module 14 — Buzzers, capacitors, switches, displays', 15: 'Module 15 — Interrupts, timers and memory', 16: 'Module 16 — SPI devices', 17: 'Module 17 — Environment, position and time', 18: 'Module 18 — Motors and wireless links' };

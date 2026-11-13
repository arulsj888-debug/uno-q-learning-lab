// ESP32 lessons 42-61: buzzer, RC circuit, switches, 7-segment, SPI devices (MAX7219, TFT, RFID, SD), gas / flame / GPS / RTC,
// stepper driver, fan on a MOSFET, UART, classic Bluetooth, ESP-NOW, nRF24L01+, hardware timer and Preferences.
// The ESP32 runs at 3.3 V logic and its ADC is 12 bit. Facts come from the datasheets in each lesson's `sources`. Listings: ./code4.js,
// programs: ../sim4.js, simulated devices: ../devices.js. The board has male header pins, so a module is connected through the breadboard:
// its pins go to row a, the board pins go to row b of the same column.
import { CODE4 } from './code4.js';

const R = (t, u) => ({ t, u });
const S = {
  ds: R('Espressif ESP32 Series Datasheet v5.3', 'https://documentation.espressif.com/esp32_datasheet_en.pdf'),
  adc: R('Arduino-ESP32 documentation: ADC (analogRead)', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/adc.html'),
  ledc: R('Arduino-ESP32 documentation: LEDC (PWM)', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/ledc.html'),
  gpio: R('Arduino-ESP32 documentation: GPIO', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/gpio.html'),
  rcsrc: R('All About Circuits: RC and L/R time constants (DC textbook, chapter 16)', 'https://www.allaboutcircuits.com/textbook/direct-current/chpt-16/voltage-current-calculations/'),
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
  ds3231: R('DS3231 datasheet (Analog Devices)', 'https://www.analog.com/media/en/technical-documentation/data-sheets/DS3231.pdf'),
  rtclib: R('RTClib (Adafruit)', 'https://github.com/adafruit/RTClib'),
  a4988: R('Pololu A4988 stepper motor driver carrier (product page)', 'https://www.pololu.com/product/1182'),
  a4988ds: R('A4988 datasheet (Allegro)', 'https://www.allegromicro.com/-/media/files/datasheets/a4988-datasheet.pdf'),
  irlz44n: R('Infineon IRLZ44NPbF datasheet', 'https://www.infineon.com/dgdl/irlz44npbf.pdf?fileId=5546d462533600a40153567206892720'),
  serial: R('Arduino-ESP32 documentation: UART (HardwareSerial)', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/uart.html'),
  bt: R('Arduino-ESP32 library: BluetoothSerial (SerialToSerialBT example)', 'https://github.com/espressif/arduino-esp32/tree/master/libraries/BluetoothSerial'),
  espnow: R('Espressif ESP-NOW documentation', 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_now.html'),
  nrf: R('nRF24L01+ product specification (Nordic Semiconductor)', 'https://www.sparkfun.com/datasheets/Components/SMD/nRF24L01Pluss_Preliminary_Product_Specification_v1_0.pdf'),
  rf24: R('RF24 library (TMRh20)', 'https://github.com/nRF24/RF24'),
  timer: R('Arduino-ESP32 documentation: Timer', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/timer.html'),
  prefs: R('Arduino-ESP32 documentation: Preferences', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/tutorials/preferences.html'),
};

const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const jw = (id, from, to, color = 'black', lift = 12) => ({ id, type: 'wire', from, to, color, lift });
const ids = a => a.map(d => d.id);
const LED_CIRCUIT = [
  { id: 'r1', type: 'resistor', a: 'c10', b: 'c14' }, { id: 'led1', type: 'led', anode: 'd14', cathode: 'd15' },
  fw('w1', 'G16', 'a10', 'yellow', 22), fw('w2', 'GND2', 'a15', 'black', 16)];
const LED_IDS = ids(LED_CIRCUIT);
const IO_LED = { kind: 'led', item: 'led1', needs: LED_IDS };
const COL = { VCC: 'red', GND: 'black', '3V3': 'red', VDD: 'red' };
const COLORS = ['blue', 'green', 'yellow', 'orange', 'white', 'violet', 'red', 'black'];
/** a module on the desk, connected through the breadboard: module pin -> a<col>, board pin -> b<col>; net = null: only the module wire */
const bb = (id, pairs, c0 = 10) => pairs.flatMap(([mp, net], i) => {
  const c = COL[mp] || COL[net] || COLORS[i % COLORS.length];
  return [fw(id + 'm' + i, id + '.' + mp, 'a' + (c0 + i), c, 16 + 2 * i), ...(net ? [fw(id + 'b' + i, net, 'b' + (c0 + i), c, 22 + 3 * i)] : [])];
});
const mod = (id, model, x = 20, z = 138) => ({ id, type: 'mod', model, x, z });
const mio = (kind, item, needs, map, pw) => { const o = {}; let first = true; for (const [pin, [role, mp, it, extra]] of Object.entries(map)) { o[pin] = { kind: 'dev:' + kind, role, item: it || item, mp, needs, ...(extra || {}) }; if (first && pw) { o[pin].pw = pw; first = false; } } return o; };
const pw = (item, vcc, gnd = 'GND') => [[item + '.VCC', vcc], [item + '.GND', gnd]];
const STEP = (title, view, have, body, o = {}) => ({ title, view, have, power: false, body, ...o });
const base = (n, key, o) => ({ id: 'e' + n, num: n, level: 'Intermediate', time: '25 min', code: CODE4[key], program: 'e4_' + key, fast: true, hardware: [], ...o });

// ---- parts --------------------------------------------------------------------------------------
const ABUZ = [{ id: 'r2', type: 'resistor', a: 'c19', b: 'c23', ohms: 220 }, { id: 'bz1', type: 'buzzer', active: true, plus: 'e23', minus: 'e26' }, fw('w1', 'G25', 'a19', 'orange', 22), fw('w2', 'GND2', 'a26', 'black', 16)];
const RC = [{ id: 'r1', type: 'resistor', a: 'a5', b: 'a10', ohms: 10000 }, { id: 'c1', type: 'cap', uf: 100, a: 'd10', k: 'd12' }, fw('w1', 'G25', 'b5', 'orange', 26), fw('w2', 'G34', 'c10', 'green', 22), fw('w3', 'GND2', 'b12', 'black', 18)];
const SWT = [
  { id: 'ssw1', type: 'slidesw', row: 'e', col: 5 }, { id: 'reed1', type: 'reed', a: 'e12', k: 'e17' }, { id: 'tilt1', type: 'tilt', a: 'e22', k: 'e23' },
  fw('w1', 'GND1', 'a5', 'black', 26), fw('w2', 'G25', 'a6', 'yellow', 22), fw('w3', '3V3', 'a7', 'red', 18),
  fw('w4', 'GND2', 'a12', 'black', 18), fw('w5', 'G26', 'a17', 'green', 24), jw('w6', 'c12', 'c22', 'black', 10), fw('w7', 'G27', 'a23', 'blue', 28)];
const SEG = (() => {
  const p = [{ id: 'seg1', type: 'sevenseg', x: 30, z: 138 }], pins = ['G13', 'G14', 'G25', 'G26', 'G27', 'G32', 'G33'];
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'violet', 'white'];
  for (let i = 0; i < 7; i++) { const c = 3 + 2 * i; p.push(fw('w' + (i + 1), pins[i], 'a' + c, colors[i], 20 + 2 * i), { id: 'r' + (i + 1), type: 'resistor', a: 'd' + c, b: 'g' + c, ohms: 220 }, fw('f' + (i + 1), 'seg1.' + 'ABCDEFG'[i], 'j' + c, colors[i], 28 + 3 * i)); }
  p.push(fw('f8', 'seg1.COM', 'a29', 'black', 60), fw('w8', 'GND2', 'b29', 'black', 24));
  return p;
})();
const MX = [mod('mx1', 'mod_max7219'), ...bb('mx1', [['VCC', 'VIN'], ['GND', 'GND2'], ['DIN', 'G23'], ['CS', 'G26'], ['CLK', 'G18']])];
const TFT = [mod('tf1', 'mod_tft', 20, 150), ...bb('tf1', [['GND', 'GND2'], ['VCC', '3V3'], ['SCK', 'G18'], ['SDA', 'G23'], ['RES', 'G25'], ['DC', 'G27'], ['CS', 'G26'], ['BL', null]]), jw('wbl', 'c11', 'c17', 'red', 10)];
const RFID = [mod('rf1', 'mod_rfid', 30, 140), ...bb('rf1', [['3V3', '3V3'], ['RST', 'G27'], ['GND', 'GND2'], ['MISO', 'G19'], ['MOSI', 'G23'], ['SCK', 'G18'], ['SDA', 'G5']])];
const SD = [mod('sd1', 'mod_sd', 25, 138), ...bb('sd1', [['GND', 'GND2'], ['VCC', 'VIN'], ['MISO', 'G19'], ['MOSI', 'G23'], ['SCK', 'G18'], ['CS', 'G5']])];
const GAS = [mod('gs1', 'mod_mq2'), ...bb('gs1', [['VCC', 'VIN'], ['GND', 'GND2'], ['AO', null]]),
  { id: 'ra', type: 'resistor', a: 'c12', b: 'c16', ohms: 10000 }, { id: 'rb', type: 'resistor', a: 'd16', b: 'd11', ohms: 20000 }, fw('wg', 'G34', 'b16', 'yellow', 30)];
const FLAME = [mod('fl1', 'mod_flame'), ...bb('fl1', [['VCC', '3V3'], ['GND', 'GND1'], ['DO', 'G26'], ['AO', 'G34']], 20)];
const GPS = [mod('gp1', 'mod_gps'), ...bb('gp1', [['VCC', '3V3'], ['GND', 'GND2'], ['TX', 'G16'], ['RX', 'G17']])];
const RTC = [mod('rt1', 'mod_rtc'), ...bb('rt1', [['VCC', '3V3'], ['GND', 'GND2'], ['SDA', 'G21'], ['SCL', 'G22']])];
const A4 = [mod('dv1', 'mod_a4988', 30, 138), { id: 'mot1', type: 'nema17', x: 90, z: 120 },
  ...bb('dv1', [['VDD', '3V3'], ['GND', 'GND2'], ['STEP', 'G25'], ['DIR', 'G26'], ['ENABLE', 'G27'], ['SLEEP', null], ['RESET', null]]), jw('wsr', 'c15', 'c16', 'white', 10),
  { id: 'l1', type: 'lead', from: 'mot1.A1', to: 'dv1.1A', color: 'red', lift: 14 }, { id: 'l2', type: 'lead', from: 'mot1.A2', to: 'dv1.1B', color: 'blue', lift: 18 },
  { id: 'l3', type: 'lead', from: 'mot1.B1', to: 'dv1.2A', color: 'green', lift: 22 }, { id: 'l4', type: 'lead', from: 'mot1.B2', to: 'dv1.2B', color: 'yellow', lift: 26 }];
const FAN = [
  { id: 'q1', type: 'mosfet', row: 'e', col: 10 }, { id: 'r1', type: 'resistor', a: 'a5', b: 'a10', ohms: 220 }, fw('w1', 'G25', 'b5', 'yellow', 24),
  { id: 'r2', type: 'resistor', a: 'd10', b: 'd12', ohms: 10000 }, fw('w2', 'GND2', 'b12', 'black', 18),
  { id: 'dio1', type: 'diode', a: 'b11', k: 'b14' },
  { id: 'bat1', type: 'battery', x: 125, z: 12 }, { id: 'mot1', type: 'motor', x: 165, z: -26 },
  { id: 'l1', type: 'lead', from: 'bat1.POS', to: 'c14', color: 'red', lift: 14 }, { id: 'l2', type: 'lead', from: 'mot1.M1', to: 'd14', color: 'white', lift: 12 },
  { id: 'l3', type: 'lead', from: 'mot1.M2', to: 'c11', color: 'green', lift: 16 }, { id: 'l4', type: 'lead', from: 'bat1.NEG', to: 'c12', color: 'black', lift: 18 }];
const UART = [mod('pr1', 'mod_peer', 30, 138), ...bb('pr1', [['TX', 'G16'], ['RX', 'G17'], ['GND', 'GND2']])];
const NRF = [mod('nr1', 'mod_nrf24', 30, 138), ...bb('nr1', [['VCC', '3V3'], ['GND', 'GND2'], ['CE', 'G25'], ['CSN', 'G26'], ['SCK', 'G18'], ['MOSI', 'G23'], ['MISO', 'G19']])];

export const E32_LESSONS_4 = [
  // ============================================================ 42 active buzzer
  base(42, 'abuz', {
    module: 13, title: 'Active buzzer: a beep with one pin', level: 'Beginner', time: '15 min', file: 'ActiveBuzzer.ino',
    goal: 'Make an active buzzer beep with digitalWrite(), and see how it differs from the passive buzzer of the earlier lesson.',
    hardware: ['ESP32 DevKit V1', 'Active buzzer (3.3 V or 5 V type: check your part)', '220 Ω resistor', '2 × jumper wires (female–male)', 'Breadboard'],
    widgets: ['audio', 'dv:abuz'], circuit: ABUZ, io: mio('abuz', 'bz1', ids(ABUZ), { G25: ['bz', ''] }),
    explain: { 1: 'The output pin (GPIO25). The 220 Ω resistor limits the current.', 4: 'The pin is an output.', 5: 'Serial output on (115200 baud on the ESP32).', 9: 'HIGH: the pin gives 3.3 V. The buzzer’s own circuit starts its oscillator and it <b>sounds</b> (if the part works at 3.3 V).', 10: 'Print a message.', 12: 'LOW: silence.' },
    steps: [
      STEP('Active or passive?', 'bench', [], `<p>A <b>passive</b> buzzer is only a piezo disc: it sounds only when <code>tone()</code> or <code>ledcWriteTone()</code> sends it a signal, and you choose the pitch. An <b>active</b> buzzer has an oscillator <b>inside</b>: give it power and it beeps at one fixed pitch.</p><p class="warn">Many active buzzers are rated 3 to 5 V, but some are 5 V parts that are quiet or silent at the 3.3 V of an ESP32 pin. There is no standard datasheet: read the page of <b>your</b> buzzer.</p>`),
      STEP('The parts', 'bench', ['r2', 'bz1'], `<p>Resistor in <b>c19</b> and <b>c23</b>; buzzer <b>+</b> leg in <b>e23</b>, other leg in <b>e26</b>. <b>Click the buzzer</b>.</p><p class="warn">A GPIO of the ESP32 is meant for a few milliamps up to about 20 mA (the datasheet gives the exact limits). The resistor keeps the current low; for a bigger buzzer use a transistor.</p>`, { holes: ['c19', 'c23', 'e23 · +', 'e26'] }),
      STEP('Wire it', 'bench', ids(ABUZ), `<ul><li>Orange wire: <b>GPIO25</b> to column 19 (a19)</li><li>Black wire: <b>GND</b> to column 26 (a26)</li></ul>`, { pins: ['G25', 'GND2'] }),
      STEP('The code', 'bench', ids(ABUZ), `<p>Click lines <b>9</b> and <b>12</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and listen', 'bench', ids(ABUZ), `<p>Press <b>▶ Run</b> and switch the sound on. The buzzer beeps for half a second and pauses.</p><p class="sim">The tone is made by your browser; a real active buzzer has its own fixed pitch.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', ids(ABUZ), `<ul><li>Active buzzer: oscillator inside, fixed pitch, on/off with <code>digitalWrite()</code>.</li><li>Check that it works at 3.3 V.</li><li>Limit the current with a resistor or use a transistor.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does an active buzzer contain that a passive one does not?', a: ['An oscillator that makes the tone itself', 'A battery', 'A microphone', 'A relay'], c: 0, why: 'The oscillator makes the sound when power is applied.' },
      { q: 'You want to play a melody. Which buzzer?', a: ['A passive buzzer', 'An active buzzer', 'Either', 'Neither'], c: 0, why: 'An active buzzer has one fixed pitch.' },
      { q: 'Why can an active buzzer be quiet on an ESP32?', a: ['Some are 5 V parts and the pin gives only 3.3 V', 'The ESP32 has no pins', 'Serial is on', 'USB is too long'], c: 0, why: 'Check the rated voltage.' },
    ],
    sources: [S.gpio, S.ds],
  }),

  // ============================================================ 43 RC
  base(43, 'rc', {
    module: 13, title: 'Capacitor: charging and discharging (RC circuit)', file: 'RCCircuit.ino',
    goal: 'Charge and discharge a 100 µF capacitor through a 10 kΩ resistor, read its voltage with analogRead() (12 bit) and see the time constant τ = R × C.',
    hardware: ['ESP32 DevKit V1', '10 kΩ resistor', '100 µF electrolytic capacitor (16 V or more)', '3 × jumper wires (female–male)', 'Breadboard'],
    widgets: ['dv:rc'], circuit: RC, io: { G25: { kind: 'dev:rc', role: 'drive', item: 'c1', r: 10000, c: 100e-6, needs: ids(RC), mp: '' }, G34: { kind: 'dev:rc', role: 'cap', item: 'c1', needs: ids(RC), mp: '' } },
    explain: { 1: 'This pin charges and discharges the capacitor through the resistor.', 2: 'GPIO34 is an ADC1 input (ADC2 pins cannot be used while Wi-Fi is on).', 6: 'Serial output on.', 10: 'HIGH: 3.3 V, the capacitor charges through 10 kΩ.', 12: 'Volts = reading × 3.3 ÷ 4095 (12 bit). This is a rough conversion: the ESP32 ADC is not perfectly linear.', 15: 'LOW: the capacitor discharges.' },
    steps: [
      STEP('A capacitor stores charge', 'bench', [], `<p>A capacitor’s voltage cannot jump: to change it, current has to flow, and through a resistor that takes time.</p><p class="formula">τ = R × C = 10 000 Ω × 0.0001 F = 1 s</p><p>After one τ a charging capacitor has reached about <b>63 %</b> of the final voltage, after 5τ about <b>99 %</b>.</p>`),
      STEP('The parts', 'bench', ['r1', 'c1'], `<p>Resistor <b>a5 to a10</b>. Capacitor: <b>long leg (+)</b> in <b>d10</b>, the leg at the stripe with the “−” signs in <b>d12</b>. <b>Click the capacitor</b>.</p><p class="warn">An electrolytic capacitor is polarised: reversed, it can overheat and burst. Its voltage rating (16 V) must be above the 3.3 V used. The real capacitance can differ by 20 % or more from the printed value.</p>`, { holes: ['a5', 'a10', 'd10 · +', 'd12 · −'] }),
      STEP('Wire it', 'bench', ids(RC), `<ul><li>Orange wire: <b>GPIO25</b> to b5</li><li>Green wire: <b>GPIO34</b> to c10 (between resistor and capacitor)</li><li>Black wire: <b>GND</b> to b12</li></ul>`, { pins: ['G25', 'G34', 'GND2'] }),
      STEP('The code', 'bench', ids(RC), `<p>Click lines <b>10</b> and <b>15</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and watch the curve', 'bench', ids(RC), `<p>Press <b>▶ Run</b>. The graph rises, then falls. After 1 s the voltage is near 2.1 V (63 % of 3.3 V).</p><p class="sim">The simulation uses ideal values and a linear ADC. Your parts will differ.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', ids(RC), `<ul><li>τ = R × C.</li><li>63 % after τ, about 99 % after 5τ.</li><li>Electrolytic capacitors have a + and a − leg.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'R = 10 kΩ and C = 100 µF. What is τ?', a: ['1 second', '1 millisecond', '10 seconds', '100 seconds'], c: 0, why: '10 000 × 0.0001 = 1 s.' },
      { q: 'What is the final voltage of the charging capacitor here?', a: ['3.3 V', '5 V', '1 V', '12 V'], c: 0, why: 'The GPIO pin is at 3.3 V.' },
      { q: 'Which pins can read analog values while Wi-Fi is on?', a: ['ADC1 pins such as GPIO34', 'ADC2 pins', 'All pins', 'None'], c: 0, why: 'ADC2 is used by Wi-Fi.' },
    ],
    sources: [S.rcsrc, S.adc, S.ds],
  }),

  // ============================================================ 44 switches
  base(44, 'swt', {
    module: 13, title: 'Slide, reed and tilt switches', file: 'ThreeSwitches.ino',
    goal: 'Read a slide switch (SPDT), a reed switch operated by a magnet and a tilt switch.',
    hardware: ['ESP32 DevKit V1', 'Slide switch (SPDT)', 'Reed switch with a magnet', 'Tilt switch (ball type)', '8 × jumper wires', 'Breadboard'],
    widgets: ['dv:swt'], circuit: SWT, io: mio('swt', 'ssw1', ids(SWT), { G25: ['slide', '', 'ssw1'], G26: ['reed', '', 'reed1'], G27: ['tilt', '', 'tilt1'] }),
    explain: { 1: 'The slide switch is on GPIO25.', 2: 'The reed switch is on GPIO26.', 3: 'The tilt switch is on GPIO27.', 6: 'A slide switch always connects the pin to 3.3 V or to GND: a plain INPUT is enough.', 7: 'A reed switch only closes to GND, or is open: INPUT_PULLUP gives the open state a defined HIGH.', 8: 'The same for the tilt switch.', 16: '0 when the magnet is close.', 18: '0 when the ball closes the contacts.' },
    steps: [
      STEP('Three ways to switch', 'bench', [], `<p>A <b>slide switch</b> (SPDT) connects its middle leg to one of two outer legs. A <b>reed switch</b> is two thin metal contacts in a glass capsule that a magnet pulls together. A <b>tilt switch</b> has a small metal ball that closes two contacts when the part is tilted.</p>`),
      STEP('The parts', 'bench', ['ssw1', 'reed1', 'tilt1'], `<p>Slide switch in <b>e5, e6, e7</b>; reed switch in <b>e12</b> and <b>e17</b>; tilt switch in <b>e22</b> and <b>e23</b>. <b>Click each part</b>.</p><p class="warn">Tilt switches differ: read the data of your own part, and avoid mercury types.</p>`, { holes: ['e5', 'e6 · middle', 'e7', 'e12', 'e17', 'e22', 'e23'] }),
      STEP('Wire it', 'bench', ids(SWT), `<ul><li>Slide switch: GND to a5, 3V3 to a7, GPIO25 to a6 (the middle leg)</li><li>Reed switch: GND to a12, GPIO26 to a17</li><li>Tilt switch: a short black wire joins column 12 and column 22 (the same GND), and GPIO27 goes to a23</li></ul>`, { pins: ['G25', '3V3', 'G26', 'G27', 'GND1', 'GND2'] }),
      STEP('The code', 'bench', ids(SWT), `<p>Click lines <b>6</b>, <b>7</b> and <b>8</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and use the switches', 'bench', ids(SWT), `<p>Press <b>▶ Run</b> and use the three buttons in the panel; the slide knob moves, a magnet appears over the reed switch, the tilt switch leans.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', ids(SWT), `<ul><li>Slide switch: <code>INPUT</code>.</li><li>Reed and tilt: <code>INPUT_PULLUP</code>, closed = LOW.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Reed switch to GND with INPUT_PULLUP, magnet close. digitalRead() returns…', a: ['LOW (0)', 'HIGH (1)', 'Random', 'Nothing'], c: 0, why: 'Closed contacts connect the pin to GND.' },
      { q: 'Why no pull-up for the slide switch?', a: ['It always connects the pin to 3.3 V or GND', 'It has a built-in resistor', 'It is analog', 'It uses I²C'], c: 0, why: 'The pin is never floating.' },
      { q: 'What operates a reed switch?', a: ['A magnetic field', 'Light', 'Sound', 'Heat'], c: 0, why: 'The magnet closes the contacts.' },
    ],
    sources: [S.gpio, S.ds],
  }),

  // ============================================================ 45 7-segment
  base(45, 'seg7', {
    module: 13, title: '7-segment display: count from 0 to 9', time: '30 min', file: 'SevenSegment.ino',
    goal: 'Light the segments of a common-cathode 7-segment display to show the digits 0 to 9.',
    hardware: ['ESP32 DevKit V1', '7-segment display 5161AS (common cathode) on its breakout board', '7 × 220 Ω resistors', '16 × jumper wires', 'Breadboard'],
    widgets: ['dv:seg7'], circuit: SEG, io: mio('seg7', 'seg1', ids(SEG), { G13: ['a', ''], G14: ['b', ''], G25: ['c', ''], G26: ['d', ''], G27: ['e', ''], G32: ['f', ''], G33: ['g', ''] }),
    explain: { 1: 'The seven GPIO pins for segments a to g, in order.', 2: 'One byte per digit. Bit 0 is segment a, bit 6 is segment g.', 3: 'Digit 0 lights a to f.', 16: 'All segment pins are outputs.', 22: 'Copy the bits of the digit to the pins.', 24: 'Wait 0.8 s.' },
    steps: [
      STEP('Seven LEDs in one case', 'scanv', [], `<p>A 7-segment display is eight LEDs in one case: seven bars (a to g) and a decimal point. In a <b>common-cathode</b> display all cathodes are joined to COM, which goes to GND. A segment lights when its pin is HIGH.</p>`),
      STEP('The display', 'scanv', ['seg1'], `<p><b>Click the display.</b> 5161AS datasheet: forward voltage 2.1 V typical (2.5 V maximum) at 20 mA.</p><p class="warn">At 3.3 V a segment gets only about (3.3 − 2.1) ÷ 220 Ω ≈ 5 mA through 220 Ω: the digit is dim. A 100 Ω resistor gives about 12 mA (still below the 20 mA of the datasheet).</p>`),
      STEP('Wire it', 'scanv', ids(SEG), `<p>Each segment pin goes through its own 220 Ω resistor on the breadboard to a GPIO: A to GPIO13, B to GPIO14, C to GPIO25, D to GPIO26, E to GPIO27, F to GPIO32, G to GPIO33. COM goes to GND (through column 29). DP is not used.</p>`, { pins: ['G13', 'G14', 'G25', 'G26', 'G27', 'G32', 'G33', 'GND2'] }),
      STEP('The code', 'scanv', ids(SEG), `<p>Click line <b>3</b> and line <b>22</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and count', 'scanv', ids(SEG), `<p>Press <b>▶ Run</b>: the display counts 0 to 9.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(SEG), `<ul><li>Common cathode: COM to GND, HIGH lights a segment.</li><li>One resistor per segment; at 3.3 V use a smaller value.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Common cathode: which level lights a segment?', a: ['HIGH on the segment pin', 'LOW on the segment pin', 'PWM only', 'COM HIGH'], c: 0, why: 'COM is at GND.' },
      { q: 'Which segments form the digit 1?', a: ['b and c', 'a and d', 'e and f', 'only g'], c: 0, why: 'The two right-hand bars.' },
      { q: 'Why is the digit dimmer at 3.3 V than at 5 V with the same resistor?', a: ['Less voltage across the resistor means less current', 'The display is broken', 'Resistors change', 'ESP32 has no PWM'], c: 0, why: 'I = (V − VF) ÷ R.' },
    ],
    sources: [S.gpio, S.ds],
  }),

  // ============================================================ 46 MAX7219
  base(46, 'max7219', {
    module: 14, title: 'MAX7219 LED matrix: a picture on 64 LEDs', file: 'MatrixMax7219.ino',
    goal: 'Draw a picture on an 8×8 LED matrix driven by a MAX7219 and understand the three data wires.',
    hardware: ['ESP32 DevKit V1', 'MAX7219 8×8 LED matrix module', '5 × jumper wires', 'LedControl library'],
    widgets: ['dv:max7219'], circuit: MX, io: mio('max7219', 'mx1', ids(MX), { G23: ['din', 'mx1.DIN'], G26: ['cs', 'mx1.CS'], G18: ['clk', 'mx1.CLK'] }, [['mx1.VCC', 'VIN'], ['mx1.GND', 'GND']]),
    explain: { 1: 'The LedControl library speaks the MAX7219 serial protocol.', 3: 'Data in (GPIO23).', 4: 'Clock (GPIO18).', 5: 'Chip select / load (GPIO26): the chip keeps the message when this pin goes LOW to HIGH.', 6: 'One MAX7219. The constructor sets the chip up and leaves it in shutdown mode.', 8: 'One byte per row; the leftmost LED is bit 7.', 14: 'Wake the chip up.', 15: 'Brightness 0 to 15.', 17: 'Send each row.', 22: 'Change the brightness.' },
    steps: [
      STEP('A chip that does the multiplexing', 'scanv', [], `<p>The <b>MAX7219</b> scans 64 LEDs itself. A message is <b>16 bits</b>: 8 bits register address and 8 bits data, sent MSB first on DIN with a pulse on CLK for each bit; CS LOW to HIGH makes the chip take it. This is the idea of an SPI-style bus. (The LedControl library sends the bits with ordinary pins.)</p>`),
      STEP('The module and the voltage', 'scanv', ['mx1'], `<p><b>Click the module.</b> After power-up the chip is in <b>shutdown mode</b>.</p><p class="warn">The MAX7219 datasheet gives a supply of 4.0 to 5.5 V and a minimum HIGH input level of 3.5 V at a 5 V supply. The ESP32 pins give only 3.3 V, which is <b>below that minimum</b>: many boards work anyway, but it is not guaranteed. For a reliable build, put a level shifter (for example a 74HCT-type buffer) in the DIN, CLK and CS lines. The module is powered from VIN (5 V).</p>`),
      STEP('Wire it', 'scanv', ids(MX), `<p>Module pins go to the breadboard (a10 to a14) and the board pins to the same columns in row b: <b>VCC</b> to VIN (column 10), <b>GND</b> to GND (11), <b>DIN</b> to GPIO23 (12), <b>CS</b> to GPIO26 (13), <b>CLK</b> to GPIO18 (14).</p>`, { pins: ['VIN', 'GND2', 'G23', 'G26', 'G18'] }),
      STEP('The code', 'scanv', ids(MX), `<p>Click lines <b>9</b>, <b>14</b> and <b>17</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'scanv', ids(MX), `<p>Press <b>▶ Run</b>: a smiley appears and gets brighter. The panel lists the messages the chip received.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(MX), `<ul><li>MAX7219: 3 data wires, 16-bit messages, shutdown mode at start.</li><li>Check the logic level: 3.3 V is below the datasheet minimum at 5 V supply.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'How many bits are in one MAX7219 message?', a: ['16', '8', '64', '1'], c: 0, why: '8 address bits and 8 data bits.' },
      { q: 'Why can a 3.3 V ESP32 be a problem for a MAX7219 powered from 5 V?', a: ['The minimum HIGH input level is 3.5 V', 'The chip needs 12 V', 'The ESP32 has no GPIO', 'SPI is forbidden'], c: 0, why: 'See the datasheet.' },
      { q: 'The matrix stays dark after start. First check…', a: ['That the chip left shutdown mode', 'The IDE version', 'The USB cable colour', 'Nothing'], c: 0, why: 'The chip starts in shutdown mode.' },
    ],
    sources: [S.max, S.ledctl, S.ds],
  }),

  // ============================================================ 47 TFT
  base(47, 'tft', {
    module: 14, title: 'Colour TFT display (ST7735) on the SPI bus', time: '35 min', file: 'TftDemo.ino',
    goal: 'Draw text, a frame, a progress bar and a circle on a 1.8 inch 128×160 colour display.',
    hardware: ['ESP32 DevKit V1', '1.8 inch ST7735 TFT module (128×160)', '8 × jumper wires', 'Adafruit GFX and Adafruit ST7735 libraries'],
    widgets: ['dv:tft'], circuit: TFT, io: mio('tft', 'tf1', ids(TFT), { G18: ['sck', 'tf1.SCK'], G23: ['sda', 'tf1.SDA'], G25: ['res', 'tf1.RES'], G27: ['dc', 'tf1.DC'], G26: ['cs', 'tf1.CS'] }, [['tf1.VCC', '3V3'], ['tf1.GND', 'GND']]),
    explain: { 8: 'The display object: chip select, data/command and reset. The data pins are the default VSPI pins of the ESP32: MOSI = GPIO23, SCK = GPIO18.', 13: 'Initialise the controller. <code>INITR_BLACKTAB</code> must match the tab colour of your module.', 14: 'Fill the screen with black.', 15: 'Text size 2.', 16: 'Colours are 16-bit values (RGB565).', 18: 'Print text.', 19: 'A white frame for the bar.', 24: 'Erase the old bar…', 25: '…and draw the new one.', 26: 'A filled red circle.' },
    steps: [
      STEP('A display with its own memory', 'scanv', [], `<p>The ST7735 controller keeps the picture in its own memory. The ESP32 sends drawing commands over <b>SPI</b> (SCK clock, MOSI data, CS chip select) plus a <b>DC</b> pin that tells the display whether a byte is a command or pixel data. Colours are 16 bits (RGB565).</p>`),
      STEP('The module', 'scanv', ['tf1'], `<p><b>Click the module.</b> The ST7735 chip is a 3.3 V part, which suits the ESP32 directly: power it from <b>3V3</b>. Pin order and names differ between modules; read the printing on yours.</p>`),
      STEP('Wire it', 'scanv', ids(TFT), `<p>Module pins go to a10 to a17, board pins to the same columns in row b: <b>GND</b> (10), <b>VCC</b> to 3V3 (11), <b>SCK</b> to GPIO18 (12), <b>SDA</b> (the MOSI line) to GPIO23 (13), <b>RES</b> to GPIO25 (14), <b>DC</b> to GPIO27 (15), <b>CS</b> to GPIO26 (16), and <b>BL</b> (backlight, column 17) is joined to the supply column 11 by a short wire.</p>`, { pins: ['GND2', '3V3', 'G18', 'G23', 'G25', 'G27', 'G26'] }),
      STEP('The code', 'scanv', ids(TFT), `<p>Click line <b>13</b> and lines <b>24</b> to <b>26</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'scanv', ids(TFT), `<p>Press <b>▶ Run</b>.</p><p class="sim">The simulated font is similar to, not exactly, the library font.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(TFT), `<ul><li>SPI: SCK, MOSI, CS plus DC and RES.</li><li>The display remembers the picture: erase what changes.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which ESP32 pins are the default VSPI clock and MOSI?', a: ['GPIO18 and GPIO23', 'GPIO1 and GPIO3', 'GPIO21 and GPIO22', 'GPIO34 and GPIO35'], c: 0, why: 'VSPI: SCK 18, MOSI 23, MISO 19, CS 5.' },
      { q: 'What is the DC pin for?', a: ['Command or pixel data', 'Direct current', 'The backlight', 'The clock'], c: 0, why: 'Data/command select.' },
      { q: 'Why erase the old bar before drawing the new one?', a: ['The display keeps the old pixels', 'To save power', 'To reset the ESP32', 'It is not needed'], c: 0, why: 'The picture stays in the display memory.' },
    ],
    sources: [S.tftguide, S.st7735, S.ds],
  }),

  // ============================================================ 48 RFID
  base(48, 'rfid', {
    module: 14, title: 'RFID reader RC522: read a card number', file: 'RfidReader.ino',
    goal: 'Read the unique number (UID) of an RFID card or tag with the MFRC522 chip over SPI.',
    hardware: ['ESP32 DevKit V1', 'RC522 RFID module with a card or tag', '7 × jumper wires', 'MFRC522 library (miguelbalboa)'],
    widgets: ['dv:rfid'], circuit: RFID, io: mio('rfid', 'rf1', ids(RFID), { G5: ['ss', 'rf1.SDA'], G27: ['rst', 'rf1.RST'], G23: ['mosi', 'rf1.MOSI'], G19: ['miso', 'rf1.MISO'], G18: ['sck', 'rf1.SCK'] }, [['rf1.3V3', '3V3'], ['rf1.GND', 'GND']]),
    explain: { 6: 'The reader object: SS (chip select) on GPIO5, reset on GPIO27.', 10: 'Start the SPI bus (default VSPI pins).', 11: 'Start the reader chip.', 16: 'Is a new card in the field, and can its number be read?', 18: 'A UID has 4, 7 or 10 bytes.', 23: 'Stop talking to this card so it is not read again and again.' },
    steps: [
      STEP('Cards without contact', 'scanv', [], `<p>The RC522 module contains the <b>MFRC522</b> chip and a printed antenna. A 13.56 MHz field powers a passive card, which answers with its <b>UID</b>.</p><p class="warn">A UID can be copied: it is not a secure password.</p>`),
      STEP('The module', 'scanv', ['rf1'], `<p><b>Click the module.</b> Datasheet: carrier 13.56 MHz, supply 2.5 to 3.3 V. The ESP32 runs at 3.3 V, so the module connects directly: power it from <b>3V3</b>.</p>`),
      STEP('Wire it', 'scanv', ids(RFID), `<p>Module pins to a10 to a16, board pins to the same columns in row b: <b>3V3</b> (10), <b>RST</b> to GPIO27 (11), <b>GND</b> (12), <b>MISO</b> to GPIO19 (13), <b>MOSI</b> to GPIO23 (14), <b>SCK</b> to GPIO18 (15), <b>SDA</b> (chip select) to GPIO5 (16). IRQ is unused.</p>`, { pins: ['3V3', 'G27', 'GND2', 'G19', 'G23', 'G18', 'G5'] }),
      STEP('The code', 'scanv', ids(RFID), `<p>Click lines <b>16</b> and <b>18</b> to <b>20</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and hold a card near', 'scanv', ids(RFID), `<p>Press <b>▶ Run</b>, then use <b>Card A near</b> or <b>Card B near</b>.</p><p class="sim">The UIDs are made up.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(RFID), `<ul><li>RC522: SPI, 3.3 V, 13.56 MHz.</li><li>A UID identifies a card but is not secret.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which supply does the RC522 chip need?', a: ['About 3.3 V', '12 V', '5 V only', 'None'], c: 0, why: 'Datasheet: 2.5 to 3.3 V.' },
      { q: 'What is a UID?', a: ['The unique number of a card', 'A password you choose', 'The reader’s address', 'An antenna'], c: 0, why: 'It identifies the card.' },
      { q: 'Why PICC_HaltA()?', a: ['So the same card is not read again and again', 'To turn off the reader', 'To erase the card', 'To save the UID'], c: 0, why: 'A halted card is ignored until it leaves the field.' },
    ],
    sources: [S.mfrc, S.mfrclib, S.ds],
  }),

  // ============================================================ 49 SD
  base(49, 'sd', {
    module: 14, title: 'microSD card: write a log file', file: 'SdLogger.ino',
    goal: 'Append a line to a text file on a microSD card every two seconds, and read the card on a computer afterwards.',
    hardware: ['ESP32 DevKit V1', 'microSD card module (SPI, with regulator and level shifters)', 'microSD card, FAT16 or FAT32', '6 × jumper wires'],
    widgets: ['dv:sd'], circuit: SD, io: mio('sd', 'sd1', ids(SD), { G5: ['cs', 'sd1.CS'], G23: ['mosi', 'sd1.MOSI'], G19: ['miso', 'sd1.MISO'], G18: ['sck', 'sd1.SCK'] }, [['sd1.VCC', 'VIN'], ['sd1.GND', 'GND']]),
    explain: { 4: 'The chip-select pin (GPIO5, the default VSPI CS).', 9: '<code>SD.begin()</code> returns false if there is no card or the wiring is wrong.', 17: 'Open (or create) the file; data is added at the end.', 21: '<b>close()</b> makes sure the data is written.' },
    steps: [
      STEP('Files for a microcontroller', 'scanv', [], `<p>An SD card module gives far more space than the flash and a format a computer can read. The SD library supports <b>FAT16 and FAT32</b>, with 8.3 file names (<code>LOG.TXT</code>).</p><p class="warn">Cards of 64 GB or more are usually exFAT: reformat to FAT32 or use a smaller card.</p>`),
      STEP('The module', 'scanv', ['sd1'], `<p><b>Click the module.</b> A card works at 3.3 V. Common modules have a 3.3 V regulator and level shifters and take 5 V on VCC (here VIN); their MISO output is then at card level. Modules without them must be powered from 3V3. <b>Read your module’s page.</b></p>`),
      STEP('Wire it', 'scanv', ids(SD), `<p>Module pins to a10 to a15, board pins to the same columns in row b: <b>GND</b> (10), <b>VCC</b> to VIN (11), <b>MISO</b> to GPIO19 (12), <b>MOSI</b> to GPIO23 (13), <b>SCK</b> to GPIO18 (14), <b>CS</b> to GPIO5 (15).</p>`, { pins: ['GND2', 'VIN', 'G19', 'G23', 'G18', 'G5'] }),
      STEP('The code', 'scanv', ids(SD), `<p>Click lines <b>9</b> and <b>17</b> to <b>21</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'scanv', ids(SD), `<p>Press <b>▶ Run</b>: a line is added to <code>LOG.TXT</code> every two seconds. Use “Card: removed” and run again to see the error path.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(SD), `<ul><li><code>SD.begin(cs)</code>, <code>SD.open(name, FILE_WRITE)</code>, <code>close()</code>.</li><li>FAT16/FAT32, 8.3 names.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does SD.begin() return without a card?', a: ['false', 'true', 'The card size', 'Nothing'], c: 0, why: 'Initialisation fails.' },
      { q: 'Why close the file?', a: ['So the data is really written', 'To eject the card', 'To format it', 'To start the clock'], c: 0, why: 'Unwritten data can be lost.' },
      { q: 'Which ESP32 pin is the default VSPI MISO?', a: ['GPIO19', 'GPIO5', 'GPIO23', 'GPIO18'], c: 0, why: 'MISO 19, MOSI 23, SCK 18, CS 5.' },
    ],
    sources: [S.sdlib, S.ds],
  }),

  // ============================================================ 50 gas
  base(50, 'gas', {
    module: 15, title: 'MQ-2 gas sensor: smoke and combustible gas', file: 'GasSensor.ino',
    goal: 'Read the analog output of an MQ-2 module through a voltage divider and print a warning when the level is high.',
    hardware: ['ESP32 DevKit V1', 'MQ-2 gas sensor module', '10 kΩ and 20 kΩ resistors (divider)', '5 × jumper wires', 'Breadboard'],
    widgets: ['dv:gas'], circuit: GAS, io: { G34: { kind: 'dev:gas', role: 'ao', item: 'gs1', div: 2 / 3, needs: ids(GAS), mp: '', pw: [['gs1.VCC', 'VIN'], ['gs1.GND', 'GND']] } },
    explain: { 1: 'GPIO34 is an ADC1 input. AO reaches it through the divider.', 2: 'Your alarm level (in ADC counts). Set it after you measured clean air with your own sensor.', 7: 'The heating element needs time to warm up.', 11: 'The raw level, 0 to 4095.', 14: 'Warn above the alarm level.' },
    steps: [
      STEP('A sensor that needs heat', 'scanv', [], `<p>The MQ-2 has a tin-oxide element kept hot by a heater. Combustible gases and smoke change its resistance, and the module turns that into the voltage on AO.</p><p class="warn">It reacts to LPG, propane, methane, hydrogen, alcohol and smoke and cannot tell them apart. Without calibration the number is not ppm, and this part is not a safety alarm. The ESP32 ADC is also not perfectly linear.</p>`),
      STEP('Why a divider?', 'scanv', ['gs1', 'ra', 'rb'], `<p><b>Click the module.</b> The heater needs <b>5 V</b>, so the module runs from VIN, and its AO output can rise towards 5 V. An ESP32 input must not go above 3.3 V. A divider of <b>10 kΩ</b> and <b>20 kΩ</b> reduces the voltage to 2/3: 5 V becomes about 3.3 V.</p><p class="warn">The DO output of the module is also at supply level (up to 5 V): this lesson does not use it. Do not connect it to a GPIO without a divider.</p>`),
      STEP('Wire it', 'scanv', ids(GAS), `<p>Module pins to a10 to a12 and the board to row b: <b>VCC</b> to VIN (column 10), <b>GND</b> to GND (11), <b>AO</b> in column 12. The 10 kΩ resistor goes from column 12 to column 16, the 20 kΩ resistor from column 16 to column 11 (GND), and <b>GPIO34</b> connects to column 16 (the middle of the divider).</p>`, { pins: ['VIN', 'GND2', 'G34'] }),
      STEP('The code', 'scanv', ids(GAS), `<p>Click lines <b>11</b> and <b>14</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and add smoke', 'scanv', ids(GAS), `<p>Press <b>▶ Run</b> and raise the <b>Smoke / gas</b> slider: the level rises; above the alarm level the sketch prints GAS!.</p><p class="sim">Typical voltages, a linear ADC and no real calibration.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(GAS), `<ul><li>MQ-2: heater (5 V), AO level, needs warm-up and calibration.</li><li>5 V outputs need a divider before an ESP32 pin.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Why a voltage divider on AO?', a: ['AO can exceed the 3.3 V an ESP32 input allows', 'To make it faster', 'To save power', 'The library needs it'], c: 0, why: 'The module runs at 5 V.' },
      { q: 'Can an MQ-2 tell methane from smoke?', a: ['No', 'Yes', 'Only with DO', 'Only at night'], c: 0, why: 'It is not selective.' },
      { q: 'Which ADC pins work while Wi-Fi is on?', a: ['ADC1 (GPIO32 to 39)', 'ADC2 pins', 'None', 'All'], c: 0, why: 'ADC2 is used by Wi-Fi.' },
    ],
    sources: [S.mq2, S.adc, S.ds],
  }),

  // ============================================================ 51 flame
  base(51, 'flame', {
    module: 15, title: 'Flame sensor: an infrared eye', level: 'Beginner', time: '20 min', file: 'FlameSensor.ino',
    goal: 'Detect an infrared source such as a flame with a flame sensor module and light an LED.',
    hardware: ['ESP32 DevKit V1', 'The LED circuit of Lesson 2', 'Flame sensor module (AO and DO)', '4 × jumper wires'],
    widgets: ['dv:flame'], circuit: [...LED_CIRCUIT, ...FLAME], io: { G16: IO_LED, ...mio('flame', 'fl1', [...LED_IDS, ...ids(FLAME)], { G34: ['ao', 'fl1.AO', 'fl1', { vs: 3.3 }], G26: ['do', 'fl1.DO'] }, [['fl1.VCC', '3V3'], ['fl1.GND', 'GND']]) },
    explain: { 1: 'DO of the module (GPIO26).', 2: 'AO (GPIO34, ADC1).', 3: 'The LED of Lesson 2.', 12: 'On most modules DO goes LOW when the infrared level passes the trimmer setting.', 13: 'Light the LED.', 15: 'The analog level, 0 to 4095.' },
    steps: [
      STEP('Seeing infrared', 'scanv', [], `<p>A flame gives off infrared light. The sensor is an infrared photodiode followed by a comparator (an LM393 on most modules) with a trimmer: DO switches when the level passes the setting.</p><p class="warn">It is not a fire alarm: sunlight and lamps contain infrared too, and it does not measure temperature.</p>`),
      STEP('The module', 'scanv', ['fl1'], `<p><b>Click the module.</b> Seller listings give a range of about 760 to 1100 nm and an angle of about 60° (typical values, no maker datasheet). The LM393 works from about 3 V, so the module is powered from <b>3V3</b> and its outputs stay within 3.3 V.</p>`),
      STEP('Wire it', 'scanv', [...LED_IDS, ...ids(FLAME)], `<p>Module pins to a20 to a23, board pins to the same columns in row b: <b>VCC</b> to 3V3 (20), <b>GND</b> to GND (21), <b>DO</b> to GPIO26 (22), <b>AO</b> to GPIO34 (23). The LED is as in Lesson 2.</p>`, { pins: ['3V3', 'GND1', 'G26', 'G34'] }),
      STEP('The code', 'scanv', [...LED_IDS, ...ids(FLAME)], `<p>Click lines <b>12</b> and <b>13</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and bring a flame near', 'scanv', [...LED_IDS, ...ids(FLAME)], `<p>Press <b>▶ Run</b> and raise the infrared slider: past the trimmer level the LED lights.</p><p class="sim">Typical behaviour; your board may be wired the other way round.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', [...LED_IDS, ...ids(FLAME)], `<ul><li>Infrared photodiode plus comparator: DO threshold, AO level.</li><li>Sunlight and lamps can trigger it.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does the sensor detect?', a: ['Infrared light', 'Heat directly', 'Smoke', 'Sound'], c: 0, why: 'An infrared photodiode.' },
      { q: 'On most modules DO does what when a flame is seen?', a: ['Goes LOW', 'Goes HIGH', 'Blinks', 'Turns into AO'], c: 0, why: 'Typical, but check yours.' },
      { q: 'Why false alarms?', a: ['Sunlight and lamps contain infrared', 'It hears noise', 'The cable is long', 'It is too small'], c: 0, why: 'Other infrared sources trigger it.' },
    ],
    sources: [S.lm393, S.adc, S.ds],
  }),

  // ============================================================ 52 GPS
  base(52, 'gps', {
    module: 15, title: 'GPS NEO-6M: where am I?', time: '30 min', file: 'GpsPosition.ino',
    goal: 'Receive NMEA text from a GPS module on the second hardware UART of the ESP32 and print position and satellites with TinyGPSPlus.',
    hardware: ['ESP32 DevKit V1', 'NEO-6M GPS module with antenna', '4 × jumper wires', 'TinyGPSPlus library'],
    widgets: ['dv:gps'], circuit: GPS, io: mio('gps', 'gp1', ids(GPS), { G16: ['tx', 'gp1.TX'], G17: ['rx', 'gp1.RX'] }, [['gp1.VCC', '3V3'], ['gp1.GND', 'GND']]),
    explain: { 3: 'A hardware serial port: UART2 (the ESP32 has three UARTs; UART0 is the USB serial).', 8: '9600 baud, RX = GPIO16, TX = GPIO17.', 12: 'Feed every received character to the decoder.', 13: 'Has the receiver found a position?', 20: 'No fix yet: indoors this stays the case.' },
    steps: [
      STEP('Position from the sky', 'scanv', [], `<p>The module sends lines of text in the <b>NMEA</b> format over a serial port. The u-blox NEO-6 data sheet gives 9600 baud and 1 Hz as defaults.</p><p class="warn">It needs a clear view of the sky: a cold start takes tens of seconds or longer, and indoors you usually get no fix.</p>`),
      STEP('The module', 'scanv', ['gp1'], `<p><b>Click the module.</b> The wires are crossed: the module’s <b>TX</b> goes to the ESP32’s receive pin (<b>RX2 = GPIO16</b>) and its <b>RX</b> to the transmit pin (TX2 = GPIO17). The chip is a 3.3 V part; the common boards accept about 3.3 to 5 V (check yours), so 3V3 is used here.</p>`),
      STEP('Wire it', 'scanv', ids(GPS), `<p>Module pins to a10 to a13, board pins to row b: <b>VCC</b> to 3V3 (10), <b>GND</b> to GND (11), <b>TX</b> to GPIO16 (12), <b>RX</b> to GPIO17 (13).</p>`, { pins: ['3V3', 'GND2', 'G16', 'G17'] }),
      STEP('The code', 'scanv', ids(GPS), `<p>Click lines <b>8</b>, <b>12</b> and <b>13</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'scanv', ids(GPS), `<p>Press <b>▶ Run</b>: “Waiting for a fix…” first, then the position after 6 s (much longer in reality). Switch “Open sky” off to see that no fix arrives.</p><p class="sim">The position is an example.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(GPS), `<ul><li>NMEA over a UART, 9600 baud by default.</li><li>Cross TX and RX; the ESP32 has a spare hardware UART.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'The module TX wire goes to…', a: ['An ESP32 receive pin', 'An ESP32 transmit pin', 'GND', '3V3'], c: 0, why: 'Transmit meets receive.' },
      { q: 'Why is there often no fix indoors?', a: ['The satellite signals are too weak', 'The ESP32 is too slow', 'The baud rate is wrong', 'GPS needs Wi-Fi'], c: 0, why: 'The signals are weak.' },
      { q: 'How many hardware UARTs does the ESP32 have?', a: ['Three', 'One', 'Two', 'Eight'], c: 0, why: 'UART0, UART1 and UART2.' },
    ],
    sources: [S.gps, S.serial, S.ds],
  }),

  // ============================================================ 53 RTC
  base(53, 'rtc', {
    module: 15, title: 'DS3231 real-time clock: the time without Wi-Fi', file: 'RtcClock.ino',
    goal: 'Read the date and time from a DS3231 clock over I²C, set it once, and read its temperature.',
    hardware: ['ESP32 DevKit V1', 'DS3231 RTC module with a coin cell', '4 × jumper wires', 'RTClib library'],
    widgets: ['dv:rtc'], circuit: RTC, io: mio('rtc', 'rt1', ids(RTC), { G21: ['sda', 'rt1.SDA'], G22: ['scl', 'rt1.SCL'] }, [['rt1.VCC', '3V3'], ['rt1.GND', 'GND']]),
    explain: { 4: 'The clock chip object.', 8: 'Start the chip on the I²C bus (address 0x68, default pins GPIO21 and GPIO22).', 12: '<code>lostPower()</code> is true when the oscillator stopped: the time is not valid.', 13: 'Set it to the compile time, once.', 18: 'Read the time.', 31: 'The DS3231 also has a temperature sensor.' },
    steps: [
      STEP('A clock that keeps running', 'scanv', [], `<p>The ESP32 can get the time from the internet (NTP lesson), but without Wi-Fi it forgets it. The <b>DS3231</b> has its own crystal and a coin cell. Datasheet: accuracy ±2 ppm from 0 to +40 °C (about a minute per year); I²C address <b>0x68</b>.</p>`),
      STEP('The module', 'scanv', ['rt1'], `<p><b>Click the module.</b> The DS3231 works from 2.3 to 5.5 V, so it is powered from <b>3V3</b> and the pull-up resistors on the module also go to 3.3 V. Some boards have a charging circuit meant for a rechargeable cell: check the board before you fit a CR2032.</p>`),
      STEP('Wire it', 'scanv', ids(RTC), `<p>Module pins to a10 to a13, board pins to row b: <b>VCC</b> to 3V3 (10), <b>GND</b> to GND (11), <b>SDA</b> to GPIO21 (12), <b>SCL</b> to GPIO22 (13).</p>`, { pins: ['3V3', 'GND2', 'G21', 'G22'] }),
      STEP('The code', 'scanv', ids(RTC), `<p>Click lines <b>12</b> and <b>13</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'scanv', ids(RTC), `<p>Press <b>▶ Run</b>: the first time the time is set; run again and it keeps counting. “Remove the coin cell” shows the lost-power path.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(RTC), `<ul><li>DS3231: I²C 0x68, ±2 ppm, coin-cell backup, temperature sensor.</li><li>Set the time once; then only read it.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What I²C address does the DS3231 use?', a: ['0x68', '0x3C', '0x27', '0x76'], c: 0, why: 'Datasheet.' },
      { q: 'What does lostPower() tell you?', a: ['The time is not valid and must be set', 'USB is unplugged', 'The battery is full', 'The time zone changed'], c: 0, why: 'The oscillator stopped.' },
      { q: 'Default I²C pins of the ESP32 DevKit?', a: ['GPIO21 (SDA) and GPIO22 (SCL)', 'GPIO1 and GPIO3', 'GPIO34 and GPIO35', 'GPIO16 and GPIO17'], c: 0, why: 'See the pin data.' },
    ],
    sources: [S.ds3231, S.rtclib, S.ds],
  }),

  // ============================================================ 54 A4988
  base(54, 'a4988', {
    module: 16, title: 'A4988 driver and a NEMA 17 stepper motor', level: 'Advanced', time: '35 min', file: 'StepperA4988.ino',
    goal: 'Drive a bipolar stepper motor with an A4988 driver: one pulse on STEP is one step, DIR sets the direction.',
    hardware: ['ESP32 DevKit V1', 'A4988 stepper driver carrier', 'NEMA 17 bipolar stepper motor (1.8° per step)', 'Motor supply 8 to 35 V (for example 12 V)', '100 µF capacitor across the motor supply', 'Jumper wires'],
    widgets: ['dv:a4988'], circuit: A4, io: mio('a4988', 'mot1', ids(A4), { G25: ['step', 'dv1.STEP'], G26: ['dir', 'dv1.DIR'], G27: ['en', 'dv1.ENABLE'] }, [['dv1.VDD', '3V3'], ['dv1.GND', 'GND']]),
    explain: { 1: 'Each pulse on STEP moves the motor one step.', 2: 'DIR chooses the direction.', 3: 'ENABLE is active LOW.', 4: '200 full steps per revolution for a 1.8° motor.', 10: 'Enable the driver.', 15: 'One revolution: 200 pulses.', 18: '2 ms per step: 500 steps per second.' },
    steps: [
      STEP('A driver between the ESP32 and the motor', 'scanv', [], `<p>The <b>A4988</b> drives the coils of a bipolar stepper: each pulse on <b>STEP</b> moves the motor one step, <b>DIR</b> sets the direction. Pololu A4988 carrier: motor supply (VMOT) <b>8 to 35 V</b>, logic supply (VDD) 3 to 5.5 V, about 1 A per coil without a heat sink, up to about 2 A with good cooling. The 3.3 V of an ESP32 is within the logic range, so VDD is connected to 3V3.</p>`),
      STEP('Safety rules', 'scanv', ['dv1', 'mot1'], `<p><b>Click the driver and the motor.</b></p><p class="warn">Never connect or disconnect the motor while the motor supply is on: the voltage spikes can destroy the driver. Put at least 47 µF across VMOT and GND close to the driver. Set the current limit with the trimmer (I = VREF ÷ (8 × R<sub>sense</sub>); R<sub>sense</sub> depends on the board version) before running the motor for long. RESET and SLEEP must not float: they are joined here.</p>`),
      STEP('Wire it', 'scanv', ids(A4), `<p>Driver pins to row a and board pins to row b of the same column: <b>VDD</b> to 3V3 (10), <b>GND</b> to GND (11), <b>STEP</b> to GPIO25 (12), <b>DIR</b> to GPIO26 (13), <b>ENABLE</b> to GPIO27 (14). <b>SLEEP</b> (15) and <b>RESET</b> (16) are joined by a short wire. The motor’s two coils (find each pair with a multimeter) go to 1A/1B and 2A/2B. The motor supply (8 to 35 V) is <b>not drawn</b>: it must share GND with the board; the panel has a switch for it.</p>`, { pins: ['3V3', 'GND2', 'G25', 'G26', 'G27'] }),
      STEP('The code', 'scanv', ids(A4), `<p>Click lines <b>10</b>, <b>15</b> and <b>16</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'scanv', ids(A4), `<p>Switch the <b>motor supply</b> on, then press <b>▶ Run</b>: one revolution, a pause, and back. Without the supply the steps are counted but the motor does not move.</p><p class="sim">The simulator cannot wait less than a few milliseconds, so it is slower than the code; the step count and the angle are exact.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(A4), `<ul><li>STEP pulse = one step; DIR = direction; ENABLE active LOW.</li><li>Never unplug the motor with the supply on.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Full steps per revolution of a 1.8° motor?', a: ['200', '360', '18', '2048'], c: 0, why: '360 ÷ 1.8.' },
      { q: 'Why not unplug the motor with the supply on?', a: ['Voltage spikes can destroy the driver', 'The motor spins', 'The ESP32 resets', 'Nothing happens'], c: 0, why: 'Pololu warns about this.' },
      { q: 'ENABLE active LOW means…', a: ['The driver works when the pin is LOW', 'The driver works when HIGH', 'The pin floats', 'The pin is analog'], c: 0, why: 'LOW enables the outputs.' },
    ],
    sources: [S.a4988, S.a4988ds, S.ds],
  }),

  // ============================================================ 55 fan
  base(55, 'fan', {
    module: 16, title: 'Fan or pump: speed control with a MOSFET and PWM', level: 'Advanced', time: '30 min', file: 'FanSpeed.ino',
    goal: 'Control the speed of a small DC motor (a fan or a pump) from a PWM pin of the ESP32 through a MOSFET, with a flyback diode.',
    hardware: ['ESP32 DevKit V1', 'IRLZ44N MOSFET', '220 Ω and 10 kΩ resistors', '1N4007 diode', 'Small DC motor (fan or pump) and a 6 V battery pack', 'Jumper wires'],
    widgets: ['dv:fan'], circuit: FAN, io: mio('fan', 'mot1', ids(FAN), { G25: ['gate', ''] }),
    explain: { 1: 'A PWM-capable pin goes to the gate through 220 Ω.', 2: '5 kHz PWM.', 3: '8-bit duty: 0 to 255.', 7: 'Arduino-ESP32 core 3.x: attach the pin to a LEDC PWM channel.', 12: 'Set the duty. The MOSFET switches the motor on and off at 5 kHz, so the motor sees the average voltage.' },
    steps: [
      STEP('Speed control with PWM', 'farq', [], `<p>A PWM signal switches the MOSFET fast, so the motor receives the supply voltage for part of each period: the average voltage, and the speed, follow the duty cycle. Pumps and fans are small DC motors, so the same circuit works for both.</p>`),
      STEP('The circuit', 'farq', ids(FAN), `<ul><li>A <b>220 Ω</b> resistor from the pin to the gate and a <b>10 kΩ</b> resistor from the gate to GND.</li><li>The motor is between the battery + and the <b>drain</b>; the battery − joins the source column and the board GND.</li><li>The <b>1N4007</b> across the motor, band toward the battery +: a flyback diode that absorbs the spike when the MOSFET switches off.</li></ul><p class="warn">The IRLZ44N datasheet gives its on-resistance at gate voltages of 4 V and above: at the <b>3.3 V</b> of an ESP32 pin it is <b>not guaranteed</b>. A small motor works, but a big motor can make the MOSFET hot. For bigger loads use a MOSFET specified at 3.3 V gate drive. Do not power a motor from the board: use its own supply.</p>`),
      STEP('Wire it', 'farq', ids(FAN), `<ul><li>Yellow wire: <b>GPIO25</b> to column 5 (b5)</li><li>Black wire: <b>GND</b> to column 12 (b12)</li></ul><p>The motor circuit is separate: battery + to the motor and the diode band; the motor’s other wire to the <b>drain</b> (column 11); battery − to the source column 12.</p>`, { pins: ['G25', 'GND2'] }),
      STEP('The code', 'farq', ids(FAN), `<p>Click lines <b>7</b> and <b>12</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'farq', ids(FAN), `<p>Press <b>▶ Run</b>: the motor goes through six speeds. At the lowest setting it does not turn: a small DC motor needs a minimum voltage.</p><p class="sim">The start threshold (about 25 % duty) is a typical assumption.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'farq', ids(FAN), `<ul><li>PWM on a MOSFET: speed control.</li><li>Flyback diode across every motor.</li><li>Check the MOSFET at 3.3 V gate drive.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does PWM change?', a: ['The fraction of time the motor is on', 'The battery voltage', 'The motor size', 'The wire colour'], c: 0, why: 'Duty cycle sets the average.' },
      { q: 'What is the diode across the motor for?', a: ['It absorbs the voltage spike at switch-off', 'It speeds up the motor', 'It charges the battery', 'Decoration'], c: 0, why: 'A flyback diode.' },
      { q: 'Why check the MOSFET at 3.3 V gate drive?', a: ['Datasheet values are given from 4 V up', 'It is always fine', 'The ESP32 has no gate', 'PWM needs 5 V'], c: 0, why: 'The IRLZ44N gives no value at 3.3 V.' },
    ],
    sources: [S.irlz44n, S.ledc, S.ds],
  }),

  // ============================================================ 56 UART
  base(56, 'uart', {
    module: 16, title: 'Two boards talk: a serial link (UART)', file: 'SerialLink.ino',
    goal: 'Connect two boards with three wires (TX, RX, GND) and exchange text lines on the second hardware serial port.',
    hardware: ['ESP32 DevKit V1', 'A second board with its own sketch (board B), 3.3 V logic', '3 × jumper wires'],
    widgets: ['dv:peer'], circuit: UART, io: mio('peer', 'pr1', ids(UART), { G16: ['rx', 'pr1.TX'], G17: ['tx', 'pr1.RX'] }),
    explain: { 5: 'UART2 at 9600 baud on RX = GPIO16, TX = GPIO17. Any free GPIO pair can be chosen here.', 9: 'Send text to board B…', 10: '…with a line break.', 13: 'Remember the start time.', 14: 'For one second…', 15: '…copy what board B sends back to the monitor.' },
    steps: [
      STEP('Two boards, one conversation', 'scanv', [], `<p>A <b>UART</b> link needs two data wires and a common ground: my TX goes to your RX and my RX to your TX (crossed), and both sides use the same baud rate. The ESP32 has three hardware UARTs; UART0 is the USB serial, so <b>Serial2</b> is free for the link and no software serial is needed.</p><p class="warn">Both boards must use 3.3 V logic. A 5 V board needs a level shifter, because the ESP32 inputs are not 5 V tolerant.</p>`),
      STEP('Board B', 'scanv', ['pr1'], `<p><b>Click board B.</b> A simplified drawing of a second board; it answers each line with “ACK” and the same number.</p>`),
      STEP('Wire it', 'scanv', ids(UART), `<p>Board B pins to row a and ESP32 pins to row b: B’s <b>TX</b> to GPIO16 (column 10), B’s <b>RX</b> to GPIO17 (11), <b>GND</b> to GND (12).</p>`, { pins: ['G16', 'G17', 'GND2'] }),
      STEP('The code', 'scanv', ids(UART), `<p>Click lines <b>5</b>, <b>9</b> and <b>15</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and break it', 'scanv', ids(UART), `<p>Press <b>▶ Run</b>: a line is sent every second and board B answers. Then press “TX and RX not crossed” and “Board B uses 4800 baud”: nothing arrives, or garbage. These are the two most common serial errors.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(UART), `<ul><li>TX crosses to RX, common GND, same baud rate.</li><li>Serial2 on any GPIO pair; 3.3 V levels only.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Board A TX goes to…', a: ['Board B RX', 'Board B TX', 'GND', '3V3'], c: 0, why: 'Transmit meets receive.' },
      { q: 'Different baud rates show…', a: ['Garbage characters', 'Nothing', 'A faster link', 'An IDE error'], c: 0, why: 'Bits are sampled at the wrong times.' },
      { q: 'Why not use GPIO1 and GPIO3 for the link?', a: ['They are the USB serial (UART0)', 'They are analog', 'They do not exist', 'They are PWM'], c: 0, why: 'Used by the USB-to-serial chip.' },
    ],
    sources: [S.serial, S.ds],
  }),

  // ============================================================ 57 Bluetooth classic
  base(57, 'btc', {
    module: 17, title: 'Classic Bluetooth: control an LED from a phone', level: 'Advanced', time: '25 min', file: 'BluetoothLed.ino',
    goal: 'Use the classic Bluetooth built into the ESP32 (BluetoothSerial) to switch an LED with the characters 1 and 0 from a phone terminal app.',
    hardware: ['ESP32 DevKit V1', 'The LED circuit of Lesson 2', 'An Android phone with a Bluetooth serial terminal app'],
    widgets: ['dv:btc'], circuit: LED_CIRCUIT, io: { G16: IO_LED },
    explain: { 1: 'The BluetoothSerial library (included with the Arduino-ESP32 core).', 3: 'The serial-over-Bluetooth object.', 9: 'Start Bluetooth with the name the phone sees.', 13: 'Did the phone send a character?', 17: '“1” turns the LED on…', 18: '…“0” turns it off.', 19: 'Answer the phone.' },
    steps: [
      STEP('A wireless serial cable, built in', 'bench', [], `<p>The original ESP32 has <b>classic Bluetooth</b> and BLE on the chip. <code>BluetoothSerial</code> makes a serial port over classic Bluetooth, so no extra module (like the HC-05 on other boards) is needed.</p><p class="warn">Classic Bluetooth exists on the original ESP32 only (not on the ESP32-S3 or -C3), and the Bluetooth stack uses a large part of the flash. Android phones and computers support the serial port profile; iPhones do not (use BLE there).</p>`),
      STEP('The circuit', 'bench', LED_IDS, `<p>The LED circuit of Lesson 2 (GPIO16). No other wiring is needed.</p>`),
      STEP('The code', 'bench', LED_IDS, `<p>Click lines <b>9</b>, <b>13</b> and <b>17</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and use the phone', 'bench', LED_IDS, `<p>Press <b>▶ Run</b>, then <b>Pair</b>. Press <b>1</b> and <b>0</b>: the LED switches and the ESP32 answers “LED is on/off”.</p><p class="sim">The phone is simulated; the real pairing happens in the phone’s Bluetooth settings.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', LED_IDS, `<ul><li><code>BluetoothSerial</code>: a serial port over classic Bluetooth, no extra part.</li><li>Original ESP32 only; not for iPhones.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which ESP32 chips have classic Bluetooth?', a: ['The original ESP32', 'ESP32-S3', 'ESP32-C3', 'None'], c: 0, why: 'Only the original ESP32.' },
      { q: 'Which phones can use the serial port profile?', a: ['Android phones', 'iPhones', 'Both always', 'Neither'], c: 0, why: 'iOS does not support it.' },
      { q: 'The phone sends 1. What happens?', a: ['The LED turns on', 'The ESP32 resets', 'Bluetooth turns off', 'Nothing'], c: 0, why: 'See the sketch.' },
    ],
    sources: [S.bt, S.ds],
  }),

  // ============================================================ 58 ESP-NOW
  base(58, 'espnow', {
    module: 17, title: 'ESP-NOW: board to board without a router', level: 'Advanced', time: '30 min', file: 'EspNowSender.ino',
    goal: 'Send small packets from one ESP32 to another with ESP-NOW, using the receiver’s MAC address.',
    hardware: ['ESP32 DevKit V1 (sender)', 'A second ESP32 board (receiver, with a receive sketch)'],
    widgets: ['dv:espnow'], circuit: [], io: {},
    explain: { 4: 'The MAC address of the receiver. Every ESP32 has its own: print it with <code>WiFi.macAddress()</code> on the receiver.', 7: 'The callback that tells you whether the packet was delivered. The parameters of this function changed in newer Arduino-ESP32 versions: if the compiler complains, check the example of your version.', 13: 'ESP-NOW needs the Wi-Fi radio in station mode (no router needed).', 14: 'Start ESP-NOW.', 19: 'The peer: who we send to.', 30: 'Send up to 250 bytes.' },
    steps: [
      STEP('Boards that talk directly', 'bench', [], `<p><b>ESP-NOW</b> is Espressif’s protocol for small packets (up to 250 bytes) between ESP32 boards, using the Wi-Fi radio but <b>no router and no connection</b>. You only need the receiver’s <b>MAC address</b>.</p><p class="warn">The MAC in the listing is made up. The function parameters of the send callback depend on the Arduino-ESP32 version: follow the ESP-NOW example that comes with your version. Both boards should use the same Wi-Fi channel.</p>`),
      STEP('No wiring', 'bench', [], `<p>The radio is on the chip. There is no circuit; the second board is simulated in the panel.</p>`),
      STEP('The code', 'bench', [], `<p>Click lines <b>14</b>, <b>19</b> and <b>30</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and change the receiver', 'bench', [], `<p>Press <b>▶ Run</b>: every packet is “delivered” and the receiver shows it. Switch the receiver off, or choose a different MAC: the packets fail.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', [], `<ul><li>ESP-NOW: packets of up to 250 bytes, no router, peers by MAC address.</li><li>The send callback reports delivery.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What do you need to send to another board with ESP-NOW?', a: ['Its MAC address', 'A router password', 'An IP address', 'A cable'], c: 0, why: 'Peers are addressed by MAC.' },
      { q: 'How big can one packet be?', a: ['Up to 250 bytes', 'Up to 1 MB', 'Up to 4 bytes', 'Unlimited'], c: 0, why: 'ESP-NOW limit.' },
      { q: 'Is a Wi-Fi router needed?', a: ['No', 'Yes', 'Only at night', 'Only for the callback'], c: 0, why: 'Direct board to board.' },
    ],
    sources: [S.espnow, S.ds],
  }),

  // ============================================================ 59 nRF24
  base(59, 'nrf', {
    module: 17, title: 'nRF24L01+: a radio link between two boards', level: 'Advanced', time: '30 min', file: 'RadioSender.ino',
    goal: 'Send a message with an nRF24L01+ radio module and see that the receiver only hears it when channel and address match.',
    hardware: ['ESP32 DevKit V1', 'nRF24L01+ module (and a second one for a receiver)', '7 × jumper wires', 'RF24 library'],
    widgets: ['dv:nrf'], circuit: NRF, io: mio('nrf', 'nr1', ids(NRF), { G25: ['ce', 'nr1.CE'], G26: ['csn', 'nr1.CSN'], G23: ['mosi', 'nr1.MOSI'], G19: ['miso', 'nr1.MISO'], G18: ['sck', 'nr1.SCK'] }, [['nr1.VCC', '3V3'], ['nr1.GND', 'GND']]),
    explain: { 4: 'CE on GPIO25, CSN on GPIO26; the SPI pins are the default VSPI pins.', 5: 'The 5-byte address; sender and receiver must match.', 10: 'Start the radio; false if the chip does not answer.', 14: 'Channel 0 to 125: frequency = 2400 MHz + channel.', 16: 'This board only sends.', 22: 'true if the receiver acknowledged.' },
    steps: [
      STEP('A small radio', 'scanv', [], `<p>The nRF24L01+ is a 2.4 GHz radio for short messages between modules of the same kind. It is <b>not</b> Wi-Fi or Bluetooth. Data rates 250 kbit/s, 1 and 2 Mbit/s; the channel number sets the frequency to 2400 MHz + channel. With auto-acknowledge, <code>write()</code> tells you whether the packet arrived.</p>`),
      STEP('The module', 'scanv', ['nr1'], `<p><b>Click the module.</b> Supply <b>1.9 to 3.6 V</b> (Nordic): the ESP32’s 3V3 is right. A 10 µF capacitor close to the module between VCC and GND is common advice for a stable link. Note the 3.3 V pin of the board must supply the radio’s peaks: check the current limit of your board’s regulator.</p>`),
      STEP('Wire it', 'scanv', ids(NRF), `<p>Module pins to row a, board pins to row b: <b>VCC</b> to 3V3 (10), <b>GND</b> to GND (11), <b>CE</b> to GPIO25 (12), <b>CSN</b> to GPIO26 (13), <b>SCK</b> to GPIO18 (14), <b>MOSI</b> to GPIO23 (15), <b>MISO</b> to GPIO19 (16). IRQ is unused.</p>`, { pins: ['3V3', 'GND2', 'G25', 'G26', 'G18', 'G23', 'G19'] }),
      STEP('The code', 'scanv', ids(NRF), `<p>Click lines <b>14</b>, <b>15</b> and <b>22</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and change the receiver', 'scanv', ids(NRF), `<p>Press <b>▶ Run</b>: the simulated receiver gets “hello 0”, “hello 1” … Change its channel or address, or switch it off: “no answer”.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'scanv', ids(NRF), `<ul><li>nRF24L01+: SPI plus CE and CSN, 1.9 to 3.6 V.</li><li>Same channel, rate and address on both sides.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Supply of the nRF24L01+?', a: ['1.9 to 3.6 V', '5 V', '12 V', '24 V'], c: 0, why: 'Nordic specification.' },
      { q: 'Channel 76 is at…', a: ['2476 MHz', '76 MHz', '2.4 MHz', '7.6 GHz'], c: 0, why: '2400 + 76.' },
      { q: 'write() returns false. A reason?', a: ['The receiver is off or uses another channel or address', 'A comment in the code', 'A red cable', 'A short sketch'], c: 0, why: 'No acknowledge.' },
    ],
    sources: [S.nrf, S.rf24, S.ds],
  }),

  // ============================================================ 60 timer
  base(60, 'timer', {
    module: 18, title: 'Hardware timer: a blink that never stops', time: '20 min', file: 'TimerBlink.ino',
    goal: 'Use a hardware timer of the ESP32 to run a function every 0.5 s, independent of loop().',
    hardware: ['ESP32 DevKit V1', 'The LED circuit of Lesson 2'],
    widgets: [], circuit: LED_CIRCUIT, io: { G16: IO_LED },
    explain: { 2: 'A handle for one of the ESP32’s hardware timers.', 6: 'The timer interrupt handler. <b>IRAM_ATTR</b> puts it in internal RAM so that it can run at any moment.', 15: '1 MHz tick: one tick is one microsecond (Arduino-ESP32 core 3.x; version 2.x used another call).', 16: 'Call onTimer() when the alarm fires.', 17: 'The alarm: every 500 000 ticks, reloading automatically.', 22: 'loop() is busy for 2 s, yet the LED keeps blinking.' },
    steps: [
      STEP('Time without delay()', 'bench', [], `<p>A <code>delay()</code> stops the sketch. The ESP32 has four 64-bit hardware timers that count by themselves and can call a function at regular intervals. In an interrupt handler keep the code short.</p><p class="warn">The timer API changed between Arduino-ESP32 core 2.x and 3.x (<code>timerBegin(frequency)</code> and <code>timerAlarm()</code> are the 3.x forms). Follow the example of your version.</p>`),
      STEP('The circuit', 'bench', LED_IDS, `<p>The LED circuit of Lesson 2 (GPIO16).</p>`),
      STEP('The code', 'bench', LED_IDS, `<p>Click lines <b>15</b> to <b>17</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'bench', LED_IDS, `<p>Press <b>▶ Run</b>: the LED toggles every 0.5 s while loop() prints only every 2 s (4 interrupts per print).</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', LED_IDS, `<ul><li>Hardware timer: counts by itself, calls a handler.</li><li>The handler is <code>IRAM_ATTR</code> and short.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'timerAlarm(timer, 250000, true, 0) with a 1 MHz timer gives a period of…', a: ['0.25 s', '250 s', '25 ms', '2.5 s'], c: 0, why: '250 000 µs.' },
      { q: 'What does IRAM_ATTR do?', a: ['Puts the handler in internal RAM', 'Makes it faster to type', 'Disables Wi-Fi', 'Sets the pin'], c: 0, why: 'It can run while flash is busy.' },
      { q: 'Why does the LED keep blinking during delay(2000)?', a: ['The hardware timer calls the handler', 'delay() is short', 'The LED remembers', 'It does not'], c: 0, why: 'Interrupts run while loop() waits.' },
    ],
    sources: [S.timer, S.ds],
  }),

  // ============================================================ 61 Preferences
  base(61, 'prefs', {
    module: 18, title: 'Preferences: settings that survive power-off', level: 'Beginner', time: '15 min', file: 'PrefsCounter.ino',
    goal: 'Store a number in the ESP32 flash with the Preferences library so that it is still there after a restart.',
    hardware: ['ESP32 DevKit V1'],
    widgets: ['dv:prefs'], circuit: [], io: {},
    explain: { 1: 'The Preferences library stores key-value pairs in the flash (NVS).', 7: 'Open the namespace “lab” for reading and writing.', 8: 'Read the key; 0 if it does not exist yet.', 10: 'Write the new value.', 11: 'Close the namespace.' },
    steps: [
      STEP('Memory that remembers', 'bench', [], `<p>Variables are lost when the power is off. The ESP32 can keep key-value pairs in its flash with the <b>Preferences</b> library (non-volatile storage). Group keys in a <b>namespace</b> (here “lab”).</p><p class="warn">Flash cells wear out after many write cycles. Do not write in a fast loop: write only when a value changes. This is the ESP32 counterpart of the EEPROM of other boards.</p>`),
      STEP('The code', 'bench', [], `<p>No wiring. Click lines <b>7</b> to <b>11</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it several times', 'bench', [], `<p>Press <b>▶ Run</b>, stop, and run again: the count goes up every time because it is read from the flash. Reload the page: it is still there.</p><p class="sim">The simulation keeps the values in your browser’s storage so they survive a reload.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'bench', [], `<ul><li><code>prefs.begin(namespace, false)</code>, <code>getUInt()</code>, <code>putUInt()</code>, <code>end()</code>.</li><li>Write only when a value changes.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Where does Preferences store its data?', a: ['In the flash memory', 'In RAM', 'On the SD card', 'In the cloud'], c: 0, why: 'Non-volatile storage in flash.' },
      { q: 'What does getUInt("runs", 0) return if the key does not exist?', a: ['0', '255', 'An error', 'Random'], c: 0, why: 'The second parameter is the default.' },
      { q: 'Why not write in a fast loop?', a: ['Flash cells wear out', 'It is forbidden', 'It is slow to type', 'It resets Wi-Fi'], c: 0, why: 'Limited write cycles.' },
    ],
    sources: [S.prefs, S.ds],
  }),
];

export const E32_MODULES_4 = { 13: 'Module 13 — Buzzers, capacitors, switches, displays', 14: 'Module 14 — SPI devices', 15: 'Module 15 — Environment, position and time', 16: 'Module 16 — Motors and serial links', 17: 'Module 17 — Radio links', 18: 'Module 18 — Timers and memory' };

// Raspberry Pi 4 lessons 33-46: buzzer, switches, 7-segment, MAX7219, TFT, RFID, GPS, RTC, A4988, fan/pump, flame sensor, UART, timer, settings file.
// The Pi has 3.3 V GPIO pins, no analog inputs, and its header pins are numbered by physical position (p13 = GPIO27). Facts come from the datasheets in each
// lesson's `sources`. Listings: ./code5.js, programs: ../sim6.js, simulated devices: ../devices.js. Python library calls are written from memory and
// were NOT run on a real Pi.
import { CODE5 } from './code5.js';

const R = (t, u) => ({ t, u });
const S = {
  gz: R('GPIO Zero documentation: Output devices and Input devices', 'https://gpiozero.readthedocs.io/en/stable/api_output.html'),
  gzin: R('GPIO Zero documentation: Input devices', 'https://gpiozero.readthedocs.io/en/stable/api_input.html'),
  pins: R('Raspberry Pi documentation: GPIO and the 40-pin header', 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#gpio'),
  bcm: R('Raspberry Pi BCM2711 ARM peripherals', 'https://datasheets.raspberrypi.com/bcm2711/bcm2711-peripherals.pdf'),
  max: R('MAX7219/MAX7221 datasheet (Analog Devices)', 'https://www.analog.com/media/en/technical-documentation/data-sheets/MAX7219-MAX7221.pdf'),
  luma: R('luma.led_matrix documentation', 'https://luma-led-matrix.readthedocs.io/'),
  lumalcd: R('luma.lcd documentation', 'https://luma-lcd.readthedocs.io/'),
  mfrc: R('MFRC522 datasheet (NXP)', 'https://www.nxp.com/docs/en/data-sheet/MFRC522.pdf'),
  mfrclib: R('mfrc522 Python library (pimylifeup / mxgxw)', 'https://github.com/pimylifeup/MFRC522-python'),
  nmea: R('pynmea2 library', 'https://github.com/Knio/pynmea2'),
  pyserial: R('pySerial documentation', 'https://pyserial.readthedocs.io/en/latest/shortintro.html'),
  neo6: R('NEO-6 data sheet (u-blox)', 'https://content.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_%28GPS.G6-HW-09005%29.pdf'),
  ds3231: R('DS3231 datasheet (Analog Devices)', 'https://www.analog.com/media/en/technical-documentation/data-sheets/DS3231.pdf'),
  ds3231lib: R('Adafruit CircuitPython DS3231', 'https://github.com/adafruit/Adafruit_CircuitPython_DS3231'),
  a4988: R('Pololu A4988 stepper motor driver carrier (product page)', 'https://www.pololu.com/product/1182'),
  a4988ds: R('A4988 datasheet (Allegro)', 'https://www.allegromicro.com/-/media/files/datasheets/a4988-datasheet.pdf'),
  irlz44n: R('Infineon IRLZ44NPbF datasheet', 'https://www.infineon.com/dgdl/irlz44npbf.pdf?fileId=5546d462533600a40153567206892720'),
  lm393: R('LM393 dual comparator datasheet (Texas Instruments)', 'https://www.ti.com/lit/ds/symlink/lm393.pdf'),
  threading: R('Python documentation: threading.Timer', 'https://docs.python.org/3/library/threading.html#timer-objects'),
  json: R('Python documentation: json and pathlib', 'https://docs.python.org/3/library/json.html'),
};

const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const jw = (id, from, to, color = 'black', lift = 12) => ({ id, type: 'wire', from, to, color, lift });
const ids = a => a.map(d => d.id);
const COL = { VCC: 'red', GND: 'black', '3V3': 'red', VDD: 'red' };
const COLORS = ['blue', 'green', 'yellow', 'orange', 'white', 'violet', 'red', 'black'];
/** a module on the desk, connected through the breadboard: module pin -> a<col>, header pin -> b<col> */
const bb = (id, pairs, c0 = 10) => pairs.flatMap(([mp, net], i) => {
  const c = COL[mp] || COL[net] || COLORS[i % COLORS.length];
  return [fw(id + 'm' + i, id + '.' + mp, 'a' + (c0 + i), c, 16 + 2 * i), ...(net ? [fw(id + 'b' + i, net, 'b' + (c0 + i), c, 26 + 4 * i)] : [])];
});
const mod = (id, model, x = 125, z = -45) => ({ id, type: 'mod', model, x, z });
const mio = (kind, item, needs, map, pw) => { const o = {}; let first = true; for (const [pin, [role, mp, it, extra]] of Object.entries(map)) { o[pin] = { kind: 'dev:' + kind, role, item: it || item, mp, needs, ...(extra || {}) }; if (first && pw) { o[pin].pw = pw; first = false; } } return o; };
const STEP = (title, view, have, body, o = {}) => ({ title, view, have, power: false, body, ...o });
const base = (n, key, o) => ({ id: 'p' + n, num: n, level: 'Intermediate', time: '25 min', code: CODE5[key], program: 'pi5_' + key, fast: true, hardware: ['Raspberry Pi 4 (set up, Lesson 2)'], ...o });

const LED = [{ id: 'r1', type: 'resistor', a: 'h8', b: 'h12' }, { id: 'led1', type: 'led', anode: 'g12', cathode: 'g13' }, fw('w1', 'p11', 'j8', 'yellow', 26), fw('w2', 'p9', 'j13', 'black', 34)];
const LED_IDS = ids(LED);
const IO_LED = { kind: 'led', item: 'led1', needs: LED_IDS };

const ABUZ = [{ id: 'r2', type: 'resistor', a: 'c19', b: 'c23', ohms: 220 }, { id: 'bz1', type: 'buzzer', active: true, plus: 'e23', minus: 'e26' }, fw('w1', 'p13', 'a19', 'orange', 26), fw('w2', 'p14', 'a26', 'black', 34)];
const SWT = [{ id: 'ssw1', type: 'slidesw', row: 'e', col: 5 }, { id: 'reed1', type: 'reed', a: 'e12', k: 'e17' }, { id: 'tilt1', type: 'tilt', a: 'e22', k: 'e23' },
  fw('w1', 'p9', 'a5', 'black', 26), fw('w2', 'p29', 'a6', 'yellow', 30), fw('w3', 'p1', 'a7', 'red', 22),
  fw('w4', 'p14', 'a12', 'black', 34), fw('w5', 'p31', 'a17', 'green', 38), jw('w6', 'c12', 'c22', 'black', 10), fw('w7', 'p33', 'a23', 'blue', 42)];
const SEG = (() => {
  const p = [{ id: 'seg1', type: 'sevenseg', x: 125, z: -45 }], pins = ['p11', 'p12', 'p13', 'p15', 'p16', 'p18', 'p22'];
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'violet', 'white'];
  for (let i = 0; i < 7; i++) { const c = 3 + 2 * i; p.push(fw('w' + (i + 1), pins[i], 'a' + c, colors[i], 22 + 3 * i), { id: 'r' + (i + 1), type: 'resistor', a: 'd' + c, b: 'g' + c, ohms: 100 }, fw('f' + (i + 1), 'seg1.' + 'ABCDEFG'[i], 'j' + c, colors[i], 30 + 3 * i)); }
  p.push(fw('f8', 'seg1.COM', 'a29', 'black', 60), fw('w8', 'p20', 'b29', 'black', 44));
  return p;
})();
const MX = [mod('mx1', 'mod_max7219'), ...bb('mx1', [['VCC', 'p2'], ['GND', 'p6'], ['DIN', 'p19'], ['CS', 'p24'], ['CLK', 'p23']])];
const TFT = [mod('tf1', 'mod_tft', 125, -50), ...bb('tf1', [['GND', 'p6'], ['VCC', 'p1'], ['SCK', 'p23'], ['SDA', 'p19'], ['RES', 'p22'], ['DC', 'p18'], ['CS', 'p24'], ['BL', null]]), jw('wbl', 'c11', 'c17', 'red', 10)];
const RFID = [mod('rf1', 'mod_rfid', 120, -50), ...bb('rf1', [['3V3', 'p1'], ['RST', 'p22'], ['GND', 'p6'], ['MISO', 'p21'], ['MOSI', 'p19'], ['SCK', 'p23'], ['SDA', 'p24']])];
const GPS = [mod('gp1', 'mod_gps'), ...bb('gp1', [['VCC', 'p1'], ['GND', 'p6'], ['TX', 'p10'], ['RX', 'p8']])];
const RTC = [mod('rt1', 'mod_rtc'), ...bb('rt1', [['VCC', 'p1'], ['GND', 'p6'], ['SDA', 'p3'], ['SCL', 'p5']])];
const A4 = [mod('dv1', 'mod_a4988', 125, -45), { id: 'mot1', type: 'nema17', x: 190, z: -70 },
  ...bb('dv1', [['VDD', 'p1'], ['GND', 'p6'], ['STEP', 'p29'], ['DIR', 'p31'], ['ENABLE', 'p33'], ['SLEEP', null], ['RESET', null]]), jw('wsr', 'c15', 'c16', 'white', 10),
  { id: 'l1', type: 'lead', from: 'mot1.A1', to: 'dv1.1A', color: 'red', lift: 14 }, { id: 'l2', type: 'lead', from: 'mot1.A2', to: 'dv1.1B', color: 'blue', lift: 18 },
  { id: 'l3', type: 'lead', from: 'mot1.B1', to: 'dv1.2A', color: 'green', lift: 22 }, { id: 'l4', type: 'lead', from: 'mot1.B2', to: 'dv1.2B', color: 'yellow', lift: 26 }];
const FAN = [{ id: 'q1', type: 'mosfet', row: 'e', col: 10 }, { id: 'r1', type: 'resistor', a: 'a5', b: 'a10', ohms: 220 }, fw('w1', 'p32', 'b5', 'yellow', 26),
  { id: 'r2', type: 'resistor', a: 'd10', b: 'd12', ohms: 10000 }, fw('w2', 'p6', 'b12', 'black', 34), { id: 'dio1', type: 'diode', a: 'b11', k: 'b14' },
  { id: 'bat1', type: 'battery', x: 125, z: -90 }, { id: 'mot1', type: 'motor', x: 165, z: -112 },
  { id: 'l1', type: 'lead', from: 'bat1.POS', to: 'c14', color: 'red', lift: 14 }, { id: 'l2', type: 'lead', from: 'mot1.M1', to: 'd14', color: 'white', lift: 12 },
  { id: 'l3', type: 'lead', from: 'mot1.M2', to: 'c11', color: 'green', lift: 16 }, { id: 'l4', type: 'lead', from: 'bat1.NEG', to: 'c12', color: 'black', lift: 18 }];
const FLAME = [mod('fl1', 'mod_flame'), ...bb('fl1', [['VCC', 'p1'], ['GND', 'p14'], ['DO', 'p13']], 20)];
const UART = [mod('pr1', 'mod_peer'), ...bb('pr1', [['TX', 'p10'], ['RX', 'p8'], ['GND', 'p6']])];

export const PI_LESSONS_5 = [
  // ============================================================ 33 active buzzer
  base(33, 'abuz', {
    module: 17, title: 'Active buzzer: a beep with one pin', level: 'Beginner', time: '15 min', file: 'active_buzzer.py',
    goal: 'Make an active buzzer beep with GPIO Zero’s Buzzer class, and see how it differs from a passive buzzer.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Active buzzer (3.3 V or 5 V type: check your part)', '220 Ω resistor', '2 × jumper wires', 'Breadboard'],
    widgets: ['audio', 'dv:abuz'], circuit: ABUZ, io: mio('abuz', 'bz1', ids(ABUZ), { p13: ['bz', ''] }),
    explain: { 1: 'GPIO Zero’s <b>Buzzer</b> class is for an <b>active</b> buzzer: on or off.', 4: 'The buzzer on GPIO27 (pin 13), through a 220 Ω resistor.', 7: '<code>on()</code>: the pin goes HIGH (3.3 V) and the buzzer’s own oscillator starts.', 8: 'Print a message in the Shell.', 10: '<code>off()</code>: the pin goes LOW, silence.' },
    steps: [
      STEP('Active or passive?', 'pibb', [], `<p>An <b>active</b> buzzer has an oscillator <b>inside</b>: give it power and it beeps at one fixed pitch. A <b>passive</b> buzzer is only a piezo disc that needs a changing signal (GPIO Zero’s <code>TonalBuzzer</code>).</p><p class="warn">Many active buzzers are rated 3 to 5 V, but some 5 V parts are quiet or silent at 3.3 V. There is no standard datasheet: read the page of <b>your</b> buzzer.</p>`),
      STEP('The parts', 'pibb', ['r2', 'bz1'], `<p>Resistor in <b>c19</b> and <b>c23</b>; buzzer <b>+</b> leg in <b>e23</b>, other leg in <b>e26</b>. <b>Click the buzzer</b>.</p><p class="warn">A Raspberry Pi GPIO pin should only supply a few milliamps (the documentation limits the total current). The resistor keeps the current low; a bigger buzzer needs a transistor (Lesson 21).</p>`, { holes: ['c19', 'c23', 'e23 · +', 'e26'] }),
      STEP('Wire it', 'pibb', ids(ABUZ), `<ul><li>Orange wire: <b>pin 13 (GPIO27)</b> to column 19 (a19)</li><li>Black wire: <b>pin 14 (GND)</b> to column 26 (a26)</li></ul>`, { pins: ['p13', 'p14'] }),
      STEP('The program', 'pibb', ids(ABUZ), `<p>Click lines <b>7</b> and <b>10</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and listen', 'pibb', ids(ABUZ), `<p>Press <b>▶ Run</b> and switch the sound on: half a second of beep, half a second of silence.</p><p class="sim">The tone is made by your browser; a real active buzzer has its own fixed pitch.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pibb', ids(ABUZ), `<ul><li>Active buzzer: oscillator inside, fixed pitch, <code>Buzzer.on()</code> / <code>off()</code>.</li><li>Check that it works at 3.3 V; limit the current.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does an active buzzer contain that a passive one does not?', a: ['An oscillator that makes the tone itself', 'A battery', 'A microphone', 'A relay'], c: 0, why: 'The oscillator makes the sound when power is applied.' },
      { q: 'Which GPIO Zero class is for an active buzzer?', a: ['Buzzer', 'TonalBuzzer', 'Servo', 'Button'], c: 0, why: 'Buzzer = on/off; TonalBuzzer = notes.' },
      { q: 'Why can an active buzzer be quiet on a Pi?', a: ['Some are 5 V parts and the pin gives 3.3 V', 'The Pi has no pins', 'Python is slow', 'USB is long'], c: 0, why: 'Check the rated voltage.' },
    ],
    sources: [S.gz, S.pins],
  }),

  // ============================================================ 34 switches
  base(34, 'swt', {
    module: 17, title: 'Slide, reed and tilt switches', file: 'three_switches.py',
    goal: 'Read a slide switch (SPDT), a reed switch operated by a magnet and a tilt switch with GPIO Zero.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Slide switch (SPDT)', 'Reed switch with a magnet', 'Tilt switch (ball type)', '8 × jumper wires', 'Breadboard'],
    widgets: ['dv:swt'], circuit: SWT, io: mio('swt', 'ssw1', ids(SWT), { p29: ['slide', '', 'ssw1'], p31: ['reed', '', 'reed1'], p33: ['tilt', '', 'tilt1'] }),
    explain: { 4: 'The slide switch always connects the pin to 3.3 V or to GND: no pull resistor is needed (<code>pull_up=None</code>); <code>active_state=True</code> means HIGH = 1.', 5: 'The reed switch only closes to GND: <b>Button</b> turns on the internal pull-up. Closed = <b>pressed = value 1</b>.', 6: 'The tilt switch is wired the same way.', 9: 'Print the three values. Note: for a <b>Button</b> “1” means pressed, which is the opposite of the pin level (LOW).' },
    steps: [
      STEP('Three ways to switch', 'pibb', [], `<p>A <b>slide switch</b> (SPDT) connects its middle leg to one of two outer legs. A <b>reed switch</b> is two thin contacts in a glass capsule that a magnet pulls together. A <b>tilt switch</b> has a small ball that closes two contacts when the part is tilted.</p>`),
      STEP('The parts', 'pibb', ['ssw1', 'reed1', 'tilt1'], `<p>Slide switch in <b>e5, e6, e7</b>; reed switch in <b>e12</b> and <b>e17</b>; tilt switch in <b>e22</b> and <b>e23</b>. <b>Click each part</b>.</p><p class="warn">Tilt switches differ: read the data of your own part, and avoid mercury types.</p>`, { holes: ['e5', 'e6 · middle', 'e7', 'e12', 'e17', 'e22', 'e23'] }),
      STEP('Wire it', 'pibb', ids(SWT), `<ul><li>Slide switch: GND (pin 9) to a5, 3V3 (pin 1) to a7, <b>pin 29 (GPIO5)</b> to a6 (the middle leg)</li><li>Reed switch: GND (pin 14) to a12, <b>pin 31 (GPIO6)</b> to a17</li><li>Tilt switch: a short black wire joins columns 12 and 22 (the same GND), and <b>pin 33 (GPIO13)</b> goes to a23</li></ul>`, { pins: ['p29', 'p1', 'p31', 'p33', 'p9', 'p14'] }),
      STEP('The program', 'pibb', ids(SWT), `<p>Click lines <b>4</b>, <b>5</b> and <b>6</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and use the switches', 'pibb', ids(SWT), `<p>Press <b>▶ Run</b> and use the three buttons in the panel: the slide knob moves, a magnet appears over the reed switch, the tilt switch leans. Watch the three numbers in the Shell.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pibb', ids(SWT), `<ul><li>Slide switch: <code>DigitalInputDevice(pin, pull_up=None, active_state=True)</code>.</li><li>Reed and tilt: <code>Button(pin)</code>, closed = pressed = 1.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Reed switch to GND with a Button, magnet close. What is button.value?', a: ['1 (pressed)', '0', 'Random', 'None'], c: 0, why: 'GPIO Zero reports a closed contact as pressed = 1.' },
      { q: 'Why no pull resistor for the slide switch?', a: ['It always connects the pin to 3.3 V or GND', 'It has a built-in resistor', 'It is analog', 'It uses I²C'], c: 0, why: 'The pin is never floating.' },
      { q: 'What operates a reed switch?', a: ['A magnetic field', 'Light', 'Sound', 'Heat'], c: 0, why: 'The magnet closes the contacts.' },
    ],
    sources: [S.gzin, S.pins],
  }),

  // ============================================================ 35 7-segment
  base(35, 'seg7', {
    module: 17, title: '7-segment display: count from 0 to 9', time: '30 min', file: 'seven_segment.py',
    goal: 'Light the segments of a common-cathode 7-segment display to show the digits 0 to 9, with GPIO Zero’s LEDBoard.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', '7-segment display 5161AS (common cathode) on its breakout board', '7 × 100 Ω resistors', '16 × jumper wires', 'Breadboard'],
    widgets: ['dv:seg7'], circuit: SEG, io: mio('seg7', 'seg1', ids(SEG), { p11: ['a', ''], p12: ['b', ''], p13: ['c', ''], p15: ['d', ''], p16: ['e', ''], p18: ['f', ''], p22: ['g', ''] }),
    explain: { 4: 'An <b>LEDBoard</b> controls several pins as one object: GPIO17, 18, 27, 22, 23, 24, 25 are segments a to g.', 5: 'One number per digit. Bit 0 is segment a, bit 6 is segment g.', 10: 'Set all seven pins at once with a tuple of 0 and 1.', 12: 'Wait 0.8 s.' },
    steps: [
      STEP('Seven LEDs in one case', 'pidesk', [], `<p>A 7-segment display is eight LEDs in one case: seven bars (a to g) and a decimal point. In a <b>common-cathode</b> display all cathodes are joined to COM, which goes to GND. A segment lights when its pin is HIGH.</p>`),
      STEP('The display', 'pidesk', ['seg1'], `<p><b>Click the display.</b> 5161AS datasheet: forward voltage 2.1 V typical (2.5 V maximum) at 20 mA.</p><p class="warn">At 3.3 V a segment through 220 Ω gets only about 5 mA: dim. <b>100 Ω</b> gives about (3.3 − 2.1) ÷ 100 = 12 mA, below the 20 mA of the datasheet and within what a Pi pin should supply for one segment.</p>`),
      STEP('Wire it', 'pidesk', ids(SEG), `<p>Each segment pin goes through its own 100 Ω resistor on the breadboard to a GPIO: A to pin 11 (GPIO17), B to pin 12 (GPIO18), C to pin 13 (GPIO27), D to pin 15 (GPIO22), E to pin 16 (GPIO23), F to pin 18 (GPIO24), G to pin 22 (GPIO25). COM goes to GND (pin 20, through column 29). DP is not used.</p>`, { pins: ['p11', 'p12', 'p13', 'p15', 'p16', 'p18', 'p22', 'p20'] }),
      STEP('The program', 'pidesk', ids(SEG), `<p>Click lines <b>5</b> and <b>10</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and count', 'pidesk', ids(SEG), `<p>Press <b>▶ Run</b>: the display counts 0 to 9.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pidesk', ids(SEG), `<ul><li>Common cathode: COM to GND, HIGH lights a segment.</li><li>One resistor per segment; at 3.3 V use about 100 Ω.</li><li><code>LEDBoard.value = (…)</code> sets all pins at once.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Common cathode: which level lights a segment?', a: ['HIGH on the segment pin', 'LOW on the segment pin', 'PWM only', 'COM HIGH'], c: 0, why: 'COM is at GND.' },
      { q: 'Which segments form the digit 1?', a: ['b and c', 'a and d', 'e and f', 'only g'], c: 0, why: 'The two right-hand bars.' },
      { q: 'What does LEDBoard do?', a: ['Controls several LED pins as one object', 'Draws a board', 'Reads buttons', 'Makes sound'], c: 0, why: 'A group of LEDs.' },
    ],
    sources: [S.gz, S.pins],
  }),

  // ============================================================ 36 MAX7219
  base(36, 'max7219', {
    module: 18, title: 'MAX7219 LED matrix on the SPI bus (luma)', file: 'matrix_max7219.py',
    goal: 'Draw on an 8×8 LED matrix driven by a MAX7219 over the Pi’s SPI bus with the luma.led_matrix library.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'MAX7219 8×8 LED matrix module', '5 × jumper wires', 'SPI enabled (raspi-config) and the luma.led_matrix library'],
    widgets: ['dv:max7219'], circuit: MX, io: mio('max7219', 'mx1', ids(MX), { p19: ['din', 'mx1.DIN'], p24: ['cs', 'mx1.CS'], p23: ['clk', 'mx1.CLK'] }, [['mx1.VCC', '5V'], ['mx1.GND', 'GND']]),
    explain: { 1: '<b>spi</b> opens the Pi’s hardware SPI bus; <b>noop</b> means no extra GPIO pin is used.', 6: 'SPI port 0, device 0: the chip select is <b>CE0</b> (pin 24). SCLK is pin 23, MOSI is pin 19.', 7: 'One MAX7219 chip. The library sets up its registers.', 8: 'Brightness 0 to 255 (the chip has 16 levels).', 10: '<code>canvas</code> collects what you draw and sends it when the block ends.', 11: 'A frame around the matrix.', 12: 'Two single LEDs.', 17: 'Change the brightness step by step.' },
    steps: [
      STEP('A chip that does the multiplexing', 'pidesk', [], `<p>The <b>MAX7219</b> scans 64 LEDs itself. The Pi sends it 16-bit messages (8 bits register, 8 bits data) over <b>SPI</b>: SCLK clocks the bits, MOSI carries them, and CE0 (chip select) marks the end of a message. The luma library hides this behind a drawing API (<code>canvas</code>).</p><p class="warn">Enable SPI first: <code>sudo raspi-config</code> → Interface Options → SPI.</p>`),
      STEP('The module and the voltage', 'pidesk', ['mx1'], `<p><b>Click the module.</b> After power-up the chip is in shutdown mode until the driver wakes it.</p><p class="warn">The MAX7219 datasheet gives a supply of 4.0 to 5.5 V and a minimum HIGH input level of 3.5 V at a 5 V supply. The Pi pins give only 3.3 V, which is <b>below that minimum</b>: many modules work anyway, but it is not guaranteed. A level shifter (for example a 74HCT-type buffer) on DIN, CLK and CS makes it reliable.</p>`),
      STEP('Wire it', 'pidesk', ids(MX), `<p>Module pins to a10 to a14, header pins to the same columns in row b: <b>VCC</b> to 5V (pin 2), <b>GND</b> to pin 6, <b>DIN</b> to <b>pin 19 (MOSI)</b>, <b>CS</b> to <b>pin 24 (CE0)</b>, <b>CLK</b> to <b>pin 23 (SCLK)</b>.</p>`, { pins: ['p2', 'p6', 'p19', 'p24', 'p23'] }),
      STEP('The program', 'pidesk', ids(MX), `<p>Click lines <b>6</b>, <b>7</b> and <b>11</b>. Install with <code>pip3 install luma.led_matrix</code>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'pidesk', ids(MX), `<p>Press <b>▶ Run</b>: a frame with two dots appears and gets brighter in 16 steps. The panel lists the messages the chip received.</p><p class="sim">Which edge is “row 0” depends on how the module is built and on the library’s <code>block_orientation</code> setting.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pidesk', ids(MX), `<ul><li>SPI: SCLK, MOSI and a chip select (CE0).</li><li>MAX7219: 16-bit messages, shutdown mode at start (the library wakes it).</li><li>3.3 V logic is below the datasheet minimum at a 5 V supply.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which header pins carry SPI0 clock and data out?', a: ['23 (SCLK) and 19 (MOSI)', '3 and 5', '8 and 10', '11 and 12'], c: 0, why: 'Raspberry Pi 40-pin header.' },
      { q: 'Why can a 3.3 V Pi be a problem for a MAX7219 powered from 5 V?', a: ['The minimum HIGH input level is 3.5 V', 'The chip needs 12 V', 'The Pi has no SPI', 'SPI is forbidden'], c: 0, why: 'See the datasheet.' },
      { q: 'How many bits is one MAX7219 message?', a: ['16', '8', '64', '1'], c: 0, why: '8 address bits and 8 data bits.' },
    ],
    sources: [S.max, S.luma, S.pins],
  }),

  // ============================================================ 37 TFT
  base(37, 'tft', {
    module: 18, title: 'Colour TFT display (ST7735) with luma.lcd', time: '35 min', file: 'tft_demo.py',
    goal: 'Draw text, a frame, a progress bar and a circle on a 1.8 inch 128×160 colour display over SPI.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', '1.8 inch ST7735 TFT module (128×160)', '8 × jumper wires', 'SPI enabled and the luma.lcd library'],
    widgets: ['dv:tft'], circuit: TFT, io: mio('tft', 'tf1', ids(TFT), { p23: ['sck', 'tf1.SCK'], p19: ['sda', 'tf1.SDA'], p22: ['res', 'tf1.RES'], p18: ['dc', 'tf1.DC'], p24: ['cs', 'tf1.CS'] }, [['tf1.VCC', '3V3'], ['tf1.GND', 'GND']]),
    explain: { 6: 'SPI port 0, device 0 (CE0 = chip select, pin 24). <b>gpio_DC</b> is the data/command pin (GPIO24, pin 18) and <b>gpio_RST</b> the reset pin (GPIO25, pin 22): these are the library’s defaults.', 7: 'The ST7735 driver for a 128×160 display. A module with another tab colour may need an offset (see the luma documentation).', 12: 'Everything inside <code>with canvas(device)</code> is drawn into one picture that is sent when the block ends: each frame is complete.', 13: 'Text.', 14: 'A frame for the bar.', 15: 'The bar grows with <b>level</b>.', 16: 'A filled red circle.' },
    steps: [
      STEP('A display with its own memory', 'pidesk', [], `<p>The ST7735 controller keeps the picture in its own memory. The Pi sends it commands and pixels over <b>SPI</b> (SCLK, MOSI, chip select) plus a <b>DC</b> pin that tells the display whether a byte is a command or pixel data. Colours are 16 bits (RGB565). The luma library draws the whole frame in Python and sends it.</p>`),
      STEP('The module', 'pidesk', ['tf1'], `<p><b>Click the module.</b> The ST7735 chip is a 3.3 V part, which suits the Pi directly: power it from <b>3V3</b>. Pin names and order differ between modules; read the printing on yours.</p>`),
      STEP('Wire it', 'pidesk', ids(TFT), `<p>Module pins to a10 to a17, header pins to the same columns in row b: <b>GND</b> (pin 6), <b>VCC</b> to 3V3 (pin 1), <b>SCK</b> to pin 23, <b>SDA</b> (the MOSI line) to pin 19, <b>RES</b> to pin 22, <b>DC</b> to pin 18, <b>CS</b> to pin 24; <b>BL</b> (backlight, column 17) is joined to the supply column 11 by a short wire.</p>`, { pins: ['p6', 'p1', 'p23', 'p19', 'p22', 'p18', 'p24'] }),
      STEP('The program', 'pidesk', ids(TFT), `<p>Click lines <b>6</b> and <b>12</b> to <b>16</b>. Install with <code>pip3 install luma.lcd</code>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'pidesk', ids(TFT), `<p>Press <b>▶ Run</b>.</p><p class="sim">The simulated font is not the library font; colours and positions follow the commands.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pidesk', ids(TFT), `<ul><li>SPI: SCLK, MOSI, CE0 plus DC and RST pins.</li><li><code>with canvas(device)</code> draws a complete frame each time.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What is the DC pin for?', a: ['Command or pixel data', 'Direct current', 'The backlight', 'The clock'], c: 0, why: 'Data/command select.' },
      { q: 'Which supply suits an ST7735 on a Pi?', a: ['3.3 V', '12 V', '24 V', 'None'], c: 0, why: 'It is a 3.3 V part, like the Pi pins.' },
      { q: 'What does the with canvas block do?', a: ['Collects the drawing and sends one complete frame', 'Opens a file', 'Starts SPI', 'Resets the display'], c: 0, why: 'See the luma documentation.' },
    ],
    sources: [S.lumalcd, S.pins],
  }),

  // ============================================================ 38 RFID
  base(38, 'rfid', {
    module: 18, title: 'RFID reader RC522: read a card number', file: 'rfid_reader.py',
    goal: 'Read the unique number (UID) of an RFID card or tag with the MFRC522 chip over SPI.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'RC522 RFID module with a card or tag', '7 × jumper wires', 'SPI enabled and the mfrc522 Python library'],
    widgets: ['dv:rfid'], circuit: RFID, io: mio('rfid', 'rf1', ids(RFID), { p24: ['ss', 'rf1.SDA'], p22: ['rst', 'rf1.RST'], p19: ['mosi', 'rf1.MOSI'], p21: ['miso', 'rf1.MISO'], p23: ['sck', 'rf1.SCK'] }, [['rf1.3V3', '3V3'], ['rf1.GND', 'GND']]),
    explain: { 1: 'The library’s <b>SimpleMFRC522</b> class.', 4: 'Opens SPI0 (chip select CE0, pin 24). The library’s reset pin is board pin 22.', 9: '<code>read_id()</code> waits for a card and returns its UID as one number.', 10: 'Print it in hexadecimal.', 12: 'Release the GPIO pins when the program ends.' },
    steps: [
      STEP('Cards without contact', 'pidesk', [], `<p>The RC522 module contains the <b>MFRC522</b> chip and a printed antenna. A 13.56 MHz field powers a passive card, which answers with its <b>UID</b>. The library turns the UID bytes into one number.</p><p class="warn">A UID can be copied: it is not a secure password. Enable SPI first with <code>sudo raspi-config</code>.</p>`),
      STEP('The module', 'pidesk', ['rf1'], `<p><b>Click the module.</b> Datasheet: carrier 13.56 MHz, supply 2.5 to 3.3 V. The Pi runs at 3.3 V, so the module connects directly: power it from <b>3V3</b>.</p>`),
      STEP('Wire it', 'pidesk', ids(RFID), `<p>Module pins to a10 to a16, header pins to the same columns in row b: <b>3V3</b> (pin 1), <b>RST</b> to pin 22, <b>GND</b> (pin 6), <b>MISO</b> to pin 21, <b>MOSI</b> to pin 19, <b>SCK</b> to pin 23, <b>SDA</b> (the chip select) to pin 24. IRQ is unused.</p>`, { pins: ['p1', 'p22', 'p6', 'p21', 'p19', 'p23', 'p24'] }),
      STEP('The program', 'pidesk', ids(RFID), `<p>Click lines <b>4</b> and <b>9</b>. Install with <code>pip3 install mfrc522</code>.</p>`, { showCode: true, power: true }),
      STEP('Run it and hold a card near', 'pidesk', ids(RFID), `<p>Press <b>▶ Run</b>, then use <b>Card A near</b> or <b>Card B near</b>. The program prints the UID again and again while the card stays in the field.</p><p class="sim">The two UIDs are made up.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pidesk', ids(RFID), `<ul><li>RC522: SPI, 3.3 V, 13.56 MHz.</li><li><code>read_id()</code> waits for a card and returns the UID.</li><li>A UID identifies a card but is not secret.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which supply does the RC522 chip need?', a: ['About 3.3 V', '12 V', '5 V only', 'None'], c: 0, why: 'Datasheet: 2.5 to 3.3 V.' },
      { q: 'What is a UID?', a: ['The unique number of a card', 'A password you choose', 'The reader’s address', 'An antenna'], c: 0, why: 'It identifies the card.' },
      { q: 'What does read_id() do?', a: ['Waits for a card and returns its UID', 'Writes a card', 'Turns off the reader', 'Starts SPI'], c: 0, why: 'It blocks until a card is read.' },
    ],
    sources: [S.mfrc, S.mfrclib, S.pins],
  }),

  // ============================================================ 39 GPS
  base(39, 'gps', {
    module: 19, title: 'GPS NEO-6M: where am I?', file: 'gps_position.py',
    goal: 'Read NMEA text from a GPS module on the Pi’s serial port and print latitude, longitude and satellites with pynmea2.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'NEO-6M GPS module with antenna', '4 × jumper wires', 'Serial port enabled, pyserial and pynmea2'],
    widgets: ['dv:gps'], circuit: GPS, io: mio('gps', 'gp1', ids(GPS), { p10: ['tx', 'gp1.TX'], p8: ['rx', 'gp1.RX'] }, [['gp1.VCC', '3V3'], ['gp1.GND', 'GND']]),
    explain: { 4: 'The Pi’s UART: <code>/dev/serial0</code> is GPIO14 (TX, pin 8) and GPIO15 (RX, pin 10). 9600 baud is the NEO-6M default.', 7: 'Read one line of text (waits at most 1 s).', 8: 'A <b>GGA</b> sentence holds position, fix quality and satellite count.', 9: 'pynmea2 turns the text into numbers.', 10: 'Fix quality above 0 means a valid position.', 13: 'No fix yet: indoors this stays the case.' },
    steps: [
      STEP('Position from the sky', 'pidesk', [], `<p>The module sends lines of text in the <b>NMEA</b> format over a serial port. The u-blox NEO-6 data sheet gives 9600 baud and 1 Hz as defaults.</p><p class="warn">It needs a clear view of the sky: a cold start takes tens of seconds or longer, and indoors you usually get no fix. On the Pi enable the serial <b>hardware</b> port and disable the serial login console: <code>sudo raspi-config</code> → Interface Options → Serial Port.</p>`),
      STEP('The module', 'pidesk', ['gp1'], `<p><b>Click the module.</b> The wires are crossed: the module’s <b>TX</b> goes to the Pi’s receive pin (<b>RXD, pin 10</b>) and its <b>RX</b> to the transmit pin (TXD, pin 8). The chip is a 3.3 V part and so are the Pi pins: power it from <b>3V3</b>.</p>`),
      STEP('Wire it', 'pidesk', ids(GPS), `<p>Module pins to a10 to a13, header pins to row b: <b>VCC</b> to 3V3 (pin 1), <b>GND</b> (pin 6), <b>TX</b> to <b>pin 10</b>, <b>RX</b> to <b>pin 8</b>.</p>`, { pins: ['p1', 'p6', 'p10', 'p8'] }),
      STEP('The program', 'pidesk', ids(GPS), `<p>Click lines <b>4</b>, <b>8</b> and <b>10</b>. Install with <code>pip3 install pyserial pynmea2</code>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'pidesk', ids(GPS), `<p>Press <b>▶ Run</b>: “Waiting for a fix…” first, then the position after 6 s (much longer in reality). Switch “Open sky” off to see that no fix arrives.</p><p class="sim">The position is an example.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pidesk', ids(GPS), `<ul><li>NMEA text over a UART, 9600 baud by default.</li><li>Cross TX and RX; use /dev/serial0.</li><li>Indoors there is usually no fix.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'The module TX wire goes to…', a: ['The Pi receive pin (pin 10)', 'The Pi transmit pin (pin 8)', 'GND', '3V3'], c: 0, why: 'Transmit meets receive.' },
      { q: 'Why is there often no fix indoors?', a: ['The satellite signals are too weak', 'The Pi is too slow', 'The baud rate is wrong', 'GPS needs Wi-Fi'], c: 0, why: 'The signals are weak.' },
      { q: 'What is NMEA?', a: ['A text format for GPS data', 'A kind of antenna', 'A voltage', 'A baud rate'], c: 0, why: 'The sentence format.' },
    ],
    sources: [S.nmea, S.pyserial, S.neo6],
  }),

  // ============================================================ 40 RTC
  base(40, 'rtc', {
    module: 19, title: 'DS3231 real-time clock: the time without a network', file: 'rtc_clock.py',
    goal: 'Read the date and time from a DS3231 clock over I²C, set it once, and read its temperature.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'DS3231 RTC module with a coin cell', '4 × jumper wires', 'I²C enabled and adafruit-circuitpython-ds3231'],
    widgets: ['dv:rtc'], circuit: RTC, io: mio('rtc', 'rt1', ids(RTC), { p3: ['sda', 'rt1.SDA'], p5: ['scl', 'rt1.SCL'] }, [['rt1.VCC', '3V3'], ['rt1.GND', 'GND']]),
    explain: { 5: 'The I²C bus of the Pi: SDA = GPIO2 (pin 3), SCL = GPIO3 (pin 5).', 6: 'The clock chip at address 0x68.', 8: '<code>lost_power</code> is true when the oscillator stopped: the time is not valid.', 9: 'Set it to the time of the Pi, once.', 12: 'Read the time.', 14: 'The DS3231 also has a temperature sensor.' },
    steps: [
      STEP('A clock that keeps running', 'pidesk', [], `<p>A Pi has no battery-backed clock: without a network it forgets the time at power-off. The <b>DS3231</b> has its own crystal and a coin cell. Datasheet: accuracy ±2 ppm from 0 to +40 °C (about a minute per year); I²C address <b>0x68</b>.</p><p class="warn">Enable I²C first: <code>sudo raspi-config</code> → Interface Options → I2C.</p>`),
      STEP('The module', 'pidesk', ['rt1'], `<p><b>Click the module.</b> The DS3231 works from 2.3 to 5.5 V: power it from <b>3V3</b>, so the pull-ups on the module go to 3.3 V, safe for the Pi. Some boards have a charging circuit meant for a rechargeable cell: check the board before you fit a CR2032.</p>`),
      STEP('Wire it', 'pidesk', ids(RTC), `<p>Module pins to a10 to a13, header pins to row b: <b>VCC</b> to 3V3 (pin 1), <b>GND</b> (pin 6), <b>SDA</b> to pin 3, <b>SCL</b> to pin 5.</p>`, { pins: ['p1', 'p6', 'p3', 'p5'] }),
      STEP('The program', 'pidesk', ids(RTC), `<p>Click lines <b>8</b> and <b>9</b>. Install with <code>pip3 install adafruit-circuitpython-ds3231</code>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'pidesk', ids(RTC), `<p>Press <b>▶ Run</b>: the first time the time is set; run again and it keeps counting. “Remove the coin cell” shows the lost-power path.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pidesk', ids(RTC), `<ul><li>DS3231: I²C 0x68, ±2 ppm, coin-cell backup, temperature sensor.</li><li>Set the time once; then only read it.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What I²C address does the DS3231 use?', a: ['0x68', '0x3C', '0x27', '0x76'], c: 0, why: 'Datasheet.' },
      { q: 'What does lost_power tell you?', a: ['The time is not valid and must be set', 'USB is unplugged', 'The battery is full', 'The time zone changed'], c: 0, why: 'The oscillator stopped.' },
      { q: 'Which Pi pins are I²C SDA and SCL?', a: ['3 and 5', '8 and 10', '19 and 23', '11 and 12'], c: 0, why: 'GPIO2 and GPIO3.' },
    ],
    sources: [S.ds3231, S.ds3231lib, S.pins],
  }),

  // ============================================================ 41 A4988
  base(41, 'a4988', {
    module: 20, title: 'A4988 driver and a NEMA 17 stepper motor', level: 'Advanced', time: '35 min', file: 'stepper_a4988.py',
    goal: 'Drive a bipolar stepper motor with an A4988 driver from three GPIO pins: STEP, DIR and ENABLE.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'A4988 stepper driver carrier', 'NEMA 17 bipolar stepper motor (1.8° per step)', 'Motor supply 8 to 35 V (for example 12 V)', '100 µF capacitor across the motor supply', 'Jumper wires'],
    widgets: ['dv:a4988'], circuit: A4, io: mio('a4988', 'mot1', ids(A4), { p29: ['step', 'dv1.STEP'], p31: ['dir', 'dv1.DIR'], p33: ['en', 'dv1.ENABLE'] }, [['dv1.VDD', '3V3'], ['dv1.GND', 'GND']]),
    explain: { 4: 'STEP on GPIO5 (pin 29): each pulse is one step.', 5: 'DIR on GPIO6 (pin 31).', 6: 'ENABLE on GPIO13 (pin 33), <b>active LOW</b>.', 7: 'Enable the driver.', 9: 'A function that makes a number of steps.', 11: 'STEP HIGH…', 12: '…for 1 ms…', 13: '…and LOW for 1 ms.', 18: 'One revolution: 200 steps for a 1.8° motor.' },
    steps: [
      STEP('A driver between the Pi and the motor', 'pidesk', [], `<p>The <b>A4988</b> drives the coils of a bipolar stepper: each pulse on <b>STEP</b> moves the motor one step, <b>DIR</b> sets the direction. Pololu A4988 carrier: motor supply (VMOT) <b>8 to 35 V</b>, logic supply (VDD) 3 to 5.5 V, about 1 A per coil without a heat sink and up to about 2 A with good cooling. The Pi’s 3.3 V suits the logic side, so VDD goes to 3V3.</p><p class="warn">Linux is not a real-time system: <code>sleep(0.001)</code> can take longer and vary, so the steps are not evenly timed. That is fine for a slow demo; for fast, smooth motion use a microcontroller or hardware PWM.</p>`),
      STEP('Safety rules', 'pidesk', ['dv1', 'mot1'], `<p><b>Click the driver and the motor.</b></p><p class="warn">Never connect or disconnect the motor while the motor supply is on: the voltage spikes can destroy the driver. Put at least 47 µF across VMOT and GND close to the driver. Set the current limit with the trimmer (I = VREF ÷ (8 × R<sub>sense</sub>); R<sub>sense</sub> depends on the board version) before running the motor for long. RESET and SLEEP must not float: they are joined here.</p>`),
      STEP('Wire it', 'pidesk', ids(A4), `<p>Driver pins to row a, header pins to row b of the same column: <b>VDD</b> to 3V3 (10), <b>GND</b> to pin 6 (11), <b>STEP</b> to pin 29 (12), <b>DIR</b> to pin 31 (13), <b>ENABLE</b> to pin 33 (14). <b>SLEEP</b> (15) and <b>RESET</b> (16) are joined by a short wire. The motor’s two coils (find each pair with a multimeter) go to 1A/1B and 2A/2B. The motor supply (8 to 35 V) is <b>not drawn</b>: it must share GND with the Pi; the panel has a switch for it.</p>`, { pins: ['p1', 'p6', 'p29', 'p31', 'p33'] }),
      STEP('The program', 'pidesk', ids(A4), `<p>Click lines <b>7</b>, <b>11</b> and <b>18</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'pidesk', ids(A4), `<p>Switch the <b>motor supply</b> on, then press <b>▶ Run</b>: one revolution, a pause, and back. Without the supply the steps are counted but the motor does not move.</p><p class="sim">The simulator is slower than the 2 ms of the code; the step count and angle are exact.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pidesk', ids(A4), `<ul><li>STEP pulse = one step; DIR = direction; ENABLE active LOW.</li><li>Never unplug the motor with the supply on.</li><li>Python timing on Linux is not exact.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Full steps per revolution of a 1.8° motor?', a: ['200', '360', '18', '2048'], c: 0, why: '360 ÷ 1.8.' },
      { q: 'Why not unplug the motor with the supply on?', a: ['Voltage spikes can destroy the driver', 'The motor spins', 'The Pi resets', 'Nothing happens'], c: 0, why: 'Pololu warns about this.' },
      { q: 'Why are the steps unevenly timed on a Pi?', a: ['Linux is not a real-time system', 'The A4988 is slow', 'GPIO is analog', 'sleep() is exact'], c: 0, why: 'sleep() can take longer.' },
    ],
    sources: [S.a4988, S.a4988ds, S.pins],
  }),

  // ============================================================ 42 fan
  base(42, 'fan', {
    module: 20, title: 'Fan or pump: speed control with a MOSFET and PWM', level: 'Advanced', time: '30 min', file: 'fan_speed.py',
    goal: 'Control the speed of a small DC motor (a fan or a pump) from a PWM pin of the Pi through a MOSFET, with a flyback diode.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'IRLZ44N MOSFET', '220 Ω and 10 kΩ resistors', '1N4007 diode', 'Small DC motor (fan or pump) and a 6 V battery pack', 'Jumper wires'],
    widgets: ['dv:fan'], circuit: FAN, io: mio('fan', 'mot1', ids(FAN), { p32: ['gate', ''] }),
    explain: { 1: '<b>PWMOutputDevice</b> makes a PWM signal with <code>value</code> from 0 to 1.', 4: 'GPIO12 (pin 32) is a hardware-PWM-capable pin. It goes to the gate through 220 Ω.', 8: 'Set the duty cycle: 0.2 means on 20 % of the time. The MOSFET switches the motor at that duty, so the motor sees the average voltage.', 11: 'Stop.' },
    steps: [
      STEP('Speed control with PWM', 'pidesk', [], `<p>A PWM signal switches the MOSFET fast, so the motor receives the supply voltage for part of each period: the average voltage, and the speed, follow the duty cycle. Pumps and fans are small DC motors, so the same circuit works for both.</p>`),
      STEP('The circuit', 'pidesk', ids(FAN), `<ul><li>A <b>220 Ω</b> resistor from the pin to the gate and a <b>10 kΩ</b> resistor from the gate to GND.</li><li>The motor is between the battery + and the <b>drain</b>; the battery − joins the source column and the Pi’s GND.</li><li>The <b>1N4007</b> across the motor, band toward the battery +: a flyback diode that absorbs the spike when the MOSFET switches off.</li></ul><p class="warn">The IRLZ44N datasheet gives its on-resistance at gate voltages of 4 V and above: at the <b>3.3 V</b> of a Pi pin it is <b>not guaranteed</b>. A small motor works, but a big motor can make the MOSFET hot: use a MOSFET specified at 3.3 V gate drive for bigger loads. Never power a motor from the Pi: use its own supply.</p>`),
      STEP('Wire it', 'pidesk', ids(FAN), `<ul><li>Yellow wire: <b>pin 32 (GPIO12)</b> to column 5 (b5)</li><li>Black wire: <b>pin 6 (GND)</b> to column 12 (b12)</li></ul><p>The motor circuit is separate: battery + to the motor and the diode band; the motor’s other wire to the <b>drain</b> (column 11); battery − to the source column 12.</p>`, { pins: ['p32', 'p6'] }),
      STEP('The program', 'pidesk', ids(FAN), `<p>Click lines <b>4</b> and <b>8</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'pidesk', ids(FAN), `<p>Press <b>▶ Run</b>: the motor goes through six speeds. At 0.2 it does not turn: a small DC motor needs a minimum voltage.</p><p class="sim">The start threshold (about 25 % duty) is a typical assumption.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pidesk', ids(FAN), `<ul><li>PWM on a MOSFET: speed control.</li><li>Flyback diode across every motor.</li><li>Check the MOSFET at 3.3 V gate drive.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does PWM change?', a: ['The fraction of time the motor is on', 'The battery voltage', 'The motor size', 'The wire colour'], c: 0, why: 'Duty cycle sets the average.' },
      { q: 'What is the diode across the motor for?', a: ['It absorbs the voltage spike at switch-off', 'It speeds up the motor', 'It charges the battery', 'Decoration'], c: 0, why: 'A flyback diode.' },
      { q: 'Why check the MOSFET at 3.3 V gate drive?', a: ['Datasheet values are given from 4 V up', 'It is always fine', 'The Pi has no gate', 'PWM needs 5 V'], c: 0, why: 'The IRLZ44N gives no value at 3.3 V.' },
    ],
    sources: [S.irlz44n, S.gz, S.pins],
  }),

  // ============================================================ 43 flame
  base(43, 'flame', {
    module: 19, title: 'Flame sensor: an infrared eye', level: 'Beginner', time: '20 min', file: 'flame_sensor.py',
    goal: 'Detect an infrared source such as a flame with the digital output of a flame sensor module and light an LED.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'The LED circuit of Lesson 4', 'Flame sensor module (DO output)', '3 × jumper wires'],
    widgets: ['dv:flame'], circuit: [...LED, ...FLAME], io: { p11: IO_LED, ...mio('flame', 'fl1', [...LED_IDS, ...ids(FLAME)], { p13: ['do', 'fl1.DO'] }, [['fl1.VCC', '3V3'], ['fl1.GND', 'GND']]) },
    explain: { 4: 'The digital output DO on GPIO27 (pin 13).', 5: 'The LED of Lesson 4 on GPIO17.', 8: 'On most modules DO goes LOW when the infrared level passes the trimmer setting.', 9: 'Light the LED.' },
    steps: [
      STEP('Seeing infrared', 'pibb', [], `<p>A flame gives off infrared light. The sensor is an infrared photodiode followed by a comparator (an LM393 on most modules) with a trimmer: DO switches when the level passes the setting.</p><p class="warn">It is not a fire alarm: sunlight and lamps contain infrared too, and it does not measure temperature. The Pi has <b>no analog inputs</b>, so only the digital output DO is used (the AO output would need an external ADC).</p>`),
      STEP('The module', 'pibb', ['fl1'], `<p><b>Click the module.</b> Seller listings give a range of about 760 to 1100 nm and an angle of about 60° (typical values, no maker datasheet). The LM393 works from about 3 V, so the module is powered from <b>3V3</b> and DO stays within 3.3 V. <b>Never</b> power the module from 5 V and connect DO to a Pi pin: the output would then reach 5 V.</p>`),
      STEP('Wire it', 'pibb', [...LED_IDS, ...ids(FLAME)], `<p>Module pins to a20 to a22, header pins to the same columns in row b: <b>VCC</b> to 3V3 (pin 1), <b>GND</b> (pin 14), <b>DO</b> to <b>pin 13 (GPIO27)</b>. The LED is as in Lesson 4.</p>`, { pins: ['p1', 'p14', 'p13'] }),
      STEP('The program', 'pibb', [...LED_IDS, ...ids(FLAME)], `<p>Click lines <b>8</b> and <b>9</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and bring a flame near', 'pibb', [...LED_IDS, ...ids(FLAME)], `<p>Press <b>▶ Run</b> and raise the infrared slider: past the trimmer level the LED lights and the Shell prints FLAME.</p><p class="sim">Typical behaviour; your board may be wired the other way round.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pibb', [...LED_IDS, ...ids(FLAME)], `<ul><li>Infrared photodiode plus comparator: DO = threshold.</li><li>Sunlight and lamps can trigger it.</li><li>No analog inputs on the Pi: use DO.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does the sensor detect?', a: ['Infrared light', 'Heat directly', 'Smoke', 'Sound'], c: 0, why: 'An infrared photodiode.' },
      { q: 'Why is only DO used on the Pi?', a: ['The Pi has no analog inputs', 'AO does not exist', 'DO is faster', 'AO is 12 V'], c: 0, why: 'An ADC chip would be needed for AO.' },
      { q: 'Why false alarms?', a: ['Sunlight and lamps contain infrared', 'It hears noise', 'The cable is long', 'It is too small'], c: 0, why: 'Other infrared sources trigger it.' },
    ],
    sources: [S.lm393, S.gzin, S.pins],
  }),

  // ============================================================ 44 UART
  base(44, 'uart', {
    module: 20, title: 'Two boards talk: a serial link (UART)', file: 'serial_link.py',
    goal: 'Connect the Pi to another board with three wires (TX, RX, GND) and exchange text lines with pySerial.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'A second board with its own program (board B), 3.3 V logic', '3 × jumper wires', 'Serial port enabled and pyserial'],
    widgets: ['dv:peer'], circuit: UART, io: mio('peer', 'pr1', ids(UART), { p10: ['rx', 'pr1.TX'], p8: ['tx', 'pr1.RX'] }),
    explain: { 4: 'Open the Pi’s hardware UART at 9600 baud. <code>timeout=0.1</code>: <code>readline()</code> waits at most 0.1 s.', 8: 'Send a line of text (as bytes, with a line break).', 10: 'Remember the start time.', 11: 'For one second…', 12: '…read what board B sends back.' },
    steps: [
      STEP('Two boards, one conversation', 'pidesk', [], `<p>A <b>UART</b> link needs two data wires and a common ground: my TX goes to your RX and my RX to your TX (crossed), and both sides use the same baud rate. On the Pi, <code>/dev/serial0</code> is GPIO14 (TXD, pin 8) and GPIO15 (RXD, pin 10).</p><p class="warn">Both boards must use 3.3 V logic. A 5 V board needs a level shifter, because Pi pins are not 5 V tolerant. Enable the serial hardware port and disable the login console in <code>raspi-config</code>.</p>`),
      STEP('Board B', 'pidesk', ['pr1'], `<p><b>Click board B.</b> A simplified drawing of a second board; it answers each line with “ACK” and the same number.</p>`),
      STEP('Wire it', 'pidesk', ids(UART), `<p>Board B pins to row a and Pi pins to row b: B’s <b>TX</b> to <b>pin 10 (RXD)</b> (column 10), B’s <b>RX</b> to <b>pin 8 (TXD)</b> (11), <b>GND</b> to pin 6 (12).</p>`, { pins: ['p10', 'p8', 'p6'] }),
      STEP('The program', 'pidesk', ids(UART), `<p>Click lines <b>4</b>, <b>8</b> and <b>12</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and break it', 'pidesk', ids(UART), `<p>Press <b>▶ Run</b>: a line is sent every second and board B answers. Then press “TX and RX not crossed” and “Board B uses 4800 baud”: nothing arrives, or garbage. These are the two most common serial errors.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pidesk', ids(UART), `<ul><li>TX crosses to RX, common GND, same baud rate.</li><li>/dev/serial0 on pins 8 and 10; 3.3 V levels only.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Board A TX goes to…', a: ['Board B RX', 'Board B TX', 'GND', '3V3'], c: 0, why: 'Transmit meets receive.' },
      { q: 'Different baud rates show…', a: ['Garbage characters', 'Nothing', 'A faster link', 'A Python error'], c: 0, why: 'Bits are sampled at the wrong times.' },
      { q: 'Which Pi pin is the UART receive pin (RXD)?', a: ['Pin 10', 'Pin 8', 'Pin 3', 'Pin 12'], c: 0, why: 'GPIO15 is RXD, GPIO14 is TXD.' },
    ],
    sources: [S.pyserial, S.pins],
  }),

  // ============================================================ 45 timer
  base(45, 'timer', {
    module: 20, title: 'threading.Timer: a blink that never stops', time: '20 min', file: 'timer_blink.py',
    goal: 'Use threading.Timer to run a function every 0.5 s while the main program is busy.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'The LED circuit of Lesson 4'],
    widgets: [], circuit: LED, io: { p11: IO_LED },
    explain: { 2: 'Python’s <b>Timer</b> runs a function after a delay, in a new thread.', 8: 'The function that runs every time the timer fires.', 10: 'Toggle the LED.', 12: 'A Timer fires <b>once</b>: start the next one at the end of each run to repeat.', 14: 'The first call.', 17: 'The main thread sleeps for 2 s, yet the LED keeps blinking.' },
    steps: [
      STEP('Time without sleeping', 'pibb', [], `<p>A <code>sleep()</code> stops the program. A <code>threading.Timer</code> runs a function after a delay <b>in another thread</b>. It fires only once, so the function starts the next timer itself.</p><p class="warn">Python timers are not precise: the period drifts a little (each run starts a new timer after the work is done), and under load it can vary. For exact periods use a hardware timer on a microcontroller.</p>`),
      STEP('The circuit', 'pibb', LED_IDS, `<p>The LED circuit of Lesson 4 (GPIO17). No other wiring is needed.</p>`),
      STEP('The program', 'pibb', LED_IDS, `<p>Click lines <b>12</b> and <b>14</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'pibb', LED_IDS, `<p>Press <b>▶ Run</b>: the LED toggles every 0.5 s while the main loop prints only every 2 s (4 timer runs per print).</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pibb', LED_IDS, `<ul><li><code>Timer(seconds, function).start()</code> runs once, in a thread.</li><li>Restart it inside the function to repeat.</li><li>Not exact timing.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'How often does a threading.Timer fire?', a: ['Once', 'Forever', 'Every second', 'Never'], c: 0, why: 'You start a new one each time.' },
      { q: 'Why does the LED keep blinking during sleep(2)?', a: ['The timer runs in another thread', 'sleep() is short', 'The LED remembers', 'It does not'], c: 0, why: 'Threads run in parallel.' },
      { q: 'Is a Python Timer exact?', a: ['No, it can drift', 'Yes, to the microsecond', 'Only at night', 'Always'], c: 0, why: 'Linux and Python add delays.' },
    ],
    sources: [S.threading, S.gz],
  }),

  // ============================================================ 46 settings file
  base(46, 'prefs', {
    module: 20, title: 'Settings that survive a restart: a JSON file', level: 'Beginner', time: '15 min', file: 'settings_counter.py',
    goal: 'Store a number in a file so that it is still there the next time the program runs.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)'],
    widgets: ['dv:prefs'], circuit: [], io: {},
    explain: { 1: 'The <b>json</b> module turns Python data into text and back.', 2: '<b>pathlib.Path</b> represents a file.', 5: 'Read the file if it exists, otherwise start with an empty dictionary.', 6: 'Count this start; 0 if the key does not exist yet.', 7: 'Write the settings back.' },
    steps: [
      STEP('Memory that remembers', 'pibb', [], `<p>Variables are lost when a program ends. A Pi has no EEPROM like a microcontroller: it keeps data in <b>files</b> on its SD card or SSD. A small JSON file is the simplest way to store settings.</p><p class="warn">An SD card wears out after many writes: write only when a value changes, not in a fast loop.</p>`),
      STEP('The program', 'pibb', [], `<p>No wiring. Click lines <b>5</b> to <b>7</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it several times', 'pibb', [], `<p>Press <b>▶ Run</b>, stop, and run again: the count goes up every time. Reload the page: it is still there.</p><p class="sim">The simulation keeps the values in your browser’s storage so they survive a reload.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', 'pibb', [], `<ul><li><code>json.loads(path.read_text())</code> and <code>path.write_text(json.dumps(data))</code>.</li><li>Write only when a value changes.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Where does this program keep its data?', a: ['In a file on the SD card', 'In RAM', 'In the cloud', 'In the GPIO pins'], c: 0, why: 'settings.json.' },
      { q: 'What does settings.get("runs", 0) return if the key is missing?', a: ['0', '255', 'An error', 'Random'], c: 0, why: 'The second parameter is the default.' },
      { q: 'Why not write in a fast loop?', a: ['SD cards wear out', 'It is forbidden', 'It is slow to type', 'It resets Wi-Fi'], c: 0, why: 'Limited write cycles.' },
    ],
    sources: [S.json],
  }),
];

export const PI_MODULES_5 = { 17: 'Module 17 — Buzzers, switches and displays', 18: 'Module 18 — SPI devices', 19: 'Module 19 — Position, time and sensors', 20: 'Module 20 — Motors, serial links and timing' };

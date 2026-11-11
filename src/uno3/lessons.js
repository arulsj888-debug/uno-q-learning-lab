// Lessons for the Arduino UNO R3. Facts come from: the UNO R3 datasheet A000066 (DS), the board file UNO-TH_Rev3e.brd (BRD),
// the Arduino language reference (REF) and the ATmega328P datasheet (ATM). Code listings: ./code.js.
import { U3_BLINK, U3_EXT_LED, U3_BUTTON, U3_POT, U3_FADE, U3_BUZZER } from './code.js';

import { U3_LESSONS_2 } from './lessons2.js';
import { SRC, LED_CIRCUIT, LED_IDS, IO_LED, BUTTON_PARTS, BUTTON_IDS, POT_PARTS, POT_IDS, BUZZER_PARTS, BUZZER_IDS } from './common.js';

export const U3_MODULES = { 1: 'Module 1 — Getting started', 2: 'Module 2 — Inputs and PWM', 3: 'Module 3 — Sound', 4: 'Module 4 — Sensors', 5: 'Module 5 — Motion and power', 6: 'Module 6 — Digital sensors (I²C)', 7: 'Module 7 — Light and climate', 8: 'Module 8 — Controls', 9: 'Module 9 — Displays' };
export const U3_COMING = [];

const U3_BASE = [
  // ================================================================== 1
  {
    id: 'u1', num: 1, module: 1, title: 'Meet the Arduino UNO R3', level: 'Start here', time: '10 min',
    goal: 'Recognise every important part of the UNO R3 and know what it does.',
    hardware: ['Arduino UNO R3'],
    steps: [
      { title: 'Welcome to the UNO R3', view: 'home', power: false,
        body: `<p>The <b>Arduino UNO R3</b> (A000066) is the classic Arduino board: <b>68.58 mm × 53.34 mm</b>, one microcontroller, <b>5 V</b> logic, <b>14 digital</b> pins and <b>6 analog inputs</b>.</p>
        <p>You write a <b>sketch</b>, upload it over USB, and the board runs it again and again. There is no operating system: the sketch is the only program.</p>
        <p class="tip">Drag to rotate, scroll to zoom, click any part. Press <b>Next</b> for the tour.</p>` },
      { title: 'The brain: ATmega328P', focus: 'mcu',
        body: `<p>The long black chip in the socket is the <b>ATmega328P</b>, an 8-bit AVR microcontroller.</p>
        <ul><li><b>16 MHz</b> clock on this board</li><li><b>32 kB</b> flash (your program), <b>2 kB</b> SRAM (variables), <b>1 kB</b> EEPROM</li></ul>
        <p>It sits in a <b>socket</b>, so it can be replaced. Pin 1 and the notch are at the end next to the ICSP header.</p>` },
      { title: 'The USB helper: ATmega16U2', focus: 'usbchip',
        body: `<p>A second, small chip turns <b>USB</b> into a <b>serial</b> link for the ATmega328P. Uploading a sketch and the <b>Serial Monitor</b> both go through it.</p>
        <p>The <b>TX</b> and <b>RX</b> LEDs flash when data goes through it.</p>` },
      { title: 'USB-B connector', focus: 'usb',
        body: `<p>The square metal connector is <b>USB-B</b>. It carries <b>5 V power</b> and the data for uploading.</p>
        <p>A <b>500 mA resettable fuse</b> protects the computer’s USB port.</p>` },
      { title: 'DC jack and the power chips', focus: ['dcjack', 'reg5', 'reg33'],
        body: `<p>The black round socket takes a <b>wall adapter or battery</b> (the datasheet gives 6–20 V). The <b>5 V regulator</b> turns it into 5 V; a second regulator makes <b>3.3 V</b> for the 3.3V pin.</p>
        <p>When a supply is in the jack, the board stops using USB power by itself.</p>` },
      { title: 'Clocks', focus: ['xtal', 'reso'],
        body: `<p>Every microcontroller needs a clock. The <b>ceramic resonator</b> (Y2) gives the ATmega328P its <b>16 MHz</b>; the <b>metal-can crystal</b> (Y1) clocks the USB chip.</p>` },
      { title: 'Reset button and the LEDs', focus: ['reset', 'ledon', 'ledl', 'ledtx', 'ledrx'],
        body: `<ul><li><b>Reset button</b>: restarts your sketch.</li><li><b>ON</b> (green): the board has 5 V.</li><li><b>L</b> (yellow): the built-in LED, connected to <b>pin 13</b>.</li><li><b>TX / RX</b>: serial traffic with the computer.</li></ul>` },
      { title: 'Headers: where you connect things', focus: ['jdigital', 'jpower', 'janalog'],
        body: `<ul><li><b>Digital header</b> (top): pins <b>0–13</b>, GND, AREF, and a copy of the I²C pins SDA/SCL. <b>~</b> marks the PWM pins 3, 5, 6, 9, 10, 11.</li>
        <li><b>Power header</b> (bottom left): IOREF, RESET, <b>3.3V</b>, <b>5V</b>, <b>GND</b> ×2, <b>VIN</b>.</li><li><b>Analog header</b> (bottom right): <b>A0–A5</b>.</li></ul>
        <p class="tip">Click any single pin to see its function.</p>` },
      { title: 'Summary', view: 'home',
        body: `<ul><li>One microcontroller (ATmega328P, 16 MHz, 5 V), plus a USB helper chip.</li><li>Power from USB or the DC jack; 5 V and 3.3 V come out on the power header.</li><li>14 digital pins, 6 analog inputs, 6 PWM pins.</li></ul>` },
    ],
    quiz: [
      { q: 'Which chip runs your sketch?', a: ['ATmega16U2', 'ATmega328P', 'The USB connector', 'The crystal'], c: 1, why: 'The ATmega328P is the main microcontroller; the 16U2 only handles USB.' },
      { q: 'What voltage do the I/O pins of the UNO R3 use?', a: ['1.8 V', '3.3 V', '5 V', '12 V'], c: 2, why: 'The UNO R3 works at 5 V logic.' },
      { q: 'Which digital pin is connected to the built-in L LED?', a: ['Pin 2', 'Pin 13', 'Pin 0', 'A0'], c: 1, why: 'LED_BUILTIN is pin 13.' },
      { q: 'Which pins are PWM pins?', a: ['0, 1, 2', '3, 5, 6, 9, 10, 11', 'A0–A5', 'All pins'], c: 1, why: 'The ~ marks: 3, 5, 6, 9, 10, 11.' },
    ],
    sources: [SRC.ds, SRC.atm],
  },
  // ================================================================== 2
  {
    id: 'u2', num: 2, module: 1, title: 'Power the board safely', level: 'Beginner', time: '10 min',
    goal: 'Connect the USB cable, see the ON LED, and know the limits of the pins and power outputs.',
    hardware: ['Arduino UNO R3', 'USB-B cable'],
    steps: [
      { title: 'Unplugged board', view: 'home', power: false,
        body: `<p>The board has no power: the green <b>ON</b> LED is dark. Always build circuits with the cable <b>unplugged</b>.</p>` },
      { title: 'Plug in the USB-B cable', view: 'home', power: true, action: 'plugUsb',
        body: `<p>Watch the cable plug in: the green <b>ON</b> LED lights. The USB port supplies <b>5 V</b>; that voltage is on the <b>5V</b> pin, and the on-board regulator makes <b>3.3 V</b> for the 3.3V pin.</p>` },
      { title: 'Other ways to power it', focus: ['dcjack', 'jpower'],
        body: `<ul><li><b>DC jack</b> or the <b>VIN</b> pin: 6–20 V (datasheet limits).</li><li>The <b>5V</b> pin can also feed 5 V in.</li></ul>
        <p class="warn">Do not connect two power sources at the same time without checking: only connect what the datasheet allows.</p>` },
      { title: 'Limits you must remember', focus: 'jdigital',
        body: `<ul><li>Every I/O pin works at <b>5 V</b>.</li><li>One pin: <b>20 mA</b> recommended, <b>40 mA</b> is the absolute maximum (ATmega328P). Never exceed it.</li>
        <li>The <b>3.3V</b> pin is for small loads only.</li><li>Never connect a pin straight to GND while it is an output set HIGH.</li></ul>` },
      { title: 'Summary', view: 'home',
        body: `<ul><li>USB (or the jack) powers the board; the ON LED shows 5 V.</li><li>Power off before wiring.</li><li>Stay well below 20 mA per pin.</li></ul>` },
    ],
    quiz: [
      { q: 'What does the green ON LED show?', a: ['The sketch is running', 'The board has 5 V', 'USB data', 'Pin 13 is HIGH'], c: 1, why: 'ON is the power LED.' },
      { q: 'What is the absolute maximum current of one ATmega328P I/O pin?', a: ['4 mA', '40 mA', '400 mA', '4 A'], c: 1, why: 'ATmega328P datasheet: 40 mA absolute maximum per I/O pin (Arduino recommends 20 mA).' },
      { q: 'Should you wire a circuit with the power on?', a: ['Yes, it is faster', 'No, unplug first', 'Only on Mondays', 'Only for LEDs'], c: 1, why: 'A wrong touch on a live board can short a pin.' },
    ],
    sources: [SRC.ds, SRC.atm],
  },
  // ================================================================== 3
  {
    id: 'u3', num: 3, module: 1, title: 'Hello World: blink the built-in LED', level: 'Beginner', time: '12 min',
    goal: 'Run your first sketch: setup() and loop(), and blink the L LED on pin 13.',
    hardware: ['Arduino UNO R3', 'USB-B cable', 'Computer with the Arduino IDE'],
    code: U3_BLINK, file: 'Blink.ino', program: 'blink',
    explain: {
      1: '<b>setup()</b> runs <b>once</b> when the board starts or is reset.',
      2: '<b>Serial.begin(9600)</b> starts serial output to the computer at 9600 baud (the Serial Monitor).',
      4: '<b>pinMode(LED_BUILTIN, OUTPUT)</b>: LED_BUILTIN is pin 13. It becomes an output.',
      8: '<b>loop()</b> runs <b>again and again</b> after setup().',
      9: '<b>HIGH</b> puts 5 V on pin 13: the yellow L LED turns <b>ON</b> (this LED is active-high).',
      10: '<b>delay(1000)</b> waits 1000 ms = 1 second.',
      11: '<b>LOW</b> puts 0 V on pin 13: the LED turns <b>OFF</b>.',
      12: 'Wait one more second.',
      14: '<b>Serial.println</b> prints a line in the Serial Monitor every time loop() runs.',
    },
    steps: [
      { title: 'Upload with the Arduino IDE', view: 'home', action: 'ensurePower',
        body: `<p>Install the <b>Arduino IDE</b>, choose <b>Tools → Board → Arduino UNO</b> and the port, open <b>File → Examples → 01.Basics → Blink</b> and press <b>Upload</b>.</p>
        <p>The sketch goes over USB to the ATmega16U2, which passes it to the ATmega328P (that is why the <b>TX/RX</b> LEDs flash while uploading).</p>` },
      { title: 'Where is the LED?', focus: 'ledl',
        body: `<p>The yellow <b>L</b> LED is connected to <b>pin 13</b>, called <b>LED_BUILTIN</b>.</p>
        <p>HIGH (5 V) = <b>on</b>, LOW (0 V) = <b>off</b>.</p>` },
      { title: 'Read the sketch', focus: 'ledl', showCode: true,
        body: `<p>This is the <b>Blink</b> example, with one extra line (<code>Serial</code>) that prints “Hello World”.</p><p class="tip">Click any line to see what it does.</p>` },
      { title: 'Run it', focus: 'ledl', showCode: true, action: 'run', zoom: 0.6,
        body: `<p>Press <b>▶ Run</b>. The highlighted line, the pin level (5 V / 0 V) and the yellow LED follow the sketch: 1 second on, 1 second off.</p>` },
      { title: 'Experiment: change the speed', focus: 'ledl', showCode: true, action: 'speedSlider',
        body: `<p>Use the slider to change both <code>delay()</code> values. Smaller delay = faster blinking. Try 200 ms, then 2000 ms.</p>` },
      { title: 'Summary', view: 'home',
        body: `<ul><li>A sketch has <code>setup()</code> (once) and <code>loop()</code> (forever).</li><li><code>pinMode</code>, <code>digitalWrite</code>, <code>delay</code>, <code>Serial.println</code>.</li><li>LED_BUILTIN = pin 13, HIGH = on.</li></ul>` },
    ],
    quiz: [
      { q: 'How often does loop() run?', a: ['Once', 'Twice', 'Over and over again', 'Only when a button is pressed'], c: 2, why: 'loop() repeats forever after setup().' },
      { q: 'On the UNO R3, digitalWrite(LED_BUILTIN, HIGH) makes the L LED…', a: ['Turn off', 'Turn on', 'Reset the board', 'Nothing'], c: 1, why: 'The L LED is active-high: HIGH = on.' },
      { q: 'delay(1000) waits for…', a: ['1000 seconds', '1 second', '1 millisecond', '1 microsecond'], c: 1, why: 'delay() takes milliseconds.' },
      { q: 'Which pin is LED_BUILTIN on the UNO R3?', a: ['2', '5', '13', 'A0'], c: 2, why: 'LED_BUILTIN is pin 13.' },
    ],
    sources: [SRC.ds, SRC.ref],
  },
  // ================================================================== 4
  {
    id: 'u4', num: 4, module: 1, title: 'Your first circuit: an external LED', level: 'Beginner', time: '15 min',
    goal: 'Use a breadboard, choose a safe resistor, wire an LED to pin 5 and blink it.',
    hardware: ['Arduino UNO R3', 'USB-B cable', 'Breadboard', '5 mm red LED', '220 Ω resistor', '2 × male-male jumper wires'],
    code: U3_EXT_LED, file: 'ExternalLed.ino', program: 'extled',
    circuit: LED_CIRCUIT, io: { D5: IO_LED },
    explain: {
      2: '<b>int ledPin = 5;</b> stores the pin number in a variable, so it is easy to change later.',
      4: '<b>setup()</b> runs once.',
      5: '<b>pinMode(ledPin, OUTPUT)</b>: pin 5 will drive the LED.',
      8: '<b>loop()</b> repeats forever.',
      9: '<b>HIGH</b> puts 5 V on pin 5. The LED is fed through the resistor and its cathode goes to GND, so this LED is <b>active-high</b>: HIGH = ON.',
      10: 'Wait 1 second.',
      11: '<b>LOW</b> puts 0 V on pin 5 → no voltage across the LED → OFF.',
      12: 'Wait 1 second, then loop() starts again.',
    },
    steps: [
      { title: 'Parts for this circuit', view: 'bench', have: [],
        body: `<ul><li><b>Breadboard</b></li><li><b>5 mm red LED</b></li><li><b>220 Ω resistor</b> (red-red-brown-gold)</li><li><b>2 jumper wires</b>: yellow for the signal, black for ground</li></ul><p class="tip">Click any part in the 3D view to read about it.</p>` },
      { title: 'How a breadboard is connected inside', view: 'bench', action: 'showStrips',
        body: `<p>The coloured bars show which holes are <b>connected inside</b>: each numbered column has holes <b>a–e</b> connected, and <b>f–j</b> connected. The centre gap separates the halves.</p>` },
      { title: 'Safety first: unplug while wiring', view: 'bench', power: false,
        body: `<p>Disconnect power while you build or change a circuit.</p>` },
      { title: 'Step 1 — insert the resistor', view: 'breadboard', have: ['r1'], holes: ['c10', 'c14'],
        body: `<p>Put the <b>220 Ω resistor</b> into <b>c10</b> and <b>c14</b>.</p>
        <p><b>Why 220 Ω?</b> The pin gives <b>5 V</b> and a red LED drops about 2.0 V, so the resistor sees ≈3 V:</p>
        <p class="formula">I = (5 V − 2.0 V) ÷ 220 Ω ≈ <b>13.6 mA</b></p>
        <p>Bright enough, and below the recommended <b>20 mA</b> per pin (absolute maximum 40 mA).</p>` },
      { title: 'Step 2 — insert the LED', view: 'breadboard', have: ['r1', 'led1'], holes: ['d14 · anode (+)', 'd15 · cathode (−)'],
        body: `<ul><li><b>Long leg = anode (+)</b> → <b>d14</b></li><li><b>Short leg = cathode (−)</b> → <b>d15</b></li></ul><p class="warn">An LED only conducts one way. Reversed, it stays dark.</p>` },
      { title: 'Step 3 — wire pin 5 to the resistor', view: 'bench', pins: ['D5'], have: ['r1', 'led1', 'w1'],
        body: `<p>Yellow jumper: <b>pin 5</b> on the digital header → hole <b>a10</b>.</p>` },
      { title: 'Step 4 — wire the LED to GND', view: 'bench', pins: ['GND2'], have: LED_IDS,
        body: `<p>Black jumper: hole <b>a15</b> → <b>GND</b> on the power header. The circuit is complete.</p>` },
      { title: 'Check the current path', view: 'bench', trace: LED_IDS, pins: ['D5', 'GND2'],
        body: `<p class="path">pin 5 → yellow wire → a10 → <b>column 10</b> → resistor → <b>column 14</b> → LED anode → LED cathode → <b>column 15</b> → a15 → black wire → <b>GND</b></p>` },
      { title: 'The code', view: 'bench', showCode: true,
        body: `<p>Same idea as Blink, only the pin changes. On the classic UNO core you write the pin <b>number</b> (5).</p>` },
      { title: 'Power up and run', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>The LED blinks: 1 s on, 1 s off. Watch the pin level: 5 V = HIGH → LED on.</p>` },
      { title: 'Summary', view: 'bench',
        body: `<ul><li>Breadboard columns connect a–e (and f–j).</li><li>LED: long leg (+) toward the pin, short leg (−) toward GND.</li><li>Always use a series resistor: 220 Ω → ≈13.6 mA at 5 V.</li></ul>` },
    ],
    quiz: [
      { q: 'Which LED leg is the anode (+)?', a: ['The shorter leg', 'The longer leg', 'Either leg', 'The leg near the flat edge'], c: 1, why: 'The longer leg is the anode.' },
      { q: 'With 5 V, a 2.0 V LED and 220 Ω, the current is about…', a: ['1.4 mA', '13.6 mA', '45 mA', '136 mA'], c: 1, why: '(5 − 2.0) / 220 ≈ 0.0136 A = 13.6 mA.' },
      { q: 'What is the recommended current per I/O pin on the UNO R3?', a: ['2 mA', '20 mA', '200 mA', '2 A'], c: 1, why: 'Arduino specifies 20 mA per pin (the ATmega328P absolute maximum is 40 mA).' },
      { q: 'This external LED (cathode to GND) is ON when pin 5 is…', a: ['HIGH', 'LOW', 'Floating', 'Never'], c: 0, why: 'HIGH puts 5 V on the anode side, so current flows to GND.' },
    ],
    sources: [SRC.ds, SRC.atm, SRC.ref],
  },
  // ================================================================== 5
  {
    id: 'u5', num: 5, module: 2, title: 'Read a push button (digital input)', level: 'Beginner', time: '15 min',
    goal: 'Read a button with digitalRead() and INPUT_PULLUP, and switch the LED with it.',
    hardware: ['Lesson 4 circuit (LED on pin 5)', '6 × 6 mm push button', '2 × jumper wires'],
    code: U3_BUTTON, file: 'Button.ino', program: 'button', widgets: ['button'],
    circuit: [...LED_CIRCUIT, ...BUTTON_PARTS], io: { D5: IO_LED, D4: { kind: 'button', item: 'btn1', needs: BUTTON_IDS } },
    explain: {
      2: '<b>buttonPin = 4</b> — the button is read on pin 4.',
      3: '<b>ledPin = 5</b> — the LED from Lesson 4.',
      6: 'A variable that will hold the reading: HIGH (1) or LOW (0).',
      10: '<b>INPUT_PULLUP</b>: pin 4 becomes an input and the ATmega328P’s internal pull-up resistor (20–50 kΩ) connects it to 5 V. Unpressed → HIGH.',
      11: 'Pin 5 drives the LED.',
      14: 'Start Serial output.',
      19: '<b>digitalRead(buttonPin)</b> returns HIGH or LOW.',
      22: 'Pressed = <b>LOW</b>, because the button connects pin 4 to GND.',
      23: 'Pressed → LED on.',
      27: 'Not pressed → LED off.',
      32: '<b>delay(1000)</b>: the button is only checked once per second — so hold it at least 1 s.',
    },
    steps: [
      { title: 'What you need', view: 'bench', have: LED_IDS,
        body: `<p>Keep the <b>LED circuit from Lesson 4</b> and add a <b>6 × 6 mm tactile push button</b>, a <b>blue</b> jumper and a <b>black</b> jumper.</p>` },
      { title: 'Why pressed reads LOW: the pull-up', view: 'bench', pins: ['D4'],
        body: `<div class="ptree"><div class="pt-row"><span class="pt bus">5 V</span></div><div class="pt-arrow">│ internal pull-up (20–50 kΩ, inside the ATmega328P)</div>
        <div class="pt-row"><span class="pt">pin 4 (input)</span></div><div class="pt-arrow">│ push button</div><div class="pt-row"><span class="pt">GND</span></div></div>
        <ul><li><b>Not pressed</b>: nothing pulls the pin down → it reads <b>HIGH</b>.</li><li><b>Pressed</b>: the button connects pin 4 to GND → it reads <b>LOW</b>.</li></ul>
        <p>Without a pull-up an open input <b>floats</b> and reads random values.</p>` },
      { title: 'Step 1 — insert the button', view: 'breadboard', power: false, have: [...LED_IDS, 'btn1'], holes: ['e20', 'e22', 'f20', 'f22'],
        body: `<p>Push the button across the <b>centre gap</b>: legs in <b>e20, e22, f20, f22</b>.</p>` },
      { title: 'Step 2 — wire pin 4', view: 'bench', pins: ['D4'], have: [...LED_IDS, 'btn1', 'w3'],
        body: `<p>Blue jumper: <b>pin 4</b> → hole <b>a20</b>.</p>` },
      { title: 'Step 3 — wire GND to the diagonal leg', view: 'bench', pins: ['GND3'], have: [...LED_IDS, ...BUTTON_IDS],
        body: `<p>Black jumper: hole <b>j22</b> → <b>GND</b>. Column 22 reaches the leg diagonally opposite to e20.</p>` },
      { title: 'The code', view: 'bench', showCode: true,
        body: `<ul><li><code>INPUT_PULLUP</code> — internal pull-up on pin 4</li><li><code>digitalRead()</code> — HIGH or LOW</li><li><code>if (buttonState == LOW)</code> — pressed</li></ul>` },
      { title: 'Run it: press the button', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p><b>Click and hold</b> the button in the 3D view (or hold <b>“Hold to press”</b>). Pin 4 goes LOW → the LED turns on → the Serial Monitor prints the message.</p>
        <p class="warn">Because of <code>delay(1000)</code> the sketch checks the button only <b>once per second</b>.</p>` },
      { title: 'Summary', view: 'bench',
        body: `<ul><li><code>INPUT_PULLUP</code> = internal pull-up to 5 V → unpressed HIGH, pressed LOW.</li><li>Wire a push button on <b>diagonal legs</b>.</li></ul>` },
    ],
    quiz: [
      { q: 'With INPUT_PULLUP, what does an unpressed button read?', a: ['LOW', 'HIGH', 'A random value', '512'], c: 1, why: 'The internal pull-up pulls the pin to 5 V.' },
      { q: 'In this circuit, pressing the button makes pin 4 read…', a: ['HIGH', 'LOW', '5 V', 'Nothing changes'], c: 1, why: 'The button connects pin 4 to GND.' },
      { q: 'What is the internal pull-up resistance of the ATmega328P?', a: ['20–50 Ω', '20–50 kΩ', '20–50 MΩ', '2 kΩ'], c: 1, why: 'ATmega328P datasheet: 20–50 kΩ.' },
    ],
    sources: [SRC.pinmode, SRC.atm, SRC.ds],
  },
  // ================================================================== 6
  {
    id: 'u6', num: 6, module: 2, title: 'Read a potentiometer (analog input)', level: 'Beginner', time: '15 min',
    goal: 'Turn a voltage into a number with analogRead() and the 10-bit ADC.',
    hardware: ['Arduino UNO R3', 'Breadboard', '10 kΩ potentiometer', '3 × jumper wires'],
    code: U3_POT, file: 'AnalogReadSerial.ino', program: 'u3_pot', widgets: ['knob'],
    circuit: POT_PARTS, io: { A0: { kind: 'pot', item: 'pot1', needs: POT_IDS } },
    explain: {
      1: '<b>sensorPin = A0</b> — the wiper of the potentiometer goes to A0.',
      2: 'Variable for the reading.',
      5: 'Start Serial output.',
      8: '<b>loop()</b> repeats forever.',
      10: '<b>analogRead(A0)</b> measures the voltage on A0: value ≈ voltage ÷ 5 V × 1023 (10-bit, 0–1023).',
      11: 'Print the number.',
      12: 'Wait 100 ms → about 10 readings per second.',
    },
    steps: [
      { title: 'What you need', view: 'bench', have: [],
        body: `<p>An <b>empty breadboard</b>, a <b>10 kΩ potentiometer</b> and <b>3 jumpers</b>: red (5V), green (signal), black (GND).</p>` },
      { title: 'How a potentiometer works', view: 'breadboard',
        body: `<div class="ptree"><div class="pt-row"><span class="pt bus">5V — left leg</span></div><div class="pt-arrow">│ resistive track (10 kΩ)</div><div class="pt-row"><span class="pt">middle leg = wiper → A0</span></div><div class="pt-arrow">│</div><div class="pt-row"><span class="pt">GND — right leg</span></div></div>
        <p>Turning the knob slides the wiper along the track, so the wiper voltage goes smoothly from <b>0 V</b> to <b>5 V</b>: a <b>voltage divider</b>.</p>` },
      { title: 'From voltage to a number: the ADC', view: 'bench', pins: ['A0'],
        body: `<p>The ADC of the UNO R3 is <b>10-bit</b>: <code>analogRead()</code> returns <b>0 … 1023</b> for <b>0 V … 5 V</b> (the default reference).</p>
        <p class="formula">value ≈ V<sub>A0</sub> ÷ 5 V × 1023</p><p>0 V → 0, 2.5 V → ≈512, 5 V → 1023.</p>` },
      { title: 'Step 1 — insert the potentiometer', view: 'breadboard', power: false, have: ['pot1'], holes: ['e24', 'e26 · wiper', 'e28'],
        body: `<p>Legs in <b>e24</b>, <b>e26</b> (wiper) and <b>e28</b>.</p>` },
      { title: 'Step 2 — wire 5V, A0 and GND', view: 'bench', have: POT_IDS, pins: ['5V', 'A0', 'GND3'],
        body: `<ul><li>Red: <b>5V</b> → <b>a24</b></li><li>Green: <b>A0</b> → <b>a26</b> (wiper)</li><li>Black: <b>GND</b> → <b>a28</b></li></ul>` },
      { title: 'The code', view: 'bench', showCode: true,
        body: `<p>This is the <b>AnalogReadSerial</b> pattern from the Arduino examples.</p>` },
      { title: 'Run it & turn the knob', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p><b>Drag the knob</b> in the 3D view (or use the knob slider). The numbers follow the wiper voltage.</p><p class="sim">The simulated reading includes a little random noise, like a real ADC.</p>` },
      { title: 'Summary', view: 'bench',
        body: `<ul><li>A potentiometer is a voltage divider: wiper 0–5 V.</li><li><code>analogRead()</code> → 0–1023.</li></ul>` },
    ],
    quiz: [
      { q: 'analogRead() on the UNO R3 returns values from…', a: ['0 to 255', '0 to 1023', '0 to 4095', '0 to 16383'], c: 1, why: 'The UNO R3 ADC is 10-bit.' },
      { q: 'The wiper is at 2.5 V. The reading is about…', a: ['255', '512', '1023', '2500'], c: 1, why: '2.5 / 5 × 1023 ≈ 512.' },
      { q: 'Which pins are the analog inputs?', a: ['0–13', 'A0–A5', 'RESET', 'VIN'], c: 1, why: 'A0–A5 on the analog header.' },
    ],
    sources: [SRC.ar, SRC.ds],
  },
  // ================================================================== 7
  {
    id: 'u7', num: 7, module: 2, title: 'Fade an LED with PWM', level: 'Beginner', time: '12 min',
    goal: 'Understand PWM and duty cycle, and use analogWrite() to dim an LED.',
    hardware: ['Lesson 4 circuit (LED on pin 5)'],
    code: U3_FADE, file: 'Fade.ino', program: 'fade', fast: true,
    circuit: LED_CIRCUIT, io: { D5: IO_LED },
    explain: {
      2: '<b>5</b> is one of the PWM pins (marked ~).',
      3: 'Brightness value 0 … 255, because analogWrite() is 8-bit.',
      4: 'Step size per loop.',
      7: 'Sets pin 5 as an output.',
      11: '<b>analogWrite(led, brightness)</b> sets the PWM duty cycle: brightness ÷ 255.',
      12: 'Increase (or decrease) the brightness.',
      13: 'At either end (0 or 255)…',
      14: '…reverse direction.',
      16: 'Wait 30 ms per step → one fade from 0 to 255 takes about 1.5 s.',
    },
    steps: [
      { title: 'Back to the LED circuit', view: 'bench', have: LED_IDS,
        body: `<p>We reuse the <b>LED on pin 5</b>. This time it will <b>dim and brighten</b>.</p>` },
      { title: 'What is PWM?', view: 'bench',
        body: `<p>A digital pin is either <b>HIGH (5 V)</b> or <b>LOW (0 V)</b>. <b>PWM</b> switches it on and off very fast. The <b>duty cycle</b> is the share of time it is HIGH; the average voltage ≈ duty × 5 V. The switching is too fast to see, so the LED looks dimmer or brighter.</p>` },
      { title: 'PWM on the UNO R3', view: 'bench', pins: ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'],
        body: `<ul><li>PWM pins: <b>~3, ~5, ~6, ~9, ~10, ~11</b></li><li>Frequency about <b>490 Hz</b>; pins <b>5 and 6</b> about <b>980 Hz</b> (Arduino reference)</li>
        <li><code>analogWrite(pin, value)</code>: <b>0</b> = always off, <b>255</b> = always on, ≈128 = 50 %</li></ul>` },
      { title: 'The code', view: 'bench', showCode: true,
        body: `<p>The classic <b>Fade</b> sketch: brightness goes 0 → 255 → 0 in steps of 5, one step every 30 ms.</p>` },
      { title: 'Run it', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Watch the LED fade up and down.</p>` },
      { title: 'Summary', view: 'bench',
        body: `<ul><li>PWM = fast on/off; the duty cycle sets the average.</li><li>UNO R3 PWM pins: 3, 5, 6, 9, 10, 11.</li><li><code>analogWrite(pin, 0…255)</code>.</li></ul>` },
    ],
    quiz: [
      { q: 'Which pin is NOT a PWM pin on the UNO R3?', a: ['3', '4', '9', '11'], c: 1, why: 'PWM pins are 3, 5, 6, 9, 10, 11.' },
      { q: 'analogWrite(5, 255) means…', a: ['Always off', 'About 50 %', 'Always on', 'An error'], c: 2, why: '8-bit: 255 is 100 % duty.' },
      { q: 'At 50 % duty, the average voltage on a 5 V pin is about…', a: ['0 V', '2.5 V', '5 V', '10 V'], c: 1, why: '0.5 × 5 V = 2.5 V.' },
    ],
    sources: [SRC.aw, SRC.ds],
  },
  // ================================================================== 8
  {
    id: 'u8', num: 8, module: 3, title: 'Make sound with a piezo buzzer', level: 'Beginner', time: '15 min',
    goal: 'Play notes with tone() and noTone(), and protect the pin with a resistor.',
    hardware: ['Arduino UNO R3', 'Breadboard', 'Passive piezo buzzer', '220 Ω resistor', '2 × jumper wires'],
    code: U3_BUZZER, file: 'Scale.ino', program: 'buzzer', fast: true, widgets: ['audio'],
    circuit: BUZZER_PARTS, io: { D9: { kind: 'buzzer', item: 'bz1', needs: BUZZER_IDS } },
    explain: {
      2: 'The buzzer is driven from <b>pin 9</b>.',
      3: 'Note frequencies in hertz: C4 D4 E4 F4 G4 A4 B4 C5 (A4 = 440 Hz, rounded).',
      9: 'Repeat for the 8 notes.',
      10: '<b>tone(pin, frequency, duration)</b> starts a square wave and <b>returns immediately</b>; the note stops by itself after 250 ms.',
      11: 'Because tone() does not wait, we wait 300 ms: the note plus a 50 ms gap.',
      13: '<b>noTone(pin)</b> stops any tone on the pin.',
      14: 'One second of silence, then the scale repeats.',
    },
    steps: [
      { title: 'What you need', view: 'bench', have: [],
        body: `<ul><li>a <b>passive piezo buzzer</b></li><li>a <b>220 Ω resistor</b></li><li><b>2 jumpers</b>: orange (signal) and black (GND)</li></ul>` },
      { title: 'Passive or active buzzer?', view: 'breadboard',
        body: `<ul><li><b>Active</b> buzzer: has its own oscillator and beeps at one pitch when you apply DC.</li><li><b>Passive</b> buzzer: needs an alternating signal. You choose the pitch with <code>tone()</code>.</li></ul>` },
      { title: 'How tone() works', view: 'bench', pins: ['D9'],
        body: `<ul><li><code>tone(pin, frequency)</code> makes a <b>square wave</b> at that frequency; the frequency is the <b>pitch</b>.</li><li><code>tone(pin, frequency, duration)</code> stops by itself after <i>duration</i> ms.</li><li><code>noTone(pin)</code> stops the sound.</li></ul>
        <p class="warn">On the UNO R3, <code>tone()</code> uses a timer: it disables PWM (<code>analogWrite</code>) on pins <b>3 and 11</b> while it is playing (Arduino reference).</p>` },
      { title: 'Why a 220 Ω resistor?', view: 'bench',
        body: `<p class="formula">I<sub>max</sub> = 5 V ÷ 220 Ω ≈ 23 mA</p><p>In the worst case that is slightly above the recommended 20 mA, well below the 40 mA absolute maximum. A piezo draws much less in practice; the resistor also makes it a little quieter.</p>` },
      { title: 'Step 1 — insert the resistor', view: 'breadboard', power: false, have: ['r2'], holes: ['c19', 'c23'], body: `<p>Resistor in <b>c19</b> and <b>c23</b>.</p>` },
      { title: 'Step 2 — insert the buzzer', view: 'breadboard', have: ['r2', 'bz1'], holes: ['e23 · +', 'e26 · −'], body: `<p>Buzzer <b>+</b> leg in <b>e23</b>, <b>−</b> leg in <b>e26</b>.</p>` },
      { title: 'Step 3 — wire pin 9 and GND', view: 'bench', have: BUZZER_IDS, pins: ['D9', 'GND3'],
        body: `<ul><li>Orange: <b>pin 9</b> → <b>a19</b></li><li>Black: <b>a26</b> → <b>GND</b></li></ul>` },
      { title: 'The code', view: 'bench', showCode: true, body: `<p>C4 262 Hz … C5 523 Hz: the C-major scale.</p>` },
      { title: 'Run it & listen', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Turn on your computer’s sound. The scale plays through your speakers.</p><p class="sim">The sound is generated by your browser as a square wave at the same frequencies; a real piezo sounds thinner.</p>` },
      { title: 'Summary', view: 'bench', body: `<ul><li><code>tone(pin, Hz, ms)</code> — non-blocking square wave; <code>noTone(pin)</code> — stop.</li><li>Passive buzzer = you choose the pitch.</li></ul>` },
    ],
    quiz: [
      { q: 'tone(9, 440) produces…', a: ['A 440 Hz square wave', '440 mV', '440 ms of silence', 'A 440 kHz sine wave'], c: 0, why: 'tone() outputs a square wave at the given frequency.' },
      { q: 'Does tone(pin, f, 250) wait until the note ends?', a: ['Yes, 250 ms', 'No, it returns immediately', 'It waits 1 s', 'Only on pin 9'], c: 1, why: 'tone() starts a timer and returns.' },
      { q: 'Which function stops a tone?', a: ['stopTone()', 'noTone()', 'tone(0)', 'delay()'], c: 1, why: 'noTone(pin) stops the tone on that pin.' },
    ],
    sources: [SRC.tone, SRC.ds],
  },
];

export const U3_LESSONS = [...U3_BASE, ...U3_LESSONS_2];

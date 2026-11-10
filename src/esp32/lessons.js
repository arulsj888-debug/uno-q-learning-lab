// Lessons for the ESP32 DevKit V1 (DOIT-style board). Facts come from the Espressif ESP32 datasheet v5.3 (DS), the ESP32-WROOM-32
// datasheet v3.8 (MOD), the Arduino-ESP32 documentation (AE), Random Nerd Tutorials (RNT) and espboards.dev (EB). Code: ./code.js.
import { E32_BLINK, E32_EXT_LED, E32_BUTTON, E32_POT, E32_FADE } from './code.js';

const SRC = {
  ds: { t: 'Espressif ESP32 Series Datasheet v5.3', u: 'https://documentation.espressif.com/esp32_datasheet_en.pdf' },
  mod: { t: 'Espressif ESP32-WROOM-32 Datasheet v3.8', u: 'https://documentation.espressif.com/esp32-wroom-32_datasheet_en.pdf' },
  rnt: { t: 'Random Nerd Tutorials: Getting Started with the ESP32', u: 'https://randomnerdtutorials.com/getting-started-with-esp32/' },
  rntpin: { t: 'Random Nerd Tutorials: ESP32 Pinout Reference', u: 'https://randomnerdtutorials.com/esp32-pinout-reference-gpios/' },
  eb: { t: 'espboards.dev: ESP32 30-pin DevKit (generic)', u: 'https://www.espboards.dev/esp32/esp32-30pin-devkit-generic/' },
  adc: { t: 'Arduino-ESP32 documentation: ADC (analogRead)', u: 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/adc.html' },
  ledc: { t: 'Arduino-ESP32 documentation: LEDC (PWM)', u: 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/ledc.html' },
  idf: { t: 'ESP-IDF documentation: ADC oneshot mode driver', u: 'https://docs.espressif.com/projects/esp-idf/en/v5.2/esp32/api-reference/peripherals/adc_oneshot.html' },
  pinmode: { t: 'Arduino reference: pinMode() — INPUT_PULLUP', u: 'https://docs.arduino.cc/language-reference/en/functions/digital-io/pinMode/' },
};

const LED_CIRCUIT = [
  { id: 'r1', type: 'resistor', a: 'c10', b: 'c14' },
  { id: 'led1', type: 'led', anode: 'd14', cathode: 'd15' },
  { id: 'w1', type: 'fwire', from: 'G16', to: 'a10', color: 'yellow', lift: 22 },
  { id: 'w2', type: 'fwire', from: 'GND2', to: 'a15', color: 'black', lift: 16 },
];
const LED_IDS = LED_CIRCUIT.map(d => d.id);
const IO_LED = { kind: 'led', item: 'led1', needs: LED_IDS };
const BUTTON_PARTS = [
  { id: 'btn1', type: 'button', col: 20 },
  { id: 'w3', type: 'fwire', from: 'G17', to: 'a20', color: 'blue', lift: 26 },
  { id: 'w4', type: 'fwire', from: 'GND1', to: 'j22', color: 'black', lift: 46 },
];
const BUTTON_IDS = BUTTON_PARTS.map(d => d.id);
const POT_PARTS = [
  { id: 'pot1', type: 'pot', row: 'e', col: 24 },
  { id: 'w5', type: 'fwire', from: '3V3', to: 'a24', color: 'red', lift: 14 },
  { id: 'w6', type: 'fwire', from: 'G34', to: 'a26', color: 'green', lift: 48 },
  { id: 'w7', type: 'fwire', from: 'GND2', to: 'a28', color: 'black', lift: 22 },
];
const POT_IDS = POT_PARTS.map(d => d.id);

export const E32_MODULES = { 1: 'Module 1 — Getting started', 2: 'Module 2 — Inputs and PWM' };
export const E32_COMING = ['Touch sensor', 'Wi-Fi: scan and connect', 'A web page that switches an LED', 'Bluetooth LE', 'Deep sleep'];

export const E32_LESSONS = [
  // ================================================================== 1
  {
    id: 'e1', num: 1, module: 1, title: 'Meet the ESP32 DevKit V1', level: 'Start here', time: '10 min',
    goal: 'Recognise every important part of the ESP32 DevKit V1 and know what it does.',
    hardware: ['ESP32 DevKit V1 (DOIT-style board)'],
    steps: [
      { title: 'Welcome to the ESP32 DevKit', view: 'home', power: false,
        body: `<p>The <b>ESP32 DevKit V1</b> is a small, cheap board built around the <b>ESP32</b> chip from Espressif. Unlike the UNO R3 it has <b>Wi-Fi</b> and <b>Bluetooth</b> built in, and it is much faster.</p>
        <p>You write a <b>sketch</b> (a program) in the Arduino IDE, upload it over USB, and the board runs it again and again.</p>
        <p class="warn">Everything on this board works at <b>3.3 V</b>. Never connect 5 V to a pin.</p>
        <p class="sim">This 3D model is <b>stylised</b>. The module size and the order of the pins are real; the exact position of small parts is close but not measured. Boards from different sellers can look a little different.</p>` },
      { title: 'The brain: ESP32-WROOM-32', focus: 'module',
        body: `<p>The silver metal box is the <b>ESP32-WROOM-32 module</b> (Espressif datasheet): <b>18 × 25.5 × 3.1 mm</b>.</p>
        <ul><li>Two CPU cores, up to <b>240 MHz</b></li><li><b>520 KB</b> of RAM and <b>4 MB</b> of flash memory for your program</li><li><b>Wi-Fi</b> (802.11 b/g/n) and <b>Bluetooth</b> (v4.2 classic + low energy)</li><li>Power supply: <b>3.0 – 3.6 V</b></li></ul>` },
      { title: 'The antenna', focus: 'antenna',
        body: `<p>The golden zig-zag track at the end of the module is the <b>printed antenna</b> for Wi-Fi and Bluetooth. Keep metal and wires away from it, or the signal gets weaker.</p>` },
      { title: 'USB chip and micro-USB connector', focus: ['usb', 'usbchip'],
        body: `<p>The <b>micro-USB</b> connector brings <b>5 V</b> power and data. The small square chip next to it (a <b>CP2102</b> on the board of the Random Nerd Tutorials guide) turns USB into a serial connection for the ESP32.</p>
        <p class="tip">Other boards use a <b>CH340</b> or <b>CH9102</b> instead. The name is printed on the chip.</p>` },
      { title: '3.3 V regulator', focus: 'reg',
        body: `<p>The ESP32 needs <b>3.3 V</b>, but USB gives 5 V. This small <b>regulator</b> makes 3.3 V and feeds the <b>3V3</b> pin.</p>
        <p class="tip">Many boards use an AMS1117-3.3; newer ones use other regulators. It does not change how you program.</p>` },
      { title: 'Two buttons', focus: ['en', 'boot'],
        body: `<ul><li><b>EN</b> = reset. It restarts your program from the beginning.</li><li><b>BOOT</b> connects <b>GPIO0</b> to ground. If you hold it while the board starts, the chip waits for a new program (download mode).</li></ul>
        <p>After start-up GPIO0 is a normal pin, so a sketch can read the BOOT button too.</p>` },
      { title: 'The LEDs', focus: ['ledon', 'ledblue'],
        body: `<ul><li><b>Red</b>: the board has power.</li><li><b>Blue</b>: connected to <b>GPIO2</b>. Your sketch controls it.</li></ul>` },
      { title: 'The two rows of pins', focus: ['jleft', 'jright'],
        body: `<p>There are <b>2 × 15 pins</b>. Most are <b>GPIO</b> pins (general-purpose input/output). The ESP32 can move many functions to many pins in software, so wiring is flexible.</p>
        <ul><li><b>Left row</b> (EN … VIN): the reset pin, analog inputs, the <b>5 V</b> pin (VIN) and one GND.</li><li><b>Right row</b> (D23 … 3V3): I²C (D21, D22), the serial pins TX0 / RX0, one GND and the <b>3V3</b> output.</li></ul>
        <p class="tip">Click any single pin to see what it can do. Some boards have 36 or 38 pins; the extra pins are not used in this course.</p>` },
      { title: 'Summary', view: 'home',
        body: `<ul><li>One ESP32 module: 2 cores, Wi-Fi, Bluetooth, 3.3 V.</li><li>USB brings 5 V; a regulator makes 3.3 V.</li><li>EN restarts, BOOT is for uploading; blue LED on GPIO2.</li><li>Pins are called by their <b>GPIO number</b>.</li></ul>` },
    ],
    quiz: [
      { q: 'What voltage do the ESP32 pins use?', a: ['1.8 V', '3.3 V', '5 V', '12 V'], c: 1, why: 'The ESP32 works at 3.3 V; HIGH is about 3.3 V.' },
      { q: 'Which part gives the board its Wi-Fi and Bluetooth?', a: ['The CP2102 chip', 'The ESP32-WROOM-32 module', 'The micro-USB connector', 'The EN button'], c: 1, why: 'The module contains the ESP32 chip, flash memory and the antenna.' },
      { q: 'What does the EN button do?', a: ['Erases the program', 'Resets (restarts) the ESP32', 'Turns Wi-Fi off', 'Turns the blue LED on'], c: 1, why: 'EN pulls the chip-enable pin low: the chip restarts.' },
      { q: 'Which GPIO is the blue LED connected to?', a: ['GPIO0', 'GPIO2', 'GPIO13', 'GPIO34'], c: 1, why: 'The blue LED is on GPIO2.' },
    ],
    sources: [SRC.ds, SRC.mod, SRC.rnt, SRC.eb],
  },
  // ================================================================== 2
  {
    id: 'e2', num: 2, module: 1, title: 'Power the board and the 3.3 V rules', level: 'Beginner', time: '12 min',
    goal: 'Connect the USB cable, see the power LED, set up the Arduino IDE, and know the limits of the pins.',
    hardware: ['ESP32 DevKit V1', 'Micro-USB cable (with data wires)', 'Computer with the Arduino IDE'],
    steps: [
      { title: 'Unplugged board', view: 'home', power: false,
        body: `<p>No cable, no power: the red LED is dark. Always build circuits with the cable <b>unplugged</b>.</p>` },
      { title: 'Plug in the micro-USB cable', view: 'home', power: true, action: 'plugUsb',
        body: `<p>Watch the cable plug in: the red <b>power LED</b> lights. USB gives <b>5 V</b>; the regulator makes <b>3.3 V</b> for the chip and for the 3V3 pin.</p>
        <p class="tip">Use a cable that carries <b>data</b>. Some cheap cables only charge, and then the computer does not see the board.</p>` },
      { title: 'Set up the Arduino IDE', view: 'home', power: true,
        body: `<p>Steps from the Random Nerd Tutorials guide:</p>
        <ol><li>In the Arduino IDE open the <b>Boards Manager</b> and install <b>“esp32 by Espressif Systems”</b>.</li><li>Choose the board: <b>DOIT ESP32 DEVKIT V1</b>.</li><li>Choose the <b>COM port</b>. If no port shows up, install the USB driver: most boards use a <b>CP210x</b> or <b>CH340</b> chip.</li></ol>` },
      { title: 'Uploading: the BOOT button', view: 'home', power: true, focus: 'boot',
        body: `<p>When you press <b>Upload</b>, the IDE prints <b>“Connecting…”</b> with dots. If the upload does not start, <b>press and hold the BOOT button</b> for a couple of seconds while the dots appear (Random Nerd Tutorials). Many boards upload without it.</p>` },
      { title: 'Limits you must remember', view: 'home', power: true, focus: ['jleft', 'jright'],
        body: `<ul><li>Every GPIO works at <b>3.3 V</b>. The chip reads a level above <b>2.5 V</b> (0.75 × 3.3 V) as HIGH and below <b>0.8 V</b> (0.25 × 3.3 V) as LOW (datasheet).</li>
        <li><b>Never apply 5 V</b> to a GPIO. The VIN pin is the only 5 V pin.</li>
        <li>One pin can source about <b>40 mA</b> or sink about <b>28 mA</b> at most (datasheet, maximum drive strength). Stay far below that: <b>10 mA</b> or less is a good habit.</li>
        <li>The <b>3V3</b> pin is for small loads only.</li></ul>` },
      { title: 'Summary', view: 'home', power: true,
        body: `<ul><li>USB powers the board (5 V in, 3.3 V for the chip).</li><li>Install “esp32 by Espressif Systems”, choose DOIT ESP32 DEVKIT V1 and the port.</li><li>Hold BOOT if the upload cannot connect.</li><li>GPIO = 3.3 V only.</li></ul>` },
    ],
    quiz: [
      { q: 'The computer does not show a COM port. What can you try?', a: ['Press the blue LED', 'Use a data USB cable and install the CP210x / CH340 driver', 'Connect 5 V to GPIO2', 'Remove the antenna'], c: 1, why: 'The cable must carry data, and the USB-to-serial chip needs a driver on some computers.' },
      { q: 'The upload shows “Connecting…” and does not start. What do you do?', a: ['Hold the BOOT button while the dots appear', 'Press the blue LED', 'Disconnect GND', 'Nothing can be done'], c: 0, why: 'Holding BOOT puts the chip into download mode.' },
      { q: 'May you connect a 5 V signal to a GPIO pin?', a: ['Yes, always', 'No — GPIO pins are 3.3 V only', 'Only on GPIO2', 'Only when USB is unplugged'], c: 1, why: 'The ESP32 is a 3.3 V chip; 5 V can damage it.' },
      { q: 'At 3.3 V supply, the chip reads an input as HIGH above about…', a: ['0.8 V', '1.65 V', '2.5 V', '5 V'], c: 2, why: 'Datasheet: V_IH = 0.75 × VDD = 2.475 V.' },
    ],
    sources: [SRC.rnt, SRC.ds],
  },
  // ================================================================== 3
  {
    id: 'e3', num: 3, module: 1, title: 'Hello World: blink the blue LED', level: 'Beginner', time: '12 min',
    goal: 'Run your first sketch: setup() and loop(), and blink the blue LED on GPIO2.',
    hardware: ['ESP32 DevKit V1', 'Micro-USB cable', 'Computer with the Arduino IDE'],
    code: E32_BLINK, file: 'Blink.ino', program: 'e_blink',
    explain: {
      2: '<b>ledPin = 2</b>: the blue LED is wired to GPIO2. On the ESP32 you write the GPIO number.',
      4: '<b>setup()</b> runs <b>once</b> when the board starts or is reset.',
      5: '<b>Serial.begin(115200)</b> starts serial output at 115200 baud. Set the Serial Monitor to the same speed.',
      6: '<b>pinMode(ledPin, OUTPUT)</b>: GPIO2 becomes an output.',
      9: '<b>loop()</b> runs <b>again and again</b>.',
      10: '<b>HIGH</b> puts 3.3 V on GPIO2: the blue LED turns <b>ON</b>.',
      11: '<b>delay(1000)</b> waits 1000 ms = 1 second.',
      12: '<b>LOW</b> puts 0 V on GPIO2: the LED turns <b>OFF</b>.',
      13: 'Wait one more second.',
      14: 'Print a line in the Serial Monitor every time loop() runs.',
    },
    steps: [
      { title: 'Upload with the Arduino IDE', view: 'home', action: 'ensurePower',
        body: `<p>Choose <b>DOIT ESP32 DEVKIT V1</b> and the port, paste the sketch and press <b>Upload</b>. Hold <b>BOOT</b> if the IDE cannot connect (Lesson 2).</p>` },
      { title: 'Where is the LED?', focus: 'ledblue',
        body: `<p>The <b>blue LED</b> is connected to <b>GPIO2</b>. HIGH (3.3 V) = <b>on</b>, LOW (0 V) = <b>off</b>.</p>
        <p class="tip">GPIO2 is also a <b>strapping pin</b>: the chip reads it while it starts. Do not hold it HIGH with an external circuit at start-up.</p>` },
      { title: 'Read the sketch', focus: 'ledblue', showCode: true,
        body: `<p>The classic Blink, with one extra line (<code>Serial</code>) that prints “Hello World”.</p><p class="tip">Click any line to see what it does.</p>` },
      { title: 'Run it', focus: 'ledblue', showCode: true, action: 'run', zoom: 0.6,
        body: `<p>Press <b>▶ Run</b>. The highlighted line, the pin level (3.3 V / 0 V) and the blue LED follow the sketch: 1 second on, 1 second off.</p>` },
      { title: 'Experiment: change the speed', focus: 'ledblue', showCode: true, action: 'speedSlider',
        body: `<p>Use the slider to change both <code>delay()</code> values. Smaller delay = faster blinking.</p>` },
      { title: 'Summary', view: 'home',
        body: `<ul><li><code>setup()</code> runs once, <code>loop()</code> forever.</li><li><code>pinMode</code>, <code>digitalWrite</code>, <code>delay</code>, <code>Serial.println</code>.</li><li>Blue LED = GPIO2, HIGH = on.</li></ul>` },
    ],
    quiz: [
      { q: 'How often does loop() run?', a: ['Once', 'Twice', 'Over and over again', 'Only when a button is pressed'], c: 2, why: 'loop() repeats forever after setup().' },
      { q: 'digitalWrite(2, HIGH) puts about how many volts on GPIO2?', a: ['0 V', '1.8 V', '3.3 V', '5 V'], c: 2, why: 'ESP32 outputs swing between 0 V and 3.3 V.' },
      { q: 'delay(1000) waits for…', a: ['1000 seconds', '1 second', '1 millisecond', '1 microsecond'], c: 1, why: 'delay() takes milliseconds.' },
      { q: 'Which baud rate does this sketch use for the Serial Monitor?', a: ['9600', '115200', '300', '1000000'], c: 1, why: 'The sketch calls Serial.begin(115200).' },
    ],
    sources: [SRC.rnt, SRC.eb, SRC.ds],
  },
  // ================================================================== 4
  {
    id: 'e4', num: 4, module: 1, title: 'Your first circuit: an external LED', level: 'Beginner', time: '15 min',
    goal: 'Use a breadboard, choose a safe resistor for 3.3 V, wire an LED to GPIO16 and blink it.',
    hardware: ['ESP32 DevKit V1', 'Micro-USB cable', 'Breadboard', '5 mm red LED', '220 Ω resistor', '2 × female–male jumper wires'],
    code: E32_EXT_LED, file: 'ExternalLed.ino', program: 'e_extled',
    circuit: LED_CIRCUIT, io: { G16: IO_LED }, scopePin: 'G16',
    explain: {
      2: '<b>ledPin = 16</b>: GPIO16 drives the LED. It is a free general-purpose pin (not input-only, not a strapping pin).',
      4: '<b>setup()</b> runs once.',
      5: '<b>pinMode(ledPin, OUTPUT)</b>: GPIO16 will drive the LED.',
      8: '<b>loop()</b> repeats forever.',
      9: '<b>HIGH</b> puts 3.3 V on GPIO16. The LED is fed through the resistor and its cathode goes to GND: HIGH = ON.',
      10: 'Wait 1 second.',
      11: '<b>LOW</b> puts 0 V → no voltage across the LED → OFF.',
      12: 'Wait 1 second, then loop() starts again.',
    },
    steps: [
      { title: 'Parts for this circuit', view: 'bench', have: [],
        body: `<ul><li><b>Breadboard</b></li><li><b>5 mm red LED</b></li><li><b>220 Ω resistor</b> (red-red-brown-gold)</li><li><b>2 female–male jumper wires</b>: yellow for the signal, black for ground</li></ul>
        <p class="sim">Here the board’s pins point <b>up</b>, so we can see them and put a jumper wire’s female end on each pin. Many boards come with the pins pointing <b>down</b>: then you plug the board straight into the breadboard.</p>` },
      { title: 'Safety first: unplug while wiring', view: 'bench', power: false,
        body: `<p>Disconnect power while you build or change a circuit.</p>` },
      { title: 'Step 1 — insert the resistor', view: 'breadboard', have: ['r1'], holes: ['c10', 'c14'],
        body: `<p>Put the <b>220 Ω resistor</b> into <b>c10</b> and <b>c14</b>.</p>
        <p><b>Why 220 Ω?</b> A GPIO gives <b>3.3 V</b> and a red LED drops about 2.0 V, so the resistor sees ≈1.3 V:</p>
        <p class="formula">I = (3.3 V − 2.0 V) ÷ 220 Ω ≈ <b>5.9 mA</b></p>
        <p>That lights a red LED clearly and is far below what a pin can give. (A 5 V board would push about 13.6 mA through the same resistor.)</p>` },
      { title: 'Step 2 — insert the LED', view: 'breadboard', have: ['r1', 'led1'], holes: ['d14 · anode (+)', 'd15 · cathode (−)'],
        body: `<ul><li><b>Long leg = anode (+)</b> → <b>d14</b></li><li><b>Short leg = cathode (−)</b> → <b>d15</b></li></ul><p class="warn">An LED only conducts one way. Reversed, it stays dark.</p>` },
      { title: 'Step 3 — wire GPIO16 to the resistor', view: 'bench', pins: ['G16'], have: ['r1', 'led1', 'w1'],
        body: `<p>Yellow jumper: the pin printed <b>RX2</b> (it is <b>GPIO16</b>) on the <b>right row</b> → hole <b>a10</b>.</p>` },
      { title: 'Step 4 — wire the LED to GND', view: 'bench', pins: ['GND2'], have: LED_IDS,
        body: `<p>Black jumper: hole <b>a15</b> → <b>GND</b> on the right row (next to 3V3). The circuit is complete.</p>` },
      { title: 'Check the current path', view: 'bench', trace: LED_IDS, pins: ['G16', 'GND2'],
        body: `<p class="path">GPIO16 → yellow wire → a10 → <b>column 10</b> → resistor → <b>column 14</b> → LED anode → LED cathode → <b>column 15</b> → a15 → black wire → <b>GND</b></p>` },
      { title: 'The code', view: 'bench', showCode: true,
        body: `<p>Same idea as Blink, only the pin changes.</p>` },
      { title: 'Run it', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Press <b>▶ Run</b>: the LED on the breadboard blinks. Watch the pin level change between 3.3 V and 0 V.</p>` },
      { title: 'Summary', view: 'bench',
        body: `<ul><li>GPIO = 3.3 V; resistor ≈ (3.3 − 2.0) ÷ 0.22 kΩ ≈ 5.9 mA for a red LED.</li><li>Anode (long leg) toward the pin, cathode to GND.</li><li>RX2 on the board is GPIO16.</li></ul>` },
    ],
    quiz: [
      { q: 'A red LED (about 2.0 V) with a 220 Ω resistor on a 3.3 V pin carries about…', a: ['0.6 mA', '5.9 mA', '15 mA', '60 mA'], c: 1, why: '(3.3 − 2.0) ÷ 220 ≈ 5.9 mA.' },
      { q: 'Which LED leg goes toward the GPIO pin side (through the resistor)?', a: ['The short leg', 'The long leg (anode)', 'Either', 'Neither'], c: 1, why: 'Current flows from anode (long leg) to cathode (short leg).' },
      { q: 'Why unplug the board while wiring?', a: ['To save the LED', 'A wrong touch on a live board can short a pin', 'To reset the Wi-Fi', 'No reason'], c: 1, why: 'Never change wiring on a powered board.' },
    ],
    sources: [SRC.ds, SRC.rntpin],
  },
  // ================================================================== 5
  {
    id: 'e5', num: 5, module: 2, title: 'Read a push button (digital input)', level: 'Beginner', time: '15 min',
    goal: 'Read a button with digitalRead() and INPUT_PULLUP, and switch the LED with it.',
    hardware: ['Lesson 4 LED circuit (LED on GPIO16)', 'Push button', '2 × female–male jumper wires'],
    code: E32_BUTTON, file: 'Button.ino', program: 'e_button', widgets: ['button'],
    circuit: [...LED_CIRCUIT, ...BUTTON_PARTS], io: { G16: IO_LED, G17: { kind: 'button', item: 'btn1', needs: BUTTON_IDS } },
    explain: {
      2: 'The button is read on <b>GPIO17</b> (printed TX2).',
      3: 'The LED from Lesson 4 on GPIO16.',
      6: 'Serial output on (115200).',
      7: '<b>INPUT_PULLUP</b> turns on the chip’s internal pull-up resistor (about 45 kΩ, datasheet). The pin reads <b>HIGH</b> when the button is open, <b>LOW</b> when it connects the pin to GND.',
      8: 'GPIO16 drives the LED.',
      11: '<b>loop()</b> repeats forever.',
      12: '<b>digitalRead</b> returns HIGH or LOW. With a pull-up, pressed = <b>LOW</b>.',
      13: 'Pressed?',
      14: 'Pressed → LED on.',
      15: 'Print the state.',
      17: 'Released → LED off.',
      20: 'Check 5 times per second.',
    },
    steps: [
      { title: 'What you need', view: 'bench', have: LED_IDS,
        body: `<p>Keep the LED circuit from Lesson 4. Add a <b>push button</b> and <b>2 jumpers</b>: blue (GPIO17) and black (GND).</p>` },
      { title: 'Why a pull-up?', view: 'bench',
        body: `<p>An input pin that is connected to nothing <b>floats</b>: it reads random HIGH and LOW. A <b>pull-up resistor</b> gently pulls the pin up to 3.3 V. Pressing the button connects the pin to GND and wins over the weak pull-up.</p>
        <table class="kv"><tr><th>Button</th><th>GPIO17 reads</th></tr><tr><td>released</td><td>HIGH (pulled up)</td></tr><tr><td>pressed</td><td>LOW (connected to GND)</td></tr></table>
        <p class="tip">GPIO34–39 have <b>no</b> internal pull-up, so they would need an external resistor. GPIO17 does.</p>` },
      { title: 'Step 1 — insert the button', view: 'breadboard', power: false, have: [...LED_IDS, 'btn1'], holes: ['e20', 'f20', 'e22', 'f22'],
        body: `<p>Press the button across the centre gap: legs in <b>e20, f20, e22, f22</b>.</p>` },
      { title: 'Step 2 — wire GPIO17 and GND', view: 'bench', have: [...LED_IDS, ...BUTTON_IDS], pins: ['G17', 'GND1'],
        body: `<ul><li>Blue: pin <b>TX2</b> (GPIO17, right row) → <b>a20</b></li><li>Black: <b>GND</b> (left row) → <b>j22</b></li></ul>` },
      { title: 'The code', view: 'bench', showCode: true,
        body: `<p>Read the button; if it is <b>LOW</b> (pressed), switch the LED on.</p>` },
      { title: 'Run it & press the button', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Use <b>Hold to press</b> in the panel (or click and hold the button in 3D). The pin reads LOW and the LED turns on.</p>` },
      { title: 'Summary', view: 'bench',
        body: `<ul><li><code>INPUT_PULLUP</code>: released = HIGH, pressed = LOW.</li><li>Internal pull-up ≈ 45 kΩ on most GPIOs; none on GPIO34–39.</li></ul>` },
    ],
    quiz: [
      { q: 'With INPUT_PULLUP, a pressed button reads…', a: ['HIGH', 'LOW', 'Random', '3.3 V on the other side'], c: 1, why: 'The button connects the pin to GND: LOW.' },
      { q: 'Which pins have no internal pull-up?', a: ['GPIO16, 17', 'GPIO34–39', 'GPIO2', 'All pins'], c: 1, why: 'GPIO34–39 are input only and have no internal pull-up or pull-down.' },
      { q: 'What happens to an input that is connected to nothing?', a: ['It reads LOW', 'It floats and may read anything', 'It reads HIGH', 'The board resets'], c: 1, why: 'A floating input picks up noise.' },
    ],
    sources: [SRC.pinmode, SRC.ds, SRC.rntpin],
  },
  // ================================================================== 6
  {
    id: 'e6', num: 6, module: 2, title: 'Read a potentiometer (12-bit analog input)', level: 'Beginner', time: '15 min',
    goal: 'Turn a voltage into a number with analogRead() on an input-only ADC1 pin.',
    hardware: ['ESP32 DevKit V1', 'Breadboard', '10 kΩ potentiometer', '3 × female–male jumper wires'],
    code: E32_POT, file: 'AnalogReadSerial.ino', program: 'e_pot', widgets: ['knob'],
    circuit: POT_PARTS, io: { G34: { kind: 'pot', item: 'pot1', needs: POT_IDS } },
    explain: {
      2: '<b>potPin = 34</b>: GPIO34 is an <b>input-only</b> pin on ADC1. That is perfect for an analog sensor.',
      4: '<b>setup()</b> runs once.',
      5: 'Serial output on (115200).',
      8: '<b>loop()</b> repeats forever.',
      9: '<b>analogRead(34)</b> measures the voltage on GPIO34: <b>0 … 4095</b> (12-bit, the default of the ESP32 Arduino core). 0 V → about 0, 3.3 V → about 4095.',
      10: 'Print the number.',
      11: 'Wait 100 ms → about 10 readings per second.',
    },
    steps: [
      { title: 'What you need', view: 'bench', have: [],
        body: `<p>A <b>10 kΩ potentiometer</b> and <b>3 jumpers</b>: red (3V3), green (GPIO34), black (GND).</p>` },
      { title: 'How a potentiometer works', view: 'breadboard',
        body: `<div class="ptree"><div class="pt-row"><span class="pt bus">3V3 — left leg</span></div><div class="pt-arrow">│ resistive track (10 kΩ)</div><div class="pt-row"><span class="pt">middle leg = wiper → GPIO34</span></div><div class="pt-arrow">│</div><div class="pt-row"><span class="pt">GND — right leg</span></div></div>
        <p>Turning the knob slides the wiper, so the wiper voltage goes smoothly from <b>0 V</b> to <b>3.3 V</b>: a <b>voltage divider</b>.</p>` },
      { title: 'The 12-bit ADC', view: 'bench', pins: ['G34'],
        body: `<p>The ESP32 has two <b>12-bit</b> ADCs: <code>analogRead()</code> returns <b>0 … 4095</b> (Arduino-ESP32 documentation).</p>
        <p class="formula">value ≈ V ÷ 3.3 V × 4095</p>
        <ul><li>0 V → 0, 1.65 V → ≈2048, 3.3 V → ≈4095 <i>(ideal)</i>.</li><li><b>Not perfectly linear:</b> Espressif lists about <b>150 – 3100 mV</b> as the well-behaved range at the default setting, and says accuracy gets worse near the top (above about 2.45 V). The datasheet gives ±7 LSB (DNL) and ±12 LSB (INL).</li></ul>
        <p class="tip">The simulation uses the ideal formula. A real board reads a little differently near 0 V and 3.3 V.</p>` },
      { title: 'ADC1 or ADC2?', view: 'bench', pins: ['G34', 'G4', 'G2'],
        body: `<p>The ESP32 has two ADCs. <b>ADC1</b> pins: GPIO32–39. <b>ADC2</b> pins: GPIO0, 2, 4, 12–15, 25–27.</p>
        <p class="warn"><b>ADC2 is also used by Wi-Fi</b> (ESP-IDF documentation). Once Wi-Fi is on, <code>analogRead()</code> on an ADC2 pin does not work. Use ADC1 pins for analog sensors in Wi-Fi projects.</p>
        <p>GPIO34 is on ADC1 and is input-only: it cannot drive an LED, but it never conflicts with Wi-Fi.</p>` },
      { title: 'Step 1 — insert the potentiometer', view: 'breadboard', power: false, have: ['pot1'], holes: ['e24', 'e26 · wiper', 'e28'],
        body: `<p>Legs in <b>e24</b>, <b>e26</b> (wiper) and <b>e28</b>.</p>` },
      { title: 'Step 2 — wire 3V3, GPIO34 and GND', view: 'bench', have: POT_IDS, pins: ['3V3', 'G34', 'GND2'],
        body: `<ul><li>Red: <b>3V3</b> (right row) → <b>a24</b></li><li>Green: <b>D34</b> (left row, GPIO34) → <b>a26</b> (wiper)</li><li>Black: <b>GND</b> (right row) → <b>a28</b></li></ul>
        <p class="warn">Feed the potentiometer from <b>3V3</b>, never from VIN (5 V).</p>` },
      { title: 'The code', view: 'bench', showCode: true,
        body: `<p>The classic <b>AnalogReadSerial</b> pattern.</p>` },
      { title: 'Run it & turn the knob', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p><b>Drag the knob</b> in the 3D view (or use the knob slider). The numbers follow the wiper voltage.</p><p class="sim">Simulated ideal ADC with a little noise.</p>` },
      { title: 'Summary', view: 'bench',
        body: `<ul><li><code>analogRead()</code> → 0–4095 (12-bit) for about 0–3.3 V.</li><li>Use ADC1 pins (GPIO32–39) with Wi-Fi.</li><li>GPIO34–39 are input only.</li></ul>` },
    ],
    quiz: [
      { q: 'analogRead() on the ESP32 returns values from…', a: ['0 to 255', '0 to 1023', '0 to 4095', '0 to 16383'], c: 2, why: 'The default ADC resolution is 12 bits.' },
      { q: 'The wiper is at 1.65 V. The reading is about…', a: ['512', '1024', '2048', '4095'], c: 2, why: '1.65 / 3.3 × 4095 ≈ 2048.' },
      { q: 'Why use an ADC1 pin for an analog sensor in a Wi-Fi project?', a: ['ADC1 is faster', 'ADC2 is also used by Wi-Fi and cannot be read while Wi-Fi is on', 'ADC1 uses 5 V', 'No reason'], c: 1, why: 'ESP-IDF: ADC2 is also used by Wi-Fi.' },
      { q: 'Which can you NOT do with GPIO34?', a: ['analogRead()', 'digitalRead()', 'digitalWrite() to an LED', 'Use it with Wi-Fi on'], c: 2, why: 'GPIO34–39 are input only.' },
    ],
    sources: [SRC.adc, SRC.idf, SRC.ds, SRC.rntpin],
  },
  // ================================================================== 7
  {
    id: 'e7', num: 7, module: 2, title: 'Fade an LED with LEDC PWM', level: 'Beginner', time: '12 min',
    goal: 'Understand PWM and duty cycle, and use ledcAttach() and ledcWrite() to dim an LED.',
    hardware: ['Lesson 4 circuit (LED on GPIO16)'],
    code: E32_FADE, file: 'Fade.ino', program: 'e_fade', fast: true,
    circuit: LED_CIRCUIT, io: { G16: IO_LED },
    explain: {
      2: '<b>16</b>: any output-capable GPIO can be used for PWM on the ESP32.',
      3: 'Brightness value 0 … 255, because we use 8-bit resolution.',
      4: 'Step size per loop.',
      7: '<b>ledcAttach(pin, freq, resolution)</b> connects the pin to a PWM channel of the LEDC peripheral: <b>5000 Hz</b>, <b>8 bits</b> (0 … 255). (Arduino-ESP32 core 3.x.)',
      11: '<b>ledcWrite(pin, duty)</b> sets the duty cycle: duty ÷ 255.',
      12: 'Increase (or decrease) the brightness.',
      13: 'At either end (0 or 255)…',
      14: '…reverse direction.',
      16: 'Wait 30 ms per step → one fade from 0 to 255 takes about 1.5 s.',
    },
    steps: [
      { title: 'Back to the LED circuit', view: 'bench', have: LED_IDS,
        body: `<p>We reuse the <b>LED on GPIO16</b>. This time it will <b>dim and brighten</b>.</p>` },
      { title: 'What is PWM?', view: 'bench',
        body: `<p>A digital pin is either <b>HIGH (3.3 V)</b> or <b>LOW (0 V)</b>. <b>PWM</b> switches it on and off very fast. The <b>duty cycle</b> is the share of time it is HIGH; the average voltage ≈ duty × 3.3 V. The switching is too fast to see, so the LED looks dimmer or brighter.</p>` },
      { title: 'PWM on the ESP32: LEDC', view: 'bench', pins: ['G16'],
        body: `<ul><li>The ESP32 has a dedicated PWM peripheral called <b>LEDC</b>. Unlike the UNO R3, <b>almost any output pin</b> can carry PWM; only the input-only pins GPIO34–39 cannot.</li>
        <li><code>ledcAttach(pin, frequency, resolution)</code> sets it up; <code>ledcWrite(pin, duty)</code> changes the brightness (Arduino-ESP32 core <b>3.x</b>).</li>
        <li>With 8 bits the duty goes from <b>0</b> (always off) to <b>255</b> (always on).</li></ul>
        <p class="warn">Older Arduino-ESP32 versions (2.x) used <code>ledcSetup()</code> and <code>ledcAttachPin()</code> instead. This course uses core 3.x, as in the Random Nerd Tutorials guide.</p>` },
      { title: 'The code', view: 'bench', showCode: true,
        body: `<p>Brightness goes 0 → 255 → 0 in steps of 5, one step every 30 ms.</p>` },
      { title: 'Run it', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Watch the LED fade up and down.</p>` },
      { title: 'Summary', view: 'bench',
        body: `<ul><li>PWM = fast on/off; the duty cycle sets the average.</li><li>ESP32: any output pin works; <code>ledcAttach()</code> + <code>ledcWrite()</code> (core 3.x).</li></ul>` },
    ],
    quiz: [
      { q: 'Which pins can NOT output PWM on the ESP32?', a: ['GPIO16', 'GPIO34–39 (input only)', 'GPIO2', 'GPIO23'], c: 1, why: 'Input-only pins cannot be outputs.' },
      { q: 'ledcWrite(pin, 255) with 8-bit resolution means…', a: ['Always off', 'About 50 %', 'Always on', 'An error'], c: 2, why: '255 is the maximum 8-bit duty: 100 %.' },
      { q: 'At 50 % duty, the average voltage on a 3.3 V pin is about…', a: ['0 V', '1.65 V', '3.3 V', '5 V'], c: 1, why: '0.5 × 3.3 V = 1.65 V.' },
    ],
    sources: [SRC.ledc, SRC.ds],
  },
];

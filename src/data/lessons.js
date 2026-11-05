// Lessons — ordered from the very basics upward.
// Facts: Arduino UNO Q datasheet (DS), UNO Q user manual (UM), full pinout (PIN), ST STM32U585 datasheet (ST),
// Arduino Zephyr core source (CORE) for API defaults. Code listings live in data/code.js.
import { BLINK, EXT_LED, BUTTON, POT, FADE, DIMMER, BUZZER, NIGHT_LIGHT, TMP36_CODE, ULTRASONIC, PIR_CODE } from './code.js';

const SRC = {
  ds: { t: 'Arduino UNO Q datasheet (ABX00162-ABX00173)', u: 'https://docs.arduino.cc/hardware/uno-q/' },
  um: { t: 'Arduino UNO Q user manual', u: 'https://docs.arduino.cc/tutorials/uno-q/user-manual/' },
  pin: { t: 'Arduino UNO Q full pinout', u: 'https://docs.arduino.cc/resources/pinouts/ABX00162-full-pinout.pdf' },
  st: { t: 'STMicroelectronics STM32U585 datasheet', u: 'https://www.st.com/resource/en/datasheet/stm32u585ai.pdf' },
  lab: { t: 'Arduino App Lab', u: 'https://docs.arduino.cc/software/app-lab/' },
  core: { t: 'Arduino Zephyr core for UNO Q (ArduinoCore-zephyr, source code)', u: 'https://github.com/arduino/ArduinoCore-zephyr' },
  ldr: { t: 'GL55 series photoresistor datasheet (GL5528)', u: 'https://www.electrokit.com/upload/quick/5b/ec/0d3b_41036350-tds.pdf' },
  tmp36: { t: 'Analog Devices TMP35/TMP36/TMP37 datasheet, Rev. F', u: 'https://www.analog.com/media/en/technical-documentation/data-sheets/TMP35_36_37.pdf' },
  hcsr04: { t: 'Elecfreaks HC-SR04 ultrasonic ranging module datasheet', u: 'https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf' },
  prahari: { t: 'Reading HC-SR04 on Arduino UNO Q: pulseIn on Zephyr (published UNO Q readings)', u: 'https://prahari.net/giving-my-robot-its-first-sense-hc-sr04-ultrasonic-on-arduino-uno-q' },
  sr501: { t: 'HC-SR501 PIR motion detector datasheet (manufacturer, 2013)', u: 'https://courses.ece.cornell.edu/ece5990/ECE5725_Spring2020_Projects/May_15_Demo/Smart%20Lock/W_pp445_yl656/datasheet/31227sc.pdf' },
  sr501guide: { t: 'Handson Technology: HC-SR501 PIR user guide', u: 'https://handsontec.com/dataspecs/sensor/PIR%20SR501%20Motion%20Sensor.pdf' },
  dhtforum: { t: 'Arduino Forum: “DHT11 and UNO Q”', u: 'https://forum.arduino.cc/t/dht11-and-uno-q/1416409' },
};

// ------------------------------------------------------------------ breadboard circuits (holes: a–j, columns 1–30)
export const LED_CIRCUIT = [
  { id: 'r1', type: 'resistor', a: 'c10', b: 'c14' },
  { id: 'led1', type: 'led', anode: 'd14', cathode: 'd15' },
  { id: 'w1', type: 'wire', from: 'D5', to: 'a10', color: 'yellow', lift: 12 },
  { id: 'w2', type: 'wire', from: 'a15', to: 'GND2', color: 'black', lift: 9 },
];
const LED_IDS = LED_CIRCUIT.map(d => d.id);
const BUTTON_PARTS = [
  { id: 'btn1', type: 'button', col: 20 },
  { id: 'w3', type: 'wire', from: 'D4', to: 'a20', color: 'blue', lift: 12 },
  { id: 'w4', type: 'wire', from: 'j22', to: 'GND3', color: 'black', lift: 14 },
];
const BUTTON_IDS = BUTTON_PARTS.map(d => d.id);
const POT_PARTS = [
  { id: 'pot1', type: 'pot', row: 'e', col: 24 },
  { id: 'w5', type: 'wire', from: '3V3', to: 'a24', color: 'red', lift: 8 },
  { id: 'w6', type: 'wire', from: 'A0', to: 'a26', color: 'green', lift: 11 },
  { id: 'w7', type: 'wire', from: 'GND3', to: 'a28', color: 'black', lift: 15 },
];
const POT_IDS = POT_PARTS.map(d => d.id);
const BUZZER_PARTS = [
  { id: 'r2', type: 'resistor', a: 'c19', b: 'c23' },
  { id: 'bz1', type: 'buzzer', plus: 'e23', minus: 'e26' },
  { id: 'w8', type: 'wire', from: 'D9', to: 'a19', color: 'orange', lift: 12 },
  { id: 'w9', type: 'wire', from: 'a26', to: 'GND3', color: 'black', lift: 9 },
];
const BUZZER_IDS = BUZZER_PARTS.map(d => d.id);
const LDR_PARTS = [
  { id: 'ldr1', type: 'ldr', a: 'e22', b: 'e23' },
  { id: 'r3', type: 'resistor', a: 'c23', b: 'c27', bands: ['brown', 'black', 'orange', 'gold'], hw: 'resistor10k' },
  { id: 'w10', type: 'wire', from: '3V3', to: 'a22', color: 'red', lift: 9 },
  { id: 'w11', type: 'wire', from: 'A0', to: 'a23', color: 'green', lift: 12 },
  { id: 'w12', type: 'wire', from: 'a27', to: 'GND3', color: 'black', lift: 15 },
];
const LDR_IDS = LDR_PARTS.map(d => d.id);
const TMP_PARTS = [
  { id: 't1', type: 'tmp36', row: 'e', col: 18 },
  { id: 'w13', type: 'wire', from: '3V3', to: 'a18', color: 'red', lift: 9 },
  { id: 'w14', type: 'wire', from: 'A0', to: 'a19', color: 'green', lift: 12 },
  { id: 'w15', type: 'wire', from: 'a20', to: 'GND3', color: 'black', lift: 15 },
];
const TMP_IDS = TMP_PARTS.map(d => d.id);
const US_PARTS = [
  { id: 'us1', type: 'hcsr04', row: 'j', col: 11 },
  { id: 'w16', type: 'wire', from: '5V', to: 'f11', color: 'red', lift: 10 },
  { id: 'w17', type: 'wire', from: 'D7', to: 'f12', color: 'yellow', lift: 14 },
  { id: 'w18', type: 'wire', from: 'D8', to: 'f13', color: 'blue', lift: 18 },
  { id: 'w19', type: 'wire', from: 'f14', to: 'GND3', color: 'black', lift: 12 },
];
const US_IDS = US_PARTS.map(d => d.id);
const PIR_PARTS = [
  { id: 'pir1', type: 'pir', x: 84, z: 34 },
  { id: 'w20', type: 'fwire', from: 'pir1.GND', to: 'GND3', color: 'black', lift: 24 },
  { id: 'w21', type: 'fwire', from: 'pir1.OUT', to: 'D2', color: 'yellow', lift: 44 },
  { id: 'w22', type: 'fwire', from: 'pir1.VCC', to: '5V', color: 'red', lift: 18 },
];
const PIR_IDS = PIR_PARTS.map(d => d.id);
const IO_LED = { kind: 'led', item: 'led1', needs: LED_IDS };

const BLINK_CODE = BLINK;

const BLINK_EXPLAIN = {
  1: '<b>setup()</b> runs once, right after the sketch starts on the STM32U585.',
  2: '<b>Serial.begin(9600)</b> starts serial output. On UNO Q (board platform 0.55.0 or newer) <code>Serial</code> prints into the Arduino App Lab Console / Serial Monitor.',
  4: '<b>pinMode(LED_BUILTIN, OUTPUT)</b> makes the built-in LED pin an output. LED_BUILTIN drives the red segment of RGB LED 3.',
  8: '<b>loop()</b> repeats forever after setup() finishes.',
  9: '<b>digitalWrite(..., HIGH)</b> sets the pin to 3.3 V. The UNO Q RGB LEDs are <b>active-low</b>, so HIGH turns the red LED <b>OFF</b>.',
  10: '<b>delay(1000)</b> waits 1000 ms = 1 second.',
  11: '<b>digitalWrite(..., LOW)</b> sets the pin to 0 V → current flows → the red LED turns <b>ON</b>.',
  12: 'Wait one more second.',
  14: '<b>Serial.println("Hello World")</b> prints a line every time loop() runs (every 2 seconds).',
};

const EXT_LED_CODE = EXT_LED;

const EXT_LED_EXPLAIN = {
  2: '<b>int ledPin = D5;</b> stores the pin name in a variable, so it is easy to change later (same style as the user-manual example).',
  4: '<b>setup()</b> runs once.',
  5: '<b>pinMode(ledPin, OUTPUT)</b> — D5 (MCU pin PA11) will drive the LED.',
  8: '<b>loop()</b> repeats forever.',
  9: '<b>HIGH</b> puts 3.3 V on D5. The LED anode is fed through the resistor and the cathode goes to GND, so this LED is <b>active-high</b>: HIGH = ON.',
  10: 'Wait 1 second.',
  11: '<b>LOW</b> puts 0 V on D5 → no voltage across the LED → OFF.',
  12: 'Wait 1 second, then loop() starts again.',
};

export const LESSONS = [
  // ================================================================== 1
  {
    id: 'l1', num: 1, module: 1, title: 'Meet the Arduino UNO Q', level: 'Start here', time: '10 min',
    goal: 'Recognise every important part of the board and know what it does.',
    hardware: ['Arduino UNO Q'],
    steps: [
      {
        title: 'Welcome to the UNO Q', view: 'home',
        body: `<p>The <b>Arduino UNO Q</b> is a <b>single-board computer</b> in the classic UNO size: <b>68.58 mm × 53.34 mm</b>.</p>
        <p>Its special feature: it has <b>two “brains”</b> on one board —</p>
        <ul><li>a <b>microprocessor (MPU)</b> that runs a full <b>Debian Linux</b> computer, and</li>
        <li>a <b>microcontroller (MCU)</b> that runs your <b>Arduino sketch</b> with precise, real-time timing.</li></ul>
        <p>Two versions exist: <b>ABX00162</b> (2 GB RAM, 16 GB storage) and <b>ABX00173</b> (4 GB RAM, 32 GB storage).</p>
        <p class="tip">Drag to rotate 360°, scroll to zoom, right-drag to move. Press <b>Next</b> to start the tour.</p>`,
      },
      {
        title: 'Brain 1 — the MPU: Qualcomm QRB2210', focus: 'soc',
        body: `<p>The big chip marked <b>Qualcomm QRB2210</b> is the <b>application processor</b>.</p>
        <ul><li><b>4 × Arm Cortex-A53</b> cores at <b>2.0 GHz</b> (64-bit)</li>
        <li><b>Adreno 702</b> GPU for graphics and video</li>
        <li>Runs <b>Debian Linux</b>, Python® programs and AI models</li></ul>
        <p>Think of it as the <b>“computer” half</b>: networking, camera, video, files, apps.</p>
        <p class="warn">Its own GPIO pins work at <b>1.8 V</b>.</p>`,
      },
      {
        title: 'Brain 2 — the MCU: STM32U585', focus: 'mcu', side: 'bottom',
        body: `<p>Turn the board over: on the <b>bottom side</b> sits the <b>STM32U585</b> microcontroller.</p>
        <ul><li><b>Arm Cortex-M33</b> up to <b>160 MHz</b></li>
        <li><b>2 MB</b> flash, <b>786 kB</b> SRAM</li>
        <li>Runs your sketch on the <b>Arduino Core over Zephyr OS</b></li></ul>
        <p>This is the <b>“Arduino” half</b>: it controls the 3.3 V header pins, PWM, ADC, the LED matrix and two RGB LEDs, with fast and exact timing.</p>`,
      },
      {
        title: 'How the two brains talk: Bridge', focus: 'soc',
        body: `<p>The MPU and the MCU exchange data through <b>Bridge</b>, Arduino’s <b>RPC (Remote Procedure Call)</b> library.</p>
        <p>One side can <b>call a function</b> that lives on the other side, e.g. a Python program on Linux can call a function in your sketch to switch an LED.</p>
        <p>In <b>Arduino App Lab</b> one project (“App”) can contain:</p>
        <ul><li>a <b>Python</b> program → runs on Linux (QRB2210)</li>
        <li>an <b>Arduino sketch</b> → runs on the MCU (STM32U585)</li>
        <li>optional <b>Bricks</b> → ready-made services such as AI models or web UIs (on Linux)</li></ul>`,
      },
      {
        title: 'Memory: RAM and storage', focus: 'dram',
        body: `<p>Next to the processor is the <b>LPDDR4X RAM</b> chip — the working memory: <b>2 GB</b> or <b>4 GB</b>.</p>
        <p>On the bottom side, the <b>eMMC</b> chip stores Linux, your Apps and data: <b>16 GB</b> or <b>32 GB</b>.</p>
        <p>The MCU has its own small memory inside: 2 MB flash for the sketch and 786 kB SRAM.</p>`,
      },
      {
        title: 'Power management: PM4125', focus: 'pmic',
        body: `<p>The <b>Qualcomm PM4125</b> is the processor’s <b>power-management IC</b>.</p>
        <p>It is fed from the 5 V system bus and generates the <b>1.8 V</b> rail used by the processor I/O, the video bridge, the Wi-Fi logic and level shifters.</p>
        <p>Separate step-down (buck) regulators create the <b>3.3 V</b> rail for the MCU and the header pins. You will learn the full power path in Lesson 2.</p>`,
      },
      {
        title: 'Wireless: Wi-Fi® 5 and Bluetooth® 5.1', focus: 'wifi',
        body: `<p>The module with the silver shield is the <b>WCBN3536A</b> (Qualcomm WCN3980 inside).</p>
        <ul><li><b>Wi-Fi 5</b> (802.11a/b/g/n/ac), dual-band <b>2.4 GHz + 5 GHz</b></li>
        <li><b>Bluetooth 5.1</b></li></ul>
        <p>Wi-Fi and Bluetooth share a <b>PCB antenna</b> — the copper-free corner next to the module.</p>`,
      },
      {
        title: 'USB-C: power, data and video', focus: 'usbc',
        body: `<p>The <b>USB-C</b> connector does three jobs:</p>
        <ul><li><b>Power</b>: 5 V / 3 A</li><li><b>Data</b>: USB 3.1 Gen 1 (5 Gb/s)</li>
        <li><b>Video</b>: DisplayPort through the <b>ANX7625</b> bridge chip right next to it</li></ul>
        <p>With a USB-C dongle you can attach a monitor, keyboard, mouse and camera and use the UNO Q as a small desktop computer (“single-board computer mode”).</p>`,
      },
      {
        title: 'The classic UNO headers', focus: ['jdigital', 'janalog'],
        body: `<p>The two long black headers are the familiar <b>UNO-style</b> connectors, so UNO shields fit.</p>
        <ul><li><b>JDIGITAL</b> (top edge): D0–D13, GND, AREF, SDA, SCL</li>
        <li><b>JANALOG</b> (bottom edge): BOOT, IOREF, RESET, 3V3, 5V, GND, GND, VIN and A0–A5</li></ul>
        <p class="warn">Important difference from the classic UNO R3: the UNO Q pins use <b>3.3 V logic</b>. A HIGH output is 3.3 V, not 5 V.</p>
        <p class="tip">Click any single pin on these headers to see its MCU pin, functions and limits.</p>`,
      },
      {
        title: 'More connectors: JSPI, Qwiic and JCTL', focus: ['jspi', 'qwiic', 'jctl'],
        body: `<ul><li><b>JSPI</b> (2 × 3 pins, right edge): SPI bus + RESET, 5 V and GND</li>
        <li><b>Qwiic</b> (white 4-pin plug): plug-and-play <b>I²C</b> for Qwiic sensors and Modulino® nodes — <b>3.3 V only</b></li>
        <li><b>JCTL</b> (2 × 5 pins, near the USB-C): Linux debug console and boot/reset lines</li></ul>
        <p class="warn">JCTL is <b>1.8 V</b> logic. It is for system debugging, not for your projects.</p>`,
      },
      {
        title: 'Built-in lights', focus: ['matrix', 'rgb1', 'rgb2', 'rgb3', 'rgb4', 'pwrled'],
        body: `<ul><li><b>LED matrix</b>: 8 × 13 = <b>104 blue LEDs</b> controlled by the MCU</li>
        <li><b>4 RGB LEDs</b> (top right): <b>1 and 2</b> are controlled by Linux (“QRB”), <b>3 and 4</b> by the MCU (“STM”)</li>
        <li><b>Green power LED</b> (“ON”): lights whenever the board has power</li></ul>
        <p>The RGB LEDs are <b>active-low</b>: they turn on when their pin is driven to logic 0.</p>`,
      },
      {
        title: 'The power button', focus: 'pwrbtn',
        body: `<p>Top-left corner: the <b>power button</b>.</p>
        <p>Hold it for <b>5 seconds or more</b> to <b>reboot Linux</b>. It does <b>not</b> cut the power.</p>
        <p>You never need it to start the board — the UNO Q boots by itself when power is connected.</p>`,
      },
      {
        title: 'Bottom side: high-speed connectors', focus: ['jmisc', 'jmedia'], side: 'bottom',
        body: `<p>Two 60-pin connectors on the bottom connect the UNO Q to <b>carrier boards</b>:</p>
        <ul><li><b>JMEDIA</b>: MIPI cameras and a MIPI display (1.8 V)</li>
        <li><b>JMISC</b>: extra MCU signals, audio and power rails (mixed 1.8 V / 3.3 V)</li></ul>
        <p>Each is a 2 × 30-pin connector, made for UNO Q carrier boards. The UNO-style headers on top are for prototyping and UNO shields.</p>`,
      },
      {
        title: 'Tour complete!', view: 'home',
        body: `<p>You now know the main parts of the UNO Q:</p>
        <ul><li>MPU <b>QRB2210</b> (Linux) + MCU <b>STM32U585</b> (sketch), linked by <b>Bridge</b></li>
        <li>RAM + eMMC, power chip, Wi-Fi/Bluetooth module, USB-C</li>
        <li>UNO headers (3.3 V), JSPI, Qwiic, JCTL (1.8 V), bottom connectors</li>
        <li>LED matrix, 4 RGB LEDs, power LED, power button</li></ul>
        <p class="tip">Switch to <b>Explore the board</b> any time to click parts freely. Then take the quiz below.</p>`,
      },
    ],
    quiz: [
      { q: 'Which chip runs your Arduino sketch?', a: ['Qualcomm QRB2210', 'STM32U585', 'PM4125', 'WCBN3536A'], c: 1, why: 'The STM32U585 microcontroller runs the sketch on the Arduino Core over Zephyr OS.' },
      { q: 'Which operating system runs on the QRB2210?', a: ['Windows', 'Zephyr OS', 'Debian Linux', 'No operating system'], c: 2, why: 'The QRB2210 MPU runs Debian Linux.' },
      { q: 'What logic level do the UNO-style header pins (JDIGITAL/JANALOG) use?', a: ['1.8 V', '3.3 V', '5 V', '12 V'], c: 1, why: 'The headers are driven by the STM32U585 at 3.3 V logic.' },
      { q: 'How do the MPU and MCU exchange data?', a: ['Through Bridge (RPC)', 'Through the Qwiic cable', 'They cannot talk', 'Through Bluetooth'], c: 0, why: 'Bridge is Arduino’s RPC library implemented on both sides.' },
    ],
    sources: [SRC.ds, SRC.um, SRC.pin],
  },

  // ================================================================== 2
  {
    id: 'l2', num: 2, module: 1, title: 'Power the board safely', level: 'Beginner', time: '12 min',
    goal: 'Know the three power inputs, the voltage rails, the boot process and the safe voltage limits.',
    hardware: ['Arduino UNO Q', 'USB-C cable (5 V / 3 A)'],
    steps: [
      {
        title: 'Three ways to power the UNO Q', focus: 'usbc', pins: ['5V', 'VIN'],
        body: `<table class="kv"><tr><th>Input</th><th>Voltage</th><th>Where</th></tr>
        <tr><td>USB-C</td><td>5 V, up to 3 A</td><td>USB-C connector</td></tr>
        <tr><td>5V pin (5V_SYS)</td><td>regulated 5 V, up to 3 A</td><td>JANALOG, JSPI, JMISC</td></tr>
        <tr><td>VIN</td><td>7–24 V DC</td><td>JANALOG, JMEDIA</td></tr></table>
        <p>For learning, the easiest is <b>USB-C</b>. Over USB Power Delivery the board asks only for <b>5 V / 3 A</b> (it never requests higher voltages).</p>
        <p class="warn">Use a supply <b>and</b> cable rated for 5 V / 3 A. Weak supplies can cause resets during short peaks (Wi-Fi bursts, display start-up).</p>`,
      },
      {
        title: 'Plug in the USB-C cable', focus: 'usbc', action: 'plugUsb',
        body: `<p>Watch the cable go in. As soon as power arrives:</p>
        <ul><li>the green <b>power LED</b> (“ON”) lights up — it is tied to the 3.3 V rail;</li>
        <li>the board <b>starts by itself</b> — no button press is needed.</li></ul>`,
      },
      {
        title: 'Linux is starting up', focus: 'matrix', action: 'boot',
        body: `<p>The first boot of Linux typically takes <b>20–30 seconds</b>. During start-up the LED matrix shows the boot logo/animation.</p>
        <p>Wait until the boot sequence has finished before you start using the board.</p>
        <p class="sim">Simulation: the start-up here is shortened to a few seconds, and the matrix shows the Arduino-logo frame from the official LED-matrix example. The real boot animation may look different.</p>`,
      },
      {
        title: 'Inside the board: the power path', focus: 'pmic',
        body: `<div class="ptree">
          <div class="pt-row"><span class="pt in">USB-C 5 V</span><span class="pt in">VIN 7–24 V → buck → 5 V</span></div>
          <div class="pt-arrow">↓ diode-OR (Schottky) ↓</div>
          <div class="pt-row"><span class="pt bus">5V_SYS — 5 V system bus (also the “5V” pin)</span></div>
          <div class="pt-arrow">↓</div>
          <div class="pt-row"><span class="pt">3.8 V buck → <b>3.3 V buck</b><br><small>STM32 MCU, header pins, 3V3 pin, Wi-Fi 3.3 V</small></span><span class="pt">PM4125 LDO → <b>1.8 V</b><br><small>QRB2210 I/O, ANX7625, level shifters</small></span></div>
        </div>
        <p>USB-C and VIN are joined by <b>Schottky diodes</b> (“diode-OR”) onto <b>5V_SYS</b>. All other rails are made from it.</p>`,
      },
      {
        title: 'Voltage limits you must respect', pins: ['A0', 'A1', 'D3', 'IOREF', '3V3'], focus: ['janalog', 'jdigital'],
        body: `<ul><li>MCU header pins are <b>3.3 V logic</b>. Outputs give 3.3 V.</li>
        <li>Most JDIGITAL pins are <b>5 V-tolerant as inputs</b> — <b>except D3</b> (max 3.6 V).</li>
        <li><b>A0–A5</b> in analog mode are <b>not 5 V-tolerant</b>: keep them between 0 V and ≈3.3 V (absolute max ≈3.6 V).</li>
        <li><b>IOREF</b> is an output (3.3 V reference for shields) — never feed power into it.</li>
        <li>JCTL and the MPU GPIOs are <b>1.8 V</b>.</li></ul>
        <p class="warn">The STM32U585 allows at most <b>20 mA per pin</b> (absolute maximum) and <b>120 mA</b> for all pins together. Stay well below.</p>`,
      },
      {
        title: 'The power button = Linux reboot', focus: 'pwrbtn', action: 'longPress',
        body: `<p>A <b>long press (≥ 5 s)</b> reboots the Linux system. Power is not cut, so the power LED stays on.</p>
        <p class="warn">A reboot interrupts running Apps — save your work first.</p>
        <p class="sim">Simulation: we hold the button for 5 seconds and show Linux starting again (shortened).</p>`,
      },
      {
        title: 'Summary', view: 'home',
        body: `<ul><li>Power by <b>USB-C 5 V/3 A</b>, a regulated <b>5 V</b> on the 5V pin, or <b>7–24 V</b> on VIN.</li>
        <li>Green LED = 3.3 V rail is on. Linux boot ≈ 20–30 s.</li>
        <li>Rails: 5V_SYS → 3.3 V (MCU + pins) and 1.8 V (MPU I/O).</li>
        <li>Respect 3.3 V logic, D3 and A0–A5 limits, 20 mA per pin max.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Which voltage range is allowed on the VIN pin?', a: ['3.3 V', '5 V only', '7–24 V', '0–48 V'], c: 2, why: 'VIN (DC IN) accepts 7–24 V; an on-board buck converter makes 5 V.' },
      { q: 'What does the green power LED tell you?', a: ['Wi-Fi is connected', 'The 3.3 V rail is powered', 'A sketch is running', 'Linux has crashed'], c: 1, why: 'The power LED is tied to the 3.3 V rail.' },
      { q: 'What happens after a 5-second press of the power button?', a: ['The board switches off', 'Linux reboots', 'The sketch is erased', 'Nothing'], c: 1, why: 'Long press (≥ 5 s) reboots the Linux system; it does not cut power.' },
      { q: 'May you connect 5 V to A0?', a: ['Yes, always', 'Only with a resistor', 'No — A0/A1 are not 5 V-tolerant', 'Only if Wi-Fi is off'], c: 2, why: 'A0 and A1 are direct ADC inputs, max VDD + 0.3 V (≈3.6 V).' },
    ],
    sources: [SRC.ds, SRC.um, SRC.st],
  },

  // ================================================================== 3
  {
    id: 'l3', num: 3, module: 1, title: 'Hello World: blink the built-in LED', level: 'Beginner', time: '12 min',
    goal: 'Upload your first sketch, understand setup()/loop(), and learn why the UNO Q LED is active-low.',
    hardware: ['Arduino UNO Q', 'USB-C cable', 'Computer with Arduino App Lab (or Arduino IDE)'],
    code: BLINK_CODE, explain: BLINK_EXPLAIN, program: 'blink',
    steps: [
      {
        title: 'Two ways to program the MCU', view: 'home', action: 'ensurePower',
        body: `<p><b>Option A — Arduino App Lab</b> (recommended): open <b>Examples → Blink LED</b> and press <b>Run</b>. App Lab compiles the sketch, flashes the MCU and starts the App.</p>
        <p><b>Option B — Arduino IDE</b>: install the <b>“Arduino UNO Q Zephyr Core”</b> in the Boards Manager, select <b>Arduino UNO Q</b> and the port, open <b>File → Examples → 01.Basics → Blink</b> and press <b>Upload</b>.</p>
        <p>The Arduino IDE programs only the STM32 microcontroller. For the Linux side you use App Lab.</p>`,
      },
      {
        title: 'Where is LED_BUILTIN?', focus: 'rgb3',
        body: `<p><b>LED_BUILTIN</b> blinks the <b>red</b> segment of <b>RGB LED 3</b> — the one marked “STM 3”, controlled by the STM32U585.</p>
        <p>Its colour segments also have their own names: <code>LED3_R</code>, <code>LED3_G</code>, <code>LED3_B</code>.</p>
        <p class="warn">These RGB LEDs are <b>active-low</b>: <b>LOW = ON</b>, <b>HIGH = OFF</b>.</p>`,
      },
      {
        title: 'Read the sketch', focus: 'rgb3', showCode: true,
        body: `<p>This is the Blink sketch from the official UNO Q user manual.</p>
        <ul><li><code>setup()</code> runs <b>once</b> at start.</li><li><code>loop()</code> runs <b>again and again</b>.</li></ul>
        <p class="tip">Click any line of code in the panel below to see what it does.</p>`,
      },
      {
        title: 'Run it', focus: 'rgb3', showCode: true, action: 'run', zoom: 0.6,
        body: `<p>Press <b>▶ Run</b> (or it starts automatically). Watch three things:</p>
        <ul><li>the highlighted line in the code,</li><li>the <b>pin level</b> of LED_BUILTIN,</li><li>the red LED and the Serial Monitor printing “Hello World”.</li></ul>
        <p>The LED is on for 1 second, then off for 1 second, repeatedly.</p>`,
      },
      {
        title: 'Why HIGH means OFF here', focus: 'rgb3', showCode: true,
        body: `<p>Look at the pin level while it runs:</p>
        <ul><li><code>digitalWrite(LED_BUILTIN, HIGH)</code> → pin at 3.3 V → <b>LED off</b></li>
        <li><code>digitalWrite(LED_BUILTIN, LOW)</code> → pin at 0 V → <b>LED on</b></li></ul>
        <p>The LED is wired so that current flows when the pin goes <b>low</b> (active-low). Because both waits are 1 second, the blink looks the same either way — but when you write your own code, remember: <b>LOW turns these LEDs on</b>.</p>`,
      },
      {
        title: 'Experiment: change the speed', focus: 'rgb3', showCode: true, action: 'speedSlider',
        body: `<p>Use the slider to change both <code>delay()</code> values. The code and the simulation update together.</p>
        <p>Smaller delay = faster blinking. Try 200 ms, then 2000 ms.</p>`,
      },
      {
        title: 'Summary', view: 'home',
        body: `<ul><li>A sketch has <code>setup()</code> (once) and <code>loop()</code> (forever).</li>
        <li><code>pinMode</code>, <code>digitalWrite</code>, <code>delay</code>, <code>Serial.println</code>.</li>
        <li>LED_BUILTIN = red segment of RGB LED 3, <b>active-low</b>.</li>
        <li><code>Serial</code> output appears in the App Lab Console.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'How often does loop() run?', a: ['Once', 'Twice', 'Over and over again', 'Only when a button is pressed'], c: 2, why: 'loop() repeats forever after setup().' },
      { q: 'On the UNO Q, what does digitalWrite(LED3_R, LOW) do?', a: ['Turns the red segment OFF', 'Turns the red segment ON', 'Nothing', 'Resets the board'], c: 1, why: 'The RGB LEDs are active-low: logic 0 turns them on.' },
      { q: 'delay(1000) waits for…', a: ['1000 seconds', '1 second', '1 millisecond', '1 microsecond'], c: 1, why: 'delay() takes milliseconds: 1000 ms = 1 s.' },
      { q: 'Which processor does the Arduino IDE program on the UNO Q?', a: ['Only the STM32 MCU', 'Only the Linux MPU', 'Both', 'Neither'], c: 0, why: 'The Arduino IDE targets only the STM32 microcontroller; App Lab handles the Linux side.' },
    ],
    sources: [SRC.um, SRC.ds, SRC.lab],
  },

  // ================================================================== 4
  {
    id: 'l4', num: 4, module: 1, title: 'Your first circuit: an external LED', level: 'Beginner', time: '15 min',
    goal: 'Use a breadboard, choose a safe resistor, wire an LED to pin D5 and blink it.',
    hardware: ['Arduino UNO Q', 'USB-C cable', 'Breadboard', '5 mm red LED', '220 Ω resistor', '2 × male-male jumper wires'],
    code: EXT_LED_CODE, explain: EXT_LED_EXPLAIN, program: 'extled',
    circuit: LED_CIRCUIT, io: { D5: IO_LED },
    steps: [
      {
        title: 'Parts for this circuit', view: 'bench', have: [],
        body: `<ul><li><b>Breadboard</b> — connects parts without soldering</li>
        <li><b>5 mm red LED</b></li><li><b>220 Ω resistor</b> (red-red-brown-gold)</li>
        <li><b>2 jumper wires</b> (male–male): yellow for the signal, black for ground</li></ul>
        <p class="tip">Click any part in the 3D view to read about it.</p>`,
      },
      {
        title: 'How a breadboard is connected inside', view: 'bench', action: 'showStrips',
        body: `<p>The coloured bars show which holes are <b>connected inside</b>:</p>
        <ul><li>Each <b>numbered column</b>: holes <b>a–e</b> are one group, <b>f–j</b> another.</li>
        <li>The centre gap separates the halves.</li>
        <li>The long <b>+ / − rails</b> run along the edges.</li></ul>
        <p>Two legs in the <b>same column group</b> are electrically connected.</p>`,
      },
      {
        title: 'Safety first: unplug while wiring', view: 'bench', power: false,
        body: `<p>Always disconnect power while you build or change a circuit. A wrong touch on a live board can short a pin.</p>`,
      },
      {
        title: 'Step 1 — insert the resistor', view: 'breadboard', have: ['r1'], holes: ['c10', 'c14'],
        body: `<p>Put the <b>220 Ω resistor</b> into holes <b>c10</b> and <b>c14</b>.</p>
        <p><b>Why 220 Ω?</b> The pin gives 3.3 V and a red LED drops about 2.0 V, so the resistor sees ≈1.3 V:</p>
        <p class="formula">I = (3.3 V − 2.0 V) ÷ 220 Ω ≈ <b>5.9 mA</b></p>
        <p>Bright enough to see, and far below the 20 mA absolute maximum of an STM32U585 pin. A resistor has no polarity.</p>`,
      },
      {
        title: 'Step 2 — insert the LED', view: 'breadboard', have: ['r1', 'led1'], holes: ['d14 · anode (+)', 'd15 · cathode (−)'],
        body: `<p>Put the LED into <b>d14</b> and <b>d15</b>:</p>
        <ul><li><b>Long leg = anode (+)</b> → <b>d14</b> (same column as the resistor)</li>
        <li><b>Short leg = cathode (−)</b>, flat side of the rim → <b>d15</b></li></ul>
        <p class="warn">An LED only conducts one way. If it is reversed it simply stays dark.</p>`,
      },
      {
        title: 'Step 3 — wire D5 to the resistor', view: 'bench', pins: ['D5'], have: ['r1', 'led1', 'w1'],
        body: `<p>Yellow jumper: <b>D5</b> on JDIGITAL → hole <b>a10</b>.</p>
        <p>D5 is MCU pin <b>PA11</b> (also a PWM pin “~5”). Column 10 now connects D5 to the resistor.</p>`,
      },
      {
        title: 'Step 4 — wire the LED to GND', view: 'bench', pins: ['GND2'], have: LED_IDS,
        body: `<p>Black jumper: hole <b>a15</b> → <b>GND</b> on JANALOG.</p>
        <p>Column 15 connects the LED cathode to ground. The circuit is now complete.</p>`,
      },
      {
        title: 'Check the current path', view: 'bench', trace: LED_IDS, pins: ['D5', 'GND2'],
        body: `<p class="path">D5 → yellow wire → a10 → <b>column 10</b> → resistor → <b>column 14</b> → LED anode → LED cathode → <b>column 15</b> → a15 → black wire → <b>GND</b></p>
        <p>Current needs a <b>closed loop</b> from the pin back to GND. Follow the glowing path.</p>`,
      },
      {
        title: 'The code', view: 'bench', showCode: true,
        body: `<p>The sketch is the same idea as Blink — only the pin changes.</p>
        <p class="tip">Notice: this external LED is <b>active-high</b> (HIGH = ON), because its cathode goes to GND. The built-in RGB LEDs are the opposite.</p>`,
      },
      {
        title: 'Power up and run', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>We plug in the USB-C cable and run the sketch. The LED blinks: 1 s on, 1 s off.</p>
        <p>Watch the <b>D5 level</b>: 3.3 V = HIGH → LED on, 0 V = LOW → LED off.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>Breadboard columns connect a–e (and f–j).</li><li>LED: long leg (+) toward the pin, short leg (−) toward GND.</li>
        <li>Always use a series resistor: 220 Ω → ≈5.9 mA at 3.3 V.</li><li>External LED wired to GND = active-high.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Which LED leg is the anode (+)?', a: ['The shorter leg', 'The longer leg', 'Either leg', 'The leg near the flat edge'], c: 1, why: 'The longer leg is the anode; the cathode is shorter and next to the flat edge.' },
      { q: 'With 3.3 V, a 2.0 V LED and 220 Ω, the current is about…', a: ['0.6 mA', '5.9 mA', '15 mA', '59 mA'], c: 1, why: '(3.3 − 2.0) / 220 ≈ 0.0059 A = 5.9 mA.' },
      { q: 'What is the absolute maximum current of one STM32U585 I/O pin?', a: ['2 mA', '20 mA', '200 mA', '2 A'], c: 1, why: 'ST datasheet, Table 31: IIO = 20 mA (absolute maximum — design well below it).' },
      { q: 'This external LED (cathode to GND) is ON when D5 is…', a: ['HIGH', 'LOW', 'Floating', 'Never'], c: 0, why: 'HIGH puts 3.3 V on the anode side, so current flows to GND.' },
    ],
    sources: [SRC.um, SRC.pin, SRC.st],
  },

  // ================================================================== 5
  {
    id: 'l5', num: 5, module: 2, title: 'Read a push button (digital input)', level: 'Beginner', time: '15 min',
    goal: 'Read a button with digitalRead() and INPUT_PULLUP, and switch the LED with it.',
    hardware: ['Lesson 4 circuit (LED on D5)', '6 × 6 mm push button', '2 × jumper wires'],
    code: BUTTON, program: 'button', widgets: ['button'],
    circuit: [...LED_CIRCUIT, ...BUTTON_PARTS], io: { D5: IO_LED, D4: { kind: 'button', item: 'btn1', needs: BUTTON_IDS } },
    explain: {
      2: '<b>buttonPin = D4</b> — the button is read on D4 (MCU pin PA12).',
      3: '<b>ledPin = D5</b> — the LED from Lesson 4.',
      6: 'A variable that will hold the reading: HIGH (1) or LOW (0).',
      10: '<b>INPUT_PULLUP</b>: D4 becomes an input and the MCU’s internal pull-up resistor (30–50 kΩ, typ. 40 kΩ) connects it to 3.3 V. Unpressed → HIGH.',
      11: 'D5 drives the LED.',
      14: 'Start Serial output to the App Lab Console.',
      19: '<b>digitalRead(buttonPin)</b> returns HIGH or LOW.',
      22: 'Pressed = <b>LOW</b>, because the button connects D4 to GND.',
      23: 'Pressed → LED on.',
      27: 'Not pressed → LED off.',
      32: '<b>delay(1000)</b>: the button is only checked once per second — so hold it at least 1 s.',
    },
    steps: [
      {
        title: 'What you need', view: 'bench', have: LED_IDS,
        body: `<p>We keep the <b>LED circuit from Lesson 4</b> (LED on D5) and add:</p>
        <ul><li>a <b>6 × 6 mm tactile push button</b></li><li>a <b>blue</b> jumper (signal) and a <b>black</b> jumper (GND)</li></ul>
        <p>This lesson uses the official “Digital Pins” example from the UNO Q user manual: a button on <b>D4</b> switches an LED on <b>D5</b>.</p>`,
      },
      {
        title: 'How a push button works', view: 'breadboard',
        body: `<p>The button has <b>4 legs</b>. Inside, each pair of legs that face each other across the body is <b>always connected</b>. Pressing the button joins the two pairs.</p>
        <p class="tip">Easy rule: connect your wires to <b>diagonally opposite legs</b>. Diagonal legs are never permanently connected, so the button works whichever way round it sits.</p>`,
      },
      {
        title: 'Why pressed reads LOW: the pull-up', view: 'bench', pins: ['D4'],
        body: `<div class="ptree"><div class="pt-row"><span class="pt bus">3.3 V</span></div><div class="pt-arrow">│ internal pull-up ≈ 40 kΩ (inside the STM32U585)</div>
        <div class="pt-row"><span class="pt">D4 (input)</span></div><div class="pt-arrow">│ push button</div><div class="pt-row"><span class="pt">GND</span></div></div>
        <ul><li><code>pinMode(D4, INPUT_PULLUP)</code> switches on a resistor inside the MCU from the pin to 3.3 V (30–50 kΩ, typically 40 kΩ).</li>
        <li><b>Not pressed</b>: nothing pulls the pin down → it reads <b>HIGH</b>.</li>
        <li><b>Pressed</b>: the button connects D4 to GND → it reads <b>LOW</b>.</li></ul>
        <p>Without a pull-up (or pull-down) an open input <b>floats</b> and can read random values.</p>`,
      },
      {
        title: 'Step 1 — insert the button', view: 'breadboard', power: false, have: [...LED_IDS, 'btn1'], holes: ['e20', 'e22', 'f20', 'f22'],
        body: `<p>Push the button across the <b>centre gap</b>: legs in <b>e20, e22, f20, f22</b>.</p>
        <p>The power is unplugged while we wire.</p>`,
      },
      {
        title: 'Step 2 — wire D4', view: 'bench', pins: ['D4'], have: [...LED_IDS, 'btn1', 'w3'],
        body: `<p>Blue jumper: <b>D4</b> on JDIGITAL → hole <b>a20</b>.</p><p>Column 20 (a–e) reaches the button’s top-left leg (e20).</p>`,
      },
      {
        title: 'Step 3 — wire GND to the diagonal leg', view: 'bench', pins: ['GND3'], have: [...LED_IDS, ...BUTTON_IDS],
        body: `<p>Black jumper: hole <b>j22</b> → <b>GND</b> on JANALOG.</p>
        <p>Column 22 (f–j) reaches the bottom-right leg (f22) — <b>diagonally opposite</b> to e20.</p>`,
      },
      {
        title: 'The code', view: 'bench', showCode: true,
        body: `<p>This is the official example from the UNO Q user manual.</p><ul><li><code>INPUT_PULLUP</code> — internal pull-up on D4</li><li><code>digitalRead()</code> — HIGH or LOW</li><li><code>if (buttonState == LOW)</code> — “pressed”</li></ul>
        <p class="tip">Click a line in the code panel to see what it does.</p>`,
      },
      {
        title: 'Run it: press the button', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p><b>Click and hold</b> the button in the 3D view (or hold <b>“Hold to press”</b> in the panel below).</p>
        <ul><li>D4 goes LOW → the LED turns on → the Serial Monitor prints “- Button is pressed. LED is on.”</li>
        <li>Release → “- Button is not pressed. LED is off.”</li></ul>
        <p class="warn">Because of <code>delay(1000)</code> the sketch checks the button only <b>once per second</b>. Hold it at least 1 second, and expect the LED to react up to 1 s late.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li><code>INPUT_PULLUP</code> = internal pull-up to 3.3 V (≈40 kΩ) → unpressed HIGH, pressed LOW.</li>
        <li><code>digitalRead()</code> returns HIGH or LOW.</li><li>Wire a push button on <b>diagonal legs</b>.</li>
        <li>A long <code>delay()</code> makes the sketch slow to react.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'With INPUT_PULLUP, what does an unpressed button read?', a: ['LOW', 'HIGH', 'A random value', '512'], c: 1, why: 'The internal pull-up resistor pulls the pin to 3.3 V, so it reads HIGH.' },
      { q: 'In this circuit, pressing the button makes D4 read…', a: ['HIGH', 'LOW', '3.3 V', 'Nothing changes'], c: 1, why: 'The button connects D4 to GND.' },
      { q: 'Why wire the button on diagonally opposite legs?', a: ['It looks nicer', 'Diagonal legs are never permanently connected', 'It doubles the current', 'The MCU needs it'], c: 1, why: 'Leg pairs facing each other are always connected; diagonal legs are only joined when you press.' },
      { q: 'Typical value of the STM32U585 internal pull-up?', a: ['40 Ω', '4 kΩ', '40 kΩ', '4 MΩ'], c: 2, why: 'ST datasheet (I/O static characteristics): RPU 30–50 kΩ, typically 40 kΩ.' },
    ],
    sources: [SRC.um, SRC.st, SRC.pin],
  },

  // ================================================================== 6
  {
    id: 'l6', num: 6, module: 2, title: 'Read a potentiometer (analog input)', level: 'Beginner', time: '15 min',
    goal: 'Turn a voltage into a number with analogRead() and the 14-bit ADC.',
    hardware: ['Arduino UNO Q', 'Breadboard', '10 kΩ potentiometer', '3 × jumper wires'],
    code: POT, program: 'pot', widgets: ['knob'],
    circuit: POT_PARTS, io: { A0: { kind: 'pot', item: 'pot1', needs: POT_IDS } },
    explain: {
      1: '<b>sensorPin = A0</b> — the wiper of the potentiometer goes to A0 (MCU pin PA4).',
      2: 'Variable for the reading.',
      5: 'Start Serial output.',
      6: '<b>analogReadResolution(14)</b> — added to the official example. Without it, the UNO Q core returns 10-bit values (0–1023). With 14 bits the range is 0–16383.',
      11: '<b>analogRead(A0)</b> measures the voltage on A0: value ≈ voltage ÷ 3.3 V × 16383.',
      12: 'Print the number.',
      13: 'Wait 100 ms → about 10 readings per second.',
    },
    steps: [
      {
        title: 'What you need', view: 'bench', have: [],
        body: `<p>We start with an <b>empty breadboard</b> and use:</p><ul><li>a <b>10 kΩ potentiometer</b> (a knob)</li><li><b>3 jumpers</b>: red (3V3), green (signal), black (GND)</li></ul>`,
      },
      {
        title: 'How a potentiometer works', view: 'breadboard',
        body: `<div class="ptree"><div class="pt-row"><span class="pt bus">3V3 — left leg</span></div><div class="pt-arrow">│ resistive track (10 kΩ)</div>
        <div class="pt-row"><span class="pt">middle leg = wiper → A0</span></div><div class="pt-arrow">│</div><div class="pt-row"><span class="pt">GND — right leg</span></div></div>
        <p>The two outer legs are the ends of a resistive track. The middle leg (<b>wiper</b>) slides along it when you turn the knob.</p>
        <p>So the wiper voltage goes smoothly from <b>0 V</b> to <b>3.3 V</b>. This is called a <b>voltage divider</b>.</p>`,
      },
      {
        title: 'From voltage to a number: the ADC', view: 'bench', pins: ['A0'],
        body: `<p>An <b>ADC</b> (analog-to-digital converter) turns a voltage into a number. The UNO Q ADC on A0–A5 is up to <b>14-bit</b>.</p>
        <table class="kv"><tr><th>Resolution</th><th>Range</th></tr><tr><td>10-bit (default)</td><td>0 … 1023</td></tr><tr><td>14-bit</td><td>0 … 16383</td></tr></table>
        <p class="formula">value ≈ V<sub>A0</sub> ÷ 3.3 V × 16383</p>
        <p>Examples at 14 bits: 0 V → 0, 1.65 V → ≈8191, 3.3 V → 16383.</p>
        <p>The reference is 3.3 V by default (it can be changed with <code>analogReference()</code>).</p>`,
      },
      {
        title: 'Safety: 3.3 V, not 5 V', view: 'bench', pins: ['3V3', 'A0'],
        body: `<p class="warn">Connect the potentiometer to <b>3V3</b>, never to 5V. A0–A5 in analog mode are <b>not 5 V-tolerant</b>: the absolute maximum is about 3.6 V. A 5 V supply could push A0 above that and damage the pin.</p>`,
      },
      {
        title: 'Step 1 — insert the potentiometer', view: 'breadboard', power: false, have: ['pot1'], holes: ['e24', 'e26 · wiper', 'e28'],
        body: `<p>Insert the potentiometer with its legs in <b>e24</b>, <b>e26</b> (wiper) and <b>e28</b>.</p>`,
      },
      {
        title: 'Step 2 — wire 3V3, A0 and GND', view: 'bench', have: POT_IDS, pins: ['3V3', 'A0', 'GND3'],
        body: `<ul><li>Red: <b>3V3</b> → <b>a24</b> (left leg)</li><li>Green: <b>A0</b> → <b>a26</b> (wiper)</li><li>Black: <b>GND</b> → <b>a28</b> (right leg)</li></ul>`,
      },
      {
        title: 'The code', view: 'bench', showCode: true,
        body: `<p>This is the official analog example from the UNO Q user manual, with <b>one added line</b>: <code>analogReadResolution(14)</code>, so we know the range is 0–16383.</p>`,
      },
      {
        title: 'Run it & turn the knob', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p><b>Drag the knob</b> in the 3D view (or use the knob slider below). Watch the numbers in the Serial Monitor follow the wiper voltage.</p>
        <p class="sim">Simulation: the reading includes a little random noise (about ±2 counts) — real ADC readings also jitter slightly.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>A potentiometer is a voltage divider: wiper 0–3.3 V.</li><li><code>analogRead()</code> → number; default 10-bit (0–1023), <code>analogReadResolution(14)</code> → 0–16383.</li>
        <li>Analog pins: <b>max ≈3.3 V</b> — power sensors from 3V3.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'With analogReadResolution(14), the largest value is…', a: ['1023', '4095', '16383', '65535'], c: 2, why: '14 bits → 2¹⁴ − 1 = 16383.' },
      { q: 'Without analogReadResolution(), the UNO Q core returns…', a: ['8-bit (0–255)', '10-bit (0–1023)', '14-bit (0–16383)', 'volts'], c: 1, why: 'The Arduino Zephyr core default read resolution is 10 bits.' },
      { q: 'The wiper is at 1.65 V. At 14 bits the reading is about…', a: ['165', '1023', '8191', '16383'], c: 2, why: '1.65 / 3.3 × 16383 ≈ 8191.' },
      { q: 'Which supply should the potentiometer use here?', a: ['5V', 'VIN', '3V3', 'Any'], c: 2, why: 'A0 is not 5 V-tolerant; 3V3 keeps the wiper within 0–3.3 V.' },
    ],
    sources: [SRC.um, SRC.ds, SRC.core],
  },

  // ================================================================== 7
  {
    id: 'l7', num: 7, module: 2, title: 'Fade an LED with PWM', level: 'Beginner', time: '12 min',
    goal: 'Understand PWM and duty cycle, and use analogWrite() to dim an LED.',
    hardware: ['Lesson 4 circuit (LED on D5)'],
    code: FADE, program: 'fade', fast: true, widgets: ['scope'], scopePin: 'D5',
    circuit: LED_CIRCUIT, io: { D5: IO_LED },
    explain: {
      2: '<b>D5</b> is one of the PWM pins (marked ~).',
      3: 'Brightness value: 0 … 255, because analogWrite() is 8-bit by default.',
      4: 'Step size per loop.',
      7: 'Sets D5 as an output (as in the classic Fade example).',
      11: '<b>analogWrite(led, brightness)</b> sets the PWM duty cycle: brightness ÷ 255.',
      12: 'Increase (or decrease) the brightness.',
      13: 'At either end (0 or 255)…',
      14: '…reverse direction: fade up becomes fade down.',
      16: 'Wait 30 ms per step → one fade from 0 to 255 takes about 51 × 30 ms ≈ 1.5 s.',
    },
    steps: [
      {
        title: 'Back to the LED circuit', view: 'bench', have: LED_IDS,
        body: `<p>We reuse the <b>LED on D5</b> from Lesson 4. This time we will make it <b>dim and bright</b> instead of just on/off.</p>`,
      },
      {
        title: 'What is PWM?', view: 'bench',
        body: `<p>A digital pin can only be <b>HIGH (3.3 V)</b> or <b>LOW (0 V)</b>. <b>PWM</b> (pulse-width modulation) switches the pin on and off very fast.</p>
        <ul><li><b>Duty cycle</b> = the share of time the pin is HIGH.</li><li>Average voltage ≈ duty × 3.3 V.</li>
        <li>The switching is far too fast for your eye, so the LED simply looks <b>dimmer or brighter</b>.</li></ul>`,
      },
      {
        title: 'PWM on the UNO Q', view: 'bench', pins: ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'],
        body: `<ul><li>PWM pins: <b>~3, ~5, ~6, ~9, ~10, ~11</b></li><li>PWM frequency is fixed at <b>500 Hz</b> → one period = 2 ms</li>
        <li><code>analogWrite(pin, value)</code> — 8-bit by default: <b>0</b> = always off, <b>255</b> = always on, ≈128 = 50 %</li>
        <li><code>analogWriteResolution(bits)</code> changes the range (e.g. 10 bits → 0–1023)</li></ul>`,
      },
      {
        title: 'Try it: set the duty cycle', view: 'bench', power: true, action: 'pwmTry',
        body: `<p>Move the <b>analogWrite value</b> slider below (0–255). The simulated oscilloscope shows the 500 Hz signal on D5 and the LED brightness follows.</p>
        <p class="sim">This is the same as running <code>analogWrite(D5, value);</code> once.</p>`,
      },
      {
        title: 'The code', view: 'bench', showCode: true,
        body: `<p>The classic <b>Fade</b> sketch: brightness goes 0 → 255 → 0 in steps of 5, one step every 30 ms.</p>`,
      },
      {
        title: 'Run it', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Watch the LED fade up and down, and the duty cycle on the scope widen and narrow.</p>`,
      },
      {
        title: 'What if the pin has no PWM?', view: 'bench', pins: ['D4'],
        body: `<p>On the UNO Q, <code>analogWrite()</code> on a pin <b>without PWM</b> (e.g. D4) cannot dim. The Arduino Zephyr core then just writes <b>HIGH</b> if the value is above half of the maximum (127 at 8 bits), otherwise <b>LOW</b>.</p>
        <p>So always use a <b>~</b> pin for dimming.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>PWM = fast on/off; duty cycle sets the average.</li><li>UNO Q PWM pins: 3, 5, 6, 9, 10, 11 — fixed 500 Hz.</li><li><code>analogWrite(pin, 0…255)</code> by default.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What is the PWM frequency on the UNO Q?', a: ['50 Hz', '500 Hz', '5 kHz', 'It changes with the value'], c: 1, why: 'The UNO Q user manual: PWM frequency is fixed to 500 Hz.' },
      { q: 'analogWrite(D5, 255) with default settings means…', a: ['Always off', 'About 50 %', 'Always on', 'An error'], c: 2, why: '8-bit: 255 is the maximum → 100 % duty.' },
      { q: 'Which pin is NOT a PWM pin?', a: ['D3', 'D4', 'D9', 'D11'], c: 1, why: 'PWM pins are D3, D5, D6, D9, D10, D11.' },
      { q: 'At 50 % duty, the average voltage on the pin is about…', a: ['0 V', '1.65 V', '3.3 V', '5 V'], c: 1, why: '0.5 × 3.3 V = 1.65 V.' },
    ],
    sources: [SRC.um, SRC.core],
  },

  // ================================================================== 8
  {
    id: 'l8', num: 8, module: 2, title: 'Dimmer: knob controls the LED', level: 'Beginner', time: '12 min',
    goal: 'Combine analog input and PWM output with map().',
    hardware: ['Lesson 4 LED circuit', 'Lesson 6 potentiometer circuit'],
    code: DIMMER, program: 'dimmer', fast: true, widgets: ['knob', 'scope'], scopePin: 'D5',
    circuit: [...LED_CIRCUIT, ...POT_PARTS], io: { D5: IO_LED, A0: { kind: 'pot', item: 'pot1', needs: POT_IDS } },
    explain: {
      2: 'Potentiometer wiper on A0.', 3: 'LED on PWM pin D5.',
      6: '14-bit ADC: 0 … 16383.', 7: 'Serial output on.',
      11: 'Read the knob: 0 … 16383.',
      12: '<b>map()</b> rescales 0…16383 to 0…255 (integer maths, fractions are cut off).',
      13: 'Set the PWM duty cycle → brightness.',
      14: 'Print the brightness value.',
      15: '50 ms → about 20 updates per second.',
    },
    steps: [
      {
        title: 'Two circuits on one breadboard', view: 'bench', have: LED_IDS,
        body: `<p>We combine the <b>LED on D5</b> (Lesson 4) with the <b>potentiometer on A0</b> (Lesson 6).</p>`,
      },
      {
        title: 'Add the potentiometer', view: 'bench', power: false, have: [...LED_IDS, ...POT_IDS], pins: ['3V3', 'A0', 'GND3'],
        body: `<p>Same wiring as Lesson 6: potentiometer in e24/e26/e28, red 3V3 → a24, green A0 → a26, black GND → a28.</p>`,
      },
      {
        title: 'The plan', view: 'bench',
        body: `<div class="ptree"><div class="pt-row"><span class="pt in">knob → A0</span><span class="pt">analogRead: 0 … 16383</span></div>
        <div class="pt-arrow">↓ map()</div><div class="pt-row"><span class="pt">0 … 255</span><span class="pt in">analogWrite(D5) → LED</span></div></div>
        <p>The ADC gives 0–16383 but PWM expects 0–255, so we must <b>scale</b> the number.</p>`,
      },
      {
        title: 'map() explained', view: 'bench',
        body: `<p class="formula">map(x, inLow, inHigh, outLow, outHigh)</p>
        <p>= (x − inLow) × (outHigh − outLow) ÷ (inHigh − inLow) + outLow, using <b>whole numbers</b> (fractions are cut off).</p>
        <table class="kv"><tr><th>potValue</th><th>map(…, 0, 16383, 0, 255)</th></tr><tr><td>0</td><td>0</td></tr><tr><td>8191</td><td>127</td></tr><tr><td>16383</td><td>255</td></tr></table>`,
      },
      { title: 'The code', view: 'bench', showCode: true, body: `<p>Read → scale → write, 20 times per second.</p>` },
      {
        title: 'Run it & turn the knob', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Drag the knob (3D view or slider). The LED brightness, the duty cycle on the scope and the printed number all follow the knob.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>Input (A0) → processing (map) → output (PWM on D5): the basic pattern of most projects.</li><li><code>map()</code> uses integer maths.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'map(16383, 0, 16383, 0, 255) returns…', a: ['0', '127', '255', '16383'], c: 2, why: 'The top of the input range maps to the top of the output range.' },
      { q: 'map(8191, 0, 16383, 0, 255) returns…', a: ['127', '127.5', '128', '255'], c: 0, why: '8191 × 255 / 16383 = 127.49… and map() cuts off the fraction → 127.' },
      { q: 'Why do we need map() here?', a: ['To make the LED red', 'ADC range (0–16383) ≠ PWM range (0–255)', 'To read faster', 'It is required by Serial'], c: 1, why: 'The two ranges differ, so the value must be scaled.' },
    ],
    sources: [SRC.um, SRC.core],
  },

  // ================================================================== 9
  {
    id: 'l9', num: 9, module: 3, title: 'Draw on the LED matrix', level: 'Beginner', time: '15 min',
    goal: 'Show your own pictures on the built-in 8 × 13 LED matrix.',
    hardware: ['Arduino UNO Q', 'USB-C cable'],
    bench: false, program: 'matrix', widgets: [],
    codes: {
      logo: { name: 'logo', frame: 'logo', bits: 1, comment: 'display the image' },
      shades: { name: 'shades', frame: 'shades', bits: 3, comment: 'display the image' },
      editor: { name: 'frame', frame: 'editor', bits: 1, comment: 'your own picture' },
    },
    explain: {
      1: 'The library for the UNO Q LED matrix.',
      2: 'One picture = <b>104 values</b> (8 rows × 13 columns), written row by row.',
      12: 'Create the matrix object.',
      14: '<b>matrix.begin()</b> starts the matrix driver.',
      16: '<b>setGrayscaleBits()</b>: 1 bit = on/off, 3 bits = 8 brightness levels (0–7), 8 bits = 0–255.',
      17: '<b>matrix.draw(array)</b> shows the picture. It stays on — loop() is empty.',
    },
    steps: [
      {
        title: 'The 8 × 13 LED matrix', focus: 'matrix', power: true,
        body: `<p>104 blue LEDs in <b>8 rows × 13 columns</b>, driven by the <b>STM32U585</b> microcontroller. You control it from your sketch with the <b>Arduino_LED_Matrix</b> library.</p>`,
      },
      {
        title: 'How a picture is stored', focus: 'matrix', action: 'matrixAxes',
        body: `<p>A picture is an array of <b>104 numbers</b>: <code>uint8_t frame[104]</code>, written <b>row by row</b>.</p>
        <p class="formula">index = row × 13 + column</p>
        <ul><li><b>Row 0</b> is the top row (next to the Qualcomm processor), row 7 the bottom.</li><li><b>Column 0</b> is on the left (USB-C side), column 12 on the right.</li></ul>
        <p>Example: row 2, column 5 → index 2 × 13 + 5 = <b>31</b>.</p>`,
      },
      {
        title: 'Official example: the Arduino logo', focus: 'matrix', code: 'logo', showCode: true, action: 'run',
        body: `<p>This is the “Image Drawing” example from the UNO Q user manual. Each <code>1</code> lights an LED, each <code>0</code> leaves it dark.</p>`,
      },
      {
        title: 'Brightness levels', focus: 'matrix', code: 'shades', showCode: true, action: 'run',
        body: `<p>The matrix supports <b>8 grey levels</b>. With <code>setGrayscaleBits(3)</code> each value is 0 (off) … 7 (brightest).</p>
        <p>This official example fills row 0 with 0, row 1 with 1 … row 7 with 7.</p>
        <p>With <code>setGrayscaleBits(8)</code> you may use 0–255; the values are mapped automatically.</p>`,
      },
      {
        title: 'Your turn: draw a picture', focus: 'matrix', code: 'editor', showCode: true, action: 'editor',
        body: `<p>Click the squares in the <b>pixel editor</b> below to switch LEDs on or off. The code and the 3D matrix update instantly.</p>
        <p>Choose a brightness level to draw with 8 grey levels (the code switches to <code>setGrayscaleBits(3)</code>).</p>`,
      },
      {
        title: 'Good to know', focus: 'matrix',
        body: `<ul><li>During Linux start-up the matrix shows the boot logo/animation for about 20–30 s.</li></ul>
        <p class="warn">The datasheet warns that accessing the matrix before start-up has finished may interfere with MCU operation — wait for the boot sequence to end.</p>`,
      },
      {
        title: 'Summary', focus: 'matrix',
        body: `<ul><li><code>#include &lt;Arduino_LED_Matrix.h&gt;</code>, <code>matrix.begin()</code>, <code>matrix.draw(frame)</code>.</li><li>104 values, row by row: index = row × 13 + column.</li><li><code>setGrayscaleBits(1)</code> on/off, <code>(3)</code> 8 levels.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'How many LEDs does the matrix have?', a: ['64', '96', '104', '128'], c: 2, why: '8 rows × 13 columns = 104.' },
      { q: 'Which array index is row 2, column 5?', a: ['7', '25', '31', '65'], c: 2, why: '2 × 13 + 5 = 31.' },
      { q: 'With setGrayscaleBits(3), how many brightness levels are there?', a: ['2', '3', '8', '256'], c: 2, why: '3 bits → 8 levels (0–7).' },
      { q: 'Which chip drives the LED matrix?', a: ['QRB2210', 'STM32U585', 'PM4125', 'ANX7625'], c: 1, why: 'The matrix is driven by the STM32U585 microcontroller.' },
    ],
    sources: [SRC.um, SRC.ds],
  },

  // ================================================================== 10
  {
    id: 'l10', num: 10, module: 3, title: 'Make sound with a piezo buzzer', level: 'Beginner', time: '15 min',
    goal: 'Play notes with tone() and noTone(), and protect the pin with a resistor.',
    hardware: ['Arduino UNO Q', 'Breadboard', 'Passive piezo buzzer', '220 Ω resistor', '2 × jumper wires'],
    code: BUZZER, program: 'buzzer', fast: true, widgets: ['scope', 'audio'], scopePin: 'D9',
    circuit: BUZZER_PARTS, io: { D9: { kind: 'buzzer', item: 'bz1', needs: BUZZER_IDS } },
    explain: {
      2: 'The buzzer is driven from <b>D9</b>.',
      3: 'Note frequencies in hertz: C4 D4 E4 F4 G4 A4 B4 C5 (equal temperament, A4 = 440 Hz, rounded).',
      9: 'Repeat for the 8 notes.',
      10: '<b>tone(pin, frequency, duration)</b> starts a square wave and <b>returns immediately</b>; the note stops by itself after 250 ms.',
      11: 'Because tone() does not wait, we wait 300 ms: the note plus a 50 ms gap.',
      13: '<b>noTone(pin)</b> stops any tone on the pin.',
      14: 'One second of silence, then the scale repeats.',
    },
    steps: [
      {
        title: 'What you need', view: 'bench', have: [],
        body: `<ul><li>a <b>passive piezo buzzer</b></li><li>a <b>220 Ω resistor</b></li><li><b>2 jumpers</b>: orange (signal) and black (GND)</li></ul>`,
      },
      {
        title: 'Passive or active buzzer?', view: 'breadboard',
        body: `<ul><li><b>Active</b> buzzer: has its own oscillator — it beeps at one fixed pitch as soon as you apply DC.</li>
        <li><b>Passive</b> buzzer: needs an alternating signal. You choose the pitch with <code>tone()</code>.</li></ul>
        <p>We use a <b>passive piezo</b> buzzer so we can play notes.</p>`,
      },
      {
        title: 'How tone() works', view: 'bench', pins: ['D9'],
        body: `<ul><li><code>tone(pin, frequency)</code> makes a <b>square wave</b> (50 % HIGH, 50 % LOW) at that frequency; the frequency is the <b>pitch</b>.</li>
        <li><code>tone(pin, frequency, duration)</code> stops by itself after <i>duration</i> ms.</li>
        <li>In the UNO Q core, <code>tone()</code> toggles the pin from a timer and <b>returns immediately</b> — your code keeps running.</li>
        <li><code>noTone(pin)</code> stops the sound.</li></ul>`,
      },
      {
        title: 'Why a 220 Ω resistor?', view: 'bench',
        body: `<p>The resistor limits the current the pin can ever deliver, even in the worst case:</p>
        <p class="formula">I<sub>max</sub> = 3.3 V ÷ 220 Ω = 15 mA &nbsp;&lt;&nbsp; 20 mA (STM32U585 absolute maximum)</p>
        <p>It makes the buzzer a little quieter, but keeps the pin safe.</p>`,
      },
      {
        title: 'Step 1 — insert the resistor', view: 'breadboard', power: false, have: ['r2'], holes: ['c19', 'c23'],
        body: `<p>Resistor in <b>c19</b> and <b>c23</b>.</p>`,
      },
      {
        title: 'Step 2 — insert the buzzer', view: 'breadboard', have: ['r2', 'bz1'], holes: ['e23 · +', 'e26 · −'],
        body: `<p>Buzzer <b>+</b> leg in <b>e23</b> (same column as the resistor), <b>−</b> leg in <b>e26</b>.</p>`,
      },
      {
        title: 'Step 3 — wire D9 and GND', view: 'bench', have: BUZZER_IDS, pins: ['D9', 'GND3'],
        body: `<ul><li>Orange: <b>D9</b> → <b>a19</b></li><li>Black: <b>a26</b> → <b>GND</b></li></ul>
        <p class="path">D9 → column 19 → resistor → column 23 → buzzer + → buzzer − → column 26 → GND</p>`,
      },
      {
        title: 'The code', view: 'bench', showCode: true,
        body: `<table class="kv"><tr><th>Note</th><th>Hz</th><th>Note</th><th>Hz</th></tr><tr><td>C4</td><td>262</td><td>G4</td><td>392</td></tr><tr><td>D4</td><td>294</td><td>A4</td><td>440</td></tr><tr><td>E4</td><td>330</td><td>B4</td><td>494</td></tr><tr><td>F4</td><td>349</td><td>C5</td><td>523</td></tr></table>`,
      },
      {
        title: 'Run it & listen', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Turn on your computer’s sound. The scale plays through your speakers, and the scope shows the square wave getting faster as the pitch rises.</p>
        <p class="sim">The sound is generated by your browser as a square wave at the same frequencies — a real piezo sounds similar but thinner.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li><code>tone(pin, Hz, ms)</code> — non-blocking square wave; <code>noTone(pin)</code> — stop.</li><li>Passive buzzer = you choose the pitch.</li><li>Series resistor keeps the pin current ≤ 15 mA.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'tone(D9, 440) produces…', a: ['A 440 Hz square wave', '440 mV', '440 ms of silence', 'A 440 kHz sine wave'], c: 0, why: 'tone() outputs a square wave at the given frequency.' },
      { q: 'On the UNO Q, does tone(pin, f, 250) wait until the note ends?', a: ['Yes, 250 ms', 'No, it returns immediately', 'It waits 1 s', 'Only on D9'], c: 1, why: 'The core starts a timer and returns — that is why the sketch uses delay().' },
      { q: 'Worst-case pin current with a 220 Ω resistor at 3.3 V?', a: ['1.5 mA', '15 mA', '150 mA', '0.66 A'], c: 1, why: '3.3 V / 220 Ω = 0.015 A.' },
      { q: 'Which function stops a tone?', a: ['stopTone()', 'noTone()', 'tone(0)', 'delay()'], c: 1, why: 'noTone(pin) stops the tone on that pin.' },
    ],
    sources: [SRC.core, SRC.st, SRC.um],
  },

  // ================================================================== 11
  {
    id: 'l11', num: 11, module: 4, title: 'Light sensor: an automatic night light', level: 'Beginner', time: '15 min',
    goal: 'Measure light with a photoresistor and a voltage divider, and switch the LED on when it gets dark.',
    hardware: ['Lesson 4 LED circuit (LED on D5)', 'Photoresistor GL5528 (LDR)', '10 kΩ resistor', '3 × jumper wires'],
    code: NIGHT_LIGHT, program: 'nightlight', widgets: ['light'],
    circuit: [...LED_CIRCUIT, ...LDR_PARTS], io: { D5: IO_LED, A0: { kind: 'ldr', item: 'ldr1', needs: LDR_IDS } },
    explain: {
      2: 'The divider’s middle point goes to <b>A0</b>.',
      3: 'The LED from Lesson 4 on D5.',
      4: '<b>threshold</b>: below this number we call it “dark”. 4000 at 14 bits is about 0.8 V on A0 — tune it for your room.',
      7: 'D5 drives the LED.',
      8: '14-bit ADC: 0 … 16383.',
      9: 'Serial output on.',
      13: '<b>analogRead(A0)</b>: the LDR is on top (to 3V3), so more light → lower LDR resistance → higher voltage → bigger number.',
      14: 'Print the light reading.',
      15: 'Dark? (reading below the threshold)',
      16: 'Dark → LED on (HIGH, the LED is wired to GND).',
      18: 'Bright → LED off.',
      20: 'Check 5 times per second.',
    },
    steps: [
      {
        title: 'What you need', view: 'bench', have: LED_IDS,
        body: `<p>We keep the <b>LED on D5</b> from Lesson 4 and add a light sensor:</p>
        <ul><li>a <b>photoresistor</b> (LDR = light-dependent resistor), type <b>GL5528</b></li><li>a <b>10 kΩ resistor</b> (brown-black-orange-gold)</li>
        <li><b>3 jumpers</b>: red (3V3), green (A0), black (GND)</li></ul>`,
      },
      {
        title: 'How a photoresistor works', view: 'breadboard',
        body: `<p>The red-orange zig-zag track on top is a light-sensitive material. <b>More light → lower resistance.</b></p>
        <table class="kv"><tr><th>GL5528 (datasheet)</th><th>Value</th></tr>
        <tr><td>At 10 lux</td><td>10–20 kΩ</td></tr><tr><td>In the dark</td><td>≥ 1 MΩ</td></tr>
        <tr><td>γ (gamma)</td><td>0.6</td></tr><tr><td>Response</td><td>≈ 20 ms brighter, ≈ 30 ms darker</td></tr>
        <tr><td>Most sensitive to</td><td>green light (540 nm)</td></tr></table>
        <p><b>γ = 0.6</b> means: 10× more light → the resistance drops to 10<sup>−0.6</sup> ≈ ¼.</p>
        <p class="tip">Each LDR is a little different (10–20 kΩ at 10 lux). That is why we tune the threshold later.</p>`,
      },
      {
        title: 'Turning resistance into a voltage', view: 'bench', pins: ['3V3', 'A0'],
        body: `<p>The ADC measures <b>voltage</b>, not resistance. So we build a <b>voltage divider</b>: LDR on top, 10 kΩ at the bottom.</p>
        <div class="ptree"><div class="pt-row"><span class="pt bus">3V3</span></div><div class="pt-arrow">│ LDR (changes with light)</div>
        <div class="pt-row"><span class="pt">middle point → A0</span></div><div class="pt-arrow">│ 10 kΩ (fixed)</div><div class="pt-row"><span class="pt">GND</span></div></div>
        <p class="formula">V<sub>A0</sub> = 3.3 V × 10 kΩ ÷ (R<sub>LDR</sub> + 10 kΩ)</p>
        <table class="kv"><tr><th>Light</th><th>R<sub>LDR</sub></th><th>V<sub>A0</sub></th><th>14-bit</th></tr>
        <tr><td>dark</td><td>≥ 1 MΩ</td><td>≤ 0.03 V</td><td>≤ 162</td></tr>
        <tr><td>1 lux</td><td>≈ 60 kΩ</td><td>0.47 V</td><td>≈ 2350</td></tr>
        <tr><td>10 lux</td><td>15 kΩ</td><td>1.32 V</td><td>≈ 6553</td></tr>
        <tr><td>100 lux</td><td>≈ 3.8 kΩ</td><td>2.40 V</td><td>≈ 11899</td></tr>
        <tr><td>1000 lux</td><td>≈ 0.95 kΩ</td><td>3.02 V</td><td>≈ 14967</td></tr></table>
        <p class="sim">Table and simulation use a typical GL5528: 15 kΩ at 10 lux (the middle of the 10–20 kΩ range) and γ = 0.6.</p>
        <p>Because the divider is fed from <b>3V3</b>, A0 can never go above 3.3 V — safe for the analog pin.</p>`,
      },
      {
        title: 'Step 1 — insert the photoresistor', view: 'breadboard', power: false, have: [...LED_IDS, 'ldr1'], holes: ['e22', 'e23'],
        body: `<p>Insert the LDR legs into <b>e22</b> and <b>e23</b>. Its legs are 3.0 mm apart, so bend them very slightly to fit two holes 2.54 mm apart.</p>
        <p>An LDR has <b>no polarity</b>.</p>`,
      },
      {
        title: 'Step 2 — insert the 10 kΩ resistor', view: 'breadboard', have: [...LED_IDS, 'ldr1', 'r3'], holes: ['c23', 'c27'],
        body: `<p>10 kΩ resistor (brown-black-orange-gold) from <b>c23</b> to <b>c27</b>.</p><p>Column 23 is now the <b>middle point</b> of the divider.</p>`,
      },
      {
        title: 'Step 3 — wire 3V3, A0 and GND', view: 'bench', have: [...LED_IDS, ...LDR_IDS], pins: ['3V3', 'A0', 'GND3'],
        body: `<ul><li>Red: <b>3V3</b> → <b>a22</b> (top of the LDR)</li><li>Green: <b>A0</b> → <b>a23</b> (middle point)</li><li>Black: <b>a27</b> → <b>GND</b> (bottom of the 10 kΩ)</li></ul>
        <p class="path">3V3 → LDR → column 23 (A0) → 10 kΩ → column 27 → GND</p>`,
      },
      {
        title: 'The code', view: 'bench', showCode: true,
        body: `<p>Read the light, print it, and compare it with a <b>threshold</b>. Below the threshold it is “dark” → LED on.</p>`,
      },
      {
        title: 'Run it & change the light', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Use the <b>light slider</b> (or the quick buttons) below. Watch the reading, the A0 voltage and the LED.</p>
        <ul><li>Bright room → big number → LED off</li><li>Dark → small number → LED on</li></ul>
        <p class="sim">The light level is simulated with the typical GL5528 values above; the readings also include a little ADC noise.</p>`,
      },
      {
        title: 'Choosing a good threshold', view: 'bench', showCode: true,
        body: `<ol><li>Run the sketch and note the reading in your room <b>with the light on</b>.</li><li>Cover the sensor or dim the room and note the reading again.</li>
        <li>Set <code>threshold</code> somewhere between the two.</li></ol>
        <p class="tip">Real light flickers and changes slowly at dusk. Advanced versions use two thresholds (on below one value, off above a higher one) so the LED does not flicker on and off — this is called <b>hysteresis</b>.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>LDR: more light → lower resistance (GL5528: 10–20 kΩ at 10 lux, ≥ 1 MΩ dark).</li>
        <li>Voltage divider from 3V3 turns resistance into a voltage that A0 can read safely.</li>
        <li>Compare the reading with a threshold to make decisions.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What happens to an LDR’s resistance when more light falls on it?', a: ['It goes up', 'It goes down', 'It stays the same', 'It becomes negative'], c: 1, why: 'More light → lower resistance.' },
      { q: 'Why do we need the 10 kΩ resistor?', a: ['To protect the LED', 'To make a voltage divider so A0 sees a changing voltage', 'To make the LDR brighter', 'It is not needed'], c: 1, why: 'The ADC measures voltage; the divider converts the LDR’s resistance into a voltage.' },
      { q: 'With the LDR on top (to 3V3), more light gives…', a: ['A smaller reading', 'A bigger reading', 'Always 0', 'Always 16383'], c: 1, why: 'Lower LDR resistance → higher voltage at the middle point.' },
      { q: 'Why feed the divider from 3V3 and not 5V?', a: ['5V is not available', 'A0 is not 5 V-tolerant; from 3V3 it can never exceed 3.3 V', 'The LDR needs exactly 3.3 V', 'No reason'], c: 1, why: 'A0–A5 in analog mode must stay within 0 V … ≈3.3 V.' },
    ],
    sources: [SRC.ldr, SRC.um, SRC.ds],
  },

  // ================================================================== 12
  {
    id: 'l12', num: 12, module: 4, title: 'Measure temperature with a TMP36', level: 'Beginner', time: '15 min',
    goal: 'Read an analog temperature sensor and convert the reading into °C with a formula from its datasheet.',
    hardware: ['Arduino UNO Q', 'Breadboard', 'TMP36 temperature sensor (TO-92)', '3 × jumper wires'],
    code: TMP36_CODE, program: 'tmp36', widgets: ['temp'],
    circuit: TMP_PARTS, io: { A0: { kind: 'tmp36', item: 't1', needs: TMP_IDS } },
    explain: {
      2: 'The TMP36 output (VOUT) goes to <b>A0</b>.',
      5: '14-bit ADC: 0 … 16383.',
      6: 'Serial output on.',
      10: 'Read the sensor voltage as a number.',
      11: '<b>Number → volts</b>: the ADC reference is 3.3 V, so 16383 = 3.3 V. We write <code>16383.0</code> so the maths is done with decimals.',
      12: '<b>Volts → °C</b> from the datasheet: 0.5 V at 0 °C and +10 mV per °C, so T = (V − 0.5) × 100.',
      13: 'Print the voltage with 3 decimals.',
      15: 'Print the temperature with 1 decimal.',
      16: 'Finish the line with “ C”.',
      17: 'One reading per second.',
    },
    steps: [
      {
        title: 'What you need', view: 'bench', have: [],
        body: `<ul><li>a <b>TMP36</b> temperature sensor (looks like a small black transistor, “TO-92” package)</li><li><b>3 jumpers</b>: red (3V3), green (A0), black (GND)</li></ul>
        <p>The TMP36 works from <b>2.7 V to 5.5 V</b>, so it runs directly from the UNO Q’s 3V3 pin.</p>`,
      },
      {
        title: 'Why not the DHT11?', view: 'bench',
        body: `<p>Many kits include the blue <b>DHT11</b> temperature-and-humidity sensor. It sends its data on one wire with <b>microsecond timing</b>.</p>
        <p>At the time of writing, the UNO Q user manual has <b>no DHT11 example</b>, and users on the Arduino forum report failed readings with the usual DHT library on the UNO Q (the same code works on a UNO R3).</p>
        <p>So in this course we only teach what we can verify: the <b>TMP36</b> now, and temperature + humidity with Arduino’s <b>Modulino® Thermo</b> over Qwiic in a later module.</p>`,
      },
      {
        title: 'How the TMP36 works', view: 'breadboard',
        body: `<p>The TMP36 outputs a <b>voltage</b> that rises <b>10 mV for every °C</b>:</p>
        <p class="formula">V<sub>OUT</sub> = 0.5 V + 0.01 V × T(°C)&nbsp;&nbsp;⇔&nbsp;&nbsp;T = (V<sub>OUT</sub> − 0.5 V) × 100</p>
        <table class="kv"><tr><th>Temperature</th><th>V<sub>OUT</sub></th><th>14-bit reading</th></tr>
        <tr><td>−40 °C</td><td>0.10 V</td><td>≈ 496</td></tr><tr><td>0 °C</td><td>0.50 V</td><td>≈ 2482</td></tr>
        <tr><td>25 °C</td><td>0.75 V</td><td>≈ 3723</td></tr><tr><td>100 °C</td><td>1.50 V</td><td>≈ 7447</td></tr>
        <tr><td>125 °C</td><td>1.75 V</td><td>≈ 8688</td></tr></table>
        <p>The <b>0.5 V offset</b> lets it measure below 0 °C without needing a negative voltage. Its output always stays well below 3.3 V — safe for A0.</p>`,
      },
      {
        title: 'Which leg is which?', view: 'breadboard',
        body: `<p>Hold it with the <b>flat, printed face toward you</b> and the legs down:</p>
        <table class="kv"><tr><td>Left</td><td>pin 1 · <b>+V<sub>S</sub></b> (power)</td></tr><tr><td>Middle</td><td>pin 2 · <b>V<sub>OUT</sub></b> (signal)</td></tr><tr><td>Right</td><td>pin 3 · <b>GND</b></td></tr></table>
        <p class="warn">Check the flat face before powering up. If +V<sub>S</sub> and GND are swapped, the sensor does not work and can be damaged.</p>`,
      },
      {
        title: 'Step 1 — insert the TMP36', view: 'breadboard', power: false, have: ['t1'], holes: ['e18 · +VS', 'e19 · VOUT', 'e20 · GND'],
        body: `<p>Insert it into <b>e18, e19, e20</b> with the <b>flat face toward the centre gap</b> (toward you in this view).</p>`,
      },
      {
        title: 'Step 2 — wire 3V3, A0 and GND', view: 'bench', have: TMP_IDS, pins: ['3V3', 'A0', 'GND3'],
        body: `<ul><li>Red: <b>3V3</b> → <b>a18</b> (+V<sub>S</sub>)</li><li>Green: <b>A0</b> → <b>a19</b> (V<sub>OUT</sub>)</li><li>Black: <b>a20</b> → <b>GND</b></li></ul>`,
      },
      {
        title: 'From a number to °C', view: 'bench',
        body: `<p>Example at 25 °C:</p>
        <ol><li><code>analogRead</code> → <b>3723</b></li><li>3723 × 3.3 ÷ 16383 = <b>0.750 V</b></li><li>(0.750 − 0.5) × 100 = <b>25.0 °C</b></li></ol>
        <p>We use <code>float</code> variables because volts and °C have decimals.</p>`,
      },
      { title: 'The code', view: 'bench', showCode: true, body: `<p><code>Serial.print(value, 3)</code> prints a decimal number with 3 digits after the point; <code>Serial.println</code> ends the line.</p>` },
      {
        title: 'Run it & change the temperature', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Move the <b>temperature slider</b> below. The sensor voltage changes 10 mV per °C, and the Serial Monitor shows the voltage and the temperature.</p>
        <p class="sim">The room temperature is simulated. A real reading also jitters by a few hundredths of a degree because of ADC noise.</p>`,
      },
      {
        title: 'How accurate is it?', view: 'bench',
        body: `<ul><li><b>Sensor</b>: typically ±1 °C at 25 °C and ±2 °C over −40…+125 °C. The TO-92 version (TMP36GT9Z) is guaranteed within <b>±3 °C</b> at 25 °C.</li>
        <li><b>ADC</b>: one 14-bit step is 3.3 V ÷ 16383 ≈ 0.2 mV ≈ <b>0.02 °C</b> — much finer than the sensor accuracy.</li>
        <li><b>Reference</b>: the formula assumes the 3V3 rail is exactly 3.3 V. If it is 1 % high, the calculated voltage is 1 % low: at 25 °C that is 7.5 mV ≈ <b>0.75 °C</b> too low.</li></ul>
        <p class="tip">Showing 1 decimal does not make it accurate to 0.1 °C! Resolution (smallest step) and accuracy are different things.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>TMP36: V = 0.5 V + 10 mV/°C; runs from 3V3.</li><li>Pins (flat face to you): +V<sub>S</sub>, V<sub>OUT</sub>, GND.</li>
        <li>reading → volts → °C with <code>float</code> maths.</li><li>Resolution ≠ accuracy: the sensor is ±2 °C typical.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What is the TMP36 output at 25 °C?', a: ['0.25 V', '0.5 V', '0.75 V', '2.5 V'], c: 2, why: 'Datasheet: 750 mV at 25 °C (0.5 V + 25 × 10 mV).' },
      { q: 'The output reads 0.62 V. The temperature is…', a: ['6.2 °C', '12 °C', '62 °C', '120 °C'], c: 1, why: '(0.62 − 0.5) × 100 = 12 °C.' },
      { q: 'With the flat face toward you, the middle leg is…', a: ['+VS', 'VOUT', 'GND', 'Not connected'], c: 1, why: 'Pin 2 (middle) is VOUT.' },
      { q: 'The program prints 23.47 °C. How accurate is that, typically?', a: ['±0.01 °C', '±0.1 °C', 'About ±2 °C', 'Exact'], c: 2, why: 'Typical accuracy is ±2 °C over the range (±1 °C at 25 °C); more decimals do not add accuracy.' },
    ],
    sources: [SRC.tmp36, SRC.um, SRC.dhtforum],
  },

  // ================================================================== 13
  {
    id: 'l13', num: 13, module: 4, title: 'Measure distance with ultrasound (HC-SR04)', level: 'Intermediate', time: '20 min',
    goal: 'Measure distance with sound, use a 5 V module safely with the 3.3 V UNO Q, and time a pulse with pulseIn().',
    hardware: ['Arduino UNO Q', 'Breadboard', 'HC-SR04 ultrasonic sensor', '4 × jumper wires'],
    code: ULTRASONIC, program: 'ultrasonic', widgets: ['distance'],
    circuit: US_PARTS, io: { D8: { kind: 'hcsr04', item: 'us1', trig: 'D7', needs: US_IDS } },
    explain: {
      2: '<b>TRIG</b> on D7. The datasheet asks for a “TTL pulse”; TTL inputs count anything above 2.0 V as HIGH, so the UNO Q’s 3.3 V HIGH is enough.',
      3: '<b>ECHO</b> on D8. ECHO outputs <b>5 V</b>. D8 (PB4) is a 5 V-tolerant input on the UNO Q (datasheet §9.6).',
      6: 'D7 drives the trigger.',
      7: '<b>INPUT</b>, not INPUT_PULLUP: the STM32U585 datasheet says the internal pull-up must be off for a pin to hold more than 4 V.',
      8: 'Serial output on.',
      12: 'Start from a clean LOW…',
      13: '…for 2 µs.',
      14: 'TRIG HIGH starts a measurement.',
      15: 'Keep it HIGH for 10 µs (datasheet: “at least 10 µs”).',
      16: 'TRIG LOW again. The module now sends 8 cycles of 40 kHz ultrasound.',
      18: '<b>pulseIn(echoPin, HIGH)</b> waits for ECHO to go HIGH and returns how long it stayed HIGH, in microseconds = the time the sound needed to go there and back.',
      19: 'Datasheet formula: <b>µs ÷ 58 = cm</b>. <code>58.0</code> makes it a decimal division.',
      21: 'Print with one decimal.',
      22: 'Finish the line.',
      23: 'Datasheet: use a measurement cycle of more than 60 ms, so the next trigger does not mix with an old echo.',
    },
    steps: [
      {
        title: 'What you need', view: 'bench', have: [],
        body: `<ul><li>an <b>HC-SR04</b> ultrasonic sensor (the blue board with two silver “eyes”)</li>
        <li><b>4 jumpers</b>: red (5V), yellow (TRIG), blue (ECHO), black (GND)</li></ul>
        <table class="kv"><tr><th>HC-SR04 datasheet</th><th></th></tr>
        <tr><td>Supply</td><td>5 V DC, 15 mA</td></tr><tr><td>Range</td><td>2 cm – 4 m</td></tr>
        <tr><td>Measuring angle</td><td>15°</td></tr><tr><td>Resolution</td><td>down to 3 mm</td></tr>
        <tr><td>Sound frequency</td><td>40 kHz (ultrasound — you cannot hear it)</td></tr></table>`,
      },
      {
        title: 'How it measures distance', view: 'breadboard',
        body: `<ol><li>Your sketch sends a <b>10 µs HIGH pulse</b> to <b>TRIG</b>.</li>
        <li>The <b>transmitter</b> (marked <b>T</b>, on the left seen from the front) sends <b>8 cycles of 40 kHz</b> sound.</li>
        <li>The sound bounces off an object; the <b>receiver</b> (marked <b>R</b>, on the right) hears the echo.</li>
        <li><b>ECHO</b> stays HIGH for the whole <b>round trip</b> time.</li></ol>
        <p class="formula">distance = time × speed of sound ÷ 2</p>
        <p>We divide by 2 because the sound travels <b>there and back</b>. With 340 m/s the datasheet simplifies it to:</p>
        <p class="formula">cm = µs ÷ 58</p>
        <p>Example: an echo of 1160 µs → 1160 ÷ 58 = <b>20 cm</b>.</p>`,
      },
      {
        title: 'A 5 V module on a 3.3 V board — is it safe?', view: 'bench', pins: ['5V', 'D7', 'D8', 'D3'],
        body: `<table class="kv"><tr><th>Pin</th><th>Check</th></tr>
        <tr><td>VCC</td><td>needs 5 V → UNO Q <b>5V</b> pin (15 mA is tiny)</td></tr>
        <tr><td>TRIG (input)</td><td>a “TTL” input: HIGH above 2.0 V → <b>3.3 V works</b></td></tr>
        <tr><td>ECHO (output)</td><td>sends <b>5 V</b> back to the board ⚠</td></tr></table>
        <p>The UNO Q datasheet (§9.6): <b>most JDIGITAL pins are 5 V-tolerant as inputs</b> — so ECHO may go straight to <b>D8</b>.</p>
        <p class="warn"><b>Never</b> connect a 5 V signal to <b>D3</b> (only 3.6 V-tolerant) or to <b>A0–A5</b> used as analog inputs. Some online UNO Q tutorials put ECHO on D3 — the datasheet says D3 is not 5 V-tolerant in any mode.</p>
        <p class="tip">Use <code>pinMode(echoPin, INPUT)</code>, not INPUT_PULLUP: the STM32U585 datasheet says the internal pull-up must be off to sustain more than 4 V on a pin. Not sure about a pin? A voltage divider (e.g. 1 kΩ + 2 kΩ) turns 5 V into 3.3 V and is always safe.</p>`,
      },
      {
        title: 'Step 1 — insert the sensor', view: 'breadboard', power: false, have: ['us1'], holes: ['j11 · VCC', 'j12 · TRIG', 'j13 · ECHO', 'j14 · GND'],
        body: `<p>Push the 4 pins into <b>j11–j14</b>, with the transducers facing <b>away</b> from the board so nothing blocks the sound.</p>
        <p>Seen from the front the pins are: <b>Vcc · Trig · Echo · Gnd</b>.</p>`,
      },
      {
        title: 'Step 2 — wire it', view: 'bench', have: US_IDS, pins: ['5V', 'D7', 'D8', 'GND3'],
        body: `<ul><li>Red: <b>5V</b> → <b>f11</b> (VCC)</li><li>Yellow: <b>D7</b> → <b>f12</b> (TRIG)</li>
        <li>Blue: <b>D8</b> → <b>f13</b> (ECHO)</li><li>Black: <b>f14</b> → <b>GND</b></li></ul>
        <p>Holes f–j of one column are connected, so f11 reaches the pin in j11.</p>`,
      },
      {
        title: 'The code', view: 'bench', showCode: true,
        body: `<p>Trigger → time the echo with <code>pulseIn()</code> → convert with ÷ 58 → print.</p>
        <p class="tip">Click any line in the code panel to see what it does.</p>`,
      },
      {
        title: 'UNO Q detail: pulseIn() measures in 100 µs steps', view: 'bench', showCode: true,
        body: `<p>On the UNO Q, the Arduino core measures the pulse with the Zephyr system clock tick (source: <code>wiring_pulse.cpp</code> uses <code>k_uptime_ticks()</code>). At 10 000 ticks per second one step is <b>100 µs</b>:</p>
        <p class="formula">100 µs ÷ 58 ≈ 1.7 cm per step</p>
        <p>Readings published from a real UNO Q (44.6, 46.3, 48.0, 137.2, 138.9 cm) are all whole multiples of 1.715 cm — exactly this step. So expect readings to jump in ~1.7 cm steps — fine for obstacle detection.</p>
        <p class="warn">The third argument of <code>pulseIn(pin, state, timeout)</code> is in <b>microseconds</b> on most Arduino boards, but the current UNO Q core passes it to <code>K_MSEC()</code> (milliseconds). That is why this sketch leaves it out. If nothing prints at all, check the ECHO wire — <code>pulseIn()</code> is still waiting.</p>`,
      },
      {
        title: 'Run it & move the obstacle', view: 'sonar', showCode: true, power: true, action: 'run',
        body: `<p>A cardboard box stands in front of the sensor — everything is drawn at <b>true scale</b>, with a tape measure from the front of the transducers. <b>Drag the box</b>, or use the slider / quick buttons.</p>
        <ul><li><b style="color:#9fe6ff">Blue wavefronts</b> leave the transmitter <b>T</b>. Their spacing is the real wavelength of 40 kHz sound in air: 343 m/s ÷ 40 000 Hz ≈ <b>8.6 mm</b>. There are 8 of them — the datasheet’s 8-cycle burst.</li>
        <li><b style="color:#ffbf73">Orange wavefronts</b> are the echo. A flat face reflects sound as if it came from a mirror image of T behind the box; the receiver <b>R</b> lights up when the echo reaches it.</li>
        <li>The timing diagram shows TRIG → burst → <b>ECHO HIGH for the whole round trip</b>, as in the datasheet. Compare the printed distance with the tape measure.</li></ul>
        <p class="sim">Simulated and slowed down: in reality 40 cm takes only 2.3 ms there and back. The echo time is µs = distance × 58 (datasheet formula), rounded down to 100 µs steps like <code>pulseIn()</code> on the UNO Q. Real readings also vary a little (see the next step).</p>`,
      },
      {
        title: 'Why real readings vary', view: 'bench',
        body: `<ul><li><b>Temperature</b>: sound travels at about 331.3 + 0.606 × T m/s — 343 m/s at 20 °C, 349 m/s at 30 °C. The datasheet’s ÷ 58 assumes 340 m/s, so at 30 °C a real 100 cm reads about <b>97 cm</b>.</li>
        <li><b>Target</b>: the datasheet asks for a flat, smooth object of at least 0.5 m². Soft (cloth, foam) or tilted objects send less sound back.</li>
        <li><b>Beam</b>: the sensor “sees” in a 15° cone, so a nearby wall or table edge can answer first.</li>
        <li><b>Range</b>: below 2 cm or above 4 m the readings are not reliable.</li></ul>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>Trigger 10 µs → ECHO HIGH time = round trip → <b>cm = µs ÷ 58</b>.</li>
        <li>VCC to 5V; TRIG works at 3.3 V; <b>5 V ECHO only to a 5 V-tolerant pin</b> (D8 ✓, D3 ✗, A0–A5 ✗), with plain INPUT.</li>
        <li>On the UNO Q, <code>pulseIn()</code> resolves 100 µs ≈ 1.7 cm, and its timeout argument is treated as milliseconds.</li>
        <li>Wait > 60 ms between measurements.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'ECHO stays HIGH for 2320 µs. How far is the object?', a: ['23.2 cm', '40 cm', '80 cm', '134 cm'], c: 1, why: 'Datasheet formula: 2320 ÷ 58 = 40 cm.' },
      { q: 'Why do we divide the travel time by 2?', a: ['The sensor has two transducers', 'The sound goes to the object and back', 'To convert µs to ms', 'Because of the 2 µs LOW pulse'], c: 1, why: 'ECHO measures the round trip; the distance is half of it.' },
      { q: 'Which UNO Q pin must NEVER receive the 5 V ECHO signal?', a: ['D7', 'D8', 'D3', 'D12'], c: 2, why: 'UNO Q datasheet: D3 (PB0) is a TT-type pin, only 3.6 V-tolerant, in any mode.' },
      { q: 'Why pinMode(echoPin, INPUT) and not INPUT_PULLUP here?', a: ['INPUT_PULLUP is slower', 'The internal pull-up must be off for the pin to hold more than 4 V', 'pulseIn needs a pull-down', 'No reason'], c: 1, why: 'STM32U585 datasheet: to sustain a voltage higher than 4 V, the internal pull-up/pull-down resistors must be disabled.' },
    ],
    sources: [SRC.hcsr04, SRC.ds, SRC.st, SRC.core, SRC.prahari],
  },

  // ================================================================== 14
  {
    id: 'l14', num: 14, module: 4, title: 'Detect motion with a PIR sensor (HC-SR501)', level: 'Intermediate', time: '20 min',
    goal: 'Detect people with a passive-infrared sensor, understand its delay and trigger settings, and build a motion alarm.',
    hardware: ['Lesson 4 LED circuit (LED on D5)', 'HC-SR501 PIR motion sensor', '3 × female–male jumper wires'],
    code: PIR_CODE, program: 'pir', fast: true, widgets: ['pir'],
    circuit: [...LED_CIRCUIT, ...PIR_PARTS], io: { D5: IO_LED, D2: { kind: 'pir', item: 'pir1', needs: PIR_IDS } },
    explain: {
      2: '<b>pirPin = D2</b>. The PIR output is 3.3 V, so any UNO Q digital pin is safe.',
      3: 'The LED from Lesson 4.',
      4: 'Remembers the last reading, so we only print when it changes.',
      7: '<b>INPUT</b>: the PIR drives the pin itself (HIGH or LOW), so no pull-up is needed.',
      8: 'D5 drives the LED.',
      9: 'Serial output on.',
      11: '<b>delay(60000)</b>: the datasheet says the module needs about <b>1 minute</b> after power-up, and may give 0–3 false pulses meanwhile. Waiting here ignores them.',
      16: '<b>digitalRead</b>: HIGH while the PIR reports motion (for the whole time-delay period).',
      17: 'Motion → LED on, otherwise off.',
      22: 'Only print when the state changes, instead of 20 times per second.',
      24: 'Rising edge: motion started.',
      26: 'Falling edge: the delay time has run out.',
      28: 'Remember the new state.',
      30: 'Check 20 times per second.',
    },
    steps: [
      {
        title: 'What we build: a motion alarm', view: 'bench', have: LED_IDS, labels: [['led1', 'Alarm LED (on D5)'], ['board', 'UNO Q']],
        body: `<p>When something warm (a hand, a person) moves in front of the sensor, an <b>alarm LED</b> lights up.</p>
        <div class="ptree"><div class="pt-row"><span class="pt in">PIR sensor sees motion</span></div><div class="pt-arrow">↓ OUT = 3.3 V on <b>D2</b></div>
        <div class="pt-row"><span class="pt">UNO Q sketch reads D2</span></div><div class="pt-arrow">↓ writes <b>D5</b> HIGH</div>
        <div class="pt-row"><span class="pt bus">alarm LED turns on</span></div></div>
        <p>The <b>LED on the breadboard</b> is the same LED + 220 Ω resistor from Lesson 4 — we reuse it as the alarm light.</p>
        <p>New parts: an <b>HC-SR501</b> PIR sensor and <b>3 female–male jumper wires</b>.</p>`,
      },
      {
        title: 'How a PIR sensor works', view: 'bench',
        body: `<p><b>PIR</b> = <b>Passive InfraRed</b>. It does not send anything out — it only <b>feels the heat</b> (infrared) that a hand or a person gives off.</p>
        <ul><li>It reacts when something warm <b>moves across</b> in front of it.</li><li>Something warm that <b>stays still</b> is <b>not</b> detected.</li></ul>
        <table class="kv"><tr><th>Its output (OUT pin)</th><th></th></tr><tr><td>Motion</td><td><b>HIGH</b> = 3.3 V</td></tr><tr><td>No motion</td><td><b>LOW</b> = 0 V</td></tr></table>
        <p>After the last movement it keeps OUT HIGH for a few seconds (set by a small knob on the back; ≈5 s at its minimum), then goes LOW.</p>`,
      },
      {
        title: 'Where do the 3 pins go?', view: 'bench', pins: ['5V', 'D2', 'GND3'],
        body: `<table class="kv"><tr><th>PIR pin</th><th>Goes to</th><th>Why</th></tr>
        <tr><td>VCC</td><td><b>5V</b></td><td>it needs 5–20 V (3.3 V is too low)</td></tr>
        <tr><td>OUT</td><td><b>D2</b></td><td>its signal is only 3.3 V → safe on any UNO Q pin</td></tr>
        <tr><td>GND</td><td><b>GND</b></td><td>common ground</td></tr></table>`,
      },
      {
        title: 'Step 1 — set up the sensor', view: 'bench', power: false, have: [...LED_IDS, 'pir1'], labels: [['pir1', 'HC-SR501 PIR sensor'], ['led1', 'Alarm LED (on D5)']],
        body: `<p>Stand the PIR next to the breadboard with the <b>dome facing out</b>. It is not pushed into the breadboard — its pots stick out underneath — so it stands on a small stand and gets <b>female</b> jumper ends on its pins.</p>
        <p>Pin order (datasheet photo, component side facing you, pins at the bottom): <b>VCC · OUT · GND</b>. From the dome side it is mirrored: GND · OUT · VCC.</p>`,
      },
      {
        title: 'Step 2 — wire it', view: 'bench', have: [...LED_IDS, ...PIR_IDS], pins: ['5V', 'D2', 'GND3'],
        body: `<ul><li>Red: PIR <b>VCC</b> → UNO Q <b>5V</b></li><li>Yellow: PIR <b>OUT</b> → <b>D2</b></li><li>Black: PIR <b>GND</b> → <b>GND</b></li></ul>
        <p>The female ends slide onto the PIR pins; the male ends go into the UNO Q headers.</p>`,
      },
      {
        title: 'Get to know the module (front)', view: 'pirfront',
        body: `<p><b>Click each part</b> of the sensor to see what it does.</p>
        <ul><li><b>White dome</b> = Fresnel lens. Under it is the infrared sensor with two elements.</li><li>The <b>clear stand</b> only holds it upright.</li></ul>`,
      },
      {
        title: 'Get to know the module (back)', view: 'pirback',
        body: `<p>Turn it around. <b>Click each part:</b></p>
        <ul><li>Two orange <b>pots</b>: <b>time delay</b> (left) and <b>sensitivity</b> (right)</li><li>Yellow <b>trigger jumper</b> (H / L)</li>
        <li>The black chip: <b>BISS0001</b> signal processor</li><li>A small <b>3.3 V regulator</b></li><li>The 3 <b>pins</b>: VCC · OUT · GND</li></ul>`,
      },
      { title: 'The code', view: 'bench', showCode: true, body: `<p>Wait for start-up, then copy the PIR output to the LED and print a message whenever it changes.</p>` },
      {
        title: 'Run it: wave your hand', view: 'room', showCode: true, power: true, action: 'run',
        body: `<ol><li><b>Warm-up</b> (a few seconds here; a real sensor needs about 1 minute). Wait until the sensor says <b>Watching</b>.</li>
        <li>Click <b>👋 Wave hand</b>. The hand passes in front of the sensor →<br>Sensor <b>MOTION!</b> → OUT <b>HIGH</b> → <b>LED ON</b>.</li>
        <li>Stop waving → about <b>5 s later</b> → OUT LOW → <b>LED OFF</b>.</li>
        <li>Click <b>✋ Hold hand still</b>: the hand is in front, but it does not move → <b>nothing happens</b>.</li></ol>
        <p class="sim">Simulated: the start-up time is shortened; the ≈5 s hold time is the sensor’s minimum setting.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>A PIR feels <b>moving</b> warm things (hands, people).</li>
        <li>VCC → 5V, OUT → D2, GND → GND. Read OUT with <code>digitalRead()</code>: HIGH = motion.</li>
        <li>The knobs on the back set the hold time and the range; the jumper sets the trigger mode.</li>
        <li>A real sensor needs about 1 minute to start up.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What does “passive” mean in Passive InfraRed?', a: ['It needs no power', 'It sends nothing out — it only receives infrared heat', 'It works only in the dark', 'It has no lens'], c: 1, why: 'A PIR only receives the infrared that warm bodies emit.' },
      { q: 'Which UNO Q pin should power the HC-SR501?', a: ['3V3', '5V', 'D2', 'AREF'], c: 1, why: 'Datasheet supply is 5–20 V (4.5 V min), so 3.3 V is too low.' },
      { q: 'Why can OUT go to any UNO Q digital pin, even D3?', a: ['It is open-drain', 'Its HIGH level is only 3.3 V', 'It outputs 5 V but very weakly', 'The UNO Q is 5 V'], c: 1, why: 'The datasheet gives a 3.3 V / 0 V TTL output (the module has a 3.3 V regulator).' },
      { q: 'With the jumper on H, what happens while someone keeps moving?', a: ['OUT pulses on and off', 'OUT stays HIGH — each detection restarts the delay', 'OUT goes LOW after 5 s', 'Nothing'], c: 1, why: 'H = repeatable trigger: the delay restarts with every detection.' },
      { q: 'Which movement is hardest for a PIR to detect?', a: ['Walking across its view', 'Walking straight toward it', 'Waving a hand sideways', 'Running past'], c: 1, why: 'Moving straight toward the lens changes both elements almost equally.' },
    ],
    sources: [SRC.sr501, SRC.sr501guide, SRC.ds],
  },
];

export const MODULES = { 1: 'Module 1 — Getting started', 2: 'Module 2 — Inputs & outputs', 3: 'Module 3 — Light & sound', 4: 'Module 4 — Sensors' };

export const COMING_SOON = [
  'Servo motor', 'DC motor with a driver', 'Relay module',
  'I²C & Qwiic: Modulino® Thermo (temperature + humidity)', 'I²C displays',
  'Linux side: Python + Bridge', 'Wi-Fi web dashboard', 'Final IoT project',
];

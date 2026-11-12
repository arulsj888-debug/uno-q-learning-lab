// Lessons for the ESP32 DevKit V1 (DOIT-style board). Facts come from the Espressif ESP32 datasheet v5.3 (DS), the ESP32-WROOM-32
// datasheet v3.8 (MOD), the Arduino-ESP32 documentation (AE), Random Nerd Tutorials (RNT) and espboards.dev (EB). Code: ./code.js.
import { E32_BLINK, E32_EXT_LED, E32_BUTTON, E32_POT, E32_FADE, E32_SCAN, E32_CONNECT, E32_WEB, E32_TOUCH, E32_SLEEP, E32_BLE, E32_RGB, E32_DHT, E32_JOY, E32_ENC, E32_LCD, E32_OLED, E32_NEO, E32_QSW, E32_MOSW, E32_DIODE, E32_MILLIS, E32_HTTP } from './code.js';

const SRC = {
  ds: { t: 'Espressif ESP32 Series Datasheet v5.3', u: 'https://documentation.espressif.com/esp32_datasheet_en.pdf' },
  mod: { t: 'Espressif ESP32-WROOM-32 Datasheet v3.8', u: 'https://documentation.espressif.com/esp32-wroom-32_datasheet_en.pdf' },
  rnt: { t: 'Random Nerd Tutorials: Getting Started with the ESP32', u: 'https://randomnerdtutorials.com/getting-started-with-esp32/' },
  rntpin: { t: 'Random Nerd Tutorials: ESP32 Pinout Reference', u: 'https://randomnerdtutorials.com/esp32-pinout-reference-gpios/' },
  eb: { t: 'espboards.dev: ESP32 30-pin DevKit (generic)', u: 'https://www.espboards.dev/esp32/esp32-30pin-devkit-generic/' },
  adc: { t: 'Arduino-ESP32 documentation: ADC (analogRead)', u: 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/adc.html' },
  ledc: { t: 'Arduino-ESP32 documentation: LEDC (PWM)', u: 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/ledc.html' },
  idf: { t: 'ESP-IDF documentation: ADC oneshot mode driver', u: 'https://docs.espressif.com/projects/esp-idf/en/v5.2/esp32/api-reference/peripherals/adc_oneshot.html' },
  wifiscan: { t: 'Arduino-ESP32 library: WiFiScan example', u: 'https://github.com/espressif/arduino-esp32/blob/master/libraries/WiFi/examples/WiFiScan/WiFiScan.ino' },
  wifihello: { t: 'Arduino-ESP32 library: WebServer HelloServer example (WiFi.begin, status, localIP)', u: 'https://github.com/espressif/arduino-esp32/blob/master/libraries/WebServer/examples/HelloServer/HelloServer.ino' },
  webserver: { t: 'Arduino-ESP32 library: WebServer.h (on, begin, handleClient, send, sendHeader)', u: 'https://github.com/espressif/arduino-esp32/blob/master/libraries/WebServer/src/WebServer.h' },
  rnttouch: { t: 'Random Nerd Tutorials: ESP32 Touch Pins (touchRead)', u: 'https://randomnerdtutorials.com/esp32-touch-pins-arduino-ide/' },
  rntsleep: { t: 'Random Nerd Tutorials: ESP32 Deep Sleep and wake-up sources', u: 'https://randomnerdtutorials.com/esp32-deep-sleep-arduino-ide-wake-up-sources/' },
  sleepex: { t: 'Arduino-ESP32 library: DeepSleep TimerWakeUp example', u: 'https://github.com/espressif/arduino-esp32/blob/master/libraries/ESP32/examples/DeepSleep/TimerWakeUp/TimerWakeUp.ino' },
  blewrite: { t: 'Arduino-ESP32 BLE library: Write example (BLEDevice, BLEServer, characteristic callbacks)', u: 'https://github.com/espressif/arduino-esp32/blob/master/libraries/BLE/examples/Write/Write.ino' },
  dhtguide: { t: 'Adafruit: DHT11, DHT22 and AM2302 Sensors (specifications, wiring)', u: 'https://learn.adafruit.com/dht' },
  dhtlib: { t: 'Adafruit DHT sensor library (DHTtester example)', u: 'https://github.com/adafruit/DHT-sensor-library' },
  ky023: { t: 'KY-023 dual-axis joystick module (espboards.dev)', u: 'https://www.espboards.dev/sensors/ky-023' },
  ky040: { t: 'KY-040 rotary encoder (Joy-IT sensor kit)', u: 'https://sensorkit.joy-it.net/en/sensors/ky-040' },
  ar: { t: 'Arduino-ESP32 documentation: ADC (analogRead)', u: 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/adc.html' },
  lcdi2c: { t: 'I²C LCD1602 documentation (SunFounder): PCF8574 backpack, address 0x27 / 0x3F, LiquidCrystal_I2C', u: 'https://docs.sunfounder.com/projects/sf-components/en/latest/component_i2c_lcd.html' },
  ssd1306: { t: 'Adafruit SSD1306 library (examples: begin(SSD1306_SWITCHCAPVCC, 0x3C))', u: 'https://github.com/adafruit/Adafruit_SSD1306' },
  wire: { t: 'Arduino-ESP32 documentation: I²C (Wire)', u: 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/i2c.html' },
  neouber: { t: 'Adafruit NeoPixel Überguide: Powering NeoPixels', u: 'https://learn.adafruit.com/adafruit-neopixel-uberguide/powering-neopixels' },
  neolib: { t: 'Adafruit_NeoPixel library (examples: strandtest)', u: 'https://github.com/adafruit/Adafruit_NeoPixel' },
  pn2222: { t: 'onsemi PN2222 / PN2222A datasheet (TO-92: emitter, base, collector; 600 mA; VCE(sat) 0.3 V at 150 mA / 15 mA)', u: 'https://www.onsemi.com/pdf/datasheet/pn2222-d.pdf' },
  irlz44n: { t: 'Infineon IRLZ44NPbF datasheet (TO-220: gate, drain, source; 55 V; RDS(on) 22 mΩ at 10 V, 25 mΩ at 5 V, 35 mΩ at 4 V; VGS(th) 1.0 to 2.0 V; VGS ±16 V)', u: 'https://www.infineon.com/assets/row/public/documents/24/49/infineon-irlz44npbf-datasheet-en.pdf' },
  d1n4007: { t: 'Vishay 1N4001 to 1N4007 datasheet (average forward current 1 A; forward voltage 1.1 V at 1 A; up to 1000 V reverse for the 1N4007; the band marks the cathode)', u: 'https://www.vishay.com/docs/88503/1n4001.pdf' },
  millis: { t: 'Arduino reference: millis() (milliseconds since the program started)', u: 'https://docs.arduino.cc/language-reference/en/functions/time/millis/' },
  bwd: { t: 'Arduino example: Blink Without Delay', u: 'https://docs.arduino.cc/built-in-examples/digital/BlinkWithoutDelay/' },
  httpc: { t: 'Arduino-ESP32 HTTPClient example: BasicHttpClient', u: 'https://github.com/espressif/arduino-esp32/tree/master/libraries/HTTPClient/examples/BasicHttpClient' },
  httpmdn: { t: 'MDN: HTTP response status codes', u: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' },
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
// RGB LED (common cathode) on GPIO16 / 17 / 18 and DHT22 on GPIO4 with a 10 kOhm pull-up (female-male wires from the board pins)
const RGB_PARTS = [
  { id: 'rgb1', type: 'rgbled', row: 'e', col: 10 },
  { id: 'r1', type: 'resistor', a: 'a10', b: 'a16' },
  { id: 'r2', type: 'resistor', a: 'a12', b: 'a17' },
  { id: 'r3', type: 'resistor', a: 'a13', b: 'a18' },
  { id: 'w50', type: 'fwire', from: 'G16', to: 'b16', color: 'red', lift: 22 },
  { id: 'w51', type: 'fwire', from: 'G17', to: 'b17', color: 'green', lift: 26 },
  { id: 'w52', type: 'fwire', from: 'G18', to: 'b18', color: 'blue', lift: 30 },
  { id: 'w53', type: 'fwire', from: 'GND2', to: 'a11', color: 'black', lift: 18 },
];
const RGB_IDS = RGB_PARTS.map(d => d.id);
const DHT_PARTS = [
  { id: 'dht1', type: 'dht', model: 'dht22', row: 'e', col: 10 },
  { id: 'w60', type: 'fwire', from: '3V3', to: 'a10', color: 'red', lift: 16 },
  { id: 'w61', type: 'fwire', from: 'G4', to: 'a11', color: 'yellow', lift: 24 },
  { id: 'w62', type: 'fwire', from: 'GND2', to: 'a13', color: 'black', lift: 20 },
  { id: 'r60', type: 'resistor', a: 'c10', b: 'c16' },
  { id: 'w63', type: 'wire', from: 'b11', to: 'b16', color: 'orange', lift: 12 },
];
const DHT_IDS = DHT_PARTS.map(d => d.id);
// joystick (VRx GPIO34, VRy GPIO35, SW GPIO17, powered from 3V3) and rotary encoder (CLK GPIO16, DT GPIO17, SW GPIO18)
const JOY_PARTS_E = [
  { id: 'joy1', type: 'joystick', row: 'g', col: 10 },
  { id: 'w70', type: 'fwire', from: 'GND2', to: 'j10', color: 'black', lift: 18 },
  { id: 'w71', type: 'fwire', from: '3V3', to: 'j11', color: 'red', lift: 22 },
  { id: 'w72', type: 'fwire', from: 'G34', to: 'j12', color: 'green', lift: 26 },
  { id: 'w73', type: 'fwire', from: 'G35', to: 'j13', color: 'blue', lift: 30 },
  { id: 'w74', type: 'fwire', from: 'G17', to: 'j14', color: 'yellow', lift: 34 },
];
const JOY_IDS_E = JOY_PARTS_E.map(d => d.id);
const ENC_PARTS_E = [
  { id: 'enc1', type: 'encoder', row: 'g', col: 10 },
  { id: 'w80', type: 'fwire', from: 'G16', to: 'j10', color: 'green', lift: 18 },
  { id: 'w81', type: 'fwire', from: 'G17', to: 'j11', color: 'blue', lift: 22 },
  { id: 'w82', type: 'fwire', from: 'G18', to: 'j12', color: 'yellow', lift: 26 },
  { id: 'w83', type: 'fwire', from: '3V3', to: 'j13', color: 'red', lift: 30 },
  { id: 'w84', type: 'fwire', from: 'GND2', to: 'j14', color: 'black', lift: 34 },
];
const ENC_IDS_E = ENC_PARTS_E.map(d => d.id);
// I2C displays on the desk: the module pins go to breadboard holes a10..a13 and the board pins to b10..b13 (male header pins on both sides)
const dispE = (type, id, vcc, order, firstWire) => [{ id, type, x: 20, z: 138 },
  ...order.map((n, i) => ({ id: 'm' + firstWire + i, type: 'fwire', from: id + '.' + n, to: 'a' + (10 + i), color: { GND: 'black', VCC: 'red', SDA: 'blue', SCL: 'yellow' }[n], lift: 16 + i * 2 })),
  ...order.map((n, i) => ({ id: 'w' + firstWire + i, type: 'fwire', from: { GND: 'GND2', VCC: vcc, SDA: 'G21', SCL: 'G22' }[n], to: 'b' + (10 + i), color: { GND: 'black', VCC: 'red', SDA: 'blue', SCL: 'yellow' }[n], lift: 22 + i * 3 }))];
const LCD_PARTS_E = dispE('lcd1602', 'lcd1', 'VIN', ['GND', 'VCC', 'SDA', 'SCL'], 9);
const LCD_IDS_E = LCD_PARTS_E.map(d => d.id);
const OLED_PARTS_E = dispE('oled', 'oled1', '3V3', ['GND', 'VCC', 'SCL', 'SDA'], 8);
const OLED_IDS_E = OLED_PARTS_E.map(d => d.id);
// NeoPixel strip on the desk: leads to breadboard holes a10..a12, board pins (VIN, GPIO16, GND) to b10..b12
const NEO_PARTS_E = [
  { id: 'neo1', type: 'neopixel', x: 35, z: 140 },
  { id: 'l60', type: 'lead', from: 'neo1.VCC', to: 'a10', color: 'red', lift: 20 },
  { id: 'l61', type: 'lead', from: 'neo1.DIN', to: 'a11', color: 'yellow', lift: 24 },
  { id: 'l62', type: 'lead', from: 'neo1.GND', to: 'a12', color: 'black', lift: 28 },
  { id: 'w60', type: 'fwire', from: 'VIN', to: 'b10', color: 'red', lift: 22 },
  { id: 'w61', type: 'fwire', from: 'G16', to: 'b11', color: 'yellow', lift: 26 },
  { id: 'w62', type: 'fwire', from: 'GND2', to: 'b12', color: 'black', lift: 30 },
];
const NEO_IDS_E = NEO_PARTS_E.map(d => d.id);
// PN2222A low-side switch for a 6 V lamp: 470 ohm base resistor from GPIO16, battery pack and lamp on the desk
const Q_PARTS_E = [
  { id: 'q1', type: 'npn', row: 'e', col: 10 },
  { id: 'r1', type: 'resistor', a: 'a11', b: 'a15', ohms: 470 },
  { id: 'w100', type: 'fwire', from: 'G16', to: 'b15', color: 'yellow', lift: 24 },
  { id: 'w101', type: 'fwire', from: 'GND2', to: 'b10', color: 'black', lift: 18 },
  { id: 'bat1', type: 'battery', x: 125, z: 12 },
  { id: 'lamp1', type: 'lamp', x: 165, z: -26 },
  { id: 'l100', type: 'lead', from: 'bat1.POS', to: 'lamp1.L1', color: 'red', lift: 14 },
  { id: 'l101', type: 'lead', from: 'lamp1.L2', to: 'c12', color: 'orange', lift: 18 },
  { id: 'l102', type: 'lead', from: 'bat1.NEG', to: 'c10', color: 'black', lift: 20 },
];
const Q_IDS_E = Q_PARTS_E.map(d => d.id);
// IRLZ44N low-side switch for a 6 V lamp: 220 ohm gate resistor from GPIO16, 10 k pull-down, battery pack and lamp on the desk
const M_PARTS_E = [
  { id: 'q1', type: 'mosfet', row: 'e', col: 10 },
  { id: 'r1', type: 'resistor', a: 'a5', b: 'a10', ohms: 220 },
  { id: 'w100', type: 'fwire', from: 'G16', to: 'b5', color: 'yellow', lift: 24 },
  { id: 'r2', type: 'resistor', a: 'd10', b: 'd12', ohms: 10000 },
  { id: 'w102', type: 'fwire', from: 'GND2', to: 'b12', color: 'black', lift: 18 },
  { id: 'bat1', type: 'battery', x: 125, z: 12 },
  { id: 'lamp1', type: 'lamp', x: 165, z: -26 },
  { id: 'l100', type: 'lead', from: 'bat1.POS', to: 'lamp1.L1', color: 'red', lift: 14 },
  { id: 'l101', type: 'lead', from: 'lamp1.L2', to: 'c11', color: 'orange', lift: 18 },
  { id: 'l102', type: 'lead', from: 'bat1.NEG', to: 'c12', color: 'black', lift: 20 },
];
const M_IDS_E = M_PARTS_E.map(d => d.id);
// two LED branches behind 1N4007 diodes, the second diode turned round
const D_PARTS_E = [
  { id: 'w1', type: 'fwire', from: 'G16', to: 'a10', color: 'yellow', lift: 14 },
  { id: 'r1', type: 'resistor', a: 'c10', b: 'c13', ohms: 100 },
  { id: 'd1', type: 'diode', a: 'b13', k: 'b17' },
  { id: 'led1', type: 'led', anode: 'c17', cathode: 'c18' },
  { id: 'w2', type: 'fwire', from: 'GND2', to: 'a18', color: 'black', lift: 10 },
  { id: 'w3', type: 'wire', from: 'b10', to: 'b21', color: 'orange', lift: 12 },
  { id: 'r2', type: 'resistor', a: 'c21', b: 'c24', ohms: 100 },
  { id: 'd2', type: 'diode', a: 'b28', k: 'b24' },
  { id: 'led2', type: 'led', anode: 'c28', cathode: 'c29' },
  { id: 'w4', type: 'wire', from: 'b18', to: 'b29', color: 'black', lift: 12 },
];
const D_IDS_E = D_PARTS_E.map(d => d.id);
const TOUCH_PARTS = [...LED_CIRCUIT, { id: 'w8', type: 'fwire', from: 'G4', to: 'a30', color: 'green', lift: 30 }];
const TOUCH_IDS = TOUCH_PARTS.map(d => d.id);

export const E32_MODULES = { 1: 'Module 1 — Getting started', 2: 'Module 2 — Inputs and PWM', 3: 'Module 3 — Wi-Fi', 4: 'Module 4 — Touch', 5: 'Module 5 — Saving power', 6: 'Module 6 — Bluetooth', 7: 'Module 7 — Light and climate', 8: 'Module 8 — Controls', 9: 'Module 9 — Displays', 10: 'Module 10 — Switching loads', 11: 'Module 11 — Timing' };
export const E32_COMING = [];

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
        body: `<ul><li>Every GPIO works at <b>3.3 V</b>. The chip reads a level above about <b>2.5 V</b> (0.75 × 3.3 V = 2.475 V) as HIGH and below about <b>0.8 V</b> (0.25 × 3.3 V = 0.825 V) as LOW (datasheet). In between, the reading is undefined.</li>
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
  // ================================================================== 8
  {
    id: 'e8', num: 8, module: 3, title: 'Scan for Wi-Fi networks', level: 'Beginner', time: '12 min',
    goal: 'Use the ESP32’s built-in Wi-Fi to list the networks around you with their signal strength.',
    hardware: ['ESP32 DevKit V1', 'Micro-USB cable'],
    code: E32_SCAN, file: 'WiFiScan.ino', program: 'e_scan', fast: true, widgets: ['wifiscan'],
    explain: {
      3: '<b>setup()</b> runs once.',
      4: 'Serial output on (115200).',
      5: '<b>WiFi.mode(WIFI_STA)</b>: <b>station</b> mode. The ESP32 behaves like a phone or laptop: it can join a network. (The other mode, access point, makes a network of its own.)',
      8: '<b>loop()</b> repeats forever.',
      9: 'Announce the scan.',
      10: '<b>WiFi.scanNetworks()</b> listens on the Wi-Fi channels and returns how many networks it heard. It takes a moment.',
      11: 'Print the count…',
      12: '…and the word “networks found”.',
      13: 'Go through the list: network number 0, 1, 2 …',
      14: 'Print the number in the list (starting at 1).',
      16: '<b>WiFi.SSID(i)</b>: the <b>name</b> of network number i.',
      18: '<b>WiFi.RSSI(i)</b>: signal strength in <b>dBm</b>. A number closer to 0 is a stronger signal (−45 is strong, −85 is weak).',
      20: '<b>WiFi.encryptionType(i)</b> tells how the network is protected. <code>WIFI_AUTH_OPEN</code> means no password.',
      22: '<b>scanDelete()</b> frees the memory that holds the scan result.',
      23: 'Wait 5 seconds, then scan again.',
    },
    steps: [
      { title: 'What we do', view: 'home', power: false,
        body: `<p>The ESP32 has a <b>Wi-Fi radio</b> and an antenna built in. In this lesson it only <b>listens</b>: it scans for networks and prints their names and signal strength. Nothing is wired: just the USB cable.</p>
        <p class="tip">Random Nerd Tutorials use the same idea as the first test of a new ESP32 (the <b>WiFiScan</b> example). It is a good way to check that the antenna and the radio work.</p>` },
      { title: 'What the ESP32 can hear', view: 'home', focus: 'antenna',
        body: `<ul><li>The ESP32-WROOM-32 supports <b>Wi-Fi 802.11 b/g/n</b> in the <b>2.4 GHz</b> band (datasheet: channel centre frequencies 2412–2484 MHz).</li><li>Networks that exist <b>only at 5 GHz</b> are invisible to this board.</li><li>The antenna is the zig-zag track on the module: keep metal away from it.</li></ul>` },
      { title: 'Plug in and read the sketch', view: 'home', power: true, action: 'ensurePower', showCode: true,
        body: `<p>Adapted from the <b>WiFiScan</b> example of the Arduino-ESP32 library, shortened. Click any line. Remember: no password and no wiring are needed to <i>scan</i>.</p>` },
      { title: 'Run it & change the signal', view: 'home', power: true, showCode: true, action: 'run',
        body: `<p>Press <b>▶ Run</b>. Every 5 seconds the Serial Monitor lists the networks. Use the slider to move the signal of <b>HomeNet</b> from strong to weak and see the number change.</p>
        <p class="sim">The networks are <b>made up</b> for this demo; a real scan shows the networks around <i>you</i>. A scan takes about 1.5 seconds in the simulation.</p>` },
      { title: 'Reading the results', view: 'home', power: true, showCode: true,
        body: `<table class="kv"><tr><th>RSSI</th><th>Meaning (rough guide)</th></tr><tr><td>−30 … −55 dBm</td><td>strong</td></tr><tr><td>−55 … −75 dBm</td><td>usable</td></tr><tr><td>−75 … −90 dBm</td><td>weak, connections may drop</td></tr></table>
        <p>The numbers are a rule of thumb: the exact limits depend on the device.</p>
        <p><b>open</b> = no password (anyone can join, and anyone nearby can read the traffic). <b>secured</b> = needs a password.</p>` },
      { title: 'Summary', view: 'home', power: true,
        body: `<ul><li><code>WiFi.mode(WIFI_STA)</code> = station mode (join networks).</li><li><code>WiFi.scanNetworks()</code> returns the number of networks; <code>SSID(i)</code>, <code>RSSI(i)</code>, <code>encryptionType(i)</code> describe each one.</li><li>The ESP32 hears only 2.4 GHz networks.</li></ul>` },
    ],
    quiz: [
      { q: 'WiFi.mode(WIFI_STA) puts the ESP32 in…', a: ['Access-point mode', 'Station mode: it can join a network', 'Deep sleep', 'Bluetooth mode'], c: 1, why: 'STA = station, like a phone that joins a router.' },
      { q: 'Which RSSI is the strongest signal?', a: ['−85 dBm', '−60 dBm', '−45 dBm', '−90 dBm'], c: 2, why: 'The closer to 0, the stronger.' },
      { q: 'Your router only broadcasts at 5 GHz. Will the ESP32-WROOM-32 see it?', a: ['Yes', 'No: the module supports 2.4 GHz only', 'Only with the BOOT button held', 'Only at night'], c: 1, why: 'The module supports 802.11 b/g/n in the 2.4 GHz band.' },
      { q: 'What does WIFI_AUTH_OPEN mean?', a: ['The network has no password', 'The network is faster', 'The network is hidden', 'The network is 5 GHz'], c: 0, why: 'Open networks need no password.' },
    ],
    sources: [SRC.wifiscan, SRC.mod, SRC.ds],
  },
  // ================================================================== 9
  {
    id: 'e9', num: 9, module: 3, title: 'Connect to your Wi-Fi', level: 'Beginner', time: '15 min',
    goal: 'Join your router with WiFi.begin(), wait for WL_CONNECTED, and read the IP address the router gives the ESP32.',
    hardware: ['ESP32 DevKit V1', 'Micro-USB cable', 'Your Wi-Fi name and password'],
    code: E32_CONNECT, file: 'WiFiConnect.ino', program: 'e_connect', fast: true, widgets: ['wifirouter'],
    explain: {
      3: 'The <b>name</b> of your network (SSID).',
      4: 'The <b>password</b>. Never share a sketch or post it online with your real password in it.',
      6: '<b>setup()</b> runs once.',
      7: 'Serial output on (115200).',
      8: 'Station mode (Lesson 8).',
      9: '<b>WiFi.begin(ssid, password)</b> starts joining the network. It returns at once: joining takes a moment.',
      10: 'Tell the user what is going on.',
      11: '<b>WiFi.status()</b> tells how far the connection is. <code>WL_CONNECTED</code> means we are in. Until then, we wait here.',
      12: 'Wait half a second, then ask again.',
      13: 'Show that we are still waiting.',
      15: 'The loop ended: we are connected.',
      16: '<b>WiFi.localIP()</b> is the <b>IP address</b> that the router gave to the ESP32. Other devices use it to talk to the ESP32.',
      19: 'loop() is empty: this sketch only connects.',
    },
    steps: [
      { title: 'What we do', view: 'home', power: false,
        body: `<p>The ESP32 joins your <b>router</b> like a phone does. Afterwards it has an <b>IP address</b>, and can talk to other devices on your network, or to the Internet.</p>
        <div class="ptree"><div class="pt-row"><span class="pt in">ESP32: WiFi.begin(name, password)</span></div><div class="pt-arrow">↓ radio</div><div class="pt-row"><span class="pt">Router checks the password</span></div><div class="pt-arrow">↓ gives an IP address</div><div class="pt-row"><span class="pt bus">ESP32 is on your network</span></div></div>` },
      { title: 'What the router gives you: an IP address', view: 'home',
        body: `<p>Every device on a network needs an <b>IP address</b>, like a house number. The router hands one out automatically (this is called <b>DHCP</b>). At home it usually looks like <code>192.168.x.x</code>. The ESP32 prints it with <code>WiFi.localIP()</code>.</p>
        <p class="sim">In this simulation the router gives <code>192.168.1.42</code>. Yours will be different.</p>` },
      { title: 'Plug in and read the sketch', view: 'home', power: true, action: 'ensurePower', showCode: true,
        body: `<p>Click every line. Replace <code>ssid</code> and <code>password</code> with your own values on a real board.</p>
        <p class="warn">Do not publish sketches that contain your real Wi-Fi password.</p>` },
      { title: 'Run it: success', view: 'home', power: true, showCode: true, action: 'run',
        body: `<p>Press <b>▶ Run</b>. The ESP32 prints “Still connecting…” while the router accepts it (about 2.5 seconds here), then the IP address.</p>
        <p class="sim">The router is simulated.</p>` },
      { title: 'Run it: what can go wrong?', view: 'home', power: true, showCode: true, action: 'ensurePower',
        body: `<p>First use the buttons in the panel: switch the <b>router OFF</b>, or choose a <b>wrong password</b>. Then press <b>▶ Run</b>. (To change the router again, press <b>■ Stop</b> first.)</p>
        <ul><li><b>Router off / name wrong:</b> the ESP32 cannot find the network.</li><li><b>Wrong password:</b> the router refuses it.</li></ul>
        <p>In both cases <code>WiFi.status()</code> never becomes <code>WL_CONNECTED</code>, so <b>this sketch waits forever</b> and keeps printing “Still connecting…”. Real programs add a time limit and print a hint.</p>
        <p class="tip">Check the name and password letter by letter: capitals matter.</p>` },
      { title: 'Summary', view: 'home', power: true,
        body: `<ul><li><code>WiFi.mode(WIFI_STA)</code>, <code>WiFi.begin(ssid, password)</code>, then wait until <code>WiFi.status() == WL_CONNECTED</code>.</li><li><code>WiFi.localIP()</code> is the address the router gave the ESP32.</li><li>Wrong name or password = it never connects.</li></ul>` },
    ],
    quiz: [
      { q: 'WiFi.begin(ssid, password) …', a: ['Waits until the ESP32 is connected', 'Starts joining and returns at once', 'Makes a new network', 'Turns the radio off'], c: 1, why: 'It only starts the connection; the sketch checks WiFi.status() afterwards.' },
      { q: 'The password is wrong. What happens in this sketch?', a: ['It connects anyway', 'It never reaches WL_CONNECTED and keeps waiting', 'The ESP32 resets', 'It prints the right password'], c: 1, why: 'The while loop ends only when the status is WL_CONNECTED.' },
      { q: 'What is the IP address for?', a: ['It lets other devices on the network find the ESP32', 'It powers the board', 'It sets the Wi-Fi channel', 'It is the password'], c: 0, why: 'Like a house number: devices use it to send data to the ESP32.' },
      { q: 'Who gives the ESP32 its IP address at home?', a: ['The router (DHCP)', 'The USB cable', 'The BOOT button', 'The blue LED'], c: 0, why: 'Routers hand out addresses automatically with DHCP.' },
    ],
    sources: [SRC.wifihello, SRC.rnt, SRC.ds],
  },
  // ================================================================== 10
  {
    id: 'e10', num: 10, module: 3, title: 'A web page served by the ESP32: switch the LED from your phone', level: 'Intermediate', time: '25 min',
    goal: 'Run a small web server on the ESP32 so that a phone on the same Wi-Fi can switch the LED on and off.',
    hardware: ['ESP32 DevKit V1 with the Lesson 4 LED circuit (GPIO16)', 'A phone or computer on the same Wi-Fi'],
    code: E32_WEB, file: 'LedServer.ino', program: 'e_web', fast: true, widgets: ['piweb'],
    circuit: LED_CIRCUIT, io: { G16: IO_LED },
    explain: {
      1: '<b>WiFi.h</b>: the Wi-Fi functions of Lesson 9.',
      2: '<b>WebServer.h</b>: the small web-server library of the ESP32 Arduino core.',
      4: 'Your network name…',
      5: '…and password (use your own).',
      6: 'The LED from Lesson 4 on GPIO16.',
      7: 'Remembers whether the LED is on, so the page can show it.',
      9: '<b>WebServer server(80)</b>: a web server that listens on <b>port 80</b>, the standard port of normal web pages. That is why you do not have to type a port in the address.',
      11: 'The function that builds the <b>main page</b>.',
      12: 'Turn the true/false value into the word ON or OFF.',
      13: '<b>server.send(200, "text/html", …)</b> sends the page: status 200 means “OK”, the content is HTML with a heading and two links.',
      16: 'Called when the browser asks for <b>/on</b>.',
      17: 'Remember: the LED is on.',
      18: '<b>digitalWrite(ledPin, HIGH)</b>: GPIO16 to 3.3 V, the real LED lights.',
      19: 'Tell the browser to go back to the main page (the <b>Location</b> header)…',
      20: '…with status 303 (“see other”). The page then shows “LED is ON”.',
      23: 'Called when the browser asks for <b>/off</b>.',
      24: 'Remember: the LED is off.',
      25: 'GPIO16 to 0 V: the LED goes out.',
      26: 'Go back to the main page…',
      27: '…with status 303.',
      30: '<b>setup()</b> runs once.',
      31: 'GPIO16 is an output.',
      32: 'Serial output on (115200).',
      33: 'Station mode.',
      34: 'Start joining the network (Lesson 9).',
      35: 'Wait here until the router has accepted the ESP32.',
      36: 'Wait half a second, then check again.',
      38: 'Tell the user where to point the browser…',
      39: '…the IP address of the ESP32.',
      40: '<b>server.on("/", handleRoot)</b>: connect the address <b>/</b> to the function handleRoot.',
      41: 'Address <b>/on</b> → handleOn.',
      42: 'Address <b>/off</b> → handleOff.',
      43: '<b>server.begin()</b> starts the server.',
      46: '<b>loop()</b> repeats forever.',
      47: '<b>server.handleClient()</b> checks whether a browser has asked for a page and, if so, runs the matching function. Without this line nothing is answered.',
    },
    steps: [
      { title: 'What we build', view: 'bench', have: LED_IDS, power: false,
        body: `<p>The ESP32 will <b>serve a web page</b> — like a tiny website. Your phone opens it in its browser and taps a link; the ESP32 switches the real LED.</p>
        <div class="ptree"><div class="pt-row"><span class="pt in">Phone browser</span></div><div class="pt-arrow">↓ Wi-Fi: “give me /on”</div><div class="pt-row"><span class="pt">ESP32: WebServer</span></div><div class="pt-arrow">↓ digitalWrite(16, HIGH)</div><div class="pt-row"><span class="pt bus">LED on GPIO16</span></div></div>
        <p>The wiring is the one from Lesson 4. Only the program is new.</p>` },
      { title: 'Server and browser', view: 'bench', have: LED_IDS,
        body: `<table class="kv"><tr><th></th><th>Runs on</th><th>Job</th></tr><tr><td><b>Web server</b></td><td>the ESP32</td><td>waits for requests, runs your function, sends back a page</td></tr><tr><td><b>Browser</b></td><td>your phone / computer</td><td>asks for an address, draws the page</td></tr></table>
        <p>The browser asks for an address like <code>http://&lt;ip-address&gt;/on</code>. After the <b>IP address</b> of the ESP32 (Lesson 9) comes the <b>route</b> (<code>/on</code>). Your sketch decides what each route does.</p>
        <p class="tip">The ESP32 prints its IP address in the Serial Monitor when it has connected. The phone must be on the <b>same Wi-Fi</b>.</p>` },
      { title: 'Plug in and read the sketch', view: 'bench', have: LED_IDS, power: true, showCode: true, action: 'ensurePower',
        body: `<p>Click every line. Each <code>server.on(…)</code> line connects an <b>address</b> to the function that answers it. Put your own network name and password in lines 4–5 on a real board.</p>` },
      { title: 'Run it', view: 'bench', have: LED_IDS, showCode: true, power: true, action: 'run', phone: true,
        body: `<p>The <b>phone</b> appears at the bottom right of the 3D view. Press <b>▶ Run</b> (this starts the server), wait for “Open http://…” in the Serial Monitor, then <b>tap “Turn on”</b> and <b>“Turn off”</b>.</p>
        <ol><li>The tap asks the ESP32 for <code>/on</code>.</li><li><code>handleOn()</code> runs and the real LED lights.</li><li>The ESP32 sends the browser back to the main page, now saying “LED is ON”.</li></ol>
        <p>Before you press Run the phone shows <b>“can’t reach this page”</b>: nothing answers yet.</p>
        <p class="sim">Simulated: no real network is used here.</p>` },
      { title: 'Safety: keep it on your network', view: 'bench', have: LED_IDS, power: true,
        body: `<p class="warn"><b>Anyone on your Wi-Fi who knows the address can switch the LED.</b> The page has no password.</p>
        <ul><li>Do not make this page reachable from the Internet.</li><li>Do not use a page like this to control anything dangerous (heaters, mains power).</li><li>Opening a link that changes something is simple but not how professional sites work: anything that opens the link switches the LED, even a browser that pre-loads pages.</li></ul>` },
      { title: 'Summary', view: 'bench', have: LED_IDS, power: true,
        body: `<ul><li>A <b>WebServer</b> on the ESP32 answers browsers; <code>server.on("/on", handleOn)</code> connects an address to a function.</li><li><code>server.handleClient()</code> in <code>loop()</code> does the answering.</li><li>Port 80 is the default web port; the IP address comes from the Serial Monitor.</li></ul>` },
    ],
    quiz: [
      { q: 'What does server.on("/on", handleOn) do?', a: ['Switches the LED on at once', 'Connects the address /on to the function handleOn', 'Starts Wi-Fi', 'Prints the IP address'], c: 1, why: 'It registers which function answers the address /on.' },
      { q: 'What happens if loop() does not call server.handleClient()?', a: ['Nothing is answered: the page never loads', 'The LED stays on', 'The ESP32 restarts', 'Nothing changes'], c: 0, why: 'handleClient() is what checks for and answers browser requests.' },
      { q: 'WebServer server(80): what is 80?', a: ['The IP address', 'The port: the standard port for web pages', 'The LED pin', 'The baud rate'], c: 1, why: 'Port 80 is the default for http, so you do not need to type it.' },
      { q: 'Where do you read the address to type in the phone?', a: ['On the module', 'In the Serial Monitor (WiFi.localIP())', 'On the LED', 'In the Boards Manager'], c: 1, why: 'The sketch prints “Open http://…” with the IP address.' },
      { q: 'What should you avoid?', a: ['Using the page on your home Wi-Fi', 'Exposing it to the Internet or using it for dangerous loads', 'Using GPIO16', 'Using the Serial Monitor'], c: 1, why: 'The page has no password: anyone who can reach it can use it.' },
    ],
    sources: [SRC.wifihello, SRC.webserver, SRC.rnt, SRC.ds],
  },

  // ================================================================== 11
  {
    id: 'e11', num: 11, module: 4, title: 'Touch sensor: switch an LED by touching a wire', level: 'Beginner', time: '15 min',
    goal: 'Use the ESP32’s built-in capacitive touch input with touchRead() and a threshold.',
    hardware: ['Lesson 4 LED circuit (LED on GPIO16)', '1 × female–male jumper wire (the touch pad)'],
    code: E32_TOUCH, file: 'TouchRead.ino', program: 'e_touch', widgets: ['touch'],
    circuit: TOUCH_PARTS, io: { G16: IO_LED, G4: { kind: 'touch', item: 'w8', needs: TOUCH_IDS } },
    explain: {
      2: '<b>touchPin = 4</b>: GPIO4 is the touch input <b>T0</b>. Other touch pins: see the next steps.',
      3: 'The LED from Lesson 4 on GPIO16.',
      4: 'The threshold. Below this number the sketch says “touched”. Tune it for your own wire.',
      7: 'Serial output on (115200).',
      8: 'GPIO16 drives the LED.',
      11: '<b>loop()</b> repeats forever.',
      12: '<b>touchRead(4)</b> measures how easily the pin charges. A finger on the wire adds capacitance, and the number goes <b>down</b>.',
      13: 'Print the number so you can see it change.',
      14: 'Smaller than the threshold → a finger is touching.',
      15: 'Touched → LED on.',
      17: 'Not touched → LED off.',
      19: 'Read twice per second.',
    },
    steps: [
      { title: 'What you need', view: 'bench', have: LED_IDS,
        body: `<p>Keep the LED circuit from Lesson 4. Add <b>one jumper wire</b> from <b>GPIO4</b> to an empty breadboard hole. The wire itself is your touch pad.</p>` },
      { title: 'Touch without a button', view: 'bench', pins: ['G4'],
        body: `<p>Some ESP32 pins can sense a <b>finger</b> with no button at all. The chip measures the pin’s <b>capacitance</b>: a finger near or on the wire changes it, and <code>touchRead()</code> returns a smaller number.</p>
        <p>The original ESP32 has <b>10</b> touch inputs, <b>T0 – T9</b>. GPIO4 is <b>T0</b> and GPIO2 is <b>T2</b>.</p>
        <p class="warn">In the Arduino IDE, <b>GPIO32 and GPIO33 are swapped</b>: T8 is GPIO32 and T9 is GPIO33 (Random Nerd Tutorials). Avoid <b>GPIO0</b> for touch: it is pulled high on the board and can read a constant value.</p>` },
      { title: 'Step 1 — wire the touch pad', view: 'bench', power: false, have: [...LED_IDS, 'w8'], pins: ['G4'],
        body: `<p>Green wire: pin <b>D4</b> (GPIO4, right row) → <b>a30</b>. The free end in the board is just a bare metal contact: touch the wire.</p>` },
      { title: 'The code', view: 'bench', showCode: true, have: [...LED_IDS, 'w8'],
        body: `<p>Read the touch value; if it is below the <b>threshold</b>, switch the LED on.</p>` },
      { title: 'Run it & touch the wire', view: 'bench', showCode: true, power: true, action: 'run', have: [...LED_IDS, 'w8'],
        body: `<p>Press <b>▶ Run</b>, then hold <b>Touch the wire</b> in the panel. The number drops and the LED switches on.</p>
        <p class="sim">The numbers are <b>illustrative</b>. Random Nerd Tutorials reports above 70 untouched and below 10 touched on their board; your board and wire will differ, so always print the values first and choose your own threshold.</p>` },
      { title: 'Summary', view: 'bench', have: [...LED_IDS, 'w8'], power: true,
        body: `<ul><li><code>touchRead(pin)</code>: <b>smaller</b> = closer finger.</li><li>Choose the threshold by printing the values with and without a touch.</li><li>Touch pins can also wake the ESP32 from deep sleep.</li></ul>` },
    ],
    quiz: [
      { q: 'A finger touches the wire. touchRead() returns…', a: ['A bigger number', 'A smaller number', 'Always 0', 'HIGH'], c: 1, why: 'A finger adds capacitance and the reading goes down.' },
      { q: 'Which pin is T0?', a: ['GPIO0', 'GPIO2', 'GPIO4', 'GPIO16'], c: 2, why: 'T0 is GPIO4 and T2 is GPIO2.' },
      { q: 'How do you choose the threshold?', a: ['Always 20', 'Print values with and without a touch, then pick a number between', 'Always 100', 'Use analogRead'], c: 1, why: 'Every board and wire gives different numbers.' },
      { q: 'Why not use GPIO0 for touch?', a: ['It has no pin', 'It is pulled high on the board and can read a constant value', 'It is 5 V', 'It is output only'], c: 1, why: 'RNT recommends another touch pin.' },
    ],
    sources: [SRC.rnttouch, SRC.rntpin, SRC.ds],
  },

  // ================================================================== 12
  {
    id: 'e12', num: 12, module: 5, title: 'Deep sleep: save power and wake up on a timer', level: 'Intermediate', time: '15 min',
    goal: 'Put the ESP32 into deep sleep, wake it with a timer, and keep a counter across the sleep.',
    hardware: ['Lesson 4 LED circuit (LED on GPIO16)'],
    code: E32_SLEEP, file: 'TimerWakeUp.ino', program: 'e_sleep', widgets: ['sleep'],
    circuit: LED_CIRCUIT, io: { G16: IO_LED },
    explain: {
      2: 'A <b>conversion factor</b>: the sleep time is given in <b>microseconds</b>.',
      3: 'Sleep for 5 seconds.',
      4: 'The LED shows when the ESP32 is awake.',
      5: '<b>RTC_DATA_ATTR</b> puts the variable in <b>RTC memory</b>. That memory stays powered during deep sleep, so the number survives. A normal variable would start from 0 again.',
      7: 'After every wake-up the program starts again here, as after a reset.',
      8: 'Serial output on (115200).',
      9: 'GPIO16 drives the LED.',
      10: 'Awake: LED on.',
      11: 'Count the starts.',
      12: 'Print the boot number.',
      13: 'Ask why the chip started. If it was the timer, the answer is ESP_SLEEP_WAKEUP_TIMER.',
      14: 'Printed only after a timer wake-up, not after the first start.',
      16: 'Stay awake for 2 seconds so you can see the LED.',
      17: 'Tell the chip to wake up after 5 seconds (5 × 1 000 000 µs).',
      18: 'Say goodbye.',
      19: 'Wait until all the text has left the serial port.',
      20: '<b>esp_deep_sleep_start()</b>: the CPU, most of the RAM and the digital peripherals are powered off. Only the RTC controller, RTC peripherals and RTC memory stay on. Nothing after this line runs.',
    },
    steps: [
      { title: 'What you need', view: 'bench', have: LED_IDS,
        body: `<p>The LED circuit from Lesson 4 (LED on GPIO16). The LED will show <b>when the ESP32 is awake</b>.</p>` },
      { title: 'Why deep sleep?', view: 'bench',
        body: `<p>A board on a battery cannot run at full speed all day. In <b>deep sleep</b> the CPU, most of the RAM and all the digital peripherals are <b>powered off</b>. Only the RTC controller, the RTC peripherals and the RTC memory stay on (Arduino-ESP32 example).</p>
        <p>The ESP32 datasheet lists about <b>10 µA</b> for the chip in deep sleep with RTC memory on. That is the chip alone: a <b>complete DevKit board uses more</b> (USB chip, voltage regulator, power LED), so a battery project usually needs a bare module or a low-power board.</p>
        <p class="warn">After a deep sleep the program starts again at the beginning of <code>setup()</code>, like after a reset. <code>loop()</code> is never reached in this sketch.</p>` },
      { title: 'How the ESP32 wakes up', view: 'bench',
        body: `<ul><li><b>Timer</b> — after a set time (this lesson)</li><li><b>Touch pin</b> — a finger on a touch pad (Lesson 11)</li><li><b>External pin</b> — ext0 / ext1: a level on RTC GPIOs</li><li><b>ULP co-processor</b></li></ul>
        <p>Only <b>RTC GPIOs</b> can wake the chip from an external pin.</p>` },
      { title: 'The code', view: 'bench', showCode: true, have: LED_IDS,
        body: `<p>Click lines 5, 13, 17 and 20 to see what they do. <b>RTC_DATA_ATTR</b> is the important trick: it keeps the boot counter alive during the sleep.</p>` },
      { title: 'Run it and watch it sleep', view: 'bench', showCode: true, power: true, action: 'run', have: LED_IDS,
        body: `<p>Press <b>▶ Run</b>. The LED lights for 2 seconds, then the ESP32 sleeps for 5 seconds (LED off), wakes up and prints a higher <b>Boot number</b>.</p>
        <p class="sim">In deep sleep the digital pins are powered down, so the LED goes dark. The simulation shows the timing; the real board’s USB serial connection may behave differently when the chip wakes up.</p>` },
      { title: 'Summary', view: 'bench', have: LED_IDS, power: true,
        body: `<ul><li><code>esp_sleep_enable_timer_wakeup(µs)</code> + <code>esp_deep_sleep_start()</code>.</li><li>After wake-up, <code>setup()</code> runs again.</li><li><code>RTC_DATA_ATTR</code> variables survive; normal variables do not.</li><li>Pressing the EN (reset) button clears RTC memory.</li></ul>` },
    ],
    quiz: [
      { q: 'What runs after the ESP32 wakes up from deep sleep?', a: ['loop() continues where it stopped', 'setup() runs again from the start', 'Nothing, it stays asleep', 'The next line after esp_deep_sleep_start()'], c: 1, why: 'Deep sleep powers off the CPU and most RAM: the program restarts like after a reset.' },
      { q: 'How do you keep a counter across deep sleep?', a: ['int count = 0;', 'RTC_DATA_ATTR int count = 0;', 'const int count = 0;', 'It is impossible'], c: 1, why: 'RTC memory stays powered during deep sleep.' },
      { q: 'esp_sleep_enable_timer_wakeup() takes the time in…', a: ['seconds', 'milliseconds', 'microseconds', 'minutes'], c: 2, why: 'That is why the sketch multiplies seconds by 1 000 000.' },
      { q: 'Why does a whole DevKit board use more current than the chip’s datasheet value?', a: ['The chip lies', 'The board also has a USB chip, regulator and LED that stay powered', 'Wi-Fi is always on', 'The antenna'], c: 1, why: 'Only the chip is switched down; the other parts on the board are not.' },
    ],
    sources: [SRC.rntsleep, SRC.sleepex, SRC.ds],
  },

  // ================================================================== 13
  {
    id: 'e13', num: 13, module: 6, title: 'Bluetooth LE: switch the LED from a phone app', level: 'Intermediate', time: '25 min',
    goal: 'Make the ESP32 a Bluetooth Low Energy server with one characteristic that a phone app writes to.',
    hardware: ['Lesson 4 LED circuit (LED on GPIO16)', 'A phone with a BLE scanner app (simulated here)'],
    code: E32_BLE, file: 'BLE_Write.ino', program: 'e_ble', widgets: ['ble'],
    circuit: LED_CIRCUIT, io: { G16: IO_LED },
    explain: {
      1: 'The BLE library of the Arduino-ESP32 core.',
      5: 'The <b>service UUID</b>: a long unique number that names our service. You can generate your own.',
      6: 'The <b>characteristic UUID</b>: names the one value inside the service.',
      7: 'The LED from Lesson 4 on GPIO16.',
      9: 'A class with <b>callbacks</b>: functions the library calls when something happens to the characteristic.',
      10: '<b>onWrite</b> runs every time the phone writes a new value.',
      11: 'Read the value the phone wrote (text).',
      12: 'Did the phone write the text “1”?',
      13: 'Yes → LED on.',
      14: 'Print it.',
      15: 'Did it write “0”?',
      16: 'Yes → LED off.',
      17: 'Print it.',
      22: '<b>setup()</b> runs once.',
      23: 'Serial output on (115200).',
      24: 'GPIO16 drives the LED.',
      25: 'Start Bluetooth LE. <b>“ESP32-LED”</b> is the name phones will see.',
      26: 'The ESP32 becomes a <b>server</b>: it offers data, the phone (the client) connects to it.',
      27: 'Create our service.',
      28: 'Create the characteristic inside the service. The phone may <b>read</b> and <b>write</b> it.',
      29: 'Connect the onWrite callback to the characteristic.',
      30: 'Start value “0”.',
      31: 'Start the service.',
      32: 'Get the advertising object.',
      33: '<b>Start advertising</b>: the ESP32 now sends small radio packets that say “I am ESP32-LED”. Phones find it in a scan.',
      34: 'Tell the user.',
      37: '<b>loop()</b> has nothing to do: the library calls onWrite by itself.',
      38: 'Just wait.',
    },
    steps: [
      { title: 'What you need', view: 'bench', have: LED_IDS,
        body: `<p>The LED circuit from Lesson 4, and a phone with a <b>BLE scanner app</b> (for example nRF Connect). In this lesson the phone app is <b>simulated</b>.</p>` },
      { title: 'What is Bluetooth LE?', view: 'bench', focus: 'antenna',
        body: `<p><b>Bluetooth Low Energy (BLE)</b> is made for sending small amounts of data with very little power. The ESP32 supports Bluetooth v4.2 with LE (module datasheet). It uses the same antenna and the same 2.4 GHz band as Wi-Fi.</p>
        <table class="kv"><tr><th>Role</th><th>Who</th><th>Does what</th></tr><tr><td>Server</td><td>ESP32</td><td><b>advertises</b> its name and offers data</td></tr><tr><td>Client</td><td>Phone</td><td>scans, connects, reads and writes</td></tr></table>` },
      { title: 'Services and characteristics', view: 'bench',
        body: `<div class="ptree"><div class="pt-row"><span class="pt bus">Server: “ESP32-LED”</span></div><div class="pt-arrow">│</div><div class="pt-row"><span class="pt">Service (UUID 4fafc201-…)</span></div><div class="pt-arrow">│</div><div class="pt-row"><span class="pt">Characteristic (UUID beb5483e-…) = “0” or “1” · READ, WRITE</span></div></div>
        <p>BLE data is organised like folders: a <b>service</b> groups <b>characteristics</b>, and a characteristic holds one <b>value</b>. Each has a <b>UUID</b>, a long unique number. The phone writes “1” or “0” into our characteristic.</p>` },
      { title: 'The code', view: 'bench', showCode: true, have: LED_IDS,
        body: `<p>Based on the <b>Write</b> example of the BLE library. Click lines 10, 25, 28 and 33.</p><p class="tip">A BLE sketch is large. If the upload says the sketch is too big, choose a partition scheme with more app space in the Tools menu.</p>` },
      { title: 'Run it', view: 'bench', have: LED_IDS, showCode: true, power: true, action: 'run', phone: true,
        body: `<p>Press <b>▶ Run</b>. When the Serial Monitor says “Advertising as ESP32-LED”, the phone app finds the board.</p>
        <ol><li>Tap <b>Connect</b> on the phone.</li><li>Tap <b>Write “1”</b>: the LED turns on.</li><li>Tap <b>Write “0”</b>: the LED turns off.</li></ol>
        <p class="sim">The phone app is simulated. In a real app, choose to write the value as <b>text</b> (UTF-8), not as a hex byte.</p>` },
      { title: 'Good to know', view: 'bench', have: LED_IDS, power: true, phone: true,
        body: `<ul><li>This characteristic has <b>no protection</b>: any phone nearby can connect and write to it. Fine for learning, not for a door lock.</li><li>BLE reaches some metres; walls and bodies reduce it.</li><li>Stop the sketch: the phone loses the connection.</li></ul>` },
      { title: 'Summary', view: 'bench', have: LED_IDS, power: true, phone: true,
        body: `<ul><li>ESP32 = BLE <b>server</b>; phone = <b>client</b>.</li><li>Server → service → characteristic → value; each named by a UUID.</li><li><code>onWrite</code> runs when the phone writes; advertising makes the board visible.</li></ul>` },
    ],
    quiz: [
      { q: 'In this lesson the ESP32 is the BLE…', a: ['client', 'server', 'router', 'scanner'], c: 1, why: 'It offers a service; the phone connects as the client.' },
      { q: 'What makes the ESP32 show up in the phone’s scan?', a: ['Serial.begin', 'Advertising', 'The LED', 'Wi-Fi'], c: 1, why: 'pAdvertising->start() sends the packets phones look for.' },
      { q: 'Where does the value “1” go when the phone writes it?', a: ['Into the service name', 'Into the characteristic', 'Into the UUID', 'Into loop()'], c: 1, why: 'A characteristic holds the value; onWrite reads it.' },
      { q: 'Which function runs when the phone writes a value?', a: ['loop()', 'setup()', 'onWrite()', 'delay()'], c: 2, why: 'The library calls the onWrite callback.' },
      { q: 'Why is this sketch not safe for a door lock?', a: ['BLE is too slow', 'Anyone nearby can connect and write: there is no protection', 'The LED is too weak', 'It uses GPIO16'], c: 1, why: 'The characteristic has no pairing or encryption.' },
    ],
    sources: [SRC.blewrite, SRC.mod, SRC.rnt],
  },

  // ================================================================== 14
  {
    id: 'e14', num: 14, module: 7, title: 'RGB LED: mix any colour with LEDC PWM', level: 'Beginner', time: '20 min',
    goal: 'Drive the three dice of an RGB LED with three LEDC PWM pins and see why green and blue are dim on 3.3 V.',
    hardware: ['ESP32 DevKit V1', 'Breadboard', 'RGB LED (common cathode, 4 legs)', '3 × 220 Ω resistors', '4 × female–male jumper wires'],
    code: E32_RGB, file: 'RGB_LED.ino', program: 'e_rgb', widgets: [],
    circuit: RGB_PARTS, io: { G16: { kind: 'rgb', ch: 0, item: 'rgb1', needs: RGB_IDS }, G17: { kind: 'rgb', ch: 1, item: 'rgb1', needs: RGB_IDS }, G18: { kind: 'rgb', ch: 2, item: 'rgb1', needs: RGB_IDS } },
    explain: {
      2: 'GPIO16 drives the <b>red</b> die.',
      3: 'GPIO17 drives the <b>green</b> die.',
      4: 'GPIO18 drives the <b>blue</b> die.',
      6: 'Our own function: three brightness values set the colour.',
      7: '<b>ledcWrite(pin, 0 … 255)</b>: the PWM duty cycle with 8-bit resolution (Arduino-ESP32 core 3.x).',
      8: 'Green…',
      9: '…and blue.',
      12: '<b>setup()</b> runs once.',
      13: '<b>ledcAttach(pin, 5000, 8)</b>: PWM at 5 kHz with 8-bit resolution on this pin. The ESP32 can use almost any output pin for PWM.',
      14: 'Green pin.',
      15: 'Blue pin.',
      18: '<b>loop()</b> repeats forever.',
      19: 'Red only.',
      21: 'Green only.',
      23: 'Blue only.',
      25: 'Red + green = <b>yellow</b>.',
      27: 'All three = <b>white</b>.',
      29: 'All off.',
    },
    steps: [
      { title: 'One LED, three colours', view: 'bench', have: [], power: false,
        body: `<p>An <b>RGB LED</b> has a red, a green and a blue LED in one housing, with <b>four legs</b>: red, the <b>common</b> leg (the longest), green, blue. In a <b>common-cathode</b> LED the common leg goes to <b>GND</b>. Your eye mixes the light: red + green = yellow, green + blue = cyan, red + blue = magenta, all three = white.</p>` },
      { title: 'Each colour needs a resistor — and 3.3 V is little', view: 'breadboard', have: ['rgb1'], power: false, holes: ['e10 · red', 'e11 · common', 'e12 · green', 'e13 · blue'],
        body: `<p>Push the LED into <b>e10 – e13</b>. Every colour needs its own series resistor (220 Ω here).</p>
        <p class="warn">The ESP32 pin gives <b>3.3 V</b>. Red needs about 2.0 V, but green and blue need about <b>3.0 V</b> or more (typical values: check your datasheet). With 220 Ω the green and blue dice get only about 1 mA or less, so they look <b>much dimmer</b> than red. For a bright mix use smaller resistors for green and blue, or power the LED from a supply with a transistor.</p>` },
      { title: 'Step 1 — three resistors', view: 'breadboard', have: ['rgb1', 'r1', 'r2', 'r3'], power: false, holes: ['a10 → a16', 'a12 → a17', 'a13 → a18'],
        body: `<p>Resistors from each colour leg to a free column: <b>a10 → a16</b> (red), <b>a12 → a17</b> (green), <b>a13 → a18</b> (blue).</p>` },
      { title: 'Step 2 — wires to GPIO16, 17, 18 and GND', view: 'bench', have: RGB_IDS, pins: ['G16', 'G17', 'G18', 'GND2'],
        body: `<ul><li>Red: <b>RX2</b> (GPIO16) → <b>b16</b></li><li>Green: <b>TX2</b> (GPIO17) → <b>b17</b></li><li>Blue: <b>D18</b> (GPIO18) → <b>b18</b></li><li>Black: <b>GND</b> (right row) → <b>a11</b> (the common leg)</li></ul>` },
      { title: 'The code', view: 'bench', have: RGB_IDS, showCode: true, power: true,
        body: `<p><code>ledcAttach(pin, frequency, resolution)</code> sets up PWM; <code>ledcWrite(pin, duty)</code> sets the brightness (core 3.x). Click lines 7, 13 and 25.</p>` },
      { title: 'Run it', view: 'bench', have: RGB_IDS, showCode: true, power: true, action: 'run',
        body: `<p>The LED shows red, green, blue, yellow, white and off, one second each. Notice how dim the blue and the green are next to the red.</p>
        <p class="sim">Simulated brightness from the duty cycle and the typical forward voltages above (red 2.0 V, green 3.0 V, blue 3.1 V).</p>` },
      { title: 'Summary', view: 'bench', have: RGB_IDS, power: true,
        body: `<ul><li>RGB LED = three LEDs with one common leg (cathode to GND).</li><li>One resistor per colour; <code>ledcAttach</code> + <code>ledcWrite</code> on any output pin.</li><li>On 3.3 V the green and blue dice get far less current than red: choose the resistors accordingly.</li></ul>` },
    ],
    quiz: [
      { q: 'Which function sets the brightness of a pin in Arduino-ESP32 core 3.x?', a: ['analogWrite only', 'ledcWrite(pin, duty)', 'digitalWrite(pin, 128)', 'pinMode(pin, PWM)'], c: 1, why: 'ledcAttach() sets up the pin, ledcWrite() sets the duty.' },
      { q: 'Why are green and blue dim on 3.3 V with 220 Ω?', a: ['They are broken', 'Their forward voltage (about 3 V) is close to 3.3 V, so little current flows', 'The ESP32 has no PWM', 'The resistor is too small'], c: 1, why: 'I = (3.3 − Vf) ÷ R is only about 1 mA or less for the green and blue dice.' },
      { q: 'You set red = 255, green = 0, blue = 255. The colour is…', a: ['Cyan', 'Yellow', 'Magenta', 'White'], c: 2, why: 'Red + blue = magenta.' },
      { q: 'How many resistors?', a: ['One', 'Two', 'Three, one per colour', 'None'], c: 2, why: 'Each colour is a separate LED.' },
    ],
    sources: [SRC.ledc, SRC.ds],
  },
  // ================================================================== 15
  {
    id: 'e15', num: 15, module: 7, title: 'DHT22: temperature and humidity on one wire', level: 'Intermediate', time: '20 min',
    goal: 'Wire a DHT22 from 3.3 V with its pull-up resistor and read temperature and humidity with the Adafruit DHT library.',
    hardware: ['ESP32 DevKit V1', 'Breadboard', 'DHT22 sensor (4 pins)', '10 kΩ resistor', '3 × female–male jumper wires', '1 × jumper wire'],
    code: E32_DHT, file: 'DHT_read.ino', program: 'e_dht', fast: true, widgets: ['pisens'], sdaWire: 'w61', dht: true,
    circuit: DHT_PARTS, io: { G4: { kind: 'dht', item: 'dht1', needs: DHT_IDS } },
    explain: {
      1: 'The library by Adafruit: install <b>“DHT sensor library”</b> (and <b>Adafruit Unified Sensor</b>) from the Library Manager.',
      3: 'The DATA wire is on <b>GPIO4</b>.',
      4: 'The sensor type: DHT22 (white).',
      6: 'Create the sensor object.',
      8: '<b>setup()</b> runs once.',
      9: 'Serial output on (115200).',
      10: 'Start the sensor library.',
      13: '<b>loop()</b> repeats forever.',
      14: 'The DHT22 is slow: at most one reading every 2 seconds.',
      15: 'Relative humidity in %.',
      16: 'Temperature in °C.',
      17: 'A failed read gives <b>NaN</b>.',
      18: 'Tell the user.',
      19: 'Try again later.',
      21: 'Print the label…',
      22: '…the humidity…',
      24: '…the temperature…',
      25: '…and the unit.',
    },
    steps: [
      { title: 'The DHT22', view: 'breadboard', have: ['dht1'], power: false, holes: ['e10 · VCC', 'e11 · DATA', 'e12 · not connected', 'e13 · GND'],
        body: `<p>The <b>DHT22</b> (also called AM2302) sends temperature and humidity on <b>one data wire</b>. Four pins (grille facing you, from the left): <b>1 VCC, 2 DATA, 3 not connected, 4 GND</b>.</p>
        <ul><li>Power: <b>3 V to 5 V</b>.</li><li>Humidity <b>0 – 100 %</b> (2 – 5 % accuracy), temperature <b>−40 – 80 °C</b> (±0.5 °C), at most <b>one reading every 2 seconds</b> (Adafruit).</li></ul>
        <p class="tip">A 3-pin <b>module</b> has the pull-up resistor on its board, but its pin order differs between makers: read the printing.</p>` },
      { title: 'The pull-up resistor and the 3.3 V rule', view: 'bench', have: [],
        body: `<p>The sensor can pull DATA low but not high: a <b>pull-up resistor</b> (10 kΩ in the Adafruit example) joins DATA and VCC.</p>
        <p class="warn">The pull-up goes to the <b>same supply as VCC</b>. Power the sensor from <b>3V3</b>, never from VIN: from 5 V the DATA line is pulled up to <b>5 V</b>, and an ESP32 pin is <b>3.3 V only</b>.</p>` },
      { title: 'Step 1 — the sensor and the resistor', view: 'breadboard', have: ['dht1', 'r60', 'w63'], power: false, holes: ['c10 · resistor', 'c16 · resistor'],
        body: `<p>Sensor in <b>e10 – e13</b>. The <b>10 kΩ resistor</b> goes from <b>c10</b> (VCC column) to <b>c16</b>; a jumper from <b>b11</b> (DATA column) to <b>b16</b> completes the pull-up.</p>` },
      { title: 'Step 2 — power, data and ground', view: 'bench', have: DHT_IDS, pins: ['3V3', 'G4', 'GND2'],
        body: `<ul><li>Red: <b>3V3</b> → <b>a10</b> (VCC)</li><li>Yellow: <b>D4</b> (GPIO4) → <b>a11</b> (DATA)</li><li>Black: <b>GND</b> → <b>a13</b></li></ul>` },
      { title: 'The code', view: 'bench', have: DHT_IDS, showCode: true, power: true, body: `<p>Shortened from Adafruit’s <b>DHTtester</b> example. Click lines 14, 17 and 22.</p>` },
      { title: 'Run it', view: 'bench', have: DHT_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Every 2 seconds the Serial Monitor prints humidity and temperature. <b>Move the sliders</b> and watch the numbers follow.</p><p class="sim">Simulated values within the DHT22 specification (−40 – 80 °C, 0 – 100 %RH).</p>` },
      { title: 'What if the data wire is loose?', view: 'bench', have: DHT_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Stop, press <b>“Unplug the DATA wire”</b> and run again: no reading arrives, the library returns NaN and the Serial Monitor shows:</p><pre class="tree">Failed to read from DHT sensor!</pre><p>Check the three wires and the <b>pull-up resistor</b>.</p>` },
      { title: 'Summary', view: 'bench', have: DHT_IDS, power: true,
        body: `<ul><li>VCC, DATA, (NC), GND; DATA needs a pull-up to VCC; power from 3V3 on the ESP32.</li><li><code>DHT dht(pin, DHT22)</code>, <code>dht.begin()</code>, <code>readHumidity()</code>, <code>readTemperature()</code>; <code>isnan()</code> = failed read.</li><li>DHT22: one reading per 2 seconds.</li></ul>` },
    ],
    quiz: [
      { q: 'Why power the DHT from 3V3 on an ESP32?', a: ['It is brighter', 'With 5 V the pulled-up DATA line reaches 5 V, too high for an ESP32 pin', 'The DHT needs 3.3 V exactly', 'VIN has no ground'], c: 1, why: 'The pull-up goes to VCC, and ESP32 pins are 3.3 V only.' },
      { q: 'How often may you read a DHT22?', a: ['1000 times per second', 'At most once every 2 seconds', 'Only at start-up', 'Once a day'], c: 1, why: 'Adafruit: no more than 0.5 Hz for the DHT22.' },
      { q: 'readTemperature() returns NaN. Meaning?', a: ['0 °C', 'The read failed', 'It is hot', 'The pin is an output'], c: 1, why: 'NaN = not a number: no valid reading.' },
      { q: 'What does the pull-up resistor do?', a: ['Cools the sensor', 'Holds DATA high when nobody pulls it low', 'Measures humidity', 'Limits LED current'], c: 1, why: 'The sensor can only pull the line low.' },
    ],
    sources: [SRC.dhtguide, SRC.dhtlib, SRC.ds],
  },

  // ================================================================== 16
  {
    id: 'e16', num: 16, module: 8, title: 'Analog joystick: two axes and a button', level: 'Beginner', time: '15 min',
    goal: 'Read the two analog axes of a joystick module with analogRead() and its push switch with INPUT_PULLUP.',
    hardware: ['ESP32 DevKit V1', 'Breadboard', 'Analog joystick module (KY-023 style)', '5 × jumper wires (female–male for the board pins)'],
    code: E32_JOY, file: 'Joystick.ino', program: 'e_joy', fast: true, widgets: ['joy'],
    circuit: JOY_PARTS_E, io: { G34: { kind: 'joyax', ax: 'x', item: 'joy1', needs: JOY_IDS_E }, G35: { kind: 'joyax', ax: 'y', item: 'joy1', needs: JOY_IDS_E }, G17: { kind: 'joysw', item: 'joy1', needs: JOY_IDS_E } },
    explain: {
      2: '<b>VRx</b> (the left–right axis) goes to an <b>analog input</b>.',
      3: '<b>VRy</b> (the up–down axis) goes to a second analog input.',
      4: 'The push switch <b>SW</b>.',
      6: '<b>setup()</b> runs once.',
      7: 'Serial output on.',
      8: 'The switch connects the pin to GND when the stick is pressed, so use <b>INPUT_PULLUP</b>: released = HIGH, pressed = LOW.',
      11: '<b>loop()</b> repeats forever.',
      12: '<b>analogRead</b> measures the voltage on VRx: 0 … 4095, about 2048 at the centre.',
      13: 'Same for VRy.',
      14: 'Pressed = the pin reads LOW.',
      15: 'Print the label…',
      16: '…the X value…',
      17: '…the label for Y…',
      18: '…the Y value…',
      19: '…the label for the button…',
      20: '…and its state.',
      21: 'Wait 200 ms: five readings per second.',
    },
    steps: [
      { title: 'What is in a joystick module?', view: 'bench', have: [], power: false,
        body: `<p>Moving the stick turns <b>two 10 kΩ potentiometers</b> at 90° to each other. Each one is a voltage divider: its output (<b>VRx</b> or <b>VRy</b>) is a voltage between 0 V and the supply, and about <b>half the supply</b> when the stick is centred. Pushing the stick straight down closes a switch (<b>SW</b>).</p>
        <p>Pins on a common KY-023 module: <b>GND, +5V, VRx, VRy, SW</b>. The order differs on some clones: read the printing, and swap VRx and VRy in the code if the axes are reversed.</p>` },
      { title: 'Power it from the analog reference voltage', view: 'bench', have: [],
        body: `<p>Connect the module’s supply to <b>3.3 V: an ESP32 analog pin is 3.3 V only, so never power the module from VIN (5 V)</b>.</p>
        <p class="tip">The wiper voltage can go up to the supply voltage, and the ADC can only measure up to its own reference.</p>` },
      { title: 'Step 1 — put the module on the breadboard', view: 'breadboard', power: false, have: ['joy1'], holes: ['g10 · GND', 'g11 · VCC', 'g12 · VRx', 'g13 · VRy', 'g14 · SW'],
        body: `<p>Push the five header pins into row <b>g</b>: <b>g10 – g14</b>. The board lies over the breadboard.</p>` },
      { title: 'Step 2 — five wires', view: 'bench', have: JOY_IDS_E, pins: ['3V3', 'G34', 'G35', 'G17', 'GND2'],
        body: `<ul><li>Black: <b>GND → j10</b></li><li>Red: <b>3V3 → j11</b></li><li>Green: <b>D34 (GPIO34) → j12</b> (VRx)</li><li>Blue: <b>D35 (GPIO35) → j13</b> (VRy)</li><li>Yellow: <b>TX2 (GPIO17) → j14</b> (SW)</li></ul>` },
      { title: 'The code', view: 'bench', have: JOY_IDS_E, showCode: true, power: true, body: `<p>Two <code>analogRead()</code> calls and one <code>digitalRead()</code>. Click lines 8, 12 and 14.</p>` },
      { title: 'Run it and move the stick', view: 'bench', have: JOY_IDS_E, showCode: true, power: true, action: 'run',
        body: `<p>Move the <b>X</b> and <b>Y sliders</b> (or hold the button) in the panel: the numbers in the Serial Monitor follow, and the 3D stick tilts.</p><p class="sim">Simulated: 0 … 4095, ideal ADC with a little noise.</p>` },
      { title: 'Summary', view: 'bench', have: JOY_IDS_E, power: true,
        body: `<ul><li>Two potentiometers: VRx and VRy = voltages between 0 V and the supply, about half at the centre.</li><li>Read them with <code>analogRead()</code> on ADC pins; read SW with <code>INPUT_PULLUP</code> (pressed = LOW).</li><li>Power the module so the outputs never exceed what the analog pins accept.</li></ul>` },
    ],
    quiz: [
      { q: 'The stick is centred. About what does analogRead() return?', a: ['0', 'About half of the maximum', 'The maximum', 'Random'], c: 1, why: 'Each axis is a voltage divider: half the supply at the centre.' },
      { q: 'SW is pressed. What does digitalRead() return with INPUT_PULLUP?', a: ['HIGH', 'LOW', '2.5 V', 'Nothing'], c: 1, why: 'The switch connects the pin to GND.' },
      { q: 'The up and down axes are reversed. What is the easiest fix?', a: ['Replace the board', 'Swap VRx and VRy in the code (or the wires)', 'Use a bigger resistor', 'Nothing can be done'], c: 1, why: 'Some modules label the axes differently.' },
      { q: 'Why power the module from the right supply?', a: ['To make it brighter', 'The outputs can reach the supply voltage, which must not exceed what the analog pin accepts', 'It needs no power', 'For the switch only'], c: 1, why: 'The wiper voltage goes up to the supply.' },
    ],
    sources: [SRC.ky023, SRC.ar, SRC.pinmode],
  },

  // ================================================================== 17
  {
    id: 'e17', num: 17, module: 8, title: 'Rotary encoder: count the clicks', level: 'Intermediate', time: '20 min',
    goal: 'Read the two quadrature signals of a rotary encoder and count steps up and down.',
    hardware: ['ESP32 DevKit V1', 'Breadboard', 'Rotary encoder module (KY-040 style)', '5 × jumper wires (female–male for the board pins)'],
    code: E32_ENC, file: 'Encoder.ino', program: 'e_enc', fast: true, widgets: ['enc'],
    circuit: ENC_PARTS_E, io: { G16: { kind: 'enc', role: 'clk', item: 'enc1', needs: ENC_IDS_E }, G17: { kind: 'enc', role: 'dt', item: 'enc1', needs: ENC_IDS_E }, G18: { kind: 'enc', role: 'sw', item: 'enc1', needs: ENC_IDS_E } },
    explain: {
      2: '<b>CLK</b> (channel A) of the encoder.',
      3: '<b>DT</b> (channel B).',
      4: '<b>SW</b>: the push switch under the knob.',
      5: 'The number of steps counted: up for one direction, down for the other.',
      6: 'The last CLK level we saw, to detect a change.',
      8: '<b>setup()</b> runs once.',
      9: 'Serial output on.',
      10: 'The contacts only connect the pins to GND, so the pins need <b>INPUT_PULLUP</b>.',
      13: 'Remember the starting level of CLK.',
      16: '<b>loop()</b> repeats forever.',
      17: 'Read CLK now.',
      18: 'CLK changed and is now LOW: the knob just moved one step.',
      19: 'The other signal DT tells the direction: DT still HIGH → one direction.',
      20: 'DT already LOW → the other direction.',
      21: 'Print the new count.',
      23: 'Remember CLK for the next time.',
      24: 'Is the knob pressed?',
      25: 'Say so.',
      26: 'Wait a moment so one press is not reported many times.',
      28: 'A tiny pause: the sketch polls the pins many times per second.',
    },
    steps: [
      { title: 'How an encoder works', view: 'bench', have: [], power: false,
        body: `<p>A rotary encoder has two contacts, <b>CLK</b> and <b>DT</b>, that close to GND in a <b>shifted pattern</b> as you turn the knob. Counting the pattern <b>11 → 01 → 00 → 10 → 11</b> in one direction, or backwards in the other, tells you how far and which way it turned. A push switch <b>SW</b> is built in.</p>
        <p class="tip">Which direction counts up depends on the module and on how you wired CLK and DT. If it is reversed, swap the two wires or the + and − in the code.</p>` },
      { title: 'Why INPUT_PULLUP?', view: 'bench', have: [],
        body: `<p>The contacts only connect the pins to GND; when open, the pins would float. <b>INPUT_PULLUP</b> holds them HIGH. Descriptions of the KY-040 module disagree about which pins have pull-up resistors on the board, so enable the internal pull-up on all three and your sketch works either way.</p>
        <p class="warn">Connect + to <b>3V3</b> (a module with pull-up resistors to + would otherwise pull the pins above 3.3 V).</p>` },
      { title: 'Step 1 — put the module on the breadboard', view: 'breadboard', power: false, have: ['enc1'], holes: ['g10 · CLK', 'g11 · DT', 'g12 · SW', 'g13 · VCC', 'g14 · GND'],
        body: `<p>Push the five header pins into row <b>g</b>: <b>g10 – g14</b>: CLK, DT, SW, +, GND.</p>` },
      { title: 'Step 2 — five wires', view: 'bench', have: ENC_IDS_E, pins: ['G16', 'G17', 'G18', '3V3', 'GND2'],
        body: `<ul><li>Green: <b>RX2 (GPIO16) → j10</b> (CLK)</li><li>Blue: <b>TX2 (GPIO17) → j11</b> (DT)</li><li>Yellow: <b>D18 (GPIO18) → j12</b> (SW)</li><li>Red: <b>3V3 → j13</b> (+)</li><li>Black: <b>GND → j14</b></li></ul>` },
      { title: 'The code', view: 'bench', have: ENC_IDS_E, showCode: true, power: true, body: `<p>The sketch polls CLK. When CLK has just fallen, DT tells the direction. Click lines 18, 19 and 20.</p>` },
      { title: 'Run it and turn the knob', view: 'bench', have: ENC_IDS_E, showCode: true, power: true, action: 'run',
        body: `<p>Press <b>▶ turn</b> and <b>◀ turn</b> in the panel: each press is one click of the knob. The counter in the Serial Monitor goes up or down, and the CLK and DT levels change one after the other. Hold the knob button to see “Knob pressed”.</p><p class="sim">Simulated contacts without bounce. A real encoder bounces: debounce it in software.</p>` },
      { title: 'Summary', view: 'bench', have: ENC_IDS_E, power: true,
        body: `<ul><li>CLK and DT close to GND in a shifted pattern; the order tells the direction.</li><li>Use <code>INPUT_PULLUP</code> on CLK, DT and SW.</li><li>On a CLK falling edge, read DT: HIGH = one direction, LOW = the other.</li><li>Real contacts bounce: debounce in software.</li></ul>` },
    ],
    quiz: [
      { q: 'What tells you the direction of rotation?', a: ['The speed', 'Which of CLK and DT changes first', 'The SW pin', 'The supply voltage'], c: 1, why: 'The two signals are shifted: the one that changes first shows the direction.' },
      { q: 'Why INPUT_PULLUP on CLK, DT and SW?', a: ['To save power', 'The contacts only connect to GND: the pins would float when open', 'To measure voltage', 'It is not needed'], c: 1, why: 'The pull-up holds the pin HIGH when the contact is open.' },
      { q: 'The count goes down when you turn clockwise. What is an easy fix?', a: ['Replace the encoder', 'Swap CLK and DT (or the + and − in the code)', 'Change the resistor', 'Nothing'], c: 1, why: 'The direction convention depends on the wiring.' },
      { q: 'A real encoder counts too many steps sometimes. Why?', a: ['It is broken', 'The contacts bounce', 'The ADC is slow', 'The knob is loose'], c: 1, why: 'Mechanical contacts bounce: debounce in software.' },
    ],
    sources: [SRC.ky040, SRC.pinmode, SRC.ds],
  },

  // ================================================================== 18
  {
    id: 'e18', num: 18, module: 9, title: 'LCD 16×2: show text over I²C', level: 'Beginner', time: '20 min',
    goal: 'Print text on a 16×2 character LCD with the LiquidCrystal_I2C library, and find out why a display can stay blank.',
    hardware: ['ESP32 DevKit V1', 'LCD 16×2 with I²C backpack (PCF8574)', '4 × jumper wires (male–male for the board pins)'],
    code: E32_LCD, file: 'LCD_I2C.ino', program: 'e_lcd', fast: true, widgets: ['lcdaddr'],
    circuit: LCD_PARTS_E, io: { G21: { kind: 'lcd', scl: 'G22', item: 'lcd1', needs: LCD_IDS_E } },
    explain: {
      1: '<b>Wire.h</b> is the I²C library of the Arduino core.',
      2: 'The LCD library: install <b>LiquidCrystal I2C</b> by Frank de Brabander from the Library Manager.',
      4: 'Create the display object: I²C <b>address 0x27</b>, <b>16</b> columns, <b>2</b> rows. A wrong address shows nothing.',
      6: '<b>setup()</b> runs once.',
      7: '<b>init()</b> starts the LCD (some library versions call it begin()).',
      8: 'Switch the <b>backlight</b> on.',
      9: 'Put the cursor at column 0 of row 0 (the top line).',
      10: 'Print the first line.',
      13: '<b>loop()</b> repeats forever.',
      14: 'Cursor to row 1 (the bottom line).',
      15: 'Print the label…',
      16: '…and the seconds since the start (<b>millis()</b> counts milliseconds).',
      17: 'Wait one second.',
    },
    steps: [
      { title: 'The LCD and its I²C backpack', view: 'dispq', have: ['lcd1'], power: false,
        body: `<p>A 16×2 LCD has <b>16 columns and 2 rows</b> of characters, each drawn from a <b>5 × 8 dot matrix</b>. The small blue board on its back, a <b>PCF8574</b> backpack, turns its many pins into <b>two I²C wires</b>. <b>Click the parts</b> in the 3D view.</p>
        <ul><li>Four pins: <b>GND, VCC, SDA, SCL</b>. The backpack is made for <b>5 V</b>.</li><li>I²C address: usually <b>0x27</b>, on some <b>0x3F</b>.</li><li>The blue trimmer sets the <b>contrast</b>.</li></ul>` },
      { title: 'Wire the four pins', view: 'dispq', have: LCD_IDS_E, power: false, pins: ['GND2', 'VIN', 'G21', 'G22'],
        body: `<ul><li>GND → <b>GND</b></li><li>VCC → <b>VIN</b> (the 5 V from USB)</li><li>SDA → <b>D21</b> (GPIO21), SCL → <b>D22</b> (GPIO22)</li></ul><p class="warn">The ESP32 pins are 3.3 V only. Many backpacks pull SDA and SCL up to VCC (5 V here): check your module or use a level shifter.</p>` },
      { title: 'Install the library', view: 'dispq', have: LCD_IDS_E,
        body: `<p>In the Arduino IDE: <b>Sketch → Include Library → Manage Libraries…</b>, search for <b>LiquidCrystal I2C</b> (Frank de Brabander) and install it.</p>` },
      { title: 'The code', view: 'dispq', have: LCD_IDS_E, showCode: true, power: true, body: `<p>Click lines 4, 7, 9 and 14.</p>` },
      { title: 'Run it', view: 'dispq', have: LCD_IDS_E, showCode: true, power: true, action: 'run',
        body: `<p>The top line shows <b>Hello</b>, and the bottom line counts the seconds. <b>Turn the contrast trimmer</b> in real life if you only see dark blocks.</p><p class="sim">Simulated display: it shows the text the sketch prints.</p>` },
      { title: 'Blank screen? Check the address', view: 'dispq', have: LCD_IDS_E, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Module address”</b> to change it to <b>0x3F</b> and run again. The sketch still talks to 0x27, nobody answers, and the screen shows <b>no text</b>.</p><p>On a real board run an <b>I²C scanner</b> sketch to find the address, then use it in <code>LiquidCrystal_I2C lcd(address, 16, 2)</code>.</p>` },
      { title: 'Summary', view: 'dispq', have: LCD_IDS_E, power: true,
        body: `<ul><li>Backpack: GND, VCC (5 V), SDA, SCL; address 0x27 or 0x3F.</li><li><code>init()</code>, <code>backlight()</code>, <code>setCursor(col, row)</code>, <code>print()</code>.</li><li>Blank screen: wrong address, contrast, or loose wire.</li></ul>` },
    ],
    quiz: [
      { q: 'What does the PCF8574 backpack do?', a: ['Makes the LCD brighter', 'Turns the LCD pins into two I²C wires', 'Stores the text', 'Powers the Arduino'], c: 1, why: 'It is an I²C port expander.' },
      { q: 'The sketch shows nothing on the LCD but the backlight is on. What do you check first?', a: ['The USB cable length', 'The I²C address (0x27 or 0x3F) and the contrast', 'The LED', 'The baud rate'], c: 1, why: 'A wrong address or low contrast is the usual cause.' },
      { q: 'lcd.setCursor(0, 1) moves the cursor to…', a: ['The top line', 'Column 0 of the bottom line', 'Column 1 of the top line', 'The backlight'], c: 1, why: 'setCursor(column, row): row 1 is the second line.' },
      { q: 'The supply of the LCD backpack is…', a: ['3.3 V only', '5 V', '12 V', 'Not needed'], c: 1, why: 'The module is made for 5 V.' },
    ],
    sources: [SRC.lcdi2c, SRC.wire, SRC.ds],
  },

  // ================================================================== 19
  {
    id: 'e19', num: 19, module: 9, title: 'OLED 128×64: draw text with the SSD1306', level: 'Beginner', time: '20 min',
    goal: 'Show text on a small OLED with the Adafruit SSD1306 library, and handle a display that is not found.',
    hardware: ['ESP32 DevKit V1', 'SSD1306 OLED 128×64 (I²C)', '4 × jumper wires (male–male for the board pins)'],
    code: E32_OLED, file: 'OLED_SSD1306.ino', program: 'e_oled', fast: true, widgets: ['oledaddr'],
    circuit: OLED_PARTS_E, io: { G21: { kind: 'oled', scl: 'G22', item: 'oled1', needs: OLED_IDS_E } },
    explain: {
      1: '<b>Wire.h</b>: the I²C library.',
      2: '<b>Adafruit_GFX</b>: drawing functions (text, lines, shapes) shared by many displays.',
      3: '<b>Adafruit_SSD1306</b>: the driver of the SSD1306 chip in the OLED.',
      5: 'Create the display object: <b>128 × 64</b> pixels, the <b>Wire</b> bus, <b>−1</b> = no reset pin.',
      7: '<b>setup()</b> runs once.',
      8: 'Serial output on (for error messages).',
      9: '<b>begin()</b> starts the display at I²C address <b>0x3C</b> and returns <b>false</b> if nobody answers. SWITCHCAPVCC makes the display voltage from the supply.',
      10: 'No answer → tell the user.',
      11: 'Stop here forever.',
      13: 'Empty the screen buffer.',
      14: 'Text size 1 (6 × 8 pixels per character).',
      15: 'White text (on this display: the pixel colour).',
      16: 'Cursor at the top left.',
      17: 'Print a line…',
      18: '…and a second line.',
      19: '<b>display()</b> sends the buffer to the screen. Nothing appears before this call.',
    },
    steps: [
      { title: 'The OLED', view: 'dispq', have: ['oled1'], power: false,
        body: `<p>An <b>OLED</b> makes its own light: every one of its <b>128 × 64 pixels</b> is a tiny LED, so there is no backlight. The <b>SSD1306</b> chip drives it and talks I²C. <b>Click the parts</b> in the 3D view.</p>
        <ul><li>Four pins: <b>GND, VCC, SCL, SDA</b> (the order differs between makers: read the printing).</li><li>Address <b>0x3C</b>, on some modules <b>0x3D</b>.</li><li>Check whether your module accepts 3.3 V, 5 V or both.</li></ul>` },
      { title: 'Wire the four pins', view: 'dispq', have: OLED_IDS_E, power: false, pins: ['GND2', '3V3', 'G22', 'G21'],
        body: `<ul><li>GND → <b>GND</b></li><li>VCC → <b>3V3</b></li><li>SCL → <b>D22</b> (GPIO22), SDA → <b>D21</b> (GPIO21)</li></ul>` },
      { title: 'Install the libraries', view: 'dispq', have: OLED_IDS_E,
        body: `<p>In the Library Manager install <b>Adafruit SSD1306</b> and <b>Adafruit GFX Library</b> (accept the other libraries it asks for).</p>` },
      { title: 'The code', view: 'dispq', have: OLED_IDS_E, showCode: true, power: true, body: `<p>Click lines 5, 9, 17 and 19. Note that nothing is shown until <code>display()</code>.</p>` },
      { title: 'Run it', view: 'dispq', have: OLED_IDS_E, showCode: true, power: true, action: 'run',
        body: `<p>Two lines of text appear on the OLED, drawn from the dot font of the library.</p><p class="sim">Simulated display.</p>` },
      { title: 'What if the display is not found?', view: 'dispq', have: OLED_IDS_E, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Module address”</b> to switch it to <b>0x3D</b> and run again. <code>begin(…, 0x3C)</code> returns false and the Serial Monitor shows:</p><pre class="tree">SSD1306 not found</pre><p>Run an I²C scanner, use the address it reports, and check the four wires.</p>` },
      { title: 'Summary', view: 'dispq', have: OLED_IDS_E, power: true,
        body: `<ul><li><code>Adafruit_SSD1306 display(128, 64, &amp;Wire, -1)</code>, <code>display.begin(SSD1306_SWITCHCAPVCC, 0x3C)</code>.</li><li>Draw into a buffer (<code>setCursor</code>, <code>println</code>), then <code>display.display()</code>.</li><li>“not found” = wrong address or wiring.</li></ul>` },
    ],
    quiz: [
      { q: 'When does the text appear on the OLED?', a: ['At println()', 'After display.display()', 'After begin()', 'Never'], c: 1, why: 'Drawing goes into a buffer; display() sends it to the screen.' },
      { q: 'begin() returns false. What do you check?', a: ['The I²C address and the wires', 'The LED', 'The resistor colours', 'The baud rate only'], c: 0, why: 'Nobody answered at that address.' },
      { q: 'How many pixels does this OLED have?', a: ['16 × 2', '128 × 64', '8 × 8', '320 × 240'], c: 1, why: '128 columns by 64 rows.' },
      { q: 'Why has an OLED no backlight?', a: ['It is broken', 'Each pixel makes its own light', 'It uses sunlight', 'It is always off'], c: 1, why: 'OLED pixels are light-emitting.' },
    ],
    sources: [SRC.ssd1306, SRC.wire, SRC.ds],
  },

  // ================================================================== 20
  {
    id: 'e20', num: 20, module: 9, title: 'NeoPixel strip: one wire, eight colours', level: 'Intermediate', time: '25 min',
    goal: 'Light an 8-pixel NeoPixel strip with the Adafruit_NeoPixel library, and learn the power and data-level rules.',
    hardware: ['ESP32 DevKit V1', 'NeoPixel (WS2812B) strip, 8 pixels', '3 × jumper wires (male–male) and the strip leads', 'Capacitor 500 – 1000 µF (recommended)'],
    code: E32_NEO, file: 'NeoPixel.ino', program: 'e_neo', fast: true, widgets: ['neolevel'], neoLow: true,
    circuit: NEO_PARTS_E, io: { G16: { kind: 'neo', item: 'neo1', needs: NEO_IDS_E } },
    explain: {
      1: 'The library by Adafruit: install <b>Adafruit NeoPixel</b> from the Library Manager.',
      3: 'The data pin (<b>DIN</b> of the strip).',
      4: 'How many pixels the strip has.',
      6: 'Create the strip object: pixel count, pin, <b>NEO_GRB</b> (the colour order of the WS2812B) and <b>NEO_KHZ800</b> (the 800 kHz data speed).',
      8: '<b>setup()</b> runs once.',
      9: 'Start the strip.',
      10: '<b>setBrightness</b> scales every colour: 40 of 255 keeps the current low.',
      11: '<b>show()</b> sends the colours to the pixels: nothing changes on the strip before show().',
      14: '<b>loop()</b> repeats forever.',
      15: 'Go through the pixels 0 … 7.',
      16: 'Clear the colours in memory.',
      17: 'Set pixel <b>i</b> to red: <b>Color(red, green, blue)</b>, each 0 … 255.',
      18: 'Send everything to the strip.',
      19: 'Wait 150 ms: the red dot moves on.',
    },
    steps: [
      { title: 'An addressable LED strip', view: 'dispq', have: ['neo1'], power: false,
        body: `<p>On a <b>NeoPixel</b> (WS2812B) strip every pixel has its own driver chip. The <b>data line</b> carries one colour value for each pixel in turn, so <b>one pin controls the whole strip</b>. <b>Click the parts</b> in the 3D view.</p>
        <ul><li>Three connections: <b>5 V</b>, <b>DIN</b> (data in) and <b>GND</b>.</li><li>Up to <b>60 mA per pixel</b> at full white; about 20 mA per pixel in typical use (Adafruit).</li></ul>` },
      { title: 'Power rules', view: 'dispq', have: ['neo1'],
        body: `<ul><li>Eight pixels at full white can draw <b>480 mA</b>: more than a USB port should be asked for. Keep the <b>brightness low</b> (the sketch uses 40).</li><li>Connect <b>GND first</b> when powering from a bench supply, and add a <b>500 – 1000 µF capacitor</b> across + and − (Adafruit).</li><li>The pixels want about <b>5 V</b>: lower voltages dim them and then give wrong colours; much higher voltages destroy them.</li></ul>` },
      { title: 'Wire the strip', view: 'dispq', have: NEO_IDS_E, power: false, pins: ['VIN', 'G16', 'GND2'],
        body: `<ul><li>Strip VCC → <b>VIN</b> (the 5 V from USB) through the breadboard</li><li>Strip DIN → <b>D16</b> (GPIO16)</li><li>Strip GND → <b>GND</b></li></ul><p class="warn">The ESP32 pin is 3.3 V and the strip is 5 V: see the step about the data level.</p>` },
      { title: 'Install the library', view: 'dispq', have: NEO_IDS_E,
        body: `<p>Library Manager → <b>Adafruit NeoPixel</b> → Install.</p>` },
      { title: 'The 3.3 V data problem', view: 'dispq', have: NEO_IDS_E, power: true,
        body: `<p>The strip runs at <b>5 V</b> and wants its data signal to be at least <b>70 %</b> of that (<b>3.5 V</b>, Adafruit). An ESP32 pin gives only <b>3.3 V</b>: just below. The pixels may then flicker or show wrong colours. The fix is a <b>level shifter</b> between the pin and DIN, or a lower strip supply.</p>
        <p>Use the button in the panel to put a level shifter in the data line, and compare.</p>` },
      { title: 'The code', view: 'dispq', have: NEO_IDS_E, showCode: true, power: true, body: `<p>Click lines 6, 10, 17 and 18. Note that nothing happens on the strip until <code>show()</code>.</p>` },
      { title: 'Run it', view: 'dispq', have: NEO_IDS_E, showCode: true, power: true, action: 'run', body: `<p>A red dot should run along the 8 pixels. Try the <b>level shifter</b> button in the panel (stop the sketch first): without it the strip shows a broken pattern, as it may on real hardware.</p><p class="sim">Simulated strip.</p>` },
      { title: 'Summary', view: 'dispq', have: NEO_IDS_E, power: true,
        body: `<ul><li>5 V, DIN, GND; one data pin for all pixels.</li><li><code>Adafruit_NeoPixel strip(n, pin, NEO_GRB + NEO_KHZ800)</code>, <code>begin()</code>, <code>setPixelColor()</code>, <code>show()</code>.</li><li>Up to 60 mA per pixel: keep the brightness low.</li><li>Data signal at least 70 % of the strip voltage (Adafruit).</li></ul>` },
    ],
    quiz: [
      { q: 'When do the pixels change after setPixelColor()?', a: ['At once', 'After strip.show()', 'After begin()', 'Never'], c: 1, why: 'The colours are kept in memory until show() sends them.' },
      { q: 'How much current can one NeoPixel draw at full white?', a: ['About 1 mA', 'Up to 60 mA', 'About 1 A', 'Exactly 20 mA always'], c: 1, why: 'Adafruit: up to 60 mA with red, green and blue at maximum.' },
      { q: 'The data signal of a 5 V strip should be at least…', a: ['1 V', '70 % of the strip voltage (3.5 V)', '5 V exactly', '12 V'], c: 1, why: 'Adafruit recommends at least 70 % of the pixel voltage.' },
      { q: 'Why keep the brightness low?', a: ['To save the library', 'To limit the current drawn from the supply', 'The strip would melt at once', 'No reason'], c: 1, why: 'The pixels draw current in proportion to their colour and brightness.' },
    ],
    sources: [SRC.neouber, SRC.neolib, SRC.ds],
  },

  // ================================================================== 21
  {
    id: 'e21', num: 21, module: 10, title: 'A transistor switches a lamp', level: 'Intermediate', time: '25 min',
    goal: 'Let a small pin current switch a much bigger load with an NPN transistor, and choose the base resistor.',
    hardware: ['ESP32 DevKit V1', 'PN2222A NPN transistor (TO-92)', 'Resistor (470 Ω)', 'Battery holder 4 × AA (about 6 V) and a 6 V lamp', 'Breadboard and jumper wires'],
    code: E32_QSW, file: 'TransistorSwitch.ino', program: 'e_qsw', fast: true, widgets: ['qbase'], qdefault: 470,
    circuit: Q_PARTS_E, io: { G16: { kind: 'npn', item: 'q1', lamp: 'lamp1', needs: Q_IDS_E } },
    explain: {
      2: 'The pin is wired to the <b>base resistor</b>, which leads to the transistor’s <b>base</b>. The lamp is <b>not</b> connected to the pin.',
      4: '<b>setup()</b> runs once.',
      5: 'The pin is an output.',
      8: '<b>loop()</b> repeats forever.',
      9: 'HIGH: a small current flows through the base resistor into the base. The transistor then lets a much larger current flow from the collector to the emitter: <b>the lamp lights</b>.',
      10: 'Wait one second.',
      11: 'LOW: no base current, the transistor blocks, the lamp is off.',
      12: 'Wait one second.',
    },
    steps: [
      { title: 'Why a transistor?', view: 'farq', have: [], power: false,
        body: `<p>A 6 V lamp needs about <b>300 mA</b>. An ESP32 pin gives up to 40 mA source / 28 mA sink at the strongest drive setting (datasheet). So a pin <b>cannot</b> drive the lamp directly. A <b>transistor</b> is a small electronic switch: a <b>small current into its base</b> lets a <b>big current flow</b> from the collector to the emitter.</p>
        <p class="warn">Never connect a lamp, motor or relay coil straight to a pin.</p>` },
      { title: 'The PN2222A', view: 'bigq', have: ['q1'], power: false, holes: ['e10 · emitter', 'e11 · base', 'e12 · collector'],
        body: `<p>The <b>PN2222A</b> in a TO-92 case. With the <b>flat side facing you</b>, the pins from the left are <b>1 emitter, 2 base, 3 collector</b>. <b>Click it</b> in the 3D view.</p>
        <ul><li>Continuous collector current <b>600 mA</b> (onsemi datasheet).</li><li>Saturation voltage <b>0.3 V</b> at 150 mA collector current with 15 mA of base current.</li></ul>
        <p class="warn">Other versions (for example the P2N2222A) have the pins in another order: <b>collector, base, emitter</b>. Always check the datasheet of your part.</p>` },
      { title: 'The base resistor', view: 'bigq', have: ['q1', 'r1'], power: false, holes: ['a11 → a15'],
        body: `<p>The base-emitter junction is a diode: without a resistor the pin would push far too much current into it. The resistor sets the <b>base current</b>: I = (V<sub>pin</sub> − 0.7 V) ÷ R.</p>
        <p>For a hard switch the datasheet’s saturation figure uses a base current of <b>one tenth</b> of the collector current. For 300 mA that would be 30 mA, more than a pin should give, so this lesson uses a smaller base current: the lamp still lights, and the transistor drops a little more than 0.3 V.</p>` },
      { title: 'Wire it', view: 'farq', have: Q_IDS_E, power: false, pins: ['G16', 'GND2'],
        body: `<ul><li>Yellow: <b>RX2 (GPIO16) → b15</b> (to the base resistor)</li><li>Black: <b>GND → b10</b> (the emitter column)</li></ul>
        <p>The lamp circuit is separate: battery + → lamp → <b>collector</b> (column 12); battery − → the <b>emitter column</b> (column 10), which is also connected to the board’s GND. All the grounds must be joined.</p>` },
      { title: 'The code', view: 'farq', have: Q_IDS_E, showCode: true, power: true, body: `<p>Just a blink: the pin drives the base. Click lines 9 and 11.</p>` },
      { title: 'Run it and change the base resistor', view: 'farq', have: Q_IDS_E, showCode: true, power: true, action: 'run',
        body: `<p>The lamp blinks. In the panel choose another <b>base resistor</b> and watch the numbers: with a small resistor the transistor is <b>saturated</b> (fully on); with <b>100 kΩ</b> only a trickle flows into the base and the lamp gets little or no current.</p><p class="sim">Simplified model: collector current = about 100 × base current, up to what the lamp draws.</p>` },
      { title: 'Summary', view: 'farq', have: Q_IDS_E, power: true,
        body: `<ul><li>A pin drives the <b>base</b> through a resistor; the load goes between the supply and the <b>collector</b>; the <b>emitter</b> goes to GND (low-side switch).</li><li>All grounds joined.</li><li>PN2222A: E, B, C with the flat side toward you; 600 mA continuous.</li><li>Inductive loads (motors, relays) need a flyback diode.</li></ul>` },
    ],
    quiz: [
      { q: 'Why not connect the lamp directly to the pin?', a: ['The lamp is too bright', 'The lamp needs far more current than a pin can give', 'Pins are always LOW', 'Lamps need AC'], c: 1, why: 'A pin supplies only a few tens of mA at most.' },
      { q: 'Which leg of the PN2222A (flat side toward you) is the base?', a: ['The left one', 'The middle one', 'The right one', 'None'], c: 1, why: 'Emitter, base, collector from the left.' },
      { q: 'What does the base resistor do?', a: ['Dims the lamp directly', 'Limits the current into the base', 'Cools the transistor', 'Nothing'], c: 1, why: 'The base-emitter junction is a diode: it needs current limiting.' },
      { q: 'The base resistor is 100 kΩ. What happens?', a: ['The lamp is brighter', 'Too little base current: the lamp stays dark or dim', 'The pin burns', 'Nothing changes'], c: 1, why: 'Collector current is only about 100 times the small base current.' },
    ],
    sources: [SRC.pn2222, SRC.ds, SRC.pinmode],
  },

  // ================================================================== 22
  {
    id: 'e22', num: 22, module: 10, title: 'A MOSFET switches a lamp', level: 'Intermediate', time: '25 min',
    goal: 'Switch a bigger load with a logic-level MOSFET: the gate takes a voltage, not a current.',
    hardware: ['ESP32 DevKit V1', 'IRLZ44N MOSFET (TO-220)', 'Resistors (220 Ω and 10 kΩ)', 'Battery holder 4 × AA (about 6 V) and a 6 V lamp', 'Breadboard and jumper wires'],
    code: E32_MOSW, file: 'MosfetSwitch.ino', program: 'e_qsw', fast: true, widgets: ['mosload'],
    circuit: M_PARTS_E, io: { G16: { kind: 'mosfet', item: 'q1', lamp: 'lamp1', needs: M_IDS_E } },
    explain: {
      2: 'The pin is wired through the <b>gate resistor</b> to the <b>gate</b> of the MOSFET. The lamp is <b>not</b> connected to the pin.',
      4: '<b>setup()</b> runs once.',
      5: 'The pin is an output.',
      8: '<b>loop()</b> repeats forever.',
      9: 'HIGH: the gate gets 3.3 V. The MOSFET turns on and the lamp current flows from the drain to the source: <b>the lamp lights</b>. The gate takes no steady current.',
      10: 'Wait one second.',
      11: 'LOW: the gate goes to 0 V (the 10 kΩ resistor also holds it there). The MOSFET turns off, the lamp is off.',
      12: 'Wait one second.',
    },
    steps: [
      { title: 'A switch controlled by voltage', view: 'farq', have: [], power: false,
        body: `<p>A 6 V lamp needs about <b>300 mA</b>. An ESP32 pin gives up to 40 mA source / 28 mA sink at the strongest drive setting (datasheet). A pin cannot drive it. Last lesson the PN2222A needed a <b>base current</b>. A <b>MOSFET</b> is controlled by the <b>voltage on its gate</b>: the gate takes no steady current, so no base-current calculation is needed.</p>
        <p class="warn">Never connect a lamp, motor or relay coil straight to a pin.</p>` },
      { title: 'The IRLZ44N', view: 'bigq', have: ['q1'], power: false, holes: ['e10 · gate', 'e11 · drain', 'e12 · source'],
        body: `<p>The <b>IRLZ44N</b> in a TO-220 case. With the <b>text facing you</b>, the pins from the left are <b>gate, drain, source</b>. The metal tab is the drain. <b>Click it</b> in the 3D view.</p>
        <ul><li>Maximum <b>55 V</b> between drain and source, <b>47 A</b> continuous (Infineon datasheet).</li><li>Gate threshold <b>1.0 to 2.0 V</b>. The gate must never exceed <b>±16 V</b>.</li><li>It is a <b>logic-level</b> type: on-resistance <b>35 mΩ at 4 V</b>, <b>25 mΩ at 5 V</b> and <b>22 mΩ at 10 V</b> on the gate.</li></ul>
        <p class="warn">The datasheet gives no on-resistance below 4 V. The ESP32 pin gives only <b>3.3 V</b>. The datasheet gives on-resistance values for 4 V and above, and none for 3.3 V: for a small lamp it works, for a big motor it is <b>not guaranteed</b>.</p>` },
      { title: 'Gate resistor and pull-down', view: 'bigq', have: ['q1', 'r1', 'r2'], power: false, holes: ['a5 → a10', 'd10 → d12'],
        body: `<p>The <b>220 Ω resistor</b> between the pin and the gate limits the short current that charges the gate when the pin switches. The <b>10 kΩ resistor</b> from the gate to GND holds the gate at 0 V while the pin is not yet an output (for example during start-up). A floating gate can switch the load by itself.</p>` },
      { title: 'Wire it', view: 'farq', have: M_IDS_E, power: false, pins: ['G16', 'GND2'],
        body: `<ul><li>Yellow: <b>RX2 (GPIO16) → b5</b> (to the 220 Ω gate resistor)</li><li>Black: <b>GND → b12</b> (the source column)</li></ul>
        <p>The lamp circuit is separate: battery + → lamp → <b>drain</b> (column 11); battery − → the <b>source column</b> (column 12), which is also connected to the board’s GND. All the grounds must be joined.</p>` },
      { title: 'The code', view: 'farq', have: M_IDS_E, showCode: true, power: true, body: `<p>Just a blink: the pin drives the gate. Click lines 9 and 11.</p>` },
      { title: 'Run it and choose the load', view: 'farq', have: M_IDS_E, showCode: true, power: true, action: 'run',
        body: `<p>The lamp blinks. In the panel choose a <b>lamp (about 300 mA)</b> or a <b>motor (about 1 A)</b> and read the numbers: the MOSFET drops only a few millivolts and stays almost cold, far better than the PN2222A, which is limited to 600 mA.</p><p class="sim">Simplified model: drain-source resistance from the datasheet values (between 4 V and 10 V interpolated; below 4 V an estimate).</p>` },
      { title: 'Summary', view: 'farq', have: M_IDS_E, power: true,
        body: `<ul><li>Gate = a <b>voltage</b> input: no base current. Source to GND, load between the supply and the <b>drain</b> (low-side switch).</li><li>Use a gate resistor (about 220 Ω) and a 10 kΩ pull-down.</li><li>Logic-level: its on-resistance is guaranteed from 4 V up; 3.3 V pins need care for big loads.</li><li>A motor or relay coil still needs a flyback diode.</li></ul>` },
    ],
    quiz: [
      { q: 'What controls a MOSFET?', a: ['A current into the gate', 'A voltage on the gate', 'Heat', 'Light'], c: 1, why: 'The gate takes no steady current: the voltage on it controls the channel.' },
      { q: 'Which leg of the IRLZ44N (text toward you) is the gate?', a: ['The left one', 'The middle one', 'The right one', 'The metal tab'], c: 0, why: 'Gate, drain, source from the left. The tab is the drain.' },
      { q: 'Why add a 10 kΩ resistor from the gate to GND?', a: ['To make it brighter', 'To keep the gate at 0 V so the load stays off at start-up', 'To cool the MOSFET', 'It is not needed ever'], c: 1, why: 'A floating gate can switch by itself.' },
      { q: 'The datasheet gives the on-resistance for which gate voltages?', a: ['Only 3.3 V', '4 V, 5 V and 10 V', 'Only 1 V', 'All voltages from 0 V'], c: 1, why: '35 mΩ at 4 V, 25 mΩ at 5 V, 22 mΩ at 10 V.' },
    ],
    sources: [SRC.irlz44n, SRC.ds, SRC.pinmode],
  },

  // ================================================================== 23
  {
    id: 'e23', num: 23, module: 10, title: 'A diode: current flows one way', level: 'Beginner', time: '15 min',
    goal: 'See that a diode lets current through in one direction only, and read its band.',
    hardware: ['ESP32 DevKit V1', '2 × diode 1N4007', '2 × 5 mm red LED', '2 × 100 Ω resistor', 'Breadboard and jumper wires'],
    code: E32_DIODE, file: 'DiodeDemo.ino', program: 'e_extled', fast: true,
    circuit: D_PARTS_E, io: { G16: { kind: 'led', item: 'led1', diode: 'd1', rev: { r: 'r2', diode: 'd2', led: 'led2' }, needs: D_IDS_E } },
    explain: {
      2: 'One pin feeds <b>both</b> branches through a resistor each.',
      4: '<b>setup()</b> runs once.',
      5: 'The pin is an output.',
      8: '<b>loop()</b> repeats forever.',
      9: 'HIGH (3.3 V): in the first branch the current goes through the diode in its <b>forward</b> direction and the LED lights. In the second branch the diode is turned round and <b>blocks</b>: that LED stays dark.',
      10: 'Wait one second.',
      11: 'LOW: no current anywhere.',
      12: 'Wait one second.',
    },
    steps: [
      { title: 'A one-way valve for current', view: 'bbwide', have: [], power: false,
        body: `<p>A <b>diode</b> lets current flow in <b>one direction only</b>, like a one-way valve. It has two legs: the <b>anode</b> (+) and the <b>cathode</b> (−). Current flows from the anode to the cathode, not the other way.</p>` },
      { title: 'The 1N4007', view: 'bigq', have: ['d1'], power: false,
        body: `<p>The <b>1N4007</b> is a common power diode. The <b>silver band</b> marks the <b>cathode</b>. <b>Click it</b> in the 3D view.</p>
        <ul><li>Average forward current <b>1 A</b>; forward voltage <b>1.1 V at 1 A</b> (Vishay datasheet).</li><li>It blocks up to <b>1000 V</b> in the reverse direction.</li></ul>
        <p>Part of the voltage supply is lost in a forward-biased diode (a little under a volt at small currents).</p>` },
      { title: 'Two branches, one turned round', view: 'bbwide', have: ['r1', 'd1', 'led1', 'r2', 'd2', 'led2'], power: false,
        body: `<p>Both branches are the same: resistor, diode, LED. In the <b>first</b> branch the band is on the <b>LED side</b> (anode toward the pin): current can flow. In the <b>second</b> branch the diode is <b>turned round</b> (band toward the resistor): it blocks.</p>` },
      { title: 'Wire it', view: 'bbwide', have: D_IDS_E, power: false, pins: ['G16', 'GND2'],
        body: `<ul><li>Yellow: <b>RX2 (GPIO16) → a10</b></li><li>Orange: <b>b10 → b21</b> (feeds the second branch)</li><li>Black: <b>GND → a18</b>, and a black link <b>b18 → b29</b> joins the two LED cathodes</li></ul>
        <p>Each resistor (100 Ω) limits the current of its LED.</p>` },
      { title: 'The code', view: 'bbwide', have: D_IDS_E, showCode: true, power: true, body: `<p>Just a blink on one pin. Click lines 9 and 11.</p>` },
      { title: 'Run it', view: 'bbwide', have: D_IDS_E, showCode: true, power: true, action: 'run',
        body: `<p>When the pin is HIGH, only the <b>first LED</b> lights. The second one stays dark: its diode points the wrong way. Same parts, same wiring, only the diode is turned round.</p>` },
      { title: 'Summary', view: 'bbwide', have: D_IDS_E, power: true,
        body: `<ul><li>Current flows from the <b>anode</b> to the <b>cathode</b> (the end with the band).</li><li>A turned-round diode blocks.</li><li>Diodes protect circuits: wrong polarity, and a <b>flyback diode</b> across a motor or relay coil.</li><li>1N4007: 1 A, 1.1 V at 1 A, 1000 V reverse.</li></ul>` },
    ],
    quiz: [
      { q: 'Which end of a 1N4007 is the cathode?', a: ['The end without a mark', 'The end with the silver band', 'The longer leg', 'Either'], c: 1, why: 'The band marks the cathode.' },
      { q: 'The diode is turned round in a series circuit. What happens?', a: ['It conducts more', 'It blocks the current', 'It burns', 'Nothing'], c: 1, why: 'A reverse-biased diode blocks.' },
      { q: 'Current flows through a diode from…', a: ['cathode to anode', 'anode to cathode', 'either way', 'neither way'], c: 1, why: 'Forward direction is anode to cathode.' },
    ],
    sources: [SRC.d1n4007, SRC.ds, SRC.pinmode],
  },

  // ================================================================== 24
  {
    id: 'e24', num: 24, module: 11, title: 'Blink without delay(): millis()', level: 'Intermediate', time: '20 min',
    goal: 'Keep a program responsive: do two things at once by checking the clock instead of waiting with delay().',
    hardware: ['ESP32 DevKit V1', 'LED circuit and push button from Lesson 5', 'Breadboard and jumper wires'],
    code: E32_MILLIS, file: 'BlinkWithoutDelay.ino', program: 'e_millis', fast: true, widgets: ['button'],
    circuit: [...LED_CIRCUIT, ...BUTTON_PARTS], io: { G16: IO_LED, G17: { kind: 'button', item: 'btn1', needs: BUTTON_IDS } },
    explain: {
      2: 'The LED from the earlier lessons (GPIO16).',
      3: 'The push button (GPIO17).',
      4: 'A variable that remembers <b>when</b> the LED last changed. <b>unsigned long</b> because millis() returns an unsigned long.',
      5: 'How long to wait between changes: 1000 ms.',
      6: 'The current LED state, HIGH or LOW.',
      7: 'The previous button reading, to notice the moment it changes.',
      10: 'The LED pin is an output.',
      11: 'The button pin uses the internal pull-up: pressed reads LOW.',
      12: 'Serial output on.',
      16: '<b>millis()</b> returns the number of milliseconds since the program started. It does not stop the program.',
      17: 'Has one interval passed since the last change? If not, <b>skip the block and carry on</b>: loop() runs again at once.',
      18: 'Remember this moment as the last change.',
      19: 'Toggle the stored state.',
      20: 'Write it to the LED.',
      23: 'Read the button <b>every time</b> loop() runs.',
      24: 'LOW now and HIGH before = the button was <b>just pressed</b>.',
      25: 'Report it at once: with delay(1000) this could take up to a second.',
      27: 'Remember this reading for the next pass.',
    },
    steps: [
      { title: 'The problem with delay()', view: 'bench', have: [], power: false,
        body: `<p>In the button lesson the sketch used <code>delay()</code>: during a delay the board <b>does nothing else</b>. A button pressed in that time is not noticed. To blink an LED <b>and</b> watch a button, the program must never wait.</p>` },
      { title: 'The idea: look at the clock', view: 'bench', have: [], power: false,
        body: `<p><code>millis()</code> returns the time since the program started. Instead of sleeping for 1000 ms, keep the time of the last change and ask each pass of <code>loop()</code>: <b>has 1000 ms passed?</b> If yes, toggle the LED; if not, carry on and read the button.</p>` },
      { title: 'Use the circuit from the button lesson', view: 'bench', have: [...LED_IDS, ...BUTTON_IDS], power: false, pins: ['G16', 'G17'],
        body: `<p>The LED on GPIO16 and the push button on GPIO17 are wired as before. Nothing new to wire.</p>` },
      { title: 'The code', view: 'bench', have: [...LED_IDS, ...BUTTON_IDS], showCode: true, power: true,
        body: `<p>Click lines <b>16 and 17</b>: the heart of the technique. The only variable that matters is <code>previousMillis</code>.</p>` },
      { title: 'Run it and press the button', view: 'bench', have: [...LED_IDS, ...BUTTON_IDS], showCode: true, power: true, action: 'run',
        body: `<p>The LED blinks every second. Now <b>press and hold the button</b> (in the 3D view or with “Hold to press”): the Serial Monitor shows the message <b>at once</b>, even in the middle of a blink interval. With <code>delay()</code> the press could wait up to a second.</p><p class="sim">The simulator runs loop() about 100 times per second; a real board runs it much faster.</p>` },
      { title: 'Summary', view: 'bench', have: [...LED_IDS, ...BUTTON_IDS], power: true,
        body: `<ul><li><code>delay()</code> blocks everything; <code>millis()</code> does not.</li><li>Pattern: <code>if (millis() - previous &gt;= interval) { previous = millis(); … }</code></li><li>Remember the last state to detect a change (the button press).</li></ul>` },
    ],
    quiz: [
      { q: 'What does millis() return?', a: ['The pin number', 'Milliseconds since the program started', 'The current time of day', 'The LED state'], c: 1, why: 'It counts the time since the program started.' },
      { q: 'Why is delay() a problem when you also read a button?', a: ['It uses too much power', 'The board does nothing else during the delay', 'It only works once', 'It needs a pull-up'], c: 1, why: 'The sketch cannot read the button while it waits.' },
      { q: 'What does the variable previousMillis store?', a: ['The pin of the LED', 'The time of the last LED change', 'The button reading', 'The interval'], c: 1, why: 'It lets the sketch compute how long ago the last change was.' },
    ],
    sources: [SRC.millis, SRC.bwd, SRC.ds],
  },

  // ================================================================== 25
  {
    id: 'e25', num: 25, module: 3, title: 'HTTP client: ask a web server (GET)', level: 'Intermediate', time: '25 min',
    goal: 'Send an HTTP GET request with HTTPClient, read the status code and the answer, and handle errors.',
    hardware: ['ESP32 DevKit V1', 'Micro-USB cable', 'Your Wi-Fi name and password'],
    code: E32_HTTP, file: 'HttpGet.ino', program: 'e_http', fast: true, widgets: ['wifirouter', 'httpserver'],
    explain: {
      1: '<b>WiFi.h</b>: the Wi-Fi library of the Arduino-ESP32 core.',
      2: '<b>HTTPClient.h</b>: lets the ESP32 act as a web <b>client</b> (like a browser).',
      6: 'The address to ask. This one is made up for the lesson: use a real address on a real board. Plain <b>http://</b> only: https:// needs a secure client.',
      9: 'Serial output on.',
      10: 'Start joining the Wi-Fi (Lesson 9).',
      11: 'Wait until we are connected.',
      14: 'Connected.',
      16: 'An HTTPClient object.',
      17: '<b>http.begin(url)</b>: choose the address.',
      18: '<b>http.GET()</b> sends the request and waits for the answer. It returns the <b>HTTP status code</b> (200 = OK, 404 = not found), or a <b>negative number</b> if the request failed.',
      19: 'A positive code: the server answered.',
      20: 'Print the status code.',
      22: '200 means success: the server sent data.',
      23: '<b>http.getString()</b> returns the body of the answer as text.',
      24: 'Print it.',
      27: 'Negative: the request failed before any answer (for example no connection).',
      28: '<b>errorToString(code)</b> turns the negative number into words.',
      30: 'Always call <b>http.end()</b> to free the resources.',
    },
    steps: [
      { title: 'Now the ESP32 is the client', view: 'home', power: false,
        body: `<p>In the web-server lesson the ESP32 <b>answered</b> requests. Now it <b>asks</b>: it is a web client, like a browser. It sends a <b>GET request</b> to a web address (URL) and gets an <b>answer</b>: a <b>status code</b> and a <b>body</b>.</p>` },
      { title: 'Status codes and the body', view: 'home', power: false,
        body: `<ul><li><b>200 OK</b>: success, the body has the data (here a small JSON text).</li><li><b>404 Not Found</b>: the server is there, but has nothing at that address.</li><li><b>Negative number</b> from <code>GET()</code>: the request itself failed, there was no answer at all.</li></ul><p class="sim">In this simulation the server and its answer are made up; a real board would contact a real server.</p>` },
      { title: 'Read the sketch', view: 'home', power: true, action: 'ensurePower', showCode: true,
        body: `<p>Click lines <b>17 and 18</b>: <code>begin()</code> sets the address, <code>GET()</code> sends the request. The code first connects to Wi-Fi exactly like Lesson 9.</p>` },
      { title: 'Run it: the server answers 200', view: 'home', power: true, showCode: true, action: 'run',
        body: `<p>Press <b>▶ Run</b>. After the Wi-Fi connects (about 2.5 s) the ESP32 asks the server. With <b>“Server: answers 200”</b> you see <code>HTTP status: 200</code> and the data.</p>` },
      { title: 'Run it: 404 and no answer', view: 'home', power: true, showCode: true, action: 'ensurePower',
        body: `<p>Press <b>■ Stop</b>, click the server button to choose <b>“404 not found”</b> or <b>“down”</b>, then press <b>▶ Run</b> again.</p><ul><li><b>404</b>: <code>HTTP status: 404</code>, no data.</li><li><b>Server down</b>: <code>GET()</code> returns a negative number: <code>Request failed: connection refused</code>.</li></ul><p class="tip">A real sketch should always check the code before using the body.</p>` },
      { title: 'Summary', view: 'home', power: true,
        body: `<ul><li><code>http.begin(url); int code = http.GET();</code></li><li>code &gt; 0: the server answered (200 = OK, 404 = not found); code &lt; 0: the request failed.</li><li><code>http.getString()</code> reads the body; <code>http.end()</code> cleans up.</li></ul>` },
    ],
    quiz: [
      { q: 'What does http.GET() return?', a: ['The body of the answer', 'The HTTP status code (negative on failure)', 'The IP address', 'The Wi-Fi name'], c: 1, why: 'It returns the status code, or a negative number if the request failed.' },
      { q: 'The server answers 404. What does that mean?', a: ['The server is switched off', 'The server has nothing at that address', 'The password is wrong', 'It worked'], c: 1, why: '404 means Not Found.' },
      { q: 'GET() returns a negative number. What happened?', a: ['The request failed: no answer arrived', 'The server answered OK', 'The body is empty', 'The LED is on'], c: 0, why: 'Negative values are errors of the request itself.' },
    ],
    sources: [SRC.httpc, SRC.httpmdn, SRC.wifihello],
  },
];

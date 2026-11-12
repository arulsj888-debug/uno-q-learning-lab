// Shared sources and circuits of the Arduino UNO R3 lessons.
export const SRC = {
  ds: { t: 'Arduino UNO R3 datasheet (A000066)', u: 'https://docs.arduino.cc/hardware/uno-rev3/' },
  ref: { t: 'Arduino language reference', u: 'https://docs.arduino.cc/language-reference/' },
  atm: { t: 'Microchip ATmega328P datasheet', u: 'https://ww1.microchip.com/downloads/en/DeviceDoc/ATmega48A-PA-88A-PA-168A-PA-328-P-DS-DS40002061A.pdf' },
  aw: { t: 'Arduino reference: analogWrite()', u: 'https://docs.arduino.cc/language-reference/en/functions/analog-io/analogWrite/' },
  ar: { t: 'Arduino reference: analogRead()', u: 'https://docs.arduino.cc/language-reference/en/functions/analog-io/analogRead/' },
  tone: { t: 'Arduino reference: tone()', u: 'https://docs.arduino.cc/language-reference/en/functions/advanced-io/tone/' },
  pinmode: { t: 'Arduino reference: pinMode() — INPUT_PULLUP', u: 'https://docs.arduino.cc/language-reference/en/functions/digital-io/pinMode/' },

  ldr: { t: 'GL55 series photoresistor datasheet (GL5528)', u: 'https://www.electrokit.com/upload/quick/5b/ec/0d3b_41036350-tds.pdf' },
  tmp36: { t: 'Analog Devices TMP35/TMP36/TMP37 datasheet, Rev. F', u: 'https://www.analog.com/media/en/technical-documentation/data-sheets/TMP35_36_37.pdf' },
  hcsr04: { t: 'Elecfreaks HC-SR04 ultrasonic ranging module datasheet', u: 'https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf' },
  pulsein: { t: 'Arduino reference: pulseIn()', u: 'https://docs.arduino.cc/language-reference/en/functions/advanced-io/pulseIn/' },
  avrcore: { t: 'Arduino AVR core: wiring_pulse.c (source code)', u: 'https://github.com/arduino/ArduinoCore-avr/blob/master/cores/arduino/wiring_pulse.c' },
  sr501: { t: 'HC-SR501 PIR motion detector datasheet (manufacturer, 2013)', u: 'https://courses.ece.cornell.edu/ece5990/ECE5725_Spring2020_Projects/May_15_Demo/Smart%20Lock/W_pp445_yl656/datasheet/31227sc.pdf' },
  sr501guide: { t: 'Handson Technology: HC-SR501 PIR user guide', u: 'https://handsontec.com/dataspecs/sensor/PIR%20SR501%20Motion%20Sensor.pdf' },
  sg90: { t: 'TowerPro SG90 micro servo datasheet', u: 'https://www.friendlywire.com/projects/ne555-servo-safe/SG90-datasheet.pdf' },
  servolib: { t: 'Arduino Servo library (source and API documentation)', u: 'https://github.com/arduino-libraries/Servo' },
  l293: { t: 'Texas Instruments L293x quadruple half-H drivers datasheet (SLRS008D)', u: 'https://www.ti.com/lit/ds/symlink/l293.pdf' },
  motor130: { t: 'Adafruit #711 DC toy/hobby motor (130 size) — specifications', u: 'https://www.adafruit.com/product/711' },
  relaymod: { t: 'Handsontec: 1-channel 5 V optical-isolated relay module (user guide)', u: 'https://handsontec.com/dataspecs/module/Relay%20Module/1Ch-relay%20Opto.pdf' },
  sht31: { t: 'Adafruit SHT31-D Temperature & Humidity Sensor Breakout (product page and guide)', u: 'https://learn.adafruit.com/adafruit-sht31-d-temperature-and-humidity-sensor-breakout' },
  sht31lib: { t: 'Adafruit SHT31 Arduino library (header, source and example)', u: 'https://github.com/adafruit/Adafruit_SHT31' },
  dhtguide: { t: 'Adafruit: DHT11, DHT22 and AM2302 Sensors (specifications, wiring)', u: 'https://learn.adafruit.com/dht' },
  dhtlib: { t: 'Adafruit DHT sensor library (DHTtester example)', u: 'https://github.com/adafruit/DHT-sensor-library' },
  ky023: { t: 'KY-023 dual-axis joystick module (espboards.dev)', u: 'https://www.espboards.dev/sensors/ky-023' },
  ky040: { t: 'KY-040 rotary encoder (Joy-IT sensor kit)', u: 'https://sensorkit.joy-it.net/en/sensors/ky-040' },
  lcdi2c: { t: 'I²C LCD1602 documentation (SunFounder): PCF8574 backpack, address 0x27 / 0x3F, LiquidCrystal_I2C', u: 'https://docs.sunfounder.com/projects/sf-components/en/latest/component_i2c_lcd.html' },
  ssd1306: { t: 'Adafruit SSD1306 library (examples: begin(SSD1306_SWITCHCAPVCC, 0x3C))', u: 'https://github.com/adafruit/Adafruit_SSD1306' },
  neouber: { t: 'Adafruit NeoPixel Überguide: Powering NeoPixels', u: 'https://learn.adafruit.com/adafruit-neopixel-uberguide/powering-neopixels' },
  neolib: { t: 'Adafruit_NeoPixel library (examples: strandtest)', u: 'https://github.com/adafruit/Adafruit_NeoPixel' },
  pn2222: { t: 'onsemi PN2222 / PN2222A datasheet (TO-92: emitter, base, collector; 600 mA; VCE(sat) 0.3 V at 150 mA / 15 mA)', u: 'https://www.onsemi.com/pdf/datasheet/pn2222-d.pdf' },
  wire: { t: 'Arduino reference: Wire library (I²C)', u: 'https://docs.arduino.cc/language-reference/en/functions/communication/wire/' },
};

export const LED_CIRCUIT = [
  { id: 'r1', type: 'resistor', a: 'c10', b: 'c14' },
  { id: 'led1', type: 'led', anode: 'd14', cathode: 'd15' },
  { id: 'w1', type: 'wire', from: 'D5', to: 'a10', color: 'yellow', lift: 12 },
  { id: 'w2', type: 'wire', from: 'a15', to: 'GND2', color: 'black', lift: 9 },
];
export const LED_IDS = LED_CIRCUIT.map(d => d.id);
export const IO_LED = { kind: 'led', item: 'led1', needs: LED_IDS };
export const BUTTON_PARTS = [
  { id: 'btn1', type: 'button', col: 20 },
  { id: 'w3', type: 'wire', from: 'D4', to: 'a20', color: 'blue', lift: 12 },
  { id: 'w4', type: 'wire', from: 'j22', to: 'GND3', color: 'black', lift: 14 },
];
export const BUTTON_IDS = BUTTON_PARTS.map(d => d.id);
export const POT_PARTS = [
  { id: 'pot1', type: 'pot', row: 'e', col: 24 },
  { id: 'w5', type: 'wire', from: '5V', to: 'a24', color: 'red', lift: 8 },
  { id: 'w6', type: 'wire', from: 'A0', to: 'a26', color: 'green', lift: 11 },
  { id: 'w7', type: 'wire', from: 'GND3', to: 'a28', color: 'black', lift: 15 },
];
export const POT_IDS = POT_PARTS.map(d => d.id);
export const BUZZER_PARTS = [
  { id: 'r2', type: 'resistor', a: 'c19', b: 'c23' },
  { id: 'bz1', type: 'buzzer', plus: 'e23', minus: 'e26' },
  { id: 'w8', type: 'wire', from: 'D9', to: 'a19', color: 'orange', lift: 12 },
  { id: 'w9', type: 'wire', from: 'a26', to: 'GND3', color: 'black', lift: 9 },
];
export const BUZZER_IDS = BUZZER_PARTS.map(d => d.id);

// ---- circuits of lessons 9-16 (all wired to the 5 V pins of the UNO R3)
export const LDR_PARTS = [
  { id: 'ldr1', type: 'ldr', a: 'e22', b: 'e23' },
  { id: 'r3', type: 'resistor', a: 'c23', b: 'c27', bands: ['brown', 'black', 'orange', 'gold'], hw: 'resistor10k' },
  { id: 'w10', type: 'wire', from: '5V', to: 'a22', color: 'red', lift: 9 },
  { id: 'w11', type: 'wire', from: 'A0', to: 'a23', color: 'green', lift: 12 },
  { id: 'w12', type: 'wire', from: 'a27', to: 'GND3', color: 'black', lift: 15 },
];
export const LDR_IDS = LDR_PARTS.map(d => d.id);
export const TMP_PARTS = [
  { id: 't1', type: 'tmp36', row: 'e', col: 18 },
  { id: 'w13', type: 'wire', from: '5V', to: 'a18', color: 'red', lift: 9 },
  { id: 'w14', type: 'wire', from: 'A0', to: 'a19', color: 'green', lift: 12 },
  { id: 'w15', type: 'wire', from: 'a20', to: 'GND3', color: 'black', lift: 15 },
];
export const TMP_IDS = TMP_PARTS.map(d => d.id);
export const US_PARTS = [
  { id: 'us1', type: 'hcsr04', row: 'j', col: 11 },
  { id: 'w16', type: 'wire', from: '5V', to: 'f11', color: 'red', lift: 10 },
  { id: 'w17', type: 'wire', from: 'D7', to: 'f12', color: 'yellow', lift: 14 },
  { id: 'w18', type: 'wire', from: 'D8', to: 'f13', color: 'blue', lift: 18 },
  { id: 'w19', type: 'wire', from: 'f14', to: 'GND3', color: 'black', lift: 12 },
];
export const US_IDS = US_PARTS.map(d => d.id);
export const PIR_PARTS = [
  { id: 'pir1', type: 'pir', x: 84, z: 34 },
  { id: 'w20', type: 'fwire', from: 'pir1.GND', to: 'GND3', color: 'black', lift: 24 },
  { id: 'w21', type: 'fwire', from: 'pir1.OUT', to: 'D2', color: 'yellow', lift: 44 },
  { id: 'w22', type: 'fwire', from: 'pir1.VCC', to: '5V', color: 'red', lift: 18 },
];
export const PIR_IDS = PIR_PARTS.map(d => d.id);
export const SERVO_PARTS = [
  { id: 'sv1', type: 'servo', row: 'j', col: 11, bx: 78, bz: 72 },
  { id: 'w23', type: 'wire', from: 'f11', to: 'GND3', color: 'black', lift: 12 },
  { id: 'w24', type: 'wire', from: 'f12', to: '5V', color: 'red', lift: 9 },
  { id: 'w25', type: 'wire', from: 'f13', to: 'D9', color: 'orange', lift: 16 },
];
export const SERVO_IDS = SERVO_PARTS.map(d => d.id);
export const MOTOR_PARTS = [
  { id: 'u1', type: 'l293d', col: 12 },
  { id: 'bat1', type: 'battery', x: 45, z: 120 },
  { id: 'mot1', type: 'motor', x: -40, z: 116, rotY: Math.PI },
  { id: 'w26', type: 'wire', from: '5V', to: 'a12', color: 'red', lift: 10 },
  { id: 'w27', type: 'wire', from: 'GND3', to: 'a15', color: 'black', lift: 13 },
  { id: 'w28', type: 'wire', from: 'D5', to: 'j12', color: 'orange', lift: 14 },
  { id: 'w29', type: 'wire', from: 'D7', to: 'j13', color: 'yellow', lift: 18 },
  { id: 'w30', type: 'wire', from: 'D8', to: 'j18', color: 'blue', lift: 22 },
  { id: 'w31', type: 'wire', from: 'GND2', to: 'i16', color: 'black', lift: 8 },
  { id: 'l1', type: 'lead', from: 'bat1.POS', to: 'j19', color: 'red', lift: 14 },
  { id: 'l2', type: 'lead', from: 'bat1.NEG', to: 'j16', color: 'black', lift: 18 },
  { id: 'l3', type: 'lead', from: 'mot1.M1', to: 'j14', color: 'white', lift: 12 },
  { id: 'l4', type: 'lead', from: 'mot1.M2', to: 'j17', color: 'green', lift: 16 },
];
export const MOTOR_IDS = MOTOR_PARTS.map(d => d.id);
export const MOTOR_LOGIC = ['w26', 'w27', 'w28', 'w29', 'w30'];
export const MOTOR_IO = { kind: 'motor', item: 'mot1', drv: 'u1', bat: 'bat1', en: 'D5', in1: 'D7', in2: 'D8', needs: MOTOR_IDS };
export const RELAY_PARTS = [
  { id: 'rel1', type: 'relay', x: 95, z: -48 },
  { id: 'bat2', type: 'battery', x: 125, z: 12 },
  { id: 'lamp1', type: 'lamp', x: 165, z: -26 },
  { id: 'l5', type: 'lead', from: 'rel1.DCP', to: '5V', color: 'red', lift: 18 },
  { id: 'l6', type: 'lead', from: 'rel1.DCN', to: 'GND3', color: 'black', lift: 26 },
  { id: 'l7', type: 'lead', from: 'rel1.IN', to: 'D4', color: 'yellow', lift: 14 },
  { id: 'l8', type: 'lead', from: 'bat2.POS', to: 'rel1.COM', color: 'red', lift: 14 },
  { id: 'l9', type: 'lead', from: 'rel1.NO', to: 'lamp1.L1', color: 'orange', lift: 12 },
  { id: 'l10', type: 'lead', from: 'lamp1.L2', to: 'bat2.NEG', color: 'black', lift: 12 },
];
export const RELAY_IDS = RELAY_PARTS.map(d => d.id);
export const RELAY_IO = { kind: 'relay', item: 'rel1', lamp: 'lamp1', bat: 'bat2', needs: RELAY_IDS };
export const I2C_PARTS = [
  { id: 'sen1', type: 'sht31', row: 'g', col: 10 },
  { id: 'w40', type: 'wire', from: '5V', to: 'j10', color: 'red', lift: 14 },
  { id: 'w41', type: 'wire', from: 'GND3', to: 'j11', color: 'black', lift: 18 },
  { id: 'w42', type: 'wire', from: 'A5', to: 'j12', color: 'yellow', lift: 22 },
  { id: 'w43', type: 'wire', from: 'A4', to: 'j13', color: 'blue', lift: 26 },
];
export const I2C_IDS = I2C_PARTS.map(d => d.id);

// ---- Lesson 17: RGB LED (common cathode) with three resistors on pins 9, 10, 11
export const RGB_PARTS = [
  { id: 'rgb1', type: 'rgbled', row: 'e', col: 10 },
  { id: 'r1', type: 'resistor', a: 'a10', b: 'a16' },
  { id: 'r2', type: 'resistor', a: 'a12', b: 'a17' },
  { id: 'r3', type: 'resistor', a: 'a13', b: 'a18' },
  { id: 'w50', type: 'wire', from: 'D9', to: 'b16', color: 'red', lift: 20 },
  { id: 'w51', type: 'wire', from: 'D10', to: 'b17', color: 'green', lift: 24 },
  { id: 'w52', type: 'wire', from: 'D11', to: 'b18', color: 'blue', lift: 28 },
  { id: 'w53', type: 'wire', from: 'GND2', to: 'a11', color: 'black', lift: 16 },
];
export const RGB_IDS = RGB_PARTS.map(d => d.id);
// ---- Lesson 18: DHT11 on pin 2 with a 10 kOhm pull-up between DATA and VCC
export const DHT_PARTS = [
  { id: 'dht1', type: 'dht', model: 'dht11', row: 'e', col: 10 },
  { id: 'w60', type: 'wire', from: '5V', to: 'a10', color: 'red', lift: 14 },
  { id: 'w61', type: 'wire', from: 'D2', to: 'a11', color: 'yellow', lift: 22 },
  { id: 'w62', type: 'wire', from: 'GND3', to: 'a13', color: 'black', lift: 18 },
  { id: 'r60', type: 'resistor', a: 'c10', b: 'c16' },
  { id: 'w63', type: 'wire', from: 'b11', to: 'b16', color: 'orange', lift: 12 },
];
export const DHT_IDS = DHT_PARTS.map(d => d.id);

// ---- Lesson 19: joystick module (X on A0, Y on A1, switch on pin 2), powered from 5 V
export const JOY_PARTS = [
  { id: 'joy1', type: 'joystick', row: 'g', col: 10 },
  { id: 'w70', type: 'wire', from: 'GND2', to: 'j10', color: 'black', lift: 16 },
  { id: 'w71', type: 'wire', from: '5V', to: 'j11', color: 'red', lift: 20 },
  { id: 'w72', type: 'wire', from: 'A0', to: 'j12', color: 'green', lift: 24 },
  { id: 'w73', type: 'wire', from: 'A1', to: 'j13', color: 'blue', lift: 28 },
  { id: 'w74', type: 'wire', from: 'D2', to: 'j14', color: 'yellow', lift: 32 },
];
export const JOY_IDS = JOY_PARTS.map(d => d.id);
// ---- Lesson 20: rotary encoder (CLK pin 2, DT pin 3, SW pin 4)
export const ENC_PARTS = [
  { id: 'enc1', type: 'encoder', row: 'g', col: 10 },
  { id: 'w80', type: 'wire', from: 'D2', to: 'j10', color: 'green', lift: 16 },
  { id: 'w81', type: 'wire', from: 'D3', to: 'j11', color: 'blue', lift: 20 },
  { id: 'w82', type: 'wire', from: 'D4', to: 'j12', color: 'yellow', lift: 24 },
  { id: 'w83', type: 'wire', from: '5V', to: 'j13', color: 'red', lift: 28 },
  { id: 'w84', type: 'wire', from: 'GND2', to: 'j14', color: 'black', lift: 32 },
];
export const ENC_IDS = ENC_PARTS.map(d => d.id);

// ---- Lessons 21 / 22: I2C displays standing on the desk (module pins straight to the UNO R3 sockets)
export const LCD_PARTS = [
  { id: 'lcd1', type: 'lcd1602', x: 20, z: 138 },
  { id: 'w90', type: 'fwire', from: 'lcd1.GND', to: 'GND2', color: 'black', lift: 24 },
  { id: 'w91', type: 'fwire', from: 'lcd1.VCC', to: '5V', color: 'red', lift: 30 },
  { id: 'w92', type: 'fwire', from: 'lcd1.SDA', to: 'A4', color: 'blue', lift: 36 },
  { id: 'w93', type: 'fwire', from: 'lcd1.SCL', to: 'A5', color: 'yellow', lift: 42 },
];
export const LCD_IDS = LCD_PARTS.map(d => d.id);
export const OLED_PARTS = [
  { id: 'oled1', type: 'oled', x: 20, z: 138 },
  { id: 'w95', type: 'fwire', from: 'oled1.GND', to: 'GND2', color: 'black', lift: 24 },
  { id: 'w96', type: 'fwire', from: 'oled1.VCC', to: '3V3', color: 'red', lift: 30 },
  { id: 'w97', type: 'fwire', from: 'oled1.SCL', to: 'A5', color: 'yellow', lift: 36 },
  { id: 'w98', type: 'fwire', from: 'oled1.SDA', to: 'A4', color: 'blue', lift: 42 },
];
export const OLED_IDS = OLED_PARTS.map(d => d.id);

// ---- Lesson 23: NeoPixel strip standing on the desk, three leads to the UNO R3 sockets (5 V, data on pin 6, GND)
export const NEO_PARTS = [
  { id: 'neo1', type: 'neopixel', x: 35, z: 140 },
  { id: 'l60', type: 'lead', from: 'neo1.VCC', to: '5V', color: 'red', lift: 30 },
  { id: 'l61', type: 'lead', from: 'neo1.DIN', to: 'D6', color: 'yellow', lift: 36 },
  { id: 'l62', type: 'lead', from: 'neo1.GND', to: 'GND2', color: 'black', lift: 24 },
];
export const NEO_IDS = NEO_PARTS.map(d => d.id);

// ---- Lesson 24: PN2222A low-side switch for a 6 V lamp (base resistor from pin 5, battery pack and lamp on the desk)
export const Q_PARTS = [
  { id: 'q1', type: 'npn', row: 'e', col: 10 },
  { id: 'r1', type: 'resistor', a: 'a11', b: 'a15', ohms: 1000 },
  { id: 'w100', type: 'wire', from: 'D5', to: 'b15', color: 'yellow', lift: 24 },
  { id: 'w101', type: 'wire', from: 'GND2', to: 'b10', color: 'black', lift: 18 },
  { id: 'bat1', type: 'battery', x: 125, z: 12 },
  { id: 'lamp1', type: 'lamp', x: 165, z: -26 },
  { id: 'l100', type: 'lead', from: 'bat1.POS', to: 'lamp1.L1', color: 'red', lift: 14 },
  { id: 'l101', type: 'lead', from: 'lamp1.L2', to: 'c12', color: 'orange', lift: 18 },
  { id: 'l102', type: 'lead', from: 'bat1.NEG', to: 'c10', color: 'black', lift: 20 },
];
export const Q_IDS = Q_PARTS.map(d => d.id);

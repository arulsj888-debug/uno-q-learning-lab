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
  irlz44n: { t: 'Infineon IRLZ44NPbF datasheet (TO-220: gate, drain, source; 55 V; RDS(on) 22 mΩ at 10 V, 25 mΩ at 5 V, 35 mΩ at 4 V; VGS(th) 1.0 to 2.0 V; VGS ±16 V)', u: 'https://www.infineon.com/assets/row/public/documents/24/49/infineon-irlz44npbf-datasheet-en.pdf' },
  d1n4007: { t: 'Vishay 1N4001 to 1N4007 datasheet (average forward current 1 A; forward voltage 1.1 V at 1 A; up to 1000 V reverse for the 1N4007; the band marks the cathode)', u: 'https://www.vishay.com/docs/88503/1n4001.pdf' },
  millis: { t: 'Arduino reference: millis() (milliseconds since the program started)', u: 'https://docs.arduino.cc/language-reference/en/functions/time/millis/' },
  bwd: { t: 'Arduino example: Blink Without Delay', u: 'https://docs.arduino.cc/built-in-examples/digital/BlinkWithoutDelay/' },
  wirelib: { t: 'Arduino reference: Wire library (beginTransmission / endTransmission)', u: 'https://docs.arduino.cc/language-reference/en/functions/communication/wire/' },
  ds18: { t: 'DS18B20 datasheet (Dallas Semiconductor / Maxim): TO-92 pinout GND, DQ, VDD; 3.0 V to 5.5 V; 750 ms conversion', u: 'https://www.analog.com/en/products/ds18b20.html' },
  dallas: { t: 'DallasTemperature library (Miles Burton) and OneWire library (Paul Stoffregen)', u: 'https://github.com/milesburton/Arduino-Temperature-Control-Library' },
  vishayir: { t: 'Vishay TSOP382.., TSOP384.. datasheet: pins OUT GND VS, 2.0 V to 5.5 V, 38 kHz variants', u: 'https://www.vishay.com/docs/82491/tsop382.pdf' },
  irremote: { t: 'Arduino-IRremote library (version 4.x) by Armin Joachimsmeyer and contributors', u: 'https://github.com/Arduino-IRremote/Arduino-IRremote' },
  mpureg: { t: 'MPU-6000/MPU-6050 Register Map and Descriptions (InvenSense): sleep mode at power-up, WHO_AM_I 0x68, 16384 LSB/g, 131 LSB/(deg/s)', u: 'https://cdn.sparkfun.com/datasheets/Sensors/Accelerometers/RM-MPU-6000A.pdf' },
  adampu: { t: 'Adafruit MPU6050 library (Adafruit_MPU6050, Adafruit_Sensor)', u: 'https://github.com/adafruit/Adafruit_MPU6050' },
  uln: { t: 'Vendor datasheet copy: 28BYJ-48 5 V stepper, 1/64 gear, 5.625 deg / 64 stride angle, 4 phases', u: 'https://cdn.shopify.com/s/files/1/0015/7571/4865/files/datasheet_28BYJ-48.pdf' },
  steplib: { t: 'Arduino reference: Stepper library (setSpeed, step)', u: 'https://docs.arduino.cc/libraries/stepper/' },
  bmpds: { t: 'Bosch BMP280 datasheet: 300-1100 hPa, -40..+85 C, supply 1.71-3.6 V, chip ID 0x58, address 0x76 (SDO to GND) or 0x77 (SDO to VDDIO)', u: 'https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmp280-ds001.pdf' },
  adabmp: { t: 'Adafruit BMP280 library (Adafruit_BMP280)', u: 'https://github.com/adafruit/Adafruit_BMP280_Library' },
  soilsrc: { t: 'Vendor manuals for the capacitive soil moisture sensor v1.2: 3.3-5.5 V, analog AOUT, wetter = lower voltage, calibrate dry and wet', u: 'https://www.atomic14.com/esp32/sensors/capacitive-soil/' },
  sndsrc: { t: 'Arduino reference: analogRead(). The sound module itself has no standard datasheet: its values are typical', u: 'https://docs.arduino.cc/language-reference/en/functions/analog-io/analogRead/' },
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

// ---- Lesson 25: IRLZ44N low-side switch for a 6 V lamp (gate resistor from pin 5, pull-down, battery pack and lamp on the desk)
export const M_PARTS = [
  { id: 'q1', type: 'mosfet', row: 'e', col: 10 },
  { id: 'r1', type: 'resistor', a: 'a5', b: 'a10', ohms: 220 },
  { id: 'w100', type: 'wire', from: 'D5', to: 'b5', color: 'yellow', lift: 24 },
  { id: 'r2', type: 'resistor', a: 'd10', b: 'd12', ohms: 10000 },
  { id: 'w102', type: 'wire', from: 'GND2', to: 'b12', color: 'black', lift: 18 },
  { id: 'bat1', type: 'battery', x: 125, z: 12 },
  { id: 'lamp1', type: 'lamp', x: 165, z: -26 },
  { id: 'l100', type: 'lead', from: 'bat1.POS', to: 'lamp1.L1', color: 'red', lift: 14 },
  { id: 'l101', type: 'lead', from: 'lamp1.L2', to: 'c11', color: 'orange', lift: 18 },
  { id: 'l102', type: 'lead', from: 'bat1.NEG', to: 'c12', color: 'black', lift: 20 },
];
export const M_IDS = M_PARTS.map(d => d.id);

// ---- Lesson 26: two LED branches, the second diode is turned round
export const D_PARTS = [
  { id: 'w1', type: 'wire', from: 'D5', to: 'a10', color: 'yellow', lift: 14 },
  { id: 'r1', type: 'resistor', a: 'c10', b: 'c13', ohms: 220 },
  { id: 'd1', type: 'diode', a: 'b13', k: 'b17' },
  { id: 'led1', type: 'led', anode: 'c17', cathode: 'c18' },
  { id: 'w2', type: 'wire', from: 'GND2', to: 'a18', color: 'black', lift: 10 },
  { id: 'w3', type: 'wire', from: 'b10', to: 'b21', color: 'orange', lift: 12 },
  { id: 'r2', type: 'resistor', a: 'c21', b: 'c24', ohms: 220 },
  { id: 'd2', type: 'diode', a: 'b28', k: 'b24' },
  { id: 'led2', type: 'led', anode: 'c28', cathode: 'c29' },
  { id: 'w4', type: 'wire', from: 'b18', to: 'b29', color: 'black', lift: 12 },
];
export const D_IDS = D_PARTS.map(d => d.id);

// ---- Lesson 28: LCD backpack and OLED on the same I2C bus (LCD on A4/A5, OLED on the repeated SDA/SCL sockets), both on the desk
export const SCAN_PARTS = [
  { id: 'lcd1', type: 'lcd1602', x: -30, z: 138 },
  { id: 'w90', type: 'fwire', from: 'lcd1.GND', to: 'GND2', color: 'black', lift: 24 },
  { id: 'w91', type: 'fwire', from: 'lcd1.VCC', to: '5V', color: 'red', lift: 30 },
  { id: 'w92', type: 'fwire', from: 'lcd1.SDA', to: 'A4', color: 'blue', lift: 36 },
  { id: 'w93', type: 'fwire', from: 'lcd1.SCL', to: 'A5', color: 'yellow', lift: 42 },
  { id: 'oled1', type: 'oled', x: 100, z: 138 },
  { id: 'w95', type: 'fwire', from: 'oled1.GND', to: 'GND1', color: 'black', lift: 48 },
  { id: 'w96', type: 'fwire', from: 'oled1.VCC', to: '3V3', color: 'orange', lift: 54 },
  { id: 'w97', type: 'fwire', from: 'oled1.SCL', to: 'SCL', color: 'green', lift: 60 },
  { id: 'w98', type: 'fwire', from: 'oled1.SDA', to: 'SDA', color: 'white', lift: 66 },
];
export const SCAN_IDS = SCAN_PARTS.map(d => d.id);

// ---- Lesson 29: DS18B20 on pin 2 from 5 V with a 4.7 kOhm pull-up between DQ and VDD
export const DS_PARTS = [
  { id: 'ds1', type: 'ds18b20', row: 'e', col: 10 },
  { id: 'w70', type: 'wire', from: 'GND3', to: 'a10', color: 'black', lift: 18 },
  { id: 'w71', type: 'wire', from: 'D2', to: 'a11', color: 'yellow', lift: 22 },
  { id: 'w72', type: 'wire', from: '5V', to: 'a12', color: 'red', lift: 14 },
  { id: 'r70', type: 'resistor', a: 'c11', b: 'c14', ohms: 4700 },
  { id: 'w73', type: 'wire', from: 'b12', to: 'b14', color: 'orange', lift: 12 },
];
export const DS_IDS = DS_PARTS.map(d => d.id);

// ---- Lesson 30: 38 kHz IR receiver on the right of the LED circuit (OUT on pin 2, VS from 5 V, GND3)
export const IR_PARTS = [
  { id: 'ir1', type: 'irrx', row: 'e', col: 20 },
  { id: 'w80', type: 'wire', from: 'D2', to: 'a20', color: 'yellow', lift: 22 },
  { id: 'w81', type: 'wire', from: 'GND3', to: 'a21', color: 'black', lift: 18 },
  { id: 'w82', type: 'wire', from: '5V', to: 'a22', color: 'red', lift: 14 },
];
export const IR_IDS = IR_PARTS.map(d => d.id);

// ---- Lesson 31: MPU6050 breakout on the desk, four female jumpers to 3V3, GND, A4 (SDA), A5 (SCL)
export const MPU_PARTS = [
  { id: 'mpu1', type: 'mpu6050', x: 20, z: 138 },
  { id: 'w90', type: 'fwire', from: 'mpu1.GND', to: 'GND2', color: 'black', lift: 24 },
  { id: 'w91', type: 'fwire', from: 'mpu1.VCC', to: '3V3', color: 'red', lift: 30 },
  { id: 'w92', type: 'fwire', from: 'mpu1.SDA', to: 'A4', color: 'blue', lift: 36 },
  { id: 'w93', type: 'fwire', from: 'mpu1.SCL', to: 'A5', color: 'yellow', lift: 42 },
];
export const MPU_IDS = MPU_PARTS.map(d => d.id);

// ---- Lesson 32: 28BYJ-48 + ULN2003 on the desk, IN1..IN4 on pins 8..11, power from 5V and GND
export const STEP_PARTS = [
  { id: 'stp1', type: 'stepper', x: 20, z: 138 },
  { id: 'w90', type: 'fwire', from: 'stp1.IN1', to: 'D8', color: 'blue', lift: 36 },
  { id: 'w91', type: 'fwire', from: 'stp1.IN2', to: 'D9', color: 'green', lift: 40 },
  { id: 'w92', type: 'fwire', from: 'stp1.IN3', to: 'D10', color: 'yellow', lift: 44 },
  { id: 'w93', type: 'fwire', from: 'stp1.IN4', to: 'D11', color: 'orange', lift: 48 },
  { id: 'w94', type: 'fwire', from: 'stp1.GND', to: 'GND2', color: 'black', lift: 24 },
  { id: 'w95', type: 'fwire', from: 'stp1.VCC', to: '5V', color: 'red', lift: 30 },
];
export const STEP_IDS = STEP_PARTS.map(d => d.id);

// ---- Lesson 33: BMP280 breakout on the desk, four female jumpers to 3V3, GND, A4 (SDA), A5 (SCL)
export const BMP_PARTS = [
  { id: 'bmp1', type: 'bmp280', x: 20, z: 138 },
  { id: 'w90', type: 'fwire', from: 'bmp1.GND', to: 'GND2', color: 'black', lift: 24 },
  { id: 'w91', type: 'fwire', from: 'bmp1.VCC', to: '3V3', color: 'red', lift: 30 },
  { id: 'w92', type: 'fwire', from: 'bmp1.SDA', to: 'A4', color: 'blue', lift: 36 },
  { id: 'w93', type: 'fwire', from: 'bmp1.SCL', to: 'A5', color: 'yellow', lift: 42 },
];
export const BMP_IDS = BMP_PARTS.map(d => d.id);

// ---- Lesson 34: capacitive soil sensor on the desk, three female jumpers to 5V, GND and A0
export const SOIL_PARTS = [
  { id: 'soil1', type: 'soil', x: 20, z: 138 },
  { id: 'w90', type: 'fwire', from: 'soil1.GND', to: 'GND2', color: 'black', lift: 24 },
  { id: 'w91', type: 'fwire', from: 'soil1.VCC', to: '5V', color: 'red', lift: 30 },
  { id: 'w92', type: 'fwire', from: 'soil1.AOUT', to: 'A0', color: 'yellow', lift: 36 },
];
export const SOIL_IDS = SOIL_PARTS.map(d => d.id);

// ---- Lesson 35: sound sensor on the desk (AO on A0, 5V, GND) next to the LED circuit of Lesson 4
export const SND_PARTS = [
  { id: 'snd1', type: 'snd', x: 20, z: 138 },
  { id: 'w90', type: 'fwire', from: 'snd1.GND', to: 'GND1', color: 'black', lift: 24 },
  { id: 'w91', type: 'fwire', from: 'snd1.VCC', to: '5V', color: 'red', lift: 30 },
  { id: 'w92', type: 'fwire', from: 'snd1.AO', to: 'A0', color: 'yellow', lift: 36 },
];
export const SND_IDS = SND_PARTS.map(d => d.id);

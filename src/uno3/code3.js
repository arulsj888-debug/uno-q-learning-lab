// Sketch listings of UNO R3 lessons 40-59. The line numbers match the programs in src/sim3.js (checked by tools/check_code.mjs through CHECKS).
export const CODE3 = {};
export const CHECKS3 = {};
const def = (key, code, checks) => { CODE3[key] = code; CHECKS3[key] = checks; };

def('abuz', `const int buzzerPin = 8;   // through a 220 ohm resistor to the buzzer

void setup() {
  pinMode(buzzerPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(buzzerPin, HIGH);   // an active buzzer sounds when it gets power
  Serial.println("beep");
  delay(500);
  digitalWrite(buzzerPin, LOW);    // and is silent without it
  delay(500);
}`, [[1, 'buzzerPin = 8'], [3, 'void setup'], [4, 'pinMode'], [5, 'Serial.begin'], [8, 'void loop'], [9, 'HIGH'], [10, 'beep'], [11, 'delay(500)'], [12, 'LOW'], [13, 'delay(500)']]);

def('rc', `const int drivePin = 8;    // through the resistor to the capacitor
const int capPin = A0;      // reads the voltage across the capacitor

void setup() {
  pinMode(drivePin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(drivePin, HIGH);          // charge through 10 kΩ
  for (int i = 0; i < 6; i++) {
    Serial.println(analogRead(capPin) * 5.0 / 1023.0);
    delay(500);
  }
  digitalWrite(drivePin, LOW);           // discharge through 10 kΩ
  for (int i = 0; i < 6; i++) {
    Serial.println(analogRead(capPin) * 5.0 / 1023.0);
    delay(500);
  }
}`, [[1, 'drivePin = 8'], [2, 'capPin = A0'], [4, 'void setup'], [5, 'pinMode'], [6, 'Serial.begin'], [9, 'void loop'], [10, 'HIGH'], [11, 'for (int i'], [12, 'analogRead'], [13, 'delay(500)'], [15, 'LOW'], [16, 'for (int i'], [17, 'analogRead'], [18, 'delay(500)']]);

def('swt', `const int slidePin = 2;
const int reedPin = 3;
const int tiltPin = 4;

void setup() {
  pinMode(slidePin, INPUT);          // the slide switch always drives the pin: no pull-up needed
  pinMode(reedPin, INPUT_PULLUP);    // open contacts read HIGH, closed contacts read LOW
  pinMode(tiltPin, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  Serial.print("slide=");
  Serial.print(digitalRead(slidePin));
  Serial.print(" reed=");
  Serial.print(digitalRead(reedPin));
  Serial.print(" tilt=");
  Serial.println(digitalRead(tiltPin));
  delay(500);
}`, [[1, 'slidePin = 2'], [2, 'reedPin = 3'], [3, 'tiltPin = 4'], [5, 'void setup'], [6, 'slidePin, INPUT)'], [7, 'reedPin, INPUT_PULLUP'], [8, 'tiltPin, INPUT_PULLUP'], [9, 'Serial.begin'], [12, 'void loop'], [13, 'slide='], [14, 'digitalRead(slidePin)'], [15, 'reed='], [16, 'digitalRead(reedPin)'], [17, 'tilt='], [18, 'digitalRead(tiltPin)'], [19, 'delay(500)']]);

def('seg7', `const int segPins[7] = {2, 3, 4, 5, 6, 7, 8};   // segments a b c d e f g
const byte digits[10] = {
  0b0111111,   // 0   bit 0 = segment a ... bit 6 = segment g
  0b0000110,   // 1
  0b1011011,   // 2
  0b1001111,   // 3
  0b1100110,   // 4
  0b1101101,   // 5
  0b1111101,   // 6
  0b0000111,   // 7
  0b1111111,   // 8
  0b1101111    // 9
};

void setup() {
  for (int i = 0; i < 7; i++) pinMode(segPins[i], OUTPUT);
  Serial.begin(9600);
}

void loop() {
  for (int d = 0; d < 10; d++) {
    for (int s = 0; s < 7; s++) digitalWrite(segPins[s], (digits[d] >> s) & 1);
    Serial.println(d);
    delay(800);
  }
}`, [[1, 'segPins[7]'], [2, 'digits[10]'], [3, '0b0111111'], [12, '0b1101111'], [15, 'void setup'], [16, 'pinMode(segPins'], [17, 'Serial.begin'], [20, 'void loop'], [21, 'for (int d'], [22, 'digitalWrite(segPins[s]'], [23, 'Serial.println(d)'], [24, 'delay(800)']]);

def('irq', `const int buttonPin = 2;         // an interrupt pin of the UNO R3: 2 or 3
const int ledPin = 5;
volatile int presses = 0;
volatile bool changed = false;

void onPress() {
  presses++;
  changed = true;
}

void setup() {
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  attachInterrupt(digitalPinToInterrupt(buttonPin), onPress, FALLING);
}

void loop() {
  if (changed) {
    noInterrupts();               // a 2-byte variable must not change while we copy it
    int n = presses;
    changed = false;
    interrupts();
    digitalWrite(ledPin, n % 2);
    Serial.println(n);
  }
}`, [[1, 'buttonPin = 2'], [2, 'ledPin = 5'], [3, 'volatile int presses'], [4, 'volatile bool changed'], [6, 'void onPress'], [7, 'presses++'], [8, 'changed = true'], [11, 'void setup'], [12, 'INPUT_PULLUP'], [13, 'pinMode(ledPin'], [14, 'Serial.begin'], [15, 'attachInterrupt'], [18, 'void loop'], [19, 'if (changed)'], [20, 'noInterrupts'], [21, 'int n = presses'], [22, 'changed = false'], [23, 'interrupts()'], [24, 'digitalWrite(ledPin'], [25, 'Serial.println(n)']]);

def('timer', `#include <TimerOne.h>

const int ledPin = 5;
volatile bool ledOn = false;
volatile unsigned long ticks = 0;

void timerISR() {
  ledOn = !ledOn;
  digitalWrite(ledPin, ledOn);
  ticks++;
}

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Timer1.initialize(500000);          // 500 000 microseconds = every half second
  Timer1.attachInterrupt(timerISR);
}

void loop() {
  noInterrupts();
  unsigned long t = ticks;
  interrupts();
  Serial.println(t);
  delay(2000);                        // loop() can be busy: the LED keeps blinking
}`, [[1, 'TimerOne.h'], [3, 'ledPin = 5'], [4, 'volatile bool ledOn'], [5, 'volatile unsigned long ticks'], [7, 'void timerISR'], [8, 'ledOn = !ledOn'], [9, 'digitalWrite'], [10, 'ticks++'], [13, 'void setup'], [14, 'pinMode'], [15, 'Serial.begin'], [16, 'Timer1.initialize(500000)'], [17, 'attachInterrupt(timerISR)'], [20, 'void loop'], [21, 'noInterrupts'], [22, 'unsigned long t = ticks'], [23, 'interrupts'], [24, 'Serial.println(t)'], [25, 'delay(2000)']]);

def('eeprom', `#include <EEPROM.h>

const int addr = 0;                    // the first of the 1024 bytes

void setup() {
  Serial.begin(9600);
  byte runs = EEPROM.read(addr);
  if (runs == 255) runs = 0;           // a new EEPROM reads 255 in every byte
  runs++;
  EEPROM.update(addr, runs);           // writes only if the value changed
  Serial.print("This sketch has started ");
  Serial.print(runs);
  Serial.println(" times");
}

void loop() {
}`, [[1, 'EEPROM.h'], [3, 'addr = 0'], [5, 'void setup'], [6, 'Serial.begin'], [7, 'EEPROM.read'], [8, '255'], [9, 'runs++'], [10, 'EEPROM.update'], [11, 'started'], [12, 'Serial.print(runs)'], [13, 'times'], [16, 'void loop']]);

def('max7219', `#include <LedControl.h>

const int DIN_PIN = 11;
const int CLK_PIN = 13;
const int CS_PIN = 10;
LedControl lc = LedControl(DIN_PIN, CLK_PIN, CS_PIN, 1);   // one MAX7219

const byte smile[8] = {
  0b00111100, 0b01000010, 0b10100101, 0b10000001,
  0b10100101, 0b10011001, 0b01000010, 0b00111100
};

void setup() {
  lc.shutdown(0, false);       // wake the chip up
  lc.setIntensity(0, 4);       // brightness 0 ... 15
  lc.clearDisplay(0);
  for (int row = 0; row < 8; row++) lc.setRow(0, row, smile[row]);
}

void loop() {
  for (int i = 0; i < 16; i++) {
    lc.setIntensity(0, i);     // brighter and brighter
    delay(150);
  }
}`, [[1, 'LedControl.h'], [3, 'DIN_PIN = 11'], [4, 'CLK_PIN = 13'], [5, 'CS_PIN = 10'], [6, 'LedControl lc'], [8, 'smile[8]'], [9, '0b00111100'], [10, '0b10100101'], [13, 'void setup'], [14, 'lc.shutdown'], [15, 'setIntensity(0, 4)'], [16, 'clearDisplay'], [17, 'setRow'], [20, 'void loop'], [21, 'for (int i'], [22, 'setIntensity(0, i)'], [23, 'delay(150)']]);

def('tft', `#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <SPI.h>

#define TFT_CS 10
#define TFT_DC 9
#define TFT_RST 8
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);

int level = 0;

void setup() {
  tft.initR(INITR_BLACKTAB);          // 1.8 inch display, black tab
  tft.fillScreen(ST77XX_BLACK);
  tft.setTextSize(2);
  tft.setTextColor(ST77XX_YELLOW);
  tft.setCursor(8, 8);
  tft.println("UNO R3");
  tft.drawRect(8, 60, 112, 20, ST77XX_WHITE);
}

void loop() {
  level = (level + 8) % 104;
  tft.fillRect(10, 62, 108, 16, ST77XX_BLACK);
  tft.fillRect(10, 62, level + 4, 16, ST77XX_GREEN);
  tft.fillCircle(64, 120, 14, ST77XX_RED);
  delay(300);
}`, [[8, 'Adafruit_ST7735 tft'], [10, 'int level'], [12, 'void setup'], [13, 'initR'], [14, 'fillScreen'], [15, 'setTextSize(2)'], [16, 'setTextColor'], [17, 'setCursor'], [18, 'println("UNO R3")'], [19, 'drawRect'], [22, 'void loop'], [23, 'level = '], [24, 'fillRect(10, 62, 108'], [25, 'level + 4'], [26, 'fillCircle'], [27, 'delay(300)']]);

def('rfid', `#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10
#define RST_PIN 9
MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(9600);
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("Hold a card near the reader");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;
  Serial.print("UID:");
  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(rfid.uid.uidByte[i], HEX);
  }
  Serial.println();
  rfid.PICC_HaltA();
}`, [[6, 'MFRC522 rfid'], [8, 'void setup'], [9, 'Serial.begin'], [10, 'SPI.begin'], [11, 'PCD_Init'], [12, 'Hold a card'], [15, 'void loop'], [16, 'PICC_IsNewCardPresent'], [17, '"UID:"'], [18, 'for (byte i'], [19, '0x10'], [20, ', HEX'], [22, 'Serial.println()'], [23, 'PICC_HaltA']]);

def('sd', `#include <SPI.h>
#include <SD.h>

const int chipSelect = 10;
int count = 0;

void setup() {
  Serial.begin(9600);
  if (!SD.begin(chipSelect)) {
    Serial.println("Card failed or not present");
    while (1);
  }
  Serial.println("Card ready");
}

void loop() {
  File f = SD.open("LOG.TXT", FILE_WRITE);
  if (f) {
    f.print("reading ");
    f.println(count);
    f.close();
    Serial.print("wrote line ");
    Serial.println(count);
    count++;
  } else {
    Serial.println("could not open LOG.TXT");
  }
  delay(2000);
}`, [[4, 'chipSelect = 10'], [7, 'void setup'], [8, 'Serial.begin'], [9, 'SD.begin'], [10, 'failed'], [11, 'while (1)'], [13, 'Card ready'], [16, 'void loop'], [17, 'SD.open'], [18, 'if (f)'], [19, 'f.print'], [20, 'f.println(count)'], [21, 'f.close'], [22, 'wrote line'], [23, 'Serial.println(count)'], [24, 'count++'], [26, 'could not open'], [28, 'delay(2000)']]);

def('gas', `const int aoPin = A0;
const int doPin = 2;
const int alarmLevel = 450;     // choose it after you measured clean air

void setup() {
  pinMode(doPin, INPUT);
  Serial.begin(9600);
  Serial.println("Warming up...");
  delay(3000);                  // a real MQ-2 needs minutes to warm up
}

void loop() {
  int level = analogRead(aoPin);
  Serial.print("level ");
  Serial.print(level);
  if (level > alarmLevel) Serial.print("  GAS!");
  Serial.print("  DO=");
  Serial.println(digitalRead(doPin));
  delay(500);
}`, [[1, 'aoPin = A0'], [2, 'doPin = 2'], [3, 'alarmLevel = 450'], [5, 'void setup'], [6, 'pinMode(doPin'], [7, 'Serial.begin'], [8, 'Warming up'], [9, 'delay(3000)'], [12, 'void loop'], [13, 'analogRead'], [14, '"level "'], [15, 'Serial.print(level)'], [16, 'GAS!'], [17, 'DO='], [18, 'digitalRead(doPin)'], [19, 'delay(500)']]);

def('flame', `const int flamePin = 2;      // DO of the flame sensor
const int aoPin = A0;
const int ledPin = 5;

void setup() {
  pinMode(flamePin, INPUT);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  bool flame = digitalRead(flamePin) == LOW;    // LOW = flame on most modules
  digitalWrite(ledPin, flame);
  Serial.print("AO=");
  Serial.print(analogRead(aoPin));
  Serial.println(flame ? "  FLAME" : "  none");
  delay(300);
}`, [[1, 'flamePin = 2'], [2, 'aoPin = A0'], [3, 'ledPin = 5'], [5, 'void setup'], [6, 'pinMode(flamePin'], [7, 'pinMode(ledPin'], [8, 'Serial.begin'], [11, 'void loop'], [12, 'bool flame'], [13, 'digitalWrite(ledPin'], [14, '"AO="'], [15, 'analogRead(aoPin)'], [16, 'FLAME'], [17, 'delay(300)']]);

def('gps', `#include <SoftwareSerial.h>
#include <TinyGPSPlus.h>

SoftwareSerial gpsSerial(4, 3);    // Arduino RX = pin 4 (from the module TX), TX = pin 3
TinyGPSPlus gps;

void setup() {
  Serial.begin(9600);
  gpsSerial.begin(9600);
}

void loop() {
  while (gpsSerial.available() > 0) gps.encode(gpsSerial.read());
  if (gps.location.isValid()) {
    Serial.print(gps.location.lat(), 6);
    Serial.print(", ");
    Serial.print(gps.location.lng(), 6);
    Serial.print("  satellites: ");
    Serial.println(gps.satellites.value());
  } else {
    Serial.println("Waiting for a fix...");
  }
  delay(1000);
}`, [[4, 'SoftwareSerial gpsSerial(4, 3)'], [5, 'TinyGPSPlus gps'], [7, 'void setup'], [8, 'Serial.begin'], [9, 'gpsSerial.begin(9600)'], [12, 'void loop'], [13, 'gps.encode'], [14, 'isValid'], [15, 'lat(), 6'], [17, 'lng(), 6'], [18, 'satellites:'], [19, 'satellites.value'], [21, 'Waiting for a fix'], [23, 'delay(1000)']]);

def('rtc', `#include <Wire.h>
#include <RTClib.h>

RTC_DS3231 rtc;

void setup() {
  Serial.begin(9600);
  if (!rtc.begin()) {
    Serial.println("RTC not found");
    while (1);
  }
  if (rtc.lostPower()) {
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));   // set it to the time this sketch was compiled
  }
}

void loop() {
  DateTime now = rtc.now();
  Serial.print(now.year());
  Serial.print('-');
  Serial.print(now.month());
  Serial.print('-');
  Serial.print(now.day());
  Serial.print(' ');
  Serial.print(now.hour());
  Serial.print(':');
  Serial.print(now.minute());
  Serial.print(':');
  Serial.println(now.second());
  Serial.print("Temperature: ");
  Serial.println(rtc.getTemperature());
  delay(1000);
}`, [[4, 'RTC_DS3231 rtc'], [6, 'void setup'], [7, 'Serial.begin'], [8, 'rtc.begin'], [9, 'RTC not found'], [10, 'while (1)'], [12, 'lostPower'], [13, 'rtc.adjust'], [17, 'void loop'], [18, 'rtc.now'], [19, 'now.year'], [21, 'now.month'], [23, 'now.day'], [25, 'now.hour'], [27, 'now.minute'], [29, 'now.second'], [30, 'Temperature'], [31, 'getTemperature'], [32, 'delay(1000)']]);

def('a4988', `const int stepPin = 3;
const int dirPin = 4;
const int enablePin = 5;
const int stepsPerRev = 200;       // a 1.8 degree motor, full steps

void setup() {
  pinMode(stepPin, OUTPUT);
  pinMode(dirPin, OUTPUT);
  pinMode(enablePin, OUTPUT);
  digitalWrite(enablePin, LOW);    // ENABLE is active LOW
}

void loop() {
  digitalWrite(dirPin, HIGH);      // one direction
  for (int i = 0; i < stepsPerRev; i++) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(1000);
    digitalWrite(stepPin, LOW);
    delayMicroseconds(1000);
  }
  delay(1000);
  digitalWrite(dirPin, LOW);       // the other direction
  for (int i = 0; i < stepsPerRev; i++) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(1000);
    digitalWrite(stepPin, LOW);
    delayMicroseconds(1000);
  }
  delay(1000);
}`, [[1, 'stepPin = 3'], [2, 'dirPin = 4'], [3, 'enablePin = 5'], [4, 'stepsPerRev = 200'], [6, 'void setup'], [7, 'pinMode(stepPin'], [8, 'pinMode(dirPin'], [9, 'pinMode(enablePin'], [10, 'digitalWrite(enablePin, LOW)'], [13, 'void loop'], [14, 'digitalWrite(dirPin, HIGH)'], [15, 'for (int i'], [16, 'digitalWrite(stepPin, HIGH)'], [17, 'delayMicroseconds(1000)'], [18, 'digitalWrite(stepPin, LOW)'], [19, 'delayMicroseconds(1000)'], [21, 'delay(1000)'], [22, 'digitalWrite(dirPin, LOW)'], [23, 'for (int i'], [24, 'digitalWrite(stepPin, HIGH)'], [25, 'delayMicroseconds(1000)'], [26, 'digitalWrite(stepPin, LOW)'], [27, 'delayMicroseconds(1000)'], [29, 'delay(1000)']]);

def('fan', `const int motorPin = 9;        // PWM pin to the MOSFET gate (through 220 ohm)

void setup() {
  pinMode(motorPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  for (int speed = 0; speed <= 255; speed += 51) {
    analogWrite(motorPin, speed);
    Serial.println(speed);
    delay(1500);
  }
  analogWrite(motorPin, 0);
  delay(1500);
}`, [[1, 'motorPin = 9'], [3, 'void setup'], [4, 'pinMode'], [5, 'Serial.begin'], [8, 'void loop'], [9, 'for (int speed'], [10, 'analogWrite(motorPin, speed)'], [11, 'Serial.println(speed)'], [12, 'delay(1500)'], [14, 'analogWrite(motorPin, 0)'], [15, 'delay(1500)']]);

def('uart', `#include <SoftwareSerial.h>

SoftwareSerial link(10, 11);    // RX = pin 10, TX = pin 11
int counter = 0;

void setup() {
  Serial.begin(9600);
  link.begin(9600);
}

void loop() {
  link.print("HELLO ");
  link.println(counter);
  Serial.print("sent ");
  Serial.println(counter);
  unsigned long start = millis();
  while (millis() - start < 1000) {
    if (link.available()) Serial.write(link.read());
  }
  counter++;
}`, [[3, 'SoftwareSerial link(10, 11)'], [4, 'counter = 0'], [6, 'void setup'], [7, 'Serial.begin'], [8, 'link.begin'], [11, 'void loop'], [12, 'link.print("HELLO ")'], [13, 'link.println(counter)'], [14, '"sent "'], [15, 'Serial.println(counter)'], [16, 'millis()'], [17, 'while (millis()'], [18, 'link.available'], [20, 'counter++']]);

def('hc05', `#include <SoftwareSerial.h>

SoftwareSerial bt(10, 11);      // RX = pin 10 (module TXD), TX = pin 11 (module RXD)
const int ledPin = 5;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  bt.begin(9600);
}

void loop() {
  if (bt.available()) {
    char c = bt.read();
    Serial.print("received: ");
    Serial.println(c);
    if (c == '1') digitalWrite(ledPin, HIGH);
    if (c == '0') digitalWrite(ledPin, LOW);
    bt.print("LED is ");
    bt.println(digitalRead(ledPin) ? "on" : "off");
  }
}`, [[3, 'SoftwareSerial bt(10, 11)'], [4, 'ledPin = 5'], [6, 'void setup'], [7, 'pinMode'], [8, 'Serial.begin'], [9, 'bt.begin(9600)'], [12, 'void loop'], [13, 'bt.available'], [14, 'bt.read'], [15, 'received'], [16, 'Serial.println(c)'], [17, "c == '1'"], [18, "c == '0'"], [19, 'bt.print("LED is ")'], [20, 'bt.println']]);

def('nrf', `#include <SPI.h>
#include <RF24.h>

RF24 radio(9, 10);                 // CE = pin 9, CSN = pin 10
const byte address[6] = "00001";
int counter = 0;

void setup() {
  Serial.begin(9600);
  if (!radio.begin()) {
    Serial.println("nRF24L01 not found");
    while (1);
  }
  radio.setChannel(76);
  radio.openWritingPipe(address);
  radio.stopListening();           // this board only sends
}

void loop() {
  char text[16];
  sprintf(text, "hello %d", counter);
  bool ok = radio.write(&text, sizeof(text));
  Serial.print(text);
  Serial.println(ok ? "  delivered" : "  no answer");
  counter++;
  delay(1000);
}`, [[4, 'RF24 radio(9, 10)'], [5, 'address[6]'], [8, 'void setup'], [9, 'Serial.begin'], [10, 'radio.begin'], [11, 'not found'], [12, 'while (1)'], [14, 'setChannel(76)'], [15, 'openWritingPipe'], [16, 'stopListening'], [19, 'void loop'], [21, 'sprintf'], [22, 'radio.write'], [23, 'Serial.print(text)'], [24, 'delivered'], [25, 'counter++'], [26, 'delay(1000)']]);

// Sketch listings of ESP32 lessons 42-61 (Arduino-ESP32 core 3.x). Line numbers match the programs in src/sim4.js (checked by tools/check_code.mjs).
// Most listings are the UNO R3 listings of src/uno3/code3.js with the pins, baud rate and ADC range changed on the same lines.
import { CODE3, CHECKS3 } from '../uno3/code3.js';

export const CODE4 = {};
export const CHECKS4 = {};

/** same listing as the UNO R3, changed line by line (the number of lines must stay the same) */
function port(key, from, pairs) {
  let c = CODE3[from];
  for (const [a, b] of [...(c.includes('Serial.begin(9600)') ? [['Serial.begin(9600)', 'Serial.begin(115200)']] : []), ...pairs]) {
    if (!c.includes(a)) throw new Error('code4 ' + key + ': missing ' + a);
    c = c.split(a).join(b);
  }
  CODE4[key] = c; CHECKS4[key] = CHECKS3[from].map(([n, s]) => [n, pairs.reduce((t, [a, b]) => t.split(a).join(b), s.replace('Serial.begin(9600)', 'Serial.begin(115200)'))]);
}
const fresh = (key, code, checks) => { CODE4[key] = code; CHECKS4[key] = checks; };

port('abuz', 'abuz', [['buzzerPin = 8', 'buzzerPin = 25']]);
port('rc', 'rc', [['drivePin = 8', 'drivePin = 25'], ['capPin = A0', 'capPin = 34'], ['analogRead(capPin) * 5.0 / 1023.0', 'analogRead(capPin) * 3.3 / 4095.0']]);
port('swt', 'swt', [['slidePin = 2', 'slidePin = 25'], ['reedPin = 3', 'reedPin = 26'], ['tiltPin = 4', 'tiltPin = 27']]);
port('seg7', 'seg7', [['{2, 3, 4, 5, 6, 7, 8}', '{13, 14, 25, 26, 27, 32, 33}']]);
port('max7219', 'max7219', [['DIN_PIN = 11', 'DIN_PIN = 23'], ['CLK_PIN = 13', 'CLK_PIN = 18'], ['CS_PIN = 10', 'CS_PIN = 26']]);
port('tft', 'tft', [['#define TFT_CS 10', '#define TFT_CS 26'], ['#define TFT_DC 9', '#define TFT_DC 27'], ['#define TFT_RST 8', '#define TFT_RST 25']]);
port('rfid', 'rfid', [['#define SS_PIN 10', '#define SS_PIN 5'], ['#define RST_PIN 9', '#define RST_PIN 27']]);
port('sd', 'sd', [['chipSelect = 10', 'chipSelect = 5']]);
port('flame', 'flame', [['flamePin = 2;      // DO', 'flamePin = 26;     // DO'], ['aoPin = A0', 'aoPin = 34'], ['ledPin = 5', 'ledPin = 16']]);
port('rtc', 'rtc', []);
port('a4988', 'a4988', [['stepPin = 3', 'stepPin = 25'], ['dirPin = 4', 'dirPin = 26'], ['enablePin = 5', 'enablePin = 27']]);
port('nrf', 'nrf', [['RF24 radio(9, 10);                 // CE = pin 9, CSN = pin 10', 'RF24 radio(25, 26);               // CE = GPIO25, CSN = GPIO26']]);

fresh('gas', `const int aoPin = 34;           // AO through a voltage divider (see the lesson)
const int alarmLevel = 2400;    // choose it after you measured clean air

void setup() {
  Serial.begin(115200);
  Serial.println("Warming up...");
  delay(3000);                  // a real MQ-2 needs minutes to warm up
}

void loop() {
  int level = analogRead(aoPin);       // 0 ... 4095
  Serial.print("level ");
  Serial.print(level);
  if (level > alarmLevel) Serial.println("  GAS!");
  else Serial.println();
  delay(500);
}`, [[1, 'aoPin = 34'], [2, 'alarmLevel = 2400'], [4, 'void setup'], [5, 'Serial.begin(115200)'], [6, 'Warming up'], [7, 'delay(3000)'], [10, 'void loop'], [11, 'analogRead'], [12, '"level "'], [13, 'Serial.print(level)'], [14, 'GAS!'], [15, 'Serial.println()'], [16, 'delay(500)']]);

fresh('gps', `#include <TinyGPSPlus.h>

HardwareSerial gpsSerial(2);    // UART2: RX = GPIO16, TX = GPIO17
TinyGPSPlus gps;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);
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
}`, [[3, 'HardwareSerial gpsSerial(2)'], [4, 'TinyGPSPlus gps'], [6, 'void setup'], [7, 'Serial.begin(115200)'], [8, 'gpsSerial.begin(9600, SERIAL_8N1, 16, 17)'], [11, 'void loop'], [12, 'gps.encode'], [13, 'isValid'], [14, 'lat(), 6'], [16, 'lng(), 6'], [17, 'satellites:'], [18, 'satellites.value'], [20, 'Waiting for a fix'], [22, 'delay(1000)']]);

fresh('fan', `const int motorPin = 25;       // PWM output to the MOSFET gate (through 220 ohm)
const int freq = 5000;         // PWM frequency in Hz
const int resolution = 8;      // duty 0 ... 255

void setup() {
  Serial.begin(115200);
  ledcAttach(motorPin, freq, resolution);   // Arduino-ESP32 core 3.x
}

void loop() {
  for (int speed = 0; speed <= 255; speed += 51) {
    ledcWrite(motorPin, speed);
    Serial.println(speed);
    delay(1500);
  }
  ledcWrite(motorPin, 0);
  delay(1500);
}`, [[1, 'motorPin = 25'], [2, 'freq = 5000'], [3, 'resolution = 8'], [5, 'void setup'], [6, 'Serial.begin(115200)'], [7, 'ledcAttach(motorPin'], [10, 'void loop'], [11, 'for (int speed'], [12, 'ledcWrite(motorPin, speed)'], [13, 'Serial.println(speed)'], [14, 'delay(1500)'], [16, 'ledcWrite(motorPin, 0)'], [17, 'delay(1500)']]);

fresh('uart', `int counter = 0;

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);   // RX = GPIO16, TX = GPIO17
}

void loop() {
  Serial2.print("HELLO ");
  Serial2.println(counter);
  Serial.print("sent ");
  Serial.println(counter);
  unsigned long start = millis();
  while (millis() - start < 1000) {
    if (Serial2.available()) Serial.write(Serial2.read());
  }
  counter++;
}`, [[1, 'counter = 0'], [3, 'void setup'], [4, 'Serial.begin(115200)'], [5, 'Serial2.begin(9600, SERIAL_8N1, 16, 17)'], [8, 'void loop'], [9, 'Serial2.print("HELLO ")'], [10, 'Serial2.println(counter)'], [11, '"sent "'], [12, 'Serial.println(counter)'], [13, 'millis()'], [14, 'while (millis()'], [15, 'Serial2.available'], [17, 'counter++']]);

fresh('btc', `#include "BluetoothSerial.h"

BluetoothSerial SerialBT;
const int ledPin = 16;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
  SerialBT.begin("ESP32-Lab");        // the name the phone sees
}

void loop() {
  if (SerialBT.available()) {
    char c = SerialBT.read();
    Serial.print("received: ");
    Serial.println(c);
    if (c == '1') digitalWrite(ledPin, HIGH);
    if (c == '0') digitalWrite(ledPin, LOW);
    SerialBT.print("LED is ");
    SerialBT.println(digitalRead(ledPin) ? "on" : "off");
  }
}`, [[3, 'BluetoothSerial SerialBT'], [4, 'ledPin = 16'], [6, 'void setup'], [7, 'pinMode'], [8, 'Serial.begin(115200)'], [9, 'SerialBT.begin("ESP32-Lab")'], [12, 'void loop'], [13, 'SerialBT.available'], [14, 'SerialBT.read'], [15, 'received'], [16, 'Serial.println(c)'], [17, "c == '1'"], [18, "c == '0'"], [19, 'SerialBT.print("LED is ")'], [20, 'SerialBT.println']]);

fresh('espnow', `#include <WiFi.h>
#include <esp_now.h>

uint8_t peerAddress[] = {0x24, 0x6F, 0x28, 0xAA, 0xBB, 0xCC};   // MAC of the receiver: use your own
int counter = 0;

void onSent(const uint8_t *mac, esp_now_send_status_t status) {
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "  delivered" : "  failed");
}

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }
  esp_now_register_send_cb(onSent);
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, peerAddress, 6);
  peer.channel = 0;
  peer.encrypt = false;
  esp_now_add_peer(&peer);
}

void loop() {
  char text[16];
  sprintf(text, "hello %d", counter++);
  Serial.print(text);
  esp_now_send(peerAddress, (uint8_t *)text, sizeof(text));
  delay(1000);
}`, [[4, 'peerAddress[]'], [5, 'counter = 0'], [7, 'void onSent'], [8, 'ESP_NOW_SEND_SUCCESS'], [11, 'void setup'], [12, 'Serial.begin(115200)'], [13, 'WiFi.mode(WIFI_STA)'], [14, 'esp_now_init'], [15, 'init failed'], [18, 'esp_now_register_send_cb'], [19, 'esp_now_peer_info_t'], [20, 'memcpy'], [23, 'esp_now_add_peer'], [26, 'void loop'], [28, 'sprintf'], [29, 'Serial.print(text)'], [30, 'esp_now_send'], [31, 'delay(1000)']]);

fresh('timer', `const int ledPin = 16;
hw_timer_t *timer = NULL;
volatile bool ledOn = false;
volatile unsigned long ticks = 0;

void IRAM_ATTR onTimer() {
  ledOn = !ledOn;
  digitalWrite(ledPin, ledOn);
  ticks++;
}

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
  timer = timerBegin(1000000);              // 1 MHz: one tick = 1 microsecond (Arduino-ESP32 core 3.x)
  timerAttachInterrupt(timer, &onTimer);
  timerAlarm(timer, 500000, true, 0);       // every 500 000 ticks = 0.5 s, reload automatically
}

void loop() {
  Serial.println(ticks);
  delay(2000);                              // loop() is busy: the LED keeps blinking
}`, [[1, 'ledPin = 16'], [2, 'hw_timer_t'], [3, 'volatile bool ledOn'], [4, 'volatile unsigned long ticks'], [6, 'IRAM_ATTR onTimer'], [7, 'ledOn = !ledOn'], [8, 'digitalWrite'], [9, 'ticks++'], [12, 'void setup'], [13, 'pinMode'], [14, 'Serial.begin(115200)'], [15, 'timerBegin(1000000)'], [16, 'timerAttachInterrupt'], [17, 'timerAlarm(timer, 500000'], [20, 'void loop'], [21, 'Serial.println(ticks)'], [22, 'delay(2000)']]);

fresh('prefs', `#include <Preferences.h>

Preferences prefs;

void setup() {
  Serial.begin(115200);
  prefs.begin("lab", false);                       // namespace "lab", read and write
  unsigned int runs = prefs.getUInt("runs", 0);    // 0 if the key does not exist yet
  runs++;
  prefs.putUInt("runs", runs);
  prefs.end();
  Serial.print("This sketch has started ");
  Serial.print(runs);
  Serial.println(" times");
}

void loop() {
}`, [[1, 'Preferences.h'], [3, 'Preferences prefs'], [5, 'void setup'], [6, 'Serial.begin(115200)'], [7, 'prefs.begin("lab"'], [8, 'getUInt("runs", 0)'], [9, 'runs++'], [10, 'putUInt("runs", runs)'], [11, 'prefs.end()'], [12, 'started'], [13, 'Serial.print(runs)'], [14, 'times'], [17, 'void loop']]);
CHECKS4.nrf = CHECKS4.nrf.map(([n, s]) => (n === 4 ? [4, 'RF24 radio(25, 26)'] : [n, s]));

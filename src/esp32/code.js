// Sketch listings of the ESP32 DevKit V1 lessons (Arduino-ESP32 core 3.x). The line numbers match the programs in src/sim.js
// (checked by tools/check_code.mjs). On the ESP32 a pin is written by its GPIO number: pinMode(16, OUTPUT).
export const E32_BLINK = `// Blink the blue LED on GPIO2
const int ledPin = 2;   // the blue LED is wired to GPIO2

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);   // LED on
  delay(1000);                  // wait 1 second
  digitalWrite(ledPin, LOW);    // LED off
  delay(1000);                  // wait 1 second
  Serial.println("Hello World");
}`;

export const E32_EXT_LED = `// Blink an external LED connected to GPIO16
const int ledPin = 16;

void setup() {
  pinMode(ledPin, OUTPUT);     // GPIO16 becomes an output
}

void loop() {
  digitalWrite(ledPin, HIGH);  // GPIO16 = 3.3 V -> current flows -> LED ON
  delay(1000);                 // wait 1 second
  digitalWrite(ledPin, LOW);   // GPIO16 = 0 V -> no current -> LED OFF
  delay(1000);                 // wait 1 second
}`;

export const E32_BUTTON = `// Button on GPIO17 (the other side to GND), LED on GPIO16
const int buttonPin = 17;
const int ledPin = 16;

void setup() {
  Serial.begin(115200);
  pinMode(buttonPin, INPUT_PULLUP);   // internal pull-up resistor (about 45 kOhm)
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int buttonState = digitalRead(buttonPin);   // LOW while the button is pressed
  if (buttonState == LOW) {
    digitalWrite(ledPin, HIGH);
    Serial.println("Button is pressed. LED is on.");
  } else {
    digitalWrite(ledPin, LOW);
    Serial.println("Button is not pressed. LED is off.");
  }
  delay(200);
}`;

export const E32_POT = `// Read a potentiometer on GPIO34 (ADC1, input only)
const int potPin = 34;

void setup() {
  Serial.begin(115200);
}

void loop() {
  int value = analogRead(potPin);   // 0 ... 4095 (12-bit)
  Serial.println(value);
  delay(100);
}`;

export const E32_FADE = `// Fade an LED on GPIO16 with LEDC PWM (Arduino-ESP32 core 3.x)
const int ledPin = 16;
int brightness = 0;
int fadeAmount = 5;

void setup() {
  ledcAttach(ledPin, 5000, 8);        // pin, 5 kHz, 8-bit resolution (0 ... 255)
}

void loop() {
  ledcWrite(ledPin, brightness);      // duty = brightness / 255
  brightness = brightness + fadeAmount;
  if (brightness <= 0 || brightness >= 255) {
    fadeAmount = -fadeAmount;         // turn around at the ends
  }
  delay(30);
}`;

// Lesson 8 — Wi-Fi scan, simplified from the WiFiScan example of the Arduino-ESP32 library (WiFi.scanNetworks, SSID, RSSI, encryptionType)
export const E32_SCAN = `#include "WiFi.h"

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);            // station mode: the ESP32 joins networks
}

void loop() {
  Serial.println("Scan start");
  int n = WiFi.scanNetworks();    // returns the number of networks found
  Serial.print(n);
  Serial.println(" networks found");
  for (int i = 0; i < n; ++i) {
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.print(WiFi.SSID(i));   // network name
    Serial.print(" (");
    Serial.print(WiFi.RSSI(i));   // signal strength in dBm
    Serial.print(" dBm) ");
    Serial.println(WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? "open" : "secured");
  }
  WiFi.scanDelete();              // free the memory of the scan result
  delay(5000);                    // scan again in 5 seconds
}`;

// Lesson 9 — join a network (WiFi.mode, WiFi.begin, WiFi.status, WiFi.localIP as in the HelloServer example)
export const E32_CONNECT = `#include "WiFi.h"

const char *ssid = "HomeNet";         // your Wi-Fi name
const char *password = "MyPassword";  // your Wi-Fi password

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);         // start joining the network
  Serial.println("Connecting to Wi-Fi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Still connecting...");
  }
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());     // the address the router gave us
}

void loop() {
}`;

// Lesson 10 — web server that switches an LED (WebServer library: on, begin, handleClient, send, sendHeader; shape of the HelloServer example)
export const E32_WEB = `#include <WiFi.h>
#include <WebServer.h>

const char *ssid = "HomeNet";
const char *password = "MyPassword";
const int ledPin = 16;
bool ledOn = false;

WebServer server(80);                 // HTTP server on port 80

void handleRoot() {
  String state = ledOn ? "ON" : "OFF";
  server.send(200, "text/html", "<h1>LED is " + state + "</h1><a href=\\"/on\\">Turn on</a> <a href=\\"/off\\">Turn off</a>");
}

void handleOn() {
  ledOn = true;
  digitalWrite(ledPin, HIGH);
  server.sendHeader("Location", "/");   // send the browser back to the main page
  server.send(303);
}

void handleOff() {
  ledOn = false;
  digitalWrite(ledPin, LOW);
  server.sendHeader("Location", "/");
  server.send(303);
}

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  Serial.print("Open http://");
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);
  server.on("/on", handleOn);
  server.on("/off", handleOff);
  server.begin();
}

void loop() {
  server.handleClient();     // answer waiting browser requests
}`;

// Lesson 11 — capacitive touch (touchRead on T0 = GPIO4; threshold pattern of the Random Nerd Tutorials touch example)
export const E32_TOUCH = `// Touch sensor on GPIO4 (T0), LED on GPIO16
const int touchPin = 4;
const int ledPin = 16;
const int threshold = 20;          // below this = touched

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int touchValue = touchRead(touchPin);   // smaller number = finger closer
  Serial.println(touchValue);
  if (touchValue < threshold) {
    digitalWrite(ledPin, HIGH);          // touched: LED on
  } else {
    digitalWrite(ledPin, LOW);           // not touched: LED off
  }
  delay(500);
}`;

// Lesson 12 — deep sleep with a timer wake-up (simplified from the TimerWakeUp example of the Arduino-ESP32 library)
export const E32_SLEEP = `// Deep sleep with a timer wake-up (the LED on GPIO16 shows when the ESP32 is awake)
#define uS_TO_S_FACTOR 1000000ULL   // microseconds per second
#define TIME_TO_SLEEP 5             // sleep for 5 seconds
const int ledPin = 16;
RTC_DATA_ATTR int bootCount = 0;    // kept in RTC memory during deep sleep

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, HIGH);       // awake: LED on
  ++bootCount;
  Serial.println("Boot number: " + String(bootCount));
  if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_TIMER) {
    Serial.println("Wakeup caused by timer");
  }
  delay(2000);                      // stay awake for 2 seconds
  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  Serial.println("Going to sleep now");
  Serial.flush();                   // finish sending the text
  esp_deep_sleep_start();           // nothing after this line runs
}

void loop() {
}`;

// Lesson 13 — Bluetooth LE server with one writable characteristic (based on the Write example of the Arduino-ESP32 BLE library)
export const E32_BLE = `#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
const int ledPin = 16;

class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue();
    if (value == "1") {
      digitalWrite(ledPin, HIGH);
      Serial.println("LED on");
    } else if (value == "0") {
      digitalWrite(ledPin, LOW);
      Serial.println("LED off");
    }
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(ledPin, OUTPUT);
  BLEDevice::init("ESP32-LED");                      // the name phones see
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);
  BLECharacteristic *pCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE);
  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->setValue("0");
  pService->start();
  BLEAdvertising *pAdvertising = pServer->getAdvertising();
  pAdvertising->start();                             // now phones can find the ESP32
  Serial.println("Advertising as ESP32-LED");
}

void loop() {
  delay(2000);
}`;

// Lesson 14 — RGB LED (common cathode) with LEDC PWM (Arduino-ESP32 core 3.x: ledcAttach, ledcWrite)
export const E32_RGB = `// RGB LED (common cathode): red on GPIO16, green on GPIO17, blue on GPIO18
const int redPin = 16;
const int greenPin = 17;
const int bluePin = 18;

void setColor(int r, int g, int b) {
  ledcWrite(redPin, r);         // 0 ... 255 (8-bit)
  ledcWrite(greenPin, g);
  ledcWrite(bluePin, b);
}

void setup() {
  ledcAttach(redPin, 5000, 8);      // pin, 5 kHz, 8-bit resolution
  ledcAttach(greenPin, 5000, 8);
  ledcAttach(bluePin, 5000, 8);
}

void loop() {
  setColor(255, 0, 0);          // red
  delay(1000);
  setColor(0, 255, 0);          // green
  delay(1000);
  setColor(0, 0, 255);          // blue
  delay(1000);
  setColor(255, 255, 0);        // red + green = yellow
  delay(1000);
  setColor(255, 255, 255);      // all three = white
  delay(1000);
  setColor(0, 0, 0);            // off
  delay(1000);
}`;

// Lesson 15 — DHT22 (shortened from the DHTtester example of the Adafruit DHT sensor library)
export const E32_DHT = `#include "DHT.h"

#define DHTPIN 4        // the GPIO the DATA wire is on
#define DHTTYPE DHT22   // DHT 22 (AM2302)

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
}

void loop() {
  delay(2000);                       // DHT22: at most one reading every 2 seconds
  float h = dht.readHumidity();
  float t = dht.readTemperature();   // Celsius
  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print(" %  Temperature: ");
  Serial.print(t);
  Serial.println(" C");
}`;

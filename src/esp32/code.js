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

// Lesson 16 — analog joystick on two ADC1 pins
export const E32_JOY = `// Analog joystick: VRx on GPIO34, VRy on GPIO35, switch on GPIO17
const int xPin = 34;
const int yPin = 35;
const int swPin = 17;

void setup() {
  Serial.begin(115200);
  pinMode(swPin, INPUT_PULLUP);   // the switch connects to GND when the stick is pressed
}

void loop() {
  int x = analogRead(xPin);       // 0 ... 4095, about 2048 at the centre
  int y = analogRead(yPin);
  bool pressed = (digitalRead(swPin) == LOW);
  Serial.print("X: ");
  Serial.print(x);
  Serial.print("  Y: ");
  Serial.print(y);
  Serial.print("  Button: ");
  Serial.println(pressed ? "pressed" : "released");
  delay(200);
}`;

// Lesson 17 — rotary encoder (polling the two quadrature signals)
export const E32_ENC = `// Rotary encoder (KY-040 style): CLK on GPIO16, DT on GPIO17, SW on GPIO18
const int clkPin = 16;
const int dtPin = 17;
const int swPin = 18;
int counter = 0;
int lastClk;

void setup() {
  Serial.begin(115200);
  pinMode(clkPin, INPUT_PULLUP);
  pinMode(dtPin, INPUT_PULLUP);
  pinMode(swPin, INPUT_PULLUP);
  lastClk = digitalRead(clkPin);
}

void loop() {
  int clk = digitalRead(clkPin);
  if (clk != lastClk && clk == LOW) {   // CLK just fell: one step
    if (digitalRead(dtPin) != clk) counter++;   // DT is still HIGH: one direction
    else counter--;                             // DT is already LOW: the other
    Serial.println(counter);
  }
  lastClk = clk;
  if (digitalRead(swPin) == LOW) {       // knob pressed
    Serial.println("Knob pressed");
    delay(300);
  }
  delay(2);
}`;

// Lesson 18 — 16x2 LCD with I2C backpack
export const E32_LCD = `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);   // I2C address 0x27, 16 columns, 2 rows

void setup() {
  lcd.init();                // start the display
  lcd.backlight();           // switch the backlight on
  lcd.setCursor(0, 0);       // column 0, row 0 (the top line)
  lcd.print("Hello, ESP32!");
}

void loop() {
  lcd.setCursor(0, 1);       // column 0, row 1 (the bottom line)
  lcd.print("Seconds: ");
  lcd.print(millis() / 1000);
  delay(1000);
}`;

// Lesson 19 — SSD1306 OLED
export const E32_OLED = `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);   // 128 x 64 pixels, no reset pin

void setup() {
  Serial.begin(115200);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {   // I2C address 0x3C
    Serial.println("SSD1306 not found");
    for (;;);                                         // stop here
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Hello, ESP32!");
  display.println("OLED 128 x 64");
  display.display();                                  // send the picture to the screen
}

void loop() {
}`;

// Lesson 20 — NeoPixel (WS2812B) strip with the Adafruit_NeoPixel library
export const E32_NEO = `#include <Adafruit_NeoPixel.h>

#define PIN 16          // the pin the DIN wire is on
#define NUMPIXELS 8    // number of pixels on the strip

Adafruit_NeoPixel strip(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  strip.begin();                 // start the strip
  strip.setBrightness(40);       // 0 ... 255: keep it low to limit the current
  strip.show();                  // all pixels off
}

void loop() {
  for (int i = 0; i < NUMPIXELS; i++) {
    strip.clear();                                   // all pixels off
    strip.setPixelColor(i, strip.Color(255, 0, 0));  // pixel i red
    strip.show();                                    // send the colours to the strip
    delay(150);
  }
}`;

// Lesson 21 — NPN transistor (PN2222A) switching a 6 V lamp
export const E32_QSW = `// A transistor switches a 6 V lamp: the pin drives the base through a resistor
const int basePin = 16;

void setup() {
  pinMode(basePin, OUTPUT);
}

void loop() {
  digitalWrite(basePin, HIGH);   // base current flows: the lamp lights
  delay(1000);
  digitalWrite(basePin, LOW);    // no base current: the lamp is off
  delay(1000);
}`;

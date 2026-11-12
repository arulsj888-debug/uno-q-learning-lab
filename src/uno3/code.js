// Sketch listings of the Arduino UNO R3 lessons. The line numbers match the programs in src/sim.js (checked by tools/check_code.mjs).
// On the classic UNO core pins are plain numbers (5, 9, 13) — the names D5 … do not exist there.
export const U3_BLINK = `void setup() {
  Serial.begin(9600);
  // initialize digital pin LED_BUILTIN (pin 13) as an output.
  pinMode(LED_BUILTIN, OUTPUT);
}

// the loop function runs over and over again forever
void loop() {
  digitalWrite(LED_BUILTIN, HIGH);  // turn the LED on (HIGH is the voltage level)
  delay(1000);                      // wait for a second
  digitalWrite(LED_BUILTIN, LOW);   // turn the LED off by making the voltage LOW
  delay(1000);                      // wait for a second

  Serial.println("Hello World");
}`;

export const U3_EXT_LED = `// Blink an external LED connected to pin 5
int ledPin = 5;

void setup() {
  pinMode(ledPin, OUTPUT);   // pin 5 becomes an output
}

void loop() {
  digitalWrite(ledPin, HIGH);  // pin 5 = 5 V -> current flows -> LED ON
  delay(1000);                 // wait 1 second
  digitalWrite(ledPin, LOW);   // pin 5 = 0 V -> no current -> LED OFF
  delay(1000);                 // wait 1 second
}`;

export const U3_BUTTON = `// Define button and LED pin
int buttonPin = 4;
int ledPin = 5;

// Variable to store the button state
int buttonState = 0;

void setup() {
  // Configure button and LED pins
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);

  // Initialize Serial communication
  Serial.begin(9600);
}

void loop() {
  // Read the state of the button
  buttonState = digitalRead(buttonPin);

  // If the button is pressed, turn on the LED and print its state to the Serial Monitor
  if (buttonState == LOW) {
    digitalWrite(ledPin, HIGH);
    Serial.println("- Button is pressed. LED is on.");
  } else {
    // If the button is not pressed, turn off the LED and print to the Serial Monitor
    digitalWrite(ledPin, LOW);
    Serial.println("- Button is not pressed. LED is off.");
  }

  // Wait for 1000 milliseconds
  delay(1000);
}`;

// classic AnalogReadSerial pattern; the UNO R3 ADC is 10-bit (0 ... 1023) by default
export const U3_POT = `int sensorPin = A0;   // select the input pin for the potentiometer
int sensorValue = 0;  // variable to store the value coming from the sensor

void setup() {
  Serial.begin(9600);
}

void loop() {
  // read the value from the sensor:
  sensorValue = analogRead(sensorPin);
  Serial.println(sensorValue);
  delay(100);
}`;

export const U3_FADE = `// Fade an LED on PWM pin 5
int led = 5;           // ~5 is a PWM pin
int brightness = 0;    // 0 ... 255 (8-bit PWM)
int fadeAmount = 5;    // how much to change each step

void setup() {
  pinMode(led, OUTPUT);
}

void loop() {
  analogWrite(led, brightness);          // set the duty cycle
  brightness = brightness + fadeAmount;
  if (brightness <= 0 || brightness >= 255) {
    fadeAmount = -fadeAmount;            // reverse at both ends
  }
  delay(30);
}`;

export const U3_BUZZER = `// Play a C-major scale on a passive piezo buzzer
int buzzerPin = 9;
int notes[] = {262, 294, 330, 349, 392, 440, 494, 523};  // C4 ... C5 in Hz

void setup() {
}

void loop() {
  for (int i = 0; i < 8; i++) {
    tone(buzzerPin, notes[i], 250);   // start a 250 ms note (returns at once)
    delay(300);                       // wait for the note + a short gap
  }
  noTone(buzzerPin);
  delay(1000);                        // 1 s of silence, then repeat
}`;

// Lesson 9 — LDR + 10 kOhm divider on 5 V: 10-bit readings, no analogReadResolution() on the UNO R3
export const U3_NIGHT = `// Night light: the LED turns on when it gets dark
int ldrPin = A0;       // LDR + 10 kOhm voltage divider
int ledPin = 5;        // LED from Lesson 4
int threshold = 250;   // adjust for your room

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(ldrPin);   // more light -> bigger number
  Serial.println(light);
  if (light < threshold) {
    digitalWrite(ledPin, HIGH);     // dark -> LED on
  } else {
    digitalWrite(ledPin, LOW);      // bright -> LED off
  }
  delay(200);
}`;

// Lesson 10 — TMP36 (0.5 V at 0 C, +10 mV per C) read with the 5 V reference; ADC = Vin x 1024 / Vref
export const U3_TMP36 = `// Measure temperature with a TMP36 on A0
int sensorPin = A0;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int reading = analogRead(sensorPin);            // 0 ... 1023
  float voltage = reading * 5.0 / 1024.0;         // reading -> volts (5 V reference)
  float temperatureC = (voltage - 0.5) * 100.0;   // TMP36: 0.5 V at 0 C, +10 mV per C
  Serial.print(voltage, 3);
  Serial.print(" V  ->  ");
  Serial.print(temperatureC, 1);
  Serial.println(" C");
  delay(1000);
}`;

// Lesson 11 — HC-SR04 (Elecfreaks datasheet: 10 us trigger, us / 58 = cm, cycle > 60 ms); same line numbers as the UNO Q listing
export const U3_ULTRASONIC = `// Measure distance with an HC-SR04 ultrasonic sensor
int trigPin = 7;   // TRIG: a 5 V pin gives a clean TTL pulse
int echoPin = 8;   // ECHO: 5 V signal, fine for the 5 V UNO R3

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);   // plain INPUT: the module drives the line
  Serial.begin(9600);
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);    // 10 us trigger pulse
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  unsigned long duration = pulseIn(echoPin, HIGH);  // echo time in us
  float distanceCm = duration / 58.0;               // datasheet: us / 58 = cm

  Serial.print(distanceCm, 1);
  Serial.println(" cm");
  delay(100);                     // datasheet: wait more than 60 ms
}`;

// Lesson 12 — HC-SR501 PIR (datasheet: 3.3 V output while motion, ~1 min start-up)
export const U3_PIR = `// Motion alarm: HC-SR501 PIR on pin 2, LED on pin 5
int pirPin = 2;      // PIR OUT: 3.3 V while motion is detected
int ledPin = 5;      // LED from Lesson 4
int lastState = LOW;

void setup() {
  pinMode(pirPin, INPUT);
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.println("PIR warming up (about 1 minute)...");
  delay(60000);                      // datasheet: ~1 min to start up
  Serial.println("Ready");
}

void loop() {
  int motion = digitalRead(pirPin);  // HIGH = motion
  if (motion == HIGH) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  if (motion != lastState) {         // print only when it changes
    if (motion == HIGH) {
      Serial.println("Motion detected!");
    } else {
      Serial.println("Motion ended");
    }
    lastState = motion;
  }
  delay(50);
}`;

// Lesson 13 — SG90 with the Servo library (AVR: defaults 544-2400 us for 0-180 degrees)
export const U3_SERVO = `#include <Servo.h>

Servo myServo;        // one Servo object per motor
int servoPin = 9;     // orange signal wire

void setup() {
  myServo.attach(servoPin);   // start sending a pulse every 20 ms
}

void loop() {
  myServo.write(0);     // 0 degrees
  delay(1000);
  myServo.write(90);    // 90 degrees (middle)
  delay(1000);
  myServo.write(180);   // 180 degrees
  delay(1000);
}`;

// Lesson 14 — DC motor with an L293D (TI datasheet: EN/1A/2A function table, PWM on EN for speed)
export const U3_MOTOR = `// DC motor with an L293D H-bridge
int enablePin = 5;    // L293D pin 1 (1,2EN): PWM = speed
int in1Pin = 7;       // L293D pin 2 (1A)
int in2Pin = 8;       // L293D pin 7 (2A)

void setup() {
  pinMode(enablePin, OUTPUT);
  pinMode(in1Pin, OUTPUT);
  pinMode(in2Pin, OUTPUT);
}

void loop() {
  // direction 1, full speed
  digitalWrite(in1Pin, HIGH);
  digitalWrite(in2Pin, LOW);
  analogWrite(enablePin, 255);
  delay(2000);

  // direction 1, half speed
  analogWrite(enablePin, 128);
  delay(2000);

  // EN LOW: the motor coasts to a stop
  analogWrite(enablePin, 0);
  delay(1500);

  // direction 2, full speed
  digitalWrite(in1Pin, LOW);
  digitalWrite(in2Pin, HIGH);
  analogWrite(enablePin, 255);
  delay(2000);

  // 1A = 2A: fast stop (brake)
  digitalWrite(in2Pin, LOW);
  delay(1500);
}`;

// Lesson 15 — low-level-trigger relay module on pin 4 (Handsontec: relay actuates when IN is LOW); a 5 V pin can drive HIGH = off
export const U3_RELAY = `// Relay module (low-level trigger): the relay is ON when the pin is LOW
int relayPin = 4;

void relayOn() {
  digitalWrite(relayPin, LOW);    // LOW = relay ON (the lamp lights)
}

void relayOff() {
  digitalWrite(relayPin, HIGH);   // HIGH = relay OFF
}

void setup() {
  pinMode(relayPin, OUTPUT);
  relayOff();                     // start with the relay OFF
  Serial.begin(9600);
}

void loop() {
  relayOn();
  Serial.println("Relay ON  - lamp ON");
  delay(3000);
  relayOff();
  Serial.println("Relay OFF - lamp OFF");
  delay(3000);
}`;

// Lesson 16 — Adafruit SHT31 library (begin(0x44), readTemperature(), readHumidity()), shortened from the library example
export const U3_SHT31 = `#include <Wire.h>
#include "Adafruit_SHT31.h"

Adafruit_SHT31 sht31 = Adafruit_SHT31();

void setup() {
  Serial.begin(9600);
  if (!sht31.begin(0x44)) {          // 0x44 = default I2C address
    Serial.println("Couldn't find SHT31");
    while (1) delay(1);              // stop here
  }
}

void loop() {
  float t = sht31.readTemperature();   // degrees C
  float h = sht31.readHumidity();      // % relative humidity
  Serial.print("Temperature: ");
  Serial.print(t, 1);
  Serial.println(" C");
  Serial.print("Humidity: ");
  Serial.print(h, 1);
  Serial.println(" %");
  delay(2000);
}`;

// Lesson 17 — RGB LED (common cathode), analogWrite on three PWM pins
export const U3_RGB = `// RGB LED (common cathode): red on pin 9, green on pin 10, blue on pin 11
const int redPin = 9;
const int greenPin = 10;
const int bluePin = 11;

void setColor(int r, int g, int b) {
  analogWrite(redPin, r);       // 0 ... 255
  analogWrite(greenPin, g);
  analogWrite(bluePin, b);
}

void setup() {
  pinMode(redPin, OUTPUT);
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);
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

// Lesson 18 — DHT11 (shortened from the DHTtester example of the Adafruit DHT sensor library)
export const U3_DHT = `#include "DHT.h"

#define DHTPIN 2        // the pin the DATA wire is on
#define DHTTYPE DHT11   // DHT 11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  delay(2000);                       // the sensor is slow: wait between readings
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

// Lesson 19 — analog joystick
export const U3_JOY = `// Analog joystick: VRx on A0, VRy on A1, switch on pin 2
const int xPin = A0;
const int yPin = A1;
const int swPin = 2;

void setup() {
  Serial.begin(9600);
  pinMode(swPin, INPUT_PULLUP);   // the switch connects to GND when the stick is pressed
}

void loop() {
  int x = analogRead(xPin);       // 0 ... 1023, about 512 at the centre
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

// Lesson 20 — rotary encoder (polling the two quadrature signals)
export const U3_ENC = `// Rotary encoder (KY-040 style): CLK on pin 2, DT on pin 3, SW on pin 4
const int clkPin = 2;
const int dtPin = 3;
const int swPin = 4;
int counter = 0;
int lastClk;

void setup() {
  Serial.begin(9600);
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

// Lesson 21 — 16x2 LCD with I2C backpack (LiquidCrystal_I2C by Frank de Brabander)
export const U3_LCD = `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);   // I2C address 0x27, 16 columns, 2 rows

void setup() {
  lcd.init();                // start the display
  lcd.backlight();           // switch the backlight on
  lcd.setCursor(0, 0);       // column 0, row 0 (the top line)
  lcd.print("Hello, UNO R3!");
}

void loop() {
  lcd.setCursor(0, 1);       // column 0, row 1 (the bottom line)
  lcd.print("Seconds: ");
  lcd.print(millis() / 1000);
  delay(1000);
}`;

// Lesson 22 — SSD1306 OLED (Adafruit_SSD1306 + Adafruit_GFX)
export const U3_OLED = `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);   // 128 x 64 pixels, no reset pin

void setup() {
  Serial.begin(9600);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {   // I2C address 0x3C
    Serial.println("SSD1306 not found");
    for (;;);                                         // stop here
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Hello, UNO R3!");
  display.println("OLED 128 x 64");
  display.display();                                  // send the picture to the screen
}

void loop() {
}`;

// Lesson 23 — NeoPixel (WS2812B) strip with the Adafruit_NeoPixel library
export const U3_NEO = `#include <Adafruit_NeoPixel.h>

#define PIN 6          // the pin the DIN wire is on
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

// Lesson 24 — NPN transistor (PN2222A) switching a 6 V lamp
export const U3_QSW = `// A transistor switches a 6 V lamp: the pin drives the base through a resistor
const int basePin = 5;

void setup() {
  pinMode(basePin, OUTPUT);
}

void loop() {
  digitalWrite(basePin, HIGH);   // base current flows: the lamp lights
  delay(1000);
  digitalWrite(basePin, LOW);    // no base current: the lamp is off
  delay(1000);
}`;

// Lesson 25 — IRLZ44N MOSFET switching a 6 V lamp
export const U3_MOSW = `// A MOSFET switches a 6 V lamp: the pin drives the gate through a resistor
const int gatePin = 5;

void setup() {
  pinMode(gatePin, OUTPUT);
}

void loop() {
  digitalWrite(gatePin, HIGH);   // gate voltage on: the lamp lights
  delay(1000);
  digitalWrite(gatePin, LOW);    // gate voltage off: the lamp is off
  delay(1000);
}`;

// Lesson 26 — 1N4007 diode: current flows one way
export const U3_DIODE = `// Two LEDs, each behind a diode: only the one with the diode the right way round lights
const int ledPin = 5;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);  // 5 V: current flows through the forward diode
  delay(1000);
  digitalWrite(ledPin, LOW);   // 0 V: no current
  delay(1000);
}`;

// Lesson 27 — blink without delay() using millis()
export const U3_MILLIS = `// Blink an LED without delay(): loop() keeps running, so the button is read all the time
const int ledPin = 5;
const int buttonPin = 4;
unsigned long previousMillis = 0;   // time of the last LED change
const long interval = 1000;         // blink every 1000 ms
int ledState = LOW;
int lastButton = HIGH;

void setup() {
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  unsigned long currentMillis = millis();   // milliseconds since the program started
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    ledState = !ledState;                   // toggle the LED state
    digitalWrite(ledPin, ledState);
  }

  int button = digitalRead(buttonPin);
  if (button == LOW && lastButton == HIGH) {
    Serial.println("Button pressed: noticed at once");
  }
  lastButton = button;
}`;

// Lesson 28 — I2C scanner: two devices on one bus
export const U3_SCAN = `// I2C scanner: ask every address from 1 to 126 and print the ones that answer
#include <Wire.h>

void setup() {
  Wire.begin();
  Serial.begin(9600);
  Serial.println("Scanning...");
  int found = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();   // 0 = a device answered
    if (error == 0) {
      Serial.print("Device found at 0x");
      Serial.println(address, HEX);
      found++;
    }
  }
  Serial.print("Done: ");
  Serial.print(found);
  Serial.println(" device(s)");
}

void loop() {
}`;

// Lesson 29 — DS18B20 temperature sensor with OneWire and DallasTemperature
export const U3_DS18 = `#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 2          // the pin the DQ wire is on

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(9600);
  sensors.begin();
}

void loop() {
  sensors.requestTemperatures();            // start a conversion (takes up to 750 ms)
  float t = sensors.getTempCByIndex(0);     // read the first sensor, in Celsius
  if (t == DEVICE_DISCONNECTED_C) {          // -127: no sensor answered
    Serial.println("Sensor not found!");
  } else {
    Serial.print("Temperature: ");
    Serial.print(t);
    Serial.println(" C");
  }
  delay(1000);
}`;

// Lesson 30 — IR remote with the IRremote library (4.x): decode the command and toggle an LED
export const U3_IR = `#include <IRremote.hpp>

const int IR_RECEIVE_PIN = 2;
const int ledPin = 5;
bool ledOn = false;

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  IrReceiver.begin(IR_RECEIVE_PIN);          // start the receiver on this pin
}

void loop() {
  if (IrReceiver.decode()) {                 // true when a complete code arrived
    Serial.print("Command: 0x");
    Serial.println(IrReceiver.decodedIRData.command, HEX);
    if (IrReceiver.decodedIRData.command == 0x45) {   // the Power button of the simulated remote
      ledOn = !ledOn;
      digitalWrite(ledPin, ledOn);
    }
    IrReceiver.resume();                     // get ready for the next code
  }
}`;

// Lesson 31 — MPU6050 accelerometer and gyroscope with Adafruit_MPU6050
export const U3_MPU = `#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(9600);
  if (!mpu.begin()) {                 // address 0x68; also wakes the chip from sleep
    Serial.println("MPU6050 not found!");
    while (1) delay(10);
  }
  Serial.println("MPU6050 ready");
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);        // read accelerometer, gyroscope and temperature
  Serial.print("Acceleration X: ");
  Serial.print(a.acceleration.x);
  Serial.print(", Y: ");
  Serial.print(a.acceleration.y);
  Serial.print(", Z: ");
  Serial.print(a.acceleration.z);
  Serial.println(" m/s^2");
  Serial.print("Rotation Z: ");
  Serial.print(g.gyro.z);
  Serial.println(" rad/s");
  delay(500);
}`;

// Lesson 32 — 28BYJ-48 stepper motor with ULN2003 driver and the Stepper library
export const U3_STEP = `#include <Stepper.h>

const int stepsPerRevolution = 2048;   // 28BYJ-48 with its gearbox (nominal value)

// The 28BYJ-48 needs the pins in the order IN1, IN3, IN2, IN4
Stepper myStepper(stepsPerRevolution, 8, 10, 9, 11);

void setup() {
  myStepper.setSpeed(10);              // 10 revolutions per minute
  Serial.begin(9600);
}

void loop() {
  Serial.println("clockwise");
  myStepper.step(stepsPerRevolution);   // one full turn
  delay(500);
  Serial.println("counter-clockwise");
  myStepper.step(-stepsPerRevolution);  // and back
  delay(500);
}`;

// Lesson 33 — BMP280 pressure and temperature sensor with Adafruit_BMP280
export const U3_BMP = `#include <Wire.h>
#include <Adafruit_BMP280.h>

Adafruit_BMP280 bmp;   // connected over I2C

void setup() {
  Serial.begin(9600);
  if (!bmp.begin(0x76)) {   // 0x76 when SDO is on GND (0x77 when SDO is on VDDIO)
    Serial.println("BMP280 not found!");
    while (1) delay(10);
  }
}

void loop() {
  Serial.print("Temperature = ");
  Serial.print(bmp.readTemperature());
  Serial.println(" *C");
  Serial.print("Pressure = ");
  Serial.print(bmp.readPressure() / 100.0);   // Pascal to hPa
  Serial.println(" hPa");
  delay(1000);
}`;

// Lesson 34 — capacitive soil moisture sensor read with analogRead and map
export const U3_SOIL = `const int sensorPin = A0;   // AOUT of the soil moisture sensor
const int dryValue = 512;    // reading in dry air: measure yours!
const int wetValue = 205;    // reading in water: measure yours!

void setup() {
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(sensorPin);
  int percent = map(raw, dryValue, wetValue, 0, 100);   // wetter soil gives a LOWER reading
  percent = constrain(percent, 0, 100);
  Serial.print("raw ");
  Serial.print(raw);
  Serial.print("  moisture ");
  Serial.print(percent);
  Serial.println(" %");
  delay(1000);
}`;

// Lesson 35 — clap switch with an analog sound sensor
export const U3_SND = `const int micPin = A0;      // AO of the sound sensor
const int ledPin = 5;       // LED from Lesson 4
const int threshold = 40;   // how far from the quiet level counts as a clap
int quiet = 0;
bool ledOn = false;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  quiet = analogRead(micPin);   // the level in a quiet room
}

void loop() {
  int level = abs(analogRead(micPin) - quiet);
  if (level > threshold) {      // a loud sound
    ledOn = !ledOn;
    digitalWrite(ledPin, ledOn);
    Serial.println("Clap detected");
    delay(300);                  // ignore the echo
  }
}`;

// Lesson 36 — project: plant watering controller with hysteresis
export const U3_PLANT = `const int sensorPin = A0;
const int pumpLed = 5;      // an LED stands in for the relay and pump
const int dryValue = 512;
const int wetValue = 205;
bool pumpOn = false;

void setup() {
  pinMode(pumpLed, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(sensorPin);
  int percent = constrain(map(raw, dryValue, wetValue, 0, 100), 0, 100);
  if (percent < 30) pumpOn = true;     // too dry: start watering
  if (percent > 60) pumpOn = false;    // wet enough: stop
  digitalWrite(pumpLed, pumpOn);
  Serial.print("moisture ");
  Serial.print(percent);
  Serial.println(pumpOn ? " %  pump ON" : " %  pump off");
  delay(1000);
}`;

// Lesson 37 — 4x4 matrix keypad with the Keypad library
export const U3_KEYPAD = `#include <Keypad.h>

const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};
byte rowPins[ROWS] = {9, 8, 7, 6};   // the four row wires
byte colPins[COLS] = {5, 4, 3, 2};   // the four column wires
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

void setup() {
  Serial.begin(9600);
}

void loop() {
  char key = keypad.getKey();     // returns 0 when no key is pressed
  if (key) {
    Serial.print("Key: ");
    Serial.println(key);
  }
}`;

// Lesson 38 (project) — keypad code lock with a buzzer
export const U3_LOCK = `#include <Keypad.h>

const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};
byte rowPins[ROWS] = {9, 8, 7, 6};
byte colPins[COLS] = {5, 4, 3, 2};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

const int buzzerPin = 10;
const String secret = "1234";   // the code (visible in the sketch: this is a learning demo)
String entered = "";

void setup() {
  Serial.begin(9600);
}

void loop() {
  char key = keypad.getKey();
  if (key) {
    if (key == '#') {                    // # = enter
      if (entered == secret) {
        Serial.println("Access granted");
        tone(buzzerPin, 1500, 200);       // short high beep
      } else {
        Serial.println("Wrong code");
        tone(buzzerPin, 300, 600);        // long low beep
      }
      entered = "";
    } else if (key == '*') {            // * = clear
      entered = "";
      Serial.println("Cleared");
    } else {
      entered += key;                    // add the digit
      Serial.println("digit entered");
    }
  }
}`;

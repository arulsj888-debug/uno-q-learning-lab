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

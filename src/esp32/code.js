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

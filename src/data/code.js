// Sketch listings shown in the lessons. Line numbers used by the simulator (src/sim.js)
// are verified by tools/check_code.js.

// Lesson 3 — official Blink (UNO Q user manual, "Hello World (Blink)")
export const BLINK = `void setup() {
  Serial.begin(9600); // We can use 'Serial' again!
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);
}

// the loop function runs over and over again forever
void loop() {
  digitalWrite(LED_BUILTIN, HIGH);  // change state of the LED by setting the pin to the HIGH voltage level
  delay(1000);                      // wait for a second
  digitalWrite(LED_BUILTIN, LOW);   // change state of the LED by setting the pin to the LOW voltage level
  delay(1000);                      // wait for a second

  Serial.println("Hello World");
}`;

// Lesson 4
export const EXT_LED = `// Blink an external LED connected to D5
int ledPin = D5;

void setup() {
  pinMode(ledPin, OUTPUT);   // D5 becomes an output
}

void loop() {
  digitalWrite(ledPin, HIGH);  // D5 = 3.3 V -> current flows -> LED ON
  delay(1000);                 // wait 1 second
  digitalWrite(ledPin, LOW);   // D5 = 0 V -> no current -> LED OFF
  delay(1000);                 // wait 1 second
}`;

// Lesson 5 — official example (UNO Q user manual, "Digital Pins")
export const BUTTON = `// Define button and LED pin
int buttonPin = D4;
int ledPin = D5;

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

// Lesson 6 — official example (UNO Q user manual, "Analog to Digital Converter"),
// plus one added line: analogReadResolution(14)
export const POT = `int sensorPin = A0;   // select the input pin for the potentiometer
int sensorValue = 0;  // variable to store the value coming from the sensor

void setup() {
  Serial.begin(9600);
  analogReadResolution(14);   // added: use the full 14-bit range 0 ... 16383
}

void loop() {
  // read the value from the sensor:
  sensorValue = analogRead(sensorPin);
  Serial.println(sensorValue);
  delay(100);
}`;

// Lesson 7 — classic Arduino "Fade" pattern on PWM pin D5
export const FADE = `// Fade an LED on PWM pin D5
int led = D5;          // ~5 is a PWM pin
int brightness = 0;    // 0 ... 255 (8-bit PWM, the default)
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

// Lesson 8
export const DIMMER = `// Turn the potentiometer to set the LED brightness
int potPin = A0;
int ledPin = D5;      // ~5 is a PWM pin

void setup() {
  analogReadResolution(14);   // ADC: 0 ... 16383
  Serial.begin(9600);
}

void loop() {
  int potValue = analogRead(potPin);                 // 0 ... 16383
  int brightness = map(potValue, 0, 16383, 0, 255);  // scale to 0 ... 255
  analogWrite(ledPin, brightness);                   // 8-bit PWM (the default)
  Serial.println(brightness);
  delay(50);
}`;

// Lesson 9 — official examples (UNO Q user manual, "LED Matrix")
export const LOGO_ARRAY = [
  0,0,0,0,0,0,0,0,0,0,0,0,0,
  0,0,1,1,1,0,0,0,1,1,1,0,0,
  0,1,0,0,0,1,0,1,0,0,0,1,0,
  1,0,0,0,0,0,1,0,0,1,0,0,1,
  1,0,1,1,1,0,1,0,1,1,1,0,1,
  1,0,0,0,0,0,1,0,0,1,0,0,1,
  0,1,0,0,0,1,0,1,0,0,0,1,0,
  0,0,1,1,1,0,0,0,1,1,1,0,0,
];
export const SHADES_ARRAY = Array.from({ length: 104 }, (_, i) => Math.floor(i / 13));

export function arrayText(arr) {
  const rows = [];
  for (let r = 0; r < 8; r++) rows.push('    ' + arr.slice(r * 13, r * 13 + 13).join(',') + (r < 7 ? ',' : ''));
  return rows.join('\n');
}

/** Matrix sketch. The layout (and therefore the line numbers) is identical for every frame. */
export function matrixCode(name, arr, bits, comment) {
  return `#include <Arduino_LED_Matrix.h>
uint8_t ${name}[104] = {
${arrayText(arr)}
};
Arduino_LED_Matrix matrix;
void setup() {
  matrix.begin();
  // ${comment}
  matrix.setGrayscaleBits(${bits});
  matrix.draw(${name});
}
void loop() {
}`;
}
export const MATRIX_LINES = { begin: 14, bits: 16, draw: 17 };

// Lesson 10
export const BUZZER = `// Play a C-major scale on a passive piezo buzzer
int buzzerPin = D9;
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

// Lesson 11 — night light: photoresistor (GL5528) + 10 kΩ voltage divider on A0, LED on D5
export const NIGHT_LIGHT = `// Night light: the LED turns on when it gets dark
int ldrPin = A0;       // LDR + 10 kOhm voltage divider
int ledPin = D5;       // LED from Lesson 4
int threshold = 4000;  // adjust for your room

void setup() {
  pinMode(ledPin, OUTPUT);
  analogReadResolution(14);   // 0 ... 16383
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

// Lesson 12 — TMP36 analog temperature sensor on A0 (Analog Devices datasheet: 0.5 V at 0 °C, 10 mV/°C)
export const TMP36_CODE = `// Measure temperature with a TMP36 on A0
int sensorPin = A0;

void setup() {
  analogReadResolution(14);   // 0 ... 16383
  Serial.begin(9600);
}

void loop() {
  int reading = analogRead(sensorPin);            // 0 ... 16383
  float voltage = reading * 3.3 / 16383.0;        // reading -> volts
  float temperatureC = (voltage - 0.5) * 100.0;   // TMP36: 0.5 V at 0 C, +10 mV per C
  Serial.print(voltage, 3);
  Serial.print(" V  ->  ");
  Serial.print(temperatureC, 1);
  Serial.println(" C");
  delay(1000);
}`;

// Lesson 13 — HC-SR04 ultrasonic sensor (Elecfreaks datasheet: 10 us trigger, us / 58 = cm, cycle > 60 ms)
export const ULTRASONIC = `// Measure distance with an HC-SR04 ultrasonic sensor
int trigPin = D7;   // TRIG: a 3.3 V HIGH is enough (TTL input)
int echoPin = D8;   // ECHO: 5 V signal -> D8 is 5 V-tolerant

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);   // plain INPUT: no pull-up on a 5 V signal
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

// Lesson 14 — HC-SR501 PIR (datasheet: 3.3 V output while motion, ~1 min start-up)
export const PIR_CODE = `// Motion alarm: HC-SR501 PIR on D2, LED on D5
int pirPin = D2;     // PIR OUT: 3.3 V while motion is detected
int ledPin = D5;     // LED from Lesson 4
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

// Lesson 15 — SG90 servo with the official Servo library (Zephyr support; defaults 544–2400 µs for 0–180°)
export const SERVO_CODE = `#include <Servo.h>

Servo myServo;        // one Servo object per motor
int servoPin = D9;    // orange signal wire

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

// Lesson 16 — DC motor with an L293D (TI datasheet: EN/1A/2A function table, PWM on EN for speed)
export const MOTOR_CODE = `// DC motor with an L293D H-bridge
int enablePin = D5;   // L293D pin 1 (1,2EN): PWM = speed
int in1Pin = D7;      // L293D pin 2 (1A)
int in2Pin = D8;      // L293D pin 7 (2A)

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

// Lesson 17 — low-level-trigger relay module on D4 (Handsontec: relay actuates when IN is LOW); released pin = off
export const RELAY_CODE = `// Relay module (low-level trigger): the relay is ON when the pin is LOW
int relayPin = D4;

void relayOn() {
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW);   // LOW = relay ON (the lamp lights)
}

void relayOff() {
  pinMode(relayPin, INPUT);      // let go of the pin: relay OFF (do not drive HIGH)
}

void setup() {
  relayOff();
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


// Lesson 18 — Arduino Modulino Thermo over Qwiic (based on the official Thermo_Basic example of the Arduino_Modulino library)
export const THERMO_CODE = `#include <Arduino_Modulino.h>

ModulinoThermo thermo;

void setup() {
  Serial.begin(9600);
  Modulino.begin();               // start the Qwiic bus (Wire1 on the UNO Q)
  if (!thermo.begin()) {          // is the Thermo on the bus?
    Serial.println("Thermo not found - check the Qwiic cable");
    while (1);                    // stop here
  }
}

void loop() {
  float celsius = thermo.getTemperature();
  float humidity = thermo.getHumidity();
  Serial.print("Temperature: ");
  Serial.print(celsius, 1);
  Serial.print(" C   Humidity: ");
  Serial.print(humidity, 1);
  Serial.println(" %RH");
  delay(1000);
}`;


// Lesson 19 — Modulino Pixels as a colour thermometer (Arduino_Modulino: ModulinoPixels set/clear/show, colours RED/GREEN/BLUE)
export const PIXELS_CODE = `#include <Arduino_Modulino.h>

ModulinoThermo thermo;
ModulinoPixels leds;

void setup() {
  Serial.begin(9600);
  Modulino.begin();
  if (!thermo.begin() || !leds.begin()) {
    Serial.println("Module not found - check the Qwiic cables");
    while (1);
  }
}

void loop() {
  float celsius = thermo.getTemperature();
  int lit = constrain((int)((celsius - 15.0) / 2.0), 0, 8);   // 1 LED per 2 C above 15 C

  ModulinoColor color = GREEN;
  if (celsius < 20) color = BLUE;
  if (celsius > 28) color = RED;

  for (int i = 0; i < 8; i++) {
    if (i < lit) leds.set(i, color, 25);
    else leds.clear(i);
  }
  leds.show();

  Serial.print(celsius, 1);
  Serial.print(" C -> ");
  Serial.print(lit);
  Serial.println(" LEDs");
  delay(500);
}`;

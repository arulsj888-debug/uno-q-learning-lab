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

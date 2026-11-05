// Verifies that every line number used by the simulator points at the right source line.
import * as C from '../src/data/code.js';
const L = (code, n) => code.split('\n')[n - 1] || '';
const checks = {
  BLINK: [C.BLINK, [[1, 'void setup'], [2, 'Serial.begin'], [4, 'pinMode(LED_BUILTIN'], [8, 'void loop'], [9, 'HIGH'], [10, 'delay(1000)'], [11, 'LOW'], [12, 'delay(1000)'], [14, 'Serial.println']]],
  EXT_LED: [C.EXT_LED, [[2, 'ledPin = D5'], [4, 'void setup'], [5, 'pinMode(ledPin'], [8, 'void loop'], [9, 'HIGH'], [10, 'delay'], [11, 'LOW'], [12, 'delay']]],
  BUTTON: [C.BUTTON, [[2, 'buttonPin = D4'], [3, 'ledPin = D5'], [6, 'buttonState = 0'], [8, 'void setup'], [10, 'INPUT_PULLUP'], [11, 'pinMode(ledPin, OUTPUT)'], [14, 'Serial.begin'], [17, 'void loop'], [19, 'digitalRead'], [22, 'buttonState == LOW'], [23, 'digitalWrite(ledPin, HIGH)'], [24, 'Button is pressed'], [27, 'digitalWrite(ledPin, LOW)'], [28, 'not pressed'], [32, 'delay(1000)']]],
  POT: [C.POT, [[1, 'sensorPin = A0'], [2, 'sensorValue = 0'], [4, 'void setup'], [5, 'Serial.begin'], [6, 'analogReadResolution(14)'], [9, 'void loop'], [11, 'analogRead'], [12, 'Serial.println'], [13, 'delay(100)']]],
  FADE: [C.FADE, [[2, 'led = D5'], [3, 'brightness = 0'], [4, 'fadeAmount = 5'], [6, 'void setup'], [7, 'pinMode'], [10, 'void loop'], [11, 'analogWrite'], [12, 'brightness + fadeAmount'], [13, 'if (brightness'], [14, '-fadeAmount'], [16, 'delay(30)']]],
  DIMMER: [C.DIMMER, [[2, 'potPin = A0'], [3, 'ledPin = D5'], [5, 'void setup'], [6, 'analogReadResolution(14)'], [7, 'Serial.begin'], [10, 'void loop'], [11, 'analogRead'], [12, 'map('], [13, 'analogWrite'], [14, 'Serial.println'], [15, 'delay(50)']]],
  MATRIX: [C.matrixCode('logo', C.LOGO_ARRAY, 1, 'display the image'), [[1, '#include'], [2, 'uint8_t logo[104]'], [13, 'void setup'], [C.MATRIX_LINES.begin, 'matrix.begin'], [C.MATRIX_LINES.bits, 'setGrayscaleBits(1)'], [C.MATRIX_LINES.draw, 'matrix.draw(logo)'], [C.MATRIX_LINES.draw + 2, 'void loop']]],
  NIGHT: [C.NIGHT_LIGHT, [[2, 'ldrPin = A0'], [3, 'ledPin = D5'], [4, 'threshold = 4000'], [6, 'void setup'], [7, 'pinMode(ledPin'], [8, 'analogReadResolution(14)'], [9, 'Serial.begin'], [12, 'void loop'], [13, 'analogRead(ldrPin)'], [14, 'Serial.println(light)'], [15, 'if (light < threshold)'], [16, 'HIGH'], [18, 'LOW'], [20, 'delay(200)']]],
  TMP36: [C.TMP36_CODE, [[2, 'sensorPin = A0'], [4, 'void setup'], [5, 'analogReadResolution(14)'], [6, 'Serial.begin'], [9, 'void loop'], [10, 'analogRead(sensorPin)'], [11, 'reading * 3.3 / 16383.0'], [12, '(voltage - 0.5) * 100.0'], [13, 'Serial.print(voltage, 3)'], [14, 'Serial.print(" V'], [15, 'Serial.print(temperatureC, 1)'], [16, 'Serial.println(" C")'], [17, 'delay(1000)']]],
  US: [C.ULTRASONIC, [[2, 'trigPin = D7'], [3, 'echoPin = D8'], [5, 'void setup'], [6, 'pinMode(trigPin'], [7, 'pinMode(echoPin, INPUT)'], [8, 'Serial.begin'], [11, 'void loop'], [12, 'LOW'], [13, 'delayMicroseconds(2)'], [14, 'HIGH'], [15, 'delayMicroseconds(10)'], [16, 'LOW'], [18, 'pulseIn(echoPin, HIGH)'], [19, 'duration / 58.0'], [21, 'Serial.print(distanceCm, 1)'], [22, 'Serial.println(" cm")'], [23, 'delay(100)']]],
  PIR: [C.PIR_CODE, [[2, 'pirPin = D2'], [3, 'ledPin = D5'], [4, 'lastState = LOW'], [6, 'void setup'], [7, 'pinMode(pirPin, INPUT)'], [8, 'pinMode(ledPin, OUTPUT)'], [9, 'Serial.begin'], [10, 'warming up'], [11, 'delay(60000)'], [12, '"Ready"'], [15, 'void loop'], [16, 'digitalRead(pirPin)'], [17, 'if (motion == HIGH)'], [18, 'digitalWrite(ledPin, HIGH)'], [20, 'digitalWrite(ledPin, LOW)'], [22, 'motion != lastState'], [23, 'if (motion == HIGH)'], [24, 'Motion detected!'], [26, 'Motion ended'], [28, 'lastState = motion'], [30, 'delay(50)']]],
  SERVO: [C.SERVO_CODE, [[1, '#include <Servo.h>'], [3, 'Servo myServo'], [4, 'servoPin = D9'], [6, 'void setup'], [7, 'attach(servoPin)'], [10, 'void loop'], [11, 'write(0)'], [12, 'delay(1000)'], [13, 'write(90)'], [14, 'delay(1000)'], [15, 'write(180)'], [16, 'delay(1000)']]],
  BUZZER: [C.BUZZER, [[2, 'buzzerPin = D9'], [3, 'int notes[]'], [5, 'void setup'], [8, 'void loop'], [9, 'for (int i'], [10, 'tone(buzzerPin'], [11, 'delay(300)'], [13, 'noTone'], [14, 'delay(1000)']]],
};
let bad = 0;
for (const [name, [code, list]] of Object.entries(checks)) for (const [n, s] of list) {
  if (!L(code, n).includes(s)) { bad++; console.log(`MISMATCH ${name} line ${n}: expected "${s}" got "${L(code, n)}"`); }
}
// logo/shades arrays must equal the official listings (8 x 13)
if (C.LOGO_ARRAY.length !== 104 || C.SHADES_ARRAY.length !== 104) { bad++; console.log('array length'); }
console.log(bad ? `${bad} problems` : 'all line references OK');
process.exit(bad ? 1 : 0);

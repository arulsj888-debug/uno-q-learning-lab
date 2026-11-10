// Lessons 9-16 of the Arduino UNO R3: sensors, motion and power, I²C.
// Facts come from the UNO R3 datasheet A000066 (DS), the ATmega328P datasheet (ATM), the Arduino language reference and the
// component datasheets listed in each lesson. Code listings: ./code.js (line numbers are checked by tools/check_code.mjs).
import { U3_NIGHT, U3_TMP36, U3_ULTRASONIC, U3_PIR, U3_SERVO, U3_MOTOR, U3_RELAY, U3_SHT31 } from './code.js';
import {
  SRC, LED_IDS, IO_LED, LED_CIRCUIT,
  LDR_PARTS, LDR_IDS, TMP_PARTS, TMP_IDS, US_PARTS, US_IDS, PIR_PARTS, PIR_IDS, SERVO_PARTS, SERVO_IDS,
  MOTOR_PARTS, MOTOR_IDS, MOTOR_LOGIC, MOTOR_IO, RELAY_PARTS, RELAY_IDS, RELAY_IO, I2C_PARTS, I2C_IDS,
} from './common.js';

export const U3_LESSONS_2 = [
  // ================================================================== 9
  {
    id: 'u9', num: 9, module: 4, title: 'Light sensor: an automatic night light', level: 'Beginner', time: '15 min',
    goal: 'Measure light with a photoresistor and a voltage divider, and switch the LED on when it gets dark.',
    hardware: ['Lesson 4 LED circuit (LED on pin 5)', 'Photoresistor GL5528 (LDR)', '10 kΩ resistor', '3 × jumper wires'],
    code: U3_NIGHT, file: 'NightLight.ino', program: 'u3_night', widgets: ['light'],
    circuit: [...LED_CIRCUIT, ...LDR_PARTS], io: { D5: IO_LED, A0: { kind: 'ldr', item: 'ldr1', needs: LDR_IDS } },
    explain: {
      2: 'The divider’s middle point goes to <b>A0</b>.',
      3: 'The LED from Lesson 4 on pin 5.',
      4: '<b>threshold</b>: below this number we call it “dark”. 250 is about 1.2 V on A0 — tune it for your room.',
      7: 'Pin 5 drives the LED.',
      8: 'Serial output on. There is no <code>analogReadResolution()</code> on the UNO R3: <code>analogRead()</code> always returns 0 … 1023.',
      11: '<b>loop()</b> repeats forever.',
      12: '<b>analogRead(A0)</b>: the LDR is on top (to 5V), so more light → lower LDR resistance → higher voltage → bigger number.',
      13: 'Print the light reading.',
      14: 'Dark? (reading below the threshold)',
      15: 'Dark → LED on (HIGH, the LED is wired to GND).',
      17: 'Bright → LED off.',
      19: 'Check 5 times per second.',
    },
    steps: [
      {
        title: 'What you need', view: 'bench', have: LED_IDS,
        body: `<p>We keep the <b>LED on pin 5</b> from Lesson 4 and add a light sensor:</p>
        <ul><li>a <b>photoresistor</b> (LDR = light-dependent resistor), type <b>GL5528</b></li><li>a <b>10 kΩ resistor</b> (brown-black-orange-gold)</li>
        <li><b>3 jumpers</b>: red (5V), green (A0), black (GND)</li></ul>`,
      },
      {
        title: 'How a photoresistor works', view: 'breadboard',
        body: `<p>The red-orange zig-zag track on top is a light-sensitive material. <b>More light → lower resistance.</b></p>
        <table class="kv"><tr><th>GL5528 (datasheet)</th><th>Value</th></tr>
        <tr><td>At 10 lux</td><td>10–20 kΩ</td></tr><tr><td>In the dark</td><td>≥ 1 MΩ</td></tr>
        <tr><td>γ (gamma)</td><td>0.6</td></tr><tr><td>Response</td><td>≈ 20 ms brighter, ≈ 30 ms darker</td></tr>
        <tr><td>Most sensitive to</td><td>green light (540 nm)</td></tr></table>
        <p><b>γ = 0.6</b> means: 10× more light → the resistance drops to 10<sup>−0.6</sup> ≈ ¼.</p>
        <p class="tip">Each LDR is a little different (10–20 kΩ at 10 lux). That is why we tune the threshold later.</p>`,
      },
      {
        title: 'Turning resistance into a voltage', view: 'bench', pins: ['5V', 'A0'],
        body: `<p>The ADC measures <b>voltage</b>, not resistance. So we build a <b>voltage divider</b>: LDR on top, 10 kΩ at the bottom.</p>
        <div class="ptree"><div class="pt-row"><span class="pt bus">5V</span></div><div class="pt-arrow">│ LDR (changes with light)</div>
        <div class="pt-row"><span class="pt">middle point → A0</span></div><div class="pt-arrow">│ 10 kΩ (fixed)</div><div class="pt-row"><span class="pt">GND</span></div></div>
        <p class="formula">V<sub>A0</sub> = 5 V × 10 kΩ ÷ (R<sub>LDR</sub> + 10 kΩ)</p>
        <table class="kv"><tr><th>Light</th><th>R<sub>LDR</sub></th><th>V<sub>A0</sub></th><th>analogRead</th></tr>
        <tr><td>dark</td><td>≥ 1 MΩ</td><td>≤ 0.05 V</td><td>≤ 10</td></tr>
        <tr><td>1 lux</td><td>≈ 60 kΩ</td><td>0.72 V</td><td>≈ 146</td></tr>
        <tr><td>10 lux</td><td>15 kΩ</td><td>2.00 V</td><td>≈ 409</td></tr>
        <tr><td>100 lux</td><td>≈ 3.8 kΩ</td><td>3.63 V</td><td>≈ 743</td></tr>
        <tr><td>1000 lux</td><td>≈ 0.95 kΩ</td><td>4.57 V</td><td>≈ 935</td></tr></table>
        <p class="sim">Table and simulation use a typical GL5528: 15 kΩ at 10 lux (the middle of the 10–20 kΩ range) and γ = 0.6.</p>
        <p>The divider is fed from <b>5V</b>, the same voltage the ADC compares against, so A0 can never go above 5 V and the whole 0 … 1023 range is usable.</p>`,
      },
      {
        title: 'Step 1 — insert the photoresistor', view: 'breadboard', power: false, have: [...LED_IDS, 'ldr1'], holes: ['e22', 'e23'],
        body: `<p>Insert the LDR legs into <b>e22</b> and <b>e23</b>. Its legs are 3.0 mm apart, so bend them very slightly to fit two holes 2.54 mm apart.</p>
        <p>An LDR has <b>no polarity</b>.</p>`,
      },
      {
        title: 'Step 2 — insert the 10 kΩ resistor', view: 'breadboard', have: [...LED_IDS, 'ldr1', 'r3'], holes: ['c23', 'c27'],
        body: `<p>10 kΩ resistor (brown-black-orange-gold) from <b>c23</b> to <b>c27</b>.</p><p>Column 23 is now the <b>middle point</b> of the divider.</p>`,
      },
      {
        title: 'Step 3 — wire 5V, A0 and GND', view: 'bench', have: [...LED_IDS, ...LDR_IDS], pins: ['5V', 'A0', 'GND3'],
        body: `<ul><li>Red: <b>5V</b> → <b>a22</b> (top of the LDR)</li><li>Green: <b>A0</b> → <b>a23</b> (middle point)</li><li>Black: <b>a27</b> → <b>GND</b> (bottom of the 10 kΩ)</li></ul>
        <p class="path">5V → LDR → column 23 (A0) → 10 kΩ → column 27 → GND</p>`,
      },
      {
        title: 'The code', view: 'bench', showCode: true,
        body: `<p>Read the light, print it, and compare it with a <b>threshold</b>. Below the threshold it is “dark” → LED on.</p>`,
      },
      {
        title: 'Run it & change the light', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Use the <b>light slider</b> (or the quick buttons) below. Watch the reading, the A0 voltage and the LED.</p>
        <ul><li>Bright room → big number → LED off</li><li>Dark → small number → LED on</li></ul>
        <p class="sim">The light level is simulated with the typical GL5528 values above; the readings also include about ±1 count of ADC noise.</p>`,
      },
      {
        title: 'Choosing a good threshold', view: 'bench', showCode: true,
        body: `<ol><li>Run the sketch and note the reading in your room <b>with the light on</b>.</li><li>Cover the sensor or dim the room and note the reading again.</li>
        <li>Set <code>threshold</code> somewhere between the two.</li></ol>
        <p class="tip">Real light flickers and changes slowly at dusk. Advanced versions use two thresholds (on below one value, off above a higher one) so the LED does not flicker on and off — this is called <b>hysteresis</b>.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>LDR: more light → lower resistance (GL5528: 10–20 kΩ at 10 lux, ≥ 1 MΩ dark).</li>
        <li>A voltage divider turns resistance into a voltage for A0; here it is fed from 5V.</li>
        <li><code>analogRead()</code> gives 0–1023; compare it with a threshold to make decisions.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What happens to an LDR’s resistance when more light falls on it?', a: ['It goes up', 'It goes down', 'It stays the same', 'It becomes negative'], c: 1, why: 'More light → lower resistance.' },
      { q: 'Why do we need the 10 kΩ resistor?', a: ['To protect the LED', 'To make a voltage divider so A0 sees a changing voltage', 'To make the LDR brighter', 'It is not needed'], c: 1, why: 'The ADC measures voltage; the divider converts the LDR’s resistance into a voltage.' },
      { q: 'With the LDR on top (to 5V), more light gives…', a: ['A smaller reading', 'A bigger reading', 'Always 0', 'Always 1023'], c: 1, why: 'Lower LDR resistance → higher voltage at the middle point.' },
      { q: 'The room is at 10 lux (LDR ≈ 15 kΩ). About what voltage does A0 see?', a: ['0.5 V', '2.0 V', '3.3 V', '5 V'], c: 1, why: '5 V × 10 kΩ ÷ (15 kΩ + 10 kΩ) = 2.0 V.' },
    ],
    sources: [SRC.ldr, SRC.ar, SRC.atm, SRC.ds],
  },

  // ================================================================== 10
  {
    id: 'u10', num: 10, module: 4, title: 'Measure temperature with a TMP36', level: 'Beginner', time: '15 min',
    goal: 'Read an analog temperature sensor and convert the reading into °C with a formula from its datasheet.',
    hardware: ['Arduino UNO R3', 'Breadboard', 'TMP36 temperature sensor (TO-92)', '3 × jumper wires'],
    code: U3_TMP36, file: 'TMP36.ino', program: 'u3_tmp36', widgets: ['temp'],
    circuit: TMP_PARTS, io: { A0: { kind: 'tmp36', item: 't1', needs: TMP_IDS } },
    explain: {
      2: 'The TMP36 output (VOUT) goes to <b>A0</b>.',
      5: 'Serial output on.',
      8: '<b>loop()</b> repeats forever.',
      9: 'Read the sensor voltage as a number, 0 … 1023.',
      10: '<b>Number → volts</b>: the ADC compares with the 5 V supply, and 5 V is 1024 steps, so volts = reading × 5.0 ÷ 1024. We write <code>5.0</code> and <code>1024.0</code> so the maths is done with decimals.',
      11: '<b>Volts → °C</b> from the datasheet: 0.5 V at 0 °C and +10 mV per °C, so T = (V − 0.5) × 100.',
      12: 'Print the voltage with 3 decimals.',
      14: 'Print the temperature with 1 decimal.',
      15: 'Finish the line with “ C”.',
      16: 'One reading per second.',
    },
    steps: [
      {
        title: 'What you need', view: 'bench', have: [],
        body: `<ul><li>a <b>TMP36</b> temperature sensor (looks like a small black transistor, “TO-92” package)</li><li><b>3 jumpers</b>: red (5V), green (A0), black (GND)</li></ul>
        <p>The TMP36 works from <b>2.7 V to 5.5 V</b> (datasheet), so it runs directly from the UNO R3’s 5V pin.</p>`,
      },
      {
        title: 'How the TMP36 works', view: 'breadboard',
        body: `<p>The TMP36 outputs a <b>voltage</b> that rises <b>10 mV for every °C</b>:</p>
        <p class="formula">V<sub>OUT</sub> = 0.5 V + 0.01 V × T(°C)&nbsp;&nbsp;⇔&nbsp;&nbsp;T = (V<sub>OUT</sub> − 0.5 V) × 100</p>
        <table class="kv"><tr><th>Temperature</th><th>V<sub>OUT</sub></th><th>analogRead</th></tr>
        <tr><td>−40 °C</td><td>0.10 V</td><td>≈ 20</td></tr><tr><td>0 °C</td><td>0.50 V</td><td>≈ 102</td></tr>
        <tr><td>25 °C</td><td>0.75 V</td><td>≈ 153</td></tr><tr><td>100 °C</td><td>1.50 V</td><td>≈ 307</td></tr>
        <tr><td>125 °C</td><td>1.75 V</td><td>≈ 358</td></tr></table>
        <p>The <b>0.5 V offset</b> lets it measure below 0 °C without needing a negative voltage.</p>`,
      },
      {
        title: 'Which leg is which?', view: 'breadboard',
        body: `<p>Hold it with the <b>flat, printed face toward you</b> and the legs down:</p>
        <table class="kv"><tr><td>Left</td><td>pin 1 · <b>+V<sub>S</sub></b> (power)</td></tr><tr><td>Middle</td><td>pin 2 · <b>V<sub>OUT</sub></b> (signal)</td></tr><tr><td>Right</td><td>pin 3 · <b>GND</b></td></tr></table>
        <p class="warn">Check the flat face before powering up. If +V<sub>S</sub> and GND are swapped, the sensor does not work and can be damaged.</p>`,
      },
      {
        title: 'Step 1 — insert the TMP36', view: 'breadboard', power: false, have: ['t1'], holes: ['e18 · +VS', 'e19 · VOUT', 'e20 · GND'],
        body: `<p>Insert it into <b>e18, e19, e20</b> with the <b>flat face toward the centre gap</b> (toward you in this view).</p>`,
      },
      {
        title: 'Step 2 — wire 5V, A0 and GND', view: 'bench', have: TMP_IDS, pins: ['5V', 'A0', 'GND3'],
        body: `<ul><li>Red: <b>5V</b> → <b>a18</b> (+V<sub>S</sub>)</li><li>Green: <b>A0</b> → <b>a19</b> (V<sub>OUT</sub>)</li><li>Black: <b>a20</b> → <b>GND</b></li></ul>`,
      },
      {
        title: 'From a number to °C', view: 'bench',
        body: `<p>Example at 25 °C (V<sub>OUT</sub> = 0.75 V):</p>
        <ol><li><code>analogRead</code> → 0.75 ÷ 5 × 1024 = 153.6, rounded down: <b>153</b></li><li>153 × 5.0 ÷ 1024 = <b>0.747 V</b></li><li>(0.747 − 0.5) × 100 = <b>24.7 °C</b></li></ol>
        <p>The answer is 0.3 °C low because the ADC only has whole steps. We use <code>float</code> variables because volts and °C have decimals.</p>`,
      },
      { title: 'The code', view: 'bench', showCode: true, body: `<p><code>Serial.print(value, 3)</code> prints a decimal number with 3 digits after the point; <code>Serial.println</code> ends the line.</p>` },
      {
        title: 'Run it & change the temperature', view: 'bench', showCode: true, power: true, action: 'run',
        body: `<p>Move the <b>temperature slider</b> below. The sensor voltage changes 10 mV per °C, and the Serial Monitor shows the voltage and the temperature.</p>
        <p class="sim">The room temperature is simulated. Watch the temperature move in small jumps: that is the ADC step (next page).</p>`,
      },
      {
        title: 'How accurate is it?', view: 'bench',
        body: `<ul><li><b>ADC step</b>: one step of the 10-bit ADC is 5 V ÷ 1024 ≈ 4.9 mV, which is ≈ <b>0.49 °C</b>. The Serial Monitor can show 0.1 °C digits, but the reading only changes in steps of about half a degree.</li>
        <li><b>Sensor</b>: typically ±1 °C at 25 °C and ±2 °C over −40…+125 °C. The TO-92 version (TMP36GT9Z) is guaranteed within <b>±3 °C</b> at 25 °C (datasheet).</li>
        <li><b>Reference</b>: the formula assumes the supply is exactly 5.00 V, and it is the supply that the ADC compares with. USB power is not exact: if it is 1 % off, the calculated voltage is 1 % off, which at 25 °C is 7.5 mV ≈ <b>0.75 °C</b>.</li></ul>
        <p class="tip">Resolution (smallest step) and accuracy are different things. Showing 1 decimal does not make the reading accurate to 0.1 °C.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>TMP36: V = 0.5 V + 10 mV/°C; runs from 5V.</li><li>Pins (flat face to you): +V<sub>S</sub>, V<sub>OUT</sub>, GND.</li>
        <li>reading → volts (× 5.0 ÷ 1024) → °C with <code>float</code> maths.</li><li>One ADC step ≈ 0.49 °C; the sensor itself is ±2 °C typical.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What is the TMP36 output at 25 °C?', a: ['0.25 V', '0.5 V', '0.75 V', '2.5 V'], c: 2, why: 'Datasheet: 750 mV at 25 °C (0.5 V + 25 × 10 mV).' },
      { q: 'The output reads 0.62 V. The temperature is…', a: ['6.2 °C', '12 °C', '62 °C', '120 °C'], c: 1, why: '(0.62 − 0.5) × 100 = 12 °C.' },
      { q: 'With the flat face toward you, the middle leg is…', a: ['+VS', 'VOUT', 'GND', 'Not connected'], c: 1, why: 'Pin 2 (middle) is VOUT.' },
      { q: 'One step of the UNO R3 ADC (5 V reference) corresponds to about…', a: ['0.002 °C', '0.05 °C', '0.5 °C', '5 °C'], c: 2, why: '5 V ÷ 1024 ≈ 4.9 mV, and the TMP36 gives 10 mV per °C → ≈ 0.49 °C.' },
      { q: 'The program prints 23.47 °C. How accurate is that, typically?', a: ['±0.01 °C', '±0.1 °C', 'About ±2 °C', 'Exact'], c: 2, why: 'Typical accuracy is ±2 °C over the range (±1 °C at 25 °C); more decimals do not add accuracy.' },
    ],
    sources: [SRC.tmp36, SRC.ar, SRC.atm, SRC.ds],
  },

  // ================================================================== 11
  {
    id: 'u11', num: 11, module: 4, title: 'Measure distance with ultrasound (HC-SR04)', level: 'Intermediate', time: '20 min',
    goal: 'Measure distance with sound and time a pulse with pulseIn().',
    hardware: ['Arduino UNO R3', 'Breadboard', 'HC-SR04 ultrasonic sensor', '4 × jumper wires'],
    code: U3_ULTRASONIC, file: 'Ultrasonic.ino', program: 'ultrasonic', widgets: ['distance'],
    circuit: US_PARTS, io: { D8: { kind: 'hcsr04', item: 'us1', trig: 'D7', needs: US_IDS } },
    explain: {
      2: '<b>TRIG</b> on pin 7. The datasheet asks for a “TTL pulse”: the UNO R3’s 5 V HIGH is exactly that.',
      3: '<b>ECHO</b> on pin 8. ECHO outputs <b>5 V</b>, the same level the UNO R3 uses, so it can go straight to the pin.',
      6: 'Pin 7 drives the trigger.',
      7: 'Pin 8 listens. Plain <b>INPUT</b>: the module drives the line itself.',
      8: 'Serial output on.',
      12: 'Start from a clean LOW…',
      13: '…for 2 µs.',
      14: 'TRIG HIGH starts a measurement.',
      15: 'Keep it HIGH for 10 µs (datasheet: “at least 10 µs”).',
      16: 'TRIG LOW again. The module now sends 8 cycles of 40 kHz ultrasound.',
      18: '<b>pulseIn(echoPin, HIGH)</b> waits for ECHO to go HIGH and returns how long it stayed HIGH, in microseconds = the time the sound needed to go there and back.',
      19: 'Datasheet formula: <b>µs ÷ 58 = cm</b>. <code>58.0</code> makes it a decimal division.',
      21: 'Print with one decimal.',
      22: 'Finish the line.',
      23: 'Datasheet: use a measurement cycle of more than 60 ms, so the next trigger does not mix with an old echo.',
    },
    steps: [
      {
        title: 'What you need', view: 'bench', have: [],
        body: `<ul><li>an <b>HC-SR04</b> ultrasonic sensor (the blue board with two silver “eyes”)</li>
        <li><b>4 jumpers</b>: red (5V), yellow (TRIG), blue (ECHO), black (GND)</li></ul>
        <table class="kv"><tr><th>HC-SR04 datasheet</th><th></th></tr>
        <tr><td>Supply</td><td>5 V DC, 15 mA</td></tr><tr><td>Range</td><td>2 cm – 4 m</td></tr>
        <tr><td>Measuring angle</td><td>15°</td></tr><tr><td>Resolution</td><td>down to 3 mm</td></tr>
        <tr><td>Sound frequency</td><td>40 kHz (ultrasound — you cannot hear it)</td></tr></table>`,
      },
      {
        title: 'How it measures distance', view: 'breadboard',
        body: `<ol><li>Your sketch sends a <b>10 µs HIGH pulse</b> to <b>TRIG</b>.</li>
        <li>The <b>transmitter</b> (marked <b>T</b>, on the left seen from the front) sends <b>8 cycles of 40 kHz</b> sound.</li>
        <li>The sound bounces off an object; the <b>receiver</b> (marked <b>R</b>, on the right) hears the echo.</li>
        <li><b>ECHO</b> stays HIGH for the whole <b>round trip</b> time.</li></ol>
        <p class="formula">distance = time × speed of sound ÷ 2</p>
        <p>We divide by 2 because the sound travels <b>there and back</b>. With 340 m/s the datasheet simplifies it to:</p>
        <p class="formula">cm = µs ÷ 58</p>
        <p>Example: an echo of 1160 µs → 1160 ÷ 58 = <b>20 cm</b>.</p>`,
      },
      {
        title: 'Same voltage on both sides', view: 'bench', pins: ['5V', 'D7', 'D8'],
        body: `<table class="kv"><tr><th>Pin</th><th>Check</th></tr>
        <tr><td>VCC</td><td>needs 5 V → UNO R3 <b>5V</b> pin (15 mA is tiny)</td></tr>
        <tr><td>TRIG (input)</td><td>a “TTL” input: the UNO R3 pin gives <b>5 V</b> when HIGH ✓</td></tr>
        <tr><td>ECHO (output)</td><td>sends <b>5 V</b> back, and the ATmega328P runs at 5 V ✓</td></tr></table>
        <p>Everything here is 5 V, so the sensor can be wired straight to the pins. (On a 3.3 V board the ECHO signal needs care; here it does not.)</p>
        <p class="tip">Any digital pin works for TRIG and ECHO; we use pins 7 and 8.</p>`,
      },
      {
        title: 'Step 1 — insert the sensor', view: 'breadboard', power: false, have: ['us1'], holes: ['j11 · VCC', 'j12 · TRIG', 'j13 · ECHO', 'j14 · GND'],
        body: `<p>Push the 4 pins into <b>j11–j14</b>, with the transducers facing <b>away</b> from the board so nothing blocks the sound.</p>
        <p>Seen from the front the pins are: <b>Vcc · Trig · Echo · Gnd</b>.</p>`,
      },
      {
        title: 'Step 2 — wire it', view: 'bench', have: US_IDS, pins: ['5V', 'D7', 'D8', 'GND3'],
        body: `<ul><li>Red: <b>5V</b> → <b>f11</b> (VCC)</li><li>Yellow: <b>pin 7</b> → <b>f12</b> (TRIG)</li>
        <li>Blue: <b>pin 8</b> → <b>f13</b> (ECHO)</li><li>Black: <b>f14</b> → <b>GND</b></li></ul>
        <p>Holes f–j of one column are connected, so f11 reaches the pin in j11.</p>`,
      },
      {
        title: 'The code', view: 'bench', showCode: true,
        body: `<p>Trigger → time the echo with <code>pulseIn()</code> → convert with ÷ 58 → print.</p>
        <p class="tip">Click any line in the code panel to see what it does.</p>`,
      },
      {
        title: 'How pulseIn() counts on the UNO R3', view: 'bench', showCode: true,
        body: `<p><code>pulseIn(pin, HIGH)</code> waits for the pin to go HIGH, then counts how long it stays HIGH. The result is in <b>microseconds</b>.</p>
        <ul><li>On the UNO R3 (AVR core, <code>wiring_pulse.c</code>) the counting loop takes <b>16 clock cycles</b> per count. At 16 MHz that is exactly <b>1 µs</b>, so readings change in steps of about 1 µs ≈ 0.017 cm. Much finer than the sensor itself.</li>
        <li>The optional third argument is a <b>timeout</b> in microseconds; the default is <b>1 second</b> (Arduino reference). If the ECHO wire is loose, <code>pulseIn()</code> gives up after 1 s and returns <b>0</b>, so the sketch prints <b>0.0 cm</b>.</li></ul>`,
      },
      {
        title: 'Run it & move the obstacle', view: 'sonar', showCode: true, power: true, action: 'run',
        body: `<p>A cardboard box stands in front of the sensor — everything is drawn at <b>true scale</b>, with a tape measure from the front of the transducers. <b>Drag the box</b>, or use the slider / quick buttons.</p>
        <ul><li><b style="color:#9fe6ff">Blue wavefronts</b> leave the transmitter <b>T</b>. Their spacing is the real wavelength of 40 kHz sound in air: 343 m/s ÷ 40 000 Hz ≈ <b>8.6 mm</b>. There are 8 of them — the datasheet’s 8-cycle burst.</li>
        <li><b style="color:#ffbf73">Orange wavefronts</b> are the echo. A flat face reflects sound as if it came from a mirror image of T behind the box; the receiver <b>R</b> lights up when the echo reaches it.</li>
        <li>The timing diagram shows TRIG → burst → <b>ECHO HIGH for the whole round trip</b>, as in the datasheet. Compare the printed distance with the tape measure.</li></ul>
        <p class="sim">Simulated and slowed down: in reality 40 cm takes only 2.3 ms there and back. The echo time is µs = distance × 58 (datasheet formula). Real readings also vary a little (see the next step).</p>`,
      },
      {
        title: 'Why real readings vary', view: 'bench',
        body: `<ul><li><b>Temperature</b>: sound travels at about 331.3 + 0.606 × T m/s — 343 m/s at 20 °C, 349 m/s at 30 °C. The datasheet’s ÷ 58 assumes 340 m/s, so at 30 °C a real 100 cm reads about <b>97 cm</b>.</li>
        <li><b>Target</b>: the datasheet asks for a flat, smooth object of at least 0.5 m². Soft (cloth, foam) or tilted objects send less sound back.</li>
        <li><b>Beam</b>: the sensor “sees” in a 15° cone, so a nearby wall or table edge can answer first.</li>
        <li><b>Range</b>: below 2 cm or above 4 m the readings are not reliable.</li></ul>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>Trigger 10 µs → ECHO HIGH time = round trip → <b>cm = µs ÷ 58</b>.</li>
        <li>VCC to 5V; TRIG and ECHO are 5 V signals, which suit the 5 V UNO R3.</li>
        <li><code>pulseIn()</code> counts in about 1 µs steps; with no echo it returns 0 after its 1 s timeout.</li>
        <li>Wait > 60 ms between measurements.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'ECHO stays HIGH for 2320 µs. How far is the object?', a: ['23.2 cm', '40 cm', '80 cm', '134 cm'], c: 1, why: 'Datasheet formula: 2320 ÷ 58 = 40 cm.' },
      { q: 'Why do we divide the travel time by 2?', a: ['The sensor has two transducers', 'The sound goes to the object and back', 'To convert µs to ms', 'Because of the 2 µs LOW pulse'], c: 1, why: 'ECHO measures the round trip; the distance is half of it.' },
      { q: 'The ECHO wire falls out. What does this sketch print?', a: ['A random distance', '0.0 cm (pulseIn() times out after 1 s)', 'The last distance', 'Nothing, the board resets'], c: 1, why: 'With no pulse, pulseIn() returns 0 after its default 1 s timeout, so 0 ÷ 58 = 0.0 cm.' },
      { q: 'Why can the HC-SR04 ECHO output go straight to a UNO R3 pin?', a: ['ECHO is open-drain', 'Both run at 5 V logic', 'The pin has a built-in divider', 'It cannot'], c: 1, why: 'ECHO is a 5 V signal and the ATmega328P is a 5 V device.' },
    ],
    sources: [SRC.hcsr04, SRC.pulsein, SRC.avrcore, SRC.ds],
  },

  // ================================================================== 12
  {
    id: 'u12', num: 12, module: 4, title: 'Detect motion with a PIR sensor (HC-SR501)', level: 'Intermediate', time: '20 min',
    goal: 'Detect people with a passive-infrared sensor, understand its delay and trigger settings, and build a motion alarm.',
    hardware: ['Lesson 4 LED circuit (LED on pin 5)', 'HC-SR501 PIR motion sensor', '3 × female–male jumper wires'],
    code: U3_PIR, file: 'MotionAlarm.ino', program: 'pir', fast: true, widgets: ['pir'],
    circuit: [...LED_CIRCUIT, ...PIR_PARTS], io: { D5: IO_LED, D2: { kind: 'pir', item: 'pir1', needs: PIR_IDS } },
    explain: {
      2: '<b>pirPin = 2</b>. The PIR output is 3.3 V when HIGH. The ATmega328P at 5 V counts anything above 3.0 V as HIGH, so this works.',
      3: 'The LED from Lesson 4.',
      4: 'Remembers the last reading, so we only print when it changes.',
      7: '<b>INPUT</b>: the PIR drives the pin itself (HIGH or LOW), so no pull-up is needed.',
      8: 'Pin 5 drives the LED.',
      9: 'Serial output on.',
      11: '<b>delay(60000)</b>: the datasheet says the module needs about <b>1 minute</b> after power-up, and may give 0–3 false pulses meanwhile. Waiting here ignores them.',
      16: '<b>digitalRead</b>: HIGH while the PIR reports motion (for the whole time-delay period).',
      17: 'Motion → LED on, otherwise off.',
      22: 'Only print when the state changes, instead of 20 times per second.',
      24: 'Rising edge: motion started.',
      26: 'Falling edge: the delay time has run out.',
      28: 'Remember the new state.',
      30: 'Check 20 times per second.',
    },
    steps: [
      {
        title: 'What we build: a motion alarm', view: 'bench', have: LED_IDS, labels: [['led1', 'Alarm LED (on pin 5)'], ['board', 'UNO R3']],
        body: `<p>When something warm (a hand, a person) moves in front of the sensor, an <b>alarm LED</b> lights up.</p>
        <div class="ptree"><div class="pt-row"><span class="pt in">PIR sensor sees motion</span></div><div class="pt-arrow">↓ OUT = 3.3 V on <b>pin 2</b></div>
        <div class="pt-row"><span class="pt">UNO R3 sketch reads pin 2</span></div><div class="pt-arrow">↓ writes <b>pin 5</b> HIGH</div>
        <div class="pt-row"><span class="pt bus">alarm LED turns on</span></div></div>
        <p>The <b>LED on the breadboard</b> is the same LED + 220 Ω resistor from Lesson 4 — we reuse it as the alarm light.</p>
        <p>New parts: an <b>HC-SR501</b> PIR sensor and <b>3 female–male jumper wires</b>.</p>`,
      },
      {
        title: 'How a PIR sensor works', view: 'bench',
        body: `<p><b>PIR</b> = <b>Passive InfraRed</b>. It does not send anything out — it only <b>feels the heat</b> (infrared) that a hand or a person gives off.</p>
        <ul><li>It reacts when something warm <b>moves across</b> in front of it.</li><li>Something warm that <b>stays still</b> is <b>not</b> detected.</li></ul>
        <table class="kv"><tr><th>Its output (OUT pin)</th><th></th></tr><tr><td>Motion</td><td><b>HIGH</b> = 3.3 V</td></tr><tr><td>No motion</td><td><b>LOW</b> = 0 V</td></tr></table>
        <p>After the last movement it keeps OUT HIGH for a few seconds (set by a small knob on the back; ≈5 s at its minimum), then goes LOW.</p>`,
      },
      {
        title: 'Is 3.3 V enough for a 5 V board?', view: 'bench', pins: ['5V', 'D2', 'GND3'],
        body: `<table class="kv"><tr><th>PIR pin</th><th>Goes to</th><th>Why</th></tr>
        <tr><td>VCC</td><td><b>5V</b></td><td>it needs 5–20 V (3.3 V is too low)</td></tr>
        <tr><td>OUT</td><td><b>pin 2</b></td><td>its HIGH is 3.3 V</td></tr>
        <tr><td>GND</td><td><b>GND</b></td><td>common ground</td></tr></table>
        <p>The ATmega328P datasheet says that, at a 5 V supply, an input counts as <b>HIGH above 3.0 V</b> (0.6 × V<sub>CC</sub>) and as <b>LOW below 1.5 V</b> (0.3 × V<sub>CC</sub>). The PIR’s 3.3 V is above 3.0 V, so the pin reads HIGH — with only <b>0.3 V of margin</b>.</p>
        <p class="tip">The margin is small. If a PIR ever reads unreliably on a 5 V board, check the supply voltage first.</p>`,
      },
      {
        title: 'Step 1 — set up the sensor', view: 'bench', power: false, have: [...LED_IDS, 'pir1'], labels: [['pir1', 'HC-SR501 PIR sensor'], ['led1', 'Alarm LED (on pin 5)']],
        body: `<p>Stand the PIR next to the breadboard with the <b>dome facing out</b>. It is not pushed into the breadboard — its pots stick out underneath — so it stands on a small stand and gets <b>female</b> jumper ends on its pins.</p>
        <p>Pin order (datasheet photo, component side facing you, pins at the bottom): <b>VCC · OUT · GND</b>. From the dome side it is mirrored: GND · OUT · VCC.</p>`,
      },
      {
        title: 'Step 2 — wire it', view: 'bench', have: [...LED_IDS, ...PIR_IDS], pins: ['5V', 'D2', 'GND3'],
        body: `<ul><li>Red: PIR <b>VCC</b> → UNO R3 <b>5V</b></li><li>Yellow: PIR <b>OUT</b> → <b>pin 2</b></li><li>Black: PIR <b>GND</b> → <b>GND</b></li></ul>
        <p>The female ends slide onto the PIR pins; the male ends go into the UNO R3 headers.</p>`,
      },
      {
        title: 'Get to know the module (front)', view: 'pirfront',
        body: `<p><b>Click each part</b> of the sensor to see what it does.</p>
        <ul><li><b>White dome</b> = Fresnel lens. Under it is the infrared sensor with two elements.</li><li>The <b>clear stand</b> only holds it upright.</li></ul>`,
      },
      {
        title: 'Get to know the module (back)', view: 'pirback',
        body: `<p>Turn it around. <b>Click each part:</b></p>
        <ul><li>Two orange <b>pots</b>: <b>time delay</b> (left) and <b>sensitivity</b> (right)</li><li>Yellow <b>trigger jumper</b> (H / L)</li>
        <li>The black chip: <b>BISS0001</b> signal processor</li><li>A small <b>3.3 V regulator</b></li><li>The 3 <b>pins</b>: VCC · OUT · GND</li></ul>`,
      },
      { title: 'The code', view: 'bench', showCode: true, body: `<p>Wait for start-up, then copy the PIR output to the LED and print a message whenever it changes.</p>` },
      {
        title: 'Run it: wave your hand', view: 'room', showCode: true, power: true, action: 'run',
        body: `<ol><li><b>Warm-up</b> (a few seconds here; a real sensor needs about 1 minute). Wait until the sensor says <b>Watching</b>.</li>
        <li>Click <b>👋 Wave hand</b>. The hand passes in front of the sensor →<br>Sensor <b>MOTION!</b> → OUT <b>HIGH</b> → <b>LED ON</b>.</li>
        <li>Stop waving → about <b>5 s later</b> → OUT LOW → <b>LED OFF</b>.</li>
        <li>Click <b>✋ Hold hand still</b>: the hand is in front, but it does not move → <b>nothing happens</b>.</li></ol>
        <p class="sim">Simulated: the start-up time is shortened; the ≈5 s hold time is the sensor’s minimum setting.</p>`,
      },
      {
        title: 'Summary', view: 'bench',
        body: `<ul><li>A PIR feels <b>moving</b> warm things (hands, people).</li>
        <li>VCC → 5V, OUT → pin 2, GND → GND. Read OUT with <code>digitalRead()</code>: HIGH = motion.</li>
        <li>Its 3.3 V HIGH is above the 3.0 V the UNO R3 needs, with a small margin.</li>
        <li>The knobs on the back set the hold time and the range; the jumper sets the trigger mode. A real sensor needs about 1 minute to start up.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What does “passive” mean in Passive InfraRed?', a: ['It needs no power', 'It sends nothing out — it only receives infrared heat', 'It works only in the dark', 'It has no lens'], c: 1, why: 'A PIR only receives the infrared that warm bodies emit.' },
      { q: 'Which UNO R3 pin should power the HC-SR501?', a: ['3.3V', '5V', 'pin 2', 'AREF'], c: 1, why: 'Datasheet supply is 5–20 V (4.5 V min), so 3.3 V is too low.' },
      { q: 'The PIR’s HIGH is 3.3 V. Why does the 5 V UNO R3 read it as HIGH?', a: ['It rounds up to 5 V', 'The ATmega328P accepts anything above 3.0 V as HIGH at a 5 V supply', 'Pin 2 has a level shifter', 'It does not'], c: 1, why: 'ATmega328P: V_IH = 0.6 × V_CC = 3.0 V at 5 V; 3.3 V is above that.' },
      { q: 'With the jumper on H, what happens while someone keeps moving?', a: ['OUT pulses on and off', 'OUT stays HIGH — each detection restarts the delay', 'OUT goes LOW after 5 s', 'Nothing'], c: 1, why: 'H = repeatable trigger: the delay restarts with every detection.' },
      { q: 'Which movement is hardest for a PIR to detect?', a: ['Walking across its view', 'Walking straight toward it', 'Waving a hand sideways', 'Running past'], c: 1, why: 'Moving straight toward the lens changes both elements almost equally.' },
    ],
    sources: [SRC.sr501, SRC.sr501guide, SRC.atm, SRC.ds],
  },

  // ================================================================== 13
  {
    id: 'u13', num: 13, module: 5, title: 'Turn a servo motor to an angle (SG90)', level: 'Intermediate', time: '15 min',
    goal: 'Make a servo motor turn to 0°, 90° and 180° with the Servo library.',
    hardware: ['Arduino UNO R3', 'Breadboard', 'SG90 micro servo', '3-pin male header', '3 × jumper wires'],
    code: U3_SERVO, file: 'ServoAngles.ino', program: 'servo', fast: true, widgets: ['servo'],
    circuit: SERVO_PARTS, io: { D9: { kind: 'servo', item: 'sv1', needs: SERVO_IDS } },
    explain: {
      1: '<b>#include &lt;Servo.h&gt;</b> — Arduino’s official Servo library. It is installed with the Arduino IDE.',
      3: 'One <b>Servo</b> object per motor.',
      4: 'The servo’s orange signal wire goes to <b>pin 9</b>.',
      7: '<b>attach()</b>: from now on the library sends a pulse on pin 9 every 20 ms.',
      11: '<b>write(0)</b>: pulse 544 µs → turn to 0°.',
      12: 'Wait 1 s (the servo needs ≈0.3 s for 180°).',
      13: '<b>write(90)</b>: pulse 1472 µs → the middle.',
      15: '<b>write(180)</b>: pulse 2400 µs → the other end.',
    },
    steps: [
      {
        title: 'What we build', view: 'servo', have: [],
        body: `<p>A <b>servo</b> is a small motor that turns to an <b>exact angle</b> and holds it there — used in robot arms, RC planes, door locks and camera mounts.</p>
        <div class="ptree"><div class="pt-row"><span class="pt in">sketch: <code>write(90)</code></span></div><div class="pt-arrow">↓ pin 9 sends a 1472 µs pulse every 20 ms</div>
        <div class="pt-row"><span class="pt bus">servo arm turns to 90° and stays there</span></div></div>
        <p>Our sketch will move it <b>0° → 90° → 180°</b>, one step per second.</p>`,
      },
      {
        title: 'How a servo knows the angle', view: 'servo',
        body: `<p>Inside are a small motor, plastic gears and a position sensor. You tell it the angle with a <b>pulse</b>:</p>
        <table class="kv"><tr><th>Pulse width</th><th>Angle</th></tr><tr><td>544 µs</td><td>0°</td></tr><tr><td>1472 µs</td><td>90° (middle)</td></tr><tr><td>2400 µs</td><td>180°</td></tr></table>
        <p>The pulse repeats every <b>20 ms</b> (50 times per second). The <b>width</b> of the pulse — not the voltage — sets the angle.</p>
        <p class="tip">These are the Servo library’s default limits (544–2400 µs). The SG90 datasheet gives 500–2400 µs, so they match.</p>`,
      },
      {
        title: 'The three wires', view: 'servo',
        body: `<table class="kv"><tr><th>Wire</th><th>Goes to</th></tr>
        <tr><td><b style="color:#b0703e">Brown</b></td><td>GND</td></tr><tr><td><b style="color:#ff5a4f">Red</b></td><td><b>5V</b> (SG90: 4.8 V ≈ 5 V)</td></tr><tr><td><b style="color:#f08c3a">Orange</b></td><td><b>pin 9</b> (signal)</td></tr></table>
        <p>One small SG90 can run from the UNO R3 5V pin. Bigger or several servos need their own 5 V supply (with GND connected to the UNO R3 GND), because a motor can draw a lot of current when it starts or is blocked.</p>
        <p class="warn">The Servo library uses a timer: while a servo is attached, <code>analogWrite()</code> does <b>not</b> work on pins <b>9 and 10</b> (Servo library documentation).</p>`,
      },
      {
        title: 'Step 1 — place the servo', view: 'servo', power: false, have: ['sv1'], holes: ['j11 · GND', 'j12 · +5V', 'j13 · signal'],
        body: `<p>Push a 3-pin male header into <b>j11, j12, j13</b> and plug the servo connector onto it: <b>brown → j11</b>, red → j12, <b>orange → j13</b>.</p>`,
      },
      {
        title: 'Step 2 — wire it', view: 'servo', have: SERVO_IDS, pins: ['GND3', '5V', 'D9'],
        body: `<ul><li>Black: <b>f11</b> → <b>GND</b></li><li>Red: <b>f12</b> → <b>5V</b></li><li>Orange: <b>f13</b> → <b>pin 9</b></li></ul>`,
      },
      {
        title: 'Get to know the servo', view: 'servoclose',
        body: `<p><b>Click each part:</b> the white <b>horn</b> (arm), the <b>output shaft</b>, the blue <b>case</b> with the gears inside, the <b>mounting tabs</b>, the <b>cable</b> and the <b>plug</b>.</p>`,
      },
      {
        title: 'The code', view: 'servo', showCode: true,
        body: `<p><code>attach()</code> once, then <code>write(angle)</code> whenever you want a new angle. Click any line to see what it does.</p>
        <p class="tip">The Servo library comes with the Arduino IDE: just <code>#include &lt;Servo.h&gt;</code>.</p>`,
      },
      {
        title: 'Run it', view: 'servo', showCode: true, power: true, action: 'run',
        body: `<p>Watch the three boxes below: <b>write(angle)</b> → <b>pulse on pin 9</b> → <b>arm angle</b>, and the oscilloscope showing the pulse getting wider and narrower.</p>
        <p>The arm turns at the SG90’s datasheet speed: about <b>0.1 s per 60°</b>.</p>
        <p class="sim">Simulated: the pulse widths are the ones the Servo library calculates, <code>map(angle, 0, 180, 544, 2400)</code> in whole microseconds.</p>`,
      },
      {
        title: 'Summary', view: 'servo',
        body: `<ul><li>A servo turns to the angle set by the <b>pulse width</b>: ≈0.5 ms … 2.4 ms, repeated every 20 ms.</li>
        <li>Brown GND, red 5V, orange signal.</li><li><code>#include &lt;Servo.h&gt;</code>, <code>attach(pin)</code>, <code>write(angle)</code>.</li>
        <li>An attached servo takes over the timer that gives <code>analogWrite()</code> on pins 9 and 10.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What sets the servo angle?', a: ['The voltage on the signal wire', 'The width of the pulse', 'How long you power it', 'The current'], c: 1, why: 'The pulse width (≈0.5–2.4 ms, every 20 ms) sets the angle.' },
      { q: 'How often is the pulse repeated?', a: ['Every 1 ms', 'Every 20 ms', 'Every second', 'Only once'], c: 1, why: 'About every 20 ms (50 Hz) — datasheet and Servo library.' },
      { q: 'Which wire is the signal?', a: ['Brown', 'Red', 'Orange', 'Black'], c: 2, why: 'SG90: brown = GND, red = +, orange = signal.' },
      { q: 'With the library defaults, write(90) sends a pulse of about…', a: ['544 µs', '1000 µs', '1472 µs', '2400 µs'], c: 2, why: 'map(90, 0, 180, 544, 2400) = 1472 µs.' },
      { q: 'A servo is attached. What stops working on the UNO R3?', a: ['digitalWrite() on all pins', 'analogWrite() on pins 9 and 10', 'Serial', 'analogRead()'], c: 1, why: 'The Servo library uses the timer behind PWM on pins 9 and 10.' },
    ],
    sources: [SRC.sg90, SRC.servolib, SRC.ds],
  },

  // ================================================================== 14
  {
    id: 'u14', num: 14, module: 5, title: 'Drive a DC motor with an L293D', level: 'Intermediate', time: '25 min',
    goal: 'Control a DC motor’s direction and speed with an H-bridge driver, a battery and PWM.',
    hardware: ['Arduino UNO R3', 'Breadboard', 'L293D motor driver (DIP-16)', '“130” DC hobby motor + propeller', '4 × AA battery holder', '6 × jumper wires'],
    code: U3_MOTOR, file: 'MotorDriver.ino', program: 'motor', fast: true, widgets: ['motor'],
    circuit: MOTOR_PARTS, io: { D5: MOTOR_IO },
    explain: {
      2: '<b>Pin 5 → L293D pin 1 (1,2EN)</b>. EN switches outputs 1Y/2Y on or off. Pin 5 is a PWM pin (~), so we can also set the <b>speed</b>.',
      3: '<b>Pin 7 → L293D pin 2 (1A)</b>: input for output 1Y.',
      4: '<b>Pin 8 → L293D pin 7 (2A)</b>: input for output 2Y.',
      7: 'All three are outputs.',
      14: '1A HIGH …',
      15: '… 2A LOW → current flows 1Y → motor → 2Y: <b>direction 1</b>.',
      16: '<b>analogWrite(EN, 255)</b> = EN always on → full speed.',
      17: 'Run for 2 s.',
      20: '<b>analogWrite(EN, 128)</b> ≈ 50 % PWM → EN is on half of the time → slower.',
      24: '<b>EN = 0</b> → the outputs switch off (datasheet: “free-running motor stop”) → the motor <b>coasts</b> to a stop.',
      28: 'Swap the inputs: 1A LOW …',
      29: '… 2A HIGH → current flows the other way → <b>direction 2</b>.',
      30: 'Full speed again.',
      34: '1A = 2A (both LOW) with EN on → both motor wires are held at the same level → <b>fast stop</b> (brake).',
    },
    steps: [
      {
        title: 'What we build', view: 'motor', have: MOTOR_IDS, power: false,
        labels: [['u1', 'L293D motor driver'], ['mot1', 'DC motor'], ['bat1', 'Battery 4 × AA'], ['board', 'UNO R3']],
        body: `<p>The UNO R3 will make a small motor (with a propeller) spin <b>one way</b>, <b>slower</b>, <b>stop</b>, then the <b>other way</b>.</p>
        <div class="ptree"><div class="pt-row"><span class="pt in">UNO R3 pins 5 · 7 · 8 (small signals)</span></div><div class="pt-arrow">↓</div>
        <div class="pt-row"><span class="pt">L293D driver switches the big current</span><span class="pt in">from the battery</span></div><div class="pt-arrow">↓</div>
        <div class="pt-row"><span class="pt bus">motor spins</span></div></div>
        <p>The UNO R3 <b>decides</b>; the L293D <b>does the heavy work</b>; the battery <b>gives the energy</b>.</p>`,
      },
      {
        title: 'Why not connect the motor to a pin?', view: 'motor',
        body: `<table class="kv"><tr><th></th><th>Current</th></tr>
        <tr><td>UNO R3 pin (ATmega328P)</td><td><b>20 mA</b> recommended · <b>40 mA</b> absolute max</td></tr>
        <tr><td>This motor, no load</td><td>up to 70 mA</td></tr><tr><td>This motor, working</td><td>up to 250 mA</td></tr>
        <tr><td>This motor, blocked (stall)</td><td>up to <b>500 mA</b></td></tr></table>
        <p>A pin can’t give that much — it would be damaged. A <b>motor driver</b> is an electronic switch: a tiny signal from the pin controls a big current from the battery.</p>
        <p class="tip">We use a small “130” motor because even when blocked (500 mA) it stays under the L293D’s limit of <b>600 mA</b> per channel. The popular yellow gear motors can draw over 1 A when blocked — too much for an L293D.</p>`,
      },
      {
        title: 'How the L293D works (H-bridge)', view: 'drvclose',
        body: `<p>Inside are switches arranged like the letter <b>H</b>, with the motor in the middle. Closing one pair or the other makes current flow through the motor <b>one way or the other way</b>.</p>
        <table class="kv"><tr><th>EN</th><th>1A</th><th>2A</th><th>Motor (datasheet)</th></tr>
        <tr><td>HIGH</td><td>HIGH</td><td>LOW</td><td>turns one way</td></tr><tr><td>HIGH</td><td>LOW</td><td>HIGH</td><td>turns the other way</td></tr>
        <tr><td>HIGH</td><td colspan="2">same level</td><td>fast stop (brake)</td></tr><tr><td>LOW</td><td colspan="2">any</td><td>free-running stop (coasts)</td></tr></table>
        <p><b>Speed</b>: give EN a PWM signal (<code>analogWrite</code>, Lesson 7) — the outputs are on only part of the time, so the motor turns slower. Pin 5 switches at about 980 Hz (Arduino reference).</p>
        <p>The <b>D</b> in L293<b>D</b>: it has built-in diodes that absorb the voltage spike a motor makes when it is switched off.</p>`,
      },
      {
        title: 'Two power supplies, one ground', view: 'motor', pins: ['5V', 'GND2', 'GND3'],
        body: `<table class="kv"><tr><th>L293D pin</th><th>Needs</th><th>From</th></tr>
        <tr><td>16 · VCC1 (logic)</td><td>4.5–7 V</td><td>UNO R3 <b>5V</b></td></tr>
        <tr><td>8 · VCC2 (motor)</td><td>VCC1 … 36 V</td><td><b>battery +</b> (4 × AA ≈ 6 V)</td></tr>
        <tr><td>4, 5, 12, 13</td><td>ground</td><td>UNO R3 GND <b>and</b> battery −</td></tr></table>
        <ul><li>The motor gets its power from the <b>battery</b>, not from the UNO R3. Motors cause electrical noise and current peaks that could disturb the board.</li>
        <li><b>Common ground</b>: battery − and UNO R3 GND must be connected, otherwise the L293D can’t “see” the 5 V signals.</li>
        <li>The L293D needs only <b>2.3 V</b> for a HIGH (datasheet), so the 5 V signals are more than enough.</li></ul>
        <p class="warn">Never connect the battery + to the UNO R3 5V pin.</p>`,
      },
      {
        title: 'Step 1 — insert the L293D', view: 'drvclose', have: ['u1'], holes: ['f12 · pin 1 (EN)', 'e12 · pin 16 (VCC1)', 'f19 · pin 8 (VCC2)', 'f15 · pin 4 (ground)'],
        body: `<p>Push the chip across the centre gap, legs in columns <b>12–19</b>.</p>
        <p>The <b>notch</b> (half-moon) points left. Pin 1 is at the bottom-left (next to the dot), then the numbers go <b>anticlockwise</b> around the chip: 1–8 along the bottom, 9–16 along the top (16 above pin 1).</p>`,
      },
      {
        title: 'Step 2 — power and signal wires', view: 'motor', have: ['u1', ...MOTOR_LOGIC], pins: ['5V', 'GND3', 'D5', 'D7', 'D8'],
        body: `<ul><li>Red: <b>5V → a12</b> (pin 16, VCC1)</li><li>Black: <b>GND → a15</b> (pin 13, ground)</li>
        <li>Orange: <b>pin 5 → j12</b> (pin 1, EN)</li><li>Yellow: <b>pin 7 → j13</b> (pin 2, 1A)</li><li>Blue: <b>pin 8 → j18</b> (pin 7, 2A)</li></ul>`,
      },
      {
        title: 'Step 3 — motor and battery', view: 'motor', have: MOTOR_IDS, pins: ['GND2'],
        body: `<ul><li>Motor wires → <b>j14</b> (pin 3, 1Y) and <b>j17</b> (pin 6, 2Y)</li>
        <li>Battery <b>red (+)</b> → <b>j19</b> (pin 8, VCC2) · battery <b>black (−)</b> → <b>j16</b> (pin 5, ground)</li>
        <li>Black jumper: <b>GND → i16</b> — this joins battery − and UNO R3 GND (<b>common ground</b>)</li></ul>
        <p class="tip">Swapping the two motor wires swaps the direction.</p>`,
      },
      {
        title: 'Get to know the parts', view: 'drvclose',
        body: `<p><b>Click</b> the chip and each of its legs to see its name and where it is connected. Zoom out to click the motor (can, shaft, terminals, propeller) and the battery holder.</p>`,
      },
      { title: 'The code', view: 'motor', showCode: true, body: `<p>Two pins set the <b>direction</b> (7, 8), one PWM pin sets the <b>speed</b> (5). Click any line to see what it does.</p>` },
      {
        title: 'Run it', view: 'motor', showCode: true, power: true, action: 'run',
        body: `<p>Watch the boxes below and the motor:</p>
        <ol><li>Direction 1, <b>100 %</b> (2 s)</li><li>Direction 1, <b>50 %</b> (2 s)</li><li>EN LOW → <b>coasts</b> to a stop</li><li>Direction 2, <b>100 %</b> (2 s)</li><li>1A = 2A → <b>brakes</b> quickly</li></ol>
        <p>The highlighted row of the table shows which datasheet case is active.</p>
        <p class="sim">Simulated: speed is drawn as proportional to the PWM duty and much slower than reality (a 130 motor runs at thousands of rpm). Direction 1 is drawn clockwise — with the wires the other way round it would be anticlockwise.</p>`,
      },
      {
        title: 'Summary', view: 'motor',
        body: `<ul><li>A motor needs far more current than a pin can give → use a <b>driver</b> (L293D: 600 mA per channel).</li>
        <li><b>1A / 2A</b> choose the direction, <b>EN</b> with PWM sets the speed; EN LOW = coast, 1A = 2A = brake.</li>
        <li>VCC1 = 5 V logic, VCC2 = battery for the motor, and a <b>common ground</b>.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Why can’t the motor be connected straight to a UNO R3 pin?', a: ['The pin is too fast', 'A pin should give at most 20 mA (40 mA absolute max); the motor needs up to hundreds of mA', 'The motor needs 3.3 V only', 'It would turn backwards'], c: 1, why: 'ATmega328P pins: 20 mA recommended, 40 mA absolute maximum. This motor: up to 250 mA working, 500 mA blocked.' },
      { q: 'EN HIGH, 1A LOW, 2A HIGH. What does the motor do?', a: ['Stops', 'Turns the opposite way to 1A HIGH / 2A LOW', 'Coasts', 'Nothing — EN must be LOW'], c: 1, why: 'Swapping 1A and 2A reverses the current through the motor.' },
      { q: 'analogWrite(enablePin, 128) makes the motor…', a: ['Run backwards', 'Run at about half speed', 'Brake', 'Run at double speed'], c: 1, why: '128/255 ≈ 50 % PWM on EN: the outputs are on half of the time.' },
      { q: 'Why must battery − be connected to the UNO R3 GND?', a: ['To charge the battery', 'So both share the same 0 V reference and the L293D understands the signals', 'To make the motor faster', 'It is not needed'], c: 1, why: 'Voltages are always measured against a reference — both circuits need the same ground.' },
      { q: 'What does EN LOW do (datasheet)?', a: ['Fast stop (brake)', 'Free-running stop — the motor coasts', 'Full speed', 'Reverses the motor'], c: 1, why: 'TI datasheet: EN low → free-running motor stop.' },
    ],
    sources: [SRC.l293, SRC.motor130, SRC.aw, SRC.atm, SRC.ds],
  },

  // ================================================================== 15
  {
    id: 'u15', num: 15, module: 5, title: 'Switch a lamp with a relay module', level: 'Intermediate', time: '20 min',
    goal: 'Switch a separate circuit on and off with a relay, and use an active-low module correctly.',
    hardware: ['Arduino UNO R3', '1-channel 5 V relay module (low-level trigger)', '4 × AA battery holder (≈ 6 V)', 'Small lamp (E10, 6 V)', '6 × wires'],
    code: U3_RELAY, file: 'RelayLamp.ino', program: 'u3_relay', fast: true, widgets: ['relay'], noBreadboard: true,
    circuit: RELAY_PARTS, io: { D4: RELAY_IO },
    explain: {
      2: 'The module’s <b>IN</b> terminal is connected to <b>pin 4</b>.',
      4: '<b>relayOn()</b>: a small function that switches the relay on.',
      5: 'Pin 4 goes <b>LOW</b>. This module is <b>low-level triggered</b>: the relay switches <b>ON when IN is LOW</b> (Handsontec guide).',
      8: '<b>relayOff()</b>: switches the relay off.',
      9: 'Pin 4 goes <b>HIGH</b> = 5 V. The module is powered from the same 5 V, so there is no voltage across its input and the relay is OFF.',
      12: 'setup() runs once.',
      13: 'Pin 4 becomes an output.',
      14: 'Start with the relay OFF.',
      15: 'Serial output on.',
      19: 'Relay ON → the lamp circuit closes.',
      20: 'Print what happens.',
      21: 'Wait 3 seconds.',
      22: 'Relay OFF → the lamp circuit opens.',
      24: 'Wait 3 seconds, then repeat.',
    },
    steps: [
      {
        title: 'What we build', view: 'relay', have: RELAY_IDS, power: false, labels: [['rel1', 'Relay module'], ['lamp1', 'Lamp'], ['bat2', 'Battery 4 × AA'], ['board', 'UNO R3']],
        body: `<p>The UNO R3 will switch a <b>lamp</b> on and off — but the lamp is <b>not</b> connected to the UNO R3. It has its <b>own battery</b>.</p>
        <div class="ptree"><div class="pt-row"><span class="pt in">UNO R3 pin 4 (a small signal)</span></div><div class="pt-arrow">↓</div>
        <div class="pt-row"><span class="pt">relay module — a switch you control with a signal</span></div><div class="pt-arrow">↓ opens / closes the lamp circuit</div>
        <div class="pt-row"><span class="pt in">battery</span><span class="pt bus">lamp</span></div></div>
        <p>This is how a tiny microcontroller can control things with their <b>own power</b>: lamps, fans, pumps, door locks…</p>`,
      },
      {
        title: 'What is inside a relay?', view: 'relayclose', cutaway: true, power: true, have: RELAY_IDS,
        body: `<p>A relay is an <b>electromagnet that moves a switch</b>. The case is shown see-through here.</p>
        <ol><li>The <b>coil</b> (copper) is an electromagnet. Current through it makes it pull on the iron <b>armature</b>.</li>
        <li>The armature moves the <b>moving contact</b> (gold blade, connected to <b>COM</b>).</li>
        <li>Without current a spring holds the blade on <b>NC</b> (normally closed).</li><li>With current the blade snaps over to <b>NO</b> (normally open) — with a <b>click</b>.</li></ol>
        <p><b>Try it:</b> press the <b>“Energise the coil”</b> button in the panel below and listen.</p>
        <p class="tip">The coil circuit and the switch contacts are <b>not electrically connected</b> — only magnetism links them. That is why the lamp circuit can have a different battery (and voltage).</p>`,
      },
      {
        title: 'The module: click every part', view: 'relayclose',
        body: `<p>The relay alone needs more current than a pin can give, so the module adds a small driver circuit. <b>Click each part:</b></p>
        <ul><li><b>Input terminal:</b> DC+ (5 V), DC− (ground), IN (signal)</li><li><b>Output terminal:</b> NO, COM, NC — the switch, same names as in the relay</li>
        <li><b>Optocoupler 817C</b>: light inside carries the signal across (electrical isolation)</li><li><b>Transistor</b> and <b>diode</b>: switch the coil and absorb its voltage spike</li>
        <li><b>Trigger jumper</b> (H / L) and the two <b>LEDs</b></li></ul>`,
      },
      {
        title: 'Low-level trigger', view: 'relayclose', pins: ['5V', 'GND3', 'D4'],
        body: `<table class="kv"><tr><th>Module pin</th><th>Goes to</th></tr><tr><td>DC+</td><td><b>5V</b> (module and coil need 5 V)</td></tr><tr><td>DC−</td><td><b>GND</b></td></tr><tr><td>IN</td><td><b>pin 4</b></td></tr></table>
        <p>The jumper is on <b>L</b> (low-level trigger). The guide says: <b>“the relay actuates and the LED lights when the input pin is LOW, and turns off on HIGH”</b> — the opposite of what you might expect.</p>
        <table class="kv"><tr><th>Pin 4</th><th>Relay</th></tr><tr><td>LOW (0 V)</td><td>ON</td></tr><tr><td>HIGH (5 V)</td><td>OFF</td></tr></table>
        <p>The module’s input is powered from 5 V. A UNO R3 pin gives <b>5 V</b> when HIGH, the same voltage, so nothing flows through the input and the relay is cleanly off. (A 3.3 V board cannot do this reliably; the UNO R3 can.)</p>`,
      },
      {
        title: 'Safety first', view: 'relay',
        body: `<p class="warn"><b>Mains voltage (220/230 V) can kill.</b> The relay’s contacts are rated for AC 250 V / 10 A, but wiring mains is only for trained people, with the proper enclosure and insulation. In this course we only switch a <b>6 V battery</b> and a small lamp.</p>
        <ul><li>Contacts: max <b>DC 30 V / 10 A</b> and <b>AC 250 V / 10 A</b> (module guide).</li><li>Keep the load circuit <b>separate</b> from the UNO R3: no wire from the battery to any UNO R3 pin.</li>
        <li>A lamp or motor on a <b>real</b> supply needs a fuse suited to the load.</li></ul>`,
      },
      {
        title: 'Step 1 — place the parts', view: 'relay', power: false, have: ['rel1', 'bat2', 'lamp1'], labels: [['rel1', 'Relay module'], ['lamp1', 'Lamp'], ['bat2', 'Battery']],
        body: `<p>Put the relay module, the battery holder and the lamp on the desk. Nothing is connected yet.</p>`,
      },
      {
        title: 'Step 2 — the control wires', view: 'relay', have: ['rel1', 'bat2', 'lamp1', 'l5', 'l6', 'l7'], pins: ['5V', 'GND3', 'D4'],
        body: `<ul><li>Red: <b>5V → DC+</b></li><li>Black: <b>GND → DC−</b></li><li>Yellow: <b>pin 4 → IN</b></li></ul>
        <p>Strip about 6 mm of insulation, push the bare wire into the terminal and tighten the screw. The module’s power LED lights up.</p>`,
      },
      {
        title: 'Step 3 — the lamp circuit', view: 'relay', have: RELAY_IDS,
        body: `<ul><li>Battery <b>+</b> (red) → <b>COM</b></li><li><b>NO</b> → lamp terminal 1</li><li>Lamp terminal 2 → battery <b>−</b> (black)</li></ul>
        <p class="path">battery + → COM → (relay switch) → NO → lamp → battery −</p>
        <p>Right now the relay is off, so the switch connects <b>COM–NC</b> (unused) and the circuit is open: the lamp is off. When the relay switches on, <b>COM–NO</b> closes the circuit.</p>`,
      },
      { title: 'The code', view: 'relay', showCode: true, body: `<p>Two small functions, <code>relayOn()</code> and <code>relayOff()</code>, make the program easy to read. Click any line in the code panel.</p>` },
      {
        title: 'Run it', view: 'relay', showCode: true, power: true, action: 'run',
        body: `<ol><li>Pin 4 goes <b>LOW</b> → the module’s LED lights → the relay <b>clicks</b> → the lamp <b>turns on</b>.</li><li>3 s later pin 4 goes <b>HIGH</b> → the relay clicks again → the lamp <b>turns off</b>.</li></ol>
        <p>The three boxes in the panel show the chain, and the table highlights the row that applies.</p>
        <p class="sim">The click sound is generated by your browser (turn sound on in the top bar if you cannot hear it).</p>`,
      },
      {
        title: 'Summary', view: 'relay',
        body: `<ul><li>A relay is an <b>electromagnet-operated switch</b>: COM, NO (normally open), NC (normally closed).</li>
        <li>This module is <b>low-level triggered</b>: pin LOW = relay ON, pin HIGH (5 V) = relay OFF.</li>
        <li>The load has its <b>own supply</b>; never wire mains without proper training.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Which terminals does the lamp circuit use in this lesson?', a: ['DC+ and DC−', 'COM and NO', 'IN and GND', 'NC and DC+'], c: 1, why: 'Battery + goes to COM; NO goes to the lamp. COM–NO closes only when the relay is on.' },
      { q: 'This module is low-level triggered. The relay switches ON when IN is…', a: ['HIGH', 'LOW', 'floating', 'never'], c: 1, why: 'Handsontec guide: the relay actuates and the LED lights when the input pin is LOW.' },
      { q: 'Which line switches the lamp OFF in this sketch?', a: ['digitalWrite(relayPin, LOW)', 'digitalWrite(relayPin, HIGH)', 'delay(3000)', 'pinMode(relayPin, INPUT)'], c: 1, why: 'HIGH (5 V) on IN equals the module’s 5 V supply, so the relay releases.' },
      { q: 'What links the relay’s coil to the lamp circuit?', a: ['A copper wire', 'The battery', 'Only magnetism — they are not electrically connected', 'The UNO R3 GND'], c: 2, why: 'The coil’s magnet moves the contact; the two circuits stay electrically separate.' },
      { q: 'What is the maximum DC the module’s contacts may switch (guide)?', a: ['5 V / 1 A', '12 V / 2 A', '30 V / 10 A', '250 V / 100 A'], c: 2, why: 'Relay maximum output: DC 30 V / 10 A, AC 250 V / 10 A.' },
    ],
    sources: [SRC.relaymod, SRC.ds],
  },

  // ================================================================== 16
  {
    id: 'u16', num: 16, module: 6, title: 'Read an I²C sensor: temperature and humidity', level: 'Intermediate', time: '25 min',
    goal: 'Wire a digital I²C sensor with four wires and read temperature and humidity with the Adafruit SHT31 library.',
    hardware: ['Arduino UNO R3', 'Breadboard', 'Adafruit SHT31-D breakout with header pins', '4 × jumper wires'],
    code: U3_SHT31, file: 'sht31_read.ino', program: 'u3_sht31', fast: true, widgets: ['pisens'], sdaWire: 'w43',
    circuit: I2C_PARTS, io: { A4: { kind: 'i2c', item: 'sen1', needs: I2C_IDS } },
    explain: {
      1: '<b>Wire.h</b> is Arduino’s I²C library. It comes with the Arduino IDE.',
      2: 'The <b>driver</b> for the SHT31-D sensor. Install <b>Adafruit SHT31 Library</b> from the Library Manager (it also needs Adafruit BusIO).',
      4: 'Create the sensor object.',
      6: '<b>setup()</b> runs once.',
      7: 'Serial output on.',
      8: '<b>begin(0x44)</b> starts the I²C bus and looks for a sensor at address <b>0x44</b> (the default). It returns <code>false</code> if nobody answers.',
      9: 'No answer → tell the user.',
      10: 'Stop here forever: there is nothing to read.',
      14: '<b>loop()</b> repeats forever.',
      15: '<b>readTemperature()</b> asks the sensor for a measurement and returns °C as a <code>float</code>.',
      16: '<b>readHumidity()</b>: relative humidity in %.',
      17: 'Print the label…',
      18: '…the temperature with 1 decimal…',
      19: '…and the unit.',
      20: 'Same for the humidity.',
      23: 'Wait 2 seconds, then measure again.',
    },
    steps: [
      {
        title: 'What is I²C?', view: 'bench', have: [], power: false,
        body: `<p><b>I²C</b> (“eye-squared-see”) lets the UNO R3 talk to sensors with <b>two signal wires</b>:</p>
        <table class="kv"><tr><th>Wire</th><th>Job</th><th>UNO R3 pin</th></tr><tr><td><b>SDA</b></td><td>the <b>data</b></td><td>A4 (also the SDA pin next to AREF)</td></tr><tr><td><b>SCL</b></td><td>the <b>clock</b></td><td>A5 (also the SCL pin next to AREF)</td></tr></table>
        <p>Each device has its own <b>address</b>. The UNO R3 calls an address and only that device answers. The SDA/SCL pins near AREF are connected to A4/A5 on the board, so use either.</p>
        <p class="tip">Many devices can share the same two wires, as long as every address is different.</p>`,
      },
      {
        title: 'The sensor: SHT31-D', view: 'breadboard', have: ['sen1'], power: false, holes: ['g10 · VIN', 'g11 · GND', 'g12 · SCL', 'g13 · SDA'],
        body: `<p>The <b>Adafruit SHT31-D</b> breakout carries a Sensirion sensor that measures <b>temperature and humidity</b> and sends finished numbers over I²C. <b>Click its parts</b> in the 3D view.</p>
        <ul><li>Accuracy (Adafruit): about <b>±0.3 °C</b> and <b>±2 %RH</b>.</li><li>Power: <b>2.5–5 V</b>, so the UNO R3’s <b>5V</b> pin is fine.</li><li>I²C address <b>0x44</b>; tying ADDR to VIN changes it to 0x45.</li></ul>
        <p>Its pads are in this order: <b>VIN, GND, SCL, SDA, ADDR, RST, ALRT</b>. We use the first four.</p>`,
      },
      {
        title: 'Step 1 — put the sensor on the breadboard', view: 'breadboard', have: ['sen1'], power: false, holes: ['g10 · VIN', 'g11 · GND', 'g12 · SCL', 'g13 · SDA'],
        body: `<p>Push the sensor’s header pins into row <b>g</b>: <b>VIN in g10, GND in g11, SCL in g12, SDA in g13</b>. (ADDR, RST and ALRT go into g14–g16 and stay unconnected.) Holes g–j of one column are connected inside the breadboard.</p>`,
      },
      {
        title: 'Step 2 — four wires to the UNO R3', view: 'bench', have: I2C_IDS, pins: ['5V', 'GND3', 'A5', 'A4'],
        body: `<ul><li>Red: <b>5V → j10</b> (VIN)</li><li>Black: <b>GND → j11</b></li><li>Yellow: <b>A5 (SCL) → j12</b></li><li>Blue: <b>A4 (SDA) → j13</b></li></ul>
        <p class="warn">Do not swap SDA and SCL: the sensor cannot answer and the sketch will say “Couldn’t find SHT31”.</p>`,
      },
      {
        title: 'Install the library', view: 'bench', have: I2C_IDS,
        body: `<p>The sketch uses Adafruit’s library. In the Arduino IDE: <b>Sketch → Include Library → Manage Libraries…</b>, search for <b>Adafruit SHT31 Library</b> and click <b>Install</b>. Accept the extra library it asks for (<b>Adafruit BusIO</b>).</p>
        <p>The library offers <code>begin(address)</code>, <code>readTemperature()</code> and <code>readHumidity()</code> (Adafruit_SHT31.h).</p>`,
      },
      { title: 'The code', view: 'bench', have: I2C_IDS, showCode: true, power: true, body: `<p>Adafruit’s <b>sht31test</b> example, shortened to the two readings. Click any line.</p>` },
      {
        title: 'Run it', view: 'bench', have: I2C_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Every two seconds the Serial Monitor prints the temperature and humidity. <b>Move the sliders</b> (the air around the sensor) and watch the numbers follow.</p>
        <p class="sim">Simulated values. The line that reads the sensor is highlighted while it runs.</p>`,
      },
      {
        title: 'What if a wire is loose?', view: 'bench', have: I2C_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Unplug the SDA wire”</b> and run it again. Nobody answers at address 0x44, <code>begin()</code> returns <code>false</code>, and the Serial Monitor shows:</p>
        <pre class="tree">Couldn't find SHT31</pre>
        <p>This message is the first thing to look for when an I²C sensor does not work: check the four wires (power, ground, SDA, SCL) and the address.</p>`,
      },
      {
        title: 'Summary', view: 'bench', have: I2C_IDS, power: true,
        body: `<ul><li>I²C = two wires, <b>SDA</b> (A4) and <b>SCL</b> (A5), plus power (5V) and ground; devices have addresses (SHT31-D: 0x44).</li>
        <li><code>#include &lt;Wire.h&gt;</code> and Adafruit’s library; <code>sht31.begin(0x44)</code>, then <code>readTemperature()</code> and <code>readHumidity()</code>.</li>
        <li>“Couldn’t find SHT31” = check wiring and address.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Which UNO R3 pins are SDA and SCL?', a: ['A4 (SDA) and A5 (SCL)', 'Pins 0 and 1', 'Pins 11 and 12', 'A0 and A1'], c: 0, why: 'On the UNO R3, SDA is on A4 and SCL on A5 (also brought out next to AREF).' },
      { q: 'Where do you connect the SHT31-D breakout’s VIN on the UNO R3?', a: ['5V (it accepts 2.5–5 V)', 'Pin 13', 'A4', 'VIN of the board only'], c: 0, why: 'The breakout runs from 2.5–5 V, so the UNO R3’s 5V pin works.' },
      { q: 'Default I²C address of the SHT31-D?', a: ['0x10', '0x44', '0x6C', '0xFF'], c: 1, why: 'Default 0x44; 0x45 when ADDR is tied to VIN.' },
      { q: 'The Serial Monitor says “Couldn’t find SHT31”. What do you check?', a: ['The monitor', 'The four wires and the address', 'The USB cable length', 'The LED'], c: 1, why: 'begin(0x44) returned false: nobody answered, usually a loose or swapped wire.' },
    ],
    sources: [SRC.sht31, SRC.sht31lib, SRC.wire, SRC.ds],
  },
];

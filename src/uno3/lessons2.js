// Lessons 9-16 of the Arduino UNO R3: sensors, motion and power, I²C.
// Facts come from the UNO R3 datasheet A000066 (DS), the ATmega328P datasheet (ATM), the Arduino language reference and the
// component datasheets listed in each lesson. Code listings: ./code.js (line numbers are checked by tools/check_code.mjs).
import { U3_NIGHT, U3_TMP36, U3_ULTRASONIC, U3_PIR, U3_SERVO, U3_MOTOR, U3_RELAY, U3_SHT31, U3_RGB, U3_DHT, U3_JOY, U3_ENC, U3_LCD, U3_OLED, U3_NEO, U3_QSW, U3_MOSW, U3_DIODE, U3_MILLIS, U3_SCAN, U3_DS18, U3_IR, U3_MPU, U3_STEP, U3_BMP, U3_SOIL, U3_SND } from './code.js';
import {
  SRC, LED_IDS, IO_LED, LED_CIRCUIT,
  LDR_PARTS, LDR_IDS, TMP_PARTS, TMP_IDS, US_PARTS, US_IDS, PIR_PARTS, PIR_IDS, SERVO_PARTS, SERVO_IDS,
  MOTOR_PARTS, MOTOR_IDS, MOTOR_LOGIC, MOTOR_IO, RELAY_PARTS, RELAY_IDS, RELAY_IO, I2C_PARTS, I2C_IDS, RGB_PARTS, RGB_IDS, DHT_PARTS, DHT_IDS, JOY_PARTS, JOY_IDS, ENC_PARTS, ENC_IDS, LCD_PARTS, LCD_IDS, OLED_PARTS, OLED_IDS, NEO_PARTS, NEO_IDS, Q_PARTS, Q_IDS, M_PARTS, M_IDS, D_PARTS, D_IDS, BUTTON_PARTS, BUTTON_IDS, SCAN_PARTS, SCAN_IDS, DS_PARTS, DS_IDS, IR_PARTS, IR_IDS, MPU_PARTS, MPU_IDS, STEP_PARTS, STEP_IDS, BMP_PARTS, BMP_IDS, SOIL_PARTS, SOIL_IDS, SND_PARTS, SND_IDS,
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

  // ================================================================== 17
  {
    id: 'u17', num: 17, module: 7, title: 'RGB LED: mix any colour', level: 'Beginner', time: '20 min',
    goal: 'Drive the three dice of an RGB LED with three PWM pins and mix red, green and blue into other colours.',
    hardware: ['Arduino UNO R3', 'Breadboard', 'RGB LED (common cathode, 4 legs)', '3 × 220 Ω resistors', '4 × jumper wires'],
    code: U3_RGB, file: 'RGB_LED.ino', program: 'u3_rgb', widgets: [],
    circuit: RGB_PARTS, io: { D9: { kind: 'rgb', ch: 0, item: 'rgb1', needs: RGB_IDS }, D10: { kind: 'rgb', ch: 1, item: 'rgb1', needs: RGB_IDS }, D11: { kind: 'rgb', ch: 2, item: 'rgb1', needs: RGB_IDS } },
    explain: {
      2: 'Pin 9 drives the <b>red</b> die. All three pins must be PWM pins (marked ~ on the board).',
      3: 'Pin 10 drives the <b>green</b> die.',
      4: 'Pin 11 drives the <b>blue</b> die.',
      6: 'Our own function: give it three brightness values and it sets the colour.',
      7: '<b>analogWrite(pin, 0 … 255)</b>: PWM duty cycle. 255 = full brightness, 0 = off.',
      8: 'Green…',
      9: '…and blue.',
      12: '<b>setup()</b> runs once.',
      13: 'The three pins become outputs.',
      14: 'Green pin.',
      15: 'Blue pin.',
      18: '<b>loop()</b> repeats forever.',
      19: 'Red only.',
      21: 'Green only.',
      23: 'Blue only.',
      25: 'Red + green light together look <b>yellow</b> (additive colour mixing).',
      27: 'All three together look <b>white</b>.',
      29: 'All off.',
    },
    steps: [
      { title: 'One LED, three colours', view: 'bench', have: [], power: false,
        body: `<p>An <b>RGB LED</b> has a <b>red</b>, a <b>green</b> and a <b>blue</b> LED in one housing. Your eye mixes their light: red + green looks <b>yellow</b>, green + blue looks <b>cyan</b>, red + blue looks <b>magenta</b>, all three look <b>white</b>.</p>
        <p>It has <b>four legs</b>: red, the <b>common</b> leg (the longest one), green, blue. In a <b>common-cathode</b> LED the common leg goes to <b>GND</b>; in a <b>common-anode</b> LED it goes to the supply and a colour lights when its pin is <b>LOW</b>. This lesson uses common cathode.</p>` },
      { title: 'Each colour needs its own resistor', view: 'breadboard', have: ['rgb1'], power: false, holes: ['e10 · red', 'e11 · common', 'e12 · green', 'e13 · blue'],
        body: `<p>Push the LED into <b>e10 – e13</b>: red, common, green, blue. Every colour is a separate LED, so every colour needs a <b>series resistor</b> (about 220 Ω here).</p>
        <p class="tip">The three dice need different voltages: red about <b>2.0 V</b>, green and blue about <b>3.0 V</b> or more (typical values, check your datasheet). With the same 220 Ω resistor, red gets more current and looks brighter than green and blue. Real projects use a smaller resistor for green and blue.</p>` },
      { title: 'Step 1 — three resistors', view: 'breadboard', have: ['rgb1', 'r1', 'r2', 'r3'], power: false, holes: ['a10 → a16', 'a12 → a17', 'a13 → a18'],
        body: `<p>Resistors from each colour leg to a free column: <b>a10 → a16</b> (red), <b>a12 → a17</b> (green), <b>a13 → a18</b> (blue).</p>` },
      { title: 'Step 2 — wires to pins 9, 10, 11 and GND', view: 'bench', have: RGB_IDS, pins: ['D9', 'D10', 'D11', 'GND2'],
        body: `<ul><li>Red: <b>pin 9 → b16</b></li><li>Green: <b>pin 10 → b17</b></li><li>Blue: <b>pin 11 → b18</b></li><li>Black: <b>GND → a11</b> (the common leg)</li></ul>
        <p class="warn">If your LED is <b>common anode</b>, the common leg must go to <b>5V</b> instead and the colours work upside down (255 = off).</p>` },
      { title: 'The code', view: 'bench', have: RGB_IDS, showCode: true, power: true,
        body: `<p><code>analogWrite(pin, value)</code> sends PWM at the pin; the value 0 – 255 is the brightness. <code>setColor(r, g, b)</code> sets all three at once. Click any line.</p>` },
      { title: 'Run it', view: 'bench', have: RGB_IDS, showCode: true, power: true, action: 'run',
        body: `<p>The LED shows red, green, blue, yellow, white and off, one second each. Watch the serial line under the code: it shows the PWM value of the pin that changed.</p>
        <p class="sim">Simulated brightness: it follows the duty cycle and the typical forward voltages above, so on 5 V the green and blue look a little dimmer than red.</p>` },
      { title: 'Summary', view: 'bench', have: RGB_IDS, power: true,
        body: `<ul><li>RGB LED = three LEDs, one common leg (cathode to GND, or anode to the supply).</li><li>One resistor per colour; three PWM pins; <code>analogWrite(pin, 0 … 255)</code>.</li><li>Colours add: R + G = yellow, G + B = cyan, R + B = magenta, R + G + B = white.</li></ul>` },
    ],
    quiz: [
      { q: 'Which leg of a common-cathode RGB LED goes to GND?', a: ['Red', 'The common (longest) leg', 'Green', 'Blue'], c: 1, why: 'The common leg is the shared cathode.' },
      { q: 'You set red = 255, green = 255, blue = 0. What colour do you see?', a: ['Cyan', 'Magenta', 'Yellow', 'White'], c: 2, why: 'Red and green light mix to yellow.' },
      { q: 'How many resistors does the RGB LED need?', a: ['None', 'One for the common leg', 'One per colour (three)', 'Four'], c: 2, why: 'Each colour is a separate LED and needs its own series resistor.' },
      { q: 'Why must the three colour pins be PWM pins?', a: ['To set different brightness values with analogWrite', 'Only to save power', 'They do not have to be', 'To read the LED'], c: 0, why: 'PWM changes the average current, which sets the brightness.' },
    ],
    sources: [SRC.aw, SRC.ds],
  },
  // ================================================================== 18
  {
    id: 'u18', num: 18, module: 7, title: 'DHT11: temperature and humidity on one wire', level: 'Intermediate', time: '20 min',
    goal: 'Wire a DHT11 with its pull-up resistor and read temperature and humidity with the Adafruit DHT library.',
    hardware: ['Arduino UNO R3', 'Breadboard', 'DHT11 sensor (4 pins)', '10 kΩ resistor', '4 × jumper wires'],
    code: U3_DHT, file: 'DHT_read.ino', program: 'u3_dht', fast: true, widgets: ['pisens'], sdaWire: 'w61', dht: true,
    circuit: DHT_PARTS, io: { D2: { kind: 'dht', item: 'dht1', needs: DHT_IDS } },
    explain: {
      1: 'The library by Adafruit. Install <b>“DHT sensor library”</b> from the Library Manager (it also needs <b>Adafruit Unified Sensor</b>).',
      3: 'The DATA wire is on <b>pin 2</b>.',
      4: 'Which sensor: DHT11 (blue) or DHT22 (white).',
      6: 'Create the sensor object.',
      8: '<b>setup()</b> runs once.',
      9: 'Serial output on (9600).',
      10: 'Start the sensor library.',
      13: '<b>loop()</b> repeats forever.',
      14: 'The DHT11 is slow: do not read it more than once per second (the DHT22 once per 2 seconds). We wait 2 seconds.',
      15: '<b>readHumidity()</b> returns the relative humidity in %.',
      16: '<b>readTemperature()</b> returns °C.',
      17: 'If the read failed, the library returns <b>NaN</b> (not a number).',
      18: 'Tell the user.',
      19: 'Try again after the next delay.',
      21: 'Print the label…',
      22: '…the humidity…',
      24: '…the temperature…',
      25: '…and the unit.',
    },
    steps: [
      { title: 'The DHT sensor', view: 'breadboard', have: ['dht1'], power: false, holes: ['e10 · VCC', 'e11 · DATA', 'e12 · not connected', 'e13 · GND'],
        body: `<p>The <b>DHT11</b> measures temperature and humidity and sends both numbers on <b>one data wire</b>. Its four pins (grille facing you, from the left): <b>1 VCC, 2 DATA, 3 not connected, 4 GND</b>.</p>
        <ul><li>Power: <b>3 V to 5 V</b>.</li><li>DHT11: humidity <b>20 – 80 %</b> (±5 %), temperature <b>0 – 50 °C</b> (±2 °C), at most <b>1 reading per second</b>.</li><li>DHT22: 0 – 100 %RH, −40 – 80 °C, ±0.5 °C, one reading every 2 s.</li></ul>
        <p class="tip">A 3-pin <b>module</b> already has the pull-up resistor on its board, but its pin order differs between makers: read the printing on it. This lesson uses the bare 4-pin sensor.</p>` },
      { title: 'The pull-up resistor', view: 'bench', have: [],
        body: `<p>The sensor can pull the DATA line <b>low</b> but cannot pull it <b>high</b>. A <b>pull-up resistor</b> between DATA and VCC (10 kΩ in the Adafruit example) holds the line high when nobody pulls it down. Without it the board never receives a reading.</p>` },
      { title: 'Step 1 — the sensor and the resistor', view: 'breadboard', have: ['dht1', 'r60', 'w63'], power: false, holes: ['c10 · resistor', 'c16 · resistor'],
        body: `<p>Push the sensor into <b>e10 – e13</b>. The <b>10 kΩ resistor</b> goes from <b>c10</b> (VCC column) to <b>c16</b>; a jumper from <b>b11</b> (DATA column) to <b>b16</b> joins the other end to DATA. Together they are the pull-up between DATA and VCC.</p>` },
      { title: 'Step 2 — power, data and ground', view: 'bench', have: DHT_IDS, pins: ['5V', 'D2', 'GND3'],
        body: `<ul><li>Red: <b>5V → a10</b> (VCC)</li><li>Yellow: <b>pin 2 → a11</b> (DATA)</li><li>Black: <b>GND → a13</b></li></ul>
        <p class="warn">On a 3.3 V board (ESP32, Raspberry Pi) you would power the sensor from <b>3.3 V</b> so that the pulled-up DATA line never exceeds the 3.3 V of the pin. The UNO R3 works at 5 V.</p>` },
      { title: 'Install the library', view: 'bench', have: DHT_IDS,
        body: `<p>In the Arduino IDE: <b>Sketch → Include Library → Manage Libraries…</b>, search for <b>DHT sensor library</b> (Adafruit) and install it with its dependency <b>Adafruit Unified Sensor</b>.</p>` },
      { title: 'The code', view: 'bench', have: DHT_IDS, showCode: true, power: true, body: `<p>Shortened from Adafruit’s <b>DHTtester</b> example. Click lines 14, 17 and 22.</p>` },
      { title: 'Run it', view: 'bench', have: DHT_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Every 2 seconds the Serial Monitor prints the humidity and temperature. <b>Move the sliders</b> and watch the numbers follow (the DHT11 gives whole numbers).</p>
        <p class="sim">Simulated values, limited to what a DHT11 is specified for (0 – 50 °C, 20 – 80 %RH).</p>` },
      { title: 'What if the data wire is loose?', view: 'bench', have: DHT_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Unplug the DATA wire”</b> and run it again. Nothing arrives, the library returns NaN, and the Serial Monitor shows:</p>
        <pre class="tree">Failed to read from DHT sensor!</pre>
        <p>This is the first message to look for when a DHT does not work: check the three wires and the <b>pull-up resistor</b>.</p>` },
      { title: 'Summary', view: 'bench', have: DHT_IDS, power: true,
        body: `<ul><li>DHT: VCC, DATA, (NC), GND; DATA needs a pull-up resistor to VCC.</li><li><code>DHT dht(pin, DHT11)</code>, <code>dht.begin()</code>, <code>readHumidity()</code>, <code>readTemperature()</code>; <code>isnan()</code> means the read failed.</li><li>Read the DHT11 at most once per second, the DHT22 once per 2 seconds.</li></ul>` },
    ],
    quiz: [
      { q: 'What does the pull-up resistor on the DATA line do?', a: ['It cools the sensor', 'It holds the line high when nobody pulls it low', 'It measures the humidity', 'It limits the LED current'], c: 1, why: 'The sensor can only pull the line low.' },
      { q: 'readTemperature() returns NaN. What does it mean?', a: ['It is 0 °C', 'The read failed', 'The sensor is a DHT22', 'The temperature is very high'], c: 1, why: 'NaN means not a number: no valid reading arrived.' },
      { q: 'How often may you read a DHT11?', a: ['1000 times per second', 'At most once per second', 'Only once', 'Once per hour'], c: 1, why: 'Adafruit: no more than 1 Hz for the DHT11 (0.5 Hz for the DHT22).' },
      { q: 'Which pin of the 4-pin DHT is not used?', a: ['Pin 1', 'Pin 2', 'Pin 3', 'Pin 4'], c: 2, why: 'Pin 3 is not connected.' },
    ],
    sources: [SRC.dhtguide, SRC.dhtlib, SRC.ds],
  },

  // ================================================================== 19
  {
    id: 'u19', num: 19, module: 8, title: 'Analog joystick: two axes and a button', level: 'Beginner', time: '15 min',
    goal: 'Read the two analog axes of a joystick module with analogRead() and its push switch with INPUT_PULLUP.',
    hardware: ['Arduino UNO R3', 'Breadboard', 'Analog joystick module (KY-023 style)', '5 × jumper wires'],
    code: U3_JOY, file: 'Joystick.ino', program: 'u3_joy', fast: true, widgets: ['joy'],
    circuit: JOY_PARTS, io: { A0: { kind: 'joyax', ax: 'x', item: 'joy1', needs: JOY_IDS }, A1: { kind: 'joyax', ax: 'y', item: 'joy1', needs: JOY_IDS }, D2: { kind: 'joysw', item: 'joy1', needs: JOY_IDS } },
    explain: {
      2: '<b>VRx</b> (the left–right axis) goes to an <b>analog input</b>.',
      3: '<b>VRy</b> (the up–down axis) goes to a second analog input.',
      4: 'The push switch <b>SW</b>.',
      6: '<b>setup()</b> runs once.',
      7: 'Serial output on.',
      8: 'The switch connects the pin to GND when the stick is pressed, so use <b>INPUT_PULLUP</b>: released = HIGH, pressed = LOW.',
      11: '<b>loop()</b> repeats forever.',
      12: '<b>analogRead</b> measures the voltage on VRx: 0 … 1023, about 512 at the centre.',
      13: 'Same for VRy.',
      14: 'Pressed = the pin reads LOW.',
      15: 'Print the label…',
      16: '…the X value…',
      17: '…the label for Y…',
      18: '…the Y value…',
      19: '…the label for the button…',
      20: '…and its state.',
      21: 'Wait 200 ms: five readings per second.',
    },
    steps: [
      { title: 'What is in a joystick module?', view: 'bench', have: [], power: false,
        body: `<p>Moving the stick turns <b>two 10 kΩ potentiometers</b> at 90° to each other. Each one is a voltage divider: its output (<b>VRx</b> or <b>VRy</b>) is a voltage between 0 V and the supply, and about <b>half the supply</b> when the stick is centred. Pushing the stick straight down closes a switch (<b>SW</b>).</p>
        <p>Pins on a common KY-023 module: <b>GND, +5V, VRx, VRy, SW</b>. The order differs on some clones: read the printing, and swap VRx and VRy in the code if the axes are reversed.</p>` },
      { title: 'Power it from the analog reference voltage', view: 'bench', have: [],
        body: `<p>Connect the module’s supply to <b>5 V: the UNO R3 works at 5 V and its ADC reference is 5 V</b>.</p>
        <p class="tip">The wiper voltage can go up to the supply voltage, and the ADC can only measure up to its own reference.</p>` },
      { title: 'Step 1 — put the module on the breadboard', view: 'breadboard', power: false, have: ['joy1'], holes: ['g10 · GND', 'g11 · VCC', 'g12 · VRx', 'g13 · VRy', 'g14 · SW'],
        body: `<p>Push the five header pins into row <b>g</b>: <b>g10 – g14</b>. The board lies over the breadboard.</p>` },
      { title: 'Step 2 — five wires', view: 'bench', have: JOY_IDS, pins: ['5V', 'A0', 'A1', 'D2', 'GND2'],
        body: `<ul><li>Black: <b>GND → j10</b></li><li>Red: <b>5V → j11</b> (+5V)</li><li>Green: <b>A0 → j12</b> (VRx)</li><li>Blue: <b>A1 → j13</b> (VRy)</li><li>Yellow: <b>pin 2 → j14</b> (SW)</li></ul>` },
      { title: 'The code', view: 'bench', have: JOY_IDS, showCode: true, power: true, body: `<p>Two <code>analogRead()</code> calls and one <code>digitalRead()</code>. Click lines 8, 12 and 14.</p>` },
      { title: 'Run it and move the stick', view: 'bench', have: JOY_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Move the <b>X</b> and <b>Y sliders</b> (or hold the button) in the panel: the numbers in the Serial Monitor follow, and the 3D stick tilts.</p><p class="sim">Simulated: 0 … 1023, ideal ADC with a little noise.</p>` },
      { title: 'Summary', view: 'bench', have: JOY_IDS, power: true,
        body: `<ul><li>Two potentiometers: VRx and VRy = voltages between 0 V and the supply, about half at the centre.</li><li>Read them with <code>analogRead()</code> on ADC pins; read SW with <code>INPUT_PULLUP</code> (pressed = LOW).</li><li>Power the module so the outputs never exceed what the analog pins accept.</li></ul>` },
    ],
    quiz: [
      { q: 'The stick is centred. About what does analogRead() return?', a: ['0', 'About half of the maximum', 'The maximum', 'Random'], c: 1, why: 'Each axis is a voltage divider: half the supply at the centre.' },
      { q: 'SW is pressed. What does digitalRead() return with INPUT_PULLUP?', a: ['HIGH', 'LOW', '2.5 V', 'Nothing'], c: 1, why: 'The switch connects the pin to GND.' },
      { q: 'The up and down axes are reversed. What is the easiest fix?', a: ['Replace the board', 'Swap VRx and VRy in the code (or the wires)', 'Use a bigger resistor', 'Nothing can be done'], c: 1, why: 'Some modules label the axes differently.' },
      { q: 'Why power the module from the right supply?', a: ['To make it brighter', 'The outputs can reach the supply voltage, which must not exceed what the analog pin accepts', 'It needs no power', 'For the switch only'], c: 1, why: 'The wiper voltage goes up to the supply.' },
    ],
    sources: [SRC.ky023, SRC.ar, SRC.pinmode],
  },

  // ================================================================== 20
  {
    id: 'u20', num: 20, module: 8, title: 'Rotary encoder: count the clicks', level: 'Intermediate', time: '20 min',
    goal: 'Read the two quadrature signals of a rotary encoder and count steps up and down.',
    hardware: ['Arduino UNO R3', 'Breadboard', 'Rotary encoder module (KY-040 style)', '5 × jumper wires'],
    code: U3_ENC, file: 'Encoder.ino', program: 'u3_enc', fast: true, widgets: ['enc'],
    circuit: ENC_PARTS, io: { D2: { kind: 'enc', role: 'clk', item: 'enc1', needs: ENC_IDS }, D3: { kind: 'enc', role: 'dt', item: 'enc1', needs: ENC_IDS }, D4: { kind: 'enc', role: 'sw', item: 'enc1', needs: ENC_IDS } },
    explain: {
      2: '<b>CLK</b> (channel A) of the encoder.',
      3: '<b>DT</b> (channel B).',
      4: '<b>SW</b>: the push switch under the knob.',
      5: 'The number of steps counted: up for one direction, down for the other.',
      6: 'The last CLK level we saw, to detect a change.',
      8: '<b>setup()</b> runs once.',
      9: 'Serial output on.',
      10: 'The contacts only connect the pins to GND, so the pins need <b>INPUT_PULLUP</b>.',
      13: 'Remember the starting level of CLK.',
      16: '<b>loop()</b> repeats forever.',
      17: 'Read CLK now.',
      18: 'CLK changed and is now LOW: the knob just moved one step.',
      19: 'The other signal DT tells the direction: DT still HIGH → one direction.',
      20: 'DT already LOW → the other direction.',
      21: 'Print the new count.',
      23: 'Remember CLK for the next time.',
      24: 'Is the knob pressed?',
      25: 'Say so.',
      26: 'Wait a moment so one press is not reported many times.',
      28: 'A tiny pause: the sketch polls the pins many times per second.',
    },
    steps: [
      { title: 'How an encoder works', view: 'bench', have: [], power: false,
        body: `<p>A rotary encoder has two contacts, <b>CLK</b> and <b>DT</b>, that close to GND in a <b>shifted pattern</b> as you turn the knob. Counting the pattern <b>11 → 01 → 00 → 10 → 11</b> in one direction, or backwards in the other, tells you how far and which way it turned. A push switch <b>SW</b> is built in.</p>
        <p class="tip">Which direction counts up depends on the module and on how you wired CLK and DT. If it is reversed, swap the two wires or the + and − in the code.</p>` },
      { title: 'Why INPUT_PULLUP?', view: 'bench', have: [],
        body: `<p>The contacts only connect the pins to GND; when open, the pins would float. <b>INPUT_PULLUP</b> holds them HIGH. Descriptions of the KY-040 module disagree about which pins have pull-up resistors on the board, so enable the internal pull-up on all three and your sketch works either way.</p>
        <p class="warn">Connect + to <b>5V</b>.</p>` },
      { title: 'Step 1 — put the module on the breadboard', view: 'breadboard', power: false, have: ['enc1'], holes: ['g10 · CLK', 'g11 · DT', 'g12 · SW', 'g13 · VCC', 'g14 · GND'],
        body: `<p>Push the five header pins into row <b>g</b>: <b>g10 – g14</b>: CLK, DT, SW, +, GND.</p>` },
      { title: 'Step 2 — five wires', view: 'bench', have: ENC_IDS, pins: ['D2', 'D3', 'D4', '5V', 'GND2'],
        body: `<ul><li>Green: <b>pin 2 → j10</b> (CLK)</li><li>Blue: <b>pin 3 → j11</b> (DT)</li><li>Yellow: <b>pin 4 → j12</b> (SW)</li><li>Red: <b>5V → j13</b> (+)</li><li>Black: <b>GND → j14</b></li></ul>` },
      { title: 'The code', view: 'bench', have: ENC_IDS, showCode: true, power: true, body: `<p>The sketch polls CLK. When CLK has just fallen, DT tells the direction. Click lines 18, 19 and 20.</p>` },
      { title: 'Run it and turn the knob', view: 'bench', have: ENC_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Press <b>▶ turn</b> and <b>◀ turn</b> in the panel: each press is one click of the knob. The counter in the Serial Monitor goes up or down, and the CLK and DT levels change one after the other. Hold the knob button to see “Knob pressed”.</p><p class="sim">Simulated contacts without bounce. A real encoder bounces: debounce it in software.</p>` },
      { title: 'Summary', view: 'bench', have: ENC_IDS, power: true,
        body: `<ul><li>CLK and DT close to GND in a shifted pattern; the order tells the direction.</li><li>Use <code>INPUT_PULLUP</code> on CLK, DT and SW.</li><li>On a CLK falling edge, read DT: HIGH = one direction, LOW = the other.</li><li>Real contacts bounce: debounce in software.</li></ul>` },
    ],
    quiz: [
      { q: 'What tells you the direction of rotation?', a: ['The speed', 'Which of CLK and DT changes first', 'The SW pin', 'The supply voltage'], c: 1, why: 'The two signals are shifted: the one that changes first shows the direction.' },
      { q: 'Why INPUT_PULLUP on CLK, DT and SW?', a: ['To save power', 'The contacts only connect to GND: the pins would float when open', 'To measure voltage', 'It is not needed'], c: 1, why: 'The pull-up holds the pin HIGH when the contact is open.' },
      { q: 'The count goes down when you turn clockwise. What is an easy fix?', a: ['Replace the encoder', 'Swap CLK and DT (or the + and − in the code)', 'Change the resistor', 'Nothing'], c: 1, why: 'The direction convention depends on the wiring.' },
      { q: 'A real encoder counts too many steps sometimes. Why?', a: ['It is broken', 'The contacts bounce', 'The ADC is slow', 'The knob is loose'], c: 1, why: 'Mechanical contacts bounce: debounce in software.' },
    ],
    sources: [SRC.ky040, SRC.pinmode, SRC.ds],
  },

  // ================================================================== 21
  {
    id: 'u21', num: 21, module: 9, title: 'LCD 16×2: show text over I²C', level: 'Beginner', time: '20 min',
    goal: 'Print text on a 16×2 character LCD with the LiquidCrystal_I2C library, and find out why a display can stay blank.',
    hardware: ['Arduino UNO R3', 'LCD 16×2 with I²C backpack (PCF8574)', '4 × jumper wires'],
    code: U3_LCD, file: 'LCD_I2C.ino', program: 'u3_lcd', fast: true, widgets: ['lcdaddr'],
    circuit: LCD_PARTS, io: { A4: { kind: 'lcd', scl: 'A5', item: 'lcd1', needs: LCD_IDS } },
    explain: {
      1: '<b>Wire.h</b> is the I²C library of the Arduino core.',
      2: 'The LCD library: install <b>LiquidCrystal I2C</b> by Frank de Brabander from the Library Manager.',
      4: 'Create the display object: I²C <b>address 0x27</b>, <b>16</b> columns, <b>2</b> rows. A wrong address shows nothing.',
      6: '<b>setup()</b> runs once.',
      7: '<b>init()</b> starts the LCD (some library versions call it begin()).',
      8: 'Switch the <b>backlight</b> on.',
      9: 'Put the cursor at column 0 of row 0 (the top line).',
      10: 'Print the first line.',
      13: '<b>loop()</b> repeats forever.',
      14: 'Cursor to row 1 (the bottom line).',
      15: 'Print the label…',
      16: '…and the seconds since the start (<b>millis()</b> counts milliseconds).',
      17: 'Wait one second.',
    },
    steps: [
      { title: 'The LCD and its I²C backpack', view: 'dispq', have: ['lcd1'], power: false,
        body: `<p>A 16×2 LCD has <b>16 columns and 2 rows</b> of characters, each drawn from a <b>5 × 8 dot matrix</b>. The small blue board on its back, a <b>PCF8574</b> backpack, turns its many pins into <b>two I²C wires</b>. <b>Click the parts</b> in the 3D view.</p>
        <ul><li>Four pins: <b>GND, VCC, SDA, SCL</b>. The backpack is made for <b>5 V</b>.</li><li>I²C address: usually <b>0x27</b>, on some <b>0x3F</b>.</li><li>The blue trimmer sets the <b>contrast</b>.</li></ul>` },
      { title: 'Wire the four pins', view: 'dispq', have: LCD_IDS, power: false, pins: ['GND2', '5V', 'A4', 'A5'],
        body: `<ul><li>GND → <b>GND</b></li><li>VCC → <b>5V</b></li><li>SDA → <b>A4</b>, SCL → <b>A5</b></li></ul>` },
      { title: 'Install the library', view: 'dispq', have: LCD_IDS,
        body: `<p>In the Arduino IDE: <b>Sketch → Include Library → Manage Libraries…</b>, search for <b>LiquidCrystal I2C</b> (Frank de Brabander) and install it.</p>` },
      { title: 'The code', view: 'dispq', have: LCD_IDS, showCode: true, power: true, body: `<p>Click lines 4, 7, 9 and 14.</p>` },
      { title: 'Run it', view: 'dispq', have: LCD_IDS, showCode: true, power: true, action: 'run',
        body: `<p>The top line shows <b>Hello</b>, and the bottom line counts the seconds. <b>Turn the contrast trimmer</b> in real life if you only see dark blocks.</p><p class="sim">Simulated display: it shows the text the sketch prints.</p>` },
      { title: 'Blank screen? Check the address', view: 'dispq', have: LCD_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Module address”</b> to change it to <b>0x3F</b> and run again. The sketch still talks to 0x27, nobody answers, and the screen shows <b>no text</b>.</p><p>On a real board run an <b>I²C scanner</b> sketch to find the address, then use it in <code>LiquidCrystal_I2C lcd(address, 16, 2)</code>.</p>` },
      { title: 'Summary', view: 'dispq', have: LCD_IDS, power: true,
        body: `<ul><li>Backpack: GND, VCC (5 V), SDA, SCL; address 0x27 or 0x3F.</li><li><code>init()</code>, <code>backlight()</code>, <code>setCursor(col, row)</code>, <code>print()</code>.</li><li>Blank screen: wrong address, contrast, or loose wire.</li></ul>` },
    ],
    quiz: [
      { q: 'What does the PCF8574 backpack do?', a: ['Makes the LCD brighter', 'Turns the LCD pins into two I²C wires', 'Stores the text', 'Powers the Arduino'], c: 1, why: 'It is an I²C port expander.' },
      { q: 'The sketch shows nothing on the LCD but the backlight is on. What do you check first?', a: ['The USB cable length', 'The I²C address (0x27 or 0x3F) and the contrast', 'The LED', 'The baud rate'], c: 1, why: 'A wrong address or low contrast is the usual cause.' },
      { q: 'lcd.setCursor(0, 1) moves the cursor to…', a: ['The top line', 'Column 0 of the bottom line', 'Column 1 of the top line', 'The backlight'], c: 1, why: 'setCursor(column, row): row 1 is the second line.' },
      { q: 'The supply of the LCD backpack is…', a: ['3.3 V only', '5 V', '12 V', 'Not needed'], c: 1, why: 'The module is made for 5 V.' },
    ],
    sources: [SRC.lcdi2c, SRC.wire, SRC.ds],
  },

  // ================================================================== 22
  {
    id: 'u22', num: 22, module: 9, title: 'OLED 128×64: draw text with the SSD1306', level: 'Beginner', time: '20 min',
    goal: 'Show text on a small OLED with the Adafruit SSD1306 library, and handle a display that is not found.',
    hardware: ['Arduino UNO R3', 'SSD1306 OLED 128×64 (I²C)', '4 × jumper wires'],
    code: U3_OLED, file: 'OLED_SSD1306.ino', program: 'u3_oled', fast: true, widgets: ['oledaddr'],
    circuit: OLED_PARTS, io: { A4: { kind: 'oled', scl: 'A5', item: 'oled1', needs: OLED_IDS } },
    explain: {
      1: '<b>Wire.h</b>: the I²C library.',
      2: '<b>Adafruit_GFX</b>: drawing functions (text, lines, shapes) shared by many displays.',
      3: '<b>Adafruit_SSD1306</b>: the driver of the SSD1306 chip in the OLED.',
      5: 'Create the display object: <b>128 × 64</b> pixels, the <b>Wire</b> bus, <b>−1</b> = no reset pin.',
      7: '<b>setup()</b> runs once.',
      8: 'Serial output on (for error messages).',
      9: '<b>begin()</b> starts the display at I²C address <b>0x3C</b> and returns <b>false</b> if nobody answers. SWITCHCAPVCC makes the display voltage from the supply.',
      10: 'No answer → tell the user.',
      11: 'Stop here forever.',
      13: 'Empty the screen buffer.',
      14: 'Text size 1 (6 × 8 pixels per character).',
      15: 'White text (on this display: the pixel colour).',
      16: 'Cursor at the top left.',
      17: 'Print a line…',
      18: '…and a second line.',
      19: '<b>display()</b> sends the buffer to the screen. Nothing appears before this call.',
    },
    steps: [
      { title: 'The OLED', view: 'dispq', have: ['oled1'], power: false,
        body: `<p>An <b>OLED</b> makes its own light: every one of its <b>128 × 64 pixels</b> is a tiny LED, so there is no backlight. The <b>SSD1306</b> chip drives it and talks I²C. <b>Click the parts</b> in the 3D view.</p>
        <ul><li>Four pins: <b>GND, VCC, SCL, SDA</b> (the order differs between makers: read the printing).</li><li>Address <b>0x3C</b>, on some modules <b>0x3D</b>.</li><li>Check whether your module accepts 3.3 V, 5 V or both.</li></ul>` },
      { title: 'Wire the four pins', view: 'dispq', have: OLED_IDS, power: false, pins: ['GND2', '3V3', 'A5', 'A4'],
        body: `<ul><li>GND → <b>GND</b></li><li>VCC → <b>3V3</b></li><li>SCL → <b>A5</b>, SDA → <b>A4</b></li></ul>` },
      { title: 'Install the libraries', view: 'dispq', have: OLED_IDS,
        body: `<p>In the Library Manager install <b>Adafruit SSD1306</b> and <b>Adafruit GFX Library</b> (accept the other libraries it asks for).</p>` },
      { title: 'The code', view: 'dispq', have: OLED_IDS, showCode: true, power: true, body: `<p>Click lines 5, 9, 17 and 19. Note that nothing is shown until <code>display()</code>.</p>` },
      { title: 'Run it', view: 'dispq', have: OLED_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Two lines of text appear on the OLED, drawn from the dot font of the library.</p><p class="sim">Simulated display.</p>` },
      { title: 'What if the display is not found?', view: 'dispq', have: OLED_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Module address”</b> to switch it to <b>0x3D</b> and run again. <code>begin(…, 0x3C)</code> returns false and the Serial Monitor shows:</p><pre class="tree">SSD1306 not found</pre><p>Run an I²C scanner, use the address it reports, and check the four wires.</p>` },
      { title: 'Summary', view: 'dispq', have: OLED_IDS, power: true,
        body: `<ul><li><code>Adafruit_SSD1306 display(128, 64, &amp;Wire, -1)</code>, <code>display.begin(SSD1306_SWITCHCAPVCC, 0x3C)</code>.</li><li>Draw into a buffer (<code>setCursor</code>, <code>println</code>), then <code>display.display()</code>.</li><li>“not found” = wrong address or wiring.</li></ul>` },
    ],
    quiz: [
      { q: 'When does the text appear on the OLED?', a: ['At println()', 'After display.display()', 'After begin()', 'Never'], c: 1, why: 'Drawing goes into a buffer; display() sends it to the screen.' },
      { q: 'begin() returns false. What do you check?', a: ['The I²C address and the wires', 'The LED', 'The resistor colours', 'The baud rate only'], c: 0, why: 'Nobody answered at that address.' },
      { q: 'How many pixels does this OLED have?', a: ['16 × 2', '128 × 64', '8 × 8', '320 × 240'], c: 1, why: '128 columns by 64 rows.' },
      { q: 'Why has an OLED no backlight?', a: ['It is broken', 'Each pixel makes its own light', 'It uses sunlight', 'It is always off'], c: 1, why: 'OLED pixels are light-emitting.' },
    ],
    sources: [SRC.ssd1306, SRC.wire, SRC.ds],
  },

  // ================================================================== 23
  {
    id: 'u23', num: 23, module: 9, title: 'NeoPixel strip: one wire, eight colours', level: 'Intermediate', time: '25 min',
    goal: 'Light an 8-pixel NeoPixel strip with the Adafruit_NeoPixel library, and learn the power and data-level rules.',
    hardware: ['Arduino UNO R3', 'NeoPixel (WS2812B) strip, 8 pixels', '3 × jumper wires', 'Capacitor 500 – 1000 µF (recommended)'],
    code: U3_NEO, file: 'NeoPixel.ino', program: 'u3_neo', fast: true, widgets: [], neoLow: false,
    circuit: NEO_PARTS, io: { D6: { kind: 'neo', item: 'neo1', needs: NEO_IDS } },
    explain: {
      1: 'The library by Adafruit: install <b>Adafruit NeoPixel</b> from the Library Manager.',
      3: 'The data pin (<b>DIN</b> of the strip).',
      4: 'How many pixels the strip has.',
      6: 'Create the strip object: pixel count, pin, <b>NEO_GRB</b> (the colour order of the WS2812B) and <b>NEO_KHZ800</b> (the 800 kHz data speed).',
      8: '<b>setup()</b> runs once.',
      9: 'Start the strip.',
      10: '<b>setBrightness</b> scales every colour: 40 of 255 keeps the current low.',
      11: '<b>show()</b> sends the colours to the pixels: nothing changes on the strip before show().',
      14: '<b>loop()</b> repeats forever.',
      15: 'Go through the pixels 0 … 7.',
      16: 'Clear the colours in memory.',
      17: 'Set pixel <b>i</b> to red: <b>Color(red, green, blue)</b>, each 0 … 255.',
      18: 'Send everything to the strip.',
      19: 'Wait 150 ms: the red dot moves on.',
    },
    steps: [
      { title: 'An addressable LED strip', view: 'dispq', have: ['neo1'], power: false,
        body: `<p>On a <b>NeoPixel</b> (WS2812B) strip every pixel has its own driver chip. The <b>data line</b> carries one colour value for each pixel in turn, so <b>one pin controls the whole strip</b>. <b>Click the parts</b> in the 3D view.</p>
        <ul><li>Three connections: <b>5 V</b>, <b>DIN</b> (data in) and <b>GND</b>.</li><li>Up to <b>60 mA per pixel</b> at full white; about 20 mA per pixel in typical use (Adafruit).</li></ul>` },
      { title: 'Power rules', view: 'dispq', have: ['neo1'],
        body: `<ul><li>Eight pixels at full white can draw <b>480 mA</b>: more than a USB port should be asked for. Keep the <b>brightness low</b> (the sketch uses 40).</li><li>Connect <b>GND first</b> when powering from a bench supply, and add a <b>500 – 1000 µF capacitor</b> across + and − (Adafruit).</li><li>The pixels want about <b>5 V</b>: lower voltages dim them and then give wrong colours; much higher voltages destroy them.</li></ul>` },
      { title: 'Wire the strip', view: 'dispq', have: NEO_IDS, power: false, pins: ['5V', 'D6', 'GND2'],
        body: `<ul><li>Red lead: strip <b>VCC → 5V</b></li><li>Yellow lead: strip <b>DIN → pin 6</b></li><li>Black lead: strip <b>GND → GND</b></li></ul>` },
      { title: 'Install the library', view: 'dispq', have: NEO_IDS,
        body: `<p>Library Manager → <b>Adafruit NeoPixel</b> → Install.</p>` },
      { title: 'The code', view: 'dispq', have: NEO_IDS, showCode: true, power: true, body: `<p>Click lines 6, 10, 17 and 18. Note that nothing happens on the strip until <code>show()</code>.</p>` },
      { title: 'Run it', view: 'dispq', have: NEO_IDS, showCode: true, power: true, action: 'run', body: `<p>A <b>red dot</b> runs along the 8 pixels, 150 ms per step. The brightness is only 40 of 255.</p><p class="sim">Simulated strip: the colours follow the sketch.</p>` },
      { title: 'Summary', view: 'dispq', have: NEO_IDS, power: true,
        body: `<ul><li>5 V, DIN, GND; one data pin for all pixels.</li><li><code>Adafruit_NeoPixel strip(n, pin, NEO_GRB + NEO_KHZ800)</code>, <code>begin()</code>, <code>setPixelColor()</code>, <code>show()</code>.</li><li>Up to 60 mA per pixel: keep the brightness low.</li><li>Data signal at least 70 % of the strip voltage (Adafruit).</li></ul>` },
    ],
    quiz: [
      { q: 'When do the pixels change after setPixelColor()?', a: ['At once', 'After strip.show()', 'After begin()', 'Never'], c: 1, why: 'The colours are kept in memory until show() sends them.' },
      { q: 'How much current can one NeoPixel draw at full white?', a: ['About 1 mA', 'Up to 60 mA', 'About 1 A', 'Exactly 20 mA always'], c: 1, why: 'Adafruit: up to 60 mA with red, green and blue at maximum.' },
      { q: 'The data signal of a 5 V strip should be at least…', a: ['1 V', '70 % of the strip voltage (3.5 V)', '5 V exactly', '12 V'], c: 1, why: 'Adafruit recommends at least 70 % of the pixel voltage.' },
      { q: 'Why keep the brightness low?', a: ['To save the library', 'To limit the current drawn from the supply', 'The strip would melt at once', 'No reason'], c: 1, why: 'The pixels draw current in proportion to their colour and brightness.' },
    ],
    sources: [SRC.neouber, SRC.neolib, SRC.ds],
  },

  // ================================================================== 24
  {
    id: 'u24', num: 24, module: 10, title: 'A transistor switches a lamp', level: 'Intermediate', time: '25 min',
    goal: 'Let a small pin current switch a much bigger load with an NPN transistor, and choose the base resistor.',
    hardware: ['Arduino UNO R3', 'PN2222A NPN transistor (TO-92)', 'Resistor (1 kΩ)', 'Battery holder 4 × AA (about 6 V) and a 6 V lamp', 'Breadboard and jumper wires'],
    code: U3_QSW, file: 'TransistorSwitch.ino', program: 'u3_qsw', fast: true, widgets: ['qbase'], qdefault: 1000,
    circuit: Q_PARTS, io: { D5: { kind: 'npn', item: 'q1', lamp: 'lamp1', needs: Q_IDS } },
    explain: {
      2: 'The pin is wired to the <b>base resistor</b>, which leads to the transistor’s <b>base</b>. The lamp is <b>not</b> connected to the pin.',
      4: '<b>setup()</b> runs once.',
      5: 'The pin is an output.',
      8: '<b>loop()</b> repeats forever.',
      9: 'HIGH: a small current flows through the base resistor into the base. The transistor then lets a much larger current flow from the collector to the emitter: <b>the lamp lights</b>.',
      10: 'Wait one second.',
      11: 'LOW: no base current, the transistor blocks, the lamp is off.',
      12: 'Wait one second.',
    },
    steps: [
      { title: 'Why a transistor?', view: 'farq', have: [], power: false,
        body: `<p>A 6 V lamp needs about <b>300 mA</b>. The ATmega328P datasheet allows 40 mA absolute maximum per pin (20 mA recommended). So a pin <b>cannot</b> drive the lamp directly. A <b>transistor</b> is a small electronic switch: a <b>small current into its base</b> lets a <b>big current flow</b> from the collector to the emitter.</p>
        <p class="warn">Never connect a lamp, motor or relay coil straight to a pin.</p>` },
      { title: 'The PN2222A', view: 'bigq', have: ['q1'], power: false, holes: ['e10 · emitter', 'e11 · base', 'e12 · collector'],
        body: `<p>The <b>PN2222A</b> in a TO-92 case. With the <b>flat side facing you</b>, the pins from the left are <b>1 emitter, 2 base, 3 collector</b>. <b>Click it</b> in the 3D view.</p>
        <ul><li>Continuous collector current <b>600 mA</b> (onsemi datasheet).</li><li>Saturation voltage <b>0.3 V</b> at 150 mA collector current with 15 mA of base current.</li></ul>
        <p class="warn">Other versions (for example the P2N2222A) have the pins in another order: <b>collector, base, emitter</b>. Always check the datasheet of your part.</p>` },
      { title: 'The base resistor', view: 'bigq', have: ['q1', 'r1'], power: false, holes: ['a11 → a15'],
        body: `<p>The base-emitter junction is a diode: without a resistor the pin would push far too much current into it. The resistor sets the <b>base current</b>: I = (V<sub>pin</sub> − 0.7 V) ÷ R.</p>
        <p>For a hard switch the datasheet’s saturation figure uses a base current of <b>one tenth</b> of the collector current. For 300 mA that would be 30 mA, more than a pin should give, so this lesson uses a smaller base current: the lamp still lights, and the transistor drops a little more than 0.3 V.</p>` },
      { title: 'Wire it', view: 'farq', have: Q_IDS, power: false, pins: ['D5', 'GND2'],
        body: `<ul><li>Yellow: <b>pin 5 → b15</b> (to the base resistor)</li><li>Black: <b>GND → b10</b> (the emitter column)</li></ul>
        <p>The lamp circuit is separate: battery + → lamp → <b>collector</b> (column 12); battery − → the <b>emitter column</b> (column 10), which is also connected to the board’s GND. All the grounds must be joined.</p>` },
      { title: 'The code', view: 'farq', have: Q_IDS, showCode: true, power: true, body: `<p>Just a blink: the pin drives the base. Click lines 9 and 11.</p>` },
      { title: 'Run it and change the base resistor', view: 'farq', have: Q_IDS, showCode: true, power: true, action: 'run',
        body: `<p>The lamp blinks. In the panel choose another <b>base resistor</b> and watch the numbers: with a small resistor the transistor is <b>saturated</b> (fully on); with <b>100 kΩ</b> only a trickle flows into the base and the lamp gets little or no current.</p><p class="sim">Simplified model: collector current = about 100 × base current, up to what the lamp draws.</p>` },
      { title: 'Summary', view: 'farq', have: Q_IDS, power: true,
        body: `<ul><li>A pin drives the <b>base</b> through a resistor; the load goes between the supply and the <b>collector</b>; the <b>emitter</b> goes to GND (low-side switch).</li><li>All grounds joined.</li><li>PN2222A: E, B, C with the flat side toward you; 600 mA continuous.</li><li>Inductive loads (motors, relays) need a flyback diode.</li></ul>` },
    ],
    quiz: [
      { q: 'Why not connect the lamp directly to the pin?', a: ['The lamp is too bright', 'The lamp needs far more current than a pin can give', 'Pins are always LOW', 'Lamps need AC'], c: 1, why: 'A pin supplies only a few tens of mA at most.' },
      { q: 'Which leg of the PN2222A (flat side toward you) is the base?', a: ['The left one', 'The middle one', 'The right one', 'None'], c: 1, why: 'Emitter, base, collector from the left.' },
      { q: 'What does the base resistor do?', a: ['Dims the lamp directly', 'Limits the current into the base', 'Cools the transistor', 'Nothing'], c: 1, why: 'The base-emitter junction is a diode: it needs current limiting.' },
      { q: 'The base resistor is 100 kΩ. What happens?', a: ['The lamp is brighter', 'Too little base current: the lamp stays dark or dim', 'The pin burns', 'Nothing changes'], c: 1, why: 'Collector current is only about 100 times the small base current.' },
    ],
    sources: [SRC.pn2222, SRC.ds, SRC.pinmode],
  },

  // ================================================================== 25
  {
    id: 'u25', num: 25, module: 10, title: 'A MOSFET switches a lamp', level: 'Intermediate', time: '25 min',
    goal: 'Switch a bigger load with a logic-level MOSFET: the gate takes a voltage, not a current.',
    hardware: ['Arduino UNO R3', 'IRLZ44N MOSFET (TO-220)', 'Resistors (220 Ω and 10 kΩ)', 'Battery holder 4 × AA (about 6 V) and a 6 V lamp', 'Breadboard and jumper wires'],
    code: U3_MOSW, file: 'MosfetSwitch.ino', program: 'u3_qsw', fast: true, widgets: ['mosload'],
    circuit: M_PARTS, io: { D5: { kind: 'mosfet', item: 'q1', lamp: 'lamp1', needs: M_IDS } },
    explain: {
      2: 'The pin is wired through the <b>gate resistor</b> to the <b>gate</b> of the MOSFET. The lamp is <b>not</b> connected to the pin.',
      4: '<b>setup()</b> runs once.',
      5: 'The pin is an output.',
      8: '<b>loop()</b> repeats forever.',
      9: 'HIGH: the gate gets 5 V. The MOSFET turns on and the lamp current flows from the drain to the source: <b>the lamp lights</b>. The gate takes no steady current.',
      10: 'Wait one second.',
      11: 'LOW: the gate goes to 0 V (the 10 kΩ resistor also holds it there). The MOSFET turns off, the lamp is off.',
      12: 'Wait one second.',
    },
    steps: [
      { title: 'A switch controlled by voltage', view: 'farq', have: [], power: false,
        body: `<p>A 6 V lamp needs about <b>300 mA</b>. The ATmega328P datasheet allows 40 mA absolute maximum per pin (20 mA recommended). A pin cannot drive it. Last lesson the PN2222A needed a <b>base current</b>. A <b>MOSFET</b> is controlled by the <b>voltage on its gate</b>: the gate takes no steady current, so no base-current calculation is needed.</p>
        <p class="warn">Never connect a lamp, motor or relay coil straight to a pin.</p>` },
      { title: 'The IRLZ44N', view: 'bigq', have: ['q1'], power: false, holes: ['e10 · gate', 'e11 · drain', 'e12 · source'],
        body: `<p>The <b>IRLZ44N</b> in a TO-220 case. With the <b>text facing you</b>, the pins from the left are <b>gate, drain, source</b>. The metal tab is the drain. <b>Click it</b> in the 3D view.</p>
        <ul><li>Maximum <b>55 V</b> between drain and source, <b>47 A</b> continuous (Infineon datasheet).</li><li>Gate threshold <b>1.0 to 2.0 V</b>. The gate must never exceed <b>±16 V</b>.</li><li>It is a <b>logic-level</b> type: on-resistance <b>35 mΩ at 4 V</b>, <b>25 mΩ at 5 V</b> and <b>22 mΩ at 10 V</b> on the gate.</li></ul>
        <p class="warn">The datasheet gives no on-resistance below 4 V. The UNO R3 pin gives <b>5 V</b>: the datasheet guarantees 25 mΩ at 5 V.</p>` },
      { title: 'Gate resistor and pull-down', view: 'bigq', have: ['q1', 'r1', 'r2'], power: false, holes: ['a5 → a10', 'd10 → d12'],
        body: `<p>The <b>220 Ω resistor</b> between the pin and the gate limits the short current that charges the gate when the pin switches. The <b>10 kΩ resistor</b> from the gate to GND holds the gate at 0 V while the pin is not yet an output (for example during start-up). A floating gate can switch the load by itself.</p>` },
      { title: 'Wire it', view: 'farq', have: M_IDS, power: false, pins: ['D5', 'GND2'],
        body: `<ul><li>Yellow: <b>pin 5 → b5</b> (to the 220 Ω gate resistor)</li><li>Black: <b>GND → b12</b> (the source column)</li></ul>
        <p>The lamp circuit is separate: battery + → lamp → <b>drain</b> (column 11); battery − → the <b>source column</b> (column 12), which is also connected to the board’s GND. All the grounds must be joined.</p>` },
      { title: 'The code', view: 'farq', have: M_IDS, showCode: true, power: true, body: `<p>Just a blink: the pin drives the gate. Click lines 9 and 11.</p>` },
      { title: 'Run it and choose the load', view: 'farq', have: M_IDS, showCode: true, power: true, action: 'run',
        body: `<p>The lamp blinks. In the panel choose a <b>lamp (about 300 mA)</b> or a <b>motor (about 1 A)</b> and read the numbers: the MOSFET drops only a few millivolts and stays almost cold, far better than the PN2222A, which is limited to 600 mA.</p><p class="sim">Simplified model: drain-source resistance from the datasheet values (between 4 V and 10 V interpolated; below 4 V an estimate).</p>` },
      { title: 'Summary', view: 'farq', have: M_IDS, power: true,
        body: `<ul><li>Gate = a <b>voltage</b> input: no base current. Source to GND, load between the supply and the <b>drain</b> (low-side switch).</li><li>Use a gate resistor (about 220 Ω) and a 10 kΩ pull-down.</li><li>Logic-level: its on-resistance is guaranteed from 4 V up; 3.3 V pins need care for big loads.</li><li>A motor or relay coil still needs a flyback diode.</li></ul>` },
    ],
    quiz: [
      { q: 'What controls a MOSFET?', a: ['A current into the gate', 'A voltage on the gate', 'Heat', 'Light'], c: 1, why: 'The gate takes no steady current: the voltage on it controls the channel.' },
      { q: 'Which leg of the IRLZ44N (text toward you) is the gate?', a: ['The left one', 'The middle one', 'The right one', 'The metal tab'], c: 0, why: 'Gate, drain, source from the left. The tab is the drain.' },
      { q: 'Why add a 10 kΩ resistor from the gate to GND?', a: ['To make it brighter', 'To keep the gate at 0 V so the load stays off at start-up', 'To cool the MOSFET', 'It is not needed ever'], c: 1, why: 'A floating gate can switch by itself.' },
      { q: 'The datasheet gives the on-resistance for which gate voltages?', a: ['Only 3.3 V', '4 V, 5 V and 10 V', 'Only 1 V', 'All voltages from 0 V'], c: 1, why: '35 mΩ at 4 V, 25 mΩ at 5 V, 22 mΩ at 10 V.' },
    ],
    sources: [SRC.irlz44n, SRC.ds, SRC.pinmode],
  },

  // ================================================================== 26
  {
    id: 'u26', num: 26, module: 10, title: 'A diode: current flows one way', level: 'Beginner', time: '15 min',
    goal: 'See that a diode lets current through in one direction only, and read its band.',
    hardware: ['Arduino UNO R3', '2 × diode 1N4007', '2 × 5 mm red LED', '2 × 220 Ω resistor', 'Breadboard and jumper wires'],
    code: U3_DIODE, file: 'DiodeDemo.ino', program: 'extled', fast: true,
    circuit: D_PARTS, io: { D5: { kind: 'led', item: 'led1', diode: 'd1', rev: { r: 'r2', diode: 'd2', led: 'led2' }, needs: D_IDS } },
    explain: {
      2: 'One pin feeds <b>both</b> branches through a resistor each.',
      4: '<b>setup()</b> runs once.',
      5: 'The pin is an output.',
      8: '<b>loop()</b> repeats forever.',
      9: 'HIGH (5 V): in the first branch the current goes through the diode in its <b>forward</b> direction and the LED lights. In the second branch the diode is turned round and <b>blocks</b>: that LED stays dark.',
      10: 'Wait one second.',
      11: 'LOW: no current anywhere.',
      12: 'Wait one second.',
    },
    steps: [
      { title: 'A one-way valve for current', view: 'bbwide', have: [], power: false,
        body: `<p>A <b>diode</b> lets current flow in <b>one direction only</b>, like a one-way valve. It has two legs: the <b>anode</b> (+) and the <b>cathode</b> (−). Current flows from the anode to the cathode, not the other way.</p>` },
      { title: 'The 1N4007', view: 'bigq', have: ['d1'], power: false,
        body: `<p>The <b>1N4007</b> is a common power diode. The <b>silver band</b> marks the <b>cathode</b>. <b>Click it</b> in the 3D view.</p>
        <ul><li>Average forward current <b>1 A</b>; forward voltage <b>1.1 V at 1 A</b> (Vishay datasheet).</li><li>It blocks up to <b>1000 V</b> in the reverse direction.</li></ul>
        <p>Part of the voltage supply is lost in a forward-biased diode (a little under a volt at small currents).</p>` },
      { title: 'Two branches, one turned round', view: 'bbwide', have: ['r1', 'd1', 'led1', 'r2', 'd2', 'led2'], power: false,
        body: `<p>Both branches are the same: resistor, diode, LED. In the <b>first</b> branch the band is on the <b>LED side</b> (anode toward the pin): current can flow. In the <b>second</b> branch the diode is <b>turned round</b> (band toward the resistor): it blocks.</p>` },
      { title: 'Wire it', view: 'bbwide', have: D_IDS, power: false, pins: ['D5', 'GND2'],
        body: `<ul><li>Yellow: <b>pin 5 → a10</b></li><li>Orange: <b>b10 → b21</b> (feeds the second branch)</li><li>Black: <b>GND → a18</b>, and a black link <b>b18 → b29</b> joins the two LED cathodes</li></ul>
        <p>Each resistor (220 Ω) limits the current of its LED.</p>` },
      { title: 'The code', view: 'bbwide', have: D_IDS, showCode: true, power: true, body: `<p>Just a blink on one pin. Click lines 9 and 11.</p>` },
      { title: 'Run it', view: 'bbwide', have: D_IDS, showCode: true, power: true, action: 'run',
        body: `<p>When the pin is HIGH, only the <b>first LED</b> lights. The second one stays dark: its diode points the wrong way. Same parts, same wiring, only the diode is turned round.</p>` },
      { title: 'Summary', view: 'bbwide', have: D_IDS, power: true,
        body: `<ul><li>Current flows from the <b>anode</b> to the <b>cathode</b> (the end with the band).</li><li>A turned-round diode blocks.</li><li>Diodes protect circuits: wrong polarity, and a <b>flyback diode</b> across a motor or relay coil.</li><li>1N4007: 1 A, 1.1 V at 1 A, 1000 V reverse.</li></ul>` },
    ],
    quiz: [
      { q: 'Which end of a 1N4007 is the cathode?', a: ['The end without a mark', 'The end with the silver band', 'The longer leg', 'Either'], c: 1, why: 'The band marks the cathode.' },
      { q: 'The diode is turned round in a series circuit. What happens?', a: ['It conducts more', 'It blocks the current', 'It burns', 'Nothing'], c: 1, why: 'A reverse-biased diode blocks.' },
      { q: 'Current flows through a diode from…', a: ['cathode to anode', 'anode to cathode', 'either way', 'neither way'], c: 1, why: 'Forward direction is anode to cathode.' },
    ],
    sources: [SRC.d1n4007, SRC.ds, SRC.pinmode],
  },

  // ================================================================== 27
  {
    id: 'u27', num: 27, module: 11, title: 'Blink without delay(): millis()', level: 'Intermediate', time: '20 min',
    goal: 'Keep a program responsive: do two things at once by checking the clock instead of waiting with delay().',
    hardware: ['Arduino UNO R3', 'LED circuit and push button from Lesson 5', 'Breadboard and jumper wires'],
    code: U3_MILLIS, file: 'BlinkWithoutDelay.ino', program: 'u3_millis', fast: true, widgets: ['button'],
    circuit: [...LED_CIRCUIT, ...BUTTON_PARTS], io: { D5: IO_LED, D4: { kind: 'button', item: 'btn1', needs: BUTTON_IDS } },
    explain: {
      2: 'The LED from the earlier lessons (pin 5).',
      3: 'The push button (pin 4).',
      4: 'A variable that remembers <b>when</b> the LED last changed. <b>unsigned long</b> because millis() returns an unsigned long.',
      5: 'How long to wait between changes: 1000 ms.',
      6: 'The current LED state, HIGH or LOW.',
      7: 'The previous button reading, to notice the moment it changes.',
      10: 'The LED pin is an output.',
      11: 'The button pin uses the internal pull-up: pressed reads LOW.',
      12: 'Serial output on.',
      16: '<b>millis()</b> returns the number of milliseconds since the program started. It does not stop the program.',
      17: 'Has one interval passed since the last change? If not, <b>skip the block and carry on</b>: loop() runs again at once.',
      18: 'Remember this moment as the last change.',
      19: 'Toggle the stored state.',
      20: 'Write it to the LED.',
      23: 'Read the button <b>every time</b> loop() runs.',
      24: 'LOW now and HIGH before = the button was <b>just pressed</b>.',
      25: 'Report it at once: with delay(1000) this could take up to a second.',
      27: 'Remember this reading for the next pass.',
    },
    steps: [
      { title: 'The problem with delay()', view: 'bench', have: [], power: false,
        body: `<p>In the button lesson the sketch used <code>delay()</code>: during a delay the board <b>does nothing else</b>. A button pressed in that time is not noticed. To blink an LED <b>and</b> watch a button, the program must never wait.</p>` },
      { title: 'The idea: look at the clock', view: 'bench', have: [], power: false,
        body: `<p><code>millis()</code> returns the time since the program started. Instead of sleeping for 1000 ms, keep the time of the last change and ask each pass of <code>loop()</code>: <b>has 1000 ms passed?</b> If yes, toggle the LED; if not, carry on and read the button.</p>` },
      { title: 'Use the circuit from the button lesson', view: 'bench', have: [...LED_IDS, ...BUTTON_IDS], power: false, pins: ['D5', 'D4'],
        body: `<p>The LED on pin 5 and the push button on pin 4 are wired as before. Nothing new to wire.</p>` },
      { title: 'The code', view: 'bench', have: [...LED_IDS, ...BUTTON_IDS], showCode: true, power: true,
        body: `<p>Click lines <b>16 and 17</b>: the heart of the technique. The only variable that matters is <code>previousMillis</code>.</p>` },
      { title: 'Run it and press the button', view: 'bench', have: [...LED_IDS, ...BUTTON_IDS], showCode: true, power: true, action: 'run',
        body: `<p>The LED blinks every second. Now <b>press and hold the button</b> (in the 3D view or with “Hold to press”): the Serial Monitor shows the message <b>at once</b>, even in the middle of a blink interval. With <code>delay()</code> the press could wait up to a second.</p><p class="sim">The simulator runs loop() about 100 times per second; a real board runs it much faster.</p>` },
      { title: 'Summary', view: 'bench', have: [...LED_IDS, ...BUTTON_IDS], power: true,
        body: `<ul><li><code>delay()</code> blocks everything; <code>millis()</code> does not.</li><li>Pattern: <code>if (millis() - previous &gt;= interval) { previous = millis(); … }</code></li><li>Remember the last state to detect a change (the button press).</li></ul>` },
    ],
    quiz: [
      { q: 'What does millis() return?', a: ['The pin number', 'Milliseconds since the program started', 'The current time of day', 'The LED state'], c: 1, why: 'It counts the time since the program started.' },
      { q: 'Why is delay() a problem when you also read a button?', a: ['It uses too much power', 'The board does nothing else during the delay', 'It only works once', 'It needs a pull-up'], c: 1, why: 'The sketch cannot read the button while it waits.' },
      { q: 'What does the variable previousMillis store?', a: ['The pin of the LED', 'The time of the last LED change', 'The button reading', 'The interval'], c: 1, why: 'It lets the sketch compute how long ago the last change was.' },
    ],
    sources: [SRC.millis, SRC.bwd, SRC.ds],
  },

  // ================================================================== 28
  {
    id: 'u28', num: 28, module: 12, title: 'I²C scanner: two devices, one bus', level: 'Intermediate', time: '20 min',
    goal: 'Put two I²C devices on the same two wires and find their addresses with a scanner sketch.',
    hardware: ['Arduino UNO R3', 'LCD 16×2 with I²C backpack', 'OLED 128×64 (SSD1306, I²C)', '8 × female jumper wires'],
    code: U3_SCAN, file: 'I2CScanner.ino', program: 'u3_i2cscan', fast: true,
    circuit: SCAN_PARTS, io: { A4: { kind: 'lcd', scl: 'A5', item: 'lcd1', needs: SCAN_IDS }, SDA: { kind: 'oled', scl: 'SCL', item: 'oled1', needs: SCAN_IDS } },
    explain: {
      2: '<b>Wire.h</b> is the I²C library of the Arduino core.',
      5: '<b>Wire.begin()</b> starts the UNO R3 as the I²C <b>controller</b> on pins A4 (SDA) and A5 (SCL).',
      6: 'Serial output on.',
      7: 'A first message.',
      8: 'A counter for the devices found.',
      9: 'Try every 7-bit address from 1 to 126.',
      10: 'Begin a transmission to this address.',
      11: '<b>endTransmission()</b> sends it and returns <b>0 if a device answered</b> (acknowledged), another number if not.',
      12: 'Answered: there is a device here.',
      13: 'Print the address in hexadecimal…',
      14: '…with <b>HEX</b>: for example 27 or 3C.',
      15: 'Count it.',
      18: 'The scan is done.',
      19: 'How many devices answered.',
      20: 'The unit.',
      23: '<b>loop()</b> stays empty: the scan runs once.',
    },
    steps: [
      { title: 'Many devices, two wires', view: 'scanv', have: [], power: false,
        body: `<p>I²C uses just <b>two wires</b>, SDA (data) and SCL (clock). Many devices can share them, because <b>each device has its own address</b>. If you do not know the address of a device (or the display stays blank), a <b>scanner</b> sketch asks every address and prints the ones that answer.</p>` },
      { title: 'Two devices on one bus', view: 'scanv', have: SCAN_IDS, power: false,
        body: `<p>The <b>LCD backpack</b> (PCF8574) usually answers at <b>0x27</b> (0x3F on some boards) and the <b>OLED</b> (SSD1306) at <b>0x3C</b> (0x3D on some). Different addresses: no conflict. Two devices with the <b>same</b> address on one bus would collide.</p>` },
      { title: 'Wire it', view: 'scanv', have: SCAN_IDS, power: false, pins: ['A4', 'A5', 'SDA', 'SCL', '5V', '3V3', 'GND2', 'GND1'],
        body: `<ul><li>LCD: <b>GND → GND</b>, <b>VCC → 5V</b>, <b>SDA → A4</b>, <b>SCL → A5</b></li><li>OLED: <b>GND → GND</b>, <b>VCC → 3V3</b>, <b>SDA → SDA</b>, <b>SCL → SCL</b> (the two sockets next to AREF)</li></ul>
        <p>On the UNO R3 the <b>SDA and SCL sockets next to AREF are the same signals as A4 and A5</b> (the same pins repeated), so both devices share one bus.</p>` },
      { title: 'The code', view: 'scanv', have: SCAN_IDS, showCode: true, power: true,
        body: `<p>Click lines <b>10 and 11</b>: the whole trick. A device that answers returns 0.</p>` },
      { title: 'Run the scanner', view: 'scanv', have: SCAN_IDS, showCode: true, power: true, action: 'run',
        body: `<p>The Serial Monitor lists <b>0x27</b> and <b>0x3C</b> and ends with <b>Done: 2 device(s)</b>. Now you know the address to put into your display sketch.</p>` },
      { title: 'Summary', view: 'scanv', have: SCAN_IDS, power: true,
        body: `<ul><li>Devices on one I²C bus are told apart by their <b>7-bit address</b>.</li><li><code>Wire.endTransmission()</code> returns 0 when a device answers.</li><li>If a device is missing from the list: check power, SDA/SCL (not swapped), and the address jumpers.</li></ul>` },
    ],
    quiz: [
      { q: 'How many wires does an I²C bus use for data and clock?', a: ['One', 'Two', 'Four', 'Eight'], c: 1, why: 'SDA and SCL.' },
      { q: 'How does a scanner find a device?', a: ['It reads a label', 'It tries each address and sees which one answers', 'It measures current', 'It restarts the board'], c: 1, why: 'endTransmission() returns 0 when a device acknowledges.' },
      { q: 'Two devices have the same address. What happens?', a: ['Nothing', 'They collide on the bus', 'The faster one wins always', 'Wire.h fixes it'], c: 1, why: 'Each device on a bus needs its own address.' },
    ],
    sources: [SRC.wirelib, SRC.wire, SRC.ds],
  },

  // ================================================================== 29
  {
    id: 'u29', num: 29, module: 7, title: 'DS18B20: a digital thermometer on one wire', level: 'Intermediate', time: '25 min',
    goal: 'Wire a DS18B20 with its 4.7 kΩ pull-up and read the temperature with the OneWire and DallasTemperature libraries.',
    hardware: ['Arduino UNO R3', 'Breadboard', 'DS18B20 temperature sensor (TO-92, 3 legs)', '4.7 kΩ resistor', '3 × jumper wires', '1 × jumper wire'],
    code: U3_DS18, file: 'DS18B20_read.ino', program: 'u3_ds18', fast: true, widgets: ['pisens', 'nohum'], sdaWire: 'w71', dht: true, wn: 'DQ',
    circuit: DS_PARTS, io: { D2: { kind: 'ds18b20', item: 'ds1', needs: DS_IDS } },
    explain: {
      1: '<b>OneWire</b> (by Paul Stoffregen): talks the 1-Wire protocol on a pin. Install it from the Library Manager.',
      2: '<b>DallasTemperature</b> (by Miles Burton): reads the DS18B20 on top of OneWire. Install it too.',
      4: 'The DQ wire is on <b>pin 2</b>.',
      6: 'A 1-Wire bus on that pin.',
      7: 'The sensor library, using that bus. It can handle many sensors on one wire.',
      10: 'Serial output on.',
      11: 'Start the library: it searches the bus for sensors.',
      15: '<b>requestTemperatures()</b> tells every sensor to measure. At 12-bit resolution this takes up to <b>750 ms</b> and the call waits for it.',
      16: '<b>getTempCByIndex(0)</b> returns the temperature of the first sensor found, in °C.',
      17: 'If no sensor answers, the library returns <b>-127</b> (<code>DEVICE_DISCONNECTED_C</code>).',
      18: 'Tell the user: check the three wires and the pull-up resistor.',
      20: 'Print the label…',
      21: '…the temperature (two decimals)…',
      22: '…and the unit.',
    },
    steps: [
      { title: 'The DS18B20', view: 'breadboard', have: ['ds1'], power: false, holes: ['e10 · GND', 'e11 · DQ', 'e12 · VDD'],
        body: `<p>The <b>DS18B20</b> is a <b>digital</b> thermometer in a small TO-92 case: it measures the temperature itself and sends it as a number on <b>one data wire</b>. With the <b>flat face (the text) toward you</b>, the legs from the left are <b>GND, DQ, VDD</b>. <b>Click it</b> in the 3D view.</p>
        <ul><li>Supply <b>3.0 V to 5.5 V</b>.</li><li>Range <b>−55 °C to +125 °C</b>, accurate to <b>±0.5 °C</b> from −10 °C to +85 °C (Maxim datasheet).</li><li>Resolution 9 to 12 bits; at 12 bits one measurement takes up to <b>750 ms</b>.</li></ul>
        <p class="tip">No analog pin is needed: the sensor sends a number, not a voltage.</p>` },
      { title: 'The pull-up resistor', view: 'bench', have: [],
        body: `<p>The DQ line is <b>open-drain</b>: the sensor can pull it <b>low</b> but not high. A <b>pull-up resistor</b> between DQ and VDD holds it high. The datasheet says about <b>5 kΩ</b>; <b>4.7 kΩ</b> is the usual value. Without it the line never goes high and no reading arrives.</p>` },
      { title: 'Step 1 — the sensor and the resistor', view: 'breadboard', have: ['ds1', 'r70', 'w73'], power: false, holes: ['c11 · resistor', 'c14 · resistor'],
        body: `<p>Push the sensor into <b>e10 – e12</b>, flat face toward you. The <b>4.7 kΩ resistor</b> goes from <b>c11</b> (DQ column) to <b>c14</b>; a jumper from <b>b12</b> (VDD column) to <b>b14</b> joins the other end of the resistor to VDD.</p>` },
      { title: 'Step 2 — power, data and ground', view: 'bench', have: DS_IDS, pins: ['5V', 'D2', 'GND3'],
        body: `<ul><li>Black: <b>GND → a10</b> (GND leg)</li><li>Yellow: <b>pin 2 → a11</b> (DQ leg)</li><li>Red: <b>5V → a12</b> (VDD leg)</li></ul><p>The sensor works from 5 V here (3.0 V to 5.5 V).</p>` },
      { title: 'Install the libraries', view: 'bench', have: DS_IDS,
        body: `<p>In the Arduino IDE: <b>Sketch → Include Library → Manage Libraries…</b>, install <b>OneWire</b> (Paul Stoffregen) and <b>DallasTemperature</b> (Miles Burton).</p>` },
      { title: 'The code', view: 'bench', have: DS_IDS, showCode: true, power: true, body: `<p>Click lines <b>15</b>, <b>16</b> and <b>17</b>.</p>` },
      { title: 'Run it and change the temperature', view: 'bench', have: DS_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Once a second the Serial Monitor prints the temperature. <b>Move the temperature slider</b> and watch the numbers follow: the values move in steps of 0.0625 °C (12-bit resolution).</p><p class="sim">Simulated values.</p>` },
      { title: 'What if the data wire is loose?', view: 'bench', have: DS_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Unplug the DQ wire”</b> and run again. No sensor answers and the Serial Monitor shows <code>Sensor not found!</code> (the library returned −127).</p>` },
      { title: 'Summary', view: 'bench', have: DS_IDS, power: true,
        body: `<ul><li>DS18B20: legs GND, DQ, VDD (flat face toward you); 3.0 V to 5.5 V.</li><li>DQ needs a <b>4.7 kΩ pull-up</b> to VDD.</li><li><code>requestTemperatures()</code> then <code>getTempCByIndex(0)</code>; −127 means no sensor.</li></ul>` },
    ],
    quiz: [
      { q: 'What is the pull-up resistor for?', a: ['To cool the sensor', 'To hold the open-drain DQ line high', 'To measure the temperature', 'To limit the LED current'], c: 1, why: 'The sensor can only pull DQ low.' },
      { q: 'getTempCByIndex(0) returns -127. What happened?', a: ['It is -127 °C', 'No sensor answered', 'The sensor is too hot', 'The baud rate is wrong'], c: 1, why: '-127 is DEVICE_DISCONNECTED_C.' },
      { q: 'Which leg is DQ (flat face toward you)?', a: ['Left', 'Middle', 'Right', 'None'], c: 1, why: 'GND, DQ, VDD from the left.' },
    ],
    sources: [SRC.ds18, SRC.dallas, SRC.ds],
  },

  // ================================================================== 30
  {
    id: 'u30', num: 30, module: 7, title: 'IR remote control: decode the buttons', level: 'Intermediate', time: '25 min',
    goal: 'Receive the code of an infrared remote with a 38 kHz receiver and the IRremote library, and switch an LED with the Power button.',
    hardware: ['Arduino UNO R3', 'The LED circuit of Lesson 4', '38 kHz IR receiver (TSOP382-type, 3 legs)', 'An IR remote control (simulated here)', '3 × jumper wires'],
    code: U3_IR, file: 'IR_remote.ino', program: 'u3_ir', fast: true, widgets: ['irremote'],
    circuit: [...LED_CIRCUIT, ...IR_PARTS], io: { D5: IO_LED, D2: { kind: 'irrx', item: 'ir1', needs: IR_IDS } },
    explain: {
      1: 'The <b>IRremote</b> library (version 4.x), installed from the Library Manager.',
      3: 'The receiver’s OUT wire is on <b>pin 2</b>.',
      4: 'The LED from Lesson 4 on pin 5.',
      5: 'Remembers whether the LED is on.',
      8: 'Serial output on.',
      9: 'The LED pin is an output.',
      10: '<b>IrReceiver.begin(pin)</b> starts listening on the receiver’s pin.',
      13: '<b>loop()</b> repeats forever. Nothing blocks: the library collects the pulses in the background.',
      14: '<b>IrReceiver.decode()</b> is true when a complete code has arrived and was decoded.',
      15: 'Print the label…',
      16: '…and the <b>command</b> in hexadecimal. Every button of a remote has its own command number.',
      17: 'Is it the Power button of our simulated remote (command 0x45)?',
      18: 'Toggle the stored state…',
      19: '…and write it to the LED.',
      21: '<b>resume()</b>: tell the library it may receive the next code.',
    },
    steps: [
      { title: 'How a remote control talks', view: 'bench', have: [], power: false,
        body: `<p>An infrared remote has an <b>IR LED</b> that it switches on and off very fast, about <b>38 000 times per second</b> (the <b>carrier</b>), in a pattern that encodes the button. The light is invisible, but a phone camera can often show it. Many remotes use the <b>NEC protocol</b>: an <b>address</b> byte and a <b>command</b> byte (each followed by its inverse for error checking).</p>` },
      { title: 'The IR receiver', view: 'breadboard', have: ['ir1'], power: false, holes: ['e20 · OUT', 'e21 · GND', 'e22 · VS'],
        body: `<p>A <b>38 kHz IR receiver</b> contains the photodiode, an amplifier and a filter that only accepts light flickering at its carrier frequency. It outputs the pattern on <b>OUT</b>: <b>HIGH</b> when idle, <b>LOW</b> during a burst. <b>Click it</b> in the 3D view.</p>
        <ul><li>Pins (Vishay TSOP382 datasheet): <b>1 OUT, 2 GND, 3 VS</b>; with the dome toward you usually in this order from the left: check your part.</li><li>Supply <b>2.0 V to 5.5 V</b>.</li></ul>` },
      { title: 'Wire the receiver', view: 'bench', have: [...LED_IDS, ...IR_IDS], power: false, pins: ['D2', '5V', 'GND3'],
        body: `<p>Keep the LED circuit from Lesson 4 and add the receiver at <b>e20 – e22</b>:</p><ul><li>Yellow: <b>pin 2 → a20</b> (OUT)</li><li>Black: <b>GND → a21</b> (GND)</li><li>Red: <b>5V → a22</b> (VS)</li></ul>` },
      { title: 'Install the library', view: 'bench', have: [...LED_IDS, ...IR_IDS],
        body: `<p>In the Arduino IDE: <b>Sketch → Include Library → Manage Libraries…</b> and install <b>IRremote</b> (Arduino-IRremote, version 4.x). The functions changed between versions: this lesson uses the 4.x names (<code>IrReceiver.begin</code>, <code>IrReceiver.decode</code>).</p>` },
      { title: 'The code', view: 'bench', have: [...LED_IDS, ...IR_IDS], showCode: true, power: true, body: `<p>Click lines <b>14</b>, <b>16</b> and <b>21</b>.</p>` },
      { title: 'Run it and press a button', view: 'bench', have: [...LED_IDS, ...IR_IDS], showCode: true, power: true, action: 'run',
        body: `<p>Press <b>▶ Run</b>, then use the <b>simulated remote</b> in the panel. Each button prints its command (for example <code>Command: 0x45</code>); <b>Power</b> switches the LED on and off.</p><p class="sim">The remote and its codes are simulated: a real remote has its own codes, which you find by printing them like this.</p>` },
      { title: 'Summary', view: 'bench', have: [...LED_IDS, ...IR_IDS], power: true,
        body: `<ul><li>An IR remote flickers an LED at about 38 kHz in a coded pattern; the receiver outputs the pattern on OUT (active low).</li><li>IRremote: <code>IrReceiver.begin(pin)</code>, <code>decode()</code>, <code>decodedIRData.command</code>, <code>resume()</code>.</li><li>Print the commands of your own remote first, then use them in <code>if</code> tests.</li></ul>` },
    ],
    quiz: [
      { q: 'What is the carrier frequency of this IR receiver?', a: ['38 Hz', '38 kHz', '38 MHz', '3.8 kHz'], c: 1, why: 'It is a 38 kHz receiver (TSOP38238-type).' },
      { q: 'What does the receiver’s OUT pin do when a burst arrives?', a: ['Goes LOW', 'Goes HIGH', 'Stays floating', 'Turns the LED on directly'], c: 0, why: 'The output is active low and idles HIGH.' },
      { q: 'What must you call after reading a code?', a: ['IrReceiver.resume()', 'delay(1000)', 'Serial.end()', 'analogRead()'], c: 0, why: 'resume() lets the library receive the next code.' },
    ],
    sources: [SRC.vishayir, SRC.irremote, SRC.ds],
  },

  // ================================================================== 31
  {
    id: 'u31', num: 31, module: 7, title: 'MPU6050: tilt and rotation (accelerometer + gyroscope)', level: 'Intermediate', time: '25 min',
    goal: 'Read acceleration and rotation from an MPU6050 over I²C, and see how gravity shows up in the numbers.',
    hardware: ['Arduino UNO R3', 'MPU6050 breakout (GY-521 style)', '4 × jumper wires'],
    code: U3_MPU, file: 'MPU6050_read.ino', program: 'u3_mpu', fast: true, widgets: ['mpusens'],
    circuit: MPU_PARTS, io: { A4: { kind: 'mpu', scl: 'A5', item: 'mpu1', needs: MPU_IDS } },
    explain: {
      1: 'The <b>Adafruit MPU6050</b> library (install it with its dependencies from the Library Manager).',
      3: '<b>Wire.h</b>: the I²C library.',
      5: 'The sensor object.',
      8: 'Serial output on.',
      9: '<b>mpu.begin()</b> talks to the chip at address <b>0x68</b>, wakes it up (it starts in sleep mode) and returns false if nothing answers.',
      10: 'No answer: check power, SDA/SCL (not swapped) and the address.',
      17: 'Three “events” that will hold the readings.',
      18: '<b>getEvent()</b> reads the accelerometer, the gyroscope and the temperature in one go.',
      20: '<b>a.acceleration.x</b> is in <b>m/s²</b> (the library converts the raw counts for you).',
      24: 'Lying flat, Z reads about <b>9.8 m/s²</b>: that is gravity, 1 g pointing up through the sensor.',
      27: '<b>g.gyro.z</b> is the rotation speed around Z in <b>rad/s</b> (0 when the board does not turn).',
    },
    steps: [
      { title: 'Two sensors in one chip', view: 'farq', have: [], power: false,
        body: `<p>The <b>MPU6050</b> contains a <b>3-axis accelerometer</b> and a <b>3-axis gyroscope</b>. The accelerometer measures <b>acceleration, including gravity</b>: lying flat it reads about <b>9.8 m/s²</b> on Z, so it also tells you <b>how the board is tilted</b>. The gyroscope measures <b>how fast it rotates</b>.</p>` },
      { title: 'The breakout board', view: 'farq', have: ['mpu1'], power: false,
        body: `<p>The chip sits on a small board (often called <b>GY-521</b>) with an 8-pin header: <b>VCC, GND, SCL, SDA, XDA, XCL, AD0, INT</b>. We only need the first four. <b>Click it</b> in the 3D view. The printed <b>X</b> and <b>Y</b> arrows show the axes.</p>
        <p class="warn">Pin order and supply voltage differ between makers: read the printing on your board. The chip runs at about 3.3 V; many breakouts have a regulator, but powering from 3.3 V is the safe choice.</p>` },
      { title: 'Wire it', view: 'farq', have: MPU_IDS, power: false, pins: ['3V3', 'GND2', 'A4', 'A5'],
        body: `<ul><li><b>VCC → 3V3</b>, <b>GND → GND</b></li><li><b>SDA → A4</b>, <b>SCL → A5</b> (the I²C pins of the UNO R3)</li></ul>` },
      { title: 'The code', view: 'farq', have: MPU_IDS, showCode: true, power: true, body: `<p>Click lines <b>9</b>, <b>18</b> and <b>24</b>.</p>` },
      { title: 'Run it and tilt the board', view: 'farq', have: MPU_IDS, showCode: true, power: true, action: 'run',
        body: `<p>The Serial Monitor prints the acceleration twice a second. Move the <b>pitch</b> and <b>roll</b> sliders (tilt the board) and watch how the gravity <b>moves from Z to X or Y</b>: the three numbers always add up to about 9.8 m/s². Set a <b>rotation speed</b> to see the gyro value.</p><p class="sim">Simulated board and readings.</p>` },
      { title: 'What if it is not wired?', view: 'farq', have: MPU_IDS, showCode: true, power: true, action: 'ensurePower',
        body: `<p>If <code>mpu.begin()</code> finds no chip (a loose SDA/SCL wire, no power), it returns false and the sketch prints <code>MPU6050 not found!</code> and stops. This is the first thing to check when an I²C sensor gives nothing (see the I²C scanner lesson).</p>` },
      { title: 'Summary', view: 'farq', have: MPU_IDS, power: true,
        body: `<ul><li>Accelerometer: acceleration including gravity (≈ 9.8 m/s² on the axis pointing up); gyroscope: rotation speed.</li><li>I²C address 0x68; the chip wakes from sleep when the library starts it.</li><li><code>mpu.getEvent(&amp;a, &amp;g, &amp;temp)</code> returns everything in SI units.</li></ul>` },
    ],
    quiz: [
      { q: 'The board lies flat and still. What does Z read?', a: ['0', 'About 9.8 m/s²', 'About 98 m/s²', 'It changes randomly'], c: 1, why: 'Gravity: about 9.8 m/s² (1 g).' },
      { q: 'What does the gyroscope measure?', a: ['Temperature', 'How fast the board rotates', 'Magnetic field', 'Distance'], c: 1, why: 'Rotation speed around each axis.' },
      { q: 'mpu.begin() returns false. What is the most likely cause?', a: ['The LED is off', 'The chip does not answer: wiring or power', 'The baud rate', 'The delay is too long'], c: 1, why: 'No I²C answer: check power and the SDA/SCL wires.' },
    ],
    sources: [SRC.mpureg, SRC.adampu, SRC.wire],
  },

  // ================================================================== 32
  {
    id: 'u32', num: 32, module: 13, title: 'Stepper motor: turn exactly one revolution', level: 'Intermediate', time: '25 min',
    goal: 'Drive a 28BYJ-48 stepper motor through a ULN2003 board with the Stepper library: one turn each way.',
    hardware: ['Arduino UNO R3', '28BYJ-48 stepper motor (5 V) with its ULN2003 driver board', '6 × female jumper wires'],
    code: U3_STEP, file: 'StepperTurn.ino', program: 'u3_step', fast: true, widgets: ['stepper'],
    circuit: STEP_PARTS, io: { D8: { kind: 'stepper', idx: 1, item: 'stp1', needs: STEP_IDS }, D9: { kind: 'stepper', idx: 2, item: 'stp1', needs: STEP_IDS }, D10: { kind: 'stepper', idx: 3, item: 'stp1', needs: STEP_IDS }, D11: { kind: 'stepper', idx: 4, item: 'stp1', needs: STEP_IDS } },
    explain: {
      1: 'The <b>Stepper</b> library comes with the Arduino IDE.',
      3: 'Steps for one turn of the output shaft: about <b>2048</b> for this motor (nominal gear 1/64; the true ratio is a little different).',
      6: 'Create the stepper with the four pins <b>in the order IN1, IN3, IN2, IN4</b> (this motor’s coils are wired that way).',
      9: '<b>setSpeed(10)</b>: 10 revolutions per minute. This sets the delay between steps; it does not move the motor.',
      10: 'Serial output on.',
      14: 'Say which way we go.',
      15: '<b>step(2048)</b> moves that many steps (positive = one direction) and waits until done: it is <b>blocking</b>.',
      16: 'Pause half a second.',
      17: 'Say the other way.',
      18: 'A <b>negative</b> number turns the other way.',
    },
    steps: [
      { title: 'A motor that counts', view: 'scanv', have: [], power: false,
        body: `<p>An ordinary DC motor just spins. A <b>stepper motor</b> moves in small <b>exact steps</b>: you energise its coils in a repeating pattern and each new pattern turns the shaft a fixed small angle. Count the steps and you know the position, with no sensor.</p>` },
      { title: 'The 28BYJ-48 and its driver', view: 'scanv', have: ['stp1'], power: false,
        body: `<p>The popular <b>28BYJ-48</b> (5 V) has a gearbox: about <b>2048 steps</b> per turn of the output shaft (vendor sheets: 1/64 gear, 5.625°/64 per step). Pins cannot power the coils, so the <b>ULN2003 board</b> switches them: four pins IN1 to IN4 in, the motor cable out. Four <b>LEDs</b> show which coils are on. <b>Click it</b> in the 3D view.</p><p class="warn">Seller sheets disagree on coil resistance (22 Ω or 50 Ω): read the sheet of your own motor.</p>` },
      { title: 'Wire it', view: 'scanv', have: STEP_IDS, power: false, pins: ['D8', 'D9', 'D10', 'D11', '5V', 'GND2'],
        body: `<ul><li><b>IN1 → 8</b>, <b>IN2 → 9</b>, <b>IN3 → 10</b>, <b>IN4 → 11</b></li><li><b>VCC → 5V</b> (5 V), <b>GND → GND</b></li></ul><p>The motor plugs into the white socket of the driver board (already connected here).</p>` },
      { title: 'The code', view: 'scanv', have: STEP_IDS, showCode: true, power: true, body: `<p>Click lines <b>6</b>, <b>9</b> and <b>15</b>. Note the pin order <code>IN1, IN3, IN2, IN4</code> in the constructor.</p>` },
      { title: 'Run it', view: 'scanv', have: STEP_IDS, showCode: true, power: true, action: 'run',
        body: `<p>The four LEDs on the driver chase as the coil patterns change, and the shaft (red mark) turns one revolution clockwise, pauses, then one back. At 10 rpm one turn takes about 6 seconds. The panel counts the steps and the angle.</p><p class="sim">Simulated motor: the speed is approximate in the browser.</p>` },
      { title: 'Summary', view: 'scanv', have: STEP_IDS, power: true,
        body: `<ul><li>Stepper: exact steps by energising coils in a pattern; the ULN2003 board does the switching.</li><li><code>Stepper s(steps, IN1, IN3, IN2, IN4); s.setSpeed(rpm); s.step(n);</code></li><li><code>step()</code> blocks; negative = other direction; about 10 to 15 rpm is typical for this motor.</li></ul>` },
    ],
    quiz: [
      { q: 'How many steps for one output revolution of a 28BYJ-48 (nominal)?', a: ['32', '200', '2048', '10000'], c: 2, why: 'About 2048 full steps with the 1/64 gearbox.' },
      { q: 'Why use a ULN2003 board?', a: ['To make the motor faster', 'A pin cannot supply the coil current', 'To store the position', 'To cool the motor'], c: 1, why: 'It switches the coil current for the pins.' },
      { q: 'What does step(-2048) do?', a: ['Nothing', 'Turns one revolution the other way', 'Stops the motor', 'Sets the speed'], c: 1, why: 'A negative count reverses the direction.' },
    ],
    sources: [SRC.uln, SRC.steplib, ],
  },

  // ================================================================== 33
  {
    id: 'u33', num: 33, module: 7, title: 'BMP280: air pressure and temperature', level: 'Intermediate', time: '20 min',
    goal: 'Read pressure and temperature from a BMP280 over I²C and learn what address and supply it needs.',
    hardware: ['Arduino UNO R3', 'BMP280 breakout (4-pin I²C version)', '4 × jumper wires'],
    code: U3_BMP, file: 'BMP280_read.ino', program: 'u3_bmp', fast: true, widgets: ['bmpsens'],
    circuit: BMP_PARTS, io: { A4: { kind: 'bmp', scl: 'A5', item: 'bmp1', needs: BMP_IDS } },
    explain: {
      1: '<b>Wire.h</b>: the I²C library.',
      2: 'The <b>Adafruit BMP280</b> library (install it from the Library Manager).',
      4: 'The sensor object, using I²C.',
      7: 'Serial output on.',
      8: '<b>bmp.begin(0x76)</b> starts the sensor at address <b>0x76</b> (SDO on GND). If your board has SDO on VDDIO the address is 0x77. Returns false if nothing answers.',
      9: 'No answer: check power, SDA/SCL and the address.',
      16: '<b>readTemperature()</b> returns °C.',
      19: '<b>readPressure()</b> returns the pressure in <b>Pascal</b>…',
      20: '…divided by 100 it is in <b>hPa</b> (hectopascal): about 1013 hPa at sea level.',
    },
    steps: [
      { title: 'Pressure from a tiny chip', view: 'scanv', have: [], power: false,
        body: `<p>Air has weight: the <b>pressure</b> is about <b>1013 hPa</b> at sea level and falls the higher you go (and with the weather). The <b>BMP280</b> measures it, plus the temperature, and reports both over I²C.</p>` },
      { title: 'The BMP280 breakout', view: 'scanv', have: ['bmp1'], power: false,
        body: `<p>Pins here: <b>VCC, GND, SCL, SDA</b>. <b>Click it</b> in the 3D view.</p><ul><li>Pressure range <b>300 to 1100 hPa</b>, temperature <b>−40 to +85 °C</b> (Bosch datasheet).</li><li>The chip itself runs from <b>1.71 V to 3.6 V</b>: power it from <b>3.3 V</b>. Many breakouts add a regulator, but check yours.</li><li>Address <b>0x76</b> (SDO to GND) or <b>0x77</b> (SDO to VDDIO).</li></ul><p class="warn">Boards sold as BMP280 are sometimes a BME280 (with humidity): the chip ID tells them apart (0x58 is a BMP280).</p>` },
      { title: 'Wire it', view: 'scanv', have: BMP_IDS, power: false, pins: ['3V3', 'GND2', 'A4', 'A5'], body: `<ul><li><b>VCC → 3V3</b>, <b>GND → GND</b></li><li><b>SDA → A4</b>, <b>SCL → A5</b></li></ul>` },
      { title: 'The code', view: 'scanv', have: BMP_IDS, showCode: true, power: true, body: `<p>Click lines <b>8</b>, <b>16</b> and <b>19</b>.</p>` },
      { title: 'Run it and change the weather', view: 'scanv', have: BMP_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Every second the Serial Monitor prints temperature and pressure. Move the <b>temperature</b> and <b>pressure</b> sliders. Low pressure often means bad weather, high pressure fair weather.</p><p class="sim">Simulated values.</p>` },
      { title: 'Summary', view: 'scanv', have: BMP_IDS, power: true,
        body: `<ul><li>BMP280: pressure 300 to 1100 hPa and temperature, over I²C at 0x76 or 0x77; supply 1.71 V to 3.6 V.</li><li><code>readPressure()</code> is in Pascal: divide by 100 for hPa.</li><li>Not found? Check power, SDA/SCL and the address (the I²C scanner lesson helps).</li></ul>` },
    ],
    quiz: [
      { q: 'About what pressure is normal at sea level?', a: ['10 hPa', '101 hPa', '1013 hPa', '10 130 hPa'], c: 2, why: 'About 1013 hPa.' },
      { q: 'readPressure() returns 101300. In what unit is that?', a: ['hPa', 'Pascal', 'bar', 'mm'], c: 1, why: 'Pascal: divide by 100 for hPa.' },
      { q: 'What does the SDO pin choose?', a: ['The I²C address (0x76 or 0x77)', 'The speed', 'The unit', 'The temperature range'], c: 0, why: 'SDO to GND gives 0x76, to VDDIO 0x77.' },
    ],
    sources: [SRC.bmpds, SRC.adabmp, SRC.wire],
  },

  // ================================================================== 34
  {
    id: 'u34', num: 34, module: 7, title: 'Soil moisture: when to water the plant', level: 'Beginner', time: '20 min',
    goal: 'Read a capacitive soil moisture sensor, calibrate dry and wet readings, and show a moisture percentage.',
    hardware: ['Arduino UNO R3', 'Capacitive soil moisture sensor (3 wires)', '3 × jumper wires', 'A cup of soil and some water (optional)'],
    code: U3_SOIL, file: 'SoilMoisture.ino', program: 'u3_soil', fast: true, widgets: ['soilsens'],
    circuit: SOIL_PARTS, io: { A0: { kind: 'soil', item: 'soil1', needs: SOIL_IDS } },
    explain: {
      1: 'The analog input where AOUT is connected.',
      2: 'The reading with the sensor in <b>dry air</b>. These numbers belong to <b>your</b> sensor: measure them yourself.',
      3: 'The reading with the sensor in <b>water</b>. It is <b>lower</b> than the dry one.',
      6: 'Serial output on.',
      10: '<b>analogRead()</b> gives a number that follows the sensor voltage.',
      11: '<b>map()</b> converts the range dry..wet into 0..100 %. Because dry is the bigger number, the percentage still rises with moisture.',
      12: '<b>constrain()</b> keeps the result between 0 and 100, even if the reading goes beyond your calibration.',
      14: 'The raw number, then the percentage…',
      16: '…so you can see both while calibrating.',
    },
    steps: [
      { title: 'A sensor that does not corrode', view: 'scanv', have: [], power: false,
        body: `<p>Plants need water, but not too much. The simple two-prong soil sensors corrode quickly because current flows through wet soil. A <b>capacitive</b> sensor measures the soil’s effect on a <b>capacitance</b> instead, with the copper covered, so it lasts much longer.</p>` },
      { title: 'The sensor', view: 'scanv', have: ['soil1'], power: false,
        body: `<p>Three wires: <b>VCC, GND, AOUT</b> (analog output). <b>Click it</b> in the 3D view.</p><ul><li>Seller listings give a supply of <b>3.3 V to 5.5 V</b>.</li><li><b>Wetter soil gives a lower voltage.</b></li></ul><p class="warn">There is no single official datasheet: one manual quotes about 2.5 V in air and 1.0 V in water, others differ. This is why you <b>calibrate</b> your own sensor.</p>` },
      { title: 'Wire it', view: 'scanv', have: SOIL_IDS, power: false, pins: ['5V', 'GND2', 'A0'], body: `<ul><li><b>VCC → 5V</b>, <b>GND → GND</b>, <b>AOUT → A0</b></li></ul>` },
      { title: 'The code', view: 'scanv', have: SOIL_IDS, showCode: true, power: true, body: `<p>Click lines <b>11</b> and <b>12</b>. The two constants at the top are your calibration.</p>` },
      { title: 'Run it and wet the soil', view: 'scanv', have: SOIL_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Move the <b>soil moisture</b> slider from dry to wet. The raw reading <b>falls</b> and the percentage <b>rises</b>.</p><p class="sim">Simulated sensor: in this simulation dry = about 2.5 V and wet = about 1.0 V (example values from one manual). Your sensor will differ.</p>` },
      { title: 'Calibrate your own', view: 'scanv', have: SOIL_IDS, power: true,
        body: `<ol><li>Hold the sensor in dry air and write down the raw reading: <code>dryValue</code>.</li><li>Put it in water up to the line and write down the reading: <code>wetValue</code>.</li><li>Put the two numbers in the sketch.</li></ol><p>Then, for example, water the plant when the percentage falls under 30 %.</p>` },
      { title: 'Summary', view: 'scanv', have: SOIL_IDS, power: true,
        body: `<ul><li>Capacitive soil sensor: VCC, GND, AOUT; wetter = lower voltage.</li><li>Calibrate dry and wet readings, then <code>map()</code> and <code>constrain()</code>.</li><li>Only the marked part of the board goes into the soil.</li></ul>` },
    ],
    quiz: [
      { q: 'The soil gets wetter. What happens to the sensor voltage?', a: ['It rises', 'It falls', 'It stays the same', 'It becomes AC'], c: 1, why: 'Wetter soil gives a lower voltage.' },
      { q: 'Why calibrate?', a: ['Sensors differ: the dry and wet readings are different for each unit', 'To make it faster', 'To save power', 'The library needs it'], c: 0, why: 'Dry and wet values vary between sensors.' },
      { q: 'What does constrain(x, 0, 100) do?', a: ['Keeps x between 0 and 100', 'Multiplies x', 'Makes x an integer', 'Prints x'], c: 0, why: 'It clamps the value into the range.' },
    ],
    sources: [SRC.soilsrc, SRC.ds],
  },

  // ================================================================== 35
  {
    id: 'u35', num: 35, module: 7, title: 'Sound sensor: a clap switch', level: 'Beginner', time: '20 min',
    goal: 'Read a microphone module, find the quiet level, and toggle an LED when a loud sound (a clap) arrives.',
    hardware: ['Arduino UNO R3', 'The LED circuit of Lesson 4', 'Microphone sound sensor module (analog output)', 'Jumper wires'],
    code: U3_SND, file: 'ClapSwitch.ino', program: 'u3_snd', fast: true, widgets: ['clapsens'],
    circuit: [...LED_CIRCUIT, ...SND_PARTS], io: { D5: IO_LED, A0: { kind: 'mic', item: 'snd1', needs: SND_IDS } },
    explain: {
      1: 'The analog input where AO is connected.',
      2: 'The LED from Lesson 4.',
      3: 'How far the reading must move away from the quiet level to count as a clap. Tune it for your sensor.',
      4: 'The quiet-room reading, found in setup().',
      10: 'Read the sensor once in a quiet room. A microphone module sits near the <b>middle</b> of its range when quiet.',
      14: 'How far is the reading from the quiet level? <b>abs()</b> makes it positive: sound swings up and down.',
      15: 'Louder than the threshold: a clap.',
      16: 'Toggle the LED state…',
      17: '…and write it to the LED.',
      19: 'Wait 300 ms so the echo of one clap is not counted twice.',
    },
    steps: [
      { title: 'Listening with a microphone module', view: 'scanv', have: [], power: false,
        body: `<p>A sound sensor module has a small <b>microphone</b> and an amplifier. Its analog output <b>AO</b> sits near the <b>middle</b> of the supply voltage when it is quiet and swings up and down with the sound. A clap makes a big swing.</p>` },
      { title: 'The module', view: 'scanv', have: ['snd1'], power: false,
        body: `<p><b>Click it</b> in the 3D view. Pin names and order differ between makers (AO, GND, VCC here): read the printing on your own board. Many boards also have a digital output with a potentiometer; this lesson uses the analog output.</p><p class="warn">There is no standard datasheet for these modules: the quiet level and swing are typical, not exact.</p>` },
      { title: 'Wire it', view: 'scanv', have: [...LED_IDS, ...SND_IDS], power: false, pins: ['A0', '5V', 'GND1'], body: `<ul><li><b>AO → A0</b>, <b>VCC → 5V</b>, <b>GND → GND</b> (the LED is wired as in Lesson 4, on pin 5)</li></ul>` },
      { title: 'The code', view: 'scanv', have: [...LED_IDS, ...SND_IDS], showCode: true, power: true, body: `<p>Click lines <b>10</b>, <b>14</b> and <b>15</b>.</p>` },
      { title: 'Run it and clap', view: 'scanv', have: [...LED_IDS, ...SND_IDS], showCode: true, power: true, action: 'run',
        body: `<p>Press <b>▶ Run</b>, then press <b>“Clap”</b> in the panel. Each clap toggles the LED and prints <code>Clap detected</code>. A quiet sound does nothing.</p><p class="sim">Simulated sound: quiet is about half of the supply, a clap swings the reading by a large amount.</p>` },
      { title: 'Summary', view: 'scanv', have: [...LED_IDS, ...SND_IDS], power: true,
        body: `<ul><li>Microphone module: AO near mid-supply when quiet, swings with sound.</li><li>Measure the quiet level, react to the <b>difference</b> (<code>abs()</code>).</li><li>A short <code>delay()</code> after a clap avoids counting the echo.</li></ul>` },
    ],
    quiz: [
      { q: 'Why compare with the quiet level instead of a fixed number?', a: ['Modules differ: the quiet reading is not the same on every board', 'To save memory', 'Because analogRead cannot be compared', 'It is faster'], c: 0, why: 'The quiet level varies between modules.' },
      { q: 'Why abs() on the difference?', a: ['Sound swings above and below the quiet level', 'To print it', 'To save power', 'To make it integer'], c: 0, why: 'The signal goes both up and down.' },
      { q: 'What is the delay(300) for?', a: ['To ignore the echo of the clap', 'To warm up the sensor', 'To save power', 'To read Serial'], c: 0, why: 'Otherwise one clap could toggle the LED several times.' },
    ],
    sources: [SRC.sndsrc, SRC.ds],
  },
];

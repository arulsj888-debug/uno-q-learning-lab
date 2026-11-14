// Slot h: four ESP32 lessons (module 100): servo SG90 with LEDC, security alarm (PIR + buzzer + LED + arm button),
// smart door (RC522 + servo + buzzer + LED) and a two-motor robot car (L293D + HC-SR04 with a voltage divider).
// They are ports of the UNO R3 / UNO Q project lessons of e.js. The generic io kinds of main.js ('servo', 'pir', 'hcsr04', 'motor') are written for
// UNO pin names (D2, D5, D7, D8, 5V), so these lessons use their own devices (h_ui.js: dv:sv32, dv:pir32, dv:sonar32, dv:car32).
// Listings use //@tag markers (see e.js): the tags give the line numbers used by programs, explanations and the line checks.
// Plain data only: no DOM or three.js imports.
import { SRC } from '../uno3/common.js';

const R = (t, u) => ({ t, u });
const S = {
  sg90: SRC.sg90, sr501: SRC.sr501, sr501guide: SRC.sr501guide, hcsr04: SRC.hcsr04, l293: SRC.l293, motor130: SRC.motor130, millis: SRC.millis, pulsein: SRC.pulsein,
  mfrc: R('MFRC522 datasheet (NXP): 2.5 V to 3.3 V supply, SPI up to 10 Mbit/s', 'https://www.nxp.com/docs/en/data-sheet/MFRC522.pdf'),
  mfrclib: R('MFRC522 Arduino library (miguelbalboa)', 'https://github.com/miguelbalboa/rfid'),
  ds: R('Espressif ESP32 Series Datasheet (VIH 0.75 × VDD, allowed input voltage up to 3.6 V)', 'https://documentation.espressif.com/esp32_datasheet_en.pdf'),
  ledc: R('Arduino-ESP32 documentation: LEDC (ledcAttach, ledcWrite)', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/ledc.html'),
  esp32servo: R('ESP32Servo library (madhephaestus)', 'https://github.com/madhephaestus/ESP32Servo'),
};

const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const jw = (id, from, to, color = 'black', lift = 12) => ({ id, type: 'wire', from, to, color, lift });
const ids = a => a.map(d => d.id);
const mod = (id, model, x = 20, z = 138) => ({ id, type: 'mod', model, x, z });
const COL = { VCC: 'red', GND: 'black', '3V3': 'red', VIN: 'red' };
const COLORS = ['blue', 'green', 'yellow', 'orange', 'white', 'violet', 'red', 'black'];
/** module on the desk, connected through the breadboard: module pin -> a<col>, board pin -> b<col> (net = null: only the module wire) */
const bb = (id, pairs, c0) => pairs.flatMap(([mp, net], i) => {
  const c = COL[mp] || COL[net] || COLORS[i % COLORS.length];
  return [fw(id + 'm' + i, id + '.' + mp, 'a' + (c0 + i), c, 16 + 2 * i), ...(net ? [fw(id + 'b' + i, net, 'b' + (c0 + i), c, 22 + 3 * i)] : [])];
});
const mio = (kind, item, needs, map, pw) => { const o = {}; let first = true; for (const [pin, [role, mp, it]] of Object.entries(map)) { o[pin] = { kind: 'dev:' + kind, role, item: it || item, mp, needs }; if (first && pw) { o[pin].pw = pw; first = false; } } return o; };

// ---- listing helper ----------------------------------------------------------------------------------------------------------
function listing(src) {
  const lines = [], tags = {};
  src.split('\n').forEach((ln, i) => {
    const m = /\s*\/\/@(\w+)\s*$/.exec(ln);
    if (m) { tags[m[1]] = i + 1; ln = ln.slice(0, m.index); }
    lines.push(ln.replace(/\s+$/, ''));
  });
  const checks = Object.values(tags).sort((a, b) => a - b).map(n => [n, lines[n - 1].trim().slice(0, 22)]);
  return { code: lines.join('\n'), tags, checks };
}
const byTag = (tags, o) => { const r = {}; for (const [k, v] of Object.entries(o)) { if (!(k in tags)) throw new Error('unknown tag ' + k); r[tags[k]] = v; } return r; };
const CODE = {}, CHECKS = {}, PROGRAMS = {}, TAGS = {};
function reg(key, src) { const l = listing(src); CODE[key] = l.code; CHECKS[key] = l.checks; TAGS[key] = l.tags; return l; }
const STEP = (title, view, have, body, o = {}) => ({ title, view, have, power: false, body, ...o });
const atOf = (rt, T) => async (...n) => { for (const i of n) await rt.at(T[i]); };

// ---- shared parts --------------------------------------------------------------------------------------------------------------
const LED = [{ id: 'r1', type: 'resistor', a: 'c10', b: 'c14' }, { id: 'led1', type: 'led', anode: 'd14', cathode: 'd15' }, fw('w1', 'G16', 'a10', 'yellow', 22), fw('w2', 'GND2', 'a15', 'black', 16)];
const LED_IDS = ids(LED);
const IO_LED = { kind: 'led', item: 'led1', needs: LED_IDS };
// SG90 plugged into j11 (GND, brown), j12 (+5 V, red), j13 (signal, orange); the board wires go to the same columns in row f
const SERVO = [{ id: 'sv1', type: 'servo', row: 'j', col: 11, bx: 78, bz: 72 }, fw('w23', 'GND1', 'f11', 'black', 30), fw('w24', 'VIN', 'f12', 'red', 26), fw('w25', 'G25', 'f13', 'orange', 22)];
const SERVO_IO = ids => ({ G25: { kind: 'dev:sv32', role: 'sig', item: 'sv1', mp: 'sv1.SIG', needs: ids, pw: [['sv1.VCC', 'VIN'], ['sv1.GND', 'GND']] } });
const MODULE = 100;
const VIN_NOTE = 'VIN is the 5 V rail of the board: it carries the USB 5 V while the board is powered over USB (the pin note of this lab says about 5 V).';

// =================================================================================================================================
// 1. SERVO SG90 WITH LEDC
// =================================================================================================================================
const SV_SRC = `// SG90 servo on an ESP32: LEDC PWM at 50 Hz, no library (Arduino-ESP32 core 3.x)
const int servoPin = 25;     // signal wire (orange) //@servoPin
const int pwmFreq = 50;      // a servo wants a pulse every 20 ms = 50 Hz //@freq
const int pwmBits = 14;      // duty 0 ... 16383 //@bits
const int minUs = 500;       // pulse for 0 degrees (SG90 datasheet: 500 us) //@minUs
const int maxUs = 2400;      // pulse for 180 degrees (datasheet: 2400 us) //@maxUs

void servoWrite(int angle) { //@fn
  int us = map(angle, 0, 180, minUs, maxUs);            // angle to pulse width //@us
  uint32_t duty = (uint32_t)us * 16383 / 20000;          // part of the 20 ms period //@duty
  ledcWrite(servoPin, duty); //@lw
}

void setup() {
  Serial.begin(115200); //@ser
  ledcAttach(servoPin, pwmFreq, pwmBits); //@att
}

void loop() {
  servoWrite(0); //@a0
  Serial.println("0 degrees"); //@p0
  delay(1000); //@d0
  servoWrite(90); //@a1
  Serial.println("90 degrees"); //@p1
  delay(1000); //@d1
  servoWrite(180); //@a2
  Serial.println("180 degrees"); //@p2
  delay(1000); //@d2
  servoWrite(90); //@a3
  delay(1000); //@d3
}`;
reg('h_servo', SV_SRC);
PROGRAMS.h_servo = async (rt) => {
  const T = TAGS.h_servo, at = atOf(rt, T);
  const servoWrite = async a => {
    await at('fn'); await at('us'); const us = rt.map(a, 0, 180, 500, 2400);
    await at('duty'); const duty = Math.floor(us * 16383 / 20000);
    await at('lw'); rt.ledcWrite('G25', duty);
  };
  await at('servoPin', 'freq', 'bits', 'minUs', 'maxUs');
  await at('ser'); rt.serialBegin(115200);
  await at('att'); rt.ledcAttach('G25', 50, 14);
  for (;;) {
    await at('a0'); await servoWrite(0);
    await at('p0'); rt.println('0 degrees');
    await at('d0'); await rt.delay(1000);
    await at('a1'); await servoWrite(90);
    await at('p1'); rt.println('90 degrees');
    await at('d1'); await rt.delay(1000);
    await at('a2'); await servoWrite(180);
    await at('p2'); rt.println('180 degrees');
    await at('d2'); await rt.delay(1000);
    await at('a3'); await servoWrite(90);
    await at('d3'); await rt.delay(1000);
  }
};

const SV_IDS = ids(SERVO);
function servoLesson() {
  const T = TAGS.h_servo;
  return {
    module: MODULE, title: 'Servo SG90 on the ESP32: an angle from a 50 Hz PWM signal', level: 'Intermediate', time: '25 min', fast: true,
    goal: 'Turn an SG90 servo to 0°, 90° and 180° with the ESP32’s LEDC PWM (core 3.x), and understand what the pulse width means.',
    hardware: ['ESP32 DevKit V1', 'Breadboard', 'SG90 micro servo', 'Jumper wires'],
    code: CODE.h_servo, file: 'ServoLedc.ino', program: 'h_servo', widgets: ['dv:sv32'],
    circuit: SERVO, io: SERVO_IO(SV_IDS),
    explain: byTag(T, {
      servoPin: 'Any normal output pin works: the ESP32 routes LEDC PWM to almost any pin. GPIO25 is not a strapping pin and not input only.', freq: 'The servo expects a pulse about every 20 ms: 50 Hz.',
      bits: '14 bits: 16384 steps per period, so one step is 20 ms / 16384 ≈ 1.2 µs.', minUs: 'SG90 datasheet: pulse width 500 to 2400 µs. Your servo may differ slightly: test carefully.', maxUs: 'Do not push the horn into its end stop: if the servo hums at the end, use a smaller range.',
      fn: 'One helper: angle in degrees to PWM duty.', us: 'Linear mapping: 0° gives 500 µs, 180° gives 2400 µs.', duty: 'The pulse is us microseconds of a 20 000 µs period: duty = us × 16383 / 20000.',
      lw: 'Arduino-ESP32 core 3.x: ledcWrite takes the pin, not a channel number.', att: 'ledcAttach(pin, frequency, resolution) in core 3.x (core 2.x used channels: not the same API).',
    }),
    steps: [
      STEP('A motor that goes to an angle', 'bench', [], `<p>A servo turns its horn to an <b>angle</b> and holds it. It gets the angle from a <b>pulse width</b>: a pulse about every 20 ms; the SG90 datasheet says roughly <b>1 ms</b> is one end, <b>1.5 ms</b> the middle and <b>2 ms</b> the other end, and lists a pulse width range of <b>500 to 2400 µs</b> for its 180° of rotation.</p><p>The ESP32 makes such pulses with its <b>LEDC</b> PWM hardware: 50 Hz, and a duty cycle that is the pulse width divided by 20 ms. No servo library is needed (the ESP32Servo library does the same job, see the last step).</p>`),
      STEP('Voltages and pins', 'bench', SV_IDS, `<ul><li><b>Servo supply</b>: the SG90 datasheet gives an operating voltage of <b>4.8 V (about 5 V)</b>. Use the <b>VIN</b> pin, not 3V3. ${VIN_NOTE}</li><li><b>Signal level</b>: the ESP32 pin gives <b>3.3 V</b>. The SG90 datasheet does <b>not</b> state a minimum signal voltage. Many people report that SG90 servos accept a 3.3 V signal, but that is <b>not verified here</b>: if your servo twitches or ignores the signal, use a level shifter.</li><li><b>Current</b>: the datasheet gives stall torque but no current. A servo can draw much more when it starts or is blocked (typical behaviour, not a datasheet figure), so for more than one small servo use a separate 5 V supply and join its GND to the board GND.</li><li><b>Pin</b>: GPIO25. Avoid the strapping pins GPIO0, 2, 12 and 15 and the input-only pins GPIO34 to 39 (they cannot output).</li></ul>`),
      STEP('Wire it', 'bench', SV_IDS, `<ul><li>The servo plugs into three breadboard holes: brown (GND) j11, red (+5 V) j12, orange (signal) j13.</li><li>GND → f11, VIN → f12 (female jumpers from the board pins), and a third jumper from GPIO25 to f13.</li></ul><p class="sim">The simulator checks that these wires exist; the column choice is only one possible layout.</p>`, { pins: ['GND1', 'VIN', 'G25'] }),
      STEP('The code', 'bench', SV_IDS, `<p>Click lines <b>${T.us}</b>, <b>${T.duty}</b> and <b>${T.lw}</b>: angle, then pulse width, then PWM duty. This is Arduino-ESP32 <b>core 3.x</b>; sketches written for core 2.x use <code>ledcSetup</code> and channel numbers and do not compile unchanged.</p>`, { showCode: true, power: true }),
      STEP('Run it', 'bench', SV_IDS, `<p>Press <b>▶ Run</b>: the horn goes to 0°, 90°, 180° and back to 90°. The panel shows the pulse width the sketch makes.</p><p class="sim">Simulated servo. Assumptions: 50 Hz, 500 µs = 0° and 2400 µs = 180° (the pulse range of the datasheet), horn speed 0.1 s per 60° (datasheet, no load). Load, torque, jitter, the end stops and the exact limits of your own servo are not modelled.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('The ESP32Servo library', 'bench', SV_IDS, `<p>The <b>ESP32Servo</b> library (madhephaestus) gives the usual <code>Servo</code> interface on the ESP32; its README states compatibility with Arduino-ESP32 3.0.0 and later and a default pulse range of <b>544 to 2400 µs</b>, which you can change when you attach the servo. It is not run in this simulator: the lesson uses LEDC so that you can see the pulse.</p><ul><li>One timer-per-servo and channel limits apply to any servo method on the ESP32: check the library page when you drive several servos.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does the servo use to decide its angle?', a: ['The width of a pulse repeated about every 20 ms', 'The voltage on the signal wire', 'The number of pulses per second only', 'The colour of the wire'], c: 0, why: 'Pulse width: about 1 ms to 2 ms in the SG90 datasheet.' },
      { q: 'A pulse of 1500 µs in a 20 000 µs period is a duty of…', a: ['7.5 %', '75 %', '15 %', '0.75 %'], c: 0, why: '1500 / 20000 = 0.075.' },
      { q: 'Which supply pin is used for the SG90 here?', a: ['VIN (about 5 V)', '3V3', 'EN', 'GPIO25'], c: 0, why: 'The datasheet operating voltage is 4.8 V (about 5 V).' },
    ],
    sources: [S.sg90, S.ledc, S.esp32servo, S.ds],
  };
}

// =================================================================================================================================
// 2. SECURITY ALARM
// =================================================================================================================================
const AL_SRC = `// Learning demo: a motion alarm. NOT a real security product.
const int pirPin = 27;       // PIR OUT: about 3.3 V while it sees motion //@pirPin
const int armPin = 17;       // arm / disarm button, the other side goes to GND //@armPin
const int ledPin = 16;       // status LED //@ledPin
const int buzzerPin = 25;    // active buzzer, through 220 ohm //@buzPin
const unsigned long warmupMs = 60000;   // the PIR needs about 1 minute to start //@warm
const unsigned long alarmMs = 5000;     // the siren sounds for 5 s //@alarmMs
bool armed = false;
bool alarming = false;
unsigned long alarmStart = 0;
int lastButton = HIGH;

void setup() {
  pinMode(pirPin, INPUT); //@m1
  pinMode(armPin, INPUT_PULLUP); //@m2
  pinMode(ledPin, OUTPUT); //@m3
  pinMode(buzzerPin, OUTPUT); //@m4
  Serial.begin(115200); //@ser
  Serial.println("PIR warming up (about 1 minute)..."); //@w1
  delay(warmupMs); //@w2
  Serial.println("Ready: DISARMED"); //@w3
}

void loop() {
  int button = digitalRead(armPin); //@rd
  if (button == LOW && lastButton == HIGH) {   // a new press //@edge
    armed = !armed; //@tog
    alarming = false; //@clr
    Serial.println(armed ? "ARMED" : "DISARMED"); //@pr
    delay(50);                                 // debounce //@deb
  }
  lastButton = button; //@last
  if (armed && !alarming && digitalRead(pirPin) == HIGH) { //@trig
    alarming = true; //@al1
    alarmStart = millis(); //@al2
    Serial.println("ALARM: motion while armed!"); //@al3
  }
  if (alarming && millis() - alarmStart > alarmMs) { //@to
    alarming = false; //@to1
    Serial.println("Siren stopped"); //@to2
  }
  digitalWrite(buzzerPin, alarming ? HIGH : LOW); //@out1
  digitalWrite(ledPin, alarming ? (millis() / 200) % 2 : armed); //@out2
  delay(20); //@dl
}`;
reg('h_alarm', AL_SRC);
PROGRAMS.h_alarm = async (rt, o) => {
  const T = TAGS.h_alarm, at = atOf(rt, T);
  let armed = false, alarming = false, alarmStart = 0, lastButton = 1;
  await at('pirPin', 'armPin', 'ledPin', 'buzPin', 'warm', 'alarmMs');
  await at('m1'); rt.pinMode('G27', 'INPUT');
  await at('m2'); rt.pinMode('G17', 'INPUT_PULLUP');
  await at('m3'); rt.pinMode('G16', 'OUTPUT');
  await at('m4'); rt.pinMode('G25', 'OUTPUT');
  await at('ser'); rt.serialBegin(115200);
  await at('w1'); rt.println('PIR warming up (about 1 minute)...');
  await at('w2'); await rt.delay(o.warmupMs ?? 60000);
  await at('w3'); rt.println('Ready: DISARMED');
  for (;;) {
    await at('rd'); const button = rt.digitalRead('G17');
    await at('edge');
    if (button === 0 && lastButton === 1) {
      await at('tog'); armed = !armed;
      await at('clr'); alarming = false;
      await at('pr'); rt.println(armed ? 'ARMED' : 'DISARMED');
      await at('deb'); await rt.delay(50);
    }
    await at('last'); lastButton = button;
    await at('trig');
    if (armed && !alarming && rt.digitalRead('G27') === 1) {
      await at('al1'); alarming = true;
      await at('al2'); alarmStart = rt.millis();
      await at('al3'); rt.println('ALARM: motion while armed!');
    }
    await at('to');
    if (alarming && rt.millis() - alarmStart > 5000) {
      await at('to1'); alarming = false;
      await at('to2'); rt.println('Siren stopped');
    }
    await at('out1'); rt.digitalWrite('G25', alarming ? 1 : 0);
    await at('out2'); rt.digitalWrite('G16', alarming ? Math.floor(rt.millis() / 200) % 2 : (armed ? 1 : 0));
    await at('dl'); await rt.delay(20);
  }
};

const AL_BTN = [{ id: 'btn1', type: 'button', col: 20 }, fw('w3', 'G17', 'a20', 'blue', 26), fw('w4', 'GND1', 'j22', 'black', 46)];
const AL_BZ = [{ id: 'rz1', type: 'resistor', a: 'c23', b: 'c27', ohms: 220 }, { id: 'bz1', type: 'buzzer', active: true, plus: 'e27', minus: 'e30' }, fw('w8', 'G25', 'a23', 'orange', 22), jw('w9', 'a30', 'b15', 'black', 20)];
const AL_PIR = [{ id: 'pir1', type: 'pir', x: 80, z: 140 }, fw('pm0', 'pir1.VCC', 'a5', 'red', 18), fw('pb0', 'VIN', 'b5', 'red', 24), fw('pm1', 'pir1.OUT', 'a6', 'yellow', 20), fw('pb1', 'G27', 'b6', 'yellow', 27), fw('pm2', 'pir1.GND', 'c15', 'black', 22)];
const AL_CIRCUIT = [...LED, ...AL_BTN, ...AL_BZ, ...AL_PIR];
const AL_IDS = ids(AL_CIRCUIT);

function alarmLesson() {
  const T = TAGS.h_alarm;
  return {
    module: MODULE, title: 'Project: a motion alarm (PIR + buzzer, arm with a button)', level: 'Advanced', time: '40 min', fast: true,
    goal: 'Combine a PIR motion sensor, a button, an LED and an active buzzer into an alarm you can arm and disarm. A learning demo, not a security product.',
    hardware: ['ESP32 DevKit V1', 'HC-SR501 PIR motion sensor', 'Push button', 'Active buzzer and a 220 Ω resistor', 'LED and a 220 Ω resistor (the LED circuit of Lesson 2)', 'Breadboard and jumper wires'],
    code: CODE.h_alarm, file: 'MotionAlarm.ino', program: 'h_alarm', widgets: ['button', 'dv:pir32', 'dv:abuz'],
    circuit: AL_CIRCUIT,
    io: {
      G27: { kind: 'dev:pir32', role: 'out', item: 'pir1', mp: 'pir1.OUT', needs: AL_IDS, pw: [['pir1.VCC', 'VIN'], ['pir1.GND', 'GND']] },
      G17: { kind: 'button', item: 'btn1', needs: AL_IDS }, G16: { ...IO_LED, needs: AL_IDS },
      G25: { kind: 'dev:abuz', role: 'bz', item: 'bz1', mp: 'rz1.1', needs: AL_IDS, pw: [['bz1.-', 'GND']] },
    },
    explain: byTag(T, {
      pirPin: 'The PIR output: HIGH (about 3.3 V) while it sees movement. GPIO27 is a normal input, not a strapping pin.', armPin: 'The arm/disarm button. It connects the pin to GND when pressed, so the pin uses the internal pull-up.',
      buzPin: 'The active buzzer has its own oscillator: HIGH = sound. A 220 Ω resistor is in series.', warm: 'The datasheet start-up time of the PIR is about one minute. The simulator shortens it to a few seconds.',
      edge: 'Act only on the moment of pressing (HIGH to LOW), not while the button is held.', tog: 'Each press flips armed / disarmed.', clr: 'Arming or disarming also silences a running alarm.',
      trig: 'The alarm starts only if the system is armed, is not already sounding, and the PIR says motion.', al2: 'Remember when it started, with millis() (no blocking delay, so the button still works).',
      to: 'After 5 s the siren stops by itself. If the PIR is still HIGH, it can trigger again at once.', out1: 'The buzzer follows the alarm state.', out2: 'LED: blinks during an alarm, steady when armed, off when disarmed.',
    }),
    steps: [
      STEP('Four parts, one state machine', 'scanv', [], `<p>Three <b>inputs</b> and two <b>outputs</b>: the PIR says “movement”, the button toggles <b>armed / disarmed</b>, the sketch remembers the state, and the buzzer and LED show it. The important idea is the <b>state</b>: the same movement means nothing when disarmed and an alarm when armed.</p><p class="warn"><b>This is a learning demo, not a real security product.</b> A PIR can miss a person who moves slowly, can be fooled by heat sources and sunlight, and the board has no tamper detection, no backup power and no connection to anyone.</p>`),
      STEP('Voltages: 5 V in, 3.3 V out', 'scanv', ['pir1'], `<ul><li><b>HC-SR501 PIR</b>: it needs a supply of <b>5 V</b> (datasheet range 5 to 20 V), so it is fed from <b>VIN</b>, not 3V3. Its output is a <b>3.3 V</b> signal when it sees motion, which is a valid HIGH for the ESP32 (HIGH is above 0.75 × 3.3 V = 2.475 V, chip datasheet) and cannot harm the pin. ${VIN_NOTE}</li><li>The sensor needs about <b>1 minute</b> to start and detects <b>movement</b>, not a person standing still.</li><li><b>Active buzzer</b>: a steady HIGH is enough. Check that yours is rated for 3.3 V (some 5 V types are quiet at 3.3 V). The 220 Ω resistor limits the current to below 15 mA; the buzzer’s own data decides the real value.</li><li><b>Button</b>: GPIO17 with the internal pull-up, the other side to GND.</li></ul>`),
      STEP('Wire it', 'scanv', AL_IDS, `<ul><li>LED circuit as in Lesson 2: GPIO16 to a10, GND to a15.</li><li>Button: GPIO17 → a20, and the other side j22 ← GND.</li><li>Buzzer: GPIO25 to a23 (resistor to the buzzer +); the buzzer − (column 30) is joined by a wire to the LED ground column (b15).</li><li>PIR: its <b>VCC</b> wire to a5 and VIN → b5; its <b>OUT</b> wire to a6 and GPIO27 to b6; its <b>GND</b> wire to c15 (the ground column).</li></ul><p class="sim">The simulator checks that these wires exist; the column choices are only one possible layout.</p>`, { pins: ['G16', 'G17', 'G25', 'G27', 'VIN', 'GND1', 'GND2'] }),
      STEP('The code', 'scanv', AL_IDS, `<p>Click lines <b>${T.edge}</b>, <b>${T.trig}</b> and <b>${T.to}</b>: the three decisions. <code>millis()</code> times the siren without blocking.</p>`, { showCode: true, power: true }),
      STEP('Run it: arm, trigger, disarm', 'scanv', AL_IDS, `<p>Press <b>▶ Run</b> and wait for “Ready”. Click <b>Wave a hand</b>: nothing happens, because the system is <b>disarmed</b>. <b>Hold</b> the button (and release) to arm: the LED stays on. Wave again: the buzzer sounds and the LED blinks for 5 s. Press the button again to disarm.</p><p class="sim">Simulated PIR (warm-up shortened to 3 s; a real HC-SR501 needs about a minute) and a simulated buzzer. The PIR hold time of 5 s is a simulator default: on the real module a trimmer sets it. No range, angle, sunlight or siren loudness is modelled.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('What a real alarm needs', 'scanv', AL_IDS, `<ul><li>Exit and entry delays, a tamper switch, a backup battery, and a way to notify someone (the ESP32 has Wi-Fi: an MQTT message would be a next step).</li><li>A PIR is one sensor with false alarms and blind spots; real systems use several.</li><li>A button anyone can press is not authentication (a keypad or card, see the smart door).</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Why is the PIR fed from VIN and not from 3V3?', a: ['Its supply range starts at 5 V', 'It would be too bright on 3V3', 'VIN is a signal pin', '3V3 is for the USB chip only'], c: 0, why: 'HC-SR501 datasheet: 5 to 20 V supply.' },
      { q: 'Is the 3.3 V PIR output a problem for the ESP32 pin?', a: ['No: it is a valid HIGH and within the pin’s voltage', 'Yes: it burns the pin', 'Yes: it is too low to be read', 'Only at night'], c: 0, why: 'HIGH starts at 2.475 V and the pins are 3.3 V pins.' },
      { q: 'Why is the siren timed with millis() instead of delay(5000)?', a: ['A delay would block the loop, so the button could not disarm during the siren', 'delay() does not work with buzzers', 'millis() is louder', 'It is required by the PIR'], c: 0, why: 'Non-blocking timing keeps the program responsive.' },
    ],
    sources: [S.sr501, S.sr501guide, S.millis, S.ds],
  };
}

// =================================================================================================================================
// 3. SMART DOOR
// =================================================================================================================================
const DR_SRC = `#include <SPI.h>
#include <MFRC522.h>

const int ssPin = 5;         // RC522 SDA = chip select (default VSPI CS) //@ssPin
const int rstPin = 27;       // RC522 RST //@rstPin
const int servoPin = 25;     // servo signal //@servoPin
const int ledPin = 16;       //@ledPin
const int buzzerPin = 26;    // active buzzer, through 220 ohm //@buzPin
const byte allowed[4] = {0xDE, 0xAD, 0xBE, 0xEF};   // the demo card A: a real UID is different //@allowed
const unsigned long openMs = 3000;                  // the door stays open 3 s //@openMs

MFRC522 rfid(ssPin, rstPin); //@obj

void servoWrite(int angle) {   // LEDC at 50 Hz, 14 bit: see the servo lesson //@sw
  int us = map(angle, 0, 180, 500, 2400); //@sw1
  ledcWrite(servoPin, (uint32_t)us * 16383 / 20000); //@sw2
}

void beep(int ms) { //@beep
  digitalWrite(buzzerPin, HIGH); //@b1
  delay(ms); //@b2
  digitalWrite(buzzerPin, LOW); //@b3
}

void setup() {
  pinMode(ledPin, OUTPUT); //@m1
  pinMode(buzzerPin, OUTPUT); //@m2
  Serial.begin(115200); //@ser
  SPI.begin();                  // default VSPI pins: SCK 18, MISO 19, MOSI 23 //@spi
  rfid.PCD_Init(); //@init
  ledcAttach(servoPin, 50, 14); //@att
  servoWrite(0);                // 0 degrees = locked (your mechanics decide) //@lock0
  Serial.println("Door locked. Hold a card near the reader"); //@msg
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return; //@card
  bool ok = (rfid.uid.size == 4); //@ok0
  for (byte i = 0; i < 4 && ok; i++) { //@cmp
    if (rfid.uid.uidByte[i] != allowed[i]) ok = false; //@cmp2
  }
  if (ok) { //@if
    Serial.println("Access granted: door open"); //@g1
    digitalWrite(ledPin, HIGH); //@g2
    beep(150); //@g3
    servoWrite(90);             // open //@g4
    delay(openMs); //@g5
    servoWrite(0);              // lock again //@g6
    digitalWrite(ledPin, LOW); //@g7
    Serial.println("Door locked"); //@g8
  } else { //@else
    Serial.println("Access denied"); //@d1
    beep(600); //@d2
  }
  rfid.PICC_HaltA(); //@halt
}`;
reg('h_door', DR_SRC);
PROGRAMS.h_door = async (rt) => {
  const T = TAGS.h_door, at = atOf(rt, T);
  const allowed = [0xDE, 0xAD, 0xBE, 0xEF];
  const servoWrite = async a => { await at('sw'); await at('sw1'); const us = rt.map(a, 0, 180, 500, 2400); await at('sw2'); rt.ledcWrite('G25', Math.floor(us * 16383 / 20000)); };
  const beep = async ms => { await at('beep'); await at('b1'); rt.digitalWrite('G26', 1); await at('b2'); await rt.delay(ms); await at('b3'); rt.digitalWrite('G26', 0); };
  await at('ssPin', 'rstPin', 'servoPin', 'ledPin', 'buzPin', 'allowed', 'openMs', 'obj');
  await at('m1'); rt.pinMode('G16', 'OUTPUT');
  await at('m2'); rt.pinMode('G26', 'OUTPUT');
  await at('ser'); rt.serialBegin(115200);
  await at('spi');
  await at('init'); rt.dev('rfid', 'version');
  await at('att'); rt.ledcAttach('G25', 50, 14);
  await at('lock0'); await servoWrite(0);
  await at('msg'); rt.println('Door locked. Hold a card near the reader');
  for (;;) {
    await at('card');
    let uid = null;
    if (rt.dev('rfid', 'present')) uid = rt.dev('rfid', 'read');
    if (!uid) { await rt.yield(); continue; }
    await at('ok0'); let ok = uid.length === 4;
    await at('cmp');
    for (let i = 0; i < 4 && ok; i++) { await at('cmp2'); if (uid[i] !== allowed[i]) ok = false; }
    await at('if');
    if (ok) {
      await at('g1'); rt.println('Access granted: door open');
      await at('g2'); rt.digitalWrite('G16', 1);
      await at('g3'); await beep(150);
      await at('g4'); await servoWrite(90);
      await at('g5'); await rt.delay(3000);
      await at('g6'); await servoWrite(0);
      await at('g7'); rt.digitalWrite('G16', 0);
      await at('g8'); rt.println('Door locked');
    } else {
      await at('else');
      await at('d1'); rt.println('Access denied');
      await at('d2'); await beep(600);
    }
    await at('halt'); rt.dev('rfid', 'halt');
  }
};

const DR_BZ = [{ id: 'rz1', type: 'resistor', a: 'g20', b: 'g24', ohms: 220 }, { id: 'bz1', type: 'buzzer', active: true, plus: 'h24', minus: 'h27' }, fw('w8', 'G26', 'f20', 'orange', 24), jw('w9', 'i27', 'i11', 'black', 18)];
const DR_RF = [mod('rf1', 'mod_rfid', 30, 140), ...bb('rf1', [['3V3', '3V3'], ['RST', 'G27'], ['GND', null], ['MISO', 'G19'], ['MOSI', 'G23'], ['SCK', 'G18'], ['SDA', 'G5']], 17), jw('wg', 'b19', 'b15', 'black', 14)];
const DR_CIRCUIT = [...LED, ...SERVO, ...DR_BZ, ...DR_RF];
const DR_IDS = ids(DR_CIRCUIT);

function doorLesson() {
  const T = TAGS.h_door;
  return {
    module: MODULE, title: 'Project: a smart door (RFID card opens a servo lock)', level: 'Advanced', time: '45 min', fast: true,
    goal: 'Read an RFID card, compare its UID with an allowed one and, if it matches, move a servo, light an LED and beep; a wrong card gets a long beep. A learning demo, not a real lock.',
    hardware: ['ESP32 DevKit V1', 'RC522 RFID module with a card or tag', 'SG90 micro servo', 'Active buzzer and a 220 Ω resistor', 'LED and a 220 Ω resistor', 'Breadboard, jumper wires', 'Library: MFRC522 (miguelbalboa)'],
    code: CODE.h_door, file: 'SmartDoor.ino', program: 'h_door', widgets: ['dv:sv32', 'dv:rfid', 'dv:abuz'],
    circuit: DR_CIRCUIT,
    io: {
      ...SERVO_IO(DR_IDS), G16: { ...IO_LED, needs: DR_IDS },
      G26: { kind: 'dev:abuz', role: 'bz', item: 'bz1', mp: 'rz1.1', needs: DR_IDS, pw: [['bz1.-', 'GND']] },
      ...mio('rfid', 'rf1', DR_IDS, { G5: ['ss', 'rf1.SDA'], G27: ['rst', 'rf1.RST'], G23: ['mosi', 'rf1.MOSI'], G19: ['miso', 'rf1.MISO'], G18: ['sck', 'rf1.SCK'] }, [['rf1.3V3', '3V3'], ['rf1.GND', 'GND']]),
    },
    explain: byTag(T, {
      ssPin: 'The RC522 chip select (the SDA pin of the module). GPIO5 is the default chip select of the ESP32’s VSPI bus; it is also a strapping pin (pulled up at start-up), which the RC522 does not disturb here.', rstPin: 'The RC522 reset pin.', servoPin: 'The servo signal, GPIO25 as in the servo lesson.',
      allowed: 'The UID of the allowed card. A UID identifies a card but can be copied: it is not a secret. These bytes are the made-up UID of the simulator’s card A.', obj: 'The reader object (chip select and reset).',
      sw: 'The LEDC servo helper of the servo lesson: angle to pulse width to duty.', beep: 'A small helper: HIGH, wait, LOW. The delay blocks, which is fine for a short beep here.', att: 'Start the servo signal: 50 Hz, 14 bit.', lock0: 'Move the servo arm to 0 degrees = the “locked” position (in this simulator only the arm moves).',
      card: 'A new card in the field that can be read? If not, leave loop() and ask again.', cmp: 'Compare the 4 UID bytes one by one with the allowed card.', g4: 'Open: servo arm to 90 degrees.', g5: 'Stay open for 3 s, then lock again.', d2: 'A long beep for a wrong card.', halt: 'Stop talking to this card, so it is not read again and again.',
    }),
    steps: [
      STEP('A door that knows a card', 'scanv', [], `<p>Input: an <b>RFID reader</b> that gives the card’s UID. Decision: is it the <b>allowed</b> UID? Output: a <b>servo</b> moves a latch arm, an <b>LED</b> shows “open”, a <b>buzzer</b> confirms (short beep) or refuses (long beep).</p><p class="warn"><b>Learning demo, not a real lock.</b> A UID can be read and copied by anyone with a cheap reader, the code is in plain sight in the sketch, and an SG90 arm is not a door lock. The simulator moves a servo arm only: no door, latch, frame or bolt is modelled.</p>`),
      STEP('Voltages and the pin plan', 'scanv', ['rf1', 'sv1'], `<ul><li><b>RC522</b> (MFRC522 chip): supply <b>2.5 to 3.3 V</b>, SPI up to 10 Mbit/s (datasheet): connect it to <b>3V3</b>, never 5 V. The ESP32 SPI pins are 3.3 V, which matches the chip: no level shifter is needed.</li><li><b>SG90 servo</b>: operating voltage 4.8 V (about 5 V): it is fed from <b>VIN</b>, with the 3.3 V signal caveat of the servo lesson (the datasheet does not state a minimum signal level). Its current is not in the datasheet: a separate 5 V supply with common GND is the safe choice.</li><li><b>Pins</b>: SPI uses GPIO18 (SCK), 19 (MISO), 23 (MOSI) and 5 (chip select), RST is GPIO27, the servo GPIO25, the buzzer GPIO26, the LED GPIO16. None of them is GPIO0, 2, 12 or 15, and none is input only. GPIO5 is a strapping pin, but the RC522 is a normal SPI device that does not hold it low at start-up.</li></ul>`),
      STEP('Wire it', 'scanv', DR_IDS, `<ul><li>RC522 (module wires to row a, board pins to row b of the same column): 3V3 → b17, RST (GPIO27) to b18, GND module wire a19 joined to the ground column by a jumper b19 to b15, MISO (GPIO19) b20, MOSI (GPIO23) b21, SCK (GPIO18) b22, SDA (GPIO5) b23. IRQ stays unconnected.</li><li>Servo: brown (GND) j11, red (+5 V) j12, orange (signal) j13; GND → f11, VIN → f12 and GPIO25 to f13.</li><li>LED: GPIO16 to a10, GND to a15 (Lesson 2).</li><li>Buzzer: GPIO26 to f20 (resistor g20 to g24, buzzer + h24, buzzer − h27); a jumper i27 to i11 joins the buzzer − to the servo ground.</li></ul>`, { pins: ['3V3', 'VIN', 'GND1', 'GND2', 'G5', 'G16', 'G18', 'G19', 'G23', 'G25', 'G26', 'G27'] }),
      STEP('The code', 'scanv', DR_IDS, `<p>Click lines <b>${T.card}</b>, <b>${T.cmp}</b> and <b>${T.g4}</b>. Install the library <b>MFRC522</b> with the Library Manager. The servo needs no library.</p>`, { showCode: true, power: true }),
      STEP('Run it: right card, wrong card', 'scanv', DR_IDS, `<p>Press <b>▶ Run</b>. Use <b>Card A near</b> in the panel: “Access granted”, a short beep, the LED lights and the servo arm swings to 90 degrees for 3 s, then back. Take the card away. <b>Card B near</b> is not allowed: a long beep and “Access denied”, the servo does not move.</p><p class="sim">Simulated reader, cards, buzzer and servo. The two UIDs are made up. Servo pulse range and speed follow the datasheet figures (no load). Door mechanics are not modelled.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('From demo to real lock', 'scanv', DR_IDS, `<ul><li>Use a card system with authentication (not just the UID), keep the secret out of the sketch, log and rate-limit attempts.</li><li>A proper electric lock or strike with its own supply, a MOSFET or relay and a flyback diode.</li><li>Decide what happens on power loss (fail-safe or fail-secure).</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which supply does the RC522 chip need?', a: ['About 3.3 V (2.5 to 3.3 V)', '12 V', '5 V only', 'No supply'], c: 0, why: 'The MFRC522 datasheet gives 2.5 to 3.3 V.' },
      { q: 'Why is a card UID alone a weak password?', a: ['It can be read and copied', 'It is too long', 'It changes every second', 'The servo cannot read it'], c: 0, why: 'A UID identifies a card but is not secret.' },
      { q: 'Why is the servo fed from VIN while the RC522 is fed from 3V3?', a: ['The SG90 needs about 5 V, the RC522 chip is a 3.3 V part', 'VIN is for signals', 'The RC522 needs 12 V', 'Both are the same'], c: 0, why: 'SG90: 4.8 V; MFRC522: 2.5 to 3.3 V.' },
    ],
    sources: [S.mfrc, S.mfrclib, S.sg90, S.ledc, S.ds],
  };
}

// =================================================================================================================================
// 4. TWO-MOTOR ROBOT CAR
// =================================================================================================================================
const CR_SRC = `// Two-motor robot: stop, back up and turn when something is closer than 20 cm
const int enLeft = 25;       // L293D 1,2EN (PWM) //@enL
const int leftA = 26;        // 1A //@lA
const int leftB = 27;        // 2A //@lB
const int enRight = 32;      // L293D 3,4EN (PWM) //@enR
const int rightA = 33;       // 3A //@rA
const int rightB = 13;       // 4A //@rB
const int trigPin = 16;      //@trig
const int echoPin = 17;      // ECHO through a 1 k / 2 k divider //@echo
const int cruise = 200;      // speed 0 to 255 //@cruise
const int stopCm = 20;       //@stopCm

void drive(int l, int r) {   // -255 to 255, negative = backwards //@drive
  digitalWrite(leftA, l > 0); //@d1
  digitalWrite(leftB, l < 0); //@d2
  ledcWrite(enLeft, abs(l)); //@d3
  digitalWrite(rightA, r > 0); //@d4
  digitalWrite(rightB, r < 0); //@d5
  ledcWrite(enRight, abs(r)); //@d6
}

float readCm() {
  digitalWrite(trigPin, LOW); //@r1
  delayMicroseconds(2); //@r2
  digitalWrite(trigPin, HIGH); //@r3
  delayMicroseconds(10); //@r4
  digitalWrite(trigPin, LOW); //@r5
  long duration = pulseIn(echoPin, HIGH, 30000);   // 0 = no echo //@r6
  return duration / 58.0;      // microseconds to cm //@r7
}

void setup() {
  pinMode(leftA, OUTPUT); pinMode(leftB, OUTPUT); //@s1
  pinMode(rightA, OUTPUT); pinMode(rightB, OUTPUT); //@s2
  ledcAttach(enLeft, 1000, 8);     // pin, 1 kHz, 8 bit: duty 0 to 255 //@s3
  ledcAttach(enRight, 1000, 8); //@s4
  pinMode(trigPin, OUTPUT); //@s5
  pinMode(echoPin, INPUT); //@s6
  Serial.begin(115200); //@s7
}

void loop() {
  float cm = readCm(); //@l1
  if (cm > 0 && cm < stopCm) { //@l2
    drive(0, 0);                      // stop //@o1
    Serial.println("Obstacle: stop, back up, turn right"); //@o2
    delay(200); //@o3
    drive(-cruise, -cruise);          // back up //@o4
    delay(400); //@o5
    drive(cruise, -cruise);           // pivot right: left forward, right backward //@o6
    delay(500); //@o7
    drive(0, 0); //@o8
  } else { //@el
    drive(cruise, cruise); //@c1
    Serial.println("Clear: forward"); //@c2
  }
  delay(100); //@dl
}`;
reg('h_car', CR_SRC);
PROGRAMS.h_car = async (rt) => {
  const T = TAGS.h_car, at = atOf(rt, T);
  const drive = async (l, r) => {
    await at('drive');
    await at('d1'); rt.digitalWrite('G26', l > 0 ? 1 : 0);
    await at('d2'); rt.digitalWrite('G27', l < 0 ? 1 : 0);
    await at('d3'); rt.ledcWrite('G25', Math.abs(l));
    await at('d4'); rt.digitalWrite('G33', r > 0 ? 1 : 0);
    await at('d5'); rt.digitalWrite('G13', r < 0 ? 1 : 0);
    await at('d6'); rt.ledcWrite('G32', Math.abs(r));
  };
  await at('enL', 'lA', 'lB', 'enR', 'rA', 'rB', 'trig', 'echo', 'cruise', 'stopCm');
  await at('s1'); rt.pinMode('G26', 'OUTPUT'); rt.pinMode('G27', 'OUTPUT');
  await at('s2'); rt.pinMode('G33', 'OUTPUT'); rt.pinMode('G13', 'OUTPUT');
  await at('s3'); rt.ledcAttach('G25', 1000, 8);
  await at('s4'); rt.ledcAttach('G32', 1000, 8);
  await at('s5'); rt.pinMode('G16', 'OUTPUT');
  await at('s6'); rt.pinMode('G17', 'INPUT');
  await at('s7'); rt.serialBegin(115200);
  for (;;) {
    await at('l1');
    await at('r1'); rt.digitalWrite('G16', 0);
    await at('r2'); await rt.delayMicroseconds(2);
    await at('r3'); rt.digitalWrite('G16', 1);
    await at('r4'); await rt.delayMicroseconds(10);
    await at('r5'); rt.digitalWrite('G16', 0);
    await at('r6'); const duration = await rt.dev('sonar', 'pulse');
    await at('r7'); const cm = duration / 58.0;
    await at('l2');
    if (cm > 0 && cm < 20) {
      await at('o1'); await drive(0, 0);
      await at('o2'); rt.println('Obstacle: stop, back up, turn right');
      await at('o3'); await rt.delay(200);
      await at('o4'); await drive(-200, -200);
      await at('o5'); await rt.delay(400);
      await at('o6'); await drive(200, -200);
      await at('o7'); await rt.delay(500);
      await at('o8'); await drive(0, 0);
    } else {
      await at('el');
      await at('c1'); await drive(200, 200);
      await at('c2'); rt.println('Clear: forward');
    }
    await at('dl'); await rt.delay(100);
  }
};

// L293D on columns 12-19: pin 16 = e12 (VCC1), pins 1..8 = f12..f19, pins 9..16 = e19..e12; 1,2EN pin 1 = f12, 1A pin 2 = f13, 2A pin 7 = f18, 3,4EN pin 9 = e19, 3A pin 10 = e18, 4A pin 15 = e13
const CR_DRV = [
  { id: 'u1', type: 'l293d', col: 12 },
  { id: 'bat1', type: 'battery', x: 125, z: 12 }, { id: 'mot1', type: 'motor', x: 165, z: -26 }, { id: 'mot2', type: 'motor', x: 165, z: 30 },
  fw('w26', 'VIN', 'a12', 'red', 20), fw('w27', 'GND2', 'a15', 'black', 16),
  fw('w28', 'G25', 'j12', 'orange', 30), fw('w29', 'G26', 'j13', 'yellow', 34), fw('w30', 'G27', 'j18', 'blue', 38),
  fw('w44', 'G32', 'a19', 'white', 24), fw('w45', 'G33', 'a18', 'green', 28), fw('w46', 'G13', 'a13', 'violet', 32),
  { id: 'l1', type: 'lead', from: 'bat1.POS', to: 'j19', color: 'red', lift: 14 }, { id: 'l2', type: 'lead', from: 'bat1.NEG', to: 'j16', color: 'black', lift: 18 },
  { id: 'l3', type: 'lead', from: 'mot1.M1', to: 'j14', color: 'white', lift: 12 }, { id: 'l4', type: 'lead', from: 'mot1.M2', to: 'j17', color: 'green', lift: 16 },
  { id: 'l11', type: 'lead', from: 'mot2.M1', to: 'a17', color: 'white', lift: 14 }, { id: 'l12', type: 'lead', from: 'mot2.M2', to: 'a14', color: 'green', lift: 18 }];
// HC-SR04 on j23 (VCC), j24 (TRIG), j25 (ECHO), j26 (GND); ECHO (5 V) -> 1 k -> junction (col 28) -> 2 k -> GND; the junction goes to GPIO17
const CR_US = [
  { id: 'us1', type: 'hcsr04', row: 'j', col: 23 },
  jw('w40', 'b12', 'f23', 'red', 20), fw('w41', 'G16', 'f24', 'green', 26), jw('w43', 'b15', 'f26', 'black', 18),
  { id: 'ra', type: 'resistor', a: 'g25', b: 'g28', ohms: 1000 }, { id: 'rb', type: 'resistor', a: 'h28', b: 'h26', ohms: 2000 }, fw('w47', 'G17', 'j28', 'white', 30)];
const CR_CIRCUIT = [...CR_DRV, ...CR_US];
const CR_IDS = ids(CR_CIRCUIT);

function carLesson() {
  const T = TAGS.h_car, N = CR_IDS;
  return {
    module: MODULE, title: 'Project: a two-motor robot car that stops, backs up and turns', level: 'Advanced', time: '50 min', fast: true,
    goal: 'Drive two DC motors from one L293D with 3.3 V ESP32 signals, read an HC-SR04 safely through a voltage divider, and make the car stop, back up and pivot.',
    hardware: ['ESP32 DevKit V1', 'Breadboard', 'L293D motor driver', 'Two “130” DC hobby motors', '4 × AA battery holder', 'HC-SR04 ultrasonic sensor', '1 kΩ and 2 kΩ resistors (ECHO voltage divider)', 'Jumper wires'],
    code: CODE.h_car, file: 'TwoMotorRobot.ino', program: 'h_car', widgets: ['dv:sonar32', 'dv:car32'],
    circuit: CR_CIRCUIT,
    io: {
      ...mio('car32', 'mot1', N, { G25: ['en1', 'u1.p1', 'mot1'], G26: ['a1', 'u1.p2', 'mot1'], G27: ['b1', 'u1.p7', 'mot1'], G32: ['en2', 'u1.p9', 'mot2'], G33: ['a2', 'u1.p10', 'mot2'], G13: ['b2', 'u1.p15', 'mot2'] }, [['u1.p16', 'VIN'], ['u1.p4', 'GND'], ['bat1.NEG', 'GND']]),
      G16: { kind: 'dev:sonar32', role: 'trig', item: 'us1', mp: 'us1.TRIG', needs: N, pw: [['us1.VCC', 'VIN'], ['us1.GND', 'GND']] },
      G17: { kind: 'dev:sonar32', role: 'echo', item: 'us1', mp: 'rb.1', needs: N },
    },
    explain: byTag(T, {
      enL: 'Left motor: the enable pin (PWM sets the speed). GPIO25 is a normal output pin.', lA: 'Left motor input 1A…', lB: '…and 2A. 1A HIGH and 2A LOW = one direction; the opposite = the other.', enR: 'Right motor: the second half of the L293D, enable 3,4EN (PWM).',
      rA: 'Right motor input 3A…', rB: '…and 4A. GPIO13 is a normal pin; the strapping pins GPIO0, 2, 12 and 15 are avoided.', trig: 'Ultrasonic trigger. The 3.3 V pulse is used as it is (see the notes about the sensor).', echo: 'Echo input: the ECHO signal is 5 V, so it comes through a voltage divider (1 kΩ and 2 kΩ) that gives about 3.3 V.', cruise: 'Driving speed: 200 of 255 (about 78 % duty).',
      drive: 'One helper for both motors: positive = forward, negative = backwards, 0 = stopped. The function sets the two direction pins and the PWM of each side.', d3: 'LEDC PWM on the enable pin = speed (core 3.x: ledcWrite takes the pin).', s3: 'Core 3.x: ledcAttach(pin, frequency, resolution). 1 kHz is an example frequency.',
      r6: 'Time the echo. A timeout of 30 ms returns 0 when nothing comes back. (The simulator answers this line with its HC-SR04 model.)', r7: 'Microseconds to centimetres: divide by 58 (HC-SR04 datasheet).', l2: 'The decision: closer than 20 cm? A reading of 0 means no echo, so it is excluded.',
      o1: 'Stop (enable at 0: the motors coast).', o4: 'Back up for 0.4 s…', o6: 'Pivot right: the left motor forward and the right motor backward turn the car on the spot.', c1: 'Clear: both motors forward.',
    }),
    steps: [
      STEP('Why two motors turn a car', 'scanv', [], `<p>With <b>one</b> motor you can only go and stop. With <b>two</b> motors (one per side) you can steer by speed: both forward goes straight; one faster than the other curves; <b>opposite directions pivot</b> the car on the spot. The <b>L293D</b> has two H-bridges, so one chip drives both motors, and the sketch uses a helper <code>drive(left, right)</code>.</p><p class="warn"><b>The simulator has no wheels, chassis, ground or friction.</b> It spins two propellers and describes what a car with these two motors would do, assuming that 1A HIGH / 2A LOW and 3A HIGH / 4A LOW are “forward”.</p>`),
      STEP('3.3 V logic, 5 V parts and the limits', 'scanv', ['u1', 'us1'], `<ul><li><b>L293D</b> (TI datasheet SLRS008D): the logic supply VCC1 is <b>5 V</b> (from VIN), the motor supply VCC2 is the battery, <b>600 mA continuous</b> and 1.2 A peak per channel for the L293D, clamp diodes built in.</li><li><b>3.3 V inputs are accepted</b>: the datasheet gives a high-level input voltage of at least <b>2.3 V</b> (for VCC1 up to 7 V), and the ESP32 outputs about 3.3 V. This applies to the inputs and the enable pins.</li><li>The outputs are bipolar: the high side drops about 1.4 V (typical) at 0.6 A from the motor supply, so a 4 × AA pack (about 6 V) gives the motor clearly less than 6 V. The “130” motor stand-in is specified at lower voltages: check your motor.</li><li><b>HC-SR04</b>: powered from <b>5 V</b> (VIN). Its ECHO output is a 5 V-level TTL signal (the datasheet says “TTL level”; the swing follows the 5 V supply, typical). The <b>ESP32 pins are 3.3 V pins</b>: the chip datasheet allows an input voltage only up to 3.6 V, so 5 V on a GPIO can damage the chip. A <b>1 kΩ + 2 kΩ divider</b> gives 5 V × 2 / 3 = <b>3.3 V</b>.</li><li>The TRIG input gets a 3.3 V pulse here. The datasheet asks for a “10 µs TTL pulse” and gives no input voltage level: most people find 3.3 V works, but that is <b>not verified</b>.</li><li>${VIN_NOTE} The motor battery must stay a separate supply with its ground joined to the board ground (common ground).</li></ul>`),
      STEP('Wire it', 'scanv', N, `<ul><li>Power and ground: VIN → a12 (L293D pin 16, VCC1), GND → a15 (ground), motor battery + to j19 (pin 8, VCC2) and battery − to j16 (ground).</li><li>Left motor: GPIO25 to j12 (1,2EN), GPIO26 to j13 (1A), GPIO27 to j18 (2A); the motor between j14 (1Y) and j17 (2Y).</li><li>Right motor: GPIO32 to a19 (3,4EN), GPIO33 to a18 (3A), GPIO13 to a13 (4A); the motor between a17 (3Y) and a14 (4Y).</li><li>HC-SR04 on j23 (VCC), j24 (TRIG), j25 (ECHO), j26 (GND): a jumper b12 to f23 for 5 V, a jumper b15 to f26 for ground, GPIO16 to f24.</li><li>Voltage divider: 1 kΩ from g25 (ECHO) to g28, 2 kΩ from h28 to h26 (ground), and GPIO17 to j28 (the middle point).</li></ul><p class="sim">The simulator checks that these wires exist; the column choices are only one possible layout.</p>`, { pins: ['VIN', 'GND1', 'GND2', 'G13', 'G16', 'G17', 'G25', 'G26', 'G27', 'G32', 'G33'] }),
      STEP('The code', 'scanv', N, `<p>Click lines <b>${T.drive}</b> (one helper for both motors), <b>${T.l2}</b> (the decision) and <b>${T.o6}</b> (the pivot). Compare with the one-motor robot lessons: only <code>drive()</code> and the turn are new.</p>`, { showCode: true, power: true }),
      STEP('Run it: drive, meet an obstacle, turn', 'scanv', N, `<p>Press <b>▶ Run</b>. With the obstacle far (more than 20 cm) both propellers spin “forward”. Slide the <b>obstacle</b> closer than 20 cm: both motors stop, back up, then pivot (the panel says “turning on the spot”). Slide the obstacle away again to let the car continue.</p><p class="sim">The simulated car does not move, so its distance reading does not change when it turns: slide the obstacle yourself. The 0.4 s and 0.5 s timings are examples that you must tune on a real chassis. The simulator answers the pulseIn() line with its HC-SR04 model.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Next steps', 'scanv', N, `<ul><li>Two motors are never identical, so a car drifts; encoders or a gyro fix it.</li><li>Scan left and right with a servo (the servo lesson) and choose the freer side.</li><li>Use a separate supply for the motors and keep the common GND; add a 100 nF capacitor across each motor to reduce noise (common practice, not from the datasheet).</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Why does the HC-SR04 ECHO line go through a voltage divider on the ESP32?', a: ['ECHO is a 5 V signal and the ESP32 pins accept only up to about 3.3 V', 'ECHO is too slow', 'The divider makes the echo louder', 'The ESP32 has no input pins'], c: 0, why: 'The ESP32 datasheet allows at most 3.6 V on these pins.' },
      { q: 'Can 3.3 V signals drive the L293D inputs?', a: ['Yes: the datasheet high level starts at 2.3 V', 'No: it needs 5 V logic', 'Only with a divider', 'Only the enable pin'], c: 0, why: 'VIH min 2.3 V with VCC1 = 5 V.' },
      { q: 'How does a two-motor car turn on the spot?', a: ['The two motors run in opposite directions', 'Both run forward at the same speed', 'The L293D rotates', 'Only the sensor moves'], c: 0, why: 'Opposite directions give a pivot.' },
    ],
    sources: [S.l293, S.hcsr04, S.pulsein, S.motor130, S.ledc, S.ds],
  };
}

// =================================================================================================================================
export default {
  lessons: { u3: [], e32: [servoLesson(), alarmLesson(), doorLesson(), carLesson()], uq: [], pi: [] },
  modules: { u3: {}, e32: { [MODULE]: 'Module 100 — Projects: servo, alarm, smart door and robot car' }, uq: {}, pi: {} },
  programs: PROGRAMS,
  code: CODE,
  checks: CHECKS,
};

// Slot e: four PROJECT lessons that combine parts the lab already simulates.
//   1. Motion alarm (PIR + button + active buzzer + LED)           UNO R3, UNO Q
//   2. Smart door (RFID RC522 + SG90 servo + buzzer + LED)         UNO R3, UNO Q
//   3. Plant watering with a real pump (soil + MOSFET + diode)     UNO R3, UNO Q, ESP32
//   4. Two-motor robot car (2 x DC motor, L293D, HC-SR04)          UNO R3, UNO Q
// Not made for the ESP32 (no PIR, servo, L293D or HC-SR04 part exists there) and not for the Raspberry Pi (no part among them exists there).
// Listings are written with //@tag markers: the tags give the line numbers used by the programs, the explanations and the checks,
// so a listing, its simulated program and its line checks can never drift apart. The two extra simulated devices ('pump', 'car2')
// are in e_ui.js. Plain data only: no DOM or three.js imports.
import { SRC, LED_CIRCUIT, IO_LED, SERVO_PARTS, MOTOR_PARTS, CAR_PARTS, CAR_IO_M, PLANT_PARTS } from '../uno3/common.js';

const R = (t, u) => ({ t, u });
const S = {
  l293: SRC.l293, sg90: SRC.sg90, servolib: SRC.servolib, sr501: SRC.sr501, sr501guide: SRC.sr501guide, hcsr04: SRC.hcsr04, pulsein: SRC.pulsein,
  motor130: SRC.motor130, irlz44n: SRC.irlz44n, d1n4007: SRC.d1n4007, soil: SRC.soilsrc, millis: SRC.millis,
  mfrc: R('MFRC522 datasheet (NXP): 2.5 V to 3.3 V supply, SPI up to 10 Mbit/s', 'https://www.nxp.com/docs/en/data-sheet/MFRC522.pdf'),
  mfrclib: R('MFRC522 Arduino library (miguelbalboa)', 'https://github.com/miguelbalboa/rfid'),
  dsU3: SRC.ds,
  dsUq: R('Arduino UNO Q datasheet', 'https://docs.arduino.cc/hardware/uno-q/'),
  dsE32: R('Espressif ESP32 Series Datasheet', 'https://documentation.espressif.com/esp32_datasheet_en.pdf'),
};

const w = (id, from, to, color, lift = 12) => ({ id, type: 'wire', from, to, color, lift });
const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const ids = a => a.map(d => d.id);
const mod = (id, model, x = 20, z = 138) => ({ id, type: 'mod', model, x, z });

// ---- boards ----------------------------------------------------------------------------------------------------------------
const BOARD = {
  u3: { name: 'Arduino UNO R3', short: 'UNO R3', v: '5 V', ds: S.dsU3, led: 'D5' },
  uq: { name: 'Arduino UNO Q', short: 'UNO Q', v: '3.3 V', ds: S.dsUq, led: 'D5' },
  e32: { name: 'ESP32 DevKit V1', short: 'ESP32', v: '3.3 V', ds: S.dsE32, led: 'G16' },
};
const CAV_UQ = '<p class="warn">UNO Q: this lesson is checked in the simulator. Whether each library used here is available and works on the UNO Q (Zephyr core) is <b>not verified</b>: check the library pages before you build it.</p>';

// ---- listing helper ----------------------------------------------------------------------------------------------------------
/** Lines may end with  //@tag : the tag is removed and gives the line number (tags), and a line check is made for it. */
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

const STEP = (title, have, body, o = {}) => ({ title, view: 'scanv', have, power: false, body, ...o });
const mio = (kind, item, needs, map, pw) => { const o = {}; let first = true; for (const [pin, [role, mp, it]] of Object.entries(map)) { o[pin] = { kind: 'dev:' + kind, role, item: it || item, mp, needs }; if (first && pw) { o[pin].pw = pw; first = false; } } return o; };

// =================================================================================================================================
// 1. MOTION ALARM
// =================================================================================================================================
const ALARM_SRC = b => `// Learning demo: a motion alarm. NOT a real security product.
const int pirPin = 2;        // PIR OUT: about 3.3 V while it sees motion //@pirPin
const int armPin = 4;        // arm / disarm button, the other side goes to GND //@armPin
const int ledPin = 5;        // status LED //@ledPin
const int buzzerPin = 8;     // active buzzer, through 220 ohm //@buzPin
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
  Serial.begin(9600); //@ser
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
const A = {};
for (const k of ['u3', 'uq']) A[k] = reg('pj_alarm_' + k, ALARM_SRC(BOARD[k]));

PROGRAMS.e_pj_alarm = (T) => async (rt, o) => {
  const at = async (...n) => { for (const i of n) await rt.at(T[i]); };
  let armed = false, alarming = false, alarmStart = 0, lastButton = 1;
  await at('pirPin', 'armPin', 'ledPin', 'buzPin', 'warm', 'alarmMs');
  await at('m1'); rt.pinMode('D2', 'INPUT');
  await at('m2'); rt.pinMode('D4', 'INPUT_PULLUP');
  await at('m3'); rt.pinMode('D5', 'OUTPUT');
  await at('m4'); rt.pinMode('D8', 'OUTPUT');
  await at('ser'); rt.serialBegin(9600);
  await at('w1'); rt.println('PIR warming up (about 1 minute)...');
  await at('w2'); await rt.delay(o.warmupMs ?? 60000);
  await at('w3'); rt.println('Ready: DISARMED');
  for (;;) {
    await at('rd'); const button = rt.digitalRead('D4');
    await at('edge');
    if (button === 0 && lastButton === 1) {
      await at('tog'); armed = !armed;
      await at('clr'); alarming = false;
      await at('pr'); rt.println(armed ? 'ARMED' : 'DISARMED');
      await at('deb'); await rt.delay(50);
    }
    await at('last'); lastButton = button;
    await at('trig');
    if (armed && !alarming && rt.digitalRead('D2') === 1) {
      await at('al1'); alarming = true;
      await at('al2'); alarmStart = rt.millis();
      await at('al3'); rt.println('ALARM: motion while armed!');
    }
    await at('to');
    if (alarming && rt.millis() - alarmStart > 5000) {
      await at('to1'); alarming = false;
      await at('to2'); rt.println('Siren stopped');
    }
    await at('out1'); rt.digitalWrite('D8', alarming ? 1 : 0);
    await at('out2'); rt.digitalWrite('D5', alarming ? Math.floor(rt.millis() / 200) % 2 : (armed ? 1 : 0));
    await at('dl'); await rt.delay(20);
  }
};
PROGRAMS.e_pj_alarm_u3 = PROGRAMS.e_pj_alarm(TAGS.pj_alarm_u3);
PROGRAMS.e_pj_alarm_uq = PROGRAMS.e_pj_alarm(TAGS.pj_alarm_uq);
delete PROGRAMS.e_pj_alarm;

const A_PIR = [{ id: 'pir1', type: 'pir', x: 84, z: 34 }, fw('w20', 'pir1.GND', 'GND1', 'black', 24), fw('w21', 'pir1.OUT', 'D2', 'yellow', 44), fw('w22', 'pir1.VCC', '5V', 'red', 18)];
const A_BTN = [{ id: 'btn1', type: 'button', col: 20 }, w('w3', 'D4', 'a20', 'blue'), w('w4', 'j22', 'GND3', 'black', 14)];
const A_BZ = [{ id: 'rz1', type: 'resistor', a: 'c23', b: 'c27', ohms: 220 }, { id: 'bz1', type: 'buzzer', active: true, plus: 'e27', minus: 'e30' }, w('w8', 'D8', 'a23', 'orange'), w('w9', 'a30', 'b15', 'black', 20)];
const A_CIRCUIT = [...LED_CIRCUIT, ...A_BTN, ...A_BZ, ...A_PIR];
const A_IDS = ids(A_CIRCUIT);

function alarmLesson(bk) {
  const B = BOARD[bk], T = TAGS['pj_alarm_' + bk], uq = bk === 'uq';
  return {
    module: 70, title: 'Project: a motion alarm (PIR + buzzer, arm with a button)', level: 'Advanced', time: '40 min', fast: true,
    goal: 'Combine a PIR motion sensor, a button, an LED and an active buzzer into an alarm you can arm and disarm. A learning demo, not a security product.',
    hardware: [B.name, 'HC-SR501 PIR motion sensor', 'Push button', 'Active buzzer and a 220 Ω resistor', 'LED and a 220 Ω resistor (the LED circuit of the LED lesson)', 'Breadboard and jumper wires'],
    code: CODE['pj_alarm_' + bk], file: 'MotionAlarm.ino', program: 'e_pj_alarm_' + bk, widgets: ['pir', 'button', 'dv:abuz'],
    circuit: A_CIRCUIT,
    io: {
      D2: { kind: 'pir', item: 'pir1', needs: A_IDS }, D4: { kind: 'button', item: 'btn1', needs: A_IDS }, D5: { ...IO_LED, needs: A_IDS },
      D8: { kind: 'dev:abuz', role: 'bz', item: 'bz1', mp: 'rz1.1', needs: A_IDS, pw: [['bz1.-', 'GND']] },
    },
    explain: byTag(T, {
      pirPin: 'The PIR output (lesson on the HC-SR501): HIGH while it sees movement.', armPin: 'The arm/disarm button. It connects the pin to GND when pressed, so the pin uses the internal pull-up.',
      buzPin: 'The active buzzer has its own oscillator: HIGH = sound. A 220 Ω resistor is in series.', warm: 'The datasheet-based start-up time of the PIR: about one minute. The simulator shortens it to a few seconds.',
      edge: 'Act only on the moment of pressing (HIGH to LOW), not while the button is held.', tog: 'Each press flips armed / disarmed.', clr: 'Arming or disarming also silences a running alarm.',
      trig: 'The alarm starts only if the system is armed, is not already sounding, and the PIR says motion.', al2: 'Remember when it started, with millis() (no blocking delay, so the button still works).',
      to: 'After 5 s the siren stops by itself. If the PIR is still HIGH, it can trigger again at once.', out1: 'The buzzer follows the alarm state.', out2: 'LED: blinks during an alarm, steady when armed, off when disarmed.',
    }),
    steps: [
      STEP('Four parts, one state machine', [], `<p>Three <b>inputs</b> and two <b>outputs</b>: the PIR says “movement”, the button toggles <b>armed / disarmed</b>, the sketch remembers the state, and the buzzer and LED show it. The important idea is the <b>state</b>: the same movement means nothing when disarmed and an alarm when armed.</p><p class="warn"><b>This is a learning demo, not a real security product.</b> A PIR can miss a person who moves slowly, can be fooled by heat sources and sunlight, and the board has no tamper detection, no backup power and no connection to anyone. Anyone who can reach the button can disarm it.</p>`),
      STEP('The parts and their limits', ['pir1'], `<ul><li><b>HC-SR501 PIR</b>: powered from <b>5 V</b> (supply range 5 to 20 V in the datasheet), its output is about <b>3.3 V</b> when it sees motion${uq ? ', which matches the 3.3 V UNO Q pin' : ', a valid HIGH for the UNO R3'}; it needs about <b>1 minute</b> to start and detects <b>movement</b>, not a person standing still.</li><li><b>Active buzzer</b>: a steady HIGH is enough (the part has its own oscillator). Check that yours is rated for ${uq ? 'the 3.3 V pin (some 5 V types are quiet or silent at 3.3 V)' : '5 V'}.</li><li><b>Button</b>: to GND, the pin uses <code>INPUT_PULLUP</code>.</li></ul>`),
      STEP('Wire it', A_IDS, `<ul><li>LED circuit as in the LED lesson: D5 → a10, a15 → GND.</li><li>Button: D4 → a20, and the other side j22 → GND.</li><li>Buzzer: D8 → a23 (resistor to the buzzer +), and the buzzer − (column 30) is joined by a wire to the LED’s ground column (b15), so one GND pin serves both.</li><li>PIR (female jumpers): <b>VCC</b> to the 5V pin, <b>OUT</b> to D2, <b>GND</b> to the GND1 pin.</li></ul><p class="sim">The simulator checks that these wires exist; the breadboard column choices are only one possible layout.</p>`, { pins: ['D2', 'D4', 'D5', 'D8', '5V', 'GND1', 'GND2', 'GND3'] }),
      STEP('The code', A_IDS, `<p>Click lines <b>${T.edge}</b>, <b>${T.trig}</b> and <b>${T.to}</b>: the three decisions. <code>millis()</code> times the siren without blocking.</p>`, { showCode: true, power: true }),
      STEP('Run it: arm, trigger, disarm', A_IDS, `<p>Press <b>▶ Run</b> and wait for “Ready”. Wave the hand: nothing happens, because the system is <b>disarmed</b>. <b>Hold</b> the button (and release) to arm: the LED stays on. Wave again: the buzzer sounds and the LED blinks for 5 s. Press the button again to disarm.</p><p class="sim">Simulated PIR (warm-up shortened to a few seconds; a real HC-SR501 needs about a minute) and a simulated buzzer. The output hold time of the PIR (5 s here) is a simulator default: on the real module it is set by a trimmer. No siren loudness or range is modelled.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('What a real alarm needs', A_IDS, `<ul><li>Exit and entry delays, a tamper switch, a backup battery, and a way to notify someone.</li><li>A PIR is one sensor with false alarms and blind spots; real systems use several.</li><li>A button anyone can press is not authentication (a keypad or card would be a next step).</li></ul>${uq ? CAV_UQ : ''}`, { power: true }),
    ],
    quiz: [
      { q: 'Why does the sketch remember an “armed” state?', a: ['The same movement must mean different things when armed or disarmed', 'To save memory', 'The PIR needs it', 'The buzzer needs it'], c: 0, why: 'The state decides whether movement is an alarm.' },
      { q: 'Why is the siren timed with millis() instead of delay(5000)?', a: ['A delay would block the loop, so the button could not disarm during the siren', 'delay() does not work with buzzers', 'millis() is louder', 'It is required by the PIR'], c: 0, why: 'Non-blocking timing keeps the program responsive.' },
      { q: 'Is this a real security system?', a: ['No: it is a learning demo with many missing safety features', 'Yes, it is certified', 'Yes, if the buzzer is loud', 'Only at night'], c: 0, why: 'No tamper detection, backup power, notification or authentication.' },
    ],
    sources: [S.sr501, S.sr501guide, S.millis, B.ds],
  };
}

// =================================================================================================================================
// 2. SMART DOOR
// =================================================================================================================================
const DOOR_SRC = `#include <Servo.h>
#include <SPI.h>
#include <MFRC522.h>

const int ssPin = 10;        // RC522 SDA = chip select //@ssPin
const int rstPin = 8;        // RC522 RST //@rstPin
const int servoPin = 9;      // servo signal //@servoPin
const int ledPin = 5;        //@ledPin
const int buzzerPin = 4;     // active buzzer, through 220 ohm //@buzPin
const byte allowed[4] = {0xDE, 0xAD, 0xBE, 0xEF};   // the demo card A: a real UID is different //@allowed
const unsigned long openMs = 3000;                  // the door stays open 3 s //@openMs

MFRC522 rfid(ssPin, rstPin); //@obj
Servo door;

void beep(int ms) { //@beep
  digitalWrite(buzzerPin, HIGH); //@b1
  delay(ms); //@b2
  digitalWrite(buzzerPin, LOW); //@b3
}

void setup() {
  pinMode(ledPin, OUTPUT); //@m1
  pinMode(buzzerPin, OUTPUT); //@m2
  Serial.begin(9600); //@ser
  SPI.begin(); //@spi
  rfid.PCD_Init(); //@init
  door.attach(servoPin); //@att
  door.write(0);                // 0 degrees = locked (your mechanics decide) //@lock0
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
    door.write(90);             // open //@g4
    delay(openMs); //@g5
    door.write(0);              // lock again //@g6
    digitalWrite(ledPin, LOW); //@g7
    Serial.println("Door locked"); //@g8
  } else { //@else
    Serial.println("Access denied"); //@d1
    beep(600); //@d2
  }
  rfid.PICC_HaltA(); //@halt
}`;
const D = {};
for (const k of ['u3', 'uq']) D[k] = reg('pj_door_' + k, DOOR_SRC);

PROGRAMS.e_pj_door = (T) => async (rt) => {
  const at = async (...n) => { for (const i of n) await rt.at(T[i]); };
  const allowed = [0xDE, 0xAD, 0xBE, 0xEF];
  const beep = async ms => { await at('beep'); await at('b1'); rt.digitalWrite('D4', 1); await at('b2'); await rt.delay(ms); await at('b3'); rt.digitalWrite('D4', 0); };
  await at('ssPin', 'rstPin', 'servoPin', 'ledPin', 'buzPin', 'allowed', 'openMs', 'obj');
  await at('m1'); rt.pinMode('D5', 'OUTPUT');
  await at('m2'); rt.pinMode('D4', 'OUTPUT');
  await at('ser'); rt.serialBegin(9600);
  await at('spi');
  await at('init'); rt.dev('rfid', 'version');
  await at('att'); rt.servoAttach('D9');
  await at('lock0'); rt.servoWrite('D9', 0);
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
      await at('g2'); rt.digitalWrite('D5', 1);
      await at('g3'); await beep(150);
      await at('g4'); rt.servoWrite('D9', 90);
      await at('g5'); await rt.delay(3000);
      await at('g6'); rt.servoWrite('D9', 0);
      await at('g7'); rt.digitalWrite('D5', 0);
      await at('g8'); rt.println('Door locked');
    } else {
      await at('else');
      await at('d1'); rt.println('Access denied');
      await at('d2'); await beep(600);
    }
    await at('halt'); rt.dev('rfid', 'halt');
  }
};
PROGRAMS.e_pj_door_u3 = PROGRAMS.e_pj_door(TAGS.pj_door_u3);
PROGRAMS.e_pj_door_uq = PROGRAMS.e_pj_door(TAGS.pj_door_uq);
delete PROGRAMS.e_pj_door;

const D_RF = [mod('rf1', 'mod_rfid', 30, 140), fw('f1', 'rf1.3V3', '3V3', 'orange', 24), fw('f2', 'rf1.GND', 'GND1', 'black', 30), fw('f3', 'rf1.RST', 'D8', 'white', 36), fw('f4', 'rf1.SDA', 'D10', 'green', 42), fw('f5', 'rf1.MOSI', 'D11', 'blue', 48), fw('f6', 'rf1.MISO', 'D12', 'violet', 54), fw('f7', 'rf1.SCK', 'D13', 'yellow', 60)];
const D_BZ = [{ id: 'rz1', type: 'resistor', a: 'c19', b: 'c23', ohms: 220 }, { id: 'bz1', type: 'buzzer', active: true, plus: 'e23', minus: 'e26' }, w('w8', 'D4', 'a19', 'orange'), w('w9', 'a26', 'b15', 'black', 20)];
const D_CIRCUIT = [...LED_CIRCUIT, ...SERVO_PARTS, ...D_BZ, ...D_RF];
const D_IDS = ids(D_CIRCUIT);

function doorLesson(bk) {
  const B = BOARD[bk], T = TAGS['pj_door_' + bk], uq = bk === 'uq';
  const rfIo = mio('rfid', 'rf1', D_IDS, { D10: ['ss', 'SDA'], D8: ['rst', 'RST'], D11: ['mosi', 'MOSI'], D12: ['miso', 'MISO'], D13: ['sck', 'SCK'] }, [['rf1.3V3', '3V3'], ['rf1.GND', 'GND']]);
  return {
    module: 70, title: 'Project: a smart door (RFID card opens a servo lock)', level: 'Advanced', time: '45 min', fast: true,
    goal: 'Read an RFID card, compare its UID with an allowed one and, if it matches, move a servo, light an LED and beep; a wrong card gets a long beep. A learning demo, not a real lock.',
    hardware: [B.name, 'RC522 RFID module with a card or tag', 'SG90 micro servo', 'Active buzzer and a 220 Ω resistor', 'LED and a 220 Ω resistor', 'Breadboard, jumper wires', 'Libraries: Servo, MFRC522 (miguelbalboa)'],
    code: CODE['pj_door_' + bk], file: 'SmartDoor.ino', program: 'e_pj_door_' + bk, widgets: ['servo', 'dv:rfid', 'dv:abuz'],
    circuit: D_CIRCUIT,
    io: { D9: { kind: 'servo', item: 'sv1', needs: D_IDS }, D5: { ...IO_LED, needs: D_IDS }, D4: { kind: 'dev:abuz', role: 'bz', item: 'bz1', mp: 'rz1.1', needs: D_IDS, pw: [['bz1.-', 'GND']] }, ...rfIo },
    explain: byTag(T, {
      ssPin: 'The RC522 chip select (the SDA pin of the module). SPI uses pins 11, 12 and 13.', rstPin: 'The RC522 reset pin. Pin 9 is kept free for the servo.', servoPin: 'The servo signal, pin 9 as in the servo lesson.',
      allowed: 'The UID of the allowed card. A UID identifies a card but can be copied: it is not a secret. These bytes are the made-up UID of the simulator’s card A.', obj: 'The reader object (chip select and reset).',
      beep: 'A small helper: HIGH, wait, LOW. The delay blocks, which is fine for a short beep here.', att: 'Start the servo signal on pin 9.', lock0: 'Move the servo arm to 0 degrees = the “locked” position (in this simulator only the arm moves).',
      card: 'A new card in the field that can be read? If not, leave loop() and ask again.', cmp: 'Compare the 4 UID bytes one by one with the allowed card.', g4: 'Open: servo arm to 90 degrees.', g5: 'Stay open for 3 s, then lock again.', d2: 'A long beep for a wrong card.', halt: 'Stop talking to this card, so it is not read again and again.',
    }),
    steps: [
      STEP('A door that knows a card', [], `<p>Input: an <b>RFID reader</b> that gives the card’s UID. Decision: is it the <b>allowed</b> UID? Output: a <b>servo</b> moves a latch arm, an <b>LED</b> shows “open”, a <b>buzzer</b> confirms (short beep) or refuses (long beep).</p><p class="warn"><b>Learning demo, not a real lock.</b> A UID can be read and copied by anyone with a cheap reader, the code is in plain sight in the sketch, and an SG90 arm is not a door lock. The simulator moves a servo arm only: no door, latch, frame or bolt is modelled.</p>`),
      STEP('Voltages and the pin plan', ['rf1', 'sv1'], `<ul><li><b>RC522</b> (MFRC522 chip): supply <b>2.5 to 3.3 V</b>, SPI up to 10 Mbit/s (datasheet): connect it to <b>3V3</b>, never 5 V.${uq ? ' The UNO Q SPI pins give 3.3 V, which matches the chip.' : ' The UNO R3 drives the SPI lines at 5 V, but the chip is a 3.3 V part. Many tutorials connect them directly, which is outside what the datasheet promises: a level shifter is the safe choice.'}</li><li><b>SG90 servo</b>: operating voltage 4.8 V (about 5 V), speed 0.1 s per 60 degrees, stall torque 1.8 kgf·cm (datasheet). It is powered from the <b>5V</b> pin here; its signal is ${uq ? 'a 3.3 V pin (the SG90 datasheet gives no logic level for the signal: 3.3 V usually works, <b>not verified</b>)' : 'a 5 V pin'}.</li><li>The RC522 reset moves to pin 8 so that pin 9 is free for the servo. Pins 11 to 13 are the SPI bus.</li></ul><p class="warn">The servo and the board share the USB 5 V here only for the demo. In a real build give the servo its own 5 V supply (common GND): a moving or blocked servo can draw much more current than a data pin or a USB port should supply.</p>`),
      STEP('Wire it', D_IDS, `<ul><li>RC522 (female jumpers): 3V3 to <b>3V3</b>, GND to <b>GND1</b>, RST to <b>D8</b>, SDA to <b>D10</b>, MOSI to <b>D11</b>, MISO to <b>D12</b>, SCK to <b>D13</b>. IRQ stays unconnected.</li><li>Servo: brown (GND) j11, red (+5 V) j12, orange (signal) j13; wires f11 → GND, f12 → 5V and D9 → f13.</li><li>LED: D5 → a10, a15 → GND (LED lesson).</li><li>Buzzer: D4 → a19; the buzzer − (column 26) is joined to the LED ground column (b15).</li></ul>`, { pins: ['3V3', 'GND1', 'GND2', 'GND3', '5V', 'D4', 'D5', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'] }),
      STEP('The code', D_IDS, `<p>Click lines <b>${T.card}</b>, <b>${T.cmp}</b> and <b>${T.g4}</b>. Install the libraries <b>MFRC522</b> and <b>Servo</b> with the Library Manager.</p>`, { showCode: true, power: true }),
      STEP('Run it: right card, wrong card', D_IDS, `<p>Press <b>▶ Run</b>. Use <b>Card A near</b> in the panel: “Access granted”, a short beep, the LED lights and the servo arm swings to 90 degrees for 3 s, then back. Take the card away. <b>Card B near</b> is not allowed: a long beep and “Access denied”, the servo does not move.</p><p class="sim">Simulated reader, cards and servo. The two UIDs are made up. Servo speed follows the datasheet figure (no load). Door mechanics are not modelled.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('From demo to real lock', D_IDS, `<ul><li>Use a card system with authentication (not just the UID), keep the secret out of the sketch, log and rate-limit attempts.</li><li>A proper electric lock or strike with its own supply, a MOSFET or relay and a flyback diode.</li><li>Decide what happens on power loss (fail-safe or fail-secure).</li></ul>${uq ? CAV_UQ : ''}`, { power: true }),
    ],
    quiz: [
      { q: 'Which supply does the RC522 chip need?', a: ['About 3.3 V (2.5 to 3.3 V)', '12 V', '5 V only', 'No supply'], c: 0, why: 'The MFRC522 datasheet gives 2.5 to 3.3 V.' },
      { q: 'Why is a card UID alone a weak password?', a: ['It can be read and copied', 'It is too long', 'It changes every second', 'The servo cannot read it'], c: 0, why: 'A UID identifies a card but is not secret.' },
      { q: 'Why does this project move the RC522 reset pin to pin 8?', a: ['Pin 9 is needed for the servo signal', 'Pin 9 does not exist', 'The RC522 only works on pin 8', 'To save power'], c: 0, why: 'The pins are shared out between the SPI bus, the servo, the buzzer and the LED.' },
    ],
    sources: [S.mfrc, S.mfrclib, S.sg90, S.servolib, B.ds],
  };
}

// =================================================================================================================================
// 3. PLANT WATERING WITH A REAL PUMP
// =================================================================================================================================
const PL = {
  u3: { soil: 'A0', pump: 'D9', dry: 512, wet: 205, baud: 9600, adc: '', pin: 'D9', apin: 'A0', sup: '5V' },
  uq: { soil: 'A0', pump: 'D9', dry: 12412, wet: 4965, baud: 9600, adc: ' analogReadResolution(14);', pin: 'D9', apin: 'A0', sup: '3V3' },
  e32: { soil: '34', pump: '25', dry: 3102, wet: 1241, baud: 115200, adc: '', pin: 'G25', apin: 'G34', sup: '3V3' },
};
const PLANT_SRC = P => `// Plant watering with a real pump: soil sensor, MOSFET, pump motor
const int soilPin = ${P.soil};       // capacitive soil sensor //@soilPin
const int pumpPin = ${P.pump};       // to the MOSFET gate through 220 ohm //@pumpPin
const int dryValue = ${P.dry};     // reading in dry air: calibrate yours //@dry
const int wetValue = ${P.wet};     // reading in water: calibrate yours //@wet
const int onBelow = 30;           // start watering below 30 % //@on
const int offAbove = 60;          // stop above 60 % //@off
const unsigned long maxRunMs = 12000;   // safety: never run longer than this //@maxRun
const unsigned long restMs = 20000;     // pause after a timeout //@rest
bool pumpOn = false;
bool fault = false;
unsigned long startedAt = 0;
unsigned long faultAt = 0;

void setup() {
  pinMode(pumpPin, OUTPUT); //@s1
  digitalWrite(pumpPin, LOW);   // pump off at start //@s2
  Serial.begin(${P.baud});${P.adc} //@s3
}

void loop() {
  int raw = analogRead(soilPin); //@l1
  int pct = constrain(map(raw, dryValue, wetValue, 0, 100), 0, 100); //@l2
  if (!fault) { //@f0
    if (pct < onBelow && !pumpOn) { pumpOn = true; startedAt = millis(); } //@on1
    if (pct > offAbove) pumpOn = false; //@off1
    if (pumpOn && millis() - startedAt > maxRunMs) { pumpOn = false; fault = true; faultAt = millis(); } //@tmo
  } else if (millis() - faultAt > restMs) { //@rs0
    fault = false; //@rs1
  }
  digitalWrite(pumpPin, pumpOn ? HIGH : LOW); //@w
  Serial.print("moisture "); //@p1
  Serial.print(pct); //@p2
  Serial.println(pumpOn ? " %  pump ON" : fault ? " %  pump OFF (timeout)" : " %  pump off"); //@p3
  delay(1000); //@dl
}`;
const PLK = {};
for (const k of ['u3', 'uq', 'e32']) PLK[k] = reg('pj_plant_' + k, PLANT_SRC(PL[k]));

PROGRAMS.e_pj_plant = (T, P) => async (rt) => {
  const at = async (...n) => { for (const i of n) await rt.at(T[i]); };
  let pumpOn = false, fault = false, startedAt = 0, faultAt = 0;
  await at('soilPin', 'pumpPin', 'dry', 'wet', 'on', 'off', 'maxRun', 'rest');
  await at('s1'); rt.pinMode(P.pin, 'OUTPUT');
  await at('s2'); rt.digitalWrite(P.pin, 0);
  await at('s3'); rt.serialBegin(P.baud); if (P.adc) rt.analogReadResolution(14);
  for (;;) {
    await at('l1'); const raw = rt.analogRead(P.apin);
    await at('l2'); const pct = Math.min(100, Math.max(0, rt.map(raw, P.dry, P.wet, 0, 100)));
    await at('f0');
    if (!fault) {
      await at('on1'); if (pct < 30 && !pumpOn) { pumpOn = true; startedAt = rt.millis(); }
      await at('off1'); if (pct > 60) pumpOn = false;
      await at('tmo'); if (pumpOn && rt.millis() - startedAt > 12000) { pumpOn = false; fault = true; faultAt = rt.millis(); }
    } else {
      await at('rs0');
      if (rt.millis() - faultAt > 20000) { await at('rs1'); fault = false; }
    }
    await at('w'); rt.digitalWrite(P.pin, pumpOn ? 1 : 0);
    await at('p1'); rt.print('moisture ');
    await at('p2'); rt.print(pct);
    await at('p3'); rt.println(pumpOn ? ' %  pump ON' : fault ? ' %  pump OFF (timeout)' : ' %  pump off');
    await at('dl'); await rt.delay(1000);
  }
};
for (const k of ['u3', 'uq', 'e32']) PROGRAMS['e_pj_plant_' + k] = PROGRAMS.e_pj_plant(TAGS['pj_plant_' + k], PL[k]);
delete PROGRAMS.e_pj_plant;

// R3 / UNO Q: the MOSFET + diode + motor circuit of the fan lesson, plus the soil sensor of the plant lesson (5 V on R3, 3V3 on the UNO Q)
const P_FAN = [
  { id: 'q1', type: 'mosfet', row: 'e', col: 10 }, { id: 'r1', type: 'resistor', a: 'a5', b: 'a10', ohms: 220 }, w('w1', 'D9', 'b5', 'yellow', 24),
  { id: 'r2', type: 'resistor', a: 'd10', b: 'd12', ohms: 10000 }, w('w2', 'GND2', 'b12', 'black', 18),
  { id: 'dio1', type: 'diode', a: 'b11', k: 'b14' },
  { id: 'bat1', type: 'battery', x: 45, z: 120 }, { id: 'mot1', type: 'motor', x: -40, z: 116, rotY: Math.PI },
  { id: 'l1', type: 'lead', from: 'bat1.POS', to: 'c14', color: 'red', lift: 14 }, { id: 'l2', type: 'lead', from: 'mot1.M1', to: 'd14', color: 'white', lift: 12 },
  { id: 'l3', type: 'lead', from: 'mot1.M2', to: 'c11', color: 'green', lift: 16 }, { id: 'l4', type: 'lead', from: 'bat1.NEG', to: 'c12', color: 'black', lift: 18 }];
const P_SOIL_UQ = PLANT_PARTS.map(d => (d.id === 'w91' ? { ...d, from: 'soil1.VCC', to: '3V3' } : d));
const P_CIRCUIT = { u3: [...P_FAN, ...PLANT_PARTS], uq: [...P_FAN, ...P_SOIL_UQ] };
// ESP32: male header pins, so everything goes through the breadboard (module pin to row a, board pin to row b of the same column)
const PE_SOIL = [{ id: 'soil1', type: 'soil', x: 20, z: 138 },
  ...['VCC', 'GND', 'AOUT'].map((n, i) => fw('m9' + i, 'soil1.' + n, 'a' + (20 + i), { VCC: 'red', GND: 'black', AOUT: 'yellow' }[n], 16 + i * 2)),
  ...['VCC', 'GND', 'AOUT'].map((n, i) => fw('w9' + i, { VCC: '3V3', GND: 'GND1', AOUT: 'G34' }[n], 'b' + (20 + i), { VCC: 'red', GND: 'black', AOUT: 'yellow' }[n], 22 + i * 3))];
const PE_FAN = [
  { id: 'q1', type: 'mosfet', row: 'e', col: 10 }, { id: 'r1', type: 'resistor', a: 'a5', b: 'a10', ohms: 220 }, fw('w1', 'G25', 'b5', 'yellow', 24),
  { id: 'r2', type: 'resistor', a: 'd10', b: 'd12', ohms: 10000 }, fw('w2', 'GND2', 'b12', 'black', 18),
  { id: 'dio1', type: 'diode', a: 'b11', k: 'b14' },
  { id: 'bat1', type: 'battery', x: 125, z: 12 }, { id: 'mot1', type: 'motor', x: 165, z: -26 },
  { id: 'l1', type: 'lead', from: 'bat1.POS', to: 'c14', color: 'red', lift: 14 }, { id: 'l2', type: 'lead', from: 'mot1.M1', to: 'd14', color: 'white', lift: 12 },
  { id: 'l3', type: 'lead', from: 'mot1.M2', to: 'c11', color: 'green', lift: 16 }, { id: 'l4', type: 'lead', from: 'bat1.NEG', to: 'c12', color: 'black', lift: 18 }];
P_CIRCUIT.e32 = [...PE_FAN, ...PE_SOIL];

function plantLesson(bk) {
  const B = BOARD[bk], P = PL[bk], T = TAGS['pj_plant_' + bk], C = P_CIRCUIT[bk], CI = ids(C), e32 = bk === 'e32', uq = bk === 'uq';
  const pumpIo = { kind: 'dev:pump', role: 'gate', item: 'mot1', mp: 'r1.1', needs: CI, pw: [['q1.S', 'GND']] };
  const gate3v3 = `<p class="warn">The IRLZ44N datasheet gives its on-resistance at gate voltages of 4 V and above and <b>none at 3.3 V</b>. A ${B.short} pin gives only 3.3 V, so a small pump works but a bigger one is <b>not guaranteed</b> and the MOSFET may run hot: use a MOSFET specified for 3.3 V gate drive for anything bigger.</p>`;
  return {
    module: 71, title: 'Project: plant watering with a real pump (MOSFET, flyback diode, safety timeout)', level: 'Advanced', time: '45 min', fast: true,
    goal: 'Upgrade the LED-stand-in plant controller: a soil sensor decides with two thresholds, a MOSFET switches a pump motor with a flyback diode, and a timeout stops a pump that does not help.',
    hardware: [B.name, 'Capacitive soil moisture sensor', 'IRLZ44N MOSFET, 220 Ω and 10 kΩ resistors, 1N4007 diode', 'Small DC pump (a “130” motor stands in for it here) and its own battery pack', 'Breadboard, jumper wires'],
    code: CODE['pj_plant_' + bk], file: 'PumpWatering.ino', program: 'e_pj_plant_' + bk, widgets: ['soilsens', 'dv:pump'],
    circuit: C, io: { [P.pin]: pumpIo, [P.apin]: { kind: 'soil', item: 'soil1', needs: CI } },
    explain: byTag(T, {
      soilPin: 'The soil sensor on an analog input.', pumpPin: 'The pin to the MOSFET gate (through 220 Ω, with a 10 kΩ pull-down so the pump stays off while the board resets).',
      dry: 'Your calibration: the reading in dry air.', wet: 'Your calibration: the reading in water. The sensor’s voltage falls as it gets wetter.', on: 'Hysteresis: start below 30 %…', off: '…stop above 60 %. Between the two the state does not change.',
      maxRun: 'Safety timeout: if the pump has run this long and the soil is still not wet, something is wrong (empty tank, blocked tube, broken sensor).', rest: 'After a timeout, wait before trying again, instead of running the pump dry for ever.',
      s2: 'Make sure the pump is off at start-up.', l2: 'Convert the reading to percent between your two calibration values.', on1: 'Start only if it is dry and the pump is not already running; remember the start time.',
      tmo: 'The timeout check: too long running means a fault, so stop the pump.', rs0: 'While in fault, only wait for the rest time.', w: 'Write the decision to the MOSFET gate.',
    }),
    steps: [
      STEP('From an LED to a real pump', [], `<p>The earlier plant lesson let an LED stand in for the pump. Here the output is a <b>pump motor</b> switched by a <b>logic-level MOSFET</b>, with the pieces a real pump needs: its <b>own supply</b> (the pin can supply only a small current), a <b>flyback diode</b> across the motor, and a <b>safety timeout</b>.</p><p class="sim">In the simulator a small “130” DC motor stands in for the pump. <b>No water, tube, tank level or flow is modelled</b>; the soil’s response to watering is an assumption set in the panel (see below). Check the datasheet of your real pump, and do not run a pump dry unless its maker says it may.</p>`),
      STEP('The circuit', C.filter(d => ['q1', 'r1', 'r2', 'dio1', 'bat1', 'mot1'].includes(d.id)).map(d => d.id), `<ul><li>${P.pin === 'D9' ? 'Pin 9' : 'GPIO25'} → <b>220 Ω</b> → MOSFET gate; a <b>10 kΩ</b> from gate to GND.</li><li>Pump (motor) between the battery + and the <b>drain</b>; battery − joins the source and the board GND (common ground).</li><li><b>1N4007</b> across the motor, band toward the battery + (datasheet: 1 A average forward current): a motor is an inductor, and the diode absorbs the spike when the MOSFET switches off.</li></ul>${e32 || uq ? gate3v3 : '<p>The IRLZ44N is a logic-level MOSFET: its datasheet gives 25 mΩ at 5 V gate voltage, so a 5 V pin drives it fully.</p>'}<p class="warn">The motor figures of the stand-in (about 70 mA no load, 250 mA loaded, 500 mA stall, from the vendor page) are not those of your pump. Never power a pump from the board.</p>`),
      STEP('Wire it', CI, e32 ? `<ul><li>Soil sensor: module pins to row a (VCC a20, GND a21, AOUT a22); board pins in row b: 3V3 to b20, GND1 to b21, GPIO34 to b22.</li><li>MOSFET: GPIO25 to b5 (the 220 Ω resistor goes to the gate), GND to b12.</li><li>The pump circuit is separate: battery + to the motor and the diode band, the motor’s other wire to the drain (column 11), battery − to the source column 12.</li></ul>` : `<ul><li>Soil sensor (female jumpers): VCC to <b>${P.sup}</b>, GND to <b>GND1</b>, AOUT to <b>A0</b>.</li><li>MOSFET: D9 → b5 (the 220 Ω resistor goes to the gate), b12 → GND.</li><li>The pump circuit is separate: battery + to the motor and the diode band, the motor’s other wire to the drain (column 11), battery − to the source column 12.</li></ul>`, { pins: e32 ? ['G34', '3V3', 'GND1', 'G25', 'GND2'] : ['A0', P.sup, 'GND1', 'D9', 'GND2'] }),
      STEP('The code', CI, `<p>Click lines <b>${T.on1}</b> to <b>${T.tmo}</b>: start, stop and timeout. Two thresholds (hysteresis) stop the pump from chattering; the timeout stops it from running for ever.</p>`, { showCode: true, power: true }),
      STEP('Run it: watch the loop close', CI, `<p>Press <b>▶ Run</b>. The soil starts <b>dry</b>: the pump starts, and the moisture rises. At about 60 % the pump stops. Drag the moisture down below 30 % to start it again. Now press <b>Water tank: EMPTY</b> in the pump panel, make the soil dry: the pump runs, the soil does not improve, and after the 12 s timeout the sketch stops it and rests 20 s.</p><p class="sim">Assumptions of the simulator (not measurements): the soil gains 8 % moisture per second while the pump runs with water, and loses 0.5 % per second otherwise. The pump starts above about 25 % duty (typical, not a measurement). Timeout and rest times are examples.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', CI, `<ul><li>Sensor + decision + switched output, with two thresholds.</li><li>A pump needs its own supply, a MOSFET (or relay), a flyback diode and a common ground.</li><li>Always add a timeout: a pump that runs without effect is a fault, not a watering.</li></ul>${uq ? CAV_UQ : ''}`, { power: true }),
    ],
    quiz: [
      { q: 'What is the flyback diode for?', a: ['It absorbs the voltage spike when the motor current is switched off', 'It makes the pump faster', 'It measures the moisture', 'It is decoration'], c: 0, why: 'A motor is an inductor.' },
      { q: 'Why does the sketch have a maximum run time?', a: ['A pump that runs without making the soil wet signals a fault, such as an empty tank', 'The MOSFET only works for 12 s', 'Soil sensors need a break', 'To save memory'], c: 0, why: 'Otherwise it could run dry for ever.' },
      { q: e32 || uq ? 'Why is the MOSFET gate drive a concern on this board?' : 'Why does the pump have its own battery?', a: e32 || uq ? ['The pin gives 3.3 V and the datasheet has no on-resistance value there', 'The pin is 12 V', 'MOSFETs need AC', 'It is not a concern'] : ['A pin can supply only a small current; the pump needs more', 'Pumps need AC', 'Batteries are cheaper', 'The pin is 12 V'], c: 0, why: e32 || uq ? 'Use a MOSFET specified for 3.3 V gate drive for bigger loads.' : 'The pump current comes from the battery, the pin only drives the gate.' },
    ],
    sources: [S.soil, S.irlz44n, S.d1n4007, S.motor130, S.millis, B.ds],
  };
}

// =================================================================================================================================
// 4. TWO-MOTOR ROBOT CAR
// =================================================================================================================================
const CAR_SRC = `// Two-motor robot: stop, back up and turn when something is closer than 20 cm
const int enLeft = 5;        // L293D 1,2EN (PWM) //@enL
const int leftA = 7;         // 1A //@lA
const int leftB = 8;         // 2A //@lB
const int enRight = 6;       // L293D 3,4EN (PWM) //@enR
const int rightA = 9;        // 3A //@rA
const int rightB = 10;       // 4A //@rB
const int trigPin = 3;       //@trig
const int echoPin = 2;       //@echo
const int cruise = 200;      // speed 0 to 255 //@cruise
const int stopCm = 20;       //@stopCm

void drive(int l, int r) {   // -255 to 255, negative = backwards //@drive
  digitalWrite(leftA, l > 0); //@d1
  digitalWrite(leftB, l < 0); //@d2
  analogWrite(enLeft, abs(l)); //@d3
  digitalWrite(rightA, r > 0); //@d4
  digitalWrite(rightB, r < 0); //@d5
  analogWrite(enRight, abs(r)); //@d6
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
  pinMode(enLeft, OUTPUT); pinMode(leftA, OUTPUT); pinMode(leftB, OUTPUT); //@s1
  pinMode(enRight, OUTPUT); pinMode(rightA, OUTPUT); pinMode(rightB, OUTPUT); //@s2
  pinMode(trigPin, OUTPUT); //@s3
  pinMode(echoPin, INPUT); //@s4
  Serial.begin(9600); //@s5
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
const CK = {};
for (const k of ['u3', 'uq']) CK[k] = reg('pj_car_' + k, CAR_SRC);

PROGRAMS.e_pj_car = (T) => async (rt) => {
  const at = async (...n) => { for (const i of n) await rt.at(T[i]); };
  const drive = async (l, r) => {
    await at('drive');
    await at('d1'); rt.digitalWrite('D7', l > 0 ? 1 : 0);
    await at('d2'); rt.digitalWrite('D8', l < 0 ? 1 : 0);
    await at('d3'); rt.analogWrite('D5', Math.abs(l));
    await at('d4'); rt.digitalWrite('D9', r > 0 ? 1 : 0);
    await at('d5'); rt.digitalWrite('D10', r < 0 ? 1 : 0);
    await at('d6'); rt.analogWrite('D6', Math.abs(r));
  };
  await at('enL', 'lA', 'lB', 'enR', 'rA', 'rB', 'trig', 'echo', 'cruise', 'stopCm');
  await at('s1'); for (const p of ['D5', 'D7', 'D8']) rt.pinMode(p, 'OUTPUT');
  await at('s2'); for (const p of ['D6', 'D9', 'D10']) rt.pinMode(p, 'OUTPUT');
  await at('s3'); rt.pinMode('D3', 'OUTPUT');
  await at('s4'); rt.pinMode('D2', 'INPUT');
  await at('s5'); rt.serialBegin(9600);
  for (;;) {
    await at('l1');
    await at('r1'); rt.digitalWrite('D3', 0);
    await at('r2'); await rt.delayMicroseconds(2);
    await at('r3'); rt.digitalWrite('D3', 1);
    await at('r4'); await rt.delayMicroseconds(10);
    await at('r5'); rt.digitalWrite('D3', 0);
    await at('r6'); const duration = await rt.pulseIn('D2', 1);
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
PROGRAMS.e_pj_car_u3 = PROGRAMS.e_pj_car(TAGS.pj_car_u3);
PROGRAMS.e_pj_car_uq = PROGRAMS.e_pj_car(TAGS.pj_car_uq);
delete PROGRAMS.e_pj_car;

// the car circuit of "a robot that stops for obstacles" plus the second motor on the other half of the L293D (3,4EN = pin 9 = column 19, 3A = pin 10 = column 18, 4A = pin 15 = column 13; 3Y = pin 11 = column 17, 4Y = pin 14 = column 14)
const C_NEW = [{ id: 'mot2', type: 'motor', x: -95, z: 116, rotY: Math.PI }, w('w44', 'D6', 'a19', 'white', 16), w('w45', 'D9', 'a18', 'green', 20), w('w46', 'D10', 'a13', 'violet', 24),
  { id: 'l11', type: 'lead', from: 'mot2.M1', to: 'a17', color: 'white', lift: 14 }, { id: 'l12', type: 'lead', from: 'mot2.M2', to: 'a14', color: 'green', lift: 18 }];
const C_CIRCUIT = [...CAR_PARTS, ...C_NEW];
const C_IDS = ids(C_CIRCUIT);

function carLesson(bk) {
  const B = BOARD[bk], T = TAGS['pj_car_' + bk], uq = bk === 'uq';
  return {
    module: 71, title: 'Project: a two-motor robot car that stops, backs up and turns', level: 'Advanced', time: '50 min', fast: true,
    goal: 'Drive two DC motors from one L293D and extend the obstacle logic with turning: stop, back up, pivot, continue. Learn why two motors can turn the car.',
    hardware: [B.name, 'Breadboard', 'L293D motor driver', 'Two “130” DC hobby motors', '4 × AA battery holder', 'HC-SR04 ultrasonic sensor', 'Jumper wires'],
    code: CODE['pj_car_' + bk], file: 'TwoMotorRobot.ino', program: 'e_pj_car_' + bk, widgets: ['motor', 'distance', 'dv:car2'],
    circuit: C_CIRCUIT,
    io: {
      D5: { ...CAR_IO_M, needs: C_IDS }, D2: { kind: 'hcsr04', item: 'us1', trig: 'D3', needs: C_IDS },
      D6: { kind: 'dev:car2', role: 'en2', item: 'mot2', mp: 'u1.p9', needs: C_IDS },
      D9: { kind: 'dev:car2', role: 'a2', item: 'mot2', mp: 'u1.p10', needs: C_IDS },
      D10: { kind: 'dev:car2', role: 'b2', item: 'mot2', mp: 'u1.p15', needs: C_IDS },
    },
    explain: byTag(T, {
      enL: 'Left motor: the enable pin (PWM sets the speed).', lA: 'Left motor input 1A…', lB: '…and 2A. 1A HIGH and 2A LOW = one direction; the opposite = the other.', enR: 'Right motor: the second half of the L293D, enable 3,4EN (PWM).',
      rA: 'Right motor input 3A…', rB: '…and 4A.', trig: 'Ultrasonic trigger and echo, as in the obstacle robot lesson.', cruise: 'Driving speed: 200 of 255 (about 78 % duty).',
      drive: 'One helper for both motors: positive = forward, negative = backwards, 0 = stopped. The function sets the two direction pins and the PWM of each side.', d3: 'PWM on the enable pin = speed.',
      r6: 'Time the echo. A timeout of 30 ms (about 5 m) returns 0 when nothing comes back.', r7: 'Microseconds to centimetres: divide by 58 (HC-SR04 datasheet).', l2: 'The decision: closer than 20 cm? A reading of 0 means no echo, so it is excluded.',
      o1: 'Stop (enable at 0: the motors coast).', o4: 'Back up for 0.4 s…', o6: 'Pivot right: the left motor forward and the right motor backward turn the car on the spot.', c1: 'Clear: both motors forward.',
    }),
    steps: [
      STEP('Why two motors turn a car', [], `<p>With <b>one</b> motor you can only go and stop. With <b>two</b> motors (one per side) you can steer by speed: both forward goes straight; one faster than the other curves; <b>opposite directions pivot</b> the car on the spot. The <b>L293D</b> has two H-bridges, so one chip drives both motors, and the sketch uses a helper <code>drive(left, right)</code>.</p><p class="warn"><b>The simulator has no wheels, chassis, ground or friction.</b> It spins two propellers and describes what a car with these two motors would do, assuming that IN1 HIGH / IN2 LOW means “forward” on both sides. Real cars mount the motors mirrored, so you may have to swap the wires of one motor.</p>`),
      STEP('The L293D and the limits', ['u1'], `<ul><li>Datasheet (TI SLRS008D): logic supply VCC1 <b>4.5 to 7 V</b> (5 V here), motor supply VCC2 up to 36 V, <b>600 mA continuous</b> and 1.2 A peak per channel for the L293D, clamp diodes built in.</li><li>Logic input HIGH: at least <b>2.3 V</b>${uq ? ', so the 3.3 V outputs of the UNO Q are accepted when VCC1 is 5 V' : ''}.</li><li>The outputs are bipolar: at 0.6 A the high side drops about 1.4 V (typ.) and the low side about 1.2 V (typ.) from the supply, so a 4 × AA pack (about 6 V) gives the motor clearly less than 6 V.</li><li>The stand-in “130” motor: about 70 mA no load, 250 mA loaded, 500 mA stall (vendor page): two motors stalled together would draw about 1 A from the pack.</li></ul>`),
      STEP('Wire it', C_IDS, `<p>The first motor, the battery and the sensor are exactly as in the obstacle robot lesson: <b>5V → a12</b>, <b>D5 → j12</b>, <b>D7 → j13</b>, <b>D8 → j18</b>, sensor <b>D3 → f24</b> (TRIG) and <b>D2 → f25</b> (ECHO). The new, second motor uses the other half of the L293D on the opposite row of the chip:</p><ul><li><b>D6 → a19</b> (3,4EN, pin 9)</li><li><b>D9 → a18</b> (3A, pin 10)</li><li><b>D10 → a13</b> (4A, pin 15)</li><li>Motor 2 between 3Y (a17, pin 11) and 4Y (a14, pin 14).</li></ul>${uq ? '<p>The HC-SR04 ECHO is a 5 V signal: D2 of the UNO Q is a 5 V-tolerant input (D3 is not, so D3 is the TRIG output only).</p>' : ''}`, { pins: ['D2', 'D3', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', '5V', 'GND2', 'GND3'] }),
      STEP('The code', C_IDS, `<p>Click lines <b>${T.drive}</b> (one helper for both motors), <b>${T.l2}</b> (the decision) and <b>${T.o6}</b> (the pivot). Compare with the one-motor robot: only <code>drive()</code> and the turn are new.</p>`, { showCode: true, power: true }),
      STEP('Run it: drive, meet an obstacle, turn', C_IDS, `<p>Press <b>▶ Run</b>. With the obstacle far (more than 20 cm) both propellers spin “forward”. Slide the <b>obstacle</b> closer than 20 cm: both motors stop, back up, then pivot (the panel says “turning on the spot”). Slide the obstacle away again to let the car continue.</p><p class="sim">The simulated car does not move, so its distance reading does not change when it turns: slide the obstacle yourself to play “the turn found free space”. The 0.4 s and 0.5 s timings are examples that you must tune on a real chassis.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Next steps', C_IDS, `<ul><li>Speed-matching: two motors are never identical, so a car drifts; encoders or a gyro fix it.</li><li>Scan left and right with a servo and choose the freer side (the servo lesson).</li><li>Use a separate supply for the motors and keep the common GND.</li></ul>${uq ? CAV_UQ : ''}`, { power: true }),
    ],
    quiz: [
      { q: 'How does a two-motor car turn on the spot?', a: ['The two motors run in opposite directions', 'Both run forward at the same speed', 'The L293D rotates', 'Only the sensor moves'], c: 0, why: 'Opposite directions give a pivot.' },
      { q: 'What does the L293D let one chip do here?', a: ['Drive two motors with its two H-bridges', 'Measure the distance', 'Power the board', 'Store the program'], c: 0, why: 'It has two H-bridges: 1,2EN and 3,4EN.' },
      { q: 'Why is a reading of 0 excluded in the obstacle test?', a: ['No echo gives 0, which is not an obstacle', 'Zero is an error in C', 'The motor needs it', 'To save power'], c: 0, why: 'cm > 0 filters out “no echo”.' },
    ],
    sources: [S.l293, S.hcsr04, S.pulsein, S.motor130, B.ds],
  };
}

// =================================================================================================================================
export default {
  lessons: {
    u3: [alarmLesson('u3'), doorLesson('u3'), plantLesson('u3'), carLesson('u3')],
    e32: [plantLesson('e32')],
    uq: [alarmLesson('uq'), doorLesson('uq'), plantLesson('uq'), carLesson('uq')],
    pi: [],
  },
  modules: {
    u3: { 70: 'Module 70 — Projects: alarm and smart door', 71: 'Module 71 — Projects: pump and robot car' },
    e32: { 71: 'Module 71 — Projects: pump and robot car' },
    uq: { 70: 'Module 70 — Projects: alarm and smart door', 71: 'Module 71 — Projects: pump and robot car' },
    pi: {},
  },
  programs: PROGRAMS,
  code: CODE,
  checks: CHECKS,
};

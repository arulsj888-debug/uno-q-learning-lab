// Slot i: three Raspberry Pi PROJECT lessons (GPIO Zero, Python), module numbers 110-111.
//   1. Security alarm   (HC-SR501 PIR + button + LED + active buzzer)       MotionSensor, Button, LED, Buzzer
//   2. Smart door       (RC522 RFID + SG90 servo + LED + active buzzer)     SimpleMFRC522, AngularServo
//   3. Two-motor car    (L293D, two DC motors, HC-SR04 + voltage divider)   Motor, DistanceSensor
// Python is written from the GPIO Zero documentation / source and was NOT run on a real Pi. Each lesson says so.
// Listings carry  #@tag  markers: the tags give the line numbers used by the simulated programs, the explanations and the line checks.
// Simulated devices ('ipir', 'isonar', 'imot') are in i_ui.js. Plain data only: no DOM or three.js imports.
const R = (t, u) => ({ t, u });
const S = {
  gzin: R('GPIO Zero documentation: Input devices (MotionSensor, DistanceSensor, Button)', 'https://gpiozero.readthedocs.io/en/stable/api_input.html'),
  gzout: R('GPIO Zero documentation: Output devices (Motor, Buzzer, LED, AngularServo)', 'https://gpiozero.readthedocs.io/en/stable/api_output.html'),
  gzsrc: R('GPIO Zero source: output_devices.py (class Motor)', 'https://github.com/gpiozero/gpiozero/blob/master/gpiozero/output_devices.py'),
  pins: R('Raspberry Pi documentation: GPIO (16 mA per pin, 50 mA total, not 5 V tolerant)', 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#gpio'),
  sr501: R('HC-SR501 PIR motion detector datasheet (manufacturer, 2013)', 'https://courses.ece.cornell.edu/ece5990/ECE5725_Spring2020_Projects/May_15_Demo/Smart%20Lock/W_pp445_yl656/datasheet/31227sc.pdf'),
  sr501guide: R('Handson Technology: HC-SR501 PIR user guide', 'https://handsontec.com/dataspecs/sensor/PIR%20SR501%20Motion%20Sensor.pdf'),
  hcsr04: R('Elecfreaks HC-SR04 ultrasonic ranging module datasheet', 'https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf'),
  l293: R('Texas Instruments L293x quadruple half-H drivers datasheet (SLRS008D)', 'https://www.ti.com/lit/ds/symlink/l293.pdf'),
  sg90: R('TowerPro SG90 micro servo datasheet', 'https://www.friendlywire.com/projects/ne555-servo-safe/SG90-datasheet.pdf'),
  mfrc: R('MFRC522 datasheet (NXP): 2.5 V to 3.3 V supply', 'https://www.nxp.com/docs/en/data-sheet/MFRC522.pdf'),
  mfrclib: R('mfrc522 Python library (pimylifeup), SimpleMFRC522.py', 'https://github.com/pimylifeup/MFRC522-python'),
  motor130: R('Adafruit #711 DC toy/hobby motor (130 size): specifications', 'https://www.adafruit.com/product/711'),
};

const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const ids = a => a.map(d => d.id);
const mod = (id, model, x, z) => ({ id, type: 'mod', model, x, z });
const COL = { VCC: 'red', GND: 'black', '3V3': 'red' };
const COLORS = ['blue', 'green', 'yellow', 'orange', 'white', 'violet', 'red', 'black'];
const bb = (id, pairs, c0) => pairs.flatMap(([mp, net], i) => {
  const c = COL[mp] || COL[net] || COLORS[i % COLORS.length];
  return [fw(id + 'm' + i, id + '.' + mp, 'a' + (c0 + i), c, 16 + 2 * i), fw(id + 'b' + i, net, 'b' + (c0 + i), c, 26 + 4 * i)];
});
const STEP = (title, view, have, body, o = {}) => ({ title, view, have, power: false, body, ...o });

// ---- listing helper: lines may end with  #@tag  (the tag is removed and gives the line number; a line check is made for it) ----
function listing(src) {
  const lines = [], tags = {};
  src.split('\n').forEach((ln, i) => {
    const m = /\s*#@(\w+)\s*$/.exec(ln);
    if (m) { tags[m[1]] = i + 1; ln = ln.slice(0, m.index); }
    lines.push(ln.replace(/\s+$/, ''));
  });
  const checks = Object.values(tags).sort((a, b) => a - b).map(n => [n, lines[n - 1].trim().slice(0, 22)]);
  return { code: lines.join('\n'), tags, checks };
}
const byTag = (tags, o) => { const r = {}; for (const [k, v] of Object.entries(o)) { if (!(k in tags)) throw new Error('unknown tag ' + k); r[tags[k]] = v; } return r; };
const CODE = {}, CHECKS = {}, PROGRAMS = {}, TAGS = {};
function reg(key, src) { const l = listing(src); CODE[key] = l.code; CHECKS[key] = l.checks; TAGS[key] = l.tags; return l; }
const atOf = T => async (rt, ...n) => { for (const k of n) { if (!(k in T)) throw new Error('unknown tag ' + k); await rt.at(T[k]); } };

// shared parts: the LED of the LED lesson (GPIO17 = pin 11), 220 ohm
const LED = [{ id: 'r1', type: 'resistor', a: 'h8', b: 'h12', ohms: 220 }, { id: 'led1', type: 'led', anode: 'g12', cathode: 'g13' }, fw('w1', 'p11', 'j8', 'yellow', 26), fw('w2', 'p9', 'j13', 'black', 34)];
const SOURCES_PI = 'Raspberry Pi 4 (set up, Lesson 2)';

// =================================================================================================================================
// 1. SECURITY ALARM
// =================================================================================================================================
reg('i_pj_alarm', `from gpiozero import MotionSensor, Button, LED, Buzzer  #@imp
from time import sleep, monotonic  #@imp2

# Learning demo: NOT a real security product
pir = MotionSensor(4)         # HC-SR501 OUT on GPIO4 (pin 7)  #@pir
arm_button = Button(2)        # arm / disarm, GPIO2 (pin 3), to GND when pressed  #@btn
led = LED(17)                 # status LED, GPIO17 (pin 11)  #@led
buzzer = Buzzer(27)           # active buzzer, GPIO27 (pin 13)  #@bz

armed = False  #@armed
alarm_end = 0                 # monotonic() time when the siren stops; 0 = quiet  #@alend
was_pressed = False  #@was0

print("Disarmed: press the button to arm")  #@msg

while True:  #@loop
    pressed = arm_button.is_pressed  #@press
    if pressed and not was_pressed:       # only the moment of pressing  #@edge
        armed = not armed  #@tog
        alarm_end = 0  #@clr
        print("ARMED" if armed else "Disarmed")  #@pmsg
    was_pressed = pressed  #@was
    if armed and alarm_end == 0 and pir.motion_detected:  #@trig
        alarm_end = monotonic() + 5  #@al2
        print("MOTION: alarm!")  #@al3
    if alarm_end and monotonic() > alarm_end:  #@to
        alarm_end = 0  #@to2
        print("Alarm over")  #@to3
    if alarm_end:  #@o1
        buzzer.on()  #@o2
        led.value = int(monotonic() * 5) % 2  #@o3
    else:  #@o4
        buzzer.off()  #@o5
        led.value = 1 if armed else 0  #@o6
    sleep(0.05)  #@sl`);

PROGRAMS.i_pj_alarm = async (rt) => {
  const T = TAGS.i_pj_alarm, at = (...n) => atOf(T)(rt, ...n), now = () => rt.millis() / 1000;
  rt.serialBegin(9600);
  await at('imp', 'imp2');
  await at('pir'); rt.pinMode('p7', 'INPUT');
  await at('btn'); rt.pinMode('p3', 'INPUT_PULLUP');
  await at('led'); rt.pinMode('p11', 'OUTPUT'); rt.digitalWrite('p11', 0);
  await at('bz'); rt.pinMode('p13', 'OUTPUT'); rt.digitalWrite('p13', 0);
  let armed = false, alarmEnd = 0, was = false;
  await at('armed', 'alend', 'was0');
  await at('msg'); rt.println('Disarmed: press the button to arm');
  for (;;) {
    await at('loop');
    await at('press'); const pressed = rt.digitalRead('p3') === 0;
    await at('edge');
    if (pressed && !was) { await at('tog'); armed = !armed; await at('clr'); alarmEnd = 0; await at('pmsg'); rt.println(armed ? 'ARMED' : 'Disarmed'); }
    await at('was'); was = pressed;
    await at('trig');
    if (armed && alarmEnd === 0 && rt.digitalRead('p7') === 1) { await at('al2'); alarmEnd = now() + 5; await at('al3'); rt.println('MOTION: alarm!'); }
    await at('to');
    if (alarmEnd && now() > alarmEnd) { await at('to2'); alarmEnd = 0; await at('to3'); rt.println('Alarm over'); }
    await at('o1');
    if (alarmEnd) { await at('o2'); rt.digitalWrite('p13', 1); await at('o3'); rt.digitalWrite('p11', Math.floor(now() * 5) % 2); }
    else { await at('o4'); await at('o5'); rt.digitalWrite('p13', 0); await at('o6'); rt.digitalWrite('p11', armed ? 1 : 0); }
    await at('sl'); await rt.delay(50);
  }
};

// columns: LED 8-13 | button 15-17 | buzzer 20-27 ; the PIR sits on the desk
const A_CIRCUIT = [...LED,
  { id: 'btn1', type: 'button', col: 15 }, fw('w3', 'p3', 'j15', 'blue', 42), fw('w4', 'p6', 'j17', 'black', 50),
  { id: 'rz1', type: 'resistor', a: 'c20', b: 'c24', ohms: 220 }, { id: 'bz1', type: 'buzzer', active: true, plus: 'e24', minus: 'e27' }, fw('w5', 'p13', 'a20', 'orange', 26), fw('w6', 'p14', 'a27', 'black', 34),
  { id: 'pir1', type: 'pir', x: 125, z: -45 }, fw('w7', 'pir1.GND', 'p20', 'black', 24), fw('w8', 'pir1.OUT', 'p7', 'yellow', 36), fw('w9', 'pir1.VCC', 'p2', 'red', 18)];
const A_IDS = ids(A_CIRCUIT);

const alarmLesson = () => {
  const T = TAGS.i_pj_alarm;
  return {
    module: 110, title: 'Project: a security alarm (PIR, button, LED and buzzer)', level: 'Advanced', time: '40 min', fast: true,
    goal: 'Combine a PIR motion sensor, an arm button, an LED and an active buzzer into an alarm you can arm and disarm, with GPIO Zero’s MotionSensor. A learning demo, not a security product.',
    hardware: [SOURCES_PI, 'HC-SR501 PIR motion sensor', 'Push button', 'Active buzzer (3.3 V capable: check your part) and a 220 Ω resistor', 'LED and a 220 Ω resistor', 'Breadboard and jumper wires (female–male)'],
    code: CODE.i_pj_alarm, file: 'security_alarm.py', program: 'i_pj_alarm', widgets: ['button', 'dv:ipir', 'dv:abuz'],
    circuit: A_CIRCUIT,
    io: {
      p7: { kind: 'dev:ipir', role: 'out', item: 'pir1', mp: 'pir1.OUT', needs: A_IDS, pw: [['pir1.VCC', '5V'], ['pir1.GND', 'GND']] },
      p3: { kind: 'button', item: 'btn1', needs: A_IDS },
      p11: { kind: 'led', item: 'led1', needs: A_IDS },
      p13: { kind: 'dev:abuz', role: 'bz', item: 'bz1', mp: 'rz1.1', needs: A_IDS, pw: [['bz1.-', 'GND']] },
    },
    explain: byTag(T, {
      imp: 'Four GPIO Zero classes: <b>MotionSensor</b> (a PIR on one pin), <b>Button</b>, <b>LED</b> and <b>Buzzer</b> (active buzzer).', imp2: '<code>monotonic()</code> is a clock that only goes forward: good for timing the siren without blocking the loop.',
      pir: 'The PIR output on <b>GPIO4 (pin 7)</b>. The HC-SR501 output is about 3.3 V when it sees motion (datasheet), a valid level for the Pi. GPIO Zero’s MotionSensor reads it with the pin pulled down by default.',
      btn: 'The arm button on <b>GPIO2 (pin 3)</b>, to GND. <code>Button</code> turns on the pull-up, so the pin reads HIGH until the button connects it to GND. (GPIO2 also has a 1.8 kΩ pull-up on the board.)',
      led: 'Status LED on GPIO17, through 220 Ω.', bz: 'Active buzzer on GPIO27 (pin 13), through 220 Ω: it has its own oscillator, power makes the sound.',
      armed: 'The state of the alarm: armed or not. The same movement means nothing when disarmed.', alend: 'The time at which the siren stops. 0 means: no alarm running.', was0: 'The button state of the previous pass: used to find the moment of pressing.',
      press: '<code>is_pressed</code> is True while the button is held down.', edge: 'Act only when the button <b>changes</b> from released to pressed, not while it is held.', tog: 'Each press flips armed / disarmed.', clr: 'Arming or disarming also silences a running alarm.',
      trig: 'The alarm starts only if the system is armed, no alarm is running, and <code>pir.motion_detected</code> is True.', al2: 'Remember when the siren must stop: now + 5 seconds.',
      to: 'After 5 s the siren stops by itself. If the PIR output is still HIGH, the alarm can start again at once.', o1: 'The outputs follow the state: first, an alarm is running…', o3: 'The LED blinks about 2.5 times a second (it flips 5 times a second).', o4: '…otherwise the buzzer is off and the LED shows armed (on) or disarmed (off).', sl: 'A short pause, so the Pi is not busy-looping at full speed.',
    }),
    steps: [
      STEP('Four parts, one state machine', 'pibench', [], `<p>Three <b>inputs</b> and two <b>outputs</b>: the PIR says “movement”, the button toggles <b>armed / disarmed</b>, the program remembers the state, and the buzzer and LED show it. The same movement means nothing when disarmed and an alarm when armed.</p><p class="warn"><b>This is a learning demo, not a real security product.</b> A PIR can miss a person who moves slowly, can be fooled by heat sources and sunlight, the Pi has no tamper detection or backup power here, and anyone who can reach the button can disarm it.</p><p class="sim">The Python was written from the GPIO Zero documentation and was <b>not run on a real Pi</b>.</p>`),
      STEP('The parts and their limits', 'pibb', ['pir1'], `<ul><li><b>HC-SR501 PIR</b>: powered from <b>5 V</b> (supply range 5 to 20 V in the datasheet), its output is about <b>3.3 V</b> when it sees motion, so it can go straight to a GPIO pin. It needs about a <b>minute</b> to settle after power-on and detects <b>movement</b>, not a person standing still.</li><li><b>Active buzzer</b>: a steady HIGH is enough. Check that yours is rated for 3.3 V (some 5 V types are quiet or silent at 3.3 V).</li><li><b>GPIO current</b>: the Raspberry Pi documentation says one GPIO pin can supply up to <b>16 mA</b> and all GPIO pins together up to <b>50 mA</b>. The LED path (about 6 mA at 3.3 V) and the buzzer path must fit within that; a buzzer that needs more must be driven through a transistor (see the transistor lesson).</li><li><b>Never 5 V on a GPIO pin</b>: the Pi’s pins are not 5 V tolerant. The PIR is powered from 5 V, but only its 3.3 V output goes to the Pi.</li></ul>`),
      STEP('Wire it', 'pibb', A_IDS, `<ul><li>LED circuit of the LED lesson: <b>pin 11 → j8</b>, <b>pin 9 → j13</b>.</li><li>Button: <b>pin 3 → j15</b>, <b>pin 6 → j17</b>.</li><li>Buzzer: <b>pin 13 → a20</b> (resistor to the buzzer +), the buzzer − (column 27) to <b>pin 14 → a27</b>.</li><li>PIR (female jumpers): <b>VCC</b> to pin 2 (5V), <b>OUT</b> to pin 7 (GPIO4), <b>GND</b> to pin 20.</li></ul><p class="sim">The simulator checks that these wires exist; the breadboard columns are only one possible layout.</p>`, { pins: ['p2', 'p3', 'p6', 'p7', 'p9', 'p11', 'p13', 'p14', 'p20'] }),
      STEP('The code', 'pibb', A_IDS, `<p>Click lines <b>${T.edge}</b>, <b>${T.trig}</b> and <b>${T.to}</b>: the three decisions. <code>monotonic()</code> times the siren without blocking, so the button still works during an alarm.</p>`, { showCode: true, power: true }),
      STEP('Run it: arm, trigger, disarm', 'pibb', A_IDS, `<p>Press <b>▶ Run</b> and wait for the PIR warm-up. <b>Wave a hand</b>: nothing happens, because the system is <b>disarmed</b>. Press <b>Hold to press</b> (and release) to arm: the LED stays on. Wave again: the buzzer sounds and the LED blinks for 5 s. Press the button again to disarm.</p><p class="sim">Simulated PIR (warm-up shortened to 4 s; a real HC-SR501 needs about a minute) and a simulated buzzer. The output hold time (3 s here) is a simulator choice: on the real module a trimmer sets it. No sensing range, angle, siren loudness or false alarms are modelled.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('What a real alarm needs', 'pibb', A_IDS, `<ul><li>Exit and entry delays, a tamper switch, backup power, and a way to notify someone.</li><li>A PIR is one sensor with false alarms and blind spots; real systems use several.</li><li>A button anyone can press is not authentication: a card or keypad is the next step (the smart door lesson).</li><li>GPIO Zero also offers event style: <code>pir.when_motion = function</code>. Both styles are documented in GPIO Zero’s Input devices page.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'The HC-SR501 PIR is powered from 5 V. Why can its OUT pin still go to a Pi GPIO pin?', a: ['Its output is about 3.3 V, which the 3.3 V GPIO accepts', 'The Pi pins are 5 V tolerant', 'OUT carries no voltage', 'The PIR converts the voltage in software'], c: 0, why: 'The datasheet gives a 3.3 V output; Pi GPIO pins are not 5 V tolerant.' },
      { q: 'Why does the program remember an “armed” state?', a: ['To save memory', 'The same movement must mean different things when armed or disarmed', 'The PIR needs it', 'GPIO Zero requires it'], c: 1, why: 'The state decides whether movement is an alarm.' },
      { q: 'Is this a real security system?', a: ['Yes, if the buzzer is loud', 'Yes, it is certified', 'No: a learning demo with many missing safety features', 'Only at night'], c: 2, why: 'No tamper detection, backup power, notification or authentication.' },
    ],
    sources: [S.gzin, S.gzout, S.sr501, S.sr501guide, S.pins],
  };
};

// =================================================================================================================================
// 2. SMART DOOR
// =================================================================================================================================
reg('i_pj_door', `from gpiozero import AngularServo, LED, Buzzer  #@imp
from mfrc522 import SimpleMFRC522  #@imp2
from time import sleep  #@imp3
import RPi.GPIO as GPIO  #@imp4

# Learning demo: a UID is not a secret, and this is not a real lock
ALLOWED_ID = 0xDEADBEEF22     # demo card A: 4 UID bytes + the check byte  #@allowed
OPEN_SECONDS = 3  #@openS

reader = SimpleMFRC522()      # SPI0, chip select CE0 (pin 24), reset on pin 22  #@rdr
door = AngularServo(18, min_angle=0, max_angle=180, min_pulse_width=0.0005, max_pulse_width=0.0024)  #@srv
led = LED(17)  #@led
buzzer = Buzzer(27)  #@bz

def beep(seconds):  #@beep
    buzzer.on()  #@b1
    sleep(seconds)  #@b2
    buzzer.off()  #@b3

door.angle = 0                # 0 degrees = locked (your mechanics decide)  #@lock0
print("Door locked. Hold a card near the reader")  #@msg
try:  #@try
    while True:  #@loop
        card_id = reader.read_id()   # waits until a card is read  #@read
        if card_id == ALLOWED_ID:  #@if
            print("Access granted: door open")  #@g1
            led.on()  #@g2
            beep(0.15)  #@g3
            door.angle = 90  #@g4
            sleep(OPEN_SECONDS)  #@g5
            door.angle = 0  #@g6
            led.off()  #@g7
            print("Door locked")  #@g8
        else:  #@else
            print("Access denied")  #@d1
            beep(0.6)  #@d2
        sleep(1)                  # the same card is not read again at once  #@pause
finally:  #@fin
    GPIO.cleanup()  #@clean`);

PROGRAMS.i_pj_door = async (rt) => {
  const T = TAGS.i_pj_door, at = (...n) => atOf(T)(rt, ...n);
  const BCC = b => b[0] ^ b[1] ^ b[2] ^ b[3];
  const toNum = b => [...b, BCC(b)].reduce((n, x) => n * 256 + x, 0);
  const ALLOWED = 0xDEADBEEF22;
  const beep = async s => { await at('beep'); await at('b1'); rt.digitalWrite('p13', 1); await at('b2'); await rt.delay(s * 1000); await at('b3'); rt.digitalWrite('p13', 0); };
  rt.serialBegin(9600);
  await at('imp', 'imp2', 'imp3', 'imp4', 'allowed', 'openS');
  await at('rdr'); rt.dev('rfid', 'version');
  await at('srv'); rt.servoAttach('p12');
  await at('led'); rt.pinMode('p11', 'OUTPUT'); rt.digitalWrite('p11', 0);
  await at('bz'); rt.pinMode('p13', 'OUTPUT'); rt.digitalWrite('p13', 0);
  await at('lock0'); rt.servoWrite('p12', 0);
  await at('msg'); rt.println('Door locked. Hold a card near the reader');
  await at('try');
  for (;;) {
    await at('loop');
    await at('read');
    let uid = null;
    while (!uid) { uid = rt.dev('rfid', 'read'); if (!uid) await rt.yield(); }
    await at('if');
    if (toNum(uid) === ALLOWED) {
      await at('g1'); rt.println('Access granted: door open');
      await at('g2'); rt.digitalWrite('p11', 1);
      await at('g3'); await beep(0.15);
      await at('g4'); rt.servoWrite('p12', 90);
      await at('g5'); await rt.delay(3000);
      await at('g6'); rt.servoWrite('p12', 0);
      await at('g7'); rt.digitalWrite('p11', 0);
      await at('g8'); rt.println('Door locked');
    } else {
      await at('else'); await at('d1'); rt.println('Access denied');
      await at('d2'); await beep(0.6);
    }
    await at('pause'); await rt.delay(1000);
  }
};

// columns: RFID 1-7 | LED 8-13 | buzzer 15-22 | servo 25-27
const D_RF = [mod('rf1', 'mod_rfid', 130, -45), ...bb('rf1', [['3V3', 'p1'], ['RST', 'p22'], ['GND', 'p6'], ['MISO', 'p21'], ['MOSI', 'p19'], ['SCK', 'p23'], ['SDA', 'p24']], 1)];
const D_CIRCUIT = [...LED,
  { id: 'rz1', type: 'resistor', a: 'c15', b: 'c19', ohms: 220 }, { id: 'bz1', type: 'buzzer', active: true, plus: 'e19', minus: 'e22' }, fw('w5', 'p13', 'a15', 'orange', 26), fw('w6', 'p14', 'a22', 'black', 34),
  { id: 'sv1', type: 'servo', row: 'j', col: 25, bx: 80, bz: -58 }, fw('w7', 'p20', 'f25', 'black', 22), fw('w8', 'p2', 'f26', 'red', 26), fw('w9', 'p12', 'f27', 'orange', 30),
  ...D_RF];
const D_IDS = ids(D_CIRCUIT);

const doorLesson = () => {
  const T = TAGS.i_pj_door;
  const rf = (role, mp) => ({ kind: 'dev:rfid', role, item: 'rf1', mp, needs: D_IDS });
  return {
    module: 110, title: 'Project: a smart door (RFID card opens a servo lock)', level: 'Advanced', time: '45 min', fast: true,
    goal: 'Read an RFID card, compare its number with an allowed one and, if it matches, move a servo, light an LED and beep; a wrong card gets a long beep. A learning demo, not a real lock.',
    hardware: [SOURCES_PI, 'RC522 RFID module with a card or tag', 'SG90 micro servo', 'Active buzzer (3.3 V capable) and a 220 Ω resistor', 'LED and a 220 Ω resistor', 'Breadboard, jumper wires', 'SPI enabled; Python library mfrc522; optional separate 5 V supply for the servo'],
    code: CODE.i_pj_door, file: 'smart_door.py', program: 'i_pj_door', widgets: ['dv:rfid', 'dv:abuz'],
    circuit: D_CIRCUIT,
    io: {
      p12: { kind: 'servo', item: 'sv1', needs: D_IDS }, p11: { kind: 'led', item: 'led1', needs: D_IDS },
      p13: { kind: 'dev:abuz', role: 'bz', item: 'bz1', mp: 'rz1.1', needs: D_IDS, pw: [['bz1.-', 'GND']] },
      p24: { ...rf('ss', 'rf1.SDA'), pw: [['rf1.3V3', '3V3'], ['rf1.GND', 'GND']] }, p22: rf('rst', 'rf1.RST'), p19: rf('mosi', 'rf1.MOSI'), p21: rf('miso', 'rf1.MISO'), p23: rf('sck', 'rf1.SCK'),
    },
    explain: byTag(T, {
      imp: 'GPIO Zero gives the servo (<b>AngularServo</b>), the <b>LED</b> and the <b>Buzzer</b>.', imp2: 'The RC522 reader class of the <b>mfrc522</b> library (lesson 38).', imp4: 'The mfrc522 library uses RPi.GPIO: its <code>cleanup()</code> frees the pins at the end.',
      allowed: 'The allowed card as one number. The library’s <code>read_id()</code> builds the number from <b>5 bytes</b>: the 4 UID bytes plus a check byte (the XOR of the four, ISO 14443-A: typical, see the notes). These bytes are the made-up card A of the simulator. A UID identifies a card but is <b>not a secret</b>: it can be copied.',
      openS: 'The door stays open 3 s.', rdr: 'The reader: SPI0 with chip select CE0 (pin 24), reset on pin 22 (the library’s defaults).', srv: 'The servo signal on <b>GPIO18 (pin 12)</b>, 0° to 180°, pulse range calibrated as in the servo lesson.',
      led: 'LED on GPIO17.', bz: 'Active buzzer on GPIO27.', beep: 'A helper: on, wait, off. The wait blocks, fine for a short beep here.', lock0: 'Servo arm to 0° = the “locked” position (only the arm moves in this simulator).',
      read: '<code>read_id()</code> <b>waits</b> until a card is read and returns its number.', if: 'Is it the allowed card?', g4: 'Open: servo arm to 90°.', g5: 'Stay open 3 s, then lock again.', d2: 'A long beep for a wrong card.',
      pause: 'A card left in the field is read again; the pause makes that happen once a second at most.', fin: '<code>finally</code> runs even when you stop the program with Ctrl+C.',
    }),
    steps: [
      STEP('A door that knows a card', 'pidesk', [], `<p>Input: an <b>RFID reader</b> that gives the card’s number. Decision: is it the <b>allowed</b> number? Output: a <b>servo</b> moves a latch arm, an <b>LED</b> shows “open”, a <b>buzzer</b> confirms (short beep) or refuses (long beep).</p><p class="warn"><b>Learning demo, not a real lock.</b> A UID can be read and copied by anyone with a cheap reader, the allowed number is in plain sight in the program, and an SG90 arm is not a door lock. The simulator moves a servo arm only: no door, latch or frame is modelled.</p><p class="sim">The Python was written from the GPIO Zero and mfrc522 sources and was <b>not run on a real Pi</b>. Using the mfrc522 library (RPi.GPIO) and GPIO Zero in one program was <b>not tested</b> here: if the pins misbehave, test each part in its own lesson first.</p>`),
      STEP('Voltages and the pin plan', 'pidesk', ['rf1', 'sv1'], `<ul><li><b>RC522</b> (MFRC522 chip): supply <b>2.5 to 3.3 V</b> (datasheet): power it from <b>3V3</b>, never 5 V. It talks SPI0: MOSI pin 19, MISO pin 21, SCLK pin 23, chip select CE0 pin 24 (SDA on the module), reset pin 22.</li><li><b>SG90 servo</b>: operating voltage 4.8 V (about 5 V). It is powered from the <b>5V</b> pin here; its signal comes from a 3.3 V GPIO pin. The SG90 datasheet gives no signal level: 3.3 V usually works, <b>not verified</b>.</li><li><b>Servo current</b>: a moving or blocked servo can draw hundreds of milliamps, which the Pi’s 5 V rail (it comes from the Pi’s power supply) should not be asked to supply. For anything beyond a demo, give the servo its own 4.8 to 6 V supply and join its GND to a Pi GND pin; only the signal wire goes to the Pi.</li><li><b>GPIO current</b>: the Pi documentation allows 16 mA per pin and 50 mA for all GPIO pins together: only the LED and buzzer currents count here; the servo signal is tiny.</li></ul>`),
      STEP('Wire it', 'pidesk', D_IDS, `<ul><li>RC522 (female jumpers to a1 to a7, header pins to b1 to b7 in the same columns): <b>3V3</b> to pin 1, <b>RST</b> to pin 22, <b>GND</b> to pin 6, <b>MISO</b> to pin 21, <b>MOSI</b> to pin 19, <b>SCK</b> to pin 23, <b>SDA</b> to pin 24. IRQ stays unconnected.</li><li>LED: <b>pin 11 → j8</b>, <b>pin 9 → j13</b>.</li><li>Buzzer: <b>pin 13 → a15</b>; the buzzer − (column 22) to <b>pin 14 → a22</b>.</li><li>Servo (plug in j25, j26, j27): brown GND to <b>pin 20 → f25</b>, red +5 V to <b>pin 2 → f26</b>, orange signal to <b>pin 12 → f27</b>.</li></ul>`, { pins: ['p1', 'p2', 'p6', 'p9', 'p11', 'p12', 'p13', 'p14', 'p19', 'p20', 'p21', 'p22', 'p23', 'p24'] }),
      STEP('The code', 'pidesk', D_IDS, `<p>Click lines <b>${T.read}</b>, <b>${T.if}</b> and <b>${T.g4}</b>. Install the library with <code>pip3 install mfrc522</code> (as in lesson 38); GPIO Zero is part of Raspberry Pi OS.</p>`, { showCode: true, power: true }),
      STEP('Run it: right card, wrong card', 'pidesk', D_IDS, `<p>Press <b>▶ Run</b>. Use <b>Card A near</b>: “Access granted”, a short beep, the LED lights and the servo arm swings to 90° for 3 s, then back. Take the card away. <b>Card B near</b> is not allowed: a long beep and “Access denied”, the servo does not move.</p><p class="sim">Simulated reader, cards and servo. The two UIDs are made up. The servo speed follows the SG90 datasheet figure (no load); the simulated arm ignores the exact pulse range, which you must calibrate on a real servo (jitter is also common with software PWM: see the servo lesson). Door mechanics are not modelled.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('From demo to real lock', 'pidesk', D_IDS, `<ul><li>Use a card system with authentication (not just the UID), keep secrets out of the program, log and rate-limit attempts.</li><li>A proper electric lock or strike has its own supply, a MOSFET or relay and a flyback diode.</li><li>Decide what happens on power loss (fail-safe or fail-secure).</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Which supply does the RC522 chip need?', a: ['5 V only', '12 V', 'About 3.3 V (2.5 to 3.3 V)', 'No supply'], c: 2, why: 'The MFRC522 datasheet gives 2.5 to 3.3 V.' },
      { q: 'Why is a card UID alone a weak password?', a: ['It can be read and copied', 'It is too long', 'It changes every second', 'The servo cannot read it'], c: 0, why: 'A UID identifies a card but is not secret.' },
      { q: 'Why does the servo ideally get its own 5 V supply?', a: ['The Pi has no 5 V pin', 'A moving or blocked servo can draw more current than the Pi’s supply should give', 'To make it quieter', 'GPIO Zero requires it'], c: 1, why: 'Use a separate supply and join the grounds; only the signal goes to the Pi.' },
    ],
    sources: [S.mfrc, S.mfrclib, S.sg90, S.gzout, S.pins],
  };
};

// =================================================================================================================================
// 3. TWO-MOTOR ROBOT CAR
// =================================================================================================================================
reg('i_pj_car', `from gpiozero import Motor, DistanceSensor  #@imp
from time import sleep  #@imp2

# Learning demo: tune the numbers on your own chassis
left = Motor(forward=5, backward=6, enable=12)      # L293D 1A, 2A and 1,2EN  #@left
right = Motor(forward=16, backward=26, enable=13)   # L293D 3A, 4A and 3,4EN  #@right
sensor = DistanceSensor(echo=27, trigger=17, max_distance=2)   # ECHO through a voltage divider  #@sens
CRUISE = 0.8                  # speed 0 ... 1  #@cruise
STOP_CM = 20                  # closer than this: avoid  #@stopcm

def drive(left_speed, right_speed):   # +1 forward, -1 backward, 0 stop  #@drive
    left.value = left_speed  #@d1
    right.value = right_speed  #@d2

while True:  #@loop
    cm = sensor.distance * 100        # metres to centimetres  #@read
    print(f"{cm:.0f} cm")  #@pr
    if cm < STOP_CM:  #@dec
        drive(0, 0)  #@o1
        sleep(0.2)  #@o2
        drive(-CRUISE, -CRUISE)       # back up  #@o3
        sleep(0.4)  #@o4
        drive(CRUISE, -CRUISE)        # pivot to the right  #@o5
        sleep(0.5)  #@o6
    else:  #@else
        drive(CRUISE, CRUISE)  #@c1
    sleep(0.1)  #@sl`);

PROGRAMS.i_pj_car = async (rt) => {
  const T = TAGS.i_pj_car, at = (...n) => atOf(T)(rt, ...n);
  const CRUISE = 0.8;
  // GPIO Zero Motor: enable is a plain digital pin switched on at the start; the speed is PWM on the forward or the backward pin
  const mv = (f, b, v) => { rt.pwmValue(f, v > 0 ? v : 0); rt.pwmValue(b, v < 0 ? -v : 0); };
  rt.serialBegin(9600);
  await at('imp', 'imp2');
  await at('left'); rt.pinMode('p32', 'OUTPUT'); rt.digitalWrite('p32', 1); mv('p29', 'p31', 0);
  await at('right'); rt.pinMode('p33', 'OUTPUT'); rt.digitalWrite('p33', 1); mv('p36', 'p37', 0);
  await at('sens'); await at('cruise', 'stopcm', 'drive');
  const drive = async (l, r) => { await at('d1'); mv('p29', 'p31', l); await at('d2'); mv('p36', 'p37', r); };
  for (;;) {
    await at('loop');
    await at('read'); const raw = rt.dev('isonar', 'cm'), cm = raw == null ? 200 : Math.min(200, raw);
    await at('pr'); rt.println(Math.round(cm) + ' cm');
    await at('dec');
    if (cm < 20) {
      await at('o1'); await drive(0, 0); await at('o2'); await rt.delay(200);
      await at('o3'); await drive(-CRUISE, -CRUISE); await at('o4'); await rt.delay(400);
      await at('o5'); await drive(CRUISE, -CRUISE); await at('o6'); await rt.delay(500);
    } else { await at('else'); await at('c1'); await drive(CRUISE, CRUISE); }
    await at('sl'); await rt.delay(100);
  }
};

// columns: L293D 12-19 | HC-SR04 23-26 | divider 25-30. Motors and battery on the desk. Pins: left GPIO5/6/12, right GPIO16/26/13, TRIG GPIO17, ECHO GPIO27
const C_CIRCUIT = [
  { id: 'u1', type: 'l293d', col: 12 }, { id: 'bat1', type: 'battery', x: 125, z: -90 }, { id: 'mot1', type: 'motor', x: 165, z: -112 }, { id: 'mot2', type: 'motor', x: 205, z: -112 },
  fw('w1', 'p4', 'a12', 'red', 20), fw('w2', 'p6', 'a15', 'black', 26), fw('w3', 'p9', 'i16', 'black', 22),
  fw('w4', 'p32', 'j12', 'orange', 30), fw('w5', 'p29', 'j13', 'yellow', 34), fw('w6', 'p31', 'j18', 'blue', 38),
  fw('w7', 'p33', 'a19', 'white', 30), fw('w8', 'p36', 'a18', 'green', 34), fw('w9', 'p37', 'a13', 'violet', 38),
  { id: 'l1', type: 'lead', from: 'bat1.POS', to: 'j19', color: 'red', lift: 14 }, { id: 'l2', type: 'lead', from: 'bat1.NEG', to: 'j16', color: 'black', lift: 18 },
  { id: 'l3', type: 'lead', from: 'mot1.M1', to: 'j14', color: 'white', lift: 12 }, { id: 'l4', type: 'lead', from: 'mot1.M2', to: 'j17', color: 'green', lift: 16 },
  { id: 'l5', type: 'lead', from: 'mot2.M1', to: 'a17', color: 'white', lift: 14 }, { id: 'l6', type: 'lead', from: 'mot2.M2', to: 'a14', color: 'green', lift: 18 },
  { id: 'us1', type: 'hcsr04', row: 'j', col: 23 }, fw('w10', 'p2', 'f23', 'red', 24), fw('w11', 'p11', 'f24', 'green', 28), fw('w12', 'p14', 'f26', 'black', 20),
  { id: 'rd1', type: 'resistor', a: 'g25', b: 'g28', ohms: 1000 }, { id: 'rd2', type: 'resistor', a: 'h28', b: 'h30', ohms: 2000 }, fw('w13', 'p13', 'j28', 'white', 40), fw('w14', 'p25', 'i30', 'black', 36),
];
const C_IDS = ids(C_CIRCUIT);

const carLesson = () => {
  const T = TAGS.i_pj_car;
  const m = (role, mp, item) => ({ kind: 'dev:imot', role, item, mp, needs: C_IDS });
  return {
    module: 111, title: 'Project: a two-motor robot car (L293D, HC-SR04 and a voltage divider)', level: 'Advanced', time: '55 min', fast: true,
    goal: 'Drive two DC motors from one L293D with GPIO Zero’s Motor class, measure distance with a HC-SR04 whose 5 V ECHO is reduced by a voltage divider, and make the car stop, back up and turn.',
    hardware: [SOURCES_PI, 'Breadboard', 'L293D motor driver', 'Two “130” DC hobby motors', '4 × AA battery holder (its own supply for the motors)', 'HC-SR04 ultrasonic sensor', '1 kΩ and 2 kΩ resistors (the ECHO divider)', 'Jumper wires'],
    code: CODE.i_pj_car, file: 'robot_car.py', program: 'i_pj_car', widgets: ['dv:isonar', 'dv:imot'],
    circuit: C_CIRCUIT,
    io: {
      p32: { ...m('en1', 'u1.p1', 'mot1'), pw: [['u1.p16', '5V'], ['u1.p4', 'GND'], ['bat1.NEG', 'GND']] }, p29: m('a1', 'u1.p2', 'mot1'), p31: m('b1', 'u1.p7', 'mot1'),
      p33: m('en2', 'u1.p9', 'mot2'), p36: m('a2', 'u1.p10', 'mot2'), p37: m('b2', 'u1.p15', 'mot2'),
      p11: { kind: 'dev:isonar', role: 'trig', item: 'us1', mp: 'us1.TRIG', needs: C_IDS, pw: [['us1.VCC', '5V'], ['us1.GND', 'GND']] },
      p13: { kind: 'dev:isonar', role: 'echo', item: 'us1', mp: 'rd1.2', needs: C_IDS },
    },
    explain: byTag(T, {
      imp: 'GPIO Zero’s <b>Motor</b> (an H-bridge driver with two direction pins) and <b>DistanceSensor</b> (HC-SR04).', left: 'Left motor: <code>forward</code> and <code>backward</code> are the GPIO pins of the L293D inputs 1A and 2A; <code>enable</code> is 1,2EN. In the GPIO Zero source the enable pin is a plain digital output that is switched <b>on</b> at the start; the speed is PWM on the forward or backward pin.',
      right: 'Right motor: the second half of the L293D (3A, 4A, 3,4EN).', sens: '<code>echo</code> is the pin that listens, <code>trigger</code> the pin that fires. The distance is in <b>metres</b>; <code>max_distance=2</code> limits it to 2 m (the default is 1 m). The ECHO wire reaches GPIO27 only through the voltage divider.',
      cruise: 'Driving speed 0 to 1 (80 %).', stopcm: 'Closer than 20 cm counts as an obstacle.', drive: 'One helper for both motors: positive = forward, negative = backward, 0 = stopped.', d1: '<code>value</code> sets direction and speed: -1 full speed backward, 0 stopped, 1 full speed forward (GPIO Zero).',
      read: '<code>sensor.distance</code> is in metres; times 100 gives centimetres. At the maximum distance it reads 2.0 (no obstacle within range).', dec: 'The decision: closer than 20 cm?', o1: 'Stop.', o3: 'Back up for 0.4 s…', o5: 'Pivot right: the left motor forward and the right motor backward turn the car on the spot.', c1: 'Clear: both motors forward.',
    }),
    steps: [
      STEP('Why two motors turn a car', 'pibench', [], `<p>With <b>one</b> motor you can only go and stop. With <b>two</b> motors (one per side) you steer by speed: both forward goes straight; one faster than the other curves; <b>opposite directions pivot</b> the car on the spot. The <b>L293D</b> has two H-bridges, so one chip drives both motors; the program uses a helper <code>drive(left, right)</code>.</p><p class="warn"><b>The simulator has no wheels, chassis, ground or friction.</b> It spins two propellers and describes what a car with these two motors would do, assuming that “forward” means the same direction on both sides. Real cars mount the motors mirrored: swap the two wires of a motor that turns the wrong way. The simulated distance does not change when the car “moves”: you set it yourself.</p><p class="sim">The Python was written from the GPIO Zero documentation and source and was <b>not run on a real Pi</b>.</p>`),
      STEP('The L293D, the power plan and the limits', 'pibb', ['u1', 'bat1'], `<ul><li>Datasheet (TI SLRS008D): logic supply VCC1 <b>4.5 to 7 V</b> (the Pi’s 5 V pin), motor supply VCC2 up to <b>36 V</b>, <b>600 mA continuous</b> and 1.2 A peak per channel for the L293D, clamp diodes built in.</li><li>Logic input HIGH: at least <b>2.3 V</b> (datasheet), so the Pi’s <b>3.3 V</b> outputs are valid inputs when VCC1 is 5 V. The inputs draw only microamps, far below the Pi’s per-pin limit.</li><li><b>Motors on their own supply</b>: the 4 × AA pack goes to VCC2 (pin 8) and the pack’s − to the L293D ground, which is joined to a Pi GND pin (<b>common ground</b>). The pack’s + never touches a Pi pin. A “130” motor takes about 70 mA unloaded, 250 mA loaded and 500 mA stalled (vendor page): two stalled motors would draw about 1 A, which the Pi must not supply.</li><li><b>Pi current limits</b> (Raspberry Pi documentation): one GPIO pin up to <b>16 mA</b>, all GPIO pins together up to <b>50 mA</b>. Here the GPIO pins only drive the L293D inputs and the HC-SR04 trigger. The logic supply (ICC1) and the sensor’s 15 mA come from the 5 V pin: check the ICC1 table of the datasheet against what your power supply can give.</li><li>The L293D outputs are bipolar, so each loses roughly 1 to 2 V: the motors get clearly less than the pack voltage (datasheet output voltage table).</li></ul>`),
      STEP('The ECHO voltage divider', 'pibb', ['us1', 'rd1', 'rd2', 'w13', 'w14'], `<p>The HC-SR04 is powered from <b>5 V</b> (datasheet: 5 V, 15 mA) and its ECHO output is a TTL signal at that supply level, so with a 5 V supply it is about <b>5 V</b>. The Pi’s GPIO pins are <b>not 5 V tolerant</b> (Raspberry Pi documentation): never connect ECHO straight to a pin.</p><ul><li>A divider of <b>1 kΩ</b> (from ECHO) and <b>2 kΩ</b> (to GND) gives 5 V × 2 k ÷ (1 k + 2 k) = <b>3.3 V</b> at the middle point, which goes to GPIO27 (pin 13). The values are this lesson’s choice (the GPIO Zero documentation shows a divider in a diagram but gives no values in its text); other pairs with the same ratio work.</li><li>The <b>TRIG</b> pin is an input of the module: it gets the Pi’s 3.3 V pulse directly (datasheet: a 10 µs TTL pulse). The datasheet does not state a minimum high level, so 3.3 V is <b>not verified</b>, although it is common practice.</li></ul>`),
      STEP('Wire it', 'pibb', C_IDS, `<ul><li>L293D power: <b>pin 4 → a12</b> (VCC1, 5 V), <b>pin 6 → a15</b> (ground). Battery + to j19 (VCC2), battery − to j16, and <b>pin 9 → i16</b> joins the grounds.</li><li>Left motor: <b>pin 32 → j12</b> (1,2EN), <b>pin 29 → j13</b> (1A), <b>pin 31 → j18</b> (2A); the motor between j14 (1Y) and j17 (2Y).</li><li>Right motor: <b>pin 33 → a19</b> (3,4EN), <b>pin 36 → a18</b> (3A), <b>pin 37 → a13</b> (4A); the motor between a17 (3Y) and a14 (4Y).</li><li>HC-SR04 (plugged into j23 to j26): <b>pin 2 → f23</b> (VCC), <b>pin 11 → f24</b> (TRIG), <b>pin 14 → f26</b> (GND). ECHO (column 25) → 1 kΩ (g25 to g28) → the middle point (column 28) → <b>pin 13 → j28</b>; 2 kΩ (h28 to h30) and <b>pin 25 → i30</b> to GND.</li></ul>`, { pins: ['p2', 'p4', 'p6', 'p9', 'p11', 'p13', 'p14', 'p25', 'p29', 'p31', 'p32', 'p33', 'p36', 'p37'] }),
      STEP('The code', 'pibb', C_IDS, `<p>Click lines <b>${T.left}</b> (a Motor), <b>${T.sens}</b> (the sensor), <b>${T.dec}</b> (the decision) and <b>${T.o5}</b> (the pivot). The GPIO Zero documentation recommends the <b>pigpio</b> pin driver for better DistanceSensor accuracy rather than the RPi.GPIO driver (it says this in particular for Pi 1 and Pi Zero); what the default is on your Pi OS version and whether it matters on a Pi 4 was not checked here.</p>`, { showCode: true, power: true }),
      STEP('Run it: drive, meet an obstacle, turn', 'pibb', C_IDS, `<p>Press <b>▶ Run</b>. With the obstacle far (more than 20 cm) both propellers spin “forward”. Move the obstacle slider closer than 20 cm: both motors stop, back up, then pivot (the panel says so). Slide it away again to let the car continue.</p><p class="sim">The simulated car does not move, so the distance does not change when it turns: you slide the obstacle yourself. The 0.2, 0.4 and 0.5 s timings are examples to tune on a real chassis. No wheels, friction, motor start-up threshold, battery voltage drop or real ultrasonic echoes (angles, soft surfaces) are modelled.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Next steps', 'pibb', C_IDS, `<ul><li>Two motors are never identical, so a car drifts; wheel encoders or a gyro fix it.</li><li>Scan left and right with a servo and choose the freer side (the servo lesson).</li><li>Add a switch for the motor supply, and a decision for “nothing found for a long time”.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'Why does the HC-SR04 ECHO line need a voltage divider on a Raspberry Pi?', a: ['ECHO is about 5 V and Pi GPIO pins are not 5 V tolerant', 'ECHO is too slow', 'The Pi has no input pins', 'It makes the sensor see farther'], c: 0, why: '1 kΩ and 2 kΩ bring 5 V down to 3.3 V.' },
      { q: 'How does a two-motor car turn on the spot?', a: ['Both motors run forward at the same speed', 'The two motors run in opposite directions', 'Only the sensor moves', 'The L293D rotates'], c: 1, why: 'Opposite directions give a pivot.' },
      { q: 'Where do the motors get their power?', a: ['From a GPIO pin', 'From the 3.3 V pin', 'From their own battery pack on VCC2, with a common ground to the Pi', 'From the HC-SR04'], c: 2, why: 'A GPIO pin gives at most 16 mA; motors need a separate supply.' },
    ],
    sources: [S.gzin, S.gzout, S.gzsrc, S.l293, S.hcsr04, S.motor130, S.pins],
  };
};

// =================================================================================================================================
export default {
  lessons: { u3: [], e32: [], uq: [], pi: [alarmLesson(), doorLesson(), carLesson()] },
  modules: { u3: {}, e32: {}, uq: {}, pi: { 110: 'Module 110 — Projects: security alarm and smart door', 111: 'Module 111 — Projects: two-motor robot car' } },
  programs: PROGRAMS,
  code: CODE,
  checks: CHECKS,
};

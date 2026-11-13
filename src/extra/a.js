// Slot a: three digital sensor modules on all four boards: vibration (SW-420 style module), Hall switch (A3144) and line-follow IR (TCRT5000 module).
// 12 lessons (module 30). The simulated devices a_vib, a_hall, a_line live in a_ui.js (browser only); this file has no DOM or three imports.
// Facts: A3144 = Allegro A3141-A3144 datasheet; TCRT5000 = Vishay datasheet 83760; LM393 = TI datasheet. Module behaviour (SW-420, KY-003, line module)
// comes from seller / tutorial pages, NOT from a maker datasheet, and is labelled typical. Library calls were NOT run on real boards.

const R = (t, u) => ({ t, u });
const SRCS = {
  a3144: R('Allegro A3141, A3142, A3143, A3144 Hall-effect switch datasheet', 'https://www.allegromicro.com/-/media/files/datasheets/a3141-2-3-4-datasheet.pdf'),
  tcrt: R('Vishay TCRT5000 / TCRT5000L reflective optical sensor datasheet (83760)', 'https://www.vishay.com/docs/83760/tcrt5000.pdf'),
  lm393: R('LM393 dual comparator datasheet (Texas Instruments)', 'https://www.ti.com/lit/ds/symlink/lm393.pdf'),
  sw420: R('Components101: SW-420 vibration sensor module (seller-level information, no maker datasheet)', 'https://components101.com/sensors/sw-420-vibration-sensor-module'),
  ky003: R('Joy-IT KY-003 Hall sensor page (5 V module)', 'https://sensorkit.joy-it.net/en/sensors/ky-003'),
  dr: R('Arduino reference: digitalRead()', 'https://docs.arduino.cc/language-reference/en/functions/digital-io/digitalread/'),
  esp: R('Espressif ESP32 Series Datasheet', 'https://documentation.espressif.com/esp32_datasheet_en.pdf'),
  uq: R('Arduino UNO Q datasheet', 'https://docs.arduino.cc/hardware/uno-q/'),
  gz: R('GPIO Zero documentation: Input devices', 'https://gpiozero.readthedocs.io/en/stable/api_input.html'),
  pi: R('Raspberry Pi documentation: GPIO and the 40-pin header', 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#gpio'),
};

// ---- listings (line numbers are checked by tools/check_code.mjs through `checks`) --------------------------
const code = {}, checks = {};
const def = (key, src, ck) => { code[key] = src; checks[key] = ck; };
const ARD = (pin, baud) => ({
  vib: `const int vibPin = ${pin};       // DO of the SW-420 module
unsigned long lastHit = 0;
int hits = 0;

void setup() {
  pinMode(vibPin, INPUT);
  Serial.begin(${baud});
}

void loop() {
  if (digitalRead(vibPin) == HIGH) {      // HIGH = vibration on most modules
    hits++;
    Serial.print("Vibration! count = ");
    Serial.println(hits);
    delay(500);                           // ignore the rest of the burst
  }
  delay(10);
}`,
  hall: `const int hallPin = ${pin};      // OUT of the A3144 (open collector, 10k pull-up)
bool wasNear = false;
int passes = 0;

void setup() {
  pinMode(hallPin, INPUT);
  Serial.begin(${baud});
}

void loop() {
  bool magnet = digitalRead(hallPin) == LOW;   // LOW = magnet detected
  if (magnet && !wasNear) {
    passes++;
    Serial.print("Magnet! count = ");
    Serial.println(passes);
  }
  wasNear = magnet;
  delay(10);
}`,
  line: `const int linePin = ${pin};      // DO of the TCRT5000 module

void setup() {
  pinMode(linePin, INPUT);
  Serial.begin(${baud});
}

void loop() {
  if (digitalRead(linePin) == HIGH) {    // HIGH = dark surface (little reflection) on most modules
    Serial.println("LINE: dark surface");
  } else {
    Serial.println("floor: bright surface");
  }
  delay(200);
}`,
});
const ARD_CK = {
  vib: [[1, 'vibPin ='], [6, 'pinMode(vibPin'], [7, 'Serial.begin'], [10, 'void loop'], [11, 'digitalRead(vibPin) == HIGH'], [12, 'hits++'], [13, '"Vibration! count = "'], [14, 'Serial.println(hits)'], [15, 'delay(500)'], [17, 'delay(10)']],
  hall: [[1, 'hallPin ='], [6, 'pinMode(hallPin'], [7, 'Serial.begin'], [10, 'void loop'], [11, 'digitalRead(hallPin) == LOW'], [12, 'magnet && !wasNear'], [13, 'passes++'], [14, '"Magnet! count = "'], [15, 'Serial.println(passes)'], [17, 'wasNear = magnet'], [18, 'delay(10)']],
  line: [[1, 'linePin ='], [4, 'pinMode(linePin'], [5, 'Serial.begin'], [8, 'void loop'], [9, 'digitalRead(linePin) == HIGH'], [10, 'dark surface'], [12, 'bright surface'], [14, 'delay(200)']],
};
for (const [b, pin, baud] of [['u3', 2, 9600], ['uq', 2, 9600], ['e32', 26, 115200]]) {
  const c = ARD(pin, baud);
  for (const k of ['vib', 'hall', 'line']) def(`a_${k}_${b}`, c[k], ARD_CK[k]);
}
const PY = {
  vib: `from gpiozero import DigitalInputDevice
from time import sleep

vib = DigitalInputDevice(22)     # DO of the SW-420 module (GPIO22, pin 15)
hits = 0

while True:
    if vib.value == 1:           # HIGH = vibration on most modules
        hits += 1
        print("Vibration! count =", hits)
        sleep(0.5)               # ignore the rest of the burst
    sleep(0.01)`,
  hall: `from gpiozero import Button
from time import sleep

hall = Button(27, pull_up=True)    # OUT of the A3144 (GPIO27, pin 13); "pressed" = pin LOW = magnet
was_near = False
passes = 0

while True:
    magnet = hall.is_pressed
    if magnet and not was_near:
        passes += 1
        print("Magnet! count =", passes)
    was_near = magnet
    sleep(0.01)`,
  line: `from gpiozero import DigitalInputDevice
from time import sleep

line = DigitalInputDevice(17)    # DO of the TCRT5000 module (GPIO17, pin 11)

while True:
    if line.value == 1:          # HIGH = dark surface (little reflection) on most modules
        print("LINE: dark surface")
    else:
        print("floor: bright surface")
    sleep(0.2)`,
};
def('a_vib_pi', PY.vib, [[4, 'DigitalInputDevice(22)'], [5, 'hits = 0'], [7, 'while True'], [8, 'vib.value == 1'], [9, 'hits += 1'], [10, '"Vibration! count ="'], [11, 'sleep(0.5)'], [12, 'sleep(0.01)']]);
def('a_hall_pi', PY.hall, [[4, 'Button(27, pull_up=True)'], [5, 'was_near'], [6, 'passes = 0'], [8, 'while True'], [9, 'hall.is_pressed'], [10, 'magnet and not was_near'], [11, 'passes += 1'], [12, '"Magnet! count ="'], [13, 'was_near = magnet'], [14, 'sleep(0.01)']]);
def('a_line_pi', PY.line, [[4, 'DigitalInputDevice(17)'], [6, 'while True'], [7, 'line.value == 1'], [8, '"LINE: dark surface"'], [10, '"floor: bright surface"'], [11, 'sleep(0.2)']]);

// ---- programs ---------------------------------------------------------------------------------------------
const programs = {};
const arduinoProg = (kind, pin) => async (rt) => {
  if (kind === 'vib') {
    let hits = 0;
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(6); rt.pinMode(pin, 'INPUT');
    await rt.at(7); rt.serialBegin(9600);
    for (;;) {
      await rt.at(10);
      await rt.at(11);
      if (rt.digitalRead(pin) === 1) {
        await rt.at(12); hits++;
        await rt.at(13); rt.print('Vibration! count = ');
        await rt.at(14); rt.println(hits);
        await rt.at(15); await rt.delay(500);
      }
      await rt.at(17); await rt.delay(10);
    }
  } else if (kind === 'hall') {
    let was = false, passes = 0;
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(6); rt.pinMode(pin, 'INPUT');
    await rt.at(7); rt.serialBegin(9600);
    for (;;) {
      await rt.at(10);
      await rt.at(11); const magnet = rt.digitalRead(pin) === 0;
      await rt.at(12);
      if (magnet && !was) {
        await rt.at(13); passes++;
        await rt.at(14); rt.print('Magnet! count = ');
        await rt.at(15); rt.println(passes);
      }
      await rt.at(17); was = magnet;
      await rt.at(18); await rt.delay(10);
    }
  } else {
    await rt.at(1);
    await rt.at(4); rt.pinMode(pin, 'INPUT');
    await rt.at(5); rt.serialBegin(9600);
    for (;;) {
      await rt.at(8);
      await rt.at(9);
      if (rt.digitalRead(pin) === 1) { await rt.at(10); rt.println('LINE: dark surface'); }
      else { await rt.at(12); rt.println('floor: bright surface'); }
      await rt.at(14); await rt.delay(200);
    }
  }
};
for (const k of ['vib', 'hall', 'line']) {
  programs[`a_${k}_u3`] = arduinoProg(k, 'D2');
  programs[`a_${k}_uq`] = arduinoProg(k, 'D2');
  programs[`a_${k}_e32`] = arduinoProg(k, 'G26');
}
programs.a_vib_pi = async (rt) => {
  let hits = 0; rt.serialBegin(9600);
  await rt.at(1); await rt.at(2); await rt.at(4); rt.pinMode('p15', 'INPUT'); await rt.at(5);
  for (;;) {
    await rt.at(7);
    await rt.at(8);
    if (rt.digitalRead('p15') === 1) { await rt.at(9); hits++; await rt.at(10); rt.println('Vibration! count = ' + hits); await rt.at(11); await rt.delay(500); }
    await rt.at(12); await rt.delay(10);
  }
};
programs.a_hall_pi = async (rt) => {
  let was = false, passes = 0; rt.serialBegin(9600);
  await rt.at(1); await rt.at(2); await rt.at(4); rt.pinMode('p13', 'INPUT_PULLUP'); await rt.at(5); await rt.at(6);
  for (;;) {
    await rt.at(8);
    await rt.at(9); const magnet = rt.digitalRead('p13') === 0;
    await rt.at(10);
    if (magnet && !was) { await rt.at(11); passes++; await rt.at(12); rt.println('Magnet! count = ' + passes); }
    await rt.at(13); was = magnet;
    await rt.at(14); await rt.delay(10);
  }
};
programs.a_line_pi = async (rt) => {
  rt.serialBegin(9600);
  await rt.at(1); await rt.at(2); await rt.at(4); rt.pinMode('p11', 'INPUT');
  for (;;) {
    await rt.at(6);
    await rt.at(7);
    if (rt.digitalRead('p11') === 1) { await rt.at(8); rt.println('LINE: dark surface'); } else { await rt.at(10); rt.println('floor: bright surface'); }
    await rt.at(11); await rt.delay(200);
  }
};

// ---- circuits ---------------------------------------------------------------------------------------------
const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const jw = (id, from, to, color = 'black', lift = 12) => ({ id, type: 'wire', from, to, color, lift });
const ids = a => a.map(d => d.id);
const mod = (id, model, x, z) => ({ id, type: 'mod', model, x, z });
const COL = { VCC: 'red', GND: 'black' };
const COLORS = ['blue', 'green', 'yellow', 'orange'];
const bb = (id, pairs, c0 = 10) => pairs.flatMap(([mp, net], i) => {
  const c = COL[mp] || COLORS[i % COLORS.length];
  return [fw(id + 'm' + i, id + '.' + mp, 'a' + (c0 + i), c, 16 + 2 * i), fw(id + 'b' + i, net, 'b' + (c0 + i), c, 22 + 3 * i)];
});
const STEP = (title, view, have, body, o = {}) => ({ title, view, have, power: false, body, ...o });
const mio = (kind, item, needs, pin, mp, pw) => ({ [pin]: { kind: 'dev:' + kind, role: 'do', item, mp, needs, pw } });

// Board descriptions. vcc: where a 3.3 V / 5 V module is powered (by board); gnd; sig: signal pin(s); style: 'direct' (module wires to the header) or 'bb' (through the breadboard)
const B = {
  u3: { name: 'Arduino UNO R3', view: 'dispq', style: 'direct', logic: '5 V', vcc: '5V', vccNet: '5V', gnd: 'GND2', gndNet: 'GND', sig: { vib: 'D2', hall: 'D2', line: 'D2' }, v5: '5V', v5Net: '5V', pull: '5V', pullNet: '5V' },
  uq: { name: 'Arduino UNO Q', view: 'dispq', style: 'direct', logic: '3.3 V', vcc: '3V3', vccNet: '3V3', gnd: 'GND2', gndNet: 'GND', sig: { vib: 'D2', hall: 'D2', line: 'D2' }, v5: '5V', v5Net: '5V', pull: '3V3', pullNet: '3V3' },
  e32: { name: 'ESP32 DevKit V1', view: 'scanv', style: 'bb', logic: '3.3 V', vcc: '3V3', vccNet: '3V3', gnd: 'GND2', gndNet: 'GND', sig: { vib: 'G26', hall: 'G26', line: 'G26' }, v5: 'VIN', v5Net: 'VIN', pull: '3V3', pullNet: '3V3' },
  pi: { name: 'Raspberry Pi 4', view: 'pibb', style: 'bb', logic: '3.3 V', vcc: 'p1', vccNet: '3V3', gnd: 'p14', gndNet: 'GND', sig: { vib: 'p15', hall: 'p13', line: 'p11' }, v5: 'p2', v5Net: '5V', pull: 'p1', pullNet: '3V3' },
};
const GPIO = { p15: 'GPIO22 (pin 15)', p13: 'GPIO27 (pin 13)', p11: 'GPIO17 (pin 11)' };
const sigName = (b, k) => { const s = B[b].sig[k]; return b === 'pi' ? GPIO[s] : b === 'e32' ? 'GPIO' + s.slice(1) : 'pin ' + s.slice(1); };

function circuit(b, k) {
  const c = B[b], sig = c.sig[k], id = k === 'vib' ? 'vb1' : k === 'hall' ? 'hl1' : 'ln1', model = k === 'vib' ? 'mod_vib' : k === 'hall' ? 'mod_a3144' : 'mod_tcrt';
  const [mx, mz] = c.style === 'direct' ? [20, 138] : b === 'pi' ? [125, -45] : [20, 138];
  const m = mod(id, model, mx, mz);
  const extra = k === 'line' ? [] : [];
  let parts, io;
  if (k === 'hall') {
    if (c.style === 'direct') {
      const same = c.pull === c.v5;      // UNO R3: the sensor and the pull-up share the 5V pin, so VCC goes through column 16
      parts = [m, fw('f1', id + '.VCC', same ? 'a16' : c.v5, 'red', 30), fw('f2', id + '.GND', c.gnd, 'black', 24), fw('f3', id + '.OUT', 'a10', 'green', 36), jw('w1', sig, 'b10', 'green', 16),
        { id: 'r1', type: 'resistor', a: 'c10', b: same ? 'c16' : 'c14', ohms: 10000 }, jw('w2', c.pull, same ? 'b16' : 'a14', 'red', 14)];
    } else {
      parts = [m, ...bb(id, [['VCC', c.v5], ['GND', c.gnd], ['OUT', sig]]), { id: 'r1', type: 'resistor', a: 'c12', b: 'c14', ohms: 10000 }, fw('w2', c.pull, 'b14', 'red', 40)];
    }
    io = mio('a_hall', id, ids(parts), sig, id + '.OUT', [[id + '.VCC', c.v5Net], [id + '.GND', 'GND']]);
  } else {
    const dout = k === 'vib' ? 'DO' : 'DO';
    if (c.style === 'direct') parts = [m, fw('f1', id + '.VCC', c.vcc, 'red', 30), fw('f2', id + '.GND', c.gnd, 'black', 24), fw('f3', id + '.' + dout, sig, 'green', 36)];
    else parts = [m, ...bb(id, [['VCC', c.vcc], ['GND', c.gnd], [dout, sig]])];
    io = mio(k === 'vib' ? 'a_vib' : 'a_line', id, ids(parts), sig, id + '.DO', [[id + '.VCC', c.vccNet], [id + '.GND', 'GND']]);
  }
  return { parts, io, id, extra };
}

// ---- lesson text ------------------------------------------------------------------------------------------
const hwList = (b, k) => {
  const brd = B[b].name, jw3 = B[b].style === 'bb' ? '3 × jumper wires (female–male)' : '3 × female jumper wires';
  if (k === 'hall') return [brd, 'A3144 Hall switch (or a KY-003 module, see the note in the lesson)', '10 kΩ resistor (pull-up)', 'A small magnet', B[b].style === 'bb' ? 'Breadboard and 4 jumper wires' : 'Breadboard and 4 jumper wires'];
  return [brd, k === 'vib' ? 'SW-420 vibration sensor module (VCC, GND, DO)' : 'TCRT5000 line-follow module (VCC, GND, DO)', jw3];
};
const wireText = (b, k) => {
  const c = B[b], sig = sigName(b, k);
  const where = (n) => (c.style === 'bb' ? 'Module pins go to the holes in row a, the board pins to the same columns in row b. ' : '');
  const pinList = c.style === 'bb'
    ? (b === 'pi' ? `VCC to 3V3 (pin 1), GND to pin 14, DO to ${sig}.` : `VCC to 3V3, GND to GND, DO to ${sig}.`)
    : `VCC to ${c.vcc}, GND to GND, DO to ${sig}.`;
  return where() + pinList;
};

function hallWire(b) {
  const c = B[b], sig = sigName(b, 'hall');
  const n5 = b === 'pi' ? '5V (pin 2)' : b === 'e32' ? 'VIN (the 5 V from USB)' : '5V';
  const n33 = b === 'u3' ? '5V' : b === 'pi' ? '3V3 (pin 1)' : '3V3';
  return `<ul><li>The sensor’s <b>VCC</b> goes to <b>${n5}</b> and its <b>GND</b> to <b>${b === 'pi' ? 'GND (pin 14)' : 'GND'}</b>.</li><li>Its <b>OUT</b> goes to <b>${sig}</b>.</li><li>A <b>10 kΩ</b> resistor connects the OUT line to <b>${n33}</b> (the pull-up).</li></ul>${c.style === 'bb' ? '<p>Module pins land in row a, board pins in row b of the same column; the resistor joins the OUT column to the pull-up column.</p>' : `<p>The OUT wire lands in column 10 (a10); the pin wire joins it in b10; the resistor runs from c10 to ${b === 'u3' ? 'c16, a column that is also fed with 5V (VCC lands in a16, the 5V wire in b16)' : 'c14, and the pull-up supply wire reaches column 14 (a14)'}.</p>`}`;
}

const LV = {
  u3: 'The UNO R3 has 5 V logic, so a module powered from 5V gives DO up to 5 V, which the pin accepts.',
  uq: 'The UNO Q has 3.3 V logic. Power the module from <b>3V3</b>: then DO swings up to 3.3 V only. D2 is a 5 V-tolerant digital input (UNO Q pin data), but A0 to A5 are <b>not</b>, so keep digital sensors on digital pins.',
  e32: 'The ESP32 has 3.3 V logic and its pins are <b>not</b> 5 V tolerant. Power the module from <b>3V3</b> so DO stays at 3.3 V or below (the module’s output usually follows its own supply: check yours).',
  pi: 'The Pi’s GPIO pins are 3.3 V and are <b>not</b> 5 V tolerant. Power the module from <b>3V3</b> (pin 1) so DO stays within 3.3 V (the module’s output usually follows its own supply: check yours).',
};
const CODE_NOTE = (b) => (b === 'pi' ? '<p class="sim">The Python lines are written from memory of the GPIO Zero documentation and have <b>not</b> been run on a real Pi.</p>' : b === 'uq' ? '<p class="sim">Checked in the simulator only: this sketch has <b>not</b> been run on a real UNO Q board.</p>' : '<p class="sim">Checked in the simulator only: this sketch has <b>not</b> been run on a real board.</p>');
const DO_SERIAL = (b) => (b === 'pi' ? 'the Shell' : 'the Serial Monitor');
const fileOf = (b, k) => (b === 'pi' ? { vib: 'vibration.py', hall: 'hall_switch.py', line: 'line_follow.py' }[k] : { vib: 'VibrationSensor.ino', hall: 'HallSwitch.ino', line: 'LineFollow.ino' }[k]);

function mkLesson(b, k) {
  const c = B[b], C = circuit(b, k), pinName = sigName(b, k), id = C.id, V = c.view, ALL = ids(C.parts);
  const key = `a_${k}_${b}`;
  const baud = b === 'e32' ? 115200 : 9600;
  const common = { module: 30, level: 'Beginner', time: '20 min', file: fileOf(b, k), code: code[key], program: key, fast: true, circuit: C.parts, io: C.io, hardware: hwList(b, k), widgets: ['dv:a_' + k] };
  if (k === 'vib') return {
    ...common, title: 'Vibration sensor (SW-420 module): detect a knock',
    goal: 'Read the digital output of an SW-420 style vibration module and count knocks.',
    explain: { 1: `The module’s DO output on ${pinName}.`, 6: 'The pin is an input: the module drives it.', 7: `Serial output on (${baud} baud).`, 11: 'On most modules DO goes HIGH while vibration is detected; some boards are the other way round, so test yours.', 12: 'Count the event.', 15: 'One knock gives a burst of changes; wait so that it counts once.' },
    steps: [
      STEP('A switch that feels shaking', V, [], `<p>The sensor on an SW-420 module is a small <b>vibration switch</b> (a contact that opens and closes when it is shaken). Next to it, an <b>LM393 comparator</b> and a trimmer turn that into a clean digital output <b>DO</b>.</p><p class="warn">The module is described by sellers and tutorials as a <i>normally closed</i> sensor with an adjustable sensitivity and DO going HIGH on vibration (Components101 page; no maker datasheet exists). It senses <b>whether</b> the module is shaken, not how strongly, and not in which direction. Output polarity can differ between boards.</p>`),
      STEP('The module', V, [id], `<p><b>Click the module.</b> Three pins: <b>VCC</b>, <b>GND</b> and <b>DO</b> (the order on your module can differ, read the silkscreen). Sellers give a supply of 3.3 to 5 V; the LM393 itself is rated for 2 V and up (TI datasheet).</p><p class="warn">${LV[b]}</p>`),
      STEP('Wire it', V, ALL, `<p>${wireText(b, k)}</p>`, { pins: b === 'pi' ? ['p1', 'p14', c.sig[k]] : [c.vcc, c.gnd, c.sig[k]] }),
      STEP('The code', V, ALL, `<p>Click lines <b>${b === 'pi' ? '8' : '11'}</b> and <b>${b === 'pi' ? '11' : '15'}</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and shake', V, ALL, `<p>Press <b>▶ Run</b>. Use <b>Tap</b> or move the <b>Shaking</b> slider above the sensitivity level: DO goes HIGH and ${DO_SERIAL(b)} prints a new count. Turn the sensitivity (the trimmer) to make it more or less sensitive.</p><p class="sim">A real switch gives short, irregular pulses, not a steady level; the simulator is simplified.</p>${CODE_NOTE(b)}`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', V, ALL, `<ul><li>SW-420 module: vibration switch + LM393 comparator + trimmer, one digital output.</li><li>It tells you <i>that</i> something shook, not how much.</li><li>Debounce: ignore the rest of a burst after the first hit.</li><li>Power from the logic voltage of your board so DO is safe for the pin.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What does the trimmer on the vibration module change?', a: ['How strong a vibration is needed to switch DO', 'The supply voltage', 'The baud rate', 'The colour of the LED'], c: 0, why: 'It sets the comparator threshold (the sensitivity).' },
      { q: 'Why does the sketch wait after counting a hit?', a: ['One knock gives a burst of changes and should count once', 'To save power', 'To let the LED cool', 'Serial needs it'], c: 0, why: 'The switch bounces during a knock.' },
      { q: b === 'u3' ? 'Why is the module powered from 5V on the UNO R3?' : 'Why is the module powered from 3V3 here?', a: b === 'u3' ? ['It works from 3.3 to 5 V and the pins are 5 V', 'It needs 12 V', 'It is a motor', 'It has no GND'] : ['So that DO never goes above the 3.3 V logic level', 'It needs 12 V', 'It is a motor', 'It has no GND'], c: 0, why: b === 'u3' ? 'Listed supply 3.3 to 5 V; the R3 inputs are 5 V.' : 'The output follows the supply and the pins are 3.3 V.' },
    ],
    sources: [SRCS.sw420, SRCS.lm393, b === 'pi' ? SRCS.gz : b === 'e32' ? SRCS.esp : b === 'uq' ? SRCS.uq : SRCS.dr],
  };
  if (k === 'hall') return {
    ...common, title: 'Hall switch (A3144): sense a magnet', time: '25 min',
    goal: 'Detect a magnet with an A3144 Hall switch whose open-collector output is pulled up by a resistor, and count magnet passes.',
    explain: { 1: `OUT of the A3144 on ${pinName}.`, 6: b === 'pi' ? 'The pin is an input.' : 'The pin is an input; the 10 kΩ resistor is the pull-up.', 7: `Serial output on (${baud} baud).`, 11: 'The A3144 pulls OUT <b>LOW</b> when the field passes its operate point.', 12: 'Count a pass only on the change from far to near.', 17: 'Remember the state for the next loop.' },
    steps: [
      STEP('A switch for magnetic fields', V, [], `<p>The A3144 is a <b>Hall-effect switch</b>: when the magnetic field at the chip rises above the <b>operate point</b> (BOP) its output turns on and pulls the line <b>LOW</b>; when the field falls below the <b>release point</b> (BRP) it lets go. The gap between them is the <b>hysteresis</b>, which stops chatter.</p><p>The Allegro datasheet gives, at 25 °C: BOP between <b>70 and 350 gauss</b>, BRP between <b>50 and 330 gauss</b>, hysteresis at least 20 G (typical 55 G). Each chip differs inside these limits. It responds to <b>one</b> magnetic pole only: the magnet must face the marked side of the package with the right pole (commonly stated as the south pole; this detail is <b>not</b> in the datasheet text I checked, so test your magnet and turn it over if nothing happens).</p>`),
      STEP('The supply and the pull-up', V, [id], `<p><b>Click the part.</b> Datasheet limits: supply <b>4.5 to 24 V</b>, output current up to <b>25 mA</b>, output off voltage up to 28 V. The output is <b>open collector</b>: it can only pull the line down, so an external pull-up resistor is needed.</p><p class="warn">${b === 'u3' ? 'On the UNO R3 the 5 V supply meets the 4.5 V minimum and the pull-up goes to 5V.' : 'The A3144 needs at least <b>4.5 V</b>, so it is <b>not</b> specified for a 3.3 V supply: power it from the <b>5 V</b> pin. Because the output is open collector, put the pull-up resistor to <b>3V3</b> instead: OUT then swings between about 0 V and 3.3 V, which is safe for this board.'}</p><p class="warn">A ready-made <b>KY-003</b> module (Joy-IT lists it as a 5 V module) already has a pull-up wired to its own supply, so on a 3.3 V board its S pin would reach about 5 V: use the bare chip as here, or add a level shifter. I did not check the pull-up value on KY-003 boards.</p><p class="sim">The 3D part is the A3144 on a tiny carrier so that it has header pins; in a kit the chip is a three-legged TO-92 part (pins: 1 VCC, 2 GND, 3 OUT, seen from the marked face; check the datasheet drawing).</p>`),
      STEP('Wire it', V, ALL, hallWire(b), { pins: b === 'pi' ? ['p2', 'p14', c.sig.hall, 'p1'] : b === 'u3' ? ['5V', c.gnd, c.sig.hall] : [c.v5, c.gnd, c.sig.hall, '3V3'] }),
      STEP('The code', V, ALL, `<p>Click lines <b>${b === 'pi' ? '9' : '11'}</b> and <b>${b === 'pi' ? '10' : '12'}</b>.</p>${b === 'pi' ? '<p>Button(27, pull_up=True) treats a LOW pin as “pressed”. The library calls are from memory of the GPIO Zero documentation.</p>' : ''}`, { showCode: true, power: true }),
      STEP('Run it and bring a magnet', V, ALL, `<p>Press <b>▶ Run</b>. Raise the field slider: when it passes the operate point the output goes LOW and ${DO_SERIAL(b)} prints a count; it stays LOW until the field falls below the release point. Flip the pole: the A3144 does not respond to the other pole.</p><p class="sim">The sample unit uses BOP = 200 G and BRP = 145 G, values inside the datasheet limits but only an example. The distance-to-gauss relation is not modelled.</p>${CODE_NOTE(b)}`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', V, ALL, `<ul><li>A3144: Hall switch, 4.5 to 24 V, open-collector output (25 mA), BOP 70 to 350 G, BRP 50 to 330 G.</li><li>Output LOW = magnet; it needs a pull-up resistor.</li><li>Hysteresis stops chatter near the threshold.</li><li>On a 3.3 V board: power it from 5 V, pull the output up to 3.3 V.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What is the minimum supply voltage of the A3144?', a: ['4.5 V', '1.8 V', '3.3 V', '12 V'], c: 0, why: 'Allegro: 4.5 V to 24 V operation.' },
      { q: 'Why does the output need a pull-up resistor?', a: ['It is open collector and can only pull the line down', 'It is an analog output', 'It is slow', 'It has no GND'], c: 0, why: 'The output transistor only sinks current.' },
      { q: 'What does hysteresis (BOP - BRP) do?', a: ['Prevents chatter near the switching field', 'Makes it more sensitive', 'Changes the supply', 'Measures temperature'], c: 0, why: 'The output turns on and off at different fields.' },
    ],
    sources: [SRCS.a3144, SRCS.ky003, b === 'pi' ? SRCS.gz : b === 'e32' ? SRCS.esp : b === 'uq' ? SRCS.uq : SRCS.dr],
  };
  return {
    ...common, title: 'Line-follow IR sensor (TCRT5000 module): dark or bright floor',
    goal: 'Read the digital output of a TCRT5000 reflective sensor module to tell a dark line from a bright floor.',
    explain: { 1: `DO of the module on ${pinName}.`, 4: 'The pin is an input.', 5: `Serial output on (${baud} baud).`, 9: 'On most modules DO is HIGH over a dark surface (little reflection) and LOW over a bright one; some are the other way round.', 14: 'Check a few times per second.' },
    steps: [
      STEP('Light that bounces back', V, [], `<p>The <b>TCRT5000</b> holds an infrared LED and a phototransistor side by side. Light from the LED bounces off the surface in front of it; the phototransistor measures how much comes back. A <b>bright, shiny</b> surface reflects a lot, a <b>dark matte</b> one (black tape) very little. An <b>LM393</b> comparator and a trimmer turn this into DO.</p><p>Vishay datasheet: emitter wavelength <b>950 nm</b>, the strongest signal at about <b>2.5 mm</b> distance, usable from <b>0.2 to 15 mm</b>, with a daylight blocking filter. The emitter is rated up to 60 mA (absolute maximum); the module sets its own current with a resistor.</p><p class="warn">The module’s output polarity, LED behaviour and range depend on the board. Tutorials describe DO HIGH over black and LOW over white; check yours. Very dark or very shiny surfaces and strong infrared light can fool it.</p>`),
      STEP('The module', V, [id], `<p><b>Click the module.</b> It has VCC, GND, DO and often an AO pin (not used here). Sellers give a supply of 3.3 to 5 V (no maker datasheet); the LM393 itself is rated from 2 V (TI datasheet).</p><p class="warn">${LV[b]}</p>`),
      STEP('Wire it', V, ALL, `<p>${wireText(b, k)}</p>`, { pins: b === 'pi' ? ['p1', 'p14', c.sig[k]] : [c.vcc, c.gnd, c.sig[k]] }),
      STEP('The code', V, ALL, `<p>Click lines <b>${b === 'pi' ? '7' : '9'}</b> and <b>${b === 'pi' ? '11' : '14'}</b>.</p>`, { showCode: true, power: true }),
      STEP('Run it and move the floor', V, ALL, `<p>Press <b>▶ Run</b>. Choose <b>White paper</b> or <b>Black tape</b>, or set the reflectivity and the distance yourself. Past the trimmer level DO changes and ${DO_SERIAL(b)} prints the other message. Move the surface far away: little light returns, so it looks dark too.</p><p class="sim">The distance curve is a simplified shape built on the datasheet’s 2.5 mm peak and 0.2 to 15 mm range; real parts and surfaces differ.</p>${CODE_NOTE(b)}`, { showCode: true, power: true, action: 'run' }),
      STEP('Summary', V, ALL, `<ul><li>TCRT5000: 950 nm infrared LED plus phototransistor; best at about 2.5 mm, usable 0.2 to 15 mm.</li><li>The module gives a threshold output; the trimmer sets where it switches.</li><li>A robot uses two or three of them to follow a line.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'At which distance does the TCRT5000 give its strongest signal?', a: ['About 2.5 mm', 'About 25 cm', 'About 1 m', 'Touching the surface'], c: 0, why: 'Vishay: peak operating distance 2.5 mm.' },
      { q: 'Why is the module held close to the floor?', a: ['The usable range is only 0.2 to 15 mm', 'It needs the heat', 'It is magnetic', 'It is waterproof'], c: 0, why: 'Vishay: operating range 0.2 to 15 mm.' },
      { q: 'What does the LM393 do on the module?', a: ['Compares the phototransistor level with the trimmer setting', 'Makes the infrared light', 'Stores the program', 'Measures temperature'], c: 0, why: 'It is a comparator.' },
    ],
    sources: [SRCS.tcrt, SRCS.lm393, b === 'pi' ? SRCS.gz : b === 'e32' ? SRCS.esp : b === 'uq' ? SRCS.uq : SRCS.dr],
  };
}

const lessons = { u3: [], e32: [], uq: [], pi: [] };
for (const b of Object.keys(lessons)) for (const k of ['vib', 'hall', 'line']) lessons[b].push(mkLesson(b, k));
const T = 'Module 30 — Digital sensor modules: vibration, Hall switch, line-follow IR';

export default { lessons, modules: { u3: { 30: T }, e32: { 30: T }, uq: { 30: T }, pi: { 30: T } }, programs, code, checks };

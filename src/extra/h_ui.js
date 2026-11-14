// Browser-only additions of slot h: simulated devices for the ESP32 project lessons (servo, alarm, smart door, two-motor car).
// The generic io kinds of main.js ('servo', 'pir', 'hcsr04', 'motor') assume UNO pins (D2, D5, D7, D8, 5V) and UNO labels, so these
// lessons use their own device classes (io kind 'dev:<name>') that work on any ESP32 GPIO:
//   dv:sv32   - SG90 servo driven by a 50 Hz LEDC PWM signal; the pulse width is computed from the duty cycle
//   dv:pir32  - HC-SR501 PIR: warm-up, motion buttons, output hold time
//   dv:sonar32 - HC-SR04 with an obstacle slider; the echo is returned by rt.dev('sonar', 'pulse') (like pulseIn on the ECHO pin)
//   dv:car32  - the two motors of an L293D (enable, 1A/2A, 3A/4A) and a plain-words description of the car's motion
// Imported by ui.js, never by the node check tools.
import { DEVICE_REG, Dev } from '../devices.js';

const $ = s => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ------------------------------------------------------------------------------------------------ servo on LEDC
const SV_MIN = 500, SV_MAX = 2400;       // SG90 datasheet: pulse width 500-2400 us for the 180 degree range
class Sv32 extends Dev {
  name = 'sv32'; us = null; target = null;
  html() {
    return this.box('SG90 servo (signal from LEDC PWM)', '<div id="s3-st" class="io-val">—</div>',
      `Assumptions: the PWM frequency is 50 Hz (a pulse every 20 ms), so pulse width = duty × 20 ms; ${SV_MIN} µs = 0° and ${SV_MAX} µs = 180° (the pulse range of the SG90 datasheet; real servos differ a little and the datasheet gives no tolerance). The horn moves at the datasheet no-load speed of 0.1 s per 60°; load, torque, jitter and the servo's internal control are not modelled.`);
  }
  reset() { this.us = null; this.target = null; }
  halt() { this.us = null; }
  pwm(pin, duty) {
    if (this.roleOf(pin) !== 'sig') return;
    if (duty <= 0) { this.us = 0; return; }
    this.us = duty * 20000;
    if (!this.on()) return;
    this.target = clamp((this.us - SV_MIN) / (SV_MAX - SV_MIN) * 180, 0, 180);
    const sv = this.item('sig'); if (sv) sv.target = this.target;
  }
  tick() {
    const sv = this.item('sig'), cur = sv ? Math.round(sv.angle) : 0;
    this.set('#s3-st', this.stateNote() || (this.us === null ? 'No signal yet: the servo holds where it is.'
      : this.us === 0 ? 'Duty 0: no pulses, the servo is not driven.'
        : `Pulse <b>${Math.round(this.us)} µs</b> every 20 ms → target <b>${this.target === null ? '—' : this.target.toFixed(0) + '°'}</b> · horn now <b>${cur}°</b>`));
  }
}

// ------------------------------------------------------------------------------------------------ PIR HC-SR501
class Pir32 extends Dev {
  name = 'pir32'; out = 0; readyAt = 0; was = false; motionUntil = 0; holdUntil = 0; still = false;
  html() {
    return this.box('PIR sensor HC-SR501', '<div class="io-tools"><button id="p3-wave" class="hold">Wave a hand (motion)</button><button id="p3-still" class="lvl">Hold still (no motion)</button></div><div id="p3-st" class="io-val">—</div>',
      'Simulated: the warm-up is shortened to 3 s (a real HC-SR501 needs about 1 minute), the output stays HIGH 5 s after the last movement (a simulator default; the real hold time is set by a trimmer), and a hand that does not move is not detected. Range, angle, sunlight, heat sources and the lens are not modelled.');
  }
  bind() { $('#p3-wave').onclick = () => { this.still = false; this.motionUntil = performance.now() + 1500; }; $('#p3-still').onclick = () => { this.still = true; this.motionUntil = 0; }; }
  reset() { this.out = 0; this.was = false; this.holdUntil = 0; this.motionUntil = 0; }
  halt() { this.motionUntil = 0; }
  update() {
    const now = performance.now(), on = this.on();
    if (on && !this.was) this.readyAt = now + 3000;
    this.was = on;
    if (!on || now < this.readyAt) { this.out = 0; this.holdUntil = 0; return; }
    if (now < this.motionUntil) this.holdUntil = now + 5000;
    this.out = now < this.holdUntil ? 1 : 0;
  }
  read(pin) { if (this.roleOf(pin) !== 'out') return undefined; this.update(); return this.out; }
  tick() {
    this.update();
    const now = performance.now(), warm = this.on() && now < this.readyAt;
    this.set('#p3-st', this.stateNote() || (warm ? `Warming up… ${Math.ceil((this.readyAt - now) / 1000)} s (a real sensor: about 1 minute)`
      : this.out ? `<b class="hi">MOTION</b> · OUT = HIGH (3.3 V) · falls ${Math.max(0, (this.holdUntil - now) / 1000).toFixed(1)} s after the last movement`
        : `Watching · OUT = LOW (0 V)${this.still ? ' · a hand held still is not detected' : ''}`));
  }
}

// ------------------------------------------------------------------------------------------------ HC-SR04
class Sonar32 extends Dev {
  name = 'sonar32'; cm = 100; trigAt = -1e9;
  html() {
    return this.box('Obstacle in front of the HC-SR04', '<input id="so-d" type="range" min="2" max="400" step="0.5" value="100"><div class="io-tools">' + [5, 20, 40, 100, 250, 400].map(v => `<button class="lvl" data-so="${v}">${v} cm</button>`).join('') + '</div><div id="so-st" class="io-val">—</div>',
      'Simulated: one flat obstacle straight ahead. Echo time = distance × 58 µs/cm (HC-SR04 datasheet: range 2 cm to 400 cm). Angle, soft or slanted surfaces, temperature and noise are not modelled. The ECHO voltage shown assumes a 5.0 V ECHO signal and the exact 1 kΩ / 2 kΩ divider values.');
  }
  bind() {
    const s = $('#so-d'); s.oninput = () => { this.cm = +s.value; };
    document.querySelectorAll('[data-so]').forEach(b => { b.onclick = () => { this.cm = +b.dataset.so; s.value = this.cm; }; });
  }
  reset() { this.trigAt = -1e9; }
  pin(pin, level) { if (this.roleOf(pin) === 'trig' && level) this.trigAt = performance.now(); }
  async call(op) {
    if (op !== 'pulse') return undefined;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const ok = this.on() && performance.now() - this.trigAt < 100 && this.cm >= 2 && this.cm <= 400;
    if (!ok) { await sleep(30); return 0; }     // pulseIn() timeout of 30 ms: returns 0
    const us = Math.round(this.cm * 58);
    await sleep(Math.max(1, us / 1000));
    return us;
  }
  tick() {
    const us = Math.round(this.cm * 58);
    this.set('#so-st', this.stateNote() || `Obstacle <b>${this.cm.toFixed(1)} cm</b> → ECHO HIGH ≈ <b>${us} µs</b> → at the ESP32 pin (1 kΩ + 2 kΩ divider): <b>${(5 * 2 / 3).toFixed(2)} V</b> instead of 5 V`);
  }
}

// ------------------------------------------------------------------------------------------------ the two motors of the car
class Car32 extends Dev {
  name = 'car32'; en1 = 0; a1 = 0; b1 = 0; en2 = 0; a2 = 0; b2 = 0;
  html() {
    return this.box('The two motors (left = motor 1, right = motor 2)', '<div id="c3-st" class="io-val">—</div><div id="c3-mv" class="io-val">—</div>',
      'There are no wheels, chassis, ground or friction in the simulation: the sentence “the car …” only says what a car with these two motors would do, assuming that 1A HIGH / 2A LOW (and 3A HIGH / 4A LOW) is forward. Real cars mount the motors mirrored: swap one motor’s wires if it turns the wrong way. Motor start voltage, battery sag and the L293D voltage drop are not modelled.');
  }
  reset() { this.en1 = this.a1 = this.b1 = this.en2 = this.a2 = this.b2 = 0; }
  halt() { this.reset(); }
  pin(pin, level) { const r = this.roleOf(pin); if (!r) return; if (r.startsWith('en')) this[r] = level ? 1 : 0; else this[r] = level ? 1 : 0; }
  pwm(pin, duty) { const r = this.roleOf(pin); if (r === 'en1' || r === 'en2') this[r] = duty; }
  side(en, a, b) { return en > 0 && a !== b ? (a ? 1 : -1) * en : 0; }
  tick(dt = 0.016) {
    const ok = this.on() && this.running();
    const L = ok ? this.side(this.en1, this.a1, this.b1) : 0, R = ok ? this.side(this.en2, this.a2, this.b2) : 0;
    [['en1', L], ['en2', R]].forEach(([role, v]) => { const m = this.item(role); if (m) { m.speed = (m.speed || 0) + (v - (m.speed || 0)) * Math.min(1, dt / 0.25); if (m.spin) m.spin(dt); } });
    const word = v => (Math.abs(v) < 0.04 ? 'stopped' : (v > 0 ? 'forward ' : 'backward ') + Math.round(Math.abs(v) * 100) + ' %');
    const l = Math.abs(L) < 0.04 ? 0 : Math.sign(L), r = Math.abs(R) < 0.04 ? 0 : Math.sign(R);
    const mv = l === 0 && r === 0 ? 'stopped' : l === r ? (l > 0 ? 'driving forward' : 'backing up') : l === -r ? (l > 0 ? 'turning on the spot to the right (pivot)' : 'turning on the spot to the left (pivot)') : (l === 0 ? (r > 0 ? 'turning left around its left wheel' : 'turning right while reversing') : (r === 0 ? (l > 0 ? 'turning right around its right wheel' : 'turning left while reversing') : 'curving (unequal speed or direction)'));
    this.set('#c3-st', this.stateNote() || `Left motor: <b>${word(L)}</b> · Right motor: <b>${word(R)}</b>`);
    this.set('#c3-mv', ok ? `The car (if it had wheels) would be: <b>${mv}</b>` : '');
  }
}

DEVICE_REG.sv32 = Sv32;
DEVICE_REG.pir32 = Pir32;
DEVICE_REG.sonar32 = Sonar32;
DEVICE_REG.car32 = Car32;
export {};

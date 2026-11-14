// Browser-only additions of slot i: three simulated devices for the Raspberry Pi project lessons.
//   dv:ipir   - HC-SR501 PIR on a GPIO pin: a "wave a hand" button, shortened warm-up, an assumed output hold time
//   dv:isonar - HC-SR04 as GPIO Zero's DistanceSensor sees it: an obstacle slider, echo pulse width, the ECHO voltage divider
//   dv:imot   - two DC motors behind an L293D driven by GPIO Zero Motor objects (enable pin = plain digital, speed = PWM on the direction pin)
// Imported by ui.js, never by the node check tools.
import { DEVICE_REG, Dev } from '../devices.js';

const $ = s => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ------------------------------------------------------------------------------------------------ PIR
class IPir extends Dev {
  name = 'ipir'; motionUntil = 0; holdUntil = 0; t0 = performance.now();
  html() {
    return this.box('The room (PIR sensor)', '<div class="io-tools"><button id="ip-wave" class="hold small">Wave a hand (1.5 s)</button></div><div id="ip-st" class="io-val">—</div>',
      'Assumptions of this simulation: warm-up 4 s (a real HC-SR501 needs about a minute), output stays HIGH 3 s after the last movement (on the real module a trimmer sets this), a still hand or person is not detected. No range, angle or lens is modelled.');
  }
  bind() { const b = $('#ip-wave'); if (b) b.onclick = () => { this.motionUntil = performance.now() + 1500; }; }
  reset() { this.t0 = performance.now(); this.motionUntil = 0; this.holdUntil = 0; }
  warm() { return performance.now() - this.t0 > 4000; }
  level() {
    const now = performance.now();
    if (!this.on() || !this.running() || !this.warm()) return 0;
    if (now < this.motionUntil) this.holdUntil = now + 3000;
    return now < this.holdUntil ? 1 : 0;
  }
  read(pin) { return this.roleOf(pin) === 'out' ? this.level() : undefined; }
  tick() {
    const lv = this.level(), warm = this.warm();
    this.set('#ip-st', this.stateNote() || (!warm ? 'Warming up… the output stays LOW.' : lv ? 'Movement seen → <b class="hi">OUT HIGH (about 3.3 V)</b> → GPIO4 reads 1' : 'No movement → <b class="lo">OUT LOW</b> → GPIO4 reads 0'));
  }
}

// ------------------------------------------------------------------------------------------------ HC-SR04 as a DistanceSensor
class ISonar extends Dev {
  name = 'isonar'; cm = 60;
  html() {
    return this.box('Obstacle in front of the sensor', '<input id="is-cm" type="range" min="2" max="450" step="1" value="60"><div class="io-tools">' + [10, 20, 40, 100, 250, 450].map(v => `<button class="lvl" data-is="${v}">${v === 450 ? 'nothing' : v + ' cm'}</button>`).join('') + '</div><div id="is-st" class="io-val">—</div>',
      'The HC-SR04 datasheet: range 2 cm to 400 cm, echo pulse µs ÷ 58 = cm. Here the distance is exactly what you set (a real one jitters, depends on angle and surface). The ECHO divider is 1 kΩ + 2 kΩ: 5 V × 2/3 = 3.3 V.');
  }
  bind() {
    const s = $('#is-cm'); if (s) s.oninput = () => { this.cm = +s.value; };
    document.querySelectorAll('[data-is]').forEach(b => { b.onclick = () => { this.cm = +b.dataset.is; if (s) s.value = this.cm; }; });
  }
  call(op) { if (op === 'cm') return this.on() ? (this.cm > 400 ? null : this.cm) : null; return undefined; }
  tick() {
    const far = this.cm > 400;
    this.set('#is-st', this.stateNote() || (far ? 'Nothing within 4 m: no echo comes back → GPIO Zero reports its <code>max_distance</code>.'
      : `Obstacle at <b>${this.cm} cm</b> → echo pulse about <b>${Math.round(this.cm * 58)} µs</b> at 5 V → divider → <b>about 3.3 V</b> at GPIO27`));
  }
}

// ------------------------------------------------------------------------------------------------ two motors on an L293D
class IMot extends Dev {
  name = 'imot'; v = { en1: 0, a1: 0, b1: 0, en2: 0, a2: 0, b2: 0 };
  html() {
    return this.box('The two motors (left = motor 1, right = motor 2)', '<div id="im-st" class="io-val">—</div><div id="im-mv" class="io-val">—</div>',
      'There are no wheels, chassis or ground in the simulation: the sentence “the car …” only says what a car with these two motors would do, assuming forward is the same direction on both sides. Real cars mount the motors mirrored: swap one motor’s wires if it turns the wrong way. GPIO Zero Motor: enable = plain digital pin (on), speed = PWM on the forward or backward pin.');
  }
  reset() { for (const k in this.v) this.v[k] = 0; }
  halt() { this.reset(); }
  pin(pin, level) { const r = this.roleOf(pin); if (r) this.v[r] = level ? 1 : 0; }
  pwm(pin, duty) { const r = this.roleOf(pin); if (r) this.v[r] = duty; }
  side(n) { const { ['en' + n]: en, ['a' + n]: a, ['b' + n]: b } = this.v; if (en <= 0 || (a > 0 && b > 0)) return 0; return a > 0 ? a : b > 0 ? -b : 0; }
  tick(dt = 0.016) {
    const ok = this.on() && this.running(), L = ok ? this.side(1) : 0, R = ok ? this.side(2) : 0;
    [['a1', L], ['a2', R]].forEach(([role, t]) => { const m = this.item(role); if (m) { m.speed = (m.speed || 0) + (t - (m.speed || 0)) * Math.min(1, dt / 0.25); if (m.spin) m.spin(dt); } });
    const word = v => (Math.abs(v) < 0.04 ? 'stopped' : (v > 0 ? 'forward ' : 'backward ') + Math.round(Math.abs(v) * 100) + ' %');
    const l = Math.abs(L) < 0.04 ? 0 : Math.sign(L), r = Math.abs(R) < 0.04 ? 0 : Math.sign(R);
    const mv = l === 0 && r === 0 ? 'stopped' : l === r ? (l > 0 ? 'driving forward' : 'backing up') : l === -r ? (l > 0 ? 'turning on the spot to the right (pivot)' : 'turning on the spot to the left (pivot)') : 'curving or turning around one wheel';
    this.set('#im-st', this.stateNote() || `Left motor: <b>${word(L)}</b> · Right motor: <b>${word(R)}</b>`);
    this.set('#im-mv', ok ? `The car (if it had wheels) would be: <b>${mv}</b>` : '');
  }
}

DEVICE_REG.ipir = IPir;
DEVICE_REG.isonar = ISonar;
DEVICE_REG.imot = IMot;
export {};

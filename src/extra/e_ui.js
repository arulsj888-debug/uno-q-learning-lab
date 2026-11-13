// Browser-only additions of slot e: two simulated devices for the project lessons.
//   dv:pump  - a small DC motor standing in for a water pump behind a MOSFET gate, a water tank switch, and an assumed soil response
//   dv:car2  - the second motor of the two-motor robot car (other half of the L293D) and a plain-words description of the car's motion
// Imported by ui.js, never by the node check tools.
import { DEVICE_REG, Dev } from '../devices.js';

const $ = s => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ------------------------------------------------------------------------------------------------ pump behind a MOSFET
class Pump extends Dev {
  name = 'pump'; duty = 0; tank = 1; ranMs = 0;
  html() {
    return this.box('Water pump and tank', '<div class="io-tools"><button id="pm-tank" class="hold small">Water tank: full</button></div><div id="pm-st" class="io-val">—</div>',
      'Assumptions of this simulation, not measurements: the soil gains 8 % moisture per second while the pump runs with water in the tank, and loses 0.5 % per second otherwise. A small DC motor stands in for the pump; no tube, water, tank level or flow is modelled. The motor starts above about 25 % duty (typical).');
  }
  bind() { const b = $('#pm-tank'); if (b) b.onclick = () => { this.tank ^= 1; b.textContent = 'Water tank: ' + (this.tank ? 'full' : 'EMPTY'); }; }
  reset() { this.duty = 0; this.ranMs = 0; }
  halt() { this.duty = 0; }
  pin(pin, level) { if (this.roleOf(pin) === 'gate') this.duty = level ? 1 : 0; }
  pwm(pin, duty) { if (this.roleOf(pin) === 'gate') this.duty = duty; }
  tick(dt = 0.016) {
    const m = this.item('gate'), ok = this.on() && this.running(), pumping = ok && this.duty >= 0.25;
    if (m) { m.speed = (m.speed || 0) + ((pumping ? this.duty : 0) - (m.speed || 0)) * Math.min(1, dt / 0.35); if (m.spin) m.spin(dt); }
    const A = this.app;
    if (ok && A.sm) {
      A.sm.wet = clamp(A.sm.wet + (pumping ? (this.tank ? 8 : 0) : -0.5) * dt, 0, 100);
      const sl = $('#sm-w'), lb = $('#sm-wv'); if (sl) sl.value = Math.round(A.sm.wet); if (lb) lb.textContent = Math.round(A.sm.wet) + ' % wet';
    }
    if (pumping) this.ranMs += dt * 1000; else if (!ok) this.ranMs = 0;
    this.set('#pm-st', this.stateNote() || (pumping
      ? `Gate HIGH → the MOSFET conducts → <b>the pump runs</b> (${(this.ranMs / 1000).toFixed(1)} s)${this.tank ? '' : ' · <b class="lo">tank EMPTY: it runs dry and the soil stays dry</b>'}`
      : `Gate LOW → the MOSFET is off → <b>the pump is stopped</b>`));
  }
}

// ------------------------------------------------------------------------------------------------ second motor of the car + summary
class Car2 extends Dev {
  name = 'car2'; en = 0; a = 0; b = 0;
  html() {
    return this.box('The two motors (left = motor 1, right = motor 2)', '<div id="c2-st" class="io-val">—</div><div id="c2-mv" class="io-val">—</div>',
      'There are no wheels, chassis or ground in the simulation: the sentence “the car …” only says what a car with these two motors would do, assuming IN1 HIGH / IN2 LOW is forward on both sides. Real cars mount the motors mirrored: swap one motor’s wires if it turns the wrong way.');
  }
  reset() { this.en = 0; this.a = 0; this.b = 0; }
  halt() { this.reset(); }
  pin(pin, level) { const r = this.roleOf(pin); if (r === 'a2') this.a = level; else if (r === 'b2') this.b = level; else if (r === 'en2') this.en = level ? 1 : 0; }
  pwm(pin, duty) { if (this.roleOf(pin) === 'en2') this.en = duty; }
  side(en, a, b) { return en > 0 && a !== b ? (a ? 1 : -1) * en : 0; }
  tick(dt = 0.016) {
    const ok = this.on() && this.running(), M = this.app.mot || { en: 0, in1: 0, in2: 0 };
    const L = ok ? this.side(M.en, M.in1, M.in2) : 0, R = ok ? this.side(this.en, this.a, this.b) : 0;
    const m = this.item('en2'); if (m) { m.speed = (m.speed || 0) + (R - (m.speed || 0)) * Math.min(1, dt / 0.25); if (m.spin) m.spin(dt); }
    const word = v => (Math.abs(v) < 0.04 ? 'stopped' : (v > 0 ? 'forward ' : 'backward ') + Math.round(Math.abs(v) * 100) + ' %');
    const l = Math.abs(L) < 0.04 ? 0 : Math.sign(L), r = Math.abs(R) < 0.04 ? 0 : Math.sign(R);
    const mv = l === 0 && r === 0 ? 'stopped' : l === r ? (l > 0 ? 'driving forward' : 'backing up') : l === -r ? (l > 0 ? 'turning on the spot to the right (pivot)' : 'turning on the spot to the left (pivot)') : (l === 0 ? (r > 0 ? 'turning left around its left wheel' : 'turning right while reversing') : (r === 0 ? (l > 0 ? 'turning right around its right wheel' : 'turning left while reversing') : 'curving (unequal speed or direction)'));
    this.set('#c2-st', this.stateNote() || `Left motor: <b>${word(L)}</b> · Right motor: <b>${word(R)}</b>`);
    this.set('#c2-mv', ok ? `The car (if it had wheels) would be: <b>${mv}</b>` : '');
  }
}

DEVICE_REG.pump = Pump;
DEVICE_REG.car2 = Car2;
export {};

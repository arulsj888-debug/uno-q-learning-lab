// Sketch runner for the lessons. Each program below mirrors one listing in data/code.js line by line
// (line numbers are checked by tools/check_code.js). Behaviour follows the Arduino API as implemented in
// Arduino's Zephyr core for the UNO Q (ArduinoCore-zephyr: wiring_analog.cpp, Tone.cpp):
//  - analogRead() is 10-bit by default; analogReadResolution() rescales the result
//  - analogWrite() is 8-bit by default; on a non-PWM pin it writes HIGH if value > max/2, else LOW
//  - PWM frequency on the UNO Q is fixed at 500 Hz (UNO Q user manual)
//  - tone() starts a square wave and returns immediately; noTone() stops it
import { MATRIX_LINES } from './data/code.js';

class Stop extends Error {}
const frame = () => new Promise(r => requestAnimationFrame(() => r()));
export const PWM_PINS = ['D3', 'D5', 'D6', 'D9', 'D10', 'D11'];
export const VREF = 3.3;

export class Sim {
  constructor(hooks) {
    // hooks: line(n) pin(pin, level) pwm(pin, duty) tone(pin, freq, ms) noTone(pin)
    //        serial(text) state(running) read(pin, mode) -> 0/1   analog(pin) -> volts   matrix(values01)
    this.h = hooks;
    this.token = null;
  }
  get running() { return !!this.token; }

  stop() {
    const t = this.token;
    if (t) { t.stopped = true; for (const c of t.timers) clearTimeout(c); t.wake.forEach(f => f()); }
    this.token = null;
    if (t && t.tonePin) this.h.noTone(t.tonePin);
    this.h.line(null);
    this.h.state(false);
  }

  async run(program, opts = {}) {
    this.stop();
    const tok = this.token = { stopped: false, timers: new Set(), wake: new Set() };
    this.h.state(true);
    const H = this.h;
    const check = () => { if (tok.stopped) throw new Stop(); };
    const pins = {};
    let readBits = 10, writeBits = 8, serialOn = false, gray = 1, lineBuf = '';
    // Arduino Print::print(float, digits): fixed number of decimals (default 2)
    const fmt = (v, digits) => (typeof v === 'number' && digits !== undefined ? v.toFixed(digits) : String(v));
    const slow = opts.slow !== false;
    const pxBuf = Array.from({ length: 8 }, () => [0, 0, 0, 0]);
    const rt = {
      at: async (n) => { check(); H.line(n); if (slow) await frame(); check(); },
      delay: (ms) => new Promise((res, rej) => {
        if (tok.stopped) return rej(new Stop());
        const wake = () => { tok.timers.delete(id); rej(new Stop()); };
        const id = setTimeout(() => { tok.timers.delete(id); tok.wake.delete(wake); res(); }, ms);
        tok.timers.add(id); tok.wake.add(wake);
      }),
      pinMode: (pin, mode) => { pins[pin] = { mode }; if (H.mode) H.mode(pin, mode); },
      digitalWrite: (pin, level) => { if (!pins[pin] || pins[pin].mode !== 'OUTPUT') return; H.pin(pin, level); },
      digitalRead: (pin) => H.read(pin, pins[pin] ? pins[pin].mode : 'INPUT'),
      analogReadResolution: (b) => { readBits = Math.min(31, Math.max(1, b)); },
      analogRead: (pin) => {
        const max = 2 ** readBits - 1;
        const v = Math.min(VREF, Math.max(0, H.analog(pin)));
        // small conversion noise (about ±2 counts at 14 bits) — real ADC readings jitter slightly
        const noise = (Math.random() - 0.5) * 4 * 2 ** (readBits - 14);
        return Math.min(max, Math.max(0, Math.round(v / VREF * max + noise)));
      },
      analogWriteResolution: (b) => { writeBits = Math.min(31, Math.max(1, b)); },
      analogWrite: (pin, value) => {
        const max = 2 ** writeBits - 1;
        if (!PWM_PINS.includes(pin)) { pins[pin] = { mode: 'OUTPUT' }; H.pin(pin, value > (max >> 1) ? 1 : 0); return; }
        pins[pin] = { mode: 'OUTPUT' };
        H.pwm(pin, Math.min(max, Math.max(0, value)) / max, value);
      },
      delayMicroseconds: async () => { if (slow) await frame(); },
      bridge: (stage, val) => { if (H.bridge) H.bridge({ stage, val }); },
      thermo: () => (H.thermo ? H.thermo() : { found: false }),
      pxSet: (i, rgb, br) => { if (i < 8) pxBuf[i] = [rgb[0], rgb[1], rgb[2], Math.trunc(br * 31 / 100) / 31]; },   // library: map(brightness, 0, 100, 0, 0x1F)
      pxClear: (i) => { if (i < 8) pxBuf[i] = [0, 0, 0, 0]; },
      pxShow: () => { if (H.pixels) H.pixels(pxBuf.map(x => x.slice())); },
      pulseIn: async (pin, state) => { const us = await H.pulse(pin, state); check(); return us; },
      servoAttach: (pin) => { pins[pin] = { mode: 'OUTPUT' }; H.servo(pin, null); },
      // Servo library (Zephyr): map(angle, 0, 180, 544, 2400) µs, stored in 4 µs timer ticks
      servoWrite: (pin, angle) => { const a = Math.min(180, Math.max(0, angle)); const us = Math.floor((Math.trunc(a * (2400 - 544) / 180) + 544) / 4) * 4; H.servo(pin, us, a); },
      tone: (pin, f, ms) => { pins[pin] = { mode: 'OUTPUT' }; tok.tonePin = pin; H.tone(pin, f, ms); },
      noTone: (pin) => { H.noTone(pin); },
      map: (x, a, b, c, d) => Math.trunc((x - a) * (d - c) / (b - a)) + c,   // Arduino integer map()
      serialBegin: () => { serialOn = true; },
      print: (v, digits) => { if (serialOn) lineBuf += fmt(v, digits); },
      println: (v = '', digits) => { if (serialOn) { H.serial(lineBuf + fmt(v, digits)); lineBuf = ''; } },
      matrixBits: (b) => { gray = b; },
      matrixDraw: (arr) => { const max = 2 ** gray - 1; H.matrix(arr.map(v => Math.min(1, Math.max(0, v / max)))); },
    };
    try {
      await PROGRAMS[program](rt, opts);
    } catch (e) {
      if (!(e instanceof Stop)) console.error(e);
    }
    if (this.token === tok) { this.token = null; H.line(null); H.state(false); }
  }
}

// ------------------------------------------------------------------ programs (line numbers = data/code.js)
export const PROGRAMS = {
  async blink(rt, o) {
    const d = () => (o.getDelay ? o.getDelay() : 1000);
    await rt.at(1);
    await rt.at(2); rt.serialBegin(9600);
    await rt.at(4); rt.pinMode('LED_BUILTIN', 'OUTPUT');
    for (;;) {
      await rt.at(8);
      await rt.at(9); rt.digitalWrite('LED_BUILTIN', 1);
      await rt.at(10); await rt.delay(d());
      await rt.at(11); rt.digitalWrite('LED_BUILTIN', 0);
      await rt.at(12); await rt.delay(d());
      await rt.at(14); rt.println('Hello World');
    }
  },

  async extled(rt) {
    await rt.at(2);
    await rt.at(4);
    await rt.at(5); rt.pinMode('D5', 'OUTPUT');
    for (;;) {
      await rt.at(8);
      await rt.at(9); rt.digitalWrite('D5', 1);
      await rt.at(10); await rt.delay(1000);
      await rt.at(11); rt.digitalWrite('D5', 0);
      await rt.at(12); await rt.delay(1000);
    }
  },

  async button(rt) {
    await rt.at(2); await rt.at(3); await rt.at(6);
    await rt.at(8);
    await rt.at(10); rt.pinMode('D4', 'INPUT_PULLUP');
    await rt.at(11); rt.pinMode('D5', 'OUTPUT');
    await rt.at(14); rt.serialBegin(9600);
    for (;;) {
      await rt.at(17);
      await rt.at(19); const state = rt.digitalRead('D4');
      await rt.at(22);
      if (state === 0) {
        await rt.at(23); rt.digitalWrite('D5', 1);
        await rt.at(24); rt.println('- Button is pressed. LED is on.');
      } else {
        await rt.at(27); rt.digitalWrite('D5', 0);
        await rt.at(28); rt.println('- Button is not pressed. LED is off.');
      }
      await rt.at(32); await rt.delay(1000);
    }
  },

  async pot(rt) {
    await rt.at(1); await rt.at(2);
    await rt.at(4);
    await rt.at(5); rt.serialBegin(9600);
    await rt.at(6); rt.analogReadResolution(14);
    for (;;) {
      await rt.at(9);
      await rt.at(11); const v = rt.analogRead('A0');
      await rt.at(12); rt.println(v);
      await rt.at(13); await rt.delay(100);
    }
  },

  async fade(rt) {
    let brightness = 0, fadeAmount = 5;
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.pinMode('D5', 'OUTPUT');
    for (;;) {
      await rt.at(10);
      await rt.at(11); rt.analogWrite('D5', brightness);
      await rt.at(12); brightness = brightness + fadeAmount;
      await rt.at(13);
      if (brightness <= 0 || brightness >= 255) { await rt.at(14); fadeAmount = -fadeAmount; }
      await rt.at(16); await rt.delay(30);
    }
  },

  async dimmer(rt) {
    await rt.at(2); await rt.at(3);
    await rt.at(5);
    await rt.at(6); rt.analogReadResolution(14);
    await rt.at(7); rt.serialBegin(9600);
    for (;;) {
      await rt.at(10);
      await rt.at(11); const potValue = rt.analogRead('A0');
      await rt.at(12); const brightness = rt.map(potValue, 0, 16383, 0, 255);
      await rt.at(13); rt.analogWrite('D5', brightness);
      await rt.at(14); rt.println(brightness);
      await rt.at(15); await rt.delay(50);
    }
  },

  async matrix(rt, o) {
    await rt.at(1);
    await rt.at(2);
    await rt.at(13);
    await rt.at(MATRIX_LINES.begin);
    await rt.at(MATRIX_LINES.bits); rt.matrixBits(o.bits);
    await rt.at(MATRIX_LINES.draw); rt.matrixDraw(o.getFrame ? o.getFrame() : o.frame);
    await rt.at(MATRIX_LINES.draw + 2);
    // loop() is empty: the frame stays on the matrix
    if (o.live) {
      for (;;) { await rt.delay(120); rt.matrixBits(o.getBits()); rt.matrixDraw(o.getFrame()); }
    }
  },

  async nightlight(rt) {
    const threshold = 4000;
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.pinMode('D5', 'OUTPUT');
    await rt.at(8); rt.analogReadResolution(14);
    await rt.at(9); rt.serialBegin(9600);
    for (;;) {
      await rt.at(12);
      await rt.at(13); const light = rt.analogRead('A0');
      await rt.at(14); rt.println(light);
      await rt.at(15);
      if (light < threshold) { await rt.at(16); rt.digitalWrite('D5', 1); }
      else { await rt.at(18); rt.digitalWrite('D5', 0); }
      await rt.at(20); await rt.delay(200);
    }
  },

  async thermo(rt) {
    await rt.at(1); await rt.at(3);
    await rt.at(6); rt.serialBegin(9600);
    await rt.at(7);
    await rt.at(8); const found = rt.thermo().found;
    if (!found) {
      await rt.at(9); rt.println('Thermo not found - check the Qwiic cable');
      await rt.at(10); for (;;) await rt.delay(1000);
    }
    for (;;) {
      await rt.at(14);
      await rt.at(15); const celsius = rt.thermo().c;
      await rt.at(16); const humidity = rt.thermo().rh;
      await rt.at(17); rt.print('Temperature: ');
      await rt.at(18); rt.print(celsius, 1);
      await rt.at(19); rt.print(' C   Humidity: ');
      await rt.at(20); rt.print(humidity, 1);
      await rt.at(21); rt.println(' %RH');
      await rt.at(22); await rt.delay(1000);
    }
  },

  async pixels(rt) {
    await rt.at(1); await rt.at(3); await rt.at(4);
    await rt.at(7); rt.serialBegin(9600);
    await rt.at(8);
    await rt.at(9); const st = rt.thermo(), ok = st.found && st.pixels;
    if (!ok) {
      await rt.at(10); rt.println('Module not found - check the Qwiic cables');
      await rt.at(11); for (;;) await rt.delay(1000);
    }
    for (;;) {
      await rt.at(15);
      await rt.at(16); const celsius = rt.thermo().c;
      await rt.at(17); const lit = Math.min(8, Math.max(0, Math.trunc((celsius - 15.0) / 2.0)));
      await rt.at(19); let color = [0, 255, 0];
      await rt.at(20); if (celsius < 20) color = [0, 0, 255];
      await rt.at(21); if (celsius > 28) color = [255, 0, 0];
      await rt.at(23);
      for (let i = 0; i < 8; i++) {
        await rt.at(24);
        if (i < lit) rt.pxSet(i, color, 25);
        else { await rt.at(25); rt.pxClear(i); }
      }
      await rt.at(27); rt.pxShow();
      await rt.at(29); rt.print(celsius, 1);
      await rt.at(30); rt.print(' C -> ');
      await rt.at(31); rt.print(lit);
      await rt.at(32); rt.println(' LEDs');
      await rt.at(33); await rt.delay(500);
    }
  },

  // Lesson 20 — Python main.py (line numbers 101+) and sketch.ino (1+) on one timeline
  async bridge(rt) {
    await rt.at(101); await rt.at(102); await rt.at(104);
    rt.serialBegin(9600);
    await rt.at(9); await rt.at(10); rt.pinMode('LED_BUILTIN', 'OUTPUT');
    await rt.at(11); rt.digitalWrite('LED_BUILTIN', 1);
    await rt.at(12); await rt.at(13);
    await rt.at(106); await rt.at(113);
    let ledOn = false;
    for (;;) {
      await rt.at(107); await rt.at(108); ledOn = !ledOn;
      await rt.at(109); rt.bridge('call', ledOn); await rt.delay(350);
      await rt.at(4); rt.bridge('run', ledOn); await rt.delay(250);
      await rt.at(5); rt.digitalWrite('LED_BUILTIN', ledOn ? 0 : 1); await rt.delay(250);
      await rt.at(6); rt.bridge('reply', ledOn); await rt.delay(350);
      await rt.at(110); rt.println('[python] LED is ' + (ledOn ? 'ON' : 'OFF'));
      await rt.at(111); rt.bridge('idle', ledOn); await rt.delay(1000);
    }
  },

  // Lesson 21 — sketch notifies Python with the Thermo reading; Python stores, decides (> 28 C) and calls set_led when the state changes
  async bridge2(rt) {
    await rt.at(101); await rt.at(102); await rt.at(104); await rt.at(105);
    rt.serialBegin(9600);
    await rt.at(11); await rt.at(12); rt.pinMode('LED_BUILTIN', 'OUTPUT');
    await rt.at(13); rt.digitalWrite('LED_BUILTIN', 1);
    await rt.at(14); await rt.at(15); await rt.at(16); await rt.at(17);
    await rt.at(111); await rt.at(113); await rt.at(124);
    let ledOn = false;
    for (;;) {
      await rt.at(20);
      await rt.at(21); const c = rt.thermo().c;
      await rt.at(22); const rh = rt.thermo().rh;
      await rt.at(23); rt.bridge('notify', { c, rh }); await rt.delay(300);
      await rt.at(107); await rt.at(108); await rt.at(109); rt.bridge('stored', { c, rh }); await rt.delay(250);
      await rt.at(113); await rt.at(114); await rt.at(115); await rt.at(116);
      await rt.at(117); rt.println('[python] Temperature ' + c.toFixed(1) + ' C, humidity ' + rh.toFixed(1) + ' %RH');
      const hot = c > 28;
      await rt.at(118); rt.bridge('decided', { c, rh, hot }); await rt.delay(300);
      await rt.at(119);
      if (hot !== ledOn) {
        await rt.at(120); ledOn = hot;
        await rt.at(121); rt.bridge('call', { c, rh, hot }); await rt.delay(300);
        await rt.at(6); await rt.at(7); rt.digitalWrite('LED_BUILTIN', ledOn ? 0 : 1); await rt.delay(200);
        rt.bridge('reply', { c, rh, hot }); await rt.delay(250);
      }
      await rt.at(122); await rt.at(24); await rt.delay(900);
    }
  },

  // Lesson 22 — sketch notifies Python; Python forwards to the browser (Web UI brick); the page shows the numbers.
  // Python lines 101+, browser JS lines 201+, sketch 1+.
  async dash(rt) {
    await rt.at(101); await rt.at(102); await rt.at(104);
    rt.serialBegin(9600);
    await rt.at(6); await rt.at(7); await rt.at(8); await rt.at(9);
    await rt.at(109); await rt.at(111);
    await rt.at(201); await rt.at(203);
    for (;;) {
      await rt.at(12);
      await rt.at(13); const c = rt.thermo().c;
      await rt.at(14); const rh = rt.thermo().rh;
      await rt.at(15); rt.bridge('notify', { c, rh }); await rt.delay(300);
      await rt.at(106); await rt.at(107); rt.println('[python] sent to browser: ' + c.toFixed(1) + ' C, ' + rh.toFixed(1) + ' %RH'); rt.bridge('ws', { c, rh }); await rt.delay(300);
      await rt.at(204); rt.bridge('render', { c, rh }); await rt.delay(200);
      await rt.at(205); await rt.at(206);
      await rt.at(16); await rt.delay(900);
    }
  },

  async tmp36(rt) {
    await rt.at(2);
    await rt.at(4);
    await rt.at(5); rt.analogReadResolution(14);
    await rt.at(6); rt.serialBegin(9600);
    for (;;) {
      await rt.at(9);
      await rt.at(10); const reading = rt.analogRead('A0');
      await rt.at(11); const voltage = reading * 3.3 / 16383.0;
      await rt.at(12); const temperatureC = (voltage - 0.5) * 100.0;
      await rt.at(13); rt.print(voltage, 3);
      await rt.at(14); rt.print(' V  ->  ');
      await rt.at(15); rt.print(temperatureC, 1);
      await rt.at(16); rt.println(' C');
      await rt.at(17); await rt.delay(1000);
    }
  },

  async ultrasonic(rt) {
    await rt.at(2); await rt.at(3);
    await rt.at(5);
    await rt.at(6); rt.pinMode('D7', 'OUTPUT');
    await rt.at(7); rt.pinMode('D8', 'INPUT');
    await rt.at(8); rt.serialBegin(9600);
    for (;;) {
      await rt.at(11);
      await rt.at(12); rt.digitalWrite('D7', 0);
      await rt.at(13); await rt.delayMicroseconds(2);
      await rt.at(14); rt.digitalWrite('D7', 1);
      await rt.at(15); await rt.delayMicroseconds(10);
      await rt.at(16); rt.digitalWrite('D7', 0);
      await rt.at(18); const duration = await rt.pulseIn('D8', 1);
      await rt.at(19); const distanceCm = duration / 58.0;
      await rt.at(21); rt.print(distanceCm, 1);
      await rt.at(22); rt.println(' cm');
      await rt.at(23); await rt.delay(100);
    }
  },

  async pir(rt, o) {
    let lastState = 0;
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.pinMode('D2', 'INPUT');
    await rt.at(8); rt.pinMode('D5', 'OUTPUT');
    await rt.at(9); rt.serialBegin(9600);
    await rt.at(10); rt.println('PIR warming up (about 1 minute)...');
    await rt.at(11); await rt.delay(o.warmupMs ?? 60000);
    await rt.at(12); rt.println('Ready');
    for (;;) {
      await rt.at(15);
      await rt.at(16); const motion = rt.digitalRead('D2');
      await rt.at(17);
      if (motion === 1) { await rt.at(18); rt.digitalWrite('D5', 1); } else { await rt.at(20); rt.digitalWrite('D5', 0); }
      await rt.at(22);
      if (motion !== lastState) {
        await rt.at(23);
        if (motion === 1) { await rt.at(24); rt.println('Motion detected!'); } else { await rt.at(26); rt.println('Motion ended'); }
        await rt.at(28); lastState = motion;
      }
      await rt.at(30); await rt.delay(50);
    }
  },

  async servo(rt) {
    await rt.at(1); await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.servoAttach('D9');
    for (;;) {
      await rt.at(10);
      await rt.at(11); rt.servoWrite('D9', 0);
      await rt.at(12); await rt.delay(1000);
      await rt.at(13); rt.servoWrite('D9', 90);
      await rt.at(14); await rt.delay(1000);
      await rt.at(15); rt.servoWrite('D9', 180);
      await rt.at(16); await rt.delay(1000);
    }
  },

  async motor(rt) {
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.pinMode('D5', 'OUTPUT');
    await rt.at(8); rt.pinMode('D7', 'OUTPUT');
    await rt.at(9); rt.pinMode('D8', 'OUTPUT');
    for (;;) {
      await rt.at(12);
      await rt.at(14); rt.digitalWrite('D7', 1);
      await rt.at(15); rt.digitalWrite('D8', 0);
      await rt.at(16); rt.analogWrite('D5', 255);
      await rt.at(17); await rt.delay(2000);
      await rt.at(20); rt.analogWrite('D5', 128);
      await rt.at(21); await rt.delay(2000);
      await rt.at(24); rt.analogWrite('D5', 0);
      await rt.at(25); await rt.delay(1500);
      await rt.at(28); rt.digitalWrite('D7', 0);
      await rt.at(29); rt.digitalWrite('D8', 1);
      await rt.at(30); rt.analogWrite('D5', 255);
      await rt.at(31); await rt.delay(2000);
      await rt.at(34); rt.digitalWrite('D8', 0);
      await rt.at(35); await rt.delay(1500);
    }
  },

  async relay(rt) {
    await rt.at(2);
    await rt.at(13); await rt.at(14); await rt.at(10); rt.pinMode('D4', 'INPUT');
    await rt.at(15); rt.serialBegin(9600);
    for (;;) {
      await rt.at(18);
      await rt.at(19); await rt.at(5); rt.pinMode('D4', 'OUTPUT'); await rt.at(6); rt.digitalWrite('D4', 0);
      await rt.at(20); rt.println('Relay ON  - lamp ON');
      await rt.at(21); await rt.delay(3000);
      await rt.at(22); await rt.at(10); rt.pinMode('D4', 'INPUT');
      await rt.at(23); rt.println('Relay OFF - lamp OFF');
      await rt.at(24); await rt.delay(3000);
    }
  },

  async buzzer(rt) {
    const notes = [262, 294, 330, 349, 392, 440, 494, 523];
    await rt.at(2); await rt.at(3);
    await rt.at(5);
    for (;;) {
      await rt.at(8);
      for (let i = 0; i < 8; i++) {
        await rt.at(9);
        await rt.at(10); rt.tone('D9', notes[i], 250);
        await rt.at(11); await rt.delay(300);
      }
      await rt.at(13); rt.noTone('D9');
      await rt.at(14); await rt.delay(1000);
    }
  },
};

export function blinkCode(base, ms) {
  if (ms === 1000) return base;
  const comment = `// wait ${ms} milliseconds`;
  return base.split('\n').map(l => {
    if (/^\s*delay\(1000\);/.test(l)) {
      const code = `  delay(${ms});`;
      return code + ' '.repeat(Math.max(1, 36 - code.length)) + comment;
    }
    return l;
  }).join('\n');
}

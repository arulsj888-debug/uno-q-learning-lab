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
    let readBits = H.adcBits || 10, writeBits = 8, serialOn = false, gray = 1, lineBuf = '';
    // Arduino Print::print(float, digits): fixed number of decimals (default 2)
    const fmt = (v, digits) => (typeof v === 'number' && digits !== undefined ? v.toFixed(digits) : String(v));
    const slow = opts.slow !== false, t0 = performance.now();
    const pxBuf = Array.from({ length: 8 }, () => [0, 0, 0, 0]);
    const rt = {
      at: async (n) => { check(); H.line(n); if (slow) await frame(); check(); },
      delay: (ms) => new Promise((res, rej) => {
        if (tok.stopped) return rej(new Stop());
        const wake = () => { tok.timers.delete(id); rej(new Stop()); };
        const id = setTimeout(() => { tok.timers.delete(id); tok.wake.delete(wake); res(); }, ms);
        tok.timers.add(id); tok.wake.add(wake);
      }),
      millis: () => Math.floor(performance.now() - t0),   // milliseconds since the program started
      yield: () => rt.delay(8),   // simulator pacing: one pass of loop() takes about 8 ms here
      pinMode: (pin, mode) => { pins[pin] = { mode }; if (H.mode) H.mode(pin, mode); },
      digitalWrite: (pin, level) => { if (!pins[pin] || pins[pin].mode !== 'OUTPUT') return; H.pin(pin, level); },
      digitalRead: (pin) => H.read(pin, pins[pin] ? pins[pin].mode : 'INPUT'),
      // deep sleep: the CPU and digital pins are powered off (outputs go low), then the timer wakes the chip and the program restarts
      deepSleep: async (ms) => { for (const k of Object.keys(pins)) if (pins[k] && pins[k].mode === 'OUTPUT') H.pin(k, 0); for (const k of Object.keys(pins)) delete pins[k]; if (H.sleep) H.sleep(true, ms); await rt.delay(ms); if (H.sleep) H.sleep(false, ms); },
      ble: (stage, val) => { if (H.ble) H.ble({ stage, val }); },
      neo: (op, a, b, c, d) => (H.neo ? H.neo({ op, a, b, c, d }) : undefined),
      mqttConnected: () => !!(H.mqtt && H.mqtt({ op: 'connected' })),
      mqttConnect: async () => !!(H.mqtt && await H.mqtt({ op: 'connect' })),
      mqttSubscribe: (topic) => { if (H.mqtt) H.mqtt({ op: 'subscribe', topic }); },
      mqttPublish: (topic, payload) => { if (H.mqtt) H.mqtt({ op: 'publish', topic, payload }); },
      mqttPoll: () => (H.mqtt ? H.mqtt({ op: 'poll' }) : null),
      configTime: (gmt) => { if (H.configTime) H.configTime(gmt); },
      getLocalTime: (gmt) => (H.localTime ? H.localTime(gmt) : null),   // formatted time, or null until the first sync
      httpGet: async (url) => (H.http ? await H.http(url) : { code: -1, body: '' }),   // HTTPClient.GET(): status code (negative = failed) and body
      i2cProbe: (addr) => (H.i2cProbe ? !!H.i2cProbe(addr) : false),   // Wire.endTransmission() == 0 for this address
      lcd: (op, a, b) => (H.lcd ? H.lcd({ op, a, b }) : undefined),
      oled: (op, a, b) => (H.oled ? H.oled({ op, a, b }) : false),
      irDecode: () => (H.ir ? H.ir() : null),   // IrReceiver.decode(): the command of a received code, or null
      mpuRead: () => (H.mpu ? H.mpu() : { ax: 0, ay: 0, az: 0, gz: 0 }),
      stepTick: (dir) => { if (H.stepTick) H.stepTick(dir); },
      bmpRead: () => (H.bmp ? H.bmp() : { t: 0, p: 0 }),
      keypadKey: () => (H.keypad ? H.keypad() : null),
      fsWrite: (p, t) => { if (H.fs) H.fs('write', p, t); },
      fsAppend: (p, t) => { if (H.fs) H.fs('append', p, t); },
      fsRead: (p) => (H.fs ? H.fs('read', p) : ''),
      dsRead: () => (H.ds18 ? H.ds18() : { ok: false }),
      dhtRead: () => (H.dht ? H.dht() : { ok: false }),
      touchRead: (pin) => Math.max(0, Math.round(H.touch ? H.touch(pin) : 0)),
      analogReadResolution: (b) => { readBits = Math.min(31, Math.max(1, b)); },
      analogRead: (pin) => {
        const max = 2 ** readBits - 1;
        const vref = H.vref ? H.vref() : VREF;
        const v = Math.min(vref, Math.max(0, H.analog(pin)));
        // small conversion noise (about ±2 counts at 14 bits) — real ADC readings jitter slightly
        // ATmega328P ADC (datasheet): ADC = Vin x 1024 / Vref, rounded down, never above 1023; about +-1 count of noise
        if (H.avr) return Math.min(1023, Math.max(0, Math.floor(v / vref * 1024 + (Math.random() - 0.5) * 2)));
        const noise = (Math.random() - 0.5) * 4 * 2 ** (readBits - 14);
        return Math.min(max, Math.max(0, Math.round(v / vref * max + noise)));
      },
      // Arduino-ESP32 core 3.x LEDC: ledcAttach(pin, freq, resolution) then ledcWrite(pin, duty), duty = 0 ... 2^resolution - 1
      ledcAttach: (pin, freq, bits) => { pins[pin] = { mode: 'OUTPUT', ledc: bits }; },
      ledcWrite: (pin, duty) => { const bits = pins[pin] && pins[pin].ledc; if (!bits) return; const max = 2 ** bits - 1; H.pwm(pin, Math.min(max, Math.max(0, duty)) / max, duty); },
      analogWriteResolution: (b) => { writeBits = Math.min(31, Math.max(1, b)); },
      analogWrite: (pin, value) => {
        const max = 2 ** writeBits - 1;
        if (!PWM_PINS.includes(pin)) { pins[pin] = { mode: 'OUTPUT' }; H.pin(pin, value > (max >> 1) ? 1 : 0); return; }
        pins[pin] = { mode: 'OUTPUT' };
        H.pwm(pin, Math.min(max, Math.max(0, value)) / max, value);
      },
      delayMicroseconds: async () => { if (slow) await frame(); },
      web: (stage, val) => { if (H.web) H.web({ stage, val }); },
      uiEvents: () => (H.ui ? H.ui() : []),
      bridge: (stage, val) => { if (H.bridge) H.bridge({ stage, val }); },
      sensor: () => (H.sensor ? H.sensor() : { found: false }),
      // ESP32 Wi-Fi (simulated router): a scan takes about 1.5 s; WiFi.status() becomes 'connected' after the router accepts us
      scanNetworks: async () => { await rt.delay(1500); return H.wifiScan ? H.wifiScan() : []; },
      wifiBegin: () => { if (H.wifiBegin) H.wifiBegin(); },
      wifiStatus: () => (H.wifiStatus ? H.wifiStatus() : 'idle'),
      wifiIP: () => (H.wifiIP ? H.wifiIP() : '0.0.0.0'),
      thermo: () => (H.thermo ? H.thermo() : { found: false }),
      pxSet: (i, rgb, br) => { if (i < 8) pxBuf[i] = [rgb[0], rgb[1], rgb[2], Math.trunc(br * 31 / 100) / 31]; },   // library: map(brightness, 0, 100, 0, 0x1F)
      pxClear: (i) => { if (i < 8) pxBuf[i] = [0, 0, 0, 0]; },
      pxShow: () => { if (H.pixels) H.pixels(pxBuf.map(x => x.slice())); },
      pulseIn: async (pin, state) => { const us = await H.pulse(pin, state); check(); return us; },
      servoAttach: (pin) => { pins[pin] = { mode: 'OUTPUT' }; H.servo(pin, null); },
      // Servo library (Zephyr): map(angle, 0, 180, 544, 2400) µs, stored in 4 µs timer ticks
      servoWrite: (pin, angle) => { const a = Math.min(180, Math.max(0, angle)); const st = H.servoStep || 4; const us = Math.floor((Math.trunc(a * (2400 - 544) / 180) + 544) / st) * st; H.servo(pin, us, a); },
      tone: (pin, f, ms) => { pins[pin] = { mode: 'OUTPUT' }; tok.tonePin = pin; H.tone(pin, f, ms); },
      noTone: (pin) => { H.noTone(pin); },
      playHz: (pin, hz) => { pins[pin] = { mode: 'OUTPUT' }; tok.tonePin = pin; H.tone(pin, hz, 0); },     // GPIO Zero TonalBuzzer.play(): PWM at the note's frequency, 50 % duty
      stopHz: (pin) => { H.noTone(pin); },                                                          // TonalBuzzer.stop()
      pwmValue: (pin, v) => { pins[pin] = { mode: 'OUTPUT' }; H.pwm(pin, v, v); },   // GPIO Zero PWMLED.value, 0..1
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

  // UNO R3 AnalogReadSerial: no analogReadResolution(), the ADC is 10-bit (src/uno3/code.js U3_POT)
  async u3_pot(rt) {
    await rt.at(1); await rt.at(2);
    await rt.at(4);
    await rt.at(5); rt.serialBegin(9600);
    for (;;) {
      await rt.at(8);
      await rt.at(10); const v = rt.analogRead('A0');
      await rt.at(11); rt.println(v);
      await rt.at(12); await rt.delay(100);
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

  // ---- UNO R3 programs (listings in src/uno3/code.js)
  async u3_night(rt) {
    const threshold = 250;
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.pinMode('D5', 'OUTPUT');
    await rt.at(8); rt.serialBegin(9600);
    for (;;) {
      await rt.at(11);
      await rt.at(12); const light = rt.analogRead('A0');
      await rt.at(13); rt.println(light);
      await rt.at(14);
      if (light < threshold) { await rt.at(15); rt.digitalWrite('D5', 1); }
      else { await rt.at(17); rt.digitalWrite('D5', 0); }
      await rt.at(19); await rt.delay(200);
    }
  },

  async u3_tmp36(rt) {
    await rt.at(2);
    await rt.at(4);
    await rt.at(5); rt.serialBegin(9600);
    for (;;) {
      await rt.at(8);
      await rt.at(9); const reading = rt.analogRead('A0');
      await rt.at(10); const voltage = reading * 5.0 / 1024.0;
      await rt.at(11); const temperatureC = (voltage - 0.5) * 100.0;
      await rt.at(12); rt.print(voltage, 3);
      await rt.at(13); rt.print(' V  ->  ');
      await rt.at(14); rt.print(temperatureC, 1);
      await rt.at(15); rt.println(' C');
      await rt.at(16); await rt.delay(1000);
    }
  },

  // low-level-trigger relay module: LOW = relay ON, HIGH = relay OFF
  async u3_relay(rt) {
    await rt.at(2);
    await rt.at(12);
    await rt.at(13); rt.pinMode('D4', 'OUTPUT');
    await rt.at(14); await rt.at(9); rt.digitalWrite('D4', 1);
    await rt.at(15); rt.serialBegin(9600);
    for (;;) {
      await rt.at(18);
      await rt.at(19); await rt.at(5); rt.digitalWrite('D4', 0);
      await rt.at(20); rt.println('Relay ON  - lamp ON');
      await rt.at(21); await rt.delay(3000);
      await rt.at(22); await rt.at(9); rt.digitalWrite('D4', 1);
      await rt.at(23); rt.println('Relay OFF - lamp OFF');
      await rt.at(24); await rt.delay(3000);
    }
  },

  // Adafruit SHT31 library: begin(0x44), readTemperature(), readHumidity() (NaN when the read fails)
  async u3_sht31(rt) {
    await rt.at(1); await rt.at(2); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.serialBegin(9600);
    await rt.at(8);
    if (!rt.sensor().found) { await rt.at(9); rt.println("Couldn't find SHT31"); await rt.at(10); for (;;) await rt.delay(1000); }
    for (;;) {
      await rt.at(14);
      await rt.at(15); const r = rt.sensor();
      await rt.at(16); const h = r.rh;
      await rt.at(17); rt.print('Temperature: ');
      await rt.at(18); rt.print(r.c, 1);
      await rt.at(19); rt.println(' C');
      await rt.at(20); rt.print('Humidity: ');
      await rt.at(21); rt.print(h, 1);
      await rt.at(22); rt.println(' %');
      await rt.at(23); await rt.delay(2000);
    }
  },

  // ---- ESP32 DevKit V1 programs (listings in src/esp32/code.js); pins are GPIO ids G2, G16 ...
  async e_blink(rt, o) {
    const d = () => (o.getDelay ? o.getDelay() : 1000);
    await rt.at(2);
    await rt.at(4);
    await rt.at(5); rt.serialBegin(115200);
    await rt.at(6); rt.pinMode('G2', 'OUTPUT');
    for (;;) {
      await rt.at(9);
      await rt.at(10); rt.digitalWrite('G2', 1);
      await rt.at(11); await rt.delay(d());
      await rt.at(12); rt.digitalWrite('G2', 0);
      await rt.at(13); await rt.delay(d());
      await rt.at(14); rt.println('Hello World');
    }
  },

  async e_extled(rt) {
    await rt.at(2);
    await rt.at(4);
    await rt.at(5); rt.pinMode('G16', 'OUTPUT');
    for (;;) {
      await rt.at(8);
      await rt.at(9); rt.digitalWrite('G16', 1);
      await rt.at(10); await rt.delay(1000);
      await rt.at(11); rt.digitalWrite('G16', 0);
      await rt.at(12); await rt.delay(1000);
    }
  },

  async e_button(rt) {
    await rt.at(2); await rt.at(3);
    await rt.at(5);
    await rt.at(6); rt.serialBegin(115200);
    await rt.at(7); rt.pinMode('G17', 'INPUT_PULLUP');
    await rt.at(8); rt.pinMode('G16', 'OUTPUT');
    for (;;) {
      await rt.at(11);
      await rt.at(12); const state = rt.digitalRead('G17');
      await rt.at(13);
      if (state === 0) {
        await rt.at(14); rt.digitalWrite('G16', 1);
        await rt.at(15); rt.println('Button is pressed. LED is on.');
      } else {
        await rt.at(17); rt.digitalWrite('G16', 0);
        await rt.at(18); rt.println('Button is not pressed. LED is off.');
      }
      await rt.at(20); await rt.delay(200);
    }
  },

  async e_pot(rt) {
    await rt.at(2);
    await rt.at(4);
    await rt.at(5); rt.serialBegin(115200);
    for (;;) {
      await rt.at(8);
      await rt.at(9); const v = rt.analogRead('G34');
      await rt.at(10); rt.println(v);
      await rt.at(11); await rt.delay(100);
    }
  },

  async e_fade(rt) {
    let brightness = 0, fadeAmount = 5;
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.ledcAttach('G16', 5000, 8);
    for (;;) {
      await rt.at(10);
      await rt.at(11); rt.ledcWrite('G16', brightness);
      await rt.at(12); brightness = brightness + fadeAmount;
      await rt.at(13);
      if (brightness <= 0 || brightness >= 255) { await rt.at(14); fadeAmount = -fadeAmount; }
      await rt.at(16); await rt.delay(30);
    }
  },

  // ---- ESP32 Wi-Fi programs (listings E32_SCAN, E32_CONNECT, E32_WEB in src/esp32/code.js)
  async e_scan(rt) {
    await rt.at(3);
    await rt.at(4); rt.serialBegin(115200);
    await rt.at(5);
    for (;;) {
      await rt.at(8);
      await rt.at(9); rt.println('Scan start');
      await rt.at(10); const list = await rt.scanNetworks();
      await rt.at(11); rt.print(list.length);
      await rt.at(12); rt.println(' networks found');
      for (let i = 0; i < list.length; i++) {
        await rt.at(13);
        await rt.at(14); rt.print(i + 1);
        await rt.at(15); rt.print(': ');
        await rt.at(16); rt.print(list[i].ssid);
        await rt.at(17); rt.print(' (');
        await rt.at(18); rt.print(list[i].rssi);
        await rt.at(19); rt.print(' dBm) ');
        await rt.at(20); rt.println(list[i].open ? 'open' : 'secured');
      }
      await rt.at(22);
      await rt.at(23); await rt.delay(5000);
    }
  },

  async e_connect(rt) {
    await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.serialBegin(115200);
    await rt.at(8);
    await rt.at(9); rt.wifiBegin();
    await rt.at(10); rt.println('Connecting to Wi-Fi...');
    while (rt.wifiStatus() !== 'connected') {
      await rt.at(11);
      await rt.at(12); await rt.delay(500);
      await rt.at(13); rt.println('Still connecting...');
    }
    await rt.at(11);
    await rt.at(15); rt.print('Connected! IP address: ');
    await rt.at(16); rt.println(rt.wifiIP());
    await rt.at(17);
    for (;;) { await rt.at(19); await rt.at(20); await rt.delay(1000); }
  },

  async e_web(rt) {
    await rt.at(4); await rt.at(5); await rt.at(6); await rt.at(7); await rt.at(9);
    await rt.at(30);
    await rt.at(31); rt.pinMode('G16', 'OUTPUT');
    await rt.at(32); rt.serialBegin(115200);
    await rt.at(33);
    await rt.at(34); rt.wifiBegin();
    while (rt.wifiStatus() !== 'connected') { await rt.at(35); await rt.at(36); await rt.delay(500); }
    await rt.at(35);
    await rt.at(38); rt.print('Open http://');
    await rt.at(39); rt.println(rt.wifiIP());
    await rt.at(40); await rt.at(41); await rt.at(42);
    await rt.at(43); rt.web('page', { lit: false });
    await rt.at(44);
    let ledOn = false;
    const page = async () => { await rt.at(11); await rt.at(12); await rt.at(13); rt.web('page', { lit: ledOn }); };
    for (;;) {
      await rt.at(46);
      await rt.at(47);
      for (const evn of rt.uiEvents()) {
        if (evn === 'on') { rt.println('[simulated] browser asked for /on'); await rt.at(16); await rt.at(17); ledOn = true; await rt.at(18); rt.digitalWrite('G16', 1); await rt.at(19); await rt.at(20); await page(); }
        else if (evn === 'off') { rt.println('[simulated] browser asked for /off'); await rt.at(23); await rt.at(24); ledOn = false; await rt.at(25); rt.digitalWrite('G16', 0); await rt.at(26); await rt.at(27); await page(); }
      }
      await rt.delay(120);
    }
  },

  async e_touch(rt) {
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.serialBegin(115200);
    await rt.at(8); rt.pinMode('G16', 'OUTPUT');
    for (;;) {
      await rt.at(11);
      await rt.at(12); const v = rt.touchRead('G4');
      await rt.at(13); rt.println(v);
      await rt.at(14);
      if (v < 20) { await rt.at(15); rt.digitalWrite('G16', 1); }
      else { await rt.at(17); rt.digitalWrite('G16', 0); }
      await rt.at(19); await rt.delay(500);
    }
  },

  async e_sleep(rt) {
    let boot = 0, woke = false;
    await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5);
    for (;;) {
      await rt.at(7);
      await rt.at(8); rt.serialBegin(115200);
      await rt.at(9); rt.pinMode('G16', 'OUTPUT');
      await rt.at(10); rt.digitalWrite('G16', 1);
      await rt.at(11); boot++;
      await rt.at(12); rt.println('Boot number: ' + boot);
      await rt.at(13);
      if (woke) { await rt.at(14); rt.println('Wakeup caused by timer'); }
      await rt.at(16); await rt.delay(2000);
      await rt.at(17); await rt.at(18); rt.println('Going to sleep now');
      await rt.at(19); await rt.at(20); await rt.deepSleep(5000); woke = true;
    }
  },

  async e_ble(rt) {
    await rt.at(5); await rt.at(6); await rt.at(7);
    await rt.at(22);
    await rt.at(23); rt.serialBegin(115200);
    await rt.at(24); rt.pinMode('G16', 'OUTPUT');
    await rt.at(25); await rt.at(26); await rt.at(27); await rt.at(28); await rt.at(29);
    await rt.at(30); rt.ble('val', '0');
    await rt.at(31); await rt.at(32);
    await rt.at(33); rt.ble('adv', true);
    await rt.at(34); rt.println('Advertising as ESP32-LED');
    for (;;) {
      await rt.at(37); await rt.at(38);
      for (let i = 0; i < 16; i++) {          // delay(2000); the BLE library calls onWrite by itself in the meantime
        for (const evn of rt.uiEvents()) {
          if (evn !== 'w1' && evn !== 'w0') continue;
          const v = evn === 'w1' ? '1' : '0';
          rt.println('[simulated] phone wrote "' + v + '"'); rt.ble('val', v);
          await rt.at(10); await rt.at(11); await rt.at(12);
          if (v === '1') { await rt.at(13); rt.digitalWrite('G16', 1); await rt.at(14); rt.println('LED on'); }
          else { await rt.at(15); await rt.at(16); rt.digitalWrite('G16', 0); await rt.at(17); rt.println('LED off'); }
          await rt.at(38);
        }
        await rt.delay(125);
      }
    }
  },

  async u3_rgb(rt) {
    const setColor = async (r, g, b) => { await rt.at(6); await rt.at(7); rt.analogWrite('D9', r); await rt.at(8); rt.analogWrite('D10', g); await rt.at(9); rt.analogWrite('D11', b); await rt.at(10); };
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(12);
    await rt.at(13); rt.pinMode('D9', 'OUTPUT'); await rt.at(14); rt.pinMode('D10', 'OUTPUT'); await rt.at(15); rt.pinMode('D11', 'OUTPUT');
    for (;;) {
      await rt.at(18);
      await rt.at(19); await setColor(255, 0, 0); await rt.at(20); await rt.delay(1000);
      await rt.at(21); await setColor(0, 255, 0); await rt.at(22); await rt.delay(1000);
      await rt.at(23); await setColor(0, 0, 255); await rt.at(24); await rt.delay(1000);
      await rt.at(25); await setColor(255, 255, 0); await rt.at(26); await rt.delay(1000);
      await rt.at(27); await setColor(255, 255, 255); await rt.at(28); await rt.delay(1000);
      await rt.at(29); await setColor(0, 0, 0); await rt.at(30); await rt.delay(1000);
    }
  },

  async u3_dht(rt) {
    await rt.at(1); await rt.at(3); await rt.at(4); await rt.at(6);
    await rt.at(8); await rt.at(9); rt.serialBegin(9600);
    await rt.at(10);
    for (;;) {
      await rt.at(13);
      await rt.at(14); await rt.delay(2000);
      await rt.at(15); const r = rt.dhtRead();
      await rt.at(16);
      await rt.at(17);
      if (!r.ok) { await rt.at(18); rt.println('Failed to read from DHT sensor!'); await rt.at(19); continue; }
      await rt.at(21); rt.print('Humidity: ');
      await rt.at(22); rt.print(r.h, 2);
      await rt.at(23); rt.print(' %  Temperature: ');
      await rt.at(24); rt.print(r.t, 2);
      await rt.at(25); rt.println(' C');
    }
  },

  async e_rgb(rt) {
    const setColor = async (r, g, b) => { await rt.at(6); await rt.at(7); rt.ledcWrite('G16', r); await rt.at(8); rt.ledcWrite('G17', g); await rt.at(9); rt.ledcWrite('G18', b); await rt.at(10); };
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(12);
    await rt.at(13); rt.ledcAttach('G16', 5000, 8); await rt.at(14); rt.ledcAttach('G17', 5000, 8); await rt.at(15); rt.ledcAttach('G18', 5000, 8);
    for (;;) {
      await rt.at(18);
      await rt.at(19); await setColor(255, 0, 0); await rt.at(20); await rt.delay(1000);
      await rt.at(21); await setColor(0, 255, 0); await rt.at(22); await rt.delay(1000);
      await rt.at(23); await setColor(0, 0, 255); await rt.at(24); await rt.delay(1000);
      await rt.at(25); await setColor(255, 255, 0); await rt.at(26); await rt.delay(1000);
      await rt.at(27); await setColor(255, 255, 255); await rt.at(28); await rt.delay(1000);
      await rt.at(29); await setColor(0, 0, 0); await rt.at(30); await rt.delay(1000);
    }
  },

  async e_dht(rt) {
    await rt.at(1); await rt.at(3); await rt.at(4); await rt.at(6);
    await rt.at(8); await rt.at(9); rt.serialBegin(115200);
    await rt.at(10);
    for (;;) {
      await rt.at(13);
      await rt.at(14); await rt.delay(2000);
      await rt.at(15); const r = rt.dhtRead();
      await rt.at(16);
      await rt.at(17);
      if (!r.ok) { await rt.at(18); rt.println('Failed to read from DHT sensor!'); await rt.at(19); continue; }
      await rt.at(21); rt.print('Humidity: ');
      await rt.at(22); rt.print(r.h, 2);
      await rt.at(23); rt.print(' %  Temperature: ');
      await rt.at(24); rt.print(r.t, 2);
      await rt.at(25); rt.println(' C');
    }
  },

  async u3_joy(rt) {
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.serialBegin(9600);
    await rt.at(8); rt.pinMode('D2', 'INPUT_PULLUP');
    for (;;) {
      await rt.at(11);
      await rt.at(12); const x = rt.analogRead('A0');
      await rt.at(13); const y = rt.analogRead('A1');
      await rt.at(14); const pressed = rt.digitalRead('D2') === 0;
      await rt.at(15); rt.print('X: ');
      await rt.at(16); rt.print(x);
      await rt.at(17); rt.print('  Y: ');
      await rt.at(18); rt.print(y);
      await rt.at(19); rt.print('  Button: ');
      await rt.at(20); rt.println(pressed ? 'pressed' : 'released');
      await rt.at(21); await rt.delay(200);
    }
  },

  async u3_enc(rt) {
    let counter = 0, last = 1;
    await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5); await rt.at(6);
    await rt.at(8);
    await rt.at(9); rt.serialBegin(9600);
    await rt.at(10); rt.pinMode('D2', 'INPUT_PULLUP'); await rt.at(11); rt.pinMode('D3', 'INPUT_PULLUP'); await rt.at(12); rt.pinMode('D4', 'INPUT_PULLUP');
    await rt.at(13); last = rt.digitalRead('D2');
    for (;;) {
      await rt.at(16);
      await rt.at(17); const clk = rt.digitalRead('D2');
      await rt.at(18);
      if (clk !== last && clk === 0) {
        await rt.at(19);
        if (rt.digitalRead('D3') !== clk) counter++;
        else { await rt.at(20); counter--; }
        await rt.at(21); rt.println(counter);
      }
      await rt.at(23); last = clk;
      await rt.at(24);
      if (rt.digitalRead('D4') === 0) { await rt.at(25); rt.println('Knob pressed'); await rt.at(26); await rt.delay(300); }
      await rt.at(28); await rt.delay(2);
    }
  },

  async e_joy(rt) {
    await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.serialBegin(115200);
    await rt.at(8); rt.pinMode('G17', 'INPUT_PULLUP');
    for (;;) {
      await rt.at(11);
      await rt.at(12); const x = rt.analogRead('G34');
      await rt.at(13); const y = rt.analogRead('G35');
      await rt.at(14); const pressed = rt.digitalRead('G17') === 0;
      await rt.at(15); rt.print('X: ');
      await rt.at(16); rt.print(x);
      await rt.at(17); rt.print('  Y: ');
      await rt.at(18); rt.print(y);
      await rt.at(19); rt.print('  Button: ');
      await rt.at(20); rt.println(pressed ? 'pressed' : 'released');
      await rt.at(21); await rt.delay(200);
    }
  },

  async e_enc(rt) {
    let counter = 0, last = 1;
    await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5); await rt.at(6);
    await rt.at(8);
    await rt.at(9); rt.serialBegin(115200);
    await rt.at(10); rt.pinMode('G16', 'INPUT_PULLUP'); await rt.at(11); rt.pinMode('G17', 'INPUT_PULLUP'); await rt.at(12); rt.pinMode('G18', 'INPUT_PULLUP');
    await rt.at(13); last = rt.digitalRead('G16');
    for (;;) {
      await rt.at(16);
      await rt.at(17); const clk = rt.digitalRead('G16');
      await rt.at(18);
      if (clk !== last && clk === 0) {
        await rt.at(19);
        if (rt.digitalRead('G17') !== clk) counter++;
        else { await rt.at(20); counter--; }
        await rt.at(21); rt.println(counter);
      }
      await rt.at(23); last = clk;
      await rt.at(24);
      if (rt.digitalRead('G18') === 0) { await rt.at(25); rt.println('Knob pressed'); await rt.at(26); await rt.delay(300); }
      await rt.at(28); await rt.delay(2);
    }
  },

  async u3_lcd(rt) {
    await rt.at(1); await rt.at(2); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.lcd('init');
    await rt.at(8); rt.lcd('backlight');
    await rt.at(9); rt.lcd('cursor', 0, 0);
    await rt.at(10); rt.lcd('print', 'Hello, UNO R3!');
    const t0 = performance.now();
    for (;;) {
      await rt.at(13);
      await rt.at(14); rt.lcd('cursor', 0, 1);
      await rt.at(15); rt.lcd('print', 'Seconds: ');
      await rt.at(16); rt.lcd('print', String(Math.floor((performance.now() - t0) / 1000)));
      await rt.at(17); await rt.delay(1000);
    }
  },

  async u3_oled(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(5);
    await rt.at(7);
    await rt.at(8); rt.serialBegin(9600);
    await rt.at(9); const ok = rt.oled('begin', 0x3C);
    if (!ok) { await rt.at(10); rt.println('SSD1306 not found'); await rt.at(11); for (;;) await rt.delay(1000); }
    await rt.at(13); rt.oled('clear');
    await rt.at(14); await rt.at(15);
    await rt.at(16); rt.oled('cursor', 0, 0);
    await rt.at(17); rt.oled('println', 'Hello, UNO R3!');
    await rt.at(18); rt.oled('println', 'OLED 128 x 64');
    await rt.at(19); rt.oled('display');
    for (;;) { await rt.at(22); await rt.at(23); await rt.delay(1000); }
  },

  async e_lcd(rt) {
    await rt.at(1); await rt.at(2); await rt.at(4);
    await rt.at(6);
    await rt.at(7); rt.lcd('init');
    await rt.at(8); rt.lcd('backlight');
    await rt.at(9); rt.lcd('cursor', 0, 0);
    await rt.at(10); rt.lcd('print', 'Hello, ESP32!');
    const t0 = performance.now();
    for (;;) {
      await rt.at(13);
      await rt.at(14); rt.lcd('cursor', 0, 1);
      await rt.at(15); rt.lcd('print', 'Seconds: ');
      await rt.at(16); rt.lcd('print', String(Math.floor((performance.now() - t0) / 1000)));
      await rt.at(17); await rt.delay(1000);
    }
  },

  async e_oled(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(5);
    await rt.at(7);
    await rt.at(8); rt.serialBegin(115200);
    await rt.at(9); const ok = rt.oled('begin', 0x3C);
    if (!ok) { await rt.at(10); rt.println('SSD1306 not found'); await rt.at(11); for (;;) await rt.delay(1000); }
    await rt.at(13); rt.oled('clear');
    await rt.at(14); await rt.at(15);
    await rt.at(16); rt.oled('cursor', 0, 0);
    await rt.at(17); rt.oled('println', 'Hello, ESP32!');
    await rt.at(18); rt.oled('println', 'OLED 128 x 64');
    await rt.at(19); rt.oled('display');
    for (;;) { await rt.at(22); await rt.at(23); await rt.delay(1000); }
  },

  async u3_neo(rt) {
    await rt.at(1); await rt.at(3); await rt.at(4); await rt.at(6);
    await rt.at(8);
    await rt.at(9); rt.neo('begin');
    await rt.at(10); rt.neo('brightness', 40);
    await rt.at(11); rt.neo('show');
    for (;;) {
      await rt.at(14);
      for (let i = 0; i < 8; i++) {
        await rt.at(15);
        await rt.at(16); rt.neo('clear');
        await rt.at(17); rt.neo('set', i, 255, 0, 0);
        await rt.at(18); rt.neo('show');
        await rt.at(19); await rt.delay(150);
      }
    }
  },

  async e_neo(rt) {
    await rt.at(1); await rt.at(3); await rt.at(4); await rt.at(6);
    await rt.at(8);
    await rt.at(9); rt.neo('begin');
    await rt.at(10); rt.neo('brightness', 40);
    await rt.at(11); rt.neo('show');
    for (;;) {
      await rt.at(14);
      for (let i = 0; i < 8; i++) {
        await rt.at(15);
        await rt.at(16); rt.neo('clear');
        await rt.at(17); rt.neo('set', i, 255, 0, 0);
        await rt.at(18); rt.neo('show');
        await rt.at(19); await rt.delay(150);
      }
    }
  },

  async u3_qsw(rt) {
    await rt.at(2); await rt.at(4);
    await rt.at(5); rt.pinMode('D5', 'OUTPUT');
    for (;;) {
      await rt.at(8);
      await rt.at(9); rt.digitalWrite('D5', 1);
      await rt.at(10); await rt.delay(1000);
      await rt.at(11); rt.digitalWrite('D5', 0);
      await rt.at(12); await rt.delay(1000);
    }
  },

  async e_qsw(rt) {
    await rt.at(2); await rt.at(4);
    await rt.at(5); rt.pinMode('G16', 'OUTPUT');
    for (;;) {
      await rt.at(8);
      await rt.at(9); rt.digitalWrite('G16', 1);
      await rt.at(10); await rt.delay(1000);
      await rt.at(11); rt.digitalWrite('G16', 0);
      await rt.at(12); await rt.delay(1000);
    }
  },

  async u3_millis(rt) {
    await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5); await rt.at(6); await rt.at(7);
    await rt.at(10); rt.pinMode('D5', 'OUTPUT');
    await rt.at(11); rt.pinMode('D4', 'INPUT_PULLUP');
    await rt.at(12); rt.serialBegin(9600);
    let prev = 0, ledState = 0, last = 1;
    for (;;) {
      await rt.at(16); const cur = rt.millis();
      await rt.at(17);
      if (cur - prev >= 1000) {
        await rt.at(18); prev = cur;
        await rt.at(19); ledState = ledState ? 0 : 1;
        await rt.at(20); rt.digitalWrite('D5', ledState);
      }
      await rt.at(23); const button = rt.digitalRead('D4');
      await rt.at(24);
      if (button === 0 && last === 1) { await rt.at(25); rt.println('Button pressed: noticed at once'); }
      await rt.at(27); last = button;
      await rt.yield();
    }
  },

  async e_millis(rt) {
    await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5); await rt.at(6); await rt.at(7);
    await rt.at(10); rt.pinMode('G16', 'OUTPUT');
    await rt.at(11); rt.pinMode('G17', 'INPUT_PULLUP');
    await rt.at(12); rt.serialBegin(115200);
    let prev = 0, ledState = 0, last = 1;
    for (;;) {
      await rt.at(16); const cur = rt.millis();
      await rt.at(17);
      if (cur - prev >= 1000) {
        await rt.at(18); prev = cur;
        await rt.at(19); ledState = ledState ? 0 : 1;
        await rt.at(20); rt.digitalWrite('G16', ledState);
      }
      await rt.at(23); const button = rt.digitalRead('G17');
      await rt.at(24);
      if (button === 0 && last === 1) { await rt.at(25); rt.println('Button pressed: noticed at once'); }
      await rt.at(27); last = button;
      await rt.yield();
    }
  },

  async u3_i2cscan(rt) {
    await rt.at(2); await rt.at(4);
    await rt.at(5); await rt.at(6); rt.serialBegin(9600);
    await rt.at(7); rt.println('Scanning...');
    await rt.at(8); let found = 0;
    for (let a = 1; a < 127; a++) {
      await rt.at(9); await rt.at(10);
      await rt.at(11); const ok = rt.i2cProbe(a);
      await rt.at(12);
      if (ok) {
        await rt.at(13); rt.print('Device found at 0x');
        await rt.at(14); rt.println(a.toString(16).toUpperCase());
        await rt.at(15); found++;
      }
    }
    await rt.at(18); rt.print('Done: ');
    await rt.at(19); rt.print(found);
    await rt.at(20); rt.println(' device(s)');
    await rt.at(23);
    for (;;) await rt.delay(1000);
  },

  async e_http(rt) {
    await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(5); await rt.at(6);
    await rt.at(9); rt.serialBegin(115200);
    await rt.at(10); rt.wifiBegin();
    while (rt.wifiStatus() !== 'connected') { await rt.at(11); await rt.at(12); await rt.delay(500); }
    await rt.at(11);
    await rt.at(14); rt.println('Connected');
    await rt.at(16);
    await rt.at(17);
    await rt.at(18); const r = await rt.httpGet('http://api.example.com/temperature');
    await rt.at(19);
    if (r.code > 0) {
      await rt.at(20); rt.print('HTTP status: ');
      await rt.at(21); rt.println(r.code);
      await rt.at(22);
      if (r.code === 200) { await rt.at(23); await rt.at(24); rt.println(r.body); }
    } else {
      await rt.at(27); rt.print('Request failed: ');
      await rt.at(28); rt.println('connection refused');
    }
    await rt.at(30);
    await rt.at(33); await rt.at(34);
    for (;;) await rt.delay(1000);
  },

  async e_mqtt(rt) {
    await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(5); await rt.at(6); await rt.at(7); await rt.at(8);
    await rt.at(24); rt.serialBegin(115200);
    await rt.at(25); rt.pinMode('G16', 'OUTPUT');
    await rt.at(26); rt.wifiBegin();
    while (rt.wifiStatus() !== 'connected') { await rt.at(27); await rt.delay(500); }
    await rt.at(27);
    await rt.at(28); await rt.at(29);
    let lastSend = 0;
    for (;;) {
      await rt.at(33);
      if (!rt.mqttConnected()) {
        await rt.at(34);
        if (await rt.mqttConnect()) {
          await rt.at(35); rt.mqttSubscribe('home/led');
          await rt.at(36); rt.println('MQTT connected');
        } else {
          await rt.at(38); rt.println('MQTT connect failed, trying again in 2 s');
          await rt.at(39); await rt.delay(2000);
          await rt.at(40); continue;
        }
      }
      await rt.at(43);
      const m = rt.mqttPoll();
      if (m) {
        await rt.at(13); await rt.at(14); await rt.at(15);
        await rt.at(16); rt.print('Received on ');
        await rt.at(17); rt.print(m.topic);
        await rt.at(18); rt.print(': ');
        await rt.at(19); rt.println(m.payload);
        await rt.at(20); rt.digitalWrite('G16', m.payload === 'ON' ? 1 : 0);
      }
      await rt.at(44);
      if (rt.millis() - lastSend > 3000) {
        await rt.at(45); lastSend = rt.millis();
        await rt.at(46); rt.mqttPublish('home/temperature', '21.5');
        await rt.at(47); rt.println('Published home/temperature = 21.5');
      }
      await rt.yield();
    }
  },

  async e_ntp(rt) {
    await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(5); await rt.at(6); await rt.at(7); await rt.at(8);
    await rt.at(11); rt.serialBegin(115200);
    await rt.at(12); rt.wifiBegin();
    while (rt.wifiStatus() !== 'connected') { await rt.at(13); await rt.delay(500); }
    await rt.at(13);
    await rt.at(14); rt.configTime(3600);
    for (;;) {
      await rt.at(17); await rt.at(18);
      await rt.at(19); const t = rt.getLocalTime(3600);
      if (t === null) { await rt.at(20); rt.println('Waiting for time...'); }
      else { await rt.at(22); rt.println(t); }
      await rt.at(24); await rt.delay(1000);
    }
  },

  async u3_ds18(rt) {
    await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(6); await rt.at(7);
    await rt.at(10); rt.serialBegin(9600);
    await rt.at(11);
    for (;;) {
      await rt.at(14);
      await rt.at(15); await rt.delay(750);
      await rt.at(16); const r = rt.dsRead(); const t = r.ok ? r.t : -127;
      await rt.at(17);
      if (t === -127) { await rt.at(18); rt.println('Sensor not found!'); }
      else { await rt.at(20); rt.print('Temperature: '); await rt.at(21); rt.print(t, 2); await rt.at(22); rt.println(' C'); }
      await rt.at(24); await rt.delay(1000);
    }
  },

  async e_ds18(rt) {
    await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(6); await rt.at(7);
    await rt.at(10); rt.serialBegin(115200);
    await rt.at(11);
    for (;;) {
      await rt.at(14);
      await rt.at(15); await rt.delay(750);
      await rt.at(16); const r = rt.dsRead(); const t = r.ok ? r.t : -127;
      await rt.at(17);
      if (t === -127) { await rt.at(18); rt.println('Sensor not found!'); }
      else { await rt.at(20); rt.print('Temperature: '); await rt.at(21); rt.print(t, 2); await rt.at(22); rt.println(' C'); }
      await rt.at(24); await rt.delay(1000);
    }
  },

  async u3_ir(rt) {
    await rt.at(1); await rt.at(3); await rt.at(4); await rt.at(5);
    await rt.at(8); rt.serialBegin(9600);
    await rt.at(9); rt.pinMode('D5', 'OUTPUT');
    await rt.at(10);
    let ledOn = 0;
    for (;;) {
      await rt.at(13);
      await rt.at(14); const c = rt.irDecode();
      if (c !== null) {
        await rt.at(15); rt.print('Command: 0x');
        await rt.at(16); rt.println(c.toString(16).toUpperCase());
        await rt.at(17);
        if (c === 0x45) { await rt.at(18); ledOn = ledOn ? 0 : 1; await rt.at(19); rt.digitalWrite('D5', ledOn); }
        await rt.at(21);
      }
      await rt.yield();
    }
  },

  async e_ir(rt) {
    await rt.at(1); await rt.at(3); await rt.at(4); await rt.at(5);
    await rt.at(8); rt.serialBegin(115200);
    await rt.at(9); rt.pinMode('G16', 'OUTPUT');
    await rt.at(10);
    let ledOn = 0;
    for (;;) {
      await rt.at(13);
      await rt.at(14); const c = rt.irDecode();
      if (c !== null) {
        await rt.at(15); rt.print('Command: 0x');
        await rt.at(16); rt.println(c.toString(16).toUpperCase());
        await rt.at(17);
        if (c === 0x45) { await rt.at(18); ledOn = ledOn ? 0 : 1; await rt.at(19); rt.digitalWrite('G16', ledOn); }
        await rt.at(21);
      }
      await rt.yield();
    }
  },

  async u3_mpu(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(5);
    await rt.at(8); rt.serialBegin(9600);
    await rt.at(9);
    if (!rt.i2cProbe(0x68)) { await rt.at(10); rt.println('MPU6050 not found!'); for (;;) await rt.delay(10); }
    await rt.at(13); rt.println('MPU6050 ready');
    for (;;) {
      await rt.at(16); await rt.at(17);
      await rt.at(18); const m = rt.mpuRead();
      await rt.at(19); rt.print('Acceleration X: ');
      await rt.at(20); rt.print(m.ax, 2);
      await rt.at(21); rt.print(', Y: ');
      await rt.at(22); rt.print(m.ay, 2);
      await rt.at(23); rt.print(', Z: ');
      await rt.at(24); rt.print(m.az, 2);
      await rt.at(25); rt.println(' m/s^2');
      await rt.at(26); rt.print('Rotation Z: ');
      await rt.at(27); rt.print(m.gz, 2);
      await rt.at(28); rt.println(' rad/s');
      await rt.at(29); await rt.delay(500);
    }
  },

  async e_mpu(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(5);
    await rt.at(8); rt.serialBegin(115200);
    await rt.at(9);
    if (!rt.i2cProbe(0x68)) { await rt.at(10); rt.println('MPU6050 not found!'); for (;;) await rt.delay(10); }
    await rt.at(13); rt.println('MPU6050 ready');
    for (;;) {
      await rt.at(16); await rt.at(17);
      await rt.at(18); const m = rt.mpuRead();
      await rt.at(19); rt.print('Acceleration X: ');
      await rt.at(20); rt.print(m.ax, 2);
      await rt.at(21); rt.print(', Y: ');
      await rt.at(22); rt.print(m.ay, 2);
      await rt.at(23); rt.print(', Z: ');
      await rt.at(24); rt.print(m.az, 2);
      await rt.at(25); rt.println(' m/s^2');
      await rt.at(26); rt.print('Rotation Z: ');
      await rt.at(27); rt.print(m.gz, 2);
      await rt.at(28); rt.println(' rad/s');
      await rt.at(29); await rt.delay(500);
    }
  },

  async e_isr(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(11); rt.serialBegin(115200);
    await rt.at(12); rt.pinMode('G16', 'OUTPUT');
    await rt.at(13); rt.pinMode('G17', 'INPUT_PULLUP');
    await rt.at(14);
    let pressed = false, ledOn = 0, last = 1, alive = true;
    (async () => { try { while (alive) { const v = rt.digitalRead('G17'); if (v === 0 && last === 1) { await rt.at(6); pressed = true; await rt.at(7); } last = v; await rt.delay(10); } } catch (e) {} })();
    try {
      for (;;) {
        await rt.at(17); await rt.at(18);
        if (pressed) {
          await rt.at(19); pressed = false;
          await rt.at(20); ledOn = ledOn ? 0 : 1;
          await rt.at(21); rt.digitalWrite('G16', ledOn);
          await rt.at(22); rt.println('Interrupt: button pressed');
        }
        await rt.at(24); await rt.delay(1000);
      }
    } finally { alive = false; }
  },

  async u3_step(rt) {
    await rt.at(1); await rt.at(3); await rt.at(6);
    for (const p of ['D8', 'D9', 'D10', 'D11']) rt.pinMode(p, 'OUTPUT');
    await rt.at(9); const rpm = 10; const ms = 60000 / (2048 * rpm);
    await rt.at(10); rt.serialBegin(9600);
    const SEQ = [[1, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]];   // coil pattern of the Stepper library (pins 1..4 in constructor order)
    let k = 0;
    const turn = async (n) => { const dir = n > 0 ? 1 : -1, tot = Math.abs(n), t0 = performance.now(); let done = 0; while (done < tot) { const target = Math.min(tot, Math.floor((performance.now() - t0) / ms) + 1); while (done < target) { k = (k + (dir > 0 ? 1 : 3)) % 4; rt.stepTick(dir); done++; } const p = SEQ[k]; rt.digitalWrite(['D8', 'D9', 'D10', 'D11'][0], p[0]); rt.digitalWrite(['D8', 'D9', 'D10', 'D11'][2], p[1]); rt.digitalWrite(['D8', 'D9', 'D10', 'D11'][1], p[2]); rt.digitalWrite(['D8', 'D9', 'D10', 'D11'][3], p[3]); await rt.delay(8); } };
    for (;;) {
      await rt.at(13);
      await rt.at(14); rt.println('clockwise');
      await rt.at(15); await turn(2048);
      await rt.at(16); await rt.delay(500);
      await rt.at(17); rt.println('counter-clockwise');
      await rt.at(18); await turn(-2048);
      await rt.at(19); await rt.delay(500);
    }
  },

  async e_step(rt) {
    await rt.at(1); await rt.at(3); await rt.at(6);
    for (const p of ['G16', 'G17', 'G18', 'G19']) rt.pinMode(p, 'OUTPUT');
    await rt.at(9); const rpm = 10; const ms = 60000 / (2048 * rpm);
    await rt.at(10); rt.serialBegin(115200);
    const SEQ = [[1, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]];   // coil pattern of the Stepper library (pins 1..4 in constructor order)
    let k = 0;
    const turn = async (n) => { const dir = n > 0 ? 1 : -1, tot = Math.abs(n), t0 = performance.now(); let done = 0; while (done < tot) { const target = Math.min(tot, Math.floor((performance.now() - t0) / ms) + 1); while (done < target) { k = (k + (dir > 0 ? 1 : 3)) % 4; rt.stepTick(dir); done++; } const p = SEQ[k]; rt.digitalWrite(['G16', 'G17', 'G18', 'G19'][0], p[0]); rt.digitalWrite(['G16', 'G17', 'G18', 'G19'][2], p[1]); rt.digitalWrite(['G16', 'G17', 'G18', 'G19'][1], p[2]); rt.digitalWrite(['G16', 'G17', 'G18', 'G19'][3], p[3]); await rt.delay(8); } };
    for (;;) {
      await rt.at(13);
      await rt.at(14); rt.println('clockwise');
      await rt.at(15); await turn(2048);
      await rt.at(16); await rt.delay(500);
      await rt.at(17); rt.println('counter-clockwise');
      await rt.at(18); await turn(-2048);
      await rt.at(19); await rt.delay(500);
    }
  },

  async u3_bmp(rt) {
    await rt.at(1); await rt.at(2); await rt.at(4);
    await rt.at(7); rt.serialBegin(9600);
    await rt.at(8);
    if (!rt.i2cProbe(0x76)) { await rt.at(9); rt.println('BMP280 not found!'); for (;;) await rt.delay(10); }
    for (;;) {
      await rt.at(14);
      await rt.at(15); rt.print('Temperature = ');
      await rt.at(16); const m = rt.bmpRead(); rt.print(m.t, 2);
      await rt.at(17); rt.println(' *C');
      await rt.at(18); rt.print('Pressure = ');
      await rt.at(19); rt.print(m.p, 2);
      await rt.at(20); rt.println(' hPa');
      await rt.at(21); await rt.delay(1000);
    }
  },

  async e_bmp(rt) {
    await rt.at(1); await rt.at(2); await rt.at(4);
    await rt.at(7); rt.serialBegin(115200);
    await rt.at(8);
    if (!rt.i2cProbe(0x76)) { await rt.at(9); rt.println('BMP280 not found!'); for (;;) await rt.delay(10); }
    for (;;) {
      await rt.at(14);
      await rt.at(15); rt.print('Temperature = ');
      await rt.at(16); const m = rt.bmpRead(); rt.print(m.t, 2);
      await rt.at(17); rt.println(' *C');
      await rt.at(18); rt.print('Pressure = ');
      await rt.at(19); rt.print(m.p, 2);
      await rt.at(20); rt.println(' hPa');
      await rt.at(21); await rt.delay(1000);
    }
  },

  async u3_soil(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(6); rt.serialBegin(9600);
    const dryV = 512, wetV = 205;
    for (;;) {
      await rt.at(9);
      await rt.at(10); const raw = rt.analogRead('A0');
      await rt.at(11); let pct = rt.map(raw, dryV, wetV, 0, 100);
      await rt.at(12); pct = Math.min(100, Math.max(0, pct));
      await rt.at(13); rt.print('raw ');
      await rt.at(14); rt.print(raw);
      await rt.at(15); rt.print('  moisture ');
      await rt.at(16); rt.print(pct);
      await rt.at(17); rt.println(' %');
      await rt.at(18); await rt.delay(1000);
    }
  },

  async e_soil(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(6); rt.serialBegin(115200);
    const dryV = 3102, wetV = 1241;
    for (;;) {
      await rt.at(9);
      await rt.at(10); const raw = rt.analogRead('G34');
      await rt.at(11); let pct = rt.map(raw, dryV, wetV, 0, 100);
      await rt.at(12); pct = Math.min(100, Math.max(0, pct));
      await rt.at(13); rt.print('raw ');
      await rt.at(14); rt.print(raw);
      await rt.at(15); rt.print('  moisture ');
      await rt.at(16); rt.print(pct);
      await rt.at(17); rt.println(' %');
      await rt.at(18); await rt.delay(1000);
    }
  },

  async u3_snd(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5);
    await rt.at(8); rt.pinMode('D5', 'OUTPUT');
    await rt.at(9); rt.serialBegin(9600);
    await rt.at(10); await rt.delay(300); const quiet = rt.analogRead('A0');
    let ledOn = 0;
    for (;;) {
      await rt.at(13);
      await rt.at(14); const level = Math.abs(rt.analogRead('A0') - quiet);
      await rt.at(15);
      if (level > 40) {
        await rt.at(16); ledOn = ledOn ? 0 : 1;
        await rt.at(17); rt.digitalWrite('D5', ledOn);
        await rt.at(18); rt.println('Clap detected');
        await rt.at(19); await rt.delay(300);
      }
      await rt.yield();
    }
  },

  async e_snd(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5);
    await rt.at(8); rt.pinMode('G16', 'OUTPUT');
    await rt.at(9); rt.serialBegin(115200);
    await rt.at(10); await rt.delay(300); const quiet = rt.analogRead('G34');
    let ledOn = 0;
    for (;;) {
      await rt.at(13);
      await rt.at(14); const level = Math.abs(rt.analogRead('G34') - quiet);
      await rt.at(15);
      if (level > 160) {
        await rt.at(16); ledOn = ledOn ? 0 : 1;
        await rt.at(17); rt.digitalWrite('G16', ledOn);
        await rt.at(18); rt.println('Clap detected');
        await rt.at(19); await rt.delay(300);
      }
      await rt.yield();
    }
  },

  async u3_plant(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5);
    await rt.at(8); rt.pinMode('D5', 'OUTPUT');
    await rt.at(9); rt.serialBegin(9600);
    let pumpOn = false;
    for (;;) {
      await rt.at(12);
      await rt.at(13); const raw = rt.analogRead('A0');
      await rt.at(14); const pct = Math.min(100, Math.max(0, rt.map(raw, 512, 205, 0, 100)));
      await rt.at(15); if (pct < 30) pumpOn = true;
      await rt.at(16); if (pct > 60) pumpOn = false;
      await rt.at(17); rt.digitalWrite('D5', pumpOn ? 1 : 0);
      await rt.at(18); rt.print('moisture ');
      await rt.at(19); rt.print(pct);
      await rt.at(20); rt.println(pumpOn ? ' %  pump ON' : ' %  pump off');
      await rt.at(21); await rt.delay(1000);
    }
  },

  async e_plant(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5);
    await rt.at(8); rt.pinMode('G16', 'OUTPUT');
    await rt.at(9); rt.serialBegin(115200);
    let pumpOn = false;
    for (;;) {
      await rt.at(12);
      await rt.at(13); const raw = rt.analogRead('G34');
      await rt.at(14); const pct = Math.min(100, Math.max(0, rt.map(raw, 3102, 1241, 0, 100)));
      await rt.at(15); if (pct < 30) pumpOn = true;
      await rt.at(16); if (pct > 60) pumpOn = false;
      await rt.at(17); rt.digitalWrite('G16', pumpOn ? 1 : 0);
      await rt.at(18); rt.print('moisture ');
      await rt.at(19); rt.print(pct);
      await rt.at(20); rt.println(pumpOn ? ' %  pump ON' : ' %  pump off');
      await rt.at(21); await rt.delay(1000);
    }
  },

  async e_wx(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(6); await rt.at(7);
    await rt.at(10); rt.serialBegin(115200);
    await rt.at(11);
    if (!rt.i2cProbe(0x76)) { rt.println('BMP280 not found'); for (;;) await rt.delay(1000); }
    await rt.at(12);
    if (!rt.oled('begin', 0x3C)) { rt.println('SSD1306 not found'); for (;;) await rt.delay(1000); }
    await rt.at(13); await rt.at(14);
    for (;;) {
      await rt.at(17);
      await rt.at(18); const m = rt.bmpRead();
      await rt.at(19);
      await rt.at(20); rt.oled('clear');
      await rt.at(21); rt.oled('cursor', 0, 0);
      await rt.at(22); await rt.at(23); await rt.at(24); rt.oled('println', 'Temp: ' + m.t.toFixed(1) + ' C');
      await rt.at(25); await rt.at(26); await rt.at(27); rt.oled('println', 'Press: ' + m.p.toFixed(0) + ' hPa');
      await rt.at(28); rt.oled('display');
      await rt.at(29); await rt.delay(1000);
    }
  },

  async u3_keypad(rt) {
    await rt.at(1); await rt.at(3); await rt.at(4); await rt.at(5); await rt.at(11); await rt.at(12); await rt.at(13);
    await rt.at(16); rt.serialBegin(9600);
    for (;;) {
      await rt.at(19);
      await rt.at(20); const key = rt.keypadKey();
      await rt.at(21);
      if (key) { await rt.at(22); rt.print('Key: '); await rt.at(23); rt.println(key); }
      await rt.yield();
    }
  },

  async e_keypad(rt) {
    await rt.at(1); await rt.at(3); await rt.at(4); await rt.at(5); await rt.at(11); await rt.at(12); await rt.at(13);
    await rt.at(16); rt.serialBegin(115200);
    for (;;) {
      await rt.at(19);
      await rt.at(20); const key = rt.keypadKey();
      await rt.at(21);
      if (key) { await rt.at(22); rt.print('Key: '); await rt.at(23); rt.println(key); }
      await rt.yield();
    }
  },

  async u3_lock(rt) {
    await rt.at(1); await rt.at(13); await rt.at(15); await rt.at(16); await rt.at(17);
    await rt.at(20); rt.serialBegin(9600);
    let entered = '';
    for (;;) {
      await rt.at(23);
      await rt.at(24); const key = rt.keypadKey();
      await rt.at(25);
      if (key) {
        await rt.at(26);
        if (key === '#') {
          await rt.at(27);
          if (entered === '1234') { await rt.at(28); rt.println('Access granted'); await rt.at(29); rt.tone('D10', 1500, 200); }
          else { await rt.at(31); rt.println('Wrong code'); await rt.at(32); rt.tone('D10', 300, 600); }
          await rt.at(34); entered = '';
        } else {
          await rt.at(35);
          if (key === '*') { await rt.at(36); entered = ''; await rt.at(37); rt.println('Cleared'); }
          else { await rt.at(39); entered += key; await rt.at(40); rt.println('digit entered'); }
        }
      }
      await rt.yield();
    }
  },

  async e_lock(rt) {
    await rt.at(1); await rt.at(13); await rt.at(15); await rt.at(16); await rt.at(17);
    await rt.at(20); rt.serialBegin(115200);
    let entered = '';
    for (;;) {
      await rt.at(23);
      await rt.at(24); const key = rt.keypadKey();
      await rt.at(25);
      if (key) {
        await rt.at(26);
        if (key === '#') {
          await rt.at(27);
          if (entered === '1234') { await rt.at(28); rt.println('Access granted'); await rt.at(29); rt.tone('G16', 1500, 200); }
          else { await rt.at(31); rt.println('Wrong code'); await rt.at(32); rt.tone('G16', 300, 600); }
          await rt.at(34); entered = '';
        } else {
          await rt.at(35);
          if (key === '*') { await rt.at(36); entered = ''; await rt.at(37); rt.println('Cleared'); }
          else { await rt.at(39); entered += key; await rt.at(40); rt.println('digit entered'); }
        }
      }
      await rt.yield();
    }
  },

  async e_log(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(5); await rt.at(6); await rt.at(7);
    await rt.at(10); rt.serialBegin(115200);
    await rt.at(11); await rt.at(12);
    await rt.at(15);
    if (!rt.i2cProbe(0x76)) { await rt.at(16); rt.println('BMP280 not found'); for (;;) await rt.delay(1000); }
    await rt.at(19); rt.fsWrite('/log.csv', '');
    await rt.at(20); rt.fsAppend('/log.csv', 'seconds,temp_c,pressure_hpa\n');
    await rt.at(21);
    let count = 0;
    for (;;) {
      await rt.at(24);
      await rt.at(25);
      await rt.at(26); const m = rt.bmpRead(); const sec = Math.floor(rt.millis() / 1000);
      await rt.at(28); await rt.at(30); rt.fsAppend('/log.csv', sec + ',' + m.t.toFixed(2) + ',' + m.p.toFixed(1) + '\n');
      await rt.at(31); count++;
      await rt.at(32); await rt.at(33); rt.print('Logged line '); await rt.at(34); rt.println(count);
      await rt.at(35);
      if (count === 5) {
        await rt.at(36); const txt = rt.fsRead('/log.csv');
        await rt.at(37); await rt.at(38); for (const line of txt.split('\n')) if (line) rt.println(line);
        await rt.at(40);
      }
      await rt.at(42); await rt.delay(2000);
    }
  },

  async e_home(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(8); await rt.at(9); await rt.at(10);
    await rt.at(24); rt.serialBegin(115200);
    await rt.at(25); rt.pinMode('G16', 'OUTPUT');
    await rt.at(26);
    if (!rt.i2cProbe(0x76)) { await rt.at(27); rt.println('BMP280 not found'); for (;;) await rt.delay(1000); }
    await rt.at(30); rt.wifiBegin();
    while (rt.wifiStatus() !== 'connected') { await rt.at(31); await rt.delay(500); }
    await rt.at(31);
    await rt.at(32); await rt.at(33);
    let lastSend = 0;
    for (;;) {
      await rt.at(37);
      if (!rt.mqttConnected()) {
        await rt.at(38);
        if (await rt.mqttConnect()) { await rt.at(39); rt.mqttSubscribe('home/led'); await rt.at(40); rt.println('MQTT connected'); }
        else { await rt.at(42); await rt.delay(2000); await rt.at(43); continue; }
      }
      await rt.at(46);
      const m = rt.mqttPoll();
      if (m) {
        await rt.at(16); await rt.at(19); rt.digitalWrite('G16', m.payload === 'ON' ? 1 : 0);
        await rt.at(20); rt.mqttPublish('home/led/state', m.payload === 'ON' ? 'ON' : 'OFF');
      }
      await rt.at(47);
      if (rt.millis() - lastSend > 3000) {
        await rt.at(48); lastSend = rt.millis();
        await rt.at(49); const t = rt.bmpRead().t;
        await rt.at(50); rt.mqttPublish('home/temperature', t.toFixed(1));
        await rt.at(51); rt.println('Temperature sent');
        await rt.at(52);
        if (t > 28.0) { await rt.at(53); rt.mqttPublish('home/alert', 'too warm'); await rt.at(54); rt.println('Alert sent'); }
      }
      await rt.yield();
    }
  },

  async u3_car(rt) {
    await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5); await rt.at(6);
    await rt.at(9); rt.pinMode('D5', 'OUTPUT');
    await rt.at(10); rt.pinMode('D7', 'OUTPUT');
    await rt.at(11); rt.pinMode('D8', 'OUTPUT');
    await rt.at(12); rt.pinMode('D3', 'OUTPUT');
    await rt.at(13); rt.pinMode('D2', 'INPUT');
    await rt.at(14); rt.serialBegin(9600);
    for (;;) {
      await rt.at(17);
      await rt.at(18); rt.digitalWrite('D3', 0);
      await rt.at(19); await rt.delayMicroseconds(2);
      await rt.at(20); rt.digitalWrite('D3', 1);
      await rt.at(21); await rt.delayMicroseconds(10);
      await rt.at(22); rt.digitalWrite('D3', 0);
      await rt.at(23); const duration = await rt.pulseIn('D2', 1);
      await rt.at(24); const cm = duration / 58.0;
      await rt.at(26);
      if (cm > 0 && cm < 20) { await rt.at(27); rt.analogWrite('D5', 0); await rt.at(28); rt.println('Obstacle: stop'); }
      else { await rt.at(30); rt.digitalWrite('D7', 1); await rt.at(31); rt.digitalWrite('D8', 0); await rt.at(32); rt.analogWrite('D5', 200); await rt.at(33); rt.println('Clear: forward'); }
      await rt.at(35); await rt.delay(200);
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

  // Lesson 23 — final project. Python 101+, browser JS 201+, sketch 1+.
  async home(rt) {
    await rt.at(101); await rt.at(102); await rt.at(103); await rt.at(105);
    await rt.at(107); await rt.at(108); await rt.at(109); await rt.at(110);
    rt.serialBegin(9600);
    await rt.at(17); await rt.at(18); rt.pinMode('D4', 'INPUT');
    await rt.at(19); await rt.at(20); await rt.at(21); await rt.at(22);
    await rt.at(126); await rt.at(127); await rt.at(128); await rt.at(140);
    await rt.at(201);
    let auto = true, lampOn = false, want = false, latest = null;
    for (;;) {
      // buttons tapped on the phone: browser -> Python (handlers only flip flags)
      for (const evn of rt.uiEvents()) {
        if (evn === 'toggle_mode') { await rt.at(209); await rt.at(117); await rt.at(118); await rt.at(119); auto = !auto; rt.bridge('click', { auto, lamp: lampOn }); await rt.delay(150); }
        else { await rt.at(210); await rt.at(121); await rt.at(122); await rt.at(123); if (!auto) { await rt.at(124); want = !lampOn; } rt.bridge('click', { auto, lamp: lampOn }); await rt.delay(150); }
      }
      await rt.at(25);
      await rt.at(26); const c = rt.thermo().c;
      await rt.at(27); const rh = rt.thermo().rh;
      await rt.at(28); rt.bridge('notify', { c, rh, auto, lamp: lampOn }); await rt.delay(120);
      await rt.at(112); await rt.at(113); await rt.at(114); latest = [c, rh];
      await rt.at(115); rt.bridge('render', { c, rh, auto, lamp: lampOn }); await rt.delay(150);
      await rt.at(203); await rt.at(204); await rt.at(205); await rt.at(206); await rt.at(207);
      await rt.at(130); await rt.at(131); await rt.at(132);
      if (auto) { await rt.at(133); await rt.at(134); want = latest[0] > 28; }
      await rt.at(135);
      if (want !== lampOn) {
        await rt.at(136); lampOn = want;
        await rt.at(137); rt.bridge('call', { c, rh, auto, lamp: lampOn }); await rt.delay(250);
        await rt.at(7);
        if (lampOn) { await rt.at(8); await rt.at(9); rt.pinMode('D4', 'OUTPUT'); await rt.at(10); rt.digitalWrite('D4', 0); }
        else { await rt.at(11); await rt.at(12); rt.pinMode('D4', 'INPUT'); }
        await rt.at(14); rt.bridge('reply', { c, rh, auto, lamp: lampOn }); await rt.delay(250);
      }
      await rt.at(138); await rt.at(29); await rt.delay(400);
    }
  },

  // ---- Raspberry Pi 4 (Python, GPIO Zero). Pins are physical header pins: p11 = GPIO17, p3 = GPIO2.
  async pi_blink(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2);
    await rt.at(4); rt.pinMode('p11', 'OUTPUT'); rt.digitalWrite('p11', 0);      // LED(17): output, initially off
    for (;;) {
      await rt.at(6);
      await rt.at(7); rt.digitalWrite('p11', 1);
      await rt.at(8); await rt.delay(1000);
      await rt.at(9); rt.digitalWrite('p11', 0);
      await rt.at(10); await rt.delay(1000);
    }
  },
  async pi_i2c(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(5);
    await rt.at(6);
    if (!rt.sensor().found) { rt.println('ValueError: No I2C device at address: 0x44'); for (;;) await rt.delay(1000); }
    for (;;) {
      await rt.at(8);
      await rt.at(9); const r = rt.sensor(); rt.println(''); rt.println(`Temperature: ${r.c.toFixed(1)} C`);
      await rt.at(10); rt.println(`Humidity: ${r.rh.toFixed(1)} %`);
      await rt.at(11); await rt.delay(2000);
    }
  },
  // Lesson 10 — Flask server on the Pi; the phone's taps arrive as 'on' / 'off' events (simulated)
  async pi_web(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(4);
    await rt.at(5); rt.pinMode('p11', 'OUTPUT'); rt.digitalWrite('p11', 0);
    let lit = false;
    const page = async () => { await rt.at(8); await rt.at(9); await rt.at(10); rt.web('page', { lit }); };
    rt.println('[simulated] server started on port 5000');
    await rt.at(7); await page();
    for (;;) {
      for (const evn of rt.uiEvents()) {
        if (evn === 'on') { rt.println('[simulated] request: GET /on'); await rt.at(12); await rt.at(13); await rt.at(14); lit = true; rt.digitalWrite('p11', 1); await rt.at(15); await page(); }
        else if (evn === 'off') { rt.println('[simulated] request: GET /off'); await rt.at(17); await rt.at(18); await rt.at(19); lit = false; rt.digitalWrite('p11', 0); await rt.at(20); await page(); }
      }
      await rt.delay(120);
    }
  },
  // Lesson 11 — control panel: Flask page with sensor values + LED links (simulated phone, refresh every 5 s)
  async pi_panel(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(6);
    await rt.at(7); rt.pinMode('p11', 'OUTPUT'); rt.digitalWrite('p11', 0);
    await rt.at(8);
    if (!rt.sensor().found) { rt.println('ValueError: No I2C device at address: 0x44'); for (;;) await rt.delay(1000); }
    rt.println('[simulated] server started on port 5000');
    let lit = false;
    const page = async () => {
      await rt.at(10); await rt.at(11); await rt.at(12); await rt.at(13); await rt.at(14); await rt.at(15);
      await rt.at(16); const r = rt.sensor(); await rt.at(17); await rt.at(18); await rt.at(19); await rt.at(20);
      rt.web('page', { lit, c: r.c, rh: r.rh });
    };
    await page();
    let t0 = performance.now();
    for (;;) {
      for (const evn of rt.uiEvents()) {
        if (evn === 'on') { rt.println('[simulated] request: GET /on'); await rt.at(22); await rt.at(23); await rt.at(24); lit = true; rt.digitalWrite('p11', 1); await rt.at(25); await page(); t0 = performance.now(); }
        else if (evn === 'off') { rt.println('[simulated] request: GET /off'); await rt.at(27); await rt.at(28); await rt.at(29); lit = false; rt.digitalWrite('p11', 0); await rt.at(30); await page(); t0 = performance.now(); }
      }
      if (performance.now() - t0 > 5000) { t0 = performance.now(); rt.println('[simulated] browser refresh: GET /'); await page(); }
      await rt.delay(120);
    }
  },
  async pi_tone(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(6);
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);                    // A4 = 440 Hz = MIDI note 69, equal temperament
    const notes = [['C4', 60], ['D4', 62], ['E4', 64], ['F4', 65], ['G4', 67], ['A4', 69], ['B4', 71]];
    for (;;) {
      for (const [name, m] of notes) {
        await rt.at(8); await rt.at(9); rt.playHz('p11', hz(m)); rt.println(`play ${name}  ${hz(m).toFixed(1)} Hz`);
        await rt.at(10); await rt.delay(400);
      }
      await rt.at(12); rt.stopHz('p11'); rt.println('stop');
      await rt.delay(1500);
    }
  },
  async pi_pwm(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2);
    await rt.at(4); rt.pinMode('p11', 'OUTPUT'); rt.pwmValue('p11', 0);
    for (;;) {
      await rt.at(6);
      await rt.at(7); rt.pwmValue('p11', 0);
      await rt.at(8); await rt.delay(1000);
      await rt.at(9); rt.pwmValue('p11', 0.5);
      await rt.at(10); await rt.delay(1000);
      await rt.at(11); rt.pwmValue('p11', 1);
      await rt.at(12); await rt.delay(1000);
    }
  },
  async pi_button(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2);
    await rt.at(4); rt.pinMode('p3', 'INPUT_PULLUP');                              // Button(2): pull_up=True by default
    for (;;) {
      await rt.at(6);
      await rt.at(7); const pressed = rt.digitalRead('p3') === 0;
      if (pressed) { await rt.at(8); rt.println('Pressed'); }
      else { await rt.at(9); await rt.at(10); rt.println('Released'); }
      await rt.at(11); await rt.delay(1000);
    }
  },
  async pi_button_led(rt) {
    rt.serialBegin(9600);
    await rt.at(1);
    await rt.at(3); rt.pinMode('p11', 'OUTPUT'); rt.digitalWrite('p11', 0);
    await rt.at(4); rt.pinMode('p3', 'INPUT_PULLUP');
    for (;;) {
      await rt.at(6);
      await rt.at(7);
      if (rt.digitalRead('p3') === 0) { await rt.at(8); rt.digitalWrite('p11', 1); }
      else { await rt.at(9); await rt.at(10); rt.digitalWrite('p11', 0); }
    }
  },

  async pi_rgb(rt) {
    rt.serialBegin(9600);
    const set = (r, g, b) => { rt.pwmValue('p12', r); rt.pwmValue('p32', g); rt.pwmValue('p33', b); };
    await rt.at(1); await rt.at(2);
    await rt.at(4); set(0, 0, 0);
    for (;;) {
      await rt.at(6);
      await rt.at(7); set(1, 0, 0); await rt.at(8); await rt.delay(1000);
      await rt.at(9); set(0, 1, 0); await rt.at(10); await rt.delay(1000);
      await rt.at(11); set(0, 0, 1); await rt.at(12); await rt.delay(1000);
      await rt.at(13); set(1, 1, 0); await rt.at(14); await rt.delay(1000);
      await rt.at(15); set(1, 1, 1); await rt.at(16); await rt.delay(1000);
      await rt.at(17); set(0, 0, 0); await rt.at(18); await rt.delay(1000);
    }
  },
  async pi_dht(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(5);
    for (;;) {
      await rt.at(7);
      await rt.at(8);
      const r = rt.dhtRead();
      if (!r.ok) { await rt.at(9); await rt.at(12); await rt.at(13); rt.println('Read failed: DHT sensor not found, check wiring'); }
      else { await rt.at(9); await rt.at(10); await rt.at(11); rt.println(`Temp: ${r.t.toFixed(1)} C  Humidity: ${r.h.toFixed(1)} %`); }
      await rt.at(14); await rt.delay(2000);
    }
  },
  async pi_enc(rt) {
    rt.serialBegin(9600);
    let counter = 0, last;
    await rt.at(1); await rt.at(2);
    await rt.at(4); rt.pinMode('p11', 'INPUT_PULLUP'); await rt.at(5); rt.pinMode('p13', 'INPUT_PULLUP'); await rt.at(6); rt.pinMode('p15', 'INPUT_PULLUP');
    await rt.at(7); await rt.at(8); last = rt.digitalRead('p11') === 0;
    for (;;) {
      await rt.at(10);
      await rt.at(11); const now = rt.digitalRead('p11') === 0;
      await rt.at(12);
      if (now && !last) {
        await rt.at(13);
        if (rt.digitalRead('p13') !== 0) { await rt.at(14); counter++; }
        else { await rt.at(15); await rt.at(16); counter--; }
        await rt.at(17); rt.println(counter);
      }
      await rt.at(18); last = now;
      await rt.at(19);
      if (rt.digitalRead('p15') === 0) { await rt.at(20); rt.println('Knob pressed'); await rt.at(21); await rt.delay(300); }
      await rt.at(22); await rt.delay(2);
    }
  },

  async pi_lcd(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2);
    await rt.at(4);
    if (!rt.lcd('probe')) { rt.println('OSError: [Errno 121] Remote I/O error'); return; }
    rt.lcd('init'); rt.lcd('backlight');
    await rt.at(5); rt.lcd('cursor', 0, 0); rt.lcd('print', 'Hello, Pi 4!');
    await rt.at(6); let seconds = 0;
    for (;;) {
      await rt.at(8);
      await rt.at(9); rt.lcd('cursor', 0, 1);
      await rt.at(10); rt.lcd('print', 'Seconds: ' + seconds);
      await rt.at(11); seconds++;
      await rt.at(12); await rt.delay(1000);
    }
  },
  async pi_oled(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2);
    await rt.at(4);
    await rt.at(5);
    if (!rt.oled('begin', 0x3C)) { rt.println('ValueError: No I2C device at address: 0x3c'); return; }
    await rt.at(7); rt.oled('clear');
    await rt.at(8); rt.oled('cursor', 0, 0); rt.oled('print', 'Hello, Pi 4!');
    await rt.at(9); rt.oled('cursor', 0, 12); rt.oled('print', 'OLED 128 x 64');
    await rt.at(10); rt.oled('display');
    for (;;) await rt.delay(1000);     // the program ends on a real Pi, but the OLED keeps showing the picture
  },
  async pi_neo(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(5); rt.neo('begin'); rt.neo('brightness', 38);
    for (;;) {
      await rt.at(7);
      for (let i = 0; i < 8; i++) {
        await rt.at(8);
        await rt.at(9); rt.neo('clear');
        await rt.at(10); rt.neo('set', i, 255, 0, 0);
        await rt.at(11); rt.neo('show');
        await rt.at(12); await rt.delay(150);
      }
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

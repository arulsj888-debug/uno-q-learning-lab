// Simulated devices of the UNO R3 lessons 40-59 (active buzzer, RC circuit, switches, 7-segment, MAX7219, TFT, gas / flame sensors,
// RFID, GPS, RTC, A4988, SD card, serial peer, Bluetooth, nRF24, interrupts, EEPROM).
// A lesson lists `widgets: ['dv:name', ...]` and an io entry { kind: 'dev:name', role, needs, item } for each wire it needs.
// The app (main.js) forwards pin writes, pin reads, analog reads and `rt.dev(name, op, ...args)` calls to the devices.
const $ = s => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

class Dev {
  constructor(app) { this.app = app; this.keep = (app.dvKeep ??= {}); }
  get L() { return this.app.lesson; }
  ios() { return Object.values((this.L && this.L.io) || {}).filter(x => x.kind === 'dev:' + this.name); }
  roleOf(pin) { const io = this.app.ioFor(pin); return io && io.kind === 'dev:' + this.name ? io.role : null; }
  wired() { const ios = this.ios(); return ios.length > 0 && ios.every(io => this.app.wired(io)); }
  on() { return this.wired() && this.app.board.powered; }
  running() { return this.app.sim.running; }
  item(role) { const io = this.ios().find(x => x.role === role) || this.ios()[0]; return io && io.item ? this.app.bench.get(io.item) : null; }
  box(title, inner, note) { return `<div class="io-block"><div class="io-title">${title} <span class="io-note">(simulated)</span></div>${inner}${note ? `<div class="io-note">${note}</div>` : ''}</div>`; }
  set(sel, h) { const e = $(sel); if (e && e.innerHTML !== h) e.innerHTML = h; }
  stateNote() { return !this.app.board.powered ? 'USB is not plugged in — the board has no power.' : !this.wired() ? 'Some wires are missing.' : !this.running() ? 'Press <b>▶ Run</b>.' : ''; }
  html() { return ''; } bind() {} tick() {} reset() {} halt() {} pin() {} read() {} analog() {} call() {} button() {}
}

// ------------------------------------------------------------------------------------------------ active buzzer
class ABuz extends Dev {
  name = 'abuz'; lv = 0;
  html() { return this.box('Active buzzer', '<div id="ab-st" class="io-val">—</div>', 'An active buzzer has its own oscillator: a steady HIGH is enough. The sound here is about 2.5 kHz; the real pitch depends on the part.'); }
  pin(pin, level) {
    if (this.roleOf(pin) !== 'bz') return;
    this.lv = level; const sound = !!level && this.on();
    if (sound) this.app.playTone(2500, 0); else this.app.stopSound();
  }
  halt() { this.lv = 0; this.app.stopSound(); }
  reset() { this.lv = 0; }
  tick() {
    const bz = this.item('bz'), sound = !!this.lv && this.on() && this.running(); if (bz && bz.vibrate) bz.vibrate(sound);
    this.set('#ab-st', this.stateNote() || (sound ? '<b class="hi">Pin HIGH</b> → current flows through the buzzer → <b>it sounds</b>' : '<b class="lo">Pin LOW</b> → no current → silent'));
  }
}

// ------------------------------------------------------------------------------------------------ RC charging circuit
class RC extends Dev {
  name = 'rc'; V = 0; target = 0; t = 0; hist = [];
  get VS() { return this.app.logicV || 5; }
  tau() { const io = this.ios()[0]; return io ? io.r * io.c : 1; }
  step() { const now = performance.now(), dt = Math.min(0.5, (now - this.t) / 1000); this.t = now; const k = 1 - Math.exp(-dt / this.tau()); this.V += (this.target - this.V) * k; }
  html() { return this.box('Capacitor voltage', '<canvas id="rc-cv" width="300" height="130" style="width:100%;background:#0d1117;border-radius:6px"></canvas><div id="rc-st" class="io-val">—</div>', 'Charge and discharge follow V = V<sub>final</sub> + (V<sub>start</sub> − V<sub>final</sub>) · e<sup>−t/RC</sup>. This picture uses the ideal R and C: a real capacitor has a tolerance (often −20 % / +20 % for electrolytics).'); }
  reset() { this.V = 0; this.target = 0; this.t = performance.now(); this.hist = []; }
  pin(pin, level) { if (this.roleOf(pin) !== 'drive') return; this.step(); this.target = level ? this.VS : 0; }
  analog(pin) { if (this.roleOf(pin) !== 'cap' || !this.on()) return undefined; this.step(); return clamp(this.V + (Math.random() - 0.5) * 0.004, 0, this.VS); }
  tick() {
    const VS = this.VS, VM = Math.ceil(VS);
    if (!this.running()) { this.t = performance.now(); } else { this.step(); const last = this.hist[this.hist.length - 1], t = this.app.sim.token ? (performance.now() - (this.app.runStart || 0)) / 1000 : 0; if (!last || t - last[0] > 0.05) this.hist.push([t, this.V]); if (this.hist.length > 400) this.hist.shift(); }
    const cv = $('#rc-cv'); if (!cv) return; const c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
    c.strokeStyle = '#2a3340'; c.lineWidth = 1; for (let i = 0; i <= VM; i++) { const y = H - 14 - i * (H - 24) / VM; c.beginPath(); c.moveTo(28, y); c.lineTo(W - 4, y); c.stroke(); c.fillStyle = '#8b98a8'; c.font = '10px sans-serif'; c.fillText(i + ' V', 2, y + 3); }
    const tau = this.tau(), span = 8 * tau; c.strokeStyle = '#3b6ea8'; c.setLineDash([3, 3]); for (let k = 1; k <= 5; k++) { const x = 28 + (k * tau / span) * (W - 32); c.beginPath(); c.moveTo(x, 6); c.lineTo(x, H - 14); c.stroke(); c.fillStyle = '#6f93bd'; c.fillText(k + 'τ', x - 5, H - 3); } c.setLineDash([]);
    if (this.hist.length > 1) { c.strokeStyle = '#ffb454'; c.lineWidth = 2; c.beginPath(); this.hist.forEach(([t, v], i) => { const x = 28 + clamp(t / span, 0, 1) * (W - 32), y = H - 14 - v / VM * (H - 24); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); }
    this.set('#rc-st', this.stateNote() || `Voltage <b>${this.V.toFixed(2)} V</b> (${(this.V / VS * 100).toFixed(0)} % of ${VS} V) · pin is <b>${this.target ? 'HIGH: charging' : 'LOW: discharging'}</b> · τ = R·C = <b>${(this.tau()).toFixed(2)} s</b>`);
  }
}

// ------------------------------------------------------------------------------------------------ three switches: slide (SPDT), reed (magnet), tilt
class Swt extends Dev {
  name = 'swt'; st = { slide: 0, reed: 0, tilt: 0 };
  html() {
    return this.box('The three switches', `<div class="io-tools"><button id="sw-slide" class="hold small">Slide switch: LEFT</button><button id="sw-reed" class="hold small">Magnet: away</button><button id="sw-tilt" class="hold small">Tilt: upright</button></div><div id="sw-st" class="io-val">—</div>`, 'Click a button or the part in the 3D view.');
  }
  bind() { for (const k of ['slide', 'reed', 'tilt']) { const b = $('#sw-' + k); if (b) b.onclick = () => { this.st[k] ^= 1; this.show(); }; } this.show(); }
  toggle(k) { this.st[k] ^= 1; this.show(); }
  show() {
    const t = { slide: ['LEFT', 'RIGHT'], reed: ['away', 'near the switch'], tilt: ['upright', 'tilted'] };
    for (const k of ['slide', 'reed', 'tilt']) { const b = $('#sw-' + k); if (b) b.textContent = (k === 'slide' ? 'Slide switch: ' : k === 'reed' ? 'Magnet: ' : 'Tilt: ') + t[k][this.st[k]]; }
    const s = this.item('slide'), r = this.item('reed'), tl = this.item('tilt');
    if (s && s.setPos) s.setPos(this.st.slide); if (r && r.setActive) r.setActive(this.st.reed); if (tl && tl.setTilt) tl.setTilt(this.st.tilt);
  }
  read(pin, mode) {
    const role = this.roleOf(pin); if (!role || !this.on()) return undefined;
    if (role === 'slide') return this.st.slide ? 1 : 0;          // right = 5 V, left = GND
    return this.st[role] ? 0 : 1;                                 // closed to GND, the pull-up gives 1 when open
  }
  tick() { this.set('#sw-st', this.stateNote() || `Slide → pin = <b>${this.st.slide ? 'HIGH (' + (this.app.logicV || 5) + ' V)' : 'LOW (GND)'}</b> · reed: contacts <b>${this.st.reed ? 'closed → LOW' : 'open → HIGH (pull-up)'}</b> · tilt: contacts <b>${this.st.tilt ? 'closed → LOW' : 'open → HIGH (pull-up)'}</b>`); }
}

// ------------------------------------------------------------------------------------------------ 7-segment display (common cathode)
const SEG_FONT = { '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg' };
class Seg7 extends Dev {
  name = 'seg7'; lv = { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, dp: 0 };
  html() { return this.box('7-segment display', '<div id="sg-st" class="io-val">—</div>', 'A segment lights when its pin is HIGH (the common pin is at GND). Each segment has its own 220 Ω resistor.'); }
  reset() { for (const k in this.lv) this.lv[k] = 0; }
  halt() { this.reset(); }
  pin(pin, level) { const r = this.roleOf(pin); if (r && r in this.lv) this.lv[r] = level ? 1 : 0; }
  tick() {
    const o = this.item('a'), ok = this.on(); if (o && o.setLevels) o.setLevels(ok ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'].map(k => this.lv[k]) : null);
    const on = 'abcdefg'.split('').filter(k => this.lv[k]).join(''), ch = Object.keys(SEG_FONT).find(k => SEG_FONT[k] === on);
    this.set('#sg-st', this.stateNote() || `Segments lit: <b>${on || '—'}${this.lv.dp ? ' + dp' : ''}</b>${ch !== undefined ? ` → the digit <b>${ch}</b>` : ''}`);
  }
}

// ------------------------------------------------------------------------------------------------ MAX7219 8x8 matrix
class Max7219 extends Dev {
  name = 'max7219';
  reset() { this.reg = new Array(16).fill(0); this.reg[0x0B] = 0; this.sd = 0; this.log = []; this.dirty = true; }
  constructor(app) { super(app); this.reset(); }
  html() { return this.box('MAX7219 registers', '<canvas id="mx-cv" width="160" height="160" style="width:128px;height:128px;background:#120b0b;border-radius:6px"></canvas><pre id="mx-log" class="io-val" style="white-space:pre;margin:4px 0 0;font-size:11px">—</pre><div id="mx-st" class="io-val"></div>', 'Each message is 16 bits: an address byte and a data byte. Row r is register r + 1; bit 7 of the data is the left LED.'); }
  call(op, a, b) {
    if (!this.on()) return;
    if (op === 'write') {
      this.reg[a & 15] = b & 255;
      this.log.push(`reg 0x${(a & 15).toString(16).toUpperCase().padStart(2, '0')} ← 0x${(b & 255).toString(16).toUpperCase().padStart(2, '0')}  ${({ 9: 'decode mode', 10: 'intensity', 11: 'scan limit', 12: 'shutdown (0 = off, 1 = on)', 15: 'display test' })[a] || (a >= 1 && a <= 8 ? 'row ' + (a - 1) : '')}`);
      if (this.log.length > 7) this.log.shift(); this.dirty = true;
    }
  }
  leds() {
    const R = this.reg, v = new Array(64).fill(0); if (!this.on() || !this.running()) return v;
    if (R[0x0F] & 1) return v.fill(1);
    if (!(R[0x0C] & 1)) return v;                       // shutdown mode
    const lim = (R[0x0B] & 7) + 1, k = 0.3 + 0.7 * ((R[0x0A] & 15) / 15);
    for (let r = 0; r < lim; r++) for (let c = 0; c < 8; c++) v[r * 8 + c] = (R[r + 1] >> (7 - c)) & 1 ? k : 0;
    return v;
  }
  tick() {
    const v = this.leds(), o = this.item('mx'); if (o && o.setMatrix) o.setMatrix(v);
    const cv = $('#mx-cv'); if (cv) { const c = cv.getContext('2d'); c.clearRect(0, 0, 160, 160); v.forEach((k, i) => { c.fillStyle = k ? `rgb(${Math.round(120 + 135 * k)},${Math.round(30 * k)},${Math.round(25 * k)})` : '#3a1b1b'; c.beginPath(); c.arc(10 + (i % 8) * 20, 10 + ((i / 8) | 0) * 20, 7, 0, 7); c.fill(); }); }
    this.set('#mx-log', this.log.length ? this.log.join('\n') : '(no message yet)');
    this.set('#mx-st', this.stateNote() || (this.reg[0x0C] & 1 ? 'Chip: <b>normal operation</b>' : 'Chip: <b>shutdown mode</b> (all LEDs dark until register 0x0C gets 1)'));
  }
}

// ------------------------------------------------------------------------------------------------ ST7735 TFT 128 x 160
const c565 = c => `rgb(${Math.round(((c >> 11) & 31) * 255 / 31)},${Math.round(((c >> 5) & 63) * 255 / 63)},${Math.round((c & 31) * 255 / 31)})`;
class TFT extends Dev {
  name = 'tft';
  constructor(app) { super(app); this.cv = document.createElement('canvas'); this.cv.width = 128; this.cv.height = 160; this.init = false; this.dirty = true; this.clear(); }
  clear() { const c = this.cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 128, 160); }
  reset() { this.init = false; this.clear(); this.dirty = true; }
  html() { return this.box('TFT screen 128 × 160', '<canvas id="tft-cv" width="128" height="160" style="width:128px;height:160px;image-rendering:pixelated;background:#000;border-radius:4px"></canvas><div id="tft-st" class="io-val"></div>', 'The colours are RGB565 (16 bits). The text font is similar to the library’s 5×7 font but not identical.'); }
  call(op, ...a) {
    if (!this.on()) return;
    const c = this.cv.getContext('2d'); this.dirty = true;
    if (op === 'init') { this.init = true; this.clear(); return; }
    if (!this.init) return;
    if (op === 'fill') { c.fillStyle = c565(a[0]); c.fillRect(0, 0, 128, 160); }
    else if (op === 'rect') { const [x, y, w, h, col, filled] = a; c.fillStyle = c.strokeStyle = c565(col); if (filled) c.fillRect(x, y, w, h); else { c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); } }
    else if (op === 'line') { const [x0, y0, x1, y1, col] = a; c.strokeStyle = c565(col); c.lineWidth = 1; c.beginPath(); c.moveTo(x0 + 0.5, y0 + 0.5); c.lineTo(x1 + 0.5, y1 + 0.5); c.stroke(); }
    else if (op === 'circle') { const [x, y, r, col, filled] = a; c.fillStyle = c.strokeStyle = c565(col); c.beginPath(); c.arc(x + 0.5, y + 0.5, r, 0, 7); filled ? c.fill() : c.stroke(); }
    else if (op === 'text') { const [x, y, size, col, str] = a; c.fillStyle = c565(col); c.font = `bold ${8 * size}px monospace`; c.textBaseline = 'top'; String(str).split('').forEach((ch, i) => c.fillText(ch, x + i * 6 * size, y)); }
  }
  tick() {
    const o = this.item('tft'), ok = this.on() && this.running();
    if (this.dirty || this.lastOk !== ok) { if (o && o.setScreen) o.setScreen(ok && this.init ? this.cv : null); const cv = $('#tft-cv'); if (cv) { const c = cv.getContext('2d'); c.clearRect(0, 0, 128, 160); if (ok && this.init) c.drawImage(this.cv, 0, 0); } this.dirty = false; this.lastOk = ok; }
    this.set('#tft-st', this.stateNote() || (this.init ? 'Controller initialised.' : 'Controller not initialised yet (initR() has not run).'));
  }
}

// ------------------------------------------------------------------------------------------------ analog gas sensor (MQ-2 style) and flame sensor, both with AO and DO
class Gas extends Dev {
  name = 'gas'; lvl = 0; thr = 55;
  html() { return this.box('The air around the sensor', `<div class="throw"><label>Smoke / gas</label><input id="gs-l" type="range" min="0" max="100" step="1" value="0"><b id="gs-lv">clean air</b></div><div class="throw"><label>Trimmer (DO threshold)</label><input id="gs-t" type="range" min="5" max="95" step="1" value="${this.thr}"><b id="gs-tv"></b></div><div id="gs-st" class="io-val">—</div>`, 'Typical values for an MQ-2 module: about 0.4 V in clean air and up to about 4 V in a lot of smoke. Your sensor needs its own calibration, and a few minutes of warm-up.'); }
  bind() { const u = () => { $('#gs-lv').textContent = this.lvl ? this.lvl + ' %' : 'clean air'; $('#gs-tv').textContent = (this.volts(this.thr)).toFixed(2) + ' V'; }; $('#gs-l').oninput = e => { this.lvl = +e.target.value; u(); }; $('#gs-t').oninput = e => { this.thr = +e.target.value; u(); }; u(); }
  volts(l = this.lvl) { return 0.4 + 3.6 * Math.pow(l / 100, 0.8); }
  analog(pin) { if (this.roleOf(pin) !== 'ao' || !this.on()) return undefined; const io = this.app.ioFor(pin); return this.volts() * (io.div || 1) + (Math.random() - 0.5) * 0.01; }   // io.div: voltage divider between AO and the pin
  read(pin) { return this.roleOf(pin) === 'do' && this.on() ? (this.lvl > this.thr ? 0 : 1) : undefined; }   // this module: DO is LOW above the trimmer level
  tick() { this.set('#gs-st', this.stateNote() || `AO = <b>${this.volts().toFixed(2)} V</b> · DO = <b>${this.lvl > this.thr ? 'LOW (level above the trimmer setting)' : 'HIGH'}</b>`); }
}
class Flame extends Dev {
  name = 'flame'; lvl = 0; thr = 40;
  html() { return this.box('The flame', `<div class="throw"><label>Infrared from the flame</label><input id="fl-l" type="range" min="0" max="100" step="1" value="0"><b id="fl-lv">no flame</b></div><div class="throw"><label>Trimmer (DO threshold)</label><input id="fl-t" type="range" min="5" max="95" step="1" value="${this.thr}"><b id="fl-tv"></b></div><div id="fl-st" class="io-val">—</div>`, 'Typical behaviour: AO falls as more infrared light reaches the photodiode and DO goes LOW above the trimmer level. Sunlight and lamps also contain infrared.'); }
  bind() { const u = () => { $('#fl-lv').textContent = this.lvl ? this.lvl + ' %' : 'no flame'; $('#fl-tv').textContent = this.thr + ' %'; }; $('#fl-l').oninput = e => { this.lvl = +e.target.value; u(); }; $('#fl-t').oninput = e => { this.thr = +e.target.value; u(); }; u(); }
  volts() { return 4.7 - 4.2 * Math.pow(this.lvl / 100, 0.7); }
  analog(pin) { if (this.roleOf(pin) !== 'ao' || !this.on()) return undefined; const io = this.app.ioFor(pin); return this.volts() * (io.vs || 5) / 5 + (Math.random() - 0.5) * 0.01; }   // io.vs: supply of the module (the output follows it)
  read(pin) { return this.roleOf(pin) === 'do' && this.on() ? (this.lvl > this.thr ? 0 : 1) : undefined; }
  tick() { this.set('#fl-st', this.stateNote() || `AO = <b>${this.volts().toFixed(2)} V</b> · DO = <b>${this.lvl > this.thr ? 'LOW (flame detected)' : 'HIGH (no flame)'}</b>`); }
}

// ------------------------------------------------------------------------------------------------ RFID reader (MFRC522)
const CARDS = { A: [0xDE, 0xAD, 0xBE, 0xEF], B: [0x12, 0x34, 0x56, 0x78] };
class RFID extends Dev {
  name = 'rfid'; card = null; halted = false; fresh = false;
  html() { return this.box('Cards', '<div class="io-tools"><button id="rf-a" class="hold small">Card A near</button><button id="rf-b" class="hold small">Card B near</button><button id="rf-n" class="hold small">Take the card away</button></div><div id="rf-st" class="io-val">—</div>', 'The UIDs here (DE AD BE EF and 12 34 56 78) are made up for the lesson; a real card has its own number.'); }
  bind() { const set = k => { if (this.card !== k) { this.card = k; this.halted = false; this.fresh = !!k; } }; $('#rf-a').onclick = () => set('A'); $('#rf-b').onclick = () => set('B'); $('#rf-n').onclick = () => set(null); }
  reset() { this.halted = false; this.fresh = !!this.card; }
  call(op) {
    if (!this.on()) return op === 'version' ? 0 : false;
    if (op === 'version') return 0x92;
    if (op === 'present') return !!this.card && !this.halted && this.fresh;
    if (op === 'read') { if (!this.card || this.halted) return null; this.fresh = false; return CARDS[this.card].slice(); }
    if (op === 'halt') { this.halted = true; return true; }
    return undefined;
  }
  tick() { this.set('#rf-st', this.stateNote() || (this.card ? `Card <b>${this.card}</b> is in the field (UID ${CARDS[this.card].map(x => x.toString(16).toUpperCase().padStart(2, '0')).join(' ')})${this.halted ? ' · halted: take it away and bring it back to read it again' : ''}` : 'No card in the field.')); }
}

// ------------------------------------------------------------------------------------------------ GPS receiver (NEO-6M)
const nmeaSum = s => { let c = 0; for (const ch of s) c ^= ch.charCodeAt(0); return c.toString(16).toUpperCase().padStart(2, '0'); };
class GPS extends Dev {
  name = 'gps'; sky = 1; t0 = 0; lat = 47.3769; lng = 8.5417;
  html() { return this.box('The sky', '<div class="io-tools"><button id="gp-sky" class="hold small">Open sky: yes</button></div><pre id="gp-nmea" class="io-val" style="white-space:pre-wrap;word-break:break-all;margin:4px 0 0;font-size:10.5px">—</pre><div id="gp-st" class="io-val"></div>', 'The fix comes after 6 s here; a real cold start takes much longer. The position is an example, not a real place you are in.'); }
  bind() { $('#gp-sky').onclick = () => { this.sky ^= 1; this.t0 = performance.now(); $('#gp-sky').textContent = 'Open sky: ' + (this.sky ? 'yes' : 'no (indoors)'); }; }
  reset() { this.t0 = performance.now(); }
  fixed() { return this.on() && this.running() && this.sky && performance.now() - this.t0 > 6000; }
  state() {
    const d = new Date(), fx = this.fixed(), n = fx ? 7 + (Math.floor(performance.now() / 4000) % 3) : this.sky ? 2 : 0;
    return { valid: fx, lat: this.lat, lng: this.lng, sats: n, alt: 408.2, hour: d.getUTCHours(), min: d.getUTCMinutes(), sec: d.getUTCSeconds() };
  }
  call(op) { if (op === 'state') return this.on() ? this.state() : { valid: false, sats: 0 }; return undefined; }
  nmea() {
    const s = this.state(), p = n => String(n).padStart(2, '0'), tm = `${p(s.hour)}${p(s.min)}${p(s.sec)}.00`;
    const dm = (v, w) => { const a = Math.abs(v), d = Math.floor(a), m = (a - d) * 60; return String(d).padStart(w, '0') + m.toFixed(4).padStart(7, '0'); };
    const gga = s.valid ? `GPGGA,${tm},${dm(s.lat, 2)},N,${dm(s.lng, 3)},E,1,${p(s.sats)},1.1,${s.alt.toFixed(1)},M,48.0,M,,` : `GPGGA,${tm},,,,,0,${p(s.sats)},99.99,,,,,,`;
    return `$${gga}*${nmeaSum(gga)}`;
  }
  tick() { if (!this.on() || !this.running()) { this.set('#gp-nmea', '—'); this.set('#gp-st', this.stateNote()); return; } const s = this.state(); this.set('#gp-nmea', this.nmea()); this.set('#gp-st', s.valid ? `Fix: <b>${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}</b> · satellites ${s.sats}` : this.sky ? 'Searching for satellites…' : 'No satellites are received indoors: no fix.'); }
}

// ------------------------------------------------------------------------------------------------ DS3231 real-time clock
class RTC extends Dev {
  name = 'rtc';
  constructor(app) { super(app); this.k = this.keep.rtc ??= { off: Date.UTC(2000, 0, 1) - Date.now(), lost: true }; }
  html() { return this.box('The clock', '<div id="rt-st" class="io-val">—</div><div class="io-tools"><button id="rt-lose" class="hold small">Remove the coin cell and power (clock stops)</button></div>', 'After a power loss without a battery the DS3231 sets its “oscillator stopped” flag; the time is then not valid until you set it.'); }
  bind() { $('#rt-lose').onclick = () => { this.k.lost = true; this.k.off = Date.UTC(2000, 0, 1) - Date.now(); }; }
  now() { return new Date(Date.now() + this.k.off); }
  call(op) {
    if (!this.on()) return op === 'begin' ? false : undefined;
    if (op === 'begin') return true;
    if (op === 'lostPower') return this.k.lost;
    if (op === 'adjust') { const l = new Date(); this.k.off = Date.UTC(l.getFullYear(), l.getMonth(), l.getDate(), l.getHours(), l.getMinutes(), l.getSeconds()) - Date.now(); this.k.lost = false; return true; }
    if (op === 'now') { const d = this.now(); return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds() }; }
    if (op === 'temp') return 24.25;
    return undefined;
  }
  tick() { const d = this.now(), p = n => String(n).padStart(2, '0'); this.set('#rt-st', `Clock: <b>${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}</b> · oscillator-stopped flag: <b>${this.k.lost ? 'set (time not valid)' : 'clear'}</b>`); }
}

// ------------------------------------------------------------------------------------------------ A4988 driver and NEMA 17 motor
class A4988 extends Dev {
  name = 'a4988'; steps = 0; dirv = 0; step = 0; en = 0; sup = 0; lost = 0;
  bind() { const b = $('#ad-sup'); if (b) b.onclick = () => { this.sup ^= 1; }; }
  html() { return this.box('Driver and motor', '<div class="io-tools"><button id="ad-sup" class="hold small">Motor supply 12 V: OFF</button></div><div id="ad-st" class="io-val">—</div>', 'A NEMA 17 motor with 1.8° per step makes 200 full steps per turn. The MS pins are left open here, so every pulse is one full step.'); }
  reset() { this.steps = 0; this.lost = 0; }
  pin(pin, level) {
    const r = this.roleOf(pin); if (!r) return;
    if (r === 'dir') this.dirv = level; if (r === 'en') this.en = level;
    if (r === 'step') { if (level && !this.step && this.on() && !this.en) { if (this.sup) this.steps += this.dirv ? 1 : -1; else this.lost++; } this.step = level; }
  }
  tick() {
    const m = this.item('motor'), ang = this.steps * 1.8; if (m && m.setAngle) m.setAngle(ang);
    const sb = $('#ad-sup'); if (sb) sb.textContent = 'Motor supply 12 V: ' + (this.sup ? 'ON' : 'OFF');
    this.set('#ad-st', this.stateNote() || (!this.sup && this.lost ? `The driver got <b>${this.lost}</b> step pulses but the <b>motor supply is OFF</b>: the shaft does not move.` : null) || `Steps: <b>${this.steps}</b> · angle <b>${(((ang % 360) + 360) % 360).toFixed(1)}°</b> · turns <b>${(this.steps / 200).toFixed(2)}</b> · direction <b>${this.dirv ? 'DIR = HIGH' : 'DIR = LOW'}</b>${this.en ? ' · <b class="lo">disabled (ENABLE HIGH)</b>' : ''}`);
  }
}

// ------------------------------------------------------------------------------------------------ microSD card
class SD extends Dev {
  name = 'sd';
  constructor(app) { super(app); this.k = this.keep.sd ??= { files: {}, inserted: true }; }
  html() { return this.box('The card', '<div class="io-tools"><button id="sd-ins" class="hold small">Card: inserted</button><button id="sd-fmt" class="hold small">Erase the card</button></div><pre id="sd-fs" class="io-val" style="white-space:pre-wrap;margin:4px 0 0;max-height:150px;overflow:auto;font-size:11px">—</pre>', 'A real card must be formatted FAT16 or FAT32 for this library.'); }
  bind() { $('#sd-ins').onclick = () => { this.k.inserted = !this.k.inserted; }; $('#sd-fmt').onclick = () => { this.k.files = {}; }; }
  call(op, name, text) {
    if (!this.on()) return op === 'begin' ? false : undefined;
    if (op === 'begin') return this.k.inserted;
    if (!this.k.inserted) return op === 'read' ? '' : false;
    const F = this.k.files, n = String(name || '').toUpperCase();
    if (op === 'append') { F[n] = (F[n] || '') + text; return true; }
    if (op === 'write') { F[n] = text; return true; }
    if (op === 'read') return F[n] ?? '';
    if (op === 'exists') return n in F;
    if (op === 'remove') { delete F[n]; return true; }
    return undefined;
  }
  tick() {
    const b = $('#sd-ins'); if (b) b.textContent = 'Card: ' + (this.k.inserted ? 'inserted' : 'removed');
    const names = Object.keys(this.k.files); this.set('#sd-fs', !this.k.inserted ? '(no card)' : names.length ? names.map(n => `${n}  ${this.k.files[n].length} bytes\n${this.k.files[n].split('\n').slice(-6).join('\n')}`).join('\n') : '(the card is empty)');
  }
}

// ------------------------------------------------------------------------------------------------ the other Arduino (board B) on a serial cable
class Peer extends Dev {
  name = 'peer'; n = 0; inbox = []; outbox = []; log = []; swap = 0; baudBad = 0; next = 0;
  html() { return this.box('Board B', '<div class="io-tools"><button id="pe-swap" class="hold small">Wires crossed correctly</button><button id="pe-baud" class="hold small">Baud rates: both 9600</button></div><pre id="pe-log" class="io-val" style="white-space:pre-wrap;margin:4px 0 0;max-height:130px;overflow:auto;font-size:11px">—</pre>', 'Board B runs: wait for a line, then send back “ACK” and the same number.'); }
  bind() { $('#pe-swap').onclick = () => { this.swap ^= 1; $('#pe-swap').textContent = this.swap ? 'TX and RX not crossed (wrong)' : 'Wires crossed correctly'; }; $('#pe-baud').onclick = () => { this.baudBad ^= 1; $('#pe-baud').textContent = this.baudBad ? 'Board B uses 4800 baud (wrong)' : 'Baud rates: both 9600'; }; }
  reset() { this.inbox = []; this.outbox = []; this.log = []; this.next = 0; }
  say(s) { this.log.push(s); if (this.log.length > 14) this.log.shift(); }
  deliver(text) {                       // text sent by board A arrives at board B
    if (this.swap) return;
    if (this.baudBad) { this.say('B received garbage: ' + text.replace(/[\x20-\x7e]/g, c => String.fromCharCode(0x2591))); return; }
    this.say('B got: ' + text.trim());
    const m = /(\d+)/.exec(text); setTimeout(() => { if (!this.running()) return; const r = 'ACK ' + (m ? m[1] : '?') + '\n'; this.say('B sent: ' + r.trim()); if (!this.swap && !this.baudBad) this.outbox.push(...r); else if (this.baudBad) this.outbox.push(...r.replace(/[a-zA-Z0-9]/g, '?')); }, 120);
  }
  call(op, a) {
    if (!this.on()) return op === 'avail' ? 0 : undefined;
    if (op === 'write') { this.deliver(String(a)); return; }
    if (op === 'avail') return this.outbox.length;
    if (op === 'read') return this.outbox.shift();
    return undefined;
  }
  tick() { this.set('#pe-log', this.stateNote() || this.log.join('\n') || '(nothing yet)'); }
}

// ------------------------------------------------------------------------------------------------ HC-05 and the phone
class HC05 extends Dev {
  name = 'hc05'; paired = false; inbox = []; log = [];
  html() { return this.box('Phone', '<div class="io-tools"><button id="bt-pair" class="hold small">Pair (PIN 1234)</button></div><pre id="bt-log" class="io-val" style="white-space:pre-wrap;margin:4px 0 0;max-height:110px;overflow:auto;font-size:11px">—</pre><div class="io-tools"><input id="bt-in" type="text" maxlength="20" placeholder="type here" style="flex:1"><button id="bt-send" class="hold small">Send</button><button id="bt-1" class="hold small">1</button><button id="bt-0" class="hold small">0</button></div>', 'A terminal app on the phone sends what you type as characters. The module’s default PIN is usually 1234; check yours.'); }
  bind() {
    $('#bt-pair').onclick = () => { this.paired = !this.paired; this.say(this.paired ? '[phone] connected to HC-05' : '[phone] disconnected'); };
    const send = t => { if (!this.paired || !this.running() || !this.on()) { this.say('[phone] not connected: nothing sent'); return; } this.say('[phone → HC-05] ' + t); this.inbox.push(...t); };
    $('#bt-send').onclick = () => { const e = $('#bt-in'); send(e.value); e.value = ''; }; $('#bt-1').onclick = () => send('1'); $('#bt-0').onclick = () => send('0');
  }
  say(s) { this.log.push(s); if (this.log.length > 10) this.log.shift(); }
  reset() { this.inbox = []; }
  call(op, a) {
    if (!this.on()) return op === 'avail' ? 0 : undefined;
    if (op === 'avail') return this.inbox.length;
    if (op === 'read') return this.inbox.shift();
    if (op === 'write') { if (this.paired) this.say('[Arduino → phone] ' + String(a).trim()); return; }
    return undefined;
  }
  tick() { const b = $('#bt-pair'); if (b) b.textContent = this.paired ? 'Disconnect the phone' : 'Pair (PIN 1234)'; this.set('#bt-log', this.stateNote() || this.log.join('\n') || '(not connected)'); }
}

// ------------------------------------------------------------------------------------------------ nRF24L01 and a receiving node
class NRF extends Dev {
  name = 'nrf'; rxCh = 76; rxAddr = '00001'; rxOn = 1; got = []; tx = { ch: 76, addr: '00001' };
  html() { return this.box('Node B (receiver)', `<div class="throw"><label>Channel</label><input id="nr-ch" type="number" min="0" max="125" value="76" style="width:70px"></div><div class="throw"><label>Address</label><select id="nr-ad"><option>00001</option><option>00002</option></select></div><div class="io-tools"><button id="nr-on" class="hold small">Node B: on</button></div><pre id="nr-log" class="io-val" style="white-space:pre-wrap;margin:4px 0 0;max-height:110px;overflow:auto;font-size:11px">—</pre>`, 'A packet is only heard when the channel and the address match.'); }
  bind() { $('#nr-ch').onchange = e => { this.rxCh = clamp(+e.target.value || 0, 0, 125); }; $('#nr-ad').onchange = e => { this.rxAddr = e.target.value; }; $('#nr-on').onclick = () => { this.rxOn ^= 1; $('#nr-on').textContent = 'Node B: ' + (this.rxOn ? 'on' : 'off'); }; }
  reset() { this.got = []; }
  call(op, a, b) {
    if (!this.on()) return op === 'begin' ? false : false;
    if (op === 'begin') return true;
    if (op === 'config') { this.tx = { ch: a, addr: b }; return true; }
    if (op === 'write') { const ok = !!this.rxOn && this.rxCh === this.tx.ch && this.rxAddr === this.tx.addr; if (ok) { this.got.push(String(a)); if (this.got.length > 8) this.got.shift(); } return ok; }
    return undefined;
  }
  tick() { this.set('#nr-log', this.stateNote() || (this.got.length ? this.got.map(s => 'B received: ' + s).join('\n') : 'B has received nothing.')); }
}

// ------------------------------------------------------------------------------------------------ push button on an interrupt pin, with optional contact bounce
class IRQ extends Dev {
  name = 'irq'; bounce = 0;
  wired() { const io = Object.values((this.L && this.L.io) || {}).find(x => x.kind === 'button'); return !!io && this.app.wired(io); }
  html() { return this.box('The button’s contacts', '<div class="io-tools"><button id="iq-b" class="hold small">Contact bounce: off</button></div><div id="iq-st" class="io-val">—</div>', 'A real push button does not close cleanly: the contacts bounce for a few milliseconds, which can fire an interrupt several times for one press.'); }
  bind() { $('#iq-b').onclick = () => { this.bounce ^= 1; $('#iq-b').textContent = 'Contact bounce: ' + (this.bounce ? 'ON (real switches)' : 'off'); }; }
  button(down) {
    const pin = Object.keys(this.L.io).find(p => this.L.io[p].kind === 'button'); if (!pin || !this.on() || !this.running()) return;
    const edge = l => this.app.sim.edge(pin, l);
    if (!down) { if (this.bounce) { edge(1); setTimeout(() => edge(0), 1); setTimeout(() => edge(1), 2); } else edge(1); return; }
    edge(0);
    if (this.bounce) { const n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) { setTimeout(() => edge(1), 1 + 2 * i); setTimeout(() => edge(0), 2 + 2 * i); } }
  }
  tick() { this.set('#iq-st', this.stateNote() || 'Press and release the button (below or in the 3D view).'); }
}

// ------------------------------------------------------------------------------------------------ EEPROM (non-volatile, kept in the browser)
class EEPROM extends Dev {
  name = 'eeprom';
  constructor(app) {
    super(app);
    if (!this.keep.ee) { let a = null; try { a = JSON.parse(localStorage.getItem('uno3_eeprom') || 'null'); } catch (e) { a = null; } this.keep.ee = Array.isArray(a) && a.length === 1024 ? a : new Array(1024).fill(255); this.keep.wr = 0; }
  }
  html() { return this.box('EEPROM (1024 bytes)', '<pre id="ee-hex" class="io-val" style="white-space:pre;margin:0;font-size:11px">—</pre><div id="ee-st" class="io-val"></div><div class="io-tools"><button id="ee-clr" class="hold small">Erase (all bytes 255)</button></div>', 'The contents stay after you stop the sketch, press Run again or reload this page (stored in your browser, like the chip keeps them without power).'); }
  bind() { $('#ee-clr').onclick = () => { this.keep.ee.fill(255); this.save(); }; }
  save() { try { localStorage.setItem('uno3_eeprom', JSON.stringify(this.keep.ee)); } catch (e) { /* storage blocked */ } }
  call(op, a, b) {
    const E = this.keep.ee; a = clamp(a | 0, 0, 1023);
    if (op === 'read') return E[a];
    if (op === 'write') { E[a] = b & 255; this.keep.wr++; this.save(); return; }
    if (op === 'update') { if (E[a] !== (b & 255)) { E[a] = b & 255; this.keep.wr++; this.save(); } return; }
    return undefined;
  }
  tick() {
    const E = this.keep.ee; this.set('#ee-hex', [0, 8, 16].map(r => `${r.toString(16).padStart(3, '0')}: ` + E.slice(r, r + 8).map(x => x.toString(16).toUpperCase().padStart(2, '0')).join(' ')).join('\n'));
    this.set('#ee-st', `Write cycles used in this browser session: <b>${this.keep.wr}</b> (the ATmega328P EEPROM is specified for 100 000 write/erase cycles per cell).`);
  }
}

// ------------------------------------------------------------------------------------------------ a motor or fan on a MOSFET, driven by PWM
class Fan extends Dev {
  name = 'fan'; duty = 0; speed = 0;
  html() { return this.box('Fan / pump motor', '<div id="fn-st" class="io-val">—</div>', 'A small DC motor only starts above a minimum voltage: here it starts at about 25 % duty. (Typical behaviour, not a measurement.)'); }
  reset() { this.duty = 0; }
  halt() { this.duty = 0; }
  pin(pin, level) { if (this.roleOf(pin) === 'gate') this.duty = level ? 1 : 0; }
  pwm(pin, duty) { if (this.roleOf(pin) === 'gate') this.duty = duty; }
  tick(dt = 0.016) {
    const m = this.item('motor'), ok = this.on() && this.running(), target = ok && this.duty >= 0.25 ? this.duty : 0;
    if (m) { m.speed = (m.speed || 0) + (target - (m.speed || 0)) * Math.min(1, dt / 0.35); if (m.spin) m.spin(dt); }
    this.set('#fn-st', this.stateNote() || `Gate duty <b>${Math.round(this.duty * 100)} %</b> → average motor voltage ≈ <b>${(6 * this.duty).toFixed(1)} V</b> (6 V pack) · ${target ? 'spinning' : 'stopped'}`);
  }
}

// ------------------------------------------------------------------------------------------------ classic Bluetooth built into the ESP32 (BluetoothSerial) and the phone
class BTC extends HC05 {
  wired() { return true; }
  on() { return this.app.board.powered; }
  html() { return this.box('Phone', '<div class="io-tools"><button id="bt-pair" class="hold small">Pair with “ESP32-Lab”</button></div><pre id="bt-log" class="io-val" style="white-space:pre-wrap;margin:4px 0 0;max-height:110px;overflow:auto;font-size:11px">—</pre><div class="io-tools"><input id="bt-in" type="text" maxlength="20" placeholder="type here" style="flex:1"><button id="bt-send" class="hold small">Send</button><button id="bt-1" class="hold small">1</button><button id="bt-0" class="hold small">0</button></div>', 'The ESP32 has classic Bluetooth on the chip: no extra module. Pairing is done in the phone’s Bluetooth settings; the app is a Bluetooth serial terminal (Android).'); }
  tick() { const b = $('#bt-pair'); if (b) b.textContent = this.paired ? 'Disconnect the phone' : 'Pair with “ESP32-Lab”'; this.set('#bt-log', !this.app.board.powered ? 'USB is not plugged in — the board has no power.' : !this.running() ? 'Press <b>▶ Run</b> (the name “ESP32-Lab” is only visible while the sketch runs).' : this.log.join('\n') || '(not connected)'); }
}

// ------------------------------------------------------------------------------------------------ ESP-NOW: a second ESP32 that receives the packets
class EspNow extends Dev {
  name = 'espnow'; rxOn = 1; macOk = 1; got = []; inited = false; peers = [];
  wired() { return true; }
  on() { return this.app.board.powered; }
  html() { return this.box('Receiver board', '<div class="io-tools"><button id="en-on" class="hold small">Receiver: on</button><button id="en-mac" class="hold small">Receiver MAC: matches</button></div><pre id="en-log" class="io-val" style="white-space:pre-wrap;margin:4px 0 0;max-height:110px;overflow:auto;font-size:11px">—</pre>', 'ESP-NOW sends small packets (up to 250 bytes) straight from board to board, with no router. The sender needs the receiver’s MAC address; the MAC here is made up.'); }
  bind() { $('#en-on').onclick = () => { this.rxOn ^= 1; $('#en-on').textContent = 'Receiver: ' + (this.rxOn ? 'on' : 'off'); }; $('#en-mac').onclick = () => { this.macOk ^= 1; $('#en-mac').textContent = 'Receiver MAC: ' + (this.macOk ? 'matches' : 'is different (wrong address in the sketch)'); }; }
  reset() { this.got = []; this.inited = false; this.peers = []; }
  call(op, a, b) {
    if (!this.on()) return false;
    if (op === 'init') { this.inited = true; return true; }
    if (op === 'addPeer') { this.peers.push(a); return true; }
    if (op === 'send') { if (!this.inited || !this.peers.includes(a)) return false; const ok = !!this.rxOn && !!this.macOk; if (ok) { this.got.push(String(b)); if (this.got.length > 8) this.got.shift(); } return ok; }
    return undefined;
  }
  tick() { this.set('#en-log', !this.on() ? 'USB is not plugged in — the board has no power.' : this.got.length ? this.got.map(s => 'Receiver got: ' + s).join('\n') : 'The receiver has got nothing.'); }
}

// ------------------------------------------------------------------------------------------------ Preferences (flash key-value store, kept in the browser)
class Prefs extends Dev {
  name = 'prefs';
  constructor(app) { super(app); if (!this.keep.pf) { let o = null; try { o = JSON.parse(localStorage.getItem('e32_prefs') || 'null'); } catch (e) { o = null; } this.keep.pf = o && typeof o === 'object' ? o : {}; } }
  wired() { return true; }
  html() { return this.box('Preferences (flash, namespace “lab”)', '<pre id="pf-v" class="io-val" style="white-space:pre;margin:0">—</pre><div class="io-tools"><button id="pf-clr" class="hold small">Erase the namespace</button></div>', 'The values stay after you stop the sketch or reload the page (stored in your browser, like the ESP32 keeps them in flash).'); }
  bind() { $('#pf-clr').onclick = () => { this.keep.pf = {}; this.save(); }; }
  save() { try { localStorage.setItem('e32_prefs', JSON.stringify(this.keep.pf)); } catch (e) { /* storage blocked */ } }
  call(op, k, v) { if (op === 'get') return k in this.keep.pf ? this.keep.pf[k] : v; if (op === 'put') { this.keep.pf[k] = v; this.save(); } return undefined; }
  tick() { const k = Object.keys(this.keep.pf); this.set('#pf-v', k.length ? k.map(x => x + ' = ' + this.keep.pf[x]).join('\n') : '(the namespace is empty)'); }
}

const REG = { btc: BTC, espnow: EspNow, prefs: Prefs, abuz: ABuz, rc: RC, swt: Swt, seg7: Seg7, max7219: Max7219, tft: TFT, gas: Gas, flame: Flame, rfid: RFID, gps: GPS, rtc: RTC, a4988: A4988, sd: SD, peer: Peer, hc05: HC05, nrf: NRF, irq: IRQ, eeprom: EEPROM, fan: Fan };
export function makeDevice(name, app) { const C = REG[name]; return C ? new C(app) : null; }

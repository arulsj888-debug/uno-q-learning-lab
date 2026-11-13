// Browser-only additions of slot b: 3D models (12 V solenoid, 12 V barrel-jack supply, 1.54 inch e-paper module), info cards and two simulated devices
// (solenoid on a MOSFET, e-paper panel). Imported by ui.js, never by the node check tools.
import * as THREE from 'three';
import { BREAKOUTS, HW_INFO } from '../hardware.js';
import { DEVICE_REG, Dev } from '../devices.js';

const $ = s => document.querySelector(s);
const mat = (color, rough = 0.5, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const BOX = (g, w, h, d, x, y, z, color, rough = 0.5, metal = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, rough, metal)); m.position.set(x, y, z); g.add(m); return m; };
const CYLX = (g, r, len, x, y, z, color, rough = 0.5, metal = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 32), mat(color, rough, metal)); m.rotation.z = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
const hideBoard = g => g.children.forEach(c => { c.visible = false; });   // the generic breakout PCB and its silkscreen are not wanted for a bare solenoid

// ---------------------------------------------------------------- 12 V push-pull (open-frame) solenoid: a coil, a steel frame, a plunger that is pulled in when the coil is energised
BREAKOUTS.mod_sol12 = { title: 'SOLENOID', names: ['W1', 'W2'], w: 34, d: 44, color: 0x222222, edge: 0x111111, extras(g, o) {
  hideBoard(g);
  const y = 10.5, STROKE = 5.5;                         // stroke 5.5 mm: the DigiKey listing of the Adafruit 412 small push-pull solenoid
  CYLX(g, 7.4, 20, 0, y, -6, 0x241b14, 0.7);            // coil winding under black tape
  CYLX(g, 8.2, 1.6, -10.4, y, -6, 0xb87333, 0.4, 0.8); CYLX(g, 8.2, 1.6, 10.4, y, -6, 0xb87333, 0.4, 0.8);   // copper-coloured end flanges
  BOX(g, 26, 1.4, 20, 0, y + 9.4, -6, 0x8e9196, 0.35, 0.8); BOX(g, 26, 1.4, 20, 0, y - 9.4, -6, 0x8e9196, 0.35, 0.8);   // steel frame plates
  BOX(g, 1.6, 20, 20, 13.4, y, -6, 0x8e9196, 0.35, 0.8);                                                              // rear plate of the frame
  const pl = o.plunger = new THREE.Group(); pl.position.set(0, y, -6); g.add(pl);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 34, 32), mat(0xc9ccd1, 0.25, 0.9)); rod.rotation.z = Math.PI / 2; rod.position.x = -4; pl.add(rod);
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 3, 32), mat(0xb9bcc2, 0.3, 0.85)); eye.rotation.z = Math.PI / 2; eye.position.x = -22.5; pl.add(eye);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.4, 20), mat(0x0a0a0b, 0.8)); hole.rotation.x = Math.PI / 2; hole.position.x = -22.5; pl.add(hole);
  o.plRest = 0; o.plIn = STROKE;
  o.setPlunger = t => { pl.position.x = o.plRest + (o.plIn) * Math.max(0, Math.min(1, t)); };   // t = 0 released (spring), 1 pulled in
  o.setPlunger(0);
  // two flying leads from the coil to the two-pin connector
  const zf = 44 / 2 - 1.8;
  for (const sx of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(sx * 4, y - 6, -3), new THREE.Vector3(sx * 4.5, 4.2, 4), new THREE.Vector3(sx * 2.4, 4.4, zf - 6), new THREE.Vector3(sx * 1.27, 5.2, zf)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.55, 8), mat(0x151515, 0.6)));
  }
} };

// ---------------------------------------------------------------- 12 V DC supply on a barrel-jack breakout (a regulated wall adapter plugs into the jack)
BREAKOUTS.mod_psu12 = { title: '12 V DC IN', names: ['POS', 'NEG'], w: 30, d: 30, color: 0x1a7a3c, edge: 0x0f4a24, extras(g) {
  BOX(g, 14, 11, 14, -3, 8.2, -7.5, 0x18181a, 0.5);                       // barrel jack housing
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 14.4, 24), mat(0x050505, 0.8)); barrel.rotation.x = Math.PI / 2; barrel.position.set(-3, 8.4, -7.6); g.add(barrel);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 12, 16), mat(0xb9bcc2, 0.3, 0.85)); pin.rotation.x = Math.PI / 2; pin.position.set(-3, 8.4, -7.2); g.add(pin);
  BOX(g, 9, 9, 6, 9, 7.6, 3, 0x1f6fd0, 0.4);                              // two-way screw terminal
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 8, 24), mat(0x161b3a, 0.5)); cap.position.set(-9, 6.5, 6); g.add(cap);
} };

// ---------------------------------------------------------------- 1.54 inch e-paper module: panel on a small driver board; the screen texture is the 200 x 200 picture that is on the panel
BREAKOUTS.mod_epd154 = { title: 'E-PAPER 1.54"', names: ['VCC', 'GND', 'DIN', 'CLK', 'CS', 'DC', 'RST', 'BUSY'], w: 38, d: 52, color: 0x1d4fb8, edge: 0x14264a, extras(g, o) {
  BOX(g, 33, 1.2, 38, 0, 4.2, -5, 0xe8e8e2, 0.4);                         // glass of the panel
  BOX(g, 31, 0.5, 34.5, 0, 5.0, -4, 0xcfcfc6, 0.5);                       // white frame around the active area
  o.cv = document.createElement('canvas'); o.cv.width = 200; o.cv.height = 200;
  o.tex = new THREE.CanvasTexture(o.cv); o.tex.colorSpace = THREE.SRGBColorSpace; o.tex.magFilter = THREE.NearestFilter;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(27.6, 27.6), new THREE.MeshStandardMaterial({ map: o.tex, roughness: 0.85 })); scr.rotation.x = -Math.PI / 2; scr.position.set(0, 5.4, -4); g.add(scr);
  o.setScreen = cv => { const c = o.cv.getContext('2d'); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#d8d7cc'; c.fillRect(0, 0, 200, 200); if (cv) { c.globalCompositeOperation = 'multiply'; c.drawImage(cv, 0, 0); c.globalCompositeOperation = 'source-over'; } o.tex.needsUpdate = true; };
  o.setScreen(null);
  BOX(g, 12, 0.5, 6, 0, 4.0, 14, 0xc8a24a, 0.4, 0.6);                      // flexible cable (FPC) between the panel and the board
  BOX(g, 5, 1, 5, -12, 3.8, 18, 0x151517, 0.5);
} };

// ---------------------------------------------------------------- info cards (the text shown when the part is clicked)
Object.assign(HW_INFO, {
  mod_sol12: {
    name: '12 V push-pull (open-frame) solenoid', tag: 'A coil that pulls a steel plunger in',
    summary: 'A coil of wire inside a steel frame. While current flows, the magnetic field pulls the plunger into the coil; a spring (or the load) pushes it back out when the current stops. It is a coil, so it must be switched by a transistor or MOSFET with a flyback diode, from its own supply: a microcontroller pin cannot supply its current.',
    points: [
      'Example values for the small 12 V push-pull solenoid sold by Adafruit (part 412): 12 VDC, about 250 to 300 mA, coil resistance 40 to 48 ohm, stroke 5.50 mm. The retailer listings disagree with each other, so read the sheet of YOUR part.',
      'Ohm’s law check (typical): 12 V ÷ 40 Ω = 0.30 A. A lower voltage gives a weaker and slower pull.',
      'Such solenoids are usually rated for intermittent duty (the part above is listed as intermittent duty): a short pulse, then a rest. Holding the coil on warms it. The allowed duty cycle is on the datasheet of your part.',
      'A solenoid valve is a solenoid coil that moves the plug of a valve: the same drive circuit applies, but its coil may be 12 V or 24 V and take more current. Read the label.',
      'A coil is an inductor: when the current is cut, it forces a voltage spike. A flyback diode across the coil (band towards the supply +) gives it a path.',
    ],
    src: 'Retailer listings of Adafruit 412 / 413 (The Pi Hut, DigiKey, Element14); Vishay 1N4001-1N4007 datasheet',
  },
  mod_psu12: {
    name: 'DC barrel-jack breakout (12 V supply)', tag: 'A separate supply for the load',
    summary: 'A regulated 12 V wall adapter plugs into the jack; the screw terminal gives POS and NEG. The load (here a solenoid) gets its current from this supply, never from the microcontroller board.',
    points: [
      'Choose an adapter whose current rating is above what the load needs. Adapters differ in plug size and centre polarity: check the markings of yours.',
      'The NEG of this supply is joined to the GND of the board (common ground), otherwise the gate signal has no reference.',
      'Never connect the POS of a 12 V supply to a pin of the microcontroller board.',
    ],
    src: 'General practice; no single datasheet',
  },
  mod_epd154: {
    name: '1.54 inch e-paper display module (200 × 200)', tag: 'A black-and-white screen that keeps its picture without power',
    summary: 'An electrophoretic panel: tiny charged black and white particles are moved by an electric field. Power is needed only to change the picture. The module has an SPI interface and three control pins: DC (data or command), RST (reset) and BUSY (high while the panel is refreshing).',
    points: [
      'Resolution 200 × 200, black and white (2 levels), SPI mode 0. Waveshare manual for the 1.54 inch module.',
      'Supply 3.3 V or 5 V on the Waveshare driver board V2.1 and later (its manual). For a bare panel the GxEPD2 library page says the panel supply and data lines are 3.3 V.',
      'Waveshare manual: a full refresh takes about 2 s (typical, from experiment) and flickers; the refresh interval must be at least 180 s; refresh at least once every 24 h; do not leave the panel powered for long, put it to sleep or switch it off.',
      'Partial refresh is quicker but is not meant to run forever: after several partial refreshes do a full refresh, otherwise the panel can become abnormal (the manual gives no exact number). Data sent while the panel sleeps is ignored: initialise it again first.',
      'Operating temperature 0 to 50 °C (Waveshare). The flat cable is fragile.',
      'Controller: Waveshare’s page does not name it; the GxEPD2 library lists the Good Display GDEH0154D67 (1.54 inch, 200 × 200) with an SSD1681 controller. Check which panel your module uses.',
    ],
    src: 'Waveshare 1.54inch e-Paper Module manual; GxEPD2 library README (ZinggJM)',
  },
});

// ---------------------------------------------------------------- simulated solenoid on a MOSFET (io role "gate")
class Solenoid extends Dev {
  name = 'bsol'; lv = 0; p = 0; onMs = 0; allMs = 0; win = [];
  html() {
    return this.box('Solenoid (12 V, push-pull)', '<div id="bs-st" class="io-val">—</div><div id="bs-duty" class="io-val">—</div>',
      'Example coil: 40 Ω at 12 V → about 0.30 A (typical, check your part). The plunger moves faster in a real solenoid than in this animation.');
  }
  reset() { this.lv = 0; this.p = 0; this.onMs = 0; this.allMs = 0; }
  halt() { this.lv = 0; }
  pin(pin, level) { if (this.roleOf(pin) === 'gate') this.lv = level ? 1 : 0; }
  tick(dt = 0.016) {
    const ok = this.on() && this.running(), energised = ok && !!this.lv;
    this.p += ((energised ? 1 : 0) - this.p) * Math.min(1, dt / 0.06);
    const sol = this.item('gate'); if (sol && sol.setPlunger) sol.setPlunger(this.p);
    if (ok) { this.allMs += dt * 1000; if (energised) this.onMs += dt * 1000; }
    this.set('#bs-st', this.stateNote() || (energised
      ? '<b class="hi">Gate HIGH</b> → MOSFET on → 12 V across the coil → about <b>0.30 A</b> → plunger <b>pulled in</b>'
      : '<b class="lo">Gate LOW</b> → MOSFET off → no current → spring pushes the plunger <b>out</b> (the flyback diode carries the switch-off spike)'));
    this.set('#bs-duty', ok && this.allMs > 500 ? `On for <b>${(100 * this.onMs / this.allMs).toFixed(0)} %</b> of the ${(this.allMs / 1000).toFixed(0)} s since you pressed Run (the duty cycle).` : '');
  }
}

// ---------------------------------------------------------------- simulated 1.54 inch e-paper panel (200 x 200, black / white)
const W = 200, FULL_MS = 2000, PART_MS = 300;   // full refresh 2 s: Waveshare manual (typical). Partial 0.3 s: an ASSUMPTION of this simulator, not a datasheet value.
class EPaper extends Dev {
  name = 'bepd';
  constructor(app) {
    super(app);
    const k = this.keep.bepd ??= { shown: new Uint8Array(W * W).fill(1), ghost: new Float32Array(W * W), partials: 0, fulls: 0, drawn: false };
    this.k = k;
    this.buf = document.createElement('canvas'); this.buf.width = this.buf.height = W;
    this.out = document.createElement('canvas'); this.out.width = this.out.height = W;
    this.inited = false; this.asleep = false; this.busyUntil = 0; this.kind = ''; this.t0 = 0; this.next = null; this.win = null; this.dirty = true; this.msg = '';
    this.clearBuf();
  }
  clearBuf() { const c = this.buf.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, W, W); }
  reset() { this.inited = false; this.asleep = false; this.clearBuf(); this.msg = ''; this.dirty = true; }
  busy() { return performance.now() < this.busyUntil; }
  html() {
    return this.box('E-paper 200 × 200', '<canvas id="bepd-cv" width="200" height="200" style="width:200px;height:200px;image-rendering:pixelated;background:#d8d7cc;border-radius:2px"></canvas><div id="bepd-st" class="io-val"></div><div id="bepd-n" class="io-val"></div>',
      'Full refresh 2 s: Waveshare manual (typical). Partial refresh 0.3 s and the ghosting shown after partial refreshes are only illustrations of this simulator; real values depend on the panel.');
  }
  read(pin) { if (this.roleOf(pin) === 'busy') return this.on() && this.busy() ? 1 : 0; return undefined; }
  call(op, ...a) {
    const c = this.buf.getContext('2d');
    if (op === 'init') { this.inited = true; this.asleep = false; this.msg = ''; return; }
    if (op === 'sleep') { this.asleep = true; return; }
    if (op === 'clear') { this.clearBuf(); return; }
    if (op === 'text') { const [x, y, str, px = 16] = a; c.fillStyle = '#000'; c.font = `bold ${px}px monospace`; c.textBaseline = 'alphabetic'; c.fillText(String(str), x, y); return; }
    if (op === 'erase') { const [x, y, w, h] = a; c.fillStyle = '#fff'; c.fillRect(x, y, w, h); return; }
    if (op === 'rect') { const [x, y, w, h, filled] = a; c.fillStyle = c.strokeStyle = '#000'; c.lineWidth = 1; if (filled) c.fillRect(x, y, w, h); else c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); return; }
    if (op === 'circle') { const [x, y, r, filled] = a; c.fillStyle = c.strokeStyle = '#000'; c.beginPath(); c.arc(x + 0.5, y + 0.5, r, 0, 7); filled ? c.fill() : c.stroke(); return; }
    if (op === 'full' || op === 'partial') {
      if (!this.on()) return;
      if (!this.inited) { this.msg = 'The panel was not initialised: the refresh is ignored.'; return; }
      if (this.asleep) { this.msg = 'The panel is asleep: image data sent in sleep mode is ignored (Waveshare manual). Initialise it again first.'; return; }
      if (this.busy()) return;
      const [x = 0, y = 0, w = W, h = W] = a;
      const d = c.getImageData(0, 0, W, W).data, next = new Uint8Array(W * W);
      for (let i = 0; i < W * W; i++) next[i] = d[i * 4] < 128 ? 0 : 1;
      this.next = next; this.kind = op; this.win = op === 'full' ? [0, 0, W, W] : [Math.max(0, x), Math.max(0, y), Math.min(W, w), Math.min(W, h)];
      this.t0 = performance.now(); this.busyUntil = this.t0 + (op === 'full' ? FULL_MS : PART_MS); this.msg = ''; this.dirty = true;
    }
  }
  settle() {
    if (!this.next || this.busy()) return;
    const k = this.k, [x, y, w, h] = this.win;
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
      const p = j * W + i, was = k.shown[p], now = this.next[p];
      if (this.kind === 'full') k.ghost[p] = 0; else if (was === 0 && now === 1) k.ghost[p] = Math.min(0.5, k.ghost[p] + 0.12); else if (now === 0) k.ghost[p] = 0;
      k.shown[p] = now;
    }
    if (this.kind === 'full') { k.partials = 0; k.fulls++; } else k.partials++;
    k.drawn = true; this.next = null; this.dirty = true;
  }
  paint() {
    const k = this.k, c = this.out.getContext('2d'), img = c.createImageData(W, W), d = img.data;
    let flash = -1;
    if (this.busy() && this.kind === 'full') { const ph = Math.floor((performance.now() - this.t0) / 250); flash = ph < 4 ? ph % 2 : -1; }   // a full refresh flashes black and white
    for (let p = 0; p < W * W; p++) {
      let v = k.shown[p] ? 255 - Math.round(255 * 0.55 * k.ghost[p]) : 0;
      if (flash === 0) v = 0; else if (flash === 1) v = 255;
      d[p * 4] = d[p * 4 + 1] = d[p * 4 + 2] = v; d[p * 4 + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  }
  tick() {
    this.settle();
    const o = this.item('cs'), animating = this.busy() && this.kind === 'full';
    if (this.dirty || animating) {
      this.paint(); this.dirty = false;
      if (o && o.setScreen) o.setScreen(this.out);
      const cv = $('#bepd-cv'); if (cv) { const c = cv.getContext('2d'); c.clearRect(0, 0, W, W); c.drawImage(this.out, 0, 0); }
    }
    const busy = this.on() && this.busy();
    this.set('#bepd-st', this.stateNote() || (this.msg ? `<b class="lo">${this.msg}</b>` : busy ? `<b class="hi">BUSY = HIGH</b>: ${this.kind === 'full' ? 'full' : 'partial'} refresh in progress. Do not send commands.` : this.asleep ? 'Panel asleep (BUSY = LOW). The picture stays.' : this.inited ? 'Idle (BUSY = LOW).' : 'Not initialised yet.'));
    const k = this.k;
    this.set('#bepd-n', `Full refreshes: <b>${k.fulls}</b> · partial refreshes since the last full one: <b>${k.partials}</b>${k.partials >= 4 ? ' · <b class="lo">time for a full refresh</b> (the manual gives no exact number)' : ''}${!this.app.board.powered && k.drawn ? '<br>The board is unpowered, but <b>the picture stays on the panel</b>.' : ''}`);
  }
}

DEVICE_REG.bsol = Solenoid;
DEVICE_REG.bepd = EPaper;

// Browser-only additions of slot a (3D breakout models, info cards, simulated devices). Imported by ui.js, never by the node check tools.
// Vibration module (SW-420 style), Hall switch (A3144) and line-follow IR module (TCRT5000). Lessons: ./a.js (module 30).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BREAKOUTS, HW_INFO } from '../hardware.js';
import { DEVICE_REG, Dev } from '../devices.js';

const $ = s => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const BOX = (g, w, h, d, x, y, z, color, rough = 0.5, metal = 0) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(0.25, h / 3)), new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })); m.position.set(x, y, z); g.add(m); return m; };
const CYL = (g, r, h, x, y, z, color, rough = 0.5, metal = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })); m.position.set(x, y, z); g.add(m); return m; };

// ---- 3D models --------------------------------------------------------------------------------------------
// SW-420 style module: blue PCB, the vibration switch (a small metal can lying on the board), LM393, trimmer, two LEDs. Pin order differs between sellers: read the silkscreen.
BREAKOUTS.mod_vib = { title: 'SW-420', names: ['VCC', 'GND', 'DO'], w: 34, d: 18, color: 0x1d4fb8, edge: 0x14264a, extras(g) {
  const can = CYL(g, 2.3, 9, -9, 5.4, -2, 0x2a2b2e, 0.4, 0.6); can.rotation.z = Math.PI / 2;
  for (const dx of [-14, -4]) CYL(g, 0.35, 3, dx, 3.6, -2, 0xb9bcc2, 0.3, 0.9);
  BOX(g, 7, 7, 5, 8, 5.6, -4, 0x1f6fd0, 0.4);                       // trimmer
  BOX(g, 5, 1, 4, 3, 3.7, 2.5, 0x15151a, 0.5);                       // LM393
  BOX(g, 1.8, 0.8, 1.2, 12, 3.6, 3, 0xd8d6c8, 0.4); BOX(g, 1.8, 0.8, 1.2, 14.5, 3.6, 3, 0xc0392b, 0.4); } };
// A3144: black TO-92 package on a tiny carrier with a 3-pin header (the bare part has three legs)
BREAKOUTS.mod_a3144 = { title: 'A3144', names: ['VCC', 'GND', 'OUT'], w: 14, d: 12, color: 0x1a7a3c, edge: 0x0f4a24, extras(g) {
  const body = CYL(g, 2.4, 4.6, 0, 5.9, -1.2, 0x131315, 0.45); body.scale.set(1, 1, 0.8);
  BOX(g, 4.2, 4.6, 0.5, 0, 5.9, 0.7, 0x1a1a1d, 0.5);                 // flat marked face
  for (const dx of [-1.27, 0, 1.27]) CYL(g, 0.2, 1.2, dx, 3.9, 0.9, 0xb9bcc2, 0.3, 0.9); } };
// TCRT5000 module: the reflective sensor (10.2 x 5.8 x 7 mm, Vishay drawing) with an emitter and a detector window, LM393, trimmer, LEDs
BREAKOUTS.mod_tcrt = { title: 'TCRT5000', names: ['VCC', 'GND', 'DO', 'AO'], w: 34, d: 20, color: 0x1d4fb8, edge: 0x14264a, extras(g) {
  BOX(g, 10.2, 7, 5.8, -9, 6.9, -3.5, 0x1b1b1e, 0.5);
  CYL(g, 1.7, 0.6, -11.6, 10.4, -3.5, 0x2a1214, 0.2); CYL(g, 1.7, 0.6, -6.4, 10.4, -3.5, 0x101012, 0.2);   // emitter (clear, dark red) and detector windows
  BOX(g, 7, 7, 5, 8, 5.6, -4, 0x1f6fd0, 0.4);                       // trimmer
  BOX(g, 5, 1, 4, 3, 3.7, 2.5, 0x15151a, 0.5);                       // LM393
  BOX(g, 1.8, 0.8, 1.2, 12, 3.6, 3, 0xd8d6c8, 0.4); BOX(g, 1.8, 0.8, 1.2, 14.5, 3.6, 3, 0xc0392b, 0.4); } };

// ---- info cards -------------------------------------------------------------------------------------------
HW_INFO.mod_vib = {
  name: 'SW-420 vibration sensor module', tag: 'A vibration switch with a comparator',
  summary: 'A small vibration switch (a contact that moves when shaken) followed by an LM393 comparator and a trimmer. DO switches when the shaking passes the trimmer setting. It tells you that the module was shaken, not how strongly or from which direction.',
  points: [
    'Sellers and tutorials describe a normally closed SW-420 sensor, a 3.3 to 5 V supply and DO going HIGH on vibration (Components101); there is no maker datasheet, so these are typical, unverified values and the polarity can differ per board.',
    'The LM393 comparator is rated for a supply from 2 V (Texas Instruments datasheet). The module output follows the supply you give it: on a 3.3 V board power it from 3V3.',
    'The real switch gives short irregular pulses, so sketches wait after a hit.',
    'Pin order differs between sellers: read the silkscreen.',
  ],
  src: 'Components101 SW-420 page; LM393 datasheet (TI)',
};
HW_INFO.mod_a3144 = {
  name: 'A3144 Hall-effect switch', tag: 'Switches when a magnet is near',
  summary: 'A Hall-effect switch with an open-collector output. When the field passes the operate point (BOP) the output pulls LOW; below the release point (BRP) it lets go. The gap between them (hysteresis) stops chatter.',
  points: [
    'Allegro datasheet: supply 4.5 to 24 V, output current up to 25 mA, output off voltage up to 28 V.',
    'At 25 °C: BOP 70 to 350 G, BRP 50 to 330 G, hysteresis at least 20 G (typical 55 G).',
    'Open collector: an external pull-up resistor is needed. On a 3.3 V board power the chip from 5 V and pull the output up to 3.3 V.',
    'It reacts to one pole only (commonly the south pole facing the marked side; not stated in the datasheet text checked).',
    'The 3D part is shown on a small carrier for its header pins; the real chip is a three-legged TO-92 part. KY-003 modules carry the same chip but are 5 V modules.',
  ],
  src: 'Allegro A3141-A3144 datasheet; Joy-IT KY-003 page',
};
HW_INFO.mod_tcrt = {
  name: 'TCRT5000 line-follow module', tag: 'Reflective infrared sensor with a comparator',
  summary: 'The TCRT5000 puts an infrared LED and a phototransistor side by side. The light that returns from the surface is compared with the trimmer setting by an LM393, giving DO (and often an analog AO pin).',
  points: [
    'Vishay datasheet: emitter 950 nm, peak operating distance 2.5 mm, usable range 0.2 to 15 mm, daylight blocking filter, emitter up to 60 mA (absolute maximum), phototransistor VCEO 70 V.',
    'Sellers give a 3.3 to 5 V supply for the module (typical, no maker datasheet). Output polarity and LED behaviour differ between boards: tutorials describe DO HIGH over a dark surface.',
    'Dark matte surfaces reflect little; shiny surfaces and strong infrared light can fool the sensor.',
  ],
  src: 'Vishay TCRT5000 datasheet (83760); LM393 datasheet (TI); seller listings',
};

// ---- simulated devices ------------------------------------------------------------------------------------
class Vib extends Dev {
  name = 'a_vib'; str = 0; thr = 35; tapAt = 0;
  html() { return this.box('The vibration', `<div class="throw"><label>Shaking</label><input id="avb-s" type="range" min="0" max="100" step="1" value="0"><b id="avb-sv"></b></div><div class="throw"><label>Sensitivity (trimmer: shaking needed)</label><input id="avb-t" type="range" min="5" max="95" step="1" value="${this.thr}"><b id="avb-tv"></b></div><div class="io-tools"><button id="avb-tap" class="hold small">Tap</button></div><div id="avb-st" class="io-val">—</div>`, 'Typical behaviour of an SW-420 style module (no maker datasheet): DO goes HIGH while the shaking is above the trimmer level. A real switch gives short irregular pulses; here about one sample in six reads LOW during shaking.'); }
  bind() { const u = () => { $('#avb-sv').textContent = this.str + ' %'; $('#avb-tv').textContent = this.thr + ' %'; }; $('#avb-s').oninput = e => { this.str = +e.target.value; u(); }; $('#avb-t').oninput = e => { this.thr = +e.target.value; u(); }; $('#avb-tap').onclick = () => { this.tapAt = performance.now(); }; u(); }
  level() { return Math.max(this.str, performance.now() - this.tapAt < 400 ? 80 : 0); }
  shaking() { return this.level() > this.thr; }
  read(pin) { if (this.roleOf(pin) !== 'do' || !this.on()) return undefined; return this.shaking() ? (Math.random() < 0.84 ? 1 : 0) : 0; }
  tick() { this.set('#avb-st', this.stateNote() || `Shaking <b>${this.level()} %</b> · DO = <b>${this.shaking() ? 'HIGH (vibration)' : 'LOW (still)'}</b>`); }
}

// A3144: BOP / BRP of this example unit are inside the datasheet limits (BOP 70-350 G, BRP 50-330 G at 25 C); the output is open collector with the pull-up of the lesson
class Hall extends Dev {
  name = 'a_hall'; B = 0; south = true; near = false; BOP = 200; BRP = 145;
  html() { return this.box('The magnet', `<div class="throw"><label>Field at the chip</label><input id="ahl-b" type="range" min="0" max="500" step="5" value="0"><b id="ahl-bv"></b></div><div class="io-tools"><button id="ahl-p" class="hold small"></button></div><div id="ahl-st" class="io-val">—</div>`, 'Example unit: operate point 200 G, release point 145 G (inside the Allegro limits BOP 70 to 350 G, BRP 50 to 330 G; each chip differs). The field is set directly in gauss: how it falls with distance is not modelled. The A3144 reacts to one pole only (commonly the south pole facing the marked side).'); }
  bind() { const u = () => { $('#ahl-bv').textContent = this.B + ' G'; $('#ahl-p').textContent = this.south ? 'Pole facing the marked side: south' : 'Pole facing the marked side: north'; }; $('#ahl-b').oninput = e => { this.B = +e.target.value; u(); }; $('#ahl-p').onclick = () => { this.south = !this.south; u(); }; u(); }
  eff() { return this.south ? this.B : 0; }
  upd() { const b = this.eff(); if (!this.near && b >= this.BOP) this.near = true; else if (this.near && b <= this.BRP) this.near = false; return this.near; }
  reset() { this.near = false; }
  read(pin) { if (this.roleOf(pin) !== 'do' || !this.on()) return undefined; return this.upd() ? 0 : 1; }
  tick() { const n = this.upd(); this.set('#ahl-st', this.stateNote() || `Effective field <b>${this.eff()} G</b> · OUT = <b>${n ? 'LOW (magnet detected)' : 'HIGH (pulled up)'}</b>${this.south ? '' : ' · the other pole does not switch it'}`); }
}

// TCRT5000: relative signal = reflectivity x distance curve (1 at 2.5 mm, 0.2 at 15 mm; simplified shape from the Vishay figures); DO HIGH when the signal is below the trimmer level
class Line extends Dev {
  name = 'a_line'; refl = 85; dist = 5; thr = 40;
  html() { return this.box('The surface under the sensor', `<div class="io-tools"><button id="aln-w" class="hold small">White paper</button><button id="aln-k" class="hold small">Black tape</button></div><div class="throw"><label>Reflectivity</label><input id="aln-r" type="range" min="0" max="100" step="1" value="${this.refl}"><b id="aln-rv"></b></div><div class="throw"><label>Distance</label><input id="aln-d" type="range" min="0" max="30" step="0.5" value="${this.dist}"><b id="aln-dv"></b></div><div class="throw"><label>Trimmer (switching level)</label><input id="aln-t" type="range" min="5" max="95" step="1" value="${this.thr}"><b id="aln-tv"></b></div><div id="aln-st" class="io-val">—</div>`, 'Typical module behaviour (seller information): DO HIGH over a dark surface, LOW over a bright one. Vishay: strongest signal at 2.5 mm, usable 0.2 to 15 mm; the curve here is a simplified shape, the percentages are examples.'); }
  bind() { const u = () => { $('#aln-rv').textContent = this.refl + ' %'; $('#aln-dv').textContent = this.dist + ' mm'; $('#aln-tv').textContent = this.thr + ' %'; $('#aln-r').value = this.refl; }; $('#aln-w').onclick = () => { this.refl = 85; u(); }; $('#aln-k').onclick = () => { this.refl = 5; u(); }; $('#aln-r').oninput = e => { this.refl = +e.target.value; u(); }; $('#aln-d').oninput = e => { this.dist = +e.target.value; u(); }; $('#aln-t').oninput = e => { this.thr = +e.target.value; u(); }; u(); }
  curve(d) { return d < 0.2 ? 0.35 : d <= 2.5 ? 0.35 + 0.65 * (d - 0.2) / 2.3 : d <= 15 ? 1 - 0.8 * (d - 2.5) / 12.5 : Math.max(0, 0.2 * (1 - (d - 15) / 15)); }
  signal() { return Math.round(this.refl * this.curve(this.dist)); }
  dark() { return this.signal() < this.thr; }
  read(pin) { return this.roleOf(pin) === 'do' && this.on() ? (this.dark() ? 1 : 0) : undefined; }
  tick() { this.set('#aln-st', this.stateNote() || `Light coming back <b>${this.signal()} %</b> (trimmer ${this.thr} %) · DO = <b>${this.dark() ? 'HIGH (dark surface)' : 'LOW (bright surface)'}</b>`); }
}

DEVICE_REG.a_vib = Vib; DEVICE_REG.a_hall = Hall; DEVICE_REG.a_line = Line;
export {};

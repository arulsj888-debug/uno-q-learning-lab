// External hardware used in the lessons: USB-C cable, breadboard, LED, resistor, jumper wires.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, canvasTex, noise } from './materials.js';
import { P, haloTexture } from './board.js';
import shtPhoto from '../assets/sht31_top.jpg';

const DESK_Y = -6.05;

function tagHW(obj, id) { obj.traverse(o => { o.userData.hw = id; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return obj; }

const tween = (ms, fn) => new Promise(res => {
  const t0 = performance.now();
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    fn(e);
    if (k < 1) requestAnimationFrame(step); else res();
  };
  requestAnimationFrame(step);
});

// ---------------------------------------------------------------- USB-C cable
export function makeUsbCable() {
  const g = new THREE.Group();
  const rubber = new THREE.MeshPhysicalMaterial({ color: 0x1c1c1f, roughness: 0.55, clearcoat: 0.2 });
  const plug = new THREE.Group();
  // metal plug (8.25 x 2.4 mm), 6.6 mm long, tip at local x = 0
  const sh = new THREE.Shape();
  const w = 8.25, h = 2.4, r = 1.15;
  sh.moveTo(-w / 2 + r, -h / 2); sh.lineTo(w / 2 - r, -h / 2); sh.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2); sh.lineTo(-w / 2 + r, h / 2); sh.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5);
  const metal = new THREE.ExtrudeGeometry(sh, { depth: 6.6, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2, curveSegments: 16 });
  metal.rotateY(-Math.PI / 2); // extrude along -x
  plug.add(new THREE.Mesh(metal, M.steel));
  const mold = new THREE.Mesh(new RoundedBoxGeometry(19, 5.6, 11.6, 4, 2.2), rubber);
  mold.position.set(-6.6 - 9.5, 0, 0); plug.add(mold);
  const relief = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.9, 7, 24), rubber);
  relief.rotation.z = Math.PI / 2; relief.position.set(-6.6 - 19 - 3.2, 0, 0); plug.add(relief);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-32, 0, 0), new THREE.Vector3(-52, -1.2, 3), new THREE.Vector3(-80, -4.6, 16),
    new THREE.Vector3(-125, -5.5, 40), new THREE.Vector3(-200, -5.5, 58), new THREE.Vector3(-320, -5.5, 70),
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 2.1, 16, false), rubber);
  plug.add(cable);
  g.add(plug);
  tagHW(g, 'usbcable');
  g.userData.plug = plug;
  return g;
}

export async function plugUsb(cable, board, insert = true, ms = 1400) {
  const mouth = board.usbMouth;        // receptacle opening (world)
  const rot = board.usbRotY || 0;      // UNO Q: opening faces −x (0); Raspberry Pi 4: faces +z
  cable.rotation.y = rot;
  cable.position.copy(mouth).add(new THREE.Vector3(6.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot));   // plug tip seated inside the receptacle
  const out = -26;
  const plug = cable.userData.plug;
  if (insert) {
    cable.visible = true;
    await tween(ms, e => { plug.position.x = out * (1 - e); });
  } else {
    await tween(ms * 0.8, e => { plug.position.x = out * e; });
    cable.visible = false;
  }
}

// ---------------------------------------------------------------- breadboard (400 tie-points)
export class Breadboard {
  constructor(center) {          // center: world position of the top surface centre
    this.center = center.clone();
    this.L = 82.5; this.D = 54.6; this.Hh = 8.5;
    const g = this.group = new THREE.Group();
    const PXM = 14;
    const cols = 30;
    this.colX = c => (c - 15.5) * 2.54;                 // c = 1..30
    const rowsY = { a: -13.97, b: -11.43, c: -8.89, d: -6.35, e: -3.81, f: 3.81, g: 6.35, h: 8.89, i: 11.43, j: 13.97 };
    this.rowZ = rowsY;
    const railZ = { 'top+': -22.86, 'top-': -20.32, 'bot-': 20.32, 'bot+': 22.86 };
    this.railZ = railZ;
    const tex = canvasTex(Math.round(this.L * PXM), Math.round(this.D * PXM), (c, w, h) => {
      const X = x => (x + this.L / 2) * PXM, Y = z => (z + this.D / 2) * PXM;
      c.fillStyle = '#f2f0ea'; c.fillRect(0, 0, w, h); noise(c, w, h, 5);
      // centre channel
      const grd = c.createLinearGradient(0, Y(-1.4), 0, Y(1.4));
      grd.addColorStop(0, '#d8d5cc'); grd.addColorStop(0.5, '#b9b5ab'); grd.addColorStop(1, '#d8d5cc');
      c.fillStyle = grd; c.fillRect(0, Y(-1.4), w, 2.8 * PXM);
      const hole = (x, z) => {
        const s = 1.1 * PXM;
        c.fillStyle = '#c9c6bd'; c.fillRect(X(x) - s * 0.75, Y(z) - s * 0.75, s * 1.5, s * 1.5);
        c.fillStyle = '#2b2b2b'; c.fillRect(X(x) - s / 2, Y(z) - s / 2, s, s);
        c.fillStyle = '#101010'; c.fillRect(X(x) - s / 3.2, Y(z) - s / 3.2, s / 1.6, s / 1.6);
      };
      for (let col = 1; col <= cols; col++) for (const z of Object.values(rowsY)) hole(this.colX(col), z);
      for (const [k, z] of Object.entries(railZ)) for (let col = 1; col <= cols; col++) { if (col % 6 === 0) continue; hole(this.colX(col), z); }
      // rail stripes
      const stripe = (z, col) => { c.fillStyle = col; c.fillRect(X(-38), Y(z) - 0.25 * PXM, 76 * PXM, 0.5 * PXM); };
      stripe(-24.6, '#d33a32'); stripe(-18.6, '#2f63c9'); stripe(18.6, '#2f63c9'); stripe(24.6, '#d33a32');
      c.font = `700 ${2.2 * PXM}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#d33a32'; c.fillText('+', X(-39.6), Y(-22.86)); c.fillText('+', X(39.6), Y(22.86));
      c.fillStyle = '#2f63c9'; c.fillText('–', X(-39.6), Y(-20.32)); c.fillText('–', X(39.6), Y(20.32));
      c.fillStyle = '#6d6a62'; c.font = `600 ${1.5 * PXM}px Arial`;
      for (let col = 1; col <= cols; col++) if (col === 1 || col % 5 === 0) { c.fillText(String(col), X(this.colX(col)), Y(-16.2)); c.fillText(String(col), X(this.colX(col)), Y(16.2)); }
      for (const [k, z] of Object.entries(rowsY)) { c.fillText(k, X(-39.2), Y(z)); c.fillText(k, X(39.2), Y(z)); }
    });
    const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
    const side = new THREE.MeshStandardMaterial({ color: 0xece9e1, roughness: 0.65 });
    const body = new THREE.Mesh(new RoundedBoxGeometry(this.L, this.Hh, this.D, 3, 0.6), [side, side, top, side, side, side]);
    body.position.y = -this.Hh / 2;
    g.add(body);
    g.position.copy(center);
    tagHW(g, 'breadboard');
  }
  /** world position of a hole top, e.g. hole('a', 10) or rail('top-', 5) */
  hole(row, col) { return this.group.localToWorld(new THREE.Vector3(this.colX(col), 0, this.rowZ[row])); }
  rail(name, col) { return this.group.localToWorld(new THREE.Vector3(this.colX(col), 0, this.railZ[name])); }
}

// ---------------------------------------------------------------- 5 mm LED
export class LED5mm {
  constructor(color = 0xff2a12) {
    const g = this.group = new THREE.Group();
    this.color = new THREE.Color(color);
    const lens = this.lensMat = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.08, metalness: 0, transmission: 0.62, thickness: 4.0, ior: 1.5,
      attenuationColor: new THREE.Color(color), attenuationDistance: 3.0, emissive: new THREE.Color(color), emissiveIntensity: 0,
      clearcoat: 1, clearcoatRoughness: 0.05,
    });
    // lathe profile (radius, height): flange, cylinder, dome
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(2.9, 0), new THREE.Vector2(2.9, 1.0), new THREE.Vector2(2.5, 1.05), new THREE.Vector2(2.5, 6.0)];
    for (let i = 1; i <= 16; i++) { const a = i / 16 * Math.PI / 2; pts.push(new THREE.Vector2(2.5 * Math.cos(a), 6.0 + 2.6 * Math.sin(a))); }
    const lg = new THREE.LatheGeometry(pts, 48);
    const body = new THREE.Mesh(lg, lens);
    body.position.y = 3.0;
    g.add(body);
    // flat on the cathode side of the flange
    const flat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 3.6), new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0 }));
    flat.position.set(-2.75, 3.5, 0); g.add(flat);
    // internal lead frame: anvil (cathode) + post (anode)
    const frame = new THREE.MeshStandardMaterial({ color: 0xbfc3c8, metalness: 1, roughness: 0.3 });
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 0.5), frame); anvil.position.set(-0.75, 4.6, 0); g.add(anvil);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.6, 0.5), frame); post.position.set(0.8, 4.8, 0); g.add(post);
    const die = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.35), new THREE.MeshBasicMaterial({ color: 0x333333 })); die.position.set(-0.6, 6.3, 0); g.add(die);
    this.die = die;
    // legs into holes 2.54 mm apart: anode (+) at local +x, cathode (-) at -x
    const leg = (x, kink) => {
      const path = new THREE.CatmullRomCurve3(kink
        ? [new THREE.Vector3(x, 3.1, 0), new THREE.Vector3(x, 2.2, 0), new THREE.Vector3(x + 0.6, 1.4, 0), new THREE.Vector3(x, 0.6, 0), new THREE.Vector3(x, -3.0, 0)]
        : [new THREE.Vector3(x, 3.1, 0), new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, -3.0, 0)]);
      return new THREE.Mesh(new THREE.TubeGeometry(path, 24, 0.24, 8, false), M.tin);
    };
    g.add(leg(1.27, true), leg(-1.27, false));
    this.light = new THREE.PointLight(color, 0, 60, 2); this.light.position.set(0, 9, 0); g.add(this.light);
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0x000000, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.halo.scale.set(16, 16, 1); this.halo.position.set(0, 8.2, 0); this.halo.renderOrder = 6; g.add(this.halo);
    tagHW(g, 'led');
    this.halo.castShadow = false; this.halo.raycast = () => {};
  }
  set(on, level = 1) {
    const v = on ? level : 0;
    this.lensMat.emissiveIntensity = v * 2.2;
    this.die.material.color.setRGB(v ? 3 : 0.2, v ? 0.6 : 0.2, v ? 0.3 : 0.2);
    this.light.intensity = v * 30;
    this.halo.material.color.setRGB(v * 1.0, v * 0.22, v * 0.1);
  }
}

// ---------------------------------------------------------------- axial resistor
const BAND = { black: 0x111111, brown: 0x6b3a1e, red: 0xc8231b, orange: 0xe26a12, yellow: 0xe8c618, green: 0x1f8a3a, blue: 0x1f55c4, violet: 0x7a3fb5, grey: 0x8a8a8a, white: 0xf0f0f0, gold: 0xc9a23f, silver: 0xc0c0c0 };
export class Resistor {
  constructor(bands = ['red', 'red', 'brown', 'gold'], span = 10.16, hwId = 'resistor') {
    const g = this.group = new THREE.Group();
    const pts = [];
    const prof = [[0, 0], [0.45, 0], [1.2, 0.35], [1.25, 0.9], [1.05, 1.6], [1.05, 4.7], [1.25, 5.4], [1.2, 5.95], [0.45, 6.3], [0, 6.3]];
    for (const [r, y] of prof) pts.push(new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(pts, 40);
    geo.rotateZ(Math.PI / 2); geo.translate(3.15, 0, 0);
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xd9c49b, roughness: 0.45, clearcoat: 0.4 });
    const body = new THREE.Mesh(geo, bodyMat);
    const y0 = 3.2;
    body.position.set(0, y0, 0); g.add(body);
    const bandPos = [-2.1, -1.2, -0.3, 1.9];
    bands.forEach((b, i) => {
      const r = i === 0 || i === 3 ? 1.27 : 1.08;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.5, 40, 1, true), new THREE.MeshPhysicalMaterial({ color: BAND[b], roughness: 0.4, metalness: b === 'gold' ? 0.8 : 0, clearcoat: 0.4 }));
      m.rotation.z = Math.PI / 2; m.position.set(bandPos[i], y0, 0); g.add(m);
    });
    const h = span / 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-h, -3.0, 0), new THREE.Vector3(-h, 1.8, 0), new THREE.Vector3(-h + 0.4, y0 - 0.25, 0), new THREE.Vector3(-h + 1.4, y0, 0), new THREE.Vector3(-3.3, y0, 0),
    ]);
    const path2 = new THREE.CatmullRomCurve3(path.points.map(p => new THREE.Vector3(-p.x, p.y, p.z)));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 32, 0.3, 8, false), M.tin));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(path2, 32, 0.3, 8, false), M.tin));
    tagHW(g, hwId);
  }
}

// ---------------------------------------------------------------- jumper wire (male-male)
const WIRE = { red: 0xd8261e, black: 0x1b1b1b, yellow: 0xf2c21b, blue: 0x2369d6, green: 0x23a046, orange: 0xf07a16, white: 0xeeeeee, gray: 0x8a8f96 };
export class JumperWire {
  /** a, b: world points at the top of the socket/hole; depthA/B: how deep the pin goes in */
  constructor(a, b, color = 'yellow', { lift = 26, depthA = 6, depthB = 6, id = 'jumper' } = {}) {
    const g = this.group = new THREE.Group();
    const housing = new THREE.MeshPhysicalMaterial({ color: 0x141414, roughness: 0.5, clearcoat: 0.3 });
    const ins = new THREE.MeshPhysicalMaterial({ color: WIRE[color] || color, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 });
    const end = (p, depth) => {
      const e = new THREE.Group();
      const hs = new THREE.Mesh(new RoundedBoxGeometry(2.5, 14, 2.5, 2, 0.25), housing); hs.position.y = 7; e.add(hs);
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.64, depth + 0.5, 0.64), M.gold); pin.position.y = -(depth + 0.5) / 2 + 0.25; e.add(pin);
      const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 3, 16), ins); boot.position.y = 15.3; e.add(boot);
      e.position.copy(p);
      return e;
    };
    this.endA = end(a, depthA); this.endB = end(b, depthB);
    g.add(this.endA, this.endB);
    const pa = a.clone().add(new THREE.Vector3(0, 16.5, 0)), pb = b.clone().add(new THREE.Vector3(0, 16.5, 0));
    const mid = pa.clone().lerp(pb, 0.5); mid.y = Math.max(pa.y, pb.y) + lift;
    const curve = new THREE.CatmullRomCurve3([
      pa, pa.clone().add(new THREE.Vector3(0, lift * 0.45, 0)), mid, pb.clone().add(new THREE.Vector3(0, lift * 0.45, 0)), pb,
    ], false, 'centripetal');
    this.tubeGeo = new THREE.TubeGeometry(curve, 140, 0.72, 12, false);
    this.wire = new THREE.Mesh(this.tubeGeo, ins);
    g.add(this.wire);
    tagHW(g, id);
  }
  async grow(ms = 1200) {
    const total = this.tubeGeo.index.count;
    this.endB.visible = false;
    const a0 = this.endA.position.y;
    this.endA.position.y = a0 + 18;
    await tween(350, e => { this.endA.position.y = a0 + 18 * (1 - e); });
    await tween(ms, e => { this.tubeGeo.setDrawRange(0, Math.floor(total * e / 3) * 3); });
    this.tubeGeo.setDrawRange(0, Infinity);
    this.endB.visible = true;
    const b0 = this.endB.position.y;
    await tween(350, e => { this.endB.position.y = b0 + 8 * (1 - e); });
  }
}

// ---------------------------------------------------------------- 6 x 6 mm tactile push button (4 legs)
export class PushButton {
  /** local frame: legs at (±2.54, ±3.81) -> straddles the centre gap of the breadboard (rows e/f, 2 columns apart) */
  constructor() {
    const g = this.group = new THREE.Group();
    const base = new THREE.Mesh(new RoundedBoxGeometry(6.0, 3.3, 6.0, 2, 0.2), new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.6 }));
    base.position.y = 1.65 + 0.4; g.add(base);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.25, 6.1), M.steelSatin); plate.position.y = 3.75 + 0.4; g.add(plate);
    for (const [x, z] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) {
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.9), M.steelSatin); tab.position.set(x, 3.2 + 0.4, z); g.add(tab);
    }
    const cap = this.cap = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.8, 1.6, 40), new THREE.MeshPhysicalMaterial({ color: 0x232325, roughness: 0.45, clearcoat: 0.3 }));
    cap.position.y = this.capUp = 4.7 + 0.4; g.add(cap);
    // legs leave the body on the two sides that face the rows (z = ±3), bend out to the holes at z = ±3.81
    for (const x of [-2.54, 2.54]) for (const s of [-1, 1]) {
      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 1.2, s * 2.95), new THREE.Vector3(x, 0.7, s * 3.35), new THREE.Vector3(x, 0.15, s * 3.81), new THREE.Vector3(x, -3.0, s * 3.81),
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 16, 0.3, 6, false), M.tin));
    }
    tagHW(g, 'pushbutton');
    this.pressed = false;
  }
  setPressed(p) { this.pressed = p; this.cap.position.y = p ? this.capUp - 0.35 : this.capUp; }
}

// ---------------------------------------------------------------- 10 kΩ rotary potentiometer (3 legs, 5.08 mm apart)
export class Potentiometer {
  constructor() {
    const g = this.group = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(9.8, 5.0, 9.6, 2, 0.4), new THREE.MeshStandardMaterial({ color: 0x2a5fa8, roughness: 0.55 }));
    body.position.y = 2.5 + 0.8; g.add(body);
    const bush = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 1.2, 40), M.nickel); bush.position.y = 6.4; g.add(bush);
    const knob = this.knob = new THREE.Group();
    const ribs = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.15, 6.0, 24), new THREE.MeshPhysicalMaterial({ color: 0x1d1d1f, roughness: 0.5, clearcoat: 0.2, flatShading: true }));
    ribs.position.y = 3.0; knob.add(ribs);
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 2.6), new THREE.MeshBasicMaterial({ color: 0xf4f4f0 }));
    mark.position.set(0, 6.05, -1.3); knob.add(mark);
    knob.position.y = 7.0; g.add(knob);
    for (const x of [-5.08, 0, 5.08]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.6, 0.3), M.tin); leg.position.set(x, -0.7, 0); g.add(leg);
    }
    tagHW(g, 'pot');
    this.set(0.5);
  }
  /** f = 0 … 1 position of the wiper; the knob turns through 270° */
  set(f) { this.value = Math.min(1, Math.max(0, f)); this.knob.rotation.y = (0.5 - this.value) * (270 / 180) * Math.PI; }
}

// ---------------------------------------------------------------- passive piezo buzzer (12 mm, legs 7.62 mm apart)
export class PiezoBuzzer {
  constructor() {
    const g = this.group = new THREE.Group();
    const top = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#18181a'; c.fillRect(0, 0, w, h); noise(c, w, h, 6);
      c.fillStyle = '#050505'; c.beginPath(); c.arc(w / 2, h / 2, 22, 0, Math.PI * 2); c.fill();
      // Cylinder top-cap UVs: canvas x follows local z, canvas y follows local −x.
      // The + leg is at local x = −3.81 mm (r = 6 mm) -> canvas y = (0.5 + 3.81 / 12) · h
      c.fillStyle = '#e8e8e2'; c.font = '700 54px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('+', w * 0.5, h * (0.5 + 3.81 / 12));
    });
    const side = new THREE.MeshPhysicalMaterial({ color: 0x18181a, roughness: 0.45, clearcoat: 0.25 });
    const body = this.body = new THREE.Mesh(new THREE.CylinderGeometry(6.0, 6.0, 8.0, 48), [side, new THREE.MeshStandardMaterial({ map: top, roughness: 0.5 }), side]);
    body.position.y = 4.0 + 0.3; g.add(body);
    for (const [x, len] of [[-3.81, 3.6], [3.81, 3.0]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, len + 0.3, 8), M.tin); leg.position.set(x, 0.3 - (len + 0.3) / 2 + 0.3, 0); g.add(leg);
    }
    tagHW(g, 'buzzer');
  }
  vibrate(on) { this.body.scale.setScalar(on ? 1 + 0.012 * Math.sin(performance.now() / 6) : 1); }
}

// ---------------------------------------------------------------- GL5528 photoresistor (LDR)
// Dimensions from the GL55-series datasheet: Ø5.1 mm disc with flats 4.3 mm apart, 2.1 mm thick,
// Ø0.5 mm leads 3.0 mm apart (bent slightly to fit two breadboard holes 2.54 mm apart). Sensing face up.
export class LDR {
  constructor() {
    const g = this.group = new THREE.Group();
    const face = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#f1ece2'; c.fillRect(0, 0, w, h); noise(c, w, h, 6);
      // red-orange CdS serpentine between two electrodes (as drawn in the datasheet)
      c.strokeStyle = '#b8401f'; c.lineWidth = 15; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      const x0 = 70, x1 = 186, rows = 6, y0 = 52, dy = (h - 2 * y0) / (rows - 1);
      c.moveTo(x0, y0);
      for (let i = 0; i < rows; i++) { const y = y0 + i * dy; c.lineTo(i % 2 ? x0 : x1, y); if (i < rows - 1) c.lineTo(i % 2 ? x0 : x1, y + dy); }
      c.stroke();
      c.fillStyle = '#c9c9c4'; c.beginPath(); c.arc(42, h / 2, 9, 0, Math.PI * 2); c.arc(214, h / 2, 9, 0, Math.PI * 2); c.fill();
    });
    // disc with two flats: circle r = 2.55 clipped at x = ±2.15
    const sh = new THREE.Shape();
    const r = 2.55, fx = 2.15, a = Math.acos(fx / r), fy = Math.sqrt(r * r - fx * fx);
    sh.moveTo(fx, -fy); sh.lineTo(fx, fy);
    sh.absarc(0, 0, r, a, Math.PI - a, false);
    sh.lineTo(-fx, -fy);
    sh.absarc(0, 0, r, Math.PI + a, 2 * Math.PI - a, false);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 2.1, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.12, bevelSegments: 3, curveSegments: 32 });
    geo.rotateX(-Math.PI / 2);
    // planar UVs so the serpentine lies flat on the top face
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + r) / (2 * r), (-pos.getZ(i) + r) / (2 * r));
    const body = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: face, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }));
    body.position.y = 4.2; g.add(body);
    for (const x of [-1.27, 1.27]) {
      const top = Math.sign(x) * 1.5;
      const path = new THREE.CatmullRomCurve3([new THREE.Vector3(top, 4.25, 0), new THREE.Vector3(top, 2.6, 0), new THREE.Vector3(x, 1.0, 0), new THREE.Vector3(x, -3.0, 0)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 16, 0.25, 8, false), M.tin));
    }
    tagHW(g, 'ldr');
  }
}

// ---------------------------------------------------------------- TMP36 temperature sensor, TO-92 package
// Pinout from the Analog Devices TMP35/36/37 datasheet (Rev. F, Figure 4): pin 1 +VS, pin 2 VOUT, pin 3 GND.
// With the flat (marked) face toward you and the legs down, pins read 1-2-3 from left to right.
// Local frame: flat face toward +z, pin 1 at x = -2.54, pin 2 at 0, pin 3 at +2.54 (legs spread to the 2.54 mm grid).
export class TMP36 {
  constructor() {
    const g = this.group = new THREE.Group();
    const r = 2.4, flat = 1.0;                       // flat face 1.0 mm in front of the centre
    const a = Math.asin(flat / r), fx = r * Math.cos(a);
    const sh = new THREE.Shape();
    sh.moveTo(-fx, flat); sh.lineTo(fx, flat);
    sh.absarc(0, 0, r, a, Math.PI - a, true);         // round back, going the long way round
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 4.7, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 2, curveSegments: 32 });
    geo.rotateX(Math.PI / 2);                         // shape y -> world +z (flat face toward +z); extrusion goes down
    geo.translate(0, 4.7, 0);                         // ...so lift it back to 0 ... 4.7 mm
    const mat = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.5 });
    const body = new THREE.Mesh(geo, mat); body.position.y = 3.2; g.add(body);
    const mark = canvasTex(256, 256, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(214,216,218,0.9)'; c.font = '700 54px Arial, Helvetica, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('TMP36', w / 2, h * 0.42);
    });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 4.0), new THREE.MeshBasicMaterial({ map: mark, transparent: true, depthWrite: false }));
    label.position.set(0, 3.2 + 2.35, flat + 0.12); g.add(label);
    for (const [i, x] of [[0, -2.54], [1, 0], [2, 2.54]]) {
      const bx = (i - 1) * 1.27;
      const path = new THREE.CatmullRomCurve3([new THREE.Vector3(bx, 3.3, 0), new THREE.Vector3(bx, 2.2, 0), new THREE.Vector3(x, 0.9, 0), new THREE.Vector3(x, -3.0, 0)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 16, 0.22, 6, false), M.tin));
    }
    tagHW(g, 'tmp36');
    this.body = body;
  }
}

// ---------------------------------------------------------------- HC-SR04 ultrasonic ranging module
// Elecfreaks HC-SR04 datasheet: 45 × 20 × 15 mm; front photo: transmitter "T" left, receiver "R" right,
// crystal "Y1" top centre, "HC-SR04" under it, pins Vcc · Trig · Echo · Gnd along the bottom edge.
// Local frame: transducers face +z, PCB centred on z = 0, pins point down at x = −3.81 / −1.27 / +1.27 / +3.81.
let _brushed = null, _mesh = null;
function brushedTex() {
  if (_brushed) return _brushed;
  _brushed = canvasTex(512, 128, (c, w, h) => {
    c.fillStyle = '#c9cbcd'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) { const v = 180 + Math.random() * 60; c.fillStyle = `rgba(${v},${v},${v + 3},0.5)`; c.fillRect(0, y, w, 1); }
    for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`; c.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 80, 1); }
  });
  _brushed.wrapS = _brushed.wrapT = THREE.RepeatWrapping;
  return _brushed;
}
function meshTex() {
  if (_mesh) return _mesh;
  _mesh = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#121314'; c.fillRect(0, 0, w, h);
    const p = 8;                                   // woven grille, ≈0.2 mm pitch at this scale
    for (let y = 0; y < h; y += p) for (let x = 0; x < w; x += p) {
      const odd = ((x + y) / p) % 2;
      c.fillStyle = odd ? '#3b3d40' : '#2a2c2e'; c.fillRect(x + 1, y + 1, p - 2, p - 2);
      c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(x + 1, y + 1, p - 2, 1);
    }
    const r = c.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = r; c.fillRect(0, 0, w, h);
  });
  return _mesh;
}

export class HCSR04 {
  constructor() {
    const g = this.group = new THREE.Group();
    const y0 = 3.0, W = 45, H = 20, T = 1.6, k = 24;      // k = texture px per mm
    const pcbBlue = '#1c5aa6';
    const silk = (c, f) => { c.save(); c.fillStyle = '#f3f5f7'; c.strokeStyle = '#f3f5f7'; f(); c.restore(); };
    const front = canvasTex(W * k, H * k, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2163b3'); gr.addColorStop(1, '#17519a');
      c.fillStyle = gr; c.fillRect(0, 0, w, h); noise(c, w, h, 7);
      // copper traces under the solder mask (slightly lighter blue)
      c.strokeStyle = 'rgba(120,175,240,0.22)'; c.lineWidth = 0.35 * k; c.lineCap = 'round';
      for (const [x, s] of [[-3.81, -1], [-1.27, -0.4], [1.27, 0.4], [3.81, 1]]) {
        c.beginPath(); c.moveTo((W / 2 + x) * k, (H - 1.3) * k); c.lineTo((W / 2 + x) * k, (H - 4) * k); c.lineTo((W / 2 + x + s * 3) * k, (H - 6.5) * k); c.stroke();
      }
      silk(c, () => {
        c.lineWidth = 0.18 * k;
        for (const x of [-13, 13]) { c.beginPath(); c.arc((W / 2 + x) * k, (H / 2) * k, 8.5 * k, 0, Math.PI * 2); c.stroke(); }
        c.strokeRect((W / 2 - 5.6) * k, (H - 6.0) * k, 11.2 * k, 5.2 * k);   // crystal outline area hidden under the part
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `700 ${Math.round(1.75 * k)}px Arial, Helvetica, sans-serif`; c.fillText('HC-SR04', w / 2, 9.4 * k);
        c.font = `700 ${Math.round(1.1 * k)}px Arial`; c.fillText('Y1', w / 2, 7.2 * k);
        c.font = `700 ${Math.round(1.9 * k)}px Arial`; c.fillText('T', 4.4 * k, (H - 1.5) * k); c.fillText('R', (W - 4.4) * k, (H - 1.5) * k);
        c.font = `700 ${Math.round(1.25 * k)}px Arial`;
        [['VCC', -3.81], ['Trig', -1.27], ['Echo', 1.27], ['GND', 3.81]].forEach(([t, x]) => { c.save(); c.translate((W / 2 + x) * k, (H - 5.0) * k); c.rotate(-Math.PI / 2); c.fillText(t, 0, 0); c.restore(); });
      });
      // tinned pin pads and corner mounting holes
      for (const x of [-3.81, -1.27, 1.27, 3.81]) { c.fillStyle = '#d9dbde'; c.beginPath(); c.arc((W / 2 + x) * k, (H - 1.4) * k, 0.85 * k, 0, Math.PI * 2); c.fill(); c.fillStyle = '#6b6f73'; c.beginPath(); c.arc((W / 2 + x) * k, (H - 1.4) * k, 0.45 * k, 0, Math.PI * 2); c.fill(); }
      for (const [x, y] of [[1.4, 1.4], [W - 1.4, 1.4], [1.4, H - 1.4], [W - 1.4, H - 1.4]]) { c.fillStyle = '#d9dbde'; c.beginPath(); c.arc(x * k, y * k, 0.95 * k, 0, Math.PI * 2); c.fill(); c.fillStyle = '#0d0f12'; c.beginPath(); c.arc(x * k, y * k, 0.55 * k, 0, Math.PI * 2); c.fill(); }
    });
    const back = canvasTex(W * k / 2, H * k / 2, (c, w, h) => {
      c.fillStyle = '#17519a'; c.fillRect(0, 0, w, h); noise(c, w, h, 7);
      c.strokeStyle = 'rgba(120,175,240,0.22)'; c.lineWidth = 4;
      for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(Math.random() * w, Math.random() * h); c.lineTo(Math.random() * w, Math.random() * h); c.stroke(); }
    });
    const edge = new THREE.MeshStandardMaterial({ color: 0x1a4f8f, roughness: 0.6 });
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), [edge, edge, edge, edge,
      new THREE.MeshPhysicalMaterial({ map: front, roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
      new THREE.MeshPhysicalMaterial({ map: back, roughness: 0.5, clearcoat: 0.3 })]);
    pcb.position.set(0, y0 + H / 2, 0); g.add(pcb);

    // transducers: Ø16 mm brushed-aluminium cans with a rolled lip and a recessed woven grille
    const cy = y0 + H / 2, z0 = T / 2, L = 12;
    const alu = new THREE.MeshStandardMaterial({ map: brushedTex(), color: 0xffffff, metalness: 1, roughness: 0.3 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.7 });
    const grille = new THREE.MeshStandardMaterial({ map: meshTex(), bumpMap: meshTex(), bumpScale: 0.6, roughness: 0.75, metalness: 0.4 });
    const usSub = [];
    for (const x of [-13, 13]) {
      const sid = x < 0 ? 'us:T' : 'us:R';
      const can = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, L, 72, 1, true), alu);
      can.rotation.x = Math.PI / 2; can.position.set(x, cy, z0 + L / 2); g.add(can);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(7.7, 0.32, 14, 72), alu); lip.position.set(x, cy, z0 + L - 0.05); g.add(lip);
      const ring = new THREE.Mesh(new THREE.RingGeometry(6.1, 7.55, 72), dark); ring.position.set(x, cy, z0 + L - 0.25); g.add(ring);
      const well = new THREE.Mesh(new THREE.CylinderGeometry(6.15, 6.15, 1.4, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.9, side: THREE.BackSide }));
      well.rotation.x = Math.PI / 2; well.position.set(x, cy, z0 + L - 0.95); g.add(well);
      const face = new THREE.Mesh(new THREE.CircleGeometry(6.15, 64), grille); face.position.set(x, cy, z0 + L - 1.6); g.add(face);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(8.15, 8.15, 0.5, 72), dark); foot.rotation.x = Math.PI / 2; foot.position.set(x, cy, z0 + 0.25); g.add(foot);
      for (const o of [can, lip, ring, well, face, foot]) usSub.push([o, sid]);
    }
    // crystal Y1 (HC-49S style metal can lying on the PCB)
    const xtal = new THREE.Mesh(new THREE.CapsuleGeometry(2.25, 6.0, 8, 24), new THREE.MeshStandardMaterial({ color: 0xe6e6e6, metalness: 1, roughness: 0.22 }));
    xtal.rotation.z = Math.PI / 2; xtal.scale.set(1, 1, 0.78); xtal.position.set(0, y0 + H - 3.4, z0 + 1.75); g.add(xtal); usSub.push([xtal, 'us:xtal']);
    const xbase = new THREE.Mesh(new THREE.BoxGeometry(11.0, 4.9, 0.5), dark); xbase.position.set(0, y0 + H - 3.4, z0 + 0.25); g.add(xbase);
    // back side: three SOIC chips + passives (the module's driver / receiver electronics)
    const chipMat = new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.55 });
    for (const [x, len] of [[-12, 8.6], [0, 9.9], [12, 4.9]]) {
      const ic = new THREE.Mesh(new THREE.BoxGeometry(3.9, len, 1.5), chipMat); ic.position.set(x, cy + 1, -T / 2 - 0.75); g.add(ic);
      const n = Math.round(len / 1.27);
      for (let i = 0; i < n; i++) for (const sx of [-1, 1]) {
        const lead = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 0.25), M.tin);
        lead.position.set(x + sx * 2.45, cy + 1 - len / 2 + 0.6 + i * 1.27, -T / 2 - 0.15); g.add(lead);
      }
    }
    for (let i = 0; i < 10; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.25, 0.5), new THREE.MeshStandardMaterial({ color: i % 3 ? 0x8d7f6a : 0x161616, roughness: 0.6 }));
      p.position.set(-18 + i * 4, y0 + 3 + (i % 2) * 2, -T / 2 - 0.25); g.add(p);
    }
    // 4-pin straight header: plastic spacer under the PCB edge, gold pins down into the breadboard
    const hdr = new THREE.Mesh(new THREE.BoxGeometry(10.16, 2.5, 2.5), M.blackPlastic); hdr.position.set(0, y0 - 1.25, 0); g.add(hdr); usSub.push([hdr, 'us:pins']);
    for (const x of [-3.81, -1.27, 1.27, 3.81]) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.64, 9.0, 0.64), M.gold); pin.position.set(x, y0 + 1.5 - 4.5, 0); g.add(pin);
      const fil = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.7, 16), M.solder); fil.position.set(x, y0 + 1.4, T / 2 + 0.35); fil.rotation.x = -Math.PI / 2; g.add(fil);
    }
    tagHW(g, 'hcsr04');
    for (const [o, id] of usSub) o.userData.hw = id;
    this.beamZ = z0 + L;                      // front plane of the transducers
    this.beamY = cy;
    this.tx = -13; this.rx = 13;              // T (transmitter) left, R (receiver) right, seen from the front
  }
}

// ---------------------------------------------------------------- HC-SR501 PIR motion sensor module
// Manufacturer datasheet (HC-SR501, 10/29/2013) + Handson user guide: 32 × 24 mm PCB, Ø23 mm Fresnel lens,
// M2 holes 28 mm apart; component side: BISS0001, two pots (time delay, sensitivity), H/L trigger jumper,
// 3-pin header Power · Output · Ground (left → right, component side up, header at the bottom).
// Local frame: lens faces +z, PCB upright, header pins point to −z. Seen from the lens side: GND left, OUT, VCC right.
export class PIRModule {
  constructor() {
    const g = this.group = new THREE.Group();
    const W = 32, Hh = 24, T = 1.6, cy = 30;          // PCB centre 30 mm above the desk (on its stand)
    this.cy = cy;
    const k = 20;
    const back = canvasTex(W * k, Hh * k, (c, w, h) => {
      c.fillStyle = '#1d6b45'; c.fillRect(0, 0, w, h); noise(c, w, h, 8);
      c.strokeStyle = 'rgba(140,220,170,0.25)'; c.lineWidth = 0.3 * k;
      for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(Math.random() * w, Math.random() * h); c.lineTo(Math.random() * w, Math.random() * h); c.stroke(); }
      for (const [x, y] of [[2, 2], [W - 2, 2], [2, Hh - 2], [W - 2, Hh - 2]]) { c.fillStyle = '#d9dbde'; c.beginPath(); c.arc(x * k, y * k, 1.6 * k, 0, 7); c.fill(); c.fillStyle = '#0c0d0e'; c.beginPath(); c.arc(x * k, y * k, 1.0 * k, 0, 7); c.fill(); }
    });
    const front = canvasTex(W * k / 2, Hh * k / 2, (c, w, h) => { c.fillStyle = '#1d6b45'; c.fillRect(0, 0, w, h); noise(c, w, h, 8); });
    const edge = new THREE.MeshStandardMaterial({ color: 0x1b5e3d, roughness: 0.6 });
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, T), [edge, edge, edge, edge,
      new THREE.MeshPhysicalMaterial({ map: front, roughness: 0.5, clearcoat: 0.3 }),
      new THREE.MeshPhysicalMaterial({ map: back, roughness: 0.5, clearcoat: 0.3 })]);
    // lens side is +z → the box's +z face is the "front" (index 4), component side −z (index 5)
    pcb.position.set(0, cy, 0); g.add(pcb);

    // Fresnel lens: square white flange + segmented dome (Ø23 mm)
    const sub = (o, id) => { (this._sub ??= []).push([o, id]); return o; };
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0xf4f3ee, roughness: 0.55, transmission: 0.25, thickness: 1.5, flatShading: true, sheen: 0.3 });
    const flange = new THREE.Mesh(new RoundedBoxGeometry(24, 24, 1.4, 2, 0.4), lensMat); flange.position.set(0, cy, T / 2 + 0.7); g.add(sub(flange, 'pir:lens'));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(11.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lensMat);
    dome.rotation.x = Math.PI / 2; dome.scale.set(1, 0.9, 1); dome.position.set(0, cy, T / 2 + 1.4); g.add(sub(dome, 'pir:lens'));

    // component side (−z): BISS0001 SOIC-16, two pots, trigger jumper, 7133 LDO, passives
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.55 });
    const zb = -T / 2;
    const ic = new THREE.Mesh(new THREE.BoxGeometry(3.9, 9.9, 1.5), dark); ic.position.set(-8, cy + 1, zb - 0.75); g.add(sub(ic, 'pir:biss'));
    for (let i = 0; i < 8; i++) for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 0.25), M.tin); l.position.set(-8 + sx * 2.45, cy + 1 - 4.45 + i * 1.27, zb - 0.15); g.add(sub(l, 'pir:biss')); }
    const potBase = new THREE.MeshStandardMaterial({ color: 0xf0efe8, roughness: 0.6 }), potTop = new THREE.MeshStandardMaterial({ color: 0xe0782a, roughness: 0.45 });
    // seen from the component side (looking +z, so +x is on the left): time delay left, sensitivity right (Handson photo)
    for (const x of [-4, 5]) {
      const pid = x > 0 ? 'pir:delay' : 'pir:sens';
      const b = new THREE.Mesh(new THREE.BoxGeometry(6.6, 6.6, 3.2), potBase); b.position.set(x, cy + Hh / 2 - 4.5, zb - 1.6); g.add(sub(b, pid));
      const t = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.2, 24), potTop); t.rotation.x = Math.PI / 2; t.position.set(x, cy + Hh / 2 - 4.5, zb - 3.6); g.add(sub(t, pid));
      const slot = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 0.3), dark); slot.position.set(x, cy + Hh / 2 - 4.5, zb - 4.25); g.add(sub(slot, pid));
    }
    const jp = new THREE.Mesh(new THREE.BoxGeometry(2.5, 7.6, 2.5), M.blackPlastic); jp.position.set(-13.2, cy + 5, zb - 1.25); g.add(sub(jp, 'pir:jumper'));
    const jcap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.0, 3.6), new THREE.MeshStandardMaterial({ color: 0xf2c418, roughness: 0.5 })); jcap.position.set(-13.2, cy + 6.3, zb - 3.5); g.add(sub(jcap, 'pir:jumper'));
    const ldo = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.5, 1.5), dark); ldo.position.set(10, cy - 4, zb - 0.75); g.add(sub(ldo, 'pir:ldo'));
    for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.25, 0.5), new THREE.MeshStandardMaterial({ color: i % 3 ? 0x8d7f6a : 0x161616, roughness: 0.6 })); p.position.set(-1 + (i % 3) * 3.2, cy - 1 + Math.floor(i / 3) * 2.6, zb - 0.25); g.add(p); }

    // 3-pin header near the bottom edge, pins pointing −z
    this.pinY = cy - Hh / 2 + 2.6;
    const hdr = new THREE.Mesh(new THREE.BoxGeometry(7.62, 2.5, 2.5), M.blackPlastic); hdr.position.set(0, this.pinY, zb - 1.25); g.add(sub(hdr, 'pir:header'));
    this.pinX = { GND: -2.54, OUT: 0, VCC: 2.54 };
    for (const [n, x] of Object.entries(this.pinX)) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 9), M.gold); p.position.set(x, this.pinY, zb - 4.5); g.add(sub(p, 'pir:' + n)); }
    this.pinTipZ = zb - 9;

    // clear acrylic stand: base plate + two edge clips
    const acr = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.9, thickness: 3, ior: 1.49, transparent: true, opacity: 0.6 });
    const base = new THREE.Mesh(new RoundedBoxGeometry(46, 3, 34, 2, 0.6), acr); base.position.set(0, 1.5, -4); g.add(sub(base, 'pir:stand'));
    for (const sx of [-1, 1]) { const clip = new THREE.Mesh(new RoundedBoxGeometry(3, cy + 4, 8, 2, 0.6), acr); clip.position.set(sx * (W / 2 + 1.2), (cy + 4) / 2, 0); g.add(sub(clip, 'pir:stand')); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.8, 16), dark); f.position.set(sx * 19, 0.4, -4 + sz * 13); g.add(f); }
    tagHW(g, 'pir');
    for (const [o, id] of this._sub) o.userData.hw = id;
  }
  /** world position of a header pin tip and the direction the pin points (out of the module) */
  pin(name) {
    this.group.updateMatrixWorld(true);
    const pos = this.group.localToWorld(new THREE.Vector3(this.pinX[name], this.pinY, this.pinTipZ + 6));
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
    return { pos, dir };
  }
  /** world position of the lens centre */
  lens() { this.group.updateMatrixWorld(true); return this.group.localToWorld(new THREE.Vector3(0, this.cy, 12)); }
}

// ---------------------------------------------------------------- female–male jumper wire
// A: female housing slid onto a horizontal header pin (dir = direction the pin points). B: male pin into a socket.
export class FemaleJumper {
  constructor(pinPos, dir, b, color = 'yellow', { lift = 30, id = 'jumper' } = {}) {
    const g = this.group = new THREE.Group();
    const housing = new THREE.MeshPhysicalMaterial({ color: 0x141414, roughness: 0.5, clearcoat: 0.3 });
    const ins = new THREE.MeshPhysicalMaterial({ color: WIRE[color] || color, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const a = this.endA = new THREE.Group();
    const hs = new THREE.Mesh(new RoundedBoxGeometry(2.6, 14, 2.6, 2, 0.25), housing); hs.position.y = 4; a.add(hs);
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 3, 16), ins); boot.position.y = 12.3; a.add(boot);
    a.position.copy(pinPos); a.quaternion.copy(q); g.add(a);
    const e = this.endB = new THREE.Group();
    const hs2 = new THREE.Mesh(new RoundedBoxGeometry(2.5, 14, 2.5, 2, 0.25), housing); hs2.position.y = 7; e.add(hs2);
    const pin = new THREE.Mesh(new THREE.BoxGeometry(0.64, 5.5, 0.64), M.gold); pin.position.y = -2.5; e.add(pin);
    const boot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 3, 16), ins); boot2.position.y = 15.3; e.add(boot2);
    e.position.copy(b); g.add(e);
    const up = new THREE.Vector3(0, 1, 0);
    const p0 = pinPos.clone().addScaledVector(dir, 13.8), p1 = p0.clone().addScaledVector(dir, 18).addScaledVector(up, 4);
    const pb = b.clone().addScaledVector(up, 16.5), p3 = pb.clone().addScaledVector(up, lift * 0.5);
    const mid = p1.clone().lerp(p3, 0.5); mid.y = Math.max(p1.y, p3.y) + lift * 0.5;
    this.tubeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, p1, mid, p3, pb], false, 'centripetal'), 160, 0.72, 12, false);
    g.add(new THREE.Mesh(this.tubeGeo, ins));
    tagHW(g, id);
  }
  async grow(ms = 1200) {
    const total = this.tubeGeo.index.count;
    this.endB.visible = false;
    await tween(ms, e => { this.tubeGeo.setDrawRange(0, Math.floor(total * e / 3) * 3); });
    this.tubeGeo.setDrawRange(0, Infinity);
    this.endB.visible = true;
    const b0 = this.endB.position.y;
    await tween(350, e => { this.endB.position.y = b0 + 8 * (1 - e); });
  }
}

// ---------------------------------------------------------------- a hand (the warm object the PIR senses)
// Adult hand at true size: palm ≈ 85 × 100 mm, fingers 60–80 mm. Palm faces −z (toward the sensor), fingers up.
export class HandModel {
  constructor() {
    const g = this.group = new THREE.Group();
    const skinTex = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#d9a184'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(${150 + Math.random() * 60},${90 + Math.random() * 40},${70 + Math.random() * 30},0.12)`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    });
    const skin = new THREE.MeshPhysicalMaterial({ map: skinTex, roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color(0xffc2a8), sheenRoughness: 0.5, clearcoat: 0.08 });
    const nail = new THREE.MeshPhysicalMaterial({ color: 0xf0c4b4, roughness: 0.25, clearcoat: 0.6 });
    const wrist = this.wrist = new THREE.Group(); g.add(wrist);
    const palm = new THREE.Mesh(new RoundedBoxGeometry(84, 96, 28, 6, 12), skin); palm.position.y = 48; wrist.add(palm);
    const finger = (x, len, r, tilt) => {
      const f = new THREE.Group(); f.position.set(x, 96, 0); f.rotation.z = tilt; wrist.add(f);
      const a = new THREE.Mesh(new THREE.CapsuleGeometry(r, len * 0.52, 6, 14), skin); a.position.y = len * 0.3; f.add(a);
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.92, len * 0.38, 6, 14), skin); b.position.set(0, len * 0.72, -2); b.rotation.x = 0.12; f.add(b);
      const n = new THREE.Mesh(new THREE.SphereGeometry(r * 0.7, 12, 8), nail); n.scale.set(1, 1.3, 0.35); n.position.set(0, len * 0.86, r * 0.65); f.add(n);
      return f;
    };
    this.fingers = [finger(-30, 64, 8.2, 0.06), finger(-10, 76, 8.8, 0.0), finger(10, 72, 8.6, -0.03), finger(29, 58, 7.6, -0.08)];
    const thumb = new THREE.Group(); thumb.position.set(40, 30, 4); thumb.rotation.z = -0.75; wrist.add(thumb);
    const t1 = new THREE.Mesh(new THREE.CapsuleGeometry(10.5, 32, 6, 14), skin); t1.position.y = 22; thumb.add(t1);
    const t2 = new THREE.Mesh(new THREE.CapsuleGeometry(9.5, 22, 6, 14), skin); t2.position.y = 52; thumb.add(t2);
    // forearm reaches back toward the person (away from the sensor), nearly level with the desk
    const arm = new THREE.Group(); arm.rotation.x = 1.3; wrist.add(arm);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(30, 200, 8, 20), skin); fore.scale.set(1.25, 1, 0.85); fore.position.set(0, -125, 0); arm.add(fore);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(46, 50, 140, 32), new THREE.MeshStandardMaterial({ color: 0x2f4f7a, roughness: 0.85 }));
    sleeve.position.set(0, -290, 0); arm.add(sleeve);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    tagHW(g, 'hand');
  }
  pose(phase, moving) {
    this.wrist.rotation.z = moving ? 0.12 * Math.sin(phase) : 0;
    this.fingers.forEach((f, i) => { f.rotation.x = moving ? 0.05 * Math.sin(phase + i) : 0; });
  }
}

// ---------------------------------------------------------------- SG90 micro servo
// TowerPro SG90 datasheet: body ≈ 22.2 × 11.8 mm, height ≈ 31 mm with the gear tower, 9 g, 180°,
// wires brown = GND, red = +5 V, orange = signal, 3-pin female plug (2.54 mm).
// The bench item's origin is the plug on a 3-pin header in the breadboard (GND · +5V · signal, along +x);
// `body` is the offset from the plug to the point under the servo on the desk.
export class ServoMotor {
  constructor(body) {
    const g = this.group = new THREE.Group();
    const sub = (o, id) => { (this._sub ??= []).push([o, id]); return o; };
    // --- header in the breadboard + plug on top
    const hdr = new THREE.Mesh(new THREE.BoxGeometry(7.62, 2.5, 2.5), M.blackPlastic); hdr.position.y = 1.25; g.add(sub(hdr, 'sv:plug'));
    for (const x of [-2.54, 0, 2.54]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.64, 12, 0.64), M.gold); p.position.set(x, 3, 0); g.add(p); }
    const plug = new THREE.Mesh(new RoundedBoxGeometry(8.0, 14, 2.9, 2, 0.3), new THREE.MeshStandardMaterial({ color: 0x1a1a1b, roughness: 0.55 }));
    plug.position.y = 2.5 + 7; g.add(sub(plug, 'sv:plug'));
    // --- servo body (desk-standing, shaft up)
    const S = this.body = new THREE.Group(); S.position.copy(body); g.add(S);
    const blue = new THREE.MeshPhysicalMaterial({ color: 0x2a6fd6, roughness: 0.25, transmission: 0.35, thickness: 4, transparent: true, opacity: 0.92, clearcoat: 0.5 });
    const caseM = new THREE.Mesh(new RoundedBoxGeometry(22.8, 22.7, 12.2, 2, 0.8), blue); caseM.position.y = 22.7 / 2; S.add(sub(caseM, 'sv:case'));
    const tabs = new THREE.Mesh(new RoundedBoxGeometry(32.3, 2.5, 12.2, 2, 0.5), blue); tabs.position.y = 15.9; S.add(sub(tabs, 'sv:tabs'));
    for (const x of [-13.85, 13.85]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.6, 16), new THREE.MeshBasicMaterial({ color: 0x0b1626 })); h.position.set(x, 15.9, 0); S.add(sub(h, 'sv:tabs')); }
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(5.9, 5.9, 4.0, 40), blue); tower.position.set(-5.4, 22.7 + 2, 0); S.add(sub(tower, 'sv:case'));
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 4.0, 24), blue); nub.position.set(1.6, 22.7 + 2, 0); S.add(sub(nub, 'sv:case'));
    // gears seen through the translucent case
    const gearM = new THREE.MeshStandardMaterial({ color: 0xe9e6dc, roughness: 0.5 });
    for (const [x, y, r] of [[-5.4, 19, 5], [2, 17, 3.6], [5.5, 13, 2.8]]) { const ge = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.6, 20), gearM); ge.position.set(x, y, 0); S.add(sub(ge, 'sv:case')); }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3.2, 20), new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.4 }));
    shaft.position.set(-5.4, 22.7 + 4 + 1.6, 0); S.add(sub(shaft, 'sv:shaft'));
    // white single-arm horn (rotates)
    const horn = this.horn = new THREE.Group(); horn.position.set(-5.4, 22.7 + 4 + 3.2, 0); S.add(horn);
    const hm = new THREE.MeshPhysicalMaterial({ color: 0xf6f5f0, roughness: 0.45, clearcoat: 0.2 });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 1.8, 28), hm); hub.position.y = 0.9; horn.add(sub(hub, 'sv:horn'));
    const sh = new THREE.Shape(); sh.moveTo(0, -3.4); sh.lineTo(15.5, -1.7); sh.absarc(15.5, 0, 1.7, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(0, 3.4); sh.lineTo(0, -3.4);
    for (const x of [6, 9, 12, 15]) { const p = new THREE.Path(); p.absarc(x, 0, 0.55, 0, Math.PI * 2, true); sh.holes.push(p); }
    const armGeo = new THREE.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2, bevelSegments: 2 }); armGeo.rotateX(-Math.PI / 2);
    const arm = new THREE.Mesh(armGeo, hm); arm.position.y = 0.3; horn.add(sub(arm, 'sv:horn'));
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16), M.steelSatin); screw.position.y = 2.05; horn.add(sub(screw, 'sv:horn'));
    // label sticker
    const lab = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#f1f1ec'; c.fillRect(0, 0, w, h); c.fillStyle = '#1b3f7a'; c.font = '700 44px Arial'; c.textAlign = 'center'; c.fillText('SG90', w / 2, 58); c.font = '600 22px Arial'; c.fillText('9g Micro Servo', w / 2, 98); });
    const sticker = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.6 })); sticker.position.set(0, 9, 6.15); S.add(sub(sticker, 'sv:case'));
    // --- 3-wire flat cable from the servo to the plug
    const exitL = new THREE.Vector3(body.x + 11.4, body.y + 3.5, body.z), plugTop = new THREE.Vector3(0, 16.5, 0);
    const cols = [0x5a3418, 0xc8231b, 0xf07a16];         // brown, red, orange
    [-1, 0, 1].forEach((k, i) => {
      const a = exitL.clone().add(new THREE.Vector3(0, 0, k * 1.0)), b = plugTop.clone().add(new THREE.Vector3(k * 2.54, 0, 0));
      const c1 = a.clone().add(new THREE.Vector3(18, 0, 0)), c2 = b.clone().add(new THREE.Vector3(0, 22, 0));
      const mid = c1.clone().lerp(c2, 0.5); mid.y += 14;
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, c1, mid, c2, b], false, 'centripetal'), 90, 0.55, 8, false), new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.45 }));
      g.add(sub(tube, 'sv:cable'));
    });
    tagHW(g, 'servo');
    for (const [o, id] of this._sub) o.traverse(x => { x.userData.hw = id; });
    this.angle = 90; this.target = 90; this.setAngle(90);
  }
  /** horn angle in degrees (0…180); 90 = horn pointing toward +z */
  setAngle(a) { this.angle = a; this.horn.rotation.y = (a - 90) * Math.PI / 180 - Math.PI / 2; }
  hornTip() { this.group.updateMatrixWorld(true); return this.horn.localToWorld(new THREE.Vector3(15.5, 2, 0)); }
}

// ---------------------------------------------------------------- L293D H-bridge in a 16-pin DIP
// TI L293x datasheet (SLRS008D): PDIP-16 body 19.80 × 6.35 mm; pin 1 = 1,2EN … pin 16 = VCC1.
// Local frame: notch toward −x; pins 1–8 along +z (row f), pins 16–9 along −z (row e), 2.54 mm pitch, rows 7.62 mm apart.
export const L293_PINS = ['1,2EN', '1A', '1Y', 'GND', 'GND', '2Y', '2A', 'VCC2', '3,4EN', '3A', '3Y', 'GND', 'GND', '4Y', '4A', 'VCC1'];
export class L293D {
  constructor() {
    const g = this.group = new THREE.Group();
    const sub = (o, id) => { (this._sub ??= []).push([o, id]); return o; };
    const top = canvasTex(792, 254, (c, w, h) => {
      c.fillStyle = '#1d1e20'; c.fillRect(0, 0, w, h); noise(c, w, h, 7);
      c.fillStyle = '#0c0c0d'; c.beginPath(); c.arc(0, h / 2, 34, -Math.PI / 2, Math.PI / 2); c.fill();      // notch
      c.fillStyle = '#0f0f10'; c.beginPath(); c.arc(70, h - 52, 16, 0, Math.PI * 2); c.fill();             // pin-1 dot
      c.fillStyle = 'rgba(210,214,218,0.82)'; c.font = '700 64px Arial, Helvetica, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('L293DNE', w / 2 + 30, h / 2 - 2);
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.55 });
    const body = new THREE.Mesh(new RoundedBoxGeometry(19.8, 3.3, 6.35, 2, 0.35), [dark, dark, new THREE.MeshStandardMaterial({ map: top, roughness: 0.5 }), dark, dark, dark]);
    body.position.y = 2.2 + 1.65; g.add(sub(body, 'drv:chip'));
    // 16 legs: shoulder out of the body, bend down into the breadboard
    for (let i = 0; i < 16; i++) {
      const front = i < 8, k = front ? i : 15 - i;
      const x = -8.89 + k * 2.54, s = front ? 1 : -1;
      const leg = new THREE.Group();
      const sh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 0.9), M.tin); sh.position.set(x, 3.2, s * 3.55); leg.add(sh);
      const v1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 0.25), M.tin); v1.position.set(x, 2.45, s * 3.85); leg.add(v1);
      const v2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.2, 0.25), M.tin); v2.position.set(x, -0.95, s * 3.81); leg.add(v2);
      g.add(sub(leg, 'drv:p' + (i + 1)));
    }
    tagHW(g, 'l293d');
    for (const [o, id] of this._sub) o.traverse(x => { x.userData.hw = id; });
  }
}

// ---------------------------------------------------------------- 4 × AA battery holder (≈ 6 V)
// Local frame: cells along z; red (+) and black (−) leads leave the −z end.
export class BatteryPack {
  constructor() {
    const g = this.group = new THREE.Group();
    const sub = (o, id) => { (this._sub ??= []).push([o, id]); return o; };
    const blk = new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.6 });
    const base = new THREE.Mesh(new RoundedBoxGeometry(62, 7, 58, 2, 1.2), blk); base.position.y = 3.5; g.add(sub(base, 'bat:holder'));
    for (const x of [-30.2, 30.2]) { const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 13, 58), blk); w.position.set(x, 6.5, 0); g.add(sub(w, 'bat:holder')); }
    for (const z of [-28.2, 28.2]) { const w = new THREE.Mesh(new THREE.BoxGeometry(62, 13, 1.6), blk); w.position.set(0, 6.5, z); g.add(sub(w, 'bat:holder')); }
    // cylinder UVs: u runs around the cell, v along it (canvas top = + end) → band and text run along the length
    const wrap = canvasTex(256, 1024, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#1f3f8f'); gr.addColorStop(0.5, '#3d68cf'); gr.addColorStop(1, '#1f3f8f');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = '#c9a43a'; c.fillRect(0, 0, w, h * 0.16);
      c.save(); c.translate(w * 0.5, h * 0.55); c.rotate(Math.PI / 2);
      c.fillStyle = '#ffffff'; c.font = '700 120px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('AA  1.5V', 0, 0);
      c.restore();
    });
    const cellMat = new THREE.MeshPhysicalMaterial({ map: wrap, roughness: 0.3, clearcoat: 0.6 });
    for (let i = 0; i < 4; i++) {
      const x = -21.75 + i * 14.5, flip = i % 2 ? 1 : -1;
      const cell = new THREE.Mesh(new THREE.CylinderGeometry(7.1, 7.1, 50.5, 32), cellMat);
      cell.rotation.x = Math.PI / 2 * flip; cell.position.set(x, 7 + 7.1, 0); g.add(sub(cell, 'bat:cell'));
      const nub = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 1.2, 16), M.steelSatin); nub.rotation.x = Math.PI / 2; nub.position.set(x, 14.1, flip * 25.85); g.add(sub(nub, 'bat:cell'));
      const spring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.5, 6, 20), M.steelSatin); spring.position.set(x, 14.1, -flip * 26.6); g.add(sub(spring, 'bat:holder'));
    }
    this.pins = { POS: new THREE.Vector3(8, 4, -29.2), NEG: new THREE.Vector3(-8, 4, -29.2) };
    tagHW(g, 'battery');
    for (const [o, id] of this._sub) o.traverse(x => { x.userData.hw = id; });
  }
  pin(name) {
    this.group.updateMatrixWorld(true);
    const pos = this.group.localToWorld(this.pins[name].clone());
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
    return { pos, dir };
  }
}

// ---------------------------------------------------------------- "130"-size DC hobby motor with a propeller
// Adafruit #711 spec: body 27.5 × 20 × 15 mm, shaft 8 mm × Ø2 mm, rated 6 V, no-load 70 mA max,
// loaded 250 mA max, stall 500 mA max. Standing upright in a small clip, shaft up, terminals at the bottom.
export class HobbyMotor {
  constructor() {
    const g = this.group = new THREE.Group();
    const sub = (o, id) => { (this._sub ??= []).push([o, id]); return o; };
    const lift = 12;                                             // bottom of the motor above the desk
    // stand: base plate + C-clip around the can
    const standM = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.65 });
    const base = new THREE.Mesh(new RoundedBoxGeometry(34, 3, 30, 2, 1), standM); base.position.y = 1.5; g.add(sub(base, 'mot:stand'));
    const post = new THREE.Mesh(new RoundedBoxGeometry(6, lift + 14, 22, 2, 1), standM); post.position.set(-13.5, (lift + 14) / 2, 0); g.add(sub(post, 'mot:stand'));
    const clip = new THREE.Mesh(new THREE.CylinderGeometry(11.3, 11.3, 8, 40, 1, true, -Math.PI * 0.75, Math.PI * 1.5), new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.65, side: THREE.DoubleSide }));
    clip.rotation.y = Math.PI; clip.position.set(0, lift + 12, 0); g.add(sub(clip, 'mot:stand'));
    // can (Ø20 with two flats 15 mm apart) + end bell
    const sh = new THREE.Shape(); const r = 10, f = 7.5, a = Math.acos(f / r);
    sh.absarc(0, 0, r, -Math.PI / 2 + a, Math.PI / 2 - a, false); sh.absarc(0, 0, r, Math.PI / 2 + a, Math.PI * 1.5 - a, false);
    const canGeo = new THREE.ExtrudeGeometry(sh, { depth: 20, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 2, curveSegments: 40 }); canGeo.rotateX(-Math.PI / 2);
    const can = new THREE.Mesh(canGeo, new THREE.MeshStandardMaterial({ color: 0xd9dadc, metalness: 1, roughness: 0.22 })); can.position.y = lift + 7.5; g.add(sub(can, 'mot:can'));
    const bellGeo = new THREE.ExtrudeGeometry(sh, { depth: 7.5, bevelEnabled: false, curveSegments: 40 }); bellGeo.rotateX(-Math.PI / 2);
    const bell = new THREE.Mesh(bellGeo, new THREE.MeshStandardMaterial({ color: 0xece9e0, roughness: 0.5 })); bell.position.y = lift; g.add(sub(bell, 'mot:bell'));
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1.6, 24), M.steelSatin); boss.position.y = lift + 27.5 + 0.8; g.add(sub(boss, 'mot:can'));
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 8, 16), M.steel); shaft.position.y = lift + 27.5 + 4; g.add(sub(shaft, 'mot:shaft'));
    // two brass terminals on the end bell (wires are soldered to them)
    this.pins = {};
    for (const [n, x] of [['M1', -5], ['M2', 5]]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 4.5), M.gold); t.position.set(x, lift + 2, 8.2); g.add(sub(t, 'mot:term'));
      this.pins[n] = new THREE.Vector3(x, lift + 2, 10.2);
    }
    // propeller (rotates about y)
    const prop = this.prop = new THREE.Group(); prop.position.y = lift + 27.5 + 6.5; g.add(prop);
    const pm = new THREE.MeshPhysicalMaterial({ color: 0xe8541c, roughness: 0.35, clearcoat: 0.4, side: THREE.DoubleSide });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 5, 24), pm); prop.add(sub(hub, 'mot:prop'));
    for (let i = 0; i < 3; i++) {
      const bs = new THREE.Shape(); bs.moveTo(2, -2.6); bs.quadraticCurveTo(11, -6.2, 19.5, -3); bs.quadraticCurveTo(21.5, 0, 19.5, 3); bs.quadraticCurveTo(11, 4.3, 2, 2.6); bs.lineTo(2, -2.6);
      const bg = new THREE.ExtrudeGeometry(bs, { depth: 0.8, bevelEnabled: false }); bg.rotateX(-Math.PI / 2);
      const blade = new THREE.Mesh(bg, i === 0 ? new THREE.MeshPhysicalMaterial({ color: 0xf6d04d, roughness: 0.35, side: THREE.DoubleSide }) : pm);
      blade.rotation.set(0, i * Math.PI * 2 / 3, 0); blade.rotateX(0.32); prop.add(sub(blade, 'mot:prop'));
    }
    // motion blur disc (shown when it spins fast)
    this.blur = new THREE.Mesh(new THREE.CircleGeometry(20.5, 48), new THREE.MeshBasicMaterial({ color: 0xf08a4a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    this.blur.rotation.x = -Math.PI / 2; this.blur.position.y = lift + 27.5 + 6.6; this.blur.raycast = () => {}; g.add(this.blur);
    // direction arrow ring above the propeller
    this.arrow = new THREE.Group(); this.arrow.position.y = lift + 27.5 + 15; g.add(this.arrow);
    const am = new THREE.MeshBasicMaterial({ color: 0x46d37e, toneMapped: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(24, 0.9, 8, 64, Math.PI * 1.5), am); ring.rotation.x = Math.PI / 2; this.arrow.add(ring);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(3.2, 7, 16), am); tip.position.set(0, 0, -24); tip.rotation.z = -Math.PI / 2; this.arrow.add(tip);
    this.arrow.visible = false; this.arrow.traverse(o => { o.raycast = () => {}; });
    this.arrowMat = am;
    tagHW(g, 'motor');
    for (const [o, id] of this._sub) o.traverse(x => { x.userData.hw = id; });
    this.angle = 0; this.speed = 0;
  }
  pin(name) {
    this.group.updateMatrixWorld(true);
    const pos = this.group.localToWorld(this.pins[name].clone());
    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
    return { pos, dir };
  }
  /** speed: −1 … +1 (+ = clockwise seen from above); dt in s */
  spin(dt) {
    this.angle -= this.speed * dt * 2 * Math.PI * 3.2;            // drawn at ≤ 3.2 rev/s (a real 130 motor spins thousands of rpm)
    this.prop.rotation.y = this.angle;
    const s = Math.abs(this.speed);
    this.blur.material.opacity = Math.max(0, (s - 0.35) * 0.5);
    this.arrow.visible = s > 0.04;
    if (this.arrow.visible) {
      this.arrow.rotation.y = this.angle * 0.12;
      this.arrow.scale.set(1, 1, this.speed > 0 ? 1 : -1);
      this.arrowMat.color.set(this.speed > 0 ? 0x46d37e : 0x4fb4ff);
    }
  }
}

// ---------------------------------------------------------------- component lead wire (stranded, tinned end into a hole)
export class LeadWire {
  /** a: start (dir = direction leaving it). b: end point; dirB (optional) = outward direction of a screw terminal the wire enters. */
  constructor(a, dir, b, color = 'red', { lift = 18, id = 'lead', dirB = null, clamp = false } = {}) {
    const g = this.group = new THREE.Group();
    const ins = new THREE.MeshPhysicalMaterial({ color: WIRE[color] || color, roughness: 0.4, clearcoat: 0.4 });
    const up = new THREE.Vector3(0, 1, 0);
    const p1 = a.clone().addScaledVector(dir, 10);
    const endDir = dirB ? dirB.clone().normalize() : up.clone();
    const top = b.clone().addScaledVector(endDir, dirB ? 9 : 7);
    const pre = top.clone().addScaledVector(endDir, dirB ? 8 : 6);
    const mid = p1.clone().lerp(pre, 0.5); mid.y = Math.max(p1.y, pre.y) + lift;
    this.tubeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, p1, mid, pre, top], false, 'centripetal'), 120, 0.7, 10, false);
    g.add(new THREE.Mesh(this.tubeGeo, ins));
    const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 12, 8), M.tin);
    tin.quaternion.setFromUnitVectors(up, endDir);
    tin.position.copy(b).addScaledVector(endDir, dirB ? 2.5 : 1); this.tip = tin; g.add(tin);
    if (!clamp) { const solder = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), M.solder); solder.position.copy(a); g.add(solder); }
    tagHW(g, id);
  }
  async grow(ms = 1000) {
    const total = this.tubeGeo.index.count; this.tip.visible = false;
    await tween(ms, e => { this.tubeGeo.setDrawRange(0, Math.floor(total * e / 3) * 3); });
    this.tubeGeo.setDrawRange(0, Infinity); this.tip.visible = true;
  }
}

// ---------------------------------------------------------------- 1-channel 5 V relay module (low/high level trigger)
// Handsontec user guide (SKU MDU1150): board 50 × 25 mm, relay + terminals 18.5 mm high, relay "JQC-3FF-S-Z",
// SPDT (COM, NO, NC), max DC 30 V / 10 A and AC 250 V / 10 A, optocoupler 817C, H/L trigger jumper, PWR + relay LEDs.
// Local frame: input screw terminal (DC+ · DC− · IN) at x = −25, output terminal (NO · COM · NC) at x = +25;
// terminal openings face outward (±x); pin order along z. Lying on the desk on its PCB.
export class RelayModule {
  constructor() {
    const g = this.group = new THREE.Group();
    const sub = (o, id) => { (this._sub ??= []).push([o, id]); return o; };
    const k = 24, y0 = 3.0, T = 1.6, top = y0 + T;
    const pcbTex = canvasTex(50 * k, 25 * k, (c, w, h) => {
      const X = x => (x + 25) * k, Z = z => (z + 12.5) * k;
      c.fillStyle = '#b81d27'; c.fillRect(0, 0, w, h); noise(c, w, h, 8);
      c.strokeStyle = 'rgba(255,160,150,0.18)'; c.lineWidth = 0.4 * k; c.lineCap = 'round';
      for (const z of [-5, 0, 5]) { c.beginPath(); c.moveTo(X(-20), Z(z)); c.lineTo(X(-12), Z(z * 0.4)); c.lineTo(X(-6), Z(z * 0.4 + 3)); c.stroke(); c.beginPath(); c.moveTo(X(20), Z(z)); c.lineTo(X(12), Z(z * 0.6)); c.stroke(); }
      c.fillStyle = '#f3f3ee'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `700 ${Math.round(1.7 * k)}px Arial, Helvetica, sans-serif`;
      [['DC+', -5], ['DC-', 0], ['IN', 5]].forEach(([t, z]) => c.fillText(t, X(-14.2), Z(z)));
      [['NO', 5], ['COM', 0], ['NC', -5]].forEach(([t, z]) => c.fillText(t, X(14.8), Z(z)));
      c.font = `700 ${Math.round(1.3 * k)}px Arial`; c.fillText('PWR', X(-13.5), Z(-10.2)); c.fillText('H', X(-17.5), Z(-8.5)); c.fillText('L', X(-17.5), Z(-4.9));
      c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = `600 ${Math.round(1.05 * k)}px Arial`; c.fillText('1 Channel Relay Module', X(2), Z(10.6));
      for (const [x, z] of [[-23.4, -10.8], [-23.4, 10.8], [23.4, -10.8], [23.4, 10.8]]) { c.fillStyle = '#e8e8e4'; c.beginPath(); c.arc(X(x), Z(z), 1.4 * k, 0, 7); c.fill(); c.fillStyle = '#17181a'; c.beginPath(); c.arc(X(x), Z(z), 0.95 * k, 0, 7); c.fill(); }
    });
    const edge = new THREE.MeshStandardMaterial({ color: 0xa81822, roughness: 0.6 });
    const bottom = new THREE.MeshStandardMaterial({ color: 0x8e1219, roughness: 0.7 });
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(50, T, 25), [edge, edge, new THREE.MeshPhysicalMaterial({ map: pcbTex, roughness: 0.45, clearcoat: 0.35 }), bottom, edge, edge]);
    pcb.position.y = y0 + T / 2; g.add(pcb);
    for (const [x, z] of [[-20, -9], [-20, 9], [20, -9], [20, 9]]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, y0, 12), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8 })); f.position.set(x, y0 / 2, z); g.add(f); }

    // screw terminals (blue, 3-way, 5 mm pitch) — the wire goes in from the outer side and is clamped by the screw
    this.pinPos = {};
    const blue = new THREE.MeshPhysicalMaterial({ color: 0x1f5fd0, roughness: 0.35, clearcoat: 0.5 });
    const block = (cx, names, id) => {
      const b = new THREE.Mesh(new RoundedBoxGeometry(8.2, 10.2, 16.2, 2, 0.5), blue); b.position.set(cx, top + 5.1, 0); g.add(sub(b, id));
      names.forEach((n, i) => {
        const z = (i - 1) * 5, out = Math.sign(cx);
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.7, 20), M.steelSatin); screw.position.set(cx - out * 0.4, top + 10.4, z); g.add(sub(screw, 'rel:' + n));
        const slot = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 0.5), new THREE.MeshBasicMaterial({ color: 0x1a1a1a })); slot.position.set(cx - out * 0.4, top + 10.8, z); g.add(sub(slot, 'rel:' + n));
        const hole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 3.2), new THREE.MeshBasicMaterial({ color: 0x07090d })); hole.position.set(cx + out * 4.15, top + 4.2, z); g.add(sub(hole, 'rel:' + n));
        this.pinPos[n] = { p: new THREE.Vector3(cx + out * 4.4, top + 4.2, z), d: new THREE.Vector3(out, 0, 0) };
      });
    };
    block(-21.2, ['DCP', 'DCN', 'IN'], 'rel:in');
    block(21.2, ['NC', 'COM', 'NO'], 'rel:out');
    // pin map along z: NC (−5), COM (0), NO (+5); DC+ (−5), DC− (0), IN (+5) — printed on the board as above

    // relay JQC-3FF-S-Z: blue case 19 × 15.5 × 15.3 mm, printed top
    const rtex = canvasTex(512, 424, (c, w, h) => {
      c.fillStyle = '#2d63c9'; c.fillRect(0, 0, w, h); noise(c, w, h, 6);
      c.fillStyle = '#e9eef8'; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.font = '700 34px Arial'; c.fillText('10A 250VAC  15A 125VAC', 22, 80); c.fillText('10A 30VDC', 22, 128);
      c.font = '700 46px Arial'; c.fillText('JQC-3FF-S-Z', 22, 220); c.font = '700 38px Arial'; c.fillText('5VDC', 22, 290);
      c.strokeStyle = '#e9eef8'; c.lineWidth = 4; c.beginPath(); c.moveTo(w - 70, 60); c.lineTo(w - 36, 118); c.lineTo(w - 104, 118); c.closePath(); c.stroke();
    });
    const caseMat = this.caseMat = new THREE.MeshPhysicalMaterial({ color: 0x2a5fd0, roughness: 0.4, clearcoat: 0.5, transparent: true, opacity: 1 });
    const sideM = caseMat, topM = new THREE.MeshPhysicalMaterial({ map: rtex, roughness: 0.4, clearcoat: 0.5, transparent: true, opacity: 1 });
    this.topMat = topM;
    const rc = new THREE.Mesh(new RoundedBoxGeometry(19, 15.3, 15.5, 2, 0.5), [sideM, sideM, topM, sideM, sideM, sideM]);
    rc.position.set(2, top + 7.65, 0); g.add(sub(rc, 'rel:relay'));
    // relay internals (visible in the cutaway view): coil + core, armature, moving contact, NC / NO fixed contacts
    const inner = this.inner = new THREE.Group(); inner.position.set(2, top, 0); g.add(inner);
    const copper = new THREE.MeshStandardMaterial({ color: 0xc8662a, roughness: 0.4, metalness: 0.8 });
    const iron = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.35, metalness: 1 });
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 10, 28), copper); coil.rotation.z = Math.PI / 2; coil.position.set(-3.2, 5.1, -1.6); inner.add(sub(coil, 'rel:coil'));
    const core = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 12, 16), iron); core.rotation.z = Math.PI / 2; core.position.set(-3.2, 5.1, -1.6); inner.add(sub(core, 'rel:coil'));
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(1, 9.5, 2), iron); yoke.position.set(-9, 5.6, -1.6); inner.add(sub(yoke, 'rel:coil'));
    // armature pivots on the yoke top; its free end is pulled down toward the core when the coil is energised
    const arm = this.arm = new THREE.Group(); arm.position.set(-9, 10.4, -1.6); inner.add(arm);
    const armBar = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 5.4), iron); armBar.position.set(7, 0, 0); arm.add(sub(armBar, 'rel:arm'));
    const spring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.22, 6, 14), M.steelSatin); spring.position.set(12.5, -1.2, 0); spring.rotation.y = Math.PI / 2; arm.add(sub(spring, 'rel:arm'));
    const blade = this.blade = new THREE.Group(); blade.position.set(8.8, 9.3, 3.2); inner.add(blade);           // moving contact blade (connected to COM)
    const bladeBar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.8, 1.8), M.gold); bladeBar.position.y = -2.4; blade.add(sub(bladeBar, 'rel:blade'));
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 8), M.solder); tip.position.set(0, -4.9, 0); blade.add(sub(tip, 'rel:blade'));
    const ncPost = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 1.6), M.gold); ncPost.position.set(8.3, 5.9, 3.2); inner.add(sub(ncPost, 'rel:nc'));
    const ncTip = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), M.solder); ncTip.position.set(8.3, 5.0, 3.2); inner.add(sub(ncTip, 'rel:nc'));
    const noPost = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 1.6), M.gold); noPost.position.set(9.3, 5.9, 3.2); inner.add(sub(noPost, 'rel:no'));
    const noTip = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), M.solder); noTip.position.set(9.3, 5.0, 3.2); inner.add(sub(noTip, 'rel:no'));
    inner.visible = false;
    // --- SMD driver circuit (817C optocoupler, transistor, resistors, flyback diode, two LEDs)
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.55 });
    const opto = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.6, 4.2), dark); opto.position.set(-10.5, top + 1.3, 8.2); g.add(sub(opto, 'rel:opto'));
    for (const sx of [-1, 1]) for (const i of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 1.6), M.tin); l.position.set(-10.5 + i * 1.27, top + 0.15, 8.2 + sx * 2.5); g.add(sub(l, 'rel:opto')); }
    const q1 = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.1, 1.5), dark); q1.position.set(-9.5, top + 0.55, 3.6); g.add(sub(q1, 'rel:q1'));
    for (const [x, z, id] of [[-12.5, 3.5, 'rel:r'], [-5.5, 8.5, 'rel:r'], [-6.6, 4.2, 'rel:d1']]) { const r = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 1.6), new THREE.MeshStandardMaterial({ color: id === 'rel:d1' ? 0x1a1b1d : 0x161616, roughness: 0.6 })); r.position.set(x, top + 0.3, z); g.add(sub(r, id)); const e = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.6, 1.7), M.capEnd); e.scale.set(1, 0.9, 1.0); e.position.set(x, top + 0.28, z); e.renderOrder = -1; g.add(e); }
    this.leds = [];
    for (const [x, z, id] of [[-9.5, -10.2, 'rel:pwr'], [-5.2, -10.2, 'rel:led']]) {
      const body = new THREE.Mesh(new RoundedBoxGeometry(3.4, 1.1, 1.8, 1, 0.2), new THREE.MeshPhysicalMaterial({ color: 0xd9a39d, roughness: 0.3, clearcoat: 0.6 })); body.position.set(x, top + 0.55, z); g.add(sub(body, id));
      const gl = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 1.3), new THREE.MeshBasicMaterial({ color: 0x331111, toneMapped: false })); gl.position.set(x, top + 1.15, z); g.add(gl);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      halo.scale.set(11, 11, 1); halo.position.set(x, top + 1.8, z); halo.raycast = () => {}; g.add(halo);
      this.leds.push({ gl, halo });
    }
    // H/L trigger-select jumper: 3-pin header with a yellow cap on "L" (low-level trigger)
    const hdr = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.5, 7.8), M.blackPlastic); hdr.position.set(-17.5, top + 1.25, -6.7); g.add(sub(hdr, 'rel:jumper'));
    for (const z of [-9.3, -6.7, -4.1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.64, 6, 0.64), M.gold); p.position.set(-17.5, top + 2.6, z); g.add(sub(p, 'rel:jumper')); }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.7, 5.4), new THREE.MeshStandardMaterial({ color: 0xf2c418, roughness: 0.5 })); cap.position.set(-17.5, top + 4.2, -5.4); g.add(sub(cap, 'rel:jumper'));
    tagHW(g, 'relaymod');
    for (const [o, id] of this._sub) o.traverse(x => { x.userData.hw = id; });
    this.energized = false; this.t = 0; this.cutaway = false; this.pwr = false;
    this.applyArm(0);
  }
  pin(name) {
    this.group.updateMatrixWorld(true);
    const q = this.group.getWorldQuaternion(new THREE.Quaternion());
    return { pos: this.group.localToWorld(this.pinPos[name].p.clone()), dir: this.pinPos[name].d.clone().applyQuaternion(q) };
  }
  setCutaway(on) {
    this.cutaway = on; this.inner.visible = on;
    this.caseMat.opacity = on ? 0.22 : 1; this.topMat.opacity = on ? 0.22 : 1;
    this.caseMat.transmission = on ? 0.6 : 0; this.caseMat.depthWrite = !on; this.topMat.depthWrite = !on;
    this.caseMat.needsUpdate = this.topMat.needsUpdate = true;
  }
  applyArm(t) {
    this.t = t;
    this.arm.rotation.z = -0.075 * t;                                // free end of the armature drops toward the coil core
    this.blade.rotation.z = -0.12 * t;                                // blade swings from NC (left) to NO (right)
    this.blade.position.x = 8.3 + 1.0 * t;
  }
  /** energized: coil current flows; pwr: module has power. Returns true when the state changed (click). */
  update(dt, energized, pwr) {
    let changed = false;
    if (energized !== this.energized) { this.energized = energized; changed = true; }
    const target = energized ? 1 : 0, rate = energized ? 1 / 0.012 : 1 / 0.02;     // snaps in a few ms; slowed for display
    this.applyArm(this.t + Math.sign(target - this.t) * Math.min(Math.abs(target - this.t), Math.max(dt, 0.045) * rate * 0.06));
    this.setLeds(pwr, energized);
    return changed;
  }
  setLeds(pwr, on) {
    const set = (i, v) => { const L = this.leds[i]; L.gl.material.color.setRGB(v ? 1.0 : 0.25, v ? 0.0 : 0.06, v ? 0.0 : 0.06); L.halo.material.color.setRGB(v ? 1 : 0, v ? 0.12 : 0, v ? 0.08 : 0); };
    set(0, pwr); set(1, on);
  }
}

// ---------------------------------------------------------------- miniature E10 lamp in a small holder
export class MiniLamp {
  constructor() {
    const g = this.group = new THREE.Group();
    const sub = (o, id) => { (this._sub ??= []).push([o, id]); return o; };
    const blk = new THREE.MeshStandardMaterial({ color: 0x232427, roughness: 0.6 });
    const base = new THREE.Mesh(new RoundedBoxGeometry(30, 7, 14, 2, 0.8), blk); base.position.y = 3.5; g.add(sub(base, 'lamp:holder'));
    const sock = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 6, 24), M.steelSatin); sock.position.set(2, 10, 0); g.add(sub(sock, 'lamp:holder'));
    const blue = new THREE.MeshPhysicalMaterial({ color: 0x1f5fd0, roughness: 0.35, clearcoat: 0.5 });
    this.pinPos = {};
    for (const [n, z] of [['L1', -4], ['L2', 4]]) {
      const t = new THREE.Mesh(new RoundedBoxGeometry(5.5, 6, 4.8, 1, 0.4), blue); t.position.set(-11.8, 10, z); g.add(sub(t, 'lamp:term'));
      const s = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.6, 16), M.steelSatin); s.position.set(-11.8, 13.2, z); g.add(sub(s, 'lamp:term'));
      this.pinPos[n] = { p: new THREE.Vector3(-14.6, 10, z), d: new THREE.Vector3(-1, 0, 0) };
    }
    // E10 lamp: metal screw base (Ø 9.5 mm thread) + glass bulb with a tungsten filament
    const thread = new THREE.Mesh(new THREE.CylinderGeometry(4.75, 4.75, 8, 24), M.nickel); thread.position.set(2, 17, 0); g.add(sub(thread, 'lamp:bulb'));
    for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.3, 6, 24), M.nickel); r.rotation.x = Math.PI / 2; r.position.set(2, 14.5 + i * 1.7, 0); g.add(sub(r, 'lamp:bulb')); }
    const glassMat = this.glass = new THREE.MeshPhysicalMaterial({ color: 0xfff6dc, roughness: 0.05, transmission: 0.9, thickness: 1.2, ior: 1.45, transparent: true, opacity: 0.55, emissive: 0xffb050, emissiveIntensity: 0 });
    const glass = new THREE.Mesh(new THREE.SphereGeometry(5.6, 28, 20), glassMat); glass.position.set(2, 27, 0); glass.scale.set(1, 1.18, 1); g.add(sub(glass, 'lamp:bulb'));
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.2, 5, 20), glassMat); neck.position.set(2, 21.5, 0); g.add(sub(neck, 'lamp:bulb'));
    const fil = this.fil = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.22, 8, 24), new THREE.MeshStandardMaterial({ color: 0x8a8d92, roughness: 0.4, metalness: 1, emissive: 0xff8a2a, emissiveIntensity: 0 }));
    fil.position.set(2, 26, 0); fil.rotation.x = Math.PI / 2; g.add(sub(fil, 'lamp:bulb'));
    for (const x of [-1.3, 1.3]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.5, 6), M.steel); w.position.set(2 + x, 23.4, 0); g.add(sub(w, 'lamp:bulb')); }
    this.light = new THREE.PointLight(0xffb561, 0, 220, 1.4); this.light.position.set(2, 28, 0); g.add(this.light);
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.halo.scale.set(52, 52, 1); this.halo.position.set(2, 27, 0); this.halo.raycast = () => {}; g.add(this.halo);
    tagHW(g, 'lamp');
    for (const [o, id] of this._sub) o.traverse(x => { x.userData.hw = id; });
    this.set(false);
  }
  pin(name) {
    this.group.updateMatrixWorld(true);
    const q = this.group.getWorldQuaternion(new THREE.Quaternion());
    return { pos: this.group.localToWorld(this.pinPos[name].p.clone()), dir: this.pinPos[name].d.clone().applyQuaternion(q) };
  }
  set(on) {
    this.glass.emissiveIntensity = on ? 1.6 : 0; this.fil.material.emissiveIntensity = on ? 4 : 0;
    this.light.intensity = on ? 9000 : 0; this.halo.material.color.setRGB(on ? 1 : 0, on ? 0.62 : 0, on ? 0.28 : 0);
    this.fil.material.color.set(on ? 0xffd9a0 : 0x8a8d92);
  }
}

export async function dropIn(obj, from = 30, ms = 700) {
  const y = obj.position.y;
  obj.visible = true;
  await tween(ms, e => { obj.position.y = y + from * (1 - e); });
}

// ---------------------------------------------------------------- Arduino Modulino Thermo (ABX00103) + Qwiic cable
// Datasheet (Modulino Thermo, 03/11/2026): board 41 × 25.36 mm, 1.6 mm; Qwiic connectors J1/J2 (SM04B-SRSS-TB) on the two short edges,
// 1×4 header J4 (GND, 3V3, SDA, SCL), 1×5 header J3 (GND, 3V3, ADDR, nRST, ALERT), 4 mounting holes Ø3.2 mm (16 × 32 mm),
// green power LED, GXHT30C sensor (black, DFN8 2.5 × 2.5 × 0.9 mm). Layout measured from the datasheet pinout drawing.
// Local frame (lying on the desk, component side up): long axis = x. J2 faces −x ("QA"), J1 faces +x ("QB"); J4 on the +z edge, J3 on the −z edge.
export class ModulinoThermo {
  constructor() {
    const g = this.group = new THREE.Group();
    const sub = (o, id) => { (this._sub ??= []).push([o, id]); return o; };
    const L = 41, Wd = 25.36, T = 1.6, k = 24;
    // --- PCB outline with the real cut-outs: 4 mounting holes, 4 small holes, 4 arc slots around the sensor, header holes
    const rr = (s, w, h, r) => { s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0); s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2); s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI); s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5); };
    const shape = new THREE.Shape(); rr(shape, L, Wd, 3.2);
    const circ = (x, z, r) => { const p = new THREE.Path(); p.absarc(x, -z, r, 0, Math.PI * 2, true); shape.holes.push(p); };
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { circ(sx * 16, sz * 8, 1.6); circ(sx * 5.5, sz * 5.5, 1.1); }
    this.hdr4 = [['GND', 3.81], ['3V3', 1.27], ['SDA', -1.27], ['SCL', -3.81]];
    this.hdr5 = [['GND', 5.08], ['3V3', 2.54], ['ADDR', 0], ['nRST', -2.54], ['ALERT', -5.08]];
    for (const [, x] of this.hdr4) circ(x, 11.4, 0.5);
    for (const [, x] of this.hdr5) circ(x, -11.4, 0.5);
    // arc slots (radius 5.1 mm around the sensor, 1.5 mm wide, ±28° about each diagonal)
    for (const ang of [45, 135, 225, 315]) {
      const a0 = (ang - 28) * Math.PI / 180, a1 = (ang + 28) * Math.PI / 180, R = 5.1, w2 = 0.75, p = new THREE.Path();
      p.absarc(0, 0, R + w2, a0, a1, false);
      p.absarc(R * Math.cos(a1), R * Math.sin(a1), w2, a1, a1 + Math.PI, false);
      p.absarc(0, 0, R - w2, a1, a0, true);
      p.absarc(R * Math.cos(a0), R * Math.sin(a0), w2, a0 + Math.PI, a0 + Math.PI * 2, false);
      shape.holes.push(p);
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 24 });
    geo.rotateX(-Math.PI / 2);
    const mask = new THREE.MeshPhysicalMaterial({ color: 0x1f4ea6, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.35 });
    const pcb = new THREE.Mesh(geo, mask); g.add(sub(pcb, 'th:pcb'));
    // --- silkscreen + copper rings, drawn in the datasheet orientation (picture-up = +x, picture-right = +z)
    const tex = canvasTex(Math.round(Wd * k), Math.round(L * k), (c, w, h) => {
      const X = z => (z + Wd / 2) * k, Y = x => (L / 2 - x) * k;
      c.clearRect(0, 0, w, h);
      const ring = (x, z, ro, ri) => { c.fillStyle = '#d9b25f'; c.beginPath(); c.arc(X(z), Y(x), ro * k, 0, 7); c.arc(X(z), Y(x), ri * k, 0, 7, true); c.fill('evenodd'); };
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) ring(sx * 16, sz * 8, 2.8, 1.6);
      for (const [, x] of this.hdr4) ring(x, 11.4, 0.95, 0.5);
      for (const [, x] of this.hdr5) ring(x, -11.4, 0.95, 0.5);
      c.fillStyle = '#f2f2ee'; c.textBaseline = 'middle'; c.font = `700 ${Math.round(1.25 * k)}px Arial, Helvetica, sans-serif`;
      c.textAlign = 'right'; for (const [n, x] of this.hdr4) c.fillText(n, X(11.4 - 1.35), Y(x));
      c.textAlign = 'left'; for (const [n, x] of this.hdr5) c.fillText(n, X(-11.4 + 1.35), Y(x));
      // thermometer and droplet symbols (as on the real board)
      c.strokeStyle = '#f2f2ee'; c.lineWidth = 0.28 * k; c.lineCap = 'round';
      c.beginPath(); c.arc(X(6.2), Y(11.6), 0.9 * k, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(X(6.2), Y(11.6)); c.lineTo(X(6.2), Y(14.4)); c.stroke();
      c.beginPath(); c.moveTo(X(8.2), Y(11.2)); c.quadraticCurveTo(X(5.6), Y(8.6), X(8.2), Y(7.2)); c.quadraticCurveTo(X(10.8), Y(8.6), X(8.2), Y(11.2)); c.stroke();
    });
    const qv = new THREE.BufferGeometry();
    qv.setAttribute('position', new THREE.Float32BufferAttribute([-L / 2, 0, -Wd / 2, L / 2, 0, -Wd / 2, L / 2, 0, Wd / 2, -L / 2, 0, Wd / 2], 3));
    qv.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    // u runs along +z (picture-right) and v along +x (picture-up): vertices (x,z) → (v,u)
    qv.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1, 1, 0], 2));
    qv.setIndex([0, 2, 1, 0, 3, 2]);
    const over = new THREE.Mesh(qv, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    over.position.y = T + 0.02; over.raycast = () => {}; g.add(over);
    const top = T;

    // --- Qwiic connectors J1 (+x end) and J2 (−x end): JST SH 4-pin right-angle SMD, opening toward the board edge
    const frontTex = canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = '#efede4'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1a1a'; c.fillRect(22, 30, w - 44, h - 52);
      c.fillStyle = '#d6aa52'; for (let i = 0; i < 4; i++) c.fillRect(54 + i * 44, 52, 10, 30);
    });
    const fMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.6 });
    for (const sx of [1, -1]) {
      const mats = [M.whiteNylon, M.whiteNylon, M.whiteNylon, M.whiteNylon, M.whiteNylon, M.whiteNylon]; mats[sx > 0 ? 0 : 1] = fMat;
      const b = new THREE.Mesh(new RoundedBoxGeometry(4.25, 2.9, 6.0, 2, 0.15), mats); b.position.set(sx * 18.2, top + 1.45, 0); g.add(sub(b, 'th:qwiic'));
      for (const sz of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 1.5), M.tin); t.position.set(sx * 16.4, top + 0.17, sz * 3.5); g.add(sub(t, 'th:qwiic')); }
    }
    this.pinPos = { QA: { p: new THREE.Vector3(-18.2 - 2.125, top + 1.45, 0), d: new THREE.Vector3(-1, 0, 0) }, QB: { p: new THREE.Vector3(18.2 + 2.125, top + 1.45, 0), d: new THREE.Vector3(1, 0, 0) } };

    // --- sensor: GXHT30C, black dustproof film over a DFN8 2.5 × 2.5 × 0.9 mm package, with the tiny sensing opening
    const sens = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.9, 2.5), new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.5 })); sens.position.set(0, top + 0.45, 0); g.add(sub(sens, 'th:sensor'));
    const film = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 14), new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.7 })); film.position.set(0, top + 0.92, 0); g.add(sub(film, 'th:sensor'));
    // --- power LED (green, LTST-C190KGKT) with its 1 kΩ resistor, decoupling capacitors, pull-ups
    const led = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.8, 0.8, 1, 0.1), new THREE.MeshPhysicalMaterial({ color: 0x9fe5a8, roughness: 0.3, clearcoat: 0.6 })); led.position.set(16.95, top + 0.4, -4.2); g.add(sub(led, 'th:led'));
    this.ledGlow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.6), new THREE.MeshBasicMaterial({ color: 0x1d4a26, toneMapped: false })); this.ledGlow.position.set(16.95, top + 0.85, -4.2); g.add(sub(this.ledGlow, 'th:led'));
    this.ledHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.ledHalo.scale.set(9, 9, 1); this.ledHalo.position.set(16.95, top + 1.6, -4.2); this.ledHalo.raycast = () => {}; g.add(this.ledHalo);
    const smd = (x, z, w, d, col, id) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 })); m.position.set(x, top + 0.25, z); g.add(sub(m, id)); };
    smd(14.6, -4.2, 1.0, 0.6, 0x141414, 'th:r');
    smd(11.5, 0, 1.6, 1.0, 0x8c8478, 'th:r'); smd(9.6, 0, 1.0, 0.6, 0x141414, 'th:r');
    smd(-8.3, 0, 1.0, 0.6, 0x141414, 'th:r'); smd(-9.6, 0, 1.0, 0.6, 0x8c8478, 'th:r'); smd(-11.4, 0, 1.6, 1.2, 0x8c7660, 'th:r');
    tagHW(g, 'thermo');
    for (const [o, id] of this._sub) o.traverse(x => { x.userData.hw = id; });
    this.setPower(false);
  }
  pin(name) {
    this.group.updateMatrixWorld(true);
    const q = this.group.getWorldQuaternion(new THREE.Quaternion());
    return { pos: this.group.localToWorld(this.pinPos[name].p.clone()), dir: this.pinPos[name].d.clone().applyQuaternion(q) };
  }
  setPower(on) { this.ledGlow.material.color.set(on ? 0x62ff7a : 0x1d4a26); this.ledHalo.material.color.set(on ? 0x34e060 : 0x000000); }
}

// Qwiic cable: two JST SH 4-pin plugs joined by four flat wires (black GND, red 3.3 V, blue SDA, yellow SCL).
export class QwiicCable {
  constructor(a, dirA, b, dirB, { lift = 6 } = {}) {
    const g = this.group = new THREE.Group();
    const up = new THREE.Vector3(0, 1, 0);
    const pA = a.clone().addScaledVector(dirA, 2.6), pB = b.clone().addScaledVector(dirB, 2.6);
    const q1 = pA.clone().addScaledVector(dirA, 9), q2 = pB.clone().addScaledVector(dirB, 9);
    const mid = q1.clone().lerp(q2, 0.5); mid.y = Math.max(q1.y, q2.y) + lift;
    const base = new THREE.CatmullRomCurve3([pA, q1, mid, q2, pB], false, 'centripetal');
    const N = 90, pts = base.getPoints(N), cols = [0x161616, 0xd8261e, 0x2369d6, 0xf2c21b];
    this.geos = [];
    cols.forEach((col, i) => {
      const off = (i - 1.5) * 1.0, line = pts.map((p, j) => {
        const t = base.getTangent(j / N), n = new THREE.Vector3().crossVectors(up, t).normalize();
        return p.clone().addScaledVector(n, off);
      });
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(line, false, 'centripetal'), 140, 0.5, 8, false);
      this.geos.push(geo);
      g.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.45, clearcoat: 0.3 })));
    });
    const plugMat = new THREE.MeshStandardMaterial({ color: 0xece9df, roughness: 0.55 });
    this.plugs = [];
    for (const [p, d] of [[a, dirA], [b, dirB]]) {
      const m = new THREE.Mesh(new RoundedBoxGeometry(4.4, 2.7, 5.0, 2, 0.2), plugMat);
      m.position.copy(p).addScaledVector(d, 0.4); m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d); g.add(m); this.plugs.push(m);
    }
    tagHW(g, 'qwiiccable');
  }
  async grow(ms = 1000) {
    this.plugs.forEach(p => { p.visible = false; });
    const totals = this.geos.map(x => x.index.count);
    await tween(ms, e => { this.geos.forEach((x, i) => x.setDrawRange(0, Math.floor(totals[i] * e / 3) * 3)); });
    this.geos.forEach(x => x.setDrawRange(0, Infinity)); this.plugs.forEach(p => { p.visible = true; });
  }
}

// ---------------------------------------------------------------- Arduino Modulino Pixels (ABX00109)
// Datasheet: 41 × 25.36 mm, 1.6 mm, 8 × LC8822-2020 RGB LEDs, STM32C011F4, Qwiic connectors at both short edges,
// 1×4 header (GND, 3V3, SDA, SCL), 1×10 header (GND, GND, 3V3, RESET, SWCLK, SWDIO, TX1, RX1, D0, C0), 4 mounting holes Ø3.2 (16 × 32 mm).
// Layout measured from the datasheet pinout drawing (picture-up = +x, picture-right = +z). Same local frame as ModulinoThermo.
export class ModulinoPixels {
  constructor() {
    const g = this.group = new THREE.Group();
    const sub = (o, id) => { (this._sub ??= []).push([o, id]); return o; };
    const L = 41, Wd = 25.36, T = 1.6, k = 24, top = T;
    const rr = (s, w, h, r) => { s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0); s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2); s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI); s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5); };
    const shape = new THREE.Shape(); rr(shape, L, Wd, 3.2);
    const circ = (x, z, r) => { const p = new THREE.Path(); p.absarc(x, -z, r, 0, Math.PI * 2, true); shape.holes.push(p); };
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) circ(sx * 16, sz * 8, 1.6);
    this.hdr4 = [['GND', 3.81], ['3V3', 1.27], ['SDA', -1.27], ['SCL', -3.81]];
    const names10 = ['GND', 'GND', '3V3', 'RESET', 'SWCLK', 'SWDIO', 'TX1', 'RX1', 'D0', 'C0'];
    this.hdr10 = names10.map((n, i) => [n, 11.43 - i * 2.54]);
    for (const [, x] of this.hdr4) circ(x, 11.4, 0.5);
    for (const [, x] of this.hdr10) circ(x, -11.4, 0.5);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 24 });
    geo.rotateX(-Math.PI / 2);
    const mask = new THREE.MeshPhysicalMaterial({ color: 0x1b2f63, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.35 });
    g.add(sub(new THREE.Mesh(geo, mask), 'px:pcb'));
    const tex = canvasTex(Math.round(Wd * k), Math.round(L * k), (c, w, h) => {
      const X = z => (z + Wd / 2) * k, Y = x => (L / 2 - x) * k;
      c.clearRect(0, 0, w, h);
      const ring = (x, z, ro, ri) => { c.fillStyle = '#d9b25f'; c.beginPath(); c.arc(X(z), Y(x), ro * k, 0, 7); c.arc(X(z), Y(x), ri * k, 0, 7, true); c.fill('evenodd'); };
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) ring(sx * 16, sz * 8, 2.8, 1.6);
      for (const [, x] of this.hdr4) ring(x, 11.4, 0.95, 0.5);
      for (const [, x] of this.hdr10) ring(x, -11.4, 0.95, 0.5);
      c.fillStyle = '#f2f2ee'; c.textBaseline = 'middle'; c.font = `700 ${Math.round(1.15 * k)}px Arial, Helvetica, sans-serif`;
      c.textAlign = 'right'; for (const [n, x] of this.hdr4) c.fillText(n, X(11.4 - 1.3), Y(x));
      c.font = `700 ${Math.round(0.95 * k)}px Arial, Helvetica, sans-serif`;
      c.textAlign = 'left'; for (const [n, x] of this.hdr10) c.fillText(n, X(-11.4 + 1.2), Y(x));
      // LED symbol
      c.strokeStyle = '#f2f2ee'; c.lineWidth = 0.28 * k; c.lineCap = 'round';
      c.beginPath(); c.arc(X(-7.5), Y(15.2), 2.0 * k, Math.PI, 0); c.lineTo(X(-5.5), Y(12.8)); c.lineTo(X(-9.5), Y(12.8)); c.closePath(); c.stroke();
    });
    const qv = new THREE.BufferGeometry();
    qv.setAttribute('position', new THREE.Float32BufferAttribute([-L / 2, 0, -Wd / 2, L / 2, 0, -Wd / 2, L / 2, 0, Wd / 2, -L / 2, 0, Wd / 2], 3));
    qv.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    qv.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1, 1, 0], 2));
    qv.setIndex([0, 2, 1, 0, 3, 2]);
    const over = new THREE.Mesh(qv, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    over.position.y = T + 0.02; over.raycast = () => {}; g.add(over);

    const frontTex = canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = '#efede4'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1a1a'; c.fillRect(22, 30, w - 44, h - 52);
      c.fillStyle = '#d6aa52'; for (let i = 0; i < 4; i++) c.fillRect(54 + i * 44, 52, 10, 30);
    });
    const fMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.6 });
    for (const sx of [1, -1]) {
      const mats = [M.whiteNylon, M.whiteNylon, M.whiteNylon, M.whiteNylon, M.whiteNylon, M.whiteNylon]; mats[sx > 0 ? 0 : 1] = fMat;
      const b = new THREE.Mesh(new RoundedBoxGeometry(4.25, 2.9, 6.0, 2, 0.15), mats); b.position.set(sx * 18.2, top + 1.45, 0); g.add(sub(b, 'th:qwiic'));
      for (const sz of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 1.5), M.tin); t.position.set(sx * 16.4, top + 0.17, sz * 3.5); g.add(sub(t, 'th:qwiic')); }
    }
    this.pinPos = { QA: { p: new THREE.Vector3(-18.2 - 2.125, top + 1.45, 0), d: new THREE.Vector3(-1, 0, 0) }, QB: { p: new THREE.Vector3(18.2 + 2.125, top + 1.45, 0), d: new THREE.Vector3(1, 0, 0) } };

    // eight LC8822-2020 RGB LEDs (2.0 × 2.0 mm), one every 3.3 mm along the centre line, each with its small SMD neighbours
    this.leds = [];
    for (let i = 0; i < 8; i++) {
      const x = 11.6 - i * 3.3;
      const pkg = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 2.0), new THREE.MeshStandardMaterial({ color: 0xc9c9c4, roughness: 0.5 })); pkg.position.set(x, top + 0.35, 0); g.add(sub(pkg, 'px:led'));
      const lens = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.5), new THREE.MeshBasicMaterial({ color: 0x4a4636, toneMapped: false })); lens.position.set(x, top + 0.74, 0); g.add(sub(lens, 'px:led'));
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0x000000, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      halo.scale.set(8, 8, 1); halo.position.set(x, top + 1.4, 0); halo.raycast = () => {}; g.add(halo);
      this.leds.push({ lens, halo });
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.6), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.5 })); d.position.set(x, top + 0.25, 2.2); g.add(sub(d, 'px:smd'));
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 1.0), new THREE.MeshStandardMaterial({ color: 0x8c7660, roughness: 0.5 })); r.position.set(x, top + 0.2, -2.1); g.add(sub(r, 'px:smd'));
    }
    // STM32C011F4 microcontroller (small black package, bottom-right of the drawing)
    const mcu = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.8, 3.0), new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.5 })); mcu.position.set(-10.4, top + 0.4, 9.2); g.add(sub(mcu, 'px:mcu'));
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10), new THREE.MeshStandardMaterial({ color: 0x8a8a8a })); dot.position.set(-9.2, top + 0.82, 8.1); g.add(sub(dot, 'px:mcu'));
    tagHW(g, 'pixels');
    for (const [o, id] of this._sub) o.traverse(x => { x.userData.hw = id; });
    this.setColors(null);
  }
  pin(name) {
    this.group.updateMatrixWorld(true);
    const q = this.group.getWorldQuaternion(new THREE.Quaternion());
    return { pos: this.group.localToWorld(this.pinPos[name].p.clone()), dir: this.pinPos[name].d.clone().applyQuaternion(q) };
  }
  /** colors: array of 8 entries [r, g, b, level 0..1] (level = global brightness) or null for all off */
  setColors(colors) {
    this.leds.forEach((l, i) => {
      const c = colors && colors[i];
      if (!c || c[3] <= 0 || (c[0] + c[1] + c[2]) === 0) { l.lens.material.color.set(0x4a4636); l.halo.material.color.set(0x000000); return; }
      const k = 0.35 + 0.65 * c[3];                      // shown brighter than linear so a low setting is still visible
      l.lens.material.color.setRGB(Math.min(1, 0.15 + c[0] / 255 * k), Math.min(1, 0.15 + c[1] / 255 * k), Math.min(1, 0.15 + c[2] / 255 * k));
      l.halo.material.color.setRGB(c[0] / 255 * k * 0.9, c[1] / 255 * k * 0.9, c[2] / 255 * k * 0.9);
    });
  }
}

// ---------------------------------------------------------------- Adafruit SHT31-D breakout, STEMMA QT version (product 2857)
// Geometry: Adafruit's open-source board file "Adafruit SHT31-D STEMMA QT Breakout.brd" (CC BY-SA, github.com/adafruit/
// Adafruit-SHT31-Sensor-Breakout-PCB): 25.40 x 17.78 mm, 2.54 mm corner arcs, plated mounting holes Ø2.5 at (2.54, 15.24) /
// (22.86, 15.24), unplated holes Ø2.54 at (2.54, 2.54) / (22.86, 2.54), U-shaped milled slot round the sensor, 7 header pads
// at y = 2.54 (VIN GND SCL SDA ADDR RST ALRT), JST SH sockets, sensor U2 at (12.76, 10.35).
// Surface: Adafruit's top photo "assets/2857.jpg" from the same repository (CC BY-SA), straightened onto the board's mm grid
// with the four holes (tools/pi4/README.md). Board coordinates (bx, by): mm, origin bottom-left, header row along the bottom.
// Local frame: origin = middle header pin (pad 4 at bx 12.7, by 2.54) at breadboard surface; board lies toward −z.
export class SHT31Breakout {
  constructor() {
    const g = this.group = new THREE.Group();
    const sub = (o, id) => { (this._sub ??= []).push([o, id]); return o; };
    const T = 1.6, y0 = 2.5, top = y0 + T;                  // header plastic 2.5 mm under the board
    const L = (bx, by, h) => new THREE.Vector3(bx - 12.7, h, -(by - 2.54));
    const tex = new THREE.TextureLoader().load(shtPhoto); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = M.aniso || 8;
    const uv = (bx, by) => [(bx + 1.0) / 27.4, (by + 1.0) / 19.78];
    const photo = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.5 });
    // ---- PCB outline, holes and slot (board coords; shape is built shifted so the header centre is the origin)
    const s = new THREE.Shape(), sx = 12.7, sy = 2.54, P2 = (x, y) => [x - sx, y - sy];
    s.moveTo(...P2(2.54, 0)); s.lineTo(...P2(22.86, 0)); s.absarc(...P2(22.86, 2.54), 2.54, -Math.PI / 2, 0); s.lineTo(...P2(25.4, 15.24));
    s.absarc(...P2(22.86, 15.24), 2.54, 0, Math.PI / 2); s.lineTo(...P2(2.54, 17.78)); s.absarc(...P2(2.54, 15.24), 2.54, Math.PI / 2, Math.PI);
    s.lineTo(...P2(0, 2.54)); s.absarc(...P2(2.54, 2.54), 2.54, Math.PI, Math.PI * 1.5);
    const hole = (x, y, r) => { const p = new THREE.Path(); p.absarc(...P2(x, y), r, 0, Math.PI * 2, true); s.holes.push(p); };
    hole(2.54, 15.24, 1.25); hole(22.86, 15.24, 1.25); hole(2.54, 2.54, 1.27); hole(22.86, 2.54, 1.27);
    for (let i = 0; i < 7; i++) hole(5.08 + i * 2.54, 2.54, 0.5);
    const slot = new THREE.Path(); [[8.4455, 13.1445], [16.9545, 13.1445], [16.9545, 7.1755], [16.0655, 7.1755], [16.0655, 12.192], [9.3345, 12.192], [9.3345, 7.1755], [8.4455, 7.1755]].reverse().forEach(([x, y], i) => i ? slot.lineTo(...P2(x, y)) : slot.moveTo(...P2(x, y))); s.holes.push(slot);
    const face = new THREE.ShapeGeometry(s, 24), fp = face.attributes.position, fu = face.attributes.uv;
    for (let i = 0; i < fp.count; i++) { const [u, v] = uv(fp.getX(i) + sx, fp.getY(i) + sy); fu.setXY(i, u, v); }
    face.rotateX(-Math.PI / 2); face.translate(0, top + 0.001, 0);
    g.add(sub(new THREE.Mesh(face, photo), 'sht:pcb'));
    const body = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 24 }); body.rotateX(-Math.PI / 2); body.translate(0, y0, 0);
    g.add(sub(new THREE.Mesh(body, [new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: 0x2b2b29, roughness: 0.8 })]), 'sht:pcb'));
    // ---- raised parts: the top face shows the photo at the same place, the sides take the part's real colour
    const part = (id, x0, by0, x1, by1, h, side, z0 = top) => {
      const w = x1 - x0, d = by1 - by0, geo = new THREE.BoxGeometry(w, h, d), pa = geo.attributes.position, na = geo.attributes.normal, ua = geo.attributes.uv;
      const cx = (x0 + x1) / 2, cy = (by0 + by1) / 2;
      for (let i = 0; i < pa.count; i++) if (na.getY(i) > 0.5) { const [u, v] = uv(cx + pa.getX(i), cy - pa.getZ(i)); ua.setXY(i, u, v); }
      const m = new THREE.Mesh(geo, [side, side, photo, side, side, side]); m.position.copy(L(cx, cy, z0 + h / 2)); g.add(sub(m, id)); return m;
    };
    const nylon = new THREE.MeshStandardMaterial({ color: 0xd8d6cc, roughness: 0.6 }), black = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.55 });
    const tan = new THREE.MeshStandardMaterial({ color: 0xc69a6b, roughness: 0.5 }), wh = new THREE.MeshStandardMaterial({ color: 0xe9e9e4, roughness: 0.5 });
    part('sht:jst', 20.63, 5.89, 24.88, 11.99, 2.9, nylon); part('sht:jst', 0.52, 5.79, 4.77, 11.89, 2.9, nylon);
    for (const [xo, dir] of [[24.88, 1], [0.52, -1]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.7, 4.4), new THREE.MeshBasicMaterial({ color: 0x0a0a0b })); m.position.copy(L(xo + dir * 0.05, 8.9, top + 1.45)); g.add(sub(m, 'sht:jst')); }
    part('sht:chip', 11.51, 9.10, 14.01, 11.60, 0.9, wh);                          // SHT31 DFN 2.5 x 2.5
    part('sht:pcb', 11.2, 5.5, 14.45, 7.1, 0.5, black);                            // R5 resistor pack
    part('sht:pcb', 6.49, 9.10, 7.74, 11.10, 0.9, tan);                            // C5 0805
    part('sht:pcb', 17.36, 5.0, 18.96, 5.8, 0.8, tan);                             // C6 0603
    part('sht:pcb', 5.6, 12.17, 7.2, 12.97, 0.45, black);                          // R1 0603
    part('sht:led', 2.76, 12.17, 4.36, 12.97, 0.6, new THREE.MeshPhysicalMaterial({ color: 0xdfe8df, roughness: 0.3, clearcoat: 0.6 }));   // D1 green power LED
    // ---- 7-pin male header soldered in: black spacer under the board, pins into the breadboard, short ends + solder on top
    const strip = new THREE.Mesh(new RoundedBoxGeometry(7 * 2.54, y0, 2.5, 1, 0.15), M.blackPlastic); strip.position.set(0, y0 / 2, 0); g.add(sub(strip, 'sht:pins'));
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * 2.54;
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.64, 6.0 + top + 1.4, 0.64), M.gold); pin.position.set(x, (top + 1.4 - 6.0) / 2, 0); g.add(sub(pin, 'sht:pins'));
      const sold = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.9, 16), M.solder); sold.position.set(x, top + 0.45, 0); g.add(sub(sold, 'sht:pins'));
    }
    tagHW(g, 'sht31');
    for (const [o, id] of this._sub) o.traverse(x => { x.userData.hw = id; });
  }
}

export const HW_INFO = {
  usbcable: {
    name: 'USB-C® cable', tag: 'Power + data',
    summary: 'Connects the UNO Q to your computer or to a USB-C power supply. It powers the board and carries data for Arduino App Lab.',
    points: ['The UNO Q requests 5 V / 3 A over USB Power Delivery. Use a full-featured (24-pin) USB-C cable and a supply rated for 5 V / 3 A.'],
    src: 'UNO Q datasheet §2.3, §3.1',
  },
  breadboard: {
    name: 'Solderless breadboard (400 tie-points)', tag: 'Prototyping',
    summary: 'Lets you build circuits without soldering. Inside, metal clips connect the holes.',
    points: [
      'In each numbered column, the five holes a–e are connected together; f–j are another separate group.',
      'The centre gap separates the two halves (that is where chips straddle).',
      'The long rails along the edges (+ red, − blue) are connected along their length — used for power and ground.',
    ],
    src: 'General electronics practice',
  },
  led: {
    name: '5 mm red LED', tag: 'Light-emitting diode',
    summary: 'An LED lights only when current flows from the anode (+) to the cathode (−).',
    points: [
      'Anode (+) = longer leg. Cathode (−) = shorter leg, next to the flat edge of the rim.',
      'A red LED typically drops about 1.8–2.2 V when lit (check its datasheet).',
      'Never connect an LED to a pin without a series resistor.',
    ],
    src: 'General electronics practice',
  },
  resistor: {
    name: '220 Ω resistor', tag: 'Colour code red-red-brown-gold',
    summary: 'Limits the current through the LED so the LED and the MCU pin stay safe.',
    points: [
      'Colour code: red (2) – red (2) – brown (×10) = 220 Ω, gold = ±5 % tolerance.',
      'Current ≈ (3.3 V − 2.0 V) ÷ 220 Ω ≈ 5.9 mA — far below the 20 mA absolute maximum of an STM32U585 pin.',
      'A resistor has no polarity: it can go in either way round.',
    ],
    src: 'Ohm’s law · ST STM32U585 datasheet Table 31',
  },
  pushbutton: {
    name: '6 × 6 mm tactile push button', tag: 'Momentary switch',
    summary: 'Closes a contact only while you press it. Click and hold it in the 3D view (or use the “Hold to press” button below) to press it.',
    points: [
      'It has 4 legs. Each pair of legs that face each other across the body is always connected inside; pressing joins the two pairs.',
      'Tip: wire it on diagonally opposite legs — then it works whichever way round it is inserted.',
    ],
    src: 'General electronics practice',
  },
  pot: {
    name: '10 kΩ potentiometer', tag: 'Variable voltage divider',
    summary: 'A resistor track between the two outer legs, with a sliding contact (the wiper) on the middle leg. Turning the knob moves the wiper, so its voltage goes smoothly from one end to the other.',
    points: [
      'Outer legs: 3V3 and GND. Middle leg (wiper): to an analog input such as A0.',
      'Drag the knob in the 3D view, or use the slider below, to turn it.',
    ],
    src: 'General electronics practice',
  },
  buzzer: {
    name: 'Passive piezo buzzer', tag: 'Sound',
    summary: 'A piezo disc that clicks once for every change of voltage. Fed with a square wave from tone(), it produces a note of that frequency.',
    points: [
      '“Passive” means it has no built-in oscillator — you must give it a signal. (An “active” buzzer beeps by itself when you apply DC.)',
      'The + leg is marked on the top; in this circuit it faces the resistor and the pin.',
    ],
    src: 'General electronics practice',
  },
  resistor10k: {
    name: '10 kΩ resistor', tag: 'Colour code brown-black-orange-gold',
    summary: 'The fixed half of a voltage divider. Together with the light sensor it turns a change in resistance into a change in voltage on A0.',
    points: ['Colour code: brown (1) – black (0) – orange (×1000) = 10 000 Ω = 10 kΩ, gold = ±5 %.', 'A resistor has no polarity.'],
    src: 'Resistor colour code (IEC 60062)',
  },
  ldr: {
    name: 'Photoresistor (LDR, GL5528)', tag: 'Light-dependent resistor',
    summary: 'Its resistance goes DOWN when more light falls on it: a very high resistance in the dark, only a few kΩ in a bright room.',
    points: [
      'GL5528 datasheet: 10–20 kΩ at 10 lux, at least 1 MΩ in the dark (measured 10 s after the light is switched off), γ = 0.6.',
      'Most sensitive to green light (peak 540 nm). Response time about 20 ms (getting brighter) and 30 ms (getting darker).',
      'It has no polarity — it can go in either way round.',
    ],
    src: 'GL55 series photoresistor datasheet',
  },
  tmp36: {
    name: 'TMP36 temperature sensor (TO-92)', tag: 'Analog output, 10 mV/°C',
    summary: 'Gives out a voltage that rises 10 mV for every °C: 0.75 V at 25 °C, 0.5 V at 0 °C. No calibration needed.',
    points: [
      'Supply 2.7–5.5 V — so the UNO Q 3V3 pin is fine.',
      'Pins (flat face toward you, legs down): left = +VS, middle = VOUT, right = GND.',
      'Accuracy: typically ±1 °C at 25 °C and ±2 °C over −40…+125 °C; the TO-92 version (TMP36GT9Z) is guaranteed within ±3 °C at 25 °C.',
      'Draws less than 50 µA, so it heats itself by less than 0.1 °C in still air.',
    ],
    warn: 'Check the flat face before powering up: if +VS and GND are swapped the sensor does not work and can be damaged.',
    src: 'Analog Devices TMP35/TMP36/TMP37 datasheet, Rev. F',
  },
  pir: {
    name: 'HC-SR501 PIR motion sensor', tag: 'Passive infrared · 3.3 V output',
    summary: 'Detects warm bodies that move across its view. OUT is 3.3 V while motion is detected, 0 V otherwise.',
    points: ['Supply 5–20 V → UNO Q 5V pin.', 'Pots: sensitivity (≈3–7 m) and time delay (≈5 s–5 min). Jumper: H repeatable, L single trigger.', 'About 1 minute to start up after power-on.'],
    warn: 'Keep lamps, heaters and moving air away from the lens — they cause false triggers (datasheet).',
    src: 'HC-SR501 datasheet · Handson HC-SR501 user guide',
  },
  'pir:lens': {
    name: 'Fresnel lens (white dome)', tag: 'HC-SR501 · Ø 23 mm',
    summary: 'Splits the view into many zones and focuses their infrared light onto the sensor under the dome.',
    points: ['Under it sits the pyroelectric sensor (datasheet: LHI778) with two sensing elements side by side.', 'A moving warm body crosses the zones → the two elements see it at different times → motion.'],
    src: 'HC-SR501 datasheet · Handson user guide',
  },
  'pir:biss': {
    name: 'BISS0001 signal-processing chip', tag: 'HC-SR501',
    summary: 'Amplifies the tiny signal from the sensor and turns it into a clean output pulse, with the delay and blocking times.',
    src: 'Handson HC-SR501 user guide (“LHI778 sensor and BISS0001 IC”)',
  },
  'pir:delay': {
    name: 'Time-delay pot', tag: 'How long OUT stays HIGH',
    summary: 'Sets how long OUT stays HIGH after motion is detected.',
    points: ['Clockwise → longer (about 300 s). Counter-clockwise → shorter (about 5 s).'],
    src: 'HC-SR501 datasheet (Adjustment)',
  },
  'pir:sens': {
    name: 'Sensitivity pot', tag: 'Detection range',
    summary: 'Sets how far away motion is detected.',
    points: ['Clockwise → farther (about 7 m). Counter-clockwise → closer (about 3 m).'],
    src: 'HC-SR501 datasheet (Adjustment)',
  },
  'pir:jumper': {
    name: 'Trigger-mode jumper', tag: 'H = repeat · L = single',
    summary: 'H (repeatable): every new motion restarts the delay, so OUT stays HIGH while someone keeps moving. L (single): OUT goes LOW when the delay ends, even if they still move.',
    src: 'HC-SR501 datasheet',
  },
  'pir:ldo': {
    name: '3.3 V regulator', tag: '“7133-1” in the schematic',
    summary: 'Turns the 5 V supply into the 3.3 V the module runs on — that is why OUT is a 3.3 V signal.',
    src: 'HC-SR501 datasheet (schematic)',
  },
  'pir:header': {
    name: '3-pin header', tag: 'VCC · OUT · GND',
    summary: 'Seen from the component side with the pins at the bottom: VCC (left), OUT (middle), GND (right). Click a single pin for details.',
    src: 'Handson HC-SR501 user guide (pin-out photo)',
  },
  'pir:VCC': { name: 'VCC pin', tag: 'Power in · 5–20 V', summary: 'Supply input. On the UNO Q connect it to the 5V pin — 3.3 V is below the minimum.', src: 'HC-SR501 datasheet' },
  'pir:OUT': { name: 'OUT pin', tag: 'Signal · 3.3 V / 0 V', summary: '3.3 V while motion is detected, 0 V otherwise. Safe on any UNO Q digital pin; here it goes to D2.', src: 'HC-SR501 datasheet' },
  'pir:GND': { name: 'GND pin', tag: 'Ground', summary: 'Connect to a GND pin of the UNO Q.', src: 'HC-SR501 datasheet' },
  'pir:stand': { name: 'Acrylic stand', tag: 'Not part of the module', summary: 'Just holds the sensor upright so the lens faces the area you want to watch.', src: '—' },
  hand: {
    name: 'A hand (warm object)', tag: 'Simulated',
    summary: 'Your hand gives off infrared heat. Waving it across in front of the lens is the easiest way to test a PIR.',
    src: 'Simulation',
  },
  'us:T': { name: 'Transmitter “T”', tag: 'HC-SR04 · sends sound', summary: 'Sends a burst of 8 pulses of 40 kHz ultrasound when TRIG gets a 10 µs pulse.', src: 'HC-SR04 datasheet' },
  'us:R': { name: 'Receiver “R”', tag: 'HC-SR04 · hears the echo', summary: 'Listens for the echo. ECHO stays HIGH until the echo arrives.', src: 'HC-SR04 datasheet' },
  'us:xtal': { name: 'Crystal Y1', tag: 'HC-SR04', summary: 'A quartz crystal: gives the module’s circuit a stable timing reference.', src: 'HC-SR04 datasheet photo' },
  'us:pins': { name: '4-pin header', tag: 'VCC · Trig · Echo · GND', summary: 'VCC to 5V, Trig to D7, Echo to D8 (5 V-tolerant), GND to GND.', src: 'HC-SR04 datasheet · UNO Q datasheet' },
  servo: { name: 'SG90 micro servo', tag: '180° · 5 V', summary: 'A small motor with gears and a position sensor that turns to the angle you ask for and holds it.', src: 'SG90 datasheet' },
  'sv:horn': { name: 'Horn (servo arm)', tag: 'SG90', summary: 'The white arm on the output shaft. You fix things to its small holes — it turns to the commanded angle.', src: 'SG90 datasheet' },
  'sv:shaft': { name: 'Output shaft', tag: 'SG90', summary: 'The splined shaft that the horn pushes onto. Its total travel is about 180°.', src: 'SG90 datasheet' },
  'sv:case': { name: 'Case with motor and gears', tag: 'SG90 · 22.2 × 11.8 mm', summary: 'Inside: a small DC motor, plastic reduction gears and a position sensor with control electronics. Weight about 9 g.', src: 'SG90 datasheet' },
  'sv:tabs': { name: 'Mounting tabs', tag: 'SG90', summary: 'Two tabs with screw holes to fix the servo to your project.', src: 'SG90 datasheet' },
  'sv:cable': { name: 'Servo cable', tag: 'Brown · Red · Orange', summary: 'Brown = GND, red = +5 V, orange = signal (the pulses).', src: 'SG90 datasheet' },
  'sv:plug': { name: '3-pin plug on a header', tag: '2.54 mm', summary: 'The servo’s female plug sits on a 3-pin male header pushed into the breadboard (holes j11–j13).', src: '—' },
  'drv:p1': { name: 'Pin 1 · 1,2EN (enable)', tag: 'L293D', summary: 'Turns outputs 1Y and 2Y on (HIGH) or off (LOW). Here: D5 — a PWM signal sets the motor speed.', src: 'TI L293x datasheet' },
  'drv:p2': { name: 'Pin 2 · 1A (input)', tag: 'L293D', summary: 'Sets output 1Y HIGH or LOW. Here: D7.', src: 'TI L293x datasheet' },
  'drv:p3': { name: 'Pin 3 · 1Y (output)', tag: 'L293D', summary: 'Drives one motor wire. Here: the motor’s white wire.', src: 'TI L293x datasheet' },
  'drv:p4': { name: 'Pin 4 · ground', tag: 'L293D', summary: 'Ground and heat-sink pin. Pins 4, 5, 12 and 13 are all ground.', src: 'TI L293x datasheet' },
  'drv:p5': { name: 'Pin 5 · ground', tag: 'L293D', summary: 'Ground and heat-sink pin. Here: battery − and (via i16) the UNO Q GND.', src: 'TI L293x datasheet' },
  'drv:p6': { name: 'Pin 6 · 2Y (output)', tag: 'L293D', summary: 'Drives the other motor wire. Here: the motor’s green wire.', src: 'TI L293x datasheet' },
  'drv:p7': { name: 'Pin 7 · 2A (input)', tag: 'L293D', summary: 'Sets output 2Y HIGH or LOW. Here: D8.', src: 'TI L293x datasheet' },
  'drv:p8': { name: 'Pin 8 · VCC2 (motor power)', tag: 'L293D', summary: 'Power for the outputs, VCC1 … 36 V. Here: battery + (4 × AA ≈ 6 V).', src: 'TI L293x datasheet' },
  'drv:p9': { name: 'Pin 9 · 3,4EN', tag: 'L293D', summary: 'Enable for the second channel (3Y, 4Y) — a second motor could go here. Not used.', src: 'TI L293x datasheet' },
  'drv:p10': { name: 'Pin 10 · 3A', tag: 'L293D', summary: 'Input of channel 3. Not used.', src: 'TI L293x datasheet' },
  'drv:p11': { name: 'Pin 11 · 3Y', tag: 'L293D', summary: 'Output of channel 3. Not used.', src: 'TI L293x datasheet' },
  'drv:p12': { name: 'Pin 12 · ground', tag: 'L293D', summary: 'Ground and heat-sink pin.', src: 'TI L293x datasheet' },
  'drv:p13': { name: 'Pin 13 · ground', tag: 'L293D', summary: 'Ground and heat-sink pin. Here: UNO Q GND.', src: 'TI L293x datasheet' },
  'drv:p14': { name: 'Pin 14 · 4Y', tag: 'L293D', summary: 'Output of channel 4. Not used.', src: 'TI L293x datasheet' },
  'drv:p15': { name: 'Pin 15 · 4A', tag: 'L293D', summary: 'Input of channel 4. Not used.', src: 'TI L293x datasheet' },
  'drv:p16': { name: 'Pin 16 · VCC1 (logic power)', tag: 'L293D', summary: '5 V supply for the chip’s logic (4.5–7 V). Here: UNO Q 5V.', src: 'TI L293x datasheet' },
  l293d: { name: 'L293D motor driver', tag: 'H-bridge · 600 mA/channel', summary: 'Four half-H drivers in one chip. Two of them form an H-bridge that can drive one DC motor in both directions.', src: 'TI L293x datasheet' },
  'drv:chip': { name: 'L293D (DIP-16 package)', tag: '19.8 × 6.35 mm', summary: 'Small signals on EN, 1A and 2A switch up to 600 mA per output (1.2 A peak) from VCC2. The “D” version has built-in clamp diodes against motor voltage spikes.', points: ['The half-moon notch marks the pin-1 end.'], src: 'TI L293x datasheet' },
  battery: { name: '4 × AA battery holder', tag: '≈ 6 V for the motor', summary: 'Four 1.5 V cells in series ≈ 6 V. Red lead = +, black lead = −.', src: '—' },
  'bat:holder': { name: 'Battery holder', tag: '4 × AA in series', summary: 'Springs and contacts connect the four cells one after another, so their voltages add up: 4 × 1.5 V ≈ 6 V.', src: '—' },
  'bat:cell': { name: 'AA cell', tag: '1.5 V', summary: 'One AA cell gives about 1.5 V when new.', src: '—' },
  motor: { name: '“130” DC hobby motor', tag: '6 V rated', summary: 'A small brushed DC motor. Current through it in one direction → it spins one way; reverse the current → the other way.', src: 'Adafruit #711 spec' },
  'mot:can': { name: 'Motor can', tag: '27.5 × 20 × 15 mm', summary: 'Steel housing with the magnets; the rotor with its coils turns inside.', src: 'Adafruit #711 spec' },
  'mot:bell': { name: 'End cap', tag: 'Brushes inside', summary: 'Holds the brushes that feed current to the spinning rotor coils.', src: '—' },
  'mot:shaft': { name: 'Shaft', tag: 'Ø 2 mm × 8 mm', summary: 'The propeller is pressed onto it.', src: 'Adafruit #711 spec' },
  'mot:term': { name: 'Motor terminals', tag: '2 tabs', summary: 'The two wires are soldered here. A DC motor has no + or −: swapping the wires reverses the direction.', src: '—' },
  'mot:prop': { name: 'Propeller', tag: 'Shows speed and direction', summary: 'Makes the rotation easy to see. The yellow blade helps you follow it.', src: '—' },
  'mot:stand': { name: 'Motor stand', tag: 'Holds the motor', summary: 'Keeps the motor upright so the propeller can spin freely.', src: '—' },
  lead: { name: 'Lead wire', tag: 'Stranded, tinned end', summary: 'The tinned end is pushed straight into a breadboard hole.', src: '—' },
  'rel:in': { name: 'Input screw terminal', tag: 'DC+ · DC− · IN', summary: 'Three screw terminals for the control side: DC+ (5 V), DC− (ground) and IN (the signal from the UNO Q).', src: 'Handsontec 1-channel relay module guide' },
  'rel:out': { name: 'Output screw terminal', tag: 'NO · COM · NC', summary: 'The three terminals of the relay switch. COM is the common contact; it touches NC when the relay is off and NO when it is on.', src: 'Handsontec 1-channel relay module guide' },
  'rel:DCP': { name: 'DC+ terminal', tag: 'Power in · 5 V', summary: 'Supply for the module and the relay coil. Goes to the UNO Q 5V pin.', src: 'Handsontec 1-channel relay module guide' },
  'rel:DCN': { name: 'DC− terminal', tag: 'Ground', summary: 'Goes to a UNO Q GND pin.', src: 'Handsontec 1-channel relay module guide' },
  'rel:IN': { name: 'IN terminal', tag: 'Signal', summary: 'The control input. On this low-level-trigger module the relay switches ON when IN is LOW. Goes to D4.', src: 'Handsontec 1-channel relay module guide' },
  'rel:NO': { name: 'NO terminal', tag: 'Normally open', summary: 'Not connected to COM when the relay is off; connected to COM when the relay is on. Our lamp goes here.', src: 'Handsontec 1-channel relay module guide' },
  'rel:COM': { name: 'COM terminal', tag: 'Common', summary: 'The moving contact. Battery + goes here.', src: 'Handsontec 1-channel relay module guide' },
  'rel:NC': { name: 'NC terminal', tag: 'Normally closed', summary: 'Connected to COM when the relay is off; disconnected when the relay is on. Not used in this lesson.', src: 'Handsontec 1-channel relay module guide' },
  'rel:relay': { name: 'Relay JQC-3FF-S-Z', tag: '5 V coil · SPDT', summary: 'An electromagnet that moves a switch. Contacts: AC 250 V / 10 A, DC 30 V / 10 A (module guide).', src: 'Handsontec 1-channel relay module guide' },
  'rel:coil': { name: 'Coil and iron core', tag: 'The electromagnet', summary: 'Current through the copper coil makes the iron core a magnet that pulls the armature.', src: 'Handsontec 1-channel relay module guide' },
  'rel:arm': { name: 'Armature and spring', tag: 'Moves the switch', summary: 'Pulled down by the coil; the spring pulls it back when the current stops.', src: 'Handsontec 1-channel relay module guide' },
  'rel:blade': { name: 'Moving contact', tag: 'Connected to COM', summary: 'The blade that swings between the NC and NO contacts.', src: 'Handsontec 1-channel relay module guide' },
  'rel:nc': { name: 'NC contact', tag: 'Normally closed', summary: 'Touches the blade while the coil is off.', src: 'Handsontec 1-channel relay module guide' },
  'rel:no': { name: 'NO contact', tag: 'Normally open', summary: 'Touches the blade only while the coil is energised.', src: 'Handsontec 1-channel relay module guide' },
  'rel:opto': { name: 'Optocoupler 817C', tag: 'Electrical isolation', summary: 'An LED and a light sensor in one package: the signal crosses as light, so the UNO Q side is electrically separated from the coil driver.', src: 'Handsontec 1-channel relay module guide' },
  'rel:q1': { name: 'Driver transistor', tag: 'Switches the coil', summary: 'A transistor switches the coil current, which is far more than a UNO Q pin can give.', src: 'Handsontec 1-channel relay module guide' },
  'rel:d1': { name: 'Flyback diode', tag: 'Protects the transistor', summary: 'Absorbs the voltage spike the coil makes when the current is switched off.', src: 'Handsontec 1-channel relay module guide' },
  'rel:r': { name: 'Resistor', tag: 'Limits current', summary: 'R1 = 1 kΩ and R2 = 510 Ω in the guide’s schematic.', src: 'Handsontec 1-channel relay module guide' },
  'rel:pwr': { name: 'Power LED', tag: 'Lit when DC+ has power', summary: 'Shows that the module is powered.', src: 'Handsontec 1-channel relay module guide' },
  'rel:led': { name: 'Relay LED', tag: 'Lit when the relay is on', summary: 'On this module it lights when the input pin is LOW (relay energised).', src: 'Handsontec 1-channel relay module guide' },
  'rel:jumper': { name: 'Trigger-level jumper', tag: 'H / L', summary: 'Selects high-level (H) or low-level (L) trigger. Here it is on L: the relay switches on when IN is LOW.', src: 'Handsontec 1-channel relay module guide' },
  'relaymod': { name: '1-channel 5 V relay module', tag: '50 × 25 mm · optocoupler', summary: 'Lets a small signal switch a separate circuit, with electrical isolation. Contacts up to DC 30 V / 10 A or AC 250 V / 10 A.', src: 'Handsontec 1-channel relay module guide' },
  'lamp': { name: 'Miniature lamp (E10)', tag: 'Our safe load', summary: 'A small incandescent lamp in a holder. It glows when current flows through its filament.', src: 'Handsontec 1-channel relay module guide' },
  'lamp:bulb': { name: 'Bulb with filament', tag: 'E10 screw base', summary: 'The thin tungsten filament heats up and glows when current flows.', src: 'Handsontec 1-channel relay module guide' },
  'lamp:holder': { name: 'Lamp holder', tag: 'E10 socket', summary: 'Holds the bulb and connects it to the two screw terminals.', src: 'Handsontec 1-channel relay module guide' },
  'lamp:term': { name: 'Lamp terminals', tag: '2 screws', summary: 'One goes to the relay NO terminal, the other to battery −.', src: 'Handsontec 1-channel relay module guide' },
  'sht:pcb': { name: 'SHT31-D breakout board', tag: '25.4 × 17.8 mm · STEMMA QT', summary: 'The small black board that carries the sensor, two connectors and the pins. The cut-out slot around the sensor keeps heat from the rest of the board away from it.', points: ['Size from Adafruit’s open-source board file: 25.40 × 17.78 mm.', 'Silkscreen pins: VIN, GND, SCL, SDA, ADDR, RST, ALRT.'], src: 'Adafruit SHT31-D board file (GitHub) and guide' },
  'sht:led': { name: 'Power LED', tag: 'Marked “on”', summary: 'A small green LED that lights when the board has power.', src: 'Adafruit SHT31-D board file (D1, GREEN)' },
  'sht:chip': { name: 'SHT31-D sensor chip', tag: 'Temperature + humidity', summary: 'A Sensirion sensor that measures both temperature and relative humidity and sends the numbers over I²C. Adafruit gives its accuracy as about ±0.3 °C and ±2 %RH.', points: ['A PTFE filter keeps it clean while still letting humidity through.', 'Default I²C address 0x44; 0x45 if ADDR is tied to VIN.'], src: 'Adafruit SHT31-D product page and guide' },
  'sht:pins': { name: 'Header pins', tag: 'VIN · GND · SCL · SDA …', summary: 'Seven pins plugged into the breadboard. We use four: VIN (3.3 V power), GND, SCL (clock) and SDA (data). ADDR, RST and ALRT stay unconnected.', warn: 'On a Raspberry Pi power VIN from 3V3 (pin 1), not from 5 V.', src: 'Adafruit SHT31-D guide — Pinouts, Python wiring' },
  'sht:jst': { name: 'STEMMA QT sockets', tag: '2 × JST SH', summary: 'Two identical sockets for a Qwiic / STEMMA QT cable (as in Lessons 18–19 of the UNO Q course). The Raspberry Pi 4 has no such socket, so here we use the header pins instead.', src: 'Adafruit SHT31-D product page' },
  'sht31': { name: 'Adafruit SHT31-D breakout', tag: 'I²C temperature + humidity', summary: 'A digital temperature and humidity sensor on a breakout board. It talks to the Raspberry Pi over I²C with just four wires: power, ground, clock and data.', points: ['Powered with 2.5–5 V; on a Raspberry Pi use 3.3 V.', 'SCL and SDA have 10 kΩ pull-ups on the board.'], src: 'Adafruit SHT31-D product page and guide' },
  'th:pcb': { name: 'Modulino Thermo circuit board', tag: '41 × 25.36 mm · 1.6 mm thick', summary: 'The blue board that carries everything. Four Ø3.2 mm mounting holes are spaced 16 mm × 32 mm.', points: ['Hardware version V0.5 or later has the black GXHT30C sensor; earlier boards have a silver HS3003.'], src: 'Modulino Thermo datasheet §2.1, §2.3, §6.1' },
  'th:sensor': { name: 'GXHT30C sensor', tag: 'Temp + humidity', summary: 'A single chip that measures both temperature and relative humidity and sends the numbers over I²C (address 0x45).', points: ['The black film is a dustproof, breathable cover — it must not be removed.', 'Datasheet: −45…+130 °C (±0.3 °C typ.), 0…100 %RH (±3 %RH typ.). Recommended use: 5…60 °C and 20…80 %RH.'], src: 'Modulino Thermo datasheet §2.2' },
  'th:qwiic': { name: 'Qwiic connector (J1 / J2)', tag: 'SM04B-SRSS-TB · 4 pins', summary: 'Two identical connectors wired in parallel: one goes to the UNO Q, the other lets you daisy-chain another module.', points: ['The four pins are GND, +3.3 V, SDA and SCL.'], warn: 'Power the module with 3.3 V only — never 5 V.', src: 'Modulino Thermo datasheet §4.4' },
  'th:led': { name: 'Power LED', tag: 'Green · LTST-C190KGKT', summary: 'Lights when the module has 3.3 V power. It is fed through a 1 kΩ resistor.', src: 'Modulino Thermo datasheet §4.7' },
  'th:r': { name: 'Resistors and capacitors', tag: 'Supporting parts', summary: 'Pull-up resistors for the ADDR and nRST pins, plus decoupling capacitors (4.7 µF and 100 nF) next to the sensor.', src: 'Modulino Thermo datasheet §4.3, §4.5' },
  'thermo': { name: 'Arduino Modulino® Thermo', tag: 'ABX00103 · Qwiic', summary: 'A small board with a temperature and humidity sensor. Plug it into the UNO Q with one Qwiic cable — no breadboard and no loose wires.', points: ['Powered by 3.3 V from the Qwiic cable; there is no voltage regulator on the module.', 'Headers J4 (GND, 3V3, SDA, SCL) and J3 (GND, 3V3, ADDR, nRST, ALERT) are for direct wiring; they are not used here.'], warn: 'Never connect it to 5 V.', src: 'Modulino Thermo datasheet' },
  'qwiiccable': { name: 'Qwiic cable', tag: '4 wires · 3.3 V I²C', summary: 'A 4-wire cable with a small polarised plug at each end. It carries power and the two I²C signals, so this one cable is the whole wiring.', points: ['Standard Qwiic colours: black = GND, red = 3.3 V, blue = SDA (data), yellow = SCL (clock).', 'The plug only fits one way round, so the wires cannot be swapped.'], src: 'SparkFun Qwiic system · Modulino Thermo datasheet §4.4' },
  'px:pcb': { name: 'Modulino Pixels circuit board', tag: '41 × 25.36 mm · 1.6 mm thick', summary: 'Same size and mounting holes (Ø3.2 mm, 16 × 32 mm) as every Modulino node, so they can be stacked or screwed side by side.', src: 'Modulino Pixels datasheet §7.4' },
  'px:led': { name: 'RGB LED (LC8822-2020)', tag: '1 of 8 · full colour', summary: 'Each LED holds a red, a green and a blue light and can show any mix. The eight are controlled one by one.', points: ['Datasheet: up to 33 mA per LED at full brightness (8 LEDs = 264 mA).'], src: 'Modulino Pixels datasheet §2, §4.1' },
  'px:mcu': { name: 'STM32C011F4 microcontroller', tag: 'The module’s own brain', summary: 'It listens on the I²C bus (address 0x6C) and drives the eight LEDs, so the UNO Q only has to send short commands.', src: 'Modulino Pixels datasheet §7, §7.5' },
  'px:smd': { name: 'Small SMD parts', tag: 'Supporting parts', summary: 'Tiny parts next to each LED that belong to its supply and signal circuit.', src: 'Modulino Pixels datasheet (pinout drawing)' },
  'pixels': { name: 'Arduino Modulino® Pixels', tag: 'ABX00109 · Qwiic', summary: 'A strip of eight RGB LEDs controlled over I²C. Plug it into the Qwiic bus and it shows colours, bars or status lights.', points: ['Powered by 3.3 V through Qwiic. Default I²C address 0x6C.', 'The 1×10 header (LED & MCU signals) and 1×4 header are for direct wiring and are not used here.'], warn: '3.3 V only — never 5 V.', src: 'Modulino Pixels datasheet' },
  obstacle: {
    name: 'Obstacle', tag: 'Drag it closer or farther',
    summary: 'A flat object in front of the sensor. Drag it in the 3D view or use the slider; the label shows the real distance.',
    src: 'Simulation',
  },
  hcsr04: {
    name: 'HC-SR04 ultrasonic distance sensor', tag: '2 cm – 4 m',
    summary: 'Sends a short burst of 40 kHz ultrasound (too high for humans to hear) and outputs a pulse whose length equals the time the echo took to come back.',
    points: [
      'Datasheet: 5 V supply, 15 mA, range 2 cm – 4 m, measuring angle 15°, resolution down to 3 mm.',
      'Start a measurement with a ≥ 10 µs HIGH pulse on Trig. Echo then stays HIGH for the round-trip time: µs ÷ 58 = cm.',
      'Wait more than 60 ms between measurements, so an old echo is not mistaken for a new one.',
      'Works best on flat, hard objects of at least 0.5 m² (datasheet); soft or angled objects reflect less sound.',
    ],
    warn: 'Echo outputs 5 V. On the UNO Q connect it only to a 5 V-tolerant digital pin (e.g. D8) — never to D3 or A0–A5.',
    src: 'Elecfreaks HC-SR04 datasheet · Arduino UNO Q datasheet §9.6',
  },
  jumper: {
    name: 'Jumper wire (male–male)', tag: 'Connection',
    summary: 'Connects a header socket on the UNO Q to a hole on the breadboard.',
    points: ['Wire colour has no electrical meaning, but by convention black = GND and red = power.'],
    src: 'General electronics practice',
  },
};

export { DESK_Y };

// External hardware used in the lessons: USB-C cable, breadboard, LED, resistor, jumper wires.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, canvasTex, noise } from './materials.js';
import { P, haloTexture } from './board.js';

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
  cable.position.copy(mouth);
  cable.position.x += 6.2;             // plug tip seated inside the receptacle
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
const WIRE = { red: 0xd8261e, black: 0x1b1b1b, yellow: 0xf2c21b, blue: 0x2369d6, green: 0x23a046, orange: 0xf07a16, white: 0xeeeeee };
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
    for (const x of [-13, 13]) {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, L, 72, 1, true), alu);
      can.rotation.x = Math.PI / 2; can.position.set(x, cy, z0 + L / 2); g.add(can);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(7.7, 0.32, 14, 72), alu); lip.position.set(x, cy, z0 + L - 0.05); g.add(lip);
      const ring = new THREE.Mesh(new THREE.RingGeometry(6.1, 7.55, 72), dark); ring.position.set(x, cy, z0 + L - 0.25); g.add(ring);
      const well = new THREE.Mesh(new THREE.CylinderGeometry(6.15, 6.15, 1.4, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.9, side: THREE.BackSide }));
      well.rotation.x = Math.PI / 2; well.position.set(x, cy, z0 + L - 0.95); g.add(well);
      const face = new THREE.Mesh(new THREE.CircleGeometry(6.15, 64), grille); face.position.set(x, cy, z0 + L - 1.6); g.add(face);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(8.15, 8.15, 0.5, 72), dark); foot.rotation.x = Math.PI / 2; foot.position.set(x, cy, z0 + 0.25); g.add(foot);
    }
    // crystal Y1 (HC-49S style metal can lying on the PCB)
    const xtal = new THREE.Mesh(new THREE.CapsuleGeometry(2.25, 6.0, 8, 24), new THREE.MeshStandardMaterial({ color: 0xe6e6e6, metalness: 1, roughness: 0.22 }));
    xtal.rotation.z = Math.PI / 2; xtal.scale.set(1, 1, 0.78); xtal.position.set(0, y0 + H - 3.4, z0 + 1.75); g.add(xtal);
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
    const hdr = new THREE.Mesh(new THREE.BoxGeometry(10.16, 2.5, 2.5), M.blackPlastic); hdr.position.set(0, y0 - 1.25, 0); g.add(hdr);
    for (const x of [-3.81, -1.27, 1.27, 3.81]) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.64, 9.0, 0.64), M.gold); pin.position.set(x, y0 + 1.5 - 4.5, 0); g.add(pin);
      const fil = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.7, 16), M.solder); fil.position.set(x, y0 + 1.4, T / 2 + 0.35); fil.rotation.x = -Math.PI / 2; g.add(fil);
    }
    tagHW(g, 'hcsr04');
    this.beamZ = z0 + L;                      // front plane of the transducers
    this.beamY = cy;
    this.tx = -13; this.rx = 13;              // T (transmitter) left, R (receiver) right, seen from the front
  }
}

export async function dropIn(obj, from = 30, ms = 700) {
  const y = obj.position.y;
  obj.visible = true;
  await tween(ms, e => { obj.position.y = y + from * (1 - e); });
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

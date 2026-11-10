// Arduino UNO R3 (A000066) 3D model.
// Geometry: Arduino's official open-source board file UNO-TH_Rev3e.brd (CC BY-SA 4.0): outline, mounting holes, every pad,
// track and silkscreen line (baked into the PCB textures by tools/uno3/build_uno3_pcb.py), and the position and rotation of
// every component. Component bodies use the package sizes named in the board file (DIL28, SOT223, 0603, 0805, MLF32 …).
// Heights of the connectors are typical values for those parts; the female headers are 8.5 mm (package name "1X..-H8.5").
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, canvasTex, chipTopTexture, noise } from '../materials.js';
import { haloTexture } from '../board.js';
import boardData from '../../assets/uno3/board_data.json';
import topAlbedo from '../../assets/uno3/pcb_top_albedo.jpg';
import topOrm from '../../assets/uno3/pcb_top_orm.jpg';
import topBump from '../../assets/uno3/pcb_top_bump.jpg';
import botAlbedo from '../../assets/uno3/pcb_bottom_albedo.jpg';
import botOrm from '../../assets/uno3/pcb_bottom_orm.jpg';
import botBump from '../../assets/uno3/pcb_bottom_bump.jpg';
import { U3_PINS } from './data.js';

export const W = 68.58, H = 53.34, T = 1.6;
export const P = (x, y, z = 0) => new THREE.Vector3(x - W / 2, z, -(y - H / 2));
const EL = Object.fromEntries(boardData.elements.map(e => [e.name, e]));
const loader = new THREE.TextureLoader();
function tex(url, srgb) {
  const t = loader.load(url); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = M.aniso || 8; t.repeat.set(1 / W, 1 / H); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}
/** box centred at board (cx, cy), long side `l` along the angle `rot` (degrees, board frame), width `w`, from z0 up by `h` */
function body(cx, cy, l, w, z0, h, mat, rot = 0, r = 0) {
  const g = r > 0 ? new RoundedBoxGeometry(l, h, w, 2, r) : new THREE.BoxGeometry(l, h, w);
  const m = new THREE.Mesh(g, mat); m.position.copy(P(cx, cy, z0 + h / 2)); m.rotation.y = rot * Math.PI / 180; return m;
}

export class Uno3Board {
  constructor() {
    this.group = new THREE.Group(); this.group.name = 'Arduino UNO R3';
    this.parts = {}; this.proxies = []; this.pins = {}; this.leds = {};
    this.powered = false;
    // USB-B receptacle: opening faces −x at the left edge (X2 at x 3.81 … body to x −6.35)
    this.usbMouth = P(-6.3, 38.1, 5.4); this.usbRotY = 0; this.usbKind = 'usbb';
    this.build();
  }
  part(id) { if (!this.parts[id]) { const g = new THREE.Group(); g.name = id; g.userData.part = id; this.parts[id] = g; this.group.add(g); } return this.parts[id]; }
  add(id, obj) { obj.traverse(o => { o.userData.part = id; }); this.part(id).add(obj); return obj; }
  proxy(id, cx, cy, z0, sx, sy, sz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sz, sy), M.invisible);
    m.position.copy(P(cx, cy, z0 + sz / 2)); m.userData.part = id; m.userData.proxy = true; this.group.add(m); this.proxies.push(m); return m;
  }

  build() {
    this.mat = {
      black: M.blackPlastic, chip: new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.55 }),
      steel: M.steel, tin: M.tin, pin: new THREE.MeshStandardMaterial({ color: 0xd9b56a, roughness: 0.25, metalness: 1 }),
      socket: new THREE.MeshStandardMaterial({ color: 0x232325, roughness: 0.5 }),
      capBody: new THREE.MeshStandardMaterial({ color: 0x8c6b4a, roughness: 0.6 }), resBody: new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.55 }),
    };
    this.buildPCB(); this.buildHeaders(); this.buildConnectors(); this.buildChips(); this.buildSmall(); this.buildLEDs();
    for (const h of boardData.holes.filter(h => !h.plated)) this.proxy('holes', h.x, h.y, -T - 0.1, 5.4, 5.4, T + 0.3);
    this.group.traverse(o => {
      if (o.isMesh && !o.userData.proxy) { o.castShadow = true; o.receiveShadow = true; }
      if (o.isSprite || (o.material && o.material.blending === THREE.AdditiveBlending)) { o.raycast = () => {}; o.castShadow = false; }
    });
  }

  // ------------------------------------------------------------ PCB from the board-file outline
  buildPCB() {
    const shape = new THREE.Shape(boardData.outline.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const h of boardData.holes.filter(h => !h.plated)) { const p = new THREE.Path(); p.absarc(h.x, h.y, h.d / 2, 0, Math.PI * 2, true); shape.holes.push(p); }
    const mk = (a, o, b) => new THREE.MeshPhysicalMaterial({ map: tex(a, true), roughnessMap: tex(o, false), metalnessMap: tex(o, false), bumpMap: tex(b, false), roughness: 1, metalness: 1, bumpScale: 2.0, clearcoat: 0.25, clearcoatRoughness: 0.38 });
    const top = mk(topAlbedo, topOrm, topBump), bot = mk(botAlbedo, botOrm, botBump); bot.side = THREE.BackSide;
    const face = new THREE.ShapeGeometry(shape, 24); face.rotateX(-Math.PI / 2); face.translate(-W / 2, 0, H / 2);
    const eg = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 24 }); eg.rotateX(-Math.PI / 2); eg.translate(-W / 2, -T, H / 2);
    const g = new THREE.Group(); g.add(new THREE.Mesh(face, top), new THREE.Mesh(face.clone().translate(0, -T, 0), bot), new THREE.Mesh(eg, [M.invisible, M.pcbEdge]));
    this.add('pcb', g);
  }

  // ------------------------------------------------------------ female headers (8.5 mm) and the two ICSP headers
  buildHeaders() {
    const sock = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.9 });
    const fem = (id, names) => {
      const pads = names.map(n => U3_PINS.find(p => p.id === n));
      const xs = pads.map(p => p.x), y = pads[0].y, x0 = Math.min(...xs) - 1.27, x1 = Math.max(...xs) + 1.27;
      const g = new THREE.Group();
      g.add(body((x0 + x1) / 2, y, x1 - x0, 2.54, 0, 8.5, this.mat.black, 0, 0.12));
      for (const p of pads) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 1.0), sock); s.position.copy(P(p.x, p.y, 8.4)); g.add(s);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 0.6, 10), M.solder); t.position.copy(P(p.x, p.y, -T - 0.3)); g.add(t);
        this.pins[p.id] = { pos: P(p.x, p.y, 8.5), x: p.x, y: p.y, header: p.header, depth: 5.0 };
        const pr = this.proxy('pin:' + p.id, p.x, p.y, 7.0, 2.2, 2.2, 1.8); pr.userData.pin = p.id;
      }
      this.add(id, g);
    };
    fem('jdigital', ['SCL', 'SDA', 'AREF', 'GND1', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8']);
    fem('jdigital', ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0']);
    fem('jpower', ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND2', 'GND3', 'VIN']);
    fem('janalog', ['A0', 'A1', 'A2', 'A3', 'A4', 'A5']);
    // ICSP headers: 2 x 3 male pins, 2.5 mm plastic base, pins 6 mm above it
    for (const [id, el] of [['icsp', 'ICSP'], ['icsp1', 'ICSP1']]) {
      const e = EL[el], xs = e.pads.map(p => p.x), ys = e.pads.map(p => p.y), g = new THREE.Group();
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      g.add(body(cx, cy, Math.max(...xs) - Math.min(...xs) + 2.54, Math.max(...ys) - Math.min(...ys) + 2.54, 0, 2.5, this.mat.black, 0, 0.1));
      for (const p of e.pads) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.64, 8.6, 0.64), this.mat.pin); m.position.copy(P(p.x, p.y, 4.1)); g.add(m); }
      this.add(id, g);
    }
  }

  // ------------------------------------------------------------ USB-B, DC jack, reset button
  buildConnectors() {
    // USB-B receptacle (X2): metal shell 16 x 12 mm, about 10.9 mm high, opening toward −x
    const ub = new THREE.Group(), sh = this.mat.steel;
    const x0 = -6.35, x1 = 9.65, y0 = 32.1, y1 = 44.1, h = 10.9, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    ub.add(body(cx + 0.6, cy, x1 - x0 - 1.2, y1 - y0, 0, h, sh));                                  // shell (open end added below)
    const lip = (dy, dz, ly, lz) => ub.add(body(x0 + 0.3, cy + dy, 0.6, ly, dz, lz, sh));
    lip(5.6, 0, 0.8, h); lip(-5.6, 0, 0.8, h); lip(0, h - 0.8, 12, 0.8); lip(0, 0, 12, 0.8);
    const cav = new THREE.Mesh(new THREE.BoxGeometry(1.2, h - 1.6, 10.4), new THREE.MeshStandardMaterial({ color: 0x060607, roughness: 0.9 })); cav.position.copy(P(x0 + 0.65, cy, h / 2)); ub.add(cav);
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 5.6), new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.55 })); tongue.position.copy(P(x0 + 1.1, cy, h / 2 + 0.6)); ub.add(tongue);
    this.add('usb', ub);
    // DC barrel jack (X1): black body about 14.4 x 9 x 11 mm, barrel opening toward −x
    const dc = new THREE.Group(), K = this.mat.black, jx0 = -1.9, jx1 = 12.5, jy0 = 3.85, jy1 = 12.85, jh = 11, jcy = (jy0 + jy1) / 2;
    dc.add(body((jx0 + jx1) / 2, jcy, jx1 - jx0, jy1 - jy0, 0, jh, K, 0, 0.4));
    const bore = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 3.15, 0.6, 32), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 }));
    bore.rotation.z = Math.PI / 2; bore.position.copy(P(jx0 - 0.25, jcy, 6.4)); dc.add(bore);
    const pinC = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.2, 16), M.tin); pinC.rotation.z = Math.PI / 2; pinC.position.copy(P(jx0 - 0.1, jcy, 6.4)); dc.add(pinC);
    this.add('dcjack', dc);
    // reset button (TS42): small square tactile switch with a round plunger
    const rs = new THREE.Group(), e = EL.RESET;
    rs.add(body(e.x, e.y, 6.0, 3.6, 0, 1.6, M.steelSatin));
    const plunger = this.resetCap = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.3, 1.2, 24), new THREE.MeshStandardMaterial({ color: 0x8a2a2a, roughness: 0.45 }));
    plunger.position.copy(P(e.x, e.y, 2.2)); rs.add(plunger);
    this.add('reset', rs);
  }

  // ------------------------------------------------------------ ATmega328P in its socket, ATmega16U2, regulators, crystal, resonator, capacitors
  buildChips() {
    const e = EL.ZU4, xs = e.pads.map(p => p.x), ys = e.pads.map(p => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, len = Math.max(...xs) - Math.min(...xs) + 2.0;
    const mcu = new THREE.Group();
    mcu.add(body(cx, cy, len + 0.6, 10.1, 0, 3.0, this.mat.socket, 0, 0.2));                         // DIP-28 socket
    const top = chipTopTexture({ w: 1024, h: 210, base: '#1d1e20', ink: 'rgba(220,222,224,0.62)', lines: [{ t: 'ATMEGA328P-PU', s: 0.2, y: 0.42, w: 600 }, { t: 'AU 1904', s: 0.14, y: 0.66 }], dot: null });
    const chipMat = [this.mat.chip, this.mat.chip, new THREE.MeshStandardMaterial({ map: top, roughness: 0.6 }), this.mat.chip, this.mat.chip, this.mat.chip];
    const chip = new THREE.Mesh(new RoundedBoxGeometry(len - 0.4, 3.4, 7.0, 2, 0.35), chipMat); chip.position.copy(P(cx, cy, 3.0 + 1.0 + 1.7)); mcu.add(chip);
    // the board file rotates the chip by 180°: pin 1 (and the notch) are at the right end (x 62.9)
    const notch = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 20, 1, false, Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.8 }));
    notch.position.copy(P(cx + len / 2 - 0.25, cy, 7.4)); notch.rotation.y = Math.PI; mcu.add(notch);
    for (const p of e.pads) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.3), M.tin); leg.position.copy(P(p.x, p.y + (p.y > cy ? -0.25 : 0.25), 4.0)); mcu.add(leg); }
    this.add('mcu', mcu);
    // ATmega16U2 (U3, MLF32 5 x 5 mm)
    const u3 = EL.U3, m16 = chipTopTexture({ w: 256, h: 256, base: '#202124', ink: 'rgba(210,212,214,0.55)', lines: [{ t: 'ATMEL', s: 0.13, y: 0.32 }, { t: 'MEGA16U2', s: 0.13, y: 0.52 }, { t: '-MU', s: 0.12, y: 0.7 }] });
    const q = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.9, 5.0), [this.mat.chip, this.mat.chip, new THREE.MeshStandardMaterial({ map: m16, roughness: 0.6 }), this.mat.chip, this.mat.chip, this.mat.chip]);
    q.position.copy(P(u3.x, u3.y, 0.45)); q.rotation.y = u3.rot * Math.PI / 180; this.add('usbchip', q);
    // 5 V regulator (U1, SOT-223) and 3.3 V regulator (U2, SOT23-5), op-amp (U5, MSOP-8), MOSFET (T1, SOT-23)
    const ic = (id, el, l, w, h, tab) => { const x = EL[el]; const g = new THREE.Group(); g.add(body(x.x, x.y, l, w, 0.05, h, this.mat.chip, x.rot)); if (tab) { const t = x.pads.find(p => p.n === '4'); g.add(body(t.x, t.y, 3.2, 1.4, 0.02, 0.25, M.tin, x.rot + 90)); } for (const p of x.pads) if (p.n !== '4' || !tab) g.add(body(p.x, p.y, Math.min(p.dx, 0.6), Math.min(p.dy, 0.9), 0.02, 0.2, M.tin, x.rot)); this.add(id, g); };
    ic('reg5', 'U1', 6.5, 3.5, 1.6, true); ic('reg33', 'U2', 2.9, 1.6, 1.1); ic('opamp', 'U5', 3.0, 3.0, 1.0); ic('mosfet', 'T1', 2.9, 1.3, 1.0);
    // 16 MHz crystal for the 16U2 (Y1, HC-49/S) and 16 MHz ceramic resonator for the ATmega328P (Y2)
    const y1 = EL.Y1, xt = new THREE.Group();
    const oval = new THREE.Shape(); oval.absarc(-3.4, 0, 2.3, Math.PI / 2, Math.PI * 1.5); oval.absarc(3.4, 0, 2.3, -Math.PI / 2, Math.PI / 2);
    const og = new THREE.ExtrudeGeometry(oval, { depth: 3.5, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2, bevelSegments: 2 }); og.rotateX(-Math.PI / 2);
    const om = new THREE.Mesh(og, M.steelSatin); om.position.copy(P(y1.x, y1.y, 0.4)); xt.add(om); this.add('xtal', xt);
    const y2 = EL.Y2; this.add('reso', body(y2.x, y2.y, 3.2, 1.3, 0.05, 0.9, new THREE.MeshStandardMaterial({ color: 0xc9c2a8, roughness: 0.6 }), y2.rot, 0.15));
    // 47 µF electrolytic capacitors (PC1, PC2, Panasonic case D: Ø6.3 mm)
    for (const el of ['PC1', 'PC2']) {
      const x = EL[el], g = new THREE.Group();
      g.add(body(x.x, x.y, 6.6, 6.6, 0, 1.2, this.mat.black, 0, 0.3));
      const can = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 3.15, 4.6, 40), M.steelSatin); can.position.copy(P(x.x, x.y, 1.2 + 2.3)); g.add(can);
      const capTop = canvasTex(256, 256, (c, w, hh) => { c.fillStyle = '#c9c9c6'; c.fillRect(0, 0, w, hh); c.fillStyle = '#1e1e1e'; c.beginPath(); c.arc(w / 2, hh / 2, w / 2, Math.PI * 0.62, Math.PI * 1.38); c.lineTo(w / 2, hh / 2); c.fill(); c.strokeStyle = '#8e8e8b'; c.lineWidth = 6; c.beginPath(); c.moveTo(w * 0.5, hh * 0.18); c.lineTo(w * 0.5, hh * 0.82); c.moveTo(w * 0.18, hh * 0.5); c.lineTo(w * 0.82, hh * 0.5); c.stroke(); });
      const disk = new THREE.Mesh(new THREE.CircleGeometry(3.1, 40), new THREE.MeshStandardMaterial({ map: capTop, roughness: 0.4, metalness: 0.6 })); disk.rotation.x = -Math.PI / 2; disk.position.copy(P(x.x, x.y, 5.82)); g.add(disk);
      this.add('caps', g);
    }
    // reverse-polarity diode (D1, SMB) and resettable fuse (F1, 1812)
    const d1 = EL.D1; this.add('diode', body(d1.x, d1.y, 4.3, 3.6, 0.05, 2.2, this.mat.chip, d1.rot, 0.2));
    const f1 = EL.F1; this.add('fuse', body(f1.x, f1.y, 4.5, 3.2, 0.05, 1.5, new THREE.MeshStandardMaterial({ color: 0xc8a964, roughness: 0.55 }), f1.rot + 90, 0.2));
  }

  // ------------------------------------------------------------ small SMD parts (resistors, capacitors, arrays, ferrite) from the board file
  buildSmall() {
    const SIZE = { 'C0603-ROUND': [1.6, 0.8, 0.8, 'cap'], 'R0603-ROUND': [1.6, 0.8, 0.45, 'res'], 'CAY16': [3.2, 1.6, 0.5, 'res'], 'CT/CN0603': [1.6, 0.8, 0.8, 'cap'], '0805': [2.0, 1.25, 0.9, 'ferrite'], MINIMELF: [3.5, 1.4, 1.4, 'melf'] };
    const g = new THREE.Group();
    for (const e of boardData.elements) {
      const s = SIZE[e.pkg]; if (!s) continue;
      const [l, w, h, kind] = s;
      if (kind === 'melf') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.5, 16), new THREE.MeshStandardMaterial({ color: 0x9e2d24, roughness: 0.4 })); c.rotation.z = Math.PI / 2; c.rotation.y = e.rot * Math.PI / 180; c.position.copy(P(e.x, e.y, 0.75)); g.add(c); continue; }
      const mat = kind === 'cap' ? this.mat.capBody : kind === 'ferrite' ? this.mat.resBody : this.mat.resBody;
      g.add(body(e.x, e.y, l * 0.7, w, 0.02, h, mat, e.rot));
      for (const sx of [-1, 1]) { const a = e.rot * Math.PI / 180; g.add(body(e.x + Math.cos(a) * sx * l * 0.42, e.y + Math.sin(a) * sx * l * 0.42, l * 0.17, w, 0.02, h, M.capEnd, e.rot)); }
    }
    this.add('passives', g);
  }

  // ------------------------------------------------------------ LEDs: ON (green), L, TX, RX (yellow) — 0805 chip LEDs
  buildLEDs() {
    for (const [id, el, col] of [['on', 'ON', 0x2bff5a], ['l', 'L', 0xffb21a], ['tx', 'TX', 0xffb21a], ['rx', 'RX', 0xffb21a]]) {
      const e = EL[el], g = new THREE.Group();
      g.add(body(e.x, e.y, 2.0, 1.25, 0.02, 0.8, M.ledBody, e.rot));
      const glow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.9), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); glow.position.copy(P(e.x, e.y, 0.85)); glow.rotation.y = e.rot * Math.PI / 180; glow.visible = false; g.add(glow);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      halo.scale.set(6, 6, 1); halo.position.copy(P(e.x, e.y, 1.3)); halo.visible = false; g.add(halo);
      this.add('led' + id, g); this.proxy('led' + id, e.x, e.y, 0, 2.4, 2.4, 1.4);
      this.leds[id] = { glow, halo };
    }
  }
  setLed(id, on) { const l = this.leds[id === 'act' ? 'l' : id]; if (l) { const v = typeof on === 'number' ? on > 0 : !!on; l.glow.visible = v; l.halo.visible = v; } }
  setPowerLed(on) { this.setLed('on', on); }
  setMatrix() {}
  pressButton(p) { if (this.resetCap) this.resetCap.position.y = p ? 1.9 : 2.2; }

  partCenter(id) {
    const g = this.parts[id], b = new THREE.Box3();
    if (g) b.setFromObject(g);
    for (const p of this.proxies.filter(p => p.userData.part === id)) b.expandByObject(p);
    if (b.isEmpty()) return { center: new THREE.Vector3(), size: 20 };
    const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    return { center: c, size: Math.max(s.x, s.y, s.z), box: b };
  }
}

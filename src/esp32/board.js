// ESP32 DevKit V1 (DOIT, 30-pin) 3D model — stylised.
// There is no official CAD file for this board. Sizes follow the documents listed in data.js: the module is the real
// ESP32-WROOM-32 size (18 × 25.5 × 3.1 mm, Espressif datasheet), the board is ≈ 51.45 × 28.33 mm and the silkscreen order of the
// 30 pins is the real one. Positions of the small parts and the height of the connectors are close, not measured.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, canvasTex, chipTopTexture, noise } from '../materials.js';
import { haloTexture } from '../board.js';
import { E32_PINS, E32_W as W, E32_H as H } from './data.js';

export const T = 1.6;
export const P = (x, y, z = 0) => new THREE.Vector3(x - W / 2, z, -(y - H / 2));
const MOD = { x0: 25.45, x1: 50.95, y0: 5.165, y1: 23.165, can: 15.8 };   // module outline; the shield covers the west 15.8 mm

function body(cx, cy, l, w, z0, h, mat, rot = 0, r = 0) {
  const g = r > 0 ? new RoundedBoxGeometry(l, h, w, 2, r) : new THREE.BoxGeometry(l, h, w);
  const m = new THREE.Mesh(g, mat); m.position.copy(P(cx, cy, z0 + h / 2)); m.rotation.y = rot * Math.PI / 180; return m;
}

/** 2D drawing of the top of the board (also used as the chooser picture). pxmm = pixels per mm */
export function drawBoardTop(g, pxmm, { art = false } = {}) {
  const w = W * pxmm, h = H * pxmm, X = x => x * pxmm, Y = y => (H - y) * pxmm;
  g.fillStyle = '#14151a'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.035)'; for (let i = 0; i < 1400; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  g.fillStyle = '#e9e7df'; g.strokeStyle = '#e9e7df'; g.lineWidth = Math.max(1, pxmm * 0.16);
  g.font = `600 ${pxmm * 1.25}px "Segoe UI", Arial, sans-serif`; g.textBaseline = 'middle';
  for (const p of E32_PINS) {
    g.save(); g.translate(X(p.x), Y(p.y));
    g.rotate(-Math.PI / 2);                        // text runs along the board width, reading from the pins inward
    g.textAlign = p.header === 'L' ? 'right' : 'left';
    g.fillText(p.label, p.header === 'L' ? -pxmm * 1.7 : pxmm * 1.7, 0);
    g.restore();
    g.beginPath(); g.arc(X(p.x), Y(p.y), pxmm * 0.95, 0, Math.PI * 2); g.fillStyle = '#c9a85a'; g.fill(); g.fillStyle = '#e9e7df';
  }
  // buttons and LED captions
  g.font = `600 ${pxmm * 1.3}px "Segoe UI", Arial, sans-serif`; g.textAlign = 'center';
  g.save(); g.translate(X(4.6), Y(25.6)); g.rotate(-Math.PI / 2); g.fillText('EN', 0, 0); g.restore();
  g.save(); g.translate(X(4.6), Y(2.6)); g.rotate(-Math.PI / 2); g.fillText('BOOT', 0, 0); g.restore();
  // outline of the module footprint
  g.strokeRect(X(MOD.x0) - 3, Y(MOD.y1) - 3, (MOD.x1 - MOD.x0) * pxmm + 6, (MOD.y1 - MOD.y0) * pxmm + 6);
  if (art) {                                        // flat illustration for the board chooser: module, USB, buttons
    g.fillStyle = '#b9bcc1'; g.fillRect(X(MOD.x0), Y(MOD.y1), MOD.can * pxmm, (MOD.y1 - MOD.y0) * pxmm);
    g.fillStyle = '#2a2b30'; g.fillRect(X(MOD.x0 + MOD.can), Y(MOD.y1), (MOD.x1 - MOD.x0 - MOD.can) * pxmm, (MOD.y1 - MOD.y0) * pxmm);
    g.strokeStyle = '#c9a85a'; g.lineWidth = pxmm * 0.5; g.beginPath(); const ax = X(MOD.x0 + MOD.can + 1.2); let yy = Y(MOD.y1 - 2);
    g.moveTo(ax, yy); for (let i = 0; i < 6; i++) { g.lineTo(ax + pxmm * 6.5, yy); yy += pxmm * 1.4; g.lineTo(ax + pxmm * 6.5, yy); g.lineTo(ax, yy); yy += pxmm * 1.4; g.lineTo(ax, yy); } g.stroke();
    g.fillStyle = '#9aa0a8'; g.fillRect(X(-1.2), Y(18), 5.6 * pxmm, 7.5 * pxmm);
    g.fillStyle = '#2c9be8'; g.beginPath(); g.arc(X(22.6), Y(18), pxmm * 0.7, 0, 7); g.fill();
    g.fillStyle = '#e23b3b'; g.beginPath(); g.arc(X(22.6), Y(10), pxmm * 0.7, 0, 7); g.fill();
  }
}
export function boardThumb() {
  const c = document.createElement('canvas'); c.width = 1030; c.height = 567;
  const g = c.getContext('2d'); g.fillStyle = '#0d1b24'; g.fillRect(0, 0, c.width, c.height);
  const px = 18, cv = document.createElement('canvas'); cv.width = Math.round(W * px); cv.height = Math.round(H * px);
  drawBoardTop(cv.getContext('2d'), px, { art: true });
  g.drawImage(cv, (c.width - cv.width) / 2, (c.height - cv.height) / 2); return c.toDataURL('image/jpeg', 0.9);
}

export class Esp32Board {
  constructor() {
    this.group = new THREE.Group(); this.group.name = 'ESP32 DevKit V1';
    this.parts = {}; this.proxies = []; this.pins = {}; this.leds = {};
    this.powered = false;
    // micro-USB receptacle: opening faces −x at the west edge
    this.usbMouth = P(-1.2, H / 2, 1.5); this.usbRotY = 0; this.usbKind = 'micro';
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
      pin: new THREE.MeshStandardMaterial({ color: 0xd9b56a, roughness: 0.25, metalness: 1 }),
      mask: new THREE.MeshStandardMaterial({ color: 0x14151a, roughness: 0.5 }),
      capBody: new THREE.MeshStandardMaterial({ color: 0x8c6b4a, roughness: 0.6 }), resBody: new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.55 }),
    };
    this.buildPCB(); this.buildModule(); this.buildHeaders(); this.buildUSB(); this.buildChips(); this.buildButtons(); this.buildSmall(); this.buildLEDs();
    this.group.traverse(o => {
      if (o.isMesh && !o.userData.proxy) { o.castShadow = true; o.receiveShadow = true; }
      if (o.isSprite || (o.material && o.material.blending === THREE.AdditiveBlending)) { o.raycast = () => {}; o.castShadow = false; }
    });
  }

  buildPCB() {
    const top = canvasTex(2060, 1134, g => drawBoardTop(g, 40));
    const side = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.7 });
    const bm = new THREE.MeshStandardMaterial({ color: 0x14151a, roughness: 0.55 });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(W, T, H), [side, side, bm, bm, side, side]); slab.position.set(0, -T / 2, 0);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshPhysicalMaterial({ map: top, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4 }));
    face.rotation.x = -Math.PI / 2; face.position.y = 0.01;
    const g = new THREE.Group(); g.add(slab, face);
    // mounting holes are not part of this board; the corners are slightly rounded in reality (not modelled)
    this.add('pcb', g);
  }

  // ------------------------------------------------------------ ESP32-WROOM-32 module: 18 × 25.5 × 3.1 mm, shield + printed antenna
  buildModule() {
    const g = new THREE.Group(), cx = (MOD.x0 + MOD.x1) / 2, cy = (MOD.y0 + MOD.y1) / 2, len = MOD.x1 - MOD.x0, wid = MOD.y1 - MOD.y0;
    const ant = canvasTex(512, 362, c => {
      c.fillStyle = '#17181c'; c.fillRect(0, 0, 512, 362); noise(c, 512, 362, 8);
      c.strokeStyle = '#c9a85a'; c.lineWidth = 9; c.lineJoin = 'round'; c.beginPath();
      let y = 40; c.moveTo(40, y); for (let i = 0; i < 5; i++) { c.lineTo(420, y); y += 28; c.lineTo(420, y); c.lineTo(40, y); y += 28; c.lineTo(40, y); } c.lineTo(40, 330); c.stroke();
    });
    const edge = new THREE.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.5 });
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(len, 0.8, wid), [edge, edge, new THREE.MeshStandardMaterial({ map: ant, roughness: 0.45 }), edge, edge, edge]);
    pcb.position.copy(P(cx, cy, 0.4 + 0.3)); g.add(pcb);
    // castellated pads along the three sides (gold half-holes)
    for (let i = 0; i < 14; i++) for (const side of [MOD.y0 + 0.2, MOD.y1 - 0.2]) { const p = body(MOD.x0 + 1.2 + i * 1.27, side, 0.8, 0.9, 0.55, 0.25, this.mat.pin); g.add(p); }
    // metal shield 18 × 15.8 mm
    const top = chipTopTexture({ w: 800, h: 912, base: '#b9bbbf', ink: 'rgba(40,42,46,0.85)', rot: Math.PI / 2, lines: [{ t: 'ESPRESSIF', s: 0.085, y: 0.3, w: 760 }, { t: 'ESP-WROOM-32', s: 0.085, y: 0.5, w: 760 }, { t: '8 MB / 4 MB FLASH', s: 0.045, y: 0.7 }], dot: null });
    const sh = new THREE.Mesh(new THREE.BoxGeometry(MOD.can, 2.3, wid), [M.steelSatin, M.steelSatin, new THREE.MeshStandardMaterial({ map: top, roughness: 0.32, metalness: 0.85 }), M.steelSatin, M.steelSatin, M.steelSatin]);
    sh.position.copy(P(MOD.x0 + MOD.can / 2, cy, 0.8 + 0.3 + 1.15)); g.add(sh);
    this.add('module', g);
    // antenna: the module PCB without a shield (clickable on its own)
    this.proxy('antenna', MOD.x0 + MOD.can + (len - MOD.can) / 2, cy, 0.4, len - MOD.can, wid, 1.0);
    this.proxy('module', MOD.x0 + MOD.can / 2, cy, 0.4, MOD.can, wid, 3.0);
  }

  // ------------------------------------------------------------ two 15-pin male headers (pins up, so the wires can be seen)
  buildHeaders() {
    for (const [id, hd] of [['jleft', 'L'], ['jright', 'R']]) {
      const pads = E32_PINS.filter(p => p.header === hd), xs = pads.map(p => p.x), y = pads[0].y, x0 = Math.min(...xs) - 1.27, x1 = Math.max(...xs) + 1.27;
      const g = new THREE.Group();
      g.add(body((x0 + x1) / 2, y, x1 - x0, 2.54, 0, 2.5, this.mat.black, 0, 0.1));
      for (const p of pads) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.64, 11.0, 0.64), this.mat.pin); pin.position.copy(P(p.x, p.y, 2.5 + 4.1 - 0.0)); pin.position.y = 4.9; g.add(pin);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 0.5, 10), M.solder); t.position.copy(P(p.x, p.y, -T - 0.2)); g.add(t);
        this.pins[p.id] = { pos: P(p.x, p.y, 10.4), female: P(p.x, p.y, 5.5), x: p.x, y: p.y, header: hd === 'L' ? 'JLEFT' : 'JRIGHT', depth: 5.0 };
        const pr = this.proxy('pin:' + p.id, p.x, p.y, 4.0, 2.2, 2.2, 7.0); pr.userData.pin = p.id;
      }
      this.add(id, g);
    }
  }

  // ------------------------------------------------------------ micro-USB receptacle (opening toward −x)
  buildUSB() {
    const ub = new THREE.Group(), sh = M.steelSatin, cy = H / 2, x0 = -1.2, x1 = 4.6, w = 7.5, h = 2.6;
    ub.add(body((x0 + x1) / 2 + 0.3, cy, x1 - x0 - 0.6, w, 0, h, sh));
    const cav = new THREE.Mesh(new THREE.BoxGeometry(0.8, h - 0.7, w - 1.2), new THREE.MeshStandardMaterial({ color: 0x060607, roughness: 0.9 })); cav.position.copy(P(x0 + 0.42, cy, h / 2)); ub.add(cav);
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 5.2), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.6 })); tongue.position.copy(P(x0 + 1.0, cy, h / 2)); ub.add(tongue);
    this.add('usb', ub);
    this.proxy('usb', 1.7, cy, 0, 6.2, w, h);
  }

  buildChips() {
    // USB-to-serial chip (QFN-28, 5 × 5 mm) and the 3.3 V regulator (SOT-223)
    const cp = chipTopTexture({ w: 256, h: 256, base: '#202124', ink: 'rgba(210,212,214,0.6)', lines: [{ t: 'CP2102', s: 0.16, y: 0.42 }, { t: 'SILICON LABS', s: 0.08, y: 0.66 }] });
    const q = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.9, 5.0), [this.mat.chip, this.mat.chip, new THREE.MeshStandardMaterial({ map: cp, roughness: 0.6 }), this.mat.chip, this.mat.chip, this.mat.chip]);
    q.position.copy(P(13.5, 19.6, 0.45)); this.add('usbchip', q);
    const reg = new THREE.Group();
    reg.add(body(18.3, 9.4, 3.5, 6.5, 0.05, 1.6, this.mat.chip)); reg.add(body(18.3, 5.1, 3.2, 1.4, 0.02, 0.25, M.tin));
    this.add('reg', reg);
    this.proxy('reg', 18.3, 8.2, 0, 3.8, 8.0, 1.8);
    // two electrolytic-style capacitors next to the regulator
    for (const [x, y] of [[24.0, 8.6], [24.0, 19.2]]) this.add('passives', body(x, y, 2.4, 2.4, 0.02, 1.7, new THREE.MeshStandardMaterial({ color: 0xc9a54a, roughness: 0.5 }), 0, 0.2));
  }

  // ------------------------------------------------------------ EN and BOOT tactile switches (6 × 3.6 mm)
  buildButtons() {
    for (const [id, y] of [['en', 21.8], ['boot', 6.5]]) {
      const g = new THREE.Group();
      g.add(body(4.6, y, 3.6, 6.0, 0, 1.6, M.steelSatin));
      const cap = this.mat[id + 'Cap'] = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.3, 1.2, 24), new THREE.MeshStandardMaterial({ color: 0x1e1e20, roughness: 0.45 }));
      cap.position.copy(P(4.6, y, 2.2)); g.add(cap); this.add(id, g); this.proxy(id, 4.6, y, 0, 3.8, 6.2, 3.2);
    }
  }

  buildSmall() {
    const g = new THREE.Group();
    const res = [[8.0, 9.0, 90], [8.0, 11.0, 90], [8.0, 17.3, 90], [8.0, 19.3, 90], [11.0, 9.2, 0], [15.0, 12.2, 0], [15.0, 16.0, 0], [20.5, 22.2, 0], [20.5, 6.2, 0], [21.8, 14.2, 90], [24.2, 13.5, 90], [24.2, 15.4, 90]];
    for (const [x, y, rot] of res) {
      g.add(body(x, y, 1.1, 0.8, 0.02, 0.45, this.mat.resBody, rot));
      for (const s of [-1, 1]) { const a = rot * Math.PI / 180; g.add(body(x + Math.cos(a) * s * 0.5, y - Math.sin(a) * s * 0.5, 0.25, 0.8, 0.02, 0.45, M.capEnd, rot)); }
    }
    this.add('passives', g);
  }

  buildLEDs() {
    for (const [id, x, y, col] of [['on', 22.6, 11.6, 0xff3b30], ['blue', 22.6, 17.2, 0x3aa0ff]]) {
      const g = new THREE.Group();
      g.add(body(x, y, 2.0, 1.25, 0.02, 0.8, M.ledBody, 90));
      const glow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.9), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); glow.position.copy(P(x, y, 0.85)); glow.rotation.y = Math.PI / 2; glow.visible = false; g.add(glow);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      halo.scale.set(6, 6, 1); halo.position.copy(P(x, y, 1.3)); halo.visible = false; g.add(halo);
      this.add('led' + id, g); this.proxy('led' + id, x, y, 0, 2.4, 2.4, 1.4);
      this.leds[id] = { glow, halo };
    }
  }
  setLed(id, on) { const l = this.leds[id === 'l' ? 'blue' : id]; if (l) { const v = typeof on === 'number' ? on > 0 : !!on; l.glow.visible = v; l.halo.visible = v; } }
  setPowerLed(on) { this.setLed('on', on); if (!on) this.setLed('blue', false); }
  setMatrix() {}
  pressButton(p) { const c = this.mat.enCap; if (c) c.position.y = p ? 1.9 : 2.2; }

  partCenter(id) {
    const g = this.parts[id], b = new THREE.Box3();
    if (g) b.setFromObject(g);
    for (const p of this.proxies.filter(p => p.userData.part === id)) b.expandByObject(p);
    if (b.isEmpty()) return { center: new THREE.Vector3(), size: 20 };
    const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    return { center: c, size: Math.max(s.x, s.y, s.z), box: b };
  }
}

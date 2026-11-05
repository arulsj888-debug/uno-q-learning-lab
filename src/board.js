// Arduino UNO Q 3D model.
// Geometry: Arduino's official CAD data (Gerber artwork, drill file, simplified STEP model)
// and official product photos for colours and finishes.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import qrcode from 'qrcode-generator';
import { M, canvasTex, chipTopTexture, noise } from './materials.js';
import { JDIGITAL, JANALOG, JSPI, JCTL } from './data/pins.js';
import boardData from '../assets/board_data.json';
import topAlbedo from '../assets/pcb_top_albedo.jpg';
import topOrm from '../assets/pcb_top_orm.jpg';
import topBump from '../assets/pcb_top_bump.jpg';
import botAlbedo from '../assets/pcb_bottom_albedo.jpg';
import botOrm from '../assets/pcb_bottom_orm.jpg';
import botBump from '../assets/pcb_bottom_bump.jpg';

export const W = 68.58, H = 53.34, T = 1.0;
/** board mm (x right, y up, z above top surface) -> world */
export const P = (x, y, z = 0) => new THREE.Vector3(x - W / 2, z, -(y - H / 2));

const loader = new THREE.TextureLoader();
function tex(url, srgb) {
  const t = loader.load(url);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = M.aniso || 8;
  t.repeat.set(1 / W, 1 / H);
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

function shadowed(o) { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; }

function box(cx, cy, z0, sx, sy, sz, mat, r = 0, seg = 2) {
  const g = r > 0 ? new RoundedBoxGeometry(sx, sz, sy, seg, r) : new THREE.BoxGeometry(sx, sz, sy);
  const m = new THREE.Mesh(g, mat);
  m.position.copy(P(cx, cy, z0 + sz / 2));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function rrShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export class UnoQBoard {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'UNO Q';
    this.parts = {};          // id -> THREE.Group (visible meshes)
    this.proxies = [];        // invisible pick helpers
    this.pins = {};           // pin id -> { pos: Vector3 (socket top), ... }
    this.leds = {};
    this.powered = false;
    this.build();
  }

  part(id) {
    if (!this.parts[id]) { const g = new THREE.Group(); g.name = id; g.userData.part = id; this.parts[id] = g; this.group.add(g); }
    return this.parts[id];
  }
  add(id, obj) { obj.traverse(o => { o.userData.part = id; }); this.part(id).add(obj); return obj; }
  proxy(id, cx, cy, z0, sx, sy, sz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sz, sy), M.invisible);
    m.position.copy(P(cx, cy, z0 + sz / 2));
    m.userData.part = id; m.userData.proxy = true;
    this.group.add(m); this.proxies.push(m);
    return m;
  }

  build() {
    this.buildPCB();
    this.buildHeaders();
    this.buildChips();
    this.buildConnectors();
    this.buildLEDs();
    this.buildSmallParts();
    this.buildBottom();
    // pick proxies for regions that are mostly flat artwork
    this.proxy('antenna', 2.4, 11.5, 0, 4.4, 21.5, 0.25);
    for (const h of boardData.holes.filter(h => h.tool === '08')) this.proxy('holes', h.x, h.y, -T - 0.1, 4.2, 4.2, T + 0.3);
    shadowed(this.group);
    this.group.traverse(o => {
      if (o.userData.proxy || o.isSprite || (o.material && o.material.blending === THREE.AdditiveBlending)) { o.castShadow = false; o.receiveShadow = false; }
      if (o.isSprite || (o.material && o.material.blending === THREE.AdditiveBlending)) o.raycast = () => {};   // glows never take clicks
    });
  }

  // ------------------------------------------------------------ PCB
  buildPCB() {
    const outline = boardData.outline;
    const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const h of boardData.holes.filter(h => h.tool === '08')) {
      const p = new THREE.Path(); p.absarc(h.x, h.y, h.d / 2, 0, Math.PI * 2, true); shape.holes.push(p);
    }
    const mk = (albedo, orm, bump) => new THREE.MeshPhysicalMaterial({
      map: tex(albedo, true), roughnessMap: tex(orm, false), metalnessMap: tex(orm, false), bumpMap: tex(bump, false),
      roughness: 1, metalness: 1, bumpScale: 2.2, clearcoat: 0.22, clearcoatRoughness: 0.4,
    });
    this.pcbTopMat = mk(topAlbedo, topOrm, topBump);
    this.pcbBotMat = mk(botAlbedo, botOrm, botBump);
    this.pcbBotMat.side = THREE.BackSide;

    const face = new THREE.ShapeGeometry(shape, 24);
    face.rotateX(-Math.PI / 2); face.translate(-W / 2, 0, H / 2);
    const top = new THREE.Mesh(face, this.pcbTopMat);
    const bottom = new THREE.Mesh(face.clone().translate(0, -T, 0), this.pcbBotMat);
    const edgeGeo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 24 });
    edgeGeo.rotateX(-Math.PI / 2); edgeGeo.translate(-W / 2, -T, H / 2);
    const edge = new THREE.Mesh(edgeGeo, [M.invisible, M.pcbEdge]);
    const g = new THREE.Group(); g.add(top, bottom, edge);
    g.traverse(o => { o.receiveShadow = true; o.castShadow = true; });
    top.castShadow = false;
    this.add('pcb', g);
    this.pcb = g;
  }

  // ------------------------------------------------------------ headers
  /**
   * One-piece female header, printed like the real UNO Q (Arduino product photos):
   *  - JDIGITAL: white labels on the face toward the board centre, reading bottom → top, band "DIGITAL (PWM~)"
   *  - JANALOG : white labels on the outer face, reading top → bottom, bands "POWER" and "ANALOG IN"
   * `face` is the world face that carries the print. On a -Z face the texture's u axis runs toward −x,
   * so positions are mirrored there (that mirroring is what put "RESET" over the GND socket before).
   */
  femaleHeader(id, hdr, { face, dir, print, bands = [] }) {
    const pins = hdr.pins, y = hdr.y, height = hdr.height;
    const xs = pins.map(p => p.x), pitch = 2.54;
    const x0 = Math.min(...xs) - pitch / 2, x1 = Math.max(...xs) + pitch / 2;
    const len = x1 - x0, cx = (x0 + x1) / 2;
    const PXMM = 25.2;
    const U = x => (face === '-Z' ? x1 - x : x - x0) * PXMM;      // board x -> texture column
    const topTex = canvasTex(Math.round(len * PXMM), Math.round(2.5 * PXMM), (g, w, h) => {
      g.fillStyle = '#1c1c1d'; g.fillRect(0, 0, w, h); noise(g, w, h, 6);
      for (const p of pins) {
        const c = (p.x - x0) * PXMM, m = h / 2;
        const grd = g.createLinearGradient(c - 18, m - 18, c + 18, m + 18);
        grd.addColorStop(0, '#3a3a3c'); grd.addColorStop(1, '#0d0d0e');
        g.fillStyle = grd; g.fillRect(c - 18, m - 18, 36, 36);
        g.fillStyle = '#030303'; g.fillRect(c - 12, m - 12, 24, 24);
        g.fillStyle = 'rgba(214,170,80,0.35)'; g.fillRect(c - 6, m - 2, 12, 4);
      }
    });
    const sideTex = canvasTex(Math.round(len * PXMM), Math.round(height * PXMM), (g, w, h) => {
      g.fillStyle = '#18181a'; g.fillRect(0, 0, w, h); noise(g, w, h, 5);
      const bandH = Math.round(h * 0.17), bandY = h - bandH - 7;
      // bands along the bottom edge
      for (const b of bands) {
        const a = U(b.from - pitch / 2 + 0.25), c = U(b.to + pitch / 2 - 0.25);
        const L = Math.min(a, c), R = Math.max(a, c);
        g.fillStyle = '#e9e9e4';
        if (b.thin) { g.fillRect(L, bandY + bandH * 0.62, R - L, Math.max(3, bandH * 0.16)); continue; }
        g.fillRect(L, bandY, R - L, bandH);
        g.fillStyle = '#18181a'; g.font = `700 ${Math.round(bandH * 0.74)}px Consolas, "Roboto Mono", monospace`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        if ('letterSpacing' in g) g.letterSpacing = '3px';
        g.fillText(b.text, (L + R) / 2, bandY + bandH / 2 + 1);
        if ('letterSpacing' in g) g.letterSpacing = '0px';
      }
      // one vertical label per socket
      pins.forEach((p, i) => {
        const label = print[i]; if (!label) return;
        const inv = label === 'GND';
        const fs = label.length > 3 ? 20 : 24;
        g.save();
        if (dir === 'up') { g.translate(U(p.x), bandY - 8); g.rotate(-Math.PI / 2); }
        else { g.translate(U(p.x), 10); g.rotate(Math.PI / 2); }
        g.font = `700 ${fs}px Consolas, "Roboto Mono", monospace`;
        g.textAlign = 'left'; g.textBaseline = 'middle';
        if (inv) {
          const tw = g.measureText(label).width;
          g.fillStyle = '#ecece7'; g.fillRect(-4, -fs * 0.62, tw + 8, fs * 1.24);
          g.fillStyle = '#18181a';
        } else g.fillStyle = '#f2f2ee';
        g.fillText(label, 0, 1);
        g.restore();
      });
    });
    const mTop = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.8 });
    const mSide = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.5 });
    const mats = [M.blackPlastic, M.blackPlastic, mTop, M.blackPlastic,
      face === '+Z' ? mSide : M.blackPlastic, face === '-Z' ? mSide : M.blackPlastic];
    const body = new THREE.Mesh(new RoundedBoxGeometry(len - 0.1, height, 2.5, 2, 0.12), mats);
    body.position.copy(P(cx, y, height / 2));
    const g = new THREE.Group(); g.add(body);
    g.add(this.throughHoleTails(xs.map(x => [x, y])));
    this.add(id, g);
    // per-pin click proxies + socket positions
    for (const p of pins) {
      const pr = this.proxy('pin:' + p.id, p.x, y, height - 0.4, 2.3, 2.3, 0.9);
      pr.userData.pin = p.id;
      this.pins[p.id] = { pos: P(p.x, y, height), x: p.x, y, header: id, depth: 5.0 };
    }
    this.headerPrint = this.headerPrint || {};
    this.headerPrint[id] = { face, print: pins.map((p, i) => ({ id: p.id, x: p.x, text: print[i] || '', u: U(p.x) / PXMM })) };
  }

  throughHoleTails(xy, len = 3.0) {
    const geos = [];
    for (const [x, y] of xy) {
      const pin = new THREE.BoxGeometry(0.64, len, 0.64); pin.translate(x - W / 2, -T - len / 2, -(y - H / 2));
      geos.push(pin);
    }
    const pins = new THREE.Mesh(mergeGeometries(geos), M.tin);
    const fil = [];
    for (const [x, y] of xy) {
      const f = new THREE.CylinderGeometry(0.42, 0.95, 0.55, 20, 1, true); f.translate(x - W / 2, -T - 0.275, -(y - H / 2));
      fil.push(f);
    }
    const fillets = new THREE.Mesh(mergeGeometries(fil), M.solder);
    const g = new THREE.Group(); g.add(pins, fillets);
    return g;
  }

  malePins(list, z0, z1, mat) {
    const geos = [];
    for (const [x, y] of list) {
      const L = z1 - z0 - 0.35;
      const b = new THREE.BoxGeometry(0.64, L, 0.64); b.translate(x - W / 2, z0 + L / 2, -(y - H / 2)); geos.push(b);
      const tip = new THREE.CylinderGeometry(0.17, 0.4525, 0.35, 4, 1); tip.rotateY(Math.PI / 4);
      tip.translate(x - W / 2, z1 - 0.175, -(y - H / 2)); geos.push(tip);
    }
    const geo = mergeGeometries(geos.map(g => g.toNonIndexed()));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  }

  buildHeaders() {
    // JDIGITAL: 10-pin (SCL..D8) + 8-pin (D7..D0) female headers, labels face the board centre
    // Print text and placement copied from Arduino's UNO Q product photos (store.arduino.cc, ABX00162).
    // JDIGITAL sits at world z < 0, so its +Z face looks toward the board centre.
    this.femaleHeader('jdigital', JDIGITAL, {
      face: '+Z', dir: 'up',
      print: ['SCL', 'SDA', 'AREF', 'GND', '13', '12', '~11', '~10', '~9', '8', '7', '~6', '~5', '4', '~3', '2', '1←TX', '0→RX'],
      bands: [{ from: 28.96, to: 41.66, thin: true }, { from: 45.72, to: 63.5, text: 'DIGITAL (PWM~)' }],
    });
    // JANALOG sits at world z > 0, so its +Z face is the outer face. The BOOT socket carries no print.
    this.femaleHeader('janalog', JANALOG, {
      face: '+Z', dir: 'down',
      print: ['', 'IOREF', 'RESET', '3.3V', '5V', 'GND', 'GND', 'Vin', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
      bands: [{ from: 30.48, to: 40.64, text: 'POWER' }, { from: 50.8, to: 63.5, text: 'ANALOG IN' }],
    });

    // JSPI 2x3 through-hole male header
    {
      const g = new THREE.Group();
      const base = box(64.94, 27.95, 0, 5.0, 7.55, 2.5, M.darkPlastic, 0.25);
      g.add(base);
      const xy = JSPI.pins.map(p => [p.x, p.y]);
      g.add(this.malePins(xy, 0.2, JSPI.height, M.tin));
      g.add(this.throughHoleTails(xy, 2.6));
      this.add('jspi', g);
      for (const p of JSPI.pins) {
        const pr = this.proxy('pin:' + p.id, p.x, p.y, JSPI.height - 2, 2.2, 2.2, 2.2); pr.userData.pin = p.id;
        this.pins[p.id] = { pos: P(p.x, p.y, JSPI.height), x: p.x, y: p.y, header: 'jspi', male: true };
      }
    }
    // JCTL 2x5 surface-mount male header (1.8 V)
    {
      const g = new THREE.Group();
      g.add(box(18.5, 44.46, 1.0, 12.6, 5.0, 2.5, M.darkPlastic, 0.25));
      const xy = JCTL.pins.map(p => [p.x, p.y]);
      g.add(this.malePins(xy, 0.12, 10.0, M.tin));
      const feet = [];
      for (const p of JCTL.pins) {
        const out = p.y > 44.46 ? 1 : -1;
        const f = new THREE.BoxGeometry(0.64, 0.22, 2.0); f.translate(p.x - W / 2, 0.11, -((p.y + out * 1.0) - H / 2)); feet.push(f);
      }
      const fm = new THREE.Mesh(mergeGeometries(feet), M.tin); g.add(fm);
      this.add('jctl', g);
    }
  }

  // ------------------------------------------------------------ chips
  chip(id, cx, cy, sx, sy, sz, topMat, side = M.chipDark, bottomSide = false) {
    const mats = [side, side, bottomSide ? side : topMat, bottomSide ? topMat : side, side, side];
    const m = new THREE.Mesh(new RoundedBoxGeometry(sx, sz, sy, 2, Math.min(0.12, sz / 3)), mats);
    m.position.copy(P(cx, cy, bottomSide ? -T - sz / 2 : sz / 2));
    this.add(id, m);
    return m;
  }

  buildChips() {
    const socTex = chipTopTexture({
      w: 600, h: 600, base: '#3e4145', rot: Math.PI / 2, dot: [0.08, 0.92, 0.018],
      lines: [
        { t: 'Qualcomm', s: 0.13, y: 0.17, x: 0.42, w: 500 },
        { t: 'QRB2210', s: 0.085, y: 0.36, x: 0.30, w: 500, f: 'Consolas, monospace' },
        { t: '000', s: 0.085, y: 0.47, x: 0.17, w: 500, f: 'Consolas, monospace' },
        { t: 'HU211HMQ', s: 0.08, y: 0.84, x: 0.36, w: 500, f: 'Consolas, monospace' },
      ],
    });
    const soc = new THREE.MeshStandardMaterial({ map: socTex, roughness: 0.58, metalness: 0.05 });
    this.chip('soc', 34.31, 29.77, 12.0, 11.8, 0.95, soc);
    // DRAM marking as seen on production boards (Arduino store photo): "5MB75 / D8CSC", pin-1 dot bottom-left
    const dram = new THREE.MeshStandardMaterial({ map: chipTopTexture({ w: 580, h: 400, base: '#393b3e', ink: 'rgba(200,204,208,0.5)', dot: [0.06, 0.86, 0.014], lines: [
      { t: '5MB75', s: 0.13, y: 0.42, x: 0.36, w: 500, f: 'Consolas, monospace' },
      { t: 'D8CSC', s: 0.13, y: 0.58, x: 0.36, w: 500, f: 'Consolas, monospace' },
    ] }), roughness: 0.6 });
    this.chip('dram', 34.30, 41.875, 14.5, 10.0, 0.85, dram);
    const pmic = new THREE.MeshStandardMaterial({
      map: chipTopTexture({ w: 300, h: 390, base: '#45484c', lines: [
        { t: 'Qualcomm', s: 0.085, y: 0.2, x: 0.5, w: 500 },
        { t: 'PM4125', s: 0.07, y: 0.33, x: 0.42, f: 'Consolas, monospace' },
      ], dot: [0.12, 0.88, 0.025] }), roughness: 0.6,
    });
    this.chip('pmic', 52.47, 37.85, 6.0, 7.8, 0.7, pmic);
    const anx = new THREE.MeshStandardMaterial({ map: chipTopTexture({ w: 256, h: 256, base: '#2f3033', ink: 'rgba(205,208,212,0.55)', dot: [0.13, 0.87, 0.035], lines: [
      { t: 'ANX7625', s: 0.17, y: 0.42, x: 0.5, w: 600, f: 'Consolas, monospace' },
    ] }), roughness: 0.55 });
    this.chip('anx', 16.04, 35.98, 4.0, 4.0, 0.8, anx);

    // Wi-Fi / Bluetooth module (U2901), as on production boards (Arduino store photo ABX00162_06):
    // green module PCB with a U.FL connector in the corner, embossed steel shield with a stepped cut-out,
    // and a white label "Model: WCBN3536A" with a QR code. (The unit-specific MAC line is left off.)
    {
      const g = new THREE.Group();
      const mx0 = 5.455, my1 = 21.86;               // module top-left corner (board mm)
      const modTex = canvasTex(480, 640, (c, w, h) => {
        c.fillStyle = '#2e6b2a'; c.fillRect(0, 0, w, h); noise(c, w, h, 8);
        const X = mm => mm / 12 * w, Y = mm => mm / 16 * h;   // module-relative mm -> px
        c.strokeStyle = '#3f8a37'; c.lineWidth = 7; c.beginPath(); c.moveTo(X(1.7), Y(2.6)); c.bezierCurveTo(X(3.2), Y(2.6), X(3.6), Y(0.9), X(5.4), Y(0.9)); c.stroke();
        c.fillStyle = '#c9c9c3'; c.fillRect(X(3.9), Y(1.3), X(0.9), Y(0.45)); c.fillRect(X(4.0), Y(2.2), X(0.7), Y(0.4));
        c.fillStyle = '#f0f0ea'; c.font = '700 26px Consolas, monospace'; c.fillText('23', X(0.55), Y(4.6));
      });
      const modMat = new THREE.MeshStandardMaterial({ map: modTex, roughness: 0.45 });
      const green = new THREE.Mesh(new THREE.BoxGeometry(12.0, 1.0, 16.0), [M.pcbEdge, M.pcbEdge, modMat, M.pcbEdge, M.pcbEdge, M.pcbEdge]);
      green.position.copy(P(11.455, 13.86, 0.5));
      g.add(green);
      // U.FL antenna connector (gold ring) in the corner cut-out
      const ufl = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.75, 32, 1, true), M.gold); ring.position.y = 0.375; ufl.add(ring);
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16), M.gold); core.position.y = 0.4; ufl.add(core);
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 2.4), new THREE.MeshStandardMaterial({ color: 0xeeeae0, roughness: 0.6 })); base.position.y = 0.125; ufl.add(base);
      ufl.position.copy(P(mx0 + 1.7, my1 - 2.6, 1.0)); g.add(ufl);
      // stepped shield outline (module-relative, measured on the photo): right part full height,
      // middle part starts 3.65 mm down, left part 5.2 mm down
      const s = new THREE.Shape();
      const xa = 5.65, xb = 17.26, ya = 6.06;
      const p1 = mx0 + 3.6, p2 = mx0 + 6.7;
      s.moveTo(xa, ya); s.lineTo(xb, ya); s.lineTo(xb, my1 - 0.56); s.lineTo(p2, my1 - 0.56);
      s.lineTo(p2, my1 - 3.65); s.lineTo(p1, my1 - 3.65); s.lineTo(p1, my1 - 5.2); s.lineTo(xa, my1 - 5.2); s.lineTo(xa, ya);
      const sg = new THREE.ExtrudeGeometry(s, { depth: 1.0, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 });
      sg.rotateX(-Math.PI / 2); sg.translate(-W / 2, 1.0, H / 2);
      const shieldTex = canvasTex(256, 256, (c, w, h) => {
        c.fillStyle = '#d6d5cf'; c.fillRect(0, 0, w, h); noise(c, w, h, 26);
        for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      });
      shieldTex.wrapS = shieldTex.wrapT = THREE.RepeatWrapping; shieldTex.repeat.set(0.18, 0.18);
      const shield = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map: shieldTex, color: 0xffffff, roughness: 0.42, metalness: 1 }));
      g.add(shield);
      // white label on the shield (module-relative x 0.4–11.6 mm, y 5.5–15.9 mm)
      const lw = 11.2, lh = 10.4;
      const labelTex = canvasTex(560, 520, (c, w, h) => {
        c.fillStyle = '#f4f3ef'; c.fillRect(0, 0, w, h); noise(c, w, h, 5);
        const k = w / lw;                                   // px per mm
        const qr = qrcode(0, 'M'); qr.addData('WCBN3536A'); qr.make();
        const n = qr.getModuleCount(), q = 4.0 * k / n, qx = 5.2 * k, qy = 1.1 * k;
        c.fillStyle = '#151515';
        for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (qr.isDark(r, col)) c.fillRect(qx + col * q, qy + r * q, Math.ceil(q), Math.ceil(q));
        c.fillStyle = '#2a2a2a'; c.font = `500 ${Math.round(0.95 * k)}px Arial, Helvetica, sans-serif`;
        c.fillText('Model:', 0.55 * k, 6.5 * k);
        c.fillText('WCBN3536A', 0.55 * k, 7.9 * k);
      });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.75 }));
      label.rotation.x = -Math.PI / 2;
      label.position.copy(P(mx0 + 0.4 + lw / 2, my1 - 5.5 - lh / 2, 2.09));
      g.add(label);
      this.add('wifi', g);
    }

    // large power inductor (from STEP keep-out) and crystal
    {
      // shielded power inductor: black body marked "3R3" (3.3 µH) in Arduino's product photos
      const ind = box(26.655, 14.165, 0, 5.9, 5.8, 2.0, new THREE.MeshStandardMaterial({ color: 0x1e1f21, roughness: 0.55 }), 0.5);
      const indTex = chipTopTexture({ w: 256, h: 256, base: '#242528', ink: 'rgba(225,228,230,0.75)', lines: [{ t: '3R3', s: 0.3, y: 0.52, w: 700, f: 'Consolas, monospace' }], rot: Math.PI / 2 });
      const top = box(26.655, 14.165, 1.99, 4.6, 4.5, 0.04, new THREE.MeshStandardMaterial({ map: indTex, roughness: 0.6 }), 0);
      const g = new THREE.Group(); g.add(ind, top); this.group.add(g);
      const xb = box(14.9, 30.05, 0, 2.5, 3.2, 0.22, new THREE.MeshStandardMaterial({ color: 0xd8cfb8, roughness: 0.7 }));
      const xl = box(14.9, 30.05, 0.2, 2.3, 3.0, 0.55, M.steelSatin, 0.12);
      this.group.add(xb, xl);
    }
  }

  // ------------------------------------------------------------ connectors & button
  buildConnectors() {
    // USB-C receptacle (JUSB1)
    {
      const g = new THREE.Group();
      const Wd = 8.94, Hh = 3.16, r = 1.32, wall = 0.24, L = 7.2, xStart = -0.52, yc = 37.86;
      const sh = rrShape(Wd, Hh, r); sh.holes.push(rrShape(Wd - 2 * wall, Hh - 2 * wall, r - wall));
      const shell = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2, curveSegments: 18 });
      shell.rotateY(Math.PI / 2);
      shell.translate(xStart - W / 2, Hh / 2, -(yc - H / 2));
      g.add(new THREE.Mesh(shell, M.steel));
      const back = new THREE.ExtrudeGeometry(rrShape(Wd, Hh, r), { depth: 0.3, bevelEnabled: false, curveSegments: 18 });
      back.rotateY(Math.PI / 2); back.translate(xStart + L - 0.3 - W / 2, Hh / 2, -(yc - H / 2));
      g.add(new THREE.Mesh(back, M.steel));
      const tongueTex = canvasTex(256, 64, (c, w, h) => {
        c.fillStyle = '#121214'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#d7ad55';
        for (let i = 0; i < 12; i++) c.fillRect(12 + i * 19.5, 0, 9, h * 0.62);
      });
      const tMat = new THREE.MeshStandardMaterial({ map: tongueTex, roughness: 0.4, metalness: 0.3 });
      const tongue = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.66, 6.65), [M.chipDark, M.chipDark, tMat, tMat, M.chipDark, M.chipDark]);
      tongue.position.copy(P(xStart + 1.1 + 2.3, yc, Hh / 2));
      g.add(tongue);
      const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.2, Hh - 2 * wall - 0.05, Wd - 2 * wall - 0.05), M.chipDark);
      cavity.position.copy(P(xStart + L - 0.45, yc, Hh / 2)); g.add(cavity);
      for (const [lx, ly] of [[2.17, 33.53], [2.17, 42.17], [6.72, 33.53], [6.72, 42.17]]) {
        g.add(box(lx, ly, -0.7, 1.1, 0.35, 1.9, M.steel));
      }
      this.add('usbc', g);
      this.usbMouth = P(xStart, yc, Hh / 2);
    }
    // Power button JBTN1
    {
      const g = new THREE.Group(); const cx = 5.84, cy = 49.41;
      g.add(box(cx, cy, 0, 5.3, 5.3, 1.25, new THREE.MeshStandardMaterial({ color: 0xd8d8d4, roughness: 0.5 }), 0.25));
      g.add(box(cx, cy, 1.22, 5.1, 5.1, 0.16, M.steelSatin, 0.06));
      const act = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.25, 0.75, 40), M.btnWhite);
      act.position.copy(P(cx, cy, 1.38 + 0.375)); g.add(act);
      for (const [dx, dy] of [[-3.1, 2.0], [3.1, 2.0], [-3.1, -2.0], [3.1, -2.0]]) g.add(box(cx + dx, cy + dy, 0, 1.0, 0.9, 0.3, M.tin));
      this.add('pwrbtn', g);
      this.btnActuator = act;
    }
    // Qwiic (JST SH 4-pin, right angle), opening faces the board edge (+x)
    {
      const g = new THREE.Group(); const cx = 65.935, cy = 14.355;
      const frontTex = canvasTex(256, 128, (c, w, h) => {
        c.fillStyle = '#efede4'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#1a1a1a'; c.fillRect(22, 30, w - 44, h - 52);
        c.fillStyle = '#d6aa52'; for (let i = 0; i < 4; i++) c.fillRect(54 + i * 44, 52, 10, 30);
      });
      const fMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.6 });
      const body = new THREE.Mesh(new RoundedBoxGeometry(4.25, 2.9, 6.0, 2, 0.15), [fMat, M.whiteNylon, M.whiteNylon, M.whiteNylon, M.whiteNylon, M.whiteNylon]);
      body.position.copy(P(cx, cy, 1.45)); g.add(body);
      g.add(box(cx - 0.6, cy + 3.3, 0, 1.6, 0.7, 1.7, M.tin));
      g.add(box(cx - 0.6, cy - 3.3, 0, 1.6, 0.7, 1.7, M.tin));
      this.add('qwiic', g);
    }
  }

  // ------------------------------------------------------------ LEDs
  buildLEDs() {
    // LED matrix: 104 x 0603 blue LEDs at 45°, 13 columns x 8 rows (positions from the official STEP model)
    const N = 104;
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.5, 0.8);
    const bodies = new THREE.InstancedMesh(bodyGeo, M.ledBody, N);
    // Lit LED = opaque bright-blue emitter on top of the package (like Arduino's photo of the lit matrix),
    // plus a strong additive halo on the board. Unlit LEDs hide both (instance scale 0).
    const glowGeo = new THREE.BoxGeometry(1.3, 0.06, 0.66);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const glows = new THREE.InstancedMesh(glowGeo, glowMat, N);
    const coreGeo = new THREE.BoxGeometry(0.62, 0.07, 0.32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const cores = new THREE.InstancedMesh(coreGeo, coreMat, N);
    const haloGeo = new THREE.PlaneGeometry(4.0, 4.0); haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({ map: haloTexture(), color: 0xffffff, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const halos = new THREE.InstancedMesh(haloGeo, haloMat, N);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
    this.matrixPos = [];
    this.matrixXf = [];
    for (let row = 0; row < 8; row++) for (let col = 0; col < 13; col++) {
      const i = row * 13 + col;
      const x = 32.2555 + col * 2.1008, y = 19.4755 - row * 1.9993;
      this.matrixPos.push([x, y]);
      m.compose(P(x, y, 0.25), q, new THREE.Vector3(1, 1, 1)); bodies.setMatrixAt(i, m);
      this.matrixXf.push({ glow: P(x, y, 0.53), core: P(x, y, 0.565), halo: P(x, y, 0.62), q: q.clone() });
      glows.setColorAt(i, new THREE.Color(0, 0, 0)); cores.setColorAt(i, new THREE.Color(0, 0, 0)); halos.setColorAt(i, new THREE.Color(0, 0, 0));
    }
    glows.renderOrder = 5; cores.renderOrder = 5; halos.renderOrder = 6;
    bodies.castShadow = true; bodies.receiveShadow = true;
    const g = new THREE.Group(); g.add(bodies, glows, cores, halos);
    this.add('matrix', g);
    this.matrixGlow = glows; this.matrixCore = cores; this.matrixHalo = halos;
    // one blue light for the whole matrix: tints the board around it in proportion to how many LEDs are lit
    this.matrixLight = new THREE.PointLight(0x2a5cff, 0, 70, 2);
    this.matrixLight.position.copy(P(44.86, 12.48, 7)); g.add(this.matrixLight);
    this.matrixState = new Float32Array(N);
    this.setMatrix(null);
    this.proxy('matrix', 44.86, 12.48, 0, 27.6, 16.4, 0.7);

    // RGB LEDs 1–4 (1 x 1 mm) and power LED
    const mkLed = (id, x, y, sx, sy) => {
      const g = new THREE.Group();
      g.add(box(x, y, 0, sx, sy, 0.3, M.ledBase, 0.05));
      g.add(box(x, y, 0.3, sx * 0.92, sy * 0.92, 0.12, M.ledBody, 0.04));
      const glow = new THREE.Mesh(new THREE.BoxGeometry(sx * 0.86, 0.06, sy * 0.86), new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }));
      glow.position.copy(P(x, y, 0.45)); glow.visible = false; g.add(glow);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0x000000, toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.set(4.6, 4.6, 1); halo.position.copy(P(x, y, 0.8)); halo.renderOrder = 6; g.add(halo);
      const light = new THREE.PointLight(0xffffff, 0, 18, 2);
      light.position.copy(P(x, y, 1.6)); g.add(light);
      this.add(id, g);
      this.leds[id] = { glow, halo, light, rgb: [0, 0, 0] };
      this.proxy(id, x, y, 0, sx + 0.5, sy + 0.35, 0.55);
    };
    mkLed('rgb1', 65.03, 42.165, 1.0, 1.0);
    mkLed('rgb2', 65.03, 44.07, 1.0, 1.0);
    mkLed('rgb3', 65.03, 45.98, 1.0, 1.0);
    mkLed('rgb4', 65.03, 47.885, 1.0, 1.0);
    mkLed('pwrled', 2.31, 31.2, 1.6, 0.8);
  }

  setLed(id, r, g, b, intensity = 1) {
    const L = this.leds[id]; if (!L) return;
    L.rgb = [r, g, b];
    const on = r + g + b > 0;
    // LED colours: red ~ 625 nm, green ~ 525 nm, blue ~ 465 nm
    const c = new THREE.Color(0, 0, 0);
    c.r += r * 1.0 + g * 0.05; c.g += r * 0.06 + g * 1.0 + b * 0.25; c.b += g * 0.15 + b * 1.0;
    // opaque saturated emitter (tone mapping off) + strong additive halo, so a lit LED is clearly visible
    // keep the emitter saturated (values ≈ 1): brighter values are pushed toward white by the ACES tone mapping
    const k = 1.0 * intensity;
    L.glow.visible = on;
    L.glow.material.color.setRGB(c.r * k, c.g * k, c.b * k);
    L.halo.material.color.setRGB(c.r * 1.0 * intensity, c.g * 1.0 * intensity, c.b * 1.0 * intensity);
    L.light.color.setRGB(Math.min(1, c.r), Math.min(1, c.g), Math.min(1, c.b));
    L.light.intensity = on ? 14 * intensity : 0;
  }

  setPowerLed(on) { this.setLed('pwrled', 0, on ? 1 : 0, 0, 0.8); }

  /** frame: array of 104 numbers 0..1 (row-major, 8 rows x 13 columns, row 0 at the top) */
  setMatrix(frame) {
    // linear-space colours (tone mapping off): emitter = saturated blue, core = blue-white hot spot
    // Colours chosen to stay deep blue through the ACES tone mapping in the final pass
    // (bright, whitish values get pushed toward white there, which made lit LEDs look pale).
    const emit = new THREE.Color(0.0, 0.05, 1.0), core = new THREE.Color(0.05, 0.22, 1.0), halo = new THREE.Color(0.0, 0.06, 1.0);
    const m = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), zero = new THREE.Vector3(0, 0, 0);
    let total = 0;
    for (let i = 0; i < 104; i++) {
      const v = frame ? Math.min(1, Math.max(0, frame[i] || 0)) : 0;
      this.matrixState[i] = v; total += v;
      const X = this.matrixXf[i], on = v > 0.001;
      m.compose(X.glow, X.q, on ? one : zero); this.matrixGlow.setMatrixAt(i, m);
      m.compose(X.core, X.q, on ? one : zero); this.matrixCore.setMatrixAt(i, m);
      m.compose(X.halo, X.q, on ? one : zero); this.matrixHalo.setMatrixAt(i, m);
      this.matrixGlow.setColorAt(i, emit.clone().multiplyScalar(0.5 + 1.0 * v));
      this.matrixCore.setColorAt(i, core.clone().multiplyScalar(0.5 + 1.4 * v));
      this.matrixHalo.setColorAt(i, halo.clone().multiplyScalar(1.1 * v));
    }
    for (const im of [this.matrixGlow, this.matrixCore, this.matrixHalo]) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }
    this.matrixLight.intensity = 40 * total / 104;
  }

  // ------------------------------------------------------------ auto-detected SMD parts (from paste layer)
  buildSmallParts() {
    const mk = (list, bottom) => {
      const passives = list.filter(p => p.t === 'p');
      const ics = list.filter(p => p.t === 'ic');
      const rng = mulberry32(bottom ? 99 : 42);
      const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
      const body = new THREE.InstancedMesh(bodyGeo, M.ceramicA, passives.length);
      const ends = new THREE.InstancedMesh(bodyGeo, M.capEnd, passives.length);
      const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      const palette = [0xb39a72, 0xa58e69, 0x8f8576, 0xc0a67b, 0x9b8a6a];
      passives.forEach((p, i) => {
        const w = p.w, l = p.l;
        const big = w > 1.4 || l > 2.6;
        let h = w < 0.36 ? 0.3 : w < 0.62 ? 0.5 : w < 0.95 ? 0.8 : 1.0;
        if (big) h = 1.1;
        const resistor = !big && rng() < 0.28;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.r === 90 ? Math.PI / 2 : 0);
        const z = bottom ? -T - h / 2 : h / 2;
        s.set(l * 0.62, h * 1.0, w * 0.98);
        mtx.compose(P(p.x, p.y, z), q, s); body.setMatrixAt(i, mtx);
        s.set(l, h * 0.94, w * 0.94);
        mtx.compose(P(p.x, p.y, z), q, s); ends.setMatrixAt(i, mtx);
        const col = resistor ? new THREE.Color(0x141414) : big ? new THREE.Color(0x55585c) : new THREE.Color(palette[Math.floor(rng() * palette.length)]);
        body.setColorAt(i, col);
      });
      if (body.instanceColor) body.instanceColor.needsUpdate = true;
      const icBody = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.06), M.chipDark, Math.max(1, ics.length));
      ics.forEach((p, i) => {
        const h = p.n <= 3 ? 0.9 : 0.6;
        const shrink = p.n <= 3 ? 0.55 : 0.9;
        s.set(Math.max(0.5, p.l * shrink), h, Math.max(0.5, p.w * shrink));
        mtx.compose(P(p.x, p.y, bottom ? -T - h / 2 : h / 2), new THREE.Quaternion(), s);
        icBody.setMatrixAt(i, mtx);
      });
      icBody.count = ics.length;
      const g = new THREE.Group(); g.add(body, ends, icBody);
      g.traverse(o => { o.castShadow = true; o.receiveShadow = true; o.userData.noPick = true; });
      this.group.add(g);
    };
    mk(boardData.partsTop, false);
    mk(boardData.partsBottom, true);
  }

  // ------------------------------------------------------------ bottom side
  buildBottom() {
    const mcuTex = chipTopTexture({ w: 360, h: 360, base: '#1f2022', ink: 'rgba(210,214,218,0.6)', dot: [0.12, 0.12, 0.03], lines: [
      { t: 'STM32U585', s: 0.13, y: 0.5, x: 0.5, w: 600, f: 'Consolas, monospace' },
    ] });
    mcuTex.center.set(0.5, 0.5); mcuTex.rotation = Math.PI;
    this.chip('mcu', 43.965, 11.905, 7.0, 7.0, 0.6, new THREE.MeshStandardMaterial({ map: mcuTex, roughness: 0.5 }), M.chipDark, true);
    this.chip('emmc', 47.03, 25.98, 11.5, 13.0, 0.9, new THREE.MeshStandardMaterial({ map: chipTopTexture({ w: 300, h: 340, base: '#232426', dot: [0.1, 0.1, 0.025] }), roughness: 0.55 }), M.chipDark, true);
    const slotTex = canvasTex(64, 820, (c, w, h) => {
      c.fillStyle = '#19191a'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 30; i++) for (let k = 0; k < 2; k++) {
        const y = 14 + i * (h - 28) / 29, x = 18 + k * 28;
        c.fillStyle = '#050505'; c.fillRect(x - 6, y - 5, 12, 10);
        c.fillStyle = '#c9a04e'; c.fillRect(x - 2, y - 1, 4, 2);
      }
    });
    const slotMat = new THREE.MeshStandardMaterial({ map: slotTex, roughness: 0.55 });
    for (const [id, x0] of [['jmedia', 10.18], ['jmisc', 57.05]]) {
      const m = new THREE.Mesh(new RoundedBoxGeometry(3.0, 5.0, 38.5, 2, 0.15), [M.blackPlastic, M.blackPlastic, M.blackPlastic, slotMat, M.blackPlastic, M.blackPlastic]);
      m.position.copy(P(x0 + 1.5, 26.68, -T - 2.5));
      this.add(id, m);
    }
  }

  // ------------------------------------------------------------ helpers for the app
  partCenter(id) {
    const g = this.parts[id];
    const b = new THREE.Box3();
    if (g) b.setFromObject(g);
    const proxies = this.proxies.filter(p => p.userData.part === id);
    for (const p of proxies) b.expandByObject(p);
    if (b.isEmpty()) return { center: new THREE.Vector3(), size: 20 };
    const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    return { center: c, size: Math.max(s.x, s.y, s.z), box: b };
  }

  pressButton(down) { if (this.btnActuator) this.btnActuator.position.y = down ? 1.38 + 0.375 - 0.25 : 1.38 + 0.375; }
}

let _halo = null;
function haloTexture() {
  if (_halo) return _halo;
  _halo = canvasTex(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    r.addColorStop(0.45, 'rgba(255,255,255,0.14)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  }, { srgb: false });
  return _halo;
}
export { haloTexture };

function mulberry32(a) {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

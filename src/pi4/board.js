// Realistic 3D Raspberry Pi 4 Model B.
//
// Geometry: positions, outlines and heights from the official Raspberry Pi 4 mechanical drawing
// (datasheets.raspberrypi.com/rpi4/raspberry-pi-4-mechanical-drawing.pdf, read from its vector data):
// board 85 x 56 mm, corner radius 3 mm, four holes 3.5 mm from the edges, 58 x 49 mm apart.
// Surface: real photos straightened onto the board's millimetre grid using the four mounting holes
//   top    — "Raspberry Pi 4 Model B - Top.jpg", Laserlicht, CC BY-SA 4.0 (Wikimedia Commons)
//   bottom — "Raspberry Pi 4, 2 GB RAM version 7.jpg", Suyash Dwivedi, CC BY-SA 4.0 (Wikimedia Commons)
// The textures cover x = -4 … 89 mm, y = -4 … 60 mm (36 px/mm) so connectors that overhang the edge keep their photo tops.
// Board coordinates: mm, origin at the bottom-left corner of the top view (USB-C edge = y 0, GPIO edge = y 56), x right, y up.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, canvasTex } from '../materials.js';
import { haloTexture } from '../board.js';
import topPhoto from '../../assets/pi4/pi4_top.jpg';
import bottomPhoto from '../../assets/pi4/pi4_bottom.jpg';
import { J8 } from './data.js';

export const W = 85, H = 56, T = 1.4;
export const P = (x, y, z = 0) => new THREE.Vector3(x - W / 2, z, -(y - H / 2));
const TX0 = -4, TY0 = -4, TW = 93, TH = 64;                     // texture extent in mm
const uvOf = (x, y) => [(x - TX0) / TW, (y - TY0) / TH];

const loader = new THREE.TextureLoader();
function photo(url) {
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = M.aniso || 8;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/** Box from board rectangle (x0..x1, y0..y1) and height z0..z1. Faces: [+x, −x, top, bottom, front(−y), back(+y)].
 *  The top (or bottom) face samples the straightened photo at the same board position. */
function photoBox(x0, y0, x1, y1, z0, z1, mats, { r = 0, photoFace = 'top' } = {}) {
  const w = x1 - x0, d = y1 - y0, h = z1 - z0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
  const pos = g.attributes.position, nrm = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const ny = nrm.getY(i);
    if ((photoFace === 'top' && ny > 0.5) || (photoFace === 'bottom' && ny < -0.5)) {
      const [u, v] = uvOf(cx + pos.getX(i), cy - pos.getZ(i)); uv.setXY(i, u, v);
    }
  }
  const m = new THREE.Mesh(g, mats);
  m.position.copy(P(cx, cy, (z0 + z1) / 2));
  return m;
}

/** Set UVs so faces pointing up show the photo at their board position; every other face samples one representative
 *  point of the same part in the photo (so sides and inner walls get the part's real colour). */
function mapUV(geo, toBoard, sample) {
  const pos = geo.attributes.position, nrm = geo.attributes.normal;
  let uv = geo.attributes.uv; if (!uv) { uv = new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2); geo.setAttribute('uv', uv); }
  for (let i = 0; i < pos.count; i++) {
    const [x, y] = nrm.getY(i) > 0.6 ? toBoard(pos.getX(i), pos.getY(i), pos.getZ(i)) : sample;
    const [u, v] = uvOf(x, y); uv.setXY(i, u, v);
  }
}

function brushedSteel() {
  const t = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#cfcec9'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = 150 + Math.random() * 105 | 0; c.fillStyle = `rgba(${v},${v},${v - 4},0.07)`; c.fillRect(Math.random() * w, Math.random() * h, 30 + Math.random() * 140, 1); }
    const g = c.createLinearGradient(0, h, 0, h * 0.55); g.addColorStop(0, 'rgba(40,40,38,0.38)'); g.addColorStop(1, 'rgba(40,40,38,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);   // darker toward the board (contact shading)
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export class Pi4Board {
  constructor() {
    this.group = new THREE.Group(); this.group.name = 'Raspberry Pi 4';
    this.parts = {}; this.proxies = []; this.pins = {}; this.leds = {};
    this.powered = false;
    this.usbMouth = P(11.21, -1.26, 1.6); this.usbRotY = Math.PI / 2;   // USB-C opening faces −y (board edge)
    this.build();
  }
  part(id) { if (!this.parts[id]) { const g = new THREE.Group(); g.name = id; g.userData.part = id; this.parts[id] = g; this.group.add(g); } return this.parts[id]; }
  add(id, obj) { obj.traverse(o => { o.userData.part = id; }); this.part(id).add(obj); return obj; }
  proxy(id, cx, cy, z0, sx, sy, sz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sz, sy), M.invisible);
    m.position.copy(P(cx, cy, z0 + sz / 2)); m.userData.part = id; m.userData.proxy = true;
    this.group.add(m); this.proxies.push(m); return m;
  }

  build() {
    const top = this.topTex = photo(topPhoto), bot = this.botTex = photo(bottomPhoto);
    // photo materials: part of the colour comes from emission so the real colours stay true under the scene lighting
    const mk = (map, o = {}) => new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.32, roughness: 0.62, metalness: 0, ...o });
    this.mat = {
      pcbTop: new THREE.MeshPhysicalMaterial({ map: top, emissiveMap: top, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.55, metalness: 0, clearcoat: 0.28, clearcoatRoughness: 0.35 }),
      pcbBot: new THREE.MeshPhysicalMaterial({ map: bot, emissiveMap: bot, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.55, clearcoat: 0.22, clearcoatRoughness: 0.4, side: THREE.BackSide }),
      photo: mk(top),
      photoMetal: mk(top, { roughness: 0.32, metalness: 0.45, emissiveIntensity: 0.28 }),
      photoBot: mk(bot, { roughness: 0.35, metalness: 0.4 }),
      shield: new THREE.MeshStandardMaterial({ map: brushedSteel(), roughness: 0.27, metalness: 0.92 }),
      cavity: Array(6).fill(new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.85, side: THREE.BackSide })),
      beige: new THREE.MeshStandardMaterial({ color: 0xdccfb0, roughness: 0.6 }),
      darkIn: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.85 }),
      black: M.blackPlastic,
      chipSide: new THREE.MeshStandardMaterial({ color: 0x19191b, roughness: 0.6 }),
      substrate: new THREE.MeshStandardMaterial({ color: 0x2e3a2a, roughness: 0.6 }),
      edge: new THREE.MeshStandardMaterial({ color: 0x8fa14b, roughness: 0.7 }),
      pin: new THREE.MeshStandardMaterial({ color: 0xd9b56a, roughness: 0.25, metalness: 1 }),
    };
    this.buildPCB();
    this.buildHeaders();
    this.buildPorts();
    this.buildChips();
    this.buildBottom();
    this.buildLEDs();
    this.group.traverse(o => {
      if (o.isMesh && !o.userData.proxy) { o.castShadow = true; o.receiveShadow = true; }
      if (o.isSprite) o.raycast = () => {};
    });
  }

  // ------------------------------------------------------------ PCB with the real mounting holes
  buildPCB() {
    const s = new THREE.Shape(), r = 3;
    s.moveTo(r, 0); s.lineTo(W - r, 0); s.absarc(W - r, r, r, -Math.PI / 2, 0); s.lineTo(W, H - r); s.absarc(W - r, H - r, r, 0, Math.PI / 2);
    s.lineTo(r, H); s.absarc(r, H - r, r, Math.PI / 2, Math.PI); s.lineTo(0, r); s.absarc(r, r, r, Math.PI, Math.PI * 1.5);
    this.holes = [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]];
    for (const [x, y] of this.holes) { const p = new THREE.Path(); p.absarc(x, y, 1.36, 0, Math.PI * 2, true); s.holes.push(p); }
    const face = new THREE.ShapeGeometry(s, 32);
    const pos = face.attributes.position, uv = face.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const [u, v] = uvOf(pos.getX(i), pos.getY(i)); uv.setXY(i, u, v); }
    face.rotateX(-Math.PI / 2); face.translate(-W / 2, 0, H / 2);
    const topM = new THREE.Mesh(face, this.mat.pcbTop);
    const botM = new THREE.Mesh(face.clone().translate(0, -T, 0), this.mat.pcbBot);
    const eg = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 32 });
    eg.rotateX(-Math.PI / 2); eg.translate(-W / 2, -T, H / 2);
    const edge = new THREE.Mesh(eg, [M.invisible, this.mat.edge]);
    const g = new THREE.Group(); g.add(topM, botM, edge);
    this.add('pcb', g);
    for (const [x, y] of this.holes) this.proxy('holes', x, y, -T - 0.1, 6.2, 6.2, T + 0.3);
  }

  // ------------------------------------------------------------ 40-pin GPIO header J8 and PoE header J14
  buildHeaders() {
    const base = 2.5, top = 8.5, sq = 0.64;                         // header height 8.5 mm from the drawing
    const pinGeo = new THREE.BoxGeometry(sq, top - base + 0.2, sq);
    const tipGeo = new THREE.ConeGeometry(sq * 0.62, 0.35, 4); tipGeo.rotateY(Math.PI / 4);
    const tailGeo = new THREE.CylinderGeometry(0.55, 0.75, 0.6, 12);
    const addPins = (id, list) => {
      const g = new THREE.Group();
      for (const [x, y] of list) {
        const p = new THREE.Mesh(pinGeo, this.mat.pin); p.position.copy(P(x, y, base + (top - base) / 2 - 0.1)); g.add(p);
        const t = new THREE.Mesh(tipGeo, this.mat.pin); t.position.copy(P(x, y, top + 0.05)); g.add(t);
        const s = new THREE.Mesh(tailGeo, M.solder); s.position.copy(P(x, y, -T - 0.3)); g.add(s);
      }
      this.add(id, g);
    };
    // J8: 7.11..57.92 x 49.98..54.98 in the drawing. Pin 1 (square pad on the underside) is at the SD-card end, inner row.
    this.add('gpio', photoBox(7.11, 49.98, 57.92, 54.98, 0, base, [this.mat.black, this.mat.black, this.mat.photo, this.mat.black, this.mat.black, this.mat.black]));
    const pinsXY = [];
    for (const p of J8) {
      const col = Math.floor((p.pin - 1) / 2), x = 32.515 + (col - 9.5) * 2.54, y = 52.48 + (p.pin % 2 ? -1.27 : 1.27);
      pinsXY.push([x, y]);
      this.pins[p.id] = { pos: P(x, y, top + 0.2), female: P(x, y, base + 3.0), x, y, header: 'J8' };
      const pr = this.proxy('pin:' + p.id, x, y, top - 1.2, 2.2, 2.2, 1.6); pr.userData.pin = p.id;
    }
    addPins('gpio', pinsXY);
    // J14 PoE: 2 x 2 at 2.54 mm, block 59.01..64.01 x 43.84..48.84
    this.add('poe', photoBox(59.01, 43.84, 64.01, 48.84, 0, base, [this.mat.black, this.mat.black, this.mat.photo, this.mat.black, this.mat.black, this.mat.black]));
    addPins('poe', [[60.24, 45.07], [62.78, 45.07], [60.24, 47.61], [62.78, 47.61]]);
    // J2 RUN / GLOBAL_EN: three plated holes, no pins fitted (seen in the photo)
    this.proxy('j2', 11.6, 21.0, 0, 8.0, 3.0, 0.4);
  }

  // ------------------------------------------------------------ connectors (outlines + heights from the drawing)
  buildPorts() {
    const S = this.mat.shield, pm = this.mat.photoMetal, cav = this.mat.cavity, K = this.mat.black;
    const shellMats = [S, S, pm, S, S, S];
    const solid = (id, x0, y0, x1, y1, z0, z1, mats = shellMats) => this.add(id, photoBox(x0, y0, x1, y1, z0, z1, mats));
    const e = 0.03, hollow = (id, x0, y0, x1, y1, z0, z1) => { const m = photoBox(x0 + e, y0 + e, x1 - e, y1 - e, z0 + e, z1 - e, cav); this.add(id, m); return m; };

    // ---- USB double stacks (opening at +x): metal shell, two real cavities, tongues with gold contacts
    const usbStack = (id, x0, y0, x1, y1, blue) => {
      const depth = 9.0, xf = x1 - depth, wall = 0.45;
      solid(id, x0, y0, xf, y1, 0, 16);                                       // rear block
      solid(id, xf, y0, x1, y0 + wall, 0, 16); solid(id, xf, y1 - wall, x1, y1, 0, 16);   // side walls
      for (const [za, zb] of [[0, 1.5], [6.62, 9.2], [14.32, 16]]) solid(id, xf, y0 + wall, x1, y1 - wall, za, zb);
      const tongue = new THREE.MeshStandardMaterial({ color: blue ? 0x2a86dc : 0x18181a, roughness: 0.45 });
      for (const [za, zb] of [[1.5, 6.62], [9.2, 14.32]]) {
        hollow(id, xf, y0 + wall, x1, y1 - wall, za, zb);
        this.add(id, photoBox(xf + 0.2, y0 + 1.15, x1 - 1.1, y1 - 1.15, za + 0.55, za + 2.35, [tongue, tongue, tongue, tongue, tongue, tongue]));
        const n = blue ? 9 : 4, span = (y1 - y0) - 3.4;
        for (let i = 0; i < n; i++) {                                         // contacts on the top of the tongue
          const yc = y0 + 1.7 + (n === 1 ? span / 2 : i * span / (n - 1)), long = !blue || i % 2 === 0 || i === n - 1;
          this.add(id, photoBox(x1 - (long ? 6.5 : 4.0), yc - 0.25, x1 - 1.3, yc + 0.25, za + 2.35, za + 2.45, [M.gold, M.gold, M.gold, M.gold, M.gold, M.gold]));
        }
      }
    };
    usbStack('usb3', 70.52, 20.41, 88.02, 33.55, true);
    usbStack('usb2', 70.31, 2.42, 88.02, 15.56, false);

    // ---- Gigabit Ethernet RJ45 (opening at +x, latch slot at the bottom, two LED lenses in the bottom corners)
    {
      const id = 'ethernet', x0 = 66.66, y0 = 37.98, x1 = 88.02, y1 = 53.49, xf = x1 - 14, yc = (y0 + y1) / 2;
      const oy0 = yc - 5.85, oy1 = yc + 5.85, ly0 = yc - 2.85, ly1 = yc + 2.85;
      solid(id, x0, y0, xf, y1, 0, 13.5);
      solid(id, xf, y0, x1, oy0, 0, 13.5); solid(id, xf, oy1, x1, y1, 0, 13.5);
      solid(id, xf, oy0, x1, oy1, 11.6, 13.5); solid(id, xf, oy0, x1, oy1, 0, 1.8);
      solid(id, xf, oy0, x1, ly0, 1.8, 5.0); solid(id, xf, ly1, x1, oy1, 1.8, 5.0);
      hollow(id, xf, oy0, x1, oy1, 5.0, 11.6); hollow(id, xf, ly0, x1, ly1, 1.8, 5.0);
      for (let i = 0; i < 8; i++) {                                           // eight contact springs at the top of the opening
        const y = yc + (i - 3.5) * 1.02;
        this.add(id, photoBox(xf + 1.5, y - 0.18, xf + 8.5, y + 0.18, 10.9, 11.3, [M.gold, M.gold, M.gold, M.gold, M.gold, M.gold]));
      }
      const lens = (ya, yb, col) => { const m = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.15, transmission: 0.2, transparent: true, opacity: 0.92 }); this.add(id, photoBox(x1 - 0.2, ya, x1 + 0.12, yb, 0.5, 1.6, [m, m, m, m, m, m])); };
      lens(oy0 - 1.4, oy0 + 0.6, 0x7fd06a); lens(oy1 - 0.6, oy1 + 1.4, 0xf0be4a);
    }

    // ---- USB-C power: stadium-shaped metal tube (opening at −y), tongue inside
    const tube = (id, cx, yFront, yBack, outer, inner, mat, sample) => {
      const sh = outer(); sh.holes.push(inner());
      const g = new THREE.ExtrudeGeometry(sh, { depth: yBack - yFront, bevelEnabled: false, curveSegments: 18 });
      const m = new THREE.Mesh(g, mat); m.position.copy(P(cx, yBack, 0));
      mapUV(g, (lx, ly, lz) => [cx + lx, yBack - lz], sample);
      this.add(id, m); return m;
    };
    const stadium = (w, h, r, cx = 0, cz = 0) => () => { const s = new THREE.Shape(), x0 = cx - w / 2, z0 = cz - h / 2; s.moveTo(x0 + r, z0); s.lineTo(x0 + w - r, z0); s.absarc(x0 + w - r, z0 + r, r, -Math.PI / 2, 0); s.lineTo(x0 + w, z0 + h - r); s.absarc(x0 + w - r, z0 + h - r, r, 0, Math.PI / 2); s.lineTo(x0 + r, z0 + h); s.absarc(x0 + r, z0 + h - r, r, Math.PI / 2, Math.PI); s.lineTo(x0, z0 + r); s.absarc(x0 + r, z0 + r, r, Math.PI, Math.PI * 1.5); return s; };
    {
      const cx = 11.21;
      tube('usbc', cx, -1.26, 6.14, stadium(8.66, 3.2, 1.45, 0, 1.6), stadium(8.1, 2.66, 1.2, 0, 1.6), pm, [cx, 4.5]);
      this.add('usbc', photoBox(cx - 4.0, 5.2, cx + 4.0, 6.1, 0.3, 2.9, [S, S, S, S, this.mat.darkIn, S]));
      const tg = new THREE.MeshStandardMaterial({ color: 0x1d1d20, roughness: 0.5 });
      this.add('usbc', photoBox(cx - 3.3, -0.5, cx + 3.3, 5.2, 1.25, 1.95, [tg, tg, tg, tg, tg, tg]));
      for (let i = 0; i < 12; i++) { const x = cx - 2.75 + i * 0.5; this.add('usbc', photoBox(x - 0.12, -0.3, x + 0.12, 1.6, 1.95, 1.99, [M.gold, M.gold, M.gold, M.gold, M.gold, M.gold])); }
    }

    // ---- micro-HDMI 0 / 1: silver shells (the orange on top is a translucent amber film, seen in the photo) with a trapezoid opening (−y), flange at the front, tongue inside
    const trap = (w, h, cut, cz) => () => { const s = new THREE.Shape(), x0 = -w / 2, z0 = cz - h / 2; s.moveTo(x0 + cut, z0); s.lineTo(x0 + w - cut, z0); s.lineTo(x0 + w, z0 + cut); s.lineTo(x0 + w, z0 + h); s.lineTo(x0, z0 + h); s.lineTo(x0, z0 + cut); s.closePath(); return s; };
    const rect = (w, h, cz) => () => stadium(w, h, 0.25, 0, cz)();
    for (const [id, cx] of [['hdmi0', 26.01], ['hdmi1', 39.51]]) {
      tube(id, cx, -0.85, 3.0, rect(6.2, 3.0, 1.5), trap(5.6, 2.4, 0.7, 1.5), pm, [cx, 5.6]);
      tube(id, cx, -1.45, -0.85, rect(7.21, 3.05, 1.52), trap(5.6, 2.4, 0.7, 1.5), pm, [cx, 5.6]);
      this.add(id, photoBox(cx - 3.1, 3.0, cx + 3.1, 6.51, 0, 3.0, [S, S, pm, S, this.mat.darkIn, S]));
      const tg = new THREE.MeshStandardMaterial({ color: 0x19191b, roughness: 0.5 });
      this.add(id, photoBox(cx - 2.2, -0.6, cx + 2.2, 3.0, 1.2, 1.62, [tg, tg, tg, tg, tg, tg]));
      for (let i = 0; i < 10; i++) { const x = cx - 1.9 + i * 0.42; this.add(id, photoBox(x - 0.1, -0.4, x + 0.1, 1.4, 1.62, 1.66, [M.gold, M.gold, M.gold, M.gold, M.gold, M.gold])); }
    }

    // A/V jack (J7): body 50.52..57.5 x -0.02..12.48, Z 6.0; barrel Ø6 from y -2.52 to 0, centred at x 54.01
    this.add('av', photoBox(50.52, -0.02, 57.5, 12.48, 0, 6.0, [K, K, this.mat.photo, K, K, K]));
    {
      const g = new THREE.Group();
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.0, 2.5, 40, 1, true), K); outer.rotation.x = Math.PI / 2; outer.position.copy(P(54.01, -1.27, 3.0)); g.add(outer);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.8, 3.0, 40), K); ring.position.copy(P(54.01, -2.52, 3.0)); g.add(ring);
      const bore = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 6, 32, 1, true), cav[2]); bore.rotation.x = Math.PI / 2; bore.position.copy(P(54.01, 0.45, 3.0)); g.add(bore);
      const end = new THREE.Mesh(new THREE.CircleGeometry(1.8, 32), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 })); end.position.copy(P(54.01, 3.4, 3.0)); g.add(end);
      this.add('av', g);
    }
    // camera CSI (J3) and display DSI (J4): beige FPC connectors with a black latch, Z 5.5
    const B = this.mat.beige;
    this.add('camera', photoBox(45.06, 0.29, 47.91, 22.69, 0, 5.5, [B, B, this.mat.photo, B, B, B]));
    this.add('display', photoBox(1.51, 16.78, 5.45, 39.2, 0, 5.5, [B, B, this.mat.photo, B, B, B]));
  }

  // ------------------------------------------------------------ chips (raised so the board reads as 3D from any angle)
  buildChips() {
    const C = this.mat.chipSide, ph = this.mat.photo, pm = this.mat.photoMetal;
    // BCM2711: 15 x 15 package (drawing), total height 2.4 mm (drawing Z), metal heat spreader on top
    this.add('soc', photoBox(21.76, 24.98, 36.76, 39.98, 0, 1.0, [this.mat.substrate, this.mat.substrate, ph, C, this.mat.substrate, this.mat.substrate]));
    this.add('soc', photoBox(22.06, 25.28, 36.46, 39.68, 1.0, 2.4, [this.mat.shield, this.mat.shield, pm, C, this.mat.shield, this.mat.shield], { r: 0.5 }));
    this.add('ram', photoBox(39.05, 24.98, 50.56, 39.98, 0, 1.0, [C, C, ph, C, C, C]));
    this.add('wireless', photoBox(6.61, 36.1, 17.4, 49.09, 0, 1.3, [this.mat.shield, this.mat.shield, pm, C, this.mat.shield, this.mat.shield]));
    this.add('vl805', photoBox(55.3, 20.0, 63.6, 28.2, 0, 0.85, [C, C, ph, C, C, C]));
    // other parts: raised with their real photo tops but not labelled (their part numbers are not given in the official documents)
    this.add('ethphy', photoBox(55.5, 35.0, 61.5, 41.2, 0, 0.85, [C, C, ph, C, C, C]));        // Gigabit Ethernet transceiver, beside the RJ45 jack
    this.add('pmic', photoBox(7.3, 9.9, 12.3, 14.8, 0, 0.85, [C, C, ph, C, C, C]));            // power-management chip (marking "MxL" visible in the photo)
    this.add('inductor', photoBox(13.0, 14.16, 16.75, 17.92, 0, 1.6, [this.mat.shield, this.mat.shield, ph, C, this.mat.shield, this.mat.shield], { r: 0.4 }));   // marking R47
    this.add('misc_pwr', photoBox(17.9, 5.8, 21.2, 11.7, 0, 1.2, [C, C, ph, C, C, C]));      // black part beside the USB-C power input
    this.add('misc_eth', photoBox(65.6, 29.3, 70.0, 37.0, 0, 1.2, [C, C, ph, C, C, C]));      // black part beside the USB / Ethernet jacks
  }

  // ------------------------------------------------------------ underside: microSD socket (from the bottom photo)
  buildBottom() {
    const S = this.mat.shield, pb = this.mat.photoBot;
    this.add('sdcard', photoBox(1.5, 22.09, 13.63, 34.6, -T - 1.3, -T, [S, this.mat.black, S, pb, S, S], { photoFace: 'bottom' }));
  }

  // ------------------------------------------------------------ PWR (red) and ACT (green) LEDs at the left edge
  buildLEDs() {
    for (const [id, y, col] of [['pwr', 7.87, 0xff2a1a], ['act', 11.4, 0x22ff4a]]) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 1.6), M.ledBody); body.position.copy(P(1.0, y, 0.225)); g.add(body);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 1.2), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); glow.position.copy(P(1.0, y, 0.48)); glow.visible = false; g.add(glow);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      halo.scale.set(6, 6, 1); halo.position.copy(P(1.0, y, 1.0)); halo.visible = false; g.add(halo);
      this.add('led' + id, g);
      this.proxy('led' + id, 1.0, y, 0, 2.2, 2.6, 1.2);
      this.leds[id] = { glow, halo };
    }
  }
  setLed(id, on) { const l = this.leds[id]; if (l) { l.glow.visible = !!on; l.halo.visible = !!on; } }
  setPowerLed(on) { this.setLed('pwr', on); }
  setMatrix() {}

  partCenter(id) {
    const g = this.parts[id], b = new THREE.Box3();
    if (g) b.setFromObject(g);
    for (const p of this.proxies.filter(p => p.userData.part === id)) b.expandByObject(p);
    if (b.isEmpty()) return { center: new THREE.Vector3(), size: 20 };
    const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    return { center: c, size: Math.max(s.x, s.y, s.z), box: b };
  }
  pressButton() {}
}

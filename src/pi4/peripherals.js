// Accessories for the Raspberry Pi 4 lessons: microSD card, micro-HDMI cable, USB keyboard / mouse cables.
// Sizes: microSD card 15 x 11 x 1.0 mm (SD Association card format). Plugs are generic cable ends sized to fit the
// receptacles modelled in board.js. Each plug slides along its port axis when it is plugged in or pulled out.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, canvasTex } from '../materials.js';
import { P, T } from './board.js';
import camPhoto from '../../assets/pi4/cam3_top.jpg';

const tween = (ms, fn) => new Promise(res => { const t0 = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; fn(e); if (k < 1) requestAnimationFrame(step); else res(); }; step(); });
const tag = (o, id) => { o.traverse(c => { c.userData.hw = id; if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };

// ---------------------------------------------------------------- microSD card (goes into the slot on the underside, label away from the board)
export class MicroSD {
  constructor() {
    const g = this.group = new THREE.Group();
    const label = canvasTex(300, 220, (c, w, h) => {
      c.fillStyle = '#1d2733'; c.fillRect(0, 0, w, h);
      // the label is seen from below, so the text is drawn mirrored to read correctly there (at the card's outer end)
      c.save(); c.translate(w, 0); c.scale(-1, 1);
      c.fillStyle = '#e8eef4'; c.font = '700 44px Arial'; c.fillText('microSD', w - 24 - c.measureText('microSD').width, 70);
      c.font = '600 30px Arial'; c.fillStyle = '#9fd3ff'; c.fillText('32 GB', w - 24 - c.measureText('32 GB').width, 120);
      c.restore();
      c.fillStyle = '#c62828'; c.fillRect(0, h - 26, w, 26);
    });
    // card in its own frame: length along x (15 mm, contacts end at +x), width along z (11 mm), 1 mm thick
    const body = new THREE.Mesh(new RoundedBoxGeometry(15, 1.0, 11, 2, 0.35), [
      new THREE.MeshStandardMaterial({ color: 0x1d2733, roughness: 0.5 }), new THREE.MeshStandardMaterial({ color: 0x1d2733, roughness: 0.5 }),
      new THREE.MeshStandardMaterial({ color: 0x1d2733, roughness: 0.5 }), new THREE.MeshStandardMaterial({ map: label, roughness: 0.45 }),
      new THREE.MeshStandardMaterial({ color: 0x1d2733, roughness: 0.5 }), new THREE.MeshStandardMaterial({ color: 0x1d2733, roughness: 0.5 })]);
    g.add(body);
    for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.8), M.gold); c.position.set(5.4, 0.52, -4.2 + i * 1.15); g.add(c); }
    // label faces down (away from the board), contacts face up toward the board
    tag(g, 'pi:sd');
    this.inPos = P(-2.4 + 7.5, 28.35, -T - 0.75); this.outPos = this.inPos.clone().add(new THREE.Vector3(-22, 0, 0));
    g.position.copy(this.outPos); g.visible = false;
  }
  async insert(on, ms = 1200) {
    const g = this.group;
    if (on) { g.visible = true; await tween(ms, e => g.position.lerpVectors(this.outPos, this.inPos, e)); }
    else { await tween(ms * 0.8, e => g.position.lerpVectors(this.inPos, this.outPos, e)); g.visible = false; }
  }
  set(on) { this.group.visible = on; this.group.position.copy(on ? this.inPos : this.outPos); }
}

// ---------------------------------------------------------------- cable with a plug that slides into a port
// mouth: world point of the receptacle opening; dir: unit vector pointing OUT of the port; depth: how far the plug goes in.
export class PlugCable {
  constructor(kind, mouth, dir, { depth = 6, route = [] } = {}) {
    const g = this.group = new THREE.Group();
    const plug = this.plug = new THREE.Group(); g.add(plug);
    const black = new THREE.MeshPhysicalMaterial({ color: kind === 'kbd' || kind === 'mouse' ? 0xf2f2ef : 0x1c1c1f, roughness: 0.55, clearcoat: 0.2 });
    // plug frame: tip at the origin, body along +x ("out" direction), metal along −x (into the port)
    let metal, mold;
    if (kind === 'hdmi') { metal = new RoundedBoxGeometry(5.0, 2.2, 5.6, 2, 0.3); mold = new RoundedBoxGeometry(14, 5.2, 9.5, 3, 1.4); }
    else { metal = new THREE.BoxGeometry(12, 4.5, 12); mold = new RoundedBoxGeometry(16, 7.5, 15, 3, 2); }
    const mlen = kind === 'hdmi' ? 5.6 : 12;
    const m = new THREE.Mesh(metal, M.steel); m.position.x = -mlen / 2; plug.add(m);
    if (kind !== 'hdmi') { const tongue = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.9, 11), new THREE.MeshStandardMaterial({ color: 0xf0f0ec, roughness: 0.5 })); tongue.position.set(-6, -0.8, 0); tongue.rotation.y = Math.PI / 2; plug.add(tongue); }
    const mo = new THREE.Mesh(mold, black); mo.position.x = (kind === 'hdmi' ? 14 : 16) / 2; plug.add(mo);
    if (kind === 'hdmi') m.rotation.y = Math.PI / 2;
    // cable: leaves the plug along +x then drops to the desk following `route` (points in the plug frame)
    const pts = [new THREE.Vector3(kind === 'hdmi' ? 14 : 16, 0, 0), new THREE.Vector3(30, 0, 0), ...route.map(p => new THREE.Vector3(...p))];
    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 80, kind === 'hdmi' ? 2.2 : 1.9, 12, false), black);
    plug.add(cable);
    // orient: plug +x along `dir`
    g.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.clone().normalize());
    g.position.copy(mouth).addScaledVector(dir, -depth);
    this.out = 30; plug.position.x = this.out; g.visible = false;
    tag(g, 'pi:' + kind);
  }
  async connect(on, ms = 1100) {
    if (on) { this.group.visible = true; await tween(ms, e => { this.plug.position.x = this.out * (1 - e); }); }
    else { await tween(ms * 0.8, e => { this.plug.position.x = this.out * e; }); this.group.visible = false; }
  }
  set(on) { this.group.visible = on; this.plug.position.x = on ? 0 : this.out; }
}

// ---------------------------------------------------------------- monitor showing the desktop and a Terminal window (illustration)
// A generic 16:9 monitor, drawn at about 78 % of a 15.6-inch screen (345 x 194 mm) so it fits beside the board. The picture is an ILLUSTRATION of a desktop with a Terminal window:
// the real Raspberry Pi OS desktop looks slightly different. Results shown in the Terminal are simulated.
export class Monitor {
  constructor() {
    const g = this.group = new THREE.Group();
    const dark = new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.5 });
    const W = 360, Hh = 211, D = 16, y0 = 52;
    const bezel = new THREE.Mesh(new RoundedBoxGeometry(W, Hh, D, 3, 3), dark); bezel.position.set(0, y0 + Hh / 2, 0); g.add(bezel);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(36, y0 + 4, 9), new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.4, metalness: 0.6 })); neck.position.set(0, (y0 + 4) / 2, -6); g.add(neck);
    const base = new THREE.Mesh(new RoundedBoxGeometry(150, 5, 100, 2, 1.5), new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.4, metalness: 0.6 })); base.position.set(0, 2.5, -4); g.add(base);
    this.canvas = document.createElement('canvas'); this.canvas.width = 1280; this.canvas.height = 720;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(345, 194), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false }));
    this.screen.position.set(0, y0 + Hh / 2, D / 2 + 0.1); g.add(this.screen);
    tag(g, 'pi:monitor');
    this.key = null; this.draw({ mode: 'off', lines: [], cwd: '~' });
    g.visible = false;
  }
  set(on) { this.group.visible = on; }
  connect(on) { this.set(on); }
  draw(st) {
    const key = JSON.stringify([st.mode, st.lines.length, st.lines[st.lines.length - 1], st.cwd, st.cur, st.preview]);   // redraw only when something changed
    if (key === this.key) return; this.key = key;
    const c = this.ctx, w = 1280, h = 720;
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    if (st.mode === 'off') { this.tex.needsUpdate = true; return; }
    if (st.mode === 'boot' || st.mode === 'reboot' || st.mode === 'shutdown') {
      c.fillStyle = '#0b0d10'; c.fillRect(0, 0, w, h); c.fillStyle = '#9fb2c4'; c.font = '28px Arial'; c.textAlign = 'center';
      c.fillText(st.mode === 'shutdown' ? 'Shutting down…' : 'Starting…', w / 2, h / 2); this.tex.needsUpdate = true; return;
    }
    // desktop wallpaper (generic illustration) and top bar
    const bg = c.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#24364f'); bg.addColorStop(1, '#5f86b3'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(15,18,22,0.92)'; c.fillRect(0, 0, w, 44);
    c.fillStyle = '#e6edf3'; c.font = '600 22px Arial'; c.textAlign = 'left'; c.fillText('Raspberry Pi OS desktop (illustration)', 18, 30);
    c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(w - 150, 8, 132, 28); c.fillStyle = '#e6edf3'; c.font = '18px Arial'; c.fillText('>_ Terminal', w - 140, 28);
    // Terminal window
    const x0 = 70, y0 = 90, ww = w - 140, hh = h - 130;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x0 + 8, y0 + 10, ww, hh);
    c.fillStyle = '#2b2d31'; c.fillRect(x0, y0, ww, 34); c.fillStyle = '#d6dbe0'; c.font = '600 19px Arial'; c.fillText('user@raspberrypi: ' + st.cwd, x0 + 14, y0 + 23);
    c.fillStyle = '#ff6b5b'; c.beginPath(); c.arc(x0 + ww - 24, y0 + 17, 7, 0, 7); c.fill();
    c.fillStyle = '#16181b'; c.fillRect(x0, y0 + 34, ww, hh - 34);
    c.font = '20px Consolas, monospace'; const lh = 24, rows = Math.floor((hh - 52) / lh);
    // wrap
    const all = [];
    for (const L of st.lines) {
      if (L.prompt) all.push({ prompt: true, cwd: L.cwd, text: L.text });
      else if (L.segs) all.push({ segs: L.segs });
      else { const t = L.text, max = 96; if (!t.length) all.push({ text: '', c: L.c }); for (let i = 0; i < t.length; i += max) all.push({ text: t.slice(i, i + max), c: L.c }); }
    }
    if (st.mode === 'on') all.push({ prompt: true, cwd: st.cwd, text: st.cur || '', live: true });
    const show = all.slice(-rows);
    show.forEach((L, i) => {
      const y = y0 + 34 + 26 + i * lh; let x = x0 + 14;
      if (L.prompt) {
        const a = 'user@raspberrypi', b = ':' + L.cwd, d = ' $ ';
        c.fillStyle = '#7ee787'; c.fillText(a, x, y); x += c.measureText(a).width;
        c.fillStyle = '#79b8ff'; c.fillText(b, x, y); x += c.measureText(b).width;
        c.fillStyle = '#e6edf3'; c.fillText(d, x, y); x += c.measureText(d).width;
        c.fillText(L.text, x, y); x += c.measureText(L.text).width;
        if (L.live) { c.fillStyle = '#e6edf3'; c.fillRect(x + 2, y - 17, 11, 21); }
      } else if (L.segs) { for (const sg of L.segs) { c.fillStyle = sg.c || '#d6dbe0'; c.fillText(sg.t, x, y); x += c.measureText(sg.t).width; } }
      else { c.fillStyle = L.c || '#d6dbe0'; c.fillText(L.text, x, y); }
    });
    if (st.preview) this.drawPreview(c, w, h, st.preview);
    this.tex.needsUpdate = true;
  }
  // The preview window of rpicam-hello / rpicam-still. The picture is a made-up scene (an ILLUSTRATION): a real preview shows what the lens sees.
  drawPreview(c, w, h, pv) {
    const x0 = 190, y0 = 70, ww = 900, hh = 560, ix = x0 + 12, iy = y0 + 46, iw = ww - 24, ih = hh - 58;
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x0 + 10, y0 + 12, ww, hh);
    c.fillStyle = '#2b2d31'; c.fillRect(x0, y0, ww, 34); c.fillStyle = '#d6dbe0'; c.font = '600 19px Arial'; c.textAlign = 'left';
    c.fillText(pv.kind === 'photo' ? pv.name + ' — the photo that was saved (illustration)' : 'Camera preview (illustration)', x0 + 14, y0 + 23);
    c.fillStyle = '#ff6b5b'; c.beginPath(); c.arc(x0 + ww - 24, y0 + 17, 7, 0, 7); c.fill();
    c.fillStyle = '#16181b'; c.fillRect(x0, y0 + 34, ww, hh - 34);
    c.save(); c.beginPath(); c.rect(ix, iy, iw, ih); c.clip();
    const sky = c.createLinearGradient(0, iy, 0, iy + ih * 0.7); sky.addColorStop(0, '#5aa6e8'); sky.addColorStop(1, '#cfe8f7'); c.fillStyle = sky; c.fillRect(ix, iy, iw, ih);
    c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(ix + iw * 0.78, iy + ih * 0.22, 46, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; for (const [cx, cy, r] of [[0.25, 0.2, 38], [0.3, 0.22, 46], [0.36, 0.2, 34], [0.58, 0.12, 28], [0.63, 0.14, 36]]) { c.beginPath(); c.arc(ix + iw * cx, iy + ih * cy, r, 0, 7); c.fill(); }
    c.fillStyle = '#4f9a54'; c.beginPath(); c.moveTo(ix, iy + ih * 0.7); c.quadraticCurveTo(ix + iw * 0.3, iy + ih * 0.5, ix + iw * 0.6, iy + ih * 0.68); c.quadraticCurveTo(ix + iw * 0.85, iy + ih * 0.78, ix + iw, iy + ih * 0.6); c.lineTo(ix + iw, iy + ih); c.lineTo(ix, iy + ih); c.fill();
    c.fillStyle = '#3d7f43'; c.fillRect(ix, iy + ih * 0.82, iw, ih * 0.18);
    c.fillStyle = '#c9a26b'; c.fillRect(ix + iw * 0.4, iy + ih * 0.52, 150, 110); c.fillStyle = '#9b4a3c'; c.beginPath(); c.moveTo(ix + iw * 0.4 - 12, iy + ih * 0.52); c.lineTo(ix + iw * 0.4 + 75, iy + ih * 0.52 - 62); c.lineTo(ix + iw * 0.4 + 162, iy + ih * 0.52); c.fill();
    c.fillStyle = '#6b4a2f'; c.fillRect(ix + iw * 0.4 + 60, iy + ih * 0.52 + 50, 32, 60); c.fillStyle = '#bfe4ff'; c.fillRect(ix + iw * 0.4 + 18, iy + ih * 0.52 + 22, 30, 30); c.fillRect(ix + iw * 0.4 + 108, iy + ih * 0.52 + 22, 30, 30);
    c.restore();
    if (pv.kind === 'photo') { c.strokeStyle = '#fff'; c.lineWidth = 10; c.strokeRect(ix + 5, iy + 5, iw - 10, ih - 10); }
    else { c.fillStyle = '#ff4d4d'; c.beginPath(); c.arc(ix + 26, iy + 26, 9, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '600 20px Arial'; c.fillText('LIVE', ix + 44, iy + 33); }
  }
}

// ---------------------------------------------------------------- Camera Module 3 and its ribbon cable (Lesson 13)
// Board 25 x 24 mm (Raspberry Pi camera documentation); its top is the official product photo (Raspberry Pi documentation, CC BY-SA 4.0).
// The lens assembly height and the cable length are drawn approximately (the documentation gives no figure for them).
// The cable stands up vertically in the J3 connector (flat faces towards the HDMI side and the USB/Ethernet side): the metallic contacts face the HDMI side.
const DESK = -6.05;
export class CameraModule {
  constructor() {
    const root = this.group = new THREE.Group(), mod = this.mod = new THREE.Group(); root.add(mod);
    const tex = new THREE.TextureLoader().load(camPhoto); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.repeat.set(1 / 25, 1 / 24);
    const r = 1.6, sh = new THREE.Shape();
    sh.moveTo(r, 0); sh.lineTo(25 - r, 0); sh.quadraticCurveTo(25, 0, 25, r); sh.lineTo(25, 24 - r); sh.quadraticCurveTo(25, 24, 25 - r, 24); sh.lineTo(r, 24); sh.quadraticCurveTo(0, 24, 0, 24 - r); sh.lineTo(0, r); sh.quadraticCurveTo(0, 0, r, 0);
    for (const [x, y] of [[2.0, 22.0], [23.0, 22.0], [2.0, 9.5], [23.0, 9.5]]) { const h = new THREE.Path(); h.absarc(x, y, 1.1, 0, Math.PI * 2, true); sh.holes.push(h); }
    const edge = new THREE.MeshStandardMaterial({ color: 0x2d7d3f, roughness: 0.6 });
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.0, bevelEnabled: false, curveSegments: 10 }); geo.rotateX(-Math.PI / 2); geo.translate(-12.5, 0, 12);
    mod.add(new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }), edge]));
    const bg = new THREE.ShapeGeometry(sh, 10); bg.rotateX(-Math.PI / 2); bg.translate(-12.5, -0.01, 12);
    mod.add(new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ color: 0x24683a, roughness: 0.7, side: THREE.BackSide })));
    // lens assembly (position and width measured on the photo; height approximate)
    const lt = tex.clone(); lt.needsUpdate = true; lt.repeat.set(11.15 / 25, 11.15 / 24); lt.offset.set(7.0 / 25, 1 - 19.9 / 24);
    const steel = new THREE.MeshStandardMaterial({ color: 0x9da2a8, roughness: 0.4, metalness: 0.7 });
    const lens = new THREE.Mesh(new THREE.BoxGeometry(11.15, 3.0, 11.15), [steel, steel, new THREE.MeshStandardMaterial({ map: lt, roughness: 0.45 }), steel, steel, steel]); lens.position.set(0.1, 1.0 + 1.5, 2.3); mod.add(lens);
    // the connector on the back of the board (cable end)
    const conn = new THREE.Mesh(new THREE.BoxGeometry(20.7, 1.8, 2.6), new THREE.MeshStandardMaterial({ color: 0x161618, roughness: 0.5 })); conn.position.set(0, -0.9, 10.7); mod.add(conn);
    this.cx = -80; this.zc = P(0, 11.49).z;
    mod.position.set(this.cx, DESK + 1.8, this.zc); mod.rotation.y = Math.PI / 2;   // the cable end of the board points towards +x
    tag(mod, 'pi:cam');
    // ribbon
    this.ribbon = new THREE.Group(); root.add(this.ribbon);
    this.paperMat = new THREE.MeshStandardMaterial({ color: 0xe6e4dc, roughness: 0.6, side: THREE.DoubleSide });
    const fing = canvasTex(256, 96, (c, w, h) => { c.fillStyle = '#d9d6cc'; c.fillRect(0, 0, w, h); c.fillStyle = '#b9bec4'; for (let i = 0; i < 15; i++) c.fillRect(w / 2 + (i - 7) * 16 - 4, 0, 8, h); });
    const blue = new THREE.MeshStandardMaterial({ color: 0x2f6fd0, roughness: 0.55 }), side = new THREE.MeshStandardMaterial({ color: 0xd9d6cc, roughness: 0.6 });
    this.tip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 6, 16), [blue, new THREE.MeshStandardMaterial({ map: fing, roughness: 0.4, metalness: 0.2 }), side, side, side, side]); this.ribbon.add(this.tip);
    this.depth = 0; this.setDepth(0);
    tag(this.ribbon, 'pi:ribbon');
    root.visible = false;
  }
  /** the cable end turned round: contacts and blue backing swap sides */
  setFlip(b) { this.flipped = !!b; this.tip.rotation.y = b ? Math.PI : 0; }
  /** k = 0: end hovering above the connector; 1: pushed all the way in. */
  setDepth(k) {
    this.depth = k;
    const yEnd = 11 - k * 10.8, yb = DESK + 0.45, xv = -52, xt = 3.98, cx = this.cx;
    const pts = [[cx + 10.5, yb], [cx + 22, yb], [xv - 9, yb], [xv - 2, yb + 3], [xv, yb + 11], [xv, 14], [xv + 3, 22], [xv + 12, 25.5], [xt - 14, 25.5], [xt - 3, 23], [xt, 19.5], [xt, yEnd + 6]].map(([x, y]) => new THREE.Vector3(x, y, 0));
    const sp = new THREE.CatmullRomCurve3(pts, false, 'centripetal').getSpacedPoints(220);
    const pos = [], idx = [], W2 = 8, th = 0.15, n = sp.length;
    for (let i = 0; i < n; i++) {
      const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n - 1, i + 1)], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l;
      for (const sgn of [1, -1]) for (const z of [-W2, W2]) pos.push(sp[i].x + nx * th * sgn, sp[i].y + ny * th * sgn, this.zc + z);
    }
    for (let i = 0; i < n - 1; i++) for (const o of [0, 2]) { const a = i * 4 + o, b = (i + 1) * 4 + o; idx.push(a, a + 1, b + 1, a, b + 1, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    if (this.body) { this.body.geometry.dispose(); this.ribbon.remove(this.body); }
    this.body = new THREE.Mesh(g, this.paperMat); this.body.userData.hw = 'pi:ribbon'; this.ribbon.add(this.body);
    this.tip.position.set(xt, yEnd + 3, this.zc);
  }
  async connect(on) { this.group.visible = on; if (on) this.setDepth(this.depth); }
  set(on) { this.group.visible = on; }
}
/** The step "push the cable into J3": slides the ribbon end into the camera connector. */
export class CameraLink {
  constructor(cam) { this.cam = cam; this.group = new THREE.Group(); this.group.visible = false; }
  async connect(on, ms = 1400) { const c = this.cam, k0 = c.depth, k1 = on ? 1 : 0; await tween(ms, e => c.setDepth(k0 + (k1 - k0) * e)); }
  set(on) { this.cam.setDepth(on ? 1 : 0); }
}

/** All accessories of the setup lesson, built at the real port positions of the board model. */
export function makePiAccessories(board) {
  const sd = new MicroSD();
  const monitor = new Monitor(); monitor.group.position.set(-95, -6.05, -215); monitor.group.rotation.y = 0.12; monitor.group.scale.setScalar(0.78);   // a compact ~12-inch screen so it fits beside the board
  const down = -5.6;   // cable centre 1.9–2.2 mm above the desk
  const hdmi = new PlugCable('hdmi', P(26.01, -1.45, 1.5), new THREE.Vector3(0, 0, 1), { depth: 4.5, route: [[40, down, 10], [56, down, 60], [30, down, 125], [-70, down, 150], [-170, down, 140], [-205, down, 95]] });   // leaves HDMI0, goes round the left side to the back of the monitor   // leaves HDMI0, bends left to the monitor
  const kbd = new PlugCable('kbd', P(88.02, 8.99, 11.76), new THREE.Vector3(1, 0, 0), { depth: 8, route: [[60, -10, 0], [110, -15.9, 25], [220, -15.9, 60]] });
  const mouse = new PlugCable('mouse', P(88.02, 8.99, 4.06), new THREE.Vector3(1, 0, 0), { depth: 8, route: [[60, -5, -6], [110, -8.2, -30], [220, -8.2, -60]] });
  const cam = new CameraModule(), camlink = new CameraLink(cam);
  return { sd, hdmi, kbd, mouse, monitor, cam, camlink, all: [sd, hdmi, kbd, mouse, monitor, cam, camlink] };
}

export const PI_ACC_INFO = {
  'pi:sd': { name: 'microSD card', tag: 'The boot media', summary: 'Holds the operating system (Raspberry Pi OS). It is prepared on another computer with Raspberry Pi Imager, then inserted with the label facing away from the Raspberry Pi.', points: ['Raspberry Pi OS: at least 32 GB recommended (Lite: 8 GB).'], src: 'raspberrypi.com — Getting started' },
  'pi:hdmi': { name: 'micro-HDMI to HDMI cable', tag: 'Monitor', summary: 'The small end goes into the Raspberry Pi, the large (full-size HDMI) end into the monitor. The primary monitor goes in HDMI0.', src: 'raspberrypi.com — Getting started' },
  'pi:kbd': { name: 'USB keyboard', tag: 'Input', summary: 'Plugged into a black USB 2.0 port, so the blue USB 3.0 ports stay free for fast devices.', src: 'raspberrypi.com — Getting started' },
  'pi:monitor': { name: 'Monitor', tag: 'Shows the desktop', summary: 'The Raspberry Pi’s picture appears here. The picture on this 3D monitor is an illustration of a desktop with a Terminal window; the real desktop looks slightly different.', src: 'raspberrypi.com — Getting started' },
  'pi:cam': { name: 'Camera Module 3', tag: 'Camera', summary: 'A 12-megapixel camera built around the Sony IMX708 sensor (4608 × 2592 pixels) with powered autofocus. The board is 25 × 24 mm. The picture of the board is the official product photo; the height of the lens part is only approximate in this 3D model.', points: ['Variants: standard or wide field of view, with or without an infrared filter (NoIR).'], src: 'raspberrypi.com — Camera Module 3 documentation' },
  'pi:ribbon': { name: 'Camera ribbon cable', tag: '15-pin flat cable', summary: 'A flexible flat cable (FFC) with the standard 15-pin connection: it carries the picture data from the camera to the CAMERA connector (J3, CSI) of the Raspberry Pi 4. One side has the metallic contacts; it must go in with the contacts facing away from the connector’s flap.', src: 'raspberrypi.com — Install a Raspberry Pi camera' },
  'pi:mouse': { name: 'USB mouse', tag: 'Input', summary: 'Also in a black USB 2.0 port.', src: 'raspberrypi.com — Getting started' },
};

import { injectSpeedInsights } from '@vercel/speed-insights';
injectSpeedInsights();
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Viewer } from './viewer.js';
import { initMaterials, canvasTex, noise } from './materials.js';
import { UnoQBoard } from './board.js';
import { makeUsbCable, plugUsb, Breadboard, HW_INFO, DESK_Y, HandModel } from './hardware.js';
import { Bench } from './bench.js';
import { PARTS, CATEGORIES, BOARD_FACTS } from './data/parts.js';
import { JDIGITAL, JANALOG, JSPI, JCTL, findPin } from './data/pins.js';
import { LESSONS, COMING_SOON, MODULES } from './data/lessons.js';
import { LOGO_ARRAY, SHADES_ARRAY, matrixCode } from './data/code.js';
import { Sim, blinkCode, VREF } from './sim.js';
import { Scope } from './scope.js';

const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const VIEWS = {
  home: { t: new THREE.Vector3(0, 0, 0), d: new THREE.Vector3(-0.42, 0.66, 0.62), dist: 150 },
  top: { t: new THREE.Vector3(0, 0, 0), d: new THREE.Vector3(0, 1, 0.02), dist: 132 },
  bottom: { t: new THREE.Vector3(0, -1, 0), d: new THREE.Vector3(0, -1, -0.02), dist: 132 },
  bench: { t: new THREE.Vector3(0, 0, 30), d: new THREE.Vector3(-0.28, 0.82, 0.5), dist: 235 },
  breadboard: { t: new THREE.Vector3(4, 2.4, 60), d: new THREE.Vector3(-0.1, 0.86, 0.5), dist: 115 },
  sonar: { t: new THREE.Vector3(-10, 0, 175), d: new THREE.Vector3(-0.62, 0.6, 0.5), dist: 360 },
};
const BOTTOM_PARTS = new Set(['mcu', 'emmc', 'jmisc', 'jmedia']);
const shortName = n => n.replace(/^(Qualcomm Dragonwing™|STMicroelectronics|Qualcomm) /, '');

class App {
  constructor() {
    this.loadingDone = false;
    THREE.DefaultLoadingManager.onLoad = () => this.hideLoading();
    setTimeout(() => this.hideLoading(), 6000);

    this.viewer = new Viewer($('#stage'));
    initMaterials(this.viewer.renderer);
    this.board = new UnoQBoard();
    this.viewer.scene.add(this.board.group);
    this.mode = 'explore';
    this.selected = null; this.hovered = null;
    this.tempObjs = []; this.partLabels = [];
    this.progress = JSON.parse(localStorage.getItem('unoq-lab-progress') || '{}');
    this.blinkDelay = 1000;
    this.soundOn = true;
    this.editorFrame = LOGO_ARRAY.map(v => v * 7);
    this.brush = 7;

    this.setupHardware();
    this.setupMarkers();
    this.setupSim();
    this.bindUI();
    this.bindDirectInput();
    this.buildPartLabels();
    this.refreshPickTargets();
    this.setMode('explore');
    this.view('home', 0);
    this.viewer.tickers.add(dt => this.tick(dt));
  }

  hideLoading() {
    if (this.loadingDone) return;
    this.loadingDone = true;
    $('#loading').classList.add('hide');
  }

  // ------------------------------------------------------------------ hardware
  setupHardware() {
    const s = this.viewer.scene;
    this.cable = makeUsbCable(); this.cable.visible = false; s.add(this.cable);
    this.usbPlugged = false;
    this.bb = new Breadboard(new THREE.Vector3(0, DESK_Y + 8.5, 68)); this.bb.group.visible = false; s.add(this.bb.group);
    this.bench = new Bench(s, this.board, this.bb);
    this.strips = new THREE.Group(); this.strips.visible = false; s.add(this.strips);
    // desk lamp over the light sensor (Lesson 11): brightness follows the simulated light level
    this.lamp = new THREE.SpotLight(0xfff1d8, 0, 160, 0.5, 0.75, 1.6);
    this.lamp.position.copy(this.bb.hole('e', 22).add(new THREE.Vector3(1.27, 70, 6)));
    this.lamp.target.position.copy(this.bb.hole('e', 22).add(new THREE.Vector3(1.27, 0, 0)));
    s.add(this.lamp, this.lamp.target);
    this.lux = 300; this.tempC = 25; this.distCm = 40;
    // ---- Lesson 13 scene, all at true scale (1 unit = 1 mm) -------------------------------------------
    // obstacle: a corrugated cardboard box standing on the desk (flat, hard face — what the datasheet asks for)
    {
      const BW = 260, BH = 180, BD = 180;
      const kraft = (seed, tape) => canvasTex(512, 512, (c, w, h) => {
        c.fillStyle = '#b8905a'; c.fillRect(0, 0, w, h); noise(c, w, h, 16);
        for (let i = 0; i < 900; i++) { c.strokeStyle = `rgba(${90 + Math.random() * 40},${60 + Math.random() * 30},30,0.12)`; c.lineWidth = 1; const x = Math.random() * w, y = Math.random() * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (Math.random() - 0.5) * 18, y + (Math.random() - 0.5) * 4); c.stroke(); }
        const e = c.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(70,45,20,0.28)'); e.addColorStop(0.04, 'rgba(0,0,0,0)'); e.addColorStop(0.96, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(70,45,20,0.28)');
        c.fillStyle = e; c.fillRect(0, 0, w, h);
        if (tape) { c.fillStyle = 'rgba(205,170,110,0.75)'; c.fillRect(w * 0.42, 0, w * 0.16, h); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(w * 0.42, 0, 3, h); }
      });
      const side = new THREE.MeshStandardMaterial({ map: kraft(1, false), roughness: 0.92 });
      const top = new THREE.MeshStandardMaterial({ map: kraft(2, true), roughness: 0.85 });
      const frontM = new THREE.MeshStandardMaterial({ map: kraft(3, false), roughness: 0.92 });
      this.obstacle = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), [side, side, top, side, frontM, side]);
      this.obstacle.userData.size = [BW, BH, BD];
    }
    this.obstacle.visible = false; this.obstacle.castShadow = true; this.obstacle.receiveShadow = true; s.add(this.obstacle);
    this.obstacle.traverse(o => { o.userData.hw = 'obstacle'; });
    { const el = document.createElement('div'); el.className = 'part-label pin'; this.obstacleLabel = new CSS2DObject(el); this.obstacleLabel.position.set(0, 105, -90); this.obstacle.add(this.obstacleLabel); }
    // tape measure on the desk, zero at the front of the transducers (true-scale mm / cm marks)
    this.tape = new THREE.Group(); this.tape.visible = false; s.add(this.tape);
    this.tapeClip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    for (let seg = 0; seg < 21; seg++) {
      const tex = canvasTex(80, 800, (c, w, h) => {
        c.fillStyle = '#f2c414'; c.fillRect(0, 0, w, h); noise(c, w, h, 8);
        c.fillStyle = '#141414';
        for (let mm = 0; mm < 200; mm++) {
          const y = mm * 4, cm = mm % 10 === 0, half = mm % 5 === 0;
          c.fillRect(0, y, cm ? 34 : half ? 24 : 14, mm % 10 === 0 ? 2.2 : 1.2);
        }
        c.font = '700 26px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (let cmI = 0; cmI < 20; cmI++) {
          const n = seg * 20 + cmI; if (n === 0) continue;
          c.save(); c.translate(56, cmI * 40); c.rotate(Math.PI / 2); c.fillStyle = n % 10 === 0 ? '#c8161d' : '#141414'; c.fillText(String(n), 0, 0); c.restore();
        }
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(19, 200), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.15, clippingPlanes: [this.tapeClip] }));
      m.rotation.x = -Math.PI / 2; m.position.set(0, 0, seg * 200 + 100); m.receiveShadow = true; m.raycast = () => {};
      this.tape.add(m);
    }
    this.tapeHook = new THREE.Mesh(new THREE.BoxGeometry(19, 7, 0.8), new THREE.MeshStandardMaterial({ color: 0xb9bcc0, metalness: 1, roughness: 0.35 }));
    this.tapeHook.raycast = () => {}; s.add(this.tapeHook); this.tapeHook.visible = false;
    // sound: 8 wavefronts one wavelength apart (40 kHz in air: λ = 343 m/s ÷ 40 000 Hz ≈ 8.6 mm), drawn at true size
    this.deskClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(DESK_Y + 0.5));
    this.wallClip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    this.faceClip = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const cap = (half, dir) => { const gg = new THREE.SphereGeometry(1, 64, 8, 0, Math.PI * 2, 0, half); gg.rotateX(dir * Math.PI / 2); return gg; };
    const outGeo = cap(7.5 * Math.PI / 180, 1), backGeo = outGeo;
    this.waves = { out: [], back: [], anim: null };
    for (let i = 0; i < 16; i++) {
      const back = i >= 8;
      const m = new THREE.Mesh(back ? backGeo : outGeo, new THREE.MeshBasicMaterial({
        color: back ? 0xffa340 : 0x58c8ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, clippingPlanes: back ? [this.deskClip, this.wallClip, this.faceClip] : [this.deskClip, this.wallClip] }));
      m.visible = false; m.renderOrder = 7; m.raycast = () => {}; s.add(m);
      (back ? this.waves.back : this.waves.out).push(m);
    }
    // receiver "hears": a faint glow on the R grille when the echo arrives
    this.waves.flash = new THREE.Mesh(new THREE.CircleGeometry(6.1, 40), new THREE.MeshBasicMaterial({ color: 0xffb860, transparent: true, opacity: 0, depthWrite: false }));
    this.waves.flash.raycast = () => {}; this.waves.flash.renderOrder = 8; s.add(this.waves.flash);
    this.waves.tflash = new THREE.Mesh(new THREE.CircleGeometry(6.1, 40), new THREE.MeshBasicMaterial({ color: 0x9fe6ff, transparent: true, opacity: 0, depthWrite: false }));
    this.waves.tflash.raycast = () => {}; this.waves.tflash.renderOrder = 8; s.add(this.waves.tflash);
    this.beam = { visible: false };
    // ---- Lesson 14: room with a walking person and the PIR detection area on the floor
    this.person = new HandModel(); this.person.group.visible = false; s.add(this.person.group);
    {
      const tex = canvasTex(512, 512, (c, w, h) => {
        const img = c.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const u = (x / w) * 2 - 1, v = 1 - (y / h) * 2, r = Math.hypot(u, v), a = Math.atan2(u, -v) * 180 / Math.PI;
          let alpha = 0;
          if (r <= 1 && Math.abs(a) <= 55) { const fade = 1 - r; const zl = Math.abs(((a + 55) % 13.75) - 6.875) > 6.3; alpha = 16 * fade + (zl ? 26 * fade : 0); if (Math.abs(a) > 54) alpha = 80 * fade; }
          const i = (y * w + x) * 4; img.data[i] = 120; img.data[i + 1] = 215; img.data[i + 2] = 255; img.data[i + 3] = alpha;
        }
        c.putImageData(img, 0, 0);
      }, { srgb: false });
      this.pirFan = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      this.pirFan.rotation.x = -Math.PI / 2; this.pirFan.visible = false; this.pirFan.raycast = () => {}; this.pirFan.renderOrder = 2; s.add(this.pirFan);
    }
    this.pirReset();
    this.beam = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 40, 1, true), new THREE.MeshBasicMaterial({ color: 0x35d0ff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
    this.beam.visible = false; this.beam.raycast = () => {}; s.add(this.beam);
    const mk = (x0, z0, z1, color) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, Math.abs(z1 - z0) + 1.9),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
      m.position.copy(this.bb.group.localToWorld(new THREE.Vector3(x0, 0.06, (z0 + z1) / 2))); return m;
    };
    for (let c = 1; c <= 30; c++) {
      const x = this.bb.colX(c);
      const hl = c === 10 ? 0xffd34d : c === 14 ? 0xff9a3c : c === 15 ? 0x9aa7b4 : 0x36d1dc;
      this.strips.add(mk(x, -13.97, -3.81, hl));
      this.strips.add(mk(x, 3.81, 13.97, 0x36d1dc));
    }
    const rail = (z, color) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(73.66 + 1.9, 0.08, 1.9), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }));
      m.position.copy(this.bb.group.localToWorld(new THREE.Vector3(0, 0.06, z))); this.strips.add(m);
    };
    rail(-22.86, 0xff4d40); rail(-20.32, 0x3d7bff); rail(20.32, 0x3d7bff); rail(22.86, 0xff4d40);
  }

  refreshPickTargets() {
    const t = [this.board.group];
    if (this.cable.visible) t.push(this.cable);
    if (this.bb.group.visible) t.push(this.bb.group, ...this.bench.pickables());
    if (this.obstacle && this.obstacle.visible) t.push(this.obstacle);
    this.viewer.pickTargets = t;
  }

  async plug(on = true) {
    if (on === this.usbPlugged) return;
    this.usbPlugged = on;
    if (on) { await plugUsb(this.cable, this.board, true); this.powerOn(); }
    else { this.powerOff(); await plugUsb(this.cable, this.board, false); }
    this.refreshPickTargets();
  }
  powerOn() { this.board.powered = true; this.board.setPowerLed(true); this.pirPowered(); }
  powerOff() {
    this.sim.stop(); this.board.powered = false; this.bootToken = null;
    this.board.setPowerLed(false); this.board.setMatrix(null);
    for (const id of ['rgb1', 'rgb2', 'rgb3', 'rgb4']) this.board.setLed(id, 0, 0, 0);
    this.outputsOff();
  }
  async ensurePower() { if (!this.usbPlugged) await this.plug(true); }

  outputsOff() {
    for (const it of Object.values(this.bench.items)) {
      if (it.def.type === 'led') it.obj.set(false);
      if (it.def.type === 'buzzer') it.obj.vibrate(false);
    }
    this.stopSound(); this.toneState = null;
    this.setPinLevel('');
    if (this.scope) this.scope.set(null);
  }

  async bootAnimation(ms = 5200) {
    const tok = this.bootToken = {};
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      if (this.bootToken !== tok || !this.board.powered) return;
      const t = (performance.now() - t0) / 1000;
      this.board.setMatrix(LOGO_ARRAY.map((v, i) => v * (0.55 + 0.45 * Math.sin(t * 3 + (i % 13) * 0.35))));
      await sleep(40);
    }
    if (this.bootToken === tok) this.board.setMatrix(null);
  }

  // ------------------------------------------------------------------ markers & labels
  setupMarkers() {
    this.markerGeo = new THREE.RingGeometry(1.25, 1.75, 40); this.markerGeo.rotateX(-Math.PI / 2);
    this.hoverMarker = this.makeMarker(0x35d0ff); this.hoverMarker.visible = false; this.viewer.scene.add(this.hoverMarker);
  }
  makeMarker(color = 0xffd34d) {
    const m = new THREE.Mesh(this.markerGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, toneMapped: false, depthTest: false, side: THREE.DoubleSide }));
    m.renderOrder = 10; return m;
  }
  label(text, pos, cls = '') {
    const el = document.createElement('div'); el.className = 'part-label ' + cls; el.innerHTML = text;
    const o = new CSS2DObject(el); o.position.copy(pos); this.viewer.scene.add(o); return o;
  }
  temp(o) { this.tempObjs.push(o); return o; }
  clearTemp() {
    for (const o of this.tempObjs) { o.parent && o.parent.remove(o); if (o.element) o.element.remove(); }
    this.tempObjs = [];
  }
  markPins(ids) {
    for (const id of ids) {
      const p = this.board.pins[id]; if (!p) continue;
      const m = this.temp(this.makeMarker()); m.position.copy(p.pos).add(new THREE.Vector3(0, 0.15, 0)); this.viewer.scene.add(m);
      const info = findPin(id);
      this.temp(this.label(info ? info.label : id, p.pos.clone().add(new THREE.Vector3(0, 3.5, 0)), 'pin'));
    }
  }
  holeLabels(list) {
    for (const t of list) {
      const m = /^([a-j])(\d+)/.exec(t); if (!m) continue;
      this.temp(this.label(t, this.bb.hole(m[1], +m[2]).add(new THREE.Vector3(0, 2.2, 0)), 'hole'));
    }
  }
  buildPartLabels() {
    for (const [id, info] of Object.entries(PARTS)) {
      const { center, box } = this.board.partCenter(id);
      if (!box) continue;
      const bottom = BOTTOM_PARTS.has(id);
      const l = this.label(shortName(info.name), new THREE.Vector3(center.x, bottom ? box.min.y - 1 : box.max.y + 1, center.z));
      l.visible = false; l.userData = { id, bottom }; l.element.style.pointerEvents = 'none';
      this.partLabels.push(l);
    }
  }
  tick(dt = 0.016) {
    this.pirTick(Math.min(dt, 0.1));
    this.servoTick(Math.min(dt, 0.1));
    const below = this.viewer.camera.position.y < -1;
    const show = !!this.showLabels;
    for (const l of this.partLabels) l.visible = show && (l.userData.bottom === below);
    if (this.pulseObjs) this.viewer.outline.edgeStrength = 2.5 + 4 * (0.5 + 0.5 * Math.sin(performance.now() / 260));
    const bz = this.toneState && this.bench.get(this.toneState.item);
    if (bz) bz.vibrate(true);
    this.updateWaves();
    this.updateCallout();
  }

  // ------------------------------------------------------------------ selection & camera
  groupsFor(ids) {
    const out = [];
    for (const id of [].concat(ids || [])) {
      if (id.startsWith('pin:')) continue;
      if (this.board.parts[id]) out.push(this.board.parts[id]);
    }
    return out;
  }
  setOutline(objs) { this.viewer.outline.selectedObjects = objs; }

  view(name, ms = 1100) {
    if (name === 'sonar' && this.sonarGeom()) return this.frameSonar(ms);
    if (name === 'room') return this.frameRoom(ms);
    if (name === 'servo' || name === 'servoclose') return this.frameServo(name === 'servoclose', ms);
    if (name === 'pirfront' || name === 'pirback') return this.framePir(name === 'pirback' ? 'back' : 'front', ms);
    const v = VIEWS[name];
    if (!ms) { this.viewer.controls.target.copy(v.t); this.viewer.camera.position.copy(v.t.clone().add(v.d.clone().normalize().multiplyScalar(v.dist))); return Promise.resolve(); }
    return this.viewer.flyTo(v.t, v.dist, v.d, ms);
  }

  focus(ids, side) {
    ids = [].concat(ids);
    const box = new THREE.Box3();
    for (const id of ids) {
      if (id.startsWith('pin:')) { const p = this.board.pins[id.slice(4)]; if (p) box.expandByPoint(p.pos.clone().add(new THREE.Vector3(6, 6, 6))).expandByPoint(p.pos.clone().sub(new THREE.Vector3(6, 6, 6))); continue; }
      const pc = this.board.partCenter(id); if (pc.box) box.union(pc.box);
    }
    if (box.isEmpty()) return;
    const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    const size = Math.max(s.x, s.z, 6);
    const bottom = side === 'bottom' || ids.every(i => BOTTOM_PARTS.has(i));
    const dir = bottom ? new THREE.Vector3(0.3, -0.8, -0.52) : new THREE.Vector3(-0.32, 0.8, 0.52);
    return this.viewer.flyTo(c, THREE.MathUtils.clamp(size * 2.9, 34, 175), dir, 1100);
  }

  select(id, { fly = true, card = true } = {}) {
    this.selected = id;
    if (!id) {
      this.setOutline([]);
      this.hoverMarker.visible = false;
      if (this.mode === 'explore') this.showWelcome();
      else this.hideFloat();
      this.hideCallout();
      return;
    }
    if (id.startsWith('pin:')) {
      const pinId = id.slice(4); const p = this.board.pins[pinId];
      this.setOutline([]);
      this.hoverMarker.visible = true; this.hoverMarker.position.copy(p.pos).add(new THREE.Vector3(0, 0.2, 0));
      if (fly) this.focus(id);
      if (card && this.mode === 'explore') this.showCard(this.pinCard(pinId));
      this.showCallout(id);
    } else if (HW_INFO[id]) {
      if (this.mode === 'lessons') {
        const obj = this.lastHitObject(id);
        if (obj && fly) { const b = new THREE.Box3().setFromObject(obj), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3()); this.viewer.flyTo(c, THREE.MathUtils.clamp(Math.max(sz.x, sz.y, sz.z) * 3.2, 45, 200), new THREE.Vector3(-0.32, 0.8, 0.52), 1000); }
        this.showCallout(id);
      } else { this.hideCallout(); if (card) this.showCard(this.infoCard(HW_INFO[id])); }
    } else {
      this.hoverMarker.visible = false;
      this.setOutline(this.groupsFor(id));
      if (fly) this.focus(id);
      if (card && PARTS[id] && this.mode === 'explore') this.showCard(this.infoCard(PARTS[id], id));
      this.showCallout(id);
    }
    document.querySelectorAll('#side .item').forEach(b => b.classList.toggle('on', b.dataset.id === id));
  }

  showCard(html) {
    if (this.mode === 'explore') { $('#panel').innerHTML = html; this.bindCard($('#panel')); }
    else { const f = $('#float-card'); f.innerHTML = '<button class="close" title="Close">×</button>' + html; f.style.display = 'block'; f.querySelector('.close').onclick = () => this.hideFloat(); this.bindCard(f); }
  }
  hideFloat() { $('#float-card').style.display = 'none'; }
  bindCard(root) {
    root.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => this.select('pin:' + b.dataset.pin));
    root.querySelectorAll('[data-part]').forEach(b => b.onclick = () => this.select(b.dataset.part));
  }

  // ------------------------------------------------------------------ cards
  infoCard(info, id) {
    let h = `<div class="card"><h2>${info.name}</h2>`;
    if (info.ref) h += `<div class="ref">${info.ref}</div>`;
    if (info.tag) h += `<span class="tag">${info.tag}</span>`;
    h += `<p>${info.summary}</p>`;
    if (info.specs) h += `<table class="kv">${info.specs.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
    if (info.points) h += `<ul>${info.points.map(p => `<li>${p}</li>`).join('')}</ul>`;
    if (id === 'jdigital' || id === 'janalog' || id === 'jspi') {
      const hdr = id === 'jdigital' ? JDIGITAL : id === 'janalog' ? JANALOG : JSPI;
      h += `<div class="pingrid">${hdr.pins.map(p => `<button data-pin="${p.id}"><b>${p.label}</b> · pin ${p.pin}</button>`).join('')}</div>`;
    }
    if (id === 'jctl') h += `<table class="kv">${JCTL.pins.map(p => `<tr><td>Pin ${p.pin}</td><td>${p.label}</td></tr>`).join('')}</table>`;
    if (info.warn) h += `<p class="warn">⚠ ${info.warn}</p>`;
    if (info.src) h += `<div class="src">Source: ${info.src}</div>`;
    return h + '</div>';
  }

  // ------------------------------------------------------------------ 3D Callout Annotation
  lastHitObject(id) {
    let o = this.lastHit && this.lastHit.id === id ? this.lastHit.object : null;
    while (o && o.parent && o.parent.userData && o.parent.userData.hw === id) o = o.parent;
    return o;
  }
  restoreStepView() {
    const L = this.lesson, S = L && L.steps[this.stepIdx]; if (!S) return;
    if (S.view) this.view(S.view); else if (S.focus) this.focus(S.focus, S.side);
  }
  showCallout(id) {
    if (!id) {
      this.hideCallout();
      return;
    }

    let title = '', ref = '', tag = '', line1 = '', line2 = '', pos = null, isBottom = false;

    if (id.startsWith('pin:')) {
      const pinId = id.slice(4);
      const p = this.board.pins[pinId];
      if (!p) return;
      pos = p.pos.clone().add(new THREE.Vector3(0, 0.4, 0));
      const info = findPin(pinId);
      title = info ? `Pin ${info.label}` : `Pin ${pinId}`;
      ref = info && info.mcu && info.mcu !== '—' ? info.mcu : `${info ? info.header : 'Header'}`;
      tag = info && info.v ? info.v : '3.3V';
      const fns = info && info.fn ? info.fn.join(', ') : '';
      line1 = fns ? `Functions: ${fns}` : 'Direct microcontroller input/output pin.';
      line2 = info && info.note ? info.note : 'Connect sensors, actuators, or test probes here.';
    } else if (PARTS[id]) {
      const part = PARTS[id];
      const pc = this.board.partCenter(id);
      if (!pc || !pc.box) return;
      isBottom = BOTTOM_PARTS.has(id);
      pos = pc.center.clone();
      pos.y = isBottom ? pc.box.min.y - 0.2 : pc.box.max.y + 0.2;

      title = part.name;
      ref = part.ref ? part.ref.split('·')[0].trim() : '';
      tag = part.tag ? part.tag.split('·')[0].trim() : 'Hardware';

      if (part.simple && part.simple.length >= 2) {
        line1 = part.simple[0];
        line2 = part.simple[1];
      } else {
        const parts = part.summary ? part.summary.split('. ') : [];
        line1 = parts[0] ? (parts[0].endsWith('.') ? parts[0] : parts[0] + '.') : part.name;
        line2 = parts[1] ? (parts[1].endsWith('.') ? parts[1] : parts[1] + '.') : 'Inspect specs on the right panel.';
      }
    } else if (HW_INFO[id]) {
      const info = HW_INFO[id], obj = this.lastHitObject(id);
      if (!obj) { this.hideCallout(); return; }
      const b = new THREE.Box3().setFromObject(obj);
      pos = b.getCenter(new THREE.Vector3()); pos.y = b.max.y + 0.5;
      title = info.name; tag = info.tag || ''; ref = '';
      const parts = info.summary ? info.summary.split('. ') : [];
      line1 = parts[0] ? (parts[0].endsWith('.') ? parts[0] : parts[0] + '.') : info.name;
      line2 = info.warn ? '⚠ ' + info.warn : (info.points && info.points[0]) || (parts[1] || '');
    } else {
      this.hideCallout();
      return;
    }
    const hint = document.querySelector('.callout-hint');
    if (hint) hint.textContent = this.mode === 'lessons' ? 'Quick info · × returns to the lesson view' : 'Quick summary · Full details on right';

    const tEl = $('#callout-title'); if (tEl) tEl.textContent = title;
    const rEl = $('#callout-ref'); if (rEl) { rEl.textContent = ref; rEl.style.display = ref ? 'inline' : 'none'; }
    const gEl = $('#callout-tag'); if (gEl) { gEl.textContent = tag; gEl.style.display = tag ? 'inline-flex' : 'none'; }
    const l1El = $('#callout-line1'); if (l1El) l1El.innerHTML = `<span>${line1}</span>`;
    const l2El = $('#callout-line2'); if (l2El) l2El.innerHTML = `<span>${line2}</span>`;

    this.calloutTarget = { id, pos, bottom: isBottom };
    this.updateCallout();
  }

  hideCallout() {
    this.calloutTarget = null;
    if (this.calloutOverlay) this.calloutOverlay.style.display = 'none';
  }

  updateCallout() {
    if (!this.calloutTarget || !this.calloutOverlay) {
      if (this.calloutOverlay && this.calloutOverlay.style.display !== 'none') {
        this.calloutOverlay.style.display = 'none';
      }
      return;
    }

    const stage = $('#stage');
    if (!stage) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;

    // Project target 3D point to 2D screen coordinates
    const p = this.calloutTarget.pos.clone().project(this.viewer.camera);

    // Behind camera check
    if (p.z > 1.0) {
      this.calloutOverlay.style.display = 'none';
      return;
    }

    const tx = (p.x * 0.5 + 0.5) * w;
    const ty = (-p.y * 0.5 + 0.5) * h;

    // Off-screen check
    if (tx < -80 || tx > w + 80 || ty < -80 || ty > h + 80) {
      this.calloutOverlay.style.display = 'none';
      return;
    }

    // Normal check: if part is top-side and camera is underneath (or vice versa), hide
    const isBottom = this.calloutTarget.bottom;
    const camDir = this.viewer.camera.position.clone().sub(this.viewer.controls.target).normalize();
    if ((!isBottom && camDir.y < -0.15) || (isBottom && camDir.y > 0.15)) {
      this.calloutOverlay.style.display = 'none';
      return;
    }

    this.calloutOverlay.style.display = 'block';

    const box = this.calloutBox;
    const bw = box ? (box.offsetWidth || 295) : 295;
    const bh = box ? (box.offsetHeight || 115) : 115;
    const pad = 18;

    // Horizontal positioning:
    // If target is in the right 55% of the stage, place box to the left; otherwise to the right
    let bx = (tx > w * 0.45) ? (tx - bw - 65) : (tx + 65);
    bx = Math.max(pad, Math.min(w - bw - pad, bx));

    // Vertical positioning:
    let by = ty - bh * 0.45;
    by = Math.max(pad, Math.min(h - bh - pad - 25, by));

    if (box) box.style.transform = `translate(${Math.round(bx)}px, ${Math.round(by)}px)`;

    // Calculate line connection point on the box
    const attachX = (bx > tx) ? bx : (bx + bw);
    const attachY = Math.round(by + Math.min(bh * 0.5, 45));

    // Elbow point
    const elbowX = Math.round(tx + (attachX - tx) * 0.5);

    const pts = `${Math.round(tx)},${Math.round(ty)} ${elbowX},${attachY} ${Math.round(attachX)},${attachY}`;

    if (this.calloutLine) this.calloutLine.setAttribute('points', pts);
    if (this.calloutLineGlow) this.calloutLineGlow.setAttribute('points', pts);

    if (this.calloutPulse) {
      this.calloutPulse.setAttribute('cx', Math.round(tx));
      this.calloutPulse.setAttribute('cy', Math.round(ty));
    }
    if (this.calloutOuter) {
      this.calloutOuter.setAttribute('cx', Math.round(tx));
      this.calloutOuter.setAttribute('cy', Math.round(ty));
    }
    if (this.calloutInner) {
      this.calloutInner.setAttribute('cx', Math.round(tx));
      this.calloutInner.setAttribute('cy', Math.round(ty));
    }
  }

  pinCard(pinId) {
    const p = findPin(pinId);
    const hdr = p.header === 'JDIGITAL' ? JDIGITAL : p.header === 'JANALOG' ? JANALOG : JSPI;
    let h = `<div class="card"><h2><span class="pinchip">${p.label}</span> ${p.id !== p.label && !/^(GND|SPI_)/.test(p.id) ? p.id : ''}</h2>`;
    h += `<div class="ref">${p.header} · pin ${p.pin}</div>`;
    h += `<table class="kv"><tr><td>MCU pin</td><td>${p.mcu}</td></tr><tr><td>Functions</td><td>${p.fn.join('<br>')}</td></tr><tr><td>Level</td><td>${p.v}</td></tr></table>`;
    h += `<p class="${p.warn ? 'warn' : ''}">${p.note}</p>`;
    if (hdr.common) h += `<p class="tip">${hdr.common}</p>`;
    h += `<p><button class="item" data-part="${hdr.id}">← About the ${hdr.name} header</button></p>`;
    h += `<div class="src">Source: UNO Q datasheet §9.4–9.7 · full pinout · user manual</div></div>`;
    return h;
  }
  showWelcome() {
    $('#panel').innerHTML = `<div class="card welcome"><h2>${BOARD_FACTS.name}</h2><span class="tag">Interactive 3D model</span>
      <p>This model is built from Arduino’s official open-source CAD files — the real copper, solder-mask and silkscreen artwork, drill holes and part positions.</p>
      <div class="facts"><span>Versions</span><span>${BOARD_FACTS.skus}</span><span>Size</span><span>${BOARD_FACTS.size}</span><span>Operating temp.</span><span>${BOARD_FACTS.temp}</span></div>
      <p class="tip"><b>Click any part</b> on the board — or choose one on the left — to learn what it does. Click a single header pin to see its function.</p>
      <p>Use <b>Top</b> / <b>Bottom</b> to turn the board over, and <b>360°</b> to spin it.</p>
      <p>Ready to learn step by step? Open <b>Lessons</b>.</p>
      <div class="src">Source: Arduino UNO Q datasheet ABX00162-ABX00173 · CAD files © Arduino, CC BY-SA 4.0</div></div>`;
  }

  // ------------------------------------------------------------------ sidebar
  renderSide() {
    const side = $('#side');
    if (this.mode === 'explore') {
      let h = '';
      for (const cat of CATEGORIES) {
        const items = Object.entries(PARTS).filter(([, p]) => p.cat === cat.id);
        if (!items.length) continue;
        h += `<h3>${cat.name}</h3>`;
        for (const [id, p] of items) h += `<button class="item" data-id="${id}"><span class="dot"></span>${p.name.replace(/^(Qualcomm Dragonwing™|STMicroelectronics) /, '')}<small>${(p.ref || '').split(' ')[0]}</small></button>`;
      }
      h += `<h3>Header pins</h3>`;
      for (const hd of [JDIGITAL, JANALOG, JSPI]) h += `<div class="pingrid">${hd.pins.map(p => `<button data-pin="${p.id}"><b>${p.label}</b></button>`).join('')}</div>`;
      side.innerHTML = h;
      side.querySelectorAll('.item').forEach(b => b.onclick = () => this.select(b.dataset.id));
      side.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => this.select('pin:' + b.dataset.pin));
    } else {
      let h = '', mod = 0;
      for (const L of LESSONS) {
        if (L.module !== mod) { mod = L.module; h += `<h3>${MODULES[mod]}</h3>`; }
        const done = this.progress[L.id];
        h += `<button class="lesson-card ${this.lesson && this.lesson.id === L.id ? 'on' : ''} ${done ? 'done' : ''}" data-lesson="${L.id}">
          <span class="num">${done ? '✓' : L.num}</span><b>${L.title}</b><p>${L.goal}</p><div class="meta">${L.level} · ${L.time}${done ? ' · completed' : ''}</div></button>`;
      }
      h += '<h3>Coming next (stage 3)</h3>' + COMING_SOON.map(s => `<div class="soon">${s}</div>`).join('');
      side.innerHTML = h;
      side.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => this.startLesson(b.dataset.lesson));
      const on = side.querySelector('.lesson-card.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    }
  }

  setMode(mode) {
    this.mode = mode;
    $('#app').className = 'mode-' + mode;
    document.querySelectorAll('.modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    this.hideFloat(); this.clearTemp(); this.hideCallout();
    this.pulseObjs = null; this.viewer.outline.edgeStrength = 4;
    if (mode === 'explore') {
      this.sim.stop(); this.stopSound(); this.lamp.intensity = 0; this.hideSonar(); this.showRoom(false);
      this.lesson = null;
      this.renderSide();
      this.select(null, { card: false });
      this.showWelcome();
    } else {
      this.renderSide();
      if (!this.lesson) this.lessonHome();
    }
  }

  lessonHome() {
    $('#panel').innerHTML = `<div class="card"><div class="lesson-head">Course</div><h2>Learn the UNO Q step by step</h2>
      <p>The lessons go in order, from the very basics to circuits with inputs, outputs, light and sound. Each step moves the 3D board, highlights the parts and explains them.</p>
      ${Object.entries(MODULES).map(([m, name]) => `<p><b>${name}</b></p><ol start="${LESSONS.find(l => l.module === +m).num}">${LESSONS.filter(l => l.module === +m).map(L => `<li>${L.title} — ${L.time}</li>`).join('')}</ol>`).join('')}
      <p class="tip">Start with <b>Lesson 1</b> on the left.</p>
      <p class="sim">Purple notes mark things that are <b>simulated</b> in this app (for example shortened boot times or ADC noise).</p></div>`;
  }

  // ------------------------------------------------------------------ lessons
  stepState(i) {
    const L = this.lesson; let have = [], power;
    for (let k = 0; k <= i; k++) { const S = L.steps[k]; if (S.have) have = S.have; if (S.power !== undefined) power = S.power; }
    return { have, power };
  }

  async startLesson(id) {
    const L = LESSONS.find(l => l.id === id);
    this.sim.stop(); this.stopSound(); this.outputsOff();
    this.lesson = L; this.stepIdx = 0; this.inQuiz = false;
    this.board.setMatrix(null);
    this.lamp.intensity = 0; this.hideSonar(); this.showRoom(false);
    if (L.circuit) { this.bench.setDefs(L.circuit); this.bb.group.visible = true; }
    else { this.bench.clear(); this.bench.setDefs([]); this.bb.group.visible = false; this.strips.visible = false; }
    if (L.id === 'l1' && this.usbPlugged) await this.plug(false);
    this.refreshPickTargets();
    this.renderSide();
    this.setupDock(L);
    this.goStep(0);
  }

  setupDock(L) {
    const has = !!(L.code || L.codes);
    $('#app').classList.toggle('with-dock', has);
    setTimeout(() => this.viewer.resize(), 320);
    if (!has) return;
    this.blinkDelay = 1000; $('#speed').value = 1000; $('#speed-val').textContent = '1000 ms';
    if (L.code) this.renderCode(L.code, L.explain);
    $('#serial').innerHTML = '';
    $('#slider-wrap').classList.remove('on');
    this.setPinLevel('');
    this.renderIO(L);
  }

  // dock "inputs & signals" column
  renderIO(L, extra = []) {
    const w = [...(L.widgets || []), ...extra];
    const io = $('#dock-io');
    $('#dock').classList.toggle('with-io', w.length > 0);
    $('#dock').classList.toggle('no-serial', L.id === 'l9');
    let h = '';
    if (w.includes('button')) h += `<div class="io-block"><div class="io-title">Push button on D4</div><button id="hold" class="hold">Hold to press</button><div class="io-note">or click &amp; hold the button in the 3D view</div><div id="btn-state" class="io-val">Released → D4 reads HIGH (pull-up)</div></div>`;
    if (w.includes('light')) h += `<div class="io-block"><div class="io-title">Light on the sensor <span class="io-note">(simulated)</span></div><input id="lux" type="range" min="0" max="1000" value="${Math.round(this.luxToSlider(this.lux))}"><div class="io-tools">${[['Dark', 0.01], ['Dim', 10], ['Room light', 300], ['Torch', 2000]].map(([t, v]) => `<button class="lvl" data-lux="${v}">${t}</button>`).join('')}</div><div id="lux-val" class="io-val"></div></div>`;
    if (w.includes('temp')) h += `<div class="io-block"><div class="io-title">Temperature around the TMP36 <span class="io-note">(simulated)</span></div><input id="tempc" type="range" min="-40" max="125" step="0.5" value="${this.tempC}"><div id="temp-val" class="io-val"></div></div>`;
    if (w.includes('distance')) h += `<div class="io-block"><div class="io-title">Obstacle in front of the sensor <span class="io-note">(simulated)</span></div><input id="dist" type="range" min="2" max="400" step="0.5" value="${this.distCm}"><div class="io-tools">${[5, 20, 40, 100, 250, 400].map(v => `<button class="lvl" data-dist="${v}">${v} cm</button>`).join('')}</div><div id="dist-val" class="io-val"></div><div class="io-note">or drag the obstacle in the 3D view</div></div><div class="io-block"><div class="io-title">Timing (HC-SR04 datasheet) · animation slowed down</div><canvas id="sonar-timing" width="560" height="112"></canvas></div>`;
    if (w.includes('pir')) h += `<div class="io-block"><div class="io-title">Try it</div>
        <div class="io-tools"><button id="pir-wave" class="hold">👋 Wave hand</button><button id="pir-still" class="lvl">✋ Hold hand still</button></div></div>
        <div class="io-block pirstat"><div><span>Sensor</span><b id="ps-sensor">—</b></div><div class="arrow">→</div><div><span>OUT → D2</span><b id="ps-out">—</b></div><div class="arrow">→</div><div><span>Alarm LED (D5)</span><b id="ps-led">—</b></div></div>
        <div id="ps-note" class="io-note"></div>`;
    if (w.includes('servo')) h += `<div class="io-block pirstat"><div><span>Sketch</span><b id="sv-cmd">—</b></div><div class="arrow">→</div><div><span>Pulse on D9</span><b id="sv-us">—</b></div><div class="arrow">→</div><div><span>Arm angle</span><b id="sv-ang">—</b></div></div>
        <div id="sv-note" class="io-note"></div>
        <div class="io-block"><div class="io-title">Oscilloscope · D9 <span class="io-note">(simulated)</span></div><canvas id="scope" width="560" height="150"></canvas><div id="scope-info" class="io-val"></div></div>`;
    if (w.includes('knob')) h += `<div class="io-block"><div class="io-title">Potentiometer knob</div><input id="knob" type="range" min="0" max="1000" value="${Math.round(this.knobValue() * 1000)}"><div id="knob-val" class="io-val"></div><div class="io-note">or drag the knob in the 3D view</div></div>`;
    if (w.includes('pwm')) h += `<div class="io-block"><div class="io-title">analogWrite(D5, <b id="pwm-v">128</b>)</div><input id="pwm" type="range" min="0" max="255" value="128"></div>`;
    if (w.includes('scope')) h += `<div class="io-block"><div class="io-title">Oscilloscope · ${L.scopePin || 'D5'} <span class="io-note">(simulated)</span></div><canvas id="scope" width="560" height="170"></canvas><div id="scope-info" class="io-val"></div></div>`;
    if (w.includes('audio')) h += `<div class="io-block"><button id="sound" class="hold small">${this.soundOn ? '🔊 Sound on' : '🔇 Sound off'}</button></div>`;
    if (w.includes('editor')) h += this.editorHTML();
    io.innerHTML = h;
    if ($('#hold')) {
      const hold = $('#hold');
      const dn = e => { e.preventDefault(); this.pressButton(true); }, up = () => this.pressButton(false);
      hold.addEventListener('pointerdown', dn); hold.addEventListener('pointerup', up); hold.addEventListener('pointerleave', up);
    }
    if ($('#knob')) { $('#knob').oninput = e => this.setKnob(+e.target.value / 1000); this.setKnob(this.knobValue()); }
    if ($('#lux')) { $('#lux').oninput = e => this.setLux(this.sliderToLux(+e.target.value)); document.querySelectorAll('[data-lux]').forEach(b => b.onclick = () => this.setLux(+b.dataset.lux)); this.setLux(this.lux); }
    if ($('#dist')) { $('#dist').oninput = e => this.setDist(+e.target.value); $('#dist').onchange = e => this.setDist(+e.target.value, true); document.querySelectorAll('[data-dist]').forEach(b => b.onclick = () => this.setDist(+b.dataset.dist, true)); this.setDist(this.distCm); }
    else this.hideSonar();
    this.refreshPickTargets();
    if ($('#pir-wave')) { $('#pir-wave').onclick = () => this.pirWave(); $('#pir-still').onclick = () => this.pirHoldStill(); }
    this.showRoom(w.includes('pir') && !!this.pirSensor());
    if ($('#tempc')) { $('#tempc').oninput = e => this.setTemp(+e.target.value); this.setTemp(this.tempC); }
    this.lamp.intensity = w.includes('light') ? this.lampIntensity() : 0;
    if ($('#pwm')) $('#pwm').oninput = e => this.applyManualPwm(+e.target.value);
    this.scope = $('#scope') ? new Scope($('#scope'), $('#scope-info')) : null;
    if (w.includes('servo')) { this.servoState = null; const sv = this.servoObj(); if (sv) { sv.target = 90; sv.setAngle(90); } }
    if ($('#sound')) $('#sound').onclick = e => { this.soundOn = !this.soundOn; e.currentTarget.textContent = this.soundOn ? '🔊 Sound on' : '🔇 Sound off'; if (!this.soundOn) this.stopSound(); };
    if (w.includes('editor')) this.bindEditor();
  }

  renderCode(code, explain) {
    this.codeText = code;
    const lines = code.split('\n');
    $('#code').innerHTML = lines.map((l, i) => `<span class="ln" data-n="${i + 1}">${highlight(l) || ' '}</span>`).join('');
    $('#code').querySelectorAll('.ln').forEach(el => el.onclick = () => {
      $('#code').querySelectorAll('.ln.sel').forEach(x => x.classList.remove('sel'));
      el.classList.add('sel');
      const n = +el.dataset.n, t = lines[n - 1].trim();
      $('#explain').innerHTML = (explain && explain[n]) || (t.startsWith('//') ? 'A <b>comment</b>: notes for humans. The compiler ignores everything after <code>//</code>.' : t === '}' || t === '};' ? 'Closing brace: ends the block that started with <code>{</code>.' : t === '' ? 'An empty line (only for readability).' : /^[\d,\s]+,?$/.test(t) ? 'One row of the picture: 13 values, one per LED (left → right).' : 'Click another line.');
    });
    $('#explain').innerHTML = 'Click a line to see what it does.';
  }

  async goStep(i) {
    const L = this.lesson; if (!L) return;
    i = Math.max(0, Math.min(L.steps.length - 1, i));
    const prev = this.stepIdx;
    this.stepIdx = i; this.inQuiz = false;
    const S = L.steps[i];
    this.clearTemp(); this.hideFloat(); this.hideCallout();
    this.pulseObjs = null; this.viewer.outline.edgeStrength = 4;
    this.strips.visible = false;
    if (S.action !== 'speedSlider') $('#slider-wrap').classList.remove('on');
    this.renderStep();
    const tok = this.stepTok = {};
    const alive = () => tok === this.stepTok;
    // stop programs from other steps unless this step runs the same one again
    if (S.action !== 'run' && S.action !== 'speedSlider' && S.action !== 'editor') { this.sim.stop(); this.outputsOff(); }
    // per-step code (LED-matrix lesson)
    if (L.codes) {
      const c = L.codes[S.code || 'logo'];
      this.matrixCodeKey = S.code || 'logo';
      this.renderCode(this.matrixListing(c), L.explain);
      this.renderIO(L, S.action === 'editor' ? ['editor'] : []);
    } else if (L.code) this.renderIO(L, S.action === 'pwmTry' ? ['pwm'] : []);

    // camera + highlight
    if (S.view) { this.setOutline([]); this.view(S.view); }
    if (S.focus) { this.setOutline(this.groupsFor(S.focus)); this.focus(S.focus, S.side); }
    if (S.pins) this.markPins(S.pins);
    if (S.focus && [].concat(S.focus).length > 1) {
      for (const id of [].concat(S.focus)) {
        if (!PARTS[id]) continue;
        const { center, box } = this.board.partCenter(id);
        const bottom = BOTTOM_PARTS.has(id);
        this.temp(this.label(shortName(PARTS[id].name), new THREE.Vector3(center.x, bottom ? box.min.y - 1 : box.max.y + 1, center.z)));
      }
    }

    // bench: power + parts for this step
    if (L.circuit) {
      const st = this.stepState(i), before = i > 0 ? this.stepState(i - 1).have : [];
      if (st.power === false && this.usbPlugged) await this.plug(false);
      if (!alive()) return;
      const animate = i > 0 && i === prev + 1 && S.have ? S.have.filter(id => !before.includes(id) && !this.bench.items[id]) : [];
      await this.bench.build(st.have, animate, alive);
      this.refreshPickTargets();
      if ($('#dist')) this.setDist(this.distCm, S.view === 'sonar');
      this.showRoom(!!(L.widgets && L.widgets.includes('pir')) && !!this.pirSensor());
      if (S.view === 'room') this.frameRoom();
      if (S.view === 'pirfront' || S.view === 'pirback' || S.view === 'servo' || S.view === 'servoclose') this.view(S.view);
      if (S.labels) for (const [id, text] of S.labels) {
        let p;
        if (id === 'board') p = new THREE.Vector3(-8, 14, -6);
        else { const it = this.bench.items[id]; if (!it) continue; const b = new THREE.Box3().setFromObject(it.group); p = b.getCenter(new THREE.Vector3()); p.y = b.max.y + 4; }
        this.temp(this.label(text, p, 'tag3d'));
      }
      if (!alive()) return;
      if (S.holes) this.holeLabels(S.holes);
      if (S.trace) { const objs = this.bench.groups(S.trace); this.setOutline(objs); this.pulseObjs = objs; }
    }
    const st = L.steps.some(x => x.power !== undefined) ? this.stepState(i) : {};
    if (st.power === true) await this.ensurePower();
    if (!alive()) return;
    await this.doAction(S.action, tok);
  }

  async doAction(a, tok) {
    const alive = () => tok === this.stepTok;
    switch (a) {
      case 'plugUsb': await sleep(700); if (!alive()) return; await this.plug(true); this.toast('Power LED on — the board is starting.'); this.bootAnimation(9000); break;
      case 'boot': await this.ensurePower(); if (!alive()) return; this.bootAnimation(9000); break;
      case 'longPress': {
        await this.ensurePower(); if (!alive()) return;
        this.board.pressButton(true);
        const lab = this.temp(this.label('Holding… 0 s', this.board.partCenter('pwrbtn').center.clone().add(new THREE.Vector3(0, 6, 0)), 'pin'));
        for (let s = 1; s <= 5; s++) { await sleep(1000); if (!alive()) { this.board.pressButton(false); return; } lab.element.textContent = `Holding… ${s} s`; }
        this.board.pressButton(false);
        lab.element.textContent = 'Linux reboots (power stays on)';
        this.sim.stop();
        for (const id of ['rgb1', 'rgb2', 'rgb3', 'rgb4']) this.board.setLed(id, 0, 0, 0);
        this.bootAnimation(7000);
        break;
      }
      case 'ensurePower': await this.ensurePower(); break;
      case 'run': await this.ensurePower(); if (alive()) this.runProgram(); break;
      case 'speedSlider': $('#slider-wrap').classList.add('on'); await this.ensurePower(); if (alive() && !this.sim.running) this.runProgram(); break;
      case 'showStrips': this.strips.visible = true; for (const r of ['a', 'e', 'f', 'j']) this.temp(this.label(r, this.bb.hole(r, 1).add(new THREE.Vector3(-4.5, 1, 0)), 'hole')); break;
      case 'pwmTry': this.applyManualPwm(+($('#pwm') ? $('#pwm').value : 128)); break;
      case 'matrixAxes': {
        const mp = this.board.matrixPos;
        const at = (i, t, dx, dz) => { const [x, y] = mp[i]; this.temp(this.label(t, new THREE.Vector3(x - 34.29 + dx, 1.2, -(y - 26.67) + dz), 'hole')); };
        at(0, 'row 0 · col 0', -4, -3); at(12, 'col 12', 4, -3); at(91, 'row 7', -4, 3);
        this.board.setMatrix(Array.from({ length: 104 }, (_, i) => (i === 0 || i === 12 || i === 91 || i === 31) ? 1 : 0));
        this.temp(this.label('index 31 (row 2, col 5)', new THREE.Vector3(mp[31][0] - 34.29, 1.2, -(mp[31][1] - 26.67) - 2.5), 'pin'));
        break;
      }
      case 'editor': await this.ensurePower(); if (alive()) this.runProgram(); break;
      default: break;
    }
  }

  renderStep() {
    const L = this.lesson, S = L.steps[this.stepIdx], last = this.stepIdx === L.steps.length - 1;
    let h = `<div class="card"><div class="lesson-head">Lesson ${L.num} · ${L.level}</div><div class="lesson-title">${L.title}</div>`;
    if (this.stepIdx === 0) h += `<div class="hw-list">${L.hardware.map(x => `<span>${x}</span>`).join('')}</div>`;
    h += `<div class="steps-bar">${L.steps.map((_, k) => `<i data-k="${k}" class="${k < this.stepIdx ? 'done' : k === this.stepIdx ? 'cur' : ''}" title="Step ${k + 1}"></i>`).join('')}</div>`;
    h += `<div class="step-title">${this.stepIdx + 1}. ${S.title}</div>${S.body}`;
    h += `<div class="nav"><button id="prev" ${this.stepIdx === 0 ? 'disabled' : ''}>← Back</button>`;
    h += last ? `<button id="quiz" class="primary">Take the quiz →</button>` : `<button id="next" class="primary">Next →</button>`;
    h += `</div></div>`;
    $('#panel').innerHTML = h; $('#panel').scrollTop = 0;
    $('#panel').querySelectorAll('.steps-bar i').forEach(b => b.onclick = () => this.goStep(+b.dataset.k));
    $('#prev').onclick = () => this.goStep(this.stepIdx - 1);
    if ($('#next')) $('#next').onclick = () => this.goStep(this.stepIdx + 1);
    if ($('#quiz')) $('#quiz').onclick = () => this.showQuiz();
  }

  showQuiz() {
    const L = this.lesson; this.inQuiz = true;
    const answers = {};
    let h = `<div class="card quiz"><div class="lesson-head">Lesson ${L.num} · Quiz</div><div class="lesson-title">${L.title}</div>`;
    L.quiz.forEach((q, qi) => {
      h += `<div class="q"><p>${qi + 1}. ${q.q}</p>${q.a.map((a, ai) => `<button class="opt" data-q="${qi}" data-a="${ai}">${a}</button>`).join('')}<div class="why" id="why${qi}"></div></div>`;
    });
    h += `<div id="score"></div><div class="sources src"><b>Sources for this lesson</b><br>${L.sources.map(s => `<a href="${s.u}" target="_blank" rel="noopener">${s.t}</a>`).join('<br>')}</div>`;
    const idx = LESSONS.indexOf(L), next = LESSONS[idx + 1];
    h += `<div class="nav"><button id="back-steps">← Steps</button>${next ? `<button id="next-lesson" class="primary">Lesson ${next.num} →</button>` : ''}</div></div>`;
    $('#panel').innerHTML = h; $('#panel').scrollTop = 0;
    $('#panel').querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const qi = +b.dataset.q, ai = +b.dataset.a; if (answers[qi] !== undefined) return;
      answers[qi] = ai; const q = L.quiz[qi];
      $('#panel').querySelectorAll(`.opt[data-q="${qi}"]`).forEach(o => { if (+o.dataset.a === q.c) o.classList.add('right'); else if (+o.dataset.a === ai) o.classList.add('wrong'); });
      $('#why' + qi).innerHTML = (ai === q.c ? '✓ Correct. ' : '✗ Not quite. ') + q.why;
      if (Object.keys(answers).length === L.quiz.length) {
        const sc = L.quiz.filter((q2, k) => answers[k] === q2.c).length;
        $('#score').innerHTML = `<p class="score">Score: ${sc} / ${L.quiz.length}${sc === L.quiz.length ? ' — excellent!' : ''}</p>`;
        this.progress[L.id] = true; localStorage.setItem('unoq-lab-progress', JSON.stringify(this.progress)); this.renderSide();
      }
    });
    $('#back-steps').onclick = () => this.goStep(L.steps.length - 1);
    if ($('#next-lesson')) $('#next-lesson').onclick = () => this.startLesson(next.id);
  }

  toast(msg) {
    const t = document.createElement('div'); t.className = 'part-label'; t.style.cssText = 'position:absolute;left:50%;top:14px;transform:translateX(-50%);font-size:13px;padding:7px 12px;z-index:6';
    t.textContent = msg; $('#stage').appendChild(t); setTimeout(() => t.remove(), 3200);
  }

  // ------------------------------------------------------------------ LED-matrix lesson helpers
  matrixListing(c) {
    if (c.frame === 'logo') return matrixCode('logo', LOGO_ARRAY, 1, c.comment);
    if (c.frame === 'shades') return matrixCode('shades', SHADES_ARRAY, 3, c.comment);
    const { arr, bits } = this.editorExport();
    return matrixCode('frame', arr, bits, bits === 1 ? 'your own picture (1 bit: 0 = off, 1 = on)' : 'your own picture (3 bits: 0 … 7)');
  }
  editorExport() {
    const binary = this.editorFrame.every(v => v === 0 || v === 7);
    return binary ? { arr: this.editorFrame.map(v => (v ? 1 : 0)), bits: 1 } : { arr: this.editorFrame.slice(), bits: 3 };
  }
  editorHTML() {
    let cells = '';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 13; c++) { const i = r * 13 + c; cells += `<button class="px" data-i="${i}" title="row ${r}, column ${c} → index ${i}"></button>`; }
    const levels = [7, 5, 3, 1].map(l => `<button class="lvl ${this.brush === l ? 'on' : ''}" data-l="${l}" style="--v:${l / 7}">${l}</button>`).join('');
    return `<div class="io-block"><div class="io-title">Pixel editor · 8 rows × 13 columns</div><div class="pxgrid">${cells}</div>
      <div class="io-tools">Brush ${levels}<button class="lvl" data-act="clear">Clear</button><button class="lvl" data-act="logo">Logo</button><button class="lvl" data-act="invert">Invert</button></div>
      <div class="io-note">Click a square to switch it on/off. Brush 7 = full brightness.</div></div>`;
  }
  bindEditor() {
    const paint = () => {
      document.querySelectorAll('.px').forEach(b => { const v = this.editorFrame[+b.dataset.i] / 7; b.style.setProperty('--v', v); b.classList.toggle('lit', v > 0); });
      const L = this.lesson; if (L && L.codes && this.matrixCodeKey === 'editor') this.renderCode(this.matrixListing(L.codes.editor), L.explain);
    };
    document.querySelectorAll('.px').forEach(b => b.onclick = () => { const i = +b.dataset.i; this.editorFrame[i] = this.editorFrame[i] === this.brush ? 0 : this.brush; paint(); });
    document.querySelectorAll('.lvl[data-l]').forEach(b => b.onclick = () => { this.brush = +b.dataset.l; document.querySelectorAll('.lvl[data-l]').forEach(x => x.classList.toggle('on', x === b)); });
    document.querySelectorAll('.lvl[data-act]').forEach(b => b.onclick = () => {
      const a = b.dataset.act;
      if (a === 'clear') this.editorFrame.fill(0);
      if (a === 'logo') this.editorFrame = LOGO_ARRAY.map(v => v * 7);
      if (a === 'invert') this.editorFrame = this.editorFrame.map(v => (v ? 0 : 7));
      paint();
    });
    paint();
  }

  // ------------------------------------------------------------------ inputs
  pressButton(down) {
    const b = this.bench.get('btn1') || (this.bench.tray || []).map(t => t.obj).find(o => o.setPressed);
    if (b && b.setPressed) b.setPressed(down);
    this.buttonDown = down;
    const s = $('#btn-state');
    if (s) s.innerHTML = down ? '<b class="lo">Pressed</b> → D4 connected to GND → reads LOW' : 'Released → D4 reads HIGH (pull-up)';
  }
  // ---- light sensor model: typical GL5528 (datasheet: 10–20 kΩ at 10 lux, γ = 0.6, dark ≥ 1 MΩ) — 15 kΩ at 10 lux
  ldrOhms(lux = this.lux) { return 15000 * Math.pow(Math.max(lux, 0.001) / 10, -0.6); }
  ldrVolts() { return VREF * 10000 / (this.ldrOhms() + 10000); }
  sliderToLux(v) { return Math.pow(10, -2 + v * 5.3 / 1000); }            // 0.01 … 2000 lux, logarithmic
  luxToSlider(l) { return (Math.log10(l) + 2) * 1000 / 5.3; }
  lampIntensity() { const k = Math.min(1, Math.max(0, (Math.log10(this.lux) + 2) / 5.3)); return 14000 * k * k; }
  setLux(l) {
    this.lux = Math.min(2000, Math.max(0.01, l));
    const sl = $('#lux'); if (sl && document.activeElement !== sl) sl.value = Math.round(this.luxToSlider(this.lux));
    this.lamp.intensity = $('#lux') ? this.lampIntensity() : 0;
    const R = this.ldrOhms(), V = this.ldrVolts();
    const fmtR = R >= 1e6 ? (R / 1e6).toFixed(2) + ' MΩ' : R >= 1000 ? (R / 1000).toFixed(1) + ' kΩ' : Math.round(R) + ' Ω';
    const lx = this.lux < 1 ? this.lux.toFixed(2) : this.lux < 100 ? this.lux.toFixed(1) : Math.round(this.lux);
    const el = $('#lux-val'); if (el) el.innerHTML = `≈ <b>${lx} lux</b> → LDR ≈ <b>${fmtR}</b> → A0 ≈ <b>${V.toFixed(2)} V</b> → 14-bit ≈ <b>${Math.round(V / VREF * 16383)}</b>`;
  }
  // ---- HC-SR04 model: datasheet µs = cm × 58; UNO Q pulseIn() resolves 100 µs (Zephyr tick, see Lesson 13)
  echoUs() { return this.distCm * 58; }
  pulseInUs() { return Math.floor(this.echoUs() / 100) * 100; }
  // ---- Lesson 13: true-scale sonar ------------------------------------------------------------------
  sonarGeom() {
    const us = this.bench.get('us1'); if (!us) return null;
    const g = this.bench.items.us1.group.position;
    const y = g.y + us.beamY, face = g.z + us.beamZ;
    return { us, g, y, face, T: new THREE.Vector3(g.x + us.tx, y, face), R: new THREE.Vector3(g.x + us.rx, y, face) };
  }
  setDist(cm, reframe = false) {
    this.distCm = Math.min(400, Math.max(2, cm));
    const sl = $('#dist'); if (sl && document.activeElement !== sl) sl.value = this.distCm;
    const G = this.sonarGeom();
    if (G) {
      const [BW, BH, BD] = this.obstacle.userData.size, wallZ = G.face + this.distCm * 10;
      const wasVis = this.obstacle.visible;
      this.obstacle.position.set(G.g.x, DESK_Y + BH / 2, wallZ + BD / 2); this.obstacle.visible = true;
      if (!wasVis) this.refreshPickTargets();
      this.obstacleLabel.element.textContent = `${this.distCm.toFixed(1)} cm`;
      this.tape.visible = true; this.tape.position.set(G.g.x + 32, DESK_Y + 0.25, G.face);
      this.tapeClip.constant = wallZ; this.tapeHook.visible = true; this.tapeHook.position.set(G.g.x + 32, DESK_Y + 3.6, wallZ - 0.4);
      this.wallClip.constant = wallZ; this.faceClip.constant = -G.face;
      if (reframe) this.frameSonar(800);
    }
    const e = this.echoUs(), q = this.pulseInUs(), el = $('#dist-val');
    if (el) el.innerHTML = `Obstacle <b>${this.distCm.toFixed(1)} cm</b> → ECHO HIGH ≈ <b>${Math.round(e)} µs</b> → pulseIn() on UNO Q ≈ <b>${q} µs</b> → <b>${(q / 58).toFixed(1)} cm</b>`;
    if (!this.waves.anim) this.drawTiming(null);
  }
  hideSonar() { this.obstacle.visible = false; this.tape.visible = false; this.tapeHook.visible = false; this.waves.anim = null; this.updateWaves(); }
  frameSonar(ms = 1000) {
    const G = this.sonarGeom(); if (!G) return this.view('bench', ms);
    const d = this.distCm * 10, BD = this.obstacle.userData.size[2];
    const mid = new THREE.Vector3(G.g.x, DESK_Y + 35, G.face - 30 + (d + BD * 0.6 + 30) / 2);
    const span = d + BD * 0.6 + 90;
    const dist = Math.max(230, span * 1.3);
    return this.viewer.flyTo(mid, dist, new THREE.Vector3(0.93, 0.36, 0.06), ms);
  }
  // one measurement: TRIG → 8-cycle burst from T → echo from the box back to R (datasheet timing diagram).
  // Shown slowed down; the wavefront spacing is the true 40 kHz wavelength.
  sonarBurst() {
    const G = this.sonarGeom(); if (!G || this.waves.anim) return;
    const d = this.distCm * 10, lambda = 343 / 40;                        // mm
    const image = new THREE.Vector3(G.T.x, G.y, 2 * (G.face + d) - G.T.z);  // mirror image of T behind the flat face
    const rt = 2 * d, T = 650 + 950 * Math.min(1, d / 1500);               // visual round-trip time (ms)
    const v = (image.distanceTo(G.R)) / T;                                 // mm per ms (slowed down)
    this.waves.anim = { t0: performance.now(), G, d, lambda, image, v, trig: 70, hear: image.distanceTo(G.R) / v, burst: 8 * lambda / v };
    this.waves.anim.total = 70 + this.waves.anim.hear + this.waves.anim.burst + 320;
  }
  updateWaves() {
    const W = this.waves, A = W.anim;
    const hideAll = () => { [...W.out, ...W.back].forEach(m => { m.visible = false; }); W.flash.material.opacity = 0; W.tflash.material.opacity = 0; };
    if (!A) return hideAll();
    const t = performance.now() - A.t0;
    if (t > A.total || !this.obstacle.visible) { W.anim = null; hideAll(); this.drawTiming(null); return; }
    const { G, v, lambda, image, d, trig } = A, travel = v * (t - trig);
    for (let i = 0; i < 8; i++) {
      const s = travel - i * lambda;                               // radius of wavefront i (mm)
      const env = Math.sin(Math.PI * (i + 0.5) / 8);               // burst envelope
      const o = W.out[i], b = W.back[i];
      if (s > 0 && s < d + 12) {
        o.visible = true; o.position.copy(G.T); o.scale.setScalar(s);
        o.material.opacity = 0.55 * env * (1 - 0.4 * s / (d + 12));
      } else o.visible = false;
      if (s > d && s < image.distanceTo(G.R) + 15) {
        b.visible = true; b.position.copy(image); b.lookAt(G.R); b.scale.setScalar(s);
        b.material.opacity = 0.5 * env * (1 - 0.35 * (s - d) / (d + 15));
      } else b.visible = false;
    }
    const tSend = t - trig, tHear = t - trig - A.hear;
    W.tflash.position.set(G.T.x, G.y, G.face - 1.5); W.tflash.material.opacity = tSend >= 0 && tSend < A.burst ? 0.45 : 0;
    W.flash.position.set(G.R.x, G.y, G.face - 1.5); W.flash.material.opacity = tHear >= 0 && tHear < A.burst + 200 ? 0.6 * (1 - tHear / (A.burst + 200)) : 0;
    this.drawTiming(t);
  }
  // datasheet timing diagram with a cursor that follows the animation
  drawTiming(t) {
    const c = $('#sonar-timing'); if (!c) return;
    const g = c.getContext('2d'), w = c.width, h = c.height, A = this.waves.anim;
    const trig = 70, burst = A ? A.burst : 120, hear = A ? A.hear : 600;
    const total = trig + hear + burst + 320, X = ms => 92 + (w - 102) * ms / total;
    g.fillStyle = '#070b0e'; g.fillRect(0, 0, w, h);
    g.font = '12px Consolas, monospace'; g.textBaseline = 'middle';
    const rows = [['TRIG (D7)', 18], ['Burst from T', 46], ['ECHO (D8)', 74]];
    for (const [name, y] of rows) { g.fillStyle = '#8fa3b5'; g.fillText(name, 6, y); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1; g.beginPath(); g.moveTo(92, y + 8); g.lineTo(w - 10, y + 8); g.stroke(); }
    const step = (y, segs, col) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(92, y + 8); for (const [a, b] of segs) { g.lineTo(X(a), y + 8); g.lineTo(X(a), y - 6); g.lineTo(X(b), y - 6); g.lineTo(X(b), y + 8); } g.lineTo(w - 10, y + 8); g.stroke(); };
    step(18, [[0, trig * 0.8]], '#ffd34d');
    const cyc = []; for (let i = 0; i < 8; i++) { const a = trig + i * burst / 8; cyc.push([a, a + burst / 16]); }
    step(46, cyc, '#9fe6ff');
    step(74, [[trig + burst, Math.max(trig + burst + 4, trig + hear)]], '#ffbf73');
    g.fillStyle = '#ffd7a8'; g.fillText(`ECHO HIGH ${Math.round(this.echoUs())} µs = round trip → ${(this.echoUs() / 58).toFixed(1)} cm`, 96, 101);
    if (t != null) { const x = X(Math.min(t, total)); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 6); g.lineTo(x, 88); g.stroke(); }
  }
  // ---- Lesson 14: HC-SR501 behaviour (manufacturer datasheet), kept simple for the lesson ------------
  //  • OUT = 3.3 V while motion is detected; it stays HIGH for the time-delay setting (here the minimum, ≈5 s)
  //  • jumper H (repeatable): every new motion restarts the delay
  //  • a real sensor needs about 1 minute to start up — shortened here to 3 s
  //  • it reacts to a warm object MOVING across its view, not to one that stays still
  pirReset() {
    this.pir = { out: 0, until: 0, readyAt: 0, delayS: 5, mode: 'rest', waveT0: 0, x: 260, phase: 0, ledOn: false };
  }
  pirPowered() { const P = this.pir; P.readyAt = performance.now() + 3000; P.out = 0; P.until = 0; }
  pirSensor() { return this.bench.get('pir1'); }
  pirLens() { const s = this.pirSensor(); return s ? s.lens() : null; }
  // close-up: sensor, hand path and the alarm LED all in view
  frameRoom(ms = 1100) {
    const L = this.pirLens(); if (!L) return this.view('bench', ms);
    return this.viewer.flyTo(new THREE.Vector3(L.x - 50, DESK_Y + 45, L.z + 95), 600, new THREE.Vector3(-0.12, 0.8, -0.59), ms);
  }
  framePir(side, ms = 1000) {
    const L = this.pirLens(); if (!L) return this.view('bench', ms);
    const dir = side === 'back' ? new THREE.Vector3(0.35, 0.3, -0.89) : new THREE.Vector3(-0.35, 0.3, 0.89);
    return this.viewer.flyTo(new THREE.Vector3(L.x, L.y - 4, L.z - 8), 120, dir, ms);
  }
  showRoom(on) {
    this.person.group.visible = on; this.pirFan.visible = on;
    if (this.pirTags) { this.pirTags.forEach(t => { t.parent && t.parent.remove(t); t.element.remove(); }); this.pirTags = null; }
    if (on) {
      this.updateFan();
      const mk = cls => { const el = document.createElement('div'); el.className = 'part-label ' + cls; const o = new CSS2DObject(el); this.viewer.scene.add(o); return o; };
      const L = this.pirLens(), led = this.bench.items.led1;
      const tS = mk('pirtag'); tS.position.set(L.x, L.y + 32, L.z);
      const tL = mk('pirtag'); if (led) { const b = new THREE.Box3().setFromObject(led.group); tL.position.set((b.min.x + b.max.x) / 2, b.max.y + 8, (b.min.z + b.max.z) / 2); }
      this.pirTags = [tS, tL];
      this.pir.mode = 'rest'; this.pir.x = 260;
    }
  }
  updateFan() {
    const L = this.pirLens(); if (!L) return;
    const r = 320;                                               // drawn short; the real range reaches 3–7 m
    this.pirFan.position.set(L.x, DESK_Y + 2, L.z); this.pirFan.scale.set(r, r, 1);
  }
  // ---- Lesson 15: SG90 servo ------------------------------------------------------------------------
  servoObj() { return this.bench.get('sv1'); }
  frameServo(close, ms = 1000) {
    const sv = this.servoObj(); if (!sv) return this.viewer.flyTo(new THREE.Vector3(40, 0, 60), 260, new THREE.Vector3(-0.3, 0.8, 0.5), ms);
    sv.group.updateMatrixWorld(true);
    const p = sv.body.getWorldPosition(new THREE.Vector3());
    if (close) return this.viewer.flyTo(p.clone().add(new THREE.Vector3(-4, 18, 0)), 115, new THREE.Vector3(-0.45, 0.62, 0.64), ms);
    return this.viewer.flyTo(new THREE.Vector3(p.x - 45, 6, p.z - 25), 250, new THREE.Vector3(-0.25, 0.85, 0.47), ms);
  }
  onServo(pin, us, angle) {
    const io = this.ioFor(pin), sv = this.servoObj();
    const ok = io && io.kind === 'servo' && this.wired(io) && this.board.powered;
    this.servoState = { us, angle: us == null ? null : angle, ok };
    if (ok && sv && us != null) sv.target = angle;
    if (this.scope && us != null) this.scope.set({ type: 'servo', us });
    if (us != null) this.setPinLevel(`${pin}: pulse ${us} µs every 20 ms`);
  }
  servoTick(dt) {
    const sv = this.servoObj(); if (!sv) return;
    const d = sv.target - sv.angle, step = 600 * dt;            // datasheet: 0.1 s per 60° → 600°/s (no load)
    if (Math.abs(d) > 0.01) sv.setAngle(sv.angle + Math.sign(d) * Math.min(Math.abs(d), step));
    const st = this.servoState;
    const set = (id, t, cls) => { const e = $(id); if (e && e.innerHTML !== t) { e.innerHTML = t; e.className = cls; } };
    set('#sv-cmd', st && st.angle != null ? `write(${st.angle})` : '—', st && st.angle != null ? 'on' : 'off');
    set('#sv-us', st && st.us != null ? `${st.us} µs` : '—', st && st.us != null ? 'on' : 'off');
    set('#sv-ang', `${Math.round(sv.angle)}°`, Math.abs(sv.target - sv.angle) > 0.5 ? 'warm' : 'on');
    set('#sv-note', !this.sim.running ? 'Press <b>▶ Run</b> to start.' : Math.abs(sv.target - sv.angle) > 0.5 ? 'Turning…' : 'Holding the angle.', 'io-note');
  }
  pirWave() { this.pir.mode = 'wave'; this.pir.waveT0 = performance.now(); }
  pirHoldStill() { this.pir.mode = 'still'; }
  pirTick(dt) {
    const P = this.pir; if (!P || !this.person || !this.person.group.visible) return;
    const now = performance.now(), L = this.pirLens(); if (!L) return;
    const powered = this.board.powered && this.lesson && this.lesson.io && this.lesson.io.D2 && this.wired(this.lesson.io.D2);
    // hand: rests to the right (outside the view), "wave" = one pass across and back (2.4 s), "still" = parked in front
    let moving = false;
    if (P.mode === 'wave') {
      const t = (now - P.waveT0) / 1200;
      if (t >= 2) { P.mode = 'rest'; P.x = 260; }
      else { P.x = t < 1 ? 260 - 480 * t : -220 + 480 * (t - 1); moving = true; }
    } else if (P.mode === 'still') P.x += (0 - P.x) * Math.min(1, dt * 5);
    else P.x += (260 - P.x) * Math.min(1, dt * 5);
    this.person.group.position.set(L.x + P.x, L.y + 30, L.z + 120);
    this.person.group.rotation.y = Math.PI;
    P.phase += moving ? dt * 9 : 0; this.person.pose(P.phase, moving);
    // detection: hand moving inside the lens' field of view (< 120°, datasheet)
    const ang = Math.abs(Math.atan2(P.x, 120)) * 180 / Math.PI;
    const trig = powered && moving && ang <= 55;
    if (!powered) P.out = 0;
    else if (now < P.readyAt) P.out = 0;
    else if (P.out) { if (trig) P.until = now + P.delayS * 1000; if (now >= P.until) P.out = 0; }
    else if (trig) { P.out = 1; P.until = now + P.delayS * 1000; }
    // status panel + 3D tags
    const running = this.sim.running;
    const warm = powered && now < P.readyAt, left = Math.max(0, (P.until - now) / 1000);
    const sensorTxt = !powered ? 'No power' : warm ? `Warming up… ${Math.ceil((P.readyAt - now) / 1000)}` : P.out ? 'MOTION!' : 'Watching';
    const set = (id, html, cls) => { const e = $(id); if (e && e.innerHTML !== html) { e.innerHTML = html; e.className = cls; } };
    set('#ps-sensor', sensorTxt, P.out ? 'on' : warm ? 'warm' : 'off');
    set('#ps-out', P.out ? 'HIGH · 3.3 V' : 'LOW · 0 V', P.out ? 'on' : 'off');
    set('#ps-led', P.ledOn ? 'ON' : 'OFF', P.ledOn ? 'on' : 'off');
    const note = !running ? 'Press <b>▶ Run</b> to start.' : warm ? 'The sensor is starting up. A real HC-SR501 needs about <b>1 minute</b> — shortened here.' :
      P.out ? `Keep waving and it stays ON. It turns OFF <b>${left.toFixed(1)} s</b> after the last movement.` :
      P.mode === 'still' ? 'A hand that does not move is <b>not</b> detected.' : 'Click <b>👋 Wave hand</b>.';
    set('#ps-note', note, 'io-note');
    if (this.pirTags) {
      const [tS, tL] = this.pirTags;
      const s1 = warm ? `Warming up ${Math.ceil((P.readyAt - now) / 1000)} s` : P.out ? 'MOTION! OUT = HIGH' : 'Watching · OUT = LOW';
      if (tS.element.textContent !== s1) { tS.element.textContent = s1; tS.element.className = 'part-label pirtag ' + (P.out ? 'on' : ''); }
      const s2 = P.ledOn ? 'LED ON' : 'LED OFF';
      if (tL.element.textContent !== s2) { tL.element.textContent = s2; tL.element.className = 'part-label pirtag ' + (P.ledOn ? 'on' : ''); }
    }
  }
  drawPirTimeline() {
    const c = $('#pir-timeline'); if (!c) return;
    const g = c.getContext('2d'), w = c.width, h = c.height, P = this.pir, now = performance.now();
    g.fillStyle = '#070b0e'; g.fillRect(0, 0, w, h);
    g.font = '12px Consolas, monospace'; g.textBaseline = 'middle';
    g.fillStyle = '#8fa3b5'; g.fillText('motion', 6, 22); g.fillText('OUT (D2)', 6, 58);
    g.fillText('−30 s', 70, h - 8); g.fillText('now', w - 32, h - 8);
    const X = t => 70 + (w - 80) * (1 - (now - t) / 30000);
    g.strokeStyle = 'rgba(255,255,255,0.08)'; for (let s = 0; s <= 30; s += 5) { const x = X(now - s * 1000); g.beginPath(); g.moveTo(x, 8); g.lineTo(x, h - 18); g.stroke(); }
    const line = (idx, y, col) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); P.hist.forEach(([t, o, m], i) => { const v = idx ? m : o, yy = y + 10 - v * 20; if (!i) g.moveTo(X(t), yy); else g.lineTo(X(t), yy); }); g.stroke(); };
    line(1, 22, '#9fe6ff'); line(0, 58, '#ffd34d');
  }
  tmp36Volts() { return Math.min(2.0, Math.max(0.1, 0.5 + this.tempC / 100)); }   // datasheet: 0.5 V at 0 °C, 10 mV/°C
  setTemp(t) {
    this.tempC = t;
    const V = this.tmp36Volts(), el = $('#temp-val');
    if (el) el.innerHTML = `<b>${t.toFixed(1)} °C</b> → V<sub>OUT</sub> = 0.5 V + ${t.toFixed(1)} × 10 mV = <b>${V.toFixed(3)} V</b> → 14-bit ≈ <b>${Math.round(V / VREF * 16383)}</b>`;
  }
  knobValue() { const p = this.bench.get('pot1'); return p ? p.value : (this.knob ?? 0.5); }
  setKnob(f) {
    this.knob = Math.min(1, Math.max(0, f));
    const p = this.bench.get('pot1'); if (p) p.set(this.knob);
    const v = this.knob * VREF;
    const k = $('#knob'); if (k && document.activeElement !== k) k.value = Math.round(this.knob * 1000);
    const kv = $('#knob-val');
    if (kv) kv.innerHTML = `Wiper ≈ <b>${v.toFixed(2)} V</b> → 14-bit reading ≈ <b>${Math.round(v / VREF * 16383)}</b>`;
  }
  bindDirectInput() {
    // press the 3D push button / drag the 3D knob without rotating the camera
    const stage = $('#stage');
    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0 || this.mode !== 'lessons') return;
      const hit = this.viewer.pick(e);
      if (!hit) return;
      if (hit.id === 'pushbutton') {
        e.stopPropagation(); this.viewer.controls.enabled = false; this.pressButton(true);
        const up = () => { this.pressButton(false); this.viewer.controls.enabled = true; window.removeEventListener('pointerup', up); };
        window.addEventListener('pointerup', up);
      } else if (hit.id === 'obstacle') {
        e.stopPropagation(); this.viewer.controls.enabled = false;
        const G0 = this.sonarGeom(); if (!G0) { this.viewer.controls.enabled = true; return; }
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -hit.point.y), p = new THREE.Vector3();
        const off = hit.point.z - (G0.face + this.distCm * 10);
        const mv = ev => {
          const G = this.sonarGeom(); if (!G) return;
          this.viewer.setPointer(ev); this.viewer.raycaster.setFromCamera(this.viewer.pointer, this.viewer.camera);
          if (this.viewer.raycaster.ray.intersectPlane(plane, p)) this.setDist((p.z - off - G.face) / 10);
        };
        const up = () => { this.viewer.controls.enabled = true; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      } else if (hit.id === 'pot') {
        e.stopPropagation(); this.viewer.controls.enabled = false;
        let x0 = e.clientX, f0 = this.knobValue();
        const mv = ev => this.setKnob(f0 + (ev.clientX - x0) / 220);
        const up = () => { this.viewer.controls.enabled = true; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      }
    }, true);
    // the browser only allows sound after a user gesture
    const unlock = () => { this.audioCtx(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
  }

  // ------------------------------------------------------------------ sound (Web Audio square wave = what tone() produces)
  audioCtx() {
    if (!this.ac) { try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ac = null; } }
    if (this.ac && this.ac.state === 'suspended') this.ac.resume();
    return this.ac;
  }
  playTone(f, ms) {
    this.stopSound();
    if (!this.soundOn) return;
    const ac = this.audioCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square'; o.frequency.value = f;
    g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(0.045, ac.currentTime + 0.005);
    o.connect(g).connect(ac.destination); o.start();
    if (ms) { g.gain.setValueAtTime(0.045, ac.currentTime + ms / 1000 - 0.005); g.gain.linearRampToValueAtTime(0, ac.currentTime + ms / 1000); o.stop(ac.currentTime + ms / 1000 + 0.01); }
    this.osc = o;
  }
  stopSound() { if (this.osc) { try { this.osc.stop(); } catch (e) { /* already stopped */ } this.osc = null; } }

  // ------------------------------------------------------------------ simulation
  ioFor(pin) { const L = this.lesson; return L && L.io && L.io[pin]; }
  wired(io) { return !!io && this.bench.has(io.needs); }

  setupSim() {
    this.sim = new Sim({
      line: n => {
        $('#code').querySelectorAll('.ln.exec').forEach(x => x.classList.remove('exec'));
        if (n) { const el = $('#code').querySelector(`.ln[data-n="${n}"]`); if (el) { el.classList.add('exec'); el.scrollIntoView({ block: 'nearest' }); } }
      },
      pin: (pin, level) => this.onDigital(pin, level),
      pwm: (pin, duty, raw) => this.onPwm(pin, duty, raw),
      tone: (pin, f, ms) => this.onTone(pin, f, ms),
      noTone: pin => this.onNoTone(pin),
      read: (pin, mode) => {
        const io = this.ioFor(pin);
        if (io && io.kind === 'pir' && this.wired(io)) return this.pir.out;
        if (io && io.kind === 'button' && this.wired(io) && this.buttonDown) return 0;
        if (mode === 'INPUT_PULLUP') return 1;
        return Math.random() < 0.5 ? 0 : 1;      // an open input without pull-up floats
      },
      analog: pin => {
        const io = this.ioFor(pin);
        if (io && io.kind === 'pot' && this.wired(io)) return this.knobValue() * VREF;
        if (io && io.kind === 'ldr' && this.wired(io)) return this.ldrVolts();
        if (io && io.kind === 'tmp36' && this.wired(io)) return this.tmp36Volts();
        return 0.4 + Math.random() * 0.3;         // unconnected input floats
      },
      matrix: vals => this.board.setMatrix(vals),
      servo: (pin, us, angle) => this.onServo(pin, us, angle),
      pulse: async (pin) => {
        const io = this.ioFor(pin);
        if (io && io.kind === 'hcsr04' && this.wired(io) && this.board.powered) { const us = this.pulseInUs(); await sleep(Math.max(1, us / 1000)); this.setPinLevel(`D8 ECHO: HIGH for ${Math.round(this.echoUs())} µs → pulseIn() = ${us} µs`); return us; }
        await sleep(2000); return 0;
      },
      serial: txt => {
        const s = $('#serial');
        const t = ((performance.now() - this.runStart) / 1000).toFixed(3);
        s.insertAdjacentHTML('beforeend', `<div><span class="ts">${t} s</span>${esc(txt)}</div>`);
        while (s.children.length > 200) s.firstChild.remove();
        s.scrollTop = s.scrollHeight;
      },
      state: running => { $('#run').disabled = running; $('#stop').disabled = !running; if (!running) this.toneState = null; },
    });
    $('#stop').disabled = true;
  }

  ledFor(pin) { const io = this.ioFor(pin); return io && io.kind === 'led' ? { io, led: this.bench.get(io.item) } : null; }

  onDigital(pin, level) {
    if (pin === 'LED_BUILTIN') {
      const on = level === 0;               // active-low RGB LED
      if (this.board.powered) this.board.setLed('rgb3', on ? 1 : 0, 0, 0);
      this.setPinLevel(`LED_BUILTIN (LED3_R): <span class="${level ? 'hi' : 'lo'}">${level ? 'HIGH · 3.3 V' : 'LOW · 0 V'}</span> → <span class="${on ? 'led-on' : 'led-off'}">LED ${on ? 'ON' : 'OFF'}</span>`);
      return;
    }
    if (pin === 'D5' && this.pir) this.pir.ledOn = !!(level && this.board.powered);
    { const us = this.ioFor('D8'); if (pin === 'D7' && level && us && us.kind === 'hcsr04' && this.wired(us) && this.board.powered) this.sonarBurst(); }
    const L = this.ledFor(pin);
    const on = !!(L && L.led && level && this.board.powered && this.wired(L.io));
    if (L && L.led) L.led.set(on);
    if (this.scope && (this.lesson.scopePin || 'D5') === pin) this.scope.set({ type: 'dc', level });
    this.setPinLevel(`${pin}: <span class="${level ? 'hi' : 'lo'}">${level ? 'HIGH · 3.3 V' : 'LOW · 0 V'}</span>${L ? ` → <span class="${on ? 'led-on' : 'led-off'}">LED ${on ? 'ON' : 'OFF'}</span>` : ''}`);
  }

  onPwm(pin, duty, raw) {
    const L = this.ledFor(pin);
    const on = !!(L && L.led && this.board.powered && this.wired(L.io));
    if (L && L.led) L.led.set(on && duty > 0, duty);
    if (this.scope && (this.lesson.scopePin || 'D5') === pin) this.scope.set({ type: 'pwm', freq: 500, duty });
    this.setPinLevel(`${pin}: PWM <span class="hi">${(duty * 100).toFixed(0)} %</span> (value ${raw}) · average ≈ ${(duty * VREF).toFixed(2)} V`);
  }

  onTone(pin, f, ms) {
    const io = this.ioFor(pin);
    const ok = io && this.wired(io) && this.board.powered;
    const tok = this.toneState = ok ? { pin, f, item: io.item } : null;
    if (ok) this.playTone(f, ms);
    if (this.scope && this.lesson.scopePin === pin) this.scope.set({ type: 'square', freq: f });
    this.setPinLevel(`${pin}: tone <span class="hi">${f} Hz</span> square wave${ms ? ` for ${ms} ms` : ''}`);
    if (ms) setTimeout(() => { if (this.toneState === tok) this.onNoTone(pin, true); }, ms);
  }
  onNoTone(pin, ended) {
    this.toneState = null; this.stopSound();
    const io = this.ioFor(pin); const bz = io && this.bench.get(io.item); if (bz && bz.vibrate) bz.vibrate(false);
    if (this.scope && this.lesson && this.lesson.scopePin === pin) this.scope.set({ type: 'dc', level: 0 });
    this.setPinLevel(`${pin}: <span class="lo">LOW · 0 V</span> (${ended ? 'note finished' : 'noTone()'})`);
  }

  applyManualPwm(v) {
    if ($('#pwm-v')) $('#pwm-v').textContent = v;
    if (!this.board.powered) return;
    this.onPwm('D5', v / 255, v);
  }

  setPinLevel(html) { $('#pinlevel').innerHTML = html; }

  async runProgram() {
    const L = this.lesson; if (!L || !L.program) return;
    await this.ensurePower();
    if (L.circuit) {
      const all = L.circuit.map(d => d.id).filter(id => this.stepState(L.steps.length - 1).have.includes(id));
      if (!this.bench.has(all)) { await this.bench.build(all, []); this.refreshPickTargets(); }
    }
    this.runStart = performance.now();
    $('#serial').innerHTML = '';
    const opts = { getDelay: () => this.blinkDelay, slow: !L.fast, warmupMs: 3000 };
    if (L.codes) {
      const key = this.matrixCodeKey || 'logo';
      if (key === 'logo') Object.assign(opts, { frame: LOGO_ARRAY, bits: 1 });
      else if (key === 'shades') Object.assign(opts, { frame: SHADES_ARRAY, bits: 3 });
      else Object.assign(opts, { live: true, bits: this.editorExport().bits, getFrame: () => this.editorExport().arr, getBits: () => this.editorExport().bits });
    }
    this.sim.run(L.program, opts);
  }

  // ------------------------------------------------------------------ UI bindings
  bindUI() {
    this.calloutOverlay = $('#callout-overlay');
    this.calloutBox = $('#callout-box');
    this.calloutLine = $('#callout-line');
    this.calloutLineGlow = $('#callout-line-glow');
    this.calloutPulse = $('#callout-dot-pulse');
    this.calloutOuter = $('#callout-dot-outer');
    this.calloutInner = $('#callout-dot-inner');
    const cClose = $('#callout-close');
    if (cClose) cClose.onclick = () => { this.hideCallout(); if (this.mode === 'lessons') { this.select(null, { card: false }); this.restoreStepView(); } };

    document.querySelectorAll('.modes button').forEach(b => b.onclick = () => this.setMode(b.dataset.mode));
    $('#v-home').onclick = () => { this.view('home'); this.select(null); };
    $('#v-top').onclick = () => this.view('top');
    $('#v-bottom').onclick = () => this.view('bottom');
    $('#v-rotate').onclick = e => { const c = this.viewer.controls; c.autoRotate = !c.autoRotate; e.currentTarget.classList.toggle('on', c.autoRotate); };
    $('#v-labels').onclick = e => { this.showLabels = !this.showLabels; e.currentTarget.classList.toggle('on', this.showLabels); };
    $('#run').onclick = () => this.runProgram();
    $('#stop').onclick = () => { this.sim.stop(); this.outputsOff(); };
    $('#speed').oninput = e => {
      const v = +e.target.value; this.blinkDelay = v; $('#speed-val').textContent = v + ' ms';
      if (this.lesson && this.lesson.program === 'blink') this.renderCode(blinkCode(this.lesson.code, v), this.lesson.explain);
    };
    window.addEventListener('keydown', e => {
      if (this.mode !== 'lessons' || !this.lesson || this.inQuiz) return;
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') this.goStep(this.stepIdx + 1);
      if (e.key === 'ArrowLeft') this.goStep(this.stepIdx - 1);
    });

    const tip = $('#tooltip');
    this.viewer.onHover = (hit, e) => {
      const id = hit ? hit.id : null;
      if (id !== this.hovered) {
        this.hovered = id;
        if (!this.pulseObjs) {
          const cur = this.lesson && this.lesson.steps[this.stepIdx];
          const base = this.selected && !this.selected.startsWith('pin:') ? this.groupsFor(this.selected) : (cur && cur.focus ? this.groupsFor(cur.focus) : []);
          const hov = id && !id.startsWith('pin:') && this.board.parts[id] ? [this.board.parts[id]] : [];
          this.setOutline([...new Set([...base, ...hov])]);
        }
        if (id && id.startsWith('pin:')) { this.hoverMarker.visible = true; this.hoverMarker.position.copy(this.board.pins[id.slice(4)].pos).add(new THREE.Vector3(0, 0.2, 0)); }
        else if (!this.selected || !this.selected.startsWith('pin:')) this.hoverMarker.visible = false;
      }
      if (!id || !e) { tip.style.display = 'none'; this.viewer.renderer.domElement.style.cursor = ''; return; }
      let name = '', sub = '';
      if (id.startsWith('pin:')) { const p = findPin(id.slice(4)); name = `${p.label}`; sub = `${p.header} pin ${p.pin} · ${p.mcu !== '—' ? p.mcu : p.fn[0]}`; }
      else if (PARTS[id]) { name = PARTS[id].name; sub = PARTS[id].ref; }
      else if (HW_INFO[id]) { name = HW_INFO[id].name; sub = HW_INFO[id].tag; }
      tip.innerHTML = `${name}<small>${sub || ''}</small>`;
      const r = $('#stage').getBoundingClientRect();
      tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.style.display = 'block';
      this.viewer.renderer.domElement.style.cursor = (id === 'pushbutton' || id === 'pot') && this.mode === 'lessons' ? 'grab' : 'pointer';
    };
    this.viewer.onPick = hit => {
      if (!hit) { if (this.mode === 'explore') this.select(null); return; }
      if (this.mode === 'lessons' && (hit.id === 'pushbutton' || hit.id === 'pot' || hit.id === 'obstacle')) return;
      this.lastHit = hit;
      this.select(hit.id, { fly: true });
    };
  }
}

// ------------------------------------------------------------------ tiny C++ highlighter
const KW = new Set(['void', 'int', 'const', 'float', 'uint8_t', 'uint16_t', 'uint32_t', 'bool', 'byte', 'char', 'for', 'while', 'if', 'else', 'return', 'static', 'unsigned', 'long', 'true', 'false', 'String']);
const CONST = new Set(['HIGH', 'LOW', 'OUTPUT', 'INPUT', 'INPUT_PULLUP', 'LED_BUILTIN', 'D2', 'D4', 'D5', 'D7', 'D8', 'D9', 'A0', 'LED3_R', 'LED3_G', 'LED3_B']);
function highlight(line) {
  if (/^\s*#include/.test(line)) return `<span class="tk-kw">${esc(line)}</span>`;
  const ci = line.indexOf('//');
  const code = ci >= 0 ? line.slice(0, ci) : line, com = ci >= 0 ? line.slice(ci) : '';
  let out = '';
  const re = /("[^"]*")|(\b\d+\b)|([A-Za-z_]\w*)(\s*\()?|(\s+)|(.)/g;
  let m;
  while ((m = re.exec(code))) {
    if (m[1]) out += `<span class="tk-str">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="tk-num">${m[2]}</span>`;
    else if (m[3]) {
      const w = m[3];
      if (KW.has(w)) out += `<span class="tk-kw">${w}</span>`;
      else if (CONST.has(w)) out += `<span class="tk-const">${w}</span>`;
      else if (m[4]) out += `<span class="tk-fn">${w}</span>`;
      else out += esc(w);
      if (m[4]) out += esc(m[4]);
    } else out += esc(m[5] || m[6] || '');
  }
  if (com) out += `<span class="tk-com">${esc(com)}</span>`;
  return out;
}

window.app = new App();

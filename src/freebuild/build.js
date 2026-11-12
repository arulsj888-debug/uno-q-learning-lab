// Free-build mode: place parts on the breadboard, wire them to the board's pins, give the pins a job, and see
// whether the circuit works, with the reason when it does not. The electrical model is in circuit.js.
import * as THREE from 'three';
import { evaluate, terminals, isHoleRef, isModRef, pinKind, PIN_MODES, LED_TYPES, fmtOhms, nameOf } from './circuit.js';
import { EXAMPLES } from './examples.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const RAILS = ['top+', 'top-', 'bot-', 'bot+'];
const OHMS = [10, 100, 220, 330, 470, 1000, 2200, 4700, 10000, 47000, 100000, 1000000];
const PREFIX = { diode: 'd', npn: 'q', lcd1602: 'lcd', oled: 'oled', neopixel: 'neo', joystick: 'joy', encoder: 'enc', dht: 'dht', rgbled: 'rgb', thermo: 'th', pixels: 'pix', qwiic: 'cab', l293d: 'u', motor: 'mot', relay: 'rel', battery: 'bat', lamp: 'lamp', sht31: 'sen', hcsr04: 'us', pir: 'pir', servo: 'sv', resistor: 'r', led: 'led', button: 'sw', pot: 'pot', buzzer: 'bz', ldr: 'ldr', tmp36: 'tmp', wire: 'w', fwire: 'w' };
const WIRE_COLORS = ['red', 'black', 'yellow', 'blue', 'green', 'orange', 'white'];
const WIRE_HEX = { red: '#d8261e', black: '#1b1b1b', yellow: '#f2c21b', blue: '#2369d6', green: '#23a046', orange: '#f07a16', white: '#eeeeee' };
const TERMS = { lcd1602: ['GND', 'VCC', 'SDA', 'SCL'], oled: ['GND', 'VCC', 'SCL', 'SDA'], neopixel: ['VCC', 'DIN', 'GND'], pir: ['VCC', 'OUT', 'GND'], relay: ['DCP', 'DCN', 'IN', 'NO', 'COM', 'NC'], battery: ['POS', 'NEG'], lamp: ['L1', 'L2'], motor: ['M1', 'M2'], thermo: ['QA', 'QB'], pixels: ['QA', 'QB'] };
const DESK_SLOT_PI = { lcd1602: [125, 17], oled: [125, 17], neopixel: [110, 42] };
const DESK_SLOT = { lcd1602: [20, 70], oled: [125, 70], neopixel: [70, 105], relay: [150, -20], battery: [150, 45], lamp: [205, 10], motor: [205, 78], thermo: [60, 118], pixels: [125, 118] };
const MOVABLE = new Set(['resistor', 'led', 'diode', 'npn', 'rgbled', 'dht', 'joystick', 'encoder', 'buzzer', 'ldr', 'tmp36', 'hcsr04', 'servo', 'sht31', 'l293d']);
const LUX = { dark: 0.01, dim: 10, room: 300, torch: 2000 };

export class FreeBuild {
  constructor(app, { isPi, boardKind, pinInfo }) {
    this.app = app; this.isPi = isPi; this.boardKind = boardKind || (isPi ? 'pi4' : 'unoq'); this.isU3 = this.boardKind === 'uno3'; this.isE32 = this.boardKind === 'esp32'; this.fw = !!isPi || this.isE32; this.pinInfo = pinInfo;
    this.active = false;
    this.parts = []; this.pinCfg = {}; this.burnt = new Set(); this.damaged = new Set(); this.burnWhy = {};
    this.env = { disp1: 'Hello, world!', disp2: 'Free build', joy: {}, enc: {}, lux: 300, tempC: 25, pressed: {}, pot: {}, motion: false, dist: 40, hum: 45 }; this.pi = { sd: true, touched: false, hdmi: false, kbd: false, mouse: false, cam: 'none', flip: false }; this.piWarn = ''; this.servoNow = {}; this.modPts = []; this.relayOn = {}; this.motorTarget = {};
    this.seq = {}; this.undoStack = []; this.tool = null; this.selected = null; this.probe = null; this.probeOn = false;
    this.opts = { dht: 'dht11', rgbCA: false, ohms: 220, color: 'red', wire: 'auto', flip: false };
    this.result = null; this.tripMsg = null; this.lastRun = 0; this.lastHtml = {}; this.soundHz = 0;
    this.key = 'fb:' + this.boardKind;
    this.t0 = performance.now();
  }

  // ------------------------------------------------------------------ life cycle
  buildPickPoints() {
    const { bb, board } = this.app; this.pts = [];
    for (const r of ROWS) for (let c = 1; c <= 30; c++) this.pts.push({ ref: r + c, pos: bb.hole(r, c), kind: 'hole', row: r, col: c });
    for (const n of RAILS) for (let c = 1; c <= 30; c++) if (c % 6) this.pts.push({ ref: `r:${n}:${c}`, pos: bb.rail(n, c), kind: 'rail', rail: n, col: c });
    for (const id of Object.keys(board.pins)) if (this.pinInfo(id) && pinKind(this.boardKind, id, this.pinInfo(id)).k !== 'nc') this.pts.push({ ref: id, pos: board.pins[id].pos.clone(), kind: 'pin' });
    if (!this.isPi && board.qwiic) this.pts.push({ ref: 'QWIIC', pos: board.qwiic.pos.clone(), kind: 'qwiic' });
    this.modPts = [];
    this.byRef = new Map(this.pts.map(p => [p.ref, p]));
  }
  setup() {
    if (this.ready) return; this.ready = true;
    const app = this.app, scene = app.viewer.scene;
    this.buildPickPoints();
    const ring = new THREE.RingGeometry(0.75, 1.15, 24); ring.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false, toneMapped: false, side: THREE.DoubleSide });
    this.cand = new THREE.InstancedMesh(ring, mat, 420); this.cand.count = 0; this.cand.renderOrder = 12; this.cand.raycast = () => {}; this.cand.frustumCulled = false; scene.add(this.cand);
    this.cand.setColorAt(0, new THREE.Color(1, 1, 1));
    this.hover = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: 0x35d0ff, transparent: true, depthTest: false, toneMapped: false, side: THREE.DoubleSide })); this.hover.scale.setScalar(1.5); this.hover.renderOrder = 13; this.hover.visible = false; this.hover.raycast = () => {}; scene.add(this.hover);
    const stage = $('#stage');
    // ---- drag and drop: parts from the left column onto the breadboard
    $('#side').addEventListener('dragstart', e => { const b = e.target.closest('[data-tool]'); if (!this.active || !b) return; this.dragType = b.dataset.tool; e.dataTransfer.setData('text/plain', this.dragType); e.dataTransfer.effectAllowed = 'copy'; });
    $('#side').addEventListener('dragend', () => { this.dragType = null; this.hover.visible = false; });
    stage.addEventListener('dragover', e => {
      if (!this.active || !this.dragType) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy';
      if (DESK_SLOT[this.dragType] || this.dragType === 'pir') { this.hover.visible = false; return; }
      const q = this.nearest(e, 14); if (!q || q.kind !== 'hole') { this.hover.visible = false; return; }
      this.hover.position.set(q.pos.x, q.pos.y + 0.45, q.pos.z); this.hover.visible = true; this.hover.material.color.set(this.autoPlace(this.dragType, q.ref) ? 0x46d37e : 0xff6b5b);
      $('#legend').textContent = this.pointName(q);
    });
    stage.addEventListener('drop', e => { if (!this.active || !this.dragType) return; e.preventDefault(); const t = this.dragType; this.dragType = null; this.hover.visible = false; this.dropPart(t, e); });
    // ---- drag a wire from a board pin / module terminal (or from anywhere with the wire tool) to its other end
    stage.addEventListener('pointerdown', e => {
      if (!this.active || e.button !== 0) return;
      const T = this.tool; if (T && (T.type !== 'wire' || T.step === 1)) return;
      const q = this.nearest(e, 9); if (!q || q.kind === 'qwiic' || (!T && !['pin', 'modpin', 'term'].includes(q.kind))) return;
      e.stopImmediatePropagation(); e.preventDefault(); app.viewer.controls.enabled = false;
      const x0 = e.clientX, y0 = e.clientY; let dragging = false;
      const geo = new THREE.BufferGeometry().setFromPoints([q.pos, q.pos]), line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffd34d, depthTest: false, toneMapped: false })); line.renderOrder = 14; line.frustumCulled = false; line.raycast = () => {}; scene.add(line);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(q.pos.y + 6)), pt = new THREE.Vector3();
      const mv = ev => {
        if (!dragging && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) dragging = true;
        if (!dragging) return;
        const v = app.viewer; v.setPointer(ev); v.raycaster.setFromCamera(v.pointer, v.camera);
        const n = this.nearest(ev, 14), end = n ? n.pos.clone().add(new THREE.Vector3(0, 1, 0)) : (v.raycaster.ray.intersectPlane(plane, pt) ? pt.clone() : q.pos.clone());
        geo.setFromPoints([q.pos.clone().add(new THREE.Vector3(0, 1, 0)), end]);
        if (n) { this.hover.position.set(n.pos.x, n.pos.y + 0.45, n.pos.z); this.hover.visible = true; this.hover.material.color.set(this.wireOk(q, n) && n.ref !== q.ref ? 0x46d37e : 0xff6b5b); } else this.hover.visible = false;
      };
      const up = ev => {
        window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); scene.remove(line); geo.dispose(); this.hover.visible = false; app.viewer.controls.enabled = true;
        if (!dragging) { if (T) this.click(q.ref); return; }
        const n = this.nearest(ev, 14); if (!n || n.ref === q.ref) return;
        const saved = this.tool; this.tool = { type: 'wire', step: 1, first: q.ref }; this.occ = this.occupied(); this.click(n.ref); if (!saved) this.cancel();
      };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    }, true);
    // press the push button / turn the knob directly in the 3D view
    stage.addEventListener('pointerdown', e => {
      if (!this.active || e.button !== 0 || this.tool) return;
      const hit = this.partAt(e); if (!hit) return;
      const d = this.parts.find(p => p.id === hit);
      if (d && d.type === 'button') {
        e.stopPropagation(); app.viewer.controls.enabled = false; this.env.pressed[d.id] = true; this.dirty = true;
        const up = () => { this.env.pressed[d.id] = false; this.dirty = true; app.viewer.controls.enabled = true; window.removeEventListener('pointerup', up); };
        window.addEventListener('pointerup', up);
      } else if (d && MOVABLE.has(d.type)) {
        e.stopPropagation(); app.viewer.controls.enabled = false; const x0 = e.clientX, y0 = e.clientY; let dragging = false;
        const mv = ev => {
          if (!dragging && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) dragging = true;
          if (!dragging) return; const n = this.nearest(ev, 14);
          if (n && n.kind === 'hole') { this.hover.position.set(n.pos.x, n.pos.y + 0.45, n.pos.z); this.hover.visible = true; this.hover.material.color.set(this.autoPlace(d.type, n.ref, d) ? 0x46d37e : 0xff6b5b); } else this.hover.visible = false;
        };
        const up = ev => {
          window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); app.viewer.controls.enabled = true; this.hover.visible = false;
          if (!dragging) { this.select(d.id); return; }
          const n = this.nearest(ev, 14); if (!n || n.kind !== 'hole') return;
          const nd = this.autoPlace(d.type, n.ref, d); if (!nd) return this.toast('The part does not fit there.');
          this.mutate(() => { Object.assign(nd, { id: d.id }); this.parts = this.parts.map(p => (p.id === d.id ? nd : p)); this.rebuild3D(); }); this.select(d.id);
        };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      } else if (d && d.type === 'pot') {
        e.stopPropagation(); app.viewer.controls.enabled = false; const x0 = e.clientX, f0 = this.env.pot[d.id] ?? 0.5;
        const mv = ev => { this.env.pot[d.id] = Math.min(1, Math.max(0, f0 + (ev.clientX - x0) / 200)); this.dirty = true; this.syncControls(); };
        const up = () => { app.viewer.controls.enabled = true; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      }
    }, true);
    window.addEventListener('keydown', e => {
      if (!this.active || /INPUT|SELECT|TEXTAREA/.test((e.target.tagName || ''))) return;
      if (e.key === 'Escape') { this.cancel(); this.select(null); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selected) this.removePart(this.selected);
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); this.undo(); }
    });
    const bind = (el, fn) => el.addEventListener('click', e => { if (this.active) fn(e); });
    bind($('#side'), e => this.sideClick(e)); bind($('#panel'), e => this.panelClick(e));
    $('#side').addEventListener('change', e => { if (this.active) this.sideChange(e); });
    $('#panel').addEventListener('pointerdown', e => { if (this.active && e.target.dataset && e.target.dataset.hold) { const id = e.target.dataset.hold; this.env.pressed[id] = true; this.dirty = true; const up = () => { this.env.pressed[id] = false; this.dirty = true; window.removeEventListener('pointerup', up); }; window.addEventListener('pointerup', up); } });
    $('#panel').addEventListener('pointerdown', e => { if (this.active && e.target.dataset && e.target.dataset.motion !== undefined) { this.env.motion = true; this.dirty = true; const up = () => { this.env.motion = false; this.dirty = true; window.removeEventListener('pointerup', up); }; window.addEventListener('pointerup', up); } });
    $('#panel').addEventListener('change', e => { if (this.active) this.panelChange(e); });
    $('#panel').addEventListener('input', e => { if (this.active) this.panelInput(e); });
  }

  activate() {
    const app = this.app; this.setup(); this.active = true;
    if (!app._legend0) app._legend0 = $('#legend').textContent;
    app.sim.stop(); app.stopSound(); app.lamp.intensity = 0; app.hideSonar(); app.showRoom(false); app.showMotor(false); app.showRelay(false); app.showPhone(false);
    app.lesson = null; app.hideAcc(); app.board.setMatrix(null); app.outputsOff();
    app.bench.clear(); app.bench.setDefs([]); app.bb.group.visible = true; app.strips.visible = false;
    app.setOutline([]); app.refreshPickTargets();
    this.load();
    this.rebuild3D(); this.applyPi();
    app.view(this.isPi ? 'pibench' : 'bench');
    this.renderSide(); this.renderPanel(); this.setHint();
  }
  /** Raspberry Pi accessories: show them as chosen */
  applyPi(animate = false) {
    if (!this.isPi || !this.app.acc) return;
    const a = this.app.acc, p = this.pi, set = (o, on) => { o.on = on; o.set(on); };
    set(a.sd, p.sd); set(a.hdmi, p.hdmi); set(a.monitor, p.hdmi); set(a.kbd, p.kbd); set(a.mouse, p.mouse);
    set(a.cam, p.cam !== 'none'); a.camlink.on = p.cam === 'plugged'; a.cam.setFlip(p.flip);
    if (animate && p.cam === 'plugged') a.camlink.connect(true); else a.camlink.set(p.cam === 'plugged');
    this.app.refreshPickTargets();
  }
  /** what the Raspberry Pi does with this setup: [{lvl, text}] */
  piNotes(powered) {
    const p = this.pi, out = [], n = (lvl, text) => out.push({ lvl, text });
    if (!powered || !p.touched) return out;   // the setup notes only appear once you start changing the setup
    if (!p.sd) n('bad', 'No microSD card: the Raspberry Pi has no operating system to start from, so the screen stays black. Insert a card with Raspberry Pi OS (the slot is on the underside, label facing away from the board).');
    else n('ok', 'The microSD card holds Raspberry Pi OS: the Raspberry Pi starts.');
    if (p.sd) {
      if (!p.hdmi) n('info', 'No monitor connected: the Raspberry Pi still starts (“headless”), but you cannot see anything. Connect a micro-HDMI cable to HDMI0 and a monitor.');
      else n('ok', 'Monitor on HDMI0: the desktop is shown.');
      if (p.hdmi && !p.kbd && !p.mouse) n('info', 'No keyboard and no mouse: you can see the desktop but cannot control it.');
      else if (p.hdmi && !p.kbd) n('info', 'No keyboard: you cannot type commands.');
      else if (p.hdmi && !p.mouse) n('info', 'No mouse: you can only use the keyboard.');
    }
    if (p.cam === 'desk') n('info', 'The camera is not connected to the CAMERA connector yet.');
    if (p.cam === 'plugged') {
      if (p.flip) n('bad', 'The camera cable is the wrong way round: the metal contacts must face away from the connector’s flap (blue side toward the Ethernet/USB ports). The Raspberry Pi does not detect the camera.');
      else if (p.sd) n('ok', 'Camera Module 3 detected on CAMERA (J3): rpicam-hello and rpicam-still would work.');
      else n('info', 'The camera is connected correctly, but without a microSD card there is no software to use it.');
    }
    if (this.piWarn) n('warn', this.piWarn);
    return out;
  }
  deactivate() {
    if (!this.active) return; this.active = false;
    const app = this.app; this.cancel(); app.stopSound(); this.soundHz = 0;
    this.clearProbe(); this.hover.visible = false; this.cand.count = 0;
    app.bench.clear(); app.bb.group.visible = false; app.setOutline([]); if (this.isPi) app.hideAcc(); app.refreshPickTargets();
    $('#legend').textContent = app._legend0 || $('#legend').textContent;
  }

  // ------------------------------------------------------------------ saving, undo
  snap() { return JSON.stringify({ parts: this.parts, pinCfg: this.pinCfg, burnt: [...this.burnt], damaged: [...this.damaged], seq: this.seq, burnWhy: this.burnWhy, pi: this.pi }); }
  restore(s) { const o = JSON.parse(s); this.parts = o.parts; this.pinCfg = o.pinCfg; this.burnt = new Set(o.burnt); this.damaged = new Set(o.damaged); this.seq = o.seq || {}; this.burnWhy = o.burnWhy || {}; if (o.pi) { this.pi = o.pi; if (!this.pi.touched) this.pi.sd = true; } }
  save() { try { localStorage.setItem(this.key, this.snap()); } catch (e) { /* private mode */ } }
  load() { try { const s = localStorage.getItem(this.key); if (s) this.restore(s); } catch (e) { /* ignore */ } this.undoStack = []; }
  commit() { this.undoStack.push(this.pre); if (this.undoStack.length > 60) this.undoStack.shift(); this.save(); this.dirty = true; this.renderPanel(); }
  mutate(fn) { this.pre = this.snap(); fn(); this.commit(); }
  undo() { const s = this.undoStack.pop(); if (!s) return; this.restore(s); this.save(); this.selected = null; this.rebuild3D(); this.dirty = true; this.renderPanel(); }

  rebuild3D() {
    const b = this.app.bench; b.clear();
    for (const d of this.parts.filter(p => p.type !== 'wire' && p.type !== 'fwire' && p.type !== 'lead' && p.type !== 'qwiic')) this.place3D(d);
    this.refreshModPts();
    for (const d of this.parts.filter(p => p.type === 'wire' || p.type === 'fwire' || p.type === 'lead' || p.type === 'qwiic')) this.place3D(d);
    this.app.refreshPickTargets();
  }
  place3D(d) {
    if (d.type === 'pir' && d.x === undefined) { const bb = this.app.bb.center, used = this.parts.filter(p => p.type === 'pir' && p !== d && p.slot !== undefined).map(p => p.slot), k = [0, 1].find(i => !used.includes(i)) ?? 0; d.slot = k; d.x = bb.x + 92; d.z = bb.z - 30 - k * 52; }
    if (DESK_SLOT[d.type] && d.x === undefined) { const bb = this.app.bb.center; const sl = (this.isPi && DESK_SLOT_PI[d.type]) || DESK_SLOT[d.type]; d.x = bb.x + sl[0]; d.z = bb.z + sl[1]; }
    if (d.type === 'servo' && d.bx === undefined) { const bb = this.app.bb.center; d.bx = bb.x + 80; d.bz = bb.z + 6; }
    const obj = this.app.bench.place(d);
    if (d.type === 'led' && this.burnt.has(d.id) && obj.setBurnt) obj.setBurnt(true);
    if (d.type === 'pot' && obj.set) obj.set(this.env.pot[d.id] ?? 0.5);
    if (TERMS[d.type] && this.byRef) this.refreshModPts();
  }

  // ------------------------------------------------------------------ occupied holes
  occupied() {
    const m = new Map();
    for (const d of this.parts) for (const [, ref] of terminals(d)) m.set(ref, d.id);
    return m;
  }

  // ------------------------------------------------------------------ placing parts
  begin(type) {
    if (type === 'pir') { this.cancel(); this.placePir(); return; }
    if (DESK_SLOT[type]) { this.cancel(); this.placeDesk(type); return; }
    this.cancel(); this.probeOn = false; this.tool = { type, step: 0, first: null };
    this.updateCandidates(); this.setHint(); this.renderSide();
  }
  /** the part definition that results from putting the part's first leg in hole `ref` (second leg chosen automatically); `old` keeps value/colour when a part is moved */
  autoPlace(type, ref, old) {
    const keep = this.parts; if (old) this.parts = this.parts.filter(p => p.id !== old.id);
    this.occ = this.occupied(); let def = null;
    try {
      const fp = this.footprint(type, ref);
      if (fp) { if (fp.refs.every(r => this.free(r))) { def = { ...fp.def }; if (type === 'tmp36' && old) def.flip = old.flip; } }
      else if (this.firstOk(type, ref)) {
        const cands = this.second(type, ref), p = this.byRef.get(ref);
        const pref = { diode: [4, -4, 5, -5, 3, -3], resistor: [4, -4, 5, -5, 3, -3], led: [1, -1], ldr: [1, -1], buzzer: [3, -3] }[type] || [];
        let b = null; for (const dc of pref) { const r = p.row + (p.col + dc); if (cands.includes(r)) { b = r; break; } }
        if (!b && (type === 'resistor' || type === 'diode') && cands.length) b = cands[0];
        if (b) {
          if (type === 'resistor') def = { type, a: ref, b, ohms: old ? old.ohms : this.opts.ohms };
          else if (type === 'led') { const c = old ? old.color : this.opts.color; def = { type, anode: ref, cathode: b, color: c, hex: LED_TYPES[c].hex }; }
          else if (type === 'diode') def = { type, a: ref, k: b };
          else if (type === 'ldr') def = { type, a: ref, b };
          else if (type === 'buzzer') def = { type, plus: ref, minus: b };
        }
      }
    } finally { this.parts = keep; this.occ = this.occupied(); }
    return def;
  }
  dropPart(type, e) {
    if (type === 'pir' || DESK_SLOT[type]) { this.begin(type); return; }
    if (type === 'wire' || type === 'qwiic') return;
    const q = this.nearest(e, 14); if (!q || q.kind !== 'hole') return this.toast('Drop the part onto a breadboard hole.');
    const def = this.autoPlace(type, q.ref); if (!def) return this.toast('The part does not fit there (a hole is used, or it reaches the edge). Try another hole.');
    def.id = this.nextId(type); this.mutate(() => this.add(def));
  }
  placePir() {
    const n = this.parts.filter(p => p.type === 'pir').length;
    if (n >= 2) return this.toast('There is room for two PIR sensors on the desk.');
    const bb = this.app.bb.center, k = [0, 1].find(i => !this.parts.some(p => p.type === 'pir' && p.slot === i));
    const def = { id: this.nextId('pir'), type: 'pir', slot: k, x: bb.x + 92, z: bb.z - 30 - k * 52 };
    this.mutate(() => this.add(def)); this.toast('PIR sensor placed on the desk, right of the breadboard. Its pins VCC, OUT and GND take jumper wires.');
    this.app.view(this.isPi ? 'bigpi' : 'bigq');
  }
  placeDesk(type) {
    if (this.parts.some(p => p.type === type)) return this.toast('There is only one of these on the desk. Delete it first to place another.');
    const bb = this.app.bb.center, [x, z] = (this.isPi && DESK_SLOT_PI[type]) || DESK_SLOT[type];
    this.mutate(() => this.add({ id: this.nextId(type), type, x: bb.x + x, z: bb.z + z }));
    this.toast('Placed on the desk to the right. Its screw terminals take wires: click a terminal, then the other end.');
    this.app.view(this.isPi ? 'farpi' : (type === 'thermo' || type === 'pixels') ? 'qwq' : 'farq');
  }
  refreshModPts() {
    for (const m of this.modPts) this.byRef.delete(m.ref);
    this.modPts = [];
    for (const d of this.parts) if (TERMS[d.type]) {
      const it = this.app.bench.items[d.id]; if (!it) continue; it.group.updateMatrixWorld(true);
      for (const name of TERMS[d.type]) { const q = { ref: `${d.id}.${name}`, pos: it.obj.pin(name).pos.clone(), kind: (d.type === 'pir' || d.type === 'lcd1602' || d.type === 'oled') ? 'modpin' : (d.type === 'thermo' || d.type === 'pixels') ? 'qwiic' : 'term', label: name }; this.modPts.push(q); this.byRef.set(q.ref, q); }
    }
  }
  cancel() { this.tool = null; this.cand && (this.cand.count = 0); this.hover && (this.hover.visible = false); this.setHint(); this.renderSide && this.renderSide(); }
  free(ref) { return !this.occ.has(ref); }
  partOptions(type) { return { ohms: this.opts.ohms, color: this.opts.color, flip: this.opts.flip }; }
  /** refs a single-click part would use when its first hole is `ref`, or null if impossible */
  footprint(type, ref) {
    const p = this.byRef.get(ref); if (!p || p.kind !== 'hole') return null;
    const { row, col } = p, at = (r, c) => `${r}${c}`;
    if (type === 'button') { if (col > 28) return null; return { def: { type, col }, refs: [at('e', col), at('e', col + 2), at('f', col), at('f', col + 2)] }; }
    if (type === 'pot') { if (col > 26) return null; return { def: { type, row, col }, refs: [at(row, col), at(row, col + 2), at(row, col + 4)] }; }
    if (type === 'l293d') { if (col > 23) return null; const refs = []; for (let i = 0; i < 8; i++) refs.push(at('e', col + i), at('f', col + i)); return { def: { type, col }, refs }; }
    if (type === 'sht31') { if (col > 24 || row < 'f') return null; return { def: { type, row, col }, refs: [0, 1, 2, 3, 4, 5, 6].map(i => at(row, col + i)) }; }
    if (type === 'hcsr04') { if (col > 27) return null; return { def: { type, row, col }, refs: [at(row, col), at(row, col + 1), at(row, col + 2), at(row, col + 3)] }; }
    if (type === 'joystick' || type === 'encoder') { if (col > 26 || row < 'f') return null; return { def: { type, row, col }, refs: [0, 1, 2, 3, 4].map(i => at(row, col + i)) }; }
    if (type === 'dht') { if (col > 27) return null; return { def: { type, row, col, model: this.opts.dht }, refs: [at(row, col), at(row, col + 1), at(row, col + 2), at(row, col + 3)] }; }
    if (type === 'rgbled') { if (col > 27) return null; return { def: { type, row, col, ca: this.opts.rgbCA }, refs: [at(row, col), at(row, col + 1), at(row, col + 2), at(row, col + 3)] }; }
    if (type === 'servo') { if (col > 28) return null; return { def: { type, row, col }, refs: [at(row, col), at(row, col + 1), at(row, col + 2)] }; }
    if (type === 'npn') { if (col > 28) return null; return { def: { type, row, col, flip: this.opts.flip }, refs: [at(row, col), at(row, col + 1), at(row, col + 2)] }; }
    if (type === 'tmp36') { if (col > 28) return null; return { def: { type, row, col, flip: this.opts.flip }, refs: [at(row, col), at(row, col + 1), at(row, col + 2)] }; }
    return null;
  }
  second(type, first) {
    const f = this.byRef.get(first); if (!f) return [];
    const out = [];
    for (const p of this.pts) {
      if (p.ref === first || !this.free(p.ref)) continue;
      if (type === 'qwiic') { if (p.kind === 'qwiic' && p.ref.split('.')[0] !== first.split('.')[0]) out.push(p.ref); continue; }
      if (type === 'wire') { if (!this.wireOk(f, p)) continue; out.push(p.ref); continue; }
      if (p.kind !== 'hole') continue;
      const dx = Math.abs(p.pos.x - f.pos.x), dz = Math.abs(p.pos.z - f.pos.z), dist = Math.hypot(dx, dz);
      if (type === 'resistor' || type === 'diode') { if (dist >= 7.4 && dist <= 26) out.push(p.ref); }
      else if (type === 'led' || type === 'ldr') { if (p.row === f.row && Math.abs(p.col - f.col) === 1) out.push(p.ref); }
      else if (type === 'buzzer') { if (p.row === f.row && Math.abs(p.col - f.col) === 3) out.push(p.ref); }
    }
    return out;
  }
  /** which wire fits between two endpoints (both ends must be able to plug into each other) */
  wireOk(a, b) {
    const k = [a.kind, b.kind].sort().join('+');
    if (a.kind === 'qwiic' || b.kind === 'qwiic') return false;          // Qwiic sockets only take Qwiic cables
    if (k === 'pin+pin') return false;                                   // a board pin cannot be wired straight to a board pin
    if (a.kind === 'term' || b.kind === 'term') { const o = a.kind === 'term' ? b : a; if (o.kind === 'modpin') return false; if (o.kind === 'pin') return !this.fw; return true; }   // bare wire ends go under a screw, into a breadboard hole or into the UNO Q's sockets
    if (a.kind === 'modpin' && b.kind === 'modpin') return false;         // two male header pins need a female-female wire
    if (k === 'modpin+pin') return !this.fw;                            // UNO Q has sockets; the Pi has male pins like the module
    return true;
  }
  firstOk(type, ref) {
    const p = this.byRef.get(ref); if (!p || !this.free(ref)) return false;
    if (type === 'wire') return p.kind !== 'qwiic';
    if (type === 'qwiic') return p.kind === 'qwiic';
    return p.kind === 'hole';
  }
  updateCandidates() {
    const T = this.tool; if (!T) { this.cand.count = 0; return; }
    this.occ = this.occupied();
    let refs = [], bad = [];
    if (T.step === 1 && T.type !== 'wire') refs = this.second(T.type, T.first);
    this.setMarks(refs, bad);
  }
  setMarks(good, bad) {
    const m = new THREE.Matrix4(), col = new THREE.Color(), list = [...good.map(r => [r, 0x46d37e]), ...bad.map(r => [r, 0xff6b5b])].slice(0, 420);
    list.forEach(([ref, c], i) => { const p = this.byRef.get(ref); m.makeTranslation(p.pos.x, p.pos.y + 0.35, p.pos.z); this.cand.setMatrixAt(i, m); this.cand.setColorAt(i, col.set(c)); });
    this.cand.count = list.length; this.cand.instanceMatrix.needsUpdate = true; if (this.cand.instanceColor) this.cand.instanceColor.needsUpdate = true;
  }
  click(ref) {
    const T = this.tool; if (!T) return; this.occ = this.occupied();
    if (['button', 'pot', 'tmp36', 'hcsr04', 'servo', 'sht31', 'l293d', 'rgbled', 'dht', 'joystick', 'encoder', 'npn'].includes(T.type)) {
      const fp = this.footprint(T.type, ref);
      if (!fp) return this.toast('That part does not fit there (it needs more holes to the right).');
      if (fp.refs.some(r => !this.free(r))) return this.toast('One of the holes is already used.');
      this.mutate(() => this.add({ ...fp.def, id: this.nextId(T.type) }));
      this.cancel(); this.toast(`Placed. Choose the part again to place another.`); return;
    }
    if (T.step === 0) {
      if (!this.firstOk(T.type, ref)) return this.toast(this.free(ref) ? 'Click a breadboard hole for the first leg.' : 'That hole or pin is already used.');
      const cands = this.second(T.type, ref); if (!cands.length) return this.toast(T.type === 'wire' ? 'A wire needs a second free end.' : 'The second leg has no free hole within reach there.');
      T.first = ref; T.step = 1; this.updateCandidates(); this.setHint(); return;
    }
    if (!this.second(T.type, T.first).includes(ref)) return this.toast(T.type === 'led' ? 'The LED has only 2.54 mm between its legs: click a green hole next to the first one.' : 'Click one of the green holes.');
    const a = T.first; let def;
    if (T.type === 'resistor') def = { type: 'resistor', a, b: ref, ohms: this.opts.ohms };
    else if (T.type === 'led') def = { type: 'led', anode: a, cathode: ref, color: this.opts.color, hex: LED_TYPES[this.opts.color].hex };
    else if (T.type === 'diode') def = { type: 'diode', a, k: ref };
    else if (T.type === 'ldr') def = { type: 'ldr', a, b: ref };
    else if (T.type === 'buzzer') def = { type: 'buzzer', plus: a, minus: ref };
    else if (T.type === 'wire') def = this.wireDef(a, ref);
    else if (T.type === 'qwiic') def = { type: 'qwiic', from: a, to: ref, lift: 4 };
    def.id = this.nextId(def.type);
    this.mutate(() => this.add(def));
    this.tool = { type: T.type, step: 0, first: null }; this.updateCandidates(); this.setHint();
  }
  wireDef(a, b) {
    const pa = this.byRef.get(a), pb = this.byRef.get(b);
    let from = a, to = b; if (pb.kind === 'pin' || pb.kind === 'modpin' && pa.kind !== 'pin') { from = b; to = a; }
    if (pa.kind === 'modpin' && pb.kind === 'pin') { from = a; to = b; }
    const term = pa.kind === 'term' ? a : pb.kind === 'term' ? b : null;
    if (term) {
      from = term; to = term === a ? b : a;
      const nm = term.split('.')[1], pinK = [pa, pb].find(x => x.kind === 'pin'), pk = pinK ? pinKind(this.boardKind, pinK.ref, this.pinInfo(pinK.ref)).k : null;
      const color = this.opts.wire !== 'auto' ? this.opts.wire : (nm === 'DCP' || nm === 'POS' || pk === '5v') ? 'red' : (nm === 'DCN' || nm === 'NEG' || pk === 'gnd') ? 'black' : nm === 'IN' ? 'yellow' : 'orange';
      return { type: 'lead', from, to, color, lift: 14 };
    }
    const pin = pa.kind === 'pin' ? a : pb.kind === 'pin' ? b : null, mod = pa.kind === 'modpin' || pb.kind === 'modpin';
    let color = this.opts.wire;
    if (color === 'auto') { const k = pin ? pinKind(this.boardKind, pin, this.pinInfo(pin)).k : null; color = k === 'gnd' ? 'black' : k === '5v' ? 'red' : k === '3v3' ? 'orange' : 'yellow'; }
    const dist = pa.pos.distanceTo(pb.pos);
    const type = mod || (pin && this.fw) ? 'fwire' : 'wire';
    return { type, from, to, color, lift: Math.min(46, 14 + dist * 0.22 + (pin ? 8 : 0)) };
  }
  nextId(type) { const p = PREFIX[type]; this.seq[p] = (this.seq[p] || 0) + 1; return p + this.seq[p]; }
  add(d) { this.parts.push(d); this.place3D(d); this.app.refreshPickTargets(); this.occ = this.occupied(); }
  removePart(id) {
    this.mutate(() => { const gone = this.parts.find(p => p.id === id); this.parts = this.parts.filter(p => p.id !== id && !(gone && TERMS[gone.type] && ((p.from || '').startsWith(id + '.') || (p.to || '').startsWith(id + '.')))); this.burnt.delete(id); delete this.burnWhy[id]; delete this.env.pressed[id]; this.rebuild3D(); });
    if (this.selected === id) this.select(null); this.app.refreshPickTargets();
  }
  select(id) { this.selected = id; const it = id && this.app.bench.items[id]; this.app.setOutline(it ? [it.group] : []); this.renderPanel(); }

  // ------------------------------------------------------------------ picking
  nearest(e, maxPx = 11) {
    const v = this.app.viewer, rect = v.renderer.domElement.getBoundingClientRect(), cam = v.camera, p = new THREE.Vector3();
    let best = null, bd = maxPx;
    const T = this.tool;
    for (const q of [...this.pts, ...this.modPts]) {
      p.copy(q.pos).project(cam); if (p.z > 1) continue;
      const d = Math.hypot((p.x * 0.5 + 0.5) * rect.width + rect.left - e.clientX, (-p.y * 0.5 + 0.5) * rect.height + rect.top - e.clientY) - (q.kind === 'pin' || q.kind === 'modpin' ? 3 : 0);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }
  partAt(e) {
    const v = this.app.viewer; v.setPointer(e); v.raycaster.setFromCamera(v.pointer, v.camera);
    const groups = Object.values(this.app.bench.items).map(i => i.group);
    const hits = v.raycaster.intersectObjects(groups, true);
    for (const h of hits) { let o = h.object; while (o) { const it = Object.entries(this.app.bench.items).find(([, i]) => i.group === o); if (it) return it[0]; o = o.parent; } }
    return null;
  }
  onHover(hit, e) {
    if (!this.active || !e) { this.hover && (this.hover.visible = false); return; }
    const T = this.tool, q = this.nearest(e);
    $('#stage').style.cursor = T ? 'crosshair' : (this.partAt(e) ? 'pointer' : '');
    if (!q || (!T && !this.probeOn)) { this.hover.visible = false; if (T) this.previewFoot(null); return; }
    this.hover.position.set(q.pos.x, q.pos.y + 0.45, q.pos.z); this.hover.visible = true;
    this.hover.material.color.set(T ? (this.hoverOk(q.ref) ? 0x46d37e : 0xff6b5b) : 0x35d0ff);
    if (T) this.previewFoot(q.ref);
    $('#legend').textContent = this.pointName(q);
  }
  hoverOk(ref) {
    const T = this.tool; this.occ = this.occupied();
    if (['button', 'pot', 'tmp36', 'hcsr04', 'servo', 'sht31', 'l293d', 'rgbled', 'dht', 'joystick', 'encoder', 'npn'].includes(T.type)) { const fp = this.footprint(T.type, ref); return !!fp && fp.refs.every(r => this.free(r)); }
    if (T.step === 0) return this.firstOk(T.type, ref) && this.second(T.type, ref).length > 0;
    return this.second(T.type, T.first).includes(ref);
  }
  previewFoot(ref) {
    const T = this.tool; if (!T) return;
    if (['button', 'pot', 'tmp36', 'hcsr04', 'servo', 'sht31', 'l293d', 'rgbled', 'dht', 'joystick', 'encoder', 'npn'].includes(T.type)) { const fp = ref && this.footprint(T.type, ref); this.occ = this.occupied(); if (fp) this.setMarks(fp.refs.filter(r => this.free(r)), fp.refs.filter(r => !this.free(r))); else this.cand.count = 0; }
  }
  pointName(q) {
    if (q.kind === 'hole') return `Hole ${q.ref} (column ${q.col}, row ${q.row})`;
    if (q.kind === 'rail') return `Power rail ${q.rail.replace('top', 'top ').replace('bot', 'bottom ')} (the whole rail is connected)`;
    if (q.kind === 'modpin') return `Module pin ${q.ref.toUpperCase()}`;
    const k = pinKind(this.boardKind, q.ref, this.pinInfo(q.ref)); return `Board pin ${k.name}${this.isPi ? ` (physical pin ${this.pinInfo(q.ref).pin})` : ''}`;
  }
  onPick(hit, e) {
    if (!this.active || !e) return;
    const q = this.nearest(e);
    if (this.tool) { if (q) this.click(q.ref); return; }
    if (this.probeOn) { if (q) this.setProbe(q); return; }
    const id = this.partAt(e); this.select(id);
  }
  setProbe(q) {
    this.clearProbe(); this.probe = { q, el: this.app.label('', q.pos.clone().add(new THREE.Vector3(0, 6, 0)), 'tag3d') };
    this.updateProbe();
  }
  clearProbe() { if (this.probe) { this.app.viewer.scene.remove(this.probe.el); this.probe = null; } }
  updateProbe() {
    if (!this.probe || !this.result) return; const { q } = this.probe;
    const v = this.result.nodeV(q.ref), fl = this.result.isFloating(q.ref);
    this.probe.el.element.innerHTML = `<b>${this.powered() ? (fl ? 'floating' : v.toFixed(2) + ' V') : '0 V (no power)'}</b>`;
  }

  // ------------------------------------------------------------------ simulation loop
  powered() { return this.app.usbPlugged; }
  tick(dt = 0.016) {
    if (!this.active) return;
    const now = performance.now();
    const animated = this.parts.some(p => p.type === 'relay' || p.type === 'motor') || Object.values(this.pinCfg).some(c => ['blink', 'pwm', 'tone', 'servo', 'pulse'].includes(c.mode)) || this.parts.some(p => p.type === 'servo');
    for (const d of this.parts) if (d.type === 'motor') { const it = this.app.bench.items[d.id]; if (it) { const t = this.powered() ? (this.motorTarget[d.id] || 0) : 0; it.obj.speed += (t - it.obj.speed) * Math.min(1, dt / 0.3); if (Math.abs(it.obj.speed) < 0.003 && !t) it.obj.speed = 0; it.obj.spin(dt); } }
    for (const d of this.parts) if (d.type === 'relay') { const it = this.app.bench.items[d.id]; if (it) { const on = !!this.relayOn[d.id] && this.powered(); if (it.obj.update(dt, on, this.powered())) this.app.playClick(on); } }
    if (!this.dirty && now - this.lastRun < (animated ? 90 : 400)) return;
    this.lastRun = now; this.dirty = false;
    let res = evaluate({ boardKind: this.boardKind, pinInfo: this.pinInfo, parts: this.parts, pinCfg: this.pinCfg, powered: this.powered(), burnt: this.burnt, damaged: this.damaged, burnWhy: this.burnWhy, env: this.env, t: (now - this.t0) / 1000 });
    if (res.tripped) { this.tripMsg = res.notes[0].text; this.app.plug(false); res = evaluate({ boardKind: this.boardKind, pinInfo: this.pinInfo, parts: this.parts, pinCfg: this.pinCfg, powered: false, burnt: this.burnt, damaged: this.damaged, burnWhy: this.burnWhy, env: this.env, t: 0 }); this.renderSide(); this.renderPanel(); }
    if (res.newBurn.size || res.newDamage.size) {
      this.pre = this.snap(); for (const id of res.newBurn) { this.burnt.add(id); const n = res.notes.find(x => x.id === id && x.lvl === 'bad'); if (n) this.burnWhy[id] = n.text; } for (const id of res.newDamage) this.damaged.add(id);
      this.commit(); for (const id of res.newBurn) { const it = this.app.bench.items[id]; if (it && it.obj.setBurnt) it.obj.setBurnt(true); } this.dirty = true;
      this.app.toast && this.app.toast(res.newBurn.size ? 'A part burnt out! Read the explanation on the right.' : 'A pin was damaged! Read the explanation on the right.');
    }
    if (this.isPi && this.app.pios) this.app.pios.mode = this.powered() && this.pi.sd ? 'on' : 'off';
    this.result = res; this.apply(res); this.updateProbe(); this.liveText(res);
  }
  apply(res) {
    const b = this.app.bench; let buzz = null;
    for (const d of this.parts) {
      const it = b.items[d.id], R = res.parts[d.id]; if (!it) continue;
      if (d.type === 'led') it.obj.set(!!R && R.level > 0.02 && !this.burnt.has(d.id), R ? Math.max(0.15, R.level) : 0);
      else if (d.type === 'rgbled') it.obj.setRGB(R && R.levels && !this.burnt.has(d.id) ? R.levels.map(x => (x > 0.02 ? Math.max(0.15, x) : 0)) : [0, 0, 0], this.burnt.has(d.id));
      else if (d.type === 'button') it.obj.setPressed(!!this.env.pressed[d.id]);
      else if (d.type === 'lcd1602' || d.type === 'oled') it.obj.setContent({ powered: this.powered() && !!R && R.status !== 'off' && R.status !== 'bad', backlight: !!(R && R.backlight), lines: R && R.show ? [this.env.disp1 ?? 'Hello, world!', this.env.disp2 ?? 'Free build'] : null });
      else if (d.type === 'neopixel') { if (it.obj.setColors) it.obj.setColors(R && R.colors && this.powered() ? R.colors : null); }
      else if (d.type === 'joystick') { const J = this.env.joy[d.id] || { x: 0.5, y: 0.5 }; it.obj.setStick(J.x, J.y, !!this.env.pressed[d.id]); }
      else if (d.type === 'encoder') it.obj.setPhase(this.env.enc[d.id] ?? 0, !!this.env.pressed[d.id]);
      else if (d.type === 'pot') it.obj.set(this.env.pot[d.id] ?? 0.5);
      else if (d.type === 'thermo') { if (it.obj.setPower) it.obj.setPower(!!(R && R.onBus)); }
      else if (d.type === 'pixels') { if (it.obj.setColors) it.obj.setColors(R && R.onBus && this.powered() ? R.colors || null : null); }
      else if (d.type === 'motor') this.motorTarget[d.id] = R ? R.speed || 0 : 0;
      else if (d.type === 'lamp') it.obj.set(!!R && R.level > 0.05 && !this.burnt.has(d.id));
      else if (d.type === 'relay') this.relayOn[d.id] = !!(R && R.on);
      else if (d.type === 'servo') { const tgt = R && R.angle !== undefined ? R.angle : (this.servoNow[d.id] ?? 90), cur = this.servoNow[d.id] ?? 90; const nx = cur + Math.max(-9, Math.min(9, tgt - cur)); this.servoNow[d.id] = nx; it.obj.setAngle(nx); }
      else if (d.type === 'buzzer') { const on = !!R && R.loud > 0.05; it.obj.vibrate(on); if (on) buzz = true; }
    }
    if (this.isU3) { const o = res.pins.D13, c = this.pinCfg.D13 || {}; this.app.board.setLed('l', this.powered() && !this.damaged.has('D13') && ['out1', 'blink', 'pwm', 'tone', 'servo', 'pulse'].includes(c.mode) && (c.mode !== 'blink' || Math.floor((performance.now() - this.t0) / 500) % 2 === 0)); }
    // sound: the passive buzzer follows the pin that is in tone mode
    const tonePin = Object.entries(this.pinCfg).find(([id, c]) => c.mode === 'tone' && !this.damaged.has(id));
    const hz = buzz && tonePin && this.powered() ? Math.round(tonePin[1].freq || 440) : 0;
    if (hz !== this.soundHz) { this.soundHz = hz; if (hz) this.app.playTone(hz); else this.app.stopSound(); }
  }

  // ------------------------------------------------------------------ text for the learner
  setHint() {
    const T = this.tool, h = $('#fb-hint'); let t;
    if (!T) t = this.probeOn ? 'Voltmeter: click any hole or board pin to measure the voltage there.' : 'Drag a part from the left onto the breadboard (or click it, then click holes). Drag from a board pin to a hole to make a wire. Drag a placed part to move it. Hold a push button to press it; drag a knob to turn it.';
    else if (T.type === 'wire') t = T.step ? 'Click the other end of the wire (green = free).' : 'Click where the wire starts: a board pin, a breadboard hole or a power rail.';
    else if (['button', 'pot', 'tmp36', 'hcsr04', 'servo', 'sht31', 'l293d', 'rgbled', 'dht', 'joystick', 'encoder', 'npn'].includes(T.type)) t = { npn: 'Click a hole for the EMITTER leg: the three legs go in columns n, n+1, n+2 of one row: emitter, base, collector (flat side toward you). Tick “turn round” to swap emitter and collector.', joystick: 'Click a hole in row f to j for the first pin: the 5 pins go in columns n … n+4 of one row: GND, VCC, VRx, VRy, SW. The module lies over the breadboard towards you.', encoder: 'Click a hole in row f to j for the first pin: the 5 pins go in columns n … n+4 of one row: CLK, DT, SW, +, GND.', dht: 'Click a hole for the VCC pin: the 4 pins go in columns n … n+3 of one row: VCC, DATA, (not connected), GND. The grille faces you. DATA needs a pull-up resistor to VCC.', rgbled: 'Click the hole for the red leg: the 4 legs go in columns n … n+3 of one row: red, common (the longest leg), green, blue. Each colour needs its own resistor.', l293d: 'Click a hole: the 16-pin chip straddles the middle gap over 8 columns (n … n+7). Pin 1 is at the left of the row nearest you (row f); the notch marks the pin-1 end.', sht31: 'Click a hole in row f to j for the VIN pin: the breakout has 7 pins in columns n … n+6: VIN, GND, SCL, SDA, ADDR, RST, ALRT. The board lies over the middle of the breadboard.', hcsr04: 'Click the hole for the VCC leg (leftmost): the 4 legs go in columns n to n+3 of one row: VCC, TRIG, ECHO, GND. The sensor faces forward.', servo: 'Click the hole for the first pin: the servo plug has 3 pins in columns n, n+1, n+2: brown GND, red 5 V (middle), orange signal.', button: 'Click a hole in row e or f: the button straddles the middle gap (its legs go in columns n and n+2).', pot: 'Click the hole for the left leg: the knob uses 3 holes in a row (columns n, n+2, n+4).', tmp36: 'Click the hole for the left leg: 3 holes in a row. Flat face toward you, legs down: +VS, VOUT, GND from left to right.' }[T.type];
    else if (T.type === 'qwiic') t = T.step ? 'Click the other Qwiic socket (green).' : 'Click a Qwiic socket: the one on the board (left edge) or one of a module. The cable fits only one way.';
    else t = T.step ? { diode: 'Click the hole for the CATHODE (the end with the silver band). The first hole is the anode.', led: 'Click the neighbouring hole for the SHORT leg (cathode, −). The first hole is the long leg (anode, +).', buzzer: 'Click the hole 3 columns away for the − leg. The first hole is +.', resistor: 'Click the hole for the other leg (a resistor has no polarity).', ldr: 'Click the neighbouring hole for the other leg.' }[T.type] : { diode: 'Click the hole for the ANODE (the end without the band).', led: 'Click the hole for the LONG leg (anode, +).', buzzer: 'Click the hole for the + leg.', resistor: 'Click the hole for one leg.', ldr: 'Click the hole for one leg.' }[T.type];
    if (h) h.textContent = t;
    if (this.active) $('#legend').textContent = t;
  }
  toast(t) { this.app.toast ? this.app.toast(t) : 0; }
  codeFor(id) {
    const k = pinKind(this.boardKind, id, this.pinInfo(id)), c = this.pinCfg[id] || { mode: 'in' }, duty = c.duty ?? 0.5, f = Math.round(c.freq || 440);
    if (this.isPi) {
      const n = k.gpio;
      return ({
        out1: `from gpiozero import LED\nled = LED(${n})\nled.on()`, out0: `from gpiozero import LED\nled = LED(${n})\nled.off()`,
        blink: `from gpiozero import LED\nled = LED(${n})\nled.blink(on_time=0.5, off_time=0.5)`,
        pwm: `from gpiozero import PWMLED\nled = PWMLED(${n})\nled.value = ${duty.toFixed(2)}   # 0 … 1`,
        servo: `from gpiozero import AngularServo\ns = AngularServo(${n}, min_angle=0, max_angle=180, min_pulse_width=0.000544, max_pulse_width=0.0024)\ns.angle = ${Math.round(c.angle ?? 90)}`,
        pulse: `# HC-SR04: GPIO Zero sends the trigger pulse and times the echo for you\nfrom gpiozero import DistanceSensor\nsensor = DistanceSensor(echo=<ECHO GPIO>, trigger=${n})\nprint(sensor.distance * 100, "cm")`,
        neopixel: `# pip3 install adafruit-circuitpython-neopixel   (run with sudo)\nimport board, neopixel\npixels = neopixel.NeoPixel(board.D${n}, 8, brightness=${((c.bright ?? 50) / 255).toFixed(2)})   # the Adafruit example uses D18\npixels.fill((255, 0, 0))   # red\npixels.show()`,
        tone: `from gpiozero import TonalBuzzer\nb = TonalBuzzer(${n})\nb.play(${f})   # Hz`,
        dht: `# pip3 install adafruit-circuitpython-dht\nimport adafruit_dht, board\ndht = adafruit_dht.DHT22(board.D${n})   # or DHT11(...)\nprint(dht.temperature, dht.humidity)   # may raise RuntimeError: wait 2 s and retry`,
        i2c: `# I²C bus 1 (SDA = GPIO2, SCL = GPIO3): enable it in raspi-config first\nimport board, busio\ni2c = board.I2C()`,
        in: `from gpiozero import DigitalInputDevice\npin = DigitalInputDevice(${n}, pull_up=None, active_state=True)\nprint(pin.value)`,
        up: `from gpiozero import Button\nbutton = Button(${n})   # internal pull-up\nprint(button.is_pressed)`,
        down: `from gpiozero import Button\nbutton = Button(${n}, pull_up=False)   # internal pull-down\nprint(button.is_pressed)`,
      })[c.mode] || '';
    }
    if (this.isE32) {
      const n = k.gpio !== undefined ? k.gpio : id.slice(1);
      return ({
        out1: `pinMode(${n}, OUTPUT);\ndigitalWrite(${n}, HIGH);`, out0: `pinMode(${n}, OUTPUT);\ndigitalWrite(${n}, LOW);`,
        blink: `pinMode(${n}, OUTPUT);\n// in loop():\ndigitalWrite(${n}, HIGH); delay(500);\ndigitalWrite(${n}, LOW);  delay(500);`,
        pwm: `// in setup() (Arduino-ESP32 core 3.x):\nledcAttach(${n}, 5000, 8);   // pin, 5 kHz, 8 bit\n// in loop():\nledcWrite(${n}, ${Math.round(duty * 255)});   // 0 … 255`,
        neopixel: `#include <Adafruit_NeoPixel.h>\nAdafruit_NeoPixel strip(8, ${n}, NEO_GRB + NEO_KHZ800);   // 8 pixels\n// in setup(): strip.begin(); strip.setBrightness(${c.bright ?? 50});\nstrip.fill(strip.Color(255, 0, 0));   // red\nstrip.show();`,
        tone: `tone(${n}, ${f});   // Hz`,
        dht: `#include "DHT.h"   // Adafruit "DHT sensor library" (+ Adafruit Unified Sensor)\nDHT dht(${n}, DHT22);   // or DHT11\n// in setup(): dht.begin();\nfloat h = dht.readHumidity();\nfloat t = dht.readTemperature();   // isnan() means the read failed`,
        servo: `#include <ESP32Servo.h>   // install the ESP32Servo library\nServo s;\n// in setup():\ns.attach(${n});\ns.write(${Math.round(c.angle ?? 90)});   // degrees`,
        pulse: `pinMode(${n}, OUTPUT);\ndigitalWrite(${n}, LOW);  delayMicroseconds(2);\ndigitalWrite(${n}, HIGH); delayMicroseconds(10);   // 10 µs trigger pulse\ndigitalWrite(${n}, LOW);`,
        i2c: `#include <Wire.h>\n// in setup():\nWire.begin();   // default I²C pins: SDA = GPIO21, SCL = GPIO22`,
        in: `pinMode(${n}, INPUT);\nint v = digitalRead(${n});`, up: `pinMode(${n}, INPUT_PULLUP);\nint v = digitalRead(${n});   // pressed = LOW`,
        down: `pinMode(${n}, INPUT_PULLDOWN);\nint v = digitalRead(${n});`,
        analog: `int v = analogRead(${n});   // 0 … 4095 (12-bit default)`,
      })[c.mode] || '';
    }
    if (this.isU3) id = /^D\d+$/.test(id) ? id.slice(1) : id;
    return ({
      out1: `pinMode(${id}, OUTPUT);\ndigitalWrite(${id}, HIGH);`, out0: `pinMode(${id}, OUTPUT);\ndigitalWrite(${id}, LOW);`,
      blink: `pinMode(${id}, OUTPUT);\n// in loop():\ndigitalWrite(${id}, HIGH); delay(500);\ndigitalWrite(${id}, LOW);  delay(500);`,
      servo: `#include <Servo.h>\nServo s;\n// in setup():\ns.attach(${id});\ns.write(${Math.round(c.angle ?? 90)});   // degrees`,
      pulse: `pinMode(${id}, OUTPUT);\ndigitalWrite(${id}, LOW);  delayMicroseconds(2);\ndigitalWrite(${id}, HIGH); delayMicroseconds(10);   // 10 µs trigger pulse\ndigitalWrite(${id}, LOW);`,
      neopixel: `#include <Adafruit_NeoPixel.h>\nAdafruit_NeoPixel strip(8, ${id}, NEO_GRB + NEO_KHZ800);   // 8 pixels\n// in setup(): strip.begin(); strip.setBrightness(${c.bright ?? 50});\nstrip.fill(strip.Color(255, 0, 0));   // red\nstrip.show();${this.isU3 ? '' : '\n// Note: not verified on the UNO Q (the library bit-bangs the data signal under Zephyr)'}`,
      dht: `#include "DHT.h"   // Adafruit "DHT sensor library" (+ Adafruit Unified Sensor)\nDHT dht(${id}, DHT22);   // or DHT11\n// in setup(): dht.begin();\nfloat h = dht.readHumidity();\nfloat t = dht.readTemperature();   // isnan() means the read failed${this.isU3 ? '' : '\n// Note: forum users report NaN with this library on the UNO Q (Zephyr timing); use the Modulino Thermo or SHT31 there'}`,
      pwm: `pinMode(${id}, OUTPUT);\nanalogWrite(${id}, ${Math.round(duty * 255)});   // 0 … 255`, tone: `tone(${id}, ${f});   // Hz`,
      i2c: `#include <Wire.h>\n// in setup():\nWire.begin();   // ${this.isU3 ? 'I²C bus: SDA = A4, SCL = A5' : 'I²C bus (SDA D20 / SCL D21; A4 / A5 use Wire2)'}`,
      in: `pinMode(${id}, INPUT);\nint v = digitalRead(${id});`, up: `pinMode(${id}, INPUT_PULLUP);\nint v = digitalRead(${id});   // pressed = LOW`,
      analog: `int v = analogRead(${id});   // 0 … 1023 (10-bit default)`,
    })[c.mode] || '';
  }
  modesFor(k) {
    if (this.isE32) return k.inOnly ? ['in', ...(k.analog ? ['analog'] : [])] : ['out0', 'out1', 'blink', 'pwm', 'tone', 'servo', 'pulse', 'dht', 'neopixel', 'in', 'up', 'down', ...(k.analog ? ['analog'] : []), ...(k.i2c ? ['i2c'] : [])];
    const m = ['out0', 'out1', 'blink']; if (k.pwm) m.push('pwm'); m.push('tone', 'servo', 'pulse', 'dht', 'neopixel', 'in', 'up'); if (this.isPi) m.push('down'); if (k.analog) m.push('analog'); if (k.i2c) m.push('i2c'); return m;
  }
  usedPins() {
    const seen = new Map();
    for (const d of this.parts) if (d.type === 'wire' || d.type === 'fwire' || d.type === 'lead') for (const ref of [d.from, d.to]) if (!isHoleRef(ref) && !isModRef(ref)) seen.set(ref, pinKind(this.boardKind, ref, this.pinInfo(ref)));
    return seen;
  }

  // ------------------------------------------------------------------ left column
  renderSide() {
    if (!this.active) return;
    const T = this.tool, on = t => (T && T.type === t ? ' on' : '');
    const ohmOpts = OHMS.map(o => `<option value="${o}"${o === this.opts.ohms ? ' selected' : ''}>${fmtOhms(o)}</option>`).join('');
    const ledOpts = Object.entries(LED_TYPES).map(([k, v]) => `<option value="${k}"${k === this.opts.color ? ' selected' : ''}>${v.name}</option>`).join('');
    const sw = ['auto', ...WIRE_COLORS].map(c => `<button class="fb-sw${this.opts.wire === c ? ' on' : ''}" data-wcolor="${c}" title="${c === 'auto' ? 'Automatic colour (red 5 V, orange 3.3 V, black GND)' : c}" style="${c === 'auto' ? '' : `background:${WIRE_HEX[c]}`}">${c === 'auto' ? 'auto' : ''}</button>`).join('');
    const wireName = this.fw ? 'Jumper wire (female–male for the pins)' : 'Jumper wire (male–male)';
    $('#side').innerHTML = `<div class="fb-side">
      <div class="fb-box"><b>Free build</b><div id="fb-hint" class="fb-hint"></div></div>
      ${this.isPi ? this.piSideHtml() : ''}
      <h3>Power</h3>
      <button class="fb-btn big${this.powered() ? ' on' : ''}" data-act="power">${this.powered() ? '🔌 Unplug the power' : '🔌 Plug in the power'}</button>
      <div class="fb-small">${this.isPi ? 'The Raspberry Pi is already running its operating system.' : this.isU3 ? 'The UNO R3 is powered over its USB-B cable.' : this.isE32 ? 'The ESP32 is powered over its micro-USB cable.' : 'The UNO Q is powered over USB-C.'} Wire first, then plug in: that is the safe order.</div>
      <h3>Parts</h3>
      <div class="fb-row"><button class="fb-btn${on('resistor')}" data-tool="resistor">Resistor</button><select data-opt="ohms">${ohmOpts}</select></div>
      <div class="fb-row"><button class="fb-btn${on('led')}" data-tool="led">LED</button><select data-opt="color">${ledOpts}</select></div>
      <div class="fb-row"><button class="fb-btn${on('rgbled')}" data-tool="rgbled">RGB LED</button><select data-opt="rgbCA"><option value="0"${this.opts.rgbCA ? '' : ' selected'}>common cathode</option><option value="1"${this.opts.rgbCA ? ' selected' : ''}>common anode</option></select></div>
      <div class="fb-row"><button class="fb-btn${on('button')}" data-tool="button">Push button</button></div>
      <div class="fb-row"><button class="fb-btn${on('pot')}" data-tool="pot">Potentiometer 10 kΩ${this.isPi ? ' (no ADC on Pi)' : ''}</button></div>
      <div class="fb-row"><button class="fb-btn${on('buzzer')}" data-tool="buzzer">Passive buzzer</button></div>
      <div class="fb-row"><button class="fb-btn${on('diode')}" data-tool="diode">Diode 1N4007</button></div>
      <div class="fb-row"><button class="fb-btn${on('npn')}" data-tool="npn">Transistor NPN (PN2222A)</button></div>
      <div class="fb-row"><button class="fb-btn${on('ldr')}" data-tool="ldr">Light sensor (LDR)</button></div>
      <div class="fb-row"><button class="fb-btn${on('tmp36')}" data-tool="tmp36">TMP36 temperature${this.isPi ? ' (no ADC on Pi)' : ''}</button><label class="fb-chk"><input type="checkbox" data-opt="flip"${this.opts.flip ? ' checked' : ''}> turn round</label></div>
      <h3>Modules</h3>
      <div class="fb-row"><button class="fb-btn" data-tool="lcd1602">LCD 16×2 with I²C backpack</button></div>
      <div class="fb-row"><button class="fb-btn" data-tool="oled">OLED 128×64 (SSD1306, I²C)</button></div>
      <div class="fb-row"><button class="fb-btn" data-tool="neopixel">NeoPixel strip, 8 pixels (WS2812B)</button></div>
      <div class="fb-row"><button class="fb-btn${on('joystick')}" data-tool="joystick">Joystick module${this.isPi ? ' (no ADC on Pi)' : ''}</button></div>
      <div class="fb-row"><button class="fb-btn${on('encoder')}" data-tool="encoder">Rotary encoder (KY-040)</button></div>
      <div class="fb-row"><button class="fb-btn${on('dht')}" data-tool="dht">DHT temperature + humidity</button><select data-opt="dht"><option value="dht11"${this.opts.dht === 'dht22' ? '' : ' selected'}>DHT11</option><option value="dht22"${this.opts.dht === 'dht22' ? ' selected' : ''}>DHT22</option></select></div>
      <div class="fb-row"><button class="fb-btn${on('hcsr04')}" data-tool="hcsr04">HC-SR04 distance sensor</button></div>
      ${this.isE32 ? '' : `      <div class="fb-row"><button class="fb-btn" data-tool="pir">PIR motion sensor HC-SR501</button></div>`}
      <div class="fb-row"><button class="fb-btn${on('servo')}" data-tool="servo">Servo SG90</button></div>
      ${this.isE32 ? '' : `      <div class="fb-row"><button class="fb-btn" data-tool="relay">Relay module (5 V, low-level trigger)</button></div>`}
      ${this.isE32 ? '' : `      <div class="fb-row"><button class="fb-btn" data-tool="battery">Battery pack 4 × AA (≈ 6 V)</button></div>`}
      ${this.isE32 ? '' : `      <div class="fb-row"><button class="fb-btn" data-tool="lamp">Lamp 6 V</button></div>`}
      ${this.isE32 ? '' : `      <div class="fb-row"><button class="fb-btn${on('l293d')}" data-tool="l293d">L293D motor driver (chip)</button></div>`}
      ${this.isE32 ? '' : `      <div class="fb-row"><button class="fb-btn" data-tool="motor">DC motor 130 with propeller</button></div>`}
      <div class="fb-row"><button class="fb-btn${on('sht31')}" data-tool="sht31">SHT31-D temperature + humidity (I²C)</button></div>
      ${this.isPi || this.isU3 || this.isE32 ? '' : `<div class="fb-row"><button class="fb-btn" data-tool="thermo">Modulino Thermo (Qwiic)</button></div><div class="fb-row"><button class="fb-btn" data-tool="pixels">Modulino Pixels (Qwiic)</button></div><div class="fb-row"><button class="fb-btn${on('qwiic')}" data-tool="qwiic">Qwiic cable</button></div>`}
      <h3>Wires</h3>
      <button class="fb-btn${on('wire')}" data-tool="wire">${wireName}</button>
      <div class="fb-sws">${sw}</div>
      <h3>Tools</h3>
      <div class="fb-row2"><button class="fb-btn${this.probeOn ? ' on' : ''}" data-act="probe">🔎 Voltmeter</button><button class="fb-btn" data-act="undo">↶ Undo</button></div>
      <div class="fb-row2"><button class="fb-btn" data-act="replace">♻ Replace broken parts</button><button class="fb-btn danger" data-act="clear">🗑 Clear all</button></div>
      <div class="fb-row2"><button class="fb-btn" data-act="view1">View: board</button><button class="fb-btn" data-act="view2">View: breadboard</button></div>
      <h3>Examples</h3>
      ${EXAMPLES(this.boardKind).map((x, i) => `<button class="fb-btn ex" data-ex="${i}">${esc(x.title)}</button>`).join('')}
    </div>`;
    $('#side').querySelectorAll('[data-tool]').forEach(b => { if (!['wire', 'qwiic'].includes(b.dataset.tool)) { b.draggable = true; b.title = 'Drag onto the breadboard, or click and then click the holes'; } });
    this.setHint();
  }
  piSideHtml() {
    const p = this.pi, t = (k, label) => `<button class="fb-btn${p[k] ? ' on' : ''}" data-pitog="${k}">${p[k] ? '✔ ' : ''}${label}</button>`;
    return `<h3>Raspberry Pi setup</h3>
      ${t('sd', 'microSD card with Raspberry Pi OS')}${t('hdmi', 'Monitor + micro-HDMI cable (HDMI0)')}${t('kbd', 'USB keyboard')}${t('mouse', 'USB mouse')}
      <div class="fb-row"><span class="fb-small" style="margin:0">Camera</span><select data-picam><option value="none"${p.cam === 'none' ? ' selected' : ''}>not used</option><option value="desk"${p.cam === 'desk' ? ' selected' : ''}>on the desk</option><option value="plugged"${p.cam === 'plugged' ? ' selected' : ''}>plugged in (J3)</option></select></div>
      <label class="fb-chk" style="margin:0 8px"><input type="checkbox" data-piflip${p.flip ? ' checked' : ''}> cable turned round (wrong way)</label>
      <div class="fb-small">Change these with the power off: shutting down first is the safe way.</div>`;
  }
  piToggle(k, v) {
    const was = this.powered(), before = JSON.stringify(this.pi);
    this.pre = this.snap(); this.pi[k] = v; this.pi.touched = true;
    if (was && (k === 'sd' || (k === 'cam'))) this.piWarn = k === 'sd' ? 'The microSD card was inserted or removed with the power on. Shut the Raspberry Pi down first, or the card can be corrupted.' : 'The camera cable was connected or removed with the power on. Shut the Raspberry Pi down and unplug it first.';
    if (!was) this.piWarn = '';
    this.commit(); this.applyPi(k === 'cam' && v === 'plugged'); this.renderSide(); this.dirty = true;
  }
  sideClick(e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) { this.tool && this.tool.type === b.dataset.tool ? this.cancel() : this.begin(b.dataset.tool); return; }
    if (b.dataset.wcolor) { this.opts.wire = b.dataset.wcolor; this.renderSide(); return; }
    if (b.dataset.ex !== undefined) { this.loadExample(+b.dataset.ex); return; }
    if (b.dataset.pitog) { this.piToggle(b.dataset.pitog, !this.pi[b.dataset.pitog]); return; }
    const a = b.dataset.act;
    if (a === 'power') { this.tripMsg = null; if (this.app.usbPlugged) this.piWarn = ''; this.app.plug(!this.app.usbPlugged).then(() => { this.dirty = true; this.renderSide(); this.renderPanel(); }); }
    else if (a === 'probe') { this.cancel(); this.probeOn = !this.probeOn; if (!this.probeOn) this.clearProbe(); this.renderSide(); this.setHint(); }
    else if (a === 'undo') this.undo();
    else if (a === 'clear') { if (!this.parts.length || confirm('Remove every part and wire?')) this.mutate(() => { this.parts = []; this.pinCfg = {}; this.burnt.clear(); this.damaged.clear(); this.burnWhy = {}; this.seq = {}; this.rebuild3D(); this.select(null); }); }
    else if (a === 'replace') this.mutate(() => { for (const id of this.burnt) { const it = this.app.bench.items[id]; if (it && it.obj.setBurnt) { this.place3D(this.parts.find(p => p.id === id)); } } this.burnt.clear(); this.damaged.clear(); this.burnWhy = {}; this.rebuild3D(); this.tripMsg = null; });
    else if (a === 'view1') this.app.view(this.isPi ? 'pibench' : 'bench');
    else if (a === 'view2') this.app.view(this.isPi ? 'pibb' : 'breadboard');
  }
  sideChange(e) {
    const t = e.target;
    if (t.dataset.picam !== undefined) { this.piToggle('cam', t.value); return; }
    if (t.dataset.piflip !== undefined) { this.piToggle('flip', t.checked); return; }
    const o = t.dataset.opt; if (!o) return;
    this.opts[o] = o === 'ohms' ? +t.value : o === 'flip' ? t.checked : o === 'rgbCA' ? t.value === '1' : t.value;
  }
  loadExample(i) {
    const ex = EXAMPLES(this.boardKind)[i]; this.cancel();
    this.mutate(() => { this.parts = ex.parts.map(p => ({ ...p, ...(p.type === 'led' ? { hex: LED_TYPES[p.color || 'red'].hex } : {}) })); this.pinCfg = JSON.parse(JSON.stringify(ex.pins || {})); this.burnt.clear(); this.damaged.clear(); this.burnWhy = {}; this.env.pot = {}; this.env.joy = {}; this.env.enc = {}; this.seq = {}; for (const p of this.parts) { const m = /^([a-z]+)(\d+)$/.exec(p.id); if (m) this.seq[m[1]] = Math.max(this.seq[m[1]] || 0, +m[2]); } this.rebuild3D(); });
    this.select(null); this.tripMsg = null; this.exNote = ex.note; this.renderPanel();
    if (!this.powered()) this.app.plug(true).then(() => { this.dirty = true; this.renderSide(); });
    const wide = ex.parts.some(p => p.type === 'pir' || p.type === 'servo');
    const far = ex.parts.some(p => ['relay', 'battery', 'lamp', 'motor', 'neopixel', 'lcd1602', 'oled'].includes(p.type)), qw = ex.parts.some(p => p.type === 'thermo' || p.type === 'pixels');
    this.app.view(this.isPi ? (far ? 'farpi' : wide ? 'bigpi' : 'pibb') : (qw ? 'qwq' : far ? 'farq' : wide ? 'bigq' : 'breadboard'));
  }

  // ------------------------------------------------------------------ right column
  renderPanel() {
    if (!this.active) return;
    const pins = this.usedPins(), sel = this.parts.find(p => p.id === this.selected);
    let h = `<div class="card fb-card"><div class="lesson-head">Free build · ${this.isPi ? 'Raspberry Pi 4' : this.isE32 ? 'ESP32 DevKit V1' : this.isU3 ? 'Arduino UNO R3' : 'Arduino UNO Q'}</div><h2>Build it. Break it. Fix it.</h2>`;
    if (this.exNote) h += `<div class="fb-note ok"><span class="ic">✎</span><span>${this.exNote}</span></div>`;
    if (this.tripMsg) h += `<div class="fb-note bad"><span class="ic">⚡</span><span>${esc(this.tripMsg)} The power was cut. Fix the circuit, then plug the power in again.</span></div>`;
    h += `<div id="fb-status"></div>`;
    if (!this.parts.length) h += `<p>Place parts on the breadboard, connect them with wires to the board's pins, give every pin a job, and the app tells you whether it works, and if not, why. It follows real rules: LEDs need resistors and the right direction, a button input needs a pull-up, a passive buzzer needs a tone, and ${this.isPi ? '5 V on a GPIO pin damages the Raspberry Pi' : this.isE32 ? '5 V on a GPIO pin damages the ESP32 (3.3 V only)' : this.isU3 ? 'an output pin wired straight to GND is overloaded' : '5 V on D3 or the analog pins damages the UNO Q'}.</p><p class="tip">New here? Try an <b>example</b> on the left, then change it and watch what happens.</p>`;
    if (pins.size) {
      h += `<h3>Pins</h3><div class="fb-pins">`;
      for (const [id, k] of pins) {
        const cfg = this.pinCfg[id] || {}, mode = cfg.mode || '';
        if (k.k === 'gpio') {
          h += `<div class="fb-pin" data-pin="${id}"><div class="fb-pinh"><b>${esc(k.name)}</b>${this.isPi ? `<small>pin ${this.pinInfo(id).pin}</small>` : ''}<span class="fb-pv" data-pv="${id}"></span></div>
            <select data-pinmode="${id}">${mode ? '' : '<option value="" selected>— choose what this pin does —</option>'}${this.modesFor(k).map(m => `<option value="${m}"${m === mode ? ' selected' : ''}>${PIN_MODES[m]}</option>`).join('')}</select>`;
          if (mode === 'pwm') h += `<label class="fb-sl">Duty <input type="range" min="0" max="100" value="${Math.round((cfg.duty ?? 0.5) * 100)}" data-pinduty="${id}"><b>${Math.round((cfg.duty ?? 0.5) * 100)} %</b></label>`;
          if (mode === 'servo') h += `<label class="fb-sl">Angle <input type="range" min="0" max="180" value="${Math.round(cfg.angle ?? 90)}" data-pinangle="${id}"><b>${Math.round(cfg.angle ?? 90)}°</b></label>`;
          if (mode === 'tone') { const lo = this.isPi ? 220 : 100, hi = this.isPi ? 880 : 2000; h += `<label class="fb-sl">Frequency <input type="range" min="${lo}" max="${hi}" value="${Math.round(cfg.freq || 440)}" data-pinfreq="${id}"><b>${Math.round(cfg.freq || 440)} Hz</b></label>`; }
          if (mode === 'neopixel') h += `<label class="fb-sl">Pattern <select data-pinpattern="${id}">${['rainbow', 'red', 'green', 'blue', 'white', 'off'].map(x => `<option value="${x}"${(cfg.pattern || 'rainbow') === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label><label class="fb-sl">Brightness <input type="range" min="0" max="255" value="${cfg.bright ?? 50}" data-pinbright="${id}"><b>${cfg.bright ?? 50}</b></label>`;
          h += `<div class="fb-pr" data-pr="${id}"></div>${mode ? `<details><summary>Code for this pin</summary><pre>${esc(this.codeFor(id))}</pre></details>` : ''}</div>`;
        } else h += `<div class="fb-pin sup"><div class="fb-pinh"><b>${esc(k.name)}</b><small>${{ '5v': '5 V supply', '3v3': '3.3 V supply', gnd: 'ground (0 V)', en: 'reset input: LOW = chip held in reset', nc: 'not modelled' }[k.k]}</small><span class="fb-pv" data-pv="${id}"></span></div></div>`;
      }
      h += `</div>`;
    }
    if (sel) h += this.selectedHtml(sel);
    const hasLdr = this.parts.some(p => p.type === 'ldr'), hasT = this.parts.some(p => p.type === 'tmp36');
    const hasSht = this.parts.some(p => p.type === 'sht31' || p.type === 'thermo' || p.type === 'dht'), hasUs = this.parts.some(p => p.type === 'hcsr04'), hasPir = this.parts.some(p => p.type === 'pir');
    const hasJoy = this.parts.some(p => p.type === 'joystick' || p.type === 'encoder' || p.type === 'lcd1602' || p.type === 'oled');
    if (hasLdr || hasT || hasUs || hasPir || hasSht || hasJoy) {
      h += `<h3>The room (simulated)</h3>`;
      if (hasUs) h += `<div class="fb-env">Obstacle <input type="range" min="2" max="400" value="${this.env.dist}" data-env="dist"><b data-envv="dist"></b></div>`;
      if (hasPir) h += `<div class="fb-env"><span>Motion</span><button class="hold" data-motion>👋 Hold to wave a hand</button><span></span></div>`;
      if (this.parts.some(p => p.type === 'lcd1602' || p.type === 'oled')) h += `<div class="fb-env">Line 1 <input type="text" maxlength="16" value="${esc(this.env.disp1)}" data-disp="disp1"></div><div class="fb-env">Line 2 <input type="text" maxlength="16" value="${esc(this.env.disp2)}" data-disp="disp2"></div>`;
      for (const jd of this.parts.filter(p => p.type === 'joystick')) { const J = this.env.joy[jd.id] || { x: 0.5, y: 0.5 }; h += `<div class="fb-env">Stick ${jd.id} X <input type="range" min="0" max="100" value="${Math.round(J.x * 100)}" data-joy="x:${jd.id}"><b data-joyv="x:${jd.id}"></b></div><div class="fb-env">Stick ${jd.id} Y <input type="range" min="0" max="100" value="${Math.round(J.y * 100)}" data-joy="y:${jd.id}"><b data-joyv="y:${jd.id}"></b></div><div class="fb-env"><span>Switch</span><button class="hold" data-hold="${jd.id}">Hold to press the stick</button><span></span></div>`; }
      for (const ed of this.parts.filter(p => p.type === 'encoder')) h += `<div class="fb-env"><span>Knob ${ed.id}</span><button class="fb-btn small" data-encstep="${ed.id}:-1">◀ step</button><button class="fb-btn small" data-encstep="${ed.id}:1">step ▶</button></div><div class="fb-env"><span>Switch</span><button class="hold" data-hold="${ed.id}">Hold to press the knob</button><span></span></div>`;
      if (hasLdr) h += `<div class="fb-env">Light <input type="range" min="0" max="1000" value="${Math.round(250 * Math.log10(Math.max(this.env.lux, 0.1) / 0.1))}" data-env="lux"><b data-envv="lux"></b><div class="fb-chips">${Object.entries(LUX).map(([k, v]) => `<button class="lvl" data-lux="${v}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div></div>`;
      if (hasSht) h += `<div class="fb-env">Humidity <input type="range" min="0" max="100" value="${this.env.hum}" data-env="hum"><b data-envv="hum"></b></div>`;
      if (hasT || hasSht) h += `<div class="fb-env">Temperature <input type="range" min="-20" max="100" value="${this.env.tempC}" data-env="tempC"><b data-envv="tempC"></b></div>`;
    }
    h += `<h3>Wiring checklist</h3><div id="fb-guide"></div><h3>What the circuit does</h3><div id="fb-notes"></div>
      <p class="sim">Simplified model: wires have no resistance, LED voltages are typical values, and the board's pin drivers use simulation values. Limits come from the datasheets: ${this.isPi ? 'Raspberry Pi GPIO is 3.3 V only, 16 mA per pin' : this.isE32 ? 'ESP32 pins: 3.3 V only, 28 mA sink / 40 mA source at the strongest drive setting; GPIO34–39 are input only without pull resistors' : this.isU3 ? 'ATmega328P pins: 5 V logic, 40 mA absolute maximum per pin (20 mA recommended)' : 'STM32U585 pins: 20 mA absolute maximum, D3 and A0–A5 are 3.3 V only'}.</p></div>`;
    $('#panel').innerHTML = h; this.lastHtml = {}; this.syncControls(); if (this.result) this.liveText(this.result);
  }
  selectedHtml(d) {
    let h = `<h3>Selected: ${esc(nameOf(d))}</h3><div class="fb-sel">`;
    if (d.type === 'resistor') h += `<label>Value <select data-selohms>${OHMS.map(o => `<option value="${o}"${o === d.ohms ? ' selected' : ''}>${fmtOhms(o)}</option>`).join('')}</select></label>`;
    if (d.type === 'led') h += `<label>Colour <select data-selcolor>${Object.entries(LED_TYPES).map(([k, v]) => `<option value="${k}"${k === (d.color || 'red') ? ' selected' : ''}>${v.name}</option>`).join('')}</select></label>`;
    if (d.type === 'pot') h += `<label>Knob <input type="range" min="0" max="100" value="${Math.round((this.env.pot[d.id] ?? 0.5) * 100)}" data-selpot><b data-selpotv></b></label><small>Turn the knob from end A to end B: the wiper voltage follows.</small>`;
    if (d.type === 'button') h += `<button class="hold" data-selpress>Hold to press</button>`;
    h += `<div class="fb-pr" data-partmsg="${d.id}"></div><button class="fb-btn danger" data-del="${d.id}">Delete (Del)</button></div>`;
    return h;
  }
  syncControls() {
    const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    set('[data-envv="hum"]', this.env.hum + ' %RH');
    set('[data-envv="dist"]', this.env.dist + ' cm');
    set('[data-envv="lux"]', this.env.lux < 1 ? '< 1 lux' : Math.round(this.env.lux) + ' lux'); set('[data-envv="tempC"]', this.env.tempC + ' °C');
    document.querySelectorAll('[data-joyv]').forEach(el => { const [ax, id] = el.dataset.joyv.split(':'); const J = this.env.joy[id] || { x: 0.5, y: 0.5 }; el.textContent = Math.round(J[ax] * 100) + ' %'; });
    if (this.selected) set('[data-selpotv]', Math.round((this.env.pot[this.selected] ?? 0.5) * 100) + ' %');
  }
  panelClick(e) {
    const t = e.target;
    if (t.dataset.del) return this.removePart(t.dataset.del);
    if (t.dataset.lux) { this.env.lux = +t.dataset.lux; this.dirty = true; this.renderPanel(); }
    if (t.dataset.encstep) { const [id, st] = t.dataset.encstep.split(':'); this.env.enc[id] = (this.env.enc[id] ?? 0) + +st; this.dirty = true; }
  }
  panelChange(e) {
    const t = e.target;
    if (t.dataset.pinmode) { const id = t.dataset.pinmode; this.mutate(() => { const c = this.pinCfg[id] = { ...(this.pinCfg[id] || {}), mode: t.value }; if (t.value === 'pwm' && c.duty === undefined) c.duty = 0.5; if (t.value === 'tone' && !c.freq) c.freq = 440; if (t.value === 'servo' && c.angle === undefined) c.angle = 90; }); }
    else if (t.dataset.pinpattern) { (this.pinCfg[t.dataset.pinpattern] ||= {}).pattern = t.value; this.mutate(() => {}); }
    else if (t.dataset.selohms) { const d = this.parts.find(p => p.id === this.selected); this.mutate(() => { d.ohms = +t.value; this.burnt.delete(d.id); this.place3D(d); }); this.app.setOutline([this.app.bench.items[d.id].group]); }
    else if (t.dataset.selcolor) { const d = this.parts.find(p => p.id === this.selected); this.mutate(() => { d.color = t.value; d.hex = LED_TYPES[t.value].hex; this.place3D(d); }); this.app.setOutline([this.app.bench.items[d.id].group]); }
  }
  panelInput(e) {
    const t = e.target;
    if (t.dataset.pinduty) { (this.pinCfg[t.dataset.pinduty] ||= {}).duty = +t.value / 100; t.nextElementSibling.textContent = t.value + ' %'; this.dirty = true; this.save(); }
    else if (t.dataset.pinbright) { (this.pinCfg[t.dataset.pinbright] ||= {}).bright = +t.value; t.nextElementSibling.textContent = t.value; this.dirty = true; }
    else if (t.dataset.pinangle) { (this.pinCfg[t.dataset.pinangle] ||= {}).angle = +t.value; t.nextElementSibling.textContent = t.value + '°'; this.dirty = true; this.save(); }
    else if (t.dataset.pinfreq) { (this.pinCfg[t.dataset.pinfreq] ||= {}).freq = +t.value; t.nextElementSibling.textContent = t.value + ' Hz'; this.dirty = true; this.save(); }
    else if (t.dataset.disp) { this.env[t.dataset.disp] = t.value; this.dirty = true; }
    else if (t.dataset.joy) { const [ax, id] = t.dataset.joy.split(':'); const J = this.env.joy[id] || (this.env.joy[id] = { x: 0.5, y: 0.5 }); J[ax] = +t.value / 100; this.dirty = true; this.syncControls(); }
    else if (t.dataset.env === 'lux') { this.env.lux = 0.1 * Math.pow(10, +t.value / 250); this.dirty = true; this.syncControls(); }
    else if (t.dataset.env === 'hum') { this.env.hum = +t.value; this.dirty = true; this.syncControls(); }
    else if (t.dataset.env === 'dist') { this.env.dist = +t.value; this.dirty = true; this.syncControls(); }
    else if (t.dataset.env === 'tempC') { this.env.tempC = +t.value; this.dirty = true; this.syncControls(); }
    else if (t.dataset.selpot !== undefined) { this.env.pot[this.selected] = +t.value / 100; this.dirty = true; this.syncControls(); }
  }
  /** update the live numbers without rebuilding the panel */
  liveText(res) {
    const put = (key, html, el) => { if (this.lastHtml[key] !== html) { this.lastHtml[key] = html; el.innerHTML = html; } };
    const pw = this.powered();
    const status = $('#fb-status'); if (status) put('status', `<div class="fb-pill ${pw ? 'on' : ''}">${pw ? '● Power on' : '○ Power off'}</div>`, status);
    for (const el of document.querySelectorAll('[data-pv]')) { const id = el.dataset.pv, o = res.pins[id]; put('pv' + id, o && pw ? `${o.V.toFixed(2)} V` : '', el); }
    for (const el of document.querySelectorAll('[data-pr]')) {
      const id = el.dataset.pr, o = res.pins[id], cfg = this.pinCfg[id] || {}; let t = '';
      if (o && pw) {
        if (o.status === 'bad') t = `<span class="bad">${esc(o.msg || '')}</span>`;
        else if (cfg.mode === 'analog' && o.read !== undefined) t = o.read === 'floating' ? '<span class="warn">Reads: random (nothing connected)</span>' : `ADC value <b>${o.adc}</b> (0 … ${this.isE32 ? 4095 : 1023}) = ${o.V.toFixed(2)} V`;
        else if (o.i2c) t = `I²C: ${esc(o.i2c)}`;
        else if (o.dht) t = `${esc(o.dht)}`;
        else if (o.echo) t = `Echo pulse <b>${o.echo.us} µs</b> = ${o.echo.cm.toFixed(0)} cm`;
        else if (o.read !== undefined) t = o.read === 'floating' ? '<span class="warn">Reads: random (floating)</span>' : o.read === 'undefined' ? '<span class="warn">Reads: undefined (between LOW and HIGH)</span>' : `Reads: <b>${o.read ? 'HIGH' : 'LOW'}</b>`;
        else if (o.msg) t = esc(o.msg);
      }
      put('pr' + id, t, el);
    }
    for (const el of document.querySelectorAll('[data-partmsg]')) { const R = res.parts[el.dataset.partmsg]; put('pm' + el.dataset.partmsg, R && R.msg ? `<span class="${R.status === 'bad' ? 'bad' : R.status === 'warn' ? 'warn' : ''}">${esc(R.msg)}</span>` : '', el); }
    const guide = $('#fb-guide');
    if (guide) {
      const gs = Object.values(res.guides || {});
      put('guide', gs.length ? gs.map(g => `<div class="fb-guide"><b>${esc(g.label)}</b>${g.items.map(i => `<div class="fb-gi ${i.ok ? 'ok' : 'bad'}"><span class="ic">${i.ok ? '✔' : '→'}</span><span>${esc(i.text)}</span></div>`).join('')}</div>`).join('') : '<div class="fb-small" style="margin:0">Place a sensor, module or part: this list shows which pin each leg should go to, and what it is connected to now.</div>', guide);
    }
    const notes = $('#fb-notes');
    if (notes) {
      const order = { bad: 0, warn: 1, ok: 2, info: 3 }, seen = new Set(), list = [...(this.isPi ? this.piNotes(pw) : []), ...res.notes].filter(n => { if (seen.has(n.text)) return false; seen.add(n.text); return true; }).sort((a, b) => order[a.lvl] - order[b.lvl]);
      put('notes', list.length ? list.map(n => `<div class="fb-note ${n.lvl}"><span class="ic">${{ bad: '✖', warn: '⚠', ok: '✔', info: 'ℹ' }[n.lvl]}</span><span>${esc(n.text)}</span></div>`).join('') : '<div class="fb-note info"><span class="ic">ℹ</span><span>Nothing placed yet.</span></div>', notes);
    }
  }
}

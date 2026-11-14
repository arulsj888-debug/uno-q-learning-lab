import { injectSpeedInsights } from '@vercel/speed-insights';
injectSpeedInsights();
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Viewer } from './viewer.js';
import { initMaterials, canvasTex, noise } from './materials.js';
import { UnoQBoard } from './board.js';
import { Pi4Board } from './pi4/board.js';
import { PARTS_PI, CATEGORIES_PI, BOARD_FACTS_PI, J8_HEADER, findPinPi } from './pi4/data.js';
import { PI_LESSONS, PI_MODULES, PI_COMING, TERM_CMDS } from './pi4/lessons.js';
import { J8 } from './pi4/data.js';
import { makePiAccessories, PI_ACC_INFO } from './pi4/peripherals.js';
import uqThumb from '../assets/thumbs/uq.jpg';
import u3Thumb from '../assets/thumbs/u3.jpg';
import { Uno3Board } from './uno3/board.js';
import { U3_LESSONS, U3_MODULES, U3_COMING } from './uno3/lessons.js';
import { PARTS_U3, CATEGORIES_U3, BOARD_FACTS_U3, U3_HEADERS, findPinU3 } from './uno3/data.js';
import { Esp32Board, boardThumb as e32ThumbFn } from './esp32/board.js';
import { E32_LESSONS, E32_MODULES, E32_COMING } from './esp32/lessons.js';
import { PARTS_E32, CATEGORIES_E32, BOARD_FACTS_E32, E32_HEADERS, findPinE32 } from './esp32/data.js';
import piThumb from '../assets/thumbs/pi.jpg';
import { makeUsbCable, plugUsb, Breadboard, HW_INFO, DESK_Y, HandModel } from './hardware.js';
import { Bench } from './bench.js';
import { FreeBuild } from './freebuild/build.js';
import { RGB_VF } from './freebuild/circuit.js';
import { PARTS as UQ_PARTS, CATEGORIES as UQ_CATEGORIES, BOARD_FACTS as UQ_FACTS } from './data/parts.js';
import { JDIGITAL, JANALOG, JSPI, JCTL, findPin as uqFindPin } from './data/pins.js';
import { LESSONS as UQ_LESSONS, COMING_SOON as UQ_SOON, MODULES as UQ_MODULES } from './data/lessons.js';

// ------------------------------------------------------------------ board profile
const BOARD = { pi4: 'pi4', uno3: 'uno3', esp32: 'esp32' }[new URLSearchParams(location.search).get('board')] || 'unoq';
const IS_PI = BOARD === 'pi4', IS_U3 = BOARD === 'uno3', IS_E32 = BOARD === 'esp32';
const PARTS = IS_PI ? PARTS_PI : IS_U3 ? PARTS_U3 : IS_E32 ? PARTS_E32 : UQ_PARTS;
const CATEGORIES = IS_PI ? CATEGORIES_PI : IS_U3 ? CATEGORIES_U3 : IS_E32 ? CATEGORIES_E32 : UQ_CATEGORIES;
const BOARD_FACTS = IS_PI ? BOARD_FACTS_PI : IS_U3 ? BOARD_FACTS_U3 : IS_E32 ? BOARD_FACTS_E32 : UQ_FACTS;
const findPin = IS_PI ? findPinPi : IS_U3 ? findPinU3 : IS_E32 ? findPinE32 : uqFindPin;
const PIN_HEADERS = IS_PI ? [J8_HEADER] : IS_U3 ? U3_HEADERS : IS_E32 ? E32_HEADERS : [JDIGITAL, JANALOG, JSPI];
const LESSONS = IS_PI ? PI_LESSONS : IS_U3 ? U3_LESSONS : IS_E32 ? E32_LESSONS : UQ_LESSONS;
const MODULES = IS_PI ? PI_MODULES : IS_U3 ? U3_MODULES : IS_E32 ? E32_MODULES : UQ_MODULES;
const COMING_SOON = IS_PI ? PI_COMING : IS_U3 ? U3_COMING : IS_E32 ? E32_COMING : UQ_SOON;
const LOGIC_V = IS_U3 ? 5 : 3.3;      // I/O voltage of the board
const BOARD_NAME = IS_PI ? 'Raspberry Pi 4' : IS_U3 ? 'Arduino UNO R3' : IS_E32 ? 'ESP32 DevKit V1' : 'Arduino UNO Q';
const BTN_PIN = IS_E32 ? 'GPIO17' : IS_U3 ? 'pin 4' : 'D4';   // pin the push-button lessons use
const USB_NAME = IS_U3 || IS_E32 ? 'USB' : 'USB-C';
// what analogRead() returns for a voltage: UNO R3 = 10 bit (ATmega328P: Vin x 1024 / Vref, max 1023), UNO Q lessons = 14 bit
const adcCount = v => IS_U3 ? Math.min(1023, Math.max(0, Math.floor(v / LOGIC_V * 1024))) : IS_E32 ? Math.min(4095, Math.max(0, Math.floor(v / LOGIC_V * 4096))) : Math.round(v / VREF * 16383);
const ADC_BITS = IS_U3 ? '10-bit' : IS_E32 ? '12-bit' : '14-bit';
const pinName = pin => { if (IS_E32) return /^G\d+$/.test(pin) ? 'GPIO' + pin.slice(1) : pin; if (IS_U3) return /^D\d+$/.test(pin) ? 'pin ' + pin.slice(1) : pin; if (!IS_PI) return pin; const p = findPin(pin); return p ? (p.gpio !== null ? `GPIO${p.gpio} (pin ${p.pin})` : `${p.label} (pin ${p.pin})`) : pin; };
import { LOGO_ARRAY, SHADES_ARRAY, matrixCode } from './data/code.js';
import { Sim, blinkCode, VREF } from './sim.js';
import { Scope } from './scope.js';
import { makeDevice } from './devices.js';
import './extra/ui.js';

const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const VIEWS = {
  home: { t: new THREE.Vector3(0, 0, 0), d: new THREE.Vector3(-0.42, 0.66, 0.62), dist: 150 },
  top: { t: new THREE.Vector3(0, 0, 0), d: new THREE.Vector3(0, 1, 0.02), dist: 132 },
  bottom: { t: new THREE.Vector3(0, -1, 0), d: new THREE.Vector3(0, -1, -0.02), dist: 132 },
  bench: { t: new THREE.Vector3(0, 0, 30), d: new THREE.Vector3(-0.28, 0.82, 0.5), dist: 235 },
  breadboard: { t: new THREE.Vector3(4, 2.4, 60), d: new THREE.Vector3(-0.1, 0.86, 0.5), dist: 115 },
  relay: { t: new THREE.Vector3(88, 0, -12), d: new THREE.Vector3(-0.12, 0.88, 0.46), dist: 395 },
  thermo: { t: new THREE.Vector3(62, 0, 6), d: new THREE.Vector3(-0.08, 0.92, 0.38), dist: 215 },
  thermoclose: { t: new THREE.Vector3(100, -4, 6), d: new THREE.Vector3(-0.06, 0.93, 0.36), dist: 62 },
  thermo2: { t: new THREE.Vector3(95, 0, 6), d: new THREE.Vector3(-0.08, 0.92, 0.38), dist: 270 },
  pixclose: { t: new THREE.Vector3(170, -4, 6), d: new THREE.Vector3(-0.06, 0.93, 0.36), dist: 62 },
  smart: { t: new THREE.Vector3(95, 0, 8), d: new THREE.Vector3(-0.12, 0.88, 0.46), dist: 430 },
  dispq: { t: new THREE.Vector3(30, 0, 105), d: new THREE.Vector3(-0.1, 0.88, 0.45), dist: 300 },
  farq: { t: new THREE.Vector3(110, 0, 50), d: new THREE.Vector3(-0.15, 0.9, 0.45), dist: 540 },
  dispp: { t: new THREE.Vector3(55, 0, -40), d: new THREE.Vector3(-0.1, 0.9, 0.42), dist: 330 },
  farpi: { t: new THREE.Vector3(100, 0, -30), d: new THREE.Vector3(-0.1, 0.92, 0.4), dist: 520 },
  qwq: { t: new THREE.Vector3(50, 0, 95), d: new THREE.Vector3(-0.1, 0.92, 0.38), dist: 420 },
  keyv: { t: new THREE.Vector3(60, 0, 100), d: new THREE.Vector3(-0.1, 0.92, 0.4), dist: 330 },
  pikey: { t: new THREE.Vector3(70, 0, -30), d: new THREE.Vector3(-0.1, 0.92, 0.4), dist: 360 },
  wxv: { t: new THREE.Vector3(60, 0, 125), d: new THREE.Vector3(-0.1, 0.9, 0.42), dist: 260 },
  scanv: { t: new THREE.Vector3(40, 0, 95), d: new THREE.Vector3(-0.1, 0.92, 0.4), dist: 430 },
  bbwide: { t: new THREE.Vector3(0, 2, 68), d: new THREE.Vector3(-0.1, 0.9, 0.42), dist: 150 },
  bigq: { t: new THREE.Vector3(30, 0, 36), d: new THREE.Vector3(-0.2, 0.85, 0.5), dist: 330 },
  bigpi: { t: new THREE.Vector3(24, 0, -46), d: new THREE.Vector3(-0.1, 0.9, 0.42), dist: 340 },
  pibench: { t: new THREE.Vector3(-4, 0, -30), d: new THREE.Vector3(-0.1, 0.9, 0.42), dist: 235 },
  pibb: { t: new THREE.Vector3(-6, 2, -57), d: new THREE.Vector3(-0.08, 0.88, 0.47), dist: 118 },
  picam: { t: new THREE.Vector3(-34, 8, 14), d: new THREE.Vector3(-0.12, 0.8, 0.6), dist: 230 },
  pimid: { t: new THREE.Vector3(55, 0, -60), d: new THREE.Vector3(-0.06, 0.9, 0.44), dist: 400 },
  pidesk: { t: new THREE.Vector3(-65, 62, -95), d: new THREE.Vector3(-0.04, 0.42, 0.9), dist: 650 },
  pifront: { t: new THREE.Vector3(-4, 0, 26), d: new THREE.Vector3(-0.25, 0.55, 0.8), dist: 125 },
  piports: { t: new THREE.Vector3(42, 4, -2), d: new THREE.Vector3(0.78, 0.48, 0.4), dist: 150 },
  motor: { t: new THREE.Vector3(0, 0, 90), d: new THREE.Vector3(-0.06, 0.9, 0.43), dist: 285 },
  drvclose: { t: new THREE.Vector3(0, 3, 71), d: new THREE.Vector3(-0.22, 0.86, 0.46), dist: 78 },
  sonar: { t: new THREE.Vector3(-10, 0, 175), d: new THREE.Vector3(-0.62, 0.6, 0.5), dist: 360 },
};
const BOTTOM_PARTS = new Set(IS_PI ? ['sdcard'] : IS_U3 || IS_E32 ? [] : ['mcu', 'emmc', 'jmisc', 'jmedia']);
const shortName = n => n.replace(/^(Qualcomm Dragonwing™|STMicroelectronics|Qualcomm) /, '');

class App {
  constructor() {
    this.loadingDone = false;
    THREE.DefaultLoadingManager.onLoad = () => this.hideLoading();
    setTimeout(() => this.hideLoading(), 6000);

    this.viewer = new Viewer($('#stage'));
    initMaterials(this.viewer.renderer);
    this.board = IS_PI ? new Pi4Board() : IS_U3 ? new Uno3Board() : IS_E32 ? new Esp32Board() : new UnoQBoard();
    this.applyBoardBranding();
    this.viewer.scene.add(this.board.group);
    this.mode = 'explore';
    this.selected = null; this.hovered = null;
    this.tempObjs = []; this.partLabels = [];
    this.progress = JSON.parse(localStorage.getItem(IS_PI ? 'pi4-lab-progress' : IS_U3 ? 'uno3-lab-progress' : IS_E32 ? 'esp32-lab-progress' : 'unoq-lab-progress') || '{}');
    this.blinkDelay = 1000;
    this.soundOn = true;
    this.editorFrame = LOGO_ARRAY.map(v => v * 7);
    this.brush = 7;

    this.setupHardware();
    this.setupMarkers();
    this.setupSim();
    this.bindUI();
    this.bindDirectInput();
    this.bindResponsive();
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
    this.cable = makeUsbCable(IS_U3 ? 'usbb' : IS_E32 ? 'micro' : 'usbc'); this.cable.visible = false; s.add(this.cable);
    this.usbPlugged = false;
    this.bb = new Breadboard(new THREE.Vector3(0, DESK_Y + 8.5, IS_PI ? -62 : 68)); this.bb.group.visible = false; s.add(this.bb.group);
    this.bench = new Bench(s, this.board, this.bb);
    this.fb = new FreeBuild(this, { isPi: IS_PI, boardKind: BOARD, pinInfo: findPin });
    this.pios = { mode: 'on', lines: [], cwd: '~', cur: '', busy: false, temp: 46.2, fs: {} };
    if (IS_PI) { this.acc = makePiAccessories(this.board); for (const a of this.acc.all) { a.on = false; s.add(a.group); } Object.assign(HW_INFO, PI_ACC_INFO); }
    this.strips = new THREE.Group(); this.strips.visible = false; s.add(this.strips);
    // desk lamp over the light sensor (Lesson 11): brightness follows the simulated light level
    this.lamp = new THREE.SpotLight(0xfff1d8, 0, 160, 0.5, 0.75, 1.6);
    this.lamp.position.copy(this.bb.hole('e', 22).add(new THREE.Vector3(1.27, 70, 6)));
    this.lamp.target.position.copy(this.bb.hole('e', 22).add(new THREE.Vector3(1.27, 0, 0)));
    s.add(this.lamp, this.lamp.target);
    this.lux = 300; this.tempC = 25; this.distCm = 40; this.th = { t: 22.5, h: 45, unplug: false, last: null }; this.mp = { pitch: 0, roll: 0, rate: 0 }; this.uiq = []; this.bl = { adv: false, conn: false, val: '0' }; this.wf = { rssi: -48, router: true, passOk: true, t0: 0, http: 'ok' }; this.br = { stage: 'idle', arg: null, led: null }; this.uiq = [];
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
    if (this.bb.group.visible) t.push(this.bb.group);
    if (this.bb.group.visible || (this.lesson && this.lesson.noBreadboard)) t.push(...this.bench.pickables());
    if (this.obstacle && this.obstacle.visible) t.push(this.obstacle);
    if (this.acc) for (const a of this.acc.all) if (a.group.visible) t.push(a.group);
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
    if (IS_PI) this.board.setLed('act', false);
    this.board.setPowerLed(false); this.board.setMatrix(null);
    for (const id of ['rgb1', 'rgb2', 'rgb3', 'rgb4']) this.board.setLed(id, 0, 0, 0);
    this.outputsOff();
  }
  async ensurePower() { if (!this.usbPlugged) await this.plug(true); }

  outputsOff() {
    if (this.dvs) for (const d of this.dvs) d.halt();
    if (this.pw) { this.pw.up = false; this.pw.lit = false; delete this.pw.c; delete this.pw.rh; this.pwStage = 'idle'; this.pwRender && this.pwRender(); }
    this.uiq = [];
    this.phone = null;
    this.br = { stage: 'idle', arg: null, led: null };
    this.pxArr = null;
    if (this.rly) { this.rly.mode = 'INPUT'; this.rly.level = null; }
    for (const it of Object.values(this.bench.items)) {
      if (it.def.type === 'led') it.obj.set(false);
      else if (it.def.type === 'rgbled') { this.rgbLv = [0, 0, 0]; it.obj.setRGB([0, 0, 0]); }
      if (it.def.type === 'buzzer') it.obj.vibrate(false);
    }
    this.stopSound(); this.toneState = null;
    this.setPinLevel('');
    if (this.scope) this.scope.set(null);
  }

  async bootAnimation(ms = 5200) {
    if (IS_U3 || IS_E32) return;      // the UNO R3 and the ESP32 board have no start-up animation: the sketch simply runs
    if (IS_PI) {
      const tok = this.bootToken = {}, t0 = performance.now(); this.pios.mode = 'boot';
      while (performance.now() - t0 < ms) { if (this.bootToken !== tok || !this.board.powered) return; this.board.setLed('act', Math.random() < 0.45); await sleep(60 + Math.random() * 140); }
      this.board.setLed('act', false); if (this.bootToken === tok) this.pios.mode = 'on'; return;
    }
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
    if (this.fb) this.fb.tick(dt);
    this.pirTick(Math.min(dt, 0.1));
    this.servoTick(Math.min(dt, 0.1));
    this.motorTick(Math.min(dt, 0.1));
    if (this.dvs) for (const d of this.dvs) d.tick(Math.min(dt, 0.1));
    this.relayTick(Math.min(dt, 0.1));
    if (this.acc && this.acc.monitor.group.visible) this.acc.monitor.draw({ ...this.pios, mode: this.board.powered ? this.pios.mode : 'off' });
    this.pisensTick(); this.thermoTick(); this.bridgeTick(); this.bridge2Tick(); this.dashTick(); this.homeTick(); this.piwebTick(); this.pikeysTick(); this.wifiTick(); this.sleepTick(); this.bleTick(); this.ctlTick();
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
    if (name === 'relayclose') return this.frameRelay(ms);
    if (name === 'servo' || name === 'servoclose') return this.frameServo(name === 'servoclose', ms);
    if (name === 'pirfront' || name === 'pirback') return this.framePir(name === 'pirback' ? 'back' : 'front', ms);
    let v = VIEWS[name];
    if (IS_PI && (name === 'home' || name === 'top' || name === 'bottom')) v = { ...v, dist: v.dist * 1.25 };
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
    if (IS_E32 && E32_HEADERS.find(hd => hd.id === id)) { const hd = E32_HEADERS.find(x => x.id === id); h += `<div class="pingrid">${hd.pins.map(p => `<button data-pin="${p.id}"><b>${p.label}</b> · ${p.gpio !== undefined ? 'GPIO' + p.gpio : 'pin ' + p.pin}</button>`).join('')}</div>`; }
    else if (IS_U3 && U3_HEADERS.find(hd => hd.id === id)) { const hd = U3_HEADERS.find(x => x.id === id); h += `<div class="pingrid">${hd.pins.map(p => `<button data-pin="${p.id}"><b>${p.label}</b> · pin ${p.pin}</button>`).join('')}</div>`; }
    else if (id === 'jdigital' || id === 'janalog' || id === 'jspi') {
      const hdr = id === 'jdigital' ? JDIGITAL : id === 'janalog' ? JANALOG : JSPI;
      h += `<div class="pingrid">${hdr.pins.map(p => `<button data-pin="${p.id}"><b>${p.label}</b> · pin ${p.pin}</button>`).join('')}</div>`;
    }
    if (IS_PI && id === 'gpio') h += `<div class="pingrid">${J8_HEADER.pins.map(p => `<button data-pin="${p.id}"><b>${p.label}</b> · pin ${p.pin}</button>`).join('')}</div>`;
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
      tag = info && info.v ? info.v : (IS_U3 ? '5V' : '3.3V');
      const fns = info && info.fn ? (IS_PI ? info.fn[0] : info.fn.join(', ')) : '';
      line1 = fns ? (IS_PI ? fns + '.' : `Functions: ${fns}`) : 'Direct microcontroller input/output pin.';
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
    if (IS_PI) return this.pinCardPi(pinId);
    if (IS_E32) {
      const p = findPin(pinId), hd = E32_HEADERS.find(x => x.pins.includes(p));
      let h = `<div class="card"><h2><span class="pinchip">${p.label}</span></h2><div class="ref">${hd.name} · pin ${p.pin}</div>`;
      h += `<table class="kv">${p.gpio !== undefined ? `<tr><td>In code</td><td><b>GPIO${p.gpio}</b> — write ${p.gpio} in pinMode(${p.gpio}, …)</td></tr>` : ''}<tr><td>Functions</td><td>${p.fn.join('<br>')}</td></tr><tr><td>Level</td><td>${p.v}</td></tr></table>`;
      h += `<p class="${p.strap || p.inOnly ? 'warn' : ''}">${p.note}</p><p class="tip">${hd.common}</p><p><button class="item" data-part="${hd.id}">← About the ${hd.name}</button></p>`;
      return h + `<div class="src">Sources: Espressif ESP32 datasheet v5.3 · ESP32-WROOM-32 datasheet · Random Nerd Tutorials pinout reference · espboards.dev (silkscreen order)</div></div>`;
    }
    if (IS_U3) {
      const p = findPin(pinId), hd = U3_HEADERS.find(x => x.pins.includes(p));
      let h = `<div class="card"><h2><span class="pinchip">${p.label}</span> ${p.id !== p.label && !/^GND/.test(p.id) ? p.id : ''}</h2><div class="ref">${hd.name} · pin ${p.pin}</div>`;
      h += `<table class="kv"><tr><td>MCU pin</td><td>${p.mcu}</td></tr><tr><td>Functions</td><td>${p.fn.join('<br>')}</td></tr><tr><td>Level</td><td>${p.v}</td></tr></table>`;
      h += `<p>${p.note}</p><p class="tip">${hd.common}</p><p><button class="item" data-part="${hd.id}">← About the ${hd.name}</button></p>`;
      return h + `<div class="src">Source: Arduino UNO R3 datasheet A000066 §5.1–5.2 · board file UNO-TH_Rev3e · ATmega328P datasheet</div></div>`;
    }
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
  pinCardPi(pinId) {
    const p = findPin(pinId);
    let h = `<div class="card"><h2><span class="pinchip">${p.label}</span> physical pin ${p.pin}</h2><div class="ref">J8 · 40-pin GPIO header</div>`;
    h += `<table class="kv"><tr><td>Pin</td><td>${p.pin} (${p.pin % 2 ? 'inner row, odd numbers' : 'outer row, even numbers'})</td></tr>`;
    if (p.gpio !== null) h += `<tr><td>In code</td><td><b>GPIO${p.gpio}</b> (BCM number)</td></tr>`;
    h += `<tr><td>Level</td><td>${p.v}</td></tr><tr><td>Functions</td><td>${p.fn.join('<br>')}</td></tr></table>`;
    h += `<p class="${p.warn ? 'warn' : ''}">${p.note}</p><p class="tip">${J8_HEADER.common}</p>`;
    h += `<p><button class="item" data-part="gpio">← About the 40-pin GPIO header</button></p>`;
    h += `<div class="src">Source: Raspberry Pi 4 datasheet §5.1 (Figure 3, Table 5) · raspberrypi.com GPIO documentation</div></div>`;
    return h;
  }
  applyBoardBranding() {
    if (IS_PI) { const b = document.querySelector('.brand b'); if (b) b.textContent = 'Raspberry Pi 4'; const lg = document.querySelector('.brand .logo'); if (lg) lg.style.display = 'none'; }
    if (IS_U3) { const b = document.querySelector('.brand b'); if (b) b.textContent = 'Arduino UNO R3'; }
    if (IS_E32) { const b = document.querySelector('.brand b'); if (b) b.textContent = 'ESP32 DevKit V1'; }
    document.title = BOARD_NAME + ' · 3D Learning Lab';
    const ch = $('#chooser');
    if (ch) {
      const cards = ch.querySelectorAll('[data-board]');
      cards.forEach(c => { const im = c.querySelector('.ch-img'); if (im && !im.firstChild) { const img = new Image(); img.alt = ''; img.src = c.dataset.board === 'pi4' ? piThumb : c.dataset.board === 'uno3' ? u3Thumb : c.dataset.board === 'esp32' ? e32ThumbFn() : uqThumb; im.appendChild(img); } c.classList.toggle('cur', c.dataset.board === BOARD); });
      const go = b => { if (b === BOARD) { ch.classList.remove('on'); history.replaceState(null, '', '?board=' + b); } else location.search = '?board=' + b; };
      cards.forEach(c => c.onclick = () => go(c.dataset.board));
      if (!new URLSearchParams(location.search).get('board')) ch.classList.add('on');
      const home = () => { ch.classList.add('on'); document.body.dataset.menu = ''; };
      $('#home-btn').onclick = home;
      document.querySelector('.brand').onclick = home; document.querySelector('.brand').style.cursor = 'pointer'; document.querySelector('.brand').title = 'Home — choose a board';
      $('#chooser-close').onclick = () => ch.classList.remove('on');
    }
  }
  showWelcome() {
    if (IS_E32) {
      $('#panel').innerHTML = `<div class="card welcome"><h2>${BOARD_FACTS.name}</h2><span class="tag">Interactive 3D model</span>
        <p>The popular <b>ESP32 DevKit V1</b> (DOIT-style) board: an <b>ESP32-WROOM-32</b> module with Wi-Fi and Bluetooth, a USB-to-serial chip, a 3.3 V regulator and two rows of pins.</p>
        <div class="facts"><span>Module</span><span>${BOARD_FACTS.skus}</span><span>Board size</span><span>${BOARD_FACTS.size}</span><span>Operating temp.</span><span>${BOARD_FACTS.temp}</span></div>
        <p class="warn"><b>3.3 V only.</b> Every ESP32 pin works at 3.3 V; 5 V on a pin can damage the chip.</p>
        <p class="tip"><b>Click any part</b> on the board — or choose one on the left — to learn what it does. Click a single header pin to see its function.</p>
        <p class="sim">This 3D model is <b>stylised</b>: there is no official CAD file for this board. The module size and the order of the 30 pins are the real ones; the positions of the small parts are close, not measured. Boards from different sellers can differ (30, 36 or 38 pins, other USB chip, other regulator).</p>
        <div class="src">Sources: Espressif ESP32 datasheet v5.3 and ESP32-WROOM-32 datasheet v3.8 · Random Nerd Tutorials · espboards.dev</div></div>`;
      return;
    }
    if (IS_U3) {
      $('#panel').innerHTML = `<div class="card welcome"><h2>${BOARD_FACTS.name}</h2><span class="tag">Interactive 3D model</span>
        <p>This model is built from Arduino’s <b>official open-source board file</b> of the UNO R3: the real outline and mounting holes, every copper track, pad and silkscreen label, and the exact position of every part.</p>
        <div class="facts"><span>Version</span><span>${BOARD_FACTS.skus}</span><span>Size</span><span>${BOARD_FACTS.size}</span><span>Operating temp.</span><span>${BOARD_FACTS.temp}</span></div>
        <p class="tip"><b>Click any part</b> on the board — or choose one on the left — to learn what it does. Click a single header pin to see its function.</p>
        <p>Use <b>Top</b> / <b>Bottom</b> to turn the board over, and <b>360°</b> to spin it. Try the <b>Build</b> tab to wire circuits.</p>
        <div class="src">Sources: Arduino UNO R3 datasheet A000066 · board file UNO-TH_Rev3e.brd © Arduino, CC BY-SA 4.0. The Arduino logo in the silkscreen is drawn by the app (it is a bitmap that is not part of the CAD file).</div></div>`;
      return;
    }
    if (IS_PI) {
      $('#panel').innerHTML = `<div class="card welcome"><h2>${BOARD_FACTS.name}</h2><span class="tag">Interactive 3D model</span>
        <p>This model is built from Raspberry Pi’s <b>official mechanical drawing</b> (exact size, hole and connector positions and heights) with the surface taken from <b>real photographs</b> of the board, straightened to the exact millimetre grid.</p>
        <div class="facts"><span>Size</span><span>${BOARD_FACTS.size}</span><span>Memory</span><span>${BOARD_FACTS.ram}</span><span>Operating temp.</span><span>${BOARD_FACTS.temp}</span></div>
        <p class="tip"><b>Click any part</b> on the board — or choose one on the left — to learn what it does. Click a single GPIO pin to see its function.</p>
        <p>Use <b>Top</b> / <b>Bottom</b> to turn the board over (the microSD slot is underneath), and <b>360°</b> to spin it.</p>
        <div class="src">Sources: Raspberry Pi 4 Model B datasheet and mechanical drawing (Raspberry Pi Ltd). Board photos: “Raspberry Pi 4 Model B - Top” by Laserlicht and “Raspberry Pi 4, 2 GB RAM version 7” by Suyash Dwivedi, Wikimedia Commons, CC BY-SA 4.0 — straightened and used as textures (same licence). Raspberry Pi is a trademark of Raspberry Pi Ltd.</div></div>`;
      return;
    }
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
    if (this.mode === 'build') { this.fb.renderSide(); return; }
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
      for (const hd of PIN_HEADERS) h += `<div class="pingrid">${hd.pins.map(p => `<button data-pin="${p.id}"><b>${p.label}</b>${IS_PI ? ` · ${p.pin}` : ''}</button>`).join('')}</div>`;
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
      if (COMING_SOON.length) h += `<h3>${IS_PI ? 'Coming next' : 'Coming next (stage 3)'}</h3>` + COMING_SOON.map(s => `<div class="soon">${s}</div>`).join('');
      side.innerHTML = h;
      side.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => this.startLesson(b.dataset.lesson));
      const on = side.querySelector('.lesson-card.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    }
  }

  setMode(mode) {
    if (mode === 'build' && !this.fb) mode = 'explore';
    if (this.mode === 'build' && mode !== 'build') this.fb.deactivate();
    this.mode = mode;
    $('#app').className = 'mode-' + mode;
    document.querySelectorAll('.modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    this.hideFloat(); this.clearTemp(); this.hideCallout();
    this.pulseObjs = null; this.viewer.outline.edgeStrength = 4;
    if (mode === 'build') { this.fb.activate(); return; }
    if (mode === 'explore') {
      this.sim.stop(); this.stopSound(); this.lamp.intensity = 0; this.hideSonar(); this.showRoom(false); this.showMotor(false); this.showRelay(false); this.showThermo(false); this.showPhone(false);
      this.lesson = null; this.hideAcc();
      this.renderSide();
      this.select(null, { card: false });
      this.showWelcome();
    } else {
      this.renderSide();
      if (!this.lesson) this.lessonHome();
    }
  }

  lessonHome() {
    $('#panel').innerHTML = `<div class="card"><div class="lesson-head">Course</div><h2>Learn the ${IS_PI ? 'Raspberry Pi 4' : IS_U3 ? 'UNO R3' : IS_E32 ? 'ESP32' : 'UNO Q'} step by step</h2>
      <p>The lessons go in order, ${IS_PI ? 'from setting up the board to Python programs that control electronics' : 'from the very basics to circuits with inputs, outputs, light and sound'}. Each step moves the 3D board, highlights the parts and explains them.</p>
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
    this.hideAcc();
    this.board.setMatrix(null);
    this.lamp.intensity = 0; this.hideSonar(); this.showRoom(false); this.showMotor(false); this.showRelay(false);
    if (L.circuit) { this.bench.setDefs(L.circuit); this.bb.group.visible = !L.noBreadboard; }
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
    if (L.code) this.renderCode(L.code, L.explain, L.code2, L.code3);
    document.querySelector('.dock-code .file').textContent = L.file || (IS_PI ? 'program.py' : 'sketch.ino');
    document.querySelector('.dock-serial .file').textContent = IS_PI ? 'Shell (program output)' : 'Serial Monitor';
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
    let h = ''; this.lcdSt = { rows: [' '.repeat(16), ' '.repeat(16)], c: 0, r: 0, bl: false, ready: false }; this.oledSt = { buf: ['', ''], cy: 0, shown: null }; this.lcdAddr = 0x27; this.oledAddr = 0x3C; this.neoSt = { px: Array.from({ length: 8 }, () => [0, 0, 0]), br: 255, shown: null }; this.qPin = 0; this.qR = (this.lesson && this.lesson.qdefault) || 1000; this.mLoad = 'lamp'; this.neoShift = false; this._neoKey = null; this._lcdKey = null; this._oledKey = null; this.joyPos = { x: 0.5, y: 0.5 }; this.joySw = false; this.encPh = 0; this.encSw = false; this.wf.router = true; this.wf.passOk = true;       // every lesson starts with a working simulated router
    if (w.includes('ble')) h += `<div class="io-block pirstat tight"><div><span>Phone app (client)</span><b id="bl-s1">—</b></div><div class="arrow">→</div><div><span>ESP32 (BLE server)</span><b id="bl-s2">—</b></div><div class="arrow">→</div><div><span>LED on GPIO16</span><b id="bl-s3">—</b></div></div><div id="bl-note" class="io-note"></div>`;
    if (w.includes('mosload')) h += `<div class="io-block"><div class="io-title">Load <span class="io-note">(simulated)</span></div><div class="io-tools"><select id="m-load"><option value="lamp">6 V lamp (about 300 mA)</option><option value="motor">DC motor (about 1 A)</option></select></div><div id="m-out" class="io-val"></div><div id="m-note" class="io-note"></div></div>`;
    if (w.includes('qbase')) h += `<div class="io-block"><div class="io-title">Base resistor <span class="io-note">(simulated)</span></div><div class="io-tools"><select id="q-r"><option value="220">220 Ω</option><option value="470">470 Ω</option><option value="1000">1 kΩ</option><option value="10000">10 kΩ</option><option value="100000">100 kΩ</option></select></div><div id="q-out" class="io-val"></div><div id="q-note" class="io-note"></div></div>`;
    if (w.includes('neolevel')) h += `<div class="io-block"><div class="io-title">Data line <span class="io-note">(simulated)</span></div><div class="io-tools"><button id="neo-shift" class="hold small">Level shifter: absent</button></div><div id="neo-note" class="io-note"></div></div>`;
    if (w.includes('lcdaddr')) h += `<div class="io-block"><div class="io-title">LCD backpack <span class="io-note">(simulated)</span></div><div class="io-tools"><button id="lcd-addr" class="hold small">Module address: 0x27</button></div><div id="lcd-note" class="io-note"></div></div>`;
    this.logicV = LOGIC_V; this.dvs = []; for (const x of w) if (typeof x === 'string' && x.startsWith('dv:')) { const d = makeDevice(x.slice(3), this); if (d) { this.dvs.push(d); h += d.html(); } }
    if (w.includes('oledaddr')) h += `<div class="io-block"><div class="io-title">OLED module <span class="io-note">(simulated)</span></div><div class="io-tools"><button id="oled-addr" class="hold small">Module address: 0x3C</button></div><div id="oled-note" class="io-note"></div></div>`;
    if (w.includes('joy')) h += `<div class="io-block"><div class="io-title">Joystick <span class="io-note">(simulated)</span></div><div class="throw"><label>X (left → right)</label><input id="jx" type="range" min="0" max="100" value="50"><b id="jx-v"></b></div><div class="throw"><label>Y (up ↔ down)</label><input id="jy" type="range" min="0" max="100" value="50"><b id="jy-v"></b></div><button id="jsw" class="hold">Hold to press the stick</button><div class="io-note">The sliders move the stick; pressing closes the switch under it.</div></div>`;
    if (w.includes('enc')) h += `<div class="io-block"><div class="io-title">Rotary encoder <span class="io-note">(simulated)</span></div><div class="io-tools"><button id="enc-l" class="small">◀ turn</button><button id="enc-r" class="small">turn ▶</button><button id="enc-sw" class="hold small">Hold to press the knob</button></div><div id="enc-st" class="io-val"></div><div class="io-note">One press = one click of the knob (four steps of the CLK / DT pattern).</div></div>`;
    if (w.includes('sleep')) h += `<div class="io-block pirstat tight"><div><span>ESP32</span><b id="sl-st">—</b></div><div class="arrow">→</div><div><span>Wake-up in</span><b id="sl-t">—</b></div><div class="arrow">→</div><div><span>LED on GPIO16</span><b id="sl-led">—</b></div></div><div class="io-note">In deep sleep only the RTC controller, RTC peripherals and RTC memory stay powered.</div>`;
    if (w.includes('touch')) h += `<div class="io-block"><div class="io-title">Touch pad: the wire on GPIO4 (T0)</div><button id="tch" class="hold">Touch the wire</button><div id="tch-state" class="io-val">Not touched</div><div class="io-note">touchRead() values are illustrative: your board and wire will give different numbers.</div></div>`;
    if (w.includes('button')) h += `<div class="io-block"><div class="io-title">Push button on ${IS_PI ? 'GPIO2 (pin 3)' : IS_E32 ? 'GPIO17' : this.btnPin()}</div><button id="hold" class="hold">Hold to press</button><div class="io-note">or click &amp; hold the button in the 3D view</div><div id="btn-state" class="io-val">Released → ${IS_PI ? 'GPIO2' : IS_E32 ? 'GPIO17' : this.btnPin()} reads HIGH (pull-up)</div></div>`;
    if (w.includes('light')) h += `<div class="io-block"><div class="io-title">Light on the sensor <span class="io-note">(simulated)</span></div><input id="lux" type="range" min="0" max="1000" value="${Math.round(this.luxToSlider(this.lux))}"><div class="io-tools">${[['Dark', 0.01], ['Dim', 10], ['Room light', 300], ['Torch', 2000]].map(([t, v]) => `<button class="lvl" data-lux="${v}">${t}</button>`).join('')}</div><div id="lux-val" class="io-val"></div></div>`;
    if (w.includes('temp')) h += `<div class="io-block"><div class="io-title">Temperature around the TMP36 <span class="io-note">(simulated)</span></div><input id="tempc" type="range" min="-40" max="125" step="0.5" value="${this.tempC}"><div id="temp-val" class="io-val"></div></div>`;
    if (w.includes('distance')) h += `<div class="io-block"><div class="io-title">Obstacle in front of the sensor <span class="io-note">(simulated)</span></div><input id="dist" type="range" min="2" max="400" step="0.5" value="${this.distCm}"><div class="io-tools">${[5, 20, 40, 100, 250, 400].map(v => `<button class="lvl" data-dist="${v}">${v} cm</button>`).join('')}</div><div id="dist-val" class="io-val"></div><div class="io-note">or drag the obstacle in the 3D view</div></div><div class="io-block"><div class="io-title">Timing (HC-SR04 datasheet) · animation slowed down</div><canvas id="sonar-timing" width="560" height="112"></canvas></div>`;
    if (w.includes('pir')) h += `<div class="io-block"><div class="io-title">Try it</div>
        <div class="io-tools"><button id="pir-wave" class="hold">👋 Wave hand</button><button id="pir-still" class="lvl">✋ Hold hand still</button></div></div>
        <div class="io-block pirstat"><div><span>Sensor</span><b id="ps-sensor">—</b></div><div class="arrow">→</div><div><span>OUT → D2</span><b id="ps-out">—</b></div><div class="arrow">→</div><div><span>Alarm LED (D5)</span><b id="ps-led">—</b></div></div>
        <div id="ps-note" class="io-note"></div>`;
    if (w.includes('home')) h += `<div class="io-block"><div class="io-title">The room <span class="io-note">(simulated — you decide)</span></div><div class="throw"><label>Temperature</label><input id="th-t" type="range" min="10" max="40" step="0.5" value="${this.th.t}"><b id="th-tv"></b></div></div>
        <div class="io-block pirstat tight"><div><span>Sketch · Thermo</span><b id="h-sk">—</b></div><div class="arrow">→</div><div><span>Python · decides</span><b id="h-py">—</b></div><div class="arrow">→</div><div><span>Relay → Lamp</span><b id="h-rl">—</b></div></div><div id="h-note" class="io-note"></div>`;
    if (w.includes('dash')) h += `<div class="io-block"><div class="io-title">The air around the sensor <span class="io-note">(simulated)</span></div><div class="throw"><label>Temperature</label><input id="th-t" type="range" min="10" max="40" step="0.5" value="${this.th.t}"><b id="th-tv"></b></div><div class="throw"><label>Humidity</label><input id="th-h" type="range" min="0" max="100" step="1" value="${this.th.h}"><b id="th-hv"></b></div></div>
        <div class="io-block pirstat tight"><div><span>Sketch · Thermo</span><b id="d-sk">—</b></div><div class="arrow">→</div><div><span>Python · Web UI</span><b id="d-py">—</b></div><div class="arrow">→</div><div><span>Browser</span><b id="d-br">—</b></div></div><div id="d-note" class="io-note"></div>`;
    if (w.includes('pikeys')) h += `<div class="io-block"><div class="io-title">Keys — click to play <span class="io-note">(GPIO17)</span></div><div class="pkeys">${[['C4', 60], ['D4', 62], ['E4', 64], ['F4', 65], ['G4', 67], ['A4', 69], ['B4', 71]].map(([n, m]) => `<button class="pkey" data-hz="${(440 * Math.pow(2, (m - 69) / 12)).toFixed(3)}" data-n="${n}">${n}</button>`).join('')}</div><div id="pk-note" class="io-note"></div></div>`;
    if (w.includes('piweb')) h += `<div class="io-block pirstat tight"><div><span>Phone browser</span><b id="w-ph">—</b></div><div class="arrow">→</div><div><span>${IS_E32 ? 'WebServer on the ESP32' : 'Flask on the Pi'}</span><b id="w-fl">—</b></div><div class="arrow">→</div><div><span>LED on ${IS_E32 ? 'GPIO16' : 'GPIO17'}</span><b id="w-led">—</b></div></div><div id="w-note" class="io-note"></div>`;
    if (w.includes('wifiscan')) h += `<div class="io-block"><div class="io-title">Signal of “HomeNet” <span class="io-note">(simulated)</span></div><input id="wf-rssi" type="range" min="-90" max="-30" step="1" value="${this.wf.rssi}"><div id="wf-val" class="io-val"></div><div class="io-note">RSSI = received signal strength in dBm. The closer to 0, the stronger the signal. The other networks are made up for this demo.</div></div>`;
    if (w.includes('fsview')) { this.fsd = { '/log.csv': '' }; h += `<div class="io-block"><div class="io-title">Flash file system <span class="io-note">(LittleFS, simulated)</span></div><pre id="fs-view" class="io-val" style="white-space:pre;margin:0">(no file yet)</pre></div>`; }
    if (w.includes('keypad')) { this.kp = { q: [], cur: '', until: 0 }; h += `<div class="io-block"><div class="io-title">Keypad <span class="io-note">(simulated)</span></div><div class="kp-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">${['1','2','3','A','4','5','6','B','7','8','9','C','*','0','#','D'].map(k => `<button class="hold small kp-key" data-k="${k}">${k}</button>`).join('')}</div><div id="kp-note" class="io-note"></div></div>`; }
    if (w.includes('clapsens')) { this.cl = { until: 0 }; h += `<div class="io-block"><div class="io-title">The room <span class="io-note">(simulated)</span></div><div class="io-tools"><button id="cl-btn" class="hold small">👏 Clap</button></div><div id="cl-note" class="io-note"></div></div>`; }
    if (w.includes('soilsens')) { this.sm = { wet: 0 }; h += `<div class="io-block"><div class="io-title">The soil <span class="io-note">(simulated)</span></div><div class="throw"><label>Moisture</label><input id="sm-w" type="range" min="0" max="100" step="1" value="0"><b id="sm-wv">dry</b></div><div id="sm-v" class="io-val"></div></div>`; }
    if (w.includes('bmpsens')) { this.bp = { t: 22.5, p: 1013 }; h += `<div class="io-block"><div class="io-title">The air <span class="io-note">(simulated)</span></div><div class="throw"><label>Temperature</label><input id="bp-t" type="range" min="-20" max="60" step="0.5" value="22.5"><b id="bp-tv">22.5 °C</b></div><div class="throw"><label>Pressure</label><input id="bp-p" type="range" min="950" max="1050" step="1" value="1013"><b id="bp-pv">1013 hPa</b></div></div>`; }
    if (w.includes('stepper')) { this.stp = { lv: [0, 0, 0, 0], steps: 0 }; h += `<div class="io-block"><div class="io-title">Stepper motor <span class="io-note">(simulated)</span></div><div id="stp-out" class="io-val">Steps: 0 · angle 0°</div><div id="stp-note" class="io-note"></div></div>`; }
    if (w.includes('mpusens')) { this.mp = { pitch: 0, roll: 0, rate: 0 }; h += `<div class="io-block"><div class="io-title">Tilt the board <span class="io-note">(simulated)</span></div><div class="throw"><label>Pitch</label><input id="mp-p" type="range" min="-90" max="90" step="1" value="0"><b id="mp-pv">0°</b></div><div class="throw"><label>Roll</label><input id="mp-r" type="range" min="-90" max="90" step="1" value="0"><b id="mp-rv">0°</b></div><div class="throw"><label>Rotation</label><input id="mp-w" type="range" min="-250" max="250" step="5" value="0"><b id="mp-wv">0 °/s</b></div></div>`; }
    if (w.includes('irremote')) { this.irq = []; h += `<div class="io-block"><div class="io-title">Simulated IR remote <span class="io-note">(NEC, address 0x00)</span></div><div class="io-tools"><button id="ir-45" class="hold small">⏻ Power 0x45</button><button id="ir-0c" class="hold small">1 · 0x0C</button><button id="ir-18" class="hold small">2 · 0x18</button><button id="ir-5e" class="hold small">3 · 0x5E</button></div><div id="ir-note" class="io-note"></div></div>`; }
    if (w.includes('ntpserver')) { this.wf.ntp = true; this.wf.ntpT0 = 0; h += `<div class="io-block"><div class="io-title">Time server <span class="io-note">(simulated)</span></div><div class="io-tools"><button id="ntp-btn" class="hold small">🕒 pool.ntp.org: reachable</button></div></div>`; }
    if (w.includes('mqttbroker')) { this.mq = { up: true, conn: false, subs: new Set(), inbox: [], log: [] }; h += `<div class="io-block"><div class="io-title">MQTT broker and phone <span class="io-note">(simulated)</span></div><div class="io-tools"><button id="mq-up" class="hold small">🖧 Broker: online</button><button id="mq-on" class="hold small">📱 Send ON</button><button id="mq-off" class="hold small">📱 Send OFF</button></div><div id="mq-log" class="io-val">Broker log: —</div></div>`; }
    if (w.includes('httpserver')) { this.wf.http = 'ok'; h += `<div class="io-block"><div class="io-title">The web server <span class="io-note">(simulated)</span></div><div class="io-tools"><button id="hs-btn" class="hold small">🌐 Server: answers 200</button></div><div id="hs-last" class="io-val">—</div></div>`; }
    if (w.includes('wifirouter')) { this.wf.router = true; this.wf.passOk = true; h += `<div class="io-block"><div class="io-title">Your router <span class="io-note">(simulated)</span></div><div class="io-tools"><button id="wf-router" class="hold small">📶 Router: ON</button><button id="wf-pass" class="hold small">🔑 Password: correct</button></div></div>
        <div class="io-block pirstat tight"><div><span>WiFi.begin()</span><b id="wf-s1">—</b></div><div class="arrow">→</div><div><span>Router</span><b id="wf-s2">—</b></div><div class="arrow">→</div><div><span>WiFi.status()</span><b id="wf-s3">—</b></div></div><div id="wf-note" class="io-note"></div>`; }
    if (w.includes('pisens')) h += `<div class="io-block"><div class="io-title">The air around the sensor <span class="io-note">(simulated)</span></div><div class="throw"><label>Temperature</label><input id="th-t" type="range" min="-10" max="60" step="0.5" value="${this.th.t}"><b id="th-tv"></b></div><div class="throw" ${w.includes('nohum') ? 'style="display:none"' : ''}><label>Humidity</label><input id="th-h" type="range" min="0" max="100" step="1" value="${this.th.h}"><b id="th-hv"></b></div></div>
        <div class="io-tools"><button id="th-plug" class="hold small">🔌 Unplug the SDA wire</button></div><div id="ps-note" class="io-note"></div>`;
    if (w.includes('bridge2')) h += `<div class="io-block"><div class="io-title">The air around the sensor <span class="io-note">(simulated)</span></div><div class="throw"><label>Temperature</label><input id="th-t" type="range" min="10" max="40" step="0.5" value="${this.th.t}"><b id="th-tv"></b></div></div>
        <div class="io-block pirstat tight"><div><span>Sketch · Thermo</span><b id="b2-sk">—</b></div><div class="arrow">→</div><div><span>Bridge</span><b id="b2-br">—</b></div><div class="arrow">→</div><div><span>Python · decides</span><b id="b2-py">—</b></div><div class="arrow">→</div><div><span>RGB LED 3</span><b id="b2-led">—</b></div></div><div id="b2-note" class="io-note"></div>`;
    if (w.includes('bridge')) h += `<div class="io-block pirstat tight"><div><span>Python · main.py</span><b id="br-py">—</b></div><div class="arrow">→</div><div><span>Bridge (router · UART)</span><b id="br-rt">—</b></div><div class="arrow">→</div><div><span>Sketch · set_led()</span><b id="br-sk">—</b></div><div class="arrow">→</div><div><span>RGB LED 3</span><b id="br-led">—</b></div></div><div id="br-note" class="io-note"></div>`;
    if (w.includes('thermo')) h += `<div class="io-block"><div class="io-title">The air around the sensor <span class="io-note">(simulated — you decide)</span></div>
        <div class="throw"><label>Temperature</label><input id="th-t" type="range" min="-10" max="60" step="0.5" value="${this.th.t}"><b id="th-tv"></b></div>
        ${w.includes('pixels') ? '' : `<div class="throw"><label>Humidity</label><input id="th-h" type="range" min="0" max="100" step="1" value="${this.th.h}"><b id="th-hv"></b></div>`}</div>
        <div class="io-block pirstat"><div><span>Module power</span><b id="th-pwr">—</b></div><div class="arrow">→</div><div><span>I²C address</span><b id="th-bus">—</b></div><div class="arrow">→</div><div><span>Sketch gets</span><b id="th-out">—</b></div></div>
        <div class="io-tools"><button id="th-plug" class="hold small">🔌 Unplug the Qwiic cable</button></div><div id="th-note" class="io-note"></div>`;
    if (w.includes('relay')) h += `<div class="io-block pirstat"><div><span>D4 → IN</span><b id="rl-pin">—</b></div><div class="arrow">→</div><div><span>Relay</span><b id="rl-rel">—</b></div><div class="arrow">→</div><div><span>Lamp</span><b id="rl-lamp">—</b></div></div>
        <div class="io-tools"><button id="rl-manual" class="hold small">⚡ Energise the coil</button></div><div id="rl-note" class="io-note"></div>
        <table class="kv rtable"><tr><th>Pin D4</th><th>Relay (low-level trigger)</th></tr>
        <tr data-r="low"><td>LOW (0 V)</td><td>ON · COM connected to NO · lamp ON</td></tr><tr data-r="off"><td>${IS_U3 ? 'HIGH (5 V)' : 'released (INPUT)'}</td><td>OFF · COM connected to NC · lamp OFF</td></tr></table>`;
    if (w.includes('motor')) h += `<div class="io-block pirstat"><div><span>D7 → 1A</span><b id="mt-in1">—</b></div><div><span>D8 → 2A</span><b id="mt-in2">—</b></div><div><span>D5 → EN</span><b id="mt-en">—</b></div><div class="arrow">→</div><div><span>Motor</span><b id="mt-mot">—</b></div></div>
        <table class="kv mtable"><tr><th>EN</th><th>1A</th><th>2A</th><th>Motor (L293D datasheet)</th></tr>
        <tr data-r="d1"><td>on</td><td>HIGH</td><td>LOW</td><td>turns · direction 1</td></tr><tr data-r="d2"><td>on</td><td>LOW</td><td>HIGH</td><td>turns · direction 2</td></tr>
        <tr data-r="brake"><td>on</td><td colspan="2">same level</td><td>fast stop (brake)</td></tr><tr data-r="coast"><td>LOW</td><td colspan="2">any</td><td>coasts (free-running stop)</td></tr></table>`;
    if (w.includes('servo')) h += `<div class="io-block pirstat"><div><span>Sketch</span><b id="sv-cmd">—</b></div><div class="arrow">→</div><div><span>Pulse on D9</span><b id="sv-us">—</b></div><div class="arrow">→</div><div><span>Arm angle</span><b id="sv-ang">—</b></div></div>
        <div id="sv-note" class="io-note"></div>
        <div class="io-block"><div class="io-title">Oscilloscope · D9 <span class="io-note">(simulated)</span></div><canvas id="scope" width="560" height="150"></canvas><div id="scope-info" class="io-val"></div></div>`;
    if (w.includes('knob')) h += `<div class="io-block"><div class="io-title">Potentiometer knob</div><input id="knob" type="range" min="0" max="1000" value="${Math.round(this.knobValue() * 1000)}"><div id="knob-val" class="io-val"></div><div class="io-note">or drag the knob in the 3D view</div></div>`;
    if (w.includes('pwm')) h += `<div class="io-block"><div class="io-title">analogWrite(D5, <b id="pwm-v">128</b>)</div><input id="pwm" type="range" min="0" max="255" value="128"></div>`;
    if (w.includes('scope')) h += `<div class="io-block"><div class="io-title">Oscilloscope · ${L.scopePin || 'D5'} <span class="io-note">(simulated)</span></div><canvas id="scope" width="560" height="170"></canvas><div id="scope-info" class="io-val"></div></div>`;
    if (w.includes('audio')) h += `<div class="io-block"><button id="sound" class="hold small">${this.soundOn ? '🔊 Sound on' : '🔇 Sound off'}</button></div>`;
    if (w.includes('editor')) h += this.editorHTML();
    if (IS_E32) h = h.replace(/D4/g, 'GPIO17').replace(/D5/g, 'GPIO16').replace(/Pin D(\d+)/g, 'Pin GPIO$1').replace(/\(D(\d+)/g, '(GPIO$1').replace(/\bD(\d+)\b/g, 'GPIO$1');
    if (IS_U3) h = h.replace(/Pin D(\d+)/g, 'Pin $1').replace(/\(D(\d+)/g, '($1').replace(/\bD(\d+)\b/g, 'pin $1');
    io.innerHTML = h;
    if (this.dvs) for (const d of this.dvs) d.bind();
    if ($('#tch')) { const t = $('#tch'), set = d => { this.touchDown = d; const s = $('#tch-state'); if (s) s.innerHTML = d ? '<b class="lo">Touched</b> → reading drops below the threshold' : 'Not touched'; }; set(false); t.addEventListener('pointerdown', e => { e.preventDefault(); set(true); }); t.addEventListener('pointerup', () => set(false)); t.addEventListener('pointerleave', () => set(false)); }
    if ($('#hold')) {
      const hold = $('#hold');
      const dn = e => { e.preventDefault(); this.pressButton(true); }, up = () => this.pressButton(false);
      hold.addEventListener('pointerdown', dn); hold.addEventListener('pointerup', up); hold.addEventListener('pointerleave', up);
    }
    if ($('#wf-rssi')) { const upd = () => { $('#wf-val').innerHTML = `<b>${this.wf.rssi} dBm</b>`; }; $('#wf-rssi').oninput = e => { this.wf.rssi = +e.target.value; upd(); }; upd(); }
    document.querySelectorAll('.kp-key').forEach(b => { b.onclick = () => { if (!this.sim.running || !this.kp) return; const k = b.dataset.k; this.kp.q.push(k); this.kp.cur = k; this.kp.until = performance.now() + 250; }; });
    if ($('#cl-btn')) { $('#cl-btn').onclick = () => { if (this.sim.running) this.cl.until = performance.now() + 120; }; }
    if ($('#sm-w')) { $('#sm-w').oninput = e => { this.sm.wet = +e.target.value; $('#sm-wv').textContent = this.sm.wet + ' % wet'; }; }
    if ($('#bp-t')) { const upd = () => { $('#bp-tv').textContent = this.bp.t + ' °C'; $('#bp-pv').textContent = this.bp.p + ' hPa'; }; $('#bp-t').oninput = e => { this.bp.t = +e.target.value; upd(); }; $('#bp-p').oninput = e => { this.bp.p = +e.target.value; upd(); }; }
    if ($('#mp-p')) { const upd = () => { $('#mp-pv').textContent = this.mp.pitch + '°'; $('#mp-rv').textContent = this.mp.roll + '°'; $('#mp-wv').textContent = this.mp.rate + ' °/s'; }; $('#mp-p').oninput = e => { this.mp.pitch = +e.target.value; upd(); this.mpShow(); }; $('#mp-r').oninput = e => { this.mp.roll = +e.target.value; upd(); this.mpShow(); }; $('#mp-w').oninput = e => { this.mp.rate = +e.target.value; upd(); }; }
    if ($('#ir-45')) { for (const [id, cmd] of [['#ir-45', 0x45], ['#ir-0c', 0x0C], ['#ir-18', 0x18], ['#ir-5e', 0x5E]]) $(id).onclick = () => { if (!this.sim.running) return; const io = Object.values((this.lesson && this.lesson.io) || {}).find(x => x.kind === 'irrx'); if (!(io && this.wired(io) && this.board.powered)) return; this.irq.push(cmd); const r = this.bench.get('ir1'); if (r && r.setActive) { r.setActive(true); setTimeout(() => r.setActive(false), 250); } }; }
    if ($('#ntp-btn')) { $('#ntp-btn').onclick = () => { if (!this.sim.running) this.wf.ntp = !this.wf.ntp; }; }
    if ($('#mq-up')) { $('#mq-up').onclick = () => { if (!this.sim.running) this.mq.up = !this.mq.up; }; const send = p => () => { const M = this.mq; if (!this.sim.running || !M.conn) return; M.log.push('home/led = ' + p); if (M.subs.has('home/led')) M.inbox.push({ topic: 'home/led', payload: p }); }; $('#mq-on').onclick = send('ON'); $('#mq-off').onclick = send('OFF'); }
    if ($('#hs-btn')) { $('#hs-btn').onclick = () => { if (!this.sim.running) this.wf.http = { ok: '404', '404': 'down', down: 'ok' }[this.wf.http]; }; }
    if ($('#wf-router')) { $('#wf-router').onclick = () => { if (!this.sim.running) this.wf.router = !this.wf.router; }; $('#wf-pass').onclick = () => { if (!this.sim.running) this.wf.passOk = !this.wf.passOk; }; }
    if ($('#m-load')) { $('#m-load').value = this.mLoad; $('#m-load').onchange = e => { this.mLoad = e.target.value; }; }
    if ($('#q-r')) { $('#q-r').value = String(this.qR); $('#q-r').onchange = e => { this.qR = +e.target.value; }; }
    if ($('#neo-shift')) $('#neo-shift').onclick = () => { if (!this.sim.running) this.neoShift = !this.neoShift; };
    if ($('#lcd-addr')) $('#lcd-addr').onclick = () => { if (!this.sim.running) this.lcdAddr = this.lcdAddr === 0x27 ? 0x3F : 0x27; };
    if ($('#oled-addr')) $('#oled-addr').onclick = () => { if (!this.sim.running) this.oledAddr = this.oledAddr === 0x3C ? 0x3D : 0x3C; };
    if ($('#jx')) { const sl = (id, ax) => { $(id).oninput = e => { this.joyPos[ax] = +e.target.value / 100; this.joyShow(); }; }; sl('#jx', 'x'); sl('#jy', 'y'); const sw = $('#jsw'); const dn = e => { e.preventDefault(); this.joySw = true; this.joyShow(); }, up = () => { this.joySw = false; this.joyShow(); }; sw.addEventListener('pointerdown', dn); sw.addEventListener('pointerup', up); sw.addEventListener('pointerleave', up); this.joyShow(); }
    if ($('#enc-l')) { $('#enc-l').onclick = () => this.encTurn(-1); $('#enc-r').onclick = () => this.encTurn(1); const sw = $('#enc-sw'); const dn = e => { e.preventDefault(); this.encSw = true; this.encShow(); }, up = () => { this.encSw = false; this.encShow(); }; sw.addEventListener('pointerdown', dn); sw.addEventListener('pointerup', up); sw.addEventListener('pointerleave', up); this.encShow(); }
    if ($('#knob')) { $('#knob').oninput = e => this.setKnob(+e.target.value / 1000); this.setKnob(this.knobValue()); }
    if ($('#lux')) { $('#lux').oninput = e => this.setLux(this.sliderToLux(+e.target.value)); document.querySelectorAll('[data-lux]').forEach(b => b.onclick = () => this.setLux(+b.dataset.lux)); this.setLux(this.lux); }
    if ($('#dist')) { $('#dist').oninput = e => this.setDist(+e.target.value); $('#dist').onchange = e => this.setDist(+e.target.value, true); document.querySelectorAll('[data-dist]').forEach(b => b.onclick = () => this.setDist(+b.dataset.dist, true)); this.setDist(this.distCm); }
    else this.hideSonar();
    this.refreshPickTargets();
    if ($('#th-t')) { $('#th-t').oninput = e => this.setThermo({ t: +e.target.value }); if ($('#th-h')) $('#th-h').oninput = e => this.setThermo({ h: +e.target.value }); if ($('#th-plug')) $('#th-plug').onclick = () => { if (!this.sim.running) this.th.unplug = !this.th.unplug; }; this.setThermo({}); }
    document.querySelectorAll('.pkey').forEach(b => b.onclick = () => { if (!this.board.powered) return; this.onTone('p11', +b.dataset.hz, 400); });
    if ($('#rl-manual')) $('#rl-manual').onclick = () => { if (this.rly && !this.sim.running) this.rly.manual = !this.rly.manual; };
    if ($('#pir-wave')) { $('#pir-wave').onclick = () => this.pirWave(); $('#pir-still').onclick = () => this.pirHoldStill(); }
    this.showRoom(w.includes('pir') && !!this.pirSensor());
    const bleOn = w.includes('ble') && L.steps.slice(0, this.stepIdx + 1).some(st => st.phone);
    const piwebOn = w.includes('piweb') && L.steps.slice(0, this.stepIdx + 1).some(st => st.phone);   // the phone appears at the step that starts the server
    this.showPhone(w.includes('dash') || w.includes('home') || piwebOn || bleOn, w.includes('ble') ? 'ble' : w.includes('piweb') ? 'piweb' : w.includes('home') ? 'home' : 'dash');
    if ($('#tempc')) { $('#tempc').oninput = e => this.setTemp(+e.target.value); this.setTemp(this.tempC); }
    this.lamp.intensity = w.includes('light') ? this.lampIntensity() : 0;
    if ($('#pwm')) $('#pwm').oninput = e => this.applyManualPwm(+e.target.value);
    this.scope = $('#scope') ? new Scope($('#scope'), $('#scope-info')) : null;
    if (w.includes('servo')) { this.servoState = null; const sv = this.servoObj(); if (sv) { sv.target = 90; sv.setAngle(90); } }
    if ($('#sound')) $('#sound').onclick = e => { this.soundOn = !this.soundOn; e.currentTarget.textContent = this.soundOn ? '🔊 Sound on' : '🔇 Sound off'; if (!this.soundOn) this.stopSound(); };
    if (w.includes('editor')) this.bindEditor();
  }

  renderCode(code, explain, code2, code3) {
    this.codeText = code;
    // optional extra files: Python (lines numbered 101+), browser JavaScript (201+); the sketch keeps 1+
    const L1 = code.split('\n'), L2 = code2 ? code2.split('\n') : null, L3 = code3 ? code3.split('\n') : null;
    const row = (l, n) => `<span class="ln" data-n="${n}" data-ln="${n > 200 ? n - 200 : n > 100 ? n - 100 : n}">${highlight(l) || ' '}</span>`;
    $('#code').innerHTML = (L2 ? '<span class="fhdr">python/main.py — runs on the Linux side</span>' + L2.map((l, i) => row(l, 101 + i)).join('') : '')
      + (L3 ? '<span class="fhdr">assets/app.js — runs in the browser</span>' + L3.map((l, i) => row(l, 201 + i)).join('') : '')
      + (L2 ? '<span class="fhdr">sketch/sketch.ino — runs on the microcontroller</span>' : '') + L1.map((l, i) => row(l, i + 1)).join('');
    $('#code').querySelectorAll('.ln').forEach(el => el.onclick = () => {
      $('#code').querySelectorAll('.ln.sel').forEach(x => x.classList.remove('sel'));
      el.classList.add('sel');
      const n = +el.dataset.n, lines = n > 200 ? L3 : n > 100 ? L2 : L1, t = lines[(n > 200 ? n - 200 : n > 100 ? n - 100 : n) - 1].trim();
      $('#explain').innerHTML = (explain && explain[n]) || (t.startsWith('//') ? 'A <b>comment</b>: notes for humans. The compiler ignores everything after <code>//</code>.' : t === '}' || t === '};' ? 'Closing brace: ends the block that started with <code>{</code>.' : t === '' ? 'An empty line (only for readability).' : /^[\d,\s]+,?$/.test(t) ? 'One row of the picture: 13 values, one per LED (left → right).' : 'Click another line.');
    });
    $('#explain').innerHTML = 'Click a line to see what it does.';
  }

  // ---- Pi lesson 8: Terminal on the 3D monitor. Results are simulated; the board reacts (LEDs) ----
  async actFlicker(ms) { const t0 = performance.now(); while (performance.now() - t0 < ms) { this.board.setLed('act', Math.random() < 0.5); await sleep(70 + Math.random() * 110); } this.board.setLed('act', false); }
  // tiny in-memory file system of the practice Terminal: ls, ls -la, cd, mkdir, touch, cp, cat, rm
  piFs(q, P, add) {
    const parts = q.split(' '), c0 = parts[0], args = parts.slice(1);
    const here = P.cwd, key = n => (here === '~' ? '~' : here) + '/' + n;
    const kids = d => Object.keys(P.fs).filter(k => k.startsWith(d + '/') && !k.slice(d.length + 1).includes('/')).map(k => k.slice(d.length + 1)).sort();
    const ok = n => /^[\w.\-]+$/.test(n) && n !== '.' && n !== '..';
    if (c0 === 'ls' && (!args.length || args[0] === '-la')) {
      const names = kids(here), long = args[0] === '-la';
      if (!long) { if (names.length) P.lines.push({ segs: names.flatMap((n, i) => [{ t: n, c: P.fs[key(n)] === 'dir' ? '#79b8ff' : '#d6dbe0' }, { t: i < names.length - 1 ? '  ' : '' }]) }); return true; }
      add('drwxr-xr-x user user 4096  .'); add('drwxr-xr-x root root 4096  ..');
      for (const n of names) P.lines.push({ segs: [{ t: P.fs[key(n)] === 'dir' ? 'drwxr-xr-x user user 4096  ' : '-rw-r--r-- user user    0  ', c: '#d6dbe0' }, { t: n, c: P.fs[key(n)] === 'dir' ? '#79b8ff' : '#d6dbe0' }] });
      add('(simulated listing — permissions and sizes are examples)', '#8fa3b5'); return true;
    }
    if (c0 === 'cd' && args.length === 1) {
      const t = args[0];
      if (t === '~' || t === '/home/user') P.cwd = '~';
      else if (t === '..') { if (here !== '~') P.cwd = here.slice(0, here.lastIndexOf('/')); }
      else if (/^\/home\/\S+$/.test(t)) add(`bash: cd: ${t}: No such file or directory`, '#ff9b8e');
      else if (P.fs[key(t)] === 'dir') P.cwd = key(t);
      else if (P.fs[key(t)]) add(`bash: cd: ${t}: Not a directory`, '#ff9b8e');
      else add(`bash: cd: ${t}: No such file or directory`, '#ff9b8e');
      return true;
    }
    if (c0 === 'mkdir' && args.length === 1) { if (!ok(args[0])) add(`mkdir: invalid name '${args[0]}'`, '#ff9b8e'); else if (P.fs[key(args[0])]) add(`mkdir: cannot create directory '${args[0]}': File exists`, '#ff9b8e'); else P.fs[key(args[0])] = 'dir'; return true; }
    if (c0 === 'touch' && args.length === 1) { if (!ok(args[0])) add(`touch: invalid name '${args[0]}'`, '#ff9b8e'); else if (!P.fs[key(args[0])]) P.fs[key(args[0])] = 'file'; return true; }
    if (c0 === 'cp' && args.length === 2) {
      if (!P.fs[key(args[0])]) add(`cp: cannot stat '${args[0]}': No such file or directory`, '#ff9b8e');
      else if (P.fs[key(args[0])] === 'dir') add(`cp: -r not specified; omitting directory '${args[0]}'`, '#ff9b8e');
      else if (!ok(args[1])) add(`cp: invalid name '${args[1]}'`, '#ff9b8e');
      else P.fs[key(args[1])] = 'file';
      return true;
    }
    if (c0 === 'cat' && args.length === 1) { const t = P.fs[key(args[0])]; if (!t) add(`cat: ${args[0]}: No such file or directory`, '#ff9b8e'); else if (t === 'dir') add(`cat: ${args[0]}: Is a directory`, '#ff9b8e'); return true; }
    if (c0 === 'rm' && args.length === 1) { const t = P.fs[key(args[0])]; if (!t) add(`rm: cannot remove '${args[0]}': No such file or directory`, '#ff9b8e'); else if (t === 'dir') add(`rm: cannot remove '${args[0]}': Is a directory`, '#ff9b8e'); else delete P.fs[key(args[0])]; return true; }
    return false;
  }
  // Camera commands of Lesson 13 (rpicam-hello, rpicam-still). They only work when the ribbon cable is plugged into J3. The preview picture is an illustration.
  async piCam(lc, q, P, add) {
    const wait = async ms => { P.abort = false; const t0 = performance.now(); while (performance.now() - t0 < ms && !P.abort && P.mode === 'on') await sleep(60); P.abort = false; };
    if (!(this.acc && this.acc.camlink.on)) { add('(practice terminal) No camera found — push the ribbon cable into the CAMERA connector first.', '#ff9b8e'); return; }
    if (lc.startsWith('rpicam-hello')) {
      const forever = lc === 'rpicam-hello --timeout 0' || lc === 'rpicam-hello -t 0';
      if (lc === 'rpicam-hello -n') { add('(simulated) running without a preview window; nothing is shown.', '#8fa3b5'); await sleep(1200); return; }
      if (lc !== 'rpicam-hello' && !forever) { add(`${q.split(' ')[0]}: only the listed practice options work here`, '#ff9b8e'); return; }
      P.preview = { kind: 'live' };
      if (forever) add('(the preview keeps running — click the input box and press Ctrl+C to stop it)', '#8fa3b5');
      await wait(forever ? 3600000 : 5000);
      P.preview = null; if (forever) add('^C', '#8fa3b5');
      return;
    }
    const m = lc.match(/^rpicam-still (?:--encoding (?:png|jpg) )?--output ([\w.\-]+)$/);
    if (!m) { add('rpicam-still: only the listed practice options work here', '#ff9b8e'); return; }
    const name = m[1], here = P.cwd;
    P.preview = { kind: 'live' }; await wait(5000);             // the preview runs for the timeout (default 5 s), then the picture is taken
    P.preview = { kind: 'photo', name }; P.fs[here + '/' + name] = 'file';
    add(`(simulated) saved ${name} — a real rpicam-still also prints some information lines`, '#8fa3b5');
    await sleep(3500); P.preview = null;
  }
  async piCmd(raw) {
    const P = this.pios; if (!P || P.busy || P.mode !== 'on' || !this.board.powered) return;
    const q = raw.trim().replace(/\s+/g, ' '); if (!q) return;
    P.busy = true; P.cur = '';
    const add = (t, c) => P.lines.push({ text: t, c });
    P.lines.push({ prompt: true, cwd: P.cwd, text: q });
    const lc = q.toLowerCase();
    try {
      if (lc === 'vcgencmd measure_temp') { P.temp = Math.round((P.temp + (Math.random() - 0.5) * 1.2) * 10) / 10; add(`temp=${P.temp.toFixed(1)}'C`); }
      else if (lc === 'pinout') {
        add('J8:   (simulated map — physical pin / name)', '#8fa3b5');
        for (let r = 0; r < 20; r++) { const a = J8[2 * r], b = J8[2 * r + 1], f = p => p.gpio === null ? p.label : 'GPIO' + p.gpio; add(`${f(a).padStart(7)} (${String(a.pin).padStart(2)}) (${String(b.pin).padStart(2)}) ${f(b)}`); }
      }
      else if (lc === 'sudo apt update') { add('[sudo] password for user: (simulated)', '#8fa3b5'); await this.actFlicker(1800); add('Reading package lists... Done'); }
      else if (lc === 'sudo apt full-upgrade') { add('[sudo] password for user: (simulated)', '#8fa3b5'); await this.actFlicker(2200); add('Reading package lists... Done'); add('Calculating upgrade... Done'); }
      else if (lc === 'sudo raspi-config') { add('[sudo] password for user: (simulated)', '#8fa3b5'); add('Opens the Raspberry Pi configuration tool (text menu). Press Esc to leave it. (not simulated further)', '#8fa3b5'); }
      else if (lc === 'sudo reboot') {
        add('[sudo] password for user: (simulated)', '#8fa3b5'); await sleep(500);
        P.mode = 'reboot'; this.actFlicker(3200); await sleep(3400); P.lines = []; P.cwd = '~'; P.mode = 'on';
      }
      else if (lc === 'sudo poweroff') {
        add('[sudo] password for user: (simulated)', '#8fa3b5'); await sleep(500);
        P.mode = 'shutdown'; await this.actFlicker(1500);
        for (let i = 0; i < 6; i++) { this.board.setLed('act', true); await sleep(110); this.board.setLed('act', false); await sleep(130); }   // "safe to unplug" flashes
        this.board.setPowerLed(false); P.mode = 'off';
      }
      else if (lc === 'ls -l /home') { add('total 4'); add('drwx------ 3 user user 4096 example output  user', '#d6dbe0'); }
      else if (lc === 'groups') add('user ... gpio ...   (list shortened)');
      else if (lc === 'passwd') { add('Changing password for user.'); add('Current password: (simulated)', '#8fa3b5'); }
      else if (lc === 'python3') { add('Python 3 — version depends on your system. (simulated; type exit() to leave)', '#8fa3b5'); }
      else if (lc === 'df -h') { add('Filesystem      Size  Used Avail Use% Mounted on'); add('/dev/root        29G  5.1G   22G  19% /   (example numbers)', '#8fa3b5'); }
      else if (lc === 'uname -r') add('6.x.x-v8   (example — your kernel version differs)');
      else if (lc === 'hostname -i' && q.includes('-I')) add('192.168.1.131   (example address from the documentation)');
      else if (/^ping \S+$/.test(lc)) {
        if (lc === 'ping raspberrypi.local') { add('PING raspberrypi.local (192.168.1.131): 56 data bytes'); await sleep(500); add('64 bytes from 192.168.1.131: icmp_seq=0 ttl=255 time=2.618 ms'); add('(press Ctrl+C to stop)  — example output from the documentation', '#8fa3b5'); }
        else add(`ping: ${q.split(' ')[1]}: Name or service not known`, '#ff9b8e');
      }
      else if (/^ssh \S+@\S+$/.test(lc)) add('ssh runs on ANOTHER computer to log in to your Pi — not here on the Pi itself.', '#8fa3b5');
      else if (lc === 'sudo nano /boot/firmware/config.txt') { add('[sudo] password for user: (simulated)', '#8fa3b5'); add('Opens the nano text editor. Ctrl+O saves, Ctrl+X exits. (not simulated further)', '#8fa3b5'); }
      else if (/^rpicam-(hello|still)\b/.test(lc)) await this.piCam(lc, q, P, add);
      else if (this.piFs(q, P, add)) { /* handled by the file-system commands */ }
      else add(`${q.split(' ')[0]}: this is not one of the practice commands`, '#ff9b8e');
    } finally { P.busy = false; }
  }
  bindTerm() {
    const t = $('#panel .term'); if (!t) return;
    const out = t.querySelector('.term-out'), inp = t.querySelector('.term-in'), chips = t.querySelector('.term-chips');
    const norm = c => c.trim().replace(/\s+/g, ' ').toLowerCase();
    const run = raw => {
      const q = norm(raw); if (!q) return;
      const hit = TERM_CMDS.find(c => norm(c.cmd) === q) || TERM_CMDS.find(c => c.re && c.re.test(q));
      out.querySelector('.term-hint')?.remove();
      const line = document.createElement('div'); line.className = 'term-line';
      line.innerHTML = `<div><span class="term-ps">$</span> <b>${esc(raw.trim())}</b></div>` + (hit
        ? `<div class="term-ans">${esc(hit.does)} <span class="term-src">(${esc(hit.src)})</span></div>`
        : `<div class="term-ans dim">Not one of the practice commands — pick one from the list below.</div>`);
      out.appendChild(line); out.scrollTop = out.scrollHeight;
      this.piCmd(raw);
    };
    const lid = this.lesson && this.lesson.id, tg = this.lesson && this.lesson.termGroups;
    const shown = TERM_CMDS.filter(c => (!c.only || c.only === lid) && (!tg || tg.includes(c.g)));
    const groups = [...new Set(shown.map(c => c.g))].sort((a, b) => tg ? tg.indexOf(a) - tg.indexOf(b) : 0);
    chips.innerHTML = `<button class="term-chip term-power" style="display:none">⏻ Plug the power in again</button>` + groups.map(g => `<div class="term-grp">${esc(g)}</div>` + shown.filter(c => c.g === g).map(c => `<button class="term-chip" data-c="${esc(c.cmd)}">${esc(c.cmd)}</button>`).join('')).join('');
    chips.querySelectorAll('.term-chip[data-c]').forEach(b => b.onclick = () => run(b.dataset.c));
    const pw = chips.querySelector('.term-power');
    pw.onclick = () => { this.board.setPowerLed(true); this.pios.lines = []; this.pios.cwd = '~'; this.pios.mode = 'boot'; this.bootAnimation(6000); };
    clearInterval(this.termTimer); this.termTimer = setInterval(() => { if (!document.body.contains(pw)) { clearInterval(this.termTimer); return; } pw.style.display = this.pios.mode === 'off' ? '' : 'none'; }, 250);
    // live typing is shown on the 3D monitor too
    inp.oninput = () => { this.pios.cur = inp.value; };
    inp.onkeydown = e => { if (e.ctrlKey && e.key.toLowerCase() === 'c') this.pios.abort = true; if (e.key === 'Enter') { run(inp.value); inp.value = ''; this.pios.cur = ''; } e.stopPropagation(); };
  }
  hideAcc() { if (this.acc) for (const a of this.acc.all) { a.set(false); a.on = false; } this.pios = { mode: 'on', lines: [], cwd: '~', cur: '', busy: false, temp: 46.2, fs: {} }; this.bootToken = this.bootToken; }
  async applyAcc(i, prev, alive) {
    const L = this.lesson; let list = null;
    for (let k = 0; k <= i; k++) if (L.steps[k].acc) list = L.steps[k].acc;
    if (!list) { this.hideAcc(); return; }
    for (const [key, a] of Object.entries(this.acc)) {
      if (key === 'all') continue;
      const want = list.includes(key);
      if (want && !a.on) { a.on = true; if (i === prev + 1 && alive()) await (a.insert ? a.insert(true) : a.connect(true)); else a.set(true); }
      else if (!want && a.on) { a.on = false; a.set(false); }
    }
    this.refreshPickTargets();
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
      this.showMotor(!!(L.widgets && L.widgets.includes('motor')) && !!this.bench.get('mot1'));
      this.showRelay(!!((L.widgets && L.widgets.includes('relay')) || L.relay3d) && !!this.bench.get('rel1'));
      { const rm = this.bench.get('rel1'); if (rm) rm.setCutaway(!!S.cutaway); }
      if (S.view === 'room') this.frameRoom();
      if (S.view === 'relayclose') this.view('relayclose');
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
    if (this.acc) { await this.applyAcc(i, prev, alive); if (!alive()) return; }
    const st = L.steps.some(x => x.power !== undefined) ? this.stepState(i) : {};
    if (st.power === false && this.usbPlugged) await this.plug(false);      // going Back to a step where the power is off unplugs the cable again (all boards)
    if (!alive()) return;
    if (st.power === true) await this.ensurePower();
    if (!alive()) return;
    await this.doAction(S.action, tok);
  }

  async doAction(a, tok) {
    const alive = () => tok === this.stepTok;
    switch (a) {
      case 'plugUsb': await sleep(700); if (!alive()) return; await this.plug(true); this.toast('Power LED on — the board is starting.'); this.bootAnimation(9000); break;
      case 'piboot': await this.ensurePower(); if (!alive()) return; this.toast('Red PWR LED on — the Raspberry Pi is starting.'); this.bootAnimation(14000); break;
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
    this.bindTerm();
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
  btnPin() { const L = this.lesson; if (!IS_PI && !IS_E32 && L && L.io) { const k = Object.keys(L.io).find(p => L.io[p].kind === 'button'); if (k) return IS_U3 ? 'pin ' + k.slice(1) : k; } return BTN_PIN; }
  pressButton(down) {
    const b = this.bench.get('btn1') || (this.bench.tray || []).map(t => t.obj).find(o => o.setPressed);
    if (b && b.setPressed) b.setPressed(down);
    this.buttonDown = down;
    if (this.dvs) for (const d of this.dvs) d.button(down);
    const s = $('#btn-state');
    if (s) s.innerHTML = IS_PI ? (down ? '<b class="lo">Pressed</b> → GPIO2 connected to GND → LOW → is_pressed = True' : 'Released → GPIO2 reads HIGH (pull-up) → is_pressed = False') : down ? `<b class="lo">Pressed</b> → ${this.btnPin()} connected to GND → reads LOW` : `Released → ${this.btnPin()} reads HIGH (pull-up)`;
  }
  // ---- light sensor model: typical GL5528 (datasheet: 10–20 kΩ at 10 lux, γ = 0.6, dark ≥ 1 MΩ) — 15 kΩ at 10 lux
  ldrOhms(lux = this.lux) { return 15000 * Math.pow(Math.max(lux, 0.001) / 10, -0.6); }
  ldrVolts() { return LOGIC_V * 10000 / (this.ldrOhms() + 10000); }
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
    const el = $('#lux-val'); if (el) el.innerHTML = `≈ <b>${lx} lux</b> → LDR ≈ <b>${fmtR}</b> → A0 ≈ <b>${V.toFixed(2)} V</b> → ${ADC_BITS} ≈ <b>${adcCount(V)}</b>`;
  }
  // ---- HC-SR04 model: datasheet µs = cm × 58; UNO Q pulseIn() resolves 100 µs (Zephyr tick, see Lesson 13)
  echoUs() { return this.distCm * 58; }
  pulseInUs() { return IS_U3 ? Math.floor(this.echoUs()) : Math.floor(this.echoUs() / 100) * 100; }   // UNO R3 (AVR core): 16 clock cycles per count = 1 µs
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
    if (el) el.innerHTML = `Obstacle <b>${this.distCm.toFixed(1)} cm</b> → ECHO HIGH ≈ <b>${Math.round(e)} µs</b> → pulseIn() on ${IS_U3 ? 'UNO R3' : 'UNO Q'} ≈ <b>${q} µs</b> → <b>${(q / 58).toFixed(1)} cm</b>`;
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
    const uio = Object.entries((this.lesson && this.lesson.io) || {}).find(([, x]) => x.kind === 'hcsr04'), echoN = IS_U3 && uio ? uio[0].slice(1) : '8', trigN = IS_U3 && uio ? uio[1].trig.slice(1) : '7';
    const rows = [[IS_U3 ? `TRIG (pin ${trigN})` : `TRIG (D${trigN})`, 18], ['Burst from T', 46], [IS_U3 ? `ECHO (pin ${echoN})` : `ECHO (D${echoN})`, 74]];
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
  // ---- Lesson 20: Python <-> sketch over the Bridge ----------------------------------------------------
  bridgeTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('bridge') || !$('#br-py')) return;
    const B = this.br, run = this.sim.running, a = B.arg === null ? '' : (B.arg ? 'True' : 'False');
    const set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; e.className = cls; } };
    const st = run ? B.stage : 'idle';
    set('#br-py', st === 'call' ? `call(“set_led”, ${a})` : st === 'run' ? 'waiting…' : st === 'reply' ? `result = ${a}` : '—', st === 'call' || st === 'reply' ? 'on' : 'off');
    set('#br-rt', st === 'call' ? 'request →' : st === 'run' ? 'delivered' : st === 'reply' ? '← answer' : '—', st === 'idle' ? 'off' : 'on');
    set('#br-sk', st === 'run' ? `set_led(${B.arg ? 'true' : 'false'})` : st === 'reply' ? 'returned' : '—', st === 'run' ? 'on' : 'off');
    set('#br-led', run && B.led !== null ? (B.led ? 'ON' : 'OFF') : '—', run && B.led ? 'on' : 'off');
    set('#br-note', !this.board.powered ? 'USB-C is not plugged in — the board has no power.' : !run ? 'Press <b>▶ Run</b>.' : st === 'call' ? 'Python asks: <b>Bridge.call</b> sends a request to the sketch and waits.' : st === 'run' ? 'The sketch runs <b>set_led</b> and sets the pin (LOW = LED on).' : st === 'reply' ? 'The sketch’s return value travels back to Python.' : 'Python waits one second, then flips the value again.', 'io-note');
  }
  bridge2Tick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('bridge2') || !$('#b2-sk')) return;
    const B = this.br, run = this.sim.running, ok = this.thermoOk(), st = run ? B.stage : 'idle';
    const set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; e.className = cls; } };
    const c = B.c === undefined ? '' : B.c.toFixed(1) + ' °C';
    set('#b2-sk', run && ok && c ? c : '—', run && ok && c ? 'on' : 'off');
    set('#b2-br', st === 'notify' ? 'notify →' : st === 'stored' ? 'delivered' : st === 'call' ? '← call' : st === 'reply' ? '← result' : '—', ['notify', 'stored', 'call', 'reply'].includes(st) ? 'on' : 'off');
    set('#b2-py', st === 'stored' ? `stored ${c}` : st === 'decided' ? (B.hot ? 'HOT &gt; 28 °C' : 'OK ≤ 28 °C') : st === 'call' || st === 'reply' ? 'call set_led' : '—', st === 'decided' && B.hot ? 'on' : st === 'idle' ? 'off' : 'on');
    set('#b2-led', run && B.led !== null ? (B.led ? 'ON' : 'OFF') : '—', run && B.led ? 'on' : 'off');
    set('#b2-note', !this.board.powered ? 'USB-C is not plugged in — the board has no power.' : !run ? 'Press <b>▶ Run</b>, then move the temperature slider.' : st === 'notify' ? 'The sketch <b>notifies</b> Python with the new reading (no waiting).' : st === 'stored' ? 'Python’s <b>on_reading</b> function stores the numbers.' : st === 'decided' ? 'Python decides: above 28 °C is “hot”.' : st === 'call' ? 'The state changed, so Python <b>calls</b> set_led.' : st === 'reply' ? 'The sketch switched the LED and answered.' : 'Nothing changed, so Python sends nothing to the sketch.', 'io-note');
  }
  // ---- Lesson 22: the browser (phone) showing the dashboard ----------------------------------------------
  showPhone(on, kind = 'dash') {
    let p = $('#phone');
    if (!on) { if (p) p.remove(); return; }
    if (p && p.dataset.kind === kind) return;
    if (p) p.remove();
    p = document.createElement('div'); p.id = 'phone'; p.dataset.kind = kind;
    if (kind === 'piweb') {
      p.classList.add('live');
      p.innerHTML = `<div class="ph-cap">Your phone (tap the links)</div><div class="ph-frame"><div class="ph-bar">${IS_E32 ? 'http://192.168.1.42/' : 'http://&lt;pi-ip&gt;:5000'}</div><div class="ph-body" id="pw-body"></div></div>`;
      $('#stage').appendChild(p);
      this.pw = { up: false, lit: false };
      this.pwRender();
      return;
    }
    if (kind === 'ble') {
      p.classList.add('live');
      p.innerHTML = `<div class="ph-cap">Your phone: BLE scanner app (simulated)</div><div class="ph-frame"><div class="ph-bar">BLE scanner</div><div class="ph-body" id="bl-body"></div></div>`;
      $('#stage').appendChild(p);
      this.bl = { adv: false, conn: false, val: '0' };
      this.bleRender();
      return;
    }
    if (kind === 'home') {
      p.classList.add('live');
      p.innerHTML = `<div class="ph-cap">Your phone (tap the buttons)</div><div class="ph-frame"><div class="ph-bar">http://&lt;board-ip&gt;:7000</div><div class="ph-body"><div class="ph-title">Smart room</div><div class="ph-card"><span>Temperature</span><b id="ph-t">--</b></div><div class="ph-card"><span>Lamp</span><b id="ph-l">--</b></div><button class="ph-btn" id="ph-mode">Mode: --</button><button class="ph-btn" id="ph-lamp">Lamp: switch</button><div class="ph-st" id="ph-s">waiting for data…</div></div></div>`;
      $('#stage').appendChild(p);
      $('#ph-mode').onclick = () => { if (this.sim.running) this.uiq.push('toggle_mode'); };
      $('#ph-lamp').onclick = () => { if (this.sim.running) this.uiq.push('toggle_lamp'); };
      return;
    }
    p.innerHTML = `<div class="ph-cap">Your phone / computer</div><div class="ph-frame"><div class="ph-bar">http://&lt;board-ip&gt;:7000</div><div class="ph-body"><div class="ph-title">UNO Q dashboard</div><div class="ph-card"><span>Temperature</span><b id="ph-t">--</b></div><div class="ph-card"><span>Humidity</span><b id="ph-h">--</b></div><div class="ph-st" id="ph-s">waiting for data…</div></div></div>`;
    $('#stage').appendChild(p);
  }
  pwRender() {
    const b = $('#pw-body'); if (!b) return;
    const W = this.pw || { up: false, lit: false };
    const sens = W.c !== undefined ? `<div class="pw-t">Pi control panel</div><div class="pw-r">Temperature: <b>${W.c.toFixed(1)} °C</b></div><div class="pw-r">Humidity: <b>${W.rh.toFixed(1)} %</b></div>` : '';
    b.innerHTML = W.up
      ? `${sens}<div class="pw-h">LED is <b class="${W.lit ? 'on' : ''}">${W.lit ? 'ON' : 'OFF'}</b></div><a class="pw-a" data-r="on">Turn on</a> <a class="pw-a" data-r="off">Turn off</a>`
      : `<div class="pw-err">This site can’t be reached<small>${IS_E32 ? 'The ESP32 is not answering. Is the sketch running?' : 'The Raspberry Pi is not answering. Is the server running?'}</small></div>`;
    b.querySelectorAll('.pw-a').forEach(a => a.onclick = () => { if (this.sim.running) this.uiq.push(a.dataset.r); });
  }
  pikeysTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('pikeys')) return;
    const f = this.toneState && this.toneState.f;
    document.querySelectorAll('.pkey').forEach(b => b.classList.toggle('on', !!f && Math.abs(+b.dataset.hz - f) < 0.05));
    const n = $('#pk-note'); if (n) { const k = f && [...document.querySelectorAll('.pkey')].find(b => Math.abs(+b.dataset.hz - f) < 0.05); const h = !this.board.powered ? 'USB-C is not plugged in — the Raspberry Pi has no power.' : k ? `Playing <b>${k.dataset.n}</b> · ${(+k.dataset.hz).toFixed(1)} Hz` : 'Silent. Press <b>▶ Run</b> or click a key.'; if (n.innerHTML !== h) n.innerHTML = h; }
  }
  // ---- ESP32 lesson 13: a simulated BLE scanner app on the phone ----------------------------------------
  bleRender() {
    const b = $('#bl-body'); if (!b) return;
    const B = this.bl;
    if (!B.conn) {
      b.innerHTML = `<div class="pw-t">Scanner</div>${B.adv ? `<div class="pw-r"><b>ESP32-LED</b></div><a class="pw-a" data-b="connect">Connect</a>` : `<div class="pw-err">No device named ESP32-LED<small>The ESP32 is not advertising. Is the sketch running?</small></div>`}`;
    } else {
      b.innerHTML = `<div class="pw-t">ESP32-LED · connected</div><div class="pw-r">Service <b>4fafc201-…</b></div><div class="pw-r">Characteristic <b>beb5483e-…</b><br>READ, WRITE</div><div class="pw-h">Value: <b class="${B.val === '1' ? 'on' : ''}">“${B.val}”</b></div><a class="pw-a" data-b="w1">Write “1”</a> <a class="pw-a" data-b="w0">Write “0”</a>`;
    }
    b.querySelectorAll('.pw-a').forEach(a => a.onclick = () => {
      if (!this.sim.running || !this.bl.adv) return;
      if (a.dataset.b === 'connect') { this.bl.conn = true; this.bleRender(); } else this.uiq.push(a.dataset.b);
    });
  }
  bleTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('ble')) return;
    const run = this.sim.running, B = this.bl;
    if (!run && (B.adv || B.conn)) { B.adv = false; B.conn = false; B.val = '0'; this.bleRender(); }
    const set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; if (cls !== undefined) e.className = cls; } };
    const lit = run && B.val === '1';
    set('#bl-s1', !run ? '—' : B.conn ? 'connected' : 'scanning', run && B.conn ? 'on' : 'off');
    set('#bl-s2', !run ? '—' : B.conn ? 'connected' : B.adv ? 'advertising' : 'starting…', run && B.adv ? 'on' : 'off');
    set('#bl-s3', run ? (lit ? 'ON' : 'OFF') : '—', lit ? 'on' : 'off');
    set('#bl-note', !this.board.powered ? 'USB is not plugged in — the board has no power.' : !run ? 'The sketch is not running: the phone cannot find the ESP32. Press <b>▶ Run</b>.' : !B.adv ? 'Starting Bluetooth…' : !B.conn ? 'The ESP32 is advertising. Tap <b>Connect</b> on the phone.' : 'Tap <b>Write “1”</b> / <b>Write “0”</b> on the phone.', 'io-note');
  }
  // ---- lessons 16 / 17 / 19 / 20: joystick and rotary encoder
  mpShow() { const set = (id, v, t) => { const e = $(id); if (e) { e.value = v; } const l = $(t.l); if (l) l.textContent = t.v; }; set('#mp-p', this.mp.pitch, { l: '#mp-pv', v: this.mp.pitch + '°' }); set('#mp-r', this.mp.roll, { l: '#mp-rv', v: this.mp.roll + '°' }); const o = this.bench.get('mpu1'); if (o && o.setTilt) o.setTilt(this.mp.pitch, this.mp.roll); }
  joyShow() { const o = this.bench.get('joy1'); if (o && o.setStick) o.setStick(this.joyPos.x, this.joyPos.y, this.joySw); }
  encShow() { const o = this.bench.get('enc1'); if (o && o.setPhase) o.setPhase(this.encPh, this.encSw); }
  encTurn(dir) { let n = 4; const step = () => { this.encPh += dir; this.encShow(); if (--n > 0) setTimeout(step, 25); }; step(); }
  // ---- lessons 18 / 19 / 21 / 22: I2C displays driven by the simulated sketch
  i2cDispOk(kind) { const io = Object.values((this.lesson && this.lesson.io) || {}).find(x => x.kind === kind); return !!(io && this.wired(io) && this.board.powered); }
  lcdOp({ op, a, b }) {
    const S = this.lcdSt; if (op === 'probe') return this.lcdAddr === 0x27 && this.i2cDispOk('lcd');
    if (!(this.lcdAddr === 0x27 && this.i2cDispOk('lcd'))) return;
    if (op === 'init') { S.ready = true; S.rows = [' '.repeat(16), ' '.repeat(16)]; S.c = 0; S.r = 0; }
    else if (op === 'backlight') S.bl = true;
    else if (op === 'cursor') { S.c = a; S.r = b; }
    else if (op === 'print') for (const ch of String(a)) { if (S.c >= 0 && S.c < 16 && S.r >= 0 && S.r < 2) S.rows[S.r] = S.rows[S.r].slice(0, S.c) + ch + S.rows[S.r].slice(S.c + 1); S.c++; }
  }
  oledOp({ op, a, b }) {
    const S = this.oledSt;
    if (op === 'begin') return this.i2cDispOk('oled') && this.oledAddr === a;
    if (op === 'clear') { S.buf = ['', '']; S.cy = 0; }
    else if (op === 'cursor') S.cy = Math.max(0, Math.min(1, Math.floor((b || 0) / 8)));
    else if (op === 'println' || op === 'print') { S.buf[S.cy] = String(a); if (op === 'println') S.cy = Math.min(1, S.cy + 1); }
    else if (op === 'display') S.shown = S.buf.slice();
  }
  neoOp({ op, a, b, c, d }) {
    const S = this.neoSt; if (!this.i2cDispOk('neo')) return;
    if (op === 'brightness') S.br = a; else if (op === 'clear') S.px = Array.from({ length: 8 }, () => [0, 0, 0]); else if (op === 'set') { if (a >= 0 && a < 8) S.px[a] = [b, c, d]; } else if (op === 'show') S.shown = S.px.map(p => [p[0], p[1], p[2], S.br / 255]);
  }
  // lessons 21 / 24: PN2222A switching a lamp. Simplified model: Ib = (Vlogic - 0.7 V) / (R + pin resistance), Ic = 100 x Ib, at most what the 6 V lamp draws (20 ohm)
  qCalc() {
    const run = this.sim.running, pw = this.board.powered, V = LOGIC_V, rout = IS_U3 ? 40 : 50;
    if (!(run && pw && this.qPin)) return { ib: 0, ic: 0, state: 'off' };
    const ib = Math.max(0, (V - 0.7) / (this.qR + rout)), want = 100 * ib, lamp = 5.8 / 20, ic = Math.min(want, lamp);
    return { ib, ic, state: want >= lamp ? 'saturated' : 'partly' };
  }
  // lessons 22 / 25: IRLZ44N switching a lamp or a motor. Drain-source resistance from the Infineon datasheet: 35 mohm at 4 V, 25 mohm at 5 V, 22 mohm at 10 V (below 4 V no value: an estimate is used and labelled)
  mTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('mosload')) return;
    if (!this.sim.running) this.qPin = 0;
    const on = this.sim.running && this.board.powered && this.qPin, V = LOGIC_V, motor = this.mLoad === 'motor';
    const rds = V >= 5 ? 0.025 : 0.035 / Math.max(0.1, Math.min(1, (V - 1.5) / 2.5)), rl = motor ? 6 : 20, id = on ? 5.8 / (rl + rds) : 0, lamp = this.bench.get('lamp1');
    if (lamp && lamp.set) lamp.set(!!on && !motor);
    const set = (sel, h) => { const e = $(sel); if (e && e.innerHTML !== h) e.innerHTML = h; };
    set('#m-out', !on ? 'Gate 0 V · load off' : `Gate <b>${V} V</b> (no gate current) → <b>${(id * 1000).toFixed(0)} mA</b> through the load · MOSFET drops <b>${(id * rds * 1000).toFixed(0)} mV</b> · heat <b>${(id * id * rds * 1000).toFixed(0)} mW</b>`);
    set('#m-note', !this.board.powered ? 'USB is not plugged in — the board has no power.' : !this.sim.running ? 'Press <b>▶ Run</b>.' : (V < 4 && motor) ? 'The gate gets only 3.3 V. The datasheet gives no on-resistance below 4 V, so a 1 A motor is not guaranteed to switch cleanly. Use a 5 V gate drive or a gate driver.' : motor ? 'A motor needs a flyback diode across it (not shown in this lesson).' : '');
    const sel = $('#m-load'); if (sel) sel.disabled = this.sim.running;
  }
  qTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('qbase')) return;
    if (!this.sim.running) this.qPin = 0;
    const c = this.qCalc(), lamp = this.bench.get('lamp1');
    if (lamp && lamp.set) lamp.set(c.ic > 0.12);
    const set = (id, h) => { const e = $(id); if (e && e.innerHTML !== h) e.innerHTML = h; };
    set('#q-out', c.state === 'off' ? 'Base current 0 mA · lamp off' : `Base current <b>${(c.ib * 1000).toFixed(c.ib < 0.001 ? 3 : 1)} mA</b> → collector current <b>${(c.ic * 1000).toFixed(0)} mA</b> · ${c.state === 'saturated' ? 'transistor saturated (fully on)' : 'transistor only partly on'}`);
    set('#q-note', !this.board.powered ? 'USB is not plugged in — the board has no power.' : !this.sim.running ? 'Press <b>▶ Run</b>, then try another base resistor (stop the sketch to change it).' : c.state === 'partly' ? 'The base current is too small for this lamp: the collector current is limited to about 100 × the base current and the lamp is dim or dark.' : '');
    const sel = $('#q-r'); if (sel) sel.disabled = this.sim.running;
  }
  // IR lesson: remote buttons are enabled while the sketch runs
  irTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('irremote')) return;
    const run = this.sim.running, set = (id, h) => { const e = $(id); if (e && e.innerHTML !== h) e.innerHTML = h; };
    for (const id of ['#ir-45', '#ir-0c', '#ir-18', '#ir-5e']) { const e = $(id); if (e) e.disabled = !run; }
    set('#ir-note', !this.board.powered ? 'USB is not plugged in — the board has no power.' : !run ? 'Press <b>▶ Run</b>, then press a button of the remote.' : '');
    if (!run) this.irq = [];
  }
  fsTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('fsview') || !this.fsd) return;
    const e = $('#fs-view'), txt = this.fsd['/log.csv'];
    if (e) { const h = this.sim.running || txt ? `/log.csv  (${(txt || '').length} bytes)\n` + (txt || '') : '(no file yet)'; if (e.textContent !== h) e.textContent = h; }
  }
  kpTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('keypad') || !this.kp) return;
    const run = this.sim.running, o = this.bench.get('kp1'), K = this.kp, act = run && performance.now() < K.until;
    if (o && o.setKey) o.setKey(act ? K.cur : null);
    document.querySelectorAll('.kp-key').forEach(b => { b.disabled = !run; });
    const i = '123A456B789C*0#D'.indexOf(K.cur), set = (id, h) => { const e = $(id); if (e && e.innerHTML !== h) e.innerHTML = h; };
    set('#kp-note', !this.board.powered ? 'USB is not plugged in — the board has no power.' : !run ? 'Press <b>▶ Run</b>.' : act && i >= 0 ? `Key <b>${K.cur}</b>: row <b>R${((i / 4) | 0) + 1}</b> is connected to column <b>C${(i % 4) + 1}</b>.` : 'Press a key.');
  }
  stpTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('stepper') || !this.stp) return;
    const run = this.sim.running, S = this.stp, o = this.bench.get('stp1'), pw = this.board.powered;
    if (!run) { S.lv = [0, 0, 0, 0]; }
    const ang = S.steps * 360 / 2048;
    if (o && o.setState) o.setState(S.lv, ang, pw && run);
    const set = (id, h) => { const e = $(id); if (e && e.innerHTML !== h) e.innerHTML = h; };
    set('#stp-out', `Steps: <b>${S.steps}</b> · angle <b>${(((ang % 360) + 360) % 360).toFixed(1)}°</b> · coils ${S.lv.join('')}`);
    set('#stp-note', !pw ? 'USB is not plugged in — the board has no power.' : !run ? 'Press <b>▶ Run</b>.' : '');
  }
  displayTick() {
    this.qTick(); this.mTick(); this.irTick(); this.stpTick(); this.kpTick(); this.fsTick();
    const L = this.lesson; if (!L) return;
    if (!this.sim.running && this.neoSt) this.neoSt.shown = null;
    if (L.io && Object.values(L.io).some(x => x.kind === 'neo')) {
      const o = this.bench.get('neo1'), S = this.neoSt, bad = !!L.neoLow && !this.neoShift, pw = this.board.powered, key = JSON.stringify([pw, S.shown, bad]);
      if (o && o.setColors && key !== this._neoKey) { this._neoKey = key; o.setColors(pw && S.shown ? (bad ? S.shown.map((c, i) => (i % 2 ? [0, 0, 0, 0] : [255, 0, 0, 0.3])) : S.shown) : null); }
      const b = $('#neo-shift'); if (b) { b.disabled = this.sim.running; b.textContent = `Level shifter: ${this.neoShift ? 'present' : 'absent'}`; b.classList.toggle('on', this.neoShift); }
      const n = $('#neo-note'); if (n) { const h = !pw ? 'USB is not plugged in — the board has no power.' : !this.sim.running ? 'Press <b>▶ Run</b>. Stop the sketch to change the level shifter.' : bad ? 'The data signal is 3.3 V but the 5 V pixels need at least 3.5 V (70 %): they show wrong colours or flicker.' : 'The data signal reaches the pixels at the level they need.'; if (n.innerHTML !== h) n.innerHTML = h; }
    } const w = L.widgets || [], run = this.sim.running, pw = this.board.powered;
    if (!run) { if (this.lcdSt) { this.lcdSt.ready = false; this.lcdSt.bl = false; } if (this.oledSt) this.oledSt.shown = null; }
    const set = (id, h) => { const e = $(id); if (e && e.innerHTML !== h) e.innerHTML = h; };
    if (w.includes('lcdaddr')) {
      const S = this.lcdSt, okAddr = this.lcdAddr === 0x27, o = this.bench.get('lcd1');
      const b = $('#lcd-addr'); if (b) { b.disabled = run; b.textContent = `Module address: 0x${this.lcdAddr.toString(16).toUpperCase()}`; b.classList.toggle('on', !okAddr); }
      if (o && o.setContent) { const key = JSON.stringify([pw, run, S.bl, S.ready, okAddr, S.rows]); if (key !== this._lcdKey) { this._lcdKey = key; o.setContent({ powered: pw, backlight: pw && (S.bl || !okAddr), lines: pw && S.ready && okAddr ? S.rows : null }); } }
      set('#lcd-note', !pw ? 'USB is not plugged in — the board has no power.' : !run ? 'Press <b>▶ Run</b>. You can change the module address first (stop the sketch to change it).' : !okAddr ? `The ${IS_PI ? 'program' : 'sketch'} talks to address <b>0x27</b>, but this module answers at <b>0x3F</b>: nobody answers and the screen stays blank.` : 'The module answers at 0x27 and shows the text.');
    }
    if (w.includes('oledaddr')) {
      const S = this.oledSt, okAddr = this.oledAddr === 0x3C, o = this.bench.get('oled1');
      const b = $('#oled-addr'); if (b) { b.disabled = run; b.textContent = `Module address: 0x${this.oledAddr.toString(16).toUpperCase()}`; b.classList.toggle('on', !okAddr); }
      if (o && o.setContent) { const key = JSON.stringify([pw, run, S.shown, okAddr]); if (key !== this._oledKey) { this._oledKey = key; o.setContent({ powered: pw && run && !!S.shown, lines: pw && S.shown ? S.shown : null }); } }
      set('#oled-note', !pw ? 'USB is not plugged in — the board has no power.' : !run ? 'Press <b>▶ Run</b>. You can change the module address first.' : !okAddr ? (IS_PI ? 'The program uses address 0x3C, but this module answers at <b>0x3D</b>: Python raises an error.' : 'The sketch calls begin() with 0x3C, but this module answers at <b>0x3D</b>: begin() returns false.') : 'The display answers at 0x3C; the text appears after display().');
    }
  }
  ctlTick() {
    this.displayTick();
    const L = this.lesson; if (!L) return; const w = L.widgets || [];
    if (w.includes('joy')) { const set = (id, t) => { const e = $(id); if (e && e.textContent !== t) e.textContent = t; }; set('#jx-v', Math.round(this.joyPos.x * 100) + ' %'); set('#jy-v', Math.round(this.joyPos.y * 100) + ' %'); }
    if (w.includes('enc')) { const ph = this.encPh & 3, e = $('#enc-st'); const t = `CLK ${ph === 1 || ph === 2 ? 'LOW' : 'HIGH'} · DT ${ph === 2 || ph === 3 ? 'LOW' : 'HIGH'} · SW ${this.encSw ? 'pressed (LOW)' : 'released (HIGH)'}`; if (e && e.textContent !== t) e.textContent = t; }
  }
  sleepTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('sleep')) return;
    const run = this.sim.running; if (!run) this.slp = false; const sl = run && this.slp, set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; if (cls !== undefined) e.className = cls; } };
    set('#sl-st', !run ? 'off' : sl ? 'deep sleep' : 'awake', run && !sl ? 'on' : 'off');
    set('#sl-t', sl ? Math.max(0, (this.slpEnd - performance.now()) / 1000).toFixed(1) + ' s' : '—', sl ? 'on' : 'off');
    set('#sl-led', run && !sl ? 'on' : 'off', run && !sl ? 'on' : 'off');
  }
  wifiTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('wifirouter')) return;
    const run = this.sim.running, W = this.wf, set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; if (cls !== undefined) e.className = cls; } };
    const ok = W.router && W.passOk, up = run && ok && performance.now() - W.t0 > 2500;
    const nb = $('#ntp-btn'); if (nb) { nb.disabled = run; nb.textContent = `🕒 pool.ntp.org: ${W.ntp ? 'reachable' : 'unreachable'}`; nb.classList.toggle('on', !W.ntp); }
    const M = this.mq, mu = $('#mq-up'); if (mu && M) { mu.disabled = run; mu.textContent = `🖧 Broker: ${M.up ? 'online' : 'offline'}`; mu.classList.toggle('on', !M.up); for (const id of ['#mq-on', '#mq-off']) { const e = $(id); if (e) e.disabled = !(run && M.conn); } set('#mq-log', 'Broker log: ' + (M.log.length ? esc(M.log.slice(-4).join('  ·  ')) : '—')); if (!run) { M.conn = false; M.subs = new Set(); M.inbox = []; } }
    const hb = $('#hs-btn'); if (hb) { hb.disabled = run; hb.textContent = `🌐 Server: ${{ ok: 'answers 200', '404': '404 not found', down: 'down' }[W.http]}`; hb.classList.toggle('on', W.http !== 'ok'); }
    set('#hs-last', W.last ? `Last answer: <b>${W.last.code > 0 ? W.last.code : 'failed (' + W.last.code + ')'}</b>${W.last.body ? ' · ' + esc(W.last.body) : ''}` : '—');
    const r = $('#wf-router'), q = $('#wf-pass');
    if (r) { r.disabled = run; r.textContent = `📶 Router: ${W.router ? 'ON' : 'OFF'}`; r.classList.toggle('on', !W.router); }
    if (q) { q.disabled = run; q.textContent = `🔑 Password: ${W.passOk ? 'correct' : 'wrong'}`; q.classList.toggle('on', !W.passOk); }
    set('#wf-s1', run ? 'started' : '—', run ? 'on' : 'off');
    set('#wf-s2', !run ? '—' : !W.router ? 'not found' : !W.passOk ? 'rejects the password' : 'accepts', run && ok ? 'on' : 'off');
    set('#wf-s3', up ? 'WL_CONNECTED' : run ? 'not connected' : '—', up ? 'on' : 'off');
    set('#wf-note', !this.board.powered ? 'USB is not plugged in — the board has no power.' : !run ? 'Press <b>▶ Run</b>. You can switch the router off or give it a wrong password first (stop the sketch to change).' : up ? 'The router accepted the password and gave the ESP32 an <b>IP address</b>. The loop ends.' : !W.router ? 'No network named “HomeNet” is found: the loop never ends.' : !W.passOk ? 'The password is wrong: the ESP32 never reaches WL_CONNECTED and the loop never ends.' : 'Joining the network…', 'io-note');
  }
  piwebTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('piweb')) return;
    const run = this.sim.running, W = this.pw || (this.pw = { up: false, lit: false });
    if (!run && W.up) { W.up = false; delete W.c; delete W.rh; this.pwRender(); }
    const set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; if (cls !== undefined) e.className = cls; } };
    const st = this.pwStage || 'idle';
    set('#w-ph', run && W.up ? 'page shown' : '—', run && W.up ? 'on' : 'off');
    set('#w-fl', run ? (st === 'on' ? 'route /on' : st === 'off' ? 'route /off' : IS_E32 ? 'handleClient()' : 'waiting…') : '—', run ? 'on' : 'off');
    set('#w-led', run ? (this.pw.lit ? 'ON' : 'OFF') : '—', run && this.pw.lit ? 'on' : 'off');
    set('#w-note', !this.board.powered ? (IS_E32 ? 'USB is not plugged in — the board has no power.' : 'USB-C is not plugged in — the Raspberry Pi has no power.') : !run ? 'The server is not running: the phone cannot reach the page. Press <b>▶ Run</b>.' : 'Tap <b>Turn on</b> / <b>Turn off</b> on the phone.', 'io-note');
  }
  dashTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('dash')) return;
    const run = this.sim.running, ok = this.thermoOk(), B = this.br, st = run ? B.stage : 'idle', P = this.phone;
    const set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; if (cls !== undefined) e.className = cls; } };
    set('#ph-t', P ? P.c.toFixed(1) + ' °C' : '--'); set('#ph-h', P ? P.rh.toFixed(1) + ' %RH' : '--');
    set('#ph-s', P ? '● live' : 'waiting for data…');
    const c = B.c === undefined ? '' : B.c.toFixed(1) + ' °C';
    set('#d-sk', run && ok && c ? `notify ${c}` : '—', run && ok && c ? 'on' : 'off');
    set('#d-py', st === 'ws' || st === 'render' ? 'send_message("reading")' : st === 'notify' ? 'on_reading()' : '—', ['ws', 'render', 'notify'].includes(st) ? 'on' : 'off');
    set('#d-br', P ? `shows ${P.c.toFixed(1)} °C` : '—', P ? 'on' : 'off');
    set('#d-note', !this.board.powered ? 'USB-C is not plugged in — the board has no power.' : !run ? 'Press <b>▶ Run</b>, then move the sliders.' : st === 'notify' ? 'The sketch <b>notifies</b> Python.' : st === 'ws' ? 'Python <b>pushes</b> a “reading” message to the browser over the WebSocket.' : st === 'render' ? 'The page’s JavaScript writes the numbers into the page.' : 'Waiting for the next reading (once a second).', 'io-note');
  }
  homeTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('home')) return;
    const run = this.sim.running, B = this.br, P = this.phone, st = run ? B.stage : 'idle', R = this.rly || {};
    const set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; if (cls !== undefined) e.className = cls; } };
    set('#ph-t', P ? P.c.toFixed(1) + ' °C' : '--'); set('#ph-l', P ? (P.lamp ? 'ON' : 'OFF') : '--'); set('#ph-s', P ? '● live' : 'waiting for data…');
    set('#ph-mode', P ? `Mode: ${P.auto ? 'Auto' : 'Manual'} (tap)` : 'Mode: --');
    const lb = $('#ph-lamp'); if (lb) { lb.disabled = !P || P.auto; lb.textContent = P && !P.auto ? `Lamp: ${P.lamp ? 'ON' : 'OFF'} (tap)` : 'Lamp: Auto mode'; }
    const c = B.c === undefined ? '' : B.c.toFixed(1) + ' °C';
    const relayOn = run && R.mode === 'OUTPUT' && R.level === 0;
    set('#h-sk', run && c ? `reads ${c}` : '—', run && c ? 'on' : 'off');
    set('#h-py', run && B.auto !== undefined ? `${B.auto ? 'Auto' : 'Manual'} · lamp ${B.lamp ? 'wanted' : 'off'}` : '—', run ? 'on' : 'off');
    set('#h-rl', run ? (relayOn ? 'Relay ON · lamp ON' : 'Relay OFF · lamp OFF') : '—', relayOn ? 'on' : 'off');
    set('#h-note', !this.board.powered ? 'USB-C is not plugged in — the board has no power.' : !run ? 'Press <b>▶ Run</b>. Then move the slider and tap the phone buttons.' : st === 'click' ? 'A button tap travelled <b>browser → Python</b> (the handler only flips a flag).' : st === 'call' ? 'The loop <b>calls</b> set_lamp because the wish changed.' : st === 'reply' ? 'The sketch switched the relay.' : st === 'render' ? 'The page shows the newest state.' : 'Reading, deciding, showing — twice a second.', 'io-note');
  }
  // ---- Lesson 18: Modulino Thermo over Qwiic ------------------------------------------------------------
  thermoIo() { const L = this.lesson; return L && L.io && Object.values(L.io).find(x => x.kind === 'thermo'); }
  cabOk(id) { const io = this.thermoIo(); return !!this.bench.items[id] && !(this.th.unplug && (io.unplug || io.cable) === id); }
  thermoOk() { const io = this.thermoIo(); return !!io && this.wired(io) && this.board.powered && this.cabOk(io.cable); }
  pixelsOk() { const io = this.thermoIo(); return !!io && !!io.pix && this.thermoOk() && this.cabOk(io.cable2); }
  showThermo(on) {
    this.th.unplug = false; this.th.last = null;
    const m = this.bench.get('th1'); if (m) m.setPower(false);
    for (const id of ['cab1', 'cab2']) { const c = this.bench.get(id); if (c) c.group.visible = true; }
    this.pxArr = null; const px = this.bench.get('pix1'); if (px) px.setColors(null);
  }
  setThermo(v) {
    Object.assign(this.th, v);
    const t = $('#th-tv'), h = $('#th-hv');
    if (t) t.textContent = `${this.th.t.toFixed(1)} °C  (${(this.th.t * 9 / 5 + 32).toFixed(1)} °F)`;
    if (h) h.textContent = `${Math.round(this.th.h)} %RH`;
  }
  pisensTick() {
    const L = this.lesson; if (!L || !(L.widgets || []).includes('pisens')) return;
    const run = this.sim.running, w = this.bench.get(L.sdaWire || 'w4'); if (w) w.group.visible = !this.th.unplug;
    const b = $('#th-plug'); if (b) { b.disabled = run; b.textContent = L.dht ? (this.th.unplug ? '🔌 Plug the ' + (L.wn || 'DATA') + ' wire back in' : '🔌 Unplug the ' + (L.wn || 'DATA') + ' wire') : this.th.unplug ? '🔌 Plug the SDA wire back in' : '🔌 Unplug the SDA wire'; b.classList.toggle('on', this.th.unplug); }
    const n = $('#ps-note'); if (n) { const h = !this.board.powered ? (IS_U3 || IS_E32 ? 'USB is not plugged in — the board has no power.' : 'USB-C is not plugged in — the Raspberry Pi has no power.') : this.th.unplug ? (L.dht ? 'The DATA wire is out: no reading arrives and the library returns NaN.' : 'The SDA wire is out: nobody answers at 0x44.') : !run ? 'Press <b>▶ Run</b>, then move the sliders.' : (L.dht ? 'The sensor answers on its data wire; the program reads it every 2 seconds (the DHT11 gives whole numbers, the DHT22 one decimal).' : L.sdaWire && !IS_U3 ? 'The sensor answers at address 0x44; it is read each time the page is built (every 5 seconds).' : 'The sensor answers at address 0x44; the program reads it every 2 seconds.'); if (n.innerHTML !== h) n.innerHTML = h; }
  }
  thermoTick() {
    const io = this.thermoIo(); if (!io) return;
    const ok = this.thermoOk(), m = this.bench.get('th1');
    if (m) m.setPower(this.board.powered && !!this.bench.items.cab1 && this.cabOk(io.cable));
    for (const id of ['cab1', 'cab2']) { const c = this.bench.get(id); if (c) c.group.visible = this.cabOk(id); }
    const px = this.bench.get('pix1'), pOk = this.pixelsOk();
    if (px) px.setColors(this.sim.running && pOk ? this.pxArr : null);
    const set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; e.className = cls; } };
    const run = this.sim.running, bad = this.th.t < 5 || this.th.t > 60 || this.th.h < 20 || this.th.h > 80;
    set('#th-pwr', ok ? '3.3 V' : !this.board.powered ? 'off' : 'no cable', ok ? 'on' : 'off');
    set('#th-bus', io.pix ? (pOk ? '0x45 + 0x6C' : ok ? '0x45 only' : 'no answer') : ok ? '0x45 answers' : 'no answer', ok ? 'on' : 'off');
    if (io.pix) {
      const a = this.pxArr || [], n = a.filter(x => x[3] > 0 && x[0] + x[1] + x[2] > 0).length, f = a.find(x => x[3] > 0 && x[0] + x[1] + x[2] > 0);
      const nm = !f ? '' : f[2] ? 'blue' : f[0] ? 'red' : 'green';
      set('#th-out', !run ? '—' : !pOk ? 'not found' : n ? `${n} of 8 LEDs · ${nm}` : '0 of 8 LEDs', run && pOk ? 'on' : 'off');
    } else set('#th-out', !run ? '—' : !ok ? 'not found' : (this.th.last || '…'), run && ok ? 'on' : 'off');
    const cn = io.pix ? 'cable 2' : 'the Qwiic cable';
    const btn = $('#th-plug'); if (btn) { btn.disabled = run; btn.textContent = this.th.unplug ? `🔌 Plug ${cn} back in` : `🔌 Unplug ${cn}`; btn.classList.toggle('on', this.th.unplug); }
    set('#th-note', !this.board.powered ? USB_NAME + ' is not plugged in — the module has no power.' : this.th.unplug ? (io.pix ? 'Cable 2 is out: nobody answers at 0x6C, so <b>leds.begin()</b> will return false.' : 'The cable is out: nobody answers, so <b>thermo.begin()</b> will return false.') : !run ? 'Press <b>▶ Run</b>, then move the sliders.' : bad ? 'Outside the datasheet’s recommended range (5…60 °C, 20…80 %RH).' : 'The sketch reads the module once per second.', 'io-note');
  }
  // ---- Lesson 17: relay module + lamp ---------------------------------------------------------------
  relayIo() { const L = this.lesson; return L && L.io && Object.values(L.io).find(x => x.kind === 'relay'); }
  frameRelay(ms = 1000) {
    const r = this.bench.items.rel1; if (!r) return this.view('relay', ms);
    const p = r.group.position;
    return this.viewer.flyTo(new THREE.Vector3(p.x + 3, 10, p.z + 2), 88, new THREE.Vector3(-0.1, 0.8, 0.6), ms);
  }
  showRelay(on) {
    if (this.rlyTags) { this.rlyTags.forEach(t => { t.parent && t.parent.remove(t); t.element.remove(); }); this.rlyTags = null; }
    this.rly = { mode: 'INPUT', level: null, manual: false };
    const m = this.bench.get('rel1'), lamp = this.bench.get('lamp1');
    if (m) { m.setCutaway(false); m.update(1, false, false); } if (lamp) lamp.set(false);
    if (!on || !m) return;
    const mk = (obj, y) => { const el = document.createElement('div'); el.className = 'part-label pirtag'; const t = new CSS2DObject(el); const p = obj.group.position; t.position.set(p.x, y, p.z); this.viewer.scene.add(t); return t; };
    this.rlyTags = [mk(this.bench.items.rel1.obj, 38), mk(this.bench.items.lamp1.obj, 52)];
  }
  relayTick(dt) {
    const io = this.relayIo(), m = this.bench.get('rel1'), lamp = this.bench.get('lamp1'); if (!io || !m || !this.rly) return;
    const R = this.rly, wired = this.wired(io), pwr = this.board.powered && wired;
    const simOn = this.sim.running && R.mode === 'OUTPUT' && R.level === 0;
    const coil = pwr && (this.sim.running ? simOn : R.manual);
    if (m.update(dt, coil, pwr)) this.playClick(coil);
    const lampOn = coil && m.t > 0.5;
    if (lamp) lamp.set(lampOn);
    const set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; e.className = cls; } };
    const pinTxt = !this.sim.running ? (R.manual ? 'LOW (manual)' : '—') : R.mode === 'INPUT' ? 'released' : R.level === 0 ? 'LOW · 0 V' : R.level === 1 ? 'HIGH · ' + LOGIC_V + ' V' : '—';
    set('#rl-pin', pinTxt, coil ? 'on' : 'off');
    set('#rl-rel', coil ? 'ON · COM–NO' : 'OFF · COM–NC', coil ? 'on' : 'off');
    set('#rl-lamp', lampOn ? 'ON' : 'OFF', lampOn ? 'on' : 'off');
    document.querySelectorAll('.rtable tr[data-r]').forEach(tr => tr.classList.toggle('hit', pwr && ((tr.dataset.r === 'low') === coil)));
    const btn = $('#rl-manual'); if (btn) { btn.disabled = this.sim.running; btn.textContent = R.manual && !this.sim.running ? '⚡ Coil energised — click to release' : '⚡ Energise the coil'; btn.classList.toggle('on', R.manual && !this.sim.running); }
    set('#rl-note', !this.board.powered ? USB_NAME + ' is not plugged in — the module has no power.' : !this.sim.running ? 'Press <b>▶ Run</b>, or energise the coil by hand.' : coil ? 'Pin LOW → relay <b>clicks ON</b> → lamp circuit closed.' : IS_U3 ? 'Pin HIGH → relay <b>clicks OFF</b> → lamp circuit open.' : 'Pin released → relay <b>clicks OFF</b> → lamp circuit open.', 'io-note');
    if (this.rlyTags) { const [a, b] = this.rlyTags; const t1 = coil ? 'Relay ON' : 'Relay OFF', t2 = lampOn ? 'Lamp ON' : 'Lamp OFF'; if (a.element.textContent !== t1) { a.element.textContent = t1; a.element.className = 'part-label pirtag ' + (coil ? 'on' : ''); } if (b.element.textContent !== t2) { b.element.textContent = t2; b.element.className = 'part-label pirtag ' + (lampOn ? 'on' : ''); } }
  }
  playClick(on) {
    if (!this.soundOn) return; const ac = this.audioCtx(); if (!ac) return;
    const t = ac.currentTime;
    for (const [dt, f, gn] of on ? [[0, 2600, 0.55], [0.011, 1500, 0.4]] : [[0, 1900, 0.4], [0.008, 1100, 0.28]]) {
      const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.03), ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.004));
      const src = ac.createBufferSource(); src.buffer = buf;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 1.1;
      const g = ac.createGain(); g.gain.value = gn;
      src.connect(bp).connect(g).connect(ac.destination); src.start(t + dt);
    }
  }
  // ---- Lesson 16: L293D + DC motor -------------------------------------------------------------------
  motorIo() { const L = this.lesson; return L && L.io && Object.values(L.io).find(x => x.kind === 'motor'); }
  showMotor(on) {
    if (this.motTags) { this.motTags.forEach(t => { t.parent && t.parent.remove(t); t.element.remove(); }); this.motTags = null; }
    this.mot = { en: 0, in1: 0, in2: 0 };
    const m = this.bench.get('mot1'); if (m) { m.speed = 0; m.spin(0); }
    if (!on || !m) return;
    const el = document.createElement('div'); el.className = 'part-label pirtag'; const t = new CSS2DObject(el);
    const p = this.bench.items.mot1.group.position; t.position.set(p.x, 72, p.z); this.viewer.scene.add(t);
    this.motTags = [t];
  }
  motorTick(dt) {
    const m = this.bench.get('mot1'), io = this.motorIo(); if (!m || !io || !this.mot) return;
    const S = this.mot, ok = this.wired(io) && this.board.powered && this.sim.running;
    let target = 0, tau = 0.9, row = 'coast';
    if (ok && S.en > 0) {
      if (S.in1 !== S.in2) { target = (S.in1 ? 1 : -1) * S.en; tau = 0.25; row = S.in1 ? 'd1' : 'd2'; }
      else { tau = 0.12; row = 'brake'; }
    }
    m.speed += (target - m.speed) * Math.min(1, dt / tau);
    if (target === 0 && Math.abs(m.speed) < 0.003) m.speed = 0;
    m.spin(dt);
    const s = Math.abs(m.speed);
    const state = !ok ? (s > 0 ? 'Coasting' : 'Stopped') : s < 0.01 && target === 0 ? 'Stopped' : row === 'brake' ? 'Braking' : row === 'coast' ? 'Coasting' : `${m.speed > 0 ? '⟳ Direction 1' : '⟲ Direction 2'} · ${Math.round(s * 100)} %`;
    const set = (id, h, cls) => { const e = $(id); if (e && e.innerHTML !== h) { e.innerHTML = h; e.className = cls; } };
    set('#mt-in1', S.in1 ? 'HIGH' : 'LOW', S.in1 ? 'on' : 'off');
    set('#mt-in2', S.in2 ? 'HIGH' : 'LOW', S.in2 ? 'on' : 'off');
    set('#mt-en', S.en > 0 ? `PWM ${Math.round(S.en * 100)} %` : 'LOW', S.en > 0 ? 'on' : 'off');
    set('#mt-mot', state, s > 0.01 && row !== 'brake' && row !== 'coast' ? 'on' : 'off');
    document.querySelectorAll('.mtable tr[data-r]').forEach(tr => tr.classList.toggle('hit', ok && tr.dataset.r === (S.en > 0 ? (S.in1 !== S.in2 ? (S.in1 ? 'd1' : 'd2') : 'brake') : 'coast')));
    if (this.motTags) { const e = this.motTags[0].element, txt = state; if (e.textContent !== txt) { e.textContent = txt; e.className = 'part-label pirtag ' + (s > 0.01 && row !== 'brake' && row !== 'coast' ? 'on' : ''); } }
  }
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
    g.fillStyle = '#8fa3b5'; g.fillText('motion', 6, 22); g.fillText(IS_U3 ? 'OUT (pin 2)' : 'OUT (D2)', 6, 58);
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
    if (el) el.innerHTML = `<b>${t.toFixed(1)} °C</b> → V<sub>OUT</sub> = 0.5 V + ${t.toFixed(1)} × 10 mV = <b>${V.toFixed(3)} V</b> → ${ADC_BITS} ≈ <b>${adcCount(V)}</b>`;
  }
  knobValue() { const p = this.bench.get('pot1'); return p ? p.value : (this.knob ?? 0.5); }
  setKnob(f) {
    this.knob = Math.min(1, Math.max(0, f));
    const p = this.bench.get('pot1'); if (p) p.set(this.knob);
    const v = this.knob * LOGIC_V;
    const k = $('#knob'); if (k && document.activeElement !== k) k.value = Math.round(this.knob * 1000);
    const kv = $('#knob-val');
    if (kv) kv.innerHTML = `Wiper ≈ <b>${v.toFixed(2)} V</b> → ${ADC_BITS} reading ≈ <b>${adcCount(v)}</b>`;
  }
  bindResponsive() {
    const body = document.body;
    body.dataset.tab = 'lesson';
    const coarse = matchMedia('(pointer: coarse)').matches;
    if (coarse) $('#legend').textContent = 'Drag to rotate · Pinch to zoom · Tap any part';
    const closeMenu = () => { body.dataset.menu = ''; };
    $('#menu-btn').onclick = () => { body.dataset.menu = body.dataset.menu === 'open' ? '' : 'open'; };
    $('#scrim').onclick = closeMenu;
    // choosing something in the side menu closes it and shows the explanation (small screens)
    $('#side').addEventListener('click', e => { if (e.target.closest('.item, .lesson-card')) setTimeout(() => { closeMenu(); body.dataset.tab = 'lesson'; document.querySelectorAll('#mtabs [data-tab]').forEach(x => x.classList.toggle('on', x.dataset.tab === 'lesson')); }, 60); });
    document.querySelectorAll('#mtabs [data-tab]').forEach(b => b.onclick = () => {
      body.dataset.tab = b.dataset.tab;
      document.querySelectorAll('#mtabs [data-tab]').forEach(x => x.classList.toggle('on', x === b));
      setTimeout(() => this.viewer.resize(), 60);
    });
    $('#mt-run').onclick = () => $('#run').click();
    $('#mt-stop').onclick = () => $('#stop').click();
    addEventListener('resize', () => { if (innerWidth > 1024) closeMenu(); });
  }
  bindDirectInput() {
    // press the 3D push button / drag the 3D knob without rotating the camera
    const stage = $('#stage');
    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0 || this.mode !== 'lessons') return;
      let hit = this.viewer.pick(e);
      // the stick of a joystick and the knob of an encoder win over wires drawn in front of them
      for (const [bid, prop, hid] of [['joy1', 'stick', 'joystick'], ['enc1', 'knob', 'encoder']]) {
        const o = this.bench.get(bid); if (!o || !o[prop]) continue;
        this.viewer.setPointer(e); this.viewer.raycaster.setFromCamera(this.viewer.pointer, this.viewer.camera);
        const hh = this.viewer.raycaster.intersectObject(o[prop], true); if (hh.length) { hit = { id: hid, object: hh[0].object, point: hh[0].point }; break; }
      }
      // sensor and module boards win over wires drawn in front of them
      if (!hit || !['joystick', 'encoder'].includes(hit.id)) for (const [bid, hid] of [['soil1', 'soil'], ['snd1', 'snd'], ['mpu1', 'mpu6050'], ['bmp1', 'bmp280'], ['kp1', 'keypad'], ['ir1', 'irrx'], ['ds1', 'ds18b20'], ['dht1', 'dht'], ['ldr1', 'ldr'], ['pir1', 'pir']]) {
        const o = this.bench.get(bid); if (!o || !o.group) continue;
        this.viewer.setPointer(e); this.viewer.raycaster.setFromCamera(this.viewer.pointer, this.viewer.camera);
        const hh = this.viewer.raycaster.intersectObject(o.group, true); if (hh.length) { hit = { id: hid, object: hh[0].object, point: hh[0].point }; break; }
      }
      if (!hit) return;
      // a plain click on one of these parts still opens its information card (the handlers below stop the event)
      if (['joystick', 'encoder', 'keypad', 'snd', 'soil', 'ldr', 'dht', 'ds18b20', 'bmp280', 'pir', 'irrx', 'mpu6050'].includes(hit.id)) {
        const cx = e.clientX, cy = e.clientY, clickUp = ev => { window.removeEventListener('pointerup', clickUp, true); if (Math.hypot(ev.clientX - cx, ev.clientY - cy) < 5) this.viewer.onPick(hit, ev); };
        window.addEventListener('pointerup', clickUp, true);
      }
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
      } else if (hit.id === 'joystick') {
        const o = this.bench.get('joy1'); if (!o || !o.stick) return; { let q = hit.object, on = false; while (q) { if (q === o.stick) on = true; q = q.parent; } if (!on) return; }
        e.stopPropagation(); this.viewer.controls.enabled = false;
        const x0 = e.clientX, y0 = e.clientY; let moved = false; this.joySw = true; this.joyShow();
        const c = new THREE.Vector3(); o.stick.getWorldPosition(c); const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(c.y + 6)), p = new THREE.Vector3();
        const mv = ev => {
          if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 5) { moved = true; this.joySw = false; }
          if (!moved) return;
          this.viewer.setPointer(ev); this.viewer.raycaster.setFromCamera(this.viewer.pointer, this.viewer.camera);
          if (this.viewer.raycaster.ray.intersectPlane(plane, p)) { this.joyPos.x = Math.min(1, Math.max(0, 0.5 + (p.x - c.x) / 14)); this.joyPos.y = Math.min(1, Math.max(0, 0.5 + (p.z - c.z) / 14)); this.joyShow(); const jx = $('#jx'), jy = $('#jy'); if (jx) jx.value = Math.round(this.joyPos.x * 100); if (jy) jy.value = Math.round(this.joyPos.y * 100); }
        };
        const up = () => { this.joySw = false; this.joyPos.x = 0.5; this.joyPos.y = 0.5; this.joyShow(); const jx = $('#jx'), jy = $('#jy'); if (jx) jx.value = 50; if (jy) jy.value = 50; this.viewer.controls.enabled = true; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };   // the stick springs back to the centre
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      } else if (hit.id === 'encoder') {
        const o = this.bench.get('enc1'); if (!o || !o.knob) return; { let q = hit.object, on = false; while (q) { if (q === o.knob) on = true; q = q.parent; } if (!on) return; }
        e.stopPropagation(); this.viewer.controls.enabled = false;
        let last = e.clientX, moved = false; this.encSw = true; this.encShow();
        const mv = ev => { if (!moved && Math.abs(ev.clientX - e.clientX) > 5) { moved = true; this.encSw = false; this.encShow(); } if (!moved) return; while (ev.clientX - last > 14) { this.encTurn(1); last += 14; } while (last - ev.clientX > 14) { this.encTurn(-1); last -= 14; } };
        const up = () => { this.encSw = false; this.encShow(); this.viewer.controls.enabled = true; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      } else if (hit.id === 'keypad' && this.kp) {
        const o = this.bench.get('kp1'); if (!o || !o.keyPos) return;
        e.stopPropagation(); this.viewer.controls.enabled = false;
        const lp = o.group.worldToLocal(hit.point.clone()); let best = null, bd = 7;
        for (const [k, [x, z]] of Object.entries(o.keyPos)) { const d = Math.hypot(lp.x - x, lp.z - z); if (d < bd) { bd = d; best = k; } }
        if (best && this.sim.running) { this.kp.q.push(best); this.kp.cur = best; this.kp.until = performance.now() + 250; }
        const up = () => { this.viewer.controls.enabled = true; window.removeEventListener('pointerup', up); }; window.addEventListener('pointerup', up);
      } else if (hit.id === 'snd' && this.cl) {
        e.stopPropagation(); if (this.sim.running) this.cl.until = performance.now() + 120;
      } else if (hit.id === 'soil' && this.sm) {
        e.stopPropagation(); this.viewer.controls.enabled = false;
        const y0 = e.clientY, w0 = this.sm.wet;
        const mv = ev => { this.sm.wet = Math.min(100, Math.max(0, Math.round(w0 + (y0 - ev.clientY) / 2))); const sl = $('#sm-w'); if (sl) sl.value = this.sm.wet; const lb = $('#sm-wv'); if (lb) lb.textContent = this.sm.wet + ' % wet'; };   // drag up = wetter
        const up = () => { this.viewer.controls.enabled = true; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      } else if (hit.id === 'ldr' && this.sliderToLux && $('#lux')) {
        e.stopPropagation(); this.viewer.controls.enabled = false;
        const y0 = e.clientY, v0 = this.luxToSlider(this.lux);   // drag up = brighter
        const mv = ev => this.setLux(this.sliderToLux(Math.min(1000, Math.max(0, v0 + (y0 - ev.clientY) * 4))));
        const up = () => { this.viewer.controls.enabled = true; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      } else if ((hit.id === 'dht' || hit.id === 'ds18b20' || hit.id === 'bmp280') && ($('#th-t') || $('#bp-t'))) {
        e.stopPropagation(); this.viewer.controls.enabled = false;
        const y0 = e.clientY, bp = !!$('#bp-t') && hit.id === 'bmp280', t0 = bp ? this.bp.t : this.th.t;   // drag up = warmer
        const mv = ev => { const t = Math.round((t0 + (y0 - ev.clientY) / 4) * 2) / 2; if (bp) { this.bp.t = Math.min(60, Math.max(-20, t)); const sl = $('#bp-t'); if (sl) { sl.value = this.bp.t; sl.dispatchEvent(new Event('input')); } } else { this.setThermo({ t }); const sl = $('#th-t'); if (sl) sl.value = this.th.t; } };
        const up = () => { this.viewer.controls.enabled = true; window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      } else if (hit.id === 'pir' && $('#pir-wave')) {
        e.stopPropagation(); this.pirWave();
      } else if (hit.id === 'irrx' && this.irq) {
        e.stopPropagation(); if (this.sim.running) { this.irq.push(0x45); const r = this.bench.get('ir1'); if (r && r.setActive) { r.setActive(true); setTimeout(() => r.setActive(false), 250); } }
      } else if (hit.id === 'mpu6050' && this.mp) {
        const o = this.bench.get('mpu1'); if (!o) return;
        e.stopPropagation(); this.viewer.controls.enabled = false;
        const x0 = e.clientX, y0 = e.clientY, p0 = this.mp.pitch, r0 = this.mp.roll;
        const mv = ev => { this.mp.roll = Math.round(Math.min(90, Math.max(-90, r0 + (ev.clientX - x0) * 0.6))); this.mp.pitch = Math.round(Math.min(90, Math.max(-90, p0 + (ev.clientY - y0) * 0.6))); this.mpShow(); };
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
      vref: () => LOGIC_V,
      touch: pin => { const io = this.ioFor(pin); if (io && io.kind === 'touch' && this.wired(io)) return this.touchDown ? 4 + Math.random() * 5 : 68 + Math.random() * 8; return 60 + Math.random() * 12; },
      avr: IS_U3,                       // ATmega328P ADC model
      adcBits: IS_E32 ? 12 : 0,         // ESP32: analogRead() is 12-bit by default (0 ... 4095)
      servoStep: IS_U3 ? 1 : 4,         // Servo library timer resolution in µs (AVR: 0.5 µs ticks -> whole µs; Zephyr: 4 µs)
      pin: (pin, level) => this.onDigital(pin, level),
      pwm: (pin, duty, raw) => this.onPwm(pin, duty, raw),
      tone: (pin, f, ms) => this.onTone(pin, f, ms),
      noTone: pin => this.onNoTone(pin),
      read: (pin, mode) => {
        if (this.dvs) for (const d of this.dvs) { const r = d.read(pin, mode); if (r !== undefined) return r; }
        const io = this.ioFor(pin);
        if (io && io.kind === 'enc' && this.wired(io)) { const ph = (this.encPh || 0) & 3; return io.role === 'clk' ? (ph === 1 || ph === 2 ? 0 : 1) : io.role === 'dt' ? (ph === 2 || ph === 3 ? 0 : 1) : (this.encSw ? 0 : 1); }
        if (io && io.kind === 'joysw' && this.wired(io)) return this.joySw ? 0 : 1;
        if (io && io.kind === 'pir' && this.wired(io)) return this.pir.out;
        if (io && io.kind === 'button' && this.wired(io) && this.buttonDown) return 0;
        if (mode === 'INPUT_PULLUP') return 1;
        return Math.random() < 0.5 ? 0 : 1;      // an open input without pull-up floats
      },
      analog: pin => {
        if (this.dvs) for (const d of this.dvs) { const r = d.analog(pin); if (r !== undefined) return r; }
        const io = this.ioFor(pin);
        if (io && io.kind === 'joyax' && this.wired(io)) return (this.joyPos ? this.joyPos[io.ax] : 0.5) * LOGIC_V;
        if (io && io.kind === 'pot' && this.wired(io)) return this.knobValue() * LOGIC_V;
        if (io && io.kind === 'ldr' && this.wired(io)) return this.ldrVolts();
        if (io && io.kind === 'mic' && this.wired(io)) { const clap = this.cl && performance.now() < this.cl.until; return LOGIC_V / 2 + (clap ? 0.35 * LOGIC_V * Math.sin(performance.now() / 4) : (Math.random() - 0.5) * 0.02 * LOGIC_V); }   // quiet = about half the supply
        if (io && io.kind === 'soil' && this.wired(io)) return 2.5 - 1.5 * (this.sm ? this.sm.wet : 0) / 100 + (Math.random() - 0.5) * 0.01;   // example values: about 2.5 V dry, 1.0 V in water
        if (io && io.kind === 'tmp36' && this.wired(io)) return this.tmp36Volts();
        return 0.4 + Math.random() * 0.3;         // unconnected input floats
      },
      matrix: vals => this.board.setMatrix(vals),
      servo: (pin, us, angle) => this.onServo(pin, us, angle),
      dev: (name, op, ...a) => { const d = this.dvs && this.dvs.find(x => x.name === name); return d ? d.call(op, ...a) : undefined; },
      thermo: () => {
        const ok = this.thermoOk();
        if (!ok) return { found: false };
        const jit = this.thermoIo().pix || this.thermoIo().steady ? 0 : 1, c = this.th.t + (Math.random() - 0.5) * 0.1 * jit, rh = Math.min(100, Math.max(0, this.th.h + (Math.random() - 0.5) * 0.3));
        this.th.last = `${c.toFixed(1)} °C · ${rh.toFixed(1)} %RH`;
        return { found: true, pixels: this.pixelsOk(), c, rh };
      },
      bridge: ev => { this.br.stage = ev.stage; if (ev.val && typeof ev.val === 'object') { Object.assign(this.br, { c: ev.val.c, rh: ev.val.rh, hot: ev.val.hot, auto: ev.val.auto, lamp: ev.val.lamp }); if (ev.stage === 'render') this.phone = { c: ev.val.c, rh: ev.val.rh, auto: ev.val.auto, lamp: ev.val.lamp }; } else this.br.arg = ev.val; },
      ui: () => { const q = this.uiq || []; this.uiq = []; return q; },
      web: ev => { if (!this.pw) this.pw = { up: false, lit: false }; this.pw.up = true; this.pw.lit = !!ev.val.lit; if (ev.val.c !== undefined) { this.pw.c = ev.val.c; this.pw.rh = ev.val.rh; } this.pwStage = this.pw.lit ? 'on' : 'off'; this.pwRender(); },
      pixels: arr => { this.pxArr = arr; },
      sensor: () => {
        const io = this.ioFor(IS_U3 ? 'A4' : 'p3'), ok = io && io.kind === 'i2c' && this.wired(io) && this.board.powered && !this.th.unplug;
        return ok ? { found: true, c: this.th.t + (Math.random() - 0.5) * 0.1, rh: Math.min(100, Math.max(0, this.th.h + (Math.random() - 0.5) * 0.3)) } : { found: false };
      },
      ble: ev => { if (ev.stage === 'adv') this.bl.adv = !!ev.val; else if (ev.stage === 'val') this.bl.val = ev.val; this.bleRender(); },
      neo: ev => this.neoOp(ev),
      lcd: ev => this.lcdOp(ev),
      i2cProbe: a => (a === this.lcdAddr && this.i2cDispOk('lcd')) || (a === this.oledAddr && this.i2cDispOk('oled')) || (a === 0x68 && this.i2cDispOk('mpu')) || (a === 0x76 && this.i2cDispOk('bmp')),
      oled: ev => this.oledOp(ev),
      mpu: () => { const L = this.lesson, io = Object.values((L && L.io) || {}).find(x => x.kind === 'mpu'); if (!(io && this.wired(io) && this.board.powered)) return { ax: 0, ay: 0, az: 0, gz: 0 }; const g = 9.80665, p = this.mp.pitch * Math.PI / 180, r = this.mp.roll * Math.PI / 180, n = () => (Math.random() - 0.5) * 0.04; return { ax: -g * Math.sin(p) + n(), ay: g * Math.sin(r) * Math.cos(p) + n(), az: g * Math.cos(r) * Math.cos(p) + n(), gz: this.mp.rate * Math.PI / 180 }; },
      stepTick: dir => { const L = this.lesson, io = Object.values((L && L.io) || {}).find(x => x.kind === 'stepper'); if (this.stp && io && this.wired(io) && this.board.powered) this.stp.steps += dir; },
      bmp: () => { const L = this.lesson, io = Object.values((L && L.io) || {}).find(x => x.kind === 'bmp'); if (!(io && this.wired(io) && this.board.powered)) return { t: 0, p: 0 }; return { t: Math.round(this.bp.t * 100) / 100, p: Math.round(this.bp.p * 100) / 100 }; },
      fs: (op, p, t) => { const F = this.fsd || (this.fsd = {}); if (op === 'write') F[p] = t; else if (op === 'append') F[p] = (F[p] || '') + t; else return F[p] || ''; },
      keypad: () => (this.kp && this.kp.q.length ? this.kp.q.shift() : null),
      ir: () => (this.irq && this.irq.length ? this.irq.shift() : null),
      ds18: () => {
        const L = this.lesson, pin = L && L.io ? Object.keys(L.io).find(p => L.io[p].kind === 'ds18b20') : null, io = pin && this.ioFor(pin);
        if (!(io && this.wired(io) && this.board.powered && !this.th.unplug)) return { ok: false };
        return { ok: true, t: Math.round(Math.min(125, Math.max(-55, this.th.t)) / 0.0625) * 0.0625 };
      },
      dht: () => {
        const L = this.lesson, pin = L && L.io ? Object.keys(L.io).find(p => L.io[p].kind === 'dht') : null, io = pin && this.ioFor(pin);
        if (!(io && this.wired(io) && this.board.powered && !this.th.unplug)) return { ok: false };
        const part = (L.circuit || []).find(d => d.id === io.item), is11 = ((part && part.model) || 'dht11') === 'dht11';
        const t = Math.min(is11 ? 50 : 80, Math.max(is11 ? 0 : -40, this.th.t)), h = Math.min(is11 ? 80 : 100, Math.max(is11 ? 20 : 0, this.th.h));
        return { ok: true, t: is11 ? Math.round(t) : Math.round(t * 10) / 10, h: is11 ? Math.round(h) : Math.round(h * 10) / 10 };
      },
      sleep: (on, ms) => { this.slp = on; if (on) this.slpEnd = performance.now() + ms; },
      wifiScan: () => {
        const W = this.wf, list = [{ ssid: 'CoffeeShop-Free', rssi: -67, open: true }, { ssid: 'Workshop', rssi: -78, open: false }, { ssid: 'Neighbour-2G', rssi: -84, open: false }];
        if (W.router) list.push({ ssid: 'HomeNet', rssi: W.rssi, open: false });
        return list.sort((a, b) => b.rssi - a.rssi);
      },
      wifiBegin: () => { this.wf.t0 = performance.now(); },
      wifiStatus: () => (this.wf.router && this.wf.passOk && performance.now() - this.wf.t0 > 2500 ? 'connected' : 'connecting'),
      wifiIP: () => '192.168.1.42',
      configTime: () => { this.wf.ntpT0 = performance.now(); },
      localTime: gmt => { const W = this.wf; if (!(W.ntp && W.ntpT0 && performance.now() - W.ntpT0 > 1500)) return null; const d = new Date(Date.now() + gmt * 1000), DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], z = n => String(n).padStart(2, '0'); return `${DAY[d.getUTCDay()]}, ${MON[d.getUTCMonth()]} ${z(d.getUTCDate())} ${d.getUTCFullYear()} ${z(d.getUTCHours())}:${z(d.getUTCMinutes())}:${z(d.getUTCSeconds())}`; },
      mqtt: ev => { const M = this.mq; if (!M) return ev.op === 'poll' ? null : false; if (ev.op === 'connected') return M.conn; if (ev.op === 'connect') return sleep(900).then(() => { M.conn = !!M.up; return M.conn; }); if (ev.op === 'subscribe') { M.subs.add(ev.topic); return true; } if (ev.op === 'publish') { if (M.conn) M.log.push(ev.topic + ' = ' + ev.payload); return true; } if (ev.op === 'poll') return M.inbox.length ? M.inbox.shift() : null; },
      http: async url => { await sleep(600); const W = this.wf; const res = W.http === 'ok' ? { code: 200, body: '{"temperature": 21.5}' } : W.http === '404' ? { code: 404, body: '' } : { code: -1, body: '' }; W.last = res; return res; },
      mode: (pin, mode) => { const rio = this.relayIo(); if (rio && this.rly && pin === 'D4') { this.rly.mode = mode; this.rly.level = null; } },
      pulse: async (pin) => {
        const io = this.ioFor(pin);
        if (io && io.kind === 'hcsr04' && this.wired(io) && this.board.powered) { const us = this.pulseInUs(); await sleep(Math.max(1, us / 1000)); this.setPinLevel(`${pinName(pin)} ECHO: HIGH for ${Math.round(this.echoUs())} µs → pulseIn() = ${us} µs`); return us; }
        await sleep(IS_U3 ? 1000 : 2000); return 0;       // pulseIn() default timeout: 1 s on the UNO R3 (AVR core)
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

  // RGB LED of a lesson: every die shows duty x its full brightness at the board's logic voltage with 220 ohm (typical forward voltages: red 2.0 V, green 3.0 V, blue 3.1 V)
  rgbSet(io, v) {
    const vf = [RGB_VF.R, RGB_VF.G, RGB_VF.B][io.ch], full = Math.pow(Math.min(1, Math.max(0, (LOGIC_V - vf) / 220 / 0.015)), 0.6);
    this.rgbLv = this.rgbLv || [0, 0, 0]; this.rgbLv[io.ch] = v * full; this.rgbShow(io);
  }
  rgbShow(io) {
    const o = this.bench.get(io.item); if (!o || !o.setRGB) return;
    const on = this.board.powered && this.wired(io);
    o.setRGB(on ? this.rgbLv.map(x => (x > 0.02 ? Math.max(0.12, x) : 0)) : [0, 0, 0]);
  }
  ledFor(pin) { const io = this.ioFor(pin); return io && io.kind === 'led' ? { io, led: this.bench.get(io.item) } : null; }

  onDigital(pin, level) {
    if (this.dvs) for (const d of this.dvs) d.pin(pin, level);
    { const qo = this.ioFor(pin); if (qo && (qo.kind === 'npn' || qo.kind === 'mosfet')) this.qPin = level ? 1 : 0; if (qo && qo.kind === 'stepper' && this.stp) this.stp.lv[qo.idx - 1] = level ? 1 : 0; }
    { const rg = this.ioFor(pin); if (rg && rg.kind === 'rgb') this.rgbSet(rg, level ? 1 : 0); }
    if (IS_E32 && pin === 'G2') { this.br.led = !!level; if (this.board.powered) this.board.setLed('blue', !!level); }   // the blue LED is on GPIO2 (active high)
    if (IS_U3 && pin === 'LED_BUILTIN') {        // the yellow L LED on pin 13 is active-high
      this.br.led = !!level;
      if (this.board.powered) this.board.setLed('l', !!level);
      this.setPinLevel(`LED_BUILTIN (pin 13): <span class="${level ? 'hi' : 'lo'}">${level ? 'HIGH · 5 V' : 'LOW · 0 V'}</span> → <span class="${level ? 'led-on' : 'led-off'}">LED ${level ? 'ON' : 'OFF'}</span>`);
      return;
    }
    if (pin === 'LED_BUILTIN') {
      const on = level === 0;               // active-low RGB LED
      this.br.led = on;
      if (this.board.powered) this.board.setLed('rgb3', on ? 1 : 0, 0, 0);
      this.setPinLevel(`LED_BUILTIN (LED3_R): <span class="${level ? 'hi' : 'lo'}">${level ? 'HIGH · 3.3 V' : 'LOW · 0 V'}</span> → <span class="${on ? 'led-on' : 'led-off'}">LED ${on ? 'ON' : 'OFF'}</span>`);
      return;
    }
    if (pin === 'D5' && this.pir) this.pir.ledOn = !!(level && this.board.powered);
    if (pin === 'D4' && this.relayIo() && this.rly) this.rly.level = level;
    { const mio = this.motorIo(); if (mio && this.mot && (pin === mio.in1 || pin === mio.in2)) this.mot[pin === mio.in1 ? 'in1' : 'in2'] = level; }
    { const us = this.ioFor('D8'); if (pin === 'D7' && level && us && us.kind === 'hcsr04' && this.wired(us) && this.board.powered) this.sonarBurst(); }
    const L = this.ledFor(pin);
    const on = !!(L && L.led && level && this.board.powered && this.wired(L.io));
    if (L && L.led) L.led.set(on);
    if (this.scope && (this.lesson.scopePin || 'D5') === pin) this.scope.set({ type: 'dc', level });
    this.setPinLevel(`${pinName(pin)}: <span class="${level ? 'hi' : 'lo'}">${level ? 'HIGH · ' + LOGIC_V + ' V' : 'LOW · 0 V'}</span>${L ? ` → <span class="${on ? 'led-on' : 'led-off'}">LED ${on ? 'ON' : 'OFF'}</span>` : ''}`);
  }

  onPwm(pin, duty, raw) {
    if (this.dvs) for (const d of this.dvs) { if (d.pwm) d.pwm(pin, duty); }
    { const rg = this.ioFor(pin); if (rg && rg.kind === 'rgb') this.rgbSet(rg, duty); }
    { const mio = this.motorIo(); if (mio && pin === mio.en && this.mot) this.mot.en = duty; }
    const L = this.ledFor(pin);
    const on = !!(L && L.led && this.board.powered && this.wired(L.io));
    if (L && L.led) L.led.set(on && duty > 0, duty);
    if (this.scope && (this.lesson.scopePin || 'D5') === pin) this.scope.set({ type: 'pwm', freq: 500, duty });
    this.setPinLevel(`${pinName(pin)}: PWM <span class="hi">${(duty * 100).toFixed(0)} %</span> (value ${raw}) · average ≈ ${(duty * LOGIC_V).toFixed(2)} V`);
  }

  onTone(pin, f, ms) {
    const io = this.ioFor(pin);
    const ok = io && this.wired(io) && this.board.powered;
    const tok = this.toneState = ok ? { pin, f, item: io.item } : null;
    if (ok) this.playTone(f, ms);
    if (this.scope && this.lesson.scopePin === pin) this.scope.set({ type: 'square', freq: f });
    this.setPinLevel(`${pinName(pin)}: tone <span class="hi">${+Number(f).toFixed(1)} Hz</span> square wave${ms ? ` for ${ms} ms` : ''}`);
    if (ms) setTimeout(() => { if (this.toneState === tok) this.onNoTone(pin, true); }, ms);
  }
  onNoTone(pin, ended) {
    this.toneState = null; this.stopSound();
    const io = this.ioFor(pin); const bz = io && this.bench.get(io.item); if (bz && bz.vibrate) bz.vibrate(false);
    if (this.scope && this.lesson && this.lesson.scopePin === pin) this.scope.set({ type: 'dc', level: 0 });
    this.setPinLevel(`${pinName(pin)}: <span class="lo">LOW · 0 V</span> (${ended ? 'note finished' : IS_PI ? 'stop()' : 'noTone()'})`);
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
    if (this.dvs) for (const d of this.dvs) d.reset();
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
      if (this.mode === 'build') { this.fb.onHover(hit, e); return; }
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
    this.viewer.onPick = (hit, e) => {
      if (this.mode === 'build') { this.fb.onPick(hit, e); return; }
      if (!hit) { if (this.mode === 'explore') this.select(null); return; }
      if (this.mode === 'lessons' && (hit.id === 'pushbutton' || hit.id === 'pot' || hit.id === 'obstacle')) return;
      this.lastHit = hit;
      this.select(hit.id, { fly: true });
    };
  }
}

// ------------------------------------------------------------------ tiny C++ highlighter
const KW = new Set(['from', 'import', 'def', 'True', 'False', 'None', 'not', 'and', 'or', 'pass', 'global', 'void', 'int', 'const', 'float', 'uint8_t', 'uint16_t', 'uint32_t', 'bool', 'byte', 'char', 'for', 'while', 'if', 'else', 'return', 'static', 'unsigned', 'long', 'true', 'false', 'String']);
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

// Renderer, studio lighting, camera controls, picking and camera animation.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { canvasTex, noise } from './materials.js';

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Viewer {
  constructor(container) {
    this.container = container;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2));   // lighter on touch devices
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.95;
    r.shadowMap.enabled = true;
    r.localClippingEnabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(r.domElement);

    this.labels = new CSS2DRenderer();
    this.labels.domElement.className = 'labels-layer';
    container.appendChild(this.labels.domElement);

    const scene = this.scene = new THREE.Scene();
    scene.background = this.makeBackground();
    const pmrem = new THREE.PMREMGenerator(r);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environmentIntensity = 0.5;

    this.camera = new THREE.PerspectiveCamera(32, 1, 2, 16000);
    this.camera.position.set(-62, 92, 118);

    const c = this.controls = new OrbitControls(this.camera, r.domElement);
    c.enableDamping = true; c.dampingFactor = 0.08;
    c.minDistance = 18; c.maxDistance = 6500;
    c.minPolarAngle = 0.001; c.maxPolarAngle = Math.PI - 0.001;
    c.target.set(0, 0, 0);
    c.rotateSpeed = 0.75; c.zoomSpeed = 1.1; c.panSpeed = 0.8;
    c.autoRotateSpeed = 1.2;
    c.addEventListener('start', () => { this.cancelFly(); });
    c.addEventListener('change', () => { if (this.fly) return; if (this._lastMove) this.handleMove(this._lastMove); });

    this.addLights();
    this.addDesk();

    // post processing: outline for hover/selection (LED glow uses halo sprites, not full-screen bloom)
    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(scene, this.camera));
    this.outline = new OutlinePass(new THREE.Vector2(1, 1), scene, this.camera);
    Object.assign(this.outline, { edgeStrength: 4.0, edgeGlow: 0.35, edgeThickness: 1.4, pulsePeriod: 0 });
    this.outline.visibleEdgeColor.set('#35d0ff'); this.outline.hiddenEdgeColor.set('#0b4a66');
    this.composer.addPass(this.outline);
    this.composer.addPass(new OutputPass());

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pickTargets = [];
    this.onHover = () => {}; this.onPick = () => {};
    this.fly = null;
    this.tickers = new Set();
    this.clock = new THREE.Timer();

    const el = r.domElement;
    let downAt = null;
    el.addEventListener('pointermove', e => { this._lastMove = e; this.handleMove(e); });
    el.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', e => {
      if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 5) this.handleClick(e);
      downAt = null;
    });
    el.addEventListener('pointerleave', () => { this._lastMove = null; this.onHover(null, null); });

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    r.setAnimationLoop(() => this.frame());
  }

  makeBackground() {
    return canvasTex(512, 512, (g, w, h) => {
      const grd = g.createRadialGradient(w * 0.5, h * 0.42, 20, w * 0.5, h * 0.55, w * 0.75);
      grd.addColorStop(0, '#3a4350'); grd.addColorStop(0.55, '#252b34'); grd.addColorStop(1, '#14171c');
      g.fillStyle = grd; g.fillRect(0, 0, w, h); noise(g, w, h, 4);
    });
  }

  addLights() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0xdfe8ff, 0x24211c, 0.25));
    const key = this.key = new THREE.DirectionalLight(0xfff4e6, 1.75);
    key.position.set(-70, 160, 90);
    key.castShadow = true;
    key.shadow.mapSize.set(4096, 4096);
    const sc = key.shadow.camera; sc.left = -150; sc.right = 150; sc.top = 150; sc.bottom = -150; sc.near = 10; sc.far = 500;
    key.shadow.bias = -0.00025; key.shadow.normalBias = 0.03; key.shadow.radius = 3;
    s.add(key);
    const rim = new THREE.DirectionalLight(0xcfe0ff, 0.45); rim.position.set(120, 60, -140); s.add(rim);
    const under = new THREE.DirectionalLight(0xffffff, 0.35); under.position.set(30, -150, 40); s.add(under);
  }

  addDesk() {
    // anti-static work mat under the board
    const tex = canvasTex(1024, 1024, (g, w, h) => {
      g.fillStyle = '#2f343b'; g.fillRect(0, 0, w, h); noise(g, w, h, 10);
      g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 2;
      for (let i = 0; i <= w; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.025)'; g.lineWidth = 1;
      for (let i = 0; i <= w; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
    }, { repeat: [34, 34] });
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0, transparent: true });
    const mesh = this.desk = new THREE.Mesh(new THREE.CircleGeometry(4800, 160), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -6.05;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px'; this.renderer.domElement.style.height = h + 'px';
    this.labels.setSize(w, h);
    this.composer.setSize(w, h);
    this.outline.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  setPointer(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  }

  pick(e) {
    this.setPointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pickTargets, true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.part && !o.userData.hw) o = o.parent;
      if (o && (o.userData.part || o.userData.hw)) return { id: o.userData.part || o.userData.hw, object: o, point: h.point };
      if (h.object.userData.noPick) continue;
      if (!h.object.userData.proxy) return null;   // something opaque in front
    }
    return null;
  }

  handleMove(e) { if (this.fly) return; this.onHover(this.pick(e), e); }
  handleClick(e) { this.onPick(this.pick(e), e); }

  /** Smooth camera move. dir = unit vector from target to camera. */
  flyTo(target, distance, dir = null, ms = 1100) {
    const from = { pos: this.camera.position.clone(), tgt: this.controls.target.clone() };
    const d = dir ? dir.clone().normalize() : this.camera.position.clone().sub(this.controls.target).normalize();
    const to = { pos: target.clone().add(d.multiplyScalar(distance)), tgt: target.clone() };
    this.fly = { from, to, t0: performance.now(), ms };
    this.onHover(null, null);
    return new Promise(res => { this.fly.res = res; });
  }
  cancelFly() { if (this.fly) { const r = this.fly.res; this.fly = null; r && r(); } }

  frame() {
    this.clock.update(); const dt = this.clock.getDelta();
    if (this.fly) {
      const f = this.fly, k = Math.min(1, (performance.now() - f.t0) / f.ms), e = ease(k);
      this.camera.position.lerpVectors(f.from.pos, f.to.pos, e);
      this.controls.target.lerpVectors(f.from.tgt, f.to.tgt, e);
      if (k >= 1) { this.fly = null; f.res && f.res(); }
    }
    this.controls.update(dt);
    // fade the desk when looking from below so the bottom side stays visible
    const below = this.camera.position.y < this.desk.position.y + 2;
    const target = below ? 0 : 1;
    this.desk.material.opacity += (target - this.desk.material.opacity) * 0.15;
    this.desk.visible = this.desk.material.opacity > 0.02;
    for (const t of this.tickers) t(dt);
    this.composer.render();
    this.labels.render(this.scene, this.camera);
  }
}

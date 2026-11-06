// Accessories for the Raspberry Pi 4 lessons: microSD card, micro-HDMI cable, USB keyboard / mouse cables.
// Sizes: microSD card 15 x 11 x 1.0 mm (SD Association card format). Plugs are generic cable ends sized to fit the
// receptacles modelled in board.js. Each plug slides along its port axis when it is plugged in or pulled out.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { M, canvasTex } from '../materials.js';
import { P, T } from './board.js';

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

/** All accessories of the setup lesson, built at the real port positions of the board model. */
export function makePiAccessories(board) {
  const sd = new MicroSD();
  const down = -5.6;   // cable centre 1.9–2.2 mm above the desk
  const hdmi = new PlugCable('hdmi', P(26.01, -1.45, 1.5), new THREE.Vector3(0, 0, 1), { depth: 4.5, route: [[60, down, 6], [140, down, 30], [260, down, 40]] });
  const kbd = new PlugCable('kbd', P(88.02, 8.99, 11.76), new THREE.Vector3(1, 0, 0), { depth: 8, route: [[60, -10, 0], [110, -15.9, 25], [220, -15.9, 60]] });
  const mouse = new PlugCable('mouse', P(88.02, 8.99, 4.06), new THREE.Vector3(1, 0, 0), { depth: 8, route: [[60, -5, -6], [110, -8.2, -30], [220, -8.2, -60]] });
  return { sd, hdmi, kbd, mouse, all: [sd, hdmi, kbd, mouse] };
}

export const PI_ACC_INFO = {
  'pi:sd': { name: 'microSD card', tag: 'The boot media', summary: 'Holds the operating system (Raspberry Pi OS). It is prepared on another computer with Raspberry Pi Imager, then inserted with the label facing away from the Raspberry Pi.', points: ['Raspberry Pi OS: at least 32 GB recommended (Lite: 8 GB).'], src: 'raspberrypi.com — Getting started' },
  'pi:hdmi': { name: 'micro-HDMI to HDMI cable', tag: 'Monitor', summary: 'The small end goes into the Raspberry Pi, the large (full-size HDMI) end into the monitor. The primary monitor goes in HDMI0.', src: 'raspberrypi.com — Getting started' },
  'pi:kbd': { name: 'USB keyboard', tag: 'Input', summary: 'Plugged into a black USB 2.0 port, so the blue USB 3.0 ports stay free for fast devices.', src: 'raspberrypi.com — Getting started' },
  'pi:mouse': { name: 'USB mouse', tag: 'Input', summary: 'Also in a black USB 2.0 port.', src: 'raspberrypi.com — Getting started' },
};

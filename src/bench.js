// Generic breadboard bench: builds a lesson circuit from a plain description.
//   { id:'r1', type:'resistor', a:'c10', b:'c14' }
//   { id:'led1', type:'led', anode:'d14', cathode:'d15' }
//   { id:'btn1', type:'button', col:20 }            legs e20 e22 f20 f22 (straddles the gap)
//   { id:'pot1', type:'pot', row:'e', col:24 }       legs e24 e26 e28
//   { id:'bz1', type:'buzzer', plus:'e23', minus:'e26' }
//   { id:'ldr1', type:'ldr', a:'e22', b:'e23' }
//   { id:'us1', type:'hcsr04', row:'j', col:11 }       legs Vcc j11, Trig j12, Echo j13, Gnd j14 (transducers face +z)
//   { id:'t1', type:'tmp36', row:'e', col:18 }        legs +VS e18, VOUT e19, GND e20 (flat face toward +z)
//   { id:'w1', type:'wire', from:'D5', to:'a10', color:'yellow' }
import * as THREE from 'three';
import { Resistor, LED5mm, RGBLED5mm, DHTSensor, NeoPixelStrip, Diode1N4007, TransistorPN2222A, LCD1602Module, OLED128x64Module, JoystickModule, EncoderModule, JumperWire, PushButton, Potentiometer, PiezoBuzzer, LDR, TMP36, HCSR04, PIRModule, FemaleJumper, ServoMotor, L293D, BatteryPack, HobbyMotor, LeadWire, RelayModule, MiniLamp, ModulinoThermo, ModulinoPixels, QwiicCable, SHT31Breakout, DESK_Y } from './hardware.js';

import { resistorBands } from './freebuild/circuit.js';

const HOLE = /^([a-j])(\d{1,2})$/;

export class Bench {
  constructor(scene, board, bb) {
    this.scene = scene; this.board = board; this.bb = bb;
    this.items = {};        // id -> { def, obj, group }
    this.defs = [];
    this.trayN = 0;
  }

  point(ref) {
    const m = HOLE.exec(ref);
    if (m) return this.bb.hole(m[1], +m[2]);
    const rl = /^r:(top[+-]|bot[+-]):(\d+)$/.exec(ref);
    if (rl) return this.bb.rail(rl[1], +rl[2]);
    if (ref === 'QWIIC') return this.board.qwiic.pos.clone();
    const mp = /^(\w+)\.(VCC|OUT|GND|POS|NEG|M1|M2|DCP|DCN|IN|NO|COM|NC|L1|L2|QA|QB)$/.exec(ref);
    if (mp && this.items[mp[1]]) return this.items[mp[1]].obj.pin(mp[2]).pos;
    const p = this.board.pins[ref];
    if (!p) throw new Error('unknown endpoint ' + ref);
    return p.pos.clone();
  }

  /** outward direction of a screw-terminal reference (relay module / lamp), or null */
  termDir(ref) {
    if (ref === 'QWIIC') return new THREE.Vector3(1, 0, 0);
    const m = /^(\w+)\.(DCP|DCN|IN|NO|COM|NC|L1|L2|QA|QB)$/.exec(ref);
    return m && this.items[m[1]] ? this.items[m[1]].obj.pin(m[2]).dir : null;
  }

  has(ids) { return ids.every(id => !!this.items[id]); }
  get(id) { return this.items[id] && this.items[id].obj; }

  /** lesson circuit description */
  setDefs(defs) {
    for (const id of Object.keys(this.items)) if (!defs.find(d => d.id === id)) this.remove(id);
    this.defs = defs;
  }

  remove(id) {
    const it = this.items[id]; if (!it) return;
    this.scene.remove(it.group);
    delete this.items[id];
  }
  clear() { for (const id of Object.keys(this.items)) this.remove(id); this.hideTray(); }

  // ------------------------------------------------------------ tray (parts waiting next to the breadboard)
  showTray(placedIds) {
    this.hideTray();
    let k = 0;
    this.tray = [];
    for (const d of this.defs) {
      if ((d.type === 'wire' || d.type === 'fwire' || d.type === 'lead' || d.type === 'qwiic') || placedIds.includes(d.id) || this.items[d.id]) continue;
      const { obj } = this.create(d);
      const g = obj.group;
      g.position.set(52 + (k % 2) * 13, DESK_Y + 3.0, 50 + Math.floor(k / 2) * 16);
      g.rotation.set(0, 0.5, 0);
      g.userData.trayOf = d.id;
      this.scene.add(g); this.tray.push({ id: d.id, obj });
      k++;
    }
  }
  hideTray() { if (this.tray) for (const t of this.tray) this.scene.remove(t.obj.group); this.tray = []; }

  // ------------------------------------------------------------ building
  create(d) {
    let obj;
    switch (d.type) {
      case 'resistor': obj = new Resistor(d.bands || resistorBands(d.ohms || 220),this.point(d.a).distanceTo(this.point(d.b)), d.hw || 'resistor'); break;
      case 'ldr': obj = new LDR(); break;
      case 'tmp36': obj = new TMP36(); break;
      case 'npn': obj = new TransistorPN2222A(); break;
      case 'diode': obj = new Diode1N4007(this.point(d.a).distanceTo(this.point(d.k))); break;
      case 'sht31': obj = new SHT31Breakout(); break;
      case 'hcsr04': obj = new HCSR04(); break;
      case 'pir': obj = new PIRModule(); break;
      case 'l293d': obj = new L293D(); break;
      case 'battery': obj = new BatteryPack(); break;
      case 'motor': obj = new HobbyMotor(); break;
      case 'lead': { const [pid, pn] = d.from.split('.'); const p = this.items[pid].obj.pin(pn); const dirB = this.termDir(d.to); obj = new LeadWire(p.pos, p.dir, this.point(d.to), d.color, { lift: d.lift ?? 16, id: 'lead', dirB, clamp: !!this.termDir(d.from) }); break; }
      case 'relay': obj = new RelayModule(); break;
      case 'thermo': obj = new ModulinoThermo(); break;
      case 'pixels': obj = new ModulinoPixels(); break;
      case 'qwiic': obj = new QwiicCable(this.point(d.from), this.termDir(d.from), this.point(d.to), this.termDir(d.to), { lift: d.lift ?? 5 }); break;
      case 'lamp': obj = new MiniLamp(); break;
      case 'neopixel': obj = new NeoPixelStrip(); break;
      case 'lcd1602': obj = new LCD1602Module(); break;
      case 'oled': obj = new OLED128x64Module(); break;
      case 'servo': obj = new ServoMotor(new THREE.Vector3(d.bx, DESK_Y, d.bz).sub(this.bb.hole(d.row, d.col + 1))); break;
      case 'fwire': { const bp = this.board.pins[d.from]; const p = bp && bp.female ? { pos: bp.female.clone(), dir: new THREE.Vector3(0, 1, 0) } : (([pid, pn]) => this.items[pid].obj.pin(pn))(d.from.split('.')); obj = new FemaleJumper(p.pos, p.dir, this.point(d.to), d.color, { lift: d.lift ?? 30, id: 'jumper' }); break; }
      case 'led': obj = new LED5mm(d.hex ?? d.color); break;
      case 'rgbled': obj = new RGBLED5mm(!!d.ca); break;
      case 'dht': obj = new DHTSensor(d.model || 'dht11'); break;
      case 'joystick': obj = new JoystickModule(); break;
      case 'encoder': obj = new EncoderModule(); break;
      case 'button': obj = new PushButton(); break;
      case 'pot': obj = new Potentiometer(); break;
      case 'buzzer': obj = new PiezoBuzzer(); break;
      case 'wire': obj = new JumperWire(this.point(d.from), this.point(d.to), d.color, { id: 'jumper', lift: d.lift ?? 10, depthA: 5, depthB: 5 }); break;
      default: throw new Error('unknown part ' + d.type);
    }
    return { obj };
  }

  pose(d) {
    const P = r => this.point(r);
    switch (d.type) {
      case 'resistor': { const a = P(d.a), b = P(d.b); return { pos: a.clone().lerp(b, 0.5), rotY: Math.atan2(-(b.z - a.z), b.x - a.x) }; }
      case 'led': { const a = P(d.anode), c = P(d.cathode); return { pos: a.clone().lerp(c, 0.5), rotY: Math.atan2(-(a.z - c.z), a.x - c.x) }; }
      case 'button': { const a = this.bb.hole('e', d.col), b = this.bb.hole('f', d.col + 2); return { pos: a.clone().lerp(b, 0.5), rotY: 0 }; }
      case 'pot': { return { pos: this.bb.hole(d.row, d.col + 2), rotY: 0 }; }
      case 'buzzer': { const p = P(d.plus), m = P(d.minus); return { pos: p.clone().lerp(m, 0.5), rotY: Math.atan2(-(m.z - p.z), m.x - p.x) }; }
      case 'ldr': { const a = P(d.a), b = P(d.b); return { pos: a.clone().lerp(b, 0.5), rotY: Math.atan2(-(b.z - a.z), b.x - a.x) }; }
      case 'tmp36': case 'npn': return { pos: this.bb.hole(d.row, d.col + 1), rotY: d.flip ? Math.PI : 0 };
      case 'diode': { const a = P(d.a), k = P(d.k); return { pos: a.clone().lerp(k, 0.5), rotY: Math.atan2(-(k.z - a.z), k.x - a.x) }; }
      case 'sht31': return { pos: this.bb.hole(d.row, d.col + 3), rotY: 0 };   // 7 pins in columns col … col+6
      case 'pir': return { pos: new THREE.Vector3(d.x, DESK_Y, d.z), rotY: d.rotY || 0 };
      case 'servo': return { pos: this.bb.hole(d.row, d.col + 1), rotY: 0 };
      case 'joystick': case 'encoder': return { pos: this.bb.hole(d.row, d.col + 2), rotY: 0 };
      case 'dht': return { pos: this.bb.hole(d.row, d.col + 1).lerp(this.bb.hole(d.row, d.col + 2), 0.5), rotY: 0 };
      case 'rgbled': return { pos: this.bb.hole(d.row, d.col + 1).lerp(this.bb.hole(d.row, d.col + 2), 0.5), rotY: 0 };
      case 'l293d': return { pos: this.bb.hole('e', d.col).lerp(this.bb.hole('f', d.col + 7), 0.5), rotY: 0 };
      case 'battery': case 'motor': case 'relay': case 'lamp': case 'neopixel': case 'lcd1602': case 'oled': case 'thermo': case 'pixels': return { pos: new THREE.Vector3(d.x, DESK_Y, d.z), rotY: d.rotY || 0 };
      case 'hcsr04': return { pos: this.bb.hole(d.row, d.col + 1).lerp(this.bb.hole(d.row, d.col + 2), 0.5), rotY: 0 };
      default: return null;
    }
  }

  async add(d, animate) {
    if (this.items[d.id]) return;
    let fromTray = null;
    if (this.tray) { const i = this.tray.findIndex(t => t.id === d.id); if (i >= 0) { fromTray = this.tray[i]; this.tray.splice(i, 1); } }
    const obj = fromTray ? fromTray.obj : this.create(d).obj;
    const g = obj.group;
    this.items[d.id] = { def: d, obj, group: g };
    if ((d.type === 'wire' || d.type === 'fwire' || d.type === 'lead' || d.type === 'qwiic')) {
      this.scene.add(g);
      if (animate) await obj.grow(1100);
      return;
    }
    const { pos, rotY } = this.pose(d);
    if (!fromTray) this.scene.add(g);
    if (animate) await moveTo(g, pos, rotY, fromTray ? 900 : 700, !fromTray);
    else { g.position.copy(pos); g.rotation.set(0, rotY, 0); }
  }

  /** free-build: create, pose and show a part at once (no animation) */
  place(d) {
    if (this.items[d.id]) this.remove(d.id);
    const obj = this.create(d).obj, g = obj.group;
    this.items[d.id] = { def: d, obj, group: g };
    this.scene.add(g);
    if (!(d.type === 'wire' || d.type === 'fwire' || d.type === 'lead' || d.type === 'qwiic')) { const { pos, rotY } = this.pose(d); g.position.copy(pos); g.rotation.set(0, rotY, 0); }
    return obj;
  }

  /** make exactly `ids` present; parts listed in `animateIds` are animated in order */
  async build(ids, animateIds = [], alive = () => true) {
    for (const id of Object.keys(this.items)) if (!ids.includes(id)) this.remove(id);
    this.showTray(ids.filter(id => !animateIds.includes(id)));
    for (const d of this.defs) {
      if (!ids.includes(d.id) || this.items[d.id]) continue;
      const anim = animateIds.includes(d.id);
      if (anim && !alive()) return;
      await this.add(d, anim && alive());
    }
  }

  groups(ids) { return ids.map(id => this.items[id] && this.items[id].group).filter(Boolean); }
  pickables() { return [...Object.values(this.items).map(i => i.group), ...(this.tray || []).map(t => t.obj.group)]; }
}

function moveTo(obj, pos, rotY, ms, drop) {
  const p0 = drop ? pos.clone().add(new THREE.Vector3(0, 30, 0)) : obj.position.clone();
  const r0 = drop ? rotY : obj.rotation.y;
  obj.rotation.set(0, r0, 0);
  const lift = drop ? 0 : 22, t0 = performance.now();
  return new Promise(res => {
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      obj.position.lerpVectors(p0, pos, e); obj.position.y += Math.sin(Math.PI * e) * lift;
      obj.rotation.y = r0 + (rotY - r0) * e;
      if (k < 1) requestAnimationFrame(step); else res();
    };
    step();
  });
}

// Browser-only additions of slot g: 3D model 'mod_ads1115' (ADS1115 ADC breakout), its info card and the simulated device 'ads'
// (RC capacitor read through an ADS1115). Imported by ui.js, never by the node check tools.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BREAKOUTS, HW_INFO } from '../hardware.js';
import { DEVICE_REG } from '../devices.js';

const $ = s => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const BOX = (g, w, h, d, x, y, z, color, rough = 0.5, metal = 0) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(0.25, h / 3)), new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })); m.position.set(x, y, z); g.add(m); return m; };

// Generic ADS1115 breakout (10-pin header: VDD, GND, SCL, SDA, ADDR, ALRT, A0..A3). The chip is a tiny 10-pin package (about 3 x 3 mm).
BREAKOUTS.mod_ads1115 = { title: 'ADS1115', names: ['VDD', 'GND', 'SCL', 'SDA', 'ADDR', 'ALRT', 'A0', 'A1', 'A2', 'A3'], w: 31, d: 20, color: 0x1d4fb8, edge: 0x14264a, extras(g) {
  BOX(g, 3.2, 0.9, 3.2, 0, 3.7, -1, 0x101012, 0.45);                       // the ADS1115 chip
  BOX(g, 1.6, 0.5, 0.8, -8, 3.5, 0.5, 0x2b2b2e, 0.5);                       // two small pull-up resistors (SDA / SCL)
  BOX(g, 1.6, 0.5, 0.8, -6, 3.5, 0.5, 0x2b2b2e, 0.5);
  BOX(g, 1.6, 0.5, 0.8, 7, 3.5, -2, 0x8a6a3a, 0.5);                         // decoupling capacitor
  BOX(g, 1.6, 0.5, 0.8, 9, 3.5, -2, 0x8a6a3a, 0.5); } };

HW_INFO.mod_ads1115 = {
  name: 'ADS1115 16-bit ADC breakout', tag: 'Gives the Pi an analog input over I²C',
  summary: 'A breakout with the Texas Instruments ADS1115, a 16-bit analog-to-digital converter with four inputs (A0 to A3). The board talks to the Pi over I²C. The Pi itself has no analog inputs, so this is how a Pi reads a slowly changing voltage.',
  points: [
    'TI datasheet: supply 2.0 to 5.5 V; 16-bit resolution; 8 to 860 samples per second; programmable full scale ±6.144, ±4.096, ±2.048, ±1.024, ±0.512 or ±0.256 V. Adafruit’s guide gives the same supply range for its board and a default address of 0x48.',
    'The ADDR pin sets the I²C address: GND = 0x48, VDD = 0x49, SDA = 0x4A, SCL = 0x4B (TI datasheet).',
    'The inputs must stay between GND − 0.3 V and VDD + 0.3 V (datasheet absolute maximum), even on the ±6.144 V range. Power it from 3V3 on a Pi so the I²C lines stay at 3.3 V.',
    'This picture is a generic breakout: pin names and order differ between makers (Adafruit labels the supply pin VIN), so read the silkscreen of your board. The chip is really only about 3 mm wide.',
  ],
  src: 'ADS1113/ADS1114/ADS1115 datasheet (Texas Instruments); Adafruit 4-channel ADC breakouts guide',
};

// ---- the simulated device: a 100 uF capacitor charged through 10 kOhm from a GPIO pin, read through an ADS1115 --------------------------
const RC = DEVICE_REG.rc;
const FS = { 0.6667: 6.144, 1: 4.096, 2: 2.048, 4: 1.024, 8: 0.512, 16: 0.256 };
const fsOf = g => FS[Math.abs(g - 2 / 3) < 1e-3 ? 0.6667 : g] ?? 4.096;

class AdsRc extends RC {
  name = 'ads'; addr = 0x48; wireAddr = 0x48; gain = 1; last = null;
  get VS() { return 3.3; }                                        // the Pi pin gives 3.3 V
  tau() { const io = this.ios().find(x => x.role === 'drive'); return io ? io.r * io.c : 1; }
  html() {
    return this.box('Capacitor voltage, read by the ADS1115', `<canvas id="rc-cv" width="300" height="130" style="width:100%;background:#0d1117;border-radius:6px"></canvas><div id="rc-st" class="io-val">—</div>
      <div class="throw"><label>ADDR pin wired to</label><select id="ad-ad"><option value="72">GND (address 0x48)</option><option value="73">VDD (address 0x49)</option></select></div>
      <div id="ad-st" class="io-val" style="font-size:11px">—</div>`,
      'Charge and discharge follow V = V<sub>final</sub> + (V<sub>start</sub> − V<sub>final</sub>) · e<sup>−t/RC</sup> with the ideal R and C. The ADC reading is the voltage divided by the LSB of the chosen full-scale range; sampling time is not modelled.');
  }
  bind() { const s = $('#ad-ad'); if (s) { s.value = String(this.wireAddr); s.onchange = e => { this.wireAddr = +e.target.value; }; } }
  reset() { super.reset(); this.last = null; this.gain = 1; }
  call(op, a) {
    if (!this.on()) return op === 'begin' ? 0 : undefined;
    if (op === 'begin') return this.wireAddr === 0x48 ? 0x48 : 0;   // the library opens 0x48 by default
    if (op === 'gain') { this.gain = a; return; }
    if (op === 'read') {
      this.step();
      const fs = fsOf(this.gain), v = clamp(this.V + (Math.random() - 0.5) * 0.0006, 0, this.VS + 0.3);
      const raw = clamp(Math.round(v / fs * 32768), -32768, 32767), volts = raw * fs / 32768;
      this.last = { raw, volts, fs, lsb: fs / 32768 };
      return this.last;
    }
    return undefined;
  }
  tick() {
    super.tick();
    const l = this.last;
    this.set('#ad-st', this.stateNote() || (l ? `ADS1115 at 0x${this.wireAddr.toString(16)} · gain ${this.gain === 1 ? '1' : this.gain} = ±${l.fs} V full scale (1 count = ${(l.lsb * 1e6).toFixed(0)} µV) · last count <b>${l.raw}</b> = <b>${l.volts.toFixed(4)} V</b>` : 'No reading yet.'));
  }
}
DEVICE_REG.ads = AdsRc;

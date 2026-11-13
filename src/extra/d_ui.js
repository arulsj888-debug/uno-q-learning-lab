// Browser-only additions of slot d: 3D models of the AI-Thinker ESP32-CAM and a USB-serial adapter, their info cards, and a simulated
// "camera" device that shows a PLACEHOLDER test picture (the simulator cannot show what a real camera sees). Imported by ui.js, never by the node check tools.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BREAKOUTS, HW_INFO } from '../hardware.js';
import { DEVICE_REG, Dev } from '../devices.js';

const BOX = (g, w, h, d, x, y, z, color, rough = 0.5, metal = 0) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(0.25, h / 3)), new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })); m.position.set(x, y, z); g.add(m); return m; };
const CYL = (g, r, h, x, y, z, color, rough = 0.5, metal = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })); m.position.set(x, y, z); g.add(m); return m; };

// Simplified drawing: the real module has 16 pins in two rows and the pins on the long sides. Only the pins used in the lesson are drawn.
// Size of the AI-Thinker board: about 27 x 40.5 mm (typical value, not from a datasheet).
BREAKOUTS.mod_espcam = {
  title: 'ESP32-CAM', names: ['5V', 'IO12', 'IO13', 'IO15', 'IO14', 'IO2', 'IO4'], back: ['3V3', 'IO16', 'IO0', 'GND', 'VCC', 'U0R', 'U0T'], w: 40.5, d: 27, color: 0x15151a, edge: 0x0a0a0c,
  extras(g) {
    BOX(g, 16, 2.4, 13, -6, 4.6, 0, 0xc4c7cc, 0.3, 0.85);            // metal shield of the ESP32-S module
    BOX(g, 7, 1.2, 10, 6.5, 4, 0, 0x0e0e10, 0.5);                    // PSRAM / flash area
    BOX(g, 9, 7, 9, 15, 6.2, 0, 0x1a1a1c, 0.5);                      // camera holder
    CYL(g, 3, 3.2, 15, 11.4, 0, 0x08080a, 0.15, 0.2);                // lens
    CYL(g, 1.9, 0.4, 15, 13.1, 0, 0x2a3f6e, 0.1, 0.4);               // glass
    BOX(g, 4, 1.8, 3, -17, 4.2, -8, 0xd9d9d4, 0.4, 0.5);             // antenna connector
    BOX(g, 3, 1, 3, 3.5, 3.8, 9, 0xf4f4ee, 0.4);                     // the flash LED (GPIO4 in the Espressif pin map): a white block
  },
};
BREAKOUTS.mod_ftdi = {
  title: 'USB-SERIAL', names: ['GND', 'VCC', 'TX', 'RX'], w: 24, d: 20, color: 0x1d4fb8, edge: 0x14264a,
  extras(g) {
    BOX(g, 8, 3.4, 8, -6, 5, -3, 0x15151a, 0.5);                      // the USB-serial chip
    BOX(g, 8, 4.5, 9, 7, 5.5, -5, 0xb8bcc2, 0.3, 0.85);               // USB connector
    BOX(g, 6, 3, 2.6, 0, 4.4, 3, 0x15151a, 0.5);                      // 3.3 V / 5 V jumper block
  },
};
Object.assign(HW_INFO, {
  mod_espcam: {
    name: 'ESP32-CAM (AI-Thinker)', tag: 'An ESP32 with a camera and a microSD slot, but no USB',
    summary: 'A small ESP32 board with an OV2640 camera on a flat cable, a microSD slot and an antenna, sold by AI-Thinker. It has no USB connector and no USB-serial chip: you program it through its serial pins with a separate USB-serial adapter.',
    points: [
      'Camera pins (Espressif camera_pins.h, AI-Thinker model): XCLK GPIO0, SIOD GPIO26, SIOC GPIO27, PWDN GPIO32, data Y2..Y9 on GPIO5, 18, 19, 21, 36, 39, 34, 35, VSYNC GPIO25, HREF GPIO23, PCLK GPIO22.',
      'GPIO0 is also the camera clock: for flashing it must be tied to GND while the board resets, and the jumper must be removed afterwards.',
      'Power it from a 5 V supply that can deliver enough current: weak supplies cause brownout and camera-init errors (a very common report).',
      'This drawing is simplified: only the pins used in the lesson are shown, and their order is the usual one, not checked against your board. Read the printing on your board.',
    ],
    src: 'Espressif arduino-esp32 CameraWebServer camera_pins.h; Random Nerd Tutorials: ESP32-CAM video streaming',
  },
  mod_ftdi: {
    name: 'USB-serial adapter (FTDI-style)', tag: 'Gives a board without USB a serial port',
    summary: 'A small board with a USB connector and a USB-to-UART chip. It turns the USB port of your computer into TX / RX serial lines at 3.3 V (or 5 V) logic and supplies power.',
    points: [
      'TX of the adapter goes to the RX pin of the target and RX to its TX (crossed).',
      'Most adapters have a jumper or switch for 3.3 V or 5 V: check the position before you connect.',
      'This picture is a generic adapter, not a model of a specific one. Pin names and order differ between makers.',
    ],
    src: 'General USB-to-UART adapter practice',
  },
});

// ---------------------------------------------------------------- the placeholder "camera" (the picture is NOT from a camera)
const $ = s => document.querySelector(s);
class CamDev extends Dev {
  name = 'cam'; shot = null;
  wired() { return true; }
  html() {
    return this.box('Picture from the camera', '<canvas id="cam-cv" width="320" height="240" style="width:100%;background:#0d1117;border-radius:6px"></canvas><div id="cam-st" class="io-val">—</div>',
      'PLACEHOLDER: the simulator cannot show what a real camera sees. This is a standard colour-bar test image, drawn by the browser.');
  }
  bind() { this.draw(); }
  reset() { this.shot = null; this.draw(); }
  call(op, w, h, n) { if (op === 'shot' && this.on()) { this.shot = { w, h, n }; this.draw(); return true; } return undefined; }
  draw() {
    const cv = $('#cam-cv'); if (!cv) return;
    const c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
    if (!this.shot) { c.fillStyle = '#141a22'; c.fillRect(0, 0, W, H); c.fillStyle = '#8b98a8'; c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText('no picture taken yet', W / 2, H / 2); this.set('#cam-st', this.stateNote() || 'Waiting for esp_camera_fb_get().'); return; }
    const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    bars.forEach((col, i) => { c.fillStyle = col; c.fillRect(i * W / 7, 0, W / 7 + 1, H * 0.72); });
    ['#0000c0', '#101010', '#c000c0', '#101010', '#00c0c0', '#101010', '#c0c0c0'].forEach((col, i) => { c.fillStyle = col; c.fillRect(i * W / 7, H * 0.72, W / 7 + 1, H * 0.1); });
    c.fillStyle = '#101010'; c.fillRect(0, H * 0.82, W, H * 0.18);
    c.fillStyle = '#fff'; c.font = 'bold 15px sans-serif'; c.textAlign = 'center'; c.fillText('TEST IMAGE: not from a camera', W / 2, H * 0.92);
    this.set('#cam-st', `Placeholder for one JPEG frame: <b>${this.shot.w} × ${this.shot.h}</b> (size and bytes are example values)`);
  }
  tick() { if (!this.shot) this.draw(); }
}
DEVICE_REG.cam = CamDev;

export {};

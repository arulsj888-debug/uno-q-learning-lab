// Browser-only additions of slot c: 3D breakout models (SX1276 / RFM95W LoRa module, XBee S2C on a breakout), info cards and the simulated devices
// 'lora' and 'xbee' (device logic in c_dev.js). Imported by ui.js, never by the node check tools.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BREAKOUTS, HW_INFO } from '../hardware.js';
import { DEVICE_REG } from '../devices.js';
import { LoRaDev, XBeeDev } from './c_dev.js';

const BOX = (g, w, h, d, x, y, z, color, rough = 0.5, metal = 0) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(0.25, h / 3)), new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })); m.position.set(x, y, z); g.add(m); return m; };
const CYL = (g, r, h, x, y, z, color, rough = 0.5, metal = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })); m.position.set(x, y, z); g.add(m); return m; };

// RFM95W-style module on a small breakout: module board with the SX1276 chip and a crystal, an SMA socket and a rubber-duck antenna.
BREAKOUTS.mod_sx1276 = { title: 'RFM95W · SX1276', names: ['VCC', 'GND', 'SCK', 'MISO', 'MOSI', 'NSS', 'RST', 'DIO0'], w: 36, d: 30, color: 0x16171b, edge: 0x0b0b0d, extras(g) {
  BOX(g, 16, 1.4, 16, -6, 4.0, 0, 0x2a2d35, 0.5);                       // the module board (about 16 mm square)
  BOX(g, 6, 1, 6, -8, 5.0, 1, 0x101012, 0.45);                           // SX1276 chip
  BOX(g, 3.2, 0.9, 2.2, -2, 4.9, -3, 0xb8bcc2, 0.35, 0.85);              // crystal can
  BOX(g, 1.6, 0.8, 1.6, -3, 4.8, 4, 0x151517, 0.5);
  BOX(g, 7, 7, 8, 13, 6.3, -9, 0xd7b54a, 0.3, 0.9);                       // SMA socket on the back edge
  CYL(g, 1.8, 3, 13, 11.3, -9, 0xd7b54a, 0.3, 0.9);
  CYL(g, 3.4, 4, 13, 14.8, -9, 0x1a1a1d, 0.55);                           // antenna base
  CYL(g, 2.4, 38, 13, 35.8, -9, 0x1a1a1d, 0.55);                          // rubber-duck antenna
  CYL(g, 2.4, 0.1, 13, 54.9, -9, 0x2a2a2d, 0.6); } };

// XBee S2C through-hole module (about 24 x 28 mm, metal shield, PCB antenna end) in a red breakout; four pins are used.
BREAKOUTS.mod_xbee = { title: 'XBee S2C', names: ['VCC', 'DOUT', 'DIN', 'GND'], w: 34, d: 46, color: 0xb11d1d, edge: 0x6e1010, extras(g) {
  BOX(g, 25, 1.2, 28, 0, 4.0, -1, 0x1c3f7a, 0.5);                         // module board
  BOX(g, 17, 2.6, 15, 0, 5.9, 4, 0xc4c7cc, 0.3, 0.85);                    // metal shield
  for (let i = 0; i < 4; i++) BOX(g, 17, 0.25, 0.7, 0, 4.7, -9 - i * 1.6, 0xd7b54a, 0.35, 0.8);   // trace antenna (drawn as strips)
  BOX(g, 2, 1, 2, 12.5, 4.0, 14, 0x2fd06b, 0.4).material.emissive = new THREE.Color(0x0b4d22); } };

HW_INFO.mod_sx1276 = {
  name: 'SX1276 LoRa module (RFM95W breakout)', tag: 'Long range, low data rate radio',
  summary: 'A radio module with the Semtech SX1276 chip. It sends small packets over long distances using LoRa modulation, and talks to the board over SPI. It needs an antenna for the right band, and the band you may use depends on your country.',
  points: [
    'Semtech datasheet (rev. 7): chip frequency range 137 to 1020 MHz, supply 1.8 to 3.7 V (absolute maximum 3.9 V), spreading factors 6 to 12, bandwidths 7.8 to 500 kHz. The pins are 3.3 V logic: a 5 V board needs a level shifter.',
    'Typical modules are sold for one band: 433 MHz, 868 MHz or 915 MHz. Which one is allowed, with which power and duty cycle, depends on the country. This is not legal advice.',
    'Connect the antenna before transmitting. Breakout pin order and names differ between makers; this is a typical layout (NSS = chip select, RST = reset, DIO0 = interrupt output, optional).',
    'Both sides need the same frequency, spreading factor, bandwidth and sync word. A higher spreading factor needs a lower signal-to-noise ratio at the receiver (longer range) but the packet takes longer on air.',
  ],
  src: 'SX1276/77/78/79 datasheet rev. 7 (Semtech); arduino-LoRa library (Sandeep Mistry)',
};
HW_INFO.mod_xbee = {
  name: 'XBee S2C Zigbee module (on a breakout)', tag: 'A Zigbee mesh node with a serial port',
  summary: 'A Digi XBee S2C module running Zigbee firmware. In transparent mode it behaves like a wireless serial cable: bytes in at DIN are sent over the air to the destination, bytes received come out at DOUT.',
  points: [
    'Digi datasheet: supply 2.1 to 3.6 V, 2.4 GHz band, 250 kbit/s on the radio, 16 channels (11 to 26), UART or SPI. Transmit current 33 mA (45 mA in boost mode).',
    'The UART is 3.3 V. Whether DIN tolerates 5 V is not verified here: use a divider or level shifter from a 5 V board.',
    'Factory UART setting: 9600 baud (BD = 3), 8 data bits, no parity, 1 stop bit. Network settings (PAN ID, coordinator or router, destination DH/DL) are made with Digi’s XCTU program.',
    'Real modules come with a PCB trace antenna, a wire, a U.FL or an RPSMA connector; the lab shows the PCB antenna type. Radio rules depend on the country.',
  ],
  src: 'Digi XBee Zigbee datasheet and XBee/XBee-PRO S2C Zigbee user guide',
};
DEVICE_REG.lora = LoRaDev;
DEVICE_REG.xbee = XBeeDev;

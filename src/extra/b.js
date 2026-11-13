// Extra lessons of slot b: a 12 V solenoid switched by a MOSFET (with flyback diode and its own supply) and a 1.54 inch 200 x 200 e-paper display.
// For each board: UNO R3 (u3), ESP32 (e32), UNO Q (uq), Raspberry Pi 4 (pi). Modules 40 (solenoid) and 41 (e-paper).
// Listings are in `code`, the simulated programs in `programs`, line checks in `checks` (tool names X_b_...). The programs take their line numbers from the
// listings themselves (ln), so listing and program cannot drift apart. 3D models and simulated devices (bsol, bepd): ./b_ui.js (browser only).
// Library calls (GxEPD2, GPIO Zero, Waveshare Python) are written from memory and from the documents named in `sources`; they were NOT run on real hardware.

const R = (t, u) => ({ t, u });
const S = {
  sol: R('DigiKey: Adafruit 412 small push-pull solenoid (12 VDC, intermittent duty, 5.50 mm stroke)', 'https://www.digikey.sg/product-detail/en/adafruit-industries-llc/412/5819056'),
  sol2: R('The Pi Hut: small push-pull solenoid 12 VDC (retailer listing of the Adafruit 412)', 'https://thepihut.com/products/small-push-pull-solenoid-12vdc'),
  irlz44n: R('Infineon IRLZ44NPbF datasheet', 'https://www.infineon.com/dgdl/irlz44npbf.pdf?fileId=5546d462533600a40153567206892720'),
  d1n4007: R('Vishay 1N4001 to 1N4007 datasheet (1 A average forward current, the band marks the cathode)', 'https://www.vishay.com/docs/88503/1n4001.pdf'),
  wsman: R('Waveshare: 1.54inch e-Paper Module manual (resolution, SPI, refresh time, care rules, wiring)', 'https://www.waveshare.com/wiki/1.54inch_e-Paper_Module_Manual'),
  gxepd2: R('GxEPD2 library (Jean-Marc Zingg): lists the GDEH0154D67 200x200 panel with an SSD1681 controller', 'https://github.com/ZinggJM/GxEPD2'),
  wslib: R('Waveshare e-Paper repository: Python library epd1in54_V2 and its example', 'https://github.com/waveshareteam/e-Paper'),
  dw: R('Arduino reference: digitalWrite()', 'https://docs.arduino.cc/language-reference/en/functions/digital-io/digitalwrite/'),
  gz: R('GPIO Zero documentation: Generic output devices (OutputDevice)', 'https://gpiozero.readthedocs.io/en/stable/api_output.html'),
  u3ds: R('Arduino UNO R3 datasheet (A000066)', 'https://docs.arduino.cc/hardware/uno-rev3/'),
  atm: R('Microchip ATmega328P datasheet', 'https://ww1.microchip.com/downloads/en/DeviceDoc/ATmega48A-PA-88A-PA-168A-PA-328-P-DS-DS40002061A.pdf'),
  e32ds: R('Espressif ESP32 Series Datasheet v5.3', 'https://documentation.espressif.com/esp32_datasheet_en.pdf'),
  uqds: R('Arduino UNO Q datasheet (ABX00162-ABX00173)', 'https://docs.arduino.cc/hardware/uno-q/'),
  pins: R('Raspberry Pi documentation: GPIO and the 40-pin header', 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#gpio'),
};

// ---- helpers ------------------------------------------------------------------------------------
const ln = (code, s, nth = 1) => { const a = code.split('\n'); let c = 0; for (let i = 0; i < a.length; i++) if (a[i].includes(s) && ++c === nth) return i + 1; throw new Error('b.js: "' + s + '" not in listing'); };
const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const jw = (id, from, to, color = 'black', lift = 12) => ({ id, type: 'wire', from, to, color, lift });
const ids = a => a.map(d => d.id);
const mod = (id, model, x, z) => ({ id, type: 'mod', model, x, z });
const STEP = (title, view, have, body, o = {}) => ({ title, view, have, power: false, body, ...o });
const mio = (kind, item, needs, map, pw) => { const o = {}; let first = true; for (const [pin, [role, mp]] of Object.entries(map)) { o[pin] = { kind: 'dev:' + kind, role, item, mp, needs }; if (first && pw) { o[pin].pw = pw; first = false; } } return o; };
const COL = { VCC: 'red', GND: 'black', '3V3': 'red' };
const COLORS = ['blue', 'green', 'yellow', 'orange', 'white', 'violet', 'red', 'black'];
/** module on the desk, joined through the breadboard (ESP32, Pi): module pin -> a<col>, board pin -> b<col> */
const bb = (id, pairs, lift0 = 16, step = 3) => pairs.flatMap(([mp, net], i) => {
  const c = COL[mp] || COL[net] || COLORS[i % COLORS.length];
  return [fw(id + 'm' + i, id + '.' + mp, 'a' + (10 + i), c, lift0 + 2 * i), ...(net ? [fw(id + 'b' + i, net, 'b' + (10 + i), c, lift0 + 6 + step * i)] : [])];
});

// ---- per-board settings --------------------------------------------------------------------------------
const BOARD = {
  u3: { name: 'Arduino UNO R3', V: 5, lib: false, ds: [S.u3ds, S.atm], gate: 'D8', gnum: 8, gnd: 'GND2', baud: 9600, epdBaud: 115200,
    solView: 'farq', epdView: 'dispq', solPos: { sol: [-40, 128], ps: [45, 128] }, epdPos: [20, 150], hdr: 'pin 8' },
  e32: { name: 'ESP32 DevKit V1', V: 3.3, ds: [S.e32ds], gate: 'G25', gnum: 25, gnd: 'GND2', baud: 115200, epdBaud: 115200,
    solView: 'farq', epdView: 'scanv', solPos: { sol: [165, -26], ps: [125, 12] }, epdPos: [20, 150], hdr: 'GPIO25' },
  uq: { name: 'Arduino UNO Q', V: 3.3, ds: [S.uqds], gate: 'D8', gnum: 8, gnd: 'GND2', baud: 9600, epdBaud: 115200,
    solView: 'farq', epdView: 'dispq', solPos: { sol: [-40, 128], ps: [45, 128] }, epdPos: [20, 150], hdr: 'pin 8' },
  pi: { name: 'Raspberry Pi 4', V: 3.3, ds: [S.pins], gate: 'p11', gnd: 'p6', baud: 9600,
    solView: 'pidesk', epdView: 'pidesk', solPos: { sol: [165, -112], ps: [125, -90] }, epdPos: [125, -45], hdr: 'pin 11' },
};
const code = {}, checks = {}, programs = {};
const def = (key, text, snippets) => { code[key] = text; checks[key] = snippets.map(s => [ln(text, s), s]); };

// ================================================================== listings: solenoid
const solArduino = (B, extra = '') => `const int solenoidPin = ${B.gnum};          // through 220 ohm to the MOSFET gate (10 kohm pulls the gate down)
const unsigned long ON_MS = 500;    // pulse length
const unsigned long OFF_MS = 4500;  // rest: keeps the duty cycle at 10 percent

void setup() {
  pinMode(solenoidPin, OUTPUT);
  digitalWrite(solenoidPin, LOW);
  Serial.begin(${B.baud});
}

void loop() {
  digitalWrite(solenoidPin, HIGH);  // gate high: the coil gets 12 V, the plunger pulls in
  Serial.println("solenoid ON");
  delay(ON_MS);
  digitalWrite(solenoidPin, LOW);   // gate low: the current stops, the diode takes the switch-off spike
  Serial.println("solenoid OFF");
  delay(OFF_MS);
}`;
const solSnips = text => ['solenoidPin =', 'ON_MS =', 'OFF_MS =', 'void setup', 'pinMode(solenoidPin', 'Serial.begin', 'void loop', 'digitalWrite(solenoidPin, HIGH)', 'solenoid ON', 'delay(ON_MS)', '// gate low', 'solenoid OFF', 'delay(OFF_MS)'].filter(s => text.includes(s));
{
  const u3 = solArduino(BOARD.u3), e32 = solArduino(BOARD.e32), uq = solArduino(BOARD.uq);
  def('b_sol_u3', u3, solSnips(u3)); def('b_sol_e32', e32, solSnips(e32)); def('b_sol_uq', uq, solSnips(uq));
}
const solPi = `from gpiozero import OutputDevice
from time import sleep

solenoid = OutputDevice(17)     # GPIO17 (pin 11) -> 220 ohm -> MOSFET gate

ON_S = 0.5                      # pulse length in seconds
OFF_S = 4.5                     # rest: keeps the duty cycle at 10 percent

while True:
    solenoid.on()               # gate high: the coil gets 12 V, the plunger pulls in
    print("solenoid ON")
    sleep(ON_S)
    solenoid.off()              # gate low: the current stops, the diode takes the switch-off spike
    print("solenoid OFF")
    sleep(OFF_S)`;
def('b_sol_pi', solPi, ['OutputDevice(17)', 'ON_S =', 'OFF_S =', 'while True', 'solenoid.on()', 'solenoid ON', 'sleep(ON_S)', 'solenoid.off()', 'solenoid OFF', 'sleep(OFF_S)']);

// programs: an Arduino-style sketch (pins as in the listing) and the Python version
const solProg = (key, pin) => async rt => {
  const c = code[key], n = s => ln(c, s);
  await rt.at(n('solenoidPin =')); await rt.at(n('ON_MS =')); await rt.at(n('OFF_MS ='));
  await rt.at(n('pinMode(solenoidPin')); rt.pinMode(pin, 'OUTPUT');
  await rt.at(n('digitalWrite(solenoidPin, LOW)')); rt.digitalWrite(pin, 0);
  await rt.at(n('Serial.begin')); rt.serialBegin(BOARD[key.slice(6)].baud);
  for (;;) {
    await rt.at(n('void loop'));
    await rt.at(n('digitalWrite(solenoidPin, HIGH)')); rt.digitalWrite(pin, 1);
    await rt.at(n('solenoid ON')); rt.println('solenoid ON');
    await rt.at(n('delay(ON_MS)')); await rt.delay(500);
    await rt.at(n('// gate low')); rt.digitalWrite(pin, 0);
    await rt.at(n('solenoid OFF')); rt.println('solenoid OFF');
    await rt.at(n('delay(OFF_MS)')); await rt.delay(4500);
  }
};
programs.b_sol_u3 = solProg('b_sol_u3', 'D8'); programs.b_sol_uq = solProg('b_sol_uq', 'D8'); programs.b_sol_e32 = solProg('b_sol_e32', 'G25');
programs.b_sol_pi = async rt => {
  const c = code.b_sol_pi, n = s => ln(c, s);
  rt.serialBegin(9600);
  await rt.at(n('from gpiozero')); await rt.at(n('from time')); await rt.at(n('OutputDevice(17)')); rt.pinMode('p11', 'OUTPUT'); rt.digitalWrite('p11', 0);
  await rt.at(n('ON_S =')); await rt.at(n('OFF_S ='));
  for (;;) {
    await rt.at(n('while True'));
    await rt.at(n('solenoid.on()')); rt.digitalWrite('p11', 1);
    await rt.at(n('solenoid ON')); rt.println('solenoid ON');
    await rt.at(n('sleep(ON_S)')); await rt.delay(500);
    await rt.at(n('solenoid.off()')); rt.digitalWrite('p11', 0);
    await rt.at(n('solenoid OFF')); rt.println('solenoid OFF');
    await rt.at(n('sleep(OFF_S)')); await rt.delay(4500);
  }
};

// ================================================================== listings: e-paper
const epdArduino = (B, cs, dc, rst, busy) => `#include <GxEPD2_BW.h>
#include <Fonts/FreeMonoBold12pt7b.h>

// 1.54 inch 200 x 200 panel (SSD1681 class). Pins: CS = ${cs}, DC = ${dc}, RST = ${rst}, BUSY = ${busy}
GxEPD2_BW<GxEPD2_154_D67, GxEPD2_154_D67::HEIGHT> display(GxEPD2_154_D67(${cs}, ${dc}, ${rst}, ${busy}));

const unsigned long WAIT_MS = 180000UL;   // Waveshare manual: at least 180 s between refreshes
const int PARTIALS_MAX = 4;               // example value: a full refresh after 4 partial ones

void drawPage(int n) {
  display.firstPage();
  do {
    display.fillScreen(GxEPD_WHITE);
    display.setCursor(10, 30);
    display.print("E-paper");
    display.drawRect(10, 45, 180, 30, GxEPD_BLACK);
    display.setCursor(14, 120);
    display.print(n);
  } while (display.nextPage());
}

void setup() {
  Serial.begin(${B.epdBaud});
  display.init(${B.epdBaud});
  display.setFont(&FreeMonoBold12pt7b);
  display.setTextColor(GxEPD_BLACK);
  display.setFullWindow();
  drawPage(0);                            // first picture: full refresh, about 2 s
  for (int i = 1; i <= 8; i++) {
    delay(WAIT_MS);
    if (i % (PARTIALS_MAX + 1) == 0) display.setFullWindow();
    else display.setPartialWindow(0, 90, 200, 50);
    drawPage(i);
    Serial.println(i);
  }
  display.hibernate();                    // low power; the picture stays
}

void loop() {}`;
const EPD_SNIP = ['#include <GxEPD2_BW.h>', 'GxEPD2_BW<', 'WAIT_MS =', 'PARTIALS_MAX =', 'void drawPage', 'display.firstPage', 'fillScreen', 'drawRect', 'display.print(n)', 'display.nextPage', 'void setup', 'Serial.begin', 'display.init', 'setFont', 'setTextColor', 'display.setFullWindow();\n', 'drawPage(0)', 'delay(WAIT_MS)', 'if (i %', 'setPartialWindow', 'drawPage(i)', 'Serial.println(i)', 'display.hibernate', 'void loop'];
const epdSnips = text => EPD_SNIP.filter(s => !s.endsWith('\n') && text.includes(s));
{
  const u3 = epdArduino(BOARD.u3, 10, 9, 8, 7), uq = epdArduino(BOARD.uq, 10, 9, 8, 7), e32 = epdArduino(BOARD.e32, 26, 27, 25, 33);
  def('b_epd_u3', u3, epdSnips(u3)); def('b_epd_uq', uq, epdSnips(uq)); def('b_epd_e32', e32, epdSnips(e32));
}
const epdPi = `from waveshare_epd import epd1in54_V2
from PIL import Image, ImageDraw
import time

WAIT = 180            # seconds: the Waveshare manual asks for at least 180 s between refreshes

epd = epd1in54_V2.EPD()
epd.init(False)       # False = full-refresh mode
epd.Clear(0xFF)       # all white

image = Image.new("1", (epd.width, epd.height), 255)   # 1-bit picture, 255 = white
draw = ImageDraw.Draw(image)
draw.text((10, 20), "E-paper on the Pi", fill=0)
draw.rectangle((10, 45, 190, 75), outline=0)
epd.display(epd.getbuffer(image))                      # full refresh, about 2 s

epd.displayPartBaseImage(epd.getbuffer(image))         # base image for the partial updates
epd.init(True)        # True = partial-refresh mode
for n in range(1, 5):
    time.sleep(WAIT)
    draw.rectangle((0, 100, 200, 150), fill=255)       # erase the old number
    draw.text((14, 120), str(n), fill=0)
    epd.displayPart(epd.getbuffer(image))              # partial refresh

epd.init(False)       # back to full-refresh mode
epd.display(epd.getbuffer(image))                      # a full refresh removes the ghosting
epd.sleep()           # low power; the picture stays`;
def('b_epd_pi', epdPi, ['epd1in54_V2', 'ImageDraw', 'WAIT = 180', 'epd1in54_V2.EPD()', 'epd.init(False)       # False', 'epd.Clear(0xFF)', 'Image.new("1"', 'draw.text((10, 20)', 'draw.rectangle((10, 45', 'epd.display(epd.getbuffer(image))                      # full', 'displayPartBaseImage', 'epd.init(True)', 'for n in range', 'time.sleep(WAIT)', 'fill=255', 'str(n)', 'epd.displayPart(epd.getbuffer', 'epd.init(False)       # back', 'a full refresh removes', 'epd.sleep()']);

const SIM_WAIT = 4000;     // the simulator shortens the 180 s wait
const epdProg = (key, pins) => async rt => {
  const c = code[key], n = (s, k) => ln(c, s, k), E = (...a) => rt.dev('bepd', ...a);
  const B = BOARD[key.slice(6)];
  await rt.at(n('GxEPD2_BW<')); await rt.at(n('WAIT_MS =')); await rt.at(n('PARTIALS_MAX ='));
  await rt.at(n('Serial.begin')); rt.serialBegin(B.epdBaud);
  await rt.at(n('display.init')); E('init');
  await rt.at(n('setFont')); await rt.at(n('setTextColor'));
  await rt.at(n('display.setFullWindow();'));
  const page = async (i, full) => {
    await rt.at(n(i === 0 ? 'drawPage(0)' : 'drawPage(i)'));
    await rt.at(n('display.firstPage')); E('clear');
    await rt.at(n('fillScreen'));
    await rt.at(n('setCursor(10, 30)')); await rt.at(n('print("E-paper")')); E('text', 10, 30, 'E-paper', 17);
    await rt.at(n('drawRect')); E('rect', 10, 45, 180, 30, false);
    await rt.at(n('setCursor(14, 120)')); await rt.at(n('display.print(n)')); E('text', 14, 120, String(i), 17);
    await rt.at(n('display.nextPage')); E(full ? 'full' : 'partial', 0, 90, 200, 50);
    await rt.delay(full ? 2000 : 300);
  };
  await page(0, true);
  for (let i = 1; i <= 8; i++) {
    await rt.at(n('for (int i')); await rt.at(n('delay(WAIT_MS)')); await rt.delay(SIM_WAIT);
    const full = i % 5 === 0;
    await rt.at(n('if (i %'));
    if (!full) await rt.at(n('setPartialWindow')); else await rt.at(n('if (i %'));
    await page(i, full);
    await rt.at(n('Serial.println(i)')); rt.println(i);
  }
  await rt.at(n('display.hibernate')); E('sleep');
  await rt.at(n('void loop'));
  for (;;) await rt.delay(1000);
};
programs.b_epd_u3 = epdProg('b_epd_u3'); programs.b_epd_uq = epdProg('b_epd_uq'); programs.b_epd_e32 = epdProg('b_epd_e32');
programs.b_epd_pi = async rt => {
  const c = code.b_epd_pi, n = s => ln(c, s), E = (...a) => rt.dev('bepd', ...a);
  await rt.at(n('from waveshare_epd')); await rt.at(n('from PIL')); await rt.at(n('import time')); await rt.at(n('WAIT = 180'));
  await rt.at(n('epd1in54_V2.EPD()'));
  await rt.at(n('epd.init(False)       # False')); E('init');
  await rt.at(n('epd.Clear(0xFF)')); E('clear'); E('full', 0, 0, 200, 200); await rt.delay(2000);
  await rt.at(n('Image.new("1"')); await rt.at(n('ImageDraw.Draw'));
  await rt.at(n('draw.text((10, 20)')); E('text', 10, 30, 'E-paper on the Pi', 14);
  await rt.at(n('draw.rectangle((10, 45')); E('rect', 10, 45, 180, 30, false);
  await rt.at(n('epd.display(epd.getbuffer(image))                      # full')); E('full', 0, 0, 200, 200); await rt.delay(2000);
  await rt.at(n('displayPartBaseImage'));
  await rt.at(n('epd.init(True)')); E('init');
  for (let i = 1; i <= 4; i++) {
    await rt.at(n('for n in range')); await rt.at(n('time.sleep(WAIT)')); await rt.delay(SIM_WAIT);
    await rt.at(n('fill=255')); E('erase', 0, 100, 200, 50);
    await rt.at(n('str(n)')); E('text', 14, 132, String(i), 14);
    await rt.at(n('epd.displayPart(epd.getbuffer')); E('partial', 0, 0, 200, 200); await rt.delay(300);
  }
  await rt.at(n('epd.init(False)       # back')); E('init');
  await rt.at(n('a full refresh removes')); E('full', 0, 0, 200, 200); await rt.delay(2000);
  await rt.at(n('epd.sleep()')); E('sleep');
  for (;;) await rt.delay(1000);
};

// ================================================================== circuits
function solCircuit(k) {
  const B = BOARD[k], g = B.gate, jwire = k === 'u3' || k === 'uq' ? jw : fw;
  return [
    { id: 'q1', type: 'mosfet', row: 'e', col: 10 }, { id: 'r1', type: 'resistor', a: 'a5', b: 'a10', ohms: 220 }, jwire('w1', g, 'b5', 'yellow', 24),
    { id: 'r2', type: 'resistor', a: 'd10', b: 'd12', ohms: 10000 }, jwire('w2', B.gnd, 'b12', 'black', 18),
    { id: 'dio1', type: 'diode', a: 'b11', k: 'b14' },
    mod('sol1', 'mod_sol12', ...B.solPos.sol), mod('ps1', 'mod_psu12', ...B.solPos.ps),
    fw('f1', 'ps1.POS', 'c14', 'red', 16), fw('f2', 'sol1.W1', 'd14', 'white', 12), fw('f3', 'sol1.W2', 'c11', 'green', 18), fw('f4', 'ps1.NEG', 'c12', 'black', 20),
  ];
}
function epdCircuit(k) {
  const B = BOARD[k], [x, z] = B.epdPos;
  if (k === 'u3') return [mod('ep1', 'mod_epd154', x, z), fw('f1', 'ep1.GND', 'GND2', 'black', 24), fw('f2', 'ep1.VCC', '5V', 'red', 30), fw('f3', 'ep1.DIN', 'D11', 'blue', 36), fw('f4', 'ep1.CLK', 'D13', 'yellow', 42), fw('f5', 'ep1.CS', 'D10', 'orange', 48), fw('f6', 'ep1.DC', 'D9', 'green', 54), fw('f7', 'ep1.RST', 'D8', 'white', 60), fw('f8', 'ep1.BUSY', 'D7', 'violet', 66)];
  if (k === 'uq') return [mod('ep1', 'mod_epd154', x, z), fw('f1', 'ep1.GND', 'GND2', 'black', 24), fw('f2', 'ep1.VCC', '3V3', 'red', 30), fw('f3', 'ep1.DIN', 'D11', 'blue', 36), fw('f4', 'ep1.CLK', 'D13', 'yellow', 42), fw('f5', 'ep1.CS', 'D10', 'orange', 48), fw('f6', 'ep1.DC', 'D9', 'green', 54), fw('f7', 'ep1.RST', 'D8', 'white', 60), fw('f8', 'ep1.BUSY', 'D7', 'violet', 66)];
  if (k === 'e32') return [mod('ep1', 'mod_epd154', x, z), ...bb('ep1', [['VCC', '3V3'], ['GND', 'GND2'], ['DIN', 'G23'], ['CLK', 'G18'], ['CS', 'G26'], ['DC', 'G27'], ['RST', 'G25'], ['BUSY', 'G33']], 16, 3)];
  return [mod('ep1', 'mod_epd154', x, z), ...bb('ep1', [['VCC', 'p1'], ['GND', 'p6'], ['DIN', 'p19'], ['CLK', 'p23'], ['CS', 'p24'], ['DC', 'p22'], ['RST', 'p11'], ['BUSY', 'p18']], 16, 4)];
}
const epdIo = (k, circuit) => {
  const nd = ids(circuit), role = { DIN: 'din', CLK: 'clk', CS: 'cs', DC: 'dc', RST: 'rst', BUSY: 'busy' };
  const pins = { u3: { D11: 'DIN', D13: 'CLK', D10: 'CS', D9: 'DC', D8: 'RST', D7: 'BUSY' }, uq: { D11: 'DIN', D13: 'CLK', D10: 'CS', D9: 'DC', D8: 'RST', D7: 'BUSY' },
    e32: { G23: 'DIN', G18: 'CLK', G26: 'CS', G27: 'DC', G25: 'RST', G33: 'BUSY' }, pi: { p19: 'DIN', p23: 'CLK', p24: 'CS', p22: 'DC', p11: 'RST', p18: 'BUSY' } }[k];
  const map = {}; for (const [p, m] of Object.entries(pins)) map[p] = [role[m], k === 'u3' || k === 'uq' ? m : 'ep1.' + m];
  return mio('bepd', 'ep1', nd, map, [['ep1.VCC', k === 'u3' ? '5V' : '3V3'], ['ep1.GND', 'GND']]);
};

// ================================================================== lessons
const SRC_SOL = k => [S.sol, S.sol2, S.irlz44n, S.d1n4007, ...BOARD[k].ds];
const SRC_EPD = k => [S.wsman, S.gxepd2, ...(k === 'pi' ? [S.wslib] : []), ...BOARD[k].ds];
const CAV_Q = '<p class="warn">UNO Q: this lesson is checked in the simulator. Whether the GxEPD2 library is available and works on the UNO Q board (Zephyr core) is <b>not verified</b>: check the library page before you build it.</p>';
const NOLIB = '<p class="sim">The library calls are written from memory of the library examples and were not run on real hardware.</p>';

function solenoidLesson(k) {
  const B = BOARD[k], circ = solCircuit(k), key = 'b_sol_' + k, pi = k === 'pi', V = B.V, circuitIds = ids(circ);
  const c = code[key], n = s => ln(c, s);
  const gateWarn = V === 5
    ? `<p>The <b>IRLZ44N</b> is a logic-level MOSFET: its datasheet gives the on-resistance at gate voltages of 4 V and 5 V, so a 5 V pin drives it fully.</p>`
    : `<p class="warn">The IRLZ44N datasheet gives its on-resistance at gate voltages of 4 V and 5 V and <b>none at 3.3 V</b>. A solenoid of about 0.3 A is a modest load, but the datasheet does not guarantee a low resistance at 3.3 V: check that the MOSFET stays cool while the coil is on, or choose a MOSFET whose datasheet specifies the on-resistance at 3.3 V or lower.</p>`;
  const gateStep = pi ? `<ul><li>Yellow: <b>pin 11</b> → <b>b5</b> (GPIO17)</li><li>Black: <b>b12</b> → <b>GND</b> (pin 6)</li></ul>` : k === 'e32' ? `<ul><li>Yellow: <b>GPIO25</b> → column 5 (b5)</li><li>Black: <b>GND</b> → column 12 (b12)</li></ul>` : `<ul><li>Yellow: <b>pin 8</b> → <b>b5</b></li><li>Black: <b>b12</b> → <b>GND</b></li></ul>`;
  const loadStep = `<p>The load circuit is separate: the 12 V supply <b>POS</b> goes to column 14 (c14) and the solenoid’s first wire to d14; the solenoid’s other wire goes to the <b>drain</b> column 11 (c11); the supply <b>NEG</b> goes to the <b>source</b> column 12 (c12), which is joined to the board GND.</p>`;
  return {
    module: 40, title: 'Solenoid: a 12 V push-pull coil switched by a MOSFET', level: 'Advanced', time: '30 min', file: pi ? 'solenoid.py' : 'Solenoid.ino',
    goal: `Pull a 12 V push-pull solenoid in for half a second every five seconds with a ${B.name} pin, a MOSFET, a flyback diode and a separate 12 V supply.`,
    hardware: [B.name + (pi ? ' (set up, Lesson 2)' : ''), '12 V push-pull (open-frame) solenoid', '12 V DC supply (barrel jack), with a current rating above the coil current', 'IRLZ44N MOSFET', '220 Ω and 10 kΩ resistors', '1N4007 diode', 'Breadboard and jumper wires'],
    widgets: ['dv:bsol'], circuit: circ, io: mio('bsol', 'sol1', circuitIds, { [B.gate]: ['gate', ''] }),
    explain: pi ? { 1: '<b>OutputDevice</b> is the GPIO Zero class for a simple on/off output.', 4: 'GPIO17 (pin 11) goes to the MOSFET gate through 220 Ω.', 6: 'The pulse is 0.5 s…', 7: '…and the rest is 4.5 s: the coil is on 10 % of the time.', 10: 'High: the MOSFET turns on and 12 V is across the coil. The plunger is pulled in.', 11: 'Print a message.', 13: 'Low: the MOSFET turns off. The coil current wants to continue: the flyback diode gives it a path.' }
      : { 1: `The output pin${k === 'e32' ? ' (GPIO25)' : ' (' + B.hdr + ')'}. It goes to the MOSFET gate through 220 Ω.`, 2: 'The pulse: 0.5 s.', 3: 'The rest: 4.5 s. The coil is on for 10 % of the time, which protects a solenoid that is rated for intermittent duty.', 6: 'The pin is an output.', 7: 'Start with the solenoid off.', 8: 'Serial output on.', 12: 'HIGH: the MOSFET turns on, 12 V is across the coil and the plunger is pulled in.', 13: 'Print a message so you can see the timing.', 14: 'Wait half a second.', 15: 'LOW: the MOSFET turns off. The coil current wants to continue; the flyback diode gives it a path.', 17: 'Rest before the next pulse.' },
    steps: [
      STEP('A coil that pulls', B.solView, [], `<p>A <b>solenoid</b> is a coil of wire around a movable iron plunger. While current flows, its magnetic field pulls the plunger into the coil; a spring pushes it back when the current stops. It makes a push or pull of a few millimetres: door latches, vending machines, pinball bumpers. A <b>solenoid valve</b> is the same coil moving the plug of a valve to let water or air pass.</p><p>This lesson uses a small <b>12 V</b> push-pull solenoid. Typical values for the small one sold by Adafruit (part 412): 12 VDC, about 250 to 300 mA, coil 40 to 48 Ω (the retailer listings disagree: read the sheet of <b>your</b> part), stroke 5.5 mm, intermittent duty.</p><p class="warn">Even 0.3 A is far more than a ${pi ? 'GPIO' : 'microcontroller'} pin can supply (a few tens of mA at most; see the ${pi ? 'Raspberry Pi' : 'board'} datasheet), and the coil needs 12 V. The pin only controls a MOSFET; the current comes from a separate supply.</p>`),
      STEP('The parts', B.solView, ['sol1', 'ps1'], `<p><b>Click the solenoid</b> and <b>the supply module</b> in the 3D view.</p><ul><li>A solenoid has two wires and no polarity of its own: either way round works for the coil itself.</li><li>The supply is a regulated 12 V adapter on a barrel-jack breakout. Its current rating must be above the coil current.</li></ul><p class="sim">The solenoid in the 3D view is drawn with a 5.5 mm stroke and a plunger that pulls into the coil. Real parts differ in size.</p>`),
      STEP('Switch it with a MOSFET', B.solView, circuitIds, `<ul><li>The <b>MOSFET</b> is a switch for the coil. The pin goes to its <b>gate</b> through <b>220 Ω</b>; <b>10 kΩ</b> from the gate to GND keeps it off while the pin floats (for example during start-up).</li><li>The solenoid sits between the 12 V <b>+</b> and the <b>drain</b>; the <b>source</b> goes to GND. A MOSFET switch like this is on the low side of the load.</li><li><b>The flyback diode</b> (1N4007) is across the coil with its <b>band toward the 12 V +</b>. A coil resists a change of current: when the MOSFET switches off, the coil pushes a voltage spike at the drain. The diode gives the current a path and protects the MOSFET.</li><li><b>Common ground:</b> the 12 V supply − and the board GND are joined (column 12). Without it the gate signal has no reference.</li></ul>${gateWarn}<p class="warn">Never connect the 12 V + to a pin of the board.</p>`),
      STEP('Wire it', B.solView, circuitIds, gateStep + loadStep, { pins: [B.gate, B.gnd] }),
      STEP(pi ? 'The program' : 'The code', B.solView, circuitIds, `<p>Click line <b>${n(pi ? 'solenoid.on()' : 'digitalWrite(solenoidPin, HIGH)')}</b> (pull in) and line <b>${n(pi ? 'solenoid.off()' : '// gate low')}</b> (release).</p>`, { showCode: true, power: true }),
      STEP('Run it', B.solView, circuitIds, `<p>Press <b>▶ Run</b>. The plunger pulls in for half a second, then the spring pushes it out for four and a half seconds. The panel shows the share of time the coil is on (the duty cycle).</p><p class="sim">The plunger moves slower in the animation than in a real solenoid. The current of 0.30 A is 12 V ÷ 40 Ω for an example coil; check your part.</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Heat and duty cycle', B.solView, circuitIds, `<ul><li>The coil turns all of its power into heat while it is held on. Many small push-pull solenoids are rated for <b>intermittent duty</b> (the Adafruit 412 is listed as intermittent duty): short pulses with rests. The allowed on-time and duty cycle are on the datasheet of your part.</li><li>So the program pulses for 0.5 s and rests 4.5 s (10 %). Holding a push-pull solenoid on for minutes can burn it.</li><li>A lower voltage gives a weaker and slower pull.</li></ul>${pi ? NOLIB : ''}`, { power: true }),
      STEP('Summary', B.solView, circuitIds, `<ul><li>A solenoid is a coil: switch it with a MOSFET (or transistor) from its own supply, never from a pin.</li><li>Flyback diode across the coil, band toward the + supply.</li><li>Common ground between the supply and the board.</li><li>Respect the duty cycle of the part.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What is the flyback diode for?', a: ['It gives the coil current a path when the MOSFET switches off, so the voltage spike stays small', 'It makes the solenoid pull harder', 'It reduces the supply voltage', 'It protects against a wrong plug'], c: 0, why: 'A coil keeps its current when switched off; the diode carries it.' },
      { q: 'Why not connect the solenoid straight to a board pin?', a: ['The coil needs 12 V and far more current than a pin can give', 'The solenoid has no polarity', 'Pins only work with LEDs', 'It would be too quiet'], c: 0, why: 'The pin only controls the MOSFET.' },
      { q: 'What does 0.5 s on and 4.5 s off mean for the coil?', a: ['A duty cycle of 10 %', 'A duty cycle of 50 %', 'A frequency of 5 Hz', 'A voltage of 5 V'], c: 0, why: '0.5 ÷ 5 = 10 %.' },
      { q: 'Why join the 12 V supply − to the board GND?', a: ['The gate signal needs the same reference as the MOSFET source', 'To charge the supply', 'To make the plunger move', 'It is not necessary'], c: 0, why: 'A common ground.' },
    ],
    sources: SRC_SOL(k),
    code: c, program: key, fast: true,
  };
}

function epdLesson(k) {
  const B = BOARD[k], circ = epdCircuit(k), key = 'b_epd_' + k, pi = k === 'pi', ardu = !pi, circuitIds = ids(circ), c = code[key], n = (s, i) => ln(c, s, i);
  const v = B.V === 5 ? '5V' : '3V3';
  const volt = k === 'u3'
    ? `<p class="warn">The Waveshare manual wires the module VCC to <b>5V</b> on an Arduino UNO, and says driver boards V2.1 and later accept 3.3 V or 5 V. That is the module <b>with</b> its level shifting. A bare panel or another module is a <b>3.3 V</b> part: the GxEPD2 page says not to connect its data lines directly to 5 V pins. Check the page of your own module.</p>`
    : `<p>The module takes <b>3.3 V</b> (Waveshare: 3.3 V or 5 V on driver boards V2.1 and later), which matches the ${B.name} pins. Power it from <b>${v === '3V3' ? '3V3' : v}</b>.</p>`;
  const pinsTxt = { u3: '<li><b>VCC → 5V</b>, <b>GND → GND</b></li><li><b>DIN → pin 11</b> (MOSI), <b>CLK → pin 13</b> (SCK)</li><li><b>CS → pin 10</b>, <b>DC → pin 9</b>, <b>RST → pin 8</b>, <b>BUSY → pin 7</b></li>',
    uq: '<li><b>VCC → 3V3</b>, <b>GND → GND</b></li><li><b>DIN → pin 11</b> (MOSI), <b>CLK → pin 13</b> (SCK)</li><li><b>CS → pin 10</b>, <b>DC → pin 9</b>, <b>RST → pin 8</b>, <b>BUSY → pin 7</b></li>',
    e32: '<li>Module pins go to a10 to a17, board pins to the same columns in row b: <b>VCC</b> to 3V3 (column 10), <b>GND</b> (11), <b>DIN</b> to GPIO23 (12), <b>CLK</b> to GPIO18 (13), <b>CS</b> to GPIO26 (14), <b>DC</b> to GPIO27 (15), <b>RST</b> to GPIO25 (16), <b>BUSY</b> to GPIO33 (17).</li>',
    pi: '<li>Module pins go to a10 to a17, header pins to the same columns in row b: <b>VCC</b> to pin 1 (3V3, column 10), <b>GND</b> to pin 6 (11), <b>DIN</b> to pin 19 (MOSI, 12), <b>CLK</b> to pin 23 (SCLK, 13), <b>CS</b> to pin 24 (CE0, 14), <b>DC</b> to pin 22 (GPIO25, 15), <b>RST</b> to pin 11 (GPIO17, 16), <b>BUSY</b> to pin 18 (GPIO24, 17).</li><li>Enable SPI first (raspi-config, Interface options): Waveshare’s instruction, from memory.</li>' }[k];
  const pinsList = { u3: ['GND2', '5V', 'D11', 'D13', 'D10', 'D9', 'D8', 'D7'], uq: ['GND2', '3V3', 'D11', 'D13', 'D10', 'D9', 'D8', 'D7'], e32: ['3V3', 'GND2', 'G23', 'G18', 'G26', 'G27', 'G25', 'G33'], pi: ['p1', 'p6', 'p19', 'p23', 'p24', 'p22', 'p11', 'p18'] }[k];
  const X = pairs => Object.fromEntries(pairs.map(([sub, html, nth]) => [n(sub, nth), html]));
  const explain = pi ? X([
    ['epd1in54_V2', 'The Waveshare driver for the 1.54 inch panel (200 × 200), from the Waveshare e-Paper repository.'], ['ImageDraw', 'Pillow draws the picture in memory.'], ['WAIT = 180', 'At least 180 s between refreshes (Waveshare manual). The simulator shortens this wait.'],
    ['epd1in54_V2.EPD()', 'Create the driver object.'], ['epd.init(False)       # False', '<code>init(False)</code> starts the panel in full-refresh mode.'], ['epd.Clear(0xFF)', '<code>Clear</code> fills the panel white: it is a full refresh.'],
    ['Image.new("1"', 'A 1-bit picture of 200 × 200 pixels. 255 is white, 0 is black.'], ['draw.text((10, 20)', 'Text in black.'], ['draw.rectangle((10, 45', 'A frame.'],
    ['epd.display(epd.getbuffer(image))                      # full', 'Send the picture and refresh the whole panel. It takes about 2 s and flickers.'], ['displayPartBaseImage', 'Tell the panel which picture is on it now: the partial updates work from this base.'],
    ['epd.init(True)', '<code>init(True)</code> selects the partial-refresh mode.'], ['time.sleep(WAIT)', 'Wait. Refreshing again and again is bad for the panel.'], ['fill=255', 'Erase the old number in the picture.'],
    ['epd.displayPart(epd.getbuffer', 'Partial refresh: faster and without the full flicker.'], ['epd.init(False)       # back', 'Back to the full-refresh mode…'], ['a full refresh removes', '…and a full refresh. It clears the faint ghost of earlier pictures.'], ['epd.sleep()', 'Sleep: the panel uses very little power and keeps the picture.'],
  ]) : X([
    ['#include <GxEPD2_BW.h>', 'GxEPD2 draws on e-paper displays with the Adafruit GFX commands.'], ['GxEPD2_BW<', 'The display object for the 1.54 inch 200 × 200 panel listed in the library as GDEH0154D67 (SSD1681). The arguments are CS, DC, RST and BUSY; the SPI data and clock pins are the default SPI pins of the board.'],
    ['WAIT_MS =', 'At least 180 s between refreshes (Waveshare manual). The simulator shortens this wait.'], ['PARTIALS_MAX =', 'An example choice: a full refresh after 4 partial ones.'], ['display.firstPage', 'Paged drawing: everything between <code>firstPage()</code> and <code>nextPage()</code> is drawn and sent.'],
    ['fillScreen', 'Fill the page white.'], ['drawRect', 'A frame.'], ['display.print(n)', 'Print the counter.'], ['display.nextPage', '<code>nextPage()</code> sends the picture and starts the refresh. The library waits for the BUSY pin to go low again.'],
    ['display.init', 'Start the panel.'], ['setFont', 'Font.'], ['display.setFullWindow();', 'Use the whole panel: the first picture needs a full refresh (about 2 s).'], ['delay(WAIT_MS)', 'Wait: Waveshare asks for at least 180 s between refreshes.'],
    ['if (i %', 'Every fifth picture is a full refresh…'], ['setPartialWindow', '…the others only change a window (partial refresh).'], ['display.hibernate', '<code>hibernate()</code> puts the panel into a low-power state. The picture stays.'],
  ]);
  return {
    module: 41, title: 'E-paper display (1.54 inch, 200 × 200)', level: 'Advanced', time: '40 min', file: pi ? 'epaper_demo.py' : 'EPaperDemo.ino',
    goal: 'Show text on a black and white e-paper panel over SPI, use partial refresh for a counter, do a full refresh to clear the ghosting and put the panel to sleep.',
    hardware: [B.name + (pi ? ' (set up, Lesson 2)' : ''), '1.54 inch 200 × 200 e-paper module (Waveshare or similar, SSD1681 class)', '8 × jumper wires', pi ? 'SPI enabled, Pillow and the Waveshare epd1in54_V2 Python files' : 'GxEPD2 and Adafruit GFX libraries'],
    widgets: ['dv:bepd'], circuit: circ, io: epdIo(k, circ),
    explain,
    steps: [
      STEP('A screen that remembers', B.epdView, [], `<p>An <b>e-paper</b> panel holds tiny charged black and white particles between two electrodes. A voltage moves them, and then they <b>stay where they are</b>: the picture remains with <b>no power</b>. That is why e-paper is used for shelf labels and e-readers.</p><p>The price: a refresh is slow (about <b>2 s</b> for a full refresh of this module, Waveshare manual, typical) and flickers; the panel has only two levels (black, white); and it must be treated with care (see the last steps). Use it for information that changes rarely.</p>`),
      STEP('The module', B.epdView, ['ep1'], `<p><b>Click the module.</b> Its interface is SPI (mode 0) plus: <b>DC</b> (data or command), <b>RST</b> (reset) and <b>BUSY</b> (the panel sets it <b>high</b> while it refreshes; the library waits for it to go low).</p>${volt}`),
      STEP('Wire it', B.epdView, circuitIds, `<ul>${pinsTxt}</ul>`, { pins: pinsList }),
      STEP(pi ? 'The program' : 'The code', B.epdView, circuitIds, pi
        ? `<p>Click lines <b>${n('epd.init(False)       # False')}</b>, <b>${n('epd.display(epd.getbuffer(image))                      # full')}</b> (full refresh) and <b>${n('epd.displayPart(epd.getbuffer')}</b> (partial refresh).</p><p>The Waveshare Python files are not installed with pip in their example: it adds their <code>lib</code> folder to the path. Copy the <code>waveshare_epd</code> folder from the Waveshare e-Paper repository next to your script.</p>${NOLIB}`
        : `<p>Click line <b>${n('display.init')}</b> (start), lines <b>${n('display.setFullWindow();')}</b> and <b>${n('setPartialWindow')}</b> (full or partial window) and line <b>${n('display.nextPage')}</b> (send and refresh).</p>${NOLIB}${k === 'uq' ? CAV_Q : ''}`, { showCode: true, power: true }),
      STEP('Run it', B.epdView, circuitIds, `<p>Press <b>▶ Run</b>. The panel flashes in a full refresh and shows the title and frame. Then the counter changes with partial refreshes; ${pi ? 'after four partial refreshes' : 'every fifth picture is'} a full refresh that removes the faint ghost of the old numbers. At the end the panel sleeps. Stop the program, or unplug the USB cable: <b>the picture stays</b>.</p><p class="sim">The simulator shortens the 180 s waits to a few seconds. The 0.3 s partial refresh and the grey ghosting are only illustrations: real values depend on the panel. The BUSY pin is high while the panel refreshes (full refresh 2 s, Waveshare manual).</p>`, { showCode: true, power: true, action: 'run' }),
      STEP('Care of the panel', B.epdView, circuitIds, `<p>Rules from the Waveshare manual of this module:</p><ul><li>Keep the time between refreshes at least <b>180 s</b>.</li><li>Refresh at least once every <b>24 hours</b>, and clear the panel before storing it unused.</li><li>Do <b>not leave it powered</b> for long: put it to sleep or switch it off. Long operation of the high-voltage drive can damage it.</li><li><b>Partial refresh</b> is not meant to run forever: after several, do a full refresh, otherwise the panel can become abnormal and cannot be repaired. The manual gives no exact number; this lesson uses 4 as a cautious example.</li><li>Data sent in <b>sleep</b> mode is ignored: initialise the panel again first.</li><li>Operating range 0 to 50 °C. The flat cable is fragile.</li></ul>`, { power: true }),
      STEP('Summary', B.epdView, circuitIds, `<ul><li>E-paper keeps its picture without power; power is needed only to change it.</li><li>Full refresh: about 2 s and flicker. Partial refresh: faster, but needs a full refresh now and then.</li><li>BUSY is high while the panel works.</li><li>Sleep the panel, keep ≥ 180 s between refreshes, refresh at least every 24 h.</li></ul>`, { power: true }),
    ],
    quiz: [
      { q: 'What happens to the picture when the power is removed?', a: ['It stays on the panel', 'It disappears at once', 'It turns grey after a second', 'It is erased by BUSY'], c: 0, why: 'The particles stay where the voltage put them.' },
      { q: 'What does a high level on BUSY mean?', a: ['The panel is refreshing: do not send commands', 'The panel is ready', 'The panel is asleep', 'The supply is too high'], c: 0, why: 'The Waveshare driver waits while BUSY reads 1.' },
      { q: 'Why do a full refresh after a few partial refreshes?', a: ['To clear ghosting and avoid damage to the panel', 'To save power', 'To change the colour', 'To reset the board'], c: 0, why: 'The Waveshare manual asks for a full refresh after several partial ones.' },
      { q: 'What should you do with an e-paper panel that you leave on a shelf?', a: ['Put it to sleep or switch it off, and clear it before long storage', 'Keep it powered', 'Refresh it every second', 'Cover it with foil'], c: 0, why: 'Do not leave the high-voltage drive on for long.' },
    ],
    sources: SRC_EPD(k),
    code: c, program: key, fast: true,
  };
}

const lessons = { u3: [], e32: [], uq: [], pi: [] };
for (const k of ['u3', 'e32', 'uq', 'pi']) lessons[k].push(solenoidLesson(k), epdLesson(k));

export default {
  lessons,
  modules: Object.fromEntries(['u3', 'e32', 'uq', 'pi'].map(k => [k, { 40: 'Module 40 — Solenoids and valves', 41: 'Module 41 — E-paper displays' }])),
  programs, code, checks,
};

// Slot c: LoRa (SX1276 / RFM95W module, point to point) and Zigbee (XBee S2C module in transparent mode over a UART).
// 8 lessons: LoRa and Zigbee on the UNO R3, ESP32, UNO Q and Raspberry Pi 4. Module number 50 on every board.
// Facts were checked against the sources listed in each lesson (Semtech SX1276 datasheet rev. 7, arduino-LoRa README/API, Adafruit rfm9x docs,
// TTN frequency and duty-cycle pages, Digi XBee S2C Zigbee datasheet and user guide). Library calls are written from memory where marked
// and were NOT run on real hardware. Simulated devices ('lora', 'xbee') live in c_ui.js (browser only).
const R = (t, u) => ({ t, u });
const S = {
  sx: R('SX1276/77/78/79 datasheet, rev. 7 (Semtech)', 'https://cdn.sparkfun.com/assets/7/7/3/2/2/SX1276_Datasheet.pdf'),
  lora: R('Arduino LoRa library (Sandeep Mistry): README and API', 'https://github.com/sandeepmistry/arduino-LoRa'),
  freq: R('The Things Network: frequency plans by country (a summary, not an official document)', 'https://www.thethingsnetwork.org/docs/lorawan/frequencies-by-country/'),
  duty: R('The Things Network: duty cycle', 'https://www.thethingsnetwork.org/docs/lorawan/duty-cycle/'),
  rfm9x: R('Adafruit CircuitPython RFM9x library: API', 'https://docs.circuitpython.org/projects/rfm9x/en/latest/api.html'),
  rfm9xguide: R('Adafruit: LoRa and LoRaWAN radio for Raspberry Pi, RFM9x setup', 'https://learn.adafruit.com/lora-and-lorawan-radio-for-raspberry-pi/rfm9x-raspberry-pi-setup'),
  xbeeds: R('Digi XBee Zigbee (S2C) datasheet', 'https://www.digi.com/products/xbee-rf-solutions/rf-modules/xbee-zigbee'),
  xbeeug: R('Digi XBee/XBee-PRO S2C Zigbee RF module user guide', 'https://docs.digi.com/resources/documentation/digidocs/90002002/default.htm'),
  softser: R('Arduino SoftwareSerial library', 'https://docs.arduino.cc/learn/built-in-libraries/software-serial/'),
  serial: R('Arduino reference: Serial', 'https://docs.arduino.cc/language-reference/en/functions/communication/serial/'),
  espser: R('Arduino-ESP32 documentation: Serial / UART', 'https://docs.espressif.com/projects/arduino-esp32/en/latest/api/uart.html'),
  pyserial: R('pySerial documentation', 'https://pyserial.readthedocs.io/en/latest/shortintro.html'),
  pins: R('Raspberry Pi documentation: GPIO and the 40-pin header', 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#gpio'),
};

const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const jw = (id, from, to, color = 'black', lift = 12) => ({ id, type: 'wire', from, to, color, lift });
const ids = a => a.map(d => d.id);
const COL = { VCC: 'red', GND: 'black', '3V3': 'red' };
const COLORS = ['blue', 'green', 'yellow', 'orange', 'white', 'violet', 'red', 'black'];
/** module on the desk, wired through the breadboard: module pin -> a<col>, board pin -> b<col> */
const bb = (id, pairs, c0 = 10, l0 = 16, l1 = 22) => pairs.flatMap(([mp, net], i) => {
  const c = COL[mp] || COL[net] || COLORS[i % COLORS.length];
  return [fw(id + 'm' + i, id + '.' + mp, 'a' + (c0 + i), c, l0 + 2 * i), ...(net ? [fw(id + 'b' + i, net, 'b' + (c0 + i), c, l1 + 3 * i)] : [])];
});
const mod = (id, model, x = 30, z = 138) => ({ id, type: 'mod', model, x, z });
const mio = (kind, item, needs, map, pw, extra = {}) => { const o = {}; let first = true; for (const [pin, [role, mp]] of Object.entries(map)) { o[pin] = { kind: 'dev:' + kind, role, item, mp, needs, ...extra }; if (first && pw) { o[pin].pw = pw; first = false; } } return o; };
const STEP = (title, view, have, body, o = {}) => ({ title, view, have, power: false, body, ...o });

// ---- listings (line numbers match the programs below; checked by tools/check_code.mjs) --------------------------------------------
const code = {}, checks = {};
const def = (key, text, list) => { code['c_' + key] = text; checks['c_' + key] = list; };

const ardLora = o => `#include <SPI.h>
#include <LoRa.h>

const long frequency = 868E6;     // 433E6, 868E6 or 915E6: use the band allowed in YOUR country
int counter = 0;

void setup() {
  Serial.begin(${o.baud});
  LoRa.setPins(${o.pins});   // ${o.pinNote}
  if (!LoRa.begin(frequency)) {
    Serial.println("LoRa not found");
    while (1);
  }
  LoRa.setSpreadingFactor(7);     // 6 to 12, default 7: both sides must match
  LoRa.setSignalBandwidth(125E3); // default 125 kHz: both sides must match
  LoRa.setSyncWord(0x12);         // default 0x12: a packet with another word is ignored
}

void loop() {
  LoRa.beginPacket();
  LoRa.print("hello ");
  LoRa.print(counter);
  LoRa.endPacket();               // waits until the packet has been sent
  Serial.print("sent ");
  Serial.println(counter);
  counter++;
  bool heard = false;
  unsigned long start = millis();
  while (millis() - start < 2000) {   // listen for a reply for 2 s
    if (LoRa.parsePacket()) {
      String reply = "";
      while (LoRa.available()) reply += (char)LoRa.read();
      Serial.print("reply: ");
      Serial.print(reply);
      Serial.print("  RSSI ");
      Serial.print(LoRa.packetRssi());
      Serial.print(" dBm  SNR ");
      Serial.println(LoRa.packetSnr());
      heard = true;
    }
  }
  if (!heard) Serial.println("no reply");
}`;
const LORA_CHECKS = [[1, '#include <SPI.h>'], [2, 'LoRa.h'], [4, 'frequency = 868E6'], [5, 'counter'], [7, 'void setup'], [8, 'Serial.begin'], [9, 'LoRa.setPins'], [10, 'LoRa.begin'], [11, 'not found'], [12, 'while (1)'],
  [14, 'setSpreadingFactor(7)'], [15, 'setSignalBandwidth(125E3)'], [16, 'setSyncWord(0x12)'], [19, 'void loop'], [20, 'beginPacket'], [21, '"hello "'], [22, 'LoRa.print(counter)'], [23, 'endPacket'],
  [24, '"sent "'], [25, 'Serial.println(counter)'], [26, 'counter++'], [27, 'heard = false'], [28, 'millis()'], [29, '< 2000'], [30, 'parsePacket'], [31, 'String reply'], [32, 'LoRa.read'],
  [33, '"reply: "'], [36, 'packetRssi'], [38, 'packetSnr'], [39, 'heard = true'], [42, 'no reply']];
def('lora_u3', ardLora({ baud: 9600, pins: '10, -1, 2', pinNote: 'NSS = pin 10, no reset pin, DIO0 (not used here)' }), LORA_CHECKS);
def('lora_e32', ardLora({ baud: 115200, pins: '5, 14, 2', pinNote: 'NSS = GPIO5, RST = GPIO14, DIO0 (not used here)' }), LORA_CHECKS);
def('lora_uq', ardLora({ baud: 9600, pins: '10, 9, 2', pinNote: 'NSS = pin 10, RST = pin 9, DIO0 (not used here)' }), LORA_CHECKS);

def('lora_pi', `import board
import busio
import digitalio
import adafruit_rfm9x
import time
spi = busio.SPI(board.SCK, MOSI=board.MOSI, MISO=board.MISO)   # SPI0: SCLK pin 23, MOSI pin 19, MISO pin 21
cs = digitalio.DigitalInOut(board.CE1)                          # chip select CE1 = pin 26
reset = digitalio.DigitalInOut(board.D25)                       # reset on GPIO25 = pin 22

try:
    rfm9x = adafruit_rfm9x.RFM9x(spi, cs, reset, 915.0)         # frequency in MHz: the band of YOUR module and country
except RuntimeError:
    print("LoRa not found")
    raise
rfm9x.spreading_factor = 7                                      # 6 to 12: both sides must match
rfm9x.signal_bandwidth = 125000                                 # in Hz: both sides must match

counter = 0
while True:
    rfm9x.send(bytes("hello " + str(counter), "utf-8"))         # waits until the packet has been sent
    print("sent", counter)
    counter += 1
    packet = rfm9x.receive(timeout=2.0)                         # listen for a reply for 2 s
    if packet is None:
        print("no reply")
    else:
        print("reply:", str(packet, "utf-8"), "RSSI", rfm9x.last_rssi, "dBm SNR", rfm9x.last_snr, "dB")
    time.sleep(2)                                               # wait before the next packet (do not exceed your duty-cycle limit)`,
[[1, 'import board'], [2, 'busio'], [3, 'digitalio'], [4, 'adafruit_rfm9x'], [5, 'import time'], [6, 'busio.SPI'], [7, 'board.CE1'], [8, 'board.D25'], [10, 'try:'], [11, 'RFM9x(spi, cs, reset, 915.0)'], [12, 'except RuntimeError'], [13, 'not found'], [14, 'raise'],
  [15, 'spreading_factor = 7'], [16, 'signal_bandwidth = 125000'], [18, 'counter = 0'], [19, 'while True'], [20, 'rfm9x.send'], [21, '"sent"'], [22, 'counter += 1'], [23, 'receive(timeout=2.0)'], [24, 'is None'], [25, '"no reply"'], [27, 'last_rssi'], [28, 'time.sleep(2)']]);

const ardXbee = o => `${o.l1}

${o.l3}
int counter = 0;

void setup() {
  Serial.begin(${o.baud});
  ${o.begin}   // XBee factory setting: 9600 baud, 8 data bits, no parity, 1 stop bit
}

void loop() {
  int reading = 20 + counter % 5;  // a made-up reading
  xbee.print("temp=");
  xbee.println(reading);           // goes into DIN: the XBee sends it to the destination DH:DL
  Serial.print("sent reading ");
  Serial.println(reading);
  counter++;
  unsigned long start = millis();
  while (millis() - start < 3000) {
    if (xbee.available()) {
      Serial.write(xbee.read());   // whatever the XBee outputs on DOUT
    }
  }
}`;
const XB_CHECKS = [[3, 'xbee'], [4, 'counter'], [6, 'void setup'], [7, 'Serial.begin'], [8, 'xbee.begin(9600'], [11, 'void loop'], [12, 'reading = 20'], [13, 'xbee.print("temp=")'], [14, 'xbee.println(reading)'], [15, '"sent reading "'], [16, 'Serial.println(reading)'],
  [17, 'counter++'], [18, 'millis()'], [19, '< 3000'], [20, 'xbee.available'], [21, 'xbee.read']];
def('xbee_u3', ardXbee({ l1: '#include <SoftwareSerial.h>', l3: 'SoftwareSerial xbee(10, 11);       // RX = pin 10 (XBee DOUT), TX = pin 11 (XBee DIN)', baud: 9600, begin: 'xbee.begin(9600);' }), [[1, 'SoftwareSerial.h'], ...XB_CHECKS]);
def('xbee_e32', ardXbee({ l1: '// Serial2: hardware UART2 (RX = GPIO16, TX = GPIO17)', l3: '#define xbee Serial2           // RX = GPIO16 (from XBee DOUT), TX = GPIO17 (to XBee DIN)', baud: 115200, begin: 'xbee.begin(9600, SERIAL_8N1, 16, 17);' }), [[1, 'Serial2'], ...XB_CHECKS]);
def('xbee_uq', ardXbee({ l1: '// Serial1: hardware UART on D0 (RX) and D1 (TX)', l3: '#define xbee Serial1           // RX = D0 (from XBee DOUT), TX = D1 (to XBee DIN)', baud: 9600, begin: 'xbee.begin(9600);' }), [[1, 'Serial1'], ...XB_CHECKS]);
def('xbee_pi', `import serial
import time

xbee = serial.Serial("/dev/serial0", baudrate=9600, timeout=0.2)   # UART: GPIO14 TXD (pin 8), GPIO15 RXD (pin 10)
counter = 0

while True:
    reading = 20 + counter % 5                                  # a made-up reading
    xbee.write(("temp=" + str(reading) + "\\n").encode())        # goes into DIN: the XBee sends it to DH:DL
    print("sent reading", reading)
    counter += 1
    end = time.time() + 3
    while time.time() < end:
        line = xbee.readline().decode("ascii", errors="replace").strip()
        if line:
            print("reply:", line)`,
[[1, 'import serial'], [2, 'import time'], [4, 'serial.Serial("/dev/serial0"'], [5, 'counter = 0'], [7, 'while True'], [8, 'reading = 20'], [9, 'xbee.write'], [10, '"sent reading"'], [11, 'counter += 1'], [12, 'time.time() + 3'], [13, 'time.time() < end'], [14, 'readline()'], [15, 'if line'], [16, '"reply:"']]);

// ---- programs --------------------------------------------------------------------------------------------------------------------
const programs = {
  async c_lora_ard(rt) {
    let counter = 0;
    await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(5);
    await rt.at(8); rt.serialBegin(9600);
    await rt.at(9);
    await rt.at(10);
    if (!rt.dev('lora', 'begin', 868e6)) { await rt.at(11); rt.println('LoRa not found'); await rt.at(12); for (;;) await rt.delay(250); }
    await rt.at(14); rt.dev('lora', 'sf', 7);
    await rt.at(15); rt.dev('lora', 'bw', 125e3);
    await rt.at(16); rt.dev('lora', 'sync', 0x12);
    for (;;) {
      await rt.at(19);
      await rt.at(20); await rt.at(21); await rt.at(22);
      await rt.at(23); const air = rt.dev('lora', 'send', 'hello ' + counter, 0); await rt.delay(Math.max(1, air || 1));
      await rt.at(24); rt.print('sent ');
      await rt.at(25); rt.println(counter);
      await rt.at(26); counter++;
      await rt.at(27); let heard = false;
      await rt.at(28); const start = rt.millis();
      while (rt.millis() - start < 2000) {
        await rt.at(29);
        await rt.at(30); const p = rt.dev('lora', 'poll');
        if (p) {
          await rt.at(31); await rt.at(32);
          await rt.at(33); rt.print('reply: ');
          await rt.at(34); rt.print(p.text);
          await rt.at(35); rt.print('  RSSI ');
          await rt.at(36); rt.print(p.rssi);
          await rt.at(37); rt.print(' dBm  SNR ');
          await rt.at(38); rt.println(p.snr);
          await rt.at(39); heard = true;
        }
        await rt.yield();
      }
      await rt.at(42); if (!heard) rt.println('no reply');
    }
  },

  async c_lora_pi(rt) {
    let counter = 0;
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4); await rt.at(5);
    await rt.at(6); await rt.at(7); await rt.at(8);
    await rt.at(10); await rt.at(11);
    if (!rt.dev('lora', 'begin', 915.0)) { await rt.at(12); await rt.at(13); rt.println('LoRa not found'); await rt.at(14); for (;;) await rt.delay(250); }
    await rt.at(15); rt.dev('lora', 'sf', 7);
    await rt.at(16); rt.dev('lora', 'bw', 125000);
    await rt.at(18);
    for (;;) {
      await rt.at(19);
      await rt.at(20); const air = rt.dev('lora', 'send', 'hello ' + counter, 4); await rt.delay(Math.max(1, air || 1));
      await rt.at(21); rt.println('sent ' + counter);
      await rt.at(22); counter++;
      await rt.at(23); const end = rt.millis() + 2000; let p = null;
      while (!p && rt.millis() < end) { p = rt.dev('lora', 'poll'); if (!p) await rt.yield(); }
      await rt.at(24);
      if (!p) { await rt.at(25); rt.println('no reply'); }
      else { await rt.at(27); rt.println('reply: ' + p.text + ' RSSI ' + p.rssi + ' dBm SNR ' + p.snr + ' dB'); }
      await rt.at(28); await rt.delay(2000);
    }
  },

  async c_xbee_ard(rt) {
    let counter = 0;
    await rt.at(1); await rt.at(3); await rt.at(4);
    await rt.at(7); rt.serialBegin(9600);
    await rt.at(8);
    for (;;) {
      await rt.at(11);
      await rt.at(12); const reading = 20 + counter % 5;
      await rt.at(13); rt.dev('xbee', 'write', 'temp=');
      await rt.at(14); rt.dev('xbee', 'write', reading + '\n');
      await rt.at(15); rt.print('sent reading ');
      await rt.at(16); rt.println(reading);
      await rt.at(17); counter++;
      await rt.at(18); const start = rt.millis();
      while (rt.millis() - start < 3000) {
        await rt.at(19);
        await rt.at(20);
        if (rt.dev('xbee', 'avail') > 0) { await rt.at(21); const c = rt.dev('xbee', 'read'); if (c === '\n') rt.println(); else rt.print(c); }
        await rt.yield();
      }
    }
  },

  async c_xbee_pi(rt) {
    let counter = 0;
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(5);
    for (;;) {
      await rt.at(7);
      await rt.at(8); const reading = 20 + counter % 5;
      await rt.at(9); rt.dev('xbee', 'write', 'temp=' + reading + '\n');
      await rt.at(10); rt.println('sent reading ' + reading);
      await rt.at(11); counter++;
      await rt.at(12); const end = rt.millis() + 3000;
      while (rt.millis() < end) {
        await rt.at(13);
        await rt.at(14); let line = '';
        const t1 = rt.millis() + 200;
        while (rt.millis() < t1) { const c = rt.dev('xbee', 'avail') > 0 ? rt.dev('xbee', 'read') : null; if (c === null) { await rt.yield(); continue; } if (c === '\n') break; line += c; }
        await rt.at(15);
        if (line.trim()) { await rt.at(16); rt.println('reply: ' + line.trim()); }
      }
    }
  },
};

// ---- circuits --------------------------------------------------------------------------------------------------------------------
// UNO R3 (5 V logic): the SX1276 inputs are not 5 V parts, so SCK, MOSI and NSS go through 1 kΩ / 2 kΩ dividers (5 V x 2/3 = 3.3 V).
const LORA_U3 = [
  mod('sx1', 'mod_sx1276'),
  { id: 'ra1', type: 'resistor', a: 'c3', b: 'c7', ohms: 1000 }, { id: 'rb1', type: 'resistor', a: 'd7', b: 'd11', ohms: 2000 }, jw('wd1', 'D13', 'a3', 'yellow', 16), jw('wg1', 'b11', 'GND3', 'black', 14),
  { id: 'ra2', type: 'resistor', a: 'c14', b: 'c18', ohms: 1000 }, { id: 'rb2', type: 'resistor', a: 'd18', b: 'd22', ohms: 2000 }, jw('wd2', 'D11', 'a14', 'blue', 18), jw('wg2', 'b22', 'GND1', 'black', 16),
  { id: 'ra3', type: 'resistor', a: 'c24', b: 'c27', ohms: 1000 }, { id: 'rb3', type: 'resistor', a: 'd27', b: 'd30', ohms: 2000 }, jw('wd3', 'D10', 'a24', 'green', 20), jw('wg3', 'b30', 'GND2', 'black', 18),
  fw('f1', 'sx1.SCK', 'a7', 'yellow', 30), fw('f2', 'sx1.MOSI', 'a18', 'blue', 36), fw('f3', 'sx1.NSS', 'a27', 'green', 42), fw('f4', 'sx1.MISO', 'D12', 'violet', 48),
  fw('f5', 'sx1.VCC', '3V3', 'red', 54), fw('f6', 'sx1.GND', 'a11', 'black', 24)];
const LORA_E32 = [mod('sx1', 'mod_sx1276'), ...bb('sx1', [['VCC', '3V3'], ['GND', 'GND2'], ['SCK', 'G18'], ['MISO', 'G19'], ['MOSI', 'G23'], ['NSS', 'G5'], ['RST', 'G14']])];
const LORA_UQ = [mod('sx1', 'mod_sx1276'), fw('f1', 'sx1.VCC', '3V3', 'red', 30), fw('f2', 'sx1.GND', 'GND2', 'black', 24), fw('f3', 'sx1.SCK', 'D13', 'yellow', 36), fw('f4', 'sx1.MISO', 'D12', 'violet', 42),
  fw('f5', 'sx1.MOSI', 'D11', 'blue', 48), fw('f6', 'sx1.NSS', 'D10', 'green', 54), fw('f7', 'sx1.RST', 'D9', 'white', 60)];
const LORA_PI = [mod('sx1', 'mod_sx1276', 125, -45), ...bb('sx1', [['VCC', 'p1'], ['GND', 'p6'], ['SCK', 'p23'], ['MISO', 'p21'], ['MOSI', 'p19'], ['NSS', 'p26'], ['RST', 'p22']], 10, 16, 26)];

const XB_U3 = [mod('xb1', 'mod_xbee'), { id: 'ra', type: 'resistor', a: 'c20', b: 'c24', ohms: 1000 }, { id: 'rb', type: 'resistor', a: 'd24', b: 'd28', ohms: 2000 },
  jw('wa', 'D11', 'a20', 'yellow', 16), jw('wb', 'b28', 'GND3', 'black', 14),
  fw('f1', 'xb1.VCC', '3V3', 'red', 30), fw('f2', 'xb1.GND', 'GND2', 'black', 24), fw('f3', 'xb1.DOUT', 'D10', 'green', 36), fw('f4', 'xb1.DIN', 'a24', 'blue', 42)];
const XB_E32 = [mod('xb1', 'mod_xbee'), ...bb('xb1', [['VCC', '3V3'], ['GND', 'GND2'], ['DOUT', 'G16'], ['DIN', 'G17']])];
const XB_UQ = [mod('xb1', 'mod_xbee'), fw('f1', 'xb1.VCC', '3V3', 'red', 30), fw('f2', 'xb1.GND', 'GND2', 'black', 24), fw('f3', 'xb1.DOUT', 'D0', 'green', 36), fw('f4', 'xb1.DIN', 'D1', 'blue', 42)];
const XB_PI = [mod('xb1', 'mod_xbee', 125, -45), ...bb('xb1', [['VCC', 'p1'], ['GND', 'p6'], ['DOUT', 'p10'], ['DIN', 'p8']], 10, 16, 26)];

// ---- shared lesson text -----------------------------------------------------------------------------------------------------------
const LORA_INTRO = `<p>LoRa is a radio modulation made for <b>long range and low power</b>, and the price is a <b>low data rate</b>: it carries small messages such as a sensor reading, not pictures. The <b>SX1276</b> chip (Semtech datasheet: 137 to 1020 MHz, spreading factors 6 to 12, bandwidths 7.8 to 500 kHz) sits on modules such as the HopeRF <b>RFM95W</b>. Two modules talk point to point when their <b>frequency, spreading factor, bandwidth and sync word</b> all match.</p>
<p class="warn"><b>Rules differ by country and this is not legal advice.</b> The usual bands are 433 MHz, 863 to 870 MHz (“868”) and 902 to 928 MHz (“915”), depending on the region (The Things Network’s summary, which is not an official document). Many regions also limit how long you may transmit, the <b>duty cycle</b>: in the EU 863 to 870 MHz band, for example, the sub-bands are limited to between 0.1 % and 10 % (ETSI EN 300 220-2, as listed by TTN). The Arduino library does <b>not</b> enforce any of this. Buy a module for the band that is allowed where you live, and read your regulator’s rules.</p>`;
const LORA_MODULE = `<p><b>Click the module.</b> The SX1276 chip works from <b>1.8 to 3.7 V</b> (datasheet operating range; absolute maximum 3.9 V) and its pins are <b>3.3 V logic</b>.</p>
<p class="warn"><b>Antenna first.</b> Always connect the antenna before the module transmits: a transmitter with no antenna reflects its power back into the output stage and can damage it (standard RF practice; check your module’s data sheet). Use an antenna made for your band.</p>
<p>Pin names and order differ between breakout boards; the lab shows a typical one. The library README says some boards cannot supply enough current while transmitting and recommends a separate 3.3 V supply rated at least 120 mA when that happens.</p>`;
const LORA_RUN = `<p>Press <b>▶ Run</b>. The sketch sends “hello 0”, “hello 1” … and listens for a reply for 2 s. <b>Node B</b> (simulated) hears it and answers “ack …” with the RSSI and SNR of the received packet and the time on air of your packet.</p>
<ul><li>Change Node B’s <b>spreading factor</b>, <b>bandwidth</b>, <b>frequency</b> or <b>sync word</b>: the sketch prints “no reply”, because a LoRa receiver must know the settings in advance.</li><li>Raise the <b>path loss</b> (a made-up scale for distance and walls) with SF7 on both sides and the packets stop decoding. Then set both sides to a higher spreading factor: they decode again, but the <b>time on air</b> grows.</li></ul>
<p class="warn">Duty cycle: at SF7 and 125 kHz a 7-byte packet is on air for about 31 ms (datasheet formula), so one packet every 2 s is about 1.5 % of the time, already above a 1 % limit. This demo sends often so you can watch it; a real node sends much less often.</p><p class="sim">The path-loss scale, RSSI and SNR are illustrative, not measurements. The decoding limits per spreading factor and the time-on-air formula are from the Semtech datasheet.</p>`;
const LORA_SUM = `<ul><li>SX1276: 1.8 to 3.7 V, 3.3 V logic, SPI plus NSS (and RST).</li><li>Same frequency, spreading factor, bandwidth and sync word on both sides.</li><li>Higher spreading factor: the receiver can work at a lower signal-to-noise ratio (longer range), but the packet takes longer on air.</li><li>Antenna first. Know your country’s band and duty-cycle rules.</li></ul>`;
const LORA_EXPLAIN = { 4: 'The carrier frequency in Hz. The library documents 433E6, 868E6 and 915E6; your module and your country decide which one you may use.', 9: 'setPins(NSS, reset, DIO0). Reset can be -1 (not wired). DIO0 is only needed for the receive callback; this sketch polls instead.', 10: 'Start the radio. Returns 0 if the chip does not answer (check wiring and power).', 14: 'Spreading factor 6 to 12, default 7. A higher value reaches further but takes longer on air.', 15: 'Signal bandwidth in Hz (7.8E3 up to 500E3). A wider band is faster but less sensitive.', 16: 'The sync word (default 0x12). Radios with another sync word ignore the packet.', 20: 'Start a packet.', 21: 'Write the bytes into the packet (up to 255).', 23: 'Send it. This waits until the packet is out.', 30: 'parsePacket() returns the size of a received packet, or 0. It puts the radio in receive mode.', 32: 'Read the bytes one by one.', 36: 'RSSI of the packet in dBm.', 38: 'Signal-to-noise ratio of the packet in dB.' };
const LORA_QUIZ = [
  { q: 'Which supply range does the SX1276 chip have (datasheet)?', a: ['1.8 to 3.7 V', '4.5 to 5.5 V', '9 to 12 V', '24 V only'], c: 0, why: 'Semtech datasheet, operating range. It is a 3.3 V logic part.' },
  { q: 'The sketch sends but Node B never answers. Everything else is equal, only Node B uses another spreading factor. Why?', a: ['The receiver must use the same spreading factor', 'The USB cable is too long', 'delay() is missing', 'The antenna is too short'], c: 0, why: 'Datasheet: the spreading factor must be known in advance on both sides.' },
  { q: 'What does a higher spreading factor give, and what does it cost?', a: ['More sensitivity (range), but a longer time on air', 'More speed, less range', 'More voltage', 'Nothing, it only changes the colour'], c: 0, why: 'Each step lowers the SNR the receiver needs (datasheet Table 13) and makes the symbols longer.' },
  { q: 'What must you do before the module first transmits?', a: ['Connect an antenna made for the band', 'Remove the ground wire', 'Power it from 5 V', 'Cover it with metal foil'], c: 0, why: 'Transmitting without an antenna can damage the output stage.' },
];
const XB_ZIGBEE = `<p><b>Zigbee</b> is a low-power <b>mesh</b> network standard for sensors and switches. It uses the 2.4 GHz band with 16 channels (11 to 26) at 250 kbit/s on the radio (XBee S2C datasheet and user guide). A network has three kinds of node: one <b>coordinator</b> that forms the network, <b>routers</b> that relay messages (they stay powered) and <b>end devices</b> that may sleep. All nodes of one network share a <b>PAN ID</b> and the data can be encrypted with 128-bit AES.</p>
<p>Compared with LoRa, Zigbee is short range per hop but fast enough for small messages, and the mesh extends the range through routers. The Digi XBee datasheet gives indoor/urban range up to 60 m and outdoor line of sight up to 1200 m as estimates that depend on the setup.</p>
<p>The <b>XBee S2C</b> module has a Zigbee firmware that you configure with Digi’s XCTU program. In <b>transparent mode</b> it acts as a wireless serial cable: bytes going into its DIN pin are sent to the destination set by DH and DL, and bytes from other nodes come out of DOUT. By default the destination is 0, which is the coordinator (user guide). This lesson shows the XBee as a <b>router</b> (the default) sending to the coordinator, which is simulated.</p>`;
const XB_MODULE = (volt, extra = '') => `<p><b>Click the module.</b> The XBee S2C needs <b>2.1 to 3.6 V</b> (datasheet), takes about 33 mA while transmitting (45 mA in boost mode) and uses a <b>3.3 V UART</b> (DOUT and DIN). Its factory baud rate is 9600 (parameter BD = 3, 8 data bits, no parity, 1 stop bit; user guide).</p>${volt}<p class="warn">Whether the DIN pin tolerates 5 V is <b>not verified</b> here: treat the module as a 3.3 V device. The module is configured before the lesson with XCTU on a computer: set the PAN ID (ID), the role (CE = 1 makes a coordinator) and the destination (DH, DL). Radio rules (power, antenna) depend on your country; the module has FCC and ETSI approvals with the antennas Digi lists.</p>${extra}`;
const XB_RUN = `<p>Press <b>▶ Run</b>. After a few seconds your XBee <b>joins the network</b> (the time here is made up; a real join takes varying time). Then each reading is sent to the coordinator (Node B, simulated), which answers “got temp=…”. The sketch prints it.</p>
<ul><li>Give Node B a <b>different PAN ID</b> than your module: your module cannot join its network and nothing arrives.</li><li>Switch Node B <b>off</b>: nothing comes back.</li></ul>
<p class="sim">Join time, reply delay and the reading values are made up. The PAN ID, role and destination are normally set with XCTU, not in the sketch.</p>`;
const XB_SUM = `<ul><li>Zigbee: 2.4 GHz mesh, coordinator / routers / end devices, one PAN ID per network.</li><li>XBee S2C: 2.1 to 3.6 V, 3.3 V UART, 9600 baud by default.</li><li>Transparent mode: the XBee is a wireless serial cable; DH and DL choose the destination (0 = the coordinator).</li><li>Settings are made with XCTU; the sketch only sends and reads serial bytes.</li></ul>`;
const XB_EXPLAIN = { 8: 'Open the serial port to the XBee at its factory settings: 9600 baud, 8N1.', 12: 'A made-up temperature that changes a little every time.', 13: 'Bytes written to the port go into the XBee’s DIN pin.', 14: 'The line ends with a newline. In transparent mode the XBee sends these bytes to the destination DH:DL.', 20: 'Bytes the XBee outputs on DOUT, received from other nodes.', 21: 'Print what came back.' };
const XB_QUIZ = [
  { q: 'Which supply range has the XBee S2C (datasheet)?', a: ['2.1 to 3.6 V', '4.5 to 5.5 V', '9 to 12 V', '24 V'], c: 0, why: 'Digi datasheet: supply voltage 2.1 to 3.6 V.' },
  { q: 'In transparent mode, where do the bytes written to the XBee go?', a: ['Over the air to the destination DH:DL', 'Into flash memory only', 'To the USB port', 'Nowhere'], c: 0, why: 'Transparent mode is a serial cable replacement; DH and DL define the destination.' },
  { q: 'Your XBee and the coordinator have different PAN IDs. What happens?', a: ['They are in different networks and do not exchange data', 'They merge their networks', 'The baud rate changes', 'The module resets itself'], c: 0, why: 'Nodes of one network share the PAN ID.' },
  { q: 'Which node forms a Zigbee network?', a: ['The coordinator', 'An end device', 'The antenna', 'The USB cable'], c: 0, why: 'One coordinator starts the network; routers relay, end devices may sleep.' },
];
const CAV = '<p class="warn">UNO Q: this lesson is checked in the simulator. Whether this library is available and works on the UNO Q board (Zephyr core) is <b>not verified</b>: check the library page before you build it.</p>';
const CALLS = '<p class="warn">The library calls in the listing are written from memory and were not run on real hardware: compare them with the library page.</p>';

const lora = (o) => ({
  module: 50, title: o.title || 'LoRa: long-range radio between two boards', level: 'Advanced', time: '35 min', file: o.file, code: code['c_lora_' + o.key], program: o.program, fast: true,
  goal: 'Send a message with an SX1276 (RFM95W) LoRa module, listen for a reply, and see that a receiver only hears you when frequency, spreading factor, bandwidth and sync word match.',
  hardware: o.hardware, widgets: ['dv:lora'], circuit: o.circuit, io: o.io, explain: o.explain || LORA_EXPLAIN,
  steps: [
    STEP('Long range, low rate', o.view, [], LORA_INTRO),
    STEP('The module', o.view, ['sx1'], LORA_MODULE + o.levelText),
    STEP('Wire it', o.view, ids(o.circuit), o.wireText, { pins: o.pins }),
    STEP('The ' + (o.py ? 'program' : 'code'), o.view, ids(o.circuit), o.codeText + CALLS + (o.cav || ''), { showCode: true, power: true }),
    STEP('Run it and change Node B', o.view, ids(o.circuit), LORA_RUN, { showCode: true, power: true, action: 'run' }),
    STEP('Summary', o.view, ids(o.circuit), LORA_SUM, { power: true }),
  ],
  quiz: [...(o.quizPre || []), ...LORA_QUIZ].slice(0, 5),
  sources: o.sources,
});
const xbee = (o) => ({
  module: 50, title: o.title || 'Zigbee: an XBee module as a wireless serial cable', level: 'Advanced', time: '35 min', file: o.file, code: code['c_xbee_' + o.key], program: o.program, fast: true,
  goal: 'Learn how Zigbee networks are built, and send a reading through an XBee S2C module in transparent mode over a UART.',
  hardware: o.hardware, widgets: ['dv:xbee'], circuit: o.circuit, io: o.io, explain: o.explain || XB_EXPLAIN,
  steps: [
    STEP('Zigbee in one page', o.view, [], XB_ZIGBEE),
    STEP('The XBee module', o.view, ['xb1'], XB_MODULE(o.levelText, o.moduleExtra)),
    STEP('Wire it', o.view, ids(o.circuit), o.wireText, { pins: o.pins }),
    STEP('The ' + (o.py ? 'program' : 'code'), o.view, ids(o.circuit), o.codeText + CALLS + (o.cav || ''), { showCode: true, power: true }),
    STEP('Run it and change Node B', o.view, ids(o.circuit), XB_RUN, { showCode: true, power: true, action: 'run' }),
    STEP('Summary', o.view, ids(o.circuit), XB_SUM, { power: true }),
  ],
  quiz: [...(o.quizPre || []), ...XB_QUIZ].slice(0, 5),
  sources: o.sources,
});

// ---- the eight lessons ---------------------------------------------------------------------------------------------------------------
const loraIo = (map, pw, extra) => mio('lora', 'sx1', null, map, pw, extra);
const withNeeds = (io, circuit) => { for (const v of Object.values(io)) v.needs = ids(circuit); return io; };
const PW = [['sx1.VCC', '3V3'], ['sx1.GND', 'GND']];
const XPW = [['xb1.VCC', '3V3'], ['xb1.GND', 'GND']];

const L_U3 = lora({
  key: 'u3', program: 'c_lora_ard', view: 'dispq', file: 'LoRaSender.ino', circuit: LORA_U3,
  hardware: ['Arduino UNO R3', 'SX1276 / RFM95W LoRa breakout for YOUR band (433, 868 or 915 MHz) with its antenna', '3 × 1 kΩ and 3 × 2 kΩ resistors', 'About 10 jumper wires', 'Arduino LoRa library (Sandeep Mistry)'],
  io: withNeeds(loraIo({ D10: ['nss', ''], D13: ['sck', ''], D11: ['mosi', ''], D12: ['miso', 'sx1.MISO'] }, PW), LORA_U3),
  levelText: `<p class="warn"><b>The UNO R3 works at 5 V, the SX1276 at 3.3 V.</b> The library README says an Uno needs a level converter for the SX127x. Here <b>SCK, MOSI and NSS</b> (outputs of the Uno) go through <b>1 kΩ / 2 kΩ dividers</b>: 5 V × 2/3 ≈ 3.3 V. <b>MISO</b> is an output of the module and goes straight to the Uno. Dividers slow fast signals; if the link is unreliable use a proper level shifter, or lower the SPI clock with <code>LoRa.setSPIFrequency()</code> (README). The reset pin is left unwired (the sketch passes -1). The 3V3 pin of the Uno has a small current rating (50 mA, from memory), so the lab’s direct 3V3 wire is a simplification: for real transmission use a separate 3.3 V supply rated for the peak current, with a common GND.</p>`,
  wireText: `<ul><li>Module <b>VCC</b> to the <b>3V3</b> pin, module <b>GND</b> to hole <b>a11</b> (column 11 goes to GND).</li><li>Three dividers: pin <b>13</b> (SCK) to the first, pin <b>11</b> (MOSI) to the second, pin <b>10</b> (NSS) to the third. Each 1 kΩ resistor takes the pin signal, the junction with the 2 kΩ resistor goes to the module, and the 2 kΩ resistor goes to GND.</li><li>Module <b>MISO</b> straight to pin <b>12</b>.</li></ul><p>Module SCK goes to column 7, MOSI to column 18, NSS to column 27.</p>`,
  codeText: '<p>Click lines <b>9</b>, <b>14</b> to <b>16</b> and <b>23</b>. Install “LoRa” by Sandeep Mistry from the Library Manager.</p>',
  pins: ['3V3', 'D13', 'D11', 'D10', 'D12', 'GND1', 'GND2', 'GND3'],
  quizPre: [{ q: 'Why are 1 kΩ / 2 kΩ dividers used on SCK, MOSI and NSS?', a: ['The Uno gives 5 V and the SX1276 is a 3.3 V part', 'To make the radio louder', 'To save pins', 'The library needs them'], c: 0, why: '5 V × 2/3 ≈ 3.3 V. The README asks for a level converter on 5 V boards.' }],
  sources: [S.sx, S.lora, S.freq, S.duty],
});
const L_E32 = lora({
  key: 'e32', program: 'c_lora_ard', view: 'scanv', file: 'LoRaSender.ino', circuit: LORA_E32,
  hardware: ['ESP32 DevKit V1', 'SX1276 / RFM95W LoRa breakout for YOUR band with its antenna', '7 × jumper wires', 'Breadboard', 'Arduino LoRa library (Sandeep Mistry)'],
  io: withNeeds(loraIo({ G18: ['sck', 'sx1.SCK'], G19: ['miso', 'sx1.MISO'], G23: ['mosi', 'sx1.MOSI'], G5: ['nss', 'sx1.NSS'], G14: ['rst', 'sx1.RST'] }, PW), LORA_E32),
  levelText: `<p>The ESP32 pins are 3.3 V, like the SX1276: no level shifter is needed. The module takes its supply from <b>3V3</b>. Transmitting draws current peaks, so check the current rating of your board’s 3.3 V regulator and add a capacitor close to the module if the link is unstable (common advice).</p>`,
  wireText: `<p>Module pins to row a, board pins to row b of the same column: <b>VCC</b> to 3V3 (column 10), <b>GND</b> to GND (11), <b>SCK</b> to GPIO18 (12), <b>MISO</b> to GPIO19 (13), <b>MOSI</b> to GPIO23 (14), <b>NSS</b> to GPIO5 (15), <b>RST</b> to GPIO14 (16). These are the default SPI pins of the ESP32 (VSPI) plus two free pins. DIO0 is not used.</p>`,
  codeText: '<p>Click lines <b>9</b>, <b>14</b> to <b>16</b> and <b>23</b>. Install “LoRa” by Sandeep Mistry. The ESP32 uses its default SPI pins; the library calls are written for the standard Arduino SPI object.</p>',
  pins: ['3V3', 'GND2', 'G18', 'G19', 'G23', 'G5', 'G14'],
  sources: [S.sx, S.lora, S.freq, S.duty],
});
const L_UQ = lora({
  key: 'uq', program: 'c_lora_ard', view: 'dispq', file: 'LoRaSender.ino', circuit: LORA_UQ, cav: CAV,
  hardware: ['Arduino UNO Q', 'SX1276 / RFM95W LoRa breakout for YOUR band with its antenna', '7 × female jumper wires', 'Arduino LoRa library (Sandeep Mistry)'],
  io: withNeeds(loraIo({ D13: ['sck', 'sx1.SCK'], D12: ['miso', 'sx1.MISO'], D11: ['mosi', 'sx1.MOSI'], D10: ['nss', 'sx1.NSS'], D9: ['rst', 'sx1.RST'] }, PW), LORA_UQ),
  levelText: `<p>The UNO Q pins give 3.3 V, the same as the SX1276: they connect directly, no level shifter. Power the module from <b>3V3</b>. Check the current the 3V3 pin of the UNO Q can supply (UNO Q datasheet) against the transmit current of your module.</p>`,
  wireText: `<ul><li><b>VCC → 3V3</b>, <b>GND → GND</b></li><li><b>SCK → pin 13</b>, <b>MISO → pin 12</b>, <b>MOSI → pin 11</b> (the SPI pins of the UNO Q header)</li><li><b>NSS → pin 10</b>, <b>RST → pin 9</b></li></ul>DIO0 is not used.`,
  codeText: '<p>Click lines <b>9</b>, <b>14</b> to <b>16</b> and <b>23</b>. Install “LoRa” by Sandeep Mistry from the Library Manager.</p>',
  pins: ['3V3', 'GND2', 'D13', 'D12', 'D11', 'D10', 'D9'],
  sources: [S.sx, S.lora, S.freq, S.duty],
});
const L_PI = lora({
  key: 'pi', program: 'c_lora_pi', view: 'pidesk', file: 'lora_node.py', py: true, circuit: LORA_PI, title: 'LoRa: long-range radio with the RFM9x library',
  hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'SX1276 / RFM95W LoRa breakout for YOUR band with its antenna', '7 × jumper wires', 'Breadboard', 'SPI enabled and the adafruit-circuitpython-rfm9x library'],
  io: withNeeds(loraIo({ p23: ['sck', 'sx1.SCK'], p21: ['miso', 'sx1.MISO'], p19: ['mosi', 'sx1.MOSI'], p26: ['nss', 'sx1.NSS'], p22: ['rst', 'sx1.RST'] }, [['sx1.VCC', '3V3'], ['sx1.GND', 'GND']], { nosync: true, band: 915 }), LORA_PI),
  explain: { 6: 'The SPI0 bus: SCLK is pin 23, MOSI pin 19, MISO pin 21.', 7: 'Chip select: CE1, pin 26.', 8: 'Reset line: GPIO25, pin 22.', 11: 'Creates the radio at 915.0 MHz. The library page lists the frequencies it documents; use the band of your module and your country.', 12: 'The library raises an error when the chip does not answer.', 15: 'Spreading factor 6 to 12.', 16: 'Bandwidth in Hz.', 20: 'send() takes bytes (up to 252 bytes) and waits until the packet is out.', 23: 'receive() waits up to 2 s and returns the payload bytes or None.', 27: 'last_rssi in dBm and last_snr in dB of the last packet.' },
  levelText: `<p>The Raspberry Pi GPIO is 3.3 V, the same as the SX1276: no level shifter. Power the module from <b>3V3</b> (pin 1). Check how much current the Pi’s 3.3 V pin may supply in the Raspberry Pi documentation and compare it with the transmit current of your module.</p><p class="warn">The Python library adds its own <b>4-byte header</b> (to, from, id, flags) to every packet and tries to be compatible with the <b>RadioHead</b> Arduino library. A node that uses the plain Arduino LoRa library would read those 4 bytes as the start of the message (my inference): for a Pi to Arduino link use RadioHead on the Arduino, or handle the header yourself.</p>`,
  wireText: `<p>Module pins to row a, header pins to row b of the same column: <b>VCC</b> to 3V3 (pin 1, column 10), <b>GND</b> (pin 6, column 11), <b>SCK</b> to pin 23 (12), <b>MISO</b> to pin 21 (13), <b>MOSI</b> to pin 19 (14), <b>NSS</b> (chip select) to pin 26, CE1 (15), <b>RST</b> to pin 22, GPIO25 (16). DIO0 is not used.</p>`,
  codeText: '<p>Click lines <b>6</b>, <b>11</b> and <b>20</b>. Enable SPI with <code>sudo raspi-config</code>. Install with <code>pip3 install adafruit-circuitpython-rfm9x</code> (the Adafruit guide says to use a virtual environment on Raspberry Pi OS Bookworm or newer).</p>',
  pins: ['p1', 'p6', 'p23', 'p21', 'p19', 'p26', 'p22'],
  quizPre: [{ q: 'What does the rfm9x library add to every packet?', a: ['A 4-byte RadioHead-style header', 'A 100-byte password', 'Nothing', 'A second antenna'], c: 0, why: 'Adafruit docs: every packet carries a 4-byte header (to, from, id, flags).' }],
  sources: [S.sx, S.rfm9x, S.rfm9xguide, S.freq, S.duty, S.pins],
});

const X_U3 = xbee({
  key: 'u3', program: 'c_xbee_ard', view: 'dispq', file: 'XBeeSender.ino', circuit: XB_U3,
  hardware: ['Arduino UNO R3', 'XBee S2C Zigbee module on a 3.3 V breakout (set up with XCTU)', '1 kΩ and 2 kΩ resistors', 'About 6 jumper wires'],
  io: withNeeds(mio('xbee', 'xb1', null, { D10: ['rx', 'xb1.DOUT'], D11: ['tx', ''] }, XPW), XB_U3),
  levelText: `<p class="warn"><b>The UNO R3 works at 5 V, the XBee at 3.3 V.</b> The Uno’s TX line (pin 11) goes through a <b>1 kΩ / 2 kΩ divider</b> (5 V × 2/3 ≈ 3.3 V) to DIN. The XBee’s DOUT is a 3.3 V output and goes straight to the Uno’s receive pin 10. The 3V3 pin of the Uno is rated for a small current (50 mA, from memory) while the XBee takes about 33 mA to transmit (45 mA in boost mode): that is close, so many people use an XBee breakout with its own regulator and power it from 5 V.</p>`,
  wireText: `<ul><li>XBee <b>VCC</b> to the <b>3V3</b> pin, <b>GND</b> to GND.</li><li>XBee <b>DOUT</b> straight to pin <b>10</b> (the Uno receives here).</li><li>Pin <b>11</b> (the Uno transmits) to the divider: the 1 kΩ resistor, then the junction (column 24) goes to XBee <b>DIN</b>, and the 2 kΩ resistor goes to GND.</li></ul>`,
  codeText: '<p>Click lines <b>3</b>, <b>8</b> and <b>14</b>. SoftwareSerial is built in; its reference page lists its limits.</p>',
  pins: ['3V3', 'GND2', 'D10', 'D11', 'GND3'],
  quizPre: [{ q: 'Why is there a divider between pin 11 and the XBee DIN?', a: ['The Uno gives 5 V and the XBee is a 3.3 V device', 'To make the XBee faster', 'To switch the XBee off', 'It is not needed'], c: 0, why: '5 V × 2/3 ≈ 3.3 V; 5 V tolerance of DIN is not verified.' }],
  sources: [S.xbeeds, S.xbeeug, S.softser],
});
const X_E32 = xbee({
  key: 'e32', program: 'c_xbee_ard', view: 'scanv', file: 'XBeeSender.ino', circuit: XB_E32,
  hardware: ['ESP32 DevKit V1', 'XBee S2C Zigbee module on a 3.3 V breakout (set up with XCTU)', '4 × jumper wires', 'Breadboard'],
  io: withNeeds(mio('xbee', 'xb1', null, { G16: ['rx', 'xb1.DOUT'], G17: ['tx', 'xb1.DIN'] }, XPW), XB_E32),
  levelText: `<p>The ESP32 UART pins are 3.3 V, like the XBee: they connect directly. Power the XBee from <b>3V3</b>; it takes about 33 mA to transmit (45 mA in boost mode), which the ESP32 board’s regulator should supply (check yours).</p>`,
  wireText: `<p>Module pins to row a, board pins to row b of the same column: <b>VCC</b> to 3V3 (column 10), <b>GND</b> (11), <b>DOUT</b> to GPIO16 (12, the ESP32 receives on Serial2 RX2) and <b>DIN</b> to GPIO17 (13, Serial2 TX2).</p>`,
  codeText: '<p>Click lines <b>3</b>, <b>8</b> and <b>14</b>. <code>Serial2.begin(baud, config, rxPin, txPin)</code> lets you choose the pins of UART2.</p>',
  pins: ['3V3', 'GND2', 'G16', 'G17'],
  sources: [S.xbeeds, S.xbeeug, S.espser],
});
const X_UQ = xbee({
  key: 'uq', program: 'c_xbee_ard', view: 'dispq', file: 'XBeeSender.ino', circuit: XB_UQ, cav: CAV,
  hardware: ['Arduino UNO Q', 'XBee S2C Zigbee module on a 3.3 V breakout (set up with XCTU)', '4 × female jumper wires'],
  io: withNeeds(mio('xbee', 'xb1', null, { D0: ['rx', 'xb1.DOUT'], D1: ['tx', 'xb1.DIN'] }, XPW), XB_UQ),
  levelText: `<p>The UNO Q pins give 3.3 V, like the XBee: they connect directly. Power the XBee from <b>3V3</b>; it takes about 33 mA to transmit (45 mA in boost mode): check the current the UNO Q 3V3 pin supplies (UNO Q datasheet).</p>`,
  wireText: `<ul><li><b>VCC → 3V3</b>, <b>GND → GND</b></li><li>XBee <b>DOUT → pin 0</b> (the board receives here: Serial1 RX)</li><li>XBee <b>DIN → pin 1</b> (Serial1 TX)</li></ul>`,
  codeText: '<p>Click lines <b>3</b>, <b>8</b> and <b>14</b>. Serial1 is the hardware UART on pins 0 and 1 (UNO Q pinout), separate from the USB serial.</p>',
  pins: ['3V3', 'GND2', 'D0', 'D1'],
  sources: [S.xbeeds, S.xbeeug, S.serial],
});
const X_PI = xbee({
  key: 'pi', program: 'c_xbee_pi', view: 'pidesk', file: 'xbee_node.py', py: true, circuit: XB_PI, title: 'Zigbee: an XBee module on the Raspberry Pi serial port',
  hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'XBee S2C Zigbee module on a 3.3 V breakout (set up with XCTU)', '4 × jumper wires', 'Breadboard', 'Serial port hardware enabled, pySerial'],
  io: withNeeds(mio('xbee', 'xb1', null, { p10: ['rx', 'xb1.DOUT'], p8: ['tx', 'xb1.DIN'] }, XPW), XB_PI),
  explain: { 4: 'Opens /dev/serial0, the Pi’s UART on GPIO14 (TXD, pin 8) and GPIO15 (RXD, pin 10), at the XBee’s 9600 baud. timeout=0.2 makes readline() wait at most 0.2 s.', 8: 'A made-up temperature.', 9: 'Bytes written go into the XBee’s DIN pin; in transparent mode they are sent to DH:DL.', 12: 'Listen for 3 s.', 14: 'Read one line the XBee outputs on DOUT.', 16: 'Print the reply.' },
  levelText: `<p>The Raspberry Pi GPIO is 3.3 V, like the XBee: they connect directly. Power the XBee from <b>3V3</b> (pin 1); check in the Raspberry Pi documentation how much current that pin may supply, since the XBee takes about 33 mA to transmit (45 mA in boost mode).</p>`,
  moduleExtra: '<p>Enable the hardware serial port with <code>sudo raspi-config</code> (Interface Options, Serial Port: no login shell on it, serial hardware enabled).</p>',
  wireText: `<p>Module pins to row a, header pins to row b of the same column: <b>VCC</b> to 3V3 (pin 1, column 10), <b>GND</b> (pin 6, column 11), <b>DOUT</b> to pin 10 (GPIO15, the Pi receives, column 12) and <b>DIN</b> to pin 8 (GPIO14, the Pi transmits, column 13).</p>`,
  codeText: '<p>Click lines <b>4</b>, <b>9</b> and <b>14</b>. Install with <code>pip3 install pyserial</code> (it is often already there).</p>',
  pins: ['p1', 'p6', 'p10', 'p8'],
  sources: [S.xbeeds, S.xbeeug, S.pyserial, S.pins],
});

export default {
  lessons: { u3: [L_U3, X_U3], e32: [L_E32, X_E32], uq: [L_UQ, X_UQ], pi: [L_PI, X_PI] },
  modules: {
    u3: { 50: 'Module 50 — LoRa and Zigbee radios' }, e32: { 50: 'Module 50 — LoRa and Zigbee radios' },
    uq: { 50: 'Module 50 — LoRa and Zigbee radios' }, pi: { 50: 'Module 50 — LoRa and Zigbee radios' },
  },
  programs, code, checks,
};

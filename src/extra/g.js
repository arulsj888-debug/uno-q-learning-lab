// Slot g: two Raspberry Pi lessons (modules 90 and 91).
//   1. nRF24L01+ radio on the Pi (pyRF24), SPI0 + CE on GPIO22.
//   2. Analog on the Pi: an RC capacitor circuit measured through an ADS1115 (I2C, 16 bit) with the Adafruit CircuitPython ADS1x15 library.
// Facts: pyRF24 documentation (nrf24.github.io/pyRF24: constructor RF24(ce_pin, csn_pin), begin(), channel, set_pa_level, stop_listening(address), write(buf),
// CSN_PIN = 0 means /dev/spidev0.0, examples use CE = GPIO22); Adafruit CircuitPython ADS1x15 docs (ADS1115(i2c, gain=1, ... address=72), AnalogIn(ads, pin).voltage,
// gains 2/3, 1, 2, 4, 8, 16); TI ADS1115 datasheet (ADDR pin GND/VDD/SDA/SCL = 0x48/0x49/0x4A/0x4B, +-6.144 ... +-0.256 V, inputs limited to GND-0.3 V ... VDD+0.3 V);
// Adafruit guide (supply 2 to 5 V, 8 to 860 SPS, 10k pull-ups on SDA/SCL to the supply). Python calls were NOT run on a real Pi.
// The simulated ADS1115 device 'ads' and the 3D module model 'mod_ads1115' are in g_ui.js (browser only). No DOM or three imports here.

const R = (t, u) => ({ t, u });
const S = {
  nrf: R('nRF24L01+ product specification (Nordic Semiconductor)', 'https://www.sparkfun.com/datasheets/Components/SMD/nRF24L01Pluss_Preliminary_Product_Specification_v1_0.pdf'),
  pyrf24: R('pyRF24 documentation', 'https://nrf24.github.io/pyRF24/'),
  pyrf24api: R('pyRF24 API reference (RF24 class)', 'https://nrf24.github.io/pyRF24/rf24_api.html'),
  pyrf24ex: R('pyRF24 examples (getting started)', 'https://nrf24.github.io/pyRF24/examples.html'),
  pins: R('Raspberry Pi documentation: GPIO and the 40-pin header', 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#gpio'),
  ads: R('ADS1115 datasheet (Texas Instruments)', 'https://www.ti.com/lit/ds/symlink/ads1115.pdf'),
  adsguide: R('Adafruit 4-channel ADC breakouts (ADS1115 / ADS1015) guide', 'https://learn.adafruit.com/adafruit-4-channel-adc-breakouts/overview'),
  adslib: R('Adafruit CircuitPython ADS1x15 documentation', 'https://docs.circuitpython.org/projects/ads1x15/en/latest/api.html'),
  adsex: R('Adafruit CircuitPython ADS1x15: simple test example', 'https://github.com/adafruit/Adafruit_CircuitPython_ADS1x15/blob/main/examples/ads1x15_simpletest.py'),
  gz: R('GPIO Zero documentation: Output devices', 'https://gpiozero.readthedocs.io/en/stable/api_output.html'),
  rcsrc: R('All About Circuits: RC and L/R time constants (DC textbook, chapter 16)', 'https://www.allaboutcircuits.com/textbook/direct-current/chpt-16/voltage-current-calculations-rc-circuits/'),
};

const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const jw = (id, from, to, color = 'black', lift = 12) => ({ id, type: 'wire', from, to, color, lift });
const ids = a => a.map(d => d.id);
const COL = { VCC: 'red', GND: 'black', '3V3': 'red', VDD: 'red' };
const COLORS = ['blue', 'green', 'yellow', 'orange', 'white', 'violet', 'red', 'black'];
const bb = (id, pairs, c0 = 10) => pairs.flatMap(([mp, net], i) => {
  const c = COL[mp] || COL[net] || COLORS[i % COLORS.length];
  return [fw(id + 'm' + i, id + '.' + mp, 'a' + (c0 + i), c, 16 + 2 * i), ...(net ? [fw(id + 'b' + i, net, 'b' + (c0 + i), c, 26 + 4 * i)] : [])];
});
const mod = (id, model, x = 125, z = -45) => ({ id, type: 'mod', model, x, z });
const mio = (kind, item, needs, map, pw) => { const o = {}; let first = true; for (const [pin, [role, mp, it, extra]] of Object.entries(map)) { o[pin] = { kind: 'dev:' + kind, role, item: it || item, mp, needs, ...(extra || {}) }; if (first && pw) { o[pin].pw = pw; first = false; } } return o; };
const STEP = (title, view, have, body, o = {}) => ({ title, view, have, power: false, body, ...o });

// ---- listings with //@tag markers: the tags give the line numbers used by the programs, the explanations and the checks ---------------
function listing(src) {
  const lines = [], tags = {};
  src.split('\n').forEach((ln, i) => {
    const m = /\s*\/\/@(\w+)\s*$/.exec(ln);
    if (m) { tags[m[1]] = i + 1; ln = ln.slice(0, m.index); }
    lines.push(ln.replace(/\s+$/, ''));
  });
  const checks = Object.values(tags).sort((a, b) => a - b).map(n => [n, lines[n - 1].trim().slice(0, 22)]);
  return { code: lines.join('\n'), tags, checks };
}
const code = {}, checks = {}, programs = {}, TAGS = {};
function reg(key, src) { const l = listing(src); code[key] = l.code; checks[key] = l.checks; TAGS[key] = l.tags; return l; }
const byTag = (tags, o) => { const r = {}; for (const [k, v] of Object.entries(o)) { if (!(k in tags)) throw new Error('unknown tag ' + k); r[tags[k]] = v; } return r; };

// =================================================================================================================================
// 1. nRF24L01+ on the Pi
// =================================================================================================================================
const NRF_L = reg('g_nrf_pi', `import time //@imp1
from pyrf24 import RF24, RF24_PA_LOW //@imp2

CE_PIN = 22                  # GPIO22 = pin 15 //@ce
CSN_PIN = 0                  # SPI0, device 0 = /dev/spidev0.0 = CE0 = pin 24 //@csn
address = b"00001"           # the 5-byte pipe address //@addr

radio = RF24(CE_PIN, CSN_PIN) //@radio
if not radio.begin(): //@begin
    raise OSError("nRF24L01 hardware isn't responding") //@raise
radio.channel = 76           # 2400 MHz + 76 = 2476 MHz //@chan
radio.set_pa_level(RF24_PA_LOW) //@pa
radio.stop_listening(address)   # this board only sends, to this address //@tx

counter = 0 //@cnt
while True: //@loop
    text = f"hello {counter}" //@text
    ok = radio.write(text.encode()) //@write
    print(text, "delivered" if ok else "no answer") //@pr
    counter += 1 //@inc
    time.sleep(1) //@sl`);

programs.g_nrf_pi = async (rt) => {
  const T = TAGS.g_nrf_pi, at = async (...n) => { for (const i of n) await rt.at(T[i]); };
  let counter = 0, ch = 76, addr = '00001';
  rt.serialBegin(9600);
  await at('imp1', 'imp2', 'ce', 'csn', 'addr', 'radio');
  rt.pinMode('p15', 'OUTPUT');
  await at('begin');
  if (!rt.dev('nrf', 'begin')) { await at('raise'); rt.println("OSError: nRF24L01 hardware isn't responding"); return; }
  await at('chan'); ch = 76;
  await at('pa');
  await at('tx'); rt.dev('nrf', 'config', ch, addr);
  await at('cnt');
  for (;;) {
    await at('loop');
    await at('text'); const text = 'hello ' + counter;
    await at('write'); const ok = rt.dev('nrf', 'write', text);
    await at('pr'); rt.println(text + ' ' + (ok ? 'delivered' : 'no answer'));
    await at('inc'); counter++;
    await at('sl'); await rt.delay(1000);
  }
};

const NRF = [mod('nr1', 'mod_nrf24'), ...bb('nr1', [['VCC', 'p1'], ['GND', 'p6'], ['CE', 'p15'], ['CSN', 'p24'], ['SCK', 'p23'], ['MOSI', 'p19'], ['MISO', 'p21']])];

const nrfLesson = {
  module: 90, level: 'Advanced', time: '30 min', file: 'radio_sender.py', fast: true,
  title: 'nRF24L01+ radio on the Raspberry Pi (pyRF24)',
  goal: 'Send messages with an nRF24L01+ module over the Pi’s SPI0 bus using the pyRF24 library, and see that a receiver only hears them when the channel and the address match.',
  hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'nRF24L01+ module (and a second one for a receiver)', '7 × female–female jumper wires', 'SPI enabled (raspi-config) and the pyrf24 Python package', 'Optional: 10 µF capacitor across VCC and GND of the module'],
  code: NRF_L.code, program: 'g_nrf_pi', widgets: ['dv:nrf'], circuit: NRF,
  io: mio('nrf', 'nr1', ids(NRF), { p15: ['ce', 'nr1.CE'], p24: ['csn', 'nr1.CSN'], p19: ['mosi', 'nr1.MOSI'], p21: ['miso', 'nr1.MISO'], p23: ['sck', 'nr1.SCK'] }, [['nr1.VCC', '3V3'], ['nr1.GND', 'GND']]),
  explain: byTag(NRF_L.tags, {
    imp2: 'The <b>pyrf24</b> package: the RF24 class (the TMRh20 radio library, wrapped for Python) and a constant for the transmit power.',
    ce: 'CE (chip enable) is an ordinary GPIO pin chosen by you. The pyRF24 examples use GPIO22, which is header pin 15.',
    csn: 'The chip-select number is the SPI bus and device: 0 means <code>/dev/spidev0.0</code>, the Pi’s CE0 line (GPIO8, pin 24). The pyRF24 documentation gives the rule bus × 10 + device.',
    addr: 'The 5-byte address of the pipe. The sender and the receiver must use the same one.',
    radio: 'Create the radio object with the two pin numbers.',
    begin: '<code>begin()</code> returns False if the chip does not answer: wrong wiring, SPI not enabled or no 3.3 V.',
    chan: 'The channel from 0 to 125: the frequency is 2400 MHz + the channel number. Both sides must use the same channel.',
    pa: 'Transmit power level. LOW is plenty on a desk.',
    tx: 'Stop listening: the radio becomes a transmitter that sends to this address.',
    write: '<code>write()</code> sends one packet and returns True if the receiver acknowledged it (auto-acknowledge).',
    pr: 'Print the result in the Shell.',
  }),
  steps: [
    STEP('A small radio on the SPI bus', 'pidesk', [], `<p>The nRF24L01+ is a 2.4 GHz radio chip for short messages between modules of the same kind. It is <b>not</b> WiFi and not Bluetooth. Data rates are 250 kbit/s, 1 Mbit/s and 2 Mbit/s; the channel number (0 to 125) sets the frequency to 2400 MHz + channel.</p><p>With the auto-acknowledge feature the receiver answers each packet, so <code>write()</code> tells you whether it arrived.</p><p class="warn">Enable SPI first: <code>sudo raspi-config</code> → Interface Options → SPI. Install the library with <code>python3 -m pip install pyrf24</code> (the pyRF24 page lists prebuilt packages for 64-bit and 32-bit Raspberry Pi OS; on other systems pip builds it and needs <code>python3-dev</code> and <code>cmake</code>).</p>`),
    STEP('The module and its supply', 'pidesk', ['nr1'], `<p><b>Click the module.</b> It has a 2×4 header: GND, CE, SCK, MISO on one row and VCC, CSN, MOSI, IRQ on the other.</p><p class="warn">The supply is <b>1.9 to 3.6 V</b> (Nordic): use a <b>3V3</b> pin of the Pi (pin 1 here), <b>never the 5 V pins</b>. The Pi’s GPIO is 3.3 V, so the signals connect directly. A <b>10 µF capacitor</b> between VCC and GND close to the module is common advice when the link is unreliable (the supply of the Pi is noisy when the radio transmits); it is advice, not a datasheet requirement. The module’s current draw is a few tens of milliamps at most (see the Nordic specification for exact figures).</p>`),
    STEP('Wire it', 'pidesk', ids(NRF), `<p>Module pins to a10 to a16, header pins to the same columns in row b:</p><ul><li><b>VCC</b> → 3V3 (pin 1), <b>GND</b> → pin 6</li><li><b>CE</b> → <b>pin 15 (GPIO22)</b>, <b>CSN</b> → <b>pin 24 (CE0)</b></li><li><b>SCK</b> → <b>pin 23</b>, <b>MOSI</b> → <b>pin 19</b>, <b>MISO</b> → <b>pin 21</b> (SPI0)</li></ul><p>The <b>IRQ</b> pin stays unconnected.</p>`, { pins: ['p1', 'p6', 'p15', 'p24', 'p23', 'p19', 'p21'] }),
    STEP('The program', 'pidesk', ids(NRF), `<p>Click lines <b>${NRF_L.tags.csn}</b>, <b>${NRF_L.tags.chan}</b> and <b>${NRF_L.tags.write}</b>.</p><p class="sim">The pyRF24 calls are taken from its documentation pages (constructor, <code>begin()</code>, <code>channel</code>, <code>set_pa_level()</code>, <code>stop_listening(address)</code>, <code>write()</code>); the import line and the <code>RF24_PA_LOW</code> name are from the library’s examples as I remember them. The program has <b>not</b> been run on a real Pi.</p>`, { showCode: true, power: true }),
    STEP('Run it and change the receiver', 'pidesk', ids(NRF), `<p>Press <b>▶ Run</b>. The simulated receiver (Node B) gets “hello 0”, “hello 1” … and the program prints “delivered”. Now change the receiver’s <b>channel</b> or <b>address</b>, or switch it off: the program prints “no answer”.</p>`, { showCode: true, power: true, action: 'run' }),
    STEP('Summary', 'pidesk', ids(NRF), `<ul><li>nRF24L01+: SPI0 (SCLK pin 23, MOSI pin 19, MISO pin 21, CE0 pin 24) plus a CE pin (GPIO22, pin 15); 1.9 to 3.6 V supply.</li><li>Same channel, data rate and address on both sides.</li><li><code>write()</code> returns True when the packet was acknowledged.</li></ul>`, { power: true }),
  ],
  quiz: [
    { q: 'Which Pi pin may power the nRF24L01+?', a: ['A 3V3 pin (for example pin 1)', 'A 5V pin', 'Any GPIO pin', 'None, it has a battery'], c: 0, why: 'Nordic: 1.9 to 3.6 V supply.' },
    { q: 'Channel 76 is at which frequency?', a: ['2476 MHz', '76 MHz', '2.4 MHz', '7.6 GHz'], c: 0, why: '2400 MHz + 76.' },
    { q: 'In RF24(22, 0), what does the 0 select?', a: ['/dev/spidev0.0 (the CE0 chip select, pin 24)', 'GPIO0', 'Channel 0', 'The power level'], c: 0, why: 'The pyRF24 documentation: the CSN number is the SPI bus and device (bus × 10 + device).' },
    { q: 'write() returns False. What can be the reason?', a: ['The receiver is off or uses another channel or address', 'The Python file has a comment', 'The Pi has a red LED', 'The program is too short'], c: 0, why: 'No acknowledge came back.' },
  ],
  sources: [S.nrf, S.pyrf24, S.pyrf24api, S.pyrf24ex, S.pins],
};

// =================================================================================================================================
// 2. RC circuit measured through an ADS1115
// =================================================================================================================================
const ADS_L = reg('g_ads_rc_pi', `import time //@imp1
import board //@imp2
from adafruit_ads1x15 import ADS1115, AnalogIn, ads1x15 //@imp3
from gpiozero import OutputDevice //@imp4

drive = OutputDevice(17)     # GPIO17 (pin 11) -> 10 kOhm -> capacitor //@drive
i2c = board.I2C()            # SDA = GPIO2 (pin 3), SCL = GPIO3 (pin 5) //@i2c
ads = ADS1115(i2c)           # ADDR on GND: address 0x48 //@ads
ads.gain = 1                 # full scale +-4.096 V //@gain
chan = AnalogIn(ads, ads1x15.Pin.A0)   # input A0, measured against GND //@chan

while True: //@loop
    drive.on()               # 3.3 V: the capacitor charges //@on
    for i in range(6): //@for1
        print(f"{chan.voltage:.2f} V") //@pr1
        time.sleep(0.5) //@sl1
    drive.off()              # 0 V: the capacitor discharges //@off
    for i in range(6): //@for2
        print(f"{chan.voltage:.2f} V") //@pr2
        time.sleep(0.5) //@sl2`);

programs.g_ads_rc_pi = async (rt) => {
  const T = TAGS.g_ads_rc_pi, at = async (...n) => { for (const i of n) await rt.at(T[i]); };
  rt.serialBegin(9600);
  const volts = () => rt.dev('ads', 'read', 0).volts;
  await at('imp1', 'imp2', 'imp3', 'imp4');
  await at('drive'); rt.pinMode('p11', 'OUTPUT');
  await at('i2c');
  await at('ads');
  const addr = rt.dev('ads', 'begin');
  if (!addr) { rt.println('ValueError: No I2C device at address: 0x48'); return; }
  await at('gain'); rt.dev('ads', 'gain', 1);
  await at('chan');
  for (;;) {
    await at('loop');
    await at('on'); rt.digitalWrite('p11', 1);
    for (let i = 0; i < 6; i++) { await at('for1'); await at('pr1'); rt.println(volts().toFixed(2) + ' V'); await at('sl1'); await rt.delay(500); }
    await at('off'); rt.digitalWrite('p11', 0);
    for (let i = 0; i < 6; i++) { await at('for2'); await at('pr2'); rt.println(volts().toFixed(2) + ' V'); await at('sl2'); await rt.delay(500); }
  }
};

// module pins land in a10..a15 (VDD, GND, SCL, SDA, ADDR, A0); the RC parts sit in columns 15 to 20
const ADS = [mod('ad1', 'mod_ads1115', 60, -88), ...bb('ad1', [['VDD', 'p1'], ['GND', 'p6'], ['SCL', 'p5'], ['SDA', 'p3'], ['ADDR', 'p9'], ['A0', null]]),
  { id: 'r1', type: 'resistor', a: 'c15', b: 'c20', ohms: 10000 }, { id: 'c1', type: 'cap', uf: 100, a: 'd15', k: 'd17' },
  fw('wd', 'p11', 'a20', 'orange', 30), fw('wg', 'p14', 'a17', 'black', 36)];

const adsLesson = {
  module: 91, level: 'Advanced', time: '35 min', file: 'rc_adc.py', fast: true,
  title: 'Analog on the Pi: measure a capacitor with an ADS1115',
  goal: 'The Pi has no analog inputs. Add an ADS1115 (a 16-bit ADC on the I²C bus), charge a 100 µF capacitor through 10 kΩ from a GPIO pin and read its voltage curve.',
  hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'ADS1115 breakout board', '10 kΩ resistor', '100 µF electrolytic capacitor (16 V or more)', 'Breadboard and 8 jumper wires', 'I²C enabled and adafruit-circuitpython-ads1x15'],
  code: ADS_L.code, program: 'g_ads_rc_pi', widgets: ['dv:ads'], circuit: ADS,
  io: mio('ads', 'ad1', ids(ADS), { p3: ['sda', 'ad1.SDA'], p5: ['scl', 'ad1.SCL'], p11: ['drive', 'r1.2', 'c1', { r: 10000, c: 100e-6 }] }, [['ad1.VDD', '3V3'], ['ad1.GND', 'GND'], ['ad1.ADDR', 'GND']]),
  explain: byTag(ADS_L.tags, {
    imp3: 'The ADS1115 driver, the <b>AnalogIn</b> helper and the pin names (<code>ads1x15.Pin.A0</code> … <code>A3</code>).',
    drive: 'An ordinary digital output. HIGH is 3.3 V, LOW is 0 V. It charges and discharges the capacitor through the resistor.',
    i2c: 'The Pi’s I²C bus 1: SDA = GPIO2 (pin 3), SCL = GPIO3 (pin 5).',
    ads: 'Open the converter at its default address <b>0x48</b> (the ADDR pin is wired to GND).',
    gain: 'The gain sets the full-scale range. Gain 1 = ±4.096 V, which covers 0 to 3.3 V. One count is then 4.096 V ÷ 32768 = 125 µV.',
    chan: 'Input A0 of the ADS1115, measured against GND (single-ended).',
    on: 'HIGH: the pin is at 3.3 V and the capacitor charges through 10 kΩ.',
    pr1: '<code>chan.voltage</code> reads the converter and returns the voltage in volts.',
    off: 'LOW: the pin is at 0 V and the capacitor discharges through the same resistor.',
  }),
  steps: [
    STEP('The Pi cannot read an analog voltage', 'pidesk', [], `<p>The Raspberry Pi’s GPIO pins are <b>digital only</b>: each reads “high” or “low”, nothing in between. To measure a voltage that changes slowly, like a charging capacitor, you add an <b>analog-to-digital converter</b> (ADC) chip. The <b>ADS1115</b> is a 16-bit ADC with four inputs that talks to the Pi over <b>I²C</b>.</p><p class="formula">τ = R × C = 10 000 Ω × 0.0001 F = 1 s</p><p>After one τ a charging capacitor has reached about 63 % of the final voltage (the standard RC result). Here the final voltage is the 3.3 V of the Pi pin, so about <b>2.1 V</b> after 1 s.</p><p class="warn">Enable I²C first: <code>sudo raspi-config</code> → Interface Options → I2C. Install the library with <code>pip3 install adafruit-circuitpython-ads1x15</code> (package name from memory of the library page).</p>`),
    STEP('The ADS1115 module', 'pidesk', ['ad1'], `<p><b>Click the module.</b> Pins: <b>VDD</b> (supply), <b>GND</b>, <b>SCL</b>, <b>SDA</b>, <b>ADDR</b>, <b>ALRT</b> and the four inputs <b>A0 to A3</b>. (Adafruit’s board calls the supply pin VIN; other makers’ boards differ: read your silkscreen.)</p><ul><li>Supply <b>2.0 to 5.5 V</b> (TI datasheet; Adafruit’s guide says 2 to 5 V for its board). Power it from <b>3V3</b>: then SDA and SCL swing between 0 and 3.3 V, which is safe for the Pi (Adafruit’s board has 10 kΩ pull-ups from SDA and SCL to its supply).</li><li>The <b>ADDR</b> pin picks the address: <b>GND → 0x48</b>, VDD → 0x49, SDA → 0x4A, SCL → 0x4B (TI datasheet). The library’s default is 0x48.</li><li>Inputs must stay between <b>GND − 0.3 V and VDD + 0.3 V</b> (datasheet absolute maximum), whatever the gain setting.</li></ul>`),
    STEP('The capacitor circuit', 'pidesk', ['r1', 'c1'], `<p>Resistor <b>c15 to c20</b>. The capacitor: the <b>long leg (+)</b> in <b>d15</b>, the leg next to the <b>stripe with the “−” signs</b> in <b>d17</b>. <b>Click the capacitor.</b></p><p class="warn">An electrolytic capacitor is <b>polarised</b>: backwards it can overheat and burst. 16 V is far above the 3.3 V used here. The real capacitance can differ from the printed value by 20 % or more, so your measured τ will differ.</p>`, { holes: ['c15', 'c20', 'd15 · +', 'd17 · −'] }),
    STEP('Wire it', 'pidesk', ids(ADS), `<p>Module pins to a10 to a15, header pins to the same columns in row b (the A0 pin has no header wire):</p><ul><li><b>VDD</b> → 3V3 (pin 1), <b>GND</b> → pin 6</li><li><b>SCL</b> → pin 5, <b>SDA</b> → pin 3</li><li><b>ADDR</b> → GND (pin 9): the address becomes 0x48</li><li><b>A0</b> lands in column 15: the point between the resistor and the capacitor</li></ul><p>Orange wire: <b>pin 11 (GPIO17)</b> → column 20 (the other end of the resistor). Black wire: <b>pin 14 (GND)</b> → column 17 (capacitor −).</p>`, { pins: ['p1', 'p6', 'p5', 'p3', 'p9', 'p11', 'p14'] }),
    STEP('The program', 'pidesk', ids(ADS), `<p>Click lines <b>${ADS_L.tags.ads}</b>, <b>${ADS_L.tags.gain}</b> and <b>${ADS_L.tags.pr1}</b>.</p><p>Gain 1 means a full scale of ±4.096 V. The library offers gains 2/3, 1, 2, 4, 8 and 16 (full scale ±6.144, ±4.096, ±2.048, ±1.024, ±0.512, ±0.256 V; the TI datasheet lists these ranges). Even at 2/3 the input still must not exceed VDD + 0.3 V.</p><p class="sim">The library names (<code>ADS1115(i2c)</code> with address 72 = 0x48 by default, <code>gain</code>, <code>AnalogIn(ads, pin).voltage</code>, <code>ads1x15.Pin.A0</code>) come from the Adafruit documentation and its simple-test example. The program has <b>not</b> been run on a real Pi.</p>`, { showCode: true, power: true }),
    STEP('Run it and watch the curve', 'pidesk', ids(ADS), `<p>Press <b>▶ Run</b>. The graph shows the voltage rising like a curve toward 3.3 V while the pin is HIGH, then falling back. Check that it is near 2.1 V after 1 s (63 % of 3.3 V). Try moving the ADDR wire to VDD with the switch in the panel: the converter then answers at 0x49 and the program stops with an error, because the library looks at 0x48.</p><p class="sim">The simulation uses the ideal 10 kΩ and 100 µF. The converter is shown without its own noise except a tiny random error; the sample rate is not modelled (a real ADS1115 takes a few milliseconds per reading: 8 to 860 samples per second).</p>`, { showCode: true, power: true, action: 'run' }),
    STEP('Summary', 'pidesk', ids(ADS), `<ul><li>The Pi has no analog inputs: add an ADC such as the ADS1115 (16 bit, I²C, 2.0 to 5.5 V).</li><li>ADDR to GND = address 0x48; to VDD, SDA or SCL = 0x49, 0x4A, 0x4B.</li><li>Gain sets the full scale; the input never may go above VDD + 0.3 V.</li><li>τ = R × C: 63 % after τ, about 99 % after 5τ.</li></ul>`, { power: true }),
  ],
  quiz: [
    { q: 'Why does the Pi need an ADS1115 to measure a capacitor voltage?', a: ['The Pi has no analog inputs, only digital ones', 'The capacitor is too big', 'The Pi has no I²C', 'Python cannot read voltages'], c: 0, why: 'GPIO pins only read high or low.' },
    { q: 'The ADDR pin is connected to GND. Which I²C address does the ADS1115 use?', a: ['0x48', '0x49', '0x68', '0x27'], c: 0, why: 'TI datasheet: GND → 0x48, VDD → 0x49, SDA → 0x4A, SCL → 0x4B.' },
    { q: 'What is the highest voltage you may put on an input of an ADS1115 powered from 3.3 V?', a: ['About 3.6 V (VDD + 0.3 V)', '6.144 V because of the gain', '12 V', '16 V'], c: 0, why: 'The absolute maximum is VDD + 0.3 V, whatever the full-scale setting.' },
    { q: 'R = 10 kΩ and C = 100 µF. What voltage do you expect after 1 s when charging toward 3.3 V?', a: ['About 2.1 V', 'About 3.3 V', 'About 0.3 V', 'About 1 V'], c: 0, why: '3.3 V × (1 − e⁻¹) ≈ 2.09 V.' },
  ],
  sources: [S.ads, S.adsguide, S.adslib, S.adsex, S.gz, S.rcsrc, S.pins],
};

export default {
  lessons: { u3: [], e32: [], uq: [], pi: [nrfLesson, adsLesson] },
  modules: { u3: {}, e32: {}, uq: {}, pi: { 90: 'Module 90 — Radio on the Pi: nRF24L01+', 91: 'Module 91 — Analog on the Pi: ADS1115 and the RC circuit' } },
  programs, code, checks,
};

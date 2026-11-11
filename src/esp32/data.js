// ESP32 DevKit V1 (DOIT, 30-pin version) — pins, parts and facts.
// Sources:
//   [DS]  Espressif ESP32 Series Datasheet v5.3 (chip): §5.3 DC characteristics, §3 strapping pins, §4.9.1 ADC, Table IO_MUX
//   [MOD] Espressif ESP32-WROOM-32 Datasheet v3.8: module 18 × 25.5 × 3.1 mm, 4 MB flash, 3.0–3.6 V
//   [RNT] Random Nerd Tutorials: "Getting started with the ESP32" and "ESP32 pinout reference" (board used in the course)
//   [EB]  espboards.dev "ESP32 30-pin DevKit generic": silkscreen order of the 30-pin board, 51.45 × 28.33 mm, GPIO2 LED
//   [IDF] Espressif ESP-IDF documentation: "ADC2 is also used by Wi-Fi"
// The board is the DOIT-style DevKit V1. There is no official CAD file for it, so the 3D model is stylised: sizes and
// positions are close but not measured. The chip, the module and every GPIO fact come from the Espressif documents above.

export const E32_W = 51.45, E32_H = 28.33;

// Capabilities of each GPIO (chip level)
// adc: ADC channel, touch: touch sensor, dac: DAC channel, strap: strapping pin note, inOnly: input only
const G = {
  36: { label: 'VP', adc: 'ADC1_CH0', inOnly: true }, 39: { label: 'VN', adc: 'ADC1_CH3', inOnly: true },
  34: { adc: 'ADC1_CH6', inOnly: true }, 35: { adc: 'ADC1_CH7', inOnly: true },
  32: { adc: 'ADC1_CH4', touch: 'T9' }, 33: { adc: 'ADC1_CH5', touch: 'T8' },
  25: { adc: 'ADC2_CH8', dac: 'DAC1' }, 26: { adc: 'ADC2_CH9', dac: 'DAC2' },
  27: { adc: 'ADC2_CH7', touch: 'T7' }, 14: { adc: 'ADC2_CH6', touch: 'T6', spi: 'HSPI CLK' },
  12: { adc: 'ADC2_CH5', touch: 'T5', spi: 'HSPI MISO', strap: 'Strapping pin (MTDI): it must be LOW (or unconnected) while the board starts; HIGH at start-up selects the wrong flash voltage and the board does not boot.' },
  13: { adc: 'ADC2_CH4', touch: 'T4', spi: 'HSPI MOSI' },
  23: { spi: 'VSPI MOSI' }, 22: { i2c: 'I²C SCL (default)' }, 1: { uart: 'UART0 TX (USB serial)' }, 3: { uart: 'UART0 RX (USB serial)' },
  21: { i2c: 'I²C SDA (default)' }, 19: { spi: 'VSPI MISO' }, 18: { spi: 'VSPI CLK' },
  5: { spi: 'VSPI CS', strap: 'Strapping pin: pulled up internally at start-up; its level at reset is read by the chip.' },
  17: { uart: 'UART2 TX' }, 16: { uart: 'UART2 RX' },
  4: { adc: 'ADC2_CH0', touch: 'T0' },
  2: { adc: 'ADC2_CH2', touch: 'T2', led: true, strap: 'Strapping pin (boot mode): pulled down internally; keep it LOW or unconnected while the board starts. The blue LED is on this pin.' },
  15: { adc: 'ADC2_CH3', touch: 'T3', spi: 'HSPI CS', strap: 'Strapping pin (MTDO): pulled up internally at start-up; a LOW level silences the boot messages on UART0.' },
};

// Silkscreen order of the 30-pin DevKit V1 (EB), listed east → west, i.e. antenna end → USB end
const L_ORDER = ['EN', 'VP', 'VN', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'GND', 'VIN'];
const R_ORDER = ['D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'TX2', 'RX2', 'D4', 'D2', 'D15', 'GND', '3V3'];
const X0 = 45.25, PITCH = 2.54, YN = 26.865, YS = 1.465;
const NUM = { VP: 36, VN: 39, TX0: 1, RX0: 3, TX2: 17, RX2: 16 };

function mk(label, i, header) {
  const x = X0 - i * PITCH, y = header === 'L' ? YN : YS;
  const base = { label, x, y, header, v: '3.3 V', mcu: '—' };
  if (label === 'EN') return { ...base, id: 'EN', fn: ['Chip enable (reset)'], note: 'Reset input of the chip (CHIP_PU). Pull it LOW to restart the ESP32: this is what the EN button does. Keep it HIGH (3.3 V) for the chip to run.', v: '3.3 V', kind: 'ctl' };
  if (label === 'VIN') return { ...base, id: 'VIN', fn: ['5 V input / output'], note: 'Connected to the 5 V from the USB connector when USB is plugged in. You can also feed about 5 V here from an external supply. Never put 3.3 V logic signals or more than 5 V here.', v: '≈5 V', kind: 'pwr' };
  if (label === '3V3') return { ...base, id: '3V3', fn: ['+3.3 V output'], note: 'Output of the 3.3 V regulator on the board. Everything on the ESP32 runs at 3.3 V. About 500 mA at most is claimed for this pin on generic boards; use small loads only.', v: '3.3 V', kind: 'pwr' };
  if (label === 'GND') return { ...base, id: header === 'L' ? 'GND1' : 'GND2', fn: ['Ground'], note: 'Ground (0 V).', v: '0 V', kind: 'gnd' };
  const n = NUM[label] ?? +label.slice(1), c = G[n] || {};
  const fn = [c.inOnly ? 'Digital input only' : 'Digital I/O'];
  if (c.adc) fn.push(`Analog input (${c.adc})`); if (c.touch) fn.push(`Touch sensor ${c.touch}`); if (c.dac) fn.push(`DAC output (${c.dac})`);
  if (c.i2c) fn.push(c.i2c); if (c.spi) fn.push(c.spi); if (c.uart) fn.push(c.uart); if (c.led) fn.push('Blue on-board LED');
  const notes = [];
  if (c.inOnly) notes.push('GPIO34–39 can only be inputs: they cannot drive an LED, and they have no internal pull-up or pull-down resistor.');
  if (c.strap) notes.push(c.strap);
  if (n === 1 || n === 3) notes.push('Used by the USB-to-serial chip (upload and Serial Monitor): do not connect other parts here while uploading.');
  if (c.adc && c.adc.startsWith('ADC2')) notes.push('ADC2 is also used by Wi-Fi: analogRead() on this pin does not work while Wi-Fi is on.');
  if (!notes.length) notes.push('General-purpose pin. The ESP32 can route most functions to most pins in software.');
  return { ...base, id: 'G' + n, gpio: n, label: label.startsWith('D') ? label : label, fn, note: notes.join(' '), mcu: 'GPIO' + n, inOnly: !!c.inOnly, adc: c.adc, touch: c.touch, dac: c.dac, strap: !!c.strap, adc2: !!(c.adc && c.adc.startsWith('ADC2')) };
}

export const E32_PINS = [...L_ORDER.map((l, i) => mk(l, i, 'L')), ...R_ORDER.map((l, i) => mk(l, i, 'R'))];
E32_PINS.forEach(p => { p.pin = (p.header === 'L' ? 0 : 15) + (p.header === 'L' ? L_ORDER : R_ORDER).indexOf(p.label, p.label === 'GND' && p.header === 'L' ? 0 : 0) + 1; });
export const findPinE32 = id => E32_PINS.find(p => p.id === id);
/** Arduino-ESP32 core: a GPIO is addressed by its number, e.g. pinMode(2, OUTPUT) */
export const gpioOf = id => { const p = findPinE32(id); return p && p.gpio !== undefined ? p.gpio : null; };

const COMMON = 'All pins are 3.3 V only: never apply 5 V to a GPIO. HIGH is above 0.75 × 3.3 V = 2.475 V, LOW is below 0.25 × 3.3 V = 0.825 V (chip datasheet). A pin can source about 40 mA or sink about 28 mA at most; design for 10 mA or less per pin.';
export const E32_HEADERS = [
  { id: 'jleft', name: 'Left header (EN … VIN)', pins: E32_PINS.filter(p => p.header === 'L'), common: COMMON },
  { id: 'jright', name: 'Right header (D23 … 3V3)', pins: E32_PINS.filter(p => p.header === 'R'), common: COMMON },
];

export const CATEGORIES_E32 = [
  { id: 'brains', name: 'Chips & module' },
  { id: 'power', name: 'Power' },
  { id: 'io', name: 'Connectors & headers' },
  { id: 'ui', name: 'LEDs & buttons' },
];

export const PARTS_E32 = {
  module: { cat: 'brains', name: 'ESP32-WROOM-32 module', ref: 'Espressif module · 18 × 25.5 × 3.1 mm', tag: 'The brain: CPU + Wi-Fi + Bluetooth',
    summary: 'A ready-made module: the ESP32 chip, 4 MB flash memory, a 40 MHz crystal and a printed antenna under one metal shield. Your program runs here.',
    specs: [['CPU', 'Xtensa dual-core 32-bit LX6, up to 240 MHz'], ['Memory', '520 KB SRAM + 4 MB flash (module)'], ['Wi-Fi', '802.11 b/g/n, up to 150 Mbps'], ['Bluetooth', 'v4.2 BR/EDR and Bluetooth LE'], ['Supply', '3.0 – 3.6 V']],
    points: ['The printed antenna is the part of the module without the metal shield: keep metal and wires away from it.', 'On some boards the module is a newer type (for example ESP32-WROOM-32E); it works the same way for this course.'],
    src: 'MOD datasheet v3.8 §1.1, §9 · DS' },
  antenna: { cat: 'brains', name: 'PCB antenna', ref: 'inside the module', tag: 'Wi-Fi + Bluetooth radio', summary: 'The zig-zag copper track at the end of the module is the antenna for both Wi-Fi (2.4 GHz) and Bluetooth. It needs free space around it.', src: 'MOD datasheet §1.1 (on-board PCB antenna)' },
  usbchip: { cat: 'brains', name: 'USB-to-serial chip', ref: 'CP2102 on this board', tag: 'USB link', summary: 'A small chip that turns USB into the serial (UART0) connection of the ESP32: uploads and the Serial Monitor go through it.',
    points: ['The board in the Random Nerd Tutorials guide has a CP2102; other boards use CH340 or CH9102. The chip name is printed on it.', 'It uses GPIO1 (TX0) and GPIO3 (RX0).'], src: 'RNT "Getting started" · EB' },
  usb: { cat: 'io', name: 'Micro-USB connector', ref: 'Micro-B', tag: 'Upload + power', summary: 'Connects the board to the computer: it powers the board with 5 V and uploads your programs. Use a USB cable that carries data, not a charge-only cable.', src: 'RNT "Getting started"' },
  reg: { cat: 'power', name: '3.3 V regulator', ref: 'LDO', tag: 'Makes 3.3 V', summary: 'Turns the 5 V from USB (or VIN) into the 3.3 V that the ESP32 needs. It also feeds the 3V3 pin.',
    points: ['Many boards use an AMS1117-3.3; newer batches use other 3.3 V regulators (for example ME6211). Check the print on your board.'], src: 'EB (regulator varies by batch)' },
  en: { cat: 'ui', name: 'EN (reset) button', ref: 'EN', tag: 'Restarts the program', summary: 'Press it to reset the ESP32: your program starts again from the beginning. It pulls the EN (chip enable) pin LOW.', src: 'RNT "Getting started" · DS (CHIP_PU)' },
  boot: { cat: 'ui', name: 'BOOT button', ref: 'BOOT · GPIO0', tag: 'Download mode', summary: 'Connects GPIO0 to ground. If GPIO0 is LOW when the chip starts, it waits for a new program (download mode). Some boards upload without it; if the upload does not start, hold BOOT while “Connecting…” shows.',
    points: ['After the board has started, GPIO0 is a normal pin and the button can be read in a sketch.'], src: 'DS §3 (GPIO0 strapping) · RNT "Getting started"' },
  ledon: { cat: 'ui', name: 'Power LED (red)', ref: 'PWR', tag: 'Power', summary: 'Lights when the board has power.', src: 'RNT "Getting started"' },
  ledblue: { cat: 'ui', name: 'Blue LED', ref: 'GPIO2', tag: 'User LED', summary: 'The built-in LED. It follows GPIO2, so digitalWrite(2, HIGH) turns it on.', points: ['GPIO2 is also a strapping pin; the LED does not disturb the start-up on this board.'], src: 'RNT "Getting started" · EB' },
  jleft: { cat: 'io', name: 'Left header', ref: '15 pins', tag: 'EN · VP · VN · D34 … D13 · GND · VIN', summary: 'Fifteen pins along one side: the reset pin EN, several analog inputs, the 5 V pin VIN and one GND.', warn: 'D34, D35, VP (36) and VN (39) are input only.', src: 'EB (pin order) · DS' },
  jright: { cat: 'io', name: 'Right header', ref: '15 pins', tag: 'D23 · D22 · TX0 · RX0 … D15 · GND · 3V3', summary: 'Fifteen pins along the other side: I²C (D21/D22), the serial pins TX0/RX0, SPI pins, one GND and the 3.3 V output.', src: 'EB (pin order) · DS' },
  passives: { cat: 'power', name: 'Small resistors and capacitors', ref: '0603 / 0805', tag: 'Supporting parts', summary: 'Pull-up resistors, decoupling capacitors and the LED resistors that make the board work.', src: 'EB' },
};

export const BOARD_FACTS_E32 = { name: 'ESP32 DevKit V1 (DOIT)', skus: 'ESP32-WROOM-32 module', size: '≈ 51.45 mm × 28.33 mm (30-pin version, one source)', temp: 'Module: −40 °C to 85 °C' };

// Arduino UNO R3 (A000066) — pins, parts and facts.
// Sources:
//   [DS]  Arduino UNO R3 datasheet / product reference manual A000066 (docs.arduino.cc), §3, §5.1–5.4
//   [BRD] Arduino's official board file UNO-TH_Rev3e.brd (CC BY-SA 4.0): part values, positions, header pad positions
//   [DOC] Arduino documentation for the UNO R3 (docs.arduino.cc/hardware/uno-rev3) and the Arduino language reference
//   [ATM] Microchip ATmega328P datasheet (absolute maximum ratings: 40 mA DC per I/O pin, 200 mA through VCC/GND)

// Header pads from the board file (x, y in mm, origin bottom-left; digital header along the top edge)
const D = (id, label, x, fn, note, extra = {}) => ({ id, label, x, y: 50.8, header: 'JDIGITAL', fn, v: '5 V', note, ...extra });
export const U3_PINS = [
  D('D0', '0', 63.5, ['Digital I/O', 'RX — serial receive (Serial)'], 'Also used for USB serial: the ATmega16U2 talks to the ATmega328P on pins 0 and 1, so avoid them while uploading or using the Serial Monitor.', { mcu: 'PD0' }),
  D('D1', '1', 60.96, ['Digital I/O', 'TX — serial transmit (Serial)'], 'Shared with the USB serial link (see pin 0).', { mcu: 'PD1' }),
  D('D2', '2', 58.42, ['Digital I/O', 'External interrupt INT0'], 'General-purpose digital pin; can trigger an interrupt.', { mcu: 'PD2' }),
  D('D3', '~3', 55.88, ['Digital I/O', 'PWM (analogWrite)', 'External interrupt INT1'], 'PWM pin (~).', { mcu: 'PD3', pwm: true }),
  D('D4', '4', 53.34, ['Digital I/O'], 'General-purpose digital pin.', { mcu: 'PD4' }),
  D('D5', '~5', 50.8, ['Digital I/O', 'PWM (analogWrite)'], 'PWM pin (~).', { mcu: 'PD5', pwm: true }),
  D('D6', '~6', 48.26, ['Digital I/O', 'PWM (analogWrite)'], 'PWM pin (~).', { mcu: 'PD6', pwm: true }),
  D('D7', '7', 45.72, ['Digital I/O'], 'General-purpose digital pin.', { mcu: 'PD7' }),
  D('D8', '8', 41.656, ['Digital I/O'], 'General-purpose digital pin.', { mcu: 'PB0' }),
  D('D9', '~9', 39.116, ['Digital I/O', 'PWM (analogWrite)'], 'PWM pin (~).', { mcu: 'PB1', pwm: true }),
  D('D10', '~10', 36.576, ['Digital I/O', 'PWM (analogWrite)', 'SPI SS (chip select)'], 'PWM pin (~); SPI chip select.', { mcu: 'PB2', pwm: true }),
  D('D11', '~11', 34.036, ['Digital I/O', 'PWM (analogWrite)', 'SPI MOSI'], 'PWM pin (~); SPI data out.', { mcu: 'PB3', pwm: true }),
  D('D12', '12', 31.496, ['Digital I/O', 'SPI MISO'], 'SPI data in.', { mcu: 'PB4' }),
  D('D13', '13', 28.956, ['Digital I/O', 'SPI SCK', 'Built-in LED “L”'], 'The yellow “L” LED on the board follows this pin (LED_BUILTIN). SPI clock.', { mcu: 'PB5' }),
  D('GND1', 'GND', 26.416, ['Ground'], 'Ground (0 V).', { mcu: '—', v: '0 V', kind: 'gnd' }),
  D('AREF', 'AREF', 23.876, ['Analog reference input'], 'Optional reference voltage for analogRead() (with analogReference(EXTERNAL)). Leave it unconnected normally.', { mcu: 'AREF', v: '—' }),
  D('SDA', 'SDA', 21.336, ['I²C data — same signal as A4'], 'The same pin as A4, repeated here for shields.', { mcu: 'PC4' }),
  D('SCL', 'SCL', 18.796, ['I²C clock — same signal as A5'], 'The same pin as A5, repeated here for shields.', { mcu: 'PC5' }),
  ...[['NC', 'NC', 27.94, ['Not connected'], 'Not connected.', '—'], ['IOREF', 'IOREF', 30.48, ['I/O voltage reference'], 'Tells shields the logic level: connected to 5 V on this board.', '5 V'],
    ['RESET', 'RESET', 33.02, ['Reset'], 'Pull LOW to reset the ATmega328P (like the reset button).', '5 V'], ['3V3', '3.3V', 35.56, ['+3.3 V output'], '3.3 V from the on-board LP2985 regulator — for small loads only.', '3.3 V'],
    ['5V', '5V', 38.1, ['+5 V'], '5 V from USB or from the on-board 5 V regulator (when powered through the jack or VIN).', '5 V'], ['GND2', 'GND', 40.64, ['Ground'], 'Ground (0 V).', '0 V'],
    ['GND3', 'GND', 43.18, ['Ground'], 'Ground (0 V).', '0 V'], ['VIN', 'VIN', 45.72, ['Voltage input'], 'Input voltage when powered through the DC jack (also an input for an external supply). Not powered when only USB is connected.', '6–20 V']]
    .map(([id, label, x, fn, note, v]) => ({ id, label, x, y: 2.54, header: 'POWER', fn, v, note, mcu: '—', kind: /^GND/.test(id) ? 'gnd' : ['3V3', '5V', 'VIN', 'IOREF'].includes(id) ? 'pwr' : undefined })),
  ...[0, 1, 2, 3, 4, 5].map(i => ({ id: 'A' + i, label: 'A' + i, x: 50.8 + i * 2.54, y: 2.54, header: 'ANALOG', mcu: 'PC' + i, v: '0–5 V',
    fn: ['Analog input (10-bit, 0–1023)', 'Digital I/O', ...(i === 4 ? ['I²C SDA'] : i === 5 ? ['I²C SCL'] : [])],
    note: i === 4 ? 'Analog input, or I²C data (SDA) for the Wire library.' : i === 5 ? 'Analog input, or I²C clock (SCL) for the Wire library.' : 'Analog input: analogRead() returns 0–1023 for 0–5 V (default reference).' })),
];
U3_PINS.forEach((p, i) => { p.pin = p.header === 'JDIGITAL' ? 1 + ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'GND1', 'AREF', 'SDA', 'SCL'].indexOf(p.id) : p.header === 'POWER' ? 1 + ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND2', 'GND3', 'VIN'].indexOf(p.id) : 9 + +p.id.slice(1); });
export const findPinU3 = id => U3_PINS.find(p => p.id === id);
const COMMON_D = 'All pins work at 5 V. One pin may supply or sink up to 40 mA (ATmega328P absolute maximum) — design for 20 mA or less. PWM pins are marked ~ (3, 5, 6, 9, 10, 11).';
export const U3_HEADERS = [
  { id: 'jdigital', name: 'Digital header', pins: U3_PINS.filter(p => p.header === 'JDIGITAL'), common: COMMON_D },
  { id: 'jpower', name: 'Power header', pins: U3_PINS.filter(p => p.header === 'POWER'), common: 'Supplies for your circuits: 5V, 3.3V and GND. The 3.3 V output is for small loads only.' },
  { id: 'janalog', name: 'Analog header', pins: U3_PINS.filter(p => p.header === 'ANALOG'), common: 'Six analog inputs A0–A5: analogRead() gives 0–1023 (10-bit) for 0–5 V. They can also be used as digital pins.' },
];

export const CATEGORIES_U3 = [
  { id: 'brains', name: 'Chips' },
  { id: 'power', name: 'Power' },
  { id: 'io', name: 'Connectors & headers' },
  { id: 'ui', name: 'LEDs & button' },
  { id: 'clock', name: 'Clocks' },
];

export const PARTS_U3 = {
  mcu: { cat: 'brains', name: 'ATmega328P microcontroller', ref: 'ZU4 · DIP-28 in a socket', tag: 'Runs your sketch',
    summary: 'The brain of the UNO R3: it runs the sketch you upload. It sits in a socket, so it can be replaced.',
    specs: [['CPU', '8-bit AVR, 16 MHz on this board'], ['Flash', '32 kB (program)'], ['SRAM', '2 kB'], ['EEPROM', '1 kB']],
    points: ['Pin 1 and the notch are at the end next to the ICSP header.', 'Its pins go to the digital and analog headers.'], src: 'DS §3.2, Features · BRD (ATMEGA328P-PU, DIL28)' },
  usbchip: { cat: 'brains', name: 'ATmega16U2 USB-to-serial chip', ref: 'U3 · MLF32', tag: 'USB link',
    summary: 'A second, small microcontroller that turns USB into a serial connection for the ATmega328P: uploading sketches and the Serial Monitor go through it.',
    points: ['It has its own ICSP header (ICSP1) and its own 16 MHz crystal.', 'The TX and RX LEDs show its serial traffic.'], src: 'DS (ATMega16U2 processor) · BRD (U3 ATMEGA16U2-MU)' },
  usb: { cat: 'io', name: 'USB-B connector', ref: 'X2', tag: 'Upload + power',
    summary: 'Connects the board to the computer with a USB-B cable: it powers the board (5 V) and is used to upload sketches.',
    points: ['Maximum USB input voltage 5.5 V (datasheet).', 'A 500 mA resettable fuse protects the computer’s USB port.'], src: 'DS §2.2, §4.1 · BRD (X2 USB-B_TH, F1 500 mA)' },
  dcjack: { cat: 'power', name: 'DC power jack', ref: 'X1 · 2.1 mm', tag: 'External supply',
    summary: 'Power from a wall adapter or battery. The input goes through a protection diode to VIN and the on-board 5 V regulator.',
    points: ['Input 6–20 V (datasheet limits).', 'When this supply is present, the board stops taking power from USB automatically.'], src: 'DS §2.2 (VIN 6–20 V), §3 (X1 power jack 2.1 x 5.5 mm) · BRD (D1, T1, U5)' },
  reg5: { cat: 'power', name: '5 V regulator', ref: 'U1 · SOT-223', tag: 'Makes 5 V',
    summary: 'Turns the voltage from the DC jack / VIN into the board’s 5 V. On USB power it is not used.', points: ['The datasheet parts table lists the SPX1117M3-L-5; Arduino’s board file names the NCP1117ST50T3G. Both are 5 V regulators of the 1117 type.', 'Its input is VIN (after the protection diode); its output is the 5 V rail.'], src: 'BRD (U1 NCP1117ST50T3G) · DS §3' },
  reg33: { cat: 'power', name: '3.3 V regulator', ref: 'U2 · LP2985-33', tag: 'Makes 3.3 V',
    summary: 'Makes the 3.3 V that comes out on the 3.3V header pin, for small 3.3 V parts.', src: 'BRD (U2 LP2985-33DBVR)' },
  opamp: { cat: 'power', name: 'LMV358 dual op-amp', ref: 'U5 · MSOP-8', tag: 'Power switch + LED driver',
    summary: 'A dual op-amp with two jobs. One half compares a voltage divided down from VIN with 3.3 V and, when an external supply is present, switches the USB power off through the MOSFET (T1). The other half buffers pin 13 (SCK) to drive the “L” LED.', src: 'BRD (U5 LMV358, T1, L LED) · DS §3.3 power tree' },
  mosfet: { cat: 'power', name: 'P-channel MOSFET', ref: 'T1 · FDN340P', tag: 'USB power switch', summary: 'The switch that disconnects USB power when the board is powered from the jack.', src: 'BRD (T1 FDN340P)' },
  fuse: { cat: 'power', name: 'Resettable fuse', ref: 'F1 · 500 mA', tag: 'Protects USB', summary: 'If your circuit draws too much current from USB (or there is a short circuit), this fuse heats up and cuts the current. It recovers when it cools down.', src: 'BRD (F1 MF-MSMF050-2 500 mA)' },
  diode: { cat: 'power', name: 'Protection diode', ref: 'D1 · M7', tag: 'Reverse polarity', summary: 'Stops current from flowing if a supply is connected to the DC jack the wrong way round.', src: 'BRD (D1 M7)' },
  caps: { cat: 'power', name: 'Electrolytic capacitors', ref: 'PC1, PC2 · 47 µF', tag: 'Smooth the supply', summary: 'Two 47 µF capacitors smooth the input and the 5 V supply. They have a polarity (the dark band marks −).', src: 'BRD (PC1, PC2 47u) · DS §3' },
  reso: { cat: 'clock', name: '16 MHz ceramic resonator', ref: 'Y2 · CSTCE16M0V53', tag: 'ATmega328P clock', summary: 'Gives the ATmega328P its 16 MHz clock.', src: 'BRD (Y2 CSTCE16M0V53-R0 16MHZ)' },
  xtal: { cat: 'clock', name: '16 MHz crystal', ref: 'Y1', tag: 'USB chip clock', summary: 'The metal-can crystal gives the ATmega16U2 its 16 MHz clock (USB needs an accurate clock).', src: 'BRD (Y1 16MHz, package QS)' },
  reset: { cat: 'ui', name: 'Reset button', ref: 'RESET', tag: 'Restarts the sketch', summary: 'Press it to restart the ATmega328P: your sketch starts again from the beginning.', src: 'DS §1.1 · BRD (RESET TS42)' },
  ledon: { cat: 'ui', name: 'ON LED (green)', ref: 'ON', tag: 'Power', summary: 'Lights when the board has 5 V.', src: 'BRD (ON GREEN)' },
  ledl: { cat: 'ui', name: 'L LED (yellow)', ref: 'L', tag: 'Pin 13', summary: 'The built-in LED: it follows pin 13 (LED_BUILTIN). The Blink example blinks it.', src: 'BRD (L, U5) · DOC' },
  ledtx: { cat: 'ui', name: 'TX LED', ref: 'TX', tag: 'Serial activity', summary: 'Flashes when the board sends data to the computer over USB.', src: 'BRD (TX)' },
  ledrx: { cat: 'ui', name: 'RX LED', ref: 'RX', tag: 'Serial activity', summary: 'Flashes when the board receives data from the computer (for example while uploading).', src: 'BRD (RX)' },
  jdigital: { cat: 'io', name: 'Digital header', ref: '18 pins', tag: 'D0–D13 · GND · AREF · SDA · SCL', summary: 'Pins 0–13 are digital inputs/outputs; ~ marks the six PWM pins (3, 5, 6, 9, 10, 11). It also has GND, AREF, and a copy of the I²C pins SDA/SCL.', warn: 'Pins 0 and 1 are the serial link to the USB chip.', src: 'DS §5.2 JDIGITAL' },
  jpower: { cat: 'io', name: 'Power header', ref: '8 pins', tag: 'IOREF · RESET · 3.3V · 5V · GND · VIN', summary: 'Power outputs for your circuits (5V, 3.3V, GND), the RESET pin, IOREF and VIN.', src: 'DS §5.1 JANALOG' },
  janalog: { cat: 'io', name: 'Analog header', ref: 'A0–A5', tag: '10-bit analog inputs', summary: 'Six analog inputs. analogRead() returns 0–1023 for 0–5 V. A4 and A5 are also the I²C pins.', src: 'DS §5.1 · DOC (analogRead)' },
  icsp: { cat: 'io', name: 'ICSP header (ATmega328P)', ref: 'ICSP · 2 × 3', tag: 'In-circuit programming', summary: 'Programs the ATmega328P directly (for example to burn the bootloader). Also carries the SPI pins and 5V/GND.', src: 'DS §3 · BRD (ICSP 2X03)' },
  icsp1: { cat: 'io', name: 'ICSP header (ATmega16U2)', ref: 'ICSP1 · 2 × 3', tag: 'Programs the USB chip', summary: 'The same kind of header for the ATmega16U2 USB chip.', src: 'DS §3 · BRD (ICSP1 2X03)' },
  passives: { cat: 'power', name: 'Small resistors and capacitors', ref: 'R, RN, C (0603)', tag: 'Supporting parts', summary: 'Tiny surface-mount resistors, resistor arrays and capacitors, placed exactly where the board file puts them (for example 100 nF decoupling capacitors next to each chip).', src: 'BRD' },
  holes: { cat: 'io', name: 'Mounting holes', ref: '4 × Ø3.2 mm', tag: 'Mechanical', summary: 'Four holes to screw the board to a case or base plate.', src: 'DS §5.4 board outline' },
};

export const BOARD_FACTS_U3 = { name: 'Arduino® UNO R3', skus: 'A000066', size: '68.58 mm × 53.34 mm', temp: '−40 °C to 85 °C (conservative board limits)' };

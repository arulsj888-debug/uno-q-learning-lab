// Raspberry Pi 4 Model B — parts, pins and facts. Every statement here comes from an official source:
//   DS   = Raspberry Pi 4 Model B datasheet, Release 1.1 (March 2024)
//   MECH = Raspberry Pi 4 mechanical drawing          SCH = Raspberry Pi 4 Model B reduced schematics (2019)
//   GPIO = raspberrypi.com documentation, "40-pin GPIO header" (pin table, 3.3 V warning, 16 mA / 50 mA)
//   DOC  = raspberrypi.com documentation: BCM2711, power supplies, USB, LED warning flash codes, bootloader
//   FCC  = Raspberry Pi 4 Model B installation/integration guide (FCC ID 2ABCB-RPI4B)
//   PHOTO = the real board (silkscreen labels J2, J3, J4 … and pin-1 square pad)

// GPIO alternate functions, datasheet Table 5: [default pull, ALT0 … ALT5]
const ALT = {
  0: ['High', 'SDA0', 'SA5', 'PCLK', 'SPI3 CE0 N', 'TXD2', 'SDA6'], 1: ['High', 'SCL0', 'SA4', 'DE', 'SPI3 MISO', 'RXD2', 'SCL6'],
  2: ['High', 'SDA1', 'SA3', 'LCD VSYNC', 'SPI3 MOSI', 'CTS2', 'SDA3'], 3: ['High', 'SCL1', 'SA2', 'LCD HSYNC', 'SPI3 SCLK', 'RTS2', 'SCL3'],
  4: ['High', 'GPCLK0', 'SA1', 'DPI D0', 'SPI4 CE0 N', 'TXD3', 'SDA3'], 5: ['High', 'GPCLK1', 'SA0', 'DPI D1', 'SPI4 MISO', 'RXD3', 'SCL3'],
  6: ['High', 'GPCLK2', 'SOE N', 'DPI D2', 'SPI4 MOSI', 'CTS3', 'SDA4'], 7: ['High', 'SPI0 CE1 N', 'SWE N', 'DPI D3', 'SPI4 SCLK', 'RTS3', 'SCL4'],
  8: ['High', 'SPI0 CE0 N', 'SD0', 'DPI D4', '-', 'TXD4', 'SDA4'], 9: ['Low', 'SPI0 MISO', 'SD1', 'DPI D5', '-', 'RXD4', 'SCL4'],
  10: ['Low', 'SPI0 MOSI', 'SD2', 'DPI D6', '-', 'CTS4', 'SDA5'], 11: ['Low', 'SPI0 SCLK', 'SD3', 'DPI D7', '-', 'RTS4', 'SCL5'],
  12: ['Low', 'PWM0', 'SD4', 'DPI D8', 'SPI5 CE0 N', 'TXD5', 'SDA5'], 13: ['Low', 'PWM1', 'SD5', 'DPI D9', 'SPI5 MISO', 'RXD5', 'SCL5'],
  14: ['Low', 'TXD0', 'SD6', 'DPI D10', 'SPI5 MOSI', 'CTS5', 'TXD1'], 15: ['Low', 'RXD0', 'SD7', 'DPI D11', 'SPI5 SCLK', 'RTS5', 'RXD1'],
  16: ['Low', 'FL0', 'SD8', 'DPI D12', 'CTS0', 'SPI1 CE2 N', 'CTS1'], 17: ['Low', 'FL1', 'SD9', 'DPI D13', 'RTS0', 'SPI1 CE1 N', 'RTS1'],
  18: ['Low', 'PCM CLK', 'SD10', 'DPI D14', 'SPI6 CE0 N', 'SPI1 CE0 N', 'PWM0'], 19: ['Low', 'PCM FS', 'SD11', 'DPI D15', 'SPI6 MISO', 'SPI1 MISO', 'PWM1'],
  20: ['Low', 'PCM DIN', 'SD12', 'DPI D16', 'SPI6 MOSI', 'SPI1 MOSI', 'GPCLK0'], 21: ['Low', 'PCM DOUT', 'SD13', 'DPI D17', 'SPI6 SCLK', 'SPI1 SCLK', 'GPCLK1'],
  22: ['Low', 'SD0 CLK', 'SD14', 'DPI D18', 'SD1 CLK', 'ARM TRST', 'SDA6'], 23: ['Low', 'SD0 CMD', 'SD15', 'DPI D19', 'SD1 CMD', 'ARM RTCK', 'SCL6'],
  24: ['Low', 'SD0 DAT0', 'SD16', 'DPI D20', 'SD1 DAT0', 'ARM TDO', 'SPI3 CE1 N'], 25: ['Low', 'SD0 DAT1', 'SD17', 'DPI D21', 'SD1 DAT1', 'ARM TCK', 'SPI4 CE1 N'],
  26: ['Low', 'SD0 DAT2', 'TE0', 'DPI D22', 'SD1 DAT2', 'ARM TDI', 'SPI5 CE1 N'], 27: ['Low', 'SD0 DAT3', 'TE1', 'DPI D23', 'SD1 DAT3', 'ARM TMS', 'SPI6 CE1 N'],
};

// Physical pin -> what is on it (datasheet Figure 3) and its typical use (official GPIO documentation pin table)
const MAP = {
  1: ['3V3'], 2: ['5V'], 3: [2, 'I²C data (SDA1). Has a 1.8 kΩ on-board pull-up resistor to 3.3 V.'], 4: ['5V'],
  5: [3, 'I²C clock (SCL1). Has a 1.8 kΩ on-board pull-up resistor to 3.3 V.'], 6: ['GND'], 7: [4, 'GPCLK0 clock output.'], 8: [14, 'UART transmit (TXD) — sends serial data.'],
  9: ['GND'], 10: [15, 'UART receive (RXD) — receives serial data.'], 11: [17, 'SPI chip enable (CE1).'], 12: [18, 'PCM clock, or SPI chip enable (CE0). Also PWM0 (datasheet ALT5).'],
  13: [27, 'General-purpose input/output.'], 14: ['GND'], 15: [22, 'General-purpose input/output.'], 16: [23, 'General-purpose input/output.'],
  17: ['3V3'], 18: [24, 'General-purpose input/output.'], 19: [10, 'SPI MOSI — sends data to an SPI device.'], 20: ['GND'],
  21: [9, 'SPI MISO — receives data from an SPI device.'], 22: [25, 'General-purpose input/output.'], 23: [11, 'SPI clock (SCLK).'], 24: [8, 'SPI chip enable (CE0).'],
  25: ['GND'], 26: [7, 'SPI chip enable (CE1).'], 27: [0, 'ID_SD — I²C data for the HAT ID EEPROM. Reserved: leave unconnected unless you attach an ID EEPROM.'],
  28: [1, 'ID_SC — I²C clock for the HAT ID EEPROM. Reserved: leave unconnected unless you attach an ID EEPROM.'],
  29: [5, 'General-purpose input/output.'], 30: ['GND'], 31: [6, 'General-purpose input/output.'], 32: [12, 'PWM0 output.'],
  33: [13, 'PWM1 output.'], 34: ['GND'], 35: [19, 'PCM frame sync, or SPI MISO.'], 36: [16, 'SPI chip enable (CE2).'],
  37: [26, 'General-purpose input/output.'], 38: [20, 'PCM data in (audio).'], 39: ['GND'], 40: [21, 'PCM data out (audio).'],
};

export const J8 = Object.entries(MAP).map(([n, [what, use]]) => {
  const pin = +n;
  if (typeof what === 'string') {
    const power = what === 'GND' ? { v: '0 V', fn: ['Ground'], note: 'Ground (0 V). Completes a circuit: connect the minus side of your parts here.' }
      : what === '3V3' ? { v: '3.3 V power', fn: ['3.3 V power output'], note: 'Supplies 3.3 V to small, low-current parts.' }
      : { v: '5 V power', fn: ['5 V power'], note: 'Supplies 5 V to peripherals, or accepts 5 V to power the Raspberry Pi (for example through a HAT). Never connect it to a GPIO pin.', warn: true };
    return { id: 'p' + pin, pin, label: what, header: 'J8', gpio: null, mcu: '—', ...power };
  }
  const g = what, a = ALT[g], id0 = g <= 1;
  const alts = a.slice(1).map((f, i) => f === '-' ? null : `ALT${i}: ${f}`).filter(Boolean);
  return {
    id: 'p' + pin, pin, label: id0 ? (g === 0 ? 'ID_SD' : 'ID_SC') : 'GPIO' + g, header: 'J8', gpio: g, mcu: 'BCM2711 GPIO' + g,
    v: '3.3 V logic', fn: [use.replace(/\.$/, ''), `Default pull at power-on: ${a[0].toLowerCase()} (datasheet Table 5)`, ...alts],
    note: id0 ? use : `${use} In code it is GPIO${g}; physically it is pin ${pin}. 3.3 V only — not 5 V tolerant.`, warn: id0,
  };
});
export const findPinPi = id => J8.find(p => p.id === id);
export const J8_HEADER = { id: 'gpio', name: 'GPIO (J8)', pins: J8, common: 'All GPIO pins work at 3.3 V and are not 5 V tolerant. One pin can supply up to 16 mA; all GPIO pins together at most 50 mA (official GPIO documentation).' };

export const CATEGORIES_PI = [
  { id: 'brains', name: 'Processor & memory' },
  { id: 'conn', name: 'Ports & connectors' },
  { id: 'gpio', name: 'Pin headers' },
  { id: 'status', name: 'LEDs & board' },
];

export const PARTS_PI = {
  soc: {
    cat: 'brains', name: 'Broadcom BCM2711', ref: 'SoC · 15 × 15 mm', tag: 'The processor',
    summary: 'The system-on-chip: the processor of the Raspberry Pi 4. It runs the Linux operating system and all your programs.',
    simple: ['Quad-core 64-bit Arm Cortex-A72 at 1.5 GHz.', 'Metal heat spreader on top; it slows down (throttles) to stay below 85 °C.'],
    specs: [['CPU', 'Quad-core Cortex-A72 (Armv8-A), 64-bit, 1.5 GHz'], ['Cache', '32 kB data + 48 kB instruction L1 per core, 1 MB L2'], ['Graphics', 'VideoCore VI, up to 500 MHz'], ['Video', 'H.265 decode 4Kp60, H.264 decode 1080p60'], ['Height', '2.4 mm (mechanical drawing)']],
    points: ['A PCIe link inside connects it to the USB controller, and the Ethernet controller is built in (BCM2711 documentation).', 'The CPU is throttled so its temperature never exceeds 85 °C; heavy continuous loads may need extra cooling (datasheet §5.6).'],
    src: 'DS §2.1, §5.6 · DOC “BCM2711” · MECH',
  },
  ram: {
    cat: 'brains', name: 'LPDDR4 SDRAM', ref: 'RAM', tag: 'Working memory',
    summary: 'The main memory: programs and data live here while the computer runs. It is erased when the power goes off.',
    simple: ['LPDDR4 memory next to the processor.', 'Board versions with 1, 2, 4 or 8 GB.'],
    specs: [['Type', 'LPDDR4-2400 SDRAM'], ['Size', '1, 2, 4 or 8 GB, depending on the version']],
    src: 'DS §1 · DOC “BCM2711”',
  },
  wireless: {
    cat: 'brains', name: 'Wi-Fi & Bluetooth', ref: 'Shielded radio · Cypress 43455', tag: 'Wireless',
    summary: 'The metal can covers the radio circuit for wireless networking. The antenna is on the board.',
    simple: ['Wi-Fi 802.11 b/g/n/ac (2.4 and 5 GHz).', 'Bluetooth 5.0 with Bluetooth Low Energy.'],
    specs: [['Wi-Fi', '802.11 b/g/n/ac'], ['Bluetooth', '5.0, BLE'], ['Chip', 'Based on the Cypress 43455 (FCC integration guide)']],
    src: 'DS §2.2 · FCC 2ABCB-RPI4B',
  },
  vl805: {
    cat: 'brains', name: 'VL805 USB controller', ref: 'USB 3.0 host controller', tag: 'Drives the 4 USB ports',
    summary: 'The two USB 3.0 and two USB 2.0 ports are connected to this VL805 USB controller (marked with the VIA logo).',
    simple: ['Runs all four USB-A ports.', 'Linked to the BCM2711 over PCIe.'],
    src: 'DOC “USB” and “BCM2711” · PHOTO',
  },
  gpio: {
    cat: 'gpio', name: '40-pin GPIO header', ref: 'J8 · 2 × 20, 2.54 mm', tag: 'Connect your electronics',
    summary: 'Two rows of 20 pins for LEDs, buttons, sensors and add-on boards (HATs): 26 general-purpose pins, 2 ID pins, 4 power pins and 8 ground pins.',
    simple: ['3.3 V logic pins plus 3V3, 5V and GND power pins.', 'Pin 1 is the square pad at the SD-card end, inner row.'],
    specs: [['Pins', '40 (2 × 20), 2.54 mm pitch'], ['GPIO', '26 general-purpose + 2 reserved for the HAT ID EEPROM'], ['Power', '2 × 3V3, 2 × 5V, 8 × GND'], ['Logic level', '3.3 V — not 5 V tolerant'], ['Current', 'max 16 mA per pin, 50 mA for all GPIO together'], ['Height', '8.5 mm (mechanical drawing)']],
    warn: 'Never connect 5 V to a GPIO pin — it can permanently damage the processor.',
    src: 'DS §5.1 · GPIO documentation · MECH · PHOTO (pin-1 square pad)',
  },
  poe: {
    cat: 'gpio', name: 'PoE header', ref: 'J14 · 2 × 2 pins', tag: 'Power over Ethernet',
    summary: 'Four pins that a PoE HAT uses to take power from the Ethernet cable. The Ethernet jack supports IEEE 802.3af PoE, but only with a PoE HAT fitted.',
    simple: ['Used only by a PoE HAT.', 'Lets one network cable carry data and power.'],
    src: 'DOC “Power supplies” · SCH · PHOTO',
  },
  j2: {
    cat: 'gpio', name: 'RUN / GLOBAL_EN header', ref: 'J2 · 3 holes', tag: 'Reset and power enable',
    summary: 'Three solder holes (no pins fitted) for the RUN and GLOBAL_EN signals. The schematic notes: RUN is 3.3 V, GLOBAL_EN is 5 V.',
    simple: ['RUN (3.3 V) and GLOBAL_EN (5 V) signals.', 'With the bootloader setting POWER_OFF_ON_HALT on, GLOBAL_EN must be shorted to ground to boot again after a halt.'],
    warn: 'For advanced use only — not needed in the lessons.',
    src: 'SCH · DOC bootloader “POWER_OFF_ON_HALT” · PHOTO',
  },
  ethernet: {
    cat: 'conn', name: 'Gigabit Ethernet port', ref: 'J10 · RJ45', tag: 'Wired network',
    summary: 'Plug in a network cable for a fast, reliable wired connection. Supports PoE (IEEE 802.3af) with a PoE HAT.',
    simple: ['Gigabit (1000 Mbit/s) Ethernet.', 'PoE-capable with an add-on PoE HAT.'],
    specs: [['Speed', 'Gigabit Ethernet'], ['PoE', 'IEEE 802.3af, needs a PoE HAT'], ['Height', '13.5 mm (mechanical drawing)']],
    src: 'DS §2.2 · DOC “Power supplies” · MECH',
  },
  usb3: {
    cat: 'conn', name: 'USB 3.0 ports (blue)', ref: '2 × USB-A', tag: 'Fast USB',
    summary: 'Two fast USB 3.0 ports for drives and other devices. You can tell them by the blue plastic inside.',
    simple: ['Two USB 3.0 type-A sockets.', 'Shared power limit with the other USB ports.'],
    specs: [['Ports', '2 × USB 3.0 type-A'], ['Controller', 'VL805'], ['USB current', 'all four ports together: ≈ 1.1 A (datasheet) · 1.2 A (documentation table)'], ['Height', '16 mm (mechanical drawing)']],
    src: 'DS §5.3 · DOC “USB” · MECH',
  },
  usb2: {
    cat: 'conn', name: 'USB 2.0 ports', ref: '2 × USB-A', tag: 'Keyboard & mouse',
    summary: 'Two USB 2.0 ports — ideal for a keyboard and a mouse.',
    simple: ['Two USB 2.0 type-A sockets.', 'Black plastic inside (USB 3.0 is blue).'],
    specs: [['Ports', '2 × USB 2.0 type-A'], ['Controller', 'VL805'], ['Height', '16 mm (mechanical drawing)']],
    src: 'DS §5.3 · DOC “USB” · MECH',
  },
  usbc: {
    cat: 'conn', name: 'USB-C power input', ref: 'J1 · POWER IN', tag: '5 V / 3 A supply',
    summary: 'The power socket. The datasheet asks for a good-quality USB-C supply delivering 5 V at 3 A; the documentation says all models need a 5.1 V supply and recommends the official 3 A USB-C supply.',
    simple: ['The power input — 5 V, 3 A recommended.', 'The red PWR LED shows a stable 5 V supply.'],
    specs: [['Supply', '5 V, 3 A (5 V, 2.5 A if USB devices take < 500 mA)'], ['Absolute max', '6.0 V'], ['Typical use', '≈ 600 mA bare board, active']],
    warn: 'A weak supply causes undervoltage: the red PWR LED goes off or flickers.',
    src: 'DS §4, §4.1 · DOC “Power supplies”, “LED warning flash codes”',
  },
  hdmi0: {
    cat: 'conn', name: 'micro-HDMI 0', ref: 'J6 · HDMI0', tag: 'Monitor',
    summary: 'Connect a monitor or TV here with a micro-HDMI cable. HDMI0 is the port next to the USB-C power socket (printed on the board).',
    simple: ['micro-HDMI, HDMI 2.0, up to 4Kp60.', 'Two ports = two screens at once.'],
    specs: [['Standard', 'HDMI 2.0 with CEC'], ['Resolution', 'up to 4Kp60'], ['Height', '3.0 mm (mechanical drawing)']],
    src: 'DS §5.4 · MECH · PHOTO (labels HDMI0 / HDMI1)',
  },
  hdmi1: {
    cat: 'conn', name: 'micro-HDMI 1', ref: 'J13 · HDMI1', tag: 'Second monitor',
    summary: 'The second display output. Both ports support HDMI 2.0 and CEC, so two screens can be used at once.',
    simple: ['micro-HDMI, HDMI 2.0, up to 4Kp60.', 'Use it for a second screen.'],
    specs: [['Standard', 'HDMI 2.0 with CEC'], ['Resolution', 'up to 4Kp60']],
    src: 'DS §5.4 · PHOTO',
  },
  av: {
    cat: 'conn', name: 'A/V jack', ref: 'J7 · 3.5 mm, 4-ring', tag: 'Audio & composite video',
    summary: 'Analogue audio out (can drive 32 Ω headphones directly) and composite TV video, through one 4-ring (TRRS) jack.',
    simple: ['Headphones or speakers plug in here.', 'Also composite video for old TVs.'],
    specs: [['Audio', 'near-CD-quality analogue, drives 32 Ω headphones'], ['Video', 'composite (TV out)'], ['Height', '6.0 mm (mechanical drawing)']],
    src: 'DS §5.5 · MECH',
  },
  camera: {
    cat: 'conn', name: 'Camera connector', ref: 'J3 · CAMERA · MIPI CSI', tag: 'Camera module',
    summary: 'A flat-cable connector for a Raspberry Pi camera module (2-lane MIPI CSI). Lift the black latch, insert the ribbon, press the latch down.',
    simple: ['For Raspberry Pi camera modules.', '2-lane MIPI CSI.'],
    src: 'DS §5.2 · PHOTO (label CAMERA)',
  },
  display: {
    cat: 'conn', name: 'Display connector', ref: 'J4 · DISPLAY · MIPI DSI', tag: 'Touch display',
    summary: 'A flat-cable connector for a Raspberry Pi display (2-lane MIPI DSI).',
    simple: ['For Raspberry Pi touch displays.', '2-lane MIPI DSI.'],
    src: 'DS §5.2 · PHOTO (label DISPLAY)',
  },
  sdcard: {
    cat: 'conn', name: 'microSD card slot', ref: 'Underside · MICRO SD CARD', tag: 'The “hard disk”',
    summary: 'The operating system and your files live on a microSD card that goes in here, on the underside of the board.',
    simple: ['Holds the card with the operating system.', 'On the bottom side — turn the board over.'],
    specs: [['Interface', 'SD card socket, 1.8 V, DDR50 (up to 50 MB/s)']],
    warn: 'Do not remove the card while the Raspberry Pi is running — shut down first.',
    src: 'DS §5.1.4 · PHOTO (underside label)',
  },
  ledpwr: {
    cat: 'status', name: 'PWR LED (red)', ref: 'PWR', tag: 'Power status',
    summary: 'Red: lit when the 5 V supply is stable. Off or flickering means undervoltage — the power supply is too weak.',
    simple: ['Red = power OK.', 'Off or flickering = undervoltage.'],
    src: 'DOC “LED warning flash codes” · SCH',
  },
  ledact: {
    cat: 'status', name: 'ACT LED (green)', ref: 'ACT', tag: 'Activity',
    summary: 'Green: flashes while the microSD card is being read or written. Special flash patterns report boot errors.',
    simple: ['Green flashes = microSD activity.', 'Flash codes report boot problems.'],
    src: 'DOC “LED warning flash codes”, bootloader · SCH',
  },
  holes: {
    cat: 'status', name: 'Mounting holes', ref: '4 holes · 58 × 49 mm', tag: 'Fix the board',
    summary: 'Four holes, 3.5 mm in from the edges and 58 mm × 49 mm apart, to screw the board into a case or onto standoffs.',
    src: 'MECH',
  },
  pcb: {
    cat: 'status', name: 'Circuit board', ref: '85 × 56 mm', tag: 'Raspberry Pi 4 Model B',
    summary: 'The board is 85 mm × 56 mm with 3 mm rounded corners. Recommended operating temperature 0–50 °C.',
    src: 'MECH · DS §5.6',
  },
};

export const BOARD_FACTS_PI = { name: 'Raspberry Pi 4 Model B', size: '85 × 56 mm', ram: '1, 2, 4 or 8 GB LPDDR4', temp: '0 – 50 °C (ambient)' };

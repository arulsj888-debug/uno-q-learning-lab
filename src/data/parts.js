// Part descriptions for the clickable board. Every fact here is taken from:
//  [DS]  Arduino UNO Q datasheet ABX00162-ABX00173 (rev. 16, 30/10/2026)
//  [UM]  Arduino UNO Q user manual, docs.arduino.cc/tutorials/uno-q/user-manual
//  [PIN] Arduino UNO Q full pinout PDF
//  [ST]  STMicroelectronics STM32U585 datasheet (Table 31, current characteristics)

export const CATEGORIES = [
  { id: 'brains', name: 'The two brains' },
  { id: 'memory', name: 'Memory & power chips' },
  { id: 'power', name: 'Power & buttons' },
  { id: 'io', name: 'Headers & connectors' },
  { id: 'ui', name: 'LEDs & display' },
  { id: 'wireless', name: 'Wireless & video' },
  { id: 'bottom', name: 'Bottom side' },
  { id: 'mech', name: 'Mechanical' },
];

export const PARTS = {
  soc: {
    cat: 'brains', name: 'Qualcomm Dragonwing™ QRB2210', ref: 'SOC1', tag: 'MPU · runs Linux',
    summary: 'The main application processor (MPU). It runs Debian Linux, your Python® programs, Arduino App Lab Bricks and AI models.',
    simple: [
      'Main application processor running Debian Linux & Python.',
      'Executes AI vision models, camera ISP, and high-level apps.'
    ],
    specs: [
      ['CPU', '4 × Arm® Cortex®-A53 @ 2.0 GHz, 64-bit'],
      ['GPU', 'Adreno 702 @ 845 MHz (OpenGL ES 3.1, Vulkan, OpenCL 2.0)'],
      ['Camera ISP', 'Dual ISP: 13 MP + 13 MP or 25 MP @ 30 fps'],
      ['Video', 'H.264 / H.265 encode + decode, VP9 decode, up to 1920×1080'],
      ['Interfaces', 'USB 3.1 (role switching), SDIO 3.0, 4-lane MIPI-CSI-2, 4-lane MIPI-DSI'],
      ['I/O voltage', '1.8 V'],
    ],
    points: [
      'Talks to the STM32 microcontroller through Bridge, Arduino’s RPC (Remote Procedure Call) library.',
      'Handles USB-C role switching and Power Delivery negotiation (it requests 5 V / 3 A only).',
    ],
    warn: 'MPU GPIOs work at 1.8 V. Never connect them straight to 3.3 V or 5 V logic — use a level shifter.',
    src: 'DS §2.2.1, §6.1, §7, §8',
  },
  mcu: {
    cat: 'brains', name: 'STMicroelectronics STM32U585', ref: 'MCU1 (bottom side)', tag: 'MCU · runs your sketch',
    summary: 'The real-time microcontroller (MCU). Your Arduino sketch runs here, on the Arduino Core over Zephyr OS. It controls the 3.3 V header pins, the LED matrix and the MCU RGB LEDs.',
    simple: [
      'Real-time Arduino microcontroller running your sketch.',
      'Directly controls GPIO pins, sensors, and the LED matrix.'
    ],
    specs: [
      ['Core', 'Arm® Cortex®-M33 up to 160 MHz, with FPU'],
      ['Memory', '2 MB flash, 786 kB SRAM'],
      ['Software', 'Arduino Core on Zephyr OS'],
      ['I/O voltage', '3.3 V (VREF+ ≈ 3.3 V)'],
      ['Peripherals used on UNO Q', 'ADC, DAC, PWM, CAN, timers, UART, SPI, I²C, LED matrix'],
      ['Pin current (abs. max)', '20 mA per I/O pin, 120 mA for all I/O pins together [ST]'],
    ],
    points: [
      'Handles the 3.3 V headers: JDIGITAL, JANALOG, JSPI and Qwiic.',
      'Programmed from Arduino App Lab, or from the Arduino IDE with the “Arduino UNO Q Zephyr Core”.',
      'It is on the bottom of the board — press “Bottom” to see it.',
    ],
    warn: '20 mA is an absolute maximum, not a working value. Design LED and load currents well below it.',
    src: 'DS §2.2.1, §6.2 · UM “Arduino IDE (Beta)” · ST STM32U585 datasheet Table 31',
  },
  dram: {
    cat: 'memory', name: 'LPDDR4X RAM', ref: 'DRAM1', tag: '2 GB or 4 GB',
    summary: 'Working memory (RAM) for Linux and your applications.',
    simple: [
      'High-speed system memory (2 GB or 4 GB) for Linux.',
      'Holds active programs, AI models, and open apps in memory.'
    ],
    specs: [
      ['Type', 'LPDDR4X SDRAM, single-rank, 32-bit'],
      ['ABX00162', '2 GB RAM'],
      ['ABX00173', '4 GB RAM'],
    ],
    points: ['For running Arduino App Lab directly on the board (single-board computer mode), Arduino recommends the 4 GB variant.'],
    src: 'DS §2.1, §2.2.1, §11.1',
  },
  emmc: {
    cat: 'bottom', name: 'eMMC storage', ref: 'EMMC1 (bottom side)', tag: '16 GB or 32 GB',
    summary: 'Built-in flash storage that holds the Debian Linux operating system, your Apps and data.',
    simple: [
      'Built-in flash storage holding the Debian Linux OS.',
      'Saves your user files, Python libraries, and AI data.'
    ],
    specs: [['ABX00162', '16 GB'], ['ABX00173', '32 GB']],
    points: ['Located on the bottom side of the board.'],
    src: 'DS §2.1, §2.2.1',
  },
  pmic: {
    cat: 'memory', name: 'Qualcomm PM4125 PMIC', ref: 'PMIC1', tag: 'Power-management IC',
    summary: 'The power-management chip of the Qualcomm processor. It is powered from the 5 V system bus and creates the 1.8 V rail.',
    simple: [
      'Power-management chip of the Qualcomm processor.',
      'Fed from the 5 V bus, it makes the 1.8 V rail (3.3 V comes from separate regulators).'
    ],
    specs: [
      ['Input', '5V_SYS (system 5 V bus)'],
      ['1.8 V rail', 'VREG_L15A_1P8V from its L15A LDO'],
      ['1.8 V powers', 'SoC I/O banks, ANX7625, Wi-Fi® logic, on-board level shifters'],
      ['RTC', 'Real-time clock powered by VCOIN'],
    ],
    src: 'DS §3.3, §4.3',
  },
  anx: {
    cat: 'wireless', name: 'ANX7625 video bridge', ref: 'U3001', tag: 'MIPI-DSI → DisplayPort',
    summary: 'Converts the processor’s MIPI-DSI display signal into DisplayPort Alt-Mode on the USB-C connector, so a monitor can be connected through a USB-C dongle.',
    simple: [
      'Video bridge converting MIPI signals to DisplayPort.',
      'Enables connecting an external monitor directly over USB-C.'
    ],
    specs: [
      ['Output', 'DisplayPort Alt-Mode on USB-C'],
      ['Resolution', 'Supports Full HD 1920 × 1080; optimal 1280 × 720 (SBC mode)'],
    ],
    points: ['The same MIPI-DSI signal is shared with the JMEDIA connector: only one display output (USB-C or JMEDIA) can be active at a time.'],
    src: 'DS §2.2.1, §2.2.2, §10',
  },
  wifi: {
    cat: 'wireless', name: 'WCBN3536A Wi-Fi® + Bluetooth® module', ref: 'U2901', tag: 'Wi-Fi 5 · Bluetooth 5.1',
    summary: 'The wireless module (Qualcomm WCN3980 inside). It gives the board dual-band Wi-Fi and Bluetooth.',
    simple: [
      'Dual-band Wi-Fi 5 & Bluetooth 5.1 wireless module.',
      'Connects the board to your Wi-Fi network and BLE devices.'
    ],
    specs: [
      ['Wi-Fi®', '802.11a/b/g/n/ac (Wi-Fi 5), dual-band 2.4 / 5 GHz'],
      ['Bluetooth®', '5.1'],
      ['Links to MPU', 'SDIO for Wi-Fi data, UART for Bluetooth control'],
      ['Antenna', 'Shared PCB antenna'],
    ],
    points: ['During first setup in Arduino App Lab you enter your Wi-Fi credentials so the board can join your network.'],
    warn: 'Safety: keep at least 20 cm between the operating board and your body (RF exposure). The 5 GHz band may be restricted in some countries.',
    src: 'DS §2.2.2, §10, §11.1, Safety Information',
  },
  antenna: {
    cat: 'wireless', name: 'PCB antenna area', ref: 'next to U2901', tag: 'Wi-Fi + Bluetooth',
    summary: 'The datasheet states that Wi-Fi and Bluetooth use a shared PCB antenna. On the board artwork this is the copper-free corner next to the wireless module.',
    simple: [
      'Integrated dual-band PCB trace antenna.',
      'Transmits and receives radio signals for Wi-Fi and Bluetooth.'
    ],
    points: ['Metal objects, wires or your hand right on top of an antenna weaken the radio signal — keep this corner clear.'],
    src: 'DS §2.2.2 · official CAD/Gerber files',
  },
  usbc: {
    cat: 'power', name: 'USB-C® connector', ref: 'JUSB1', tag: 'Power · data · video',
    summary: 'One connector for power, data and video. Connect it to your PC to program the board, or to a USB-C dongle to use it as a single-board computer.',
    simple: [
      'Single connector for 5V/3A power, data, and video.',
      'Connects to your PC for coding or USB-C hub for monitor & keys.'
    ],
    specs: [
      ['Power (sink)', '5 V / 3 A (15 W). USB PD requests the 5 V / 3 A contract only'],
      ['Data', 'USB 3.1 with role switching (the datasheet gives no speed grade)'],
      ['Video', 'DisplayPort Alt-Mode (via ANX7625)'],
      ['With a dongle', 'HDMI, USB camera, audio, Ethernet, keyboard/mouse, storage'],
    ],
    points: ['When DisplayPort Alt-Mode is active, USB data speed is reduced (the high-speed lanes are shared).'],
    warn: 'Use a supply and a full 24-pin USB-C cable rated for 5 V / 3 A, otherwise short peaks (Wi-Fi bursts, display start) can cause undervoltage.',
    src: 'DS §2.2.2, §3.1, §10 · UM “USB-C Connector”',
  },
  pwrbtn: {
    cat: 'power', name: 'Power button', ref: 'JBTN1', tag: 'Reboots Linux',
    summary: 'A long press (5 seconds or more) reboots the Linux system on the MPU.',
    simple: [
      'Power button: hold it 5 s or more to reboot Linux.',
      'It does not cut the power — the board starts by itself.'
    ],
    points: [
      'It does not cut power to the board.',
      'You do not need to press it to start the board — it boots automatically when power is applied.',
    ],
    warn: 'A long-press reboot restarts Linux and can interrupt running Apps. Save your work first.',
    src: 'DS §11.5 · UM “Power Button”',
  },
  pwrled: {
    cat: 'ui', name: 'Power LED (green)', ref: 'D27201', tag: '“ON”',
    summary: 'A green LED tied to the 3.3 V rail. It lights whenever the board is powered.',
    simple: [
      'Green LED indicating active board power.',
      'Lights up continuously whenever power is connected.'
    ],
    src: 'DS §5',
  },
  rgb1: {
    cat: 'ui', name: 'RGB LED 1 — Linux controlled', ref: 'D27301', tag: 'Silkscreen “QRB 1”',
    summary: 'A tri-colour LED driven by the Qualcomm processor. Control it from Linux via /sys/class/leds/ or from Python.',
    simple: [
      'Multi-color RGB LED programmable from Linux & Python.',
      'Used for custom alerts and application notifications.'
    ],
    specs: [['Red', 'red:user → GPIO_41'], ['Green', 'green:user → GPIO_42'], ['Blue', 'blue:user → GPIO_60']],
    points: ['Python (App Lab): Leds.set_led1_color(1, 0, 0) turns it red.'],
    src: 'DS §5 · UM “MPU Controlled LEDs”',
  },
  rgb2: {
    cat: 'ui', name: 'RGB LED 2 — Linux status LED', ref: 'D27302', tag: 'Silkscreen “QRB 2”',
    summary: 'A tri-colour LED driven by the Qualcomm processor. By default it shows system status (PANIC, WLAN, BT), but you can also control it.',
    simple: [
      'Linux status LED: PANIC (red), WLAN (green), BT (blue).',
      'You can also control it yourself from Linux / Python.'
    ],
    specs: [['Red', 'red:panic → GPIO_39'], ['Green', 'green:wlan → GPIO_40'], ['Blue', 'blue:bt → GPIO_47']],
    points: ['Python (App Lab): Leds.set_led2_color(r, g, b).'],
    src: 'DS §5 · UM “MPU Controlled LEDs”',
  },
  rgb3: {
    cat: 'ui', name: 'RGB LED 3 — MCU controlled', ref: 'D27401', tag: 'Silkscreen “STM 3”',
    summary: 'A tri-colour LED driven by the STM32 microcontroller. In the official Blink examples, LED_BUILTIN blinks the red segment of this LED.',
    simple: [
      'MCU-controlled RGB LED (LED_BUILTIN blinks red here).',
      'Directly programmable inside your Arduino sketches.'
    ],
    specs: [['Red', 'LED3_R → PH10'], ['Green', 'LED3_G → PH11'], ['Blue', 'LED3_B → PH12']],
    points: ['Active-low: digitalWrite(LED3_R, LOW) turns the red segment ON, HIGH turns it OFF.'],
    src: 'DS §5 · UM “MCU Controlled LEDs”, “Bridge” example',
  },
  rgb4: {
    cat: 'ui', name: 'RGB LED 4 — MCU controlled', ref: 'D27402', tag: 'Silkscreen “STM 4”',
    summary: 'A second tri-colour LED driven by the STM32 microcontroller.',
    simple: [
      'Second MCU-controlled RGB LED for custom sketch alerts.',
      'Great for visual sensor alerts, state machines, and timers.'
    ],
    specs: [['Red', 'LED4_R → PH13'], ['Green', 'LED4_G → PH14'], ['Blue', 'LED4_B → PH15']],
    points: ['Active-low: LOW = ON, HIGH = OFF.'],
    src: 'DS §5 · UM “MCU Controlled LEDs”',
  },
  matrix: {
    cat: 'ui', name: '8 × 13 LED matrix', ref: 'D27001 … D27104', tag: '104 blue LEDs',
    summary: 'A display of 104 blue LEDs (8 rows × 13 columns) driven by the STM32 microcontroller. Use it for icons, status, text or small games.',
    simple: [
      'Built-in display matrix with 104 programmable blue LEDs.',
      'Shows icons, status, data and simple animations.'
    ],
    specs: [
      ['LEDs', '104, monochrome blue'],
      ['Brightness', '8 grey levels (3-bit) per LED, set with matrix.setGrayscaleBits()'],
      ['Library', 'Arduino_LED_Matrix'],
    ],
    points: ['During Linux start-up it shows the boot logo/animation for about 20–30 seconds.'],
    warn: 'Accessing the matrix before start-up has finished may interfere with MCU operation.',
    src: 'DS §5 · UM “LED Matrix”',
  },
  jdigital: {
    cat: 'io', name: 'JDIGITAL header', ref: 'JDIGITAL1 · 18 pins', tag: '3.3 V digital I/O',
    summary: 'The classic UNO-style digital header: D0–D13, GND, AREF, SDA and SCL. Click any single pin to see what it does.',
    simple: [
      'Standard digital header with PWM, UART, SPI & I²C pins.',
      'Connects standard Arduino shields, buttons, and actuators.'
    ],
    specs: [
      ['Logic level', '3.3 V'],
      ['PWM pins (~)', 'D3, D5, D6, D9, D10, D11 — fixed 500 Hz, 8-bit by default'],
      ['UART', 'D0 (RX) / D1 (TX) → Serial1'],
      ['SPI', 'D10 SS, D11 MOSI, D12 MISO, D13 SCK'],
      ['I²C', 'D20 SDA / D21 SCL → Wire'],
      ['CAN', 'D4 TX / D5 RX (FDCAN1, external transceiver needed)'],
    ],
    points: ['Most pins are 5 V-tolerant as inputs (FT-type). Outputs always drive 3.3 V.'],
    warn: 'D3 is only 3.6 V-tolerant — never apply 5 V to it.',
    src: 'DS §9, §9.6 · UM “Digital Pins”, “PWM Pins”, “UART”, “I2C”',
  },
  janalog: {
    cat: 'io', name: 'JANALOG header', ref: 'JANALOG1 · 14 pins', tag: 'Power + analog',
    summary: 'The UNO-style power and analog header: BOOT, IOREF, RESET, 3V3, 5V, GND, GND, VIN and A0–A5. Click any single pin.',
    simple: [
      'Analog input header (14-bit ADC) and board power rails.',
      'Reads analog sensors (0–3.3 V) and carries 3V3, 5V and the VIN input (7–24 V).'
    ],
    specs: [
      ['ADC', '6 inputs (A0–A5), up to 14-bit (14/12/10/8 selectable)'],
      ['ADC reference', '3.3 V default; internal 1.5 / 1.8 / 2.048 / 2.5 V or external (AREF)'],
      ['DAC', '2 outputs on A0 (DAC0) and A1 (DAC1), 8–12 bit'],
      ['Power pins', '3V3 out, 5V (5V_SYS in/out), VIN 7–24 V in'],
    ],
    warn: 'A0–A5 in analog mode are not 5 V-tolerant. Keep analog inputs between 0 V and ≈3.3 V.',
    src: 'DS §3.1, §9.7 · UM “Analog Pins”',
  },
  jspi: {
    cat: 'io', name: 'JSPI header', ref: 'JSPI1 · 2 × 3 pins', tag: '3.3 V SPI',
    summary: 'A dedicated SPI header (MISO, SCK, MOSI) plus RESET, 5 V and GND, in the classic ICSP-style layout.',
    simple: [
      '6-pin SPI header (MISO, SCK, MOSI, RESET, 5V, GND).',
      'Shares the MCU’s SPI2 with D10–D13 — use one or the other.'
    ],
    specs: [['Pin 1', 'MISO (PC2)'], ['Pin 2', '+5V (5V_SYS)'], ['Pin 3', 'SCK (PD1)'], ['Pin 4', 'MOSI (PC3)'], ['Pin 5', 'RESET (MCU_NRST)'], ['Pin 6', 'GND']],
    points: ['Chip-select comes from a GPIO on JDIGITAL or JMISC.', 'It shares the MCU’s SPI2 peripheral with the JDIGITAL SPI pins — they cannot be used as SPI at the same time.'],
    src: 'DS §9.4 · Full pinout',
  },
  qwiic: {
    cat: 'io', name: 'Qwiic connector', ref: 'QWIIC1 · 4 pins', tag: 'Plug-and-play I²C',
    summary: 'A polarised 4-pin I²C connector for Qwiic sensors and Arduino Modulino® nodes — no soldering or breadboard needed.',
    simple: [
      'Polarized 4-pin 3.3V I²C plug-and-play connector.',
      'Daisy-chain compatible sensors without breadboard wiring.'
    ],
    specs: [['Pin 1', 'GND'], ['Pin 2', '+3V3 OUT'], ['Pin 3', 'SDA — PD13 (I2C4)'], ['Pin 4', 'SCL — PD12 (I2C4)'], ['In code', 'Wire1 (not Wire)']],
    warn: 'The Qwiic connector is 3.3 V only.',
    src: 'DS §9.3 · UM “Qwiic”',
  },
  jctl: {
    cat: 'io', name: 'JCTL header', ref: 'JCTL1 · 2 × 5 pins', tag: '1.8 V system control',
    summary: 'System-control pins of the Qualcomm processor: the Linux debug console (SE4 UART), boot-mode and reset lines.',
    simple: [
      '1.8V system control and Linux debug console header.',
      'Linux debug console (1.8 V UART) plus boot and reset lines.'
    ],
    specs: [
      ['Console UART', 'SOC_SE4_TX / SOC_SE4_RX (the system console)'],
      ['Other pins', 'USB_BOOT, PMIC_RESET, VBUS_DISABLE, VOL_UP, VOL_DOWN, +1V8 OUT, GND'],
      ['Logic level', '1.8 V'],
    ],
    points: ['The SE4 UART is the system console (shell). It is separate from application UARTs and should not be used for your own I/O.'],
    warn: '1.8 V logic only. Use a 1.8 V USB-to-TTL adapter — a 3.3 V or 5 V adapter can damage the board.',
    src: 'DS §9.5 · UM “Hardware Debug UART Interface”',
  },
  jmisc: {
    cat: 'bottom', name: 'JMISC high-speed connector (B1)', ref: 'JMISC1 (bottom) · 60 pins', tag: 'Mixed 1.8 V / 3.3 V',
    summary: 'A bottom connector for UNO Q carrier boards. It mixes 3.3 V MCU signals, 1.8 V MPU GPIOs, analog audio and power rails.',
    simple: [
      'Bottom 60-pin high-speed mezzanine connector.',
      'Expands MCU signals, analog audio, and camera interfaces.'
    ],
    specs: [
      ['MCU (3.3 V)', 'PSSI parallel camera, SDMMC1, TRACE, I²C4, MCO/CRS_SYNC, OPAMP1'],
      ['Audio (analog)', 'Mic2, headphone L/R + REF, line out, earpiece, headset detect'],
      ['MPU (1.8 V)', 'SoC GPIO lines (interface-dedicated)'],
      ['Power', '+3V3, +5V_SYS, +1V8, VBAT, VCOIN, GND'],
    ],
    warn: 'Check the voltage domain of every pin: MCU pins are 3.3 V, MPU GPIOs are 1.8 V.',
    src: 'DS §2.2.3, §9.1',
  },
  jmedia: {
    cat: 'bottom', name: 'JMEDIA high-speed connector (B2)', ref: 'JMEDIA1 (bottom) · 60 pins', tag: 'Cameras & display (1.8 V)',
    summary: 'A bottom connector for carriers with MIPI cameras and displays.',
    simple: [
      'Bottom 60-pin connector for displays and dual cameras.',
      'Provides 4-lane MIPI-DSI and MIPI-CSI camera channels.'
    ],
    specs: [
      ['Display', '4-lane MIPI-DSI'],
      ['Cameras', 'MIPI-CSI-2 (CSI0 and CSI1 lanes)'],
      ['Camera control', 'CCI I²C buses and camera clocks MCLK0/1 (1.8 V)'],
      ['Power', 'VIN (7–24 V input), +3V3 out, GND'],
    ],
    points: ['The DSI display output is shared with USB-C DisplayPort — only one can be active at a time.'],
    src: 'DS §2.2.3, §9.2',
  },
  holes: {
    cat: 'mech', name: 'Mounting holes & outline', ref: '4 × Ø 3.2 mm', tag: 'UNO form factor',
    summary: 'The board measures 68.58 mm × 53.34 mm. Outline and mounting holes follow the classic UNO form factor, so UNO shields and cases fit.',
    simple: [
      'Four standard M3 mounting holes in classic UNO layout.',
      'Secures board to standard enclosures, shields, and robot chassis.'
    ],
    points: ['Bottom-side parts are kept below 2 mm so the board can stack onto carrier boards.'],
    src: 'DS §12 · official drill file',
  },
};

export const BOARD_FACTS = {
  name: 'Arduino® UNO Q',
  skus: 'ABX00162 (2 GB RAM / 16 GB eMMC) · ABX00173 (4 GB RAM / 32 GB eMMC)',
  size: '68.58 mm × 53.34 mm',
  temp: '−10 °C to 60 °C ambient',
};

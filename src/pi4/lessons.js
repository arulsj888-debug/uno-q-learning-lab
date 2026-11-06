// Raspberry Pi 4 Model B lessons. Every fact is from an official source listed in SRC_PI (see docs/pi4-source-notes.md).
// Programs are the official examples from the Raspberry Pi documentation ("Use GPIO from Python") / GPIO Zero recipes.
// Circuit references: physical header pins 'p1'…'p40' (pin 11 = GPIO17), breadboard holes a–j / 1–30.

export const SRC_PI = {
  ds: { t: 'Raspberry Pi 4 Model B datasheet, Release 1.1 (2024)', u: 'https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-datasheet.pdf' },
  mech: { t: 'Raspberry Pi 4 Model B mechanical drawing', u: 'https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-mechanical-drawing.pdf' },
  gpio: { t: 'Raspberry Pi documentation — 40-pin GPIO header', u: 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#gpio' },
  setup: { t: 'Raspberry Pi documentation — Getting started (set up, install an OS, configuration)', u: 'https://www.raspberrypi.com/documentation/computers/getting-started.html' },
  power: { t: 'Raspberry Pi documentation — Power supply', u: 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#power-supply' },
  leds: { t: 'Raspberry Pi documentation — LED warning flash codes', u: 'https://www.raspberrypi.com/documentation/computers/configuration.html#led-warning-flash-codes' },
  bcm: { t: 'Raspberry Pi documentation — BCM2711', u: 'https://www.raspberrypi.com/documentation/computers/processors.html#bcm2711' },
  usegpio: { t: 'Raspberry Pi documentation — Use GPIO from Python', u: 'https://www.raspberrypi.com/documentation/computers/os.html#use-gpio-from-python' },
  python: { t: 'Raspberry Pi documentation — Use Python on a Raspberry Pi', u: 'https://www.raspberrypi.com/documentation/computers/os.html#use-python-on-a-raspberry-pi' },
  gpiozero: { t: 'GPIO Zero documentation (recipes, LED, Button, pin numbering)', u: 'https://gpiozero.readthedocs.io/' },
};

// ------------------------------------------------------------------ programs (official examples, unchanged)
export const PI_BLINK = `from gpiozero import LED
from time import sleep

led = LED(17)

while True:
    led.on()
    sleep(1)
    led.off()
    sleep(1)`;

export const PI_BUTTON = `from gpiozero import Button
from time import sleep

button = Button(2)

while True:
    if button.is_pressed:
        print("Pressed")
    else:
        print("Released")
    sleep(1)`;

export const PI_BUTTON_LED = `from gpiozero import LED, Button

led = LED(17)
button = Button(2)

while True:
    if button.is_pressed:
        led.on()
    else:
        led.off()`;

// ------------------------------------------------------------------ circuits
// LED: GPIO17 (pin 11) -> j8 | 220 ohm h8–h12 | LED anode g12, cathode g13 | GND (pin 9) -> j13
export const PI_LED_PARTS = [
  { id: 'r1', type: 'resistor', a: 'h8', b: 'h12' },
  { id: 'led1', type: 'led', anode: 'g12', cathode: 'g13' },
  { id: 'w1', type: 'fwire', from: 'p11', to: 'j8', color: 'yellow', lift: 26 },
  { id: 'w2', type: 'fwire', from: 'p9', to: 'j13', color: 'black', lift: 34 },
];
const LED_IDS = PI_LED_PARTS.map(d => d.id);
// Button between GPIO2 (pin 3) and GND (pin 6): legs e18 f18 e20 f20, wires to j18 and j20
export const PI_BTN_PARTS = [
  ...PI_LED_PARTS,
  { id: 'btn1', type: 'button', col: 18 },
  { id: 'w3', type: 'fwire', from: 'p3', to: 'j18', color: 'blue', lift: 42 },
  { id: 'w4', type: 'fwire', from: 'p6', to: 'j20', color: 'black', lift: 50 },
];
const BTN_IDS = PI_BTN_PARTS.map(d => d.id);
const IO_LED = { kind: 'led', item: 'led1', needs: LED_IDS };
const IO_BTN = { kind: 'button', item: 'btn1', needs: BTN_IDS };

export const PI_MODULES = { 1: 'Module 1 — Getting started', 2: 'Module 2 — GPIO with Python' };

export const PI_LESSONS = [
  // ================================================================== P1
  {
    id: 'p1', num: 1, module: 1, title: 'Meet the Raspberry Pi 4', level: 'Start here', time: '10 min',
    goal: 'Know every part of the Raspberry Pi 4 Model B and what it is for.',
    hardware: ['Raspberry Pi 4 Model B'],
    steps: [
      {
        title: 'A complete computer on one board', view: 'home',
        body: `<p>The Raspberry Pi 4 is a <b>full computer</b>: it runs an operating system (Raspberry Pi OS, a Linux), has a desktop, USB ports for a keyboard and mouse, screens, network — and <b>40 pins</b> for your own electronics.</p>
        <table class="kv"><tr><th></th><th>Raspberry Pi 4</th></tr><tr><td>Size</td><td>85 × 56 mm</td></tr><tr><td>Processor</td><td>Broadcom BCM2711, 4 × Cortex-A72, 1.5 GHz</td></tr><tr><td>Memory</td><td>1, 2, 4 or 8 GB LPDDR4</td></tr><tr><td>Programs</td><td>written in <b>Python</b> (and many other languages)</td></tr></table>
        <p class="tip">Click any part on the board to read about it. The next steps visit them one by one.</p>`,
      },
      {
        title: 'The brain: processor and memory', focus: ['soc', 'ram'],
        body: `<p>The <b>BCM2711</b> under the silver heat spreader is the processor (SoC = system on a chip). Next to it is the <b>LPDDR4 memory</b>.</p>
        <ul><li>4 cores, 64-bit, 1.5 GHz; graphics: VideoCore VI.</li><li>The processor slows itself down (throttles) so it never gets hotter than <b>85 °C</b>.</li></ul>
        <p class="tip">Memory is erased when the power goes off. Your files are kept on the <b>microSD card</b>.</p>`,
      },
      {
        title: 'USB, network and wireless', focus: ['usb3', 'usb2', 'ethernet', 'wireless'],
        body: `<ul><li><b>2 × USB 3.0</b> (blue inside) — fast devices like drives.</li><li><b>2 × USB 2.0</b> (black inside) — keyboard and mouse.</li>
        <li><b>Gigabit Ethernet</b> — wired network.</li><li><b>Wi-Fi</b> (802.11ac) and <b>Bluetooth 5.0</b> — under the metal shield.</li></ul>
        <p class="sim">The four USB ports share one power limit: about 1.1 A (datasheet) / 1.2 A (documentation) in total.</p>`,
      },
      {
        title: 'Screens and sound', focus: ['hdmi0', 'hdmi1', 'av'],
        body: `<ul><li><b>Two micro-HDMI</b> ports: up to two monitors, up to 4K each. Your <b>main monitor goes in HDMI0</b> (next to the power socket).</li>
        <li>The <b>A/V jack</b> (3.5 mm) gives analogue audio for headphones and composite video.</li></ul>`,
      },
      {
        title: 'Camera and display connectors', focus: ['camera', 'display'],
        body: `<p>Two flat-cable connectors: <b>CAMERA</b> (MIPI CSI) for a Raspberry Pi camera module and <b>DISPLAY</b> (MIPI DSI) for a Raspberry Pi touch display. You lift the black latch, slide the ribbon in, and press the latch down.</p>`,
      },
      {
        title: 'Power and the two LEDs', focus: ['usbc', 'ledpwr', 'ledact'],
        body: `<ul><li><b>USB-C</b> is only for power: <b>5 V, 3 A</b> (the official 15 W supply).</li><li><b>Red PWR LED</b>: on = the 5 V supply is stable; off or flickering = undervoltage (supply too weak).</li>
        <li><b>Green ACT LED</b>: flashes when the microSD card is used.</li></ul>
        <p class="tip">There is <b>no power button</b>: the Raspberry Pi 4 starts as soon as power is connected.</p>`,
      },
      {
        title: 'Underneath: the microSD slot', focus: 'sdcard', side: 'bottom',
        body: `<p>Turn the board over: the <b>microSD card slot</b> is on the underside. The card holds the operating system — the Raspberry Pi’s “hard disk”.</p>`,
      },
      {
        title: 'The 40-pin GPIO header', focus: 'gpio',
        body: `<p>Two rows of 20 pins along the edge: <b>GPIO</b> pins for LEDs, buttons, sensors and add-on boards (HATs), plus power (3V3, 5V) and ground (GND).</p>
        <p class="warn">All GPIO pins work at <b>3.3 V</b> and are <b>not 5 V tolerant</b>. You will learn the safe rules in Lesson 3.</p>`,
      },
      {
        title: 'Summary', view: 'home',
        body: `<ul><li>A full Linux computer: BCM2711 processor, 1–8 GB LPDDR4.</li><li>USB 3.0 (blue) / 2.0 (black), Gigabit Ethernet, Wi-Fi, Bluetooth.</li><li>2 × micro-HDMI (main screen on HDMI0), A/V jack, camera and display connectors.</li><li>USB-C power 5 V / 3 A; red PWR and green ACT LEDs; microSD underneath.</li><li>40-pin GPIO header, 3.3 V only.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Which port is the Raspberry Pi 4 powered from?', a: ['micro-HDMI', 'USB-C', 'USB 3.0', 'Ethernet'], c: 1, why: 'USB-C is the power input; 5 V, 3 A is recommended.' },
      { q: 'Where is the operating system stored?', a: ['In the RAM', 'On the microSD card', 'In the GPIO header', 'In the HDMI port'], c: 1, why: 'The microSD card is the boot media; RAM is erased when the power goes off.' },
      { q: 'What do the blue USB ports offer?', a: ['Power only', 'USB 3.0 (faster)', 'Audio', 'Video'], c: 1, why: 'Blue = USB 3.0, black = USB 2.0.' },
      { q: 'What does the red PWR LED tell you?', a: ['Wi-Fi is on', 'The 5 V supply is stable', 'The microSD is being written', 'A program is running'], c: 1, why: 'Off or flickering means undervoltage.' },
      { q: 'At what voltage do the GPIO pins work?', a: ['5 V', '3.3 V', '12 V', '1.8 V'], c: 1, why: 'GPIO is 3.3 V and not 5 V tolerant.' },
    ],
    sources: [SRC_PI.ds, SRC_PI.bcm, SRC_PI.setup, SRC_PI.leds, SRC_PI.gpio],
  },

  // ================================================================== P2
  {
    id: 'p2', num: 2, module: 1, title: 'Set up: microSD, monitor, keyboard and power', level: 'Beginner', time: '20 min',
    goal: 'Prepare the microSD card with Raspberry Pi Imager and connect everything in the right order.',
    hardware: ['Raspberry Pi 4 Model B', 'microSD card (32 GB or more)', 'USB-C power supply 5 V / 3 A', 'micro-HDMI to HDMI cable + monitor', 'USB keyboard and mouse', 'Another computer with an SD card reader'],
    steps: [
      {
        title: 'What you need', view: 'home', acc: [], power: false,
        body: `<ul><li>A <b>microSD card</b> — at least <b>32 GB</b> for Raspberry Pi OS (8 GB is enough for the Lite version without desktop).</li>
        <li>A <b>USB-C power supply, 5 V / 3 A</b> — Raspberry Pi recommends its official 15 W supply.</li><li>A <b>micro-HDMI to HDMI cable</b> and a monitor.</li><li>A USB <b>keyboard</b> and <b>mouse</b>.</li><li>Another computer to prepare the card.</li></ul>`,
      },
      {
        title: 'Install the OS with Raspberry Pi Imager', view: 'home', acc: [],
        body: `<p>On your other computer, install <b>Raspberry Pi Imager</b> (raspberrypi.com/software) and put the microSD card in its card reader. Then:</p>
        <ol><li><b>Device</b>: choose <i>Raspberry Pi 4</i>.</li><li><b>OS</b>: choose Raspberry Pi OS (the recommended one is at the top).</li><li><b>Storage</b>: choose your microSD card.</li>
        <li><b>Customisation</b> (recommended): hostname, time zone, <b>username and password</b>, Wi-Fi, SSH.</li><li>Write the card.</li></ol>
        <p class="warn">Writing erases the card. Keep <b>“Exclude system drives”</b> selected so you cannot erase your computer’s own disk by mistake.</p>`,
      },
      {
        title: 'Insert the microSD card', focus: 'sdcard', side: 'bottom', acc: ['sd'],
        body: `<p>Slide the card into the slot on the <b>underside</b>, with the <b>label facing away</b> from the Raspberry Pi.</p>
        <p>On the Raspberry Pi 4 the card <b>slides in and stops without a click</b>. To remove it later, gently pull it out — but only after shutting down.</p>`,
      },
      {
        title: 'Connect the monitor', view: 'pifront', acc: ['sd', 'hdmi'],
        body: `<p>Plug the small end of the micro-HDMI cable into <b>HDMI0</b> (the one next to the power socket) and the big end into the monitor.</p>
        <p class="tip">If the monitor has several HDMI inputs, select the input you plugged into.</p>`,
      },
      {
        title: 'Keyboard and mouse', view: 'piports', acc: ['sd', 'hdmi', 'kbd', 'mouse'],
        body: `<p>Plug the keyboard and the mouse into the <b>black USB 2.0 ports</b>. That keeps the blue USB 3.0 ports free for fast devices.</p>
        <p class="tip">Connect USB devices <b>before</b> switching on: plugging in a power-hungry device while running can make the voltage drop and the board restart.</p>`,
      },
      {
        title: 'Power last', view: 'home', acc: ['sd', 'hdmi', 'kbd', 'mouse'], power: true, action: 'piboot',
        body: `<p>Power is always the <b>last</b> connection. Plug in the USB-C supply — the Raspberry Pi starts immediately (it has no power button).</p>
        <ul><li><b>Red PWR LED</b> on: the supply is good.</li><li><b>Green ACT LED</b> flickers: the microSD card is being read.</li></ul>
        <p class="sim">The flicker of the ACT LED is simulated here.</p>`,
      },
      {
        title: 'First boot', view: 'home', acc: ['sd', 'hdmi', 'kbd', 'mouse'],
        body: `<p>If you did the customisation in Imager, Raspberry Pi OS starts with your settings. If you skipped it, a <b>configuration wizard</b> asks for the same information (country, user, password, Wi-Fi) on the first boot.</p>
        <p class="tip">If it does not boot within about 5 minutes, look at the green ACT LED: its flash pattern tells you what is wrong.</p>`,
      },
      {
        title: 'Shut down safely', view: 'home', acc: ['sd', 'hdmi', 'kbd', 'mouse'],
        body: `<p>Never just pull the plug while the system is running — the microSD card may be in the middle of writing. Shut down from the menu, or in a Terminal type:</p>
        <pre class="tree">sudo poweroff</pre>
        <p>When the green ACT LED shows a <b>series of short flashes</b>, it is safe to unplug the power cable.</p>`,
      },
      {
        title: 'Summary', view: 'home', acc: ['sd', 'hdmi', 'kbd', 'mouse'],
        body: `<ol><li>Prepare the card with <b>Raspberry Pi Imager</b> (Device → OS → Storage → Customisation).</li><li>Insert it underneath, label away from the board.</li><li>Monitor in <b>HDMI0</b>, keyboard and mouse in the <b>black</b> USB ports.</li><li><b>Power last</b>; shut down with <code>sudo poweroff</code> before unplugging.</li></ol>`,
      },
    ],
    quiz: [
      { q: 'Which tool prepares the microSD card?', a: ['Thonny', 'Raspberry Pi Imager', 'The Terminal on the Pi', 'Arduino App Lab'], c: 1, why: 'Raspberry Pi Imager writes the OS image to the card on another computer.' },
      { q: 'How is the microSD card inserted?', a: ['Label facing the board', 'Label facing away from the board', 'Either way', 'Into the USB port'], c: 1, why: 'Official instructions: label facing away from the Raspberry Pi.' },
      { q: 'Which HDMI port is for the main monitor?', a: ['HDMI0', 'HDMI1', 'Either', 'The USB-C port'], c: 0, why: 'Plug your primary monitor into HDMI0.' },
      { q: 'What do you connect last?', a: ['The keyboard', 'The monitor', 'The power supply', 'The microSD card'], c: 2, why: 'The Raspberry Pi starts as soon as power is connected, so power comes last.' },
      { q: 'Which command shuts the Raspberry Pi down from the Terminal?', a: ['sudo poweroff', 'exit', 'shutdown.exe', 'sudo start'], c: 0, why: 'sudo poweroff shuts the system down; sudo reboot restarts it.' },
    ],
    sources: [SRC_PI.setup, SRC_PI.power, SRC_PI.leds, SRC_PI.ds],
  },

  // ================================================================== P3
  {
    id: 'p3', num: 3, module: 1, title: 'The 40-pin GPIO header and 3.3 V safety', level: 'Beginner', time: '15 min',
    goal: 'Find any pin, tell physical pin numbers from GPIO numbers, and know the electrical limits.',
    hardware: ['Raspberry Pi 4 Model B'],
    steps: [
      {
        title: 'Two rows of 20 pins', focus: 'gpio',
        body: `<p>The header has <b>40 pins</b> at 2.54 mm spacing: <b>26 GPIO</b> pins, <b>2 ID pins</b> (reserved), <b>4 power</b> pins and <b>8 ground</b> pins.</p>
        <p><b>Pin 1</b> is at the end near the microSD/DISPLAY side, in the <b>inner row</b>. Odd numbers (1, 3, 5 … 39) run along the inner row, even numbers (2, 4 … 40) along the outer edge.</p>
        <p class="tip">Under the board, pin 1 has a <b>square</b> solder pad — the others are round.</p>`,
      },
      {
        title: 'Power and ground pins', focus: 'gpio', pins: ['p1', 'p17', 'p2', 'p4', 'p6', 'p9', 'p14', 'p20', 'p25', 'p30', 'p34', 'p39'],
        body: `<table class="kv"><tr><th>Pins</th><th>What</th></tr><tr><td>1, 17</td><td><b>3V3</b> — 3.3 V for small parts</td></tr><tr><td>2, 4</td><td><b>5V</b> — 5 V power</td></tr><tr><td>6, 9, 14, 20, 25, 30, 34, 39</td><td><b>GND</b> — 0 V</td></tr></table>
        <p class="warn">Only the 5V pins carry 5 V. Never let a <b>5V pin touch a GPIO pin</b> — 5 V on a GPIO pin can permanently damage the processor.</p>`,
      },
      {
        title: 'Physical pin number vs GPIO number', focus: 'gpio', pins: ['p11', 'p3', 'p12'],
        body: `<p>Every pin has a <b>physical number</b> (its place, 1–40). The GPIO pins also have a <b>GPIO number</b> (the processor’s name). They are <b>not the same</b>:</p>
        <table class="kv"><tr><th>Physical pin</th><th>GPIO number</th></tr><tr><td>3</td><td>GPIO2</td></tr><tr><td>11</td><td>GPIO17</td></tr><tr><td>12</td><td>GPIO18</td></tr></table>
        <p>Python code (the GPIO Zero library) uses the <b>GPIO number</b>: <code>LED(17)</code> means GPIO17 = <b>physical pin 11</b>. (You could also write <code>LED("BOARD11")</code>.)</p>
        <p class="tip">On the Raspberry Pi, the Terminal command <code>pinout</code> prints this map for your board.</p>`,
      },
      {
        title: '3.3 V only — and how much current', focus: 'gpio',
        body: `<ul><li>An output pin gives <b>3.3 V</b> (HIGH) or <b>0 V</b> (LOW).</li><li>An input reads HIGH at 3.3 V and LOW at 0 V.</li>
        <li>One pin can supply at most <b>16 mA</b>; all GPIO pins together at most <b>50 mA</b>.</li></ul>
        <p class="warn">GPIO pins are <b>not 5 V tolerant</b>. Never connect 5 V to a GPIO pin. Always use a <b>current-limiting resistor</b> with an LED, and never connect a motor directly to a pin.</p>`,
      },
      {
        title: 'Special pins', focus: 'gpio', pins: ['p3', 'p5', 'p27', 'p28'],
        body: `<ul><li><b>GPIO2 / GPIO3</b> (pins 3 and 5) are the I²C pins and have <b>1.8 kΩ pull-up resistors</b> to 3.3 V on the board.</li>
        <li><b>Pins 27 and 28</b> (ID_SD, ID_SC) are reserved for the ID memory of add-on boards (HATs) — leave them unconnected.</li>
        <li>Some pins also have special jobs: UART (pins 8, 10), SPI (19, 21, 23, 24, 26), PWM (12, 32, 33, 35).</li></ul>
        <p class="tip">Click any pin on the 3D board to see all its functions.</p>`,
      },
      {
        title: 'Summary', focus: 'gpio',
        body: `<ul><li>40 pins; pin 1 = inner row, microSD end (square pad).</li><li>3V3: pins 1, 17 · 5V: 2, 4 · GND: 6, 9, 14, 20, 25, 30, 34, 39.</li><li>Code uses <b>GPIO numbers</b>: GPIO17 = pin 11.</li><li>3.3 V only, max 16 mA per pin, 50 mA total.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'LED(17) in GPIO Zero uses which physical pin?', a: ['Pin 17', 'Pin 11', 'Pin 1', 'Pin 27'], c: 1, why: 'GPIO Zero uses GPIO (BCM) numbers; GPIO17 is physical pin 11.' },
      { q: 'Which pins are 5 V?', a: ['1 and 17', '2 and 4', '6 and 9', '27 and 28'], c: 1, why: 'Pins 2 and 4 are 5V; pins 1 and 17 are 3V3.' },
      { q: 'What may you connect to a GPIO pin?', a: ['5 V from the 5V pin', 'Signals of 0–3.3 V', 'A motor directly', '12 V'], c: 1, why: 'GPIO is 3.3 V and not 5 V tolerant; motors need a driver.' },
      { q: 'Maximum current from one GPIO pin?', a: ['1 mA', '16 mA', '500 mA', '3 A'], c: 1, why: 'Up to 16 mA per pin, 50 mA for all GPIO pins together.' },
      { q: 'What should you do with pins 27 and 28?', a: ['Use them for LEDs', 'Leave them unconnected (HAT ID EEPROM)', 'Connect them to 5V', 'Connect them to GND'], c: 1, why: 'They are reserved for the HAT ID EEPROM.' },
    ],
    sources: [SRC_PI.gpio, SRC_PI.ds, SRC_PI.gpiozero],
  },

  // ================================================================== P4
  {
    id: 'p4', num: 4, module: 2, title: 'Blink an LED with Python', level: 'Beginner', time: '20 min',
    goal: 'Wire an LED to GPIO17 on a breadboard and make it blink with a Python program.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Breadboard', '5 mm red LED', '220 Ω resistor', '2 × female–male jumper wires'],
    code: PI_BLINK, file: 'blink.py', program: 'pi_blink', fast: true,
    circuit: PI_LED_PARTS, io: { p11: IO_LED }, led: true,
    explain: {
      1: 'Take the <b>LED</b> class from the <b>GPIO Zero</b> library (installed with Raspberry Pi OS).',
      2: 'Take the <b>sleep</b> function, which waits a number of seconds.',
      4: '<b>LED(17)</b>: an LED on <b>GPIO17</b> — physical <b>pin 11</b>. GPIO Zero uses GPIO numbers. The LED starts off.',
      6: '<code>while True:</code> repeats the indented lines below forever.',
      7: '<b>led.on()</b> sets GPIO17 to 3.3 V → current flows → the LED lights.',
      8: 'Wait 1 second.',
      9: '<b>led.off()</b> sets GPIO17 to 0 V → the LED goes out.',
      10: 'Wait 1 second, then the loop starts again.',
    },
    steps: [
      {
        title: 'What we build', view: 'pibench', have: PI_LED_PARTS.map(d => d.id), power: false,
        body: `<p>Our first program on the Raspberry Pi: an LED that turns on and off every second.</p>
        <div class="ptree"><div class="pt-row"><span class="pt in">GPIO17 (pin 11)</span></div><div class="pt-arrow">↓</div><div class="pt-row"><span class="pt">220 Ω resistor</span></div><div class="pt-arrow">↓</div><div class="pt-row"><span class="pt">LED</span></div><div class="pt-arrow">↓</div><div class="pt-row"><span class="pt bus">GND (pin 9)</span></div></div>`,
      },
      {
        title: 'Why a 220 Ω resistor?', view: 'pibench', have: [],
        body: `<p>Without a resistor, the LED would take too much current. With 3.3 V from the pin and about 2.0 V across a red LED, the resistor sees about 1.3 V:</p>
        <p class="formula">I = (3.3 V − 2.0 V) ÷ 220 Ω ≈ <b>5.9 mA</b></p>
        <p>That is well below the <b>16 mA</b> a GPIO pin may supply, and below its default drive strength of 8 mA (datasheet).</p>`,
      },
      {
        title: 'Step 1 — resistor and LED', view: 'pibb', have: ['r1', 'led1'], power: false, holes: ['h8', 'h12', 'g12 · anode (+)', 'g13 · cathode (−)'],
        body: `<ul><li><b>220 Ω resistor</b> (red-red-brown-gold) from <b>h8</b> to <b>h12</b>.</li><li><b>LED</b>: long leg (anode, +) in <b>g12</b>, short leg (cathode, −) in <b>g13</b>.</li></ul>
        <p class="tip">Holes f–j of the same column are connected inside the breadboard, so g12 meets the resistor at h12.</p>`,
      },
      {
        title: 'Step 2 — jumper wires to the header', view: 'pibench', have: PI_LED_PARTS.map(d => d.id), pins: ['p11', 'p9'],
        body: `<p>Use <b>female–male</b> jumper wires: the female end slides over the Raspberry Pi pin, the male end goes into the breadboard.</p>
        <ul><li>Yellow: <b>pin 11 (GPIO17) → j8</b></li><li>Black: <b>pin 9 (GND) → j13</b></li></ul>
        <p class="warn">Wire with the power <b>off</b>, and count the pins carefully from pin 1.</p>`,
      },
      { title: 'The program', view: 'pibench', showCode: true, power: true, body: `<p>This is the official example from the Raspberry Pi documentation. Click any line in the code panel to see what it does.</p><p class="tip">On the Raspberry Pi, type it into <b>Thonny</b> (the recommended Python editor) and press <b>Run</b>.</p>` },
      {
        title: 'Run it', view: 'pibench', showCode: true, power: true, action: 'run',
        body: `<p>Watch the highlighted line, the pin state and the LED on the breadboard: <b>on</b> for 1 s, <b>off</b> for 1 s.</p>
        <p class="sim">Simulated. On the real board, Thonny runs the program until you press Stop.</p>`,
      },
      {
        title: 'Summary', view: 'pibench', power: true,
        body: `<ul><li><code>from gpiozero import LED</code>, then <code>LED(17)</code> = GPIO17 = pin 11.</li><li><code>led.on()</code> / <code>led.off()</code> switch 3.3 V / 0 V; <code>sleep(1)</code> waits.</li><li>Always a resistor with an LED (220 Ω → ≈ 5.9 mA).</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Which physical pin is LED(17)?', a: ['17', '11', '9', '1'], c: 1, why: 'GPIO17 is physical pin 11.' },
      { q: 'Which leg of the LED goes toward GND?', a: ['The long leg (anode)', 'The short leg (cathode)', 'Either', 'Both'], c: 1, why: 'Cathode (short leg, flat side) to ground; anode via the resistor to the GPIO pin.' },
      { q: 'Current through LED and 220 Ω at 3.3 V (LED ≈ 2.0 V)?', a: ['0.6 mA', '5.9 mA', '59 mA', '150 mA'], c: 1, why: '(3.3 − 2.0) / 220 ≈ 5.9 mA.' },
      { q: 'What does sleep(1) do?', a: ['Turns the LED off', 'Waits one second', 'Shuts down the Pi', 'Repeats the loop'], c: 1, why: 'sleep from the time module waits the given number of seconds.' },
    ],
    sources: [SRC_PI.usegpio, SRC_PI.gpiozero, SRC_PI.gpio, SRC_PI.ds, SRC_PI.python],
  },

  // ================================================================== P5
  {
    id: 'p5', num: 5, module: 2, title: 'Read a push button', level: 'Beginner', time: '20 min',
    goal: 'Wire a push button to GPIO2 and read it in Python.',
    hardware: ['Lesson 4 circuit', 'Push button', '2 × female–male jumper wires'],
    code: PI_BUTTON, file: 'button.py', program: 'pi_button', fast: true, widgets: ['button'],
    circuit: PI_BTN_PARTS, io: { p11: IO_LED, p3: IO_BTN }, led: true,
    explain: {
      1: 'Take the <b>Button</b> class from GPIO Zero.',
      2: 'Take <b>sleep</b>.',
      4: '<b>Button(2)</b>: a button on <b>GPIO2</b> = physical <b>pin 3</b>. By default GPIO Zero turns on a <b>pull-up</b>: the pin reads HIGH until the button connects it to GND.',
      6: 'Repeat forever.',
      7: '<b>button.is_pressed</b> is True while the button is held down (pin pulled LOW).',
      8: 'Print “Pressed” in the Shell.',
      9: 'Otherwise …',
      10: '… print “Released”.',
      11: 'Wait 1 second before checking again.',
    },
    steps: [
      {
        title: 'What we build', view: 'pibench', have: BTN_IDS, power: false,
        body: `<p>A push button between <b>GPIO2 (pin 3)</b> and <b>GND (pin 6)</b>. The program prints whether it is pressed.</p>
        <div class="ptree"><div class="pt-row"><span class="pt bus">3.3 V — pull-up</span></div><div class="pt-arrow">│</div><div class="pt-row"><span class="pt in">GPIO2 (pin 3)</span></div><div class="pt-arrow">│ button</div><div class="pt-row"><span class="pt">GND (pin 6)</span></div></div>
        <p>Released: the pull-up holds the pin at 3.3 V (HIGH). Pressed: the button connects the pin to GND (LOW).</p>`,
      },
      {
        title: 'Step 1 — the button', view: 'pibb', have: [...LED_IDS, 'btn1'], power: false, holes: ['e18', 'f18', 'e20', 'f20'],
        body: `<p>Push the button over the middle gap: legs in <b>e18, e20, f18, f20</b>. Pressing it connects column 18 to column 20.</p>`,
      },
      {
        title: 'Step 2 — wires', view: 'pibench', have: BTN_IDS, pins: ['p3', 'p6'],
        body: `<ul><li>Blue: <b>pin 3 (GPIO2) → j18</b></li><li>Black: <b>pin 6 (GND) → j20</b></li></ul>
        <p class="tip">No resistor needed here: GPIO2 already has a 1.8 kΩ pull-up resistor to 3.3 V on the board, and GPIO Zero also enables the internal pull-up.</p>`,
      },
      { title: 'The program', view: 'pibench', showCode: true, power: true, body: `<p>The official button example. Click a line to read about it.</p>` },
      {
        title: 'Run it', view: 'pibench', showCode: true, power: true, action: 'run',
        body: `<p>Every second the program prints <b>Released</b>. Hold the button — with <b>“Hold to press”</b> in the panel or by clicking the 3D button — and it prints <b>Pressed</b>.</p>
        <p class="sim">Simulated. Because of <code>sleep(1)</code>, a very short press between two checks can be missed.</p>`,
      },
      {
        title: 'Summary', view: 'pibench', power: true,
        body: `<ul><li><code>Button(2)</code> = GPIO2 = pin 3; wire the other side to GND.</li><li>Pull-up: released = HIGH, pressed = LOW → <code>is_pressed</code> is True.</li><li>The loop checks once per second.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Button(2) is on which physical pin?', a: ['2', '3', '5', '6'], c: 1, why: 'GPIO2 is physical pin 3.' },
      { q: 'With the pull-up, what does the pin read while the button is released?', a: ['LOW', 'HIGH', 'Nothing', '5 V'], c: 1, why: 'The pull-up holds it at 3.3 V (HIGH).' },
      { q: 'What is button.is_pressed while you hold the button?', a: ['True', 'False', '0 V', 'GPIO2'], c: 0, why: 'Pressed connects the pin to GND; GPIO Zero reports is_pressed = True.' },
      { q: 'Why can a very short press be missed here?', a: ['The button is broken', 'The program only checks once per second', 'GPIO2 is an output', 'The resistor is too big'], c: 1, why: 'sleep(1) means one check per second.' },
    ],
    sources: [SRC_PI.usegpio, SRC_PI.gpiozero, SRC_PI.gpio],
  },

  // ================================================================== P6
  {
    id: 'p6', num: 6, module: 2, title: 'The button controls the LED', level: 'Beginner', time: '15 min',
    goal: 'Combine input and output: the LED is on exactly while the button is pressed.',
    hardware: ['Lesson 5 circuit (LED on GPIO17, button on GPIO2)'],
    code: PI_BUTTON_LED, file: 'button_led.py', program: 'pi_button_led', widgets: ['button'],
    circuit: PI_BTN_PARTS, io: { p11: IO_LED, p3: IO_BTN }, led: true,
    explain: {
      1: 'Take both classes, <b>LED</b> and <b>Button</b>.',
      3: 'The LED on GPIO17 (pin 11).',
      4: 'The button on GPIO2 (pin 3).',
      6: 'Repeat forever — and very fast, because there is no sleep.',
      7: 'Is the button pressed right now?',
      8: 'Yes → LED on.',
      9: 'No …',
      10: '… → LED off.',
    },
    steps: [
      {
        title: 'Same circuit, new program', view: 'pibench', have: BTN_IDS, power: true, showCode: true,
        body: `<p>Nothing to wire: we use the LED and the button from Lessons 4 and 5. The new program connects them in software:</p>
        <p class="path">button pressed → <code>led.on()</code> · button released → <code>led.off()</code></p>`,
      },
      {
        title: 'Run it', view: 'pibench', showCode: true, power: true, action: 'run',
        body: `<p>Hold the button: the LED lights. Let go: it goes out. The highlighted lines show the program checking the button again and again.</p>
        <p class="sim">Simulated; the real loop runs many thousands of times per second.</p>`,
      },
      {
        title: 'The same, written with events', view: 'pibench', showCode: true, power: true,
        body: `<p>The documentation also shows a shorter way — tell the button what to do when it changes:</p>
        <pre class="tree">button.when_pressed = led.on
button.when_released = led.off</pre>
        <p>Here the program does not have to keep asking: GPIO Zero calls <code>led.on</code> and <code>led.off</code> for you when the button changes.</p>`,
      },
      {
        title: 'Summary', view: 'pibench', power: true,
        body: `<ul><li>Input (button) + output (LED) + a decision (<code>if</code>) = a small control system.</li><li><code>is_pressed</code> polling, or <code>when_pressed</code> / <code>when_released</code> events.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What does the LED do in this program?', a: ['Blinks every second', 'Lights only while the button is pressed', 'Stays on', 'Fades'], c: 1, why: 'if button.is_pressed: led.on() else: led.off().' },
      { q: 'What does button.when_pressed = led.on do?', a: ['Turns the LED on immediately', 'Calls led.on whenever the button is pressed', 'Deletes the button', 'Nothing'], c: 1, why: 'It registers led.on as the action for the “pressed” event.' },
    ],
    sources: [SRC_PI.usegpio, SRC_PI.gpiozero],
  },
];

export const PI_COMING = ['PWM: fade an LED (PWMLED)', 'Buzzer', 'An I²C sensor', 'The Terminal and files', 'Camera module', 'A web page served by the Pi', 'Final project'];

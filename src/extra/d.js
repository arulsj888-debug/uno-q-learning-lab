// Slot d: Raspberry Pi servo (GPIO Zero), IR receiver (kernel gpio-ir), Bluetooth LE scan (bleak); two I2C devices on one bus + scanner for the
// ESP32 and the UNO Q; ESP32-CAM concept lesson. Python and library calls are written from memory and were NOT run on real hardware; each lesson says so.
// Listings are in `code`, line checks in `checks` (keys start with d_), simulated programs in `programs` (rt.at(n) = line n of the listing).
const R = (t, u) => ({ t, u });
const S = {
  gzout: R('GPIO Zero documentation: Output devices (AngularServo)', 'https://gpiozero.readthedocs.io/en/stable/api_output.html'),
  gzpins: R('GPIO Zero documentation: Pin factories', 'https://gpiozero.readthedocs.io/en/stable/api_pins.html'),
  ovl: R('Raspberry Pi kernel: device tree overlays README (gpio-ir, pwm)', 'https://github.com/raspberrypi/linux/blob/rpi-6.6.y/arch/arm/boot/dts/overlays/README'),
  tsop: R('Vishay TSOP382 series datasheet', 'https://www.vishay.com/docs/82491/tsop382.pdf'),
  bleak: R('Bleak documentation: BleakScanner', 'https://bleak.readthedocs.io/en/latest/api/scanner.html'),
  sg90: R('SG90 micro servo data sheets (several makers: values differ slightly)', 'https://www.datasheetcafe.com/sg90-pdf-23123/'),
  wire: R('Arduino reference: Wire library', 'https://www.arduino.cc/reference/en/language/functions/communication/wire/'),
  bmp: R('BMP280 datasheet (Bosch Sensortec)', 'https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmp280-ds001.pdf'),
  mpu: R('MPU-6000 / MPU-6050 register map (InvenSense)', 'https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Register-Map1.pdf'),
  campins: R('Espressif arduino-esp32: CameraWebServer camera_pins.h', 'https://github.com/espressif/arduino-esp32/blob/master/libraries/ESP32/examples/Camera/CameraWebServer/camera_pins.h'),
  rntcam: R('Random Nerd Tutorials: ESP32-CAM video streaming (AI-Thinker, FTDI wiring)', 'https://randomnerdtutorials.com/esp32-cam-video-streaming-face-recognition-arduino-ide/'),
  espcam: R('Espressif esp32-camera driver', 'https://github.com/espressif/esp32-camera'),
  ds: R('Espressif ESP32 Series Datasheet (strapping pins)', 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf'),
};
const fw = (id, from, to, color, lift) => ({ id, type: 'fwire', from, to, color, lift });
const ld = (id, from, to, color, lift) => ({ id, type: 'lead', from, to, color, lift });
const ids = a => a.map(d => d.id);
const STEP = (title, view, have, body, o = {}) => ({ title, view, have, power: false, body, ...o });
const hx = (v, w = 2) => v.toString(16).toUpperCase().padStart(w, '0');

const code = {}, checks = {}, programs = {};
const def = (key, src, list) => { code[key] = src; checks[key] = list; };

// ============================================================================================== Raspberry Pi: servo
const SV = [{ id: 'sv1', type: 'servo', row: 'j', col: 11, bx: 80, bz: -58 },
  fw('w1', 'p6', 'f11', 'black', 22), fw('w2', 'p2', 'f12', 'red', 26), fw('w3', 'p12', 'f13', 'orange', 30)];
const SV_IDS = ids(SV);

def('d_pi_servo', `from gpiozero import AngularServo
from time import sleep

# 0.5 ms to 2.4 ms is a common range for an SG90: calibrate your own servo (the data sheets promise about 1 ms to 2 ms)
servo = AngularServo(18, min_angle=0, max_angle=180, min_pulse_width=0.0005, max_pulse_width=0.0024)

while True:
    servo.angle = 0
    print("angle 0")
    sleep(1)
    servo.angle = 90
    print("angle 90")
    sleep(1)
    servo.angle = 180
    print("angle 180")
    sleep(1)`, [[1, 'AngularServo'], [2, 'sleep'], [4, 'calibrate'], [5, 'AngularServo(18'], [5, 'min_pulse_width=0.0005'], [7, 'while True'], [8, 'servo.angle = 0'], [9, '"angle 0"'], [10, 'sleep(1)'], [11, 'servo.angle = 90'], [14, 'servo.angle = 180'], [16, 'sleep(1)']]);

programs.d_pi_servo = async function (rt) {
  rt.serialBegin(9600);
  await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(5); rt.servoAttach('p12');
  for (;;) {
    await rt.at(7);
    for (const a of [0, 90, 180]) {
      const l = 8 + 3 * (a / 90);
      await rt.at(l); rt.servoWrite('p12', a);
      await rt.at(l + 1); rt.println('angle ' + a);
      await rt.at(l + 2); await rt.delay(1000);
    }
  }
};

const PI_SERVO = {
  module: 60, title: 'Servo SG90 with GPIO Zero (AngularServo)', level: 'Intermediate', time: '25 min',
  goal: 'Turn an SG90 servo to 0°, 90° and 180° with GPIO Zero’s AngularServo, and learn why servos jitter on a Pi and how to power them properly.',
  hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Breadboard', 'SG90 micro servo', '3-pin male header', '3 × female–male jumper wires', 'Optional: separate 5 V supply (for example 4 × AA) for the servo'],
  code: code.d_pi_servo, file: 'servo_angles.py', program: 'd_pi_servo', fast: true,
  circuit: SV, io: { p12: { kind: 'servo', item: 'sv1', needs: SV_IDS } },
  explain: {
    1: '<b>AngularServo</b> is the GPIO Zero class that takes an <b>angle</b> in degrees.',
    2: '<code>sleep()</code> gives the servo time to turn.',
    4: 'A comment: the pulse range of a real servo has to be <b>calibrated</b>. GPIO Zero’s defaults are 1 ms and 2 ms.',
    5: 'The servo signal is on <b>GPIO18 (pin 12)</b>. We say the angle range is 0° to 180° and tell GPIO Zero which pulse lengths belong to the two ends (0.5 ms and 2.4 ms).',
    7: 'Repeat forever.',
    8: '<code>servo.angle = 0</code>: GPIO Zero computes the pulse length for 0° and starts sending that pulse every 20 ms (its default frame width).',
    9: 'Print a message.',
    10: 'Wait one second so the servo can arrive.',
    11: 'Turn to the middle.',
    14: 'Turn to the other end.',
  },
  steps: [
    STEP('How a servo is told its angle', 'pibench', [], `<p>A hobby servo has a motor, gears and a small circuit inside. You do not send it a voltage level: you send a <b>pulse</b> every <b>20 ms</b>, and the <b>length of the pulse</b> is the angle. Typical SG90 data sheets give about <b>1 ms for one end, 1.5 ms for the middle and 2 ms for the other end</b> (nominal 4.8 V). Many people use a wider range, about 0.5 to 2.4 ms, to get the full travel: servos differ, so you calibrate.</p><p class="warn">Values of the SG90 differ between sellers (for example torque about 1.6 to 1.8 kg·cm at 4.8 V). There is no single official data sheet: treat them as typical.</p>`),
    STEP('The parts', 'pibb', SV_IDS, `<p>Servo plug in <b>j11</b>, <b>j12</b>, <b>j13</b>. Wire colours of an SG90: <b>brown = GND</b>, <b>red = +5 V</b>, <b>orange = signal</b>. <b>Click the servo</b> in the 3D view.</p>`, { holes: ['j11 · GND', 'j12 · +5V', 'j13 · signal'] }),
    STEP('Power: the servo is a motor', 'pibb', SV_IDS, `<p>A servo motor draws a few hundred milliamps while it moves, and much more if it is blocked (about 650 mA is a figure often quoted for the SG90 stalled: typical, not from an official data sheet). The <b>5 V pin of the Pi comes straight from the power supply</b>, so a spike can pull the supply down and <b>reboot the Pi</b>.</p><ul><li>For this test with one unloaded SG90 the lesson takes the power from <b>pin 2 (5 V)</b>.</li><li>For anything more: use a <b>separate 5 V supply</b> for the servo (for example 4 × AA cells, 4.8 to 6 V) and connect <b>its GND to a Pi GND pin</b> (common ground). Only the signal wire goes to the Pi.</li><li>The signal pin of the Pi is a 3.3 V output; an SG90 normally accepts it, but check yours.</li></ul>`, { pins: ['p2', 'p6', 'p12'] }),
    STEP('Wire it', 'pibb', SV_IDS, `<ul><li>Black: <b>pin 6 → f11</b> (GND)</li><li>Red: <b>pin 2 → f12</b> (+5 V)</li><li>Orange: <b>pin 12 → f13</b> (signal, GPIO18)</li></ul>`, { pins: ['p6', 'p2', 'p12'] }),
    STEP('The program', 'pibb', SV_IDS, `<p>Click lines <b>5</b> and <b>8</b>. Library calls here are written from memory of the GPIO Zero documentation (the constructor options were checked there); the program was not run on a real Pi.</p>`, { showCode: true, power: true }),
    STEP('Run it', 'servo', SV_IDS, `<p>Press <b>▶ Run</b>: the arm goes to 0°, 90° and 180°, one second each.</p><p class="sim">The simulated arm uses the same 180° travel for every servo and ignores the exact pulse range. A real SG90 may not reach all of 0° to 180°: calibrate <code>min_pulse_width</code> and <code>max_pulse_width</code> until it neither buzzes nor stops short at the ends.</p>`, { showCode: true, power: true, action: 'run' }),
    STEP('Jitter, and hardware PWM', 'pibb', SV_IDS, `<p>On a real Pi a servo may <b>twitch</b>. The pulse must be exact to a few microseconds, but a program on Linux is interrupted by other work. GPIO Zero’s documentation says that the <b>RPi.GPIO</b> pin factory makes PWM <b>in software</b>, and that the <b>pigpio</b> factory uses a daemon with <b>hardware-timed PWM through the DMA controller</b>.</p><ul><li><b>pigpio option</b>: run <code>sudo pigpiod</code>, then in the program <code>from gpiozero.pins.pigpio import PiGPIOFactory</code> and <code>AngularServo(18, pin_factory=PiGPIOFactory(), ...)</code>. The GPIO Zero page says pigpio does <b>not</b> work on a Pi 5 (Pi 4 is fine). Whether the pigpio package is installed on your OS version: check.</li><li><b>Kernel hardware PWM</b>: the overlay <code>dtoverlay=pwm,pin=18,func=2</code> (default pin 18, Alt5; PWM-capable pins are GPIO12, 13, 18, 19 on the header) gives a real PWM channel; other libraries can then drive it. This lesson does not use it.</li><li>The GPIO Zero default factory on a recent Pi OS is <b>lgpio</b>; its PWM timing was not verified here.</li></ul>`),
    STEP('Summary', 'pibb', SV_IDS, `<ul><li>A servo reads a pulse of 0.5 to 2.4 ms (typically about 1 to 2 ms) every 20 ms: the length is the angle.</li><li><code>AngularServo(pin, min_angle, max_angle, min_pulse_width, max_pulse_width)</code>, then <code>servo.angle = x</code>.</li><li>Servos need a separate 5 V supply for real loads, with a common GND.</li><li>Software PWM jitters; pigpio gives hardware-timed pulses on a Pi 4.</li></ul>`, { power: true }),
  ],
  quiz: [
    { q: 'What sets the angle of a hobby servo?', a: ['The length of a pulse repeated every 20 ms', 'The voltage on the signal wire', 'The frequency of a sound', 'The supply current'], c: 0, why: 'Typical servos read a 1 to 2 ms pulse (about) every 20 ms.' },
    { q: 'Why use a separate 5 V supply for the servo?', a: ['The motor current can pull down the Pi’s supply and reboot it', 'The Pi has no 5 V pin', 'The servo is analog', 'To make it faster'], c: 0, why: 'Connect the grounds together and keep the Pi’s supply for the Pi.' },
    { q: 'What does GPIO Zero’s documentation say about the pigpio pin factory?', a: ['It uses hardware-timed PWM (DMA) and does not work on a Pi 5', 'It is only for Pi Zero', 'It makes PWM in software', 'It needs no daemon'], c: 0, why: 'The pigpio daemon does the timing; support is “not Pi 5”.' },
  ],
  sources: [S.gzout, S.gzpins, S.ovl, S.sg90],
};

// ============================================================================================== Raspberry Pi: IR receiver
const IRP = [{ id: 'ir1', type: 'irrx', row: 'e', col: 20 },
  fw('w1', 'p11', 'a20', 'yellow', 22), fw('w2', 'p6', 'a21', 'black', 26), fw('w3', 'p1', 'a22', 'red', 30)];
const IRP_IDS = ids(IRP);

def('d_pi_ir', `from evdev import InputDevice, ecodes, list_devices

# needs  dtoverlay=gpio-ir,gpio_pin=17  in /boot/firmware/config.txt  (then reboot)
dev = None
for path in list_devices():
    d = InputDevice(path)
    if "gpio_ir_recv" in d.name:
        dev = d
print("Listening on", dev.path)

for event in dev.read_loop():
    if event.type == ecodes.EV_MSC and event.code == ecodes.MSC_SCAN:
        print(f"scancode: {event.value:#06x}")
        if event.value == 0x0045:
            print("POWER button")`, [[1, 'evdev'], [3, 'dtoverlay=gpio-ir,gpio_pin=17'], [3, '/boot/firmware/config.txt'], [5, 'list_devices'], [7, 'gpio_ir_recv'], [9, 'Listening on'], [11, 'read_loop'], [12, 'MSC_SCAN'], [13, 'scancode'], [14, '0x0045'], [15, 'POWER']]);

programs.d_pi_ir = async function (rt) {
  rt.serialBegin(9600);
  await rt.at(1); await rt.at(3); await rt.at(4); await rt.at(5); await rt.at(6); await rt.at(7); await rt.at(8);
  await rt.at(9); rt.println('Listening on /dev/input/event0');
  for (;;) {
    await rt.at(11);
    const c = rt.irDecode();
    if (c !== null) {
      await rt.at(12); await rt.at(13); rt.println('scancode: 0x00' + hx(c));
      await rt.at(14);
      if (c === 0x45) { await rt.at(15); rt.println('POWER button'); }
    }
    await rt.yield();
  }
};

const PI_IR = {
  module: 60, title: 'IR remote receiver: the kernel decodes the buttons', level: 'Intermediate', time: '25 min',
  goal: 'Connect a 38 kHz IR receiver to a GPIO pin, let the Linux kernel (gpio-ir overlay) decode the remote, and read the button codes in Python.',
  hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Breadboard', '38 kHz IR receiver (TSOP38238-type, 3 legs)', 'An IR remote control (simulated here)', '3 × female–male jumper wires'],
  code: code.d_pi_ir, file: 'ir_remote.py', program: 'd_pi_ir', fast: true, widgets: ['irremote'],
  circuit: IRP, io: { p11: { kind: 'irrx', item: 'ir1', needs: IRP_IDS } },
  explain: {
    1: '<b>evdev</b> reads Linux input devices (<code>sudo apt install python3-evdev</code>, written from memory).',
    3: 'The <b>gpio-ir</b> overlay tells the kernel: “GPIO17 is an infrared receiver”. The kernel then decodes the pulses itself and creates an input device.',
    4: 'Nothing found yet.',
    5: 'Look at every input device of the system…',
    7: '…and take the one the overlay created. Its name contains <b>gpio_ir_recv</b>.',
    9: 'Say which device file is used.',
    11: '<b>read_loop()</b> waits for events; there is no polling and no timing work in Python.',
    12: 'The kernel sends the decoded code as a <b>scancode</b> event.',
    13: 'Print it in hexadecimal.',
    14: 'Is it the Power button of our simulated remote (command 0x45)?',
  },
  steps: [
    STEP('Two ways to listen on a Pi', 'pibench', [], `<p>A remote flickers an IR LED at <b>38 kHz</b> in a pattern; the receiver turns that into clean pulses on its OUT pin. Decoding the pulses needs exact timing, which Python on Linux is bad at. Two common ways:</p><ul><li><b>Kernel driver (this lesson)</b>: the device tree overlay <code>gpio-ir</code> (in the Raspberry Pi kernel README: “use GPIO pin as rc-core style infrared receiver input”) decodes the protocol in the kernel. Tools: <code>ir-keytable</code>, or read the input device as we do.</li><li><b>LIRC</b>, the older daemon-based way. The old <code>lirc-rpi</code> overlay was replaced by <code>gpio-ir</code>. Whether LIRC is still the best choice on the newest Pi OS was not verified here.</li></ul>`),
    STEP('The IR receiver', 'pibb', ['ir1'], `<p>Click it in the 3D view. Vishay TSOP382 series (TSOP38238 is the 38 kHz type): pins <b>1 OUT, 2 GND, 3 VS</b>, supply about <b>2.5 V to 5.5 V</b> (distributor listings; check your data sheet), output <b>idles HIGH and goes LOW during a burst</b>. On a Pi, feed it from <b>3.3 V</b> so that OUT never exceeds the 3.3 V of the GPIO pin.</p><p class="warn">Part pin order depends on the housing: with the dome toward you and the legs down, the usual order from the left is OUT, GND, VS. Check your own part.</p>`, { holes: ['e20 · OUT', 'e21 · GND', 'e22 · VS'] }),
    STEP('Wire it', 'pibb', IRP_IDS, `<ul><li>Yellow: <b>pin 11 → a20</b> (GPIO17, OUT)</li><li>Black: <b>pin 6 → a21</b> (GND)</li><li>Red: <b>pin 1 → a22</b> (3.3 V, VS)</li></ul>`, { pins: ['p11', 'p6', 'p1'] }),
    STEP('Switch the kernel driver on', 'pibb', IRP_IDS, `<p>On a Pi: add the line <code>dtoverlay=gpio-ir,gpio_pin=17</code> to <code>/boot/firmware/config.txt</code> (on older images <code>/boot/config.txt</code>) and reboot. The overlay’s parameters (kernel README): <b>gpio_pin</b> (default 18), <b>gpio_pull</b> (default up), <b>invert</b> (default 1, because the receiver is active low) and <b>rc-map-name</b>.</p><p>Test without Python: <code>sudo apt install ir-keytable</code> and <code>sudo ir-keytable -t</code> prints what the remote sends (usage written from memory; if nothing shows, the protocol may need to be enabled with the <code>-p</code> option).</p>`),
    STEP('The program', 'pibb', IRP_IDS, `<p>Click lines <b>3</b>, <b>7</b> and <b>12</b>. The name <code>gpio_ir_recv</code> and the event types are written from memory and were not run on a real Pi.</p>`, { showCode: true, power: true }),
    STEP('Run it and press a button', 'pibb', IRP_IDS, `<p>Press <b>▶ Run</b>, then use the <b>simulated remote</b> in the panel. Each button prints its scancode; <b>Power</b> prints <code>POWER button</code>.</p><p class="sim">Simulated remote and codes. For a standard NEC remote the scancode is the address byte followed by the command byte (here the address is 0x00); your own remote has its own codes, so print them first.</p>`, { showCode: true, power: true, action: 'run' }),
    STEP('Summary', 'pibb', IRP_IDS, `<ul><li>38 kHz receiver: OUT idles HIGH, goes LOW during a burst; supply it with 3.3 V on a Pi.</li><li><code>dtoverlay=gpio-ir,gpio_pin=17</code> makes the kernel decode the remote.</li><li>Python only reads finished scancodes from an input device.</li></ul>`, { power: true }),
  ],
  quiz: [
    { q: 'Why does the Pi lesson use the gpio-ir overlay instead of timing the pulses in Python?', a: ['The kernel decodes with exact timing', 'Python cannot read pins', 'The overlay makes the remote louder', 'Overlays remove the need for a receiver'], c: 0, why: 'Linux user programs are interrupted, so pulse timing is done in the kernel.' },
    { q: 'What is the idle level of the receiver’s OUT pin?', a: ['HIGH', 'LOW', 'Floating', 'It changes at 38 kHz'], c: 0, why: 'It idles HIGH and goes LOW during a burst (active low).' },
    { q: 'From which pin do you feed the receiver on a Pi?', a: ['3.3 V', '5 V, always', 'GPIO17', 'GND'], c: 0, why: 'With 3.3 V the OUT level can never exceed the 3.3 V of a GPIO pin.' },
  ],
  sources: [S.ovl, S.tsop],
};

// ============================================================================================== Raspberry Pi: Bluetooth LE scan
def('d_pi_ble', `import asyncio
from bleak import BleakScanner

async def main():
    found = await BleakScanner.discover(timeout=5.0, return_adv=True)
    for address, (device, adv) in found.items():
        print(address, adv.rssi, "dBm", adv.local_name)
    print(len(found), "device(s) heard")

asyncio.run(main())`, [[1, 'asyncio'], [2, 'BleakScanner'], [4, 'async def main'], [5, 'discover(timeout=5.0'], [5, 'return_adv=True'], [6, 'found.items()'], [7, 'adv.rssi'], [7, 'adv.local_name'], [8, 'len(found)'], [10, 'asyncio.run']]);

programs.d_pi_ble = async function (rt) {
  rt.serialBegin(9600);
  await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(10); await rt.at(5);
  await rt.delay(5000);
  const list = [['C4:5B:BE:00:00:01', -52, 'ESP32-LED'], ['7A:3C:91:00:00:02', -71, 'None'], ['E8:9F:6D:00:00:03', -64, 'Thermo-Beacon'], ['5D:11:2E:00:00:04', -88, 'None']];
  await rt.at(6);
  for (const [a, r, n] of list) { await rt.at(7); rt.println(a + ' ' + r + ' dBm ' + n); await rt.delay(60); await rt.at(6); }
  await rt.at(8); rt.println(list.length + ' device(s) heard');
  for (;;) await rt.delay(1000);
};

const PI_BLE = {
  module: 60, title: 'Bluetooth LE: scan for advertisements with bleak', level: 'Intermediate', time: '25 min',
  goal: 'Use the Raspberry Pi’s built-in Bluetooth Low Energy radio to scan for nearby devices with the Python library bleak, and read name and signal strength from each advertisement.',
  hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Nothing to wire: the radio is on the board', 'Any BLE device nearby (for example the ESP32 of the BLE lesson); simulated here'],
  code: code.d_pi_ble, file: 'ble_scan.py', program: 'd_pi_ble', fast: true,
  circuit: [], io: {},
  explain: {
    1: '<b>asyncio</b>: bleak is written with <code>async</code> / <code>await</code>.',
    2: 'The scanner class of the <b>bleak</b> library (installed with pip, see the steps).',
    4: 'An <code>async</code> function can wait for the radio without blocking.',
    5: '<b>BleakScanner.discover</b> listens for <b>5 seconds</b>. With <code>return_adv=True</code> it returns a dictionary: address → (device, advertisement data). (Both are in the bleak documentation.)',
    6: 'One entry per device heard.',
    7: 'The <b>address</b>, the signal strength <b>RSSI</b> in dBm (closer to 0 = stronger) and the <b>local name</b> if the advertisement has one, otherwise <code>None</code>.',
    8: 'How many devices answered.',
    10: 'Start the event loop and run <code>main()</code>.',
  },
  steps: [
    STEP('Advertising: “I am here”', 'pibench', [], `<p>A BLE device that wants to be found sends a short <b>advertisement</b> packet again and again, on three dedicated advertising channels (37, 38 and 39). It can contain a <b>name</b>, a list of services, manufacturer data and a transmit power. A <b>scanner</b> just listens: it does not connect to anything. Many devices (phones especially) use a <b>random address</b> that changes, and many send no name.</p>`),
    STEP('The Pi has the radio on board', 'pibench', [], `<p>The Raspberry Pi 4 has Bluetooth 5.0 with BLE built in: nothing to wire. On Raspberry Pi OS the Linux Bluetooth stack is <b>BlueZ</b>, and <b>bleak</b> talks to it. Install it in a virtual environment (recent Pi OS versions refuse a plain <code>pip install</code> into the system Python): <code>python3 -m venv ble &amp;&amp; ble/bin/pip install bleak</code> (commands written from memory).</p>`),
    STEP('The program', 'pibench', [], `<p>Click lines <b>5</b>, <b>6</b> and <b>7</b>. The call <code>BleakScanner.discover(timeout, return_adv=True)</code> and its result are from the bleak documentation. The field names <code>rssi</code> and <code>local_name</code> of the advertisement data are written from memory.</p>`, { showCode: true, power: true }),
    STEP('Run it', 'pibench', [], `<p>Press <b>▶ Run</b>: after the 5-second scan the Shell lists each device. The one called <code>ESP32-LED</code> is the kind of device you made in the ESP32 BLE lesson.</p><p class="sim">The four devices, their addresses and signal strengths are <b>made up</b>. A real scan lists the devices around you, in no fixed order.</p>`, { showCode: true, power: true, action: 'run' }),
    STEP('Reading the numbers', 'pibench', [], `<ul><li><b>RSSI</b> is the received signal strength in dBm: −50 is strong, −90 is weak. It falls with distance, but walls, bodies and antennas change it a lot: it is a rough hint, not a ruler.</li><li><code>None</code> as name: the advertisement carried no name (the name may come in a second “scan response” packet; the bleak docs advise waiting until the name arrives).</li><li>To talk to a device you would next use <code>BleakClient</code> (connect, read and write characteristics): not covered here.</li></ul>`),
    STEP('Summary', 'pibench', [], `<ul><li>The Pi 4’s radio and the <b>bleak</b> library are enough to scan for BLE advertisements.</li><li><code>discover(timeout=5.0, return_adv=True)</code> gives address → (device, advertisement data).</li><li>RSSI is a rough distance hint; names and addresses are often missing or random.</li></ul>`, { power: true }),
  ],
  quiz: [
    { q: 'What does a BLE scanner do?', a: ['Listens for advertisement packets', 'Connects to every device', 'Measures the temperature', 'Switches Wi-Fi on'], c: 0, why: 'Scanning is passive listening; connecting is a separate step.' },
    { q: 'An RSSI of −85 dBm compared with −45 dBm means…', a: ['A much weaker signal', 'A stronger signal', 'The same distance', 'A different protocol'], c: 0, why: 'The closer to 0 dBm, the stronger.' },
    { q: 'Which Linux Bluetooth stack does bleak use on Raspberry Pi OS?', a: ['BlueZ', 'LIRC', 'GPIO Zero', 'pigpio'], c: 0, why: 'bleak talks to BlueZ on Linux.' },
  ],
  sources: [S.bleak],
};

// ============================================================================================== I2C scanner with two devices: ESP32 and UNO Q
const SC_NAMES = ['VCC', 'GND', 'SCL', 'SDA'];
const scanParts = (gnd, sda, scl, boardWire = fw) => [{ id: 'bmp1', type: 'bmp280', x: -30, z: 138 }, { id: 'mpu1', type: 'mpu6050', x: 100, z: 138 },
  ...SC_NAMES.map((n, i) => fw('m5' + i, 'bmp1.' + n, 'a' + (10 + i), { VCC: 'red', GND: 'black', SDA: 'blue', SCL: 'yellow' }[n], 16 + i * 2)),
  ...SC_NAMES.map((n, i) => fw('m6' + i, 'mpu1.' + n, 'c' + (10 + i), { VCC: 'orange', GND: 'black', SDA: 'white', SCL: 'green' }[n], 40 + i * 2)),
  ...SC_NAMES.map((n, i) => boardWire('w5' + i, { VCC: '3V3', GND: gnd, SDA: sda, SCL: scl }[n], 'b' + (10 + i), { VCC: 'red', GND: 'black', SDA: 'blue', SCL: 'yellow' }[n], 22 + i * 3))];
const E_SC = scanParts('GND2', 'G21', 'G22'), E_SC_IDS = ids(E_SC);
const jwire = (id, from, to, color, lift) => ({ id, type: 'wire', from, to, color, lift });   // the UNO Q header has female sockets: a male jumper plugs in
const Q_SC = scanParts('GND2', 'D20', 'D21', jwire), Q_SC_IDS = ids(Q_SC);

const scanCode = (begin, baud) => `// I2C scanner: ask every address from 1 to 126 and print the ones that answer
#include <Wire.h>

void setup() {
  ${begin}
  Serial.begin(${baud});
  Serial.println("Scanning...");
  int found = 0;
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();   // 0 = a device answered
    if (error == 0) {
      Serial.print("Device found at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      found++;
    }
  }
  Serial.print("Done: ");
  Serial.print(found);
  Serial.println(" device(s)");
}

void loop() {
}`;
const SCAN_CHECKS = [[2, '<Wire.h>'], [4, 'void setup'], [5, 'Wire.begin'], [6, 'Serial.begin'], [7, 'Scanning'], [8, 'int found'], [9, 'address < 127'], [10, 'beginTransmission(address)'], [11, 'endTransmission'], [12, 'error == 0'], [13, 'Device found'], [14, 'address < 16'], [15, 'HEX'], [16, 'found++'], [19, 'Done: '], [20, 'Serial.print(found)'], [21, 'device(s)'], [24, 'void loop']];
def('d_e32_scan', scanCode('Wire.begin(21, 22);          // SDA = GPIO21, SCL = GPIO22 (the ESP32 DevKit default pins)', 115200), SCAN_CHECKS);
def('d_uq_scan', scanCode('Wire.begin();                // UNO Q: Wire is on D20 (SDA) and D21 (SCL)', 9600), SCAN_CHECKS);

const scanProg = baud => async function (rt) {
  await rt.at(2); await rt.at(4);
  await rt.at(5); await rt.at(6); rt.serialBegin(baud);
  await rt.at(7); rt.println('Scanning...');
  await rt.at(8); let found = 0;
  for (let a = 1; a < 127; a++) {
    await rt.at(9); await rt.at(10);
    await rt.at(11); const ok = rt.i2cProbe(a);
    await rt.at(12);
    if (ok) {
      await rt.at(13); rt.print('Device found at 0x');
      await rt.at(14); if (a < 16) rt.print('0');
      await rt.at(15); rt.println(hx(a));
      await rt.at(16); found++;
    }
  }
  await rt.at(19); rt.print('Done: ');
  await rt.at(20); rt.print(found);
  await rt.at(21); rt.println(' device(s)');
  await rt.at(24);
  for (;;) await rt.delay(1000);
};
programs.d_e32_scan = scanProg(115200);
programs.d_uq_scan = scanProg(9600);

const scanLesson = (b) => ({
  module: 60, title: 'I²C scanner: two devices on one bus (BMP280 + MPU6050)', level: 'Intermediate', time: '20 min',
  goal: `Put two I²C devices on the same two wires of the ${b.name}, share the bus through the breadboard, and find both addresses with a scanner sketch.`,
  hardware: [b.name, 'Breadboard', 'BMP280 breakout', 'MPU6050 breakout (GY-521 style)', '12 × female–male jumper wires'],
  code: code[b.key], file: 'I2CScanner.ino', program: b.key, fast: true,
  circuit: b.parts, io: { [b.sda]: { kind: 'bmp', sda: b.sda, scl: b.scl, item: 'bmp1', needs: b.ids }, MPU: { kind: 'mpu', sda: b.sda, scl: b.scl, item: 'mpu1', needs: b.ids } },
  explain: {
    2: '<b>Wire.h</b> is the I²C library of the Arduino core.',
    5: b.beginText,
    6: 'Serial output on.',
    7: 'A first message.',
    8: 'A counter for the devices found.',
    9: 'Try every 7-bit address from 1 to 126.',
    10: 'Begin a transmission to this address.',
    11: '<b>endTransmission()</b> sends it and returns <b>0 if a device answered</b> (acknowledged), another number if not.',
    12: 'Answered: there is a device here.',
    13: 'Print the start of the line…',
    14: '…a leading zero for addresses below 0x10…',
    15: '…and the address in hexadecimal, for example 68 or 76.',
    16: 'Count it.',
    19: 'The scan is done.',
    20: 'How many devices answered.',
    21: 'The unit.',
    24: '<b>loop()</b> stays empty: the scan runs once.',
  },
  steps: [
    STEP('Many devices, two wires', 'scanv', [], `<p>I²C uses just <b>two wires</b>, SDA (data) and SCL (clock). Many devices can share them, because <b>each device has its own address</b>. If you do not know an address (or a device stays silent), a <b>scanner</b> asks every address and prints the ones that answer.</p>`),
    STEP('Two devices on one bus', 'scanv', b.ids, `<p>The <b>BMP280</b> answers at <b>0x76</b> (0x77 if its SDO pin is tied high) and the <b>MPU6050</b> at <b>0x68</b> (0x69 if AD0 is high). Different addresses: no conflict. Two devices with the <b>same</b> address on one bus would collide. <b>Click each module</b> in the 3D view.</p><p class="warn">The factory address depends on the breakout: some BMP280 boards use 0x77. The scanner shows what <b>your</b> board does.</p>`),
    STEP('Wire it: share the bus on the breadboard', 'scanv', b.ids, `<p>${b.board} has only one pair of I²C pins, so both modules go to the <b>same four breadboard columns</b> (10 to 13): VCC, GND, SCL, SDA. Each module sits in its own row (BMP280 in row a, MPU6050 in row c); the ${b.short} connects to those columns once: <b>${b.p3} → b10</b>, <b>GND → b11</b>, <b>${b.scl} → b12</b> (SCL), <b>${b.sda} → b13</b> (SDA).</p><p class="warn">Check the pin order printed on your own modules: it differs between makers. Both modules run from 3.3 V here.</p>`, { pins: [b.p3, 'GND2', b.scl, b.sda] }),
    STEP('The code', 'scanv', b.ids, `<p>Click lines <b>10</b> and <b>11</b>: the whole trick. A device that answers returns 0.${b.extra}</p>`, { showCode: true, power: true }),
    STEP('Run the scanner', 'scanv', b.ids, `<p>The Serial Monitor lists <b>0x68</b> and <b>0x76</b> and ends with <b>Done: 2 device(s)</b>. Now you know the addresses for your own sketches.</p>`, { showCode: true, power: true, action: 'run' }),
    STEP('Summary', 'scanv', b.ids, `<ul><li>Devices on one I²C bus are told apart by their <b>7-bit address</b>.</li><li><code>Wire.endTransmission()</code> returns 0 when a device answers.</li><li>Breadboard columns let several modules share SDA and SCL.</li><li>If a device is missing from the list: check power, SDA/SCL (not swapped) and the address jumpers.</li></ul>`, { power: true }),
  ],
  quiz: [
    { q: 'How does a scanner find a device?', a: ['It tries each address and sees which one answers', 'It reads a label', 'It measures current', 'It restarts the board'], c: 0, why: 'endTransmission() returns 0 when a device acknowledges.' },
    { q: 'Two devices have the same address. What happens?', a: ['They collide on the bus', 'Nothing', 'The faster one always wins', 'Wire.h fixes it'], c: 0, why: 'Each device on a bus needs its own address.' },
    { q: 'Which addresses does this lesson expect?', a: ['0x68 (MPU6050) and 0x76 (BMP280)', '0x27 and 0x3C', '0x00 and 0xFF', 'Only one'], c: 0, why: 'These are the usual addresses of the two breakouts.' },
  ],
  sources: b.sources,
});

const E_SCAN = scanLesson({ name: 'ESP32 DevKit V1', key: 'd_e32_scan', parts: E_SC, ids: E_SC_IDS, sda: 'G21', scl: 'G22', p3: '3V3', board: 'The ESP32 DevKit', short: 'ESP32',
  beginText: '<b>Wire.begin(21, 22)</b> starts the ESP32 as the I²C <b>controller</b> with SDA on GPIO21 and SCL on GPIO22 (the usual default pins of the DevKit; the ESP32 can route I²C to other pins).',
  extra: ' The ESP32 DevKit runs at 3.3 V, so all modules here use 3V3.',
  sources: [S.wire, S.bmp, S.mpu] });
const Q_SCAN = scanLesson({ name: 'Arduino UNO Q', key: 'd_uq_scan', parts: Q_SC, ids: Q_SC_IDS, sda: 'D20', scl: 'D21', p3: '3V3', board: 'The UNO Q', short: 'UNO Q',
  beginText: '<b>Wire.begin()</b> starts the UNO Q as the I²C <b>controller</b> on its <b>Wire</b> bus: SDA is <b>D20</b> and SCL is <b>D21</b> (UNO Q pin data in this lab). The Qwiic connector is a different bus (Wire1).',
  extra: ' The UNO Q runs at 3.3 V, so all modules here use 3V3.</p><p class="warn">Whether this sketch runs unchanged on the UNO Q (Zephyr core) is checked in the simulator only: it is <b>not verified</b> on the real board',
  sources: [S.wire, S.bmp, S.mpu] });

// ============================================================================================== ESP32-CAM (concept)
const CAM = [{ id: 'cam1', type: 'mod', model: 'mod_espcam', x: 20, z: 138 }, { id: 'ftd1', type: 'mod', model: 'mod_ftdi', x: 90, z: 150 },
  ld('l1', 'ftd1.VCC', 'cam1.5V', 'red', 26), ld('l2', 'ftd1.GND', 'cam1.GND', 'black', 22), ld('l3', 'ftd1.TX', 'cam1.U0R', 'green', 30), ld('l4', 'ftd1.RX', 'cam1.U0T', 'yellow', 34),
  ld('l5', 'cam1.IO0', 'cam1.GND', 'white', 14)];
const CAM_IDS = ids(CAM);
def('d_e32_cam', `#include "esp_camera.h"
#include <WiFi.h>

// Pin map of the AI-Thinker ESP32-CAM (camera_pins.h of the CameraWebServer example)
#define PWDN_GPIO_NUM 32
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
// data lines Y2..Y9: GPIO 5, 18, 19, 21, 36, 39, 34, 35;  VSYNC 25, HREF 23, PCLK 22

void setup() {
  Serial.begin(115200);
  camera_config_t config;
  config.pin_pwdn = PWDN_GPIO_NUM;       // (the other pins are filled in the same way)
  config.xclk_freq_hz = 20000000;        // 20 MHz clock for the sensor
  config.pixel_format = PIXFORMAT_JPEG;  // the camera board compresses to JPEG
  config.frame_size = FRAMESIZE_VGA;     // 640 x 480
  config.fb_count = 1;
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\\n", err);
    return;
  }
  camera_fb_t *fb = esp_camera_fb_get();   // take one picture
  Serial.printf("Picture: %u bytes, %ux%u JPEG\\n", fb->len, fb->width, fb->height);
  esp_camera_fb_return(fb);
}

void loop() {
}`, [[1, 'esp_camera.h'], [4, 'AI-Thinker'], [5, 'PWDN_GPIO_NUM 32'], [6, 'XCLK_GPIO_NUM 0'], [7, 'SIOD_GPIO_NUM 26'], [8, 'SIOC_GPIO_NUM 27'], [9, '5, 18, 19, 21, 36, 39, 34, 35'], [11, 'void setup'], [12, 'Serial.begin(115200)'], [13, 'camera_config_t'], [14, 'pin_pwdn'], [15, 'xclk_freq_hz'], [16, 'PIXFORMAT_JPEG'], [17, 'FRAMESIZE_VGA'], [19, 'esp_camera_init'], [20, 'ESP_OK'], [21, 'Camera init failed'], [24, 'esp_camera_fb_get'], [25, 'Picture:'], [26, 'esp_camera_fb_return'], [29, 'void loop']]);

programs.d_e32_cam = async function (rt) {
  await rt.at(1); await rt.at(2); await rt.at(11);
  await rt.at(12); rt.serialBegin(115200);
  await rt.at(13); await rt.at(14); await rt.at(15); await rt.at(16); await rt.at(17); await rt.at(18);
  await rt.at(19); await rt.delay(400);
  await rt.at(20);
  await rt.at(24); await rt.delay(300); rt.dev('cam', 'shot', 640, 480, 24576);
  await rt.at(25); rt.println('Picture: 24576 bytes, 640x480 JPEG');
  await rt.at(26);
  await rt.at(29);
  for (;;) await rt.delay(1000);
};

const E_CAM = {
  module: 60, title: 'ESP32-CAM (AI-Thinker): a camera board without USB', level: 'Beginner', time: '25 min',
  goal: 'Understand how the AI-Thinker ESP32-CAM is wired for flashing (USB-serial adapter, IO0 to GND, 5 V), what its camera pins are, and what the CameraWebServer example does.',
  hardware: ['AI-Thinker ESP32-CAM (with its OV2640 camera)', 'USB-serial adapter (3.3 V logic, with a 5 V supply pin)', '5 jumper wires (4 to the adapter, 1 for IO0 to GND)', 'The ESP32 DevKit of the other lessons is not used'],
  code: code.d_e32_cam, file: 'camera_snapshot.ino', program: 'd_e32_cam', fast: true, widgets: ['dv:cam'],
  circuit: CAM, io: {},
  explain: {
    1: '<b>esp_camera.h</b> is the camera driver (the Espressif <b>esp32-camera</b> component, included in the Arduino-ESP32 core).',
    4: 'These are the pin numbers of the camera on the AI-Thinker board. They are the same for every sketch for this board.',
    5: 'PWDN (power-down) of the camera is on GPIO32.',
    6: '<b>XCLK</b>, the clock the ESP32 gives to the camera, is on <b>GPIO0</b> (this is why GPIO0 matters when flashing).',
    7: 'SIOD/SIOC: the camera’s control bus (SCCB, like I²C) on GPIO26 and GPIO27.',
    9: 'The 8 data lines of the camera, plus the sync and pixel-clock lines. The camera sends pixels over these lines, not over I²C.',
    13: 'A structure that describes the camera setup.',
    14: 'Tell the driver the PWDN pin; the other pins are filled in the same way (shortened here).',
    15: 'The clock for the sensor: 20 MHz.',
    16: 'JPEG: the camera board compresses each picture.',
    17: 'Picture size: VGA, 640 × 480.',
    19: '<b>esp_camera_init()</b> starts the camera. It returns <b>ESP_OK</b> if it worked.',
    21: 'The error text that the official example prints; typical causes are a wrong pin map, a loose camera cable or too little power.',
    24: '<b>esp_camera_fb_get()</b> takes one picture and gives you its data (a “frame buffer”).',
    25: 'Print its size.',
    26: 'Give the buffer back so the next picture can be taken.',
  },
  steps: [
    STEP('A camera on an ESP32, but no USB', 'scanv', [], `<p>The AI-Thinker <b>ESP32-CAM</b> is a small ESP32 board with an <b>OV2640 camera</b>, a microSD slot and external PSRAM (4 MB per Random Nerd Tutorials). It has <b>no USB connector and no USB-serial chip</b>, so you flash it through its serial pins with a separate <b>USB-serial adapter</b>. The ESP32 DevKit of the other lessons is not used here.</p>`),
    STEP('Wiring for flashing', 'scanv', CAM_IDS, `<p>The usual wiring (Random Nerd Tutorials) is: <b>adapter GND → GND</b>, <b>adapter 5V → 5V</b>, <b>adapter TX → U0R</b> (GPIO3, the receive pin), <b>adapter RX → U0T</b> (GPIO1, the transmit pin), and <b>IO0 → GND</b>. TX and RX are crossed. <b>Click the two modules</b> in the 3D view.</p><p class="warn">The module is drawn in a simplified way: only the pins used here, in the usual order. Read the printing on your own board.</p>`),
    STEP('Why IO0 to GND, and why 5 V', 'scanv', CAM_IDS, `<ul><li><b>IO0 low at reset</b> puts the ESP32 into download mode, ready for new code (a strapping pin, see the Espressif data sheet). After flashing, <b>remove the jumper</b> and press the reset button, otherwise the board waits for code instead of running it. GPIO0 is also the camera clock (XCLK), which is why it must be free when the camera runs.</li><li><b>Power</b>: the camera and Wi-Fi together draw bursts of current. A weak supply (for example the 3.3 V pin of a cheap adapter) causes brownout resets and “camera init failed” errors; many users report that a good 5 V supply to the 5V pin fixes it. Make sure the adapter’s jumper is on 5 V for the supply pin, and check that its logic is 3.3 V.</li><li>The Arduino IDE: select the board <b>AI Thinker ESP32-CAM</b>; if upload does not start, press the on-board reset button.</li></ul>`, { pins: [] }),
    STEP('The camera pins', 'scanv', CAM_IDS, `<p>The camera is not on I²C: it uses a parallel bus. The pin numbers below are those of the <b>CAMERA_MODEL_AI_THINKER</b> block in Espressif’s <code>camera_pins.h</code>: PWDN 32, XCLK 0, SIOD 26, SIOC 27, data Y2..Y9 on 5, 18, 19, 21, 36, 39, 34, 35, VSYNC 25, HREF 23, PCLK 22. The same file notes that the flash LED is on <b>GPIO4</b> (the small red LED is on GPIO33). Because these pins are taken, few are left free; the microSD slot also uses GPIO2, 4, 12, 13, 14 and 15.</p>`),
    STEP('A small camera sketch', 'scanv', CAM_IDS, `<p>Click lines <b>6</b>, <b>19</b> and <b>24</b>. This is a <b>shortened</b> sketch written from memory of the esp32-camera API: it does not compile as it is (the other pins of the structure are missing). Use the official <b>CameraWebServer</b> example (Arduino IDE: File → Examples → ESP32 → Camera) and select <code>#define CAMERA_MODEL_AI_THINKER</code> in it.</p>`, { showCode: true, power: true }),
    STEP('Run it: the picture is a placeholder', 'scanv', CAM_IDS, `<p>Press <b>▶ Run</b>. The Serial Monitor reports one JPEG picture, and the panel shows a <b>colour-bar test image</b>.</p><p class="sim"><b>The simulator cannot show what a real camera sees.</b> The picture is a standard test image drawn by the browser, and the size in bytes is an example value. The run button here uses the DevKit’s simulated power as a stand-in for the 5 V from your adapter.</p>`, { showCode: true, power: true, action: 'run' }),
    STEP('CameraWebServer and what comes next', 'scanv', CAM_IDS, `<p>The <b>CameraWebServer</b> example connects to your Wi-Fi (you enter SSID and password in the sketch), starts a web server and prints its address in the Serial Monitor; open it in a browser to see the live stream and change settings. Details such as the exact message text, and how well it runs, depend on the core version and on your power supply: not run here.</p><ul><li>The OV2640 is a 2-megapixel sensor (up to 1600 × 1200, UXGA); the larger the picture, the slower the stream.</li><li>Frame size can be higher only if the board has PSRAM.</li></ul>`),
    STEP('Summary', 'scanv', CAM_IDS, `<ul><li>ESP32-CAM: ESP32 + OV2640 + microSD, no USB: flash it with a USB-serial adapter (TX→U0R, RX→U0T, GND, 5V).</li><li>IO0 to GND while resetting = download mode; remove it to run.</li><li>Power from 5 V that can deliver the current: brownouts cause camera errors.</li><li>Camera pins are fixed by the board (camera_pins.h); the flash LED is on GPIO4.</li></ul>`, { power: true }),
  ],
  quiz: [
    { q: 'Why does the ESP32-CAM need a USB-serial adapter?', a: ['It has no USB connector or USB-serial chip', 'It has no ESP32', 'It only works on 12 V', 'The camera needs it'], c: 0, why: 'The adapter provides the serial link and often the power.' },
    { q: 'What must you do with IO0 to flash the board, and afterwards?', a: ['Connect to GND to flash; remove the jumper to run', 'Connect to 5V always', 'Cut it', 'Leave it to GND always'], c: 0, why: 'IO0 low at reset = download mode.' },
    { q: 'A camera init failure with resets often points to…', a: ['A weak power supply (brownout)', 'A missing Serial.begin', 'Too many LEDs', 'A bad password'], c: 0, why: 'Use a good 5 V supply; also check the camera cable and the pin map.' },
  ],
  sources: [S.campins, S.rntcam, S.espcam, S.ds],
};

export default {
  lessons: { u3: [], e32: [E_SCAN, E_CAM], uq: [Q_SCAN], pi: [PI_SERVO, PI_IR, PI_BLE] },
  modules: { u3: {}, e32: { 60: 'Module 60 — I²C bus and ESP32-CAM' }, uq: { 60: 'Module 60 — I²C bus' }, pi: { 60: 'Module 60 — Servo, infrared and Bluetooth LE' } },
  programs, code, checks,
};

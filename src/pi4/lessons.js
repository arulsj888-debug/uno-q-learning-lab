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
  rgbled: { t: 'GPIO Zero documentation: RGBLED', u: 'https://gpiozero.readthedocs.io/en/stable/api_output.html' },
  gpiozeroin: { t: 'GPIO Zero documentation: input devices (Button, RotaryEncoder)', u: 'https://gpiozero.readthedocs.io/en/stable/api_input.html' },
  dhtpy: { t: 'Adafruit CircuitPython DHT library documentation', u: 'https://docs.circuitpython.org/projects/dht/en/latest/' },
  dhtguide: { t: 'Adafruit: DHT11, DHT22 and AM2302 Sensors (specifications, wiring)', u: 'https://learn.adafruit.com/dht' },
  rplcd: { t: 'RPLCD documentation: RPLCD.i2c.CharLCD', u: 'https://rplcd.readthedocs.io/en/stable/api.html' },
  ssd1306py: { t: 'Adafruit CircuitPython SSD1306 library documentation', u: 'https://docs.circuitpython.org/projects/ssd1306/en/latest/' },
  neopy: { t: 'Adafruit: NeoPixels on Raspberry Pi (Python usage)', u: 'https://learn.adafruit.com/neopixels-on-raspberry-pi/python-usage' },
  neouber: { t: 'Adafruit NeoPixel Überguide: Powering NeoPixels', u: 'https://learn.adafruit.com/adafruit-neopixel-uberguide/powering-neopixels' },
  cfg: { t: 'Raspberry Pi documentation — Configuration: enable or disable I2C', u: 'https://www.raspberrypi.com/documentation/computers/configuration.html#i2c' },
  remote: { t: 'Raspberry Pi documentation — Remote access (find your IP address, SSH)', u: 'https://www.raspberrypi.com/documentation/computers/remote-access.html' },
  kernel: { t: 'Raspberry Pi documentation — Linux kernel (check your kernel)', u: 'https://www.raspberrypi.com/documentation/computers/linux_kernel.html' },
  osupdate: { t: 'Raspberry Pi documentation — Update Raspberry Pi OS', u: 'https://www.raspberrypi.com/documentation/computers/os.html#update-software' },
  users: { t: 'Raspberry Pi documentation — Manage users', u: 'https://www.raspberrypi.com/documentation/computers/configuration.html#users' },
  thermal: { t: 'Raspberry Pi documentation — Frequency management and thermal control', u: 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#frequency-management-and-thermal-control' },
  sht31: { t: 'Adafruit SHT31-D Temperature & Humidity Sensor Breakout (product page and guide)', u: 'https://learn.adafruit.com/adafruit-sht31-d-temperature-and-humidity-sensor-breakout' },
  sht31lib: { t: 'Adafruit CircuitPython SHT31D library (README, example, source)', u: 'https://github.com/adafruit/Adafruit_CircuitPython_SHT31D' },
  flask: { t: 'Flask documentation — Quickstart (minimal app, flask run, externally visible server)', u: 'https://flask.palletsprojects.com/en/stable/quickstart/' },
  camin: { t: 'Raspberry Pi documentation — Install a Raspberry Pi camera', u: 'https://www.raspberrypi.com/documentation/accessories/camera.html#install-a-raspberry-pi-camera' },
  cam3: { t: 'Raspberry Pi documentation — Camera Module 3 (product photo CC BY-SA 4.0)', u: 'https://www.raspberrypi.com/documentation/accessories/camera.html#camera-module-3' },
  camsw: { t: 'Raspberry Pi documentation — rpicam-hello and rpicam-still', u: 'https://www.raspberrypi.com/documentation/computers/camera_software.html' },
  camtr: { t: 'Raspberry Pi documentation — Camera troubleshooting', u: 'https://www.raspberrypi.com/documentation/accessories/camera.html' },
  magpi45: { t: 'Raspberry Pi Official Magazine issue 45 — correction about the ribbon cable (blue side faces the Ethernet/USB ports)', u: 'https://magazine.raspberrypi.com/issues/45' },
  tonal: { t: 'GPIO Zero documentation — Buzzer and TonalBuzzer (API and source)', u: 'https://gpiozero.readthedocs.io/en/stable/api_output.html#tonalbuzzer' },
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

export const PI_PWM = `from gpiozero import PWMLED
from time import sleep

led = PWMLED(17)

while True:
    led.value = 0  # off
    sleep(1)
    led.value = 0.5  # half brightness
    sleep(1)
    led.value = 1  # full brightness
    sleep(1)`;

export const PI_I2C = `import time
import board
import adafruit_sht31d

i2c = board.I2C()  # uses board.SCL and board.SDA
sensor = adafruit_sht31d.SHT31D(i2c)

while True:
    print(f"\\nTemperature: {sensor.temperature:0.1f} C")
    print(f"Humidity: {sensor.relative_humidity:0.1f} %")
    time.sleep(2)`;

export const PI_WEB = `from flask import Flask
from gpiozero import LED

app = Flask(__name__)
led = LED(17)

@app.route("/")
def home():
    state = "ON" if led.is_lit else "OFF"
    return f"<h1>LED is {state}</h1><a href='/on'>Turn on</a> <a href='/off'>Turn off</a>"

@app.route("/on")
def turn_on():
    led.on()
    return home()

@app.route("/off")
def turn_off():
    led.off()
    return home()`;

export const PI_PANEL = `from flask import Flask, redirect
from gpiozero import LED
import board
import adafruit_sht31d

app = Flask(__name__)
led = LED(17)
sensor = adafruit_sht31d.SHT31D(board.I2C())

@app.route("/")
def home():
    state = "ON" if led.is_lit else "OFF"
    return (
        "<meta http-equiv='refresh' content='5'>"
        "<h1>Pi control panel</h1>"
        f"<p>Temperature: {sensor.temperature:0.1f} C</p>"
        f"<p>Humidity: {sensor.relative_humidity:0.1f} %</p>"
        f"<p>LED is {state}</p>"
        "<a href='/on'>Turn on</a> <a href='/off'>Turn off</a>"
    )

@app.route("/on")
def turn_on():
    led.on()
    return redirect("/")

@app.route("/off")
def turn_off():
    led.off()
    return redirect("/")`;

export const PI_TONE = `from gpiozero import TonalBuzzer
from time import sleep

buzzer = TonalBuzzer(17)

notes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"]

for note in notes:
    buzzer.play(note)
    sleep(0.4)

buzzer.stop()`;

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
export const PI_I2C_PARTS = [
  { id: 'sen1', type: 'sht31', row: 'g', col: 10 },
  { id: 'w1', type: 'fwire', from: 'p1', to: 'j10', color: 'red', lift: 24 },
  { id: 'w2', type: 'fwire', from: 'p6', to: 'j11', color: 'black', lift: 34 },
  { id: 'w3', type: 'fwire', from: 'p5', to: 'j12', color: 'yellow', lift: 44 },
  { id: 'w4', type: 'fwire', from: 'p3', to: 'j13', color: 'blue', lift: 54 },
];
const I2C_IDS = PI_I2C_PARTS.map(d => d.id);
const IO_I2C = { kind: 'i2c', item: 'sen1', needs: I2C_IDS };
export const PI_PANEL_PARTS = [
  ...PI_LED_PARTS,
  { id: 'sen2', type: 'sht31', row: 'g', col: 20 },
  { id: 'w5', type: 'fwire', from: 'p1', to: 'j20', color: 'red', lift: 30 },
  { id: 'w6', type: 'fwire', from: 'p6', to: 'j21', color: 'black', lift: 40 },
  { id: 'w7', type: 'fwire', from: 'p5', to: 'j22', color: 'yellow', lift: 50 },
  { id: 'w8', type: 'fwire', from: 'p3', to: 'j23', color: 'blue', lift: 60 },
];
const PANEL_IDS = PI_PANEL_PARTS.map(d => d.id);
const IO_PANEL_LED = { kind: 'led', item: 'led1', needs: PANEL_IDS };
const IO_PANEL_I2C = { kind: 'i2c', item: 'sen2', needs: PANEL_IDS };
export const PI_BUZ_PARTS = [
  { id: 'r1', type: 'resistor', a: 'i8', b: 'i12' },
  { id: 'bz1', type: 'buzzer', plus: 'g12', minus: 'g15' },
  { id: 'w1', type: 'fwire', from: 'p11', to: 'j8', color: 'orange', lift: 26 },
  { id: 'w2', type: 'fwire', from: 'p9', to: 'j15', color: 'black', lift: 36 },
];
const BUZ_IDS = PI_BUZ_PARTS.map(d => d.id);
const IO_BUZ = { kind: 'buzzer', item: 'bz1', needs: BUZ_IDS };
const IO_BTN = { kind: 'button', item: 'btn1', needs: BTN_IDS };

// Practice terminal (Lesson 8). Each meaning is taken from the official Raspberry Pi documentation (see 'src').
// The docs do not print the exact output of these commands, so the practice terminal explains instead of inventing output.
export const TERM_CMDS = [
  // ---- system
  { g: 'System', cmd: 'sudo poweroff', does: 'Shuts the Raspberry Pi down safely. When the green ACT LED shows a series of short flashes, it is safe to unplug the power.', src: 'Getting started — Shutdown options' },
  { g: 'System', cmd: 'sudo reboot', does: 'Restarts the Raspberry Pi.', src: 'Getting started — Shutdown options' },
  { g: 'System', cmd: 'sudo apt update', does: 'Refreshes the list of available software packages (it does not install anything yet).', src: 'Updating Raspberry Pi OS' },
  { g: 'System', cmd: 'sudo apt full-upgrade', does: 'Downloads and installs the newest versions of your installed packages. Raspberry Pi recommends full-upgrade instead of the standard upgrade.', src: 'Updating Raspberry Pi OS' },
  { g: 'System', cmd: 'sudo raspi-config', does: 'Opens the Raspberry Pi configuration tool (text menus) — Wi-Fi, interfaces such as I²C, boot options and more.', src: 'Getting started — Configuration' },
  { g: 'System', cmd: 'vcgencmd measure_temp', does: 'Shows the current temperature of the processor. Raspberry Pi says this command gives an accurate, instantaneous reading because it asks the GPU directly.', src: 'Frequency management and thermal control' },
  { g: 'System', cmd: 'df -h', does: 'Shows how much disk space is free on the microSD card. Raspberry Pi suggests checking this before a big update.', src: 'Updating Raspberry Pi OS' },
  { g: 'System', cmd: 'uname -r', does: 'Shows the version of the Linux kernel your Raspberry Pi is running.', src: 'Linux kernel — check your kernel' },
  { g: 'System', cmd: 'pinout', does: 'Prints a map of the GPIO pins of your board: physical pin numbers, GPIO numbers and functions (from the GPIO Zero library).', src: 'GPIO — pinout map' },
  // ---- files and folders
  { g: 'Files and folders', cmd: 'ls', does: 'Lists the files and folders in the current folder.', src: 'External storage; Users' },
  { g: 'Files and folders', cmd: 'ls -la', does: 'Lists the files in the current folder, including hidden ones (names starting with a dot), with details.', src: 'Users' },
  { g: 'Files and folders', cmd: 'mkdir shared', does: 'Makes a new folder (here called shared) in the current folder. mkdir = “make directory”.', src: 'Samba — sharing a folder', re: /^mkdir \S+$/ },
  { g: 'Files and folders', cmd: 'cd shared', does: 'Goes into a folder. cd = “change directory”. cd ~ goes back to your home folder; cd /home/<username> also works.', src: 'Users; Samba', re: /^cd \S+$/ },
  { g: 'Files and folders', cmd: 'cd ~', does: 'Goes back to your home folder (the ~ symbol means “my home folder”).', src: 'Samba — sharing a folder' },
  { g: 'Files and folders', cmd: 'touch notes.txt', does: 'Creates an empty file (here called notes.txt).', src: 'SSH — enable SSH', re: /^touch \S+$/ },
  { g: 'Files and folders', cmd: 'cp notes.txt backup.txt', does: 'Copies a file: the first name is the original, the second is the copy.', src: 'Building a kernel (backup copy)', re: /^cp \S+ \S+$/ },
  { g: 'Files and folders', cmd: 'cat notes.txt', does: 'Prints the contents of a file on the screen. An empty file prints nothing.', src: 'NFS (checking /etc/group)', re: /^cat \S+$/ },
  { g: 'Files and folders', cmd: 'rm backup.txt', does: 'Deletes a file. There is no recycle bin — a deleted file cannot be brought back. Be careful.', src: 'Network boot (removing files)', re: /^rm \S+$/ },
  { g: 'Files and folders', cmd: 'sudo nano /boot/firmware/config.txt', does: 'Opens the text editor nano on a settings file. Save with Ctrl+O, exit with Ctrl+X. config.txt holds Raspberry Pi boot settings — only change it when a guide tells you to.', src: 'Configuration — interfaces' },
  { g: 'Files and folders', cmd: 'ls -l /home', does: 'Lists the user accounts: every user has a folder inside /home.', src: 'Users' },
  { g: 'Files and folders', cmd: 'groups', does: 'Shows which groups your user belongs to (for example the gpio group that allows GPIO access).', src: 'Users; GPIO — permissions' },
  { g: 'Files and folders', cmd: 'passwd', does: 'Changes your password.', src: 'Users' },
  // ---- network
  { g: 'Network', cmd: 'hostname -I', does: 'Prints your Raspberry Pi’s local IP address. You need it to connect from another computer.', src: 'Remote access — find your IP address' },
  { g: 'Network', cmd: 'ping raspberrypi.local', does: 'Checks that a computer on your network answers. The default hostname of a fresh Raspberry Pi OS is raspberrypi, so raspberrypi.local reaches it (if you changed the hostname, use the new one). Press Ctrl+C to stop.', src: 'Remote access — find your IP address', re: /^ping \S+$/ },
  { g: 'Network', cmd: 'ssh user@192.168.1.131', does: 'Run on ANOTHER computer: logs in to your Raspberry Pi remotely (replace user and the IP address with yours). Needs SSH enabled on the Pi; at the first connection you must type yes at a security warning.', src: 'Remote access — SSH', re: /^ssh \S+@\S+$/ },
  { g: 'Camera', only: 'p13', cmd: 'rpicam-hello', does: 'Shows a preview window with the picture from the camera for five seconds (the default timeout).', src: 'Camera software — rpicam-hello' },
  { g: 'Camera', only: 'p13', cmd: 'rpicam-hello --timeout 0', does: 'A timeout of 0 runs the preview without end. Press Ctrl+C in the terminal to stop it.', src: 'Camera software — rpicam-hello' },
  { g: 'Camera', only: 'p13', cmd: 'rpicam-hello -n', does: 'The -n option (nopreview) suppresses the preview window.', src: 'Camera software — rpicam-hello' },
  { g: 'Camera', only: 'p13', cmd: 'rpicam-still --output test.jpg', does: 'Takes a full-resolution picture and saves it in a file called test.jpg. The preview shows for five seconds first.', src: 'Camera software — rpicam-still', re: /^rpicam-still --output [\w.\-]+$/ },
  { g: 'Camera', only: 'p13', cmd: 'rpicam-still --encoding png --output test.png', does: 'Saves the picture as a PNG file. The encoding option decides the format; the file name does not.', src: 'Camera software — rpicam-still' },
  { g: 'Python', cmd: 'python3', does: 'Starts Python 3, which comes pre-installed with Raspberry Pi OS.', src: 'Using Python' },
];

export const PI_RGB = `from gpiozero import RGBLED
from time import sleep

led = RGBLED(red=18, green=12, blue=13)   # GPIO18, GPIO12, GPIO13 (pins 12, 32, 33)

while True:
    led.color = (1, 0, 0)    # red
    sleep(1)
    led.color = (0, 1, 0)    # green
    sleep(1)
    led.color = (0, 0, 1)    # blue
    sleep(1)
    led.color = (1, 1, 0)    # red + green = yellow
    sleep(1)
    led.color = (1, 1, 1)    # all three = white
    sleep(1)
    led.color = (0, 0, 0)    # off
    sleep(1)`;

export const PI_DHT = `import time
import board
import adafruit_dht

dht = adafruit_dht.DHT22(board.D18)   # DATA wire on GPIO18 (pin 12)

while True:
    try:
        temperature = dht.temperature     # degrees Celsius
        humidity = dht.humidity           # percent
        print(f"Temp: {temperature:.1f} C  Humidity: {humidity:.1f} %")
    except RuntimeError as error:
        print("Read failed:", error.args[0])   # this happens now and then: just try again
    time.sleep(2)`;

export const PI_ENC = `from gpiozero import Button
from time import sleep

clk = Button(17)   # CLK on GPIO17 (pin 11). Button uses the pull-up: pressed = LOW
dt = Button(27)    # DT on GPIO27 (pin 13)
sw = Button(22)    # SW on GPIO22 (pin 15)
counter = 0
last_clk = clk.is_pressed

while True:
    now = clk.is_pressed                    # True while CLK is LOW
    if now and not last_clk:                # CLK just fell: one step
        if not dt.is_pressed:               # DT is still HIGH: one direction
            counter += 1
        else:                               # DT is already LOW: the other direction
            counter -= 1
        print(counter)
    last_clk = now
    if sw.is_pressed:                       # knob pressed
        print("Knob pressed")
        sleep(0.3)
    sleep(0.002)`;


// ---- lessons 14-16: RGB LED on GPIO18/12/13 (3 x 220 ohm), DHT22 on GPIO18 with a 4.7 kOhm pull-up to 3V3, rotary encoder on GPIO17/27/22
export const PI_RGB_PARTS = [
  { id: 'rgb1', type: 'rgbled', row: 'e', col: 10 },
  { id: 'r1', type: 'resistor', a: 'a10', b: 'a16' },
  { id: 'r2', type: 'resistor', a: 'a12', b: 'a17' },
  { id: 'r3', type: 'resistor', a: 'a13', b: 'a18' },
  { id: 'w50', type: 'fwire', from: 'p12', to: 'b16', color: 'red', lift: 24 },
  { id: 'w51', type: 'fwire', from: 'p32', to: 'b17', color: 'green', lift: 34 },
  { id: 'w52', type: 'fwire', from: 'p33', to: 'b18', color: 'blue', lift: 44 },
  { id: 'w53', type: 'fwire', from: 'p34', to: 'a11', color: 'black', lift: 30 },
];
const RGB_IDS = PI_RGB_PARTS.map(d => d.id);
export const PI_DHT_PARTS = [
  { id: 'dht1', type: 'dht', model: 'dht22', row: 'e', col: 10 },
  { id: 'w60', type: 'fwire', from: 'p1', to: 'a10', color: 'red', lift: 24 },
  { id: 'w61', type: 'fwire', from: 'p12', to: 'a11', color: 'yellow', lift: 34 },
  { id: 'w62', type: 'fwire', from: 'p6', to: 'a13', color: 'black', lift: 44 },
  { id: 'r60', type: 'resistor', a: 'c10', b: 'c16', ohms: 4700 },
  { id: 'w63', type: 'wire', from: 'b11', to: 'b16', color: 'orange', lift: 12 },
];
const DHT_IDS = PI_DHT_PARTS.map(d => d.id);
export const PI_ENC_PARTS = [
  { id: 'enc1', type: 'encoder', row: 'g', col: 10 },
  { id: 'w80', type: 'fwire', from: 'p11', to: 'j10', color: 'green', lift: 24 },
  { id: 'w81', type: 'fwire', from: 'p13', to: 'j11', color: 'blue', lift: 34 },
  { id: 'w82', type: 'fwire', from: 'p15', to: 'j12', color: 'yellow', lift: 44 },
  { id: 'w83', type: 'fwire', from: 'p1', to: 'j13', color: 'red', lift: 54 },
  { id: 'w84', type: 'fwire', from: 'p6', to: 'j14', color: 'black', lift: 64 },
];
const ENC_IDS = PI_ENC_PARTS.map(d => d.id);

export const PI_LCD = `from RPLCD.i2c import CharLCD
from time import sleep

lcd = CharLCD('PCF8574', 0x27, cols=16, rows=2)   # I2C expander, address 0x27, 16 x 2
lcd.write_string("Hello, Pi 4!")                   # top line
seconds = 0

while True:
    lcd.cursor_pos = (1, 0)                        # (row, column): bottom line, column 0
    lcd.write_string(f"Seconds: {seconds}")
    seconds += 1
    sleep(1)`;

export const PI_OLED = `import board
import adafruit_ssd1306

i2c = board.I2C()                                              # SCL = pin 5, SDA = pin 3
oled = adafruit_ssd1306.SSD1306_I2C(128, 64, i2c, addr=0x3C)   # 128 x 64 pixels, address 0x3C

oled.fill(0)                          # clear the buffer
oled.text("Hello, Pi 4!", 0, 0, 1)    # text, x, y, colour (1 = pixel on)
oled.text("OLED 128 x 64", 0, 12, 1)
oled.show()                           # send the buffer to the screen`;

export const PI_NEO = `import time
import board
import neopixel

pixels = neopixel.NeoPixel(board.D18, 8, brightness=0.15, auto_write=False)   # 8 pixels, data on GPIO18

while True:
    for i in range(8):
        pixels.fill((0, 0, 0))          # all pixels off
        pixels[i] = (255, 0, 0)         # pixel i red
        pixels.show()                   # send the colours to the strip
        time.sleep(0.15)`;


// ---- lessons 17-19: I2C displays and a NeoPixel strip on the desk, to the right of the Raspberry Pi
const piDisp = (type, id, vcc, order, first) => [{ id, type, x: 125, z: -45 },
  ...order.map((n, i) => ({ id: 'm' + first + i, type: 'fwire', from: id + '.' + n, to: 'a' + (10 + i), color: { GND: 'black', VCC: 'red', SDA: 'blue', SCL: 'yellow' }[n], lift: 16 + i * 2 })),
  ...order.map((n, i) => ({ id: 'w' + first + i, type: 'fwire', from: { GND: 'p6', VCC: vcc, SDA: 'p3', SCL: 'p5' }[n], to: 'b' + (10 + i), color: { GND: 'black', VCC: 'red', SDA: 'blue', SCL: 'yellow' }[n], lift: 26 + i * 4 }))];
export const PI_LCD_PARTS = piDisp('lcd1602', 'lcd1', 'p2', ['GND', 'VCC', 'SDA', 'SCL'], 9);
const LCD_IDS = PI_LCD_PARTS.map(d => d.id);
export const PI_OLED_PARTS = piDisp('oled', 'oled1', 'p1', ['GND', 'VCC', 'SCL', 'SDA'], 8);
const OLED_IDS = PI_OLED_PARTS.map(d => d.id);
export const PI_NEO_PARTS = [
  { id: 'neo1', type: 'neopixel', x: 110, z: -20 },
  { id: 'l60', type: 'lead', from: 'neo1.VCC', to: 'a10', color: 'red', lift: 20 },
  { id: 'l61', type: 'lead', from: 'neo1.DIN', to: 'a11', color: 'yellow', lift: 24 },
  { id: 'l62', type: 'lead', from: 'neo1.GND', to: 'a12', color: 'black', lift: 28 },
  { id: 'w60', type: 'fwire', from: 'p2', to: 'b10', color: 'red', lift: 26 },
  { id: 'w61', type: 'fwire', from: 'p12', to: 'b11', color: 'yellow', lift: 32 },
  { id: 'w62', type: 'fwire', from: 'p6', to: 'b12', color: 'black', lift: 38 },
];
const NEO_IDS = PI_NEO_PARTS.map(d => d.id);

export const PI_MODULES = { 1: 'Module 1 — Getting started', 2: 'Module 2 — GPIO with Python', 3: 'Module 3 — Working on the Pi', 4: 'Module 4 — Sensors', 5: 'Module 5 — Web', 6: 'Module 6 — Final project', 7: 'Module 7 — Extra: sound', 8: 'Module 8 — Camera', 9: 'Module 9 — Light and climate', 10: 'Module 10 — Controls', 11: 'Module 11 — Displays' };

export const PI_LESSONS = [
  // ================================================================== P1
  {
    id: 'p1', num: 1, module: 1, title: 'Meet the Raspberry Pi 4', level: 'Start here', time: '10 min',
    goal: 'Know every part of the Raspberry Pi 4 Model B and what it is for.',
    hardware: ['Raspberry Pi 4 Model B'],
    steps: [
      {
        title: 'A complete computer on one board', view: 'home', power: false,
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
        body: `<ul><li><b>USB-C</b> is the <b>power input</b>: <b>5 V, 3 A</b> (the official 15 W supply). It cannot be used to connect a monitor.</li><li><b>Red PWR LED</b>: on = the 5 V supply is stable; off or flickering = undervoltage (supply too weak).</li>
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
        title: 'Connect the monitor', view: 'pidesk', acc: ['sd', 'hdmi', 'monitor'],
        body: `<p>Plug the small end of the micro-HDMI cable into <b>HDMI0</b> (the one next to the power socket) and the big end into the monitor.</p>
        <p class="tip">If the monitor has several HDMI inputs, select the input you plugged into.</p>`,
      },
      {
        title: 'Keyboard and mouse', view: 'piports', acc: ['sd', 'hdmi', 'monitor', 'kbd', 'mouse'],
        body: `<p>Plug the keyboard and the mouse into the <b>black USB 2.0 ports</b>. That keeps the blue USB 3.0 ports free for fast devices.</p>
        <p class="tip">Connect USB devices <b>before</b> switching on: plugging in a power-hungry device while running can make the voltage drop and the board restart.</p>`,
      },
      {
        title: 'Power last', view: 'pidesk', acc: ['sd', 'hdmi', 'monitor', 'kbd', 'mouse'], power: true, action: 'piboot',
        body: `<p>Power is always the <b>last</b> connection. Plug in the USB-C supply — the Raspberry Pi starts immediately (it has no power button).</p>
        <ul><li><b>Red PWR LED</b> on: the supply is good.</li><li><b>Green ACT LED</b> flickers: the microSD card is being read.</li></ul>
        <p class="sim">The flicker of the ACT LED is simulated here.</p>`,
      },
      {
        title: 'First boot', view: 'pidesk', acc: ['sd', 'hdmi', 'monitor', 'kbd', 'mouse'],
        body: `<p>If you did the customisation in Imager, Raspberry Pi OS starts with your settings. If you skipped it, a <b>configuration wizard</b> asks for the same information (country, user, password, Wi-Fi) on the first boot.</p>
        <p class="tip">If it does not boot within about 5 minutes, look at the green ACT LED: its flash pattern tells you what is wrong.</p>`,
      },
      {
        title: 'Shut down safely', view: 'pidesk', acc: ['sd', 'hdmi', 'monitor', 'kbd', 'mouse'],
        body: `<p>Never just pull the plug while the system is running — the microSD card may be in the middle of writing. Shut down from the menu, or in a Terminal type:</p>
        <pre class="tree">sudo poweroff</pre>
        <p>When the green ACT LED shows a <b>series of short flashes</b>, it is safe to unplug the power cable.</p>`,
      },
      {
        title: 'Summary', view: 'pidesk', acc: ['sd', 'hdmi', 'monitor', 'kbd', 'mouse'],
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
  // ================================================================== P7
  {
    id: 'p7', num: 7, module: 2, title: 'Fade an LED with PWM', level: 'Beginner', time: '15 min',
    goal: 'Set the brightness of the LED with PWMLED: values from 0 (off) to 1 (full).',
    hardware: ['Lesson 4 circuit (LED on GPIO17)'],
    code: PI_PWM, file: 'pwm_led.py', program: 'pi_pwm', fast: true,
    circuit: PI_LED_PARTS, io: { p11: IO_LED }, led: true,
    explain: {
      1: 'Take <b>PWMLED</b>: an LED whose brightness you can set (instead of only on / off).',
      2: 'Take <b>sleep</b>.',
      4: '<b>PWMLED(17)</b>: the same LED on GPIO17 (pin 11), now with variable brightness. The pin pulses at <b>100 Hz</b> by default (GPIO Zero source).',
      6: 'Repeat forever.',
      7: '<b>led.value = 0</b>: brightness 0 = off. Values run from <b>0 to 1</b>.',
      8: 'Wait 1 second.',
      9: '<b>0.5</b>: the pin is HIGH half of the time → half brightness.',
      10: 'Wait 1 second.',
      11: '<b>1</b>: HIGH all the time → full brightness.',
      12: 'Wait 1 second, then start again.',
    },
    steps: [
      {
        title: 'What is PWM?', view: 'pibench', have: PI_LED_PARTS.map(d => d.id), power: false,
        body: `<p>A GPIO pin is either <b>HIGH (3.3 V)</b> or <b>LOW (0 V)</b> — it cannot output 1.65 V. <b>PWM</b> (pulse-width modulation) fakes in-between brightness by switching the pin on and off <b>very fast</b> (100 times per second here). The LED follows the <b>fraction of time it is on</b> — the <b>duty cycle</b>.</p>
        <table class="kv"><tr><th>value</th><th>pin is HIGH</th><th>average voltage</th></tr><tr><td>0</td><td>never</td><td>0 V</td></tr><tr><td>0.5</td><td>half of the time</td><td>≈ 1.65 V</td></tr><tr><td>1</td><td>always</td><td>3.3 V</td></tr></table>
        <p class="tip">Your eye cannot see 100 flashes per second, so it sees one steady, dimmer light.</p>`,
      },
      {
        title: 'The same circuit', view: 'pibench', have: PI_LED_PARTS.map(d => d.id), pins: ['p11', 'p9'],
        body: `<p>No new wiring: LED and 220 Ω resistor on <b>GPIO17 (pin 11)</b>, ground on <b>pin 9</b>, exactly as in Lesson 4. Only the program changes.</p>
        <p class="sim">The Raspberry Pi 4 datasheet lists up to two PWM channels (PWM0 and PWM1) on the GPIO pins — for example on GPIO12 and GPIO13.</p>`,
      },
      { title: 'The program', view: 'pibench', showCode: true, power: true, body: `<p>The official “LED with variable brightness” example. Click any line to read about it.</p>` },
      {
        title: 'Run it', view: 'pibench', showCode: true, power: true, action: 'run',
        body: `<p>Every second the brightness changes: <b>off → half → full</b>. Watch the line <code>led.value = …</code>, the pin panel (duty and average voltage) and the LED.</p>
        <p class="sim">Simulated. The LED drawing shows the brightness level; the real pulses are too fast to see.</p>`,
      },
      {
        title: 'Fading automatically', view: 'pibench', power: true,
        body: `<p>The documentation has an even shorter program: <code>led.pulse()</code> fades the LED in and out continuously.</p>
        <pre class="tree">from gpiozero import PWMLED
from signal import pause

led = PWMLED(17)
led.pulse()
pause()</pre>
        <p><code>pause()</code> keeps the script alive — without it the program would end and the LED would stop.</p>`,
      },
      {
        title: 'Summary', view: 'pibench', power: true,
        body: `<ul><li><code>PWMLED(17)</code>; <code>led.value</code> from <b>0</b> (off) to <b>1</b> (full).</li><li>PWM switches the pin fast; brightness = fraction of time HIGH.</li><li>Default frequency 100 Hz; <code>pulse()</code> fades automatically.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What value gives half brightness with PWMLED?', a: ['0', '0.5', '50', '255'], c: 1, why: 'PWMLED values run from 0 to 1; 0.5 is half.' },
      { q: 'What does PWM do?', a: ['Makes the pin output 1.65 V', 'Switches the pin on and off very fast; the on-time fraction sets brightness', 'Raises the voltage to 5 V', 'Slows the CPU'], c: 1, why: 'The pin is only ever 0 V or 3.3 V; the duty cycle sets the average.' },
      { q: 'Average voltage at value 0.5 (3.3 V pin)?', a: ['0 V', '1.65 V', '3.3 V', '5 V'], c: 1, why: '0.5 × 3.3 V ≈ 1.65 V.' },
      { q: 'Default PWMLED frequency in GPIO Zero?', a: ['1 Hz', '100 Hz', '1 kHz', '1 MHz'], c: 1, why: 'GPIO Zero PWMOutputDevice: frequency defaults to 100 Hz.' },
    ],
    sources: [SRC_PI.usegpio, SRC_PI.gpiozero, SRC_PI.ds, SRC_PI.gpio],
  },
  // ================================================================== P8
  {
    id: 'p8', num: 8, module: 3, title: 'The Terminal: type commands, see the board react', level: 'Beginner', time: '20 min',
    goal: 'Type commands in the Terminal on the Raspberry Pi desktop and watch the screen and the board react.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Monitor, keyboard, mouse'],
    steps: [
      {
        title: 'The Terminal on the desktop', view: 'pidesk', acc: ['sd', 'hdmi', 'monitor', 'kbd', 'mouse'], power: true,
        body: `<p>Look at the <b>monitor</b> in the 3D view: it shows the Raspberry Pi’s desktop with a <b>Terminal</b> window. The Terminal is where you give the computer <b>written commands</b> instead of clicking.</p>
        <p>Its last line is the <b>prompt</b>: <code>user@raspberrypi:~ $</code>. It tells you who you are, the name of the computer, and the folder you are in (<code>~</code> = your home folder). In the documentation commands are written with a <b>$</b> in front: you type only what comes after it, then press <b>Enter</b>.</p>
        <p class="sim">The desktop is an illustration (the real one looks slightly different), and the results are simulated. The commands themselves are the real ones.</p>`,
      },
      {
        title: 'sudo: run as the administrator', view: 'pidesk',
        body: `<p>Many commands start with <code>sudo</code>: “run this as the <b>superuser</b> (administrator)”. These commands can change the whole system, so the Raspberry Pi asks for <b>your password</b> first.</p>
        <p class="warn"><b>Read a command before you press Enter</b>, especially after <code>sudo</code>. Only run commands from sources you trust, such as the official Raspberry Pi documentation.</p>`,
      },
      {
        title: 'Try the commands', view: 'pidesk',
        body: `<p>Click a command below (or type it and press <b>Enter</b>). <b>Watch the monitor</b> — and the <b>LEDs on the board</b>:</p>
        <ul><li><code>vcgencmd measure_temp</code> → the processor temperature appears on the screen.</li><li><code>pinout</code> → the GPIO pin map is printed.</li><li><code>sudo apt update</code> → the <b>green ACT LED flickers</b> (the microSD card is being used).</li><li><code>sudo reboot</code> → screen goes dark, the board restarts, the desktop returns.</li><li><code>sudo poweroff</code> → the ACT LED gives its short “safe to unplug” flashes, then the red <b>PWR LED goes out</b>.</li></ul>
        <div class="term"><div class="term-out"><div class="term-hint">What the command does appears here; the result appears on the monitor.</div></div>
        <div class="term-row"><span class="term-ps">$</span><input class="term-in" placeholder="type a command and press Enter" autocomplete="off" spellcheck="false"></div>
        <div class="term-chips"></div></div>
        <p class="sim">Exact outputs differ on your Raspberry Pi (versions, names, numbers). The temperature shown here is made up.</p>`,
      },
      {
        title: 'Files and folders — build something', view: 'pidesk',
        body: `<p>Try this little exercise in order. <b>Watch the monitor</b>: what you create really appears.</p>
        <ol><li><code>mkdir shared</code> — make a folder</li><li><code>ls</code> — the folder is listed</li><li><code>cd shared</code> — go inside (the prompt now shows <code>~/shared</code>)</li><li><code>touch notes.txt</code> — create an empty file</li><li><code>cp notes.txt backup.txt</code> — copy it</li><li><code>ls -la</code> — both files are there</li><li><code>rm backup.txt</code> — delete the copy</li><li><code>cd ~</code> — back home</li></ol>
        <p class="warn"><b>rm cannot be undone.</b> There is no recycle bin, so check the name before you press Enter.</p>
        <p class="sim">The folders and files exist only in this practice Terminal.</p>`,
      },
      {
        title: 'Find your Pi on the network', view: 'pidesk',
        body: `<p>Later lessons (and remote access) need your Raspberry Pi’s <b>IP address</b>:</p>
        <ul><li><code>hostname -I</code> — prints your local IP address. (On the desktop you can also hover the mouse over the network icon.)</li><li><code>ping raspberrypi.local</code> — checks that it answers. A fresh Raspberry Pi OS is called <b>raspberrypi</b>; if you chose another hostname in Imager, use that.</li><li><code>ssh user@ip-address</code> — typed on <b>another computer</b> to log in to the Pi remotely (SSH must be enabled).</li></ul>
        <p class="sim">The IP address shown in the practice terminal is the example address from the official documentation.</p>`,
      },
      {
        title: 'Keep the software up to date', view: 'pidesk',
        body: `<p>Raspberry Pi’s documentation gives two commands, in this order:</p>
        <ol><li><code>sudo apt update</code> — refresh the list of available software.</li><li><code>sudo apt full-upgrade</code> — install the newest versions.</li></ol>
        <p>Try both in the practice terminal. Before a big update, check that you have enough free disk space on the microSD card.</p>`,
      },
      {
        title: 'Python is already there', view: 'pidesk',
        body: `<p>Raspberry Pi OS comes with <b>Python 3</b> pre-installed — you used it in Lessons 4–7 through the GPIO Zero library.</p>
        <p class="warn">Do not interfere with the system’s own Python: it can break your operating system. To install extra Python libraries use <code>sudo apt install python3-xyz</code> (xyz = the package), or create a <b>virtual environment</b> with <code>python3 -m venv path/to/venv</code> and use the <code>python</code> and <code>pip</code> inside it (documentation).</p>`,
      },
      {
        title: 'Summary', view: 'pidesk',
        body: `<ul><li>The Terminal takes typed commands; the <b>$</b> is the prompt, not typed.</li><li><code>sudo</code> = run as administrator (asks for your password) — read before you press Enter.</li><li>System: <code>sudo poweroff</code>, <code>sudo reboot</code>, <code>sudo apt update</code>, <code>sudo apt full-upgrade</code>, <code>vcgencmd measure_temp</code>, <code>df -h</code>, <code>uname -r</code>, <code>pinout</code>.</li><li>Files: <code>ls</code>, <code>cd</code>, <code>mkdir</code>, <code>touch</code>, <code>cp</code>, <code>cat</code>, <code>rm</code> (no undo!), <code>sudo nano</code>.</li><li>Network: <code>hostname -I</code>, <code>ping</code>, <code>ssh</code>.</li><li>Python 3 is pre-installed; use <code>apt</code> or a virtual environment for extra libraries.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'In “$ sudo poweroff”, what do you type?', a: ['$ sudo poweroff', 'sudo poweroff', 'poweroff only', 'sudo'], c: 1, why: 'The $ is the prompt, shown by the computer.' },
      { q: 'What does sudo do?', a: ['Deletes files', 'Runs the command as the superuser (administrator)', 'Starts Python', 'Opens the desktop'], c: 1, why: 'sudo = superuser do; it asks for your password.' },
      { q: 'Which command gives an accurate reading of the processor temperature?', a: ['pinout', 'groups', 'vcgencmd measure_temp', 'sudo reboot'], c: 2, why: 'Raspberry Pi: vcgencmd communicates with the GPU directly and gives an accurate, instantaneous reading.' },
      { q: 'Which two commands update the software, in order?', a: ['sudo reboot, then sudo poweroff', 'sudo apt update, then sudo apt full-upgrade', 'passwd, then groups', 'ls -la, then cd'], c: 1, why: 'First refresh the package list, then install the newest versions.' },
      { q: 'Which command creates a new folder?', a: ['touch', 'mkdir', 'cat', 'cp'], c: 1, why: 'mkdir = make directory (folder); touch creates an empty file.' },
      { q: 'Which command prints your Raspberry Pi’s local IP address?', a: ['hostname -I', 'uname -r', 'df -h', 'pinout'], c: 0, why: 'hostname -I outputs the local IP address (Remote access documentation).' },
      { q: 'Why be careful with rm?', a: ['It restarts the Pi', 'A deleted file cannot be brought back (no recycle bin)', 'It needs 5 V', 'It deletes the monitor'], c: 1, why: 'rm deletes permanently.' },
      { q: 'What tells you it is safe to unplug the power after sudo poweroff?', a: ['The PWR LED turns blue', 'The green ACT LED shows a series of short flashes', 'The monitor turns on', 'Nothing'], c: 1, why: 'Raspberry Pi: the green activity LED briefly displays a series of short flashes when it is safe to remove the power cable.' },
    ],
    sources: [SRC_PI.setup, SRC_PI.osupdate, SRC_PI.users, SRC_PI.thermal, SRC_PI.gpio, SRC_PI.python, SRC_PI.leds, SRC_PI.remote, SRC_PI.kernel],
  },
  // ================================================================== P9
  {
    id: 'p9', num: 9, module: 4, title: 'Read an I²C sensor: temperature and humidity', level: 'Intermediate', time: '25 min',
    goal: 'Wire a digital I²C sensor with four wires, turn I²C on, and read temperature and humidity with Python.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Breadboard', 'Adafruit SHT31-D breakout with header pins', '4 × female–male jumper wires'],
    code: PI_I2C, file: 'sht31.py', program: 'pi_i2c', fast: true, widgets: ['pisens'],
    circuit: PI_I2C_PARTS, io: { p3: IO_I2C },
    explain: {
      1: 'The <b>time</b> library, for <code>sleep</code>.',
      2: '<b>board</b> (from Adafruit Blinka) knows the Raspberry Pi’s pin names, such as <code>board.SCL</code> and <code>board.SDA</code>.',
      3: 'The <b>driver</b> for the SHT31-D sensor.',
      5: '<b>board.I2C()</b> opens the I²C bus on the pins <b>SCL (pin 5)</b> and <b>SDA (pin 3)</b>.',
      6: 'Create the sensor object. It looks for the sensor at I²C address <b>0x44</b> (the default). If nobody answers, Python raises an error.',
      8: 'Repeat forever.',
      9: '<b>sensor.temperature</b> asks the sensor for a measurement and returns the temperature in °C. <code>:0.1f</code> prints one decimal; <code>\\n</code> starts with a blank line.',
      10: '<b>sensor.relative_humidity</b>: relative humidity in %.',
      11: 'Wait 2 seconds, then measure again.',
    },
    steps: [
      {
        title: 'What is I²C?', view: 'pibench', have: [], power: false,
        body: `<p><b>I²C</b> (“eye-squared-see”) lets the Raspberry Pi talk to sensors with <b>two signal wires</b>:</p>
        <table class="kv"><tr><th>Wire</th><th>Job</th><th>Raspberry Pi pin</th></tr><tr><td><b>SDA</b></td><td>the <b>data</b></td><td>pin 3 (GPIO2)</td></tr><tr><td><b>SCL</b></td><td>the <b>clock</b></td><td>pin 5 (GPIO3)</td></tr></table>
        <p>Each device has its own <b>address</b>. The Raspberry Pi calls an address and only that device answers. These two pins already have <b>1.8 kΩ pull-up resistors</b> to 3.3 V on the Raspberry Pi board.</p>
        <p class="tip">You met the same idea on the UNO Q with Qwiic. Here we wire the four wires ourselves.</p>`,
      },
      {
        title: 'The sensor: SHT31-D', view: 'pibb', have: ['sen1'], power: false, holes: ['g10 · VIN', 'g11 · GND', 'g12 · SCL', 'g13 · SDA'],
        body: `<p>The <b>Adafruit SHT31-D</b> breakout carries a Sensirion sensor that measures <b>temperature and humidity</b> and sends finished numbers over I²C. <b>Click its parts</b> in the 3D view.</p>
        <ul><li>Accuracy (Adafruit): about <b>±0.3 °C</b> and <b>±2 %RH</b>.</li><li>Power: <b>2.5–5 V</b>. On a Raspberry Pi we use <b>3.3 V</b> (Adafruit’s wiring for the Pi).</li><li>I²C address <b>0x44</b>; tying ADDR to VIN changes it to 0x45.</li></ul>
        <p>Its pads are in this order: <b>VIN, GND, SCL, SDA, ADDR, RST, ALRT</b>. We use the first four.</p>`,
      },
      {
        title: 'Turn I²C on first', view: 'home', acc: [],
        body: `<p>On Raspberry Pi OS the I²C interface may be switched off. Turn it on once (Raspberry Pi documentation):</p>
        <ul><li><b>Desktop:</b> Raspberry Pi menu → <b>Preferences → Control Centre → Interfaces</b> → switch <b>I2C</b> on.</li><li><b>Terminal:</b> <code>sudo raspi-config</code> → <code>3 Interface Options</code> → <code>I5 I2C</code> → <b>Yes</b> → <b>Finish</b>.</li></ul>
        <p>This turns on the I²C interface and loads the I²C kernel module at boot.</p>`,
      },
      {
        title: 'Step 1 — put the sensor on the breadboard', view: 'pibb', have: ['sen1'], power: false, holes: ['g10 · VIN', 'g11 · GND', 'g12 · SCL', 'g13 · SDA'],
        body: `<p>Push the sensor’s header pins into row <b>g</b>: <b>VIN in g10, GND in g11, SCL in g12, SDA in g13</b>. (ADDR, RST and ALRT go into g14–g16 and stay unconnected.) Holes g–j of one column are connected inside the breadboard.</p>`,
      },
      {
        title: 'Step 2 — four wires to the Raspberry Pi', view: 'pibench', have: I2C_IDS, pins: ['p1', 'p6', 'p5', 'p3'],
        body: `<ul><li>Red: <b>pin 1 (3V3) → j10</b> (VIN)</li><li>Black: <b>pin 6 (GND) → j11</b></li><li>Yellow: <b>pin 5 (SCL) → j12</b></li><li>Blue: <b>pin 3 (SDA) → j13</b></li></ul>
        <p class="warn"><b>Power from 3V3 (pin 1), never from 5V.</b> The GPIO pins, including SDA and SCL, are 3.3 V only.</p>
        <p class="tip">The wires match Adafruit’s Raspberry Pi wiring: Pi 3V3 → VIN, Pi GND → GND, Pi SCL → SCL, Pi SDA → SDA.</p>`,
      },
      {
        title: 'Install the library', view: 'home', acc: [],
        body: `<p>The program uses Adafruit’s library. In the Terminal:</p>
        <pre class="tree">pip3 install adafruit-circuitpython-sht31d</pre>
        <p>The library needs <b>Adafruit Blinka</b> (it provides <code>import board</code> on a Raspberry Pi). Raspberry Pi OS asks you to install extra Python packages inside a <b>virtual environment</b> — see Lesson 8 — and Adafruit’s “CircuitPython on Linux” guide shows the steps for a fresh Raspberry Pi.</p>`,
      },
      { title: 'The program', view: 'pibench', have: I2C_IDS, showCode: true, power: true, body: `<p>Adafruit’s example program, shortened to the two readings. Click any line.</p>` },
      {
        title: 'Run it', view: 'pibench', have: I2C_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Every two seconds the Shell prints the temperature and humidity. <b>Move the sliders</b> (the air around the sensor) and watch the numbers follow.</p>
        <p class="sim">Simulated values. The program line that reads the sensor is highlighted while it runs.</p>`,
      },
      {
        title: 'What if a wire is loose?', view: 'pibench', have: I2C_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Unplug the SDA wire”</b> and run it again. Nobody answers at address 0x44, so Python stops with:</p>
        <pre class="tree">ValueError: No I2C device at address: 0x44</pre>
        <p>(Python prints more lines before it, the “traceback”.) This message is the first thing to look for when a sensor does not work: check the four wires, and that I²C is turned on.</p>`,
      },
      {
        title: 'Summary', view: 'pibench', have: I2C_IDS, power: true,
        body: `<ul><li>I²C = two wires, <b>SDA</b> (pin 3) and <b>SCL</b> (pin 5), plus power (3V3) and ground; devices have addresses (SHT31-D: 0x44).</li><li>Turn I²C on in Control Centre or <code>sudo raspi-config</code>.</li><li><code>board.I2C()</code> + <code>adafruit_sht31d.SHT31D(i2c)</code>, then <code>sensor.temperature</code> and <code>sensor.relative_humidity</code>.</li><li>3.3 V only; “No I2C device at address” = check wiring.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Which two Raspberry Pi pins are SDA and SCL?', a: ['Pins 3 and 5', 'Pins 8 and 10', 'Pins 11 and 12', 'Pins 2 and 4'], c: 0, why: 'SDA1 = GPIO2 = pin 3; SCL1 = GPIO3 = pin 5.' },
      { q: 'Where do you connect the sensor’s VIN on a Raspberry Pi?', a: ['5V (pin 2)', '3V3 (pin 1)', 'GPIO17', 'SDA'], c: 1, why: 'Adafruit’s Pi wiring uses 3V3; the GPIO pins are 3.3 V only.' },
      { q: 'Default I²C address of the SHT31-D?', a: ['0x10', '0x44', '0x6C', '0xFF'], c: 1, why: 'Default 0x44; 0x45 when ADDR is tied to VIN.' },
      { q: 'Python says “ValueError: No I2C device at address: 0x44”. What do you check?', a: ['The monitor', 'The four wires and that I²C is turned on', 'The microSD card size', 'The keyboard'], c: 1, why: 'Nobody answered the address — a loose wire or I²C switched off.' },
      { q: 'How do you turn I²C on?', a: ['It is always on', 'Control Centre → Interfaces, or sudo raspi-config → Interface Options → I2C', 'Edit the sensor', 'Press the ACT LED'], c: 1, why: 'Raspberry Pi documentation: enable I2C in Control Centre or raspi-config.' },
    ],
    sources: [SRC_PI.sht31, SRC_PI.sht31lib, SRC_PI.cfg, SRC_PI.gpio, SRC_PI.ds, SRC_PI.python],
  },
  // ================================================================== P10
  {
    id: 'p10', num: 10, module: 5, title: 'A web page served by the Pi: switch the LED from your phone', level: 'Intermediate', time: '25 min',
    goal: 'Run a small web server (Flask) on the Raspberry Pi so that a phone on the same Wi-Fi can switch the LED on and off.',
    hardware: ['Raspberry Pi 4 with the Lesson 4 LED circuit (GPIO17)', 'A phone or computer on the same Wi-Fi / network'],
    code: PI_WEB, file: 'led_server.py', program: 'pi_web', fast: true, widgets: ['piweb'],
    circuit: PI_LED_PARTS, io: { p11: IO_LED }, led: true,
    explain: {
      1: 'Import <b>Flask</b>: a small framework that turns Python functions into web pages.',
      2: 'The LED class from GPIO Zero (Lesson 4).',
      4: 'Create the web application. <code>__name__</code> tells Flask where this program lives.',
      5: 'The LED on GPIO17 (pin 11), same circuit as Lesson 4.',
      7: '<b>@app.route("/")</b>: when a browser asks for the page <b>/</b> (the main page), run the function below.',
      8: 'The function that builds the main page.',
      9: '<b>led.is_lit</b> is True while the LED is on. We turn that into the word ON or OFF.',
      10: 'What the function returns is the web page. The default content type is HTML, so the browser draws the heading and two links. Clicking a link asks for another address: <b>/on</b> or <b>/off</b>.',
      12: 'When the browser asks for <b>/on</b> …',
      13: '… run this function.',
      14: '<b>led.on()</b> sets GPIO17 to 3.3 V: the real LED lights.',
      15: 'Send the main page back, now showing “LED is ON”.',
      17: 'When the browser asks for <b>/off</b> …',
      18: '… run this function.',
      19: '<b>led.off()</b>: GPIO17 to 0 V, the LED goes out.',
      20: 'Send the main page back, now showing “LED is OFF”.',
    },
    steps: [
      {
        title: 'What we build', view: 'pibench', have: LED_IDS, power: false,
        body: `<p>The Raspberry Pi will <b>serve a web page</b> — like a tiny website. Your phone opens it in its browser and taps a link; the Pi switches the real LED.</p>
        <div class="ptree"><div class="pt-row"><span class="pt in">Phone browser</span></div><div class="pt-arrow">↓ Wi-Fi: “give me /on”</div><div class="pt-row"><span class="pt">Raspberry Pi: Flask web server (Python)</span></div><div class="pt-arrow">↓ led.on()</div><div class="pt-row"><span class="pt bus">LED on GPIO17</span></div></div>
        <p>The wiring is the one from Lesson 4. Only the program is new.</p>`,
      },
      {
        title: 'Server and browser', view: 'pibench', have: LED_IDS,
        body: `<table class="kv"><tr><th></th><th>Runs on</th><th>Job</th></tr><tr><td><b>Web server</b></td><td>the Raspberry Pi</td><td>waits for requests, runs your Python, sends back a page</td></tr><tr><td><b>Browser</b></td><td>your phone / computer</td><td>asks for an address, draws the page</td></tr></table>
        <p>The browser asks for an address like <code>http://&lt;ip-address&gt;:5000/on</code>. After the <b>IP address</b> of the Pi comes the <b>port</b> (5000 is Flask’s default), then the <b>route</b> (<code>/on</code>). Your program decides what each route does.</p>
        <p class="tip">Find the Pi’s IP address with <code>hostname -I</code> (Lesson 8).</p>`,
      },
      {
        title: 'Install Flask', view: 'home', acc: [],
        body: `<p><b>Flask</b> is a small, popular Python web framework. On Raspberry Pi OS (which is based on Debian) install it as a system package:</p>
        <pre class="tree">sudo apt install python3-flask</pre>
        <p>This is the way Raspberry Pi’s documentation recommends for Python libraries (<code>apt install python3-xyz</code>, Lesson 8). Do <code>sudo apt update</code> first if apt cannot find it.</p>`,
      },
      { title: 'The program', view: 'pibench', have: LED_IDS, showCode: true, power: true, body: `<p>Click every line of <code>led_server.py</code>. Each <code>@app.route(…)</code> line connects an <b>address</b> to the function below it.</p>
        <p class="tip">The first lines (1–10) are Flask’s “minimal application” pattern from its documentation; routes <code>/on</code> and <code>/off</code> follow the same pattern.</p>` },
      {
        title: 'Start the server', view: 'pibench', have: LED_IDS, showCode: true, power: true,
        body: `<p>In the Terminal, in the folder of the file:</p>
        <pre class="tree">flask --app led_server run --host=0.0.0.0</pre>
        <ul><li><code>--app led_server</code> — the Python file (without <code>.py</code>). Do not name your file <code>flask.py</code>: it would conflict with Flask itself.</li>
        <li><code>--host=0.0.0.0</code> — by default Flask answers only on the Pi itself; this makes it reachable from <b>other devices on the network</b>.</li></ul>
        <p>Flask prints a line with the port (default 5000). Stop the server with <b>Ctrl+C</b>.</p>`,
      },
      {
        title: 'Run it', view: 'pibench', have: LED_IDS, showCode: true, power: true, phone: true,
        body: `<p>The <b>phone</b> appears at the bottom right of the 3D view and stands for your phone. Press <b>▶ Run</b> (this starts the server), then <b>tap “Turn on”</b> and <b>“Turn off”</b> on the phone.</p>
        <ol><li>The tap asks the Pi for <code>/on</code>.</li><li>The matching function runs <code>led.on()</code> — the real LED lights.</li><li>The Pi sends the page back, now saying “LED is ON”.</li></ol>
        <p>Before you press Run the phone shows <b>“can’t reach this page”</b>: no server is running yet.</p>
        <p class="sim">Simulated: no real network is used here.</p>`,
      },
      {
        title: 'Safety: keep it on your network', view: 'pibench', have: LED_IDS, power: true,
        body: `<p class="warn"><b>Anyone on your network who knows the address can open this page.</b> It has no password. With <code>--host=0.0.0.0</code> Flask listens on all the Pi’s addresses (Flask documentation: do this only if you trust the users on your network).</p>
        <ul><li>Never use Flask’s <b>debug mode</b> together with <code>--host=0.0.0.0</code>: the debugger lets people run Python code on your computer.</li><li>Do not expose this page to the Internet.</li><li>Flask’s built-in server is for testing and learning, not for real production use.</li></ul>
        <p>One more thing: our links change the LED when they are opened, which is simple but not how professional sites do it. Anything that opens the link would switch the LED.</p>`,
      },
      {
        title: 'Summary', view: 'pibench', have: LED_IDS, power: true,
        body: `<ul><li>A <b>web server</b> runs on the Pi; the <b>browser</b> on the phone asks for addresses.</li><li><code>@app.route("/on")</code> connects an address to a Python function; the returned text is the page.</li><li>Start with <code>flask --app led_server run --host=0.0.0.0</code>; default port <b>5000</b>.</li><li>Open <code>http://&lt;pi-ip&gt;:5000</code> from a phone on the same network; keep it off the Internet.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What does @app.route("/on") do?', a: ['Switches the LED on', 'Connects the address /on to the function below it', 'Starts Wi-Fi', 'Installs Flask'], c: 1, why: 'The decorator tells Flask which URL should run the function.' },
      { q: 'What is the default port of Flask’s development server?', a: ['80', '5000', '7000', '8080'], c: 1, why: 'Flask quickstart: Running on http://127.0.0.1:5000.' },
      { q: 'Why add --host=0.0.0.0?', a: ['To make the page faster', 'So other devices on the network can reach the server', 'To turn off the LED', 'To use 5 V'], c: 1, why: 'By default the server is only reachable from the Pi itself.' },
      { q: 'How do you find the Pi’s IP address?', a: ['hostname -I', 'pinout', 'df -h', 'ls'], c: 0, why: 'hostname -I prints the local IP address (Lesson 8).' },
      { q: 'What should you avoid?', a: ['Using the page on your home network', 'Debug mode together with --host=0.0.0.0, or exposing it to the Internet', 'Stopping with Ctrl+C', 'Using Python'], c: 1, why: 'The debugger can run arbitrary Python code, and the page has no password.' },
    ],
    sources: [SRC_PI.flask, SRC_PI.usegpio, SRC_PI.gpiozero, SRC_PI.remote, SRC_PI.python],
  },
  // ================================================================== P11
  {
    id: 'p11', num: 11, module: 6, title: 'Final project: a Pi control panel on your phone', level: 'Advanced', time: '35 min',
    goal: 'Combine everything: an I²C sensor, an LED and a web page — your phone shows the temperature and humidity and switches the LED.',
    hardware: ['Raspberry Pi 4 (set up)', 'Breadboard', 'Adafruit SHT31-D breakout with header pins', '5 mm red LED + 220 Ω resistor', '6 × female–male jumper wires', 'A phone on the same network'],
    code: PI_PANEL, file: 'panel.py', program: 'pi_panel', fast: true, widgets: ['piweb', 'pisens'], sdaWire: 'w8',
    circuit: PI_PANEL_PARTS, io: { p11: IO_PANEL_LED, p3: IO_PANEL_I2C }, led: true,
    explain: {
      1: '<b>Flask</b> makes the web page; <b>redirect</b> sends the browser to another address.',
      2: 'The LED class from GPIO Zero (Lessons 4 and 10).',
      3: '<b>board</b> knows the Pi’s pins, including SDA and SCL (Lesson 9).',
      4: 'The driver of the SHT31-D sensor (Lesson 9).',
      6: 'The web application (Lesson 10).',
      7: 'The LED on GPIO17 (pin 11).',
      8: 'The sensor on the I²C bus. If it does not answer, Python stops here with “No I2C device at address: 0x44”.',
      10: 'The main page: asked for when the browser opens the address.',
      11: 'The function that builds the page.',
      12: 'Is the LED on right now? Turn that into the word ON or OFF.',
      13: 'Everything inside the brackets is the page.',
      14: 'Standard HTML that tells the browser to <b>reload the page every 5 seconds</b>, so the numbers stay up to date.',
      15: 'A heading.',
      16: '<b>sensor.temperature</b> asks the sensor for a new measurement every time the page is built.',
      17: '<b>sensor.relative_humidity</b>: the humidity.',
      18: 'The LED state.',
      19: 'Two links. Tapping one asks the Pi for <b>/on</b> or <b>/off</b>.',
      22: 'The address <b>/on</b> …',
      23: '… runs this function.',
      24: 'LED on.',
      25: '<b>redirect("/")</b> sends the browser back to the main page. This matters: the page reloads itself every 5 s, and if it stayed on <b>/on</b> it would switch the LED on again and again.',
      27: 'The address <b>/off</b> …',
      28: '… runs this function.',
      29: 'LED off.',
      30: 'Back to the main page.',
    },
    steps: [
      {
        title: 'What we build', view: 'pibench', have: PANEL_IDS, power: false,
        body: `<p>A <b>control panel</b> for your Raspberry Pi, shown in the browser of your phone:</p>
        <div class="ptree"><div class="pt-row"><span class="pt in">SHT31-D sensor (I²C)</span><span class="pt in">LED (GPIO17)</span></div><div class="pt-arrow">↕</div><div class="pt-row"><span class="pt">Python + Flask on the Raspberry Pi</span></div><div class="pt-arrow">↕ Wi-Fi</div><div class="pt-row"><span class="pt bus">Phone: temperature, humidity, LED buttons</span></div></div>
        <table class="kv"><tr><th>Part</th><th>You learned it in</th></tr><tr><td>LED on GPIO17</td><td>Lesson 4</td></tr><tr><td>Sensor on I²C, enabling I²C</td><td>Lesson 9</td></tr><tr><td>Flask web page, <code>--host=0.0.0.0</code></td><td>Lesson 10</td></tr><tr><td>Terminal, <code>hostname -I</code>, safe shutdown</td><td>Lessons 2 and 8</td></tr></table>`,
      },
      {
        title: 'Step 1 — the LED circuit', view: 'pibb', have: LED_IDS, power: false, holes: ['g12 · anode (+)', 'g13 · cathode (−)'],
        body: `<p>The same circuit as Lesson 4: 220 Ω resistor <b>h8 → h12</b>, LED anode <b>g12</b>, cathode <b>g13</b>. Wires: <b>pin 11 (GPIO17) → j8</b> and <b>pin 9 (GND) → j13</b>.</p>`,
      },
      {
        title: 'Step 2 — the sensor, further along the breadboard', view: 'pibb', have: [...LED_IDS, 'sen2'], power: false, holes: ['g20 · VIN', 'g21 · GND', 'g22 · SCL', 'g23 · SDA'],
        body: `<p>Push the sensor’s header pins into row <b>g</b>, columns 20 to 26: <b>VIN in g20, GND in g21, SCL in g22, SDA in g23</b>. It sits well away from the LED circuit (columns 8–13), so nothing touches.</p>`,
      },
      {
        title: 'Step 3 — four wires for the sensor', view: 'pibench', have: PANEL_IDS, pins: ['p1', 'p6', 'p5', 'p3'],
        body: `<ul><li>Red: <b>pin 1 (3V3) → j20</b> (VIN)</li><li>Black: <b>pin 6 (GND) → j21</b></li><li>Yellow: <b>pin 5 (SCL) → j22</b></li><li>Blue: <b>pin 3 (SDA) → j23</b></li></ul>
        <p class="warn">Power the sensor from <b>3V3 (pin 1)</b>, never from 5V. All GPIO pins, including SDA and SCL, are 3.3 V only.</p>`,
      },
      {
        title: 'Before you run it: checklist', view: 'home', acc: [],
        body: `<ol><li><b>I²C is on</b> — Control Centre → Interfaces, or <code>sudo raspi-config</code> (Lesson 9).</li><li><b>Libraries</b> — <code>sudo apt install python3-flask</code>, and Adafruit’s sensor library <code>pip3 install adafruit-circuitpython-sht31d</code> (Lesson 9).</li></ol>
        <p class="tip"><b>One place for all libraries:</b> if you installed Adafruit’s library inside a virtual environment (Lesson 8), install Flask in the same environment with <code>pip install flask</code>, so the program finds both.</p>
        <p>Then find the IP address with <code>hostname -I</code>.</p>`,
      },
      { title: 'The program', view: 'pibench', have: PANEL_IDS, showCode: true, power: true, body: `<p>It is Lessons 9 and 10 in one file. Click every line of <code>panel.py</code>.</p><p class="tip">Compared with Lesson 10, three things are new: the sensor lines, the two numbers on the page, and <code>redirect("/")</code> in the <code>/on</code> and <code>/off</code> routes.</p>` },
      {
        title: 'Run it', view: 'pibench', have: PANEL_IDS, showCode: true, power: true, phone: true,
        body: `<ol><li>Press <b>▶ Run</b>. This starts the server (on a real Pi: <code>flask --app panel run --host=0.0.0.0</code>).</li><li>The <b>phone</b> shows the temperature, humidity and the LED state.</li><li><b>Move the sliders</b> in the panel (the air around the sensor) — within 5 seconds the phone shows the new numbers.</li><li>Tap <b>Turn on</b> / <b>Turn off</b>: the real LED follows.</li></ol>
        <p>The line <b>[simulated] browser refresh</b> in the Shell shows the page reloading by itself every 5 seconds.</p>
        <p class="sim">Simulated: no real network, sensor or Wi-Fi is used here.</p>`,
      },
      {
        title: 'What if the sensor wire is loose?', view: 'pibench', have: PANEL_IDS, showCode: true, power: true, phone: true,
        body: `<p>Stop the program, press <b>“Unplug the SDA wire”</b> and run again. The sensor does not answer, so Python stops at line 8 with <code>ValueError: No I2C device at address: 0x44</code> and <b>no server starts</b>: the phone cannot reach the page. Check the four wires and that I²C is on.</p>`,
      },
      {
        title: 'Safety and good habits', view: 'pibench', have: PANEL_IDS, power: true,
        body: `<ul><li><b>Keep it on your own network.</b> The page has no password; with <code>--host=0.0.0.0</code> anyone on the network who knows the address can use it.</li><li>No debug mode with <code>--host=0.0.0.0</code>; do not expose it to the Internet.</li><li>The LED resistor (220 Ω) keeps the pin current low; never wire a motor or a lamp straight to a GPIO pin.</li><li>Shut the Pi down properly: <code>sudo poweroff</code>.</li></ul>
        <p class="tip"><b>Ideas to extend it:</b> switch the LED on automatically above a temperature, add the button from Lesson 5 as a second control, or show a history of readings.</p>`,
      },
      {
        title: 'Summary — you made it!', view: 'pibench', have: PANEL_IDS, power: true,
        body: `<p>You built a small IoT system on a Raspberry Pi:</p>
        <ul><li>a digital <b>sensor</b> on I²C and an <b>LED</b> on a GPIO pin,</li><li>a <b>web server</b> that serves a live page and takes commands from a phone,</li><li>and you know the <b>safety rules</b>: 3.3 V only, the right pins, and a closed, private network.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Why do /on and /off end with redirect("/")?', a: ['To make the LED brighter', 'So the self-reloading main page does not switch the LED again and again', 'To start Wi-Fi', 'To install Flask'], c: 1, why: 'After the action the browser returns to the main page; otherwise every 5-second reload would repeat the action.' },
      { q: 'Which two Pi pins carry the sensor’s data and clock?', a: ['Pins 3 and 5', 'Pins 11 and 9', 'Pins 1 and 6', 'Pins 8 and 10'], c: 0, why: 'SDA = pin 3 (GPIO2), SCL = pin 5 (GPIO3).' },
      { q: 'The program stops with “No I2C device at address: 0x44”. What do you check first?', a: ['The phone', 'The four sensor wires and that I²C is turned on', 'The LED colour', 'The port number'], c: 1, why: 'Nobody answered at the sensor’s address.' },
      { q: 'What does --host=0.0.0.0 do?', a: ['Makes the server reachable from other devices on the network', 'Turns on debug mode', 'Powers the sensor', 'Shuts down the Pi'], c: 0, why: 'By default Flask answers only on the Pi itself.' },
      { q: 'Where do you connect the sensor’s VIN?', a: ['5V', '3V3 (pin 1)', 'GPIO17', 'SDA'], c: 1, why: 'GPIO is 3.3 V only; Adafruit’s Pi wiring uses 3V3.' },
    ],
    sources: [SRC_PI.flask, SRC_PI.sht31, SRC_PI.sht31lib, SRC_PI.usegpio, SRC_PI.cfg, SRC_PI.gpio, SRC_PI.remote],
  },
  // ================================================================== P12
  {
    id: 'p12', num: 12, module: 7, title: 'Make music with a buzzer', level: 'Beginner', time: '20 min',
    goal: 'Wire a passive piezo buzzer to GPIO17 and play the notes of a scale with TonalBuzzer.',
    hardware: ['Raspberry Pi 4 (set up)', 'Breadboard', 'Passive piezo buzzer', '220 Ω resistor', '2 × female–male jumper wires'],
    code: PI_TONE, file: 'scale.py', program: 'pi_tone', fast: true, widgets: ['pikeys'],
    circuit: PI_BUZ_PARTS, io: { p11: IO_BUZ },
    explain: {
      1: '<b>TonalBuzzer</b>: a GPIO Zero class that plays <b>musical notes</b> on a passive buzzer.',
      2: 'The <b>sleep</b> function.',
      4: '<b>TonalBuzzer(17)</b>: the buzzer is on GPIO17 (pin 11). It uses PWM on that pin: the pin pulses at the frequency of the note.',
      6: 'A list of note names: C, D, E, F, G, A, B in <b>octave 4</b> — the C major scale. The number is the octave. <b>A4 is 440 Hz</b> (concert A).',
      8: 'Take one note after the other.',
      9: '<b>buzzer.play(note)</b>: sets the pulse frequency to the note’s frequency (50 % duty cycle). The note keeps sounding until you change it or stop it.',
      10: 'Let the note sound for 0.4 seconds.',
      12: '<b>buzzer.stop()</b>: silence.',
    },
    steps: [
      {
        title: 'Sound from a pin', view: 'pibench', have: BUZ_IDS, power: false,
        body: `<p>A <b>passive piezo buzzer</b> makes a sound when the voltage across it <b>changes quickly</b>. A GPIO pin can do that: switch between 3.3 V and 0 V, many times per second. <b>The speed of the switching is the pitch</b>:</p>
        <table class="kv"><tr><th>Switching speed</th><th>You hear</th></tr><tr><td>440 times per second (440 Hz)</td><td>the note <b>A4</b> (concert A)</td></tr><tr><td>a higher frequency</td><td>a higher note</td></tr></table>
        <p>GPIO Zero has two buzzer classes: <code>Buzzer</code> only switches on and off (one fixed sound — its documentation says it cannot play different tones), and <code>TonalBuzzer</code> <b>plays notes</b>. We use <code>TonalBuzzer</code>.</p>`,
      },
      {
        title: 'The parts', view: 'pibb', have: ['bz1'], power: false,
        body: `<p><b>Click the buzzer</b> in the 3D view. It has two legs: <b>+</b> (marked on the top) and <b>−</b>.</p>
        <p><b>Why a 220 Ω resistor?</b> In the worst case (a short circuit) it limits the current to 3.3 V ÷ 220 Ω = <b>15 mA</b>, just under the <b>16 mA</b> that one GPIO pin may supply. Never connect a loudspeaker or a motor directly to a GPIO pin.</p>`,
      },
      {
        title: 'Step 1 — resistor and buzzer', view: 'pibb', have: ['r1', 'bz1'], power: false, holes: ['i8', 'i12', 'g12 · +', 'g15 · −'],
        body: `<ul><li><b>220 Ω resistor</b> from <b>i8</b> to <b>i12</b> (one row further from the buzzer, because the round body of the buzzer covers the holes right next to its legs).</li><li><b>Buzzer</b>: <b>+</b> leg in <b>g12</b>, <b>−</b> leg in <b>g15</b>.</li></ul>
        <p>The resistor and the + leg meet in column 12, because holes f–j of one column are connected.</p>`,
      },
      {
        title: 'Step 2 — two wires', view: 'pibench', have: BUZ_IDS, pins: ['p11', 'p9'],
        body: `<ul><li>Orange: <b>pin 11 (GPIO17) → j8</b></li><li>Black: <b>pin 9 (GND) → j15</b></li></ul>
        <p class="path">GPIO17 → resistor → buzzer + … buzzer − → GND</p>`,
      },
      {
        title: 'Notes and frequencies', view: 'pibench', have: BUZ_IDS,
        body: `<p>A note is a frequency. The documentation defines <b>A4 = 440 Hz</b> (MIDI note 69); every <b>semitone</b> step multiplies the frequency by 2<sup>1/12</sup>. The notes of our scale:</p>
        <table class="kv"><tr><th>Note</th><th>C4</th><th>D4</th><th>E4</th><th>F4</th><th>G4</th><th>A4</th><th>B4</th></tr><tr><td>Hz</td><td>261.6</td><td>293.7</td><td>329.6</td><td>349.2</td><td>392.0</td><td>440.0</td><td>493.9</td></tr></table>
        <p class="tip">By default <code>TonalBuzzer</code> covers one octave above and below A4 (A3 to A5). Playing a note outside that range raises an error.</p>`,
      },
      { title: 'The program', view: 'pibench', have: BUZ_IDS, showCode: true, power: true, body: `<p>Click any line. The program plays the seven notes one after the other, 0.4 s each, then stops.</p><p class="tip">This is our example, built from GPIO Zero’s documented calls: <code>play()</code> and <code>stop()</code>, and note names such as “A4”.</p>` },
      {
        title: 'Run it — and play yourself', view: 'pibench', have: BUZ_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Press <b>▶ Run</b> (turn <b>sound on</b> in the top bar of the app if you cannot hear it): the keys in the panel light up one by one, the buzzer on the breadboard <b>vibrates</b>, and the pin panel shows the frequency.</p>
        <p><b>Then click the keys</b> yourself to play any note.</p>
        <p class="sim">The sound is made by your browser as a square wave. A real piezo sounds different, and more quietly.</p>`,
      },
      {
        title: 'Summary', view: 'pibench', have: BUZ_IDS, power: true,
        body: `<ul><li>A passive piezo makes sound when the pin <b>switches quickly</b>; the switching frequency is the pitch.</li><li><code>TonalBuzzer(17)</code>, <code>play("A4")</code>, <code>stop()</code>; A4 = 440 Hz.</li><li>Always a resistor: 220 Ω → at most 15 mA (limit 16 mA per pin).</li></ul>`,
      },
    ],
    quiz: [
      { q: 'What sets the pitch of the note?', a: ['The resistor value', 'How fast the pin switches between 3.3 V and 0 V', 'The colour of the wire', 'The length of sleep()'], c: 1, why: 'The switching frequency is the pitch.' },
      { q: 'Frequency of the note A4?', a: ['44 Hz', '440 Hz', '4400 Hz', '261.6 Hz'], c: 1, why: 'Concert A is 440 Hz (MIDI note 69).' },
      { q: 'Which GPIO Zero class plays different notes?', a: ['Buzzer', 'TonalBuzzer', 'LED', 'Button'], c: 1, why: 'Buzzer only switches on and off; TonalBuzzer plays tones.' },
      { q: 'What does buzzer.stop() do?', a: ['Plays the next note', 'Silences the buzzer', 'Shuts down the Pi', 'Doubles the volume'], c: 1, why: 'stop() turns the buzzer off.' },
      { q: 'Worst-case current through 220 Ω at 3.3 V?', a: ['1.5 mA', '15 mA', '150 mA', '1.5 A'], c: 1, why: '3.3 V / 220 Ω = 0.015 A = 15 mA.' },
    ],
    sources: [SRC_PI.tonal, SRC_PI.gpiozero, SRC_PI.gpio, SRC_PI.ds],
  },
  // ================================================================== P13
  {
    id: 'p13', num: 13, module: 8, title: 'Connect the Camera Module and take a picture', level: 'Beginner', time: '25 min',
    goal: 'Plug a Camera Module 3 into the CAMERA connector with its ribbon cable, then take a picture with rpicam-still.',
    hardware: ['Raspberry Pi 4 (set up)', 'Camera Module 3 with its 15-pin ribbon cable', 'Monitor, keyboard, mouse'],
    termGroups: ['Camera', 'Files and folders'],
    steps: [
      {
        title: 'The camera and its ribbon cable', view: 'picam', acc: ['cam'], power: false,
        body: `<p>On the desk lies a <b>Camera Module 3</b> with its flat <b>ribbon cable</b>. <b>Click the camera</b> and the cable in the 3D view.</p>
        <ul><li>12-megapixel camera, Sony <b>IMX708</b> sensor, 4608 × 2592 pixels, <b>powered autofocus</b>; the board is <b>25 × 24 mm</b>.</li><li>The cable has the standard <b>15-pin</b> connection. Every Raspberry Pi camera uses it; the Raspberry Pi 4 takes the cable that comes with the camera.</li></ul>
        <p class="sim">The board picture is the official product photo. The lens part’s height and the cable’s length are only approximate in this 3D model.</p>`,
      },
      {
        title: 'Safety first', view: 'picam', acc: ['cam'], power: false,
        body: `<p class="warn"><b>Cameras are sensitive to static electricity.</b> Touch something earthed (for example a metal tap) before you handle the board.</p>
        <p>Then <b>shut the Raspberry Pi down and unplug the power</b> before you connect the cable. The red PWR LED is off in the 3D view: the board has no power.</p>
        <p>If a small piece of translucent blue film covers the lens, peel it off gently: it only protects the lens during shipping.</p>`,
      },
      {
        title: 'Find the CAMERA connector (J3)', focus: 'camera', acc: ['cam'], power: false,
        body: `<p>On the Raspberry Pi 4 the camera connector is by the edge closest to you, <b>between the micro-HDMI connector and the audio jack</b>. It is labelled <b>CAMERA</b> (J3).</p>
        <p class="warn">Do not use the <b>DISPLAY</b> connector (J4, on the left edge). The cable fits both, but <b>only the CAMERA (CSI) port</b> powers and controls a camera.</p>`,
      },
      {
        title: 'Push the cable into the connector', view: 'picam', acc: ['cam', 'camlink'], power: false,
        body: `<p>Watch the cable end slide down into J3. On the real board you do it in this order:</p>
        <ol><li><b>Open the flap</b> of the connector: gently pull it out until you feel it stop, and tilt it slightly away from the opening.</li><li><b>Insert the cable</b> with the <b>metallic contacts facing away from the flap</b>. Push it in straight and firmly; do not bend it sharply.</li><li><b>Close the flap</b>: tilt it back and push it down until it clicks. The flap holds the cable and presses the contacts together.</li></ol>
        <p>To remove the cable, do the same steps in reverse.</p>
        <p class="sim">The 3D model does not animate the flap.</p>`,
      },
      {
        title: 'Which way round?', view: 'picam', acc: ['cam', 'camlink'], power: false,
        body: `<p>The cable can go in the wrong way round if you are not careful. Rule from the official guide: <b>contacts facing away from the flap</b>.</p>
        <p>The cable’s end has a <b>blue backing</b> on the side without contacts. Raspberry Pi’s magazine published a correction saying the blue side must face the <b>Ethernet/USB ports</b>, not the HDMI ports. In the 3D view the <b>blue side faces the USB/Ethernet end</b> of the board and the <b>silver contacts face the HDMI ports</b>.</p>
        <p class="tip">Check this before you power on: a cable in the wrong way round simply does not work.</p>`,
      },
      {
        title: 'Power on and keep the software up to date', view: 'pidesk', acc: ['sd', 'hdmi', 'monitor', 'kbd', 'mouse', 'cam', 'camlink'], power: true,
        body: `<p>Now plug the power in again (the monitor shows the desktop). The camera programs, called <b>rpicam-apps</b>, are included in Raspberry Pi OS, so you can take pictures even on a fresh installation.</p>
        <p>Raspberry Pi advises keeping the kernel and applications up to date first, with <code>sudo apt update</code> and <code>sudo apt full-upgrade</code> (Lesson 8).</p>`,
      },
      {
        title: 'Take a picture', view: 'pidesk', acc: ['sd', 'hdmi', 'monitor', 'kbd', 'mouse', 'cam', 'camlink'], power: true,
        body: `<p>Type or click the commands. <b>Watch the monitor</b>:</p>
        <ul><li><code>rpicam-hello</code> → a <b>preview window</b> with the camera picture for 5 seconds.</li><li><code>rpicam-hello --timeout 0</code> → the preview runs until you press <b>Ctrl+C</b>.</li><li><code>rpicam-still --output test.jpg</code> → the preview for 5 seconds, then the picture is taken and saved as <b>test.jpg</b>.</li><li><code>ls</code> → the file is in your folder.</li></ul>
        <div class="term"><div class="term-out"><div class="term-hint">What the command does appears here; the result appears on the monitor.</div></div>
        <div class="term-row"><span class="term-ps">$</span><input class="term-in" placeholder="type a command and press Enter" autocomplete="off" spellcheck="false"></div>
        <div class="term-chips"></div></div>
        <p class="sim">The picture on the monitor is a made-up illustration: a real preview shows what the lens sees. A real rpicam-still also prints some information lines.</p>`,
      },
      {
        title: 'If it does not work', view: 'picam', acc: ['cam', 'camlink'], power: false,
        body: `<p>Raspberry Pi’s troubleshooting list:</p>
        <ul><li>Is the cable in the <b>CAMERA (CSI)</b> connector, not DISPLAY (DSI)? Look for the CSI label near the port.</li><li>Is it pushed in fully, straight, and the flap closed? Is the cable the right way round?</li><li>Try a <b>better power supply</b>: the camera adds about <b>200–250 mA</b> to what the Raspberry Pi needs.</li></ul>`,
      },
      {
        title: 'Summary', view: 'picam', acc: ['cam', 'camlink'], power: false,
        body: `<ul><li>Camera Module 3: IMX708, 12 megapixels, autofocus, 15-pin ribbon cable.</li><li>Static warning; <b>power off</b> before connecting.</li><li>Cable into <b>CAMERA (J3)</b>, contacts away from the flap, flap closed.</li><li><code>rpicam-hello</code> = preview, <code>rpicam-still --output test.jpg</code> = picture.</li></ul>`,
      },
    ],
    quiz: [
      { q: 'Which connector takes the camera cable on the Raspberry Pi 4?', a: ['DISPLAY (J4)', 'CAMERA (J3)', 'The USB-C port', 'The GPIO header'], c: 1, why: 'The CAMERA (CSI) connector; DISPLAY (DSI) does not power or control a camera.' },
      { q: 'Which way do the metallic contacts of the cable face?', a: ['Towards the flap', 'Away from the flap', 'It does not matter', 'Up, towards the ceiling'], c: 1, why: 'Official guide: contacts facing away from the flap.' },
      { q: 'What should you do before connecting the cable?', a: ['Nothing', 'Touch something earthed, and shut down and unplug the Pi', 'Heat the cable', 'Remove the SD card only'], c: 1, why: 'Cameras are sensitive to static, and the Pi should be off.' },
      { q: 'Which command shows a preview for five seconds?', a: ['rpicam-still', 'rpicam-hello', 'ls', 'pinout'], c: 1, why: 'rpicam-hello shows a preview window; five seconds is the default.' },
      { q: 'How much extra current does the camera add?', a: ['About 2 mA', 'About 200–250 mA', 'About 5 A', 'None'], c: 1, why: 'Raspberry Pi troubleshooting: about 200–250 mA.' },
    ],
    sources: [SRC_PI.camin, SRC_PI.cam3, SRC_PI.camsw, SRC_PI.camtr, SRC_PI.magpi45],
  },

  // ================================================================== P14
  {
    id: 'p14', num: 14, module: 9, title: 'RGB LED: mix any colour with GPIO Zero', level: 'Beginner', time: '20 min',
    goal: 'Drive the three dice of an RGB LED with three PWM pins using the RGBLED class, and see why green and blue are dim on 3.3 V.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Breadboard', 'RGB LED (common cathode, 4 legs)', '3 × 220 Ω resistors', '4 × female–male jumper wires'],
    code: PI_RGB, file: 'rgb_led.py', program: 'pi_rgb', fast: true, widgets: [],
    circuit: PI_RGB_PARTS, io: { p12: { kind: 'rgb', ch: 0, item: 'rgb1', needs: RGB_IDS }, p32: { kind: 'rgb', ch: 1, item: 'rgb1', needs: RGB_IDS }, p33: { kind: 'rgb', ch: 2, item: 'rgb1', needs: RGB_IDS } },
    explain: {
      1: '<b>RGBLED</b> is the GPIO Zero class for an LED with a red, a green and a blue die.',
      2: '<code>sleep</code> pauses the program.',
      4: 'Create the LED: <b>red</b> on GPIO18, <b>green</b> on GPIO12, <b>blue</b> on GPIO13. By default it uses <b>PWM</b> on each pin, so every colour can have any brightness. (<code>active_high=False</code> is for a common-anode LED.)',
      6: 'Repeat forever.',
      7: '<b>led.color</b> takes three numbers from 0 to 1: red, green, blue. (1, 0, 0) = red.',
      8: 'Wait one second.',
      9: 'Green only.',
      11: 'Blue only.',
      13: 'Red + green light = <b>yellow</b>.',
      15: 'All three = <b>white</b>.',
      17: 'All off.',
    },
    steps: [
      { title: 'One LED, three colours', view: 'pibench', have: [], power: false,
        body: `<p>An <b>RGB LED</b> has a red, a green and a blue LED in one housing, with <b>four legs</b>: red, the <b>common</b> leg (the longest), green, blue. In a <b>common-cathode</b> LED the common leg goes to <b>GND</b>. Red + green look yellow, green + blue look cyan, red + blue look magenta, all three look white.</p>` },
      { title: 'Resistors, and why 3.3 V is little', view: 'pibb', have: ['rgb1'], power: false, holes: ['e10 · red', 'e11 · common', 'e12 · green', 'e13 · blue'],
        body: `<p>Push the LED into <b>e10 – e13</b>. Every colour needs its own resistor (220 Ω here).</p>
        <p class="warn">A GPIO pin gives <b>3.3 V</b>. Red needs about 2.0 V, but green and blue need about <b>3.0 V</b> or more (typical values: check your datasheet). So the green and blue dice get only about 1 mA or less and look <b>much dimmer</b> than red.</p>` },
      { title: 'Step 1 — three resistors', view: 'pibb', have: ['rgb1', 'r1', 'r2', 'r3'], power: false, holes: ['a10 → a16', 'a12 → a17', 'a13 → a18'],
        body: `<p>Resistors from each colour leg to a free column: <b>a10 → a16</b> (red), <b>a12 → a17</b> (green), <b>a13 → a18</b> (blue).</p>` },
      { title: 'Step 2 — wires to the Raspberry Pi', view: 'pibench', have: RGB_IDS, pins: ['p12', 'p32', 'p33', 'p34'],
        body: `<ul><li>Red: <b>pin 12 (GPIO18) → b16</b></li><li>Green: <b>pin 32 (GPIO12) → b17</b></li><li>Blue: <b>pin 33 (GPIO13) → b18</b></li><li>Black: <b>pin 34 (GND) → a11</b> (the common leg)</li></ul>` },
      { title: 'The program', view: 'pibench', have: RGB_IDS, showCode: true, power: true, body: `<p>The <b>RGBLED</b> class does the PWM for you. Click lines 4, 7 and 13.</p>` },
      { title: 'Run it', view: 'pibench', have: RGB_IDS, showCode: true, power: true, action: 'run',
        body: `<p>The LED shows red, green, blue, yellow, white and off, one second each. Notice how dim the green and blue are next to the red.</p><p class="sim">Simulated brightness from the typical forward voltages (red 2.0 V, green 3.0 V, blue 3.1 V).</p>` },
      { title: 'Summary', view: 'pibench', have: RGB_IDS, power: true,
        body: `<ul><li><code>RGBLED(red=…, green=…, blue=…)</code> and <code>led.color = (r, g, b)</code> with values from 0 to 1.</li><li>One resistor per colour; the common leg to GND.</li><li>On 3.3 V the green and blue dice are much dimmer than red.</li></ul>` },
    ],
    quiz: [
      { q: 'led.color = (1, 1, 0) shows…', a: ['Cyan', 'Magenta', 'Yellow', 'White'], c: 2, why: 'Red and green light mix to yellow.' },
      { q: 'Which values does led.color take?', a: ['0 … 255', '0 … 1', '0 … 100', '0 or 1 only'], c: 1, why: 'RGBLED uses 0 … 1 for each colour (with PWM).' },
      { q: 'Why are green and blue dim on 3.3 V?', a: ['They are broken', 'Their forward voltage (about 3 V) is close to 3.3 V, so little current flows', 'The Pi has no PWM', 'The resistor is too small'], c: 1, why: 'I = (3.3 − Vf) ÷ R is only about 1 mA or less.' },
      { q: 'How many resistors does the RGB LED need?', a: ['One', 'Two', 'Three, one per colour', 'None'], c: 2, why: 'Each colour is a separate LED.' },
    ],
    sources: [SRC_PI.rgbled, SRC_PI.gpio, SRC_PI.usegpio],
  },
  // ================================================================== P15
  {
    id: 'p15', num: 15, module: 9, title: 'DHT22: temperature and humidity on one wire', level: 'Intermediate', time: '25 min',
    goal: 'Wire a DHT22 with its pull-up resistor from 3.3 V and read it with the Adafruit CircuitPython DHT library.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Breadboard', 'DHT22 sensor (4 pins)', '4.7 kΩ resistor', '3 × female–male jumper wires', '1 × jumper wire'],
    code: PI_DHT, file: 'dht22.py', program: 'pi_dht', fast: true, widgets: ['pisens'], sdaWire: 'w61', dht: true,
    circuit: PI_DHT_PARTS, io: { p12: { kind: 'dht', item: 'dht1', needs: DHT_IDS } },
    explain: {
      1: 'The <b>time</b> library, for <code>sleep</code>.',
      2: '<b>board</b> (from Adafruit Blinka) knows the Raspberry Pi’s pin names, such as <code>board.D18</code> = GPIO18.',
      3: 'The driver for the DHT11 and DHT22.',
      5: 'Create the sensor object: <b>DHT22</b> (use <code>DHT11</code> for the blue sensor) with the data pin <b>GPIO18</b> (pin 12), the pin of Adafruit’s example.',
      7: 'Repeat forever.',
      8: 'Reading the sensor can fail now and then, so we use <b>try / except</b>.',
      9: '<b>dht.temperature</b>: the temperature in °C.',
      10: '<b>dht.humidity</b>: the relative humidity in %.',
      11: 'Print both with one decimal.',
      12: 'The library raises a <b>RuntimeError</b> when a reading fails. The documentation says to catch it and retry.',
      13: 'Print the reason and carry on.',
      14: 'Wait at least 2 seconds before the next reading (Adafruit).',
    },
    steps: [
      { title: 'The DHT22', view: 'pibb', have: ['dht1'], power: false, holes: ['e10 · VCC', 'e11 · DATA', 'e12 · not connected', 'e13 · GND'],
        body: `<p>The <b>DHT22</b> (AM2302) sends temperature and humidity on <b>one data wire</b>. Four pins (grille facing you, from the left): <b>1 VCC, 2 DATA, 3 not connected, 4 GND</b>.</p>
        <ul><li>Power: <b>3 V to 5 V</b>. Humidity 0 – 100 % (2 – 5 %), temperature −40 – 80 °C (±0.5 °C), at most one reading every 2 seconds (Adafruit).</li></ul>
        <p class="tip">A 3-pin <b>module</b> has the pull-up on its board, but its pin order differs between makers: read the printing.</p>` },
      { title: 'Pull-up resistor, and 3.3 V', view: 'pibench', have: [],
        body: `<p>The sensor can pull DATA low but not high. A <b>pull-up resistor</b> between DATA and VCC does that. The CircuitPython documentation says <b>1 – 5 kΩ</b>; this lesson uses <b>4.7 kΩ</b>.</p>
        <p class="warn">Power the sensor from <b>3V3 (pin 1)</b>. The pull-up goes to VCC, so from 5 V the DATA line would be pulled up to <b>5 V</b>, and a Raspberry Pi GPIO pin is <b>3.3 V only</b>.</p>` },
      { title: 'Step 1 — the sensor and the resistor', view: 'pibb', have: ['dht1', 'r60', 'w63'], power: false, holes: ['c10 · resistor', 'c16 · resistor'],
        body: `<p>Sensor in <b>e10 – e13</b>. The <b>4.7 kΩ resistor</b> goes from <b>c10</b> (VCC column) to <b>c16</b>; a jumper from <b>b11</b> (DATA column) to <b>b16</b> completes the pull-up.</p>` },
      { title: 'Step 2 — power, data and ground', view: 'pibench', have: DHT_IDS, pins: ['p1', 'p12', 'p6'],
        body: `<ul><li>Red: <b>pin 1 (3V3) → a10</b> (VCC)</li><li>Yellow: <b>pin 12 (GPIO18) → a11</b> (DATA)</li><li>Black: <b>pin 6 (GND) → a13</b></li></ul>` },
      { title: 'Install the library', view: 'home', acc: [],
        body: `<p>In the Terminal (inside a virtual environment, see Lesson 8):</p><pre class="tree">pip3 install adafruit-circuitpython-dht</pre>
        <p>The library works with <b>Adafruit Blinka</b>. Follow the current instructions of the CircuitPython DHT documentation for your Raspberry Pi OS: it may also ask for extra system packages.</p>` },
      { title: 'The program', view: 'pibench', have: DHT_IDS, showCode: true, power: true, body: `<p>Click lines 5, 8 and 12.</p>` },
      { title: 'Run it', view: 'pibench', have: DHT_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Every 2 seconds the Shell prints the temperature and humidity. <b>Move the sliders</b> and watch the numbers follow.</p><p class="sim">Simulated values within the DHT22 specification.</p>` },
      { title: 'What if the data wire is loose?', view: 'pibench', have: DHT_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Unplug the DATA wire”</b> and run it again. No reading arrives, the library raises a RuntimeError, the <code>except</code> branch prints “Read failed: …” and the loop goes on. (The exact message differs.)</p><p>Check the three wires and the <b>pull-up resistor</b>.</p>` },
      { title: 'Summary', view: 'pibench', have: DHT_IDS, power: true,
        body: `<ul><li>VCC (3V3), DATA with a 1 – 5 kΩ pull-up, GND.</li><li><code>adafruit_dht.DHT22(board.D18)</code>; <code>dht.temperature</code>, <code>dht.humidity</code>.</li><li>Catch <b>RuntimeError</b> and wait at least 2 seconds before retrying.</li></ul>` },
    ],
    quiz: [
      { q: 'Why power the DHT from 3V3 on a Raspberry Pi?', a: ['It is brighter', 'With 5 V the pulled-up DATA line reaches 5 V, too high for a GPIO pin', 'The DHT needs exactly 3.3 V', 'The Pi has no 5 V pin'], c: 1, why: 'The pull-up goes to VCC, and the GPIO pins are 3.3 V only.' },
      { q: 'A reading fails with a RuntimeError. What does the documentation say to do?', a: ['Stop the program', 'Catch it and retry after at least 2 seconds', 'Replace the Pi', 'Ignore the sensor'], c: 1, why: 'Wrap the reads in try/except and wait before retrying.' },
      { q: 'Which pull-up range does the CircuitPython documentation give?', a: ['1 – 5 kΩ', '1 – 5 MΩ', '10 – 50 Ω', 'None is needed'], c: 0, why: 'The data wire needs a pull-up of 1 – 5 kΩ.' },
      { q: 'How often may you read a DHT22?', a: ['1000 times per second', 'At most once every 2 seconds', 'Only once', 'Once a day'], c: 1, why: 'Adafruit: no more than 0.5 Hz.' },
    ],
    sources: [SRC_PI.dhtpy, SRC_PI.dhtguide, SRC_PI.gpio],
  },
  // ================================================================== P16
  {
    id: 'p16', num: 16, module: 10, title: 'Rotary encoder: count the clicks', level: 'Intermediate', time: '25 min',
    goal: 'Read the two quadrature signals of a rotary encoder with GPIO Zero buttons and count steps up and down.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'Breadboard', 'Rotary encoder module (KY-040 style)', '5 × female–male jumper wires'],
    code: PI_ENC, file: 'encoder.py', program: 'pi_enc', fast: true, widgets: ['enc'],
    circuit: PI_ENC_PARTS, io: { p11: { kind: 'enc', role: 'clk', item: 'enc1', needs: ENC_IDS }, p13: { kind: 'enc', role: 'dt', item: 'enc1', needs: ENC_IDS }, p15: { kind: 'enc', role: 'sw', item: 'enc1', needs: ENC_IDS } },
    explain: {
      1: '<b>Button</b> reads a pin with the <b>internal pull-up</b>: not pressed = HIGH, pressed = LOW (<code>is_pressed</code> is True while the pin is LOW).',
      2: '<code>sleep</code> pauses the program.',
      4: '<b>CLK</b> of the encoder on GPIO17.',
      5: '<b>DT</b> on GPIO27.',
      6: 'The push switch <b>SW</b> on GPIO22.',
      7: 'The number of steps counted.',
      8: 'Remember whether CLK was LOW the last time.',
      10: 'Repeat forever.',
      11: 'Is CLK LOW now?',
      12: 'CLK has just fallen: the knob moved one step.',
      13: 'DT still HIGH: one direction.',
      14: 'Count up.',
      15: 'DT already LOW: the other direction.',
      16: 'Count down.',
      17: 'Print the new count.',
      18: 'Remember CLK for the next time.',
      19: 'Is the knob pressed?',
      20: 'Say so.',
      21: 'Wait a moment so one press is not reported many times.',
      22: 'A tiny pause: the program polls the pins many times per second.',
    },
    steps: [
      { title: 'How an encoder works', view: 'pibench', have: [], power: false,
        body: `<p>A rotary encoder has two contacts, <b>CLK</b> and <b>DT</b>, that close to GND in a <b>shifted pattern</b> as you turn the knob: <b>11 → 01 → 00 → 10 → 11</b> in one direction, backwards in the other. The order tells the direction. A push switch <b>SW</b> is built in.</p>
        <p class="tip">Which direction counts up depends on the module and the wiring: swap CLK and DT if it is reversed.</p>` },
      { title: 'Pull-ups and 3.3 V', view: 'pibench', have: [],
        body: `<p>The contacts only connect the pins to GND, so the pins need pull-ups. GPIO Zero’s <code>Button</code> turns on the Pi’s internal pull-up. Descriptions of the KY-040 module disagree about which pins have pull-up resistors on the board, so relying on the internal ones works either way.</p>
        <p class="warn">Connect the module’s <b>+</b> to <b>3V3 (pin 1)</b>: a module with pull-ups to + would otherwise pull the pins above 3.3 V.</p>` },
      { title: 'Step 1 — put the module on the breadboard', view: 'pibb', power: false, have: ['enc1'], holes: ['g10 · CLK', 'g11 · DT', 'g12 · SW', 'g13 · VCC', 'g14 · GND'],
        body: `<p>Push the five header pins into row <b>g</b>: <b>g10 – g14</b>: CLK, DT, SW, +, GND.</p>` },
      { title: 'Step 2 — five wires', view: 'pibench', have: ENC_IDS, pins: ['p11', 'p13', 'p15', 'p1', 'p6'],
        body: `<ul><li>Green: <b>pin 11 (GPIO17) → j10</b> (CLK)</li><li>Blue: <b>pin 13 (GPIO27) → j11</b> (DT)</li><li>Yellow: <b>pin 15 (GPIO22) → j12</b> (SW)</li><li>Red: <b>pin 1 (3V3) → j13</b> (+)</li><li>Black: <b>pin 6 (GND) → j14</b></li></ul>` },
      { title: 'The program', view: 'pibench', have: ENC_IDS, showCode: true, power: true, body: `<p>The program polls CLK. When CLK has just fallen, DT tells the direction. Click lines 12, 13 and 15.</p>` },
      { title: 'Run it and turn the knob', view: 'pibench', have: ENC_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Press <b>▶ turn</b> and <b>◀ turn</b> in the panel: each press is one click of the knob. The count in the Shell goes up or down. Hold the knob button to see “Knob pressed”.</p><p class="sim">Simulated contacts without bounce. A real encoder bounces: debounce it in software, or use GPIO Zero’s <code>RotaryEncoder</code> class.</p>` },
      { title: 'Summary', view: 'pibench', have: ENC_IDS, power: true,
        body: `<ul><li>CLK and DT close to GND in a shifted pattern: the order gives the direction.</li><li><code>Button(pin).is_pressed</code> is True while the pin is LOW (internal pull-up).</li><li>On a CLK falling edge read DT: HIGH = one direction, LOW = the other.</li></ul>` },
    ],
    quiz: [
      { q: 'What tells you the direction of rotation?', a: ['The speed', 'Which of CLK and DT changes first', 'The SW pin', 'The supply voltage'], c: 1, why: 'The two signals are shifted: the one that changes first shows the direction.' },
      { q: 'clk.is_pressed is True. What is the level on the pin?', a: ['HIGH', 'LOW', '5 V', 'Floating'], c: 1, why: 'Button uses a pull-up: pressed = LOW.' },
      { q: 'Where do you connect the module’s + on a Raspberry Pi?', a: ['5V (pin 2)', '3V3 (pin 1)', 'GPIO17', 'It is not needed'], c: 1, why: 'The GPIO pins are 3.3 V only.' },
      { q: 'A real encoder counts too many steps sometimes. Why?', a: ['It is broken', 'The contacts bounce', 'The Pi is slow', 'The knob is loose'], c: 1, why: 'Mechanical contacts bounce.' },
    ],
    sources: [SRC_PI.gpiozeroin, SRC_PI.gpio, SRC_PI.usegpio],
  },

  // ================================================================== P17
  {
    id: 'p17', num: 17, module: 11, title: 'LCD 16×2: show text over I²C', level: 'Beginner', time: '25 min',
    goal: 'Print text on a 16×2 character LCD with the RPLCD library, and find out why a display can stay blank.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'LCD 16×2 with I²C backpack (PCF8574)', '4 × male–male jumper wires'],
    code: PI_LCD, file: 'lcd.py', program: 'pi_lcd', fast: true, widgets: ['lcdaddr'],
    circuit: PI_LCD_PARTS, io: { p3: { kind: 'lcd', scl: 'p5', item: 'lcd1', needs: LCD_IDS } },
    explain: {
      1: '<b>RPLCD</b> is a Python library for HD44780 LCDs. <code>RPLCD.i2c.CharLCD</code> is the version for displays on an I²C backpack.',
      2: '<code>sleep</code> pauses the program.',
      4: 'Create the display: the backpack chip <b>PCF8574</b>, I²C <b>address 0x27</b>, <b>16 columns</b> and <b>2 rows</b>. The library’s defaults are 20 × 4, so pass cols and rows. The backlight is on by default.',
      5: 'Write the first line.',
      6: 'The seconds counter starts at 0.',
      8: 'Repeat forever.',
      9: '<b>cursor_pos = (row, column)</b>: row 1 is the bottom line.',
      10: 'Write the label and the counter.',
      11: 'Count up.',
      12: 'Wait one second.',
    },
    steps: [
      { title: 'The LCD and its I²C backpack', view: 'dispp', have: ['lcd1'], power: false,
        body: `<p>A 16×2 LCD shows <b>16 columns × 2 rows</b> of characters, each a <b>5 × 8 dot matrix</b>. The blue <b>PCF8574</b> backpack on its back turns its many pins into <b>two I²C wires</b>. <b>Click the parts</b> in the 3D view.</p>
        <ul><li>Four pins: <b>GND, VCC, SDA, SCL</b>. The backpack is made for <b>5 V</b>.</li><li>Address: usually <b>0x27</b>, on some <b>0x3F</b>.</li><li>The blue trimmer sets the <b>contrast</b>.</li></ul>` },
      { title: 'Turn I²C on, wire the four pins', view: 'dispp', have: LCD_IDS, power: false, pins: ['p6', 'p2', 'p3', 'p5'],
        body: `<p>Turn I²C on first (Control Centre → Interfaces, or <code>sudo raspi-config</code>, Lesson 9). Then use the breadboard rows <b>a10 – a13</b> and <b>b10 – b13</b>:</p>
        <ul><li>GND → <b>pin 6</b></li><li>VCC → <b>pin 2 (5V)</b></li><li>SDA → <b>pin 3</b></li><li>SCL → <b>pin 5</b></li></ul>
        <p class="warn">Many backpacks pull SDA and SCL up to VCC. On a Raspberry Pi, whose GPIO pins are <b>3.3 V only</b>, that could put 5 V on the pins: check your module, or use a level shifter.</p>` },
      { title: 'Install the library', view: 'home', acc: [],
        body: `<p>In the Terminal (inside a virtual environment, Lesson 8):</p><pre class="tree">pip3 install RPLCD</pre><p>RPLCD talks to the display through an I²C library (<b>smbus2</b>): follow the installation notes in the RPLCD documentation.</p>` },
      { title: 'The program', view: 'dispp', have: LCD_IDS, showCode: true, power: true, body: `<p>Click lines 4, 9 and 10.</p>` },
      { title: 'Run it', view: 'dispp', have: LCD_IDS, showCode: true, power: true, action: 'run',
        body: `<p>The top line shows <b>Hello</b>, the bottom line counts the seconds. If you only see dark blocks on a real display, turn the contrast trimmer.</p><p class="sim">Simulated display.</p>` },
      { title: 'Blank screen? Check the address', view: 'dispp', have: LCD_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Module address”</b> to switch it to <b>0x3F</b> and run again. The program uses 0x27 and nobody answers: Python stops with an error (typically an <code>OSError</code>) and the screen shows no text.</p><p>Find the real address with <code>i2cdetect -y 1</code> (Raspberry Pi documentation) and use it in <code>CharLCD('PCF8574', address, …)</code>.</p>` },
      { title: 'Summary', view: 'dispp', have: LCD_IDS, power: true,
        body: `<ul><li>Backpack: GND, VCC (5 V), SDA, SCL; address 0x27 or 0x3F.</li><li><code>CharLCD('PCF8574', 0x27, cols=16, rows=2)</code>, <code>write_string()</code>, <code>cursor_pos = (row, col)</code>.</li><li>Blank screen: wrong address, contrast or a loose wire.</li></ul>` },
    ],
    quiz: [
      { q: 'What does the PCF8574 backpack do?', a: ['Makes the LCD brighter', 'Turns the LCD pins into two I²C wires', 'Stores the text', 'Powers the Pi'], c: 1, why: 'It is an I²C port expander.' },
      { q: 'lcd.cursor_pos = (1, 0) puts the cursor…', a: ['On the top line', 'On column 0 of the bottom line', 'At the end', 'Off the screen'], c: 1, why: '(row, column): row 1 is the second line.' },
      { q: 'Why pass cols=16, rows=2?', a: ['They are decoration', 'The library defaults to a 20 × 4 display', 'To set the contrast', 'To set the address'], c: 1, why: 'RPLCD’s defaults are 20 columns and 4 rows.' },
      { q: 'What is a risk of a 5 V LCD backpack on a Raspberry Pi?', a: ['None', 'Its pull-ups to 5 V could put 5 V on the 3.3 V-only GPIO pins', 'It draws too little current', 'The text is too bright'], c: 1, why: 'Check your module or use a level shifter.' },
    ],
    sources: [SRC_PI.rplcd, SRC_PI.cfg, SRC_PI.gpio],
  },
  // ================================================================== P18
  {
    id: 'p18', num: 18, module: 11, title: 'OLED 128×64: draw text with the SSD1306', level: 'Beginner', time: '25 min',
    goal: 'Show text on a small OLED with the Adafruit CircuitPython SSD1306 library, and handle a display that does not answer.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'SSD1306 OLED 128×64 (I²C)', '4 × male–male jumper wires'],
    code: PI_OLED, file: 'oled.py', program: 'pi_oled', fast: true, widgets: ['oledaddr'],
    circuit: PI_OLED_PARTS, io: { p3: { kind: 'oled', scl: 'p5', item: 'oled1', needs: OLED_IDS } },
    explain: {
      1: '<b>board</b> (Adafruit Blinka) knows the Raspberry Pi’s pins.',
      2: 'The SSD1306 driver library.',
      4: '<b>board.I2C()</b> opens the I²C bus on <b>SCL (pin 5)</b> and <b>SDA (pin 3)</b>.',
      5: 'Create the display: <b>128 × 64</b> pixels, the I²C bus, <b>address 0x3C</b>. If nobody answers, Python raises an error.',
      7: '<b>fill(0)</b> clears the buffer (all pixels off).',
      8: '<b>text(string, x, y, colour)</b> draws text into the buffer with a small built-in font.',
      9: 'A second line, 12 pixels lower.',
      10: '<b>show()</b> sends the buffer to the screen. Nothing appears before this call.',
    },
    steps: [
      { title: 'The OLED', view: 'dispp', have: ['oled1'], power: false,
        body: `<p>An <b>OLED</b> makes its own light: each of its <b>128 × 64 pixels</b> is a tiny LED. The <b>SSD1306</b> chip drives it over I²C. <b>Click the parts</b>.</p><ul><li>Four pins: <b>GND, VCC, SCL, SDA</b> (the order differs between makers: read the printing).</li><li>Address <b>0x3C</b>, on some modules <b>0x3D</b>.</li><li>Check whether your module accepts 3.3 V, 5 V or both.</li></ul>` },
      { title: 'Turn I²C on, wire the four pins', view: 'dispp', have: OLED_IDS, power: false, pins: ['p6', 'p1', 'p5', 'p3'],
        body: `<ul><li>GND → <b>pin 6</b></li><li>VCC → <b>pin 1 (3V3)</b></li><li>SCL → <b>pin 5</b></li><li>SDA → <b>pin 3</b></li></ul><p>Make sure I²C is turned on (Lesson 9).</p>` },
      { title: 'Install the library', view: 'home', acc: [],
        body: `<p>In the Terminal (inside a virtual environment):</p><pre class="tree">pip3 install adafruit-circuitpython-ssd1306</pre>` },
      { title: 'The program', view: 'dispp', have: OLED_IDS, showCode: true, power: true, body: `<p>Click lines 5, 8 and 10. Note that nothing is shown until <code>show()</code>.</p>` },
      { title: 'Run it', view: 'dispp', have: OLED_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Two lines of text appear on the OLED. The program ends, but the picture stays on the screen.</p><p class="sim">Simulated display.</p>` },
      { title: 'What if the display does not answer?', view: 'dispp', have: OLED_IDS, showCode: true, power: true, action: 'run',
        body: `<p>Stop the program, press <b>“Module address”</b> to switch it to <b>0x3D</b> and run again. Nobody answers at 0x3C and Python stops with:</p><pre class="tree">ValueError: No I2C device at address: 0x3c</pre><p>Check the four wires, that I²C is on, and the address (<code>i2cdetect -y 1</code>).</p>` },
      { title: 'Summary', view: 'dispp', have: OLED_IDS, power: true,
        body: `<ul><li><code>board.I2C()</code>, <code>SSD1306_I2C(128, 64, i2c, addr=0x3C)</code>.</li><li><code>fill(0)</code>, <code>text(…)</code>, then <code>show()</code>.</li><li>“No I2C device” = wrong address, loose wire or I²C off.</li></ul>` },
    ],
    quiz: [
      { q: 'When does the text appear on the OLED?', a: ['At text()', 'After show()', 'After fill(0)', 'Never'], c: 1, why: 'Drawing goes into a buffer; show() sends it to the screen.' },
      { q: 'Python says “No I2C device at address: 0x3c”. What do you check?', a: ['The I²C address, the wires and that I²C is on', 'The LED', 'The resistor colours', 'The Wi-Fi'], c: 0, why: 'Nobody answered at that address.' },
      { q: 'How many pixels does this OLED have?', a: ['16 × 2', '128 × 64', '8 × 8', '320 × 240'], c: 1, why: '128 columns by 64 rows.' },
      { q: 'Why has an OLED no backlight?', a: ['It is broken', 'Each pixel makes its own light', 'It uses sunlight', 'It is always off'], c: 1, why: 'OLED pixels are light-emitting.' },
    ],
    sources: [SRC_PI.ssd1306py, SRC_PI.cfg, SRC_PI.gpio],
  },
  // ================================================================== P19
  {
    id: 'p19', num: 19, module: 11, title: 'NeoPixel strip: one wire, eight colours', level: 'Intermediate', time: '30 min',
    goal: 'Light an 8-pixel NeoPixel strip with the Adafruit CircuitPython NeoPixel library, and learn the power and 3.3 V data-level rules.',
    hardware: ['Raspberry Pi 4 (set up, Lesson 2)', 'NeoPixel (WS2812B) strip, 8 pixels', 'Breadboard and jumper wires', 'Capacitor 500 – 1000 µF (recommended)'],
    code: PI_NEO, file: 'neopixel_test.py', program: 'pi_neo', fast: true, widgets: ['neolevel'], neoLow: true,
    circuit: PI_NEO_PARTS, io: { p12: { kind: 'neo', item: 'neo1', needs: NEO_IDS } },
    explain: {
      1: 'The <b>time</b> library, for <code>sleep</code>.',
      2: '<b>board</b> (Blinka) knows the Pi’s pin names.',
      3: 'The Adafruit NeoPixel library.',
      5: 'Create the strip: data pin <b>GPIO18</b> (the pin of Adafruit’s example), <b>8</b> pixels, brightness 0.15 to limit the current, <b>auto_write=False</b>: nothing is sent before <code>show()</code>.',
      7: 'Repeat forever.',
      8: 'Go through the pixels 0 … 7.',
      9: 'All pixels off in memory.',
      10: 'Pixel <b>i</b> red: (red, green, blue), each 0 … 255.',
      11: '<b>show()</b> sends the colours to the strip.',
      12: 'Wait 150 ms.',
    },
    steps: [
      { title: 'An addressable LED strip', view: 'dispp', have: ['neo1'], power: false,
        body: `<p>On a <b>NeoPixel</b> (WS2812B) strip every pixel has its own driver chip. The <b>data line</b> carries a colour for each pixel in turn, so <b>one pin controls the whole strip</b>.</p><ul><li>Three connections: <b>5 V</b>, <b>DIN</b>, <b>GND</b>.</li><li>Up to <b>60 mA per pixel</b> at full white, about 20 mA in typical use (Adafruit).</li></ul>` },
      { title: 'Power and data-level rules', view: 'dispp', have: ['neo1'],
        body: `<ul><li>8 pixels at full white can draw <b>480 mA</b>: keep the brightness low.</li><li>Connect <b>GND first</b> and add a <b>500 – 1000 µF capacitor</b> across + and − (Adafruit).</li><li>The strip wants <b>5 V</b>, and its data signal at least <b>70 %</b> of that: <b>3.5 V</b>. A Raspberry Pi pin gives <b>3.3 V</b>: use a <b>level shifter</b> or a lower strip voltage.</li></ul><p class="warn">The strip’s 5 V must never go to a GPIO pin. Only the data line goes to a pin, and it comes <b>from</b> the pin.</p>` },
      { title: 'Wire the strip', view: 'dispp', have: NEO_IDS, power: false, pins: ['p2', 'p12', 'p6'],
        body: `<ul><li>Strip VCC → <b>pin 2 (5V)</b></li><li>Strip DIN → <b>pin 12 (GPIO18)</b></li><li>Strip GND → <b>pin 6 (GND)</b></li></ul>` },
      { title: 'Install the library', view: 'home', acc: [],
        body: `<p>In the Terminal (inside a virtual environment):</p><pre class="tree">pip3 install adafruit-circuitpython-neopixel</pre><p>Adafruit’s guide says the NeoPixel library needs <b>root access</b>: run the program with <code>sudo</code> (for a virtual environment: <code>sudo -E env PATH=$PATH python3 file.py</code>).</p>` },
      { title: 'The program', view: 'dispp', have: NEO_IDS, showCode: true, power: true, body: `<p>Click lines 5, 10 and 11. Nothing changes on the strip until <code>show()</code>.</p>` },
      { title: 'Run it', view: 'dispp', have: NEO_IDS, showCode: true, power: true, action: 'run',
        body: `<p>A red dot should run along the 8 pixels. Use the <b>level shifter</b> button in the panel (stop the program first): without it the simulated strip shows a broken pattern, as it may on real hardware.</p><p class="sim">Simulated strip.</p>` },
      { title: 'Summary', view: 'dispp', have: NEO_IDS, power: true,
        body: `<ul><li>5 V, DIN, GND; one data pin; run with sudo.</li><li><code>neopixel.NeoPixel(board.D18, 8, brightness=…, auto_write=False)</code>, <code>pixels[i] = (r, g, b)</code>, <code>pixels.show()</code>.</li><li>60 mA per pixel at full white; data at least 70 % of the strip voltage.</li></ul>` },
    ],
    quiz: [
      { q: 'With auto_write=False, when do the pixels change?', a: ['At once', 'After pixels.show()', 'After fill()', 'Never'], c: 1, why: 'The colours stay in memory until show() sends them.' },
      { q: 'How much current can a NeoPixel draw at full white?', a: ['About 1 mA', 'Up to 60 mA', 'About 1 A', 'Exactly 20 mA'], c: 1, why: 'Adafruit: up to 60 mA with all three colours at maximum.' },
      { q: 'The data signal of a 5 V strip should be at least…', a: ['1 V', '70 % of the strip voltage (3.5 V)', '5 V exactly', '12 V'], c: 1, why: 'Adafruit recommends at least 70 % of the pixel voltage.' },
      { q: 'What does the Adafruit guide say about running the NeoPixel library?', a: ['It needs root access (sudo)', 'It needs no permissions', 'It only runs on Windows', 'It needs a monitor'], c: 0, why: 'Adafruit: running code for the NeoPixel library requires root access.' },
    ],
    sources: [SRC_PI.neopy, SRC_PI.neouber, SRC_PI.gpio],
  },
];

export const PI_COMING = [];

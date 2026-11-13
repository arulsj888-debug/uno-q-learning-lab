// Python listings of Raspberry Pi lessons 33-46. Line numbers match the programs in src/sim6.js (checked by tools/check_code.mjs through CHECKS5).
export const CODE5 = {};
export const CHECKS5 = {};
const def = (key, code, checks) => { CODE5[key] = code; CHECKS5[key] = checks; };

def('abuz', `from gpiozero import Buzzer
from time import sleep

buzzer = Buzzer(27)      # active buzzer on GPIO27 (pin 13), through a resistor

while True:
    buzzer.on()          # an active buzzer sounds when it gets power
    print("beep")
    sleep(0.5)
    buzzer.off()         # and is silent without it
    sleep(0.5)`, [[1, 'import Buzzer'], [2, 'sleep'], [4, 'Buzzer(27)'], [6, 'while True'], [7, 'buzzer.on()'], [8, '"beep"'], [9, 'sleep(0.5)'], [10, 'buzzer.off()'], [11, 'sleep(0.5)']]);

def('swt', `from gpiozero import DigitalInputDevice, Button
from time import sleep

slide = DigitalInputDevice(5, pull_up=None, active_state=True)   # GPIO5: the switch always drives the pin
reed = Button(6)       # GPIO6 with the internal pull-up: closed to GND = pressed (value 1)
tilt = Button(13)      # GPIO13, the same

while True:
    print("slide =", slide.value, " reed =", reed.value, " tilt =", tilt.value)
    sleep(0.5)`, [[1, 'DigitalInputDevice, Button'], [4, 'DigitalInputDevice(5'], [5, 'Button(6)'], [6, 'Button(13)'], [8, 'while True'], [9, 'slide.value'], [10, 'sleep(0.5)']]);

def('seg7', `from gpiozero import LEDBoard
from time import sleep

seg = LEDBoard(17, 18, 27, 22, 23, 24, 25)    # segments a b c d e f g
digits = [0b0111111, 0b0000110, 0b1011011, 0b1001111, 0b1100110,
          0b1101101, 0b1111101, 0b0000111, 0b1111111, 0b1101111]   # bit 0 = a ... bit 6 = g

while True:
    for d in range(10):
        seg.value = tuple((digits[d] >> s) & 1 for s in range(7))
        print(d)
        sleep(0.8)`, [[1, 'LEDBoard'], [4, 'LEDBoard(17'], [5, 'digits = ['], [6, '0b1101111'], [8, 'while True'], [9, 'for d in range(10)'], [10, 'seg.value'], [11, 'print(d)'], [12, 'sleep(0.8)']]);

def('max7219', `from luma.core.interface.serial import spi, noop
from luma.led_matrix.device import max7219
from luma.core.render import canvas
from time import sleep

serial = spi(port=0, device=0, gpio=noop())     # SPI0, chip select CE0 (pin 24)
device = max7219(serial, cascaded=1)            # one MAX7219
device.contrast(64)                             # brightness 0 ... 255

with canvas(device) as draw:
    draw.rectangle(device.bounding_box, outline="white")   # a frame
    draw.point((3, 3), fill="white")
    draw.point((4, 4), fill="white")

while True:
    for level in range(0, 256, 16):
        device.contrast(level)
        sleep(0.15)`, [[1, 'spi, noop'], [2, 'max7219'], [6, 'spi(port=0'], [7, 'max7219(serial'], [8, 'contrast(64)'], [10, 'with canvas'], [11, 'rectangle'], [12, 'draw.point((3, 3)'], [13, 'draw.point((4, 4)'], [15, 'while True'], [16, 'for level'], [17, 'contrast(level)'], [18, 'sleep(0.15)']]);

def('tft', `from luma.core.interface.serial import spi
from luma.lcd.device import st7735
from luma.core.render import canvas
from time import sleep

serial = spi(port=0, device=0, gpio_DC=24, gpio_RST=25)   # DC = GPIO24 (pin 18), RST = GPIO25 (pin 22)
device = st7735(serial, width=128, height=160)

level = 0
while True:
    level = (level + 8) % 104
    with canvas(device) as draw:
        draw.text((8, 8), "Raspberry Pi", fill="yellow")
        draw.rectangle((8, 60, 120, 80), outline="white")
        draw.rectangle((10, 62, 14 + level, 78), fill="green")
        draw.ellipse((50, 106, 78, 134), fill="red")
    sleep(0.3)`, [[6, 'spi(port=0'], [7, 'st7735(serial'], [9, 'level = 0'], [10, 'while True'], [11, 'level = (level + 8)'], [12, 'with canvas'], [13, 'draw.text'], [14, 'outline="white"'], [15, 'fill="green"'], [16, 'draw.ellipse'], [17, 'sleep(0.3)']]);

def('rfid', `from mfrc522 import SimpleMFRC522
import RPi.GPIO as GPIO

reader = SimpleMFRC522()      # SPI0, chip select CE0, reset on pin 22 (board numbering)

print("Hold a card near the reader")
try:
    while True:
        uid = reader.read_id()    # waits until a card is read: the UID as a number
        print("UID:", hex(uid))
finally:
    GPIO.cleanup()`, [[1, 'SimpleMFRC522'], [4, 'SimpleMFRC522()'], [6, 'Hold a card'], [7, 'try:'], [8, 'while True'], [9, 'read_id()'], [10, 'hex(uid)'], [11, 'finally'], [12, 'GPIO.cleanup()']]);

def('gps', `import serial
import pynmea2

port = serial.Serial("/dev/serial0", baudrate=9600, timeout=1)   # UART on GPIO14 (TX) and GPIO15 (RX)

while True:
    line = port.readline().decode("ascii", errors="replace").strip()
    if line.startswith("$GPGGA"):
        msg = pynmea2.parse(line)
        if int(msg.gps_qual) > 0:
            print(msg.latitude, msg.longitude, "satellites:", msg.num_sats)
        else:
            print("Waiting for a fix...")`, [[1, 'import serial'], [2, 'pynmea2'], [4, 'serial.Serial("/dev/serial0"'], [6, 'while True'], [7, 'readline()'], [8, '$GPGGA'], [9, 'pynmea2.parse'], [10, 'gps_qual'], [11, 'msg.latitude'], [13, 'Waiting for a fix']]);

def('rtc', `import time
import board
import adafruit_ds3231

i2c = board.I2C()                       # GPIO2 (SDA) and GPIO3 (SCL)
rtc = adafruit_ds3231.DS3231(i2c)       # address 0x68

if rtc.lost_power:
    rtc.datetime = time.localtime()     # set it once, to the time of the Pi

while True:
    t = rtc.datetime
    print(f"{t.tm_year}-{t.tm_mon}-{t.tm_mday} {t.tm_hour}:{t.tm_min}:{t.tm_sec}")
    print("Temperature:", rtc.temperature)
    time.sleep(1)`, [[5, 'board.I2C()'], [6, 'DS3231(i2c)'], [8, 'lost_power'], [9, 'rtc.datetime = '], [11, 'while True'], [12, 'rtc.datetime'], [13, 'tm_year'], [14, 'rtc.temperature'], [15, 'time.sleep(1)']]);

def('a4988', `from gpiozero import DigitalOutputDevice
from time import sleep

step = DigitalOutputDevice(5)       # GPIO5 (pin 29)
direction = DigitalOutputDevice(6)  # GPIO6 (pin 31)
enable = DigitalOutputDevice(13)    # GPIO13 (pin 33): ENABLE is active LOW
enable.off()

def turn(steps):
    for i in range(steps):
        step.on()
        sleep(0.001)
        step.off()
        sleep(0.001)

while True:
    direction.on()
    turn(200)
    sleep(1)
    direction.off()
    turn(200)
    sleep(1)`, [[4, 'DigitalOutputDevice(5)'], [5, 'DigitalOutputDevice(6)'], [6, 'DigitalOutputDevice(13)'], [7, 'enable.off()'], [9, 'def turn'], [10, 'for i in range'], [11, 'step.on()'], [12, 'sleep(0.001)'], [13, 'step.off()'], [14, 'sleep(0.001)'], [16, 'while True'], [17, 'direction.on()'], [18, 'turn(200)'], [19, 'sleep(1)'], [20, 'direction.off()'], [21, 'turn(200)'], [22, 'sleep(1)']]);

def('fan', `from gpiozero import PWMOutputDevice
from time import sleep

motor = PWMOutputDevice(12)       # GPIO12 (pin 32): PWM to the MOSFET gate through 220 ohm

while True:
    for speed in (0, 0.2, 0.4, 0.6, 0.8, 1.0):
        motor.value = speed
        print(speed)
        sleep(1.5)
    motor.value = 0
    sleep(1.5)`, [[4, 'PWMOutputDevice(12)'], [6, 'while True'], [7, 'for speed in'], [8, 'motor.value = speed'], [9, 'print(speed)'], [10, 'sleep(1.5)'], [11, 'motor.value = 0'], [12, 'sleep(1.5)']]);

def('flame', `from gpiozero import DigitalInputDevice, LED
from time import sleep

flame = DigitalInputDevice(27)     # DO of the flame sensor (GPIO27, pin 13)
led = LED(17)

while True:
    if flame.value == 0:           # LOW = flame on most modules
        led.on()
        print("FLAME")
    else:
        led.off()
        print("none")
    sleep(0.3)`, [[4, 'DigitalInputDevice(27)'], [5, 'LED(17)'], [7, 'while True'], [8, 'flame.value == 0'], [9, 'led.on()'], [10, '"FLAME"'], [12, 'led.off()'], [13, '"none"'], [14, 'sleep(0.3)']]);

def('uart', `import serial
from time import sleep, monotonic

link = serial.Serial("/dev/serial0", baudrate=9600, timeout=0.1)   # GPIO14 (TX) and GPIO15 (RX)
counter = 0

while True:
    link.write(f"HELLO {counter}\\n".encode())
    print("sent", counter)
    start = monotonic()
    while monotonic() - start < 1:
        line = link.readline().decode().strip()
        if line:
            print(line)
    counter += 1`, [[4, 'serial.Serial("/dev/serial0"'], [5, 'counter = 0'], [7, 'while True'], [8, 'link.write'], [9, '"sent"'], [10, 'monotonic()'], [11, 'while monotonic()'], [12, 'readline()'], [13, 'if line'], [14, 'print(line)'], [15, 'counter += 1']]);

def('timer', `from gpiozero import LED
from threading import Timer
from time import sleep

led = LED(17)
ticks = 0

def tick():
    global ticks
    led.toggle()
    ticks += 1
    Timer(0.5, tick).start()       # start the next one: a Timer runs only once

tick()
while True:
    print(ticks)
    sleep(2)                       # the main thread is busy: the LED keeps blinking`, [[2, 'Timer'], [5, 'LED(17)'], [6, 'ticks = 0'], [8, 'def tick'], [10, 'led.toggle()'], [11, 'ticks += 1'], [12, 'Timer(0.5, tick)'], [14, 'tick()'], [15, 'while True'], [16, 'print(ticks)'], [17, 'sleep(2)']]);

def('prefs', `import json
from pathlib import Path

path = Path("settings.json")
settings = json.loads(path.read_text()) if path.exists() else {}
settings["runs"] = settings.get("runs", 0) + 1
path.write_text(json.dumps(settings))
print("This program has started", settings["runs"], "times")`, [[1, 'import json'], [2, 'Path'], [4, 'Path("settings.json")'], [5, 'path.exists()'], [6, '"runs"'], [7, 'write_text'], [8, 'has started']]);

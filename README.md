# 3D Learning Lab — Arduino UNO Q and Raspberry Pi 4

Interactive, realistic 3D models with clickable parts and step-by-step lessons. A start screen lets you choose the board (or open `?board=unoq` / `?board=pi4` directly; **⇄ Board** in the top bar switches).

## Open it

Double-click **`UNO-Q-Learning-Lab.html`**. It runs in Chrome, Edge or Firefox, with no install, server or internet connection needed.

- **Explore the board**: drag to rotate 360°, scroll to zoom, right-drag to pan. Click any part or any single header pin to read about it. Use **Top**, **Bottom**, **360°** and **Labels** in the top bar.
- **Lessons**: 23 lessons in order, each ending with a quiz:
  - **Module 1: Getting started**
    1. Meet the Arduino UNO Q (guided tour of every part)
    2. Power the board safely (inputs, voltage rails, boot, limits, power button)
    3. Hello World: blink the built-in LED (official Blink sketch, active-low LED, Serial)
    4. Your first circuit: an external LED on D5 (breadboard, 220 Ω resistor, wiring, run)
  - **Module 2: Inputs & outputs**
    5. Read a push button (`digitalRead`, `INPUT_PULLUP`). Click and hold the 3D button.
    6. Read a potentiometer (`analogRead`, 14-bit ADC). Drag the 3D knob.
    7. Fade an LED with PWM (`analogWrite`, 500 Hz, with a simulated oscilloscope)
    8. Dimmer: the knob controls the LED (`map()`)
  - **Module 3: Light & sound**
    9. Draw on the LED matrix (`Arduino_LED_Matrix`, plus a pixel editor)
    10. Make sound with a piezo buzzer (`tone()` / `noTone()`, played through your speakers)
  - **Module 4: Sensors**
    11. Light sensor: an automatic night light (GL5528 photoresistor + 10 kΩ divider, light slider)
    12. Measure temperature with a TMP36 (analog, 10 mV/°C, temperature slider)
    13. Measure distance with ultrasound (HC-SR04: 5 V-tolerant pin D8, `pulseIn()`, true-scale box and tape measure)
    14. Detect motion with a PIR sensor (HC-SR501: 3.3 V output, wave-hand demo)
  - **Module 5: Motion**
    15. Turn a servo motor to an angle (SG90, Servo library, pulse-width oscilloscope)
    16. Drive a DC motor with an L293D (H-bridge, direction + PWM speed, battery, common ground)
    17. Switch a lamp with a relay module (low-level trigger, see-through relay, safe 3.3 V use)
  - **Module 6: I²C & Qwiic**
    18. Temperature & humidity with the Arduino Modulino® Thermo (Qwiic cable, I²C basics, Wire1, 3.3 V only)
    19. A colour thermometer with the Modulino® Pixels (daisy-chained Qwiic modules, addresses 0x45 / 0x6C, set/clear/show)
  - **Module 7: Linux side & Bridge**
    20. Two brains: Python calls your sketch over the Bridge (MPU + MCU, provide/call/notify, App.run, deadlock warning)
    21. Send sensor readings from the sketch to Python (Bridge.notify, Python decides, Bridge.call back, store-then-decide rule)
    22. A Wi-Fi dashboard (Web UI brick, WebSocket push, live phone mock-up, three-file code panel)
  - **Module 8: Final project**
    23. Final project: a smart room controller (Thermo + relay + lamp, Python decides Auto/Manual, web page with working buttons)

Purple notes in the lessons mark behavior that is only **simulated** in the app, such as the shortened boot time.

## Raspberry Pi 4 Model B (new)

- **Explore the board** is ready: a 360° Raspberry Pi 4 at exact size, with every chip, port, LED and all 40 GPIO pins clickable (pin card: physical pin, GPIO number, 3.3 V level, typical use, default pull and ALT0–ALT5 functions from the datasheet).
- How it is built: geometry (board outline, holes, every connector's position, size and height) from Raspberry Pi's **official mechanical drawing**, read from its vector data; surface from **real CC BY-SA photographs** of the board, straightened onto the exact millimetre grid with the four mounting holes. Connectors are real 3D shapes with hollow openings (USB tongues and contacts, RJ45 contacts and LED lenses, USB-C and micro-HDMI shells). Details and every source: [`docs/pi4-source-notes.md`](docs/pi4-source-notes.md), pipeline: [`tools/pi4/`](tools/pi4/README.md).
- **Lessons** (Python with GPIO Zero; programs are the official examples from the Raspberry Pi documentation):
  - **Module 1: Getting started**
    1. Meet the Raspberry Pi 4 (guided tour of every part)
    2. Set up: microSD (Raspberry Pi Imager), monitor on HDMI0, keyboard/mouse on USB 2.0, power last, safe shutdown — all connections shown in 3D
    3. The 40-pin GPIO header and 3.3 V safety (physical pin vs GPIO number, power/ground pins, 16 mA / 50 mA limits)
  - **Module 2: GPIO with Python**
    4. Blink an LED (`LED(17)`, female–male jumpers from the header to a breadboard)
    5. Read a push button (`Button(2)`, pull-up)
    6. The button controls the LED
    7. Fade an LED with PWM (`PWMLED`, value 0–1, duty cycle, default 100 Hz)
  - **Module 3: Working on the Pi**
    8. The Terminal: your first commands (practice terminal; every command and its meaning from the official documentation, no invented output)

## Works on every screen

The layout adapts to the device: laptops and desktops (three columns), tablets (the lesson list becomes a slide-out ☰ menu), phones in portrait (3D view on top, then **Lesson** / **Code & run** tabs with quick ▶ Run and ■ Stop buttons) and phones in landscape (3D view left, lesson right). Touch: drag to rotate, pinch to zoom, tap any part. The 3D renderer uses a lower pixel ratio on touch screens to save battery.

> **Developers / new Claude sessions:** read [`HANDOFF.md`](HANDOFF.md) first (rules, architecture, workflow, next steps).

## Where the facts come from

| Source | Used for |
|---|---|
| Arduino UNO Q datasheet ABX00162-ABX00173 (rev. 30/10/2026) | specs, pin maps, power, LEDs, connectors |
| Arduino UNO Q user manual (docs.arduino.cc) | code examples, LED_BUILTIN, Serial, ADC/PWM details |
| Arduino UNO Q full pinout PDF | physical pin order (JSPI, JCTL, RGB LEDs) |
| STMicroelectronics STM32U585 datasheet, Table 31 | 20 mA per pin / 120 mA total absolute maximum |
| Arduino official CAD files (Gerber, drill, STEP) | board artwork, holes, part positions and sizes |
| Arduino store product photos (ABX00162) | header print, Wi-Fi module label, chip markings |
| GL55-series photoresistor datasheet | GL5528 values (10–20 kΩ at 10 lux, ≥ 1 MΩ dark, γ 0.6), dimensions |
| Elecfreaks HC-SR04 datasheet | supply, range, 10 µs trigger, µs ÷ 58 = cm, > 60 ms cycle |
| HC-SR501 datasheet + Handson user guide | PIR supply, 3.3 V output, range, angle, delay, trigger modes, pinout |
| TowerPro SG90 datasheet + Arduino Servo library source | servo wires, 4.8 V, 180°, 0.1 s/60°, 544–2400 µs pulses every 20 ms, Zephyr support |
| TI L293x datasheet (SLRS008D) + Adafruit #711 motor spec | L293D pinout, 600 mA/1.2 A, VIH 2.3 V, VCC1/VCC2, function tables, clamp diodes; 130 motor currents |
| Handsontec 1-channel relay module guide | relay pinout COM/NO/NC, active-low trigger, DC 30 V / AC 250 V 10 A contacts, optocoupler schematic, 3.3 V note |
| Arduino Modulino Thermo datasheet (ABX00103) + Arduino_Modulino library | GXHT30C specs, I²C address 0x45, Qwiic/headers, board outline, Thermo_Basic example |
| Arduino Modulino Pixels datasheet (ABX00109) + Arduino_Modulino source | 8 × LC8822-2020 RGB LEDs, address 0x6C, 33 mA/LED, set/clear/show, brightness 0–100 → 5-bit |
| Arduino_RouterBridge README + source; app-bricks-py `arduino.app_utils` source; app-bricks-examples “Bridge basics” | Bridge.begin/provide/call/notify, Python Bridge.call timeout and errors, App.run(user_loop), deadlock warning |
| Arduino App Bricks Web UI brick README + examples “Web UI basics” | WebUI(), port 7000, assets folder, send_message / on_message, App.run starts the server, app.yaml bricks entry |
| Analog Devices TMP35/36/37 datasheet, Rev. F | TMP36 output (0.5 V + 10 mV/°C), supply, accuracy, TO-92 pinout |
| Arduino Zephyr core source (ArduinoCore-zephyr) | `analogRead` 10-bit default, `analogWrite` 8-bit default and non-PWM behavior, `tone()` behavior |

## Rebuild (developers)

```
npm install
node tools/check_code.mjs      # checks simulator line numbers against the code listings
node tools/check_lessons.mjs   # checks every lesson circuit: wiring, shorts, LED polarity, text vs 3D wires
npm run build        # bundles src/ + assets/ into UNO-Q-Learning-Lab.html
```

To regenerate the PCB textures from Arduino's CAD package (`ABX00162-cad-files.zip` from docs.arduino.cc/hardware/uno-q):

1. Install `gerber-to-svg` and `@resvg/resvg-js` with npm (Python needs numpy, scipy, Pillow and scikit-image).
2. Run `node tools/g2svg.js <gerber folder> <work folder>`, then `node tools/svg2png.js <work folder> 60`.
3. Run `python tools/build_pcb.py <work folder> <…-1-8.drl drill file> assets`.

## Licenses

Raspberry Pi 4 textures (`assets/pi4/`) are derived from photographs on Wikimedia Commons, licensed **CC BY-SA 4.0**: “Raspberry Pi 4 Model B - Top.jpg” by Laserlicht and “Raspberry Pi 4, 2 GB RAM version 3.jpg” by Suyash Dwivedi. The straightened textures are shared under the same licence. Raspberry Pi is a trademark of Raspberry Pi Ltd; this project is not affiliated with Raspberry Pi Ltd.

The board artwork in `assets/` is derived from Arduino's UNO Q CAD files, licensed **CC BY-SA 4.0** (© Arduino). The derived textures are shared under the same license. Arduino®, UNO and Qualcomm® Dragonwing™ are trademarks of their respective owners. This is an independent learning tool, not an official Arduino product.

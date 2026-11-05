# Arduino UNO Q · 3D Learning Lab (Stages 1–3, in progress)

An interactive, realistic 3D model of the **Arduino UNO Q** with clickable parts and step-by-step lessons.

## Open it

Double-click **`UNO-Q-Learning-Lab.html`**. It runs in Chrome, Edge or Firefox, with no install, server or internet connection needed.

- **Explore the board**: drag to rotate 360°, scroll to zoom, right-drag to pan. Click any part or any single header pin to read about it. Use **Top**, **Bottom**, **360°** and **Labels** in the top bar.
- **Lessons**: twelve lessons in order, each ending with a quiz:
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

Purple notes in the lessons mark behavior that is only **simulated** in the app, such as the shortened boot time.

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

The board artwork in `assets/` is derived from Arduino's UNO Q CAD files, licensed **CC BY-SA 4.0** (© Arduino). The derived textures are shared under the same license. Arduino®, UNO and Qualcomm® Dragonwing™ are trademarks of their respective owners. This is an independent learning tool, not an official Arduino product.

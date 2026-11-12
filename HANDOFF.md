# HANDOFF — read this first (for any new Claude session or developer)

This file lets a **new** Claude Code session (or a person) continue the project without the old chat.
Project: **Arduino UNO Q 3D Learning Lab** — a browser app (Three.js) that teaches the UNO Q from zero to a final project.
Owner: Arul. Language: **English only**.

Repo: https://github.com/arulsj888-debug/uno-q-learning-lab (branch `main`). Vercel auto-deploys on every push to `main` (build `npm run build`, output `dist`).

## 1. State right now

- **Done:** 23 lessons in 8 modules (see `README.md`), responsive layout for phones, tablets and laptops.
- Everything is committed and pushed. Last big pieces: Lesson 23 (final project), responsive update.
- **Raspberry Pi 4 (in progress):** board chooser + realistic 3D Pi 4 in *Explore* mode are done (`src/pi4/board.js`, `src/pi4/data.js`, `assets/pi4/`, `docs/pi4-source-notes.md`, `tools/pi4/`). `main.js` selects the board from `?board=pi4` (constants `IS_PI`, `PARTS`, `findPin`, `PIN_HEADERS` … at the top). Pi lessons 1–13 done (13 = camera module: `CameraModule`/`CameraLink` in peripherals.js, acc keys `cam`/`camlink`, `piCam()` in main.js, TERM_CMDS entries with `only:'p13'`, lesson field `termGroups`, module 8) (12 = TonalBuzzer scale, module 7 “Extra: sound”) (11 = final project control panel) (10 = Flask web page, phone kind `piweb`, sim `pi_web`) (9 = SHT31-D I²C sensor, class `SHT31Breakout`, io kind `i2c`) (lesson 8 has a 3D monitor `Monitor` in `src/pi4/peripherals.js`, OS state `this.pios`, `piCmd()` in main.js) (`src/pi4/lessons.js`, programs `pi_*` in `src/sim.js`, accessories in `src/pi4/peripherals.js`; checker covers Pi circuits with pins `p1`…`p40`). **All planned Pi lessons are done.** Optional idea only if the user asks: free-build mode.
- Not done / known gaps: nothing was tested on real hardware; no final read-through of all lesson texts; English only.

## 2. The owner's hard rules (never break these)

1. **No wrong information.** Every spec, pin, voltage, API name and number must be verified from a **primary source** (datasheet, official docs, library source code) before it goes into a lesson. If a source is silent, say so or leave it out. Cite sources at the end of each lesson (`sources: [...]`).
2. **Original, realistic look.** Boards and parts must look like the real thing (real colours, real layout, real markings), built from official CAD/photos. No dummy pictures, no toy look. Correct real-world size.
3. **Visuals must agree with the data.** Example of a past mistake: header labels were mirrored, so a "GND" wire looked like it went to "RESET". Always close-up screenshot-check every label, pin and wire after building.
4. **Simple, close-up, cause → effect demos.** No big zoomed-out scenes, no confusing extras. When something turns on/off, show clearly why. Explain why each part is there.
5. **Every part clickable** with a short info box with a pointer line (like Explore mode), never a big card that blocks the board.
6. **Teaching order:** from basics to advanced, one idea per lesson, every lesson ends with a quiz and a Sources list.
7. After each lesson/feature: **commit and push** (the owner asks "push this into git"). The owner also likes a short daily summary: *task (one line)* + *description (one short paragraph, including what comes next)*.
8. Be honest about what is simulated vs. verified. Purple "sim" notes in lessons mark simulated behaviour.

## 3. Architecture (single-page app, no framework)

| Path | What it is |
|---|---|
| `src/main.js` | The `App` class: modes (Explore / Lessons), lesson player (`startLesson`, `goStep`, `doAction`), dock widgets (`renderIO`), simulator hooks (`setupSim`), per-lesson logic blocks (`relayTick`, `thermoTick`, `bridgeTick`, `dashTick`, `homeTick` …), camera presets `VIEWS`, `bindResponsive`. |
| `src/board.js` | The 3D UNO Q board from textures + `assets/board_data.json`. |
| `src/hardware.js` | All 3D parts (LED, resistor, breadboard, sensors, relay, Modulino boards, Qwiic cable …) **and** the click-info texts `HW_INFO`. Parts expose `pin(name) → {pos, dir}` and tag sub-parts with `userData.hw`. |
| `src/bench.js` | Builds a lesson circuit from plain data (`{id, type, …}`): placing parts, wires, leads, cables. |
| `src/sim.js` | Sketch/Python simulator: each program (`PROGRAMS.name`) is an async function that calls `rt.at(lineNumber)`; line numbers must match the listing in `src/data/code.js`. Python lines are `101+`, browser JS `201+`, sketch `1+`. |
| `src/data/lessons.js` | `SRC` (source table), circuits (`*_PARTS`, `*_IO`), the `LESSONS` array, `MODULES`. |
| `src/data/code.js` | All code listings. `src/data/parts.js` / `pins.js` = board part and pin texts. |
| `src/viewer.js`, `materials.js`, `scope.js` | Renderer/camera/picking, materials, oscilloscope. |
| `src/style.css`, `src/index.html` | UI (responsive rules at the end of the CSS). |
| `tools/build.js` | Bundles `src/` + `assets/` into the single file `UNO-Q-Learning-Lab.html` (and `dist/index.html`). |
| `tools/check_code.mjs` | Verifies simulator line numbers against the code listings. |
| `tools/check_lessons.mjs` | Electrical audit of every lesson circuit (wires land on real pins, no shorts, polarity, 5 V safety, text claims vs 3D wires, per-kind I/O checks). |
| `tools/build_pcb.py`, `g2svg.js`, `svg2png.js` | PCB texture pipeline (Gerber → SVG → PNG → albedo/ORM/bump + `board_data.json`). See `README.md` "Rebuild". |
| `tools/dev/shot.js` | Headless-Chrome screenshot runner (see section 5). |

How a lesson is defined (see `lessons.js`): `{ id, num, module, title, goal, hardware[], code, code2?, code3?, program, widgets[], circuit, io, explain{line→html}, steps[{title, view, have[], power, showCode, action, body}], quiz[], sources[] }`. Steps use `have` (ids of parts present), `power` (USB plugged), `labels`, `pins`, `holes`, `focus`, `view` (a camera preset).

## 4. Normal workflow for a new lesson

1. **Research first** from primary sources (datasheet PDFs, official docs, library source). Save notes; verify every number. Download PDFs with `curl`, read with PyMuPDF (`pymupdf`).
2. Write the code listing in `code.js`; add its line checks in `tools/check_code.mjs`.
3. Add the simulator program in `sim.js` (line numbers = listing lines).
4. Add parts to `hardware.js` (+ `HW_INFO` texts) and a type in `bench.js`; add checker rules in `tools/check_lessons.mjs`.
5. Add the lesson data to `lessons.js` (and sources to `SRC`), dock widget + tick logic in `main.js` if needed.
6. Run `node tools/check_code.mjs && node tools/check_lessons.mjs && npm run build`.
7. **Screenshot-verify** at close range (labels, wires, colours), also run a planted-error test of the checker for any new rule.
8. Update `README.md` (lesson list + sources table), commit, `git push`.

## 5. Testing in a browser (headless Chrome)

`tools/dev/shot.js` runs scenarios against the built `UNO-Q-Learning-Lab.html`:
`node tools/dev/shot.js UNO-Q-Learning-Lab.html <outdir> <scenario>`.
It needs `puppeteer-core` (not in this repo's package.json — run `npm i --no-save puppeteer-core` or install it in a separate folder) and Google Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`.
Env vars `VW`, `VH`, `MOBILE=1`, `TAG` set a device size (used for the responsive checks). Scenarios were written per lesson (they call `app.startLesson('l22')`, `app.goStep(n)`, click `#run`, etc.); add new ones in the `scripts` object. The page logs a harmless 404 for the Vercel Speed Insights script when opened locally.

## 6. Practical tips and past pitfalls

- Windows. Prefer the file tools to write scripts; **inline shell heredocs with many quotes break** — write a `.py`/`.js` file and run it. Use `python -I` for scripts that read downloaded files.
- If headless Chrome says "browser is already running": kill leftover `puppeteer_dev_chrome_profile` processes, then retry.
- GitHub fetches sometimes fail on the first try: retry. `git push` needs the owner's GitHub login (already configured on their PC). Do not ask for or paste tokens.
- `setMode()` resets `#app` className, so UI state for responsive layout lives on `body` (`data-menu`, `data-tab`).
- The original Arduino CAD/Gerber downloads are **not** in the repo (large). To rebuild textures, download `ABX00162-cad-files.zip` from docs.arduino.cc/hardware/uno-q (CC BY-SA 4.0).
- `new.txt` in the repo root is a stray file from the owner; ignore it.
- Memory notes for Claude (project status and rules) are in the owner's PC folder `C:\Users\Arul SJ\.claude\projects\c--Users-Arul-SJ-Downloads-iot-3d\memory\` — a new Claude Code session on the same PC may load them automatically; this file duplicates the important parts.

## 7. NEXT: Raspberry Pi 4 version (owner's request)

**Owner's requirement:** "the same as the UNO Q for Raspberry Pi — every hardware part and every connection should be there, in lessons, in a learning way", with the same quality bar (section 2).

### Key differences to respect (do not copy UNO Q lessons blindly)

- The Pi 4 is a **Linux computer**, not a microcontroller board: **no Arduino sketches**. Lessons use the OS, the terminal and **Python** (e.g. `gpiozero` / `RPi.GPIO` / `lgpio` — verify which are current in the official docs).
- **All GPIO is 3.3 V logic** (verify in the official documentation) — no 5 V-tolerant pins; strict safety lessons. **No analog inputs** (analog sensors need an ADC chip; prefer digital I²C/1-wire sensors or teach an ADC).
- First-use steps differ: SD card, imaging the OS, first boot, headless/SSH, power supply requirements. All of this must be taught and shown in 3D (SD card, cable, monitor, keyboard).
- The simulator must change: instead of line-by-line Arduino sketches, simulate **Python programs** and a **terminal** (command → output) with the same line-highlighting idea. The Bridge/Web UI lessons of UNO Q (Python side, web page with Flask-like server) are useful models, but only teach APIs that exist on Raspberry Pi OS and are verified.

### Hardware/connection checklist to cover (verify each against the official Raspberry Pi 4 Model B datasheet and mechanical drawing BEFORE writing)

Chips: BCM2711 SoC, LPDDR4 RAM, PMIC, USB controller, Ethernet PHY, Wi-Fi/Bluetooth module (check exact parts and positions from the official drawing/photos).
Connectors: USB-C power, 2 × micro-HDMI, 3.5 mm audio/composite jack, 2 × USB 3.0, 2 × USB 2.0, Gigabit Ethernet, CSI camera connector, DSI display connector, microSD slot, 40-pin GPIO header, PoE header, LEDs (power/activity).
Then the accessories and wiring a learner needs: power supply, microSD card, HDMI monitor + cable, keyboard/mouse, Ethernet cable, breadboard, jumper wires (female–male), resistors, LEDs, push button, sensors.

### Suggested plan

1. **Source check first (no building yet):** find and verify the official board dimensions, 40-pin pinout, mechanical drawing and any official 3D/STEP model, plus photos for markings. Tell the owner if a realistic model is not possible from official sources.
2. **Architecture:** keep one repo; reuse `viewer.js`, `materials.js`, `bench.js`, `hardware.js` parts (breadboard, LED, resistor, wires …). Add a Pi board module (e.g. `src/pi4/board.js`, its own `parts`/`pins` data, its own lessons file) and either a board chooser or a second entry/build (`Pi4-Learning-Lab.html`). Avoid breaking the UNO Q app; keep both checkers green.
3. **Explore mode:** 360° realistic Pi 4, every chip/connector/pin clickable with verified info, pin table (40-pin with function names and the verified 3.3 V/5 V/GND power pins).
4. **Lessons (suggested order, each with 3D hardware, wiring, simulated Python/terminal, quiz, sources):** meet the board → power and SD card/OS → first boot and the desktop/terminal → terminal basics → the 40-pin header and GPIO safety → LED + resistor on a breadboard → button → PWM (LED fade) → buzzer → digital sensor (e.g. I²C) → camera connector → a small web page served from the Pi → final project. Adjust after the source check.
5. Per-lesson workflow = section 4. Add checkers for Pi wiring (3.3 V only, no short, correct pin numbers: use BCM/GPIO numbers **and** physical pin numbers consistently and verify the mapping).

### Open question the owner should confirm at the start

Whether to (a) put the Pi 4 inside the same site as a second board or (b) make a separate site. Default recommendation: same repo, board chooser on the start screen.

## 8. Daily summary format the owner likes

```
Task: <one line>
Description: <one short paragraph: what was done today and what comes next>
```

- **Free build mode (2026-11-06):** mode `build` (`src/freebuild/`): `circuit.js` = pure MNA solver + explanations (tests: `node tools/check_freebuild.mjs`), `build.js` = `FreeBuild` controller (palette, picking of holes/pins/rails by screen distance, wires, undo, localStorage `fb:<board>`, pin panel, voltmeter), `examples.js`. Hooks in main.js: `this.fb`, setMode, renderSide, viewer onHover/onPick, tick. Bench got `place()`, rail refs `r:top+:5`, LED `hex`. Free-build parts so far: resistor, LED, button, pot, buzzer, LDR, TMP36, HC-SR04, PIR (desk module, endpoint refs `pir1.VCC`), servo, SHT31 (I²C). Relay + battery + lamp done (bare 'lead' wires, refs rel1.DCP …). L293D + motor done (element type 'H' in the solver). Modulino Thermo/Pixels over Qwiic done (UNO Q only, bus logic in circuit.js). Pi setup accessories done (FreeBuild.pi, applyPi, piNotes). Free-build is feature-complete for the planned hardware. (old list:) Modulino Thermo/Pixels over Qwiic (UNO Q), Pi camera/accessories.

- **Arduino UNO R3 (2026-11-10):** third board, `?board=uno3`, `IS_U3` in main.js. Model `src/uno3/board.js` (`Uno3Board`) + data `src/uno3/data.js` (pins `D0`…`D13`, `GND1`, `AREF`, `SDA`, `SCL`, `NC`, `IOREF`, `RESET`, `3V3`, `5V`, `GND2`, `GND3`, `VIN`, `A0`…`A5`). Textures + `assets/uno3/board_data.json` generated from the official board file with `python -I tools/uno3/build_uno3_pcb.py <UNO-TH_Rev3e.brd> assets/uno3` (board file from docs.arduino.cc A000066-cad-files.zip). USB-B cable: `makeUsbCable('usbb')`. Free build: boardKind `uno3` (5 V pin model in circuit.js `pinKind`). UNO R3 lessons 1–16 done (`src/uno3/lessons.js` 1–8, `lessons2.js` 9–16, shared `common.js`; sim programs `u3_pot`, `u3_night`, `u3_tmp36`, `u3_relay`, `u3_sht31` and the shared ultrasonic/pir/servo/motor programs; main.js hooks: `vref`, `avr` (ATmega328P ADC = floor(Vin×1024/Vref)), `servoStep` 1 µs, `adcCount`, pulseIn 1 µs, `pinName`, widget text `D5`→`pin 5`). `tools/check_lessons.mjs` audits the UNO R3 circuits too. Next: ESP32 board (ask which module; research official pinout, 3.3 V rules).
- **ESP32 DevKit V1 (2026-11-10):** fourth board, `?board=esp32`, `IS_E32` in main.js. Files `src/esp32/{board,data,code,lessons}.js`. Pin ids `G<gpio>` (G2, G16 …), `EN`, `VIN`, `3V3`, `GND1` (left row), `GND2` (right row); wires are `fwire` from the pin (pins point up, `female` position). Sim programs `e_blink/e_extled/e_button/e_pot/e_fade`, sim hooks `adcBits` (12) and `ledcAttach/ledcWrite`. Micro-USB cable kind `micro` in `makeUsbCable`. Chooser thumbnail drawn at runtime (`boardThumb()`). `this.fb` is null for the ESP32 (Build tab hidden). `tools/check_lessons.mjs` and `tools/check_code.mjs` cover the ESP32. Next: touch sensor, Wi-Fi scan/connect + web server lessons (needs a Wi-Fi sim), Bluetooth LE, free build (circuit.js pinKind 'esp32': 3.3 V, input-only GPIO34-39).
- **ESP32 Wi-Fi lessons 8-10 (2026-11-10):** sim hooks `wifiScan/wifiBegin/wifiStatus/wifiIP` (`this.wf` = simulated router state, reset for every lesson), `rt.scanNetworks/wifiBegin/wifiStatus/wifiIP`; widgets `wifiscan`, `wifirouter` (`wifiTick`), and `piweb` reused for the phone page (E32 texts). Programs `e_scan`, `e_connect`, `e_web`; listings E32_SCAN/E32_CONNECT/E32_WEB (APIs checked against Arduino-ESP32 sources: WiFiScan, HelloServer, WebServer.h, WiFiSTA.h). Next: touch sensor, Bluetooth LE, deep sleep, free build.
- **ESP32 touch lesson 11 + free build (2026-11-10):** lesson e11 (program e_touch, hook touch, widget touch). Free build boardKind 'esp32': pinKind in circuit.js (3.3 V, vih 0.75 VDD, 28 mA, 12-bit ADC via k.adcMax, input-only GPIO34-39 get only Input/Analog), FreeBuild.isE32/fw (female-male pin wires), EXAMPLES_E32 in examples.js, tests in tools/check_freebuild.mjs. Not in ESP32 build: servo, HC-SR04, PIR, relay, motor, SHT31 (need 5 V / I2C models). Next: Bluetooth LE, deep sleep.
- **ESP32 deep sleep lesson 12 (2026-11-10):** program e_sleep, rt.deepSleep (outputs go low, pins cleared, program restarts after the timer; bootCount kept in the program closure like RTC_DATA_ATTR), hook sleep, widget sleep (sleepTick). Only the BLE lesson is left.
- **ESP32 Bluetooth LE lesson 13 (2026-11-11):** program e_ble (listing E32_BLE based on the Arduino-ESP32 BLE Write example), rt.ble hook -> this.bl {adv,conn,val}, simulated scanner app as phone kind 'ble' (bleRender, bleTick, widget ble). All planned ESP32 lessons done (13).
- **ESP32 free build extras (2026-11-11):** servo (VIN 5 V, ESP32Servo library code), HC-SR04 (5 V echo needs the 1k + 2.2k divider, direct connection damages the pin), SHT31 on GPIO21/22; 3 more examples + tests; checklist text uses GPIO/ADC wording for the ESP32; echoDivider() in circuit.js fixes the ECHO checklist for the Pi and ESP32 divider circuits.
- **Web build split (2026-11-11):** tools/build.js builds twice: single offline file (dataurl images) and dist/ (file loader, dist/img/<name>-<hash>.jpg). Textures load only for the active board (board constructors). Chooser thumbnails: assets/thumbs/{uq,u3,pi}.jpg (640 px). Texture quality is unchanged. Idea not done: also defer the bottom-side textures.
- **UNO R3 lessons 17 (RGB LED) and 18 (DHT11) + ESP32 EN pin (2026-11-11):** u17/u18 in src/uno3/lessons2.js (module 7), listings U3_RGB/U3_DHT, sim programs u3_rgb/u3_dht, hooks dht + rgbSet/rgbShow in main.js (io kinds 'rgb' and 'dht'), DHT wording in pisensTick (L.dht). The EN pin of the ESP32 was 'nc' in free build and could not be wired: pinKind 'en' (3.3 V input, pulled up, LOW = chip held in reset, enLow stops every GPIO output), example + tests.
- **ESP32 lessons 14 (RGB LED, ledcAttach/ledcWrite) and 15 (DHT22 from 3V3) (2026-11-11):** programs e_rgb/e_dht share the u17/u18 hooks (rgbSet, dht hook). 15 ESP32 lessons now. NOTE: the user's tts/ folder is untracked and must NOT be committed (use git add -A -- . ':!tts').
- **Free build joystick + rotary encoder (2026-11-11):** parts 'joystick' (GND, VCC, VRX, VRY, SW; two pots, env.joy[id] {x,y}, switch via env.pressed[id]) and 'encoder' (CLK, DT, SW, VCC, GND; env.enc[id] = quarter steps, Gray pattern 11,01,00,10), 3D classes JoystickModule/EncoderModule, room-panel controls (data-joy, data-encstep, data-hold), 5-hole footprint in rows f-j, examples + tests on UNO Q, UNO R3, Pi (encoder only), ESP32. Lessons for them are still TODO.
- **Free build NeoPixel strip (2026-11-11):** desk module 'neopixel' (terminals VCC, DIN, GND via lead wires, class NeoPixelStrip, pin mode 'neopixel' with cfg.pattern and cfg.bright, neoColors() in circuit.js, current 20 mA per colour = 60 mA/pixel white, data level must be >= 70 % of the supply). Examples and tests on UNO Q, UNO R3, Pi, ESP32. Ring and lessons TODO.
- **Free build I2C displays (2026-11-11):** desk modules 'lcd1602' (GND, VCC, SDA, SCL; 5 V; 0x27/0x3F) and 'oled' (GND, VCC, SCL, SDA; 0x3C), classes LCD1602Module/OLED128x64Module (canvas text from env.disp1/disp2), modpin wires, status shows text only when VCC and I2C wiring are right (blank backlight otherwise). Examples and tests on UNO Q, UNO R3, Pi, ESP32. Lessons TODO.
- **Realistic look pass (2026-11-11):** DHT11/DHT22 (moulded grille with bump map, printed name, flat tinned legs), joystick (blue PCB silkscreen, gimbal housing, ribbed rubber cap), rotary encoder (steel can, threaded bush, hex nut, fluted knob), LCD1602 (silver bezel, 5x8 dot matrix with a real 5x7 font, I2C backpack with chip and trimmer), OLED (glass, pixel text, FPC), NeoPixel strip (white FPC with copper pads, 5050 packages, capacitors, cut lines). Helpers silk() and glyph5x8() in hardware.js.
- **Joystick and encoder lessons (2026-11-11):** UNO R3 u19 joystick, u20 encoder; ESP32 e16 joystick, e17 encoder (module 8 Controls). New io kinds joyax / joysw / enc in lessons, widgets 'joy' and 'enc' (joyPos, joySw, encPh, encSw; encTurn = 4 phase steps, 25 ms apart), hooks in read/analog, ctlTick, programs u3_joy/u3_enc/e_joy/e_enc.
- **Display lessons (2026-11-11):** UNO R3 u21 LCD (LiquidCrystal_I2C) and u22 OLED (Adafruit_SSD1306); ESP32 e18 / e19 (module 9 Displays). Desk modules lcd1602/oled in lesson circuits at x 20, z 138 (bb.center is x 0, z 68); camera view 'dispq'. Hooks rt.lcd / rt.oled -> lcdOp / oledOp (main.js), widgets lcdaddr / oledaddr (module address 0x27 vs 0x3F, 0x3C vs 0x3D), displayTick pushes text to the 3D screens. ESP32 wires go module -> breadboard -> pins.
- **NeoPixel lessons (2026-11-11):** UNO R3 u23 and ESP32 e20 (module 9). Hook rt.neo -> neoOp (px, br, shown on show()), io kind 'neo', widget 'neolevel' (ESP32 level shifter absent/present; L.neoLow shows the broken pattern when absent), displayTick updates the 3D strip. Strip placed at x 35, z 140 with lead wires.
- **Raspberry Pi lessons 14-16 (2026-11-11):** p14 RGB LED (gpiozero RGBLED on GPIO18/12/13), p15 DHT22 (adafruit_dht on GPIO18, 4.7 kOhm pull-up, 3V3), p16 rotary encoder (gpiozero Button polling on GPIO17/27/22); modules 9 and 10; sim programs pi_rgb / pi_dht / pi_enc reuse the rgbSet, dht and enc hooks. Pi now has 16 lessons.
- **Raspberry Pi lessons 17-19 (2026-11-12):** p17 LCD (RPLCD CharLCD('PCF8574', 0x27, cols=16, rows=2)), p18 OLED (adafruit_ssd1306 SSD1306_I2C, addr 0x3C), p19 NeoPixel (neopixel on board.D18, needs sudo); module 11 Displays; desk modules at x 125/110, z -45/-20 (view 'dispp'); build.js DESK_SLOT_PI places the display and strip modules clear of the Pi board; lcdOp has a 'probe' op for Python-style errors. Pi now has 19 lessons.
- **Diode and NPN transistor in free build (2026-11-12):** parts 'diode' (A, K; 1N4007: Vf 0.85 V at 20 mA gives 1.1 V at 1 A; burns above 1 A) and 'npn' (PN2222A TO-92, terminals E B C, flip swaps E/C; solver element 'Q': Ic = beta x Ib with beta 100, ohmic below VCE 0.3 V; burns above 600 mA; notes for no base current / pin order / not saturated / missing flyback diode on a motor or relay). Classes Diode1N4007 and TransistorPN2222A. Examples (lamp + battery pack on the desk) and tests on all boards. A capacitor needs a time-dependent solver (not done).
- **Transistor lessons (2026-11-12):** UNO R3 u24 and ESP32 e21 (module 10 Switching loads): PN2222A switches a 6 V lamp; widget 'qbase' (base resistor select), qCalc() (Ib = (V - 0.7) / (R + rout), Ic = min(100 Ib, 290 mA)), io kind 'npn' (pin level in onDigital -> qPin), lamp driven by qTick.
- **IRLZ44N MOSFET (2026-11-12):** Build part 'mosfet' (terminals G, D, S; TO-220, class MOSFETIRLZ44N; solver element 'F' with datasheet RDS(on) 35/25/22 mOhm at 4/5/10 V, ramp from 1.5 V, body diode as a 'D' element; warnings: floating gate, gate pin as input, swapped D/S, 3.3 V gate with >0.5 A, missing flyback diode, VGS beyond +-16 V). Examples for all boards; lessons u25 (UNO R3) and e22 (ESP32), module 10, widget 'mosload', io kind 'mosfet', program reuses u3_qsw / e_qsw. Datasheet: Infineon IRLZ44NPbF (no RDS(on) value below 4 V: labelled as an estimate).
- **1N4007 diode lesson (2026-11-12):** u26 (UNO R3) and e23 (ESP32), module 10: two identical LED branches, the second diode turned round (only LED 1 lights); io kind 'led' with diode/rev fields (check_lessons handles the chain), new view 'bbwide' (breadboard close-up), reuses programs extled / e_extled. Source: Vishay 1N4001-1N4007 datasheet.
- **Active buzzer in Build (2026-11-12):** buzzer def gets `active: true` (select next to the Buzzer tool, opts.bzActive); solver adds a 167 ohm load (about 30 mA at 5 V), sounds from 3 V, reversed = silent; fixed 2.5 kHz beep (listings 2.3-2.7 kHz); 3D variant of PiezoBuzzer (sealed top with sticker, tag 'abuzzer'). Examples on all boards (UNO R3 plain, 3.3 V boards warn). Specs unverified by a manufacturer datasheet: labelled typical.
- **Capacitor in Build (2026-11-12):** part 'cap' (a = + long leg, k = - stripe side, uf 10/100/470; 2 adjacent holes like an LED; class ElectrolyticCap, tag 'cap'). First time-dependent element: solver element 'C' (backward Euler, G = C/dt with current source G*v0); evaluate({dt, capV}) returns result.capV; build.js keeps this.capV and passes dt via capDt(); examples can carry `caps: {id: volts}` as the start charge. Extra inrush solve (dt 1e-6) feeds the pin-damage check (empty capacitor straight from a pin). Reverse voltage below -1 V or above 16 V burns it. Examples on all boards (charge/fade, discharge, backwards, no resistor).
- **Switches in Build (2026-11-12):** parts 'reed' (a,k; axial, 4-6 holes), 'tilt' (a,k; two adjacent holes), 'slidesw' (SPDT: A, COM, B in columns n..n+2). State lives in env.sw[id] (click the part in 3D; examples may carry `sw: {id: bool}`); solver: closed contact = 0.05 ohm resistor (slide: COM to A or B). Classes ReedSwitch (magnet appears when closed), TiltSwitch, SlideSwitch. Examples on all boards.
- **7-segment display in Build (2026-11-12):** desk module 'sevenseg' (terminals A..G, DP, COM as female-jumper `fwire` leads to breadboard holes; class SevenSegModule with setLevels; DESK_SLOT [72, 8], Pi [100, 45]). Solver: 8 diodes (VF 2.1 V at 20 mA) from each segment pin to COM; status: digit recognised from the lit segments, warns above 20 mA, burns above 100 mA. Examples on all boards: digit 5 (segment pins D2..D8 / p11.. / G16..), no resistors, COM not connected. Source: 5161AS datasheet. 74HC595 not done.
- **millis() lessons (2026-11-12):** u27 (UNO R3) and e24 (ESP32), new module 11 'Timing'. Programs u3_millis / e_millis; new rt.millis() (time since the run started) and rt.yield() (about 8 ms of simulator pacing per loop pass; lesson is `fast: true`). Reuses the button lesson circuit/widget. Also fixed the button widget title on ESP32 (said D4, now GPIO17).
- **I2C scanner lesson (2026-11-12):** u28 (UNO R3), new module 12 'Buses'. LCD (A4/A5, 5V) and OLED (SDA/SCL sockets next to AREF = same nets as A4/A5, 3V3) on one bus; program u3_i2cscan uses new rt.i2cProbe(addr) -> hook i2cProbe in main.js (true for lcdAddr/oledAddr when the module is wired and powered). New view 'scanv'. ESP32/Pi/UNO Q variants TODO (one SDA/SCL socket pair only: needs the breadboard).
- **HTTP client lesson (2026-11-12):** e25 (ESP32, module 3), program e_http, rt.httpGet(url) -> hook http (600 ms, then {code, body}: server state this.wf.http cycles ok -> 404 -> down by the 'httpserver' widget, down = code -1 'connection refused'). Reuses the 'wifirouter' widget. The address is made up (api.example.com); the response is simulated.
- **MQTT lesson (2026-11-12):** e26 (ESP32, module 3), program e_mqtt, rt.mqtt* (mqttConnected/Connect/Subscribe/Publish/Poll) -> one hook `mqtt` in main.js with state this.mq {up, conn, subs, inbox, log}; widget 'mqttbroker' (broker online/offline, phone buttons Send ON/OFF to home/led, broker log). Reuses 'wifirouter' and the LED circuit. Broker address made up (broker.example.com).
- **NTP lesson (2026-11-12):** e27 (ESP32, module 3), program e_ntp, rt.configTime / rt.getLocalTime(gmt) -> hooks configTime / localTime in main.js (time known 1.5 s after configTime when the 'ntpserver' widget says reachable; formatted from Date.now() + offset in strftime style '%A, %B %d %Y %H:%M:%S'). Reuses 'wifirouter'.
- **Regression fix (2026-11-12):** displayTick threw 'Cannot set properties of undefined (setting ready)' on every frame for lessons that never created lcdSt/oledSt (seen on UNO Q lesson 2); the reset is now guarded. Failed request file:///_vercel/speed-insights/script.js in local runs is harmless (Vercel only).
- **DS18B20 in Build (2026-11-12):** part 'ds18b20' (GND, DQ, VDD in columns n..n+2, flat face toward you; class TransistorPN2222A reused with name/pins/tag arguments), pin mode 'onewire' (menus on all boards, code popover snippets for Pi w1thermsensor / Arduino OneWire + DallasTemperature), status checks: 3.0-5.5 V, pull-up 1-22 kOhm between DQ and VDD, pin mode; reads env.tempC quantised to 0.0625 C. Examples on all boards. No lesson yet.
- **DS18B20 lessons (2026-11-12):** u29 (UNO R3, 5V, D2) and e28 (ESP32, 3V3, GPIO4), module 7; OneWire + DallasTemperature listing (-127 = not found), programs u3_ds18 / e_ds18, rt.dsRead() -> hook ds18 (temperature slider quantised to 0.0625 C), widgets 'pisens' + 'nohum' (humidity slider hidden), lesson flags dht:true + wn:'DQ' (unplug button says DQ wire). io kind 'ds18b20' checked in check_lessons.

# Raspberry Pi 4 Model B — verified source notes (source check, step 1)

Sources (all official, downloaded from datasheets.raspberrypi.com/rpi4/):
- `raspberry-pi-4-datasheet.pdf` (Release 1.1, March 2024)
- `raspberry-pi-4-mechanical-drawing.pdf` (copy of the page: `pi4-mechanical-drawing.png`)
- `raspberry-pi-4-reduced-schematics.pdf` (RPI-4B reduced, 18 Jun 2019)

## Verified facts (datasheet)
- SoC: quad-core 64-bit Arm Cortex-A72 @ 1.5 GHz; 1/2/4 (datasheet intro also says 8) GB LPDDR4; VideoCore VI.
- Wi-Fi 802.11 b/g/n/ac, Bluetooth 5.0 BLE; 1 × microSD; 2 × micro-HDMI (4Kp60, CEC); 2 × USB 2.0; 2 × USB 3.0; 1 × Gigabit Ethernet (PoE via add-on HAT); 1 × CSI camera (2-lane MIPI); 1 × DSI display (2-lane MIPI); 4-ring TRS A/V jack (analogue audio, drives 32 Ω headphones, composite out).
- 28 user GPIO on the 40-pin header (J8), backwards compatible with all 40-pin Pis. Up to 6 UART, 6 I2C, 5 SPI, 1 SDIO, 1 DPI, 1 PCM, 2 PWM channels, 3 GPCLK.
- Power: USB-C, 5 V / 3 A recommended (5 V / 2.5 A allowed if downstream USB < 500 mA). Absolute max VIN 6.0 V (min −0.5 V). Downstream USB limited to ≈ 1.1 A total over the four sockets.
- GPIO is 3.3 V (VDD IO = 3.3 V): VIL max 0.8 V, VIH min 2.0 V; default drive 8 mA (max 16 mA); pull-up/pull-down 18–73 kΩ (47 kΩ typ). The datasheet gives no 5 V tolerance — treat all GPIO as 3.3 V only.
- Thermals: recommended ambient 0–50 °C; CPU throttles so it never exceeds 85 °C. Availability guaranteed until at least January 2031.
- ID_SD / ID_SC (pins 27/28) are reserved for the HAT ID EEPROM.

## 40-pin header J8 (datasheet figure `pi4-gpio-pinout.png`)
Odd pins (left column, pin 1 at the corner nearest the SD card end): 1 3V3, 3 GPIO2 (SDA1), 5 GPIO3 (SCL1), 7 GPIO4, 9 GND, 11 GPIO17, 13 GPIO27, 15 GPIO22, 17 3V3, 19 GPIO10 (MOSI), 21 GPIO9 (MISO), 23 GPIO11 (SCLK), 25 GND, 27 ID_SD, 29 GPIO5, 31 GPIO6, 33 GPIO13, 35 GPIO19, 37 GPIO26, 39 GND.
Even pins: 2 5V, 4 5V, 6 GND, 8 GPIO14 (TXD), 10 GPIO15 (RXD), 12 GPIO18, 14 GND, 16 GPIO23, 18 GPIO24, 20 GND, 22 GPIO25, 24 GPIO8 (CE0), 26 GPIO7 (CE1), 28 ID_SC, 30 GND, 32 GPIO12, 34 GND, 36 GPIO16, 38 GPIO20, 40 GPIO21.
(Alternate functions per GPIO: datasheet Table 5.) NOTE: orientation of pin 1 on the physical board must still be checked against a photo before modelling.

## Mechanical drawing (official, mm)
Board 85 × 56, corner radius 3.0. Four mounting holes 3.5 mm from the edges, 58 × 49 mm apart. Component outline blocks with heights (Z): GPIO header 8.5; USB-C 3.2; micro-HDMI ×2 3.0; A/V jack 6.0; CSI and DSI 5.5; USB ×2 16.0; Ethernet 13.5; PoE header, SoC 2.4 etc. Positions are dimensioned in the drawing.

## Reduced schematic confirms
Connectors: J8 GPIO, 2 × micro-HDMI, USB-C power in, Gigabit Ethernet, A/V jack, camera, display, PoE header, RUN/GLOBAL_EN header (**RUN is 3V3, GLOBAL_EN is 5V**), PWR and ACT LEDs.

## NOT available / gaps (found in the source check)
- **No official Gerber/STEP/3D model** was found (the UNO Q had official Gerbers + STEP). Raspberry Pi publishes the datasheet, drawing and (per third-party pages) a DXF. Third-party 3D models exist (MakerWorld, Sketchfab, Shanhu3D) but are not official and have unclear licences.
- Chip markings, board colour, silkscreen text and exact connector shapes must come from official **photos** (e.g. raspberrypi.com product images) — still to be collected and checked.
- Datasheet says up to 8 GB RAM in the intro but lists 1/2/4 GB in Features: state "1, 2, 4 or 8 GB depending on version" only after checking the product page.

## Step 2 — verified details used in the 3D model and info texts (2026-11-06)
Official documentation (github.com/raspberrypi/documentation, `computers/raspberry-pi/*.adoc`, `processors/bcm2711.adoc`, `configuration/led_blink_warnings.adoc`):
- BCM2711: Cortex-A72 (Armv8-A) 64-bit @ 1.5 GHz; L1 32 kB data + 48 kB instruction per core, 1 MB L2; VideoCore VI up to 500 MHz; up to 8 GB LPDDR4-2400; PCIe link connects the USB 2.0/3.0 ports; natively attached Ethernet controller; heat-spreading package.
- USB: the 2 × USB 3.0 + 2 × USB 2.0 ports connect to a **VL805** USB controller (chip carries the VIA logo in the photo). Max USB output Pi 2/3/4: 1200 mA total (docs table) — datasheet says ≈ 1.1 A; both shown.
- Power: all models need a 5.1 V supply; Pi 4 recommended 3.0 A, max USB peripheral draw 1.2 A, typical bare-board active 600 mA. Ethernet jack PoE-capable (IEEE 802.3af) with a PoE HAT.
- LEDs (Pi 1–4): **red PWR** (stable 5 V; off/flickering = undervoltage) and **green ACT** (microSD activity, flash codes).
- GPIO page: pins 3.3 V, **not 5 V tolerant**; up to 16 mA per pin, 50 mA total; GP2/GP3 have 1.8 kΩ on-board pull-ups to 3.3 V; GP0/GP1 (pins 27/28) reserved for the HAT ID EEPROM; 5V pins can also accept 5 V input via a HAT; pin 1 lower-left / pin 40 upper-right; typical function per pin (table copied into `src/pi4/data.js`).
- Bootloader: with `POWER_OFF_ON_HALT=1`, GLOBAL_EN must be shorted to ground to boot after a halt.
- FCC integration guide (FCC ID 2ABCB-RPI4B): wireless based on the Cypress 43455 (802.11 b/g/n/ac + Bluetooth 5), on-board antenna.

From the official drawing (vector data, mm): J8 7.11–57.92 × 49.98–54.98 (Z 8.5); Ethernet 66.66–88.02 × 37.98–53.49 (Z 13.5);
USB3 70.52–88.02 × 20.41–33.55, USB2 70.31–88.02 × 2.42–15.56 (Z 16); USB-C 6.88–15.54 × −1.26–6.14 (Z 3.2);
micro-HDMI body 6.2 wide centred x 26.01 / 39.51, −0.85–6.51, flange 7.21 wide at −1.45 (Z 3.0); A/V body 50.52–57.5 × −0.02–12.48 (Z 6.0), barrel Ø6 to −2.52;
CSI 45.06–47.91 × 0.29–22.69, DSI 1.51–5.45 × 16.78–39.20 (Z 5.5); SoC 21.76–36.76 × 24.98–39.98 (Z 2.4); RAM 39.05–50.56 × 24.98–39.98; wireless can 6.61–17.40 × 36.10–49.09; PoE 59.01–64.01 × 43.84–48.84.

From the photos: pin 1 = square pad on the underside at the SD-card end, inner row (x 8.37, y 51.23 mm); PWR LED (1.0, 7.87), ACT LED (1.0, 11.4); microSD socket on the underside x 1.5–13.6, y 22.1–34.6; micro-HDMI shells are silver with an amber film on the top front; camera/display connectors beige with a black latch; USB 3.0 tongues blue, USB 2.0 black, in the lower half of each opening; RJ45 latch slot at the bottom, green and amber lenses in the bottom corners.

Not stated anywhere (so not shown as facts): PCB thickness (model uses 1.4 mm visually), heights of RAM / wireless can / small chips, part numbers of the Ethernet PHY and power chips.

## Step 3 — chips beside the Ethernet jack / power input (2026-11-06)
Reported by the owner: a small black chip above the VL805 was not clickable. It is now the clickable part `ethphy` (Gigabit Ethernet transceiver).
- Identification: it sits right next to the RJ45 jack (J10); the BCM2711 has a native Ethernet controller (official docs), so a separate transceiver is needed; the schematic shows the LAN signal lines of the magjack. Published teardowns (community wikis, reviews) list it as the **Broadcom BCM54213PE**. The marking is not legible in the photo and Raspberry Pi's own documents do not name it — the app labels it "per teardowns".
- `pmic`: the photo shows the "MxL" logo (MaxLinear); the schematic lists the supply rails; teardowns list the **MxL7704**. `inductor`: marking "R47" (= 0.47 µH by the standard code). `othercomp`: two parts with illegible markings — explicitly "not identified".

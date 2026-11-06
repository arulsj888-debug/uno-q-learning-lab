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

# Coverage plan: hardware and connectivity

Rule for every item: verify it from a primary source (datasheet / library docs) for EACH board, model it so the picture agrees with
the data, add (1) a 3D part, (2) a Build-mode circuit model with a wiring checklist and mistakes, (3) a lesson with a simulated
sketch, (4) tests. Status: DONE / TODO. "n/a" = does not make sense on that board (reason written).
Boards: UQ = UNO Q, PI = Raspberry Pi 4, R3 = UNO R3, E32 = ESP32 DevKit V1.

## A. Basic electronics
| Item | UQ | PI | R3 | E32 | Notes |
|---|---|---|---|---|---|
| Resistor, LED, push button | DONE | DONE | DONE | DONE | |
| Potentiometer, buzzer (passive) | DONE | DONE (pot n/a: no ADC) | DONE | DONE | |
| Active buzzer | Build DONE, lesson TODO | Build DONE, lesson TODO | Build DONE, lesson TODO | Build DONE, lesson TODO | no single manufacturer datasheet found (TMB12A05 listings disagree on range, current, pitch): values labelled typical; 3.3 V pins sag to about 2.5 V so a 5 V buzzer warns |
| Diode 1N4007 (forward / blocking, flyback) | Build DONE, lesson TODO | Build DONE, lesson TODO | DONE (Build + lesson 26) | DONE (Build + lesson 23) | 1.1 V at 1 A model; 1 A limit |
| Capacitor (electrolytic 10/100/470 uF: RC charging, polarity, inrush) | Build DONE, lesson TODO | Build DONE, lesson TODO | Build DONE, lesson TODO | Build DONE, lesson TODO | time-dependent solver (backward Euler, state in env.capV) plus an inrush solve for pin damage; ratings and sizes are typical values (16 V assumed); ceramic decoupling cap TODO |
| NPN transistor PN2222A low-side switch (TO-92 E B C) | Build DONE, lesson TODO | Build DONE, lesson TODO | DONE (Build + lesson 24) | DONE (Build + lesson 21) | base resistor, saturation, pin order, flyback-diode warning; max 600 mA |
| MOSFET switch (IRLZ44N, TO-220 G D S) | Build DONE, lesson TODO | Build DONE, lesson TODO | DONE (Build + lesson 25) | DONE (Build + lesson 22) | values from the Infineon datasheet (RDS(on) 35/25/22 mOhm at 4/5/10 V, VGS(th) 1.0-2.0 V, 47 A, +-16 V); no datasheet value at 3.3 V, so a 1 A load from a 3.3 V gate warns; body diode and flyback-diode warnings; 5 examples |
| Slide switch, toggle, tilt switch, reed switch | TODO | TODO | TODO | TODO | |
| Battery + breadboard power supply | partly (battery pack) | partly | partly | partly | |

## B. Light and display
| Item | UQ | PI | R3 | E32 | Notes |
|---|---|---|---|---|---|
| LED matrix (on-board) | DONE | n/a | n/a | n/a | |
| RGB LED (common cathode / anode) | Build DONE, lesson TODO | DONE (Build + lesson 14) | DONE (Build + lesson 17) | DONE (Build + lesson 14) | 3D part, 3 dice model (R 2.0 V, G 3.0 V, B 3.1 V typical), 3 examples per board, tests |
| WS2812 / NeoPixel strip and ring | Build DONE (strip of 8; library not verified on UNO Q), lesson TODO | DONE (Build + lesson 19, GPIO18, needs root) | DONE (Build + lesson 23) | DONE (Build + lesson 20, with the 3.3 V data-level demo) | 5 V data level vs 3.3 V pins (70 % rule), current 60 mA/pixel; ring TODO |
| 7-segment display (+ 74HC595 shift register) | TODO | TODO | TODO | TODO | |
| 16x2 character LCD (HD44780 + I2C backpack) | Build DONE, lesson TODO | DONE (Build + lesson 17) | DONE (Build + lesson 21) | DONE (Build + lesson 18) | needs 5 V; backpack pull-ups to 5 V on 3.3 V boards flagged as a check-your-module warning; address 0x27/0x3F |
| OLED SSD1306 128x64 (I2C) | Build DONE, lesson TODO | DONE (Build + lesson 18) | DONE (Build + lesson 22) | DONE (Build + lesson 19) | address 0x3C (0x3D on some); pin order varies by maker |
| 8x8 LED matrix (MAX7219, SPI) | TODO | TODO | TODO | TODO | |
| TFT / e-paper | TODO | TODO | TODO | TODO | low priority |

## C. Sensors
| Item | UQ | PI | R3 | E32 | Notes |
|---|---|---|---|---|---|
| LDR light, TMP36 | DONE | n/a (no ADC) | DONE | DONE (build) | |
| HC-SR04 ultrasonic, PIR HC-SR501 | DONE | DONE | DONE | build only (HC-SR04) | |
| SHT31 (I2C) | DONE | DONE | DONE | build only | |
| Modulino Thermo / Pixels (Qwiic) | DONE | n/a | n/a | n/a | UNO Q only |
| DHT11 / DHT22 | Build DONE (library reported to return NaN on the UNO Q: lesson TODO, check first) | DONE (Build + lesson 15) | DONE (Build + lesson 18) | DONE (Build + lesson 15) | 4-pin sensor with external pull-up; specs from the Adafruit guide; Pi uses adafruit-circuitpython-dht |
| DS18B20 (1-Wire) | TODO | TODO | TODO | TODO | Pi has 1-Wire in the kernel |
| BMP280 / BME280 pressure (I2C/SPI) | TODO | TODO | TODO | TODO | |
| Soil moisture (analog), rain, water level | TODO | n/a (no ADC) | TODO | TODO | |
| Gas MQ-2 / MQ-135 (analog + digital) | TODO | n/a | TODO | TODO | heater needs 5 V |
| Sound sensor (analog/digital) | TODO | TODO | TODO | TODO | |
| Joystick (2 analog + button) | Build DONE, lesson TODO | n/a (no ADC) | DONE (Build + lesson 19) | DONE (Build + lesson 16) | KY-023 style; powered from 3.3 V on 3.3 V boards (UNO Q analog pins are 3.3 V only) |
| Rotary encoder KY-040 | Build DONE, lesson TODO | DONE (Build + lesson 16) | DONE (Build + lesson 20) | DONE (Build + lesson 17) | module pull-ups described inconsistently by sources: the model relies on INPUT_PULLUP |
| IR receiver + remote (VS1838 / NEC) | TODO | TODO | TODO | TODO | |
| Flame, tilt, vibration, hall, line-follow IR | TODO | TODO | TODO | TODO | |
| MPU6050 accelerometer / gyro (I2C) | TODO | TODO | TODO | TODO | |
| Keypad 4x4 (matrix scan) | TODO | TODO | TODO | TODO | |
| RFID RC522 (SPI) | TODO | TODO | TODO | TODO | 3.3 V part |
| GPS (UART, NEO-6M) | TODO | TODO | TODO | TODO | |
| DS3231 real-time clock (I2C) | TODO | TODO | TODO | TODO | |
| Camera (Pi Camera DONE; ESP32-CAM TODO) | n/a | DONE | n/a | TODO | |
| Touch (capacitive) | n/a | n/a | n/a | DONE (lesson) | on-chip |

## D. Actuators
| Item | UQ | PI | R3 | E32 | Notes |
|---|---|---|---|---|---|
| Servo SG90 | DONE | TODO | DONE | build only | |
| DC motor + L293D, relay | DONE | build only | DONE | n/a (5 V handling TODO) | |
| Stepper 28BYJ-48 + ULN2003 | TODO | TODO | TODO | TODO | |
| Stepper A4988 / DRV8825 driver | TODO | TODO | TODO | TODO | |
| Solenoid / pump / fan with MOSFET | TODO | TODO | TODO | TODO | |
| SD card (SPI) | TODO | n/a | TODO | TODO | |

## E. Connectivity and protocols
| Item | UQ | PI | R3 | E32 | Notes |
|---|---|---|---|---|---|
| USB serial / Serial Monitor | DONE | DONE (terminal) | DONE | DONE | |
| I2C (one device) | DONE | DONE | DONE | build only | |
| I2C scanner, two devices on one bus | TODO | TODO | TODO | TODO | |
| SPI (concept + one device) | TODO | TODO | TODO | TODO | |
| UART between two boards | TODO | TODO | TODO | TODO | 3.3 V / 5 V level shifting |
| Wi-Fi scan / connect / web server | partly (dashboard) | DONE (web) | n/a | DONE | |
| HTTP client (fetch a web API, weather) | TODO | TODO | n/a | TODO | |
| MQTT publish / subscribe + dashboard | TODO | TODO | n/a | TODO | biggest IoT gap |
| NTP time, OTA update | n/a | n/a | n/a | TODO | |
| Bluetooth LE | n/a (not verified) | TODO | n/a | DONE | |
| Bluetooth classic (HC-05 on R3/UQ, built in E32) | TODO | n/a | TODO | TODO | |
| ESP-NOW (board to board, no router) | n/a | n/a | n/a | TODO | |
| LoRa (SX1276), nRF24L01, Zigbee | TODO | TODO | TODO | TODO | external modules, SPI |
| Ethernet | n/a (not verified) | built in | n/a (shield) | n/a | |
| Interrupts, timers, millis() without delay, EEPROM / preferences | TODO | TODO | TODO | TODO | core programming lessons |

## F. Projects (after the parts exist)
Weather station (DHT + OLED + MQTT), security alarm (PIR + buzzer + keypad), plant watering (soil + relay/pump), smart door
(RFID + servo), robot car (2 motors + HC-SR04), home automation over Wi-Fi/MQTT, data logger (RTC + SD).

## Order of work
1. Basic electronics gaps (A) and RGB LED, DHT11, joystick, rotary encoder: quick wins, little new protocol.
2. Displays: I2C LCD, OLED, 7-segment, NeoPixel.
3. Protocols: SPI, UART, I2C scanner, interrupts / millis / EEPROM.
4. IoT: HTTP client, MQTT, ESP-NOW, NTP.
5. Remaining sensors and actuators (stepper, IR, MPU6050, RFID, GPS, RTC, SD, LoRa).
6. Projects.

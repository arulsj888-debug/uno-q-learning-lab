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
| Slide switch (SPDT), tilt switch, reed switch | Build DONE, lesson TODO | Build DONE, lesson TODO | Build DONE, lesson TODO | Build DONE, lesson TODO | click the part in 3D to switch it (env.sw); generic parts, no part numbers or ratings claimed; toggle switch TODO |
| Battery + breadboard power supply | partly (battery pack) | partly | partly | partly | |

## B. Light and display
| Item | UQ | PI | R3 | E32 | Notes |
|---|---|---|---|---|---|
| LED matrix (on-board) | DONE | n/a | n/a | n/a | |
| RGB LED (common cathode / anode) | Build DONE, lesson TODO | DONE (Build + lesson 14) | DONE (Build + lesson 17) | DONE (Build + lesson 14) | 3D part, 3 dice model (R 2.0 V, G 3.0 V, B 3.1 V typical), 3 examples per board, tests |
| WS2812 / NeoPixel strip and ring | Build DONE (strip of 8; library not verified on UNO Q), lesson TODO | DONE (Build + lesson 19, GPIO18, needs root) | DONE (Build + lesson 23) | DONE (Build + lesson 20, with the 3.3 V data-level demo) | 5 V data level vs 3.3 V pins (70 % rule), current 60 mA/pixel; ring TODO |
| 7-segment display 5161AS (common cathode) | Build DONE, lesson TODO | Build DONE, lesson TODO | Build DONE, lesson TODO | Build DONE, lesson TODO | pinout, VF 2.1 V typ at 20 mA, 20 mA continuous / 100 mA peak from the 5161AS datasheet; desk breakout board with a 9-pin header (the datasheet row spacing 15.24 mm does not fit the breadboard gap, so it is not plugged into the breadboard); 74HC595 shift-register version TODO (needs the serial protocol) |
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
| DS18B20 (1-Wire) | Build DONE, lesson TODO | Build DONE, lesson TODO | DONE (Build + lesson 29) | DONE (Build + lesson 28) | verified from the Dallas/Maxim datasheet (copy on a university mirror; the Analog Devices PDF was not reachable): TO-92 GND DQ VDD, 3.0-5.5 V, -55..+125 C, +-0.5 C from -10..+85 C, 9-12 bit, 750 ms max; pull-up about 5 kOhm (4.7 k usual); parasite power not modelled; Pi default 1-Wire pin GPIO4 |
| BMP280 pressure (I2C) | TODO | TODO | DONE (lesson 33, lesson only) | DONE (lesson 33, lesson only) | verified from the Bosch datasheet: 300-1100 hPa, -40..+85 C, supply 1.71-3.6 V, chip ID 0x58, address 0x76 (SDO GND) / 0x77 (SDO VDDIO); Adafruit default address not re-checked (lesson passes 0x76 explicitly); BME280 / SPI TODO |
| Soil moisture (capacitive, analog) | TODO | n/a (no ADC) | DONE (lesson 34, lesson only) | DONE (lesson 34, lesson only) | no manufacturer datasheet: vendor manuals say 3.3-5.5 V, wetter = lower voltage, example 2.5 V dry / 1.0 V wet (sources differ: calibration is the lesson); rain and water level TODO |
| Gas MQ-2 / MQ-135 (analog + digital) | TODO | n/a | TODO | TODO | heater needs 5 V |
| Sound sensor (analog microphone module) | TODO | n/a (no ADC) | DONE (lesson 35, lesson only) | DONE (lesson 35, lesson only) | no standard datasheet: quiet level near mid-supply is a typical, labelled assumption; pin order varies by maker; digital output / threshold pot not covered |
| Joystick (2 analog + button) | Build DONE, lesson TODO | n/a (no ADC) | DONE (Build + lesson 19) | DONE (Build + lesson 16) | KY-023 style; powered from 3.3 V on 3.3 V boards (UNO Q analog pins are 3.3 V only) |
| Rotary encoder KY-040 | Build DONE, lesson TODO | DONE (Build + lesson 16) | DONE (Build + lesson 20) | DONE (Build + lesson 17) | module pull-ups described inconsistently by sources: the model relies on INPUT_PULLUP |
| IR receiver (38 kHz, TSOP382-type) + remote | Build DONE, lesson TODO | Build DONE, lesson TODO | DONE (Build + lesson 30) | DONE (Build + lesson 29) | verified from the Vishay TSOP382/384 datasheet: pins OUT GND VS, 2.0-5.5 V, active-low output, 38 kHz variant; click the part to simulate a remote burst (steady LOW, not a real pulse train); IRremote/NEC decoding lesson TODO |
| Flame, tilt, vibration, hall, line-follow IR | TODO | TODO | TODO | TODO | |
| MPU6050 accelerometer / gyro (I2C) | TODO | TODO | DONE (lesson 31, lesson only) | DONE (lesson 30, lesson only) | InvenSense register map verified: sleep at power-up, WHO_AM_I 0x68, 16384 LSB/g, 131 LSB/(deg/s); I2C address 0x68/0x69 and GY-521 pin order from common knowledge (hedged in the text); Build part TODO |
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
| Stepper 28BYJ-48 + ULN2003 | TODO | TODO | DONE (lesson 32, lesson only) | DONE (lesson 32, lesson only) | facts from vendor datasheet copies (2048 steps nominal, true ratio ~63.68:1, coil resistance 22 or 50 ohm disagree); Stepper library pin order IN1,IN3,IN2,IN4; Build part TODO |
| Stepper A4988 / DRV8825 driver | TODO | TODO | TODO | TODO | |
| Solenoid / pump / fan with MOSFET | TODO | TODO | TODO | TODO | |
| SD card (SPI) | TODO | n/a | TODO | TODO | |

## E. Connectivity and protocols
| Item | UQ | PI | R3 | E32 | Notes |
|---|---|---|---|---|---|
| USB serial / Serial Monitor | DONE | DONE (terminal) | DONE | DONE | |
| I2C (one device) | DONE | DONE | DONE | build only | |
| I2C scanner, two devices on one bus | TODO | TODO | DONE (lesson 28: LCD 0x27 + OLED 0x3C; second device on the repeated SDA/SCL sockets) | TODO (needs the breadboard to share one socket) | scanner reads rt.i2cProbe |
| SPI (concept + one device) | TODO | TODO | TODO | TODO | |
| UART between two boards | TODO | TODO | TODO | TODO | 3.3 V / 5 V level shifting |
| Wi-Fi scan / connect / web server | partly (dashboard) | DONE (web) | n/a | DONE | |
| HTTP client (fetch a web API, weather) | TODO | TODO | n/a | DONE (lesson 25: GET, status codes 200/404, failure; server is simulated and the address made up) | HTTPClient from the Arduino-ESP32 core; https needs a secure client (not covered) |
| MQTT publish / subscribe | TODO | TODO | n/a | DONE (lesson 26: PubSubClient, publish home/temperature, subscribe home/led, LED switched by a message; broker and phone simulated) | dashboard TODO; PubSubClient API as in its documentation; made-up broker address |
| NTP time | n/a | n/a | n/a | DONE (lesson 27: configTime, getLocalTime, time zone offset; simulated time = your computer clock + 1 h) | OTA update TODO |
| Bluetooth LE | n/a (not verified) | TODO | n/a | DONE | |
| Bluetooth classic (HC-05 on R3/UQ, built in E32) | TODO | n/a | TODO | TODO | |
| ESP-NOW (board to board, no router) | n/a | n/a | n/a | TODO | |
| LoRa (SX1276), nRF24L01, Zigbee | TODO | TODO | TODO | TODO | external modules, SPI |
| Ethernet | n/a (not verified) | built in | n/a (shield) | n/a | |
| millis() without delay | TODO | TODO | DONE (lesson 27) | DONE (lesson 24) | shows the button noticed at once while the LED blinks; Arduino docs as sources (50-day overflow figure not verified, not stated) |
| Interrupts (attachInterrupt) | TODO | TODO | UNO R3 needs the button on pin 2/3 (TODO) | DONE (lesson 31) | simulator polls the pin every 10 ms to imitate the ISR |
| Timers, EEPROM / preferences | TODO | TODO | TODO | TODO | |

## F. Projects (after the parts exist)
DONE: Weather station (ESP32 lesson 37, BMP280 + SSD1306 OLED on one I2C bus; the OLED text was verified in the app state, not seen in a screenshot).
DONE: Plant watering controller (UNO R3 lesson 36, ESP32 lesson 36): soil sensor + hysteresis (on below 30 %, off above 60 %); an LED stands in for the relay and pump (the lesson says so; a real pump needs a relay/MOSFET and flyback diode). Real relay/pump version TODO.

Weather station (DHT + OLED + MQTT), security alarm (PIR + buzzer + keypad), plant watering (soil + relay/pump), smart door
(RFID + servo), robot car (2 motors + HC-SR04), home automation over Wi-Fi/MQTT, data logger (RTC + SD).

## Order of work
1. Basic electronics gaps (A) and RGB LED, DHT11, joystick, rotary encoder: quick wins, little new protocol.
2. Displays: I2C LCD, OLED, 7-segment, NeoPixel.
3. Protocols: SPI, UART, I2C scanner, interrupts / millis / EEPROM.
4. IoT: HTTP client, MQTT, ESP-NOW, NTP.
5. Remaining sensors and actuators (stepper, IR, MPU6050, RFID, GPS, RTC, SD, LoRa).
6. Projects.

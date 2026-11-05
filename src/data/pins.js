// Header pin data for the Arduino UNO Q.
// Sources: Arduino UNO Q datasheet (ABX00162-ABX00173, rev. 30/10/2026) §9.3–9.7,
// UNO Q full pinout (docs.arduino.cc), UNO Q user manual (digital/analog/PWM/I2C/UART sections).
// Hole positions come from Arduino's official drill file (board mm, origin bottom-left, USB-C on the left).

const P5V = 'Most JDIGITAL pins are FT-type I/O: 5 V-tolerant as inputs. Outputs always drive 3.3 V.';

export const JDIGITAL = {
  id: 'jdigital', name: 'JDIGITAL', y: 50.8, height: 8.5,
  pins: [
    { pin: 18, id: 'D21', label: 'SCL', x: 18.80, mcu: 'PB10', fn: ['I2C2_SCL (Wire)', 'TIM2_CH3'], v: '3.3 V', note: 'I²C clock for the Wire object (UNO-style SCL).' },
    { pin: 17, id: 'D20', label: 'SDA', x: 21.34, mcu: 'PB11', fn: ['I2C2_SDA (Wire)', 'TIM2_CH4'], v: '3.3 V', note: 'I²C data for the Wire object (UNO-style SDA).' },
    { pin: 16, id: 'AREF', label: 'AREF', x: 23.88, mcu: '—', fn: ['Analog reference input'], v: '—', note: 'Not a GPIO. Used as the external ADC reference when analogReference(AR_EXTERNAL) is selected (2 V … VDD).' },
    { pin: 15, id: 'GND1', label: 'GND', x: 26.42, mcu: '—', fn: ['Ground'], v: '0 V', note: 'Ground reference (0 V).', kind: 'gnd' },
    { pin: 14, id: 'D13', label: '13', x: 28.96, mcu: 'PB13', fn: ['SPI2_SCK', 'TIM1_CH1N'], v: '3.3 V', note: 'SPI clock (SCK) of the UNO-style SPI.' },
    { pin: 13, id: 'D12', label: '12', x: 31.50, mcu: 'PB14', fn: ['SPI2_MISO (CIPO)', 'TIM1_CH2N'], v: '3.3 V', note: 'SPI data in (MISO/CIPO).' },
    { pin: 12, id: 'D11', label: '~11', x: 34.04, mcu: 'PB15', fn: ['SPI2_MOSI (COPI)', 'TIM1_CH3N', 'PWM'], v: '3.3 V', note: 'PWM pin (~). SPI data out (MOSI/COPI).', pwm: true },
    { pin: 11, id: 'D10', label: '~10', x: 36.58, mcu: 'PB9', fn: ['SPI2_SS (chip select)', 'TIM4_CH4', 'PWM'], v: '3.3 V', note: 'PWM pin (~). Default SPI chip-select (SS).', pwm: true },
    { pin: 10, id: 'D9', label: '~9', x: 39.12, mcu: 'PB8', fn: ['TIM4_CH3', 'PWM'], v: '3.3 V', note: 'PWM pin (~).', pwm: true },
    { pin: 9, id: 'D8', label: '8', x: 41.66, mcu: 'PB4', fn: ['TIM3_CH1'], v: '3.3 V', note: 'General-purpose digital I/O.' },
    { pin: 8, id: 'D7', label: '7', x: 45.72, mcu: 'PB2', fn: ['TIM8_CH4N'], v: '3.3 V', note: 'General-purpose digital I/O.' },
    { pin: 7, id: 'D6', label: '~6', x: 48.26, mcu: 'PB1', fn: ['TIM3_CH4', 'PWM'], v: '3.3 V', note: 'PWM pin (~).', pwm: true },
    { pin: 6, id: 'D5', label: '~5', x: 50.80, mcu: 'PA11', fn: ['FDCAN1_RX', 'TIM1_CH4', 'PWM'], v: '3.3 V', note: 'PWM pin (~). CAN bus RX (needs an external CAN transceiver).', pwm: true },
    { pin: 5, id: 'D4', label: '4', x: 53.34, mcu: 'PA12', fn: ['FDCAN1_TX', 'TIM1_ETR'], v: '3.3 V', note: 'CAN bus TX (needs an external CAN transceiver).' },
    { pin: 4, id: 'D3', label: '~3', x: 55.88, mcu: 'PB0', fn: ['OPAMP2_OUTPUT', 'TIM3_CH3', 'PWM'], v: '3.3 V', note: 'PWM pin (~). ⚠ TT-type I/O: only 3.6 V-tolerant — never apply 5 V to D3, in any mode.', pwm: true, warn: true },
    { pin: 3, id: 'D2', label: '2', x: 58.42, mcu: 'PB3', fn: ['TIM2_CH2'], v: '3.3 V', note: 'General-purpose digital I/O.' },
    { pin: 2, id: 'D1', label: '1', x: 60.96, mcu: 'PB6', fn: ['USART1_TX (Serial1)', 'TIM4_CH1'], v: '3.3 V', note: 'Hardware UART transmit — use the Serial1 object.' },
    { pin: 1, id: 'D0', label: '0', x: 63.50, mcu: 'PB7', fn: ['USART1_RX (Serial1)', 'TIM4_CH2'], v: '3.3 V', note: 'Hardware UART receive — use the Serial1 object.' },
  ],
  common: P5V,
};

export const JANALOG = {
  id: 'janalog', name: 'JANALOG', y: 2.54, height: 8.5,
  pins: [
    { pin: 1, id: 'BOOT', label: 'BOOT', x: 27.94, mcu: 'MCU_BOOT0', fn: ['MCU boot strap'], v: '3.3 V', note: 'Boot-mode strap of the STM32U585. Leave unconnected in normal use.' },
    { pin: 2, id: 'IOREF', label: 'IOREF', x: 30.48, mcu: 'PWR_3P3V', fn: ['I/O voltage reference (3.3 V)'], v: '3.3 V', note: 'Tells shields the logic level is 3.3 V. Output only — do not feed power back into the board.', kind: 'pwr' },
    { pin: 3, id: 'RESET', label: 'RESET', x: 33.02, mcu: 'MCU_NRST', fn: ['MCU reset'], v: '3.3 V', note: 'Resets the STM32U585 microcontroller when pulled low.' },
    { pin: 4, id: '3V3', label: '3V3', x: 35.56, mcu: 'PWR_3P3V', fn: ['+3.3 V output'], v: '3.3 V', note: '3.3 V supply output for sensors and modules (from the on-board 3.3 V buck regulator).', kind: 'pwr' },
    { pin: 5, id: '5V', label: '5V', x: 38.10, mcu: '5V_SYS', fn: ['+5 V (5V_SYS) — input or output'], v: '5 V', note: 'System 5 V bus. Outputs 5 V when the board is powered by USB-C or VIN, or accepts a regulated external 5 V supply (up to 3 A).', kind: 'pwr' },
    { pin: 6, id: 'GND2', label: 'GND', x: 40.64, mcu: '—', fn: ['Ground'], v: '0 V', note: 'Ground reference (0 V).', kind: 'gnd' },
    { pin: 7, id: 'GND3', label: 'GND', x: 43.18, mcu: '—', fn: ['Ground'], v: '0 V', note: 'Ground reference (0 V).', kind: 'gnd' },
    { pin: 8, id: 'VIN', label: 'VIN', x: 45.72, mcu: 'DC_IN', fn: ['7–24 V DC input'], v: '7–24 V', note: 'Raw DC input (7–24 V), power only. An on-board buck converter turns it into 5 V.', kind: 'pwr' },
    { pin: 9, id: 'A0', label: 'A0', x: 50.80, mcu: 'PA4', fn: ['ADC input', 'DAC0', 'TIM2_CH1', 'D14'], v: '0–3.3 V', note: '14-bit ADC input and 12-bit DAC0 output. ⚠ Not 5 V-tolerant: max VDD + 0.3 V (≈3.6 V).', warn: true },
    { pin: 10, id: 'A1', label: 'A1', x: 53.34, mcu: 'PA5', fn: ['ADC input', 'DAC1', 'TIM3_CH1', 'D15'], v: '0–3.3 V', note: '14-bit ADC input and 12-bit DAC1 output. ⚠ Not 5 V-tolerant: max VDD + 0.3 V (≈3.6 V).', warn: true },
    { pin: 11, id: 'A2', label: 'A2', x: 55.88, mcu: 'PA6', fn: ['ADC input', 'OPAMP2_INPUT+', 'TIM3_CH2', 'D16'], v: '0–3.3 V', note: 'ADC input. In analog mode the input must stay within 0 V … VREF+ (≈3.3 V).' },
    { pin: 12, id: 'A3', label: 'A3', x: 58.42, mcu: 'PA7', fn: ['ADC input', 'OPAMP2_INPUT−', 'D17'], v: '0–3.3 V', note: 'ADC input. In analog mode the input must stay within 0 V … VREF+ (≈3.3 V).' },
    { pin: 13, id: 'A4', label: 'A4', x: 60.96, mcu: 'PC1', fn: ['ADC input', 'I2C3_SDA', 'LPTIM1_CH1', 'D18'], v: '0–3.3 V', note: 'ADC input or I²C3 SDA. When used as I²C, use pull-ups to 3.3 V only.' },
    { pin: 14, id: 'A5', label: 'A5', x: 63.50, mcu: 'PC0', fn: ['ADC input', 'I2C3_SCL', 'LPTIM1_IN1', 'D19'], v: '0–3.3 V', note: 'ADC input or I²C3 SCL. When used as I²C, use pull-ups to 3.3 V only.' },
  ],
  common: 'Analog functions (A0–A5) are not 5 V-tolerant: keep inputs between 0 V and VREF+ (≈3.3 V). The ADC is up to 14-bit: choose 14, 12, 10 or 8 bits with analogReadResolution() (14-bit gives 0–16383).',
};

// JSPI 2x3: pin 1/3/5 on the inner column (x = 63.67), 2/4/6 on the outer column (x = 66.21)
export const JSPI = {
  id: 'jspi', name: 'JSPI', height: 8.0,
  pins: [
    { pin: 1, id: 'SPI_MISO', label: 'MISO', x: 63.6688, y: 30.491, mcu: 'PC2', fn: ['SPI2_MISO'], v: '3.3 V', note: 'SPI data in. FT-type: 5 V-tolerant as input, outputs drive 3.3 V.' },
    { pin: 2, id: 'SPI_5V', label: '+5V', x: 66.2088, y: 30.491, mcu: '5V_SYS', fn: ['+5 V (5V_SYS)'], v: '5 V', note: 'System 5 V (diode-OR output). Can also accept a regulated 5 V input.', kind: 'pwr' },
    { pin: 3, id: 'SPI_SCK', label: 'SCK', x: 63.6688, y: 27.951, mcu: 'PD1', fn: ['SPI2_SCK'], v: '3.3 V', note: 'SPI clock.' },
    { pin: 4, id: 'SPI_MOSI', label: 'MOSI', x: 66.2088, y: 27.951, mcu: 'PC3', fn: ['SPI2_MOSI'], v: '3.3 V', note: 'SPI data out.' },
    { pin: 5, id: 'SPI_RESET', label: 'RESET', x: 63.6688, y: 25.411, mcu: 'MCU_NRST', fn: ['MCU reset'], v: '3.3 V', note: 'Reset line of the STM32U585.' },
    { pin: 6, id: 'SPI_GND', label: 'GND', x: 66.2088, y: 25.411, mcu: '—', fn: ['Ground'], v: '0 V', note: 'Ground.', kind: 'gnd' },
  ],
  common: 'JSPI and the SPI pins on JDIGITAL share the same SPI2 peripheral of the MCU, so they cannot be used as SPI at the same time. Chip-select comes from any GPIO.',
};

// JCTL 2x5 (1.8 V) — positions from the official pinout drawing.
export const JCTL = {
  id: 'jctl', name: 'JCTL',
  pins: [
    { pin: 1, label: 'GND', x: 23.58, y: 45.73 }, { pin: 2, label: 'USB_BOOT', x: 23.58, y: 43.19 },
    { pin: 3, label: 'VOL_DOWN (GPIO_36)', x: 21.04, y: 45.73 }, { pin: 4, label: 'SOC_SE4_TX (console)', x: 21.04, y: 43.19 },
    { pin: 5, label: 'VOL_UP (GPIO_96)', x: 18.50, y: 45.73 }, { pin: 6, label: 'SOC_SE4_RX (console)', x: 18.50, y: 43.19 },
    { pin: 7, label: 'GND', x: 15.96, y: 45.73 }, { pin: 8, label: 'PMIC_RESET', x: 15.96, y: 43.19 },
    { pin: 9, label: '+1V8 OUT', x: 13.42, y: 45.73 }, { pin: 10, label: 'VBUS_DISABLE', x: 13.42, y: 43.19 },
  ],
};

export const QWIIC = [
  { pin: 1, label: 'GND' }, { pin: 2, label: '+3V3 OUT' }, { pin: 3, label: 'SDA — PD13 (I2C4)' }, { pin: 4, label: 'SCL — PD12 (I2C4)' },
];

export const ALL_HEADER_PINS = [...JDIGITAL.pins.map(p => ({ ...p, header: 'JDIGITAL', y: JDIGITAL.y })),
  ...JANALOG.pins.map(p => ({ ...p, header: 'JANALOG', y: JANALOG.y })),
  ...JSPI.pins.map(p => ({ ...p, header: 'JSPI' }))];

export function findPin(id) { return ALL_HEADER_PINS.find(p => p.id === id); }

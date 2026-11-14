// Slot f: UNO Q interrupt lesson, derived from the UNO R3 lesson 44 (src/uno3/lessons3.js).
// Verified in ArduinoCore-zephyr (cores/arduino/WInterrupts.cpp): attachInterrupt(pin, callback, mode) with LOW, HIGH, CHANGE, FALLING, RISING, and
// the pin check only requires the pin to be in the variant's digital pin list (D0-D13, D20, D21 in variants/arduino_uno_q_stm32u585xx/*.overlay).
// NOT verified: that every pin can fire on the STM32U585 hardware (EXTI lines are shared between pins with the same number), and no official
// UNO Q example uses attachInterrupt. The lesson therefore uses a single interrupt on D2 and says so. EEPROM and a timer API were not found in the core: no lessons.
import { U3_LESSONS_3 } from '../uno3/lessons3.js';
import { CODE3, CHECKS3 } from '../uno3/code3.js';
import { PROGRAMS3 } from '../sim3.js';

const src = U3_LESSONS_3.find(l => l.id === 'u44');
const L = JSON.parse(JSON.stringify(src));
delete L.id; delete L.num;
const REP = [
  [/Arduino UNO R3/g, 'Arduino UNO Q'], [/UNO R3/g, 'UNO Q'],
  [/The ATmega328P of the UNO Q has two external interrupt pins, <b>2 and 3<\/b> \(INT0 and INT1\), plus pin-change interrupts on others\./, 'The UNO Q core (Arduino core for Zephyr) provides <code>attachInterrupt(pin, function, mode)</code> with the modes LOW, HIGH, CHANGE, FALLING and RISING.'],
  [/On the UNO Q only <b>pins 2 and 3<\/b> can be used for <code>attachInterrupt\(\)<\/code>\./, 'The UNO Q core accepts the pins of its digital pin list (D0 to D13, D20, D21) in <code>attachInterrupt()</code>; this lesson uses <b>D2</b>.'],
  [/<li>UNO Q external interrupts: pins 2 and 3\. Modes: LOW, CHANGE, RISING, FALLING\.<\/li>/, '<li>UNO Q: <code>attachInterrupt()</code> with LOW, HIGH, CHANGE, FALLING, RISING (source of the Arduino core for Zephyr).</li>'],
  [/Which UNO Q pins support attachInterrupt\(\)\?/, 'Which edge of a pin does FALLING mean?'],
];
const walk = (o, f) => typeof o === 'string' ? f(o) : Array.isArray(o) ? o.map(x => walk(x, f)) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, walk(v, f)])) : o;
const T = walk(L, s => REP.reduce((a, [re, to]) => a.replace(re, to), s));
const q = T.quiz[0]; q.a = ['HIGH to LOW', 'LOW to HIGH', 'Any change', 'While the pin is LOW']; q.c = 0; q.why = 'The button pulls the pin to GND: released = HIGH, pressed = LOW, so a press is the falling edge.';
const CAVEAT = '<p class="warn">UNO Q: the core code accepts D0 to D13, D20 and D21, but <b>not verified</b>: whether every one of these pins can raise an interrupt on the STM32U585 chip (on STM32 chips pins with the same pin number, such as PA11 and PB11, may share one interrupt line), and no official UNO Q example uses attachInterrupt. This lesson uses a single interrupt on D2 and was checked in the simulator only.</p>';
T.steps[0].body += CAVEAT;
T.time = '25 min'; T.module = 72; T.title = 'Interrupts: react to a button at once';
T.program = 'q_irq'; T.file = 'ButtonInterrupt.ino'; T.ported = 'u44';
T.sources = [{ t: 'ArduinoCore-zephyr: WInterrupts.cpp (attachInterrupt modes)', u: 'https://github.com/arduino/ArduinoCore-zephyr/blob/main/cores/arduino/WInterrupts.cpp' }, ...(src.sources || []).filter(s => /attachInterrupt/.test(s.t || s.title || ''))];
T.code = CODE3.irq.replace('an interrupt pin of the UNO R3: 2 or 3', 'D2 (any pin of the digital pin list is accepted by the core)');

export default {
  lessons: { u3: [], e32: [], uq: [T], pi: [] },
  modules: { u3: {}, e32: {}, uq: { 72: 'Module 72 — Interrupts' }, pi: {} },
  programs: { q_irq: (rt, o) => PROGRAMS3.u3_irq(rt, o) },
  code: { q_irq: T.code },
  checks: { q_irq: CHECKS3.irq },
};

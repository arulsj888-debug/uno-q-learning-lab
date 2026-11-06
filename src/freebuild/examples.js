// Ready-made circuits for the free-build mode: some work, some are classic mistakes. Each one explains itself.
import { isHoleRef } from './circuit.js';

export function EXAMPLES(boardKind) {
  const pi = boardKind === 'pi4';
  const P = pi
    ? { sig: 'p11', btn: 'p13', gnd: 'p9', v3: 'p1', v5: 'p2', bad5: 'p13', name: 'GPIO17 (pin 11)' }
    : { sig: 'D5', btn: 'D2', gnd: 'GND2', v3: '3V3', v5: '5V', bad5: 'D3', an: 'A0', name: 'D5' };
  const sig8 = pi ? 'p11' : 'D8';
  const w = (id, from, to, color) => ({ id, type: pi && !isHoleRef(from) ? 'fwire' : 'wire', from, to, color, lift: isHoleRef(from) && isHoleRef(to) ? 12 : 26 });
  const led = (id, anode, cathode, color = 'red') => ({ id, type: 'led', anode, cathode, color });
  const res = (id, a, b, ohms) => ({ id, type: 'resistor', a, b, ohms });
  const ledCircuit = (flip, ohms = 220) => [w('w1', P.sig, 'a10', 'yellow'), res('r1', 'b10', 'b14', ohms), flip ? led('led1', 'c15', 'c14') : led('led1', 'c14', 'c15'), w('w2', P.gnd, 'd15', 'black')];
  const list = [
    { title: '✔ LED with a resistor (works)', parts: ledCircuit(false), pins: { [P.sig]: { mode: 'out1' } }, note: `The pin <b>${P.name}</b> is set to <b>Output HIGH</b> (3.3 V), the 220 Ω resistor limits the current to a few mA, and the LED’s long leg (+) faces the pin. Try changing the pin to <b>Input</b>, or the resistor to 100 kΩ.` },
    { title: '✖ LED the wrong way round', parts: ledCircuit(true), pins: { [P.sig]: { mode: 'out1' } }, note: 'Everything is right except the LED: its long leg (anode) faces GND. An LED is a diode, so it only conducts one way. Select the LED and read the reason, then delete it and place it the other way round.' },
    { title: '✖ LED without a resistor', parts: [w('w1', P.v5, 'a10', 'red'), led('led1', 'c10', 'c11'), w('w2', P.gnd, 'd11', 'black')], pins: {}, note: 'The LED is connected straight to 5 V with no resistor. Nothing limits the current, so it burns out in a moment. Press “Replace broken parts”, then put a resistor in the path.' },
    { title: '✔ Button lights an LED (no code)', parts: [{ id: 'sw1', type: 'button', col: 10 }, w('w1', P.v3, 'a10', 'orange'), res('r1', 'g12', 'g16', 220), led('led1', 'i16', 'i17'), w('w2', P.gnd, 'j17', 'black')], pins: {}, note: 'No program needed: 3.3 V → button → resistor → LED → GND. The button is an open switch until you press it, so <b>hold the push button</b> (click and hold it in the 3D view) to complete the circuit.' },
    { title: pi ? '✔ Button on a GPIO input' : '✔ Button on a digital input (pull-up)', parts: [{ id: 'sw1', type: 'button', col: 10 }, w('w1', P.btn, 'a10', 'blue'), w('w2', P.gnd, 'j12', 'black')], pins: { [P.btn]: { mode: 'up' } }, note: `The input pin has its internal pull-up on, so it reads <b>HIGH</b> when nothing is pressed. Pressing the button connects the pin to GND and it reads <b>LOW</b>. Change the pin to “Input (no pull resistor)” and it floats.` },
    { title: '✔ Buzzer with a tone', parts: [{ id: 'bz1', type: 'buzzer', plus: 'e10', minus: 'e13' }, w('w1', sig8, 'a10', 'yellow'), w('w2', P.gnd, 'a13', 'black')], pins: { [sig8]: { mode: 'tone', freq: 440 } }, note: 'A passive buzzer sounds when the voltage across it changes quickly. The pin is set to <b>Tone</b>, 440 Hz. (Turn the sound on in your browser.)' },
    { title: '✖ Buzzer that stays silent', parts: [{ id: 'bz1', type: 'buzzer', plus: 'e10', minus: 'e13' }, w('w1', sig8, 'a10', 'yellow'), w('w2', P.gnd, 'a13', 'black')], pins: { [sig8]: { mode: 'out1' } }, note: 'Same wiring, but the pin is a steady HIGH. A passive buzzer only clicks when the voltage switches; change the pin to “Tone” and it sounds.' },
    ...(pi ? [] : [
      { title: '✔ Potentiometer on an analog input', parts: [{ id: 'pot1', type: 'pot', row: 'e', col: 10 }, w('w1', P.v3, 'a10', 'orange'), w('w2', P.gnd, 'a14', 'black'), w('w3', P.an, 'a12', 'yellow')], pins: { A0: { mode: 'analog' } }, note: 'The potentiometer is a voltage divider: the wiper (middle leg) outputs a voltage between 0 V and 3.3 V. Turn the knob (drag it in 3D or use the slider) and watch the ADC value change.' },
      { title: '✔ TMP36 temperature sensor', parts: [{ id: 'tmp1', type: 'tmp36', row: 'e', col: 10 }, w('w1', P.v3, 'a10', 'orange'), w('w2', P.an, 'a11', 'yellow'), w('w3', P.gnd, 'a12', 'black')], pins: { A0: { mode: 'analog' } }, note: 'The TMP36 puts out 0.5 V + 10 mV per °C. Tick “turn round” in the left column and place it the other way: +VS and GND swap, and the sensor is connected backwards.' },
    ]),
    { title: '✖ 5 V on a 3.3 V pin', parts: [w('w1', P.v5, 'a10', 'red'), w('w2', P.bad5, 'b10', 'yellow')], pins: { [P.bad5]: { mode: 'in' } }, note: pi ? 'Raspberry Pi GPIO pins are 3.3 V only. 5 V on a GPIO pin can damage the Raspberry Pi permanently.' : 'D3 tolerates only 3.6 V. 5 V on it can damage the UNO Q permanently.' },
    { title: '✖ Short circuit', parts: [w('w1', P.v5, 'r:top+:3', 'red'), w('w2', P.gnd, 'r:top+:4', 'black')], pins: {}, note: 'The 5 V pin and a GND pin are joined by the same power rail. Nothing limits the current, so the power would be cut (here the cable pops out).' },
  ];
  return list;
}

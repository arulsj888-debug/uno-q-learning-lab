// UNO Q versions of the UNO R3 programs of lessons 40-59 (src/sim3.js): same lines, 3.3 V pins and a 14-bit ADC (analogReadResolution(14)).
import { PROGRAMS3 } from './sim3.js';
import { remap } from './sim4.js';

const Q = { v: 3.3, adc: 16383, thr: 7200 };
const mk = (key, map = {}, adc = false) => (rt, opts) => { if (adc) rt.analogReadResolution(14); return PROGRAMS3['u3_' + key](remap(rt, map), { ...opts, ...Q }); };
export const PROGRAMS5 = {
  q3_abuz: mk('abuz'), q3_rc: mk('rc', {}, true), q3_swt: mk('swt'), q3_seg7: mk('seg7'), q3_max7219: mk('max7219'), q3_tft: mk('tft'), q3_rfid: mk('rfid'), q3_sd: mk('sd'),
  q3_gas: mk('gas', { D2: 'D8' }, true), q3_flame: mk('flame', {}, true), q3_gps: mk('gps'), q3_rtc: mk('rtc'), q3_a4988: mk('a4988'), q3_fan: mk('fan'),
  q3_uart: mk('uart'), q3_hc05: mk('hc05'), q3_nrf: mk('nrf'),
};

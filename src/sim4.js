// Simulated sketches of ESP32 lessons 42-61. Programs that have the same line numbers as the UNO R3 programs (src/sim3.js) are reused with
// the pin names changed; the others are written here. rt.at(n) highlights line n of the listing in src/esp32/code4.js.
import { PROGRAMS3 } from './sim3.js';

const PIN_FNS = ['pinMode', 'digitalWrite', 'digitalRead', 'analogRead', 'analogWrite', 'attachInterrupt', 'detachInterrupt'];
function remap(rt, map) {
  return new Proxy(rt, { get(t, p) { return PIN_FNS.includes(p) ? (pin, ...a) => t[p](map[pin] || pin, ...a) : t[p]; } });
}
const E = { v: 3.3, adc: 4095 };
const reuse = (from, map = {}) => (rt, opts) => PROGRAMS3['u3_' + from](remap(rt, map), { ...opts, ...E });

export const PROGRAMS4 = {
  e4_abuz: reuse('abuz', { D8: 'G25' }),
  e4_rc: reuse('rc', { D8: 'G25', A0: 'G34' }),
  e4_swt: reuse('swt', { D2: 'G25', D3: 'G26', D4: 'G27' }),
  e4_seg7: reuse('seg7', { D2: 'G13', D3: 'G14', D4: 'G25', D5: 'G26', D6: 'G27', D7: 'G32', D8: 'G33' }),
  e4_max7219: reuse('max7219'),
  e4_tft: reuse('tft'),
  e4_rfid: reuse('rfid'),
  e4_sd: reuse('sd'),
  e4_flame: reuse('flame', { D2: 'G26', A0: 'G34', D5: 'G16' }),
  e4_rtc: reuse('rtc'),
  e4_a4988: reuse('a4988', { D3: 'G25', D4: 'G26', D5: 'G27' }),
  e4_nrf: reuse('nrf'),

  async e4_gas(rt) {
    await rt.at(1); await rt.at(2);
    await rt.at(5); rt.serialBegin(115200);
    await rt.at(6); rt.println('Warming up...');
    await rt.at(7); await rt.delay(3000);
    for (;;) {
      await rt.at(10);
      await rt.at(11); const level = rt.analogRead('G34');
      await rt.at(12); rt.print('level ');
      await rt.at(13); rt.print(level);
      if (level > 2400) { await rt.at(14); rt.println('  GAS!'); } else { await rt.at(15); rt.println(); }
      await rt.at(16); await rt.delay(500);
    }
  },

  async e4_gps(rt) {
    await rt.at(3); await rt.at(4);
    await rt.at(7); rt.serialBegin(115200);
    await rt.at(8);
    for (;;) {
      await rt.at(11);
      await rt.at(12); const g = rt.dev('gps', 'state') || { valid: false, sats: 0 };
      await rt.at(13);
      if (g.valid) {
        await rt.at(14); rt.print(g.lat, 6);
        await rt.at(15); rt.print(', ');
        await rt.at(16); rt.print(g.lng, 6);
        await rt.at(17); rt.print('  satellites: ');
        await rt.at(18); rt.println(g.sats);
      } else { await rt.at(20); rt.println('Waiting for a fix...'); }
      await rt.at(22); await rt.delay(1000);
    }
  },

  async e4_fan(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(6); rt.serialBegin(115200);
    await rt.at(7); rt.ledcAttach('G25', 5000, 8);
    for (;;) {
      await rt.at(10);
      for (let speed = 0; speed <= 255; speed += 51) {
        await rt.at(11);
        await rt.at(12); rt.ledcWrite('G25', speed);
        await rt.at(13); rt.println(speed);
        await rt.at(14); await rt.delay(1500);
      }
      await rt.at(16); rt.ledcWrite('G25', 0);
      await rt.at(17); await rt.delay(1500);
    }
  },

  async e4_uart(rt) {
    let counter = 0;
    await rt.at(1);
    await rt.at(4); rt.serialBegin(115200);
    await rt.at(5);
    for (;;) {
      await rt.at(8);
      await rt.at(9); const buf = 'HELLO ';
      await rt.at(10); rt.dev('peer', 'write', buf + counter + '\n');
      await rt.at(11); rt.print('sent ');
      await rt.at(12); rt.println(counter);
      await rt.at(13); const start = rt.millis();
      while (rt.millis() - start < 1000) {
        await rt.at(14);
        await rt.at(15);
        if (rt.dev('peer', 'avail') > 0) { const c = rt.dev('peer', 'read'); if (c === '\n') rt.println(); else rt.print(c); }
        await rt.yield();
      }
      await rt.at(17); counter++;
    }
  },

  async e4_btc(rt) {
    await rt.at(3); await rt.at(4);
    await rt.at(7); rt.pinMode('G16', 'OUTPUT');
    await rt.at(8); rt.serialBegin(115200);
    await rt.at(9); rt.dev('hc05', 'begin');
    for (;;) {
      await rt.at(12);
      await rt.at(13);
      if (rt.dev('hc05', 'avail') > 0) {
        await rt.at(14); const c = rt.dev('hc05', 'read');
        await rt.at(15); rt.print('received: ');
        await rt.at(16); rt.println(c);
        await rt.at(17); if (c === '1') rt.digitalWrite('G16', 1);
        await rt.at(18); if (c === '0') rt.digitalWrite('G16', 0);
        await rt.at(19); const buf = 'LED is ';
        await rt.at(20); rt.dev('hc05', 'write', buf + (rt.digitalRead('G16') ? 'on' : 'off') + '\n');
      }
      await rt.yield();
    }
  },

  async e4_espnow(rt) {
    let counter = 0;
    const mac = '24:6F:28:AA:BB:CC';
    await rt.at(4); await rt.at(5);
    await rt.at(12); rt.serialBegin(115200);
    await rt.at(13);
    await rt.at(14);
    if (!rt.dev('espnow', 'init')) { await rt.at(15); rt.println('ESP-NOW init failed'); for (;;) await rt.delay(250); }
    await rt.at(18);
    await rt.at(19); await rt.at(20); await rt.at(23); rt.dev('espnow', 'addPeer', mac);
    for (;;) {
      await rt.at(26);
      await rt.at(28); const text = 'hello ' + counter++;
      await rt.at(29); rt.print(text);
      await rt.at(30); const ok = await rt.dev('espnow', 'send', mac, text);
      await rt.at(7); await rt.at(8); rt.println(ok ? '  delivered' : '  failed');   // the send callback
      await rt.at(31); await rt.delay(1000);
    }
  },

  async e4_timer(rt) {
    let ledOn = false, ticks = 0;
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(13); rt.pinMode('G16', 'OUTPUT');
    await rt.at(14); rt.serialBegin(115200);
    await rt.at(15); await rt.at(16);
    await rt.at(17); rt.timerEvery(500, () => { ledOn = !ledOn; rt.digitalWrite('G16', ledOn ? 1 : 0); ticks++; });
    for (;;) {
      await rt.at(20);
      await rt.at(21); rt.println(ticks);
      await rt.at(22); await rt.delay(2000);
    }
  },

  async e4_prefs(rt) {
    await rt.at(3);
    await rt.at(6); rt.serialBegin(115200);
    await rt.at(7);
    await rt.at(8); let runs = rt.dev('prefs', 'get', 'runs', 0);
    await rt.at(9); runs++;
    await rt.at(10); rt.dev('prefs', 'put', 'runs', runs);
    await rt.at(11);
    await rt.at(12); rt.print('This sketch has started ');
    await rt.at(13); rt.print(runs);
    await rt.at(14); rt.println(' times');
    for (;;) { await rt.at(17); await rt.delay(250); }
  },
};

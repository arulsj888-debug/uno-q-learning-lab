// Simulated sketches of UNO R3 lessons 40-59. rt.at(n) highlights line n of the listing in src/uno3/code3.js.
const hex2 = v => v.toString(16).toUpperCase().padStart(2, '0');

export const PROGRAMS3 = {
  async u3_abuz(rt) {
    await rt.at(1); await rt.at(4); rt.pinMode('D8', 'OUTPUT');
    await rt.at(5); rt.serialBegin(9600);
    for (;;) {
      await rt.at(8);
      await rt.at(9); rt.digitalWrite('D8', 1);
      await rt.at(10); rt.println('beep');
      await rt.at(11); await rt.delay(500);
      await rt.at(12); rt.digitalWrite('D8', 0);
      await rt.at(13); await rt.delay(500);
    }
  },

  async u3_rc(rt, opts = {}) {
    const VMAX = opts.v || 5, ADC = opts.adc || 1023;
    await rt.at(1); await rt.at(2);
    await rt.at(5); rt.pinMode('D8', 'OUTPUT');
    await rt.at(6); rt.serialBegin(9600);
    for (;;) {
      await rt.at(9);
      await rt.at(10); rt.digitalWrite('D8', 1);
      for (let i = 0; i < 6; i++) { await rt.at(11); await rt.at(12); rt.println(rt.analogRead('A0') * VMAX / ADC, 2); await rt.at(13); await rt.delay(500); }
      await rt.at(15); rt.digitalWrite('D8', 0);
      for (let i = 0; i < 6; i++) { await rt.at(16); await rt.at(17); rt.println(rt.analogRead('A0') * VMAX / ADC, 2); await rt.at(18); await rt.delay(500); }
    }
  },

  async u3_swt(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(6); rt.pinMode('D2', 'INPUT');
    await rt.at(7); rt.pinMode('D3', 'INPUT_PULLUP');
    await rt.at(8); rt.pinMode('D4', 'INPUT_PULLUP');
    await rt.at(9); rt.serialBegin(9600);
    for (;;) {
      await rt.at(12);
      await rt.at(13); rt.print('slide=');
      await rt.at(14); rt.print(rt.digitalRead('D2'));
      await rt.at(15); rt.print(' reed=');
      await rt.at(16); rt.print(rt.digitalRead('D3'));
      await rt.at(17); rt.print(' tilt=');
      await rt.at(18); rt.println(rt.digitalRead('D4'));
      await rt.at(19); await rt.delay(500);
    }
  },

  async u3_seg7(rt) {
    const pins = ['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'];
    const digits = [0b0111111, 0b0000110, 0b1011011, 0b1001111, 0b1100110, 0b1101101, 0b1111101, 0b0000111, 0b1111111, 0b1101111];
    await rt.at(1); await rt.at(2);
    await rt.at(16); pins.forEach(p => rt.pinMode(p, 'OUTPUT'));
    await rt.at(17); rt.serialBegin(9600);
    for (;;) {
      await rt.at(20);
      for (let d = 0; d < 10; d++) {
        await rt.at(21);
        await rt.at(22); for (let s = 0; s < 7; s++) rt.digitalWrite(pins[s], (digits[d] >> s) & 1);
        await rt.at(23); rt.println(d);
        await rt.at(24); await rt.delay(800);
      }
    }
  },

  async u3_irq(rt) {
    let presses = 0, changed = false;
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(12); rt.pinMode('D2', 'INPUT_PULLUP');
    await rt.at(13); rt.pinMode('D5', 'OUTPUT');
    await rt.at(14); rt.serialBegin(9600);
    await rt.at(15); rt.attachInterrupt('D2', 'FALLING', () => { presses++; changed = true; });
    for (;;) {
      await rt.at(18);
      await rt.at(19);
      if (changed) {
        await rt.at(20); await rt.at(21); const n = presses;
        await rt.at(22); changed = false;
        await rt.at(23);
        await rt.at(24); rt.digitalWrite('D5', n % 2);
        await rt.at(25); rt.println(n);
      }
      await rt.yield();
    }
  },

  async u3_timer(rt) {
    let ledOn = false, ticks = 0;
    await rt.at(3); await rt.at(4); await rt.at(5);
    await rt.at(14); rt.pinMode('D5', 'OUTPUT');
    await rt.at(15); rt.serialBegin(9600);
    await rt.at(16);
    await rt.at(17); rt.timerEvery(500, () => { ledOn = !ledOn; rt.digitalWrite('D5', ledOn ? 1 : 0); ticks++; });
    for (;;) {
      await rt.at(20);
      await rt.at(21); await rt.at(22); const t = ticks;
      await rt.at(23);
      await rt.at(24); rt.println(t);
      await rt.at(25); await rt.delay(2000);
    }
  },

  async u3_eeprom(rt) {
    await rt.at(3);
    await rt.at(6); rt.serialBegin(9600);
    await rt.at(7); let runs = rt.dev('eeprom', 'read', 0);
    await rt.at(8); if (runs === 255) runs = 0;
    await rt.at(9); runs++;
    await rt.at(10); rt.dev('eeprom', 'update', 0, runs);
    await rt.at(11); rt.print('This sketch has started ');
    await rt.at(12); rt.print(runs);
    await rt.at(13); rt.println(' times');
    for (;;) { await rt.at(16); await rt.delay(250); }
  },

  async u3_max7219(rt) {
    const smile = [0b00111100, 0b01000010, 0b10100101, 0b10000001, 0b10100101, 0b10011001, 0b01000010, 0b00111100];
    const w = (r, v) => rt.dev('max7219', 'write', r, v);
    await rt.at(3); await rt.at(4); await rt.at(5);
    await rt.at(6);   // the LedControl constructor: display test off, scan limit 7, decode mode off, clear, shutdown
    w(0x0F, 0); w(0x0B, 7); w(0x09, 0); for (let r = 1; r <= 8; r++) w(r, 0); w(0x0C, 0);
    await rt.at(8); await rt.at(13);
    await rt.at(14); w(0x0C, 1);
    await rt.at(15); w(0x0A, 4);
    await rt.at(16); for (let r = 1; r <= 8; r++) w(r, 0);
    await rt.at(17); for (let row = 0; row < 8; row++) w(row + 1, smile[row]);
    for (;;) {
      await rt.at(20);
      for (let i = 0; i < 16; i++) { await rt.at(21); await rt.at(22); w(0x0A, i); await rt.at(23); await rt.delay(150); }
    }
  },

  async u3_tft(rt) {
    const T = (...a) => rt.dev('tft', ...a);
    let level = 0;
    await rt.at(8); await rt.at(10);
    await rt.at(13); T('init');
    await rt.at(14); T('fill', 0x0000);
    await rt.at(15); await rt.at(16); await rt.at(17);
    await rt.at(18); T('text', 8, 8, 2, 0xFFE0, 'UNO R3');
    await rt.at(19); T('rect', 8, 60, 112, 20, 0xFFFF, false);
    for (;;) {
      await rt.at(22);
      await rt.at(23); level = (level + 8) % 104;
      await rt.at(24); T('rect', 10, 62, 108, 16, 0x0000, true);
      await rt.at(25); T('rect', 10, 62, level + 4, 16, 0x07E0, true);
      await rt.at(26); T('circle', 64, 120, 14, 0xF800, true);
      await rt.at(27); await rt.delay(300);
    }
  },

  async u3_rfid(rt) {
    await rt.at(6);
    await rt.at(9); rt.serialBegin(9600);
    await rt.at(10);
    await rt.at(11); rt.dev('rfid', 'version');
    await rt.at(12); rt.println('Hold a card near the reader');
    for (;;) {
      await rt.at(15);
      await rt.at(16);
      let uid = null;
      if (rt.dev('rfid', 'present')) uid = rt.dev('rfid', 'read');
      if (!uid) { await rt.yield(); continue; }
      await rt.at(17); rt.print('UID:');
      for (let i = 0; i < uid.length; i++) {
        await rt.at(18);
        await rt.at(19); rt.print(uid[i] < 0x10 ? ' 0' : ' ');
        await rt.at(20); rt.print(uid[i].toString(16).toUpperCase());
      }
      await rt.at(22); rt.println();
      await rt.at(23); rt.dev('rfid', 'halt');
    }
  },

  async u3_sd(rt) {
    let count = 0;
    await rt.at(4); await rt.at(5);
    await rt.at(7); await rt.at(8); rt.serialBegin(9600);
    await rt.at(9);
    if (!rt.dev('sd', 'begin')) {
      await rt.at(10); rt.println('Card failed or not present');
      await rt.at(11); for (;;) await rt.delay(250);
    }
    await rt.at(13); rt.println('Card ready');
    for (;;) {
      await rt.at(16);
      await rt.at(17); const f = rt.dev('sd', 'append', 'LOG.TXT', '');
      await rt.at(18);
      if (f) {
        await rt.at(19); rt.dev('sd', 'append', 'LOG.TXT', 'reading ');
        await rt.at(20); rt.dev('sd', 'append', 'LOG.TXT', count + '\n');
        await rt.at(21);
        await rt.at(22); rt.print('wrote line ');
        await rt.at(23); rt.println(count);
        await rt.at(24); count++;
      } else {
        await rt.at(26); rt.println('could not open LOG.TXT');
      }
      await rt.at(28); await rt.delay(2000);
    }
  },

  async u3_gas(rt, opts = {}) {
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(6); rt.pinMode('D2', 'INPUT');
    await rt.at(7); rt.serialBegin(9600);
    await rt.at(8); rt.println('Warming up...');
    await rt.at(9); await rt.delay(3000);
    for (;;) {
      await rt.at(12);
      await rt.at(13); const level = rt.analogRead('A0');
      await rt.at(14); rt.print('level ');
      await rt.at(15); rt.print(level);
      await rt.at(16); if (level > (opts.thr || 450)) rt.print('  GAS!');
      await rt.at(17); rt.print('  DO=');
      await rt.at(18); rt.println(rt.digitalRead('D2'));
      await rt.at(19); await rt.delay(500);
    }
  },

  async u3_flame(rt) {
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(6); rt.pinMode('D2', 'INPUT');
    await rt.at(7); rt.pinMode('D5', 'OUTPUT');
    await rt.at(8); rt.serialBegin(9600);
    for (;;) {
      await rt.at(11);
      await rt.at(12); const flame = rt.digitalRead('D2') === 0;
      await rt.at(13); rt.digitalWrite('D5', flame ? 1 : 0);
      await rt.at(14); rt.print('AO=');
      await rt.at(15); rt.print(rt.analogRead('A0'));
      await rt.at(16); rt.println(flame ? '  FLAME' : '  none');
      await rt.at(17); await rt.delay(300);
    }
  },

  async u3_gps(rt) {
    await rt.at(4); await rt.at(5);
    await rt.at(8); rt.serialBegin(9600);
    await rt.at(9);
    for (;;) {
      await rt.at(12);
      await rt.at(13); const g = rt.dev('gps', 'state') || { valid: false, sats: 0 };
      await rt.at(14);
      if (g.valid) {
        await rt.at(15); rt.print(g.lat, 6);
        await rt.at(16); rt.print(', ');
        await rt.at(17); rt.print(g.lng, 6);
        await rt.at(18); rt.print('  satellites: ');
        await rt.at(19); rt.println(g.sats);
      } else {
        await rt.at(21); rt.println('Waiting for a fix...');
      }
      await rt.at(23); await rt.delay(1000);
    }
  },

  async u3_rtc(rt) {
    await rt.at(4);
    await rt.at(7); rt.serialBegin(9600);
    await rt.at(8);
    if (!rt.dev('rtc', 'begin')) {
      await rt.at(9); rt.println('RTC not found');
      await rt.at(10); for (;;) await rt.delay(250);
    }
    await rt.at(12);
    if (rt.dev('rtc', 'lostPower')) { await rt.at(13); rt.dev('rtc', 'adjust'); }
    for (;;) {
      await rt.at(17);
      await rt.at(18); const n = rt.dev('rtc', 'now');
      await rt.at(19); rt.print(n.y);
      await rt.at(20); rt.print('-');
      await rt.at(21); rt.print(n.mo);
      await rt.at(22); rt.print('-');
      await rt.at(23); rt.print(n.d);
      await rt.at(24); rt.print(' ');
      await rt.at(25); rt.print(n.h);
      await rt.at(26); rt.print(':');
      await rt.at(27); rt.print(n.mi);
      await rt.at(28); rt.print(':');
      await rt.at(29); rt.println(n.s);
      await rt.at(30); rt.print('Temperature: ');
      await rt.at(31); rt.println(rt.dev('rtc', 'temp'), 2);
      await rt.at(32); await rt.delay(1000);
    }
  },

  async u3_a4988(rt) {
    const turn = async (a, b, c, d, e) => {
      for (let i = 0; i < 200; i++) {
        await rt.at(a); await rt.at(b); rt.digitalWrite('D3', 1);
        await rt.at(c); await rt.delay(1);
        await rt.at(d); rt.digitalWrite('D3', 0);
        await rt.at(e); await rt.delay(1);
      }
    };
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(4);
    await rt.at(7); rt.pinMode('D3', 'OUTPUT');
    await rt.at(8); rt.pinMode('D4', 'OUTPUT');
    await rt.at(9); rt.pinMode('D5', 'OUTPUT');
    await rt.at(10); rt.digitalWrite('D5', 0);
    for (;;) {
      await rt.at(13);
      await rt.at(14); rt.digitalWrite('D4', 1);
      await turn(15, 16, 17, 18, 19);
      await rt.at(21); await rt.delay(1000);
      await rt.at(22); rt.digitalWrite('D4', 0);
      await turn(23, 24, 25, 26, 27);
      await rt.at(29); await rt.delay(1000);
    }
  },

  async u3_fan(rt) {
    await rt.at(1);
    await rt.at(4); rt.pinMode('D9', 'OUTPUT');
    await rt.at(5); rt.serialBegin(9600);
    for (;;) {
      await rt.at(8);
      for (let speed = 0; speed <= 255; speed += 51) {
        await rt.at(9);
        await rt.at(10); rt.analogWrite('D9', speed);
        await rt.at(11); rt.println(speed);
        await rt.at(12); await rt.delay(1500);
      }
      await rt.at(14); rt.analogWrite('D9', 0);
      await rt.at(15); await rt.delay(1500);
    }
  },

  async u3_uart(rt) {
    let counter = 0;
    await rt.at(3); await rt.at(4);
    await rt.at(7); rt.serialBegin(9600);
    await rt.at(8);
    for (;;) {
      await rt.at(11);
      await rt.at(12); let buf = 'HELLO ';
      await rt.at(13); rt.dev('peer', 'write', buf + counter + '\n');
      await rt.at(14); rt.print('sent ');
      await rt.at(15); rt.println(counter);
      await rt.at(16); const start = rt.millis();
      while (rt.millis() - start < 1000) {
        await rt.at(17);
        await rt.at(18);
        if (rt.dev('peer', 'avail') > 0) { const c = rt.dev('peer', 'read'); if (c === '\n') rt.println(); else rt.print(c); }
        await rt.yield();
      }
      await rt.at(20); counter++;
    }
  },

  async u3_hc05(rt) {
    await rt.at(3); await rt.at(4);
    await rt.at(7); rt.pinMode('D5', 'OUTPUT');
    await rt.at(8); rt.serialBegin(9600);
    await rt.at(9);
    for (;;) {
      await rt.at(12);
      await rt.at(13);
      if (rt.dev('hc05', 'avail') > 0) {
        await rt.at(14); const c = rt.dev('hc05', 'read');
        await rt.at(15); rt.print('received: ');
        await rt.at(16); rt.println(c);
        await rt.at(17); if (c === '1') rt.digitalWrite('D5', 1);
        await rt.at(18); if (c === '0') rt.digitalWrite('D5', 0);
        await rt.at(19); let buf = 'LED is ';
        await rt.at(20); rt.dev('hc05', 'write', buf + (rt.digitalRead('D5') ? 'on' : 'off') + '\n');
      }
      await rt.yield();
    }
  },

  async u3_nrf(rt) {
    let counter = 0;
    await rt.at(4); await rt.at(5);
    await rt.at(9); rt.serialBegin(9600);
    await rt.at(10);
    if (!rt.dev('nrf', 'begin')) {
      await rt.at(11); rt.println('nRF24L01 not found');
      await rt.at(12); for (;;) await rt.delay(250);
    }
    await rt.at(14); const ch = 76;
    await rt.at(15); const addr = '00001';
    await rt.at(16); rt.dev('nrf', 'config', ch, addr);
    for (;;) {
      await rt.at(19);
      await rt.at(21); const text = 'hello ' + counter;
      await rt.at(22); const ok = rt.dev('nrf', 'write', text);
      await rt.at(23); rt.print(text);
      await rt.at(24); rt.println(ok ? '  delivered' : '  no answer');
      await rt.at(25); counter++;
      await rt.at(26); await rt.delay(1000);
    }
  },
};

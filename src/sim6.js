// Simulated Python programs of Raspberry Pi lessons 33-46. rt.at(n) highlights line n of the listing in src/pi4/code5.js.
// Physical header pin numbers are used (p13 = GPIO27 ...). Devices: src/devices.js.
const hex = (v, w = 2) => v.toString(16).toUpperCase().padStart(w, '0');

export const PROGRAMS6 = {
  async pi5_abuz(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(4); rt.pinMode('p13', 'OUTPUT');
    for (;;) {
      await rt.at(6);
      await rt.at(7); rt.digitalWrite('p13', 1);
      await rt.at(8); rt.println('beep');
      await rt.at(9); await rt.delay(500);
      await rt.at(10); rt.digitalWrite('p13', 0);
      await rt.at(11); await rt.delay(500);
    }
  },

  async pi5_swt(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(4); rt.pinMode('p29', 'INPUT'); await rt.at(5); rt.pinMode('p31', 'INPUT_PULLUP'); await rt.at(6); rt.pinMode('p33', 'INPUT_PULLUP');
    for (;;) {
      await rt.at(8);
      await rt.at(9); rt.println('slide = ' + rt.digitalRead('p29') + '  reed = ' + (rt.digitalRead('p31') === 0 ? 1 : 0) + '  tilt = ' + (rt.digitalRead('p33') === 0 ? 1 : 0));
      await rt.at(10); await rt.delay(500);
    }
  },

  async pi5_seg7(rt) {
    const pins = ['p11', 'p12', 'p13', 'p15', 'p16', 'p18', 'p22'];
    const digits = [0b0111111, 0b0000110, 0b1011011, 0b1001111, 0b1100110, 0b1101101, 0b1111101, 0b0000111, 0b1111111, 0b1101111];
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(4); pins.forEach(p => rt.pinMode(p, 'OUTPUT')); await rt.at(5); await rt.at(6);
    for (;;) {
      await rt.at(8);
      for (let d = 0; d < 10; d++) {
        await rt.at(9);
        await rt.at(10); for (let s = 0; s < 7; s++) rt.digitalWrite(pins[s], (digits[d] >> s) & 1);
        await rt.at(11); rt.println(d);
        await rt.at(12); await rt.delay(800);
      }
    }
  },

  async pi5_max7219(rt) {
    const w = (r, v) => rt.dev('max7219', 'write', r, v);
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(6);
    await rt.at(7); w(0x0B, 7); w(0x09, 0); w(0x0F, 0); w(0x0C, 1);     // the luma driver sets scan limit, decode mode, display test and wakes the chip
    await rt.at(8); w(0x0A, 64 >> 4);
    await rt.at(10);
    await rt.at(11); const rows = [255, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 255];
    await rt.at(12); rows[3] |= 0x10;
    await rt.at(13); rows[4] |= 0x08;
    rows.forEach((v, r) => w(r + 1, v));
    for (;;) {
      await rt.at(15);
      for (let level = 0; level < 256; level += 16) { await rt.at(16); await rt.at(17); w(0x0A, level >> 4); await rt.at(18); await rt.delay(150); }
    }
  },

  async pi5_tft(rt) {
    const T = (...a) => rt.dev('tft', ...a);
    let level = 0;
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(6); await rt.at(7); T('init');
    await rt.at(9);
    for (;;) {
      await rt.at(10);
      await rt.at(11); level = (level + 8) % 104;
      await rt.at(12); T('fill', 0x0000);
      await rt.at(13); T('text', 8, 8, 1, 0xFFE0, 'Raspberry Pi');
      await rt.at(14); T('rect', 8, 60, 113, 21, 0xFFFF, false);
      await rt.at(15); T('rect', 10, 62, 5 + level, 17, 0x07E0, true);
      await rt.at(16); T('circle', 64, 120, 14, 0xF800, true);
      await rt.at(17); await rt.delay(300);
    }
  },

  async pi5_rfid(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(6); rt.println('Hold a card near the reader');
    await rt.at(7);
    for (;;) {
      await rt.at(8);
      await rt.at(9);
      let uid = null;
      while (!uid) { uid = rt.dev('rfid', 'read'); if (!uid) await rt.yield(); }
      await rt.at(10); const chk = uid.reduce((a, b) => a ^ b, 0); rt.println('UID: 0x' + [...uid, chk].map(b => b.toString(16).padStart(2, '0')).join(''));   // read_id() returns 5 bytes: the 4 UID bytes and the check byte (XOR of them)
      await rt.delay(400);
    }
  },

  async pi5_gps(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(4);
    for (;;) {
      await rt.at(6);
      await rt.at(7); await rt.delay(1000);
      await rt.at(8);
      const g = rt.dev('gps', 'state') || { valid: false, sats: 0 };
      await rt.at(9);
      await rt.at(10);
      if (g.valid) { await rt.at(11); rt.println(g.lat + ' ' + g.lng + ' satellites: ' + g.sats); }
      else { await rt.at(13); rt.println('Waiting for a fix...'); }
    }
  },

  async pi5_rtc(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(3);
    await rt.at(5); await rt.at(6);
    if (!rt.dev('rtc', 'begin')) { rt.println('ValueError: No I2C device at address: 0x68'); return; }
    await rt.at(8);
    if (rt.dev('rtc', 'lostPower')) { await rt.at(9); rt.dev('rtc', 'adjust'); }
    for (;;) {
      await rt.at(11);
      await rt.at(12); const n = rt.dev('rtc', 'now');
      await rt.at(13); rt.println(`${n.y}-${n.mo}-${n.d} ${n.h}:${n.mi}:${n.s}`);
      await rt.at(14); rt.println('Temperature: ' + rt.dev('rtc', 'temp'));
      await rt.at(15); await rt.delay(1000);
    }
  },

  async pi5_a4988(rt) {
    const turn = async n => {
      for (let i = 0; i < n; i++) {
        await rt.at(10); await rt.at(11); rt.digitalWrite('p29', 1);
        await rt.at(12); await rt.delay(1);
        await rt.at(13); rt.digitalWrite('p29', 0);
        await rt.at(14); await rt.delay(1);
      }
    };
    await rt.at(1); await rt.at(2);
    await rt.at(4); rt.pinMode('p29', 'OUTPUT'); await rt.at(5); rt.pinMode('p31', 'OUTPUT'); await rt.at(6); rt.pinMode('p33', 'OUTPUT');
    await rt.at(7); rt.digitalWrite('p33', 0); await rt.at(9);
    for (;;) {
      await rt.at(16);
      await rt.at(17); rt.digitalWrite('p31', 1);
      await rt.at(18); await turn(200);
      await rt.at(19); await rt.delay(1000);
      await rt.at(20); rt.digitalWrite('p31', 0);
      await rt.at(21); await turn(200);
      await rt.at(22); await rt.delay(1000);
    }
  },

  async pi5_fan(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(4); rt.pwmValue('p32', 0);
    for (;;) {
      await rt.at(6);
      for (const speed of [0, 0.2, 0.4, 0.6, 0.8, 1.0]) {
        await rt.at(7);
        await rt.at(8); rt.pwmValue('p32', speed);
        await rt.at(9); rt.println(speed);
        await rt.at(10); await rt.delay(1500);
      }
      await rt.at(11); rt.pwmValue('p32', 0);
      await rt.at(12); await rt.delay(1500);
    }
  },

  async pi5_flame(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(4); rt.pinMode('p13', 'INPUT'); await rt.at(5); rt.pinMode('p11', 'OUTPUT');
    for (;;) {
      await rt.at(7);
      await rt.at(8);
      if (rt.digitalRead('p13') === 0) { await rt.at(9); rt.digitalWrite('p11', 1); await rt.at(10); rt.println('FLAME'); }
      else { await rt.at(12); rt.digitalWrite('p11', 0); await rt.at(13); rt.println('none'); }
      await rt.at(14); await rt.delay(300);
    }
  },

  async pi5_uart(rt) {
    let counter = 0, buf = '';
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(4); await rt.at(5);
    for (;;) {
      await rt.at(7);
      await rt.at(8); rt.dev('peer', 'write', 'HELLO ' + counter + '\n');
      await rt.at(9); rt.println('sent ' + counter);
      await rt.at(10); const start = rt.millis();
      while (rt.millis() - start < 1000) {
        await rt.at(11); await rt.at(12);
        while (rt.dev('peer', 'avail') > 0) { const c = rt.dev('peer', 'read'); if (c === '\n') { await rt.at(13); if (buf) { await rt.at(14); rt.println(buf); } buf = ''; } else buf += c; }
        await rt.delay(100);
      }
      await rt.at(15); counter++;
    }
  },

  async pi5_timer(rt) {
    let ticks = 0, on = 0;
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(3); await rt.at(5); rt.pinMode('p11', 'OUTPUT'); await rt.at(6); await rt.at(8);
    await rt.at(14);
    rt.timerEvery(500, () => { on = on ? 0 : 1; rt.digitalWrite('p11', on); ticks++; });
    for (;;) {
      await rt.at(15);
      await rt.at(16); rt.println(ticks);
      await rt.at(17); await rt.delay(2000);
    }
  },

  async pi5_prefs(rt) {
    rt.serialBegin(9600);
    await rt.at(1); await rt.at(2); await rt.at(4);
    await rt.at(5); await rt.at(6); const runs = rt.dev('prefs', 'get', 'runs', 0) + 1;
    await rt.at(7); rt.dev('prefs', 'put', 'runs', runs);
    await rt.at(8); rt.println('This program has started ' + runs + ' times');
    for (;;) await rt.delay(250);
  },
};

// Simulated devices of slot c: 'lora' (a second LoRa node, "Node B") and 'xbee' (a Zigbee coordinator, "Node B").
// No three.js import here, so the logic can be tested in node. Registered by c_ui.js. The path loss scale, RSSI and SNR are illustrative;
// the decoding limits per spreading factor and the time-on-air formula are from the Semtech SX1276 datasheet (rev. 7).
import { Dev } from '../devices.js';
const $ = s => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/** minimum SNR the LoRa demodulator needs, per spreading factor (SX1276 datasheet, Table 13) */
export const SNR_LIMIT = { 6: -5, 7: -7.5, 8: -10, 9: -12.5, 10: -15, 11: -17.5, 12: -20 };
/** time on air in ms (SX1276 datasheet 4.1.1.7): explicit header, coding rate 4/5, no CRC, 8 preamble symbols (Arduino LoRa library defaults, from memory) */
export function airtimeMs(sf, bw, pl, { pre = 8, cr = 1, crc = 0, ih = 0 } = {}) {
  const tsym = (2 ** sf) / bw * 1000, de = tsym > 16 ? 1 : 0;
  const np = 8 + Math.max(Math.ceil((8 * pl - 4 * sf + 28 + 16 * crc - 20 * ih) / (4 * (sf - 2 * de))) * (cr + 4), 0);
  return (pre + 4.25 + np) * tsym;
}
/** illustrative link: path loss level 1..8 -> RSSI; noise floor = -174 dBm/Hz + 10 log10(BW) + 6 dB (assumed receiver noise figure) */
export function link(loss, bw) {
  const rssi = -50 - 12 * (loss - 1), noise = -174 + 10 * Math.log10(bw) + 6;
  return { rssi, snr: clamp(rssi - noise, -25, 10) };
}
const BWS = [[62500, '62.5 kHz'], [125000, '125 kHz'], [250000, '250 kHz'], [500000, '500 kHz']];

export class LoRaDev extends Dev {
  name = 'lora';
  B = { on: 1, freq: 868, sf: 7, bw: 125000, sync: 0x12, loss: 2 };
  cfg = { freq: 0, sf: 7, bw: 125000, sync: 0x12 }; started = false; pending = null; log = []; last = null;
  get io() { return this.ios()[0] || {}; }
  html() {
    const sel = (id, opts, cur) => `<select id="${id}">${opts.map(([v, t]) => `<option value="${v}"${v == cur ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
    if (this.io.band) this.B.freq = this.io.band;
    return this.box('Node B (the other LoRa module)', `
      <div class="io-tools"><button id="lo-on" class="hold small">Node B: on</button></div>
      <div class="throw"><label>Frequency</label>${sel('lo-f', [[433, '433 MHz'], [868, '868 MHz'], [915, '915 MHz']], this.B.freq)}</div>
      <div class="throw"><label>Spreading factor</label>${sel('lo-sf', [7, 8, 9, 10, 11, 12].map(x => [x, 'SF' + x]), this.B.sf)}</div>
      <div class="throw"><label>Bandwidth</label>${sel('lo-bw', BWS, this.B.bw)}</div>
      ${this.io.nosync ? '' : `<div class="throw"><label>Sync word</label>${sel('lo-sy', [[0x12, '0x12'], [0x34, '0x34']], this.B.sync)}</div>`}
      <div class="throw"><label>Path loss</label><input id="lo-ls" type="range" min="1" max="8" value="${this.B.loss}" style="width:110px"> <span id="lo-lv"></span></div>
      <div id="lo-info" class="io-val" style="font-size:11px">—</div>
      <pre id="lo-log" class="io-val" style="white-space:pre-wrap;margin:4px 0 0;max-height:120px;overflow:auto;font-size:11px">—</pre>`,
      'The path loss scale (1 = close, 8 = very far or walls) is made up. The decoding limits and the time on air come from the SX1276 datasheet. Frequency rules depend on your country; this is not legal advice.');
  }
  bind() {
    const B = this.B, on = $('#lo-on');
    on.onclick = () => { B.on ^= 1; on.textContent = 'Node B: ' + (B.on ? 'on' : 'off'); };
    $('#lo-f').onchange = e => { B.freq = +e.target.value; }; $('#lo-sf').onchange = e => { B.sf = +e.target.value; }; $('#lo-bw').onchange = e => { B.bw = +e.target.value; };
    const sy = $('#lo-sy'); if (sy) sy.onchange = e => { B.sync = +e.target.value; };
    $('#lo-ls').oninput = e => { B.loss = +e.target.value; };
  }
  reset() { this.pending = null; this.log = []; this.started = false; this.last = null; }
  say(s) { this.log.push(s); if (this.log.length > 12) this.log.shift(); }
  call(op, a, b, c) {
    if (!this.on()) return op === 'begin' ? false : op === 'send' ? 0 : null;
    const C = this.cfg;
    if (op === 'begin') { C.freq = a > 1e5 ? a / 1e6 : a; this.started = true; return true; }
    if (op === 'sf') { C.sf = a; return; } if (op === 'bw') { C.bw = a; return; } if (op === 'sync') { C.sync = a; return; }
    if (op === 'send') {
      const text = String(a), pl = text.length + (b | 0), air = airtimeMs(C.sf, C.bw, pl), B = this.B, why = [];
      if (!B.on) why.push('Node B is off');
      if (Math.round(C.freq) !== B.freq) why.push(`other frequency (${Math.round(C.freq)} / ${B.freq} MHz)`);
      if (C.sf !== B.sf) why.push(`other spreading factor (SF${C.sf} / SF${B.sf})`);
      if (C.bw !== B.bw) why.push(`other bandwidth (${C.bw / 1000} / ${B.bw / 1000} kHz)`);
      if (!this.io.nosync && C.sync !== B.sync) why.push(`other sync word (0x${C.sync.toString(16)} / 0x${B.sync.toString(16)})`);
      const L = link(B.loss, C.bw), lim = SNR_LIMIT[C.sf];
      this.last = { air, pl, ...L, lim };
      if (why.length) this.say(`you sent "${text}": Node B hears nothing: ${why.join(', ')}`);
      else if (L.snr < lim) this.say(`you sent "${text}": too weak, SNR ${L.snr.toFixed(1)} dB is below the SF${C.sf} limit of ${lim} dB`);
      else {
        this.say(`B received "${text}"  RSSI ${L.rssi} dBm  SNR ${L.snr.toFixed(1)} dB`);
        const m = /(\d+)/.exec(text), reply = 'ack ' + (m ? m[1] : '?');
        this.pending = { text: reply, rssi: L.rssi, snr: +L.snr.toFixed(1), due: performance.now() + air + airtimeMs(C.sf, C.bw, reply.length) + 100 };
      }
      return air;
    }
    if (op === 'poll') { const p = this.pending; if (p && performance.now() >= p.due) { this.pending = null; this.say(`B replied "${p.text}"`); return p; } return null; }
    return undefined;
  }
  tick() {
    const lv = $('#lo-lv'); if (lv) lv.textContent = String(this.B.loss);
    const l = this.last;
    this.set('#lo-info', this.stateNote() || (l ? `Your last packet: ${l.pl} bytes, SF${this.cfg.sf}, ${this.cfg.bw / 1000} kHz: time on air <b>${l.air.toFixed(0)} ms</b> · link RSSI ${l.rssi} dBm, SNR ${l.snr.toFixed(1)} dB (limit ${l.lim} dB)` : 'No packet sent yet.'));
    this.set('#lo-log', this.stateNote() || this.log.join('\n') || '(nothing yet)');
  }
}

export class XBeeDev extends Dev {
  name = 'xbee';
  A = { id: 1234 }; B = { on: 1, id: 1234 }; t0 = null; joined = false; buf = ''; inbox = []; log = [];
  html() {
    const sel = (id, opts, cur) => `<select id="${id}">${opts.map(([v, t]) => `<option value="${v}"${v == cur ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
    return this.box('Zigbee network (XCTU settings and Node B)', `
      <div class="throw"><label>Your XBee: PAN ID (ID)</label>${sel('xb-a', [[1234, '1234'], [5678, '5678'], [0, '0 (join any network)']], this.A.id)}</div>
      <div class="throw"><label>Node B coordinator: PAN ID</label>${sel('xb-b', [[1234, '1234'], [5678, '5678']], this.B.id)}</div>
      <div class="io-tools"><button id="xb-on" class="hold small">Node B (coordinator): on</button></div>
      <div id="xb-st" class="io-val" style="font-size:11px">—</div>
      <pre id="xb-log" class="io-val" style="white-space:pre-wrap;margin:4px 0 0;max-height:120px;overflow:auto;font-size:11px">—</pre>`,
      'In transparent mode the XBee sends what you write to its DIN pin to the destination DH:DL (default 0 = the coordinator). The settings are normally made with XCTU. The join time and reply delay here are made up.');
  }
  bind() {
    $('#xb-a').onchange = e => { this.A.id = +e.target.value; this.t0 = null; }; $('#xb-b').onchange = e => { this.B.id = +e.target.value; this.t0 = null; };
    const on = $('#xb-on'); on.onclick = () => { this.B.on ^= 1; on.textContent = 'Node B (coordinator): ' + (this.B.on ? 'on' : 'off'); this.t0 = null; };
  }
  reset() { this.t0 = null; this.joined = false; this.buf = ''; this.inbox = []; this.log = []; }
  say(s) { this.log.push(s); if (this.log.length > 12) this.log.shift(); }
  netOk() { return !!this.B.on && (this.A.id === 0 || this.A.id === this.B.id); }
  call(op, a) {
    if (!this.on()) return op === 'avail' ? 0 : undefined;
    if (op === 'avail') return this.inbox.length;
    if (op === 'read') return this.inbox.shift();
    if (op === 'write') {
      this.buf += String(a); let i;
      while ((i = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, i).trim(); this.buf = this.buf.slice(i + 1);
        if (!this.joined) { this.say(`your XBee has not joined a network yet: "${line}" is not delivered`); continue; }
        this.say(`coordinator received "${line}"`);
        setTimeout(() => { if (!this.running() || !this.on()) return; this.inbox.push(...('got ' + line + '\n')); this.say('coordinator replied "got ' + line + '"'); }, 400);
      }
    }
    return undefined;
  }
  tick() {
    const now = performance.now();
    if (this.running() && this.on()) { if (this.t0 === null) this.t0 = now; this.joined = this.netOk() && now - this.t0 > 3000; } else { this.t0 = null; this.joined = false; }
    this.set('#xb-st', this.stateNote() || (this.joined ? `Your XBee <b>joined</b> the network, PAN ID ${this.B.id}.` : this.netOk() ? 'Your XBee is joining the network…' : `Your XBee (ID ${this.A.id || 'any'}) finds no coordinator with a matching PAN ID.`));
    this.set('#xb-log', this.stateNote() || this.log.join('\n') || '(nothing yet)');
  }
}

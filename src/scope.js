// Simulated oscilloscope: draws the ideal signal on one pin (0–3.3 V), 10 ms window.
const W_MS = 10;

export class Scope {
  constructor(canvas, info) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.info = info;
    this.state = null;
    this.draw();
  }
  set(state) { this.state = state; this.draw(); }

  draw() {
    const { g, c } = this, w = c.width, h = c.height;
    const top = 16, bot = h - 22, left = 34, right = w - 8;
    g.fillStyle = '#070b0e'; g.fillRect(0, 0, w, h);
    // grid: 1 ms per division
    g.strokeStyle = 'rgba(80,140,120,0.22)'; g.lineWidth = 1;
    for (let i = 0; i <= W_MS; i++) { const x = left + (right - left) * i / W_MS; g.beginPath(); g.moveTo(x, top); g.lineTo(x, bot); g.stroke(); }
    for (let i = 0; i <= 4; i++) { const y = top + (bot - top) * i / 4; g.beginPath(); g.moveTo(left, y); g.lineTo(right, y); g.stroke(); }
    g.fillStyle = '#6f8a80'; g.font = '11px Consolas, monospace';
    g.fillText('3.3V', 2, top + 4); g.fillText('0V', 10, bot + 4);
    g.fillText('0', left - 3, h - 6); g.fillText(`${W_MS} ms`, right - 34, h - 6); g.fillText('1 ms/div', (left + right) / 2 - 26, h - 6);
    const s = this.state;
    const Y = v => bot - (bot - top) * v;
    g.strokeStyle = '#4dffb0'; g.lineWidth = 2; g.shadowColor = '#4dffb0'; g.shadowBlur = 6;
    g.beginPath();
    let text = 'No signal';
    if (!s) { g.moveTo(left, Y(0)); g.lineTo(right, Y(0)); }
    else if (s.type === 'dc') { g.moveTo(left, Y(s.level)); g.lineTo(right, Y(s.level)); text = s.level ? 'Steady HIGH (3.3 V)' : 'Steady LOW (0 V)'; }
    else {
      const period = 1000 / s.freq;                      // ms
      const duty = s.type === 'square' ? 0.5 : s.duty;
      const xs = t => left + (right - left) * t / W_MS;
      if (duty <= 0) { g.moveTo(left, Y(0)); g.lineTo(right, Y(0)); }
      else if (duty >= 1) { g.moveTo(left, Y(1)); g.lineTo(right, Y(1)); }
      else {
        g.moveTo(left, Y(1));
        for (let t0 = 0; t0 < W_MS; t0 += period) {
          const t1 = Math.min(W_MS, t0 + period * duty), t2 = Math.min(W_MS, t0 + period);
          g.lineTo(xs(t1), Y(1)); g.lineTo(xs(t1), Y(0));
          g.lineTo(xs(t2), Y(0)); if (t2 < W_MS) g.lineTo(xs(t2), Y(1));
        }
      }
      text = s.type === 'square'
        ? `Square wave ${s.freq} Hz · period ${period.toFixed(2)} ms`
        : `PWM 500 Hz · period 2 ms · duty ${(duty * 100).toFixed(0)} % · average ${(duty * 3.3).toFixed(2)} V`;
    }
    g.stroke(); g.shadowBlur = 0;
    if (this.info) this.info.textContent = text;
  }
}

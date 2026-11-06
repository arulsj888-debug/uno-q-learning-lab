import json
D = json.load(open('drawing.json'))
S = (506.7 - 169.85) / 58.0
X0 = 169.85 - 3.5 * S; YB = 565.75 + 3.5 * S
mm = lambda x, y: ((x - X0) / S, (YB - y) / S)
segs = []
for x0, y0, x1, y1, n in D['paths']:
    a, b = mm(x0, y1), mm(x1, y0)
    w, h = b[0] - a[0], b[1] - a[1]
    if -6 < a[0] < 92 and -6 < a[1] < 62 and -6 < b[0] < 92 and -6 < b[1] < 62 and max(w, h) > 2.5 and min(w, h) < 0.3:
        segs.append((round(a[0], 2), round(a[1], 2), round(b[0], 2), round(b[1], 2)))
def region(name, rx0, ry0, rx1, ry1):
    s = [q for q in segs if q[0] >= rx0 and q[2] <= rx1 and q[1] >= ry0 and q[3] <= ry1]
    if not s: print(name, 'none'); return
    xs = [q[0] for q in s] + [q[2] for q in s]; ys = [q[1] for q in s] + [q[3] for q in s]
    print(f'{name:10s} x {min(xs):6.2f}..{max(xs):6.2f}  y {min(ys):6.2f}..{max(ys):6.2f}  (w {max(xs)-min(xs):.2f}, h {max(ys)-min(ys):.2f})  n={len(s)}')
for w in D['words']:
    if w[4].startswith('Z='):
        print('label', w[4], [round(v, 1) for v in mm((w[0] + w[2]) / 2, (w[1] + w[3]) / 2)])
region('GPIO', 5, 50, 60, 55.6)
region('ETH', 64, 37, 90, 56)
region('USB3', 68, 19, 90, 35)
region('USB2', 68, 0, 90, 17)
region('USBC', 6, -2, 16.5, 7)
region('HDMI0', 21.5, -2, 30.5, 7)
region('HDMI1', 35, -2, 44, 7)
region('AV', 50, -4, 57.5, 13)
region('CSI', 44, -1, 49, 24)
region('DSI', 0.5, 15, 5.5, 40.5)
region('SoC', 21, 24, 37.5, 41)
region('RAM', 38, 24, 51, 41)
region('WIFI', 6, 36, 18, 50)
region('POE', 58.5, 43.5, 64.5, 49.5)
print('----')
for name, r in [('ETH', (64, 37, 90, 56)), ('USB2', (68, 0, 90, 17)), ('GPIO', (5, 49, 60, 56)), ('AV', (50, -4, 57.5, 13)), ('USBC', (6, -2, 16.5, 7)), ('HDMI0', (21.5, -2, 30.5, 7))]:
    s = [q for q in segs if q[0] >= r[0] and q[2] <= r[2] and q[1] >= r[1] and q[3] <= r[3]]
    print(name, s)

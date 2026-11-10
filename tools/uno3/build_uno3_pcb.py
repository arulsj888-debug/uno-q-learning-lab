"""
Build the PCB textures of the Arduino UNO R3 from Arduino's official open-source board file
(UNO-TH_Rev3e.brd, docs.arduino.cc/hardware/uno-rev3 "CAD files", CC BY-SA 4.0).

Every copper track, pad, via, hole, soldermask opening and silkscreen line/text comes from the board file.
Output: assets/uno3/pcb_{top,bottom}_{albedo,orm,bump}.jpg and assets/uno3/board_data.json
(outline, holes, element list with positions/rotations/packages for the 3D parts).

Board coordinates: millimetres, origin bottom-left, x right, y up (same as the board file and the UNO Q model).
Usage: python -I tools/uno3/build_uno3_pcb.py <board.brd> <out_dir>
"""
import json, math, os, sys, xml.etree.ElementTree as ET
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

BRD, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
PX = 40.0                       # render px per mm
W_MM, H_MM = 68.58, 53.34
OUT_PX = 36.0                   # texture px per mm
SW, SH = int(W_MM * PX), int(H_MM * PX)

root = ET.parse(BRD).getroot()
brd = root.find('drawing/board')
MIRROR_LAYER = {1: 16, 16: 1, 21: 22, 22: 21, 25: 26, 26: 25, 27: 28, 28: 27, 29: 30, 30: 29, 31: 32, 32: 31, 51: 52, 52: 51}

def to_px(x, y): return x * PX, (H_MM - y) * PX

class Canvas:
    def __init__(self): self.img = Image.new('L', (SW, SH), 0); self.d = ImageDraw.Draw(self.img)
    def arr(self): return np.array(self.img) > 127

layers = {k: Canvas() for k in ('cu_t', 'cu_b', 'stop_t', 'stop_b', 'silk_t', 'silk_b', 'cream_t', 'cream_b', 'dim', 'drill')}
LMAP = {1: 'cu_t', 16: 'cu_b', 29: 'stop_t', 30: 'stop_b', 21: 'silk_t', 22: 'silk_b', 25: 'silk_t', 26: 'silk_b', 31: 'cream_t', 32: 'cream_b', 20: 'dim'}
holes = []

def arc_points(x1, y1, x2, y2, curve, n=24):
    if not curve: return [(x1, y1), (x2, y2)]
    a = math.radians(curve)
    dx, dy = x2 - x1, y2 - y1; c = math.hypot(dx, dy)
    r = c / (2 * math.sin(a / 2))
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    h = math.sqrt(max(r * r - (c / 2) ** 2, 0))
    s = 1 if a > 0 else -1
    cx, cy = mx - s * h * dy / c, my + s * h * dx / c
    a1 = math.atan2(y1 - cy, x1 - cx)
    return [(cx + abs(r) * math.cos(a1 + a * t / n), cy + abs(r) * math.sin(a1 + a * t / n)) for t in range(n + 1)]

def draw_line(cv, pts, w):
    p = [to_px(*q) for q in pts]
    wp = max(1, int(round(w * PX)))
    cv.d.line(p, fill=255, width=wp)
    for x, y in (p[0], p[-1]):
        r = wp / 2; cv.d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    if len(p) > 2:
        for x, y in p[1:-1]:
            r = wp / 2; cv.d.ellipse([x - r, y - r, x + r, y + r], fill=255)

def draw_poly(cv, pts, fill=True, w=0):
    p = [to_px(*q) for q in pts]
    if fill and len(p) > 2: cv.d.polygon(p, fill=255)
    if w: draw_line(cv, pts + [pts[0]], w)

def draw_circle(cv, x, y, r, w):
    px, py = to_px(x, y)
    if w == 0: cv.d.ellipse([px - r * PX, py - r * PX, px + r * PX, py + r * PX], fill=255)
    else:
        ro, ri = (r + w / 2) * PX, (r - w / 2) * PX
        cv.d.ellipse([px - ro, py - ro, px + ro, py + ro], outline=255, width=max(1, int(round(w * PX))))

def rect_pts(cx, cy, w, h, ang):
    c, s = math.cos(ang), math.sin(ang)
    return [(cx + c * dx - s * dy, cy + s * dx + c * dy) for dx, dy in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]

FONT = 'C:/Windows/Fonts/consola.ttf'
def draw_text(cv, text, x, y, size, ang, mirror=False, align='bottom-left'):
    if not text or text.startswith('>'): return
    text = text.replace('#', '~')   # the board file uses # for the PWM tilde
    fpx = max(6, int(size * PX / 0.72))
    f = ImageFont.truetype(FONT, fpx)
    bb = f.getbbox(text); tw, th = bb[2] - bb[0], int(size * PX)
    img = Image.new('L', (tw + 8, int(th * 1.4) + 8), 0)
    ImageDraw.Draw(img).text((4 - bb[0], 4 + th - (f.getbbox('H')[3])), text, font=f, fill=255)
    if mirror: img = img.transpose(Image.FLIP_LEFT_RIGHT)
    # anchor: Eagle positions text by its bottom-left corner (before rotation)
    ax = 4 if not mirror else img.width - 4
    ay = img.height - 4
    if 'center' in align: ax = img.width / 2
    if align.startswith('center') or align.startswith('top'): ay = img.height / 2 if align.startswith('center') else 4
    M = max(img.width, img.height) + 4
    big = Image.new('L', (img.width + 2 * M, img.height + 2 * M), 0); big.paste(img, (M, M))
    cx, cy = M + ax, M + ay
    rot = big.rotate(math.degrees(ang), center=(cx, cy), resample=Image.BICUBIC)
    px, py = to_px(x, y)
    cv.img.paste(255, (int(px - cx), int(py - cy)), rot)

def parse_rot(r):
    r = r or 'R0'
    return ('M' in r), math.radians(float(''.join(ch for ch in r if ch.isdigit() or ch == '.') or 0))

def xform(px, py, ex, ey, mir, ang):
    if mir: px = -px
    c, s = math.cos(ang), math.sin(ang)
    return ex + c * px - s * py, ey + s * px + c * py

def layer_of(l, mir):
    l = int(l); return MIRROR_LAYER.get(l, l) if mir else l

def draw_item(it, T, mir, side_layers=None):
    tag = it.tag
    lay = it.get('layer')
    L = layer_of(lay, mir) if lay else None
    cv = layers.get(LMAP.get(L)) if L else None
    if tag == 'wire' and cv:
        pts = arc_points(float(it.get('x1')), float(it.get('y1')), float(it.get('x2')), float(it.get('y2')), float(it.get('curve') or 0) * (-1 if mir else 1))
        pts = [T(*p) for p in pts]
        if L == 20: draw_line(cv, pts, 0.2)
        else: draw_line(cv, pts, float(it.get('width') or 0.1))
    elif tag == 'polygon' and cv:
        vs = list(it.findall('vertex')); pts = []
        for i, v in enumerate(vs):
            a, b = vs[i], vs[(i + 1) % len(vs)]
            seg = arc_points(float(a.get('x')), float(a.get('y')), float(b.get('x')), float(b.get('y')), float(a.get('curve') or 0) * (-1 if mir else 1))
            pts += [T(*p) for p in seg[:-1]]
        draw_poly(cv, pts, True, float(it.get('width') or 0))
    elif tag == 'circle' and cv:
        x, y = T(float(it.get('x')), float(it.get('y'))); draw_circle(cv, x, y, float(it.get('radius')), float(it.get('width') or 0))
    elif tag == 'rectangle' and cv:
        x1, y1, x2, y2 = (float(it.get(k)) for k in ('x1', 'y1', 'x2', 'y2'))
        _, ra = parse_rot(it.get('rot'))
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        pts = [T(*p) for p in rect_pts(cx, cy, abs(x2 - x1), abs(y2 - y1), ra)]
        draw_poly(cv, pts, True)
    elif tag == 'text' and cv and L in (21, 22, 25, 26):
        x, y = T(float(it.get('x')), float(it.get('y')))
        tm, ta = parse_rot(it.get('rot'))
        draw_text(cv, it.text or '', x, y, float(it.get('size')), ta + (T.ang if hasattr(T, 'ang') else 0), mirror=(L in (22, 26)), align=it.get('align') or 'bottom-left')
    elif tag == 'hole':
        x, y = T(float(it.get('x')), float(it.get('y'))); holes.append({'x': round(x, 3), 'y': round(y, 3), 'd': float(it.get('drill')), 'plated': False})
        draw_circle(layers['drill'], x, y, float(it.get('drill')) / 2, 0)

class Tr:
    def __init__(self, ex=0, ey=0, mir=False, ang=0): self.ex, self.ey, self.mir, self.ang = ex, ey, mir, ang
    def __call__(self, x, y): return xform(x, y, self.ex, self.ey, self.mir, self.ang)

STOP = 0.1016
def pad_shape(cv, shape, x, y, d, ang, grow=0):
    r = d / 2 + grow
    if shape in ('square',): draw_poly(cv, rect_pts(x, y, 2 * r, 2 * r, ang))
    elif shape == 'octagon':
        pts = [(x + r / math.cos(math.pi / 8) * math.cos(ang + math.pi / 8 + k * math.pi / 4), y + r / math.cos(math.pi / 8) * math.sin(ang + math.pi / 8 + k * math.pi / 4)) for k in range(8)]
        draw_poly(cv, pts)
    elif shape == 'long':
        dx, dy = math.cos(ang) * d / 2, math.sin(ang) * d / 2
        draw_line(cv, [(x - dx, y - dy), (x + dx, y + dy)], 2 * r)
    else: draw_circle(cv, x, y, r, 0)

# ---------------------------------------------------------------- plain items
for it in brd.find('plain'): draw_item(it, Tr(), False)

# ---------------------------------------------------------------- libraries / elements
lib = {}
for l in brd.find('libraries'):
    pk = l.find('packages')
    if pk is None: continue
    for p in pk: lib[(l.get('name'), p.get('name'))] = p
elements = []
for e in brd.find('elements'):
    pk = lib.get((e.get('library'), e.get('package')))
    ex, ey = float(e.get('x')), float(e.get('y')); mir, ang = parse_rot(e.get('rot'))
    T = Tr(ex, ey, mir, ang)
    pads = []
    if pk is not None:
        for it in pk:
            if it.tag == 'smd':
                x, y = T(float(it.get('x')), float(it.get('y'))); dx, dy = float(it.get('dx')), float(it.get('dy'))
                _, sa = parse_rot(it.get('rot')); a = ang + (-sa if mir else sa)
                L = layer_of(it.get('layer'), mir)
                side = 't' if L == 1 else 'b'
                draw_poly(layers['cu_' + side], rect_pts(x, y, dx, dy, a))
                if it.get('stop') != 'no': draw_poly(layers['stop_' + side], rect_pts(x, y, dx + 2 * STOP, dy + 2 * STOP, a))
                if it.get('cream') != 'no': draw_poly(layers['cream_' + side], rect_pts(x, y, dx, dy, a))
                pads.append({'t': 'smd', 'n': it.get('name'), 'x': round(x, 3), 'y': round(y, 3), 'dx': dx, 'dy': dy, 'a': round(math.degrees(a)) % 360, 'side': side})
            elif it.tag == 'pad':
                x, y = T(float(it.get('x')), float(it.get('y'))); drill = float(it.get('drill'))
                d = float(it.get('diameter') or 0) or drill + 2 * max(0.254, min(0.508, 0.25 * drill))
                _, sa = parse_rot(it.get('rot')); a = ang + sa
                shape = it.get('shape') or 'round'
                for side in ('t', 'b'):
                    pad_shape(layers['cu_' + side], shape, x, y, d, a)
                    if it.get('stop') != 'no': pad_shape(layers['stop_' + side], shape, x, y, d, a, STOP)
                draw_circle(layers['drill'], x, y, drill / 2, 0)
                holes.append({'x': round(x, 3), 'y': round(y, 3), 'd': drill, 'plated': True, 'el': e.get('name'), 'pad': it.get('name')})
                pads.append({'t': 'pad', 'n': it.get('name'), 'x': round(x, 3), 'y': round(y, 3), 'd': round(d, 3), 'drill': drill})
            else: draw_item(it, T, mir)
        # element attribute texts on the silkscreen layers
        for at in e.findall('attribute'):
            if at.get('display') == 'off' or at.get('layer') not in ('21', '22') or not at.get('x'): continue
            txt = at.get('value') or (e.get('name') if at.get('name') == 'NAME' else e.get('value') if at.get('name') == 'VALUE' else '')
            am, aa = parse_rot(at.get('rot'))
            L = int(at.get('layer'))
            draw_text(layers['silk_t' if L == 21 else 'silk_b'], txt, float(at.get('x')), float(at.get('y')), float(at.get('size')), aa, mirror=(L == 22))
    elements.append({'name': e.get('name'), 'value': e.get('value'), 'pkg': e.get('package'), 'x': ex, 'y': ey, 'rot': round(math.degrees(ang)) % 360, 'mirror': mir, 'pads': pads})

# ---------------------------------------------------------------- Arduino logo (a bitmap in production, not part of the CAD data): drawn left of the 'Arduino' / 'UNO' text
def arduino_logo(cv, cx, cy, w):
    h = w * 0.465; ex = w * 0.27; ey = h / 2; stroke = w * 0.095
    lx, rx = cx - w / 2 + ex, cx + w / 2 - ex
    for ox in (lx, rx):
        x0, y0 = to_px(ox - ex, cy + ey); x1, y1 = to_px(ox + ex, cy - ey)
        cv.d.ellipse([x0, y0, x1, y1], outline=255, width=int(stroke * PX))
    L = ey * 0.95; t = stroke * 0.75
    for x0, y0, x1, y1 in ((lx - L / 2, cy + t / 2, lx + L / 2, cy - t / 2), (rx - L / 2, cy + t / 2, rx + L / 2, cy - t / 2), (rx - t / 2, cy + L / 2, rx + t / 2, cy - L / 2)):
        a, b = to_px(x0, y0); c, d = to_px(x1, y1); cv.d.rectangle([a, b, c, d], fill=255)
arduino_logo(layers['silk_t'], 36.0, 37.6, 7.6)

# ---------------------------------------------------------------- signals: tracks, polygons, vias
vias = []
for sig in brd.find('signals'):
    for it in sig:
        if it.tag == 'via':
            x, y = float(it.get('x')), float(it.get('y')); drill = float(it.get('drill'))
            d = float(it.get('diameter') or 0) or drill + 2 * max(0.254, min(0.508, 0.25 * drill))
            for side in ('t', 'b'): draw_circle(layers['cu_' + side], x, y, d / 2, 0)
            draw_circle(layers['drill'], x, y, drill / 2, 0); vias.append((x, y, drill))
        elif it.tag in ('wire', 'polygon'): draw_item(it, Tr(), False)

# ---------------------------------------------------------------- board area from the outline
dim = layers['dim'].arr()
lab, n = ndi.label(~np.pad(dim, 4, constant_values=False))
board = ~(lab == lab[0, 0])[4:-4, 4:-4]
board &= ~ndi.binary_dilation(dim, iterations=1)
board = ndi.binary_dilation(board, iterations=2)
print('board fill', board.mean())

def S(name): return layers[name].arr() & board

def srgb(c): return np.array(c, dtype=np.float32) / 255.0
C_LAM, C_CU = srgb((0, 92, 104)), srgb((0, 124, 134))          # teal soldermask over laminate / over copper (UNO R3)
C_SOLDER, C_FR4, C_SILK, C_HOLE = srgb((205, 207, 210)), srgb((150, 138, 92)), srgb((240, 242, 238)), srgb((14, 14, 16))
rng = np.random.default_rng(3)
def lownoise(shape, scale, amp):
    s = rng.standard_normal((shape[0] // scale + 2, shape[1] // scale + 2)).astype(np.float32)
    return ndi.zoom(s, scale, order=3)[:shape[0], :shape[1]] * amp
drill = layers['drill'].arr()

def build(side):
    s = side[0]
    cu, so, sk = S('cu_' + s), S('stop_' + s), S('silk_' + s) & ~S('stop_' + s)
    shp = cu.shape
    cu_f = ndi.gaussian_filter(cu.astype(np.float32), 1.0)
    alb = C_LAM[None, None] * (1 - cu_f[..., None]) + C_CU[None, None] * cu_f[..., None]
    alb *= (1 + lownoise(shp, 48, 0.03))[..., None]
    rough = np.full(shp, 0.38, np.float32); metal = np.zeros(shp, np.float32); height = cu_f * 0.3
    exp_cu = so & cu; fr4 = so & ~cu
    for m, col, r, mt, h in ((fr4, C_FR4, 0.75, 0.0, 0.05), (exp_cu, C_SOLDER, 0.2, 1.0, 0.8)):
        alb[m] = col; rough[m] = r; metal[m] = mt; height[m] = h
    sk_f = ndi.gaussian_filter(sk.astype(np.float32), 0.6)
    alb = alb * (1 - sk_f[..., None]) + C_SILK[None, None] * sk_f[..., None]
    rough = rough * (1 - sk_f) + 0.85 * sk_f; height = np.maximum(height, sk_f * 0.55)
    alb[drill] = C_HOLE; metal[drill] = 0; rough[drill] = 0.9; height[drill] = 0
    alb[~board] = C_LAM
    ow, oh = int(W_MM * OUT_PX), int(H_MM * OUT_PX)
    def save(a, name, q=90):
        a = np.clip(a, 0, 1); im = Image.fromarray((a * 255 + 0.5).astype(np.uint8), 'RGB' if a.ndim == 3 else 'L')
        im.resize((ow, oh), Image.LANCZOS).save(os.path.join(OUT, name), quality=q, subsampling=0)
    save(alb, f'pcb_{side}_albedo.jpg')
    save(np.stack([np.ones(shp, np.float32), rough, metal], -1), f'pcb_{side}_orm.jpg')
    save(ndi.gaussian_filter(height, 1.0), f'pcb_{side}_bump.jpg', 88)
    print(side, 'saved', ow, oh)

build('top'); build('bottom')

# outline polygon from the Dimension layer (exact, with corner arcs)
segs = []
for it in brd.find('plain'):
    if it.tag == 'wire' and it.get('layer') == '20':
        segs.append(arc_points(float(it.get('x1')), float(it.get('y1')), float(it.get('x2')), float(it.get('y2')), float(it.get('curve') or 0), 6))
ring = list(segs.pop(0))
while segs:
    end = ring[-1]
    for i, sg in enumerate(segs):
        if math.hypot(sg[0][0] - end[0], sg[0][1] - end[1]) < 1e-3: ring += sg[1:]; segs.pop(i); break
        if math.hypot(sg[-1][0] - end[0], sg[-1][1] - end[1]) < 1e-3: ring += list(reversed(sg))[1:]; segs.pop(i); break
    else: break
outline = [[round(x, 3), round(y, 3)] for x, y in ring[:-1]]
json.dump({'source': 'Arduino UNO R3 (A000066) official board file UNO-TH_Rev3e.brd, CC BY-SA 4.0', 'size': [W_MM, H_MM], 'outline': outline,
           'holes': holes, 'vias': len(vias), 'elements': elements}, open(os.path.join(OUT, 'board_data.json'), 'w'), separators=(',', ':'))
print('outline pts', len(outline), 'holes', len(holes), 'vias', len(vias), 'elements', len(elements))

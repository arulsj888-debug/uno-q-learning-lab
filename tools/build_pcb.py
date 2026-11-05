"""
Build realistic PCB texture maps for the Arduino UNO Q from Arduino's official
open-source Gerber files (CC BY-SA 4.0, docs.arduino.cc/hardware/uno-q).

Input : PNG masks rendered from the Gerbers at 60 px/mm (portrait Gerber orientation)
        + the Excellon drill file.
Output: assets/pcb_top_albedo.jpg, pcb_top_orm.jpg, pcb_top_bump.jpg (+ bottom),
        assets/board_data.json (holes, outline, auto-detected SMD parts)

Board coordinates used everywhere in the app: millimetres, origin at the
bottom-left corner of the top view (USB-C on the left edge), x right, y up.
Gerber (portrait) -> board: x = 68.58 - Y,  y = X
"""
import json, os, re, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

GERB, DRILL, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
PX = 60.0                     # source px per mm
W_MM, H_MM = 68.58, 53.34
OUT_PX = 44.0                 # output texture px per mm (~3017 x 2347)

def load(name):
    im = np.array(Image.open(os.path.join(GERB, name + '.png')).convert('L'), dtype=np.float32) / 255.0
    return np.rot90(im)       # portrait -> landscape (rows = y from top)

def to_px(x, y):              # board mm -> landscape pixel (col, row)
    return x * PX, (H_MM - y) * PX

# ---------------------------------------------------------------- drill
def parse_drill(path):
    """Excellon, METRIC, 4.4 format with leading zeros, modal coordinates, Rnn repeats."""
    tools, holes, cur = {}, [], None
    X = Y = 0.0
    def add(x, y):
        holes.append({'x': round(W_MM - y, 4), 'y': round(x, 4), 'd': tools[cur], 'tool': cur})
    for line in open(path, encoding='latin-1').read().splitlines():
        line = line.strip()
        m = re.match(r'^T(\d+)C([\d.]+)', line)
        if m: tools[m.group(1)] = float(m.group(2)); continue
        m = re.match(r'^T(\d+)$', line)
        if m: cur = m.group(1); continue
        m = re.match(r'^R(\d+)(?:X(-?\d+))?(?:Y(-?\d+))?$', line)
        if m and cur in tools:
            n = int(m.group(1)); dx = int(m.group(2)) / 1e4 if m.group(2) else 0; dy = int(m.group(3)) / 1e4 if m.group(3) else 0
            for _ in range(n):
                X += dx; Y += dy; add(X, Y)
            continue
        m = re.match(r'^(?:X(-?\d+))?(?:Y(-?\d+))?$', line)
        if m and (m.group(1) or m.group(2)) and cur in tools:
            if m.group(1): X = int(m.group(1)) / 1e4
            if m.group(2): Y = int(m.group(2)) / 1e4
            add(X, Y)
    return holes

holes = parse_drill(DRILL)
PLATED = {'01', '02', '03', '04', '05'}
print('holes', len(holes), {t: sum(1 for h in holes if h['tool'] == t) for t in sorted({h['tool'] for h in holes})})

# ---------------------------------------------------------------- board outline (flood fill of silkscreen outline)
sst_raw = load('sst') > 0.5
pad = 30
padded = np.pad(sst_raw, pad, constant_values=False)
lab, n = ndi.label(~padded)
outside = lab == lab[0, 0]
board = ~outside[pad:-pad, pad:-pad]
board = ndi.binary_erosion(board, iterations=4)          # half outline stroke
print('board px', board.sum(), 'expected ~', int(W_MM * H_MM * PX * PX * 0.985))

# outline polygon (for the 3D extrusion): trace contour on a coarse grid
def outline_polygon(mask, step=0.25):
    from skimage import measure  # noqa
    return None

try:
    from skimage import measure
    small = mask_small = ndi.zoom(board.astype(np.float32), 0.25, order=1)
    cs = measure.find_contours(small, 0.5)
    c = max(cs, key=len)
    poly = [(round(p[1] * 4 / PX, 3), round(H_MM - p[0] * 4 / PX, 3)) for p in c]
    # simplify: keep points that change direction
    simp = [poly[0]]
    for i in range(1, len(poly) - 1):
        ax, ay = simp[-1]; bx, by = poly[i]; cx, cy = poly[i + 1]
        cross = (bx - ax) * (cy - by) - (by - ay) * (cx - bx)
        if abs(cross) > 1e-4 or ((bx - ax) ** 2 + (by - ay) ** 2) > 4:
            simp.append(poly[i])
    outline = simp
except Exception as e:
    print('skimage unavailable', e)
    outline = []
print('outline points', len(outline))

edge_keep = ndi.binary_erosion(board, iterations=int(0.28 * PX))  # strip outline stroke from silk

def layers(side):
    cu = load('top' if side == 'top' else 'bot') > 0.5
    so = load('smt' if side == 'top' else 'smb') > 0.5    # soldermask openings
    sk = load('sst' if side == 'top' else 'ssb') > 0.5
    pa = load('pmt' if side == 'top' else 'pmb') > 0.5
    return cu & board, so & board, sk & edge_keep & ~so, pa & board

# ---------------------------------------------------------------- silkscreen labels that appear on the real board
FONT_MONO = 'C:/Windows/Fonts/consolab.ttf'
FONT_SANS = 'C:/Windows/Fonts/arialbd.ttf'

def stamp_text(mask, text, cx, cy, h_mm, rot=0, font=FONT_MONO, value=True):
    size = int(h_mm * PX * 1.32)
    f = ImageFont.truetype(font, size)
    bbox = f.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    img = Image.new('L', (tw + 20, th + 20), 0)
    ImageDraw.Draw(img).text((10 - bbox[0], 10 - bbox[1]), text, font=f, fill=255)
    if rot: img = img.rotate(rot, expand=True, resample=Image.BICUBIC)
    a = np.array(img) > 110
    px, py = to_px(cx, cy)
    r0, c0 = int(py - a.shape[0] / 2), int(px - a.shape[1] / 2)
    sub = mask[r0:r0 + a.shape[0], c0:c0 + a.shape[1]]
    if value: sub |= a[:sub.shape[0], :sub.shape[1]]
    else: sub &= ~a[:sub.shape[0], :sub.shape[1]]

def stamp_shape(mask, draw_fn, value=True):
    img = Image.new('L', (mask.shape[1], mask.shape[0]), 0)
    draw_fn(ImageDraw.Draw(img))
    a = np.array(img) > 127
    if value: mask |= a
    else: mask &= ~a

def mm(x, y):
    return to_px(x, y)

def arduino_logo(mask, cx, cy, w):
    """Arduino 'infinity' mark: two linked rounded loops with - and +."""
    h = w * 0.465                 # loop height
    ex = w * 0.27                 # loop half-width (loops overlap in the middle)
    ey = h / 2
    stroke = w * 0.095
    lx, rx = cx - w / 2 + ex, cx + w / 2 - ex
    r_out = ey
    def d(dr):
        for ox in (lx, rx):
            x0, y0 = mm(ox - ex, cy + ey); x1, y1 = mm(ox + ex, cy - ey)
            dr.ellipse([x0, y0, x1, y1], outline=255, width=int(stroke * PX))
        L = r_out * 0.95; t = stroke * 0.75
        # minus (left)
        x0, y0 = mm(lx - L / 2, cy + t / 2); x1, y1 = mm(lx + L / 2, cy - t / 2); dr.rectangle([x0, y0, x1, y1], fill=255)
        # plus (right)
        x0, y0 = mm(rx - L / 2, cy + t / 2); x1, y1 = mm(rx + L / 2, cy - t / 2); dr.rectangle([x0, y0, x1, y1], fill=255)
        x0, y0 = mm(rx - t / 2, cy + L / 2); x1, y1 = mm(rx + t / 2, cy - L / 2); dr.rectangle([x0, y0, x1, y1], fill=255)
    stamp_shape(mask, d)

def top_labels(sk):
    # positions measured from Arduino's official UNO Q product photos (datasheet ABX00162)
    stamp_text(sk, 'POWER', 6.3, 45.4, 0.95)
    stamp_text(sk, 'JCTL', 14.6, 40.2, 0.95)
    stamp_text(sk, 'ON', 4.95, 31.95, 0.95)
    stamp_text(sk, 'JSPI', 65.0, 32.75, 0.95)
    stamp_text(sk, 'QWIIC', 65.05, 18.55, 0.95)
    stamp_text(sk, 'QRB', 61.95, 43.6, 0.85, rot=90)
    stamp_text(sk, 'STM', 61.95, 47.3, 0.85, rot=90)
    for d, y in (('1', 42.45), ('2', 44.3), ('3', 46.25), ('4', 48.15)):
        stamp_text(sk, d, 63.55, y, 0.8, rot=90)
    arduino_logo(sk, 22.8, 28.35, 8.0)
    stamp_text(sk, 'ARDUINO', 22.75, 25.25, 1.15, font=FONT_SANS)
    stamp_text(sk, '\u00ae', 27.25, 30.2, 0.7, font=FONT_SANS)
    # UNO Q badge: outlined box with "UNO", filled box with knocked-out "Q"
    def badge(dr):
        x0, y0 = mm(18.15, 23.15); x1, y1 = mm(25.25, 20.55); dr.rectangle([x0, y0, x1, y1], outline=255, width=int(0.18 * PX))
        x0, y0 = mm(25.25, 23.15); x1, y1 = mm(27.35, 20.55); dr.rectangle([x0, y0, x1, y1], fill=255)
    stamp_shape(sk, badge)
    stamp_text(sk, 'UNO', 21.7, 21.85, 1.35)
    stamp_text(sk, 'Q', 26.3, 21.85, 1.35, value=False)

def bottom_labels(sk):
    # bottom view (as printed); text is mirrored in top-view coordinates
    def mir(mask_fn):
        tmp = np.zeros_like(sk); mask_fn(tmp); return tmp
    tmp = np.zeros_like(sk)
    # draw in a mirrored frame: x' = W - x, then flip horizontally
    arduino_logo(tmp, W_MM - 22.0, 36.5, 7.0)
    stamp_text(tmp, 'ARDUINO', W_MM - 22.0, 33.6, 1.05, font=FONT_SANS)
    stamp_text(tmp, 'UNO Q', W_MM - 22.0, 31.3, 1.3)
    stamp_text(tmp, 'Qualcomm', W_MM - 24.0, 26.0, 1.0, font=FONT_SANS)
    stamp_text(tmp, 'Dragonwing', W_MM - 24.0, 24.4, 0.9, font=FONT_SANS)
    sk |= tmp[:, ::-1]

# ---------------------------------------------------------------- composition
def srgb(c): return np.array(c, dtype=np.float32) / 255.0

C_LAM    = srgb((7, 22, 46))     # navy mask over bare laminate
C_CU     = srgb((13, 35, 69))     # navy mask over copper (slightly lighter)
C_GOLD   = srgb((214, 172, 94))   # ENIG pads
C_SOLDER = srgb((200, 202, 208))  # soldered pads
C_FR4    = srgb((150, 138, 92))
C_SILK   = srgb((236, 238, 234))
C_HOLE   = srgb((18, 18, 20))

rng = np.random.default_rng(7)

def lowfreq_noise(shape, scale, amp):
    small = rng.standard_normal((shape[0] // scale + 2, shape[1] // scale + 2)).astype(np.float32)
    big = ndi.zoom(small, scale, order=3)[:shape[0], :shape[1]]
    return big * amp

def build_side(side):
    cu, so, sk, pa = layers(side)
    if side == 'top': top_labels(sk)
    else: bottom_labels(sk)
    sk &= edge_keep & ~so
    shp = cu.shape
    cu_f = ndi.gaussian_filter(cu.astype(np.float32), 1.2)
    alb = C_LAM[None, None, :] * (1 - cu_f[..., None]) + C_CU[None, None, :] * cu_f[..., None]
    # copper edges under the mask catch light a little (mask thins on edges)
    edge = np.abs(ndi.gaussian_filter(cu.astype(np.float32), 2.5) - ndi.gaussian_filter(cu.astype(np.float32), 0.8))
    alb += edge[..., None] * srgb((10, 18, 26))[None, None, :]
    alb *= (1 + lowfreq_noise(shp, 64, 0.035))[..., None]
    exposed_cu = so & cu
    solder = exposed_cu & pa
    gold = exposed_cu & ~pa
    fr4 = so & ~cu
    rough = np.full(shp, 0.36, np.float32)
    metal = np.zeros(shp, np.float32)
    height = cu_f * 0.30
    for m, col, r, mt, hgt in ((fr4, C_FR4, 0.75, 0.0, 0.05), (gold, C_GOLD, 0.24, 1.0, 0.45), (solder, C_SOLDER, 0.18, 1.0, 0.85)):
        alb[m] = col
        rough[m] = r; metal[m] = mt; height[m] = hgt
    sk_f = ndi.gaussian_filter(sk.astype(np.float32), 0.7)
    alb = alb * (1 - sk_f[..., None]) + C_SILK[None, None, :] * sk_f[..., None]
    rough = rough * (1 - sk_f) + 0.85 * sk_f
    height = np.maximum(height, sk_f * 0.55)
    # holes (dark), plated rings already in copper/mask openings
    hole_mask = np.zeros(shp, bool)
    def dh(dr):
        for h in holes:
            px, py = to_px(h['x'], h['y']); r = h['d'] / 2 * PX
            if h['tool'] == '03' and side:   # tented micro vias show as tiny dimples, keep subtle
                continue
            dr.ellipse([px - r, py - r, px + r, py + r], fill=255)
    stamp_shape(hole_mask, dh)
    alb[hole_mask] = C_HOLE; metal[hole_mask] = 0; rough[hole_mask] = 0.9; height[hole_mask] = 0
    # vias: small darker dots
    via = np.zeros(shp, bool)
    def dv(dr):
        for h in holes:
            if h['tool'] != '03': continue
            px, py = to_px(h['x'], h['y']); r = 0.17 * PX
            dr.ellipse([px - r, py - r, px + r, py + r], fill=255)
    stamp_shape(via, dv)
    via &= ~so
    alb[via] *= 0.72
    height[via] = 0.12
    # outside the board: transparent-ish dark (never seen, geometry is clipped)
    alb[~board] = C_LAM
    out_w, out_h = int(W_MM * OUT_PX), int(H_MM * OUT_PX)
    def save(arr, name, mode='RGB', q=92):
        a = np.clip(arr, 0, 1)
        im = Image.fromarray((a * 255 + 0.5).astype(np.uint8), mode if a.ndim == 3 else 'L')
        im = im.resize((out_w, out_h), Image.LANCZOS)
        im.save(os.path.join(OUT, name), quality=q, subsampling=0)
    save(alb, f'pcb_{side}_albedo.jpg')
    orm = np.stack([np.ones(shp, np.float32), rough, metal], -1)
    save(orm, f'pcb_{side}_orm.jpg')
    save(ndi.gaussian_filter(height, 1.0), f'pcb_{side}_bump.jpg', q=90)
    print(side, 'textures saved', out_w, out_h)
    return cu, so, pa

top_layers = build_side('top')
bot_layers = build_side('bottom')

# ---------------------------------------------------------------- auto-detect SMD parts from the paste layer
# Big parts are modelled by hand from the official STEP model; skip pads inside these zones.
KEEP_OUT_TOP = [
    (26.8, 23.5, 41.8, 47.1),   # SoC + DRAM
    (48.9, 33.5, 56.0, 42.2),   # PMIC PM4125
    (13.8, 33.7, 18.3, 38.2),   # ANX7625
    (5.3, 5.6, 17.8, 22.1),     # Wi-Fi module
    (-1, 32.9, 8.2, 42.9),      # USB-C
    (1.6, 45.6, 10.2, 53.4),    # power button
    (11.8, 39.0, 25.2, 48.0),   # JCTL
    (16.8, 48.8, 65.6, 53.4),   # JDIGITAL
    (25.8, 0.0, 65.6, 4.4),     # JANALOG
    (61.8, 23.6, 68.6, 32.3),   # JSPI
    (63.2, 10.6, 68.7, 18.0),   # Qwiic
    (30.8, 3.9, 59.2, 21.2),    # LED matrix
    (23.2, 10.8, 30.1, 17.6),   # large inductor
    (64.2, 41.3, 65.9, 48.8),   # RGB LEDs
    (1.2, 30.5, 3.4, 31.9),     # power LED
    (13.2, 28.0, 16.6, 32.2),   # crystal (4-pad metal lid)
]
KEEP_OUT_BOT = [
    (40.2, 8.1, 47.8, 15.7),    # STM32U585
    (41.0, 19.2, 53.1, 32.8),   # eMMC
    (9.9, 7.1, 13.5, 46.3),     # JMEDIA
    (56.8, 7.1, 60.4, 46.3),    # JMISC
    (16.8, 48.8, 65.6, 53.4), (25.8, 0.0, 65.6, 4.4), (61.8, 23.6, 68.6, 32.3),
]

def detect_parts(paste, keepout):
    lab, n = ndi.label(paste)
    objs = ndi.find_objects(lab)
    pads = []
    for i, sl in enumerate(objs):
        r0, r1, c0, c1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        x0, x1 = c0 / PX, c1 / PX
        y1, y0 = H_MM - r0 / PX, H_MM - r1 / PX
        w, h = x1 - x0, y1 - y0
        if w < 0.08 or h < 0.08: continue
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        if any(a <= cx <= c and b <= cy <= d for a, b, c, d in keepout): continue
        pads.append([cx, cy, w, h])
    pads = np.array(pads)
    used = np.zeros(len(pads), bool)
    parts = []
    # 1) tightly packed pad groups (QFN/SOT/DFN pitch) -> IC bodies
    par = list(range(len(pads)))
    def fr(a):
        while par[a] != a:
            par[a] = par[par[a]]; a = par[a]
        return a
    for a in range(len(pads)):
        for b in range(a + 1, len(pads)):
            gx = abs(pads[a, 0] - pads[b, 0]) - (pads[a, 2] + pads[b, 2]) / 2
            gy = abs(pads[a, 1] - pads[b, 1]) - (pads[a, 3] + pads[b, 3]) / 2
            if max(gx, gy) < 0.26 and min(gx, gy) < 0.26:
                par[fr(a)] = fr(b)
    tight = {}
    for a in range(len(pads)): tight.setdefault(fr(a), []).append(a)
    for g in tight.values():
        if len(g) < 3: continue
        P = pads[g]
        x0 = (P[:, 0] - P[:, 2] / 2).min(); x1 = (P[:, 0] + P[:, 2] / 2).max()
        y0 = (P[:, 1] - P[:, 3] / 2).min(); y1 = (P[:, 1] + P[:, 3] / 2).max()
        area = (x1 - x0) * (y1 - y0)
        big_pad = (P[:, 2] * P[:, 3]).max() > 0.5
        if area > 30: continue
        if not big_pad and (len(g) > 12 or area > 6): continue   # dense passive arrays, not one chip
        if not big_pad and min(x1 - x0, y1 - y0) < 0.6: continue  # pads in a single row = passives
        used[g] = True
        parts.append({'t': 'ic', 'n': len(g), 'x': round((x0 + x1) / 2, 3), 'y': round((y0 + y1) / 2, 3), 'l': round(x1 - x0, 3), 'w': round(y1 - y0, 3), 'r': 0})
    # two-terminal passives: nearest similar pad aligned on one axis
    order = np.argsort(pads[:, 2] * pads[:, 3])
    for i in order:
        if used[i]: continue
        cx, cy, w, h = pads[i]
        best, bd = -1, 1e9
        for j in range(len(pads)):
            if j == i or used[j]: continue
            dx, dy = pads[j, 0] - cx, pads[j, 1] - cy
            w2, h2 = pads[j, 2], pads[j, 3]
            if abs(w2 - w) > 0.3 * max(w, w2) or abs(h2 - h) > 0.3 * max(h, h2): continue
            if abs(dy) < 0.15 * h and abs(dx) > 0 and abs(dx) < w + 1.3 * max(w, h) + 0.25:
                dist = abs(dx)
            elif abs(dx) < 0.15 * w and abs(dy) > 0 and abs(dy) < h + 1.3 * max(w, h) + 0.25:
                dist = abs(dy)
            else: continue
            if dist < bd: bd, best = dist, j
        if best >= 0:
            j = best
            used[i] = used[j] = True
            mx, my = (cx + pads[j, 0]) / 2, (cy + pads[j, 1]) / 2
            horiz = abs(pads[j, 0] - cx) > abs(pads[j, 1] - cy)
            if horiz:
                length = abs(pads[j, 0] - cx) + w * 0.55; width = h * 0.95
            else:
                length = abs(pads[j, 1] - cy) + h * 0.55; width = w * 0.95
            parts.append({'t': 'p', 'x': round(mx, 3), 'y': round(my, 3), 'l': round(length, 3), 'w': round(width, 3), 'r': 0 if horiz else 90})
    # remaining pads: cluster into ICs / transistors
    rest = [i for i in range(len(pads)) if not used[i]]
    if rest:
        pts = pads[rest]
        # union-find by proximity
        parent = list(range(len(pts)))
        def f(a):
            while parent[a] != a:
                parent[a] = parent[parent[a]]; a = parent[a]
            return a
        for a in range(len(pts)):
            for b in range(a + 1, len(pts)):
                gx = abs(pts[a, 0] - pts[b, 0]) - (pts[a, 2] + pts[b, 2]) / 2
                gy = abs(pts[a, 1] - pts[b, 1]) - (pts[a, 3] + pts[b, 3]) / 2
                if max(gx, gy) < 0.55:
                    parent[f(a)] = f(b)
        groups = {}
        for a in range(len(pts)): groups.setdefault(f(a), []).append(a)
        for g in groups.values():
            P = pts[g]
            x0 = (P[:, 0] - P[:, 2] / 2).min(); x1 = (P[:, 0] + P[:, 2] / 2).max()
            y0 = (P[:, 1] - P[:, 3] / 2).min(); y1 = (P[:, 1] + P[:, 3] / 2).max()
            if len(g) == 1:
                parts.append({'t': 'pad', 'x': round(float(P[0, 0]), 3), 'y': round(float(P[0, 1]), 3), 'l': round(float(P[0, 2]), 3), 'w': round(float(P[0, 3]), 3), 'r': 0})
                continue
            parts.append({'t': 'ic', 'n': len(g), 'x': round((x0 + x1) / 2, 3), 'y': round((y0 + y1) / 2, 3), 'l': round(x1 - x0, 3), 'w': round(y1 - y0, 3), 'r': 0})
    return parts

parts_top = detect_parts(top_layers[2], KEEP_OUT_TOP)
parts_bot = detect_parts(bot_layers[2], KEEP_OUT_BOT)
print('parts top', len(parts_top), 'bottom', len(parts_bot))

# header / connector holes for pin placement
data = {
    'source': 'Arduino UNO Q (ABX00162) official CAD files, CC BY-SA 4.0',
    'size': [W_MM, H_MM],
    'outline': outline,
    'holes': [h for h in holes if h['tool'] != '03'],
    'vias': len([h for h in holes if h['tool'] == '03']),
    'partsTop': parts_top,
    'partsBottom': parts_bot,
}
json.dump(data, open(os.path.join(OUT, 'board_data.json'), 'w'), separators=(',', ':'))
print('saved board_data.json')

# debug preview
prev = Image.open(os.path.join(OUT, 'pcb_top_albedo.jpg'))
prev.resize((1600, int(1600 * H_MM / W_MM))).save(os.path.join(OUT, '..', 'tools', '_preview_top.jpg'))

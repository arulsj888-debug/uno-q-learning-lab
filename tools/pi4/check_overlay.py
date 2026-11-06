import sys
from PIL import Image, ImageDraw
ppm = 36.0; X0, Y1 = -4.0, 60.0
P = lambda x, y: ((x - X0) * ppm, (Y1 - y) * ppm)
im = Image.open(sys.argv[1]).convert('RGB'); d = ImageDraw.Draw(im)
def rect(x0, y0, x1, y1, c=(255, 0, 255)):
    a, b = P(x0, y1), P(x1, y0); d.rectangle([a, b], outline=c, width=3)
# board outline (rounded corners drawn as a plain rectangle + corner arcs)
d.rounded_rectangle([P(0, 56), P(85, 0)], radius=3 * ppm, outline=(255, 0, 0), width=3)
for x, y in [(3.5, 3.5), (61.5, 3.5), (3.5, 52.5), (61.5, 52.5)]:
    cx, cy = P(x, y); r = 1.35 * ppm; d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 0, 0), width=3)
# dimensioned centres from the official drawing
for name, x, y in [('USB-C', 11.2, 0), ('HDMI0', 26.0, 0), ('HDMI1', 39.5, 0), ('GPIO', 32.5, 52.5), ('SoC', 29.25, 32.5), ('PoE', 61.5, 46.36), ('ETH', 85, 45.75), ('USB3', 85, 27), ('USB2', 85, 9)]:
    cx, cy = P(x, y); d.line([cx - 30, cy, cx + 30, cy], fill=(0, 255, 255), width=3); d.line([cx, cy - 30, cx, cy + 30], fill=(0, 255, 255), width=3)
# GPIO header pin grid: 2 x 20 at 2.54 mm, centred on (32.5, 52.5)
for i in range(20):
    for j in range(2):
        cx, cy = P(32.5 + (i - 9.5) * 2.54, 52.5 + (j - 0.5) * 2.54); d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=(255, 0, 255))
im.save(sys.argv[2], quality=85)
t = im.copy(); t.thumbnail((1500, 1100)); t.save(sys.argv[2].replace('.jpg', '_s.jpg'))

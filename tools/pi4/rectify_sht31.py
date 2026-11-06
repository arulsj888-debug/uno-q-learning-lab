import os, json, numpy as np
from PIL import Image, ImageDraw
W = os.path.join(os.environ['TEMP'], 'shtwork')
src = os.path.join(os.environ['TEMP'], 'pi4src', 'sht', 'a2857.jpg')
holes_px = np.load(os.path.join(W, 'holes.npy'))[:, :2]
holes_mm = np.array([(2.54, 15.24), (22.86, 15.24), (2.54, 2.54), (22.86, 2.54)])
PPM = 60.0; X0, X1, Y0, Y1 = -1.0, 26.4, -1.0, 18.78
Wo, Ho = int(round((X1 - X0) * PPM)), int(round((Y1 - Y0) * PPM))
def H(a, b):
    A = []
    for (x, y), (u, v) in zip(a, b):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y, -u]); A.append([0, 0, 0, x, y, 1, -v * x, -v * y, -v])
    h = np.linalg.svd(np.array(A))[2][-1].reshape(3, 3); return h / h[2, 2]
out_px = np.array([[(x - X0) * PPM, (Y1 - y) * PPM] for x, y in holes_mm])
Hm = H(out_px, holes_px)
im = Image.open(src).convert('RGB')
res = im.transform((Wo, Ho), Image.PERSPECTIVE, tuple(Hm.flatten()[:8]), resample=Image.BICUBIC, fillcolor=(30, 30, 30))
res.save(os.path.join(W, 'sht_top.jpg'), quality=92)
# overlay check: outline, holes, header pads, slot, connector bodies (all from the .brd)
d = ImageDraw.Draw(res); P = lambda x, y: ((x - X0) * PPM, (Y1 - y) * PPM)
d.rounded_rectangle([P(0, 17.78), P(25.4, 0)], radius=2.54 * PPM, outline=(255, 0, 255), width=3)
for (x, y), r in [((2.54, 15.24), 1.25), ((22.86, 15.24), 1.25), ((2.54, 2.54), 1.27), ((22.86, 2.54), 1.27)]:
    a, b = P(x - r, y + r), P(x + r, y - r); d.ellipse([a, b], outline=(0, 255, 255), width=3)
for i in range(7):
    x = 5.08 + i * 2.54; a, b = P(x - 0.5, 2.54 + 0.5), P(x + 0.5, 2.54 - 0.5); d.ellipse([a, b], outline=(255, 255, 0), width=3)
d.rectangle([P(8.4455, 13.1445), P(16.9545, 7.1755)], outline=(255, 0, 0), width=2)
d.rectangle([P(20.63, 11.99), P(24.88, 5.89)], outline=(0, 255, 0), width=2)
d.rectangle([P(0.52, 11.89), P(4.77, 5.79)], outline=(0, 255, 0), width=2)
d.rectangle([P(12.7635 - 1.25, 10.3505 + 1.25), P(12.7635 + 1.25, 10.3505 - 1.25)], outline=(255, 128, 0), width=2)
res.save(os.path.join(W, 'sht_check.jpg'), quality=85)
print(Wo, Ho)

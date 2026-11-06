# Rectify a photo of the Raspberry Pi 4 Model B onto the board's millimetre grid using the four mounting holes.
# Mounting-hole centres from the official mechanical drawing: 3.5 mm from the edges, 58 mm x 49 mm apart.
# Output covers x = -4 .. 89 mm, y = -4 .. 60 mm (board 85 x 56 + room for overhanging connectors), y up.
import sys, numpy as np
from PIL import Image
src, holes_px, holes_mm, out, ppm = sys.argv[1], np.load(sys.argv[2]), np.array(eval(sys.argv[3]), float), sys.argv[4], float(sys.argv[5])
X0, X1, Y0, Y1 = -4.0, 89.0, -4.0, 60.0
Wo, Ho = int(round((X1 - X0) * ppm)), int(round((Y1 - Y0) * ppm))
def homog(a, b):          # maps points a -> b
    A = []
    for (x, y), (u, v) in zip(a, b):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y, -u]); A.append([0, 0, 0, x, y, 1, -v * x, -v * y, -v])
    _, _, vt = np.linalg.svd(np.array(A)); h = vt[-1].reshape(3, 3); return h / h[2, 2]
# output pixel (u, v) -> mm (x, y) -> photo px
out_px = np.array([[(x - X0) * ppm, (Y1 - y) * ppm] for x, y in holes_mm])
Hm = homog(out_px, holes_px[:, :2])
# check: residuals and scale
for (u, v), (px, py) in zip(out_px, holes_px[:, :2]):
    q = Hm @ [u, v, 1]; print('residual px', round(q[0] / q[2] - px, 2), round(q[1] / q[2] - py, 2))
im = Image.open(src).convert('RGB')
coef = (Hm / Hm[2, 2]).flatten()[:8]
res = im.transform((Wo, Ho), Image.PERSPECTIVE, tuple(coef), resample=Image.BICUBIC, fillcolor=(236, 236, 232))
res.save(out, quality=90, subsampling=0, optimize=True)
print(out, res.size)

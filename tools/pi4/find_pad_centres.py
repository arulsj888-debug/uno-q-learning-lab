import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
im = np.asarray(Image.open(sys.argv[1]).convert('HSV')).astype(np.float32)
Hh, S, V = im[..., 0], im[..., 1], im[..., 2]
yellow = (Hh > 28) & (Hh < 50) & (S > 110) & (V > 120)       # PIL hue 0..255: yellow ~ 40
est = eval(sys.argv[2]); out = []
for k, (cx, cy) in enumerate(est):
    r = 150; x0, y0 = cx - r, cy - r
    m = ndi.binary_fill_holes(ndi.binary_closing(yellow[y0:cy + r, x0:cx + r], iterations=3))
    lab, n = ndi.label(m); sizes = ndi.sum(m, lab, range(1, n + 1)); i = int(np.argmax(sizes)) + 1
    ys, xs = np.nonzero(lab == i)
    # centre of the outer ellipse = mid of extreme points (robust to the filled interior)
    c = ((xs.min() + xs.max()) / 2 + x0, (ys.min() + ys.max()) / 2 + y0)
    print(k, 'pad', tuple(round(v, 1) for v in c), 'size', xs.max() - xs.min(), ys.max() - ys.min(), 'area', len(xs))
    out.append(c)
np.save(sys.argv[3], np.array(out))

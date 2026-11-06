import sys, numpy as np
from PIL import Image
from skimage.feature import canny
from skimage.transform import hough_circle, hough_circle_peaks
im = np.asarray(Image.open(sys.argv[1]).convert('L')).astype(np.float32) / 255
H, W = im.shape; s = W / 1400.0
est = eval(sys.argv[2]) if len(sys.argv) > 2 else [(62, 60), (945, 62), (62, 860), (944, 862)]
radii = np.arange(int(sys.argv[3]) if len(sys.argv) > 3 else 45, int(sys.argv[4]) if len(sys.argv) > 4 else 80, 1)
out = []
for k, (ex, ey) in enumerate(est):
    cx, cy = int(ex * s), int(ey * s); r = 230
    x0, y0 = max(0, cx - r), max(0, cy - r); x1, y1 = min(W, cx + r), min(H, cy + r)
    crop = im[y0:y1, x0:x1]
    ed = canny(crop, sigma=2.5, low_threshold=0.04, high_threshold=0.12)
    hs = hough_circle(ed, radii)
    acc, xs, ys, rs = hough_circle_peaks(hs, radii, total_num_peaks=3)
    for a, x, y, rr in zip(acc, xs, ys, rs): print(k, 'acc', round(float(a), 3), 'centre', (x + x0, y + y0), 'r', rr)
    out.append((xs[0] + x0, ys[0] + y0, rs[0]))
np.save(sys.argv[5] if len(sys.argv) > 5 else 'holes.npy', np.array(out, dtype=float))

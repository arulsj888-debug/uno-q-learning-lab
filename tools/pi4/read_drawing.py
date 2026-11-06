import pymupdf, json, sys
d = pymupdf.open(sys.argv[1]); pg = d[0]
paths = pg.get_drawings()
rects = []
for p in paths:
    for it in p['items']:
        if it[0] == 're': rects.append(it[1])
    # closed polylines made of 4 lines -> rectangle bbox
    if all(it[0] == 'l' for it in p['items']) and len(p['items']) in (4, 5):
        r = p['rect']; rects.append(r)
# words with positions (dimension values, Z labels)
words = pg.get_text('words')
print('paths', len(paths), 'rects', len(rects))
# find board outline: largest rect-ish path bbox with aspect ~85/56
cand = sorted([p['rect'] for p in paths], key=lambda r: -r.width * r.height)[:8]
for r in cand: print('big', [round(v, 1) for v in (r.x0, r.y0, r.x1, r.y1)], round(r.width / max(r.height, 1e-6), 3))
json.dump({'rects': [[r.x0, r.y0, r.x1, r.y1] for r in rects], 'paths': [[p['rect'].x0, p['rect'].y0, p['rect'].x1, p['rect'].y1, len(p['items'])] for p in paths], 'words': [[w[0], w[1], w[2], w[3], w[4]] for w in words]}, open('drawing.json', 'w'))

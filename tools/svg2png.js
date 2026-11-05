const fs = require('fs'), path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const [,, DIR, PXMM] = process.argv;
const pxmm = +PXMM || 60;
const W = 53340, H = 68580; // gerber units (um)
for (const id of ['top','bot','smt','smb','sst','ssb','pmt','pmb']) {
  let svg = fs.readFileSync(path.join(DIR, id + '.svg'), 'utf8');
  svg = svg.replace(/width="[^"]*" height="[^"]*" viewBox="[^"]*"/, `width="${Math.round(W/1000*pxmm)}" height="${Math.round(H/1000*pxmm)}" viewBox="0 0 ${W} ${H}"`);
  svg = svg.replace(/<g transform="translate\(0,[^)]*\) scale\(1,-1\)"/, `<g transform="translate(0,${H}) scale(1,-1)"`);
  svg = svg.replace('color="#000"', 'color="#fff"');
  svg = svg.replace(/(<svg[^>]*>)/, `$1<rect x="-10000" y="-10000" width="100000" height="100000" fill="#000"/>`);
  const r = new Resvg(svg, { background: '#000', fitTo: { mode: 'original' } });
  const png = r.render().asPng();
  fs.writeFileSync(path.join(DIR, id + '.png'), png);
  console.log(id, png.length);
}

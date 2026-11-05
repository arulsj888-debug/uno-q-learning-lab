// Convert each gerber/drill layer to an SVG (gerber units = mm * 1000 in viewBox)
const fs = require('fs'), path = require('path');
const gerberToSvg = require('gerber-to-svg');
const [,, G, OUT] = process.argv;
const layers = {
  top: 'top.art', bot: 'bot.art', smt: 'smt.art', smb: 'smb.art', sst: 'sst.art', ssb: 'ssb.art',
  pmt: 'pmt.art', pmb: 'pmb.art', drl: '48DMVQAD1_SGB-20250729a4-1-8.drl',
  v12: '48DMVQAD1_SGB-20250729a4-1-2.drl', v78: '48DMVQAD1_SGB-20250729a4-7-8.drl', rou: '48DMVQAD1_SGB-20250729a4_1-8.rou'
};
let pending = Object.keys(layers).length;
for (const [id, fn] of Object.entries(layers)) {
  const isDrill = /\.(drl|rou)$/.test(fn);
  const opts = { id, attributes: { color: '#000' } };
  if (isDrill) opts.filetype = 'drill';
  const conv = gerberToSvg(fs.createReadStream(path.join(G, fn)), opts, (err, svg) => {
    if (err) console.error(id, 'ERR', err.message);
    else { fs.writeFileSync(path.join(OUT, id + '.svg'), svg); console.log(id, svg.length, svg.slice(0, 300).replace(/\s+/g,' ')); }
    if (--pending === 0) console.log('done');
  });
  conv.on('warning', w => {});
}

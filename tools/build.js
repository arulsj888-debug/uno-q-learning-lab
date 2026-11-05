// Bundles src/ into one self-contained HTML file (works by double-clicking, no server needed).
//   npm run build   ->   UNO-Q-Learning-Lab.html
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');

(async () => {
  const t0 = Date.now();
  const result = await esbuild.build({
    entryPoints: [path.join(src, 'main.js')],
    bundle: true,
    format: 'iife',
    minify: true,
    target: ['chrome110', 'edge110', 'firefox115', 'safari16'],
    loader: { '.jpg': 'dataurl', '.png': 'dataurl', '.json': 'json' },
    write: false,
    legalComments: 'none',
  });
  const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const css = fs.readFileSync(path.join(src, 'style.css'), 'utf8');
  let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
  html = html.replace('<link rel="stylesheet" href="./style.css">', () => `<style>\n${css}\n</style>`);
  html = html.replace('<script type="module" src="./main.js"></script>', () => `<script>\n${js}\n</script>`);
  const out = path.join(root, 'UNO-Q-Learning-Lab.html');
  fs.writeFileSync(out, html);
  // copy for web hosting (Vercel serves dist/index.html)
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(root, 'dist', 'index.html'), html);
  console.log(`built ${path.basename(out)}  ${(html.length / 1e6).toFixed(2)} MB  in ${Date.now() - t0} ms`);
})().catch(e => { console.error(e); process.exit(1); });

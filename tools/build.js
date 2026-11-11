// Bundles src/ into HTML files.
//   npm run build   ->   UNO-Q-Learning-Lab.html   one self-contained file (works by double-clicking, no server needed, all images inside)
//                        dist/index.html + dist/img/*.jpg   the web version for Vercel: the board textures are separate files,
//                        so a student only downloads the textures of the board they open (not all four boards)
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');

const common = {
  entryPoints: [path.join(src, 'main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['chrome110', 'edge110', 'firefox115', 'safari16'],
  write: false,
  legalComments: 'none',
};

function page(js) {
  const css = fs.readFileSync(path.join(src, 'style.css'), 'utf8');
  let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
  html = html.replace('<link rel="stylesheet" href="./style.css">', () => `<style>\n${css}\n</style>`);
  html = html.replace('<script type="module" src="./main.js"></script>', () => `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`);
  return html;
}

(async () => {
  const t0 = Date.now();
  // 1) single file, images inlined
  const one = await esbuild.build({ ...common, loader: { '.jpg': 'dataurl', '.png': 'dataurl', '.json': 'json' } });
  const html = page(one.outputFiles[0].text);
  const out = path.join(root, 'UNO-Q-Learning-Lab.html');
  fs.writeFileSync(out, html);

  // 2) web version: images as separate hashed files (cached by the browser, loaded only when the board needs them)
  fs.rmSync(path.join(dist, 'img'), { recursive: true, force: true });
  fs.mkdirSync(path.join(dist, 'img'), { recursive: true });
  const web = await esbuild.build({ ...common, outdir: dist, assetNames: 'img/[name]-[hash]', loader: { '.jpg': 'file', '.png': 'file', '.json': 'json' } });
  let js = null, files = 0;
  for (const f of web.outputFiles) {
    if (f.path.endsWith('.js')) js = f.text;
    else { fs.mkdirSync(path.dirname(f.path), { recursive: true }); fs.writeFileSync(f.path, f.contents); files++; }
  }
  const webHtml = page(js);
  fs.writeFileSync(path.join(dist, 'index.html'), webHtml);
  console.log(`built ${path.basename(out)}  ${(html.length / 1e6).toFixed(2)} MB (one file)  |  dist/index.html ${(webHtml.length / 1e6).toFixed(2)} MB + ${files} images  in ${Date.now() - t0} ms`);
})().catch(e => { console.error(e); process.exit(1); });

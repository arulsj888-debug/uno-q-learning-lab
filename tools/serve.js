const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const srcDir = path.join(root, 'src');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// Auto-rebuild on file change in src/
let rebuilding = false;
let pendingRebuild = false;

function triggerBuild() {
  if (rebuilding) { pendingRebuild = true; return; }
  rebuilding = true;
  exec('node tools/build.js', { cwd: root }, (err, stdout, stderr) => {
    rebuilding = false;
    if (err) console.error('Build error:', stderr);
    else console.log(`⚡ Rebuilt automatically: ${stdout.trim()}`);
    if (pendingRebuild) {
      pendingRebuild = false;
      triggerBuild();
    }
  });
}

// Watch src directory
try {
  fs.watch(srcDir, { recursive: true }, (event, filename) => {
    if (filename) triggerBuild();
  });
} catch (e) {
  // fallback if recursive watch not supported
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n🚀 UNO Q Dev Server running at: ${url}`);
  console.log(`👀 Watching src/ for changes (auto-rebuilding live)`);
  console.log(`Press Ctrl+C to stop.\n`);
  exec(`start ${url}`);
});

// Shared physically based materials and procedural canvas textures.
import * as THREE from 'three';

export const M = {};

export function initMaterials(renderer) {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  M.aniso = aniso;
  M.blackPlastic = new THREE.MeshStandardMaterial({ color: 0x151516, roughness: 0.55, metalness: 0 });
  M.darkPlastic = new THREE.MeshStandardMaterial({ color: 0x232325, roughness: 0.6, metalness: 0 });
  M.whiteNylon = new THREE.MeshStandardMaterial({ color: 0xeeece3, roughness: 0.62, metalness: 0 });
  M.btnWhite = new THREE.MeshStandardMaterial({ color: 0xf4f6f6, roughness: 0.45, metalness: 0 });
  M.steel = new THREE.MeshStandardMaterial({ color: 0xc9c8c4, roughness: 0.26, metalness: 1 });
  M.steelSatin = new THREE.MeshStandardMaterial({ color: 0xdedcd6, roughness: 0.38, metalness: 1 });
  M.nickel = new THREE.MeshStandardMaterial({ color: 0xb9b6ae, roughness: 0.3, metalness: 1 });
  M.tin = new THREE.MeshStandardMaterial({ color: 0xd3d5d8, roughness: 0.28, metalness: 1 });
  M.gold = new THREE.MeshStandardMaterial({ color: 0xe0b45a, roughness: 0.22, metalness: 1 });
  M.solder = new THREE.MeshStandardMaterial({ color: 0xcfd1d6, roughness: 0.16, metalness: 1 });
  M.pcbEdge = new THREE.MeshStandardMaterial({ color: 0x7d6c45, roughness: 0.75, metalness: 0 });
  M.chipDark = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.55, metalness: 0 });
  M.ceramicA = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0 });
  M.capEnd = new THREE.MeshStandardMaterial({ color: 0xc8c9cc, roughness: 0.3, metalness: 1 });
  M.ledBody = new THREE.MeshPhysicalMaterial({ color: 0xd9d6cc, roughness: 0.35, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.25 });
  M.ledBase = new THREE.MeshStandardMaterial({ color: 0xe9e6dc, roughness: 0.5 });
  M.inductor = new THREE.MeshStandardMaterial({ color: 0x8e9194, roughness: 0.42, metalness: 0.65 });
  M.invisible = new THREE.MeshBasicMaterial({ visible: false });
  return M;
}

// ---------------------------------------------------------------- canvas helpers
export function canvasTex(w, h, draw, { srgb = true, repeat = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = M.aniso || 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.needsUpdate = true;
  return t;
}

export function noise(g, w, h, amount = 10, alpha = 0.08) {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}

/**
 * IC package top with laser-etched marking.
 * lines: [{t:'text', s: size(0..1 of h), y: 0..1, f: font family, w: weight}]
 */
export function chipTopTexture({ w = 512, h = 512, base = '#3d4044', ink = 'rgba(205,210,214,0.55)', lines = [], rot = 0, dot = null }) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    noise(g, w, h, 9);
    g.save();
    g.translate(w / 2, h / 2);
    g.rotate(rot);
    const W = (rot % Math.PI) ? h : w, H = (rot % Math.PI) ? w : h;
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const L of lines) {
      g.font = `${L.w || 500} ${Math.round(L.s * H)}px ${L.f || 'Arial, Helvetica, sans-serif'}`;
      if (L.ls) g.letterSpacing = L.ls + 'px';
      g.fillText(L.t, (L.x ?? 0.5) * W - W / 2, L.y * H - H / 2);
    }
    g.restore();
    if (dot) {
      g.fillStyle = 'rgba(20,20,22,0.85)';
      g.beginPath(); g.arc(dot[0] * w, dot[1] * h, dot[2] * w, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2; g.stroke();
    }
  });
}

export function makeMat(opts) {
  return new THREE.MeshStandardMaterial(opts);
}

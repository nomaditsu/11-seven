// Procedural surface textures for the building, street and props.
import * as THREE from 'three';
import { makeCanvas } from './draw.js';
import { rng, clamp, lerp, hex2rgb } from '../core/util.js';

let maxAniso = 4;
export function setMaxAniso(n) { maxAniso = n; }

export function canvasTex(canvas, { srgb = true, repeat = null, aniso = 8, wrap = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (wrap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = Math.min(aniso, maxAniso);
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  return t;
}

// ---- value noise ----------------------------------------------------------------------------
function makeNoise(seed = 1) {
  const r = rng(seed);
  const N = 256, perm = new Uint8Array(N * 2), vals = new Float32Array(N);
  for (let i = 0; i < N; i++) { perm[i] = i; vals[i] = r(); }
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < N; i++) perm[i + N] = perm[i];
  const at = (x, y) => vals[perm[(x & 255) + perm[y & 255]]];
  const smooth = (t) => t * t * (3 - 2 * t);
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
    return lerp(lerp(at(xi, yi), at(xi + 1, yi), xf), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), xf), yf);
  };
  noise.fbm = (x, y, oct = 4) => {
    let a = 0.5, s = 0, f = 1;
    for (let i = 0; i < oct; i++) { s += a * noise(x * f, y * f); f *= 2; a *= 0.5; }
    return s;
  };
  return noise;
}

// ---- interior ---------------------------------------------------------------------------------
// Large-format porcelain floor tiles: 2x2 tiles per texture (each 0.6 m) => texture covers 1.2 m.
export function floorTiles() {
  const S = 1024, { canvas, ctx } = makeCanvas(S, S);
  const rc = makeCanvas(S, S);
  const img = ctx.createImageData(S, S), rimg = rc.ctx.createImageData(S, S);
  const n = makeNoise(11), rnd = rng(5);
  const tileTone = [0, 1, 2, 3].map(() => rnd() * 0.05 - 0.025);
  const T = S / 2, gw = 5;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const tx = x >= T ? 1 : 0, ty = y >= T ? 1 : 0;
      const u = x % T, v = y % T;
      const edge = Math.min(u, v, T - 1 - u, T - 1 - v);
      const i = (y * S + x) * 4;
      let g = 0.83 + tileTone[ty * 2 + tx] + (n.fbm(x / 90, y / 90, 3) - 0.5) * 0.06 + (rnd() - 0.5) * 0.035;
      if (n(x / 3, y / 3) > 0.86) g -= 0.05; // granite flecks
      let rough = 0.28 + n.fbm(x / 60 + 9, y / 60, 3) * 0.16;
      if (edge < gw) { g = 0.56 + (rnd() - 0.5) * 0.03; rough = 0.92; }
      else if (edge < gw + 3) g *= 0.955;
      img.data[i] = clamp(g * 255 + 4, 0, 255); img.data[i + 1] = clamp(g * 252, 0, 255); img.data[i + 2] = clamp(g * 243, 0, 255); img.data[i + 3] = 255;
      const rv = clamp(rough * 255, 0, 255);
      rimg.data[i] = rv; rimg.data[i + 1] = rv; rimg.data[i + 2] = rv; rimg.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0); rc.ctx.putImageData(rimg, 0, 0);
  return { map: canvasTex(canvas, { aniso: 16 }), rough: canvasTex(rc.canvas, { srgb: false, aniso: 16 }) };
}

// Suspended ceiling: 2x2 mineral-fibre tiles with a white T-bar grid (each tile 0.6 m).
export function ceilingTiles() {
  const S = 512, { canvas, ctx } = makeCanvas(S, S), r = rng(21);
  ctx.fillStyle = '#ecece8'; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(120,120,110,.18)' : 'rgba(255,255,255,.35)';
    const s = 1 + r() * 2.5; ctx.fillRect(r() * S, r() * S, s, s * (0.4 + r()));
  }
  ctx.fillStyle = '#f7f7f5';
  const g = 7;
  ctx.fillRect(0, 0, S, g); ctx.fillRect(0, S / 2 - g / 2, S, g); ctx.fillRect(0, S - g, S, g);
  ctx.fillRect(0, 0, g, S); ctx.fillRect(S / 2 - g / 2, 0, g, S); ctx.fillRect(S - g, 0, g, S);
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.fillRect(0, g, S, 2); ctx.fillRect(0, S / 2 + g / 2, S, 2); ctx.fillRect(g, 0, 2, S); ctx.fillRect(S / 2 + g / 2, 0, 2, S);
  return canvasTex(canvas, { aniso: 8 });
}

export function wallPaint(base = '#efeee9', seed = 3) {
  const S = 256, { canvas, ctx } = makeCanvas(S, S), r = rng(seed), n = makeNoise(seed);
  const [br, bg, bb] = hex2rgb(base);
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4, k = 0.965 + (n.fbm(x / 40, y / 40, 3) - 0.5) * 0.06 + (r() - 0.5) * 0.02;
    img.data[i] = br * k; img.data[i + 1] = bg * k; img.data[i + 2] = bb * k; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvasTex(canvas, { aniso: 4 });
}

// Perforated steel back panel of a gondola (1-inch hole grid). Texture covers 0.3048 m square.
export function pegboard(base = '#e9ebec') {
  const S = 256, { canvas, ctx } = makeCanvas(S, S);
  ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);
  const step = S / 6;
  for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) {
    const cx = step * (i + 0.5), cy = step * (j + 0.5);
    ctx.fillStyle = 'rgba(20,20,24,.78)'; ctx.beginPath(); ctx.arc(cx, cy, step * 0.11, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(cx - 0.5, cy + step * 0.115, step * 0.08, 0, 3.14); ctx.fill();
  }
  return canvasTex(canvas, { aniso: 8 });
}

// Dark speckled granite (counter tops)
export function granite(base = '#2b2c30') {
  const S = 512, { canvas, ctx } = makeCanvas(S, S), r = rng(17);
  ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 6000; i++) {
    const t = r();
    ctx.fillStyle = t > 0.66 ? 'rgba(210,210,215,.5)' : t > 0.33 ? 'rgba(120,125,140,.45)' : 'rgba(0,0,0,.35)';
    const s = 0.8 + r() * 2.4; ctx.fillRect(r() * S, r() * S, s, s);
  }
  return canvasTex(canvas, { aniso: 8 });
}

// White laminate with a very faint texture
export function laminate(base = '#f4f4f2') {
  const S = 128, { canvas, ctx } = makeCanvas(S, S), r = rng(8);
  ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 500; i++) { ctx.fillStyle = `rgba(0,0,0,${r() * 0.03})`; ctx.fillRect(r() * S, r() * S, 2, 2); }
  return canvasTex(canvas, { aniso: 4 });
}

// Brushed stainless steel
export function brushed(base = '#b9bcc0') {
  const S = 256, { canvas, ctx } = makeCanvas(S, S), r = rng(4);
  ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.08)';
    ctx.fillRect(r() * S, r() * S, 20 + r() * 80, 1);
  }
  return canvasTex(canvas, { aniso: 4 });
}

// Woven black rubber door mat base (logo is drawn separately)
export function rubberMat() {
  const S = 256, { canvas, ctx } = makeCanvas(S, S), r = rng(2);
  ctx.fillStyle = '#26272a'; ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 8) { ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(0, y, S, 2); }
  for (let i = 0; i < 400; i++) { ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(r() * S, r() * S, 2, 2); }
  return canvasTex(canvas);
}

// ---- outdoor ----------------------------------------------------------------------------------
// Concrete paver sidewalk. Texture covers 1.2 m (4x4 pavers of 0.3 m).
export function pavers() {
  const S = 1024, { canvas, ctx } = makeCanvas(S, S);
  const img = ctx.createImageData(S, S), n = makeNoise(31), r = rng(31);
  const P = S / 4, jw = 5;
  const tone = Array.from({ length: 16 }, () => (r() - 0.5) * 0.08);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4;
    const px = Math.floor(x / P), py = Math.floor(y / P), u = x % P, v = y % P;
    const edge = Math.min(u, v, P - 1 - u, P - 1 - v);
    let g = 0.6 + tone[py * 4 + px] + (n.fbm(x / 70, y / 70, 4) - 0.5) * 0.14 + (r() - 0.5) * 0.06;
    if (edge < jw) g = 0.32 + (r() - 0.5) * 0.06;
    else if (edge < jw + 4) g *= 0.92;
    img.data[i] = clamp(g * 255 + 8, 0, 255); img.data[i + 1] = clamp(g * 250, 0, 255); img.data[i + 2] = clamp(g * 240 - 4, 0, 255); img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // stains & chewing gum
  for (let i = 0; i < 9; i++) {
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 30 + r() * 70);
    g.addColorStop(0, 'rgba(50,40,30,.28)'); g.addColorStop(1, 'rgba(50,40,30,0)');
    ctx.save(); ctx.translate(r() * S, r() * S); ctx.scale(1, 0.5 + r()); ctx.fillStyle = g; ctx.fillRect(-100, -100, 200, 200); ctx.restore();
  }
  for (let i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(70,64,60,.55)'; ctx.beginPath(); ctx.arc(r() * S, r() * S, 2 + r() * 2, 0, 6.3); ctx.fill(); }
  return canvasTex(canvas, { aniso: 16 });
}

export function asphalt() {
  const S = 1024, { canvas, ctx } = makeCanvas(S, S);
  const img = ctx.createImageData(S, S), n = makeNoise(41), r = rng(41);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4;
    let g = 0.24 + (n.fbm(x / 80, y / 80, 4) - 0.5) * 0.09 + (r() - 0.5) * 0.06;
    if (r() > 0.985) g += 0.14 + r() * 0.1;
    img.data[i] = clamp(g * 255 + 2, 0, 255); img.data[i + 1] = clamp(g * 255, 0, 255); img.data[i + 2] = clamp(g * 255 + 2, 0, 255); img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = 'rgba(8,8,8,.55)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); let x = r() * S, y = r() * S; ctx.moveTo(x, y);
    for (let k = 0; k < 14; k++) { x += (r() - 0.5) * 60; y += (r() - 0.3) * 40; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) { // oil patches
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 40 + r() * 50);
    g.addColorStop(0, 'rgba(0,0,0,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.translate(r() * S, r() * S); ctx.scale(1.4, 0.7); ctx.fillStyle = g; ctx.fillRect(-100, -100, 200, 200); ctx.restore();
  }
  return canvasTex(canvas, { aniso: 16 });
}

// Weathered painted concrete wall (Bangkok humidity streaks). Tile covers 2 m.
export function weatheredWall(base = '#d9cdb5', seed = 7) {
  const S = 512, { canvas, ctx } = makeCanvas(S, S), r = rng(seed), n = makeNoise(seed);
  const [br, bg, bb] = hex2rgb(base), img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4;
    const streak = n.fbm(x / 14, y / 210, 3);
    let k = 0.93 + (n.fbm(x / 60, y / 60, 3) - 0.5) * 0.16 - Math.max(0, streak - 0.55) * 0.5 + (r() - 0.5) * 0.03;
    img.data[i] = clamp(br * k, 0, 255); img.data[i + 1] = clamp(bg * k, 0, 255); img.data[i + 2] = clamp(bb * k, 0, 255); img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvasTex(canvas, { aniso: 8 });
}

// Corrugated rolling shutter
export function shutter(base = '#9aa1a6') {
  const S = 256, { canvas, ctx } = makeCanvas(S, S), r = rng(9);
  ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 8) {
    const g = ctx.createLinearGradient(0, y, 0, y + 8);
    g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = g; ctx.fillRect(0, y, S, 8);
  }
  for (let i = 0; i < 400; i++) { ctx.fillStyle = 'rgba(80,50,30,.08)'; ctx.fillRect(r() * S, r() * S, 3, 2 + r() * 10); }
  return canvasTex(canvas, { aniso: 4 });
}

// Frosted-dot window safety band (repeats horizontally)
export function frostedBand() {
  const W = 256, H = 64, { canvas, ctx } = makeCanvas(W, H);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (let j = 0; j < 8; j++) for (let i = 0; i < 32; i++) { ctx.beginPath(); ctx.arc(i * 8 + (j % 2) * 4 + 2, j * 8 + 4, 2.4, 0, 6.3); ctx.fill(); }
  return canvasTex(canvas);
}

// Soft blob for fake ambient occlusion decals.
let _blob = null;
export function blobShadow() {
  if (_blob) return _blob;
  const S = 128, { canvas, ctx } = makeCanvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  _blob = canvasTex(canvas, { wrap: false });
  return _blob;
}
// Linear edge shadow (dark at one side fading to transparent)
let _edge = null;
export function edgeShadow() {
  if (_edge) return _edge;
  const W = 8, H = 64, { canvas, ctx } = makeCanvas(W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(0.35, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  _edge = canvasTex(canvas, { wrap: false });
  return _edge;
}

// Soft light pool (additive glow)
let _glow = null;
export function glowTex() {
  if (_glow) return _glow;
  const S = 128, { canvas, ctx } = makeCanvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  _glow = canvasTex(canvas, { wrap: false });
  return _glow;
}

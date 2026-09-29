// Fresh range B: chilled desserts & cut fruit, packaged bakery and ice cream (36 SKUs).
// Content only: SKU records plus the procedural hero illustrations, brand styles and ingredient keys they use.
// Every hero here accepts layout knobs through `heroOpts`: k (scale), dx / dy (nudge, in units of the hero size).
import { g, ml, L, pc, T } from './sku_util.js';
import { circle, ellipse, poly, leaf, linGrad, radGrad, fillRR } from '../gfx/draw.js';
import { lighten, darken, TAU, rng } from '../core/util.js';

// ====================================================================================================== drawing toolkit
// Hero illustrations draw centred on (0,0) inside [-s/2, s/2] (a few are deliberately wider than tall for cup labels).
// Line widths are always relative to s: the shared lw() in illus.js clamps to 0.5, far too thick on cm-sized labels.
const OUT = '#3b2411';
const lw = (ctx, s, f = 0.03) => { ctx.lineWidth = s * f; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
const edge = (ctx, s, col = OUT, f = 0.03) => { ctx.strokeStyle = col; lw(ctx, s, f); ctx.stroke(); };
function glint(ctx, x, y, rx, ry, rot = -0.6, a = 0.55) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill(); ctx.restore();
}
// smooth wobbly closed path (organic blobs: rice mounds, cream puddles, puddings)
function blob(ctx, cx, cy, rx, ry, seed = 1, amp = 0.08, n = 9, rot = 0) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU, k = 1 + (r() - 0.5) * 2 * amp;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const st = mid(pts[n - 1], pts[0]);
  ctx.beginPath(); ctx.moveTo(st[0], st[1]);
  for (let i = 0; i < n; i++) { const q = mid(pts[i], pts[(i + 1) % n]); ctx.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); }
  ctx.closePath();
}
// elongated shape following a (bent) centre-line with rounded ends. Local frame: runs from (0,0) to (0,len).
function tube(ctx, len, wid, bend = 0.1, n = 20) {
  const Lp = [], Rp = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, c = bend * len * Math.sin(Math.PI * t);
    const hw = (wid / 2) * Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * t)), 0.55);
    Lp.push([c - hw, t * len]); Rp.push([c + hw, t * len]);
  }
  ctx.beginPath(); ctx.moveTo(Lp[0][0], Lp[0][1]);
  for (const p of Lp) ctx.lineTo(p[0], p[1]);
  for (let i = n; i >= 0; i--) ctx.lineTo(Rp[i][0], Rp[i][1]);
  ctx.closePath();
}
// isometric block (cut-fruit chunk, brownie). Centre (x,y), width w; the top face spans y-w/2..y, sides drop by o.v (default w/2).
// o: { rot, v, outline, detail(ctx,w) }  (detail is drawn in the block's local frame, top face centred on (0,-w/4))
function cube(ctx, x, y, w, col, o = {}) {
  const t = w / 4, v = o.v ?? w / 2, ol = o.outline || darken(col, 0.5), lwv = w * 0.055;
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  poly(ctx, [[-w / 2, -t], [0, 0], [0, v], [-w / 2, -t + v]], darken(col, 0.08), ol, lwv);
  poly(ctx, [[0, 0], [w / 2, -t], [w / 2, -t + v], [0, v]], darken(col, 0.24), ol, lwv);
  poly(ctx, [[0, -w / 2], [w / 2, -t], [0, 0], [-w / 2, -t]], lighten(col, 0.24), ol, lwv);
  if (o.detail) o.detail(ctx, w);
  ctx.restore();
}
// scatter n small marks inside an ellipse: fn(x, y, i, rand)
function scatter(seed, n, cx, cy, rx, ry, fn) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r());
    fn(cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, i, r);
  }
}

export const illus = {};

// ====================================================================================================== new brand styles & ingredient keys
export const brands = {
  cornetto: { text: 'Cornetto', th: 'คอร์เนตโต', style: 'script', fg: '#ffffff', font: 'pacifico', stroke: '#8a0f24' },
  selection: { text: 'Selection', th: 'ซีเล็คชั่น', style: 'script', fg: '#fff3c4', font: 'pacifico', stroke: '#5a1a4a' },
  essel: { text: 'Meiji Essel', th: 'เมจิ เอสเซล', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#1a5fb4' },
  mochi: { text: 'MOCHI', th: 'โมจิ', style: 'pill', bg: '#ffffff', fg: '#e6407a', font: 'lilita', ring: '#e6407a' },
  haagendazs: { text: 'Häagen-Dazs', th: 'ฮาเก้น-ดาส', style: 'plain', fg: '#fbeed2', font: 'chonburi', stroke: '#5a1230' },
  swensens: { text: "Swensen's", th: 'สเวนเซ่นส์', style: 'script', fg: '#ffffff', font: 'pacifico', stroke: '#c8102e' },
  nestleice: { text: 'Nestlé', th: 'เนสท์เล่', style: 'plain', fg: '#ffffff', font: 'chonburi', stroke: '#0f4aa8' },
};

export const ingredients = {
  banana: { en: 'Banana', th: 'กล้วยหอม' },
  guava: { en: 'Guava', th: 'ฝรั่ง' },
  papayaripe: { en: 'Papaya', th: 'มะละกอสุก' },
  dragonfruit: { en: 'Dragon fruit', th: 'แก้วมังกร' },
  natadecoco: { en: 'Nata de coco', th: 'วุ้นมะพร้าว' },
  ginger: { en: 'Ginger', th: 'ขิง' },
  mungbean: { en: 'Mung bean', th: 'ถั่วเขียว' },
  waterchestnut: { en: 'Water chestnut', th: 'แห้ว' },
  jackfruit: { en: 'Jackfruit', th: 'ขนุน' },
  walnut: { en: 'Walnut', th: 'วอลนัท' },
  chocchips: { en: 'Chocolate chips', th: 'ช็อกโกแลตชิพ' },
  vanillabean: { en: 'Vanilla extract', th: 'สารสกัดวานิลลา' },
};

// Top-down tray: glossy sticky rice under coconut cream and mung beans, beside a row of ripe mango slices.
illus.mangoStickyRice = (ctx, s) => {
  const slice = (x, y, len, wid, rot) => {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot); ctx.translate(0, -s * len / 2);
    tube(ctx, s * len, s * wid, 0.06);
    ctx.fillStyle = linGrad(ctx, -s * wid / 2, 0, s * wid / 2, 0, [[0, '#ffe25a'], [0.5, '#ffc21a'], [1, '#ff9a12']]); ctx.fill();
    edge(ctx, s, '#c96c08', 0.026);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = s * 0.016;
    ctx.beginPath(); ctx.moveTo(-s * wid * 0.18, s * len * 0.16); ctx.quadraticCurveTo(-s * wid * 0.08, s * len * 0.5, -s * wid * 0.2, s * len * 0.82); ctx.stroke();
    ctx.restore();
  };
  for (const [x, y] of [[0.02, 0.02], [0.14, 0.03], [0.26, 0.04], [0.38, 0.05]]) slice(x, y, 0.66, 0.21, 0.28);
  // rice mound
  ctx.save(); ctx.translate(-s * 0.14, -s * 0.03);
  blob(ctx, 0, 0, s * 0.3, s * 0.34, 5, 0.05, 11, 0.4);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.42, [[0, '#ffffff'], [0.65, '#fff8e0'], [1, '#e2d5aa']], -s * 0.1, -s * 0.12); ctx.fill();
  edge(ctx, s, '#a2905f', 0.028);
  ctx.strokeStyle = 'rgba(176,160,112,.85)'; ctx.lineWidth = s * 0.013;
  scatter(3, 48, 0, 0, s * 0.26, s * 0.3, (x, y, i, rr) => { const a = rr() * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * s * 0.03, y + Math.sin(a) * s * 0.016); ctx.stroke(); });
  glint(ctx, -s * 0.1, -s * 0.16, s * 0.11, s * 0.04, -0.8, 0.8);
  // coconut cream poured on top + mung beans
  blob(ctx, s * 0.03, s * 0.05, s * 0.19, s * 0.15, 9, 0.12, 9);
  ctx.fillStyle = '#fffdf6'; ctx.fill(); edge(ctx, s, '#cdbf9c', 0.022);
  glint(ctx, -s * 0.01, s * 0.0, s * 0.06, s * 0.022, -0.5, 0.95);
  scatter(8, 13, s * 0.03, s * 0.05, s * 0.18, s * 0.13, (x, y, i, rr) => {
    ctx.beginPath(); ctx.ellipse(x, y, s * 0.022, s * 0.015, rr() * 3, 0, TAU); ctx.fillStyle = '#e8bb32'; ctx.fill(); edge(ctx, s, '#a87a10', 0.008);
  });
  ctx.restore();
};

// Cup label: pile of cut tropical fruit cubes (watermelon with a rind edge, pineapple, papaya, dragon fruit, guava). Wide: ~2.6s x 1.1s.
illus.fruitMix = (ctx, s) => {
  const seeds = (col, n, sd) => (c, w) => scatter(sd, n, -w * 0.22, w * 0.12, w * 0.16, w * 0.14, (x, y) => { c.beginPath(); c.ellipse(x, y, w * 0.03, w * 0.05, 0.4, 0, TAU); c.fillStyle = col; c.fill(); });
  const melon = (sd) => (c, w) => {   // dark seeds + green rind along the bottom edge of the right face
    seeds('#2a1010', 3, sd)(c, w);
    const t = w / 4, v = w / 2, b = w * 0.11;
    poly(c, [[0, v - b], [w / 2, -t + v - b], [w / 2, -t + v], [0, v]], '#2f9a45', '#175a26', w * 0.03);
    poly(c, [[-w / 2, -t + v - b], [0, v - b], [0, v], [-w / 2, -t + v]], '#3aa84e', '#175a26', w * 0.03);
  };
  const w = s * 0.46;
  const back = [[-0.62, -0.13, '#ff4d63', melon(4)], [-0.2, -0.22, '#ffd83a', null], [0.24, -0.2, '#ff9a3d', null], [0.66, -0.12, '#f4a6c0', seeds('#3a1020', 5, 6)]];
  const front = [[-0.84, 0.13, '#ffd83a', null], [-0.42, 0.14, '#e8407e', seeds('#3a1020', 6, 9)], [0.0, 0.1, '#ff4d63', melon(5)], [0.44, 0.14, '#ff9a3d', null], [0.86, 0.13, '#ff4d63', melon(7)]];
  for (const [x, y, c, d] of back) cube(ctx, x * s, y * s, w * 0.95, c, { detail: d, rot: (x * 0.15) });
  for (const [x, y, c, d] of front) cube(ctx, x * s, y * s, w, c, { detail: d, rot: (-x * 0.1) });
  glint(ctx, -s * 0.3, -s * 0.26, s * 0.05, s * 0.02, -0.4, 0.6);
};

// Top-down tray: fan of watermelon slices with rind, pale band and seeds.
illus.melonWedges = (ctx, s) => {
  const slice = (x, y, rot, R) => {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot);
    const Rr = R * s;
    const half = (rad) => { ctx.beginPath(); ctx.moveTo(-rad, -Rr * 0.35); ctx.lineTo(rad, -Rr * 0.35); ctx.arc(0, -Rr * 0.35, rad, 0, Math.PI, false); ctx.closePath(); };
    half(Rr); ctx.fillStyle = '#2a8a3a'; ctx.fill(); edge(ctx, s, '#124a1e', 0.026);
    ctx.strokeStyle = '#5cbf5a'; ctx.lineWidth = s * 0.02;
    for (const a of [0.5, 1.0, 1.6, 2.15, 2.65]) { ctx.beginPath(); ctx.arc(0, -Rr * 0.35, Rr * 0.955, a - 0.09, a + 0.09); ctx.stroke(); }
    half(Rr * 0.9); ctx.fillStyle = '#eaf7c6'; ctx.fill();
    half(Rr * 0.8); ctx.fillStyle = linGrad(ctx, 0, -Rr * 0.4, 0, Rr * 0.5, [[0, '#ff6a7c'], [1, '#ff2f4b']]); ctx.fill();
    ctx.fillStyle = '#26110f';
    for (const [sx, sy] of [[-0.42, 0.12], [0, 0.26], [0.42, 0.12], [-0.22, 0.44], [0.22, 0.44]]) { ctx.beginPath(); ctx.ellipse(sx * Rr, -Rr * 0.35 + sy * Rr, Rr * 0.045, Rr * 0.08, sx * 0.9, 0, TAU); ctx.fill(); }
    glint(ctx, -Rr * 0.3, -Rr * 0.2, Rr * 0.16, Rr * 0.045, -0.2, 0.4);
    ctx.restore();
  };
  slice(-0.14, -0.2, 0.28, 0.27); slice(0.17, -0.19, -0.3, 0.27);
  slice(-0.27, 0.13, 0.5, 0.29); slice(0.28, 0.14, -0.5, 0.29); slice(0.0, 0.2, 0, 0.31);
};

// Cup label: pineapple crown over a ring slice and a heap of golden wedge chunks. Wide.
illus.pineChunks = (ctx, s) => {
  const cols = ['#2e9b3e', '#3ab04a', '#1f7d34'];
  for (let i = 0; i < 11; i++) leaf(ctx, 0, -s * 0.04, s * (0.62 - Math.abs(i - 5) * 0.04), s * 0.085, -Math.PI / 2 + (i - 5) * 0.24, cols[i % 3]);
  const yel = (y0, y1) => linGrad(ctx, 0, y0, 0, y1, [[0, '#ffea72'], [1, '#ffbf1a']]);
  // wedge chunks = segments of a pineapple ring
  const seg = (x, y, rot, r1, r2, a) => {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot);
    ctx.beginPath(); ctx.arc(0, 0, r2 * s, -a, a); ctx.arc(0, 0, r1 * s, a, -a, true); ctx.closePath();
    ctx.fillStyle = yel(-r2 * s, r2 * s); ctx.fill(); edge(ctx, s, '#b07a00', 0.03);
    ctx.strokeStyle = 'rgba(200,140,0,.6)'; ctx.lineWidth = s * 0.014;
    for (let k = -2; k <= 2; k++) { const aa = k * a * 0.34; ctx.beginPath(); ctx.moveTo(Math.cos(aa) * r1 * s * 1.12, Math.sin(aa) * r1 * s * 1.12); ctx.lineTo(Math.cos(aa) * r2 * s * 0.92, Math.sin(aa) * r2 * s * 0.92); ctx.stroke(); }
    glint(ctx, (r1 + r2) * s * 0.55, -a * r2 * s * 0.45, s * 0.05, s * 0.018, -1.2, 0.6);
    ctx.restore();
  };
  // ring slice (left)
  ctx.save(); ctx.translate(-s * 0.55, s * 0.12); ctx.rotate(-0.2); ctx.scale(1, 0.72);
  ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, TAU); ctx.arc(0, 0, s * 0.09, 0, TAU, true);
  ctx.fillStyle = yel(-s * 0.3, s * 0.3); ctx.fill('evenodd'); edge(ctx, s, '#b07a00', 0.035);
  ctx.strokeStyle = 'rgba(200,140,0,.6)'; ctx.lineWidth = s * 0.015;
  for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.13, Math.sin(a) * s * 0.13); ctx.lineTo(Math.cos(a) * s * 0.27, Math.sin(a) * s * 0.27); ctx.stroke(); }
  ctx.restore();
  seg(0.46, 0.2, 0.3, 0.13, 0.34, 0.5);
  seg(0.1, 0.32, -Math.PI / 2 + 0.1, 0.13, 0.34, 0.55);
  seg(-0.16, 0.2, -Math.PI / 2 - 0.35, 0.13, 0.34, 0.5);
  seg(0.22, 0.08, -0.2, 0.13, 0.36, 0.55);
  seg(0.62, 0.08, 0.7, 0.13, 0.3, 0.5);
};

// Top-down tray: two "hedgehog" mango cheeks (flesh cut in diamonds) under a whole nam dok mai mango.
illus.mangoCheeks = (ctx, s) => {
  // whole mango (top) with a proper asymmetric silhouette
  ctx.save(); ctx.translate(-s * 0.02, -s * 0.23); ctx.rotate(-0.12);
  ctx.beginPath(); ctx.moveTo(-s * 0.34, s * 0.02); ctx.bezierCurveTo(-s * 0.36, -s * 0.22, s * 0.08, -s * 0.28, s * 0.3, -s * 0.1);
  ctx.bezierCurveTo(s * 0.4, -s * 0.02, s * 0.32, s * 0.16, s * 0.1, s * 0.2); ctx.bezierCurveTo(-s * 0.14, s * 0.26, -s * 0.32, s * 0.2, -s * 0.34, s * 0.02); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.42, [[0, '#ffe45a'], [0.55, '#f7b81c'], [1, '#e2801a']], -s * 0.12, -s * 0.08); ctx.fill(); edge(ctx, s, '#94500e', 0.03);
  ctx.fillStyle = 'rgba(150,190,50,.45)'; ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.06, s * 0.1, s * 0.07, 0.4, 0, TAU); ctx.fill();
  glint(ctx, -s * 0.14, -s * 0.09, s * 0.1, s * 0.03, -0.25, 0.6);
  leaf(ctx, s * 0.29, -s * 0.1, s * 0.22, s * 0.065, -0.6, '#2e9b3e'); leaf(ctx, s * 0.29, -s * 0.1, s * 0.17, s * 0.055, 0.15, '#3ab04a');
  ctx.restore();
  const cheek = (x, y, rot) => {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot);
    const rx = s * 0.235, ry = s * 0.3;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fillStyle = '#e8801a'; ctx.fill(); edge(ctx, s, '#8a4a0a', 0.03);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.9, ry * 0.9, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = '#d9760c'; ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    // diamonds
    const step = s * 0.095;
    for (let i = -4; i <= 4; i++) for (let j = -5; j <= 5; j++) {
      const px = (i + (j % 2 ? 0.5 : 0)) * step, py = j * step * 0.5;
      ctx.beginPath(); ctx.moveTo(px, py - step * 0.46); ctx.lineTo(px + step * 0.44, py); ctx.lineTo(px, py + step * 0.46); ctx.lineTo(px - step * 0.44, py); ctx.closePath();
      ctx.fillStyle = linGrad(ctx, px, py - step * 0.46, px, py + step * 0.46, [[0, '#ffee7a'], [1, '#ffc01e']]); ctx.fill();
    }
    ctx.restore();
    glint(ctx, -rx * 0.35, -ry * 0.5, rx * 0.22, ry * 0.07, -0.5, 0.6);
    ctx.restore();
  };
  cheek(-0.22, 0.18, 0.15); cheek(0.22, 0.2, -0.12);
};

// Cup label: bowl of bua loy (coloured glutinous-rice balls) in coconut milk with a halved sweet egg. Wide.
illus.buaLoy = (ctx, s) => {
  // bowl
  ctx.beginPath(); ctx.moveTo(-s * 0.64, s * 0.0); ctx.bezierCurveTo(-s * 0.6, s * 0.42, -s * 0.24, s * 0.52, 0, s * 0.52); ctx.bezierCurveTo(s * 0.24, s * 0.52, s * 0.6, s * 0.42, s * 0.64, s * 0.0); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, -s * 0.6, 0, s * 0.6, 0, [[0, '#e9e6de'], [0.4, '#ffffff'], [1, '#d8d4c8']]); ctx.fill(); edge(ctx, s, '#6b5a45', 0.03);
  ctx.strokeStyle = '#e8615a'; ctx.lineWidth = s * 0.035; ctx.beginPath(); ctx.moveTo(-s * 0.55, s * 0.13); ctx.quadraticCurveTo(0, s * 0.27, s * 0.55, s * 0.13); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.64, s * 0.15, 0, 0, TAU); ctx.fillStyle = '#fff5df'; ctx.fill(); edge(ctx, s, '#6b5a45', 0.03);
  // rice balls
  const ball = (x, y, R, c) => {
    circle(ctx, x * s, y * s, R * s, c, darken(c, 0.5), s * 0.026);
    ctx.fillStyle = radGrad(ctx, x * s, y * s, 0, R * s, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']], (x - R * 0.3) * s, (y - R * 0.3) * s); ctx.beginPath(); ctx.arc(x * s, y * s, R * s * 0.94, 0, TAU); ctx.fill();
  };
  const balls = [[-0.42, -0.04, 0.15, '#ff9bbb'], [0.4, -0.05, 0.15, '#8fd66b'], [-0.16, -0.08, 0.16, '#ffffff'], [0.16, -0.08, 0.16, '#ffb347'], [-0.3, -0.2, 0.15, '#ffffff'], [0.3, -0.2, 0.15, '#ff9bbb'], [0.0, -0.22, 0.15, '#8fd66b']];
  for (const [x, y, R, c] of balls) ball(x, y, R, c);
  // halved boiled egg on top
  ctx.save(); ctx.translate(0, -s * 0.36); ctx.rotate(-0.15);
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.17, s * 0.13, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); edge(ctx, s, '#a89670', 0.026);
  circle(ctx, 0, 0, s * 0.07, '#ffb81c', '#c07a00', s * 0.018); glint(ctx, -s * 0.02, -s * 0.02, s * 0.025, s * 0.015, -0.4, 0.8);
  ctx.restore();
};

// Cup label: glass of tub tim krob, red water-chestnut "rubies" heaped over white coconut milk with ice. Wide.
illus.tubTimKrob = (ctx, s) => {
  const gem = (x, y, R, rot) => {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot);
    fillRR(ctx, -R * s, -R * s * 0.9, R * 2 * s, R * 1.8 * s, R * s * 0.5, linGrad(ctx, 0, -R * s, 0, R * s, [[0, '#ff5670'], [1, '#c8163a']]), '#7a0a1e', s * 0.024);
    glint(ctx, -R * s * 0.35, -R * s * 0.4, R * s * 0.32, R * s * 0.14, -0.4, 0.6);
    ctx.restore();
  };
  // glass body (behind), then the milk
  const body = () => { ctx.beginPath(); ctx.moveTo(-s * 0.46, -s * 0.06); ctx.lineTo(-s * 0.36, s * 0.46); ctx.quadraticCurveTo(0, s * 0.56, s * 0.36, s * 0.46); ctx.lineTo(s * 0.46, -s * 0.06); ctx.closePath(); };
  body(); ctx.fillStyle = 'rgba(230,244,250,.9)'; ctx.fill();
  ctx.save(); body(); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, s * 0.55, [[0, '#fffdf6'], [1, '#f3ead6']]); ctx.fillRect(-s, s * 0.06, s * 2, s);
  const r = rng(6);
  for (let i = 0; i < 14; i++) gem(-0.3 + (i % 5) * 0.15 + (r() - 0.5) * 0.06, 0.16 + Math.floor(i / 5) * 0.14 + (r() - 0.5) * 0.04, 0.072, r() * 3);
  ctx.restore();
  // mound above the rim
  for (let row = 0; row < 3; row++) {
    const n = 6 - row * 2, y = -0.09 - row * 0.115;
    for (let i = 0; i < n; i++) gem((i - (n - 1) / 2) * 0.128 + (r() - 0.5) * 0.02, y + (r() - 0.5) * 0.02, 0.078, r() * 3);
  }
  // ice cubes
  for (const [x, y, a] of [[-0.42, -0.13, 0.4], [0.4, -0.12, -0.3]]) { ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(a); fillRR(ctx, -s * 0.07, -s * 0.07, s * 0.14, s * 0.14, s * 0.02, 'rgba(225,245,255,.92)', '#7fb6d0', s * 0.018); glint(ctx, -s * 0.02, -s * 0.03, s * 0.03, s * 0.012, -0.4, 0.8); ctx.restore(); }
  // glass outline + sheen
  body(); ctx.strokeStyle = '#66798c'; lw(ctx, s, 0.03); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(-s * 0.36, s * 0.06); ctx.lineTo(-s * 0.3, s * 0.4); ctx.stroke();
  leaf(ctx, s * 0.4, -s * 0.28, s * 0.3, s * 0.07, -0.7, '#3ab04a'); leaf(ctx, s * 0.4, -s * 0.28, s * 0.24, s * 0.06, -1.25, '#2e9b3e');
};

// Top-down tray: a kabocha cut open to show its coconut custard, plus two slices.
illus.pumpkinCustard = (ctx, s) => {
  const pieces = (rad, a0, a1, full) => {
    ctx.beginPath(); if (!full) ctx.moveTo(0, 0); ctx.arc(0, 0, rad, a0, a1); ctx.closePath();
  };
  const layered = (R, a0, a1, full) => {
    pieces(R, a0, a1, full); ctx.fillStyle = '#245f2c'; ctx.fill(); edge(ctx, s, '#123a1a', 0.026);
    pieces(R * 0.9, a0, a1, full); ctx.fillStyle = '#ff9f24'; ctx.fill();
    if (full) {   // pumpkin ribs: pale streaks on the skin, darker seams in the flesh
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        ctx.strokeStyle = 'rgba(150,215,110,.75)'; ctx.lineWidth = s * 0.016; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.91, Math.sin(a) * R * 0.91); ctx.lineTo(Math.cos(a) * R * 0.99, Math.sin(a) * R * 0.99); ctx.stroke();
        ctx.strokeStyle = 'rgba(200,100,0,.5)'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.7, Math.sin(a) * R * 0.7); ctx.lineTo(Math.cos(a) * R * 0.89, Math.sin(a) * R * 0.89); ctx.stroke();
      }
    }
    pieces(R * 0.68, a0, a1, full); ctx.fillStyle = radGrad(ctx, 0, 0, 0, R * 0.7, [[0, '#ffe79a'], [1, '#f2b846']], -R * 0.15, -R * 0.15); ctx.fill();
    ctx.strokeStyle = 'rgba(190,120,20,.55)'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.arc(0, 0, R * 0.68, a0, a1); ctx.stroke();
  };
  // cut pumpkin (top)
  ctx.save(); ctx.translate(-s * 0.02, -s * 0.16);
  layered(s * 0.34, 0, TAU, true);
  glint(ctx, -s * 0.1, -s * 0.1, s * 0.09, s * 0.035, -0.6, 0.55);
  ctx.fillStyle = 'rgba(140,80,10,.55)'; scatter(4, 9, 0, 0, s * 0.18, s * 0.18, (x, y) => { ctx.beginPath(); ctx.arc(x, y, s * 0.008, 0, TAU); ctx.fill(); });
  fillRR(ctx, -s * 0.03, -s * 0.4, s * 0.06, s * 0.08, s * 0.02, '#7a5a2a', '#3b2411', s * 0.015);
  ctx.restore();
  // two slices in front
  for (const [x, y, rot] of [[-0.19, 0.06, -0.25], [0.2, 0.05, 0.25]]) {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot);
    layered(s * 0.4, Math.PI / 2 - 0.4, Math.PI / 2 + 0.4, false);
    glint(ctx, 0, s * 0.22, s * 0.11, s * 0.035, 1.5, 0.5);
    ctx.restore();
  }
  leaf(ctx, s * 0.3, -s * 0.34, s * 0.22, s * 0.07, -0.9, '#3ab04a'); leaf(ctx, s * 0.3, -s * 0.34, s * 0.18, s * 0.06, -0.1, '#2e9b3e');
};

// Cup label: bowl of silky tao huay (tofu pudding) in amber ginger syrup with peanuts and a spoon. Wide.
illus.taoHuay = (ctx, s) => {
  ctx.beginPath(); ctx.moveTo(-s * 0.62, s * 0.0); ctx.bezierCurveTo(-s * 0.58, s * 0.4, -s * 0.24, s * 0.5, 0, s * 0.5); ctx.bezierCurveTo(s * 0.24, s * 0.5, s * 0.58, s * 0.4, s * 0.62, s * 0.0); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, -s * 0.6, 0, s * 0.6, 0, [[0, '#dcdfe6'], [0.4, '#ffffff'], [1, '#c9ceda']]); ctx.fill(); edge(ctx, s, '#4d5a70', 0.03);
  ctx.strokeStyle = '#3f8fd0'; ctx.lineWidth = s * 0.035; ctx.beginPath(); ctx.moveTo(-s * 0.54, s * 0.12); ctx.quadraticCurveTo(0, s * 0.26, s * 0.54, s * 0.12); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.14, 0, 0, TAU); ctx.fillStyle = '#e8a23c'; ctx.fill(); edge(ctx, s, '#4d5a70', 0.03);
  ctx.beginPath(); ctx.ellipse(0, s * 0.005, s * 0.56, s * 0.1, 0, 0, TAU); ctx.fillStyle = linGrad(ctx, 0, -s * 0.1, 0, s * 0.1, [[0, '#f6c45c'], [1, '#d88a20']]); ctx.fill();
  // ginger slivers floating in the syrup
  ctx.fillStyle = '#f7dc8a';
  for (const [x, y, a] of [[-0.42, 0.02, 0.2], [0.4, 0.03, -0.2], [-0.3, 0.06, -0.3], [0.3, 0.06, 0.25]]) { ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 0, s * 0.055, s * 0.02, 0, 0, TAU); ctx.fill(); edge(ctx, s, '#b8862a', 0.01); ctx.restore(); }
  // pudding: soft wobbly slabs piled up
  const slab = (x, y, rx, ry, seed) => {
    blob(ctx, x * s, y * s, rx * s, ry * s, seed, 0.06, 11);
    ctx.fillStyle = radGrad(ctx, x * s, y * s, 0, rx * s * 1.2, [[0, '#ffffff'], [0.7, '#f4f7fc'], [1, '#d4dcec']], (x - rx * 0.3) * s, (y - ry * 0.5) * s); ctx.fill();
    edge(ctx, s, '#8a96ad', 0.022);
    glint(ctx, (x - rx * 0.35) * s, (y - ry * 0.35) * s, rx * s * 0.28, ry * s * 0.16, -0.15, 0.85);
  };
  slab(-0.24, -0.06, 0.25, 0.1, 1); slab(0.22, -0.07, 0.25, 0.1, 2); slab(-0.02, -0.14, 0.28, 0.11, 3); slab(0.0, -0.26, 0.2, 0.09, 5);
  scatter(15, 6, 0, -s * 0.03, s * 0.42, s * 0.05, (x, y, i, rr) => { ctx.beginPath(); ctx.ellipse(x, y, s * 0.028, s * 0.02, rr() * 3, 0, TAU); ctx.fillStyle = '#d8a86a'; ctx.fill(); edge(ctx, s, '#8a5a2a', 0.01); });
  // spoon leaning on the rim
  ctx.save(); ctx.translate(s * 0.5, -s * 0.14); ctx.rotate(0.6);
  fillRR(ctx, -s * 0.02, -s * 0.28, s * 0.04, s * 0.34, s * 0.02, '#f2f2f2', '#6a7284', s * 0.014);
  ellipse(ctx, 0, s * 0.1, s * 0.07, s * 0.09, '#f7f7f7', '#6a7284', s * 0.016);
  ctx.restore();
};

// Cup label: half coconut shell brimming with translucent jelly cubes. Wide.
illus.coconutJelly = (ctx, s) => {
  // shell (husk outside, white flesh ring inside)
  ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.02); ctx.bezierCurveTo(-s * 0.5, s * 0.42, -s * 0.22, s * 0.52, 0, s * 0.52); ctx.bezierCurveTo(s * 0.22, s * 0.52, s * 0.5, s * 0.42, s * 0.5, -s * 0.02); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, s * 0.2, 0, s * 0.6, [[0, '#a5703a'], [1, '#5a3618']], -s * 0.15, s * 0.05); ctx.fill(); edge(ctx, s, '#2e1a0a', 0.03);
  ctx.strokeStyle = 'rgba(40,22,8,.35)'; ctx.lineWidth = s * 0.012;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.12, s * 0.12); ctx.quadraticCurveTo(i * s * 0.11, s * 0.3, i * s * 0.05, s * 0.5); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, -s * 0.02, s * 0.5, s * 0.13, 0, 0, TAU); ctx.fillStyle = '#f7f1e2'; ctx.fill(); edge(ctx, s, '#2e1a0a', 0.03);
  ctx.beginPath(); ctx.ellipse(0, -s * 0.02, s * 0.44, s * 0.095, 0, 0, TAU); ctx.fillStyle = '#e9f7f4'; ctx.fill();
  // jelly cubes, a mound above the rim
  const jelly = '#bdeee4';
  const j = (x, y, w, rot) => cube(ctx, x * s, y * s, w * s, jelly, { outline: '#3f9c92', rot, detail: (c, ww) => { glint(c, -ww * 0.15, -ww * 0.3, ww * 0.12, ww * 0.045, -0.3, 0.8); } });
  for (const [x, y, w, rot] of [[-0.3, -0.06, 0.22, -0.1], [-0.1, -0.03, 0.23, 0.08], [0.12, -0.05, 0.22, -0.06], [0.31, -0.07, 0.21, 0.1], [-0.2, -0.2, 0.22, 0.05], [0.02, -0.19, 0.23, -0.08], [0.22, -0.2, 0.21, 0.1], [-0.05, -0.34, 0.22, 0.04]]) j(x, y, w, rot);
  leaf(ctx, s * 0.36, -s * 0.16, s * 0.24, s * 0.06, -0.9, '#3ab04a'); leaf(ctx, s * 0.38, -s * 0.14, s * 0.2, s * 0.05, -0.2, '#2e9b3e');
};

// Yoghurt cup label: soft swirl dollop. o.fruit = 'strawberry' (pink sauce ribbon + berries) or 'honey' (amber drizzle + dipper).
illus.yoghurtSwirl = (ctx, s, o = {}) => {
  const tier = (y, rx, ry, seed) => {
    blob(ctx, 0, y * s, rx * s, ry * s, seed, 0.03, 12);
    ctx.fillStyle = radGrad(ctx, 0, y * s, 0, rx * s * 1.1, [[0, '#ffffff'], [0.7, '#f7f9fc'], [1, '#d9e0ee']], -rx * s * 0.3, (y - ry * 0.4) * s); ctx.fill();
    edge(ctx, s, '#8493b0', 0.026);
  };
  if (o.fruit === 'honey') {   // wooden honey dipper behind
    ctx.save(); ctx.translate(s * 0.46, -s * 0.05); ctx.rotate(0.5);
    fillRR(ctx, -s * 0.018, -s * 0.05, s * 0.036, s * 0.5, s * 0.018, '#dcb078', '#7a5a2a', s * 0.014);
    ctx.beginPath(); ctx.ellipse(0, -s * 0.05, s * 0.055, s * 0.09, 0, 0, TAU); ctx.fillStyle = '#e8b05a'; ctx.fill(); edge(ctx, s, '#7a5a2a', 0.016);
    ctx.restore();
  }
  tier(0.26, 0.42, 0.17, 3); tier(0.08, 0.32, 0.14, 4); tier(-0.09, 0.22, 0.12, 5);
  ctx.beginPath(); ctx.moveTo(-s * 0.09, -s * 0.15); ctx.quadraticCurveTo(-s * 0.02, -s * 0.44, s * 0.08, -s * 0.34); ctx.quadraticCurveTo(s * 0.03, -s * 0.28, s * 0.09, -s * 0.15); ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill(); edge(ctx, s, '#8493b0', 0.026);
  ctx.strokeStyle = 'rgba(132,147,176,.55)'; ctx.lineWidth = s * 0.015;
  for (const [y, rx] of [[0.26, 0.3], [0.08, 0.22]]) { ctx.beginPath(); ctx.ellipse(0, y * s + s * 0.02, rx * s, s * 0.07, 0, 0.15, Math.PI - 0.15); ctx.stroke(); }
  if (o.fruit === 'strawberry') {
    // pink strawberry sauce ribbon winding over the tiers
    ctx.strokeStyle = '#ff6f92'; ctx.lineWidth = s * 0.03;
    for (const [y, rx] of [[0.27, 0.4], [0.09, 0.3], [-0.08, 0.2]]) { ctx.beginPath(); ctx.ellipse(0, y * s + s * 0.01, rx * s, s * 0.075, 0, 0.25, Math.PI - 0.25); ctx.stroke(); }
    const berry = (x, y, R, rot) => {
      ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(0, R * s * 1.1); ctx.bezierCurveTo(R * s * 1.15, R * s * 0.3, R * s * 0.95, -R * s * 0.85, 0, -R * s * 0.75); ctx.bezierCurveTo(-R * s * 0.95, -R * s * 0.85, -R * s * 1.15, R * s * 0.3, 0, R * s * 1.1);
      ctx.fillStyle = radGrad(ctx, 0, 0, 0, R * s * 1.3, [[0, '#ff5a6e'], [1, '#d6183a']], -R * s * 0.3, -R * s * 0.3); ctx.fill(); edge(ctx, s, '#7a0a1e', 0.024);
      ctx.fillStyle = '#ffe9a0'; scatter(2, 8, 0, R * s * 0.15, R * s * 0.55, R * s * 0.6, (px, py) => { ctx.beginPath(); ctx.ellipse(px, py, s * 0.008, s * 0.014, 0, 0, TAU); ctx.fill(); });
      for (let i = 0; i < 5; i++) leaf(ctx, 0, -R * s * 0.72, R * s * 0.7, R * s * 0.24, -Math.PI / 2 + (i - 2) * 0.62, '#2e9b3e');
      ctx.restore();
    };
    berry(-0.5, 0.2, 0.17, -0.3); berry(0.5, 0.23, 0.15, 0.35); berry(0.02, -0.36, 0.09, 0.1);
  } else if (o.fruit === 'honey') {
    ctx.beginPath(); ctx.moveTo(-s * 0.24, s * 0.04); ctx.quadraticCurveTo(-s * 0.1, s * 0.16, s * 0.05, s * 0.06); ctx.quadraticCurveTo(s * 0.14, s * 0.0, s * 0.24, s * 0.1);
    ctx.lineTo(s * 0.26, s * 0.2); ctx.quadraticCurveTo(s * 0.24, s * 0.3, s * 0.2, s * 0.2); ctx.quadraticCurveTo(s * 0.1, s * 0.16, s * 0.0, s * 0.24); ctx.quadraticCurveTo(-s * 0.1, s * 0.3, -s * 0.16, s * 0.18); ctx.quadraticCurveTo(-s * 0.22, s * 0.18, -s * 0.24, s * 0.04); ctx.closePath();
    ctx.fillStyle = 'rgba(240,170,40,.92)'; ctx.fill(); edge(ctx, s, '#a06a08', 0.016);
    glint(ctx, -s * 0.05, s * 0.09, s * 0.05, s * 0.014, -0.2, 0.7);
  } else {
    leaf(ctx, s * 0.44, s * 0.3, s * 0.26, s * 0.08, -0.9, '#3ab04a'); leaf(ctx, s * 0.44, s * 0.3, s * 0.22, s * 0.07, -0.2, '#2e9b3e');
  }
};

// Fan of sliced sandwich bread: brown crust, soft crumb, a pat of butter on the front slice.
illus.breadSlices = (ctx, s) => {
  // muffin-top slice silhouette in unit space (scaled by s before drawing); k = inset factor for the crumb
  const shape = (k) => {
    const w = 0.23 * k, b = 0.26 * k, sh = 0.31 * k;
    ctx.beginPath();
    ctx.moveTo(-w, b); ctx.lineTo(-w, 0.02);
    ctx.bezierCurveTo(-w, 0.02, -sh, 0.0, -sh, -0.11 * k);
    ctx.bezierCurveTo(-sh, -0.29 * k, -0.14 * k, -0.33 * k, 0, -0.33 * k);
    ctx.bezierCurveTo(0.14 * k, -0.33 * k, sh, -0.29 * k, sh, -0.11 * k);
    ctx.bezierCurveTo(sh, 0.0, w, 0.02, w, 0.02);
    ctx.lineTo(w, b); ctx.closePath();
  };
  const slice = (x, y, rot, sc, butter) => {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot); ctx.scale(s * sc, s * sc);
    shape(1); ctx.fillStyle = linGrad(ctx, 0, -0.33, 0, 0.26, [[0, '#d98a34'], [1, '#a9601c']]); ctx.fill(); ctx.strokeStyle = '#6a3a0c'; ctx.lineWidth = 0.032; ctx.lineJoin = 'round'; ctx.stroke();
    shape(0.86); ctx.fillStyle = radGrad(ctx, 0, -0.05, 0, 0.34, [[0, '#fffaea'], [1, '#f6e2b0']], -0.06, -0.12); ctx.fill();
    ctx.fillStyle = 'rgba(214,180,110,.55)';
    scatter(Math.round(x * 100) + 7, 22, 0, -0.02, 0.2, 0.22, (px, py) => { ctx.beginPath(); ctx.ellipse(px, py, 0.014, 0.008, px * 9, 0, TAU); ctx.fill(); });
    if (butter) {
      fillRR(ctx, -0.1, -0.16, 0.2, 0.13, 0.03, linGrad(ctx, 0, -0.16, 0, -0.03, [[0, '#fff2a8'], [1, '#ffd84a']]), '#c79a10', 0.018);
      glint(ctx, -0.04, -0.13, 0.05, 0.015, -0.1, 0.7);
    }
    ctx.restore();
  };
  slice(-0.24, -0.04, -0.2, 1.0, false);
  slice(0.26, -0.03, 0.2, 1.0, false);
  slice(0.0, 0.06, 0.0, 1.06, true);
};

// Soft bun split around a thick layer of pale-green pandan custard that oozes out, with pandan leaves fanned behind.
illus.custardBun = (ctx, s) => {
  for (const [sx, tilt, light] of [[-1, 0.75, 0], [1, 0.75, 0], [-1, 0.3, 1], [1, 0.3, 1]]) {   // pandan leaves
    ctx.save(); ctx.translate(sx * s * 0.1, s * 0.0); ctx.rotate(Math.PI + sx * tilt); ctx.translate(0, 0);
    tube(ctx, s * 0.6, s * 0.11, -sx * 0.1);
    ctx.fillStyle = light ? '#3ab04a' : '#2f9a45'; ctx.fill(); edge(ctx, s, '#175a26', 0.022);
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = s * 0.008; ctx.beginPath(); ctx.moveTo(0, s * 0.06); ctx.lineTo(0, s * 0.52); ctx.stroke();
    ctx.restore();
  }
  // bottom half of the bun
  ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.06); ctx.lineTo(s * 0.4, s * 0.06); ctx.bezierCurveTo(s * 0.42, s * 0.26, s * 0.28, s * 0.36, 0, s * 0.36); ctx.bezierCurveTo(-s * 0.28, s * 0.36, -s * 0.42, s * 0.26, -s * 0.4, s * 0.06); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, s * 0.06, 0, s * 0.36, [[0, '#f5d7a2'], [1, '#c98230']]); ctx.fill(); edge(ctx, s, '#6a3a0c', 0.03);
  // custard: a fat band with ooze lumps hanging over the front
  const band = () => {
    ctx.beginPath(); ctx.moveTo(-s * 0.44, -s * 0.01);
    ctx.bezierCurveTo(-s * 0.5, s * 0.06, -s * 0.42, s * 0.13, -s * 0.34, s * 0.11);
    ctx.bezierCurveTo(-s * 0.3, s * 0.2, -s * 0.2, s * 0.19, -s * 0.17, s * 0.11);
    ctx.bezierCurveTo(-s * 0.08, s * 0.14, s * 0.05, s * 0.12, s * 0.12, s * 0.1);
    ctx.bezierCurveTo(s * 0.16, s * 0.2, s * 0.28, s * 0.2, s * 0.3, s * 0.11);
    ctx.bezierCurveTo(s * 0.4, s * 0.14, s * 0.5, s * 0.07, s * 0.44, -s * 0.01);
    ctx.closePath();
  };
  band(); ctx.fillStyle = linGrad(ctx, 0, -s * 0.02, 0, s * 0.18, [[0, '#d6f39a'], [1, '#93d05a']]); ctx.fill(); edge(ctx, s, '#3d7a1e', 0.028);
  glint(ctx, -s * 0.24, s * 0.03, s * 0.09, s * 0.014, 0.05, 0.65);
  // top half, lifted and slightly turned
  ctx.save(); ctx.translate(0, -s * 0.03); ctx.rotate(-0.04);
  ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.bezierCurveTo(-s * 0.45, -s * 0.4, s * 0.45, -s * 0.4, s * 0.4, 0); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, -s * 0.12, 0, s * 0.5, [[0, '#f8cf8a'], [0.7, '#dc9440'], [1, '#b56a22']], -s * 0.12, -s * 0.22); ctx.fill(); edge(ctx, s, '#6a3a0c', 0.03);
  glint(ctx, -s * 0.16, -s * 0.22, s * 0.12, s * 0.035, -0.35, 0.6);
  ctx.strokeStyle = 'rgba(120,64,14,.4)'; ctx.lineWidth = s * 0.014;
  for (const x of [-0.14, 0.02, 0.18]) { ctx.beginPath(); ctx.moveTo(x * s, -s * 0.31 + Math.abs(x) * s * 0.35); ctx.quadraticCurveTo(x * s * 1.15, -s * 0.18, x * s * 1.1, -s * 0.05); ctx.stroke(); }
  ctx.restore();
};

// Butter croissant: a lumpy golden crescent (horns curling down), plump central segments and an egg-wash sheen.
illus.croissantHero = (ctx, s) => {
  const R = s * 0.37, cy = s * 0.2, span = 1.2, n = 7;
  const at = (t) => -Math.PI / 2 - span + 2 * span * t;
  const half = (t) => s * 0.14 * Math.pow(Math.sin(Math.PI * (0.015 + 0.97 * t)), 0.7);
  const pt = (t, k) => { const a = at(t), r = R + k * half(t); return [Math.cos(a) * r, cy + Math.sin(a) * r]; };
  // dark base crescent so the gaps between lumps read as shadow
  const N = 48;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) { const [x, y] = pt(i / N, 0.85); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
  for (let i = N; i >= 0; i--) { const [x, y] = pt(i / N, -0.85); ctx.lineTo(x, y); }
  ctx.closePath(); ctx.fillStyle = '#b8681c'; ctx.fill(); edge(ctx, s, '#6e3d0c', 0.03);
  // lumps: ends first, centre last
  const order = [];
  for (let i = 0; i < n; i++) order.push(i);
  order.sort((a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2));
  for (const i of order) {
    const t = 0.06 + 0.88 * (i / (n - 1));
    const a = at(t), [x, y] = pt(t, 0);
    const ry = half(t) * 1.3, rx = s * 0.085;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a - Math.PI / 2);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, ry * 1.3, [[0, '#ffd88a'], [0.55, '#f0a63c'], [1, '#c4741e']], -rx * 0.3, -ry * 0.45); ctx.fill();
    edge(ctx, s, '#6e3d0c', 0.028);
    ctx.strokeStyle = 'rgba(255,240,200,.75)'; ctx.lineWidth = s * 0.016;
    ctx.beginPath(); ctx.arc(-rx * 0.05, ry * 0.05, ry * 0.6, Math.PI * 0.42, Math.PI * 0.92); ctx.stroke();
    ctx.restore();
  }
  // crumbs
  ctx.fillStyle = '#c4741e';
  scatter(31, 7, 0, s * 0.46, s * 0.42, s * 0.03, (x, y) => { ctx.beginPath(); ctx.ellipse(x, y, s * 0.014, s * 0.009, 0.4, 0, TAU); ctx.fill(); });
};

// Soft bun buried under a fluffy mound of savoury pork floss with a ribbon of mayo.
illus.porkFlossBun = (ctx, s) => {
  // bun
  ctx.beginPath(); ctx.moveTo(-s * 0.44, s * 0.06); ctx.bezierCurveTo(-s * 0.46, -s * 0.12, -s * 0.3, -s * 0.16, 0, -s * 0.16); ctx.bezierCurveTo(s * 0.3, -s * 0.16, s * 0.46, -s * 0.12, s * 0.44, s * 0.06);
  ctx.bezierCurveTo(s * 0.44, s * 0.26, s * 0.3, s * 0.32, 0, s * 0.32); ctx.bezierCurveTo(-s * 0.3, s * 0.32, -s * 0.44, s * 0.26, -s * 0.44, s * 0.06); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, -s * 0.16, 0, s * 0.32, [[0, '#f3c26e'], [0.6, '#dc9440'], [1, '#b56a22']]); ctx.fill(); edge(ctx, s, '#6a3a0c', 0.03);
  ctx.strokeStyle = 'rgba(255,240,200,.5)'; ctx.lineWidth = s * 0.016; ctx.beginPath(); ctx.moveTo(-s * 0.36, s * 0.16); ctx.quadraticCurveTo(-s * 0.3, s * 0.26, -s * 0.16, s * 0.28); ctx.stroke();
  // floss mound
  blob(ctx, 0, -s * 0.13, s * 0.36, s * 0.17, 12, 0.12, 15);
  ctx.fillStyle = linGrad(ctx, 0, -s * 0.3, 0, s * 0.04, [[0, '#dca04c'], [1, '#b8742c']]); ctx.fill(); edge(ctx, s, '#6a3a0c', 0.028);
  const tones = ['#f2c67a', '#d99a48', '#b8742c', '#8f531c'];
  const r = rng(77);
  for (let i = 0; i < 110; i++) {
    const a = r() * TAU, d = Math.sqrt(r());
    const x = Math.cos(a) * d * s * 0.34, y = -s * 0.13 + Math.sin(a) * d * s * 0.15;
    const len = s * (0.05 + r() * 0.07), ang = -0.6 + r() * 1.2 + (r() > 0.5 ? Math.PI : 0);
    ctx.strokeStyle = tones[Math.floor(r() * 4)]; ctx.lineWidth = s * (0.008 + r() * 0.008);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5 - len * 0.3, x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
  }
  // mayo ribbon
  ctx.strokeStyle = '#fffdf2'; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.09); for (let i = 1; i <= 8; i++) ctx.lineTo(-s * 0.3 + i * s * 0.075, -s * 0.09 + (i % 2 ? -s * 0.05 : s * 0.03)); ctx.stroke();
  ctx.strokeStyle = '#d7c7a0'; ctx.lineWidth = s * 0.008; ctx.stroke();
};

// Golden bun split down the middle with a plump swirl of vanilla cream, dusted with sugar.
illus.creamBun = (ctx, s) => {
  // cream rope behind the top of the bun
  const bunPath = () => {
    ctx.beginPath(); ctx.moveTo(-s * 0.44, s * 0.08); ctx.bezierCurveTo(-s * 0.46, -s * 0.2, -s * 0.28, -s * 0.24, 0, -s * 0.24); ctx.bezierCurveTo(s * 0.28, -s * 0.24, s * 0.46, -s * 0.2, s * 0.44, s * 0.08);
    ctx.bezierCurveTo(s * 0.44, s * 0.28, s * 0.3, s * 0.34, 0, s * 0.34); ctx.bezierCurveTo(-s * 0.3, s * 0.34, -s * 0.44, s * 0.28, -s * 0.44, s * 0.08); ctx.closePath();
  };
  bunPath(); ctx.fillStyle = linGrad(ctx, 0, -s * 0.24, 0, s * 0.34, [[0, '#f6cb7c'], [0.6, '#e2a24a'], [1, '#bb7226']]); ctx.fill(); edge(ctx, s, '#6a3a0c', 0.03);
  // slit
  ctx.beginPath(); ctx.moveTo(-s * 0.36, -s * 0.06); ctx.quadraticCurveTo(0, s * 0.06, s * 0.36, -s * 0.06); ctx.quadraticCurveTo(0, s * 0.0, -s * 0.36, -s * 0.06);
  ctx.fillStyle = '#8a4e16'; ctx.fill();
  // cream lobes
  const lobe = (x, y, rx, ry) => { ctx.beginPath(); ctx.ellipse(x * s, y * s, rx * s, ry * s, 0, 0, TAU); ctx.fillStyle = radGrad(ctx, x * s, y * s, 0, rx * s * 1.1, [[0, '#ffffff'], [1, '#fff0c8']], (x - rx * 0.3) * s, (y - ry * 0.4) * s); ctx.fill(); edge(ctx, s, '#b39560', 0.024); };
  lobe(-0.22, -0.1, 0.16, 0.1); lobe(0.0, -0.13, 0.17, 0.11); lobe(0.22, -0.1, 0.16, 0.1);
  ctx.beginPath(); ctx.moveTo(-s * 0.06, -s * 0.2); ctx.quadraticCurveTo(0, -s * 0.34, s * 0.07, -s * 0.22); ctx.quadraticCurveTo(s * 0.02, -s * 0.2, -s * 0.06, -s * 0.2);
  ctx.fillStyle = '#fffaf0'; ctx.fill(); edge(ctx, s, '#b39560', 0.02);
  // sugar dust + shine
  ctx.fillStyle = 'rgba(255,255,255,.9)'; scatter(5, 26, 0, s * 0.15, s * 0.36, s * 0.13, (x, y) => { ctx.beginPath(); ctx.arc(x, y, s * 0.008, 0, TAU); ctx.fill(); });
  glint(ctx, -s * 0.3, s * 0.2, s * 0.08, s * 0.02, -0.3, 0.5);
};

// Swiss-style cake roll: the log with its spiral cut face, plus a slice. o.sponge / o.cream / o.dust.
illus.swissRoll = (ctx, s, o = {}) => {
  const sponge = o.sponge || '#7ac74f', cream = o.cream || '#fff6dc';
  const spiral = (cx, cy, R) => {
    circle(ctx, cx, cy, R, sponge, darken(sponge, 0.5), s * 0.03);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, 0, TAU); ctx.clip();
    ctx.strokeStyle = cream; ctx.lineWidth = R * 0.24; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a <= TAU * 2.25; a += 0.12) { const rr = R * (0.12 + 0.86 * (a / (TAU * 2.25))); a ? ctx.lineTo(cx + Math.cos(a) * rr * 0.93, cy + Math.sin(a) * rr * 0.93) : ctx.moveTo(cx + rr * 0.1, cy); }
    ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); edge(ctx, s, darken(sponge, 0.5), 0.03);
  };
  // log body
  const x0 = -s * 0.02, x1 = s * 0.4, R = s * 0.2;
  ctx.save(); ctx.translate(0, -s * 0.05); ctx.rotate(-0.12);
  ctx.beginPath(); ctx.moveTo(x0, -R); ctx.lineTo(x1 - R * 0.6, -R); ctx.quadraticCurveTo(x1 + R * 0.3, -R, x1 + R * 0.3, 0); ctx.quadraticCurveTo(x1 + R * 0.3, R, x1 - R * 0.6, R); ctx.lineTo(x0, R); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, -R, 0, R, [[0, lighten(sponge, 0.18)], [0.6, sponge], [1, darken(sponge, 0.22)]]); ctx.fill(); edge(ctx, s, darken(sponge, 0.55), 0.03);
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(x0 + R, -R * 0.55); ctx.lineTo(x1 - R * 0.2, -R * 0.55); ctx.stroke();
  if (o.dust) { ctx.fillStyle = o.dust; scatter(2, 30, (x0 + x1) / 2, 0, (x1 - x0) / 2, R * 0.85, (x, y) => { ctx.beginPath(); ctx.arc(x, y, s * 0.006, 0, TAU); ctx.fill(); }); }
  spiral(x0, 0, R);
  ctx.restore();
  // loose slice, front-left
  ctx.save(); ctx.translate(-s * 0.3, s * 0.22);
  ctx.beginPath(); ctx.ellipse(s * 0.03, s * 0.03, s * 0.17, s * 0.17, 0, 0, TAU); ctx.fillStyle = darken(sponge, 0.3); ctx.fill();
  spiral(0, 0, s * 0.17);
  ctx.restore();
};

// Loaf cake in three-quarter view: cracked golden top, crumb end face, crust side. o.topping = 'banana' adds coins and a banana.
illus.loafCake = (ctx, s, o = {}) => {
  const crust = o.crust || '#c98a34', crumb = o.crumb || '#f7d98a';
  const A = s * 0.36, B = s * 0.66, H = s * 0.3;
  const u = [0.866, -0.5], v = [-0.866, -0.5];
  const F = [s * 0.14, s * 0.13];
  const add = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k];
  const P1 = add(F, u, A), P3 = add(F, v, B), P2 = add(P1, v, B);
  const dn = (p, k = H) => [p[0], p[1] + k];
  const face = (pts, fill, ol = '#5e330b', f = 0.03) => { poly(ctx, pts, fill, ol, s * f); };
  if (o.topping === 'banana') {   // banana behind the loaf
    ctx.save(); ctx.translate(s * 0.3, -s * 0.02); ctx.rotate(-1.0); tube(ctx, s * 0.42, s * 0.12, 0.2);
    ctx.fillStyle = '#ffd92a'; ctx.fill(); edge(ctx, s, '#8a6a10', 0.026);
    ctx.fillStyle = '#5a3a10'; ctx.beginPath(); ctx.ellipse(0, s * 0.01, s * 0.028, s * 0.028, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // long side (crust)
  face([F, P3, dn(P3), dn(F)], linGrad(ctx, F[0], F[1], P3[0], P3[1] + H, [[0, darken(crust, 0.1)], [1, darken(crust, 0.38)]]));
  ctx.strokeStyle = 'rgba(255,220,150,.28)'; ctx.lineWidth = s * 0.012;
  for (const k of [0.3, 0.55]) { const a = add(F, v, B * 0.08), b = add(F, v, B * 0.92); ctx.beginPath(); ctx.moveTo(a[0], a[1] + H * k); ctx.lineTo(b[0], b[1] + H * k); ctx.stroke(); }
  // end face (crumb) with a crust rim
  face([F, P1, dn(P1), dn(F)], crust);
  const ins = (t) => [add(add(F, u, A * t), [0, 1], H * t), add(add(F, u, A * (1 - t)), [0, 1], H * t), add(add(F, u, A * (1 - t)), [0, 1], H * (1 - t)), add(add(F, u, A * t), [0, 1], H * (1 - t))];
  const Cend = [F[0] + u[0] * A * 0.5, F[1] + u[1] * A * 0.5 + H * 0.5];
  poly(ctx, ins(0.09), radGrad(ctx, Cend[0], Cend[1], 0, A, [[0, lighten(crumb, 0.3)], [1, crumb]]));
  ctx.fillStyle = 'rgba(160,110,40,.55)';
  scatter(4, 18, Cend[0], Cend[1], A * 0.3, H * 0.28, (x, y) => { ctx.beginPath(); ctx.ellipse(x, y, s * 0.012, s * 0.007, 0.3, 0, TAU); ctx.fill(); });
  if (o.topping === 'banana') { ctx.fillStyle = '#e8c04a'; for (const [x, y] of [[0.3, 0.3], [0.68, 0.55], [0.5, 0.75]]) { const p = add(add(F, u, A * x), [0, 1], H * y); ctx.beginPath(); ctx.ellipse(p[0], p[1], s * 0.03, s * 0.022, 0.3, 0, TAU); ctx.fill(); } }
  // top (golden, domed, cracked)
  face([F, P1, P2, P3], linGrad(ctx, F[0], F[1], P2[0], P2[1], [[0, lighten(crust, 0.22)], [1, crust]]));
  const mid = (k) => add(add(F, u, A * 0.5), v, B * k);
  ctx.strokeStyle = 'rgba(90,45,8,.7)'; ctx.lineWidth = s * 0.02;
  ctx.beginPath(); ctx.moveTo(...mid(0.06)); for (let i = 1; i <= 8; i++) { const p = mid(0.06 + i * 0.11); ctx.lineTo(p[0] + (i % 2 ? s * 0.012 : -s * 0.012), p[1] + (i % 2 ? -s * 0.006 : s * 0.006)); } ctx.stroke();
  glint(ctx, mid(0.3)[0] + s * 0.07, mid(0.3)[1] - s * 0.01, s * 0.1, s * 0.022, -0.5, 0.35);
  if (o.topping === 'banana') {
    for (const k of [0.16, 0.38, 0.6, 0.82]) {
      const p = mid(k);
      ctx.beginPath(); ctx.ellipse(p[0], p[1], s * 0.075, s * 0.05, -0.5, 0, TAU); ctx.fillStyle = '#ffe680'; ctx.fill(); edge(ctx, s, '#a27a10', 0.022);
      ctx.beginPath(); ctx.ellipse(p[0], p[1], s * 0.03, s * 0.02, -0.5, 0, TAU); ctx.fillStyle = '#e8c04a'; ctx.fill();
    }
  }
  // outline the whole silhouette once more for a clean edge
  poly(ctx, [F, P1, P2, P3], null, '#5e330b', s * 0.03);
};

// Stack of fudgy brownie slabs with crackled shiny tops and walnut pieces.
illus.brownie = (ctx, s) => {
  const nut = (c, x, y, w, rot) => {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.moveTo(-w, 0); c.bezierCurveTo(-w * 0.8, -w * 0.9, w * 0.2, -w, w, -w * 0.1); c.bezierCurveTo(w * 0.8, w * 0.7, -w * 0.4, w * 0.8, -w, 0); c.closePath();
    c.fillStyle = '#d2a066'; c.fill(); c.strokeStyle = '#7a4a1a'; c.lineWidth = w * 0.2; c.lineJoin = 'round'; c.stroke();
    c.strokeStyle = 'rgba(122,74,26,.6)'; c.lineWidth = w * 0.1; c.beginPath(); c.moveTo(-w * 0.4, -w * 0.1); c.lineTo(w * 0.4, -w * 0.05); c.stroke();
    c.restore();
  };
  const brown = '#5a2c16';
  const top = (seed) => (c, w) => {
    c.strokeStyle = '#a06a44'; c.lineWidth = w * 0.03; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-w * 0.3, -w * 0.3); c.lineTo(-w * 0.08, -w * 0.22); c.lineTo(w * 0.1, -w * 0.3); c.lineTo(w * 0.28, -w * 0.2); c.stroke();
    c.beginPath(); c.moveTo(-w * 0.14, -w * 0.12); c.lineTo(w * 0.02, -w * 0.04); c.lineTo(w * 0.2, -w * 0.1); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(-w * 0.22, -w * 0.33, w * 0.1, w * 0.03, -0.3, 0, TAU); c.fill();
    if (seed) { nut(c, w * 0.04, -w * 0.28, w * 0.07, 0.4); nut(c, -w * 0.3, -w * 0.15, w * 0.06, -0.5); nut(c, w * 0.3, -w * 0.12, w * 0.06, 0.8); }
    else nut(c, -w * 0.08, -w * 0.2, w * 0.07, -0.3);
    // fudgy pores on the side faces
    c.fillStyle = 'rgba(200,140,90,.4)';
    scatter(seed ? 3 : 5, 9, -w * 0.24, w * 0.1, w * 0.18, w * 0.1, (x, y) => { c.beginPath(); c.ellipse(x, y, w * 0.014, w * 0.009, 0.3, 0, TAU); c.fill(); });
    scatter(seed ? 8 : 2, 9, w * 0.24, w * 0.1, w * 0.18, w * 0.1, (x, y) => { c.beginPath(); c.ellipse(x, y, w * 0.014, w * 0.009, -0.3, 0, TAU); c.fill(); });
  };
  const w = s * 0.58, v = w * 0.4;
  cube(ctx, -s * 0.2, s * 0.22, w, brown, { v, detail: top(0) });
  cube(ctx, s * 0.24, s * 0.2, w, brown, { v, detail: top(1) });
  cube(ctx, s * 0.02, -s * 0.06, w, brown, { v, detail: top(1) });
};

// Three muffins in paper cases with domed, chocolate-chip tops.
illus.miniMuffins = (ctx, s) => {
  const muffin = (x, y, k) => {
    ctx.save(); ctx.translate(x * s, y * s); ctx.scale(k, k);
    // paper case (behind the dome's lower edge)
    ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.02); ctx.lineTo(-s * 0.15, s * 0.3); ctx.quadraticCurveTo(0, s * 0.34, s * 0.15, s * 0.3); ctx.lineTo(s * 0.2, -s * 0.02); ctx.closePath();
    ctx.fillStyle = linGrad(ctx, -s * 0.2, 0, s * 0.2, 0, [[0, '#e9d6a8'], [0.5, '#fbf1d6'], [1, '#e2cd9a']]); ctx.fill(); edge(ctx, s, '#8a6a3a', 0.026);
    ctx.strokeStyle = 'rgba(138,106,58,.55)'; ctx.lineWidth = s * 0.012;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.055, s * 0.0); ctx.lineTo(i * s * 0.042, s * 0.3); ctx.stroke(); }
    // dome
    ctx.beginPath(); ctx.moveTo(-s * 0.25, s * 0.02); ctx.bezierCurveTo(-s * 0.3, -s * 0.12, -s * 0.2, -s * 0.28, 0, -s * 0.28); ctx.bezierCurveTo(s * 0.2, -s * 0.28, s * 0.3, -s * 0.12, s * 0.25, s * 0.02);
    ctx.bezierCurveTo(s * 0.12, s * 0.06, -s * 0.12, s * 0.06, -s * 0.25, s * 0.02); ctx.closePath();
    ctx.fillStyle = radGrad(ctx, 0, -s * 0.1, 0, s * 0.34, [[0, '#f5c574'], [0.65, '#dc9440'], [1, '#b56a22']], -s * 0.08, -s * 0.16); ctx.fill(); edge(ctx, s, '#6a3a0c', 0.03);
    ctx.fillStyle = '#3b1f10';
    for (const [cx2, cy2] of [[-0.12, -0.14], [0.05, -0.19], [0.14, -0.08], [-0.03, -0.06], [-0.17, -0.03], [0.02, -0.25]]) { ctx.beginPath(); ctx.ellipse(cx2 * s, cy2 * s, s * 0.026, s * 0.019, cx2 * 6, 0, TAU); ctx.fill(); }
    glint(ctx, -s * 0.1, -s * 0.22, s * 0.07, s * 0.02, -0.4, 0.55);
    ctx.restore();
  };
  muffin(-0.32, 0.1, 0.92); muffin(0.32, 0.1, 0.92); muffin(0, 0.02, 1.08);
};

// Paddle-shaped rainbow ice lolly on a wooden stick, with a little lion mascot peeking from behind.
illus.paddlePop = (ctx, s, o = {}) => {
  const bands = o.bands || ['#ff3b5c', '#ffd93a', '#33c46b', '#3aa0ff'];
  // sparkles
  ctx.fillStyle = o.spark || '#ffd93a';
  for (const [x, y, r] of [[0.33, -0.36, 0.04], [0.4, -0.16, 0.03], [-0.36, 0.12, 0.03]]) { ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(0.4); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? r * 0.4 : r; ctx.lineTo(Math.cos(a) * rr * s, Math.sin(a) * rr * s); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.translate(s * 0.03, s * 0.04); ctx.rotate(-0.28);
  // stick
  fillRR(ctx, -s * 0.06, s * 0.2, s * 0.12, s * 0.3, s * 0.05, '#e9c88e', '#8a6a30', s * 0.022);
  // lolly body
  const w = s * 0.34, top = -s * 0.42, bot = s * 0.26;
  const body = () => { ctx.beginPath(); ctx.moveTo(-w / 2, bot); ctx.lineTo(-w / 2, top + w * 0.5); ctx.arc(0, top + w * 0.5, w / 2, Math.PI, 0); ctx.lineTo(w / 2, bot); ctx.closePath(); };
  body(); ctx.fillStyle = bands[bands.length - 1]; ctx.fill();
  ctx.save(); body(); ctx.clip();
  const bh = (bot - top) / bands.length;
  bands.forEach((c, i) => { ctx.fillStyle = linGrad(ctx, 0, top + bh * i, 0, top + bh * (i + 1), [[0, lighten(c, 0.1)], [1, c]]); ctx.fillRect(-w, top + bh * i, w * 2, bh + 1); });
  // melt wave between bands
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = s * 0.012;
  for (let i = 1; i < bands.length; i++) { ctx.beginPath(); ctx.moveTo(-w / 2, top + bh * i); ctx.quadraticCurveTo(-w / 4, top + bh * i + s * 0.03, 0, top + bh * i); ctx.quadraticCurveTo(w / 4, top + bh * i - s * 0.03, w / 2, top + bh * i); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-w * 0.36, top + w * 0.35, w * 0.12, (bot - top) * 0.7);
  ctx.restore();
  body(); edge(ctx, s, '#2a2a5a', 0.034);
  ctx.restore();
  // lion mascot, top-left
  const lion = (cx, cy, R) => {
    for (let i = 0; i < 12; i++) {   // pointed mane tufts
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((i * TAU) / 12 + 0.13);
      ctx.beginPath(); ctx.moveTo(R * 0.5, -R * 0.24); ctx.quadraticCurveTo(R * 1.0, -R * 0.3, R * 1.4, 0); ctx.quadraticCurveTo(R * 1.0, R * 0.3, R * 0.5, R * 0.24); ctx.closePath();
      ctx.fillStyle = i % 2 ? '#ff8a1a' : '#ff6a10'; ctx.fill(); edge(ctx, s, '#7a3a0a', 0.014); ctx.restore();
    }
    for (const sx of [-1, 1]) { circle(ctx, cx + sx * R * 0.62, cy - R * 0.62, R * 0.26, '#ffcf5a', '#7a3a0a', s * 0.016); circle(ctx, cx + sx * R * 0.62, cy - R * 0.62, R * 0.13, '#ff9a7a'); }
    circle(ctx, cx, cy, R * 0.82, '#ffcf5a', '#7a3a0a', s * 0.02);
    circle(ctx, cx - R * 0.3, cy - R * 0.12, R * 0.09, '#222'); circle(ctx, cx + R * 0.3, cy - R * 0.12, R * 0.09, '#222');
    ellipse(ctx, cx, cy + R * 0.22, R * 0.3, R * 0.22, '#fff3d6', '#7a3a0a', s * 0.012); ellipse(ctx, cx, cy + R * 0.08, R * 0.1, R * 0.07, '#7a3a2a');
    ctx.strokeStyle = '#7a3a0a'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.arc(cx, cy + R * 0.24, R * 0.12, 0.2, Math.PI - 0.2); ctx.stroke();
  };
  lion(-s * 0.26, -s * 0.27, s * 0.16);
};

// Chocolate-dipped ice cream bar on a stick, with a bite out of the end. o.nuts = almond pieces, o.coat, o.cream.
illus.magnumBar = (ctx, s, o = {}) => {
  const coat = o.coat || '#4a2210', cream = o.cream || '#fff0c4';
  ctx.save(); ctx.rotate(-0.62);
  const L2 = s * 0.36, H2 = s * 0.17, r = s * 0.09;
  // stick
  fillRR(ctx, -L2 - s * 0.26, -s * 0.045, s * 0.34, s * 0.09, s * 0.03, '#e9c88e', '#8a6a30', s * 0.02);
  // bar path with a scalloped bite at the top-right corner
  const bar = () => {
    ctx.beginPath();
    ctx.moveTo(-L2 + r, -H2); ctx.lineTo(L2 * 0.32, -H2);
    ctx.arc(L2 * 0.44, -H2 - s * 0.005, s * 0.055, Math.PI * 1.05, Math.PI * 0.45, true);
    ctx.arc(L2 * 0.72, -H2 * 0.34, s * 0.06, Math.PI * 1.25, Math.PI * 0.42, true);
    ctx.arc(L2 - s * 0.01, H2 * 0.12, s * 0.05, Math.PI * 1.3, Math.PI * 0.55, true);
    ctx.lineTo(L2, H2 - r); ctx.arcTo(L2, H2, L2 - r, H2, r);
    ctx.lineTo(-L2 + r, H2); ctx.arcTo(-L2, H2, -L2, H2 - r, r);
    ctx.lineTo(-L2, -H2 + r); ctx.arcTo(-L2, -H2, -L2 + r, -H2, r); ctx.closePath();
  };
  bar(); ctx.fillStyle = linGrad(ctx, 0, -H2, 0, H2, [[0, lighten(coat, 0.22)], [0.5, coat], [1, darken(coat, 0.35)]]); ctx.fill();
  // vanilla ice cream showing along the bite only
  ctx.save(); bar(); ctx.clip(); ctx.beginPath(); ctx.rect(L2 * 0.2, -H2 * 2, L2, H2 * 2.6); ctx.clip();
  ctx.strokeStyle = cream; ctx.lineWidth = s * 0.06; bar(); ctx.stroke();
  ctx.restore();
  bar(); ctx.strokeStyle = darken(coat, 0.6); lw(ctx, s, 0.028); ctx.stroke();
  // gloss
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = s * 0.026; ctx.beginPath(); ctx.moveTo(-L2 * 0.8, -H2 * 0.55); ctx.lineTo(L2 * 0.05, -H2 * 0.55); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = s * 0.014; ctx.beginPath(); ctx.moveTo(-L2 * 0.6, H2 * 0.5); ctx.lineTo(-L2 * 0.1, H2 * 0.5); ctx.stroke();
  if (o.nuts) {
    for (const [x, y, a] of [[-0.24, -0.05, 0.4], [-0.08, 0.06, -0.5], [0.06, -0.08, 0.9], [-0.3, 0.07, -0.2], [0.14, 0.05, 0.3], [-0.16, -0.11, -0.7]]) {
      ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-s * 0.045, 0); ctx.quadraticCurveTo(0, -s * 0.045, s * 0.05, 0); ctx.quadraticCurveTo(0, s * 0.04, -s * 0.045, 0); ctx.fillStyle = '#e2b984'; ctx.fill(); edge(ctx, s, '#8a5a2a', 0.014); ctx.restore();
    }
  }
  ctx.restore();
};

// Cornetto-style waffle cone in a paper sleeve, ice cream swirl with sauce and crunchy bits.
illus.cornettoCone = (ctx, s, o = {}) => {
  const cream = o.cream || '#fff3d0', sauce = o.sauce || '#4a2210', sleeve = o.sleeve || '#c8102e', bits = o.bits || '#c8965a';
  ctx.save(); ctx.translate(0, s * 0.02); ctx.rotate(-0.22);
  const cone = () => { ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.06); ctx.lineTo(0, s * 0.46); ctx.lineTo(s * 0.2, -s * 0.06); ctx.closePath(); };
  cone(); ctx.fillStyle = linGrad(ctx, -s * 0.2, 0, s * 0.2, 0, [[0, '#e8b46a'], [0.5, '#f4cf8a'], [1, '#c98a3a']]); ctx.fill();
  ctx.save(); cone(); ctx.clip();
  ctx.strokeStyle = 'rgba(140,84,24,.55)'; ctx.lineWidth = s * 0.014;
  for (let k = -5; k <= 5; k++) { ctx.beginPath(); ctx.moveTo(k * s * 0.06 - s * 0.3, -s * 0.1); ctx.lineTo(k * s * 0.06 + s * 0.2, s * 0.5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(k * s * 0.06 + s * 0.3, -s * 0.1); ctx.lineTo(k * s * 0.06 - s * 0.2, s * 0.5); ctx.stroke(); }
  // paper sleeve
  ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.13); for (let i = 0; i <= 6; i++) ctx.lineTo(-s * 0.3 + i * s * 0.1, s * 0.13 + (i % 2 ? -s * 0.03 : s * 0.02)); ctx.lineTo(s * 0.3, s * 0.6); ctx.lineTo(-s * 0.3, s * 0.6); ctx.closePath();
  ctx.fillStyle = sleeve; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(-s * 0.3, s * 0.22, s * 0.6, s * 0.035);
  ctx.restore();
  cone(); edge(ctx, s, '#6a3a0c', 0.03);
  // ice cream swirl (3 tiers) with sauce
  const tier = (y, rx, ry) => { ctx.beginPath(); ctx.ellipse(0, y * s, rx * s, ry * s, 0, 0, TAU); ctx.fillStyle = radGrad(ctx, 0, y * s, 0, rx * s * 1.2, [[0, lighten(cream, 0.4)], [1, cream]], -rx * s * 0.3, (y - ry * 0.4) * s); ctx.fill(); edge(ctx, s, darken(cream, 0.5), 0.026); };
  tier(-0.08, 0.27, 0.12); tier(-0.2, 0.21, 0.1); tier(-0.3, 0.14, 0.08);
  ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.34); ctx.quadraticCurveTo(0, -s * 0.5, s * 0.07, -s * 0.34); ctx.closePath(); ctx.fillStyle = cream; ctx.fill(); edge(ctx, s, darken(cream, 0.5), 0.024);
  // sauce cap + drips
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.24); ctx.quadraticCurveTo(0, -s * 0.36, s * 0.2, -s * 0.24);
  ctx.lineTo(s * 0.21, -s * 0.16); ctx.quadraticCurveTo(s * 0.2, -s * 0.08, s * 0.16, -s * 0.16); ctx.quadraticCurveTo(s * 0.12, -s * 0.12, s * 0.09, -s * 0.2); ctx.quadraticCurveTo(s * 0.02, -s * 0.1, -s * 0.05, -s * 0.2);
  ctx.quadraticCurveTo(-s * 0.1, -s * 0.09, -s * 0.15, -s * 0.18); ctx.quadraticCurveTo(-s * 0.2, -s * 0.12, -s * 0.21, -s * 0.18); ctx.closePath();
  ctx.fillStyle = sauce; ctx.fill(); edge(ctx, s, darken(sauce, 0.5), 0.02);
  glint(ctx, -s * 0.07, -s * 0.28, s * 0.05, s * 0.014, -0.3, 0.5);
  ctx.fillStyle = bits; scatter(9, 9, 0, -s * 0.27, s * 0.16, s * 0.05, (x, y, i, r) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 3); ctx.fillRect(-s * 0.018, -s * 0.011, s * 0.036, s * 0.022); ctx.restore(); });
  ctx.restore();
};

// Scoops of ice cream in a dish. o: { scoops:[colours], sauce, garnish:'wafer'|'strawberry'|'cookie'|'corn'|'nuts'|'leaf'|'vanilla',
// bowl:'glass'|'coconut'|'none', bowlColor }. Wide-friendly (about 1.4s wide).
illus.iceScoops = (ctx, s, o = {}) => {
  const scoops = o.scoops || ['#fff0c4', '#6b3a1e'];
  const bowl = o.bowl || 'glass';
  const n = scoops.length;
  // garnish that sits behind
  if (o.garnish === 'wafer') {
    for (const [x, a] of [[0.34, 0.5], [0.44, 0.7]]) { ctx.save(); ctx.translate(x * s, -s * 0.02); ctx.rotate(a);
      fillRR(ctx, -s * 0.06, -s * 0.32, s * 0.12, s * 0.5, s * 0.015, '#efcf92', '#9a6a2a', s * 0.02);
      ctx.strokeStyle = 'rgba(154,106,42,.6)'; ctx.lineWidth = s * 0.01; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-s * 0.06, -s * 0.28 + k * s * 0.08); ctx.lineTo(s * 0.06, -s * 0.22 + k * s * 0.08); ctx.stroke(); }
      ctx.restore(); }
  }
  if (o.garnish === 'corn') {
    ctx.save(); ctx.translate(-s * 0.52, -s * 0.02); ctx.rotate(-0.5);
    leaf(ctx, 0, s * 0.1, s * 0.4, s * 0.09, -Math.PI / 2 - 0.5, '#4cae4a'); leaf(ctx, 0, s * 0.1, s * 0.4, s * 0.09, -Math.PI / 2 + 0.5, '#3a9a3a');
    ctx.beginPath(); ctx.ellipse(0, -s * 0.02, s * 0.1, s * 0.24, 0, 0, TAU); ctx.fillStyle = '#ffd93a'; ctx.fill(); edge(ctx, s, '#a87a10', 0.024);
    ctx.fillStyle = '#ffec8a'; for (let i = -3; i <= 3; i++) for (let j = -4; j <= 3; j++) { ctx.beginPath(); ctx.ellipse(i * s * 0.026, j * s * 0.05, s * 0.011, s * 0.019, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // dish (back half)
  if (bowl === 'glass') {
    ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.06); ctx.bezierCurveTo(-s * 0.46, s * 0.34, -s * 0.2, s * 0.42, 0, s * 0.42); ctx.bezierCurveTo(s * 0.2, s * 0.42, s * 0.46, s * 0.34, s * 0.5, s * 0.06); ctx.closePath();
    ctx.fillStyle = 'rgba(232,244,250,.95)'; ctx.fill(); edge(ctx, s, o.bowlColor || '#5f7387', 0.03);
  }
  // scoops (foot ruffle at the bottom)
  const scoop = (x, y, R, c) => {
    ctx.beginPath(); ctx.arc(x, y, R, Math.PI * 0.94, Math.PI * 2.06);
    const k = 6; for (let i = 0; i <= k; i++) { const px = x + R * 1.02 - (i / k) * R * 2.04, py = y + R * 0.05 + (i % 2 ? R * 0.32 : R * 0.2); ctx.quadraticCurveTo(px + R * 0.17, py + R * 0.15, px, py); }
    ctx.closePath(); ctx.fillStyle = radGrad(ctx, x, y, 0, R * 1.3, [[0, lighten(c, 0.3)], [0.6, c], [1, darken(c, 0.16)]], x - R * 0.35, y - R * 0.4); ctx.fill(); edge(ctx, s, darken(c, 0.55), 0.03);
    glint(ctx, x - R * 0.35, y - R * 0.4, R * 0.28, R * 0.12, -0.6, 0.55);
    if (o.flecks) { ctx.fillStyle = o.flecks; scatter(Math.round(x * 100), 10, x, y, R * 0.7, R * 0.6, (px, py) => { ctx.beginPath(); ctx.arc(px, py, R * 0.035, 0, TAU); ctx.fill(); }); }
  };
  const R = s * (n === 1 ? (bowl === 'none' ? 0.36 : 0.3) : n === 2 ? 0.25 : 0.2);
  if (n === 1) scoop(0, bowl === 'none' ? s * 0.02 : -s * 0.05, R, scoops[0]);
  else if (n === 2) { scoop(-s * 0.2, -s * 0.03, R, scoops[0]); scoop(s * 0.2, -s * 0.03, R, scoops[1]); }
  else { scoop(-s * 0.3, s * 0.0, R, scoops[0]); scoop(s * 0.3, s * 0.0, R, scoops[2]); scoop(0, -s * 0.1, R * 1.1, scoops[1]); }
  // sauce over the middle
  if (o.sauce) {
    ctx.beginPath(); ctx.moveTo(-s * 0.16, -s * 0.2); ctx.quadraticCurveTo(0, -s * 0.34, s * 0.16, -s * 0.2); ctx.quadraticCurveTo(s * 0.13, -s * 0.06, s * 0.08, -s * 0.13); ctx.quadraticCurveTo(s * 0.03, -s * 0.02, -s * 0.03, -s * 0.13); ctx.quadraticCurveTo(-s * 0.09, -s * 0.05, -s * 0.16, -s * 0.2); ctx.closePath();
    ctx.fillStyle = o.sauce; ctx.fill(); edge(ctx, s, darken(o.sauce, 0.5), 0.02); glint(ctx, -s * 0.05, -s * 0.24, s * 0.04, s * 0.011, -0.2, 0.55);
  }
  // dish (front lip)
  if (bowl === 'glass') {
    ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.06); ctx.bezierCurveTo(-s * 0.3, s * 0.13, s * 0.3, s * 0.13, s * 0.5, s * 0.06); ctx.bezierCurveTo(s * 0.46, s * 0.34, s * 0.2, s * 0.42, 0, s * 0.42); ctx.bezierCurveTo(-s * 0.2, s * 0.42, -s * 0.46, s * 0.34, -s * 0.5, s * 0.06); ctx.closePath();
    ctx.fillStyle = 'rgba(214,232,244,.55)'; ctx.fill(); edge(ctx, s, o.bowlColor || '#5f7387', 0.03);
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = s * 0.026; ctx.beginPath(); ctx.moveTo(-s * 0.38, s * 0.14); ctx.lineTo(-s * 0.3, s * 0.3); ctx.stroke();
  }
  if (bowl === 'coconut') {
    ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.02); ctx.bezierCurveTo(-s * 0.5, s * 0.4, -s * 0.22, s * 0.5, 0, s * 0.5); ctx.bezierCurveTo(s * 0.22, s * 0.5, s * 0.5, s * 0.4, s * 0.5, s * 0.02); ctx.bezierCurveTo(s * 0.3, s * 0.1, -s * 0.3, s * 0.1, -s * 0.5, s * 0.02); ctx.closePath();
    ctx.fillStyle = radGrad(ctx, 0, s * 0.25, 0, s * 0.6, [[0, '#a5703a'], [1, '#5a3618']], -s * 0.15, s * 0.1); ctx.fill(); edge(ctx, s, '#2e1a0a', 0.03);
    ctx.strokeStyle = '#f7f1e2'; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(-s * 0.49, s * 0.03); ctx.bezierCurveTo(-s * 0.3, s * 0.11, s * 0.3, s * 0.11, s * 0.49, s * 0.03); ctx.stroke();
  }
  // front garnish
  if (o.garnish === 'strawberry') {
    const spots = bowl === 'none' ? [[-0.36, 0.24, 1.5, -0.4], [0.36, 0.26, 1.35, 0.5], [0.02, 0.33, 1.1, 0.1]] : [[-0.44, 0.22, 1, -0.4], [0.44, 0.24, 0.9, 0.5]];
    for (const [x, y, k, rot] of spots) { ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(0, s * 0.11 * k); ctx.bezierCurveTo(s * 0.13 * k, s * 0.03 * k, s * 0.1 * k, -s * 0.09 * k, 0, -s * 0.08 * k); ctx.bezierCurveTo(-s * 0.1 * k, -s * 0.09 * k, -s * 0.13 * k, s * 0.03 * k, 0, s * 0.11 * k);
      ctx.fillStyle = '#ff4a62'; ctx.fill(); edge(ctx, s, '#7a0a1e', 0.02); ctx.fillStyle = '#ffe9a0'; for (const [px, py] of [[-0.04, 0], [0.04, 0.01], [0, 0.05], [-0.03, -0.04], [0.04, -0.04]]) { ctx.beginPath(); ctx.ellipse(px * s * k, py * s * k, s * 0.007, s * 0.011, 0, 0, TAU); ctx.fill(); }
      for (let i = 0; i < 4; i++) leaf(ctx, 0, -s * 0.075 * k, s * 0.09 * k, s * 0.03 * k, -Math.PI / 2 + (i - 1.5) * 0.7, '#2e9b3e'); ctx.restore(); }
  }
  if (o.garnish === 'cookie') {
    ctx.fillStyle = '#3a2418'; scatter(3, 16, 0, -s * 0.2, s * 0.42, s * 0.16, (x, y, i, r) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 3); ctx.fillRect(-s * 0.016, -s * 0.011, s * 0.032, s * 0.022); ctx.restore(); });
    ctx.save(); ctx.translate(s * 0.46, s * 0.2); circle(ctx, 0, 0, s * 0.12, '#3a2418', '#1a0e08', s * 0.014); circle(ctx, 0, 0, s * 0.075, '#fdf6e6'); ctx.restore();
  }
  if (o.garnish === 'nuts') {
    ctx.fillStyle = '#c8965a'; scatter(6, 14, 0, -s * 0.22, s * 0.4, s * 0.14, (x, y, i, r) => { ctx.beginPath(); ctx.ellipse(x, y, s * 0.025, s * 0.018, r() * 3, 0, TAU); ctx.fill(); });
  }
  if (o.garnish === 'leaf') {
    leaf(ctx, s * 0.36, s * 0.0, s * 0.3, s * 0.08, -0.8, '#3ab04a'); leaf(ctx, s * 0.36, s * 0.0, s * 0.26, s * 0.07, -1.5, '#2e9b3e');
  }
  if (o.garnish === 'vanilla') {
    ctx.fillStyle = '#2a1a10'; scatter(11, 18, 0, -s * 0.05, s * 0.4, s * 0.16, (x, y) => { ctx.beginPath(); ctx.arc(x, y, s * 0.009, 0, TAU); ctx.fill(); });
  }
};

// Three mochi ice cream balls in starch dust; one is bitten to show the ice cream inside. o.flavours = [3 colours], o.inside.
illus.mochiBalls = (ctx, s, o = {}) => {
  const cols = o.flavours || ['#ffb3cc', '#ffffff', '#c3e58a'];
  const inside = o.inside || '#ffd0e0';
  const ball = (x, y, R, c, bite) => {
    ctx.save(); ctx.translate(x * s, y * s);
    ctx.beginPath(); ctx.ellipse(0, s * 0.02, R * s * 1.02, R * s * 0.98, 0, 0, TAU); ctx.fillStyle = 'rgba(120,80,60,.18)'; ctx.fill();
    ctx.beginPath();
    if (bite) { ctx.arc(0, 0, R * s, Math.PI * 0.05, Math.PI * 1.55); ctx.arc(R * s * 0.78, -R * s * 0.6, R * s * 0.44, Math.PI * 1.15, Math.PI * 0.25, true); }
    else ctx.arc(0, 0, R * s, 0, TAU);
    ctx.closePath();
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, R * s * 1.15, [[0, lighten(c, 0.45)], [0.6, c], [1, darken(c, 0.12)]], -R * s * 0.3, -R * s * 0.35); ctx.fill(); edge(ctx, s, darken(c, 0.4), 0.026);
    if (bite) { ctx.save(); ctx.beginPath(); ctx.arc(R * s * 0.78, -R * s * 0.6, R * s * 0.44, Math.PI * 1.15, Math.PI * 0.25, true); ctx.strokeStyle = inside; ctx.lineWidth = R * s * 0.22; ctx.stroke(); ctx.restore(); }
    glint(ctx, -R * s * 0.35, -R * s * 0.4, R * s * 0.26, R * s * 0.1, -0.6, 0.7);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; scatter(Math.round(x * 100) + 3, 14, 0, 0, R * s * 0.8, R * s * 0.8, (px, py) => { ctx.beginPath(); ctx.arc(px, py, s * 0.006, 0, TAU); ctx.fill(); });
    ctx.restore();
  };
  ball(-0.27, 0.12, 0.23, cols[0], false);
  ball(0.27, 0.13, 0.23, cols[2], false);
  ball(0.0, -0.13, 0.26, cols[1], true);
  // wooden pick
  ctx.save(); ctx.translate(-s * 0.05, s * 0.26); ctx.rotate(-0.9); fillRR(ctx, 0, -s * 0.012, s * 0.34, s * 0.024, s * 0.012, '#e9c88e', '#8a6a30', s * 0.008); ctx.restore();
};

// Every hero above accepts three optional layout knobs through heroOpts so each pack can be fitted to its geometry:
//   k = scale (1 = as drawn), dx / dy = nudge in units of the hero size.
// (If drawIllus() in gfx/illus.js is ever taught to apply k / dx / dy itself, delete this loop or they would be applied twice.)
for (const key of Object.keys(illus)) {
  const draw = illus[key];
  illus[key] = (ctx, s, o = {}) => {
    const k = o.k ?? 1, dx = o.dx ?? 0, dy = o.dy ?? 0;
    if (k === 1 && !dx && !dy) return draw(ctx, s, o);
    ctx.save(); ctx.translate(dx * s, dy * s); ctx.scale(k, k); draw(ctx, s, o); ctx.restore();
    return undefined;
  };
}

// ====================================================================================================== SKUs
export default [
  // ---------------------------------------------------------------------------------------------- DESSERT: cut fruit & Thai sweets
  {
    id: 'ss-mango-sticky-rice', cat: 'dessert', brand: 'sevenselect', name: T('Mango Sticky Rice', 'ข้าวเหนียวมะม่วง'), price: 59, size: g(230),
    g: 'tray-fruit', style: 'fruit', pal: ['#00874a', '#005a30', '#ffc21a', '#fff4d6'], hero: 'mangoStickyRice', heroOpts: { k: 0.88, dx: -0.06 },
    ing: ['sticky', 'coconutmilk', 'sugar', 'mango', 'mungbean', 'salt'], nut: [430, 45, 12, 110], pop: 3,
    desc: T('Thailand\'s favourite dessert: ripe golden mango with sweet sticky rice, coconut cream and crunchy mung beans. Best in mango season, roughly March to June.',
      'ของหวานยอดนิยมของไทย ข้าวเหนียวมูนหวานมัน ราดกะทิ โรยถั่วเขียวทอดกรอบ เสิร์ฟพร้อมมะม่วงสุกหอมหวาน อร่อยที่สุดในหน้ามะม่วง ราวเดือนมีนาคมถึงมิถุนายน'),
  },
  {
    id: 'ss-fruit-cup-mixed', cat: 'dessert', brand: 'sevenselect', name: T('Mixed Fruit', 'ผลไม้รวม'), price: 35, size: g(250),
    g: 'cup-fruit', style: 'tub', pal: ['#ff6a3d', '#c93a10', '#fff4c2', '#eef6f8'], capColor: '#e8f2f6', bg: 'dots', hero: 'fruitMix', heroOpts: { k: 1.1, dy: 0.08 },
    ing: ['watermelon', 'pineapple', 'papayaripe', 'guava', 'dragonfruit'], nut: [110, 22, 0.5, 5],
    desc: T('A chilled cup of cut watermelon, pineapple, papaya, guava and dragon fruit: an easy way to eat your fruit in the Bangkok heat.',
      'ผลไม้รวมหั่นชิ้นพอดีคำแช่เย็น มีแตงโม สับปะรด มะละกอ ฝรั่ง และแก้วมังกร กินง่ายคลายร้อน'),
  },
  {
    id: 'ss-watermelon-slices', cat: 'dessert', brand: 'sevenselect', name: T('Sliced Watermelon', 'แตงโมหั่นชิ้น'), price: 29, size: g(300),
    g: 'tray-fruit', style: 'fruit', pal: ['#00874a', '#005a30', '#ff4a5e', '#ffffff'], hero: 'melonWedges', heroOpts: { k: 0.86, dx: -0.07 },
    ing: ['watermelon'], nut: [90, 18, 0.5, 5], pop: 2, promo: T('2 for ฿50', '2 ถาด 50 บาท'),
    desc: T('Juicy chilled watermelon cut into easy wedges: the Thai answer to a hot afternoon.',
      'แตงโมหวานฉ่ำแช่เย็น หั่นเป็นชิ้นพอดีคำ ดับร้อนรับบ่ายแดดจัดได้ดี'),
  },
  {
    id: 'ss-pineapple-cup', cat: 'dessert', brand: 'sevenselect', name: T('Pineapple', 'สับปะรด'), price: 25, size: g(200),
    g: 'cup-fruit', style: 'tub', pal: ['#ffc21a', '#e08a00', '#2e9b3e', '#f4f8ea'], capColor: '#e8f2f6', bg: 'rays', hero: 'pineChunks', heroOpts: { k: 1.15, dy: 0.13 },
    ing: ['pineapple'], nut: [100, 22, 0.3, 5],
    desc: T('Sweet-tart pineapple chunks, peeled, cored and chilled. Many Thais dip it in a pinch of chilli salt (prik gluea).',
      'สับปะรดปอกเปลือกตัดแต่งแช่เย็น เปรี้ยวหวานสดชื่น คนไทยนิยมจิ้มกับพริกเกลือ'),
  },
  {
    id: 'ss-mango-nam-dok-mai', cat: 'dessert', brand: 'sevenselect', name: T('Nam Dok Mai Mango', 'มะม่วงน้ำดอกไม้'), price: 45, size: g(250),
    g: 'tray-fruit', style: 'fruit', pal: ['#00874a', '#005a30', '#ffc21a', '#ffffff'], hero: 'mangoCheeks', heroOpts: { k: 0.88, dx: -0.06 },
    ing: ['mango'], nut: [160, 36, 0.8, 5],
    desc: T('Nam dok mai is Thailand\'s favourite ripe mango: golden, fragrant and honey-sweet, peeled and sliced ready to eat.',
      'มะม่วงน้ำดอกไม้สุก เนื้อสีเหลืองทอง หอมหวานละมุนลิ้น ปอกและหั่นแบ่งชิ้นพร้อมทาน'),
  },
  {
    id: 'ss-bua-loy-khai-wan', cat: 'dessert', brand: 'sevenselect', name: T('Bua Loy with Egg', 'บัวลอยไข่หวาน'), price: 29, size: g(180),
    g: 'cup-dessert', style: 'tub', pal: ['#f7a35c', '#d0641c', '#fff6e0', '#f4ead8'], capColor: '#f0e6d2', bg: 'waves', hero: 'buaLoy', heroOpts: { k: 1.22, dy: 0.08 },
    ing: ['ricef', 'coconutmilk', 'sugar', 'egg', 'taro', 'pumpkin', 'salt'], allergens: ['egg'], nut: [310, 30, 10, 60],
    desc: T('Chewy rice-flour dumplings in sweet, lightly salted coconut milk with a boiled egg: a comforting Thai classic.',
      'ลูกบัวลอยเหนียวนุ่มหลากสีในน้ำกะทิหวานมันเค็มนิดๆ เสิร์ฟพร้อมไข่หวาน ของหวานไทยรสละมุน'),
  },
  {
    id: 'ss-tub-tim-krob', cat: 'dessert', brand: 'sevenselect', name: T('Crispy Red Rubies', 'ทับทิมกรอบ'), price: 29, size: g(200),
    g: 'cup-dessert', style: 'tub', pal: ['#e5233d', '#9a0f27', '#ffffff', '#f8eeee'], capColor: '#f0e6d2', bg: 'dots', hero: 'tubTimKrob', heroOpts: { k: 1.22, dy: 0.02 },
    ing: ['waterchestnut', 'tapioca', 'sugar', 'coconutmilk', 'jackfruit', 'colour', 'salt'], nut: [260, 32, 8, 45],
    desc: T('Crunchy water-chestnut "rubies" coated in tapioca and dyed pomegranate red, floating in sweet coconut milk over ice.',
      'เม็ดแห้วกรอบเคลือบแป้งมันสีแดงทับทิม ลอยในน้ำกะทิหวานมัน กินกับน้ำแข็งเย็นชื่นใจ'),
  },
  {
    id: 'ss-sangkhaya-fak-thong', cat: 'dessert', brand: 'sevenselect', name: T('Pumpkin Custard', 'สังขยาฟักทอง'), price: 29, size: g(160),
    g: 'tray-onigiri', style: 'fruit', pal: ['#00874a', '#005a30', '#ff9f24', '#ffffff'], hero: 'pumpkinCustard', heroOpts: { k: 0.9, dx: -0.06 },
    ing: ['pumpkin', 'egg', 'coconutmilk', 'sugar'], allergens: ['egg'], nut: [250, 26, 9, 70],
    desc: T('A small kabocha pumpkin steamed with silky coconut-egg custard inside, then cut into wedges. Sweet, creamy and fragrant.',
      'ฟักทองนึ่งสอดไส้สังขยาไข่กะทิเนื้อเนียนนุ่ม หั่นเป็นชิ้นพอดีคำ หอมหวานมัน'),
  },
  {
    id: 'ss-tao-huay-milk', cat: 'dessert', brand: 'sevenselect', name: T('Fresh Milk Tofu Pudding', 'เต้าฮวยนมสด'), price: 25, size: g(200),
    g: 'cup-dessert', style: 'tub', pal: ['#4aa3e0', '#1f6fb0', '#ffffff', '#eef4fa'], capColor: '#e8f2f6', bg: 'waves', hero: 'taoHuay', heroOpts: { k: 1.32, dy: 0.06 },
    ing: ['soy', 'milk', 'sugar', 'ginger'], allergens: ['soy', 'milk'], nut: [170, 20, 4, 40],
    desc: T('Silky soy pudding in creamy fresh milk and light syrup: a Chinese-Thai street dessert, served chilled here.',
      'เต้าฮวยเนื้อเนียนนุ่มในนมสดและน้ำเชื่อมหอมหวาน ของหวานสไตล์จีนที่คนไทยคุ้นเคย ทานแบบเย็นชื่นใจ'),
  },
  {
    id: 'ss-coconut-jelly', cat: 'dessert', brand: 'sevenselect', name: T('Coconut Jelly', 'วุ้นมะพร้าว'), price: 20, size: g(150),
    g: 'cup-dessert', style: 'tub', pal: ['#2aa6a0', '#12736e', '#ffffff', '#e8f6f4'], capColor: '#e8f2f6', bg: 'waves', hero: 'coconutJelly', heroOpts: { k: 1.34, dy: 0.06 },
    ing: ['natadecoco', 'sugar', 'water', 'citric'], nut: [110, 24, 0, 15],
    desc: T('Chewy, translucent coconut jelly cubes in light syrup: a cooling treat that Thais also spoon over shaved ice.',
      'วุ้นมะพร้าวหนึบหนับในน้ำเชื่อมเย็นๆ ทานเดี่ยวๆ หรือใส่น้ำแข็งไสก็อร่อย'),
  },
  {
    id: 'dutchie-yoghurt-strawberry', cat: 'dessert', brand: 'dutchie', name: T('Strawberry Yoghurt', 'โยเกิร์ตรสสตรอว์เบอร์รี่'), price: 20, size: g(135),
    g: 'cup-dessert', style: 'tub', pal: ['#f0457a', '#b3174a', '#ffffff', '#fdf0f4'], capColor: '#f0457a', bg: 'dots', hero: 'yoghurtSwirl', heroOpts: { fruit: 'strawberry', k: 1.24, dy: 0.1 },
    ing: ['milk', 'milkp', 'sugar', 'strawberry', 'starch', 'yogurt'], allergens: ['milk'], nut: [130, 19, 3, 70], promo: T('2 for ฿35', '2 ถ้วย 35 บาท'),
    desc: T('Creamy, gently tangy yoghurt with strawberry pieces: an easy breakfast or afternoon snack.',
      'โยเกิร์ตเนื้อเนียนนุ่มเปรี้ยวอมหวาน ผสมเนื้อสตรอว์เบอร์รี่ ทานเป็นมื้อเช้าหรือของว่างก็ได้'),
  },
  {
    id: 'meiji-bulgaria-plain', cat: 'dessert', brand: 'meiji', name: T('Plain Bulgaria Yoghurt', 'โยเกิร์ตบัลแกเรีย รสธรรมชาติ'), price: 22, size: g(110),
    g: 'cup-dessert', style: 'tub', pal: ['#1c72d4', '#0b3f8a', '#ffffff', '#f2f6fc'], capColor: '#1c72d4', bg: 'rays', hero: 'yoghurtSwirl', heroOpts: { fruit: 'honey', k: 1.32, dy: 0.06 },
    ing: ['milk', 'milkp', 'yogurt'], allergens: ['milk'], nut: [80, 5, 3, 60],
    desc: T('Meiji\'s plain yoghurt made with Bulgaria cultures: smooth and lightly sour, lovely with fruit or honey.',
      'โยเกิร์ตรสธรรมชาติจากเชื้อบัลแกเรีย เนื้อเนียนเปรี้ยวนุ่ม ทานเปล่าหรือราดน้ำผึ้งก็อร่อย'),
  },
  // ---------------------------------------------------------------------------------------------- BAKERY: packaged bread, buns & cakes
  {
    id: 'farmhouse-sandwich-bread', cat: 'bakery', brand: 'farmhouse', name: T('Sandwich Bread', 'ขนมปังแซนวิช'), sub: T('Sliced white bread', 'ขนมปังแผ่น'), price: 37, size: g(400),
    g: 'bag-loaf', style: 'snack', pal: ['#ffc933', '#d98a0c', '#d8232a', '#ffffff'], bg: 'rays', hero: 'breadSlices', heroOpts: { k: 0.85, dx: 0.05, dy: 0.03 },
    ing: ['wheat', 'sugar', 'yeast', 'oil', 'milkp', 'salt', 'emuls', 'preserv'], allergens: ['wheat', 'milk', 'soy'], nut: [1000, 26, 12, 1700], pop: 3,
    desc: T('Soft sliced white bread, the everyday loaf of Thai homes. Toast it with butter and sweetened condensed milk, or make a fried-egg sandwich.',
      'ขนมปังแผ่นเนื้อนุ่ม ขนมปังประจำบ้านของคนไทย ปิ้งทาเนยราดนมข้นหวาน หรือทำแซนวิชไข่ดาวก็อร่อย'),
  },
  {
    id: 'ss-pandan-custard-bread', cat: 'bakery', brand: 'sevenselect', name: T('Pandan Custard Bread', 'ขนมปังไส้สังขยาใบเตย'), price: 15, size: g(60),
    g: 'bag-bun', style: 'snack', pal: ['#3fae5a', '#1f7a3a', '#fff3c0', '#ffffff'], bg: 'stripes', hero: 'custardBun',
    ing: ['wheat', 'sugar', 'egg', 'coconutmilk', 'pandan', 'butter', 'yeast', 'salt'], allergens: ['wheat', 'egg', 'milk'], nut: [190, 12, 5, 170], pop: 2,
    desc: T('Soft white bread with a green pandan custard filling (sangkhaya): a favourite Thai bakery flavour made from coconut milk, egg and pandan.',
      'ขนมปังนุ่มสอดไส้สังขยาใบเตยสีเขียว หอมกะทิ ไข่ และใบเตย เป็นไส้ขนมปังยอดนิยมของคนไทย'),
  },
  {
    id: 'ss-butter-croissant', cat: 'bakery', brand: 'sevenselect', name: T('Butter Croissant', 'ครัวซองต์เนย'), price: 22, size: g(55),
    g: 'bag-bun', style: 'snack', pal: ['#f2b23a', '#c67a12', '#fff4cf', '#ffffff'], bg: 'rays', hero: 'croissantHero', heroOpts: { k: 1.1, dx: -0.03, dy: 0.04 },
    ing: ['wheat', 'butter', 'sugar', 'yeast', 'egg', 'salt'], allergens: ['wheat', 'milk', 'egg'], nut: [230, 6, 12, 230], pop: 2,
    desc: T('Flaky, buttery layers under a crisp golden crust: an easy breakfast to pair with a cold coffee.',
      'ครัวซองต์เนยหอมเป็นชั้นๆ กรอบนอกนุ่มใน ทานเป็นมื้อเช้าคู่กับกาแฟเย็นกำลังดี'),
  },
  {
    id: 'ss-pork-floss-bun', cat: 'bakery', brand: 'sevenselect', name: T('Pork Floss Bun', 'ขนมปังหมูหยอง'), price: 18, size: g(75),
    g: 'bag-bun', style: 'snack', pal: ['#e8543a', '#a82a14', '#ffe08a', '#ffffff'], bg: 'dots', hero: 'porkFlossBun',
    ing: ['wheat', 'porkfloss', 'mayo', 'sugar', 'egg', 'milk', 'yeast'], allergens: ['wheat', 'egg', 'milk', 'soy'], nut: [240, 9, 8, 380], promo: T('2 for ฿30', '2 ชิ้น 30 บาท'),
    desc: T('A soft, lightly sweet bun rolled in fluffy savoury pork floss with a ribbon of mayonnaise: sweet, salty and a Thai bakery favourite.',
      'ขนมปังนุ่มหวานเบาๆ โรยหมูหยองฟูๆ รสเค็มหวาน บีบมายองเนสเป็นเส้น เป็นเบเกอรี่ยอดนิยมของคนไทย'),
  },
  {
    id: 'ss-cream-bun', cat: 'bakery', brand: 'sevenselect', name: T('Cream Bun', 'ขนมปังไส้ครีม'), price: 15, size: g(65),
    g: 'bag-bun', style: 'snack', pal: ['#5bb8e8', '#2a86bd', '#fff7d6', '#ffffff'], bg: 'waves', hero: 'creamBun',
    ing: ['wheat', 'sugar', 'cream', 'milk', 'egg', 'oil', 'yeast'], allergens: ['wheat', 'egg', 'milk'], nut: [215, 14, 7, 150],
    desc: T('A pillowy sweet bun with a swirl of vanilla cream: a cheap and cheerful afternoon snack.',
      'ขนมปังนุ่มฟูสอดไส้ครีมวานิลลาหอมหวาน เป็นของว่างช่วงบ่ายราคาเบาๆ'),
  },
  {
    id: 'ss-pandan-roll-cake', cat: 'bakery', brand: 'sevenselect', name: T('Pandan Roll Cake', 'เค้กโรลใบเตย'), price: 20, size: g(70),
    g: 'bag-bun', style: 'snack', pal: ['#5fbf4a', '#2f8a2a', '#ffffff', '#ffffff'], bg: 'stripes', hero: 'swissRoll', heroOpts: { sponge: '#79c44a', cream: '#fff6dc', dust: 'rgba(255,255,255,.75)' },
    ing: ['wheat', 'egg', 'sugar', 'oil', 'cream', 'pandan', 'coconutmilk', 'leaven', 'emuls'], allergens: ['wheat', 'egg', 'milk', 'soy'], nut: [255, 20, 11, 110],
    desc: T('Light sponge scented with pandan and rolled around sweet cream: a fragrant Thai take on the Swiss roll.',
      'เค้กเนื้อนุ่มกลิ่นใบเตยหอม ม้วนไส้ครีมหวานมัน เป็นเค้กโรลสไตล์ไทย'),
  },
  {
    id: 'ss-banana-cake', cat: 'bakery', brand: 'sevenselect', name: T('Banana Cake', 'เค้กกล้วยหอม'), price: 20, size: g(80),
    g: 'bag-snack', style: 'snack', pal: ['#ffd23a', '#e0a010', '#8a4a1a', '#ffffff'], bg: 'zig', hero: 'loafCake', heroOpts: { topping: 'banana', k: 0.84, dy: 0.08 },
    ing: ['wheat', 'banana', 'sugar', 'egg', 'oil', 'butter', 'leaven', 'salt'], allergens: ['wheat', 'egg', 'milk'], nut: [300, 24, 13, 180],
    desc: T('Moist cake baked with ripe kluai hom bananas. The banana aroma and golden top make it a classic partner for coffee.',
      'เค้กเนื้อนุ่มชื้นจากกล้วยหอมสุก กลิ่นหอมกล้วยชัดเจน ทานคู่กับกาแฟกำลังดี'),
  },
  {
    id: 'ss-chocolate-roll-cake', cat: 'bakery', brand: 'sevenselect', name: T('Chocolate Roll Cake', 'เค้กโรลช็อกโกแลต'), price: 20, size: g(70),
    g: 'bag-bun', style: 'snack', pal: ['#7a4a2a', '#3f2110', '#f2c14e', '#ffffff'], bg: 'dots', hero: 'swissRoll', heroOpts: { sponge: '#6b3a1e', cream: '#fbeecf', dust: 'rgba(255,240,200,.35)' },
    ing: ['wheat', 'egg', 'sugar', 'oil', 'cocoa', 'cream', 'milk', 'leaven', 'emuls'], allergens: ['wheat', 'egg', 'milk', 'soy'], nut: [270, 22, 12, 120],
    desc: T('Cocoa sponge rolled around chocolate cream: rich, sweet and easy to eat on the go.',
      'เค้กโรลรสช็อกโกแลตเข้มข้น สอดไส้ครีมช็อกโกแลตหวานมัน ทานง่ายระหว่างเดินทาง'),
  },
  {
    id: 'ss-chocolate-brownie', cat: 'bakery', brand: 'sevenselect', name: T('Chocolate Brownie', 'บราวนี่ช็อกโกแลต'), price: 25, size: g(65),
    g: 'bag-snack', style: 'snack', pal: ['#5a2c14', '#2a1208', '#ffd54a', '#ffffff'], bg: 'rays', hero: 'brownie', heroOpts: { k: 0.8, dy: 0.11 },
    ing: ['wheat', 'sugar', 'egg', 'butter', 'cocoa', 'choc', 'walnut', 'salt'], allergens: ['wheat', 'egg', 'milk', 'nuts', 'soy'], nut: [290, 28, 15, 120],
    desc: T('Fudgy chocolate brownie with a crackly top and walnut pieces.',
      'บราวนี่ช็อกโกแลตเนื้อแน่นหนึบ หน้าแตกกรอบ มีวอลนัทชิ้นโต'),
  },
  {
    id: 'ss-mini-muffins-choc-chip', cat: 'bakery', brand: 'sevenselect', name: T('Mini Muffins Choc Chip', 'มินิมัฟฟิน ช็อกโกแลตชิพ'), price: 29, size: T('6 pcs · 120 g', '6 ชิ้น · 120 ก.'),
    g: 'bag-loaf', style: 'snack', pal: ['#ff8fb0', '#d4457a', '#fff4c2', '#ffffff'], bg: 'dots', hero: 'miniMuffins', heroOpts: { k: 0.86 },
    ing: ['wheat', 'sugar', 'egg', 'oil', 'chocchips', 'milk', 'leaven', 'vanilla'], allergens: ['wheat', 'egg', 'milk', 'soy'], nut: [400, 34, 19, 300],
    desc: T('Six bite-size vanilla muffins dotted with chocolate chips: easy to share around the office.',
      'มัฟฟินวานิลลาชิ้นจิ๋ว 6 ชิ้น เม็ดช็อกโกแลตชิพเต็มๆ แบ่งกันทานที่ออฟฟิศได้'),
  },
  // ---------------------------------------------------------------------------------------------- ICE CREAM: freezer bays
  {
    id: 'paddlepop-rainbow', cat: 'icecream', brand: 'paddle', name: T('Rainbow', 'เรนโบว์'), sub: T('Fruit ice lolly', 'ไอศกรีมแท่งรสผลไม้'), price: 12, size: ml(60),
    g: 'stick', style: 'stick', pal: ['#1d6fd6', '#0b3f8a', '#ffe14a', '#ffffff'], hero: 'paddlePop',
    ing: ['water', 'sugar', 'starchsyrup', 'milkp', 'palm', 'stab', 'emuls', 'flavour', 'colour'], allergens: ['milk'], nut: [70, 10, 1.5, 25], pop: 3, promo: T('3 for ฿30', '3 แท่ง 30 บาท'),
    desc: T('Wall\'s fruity rainbow ice lolly with the Paddle Lion on the wrapper. A classic after-school treat for Thai kids.',
      'ไอศกรีมแท่งหลากสีรสผลไม้จากวอลล์ มีสิงโตแพดเดิ้ลบนซอง ขวัญใจเด็กไทยหลังเลิกเรียน'),
  },
  {
    id: 'magnum-classic', cat: 'icecream', brand: 'magnum', name: T('Classic', 'คลาสสิก'), sub: T('Chocolate ice cream bar', 'ไอศกรีมแท่งเคลือบช็อกโกแลต'), price: 45, size: ml(80),
    g: 'stick', style: 'stick', pal: ['#3a1a0a', '#1c0b04', '#f2c14e', '#ffffff'], hero: 'magnumBar', heroOpts: { k: 1.02, dx: 0.03 },
    ing: ['milk', 'sugar', 'cocoa', 'palm', 'cream', 'starchsyrup', 'emuls', 'stab', 'vanilla'], allergens: ['milk', 'soy'], nut: [200, 18, 13, 40], pop: 2,
    desc: T('A thick, crackly chocolate shell around creamy vanilla ice cream: the bar people pick when they want something a little special.',
      'ไอศกรีมวานิลลาเนื้อครีมมี่เคลือบช็อกโกแลตหนากรอบ เลือกกินเมื่ออยากได้อะไรพิเศษสักหน่อย'),
  },
  {
    id: 'magnum-almond', cat: 'icecream', brand: 'magnum', name: T('Almond', 'อัลมอนด์'), sub: T('Chocolate ice cream bar', 'ไอศกรีมแท่งเคลือบช็อกโกแลต'), price: 49, size: ml(80),
    g: 'stick', style: 'stick', pal: ['#5a2a10', '#2a1208', '#e2b984', '#ffffff'], hero: 'magnumBar', heroOpts: { nuts: true, k: 1.02, dx: 0.03 },
    ing: ['milk', 'sugar', 'cocoa', 'palm', 'almond', 'cream', 'starchsyrup', 'emuls', 'stab', 'vanilla'], allergens: ['milk', 'soy', 'nuts'], nut: [215, 17, 15, 40],
    desc: T('The classic bar with roasted almond pieces pressed into the chocolate shell for extra crunch.',
      'แมกนั่มเคลือบช็อกโกแลตโรยอัลมอนด์อบกรอบ เพิ่มความกรุบกรอบในทุกคำ'),
  },
  {
    id: 'cornetto-choc', cat: 'icecream', brand: 'cornetto', name: T('Chocolate', 'ช็อกโกแลต'), sub: T('Ice cream cone', 'ไอศกรีมโคน'), price: 29, size: ml(110),
    g: 'stick', style: 'stick', pal: ['#8a1a2c', '#420a14', '#f1c88a', '#ffffff'], hero: 'cornettoCone', heroOpts: { k: 1.1 },
    ing: ['milk', 'sugar', 'wheat', 'palm', 'cocoa', 'cream', 'peanut', 'starchsyrup', 'emuls', 'stab'], allergens: ['milk', 'wheat', 'peanut', 'soy'], nut: [210, 19, 10, 70], pop: 2,
    desc: T('A crisp cone lined with chocolate, filled with ice cream and finished with chocolate sauce and nut pieces: crunchy right down to the tip.',
      'โคนกรอบเคลือบช็อกโกแลตด้านใน เต็มไปด้วยไอศกรีม ราดซอสช็อกโกแลตและถั่วชิ้น กรอบอร่อยถึงปลายโคน'),
  },
  {
    id: 'cornetto-strawberry', cat: 'icecream', brand: 'cornetto', name: T('Strawberry', 'สตรอว์เบอร์รี่'), sub: T('Ice cream cone', 'ไอศกรีมโคน'), price: 29, size: ml(110),
    g: 'stick', style: 'stick', pal: ['#f0457a', '#a3123f', '#ffffff', '#ffffff'], hero: 'cornettoCone', heroOpts: { cream: '#ffc3d4', sauce: '#e8264f', sleeve: '#f0457a', bits: '#f7e2c8', k: 1.1 },
    ing: ['milk', 'sugar', 'wheat', 'palm', 'strawberry', 'cream', 'starchsyrup', 'emuls', 'stab', 'flavour', 'colour'], allergens: ['milk', 'wheat', 'soy'], nut: [200, 20, 9, 70],
    desc: T('Strawberry ice cream and sauce in the same crisp Cornetto cone, tucked into its paper sleeve.',
      'ไอศกรีมและซอสสตรอว์เบอร์รี่ในโคนกรอบสไตล์คอร์เนตโต ห่อมาในซองกระดาษ'),
  },
  {
    id: 'walls-tub-vanilla', cat: 'icecream', brand: 'wall', name: T('Vanilla', 'วานิลลา'), sub: T('Ice cream tub', 'ไอศกรีมถ้วยใหญ่'), price: 129, size: L(1),
    g: 'tub-family', style: 'tub', pal: ['#f5c94a', '#d99a0a', '#ffffff', '#fdf3d6'], capColor: '#e4002b', bg: 'rays',
    hero: 'iceScoops', heroOpts: { scoops: ['#fff3d0', '#fff3d0'], sauce: '#4a2210', garnish: 'wafer', k: 1.3, dy: -0.02 },
    ing: ['milk', 'sugar', 'milkp', 'palm', 'starchsyrup', 'emuls', 'stab', 'vanilla', 'colour'], allergens: ['milk'], nut: [1050, 105, 55, 350],
    desc: T('A family tub of creamy vanilla: the all-rounder for scooping into bowls, onto cake or beside a hot dessert.',
      'ไอศกรีมวานิลลาถ้วยใหญ่ เนื้อครีมมี่หอมวานิลลา ตักใส่ถ้วย ราดขนม หรือกินคู่ของหวานร้อนๆ ก็เข้ากัน'),
  },
  {
    id: 'walls-tub-sweetcorn', cat: 'icecream', brand: 'wall', name: T('Sweet Corn', 'ข้าวโพด'), sub: T('Ice cream tub', 'ไอศกรีมถ้วยใหญ่'), price: 129, size: L(1),
    g: 'tub-family', style: 'tub', pal: ['#ffd23a', '#e09a00', '#ffffff', '#fff6d0'], capColor: '#e4002b', bg: 'dots',
    hero: 'iceScoops', heroOpts: { scoops: ['#ffe27a', '#ffe27a'], garnish: 'corn', k: 1.3, dy: -0.02 },
    ing: ['milk', 'sugar', 'corn', 'milkp', 'palm', 'starchsyrup', 'emuls', 'stab', 'flavour', 'colour'], allergens: ['milk'], nut: [1000, 100, 50, 330],
    desc: T('A well-loved Thai flavour: milky, sweet ice cream that tastes of sweet corn. Odd to visitors, delicious to locals.',
      'รสชาติสไตล์ไทยที่คุ้นเคย ไอศกรีมนมหวานมันหอมกลิ่นข้าวโพดหวาน ฟังดูแปลกสำหรับนักท่องเที่ยว แต่คนไทยชอบ'),
  },
  {
    id: 'selection-cup-chocolate', cat: 'icecream', brand: 'selection', name: T('Chocolate', 'ช็อกโกแลต'), sub: T('Ice cream cup', 'ไอศกรีมถ้วย'), price: 25, size: ml(90),
    g: 'cup-small', style: 'tub', pal: ['#7a3f1e', '#3f1c0a', '#f7e1b5', '#f4ead8'], capColor: '#7a3f1e', bg: 'waves',
    hero: 'iceScoops', heroOpts: { scoops: ['#6b3a1e', '#6b3a1e'], sauce: '#2e1408', garnish: 'nuts', k: 1.28, dy: -0.02 },
    ing: ['milk', 'sugar', 'cocoa', 'milkp', 'palm', 'starchsyrup', 'emuls', 'stab', 'vanilla'], allergens: ['milk', 'soy'], nut: [150, 15, 7, 55],
    desc: T('A single-serve cup of rich chocolate ice cream, just the right size for an after-lunch treat.',
      'ไอศกรีมช็อกโกแลตเข้มข้นในถ้วยเล็ก ขนาดพอดีสำหรับกินหลังมื้อกลางวัน'),
  },
  {
    id: 'nestle-tub-3flavour', cat: 'icecream', brand: 'nestleice', name: T('3 Flavours', 'ไอศกรีม 3 รส'), sub: T('Vanilla, chocolate, strawberry', 'วานิลลา ช็อกโกแลต สตรอว์เบอร์รี่'), price: 109, size: ml(750),
    g: 'tub-family', style: 'tub', pal: ['#2a6fdb', '#123f91', '#ffffff', '#f2f6fc'], capColor: '#ffffff', bg: 'stripes',
    hero: 'iceScoops', heroOpts: { scoops: ['#fff0c4', '#6b3a1e', '#ff9bb8'], garnish: 'wafer', k: 1.3, dy: -0.02 },
    ing: ['milk', 'sugar', 'milkp', 'palm', 'cocoa', 'strawberry', 'starchsyrup', 'emuls', 'stab', 'flavour', 'colour'], allergens: ['milk', 'soy'], nut: [780, 80, 40, 260],
    desc: T('Vanilla, chocolate and strawberry side by side in one tub, so everyone at the table is happy.',
      'วานิลลา ช็อกโกแลต และสตรอว์เบอร์รี่ในถ้วยเดียว ถูกใจทุกคนในบ้าน'),
  },
  {
    id: 'essel-super-cup-vanilla', cat: 'icecream', brand: 'essel', name: T('Super Cup Vanilla', 'ซูเปอร์คัพ วานิลลา'), sub: T('Ice cream cup', 'ไอศกรีมถ้วย'), price: 59, size: ml(200),
    g: 'cup-dessert', style: 'tub', pal: ['#f6e6b4', '#e3c46a', '#1a5fb4', '#ffffff'], capColor: '#ffffff', bg: 'waves', origin: 'jp',
    hero: 'iceScoops', heroOpts: { scoops: ['#fff6d8'], garnish: 'wafer', flecks: '#3a2a10', k: 1.28, dy: -0.02 },
    ing: ['milk', 'cream', 'sugar', 'milkp', 'starchsyrup', 'emuls', 'stab', 'vanillabean'], allergens: ['milk'], nut: [340, 30, 20, 110],
    desc: T('A popular Japanese ice-cream cup: smooth, milky vanilla that is not too sweet.',
      'ไอศกรีมถ้วยยอดนิยมจากญี่ปุ่น วานิลลาเนื้อเนียนหอมนม หวานกำลังดี'),
  },
  {
    id: 'mochi-ice-strawberry', cat: 'icecream', brand: 'mochi', name: T('Strawberry Mochi', 'โมจิสตรอว์เบอร์รี่'), price: 65, size: pc(6),
    g: 'box-s', style: 'box', pal: ['#ff7aa8', '#d1407a', '#fff4d6', '#ffffff'], bg: 'dots', hero: 'mochiBalls', isNew: true,
    ing: ['ricef', 'sugar', 'milk', 'cream', 'strawberry', 'starchsyrup', 'cornst', 'emuls', 'stab', 'colour'], allergens: ['milk'], nut: [330, 40, 6, 60],
    desc: T('Bite-size mochi: soft, chewy rice dough wrapped around strawberry ice cream. Let it sit for a minute to soften before eating.',
      'โมจิแป้งข้าวเหนียวนุ่มหนึบห่อไอศกรีมสตรอว์เบอร์รี่ ควรวางทิ้งไว้ประมาณ 1 นาทีให้เนื้อโมจินุ่มก่อนทาน'),
  },
  {
    id: 'coconut-ice-cream-cup', cat: 'icecream', brand: 'wall', name: T('Coconut Ice Cream', 'ไอศกรีมกะทิ'), sub: T('Thai-style ice cream', 'ไอศกรีมสไตล์ไทย'), price: 18, size: ml(80),
    g: 'cup-small', style: 'tub', pal: ['#4fb06a', '#2a7d44', '#fff6e0', '#f4f8ea'], capColor: '#ffffff', bg: 'zig',
    hero: 'iceScoops', heroOpts: { scoops: ['#fbf4e2', '#fbf4e2'], bowl: 'coconut', garnish: 'nuts', k: 1.15, dy: 0.0 },
    ing: ['coconutmilk', 'sugar', 'milkp', 'palm', 'starchsyrup', 'stab', 'emuls', 'salt', 'flavour'], allergens: ['milk'], nut: [140, 14, 8, 60],
    desc: T('Old-school Thai coconut-milk ice cream: rich, lightly salty and not too sweet. Thais often eat it with sticky rice and peanuts, or in a bun.',
      'ไอศกรีมกะทิสไตล์ไทยดั้งเดิม หอมมัน หวานน้อย เค็มนิดๆ คนไทยนิยมกินกับข้าวเหนียวและถั่ว หรือใส่ขนมปัง'),
  },
  {
    id: 'haagen-dazs-strawberry', cat: 'icecream', brand: 'haagendazs', name: T('Strawberry', 'สตรอว์เบอร์รี่'), sub: T('Ice cream mini cup', 'ไอศกรีมมินิคัพ'), price: 89, size: ml(81),
    g: 'cup-small', style: 'tub', pal: ['#f06a9a', '#b8235a', '#fdf1e0', '#fbe9ef'], capColor: '#b8235a', bg: 'plain',
    hero: 'iceScoops', heroOpts: { scoops: ['#ff9bb8'], garnish: 'strawberry', bowl: 'none', k: 1.15, dy: -0.02 },
    ing: ['cream', 'milk', 'sugar', 'strawberry', 'eggyolk'], allergens: ['milk', 'egg'], nut: [230, 20, 14, 40],
    desc: T('A mini cup of premium strawberry ice cream: dense, creamy and full of strawberry flavour.',
      'ไอศกรีมสตรอว์เบอร์รี่ระดับพรีเมียมในถ้วยเล็ก เนื้อแน่นครีมมี่ รสสตรอว์เบอร์รี่เข้มข้น'),
  },
  {
    id: 'swensens-thai-tea-pint', cat: 'icecream', brand: 'swensens', name: T('Thai Tea', 'ชาไทย'), sub: T('Ice cream pint', 'ไอศกรีมไพนต์'), price: 199, size: ml(473),
    g: 'tub-ice', style: 'tub', pal: ['#f28a30', '#c25a08', '#ffffff', '#fff1e0'], capColor: '#c25a08', bg: 'rays',
    hero: 'iceScoops', heroOpts: { scoops: ['#f0a25a', '#f0a25a'], garnish: 'leaf', k: 1.28, dy: -0.02 },
    ing: ['milk', 'cream', 'sugar', 'thaitea', 'milkp', 'starchsyrup', 'emuls', 'stab', 'colour'], allergens: ['milk'], nut: [1000, 100, 55, 300],
    desc: T('A pint of creamy Thai-tea ice cream, with the sweet, spiced taste of the iced tea from the street stall.',
      'ไอศกรีมชาไทยเนื้อครีมมี่ในถ้วยไพนต์ หอมหวานเหมือนชาเย็นริมทาง'),
  },
];

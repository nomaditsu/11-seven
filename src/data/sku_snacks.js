// Snacks: potato chips & corn snacks, seaweed snacks, and nuts / dried snacks — as found in a Bangkok 7-Eleven (2025).
// Names, flavours and pack sizes follow the real Thai retail listings (7-Eleven ALL Online); the artwork is stylised and fully procedural.
//
// Authoring notes
//  - Heroes are custom scenes registered through `illus` (chipScene, pringlesScene, seaScene, peanutScene …). They ignore the
//    shared c1/c2 palette options and take their own (`deco`, `chip`, `speck`, `ridged`, `kind`, `icon` …) through heroOpts.
//  - Bag heroes must stay inside x ∈ ±0.46·s, y ∈ −0.28·s … +0.34·s (s = hero size): above that the brand logo (and its Thai
//    line) is covered, below it the flavour plate hides the art. Tube heroes may use the whole box.
//  - Names are one string per language, no "·" line break: the shared name plate cannot fit a two-paragraph name in the
//    bilingual mode (the second language is squeezed to nothing). Long names wrap on their own.
//  - `nut` ([kcal, sugar g, fat g, sodium mg] per pack) is computed from per-100 g profiles so the GDA row matches pack size.
import { g, T } from './sku_util.js';
import { drawIllus } from '../gfx/illus.js';
import { circle, ellipse, poly, fillRR, rrPath, leaf, drop, linGrad, radGrad } from '../gfx/draw.js';
import { lighten, darken, TAU, rng } from '../core/util.js';

const OUT = '#3b2411';
const I = (en, th) => ({ en, th });

// ================================================================================================ brands
export const brands = {
  // corrections to the shared list: the Thai spellings printed on the real packs (Singha's Masita is "มาชิตะ", Taro is "ทาโร")
  masita: { text: 'MASITA', th: 'มาชิตะ', style: 'plain', fg: '#ffffff', font: 'righteous', stroke: '#1b5e20' },
  taro: { text: 'TARO', th: 'ทาโร', style: 'block', bg: '#f7d117', fg: '#1a1a1a', font: 'anton', ring: '#1a1a1a' },
  // workaround: the shared 'oval' logo style leaves its translate/rotate active when it draws the Thai transliteration,
  // so "เลย์" lands off the pack edge in Thai / bilingual mode. Blank until logos.js is patched (then restore th: 'เลย์').
  lays: { text: "Lay's", th: 'เลย์', style: 'oval', bg: '#e4171f', fg: '#ffd400', font: 'pacifico', ring: '#ffd400' },
  // new
  laystax: { text: "Lay's Stax", th: 'เลย์ สแตคส์', style: 'oval', bg: '#e4171f', fg: '#ffd400', font: 'pacifico', ring: '#ffd400' },
  karamucho: { text: 'KARAMUCHO', th: 'คารามูโจ้', style: 'block', bg: '#141414', fg: '#ff3b1f', font: 'anton', ring: '#ffcc00' },
  snacktown: { text: 'Snack Town', th: 'สแนคทาวน์', style: 'block', bg: '#00874a', fg: '#ffffff', font: 'lilita', ring: '#f58220' },
  gorigo: { text: 'GORIGO', th: 'โกริโกะ', style: 'block', bg: '#1d2f5c', fg: '#ffd166', font: 'archivo', ring: '#ffd166' },
  dozo: { text: 'DOZO', th: 'โดโซะ', style: 'stamp', bg: '#fff3d6', fg: '#c8102e', font: 'archivo', ring: '#c8102e' },
  bento: { text: 'BENTO', th: 'เบนโตะ', style: 'ribbon', bg: '#e8501c', fg: '#ffffff', font: 'lilita', ring: '#ffd23a' },
  maenapa: { text: 'Mae Napa', th: 'แม่นภา', style: 'pill', bg: '#ffffff', fg: '#1b7f3a', font: 'kanit', ring: '#1b7f3a' },
  entree: { text: 'ENTRÉE', th: 'อองเทร่', style: 'stamp', bg: '#f3e2b3', fg: '#7a1c1c', font: 'chonburi', ring: '#7a1c1c' },
};

// ================================================================================================ ingredients
export const ingredients = {
  banana: I('Banana', 'กล้วย'),
  wasabi: I('Wasabi', 'วาซาบิ'),
  pistachio: I('Pistachio', 'พิสทาชิโอ'),
  macadamia: I('Macadamia', 'แมคคาเดเมีย'),
  squidseason: I('Grilled squid seasoning', 'ผงปรุงรสหมึกย่าง'),
  milkseason: I('Milk seasoning', 'ผงปรุงรสนม'),
  corncob: I('Grilled corn & butter seasoning', 'ผงปรุงรสข้าวโพดย่างเนย'),
};

// ================================================================================================ nutrition
// per-pack [kcal, sugar g, fat g, sodium mg] from a per-100 g profile [kcal, sugar, fat, sodium]
const nutOf = (gr, p) => [Math.round((gr * p[0]) / 500) * 5, Math.round((gr * p[1]) / 10) / 10, Math.round((gr * p[2]) / 10) / 10, Math.round((gr * p[3]) / 1000) * 10];
const NP = {
  chips: [535, 1.5, 33, 620], tube: [525, 1, 31, 650], tortilla: [505, 3, 26, 780], puff: [520, 3, 31, 800], sticks: [520, 3, 29, 700],
  cornsweet: [495, 12, 24, 420], roasted: [480, 6, 34, 1300], fried: [520, 6, 34, 800], tempura: [540, 5, 34, 700], sandwich: [510, 8, 30, 900],
  coated: [510, 7, 27, 420], peanut: [590, 4, 50, 300], mixnut: [610, 4, 52, 300], fish: [440, 14, 14, 900], cracker: [500, 3, 25, 800],
  rind: [550, 0, 36, 900], banana: [500, 30, 25, 40], squid: [310, 22, 3, 2200], rice: [440, 6, 15, 900], popcorn: [440, 38, 13, 350],
};

// ================================================================================================ drawing helpers
// All drawing is in centimetres (the pack painter scales the canvas); every scene fits a box of `s` x `s` centred on (0,0).
function blobPath(ctx, rx, ry, seed = 1, amp = 0.07, lobes = 3, n = 56) {
  const R = rng(seed * 977 + 13), p0 = R() * TAU, p1 = R() * TAU, p2 = R() * TAU;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + amp * (0.7 * Math.sin(lobes * a + p0) + 0.45 * Math.sin((lobes + 2) * a + p1) + 0.4 * Math.sin(2 * a + p2));
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}
// superellipse whose top and bottom edges undulate: a ridged ("wavy") crisp
function ridgePath(ctx, rx, ry, waves = 5, n = 72) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU, ca = Math.cos(a), sa = Math.sin(a);
    const px = Math.sign(ca) * Math.pow(Math.abs(ca), 0.72) * rx;
    const py = Math.sign(sa) * Math.pow(Math.abs(sa), 0.72) * ry + Math.sin((px / rx) * Math.PI * waves * 0.5 + 0.6) * ry * 0.12;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function specks(ctx, rx, ry, n, col, size, seed) {
  const R = rng(seed * 31 + 5);
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R()) * 0.9;
    ctx.beginPath(); ctx.arc(Math.cos(a) * rx * d, Math.sin(a) * ry * d, size * (0.6 + R() * 0.8), 0, TAU); ctx.fill();
  }
}
function sparkle(ctx, x, y, r, col = '#ffffff') {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + r * 0.14, y - r * 0.14, x + r, y); ctx.quadraticCurveTo(x + r * 0.14, y + r * 0.14, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.14, y + r * 0.14, x - r, y); ctx.quadraticCurveTo(x - r * 0.14, y - r * 0.14, x, y - r); ctx.fill();
}
function gloss(ctx, x, y, w, h, rot = -0.5, a = 0.6) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill(); ctx.restore();
}
// union outline: draw several traced shapes so that only the outer contour gets the outline
function union(ctx, shapes, fill, edge, ow) {
  ctx.lineJoin = 'round'; ctx.lineWidth = ow * 2; ctx.strokeStyle = edge;
  for (const f of shapes) { f(); ctx.stroke(); }
  ctx.fillStyle = fill;
  for (const f of shapes) { f(); ctx.fill(); }
}

// ---- potato crisp -------------------------------------------------------------------------------
function chip(ctx, x, y, r, rot, o = {}) {
  const c = o.chip || '#f6c344', ry = r * (o.aspect ?? 0.8), sd = o.seed ?? 1;
  const path = (k = 1) => (o.ridged ? ridgePath(ctx, r * k, ry * k, o.waves ?? 5) : blobPath(ctx, r * k, ry * k, sd, o.amp ?? 0.07));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  // soft shadow
  ctx.save(); ctx.translate(r * 0.07, r * 0.12); path(); ctx.fillStyle = 'rgba(50,25,0,.3)'; ctx.fill(); ctx.restore();
  // fried rim, then the paler face of the crisp
  path(); ctx.fillStyle = darken(c, 0.16); ctx.fill();
  path(0.86); ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.0, [[0, lighten(c, 0.55)], [0.6, lighten(c, 0.12)], [1, c]], -r * 0.28, -ry * 0.3); ctx.fill();
  ctx.save(); path(0.9); ctx.clip();
  const R = rng(sd * 131 + 7);
  if (o.ridged) {
    const n = o.waves ?? 5, P = (4 * r) / n;
    for (let m = -8; m <= 8; m++) {
      const xp = (r * (Math.PI / 2 - 0.6 + TAU * m) * 2) / (Math.PI * n);
      ctx.fillStyle = 'rgba(255,255,255,.26)'; ctx.fillRect(xp - P * 0.14, -ry * 1.4, P * 0.28, ry * 2.8);
      ctx.fillStyle = 'rgba(110,50,0,.2)'; ctx.fillRect(xp + P / 2 - P * 0.14, -ry * 1.4, P * 0.28, ry * 2.8);
    }
  } else {
    for (let i = 0; i < 3; i++) { // blisters
      const bx = (R() - 0.5) * r * 1.1, by = (R() - 0.5) * ry * 1.0, bw = r * (0.11 + R() * 0.1), bh = ry * (0.09 + R() * 0.08), br = R() * 3;
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(bx, by, bw, bh, br, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(150,80,10,.4)'; ctx.lineWidth = r * 0.025; ctx.beginPath(); ctx.ellipse(bx, by, bw, bh, br, 0.3, Math.PI * 1.1); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(130,65,0,.3)';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc((R() - 0.5) * r * 1.5, (R() - 0.5) * ry * 1.5, r * (0.02 + R() * 0.025), 0, TAU); ctx.fill(); }
  }
  if (o.speck) specks(ctx, r, ry, o.nspeck ?? 12, o.speck, r * 0.05, sd);
  ctx.restore();
  path(); ctx.lineWidth = o.lw ?? r * 0.085; ctx.strokeStyle = o.edge || darken(c, 0.62); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = r * 0.05; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(-r * 0.02, ry * 0.05, r * 0.66, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
  ctx.restore();
}
const HEAP = [ // x, y, r, rot, seed  (fractions of the hero box)
  [0.0, -0.1, 0.21, 0.1, 3], [-0.28, -0.03, 0.2, -0.5, 1], [0.28, -0.05, 0.2, 0.5, 2],
  [-0.15, 0.16, 0.22, 0.5, 4], [0.16, 0.15, 0.22, -0.4, 5],
];
function heap(ctx, s, o, dx = 0, k = 1) { for (const [x, y, r, rot, seed] of HEAP) chip(ctx, (x * k + dx) * s, y * k * s, r * k * s, rot, { ...o, seed }); }

// ---- decorations --------------------------------------------------------------------------------
function potato(ctx, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  blobPath(ctx, r * 1.3, r, 9, 0.08, 2);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.5, [[0, '#ecc985'], [1, '#b9843c']], -r * 0.4, -r * 0.4); ctx.fill();
  ctx.lineWidth = r * 0.14; ctx.strokeStyle = '#5a3812'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = '#7a5225';
  for (const [ex, ey] of [[-0.5, -0.2], [0.2, 0.3], [0.6, -0.25]]) { ctx.beginPath(); ctx.ellipse(ex * r, ey * r, r * 0.12, r * 0.07, 0.4, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function noriSheet(ctx, x, y, w, h, rot, o = {}) {
  const base = o.color || '#164226', m = Math.min(w, h);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  rrPath(ctx, -w / 2, -h / 2, w, h, m * 0.08);
  ctx.fillStyle = linGrad(ctx, -w / 2, -h / 2, w / 2, h / 2, [[0, lighten(base, 0.3)], [0.45, base], [1, darken(base, 0.4)]]); ctx.fill();
  ctx.save(); rrPath(ctx, -w / 2, -h / 2, w, h, m * 0.08); ctx.clip();
  const R = rng(o.seed ?? 5);
  ctx.strokeStyle = 'rgba(190,255,190,.17)'; ctx.lineWidth = m * 0.02; ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const yy = -h / 2 + R() * h; ctx.beginPath(); ctx.moveTo(-w / 2 + R() * w * 0.3, yy); ctx.lineTo(w / 2 - R() * w * 0.3, yy + (R() - 0.5) * h * 0.06); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc((R() - 0.5) * w, (R() - 0.5) * h, m * 0.012, 0, TAU); ctx.fill(); }
  if (o.sesame) { ctx.fillStyle = '#f5ecd0'; for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.ellipse((R() - 0.5) * w * 0.9, (R() - 0.5) * h * 0.9, m * 0.02, m * 0.011, R() * 3, 0, TAU); ctx.fill(); } }
  ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.05); ctx.lineTo(-w * 0.1, -h / 2); ctx.lineTo(w * 0.08, -h / 2); ctx.lineTo(-w / 2, h * 0.2); ctx.closePath(); ctx.fill();
  ctx.restore();
  rrPath(ctx, -w / 2, -h / 2, w, h, m * 0.08); ctx.lineWidth = m * 0.055; ctx.strokeStyle = '#06170c'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
function onion(ctx, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round';
  for (const [dx, a] of [[-0.25, -0.35], [0, 0], [0.25, 0.35]]) { ctx.beginPath(); ctx.moveTo(dx * r * 0.3, -r * 0.9); ctx.quadraticCurveTo(dx * r * 1.4, -r * 1.5, dx * r * 2.6 + a * r * 0.4, -r * 2.0); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, -r * 1.2); ctx.bezierCurveTo(r * 0.25, -r * 0.65, r * 1.0, -r * 0.55, r * 0.95, r * 0.12);
  ctx.bezierCurveTo(r * 0.9, r * 0.85, r * 0.35, r * 1.0, 0, r * 1.0); ctx.bezierCurveTo(-r * 0.35, r * 1.0, -r * 0.9, r * 0.85, -r * 0.95, r * 0.12);
  ctx.bezierCurveTo(-r * 1.0, -r * 0.55, -r * 0.25, -r * 0.65, 0, -r * 1.2); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.3, [[0, '#fbf1d6'], [1, '#e0bf80']], -r * 0.3, -r * 0.3); ctx.fill();
  ctx.lineWidth = r * 0.13; ctx.strokeStyle = '#6e4a1c'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(140,90,30,.5)'; ctx.lineWidth = r * 0.06;
  for (const k of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.moveTo(k * r * 0.25, -r * 1.0); ctx.quadraticCurveTo(k * r * 1.2, 0, k * r * 0.4, r * 0.95); ctx.stroke(); }
  ctx.restore();
}
function creamBowl(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-r, -r * 0.2); ctx.quadraticCurveTo(-r * 0.95, r * 0.7, 0, r * 0.75); ctx.quadraticCurveTo(r * 0.95, r * 0.7, r, -r * 0.2); ctx.closePath();
  ctx.fillStyle = '#dbe9f5'; ctx.fill(); ctx.lineWidth = r * 0.1; ctx.strokeStyle = '#2b4a63'; ctx.lineJoin = 'round'; ctx.stroke();
  for (const [ex, ey, rx, ry] of [[0, -0.15, 0.85, 0.32], [0, -0.5, 0.62, 0.28], [0, -0.8, 0.4, 0.24]]) { ellipse(ctx, 0, ey * r, rx * r, ry * r, '#ffffff', '#5a7a94', r * 0.07); }
  circle(ctx, r * 0.02, -r * 1.05, r * 0.12, '#ffffff', '#5a7a94', r * 0.06);
  ctx.strokeStyle = '#43a047'; ctx.lineWidth = r * 0.09; ctx.lineCap = 'round';
  for (const [a, b] of [[-0.3, -0.75], [0.1, -0.85], [0.3, -0.6], [-0.1, -0.4], [0.45, -0.3]]) { ctx.beginPath(); ctx.moveTo(a * r, b * r); ctx.lineTo((a + 0.16) * r, (b - 0.05) * r); ctx.stroke(); }
  ctx.restore();
}
function grillSquid(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = '#8a3f22'; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.07, s * 0.1); ctx.bezierCurveTo(i * s * 0.1, s * 0.25, i * s * 0.03 + (i % 2) * s * 0.06, s * 0.3, i * s * 0.13, s * 0.42); ctx.stroke(); }
  ctx.strokeStyle = '#f3a37a'; ctx.lineWidth = s * 0.035;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.07, s * 0.1); ctx.bezierCurveTo(i * s * 0.1, s * 0.25, i * s * 0.03 + (i % 2) * s * 0.06, s * 0.3, i * s * 0.13, s * 0.42); ctx.stroke(); }
  for (const sx of [-1, 1]) poly(ctx, [[sx * s * 0.1, -s * 0.36], [sx * s * 0.3, -s * 0.28], [sx * s * 0.12, -s * 0.12]], '#f08a5a', '#8a3f22', s * 0.03);
  ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.bezierCurveTo(s * 0.23, -s * 0.33, s * 0.2, -s * 0.05, s * 0.14, s * 0.14); ctx.lineTo(-s * 0.14, s * 0.14); ctx.bezierCurveTo(-s * 0.2, -s * 0.05, -s * 0.23, -s * 0.33, 0, -s * 0.5);
  ctx.fillStyle = linGrad(ctx, -s * 0.2, 0, s * 0.2, 0, [[0, '#f7b98f'], [0.5, '#f4a274'], [1, '#d97a4a']]); ctx.fill();
  ctx.lineWidth = s * 0.04; ctx.strokeStyle = '#8a3f22'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(90,35,12,.55)'; ctx.lineWidth = s * 0.035;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.28 + i * s * 0.11); ctx.lineTo(s * 0.3, -s * 0.16 + i * s * 0.11); ctx.stroke(); }
  ctx.restore();
  gloss(ctx, -s * 0.06, -s * 0.22, s * 0.025, s * 0.09, 0.15, 0.55);
  ctx.restore();
}
function halfEgg(ctx, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ellipse(ctx, 0, 0, r, r * 1.22, '#f2dcc3', '#6e4a2a', r * 0.09);
  ellipse(ctx, 0, 0, r * 0.84, r * 1.05, '#fffdf4', '#d9c9a8', r * 0.03);
  ctx.beginPath(); ctx.arc(0, r * 0.02, r * 0.55, 0, TAU);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 0.6, [[0, '#ffc21a'], [0.7, '#ff9a00'], [1, '#e87500']], -r * 0.15, -r * 0.18); ctx.fill();
  ctx.lineWidth = r * 0.05; ctx.strokeStyle = '#b85e00'; ctx.stroke();
  gloss(ctx, -r * 0.2, -r * 0.22, r * 0.14, r * 0.07, -0.6, 0.7);
  ctx.restore();
}
function flame(ctx, x, y, r) {
  drop(ctx, x, y + r * 0.2, r * 0.75, '#e8261c', '#7a1008', r * 0.11);
  drop(ctx, x + r * 0.05, y + r * 0.34, r * 0.5, '#ff8a1a', null);
  drop(ctx, x + r * 0.08, y + r * 0.46, r * 0.28, '#ffd23a', null);
}
function cheeseWedge(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  poly(ctx, [[-0.4 * s, 0.2 * s], [0.4 * s, 0.2 * s], [0.4 * s, -0.12 * s]], '#ffcb2e', OUT, s * 0.035);
  poly(ctx, [[-0.4 * s, 0.2 * s], [0.4 * s, -0.12 * s], [0.32 * s, -0.24 * s], [-0.46 * s, 0.06 * s]], '#ffe27a', OUT, s * 0.035);
  ctx.fillStyle = '#e0a000';
  for (const [hx, hy, hr] of [[0.15, 0.08, 0.05], [0.28, 0.14, 0.03], [0.05, 0.14, 0.03]]) { ctx.beginPath(); ctx.arc(hx * s, hy * s, hr * s, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// ---- small ingredient icons (own versions: the shared ones use a minimum outline that is far too heavy at pack scale) ----
const bez = (a, b, c, d, t) => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; };
function taperPath(ctx, P, W) { // closed outline around a centre line with per-point half widths
  const L = [], Rr = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    L.push([P[i][0] - dy * W[i], P[i][1] + dx * W[i]]); Rr.push([P[i][0] + dy * W[i], P[i][1] - dx * W[i]]);
  }
  ctx.beginPath(); L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  for (let i = Rr.length - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
  ctx.closePath();
}
function chiliPepper(ctx, x, y, s, rot = 0, c = '#e8261c') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const A = [-0.46 * s, -0.02 * s], B = [-0.16 * s, -0.3 * s], C = [0.2 * s, -0.2 * s], D = [0.5 * s, 0.14 * s], P = [], W = [];
  for (let i = 0; i <= 22; i++) { const t = i / 22; P.push(bez(A, B, C, D, t)); W.push(s * (0.005 + 0.105 * Math.pow(Math.sin(Math.min(1, 0.22 + t * 0.9) * Math.PI * 0.62), 1.2) * (1 - Math.pow(t, 2.4)))); }
  taperPath(ctx, P, W);
  ctx.fillStyle = linGrad(ctx, 0, -s * 0.3, 0, s * 0.15, [[0, lighten(c, 0.25)], [0.5, c], [1, darken(c, 0.35)]]); ctx.fill();
  ctx.lineWidth = s * 0.045; ctx.strokeStyle = darken(c, 0.65); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = s * 0.024; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 2; i <= 14; i++) { const [px, py] = [P[i][0], P[i][1] - W[i] * 0.45]; if (i === 2) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke();
  ellipse(ctx, A[0] - s * 0.005, A[1], s * 0.05, s * 0.1, '#3f9a3a', darken('#3f9a3a', 0.6), s * 0.03, 0.2);
  ctx.strokeStyle = darken('#3f9a3a', 0.6); ctx.lineWidth = s * 0.085; ctx.beginPath(); ctx.moveTo(A[0], A[1] - s * 0.07); ctx.quadraticCurveTo(A[0] - s * 0.02, A[1] - s * 0.16, A[0] - s * 0.1, A[1] - s * 0.17); ctx.stroke();
  ctx.strokeStyle = '#4fae45'; ctx.lineWidth = s * 0.05; ctx.stroke();
  ctx.restore();
}
function prawn(ctx, x, y, s, rot = 0, c = '#ff8a4d') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const R = s * 0.27, span = 3.4, N = 28, P = [], W = [];
  for (let i = 0; i <= N; i++) { const t = i / N, th = -0.7 - span * t; P.push([Math.cos(th) * R, Math.sin(th) * R]); W.push(s * (0.032 + 0.092 * Math.pow(1 - t, 0.8))); }
  const dir = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
  const dT = dir(P[N - 1], P[N]), dH = dir(P[1], P[0]), H = P[0], T = P[N], ta = Math.atan2(dT[1], dT[0]);
  ctx.strokeStyle = darken(c, 0.62); ctx.lineWidth = s * 0.024; ctx.lineCap = 'round';
  for (const k of [-1, 1]) { // antennae
    ctx.beginPath(); ctx.moveTo(H[0] + dH[0] * s * 0.05, H[1] + dH[1] * s * 0.05);
    ctx.quadraticCurveTo(H[0] + dH[0] * s * 0.22 + dH[1] * k * s * 0.1, H[1] + dH[1] * s * 0.22 - dH[0] * k * s * 0.1, H[0] + dH[0] * s * 0.38 + dH[1] * k * s * 0.26, H[1] + dH[1] * s * 0.36 - dH[0] * k * s * 0.26); ctx.stroke();
  }
  for (const da of [-0.6, 0, 0.6]) { ctx.save(); ctx.translate(T[0], T[1]); ctx.rotate(ta + da); ellipse(ctx, s * 0.07, 0, s * 0.085, s * 0.04, lighten(c, 0.08), darken(c, 0.62), s * 0.024); ctx.restore(); } // tail fan
  taperPath(ctx, P, W);
  ctx.fillStyle = linGrad(ctx, -R, -R, R, R, [[0, lighten(c, 0.3)], [0.55, c], [1, darken(c, 0.25)]]); ctx.fill();
  ctx.lineWidth = s * 0.034; ctx.strokeStyle = darken(c, 0.62); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.save(); taperPath(ctx, P, W); ctx.clip(); // body segments + a pale belly-side stripe
  ctx.strokeStyle = 'rgba(130,45,5,.5)'; ctx.lineWidth = s * 0.02;
  for (let i = 4; i < N - 1; i += 3) { const p = P[i], d = dir(P[i - 1], P[i + 1]); ctx.beginPath(); ctx.moveTo(p[0] - d[1] * W[i] * 1.1, p[1] + d[0] * W[i] * 1.1); ctx.lineTo(p[0] + d[1] * W[i] * 1.1, p[1] - d[0] * W[i] * 1.1); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = s * 0.024; ctx.beginPath();
  for (let i = 3; i < N - 4; i++) { const p = P[i], d = dir(P[i - 1], P[i + 1]); const qx = p[0] + d[1] * W[i] * 0.45, qy = p[1] - d[0] * W[i] * 0.45; if (i === 3) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy); } ctx.stroke();
  ctx.restore();
  circle(ctx, H[0], H[1], W[0] * 1.02, lighten(c, 0.05), darken(c, 0.62), s * 0.034);
  poly(ctx, [[H[0] + dH[0] * s * 0.13 + dH[1] * s * 0.02, H[1] + dH[1] * s * 0.13 - dH[0] * s * 0.02], [H[0] + dH[1] * W[0] * 0.6 + dH[0] * s * 0.02, H[1] - dH[0] * W[0] * 0.6 + dH[1] * s * 0.02], [H[0] - dH[1] * W[0] * 0.2 + dH[0] * s * 0.03, H[1] + dH[0] * W[0] * 0.2 + dH[1] * s * 0.03]], darken(c, 0.15), darken(c, 0.62), s * 0.016);
  circle(ctx, H[0] + dH[1] * W[0] * 0.35 + dH[0] * s * 0.02, H[1] - dH[0] * W[0] * 0.35 + dH[1] * s * 0.02, s * 0.022, '#1a1008');
  ctx.restore();
}
function garlicBulb(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(0, -r * 1.1); ctx.bezierCurveTo(r * 0.2, -r * 0.6, r * 1.0, -r * 0.5, r * 0.95, r * 0.2); ctx.bezierCurveTo(r * 0.9, r * 0.85, r * 0.3, r * 1.0, 0, r * 0.95);
  ctx.bezierCurveTo(-r * 0.3, r * 1.0, -r * 0.9, r * 0.85, -r * 0.95, r * 0.2); ctx.bezierCurveTo(-r * 1.0, -r * 0.5, -r * 0.2, -r * 0.6, 0, -r * 1.1); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.3, [[0, '#ffffff'], [1, '#e3d7b8']], -r * 0.3, -r * 0.3); ctx.fill();
  ctx.lineWidth = r * 0.11; ctx.strokeStyle = '#6e5a3a'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(140,110,60,.5)'; ctx.lineWidth = r * 0.06;
  for (const k of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.moveTo(k * r * 0.2, -r * 0.9); ctx.quadraticCurveTo(k * r * 1.1, 0, k * r * 0.35, r * 0.9); ctx.stroke(); }
  ctx.restore();
}
function bananaFruit(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const A = [-0.46 * s, -0.14 * s], B = [-0.25 * s, 0.4 * s], C = [0.2 * s, 0.42 * s], D = [0.48 * s, -0.16 * s], P = [], W = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; P.push(bez(A, B, C, D, t)); W.push(s * (0.02 + 0.1 * Math.pow(Math.sin(Math.PI * t), 0.7))); }
  taperPath(ctx, P, W);
  ctx.fillStyle = linGrad(ctx, 0, -s * 0.1, 0, s * 0.4, [[0, '#ffe96a'], [0.5, '#ffd21e'], [1, '#e0a800']]); ctx.fill();
  ctx.lineWidth = s * 0.04; ctx.strokeStyle = '#7a5410'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(190,130,10,.55)'; ctx.lineWidth = s * 0.014; ctx.beginPath(); for (let i = 3; i <= 21; i++) { if (i === 3) ctx.moveTo(P[i][0], P[i][1] + W[i] * 0.2); else ctx.lineTo(P[i][0], P[i][1] + W[i] * 0.2); } ctx.stroke();
  fillRR(ctx, D[0] - s * 0.03, D[1] - s * 0.09, s * 0.06, s * 0.1, s * 0.015, '#8a6a20', '#3f2a08', s * 0.02);
  circle(ctx, A[0], A[1], s * 0.022, '#4a3208');
  ctx.restore();
}
function riceMound(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ellipse(ctx, 0, r * 0.35, r * 1.05, r * 0.4, '#ffffff', '#8a7a5a', r * 0.07);
  ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 0.3); ctx.bezierCurveTo(-r * 0.8, -r * 0.7, r * 0.8, -r * 0.7, r * 0.8, r * 0.3); ctx.quadraticCurveTo(0, r * 0.6, -r * 0.8, r * 0.3); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.2, [[0, '#ffffff'], [1, '#e8e2cc']], -r * 0.2, -r * 0.3); ctx.fill(); ctx.lineWidth = r * 0.08; ctx.strokeStyle = '#8a7a5a'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.fillStyle = 'rgba(160,150,110,.5)'; const Rn = rng(3); for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse((Rn() - 0.5) * r * 1.2, -Rn() * r * 0.5 + r * 0.05, r * 0.06, r * 0.035, Rn() * 3, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function sprinkleFlakes(ctx, s, col, seed, n = 14, area = 0.4) {
  const R = rng(seed);
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) { ctx.save(); ctx.translate((R() - 0.5) * s * area * 2, (R() - 0.35) * s * area * 1.5); ctx.rotate(R() * 3); ctx.fillRect(-s * 0.014, -s * 0.007, s * 0.03, s * 0.014); ctx.restore(); }
}

// ================================================================================================ scenes: potato chips
// Each flavour decides where the crisps sit (dx = sideways shift, k = scale) and what surrounds them.
const CHIP_DECO = {
  plain: {
    dx: 0.05, k: 0.94,
    back(ctx, s) { potato(ctx, -s * 0.34, s * 0.04, s * 0.14, -0.5); potato(ctx, s * 0.38, -s * 0.12, s * 0.09, 0.7); },
    front(ctx, s) {
      const R = rng(4);
      for (let i = 0; i < 8; i++) { ctx.save(); ctx.translate((R() - 0.5) * s * 0.8, (R() - 0.3) * s * 0.55); ctx.rotate(R() * 3); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#9fb4c4'; ctx.lineWidth = s * 0.008; ctx.fillRect(-s * 0.014, -s * 0.014, s * 0.028, s * 0.028); ctx.strokeRect(-s * 0.014, -s * 0.014, s * 0.028, s * 0.028); ctx.restore(); }
      sparkle(ctx, s * 0.36, -s * 0.2, s * 0.06); sparkle(ctx, -s * 0.4, s * 0.28, s * 0.045);
    },
  },
  nori: {
    dx: 0, k: 0.94,
    back(ctx, s) { noriSheet(ctx, -s * 0.3, s * 0.0, s * 0.5, s * 0.36, -0.55, { seed: 2 }); noriSheet(ctx, s * 0.3, -s * 0.02, s * 0.5, s * 0.36, 0.55, { seed: 3 }); },
    front(ctx, s) { sprinkleFlakes(ctx, s, '#123a20', 8, 24); sparkle(ctx, s * 0.4, s * 0.26, s * 0.05); },
  },
  sour: {
    dx: 0.07, k: 0.9,
    back(ctx, s) { onion(ctx, -s * 0.33, s * 0.05, s * 0.14, -0.2); },
    front(ctx, s) { creamBowl(ctx, s * 0.35, s * 0.2, s * 0.15); sprinkleFlakes(ctx, s, '#3a8f3a', 9, 14); },
  },
  squid: {
    dx: 0.09, k: 0.88,
    back(ctx, s) { grillSquid(ctx, -s * 0.33, s * 0.05, s * 0.6, -0.2); },
    front(ctx, s) { chiliPepper(ctx, s * 0.32, s * 0.22, s * 0.3, 0.3); chiliPepper(ctx, s * 0.4, s * 0.07, s * 0.24, -0.5); sprinkleFlakes(ctx, s, '#b3200f', 10, 12); },
  },
  egg: {
    dx: 0.08, k: 0.9,
    back(ctx, s) { halfEgg(ctx, -s * 0.34, s * 0.04, s * 0.15, -0.3); },
    front(ctx, s) { halfEgg(ctx, s * 0.36, s * 0.2, s * 0.11, 0.5); sprinkleFlakes(ctx, s, '#ffb300', 11, 26); sparkle(ctx, s * 0.38, -s * 0.2, s * 0.06, '#fff2b0'); sparkle(ctx, -s * 0.4, s * 0.3, s * 0.045, '#fff2b0'); },
  },
  bbq: {
    dx: 0.05, k: 0.92,
    back(ctx, s) { flame(ctx, -s * 0.33, s * 0.02, s * 0.24); flame(ctx, s * 0.36, -s * 0.08, s * 0.16); },
    front(ctx, s) { sprinkleFlakes(ctx, s, '#7a2a10', 12, 20); },
  },
};
export function chipScene(ctx, s, o = {}) {
  const d = CHIP_DECO[o.deco] || CHIP_DECO.plain;
  ctx.save();
  d.back(ctx, s);
  heap(ctx, s, { chip: o.chip, speck: o.speck, nspeck: o.ridged ? 6 : 12, ridged: o.ridged, waves: o.waves, edge: o.edge }, d.dx, d.k);
  d.front(ctx, s);
  ctx.restore();
}

// ---- tubes: saddle crisps, the moustache man, stacked crisps ------------------------------------
function saddle(ctx, x, y, r, rot, c = '#f3c24b') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const ry = r * 0.62;
  ctx.save(); ctx.translate(r * 0.05, r * 0.1); blobPath(ctx, r, ry, 4, 0.025, 2); ctx.fillStyle = 'rgba(40,20,0,.3)'; ctx.fill(); ctx.restore();
  blobPath(ctx, r, ry, 4, 0.025, 2);
  ctx.fillStyle = linGrad(ctx, -r, -ry, r, ry, [[0, lighten(c, 0.5)], [0.5, c], [1, darken(c, 0.25)]]); ctx.fill();
  ctx.save(); blobPath(ctx, r, ry, 4, 0.025, 2); ctx.clip();
  ctx.strokeStyle = 'rgba(120,60,0,.35)'; ctx.lineWidth = r * 0.07; ctx.beginPath(); ctx.moveTo(-r, ry * 0.5); ctx.quadraticCurveTo(0, -ry * 0.75, r, ry * 0.5); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.moveTo(-r * 0.8, ry * 0.15); ctx.quadraticCurveTo(-r * 0.1, -ry * 0.95, r * 0.7, -ry * 0.2); ctx.stroke();
  ctx.restore();
  blobPath(ctx, r, ry, 4, 0.025, 2); ctx.lineWidth = r * 0.09; ctx.strokeStyle = darken(c, 0.6); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
function moustacheMan(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  const hair = '#3d2412', skin = '#fbd9b0';
  ellipse(ctx, 0, -r * 0.55, r * 0.98, r * 0.62, hair, OUT, r * 0.07); // hair mass
  for (const sx of [-1, 1]) circle(ctx, sx * r * 0.98, r * 0.02, r * 0.17, skin, OUT, r * 0.07); // ears
  circle(ctx, 0, 0, r, skin, OUT, r * 0.08);
  ctx.beginPath(); ctx.moveTo(-r * 0.95, -r * 0.3); ctx.bezierCurveTo(-r * 0.6, -r * 0.55, -r * 0.05, -r * 0.5, r * 0.2, -r * 0.92); ctx.bezierCurveTo(r * 0.55, -r * 0.65, r * 0.85, -r * 0.55, r * 0.97, -r * 0.3);
  ctx.bezierCurveTo(r * 0.8, -r * 0.75, r * 0.4, -r * 1.02, 0, -r * 1.0); ctx.bezierCurveTo(-r * 0.5, -r * 1.0, -r * 0.85, -r * 0.75, -r * 0.95, -r * 0.3);
  ctx.fillStyle = hair; ctx.fill(); ctx.lineWidth = r * 0.06; ctx.strokeStyle = OUT; ctx.stroke();
  for (const sx of [-1, 1]) {
    circle(ctx, sx * r * 0.66, r * 0.2, r * 0.15, 'rgba(255,120,110,.42)');
    ellipse(ctx, sx * r * 0.36, -r * 0.1, r * 0.17, r * 0.21, '#ffffff', OUT, r * 0.05);
    circle(ctx, sx * r * 0.34, -r * 0.08, r * 0.085, '#1a1008');
    circle(ctx, sx * r * 0.31, -r * 0.12, r * 0.03, '#ffffff');
    ctx.strokeStyle = hair; ctx.lineWidth = r * 0.085; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx * r * 0.16, -r * 0.4); ctx.quadraticCurveTo(sx * r * 0.4, -r * 0.5, sx * r * 0.6, -r * 0.3); ctx.stroke();
  }
  circle(ctx, 0, r * 0.08, r * 0.12, '#f1a985', OUT, r * 0.05);
  ctx.fillStyle = hair; ctx.strokeStyle = OUT; ctx.lineWidth = r * 0.05; ctx.lineJoin = 'round';
  for (const sx of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, r * 0.2);
    ctx.bezierCurveTo(sx * r * 0.3, r * 0.08, sx * r * 0.66, r * 0.16, sx * r * 0.92, r * 0.0);
    ctx.bezierCurveTo(sx * r * 1.14, -r * 0.12, sx * r * 1.22, -r * 0.4, sx * r * 1.04, -r * 0.46);
    ctx.bezierCurveTo(sx * r * 1.1, -r * 0.24, sx * r * 0.98, r * 0.08, sx * r * 0.78, r * 0.28);
    ctx.bezierCurveTo(sx * r * 0.56, r * 0.54, sx * r * 0.24, r * 0.62, 0, r * 0.46);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = r * 0.045; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * r * 0.16, r * 0.26); ctx.quadraticCurveTo(sx * r * 0.55, r * 0.22, sx * r * 0.85, r * 0.08); ctx.stroke(); }
  ctx.restore();
}
const PRINGLES_ICON = {
  none() {},
  onion(ctx, s) { onion(ctx, s * 0.33, -s * 0.3, s * 0.1, 0.3); },
  chili(ctx, s) { chiliPepper(ctx, s * 0.32, -s * 0.28, s * 0.34, 0.25); },
  flame(ctx, s) { flame(ctx, s * 0.34, -s * 0.28, s * 0.16); },
};
export function pringlesScene(ctx, s, o = {}) {
  ctx.save();
  (PRINGLES_ICON[o.icon] || PRINGLES_ICON.none)(ctx, s);
  saddle(ctx, -s * 0.2, s * 0.34, s * 0.2, -0.25, o.chip || '#f3c24b');
  saddle(ctx, s * 0.22, s * 0.32, s * 0.2, 0.2, o.chip || '#f3c24b');
  moustacheMan(ctx, -s * 0.02, -s * 0.05, s * 0.3);
  sparkle(ctx, -s * 0.4, -s * 0.34, s * 0.06);
  ctx.restore();
}
export function staxScene(ctx, s, o = {}) {
  ctx.save();
  const R = rng(21), c = o.chip || '#f4c542';
  onion(ctx, -s * 0.34, s * 0.16, s * 0.13, -0.25);
  creamBowl(ctx, s * 0.34, s * 0.2, s * 0.15);
  for (let i = 0; i < 8; i++) { // tower of crisps, bottom first
    const y = s * 0.4 - i * s * 0.098, jx = (R() - 0.5) * s * 0.03, w = s * 0.5;
    ctx.save(); ctx.translate(jx, y);
    ellipse(ctx, 0, 0, w / 2, s * 0.1, darken(c, 0.12), darken(c, 0.62), s * 0.03);
    ellipse(ctx, 0, -s * 0.014, w / 2 - s * 0.012, s * 0.085, lighten(c, 0.2), null);
    ctx.restore();
  }
  ellipse(ctx, 0, -s * 0.37, s * 0.25, s * 0.1, lighten(c, 0.3), darken(c, 0.62), s * 0.03);
  ctx.save(); ctx.translate(0, -s * 0.37); specks(ctx, s * 0.2, s * 0.06, 9, 'rgba(190,120,20,.6)', s * 0.014, 3); gloss(ctx, -s * 0.08, 0, s * 0.08, s * 0.024, -0.1, 0.7); ctx.restore();
  sparkle(ctx, s * 0.3, -s * 0.36, s * 0.06);
  ctx.restore();
}

// ---- corn snacks --------------------------------------------------------------------------------
function triChip(ctx, x, y, r, rot, o = {}) {
  const c = o.chip || '#f39a1e', seed = o.seed ?? 1;
  const P = [0, 1, 2].map((i) => [Math.cos(-Math.PI / 2 + (i * TAU) / 3) * r, Math.sin(-Math.PI / 2 + (i * TAU) / 3) * r]);
  const path = (k = 1, t = 0.17) => { // straight edges, softly rounded corners, slightly bowed sides
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const cur = P[i], prev = P[(i + 2) % 3], next = P[(i + 1) % 3];
      const a = [(cur[0] + (prev[0] - cur[0]) * t) * k, (cur[1] + (prev[1] - cur[1]) * t) * k];
      const b = [(cur[0] + (next[0] - cur[0]) * t) * k, (cur[1] + (next[1] - cur[1]) * t) * k];
      if (i === 0) ctx.moveTo(a[0], a[1]); else ctx.quadraticCurveTo(((prev[0] + cur[0]) / 2) * k * 1.06, ((prev[1] + cur[1]) / 2) * k * 1.06, a[0], a[1]);
      ctx.quadraticCurveTo(cur[0] * k, cur[1] * k, b[0], b[1]);
    }
    const n0 = P[0], p0 = P[2], a0 = [(n0[0] + (p0[0] - n0[0]) * t) * k, (n0[1] + (p0[1] - n0[1]) * t) * k];
    ctx.quadraticCurveTo(((p0[0] + n0[0]) / 2) * k * 1.06, ((p0[1] + n0[1]) / 2) * k * 1.06, a0[0], a0[1]);
    ctx.closePath();
  };
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.save(); ctx.translate(r * 0.06, r * 0.1); path(); ctx.fillStyle = 'rgba(60,20,0,.3)'; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = darken(c, 0.15); ctx.fill();
  path(0.88); ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.0, [[0, lighten(c, 0.35)], [0.7, c], [1, darken(c, 0.08)]], -r * 0.2, -r * 0.25); ctx.fill();
  ctx.save(); path(0.9); ctx.clip();
  specks(ctx, r * 0.8, r * 0.8, 22, o.dust || 'rgba(214,70,10,.75)', r * 0.045, seed);
  specks(ctx, r * 0.8, r * 0.8, 10, 'rgba(255,225,120,.7)', r * 0.035, seed + 7);
  ctx.restore();
  path(); ctx.lineWidth = r * 0.085; ctx.strokeStyle = darken(c, 0.62); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = r * 0.05; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.12); ctx.lineTo(-r * 0.05, -r * 0.62); ctx.stroke();
  ctx.restore();
}
export function tortillaScene(ctx, s) {
  ctx.save();
  flame(ctx, -s * 0.34, -s * 0.02, s * 0.2);
  flame(ctx, s * 0.35, -s * 0.06, s * 0.16);
  triChip(ctx, -s * 0.21, s * 0.1, s * 0.29, -0.42, { seed: 1 });
  triChip(ctx, s * 0.23, s * 0.08, s * 0.29, 0.5, { seed: 2 });
  triChip(ctx, s * 0.02, s * 0.03, s * 0.32, 0.0, { seed: 3 });
  triChip(ctx, s * 0.0, s * 0.24, s * 0.18, 3.2, { seed: 4 });
  sparkle(ctx, s * 0.4, s * 0.24, s * 0.05, '#fff2b0');
  ctx.restore();
}
function curl(ctx, x, y, len, rot, o = {}) {
  const c = o.chip || '#f6a01a', w = len * 0.4;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const path = () => { ctx.beginPath(); ctx.moveTo(-len * 0.42, len * 0.14); ctx.bezierCurveTo(-len * 0.3, -len * 0.4, len * 0.1, len * 0.34, len * 0.42, -len * 0.14); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  path(); ctx.lineWidth = w + len * 0.09; ctx.strokeStyle = 'rgba(60,20,0,.3)'; ctx.save(); ctx.translate(len * 0.03, len * 0.06); ctx.stroke(); ctx.restore();
  path(); ctx.lineWidth = w + len * 0.09; ctx.strokeStyle = darken(c, 0.62); ctx.stroke();
  path(); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke();
  path(); ctx.lineWidth = w * 0.82; ctx.strokeStyle = lighten(c, 0.12); ctx.setLineDash([w * 0.2, w * 0.42]); ctx.stroke(); ctx.setLineDash([]);
  ctx.save(); ctx.translate(0, -w * 0.2); path(); ctx.lineWidth = w * 0.2; ctx.strokeStyle = 'rgba(255,240,170,.85)'; ctx.stroke(); ctx.restore();
  path(); ctx.lineWidth = w * 0.9; ctx.strokeStyle = o.dust || 'rgba(214,70,10,.6)'; ctx.setLineDash([len * 0.012, len * 0.07]); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}
function cornCob(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (const [sx, a] of [[-1, 0.35], [1, -0.35]]) { ctx.save(); ctx.translate(sx * s * 0.03, s * 0.3); ctx.rotate(a); leaf(ctx, 0, 0, s * 0.52, s * 0.11, -Math.PI / 2 - sx * 0.25, '#4caf50'); ctx.restore(); }
  fillRR(ctx, -s * 0.13, -s * 0.36, s * 0.26, s * 0.7, s * 0.12, linGrad(ctx, -s * 0.13, 0, s * 0.13, 0, [[0, '#f4b800'], [0.45, '#ffe066'], [1, '#e09a00']]), OUT, s * 0.03);
  ctx.save(); rrPath(ctx, -s * 0.13, -s * 0.36, s * 0.26, s * 0.7, s * 0.12); ctx.clip();
  ctx.strokeStyle = 'rgba(160,90,0,.45)'; ctx.lineWidth = s * 0.012;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.04, -s * 0.4); ctx.lineTo(i * s * 0.04, s * 0.4); ctx.stroke(); }
  for (let j = -8; j <= 8; j++) { ctx.beginPath(); ctx.moveTo(-s * 0.14, j * s * 0.04); ctx.lineTo(s * 0.14, j * s * 0.04); ctx.stroke(); }
  ctx.restore();
  fillRR(ctx, -s * 0.11, -s * 0.34, s * 0.22, s * 0.12, s * 0.03, '#fff3a8', '#c9a300', s * 0.022);
  gloss(ctx, -s * 0.03, -s * 0.28, s * 0.05, s * 0.018, -0.1, 0.8);
  ctx.restore();
}
const CHEETOS_BACK = {
  cheese(ctx, s) { cheeseWedge(ctx, -s * 0.3, s * 0.06, s * 0.46, -0.15); },
  corn(ctx, s) { cornCob(ctx, -s * 0.31, s * 0.02, s * 0.72, -0.2); },
};
export function cheetosScene(ctx, s, o = {}) {
  ctx.save();
  (CHEETOS_BACK[o.deco] || CHEETOS_BACK.cheese)(ctx, s);
  const L = [[0.12, -0.15, 0.38, -0.3], [0.3, 0.02, 0.38, 0.6], [-0.03, 0.05, 0.38, 0.15], [0.34, -0.2, 0.3, 1.0], [0.12, 0.22, 0.36, -0.2]];
  for (const [x, y, len, rot] of L) curl(ctx, x * s, y * s, len * s, rot, { chip: o.chip, dust: o.dust });
  sparkle(ctx, s * 0.4, s * 0.22, s * 0.05, '#fff2b0');
  ctx.restore();
}
export function sticksScene(ctx, s, o = {}) {
  ctx.save();
  const c = o.chip || '#f4c542', R = rng(17);
  flame(ctx, -s * 0.32, s * 0.02, s * 0.15);
  for (let i = 0; i < 13; i++) {
    const a = -0.62 + i * 0.104, len = s * (0.52 + R() * 0.08);   // tallest stick tops out at -0.24 s: clear of the logo's Thai line
    ctx.save(); ctx.translate(0, s * 0.36); ctx.rotate(a);
    fillRR(ctx, -s * 0.03, -len, s * 0.06, len, s * 0.03, c, darken(c, 0.62), s * 0.014);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-s * 0.015, -len * 0.92, s * 0.012, len * 0.7);
    ctx.fillStyle = o.dust || 'rgba(200,40,10,.65)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc((R() - 0.5) * s * 0.04, -R() * len * 0.9, s * 0.008, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  chiliPepper(ctx, s * 0.32, s * 0.22, s * 0.32, 0.2);
  chiliPepper(ctx, s * 0.4, s * 0.06, s * 0.24, -0.6);
  ctx.restore();
}
function puff(ctx, x, y, r, seed, c) {
  ctx.save(); ctx.translate(x, y);
  ctx.save(); ctx.translate(r * 0.08, r * 0.14); blobPath(ctx, r, r * 0.95, seed, 0.05, 4); ctx.fillStyle = 'rgba(50,30,0,.28)'; ctx.fill(); ctx.restore();
  blobPath(ctx, r, r * 0.95, seed, 0.05, 4);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.2, [[0, lighten(c, 0.55)], [0.6, c], [1, darken(c, 0.2)]], -r * 0.3, -r * 0.35); ctx.fill();
  ctx.lineWidth = r * 0.11; ctx.strokeStyle = darken(c, 0.6); ctx.lineJoin = 'round'; ctx.stroke();
  specks(ctx, r * 0.7, r * 0.7, 7, 'rgba(150,90,20,.5)', r * 0.05, seed);
  gloss(ctx, -r * 0.3, -r * 0.35, r * 0.2, r * 0.09, -0.6, 0.7);
  ctx.restore();
}
function ringSnack(ctx, x, y, r, rot, seed, c) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const tr = () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.moveTo(r * 0.44, 0); ctx.arc(0, 0, r * 0.44, 0, TAU, true); };
  ctx.save(); ctx.translate(r * 0.08, r * 0.12); tr(); ctx.fillStyle = 'rgba(50,30,0,.28)'; ctx.fill('evenodd'); ctx.restore();
  tr(); ctx.fillStyle = radGrad(ctx, 0, 0, r * 0.4, r * 1.05, [[0, darken(c, 0.05)], [0.55, lighten(c, 0.25)], [1, darken(c, 0.15)]]); ctx.fill('evenodd');
  ctx.save(); tr(); ctx.clip('evenodd'); specks(ctx, r * 0.9, r * 0.9, 24, 'rgba(210,90,10,.55)', r * 0.045, seed); ctx.restore();
  tr(); ctx.lineWidth = r * 0.1; ctx.strokeStyle = darken(c, 0.62); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = r * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, r * 0.74, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
  ctx.restore();
}
export function puffScene(ctx, s, o = {}) {
  ctx.save();
  if (o.deco === 'milk') {
    drawIllus(ctx, 'milkSplash', 0, s * 0.06, s * 0.68, {});
    const P = [[-0.22, 0.04, 0.14], [0.02, -0.05, 0.15], [0.24, 0.05, 0.14], [-0.1, 0.2, 0.14], [0.14, 0.2, 0.14], [-0.34, 0.22, 0.11], [0.34, 0.24, 0.11]];
    P.forEach(([x, y, r], i) => puff(ctx, x * s, y * s, r * s, i + 1, o.chip || '#f7dc8a'));
  } else {
    cheeseWedge(ctx, -s * 0.32, s * 0.02, s * 0.36, -0.2);
    const P = [[0.02, -0.1, 0.19, 0.2], [0.26, 0.06, 0.19, 0.6], [-0.06, 0.16, 0.19, -0.3], [0.32, -0.2, 0.15, 0.1], [0.2, 0.26, 0.15, 0.5]];
    P.forEach(([x, y, r, rot], i) => ringSnack(ctx, x * s, y * s, r * s, rot, i + 2, o.chip || '#f5b32f'));
  }
  sparkle(ctx, s * 0.38, -s * 0.22, s * 0.05, '#fff2b0');
  ctx.restore();
}

// ================================================================================================ scenes: seaweed
function rectBlob(ctx, rx, ry, seed = 1, amp = 0.03, e = 6, n = 110, freq = [7, 11, 3]) {
  const R = rng(seed * 733 + 5), p = [R() * TAU, R() * TAU, R() * TAU];
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU, ca = Math.cos(a), sa = Math.sin(a);
    const k = 1 + amp * (Math.sin(freq[0] * a + p[0]) * 0.6 + Math.sin(freq[1] * a + p[1]) * 0.5 + Math.sin(freq[2] * a + p[2]) * 0.4);
    const x = Math.sign(ca) * Math.pow(Math.abs(ca), 2 / e) * rx * k, y = Math.sign(sa) * Math.pow(Math.abs(sa), 2 / e) * ry * k;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}
function crispSheet(ctx, x, y, w, h, rot, o = {}) {
  const base = o.color || '#1d4a27', sd = o.seed ?? 3, R = rng(sd * 91 + 3);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const path = (k = 1) => rectBlob(ctx, (w / 2) * k, (h / 2) * k, sd, 0.035, 6);
  ctx.save(); ctx.translate(w * 0.04, h * 0.05); path(); ctx.fillStyle = 'rgba(0,20,5,.3)'; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = linGrad(ctx, -w / 2, -h / 2, w / 2, h / 2, [[0, lighten(base, 0.3)], [0.5, base], [1, darken(base, 0.45)]]); ctx.fill();
  ctx.save(); path(0.97); ctx.clip();
  for (let i = 0; i < 16; i++) { // fry blisters
    const bx = (R() - 0.5) * w * 0.9, by = (R() - 0.5) * h * 0.9, br = Math.min(w, h) * (0.05 + R() * 0.09);
    ctx.fillStyle = 'rgba(214,190,90,.5)'; ctx.beginPath(); ctx.ellipse(bx, by, br, br * 0.8, R() * 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,50,20,.55)'; ctx.lineWidth = Math.min(w, h) * 0.014; ctx.beginPath(); ctx.ellipse(bx, by, br, br * 0.8, 0, 0.2, 2.6); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(-w * 0.12, -h * 0.22, w * 0.3, h * 0.06, -0.5, 0, TAU); ctx.fill();
  ctx.restore();
  path(); ctx.lineWidth = Math.min(w, h) * 0.055; ctx.strokeStyle = '#0a1f0d'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
function tempuraSheet(ctx, x, y, w, h, rot, o = {}) {
  const sd = o.seed ?? 3, R = rng(sd * 57 + 9), m = Math.min(w, h), batter = o.batter || '#f3c455';
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const outer = () => rectBlob(ctx, w / 2, h / 2, sd, 0.075, 4, 130, [9, 15, 5]);
  ctx.save(); ctx.translate(w * 0.04, h * 0.05); outer(); ctx.fillStyle = 'rgba(70,40,0,.3)'; ctx.fill(); ctx.restore();
  outer(); ctx.fillStyle = linGrad(ctx, -w / 2, -h / 2, w / 2, h / 2, [[0, lighten(batter, 0.35)], [0.5, batter], [1, darken(batter, 0.25)]]); ctx.fill();
  ctx.lineWidth = m * 0.05; ctx.strokeStyle = darken(batter, 0.62); ctx.lineJoin = 'round'; ctx.stroke();
  rectBlob(ctx, w * 0.36, h * 0.36, sd + 1, 0.04, 5); ctx.fillStyle = linGrad(ctx, -w / 2, -h / 2, w / 2, h / 2, [[0, '#2f6b3c'], [0.5, '#173f24'], [1, '#0a2413']]); ctx.fill();
  ctx.lineWidth = m * 0.025; ctx.strokeStyle = 'rgba(10,30,15,.9)'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,170,.75)'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc((R() - 0.5) * w * 0.7, (R() - 0.5) * h * 0.7, m * 0.014, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-w * 0.2, -h * 0.34, w * 0.14, h * 0.025, -0.4, 0, TAU); ctx.fill();
  ctx.restore();
}
function noriRoll(ctx, x, y, len, dia, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.save(); ctx.translate(dia * 0.12, dia * 0.2); fillRR(ctx, -len / 2, -dia / 2, len, dia, dia * 0.2, 'rgba(0,20,5,.3)'); ctx.restore();
  fillRR(ctx, -len / 2, -dia / 2, len, dia, dia * 0.2, linGrad(ctx, 0, -dia / 2, 0, dia / 2, [[0, '#3a7d49'], [0.4, '#1a4a29'], [1, '#07170d']]), '#06170c', dia * 0.07);
  ctx.save(); rrPath(ctx, -len / 2, -dia / 2, len, dia, dia * 0.2); ctx.clip();
  ctx.strokeStyle = 'rgba(150,230,160,.2)'; ctx.lineWidth = dia * 0.03;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(-len / 2, i * dia * 0.13); ctx.lineTo(len / 2, i * dia * 0.13 + dia * 0.02); ctx.stroke(); }
  ctx.fillStyle = '#f5ecd0'; const R = rng(11); for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.ellipse((R() - 0.5) * len * 0.9, (R() - 0.5) * dia * 0.8, dia * 0.04, dia * 0.022, R() * 3, 0, TAU); ctx.fill(); }
  ctx.restore();
  ellipse(ctx, len / 2, 0, dia * 0.3, dia / 2, '#2a6a3a', '#06170c', dia * 0.07);
  ctx.strokeStyle = '#0c2a16'; ctx.lineWidth = dia * 0.04;
  for (const f of [0.72, 0.46, 0.2]) { ctx.beginPath(); ctx.ellipse(len / 2, 0, dia * 0.3 * f, (dia / 2) * f, 0, 0, TAU); ctx.stroke(); }
  gloss(ctx, -len * 0.12, -dia * 0.28, len * 0.28, dia * 0.05, 0, 0.4);
  ctx.restore();
}
function laverSandwich(ctx, x, y, w, rot, o = {}) {
  const h = w * 0.86, R = rng((o.seed ?? 2) * 41);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.save(); ctx.translate(w * 0.05, w * 0.1); fillRR(ctx, -w / 2, -h / 2, w, h, w * 0.06, 'rgba(0,10,30,.3)'); ctx.restore();
  fillRR(ctx, -w / 2, -h / 2 + w * 0.13, w, h, w * 0.06, '#0d1f2b', '#050d14', w * 0.04);
  fillRR(ctx, -w * 0.47, -h / 2 + w * 0.07, w * 0.94, w * 0.1, w * 0.03, o.fill || '#f2c14e', '#7a5a10', w * 0.02);
  fillRR(ctx, -w / 2, -h / 2, w, h, w * 0.06, linGrad(ctx, -w / 2, -h / 2, w / 2, h / 2, [[0, '#2c4a3a'], [0.5, '#12281e'], [1, '#06120c']]), '#050d14', w * 0.04);
  ctx.save(); rrPath(ctx, -w / 2, -h / 2, w, h, w * 0.06); ctx.clip();
  ctx.strokeStyle = 'rgba(190,255,200,.14)'; ctx.lineWidth = w * 0.014;
  for (let i = 0; i < 9; i++) { const yy = -h / 2 + R() * h; ctx.beginPath(); ctx.moveTo(-w / 2, yy); ctx.lineTo(w / 2, yy + (R() - 0.5) * h * 0.06); ctx.stroke(); }
  ctx.fillStyle = '#f5ecd0'; for (let i = 0; i < 26; i++) { ctx.beginPath(); ctx.ellipse((R() - 0.5) * w * 0.9, (R() - 0.5) * h * 0.9, w * 0.028, w * 0.016, R() * 3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.1); ctx.lineTo(-w * 0.05, -h / 2); ctx.lineTo(w * 0.12, -h / 2); ctx.lineTo(-w / 2, h * 0.2); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.restore();
}
function kelp(ctx, x, y, h, rot, c = '#6f9a2c') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const w = h * 0.2, N = 24, L = [], Rt = [], mid = [];
  for (let i = 0; i <= N; i++) { const t = i / N, cx = Math.sin(t * 5.2) * w * 0.9, half = w * 0.5 * (1 - t * 0.7), py = h * (0.5 - t); L.push([cx - half, py]); Rt.push([cx + half, py]); mid.push([cx, py]); }
  ctx.beginPath(); L.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  for (let i = N; i >= 0; i--) ctx.lineTo(Rt[i][0], Rt[i][1]);
  ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = h * 0.022; ctx.strokeStyle = darken(c, 0.6); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = h * 0.012; ctx.beginPath(); mid.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
  ctx.restore();
}
const SEA_DECO = {
  roasted(ctx, s) { kelp(ctx, -s * 0.4, s * 0.02, s * 0.5, 0.12); kelp(ctx, s * 0.42, s * 0.0, s * 0.42, -0.15, '#5b8a2a'); },
  chili(ctx, s) { chiliPepper(ctx, s * 0.32, s * 0.22, s * 0.32, 0.2); chiliPepper(ctx, s * 0.42, s * 0.04, s * 0.24, -0.6); chiliPepper(ctx, -s * 0.36, s * 0.2, s * 0.24, 2.6); },
  tomyum(ctx, s) {
    drawIllus(ctx, 'herb', -s * 0.36, s * 0.0, s * 0.42, { c1: '#5ea34a' });
    prawn(ctx, -s * 0.3, s * 0.22, s * 0.34, 0, '#ff7a3d');
    drawIllus(ctx, 'lime', s * 0.36, s * 0.2, s * 0.26, {});
    chiliPepper(ctx, s * 0.4, -s * 0.02, s * 0.26, -0.7);
  },
  prawn(ctx, s) {
    riceMound(ctx, -s * 0.31, s * 0.16, s * 0.2);
    prawn(ctx, -s * 0.33, s * 0.05, s * 0.28, 0, '#ff8a3d');
    prawn(ctx, s * 0.36, s * 0.2, s * 0.3, 0, '#ff7a3d');
    ellipse(ctx, s * 0.14, s * 0.3, s * 0.07, s * 0.035, '#ff9a1f', '#a35a00', s * 0.012);
  },
  egg(ctx, s) { halfEgg(ctx, s * 0.37, s * 0.2, s * 0.11, 0.5); halfEgg(ctx, -s * 0.38, s * 0.24, s * 0.09, -0.4); },
  none() {},
};
export function seaScene(ctx, s, o = {}) {
  const k = o.kind || 'roasted', deco = SEA_DECO[o.deco] || SEA_DECO.none;
  ctx.save();
  if (o.deco === 'roasted') deco(ctx, s); // kelp fronds go behind the sheets
  if (k === 'roasted') {
    noriSheet(ctx, -s * 0.2, s * 0.04, s * 0.34, s * 0.48, -0.32, { seed: 2, sesame: true });
    noriSheet(ctx, s * 0.2, s * 0.04, s * 0.34, s * 0.48, 0.32, { seed: 3, sesame: true });
    noriSheet(ctx, 0, s * 0.07, s * 0.36, s * 0.5, 0, { seed: 4, sesame: true });
  } else if (k === 'roll') {
    noriRoll(ctx, -s * 0.04, -s * 0.06, s * 0.6, s * 0.17, -0.22);
    noriRoll(ctx, s * 0.06, s * 0.14, s * 0.6, s * 0.17, 0.16);
    noriRoll(ctx, -s * 0.02, s * 0.29, s * 0.56, s * 0.17, -0.06);
  } else if (k === 'fried') {
    crispSheet(ctx, -s * 0.18, s * 0.04, s * 0.36, s * 0.48, -0.3, { seed: 2 });
    crispSheet(ctx, s * 0.2, s * 0.03, s * 0.36, s * 0.48, 0.3, { seed: 5 });
    crispSheet(ctx, 0, s * 0.07, s * 0.38, s * 0.5, 0.02, { seed: 8 });
  } else if (k === 'tempura') {
    tempuraSheet(ctx, -s * 0.2, s * 0.04, s * 0.38, s * 0.46, -0.3, { seed: 2, batter: o.batter });
    tempuraSheet(ctx, s * 0.2, s * 0.03, s * 0.38, s * 0.46, 0.3, { seed: 5, batter: o.batter });
    tempuraSheet(ctx, 0, s * 0.08, s * 0.4, s * 0.5, 0.0, { seed: 8, batter: o.batter });
  } else if (k === 'sandwich') {
    laverSandwich(ctx, -s * 0.22, s * 0.02, s * 0.36, -0.28, { seed: 2, fill: o.fill });
    laverSandwich(ctx, s * 0.22, s * 0.02, s * 0.36, 0.3, { seed: 3, fill: o.fill });
    laverSandwich(ctx, 0, s * 0.1, s * 0.4, 0.02, { seed: 4, fill: o.fill });
  }
  if (o.deco !== 'roasted') deco(ctx, s);
  sparkle(ctx, s * 0.4, -s * 0.22, s * 0.05, '#fff2b0');
  ctx.restore();
}

// ================================================================================================ scenes: nuts & dried snacks
function nugget(ctx, x, y, r, rot, seed, c = '#e3b26a') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.save(); ctx.translate(r * 0.08, r * 0.14); blobPath(ctx, r, r * 0.9, seed, 0.06, 5); ctx.fillStyle = 'rgba(50,25,0,.3)'; ctx.fill(); ctx.restore();
  blobPath(ctx, r, r * 0.9, seed, 0.06, 5);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.15, [[0, lighten(c, 0.5)], [0.6, c], [1, darken(c, 0.25)]], -r * 0.3, -r * 0.35); ctx.fill();
  ctx.save(); blobPath(ctx, r, r * 0.9, seed, 0.06, 5); ctx.clip();
  specks(ctx, r * 0.9, r * 0.8, 9, 'rgba(120,70,20,.55)', r * 0.06, seed);
  specks(ctx, r * 0.9, r * 0.8, 6, 'rgba(255,240,200,.65)', r * 0.045, seed + 3);
  ctx.restore();
  blobPath(ctx, r, r * 0.9, seed, 0.06, 5); ctx.lineWidth = r * 0.11; ctx.strokeStyle = darken(c, 0.62); ctx.lineJoin = 'round'; ctx.stroke();
  gloss(ctx, -r * 0.3, -r * 0.35, r * 0.2, r * 0.09, -0.6, 0.65);
  ctx.restore();
}
function peanutShell(ctx, x, y, len, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const r = len * 0.25;
  const shapes = [
    () => { ctx.beginPath(); ctx.ellipse(-len * 0.24, 0, len * 0.27, r * 1.05, 0, 0, TAU); },
    () => { ctx.beginPath(); ctx.ellipse(len * 0.24, 0, len * 0.27, r * 1.05, 0, 0, TAU); },
    () => { ctx.beginPath(); ctx.ellipse(0, 0, len * 0.16, r * 0.8, 0, 0, TAU); },
  ];
  union(ctx, shapes, '#dcb57c', OUT, len * 0.026);
  ctx.strokeStyle = 'rgba(120,80,30,.45)'; ctx.lineWidth = len * 0.012;
  for (const cx of [-0.24, 0.24]) for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx * len - len * 0.16, i * r * 0.36 + r * 0.1); ctx.lineTo(cx * len + len * 0.16, i * r * 0.36 - r * 0.1); ctx.stroke(); }
  gloss(ctx, -len * 0.26, -r * 0.5, len * 0.1, len * 0.03, 0, 0.45);
  ctx.restore();
}
function coconutHalf(ctx, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ellipse(ctx, 0, 0, r, r * 0.95, '#6b4526', OUT, r * 0.09);
  ellipse(ctx, 0, -r * 0.04, r * 0.82, r * 0.78, '#f7f1e2', '#c9bda0', r * 0.04);
  ellipse(ctx, 0, -r * 0.04, r * 0.58, r * 0.54, '#ffffff', null);
  ctx.strokeStyle = 'rgba(200,190,160,.7)'; ctx.lineWidth = r * 0.03; ctx.beginPath(); ctx.ellipse(0, -r * 0.04, r * 0.4, r * 0.36, 0, 0.3, 2.4); ctx.stroke();
  gloss(ctx, -r * 0.3, -r * 0.42, r * 0.16, r * 0.06, -0.5, 0.8);
  ctx.restore();
}
function wasabiMound(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  leaf(ctx, -r * 0.2, r * 0.25, r * 1.3, r * 0.45, -2.5, '#3e8e2e'); leaf(ctx, r * 0.2, r * 0.25, r * 1.3, r * 0.45, -0.6, '#4ba43a');
  for (const [ex, ey, rx, ry] of [[0, 0.1, 0.85, 0.34], [0, -0.22, 0.62, 0.3], [0, -0.5, 0.38, 0.24]]) ellipse(ctx, 0, ey * r, rx * r, ry * r, '#b6dc5a', '#4a7a1c', r * 0.07);
  circle(ctx, r * 0.02, -r * 0.78, r * 0.12, '#c9e878', '#4a7a1c', r * 0.05);
  gloss(ctx, -r * 0.2, -r * 0.3, r * 0.12, r * 0.05, -0.4, 0.7);
  ctx.restore();
}
const PEANUT_DECO = {
  coconut(ctx, s) { drawIllus(ctx, 'herb', -s * 0.36, -s * 0.06, s * 0.5, { c1: '#3f9a4a' }); coconutHalf(ctx, -s * 0.33, s * 0.1, s * 0.16, -0.3); },
  wasabi(ctx, s) { noriSheet(ctx, s * 0.33, -s * 0.02, s * 0.36, s * 0.26, 0.6, { seed: 3 }); wasabiMound(ctx, -s * 0.34, s * 0.1, s * 0.15); },
  natural(ctx, s) { peanutShell(ctx, -s * 0.28, s * 0.22, s * 0.3, -0.5); peanutShell(ctx, s * 0.3, s * 0.2, s * 0.28, 0.4); peanutShell(ctx, s * 0.36, -s * 0.06, s * 0.24, -1.0); },
};
function peanutKernel(ctx, x, y, l, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const shapes = [
    () => { ctx.beginPath(); ctx.ellipse(-l * 0.19, 0, l * 0.3, l * 0.27, 0, 0, TAU); },
    () => { ctx.beginPath(); ctx.ellipse(l * 0.19, 0, l * 0.3, l * 0.27, 0, 0, TAU); },
  ];
  ctx.save(); ctx.translate(l * 0.05, l * 0.09); ctx.fillStyle = 'rgba(50,25,0,.3)'; for (const f of shapes) { f(); ctx.fill(); } ctx.restore();
  union(ctx, shapes, '#d9a468', '#4a2a10', l * 0.035);
  ctx.strokeStyle = 'rgba(120,60,20,.6)'; ctx.lineWidth = l * 0.025; ctx.beginPath(); ctx.moveTo(-l * 0.4, l * 0.02); ctx.quadraticCurveTo(0, -l * 0.05, l * 0.4, l * 0.03); ctx.stroke();
  ctx.fillStyle = 'rgba(160,70,30,.5)'; const R = rng(Math.round(x * 100 + y * 31) + 4); for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse((R() - 0.5) * l * 0.8, (R() - 0.5) * l * 0.45, l * 0.03, l * 0.018, R() * 3, 0, TAU); ctx.fill(); }
  gloss(ctx, -l * 0.25, -l * 0.14, l * 0.11, l * 0.035, -0.2, 0.55);
  ctx.restore();
}
export function peanutScene(ctx, s, o = {}) {
  ctx.save();
  (PEANUT_DECO[o.deco] || PEANUT_DECO.natural)(ctx, s);
  const P = [[0.0, -0.12, 0.13, 0.2, 1], [-0.16, 0.02, 0.13, 0.9, 2], [0.16, 0.0, 0.13, 0.4, 3], [-0.02, 0.06, 0.14, 0.1, 4], [-0.13, 0.2, 0.12, 0.6, 5], [0.14, 0.2, 0.12, 0.3, 6], [0.02, 0.24, 0.12, 0.8, 7]];
  for (const [x, y, r, rot, sd] of P) { if (o.kernel) peanutKernel(ctx, x * s, y * s, r * 2.1 * s, rot * 2); else nugget(ctx, x * s, y * s, r * s, rot, sd, o.chip || '#e3b26a'); }
  sparkle(ctx, s * 0.4, -s * 0.24, s * 0.05, '#fff2b0');
  ctx.restore();
}
function almond(ctx, x, y, l, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const p = () => { ctx.beginPath(); ctx.moveTo(-l * 0.5, 0); ctx.bezierCurveTo(-l * 0.5, -l * 0.34, l * 0.2, -l * 0.36, l * 0.5, 0); ctx.bezierCurveTo(l * 0.2, l * 0.34, -l * 0.5, l * 0.36, -l * 0.5, 0); };
  p(); ctx.fillStyle = radGrad(ctx, 0, 0, 0, l * 0.6, [[0, '#d19a5a'], [1, '#93591f']], -l * 0.15, -l * 0.15); ctx.fill();
  ctx.lineWidth = l * 0.07; ctx.strokeStyle = '#4a2a0c'; ctx.lineJoin = 'round'; p(); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,35,10,.6)'; ctx.lineWidth = l * 0.03; ctx.beginPath(); ctx.moveTo(-l * 0.32, l * 0.02); ctx.quadraticCurveTo(0, -l * 0.08, l * 0.36, 0); ctx.stroke();
  gloss(ctx, -l * 0.12, -l * 0.16, l * 0.14, l * 0.045, -0.15, 0.5);
  ctx.restore();
}
function cashew(ctx, x, y, l, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const p = () => { ctx.beginPath(); ctx.arc(0, l * 0.18, l * 0.36, Math.PI * 1.08, Math.PI * 1.92); };
  ctx.lineCap = 'round';
  p(); ctx.lineWidth = l * 0.34; ctx.strokeStyle = '#4a3a20'; ctx.stroke();
  p(); ctx.lineWidth = l * 0.24; ctx.strokeStyle = '#f2dfae'; ctx.stroke();
  p(); ctx.lineWidth = l * 0.08; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.save(); ctx.translate(-l * 0.02, -l * 0.06); ctx.stroke(); ctx.restore();
  ctx.restore();
}
function pistachio(ctx, x, y, l, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ellipse(ctx, 0, 0, l * 0.44, l * 0.28, '#e6d2a4', '#5a4020', l * 0.06);
  ellipse(ctx, l * 0.06, 0, l * 0.32, l * 0.18, '#a5c94a', '#4a6a14', l * 0.045);
  ctx.strokeStyle = 'rgba(70,90,20,.6)'; ctx.lineWidth = l * 0.03; ctx.beginPath(); ctx.moveTo(-l * 0.14, l * 0.02); ctx.quadraticCurveTo(l * 0.06, -l * 0.06, l * 0.3, 0); ctx.stroke();
  gloss(ctx, l * 0.02, -l * 0.08, l * 0.08, l * 0.03, 0, 0.6);
  ctx.restore();
}
function macadamia(ctx, x, y, r) {
  circle(ctx, x, y, r, radGrad(ctx, x, y, 0, r * 1.2, [[0, '#fff3d2'], [1, '#d9b878']], x - r * 0.3, y - r * 0.3), '#5a4020', r * 0.1);
  gloss(ctx, x - r * 0.3, y - r * 0.35, r * 0.25, r * 0.1, -0.6, 0.7);
}
export function mixnutScene(ctx, s) {
  ctx.save();
  const N = [
    ['a', -0.28, 0.06, 0.26, 0.4], ['c', 0.0, -0.1, 0.26, 0.2], ['a', 0.27, 0.0, 0.26, -0.5], ['p', -0.05, 0.1, 0.25, 0.3], ['c', -0.24, -0.1, 0.24, -0.6],
    ['m', 0.14, 0.16, 0.11], ['a', 0.1, 0.05, 0.26, 0.9], ['c', 0.22, 0.2, 0.24, 0.3], ['p', -0.24, 0.22, 0.24, -0.3], ['m', -0.08, 0.26, 0.1], ['p', 0.3, 0.13, 0.23, 0.8], ['m', 0.33, -0.16, 0.1],
  ];
  for (const [t, x, y, a, b] of N) {
    if (t === 'a') almond(ctx, x * s, y * s, a * s, b); else if (t === 'c') cashew(ctx, x * s, y * s, a * s, b);
    else if (t === 'p') pistachio(ctx, x * s, y * s, a * s, b); else macadamia(ctx, x * s, y * s, a * s);
  }
  sparkle(ctx, s * 0.4, -s * 0.24, s * 0.05, '#fff2b0');
  ctx.restore();
}
function fishCrisp(ctx, x, y, len, rot, c = '#e9a94a') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const shapes = [
    () => { ctx.beginPath(); ctx.ellipse(-len * 0.06, 0, len * 0.4, len * 0.19, 0, 0, TAU); },
    () => { ctx.beginPath(); ctx.moveTo(len * 0.26, 0); ctx.lineTo(len * 0.5, -len * 0.19); ctx.quadraticCurveTo(len * 0.42, 0, len * 0.5, len * 0.19); ctx.closePath(); },
    () => { ctx.beginPath(); ctx.moveTo(-len * 0.2, -len * 0.14); ctx.quadraticCurveTo(-len * 0.05, -len * 0.34, len * 0.12, -len * 0.14); ctx.closePath(); },
  ];
  union(ctx, shapes, c, darken(c, 0.62), len * 0.03);
  ctx.save(); shapes[0](); ctx.clip();
  ctx.strokeStyle = 'rgba(150,80,10,.4)'; ctx.lineWidth = len * 0.014;
  for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(i * len * 0.07, -len * 0.2); ctx.lineTo(i * len * 0.07 + len * 0.12, len * 0.2); ctx.stroke(); }
  ctx.restore();
  circle(ctx, -len * 0.27, -len * 0.04, len * 0.035, '#2a1608');
  gloss(ctx, -len * 0.1, -len * 0.1, len * 0.14, len * 0.03, -0.1, 0.5);
  ctx.restore();
}
export function fishScene(ctx, s, o = {}) {
  ctx.save();
  if (o.deco === 'squid') { grillSquid(ctx, -s * 0.34, s * 0.06, s * 0.52, -0.25); chiliPepper(ctx, s * 0.36, s * 0.22, s * 0.3, 0.3); chiliPepper(ctx, s * 0.42, s * 0.04, s * 0.22, -0.6); }
  else { drawIllus(ctx, 'herb', -s * 0.36, s * 0.02, s * 0.42, { c1: '#3f9a4a' }); fishCrisp(ctx, -s * 0.34, s * 0.26, s * 0.3, 0.3, o.chip); fishCrisp(ctx, s * 0.36, s * 0.24, s * 0.26, -0.4, o.chip); }
  const F = [[0.04, -0.09, 0.46, -0.25], [0.1, 0.09, 0.48, 0.15], [-0.05, 0.25, 0.44, -0.1], [0.24, -0.17, 0.36, 0.5], [0.22, 0.27, 0.36, 0.3]];
  for (const [x, y, l, r] of F) fishCrisp(ctx, x * s, y * s, l * s, r, o.chip);
  sparkle(ctx, s * 0.4, -s * 0.24, s * 0.05, '#fff2b0');
  ctx.restore();
}
function prawnCracker(ctx, x, y, r, rot, seed, c = '#f6c896') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const p = () => blobPath(ctx, r, r * 0.86, seed, 0.09, 4);
  ctx.save(); ctx.translate(r * 0.07, r * 0.12); p(); ctx.fillStyle = 'rgba(70,30,0,.28)'; ctx.fill(); ctx.restore();
  p(); ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.1, [[0, lighten(c, 0.5)], [0.65, c], [1, darken(c, 0.2)]], -r * 0.3, -r * 0.3); ctx.fill();
  ctx.save(); p(); ctx.clip();
  const R = rng(seed * 17 + 3);
  for (let i = 0; i < 9; i++) { const bx = (R() - 0.5) * r * 1.6, by = (R() - 0.5) * r * 1.3, br = r * (0.06 + R() * 0.1); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(160,90,40,.45)'; ctx.lineWidth = r * 0.03; ctx.beginPath(); ctx.arc(bx, by, br, 0.4, 3.0); ctx.stroke(); }
  ctx.fillStyle = 'rgba(235,120,70,.28)'; ctx.beginPath(); ctx.ellipse(0, r * 0.05, r * 0.62, r * 0.4, 0.3, 0, TAU); ctx.fill();
  ctx.restore();
  p(); ctx.lineWidth = r * 0.09; ctx.strokeStyle = darken(c, 0.6); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
export function crackerScene(ctx, s, o = {}) {
  ctx.save();
  prawn(ctx, -s * 0.33, -s * 0.02, s * 0.5, 0, '#ff7a3d');
  chiliPepper(ctx, s * 0.4, s * 0.18, s * 0.3, 0.3);
  const P = [[0.0, -0.1, 0.2, 0.2, 1], [0.24, 0.04, 0.19, 0.7, 2], [-0.02, 0.14, 0.2, -0.3, 3], [0.2, -0.2, 0.15, 1.1, 4], [0.28, 0.24, 0.15, 0.4, 5], [-0.2, 0.22, 0.14, 0.9, 6]];
  for (const [x, y, r, rot, sd] of P) prawnCracker(ctx, x * s, y * s, r * s, rot, sd, o.chip);
  sparkle(ctx, s * 0.4, -s * 0.24, s * 0.05, '#fff2b0');
  ctx.restore();
}
function rindPiece(ctx, x, y, len, rot, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const c = '#e3a047', p = () => blobPath(ctx, len / 2, len * 0.3, seed, 0.1, 3);
  ctx.save(); ctx.translate(len * 0.04, len * 0.08); p(); ctx.fillStyle = 'rgba(60,30,0,.3)'; ctx.fill(); ctx.restore();
  p(); ctx.fillStyle = radGrad(ctx, 0, 0, 0, len * 0.6, [[0, lighten(c, 0.45)], [0.6, c], [1, darken(c, 0.28)]], -len * 0.15, -len * 0.12); ctx.fill();
  ctx.save(); p(); ctx.clip();
  const R = rng(seed * 23 + 1);
  for (let i = 0; i < 14; i++) { const bx = (R() - 0.5) * len * 0.9, by = (R() - 0.5) * len * 0.5, br = len * (0.03 + R() * 0.045); ctx.fillStyle = 'rgba(255,225,150,.7)'; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(130,70,10,.6)'; ctx.lineWidth = len * 0.014; ctx.beginPath(); ctx.arc(bx, by, br, 0.3, 3.2); ctx.stroke(); }
  ctx.restore();
  p(); ctx.lineWidth = len * 0.045; ctx.strokeStyle = darken(c, 0.62); ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
export function rindScene(ctx, s) {
  ctx.save();
  garlicBulb(ctx, -s * 0.36, s * 0.18, s * 0.12);
  chiliPepper(ctx, s * 0.34, s * 0.22, s * 0.32, 0.3);
  chiliPepper(ctx, s * 0.42, s * 0.04, s * 0.24, -0.5);
  const P = [[-0.08, -0.13, 0.5, -0.15, 1], [0.2, -0.02, 0.48, 0.3, 2], [-0.14, 0.05, 0.5, 0.1, 3], [0.06, 0.16, 0.46, -0.2, 4], [-0.24, 0.24, 0.36, 0.5, 5]];
  for (const [x, y, l, r, sd] of P) rindPiece(ctx, x * s, y * s, l * s, r, sd);
  sparkle(ctx, s * 0.4, -s * 0.24, s * 0.05, '#fff2b0');
  ctx.restore();
}
function bananaCoin(ctx, x, y, r, rot, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const p = () => blobPath(ctx, r, r * 0.96, seed, 0.04, 6), c = '#f6d24a';
  ctx.save(); ctx.translate(r * 0.08, r * 0.13); p(); ctx.fillStyle = 'rgba(70,40,0,.3)'; ctx.fill(); ctx.restore();
  p(); ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.15, [[0, '#fff0a0'], [0.65, c], [1, '#d99b1a']], -r * 0.3, -r * 0.3); ctx.fill();
  ctx.lineWidth = r * 0.1; ctx.strokeStyle = '#7a5410'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(190,130,20,.55)'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(90,50,10,.75)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 2.1 + seed) * r * 0.16, Math.sin(i * 2.1 + seed) * r * 0.16, r * 0.05, 0, TAU); ctx.fill(); }
  gloss(ctx, -r * 0.4, -r * 0.42, r * 0.2, r * 0.07, -0.6, 0.6);
  ctx.restore();
}
export function bananaScene(ctx, s) {
  ctx.save();
  bananaFruit(ctx, -s * 0.28, -s * 0.04, s * 0.7, 0.15);
  const P = [[0.14, -0.1, 0.13], [-0.06, 0.03, 0.14], [0.26, 0.06, 0.13], [0.06, 0.2, 0.14], [-0.2, 0.2, 0.13], [0.3, 0.24, 0.12], [0.3, -0.2, 0.1], [-0.36, 0.1, 0.1]];
  P.forEach(([x, y, r], i) => bananaCoin(ctx, x * s, y * s, r * s, i * 0.7, i + 1));
  sparkle(ctx, s * 0.4, -s * 0.24, s * 0.05, '#fff2b0');
  ctx.restore();
}
function squidStrands(ctx, x, y, s, seed) {
  const R = rng(seed * 77 + 5);
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const S = [];
  for (let i = 0; i < 9; i++) { const sx = (R() - 0.5) * s * 0.5, sy = (R() - 0.5) * s * 0.4, a = R() * 3.14, l = s * (0.34 + R() * 0.2); S.push([sx, sy, a, l, (R() - 0.5) * 0.9]); }
  for (const pass of [0, 1, 2]) for (const [sx, sy, a, l, bend] of S) {
    ctx.beginPath(); ctx.moveTo(sx - Math.cos(a) * l * 0.5, sy - Math.sin(a) * l * 0.5);
    ctx.bezierCurveTo(sx - Math.cos(a + bend) * l * 0.15 + Math.sin(a) * l * 0.25, sy - Math.sin(a + bend) * l * 0.15 - Math.cos(a) * l * 0.25, sx + Math.cos(a - bend) * l * 0.15 - Math.sin(a) * l * 0.25, sy + Math.sin(a - bend) * l * 0.15 + Math.cos(a) * l * 0.25, sx + Math.cos(a) * l * 0.5, sy + Math.sin(a) * l * 0.5);
    if (pass === 0) { ctx.lineWidth = s * 0.075; ctx.strokeStyle = '#6a2f10'; } else if (pass === 1) { ctx.lineWidth = s * 0.05; ctx.strokeStyle = '#f2a95e'; } else { ctx.lineWidth = s * 0.014; ctx.strokeStyle = 'rgba(255,235,190,.9)'; }
    ctx.stroke();
  }
  ctx.restore();
}
export function squidScene(ctx, s) {
  ctx.save();
  grillSquid(ctx, -s * 0.34, s * 0.06, s * 0.56, -0.2);
  squidStrands(ctx, s * 0.14, s * 0.07, s * 0.8, 3);
  chiliPepper(ctx, s * 0.32, s * 0.24, s * 0.3, 0.3);
  chiliPepper(ctx, -s * 0.1, s * 0.26, s * 0.22, 2.7);
  sparkle(ctx, s * 0.4, -s * 0.24, s * 0.05, '#fff2b0');
  ctx.restore();
}
function riceDisc(ctx, x, y, r, rot, seed, nori) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const p = () => blobPath(ctx, r, r * 0.97, seed, 0.03, 6), c = '#f3dba6';
  ctx.save(); ctx.translate(r * 0.08, r * 0.13); p(); ctx.fillStyle = 'rgba(70,40,0,.3)'; ctx.fill(); ctx.restore();
  p(); ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.15, [[0, '#fff4d0'], [0.65, c], [1, '#d3a95a']], -r * 0.3, -r * 0.3); ctx.fill();
  ctx.save(); p(); ctx.clip();
  const R = rng(seed * 13 + 1);
  ctx.fillStyle = 'rgba(190,140,60,.55)'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.ellipse((R() - 0.5) * r * 1.7, (R() - 0.5) * r * 1.7, r * 0.05, r * 0.028, R() * 3, 0, TAU); ctx.fill(); }
  if (nori) { fillRR(ctx, -r * 1.1, -r * 0.2, r * 2.2, r * 0.4, 0, linGrad(ctx, 0, -r * 0.2, 0, r * 0.2, [[0, '#2f6b3c'], [1, '#0a2413']])); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-r * 1.1, -r * 0.16, r * 2.2, r * 0.05); }
  ctx.restore();
  p(); ctx.lineWidth = r * 0.1; ctx.strokeStyle = '#7a5a20'; ctx.lineJoin = 'round'; ctx.stroke();
  gloss(ctx, -r * 0.42, -r * 0.5, r * 0.2, r * 0.07, -0.6, 0.6);
  ctx.restore();
}
export function riceScene(ctx, s, o = {}) {
  ctx.save();
  noriSheet(ctx, -s * 0.34, -s * 0.02, s * 0.3, s * 0.24, -0.5, { seed: 3 });
  const P = [[0.02, -0.1, 0.17, 0.2, 1, true], [0.24, 0.05, 0.16, 0.7, 2, false], [-0.1, 0.1, 0.17, -0.3, 3, false], [0.16, 0.2, 0.15, 0.5, 4, true], [-0.26, 0.24, 0.13, 0.9, 5, true], [0.34, -0.16, 0.12, 0.3, 6, false]];
  for (const [x, y, r, rot, sd, nori] of P) riceDisc(ctx, x * s, y * s, r * s, rot, sd, o.nori === false ? false : nori);
  sparkle(ctx, s * 0.4, -s * 0.24, s * 0.05, '#fff2b0');
  ctx.restore();
}
function popKernel(ctx, x, y, r, rot, seed, caramel) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const c = caramel ? '#eeb04a' : '#fff1cc', R = rng(seed * 19 + 2);
  const lumps = [[0, 0, 0.62], [-0.5, -0.1, 0.45], [0.5, -0.05, 0.47], [0.05, -0.5, 0.45], [-0.22, 0.42, 0.4], [0.33, 0.4, 0.38]];
  const shapes = lumps.map(([lx, ly, lr]) => () => { ctx.beginPath(); ctx.arc(lx * r, ly * r, lr * r, 0, TAU); });
  ctx.save(); ctx.translate(r * 0.07, r * 0.12); ctx.fillStyle = 'rgba(70,40,0,.3)'; for (const f of shapes) { f(); ctx.fill(); } ctx.restore();
  union(ctx, shapes, c, caramel ? '#7a4a12' : '#8a6a3a', r * 0.07);
  for (const [lx, ly, lr] of lumps) { ctx.fillStyle = caramel ? 'rgba(255,225,150,.5)' : 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(lx * r - lr * r * 0.25, ly * r - lr * r * 0.3, lr * r * 0.35, 0, TAU); ctx.fill(); }
  ctx.fillStyle = caramel ? '#b8702a' : '#f5c24a'; ctx.beginPath(); ctx.ellipse(r * 0.1, r * 0.12, r * 0.14, r * 0.1, R() * 3, 0, TAU); ctx.fill();
  ctx.restore();
}
function popBucket(ctx, x, y, w, h) { // red-and-white striped popcorn tub
  ctx.save(); ctx.translate(x, y);
  const n = 7, top = (i) => -w / 2 + (i * w) / n, bot = (i) => -w * 0.36 + (i * w * 0.72) / n;
  ctx.save(); ctx.translate(w * 0.05, h * 0.1); ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w * 0.36, h / 2); ctx.lineTo(-w * 0.36, h / 2); ctx.closePath(); ctx.fillStyle = 'rgba(60,20,0,.3)'; ctx.fill(); ctx.restore();
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(top(i), -h / 2); ctx.lineTo(top(i + 1), -h / 2); ctx.lineTo(bot(i + 1), h / 2); ctx.lineTo(bot(i), h / 2); ctx.closePath(); ctx.fillStyle = i % 2 ? '#ffffff' : '#d8232a'; ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w * 0.36, h / 2); ctx.lineTo(-w * 0.36, h / 2); ctx.closePath();
  ctx.lineWidth = w * 0.045; ctx.strokeStyle = '#5a1010'; ctx.lineJoin = 'round'; ctx.stroke();
  fillRR(ctx, -w * 0.54, -h * 0.62, w * 1.08, h * 0.24, h * 0.1, '#d8232a', '#5a1010', w * 0.04);
  gloss(ctx, -w * 0.3, -h * 0.5, w * 0.12, h * 0.03, 0, 0.5);
  ctx.restore();
}
export function popcornScene(ctx, s, o = {}) {
  ctx.save();
  const caramel = o.caramel !== false;
  const P = [[0.0, -0.16, 0.105], [-0.14, -0.14, 0.105], [0.14, -0.14, 0.105], [-0.27, -0.03, 0.105], [-0.09, -0.05, 0.115], [0.1, -0.04, 0.115], [0.27, -0.02, 0.105], [-0.18, 0.07, 0.105], [0.0, 0.07, 0.115], [0.18, 0.07, 0.105]];
  P.forEach(([x, y, r], i) => popKernel(ctx, x * s, y * s, r * s, i * 0.9, i + 1, caramel));
  popBucket(ctx, 0, s * 0.235, s * 0.46, s * 0.2);
  popKernel(ctx, -s * 0.37, s * 0.28, s * 0.075, 0.4, 21, caramel); popKernel(ctx, s * 0.38, s * 0.25, s * 0.07, 1.2, 22, caramel); popKernel(ctx, -s * 0.36, -s * 0.12, s * 0.065, 2.0, 23, caramel);
  sparkle(ctx, s * 0.4, -s * 0.15, s * 0.05, '#fff2b0'); sparkle(ctx, -s * 0.42, s * 0.12, s * 0.04, '#fff2b0');
  ctx.restore();
}

// ================================================================================================ registry
export const illus = {
  chipScene, pringlesScene, staxScene, tortillaScene, cheetosScene, sticksScene, puffScene,
  seaScene, peanutScene, mixnutScene, fishScene, crackerScene, rindScene, bananaScene, squidScene, riceScene, popcornScene,
};

// ================================================================================================ SKUs
export default [
  // ---------------------------------------------------------------------------------- CHIPS
  {
    id: 'lays-original', cat: 'chips', brand: 'lays', pop: 3,
    name: T('Original', 'รสออริจินัล'), sub: T('Real potato chips', 'มันฝรั่งแท้ทอดกรอบ'),
    price: 22, size: g(46), g: 'bag-m',
    pal: ['#f9d21f', '#e39a00', '#d8232a', '#fff2b0'], bg: 'rays',
    hero: 'chipScene', heroOpts: { deco: 'plain', chip: '#f4c542', speck: 'rgba(190,120,20,.55)' },
    ing: ['potato', 'palm', 'salt'], allergens: [], nut: nutOf(46, NP.chips),
    desc: T('Thin, golden potato slices fried crisp and finished with a light dusting of salt: the everyday Lay\'s.', 'มันฝรั่งแท้หั่นบางทอดกรอบสีทอง โรยเกลือเบาๆ รสต้นตำรับที่หยิบกินเพลินไม่รู้ตัว'),
  },
  {
    id: 'lays-nori', cat: 'chips', brand: 'lays', pop: 3,
    name: T('Nori Seaweed', 'รสโนริสาหร่าย'), sub: T('Real potato chips', 'มันฝรั่งแท้ทอดกรอบ'),
    price: 22, size: g(46), g: 'bag-m',
    pal: ['#23a55b', '#0d6a38', '#ffd400', '#0a3d1e'], bg: 'waves',
    hero: 'chipScene', heroOpts: { deco: 'nori', chip: '#efc84d', speck: '#1c5b2c' },
    ing: ['potato', 'palm', 'salt', 'sugar', 'nori', 'msg'], allergens: ['soy'], nut: nutOf(46, NP.chips),
    desc: T('Crisp chips tossed in a sweet-and-salty roasted seaweed seasoning: a long-time Thai favourite.', 'มันฝรั่งแท้ทอดกรอบโรยผงสาหร่ายโนริ หอมสาหร่าย เค็มหวานกลมกล่อม เป็นรสโปรดของคนไทยมานาน'),
  },
  {
    id: 'lays-nori-105', cat: 'chips', brand: 'lays', pop: 2,
    name: T('Nori Seaweed', 'รสโนริสาหร่าย'), sub: T('Big share pack', 'ห่อใหญ่ แบ่งกันกิน'),
    price: 45, size: g(105), g: 'bag-l', promo: T('2 for ฿85', '2 ห่อ 85 บาท'),
    pal: ['#1e9a55', '#0b5f33', '#ffd400', '#0a3d1e'], bg: 'rays',
    hero: 'chipScene', heroOpts: { deco: 'nori', chip: '#efc84d', speck: '#1c5b2c' },
    ing: ['potato', 'palm', 'salt', 'sugar', 'nori', 'msg'], allergens: ['soy'], nut: nutOf(105, NP.chips),
    desc: T('The seaweed favourite in a big share bag: enough for the whole office or a movie night in.', 'รสสาหร่ายโนริตัวโปรดในห่อใหญ่ ซื้อไปแบ่งกันกินที่ออฟฟิศหรือดูหนังที่บ้านก็คุ้ม'),
  },
  {
    id: 'lays-sourcream', cat: 'chips', brand: 'lays', pop: 2,
    name: T('Sour Cream & Onion', 'รสซาวครีมและหัวหอม'), sub: T('Real potato chips', 'มันฝรั่งแท้ทอดกรอบ'),
    price: 22, size: g(46), g: 'bag-m',
    pal: ['#7fc241', '#3f8f2a', '#fff6d6', '#2b6b1c'], bg: 'dots',
    hero: 'chipScene', heroOpts: { deco: 'sour', chip: '#f2c94c', speck: '#3a8f3a' },
    ing: ['potato', 'palm', 'salt', 'sourcream', 'onion', 'garlic', 'milkp', 'msg'], allergens: ['milk'], nut: nutOf(46, NP.chips),
    desc: T('Cool, tangy sour cream and sweet onion on a crisp chip: creamy without being heavy.', 'ซาวครีมเปรี้ยวนวลผสมหัวหอมหวานหอม รสกลมกล่อมนุ่มลิ้น กรอบเบาไม่เลี่ยน'),
  },
  {
    id: 'lays-rock-squid', cat: 'chips', brand: 'lays', pop: 2,
    name: T('Hot Chilli Squid', 'รสหมึกย่างฮอตชิลลี่'), sub: T('Lay\'s Rock · Ridged chips', 'เลย์ร็อค แผ่นหยัก'),
    price: 22, size: g(46), g: 'bag-m',
    pal: ['#f0641e', '#a8300a', '#ffd23a', '#7a1a08'], bg: 'zig',
    hero: 'chipScene', heroOpts: { deco: 'squid', chip: '#f1b84a', ridged: true, waves: 5, speck: 'rgba(190,40,10,.75)' },
    ing: ['potato', 'palm', 'salt', 'sugar', 'chili', 'garlic', 'squidseason', 'msg'], allergens: ['squid'], nut: nutOf(46, NP.chips),
    desc: T('Thick ridged chips seasoned like chilli-grilled squid: smoky, sweet, salty and properly spicy.', 'มันฝรั่งแผ่นหยักหนากรอบแน่น ปรุงรสหมึกย่างพริกสไตล์ไทย หอมควันย่าง เค็มหวาน เผ็ดจี๊ดถึงใจ'),
  },
  {
    id: 'lays-saltedegg', cat: 'chips', brand: 'lays', pop: 2,
    name: T('Salted Egg', 'รสไข่เค็ม'), sub: T('Real potato chips', 'มันฝรั่งแท้ทอดกรอบ'),
    price: 22, size: g(44), g: 'bag-m',
    pal: ['#17a0a4', '#0b626e', '#ffc21a', '#08454f'], bg: 'rays',
    hero: 'chipScene', heroOpts: { deco: 'egg', chip: '#f5c23c', speck: 'rgba(230,140,0,.8)' },
    ing: ['potato', 'palm', 'salt', 'eggyolk', 'sugar', 'milkp', 'msg'], allergens: ['egg', 'milk'], nut: nutOf(44, NP.chips),
    desc: T('Rich, buttery salted-egg-yolk seasoning on classic chips: a Thai snack-aisle trend turned into a crisp.', 'ผงปรุงรสไข่เค็มหอมมันเค็มนัว โรยบนมันฝรั่งแท้ทอดกรอบ ตามกระแสขนมรสไข่เค็มที่คนไทยติดใจ'),
  },
  {
    id: 'lays-stax-sco', cat: 'chips', brand: 'laystax', pop: 1,
    name: T('Sour Cream & Onion', 'รสซาวครีมและหัวหอม'),
    price: 49, size: g(100), g: 'tube-chips', style: 'tube', capColor: '#d8232a',
    pal: ['#86c440', '#3f8a24', '#fff6d6', '#f7c600'], bg: 'stripes',
    hero: 'staxScene', heroOpts: { chip: '#f4c542' },
    ing: ['potato', 'palm', 'ricef', 'cornst', 'salt', 'sourcream', 'onion', 'milkp', 'msg'], allergens: ['milk'], nut: nutOf(100, NP.tube),
    desc: T('Uniform stacked crisps in a resealable can: they slide out in a neat tower, with a tangy sour cream and onion flavour.', 'มันฝรั่งทอดกรอบทรงเดียวกันเรียงซ้อนในกระป๋อง เปิดฝาแล้วหยิบกินง่าย รสซาวครีมและหัวหอมกลมกล่อม'),
  },
  {
    id: 'pringles-original', cat: 'chips', brand: 'pringles', pop: 3,
    name: T('Original', 'รสออริจินัล'),
    price: 55, size: g(102), g: 'tube-chips', style: 'tube', capColor: '#f5c400', promo: T('2 for ฿99', '2 หลอด 99 บาท'),
    pal: ['#d9232b', '#a01820', '#ffffff', '#f5c400'], bg: 'plain',
    hero: 'pringlesScene', heroOpts: { icon: 'none' },
    ing: ['potato', 'palm', 'corn', 'wheat', 'salt', 'emuls'], allergens: ['wheat'], nut: nutOf(102, NP.tube),
    desc: T('The tall can of stacked, saddle-shaped crisps in classic salted: light, crunchy and hard to stop.', 'มันฝรั่งทอดกรอบทรงอานม้าเรียงซ้อนในกระป๋องทรงสูง รสออริจินัลเค็มกำลังดี กรอบเบา หยุดกินไม่ได้'),
  },
  {
    id: 'pringles-sourcream', cat: 'chips', brand: 'pringles', pop: 2,
    name: T('Sour Cream & Onion', 'รสซาวครีมและหัวหอม'),
    price: 55, size: g(102), g: 'tube-chips', style: 'tube', capColor: '#f5c400',
    pal: ['#2f9e44', '#1b6b2c', '#ffffff', '#f5c400'], bg: 'plain',
    hero: 'pringlesScene', heroOpts: { icon: 'onion' },
    ing: ['potato', 'palm', 'corn', 'wheat', 'salt', 'sourcream', 'onion', 'milkp'], allergens: ['wheat', 'milk'], nut: nutOf(102, NP.tube),
    desc: T('Saddle-shaped crisps with a tangy sour cream and onion seasoning.', 'มันฝรั่งทอดกรอบทรงอานม้า ปรุงรสซาวครีมและหัวหอม เปรี้ยวนวลหอมกลมกล่อม'),
  },
  {
    id: 'pringles-hotspicy', cat: 'chips', brand: 'pringles', pop: 2,
    name: T('Hot & Spicy', 'รสฮอท แอนด์ สไปซี่'),
    price: 55, size: g(102), g: 'tube-chips', style: 'tube', capColor: '#f5c400',
    pal: ['#e5481a', '#9c1f0a', '#ffffff', '#f5c400'], bg: 'plain',
    hero: 'pringlesScene', heroOpts: { icon: 'chili' },
    ing: ['potato', 'palm', 'corn', 'wheat', 'salt', 'chili', 'garlic', 'onion', 'msg'], allergens: ['wheat'], nut: nutOf(102, NP.tube),
    desc: T('A fiery chilli seasoning on the classic stacked crisps: the spicy pick for Thai palates.', 'มันฝรั่งทอดกรอบทรงอานม้า รสฮอท แอนด์ สไปซี่ เผ็ดร้อนถึงใจ ถูกปากคนไทย'),
  },
  {
    id: 'pringles-bbq', cat: 'chips', brand: 'pringles', pop: 1,
    name: T('Barbecue', 'รสบาร์บีคิว'),
    price: 55, size: g(102), g: 'tube-chips', style: 'tube', capColor: '#f5c400',
    pal: ['#8e3313', '#4d1a08', '#ffffff', '#f5c400'], bg: 'plain',
    hero: 'pringlesScene', heroOpts: { icon: 'flame' },
    ing: ['potato', 'palm', 'corn', 'wheat', 'salt', 'bbq', 'sugar', 'milkp'], allergens: ['wheat', 'milk'], nut: nutOf(102, NP.tube),
    desc: T('Smoky-sweet barbecue seasoning on the stacked crisps everyone eats straight from the can.', 'มันฝรั่งทอดกรอบทรงอานม้า ปรุงรสบาร์บีคิว หอมควัน หวานเค็มกลมกล่อม'),
  },
  {
    id: 'doritos-nacho', cat: 'chips', brand: 'doritos', pop: 2,
    name: T('Nacho Cheese', 'รสนาโชชีส'), sub: T('Corn tortilla chips', 'ข้าวโพดแผ่นทอดกรอบ'),
    price: 35, size: g(57), g: 'bag-m',
    pal: ['#d71920', '#8f0d13', '#ffcf1f', '#f28a1f'], bg: 'burst',
    hero: 'tortillaScene', heroOpts: {},
    ing: ['corn', 'palm', 'cheeseseason', 'salt', 'milkp', 'msg'], allergens: ['milk'], nut: nutOf(57, NP.tortilla),
    desc: T('Triangular corn chips coated in bold nacho cheese powder: crunchy, salty, and guaranteed orange fingertips.', 'ข้าวโพดแผ่นทอดกรอบทรงสามเหลี่ยม เคลือบผงนาโชชีสเข้มข้น หอมชีส เค็มมัน กินแล้วนิ้วเป็นสีส้ม'),
  },
  {
    id: 'cheetos-puff-cheese', cat: 'chips', brand: 'cheetos', pop: 2, font: 'lilita',
    name: T('Cheesy Cheese Puffs', 'พัฟ รสชีสซี่ ชีส'), sub: T('Crunchy corn snack', 'ข้าวโพดอบกรอบ'),
    price: 20, size: g(45), g: 'bag-m',
    pal: ['#f28a1a', '#c25a08', '#ffd23a', '#7a3ea8'], bg: 'dots',
    hero: 'cheetosScene', heroOpts: { deco: 'cheese' },
    ing: ['corn', 'palm', 'cheeseseason', 'salt', 'msg'], allergens: ['milk'], nut: nutOf(45, NP.puff),
    desc: T('Light, puffy corn snacks dusted with an intense cheese powder: crunchy, cheesy and messy in the best way.', 'ข้าวโพดอบกรอบทรงพัฟ เคลือบผงชีสเข้มข้น กรอบเบา ชีสหอมมัน กินแล้วติดนิ้ว'),
  },
  {
    id: 'cheetos-butter-corn', cat: 'chips', brand: 'cheetos', pop: 2, isNew: true, font: 'lilita',
    name: T('Grilled Butter Corn', 'รสข้าวโพดย่างเนย'), sub: T('Crunchy corn snack', 'ข้าวโพดอบกรอบ'),
    price: 20, size: g(55), g: 'bag-m',
    pal: ['#f7c81c', '#d98c00', '#e8501c', '#7a3ea8'], bg: 'rays',
    hero: 'cheetosScene', heroOpts: { deco: 'corn', chip: '#f8b71d', dust: 'rgba(230,140,10,.7)' },
    ing: ['corn', 'palm', 'butter', 'sugar', 'salt', 'corncob', 'milkp'], allergens: ['milk'], nut: nutOf(55, NP.puff),
    desc: T('A new Thai flavour: crunchy corn snacks that taste of sweet street-side grilled corn brushed with butter.', 'รสใหม่ ข้าวโพดอบกรอบหอมกลิ่นข้าวโพดย่างเนย หวานหอมมันกลมกล่อม'),
  },
  {
    id: 'tasto-salted', cat: 'chips', brand: 'tasto', pop: 2, impulse: true,
    name: T('Salted', 'รสเกลือ'), sub: T('Flat-cut real potato chips', 'แผ่นเรียบ มันฝรั่งแท้'),
    price: 15, size: g(42), g: 'bag-snack',
    pal: ['#e0262c', '#9b1219', '#ffd400', '#fff2b0'], bg: 'stripes',
    hero: 'chipScene', heroOpts: { deco: 'plain', chip: '#f4c542', speck: 'rgba(190,120,20,.55)' },
    ing: ['potato', 'palm', 'salt'], allergens: [], nut: nutOf(42, NP.chips),
    desc: T('Thin, flat potato chips with a simple salt seasoning.', 'มันฝรั่งแท้ทอดกรอบแผ่นเรียบบางเฉียบ ปรุงรสเกลือเรียบง่าย กรอบเบา กินเพลิน'),
  },
  {
    id: 'tasto-nori', cat: 'chips', brand: 'tasto', pop: 2, impulse: true,
    name: T('Japanese Seaweed', 'รสสาหร่ายญี่ปุ่น'), sub: T('Flat-cut real potato chips', 'แผ่นเรียบ มันฝรั่งแท้'),
    price: 15, size: g(40), g: 'bag-snack',
    pal: ['#1f9d55', '#0d6a38', '#ffd400', '#0a3d1e'], bg: 'stripes',
    hero: 'chipScene', heroOpts: { deco: 'nori', chip: '#efc84d', speck: '#1c5b2c' },
    ing: ['potato', 'palm', 'salt', 'sugar', 'nori', 'msg'], allergens: ['soy'], nut: nutOf(40, NP.chips),
    desc: T('Thin, flat chips with a Japanese-style roasted seaweed seasoning.', 'มันฝรั่งแท้ทอดกรอบแผ่นเรียบ โรยผงสาหร่ายสไตล์ญี่ปุ่น หอมสาหร่าย เค็มหวานนิดๆ'),
  },
  {
    id: 'tasto-bbq', cat: 'chips', brand: 'tasto', pop: 1, impulse: true,
    name: T('Barbecue', 'รสบาร์บีคิว'), sub: T('Ridged real potato chips', 'แผ่นหยัก มันฝรั่งแท้'),
    price: 15, size: g(42), g: 'bag-snack',
    pal: ['#b3401a', '#6e230c', '#ffd400', '#3d1408'], bg: 'stripes',
    hero: 'chipScene', heroOpts: { deco: 'bbq', chip: '#f0b040', ridged: true, waves: 5, speck: 'rgba(150,50,10,.75)' },
    ing: ['potato', 'palm', 'salt', 'sugar', 'bbq', 'garlic', 'onion', 'msg'], allergens: ['soy', 'milk'], nut: nutOf(42, NP.chips),
    desc: T('Ridged potato chips with a sweet, smoky barbecue seasoning.', 'มันฝรั่งแท้ทอดกรอบแผ่นหยัก ปรุงรสบาร์บีคิว หอมควัน หวานเค็มกลมกล่อม'),
  },
  {
    id: 'karamucho-hotchilli', cat: 'chips', brand: 'karamucho', pop: 1, font: 'anton',
    name: T('Hot Chilli', 'รสฮอตชิลลี่'), sub: T('Potato sticks', 'มันฝรั่งแท่งทอดกรอบ'),
    price: 25, size: g(30), g: 'bag-snack',
    pal: ['#1a1a1a', '#000000', '#ff3b1f', '#ffcc00'], bg: 'burst',
    hero: 'sticksScene', heroOpts: {},
    ing: ['potato', 'palm', 'chili', 'salt', 'sugar', 'garlic', 'onion', 'msg'], allergens: ['soy'], nut: nutOf(30, NP.sticks),
    desc: T('Crunchy potato sticks with a fiery chilli seasoning: one for the spice lovers.', 'มันฝรั่งแท่งทอดกรอบ ปรุงรสพริกฮอตชิลลี่ เผ็ดร้อน กรอบมัน เหมาะกับสายเผ็ด'),
  },
  {
    id: 'snacktown-milk', cat: 'chips', brand: 'snacktown', pop: 1, font: 'lilita',
    name: T('Milk Corn Snack', 'ข้าวโพดอบกรอบ รสนม'),
    price: 20, size: g(58), g: 'bag-m',
    pal: ['#3aa0e6', '#1b6fb0', '#ffffff', '#0d4a80'], bg: 'dots',
    hero: 'puffScene', heroOpts: { deco: 'milk' },
    ing: ['corn', 'palm', 'sugar', 'milkseason', 'milkp', 'salt'], allergens: ['milk'], nut: nutOf(58, NP.cornsweet),
    desc: T('7-Select corn puffs with a sweet, milky seasoning: light, crunchy, and a hit with kids.', 'ข้าวโพดอบกรอบปรุงรสนมหอมหวาน กรอบเบา ละลายในปาก เด็กๆ ชอบ'),
  },
  {
    id: 'snacktown-cheese', cat: 'chips', brand: 'snacktown', pop: 1, font: 'lilita',
    name: T('Cheese Corn Snack', 'ข้าวโพดอบกรอบ รสชีส'),
    price: 20, size: g(58), g: 'bag-m',
    pal: ['#f5a623', '#c46f00', '#ffffff', '#7a3c00'], bg: 'dots',
    hero: 'puffScene', heroOpts: { deco: 'cheese' },
    ing: ['corn', 'palm', 'cheeseseason', 'milkp', 'salt'], allergens: ['milk'], nut: nutOf(58, NP.puff),
    desc: T('Light, crunchy 7-Select corn puffs with a savoury cheese seasoning.', 'ข้าวโพดอบกรอบปรุงรสชีส หอมมัน กรอบเบา กินเพลิน'),
  },

  // ---------------------------------------------------------------------------------- SEAWEED
  {
    id: 'tkn-roasted-classic', cat: 'seaweed', brand: 'taokaenoi', pop: 2, impulse: true,
    name: T('Roasted Seaweed Classic', 'สาหร่ายอบ รสคลาสสิค'), sub: T('Seaweed snack', 'สาหร่ายอบกรอบ'),
    price: 12, size: g(4), g: 'bag-s', plate: 'ribbon',
    pal: ['#1a7f6b', '#0b4a3e', '#ffd54a', '#0c2416'], bg: 'waves',
    hero: 'seaScene', heroOpts: { kind: 'roasted', deco: 'roasted' },
    ing: ['seaweed', 'oil', 'sugar', 'salt', 'sesame'], allergens: ['soy', 'sesame'], nut: nutOf(4, NP.roasted),
    desc: T('Paper-thin sheets of roasted seaweed, lightly salted and seasoned: a small pack with a big crunch.', 'สาหร่ายทะเลอบแผ่นบางกรอบ ปรุงรสเค็มหวานกลมกล่อม ห่อเล็กพกง่าย กินได้ทุกที่'),
  },
  {
    id: 'tkn-roasted-spicy', cat: 'seaweed', brand: 'taokaenoi', pop: 2, impulse: true,
    name: T('Roasted Seaweed Spicy', 'สาหร่ายอบ รสเผ็ด'), sub: T('Seaweed snack', 'สาหร่ายอบกรอบ'),
    price: 12, size: g(4), g: 'bag-s', plate: 'ribbon',
    pal: ['#c8181f', '#7a0c12', '#ffd54a', '#2a0a0a'], bg: 'waves',
    hero: 'seaScene', heroOpts: { kind: 'roasted', deco: 'chili' },
    ing: ['seaweed', 'oil', 'sugar', 'salt', 'chili', 'sesame'], allergens: ['soy', 'sesame'], nut: nutOf(4, NP.roasted),
    desc: T('The same crisp roasted seaweed with a chilli kick.', 'สาหร่ายอบแผ่นบางกรอบ เพิ่มความเผ็ดร้อนจากพริก กินเพลินสุดๆ'),
  },
  {
    id: 'tkn-bigroll', cat: 'seaweed', brand: 'taokaenoi', pop: 1, impulse: true,
    name: T('Big Roll Classic', 'บิ๊กโรล รสคลาสสิค'), sub: T('Grilled seaweed roll', 'สาหร่ายม้วนย่าง'),
    price: 15, size: g(7.5), g: 'bag-s', plate: 'ribbon',
    pal: ['#1c5f9a', '#0d3660', '#ffd54a', '#061c33'], bg: 'stripes',
    hero: 'seaScene', heroOpts: { kind: 'roll' },
    ing: ['seaweed', 'oil', 'sugar', 'salt', 'sesame'], allergens: ['soy', 'sesame'], nut: nutOf(7.5, NP.roasted),
    desc: T('Seaweed grilled and rolled into a crunchy tube: bite-sized and easy to eat one-handed.', 'สาหร่ายย่างม้วนเป็นแท่ง กรอบหอม กินง่ายพอดีคำ'),
  },
  {
    id: 'tkn-fried-classic', cat: 'seaweed', brand: 'taokaenoi', pop: 3,
    name: T('Crispy Seaweed Classic', 'สาหร่ายทอด รสคลาสสิค'), sub: T('Fried seaweed snack', 'สาหร่ายทอดกรอบ'),
    price: 25, size: g(26), g: 'bag-snack', plate: 'ribbon', promo: T('2 for ฿45', '2 ห่อ 45 บาท'),
    pal: ['#2f9e4a', '#146b2c', '#ffd54a', '#0c2416'], bg: 'dots',
    hero: 'seaScene', heroOpts: { kind: 'fried' },
    ing: ['seaweed', 'wheat', 'palm', 'sugar', 'salt', 'sesame', 'msg'], allergens: ['wheat', 'soy', 'sesame'], nut: nutOf(26, NP.fried),
    desc: T('Seaweed sheets deep-fried until light and crispy, with a savoury-sweet seasoning: a Tao Kae Noi favourite.', 'สาหร่ายทอดกรอบเบา ปรุงรสเค็มหวานกลมกล่อม ขนมยอดนิยมของเถ้าแก่น้อย'),
  },
  {
    id: 'tkn-fried-tomyum', cat: 'seaweed', brand: 'taokaenoi', pop: 2,
    name: T('Crispy Seaweed Tom Yum', 'สาหร่ายทอด รสต้มยำกุ้ง'), sub: T('Fried seaweed snack', 'สาหร่ายทอดกรอบ'),
    price: 25, size: g(26), g: 'bag-snack', plate: 'ribbon',
    pal: ['#ee5a24', '#a83208', '#fff2b0', '#7a1f08'], bg: 'zig',
    hero: 'seaScene', heroOpts: { kind: 'fried', deco: 'tomyum' },
    ing: ['seaweed', 'wheat', 'palm', 'sugar', 'salt', 'tomyum', 'lemongrass', 'kaffir', 'chili', 'msg'], allergens: ['wheat', 'shrimp', 'soy'], nut: nutOf(26, NP.fried),
    desc: T('Crispy fried seaweed seasoned like tom yum goong: sour, spicy and herbal.', 'สาหร่ายทอดกรอบปรุงรสต้มยำกุ้ง เปรี้ยว เผ็ด หอมสมุนไพร'),
  },
  {
    id: 'tkn-tempura-original', cat: 'seaweed', brand: 'taokaenoi', pop: 2,
    name: T('Tempura Seaweed Original', 'สาหร่ายเทมปุระ รสต้นตำรับ'), sub: T('Seaweed tempura snack', 'สาหร่ายชุบแป้งทอดกรอบ'),
    price: 29, size: g(22), g: 'bag-snack', plate: 'ribbon',
    pal: ['#f2b632', '#b97c0a', '#c8102e', '#7a4a00'], bg: 'rays',
    hero: 'seaScene', heroOpts: { kind: 'tempura' },
    ing: ['seaweed', 'wheat', 'tapioca', 'palm', 'egg', 'sugar', 'salt'], allergens: ['wheat', 'egg', 'soy'], nut: nutOf(22, NP.tempura),
    desc: T('Seaweed in a light, lacy golden tempura batter: airy, crunchy and lightly salted.', 'สาหร่ายชุบแป้งเทมปุระทอดกรอบเบา ปรุงรสเค็มกำลังดี กรอบฟู'),
  },
  {
    id: 'tkn-tempura-spicy', cat: 'seaweed', brand: 'taokaenoi', pop: 1,
    name: T('Tempura Seaweed Spicy', 'สาหร่ายเทมปุระ รสเผ็ด'), sub: T('Seaweed tempura snack', 'สาหร่ายชุบแป้งทอดกรอบ'),
    price: 29, size: g(22), g: 'bag-snack', plate: 'ribbon',
    pal: ['#e0301e', '#8f160c', '#ffd23a', '#5a0a04'], bg: 'rays',
    hero: 'seaScene', heroOpts: { kind: 'tempura', deco: 'chili' },
    ing: ['seaweed', 'wheat', 'tapioca', 'palm', 'egg', 'sugar', 'salt', 'chili'], allergens: ['wheat', 'egg', 'soy'], nut: nutOf(22, NP.tempura),
    desc: T('Lacy tempura seaweed with a spicy chilli seasoning.', 'สาหร่ายชุบแป้งเทมปุระทอดกรอบ ปรุงรสเผ็ดร้อนจากพริก กรอบฟูกินเพลิน'),
  },
  {
    id: 'masita-khaokung', cat: 'seaweed', brand: 'masita', pop: 2, impulse: true,
    name: T('Rich Prawn Rice Seaweed', 'สาหร่ายทอด ข้าวกุ้งแกะมันเยิ้ม'), sub: T('Fried seaweed snack', 'สาหร่ายทอดกรอบ'),
    price: 12, size: g(8), g: 'bag-s', plate: 'ribbon',
    pal: ['#f4a11d', '#b86a06', '#2e7d32', '#5a3a00'], bg: 'dots',
    hero: 'seaScene', heroOpts: { kind: 'fried', deco: 'prawn' },
    ing: ['seaweed', 'wheat', 'palm', 'sugar', 'salt', 'shrimp', 'msg'], allergens: ['wheat', 'shrimp', 'soy'], nut: nutOf(8, NP.fried),
    desc: T('Crispy seaweed with a rich, savoury prawn flavour made for Thai tastes.', 'สาหร่ายทอดกรอบรสข้าวกุ้งแกะมันเยิ้ม หอมมันกุ้ง เข้มข้นถูกปากคนไทย'),
  },
  {
    id: 'gorigo-sandwich-egg', cat: 'seaweed', brand: 'gorigo', pop: 1,
    name: T('Laver Sandwich Salted Egg', 'สาหร่ายแซนวิช รสไข่เค็ม'), sub: T('Crispy laver snack', 'สาหร่ายกรอบประกบไส้'),
    price: 35, size: g(30), g: 'bag-snack', plate: 'ribbon',
    pal: ['#1d2f5c', '#0c1936', '#ffd166', '#050d14'], bg: 'stripes',
    hero: 'seaScene', heroOpts: { kind: 'sandwich', deco: 'egg', fill: '#f6b632' },
    ing: ['seaweed', 'rice', 'palm', 'eggyolk', 'sesame', 'sugar', 'salt'], allergens: ['egg', 'sesame', 'soy'], nut: nutOf(30, NP.sandwich),
    desc: T('Two crisp sheets of laver sandwiching a savoury filling, in a salted egg flavour.', 'สาหร่ายกรอบสองแผ่นประกบไส้กรอบรสไข่เค็ม หอมมันเค็มนัว'),
  },

  // ---------------------------------------------------------------------------------- NUTS & DRIED SNACKS
  {
    id: 'kohkae-coconut', cat: 'nuts', brand: 'kohkae', pop: 3,
    name: T('Coconut Milk Peanuts', 'ถั่วลิสงกรอบ รสกะทิ'), sub: T('Coated peanuts', 'ถั่วลิสงเคลือบแป้งอบกรอบ'),
    price: 30, size: g(75), g: 'bag-snack', promo: T('2 for ฿55', '2 ห่อ 55 บาท'),
    pal: ['#1e9bd7', '#0b6aa0', '#ffe14a', '#053a5a'], bg: 'waves',
    hero: 'peanutScene', heroOpts: { deco: 'coconut' },
    ing: ['peanut', 'wheat', 'egg', 'coconutmilk', 'sugar', 'salt', 'oil'], allergens: ['peanut', 'wheat', 'egg'], nut: nutOf(75, NP.coated),
    desc: T('Peanuts in a crunchy flour shell flavoured with coconut milk: the classic Koh-Kae flavour.', 'ถั่วลิสงเคลือบแป้งกรอบหอมกะทิ รสคลาสสิกที่คนไทยคุ้นเคย'),
  },
  {
    id: 'kohkae-noriwasabi', cat: 'nuts', brand: 'kohkae', pop: 2, impulse: true,
    name: T('Nori Wasabi Peanuts', 'ถั่วลิสง รสโนริวาซาบิ'), sub: T('Coated peanuts', 'ถั่วลิสงเคลือบแป้งอบกรอบ'),
    price: 15, size: g(35), g: 'bag-s',
    pal: ['#3aa63e', '#1b6a24', '#ffe14a', '#0f3d14'], bg: 'zig',
    hero: 'peanutScene', heroOpts: { deco: 'wasabi' },
    ing: ['peanut', 'wheat', 'egg', 'nori', 'wasabi', 'sugar', 'salt', 'oil'], allergens: ['peanut', 'wheat', 'egg', 'soy'], nut: nutOf(35, NP.coated),
    desc: T('Crunchy coated peanuts with roasted-seaweed savour and a nose-tingling wasabi kick.', 'ถั่วลิสงเคลือบแป้งกรอบ รสโนริวาซาบิ หอมสาหร่าย เผ็ดซ่าจมูกนิดๆ'),
  },
  {
    id: 'kohkae-natural', cat: 'nuts', brand: 'kohkae', pop: 1,
    name: T('Natural Roasted Peanuts', 'ถั่วลิสงอบ รสธรรมชาติ'), sub: T('Roasted peanuts', 'ถั่วลิสงอบ'),
    price: 25, size: g(80), g: 'bag-snack',
    pal: ['#c8102e', '#8f0a20', '#ffd400', '#5a0611'], bg: 'stripes',
    hero: 'peanutScene', heroOpts: { deco: 'natural', kernel: true },
    ing: ['peanut', 'salt'], allergens: ['peanut'], nut: nutOf(80, NP.peanut),
    desc: T('Whole peanuts roasted until fragrant, with a natural, nutty flavour.', 'ถั่วลิสงอบหอมมัน รสธรรมชาติ เคี้ยวเพลิน กินเป็นของว่างหรือแกล้มเครื่องดื่มก็ได้'),
  },
  {
    id: 'nutwalker-mixnut', cat: 'nuts', brand: 'nut', pop: 1,
    name: T('Salted Mixed Nuts', 'มิกซ์นัทอบเกลือ'), sub: T('Roasted mixed nuts', 'ถั่วรวมอบ'),
    price: 55, size: g(60), g: 'bag-snack',
    pal: ['#7a4a23', '#3d2410', '#ffe7a8', '#2a1608'], bg: 'plain',
    hero: 'mixnutScene', heroOpts: {},
    ing: ['almond', 'cashew', 'macadamia', 'pistachio', 'oil', 'salt'], allergens: ['nuts'], nut: nutOf(60, NP.mixnut),
    desc: T('A salted, roasted mix of almonds, cashews, macadamias and pistachios: a grown-up snack for the desk drawer.', 'มิกซ์นัทอบเกลือ รวมอัลมอนด์ เม็ดมะม่วงหิมพานต์ แมคคาเดเมีย และพิสทาชิโอ กรอบหอมมัน'),
  },
  {
    id: 'taro-fish-rich', cat: 'nuts', brand: 'taro', pop: 2, impulse: true,
    name: T('Rich Fish Snack', 'ปลาสวรรค์ รสเข้มข้น'), sub: T('Crispy fish snack', 'ขนมปลาอบกรอบ'),
    price: 15, size: g(20), g: 'bag-s',
    pal: ['#e8392b', '#a01a10', '#ffd400', '#5a0a04'], bg: 'waves',
    hero: 'fishScene', heroOpts: { deco: 'plain' },
    ing: ['fish', 'tapioca', 'sugar', 'oil', 'salt', 'msg'], allergens: ['fish', 'wheat', 'soy'], nut: nutOf(20, NP.fish),
    desc: T('A crispy fish snack ("heavenly fish") with a rich, sweet-savoury flavour.', 'ขนมปลาอบกรอบ รสเข้มข้น หวานเค็มกลมกล่อม กินเพลิน'),
  },
  {
    id: 'taro-fish-squid', cat: 'nuts', brand: 'taro', pop: 2, impulse: true,
    name: T('Hot Squid Fish Snack', 'ปลาสวรรค์ หมึกย่างเผ็ด'), sub: T('Crispy fish snack', 'ขนมปลาอบกรอบ'),
    price: 15, size: g(17), g: 'bag-s',
    pal: ['#22262e', '#0a0c10', '#ff7a00', '#5a2a00'], bg: 'burst',
    hero: 'fishScene', heroOpts: { deco: 'squid' },
    ing: ['fish', 'tapioca', 'sugar', 'oil', 'salt', 'chili', 'squidseason', 'msg'], allergens: ['fish', 'squid', 'wheat', 'soy'], nut: nutOf(17, NP.fish),
    desc: T('The crispy fish snack with a hot and spicy grilled-squid flavour.', 'ขนมปลาอบกรอบ รสหมึกย่างฮอตแอนด์สไปซี่ เผ็ดร้อน หอมหมึกย่าง'),
  },
  {
    id: 'oishi-prawn-spicy', cat: 'nuts', brand: 'oishi', pop: 1,
    name: T('Prawn Crackers Spicy', 'ข้าวเกรียบกุ้ง รสเผ็ด'), sub: T('Prawn crackers', 'ข้าวเกรียบกุ้ง'),
    price: 25, size: g(60), g: 'bag-m',
    pal: ['#d6221b', '#8a0f0a', '#ffd400', '#5a0806'], bg: 'rays',
    hero: 'crackerScene', heroOpts: {},
    ing: ['tapioca', 'shrimp', 'palm', 'sugar', 'salt', 'chili', 'msg'], allergens: ['shrimp'], nut: nutOf(60, NP.cracker),
    desc: T('Light, puffy prawn crackers with a spicy kick.', 'ข้าวเกรียบกุ้งกรอบเบา ปรุงรสเผ็ดร้อน กินเพลิน'),
  },
  {
    id: 'entree-porkrind', cat: 'nuts', brand: 'entree', pop: 2, impulse: true,
    name: T('Pork Rinds Original', 'แคบหมู รสดั้งเดิม'), sub: T('Crispy pork rinds', 'แคบหมูทอดกรอบ'),
    price: 10, size: g(14), g: 'bag-s',
    pal: ['#7b2d1a', '#421208', '#ffd54a', '#2a0a04'], bg: 'zig',
    hero: 'rindScene', heroOpts: {},
    ing: ['pork', 'palm', 'salt'], allergens: [], nut: nutOf(14, NP.rind),
    desc: T('Crispy fried pork rinds (kaeb moo), a northern Thai favourite often eaten with chilli dips.', 'แคบหมูทอดกรอบ อาหารพื้นเมืองภาคเหนือ กินกับน้ำพริกหรือกินเล่นก็อร่อย'),
  },
  {
    id: 'maenapa-banana', cat: 'nuts', brand: 'maenapa', pop: 2, impulse: true,
    name: T('Crispy Banana Chips', 'กล้วยเบรคแตก'), sub: T('Sweet fried banana', 'กล้วยทอดกรอบเคลือบหวาน'),
    price: 15, size: g(35), g: 'bag-snack',
    pal: ['#f5cf2a', '#c99a00', '#2e9b3e', '#6b4a00'], bg: 'rays',
    hero: 'bananaScene', heroOpts: {},
    ing: ['banana', 'palm', 'sugar', 'salt'], allergens: [], nut: nutOf(35, NP.banana),
    desc: T('Thin banana slices fried crisp with a light, sweet glaze: a Thai tea-time snack.', 'กล้วยทอดกรอบบางเฉียบ เคลือบหวานเบาๆ กรอบอร่อย กินเล่นได้ทุกเวลา'),
  },
  {
    id: 'bento-squid', cat: 'nuts', brand: 'bento', pop: 2,
    name: T('Roasted Squid Seasoned', 'ปลาหมึกอบ รสปรุงรส'), sub: T('Dried shredded squid', 'ปลาหมึกอบแห้งฉีกเส้น'),
    price: 20, size: g(22), g: 'bag-s',
    pal: ['#e8501c', '#a8300a', '#ffd23a', '#5a1a04'], bg: 'waves',
    hero: 'squidScene', heroOpts: {},
    ing: ['squid', 'sugar', 'salt', 'chili', 'garlic', 'msg'], allergens: ['squid'], nut: nutOf(22, NP.squid),
    desc: T('Roasted shredded squid: sweet, salty and chewy, and a Thai favourite with a cold drink.', 'ปลาหมึกอบปรุงรสเหนียวนุ่ม หอมหวานเค็มกลมกล่อม กินเล่นหรือแกล้มเครื่องดื่มก็เข้ากัน'),
  },
  {
    id: 'dozo-rice-nori', cat: 'nuts', brand: 'dozo', pop: 2,
    name: T('Rice Crackers Nori', 'ข้าวอบกรอบ รสโนริสาหร่าย'), sub: T('Round baked rice crackers', 'ไรซ์บอล ข้าวอบกรอบ'),
    price: 20, size: g(35), g: 'bag-snack',
    pal: ['#1c7a4a', '#0b4229', '#ffd54a', '#062a18'], bg: 'dots',
    hero: 'riceScene', heroOpts: {},
    ing: ['rice', 'palm', 'seaweed', 'sugar', 'salt', 'soysauce', 'msg'], allergens: ['soy', 'wheat'], nut: nutOf(35, NP.rice),
    desc: T('Bite-sized baked rice crackers with a roasted seaweed flavour.', 'ข้าวอบกรอบพอดีคำ รสโนริสาหร่าย กรอบเบา หยิบกินไม่เลอะมือ'),
  },
  {
    id: 'popcorn-caramel', cat: 'nuts', brand: 'sevenselect', pop: 1, font: 'lilita',
    name: T('Caramel Popcorn', 'ป๊อปคอร์น รสคาราเมล'), sub: T('Sweet popcorn', 'ข้าวโพดคั่วเคลือบหวาน'),
    price: 35, size: g(60), g: 'bag-m',
    pal: ['#e8a520', '#a8650a', '#c8102e', '#5a3000'], bg: 'burst',
    hero: 'popcornScene', heroOpts: { caramel: true },
    ing: ['corn', 'sugar', 'butter', 'oil', 'salt', 'caramel'], allergens: ['milk'], nut: nutOf(60, NP.popcorn),
    desc: T('Popcorn coated in sweet caramel: crunchy, buttery and made for sharing.', 'ป๊อปคอร์นเคลือบคาราเมลหวานหอม กรอบเคี้ยวเพลิน ถุงใหญ่แบ่งกันกินได้'),
  },
];

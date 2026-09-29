// Products for the four "everyday" aisles of the shop: household (tissue, detergent, insect control, lighters), personal care
// (toothpaste, shampoo sachet strips, soap, skin care), health remedies (inhalers, balms, cold tablets, plasters) and everyday
// items (batteries, cables, SIMs, umbrellas, stationery). Authored per docs/design/sku-authoring.md.
// Hero illustrations are prefixed `hm`; the ids of the brands / ingredients added here are exported below.
import { circle, ellipse, poly, drop, leaf, linGrad, radGrad, fillRR, fitText } from '../gfx/draw.js';
import { drawIllus } from '../gfx/illus.js';
import { lighten, darken, TAU } from '../core/util.js';
import { g, ml, T } from './sku_util.js';

const sheets = (n) => ({ en: `${n} sheets`, th: `${n} แผ่น` });
const pcs = (n) => ({ en: `${n} pcs`, th: `${n} ชิ้น` });
const tabs = (n) => ({ en: `${n} tablets`, th: `${n} เม็ด` });
const mah = (n) => ({ en: `${n} mAh`, th: `${n} mAh` });
const cm = (n) => ({ en: `${n} cm`, th: `${n} ซม.` });
const cc = (n) => ({ en: `${n} cc`, th: `${n} ซีซี` });
const oz = (n) => ({ en: `${n} oz`, th: `${n} ออนซ์` });

// =====================================================================================================================
//  Hero illustrations (prefix `hm`). Chunky, outlined, saturated; every function draws centred on (0,0) in [-s/2, s/2].
// =====================================================================================================================
const OUT = '#3b2411';
const outline = (ctx, s, col = OUT, k = 0.028) => { ctx.strokeStyle = col; ctx.lineWidth = s * k; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); };
const fillOut = (ctx, fill, s, col = OUT, k = 0.028) => { ctx.fillStyle = fill; ctx.fill(); outline(ctx, s, col, k); };
const vgrad = (ctx, y0, y1, c, a = 0.22, b = 0.18) => linGrad(ctx, 0, y0, 0, y1, [[0, lighten(c, a)], [1, darken(c, b)]]);
const cyl = (ctx, x0, x1, c) => linGrad(ctx, x0, 0, x1, 0, [[0, darken(c, 0.22)], [0.3, lighten(c, 0.3)], [0.62, c], [1, darken(c, 0.32)]]);
function glint(ctx, x, y, w, h, rot = -0.6, a = 0.55) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill(); ctx.restore();
}
function sparkle(ctx, x, y, r, col = '#ffffff') {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, rr = i % 2 ? r * 0.3 : r; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
function bubble(ctx, x, y, r) {
  circle(ctx, x, y, r, 'rgba(255,255,255,.62)', 'rgba(255,255,255,.95)', r * 0.16);
  glint(ctx, x - r * 0.32, y - r * 0.34, r * 0.24, r * 0.12, -0.7, 0.95);
}
function pillowPath(ctx, x0, y0, x1, y1, b) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  ctx.beginPath(); ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx, y0 - b * 0.6, x1, y0); ctx.quadraticCurveTo(x1 + b, my, x1, y1);
  ctx.quadraticCurveTo(mx, y1 + b * 0.6, x0, y1); ctx.quadraticCurveTo(x0 - b, my, x0, y0); ctx.closePath();
}
function crimp(ctx, x0, x1, y, h, col) { // little serrated heat-seal strip
  ctx.fillStyle = col; ctx.fillRect(x0, y, x1 - x0, h);
  ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = h * 0.09;
  for (let x = x0 + h * 0.2; x < x1; x += h * 0.3) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke(); }
}

// ---------------------------------------------------------------------------------------------------- household
function hmTissueBox(ctx, s, o = {}) {
  const c = o.c1 || '#2f7fd8', acc = o.c2 || '#ffffff';
  const yT = -0.05 * s, yB = 0.34 * s;
  poly(ctx, [[-0.3 * s, -0.19 * s], [0.3 * s, -0.19 * s], [0.42 * s, yT], [-0.42 * s, yT]], lighten(c, 0.4), OUT, s * 0.028);
  ellipse(ctx, 0, -0.125 * s, 0.2 * s, 0.03 * s, '#10233f');
  ctx.beginPath(); ctx.moveTo(-0.15 * s, -0.125 * s);
  ctx.bezierCurveTo(-0.24 * s, -0.3 * s, -0.05 * s, -0.46 * s, 0.03 * s, -0.36 * s);
  ctx.bezierCurveTo(0.1 * s, -0.47 * s, 0.27 * s, -0.3 * s, 0.17 * s, -0.125 * s); ctx.closePath();
  fillOut(ctx, '#ffffff', s, '#7c93b2', 0.022);
  ctx.beginPath(); ctx.moveTo(0.03 * s, -0.35 * s); ctx.quadraticCurveTo(-0.01 * s, -0.24 * s, 0.01 * s, -0.13 * s); outline(ctx, s, 'rgba(120,145,180,.7)', 0.015);
  fillRR(ctx, -0.42 * s, yT, 0.84 * s, yB - yT, 0.03 * s, null); ctx.fillStyle = vgrad(ctx, yT, yB, c, 0.15, 0.15); ctx.fill(); outline(ctx, s);
  fillRR(ctx, -0.36 * s, yT + 0.05 * s, 0.72 * s, yB - yT - 0.1 * s, 0.025 * s, lighten(c, 0.24));
  // motif
  ctx.save(); ctx.translate(0, (yT + yB) / 2);
  if ((o.deco || 'leaf') === 'leaf') {
    ctx.strokeStyle = acc; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(-0.24 * s, 0.07 * s); ctx.quadraticCurveTo(0, -0.08 * s, 0.24 * s, -0.05 * s); ctx.stroke();
    for (let i = 0; i < 5; i++) { const t = i / 4, x = -0.22 * s + t * 0.44 * s, y = 0.06 * s - Math.sin(t * Math.PI) * 0.1 * s; leaf(ctx, x, y, 0.13 * s, 0.045 * s, -0.9 - t * 0.3, acc); leaf(ctx, x, y, 0.11 * s, 0.04 * s, 0.9 + t * 0.2, acc); }
  } else {
    for (const [x, y, r] of [[-0.2, 0.0, 0.05], [-0.06, 0.06, 0.04], [0.1, -0.02, 0.06], [0.24, 0.05, 0.04]]) drop(ctx, x * s, y * s, r * s, acc);
  }
  ctx.restore();
}
function hmTissuePack(ctx, s, o = {}) {
  const c = o.c1 || '#39b6d8', acc = o.c2 || '#ffffff';
  ctx.beginPath(); ctx.moveTo(0.0 * s, -0.22 * s); ctx.bezierCurveTo(0.04 * s, -0.42 * s, 0.3 * s, -0.42 * s, 0.24 * s, -0.2 * s); ctx.closePath(); fillOut(ctx, '#ffffff', s, '#7c93b2', 0.022);
  pillowPath(ctx, -0.36 * s, -0.22 * s, 0.36 * s, 0.34 * s, 0.07 * s);
  ctx.fillStyle = vgrad(ctx, -0.25 * s, 0.4 * s, c, 0.25, 0.12); ctx.fill();
  ctx.save(); ctx.clip();
  crimp(ctx, -0.5 * s, 0.5 * s, -0.27 * s, 0.09 * s, lighten(c, 0.5));
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.moveTo(-0.5 * s, 0.1 * s); ctx.quadraticCurveTo(-0.2 * s, 0.0 * s, 0.05 * s, 0.1 * s); ctx.quadraticCurveTo(0.3 * s, 0.2 * s, 0.5 * s, 0.08 * s); ctx.lineTo(0.5 * s, 0.5 * s); ctx.lineTo(-0.5 * s, 0.5 * s); ctx.fill();
  for (let i = 0; i < 4; i++) { leaf(ctx, -0.26 * s + i * 0.17 * s, 0.26 * s - (i % 2) * 0.05 * s, 0.14 * s, 0.05 * s, -0.7 + i * 0.3, acc === '#ffffff' ? lighten(c, 0.1) : acc); }
  glint(ctx, -0.2 * s, -0.08 * s, 0.09 * s, 0.03 * s, -0.5, 0.5);
  ctx.restore();
  pillowPath(ctx, -0.36 * s, -0.22 * s, 0.36 * s, 0.34 * s, 0.07 * s); outline(ctx, s);
}
function hmLaundry(ctx, s, o = {}) {
  const c = o.c1 || '#1f5fbf', acc = o.c2 || '#ffe14a';
  poly(ctx, [[-0.13, -0.3], [-0.05, -0.23], [0.05, -0.23], [0.13, -0.3], [0.36, -0.15], [0.28, 0.03], [0.17, -0.04], [0.17, 0.3], [-0.17, 0.3], [-0.17, -0.04], [-0.28, 0.03], [-0.36, -0.15]].map(([x, y]) => [x * s, y * s]), '#ffffff', c, s * 0.03);
  ctx.beginPath(); ctx.moveTo(-0.05 * s, -0.23 * s); ctx.quadraticCurveTo(0, -0.17 * s, 0.05 * s, -0.23 * s); outline(ctx, s, c, 0.02);
  ctx.fillStyle = 'rgba(31,95,191,.14)'; ctx.fillRect(-0.17 * s, 0.12 * s, 0.34 * s, 0.18 * s);
  sparkle(ctx, 0, 0.05 * s, 0.09 * s, acc);
  bubble(ctx, -0.36 * s, 0.22 * s, 0.1 * s); bubble(ctx, 0.36 * s, 0.16 * s, 0.08 * s); bubble(ctx, 0.3 * s, 0.34 * s, 0.05 * s); bubble(ctx, -0.28 * s, 0.4 * s, 0.05 * s); bubble(ctx, -0.4 * s, -0.02 * s, 0.045 * s);
  sparkle(ctx, 0.36 * s, -0.34 * s, 0.09 * s, acc); sparkle(ctx, -0.36 * s, -0.3 * s, 0.06 * s, '#ffffff');
}
function hmBlossom(ctx, s, o = {}) {
  const c = o.c1 || '#ff7ac8', c2 = o.c2 || '#ffe14a';
  leaf(ctx, 0.0, 0.05 * s, 0.32 * s, 0.09 * s, 2.5, '#2e9b3e'); leaf(ctx, 0.0, 0.05 * s, 0.32 * s, 0.09 * s, 0.65, '#3ab04a');
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate((i * TAU) / 5); ellipse(ctx, 0, -0.2 * s, 0.115 * s, 0.2 * s, c, darken(c, 0.42), s * 0.026); ctx.restore(); }
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate((i * TAU) / 5); ellipse(ctx, 0, -0.2 * s, 0.03 * s, 0.13 * s, lighten(c, 0.45)); ctx.restore(); }
  circle(ctx, 0, 0, 0.09 * s, c2, darken(c2, 0.45), s * 0.024);
  sparkle(ctx, 0.34 * s, -0.34 * s, 0.09 * s, '#fff'); sparkle(ctx, -0.36 * s, 0.28 * s, 0.06 * s, '#fff');
}
function mozzie(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, r * 0.05); ctx.lineTo(sx * r * 0.7, -r * 0.1 + i * r * 0.36); ctx.stroke(); }
  ellipse(ctx, 0, 0, r * 0.16, r * 0.42, '#3a3a3a'); ellipse(ctx, -r * 0.42, -r * 0.4, r * 0.42, r * 0.18, 'rgba(200,210,230,.85)', '#666', r * 0.05, -0.5); ellipse(ctx, r * 0.42, -r * 0.4, r * 0.42, r * 0.18, 'rgba(200,210,230,.85)', '#666', r * 0.05, 0.5);
  ctx.beginPath(); ctx.moveTo(0, -r * 0.4); ctx.lineTo(0, -r * 0.78); ctx.stroke(); ctx.restore();
}
function roach(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = '#3a2412'; ctx.lineWidth = r * 0.1; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) { for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx * r * 0.2, -r * 0.2 + i * r * 0.3); ctx.lineTo(sx * r * 0.75, -r * 0.4 + i * r * 0.45); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(sx * r * 0.1, -r * 0.62); ctx.quadraticCurveTo(sx * r * 0.5, -r * 1.0, sx * r * 0.7, -r * 0.9); ctx.stroke(); }
  ellipse(ctx, 0, r * 0.1, r * 0.34, r * 0.6, '#7a4a22', '#3a2412', r * 0.08); ellipse(ctx, 0, -r * 0.55, r * 0.2, r * 0.17, '#5a3618', '#3a2412', r * 0.06);
  ctx.strokeStyle = 'rgba(255,220,160,.5)'; ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.moveTo(0, -r * 0.3); ctx.lineTo(0, r * 0.65); ctx.stroke(); ctx.restore();
}
function hmSpray(ctx, s, o = {}) {
  const c = o.c1 || '#e60012', cap = o.c2 || '#ffffff';
  // mist cloud drifting to the right of the nozzle
  for (const [x, y, r, a] of [[-0.02, -0.4, 0.05, 0.95], [0.07, -0.43, 0.075, 0.9], [0.18, -0.44, 0.095, 0.85], [0.06, -0.3, 0.06, 0.8], [0.19, -0.31, 0.085, 0.7], [0.32, -0.38, 0.09, 0.55], [0.33, -0.22, 0.065, 0.5], [0.43, -0.3, 0.05, 0.4]]) circle(ctx, x * s, y * s, r * s, `rgba(255,255,255,${a})`);
  // can
  ctx.save(); ctx.translate(-0.24 * s, 0.05 * s); ctx.rotate(-0.05);
  const w = 0.19 * s;
  ctx.beginPath(); ctx.moveTo(-w, 0.4 * s); ctx.lineTo(-w, -0.12 * s); ctx.quadraticCurveTo(-w, -0.24 * s, -0.09 * s, -0.27 * s); ctx.lineTo(0.09 * s, -0.27 * s); ctx.quadraticCurveTo(w, -0.24 * s, w, -0.12 * s); ctx.lineTo(w, 0.4 * s); ctx.closePath();
  ctx.fillStyle = cyl(ctx, -w, w, '#cfd6dc'); ctx.fill(); outline(ctx, s);
  ctx.fillStyle = cyl(ctx, -w, w, c); ctx.fillRect(-w, -0.08 * s, 2 * w, 0.44 * s); ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.02; ctx.strokeRect(-w, -0.08 * s, 2 * w, 0.44 * s);
  ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.ellipse(0, 0.14 * s, w * 0.72, 0.1 * s, 0, 0, TAU); ctx.fill();
  drop(ctx, 0, 0.14 * s, 0.045 * s, c);
  fillRR(ctx, -0.09 * s, -0.4 * s, 0.18 * s, 0.14 * s, 0.03 * s, cap, OUT, s * 0.026); fillRR(ctx, 0.0 * s, -0.44 * s, 0.17 * s, 0.06 * s, 0.02 * s, darken(cap, 0.15), OUT, s * 0.022);
  glint(ctx, -0.12 * s, 0.14 * s, 0.014 * s, 0.14 * s, 0.03, 0.4);
  ctx.restore();
  mozzie(ctx, 0.32 * s, 0.0, 0.19 * s, 0.4); roach(ctx, 0.27 * s, 0.31 * s, 0.2 * s, 0.7);
  sparkle(ctx, 0.44 * s, 0.12 * s, 0.05 * s, '#fff');
}
function hmLighter(ctx, s, o = {}) {
  const c = o.c1 || '#e8261c';
  ctx.save(); ctx.rotate(o.tilt ?? 0);
  // flame
  ctx.beginPath(); ctx.moveTo(0.05 * s, -0.5 * s); ctx.bezierCurveTo(0.16 * s, -0.4 * s, 0.14 * s, -0.33 * s, 0.05 * s, -0.31 * s); ctx.bezierCurveTo(-0.05 * s, -0.33 * s, -0.03 * s, -0.4 * s, 0.05 * s, -0.5 * s); ctx.closePath(); fillOut(ctx, '#ffb400', s, '#c05a00', 0.014);
  ctx.beginPath(); ctx.ellipse(0.05 * s, -0.36 * s, 0.03 * s, 0.045 * s, 0, 0, TAU); ctx.fillStyle = '#fff3a0'; ctx.fill();
  // metal hood
  fillRR(ctx, -0.17 * s, -0.33 * s, 0.34 * s, 0.2 * s, 0.03 * s, null); ctx.fillStyle = cyl(ctx, -0.17 * s, 0.17 * s, '#d5dade'); ctx.fill(); outline(ctx, s, OUT, 0.022);
  circle(ctx, -0.06 * s, -0.27 * s, 0.07 * s, '#9aa4ad', OUT, s * 0.018); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = s * 0.01; for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8; ctx.beginPath(); ctx.moveTo(-0.06 * s + Math.cos(a) * 0.04 * s, -0.27 * s + Math.sin(a) * 0.04 * s); ctx.lineTo(-0.06 * s + Math.cos(a) * 0.07 * s, -0.27 * s + Math.sin(a) * 0.07 * s); ctx.stroke(); }
  fillRR(ctx, 0.02 * s, -0.31 * s, 0.12 * s, 0.05 * s, 0.01 * s, '#6b757e', OUT, s * 0.012);
  // body
  fillRR(ctx, -0.17 * s, -0.14 * s, 0.34 * s, 0.6 * s, 0.05 * s, null); ctx.fillStyle = cyl(ctx, -0.17 * s, 0.17 * s, c); ctx.fill(); outline(ctx, s, OUT, 0.024);
  fillRR(ctx, -0.17 * s, 0.05 * s, 0.34 * s, 0.14 * s, 0, 'rgba(255,255,255,.9)');
  fitText(ctx, o.txt || 'BIC', -0.15 * s, 0.06 * s, 0.3 * s, 0.12 * s, { family: 'archivo', weight: 400, size: 0.12 * s, color: darken(c, 0.2) });
  glint(ctx, -0.11 * s, 0.24 * s, 0.014 * s, 0.13 * s, 0.03, 0.4);
  ctx.restore();
}
function hmCoil(ctx, s, o = {}) {
  const c = o.c1 || '#3f5a2a';
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.ellipse(0, 0.04 * s, 0.42 * s, 0.42 * s, 0, 0, TAU); ctx.stroke();
  const spiral = (w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); for (let a = 0; a <= 5.2 * Math.PI; a += 0.08) { const r = (0.05 + 0.058 * a / Math.PI * 0.62) * s; const x = Math.cos(a) * r, y = Math.sin(a) * r; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); };
  spiral(s * 0.085, '#1f2f12'); spiral(s * 0.06, c); spiral(s * 0.018, lighten(c, 0.35));
  const a = 5.2 * Math.PI, r = (0.05 + 0.058 * a / Math.PI * 0.62) * s;
  circle(ctx, Math.cos(a) * r, Math.sin(a) * r, s * 0.035, '#ff5a1f'); circle(ctx, Math.cos(a) * r, Math.sin(a) * r, s * 0.018, '#ffd24a');
  ctx.strokeStyle = 'rgba(200,200,210,.85)'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
  for (const k of [0, 1]) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r - s * 0.04); ctx.bezierCurveTo(Math.cos(a) * r - s * 0.08 + k * 0.1 * s, Math.sin(a) * r - s * 0.12, Math.cos(a) * r + s * 0.08, Math.sin(a) * r - s * 0.2, Math.cos(a) * r + k * 0.05 * s, Math.sin(a) * r - s * 0.3); ctx.stroke(); }
}
function hmBin(ctx, s0, o = {}) {
  const c = o.c1 || '#2b3138';
  ctx.save(); ctx.translate(0, 0.07 * s0); const s = s0 * 0.9;
  poly(ctx, [[-0.08 * s, -0.16 * s], [-0.22 * s, -0.38 * s], [-0.01 * s, -0.22 * s]], darken(c, 0.1), OUT, s * 0.024); poly(ctx, [[0.08 * s, -0.16 * s], [0.22 * s, -0.38 * s], [0.01 * s, -0.22 * s]], darken(c, 0.1), OUT, s * 0.024);
  ctx.beginPath(); ctx.moveTo(-0.15 * s, -0.16 * s); ctx.bezierCurveTo(-0.36 * s, -0.08 * s, -0.42 * s, 0.2 * s, -0.31 * s, 0.4 * s); ctx.quadraticCurveTo(0, 0.46 * s, 0.31 * s, 0.4 * s);
  ctx.bezierCurveTo(0.42 * s, 0.2 * s, 0.36 * s, -0.08 * s, 0.15 * s, -0.16 * s); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, 0.1 * s, 0, 0.5 * s, [[0, lighten(c, 0.3)], [1, darken(c, 0.2)]], -0.12 * s, -0.02 * s); ctx.fill(); outline(ctx, s);
  fillRR(ctx, -0.09 * s, -0.2 * s, 0.18 * s, 0.07 * s, 0.03 * s, lighten(c, 0.1), OUT, s * 0.022);
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = s * 0.02; ctx.lineCap = 'round';
  for (const [x0, y0, x1, y1] of [[-0.24, -0.02, -0.3, 0.26], [0.2, 0.02, 0.27, 0.24], [-0.05, 0.1, -0.08, 0.36]]) { ctx.beginPath(); ctx.moveTo(x0 * s, y0 * s); ctx.quadraticCurveTo((x0 + x1) / 2 * s + 0.03 * s, (y0 + y1) / 2 * s, x1 * s, y1 * s); ctx.stroke(); }
  glint(ctx, -0.2 * s, 0.05 * s, 0.03 * s, 0.13 * s, 0.1, 0.35);
  for (let i = 0; i < 3; i++) circle(ctx, (0.05 + i * 0.07) * s, 0.28 * s, 0.014 * s, o.c2 || '#7ddc6a');
  ctx.restore();
}
function hmSponge(ctx, s, o = {}) {
  const y = o.c1 || '#ffd83a', gr = o.c2 || '#2fae5a';
  poly(ctx, [[-0.3 * s, -0.2 * s], [0.34 * s, -0.2 * s], [0.4 * s, -0.12 * s], [-0.36 * s, -0.12 * s]], lighten(gr, 0.25), OUT, s * 0.024);
  fillRR(ctx, -0.38 * s, -0.12 * s, 0.76 * s, 0.14 * s, 0.03 * s, gr, OUT, s * 0.028);
  fillRR(ctx, -0.38 * s, 0.02 * s, 0.76 * s, 0.26 * s, 0.04 * s, y, OUT, s * 0.028);
  ctx.fillStyle = darken(gr, 0.28); for (let i = 0; i < 14; i++) ctx.fillRect((-0.35 + (i * 0.053)) * s, (-0.1 + (i % 3) * 0.035) * s, 0.02 * s, 0.014 * s);
  ctx.fillStyle = darken(y, 0.18); for (const [x, yy, r] of [[-0.28, 0.1, 0.025], [-0.12, 0.18, 0.03], [0.02, 0.09, 0.022], [0.14, 0.19, 0.03], [0.28, 0.1, 0.024], [0.06, 0.22, 0.015], [-0.2, 0.22, 0.016]]) { ctx.beginPath(); ctx.ellipse(x * s, yy * s, r * s, r * 0.7 * s, 0, 0, TAU); ctx.fill(); }
  bubble(ctx, 0.3 * s, -0.3 * s, 0.09 * s); bubble(ctx, 0.14 * s, -0.36 * s, 0.05 * s); bubble(ctx, -0.34 * s, -0.28 * s, 0.06 * s); bubble(ctx, 0.4 * s, 0.34 * s, 0.05 * s);
}
function hmWipes(ctx, s0, o = {}) {
  const c = o.c1 || '#39a7ff', acc = o.c2 || '#ffffff';
  ctx.save(); ctx.translate(0, 0.1 * s0); const s = s0 * 0.9;
  ctx.beginPath(); ctx.moveTo(-0.1 * s, -0.12 * s); ctx.bezierCurveTo(-0.14 * s, -0.36 * s, 0.1 * s, -0.44 * s, 0.16 * s, -0.3 * s); ctx.bezierCurveTo(0.2 * s, -0.22 * s, 0.2 * s, -0.16 * s, 0.16 * s, -0.12 * s); ctx.closePath(); fillOut(ctx, '#ffffff', s, '#7c93b2', 0.022);
  fillRR(ctx, -0.32 * s, -0.06 * s, 0.64 * s, 0.42 * s, 0.06 * s, null); ctx.fillStyle = vgrad(ctx, -0.06 * s, 0.36 * s, c, 0.2, 0.15); ctx.fill(); outline(ctx, s);
  fillRR(ctx, -0.32 * s, -0.15 * s, 0.64 * s, 0.13 * s, 0.045 * s, '#f5f8fc', OUT, s * 0.026);
  fillRR(ctx, -0.13 * s, -0.11 * s, 0.26 * s, 0.05 * s, 0.02 * s, '#c9d3df');
  if ((o.deco || 'drop') === 'drop') { drop(ctx, 0, 0.16 * s, 0.09 * s, acc, darken(c, 0.35), s * 0.02); glint(ctx, -0.03 * s, 0.14 * s, 0.015 * s, 0.03 * s, 0.3, 0.7); }
  else { circle(ctx, 0, 0.17 * s, 0.11 * s, '#ffd9b0', darken(c, 0.35), s * 0.02); circle(ctx, -0.035 * s, 0.155 * s, 0.014 * s, '#222'); circle(ctx, 0.035 * s, 0.155 * s, 0.014 * s, '#222'); ctx.strokeStyle = '#c04a4a'; ctx.lineWidth = s * 0.014; ctx.beginPath(); ctx.arc(0, 0.185 * s, 0.03 * s, 0.2, Math.PI - 0.2); ctx.stroke(); }
  bubble(ctx, 0.4 * s, 0.05 * s, 0.05 * s); bubble(ctx, -0.4 * s, 0.22 * s, 0.04 * s);
  ctx.restore();
}
function hmGel(ctx, s, o = {}) {
  const c = o.c1 || '#41c8ee', cap = o.c2 || '#ffffff';
  fillRR(ctx, -0.02 * s, -0.4 * s, 0.24 * s, 0.05 * s, 0.02 * s, cap, OUT, s * 0.02); fillRR(ctx, -0.06 * s, -0.36 * s, 0.12 * s, 0.14 * s, 0.02 * s, cap, OUT, s * 0.024);
  fillRR(ctx, -0.14 * s, -0.24 * s, 0.28 * s, 0.05 * s, 0.015 * s, darken(cap, 0.12), OUT, s * 0.02);
  fillRR(ctx, -0.2 * s, -0.19 * s, 0.4 * s, 0.6 * s, 0.07 * s, null); ctx.fillStyle = cyl(ctx, -0.2 * s, 0.2 * s, c); ctx.fill(); outline(ctx, s);
  fillRR(ctx, -0.16 * s, -0.04 * s, 0.32 * s, 0.32 * s, 0.03 * s, 'rgba(255,255,255,.92)');
  fitText(ctx, o.txt || '70%', -0.15 * s, 0.0, 0.3 * s, 0.2 * s, { family: 'kanit', weight: 900, size: 0.2 * s, color: darken(c, 0.35) });
  fillRR(ctx, -0.11 * s, 0.2 * s, 0.22 * s, 0.06 * s, 0.02 * s, darken(c, 0.1));
  drop(ctx, -0.34 * s, 0.05 * s, 0.07 * s, 'rgba(120,225,255,.85)', '#1b8db0', s * 0.018); drop(ctx, 0.34 * s, 0.22 * s, 0.05 * s, 'rgba(120,225,255,.85)', '#1b8db0', s * 0.016);
  sparkle(ctx, 0.34 * s, -0.16 * s, 0.09 * s, '#fff'); sparkle(ctx, -0.34 * s, -0.22 * s, 0.06 * s, '#fff');
}

// -------------------------------------------------------------------------------------------------- personal care
function hmHair(ctx, s0, o = {}) {
  // a glossy ponytail: hair tie at the top, tress swelling then tapering to a curled tip, strands and shine along it
  const c = o.c1 || '#3a2412', hi = o.c2 || lighten(c, 0.55), tie = o.tie || '#ff3b8a';
  ctx.save(); ctx.translate(0, 0.02 * s0); const s = s0 * 0.92;
  const build = (dx, dy, k, sw) => {
    const segs = [[[0, -0.26], [0.2 * sw, -0.1], [-0.24 * sw, 0.06], [0.0, 0.18]], [[0.0, 0.18], [0.24 * sw, 0.3], [-0.06 * sw, 0.4], [0.16 * sw, 0.5]]];
    const pts = [], N = 26;
    for (const [p0, a, b, p1] of segs) for (let i = pts.length ? 1 : 0; i <= N; i++) { const t = i / N, u = 1 - t; pts.push([(u * u * u * p0[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t * t * t * p1[0] + dx) * s, (u * u * u * p0[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t * t * t * p1[1] + dy) * s]); }
    const M = pts.length, hw = (i) => { const t = i / (M - 1); return s * k * (0.012 + 0.03 * (1 - t) + 0.15 * Math.sin(Math.PI * Math.pow(t, 0.72))); };
    const ribbon = (off, wf) => {
      const L = [], R = [];
      for (let i = 0; i < M; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(M - 1, i + 1)], ddx = b[0] - a[0], ddy = b[1] - a[1], d = Math.hypot(ddx, ddy) || 1, nx = -ddy / d, ny = ddx / d;
        const cx = pts[i][0] + nx * off * hw(i), cy = pts[i][1] + ny * off * hw(i), w = wf * hw(i);
        L.push([cx + nx * w, cy + ny * w]); R.push([cx - nx * w, cy - ny * w]);
      }
      ctx.beginPath(); L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); for (let i = M - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath();
    };
    return ribbon;
  };
  const tress = (dx, dy, k, sw, col, strands) => {
    const ribbon = build(dx, dy, k, sw);
    ribbon(0, 1); ctx.fillStyle = linGrad(ctx, -0.3 * s, -0.3 * s, 0.35 * s, 0.5 * s, [[0, lighten(col, 0.22)], [0.5, col], [1, darken(col, 0.3)]]); ctx.fill();
    if (strands) { ctx.save(); ribbon(0, 1); ctx.clip(); for (const [off, wf, a] of [[-0.6, 0.14, 0.55], [-0.15, 0.08, 0.4], [0.3, 0.12, 0.3], [0.7, 0.07, 0.25]]) { ribbon(off, wf); ctx.fillStyle = hi; ctx.globalAlpha = a; ctx.fill(); } ctx.globalAlpha = 1; ctx.restore(); }
    ribbon(0, 1); outline(ctx, s, darken(c, 0.6), 0.024);
  };
  tress(0.05, 0.0, 0.95, -1, darken(c, 0.2), false);
  tress(-0.02, 0.0, 1, 1, c, true);
  // hair tie
  fillRR(ctx, -0.085 * s, -0.31 * s, 0.17 * s, 0.075 * s, 0.03 * s, tie, darken(tie, 0.5), s * 0.022);
  glint(ctx, -0.03 * s, -0.295 * s, 0.03 * s, 0.01 * s, 0, 0.6);
  sparkle(ctx, 0.36 * s, -0.12 * s, 0.09 * s, '#fff'); sparkle(ctx, -0.34 * s, 0.36 * s, 0.06 * s, '#fff'); sparkle(ctx, 0.38 * s, 0.24 * s, 0.05 * s, '#fff');
  ctx.restore();
}
function brushShape(ctx, s, c, tuft, paste) {
  // horizontal toothbrush centred at origin, length ~0.9 s
  fillRR(ctx, -0.45 * s, -0.05 * s, 0.55 * s, 0.1 * s, 0.05 * s, c, OUT, s * 0.026);
  fillRR(ctx, -0.42 * s, -0.025 * s, 0.22 * s, 0.05 * s, 0.025 * s, lighten(c, 0.45));
  ctx.beginPath(); ctx.moveTo(0.08 * s, -0.04 * s); ctx.lineTo(0.2 * s, -0.06 * s); ctx.lineTo(0.2 * s, 0.06 * s); ctx.lineTo(0.08 * s, 0.04 * s); ctx.closePath(); fillOut(ctx, darken(c, 0.05), s, OUT, 0.024);
  fillRR(ctx, 0.18 * s, -0.065 * s, 0.26 * s, 0.13 * s, 0.05 * s, c, OUT, s * 0.026);
  for (let i = 0; i < 5; i++) fillRR(ctx, (0.195 + i * 0.048) * s, -0.15 * s, 0.038 * s, 0.09 * s, 0.012 * s, i % 2 ? '#ffffff' : tuft, OUT, s * 0.014);
  if (paste) { ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0.2 * s, -0.16 * s); ctx.bezierCurveTo(0.26 * s, -0.24 * s, 0.3 * s, -0.12 * s, 0.34 * s, -0.2 * s); ctx.bezierCurveTo(0.38 * s, -0.26 * s, 0.4 * s, -0.16 * s, 0.44 * s, -0.19 * s); ctx.stroke(); ctx.strokeStyle = paste; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(0.2 * s, -0.16 * s); ctx.bezierCurveTo(0.26 * s, -0.24 * s, 0.3 * s, -0.12 * s, 0.34 * s, -0.2 * s); ctx.bezierCurveTo(0.38 * s, -0.26 * s, 0.4 * s, -0.16 * s, 0.44 * s, -0.19 * s); ctx.stroke(); }
}
function hmBrush(ctx, s, o = {}) {
  const c = o.c1 || '#e5202b', tuft = o.c2 || '#1e9dd5';
  ctx.save(); ctx.rotate(-0.72); ctx.translate(-0.02 * s, 0.02 * s); brushShape(ctx, s * 1.05, c, tuft, o.paste || null); ctx.restore();
  bubble(ctx, 0.32 * s, 0.3 * s, 0.06 * s); bubble(ctx, -0.34 * s, -0.28 * s, 0.05 * s); sparkle(ctx, -0.3 * s, 0.3 * s, 0.07 * s, '#fff'); sparkle(ctx, 0.34 * s, -0.36 * s, 0.09 * s, '#fff');
}
function tubeBody(ctx, s, c, band, cap) { // upright tube standing on its cap; origin at centre, height ~0.84 s
  const x = 0.14 * s;
  ctx.beginPath(); ctx.moveTo(-x * 0.62, 0.32 * s); ctx.lineTo(-x, -0.3 * s); ctx.lineTo(x, -0.3 * s); ctx.lineTo(x * 0.62, 0.32 * s); ctx.closePath();
  ctx.fillStyle = cyl(ctx, -x, x, '#f6f8fb'); ctx.fill(); outline(ctx, s);
  ctx.save(); ctx.clip(); ctx.fillStyle = cyl(ctx, -x, x, band); ctx.beginPath(); ctx.moveTo(-x, -0.12 * s); ctx.quadraticCurveTo(0, -0.02 * s, x, -0.14 * s); ctx.lineTo(x, 0.4 * s); ctx.lineTo(-x, 0.4 * s); ctx.fill(); ctx.restore();
  crimp(ctx, -x, x, -0.4 * s, 0.1 * s, '#dfe5ec'); ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.024; ctx.strokeRect(-x, -0.4 * s, 2 * x, 0.1 * s);
  fillRR(ctx, -x * 0.6, 0.32 * s, x * 1.2, 0.11 * s, 0.02 * s, cap, OUT, s * 0.026);
  glint(ctx, -x * 0.45, -0.08 * s, 0.014 * s, 0.16 * s, 0.05, 0.5);
}
function hmPaste(ctx, s, o = {}) {
  const c = o.c1 || '#e5202b', tuft = o.c2 || '#1e9dd5';
  ctx.save(); ctx.translate(-0.24 * s, 0.03 * s); ctx.rotate(-0.1); tubeBody(ctx, s * 0.95, c, c, '#ffffff'); ctx.restore();
  ctx.save(); ctx.translate(0.14 * s, 0.02 * s); ctx.rotate(-1.05); brushShape(ctx, s * 0.95, c === '#ffffff' ? tuft : darken(c, 0.05), tuft, tuft); ctx.restore();
  for (const [x, y, r] of [[0.36, 0.32, 0.05], [0.24, 0.4, 0.03], [-0.4, -0.3, 0.04]]) bubble(ctx, x * s, y * s, r * s);
  sparkle(ctx, 0.34 * s, -0.36 * s, 0.08 * s, '#fff');
}
function hmRollOn(ctx, s, o = {}) {
  const c = o.c1 || '#0057b8', cap = o.c2 || '#7fd0ff';
  ctx.beginPath(); ctx.moveTo(-0.17 * s, 0.4 * s); ctx.lineTo(-0.17 * s, 0.0 * s); ctx.bezierCurveTo(-0.17 * s, -0.12 * s, -0.09 * s, -0.12 * s, -0.09 * s, -0.2 * s); ctx.lineTo(0.09 * s, -0.2 * s); ctx.bezierCurveTo(0.09 * s, -0.12 * s, 0.17 * s, -0.12 * s, 0.17 * s, 0.0 * s); ctx.lineTo(0.17 * s, 0.4 * s); ctx.quadraticCurveTo(0, 0.45 * s, -0.17 * s, 0.4 * s); ctx.closePath();
  ctx.fillStyle = cyl(ctx, -0.17 * s, 0.17 * s, '#f4f8fb'); ctx.fill(); outline(ctx, s);
  ctx.save(); ctx.clip(); ctx.fillStyle = cyl(ctx, -0.17 * s, 0.17 * s, c); ctx.fillRect(-0.2 * s, 0.05 * s, 0.4 * s, 0.4 * s); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(-0.2 * s, 0.14 * s); ctx.quadraticCurveTo(0, 0.02 * s, 0.2 * s, 0.14 * s); ctx.lineTo(0.2 * s, 0.17 * s); ctx.quadraticCurveTo(0, 0.05 * s, -0.2 * s, 0.17 * s); ctx.fill(); ctx.restore();
  fillRR(ctx, -0.115 * s, -0.245 * s, 0.23 * s, 0.05 * s, 0.015 * s, '#c5ccd3', OUT, s * 0.022);
  circle(ctx, 0, -0.26 * s, 0.075 * s, '#ffffff', '#8a97a3', s * 0.018);
  ctx.beginPath(); ctx.moveTo(-0.13 * s, -0.25 * s); ctx.lineTo(-0.11 * s, -0.42 * s); ctx.quadraticCurveTo(0, -0.5 * s, 0.11 * s, -0.42 * s); ctx.lineTo(0.13 * s, -0.25 * s); ctx.closePath(); ctx.fillStyle = cap; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1; outline(ctx, s);
  glint(ctx, -0.055 * s, -0.36 * s, 0.014 * s, 0.05 * s, 0.1, 0.6);
  for (const [x, y] of [[0.34, -0.1], [-0.34, -0.2], [0.32, 0.26]]) sparkle(ctx, x * s, y * s, 0.06 * s, '#fff');
}
function hmLotion(ctx, s, o = {}) {
  const c = o.c1 || '#f2f6fa', band = o.c2 || '#ffb400', cap = o.cap || '#f5c400';
  ctx.beginPath(); ctx.moveTo(-0.2 * s, 0.4 * s); ctx.lineTo(-0.2 * s, -0.04 * s); ctx.bezierCurveTo(-0.2 * s, -0.16 * s, -0.09 * s, -0.16 * s, -0.09 * s, -0.24 * s); ctx.lineTo(0.09 * s, -0.24 * s); ctx.bezierCurveTo(0.09 * s, -0.16 * s, 0.2 * s, -0.16 * s, 0.2 * s, -0.04 * s); ctx.lineTo(0.2 * s, 0.4 * s); ctx.quadraticCurveTo(0, 0.45 * s, -0.2 * s, 0.4 * s); ctx.closePath();
  ctx.fillStyle = cyl(ctx, -0.2 * s, 0.2 * s, c); ctx.fill(); outline(ctx, s);
  ctx.save(); ctx.clip(); ctx.fillStyle = band; ctx.beginPath(); ctx.moveTo(-0.22 * s, 0.14 * s); ctx.quadraticCurveTo(0, 0.05 * s, 0.22 * s, 0.14 * s); ctx.lineTo(0.22 * s, 0.24 * s); ctx.quadraticCurveTo(0, 0.15 * s, -0.22 * s, 0.24 * s); ctx.fill(); ctx.restore();
  fillRR(ctx, -0.075 * s, -0.31 * s, 0.15 * s, 0.075 * s, 0.015 * s, cap, OUT, s * 0.022); fillRR(ctx, -0.02 * s, -0.4 * s, 0.05 * s, 0.1 * s, 0.015 * s, darken(cap, 0.1), OUT, s * 0.02); fillRR(ctx, -0.02 * s, -0.42 * s, 0.22 * s, 0.06 * s, 0.025 * s, cap, OUT, s * 0.022);
  if ((o.deco || 'drop') === 'drop') drop(ctx, 0, -0.0 * s, 0.07 * s, band, darken(band, 0.4), s * 0.02); else { circle(ctx, 0, -0.02 * s, 0.075 * s, band, darken(band, 0.4), s * 0.02); circle(ctx, 0, -0.02 * s, 0.035 * s, '#fff'); }
  glint(ctx, -0.13 * s, 0.1 * s, 0.014 * s, 0.12 * s, 0.03, 0.55);
  sparkle(ctx, 0.36 * s, -0.12 * s, 0.09 * s, '#fff'); sparkle(ctx, -0.36 * s, 0.2 * s, 0.06 * s, '#fff');
}
function hmTube(ctx, s, o = {}) {
  ctx.save(); ctx.rotate(o.tilt ?? 0); tubeBody(ctx, s, '#ffffff', o.c1 || '#41a6e8', o.c2 || '#ffffff'); ctx.restore();
}
function hmFoam(ctx, s, o = {}) {
  ctx.save(); ctx.translate(0, 0.12 * s); tubeBody(ctx, s * 0.78, '#ffffff', o.c1 || '#c04fd0', o.c2 || '#ffffff'); ctx.restore();
  for (const [x, y, r] of [[0, -0.28, 0.13], [-0.13, -0.22, 0.1], [0.14, -0.22, 0.1], [-0.05, -0.38, 0.08], [0.09, -0.36, 0.075], [0.26, -0.3, 0.06], [-0.28, -0.28, 0.06], [0.3, -0.12, 0.04]]) circle(ctx, x * s, y * s, r * s, '#ffffff', '#b8d4ea', s * 0.014);
  bubble(ctx, 0.36 * s, 0.12 * s, 0.05 * s); bubble(ctx, -0.34 * s, 0.1 * s, 0.04 * s);
}
function hmSunTube(ctx, s, o = {}) {
  drawIllus(ctx, 'sun', 0.1 * s, -0.12 * s, 0.9 * s, { c1: o.sun || '#ffc21a' });
  ctx.save(); ctx.translate(-0.16 * s, 0.1 * s); ctx.rotate(-0.12); tubeBody(ctx, s * 0.72, '#ffffff', o.c1 || '#ff8a1a', o.c2 || '#ffffff'); ctx.restore();
  sparkle(ctx, 0.36 * s, 0.3 * s, 0.07 * s, '#fff');
}
function hmPad(ctx, s, o = {}) {
  const c = o.c1 || '#ff5aa6';
  ctx.save(); ctx.rotate(-0.55);
  for (const sy of [-1, 1]) { ellipse(ctx, -0.02 * s, sy * 0.15 * s, 0.11 * s, 0.075 * s, '#ffffff', OUT, s * 0.024, sy * 0.1); }
  fillRR(ctx, -0.44 * s, -0.11 * s, 0.88 * s, 0.22 * s, 0.11 * s, null); ctx.fillStyle = linGrad(ctx, 0, -0.11 * s, 0, 0.11 * s, [[0, '#ffffff'], [1, '#f3e7ee']]); ctx.fill(); outline(ctx, s);
  fillRR(ctx, -0.36 * s, -0.05 * s, 0.72 * s, 0.1 * s, 0.05 * s, lighten(c, 0.55)); ctx.setLineDash([s * 0.03, s * 0.03]); ctx.strokeStyle = c; ctx.lineWidth = s * 0.014; ctx.beginPath(); ctx.moveTo(-0.34 * s, 0); ctx.lineTo(0.34 * s, 0); ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(-0.04 * s, 0); ctx.rotate((i * TAU) / 5); ellipse(ctx, 0, -0.03 * s, 0.018 * s, 0.03 * s, c); ctx.restore(); }
  circle(ctx, -0.04 * s, 0, 0.012 * s, '#ffe14a');
  ctx.restore();
  drop(ctx, 0.34 * s, -0.24 * s, 0.05 * s, 'rgba(120,225,255,.9)', '#1b8db0', s * 0.014); sparkle(ctx, -0.34 * s, 0.32 * s, 0.07 * s, '#fff'); sparkle(ctx, 0.36 * s, 0.3 * s, 0.05 * s, '#fff');
}
function hmBuds(ctx, s, o = {}) {
  const st = o.c1 || '#ffffff';
  ctx.save(); ctx.rotate(-0.75);
  for (const [dy, dx] of [[-0.16, 0.02], [0, -0.03], [0.16, 0.05]]) {
    ctx.save(); ctx.translate(dx * s, dy * s);
    fillRR(ctx, -0.36 * s, -0.018 * s, 0.72 * s, 0.036 * s, 0.018 * s, st, '#9aa8b8', s * 0.014);
    for (const sx of [-1, 1]) { ellipse(ctx, sx * 0.38 * s, 0, 0.075 * s, 0.062 * s, '#ffffff', '#b8c6d4', s * 0.02); ctx.strokeStyle = '#dbe4ec'; ctx.lineWidth = s * 0.01; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(sx * 0.38 * s + i * 0.02 * s, -0.05 * s); ctx.lineTo(sx * 0.38 * s + i * 0.02 * s, 0.05 * s); ctx.stroke(); } }
    ctx.restore();
  }
  ctx.restore();
  sparkle(ctx, 0.34 * s, 0.32 * s, 0.08 * s, '#fff'); sparkle(ctx, -0.34 * s, -0.3 * s, 0.06 * s, '#fff');
}
function hmSnake(ctx, s, o = {}) {
  const c = o.c1 || '#2ea043';
  const path = () => { ctx.beginPath(); ctx.moveTo(-0.34 * s, 0.34 * s); ctx.bezierCurveTo(0.0 * s, 0.5 * s, 0.4 * s, 0.34 * s, 0.32 * s, 0.14 * s); ctx.bezierCurveTo(0.24 * s, -0.06 * s, -0.34 * s, 0.06 * s, -0.28 * s, -0.12 * s); ctx.bezierCurveTo(-0.24 * s, -0.28 * s, 0.06 * s, -0.22 * s, 0.1 * s, -0.3 * s); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  path(); ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.15; ctx.stroke();
  path(); ctx.strokeStyle = c; ctx.lineWidth = s * 0.115; ctx.stroke();
  path(); ctx.strokeStyle = lighten(c, 0.45); ctx.lineWidth = s * 0.05; ctx.setLineDash([s * 0.035, s * 0.05]); ctx.stroke(); ctx.setLineDash([]);
  path(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = s * 0.02; ctx.stroke();
  // head
  ctx.save(); ctx.translate(0.14 * s, -0.33 * s); ctx.rotate(-0.4);
  ellipse(ctx, 0, 0, 0.11 * s, 0.075 * s, c, OUT, s * 0.026); circle(ctx, 0.03 * s, -0.03 * s, 0.017 * s, '#ffe14a', OUT, s * 0.008); circle(ctx, 0.032 * s, -0.03 * s, 0.007 * s, '#111');
  ctx.strokeStyle = '#e8261c'; ctx.lineWidth = s * 0.015; ctx.beginPath(); ctx.moveTo(0.1 * s, 0.01 * s); ctx.lineTo(0.19 * s, 0.01 * s); ctx.lineTo(0.22 * s, -0.02 * s); ctx.moveTo(0.19 * s, 0.01 * s); ctx.lineTo(0.22 * s, 0.04 * s); ctx.stroke();
  ctx.restore();
  for (const [x, y, r] of [[0.34, -0.28, 0.05], [0.28, -0.4, 0.03], [-0.38, 0.0, 0.03]]) bubble(ctx, x * s, y * s, r * s);
}

// ------------------------------------------------------------------------------------------------------- health
function hmInhaler(ctx, s, o = {}) {
  const c = o.c1 || '#f2f6f2', cap = o.c2 || '#1b8a3a', em = o.emblem || 'leaf';
  ctx.save(); ctx.rotate(o.tilt ?? -0.12); ctx.scale(0.95, 0.95);
  fillRR(ctx, -0.12 * s, -0.2 * s, 0.24 * s, 0.62 * s, 0.07 * s, null); ctx.fillStyle = cyl(ctx, -0.12 * s, 0.12 * s, c); ctx.fill(); outline(ctx, s);
  ctx.save(); fillRR(ctx, -0.12 * s, -0.2 * s, 0.24 * s, 0.62 * s, 0.07 * s, null); ctx.clip();
  ctx.fillStyle = cyl(ctx, -0.12 * s, 0.12 * s, cap); ctx.fillRect(-0.14 * s, 0.3 * s, 0.28 * s, 0.14 * s); ctx.fillRect(-0.14 * s, -0.06 * s, 0.28 * s, 0.03 * s); ctx.fillRect(-0.14 * s, 0.24 * s, 0.28 * s, 0.03 * s);
  ctx.restore();
  fillRR(ctx, -0.095 * s, -0.42 * s, 0.19 * s, 0.24 * s, 0.05 * s, null); ctx.fillStyle = cyl(ctx, -0.095 * s, 0.095 * s, cap); ctx.fill(); outline(ctx, s);
  ellipse(ctx, 0, -0.41 * s, 0.05 * s, 0.022 * s, '#0e2a16', OUT, s * 0.012);
  fillRR(ctx, -0.11 * s, -0.24 * s, 0.22 * s, 0.05 * s, 0.02 * s, lighten(cap, 0.3), OUT, s * 0.02);
  ctx.save(); ctx.translate(0, 0.09 * s);
  if (em === 'leaf') { leaf(ctx, -0.05 * s, 0.06 * s, 0.14 * s, 0.05 * s, -1.0, cap); leaf(ctx, -0.05 * s, 0.06 * s, 0.13 * s, 0.045 * s, -2.1, darken(cap, 0.12)); }
  else if (em === 'cross') { ctx.fillStyle = cap; ctx.fillRect(-0.02 * s, -0.09 * s, 0.04 * s, 0.18 * s); ctx.fillRect(-0.09 * s, -0.02 * s, 0.18 * s, 0.04 * s); }
  else if (em === 'wave') { ctx.strokeStyle = cap; ctx.lineWidth = s * 0.022; ctx.lineCap = 'round'; for (const y of [-0.05, 0.02, 0.09]) { ctx.beginPath(); ctx.moveTo(-0.08 * s, y * s); ctx.quadraticCurveTo(-0.04 * s, (y - 0.03) * s, 0, y * s); ctx.quadraticCurveTo(0.04 * s, (y + 0.03) * s, 0.08 * s, y * s); ctx.stroke(); } }
  else { circle(ctx, 0, 0, 0.07 * s, cap); circle(ctx, 0, 0, 0.035 * s, lighten(cap, 0.55)); }
  ctx.restore();
  glint(ctx, -0.075 * s, 0.05 * s, 0.012 * s, 0.14 * s, 0.03, 0.55);
  ctx.restore();
  for (const [x, y, r] of [[0.32, -0.3, 0.08], [-0.3, -0.16, 0.055], [0.3, 0.16, 0.05]]) sparkle(ctx, x * s, y * s, r * s, '#ffffff');
}
function hmBlister(ctx, s, o = {}) {
  const pillC = o.c1 || '#ffffff', foil = '#cfd6dc';
  ctx.save(); ctx.rotate(-0.22);
  fillRR(ctx, -0.42 * s, -0.22 * s, 0.84 * s, 0.44 * s, 0.05 * s, null); ctx.fillStyle = linGrad(ctx, -0.4 * s, -0.2 * s, 0.4 * s, 0.2 * s, [[0, '#f4f7f9'], [0.5, foil], [1, '#9aa3ab']]); ctx.fill(); outline(ctx, s);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) {
    const x = (-0.31 + i * 0.155) * s, y = (-0.1 + r * 0.2) * s;
    circle(ctx, x, y, 0.062 * s, 'rgba(255,255,255,.55)', '#7b858e', s * 0.014);
    ellipse(ctx, x, y, 0.045 * s, 0.045 * s, i === 4 && r === 1 ? 'rgba(120,130,140,.35)' : pillC, i === 4 && r === 1 ? null : darken(pillC, 0.35), s * 0.012);
    if (!(i === 4 && r === 1)) glint(ctx, x - 0.015 * s, y - 0.017 * s, 0.014 * s, 0.008 * s, -0.6, 0.85);
  }
  ctx.restore();
  sparkle(ctx, 0.36 * s, -0.32 * s, 0.08 * s, '#fff'); sparkle(ctx, -0.36 * s, 0.32 * s, 0.05 * s, '#fff');
}
function hmPatch(ctx, s, o = {}) {
  const c = o.c1 || '#1e9d55';
  ctx.save(); ctx.rotate(-0.16);
  fillRR(ctx, -0.36 * s, -0.16 * s, 0.72 * s, 0.4 * s, 0.05 * s, '#ffffff', '#b9c3cc', s * 0.018);
  fillRR(ctx, -0.42 * s, -0.24 * s, 0.72 * s, 0.4 * s, 0.05 * s, '#f6e7cc', OUT, s * 0.026);
  fillRR(ctx, -0.36 * s, -0.19 * s, 0.6 * s, 0.3 * s, 0.03 * s, lighten(c, 0.62));
  ctx.strokeStyle = lighten(c, 0.2); ctx.lineWidth = s * 0.012; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo((-0.06 + i * 0.05) * s, -0.19 * s); ctx.lineTo((-0.06 + i * 0.05 + 0.08) * s, 0.11 * s); ctx.stroke(); }
  ctx.save(); fillRR(ctx, -0.36 * s, -0.19 * s, 0.6 * s, 0.3 * s, 0.03 * s, null); ctx.clip(); ctx.fillStyle = c; ctx.fillRect(-0.4 * s, -0.19 * s, 0.7 * s, 0.05 * s); ctx.fillRect(-0.4 * s, 0.06 * s, 0.7 * s, 0.05 * s); ctx.restore();
  ctx.restore();
  for (const [x, y, r] of [[0.34, -0.3, 0.06], [0.4, -0.16, 0.035]]) drop(ctx, x * s, y * s, r * s, 'rgba(255,255,255,.9)', c, s * 0.012);
  sparkle(ctx, -0.36 * s, 0.34 * s, 0.07 * s, '#fff');
}
function hmOrs(ctx, s, o = {}) {
  const c = o.c1 || '#ff8a1a';
  ctx.save(); ctx.translate(0, 0.07 * s); ctx.scale(0.84, 0.84);
  drawIllus(ctx, 'orange', 0.22 * s, 0.2 * s, 0.5 * s, { c1: '#ffa733' });
  ctx.save(); ctx.translate(-0.08 * s, -0.02 * s); ctx.rotate(-0.16);
  ctx.beginPath(); ctx.moveTo(-0.2 * s, -0.36 * s); for (let i = 0; i < 8; i++) ctx.lineTo((-0.2 + (i + 0.5) * 0.05) * s, (-0.36 + (i % 2 ? 0 : 0.03)) * s); ctx.lineTo(0.2 * s, -0.36 * s); ctx.lineTo(0.2 * s, 0.36 * s);
  for (let i = 7; i >= 0; i--) ctx.lineTo((-0.2 + (i + 0.5) * 0.05) * s, (0.36 + (i % 2 ? 0 : -0.03)) * s); ctx.lineTo(-0.2 * s, 0.36 * s); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, -0.2 * s, 0, 0.2 * s, 0, [[0, '#e9edf0'], [0.35, '#ffffff'], [1, '#c9d0d6']]); ctx.fill(); outline(ctx, s);
  ctx.fillStyle = c; ctx.fillRect(-0.2 * s, -0.16 * s, 0.4 * s, 0.32 * s);
  fitText(ctx, 'ORS', -0.19 * s, -0.14 * s, 0.38 * s, 0.16 * s, { family: 'kanit', weight: 900, size: 0.16 * s, color: '#ffffff' });
  drop(ctx, 0, 0.09 * s, 0.05 * s, '#ffffff'); fillRR(ctx, -0.17 * s, -0.31 * s, 0.34 * s, 0.1 * s, 0.02 * s, '#1e9d55'); fillRR(ctx, -0.17 * s, 0.22 * s, 0.34 * s, 0.09 * s, 0.02 * s, '#1e9d55');
  ctx.restore(); ctx.restore();
  drop(ctx, 0.36 * s, -0.16 * s, 0.07 * s, 'rgba(120,225,255,.9)', '#1b8db0', s * 0.016); drop(ctx, -0.36 * s, 0.34 * s, 0.045 * s, 'rgba(120,225,255,.9)', '#1b8db0', s * 0.014);
}
function plaster(ctx, s, c) {
  fillRR(ctx, -0.42 * s, -0.075 * s, 0.84 * s, 0.15 * s, 0.07 * s, c, darken(c, 0.4), s * 0.022);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((-0.36 + i * 0.038) * s, 0, 0.01 * s, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc((0.2 + i * 0.038) * s, 0, 0.01 * s, 0, TAU); ctx.fill(); }
  fillRR(ctx, -0.14 * s, -0.075 * s, 0.28 * s, 0.15 * s, 0, '#ffffff', darken(c, 0.4), s * 0.014);
  fillRR(ctx, -0.09 * s, -0.05 * s, 0.18 * s, 0.1 * s, 0.01 * s, '#dfe6ea');
}
function hmPlaster(ctx, s, o = {}) {
  const c = o.c1 || '#f0c69a';
  ctx.save(); ctx.translate(0, 0.02 * s); ctx.rotate(-0.55); plaster(ctx, s, c); ctx.restore();
  ctx.save(); ctx.translate(0, -0.02 * s); ctx.rotate(0.5); plaster(ctx, s, lighten(c, 0.1)); ctx.restore();
  if (o.cross !== false) { fillRR(ctx, 0.26 * s, -0.4 * s, 0.09 * s, 0.26 * s, 0.02 * s, '#e8261c'); fillRR(ctx, 0.175 * s, -0.315 * s, 0.26 * s, 0.09 * s, 0.02 * s, '#e8261c'); }
  sparkle(ctx, -0.34 * s, -0.3 * s, 0.07 * s, '#fff'); sparkle(ctx, -0.36 * s, 0.32 * s, 0.05 * s, '#fff');
}
function hmMask(ctx, s, o = {}) {
  const c = o.c1 || '#7fc8ef';
  ctx.strokeStyle = 'rgba(240,245,250,.95)'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 0.36 * s, -0.11 * s); ctx.bezierCurveTo(sx * 0.6 * s, -0.16 * s, sx * 0.6 * s, 0.26 * s, sx * 0.34 * s, 0.14 * s); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-0.38 * s, -0.12 * s); ctx.quadraticCurveTo(0, -0.24 * s, 0.38 * s, -0.12 * s); ctx.lineTo(0.35 * s, 0.14 * s); ctx.quadraticCurveTo(0, 0.32 * s, -0.35 * s, 0.14 * s); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, -0.22 * s, 0.3 * s, c, 0.3, 0.1); ctx.fill(); outline(ctx, s, darken(c, 0.55), 0.028);
  ctx.strokeStyle = darken(c, 0.25); ctx.lineWidth = s * 0.014;
  for (const y of [-0.03, 0.05, 0.13]) { ctx.beginPath(); ctx.moveTo(-0.36 * s, y * s); ctx.quadraticCurveTo(0, (y + 0.08) * s, 0.36 * s, y * s); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = s * 0.018; ctx.beginPath(); ctx.moveTo(-0.2 * s, -0.175 * s); ctx.quadraticCurveTo(0, -0.21 * s, 0.2 * s, -0.175 * s); ctx.stroke();
  sparkle(ctx, 0.36 * s, -0.32 * s, 0.08 * s, '#fff'); sparkle(ctx, -0.34 * s, 0.32 * s, 0.06 * s, '#fff');
}
function hmLozenge(ctx, s, o = {}) {
  const c = o.c1 || '#f2b31a';
  drawIllus(ctx, 'lemon', -0.2 * s, -0.2 * s, 0.42 * s, { c1: '#ffe13a' });
  for (const [x, y, r] of [[0.14, 0.02, 0.2], [-0.16, 0.2, 0.17], [0.26, 0.3, 0.13]]) {
    circle(ctx, x * s, y * s, r * s, c, darken(c, 0.5), s * 0.026); circle(ctx, x * s, y * s, r * 0.72 * s, lighten(c, 0.22));
    ctx.strokeStyle = darken(c, 0.2); ctx.lineWidth = s * 0.014; ctx.beginPath(); ctx.arc(x * s, y * s, r * 0.5 * s, 0.4, 4.6); ctx.stroke();
    glint(ctx, (x - r * 0.35) * s, (y - r * 0.4) * s, r * 0.2 * s, r * 0.1 * s, -0.7, 0.75);
  }
  drop(ctx, 0.34 * s, -0.24 * s, 0.07 * s, '#ffb400', '#a06a08', s * 0.016); sparkle(ctx, -0.36 * s, 0.34 * s, 0.06 * s, '#fff');
}
function hmOil(ctx, s, o = {}) {
  const oil = o.c1 || '#c98a2e', cap = o.c2 || '#1b8a3a';
  ctx.beginPath(); ctx.moveTo(-0.17 * s, 0.4 * s); ctx.lineTo(-0.17 * s, -0.02 * s); ctx.bezierCurveTo(-0.17 * s, -0.14 * s, -0.07 * s, -0.14 * s, -0.07 * s, -0.22 * s); ctx.lineTo(0.07 * s, -0.22 * s); ctx.bezierCurveTo(0.07 * s, -0.14 * s, 0.17 * s, -0.14 * s, 0.17 * s, -0.02 * s); ctx.lineTo(0.17 * s, 0.4 * s); ctx.quadraticCurveTo(0, 0.44 * s, -0.17 * s, 0.4 * s); ctx.closePath();
  ctx.fillStyle = cyl(ctx, -0.17 * s, 0.17 * s, oil); ctx.fill(); outline(ctx, s);
  fillRR(ctx, -0.17 * s, 0.04 * s, 0.34 * s, 0.26 * s, 0.0, '#f6ecd0', '#1b6a3a', s * 0.02);
  fitText(ctx, o.txt || 'OIL', -0.15 * s, 0.06 * s, 0.3 * s, 0.13 * s, { family: 'chonburi', weight: 400, size: 0.13 * s, color: '#1b6a3a' });
  ctx.fillStyle = '#1b6a3a'; ctx.fillRect(-0.15 * s, 0.21 * s, 0.3 * s, 0.03 * s);
  fillRR(ctx, -0.085 * s, -0.36 * s, 0.17 * s, 0.15 * s, 0.03 * s, cap, OUT, s * 0.026);
  ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = s * 0.01; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 0.02 * s, -0.35 * s); ctx.lineTo(i * 0.02 * s, -0.22 * s); ctx.stroke(); }
  glint(ctx, -0.11 * s, 0.0, 0.012 * s, 0.09 * s, 0.03, 0.55);
  drop(ctx, 0.34 * s, 0.05 * s, 0.07 * s, oil, darken(oil, 0.45), s * 0.016); sparkle(ctx, -0.34 * s, -0.24 * s, 0.07 * s, '#fff');
}
function hmBagua(ctx, s, o = {}) { // eight trigrams around a yin-yang: the "Eight Immortals" (โป๊ยเซียน) motif
  const c = o.c1 || '#b3141b', gold = o.c2 || '#ffd54a';
  circle(ctx, 0, 0, 0.46 * s, c, darken(c, 0.5), s * 0.026);
  ctx.save(); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8 + TAU / 16; const px = Math.cos(a) * 0.44 * s, py = Math.sin(a) * 0.44 * s; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.fillStyle = gold; ctx.fill(); outline(ctx, s, darken(gold, 0.55), 0.024); ctx.restore();
  for (let i = 0; i < 8; i++) {
    ctx.save(); ctx.rotate((i * TAU) / 8);
    for (let k = 0; k < 3; k++) {
      const y = -(0.3 + k * 0.045) * s, broken = (i + k * 3) % 2 === 0;
      ctx.fillStyle = darken(c, 0.35);
      if (broken) { ctx.fillRect(-0.085 * s, y, 0.07 * s, 0.026 * s); ctx.fillRect(0.015 * s, y, 0.07 * s, 0.026 * s); } else ctx.fillRect(-0.085 * s, y, 0.17 * s, 0.026 * s);
    }
    ctx.restore();
  }
  circle(ctx, 0, 0, 0.19 * s, '#ffffff', darken(c, 0.4), s * 0.02);
  ctx.beginPath(); ctx.arc(0, 0, 0.19 * s, -Math.PI / 2, Math.PI / 2, false); ctx.arc(0, 0.095 * s, 0.095 * s, Math.PI / 2, -Math.PI / 2, true); ctx.arc(0, -0.095 * s, 0.095 * s, Math.PI / 2, -Math.PI / 2, false); ctx.closePath(); ctx.fillStyle = darken(c, 0.55); ctx.fill();
  circle(ctx, 0, 0.095 * s, 0.03 * s, '#ffffff'); circle(ctx, 0, -0.095 * s, 0.03 * s, darken(c, 0.55));
  sparkle(ctx, 0.4 * s, -0.4 * s, 0.07 * s, '#fff');
}
// -------------------------------------------------------------------------------------------------------- misc
function hmCell(ctx, s, o = {}) {
  const c = o.c1 || '#1b3f9a', band = o.c2 || '#ffd400', n = o.n || 3, lab = o.txt || 'AA';
  const small = lab === 'AAA', w = (small ? 0.15 : 0.19) * s, h = (small ? 0.58 : 0.66) * s;
  const angles = n === 2 ? [-0.14, 0.14] : n === 4 ? [-0.3, -0.1, 0.1, 0.3] : [-0.22, 0, 0.22];
  angles.forEach((a, i) => {
    ctx.save(); ctx.translate((i - (angles.length - 1) / 2) * w * 1.05, 0.02 * s); ctx.rotate(a);
    fillRR(ctx, -w / 2, -h / 2, w, h, w * 0.18, null); ctx.fillStyle = cyl(ctx, -w / 2, w / 2, c); ctx.fill(); outline(ctx, s, OUT, 0.022);
    ctx.save(); fillRR(ctx, -w / 2, -h / 2, w, h, w * 0.18, null); ctx.clip();
    ctx.fillStyle = cyl(ctx, -w / 2, w / 2, band); ctx.fillRect(-w / 2, -h * 0.34, w, h * 0.09); ctx.fillRect(-w / 2, h * 0.2, w, h * 0.06);
    ctx.fillStyle = cyl(ctx, -w / 2, w / 2, '#c9cfd4'); ctx.fillRect(-w / 2, h * 0.36, w, h * 0.14);
    ctx.restore();
    fillRR(ctx, -w * 0.22, -h / 2 - s * 0.035, w * 0.44, s * 0.045, s * 0.01, '#d5dade', OUT, s * 0.014);
    ctx.restore();
  });
  circle(ctx, 0.26 * s, 0.26 * s, 0.15 * s, band, OUT, s * 0.024);
  fitText(ctx, lab, 0.26 * s - 0.12 * s, 0.26 * s - 0.07 * s, 0.24 * s, 0.14 * s, { family: 'archivo', weight: 400, size: 0.14 * s, color: '#111' });
  sparkle(ctx, -0.36 * s, -0.3 * s, 0.08 * s, '#fff');
}
function hmCable(ctx, s, o = {}) {
  const c = o.c1 || '#f2f4f7';
  const path = () => { ctx.beginPath(); ctx.moveTo(-0.2 * s, -0.3 * s); ctx.bezierCurveTo(0.2 * s, -0.42 * s, 0.5 * s, -0.2 * s, 0.36 * s, 0.0); ctx.bezierCurveTo(0.24 * s, 0.16 * s, -0.1 * s, 0.02 * s, -0.32 * s, 0.1 * s); ctx.bezierCurveTo(-0.5 * s, 0.18 * s, -0.4 * s, 0.38 * s, -0.1 * s, 0.34 * s); ctx.lineTo(0.14 * s, 0.3 * s); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  path(); ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.075; ctx.stroke(); path(); ctx.strokeStyle = c; ctx.lineWidth = s * 0.05; ctx.stroke();
  path(); ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = s * 0.012; ctx.setLineDash([s * 0.02, s * 0.03]); ctx.stroke(); ctx.setLineDash([]);
  // USB-A plug (top-left)
  fillRR(ctx, -0.34 * s, -0.36 * s, 0.13 * s, 0.11 * s, 0.015 * s, '#2a2a2a', OUT, s * 0.02); fillRR(ctx, -0.5 * s, -0.355 * s, 0.17 * s, 0.1 * s, 0.01 * s, linGrad(ctx, 0, -0.36 * s, 0, -0.25 * s, [[0, '#f0f3f5'], [1, '#98a2ab']]), OUT, s * 0.02);
  fillRR(ctx, -0.47 * s, -0.33 * s, 0.11 * s, 0.05 * s, 0, '#39434b');
  // Type-C plug (bottom-right)
  fillRR(ctx, 0.12 * s, 0.245 * s, 0.14 * s, 0.11 * s, 0.03 * s, '#2a2a2a', OUT, s * 0.02); fillRR(ctx, 0.25 * s, 0.26 * s, 0.17 * s, 0.08 * s, 0.04 * s, linGrad(ctx, 0, 0.26 * s, 0, 0.34 * s, [[0, '#f0f3f5'], [1, '#98a2ab']]), OUT, s * 0.02);
  fillRR(ctx, 0.29 * s, 0.285 * s, 0.11 * s, 0.03 * s, 0.015 * s, '#39434b');
  sparkle(ctx, 0.36 * s, -0.34 * s, 0.08 * s, '#fff');
}
function hmEar(ctx, s, o = {}) {
  const c = o.c1 || '#ffffff';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const wire = () => { ctx.beginPath(); ctx.moveTo(-0.2 * s, -0.2 * s); ctx.bezierCurveTo(-0.26 * s, -0.04 * s, -0.02 * s, -0.06 * s, 0, 0.08 * s); ctx.moveTo(0.2 * s, -0.2 * s); ctx.bezierCurveTo(0.26 * s, -0.04 * s, 0.02 * s, -0.06 * s, 0, 0.08 * s); ctx.moveTo(0, 0.08 * s); ctx.bezierCurveTo(0.03 * s, 0.22 * s, -0.12 * s, 0.24 * s, 0, 0.34 * s); };
  wire(); ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.05; ctx.stroke(); wire(); ctx.strokeStyle = c === '#ffffff' ? '#e9edf1' : c; ctx.lineWidth = s * 0.03; ctx.stroke();
  fillRR(ctx, -0.025 * s, 0.33 * s, 0.05 * s, 0.05 * s, 0.01 * s, '#39434b', OUT, s * 0.014); fillRR(ctx, -0.03 * s, 0.37 * s, 0.06 * s, 0.05 * s, 0.01 * s, linGrad(ctx, -0.03 * s, 0, 0.03 * s, 0, [[0, '#dfe4e8'], [1, '#8a949c']]), OUT, s * 0.014);
  fillRR(ctx, 0.01 * s, -0.07 * s, 0.05 * s, 0.1 * s, 0.02 * s, '#2a2a2a', OUT, s * 0.012);
  for (const sx of [-1, 1]) {
    ctx.save(); ctx.translate(sx * 0.2 * s, -0.3 * s); ctx.rotate(sx * 0.25);
    fillRR(ctx, -0.028 * s, 0.03 * s, 0.056 * s, 0.13 * s, 0.026 * s, c, OUT, s * 0.02);
    ellipse(ctx, 0, 0, 0.1 * s, 0.085 * s, c, OUT, s * 0.026); ellipse(ctx, 0, 0, 0.06 * s, 0.05 * s, '#3a4650'); ellipse(ctx, 0, 0, 0.06 * s, 0.05 * s, null, '#9aa8b4', s * 0.01);
    glint(ctx, -0.04 * s, -0.045 * s, 0.03 * s, 0.014 * s, -0.5, 0.7);
    ctx.restore();
  }
  sparkle(ctx, 0.36 * s, 0.1 * s, 0.07 * s, '#fff');
}
function hmPower(ctx, s, o = {}) {
  const c = o.c1 || '#26323d', acc = o.c2 || '#41d67a';
  ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-0.05 * s, -0.44 * s); ctx.bezierCurveTo(-0.02 * s, -0.52 * s, 0.3 * s, -0.52 * s, 0.34 * s, -0.36 * s); ctx.stroke(); ctx.strokeStyle = '#f2f4f7'; ctx.lineWidth = s * 0.038; ctx.stroke();
  ctx.save(); ctx.rotate(-0.16);
  fillRR(ctx, -0.24 * s, -0.4 * s, 0.48 * s, 0.8 * s, 0.07 * s, null); ctx.fillStyle = linGrad(ctx, -0.24 * s, 0, 0.24 * s, 0, [[0, lighten(c, 0.12)], [0.4, c], [1, darken(c, 0.25)]]); ctx.fill(); outline(ctx, s);
  fillRR(ctx, -0.13 * s, -0.42 * s, 0.12 * s, 0.045 * s, 0.01 * s, '#111', OUT, s * 0.012); fillRR(ctx, 0.03 * s, -0.42 * s, 0.09 * s, 0.045 * s, 0.01 * s, '#111', OUT, s * 0.012);
  for (let i = 0; i < 4; i++) circle(ctx, (-0.15 + i * 0.1) * s, -0.3 * s, 0.026 * s, i < 3 ? acc : '#3b4650', darken(c, 0.4), s * 0.008);
  poly(ctx, [[0.03, -0.22], [-0.11, 0.04], [-0.01, 0.04], [-0.05, 0.24], [0.11, -0.05], [0.01, -0.05]].map(([x, y]) => [x * s, (y - 0.02) * s]), acc, darken(acc, 0.5), s * 0.014);
  fitText(ctx, o.txt || '10000 mAh', -0.2 * s, 0.27 * s, 0.4 * s, 0.09 * s, { family: 'kanit', weight: 700, size: 0.09 * s, color: '#e8eef2' });
  glint(ctx, -0.17 * s, -0.1 * s, 0.012 * s, 0.26 * s, 0.02, 0.28);
  ctx.restore();
  sparkle(ctx, 0.38 * s, 0.24 * s, 0.08 * s, '#fff');
}
function hmSim(ctx, s, o = {}) {
  const c = o.c1 || '#7ab800', c2 = o.c2 || darken(c, 0.3);
  ctx.save(); ctx.rotate(-0.1);
  fillRR(ctx, -0.42 * s, -0.27 * s, 0.84 * s, 0.54 * s, 0.05 * s, null); ctx.fillStyle = linGrad(ctx, -0.4 * s, -0.27 * s, 0.4 * s, 0.27 * s, [[0, lighten(c, 0.25)], [1, darken(c, 0.15)]]); ctx.fill(); outline(ctx, s);
  ctx.beginPath(); ctx.moveTo(-0.34 * s, -0.2 * s); ctx.lineTo(0.02 * s, -0.2 * s); ctx.lineTo(0.1 * s, -0.12 * s); ctx.lineTo(0.1 * s, 0.16 * s); ctx.lineTo(-0.34 * s, 0.16 * s); ctx.closePath(); ctx.fillStyle = c2; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = s * 0.012; ctx.setLineDash([s * 0.025, s * 0.02]); ctx.stroke(); ctx.setLineDash([]);
  fillRR(ctx, -0.27 * s, -0.12 * s, 0.28 * s, 0.2 * s, 0.03 * s, linGrad(ctx, -0.27 * s, -0.12 * s, 0.01 * s, 0.08 * s, [[0, '#fff1a8'], [0.5, '#e6b93a'], [1, '#b98a1a']]), '#7a5a10', s * 0.012);
  ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = s * 0.01; ctx.beginPath(); ctx.moveTo(-0.27 * s, -0.02 * s); ctx.lineTo(0.01 * s, -0.02 * s); ctx.moveTo(-0.13 * s, -0.12 * s); ctx.lineTo(-0.13 * s, 0.08 * s); ctx.stroke();
  for (let i = 0; i < 4; i++) fillRR(ctx, (0.2 + i * 0.045) * s, (0.08 - i * 0.05) * s, 0.03 * s, (0.11 + i * 0.05) * s, 0.008 * s, '#ffffff');
  ctx.restore();
  sparkle(ctx, 0.36 * s, -0.34 * s, 0.07 * s, '#fff');
}
function hmTopup(ctx, s, o = {}) {
  const c = o.c1 || '#7ab800';
  ctx.save(); ctx.rotate(-0.08);
  fillRR(ctx, -0.42 * s, -0.26 * s, 0.84 * s, 0.52 * s, 0.05 * s, null); ctx.fillStyle = linGrad(ctx, -0.4 * s, -0.26 * s, 0.4 * s, 0.26 * s, [[0, lighten(c, 0.3)], [1, darken(c, 0.2)]]); ctx.fill(); ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.14)'; for (let i = -4; i < 6; i++) { ctx.beginPath(); ctx.moveTo((-0.5 + i * 0.16) * s, 0.3 * s); ctx.lineTo((-0.42 + i * 0.16) * s, 0.3 * s); ctx.lineTo((-0.1 + i * 0.16) * s, -0.3 * s); ctx.lineTo((-0.18 + i * 0.16) * s, -0.3 * s); ctx.fill(); }
  ctx.restore(); fillRR(ctx, -0.42 * s, -0.26 * s, 0.84 * s, 0.52 * s, 0.05 * s, null); outline(ctx, s);
  fillRR(ctx, -0.36 * s, -0.19 * s, 0.13 * s, 0.24 * s, 0.02 * s, '#1c2630', '#ffffff', s * 0.012); fillRR(ctx, -0.34 * s, -0.16 * s, 0.09 * s, 0.15 * s, 0.006 * s, lighten(c, 0.5));
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s * 0.018; ctx.lineCap = 'round'; for (const r of [0.06, 0.1, 0.14]) { ctx.beginPath(); ctx.arc(-0.185 * s, -0.16 * s, r * s, -1.3, -0.25); ctx.stroke(); }
  fitText(ctx, o.txt || '฿100', -0.14 * s, -0.16 * s, 0.52 * s, 0.3 * s, { family: 'kanit', weight: 900, size: 0.3 * s, color: '#ffffff', stroke: darken(c, 0.5), strokeW: 0.03 * s });
  fitText(ctx, o.sub || 'TOP UP', -0.36 * s, 0.13 * s, 0.72 * s, 0.09 * s, { family: 'kanit', weight: 700, size: 0.09 * s, color: '#ffffff', align: 'left' });
  ctx.restore();
}
function hmBrolly(ctx, s, o = {}) {
  const c = o.c1 || '#e8261c', c2 = o.c2 || '#ffffff', N = 6;
  const R = 0.46 * s, yb = 0.08 * s;
  ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.045; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -0.36 * s); ctx.lineTo(0, 0.34 * s); ctx.arc(0.06 * s, 0.34 * s, 0.06 * s, Math.PI, 0.5, true); ctx.stroke();
  ctx.strokeStyle = '#8a8f96'; ctx.lineWidth = s * 0.024; ctx.beginPath(); ctx.moveTo(0, -0.36 * s); ctx.lineTo(0, 0.34 * s); ctx.arc(0.06 * s, 0.34 * s, 0.06 * s, Math.PI, 0.5, true); ctx.stroke();
  const dome = () => { ctx.beginPath(); ctx.moveTo(-R, yb); ctx.bezierCurveTo(-R, -0.38 * s, -0.24 * s, -0.42 * s, 0, -0.42 * s); ctx.bezierCurveTo(0.24 * s, -0.42 * s, R, -0.38 * s, R, yb); for (let i = N - 1; i >= 0; i--) { const x0 = -R + (i + 1) * (2 * R / N), x1 = -R + i * (2 * R / N); ctx.quadraticCurveTo((x0 + x1) / 2, yb - 0.09 * s, x1, yb); } ctx.closePath(); };
  dome(); ctx.fillStyle = c; ctx.fill();
  ctx.save(); dome(); ctx.clip();
  for (let i = 0; i < N; i += 2) { const x0 = -R + i * (2 * R / N), x1 = -R + (i + 1) * (2 * R / N); ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(0, -0.44 * s); ctx.lineTo(x0 * 1.2, yb + 0.02 * s); ctx.lineTo(x1 * 1.2, yb + 0.02 * s); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = s * 0.014; for (let i = 0; i <= N; i++) { ctx.beginPath(); ctx.moveTo(0, -0.42 * s); ctx.lineTo((-R + i * (2 * R / N)), yb); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(-0.18 * s, -0.22 * s, 0.09 * s, 0.03 * s, -0.9, 0, TAU); ctx.fill();
  ctx.restore(); dome(); outline(ctx, s);
  circle(ctx, 0, -0.43 * s, 0.02 * s, '#c5ccd3', OUT, s * 0.012);
  for (const [x, y] of [[0.4, -0.3], [-0.42, -0.22], [0.34, 0.24], [-0.34, 0.3]]) drop(ctx, x * s, y * s, 0.035 * s, '#7fd0ff', '#1b6ea0', s * 0.01);
}
function hmFan(ctx, s, o = {}) {
  const c = o.c1 || '#ff7ab0';
  fillRR(ctx, -0.055 * s, 0.16 * s, 0.11 * s, 0.28 * s, 0.04 * s, null); ctx.fillStyle = cyl(ctx, -0.055 * s, 0.055 * s, c); ctx.fill(); outline(ctx, s); circle(ctx, 0, 0.27 * s, 0.018 * s, '#ffffff', OUT, s * 0.01);
  circle(ctx, 0, -0.1 * s, 0.31 * s, c, OUT, s * 0.028); circle(ctx, 0, -0.1 * s, 0.26 * s, '#f6f8fb', '#9aa6b2', s * 0.012);
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(0, -0.1 * s); ctx.rotate((i * TAU) / 5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(0.14 * s, -0.04 * s, 0.2 * s, -0.16 * s, 0.05 * s, -0.24 * s); ctx.bezierCurveTo(-0.02 * s, -0.16 * s, -0.04 * s, -0.08 * s, 0, 0); ctx.fillStyle = i % 2 ? lighten(c, 0.55) : lighten(c, 0.35); ctx.fill(); ctx.strokeStyle = darken(c, 0.4); ctx.lineWidth = s * 0.012; ctx.stroke(); ctx.restore(); }
  circle(ctx, 0, -0.1 * s, 0.05 * s, '#ffffff', OUT, s * 0.018); circle(ctx, 0, -0.1 * s, 0.018 * s, c);
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = s * 0.02; ctx.lineCap = 'round'; for (const [y, l] of [[-0.3, 0.1], [-0.16, 0.13], [-0.02, 0.1]]) { ctx.beginPath(); ctx.moveTo(-0.36 * s, y * s); ctx.bezierCurveTo((-0.4 - l) * s, (y - 0.04) * s, (-0.4 - l) * s, (y + 0.04) * s, (-0.44 - l) * s, y * s); ctx.stroke(); }
}
function hmPens(ctx, s, o = {}) {
  const cols = o.cols || ['#1e6fd5', '#e8261c', '#222222'];
  cols.forEach((c, i) => {
    ctx.save(); ctx.translate(0, 0.32 * s); ctx.rotate((i - 1) * 0.36);
    fillRR(ctx, -0.045 * s, -0.66 * s, 0.09 * s, 0.68 * s, 0.03 * s, null); ctx.fillStyle = cyl(ctx, -0.045 * s, 0.045 * s, c); ctx.fill(); outline(ctx, s, OUT, 0.022);
    ctx.beginPath(); ctx.moveTo(-0.045 * s, -0.66 * s); ctx.lineTo(0, -0.78 * s); ctx.lineTo(0.045 * s, -0.66 * s); ctx.closePath(); fillOut(ctx, '#dfe4e8', s, OUT, 0.02);
    poly(ctx, [[-0.012 * s, -0.75 * s], [0, -0.79 * s], [0.012 * s, -0.75 * s]], c);
    fillRR(ctx, -0.045 * s, -0.5 * s, 0.09 * s, 0.05 * s, 0.01 * s, darken(c, 0.25)); fillRR(ctx, 0.03 * s, -0.22 * s, 0.018 * s, 0.22 * s, 0.008 * s, '#d5dade', OUT, s * 0.01);
    ctx.restore();
  });
}
function hmNote(ctx, s, o = {}) {
  const c = o.c1 || '#2e7dd8';
  ctx.save(); ctx.rotate(-0.1);
  fillRR(ctx, -0.29 * s, -0.4 * s, 0.6 * s, 0.8 * s, 0.03 * s, '#ffffff', OUT, s * 0.026);
  fillRR(ctx, -0.32 * s, -0.4 * s, 0.6 * s, 0.8 * s, 0.03 * s, null); ctx.fillStyle = vgrad(ctx, -0.4 * s, 0.4 * s, c, 0.15, 0.12); ctx.fill(); outline(ctx, s);
  fillRR(ctx, -0.2 * s, -0.27 * s, 0.4 * s, 0.24 * s, 0.02 * s, '#ffffff', OUT, s * 0.014); ctx.strokeStyle = '#6d8db8'; ctx.lineWidth = s * 0.014; for (const y of [-0.21, -0.14, -0.08]) { ctx.beginPath(); ctx.moveTo(-0.15 * s, y * s); ctx.lineTo((y === -0.08 ? 0.05 : 0.15) * s, y * s); ctx.stroke(); }
  for (let i = 0; i < 8; i++) { const y = (-0.34 + i * 0.09) * s; ctx.strokeStyle = '#c9d0d6'; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(-0.36 * s, y); ctx.lineTo(-0.27 * s, y); ctx.stroke(); ctx.strokeStyle = '#6a737b'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.moveTo(-0.36 * s, y); ctx.lineTo(-0.27 * s, y); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.translate(0.3 * s, 0.24 * s); ctx.rotate(-0.5); fillRR(ctx, -0.24 * s, -0.025 * s, 0.4 * s, 0.05 * s, 0.02 * s, '#ffd400', OUT, s * 0.014); poly(ctx, [[0.16 * s, -0.025 * s], [0.25 * s, 0], [0.16 * s, 0.025 * s]], '#f0d0a0', OUT, s * 0.01); ctx.restore();
}
function hmTape(ctx, s, o = {}) {
  const c = o.c1 || '#8fd6f2';
  ctx.beginPath(); ctx.moveTo(0.16 * s, 0.22 * s); ctx.lineTo(0.44 * s, 0.34 * s); ctx.lineTo(0.4 * s, 0.4 * s); ctx.lineTo(0.1 * s, 0.3 * s); ctx.closePath(); fillOut(ctx, 'rgba(200,238,252,.85)', s, '#5aa8c8', 0.018);
  circle(ctx, 0, 0, 0.36 * s, c, '#3c86a8', s * 0.026); ctx.fillStyle = radGrad(ctx, 0, 0, 0.14 * s, 0.36 * s, [[0, 'rgba(255,255,255,.1)'], [1, 'rgba(255,255,255,.55)']]); ctx.beginPath(); ctx.arc(0, 0, 0.36 * s, 0, TAU); ctx.fill();
  circle(ctx, 0, 0, 0.19 * s, '#ffffff', '#3c86a8', s * 0.022); circle(ctx, 0, 0, 0.13 * s, '#2f7fd8', OUT, s * 0.018); circle(ctx, 0, 0, 0.055 * s, '#e9f2fa', OUT, s * 0.012);
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = s * 0.014; ctx.beginPath(); ctx.arc(0, 0, 0.29 * s, 3.4, 4.5); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 0.24 * s, 3.5, 4.4); ctx.stroke();
  sparkle(ctx, -0.34 * s, -0.32 * s, 0.08 * s, '#fff');
}
function hmPoncho(ctx, s, o = {}) {
  const c = o.c1 || '#ffd21a';
  ctx.beginPath(); ctx.moveTo(-0.13 * s, -0.24 * s); ctx.quadraticCurveTo(-0.14 * s, -0.42 * s, 0, -0.44 * s); ctx.quadraticCurveTo(0.14 * s, -0.42 * s, 0.13 * s, -0.24 * s); ctx.closePath(); fillOut(ctx, darken(c, 0.1), s);
  ctx.beginPath(); ctx.moveTo(-0.14 * s, -0.24 * s); ctx.quadraticCurveTo(-0.2 * s, -0.16 * s, -0.42 * s, 0.2 * s); ctx.quadraticCurveTo(-0.44 * s, 0.34 * s, -0.36 * s, 0.38 * s); for (let i = 0; i < 6; i++) ctx.quadraticCurveTo((-0.36 + (i + 0.5) * 0.12) * s, 0.44 * s, (-0.36 + (i + 1) * 0.12) * s, 0.38 * s); ctx.quadraticCurveTo(0.44 * s, 0.34 * s, 0.42 * s, 0.2 * s); ctx.quadraticCurveTo(0.2 * s, -0.16 * s, 0.14 * s, -0.24 * s); ctx.quadraticCurveTo(0, -0.18 * s, -0.14 * s, -0.24 * s); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, -0.4 * s, -0.2 * s, 0.4 * s, 0.4 * s, [[0, lighten(c, 0.25)], [1, darken(c, 0.12)]]); ctx.fill(); outline(ctx, s);
  ellipse(ctx, 0, -0.27 * s, 0.09 * s, 0.05 * s, '#2a2418', OUT, s * 0.012);
  ctx.strokeStyle = darken(c, 0.4); ctx.lineWidth = s * 0.014; ctx.beginPath(); ctx.moveTo(0, -0.2 * s); ctx.lineTo(0, 0.4 * s); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.moveTo(-0.15 * s, -0.1 * s); ctx.quadraticCurveTo(-0.24 * s, 0.1 * s, -0.3 * s, 0.34 * s); ctx.moveTo(0.15 * s, -0.1 * s); ctx.quadraticCurveTo(0.24 * s, 0.1 * s, 0.3 * s, 0.34 * s); ctx.stroke();
  for (const y of [-0.08, 0.08, 0.24]) circle(ctx, 0, y * s, 0.022 * s, darken(c, 0.3), OUT, s * 0.008);
  for (const [x, y] of [[0.4, -0.3], [-0.4, -0.2], [0.44, 0.06], [-0.44, 0.14]]) drop(ctx, x * s, y * s, 0.04 * s, '#7fd0ff', '#1b6ea0', s * 0.01);
}
function suit(ctx, kind, x, y, r, col) {
  ctx.fillStyle = col;
  if (kind === 'heart') { ctx.beginPath(); ctx.moveTo(x, y + r * 0.95); ctx.bezierCurveTo(x - r * 1.5, y - r * 0.2, x - r * 0.7, y - r * 1.1, x, y - r * 0.35); ctx.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.5, y - r * 0.2, x, y + r * 0.95); ctx.fill(); }
  else if (kind === 'diamond') { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.7, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.7, y); ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(x, y - r * 0.95); ctx.bezierCurveTo(x - r * 1.5, y + r * 0.2, x - r * 0.7, y + r * 1.0, x, y + r * 0.35); ctx.bezierCurveTo(x + r * 0.7, y + r * 1.0, x + r * 1.5, y + r * 0.2, x, y - r * 0.95); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - r * 0.28, y + r * 1.0); ctx.lineTo(x + r * 0.28, y + r * 1.0); ctx.lineTo(x, y + r * 0.3); ctx.closePath(); ctx.fill(); }
}
function hmCards(ctx, s, o = {}) {
  const back = o.c1 || '#c8102e', red = '#d81f26';
  const card = (i, face) => {
    ctx.save(); ctx.translate(0, 0.36 * s); ctx.rotate((i - 1) * 0.38); ctx.translate(0, -0.36 * s);
    fillRR(ctx, -0.21 * s, -0.4 * s, 0.42 * s, 0.6 * s, 0.035 * s, face ? '#ffffff' : back, OUT, s * 0.024);
    if (face) { suit(ctx, 'heart', 0, -0.1 * s, 0.13 * s, red); fitText(ctx, 'A', -0.19 * s, -0.38 * s, 0.1 * s, 0.11 * s, { family: 'archivo', weight: 400, size: 0.11 * s, color: red, align: 'left' }); suit(ctx, 'heart', -0.145 * s, -0.235 * s, 0.03 * s, red); }
    else { fillRR(ctx, -0.17 * s, -0.36 * s, 0.34 * s, 0.52 * s, 0.02 * s, null, '#ffffff', s * 0.012); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = s * 0.01; for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo((-0.17 + k * 0.06) * s, -0.36 * s); ctx.lineTo((0.0 + k * 0.06) * s, 0.16 * s); ctx.stroke(); } }
    ctx.restore();
  };
  card(0, false); card(2, false); card(1, true);
  suit(ctx, 'spade', 0.34 * s, 0.3 * s, 0.07 * s, '#1b1b1b'); sparkle(ctx, -0.36 * s, -0.32 * s, 0.07 * s, '#fff');
}

// registry of the heroes above so SKUs can say `hero: 'hmInhaler'`
export const illus = {
  hmTissueBox, hmTissuePack, hmLaundry, hmBlossom, hmSpray, hmCoil, hmBin, hmSponge, hmWipes, hmGel,
  hmHair, hmBrush, hmPaste, hmRollOn, hmLotion, hmTube, hmFoam, hmSunTube, hmPad, hmBuds, hmSnake,
  hmLighter, hmBagua, hmInhaler, hmBlister, hmPatch, hmOrs, hmPlaster, hmMask, hmLozenge, hmOil,
  hmCell, hmCable, hmEar, hmPower, hmSim, hmTopup, hmBrolly, hmFan, hmPens, hmNote, hmTape, hmPoncho, hmCards,
};


// =====================================================================================================================
//  Brands that are not in src/data/brands.js
// =====================================================================================================================
export const brands = {
  breeze:     { text: 'Breeze', th: 'บรีส', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#0f4aa8' },
  ars:        { text: 'ARS', th: 'อาท', style: 'block', bg: '#e60012', fg: '#ffffff', font: 'anton', ring: '#ffd400' },
  scotchbrite:{ text: 'Scotch-Brite', th: 'สก๊อตช์-ไบรต์', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#c8102e' },
  dettol:     { text: 'Dettol', th: 'เดทตอล', style: 'plain', fg: '#ffffff', font: 'archivo', stroke: '#0b7a3a' },
  nivea:      { text: 'NIVEA', th: 'นีเวีย', style: 'block', bg: '#0a3d91', fg: '#ffffff', font: 'archivo', ring: '#ffffff' },
  vaseline:   { text: 'Vaseline', th: 'วาสลีน', style: 'pill', bg: '#ffffff', fg: '#1156b0', font: 'pacifico', ring: '#1156b0' },
  smoothe:    { text: 'Smooth E', th: 'สมูท อี', style: 'pill', bg: '#ffffff', fg: '#7a3fb0', font: 'lilita', ring: '#7a3fb0' },
  garnier:    { text: 'GARNIER', th: 'การ์นิเย่', style: 'plain', fg: '#ffffff', font: 'archivo', stroke: '#1f7a34' },
  laurier:    { text: 'Laurier', th: 'ลอรีเอะ', style: 'script', fg: '#ffffff', font: 'pacifico', stroke: '#b3125c' },
  babimild:   { text: 'Babi Mild', th: 'เบบี้มายด์', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#d81b78' },
  poysian:    { text: 'Poy-Sian', th: 'โป๊ยเซียน', style: 'stamp', bg: '#ffe9a8', fg: '#b3141b', font: 'chonburi', ring: '#b3141b' },
  decolgen:   { text: 'Decolgen', th: 'ดีคอลเจน', style: 'pill', bg: '#ffffff', fg: '#0a7a52', font: 'lilita', ring: '#0a7a52' },
  gpo:        { text: 'GPO', th: 'องค์การเภสัชกรรม', style: 'circle', bg: '#0b7a3e', fg: '#ffffff', font: 'archivo', ring: '#ffffff' },
  bandaid:    { text: 'BAND-AID', th: 'แบนด์-เอด', style: 'block', bg: '#e8261c', fg: '#ffffff', font: 'archivo', ring: '#ffffff' },
  strepsils:  { text: 'Strepsils', th: 'สเตร็ปซิลส์', style: 'plain', fg: '#c8102e', font: 'lilita', stroke: '#ffffff' },
  quantum:    { text: 'quantum', th: 'ควอนตั้ม', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#1e6fd5' },
  campus:     { text: 'CAMPUS', th: 'แคมปัส', style: 'block', bg: '#1e6fd5', fg: '#ffffff', font: 'archivo', ring: '#ffd400' },
  scotch:     { text: 'Scotch', th: 'สก๊อตช์', style: 'block', bg: '#ffffff', fg: '#c8102e', font: 'archivo', ring: '#c8102e' },
};

// =====================================================================================================================
//  Ingredient keys that are not in src/data/ingredients.js
// =====================================================================================================================
const I = (en, th) => ({ en, th });
export const ingredients = {
  sorbitol: I('Sorbitol', 'ซอร์บิทอล'), sls: I('Sodium lauryl sulfate', 'โซเดียมลอริลซัลเฟต'), sles: I('Sodium laureth sulfate', 'โซเดียมลอเรธซัลเฟต'),
  cocamide: I('Cocamidopropyl betaine', 'โคคามิโดโพรพิลเบทาอีน'), dimethicone: I('Dimethicone', 'ไดเมทิโคน'), cetyl: I('Cetyl alcohol', 'เซทิลแอลกอฮอล์'),
  carbomer: I('Carbomer', 'คาร์โบเมอร์'), las: I('Linear alkylbenzene sulfonate', 'ลิเนียร์แอลคิลเบนซีนซัลโฟเนต'), sodcarb: I('Sodium carbonate', 'โซเดียมคาร์บอเนต'),
  zeolite: I('Zeolite', 'ซีโอไลต์'), softener: I('Fabric softening agent', 'สารปรับผ้านุ่ม'), citronella: I('Citronella oil', 'น้ำมันตะไคร้หอม'),
  deet: I('DEET', 'ดีอีอีที'), allethrin: I('Allethrin', 'อัลเลทริน'), pyrethroid: I('Pyrethroids', 'ไพรีทรอยด์'), propellant: I('Propellant (LPG)', 'ก๊าซขับดัน (LPG)'),
  woodp: I('Wood powder', 'ผงไม้'), butane: I('Butane', 'บิวเทน'), pe: I('Polyethylene', 'พอลิเอทิลีน'), pu: I('Polyurethane foam', 'โฟมโพลียูรีเทน'),
  nylon: I('Nylon fibre', 'เส้นใยไนลอน'), nonwoven: I('Nonwoven fabric', 'ผ้าไม่ทอ'), sap: I('Super absorbent polymer', 'โพลิเมอร์ดูดซับของเหลว'),
  pefilm: I('Polyethylene film', 'ฟิล์มพอลิเอทิลีน'), cajuput: I('Cajuput oil', 'น้ำมันเสม็ดขาว'), clove: I('Clove oil', 'น้ำมันกานพลู'),
  mintoil: I('Peppermint oil', 'น้ำมันเปปเปอร์มินต์'), pineoil: I('Pine needle oil', 'น้ำมันสน'), borneol: I('Borneol', 'พิมเสน'),
  methylsal: I('Methyl salicylate', 'เมทิลซาลิไซเลต'), phenylephrine: I('Phenylephrine HCl', 'ฟีนิลเอฟรีน เอชซีแอล'),
  chlorphen: I('Chlorpheniramine maleate', 'คลอร์เฟนิรามีน มาลีเอต'), mgstearate: I('Magnesium stearate', 'แมกนีเซียมสเตียเรต'),
  kcl: I('Potassium chloride', 'โพแทสเซียมคลอไรด์'), citrate: I('Trisodium citrate', 'ไตรโซเดียมซิเตรต'), dextrose: I('Glucose', 'กลูโคส'),
  adhesive: I('Skin-friendly adhesive', 'กาวติดผิวหนัง'), niacinamide: I('Niacinamide', 'ไนอะซินาไมด์'), glutathione: I('Glutathione', 'กลูตาไธโอน'),
  hyaluronic: I('Hyaluronic acid', 'กรดไฮยาลูโรนิก'), uvfilter: I('UV filters', 'สารกรองรังสียูวี'), paperstick: I('Paper stick', 'ก้านกระดาษ'),
  polyprop: I('Polypropylene', 'พอลิโพรพิลีน'), polyester: I('Polyester', 'โพลีเอสเตอร์'), mno2: I('Manganese dioxide', 'แมงกานีสไดออกไซด์'),
  znm: I('Zinc', 'สังกะสี'), koh: I('Potassium hydroxide', 'โพแทสเซียมไฮดรอกไซด์'), steel: I('Steel', 'เหล็ก'), copper: I('Copper', 'ทองแดง'),
  pvc: I('PVC', 'พีวีซี'), abs: I('ABS plastic', 'พลาสติกเอบีเอส'), liion: I('Lithium-ion cell', 'เซลล์ลิเธียมไอออน'), paper: I('Paper', 'กระดาษ'),
  ink: I('Ink', 'หมึก'), dcba: I('2,4-Dichlorobenzyl alcohol', '2,4-ไดคลอโรเบนซิลแอลกอฮอล์'), amc: I('Amylmetacresol', 'เอมิลเมตาเครซอล'),
  cloth: I('Cotton cloth', 'ผ้าฝ้าย'), gum: I('Rubber adhesive', 'กาวยาง'), chip: I('SIM chip', 'ชิปซิม'), aluminium: I('Aluminium', 'อะลูมิเนียม'),
  bristle: I('Nylon bristles', 'ขนแปรงไนลอน'), latex: I('Latex-free elastic', 'ยางยืดปลอดลาเท็กซ์'),
};

// =====================================================================================================================
//  HOUSEHOLD (ของใช้ในบ้าน)
// =====================================================================================================================
// `warn` (optional, bilingual) is the caution text for the back panel; SKUs without it get a per-category default.
const HOUSEHOLD = [
  // ---- tissue
  { id: 'scott-save-soft-box', cat: 'household', brand: 'scott', name: T('Save Soft Box', 'เซฟ ซอฟท์บ๊อกซ์'), sub: T('Facial tissue', 'กระดาษเช็ดหน้า'),
    price: 35, size: sheets(160), g: 'bag-loaf', pal: ['#1f6fd0', '#0d4a9c', '#ffd400', '#39b6d8'], bg: 'rays',
    hero: 'hmTissuePack', heroOpts: { c1: '#e4f3ff', c2: '#39a0e8' }, pop: 2, ing: ['pulp'],
    desc: T('Soft-pack facial tissue: 160 two-ply sheets of virgin pulp that stay strong when damp. A fixture on Thai desks, sofas and car dashboards.',
      'กระดาษเช็ดหน้าแบบซอฟท์แพ็ก 160 แผ่น หนา 2 ชั้น จากเยื่อกระดาษบริสุทธิ์ นุ่มเหนียว ไม่เปื่อยยุ่ยแม้โดนน้ำ') },
  { id: 'kleenex-white-floral', cat: 'household', brand: 'kleenex', name: T('White Floral', 'ไวท์ฟลอรัล'), sub: T('Facial tissue box', 'กระดาษเช็ดหน้าแบบกล่อง'),
    price: 39, size: sheets(135), g: 'box-tissue', pal: ['#f3f7ff', '#c5d6f2', '#e8508a', '#ffffff'], bg: 'dots',
    hero: 'hmTissueBox', heroOpts: { c1: '#e8508a', c2: '#ffffff' }, promo: T('2 for ฿69', '2 กล่อง 69 บาท'), pop: 2, ing: ['pulp'],
    desc: T('A floral-print box of 135 tissues, the kind Thais keep on the car dashboard and beside the sofa.',
      'กระดาษเช็ดหน้าแบบกล่อง 135 แผ่น ลายดอกไม้ ของประจำบ้านที่คนไทยวางไว้หน้ารถและข้างโซฟา') },
  { id: 'kleenex-oil-control-softpack', cat: 'household', brand: 'kleenex', name: T('Oil Control', 'ออยล์คอนโทรล'), sub: T('Soft pack · facial tissue', 'ซอฟท์แพ็ก · กระดาษเช็ดหน้า'),
    price: 19, size: sheets(45), g: 'bag-flat', pal: ['#2bb8a8', '#137a6e', '#fff36a', '#7fe0d4'], bg: 'waves',
    hero: 'hmTissuePack', heroOpts: { c1: '#bff3ea', c2: '#1aa595' }, isNew: true, ing: ['pulp'],
    desc: T('A slim 45-sheet soft pack for blotting a shiny face in the Bangkok heat; small enough for a pocket or handbag.',
      'ซอฟท์แพ็กเล็ก 45 แผ่น ใช้ซับหน้ามันในอากาศร้อนของกรุงเทพฯ พกใส่กระเป๋าได้สบาย') },
  // ---- kitchen & laundry
  { id: 'sunlight-lemon-turbo', cat: 'household', brand: 'sunlight', name: T('Lemon Turbo', 'เลมอน เทอร์โบ'), sub: T('Dishwashing liquid', 'ผลิตภัณฑ์ล้างจาน'),
    price: 45, size: ml(485), g: 'bottle-oil', style: 'pet', pal: ['#56b82c', '#ffe14a', '#2e9b3e', '#56b82c'], body: '#56b82c', capColor: '#ffe14a', bg: 'rays',
    hero: 'lime', heroOpts: { c1: '#8fd43a' }, promo: T('Save ฿10', 'ลด 10 บาท'), pop: 3, ing: ['water', 'surfactant', 'sles', 'cocamide', 'lime', 'salt', 'perfume', 'preserv', 'colour'],
    desc: T('Dishwashing liquid made with lime juice, a Thai kitchen staple for cutting the grease and fishy smells left by curries and fried fish.',
      'น้ำยาล้างจานสูตรน้ำมะนาว ช่วยขจัดคราบมันและกลิ่นคาวจากแกงและปลาทอด ล้างออกง่าย เป็นของคู่ครัวคนไทย') },
  { id: 'scotchbrite-dish-sponge', cat: 'household', brand: 'scotchbrite', name: T('Dish Sponge', 'ฟองน้ำล้างจาน'), sub: T('2 pcs · with scourer', '2 ชิ้น · พร้อมใยขัด'),
    price: 29, size: pcs(2), g: 'bag-flat', pal: ['#ffd83a', '#e0a800', '#2fae5a', '#ffffff'], bg: 'dots',
    hero: 'hmSponge', ing: ['pu', 'nylon'],
    desc: T('Two-sided sponges: soft foam for plates, green scourer for burnt-on rice at the bottom of the pot.', 'ฟองน้ำล้างจานสองด้าน ด้านนุ่มล้างจาน ด้านใยขัดสีเขียวขัดคราบข้าวไหม้ก้นหม้อ') },
  { id: 'garbage-bags-black', cat: 'household', brand: 'sevenselect', name: T('Black Garbage Bags', 'ถุงขยะสีดำ'), sub: T('Strong · 18×20 in', 'เหนียว · 18×20 นิ้ว'),
    price: 29, size: { en: '30 bags', th: '30 ใบ' }, g: 'bag-flat', pal: ['#e4ebef', '#aab6be', '#2b3138', '#2b3138'], bg: 'stripes',
    hero: 'hmBin', heroOpts: { c1: '#2b3138', c2: '#7ddc6a' }, ing: ['pe'],
    desc: T('A roll of 30 tough black bin bags for the kitchen and bathroom bins.', 'ถุงขยะสีดำแบบม้วน 30 ใบ เหนียว ไม่ขาดง่าย ใช้กับถังขยะในครัวและห้องน้ำ') },
  { id: 'attack-easy-happy-sweet', cat: 'household', brand: 'attack', name: T('Easy Happy Sweet', 'อีซี่ แฮปปี้สวีท'), sub: T('Powder detergent', 'ผงซักฟอก'),
    price: 59, size: g(700), g: 'box-detergent', pal: ['#ff7ab0', '#d62f7e', '#ffe14a', '#1f5fbf'], bg: 'burst',
    hero: 'hmLaundry', heroOpts: { c1: '#d62f7e', c2: '#ffe14a' }, promo: T('Buy 1 Get 1', '1 แถม 1'), pop: 2, ing: ['las', 'sodcarb', 'zeolite', 'enzyme', 'perfume', 'colour'],
    desc: T('Powder detergent with soft foam that rinses out easily, scented with the light floral "Happy Sweet" fragrance.',
      'ผงซักฟอกโฟมนุ่ม ซักสะอาดและล้างออกง่าย กลิ่นแฮปปี้สวีท หอมสะอาดสดชื่น') },
  { id: 'breeze-excel-active-fresh', cat: 'household', brand: 'breeze', name: T('Excel Active Fresh', 'เอกเซล แอคทีฟ เฟรช'), sub: T('Detergent powder', 'ผงซักฟอก'),
    price: 10, size: g(75), g: 'bag-tiny', strip: 6, pal: ['#2aa8e0', '#0e5fa8', '#ffe14a', '#ffffff'], bg: 'stripes',
    hero: 'hmLaundry', heroOpts: { c1: '#0e5fa8', c2: '#ffe14a' }, pop: 2, ing: ['las', 'sodcarb', 'zeolite', 'enzyme', 'perfume'],
    desc: T('A one-wash sachet of detergent powder, sold on hanging strips: the way many Thai households buy laundry soap day to day.',
      'ผงซักฟอกแบบซองเล็ก ขายเป็นแผงแขวน ซื้อใช้ทีละครั้ง เหมาะกับซักมือและซักผ้าจำนวนน้อย') },
  { id: 'comfort-ultra-care', cat: 'household', brand: 'comfort', name: T('Ultra Care', 'อัลตร้า แคร์'), sub: T('Fabric softener refill', 'ปรับผ้านุ่ม ถุงเติม'),
    price: 39, size: ml(500), g: 'bag-flat', pal: ['#a45bd6', '#5e2a96', '#ffd6f0', '#ffe14a'], bg: 'dots',
    hero: 'hmBlossom', heroOpts: { c1: '#ff7ac8', c2: '#ffe14a' }, ing: ['water', 'softener', 'perfume', 'preserv', 'colour'],
    desc: T('Fabric softener refill: add it to the final rinse for soft, sweet-smelling clothes, then top up the bottle.',
      'ผลิตภัณฑ์ปรับผ้านุ่มแบบถุงเติม ใส่ในน้ำล้างรอบสุดท้าย ผ้านุ่มหอมสดชื่น เติมใส่ขวดได้') },
  // ---- insects
  { id: 'soffell-lotion', cat: 'household', brand: 'soffell', name: T('Repellent Lotion', 'โลชั่นกันยุง'), sub: T('Insect repellent', 'ทากันยุง'),
    price: 45, size: ml(60), g: 'flip-s', style: 'pet', pal: ['#f7931e', '#d5620a', '#ffffff', '#f7931e'], body: '#f7931e', capColor: '#1e9d55', bg: 'stripes',
    hero: 'mosquito', origin: 'id', pop: 2, ing: ['water', 'deet', 'glycerin', 'perfume', 'preserv'],
    desc: T('Skin lotion that keeps mosquitoes off. Smooth it on before an evening out or a spell in the garden.',
      'โลชั่นทาผิวกันยุง ทาก่อนออกไปข้างนอกตอนเย็นหรือทำสวน ช่วยป้องกันยุงกัด') },
  { id: 'soffell-spray', cat: 'household', brand: 'soffell', name: T('Repellent Spray', 'สเปรย์กันยุง'), sub: T('Fresh scent', 'กลิ่นเฟรช'),
    price: 39, size: ml(30), g: 'glass100', style: 'pet', pal: ['#27ae60', '#14733c', '#ffffff', '#27ae60'], body: '#27ae60', capColor: '#f7931e', bg: 'stripes',
    hero: 'mosquito', origin: 'id', impulse: true, pop: 2, ing: ['alcohol', 'deet', 'perfume'],
    desc: T('Pocket-size repellent spray: a few spritzes on exposed skin before heading out at dusk.', 'สเปรย์กันยุงขนาดพกพา ฉีดที่ผิวก่อนออกไปข้างนอกช่วงเย็น') },
  { id: 'baygon-green', cat: 'household', brand: 'baygon', name: T('Mosquito, Ant & Roach Killer', 'กำจัดยุง มด แมลงสาบ'), sub: T('Insecticide spray', 'สเปรย์กำจัดแมลง'),
    price: 99, size: ml(300), g: 'aerosol', style: 'aerosol', pal: ['#1e9d3e', '#0d6a24', '#ffffff', '#d5dbe0'], capColor: '#ffffff', bg: 'rays',
    hero: 'hmSpray', heroOpts: { c1: '#1e9d3e', c2: '#ffffff' }, pop: 2, ing: ['pyrethroid', 'propellant', 'water', 'perfume'],
    desc: T('The green Baygon can knocks down mosquitoes, ants and cockroaches. Spray, then air the room before sitting down.',
      'สเปรย์ไบกอนกระป๋องเขียว กำจัดยุง มด และแมลงสาบ ฉีดแล้วควรเปิดระบายอากาศก่อนเข้าไปอยู่ในห้อง'),
    warn: T('Flammable aerosol: keep away from flame and heat. Do not spray on people, pets or food. Keep out of reach of children.', 'ภาชนะบรรจุแรงดัน ไวไฟ ห้ามใช้ใกล้เปลวไฟและความร้อน ห้ามฉีดใส่คน สัตว์เลี้ยง หรืออาหาร เก็บให้พ้นมือเด็ก') },
  { id: 'ars-plus-lavender-coil', cat: 'household', brand: 'ars', name: T('Mosquito Coils', 'ยาจุดกันยุง'), sub: T('Lavender · low smoke', 'กลิ่นลาเวนเดอร์ · ควันน้อย'),
    price: 25, size: { en: '10 coils', th: '10 ขด' }, g: 'box-s', pal: ['#6a4bd0', '#3a2a92', '#ffe14a', '#a58bff'], bg: 'zig',
    hero: 'hmCoil', heroOpts: { c1: '#4a6a2a' }, pop: 2, ing: ['allethrin', 'woodp', 'starch', 'perfume', 'colour'],
    desc: T('Ten low-smoke coils scented with lavender. Lit at dusk on verandas and outside shophouses across Thailand.',
      'ยาจุดกันยุงควันน้อย 10 ขด กลิ่นลาเวนเดอร์ จุดไว้ที่ระเบียงหรือหน้าร้านตอนเย็นเพื่อไล่ยุง') },
  // ---- hygiene & fire
  { id: 'dettol-hand-gel', cat: 'household', brand: 'dettol', name: T('Alcohol Hand Gel', 'เจลแอลกอฮอล์ล้างมือ'), sub: T('70% ethanol · no water needed', 'แอลกอฮอล์ 70% · ไม่ต้องล้างน้ำ'),
    price: 45, size: ml(50), g: 'flip-s', style: 'pet', pal: ['#41c8ee', '#1b8db0', '#ffffff', '#41c8ee'], body: '#41c8ee', capColor: '#0b7a3a', bg: 'waves',
    hero: 'hmGel', heroOpts: { c1: '#41c8ee' }, ing: ['alcohol', 'water', 'glycerin', 'carbomer', 'perfume'],
    desc: T('A pocket flip-top bottle of 70% alcohol hand gel for when there is no sink nearby.', 'เจลแอลกอฮอล์ 70% ขวดฝาพลิกขนาดพกพา ใช้เมื่อไม่มีอ่างล้างมือ'),
    warn: T('Flammable: keep away from flame and heat. For external use only. Keep out of reach of children.', 'ไวไฟ ห้ามใช้ใกล้เปลวไฟและความร้อน ใช้ภายนอกเท่านั้น เก็บให้พ้นมือเด็ก') },
  { id: 'bic-maxi-j26', cat: 'household', brand: 'bic', name: T('Maxi Lighter J26', 'ไฟแช็ก แม็กซี่ J26'), price: 30, g: 'lighter', style: 'lighter',
    pal: ['#e8261c', '#a3120c', '#ffffff', '#e8261c'], hero: 'hmLighter', heroOpts: { c1: '#e8261c' }, impulse: true, pop: 2, ing: ['butane', 'abs', 'steel'],
    desc: T('The full-size BIC gas lighter, a fixture of the counter rack. Keep out of the reach of children.', 'ไฟแช็กแก๊สบิ๊กขนาดใหญ่ วางขายหน้าเคาน์เตอร์ เก็บให้พ้นมือเด็ก'),
    warn: T('Flammable gas: keep away from heat above 50 °C and out of reach of children. Not a toy.', 'บรรจุแก๊สไวไฟ เก็บให้พ้นความร้อนเกิน 50 °C และพ้นมือเด็ก ไม่ใช่ของเล่น') },
];

// =====================================================================================================================
//  PERSONAL CARE (ของใช้ส่วนตัว)
// =====================================================================================================================
const PASTE_ING = ['water', 'sorbitol', 'silica', 'glycerin', 'sls', 'fluoride', 'flavour', 'sweet'];
const SHAMPOO_ING = ['water', 'sles', 'cocamide', 'dimethicone', 'glycerin', 'perfume', 'preserv', 'colour'];
const CARE = [
  // ---- oral care
  { id: 'colgate-total-active-fresh', cat: 'care', brand: 'colgate', name: T('Total Active Fresh', 'โททอล แอคทีฟ เฟรช'), sub: T('Toothpaste', 'ยาสีฟัน'),
    price: 59, size: g(150), g: 'box-tooth', pal: ['#e60012', '#a3000c', '#ffffff', '#2ea043'], bg: 'waves',
    hero: 'hmPaste', heroOpts: { c1: '#e60012', c2: '#1e9dd5' }, pop: 3, ing: PASTE_ING,
    desc: T('Fluoride toothpaste with a fresh, cooling mint taste: the red-and-white Colgate tube found in many Thai bathrooms.',
      'ยาสีฟันฟลูออไรด์ รสมินต์เย็นสดชื่น หลอดแดง-ขาวคุ้นตาที่พบได้ในห้องน้ำหลายบ้านของคนไทย') },
  { id: 'darlie-all-shiny-white', cat: 'care', brand: 'darlie', name: T('All Shiny White', 'ออลล์ชายนี่ไวท์'), sub: T('Toothpaste', 'ยาสีฟัน'),
    price: 65, size: g(140), g: 'box-tooth', pal: ['#d81f26', '#8f0f15', '#ffffff', '#111111'], bg: 'stripes',
    hero: 'hmPaste', heroOpts: { c1: '#111111', c2: '#d81f26' }, pop: 2, ing: PASTE_ING,
    desc: T('Mint-fresh whitening toothpaste from a long-established brand that many Thai families grew up with.',
      'ยาสีฟันสูตรฟันขาวสะอาด กลิ่นมินต์สดชื่น จากแบรนด์เก่าแก่ที่หลายครอบครัวไทยคุ้นเคย') },
  { id: 'sensodyne-fresh-mint', cat: 'care', brand: 'sensodyne', name: T('Fresh Mint', 'เฟรช มินต์'), sub: T('For sensitive teeth', 'ลดอาการเสียวฟัน'),
    price: 69, size: g(40), g: 'box-tooth', pal: ['#00a3e0', '#0b5fa8', '#ffffff', '#7ad0f0'], bg: 'waves',
    hero: 'hmPaste', heroOpts: { c1: '#00a3e0', c2: '#0b5fa8' }, ing: PASTE_ING,
    desc: T('Travel-size toothpaste for sensitive teeth, with fluoride and a fresh mint flavour.',
      'ยาสีฟันสำหรับผู้มีอาการเสียวฟัน ขนาดพกพา มีฟลูออไรด์ รสเฟรช มินต์') },
  { id: 'colgate-slim-soft-charcoal', cat: 'care', brand: 'colgate', name: T('Slim Soft Charcoal', 'สลิมซอฟท์ ชาร์โคล'), price: 45, size: { en: '1 brush', th: '1 ด้าม' }, g: 'card', style: 'card',
    pal: ['#e60012', '#8f0a10', '#ffffff', '#1a1a1a'], hero: 'hmBrush', heroOpts: { c1: '#1a1a1a', c2: '#e60012', paste: '#1e9dd5' }, ing: ['bristle', 'polyprop', 'abs'],
    desc: T('Toothbrush with ultra-fine tapered bristles infused with charcoal, gentle on the gums.', 'แปรงสีฟันขนแปรงปลายเรียวนุ่ม ผสมผงถ่าน อ่อนโยนต่อเหงือก') },
  // ---- shampoo sachet strips (hang on the pegboard)
  { id: 'sunsilk-smooth-sachet', cat: 'care', brand: 'sunsilk', name: T('Smooth & Manageable', 'สมูท&เมเนจเจเบิ้ล'), sub: T('Shampoo', 'แชมพู'),
    price: 5, size: ml(6), g: 'bag-tiny', strip: 6, pal: ['#ff5aa6', '#c2185b', '#fff36a', '#ff9ac8'], bg: 'rays',
    hero: 'hmHair', heroOpts: { c1: '#3a2412' }, pop: 3, ing: SHAMPOO_ING,
    desc: T('A single-wash sachet of pink Sunsilk shampoo, hung in strips so you can tear off just one. Handy for travel and the gym bag.',
      'แชมพูซันซิลสูตรสมูท&เมเนจเจเบิ้ลแบบซอง ฉีกใช้ทีละซอง สะดวกพกไปเที่ยวหรือใส่กระเป๋าไปยิม') },
  { id: 'clear-cool-sport-sachet', cat: 'care', brand: 'clear', name: T('Cool Sport Menthol', 'คูลสปอร์ต เมนทอล'), sub: T('Anti-dandruff shampoo', 'แชมพูขจัดรังแค'),
    price: 6, size: ml(7), g: 'bag-tiny', strip: 6, pal: ['#00a3e0', '#0b6fb0', '#ffffff', '#7fe0ff'], bg: 'dots',
    hero: 'hmHair', heroOpts: { c1: '#1b1b1b', c2: '#7fe0ff' }, pop: 2, ing: [...SHAMPOO_ING, 'zinc', 'menthol'],
    desc: T('Anti-dandruff shampoo with a menthol chill, in a tear-off sachet. Popular for cooling the scalp on hot days.',
      'แชมพูขจัดรังแคสูตรเมนทอลเย็นสดชื่น แบบซองฉีกใช้ ช่วยให้หนังศีรษะเย็นสบายในวันที่อากาศร้อน') },
  { id: 'pantene-daily-moisture-sachet', cat: 'care', brand: 'pantene', name: T('Daily Moisture Renewal', 'ดีลี่ มอยส์เจอร์ รีนิววัล'), sub: T('Pro-V shampoo', 'แชมพู โปร-วี'),
    price: 7, size: ml(12), g: 'bag-tiny', strip: 6, pal: ['#f5a300', '#c76b00', '#ffffff', '#ffd27a'], bg: 'zig',
    hero: 'hmHair', heroOpts: { c1: '#7a4a22', c2: '#ffd27a' }, ing: [...SHAMPOO_ING, 'vitb'],
    desc: T('Pantene Pro-V shampoo in a sachet, for smooth, silky-looking hair.', 'แชมพูแพนทีน โปร-วี แบบซอง ช่วยให้ผมนุ่มลื่นเป็นเงางาม') },
  { id: 'dove-intense-repair-sachet', cat: 'care', brand: 'dove', name: T('Intense Repair', 'อินเทนซีฟ รีแพร์'), sub: T('Shampoo', 'แชมพู'),
    price: 7, size: ml(10), g: 'bag-tiny', strip: 6, pal: ['#3a86d8', '#0b3f8f', '#ffffff', '#e9f4ff'], bg: 'waves',
    hero: 'hmHair', heroOpts: { c1: '#5a3418' }, ing: SHAMPOO_ING,
    desc: T('Dove shampoo for dry, damaged hair, in a one-wash sachet.', 'แชมพูโดฟสำหรับผมแห้งเสีย แบบซองใช้ครั้งเดียว') },
  // ---- bottles, soap, deodorant, skin
  { id: 'clear-cool-sport-shampoo', cat: 'care', brand: 'clear', name: T('Cool Sport Menthol', 'คูลสปอร์ต เมนทอล'), sub: T('Anti-dandruff shampoo', 'แชมพูขจัดรังแค'),
    price: 65, size: ml(170), g: 'shampoo', style: 'pet', pal: ['#00a3e0', '#0b6fb0', '#ffffff', '#12a5e0'], body: '#12a5e0', capColor: '#ffffff', bg: 'dots',
    hero: 'hmHair', heroOpts: { c1: '#1b1b1b', c2: '#7fe0ff' }, promo: T('2 for ฿120', '2 ขวด 120 บาท'), pop: 2, ing: [...SHAMPOO_ING, 'zinc', 'menthol'],
    desc: T('Anti-dandruff shampoo with a menthol chill: a favourite on hot, humid days.', 'แชมพูขจัดรังแคสูตรเมนทอลเย็นสดชื่น เหมาะกับวันอากาศร้อนชื้น') },
  { id: 'lux-soft-touch-soap', cat: 'care', brand: 'lux', name: T('Soft Touch', 'ซอฟท์ ทัช'), sub: T('Bar soap', 'สบู่ก้อน'),
    price: 15, size: g(70), g: 'box-xs', pal: ['#b784f0', '#7b45c8', '#ffe6f6', '#ff8ab0'], bg: 'dots',
    hero: 'soap', heroOpts: { c1: '#ff8ac0' }, promo: T('3 for ฿35', '3 ก้อน 35 บาท'), pop: 2, ing: ['palm', 'water', 'glycerin', 'perfume', 'colour'],
    desc: T('Perfumed bar soap with a rich, creamy lather; a Lux bar has been a fixture of Thai bathrooms for decades.',
      'สบู่ก้อนลักส์ ฟองนุ่ม กลิ่นหอม เป็นสบู่คู่ห้องน้ำคนไทยมานานหลายสิบปี') },
  { id: 'rexona-men-ice-cool', cat: 'care', brand: 'rexona', name: T('Men Ice Cool', 'เมน ไอซ์ คูล'), sub: T('Roll-on deodorant', 'โรลออนระงับกลิ่นกาย'),
    price: 75, size: ml(45), g: 'flip-s', style: 'pet', pal: ['#1e6fd5', '#0b3f8f', '#7fe0ff', '#e9f4ff'], body: '#e9f4ff', capColor: '#1e6fd5', bg: 'burst',
    hero: 'hmRollOn', heroOpts: { c1: '#1e6fd5', c2: '#7fe0ff' }, ing: ['aluminium', 'water', 'glycerin', 'perfume', 'menthol'],
    desc: T('Roll-on antiperspirant with an icy-fresh scent for men; keeps you dry through the commute.', 'โรลออนระงับกลิ่นกายสำหรับผู้ชาย กลิ่นเย็นสดชื่น ช่วยให้แห้งสบายตลอดวัน') },
  { id: 'vaseline-gluta-hya', cat: 'care', brand: 'vaseline', name: T('Gluta-Hya Serum Burst', 'กลูต้า-ไฮยา เซรั่ม เบิร์สท์'), sub: T('Healthy Bright body lotion', 'เฮลธี้ ไบรท์ โลชั่นบำรุงผิว'),
    price: 99, size: ml(180), g: 'shampoo', style: 'pet', pal: ['#fff3a8', '#ffd21a', '#1156b0', '#f4f6f8'], body: '#f4f6f8', capColor: '#ffd21a', bg: 'waves',
    hero: 'hmLotion', heroOpts: { c1: '#ffffff', c2: '#ffb400' }, ing: ['water', 'glycerin', 'petro', 'niacinamide', 'glutathione', 'hyaluronic', 'perfume', 'preserv'],
    desc: T('Body lotion with glutathione and hyaluronic acid to brighten and moisturise skin.', 'โลชั่นบำรุงผิวผสมกลูต้าและไฮยา ช่วยให้ผิวกระจ่างใสและชุ่มชื้น') },
  { id: 'smoothe-babyface-foam', cat: 'care', brand: 'smoothe', name: T('Babyface Foam', 'เบบี้เฟซ โฟม'), sub: T('Facial cleansing foam', 'โฟมล้างหน้า'),
    price: 99, size: oz(1), g: 'box-tooth', pal: ['#9c5bd6', '#5f2a9b', '#ffffff', '#e8b8ff'], bg: 'dots',
    hero: 'hmFoam', heroOpts: { c1: '#c04fd0' }, ing: ['water', 'glycerin', 'cocamide', 'preserv', 'perfume'],
    desc: T('Gentle facial cleansing foam, popular for a soft, clean feel after a day out in the heat.', 'โฟมล้างหน้าสูตรอ่อนโยน ให้ผิวสะอาดนุ่มหลังออกไปเจอแดดและความร้อน') },
  { id: 'garnier-micellar-water', cat: 'care', brand: 'garnier', name: T('Micellar Cleansing Water', 'ไมเซลลาร์ คลีนซิ่ง วอเตอร์'), sub: T('No-rinse make-up remover', 'เช็ดเครื่องสำอาง ไม่ต้องล้างออก'),
    price: 119, size: ml(125), g: 'flip-s', style: 'pet', pal: ['#dff1ff', '#8fc6f0', '#1e6fd5', '#f6fbff'], body: '#f6fbff', capColor: '#1e6fd5', bg: 'waves',
    hero: 'waterDrop', heroOpts: { c1: '#4db8ff' }, ing: ['water', 'glycerin', 'preserv', 'perfume'],
    desc: T('No-rinse micellar water that lifts make-up and dirt in one sweep of a cotton pad.', 'ไมเซลลาร์วอเตอร์เช็ดเครื่องสำอางและสิ่งสกปรกได้ในครั้งเดียว ไม่ต้องล้างออก') },
  { id: 'laurier-super-slimguard', cat: 'care', brand: 'laurier', name: T('Super Slimguard', 'ซูเปอร์ สลิมการ์ด'), sub: T('22 cm · with wings', '22 ซม. · มีปีก'),
    price: 39, size: pcs(8), g: 'bag-flat', pal: ['#d63a8a', '#8f1a5a', '#ffe14a', '#ffffff'], bg: 'waves',
    hero: 'hmPad', heroOpts: { c1: '#ff5aa6' }, pop: 2, ing: ['pulp', 'sap', 'nonwoven', 'pefilm', 'adhesive'],
    desc: T('Ultra-thin sanitary pads with wings, 22 cm long, in a pack of eight.', 'ผ้าอนามัยแบบบางพิเศษ มีปีก ยาว 22 ซม. แพ็ก 8 ชิ้น') },
  { id: 'snake-brand-powder', cat: 'care', brand: 'snake', name: T('Prickly Heat Powder', 'แป้งเย็น'), sub: T('Cooling powder', 'สูตรเย็นสดชื่น'),
    price: 35, size: g(50), g: 'jar-s', style: 'jar', pal: ['#1b9a5a', '#0b5e35', '#ffffff', '#f2f6f2'], body: '#f2f6f2', capColor: '#1b9a5a', bg: 'rays',
    hero: 'hmSnake', heroOpts: { c1: '#2ea043' }, pop: 2, ing: ['talc', 'cornst', 'menthol', 'camphor', 'perfume'],
    desc: T('Cooling prickly-heat powder: pat it on the neck and back after a shower for relief from the hot season.', 'แป้งเย็นตรางู ช่วยลดผดร้อน หลังอาบน้ำตบแป้งที่คอและแผ่นหลัง เย็นสบายในหน้าร้อน') },
  { id: 'babimild-baby-wipes', cat: 'care', brand: 'babimild', name: T('Ultra Mild Baby Wipes', 'อัลตร้ามายด์ เบบี้ไวพส์'), sub: T('Wet wipes', 'ผ้าเปียกสำหรับเด็ก'),
    price: 25, size: sheets(20), g: 'bag-flat', pal: ['#ff8fc0', '#e0559a', '#ffffff', '#ffffff'], bg: 'dots',
    hero: 'hmWipes', heroOpts: { c1: '#ff8fc0', deco: 'baby' }, ing: ['water', 'glycerin', 'nonwoven', 'aloe', 'preserv', 'perfume'],
    desc: T('Soft, gentle wet wipes for babies’ hands and faces.', 'ผ้าเปียกอ่อนโยนสำหรับเช็ดมือและหน้าเด็ก') },
  { id: 'cotton-buds-200', cat: 'care', brand: 'sevenselect', name: T('Cotton Buds', 'สำลีก้าน'), sub: T('Paper stick · 200 pcs', 'ก้านกระดาษ · 200 ก้าน'),
    price: 25, size: { en: '200 pcs', th: '200 ก้าน' }, g: 'box-xs', pal: ['#5bb8f0', '#2a86d0', '#00874a', '#ffffff'], bg: 'dots',
    hero: 'hmBuds', heroOpts: { c1: '#ffffff' }, ing: ['cotton', 'paperstick'],
    desc: T('A box of 200 paper-stick cotton buds for cleaning the outer ear, touching up make-up and wiping small corners.', 'สำลีก้านกระดาษ 200 ก้าน ใช้ทำความสะอาดใบหู แต่งหน้า และเช็ดซอกมุมเล็กๆ') },
  { id: 'nivea-sun-protect-bright', cat: 'care', brand: 'nivea', name: T('Sun Protect & Bright', 'ซัน โพรเท็ค แอนด์ ไบรท์'), sub: T('SPF50 PA+++ sunscreen', 'กันแดด SPF50 PA+++'),
    price: 149, size: ml(50), g: 'flip-s', style: 'pet', pal: ['#1f5fbf', '#0a3d91', '#ffb400', '#f2f6fa'], body: '#f2f6fa', capColor: '#ffb400', bg: 'rays',
    hero: 'hmSunTube', heroOpts: { c1: '#1f5fbf' }, ing: ['water', 'uvfilter', 'glycerin', 'niacinamide', 'perfume', 'preserv'],
    desc: T('SPF50 PA+++ sunscreen that brightens skin; light enough for everyday wear under the Thai sun.', 'ครีมกันแดด SPF50 PA+++ เนื้อบางเบา ช่วยให้ผิวกระจ่างใส ใช้ทุกวันได้') },
];

// =====================================================================================================================
//  HEALTH & REMEDIES (ยาสามัญและสมุนไพร)
// =====================================================================================================================
const HEALTH = [
  // ---- inhalers (ยาดม)
  { id: 'peppermint-field-inhaler', cat: 'health', brand: 'peppermint', name: T('Inhaler', 'ยาดม'), sub: T('Peppermint & menthol', 'เป๊ปเปอร์มิ้นท์และเมนทอล'),
    price: 29, size: cc(2), g: 'inhaler', style: 'pet', pal: ['#ffffff', '#dff1e4', '#1b8a3a', '#f2f6f2'], body: '#f2f6f2', capColor: '#1b8a3a', bg: 'waves',
    hero: 'hmInhaler', heroOpts: { c1: '#f2f6f2', c2: '#1b8a3a', emblem: 'leaf' }, impulse: true, pop: 3, ing: ['mintoil', 'menthol', 'camphor', 'eucalyptus'],
    desc: T('A pocket inhaler tube with a peppermint and menthol aroma. Thais sniff it for a stuffy nose, dizziness and car sickness.',
      'ยาดมแบบหลอดกลิ่นเป๊ปเปอร์มิ้นท์และเมนทอล สูดดมเพื่อบรรเทาอาการคัดจมูก วิงเวียน หรือเมารถ') },
  { id: 'peppermint-field-black', cat: 'health', brand: 'peppermint', name: T('Black Inhaler', 'แบล็ค อินเฮเลอร์'), sub: T('Double-strength formula', 'สูตรคูณสอง'),
    price: 39, size: cc(2), g: 'inhaler', style: 'pet', pal: ['#34343c', '#0f0f12', '#3ddc84', '#1a1a1d'], body: '#1a1a1d', capColor: '#3ddc84', bg: 'stripes',
    hero: 'hmInhaler', heroOpts: { c1: '#1a1a1d', c2: '#3ddc84', emblem: 'leaf' }, impulse: true, isNew: true, pop: 2, ing: ['mintoil', 'eucalyptus', 'menthol'],
    desc: T('The black-tube edition with a stronger peppermint and eucalyptus scent, made to slip into a pocket for the commute.',
      'ยาดมแท่งสีดำ กลิ่นเป๊ปเปอร์มิ้นท์และยูคาลิปตัสเข้มข้น พกใส่กระเป๋าไว้ใช้ระหว่างเดินทางได้สะดวก') },
  { id: 'vicks-inhaler', cat: 'health', brand: 'vicks', name: T('Inhaler', 'อินเฮเลอร์'), sub: T('Nasal stick', 'ยาดมแท่ง'),
    price: 59, size: ml(0.5), g: 'inhaler', style: 'pet', pal: ['#2a86e8', '#0b3f8f', '#ffffff', '#e9f4ff'], body: '#e9f4ff', capColor: '#1e6fd5', bg: 'rays', origin: 'us',
    hero: 'hmInhaler', heroOpts: { c1: '#e9f4ff', c2: '#1e6fd5', emblem: 'wave' }, impulse: true, pop: 2, ing: ['menthol', 'camphor', 'pineoil'],
    desc: T('Menthol, camphor and pine-needle oil in a nasal stick for quick relief from a blocked nose.',
      'ยาดมแบบแท่ง ผสมเมนทอล การบูร และน้ำมันสน ช่วยบรรเทาอาการคัดจมูกได้รวดเร็ว') },
  { id: 'poysian-inhaler', cat: 'health', brand: 'poysian', name: T('Inhaler', 'ยาดม'), sub: T('Eight Immortals', 'ตราโป๊ยเซียน'),
    price: 25, size: cc(1.7), g: 'inhaler', style: 'pet', pal: ['#d81f26', '#8f0f15', '#ffd54a', '#d81f26'], body: '#d81f26', capColor: '#ffd54a', bg: 'rays',
    hero: 'hmBagua', heroOpts: { c1: '#b3141b', c2: '#ffd54a' }, impulse: true, pop: 3, ing: ['menthol', 'camphor', 'borneol', 'mintoil'],
    desc: T('The classic Thai inhaler tube marked with the Eight Immortals. One sniff for a blocked nose, dizziness or car sickness; sold in assorted colours.',
      'ยาดมตราโป๊ยเซียน หลอดยาดมแบบดั้งเดิมของไทย สูดดมบรรเทาอาการคัดจมูก วิงเวียน หรือเมารถ มีหลายสีให้เลือก') },
  // ---- balms & liquid balms
  { id: 'tiger-balm-red', cat: 'health', brand: 'tigerbalm', name: T('Red Ointment', 'ยาหม่อง (แดง)'), sub: T('Warming pain-relief balm', 'ยาหม่องสูตรร้อน'),
    price: 59, size: g(19.4), g: 'balm-jar', style: 'jar', pal: ['#f6e6b8', '#e8cf94', '#c8102e', '#7a3a1a'], body: '#7a3a1a', capColor: '#c8102e', bg: 'plain', origin: 'sg',
    hero: 'tiger', impulse: true, pop: 3, ing: ['camphor', 'menthol', 'cajuput', 'clove', 'paraffin', 'petro'],
    desc: T('The original warming camphor-and-menthol ointment in its classic jar, for muscle aches and insect bites.',
      'ยาหม่องตราเสือสูตรร้อนดั้งเดิม กลิ่นการบูรและเมนทอล ทาบรรเทาปวดเมื่อยกล้ามเนื้อและแมลงกัดต่อย') },
  { id: 'tiger-balm-white', cat: 'health', brand: 'tigerbalm', name: T('White Ointment', 'ยาหม่อง (ขาว)'), sub: T('Classic pain-relief balm', 'ยาหม่องสูตรคลาสสิก'),
    price: 59, size: g(19.4), g: 'balm-jar', style: 'jar', pal: ['#f6e6b8', '#e8cf94', '#2a2a2a', '#5a5a5a'], body: '#5a5a5a', capColor: '#f2f2f2', bg: 'plain', origin: 'sg',
    hero: 'tiger', promo: T('2 for ฿99', '2 ตลับ 99 บาท'), impulse: true, pop: 3, ing: ['camphor', 'menthol', 'cajuput', 'mintoil', 'clove', 'paraffin', 'petro'],
    desc: T('The white ointment, a classic formula with cajuput and mint oils, for muscle aches and insect bites.',
      'ยาหม่องตราเสือสีขาว สูตรคลาสสิก ผสมน้ำมันเสม็ดขาวและน้ำมันสะระแหน่ ทาบรรเทาปวดเมื่อยและแมลงกัดต่อย') },
  { id: 'vicks-vaporub', cat: 'health', brand: 'vicks', name: T('VapoRub', 'วาโปรับ'), sub: T('Chest rub', 'ยาทาระเหย'),
    price: 45, size: g(10), g: 'balm-jar', style: 'jar', pal: ['#2a86e8', '#0b3f8f', '#ffffff', '#1e6fd5'], body: '#1e6fd5', capColor: '#1e6fd5', bg: 'plain', origin: 'us',
    hero: 'herb', heroOpts: { c1: '#7ddc6a' }, impulse: true, ing: ['camphor', 'menthol', 'eucalyptus', 'petro'],
    desc: T('Menthol, camphor and eucalyptus ointment, rubbed on the chest and neck to ease the stuffiness of a cold.',
      'ยาทาระเหยผสมเมนทอล การบูร และน้ำมันยูคาลิปตัส ทาบริเวณอกและคอเพื่อบรรเทาอาการหวัดคัดจมูก') },
  { id: 'siang-pure-oil-1', cat: 'health', brand: 'siang', name: T('Formula 1', 'สูตร 1'), sub: T('Liquid balm', 'ยาหม่องน้ำ'),
    price: 25, size: cc(3), g: 'glass100', style: 'pet', pal: ['#f6ecd0', '#e8dcb4', '#c8102e', '#c98a2e'], body: '#c98a2e', capColor: '#c8102e', bg: 'plain',
    hero: 'hmOil', heroOpts: { c1: '#c98a2e', c2: '#c8102e' }, impulse: true, pop: 2, ing: ['menthol', 'camphor', 'mintoil', 'clove', 'eucalyptus'],
    desc: T('Thai liquid balm in a little glass bottle: dab it on the temples or on insect bites, or sniff it for car sickness.',
      'ยาหม่องน้ำเซียงเพียวอิ๊ว ขวดแก้วเล็ก ทาขมับ แมลงกัดต่อย หรือสูดดมแก้วิงเวียน เมารถ') },
  { id: 'counterpain-cool', cat: 'health', brand: 'counterpain', name: T('Cool', 'คูล'), sub: T('Pain-relief cream', 'ครีมบรรเทาปวด'),
    price: 89, size: g(30), g: 'box-tooth', pal: ['#1e9dd5', '#0b5fa8', '#ffffff', '#c8102e'], bg: 'waves',
    hero: 'hmTube+snowflake', heroOpts: { c1: '#1e9dd5', c2: '#c8102e' }, ing: ['methylsal', 'menthol', 'camphor', 'petro'],
    desc: T('A cooling analgesic cream, massaged into sore muscles after work or exercise.', 'ครีมทาบรรเทาปวดเมื่อยกล้ามเนื้อสูตรเย็น นวดเบาๆ หลังทำงานหรือออกกำลังกาย') },
  { id: 'salonpas-patch', cat: 'health', brand: 'salonpas', name: T('Pain Relief Patch', 'แผ่นแปะบรรเทาปวด'), sub: T('Menthol & methyl salicylate', 'เมนทอลและเมทิลซาลิไซเลต'),
    price: 35, size: { en: '5 patches', th: '5 แผ่น' }, g: 'box-s', pal: ['#1e9d55', '#0b6a35', '#ffffff', '#ffe14a'], bg: 'stripes', origin: 'jp',
    hero: 'hmPatch', heroOpts: { c1: '#1e9d55' }, pop: 2, ing: ['methylsal', 'menthol', 'camphor', 'adhesive', 'cloth'],
    desc: T('Medicated patches with menthol and methyl salicylate for stiff shoulders, sore backs and aching joints.',
      'แผ่นแปะบรรเทาปวดผสมเมนทอลและเมทิลซาลิไซเลต ใช้แปะบริเวณไหล่ตึง ปวดหลัง ปวดข้อ') },
  // ---- tablets & sachets
  { id: 'sara-paracetamol', cat: 'health', brand: 'sara', name: T('Paracetamol', 'พาราเซตามอล'), sub: T('500 mg · pain & fever relief', '500 มก. · ลดปวด ลดไข้'),
    price: 12, size: tabs(10), g: 'box-xs', pal: ['#ff5aa6', '#c2185b', '#ffffff', '#ffffff'], bg: 'dots',
    hero: 'hmBlister', heroOpts: { c1: '#ffffff' }, impulse: true, pop: 3, ing: ['paracetamol', 'starch', 'mgstearate'],
    desc: T('Paracetamol 500 mg tablets for headaches, aches and fever. Follow the dose on the pack.', 'ยาพาราเซตามอล 500 มก. บรรเทาปวดศีรษะ ปวดเมื่อย ลดไข้ ใช้ตามขนาดที่ระบุบนฉลาก') },
  { id: 'tiffy-cold-relief', cat: 'health', brand: 'tiffy', name: T('Cold Relief', 'ยาแก้หวัด'), sub: T('Tablets', 'ชนิดเม็ด'),
    price: 18, size: tabs(10), g: 'box-xs', pal: ['#1e6fd5', '#0b3f8f', '#ffb400', '#ffffff'], bg: 'rays',
    hero: 'hmBlister', heroOpts: { c1: '#ffcf70' }, impulse: true, pop: 2, ing: ['paracetamol', 'phenylephrine', 'chlorphen', 'starch', 'mgstearate'],
    desc: T('Cold-relief tablets for a runny or blocked nose, headache and fever. Read the leaflet before use.', 'ยาเม็ดแก้หวัด บรรเทาน้ำมูกไหล คัดจมูก ปวดศีรษะ ตัวร้อน โปรดอ่านฉลากก่อนใช้') },
  { id: 'decolgen-cold-flu', cat: 'health', brand: 'decolgen', name: T('Cold & Flu', 'แก้หวัด ลดน้ำมูก'), sub: T('Tablets', 'ชนิดเม็ด'),
    price: 20, size: tabs(10), g: 'box-xs', pal: ['#2ea043', '#0b6a28', '#ffffff', '#ffffff'], bg: 'waves',
    hero: 'hmBlister', heroOpts: { c1: '#e8f4ff' }, impulse: true, ing: ['paracetamol', 'phenylephrine', 'chlorphen', 'starch', 'mgstearate'],
    desc: T('Cold and flu tablets for sneezing, runny nose and body aches. Not for use with other cold medicines.', 'ยาเม็ดแก้หวัด บรรเทาอาการจาม น้ำมูกไหล ปวดเมื่อยตามตัว ไม่ควรใช้ร่วมกับยาแก้หวัดอื่น') },
  { id: 'gpo-ors-orange', cat: 'health', brand: 'gpo', name: T('Oral Rehydration Salts', 'ผงเกลือแร่ ORS'), sub: T('Orange flavour', 'รสส้ม'),
    price: 7, size: { en: '1 sachet', th: '1 ซอง' }, g: 'bag-tiny', pal: ['#ff8a1a', '#d5620a', '#ffffff', '#1e9d55'], bg: 'rays',
    hero: 'hmOrs', heroOpts: { c1: '#ff8a1a' }, impulse: true, pop: 2, ing: ['salt', 'kcl', 'citrate', 'dextrose', 'flavour'],
    desc: T('Orange-flavoured oral rehydration salts: dissolve in drinking water to replace fluid and salts lost to diarrhoea or heavy sweating.',
      'ผงเกลือแร่ ORS รสส้ม ละลายน้ำดื่มเพื่อชดเชยน้ำและเกลือแร่ที่สูญเสียจากท้องเสียหรือเหงื่อออกมาก') },
  { id: 'strepsils-honey-lemon', cat: 'health', brand: 'strepsils', name: T('Honey & Lemon', 'น้ำผึ้งและมะนาว'), sub: T('Sore throat lozenges', 'ยาอมแก้เจ็บคอ'),
    price: 49, size: { en: '8 lozenges', th: '8 เม็ด' }, g: 'box-xs', pal: ['#ffd21a', '#f2a900', '#c8102e', '#ffe14a'], bg: 'dots',
    hero: 'hmLozenge', heroOpts: { c1: '#f2b31a' }, impulse: true, ing: ['sugar', 'starchsyrup', 'honey', 'lemon', 'amc', 'dcba', 'flavour'],
    desc: T('Honey and lemon lozenges that soothe a sore throat.', 'ยาอมแก้เจ็บคอ รสน้ำผึ้งและมะนาว ช่วยบรรเทาอาการเจ็บคอ') },
  // ---- first aid & protection
  { id: 'bandaid-plasters', cat: 'health', brand: 'bandaid', name: T('Adhesive Plasters', 'พลาสเตอร์ปิดแผล'), sub: T('For everyday cuts', 'สำหรับแผลเล็ก'),
    price: 29, size: { en: '10 pcs', th: '10 ชิ้น' }, g: 'box-xs', pal: ['#1e88e5', '#0d47a1', '#ffd400', '#f0c69a'], bg: 'stripes',
    hero: 'hmPlaster', heroOpts: { c1: '#f0c69a' }, ing: ['cloth', 'adhesive', 'pe'],
    desc: T('Adhesive plasters for everyday cuts and scrapes.', 'พลาสเตอร์ปิดแผลสำหรับแผลถลอกและบาดแผลเล็กน้อย') },
  { id: 'surgical-face-mask', cat: 'health', brand: 'sevenselect', name: T('Surgical Face Mask', 'หน้ากากอนามัย'), sub: T('3-ply · ear loops', '3 ชั้น · สายคล้องหู'),
    price: 29, size: { en: '10 pcs', th: '10 ชิ้น' }, g: 'box-s', pal: ['#00874a', '#005a30', '#ffffff', '#7fc8ef'], bg: 'dots',
    hero: 'hmMask', heroOpts: { c1: '#7fc8ef' }, ing: ['polyprop', 'nonwoven', 'polyester', 'aluminium'],
    desc: T('Disposable 3-ply surgical face masks with ear loops, ten to a box: handy for smoky days and crowded trains.', 'หน้ากากอนามัยชนิด 3 ชั้น แบบสายคล้องหู กล่องละ 10 ชิ้น เหมาะกับวันที่มีฝุ่นควันและรถไฟฟ้าแน่น') },
];

// =====================================================================================================================
//  EVERYDAY ITEMS (ของใช้จำเป็น): batteries, cables, SIMs, rain gear, stationery
// =====================================================================================================================
const CELL_ING = ['mno2', 'znm', 'koh', 'steel'];
const MISC = [
  { id: 'panasonic-alkaline-aa', cat: 'misc', brand: 'panasonic', name: T('Alkaline AA', 'ถ่านอัลคาไลน์ AA'), price: 79, size: { en: '4 pcs', th: '4 ก้อน' }, g: 'card',
    pal: ['#0057b8', '#062a66', '#ffd400', '#0057b8'], hero: 'hmCell', heroOpts: { c1: '#1b3f9a', c2: '#ffd400', txt: 'AA', n: 4 }, promo: T('Save ฿10', 'ลด 10 บาท'), pop: 2, ing: CELL_ING,
    desc: T('Long-lasting alkaline AA batteries, four to a card, for remote controls, wall clocks and torches.', 'ถ่านอัลคาไลน์ AA แพ็ก 4 ก้อน ใช้กับรีโมต นาฬิกาแขวน และไฟฉาย') },
  { id: 'energizer-max-aaa', cat: 'misc', brand: 'energizer', name: T('Alkaline AAA', 'ถ่านอัลคาไลน์ AAA'), price: 109, size: { en: '4 pcs', th: '4 ก้อน' }, g: 'card',
    pal: ['#1a1a1a', '#000000', '#ffd400', '#1a1a1a'], hero: 'hmCell', heroOpts: { c1: '#151515', c2: '#ffd400', txt: 'AAA', n: 4 }, ing: CELL_ING,
    desc: T('Alkaline AAA batteries for remotes, wireless mice and small gadgets; four to a card.', 'ถ่านอัลคาไลน์ AAA แพ็ก 4 ก้อน สำหรับรีโมต เมาส์ไร้สาย และอุปกรณ์ขนาดเล็ก') },
  { id: 'usb-c-cable', cat: 'misc', brand: 'sevenselect', name: T('USB-C Charging Cable', 'สายชาร์จ USB-C'), price: 99, size: cm(100), g: 'card',
    pal: ['#2a3946', '#10171d', '#41d67a', '#2a3946'], hero: 'hmCable', heroOpts: { c1: '#f2f4f7' }, pop: 2, ing: ['copper', 'pvc', 'abs'],
    desc: T('A 1 m USB-C cable for charging phones and power banks: the emergency purchase when yours has frayed.', 'สายชาร์จ USB-C ยาว 1 เมตร สำหรับชาร์จโทรศัพท์และพาวเวอร์แบงค์ ตัวช่วยเมื่อสายเดิมขาดหรือลืมพก') },
  { id: 'in-ear-earphones', cat: 'misc', brand: 'sevenselect', name: T('In-ear Earphones', 'หูฟังอินเอียร์'), price: 129, g: 'card',
    pal: ['#00a3a3', '#006a6a', '#ffe14a', '#ffffff'], hero: 'hmEar', heroOpts: { c1: '#2f3a44' }, ing: ['copper', 'abs', 'pvc'],
    desc: T('Wired in-ear earphones with a microphone for calls.', 'หูฟังอินเอียร์แบบมีสาย พร้อมไมโครโฟนสำหรับรับสาย') },
  { id: 'power-bank-10000', cat: 'misc', brand: 'sevenselect', name: T('Power Bank', 'พาวเวอร์แบงค์'), sub: T('Fast charge · USB-C', 'ชาร์จเร็ว · USB-C'), price: 499, size: mah(10000), g: 'box-tall', style: 'box',
    pal: ['#2a3946', '#10171d', '#41d67a', '#26323d'], bg: 'zig', hero: 'hmPower', heroOpts: { c1: '#26323d', c2: '#41d67a', txt: '10000 mAh' }, ing: ['liion', 'abs', 'copper'],
    desc: T('A 10,000 mAh power bank that charges a phone a couple of times over: a commuter’s lifesaver on a long Skytrain day.', 'พาวเวอร์แบงค์ 10,000 mAh ชาร์จโทรศัพท์ได้หลายรอบ ตัวช่วยของคนเดินทางในเมือง') },
  { id: 'ais-prepaid-sim', cat: 'misc', brand: 'ais', name: T('Prepaid SIM', 'ซิมเติมเงิน'), price: 49, g: 'card',
    pal: ['#7ab800', '#4a7a00', '#ffffff', '#7ab800'], hero: 'hmSim', heroOpts: { c1: '#7ab800' }, pop: 2, ing: ['chip', 'pvc'],
    desc: T('A prepaid AIS SIM card: top up at the counter to make calls and get online straight away.', 'ซิมเติมเงินเอไอเอส เติมเงินที่เคาน์เตอร์เพื่อโทรและใช้อินเทอร์เน็ตได้ทันที') },
  { id: 'truemove-prepaid-sim', cat: 'misc', brand: 'truemove', name: T('Prepaid SIM', 'ซิมเติมเงิน'), price: 49, g: 'card',
    pal: ['#e60012', '#8f0a10', '#ffffff', '#e60012'], hero: 'hmSim', heroOpts: { c1: '#e60012' }, ing: ['chip', 'pvc'],
    desc: T('A prepaid TrueMove H SIM card, ready to activate and top up at the counter.', 'ซิมเติมเงินทรูมูฟ เอช พร้อมลงทะเบียนและเติมเงินที่เคาน์เตอร์') },
  { id: 'ais-topup-100', cat: 'misc', brand: 'ais', name: T('Top-up Card ฿100', 'บัตรเติมเงิน 100 บาท'), price: 100, g: 'card',
    pal: ['#7ab800', '#4a7a00', '#ffffff', '#7ab800'], hero: 'hmTopup', heroOpts: { c1: '#7ab800', txt: '฿100' }, ing: ['paper', 'ink'],
    desc: T('A ฿100 AIS top-up card: scratch off the code and key it in to add call credit.', 'บัตรเติมเงินเอไอเอส 100 บาท ขูดรหัสแล้วกดเติมเงินเข้าเบอร์ได้ทันที') },
  { id: 'folding-umbrella', cat: 'misc', brand: 'sevenselect', name: T('Folding Umbrella', 'ร่มพับ 3 ตอน'), sub: T('UV coated', 'เคลือบ UV กันแดด'), price: 149, g: 'box-tall', style: 'box',
    pal: ['#4a86e8', '#1f3f8f', '#ffe14a', '#e8261c'], bg: 'rays', hero: 'hmBrolly', heroOpts: { c1: '#e8261c', c2: '#ffffff' }, promo: T('Buy 2 Save ฿30', 'ซื้อ 2 ลด 30 บาท'), pop: 2, ing: ['polyester', 'steel', 'abs'],
    desc: T('A three-fold umbrella with UV-coated fabric: shade from the midday sun, cover when the rainy-season downpour hits.', 'ร่มพับ 3 ตอน เคลือบ UV กันแดดตอนเที่ยงและกันฝนช่วงหน้าฝน') },
  { id: 'handheld-fan', cat: 'misc', brand: 'sevenselect', name: T('Handheld Fan', 'พัดลมพกพา'), sub: T('USB rechargeable', 'ชาร์จผ่าน USB'), price: 129, g: 'box-tall', style: 'box',
    pal: ['#ff7ab0', '#c2185b', '#ffffff', '#ff7ab0'], bg: 'dots', hero: 'hmFan', heroOpts: { c1: '#ff7ab0' }, pop: 2, ing: ['abs', 'liion', 'copper'],
    desc: T('A rechargeable handheld fan for queueing in the heat; charges over USB.', 'พัดลมพกพาแบบชาร์จได้ ช่วยคลายร้อนเวลายืนรอคิว ชาร์จผ่าน USB') },
  { id: 'ball-pens-blue', cat: 'misc', brand: 'quantum', name: T('Blue Ball Pens', 'ปากกาลูกลื่น สีน้ำเงิน'), price: 15, size: { en: '3 pens', th: '3 ด้าม' }, g: 'stick', style: 'stick',
    pal: ['#c8102e', '#8f0a10', '#ffffff', '#c8102e'], hero: 'hmPens', heroOpts: { cols: ['#1e6fd5', '#1e6fd5', '#1e6fd5'] }, ing: ['abs', 'ink', 'steel'],
    desc: T('Three blue ball pens: the school and office staple.', 'ปากกาลูกลื่นสีน้ำเงิน 3 ด้าม สำหรับนักเรียนและคนทำงาน') },
  { id: 'spiral-notebook', cat: 'misc', brand: 'campus', name: T('Spiral Notebook', 'สมุดสันลวด'), price: 25, size: sheets(60), g: 'card',
    pal: ['#2e7dd8', '#1a4fa0', '#ffd400', '#2e7dd8'], hero: 'hmNote', heroOpts: { c1: '#2e7dd8' }, ing: ['paper', 'ink', 'steel'],
    desc: T('A 60-sheet spiral notebook for lecture notes and to-do lists.', 'สมุดสันลวด 60 แผ่น สำหรับจดเลคเชอร์และจดรายการที่ต้องทำ') },
  { id: 'clear-tape', cat: 'misc', brand: 'scotch', name: T('Clear Tape', 'เทปใส'), sub: T('Sticky tape', 'เทปกาว'), price: 29, size: { en: '3/4 in × 18 m', th: '3/4 นิ้ว × 18 ม.' }, g: 'box-xs', style: 'box',
    pal: ['#c8102e', '#8f0a10', '#ffe14a', '#c8102e'], bg: 'stripes', hero: 'hmTape', heroOpts: { c1: '#8fd6f2' }, ing: ['polyprop', 'gum'],
    desc: T('Clear sticky tape for wrapping parcels, hanging posters and mending paper.', 'เทปใสสำหรับห่อของ แปะโปสเตอร์ และซ่อมกระดาษ') },
  { id: 'rain-poncho', cat: 'misc', brand: 'sevenselect', name: T('Folding Rain Poncho', 'เสื้อกันฝนพับได้'), sub: T('One size · reusable', 'ฟรีไซซ์ · ใช้ซ้ำได้'), price: 39, g: 'box-s', style: 'box',
    pal: ['#3a86d8', '#1f4fa0', '#ffd21a', '#ffd21a'], bg: 'waves', hero: 'hmPoncho', heroOpts: { c1: '#ffd21a' }, pop: 2, ing: ['pe'],
    desc: T('A foldable rain poncho that fits in a bag: essential for motorbike riders in the rainy season.', 'เสื้อกันฝนพับเก็บได้ ใส่กระเป๋าสะดวก จำเป็นสำหรับคนขี่มอเตอร์ไซค์หน้าฝน') },
  { id: 'playing-cards', cat: 'misc', brand: 'sevenselect', name: T('Playing Cards', 'ไพ่'), sub: T('54 cards', 'ไพ่ 54 ใบ'), price: 35, size: { en: '54 cards', th: '54 ใบ' }, g: 'box-xs', style: 'box',
    pal: ['#c8102e', '#8f0a10', '#ffe14a', '#c8102e'], bg: 'burst', hero: 'hmCards', heroOpts: { c1: '#c8102e' }, ing: ['paper', 'ink'],
    desc: T('A deck of 54 playing cards for pok deng, party games or a slow evening.', 'ไพ่สำรับ 54 ใบ สำหรับเล่นป๊อกเด้งหรือเกมปาร์ตี้') },
];

export default [...HOUSEHOLD, ...CARE, ...HEALTH, ...MISC];

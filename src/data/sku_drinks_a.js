// Drinks A: bottled water, sports drinks, soft drinks and energy / tonic drinks.
// Tall bottles come first inside every category so the planogram puts them on the roomier lower shelves.
import { T, ml, L } from './sku_util.js';
import { circle, ellipse, poly, drop, leaf, linGrad, radGrad, fillRR, star, bolt, fitText } from '../gfx/draw.js';
import { lemonSlice } from '../gfx/illus.js';
import { lighten, darken, TAU } from '../core/util.js';

// ------------------------------------------------------------------ small helpers
// nutrition per pack: [kcal, sugar g, fat g, sodium mg] from per-100 ml values
const N = (v, kcal, sugar, na = 5) => [Math.round((kcal * v) / 500) * 5, Math.round(sugar * v / 100), 0, Math.round((na * v) / 500) * 5];

// ------------------------------------------------------------------ hero illustrations (units: centimetres, centred on 0,0)
const INK = '#2a1a10';
const line = (ctx, s, k = 0.035) => { ctx.lineWidth = Math.max(s * k, 0.09); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
function glint(ctx, x, y, w, h, rot = -0.6, a = 0.6) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill(); ctx.restore();
}
function bubble(ctx, s, x, y, r) {
  circle(ctx, x * s, y * s, r * s, 'rgba(255,255,255,.30)', 'rgba(255,255,255,.95)', Math.max(s * 0.012, 0.05));
  circle(ctx, (x - r * 0.35) * s, (y - r * 0.35) * s, r * s * 0.25, 'rgba(255,255,255,.95)');
}

// water: a big droplet landing in a ripple with a crown of splash petals
function waterSplashDrop(ctx, s, o = {}) {
  s *= 1.18;
  const c = o.c1 || '#3fb0ff', lite = o.c2 || '#d9f1ff', dk = darken(c, 0.5);
  ellipse(ctx, 0, s * 0.33, s * 0.44, s * 0.09, 'rgba(255,255,255,.30)', 'rgba(255,255,255,.9)', Math.max(s * 0.014, 0.06));
  ellipse(ctx, 0, s * 0.33, s * 0.28, s * 0.055, 'rgba(255,255,255,.4)', 'rgba(255,255,255,.95)', Math.max(s * 0.012, 0.05));
  for (let i = -3; i <= 3; i++) {
    const a = -Math.PI / 2 + i * 0.36, len = s * (0.28 - Math.abs(i) * 0.035);
    leaf(ctx, i * s * 0.055, s * 0.32, len, s * 0.06, a, i % 2 ? lite : lighten(c, 0.45));
  }
  for (const [x, y, r] of [[-0.31, -0.02, 0.04], [0.32, 0.03, 0.035], [-0.21, -0.2, 0.03], [0.23, -0.18, 0.028]]) drop(ctx, x * s, y * s, r * s, lighten(c, 0.5), dk, Math.max(s * 0.012, 0.05));
  drop(ctx, 0, -s * 0.04, s * 0.2, linGrad(ctx, 0, -s * 0.35, 0, s * 0.22, [[0, lighten(c, 0.45)], [0.5, c], [1, darken(c, 0.2)]]), dk, Math.max(s * 0.03, 0.1));
  glint(ctx, -s * 0.07, -s * 0.06, s * 0.035, s * 0.085, 0.35, 0.75);
}

// Crystal: a faceted gem with sparkles
function crystalGem(ctx, s, o = {}) {
  s *= 1.2;
  const c = o.c1 || '#7fd4ff', k = darken(c, 0.55);
  const yT = -s * 0.22, yG = -s * 0.05, yB = s * 0.38;
  const tl = [-s * 0.16, yT], tr = [s * 0.16, yT], gl = [-s * 0.38, yG], gr = [s * 0.38, yG], b = [0, yB];
  const g1 = [-s * 0.15, yG], g2 = [s * 0.15, yG];
  poly(ctx, [tl, tr, g2, g1], lighten(c, 0.65));
  poly(ctx, [gl, tl, g1], lighten(c, 0.2));
  poly(ctx, [tr, gr, g2], lighten(c, 0.3));
  poly(ctx, [gl, g1, b], c);
  poly(ctx, [g1, g2, b], lighten(c, 0.35));
  poly(ctx, [g2, gr, b], darken(c, 0.2));
  poly(ctx, [tl, tr, gr, b, gl], null, k, Math.max(s * 0.03, 0.1));
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = Math.max(s * 0.012, 0.05);
  ctx.beginPath(); ctx.moveTo(g1[0], g1[1]); ctx.lineTo(tl[0], tl[1]); ctx.moveTo(g2[0], g2[1]); ctx.lineTo(tr[0], tr[1]); ctx.stroke();
  star(ctx, s * 0.33, -s * 0.3, s * 0.09, '#ffffff', 4);
  star(ctx, -s * 0.36, s * 0.2, s * 0.06, '#ffffff', 4);
}

// mineral water: snowy peaks over a mountain lake
function mineralPeaks(ctx, s, o = {}) {
  s *= 1.15;
  const c = o.c1 || '#4f8fd0', snow = o.c2 || '#ffffff', lake = o.c3 || '#43c0ff', k = darken(c, 0.55);
  circle(ctx, s * 0.24, -s * 0.28, s * 0.075, '#ffe27a');
  poly(ctx, [[-s * 0.46, s * 0.2], [-s * 0.13, -s * 0.34], [s * 0.2, s * 0.2]], darken(c, 0.12), k, Math.max(s * 0.028, 0.1));
  poly(ctx, [[-s * 0.24, -s * 0.06], [-s * 0.13, -s * 0.34], [-s * 0.02, -s * 0.06], [-s * 0.07, -s * 0.11], [-s * 0.13, -s * 0.04], [-s * 0.19, -s * 0.11]], snow);
  poly(ctx, [[-s * 0.12, s * 0.2], [s * 0.2, -s * 0.16], [s * 0.47, s * 0.2]], c, k, Math.max(s * 0.028, 0.1));
  poly(ctx, [[s * 0.11, -s * 0.05], [s * 0.2, -s * 0.16], [s * 0.29, -s * 0.05], [s * 0.24, -s * 0.09], [s * 0.2, -s * 0.03], [s * 0.15, -s * 0.09]], snow);
  ellipse(ctx, 0, s * 0.3, s * 0.42, s * 0.11, lake, darken(lake, 0.4), Math.max(s * 0.025, 0.09));
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = Math.max(s * 0.014, 0.05); ctx.lineCap = 'round';
  for (const [x, y, w] of [[-0.18, 0.29, 0.16], [0.05, 0.33, 0.2], [0.14, 0.27, 0.12]]) { ctx.beginPath(); ctx.moveTo(x * s, y * s); ctx.lineTo((x + w) * s, y * s); ctx.stroke(); }
}

// electrolyte drink: a droplet charged with a lightning bolt
function isoDropBolt(ctx, s, o = {}) {
  s *= 1.15;
  const c = o.c1 || '#ffffff', b = o.c2 || '#ffb01f', dk = o.c3 || darken(c, 0.55);
  drop(ctx, 0, s * 0.05, s * 0.27, linGrad(ctx, 0, -s * 0.35, 0, s * 0.4, [[0, lighten(c, 0.35)], [1, c]]), dk, Math.max(s * 0.035, 0.11));
  bolt(ctx, -s * 0.15, -s * 0.14, s * 0.3, s * 0.46, b, darken(b, 0.55), Math.max(s * 0.03, 0.1));
  for (const [x, y, r] of [[-0.36, -0.22, 0.05], [0.36, -0.06, 0.045], [-0.34, 0.2, 0.04]]) {
    ctx.strokeStyle = o.c4 || b; ctx.lineWidth = Math.max(s * 0.03, 0.1); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo((x - r) * s, y * s); ctx.lineTo((x + r) * s, y * s); ctx.moveTo(x * s, (y - r) * s); ctx.lineTo(x * s, (y + r) * s); ctx.stroke();
  }
  glint(ctx, -s * 0.15, -s * 0.05, s * 0.03, s * 0.08, 0.3, 0.7);
}

// lemon-lime: a lime and a lemon slice with rising bubbles
function citrusFizz(ctx, s, o = {}) {
  s *= 1.12;
  const lime = o.c1 || '#8fd43a', lemon = o.c2 || '#ffe13a';
  ctx.save(); ctx.translate(-s * 0.1, -s * 0.06); lemonSlice(ctx, s * 0.78, { c1: lime }); ctx.restore();
  ctx.save(); ctx.translate(s * 0.15, s * 0.15); lemonSlice(ctx, s * 0.6, { c1: lemon }); ctx.restore();
  for (const [x, y, r] of [[0.33, -0.3, 0.055], [-0.36, 0.25, 0.05], [0.4, -0.06, 0.035], [-0.05, -0.42, 0.04], [0.06, 0.4, 0.035], [-0.4, -0.2, 0.03]]) bubble(ctx, s, x, y, r);
}

// cola: a fizzy splash with ice and bubbles
function colaFizz(ctx, s, o = {}) {
  s *= 1.2;
  const c = o.c1 || '#3a1a08', hi = o.c2 || '#c98a4a';
  const parts = [
    [0, 0.27, 0.37, 0.12, 0], [0, -0.06, 0.1, 0.28, 0], [-0.2, 0.03, 0.075, 0.21, -0.42], [0.21, 0.02, 0.075, 0.22, 0.44],
    [-0.31, 0.15, 0.06, 0.13, -0.85], [0.32, 0.14, 0.06, 0.14, 0.9],
  ];
  ctx.strokeStyle = INK; ctx.lineWidth = s * 0.075; ctx.lineJoin = 'round';
  for (const [x, y, rx, ry, rot] of parts) { ctx.beginPath(); ctx.ellipse(x * s, y * s, rx * s, ry * s, rot, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = linGrad(ctx, -s * 0.3, -s * 0.3, s * 0.3, s * 0.35, [[0, lighten(c, 0.12)], [0.5, c], [1, darken(c, 0.35)]]);
  for (const [x, y, rx, ry, rot] of parts) { ctx.beginPath(); ctx.ellipse(x * s, y * s, rx * s, ry * s, rot, 0, TAU); ctx.fill(); }
  for (const [x, y, r] of [[-0.12, -0.42, 0.045], [0.13, -0.38, 0.038], [-0.3, -0.24, 0.03], [0.32, -0.26, 0.034]]) { circle(ctx, x * s, y * s, r * s, c, INK, s * 0.02); }
  ctx.strokeStyle = hi; ctx.lineWidth = s * 0.028; ctx.lineCap = 'round';
  for (const [x, y, rx, ry, rot] of [[-0.03, -0.08, 0.06, 0.22, 0], [-0.21, 0.04, 0.045, 0.16, -0.42], [0.2, 0.03, 0.045, 0.16, 0.44]]) { ctx.beginPath(); ctx.ellipse(x * s, y * s, rx * s, ry * s, rot, 3.6, 4.7); ctx.stroke(); }
  for (const [x, y, r] of [[-0.08, 0.04, 0.13], [0.11, 0.17, 0.11]]) {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(x * 3);
    fillRR(ctx, -r * s / 2, -r * s / 2, r * s, r * s, r * s * 0.2, 'rgba(255,255,255,.55)', 'rgba(255,255,255,.95)', s * 0.014);
    ctx.restore();
  }
  for (const [x, y, r] of [[-0.02, 0.24, 0.03], [0.2, 0.28, 0.025], [-0.24, 0.27, 0.025], [0.02, -0.28, 0.02]]) circle(ctx, x * s, y * s, r * s, 'rgba(255,255,255,.75)');
}

// the contour bottle silhouette
function contourBottle(ctx, s, o = {}) {
  s *= 1.12;
  const liq = o.c1 || '#3a1a08', cap = o.c2 || '#e41e2b';
  const R = [[0.036, -0.4], [0.04, -0.32], [0.056, -0.25], [0.105, -0.18], [0.133, -0.1], [0.127, -0.01], [0.106, 0.07], [0.12, 0.15], [0.14, 0.26], [0.132, 0.35], [0.105, 0.41]];
  const path = () => {
    ctx.beginPath(); ctx.moveTo(-R[0][0] * s, R[0][1] * s); ctx.lineTo(R[0][0] * s, R[0][1] * s);
    for (let i = 1; i < R.length; i++) { const m = [(R[i - 1][0] + R[i][0]) / 2, (R[i - 1][1] + R[i][1]) / 2]; ctx.quadraticCurveTo(R[i - 1][0] * s, R[i - 1][1] * s, m[0] * s, m[1] * s); }
    ctx.lineTo(R[R.length - 1][0] * s, R[R.length - 1][1] * s); ctx.lineTo(-R[R.length - 1][0] * s, R[R.length - 1][1] * s);
    for (let i = R.length - 1; i >= 1; i--) { const m = [(R[i - 1][0] + R[i][0]) / 2, (R[i - 1][1] + R[i][1]) / 2]; ctx.quadraticCurveTo(-R[i][0] * s, R[i][1] * s, -m[0] * s, m[1] * s); }
    ctx.closePath();
  };
  path(); ctx.fillStyle = linGrad(ctx, -s * 0.14, 0, s * 0.14, 0, [[0, darken(liq, 0.2)], [0.35, lighten(liq, 0.28)], [0.6, liq], [1, darken(liq, 0.35)]]); ctx.fill();
  line(ctx, s, 0.03); ctx.strokeStyle = INK; ctx.stroke();
  fillRR(ctx, -s * 0.047, -s * 0.45, s * 0.094, s * 0.055, s * 0.012, cap, INK, Math.max(s * 0.02, 0.07));
  ctx.save(); path(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-s * 0.16, s * 0.1); ctx.bezierCurveTo(-s * 0.05, -s * 0.03, s * 0.05, s * 0.2, s * 0.16, s * 0.06); ctx.stroke();
  ctx.restore();
  glint(ctx, -s * 0.07, -s * 0.12, s * 0.014, s * 0.07, 0.15, 0.55);
  glint(ctx, -s * 0.08, s * 0.28, s * 0.014, s * 0.06, 0.05, 0.5);
}

// น้ำเขียว / cream soda float: green soda topped with a scoop, cherry and straw
function creamFloat(ctx, s, o = {}) {
  s *= 1.1;
  const c = o.c1 || '#54d46a';
  ctx.strokeStyle = '#e8261c'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(s * 0.03, s * 0.3); ctx.lineTo(s * 0.2, -s * 0.46); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.02; ctx.setLineDash([s * 0.05, s * 0.05]);
  ctx.beginPath(); ctx.moveTo(s * 0.03, s * 0.3); ctx.lineTo(s * 0.2, -s * 0.46); ctx.stroke(); ctx.setLineDash([]);
  const glass = () => { ctx.beginPath(); ctx.moveTo(-s * 0.27, -s * 0.16); ctx.lineTo(s * 0.27, -s * 0.16); ctx.lineTo(s * 0.19, s * 0.38); ctx.quadraticCurveTo(0, s * 0.42, -s * 0.19, s * 0.38); ctx.closePath(); };
  glass(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
  ctx.save(); glass(); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, -s * 0.16, 0, s * 0.4, [[0, lighten(c, 0.25)], [1, darken(c, 0.15)]]); ctx.fillRect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.5);
  ctx.restore();
  glass(); line(ctx, s, 0.03); ctx.strokeStyle = INK; ctx.stroke();
  for (const [x, y, r] of [[-0.1, 0.12, 0.03], [0.06, 0.24, 0.025], [0.1, 0.06, 0.022], [-0.05, 0.3, 0.02]]) circle(ctx, x * s, y * s, r * s, 'rgba(255,255,255,.7)');
  circle(ctx, 0, -s * 0.22, s * 0.2, '#fffdf4', '#cdbf98', Math.max(s * 0.022, 0.08));
  for (const [x, y, r] of [[-0.18, -0.12, 0.07], [-0.06, -0.09, 0.07], [0.07, -0.09, 0.07], [0.18, -0.12, 0.065]]) circle(ctx, x * s, y * s, r * s, '#fffdf4', '#cdbf98', Math.max(s * 0.018, 0.07));
  circle(ctx, 0, -s * 0.2, s * 0.17, '#fffdf4');
  glint(ctx, -s * 0.06, -s * 0.3, s * 0.05, s * 0.028, -0.5, 0.9);
  circle(ctx, -s * 0.01, -s * 0.46, s * 0.055, '#e8261c', '#7a0e14', Math.max(s * 0.018, 0.07));
  ctx.strokeStyle = '#3a7a2a'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(-s * 0.01, -s * 0.5); ctx.quadraticCurveTo(s * 0.03, -s * 0.56, s * 0.08, -s * 0.55); ctx.stroke();
  glint(ctx, -s * 0.03, -s * 0.48, s * 0.014, s * 0.012, -0.5, 0.9);
}

// root beer: a frosty mug with a thick head of foam
function rootBeerFoam(ctx, s, o = {}) {
  s *= 1.2;
  const c = o.c1 || '#4a2210', foam = o.c2 || '#fff4d8';
  ctx.strokeStyle = INK; ctx.lineWidth = s * 0.075; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(s * 0.2, s * 0.08, s * 0.13, -1.25, 1.25); ctx.stroke();
  ctx.strokeStyle = 'rgba(235,245,255,.95)'; ctx.lineWidth = s * 0.04;
  ctx.beginPath(); ctx.arc(s * 0.2, s * 0.08, s * 0.13, -1.25, 1.25); ctx.stroke();
  fillRR(ctx, -s * 0.27, -s * 0.16, s * 0.47, s * 0.54, s * 0.05, linGrad(ctx, -s * 0.27, 0, s * 0.2, 0, [[0, darken(c, 0.2)], [0.3, lighten(c, 0.2)], [1, darken(c, 0.3)]]), INK, Math.max(s * 0.035, 0.11));
  fillRR(ctx, -s * 0.22, s * 0.3, s * 0.37, s * 0.06, s * 0.02, 'rgba(255,255,255,.22)');
  ctx.strokeStyle = 'rgba(235,245,255,.7)'; ctx.lineWidth = s * 0.02;
  for (const y of [0.02, 0.14, 0.26]) { ctx.beginPath(); ctx.moveTo(-s * 0.24, y * s); ctx.lineTo(s * 0.17, y * s); ctx.stroke(); }
  for (const [x, y, r] of [[-0.17, -0.2, 0.09], [-0.03, -0.27, 0.11], [0.11, -0.22, 0.095], [0.2, -0.15, 0.06], [-0.24, -0.11, 0.06], [-0.1, -0.16, 0.08], [0.05, -0.15, 0.085]]) circle(ctx, x * s, y * s, r * s, foam, '#d8c69a', Math.max(s * 0.016, 0.06));
  for (const [x, y, w, h] of [[-0.25, -0.14, 0.07, 0.15], [0.02, -0.12, 0.06, 0.1], [0.13, -0.13, 0.06, 0.18]]) fillRR(ctx, x * s, y * s, w * s, h * s, w * s / 2, foam);
  for (const [x, y, r] of [[-0.12, 0.1, 0.025], [0.02, 0.2, 0.02], [-0.16, 0.28, 0.02], [0.06, 0.08, 0.016]]) circle(ctx, x * s, y * s, r * s, 'rgba(255,225,180,.7)');
  glint(ctx, -s * 0.2, s * 0.1, s * 0.02, s * 0.14, 0, 0.35);
}

// mixer soda: a tall glass of bubbles, ice and a lemon wedge
function highballFizz(ctx, s, o = {}) {
  s *= 1.1;
  const c = o.c1 || '#cfeaf7', g = o.c2 || '#ffe13a';
  ctx.strokeStyle = '#7fc8ff'; ctx.lineWidth = s * 0.045; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(s * 0.02, s * 0.3); ctx.lineTo(s * 0.17, -s * 0.5); ctx.stroke();
  const glass = () => { ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.36); ctx.lineTo(s * 0.2, -s * 0.36); ctx.lineTo(s * 0.17, s * 0.4); ctx.lineTo(-s * 0.17, s * 0.4); ctx.closePath(); };
  glass(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fill();
  ctx.save(); glass(); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, -s * 0.36, 0, s * 0.4, [[0, lighten(c, 0.35)], [1, darken(c, 0.05)]]); ctx.fillRect(-s * 0.25, -s * 0.28, s * 0.5, s * 0.7);
  ctx.restore();
  glass(); line(ctx, s, 0.03); ctx.strokeStyle = 'rgba(40,70,100,.85)'; ctx.stroke();
  for (const [x, y, r, rot] of [[-0.06, -0.16, 0.13, 0.3], [0.06, 0.03, 0.12, -0.2], [-0.05, 0.22, 0.12, 0.5]]) {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot);
    fillRR(ctx, -r * s / 2, -r * s / 2, r * s, r * s, r * s * 0.2, 'rgba(255,255,255,.55)', 'rgba(255,255,255,.95)', s * 0.013); ctx.restore();
  }
  for (const [x, y, r] of [[-0.11, -0.02, 0.022], [0.1, -0.2, 0.025], [0.02, 0.32, 0.02], [-0.1, 0.36, 0.016], [0.12, 0.16, 0.02], [0.0, -0.3, 0.018], [-0.13, -0.27, 0.016]]) circle(ctx, x * s, y * s, r * s, 'rgba(255,255,255,.8)', 'rgba(60,100,140,.5)', s * 0.008);
  ctx.save(); ctx.translate(-s * 0.22, -s * 0.32); ctx.rotate(-0.35); lemonSlice(ctx, s * 0.36, { c1: g }); ctx.restore();
}

// Krating Daeng / Red Bull style: two bulls charging at each other in front of a sun
function bullShape(ctx, s, c) {
  const dk = darken(c, 0.55), w = Math.max(s * 0.026, 0.09);
  // tail
  ctx.strokeStyle = dk; ctx.lineWidth = s * 0.028; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.02); ctx.quadraticCurveTo(-s * 0.31, -s * 0.03, -s * 0.3, -s * 0.13); ctx.stroke();
  circle(ctx, -s * 0.3, -s * 0.14, s * 0.02, dk);
  // legs (far pair darker)
  const leg = (pts, fill) => poly(ctx, pts.map(([x, y]) => [x * s, y * s]), fill, dk, w);
  leg([[0.06, 0.07], [0.1, 0.07], [0.11, 0.18], [0.075, 0.18]], darken(c, 0.25));
  leg([[-0.11, 0.06], [-0.07, 0.07], [-0.09, 0.18], [-0.125, 0.18]], darken(c, 0.25));
  leg([[0.12, 0.07], [0.16, 0.06], [0.22, 0.15], [0.19, 0.175]], c);
  leg([[-0.17, 0.05], [-0.13, 0.07], [-0.19, 0.165], [-0.225, 0.15]], c);
  // body + head
  ctx.beginPath(); ctx.moveTo(-s * 0.21, -s * 0.03);
  ctx.quadraticCurveTo(-s * 0.15, -s * 0.1, -s * 0.06, -s * 0.1);
  ctx.bezierCurveTo(-s * 0.02, -s * 0.17, s * 0.06, -s * 0.2, s * 0.1, -s * 0.13);
  ctx.quadraticCurveTo(s * 0.14, -s * 0.09, s * 0.17, -s * 0.06);
  ctx.quadraticCurveTo(s * 0.2, -s * 0.07, s * 0.23, -s * 0.03);
  ctx.lineTo(s * 0.26, s * 0.04); ctx.quadraticCurveTo(s * 0.25, s * 0.085, s * 0.2, s * 0.08);
  ctx.quadraticCurveTo(s * 0.16, s * 0.05, s * 0.13, s * 0.06);
  ctx.quadraticCurveTo(s * 0.12, s * 0.11, s * 0.07, s * 0.115);
  ctx.quadraticCurveTo(-s * 0.06, s * 0.12, -s * 0.14, s * 0.095);
  ctx.quadraticCurveTo(-s * 0.21, s * 0.07, -s * 0.21, -s * 0.03); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, -s * 0.2, 0, s * 0.12, [[0, lighten(c, 0.15)], [1, c]]); ctx.fill();
  ctx.strokeStyle = dk; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.stroke();
  // horn, eye, nostril
  ctx.beginPath(); ctx.moveTo(s * 0.175, -s * 0.06); ctx.quadraticCurveTo(s * 0.29, -s * 0.05, s * 0.315, -s * 0.2); ctx.quadraticCurveTo(s * 0.235, -s * 0.115, s * 0.15, -s * 0.1); ctx.closePath();
  ctx.fillStyle = '#fff3cf'; ctx.fill(); ctx.strokeStyle = dk; ctx.lineWidth = w; ctx.stroke();
  circle(ctx, s * 0.2, -s * 0.01, s * 0.012, '#fff');
  circle(ctx, s * 0.245, s * 0.045, s * 0.009, dk);
  glint(ctx, -s * 0.02, -s * 0.06, s * 0.06, s * 0.012, -0.2, 0.35);
}
function bullsSun(ctx, s, o = {}) {
  s *= 1.2;
  // o.wide: flatter, wider emblem for the small glass bottles; o.plate: cream roundel behind it
  const c = o.c1 || '#e0261c', sun = o.c2 || '#ffc21a', sp = o.wide ? 0.31 : 0.21, k = o.wide ? 1.28 : 1.12, sr = o.wide ? 0.27 : 0.3;
  if (o.plate) {
    ctx.beginPath(); ctx.ellipse(0, s * 0.02, s * 0.76, s * 0.44, 0, 0, TAU);
    ctx.fillStyle = o.plate; ctx.fill(); ctx.strokeStyle = o.ring || '#c8102e'; ctx.lineWidth = Math.max(s * 0.04, 0.12); ctx.stroke();
  }
  ctx.save(); ctx.translate(0, -s * (o.wide ? 0.06 : 0.1));
  for (let i = 0; i < 16; i++) { ctx.save(); ctx.rotate((i * TAU) / 16); poly(ctx, [[-s * 0.028, -s * (sr + 0.01)], [0, -s * (sr + (o.plate ? 0.08 : 0.14))], [s * 0.028, -s * (sr + 0.01)]], lighten(sun, 0.05)); ctx.restore(); }
  circle(ctx, 0, 0, s * sr, radGrad(ctx, 0, 0, 0, s * sr, [[0, lighten(sun, 0.5)], [0.6, sun], [1, darken(sun, 0.15)]]), darken(sun, 0.45), Math.max(s * 0.022, 0.08));
  ctx.restore();
  ctx.save(); ctx.translate(-s * sp, s * 0.12); bullShape(ctx, s * k, c); ctx.restore();
  ctx.save(); ctx.translate(s * sp, s * 0.12); ctx.scale(-1, 1); bullShape(ctx, s * k, c); ctx.restore();
}

// Carabao Dang: a water buffalo head with sweeping horns
function buffaloHead(ctx, s, o = {}) {
  s *= 1.15;
  const c = o.c1 || '#2b1a0e', horn = o.c2 || '#f6e7bb', dk = darken(c, 0.5), w = Math.max(s * 0.03, 0.1);
  for (const sx of [-1, 1]) {
    ctx.save(); ctx.scale(sx, 1);
    ctx.beginPath(); ctx.moveTo(s * 0.1, -s * 0.09);
    ctx.bezierCurveTo(s * 0.26, -s * 0.13, s * 0.42, -s * 0.06, s * 0.45, -s * 0.3);
    ctx.bezierCurveTo(s * 0.4, -s * 0.2, s * 0.3, -s * 0.2, s * 0.13, -s * 0.15);
    ctx.closePath(); ctx.fillStyle = horn; ctx.fill(); ctx.strokeStyle = dk; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.stroke();
    ellipse(ctx, s * 0.22, -s * 0.02, s * 0.1, s * 0.055, darken(c, 0.15), dk, w, 0.35);
    ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(-s * 0.17, -s * 0.16); ctx.quadraticCurveTo(0, -s * 0.24, s * 0.17, -s * 0.16);
  ctx.bezierCurveTo(s * 0.2, s * 0.05, s * 0.15, s * 0.22, s * 0.11, s * 0.33); ctx.quadraticCurveTo(0, s * 0.4, -s * 0.11, s * 0.33);
  ctx.bezierCurveTo(-s * 0.15, s * 0.22, -s * 0.2, s * 0.05, -s * 0.17, -s * 0.16); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.4, [[0, lighten(c, 0.2)], [1, c]], -s * 0.05, -s * 0.1); ctx.fill(); ctx.strokeStyle = dk; ctx.lineWidth = w; ctx.stroke();
  ellipse(ctx, 0, s * 0.25, s * 0.115, s * 0.09, lighten(c, 0.28), dk, w);
  circle(ctx, -s * 0.045, s * 0.26, s * 0.018, '#111'); circle(ctx, s * 0.045, s * 0.26, s * 0.018, '#111');
  for (const sx of [-1, 1]) { circle(ctx, sx * s * 0.085, -s * 0.03, s * 0.026, '#fff8e0', dk, w * 0.6); circle(ctx, sx * s * 0.085, -s * 0.03, s * 0.012, '#111'); }
  ctx.strokeStyle = lighten(c, 0.35); ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.2); ctx.quadraticCurveTo(0, -s * 0.14, s * 0.05, -s * 0.2); ctx.stroke();
}

// Shark: a menacing side-on shark
function sharkBite(ctx, s, o = {}) {
  s *= 1.18;
  const c = o.c1 || '#3d7fd0', belly = o.c2 || '#e9f6ff', dk = darken(c, 0.6), w = Math.max(s * 0.03, 0.09), thin = Math.max(s * 0.014, 0.04);
  ctx.save(); ctx.scale(-1, 1);
  ctx.beginPath(); ctx.moveTo(-s * 0.46, s * 0.04);
  ctx.bezierCurveTo(-s * 0.36, -s * 0.12, -s * 0.16, -s * 0.15, -s * 0.06, -s * 0.15);
  ctx.lineTo(-s * 0.0, -s * 0.38); ctx.lineTo(s * 0.13, -s * 0.14);
  ctx.bezierCurveTo(s * 0.22, -s * 0.11, s * 0.3, -s * 0.04, s * 0.34, s * 0.0);
  ctx.lineTo(s * 0.47, -s * 0.22); ctx.quadraticCurveTo(s * 0.4, -s * 0.02, s * 0.43, s * 0.03); ctx.lineTo(s * 0.46, s * 0.22); ctx.lineTo(s * 0.33, s * 0.04);
  ctx.bezierCurveTo(s * 0.2, s * 0.1, s * 0.0, s * 0.16, -s * 0.16, s * 0.14);
  ctx.bezierCurveTo(-s * 0.3, s * 0.14, -s * 0.4, s * 0.1, -s * 0.46, s * 0.04); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, -s * 0.2, 0, s * 0.16, [[0, lighten(c, 0.1)], [0.55, c], [0.56, belly], [1, belly]]); ctx.fill();
  ctx.lineJoin = 'round'; ctx.strokeStyle = dk; ctx.lineWidth = w; ctx.stroke();
  poly(ctx, [[-s * 0.1, s * 0.1], [s * 0.02, s * 0.27], [-s * 0.02, s * 0.1]], c, dk, w);
  ctx.strokeStyle = dk; ctx.lineWidth = thin * 1.4; ctx.beginPath(); ctx.moveTo(-s * 0.44, s * 0.05); ctx.quadraticCurveTo(-s * 0.3, s * 0.11, -s * 0.2, s * 0.08); ctx.stroke();
  for (let i = 0; i < 4; i++) { const x = -s * 0.41 + i * s * 0.06; poly(ctx, [[x, s * 0.055 + i * s * 0.006], [x + s * 0.032, s * 0.078 + i * s * 0.008], [x + s * 0.014, s * 0.118 + i * s * 0.003]], '#ffffff'); }
  ctx.strokeStyle = dk; ctx.lineWidth = thin;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.2 + i * s * 0.03, -s * 0.03); ctx.quadraticCurveTo(-s * 0.22 + i * s * 0.03, s * 0.02, -s * 0.2 + i * s * 0.03, s * 0.05); ctx.stroke(); }
  circle(ctx, -s * 0.31, -s * 0.03, s * 0.026, '#fff', dk, thin); circle(ctx, -s * 0.315, -s * 0.03, s * 0.012, '#111');
  ctx.restore();
}

// Singha: the mythical lion, rampant and in profile (Singha water and soda)
function singhaLion(ctx, s, o = {}) {
  s *= 1.2;
  const c = o.c1 || '#f0c040', k = darken(c, 0.62), mane = o.c2 || darken(c, 0.2);
  const E = (x, y, rx, ry, rot = 0) => () => { ctx.beginPath(); ctx.ellipse(x * s, y * s, rx * s, ry * s, rot, 0, TAU); };
  const limb = (x0, y0, x1, y1, th) => E((x0 + x1) / 2, (y0 + y1) / 2, Math.hypot(x1 - x0, y1 - y0) / 2 + th * 0.5, th / 2, Math.atan2(y1 - y0, x1 - x0));
  const tufts = [];
  for (let i = 0; i < 10; i++) { const a = -2.7 + i * 0.44; tufts.push(E(-0.1 + Math.cos(a) * 0.12, -0.25 + Math.sin(a) * 0.12, 0.065, 0.048, a)); }
  const body = [
    E(0.07, -0.03, 0.23, 0.105, 1.0), E(-0.13, -0.25, 0.1, 0.095), E(-0.23, -0.22, 0.066, 0.046, 0.2),
    limb(-0.03, -0.1, -0.26, -0.14, 0.065), limb(-0.02, -0.04, -0.2, 0.06, 0.06),
    limb(0.15, 0.07, 0.05, 0.31, 0.078), limb(0.21, 0.1, 0.28, 0.33, 0.072),
    E(0.04, 0.335, 0.066, 0.03), E(0.3, 0.348, 0.066, 0.03),
  ];
  const lwd = Math.max(s * 0.06, 0.15);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // tail (outline first, then fill)
  const tail = () => { ctx.beginPath(); ctx.moveTo(s * 0.22, s * 0.03); ctx.bezierCurveTo(s * 0.37, s * 0.05, s * 0.42, -s * 0.1, s * 0.33, -s * 0.2); };
  ctx.strokeStyle = k; ctx.lineWidth = s * 0.06; tail(); ctx.stroke();
  ellipse(ctx, s * 0.325, -s * 0.22, s * 0.04, s * 0.06, k);
  ctx.strokeStyle = k; ctx.lineWidth = lwd;
  for (const sh of [...tufts, ...body]) { sh(); ctx.stroke(); }
  ctx.strokeStyle = c; ctx.lineWidth = s * 0.03; tail(); ctx.stroke();
  ellipse(ctx, s * 0.325, -s * 0.22, s * 0.032, s * 0.052, mane);
  ctx.fillStyle = mane; for (const sh of tufts) { sh(); ctx.fill(); }
  ctx.fillStyle = linGrad(ctx, -s * 0.3, -s * 0.3, s * 0.3, s * 0.35, [[0, lighten(c, 0.25)], [0.6, c], [1, darken(c, 0.15)]]); for (const sh of body) { sh(); ctx.fill(); }
  // details: mane curls, eye, nose, mouth, claws
  ctx.strokeStyle = darken(mane, 0.4); ctx.lineWidth = Math.max(s * 0.014, 0.04);
  for (let i = 0; i < 6; i++) { const a = -2.4 + i * 0.6, r = 0.14; ctx.beginPath(); ctx.arc(-0.1 * s + Math.cos(a) * r * s, -0.25 * s + Math.sin(a) * r * s, s * 0.035, a + 1, a + 4); ctx.stroke(); }
  circle(ctx, -s * 0.17, -s * 0.27, s * 0.022, '#fff8e0', k, Math.max(s * 0.01, 0.035)); circle(ctx, -s * 0.176, -s * 0.27, s * 0.011, '#111');
  circle(ctx, -s * 0.288, -s * 0.235, s * 0.016, k);
  ctx.strokeStyle = k; ctx.lineWidth = Math.max(s * 0.016, 0.045); ctx.beginPath(); ctx.moveTo(-s * 0.285, -s * 0.2); ctx.quadraticCurveTo(-s * 0.23, -s * 0.17, -s * 0.18, -s * 0.2); ctx.stroke();
  ctx.fillStyle = '#fff'; for (const [x, y] of [[-0.29, -0.15], [-0.27, -0.13], [-0.235, 0.09], [-0.215, 0.1]]) { ctx.beginPath(); ctx.arc(x * s, y * s, s * 0.012, 0, TAU); ctx.fill(); }
  glint(ctx, s * 0.04, -s * 0.08, s * 0.05, s * 0.012, 1.0, 0.4);
}

// orange: a whole fruit with a juicy slice behind and a few droplets
function sodaOrange(ctx, s, o = {}) {
  s *= 1.12;
  const c = o.c1 || '#ff9a1f', k = darken(c, 0.5), w = Math.max(s * 0.03, 0.1);
  ctx.save(); ctx.translate(s * 0.16, s * 0.13); lemonSlice(ctx, s * 0.66, { c1: c }); ctx.restore();
  circle(ctx, -s * 0.1, -s * 0.03, s * 0.27, radGrad(ctx, -s * 0.1, -s * 0.03, 0, s * 0.31, [[0, lighten(c, 0.3)], [0.65, c], [1, darken(c, 0.18)]], -s * 0.19, -s * 0.13), k, w);
  ctx.fillStyle = 'rgba(160,70,0,.35)'; for (const [x, y] of [[-0.2, 0.05], [-0.06, 0.12], [0.02, -0.02], [-0.16, -0.12], [-0.02, 0.2], [-0.24, 0.16]]) { ctx.beginPath(); ctx.arc((x - 0.02) * s, y * s, s * 0.008, 0, TAU); ctx.fill(); }
  leaf(ctx, -s * 0.1, -s * 0.29, s * 0.22, s * 0.08, -0.55, '#2e9b3e'); leaf(ctx, -s * 0.1, -s * 0.29, s * 0.2, s * 0.075, -2.5, '#3ab04a');
  glint(ctx, -s * 0.2, -s * 0.13, s * 0.06, s * 0.03, -0.7, 0.55);
  for (const [x, y, r] of [[0.36, -0.14, 0.03], [0.28, -0.3, 0.025], [-0.36, 0.28, 0.028]]) drop(ctx, x * s, y * s, r * s, lighten(c, 0.25), k, Math.max(s * 0.012, 0.04));
  for (const [x, y, r] of [[0.4, 0.0, 0.03], [-0.38, -0.2, 0.026]]) bubble(ctx, s, x, y, r);
}

// energy bolt: a fat lightning bolt with a pale outline and soft glow (Gatorade, Sting, M-150)
function energyVolt(ctx, s, o = {}) {
  s *= 1.1;
  const c = o.c1 || '#ff8a00', edge = o.c2 || '#ffffff', dk = darken(c, 0.5);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.5, [[0, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
  bolt(ctx, -s * 0.3, -s * 0.42, s * 0.6, s * 0.84, edge, edge, Math.max(s * 0.09, 0.2));
  bolt(ctx, -s * 0.3, -s * 0.42, s * 0.6, s * 0.84, linGrad(ctx, 0, -s * 0.42, 0, s * 0.42, [[0, lighten(c, 0.3)], [0.5, c], [1, darken(c, 0.15)]]), dk, Math.max(s * 0.03, 0.09));
  glint(ctx, -s * 0.02, -s * 0.24, s * 0.03, s * 0.09, 0.5, 0.55);
}

// vitamin badge: letters in a sunburst (Lipovitan-D, B12 tonics)
function tonicBadge(ctx, s, o = {}) {
  s *= 1.12;
  const c = o.c1 || '#ffd400', ring = o.c2 || '#e8261c', txt = o.text || 'D', tc = o.tc || '#ffffff';
  for (let i = 0; i < 14; i++) { ctx.save(); ctx.rotate((i * TAU) / 14); poly(ctx, [[-s * 0.05, -s * 0.28], [0, -s * 0.45], [s * 0.05, -s * 0.28]], c); ctx.restore(); }
  circle(ctx, 0, 0, s * 0.31, ring, darken(ring, 0.5), Math.max(s * 0.03, 0.1));
  circle(ctx, 0, 0, s * 0.26, null, 'rgba(255,255,255,.55)', Math.max(s * 0.012, 0.05));
  fitText(ctx, txt, -s * 0.22, -s * 0.18, s * 0.44, s * 0.36, { family: 'anton', weight: 400, size: s * 0.36, color: tc, stroke: darken(ring, 0.5), strokeW: s * 0.03 });
}

export const illus = { waterSplashDrop, crystalGem, mineralPeaks, isoDropBolt, citrusFizz, colaFizz, contourBottle, creamFloat, rootBeerFoam, highballFizz, bullsSun, buffaloHead, sharkBite, singhaLion, sodaOrange, energyVolt, tonicBadge };

// ------------------------------------------------------------------ extra brand styles
export const brands = {
  plus100: { text: '100PLUS', th: '100 พลัส', style: 'block', bg: '#0a3d91', fg: '#ffffff', font: 'archivo', ring: '#e4002b' },
  minere: { text: 'MINERE', th: 'มิเนเร่', style: 'pill', bg: '#ffffff', fg: '#0a7a94', font: 'righteous', ring: '#0a7a94' },
  sting: { text: 'STING', th: 'สติงค์', style: 'block', bg: '#141414', fg: '#ffd400', font: 'bangers', ring: '#e0202a' },
  kratingdaeng: { text: 'KRATING DAENG', th: 'กระทิงแดง', style: 'block', bg: '#3a0a10', fg: '#f2c14e', font: 'anton', ring: '#f2c14e' },
};

// ------------------------------------------------------------------ extra ingredient names
export const ingredients = {
  phosphoric: { en: 'Phosphoric acid', th: 'กรดฟอสฟอริก' },
  acidreg: { en: 'Acidity regulator', th: 'สารควบคุมความเป็นกรด' },
  glucuronolactone: { en: 'Glucuronolactone', th: 'กลูคูโรโนแลกโทน' },
  niacin: { en: 'Niacinamide (vitamin B3)', th: 'ไนอะซินาไมด์ (วิตามินบี 3)' },
  vitb12: { en: 'Vitamin B12', th: 'วิตามินบี 12' },
  sodiumcit: { en: 'Sodium citrate', th: 'โซเดียมซิเตรต' },
  fruitjuice: { en: 'Fruit juice', th: 'น้ำผลไม้' },
};

// ------------------------------------------------------------------ products
export default [
  // ================================================================= WATER (tall 1.5 L bottles first)
  { id: 'namthip-1500', cat: 'water', brand: 'namthip', name: T('Drinking Water', 'น้ำดื่ม'), price: 14, size: L(1.5), g: 'pet1500w', pal: ['#2a95e8', '#0b57b5', '#dff3ff', '#d8eefa'], hero: 'waterSplashDrop', heroOpts: { c1: '#3fb0ff' }, capColor: '#1e6fd0', ing: ['water'], pop: 3, promo: T('2 for ฿20', '2 ขวด 20 บาท'),
    desc: T('Namthip means “heavenly water”, and it is bottled by Thai Namthip in the Coca-Cola system. The big 1.5 L bottle is the usual pick for the home fridge.', 'น้ำทิพย์ น้ำดื่มยอดนิยมที่คนไทยคุ้นเคย ผลิตโดยไทยน้ำทิพย์ในเครือโคคา-โคล่า ขวดใหญ่ 1.5 ลิตรนี้เหมาะสำหรับแช่ตู้เย็นไว้ดื่มที่บ้าน') },
  { id: 'nestle-1500', cat: 'water', brand: 'nestle', name: T('Drinking Water', 'น้ำดื่ม'), price: 15, size: L(1.5), g: 'pet1500w', pal: ['#2f7fd6', '#0d4a94', '#ffffff', '#d8eefa'], hero: 'waterSplashDrop', heroOpts: { c1: '#39a8f0' }, capColor: '#0d4a94', ing: ['water'], pop: 2,
    desc: T('Nestlé’s purified drinking water in the big 1.5 L bottle. It sells as a single bottle or in six-packs, so it is easy to grab on the way home.', 'น้ำดื่มบริสุทธิ์จากเนสท์เล่ ขวดใหญ่ 1.5 ลิตร มีทั้งแบบขวดเดียวและแพ็ก 6 ขวด สะดวกหยิบกลับบ้านระหว่างทาง') },
  // ---- 550-600 ml singles
  { id: 'namthip-550', cat: 'water', brand: 'namthip', name: T('Drinking Water', 'น้ำดื่ม'), price: 7, size: ml(550), pal: ['#2a95e8', '#0b57b5', '#dff3ff', '#d8eefa'], hero: 'waterSplashDrop', heroOpts: { c1: '#3fb0ff' }, capColor: '#1e6fd0', ing: ['water'], pop: 3,
    desc: T('The handy 550 ml Namthip is the cheap, cold bottle to grab for a sweaty walk down the soi. In Thai, plain drinking water is simply “nam plao” (น้ำเปล่า).', 'น้ำทิพย์ขวดเล็ก 550 มล. ราคาเบาๆ หยิบดื่มระหว่างเดินกลางแดดในซอยได้ทันที คนไทยเรียกน้ำดื่มธรรมดาสั้นๆ ว่า “น้ำเปล่า”') },
  { id: 'crystal-600', cat: 'water', brand: 'crystal', name: T('Drinking Water', 'น้ำดื่ม'), price: 7, size: ml(600), pal: ['#35b6e8', '#1276c4', '#ffffff', '#d8eefa'], hero: 'crystalGem', heroOpts: { c1: '#7fd4ff' }, capColor: '#1276c4', ing: ['water'], pop: 3,
    desc: T('Crystal, made by ThaiBev’s Sermsuk, is the market leader in Thai bottled water: a familiar light-blue label in nearly every fridge. Cheap, cold and everywhere.', 'คริสตัลของเสริมสุขในเครือไทยเบฟ เป็นผู้นำตลาดน้ำดื่มของไทย ฉลากสีฟ้าใสที่เห็นได้ในตู้แช่เกือบทุกร้าน ราคาย่อมเยา เย็นชื่นใจ') },
  { id: 'singha-600', cat: 'water', brand: 'singha', name: T('Drinking Water', 'น้ำดื่ม'), price: 7, size: ml(600), pal: ['#153f96', '#081c4d', '#f0c040', '#d8eefa'], hero: 'singhaLion', heroOpts: { c1: '#f0c040', c2: '#c9962a' }, capColor: '#153f96', ing: ['water'], pop: 2,
    desc: T('Singha water carries the same mythical lion as Singha beer; Boon Rawd started bottling water in the early 1980s.', 'น้ำดื่มสิงห์ใช้ตราสิงห์เช่นเดียวกับเบียร์สิงห์ บุญรอดบริวเวอรี่เริ่มผลิตน้ำดื่มตั้งแต่ต้นทศวรรษ 2520') },
  { id: 'minere-600', cat: 'water', brand: 'minere', name: T('Natural Mineral Water', 'น้ำแร่ธรรมชาติ'), price: 12, size: ml(600), pal: ['#18a8b8', '#0a6d8a', '#ffffff', '#d8eefa'], hero: 'mineralPeaks', heroOpts: { c1: '#3f86c8', c2: '#ffffff', c3: '#43c0ff' }, capColor: '#0a6d8a', ing: ['water'], pop: 1,
    desc: T('Minere is Nestlé’s natural mineral water, a step up from plain drinking water and priced accordingly.', 'มิเนเร่ น้ำแร่ธรรมชาติจากเนสท์เล่ ยกระดับจากน้ำดื่มธรรมดา ราคาสูงกว่าน้ำดื่มทั่วไปเล็กน้อย') },
  // ================================================================= SPORTS DRINKS
  { id: 'sponsor-go-420', cat: 'sport', brand: 'sponsor', name: T('Go Original', 'โก ออริจินัล'), sub: T('Electrolyte drink', 'เครื่องดื่มเกลือแร่'), price: 15, size: ml(420), g: 'pet500', style: 'pet', pal: ['#2f8ff0', '#1058c8', '#ffb01f', '#f6d46a'], bg: 'stripes', font: 'lilita', hero: 'isoDropBolt', heroOpts: { c1: '#ffffff', c2: '#ffb01f' }, capColor: '#1058c8', ing: ['water', 'sugar', 'citric', 'electrolyte', 'sodiumcit', 'flavour', 'colour'], nut: N(420, 25, 6, 40), pop: 3,
    desc: T('Osotspa’s Sponsor is one of Thailand’s best-known electrolyte drinks, gulped down after football or on a scorching day. Go is the 420 ml bottle.', 'สปอนเซอร์ เครื่องดื่มเกลือแร่ของโอสถสภาที่คนไทยรู้จักกันดี ดื่มหลังเตะบอลหรือวันที่อากาศร้อนจัด รุ่นโกเป็นขวด 420 มล.') },
  { id: 'gatorade-blue-500', cat: 'sport', brand: 'gatorade', name: T('Blue Blast', 'บลูบลาส'), sub: T('Electrolyte drink', 'เครื่องดื่มเกลือแร่'), price: 25, size: ml(500), g: 'pet500', style: 'pet', pal: ['#1f7be0', '#0a3f9e', '#ff7a00', '#2b8cff'], bg: 'zig', font: 'lilita', hero: 'energyVolt', heroOpts: { c1: '#ff8a00', c2: '#ffffff' }, capColor: '#0a3f9e', ing: ['water', 'sugar', 'citric', 'salt', 'sodiumcit', 'electrolyte', 'flavour', 'colour'], nut: N(500, 24, 6, 45), pop: 2, promo: T('2 for ฿44', '2 ขวด 44 บาท'),
    desc: T('Gatorade is the US sports drink, sold in Thailand by Suntory PepsiCo. The bright-blue Blue Blast stands out in any fridge.', 'เกเตอเรด เครื่องดื่มเกลือแร่จากอเมริกา จัดจำหน่ายในไทยโดยซันโทรี เป๊ปซี่โค กลิ่นบลูบลาสสีฟ้าสดเด่นสะดุดตาในตู้แช่') },
  { id: 'pocari-500', cat: 'sport', brand: 'pocari', name: T('Ion Supply Drink', 'เครื่องดื่มเกลือแร่'), price: 25, size: ml(500), g: 'pet500', style: 'pet', pal: ['#2f7fd8', '#0a4aa6', '#ffffff', '#eaf6ff'], bg: 'waves', font: 'mitr', hero: 'waterSplashDrop', heroOpts: { c1: '#7cc8ff', c2: '#e8f6ff' }, capColor: '#1467c8', ing: ['water', 'sugar', 'fructose', 'fruitjuice', 'salt', 'citric', 'electrolyte', 'vitc', 'flavour'], nut: N(500, 25, 6.2, 49), pop: 2,
    desc: T('Otsuka’s Pocari Sweat is a Japanese “ion supply drink” with a mild, slightly salty-sweet taste. Cold from the chiller, it is a favourite after exercise.', 'โพคารี่ สเวท เครื่องดื่มเกลือแร่จากญี่ปุ่นของโอสึกะ รสอ่อน หวานเค็มนิดๆ ดื่มง่าย แช่เย็นดื่มหลังออกกำลังกายกำลังดี') },
  { id: 'plus100-502', cat: 'sport', brand: 'plus100', name: T('Lemon Lime', 'เลมอนไลม์'), sub: T('Isotonic soda', 'เครื่องดื่มเกลือแร่อัดลม'), price: 20, size: ml(502), g: 'pet500', style: 'pet', pal: ['#3bb54a', '#0f7a2e', '#ffe000', '#dff2c8'], bg: 'dots', font: 'lilita', hero: 'citrusFizz', heroOpts: { c1: '#8fd43a', c2: '#ffe13a' }, capColor: '#0f7a2e', ing: ['water', 'sugar', 'co2', 'citric', 'sodiumcit', 'electrolyte', 'flavour', 'sweet'], nut: N(502, 27, 6, 30), pop: 1,
    desc: T('100PLUS is the isotonic brand from F&N, born in Malaysia and Singapore in 1983. In Thailand it is sold as a fizzy electrolyte soda.', '100 พลัส เครื่องดื่มไอโซโทนิกจากเอฟแอนด์เอ็น กำเนิดในมาเลเซียและสิงคโปร์เมื่อปี 2526 ในไทยขายเป็นโซดาเกลือแร่อัดลม') },
  { id: 'sponsor-active-c-250', cat: 'sport', brand: 'sponsor', name: T('Active Vitamin C', 'แอคทีฟ วิตามินซี'), sub: T('Electrolyte drink', 'เครื่องดื่มเกลือแร่'), price: 15, size: ml(250), g: 'pet250', style: 'pet', pal: ['#ff9a2a', '#e05a0a', '#ffffff', '#ffc061'], bg: 'dots', font: 'lilita', hero: 'sodaOrange', heroOpts: { c1: '#ff9a1f' }, capColor: '#e05a0a', ing: ['water', 'sugar', 'vitc', 'citric', 'electrolyte', 'flavour', 'colour'], nut: N(250, 30, 7, 40), pop: 1,
    desc: T('A vitamin C version of Sponsor in a small 250 ml bottle, for anyone who wants a little extra with their electrolytes.', 'สปอนเซอร์สูตรเสริมวิตามินซี ในขวดเล็ก 250 มล. สำหรับคนที่อยากได้วิตามินเพิ่มไปกับเกลือแร่') },

  // ================================================================= SOFT DRINKS (1.25-1.45 L first, then 545-345 ml PET, then cans)
  { id: 'pepsi-1450', cat: 'soda', brand: 'pepsi', name: T('Cola', 'โคล่า'), sub: T('Cola soft drink', 'น้ำอัดลมกลิ่นโคล่า'), price: 30, size: L(1.45), g: 'pet1250', style: 'pet', pal: ['#0d55b8', '#062c6b', '#e32636', '#2a1206'], bg: 'waves', font: 'lilita', hero: 'colaFizz', heroOpts: { c1: '#3a1a08', c2: '#c98a4a' }, capColor: '#0a4aa6', ing: ['water', 'sugar', 'co2', 'caramel', 'phosphoric', 'caffeine', 'flavour'], nut: N(1450, 42, 10.6, 6), pop: 2,
    desc: T('The family-size Pepsi for the middle of the table, poured over a full glass of ice. Suntory PepsiCo runs Pepsi in Thailand.', 'เป๊ปซี่ขวดใหญ่ 1.45 ลิตร สำหรับวางกลางโต๊ะกินข้าวด้วยกัน รินใส่น้ำแข็งเต็มแก้ว จัดจำหน่ายโดยซันโทรี เป๊ปซี่โค เบเวอเรจ') },
  { id: 'coke-1250', cat: 'soda', brand: 'coke', name: T('Original Taste', 'รสต้นตำรับ'), sub: T('Cola soft drink', 'น้ำอัดลมกลิ่นโคล่า'), price: 29, size: L(1.25), g: 'pet1250', style: 'pet', pal: ['#e41e2b', '#a10f1a', '#ffffff', '#2a1206'], bg: 'waves', font: 'mitr', hero: 'contourBottle', heroOpts: { c1: '#2a1206', c2: '#e41e2b' }, capColor: '#e41e2b', ing: ['water', 'sugar', 'co2', 'caramel', 'phosphoric', 'caffeine', 'flavour'], nut: N(1250, 42, 10.6, 6), pop: 2,
    desc: T('The big Coke that goes to parties. Thai party hosts love pairing it with Sang Som rum, ice and a pile of snacks.', 'โค้กขวดใหญ่ 1.25 ลิตร ของคู่โต๊ะปาร์ตี้ คนไทยนิยมผสมกับแสงโสม ใส่น้ำแข็งเต็มแก้ว เสิร์ฟพร้อมกับแกล้ม') },
  { id: 'pepsi-545', cat: 'soda', brand: 'pepsi', name: T('Cola', 'โคล่า'), sub: T('Cola soft drink', 'น้ำอัดลมกลิ่นโคล่า'), price: 17, size: ml(545), g: 'pet500', style: 'pet', pal: ['#0d55b8', '#062c6b', '#e32636', '#2a1206'], bg: 'waves', font: 'lilita', hero: 'colaFizz', heroOpts: { c1: '#3a1a08', c2: '#c98a4a' }, capColor: '#0a4aa6', ing: ['water', 'sugar', 'co2', 'caramel', 'phosphoric', 'caffeine', 'flavour'], nut: N(545, 42, 10.6, 6), pop: 3, promo: T('2 for ฿32', '2 ขวด 32 บาท'),
    desc: T('At 545 ml, the everyday Pepsi is big enough for a whole meal and cheap enough not to think twice.', 'เป๊ปซี่ขวด 545 มล. ขนาดยอดนิยม ดื่มได้ตลอดมื้ออาหาร ราคาเบาๆ ไม่ต้องคิดมาก') },
  { id: 'coke-500', cat: 'soda', brand: 'coke', name: T('Original Taste', 'รสต้นตำรับ'), sub: T('Cola soft drink', 'น้ำอัดลมกลิ่นโคล่า'), price: 18, size: ml(500), g: 'pet500', style: 'pet', pal: ['#e41e2b', '#a10f1a', '#ffffff', '#2a1206'], bg: 'waves', font: 'mitr', hero: 'contourBottle', heroOpts: { c1: '#2a1206', c2: '#e41e2b' }, capColor: '#e41e2b', ing: ['water', 'sugar', 'co2', 'caramel', 'phosphoric', 'caffeine', 'flavour'], nut: N(500, 42, 10.6, 6), pop: 3,
    desc: T('Coca-Cola is bottled in Thailand by Thai Namthip. The 500 ml PET is the classic partner for a plate of rice or a fried-chicken set.', 'โค้กในประเทศไทยผลิตโดยไทยน้ำทิพย์ ขวด PET 500 มล. เป็นคู่หูคลาสสิกของข้าวจานเดียวและไก่ทอด') },
  { id: 'fanta-red-500', cat: 'soda', brand: 'fanta', name: T('Strawberry', 'น้ำแดง'), sub: T('Strawberry soft drink', 'น้ำอัดลมกลิ่นสตรอว์เบอร์รี'), price: 18, size: ml(500), g: 'pet500', style: 'pet', pal: ['#f03a2c', '#b01418', '#ffd400', '#e0202a'], bg: 'dots', font: 'lilita', hero: 'strawberry', heroOpts: { c1: '#ee2b45' }, capColor: '#e8252a', ing: ['water', 'sugar', 'co2', 'citric', 'flavour', 'colour', 'preserv'], nut: N(500, 46, 11.5, 8), pop: 2,
    desc: T('In Thailand red Fanta is simply “nam daeng”, red water: a very sweet strawberry-flavoured fizz with a nostalgic bright-red colour.', 'แฟนต้า น้ำแดง กลิ่นสตรอว์เบอร์รี หวานซ่า สีแดงสด เป็นน้ำอัดลมที่คนไทยเรียกติดปากว่า “น้ำแดง”') },
  { id: 'fanta-green-500', cat: 'soda', brand: 'fanta', name: T('Green Cream Soda', 'น้ำเขียว'), sub: T('Cream soda soft drink', 'น้ำอัดลมกลิ่นครีมโซดา'), price: 18, size: ml(500), g: 'pet500', style: 'pet', pal: ['#3fb24a', '#17762a', '#ffe600', '#5fd35a'], bg: 'dots', font: 'lilita', hero: 'creamFloat', heroOpts: { c1: '#54d46a' }, capColor: '#2f9e3f', ing: ['water', 'sugar', 'co2', 'citric', 'flavour', 'colour', 'preserv'], nut: N(500, 46, 11.5, 8), pop: 2,
    desc: T('Green Fanta, “nam khiao”, is a cream-soda-flavoured fizz, the green half of the Thai red-and-green soda pair. Some shops top it with ice cream.', 'แฟนต้า น้ำเขียว รสครีมโซดา หอมหวานซ่า สีเขียวสดใส คู่กับน้ำแดง บางร้านนำไปราดไอศกรีมกินเป็นครีมโซดา') },
  { id: 'sprite-500', cat: 'soda', brand: 'sprite', name: T('Lemon-Lime', 'กลิ่นเลมอนไลม์'), sub: T('Lemon-lime soft drink', 'น้ำอัดลมกลิ่นเลมอนไลม์'), price: 18, size: ml(500), g: 'pet500', style: 'pet', pal: ['#12a24a', '#07692d', '#d9ee2a', '#e6f7e6'], bg: 'rays', font: 'lilita', hero: 'citrusFizz', heroOpts: { c1: '#8fd43a', c2: '#ffe13a' }, capColor: '#12a24a', ing: ['water', 'sugar', 'co2', 'citric', 'sodiumcit', 'flavour', 'preserv'], nut: N(500, 40, 10, 10), pop: 2,
    desc: T('Sprite is the crisp, clear lemon-lime soda from Coca-Cola, the one to cut through a plate of fried food.', 'สไปรท์ น้ำอัดลมกลิ่นเลมอนไลม์ใสๆ ซ่าเย็นสดชื่น ดื่มแก้เลี่ยนคู่กับของทอด') },
  { id: 'est-490', cat: 'soda', brand: 'est', name: T('Cola', 'โคล่า'), sub: T('Cola soft drink', 'น้ำอัดลมกลิ่นโคล่า'), price: 15, size: ml(490), g: 'pet500', style: 'pet', pal: ['#d8232f', '#7c0d18', '#ffffff', '#2a1206'], bg: 'stripes', font: 'lilita', hero: 'colaFizz', heroOpts: { c1: '#3a1a08', c2: '#c98a4a' }, capColor: '#c8102e', ing: ['water', 'sugar', 'co2', 'caramel', 'phosphoric', 'caffeine', 'flavour'], nut: N(490, 42, 10.5, 6), pop: 2, promo: T('2 for ฿28', '2 ขวด 28 บาท'),
    desc: T('Est Cola is Thailand’s home-grown cola, launched in 2012 by Sermsuk and now part of ThaiBev.', 'เอส โคล่า น้ำอัดลมโคล่าสัญชาติไทย เปิดตัวเมื่อปี 2555 โดยเสริมสุข ปัจจุบันอยู่ในเครือไทยเบฟ') },
  { id: '7up-545', cat: 'soda', brand: 'sevenup', name: T('Lemon-Lime', 'กลิ่นเลมอนไลม์'), sub: T('Lemon-lime soft drink', 'น้ำอัดลมกลิ่นเลมอนไลม์'), price: 17, size: ml(545), g: 'pet500', style: 'pet', pal: ['#00a651', '#00733a', '#ffe000', '#e6f7e6'], bg: 'dots', font: 'lilita', hero: 'citrusFizz', heroOpts: { c1: '#8fd43a', c2: '#ffe13a' }, capColor: '#00a651', ing: ['water', 'sugar', 'co2', 'citric', 'sodiumcit', 'flavour', 'preserv'], nut: N(545, 40, 10, 10), pop: 1,
    desc: T('7UP is a clear, caffeine-free lemon-lime soda, Pepsi’s answer to Sprite.', 'เซเว่นอัพ น้ำอัดลมกลิ่นเลมอนไลม์ใส ไม่มีคาเฟอีน ซ่าเย็นสดชื่น เป็นคู่แข่งของสไปรท์ในตลาดน้ำอัดลมไทย') },
  { id: 'mirinda-orange-545', cat: 'soda', brand: 'mirinda', name: T('Orange', 'กลิ่นส้ม'), sub: T('Orange soft drink', 'น้ำอัดลมกลิ่นส้ม'), price: 17, size: ml(545), g: 'pet500', style: 'pet', pal: ['#ff8a00', '#d95a00', '#ffffff', '#ff9a1f'], bg: 'burst', font: 'lilita', hero: 'sodaOrange', heroOpts: { c1: '#ff9a1f' }, capColor: '#e86a00', ing: ['water', 'sugar', 'co2', 'citric', 'orange', 'flavour', 'colour', 'preserv'], nut: N(545, 46, 11.5, 8), pop: 1,
    desc: T('Mirinda’s Thai range runs from orange to strawberry, green cream soda and root beer; orange is the bright, classic one.', 'มิรินด้า กลิ่นส้ม น้ำอัดลมสีส้มสดจากซันโทรี เป๊ปซี่โค มีให้เลือกหลายรส ทั้งส้ม สตรอว์เบอร์รี ครีมโซดาเขียว และรูทเบียร์') },
  { id: 'pepsi-345', cat: 'soda', brand: 'pepsi', name: T('Cola', 'โคล่า'), sub: T('Cola soft drink', 'น้ำอัดลมกลิ่นโคล่า'), price: 13, size: ml(345), g: 'pet345', style: 'pet', pal: ['#0d55b8', '#062c6b', '#e32636', '#2a1206'], bg: 'waves', font: 'lilita', hero: 'colaFizz', heroOpts: { c1: '#3a1a08', c2: '#c98a4a' }, capColor: '#0a4aa6', ing: ['water', 'sugar', 'co2', 'caramel', 'phosphoric', 'caffeine', 'flavour'], nut: N(345, 42, 10.6, 6), pop: 2,
    desc: T('The slim 345 ml Pepsi is the cheap-and-cheerful size for one quick drink on the go.', 'เป๊ปซี่ขวดเพรียว 345 มล. ขนาดเล็กราคาสบายกระเป๋า หยิบดื่มระหว่างทางได้ทันที') },
  { id: 'mirinda-salted-lemon-345', cat: 'soda', brand: 'mirinda', name: T('Salted Lemon Soda', 'ซอลต์เลมอนโซดา'), sub: T('Lemon soda', 'น้ำอัดลมกลิ่นเลมอน'), price: 13, size: ml(345), g: 'pet345', style: 'pet', pal: ['#f6d31a', '#c9a500', '#1f9d55', '#f6f1b5'], bg: 'rays', font: 'lilita', hero: 'citrusFizz', heroOpts: { c1: '#8fd43a', c2: '#ffe13a' }, capColor: '#1f9d55', ing: ['water', 'sugar', 'co2', 'salt', 'citric', 'lemon', 'flavour'], nut: N(345, 40, 10, 40), pop: 1,
    desc: T('Thais love salted lime soda (manao soda); this Mirinda bottles the tangy, lightly salty idea.', 'มิรินด้า ซอลต์เลมอนโซดา ตีความเมนูมะนาวโซดายอดฮิตของไทยเป็นน้ำอัดลมพร้อมดื่ม เปรี้ยวซ่า เค็มนิดๆ') },
  { id: 'sarsi-250', cat: 'soda', brand: 'sarsi', name: T('Root Beer', 'รูทเบียร์'), sub: T('Root beer soft drink', 'น้ำอัดลมกลิ่นรูทเบียร์'), price: 15, size: ml(250), g: 'glass300', style: 'pet', pal: ['#8a2c16', '#3d1409', '#f3e2b3', '#2e1208'], bg: 'zig', font: 'lilita', hero: 'rootBeerFoam', heroOpts: { c1: '#4a2210', c2: '#fff4d8' }, capColor: '#c8102e', ing: ['water', 'sugar', 'co2', 'caramel', 'citric', 'flavour', 'preserv'], nut: N(250, 45, 11, 12), pop: 1,
    desc: T('Sarsi is a legendary Thai root beer that came back in 2018 under ThaiBev, known for its foamy fizz and a taste unlike any cola. It comes in a small non-returnable glass bottle.', 'ซาสี่ รูทเบียร์ในตำนาน กลับมาอีกครั้งเมื่อปี 2561 ภายใต้ไทยเบฟ โดดเด่นด้วยโฟมซ่าและรสชาติที่ไม่เหมือนน้ำอัดลมทั่วไป บรรจุขวดแก้วเล็กแบบไม่คืนขวด') },
  { id: 'singha-soda-325', cat: 'soda', brand: 'singha', name: T('Soda Water', 'น้ำโซดา'), sub: T('Mixer', 'สำหรับผสมเครื่องดื่ม'), price: 10, size: ml(325), g: 'glass300', style: 'pet', pal: ['#173a8a', '#0a1c4d', '#f3c11b', '#e3eef8'], bg: 'rays', font: 'mitr', hero: 'singhaLion', heroOpts: { c1: '#f0c040', c2: '#c9962a' }, capColor: '#f0c040', ing: ['water', 'co2', 'sodiumb'], nut: [0, 0, 0, 30], pop: 2,
    desc: T('Singha Soda is the classic Thai mixer: a small glass bottle of plain fizz that sits on countless restaurant tables next to the whisky and the ice bucket.', 'โซดาสิงห์ ตัวแทนโซดาผสมเครื่องดื่มของไทย ขวดแก้วเล็กซ่าใส ตั้งข้างขวดเหล้าและถังน้ำแข็งบนโต๊ะอาหารทั่วประเทศ') },
  { id: 'chang-soda-325', cat: 'soda', brand: 'chang', name: T('Soda Water', 'น้ำโซดา'), sub: T('Mixer', 'สำหรับผสมเครื่องดื่ม'), price: 10, size: ml(325), g: 'glass300', style: 'pet', pal: ['#0f5a3a', '#063523', '#f1c40f', '#e3f0e8'], bg: 'rays', font: 'mitr', hero: 'elephant', heroOpts: { c1: '#f4f0e6' }, capColor: '#f1c40f', ing: ['water', 'co2', 'sodiumb'], nut: [0, 0, 0, 30], pop: 1,
    desc: T('Chang Soda is ThaiBev’s sparkling, unsweetened soda water, made for mixing with whisky or rum.', 'โซดาช้าง โซดาซ่าใส ไม่หวาน ของไทยเบฟ เหมาะสำหรับผสมเหล้าหรือดื่มเพื่อความสดชื่น') },
  { id: 'pepsi-can-325', cat: 'soda', brand: 'pepsi', name: T('Cola', 'โคล่า'), sub: T('Cola soft drink', 'น้ำอัดลมกลิ่นโคล่า'), price: 17, size: ml(325), g: 'can330', style: 'can', pal: ['#0d55b8', '#062c6b', '#e32636', '#111111'], bg: 'waves', font: 'lilita', hero: 'colaFizz', heroOpts: { c1: '#3a1a08', c2: '#c98a4a' }, ing: ['water', 'sugar', 'co2', 'caramel', 'phosphoric', 'caffeine', 'flavour'], nut: N(325, 42, 10.6, 6), pop: 2,
    desc: T('A 325 ml can of Pepsi: ice-cold, sweet and gone in a few gulps.', 'เป๊ปซี่กระป๋อง 325 มล. เย็นจัด หวานซ่า ดื่มเพลินหมดกระป๋องในไม่กี่อึก') },
  { id: 'pepsi-max-lime-can-325', cat: 'soda', brand: 'pepsi', name: T('Max Lime', 'แม็กซ์ ไลม์'), sub: T('No sugar', 'ไม่มีน้ำตาล'), price: 17, size: ml(325), g: 'can330', style: 'can', pal: ['#141b2b', '#05080f', '#a6ce39', '#111111'], bg: 'stripes', font: 'lilita', hero: 'citrusFizz', heroOpts: { c1: '#8fd43a', c2: '#ffe13a' }, ing: ['water', 'co2', 'caramel', 'phosphoric', 'citric', 'caffeine', 'sweet', 'flavour'], nut: [0, 0, 0, 20], pop: 1,
    desc: T('Pepsi Max Lime is the no-sugar cola with a squeeze of lime, sold in Thailand in a black can.', 'เป๊ปซี่ แม็กซ์ ไลม์ น้ำอัดลมกลิ่นโคล่าผสมไลม์ ไม่มีน้ำตาล สดชื่นซ่า ในกระป๋องสีดำ') },
  { id: 'coke-zero-can-325', cat: 'soda', brand: 'coke', name: T('Zero Sugar', 'ไม่มีน้ำตาล'), sub: T('Cola soft drink', 'น้ำอัดลมกลิ่นโคล่า'), price: 19, size: ml(325), g: 'can330', style: 'can', pal: ['#1c1c1e', '#000000', '#e41e2b', '#111111'], bg: 'rays', font: 'lilita', hero: 'contourBottle', heroOpts: { c1: '#3a3a3e', c2: '#e41e2b' }, ing: ['water', 'co2', 'caramel', 'phosphoric', 'sweet', 'caffeine', 'flavour', 'acidreg'], nut: [0, 0, 0, 20], pop: 2,
    desc: T('Coca-Cola without the sugar, in a black can. The Thai label spells it out as “mai mee nam tan” — no sugar.', 'โค้กสูตรไม่มีน้ำตาลในกระป๋องสีดำ รสชาติใกล้เคียงโค้กต้นตำรับ บนฉลากภาษาไทยเขียนว่า “ไม่มีน้ำตาล”') },
  { id: 'fanta-orange-can-325', cat: 'soda', brand: 'fanta', name: T('Orange', 'น้ำส้ม'), sub: T('Orange soft drink', 'น้ำอัดลมกลิ่นส้ม'), price: 17, size: ml(325), g: 'can330', style: 'can', pal: ['#ff8a00', '#d95a00', '#ffffff', '#111111'], bg: 'dots', font: 'lilita', hero: 'sodaOrange', heroOpts: { c1: '#ff9a1f' }, ing: ['water', 'sugar', 'co2', 'citric', 'orange', 'flavour', 'colour', 'preserv'], nut: N(325, 46, 11.5, 8), pop: 1,
    desc: T('Fanta Orange, sold in Thailand as “nam som”, sits next to the red and green flavours in the cooler.', 'แฟนต้า น้ำส้ม กลิ่นส้มหวานซ่า สีส้มสด วางคู่กับน้ำแดงและน้ำเขียวในตู้แช่') },
  { id: 'schweppes-soda-can-330', cat: 'soda', brand: 'schweppes', name: T('Soda Water', 'น้ำโซดา'), sub: T('Mixer', 'สำหรับผสมเครื่องดื่ม'), price: 16, size: ml(330), g: 'can330', style: 'can', pal: ['#22305e', '#0a1230', '#f3c11b', '#111111'], bg: 'plain', font: 'chonburi', hero: 'highballFizz', heroOpts: { c1: '#cfeaf7', c2: '#ffe13a' }, ing: ['water', 'co2', 'sodiumb'], nut: [0, 0, 0, 30], pop: 1,
    desc: T('Schweppes is the classic mixer soda. Thais pour it over ice with whisky, or add a squeeze of lime for a home-made manao soda.', 'ชเวปส์ น้ำโซดาซ่าใส ไม่หวาน ใช้ผสมเหล้าเสิร์ฟกับน้ำแข็ง หรือบีบมะนาวเพิ่มเป็นมะนาวโซดาแบบทำเองที่บ้าน') },
  { id: 'schweppes-manao-soda-can-330', cat: 'soda', brand: 'schweppes', name: T('Lime Soda', 'มะนาวโซดา'), sub: T('Lime soda', 'โซดากลิ่นมะนาว'), price: 16, size: ml(330), g: 'can330', style: 'can', pal: ['#2f9e44', '#12532a', '#f3c11b', '#111111'], bg: 'dots', font: 'chonburi', hero: 'citrusFizz', heroOpts: { c1: '#8fd43a', c2: '#ffe13a' }, ing: ['water', 'sugar', 'co2', 'lime', 'citric', 'flavour'], nut: N(330, 30, 7.5, 15), pop: 1,
    desc: T('Schweppes Manao Soda is a ready-made take on the Thai lime-soda classic: tart, fizzy and easy to drink without squeezing your own limes.', 'ชเวปส์ มะนาวโซดา เครื่องดื่มโซดารสมะนาวพร้อมดื่ม เปรี้ยวซ่า ดื่มง่ายโดยไม่ต้องบีบมะนาวเอง') },
  { id: 'singha-lemon-soda-can-330', cat: 'soda', brand: 'singha', name: T('Lemon Soda', 'เลมอนโซดา'), sub: T('Lemon soda', 'โซดากลิ่นเลมอน'), price: 14, size: ml(330), g: 'can330', style: 'can', pal: ['#173a8a', '#0a1c4d', '#f3c11b', '#111111'], bg: 'rays', font: 'mitr', hero: 'singhaLion', heroOpts: { c1: '#f0c040', c2: '#c9962a' }, ing: ['water', 'sugar', 'co2', 'citric', 'lemon', 'flavour'], nut: N(330, 20, 5, 15), pop: 1,
    desc: T('Singha’s lemon soda adds a citrus hint to the famous Singha soda water, a mixer found on many Thai drinking tables.', 'สิงห์ เลมอนโซดา โซดาสิงห์ผสมกลิ่นเลมอน ซ่าจัด เปรี้ยวนิดๆ ดื่มเปล่าๆ หรือผสมเหล้าก็เข้ากัน') },
  { id: 'm150-150', cat: 'energy', brand: 'm150', name: T('Energy Drink', 'เครื่องดื่มชูกำลัง'), price: 12, size: ml(150), g: 'glass150', style: 'energy', capColor: '#d9a83a', pal: ['#ffd400', '#d81f26', '#d81f26', '#5a2c0d'], hero: 'energyVolt', heroOpts: { c1: '#d81f26', c2: '#fff2a0' }, ing: ['water', 'sugar', 'honey', 'taurine', 'caffeine', 'inositol', 'niacin', 'vitb'], pop: 3, promo: T('2 for ฿22', '2 ขวด 22 บาท'),
    desc: T('Osotspa’s M-150 has been sold in a small brown glass bottle for almost 40 years. It is sweet, non-fizzy and best knocked back cold in a couple of gulps.', 'เอ็ม-150 ของโอสถสภา ขายมานานเกือบ 40 ปี บรรจุขวดแก้วสีชาใบเล็ก ไม่อัดลม หวานหอม ดื่มเย็นๆ ได้ในไม่กี่อึก') },
  { id: 'krating-daeng-150', cat: 'energy', brand: 'kratingdaeng', name: T('Classic Formula', 'สูตรคลาสสิค'), price: 12, size: ml(150), g: 'glass150', style: 'energy', capColor: '#d9a83a', pal: ['#a80f1c', '#f2c14e', '#f2c14e', '#5a2c0d'], hero: 'bullsSun', heroOpts: { c1: '#e0261c', c2: '#ffc21a', wide: true, plate: '#f7ecc8', ring: '#f2c14e' }, ing: ['water', 'sugar', 'taurine', 'caffeine', 'inositol', 'niacin', 'vitb'], pop: 3,
    desc: T('Krating Daeng, “red gaur” (a wild Asian bull), is the Thai original that inspired Red Bull. It is still non-fizzy and syrupy-sweet, in a small brown bottle.', 'กระทิงแดง ต้นตำรับเครื่องดื่มชูกำลังของไทยที่เป็นแรงบันดาลใจให้เรดบูล ยังคงไม่อัดลม หวานเข้มข้น ในขวดแก้วสีชาใบเล็ก') },
  { id: 'carabao-dang-150', cat: 'energy', brand: 'carabao', name: T('Energy Drink', 'เครื่องดื่มชูกำลัง'), price: 10, size: ml(150), g: 'glass150', style: 'energy', capColor: '#d9a83a', pal: ['#d9111c', '#ffd400', '#ffd400', '#5a2c0d'], hero: 'buffaloHead', heroOpts: { c1: '#ffd400', c2: '#fff3cf' }, ing: ['water', 'sugar', 'taurine', 'caffeine', 'inositol', 'niacin', 'vitb'], pop: 2,
    desc: T('Carabao Dang, “red water buffalo”, is named after the Thai rock band Carabao and launched in 2002. It is Thailand’s second most popular energy drink.', 'คาราบาวแดง ตั้งชื่อตามวงคาราบาว เปิดตัวเมื่อปี 2545 เป็นเครื่องดื่มชูกำลังอันดับสองของตลาดไทย') },
  { id: 'lipovitan-d-100', cat: 'energy', brand: 'lipo', name: T('Energy Drink', 'เครื่องดื่มชูกำลัง'), price: 12, size: ml(100), g: 'glass100', style: 'energy', capColor: '#d9a83a', pal: ['#ffffff', '#00a04a', '#ffd400', '#5a2c0d'], hero: 'tonicBadge', heroOpts: { c1: '#ffd400', c2: '#00a04a', text: 'D' }, ing: ['water', 'sugar', 'taurine', 'caffeine', 'inositol', 'niacin', 'vitb', 'acidreg'], pop: 2,
    desc: T('Lipovitan-D comes from Japan’s Taisho Pharmaceutical and is made in Thailand by Osotspa. A little 100 ml bottle with 1,000 mg of taurine.', 'ลิโพวิตัน-ดี จากไทโชฟาร์มาซูติคอลของญี่ปุ่น ผลิตในไทยโดยโอสถสภา ขวดเล็ก 100 มล. มีทอรีน 1,000 มก.') },
  { id: 'shark-150', cat: 'energy', brand: 'shark', name: T('Energy Drink', 'เครื่องดื่มชูกำลัง'), price: 12, size: ml(150), g: 'glass150', style: 'energy', capColor: '#d9a83a', pal: ['#0a2a5e', '#00d0f0', '#00e0ff', '#5a2c0d'], hero: 'sharkBite', heroOpts: { c1: '#3d7fd0', c2: '#e9f6ff' }, ing: ['water', 'sugar', 'taurine', 'caffeine', 'inositol', 'niacin', 'vitb'], pop: 1,
    desc: T('Shark is another Osotspa energy drink, in a 150 ml glass bottle with a snarling shark on the label.', 'ชาร์ค เครื่องดื่มชูกำลังอีกแบรนด์ของโอสถสภา ขวดแก้ว 150 มล. ฉลากรูปฉลามดุดัน') },
  { id: 'm150-b12-150', cat: 'energy', brand: 'm150', name: T('Hi Vitamin B12', 'ไฮวิตามินบี12'), price: 12, size: ml(150), g: 'glass150', style: 'energy', capColor: '#d9a83a', pal: ['#141414', '#ffcc00', '#ffcc00', '#5a2c0d'], hero: 'tonicBadge', heroOpts: { c1: '#ffcc00', c2: '#d81f26', text: 'B12' }, ing: ['water', 'sugar', 'taurine', 'caffeine', 'inositol', 'niacin', 'vitb12'], pop: 1,
    desc: T('An M-150 with extra vitamin B12, in the same little brown glass bottle as the original.', 'เอ็ม-150 สูตรเพิ่มวิตามินบี 12 ในขวดแก้วสีชาใบเล็กเหมือนเอ็ม-150 ปกติ') },
  { id: 'redbull-can-250', cat: 'energy', brand: 'redbull', name: T('Energy Drink', 'เครื่องดื่มชูกำลัง'), price: 20, size: ml(250), g: 'can250', style: 'can', pal: ['#dbe3f2', '#2b4a9c', '#ffd400', '#c0c8d8'], bg: 'stripes', font: 'archivo', hero: 'bullsSun', heroOpts: { c1: '#e0261c', c2: '#ffc21a' }, ing: ['water', 'sugar', 'co2', 'taurine', 'glucuronolactone', 'caffeine', 'inositol', 'niacin', 'vitb', 'acidreg'], nut: [110, 27, 0, 100], pop: 2,
    desc: T('The sparkling Red Bull is a cousin of the Thai Krating Daeng: same red bulls, but fizzy and sold in a slim silver-and-blue can.', 'เรดบูลชนิดอัดลม ญาติของกระทิงแดงต้นตำรับ ตราวัวแดงสองตัวเหมือนกัน แต่ซ่ากว่าและบรรจุในกระป๋องสีเงินน้ำเงินทรงเพรียว') },
  { id: 'carabao-can-330', cat: 'energy', brand: 'carabao', name: T('Sparkling', 'อัดก๊าซ'), sub: T('Energy drink', 'เครื่องดื่มชูกำลัง'), price: 17, size: ml(330), g: 'can330', style: 'can', pal: ['#d9111c', '#7a0710', '#ffd400', '#111111'], bg: 'rays', font: 'anton', hero: 'buffaloHead', heroOpts: { c1: '#ffd400', c2: '#fff3cf' }, ing: ['water', 'sugar', 'co2', 'taurine', 'caffeine', 'inositol', 'niacin', 'vitb'], nut: [63, 15, 0, 60], pop: 1,
    desc: T('Carabao also makes a carbonated version in a 330 ml can, for people who like their energy drink fizzy.', 'คาราบาวยังมีรุ่นอัดก๊าซในกระป๋อง 330 มล. สำหรับคนที่ชอบเครื่องดื่มชูกำลังแบบซ่า') },
  { id: 'sting-strawberry-250', cat: 'energy', brand: 'sting', name: T('Strawberry Blast', 'รสสตรอว์เบอร์รี'), price: 15, size: ml(250), g: 'pet250', style: 'pet', pal: ['#e0202a', '#8f0f14', '#ffd400', '#c8161d'], bg: 'zig', font: 'lilita', hero: 'strawberry', heroOpts: { c1: '#ff3b4a' }, capColor: '#e0202a', ing: ['water', 'sugar', 'co2', 'citric', 'taurine', 'caffeine', 'inositol', 'vitb', 'flavour', 'colour'], nut: N(250, 45, 11, 20), pop: 2,
    desc: T('Sting is the fizzy energy drink from Suntory PepsiCo; the red Strawberry Blast is the sweet one in the 250 ml PET bottle.', 'สติงค์ เครื่องดื่มชูกำลังแบบซ่าจากซันโทรี เป๊ปซี่โค รสสตรอว์เบอร์รีหวานซ่าในขวด PET 250 มล.') },
  { id: 'sting-original-boost-250', cat: 'energy', brand: 'sting', name: T('Original Boost', 'ออริจินัล บูสท์'), price: 15, size: ml(250), g: 'pet250', style: 'pet', pal: ['#f0b400', '#9a6a00', '#1a1a1a', '#e8a800'], bg: 'rays', font: 'lilita', hero: 'energyVolt', heroOpts: { c1: '#ffe14a', c2: '#ffffff' }, capColor: '#f0b400', ing: ['water', 'sugar', 'co2', 'citric', 'taurine', 'caffeine', 'inositol', 'vitb', 'flavour', 'colour'], nut: N(250, 45, 11, 20), pop: 1, isNew: true,
    desc: T('Sting Original Boost is the newer mixed-fruit fizz in a gold bottle, launched in Thailand in 2025.', 'สติงค์ ออริจินัล บูสท์ รสผลไม้รวมแบบซ่า ในขวดสีทอง เปิดตัวในไทยปี 2568') },
];

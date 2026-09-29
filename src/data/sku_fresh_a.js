// Fresh food, part A: the chilled ready meals (กะเพรา, ข้าวมันไก่, แกง, ผัดไทย ...), sandwiches & onigiri, the freezer
// meals and everything on the hot counter (steamer / roller grill / hot case) of a Bangkok 7-Eleven.
//
//   cat 'meal'      (19)  chilled trays: tray-meal, tray-salad (congee, som tam, yam), tray-onigiri (boiled eggs)
//   cat 'sandwich'  (11)  tray-sand sandwiches + tray-onigiri rice balls
//   cat 'frozen'    (3)   tray-meal dumplings / rice meal for the freezer bays
//   cat 'hot'       (13)  bag-bun packs: steamer (5), roller grill (4), hot case (4)
//
// Everything is procedural. The "photo" on each tray lid and hot pack is painted by the four hero illustrations
// exported below (faDish, faSand, faOnigiri, faHot - prefixed `fa` so they cannot clash with another module's keys),
// selected per SKU with heroOpts.kind. All drawing is seeded, so a texture repaints identically after a language
// switch.
//
// Conventions
//  - Long Thai tray names carry a manual line break (\n) at a natural phrase boundary, so the lid sticker wraps
//    there in Thai and bilingual mode instead of splitting a word ("ข้าวกะเพรา / ไก่ไข่ดาว").
//  - Each list is sorted most-popular first (end of file): the planogram stocks in that order.
//  - The counter's hot case is a single 57 cm shelf, which holds four bag-bun SKUs; steamer and grill have room to spare.
import { g, pc, T } from './sku_util.js';
import { circle, ellipse, fillRR, poly, linGrad, radGrad } from '../gfx/draw.js';
import { darken, lighten, mix, rng, TAU } from '../core/util.js';

// ------------------------------------------------------------------------------------------------ extra ingredients
export const ingredients = {
  oystersauce: { en: 'Oyster sauce', th: 'ซอสหอยนางรม' },
  longbean: { en: 'Yardlong beans', th: 'ถั่วฝักยาว' },
  cucumber: { en: 'Cucumber', th: 'แตงกวา' },
  ginger: { en: 'Ginger', th: 'ขิง' },
  pepper: { en: 'Black pepper', th: 'พริกไทย' },
  stock: { en: 'Chicken stock', th: 'น้ำซุปไก่' },
  bacon: { en: 'Bacon', th: 'เบคอน' },
  mushroom: { en: 'Mushroom', th: 'เห็ด' },
  eggplant: { en: 'Thai eggplant', th: 'มะเขือเปราะ' },
  ricenoodle: { en: 'Rice noodles', th: 'เส้นก๋วยเตี๋ยว' },
  glassnoodle: { en: 'Glass noodles', th: 'วุ้นเส้น' },
  beansprout: { en: 'Bean sprouts', th: 'ถั่วงอก' },
  tofu: { en: 'Tofu', th: 'เต้าหู้' },
  kale: { en: 'Chinese kale', th: 'คะน้า' },
  pasta: { en: 'Spaghetti', th: 'สปาเกตตี' },
  driedshrimp: { en: 'Dried shrimp', th: 'กุ้งแห้ง' },
  porkbelly: { en: 'Crispy pork belly', th: 'หมูสามชั้นทอดกรอบ' },
  teriyaki: { en: 'Teriyaki sauce', th: 'ซอสเทอริยากิ' },
  salmon: { en: 'Salmon', th: 'ปลาแซลมอน' },
  crabstick: { en: 'Crab stick (surimi)', th: 'ปูอัด' },
  lettuce: { en: 'Lettuce', th: 'ผักกาดหอม' },
  blacksesame: { en: 'Black sesame', th: 'งาดำ' },
  custard: { en: 'Custard cream', th: 'ครีมคัสตาร์ด' },
  springwrap: { en: 'Spring roll wrapper', th: 'แผ่นปอเปี๊ยะ' },
  dumplingwrap: { en: 'Dumpling wrapper', th: 'แป้งเกี๊ยว' },
};

// ================================================================================================ DRAWING KIT
// All painters draw centred on (0,0) inside [-s/2, s/2] (units = cm on the atlas). Everything is deterministic
// (seeded) so the artwork is identical every time a texture is repainted after a language switch.

// organic closed outline around (x,y): leaves the path on the context for the caller to fill / stroke
function blobPath(ctx, x, y, rx, ry, seed = 1, wob = 0.1, n = 12, rot = 0) {
  const r = rng(seed), pts = [], c = Math.cos(rot), sn = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, k = 1 + (r() - 0.5) * 2 * wob;
    const lx = Math.cos(a) * rx * k, ly = Math.sin(a) * ry * k;
    pts.push([x + lx * c - ly * sn, y + lx * sn + ly * c]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  ctx.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
  ctx.closePath();
}
function blob(ctx, x, y, rx, ry, fill, stroke, lw, seed, wob, n, rot) {
  blobPath(ctx, x, y, rx, ry, seed, wob, n, rot);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
}
const dome = (ctx, x, y, r, c0, c1, fx = -0.3, fy = -0.35) => radGrad(ctx, x, y, 0, r * 1.1, [[0, c0], [1, c1]], x + r * fx, y + r * fy);
function glint(ctx, x, y, rx, ry, rot = -0.5, a = 0.5) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill(); ctx.restore();
}
function softShadow(ctx, x, y, rx, ry, a = 0.16) { ctx.fillStyle = `rgba(55,35,12,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }
// random points inside an ellipse
function scatter(ctx, cx, cy, rx, ry, n, seed, fn) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()); fn(cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, r, i); }
}
// tiny specks (sesame, pepper, fried garlic, peanut crumbs ...)
function specks(ctx, cx, cy, rx, ry, n, seed, cols, size, o = {}) {
  scatter(ctx, cx, cy, rx, ry, n, seed, (x, y, r, i) => {
    ctx.fillStyle = cols[i % cols.length];
    ctx.save(); ctx.translate(x, y); ctx.rotate(r() * Math.PI);
    ctx.beginPath(); ctx.ellipse(0, 0, size * (0.7 + r() * 0.6), size * (o.flat ?? 0.6) * (0.7 + r() * 0.6), 0, 0, TAU); ctx.fill(); ctx.restore();
  });
}

// ---- plates & bowls -------------------------------------------------------------------------
function plate(ctx, s, o = {}) {
  const r = (o.r ?? 0.42) * s;
  for (let i = 4; i >= 1; i--) softShadow(ctx, s * 0.016, s * 0.03, r * (1 + i * 0.02), r * (1 + i * 0.018), 0.05);
  circle(ctx, 0, 0, r, radGrad(ctx, 0, 0, r * 0.72, r, [[0, '#ffffff'], [1, '#e2ddce']]), '#b9b3a0', s * 0.006);
  circle(ctx, 0, 0, r * 0.82, radGrad(ctx, -r * 0.2, -r * 0.2, 0, r * 0.9, [[0, '#fffefb'], [1, '#f1eee3']]), 'rgba(130,120,95,.35)', s * 0.004);
}
function bowl(ctx, s, x, y, r, o = {}) {
  const rim = o.rim || '#1f5fae', inner = o.inner || '#fdfcf6';
  for (let i = 3; i >= 1; i--) softShadow(ctx, x + s * 0.014, y + s * 0.026, r * (1 + i * 0.022), r * (1 + i * 0.02), 0.05);
  circle(ctx, x, y, r, radGrad(ctx, x, y, r * 0.7, r, [[0, '#ffffff'], [1, '#dcd7c8']]), '#aaa590', s * 0.006);
  circle(ctx, x, y, r * 0.92, null, rim, s * 0.011);
  circle(ctx, x, y, r * 0.84, radGrad(ctx, x - r * 0.2, y - r * 0.2, 0, r, [[0, inner], [1, darken(inner, 0.06)]]), 'rgba(90,80,60,.3)', s * 0.004);
}

// ---- rice ------------------------------------------------------------------------------------
function rice(ctx, s, x, y, r, seed = 5, o = {}) {
  // grain size is absolute (a real grain does not grow with the mound); the count follows the area
  const tint = o.tint || '#fffdf3', shade = o.shade || '#e4dcc4', gx = s * 0.0118, gy = s * 0.0052;
  const n = Math.min(620, Math.round((0.55 * r * r * 0.92) / (gx * gy)));
  softShadow(ctx, x + r * 0.08, y + r * 0.16, r * 1.03, r * 0.93, 0.15);
  blob(ctx, x, y, r, r * 0.92, dome(ctx, x, y, r, tint, shade), 'rgba(135,122,90,.55)', s * 0.005, seed, 0.05, 14);
  const R = rng(seed + 11);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R()) * r * 0.9, e = d / (r * 0.9);
    ctx.save(); ctx.translate(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9); ctx.rotate(R() * Math.PI);
    ctx.fillStyle = mix(tint, '#ffffff', 0.6 - e * 0.3); ctx.strokeStyle = 'rgba(150,136,102,.42)'; ctx.lineWidth = s * 0.0022;
    ctx.beginPath(); ctx.ellipse(0, 0, gx, gy, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  glint(ctx, x - r * 0.3, y - r * 0.36, r * 0.3, r * 0.12, -0.6, 0.32);
}

// ---- garnish ---------------------------------------------------------------------------------
function cucumber(ctx, s, x, y, r) {
  circle(ctx, x, y, r, '#3d8b33', '#256420', s * 0.0032);
  circle(ctx, x, y, r * 0.85, radGrad(ctx, x, y, 0, r * 0.85, [[0, '#eef8cd'], [1, '#bfe08c']]));
  for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6 + 0.3; ellipse(ctx, x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.13, r * 0.07, '#f9fcea', null, 0, a); }
  circle(ctx, x, y, r * 0.16, '#f4f9dc');
}
function wedge(ctx, s, x, y, r, rot, rim, flesh, seeds) { // half-slice seen from above
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.closePath(); ctx.fillStyle = rim; ctx.fill(); ctx.strokeStyle = darken(rim, 0.4); ctx.lineWidth = s * 0.0035; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.8, Math.PI, 0); ctx.closePath(); ctx.fillStyle = flesh; ctx.fill();
  ctx.strokeStyle = seeds; ctx.lineWidth = s * 0.0028; ctx.lineCap = 'round';
  for (let i = 1; i < 4; i++) { const a = Math.PI + (i * Math.PI) / 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72); ctx.stroke(); }
  ctx.restore();
}
const tomatoWedge = (ctx, s, x, y, r, rot) => wedge(ctx, s, x, y, r, rot, '#d62c20', '#f5644a', '#ffd9a0');
const limeWedge = (ctx, s, x, y, r, rot) => wedge(ctx, s, x, y, r, rot, '#5fa32c', '#c9e46c', '#f0f8b8');
function chiliRing(ctx, s, x, y, r, col = '#d9261c') {
  circle(ctx, x, y, r, col, darken(col, 0.4), s * 0.0022); circle(ctx, x, y, r * 0.56, lighten(col, 0.6)); circle(ctx, x, y, r * 0.2, '#fff3c8');
}
function chiliLong(ctx, s, x, y, L, rot, col = '#d6231a') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.bezierCurveTo(-L * 0.2, -L * 0.13, L * 0.2, -L * 0.1, L / 2, L * 0.04); ctx.bezierCurveTo(L * 0.2, L * 0.1, -L * 0.2, L * 0.12, -L / 2, 0);
  ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = s * 0.0035; ctx.stroke();
  ctx.fillStyle = '#3f8f2c'; ctx.beginPath(); ctx.arc(-L / 2, 0, L * 0.05, 0, TAU); ctx.fill(); glint(ctx, 0, -L * 0.03, L * 0.2, L * 0.018, 0, 0.5);
  ctx.restore();
}
function basilLeaf(ctx, s, x, y, L, rot, col = '#2a6a20') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.bezierCurveTo(-L * 0.25, -L * 0.44, L * 0.22, -L * 0.42, L / 2, 0); ctx.bezierCurveTo(L * 0.22, L * 0.42, -L * 0.25, L * 0.44, -L / 2, 0);
  ctx.fillStyle = linGrad(ctx, 0, -L * 0.3, 0, L * 0.3, [[0, lighten(col, 0.22)], [1, darken(col, 0.18)]]); ctx.fill();
  ctx.strokeStyle = darken(col, 0.5); ctx.lineWidth = s * 0.0028; ctx.stroke();
  ctx.strokeStyle = lighten(col, 0.45); ctx.lineWidth = s * 0.0026; ctx.beginPath(); ctx.moveTo(-L * 0.45, 0); ctx.lineTo(L * 0.4, 0); ctx.stroke();
  ctx.restore();
}
function coriander(ctx, s, x, y, L, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = '#5fa845'; ctx.lineWidth = L * 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(L * 0.12, 0); ctx.stroke();
  for (const [dx, dy, r] of [[0.2, -0.13, 0.16], [0.34, 0.02, 0.18], [0.16, 0.15, 0.15], [0.02, -0.1, 0.11]]) circle(ctx, dx * L, dy * L, r * L, '#4c9c3a', '#2f6e26', s * 0.0026);
  ctx.restore();
}
function springOnion(ctx, s, x, y, r) { circle(ctx, x, y, r, '#8fd05a', '#3f8a2a', s * 0.0025); circle(ctx, x, y, r * 0.5, '#e8f7c6'); }

// ---- fried egg -------------------------------------------------------------------------------
function friedEgg(ctx, s, x, y, r, seed = 3, rot = 0, o = {}) {
  softShadow(ctx, x + r * 0.08, y + r * 0.14, r * 1.05, r * 0.95, 0.16);
  blobPath(ctx, x, y, r, r * 0.9, seed, 0.17, 11, rot);
  ctx.fillStyle = dome(ctx, x, y, r, '#ffffff', '#f0e2bd', -0.25, -0.3); ctx.fill();
  ctx.save(); ctx.strokeStyle = '#dca23a'; ctx.lineWidth = r * 0.075; ctx.lineJoin = 'round';
  ctx.setLineDash([r * 0.34, r * 0.1, r * 0.2, r * 0.08]); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = 'rgba(150,100,30,.55)'; ctx.lineWidth = s * 0.0035; ctx.stroke();
  const yx = x + r * 0.05, yy = y + r * 0.02, yr = r * (o.yolk ?? 0.4);
  circle(ctx, yx, yy, yr, dome(ctx, yx, yy, yr, '#ffe27a', '#f08c00', -0.25, -0.3), '#d97e00', s * 0.0028);
  glint(ctx, yx - yr * 0.3, yy - yr * 0.35, yr * 0.3, yr * 0.16, -0.6, 0.75);
}

// ---- shrimp (cooked, curled) -----------------------------------------------------------------
function shrimp(ctx, s, x, y, L, rot = 0, col = '#f27a3d', flip = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip, 1);
  const N = 28, rad = L * 0.3, a0 = -0.06 * Math.PI, a1 = 1.3 * Math.PI, ol = darken(col, 0.5);
  const P = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = a0 + (a1 - a0) * t, r = rad * (1 - 0.24 * t);
    P.push({ a, r, hw: L * (0.028 + 0.088 * Math.pow(1 - t, 0.75) * (1 + 0.22 * Math.sin(t * 3.2))) });
  }
  const band = (k0, k1) => { // polygon between radial offsets k0..k1 (in half-widths)
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const p = P[i], ro = p.r + p.hw * k1; i ? ctx.lineTo(Math.cos(p.a) * ro, Math.sin(p.a) * ro) : ctx.moveTo(Math.cos(p.a) * ro, Math.sin(p.a) * ro); }
    for (let i = N; i >= 0; i--) { const p = P[i], ri = p.r + p.hw * k0; ctx.lineTo(Math.cos(p.a) * ri, Math.sin(p.a) * ri); }
    ctx.closePath();
  };
  // tail fan (under the body)
  const T = P[N];
  for (const d of [-0.5, 0, 0.5]) {
    ctx.save(); ctx.translate(Math.cos(T.a) * T.r, Math.sin(T.a) * T.r); ctx.rotate(T.a + d);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.085, L * 0.05, L * 0.01, L * 0.2); ctx.quadraticCurveTo(-L * 0.085, L * 0.06, 0, 0);
    ctx.fillStyle = mix(col, '#df2a18', 0.55); ctx.fill(); ctx.strokeStyle = ol; ctx.lineWidth = s * 0.0026; ctx.stroke(); ctx.restore();
  }
  band(-1, 1); ctx.fillStyle = darken(col, 0.08); ctx.fill();
  band(-0.95, -0.2); ctx.fillStyle = lighten(col, 0.42); ctx.fill();      // paler belly (inner curve)
  band(0.15, 0.8); ctx.fillStyle = lighten(col, 0.22); ctx.fill();       // back highlight
  band(-1, 1); ctx.strokeStyle = ol; ctx.lineWidth = s * 0.0032; ctx.lineJoin = 'round'; ctx.stroke();
  // segment ridges
  ctx.strokeStyle = darken(col, 0.28); ctx.lineWidth = s * 0.0034; ctx.lineCap = 'round';
  for (let k = 1; k <= 6; k++) {
    const p = P[Math.round(k * N / 7.4)], ca = Math.cos(p.a), sa = Math.sin(p.a);
    ctx.beginPath(); ctx.moveTo(ca * (p.r - p.hw * 0.95), sa * (p.r - p.hw * 0.95));
    ctx.quadraticCurveTo(ca * p.r - sa * p.hw * 0.5, sa * p.r + ca * p.hw * 0.5, ca * (p.r + p.hw * 0.95), sa * (p.r + p.hw * 0.95)); ctx.stroke();
  }
  // head: eye + whiskers
  const H = P[0], hxx = Math.cos(H.a) * H.r, hyy = Math.sin(H.a) * H.r;
  ctx.strokeStyle = darken(col, 0.35); ctx.lineWidth = s * 0.0026;
  ctx.beginPath(); ctx.moveTo(hxx, hyy - H.hw * 0.6); ctx.quadraticCurveTo(hxx + L * 0.06, hyy - L * 0.2, hxx + L * 0.24, hyy - L * 0.22);
  ctx.moveTo(hxx + H.hw * 0.3, hyy - H.hw * 0.7); ctx.quadraticCurveTo(hxx + L * 0.12, hyy - L * 0.13, hxx + L * 0.27, hyy - L * 0.09); ctx.stroke();
  circle(ctx, hxx + H.hw * 0.35, hyy - H.hw * 0.25, L * 0.014, '#2a1208');
  ctx.restore();
}

// ---- noodles / strands -----------------------------------------------------------------------
function strands(ctx, s, cx, cy, R, n, col, w, seed, o = {}) {
  const r = rng(seed);
  ctx.save(); ctx.lineCap = 'round';
  if (o.clip) { blobPath(ctx, cx, cy, R * 1.02, R * (o.aspect ?? 0.92), seed + 3, 0.06, 12); ctx.clip(); }
  const cols = Array.isArray(col) ? col : [col];
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * R * 0.78;
    const px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d * (o.aspect ?? 0.92);
    const rad = R * (0.22 + r() * 0.5), a0 = r() * TAU, span = 1.2 + r() * 2.6, c = cols[i % cols.length];
    ctx.beginPath(); ctx.arc(px, py, rad, a0, a0 + span);
    ctx.strokeStyle = darken(c, o.edge ?? 0.28); ctx.lineWidth = w * 1.35; ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = lighten(c, 0.45); ctx.globalAlpha = o.hi ?? 0.55; ctx.lineWidth = w * 0.3;
    ctx.beginPath(); ctx.arc(px - w * 0.15, py - w * 0.18, rad, a0 + 0.05, a0 + span - 0.05); ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
// twirled spaghetti nest: concentric slightly off-centre rings
function spaghettiNest(ctx, s, cx, cy, R, cols, w, seed) {
  const r = rng(seed);
  softShadow(ctx, cx + R * 0.06, cy + R * 0.14, R * 1.02, R * 0.92, 0.16);
  ctx.save(); ctx.lineCap = 'round';
  blobPath(ctx, cx, cy, R, R * 0.92, seed, 0.05, 14); ctx.fillStyle = darken(cols[0], 0.3); ctx.fill();
  ctx.clip();
  for (let k = 0; k < 46; k++) {
    const rad = R * (0.12 + r() * 0.85), off = R * 0.12, a0 = r() * TAU, span = 1.4 + r() * 3.2;
    const px = cx + (r() - 0.5) * off * 2, py = cy + (r() - 0.5) * off * 1.8, c = cols[k % cols.length];
    ctx.beginPath(); ctx.arc(px, py, rad, a0, a0 + span);
    ctx.strokeStyle = darken(c, 0.3); ctx.lineWidth = w * 1.3; ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = w * 0.28; ctx.beginPath(); ctx.arc(px - w * 0.12, py - w * 0.16, rad, a0 + 0.04, a0 + span - 0.04); ctx.stroke();
  }
  ctx.restore();
  blobPath(ctx, cx, cy, R, R * 0.92, seed, 0.05, 14); ctx.strokeStyle = 'rgba(60,35,10,.55)'; ctx.lineWidth = s * 0.005; ctx.stroke();
}

// minced meat / crumbly fillings
function crumbs(ctx, s, cx, cy, rx, ry, n, seed, cols, size, wob = 0) {
  scatter(ctx, cx, cy, rx, ry, n, seed, (x, y, r, i) => {
    const c = cols[i % cols.length], w = size * (0.7 + r() * 0.7), h = w * (0.55 + r() * 0.35), a = r() * TAU;
    if (wob) { blobPath(ctx, x, y, w, h, Math.floor(r() * 9999), wob, 7, a); } else { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.restore(); }
    ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = darken(c, 0.4); ctx.lineWidth = s * 0.0028; ctx.stroke();
  });
}

// ================================================================================================ READY-MEAL DISHES (top-down "lid photos")
const DISH = {};

function kaprao(ctx, s, pork) {
  plate(ctx, s);
  rice(ctx, s, -0.15 * s, 0.06 * s, 0.17 * s, pork ? 21 : 22, { n: 64 });
  const tx = 0.12 * s, ty = 0.07 * s, base = pork ? '#79391a' : '#a5662f', R = rng(pork ? 4 : 9);
  softShadow(ctx, tx + s * 0.012, ty + s * 0.03, 0.2 * s, 0.17 * s, 0.16);
  blob(ctx, tx, ty, 0.2 * s, 0.17 * s, dome(ctx, tx, ty, 0.2 * s, lighten(base, 0.16), darken(base, 0.32)), darken(base, 0.55), s * 0.005, pork ? 7 : 8, 0.13, 13, 0.3);
  // the meat: fine mince for pork, bigger chunks for chicken
  if (pork) crumbs(ctx, s, tx, ty, 0.18 * s, 0.15 * s, 90, 31, ['#8f4a22', '#b06a36', '#6b3316', '#c88650'], 0.014 * s);
  else crumbs(ctx, s, tx, ty, 0.17 * s, 0.14 * s, 54, 32, ['#c98b52', '#dba872', '#b87a44', '#e8c08e'], 0.02 * s, 0.32);
  // long beans (chicken) or extra sauce shine (pork)
  if (!pork) for (let i = 0; i < 9; i++) { const a = R() * TAU, d = R() * 0.15 * s; ctx.save(); ctx.translate(tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.85); ctx.rotate(R() * Math.PI); fillRR(ctx, -0.024 * s, -0.008 * s, 0.048 * s, 0.016 * s, 0.008 * s, '#79b83a', '#3d7a1f', s * 0.002); ctx.restore(); }
  for (let i = 0; i < 9; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 0.15 * s; basilLeaf(ctx, s, tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.85, 0.06 * s, R() * TAU, '#26591c'); }
  for (let i = 0; i < 8; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 0.15 * s; chiliRing(ctx, s, tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.85, 0.014 * s, i % 3 ? '#e0261c' : '#8dc63f'); }
  specks(ctx, tx, ty, 0.16 * s, 0.13 * s, 12, 5, ['#f4e3a0'], 0.008 * s);
  glint(ctx, tx - 0.07 * s, ty - 0.08 * s, 0.05 * s, 0.014 * s, -0.5, 0.28);
  friedEgg(ctx, s, pork ? 0.02 * s : -0.03 * s, -0.19 * s, 0.14 * s, pork ? 12 : 13, pork ? 0.5 : -0.2);
  cucumber(ctx, s, -0.24 * s, 0.24 * s, 0.045 * s); cucumber(ctx, s, -0.14 * s, 0.285 * s, 0.045 * s);
}
DISH['kaprao-chicken'] = (ctx, s) => kaprao(ctx, s, false);
DISH['kaprao-pork'] = (ctx, s) => kaprao(ctx, s, true);

DISH['chicken-rice'] = (ctx, s) => {
  plate(ctx, s);
  rice(ctx, s, -0.03 * s, 0.11 * s, 0.19 * s, 41, { tint: '#fbeab0', shade: '#e0c67c', n: 78 });
  // shingled slices of poached chicken, skin side up
  for (let i = 0; i < 7; i++) {
    const x = (-0.2 + i * 0.066) * s, y = (-0.1 - Math.sin((i / 6) * Math.PI) * 0.055) * s, rot = (i - 3) * 0.15 - 0.08;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    softShadow(ctx, 0.008 * s, 0.014 * s, 0.07 * s, 0.05 * s, 0.14);
    blobPath(ctx, 0, 0, 0.07 * s, 0.05 * s, 90 + i, 0.05, 12);
    ctx.fillStyle = dome(ctx, 0, 0, 0.07 * s, '#fffaf0', '#f0dcbc'); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = linGrad(ctx, 0, -0.05 * s, 0, -0.008 * s, [[0, '#e9c23c'], [0.7, '#f3d768'], [1, 'rgba(250,228,140,.0)']]); ctx.fillRect(-0.08 * s, -0.06 * s, 0.16 * s, 0.052 * s); // glossy golden skin
    ctx.strokeStyle = 'rgba(205,160,80,.55)'; ctx.lineWidth = s * 0.0024; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-0.045 * s, 0.012 * s); ctx.lineTo(0.035 * s, 0.018 * s); ctx.moveTo(-0.035 * s, 0.033 * s); ctx.lineTo(0.05 * s, 0.037 * s); ctx.stroke();
    ctx.restore();
    blobPath(ctx, 0, 0, 0.07 * s, 0.05 * s, 90 + i, 0.05, 12); ctx.strokeStyle = 'rgba(165,120,50,.75)'; ctx.lineWidth = s * 0.003; ctx.stroke();
    glint(ctx, -0.022 * s, -0.03 * s, 0.03 * s, 0.007 * s, -0.08, 0.65);
    ctx.restore();
  }
  for (let i = 0; i < 4; i++) cucumber(ctx, s, (-0.27 + i * 0.05) * s, (0.2 + (i % 2) * 0.05 + i * 0.012) * s, 0.04 * s);
  coriander(ctx, s, 0.2 * s, -0.22 * s, 0.14 * s, -0.5);
  // ginger-soybean dipping sauce
  bowl(ctx, s, 0.22 * s, 0.18 * s, 0.075 * s, { rim: '#b3462a' });
  circle(ctx, 0.22 * s, 0.18 * s, 0.056 * s, dome(ctx, 0.22 * s, 0.18 * s, 0.056 * s, '#c96a2e', '#7c3210'));
  specks(ctx, 0.22 * s, 0.18 * s, 0.04 * s, 0.04 * s, 10, 4, ['#f2d878', '#d6321f'], 0.006 * s);
};

DISH['shrimp-fried-rice'] = (ctx, s) => {
  plate(ctx, s);
  const cx = 0, cy = 0.03 * s, R = 0.235 * s;
  softShadow(ctx, R * 0.06, cy + R * 0.17, R * 1.02, R * 0.9, 0.16);
  blob(ctx, cx, cy, R, R * 0.88, dome(ctx, cx, cy, R, '#f7d670', '#d29a2a'), '#a06f15', s * 0.005, 51, 0.07, 14);
  const r = rng(52);
  for (let i = 0; i < 130; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.9; ctx.save(); ctx.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.85); ctx.rotate(r() * Math.PI); ctx.fillStyle = ['#fbe391', '#f3c95a', '#e0aa38', '#fff0b0'][i % 4]; ctx.beginPath(); ctx.ellipse(0, 0, 0.02 * s, 0.009 * s, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  specks(ctx, cx, cy, R * 0.85, R * 0.75, 18, 53, ['#fff5c0'], 0.014 * s, { flat: 0.7 }); // egg
  specks(ctx, cx, cy, R * 0.85, R * 0.75, 15, 54, ['#f0872a'], 0.009 * s);                // carrot
  specks(ctx, cx, cy, R * 0.85, R * 0.75, 14, 55, ['#3f9f42', '#7cc24a'], 0.008 * s);     // spring onion / pea
  specks(ctx, cx, cy, R * 0.85, R * 0.75, 9, 56, ['#a6631a'], 0.01 * s);                  // soy
  shrimp(ctx, s, -0.09 * s, -0.11 * s, 0.24 * s, -0.5, '#f0703a');
  shrimp(ctx, s, 0.13 * s, -0.06 * s, 0.22 * s, 2.5, '#ee6a36', -1);
  shrimp(ctx, s, -0.02 * s, 0.09 * s, 0.23 * s, 0.7, '#f2783e');
  for (let i = 0; i < 4; i++) springOnion(ctx, s, (-0.03 + i * 0.045) * s, (-0.02 + (i % 2) * 0.05) * s, 0.011 * s);
  for (let i = 0; i < 3; i++) cucumber(ctx, s, (-0.31 + i * 0.03) * s, (0.06 + i * 0.075) * s, 0.04 * s);
  limeWedge(ctx, s, 0.27 * s, 0.2 * s, 0.075 * s, 0.7);
  tomatoWedge(ctx, s, 0.29 * s, -0.13 * s, 0.055 * s, 1.1);
};

DISH['omelette-rice'] = (ctx, s) => {
  plate(ctx, s);
  rice(ctx, s, 0.11 * s, 0.13 * s, 0.17 * s, 61, { n: 60 });
  const ox = -0.05 * s, oy = -0.04 * s;
  softShadow(ctx, ox + s * 0.012, oy + s * 0.035, 0.27 * s, 0.2 * s, 0.17);
  blob(ctx, ox, oy, 0.27 * s, 0.2 * s, dome(ctx, ox, oy, 0.27 * s, '#fedb55', '#e29a1a'), '#b8690f', s * 0.006, 62, 0.11, 13, -0.3);
  const r = rng(63);
  for (let i = 0; i < 16; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.2 * s; const bx = ox + Math.cos(a) * d, by = oy + Math.sin(a) * d * 0.7, br = (0.03 + r() * 0.03) * s; blob(ctx, bx, by, br, br * 0.8, 'rgba(255,238,140,.6)', 'rgba(200,120,20,.45)', s * 0.0028, 70 + i, 0.2, 8); }
  specks(ctx, ox, oy, 0.24 * s, 0.16 * s, 40, 64, ['#c97a14', '#f8b830'], 0.007 * s);
  ctx.strokeStyle = 'rgba(190,105,15,.6)'; ctx.lineWidth = s * 0.006; ctx.beginPath(); ctx.arc(ox + 0.02 * s, oy + 0.27 * s, 0.3 * s, -2.0, -1.1); ctx.stroke(); // fold
  glint(ctx, ox - 0.1 * s, oy - 0.09 * s, 0.08 * s, 0.02 * s, -0.4, 0.42);
  // chilli sauce squiggle
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(ox - 0.17 * s, oy + 0.02 * s);
  for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(ox - 0.17 * s + (i + 0.5) * 0.05 * s, oy + (i % 2 ? 0.075 : -0.035) * s, ox - 0.17 * s + (i + 1) * 0.05 * s, oy + 0.02 * s);
  ctx.strokeStyle = '#9c160d'; ctx.lineWidth = s * 0.014; ctx.stroke(); ctx.strokeStyle = '#e23a26'; ctx.lineWidth = s * 0.008; ctx.stroke(); ctx.restore();
  for (let i = 0; i < 3; i++) cucumber(ctx, s, (-0.27 + i * 0.045) * s, (0.16 + i * 0.06) * s, 0.04 * s);
  tomatoWedge(ctx, s, 0.27 * s, 0.02 * s, 0.05 * s, 1.9);
  coriander(ctx, s, 0.04 * s, 0.29 * s, 0.12 * s, 2.7);
};

// ---- props used by the dishes below -------------------------------------------------------------
function peanut(ctx, s, x, y, r, rot = 0) { ellipse(ctx, x, y, r, r * 0.72, dome(ctx, x, y, r, '#eec488', '#b98040'), '#7a4a1e', s * 0.0022, rot); }
function mushroomSlice(ctx, s, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-r * 0.24, r * 0.95); ctx.lineTo(-r * 0.26, r * 0.25); ctx.bezierCurveTo(-r * 1.35, r * 0.3, -r * 1.1, -r * 0.95, 0, -r * 0.98); ctx.bezierCurveTo(r * 1.1, -r * 0.95, r * 1.35, r * 0.3, r * 0.26, r * 0.25); ctx.lineTo(r * 0.24, r * 0.95); ctx.closePath();
  ctx.fillStyle = '#efe4cd'; ctx.fill(); ctx.strokeStyle = '#9c8461'; ctx.lineWidth = s * 0.003; ctx.stroke();
  ctx.fillStyle = '#cdb994'; ctx.beginPath(); ctx.ellipse(0, r * 0.22, r * 0.85, r * 0.14, 0, 0, Math.PI); ctx.fill();
  ctx.restore();
}
function baconStrip(ctx, s, x, y, L, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const w = L * 0.3;
  ctx.beginPath(); ctx.moveTo(-L / 2, -w * 0.4); ctx.bezierCurveTo(-L * 0.2, -w * 0.75, L * 0.2, -w * 0.1, L / 2, -w * 0.45); ctx.lineTo(L / 2, w * 0.4); ctx.bezierCurveTo(L * 0.2, w * 0.75, -L * 0.2, w * 0.1, -L / 2, w * 0.45); ctx.closePath();
  ctx.fillStyle = '#c4503a'; ctx.fill(); ctx.strokeStyle = '#6d2416'; ctx.lineWidth = s * 0.003; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#f7ddd0'; ctx.fillRect(-L / 2, -w * 0.14, L, w * 0.24); ctx.fillStyle = 'rgba(110,35,15,.3)'; ctx.fillRect(-L / 2, -w * 0.8, L, w * 0.25); ctx.restore();
  ctx.restore();
}
function bananaLeaf(ctx, s, cx, cy, W, H, rot) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  softShadow(ctx, W * 0.02, H * 0.06, W * 0.52, H * 0.55, 0.14);
  fillRR(ctx, -W / 2, -H / 2, W, H, H * 0.16, linGrad(ctx, 0, -H / 2, 0, H / 2, [[0, '#63b955'], [1, '#2f8a34']]), '#1f6a26', s * 0.005);
  ctx.strokeStyle = 'rgba(190,235,160,.55)'; ctx.lineWidth = s * 0.006; ctx.beginPath(); ctx.moveTo(-W * 0.48, 0); ctx.lineTo(W * 0.48, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(170,225,140,.28)'; ctx.lineWidth = s * 0.003;
  for (let x = -W * 0.44; x < W * 0.44; x += W * 0.045) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H * 0.2, -H * 0.46); ctx.moveTo(x, 0); ctx.lineTo(x + H * 0.2, H * 0.46); ctx.stroke(); }
  ctx.restore();
}
function boiledEgg(ctx, s, x, y, r, rot = 0, half = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  softShadow(ctx, r * 0.14, r * 0.2, r * 0.8, r * 1.02, 0.17);
  if (!half) {
    ellipse(ctx, 0, 0, r * 0.78, r, radGrad(ctx, 0, 0, 0, r * 1.05, [[0, '#ffffff'], [0.7, '#fbf7ea'], [1, '#ddd3b8']], -r * 0.3, -r * 0.35), '#bfb597', s * 0.0032);
    glint(ctx, -r * 0.26, -r * 0.38, r * 0.16, r * 0.3, 0.3, 0.7);
  } else {
    ellipse(ctx, 0, 0, r * 0.78, r, radGrad(ctx, 0, 0, 0, r, [[0, '#ffffff'], [1, '#f1ead6']]), '#bfb597', s * 0.0032);
    ellipse(ctx, 0, r * 0.05, r * 0.44, r * 0.5, radGrad(ctx, 0, 0, 0, r * 0.5, [[0, '#ffdc4a'], [1, '#f0a000']], -r * 0.1, -r * 0.1), '#d68b00', s * 0.003);
    glint(ctx, -r * 0.14, -r * 0.14, r * 0.1, r * 0.06, -0.5, 0.6);
  }
  ctx.restore();
}
function swirl(ctx, s, cx, cy, r, col, w, turns = 1.6, rot = 0) {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const t = i / 40, a = rot + t * TAU * turns, rr = r * t; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke(); ctx.restore();
}
function starAnise(ctx, s, x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = '#7a3f1c'; ctx.strokeStyle = '#3f1c08'; ctx.lineWidth = s * 0.002;
  ctx.beginPath(); for (let i = 0; i < 16; i++) { const rr = i % 2 ? r * 0.45 : r, a = (i * TAU) / 16; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.stroke(); circle(ctx, 0, 0, r * 0.18, '#3f1c08'); ctx.restore();
}
function porkSlice(ctx, s, x, y, rx, ry, rot, seed, col = '#cf9448', gloss = 0.4) { // a fried / glazed slice of meat
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  softShadow(ctx, rx * 0.12, ry * 0.32, rx * 1.02, ry * 1.04, 0.18);
  blob(ctx, 0, 0, rx, ry, dome(ctx, 0, 0, rx, lighten(col, 0.24), darken(col, 0.22)), darken(col, 0.55), s * 0.0034, seed, 0.13, 12);
  ctx.save(); blobPath(ctx, 0, 0, rx, ry, seed, 0.13, 12); ctx.clip();
  ctx.strokeStyle = darken(col, 0.3); ctx.globalAlpha = 0.45; ctx.lineWidth = s * 0.0026; ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-rx * 0.85, i * ry * 0.3); ctx.quadraticCurveTo(0, i * ry * 0.3 + ry * 0.12, rx * 0.85, i * ry * 0.3 - ry * 0.05); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.restore();
  glint(ctx, -rx * 0.28, -ry * 0.34, rx * 0.34, ry * 0.12, -0.15, gloss);
  ctx.restore();
}
// deep-fried pork-belly cube, seen from above: bubbly golden-brown crackling on top, layered fat and meat on the side
function crispCube(ctx, s, x, y, a, rot, seed) {
  const r = rng(seed), j = () => (r() - 0.5) * a * 0.14;
  const sq = (dy, k = 1) => { // slightly irregular rounded square
    const h = a * 0.5 * k, c = [[-h + j(), -h + j() + dy], [h + j(), -h + j() + dy], [h + j(), h + j() + dy], [-h + j(), h + j() + dy]];
    ctx.beginPath();
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const m0 = mid(c[3], c[0]); ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < 4; i++) { const m = mid(c[i], c[(i + 1) % 4]); ctx.quadraticCurveTo(c[i][0], c[i][1], m[0], m[1]); }
    ctx.closePath();
  };
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  softShadow(ctx, a * 0.1, a * 0.2, a * 0.58, a * 0.5, 0.22);
  sq(a * 0.13); ctx.fillStyle = linGrad(ctx, 0, -a * 0.4, 0, a * 0.7, [[0, '#f3d3ba'], [0.35, '#e7a68e'], [0.6, '#f6e3cd'], [1, '#d99a80']]); ctx.fill(); ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = s * 0.0032; ctx.stroke(); // side layers
  sq(-a * 0.04, 0.96); ctx.fillStyle = dome(ctx, 0, 0, a * 0.6, '#e9ad46', '#9a5a14'); ctx.fill(); ctx.strokeStyle = '#6a3a0c'; ctx.lineWidth = s * 0.0034; ctx.stroke(); // crackling
  ctx.save(); sq(-a * 0.04, 0.96); ctx.clip();
  for (let i = 0; i < 9; i++) { const bx = (r() - 0.5) * a * 0.75, by = (r() - 0.5) * a * 0.75, br = a * (0.05 + r() * 0.07); circle(ctx, bx, by, br, 'rgba(250,215,120,.85)', 'rgba(110,60,10,.55)', s * 0.0026); circle(ctx, bx - br * 0.25, by - br * 0.3, br * 0.3, 'rgba(255,245,200,.8)'); }
  for (let i = 0; i < 6; i++) circle(ctx, (r() - 0.5) * a * 0.8, (r() - 0.5) * a * 0.8, a * 0.025, 'rgba(90,45,8,.6)');
  ctx.restore();
  ctx.restore();
}
const wobbleStroke = (ctx, x0, y0, x1, y1, amp, n = 8) => { // a wavy line for sauces
  ctx.beginPath(); ctx.moveTo(x0, y0);
  for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, k = i % 2 ? amp : -amp; ctx.quadraticCurveTo(x0 + dx * tm + nx * k, y0 + dy * tm + ny * k, x0 + dx * t1, y0 + dy * t1); }
};

// ---- curries -------------------------------------------------------------------------------------
function curry(ctx, s, o) {
  plate(ctx, s);
  rice(ctx, s, -0.215 * s, 0.07 * s, 0.135 * s, o.seed, { n: 70 });
  const cx = 0.115 * s, cy = 0.015 * s, R = 0.2 * s;
  bowl(ctx, s, cx, cy, R * 1.24, { rim: o.rim });
  blob(ctx, cx, cy, R, R, dome(ctx, cx, cy, R, o.c0, o.c1), darken(o.c1, 0.4), s * 0.004, o.seed + 1, 0.02, 24);
  ctx.save(); circle(ctx, cx, cy, R, null, darken(o.c1, 0.15), s * 0.02); ctx.restore();
  const P = (dx, dy) => [cx + dx * s, cy + dy * s];
  if (o.oil) specks(ctx, cx, cy, R * 0.85, R * 0.85, 26, o.seed + 2, [o.oil], 0.011 * s, { flat: 0.8 });
  for (const [dx, dy, rx, ry, rot] of o.meat) { const [x, y] = P(dx, dy); blob(ctx, x, y, rx * s, ry * s, dome(ctx, x, y, rx * s, lighten(o.meatCol, 0.22), darken(o.meatCol, 0.15)), darken(o.meatCol, 0.5), s * 0.003, o.seed + 9 + Math.round(dx * 100), 0.1, 10, rot); }
  o.extras(ctx, s, P, cx, cy, R);
}
DISH['green-curry'] = (ctx, s) => curry(ctx, s, {
  seed: 71, rim: '#2f8f46', c0: '#a9d35f', c1: '#4c8a26', oil: '#d8e88a', meatCol: '#f1e2b6',
  meat: [[-0.09, -0.075, 0.048, 0.032, 0.4], [0.065, -0.1, 0.05, 0.033, -0.3], [0.085, 0.045, 0.048, 0.03, 0.9], [-0.1, 0.06, 0.046, 0.03, -0.7], [0.0, 0.0, 0.05, 0.033, 0.2], [-0.02, 0.115, 0.042, 0.028, 0.5]],
  extras(ctx, s, P, cx, cy, R) {
    swirl(ctx, s, cx + 0.03 * s, cy - 0.03 * s, 0.075 * s, 'rgba(252,254,236,.9)', s * 0.011, 1.7);
    for (const [dx, dy] of [[-0.135, -0.02], [0.03, -0.06], [0.135, -0.05], [0.03, 0.075], [-0.06, -0.135], [0.115, 0.11], [-0.115, 0.115]]) {
      const [x, y] = P(dx, dy); circle(ctx, x, y, 0.026 * s, dome(ctx, x, y, 0.026 * s, '#b4e36a', '#5a9e2c'), '#33661a', s * 0.0026); circle(ctx, x, y, 0.009 * s, '#3c7a20');
    }
    for (const [dx, dy, c] of [[-0.05, -0.03, '#e0261c'], [0.1, 0.0, '#e0261c'], [-0.02, 0.07, '#e0261c'], [0.06, -0.125, '#e0261c'], [0.1, 0.06, '#8dc63f'], [-0.11, 0.0, '#8dc63f']]) { const [x, y] = P(dx, dy); chiliRing(ctx, s, x, y, 0.016 * s, c); }
    for (const [dx, dy, r] of [[-0.11, -0.1, 0.5], [0.1, -0.09, 2.2], [0.125, 0.09, 4.0], [-0.06, 0.145, 1.0], [-0.005, -0.02, 3.3]]) { const [x, y] = P(dx, dy); basilLeaf(ctx, s, x, y, 0.062 * s, r, '#2f8a2a'); }
  },
});
DISH['massaman'] = (ctx, s) => curry(ctx, s, {
  seed: 81, rim: '#c9792d', c0: '#cf8034', c1: '#7e3f12', oil: '#f0771e', meatCol: '#b98652',
  meat: [[-0.09, -0.08, 0.05, 0.036, 0.4], [0.07, -0.105, 0.05, 0.034, -0.3], [0.09, 0.04, 0.05, 0.034, 0.9], [-0.1, 0.065, 0.048, 0.033, -0.7], [-0.01, 0.13, 0.044, 0.03, 0.5]],
  extras(ctx, s, P, cx, cy, R) {
    swirl(ctx, s, cx + 0.03 * s, cy - 0.02 * s, 0.07 * s, 'rgba(255,240,210,.75)', s * 0.01, 1.5, 1);
    for (const [dx, dy, r] of [[-0.01, -0.02, 0.4], [0.12, -0.02, -0.3], [-0.06, 0.03, 0.9], [0.04, 0.07, 0.2], [-0.13, -0.02, -0.5]]) { // potato chunks
      const [x, y] = P(dx, dy); ctx.save(); ctx.translate(x, y); ctx.rotate(r); fillRR(ctx, -0.036 * s, -0.036 * s, 0.072 * s, 0.072 * s, 0.02 * s, dome(ctx, 0, 0, 0.04 * s, '#f5dc98', '#d6a95a'), '#8a5a1c', s * 0.003); glint(ctx, -0.01 * s, -0.012 * s, 0.014 * s, 0.006 * s, -0.4, 0.45); ctx.restore();
    }
    for (const [dx, dy, r] of [[-0.05, -0.12, 0.3], [0.11, 0.09, 1.3], [-0.12, 0.1, -0.4]]) { const [x, y] = P(dx, dy); ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.beginPath(); ctx.arc(0, 0, 0.035 * s, 0.3, 3.6); ctx.strokeStyle = 'rgba(250,236,200,.9)'; ctx.lineWidth = s * 0.011; ctx.stroke(); ctx.restore(); } // onion
    for (const [dx, dy] of [[-0.03, -0.06], [0.06, -0.06], [0.0, 0.11], [0.13, 0.03], [-0.13, 0.03], [0.09, 0.115], [-0.08, -0.1]]) { const [x, y] = P(dx, dy); peanut(ctx, s, x, y, 0.017 * s, dx * 9); }
    starAnise(ctx, s, cx + 0.135 * s, cy - 0.09 * s, 0.03 * s, 0.4);
  },
});

// ---- rice + topping plates --------------------------------------------------------------------------
DISH['garlic-pork'] = (ctx, s) => {
  plate(ctx, s);
  rice(ctx, s, -0.17 * s, 0.06 * s, 0.16 * s, 101, { n: 80 });
  const slices = [[0.04, -0.14, 0.12], [0.14, -0.08, 0.06], [0.06, -0.03, 0.18], [0.16, 0.03, 0.1], [0.05, 0.08, 0.04], [0.14, 0.14, 0.16]];
  slices.forEach(([dx, dy, r], i) => porkSlice(ctx, s, dx * s, dy * s, 0.098 * s, 0.047 * s, r, 110 + i, '#d9a34e'));
  specks(ctx, 0.1 * s, 0.0, 0.15 * s, 0.17 * s, 60, 102, ['#f8e08e', '#efcd60', '#fff2bc'], 0.0135 * s, { flat: 0.55 }); // fried garlic
  specks(ctx, 0.1 * s, 0.0, 0.16 * s, 0.18 * s, 40, 103, ['#2b1a0e'], 0.0055 * s);                                          // pepper
  for (let i = 0; i < 3; i++) cucumber(ctx, s, (-0.14 + i * 0.075) * s, (-0.25 + (i % 2) * 0.02) * s, 0.04 * s);
  tomatoWedge(ctx, s, 0.25 * s, 0.19 * s, 0.05 * s, -0.4);
  coriander(ctx, s, 0.15 * s, -0.22 * s, 0.12 * s, -0.7);
};
DISH['crispy-pork'] = (ctx, s) => {
  plate(ctx, s);
  rice(ctx, s, -0.18 * s, 0.07 * s, 0.155 * s, 121, { n: 80 });
  const cubes = [[0.02, -0.1], [0.115, -0.135], [0.2, -0.05], [0.065, -0.01], [0.15, 0.02], [0.225, 0.08], [0.035, 0.085], [0.125, 0.125], [0.205, 0.175]];
  const r = rng(122);
  // chillies & garlic go under / between the cubes
  specks(ctx, 0.12 * s, 0.03 * s, 0.16 * s, 0.16 * s, 22, 123, ['#f4e2a0', '#fff3c4'], 0.011 * s, { flat: 0.6 });
  for (let i = 0; i < 6; i++) chiliRing(ctx, s, (0.0 + r() * 0.26) * s, (-0.12 + r() * 0.3) * s, 0.017 * s, '#8dc63f');
  cubes.forEach(([dx, dy], i) => crispCube(ctx, s, dx * s, dy * s, 0.078 * s, (r() - 0.5) * 1.2, 130 + i));
  for (let i = 0; i < 9; i++) chiliRing(ctx, s, (0.0 + r() * 0.27) * s, (-0.14 + r() * 0.32) * s, 0.015 * s, '#b3180f');
  specks(ctx, 0.12 * s, 0.03 * s, 0.17 * s, 0.17 * s, 26, 124, ['#ffffff', '#f0f0f0'], 0.006 * s, { flat: 0.9 }); // salt
  chiliLong(ctx, s, 0.05 * s, 0.245 * s, 0.13 * s, -0.15, '#c2190f');
  limeWedge(ctx, s, 0.27 * s, 0.22 * s, 0.05 * s, 0.6);
};

// ---- noodles ---------------------------------------------------------------------------------------------
function sprouts(ctx, s, cx, cy, n, seed) { // bean sprouts
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - 0.5) * 0.12 * s, y = cy + (r() - 0.5) * 0.08 * s, a = r() * TAU, L = 0.06 * s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.lineCap = 'round';
    ctx.strokeStyle = '#8a8250'; ctx.lineWidth = s * 0.0095; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, L * 0.25, L / 2, 0); ctx.stroke();
    ctx.strokeStyle = '#f6f2d2'; ctx.lineWidth = s * 0.0068; ctx.stroke();
    circle(ctx, -L / 2, 0, s * 0.0075, '#f0d75a', '#a89a30', s * 0.0018); ctx.restore();
  }
}
DISH['pad-thai'] = (ctx, s) => {
  plate(ctx, s);
  const cx = 0, cy = 0.02 * s, R = 0.255 * s;
  softShadow(ctx, R * 0.06, cy + R * 0.16, R * 1.02, R * 0.9, 0.16);
  blob(ctx, cx, cy, R, R * 0.9, '#c98335', '#7a4a12', s * 0.005, 141, 0.06, 14);
  strands(ctx, s, cx, cy, R, 110, ['#e9a548', '#dc8a2c', '#f2b95e', '#e39a3c'], 0.023 * s, 142, { clip: true, aspect: 0.9 });
  // egg, tofu, sprouts, chives, peanuts
  for (const [dx, dy, r] of [[-0.12, 0.03, 0.4], [0.06, 0.12, -0.3], [0.14, 0.0, 0.7], [-0.02, -0.02, 0.1]]) blob(ctx, cx + dx * s, cy + dy * s, 0.036 * s, 0.024 * s, '#fce27c', '#c99a1c', s * 0.0028, 143 + Math.round(dx * 50), 0.12, 9, r);
  for (const [dx, dy, r] of [[-0.05, 0.09, 0.3], [0.1, -0.1, 0.9], [-0.14, -0.06, 0.1]]) { ctx.save(); ctx.translate(cx + dx * s, cy + dy * s); ctx.rotate(r); fillRR(ctx, -0.024 * s, -0.024 * s, 0.048 * s, 0.048 * s, 0.008 * s, '#f0cd84', '#a97a2a', s * 0.0028); ctx.restore(); }
  shrimp(ctx, s, -0.11 * s, -0.11 * s, 0.25 * s, -0.5, '#f2733a');
  shrimp(ctx, s, 0.11 * s, -0.09 * s, 0.24 * s, 2.7, '#ef6a34', -1);
  shrimp(ctx, s, -0.01 * s, 0.1 * s, 0.24 * s, 0.6, '#f37c40');
  ctx.save(); ctx.lineCap = 'round'; for (let i = 0; i < 7; i++) { const a = -0.9 + i * 0.35, x = (-0.14 + i * 0.045) * s, y = (-0.02 + (i % 3) * 0.05) * s; ctx.strokeStyle = '#3f8f2c'; ctx.lineWidth = s * 0.008; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 0.07 * s, y + Math.sin(a) * 0.07 * s); ctx.stroke(); } ctx.restore();
  specks(ctx, 0.08 * s, 0.05 * s, 0.14 * s, 0.13 * s, 46, 144, ['#d9a566', '#c4873c', '#e8c48a'], 0.009 * s);    // crushed peanuts
  specks(ctx, 0.0, 0.02 * s, 0.2 * s, 0.18 * s, 16, 145, ['#d3271a'], 0.006 * s);                               // chilli flakes
  sprouts(ctx, s, -0.25 * s, 0.16 * s, 6, 146);
  limeWedge(ctx, s, 0.25 * s, 0.22 * s, 0.07 * s, 0.7);
};
DISH['pad-see-ew'] = (ctx, s) => {
  plate(ctx, s);
  const cx = 0, cy = 0.02 * s, R = 0.26 * s;
  softShadow(ctx, R * 0.06, cy + R * 0.16, R * 1.02, R * 0.9, 0.16);
  blob(ctx, cx, cy, R, R * 0.9, '#4a2a12', '#2a1408', s * 0.005, 151, 0.06, 14);
  strands(ctx, s, cx, cy, R, 38, ['#7a4620', '#8c5628', '#683a18', '#985f30'], 0.062 * s, 152, { clip: true, aspect: 0.9, hi: 0.5, edge: 0.4 });
  // egg curds, pork, kale
  for (const [dx, dy, r] of [[-0.1, 0.02, 0.3], [0.08, 0.1, 0.8], [0.12, -0.04, -0.4], [-0.04, -0.1, 0.2], [0.0, 0.03, 1.2]]) blob(ctx, cx + dx * s, cy + dy * s, 0.036 * s, 0.024 * s, '#fbdc6a', '#c99a1c', s * 0.0028, 153 + Math.round(dx * 50), 0.14, 9, r);
  for (const [dx, dy, r] of [[-0.14, -0.05, 0.4], [0.05, -0.02, 1.0], [-0.02, 0.12, -0.3], [0.14, 0.06, 0.6]]) { ctx.save(); ctx.translate(cx + dx * s, cy + dy * s); ctx.rotate(r); blob(ctx, 0, 0, 0.04 * s, 0.026 * s, dome(ctx, 0, 0, 0.04 * s, '#d99a7a', '#a86648'), '#6a3a22', s * 0.003, 160 + Math.round(dx * 60), 0.1, 9); ctx.restore(); }
  for (const [dx, dy, r] of [[-0.09, -0.11, 0.9], [0.09, -0.11, -0.6], [-0.15, 0.07, 0.2], [0.02, 0.1, 1.4], [0.15, 0.0, 2.4], [-0.02, -0.02, 0.5]]) {
    const x = cx + dx * s, y = cy + dy * s; ctx.save(); ctx.translate(x, y); ctx.rotate(r);
    fillRR(ctx, -0.06 * s, -0.011 * s, 0.12 * s, 0.022 * s, 0.01 * s, '#6cb545', '#2f6a20', s * 0.0028);
    ellipse(ctx, 0.07 * s, 0, 0.035 * s, 0.026 * s, dome(ctx, 0.07 * s, 0, 0.035 * s, '#4aa03a', '#1f6a22'), '#1a4a18', s * 0.0028); ctx.restore();
  }
  glint(ctx, -0.1 * s, -0.04 * s, 0.05 * s, 0.01 * s, -0.4, 0.3);
  specks(ctx, cx, cy, R * 0.9, R * 0.8, 14, 154, ['#d3271a'], 0.006 * s);
  specks(ctx, cx, cy, R * 0.9, R * 0.8, 10, 155, ['#f6dc8a'], 0.008 * s);
  limeWedge(ctx, s, 0.27 * s, 0.22 * s, 0.06 * s, 0.7);
};
DISH['drunken-spaghetti'] = (ctx, s) => {
  plate(ctx, s);
  const cx = 0, cy = 0.02 * s, R = 0.27 * s;
  spaghettiNest(ctx, s, cx, cy, R, ['#c98235', '#b8702a', '#d69a48', '#a85f22'], 0.017 * s, 171);
  crumbs(ctx, s, cx, cy, R * 0.8, R * 0.7, 46, 172, ['#7c3f1c', '#96502a', '#5f2f14'], 0.013 * s);
  for (const [dx, dy, l] of [[-0.06, 0.05, 0.6], [0.09, 0.04, 0.4], [0.0, -0.08, 0.5]]) { // red pepper strips
    ctx.save(); ctx.translate(dx * s, cy + dy * s); ctx.rotate(l * 3); fillRR(ctx, -0.045 * s, -0.008 * s, 0.09 * s, 0.016 * s, 0.006 * s, dx > 0 ? '#e0a020' : '#d63a2a', '#7a2a12', s * 0.0026); ctx.restore();
  }
  for (const [dx, dy] of [[-0.1, -0.03], [0.04, 0.09], [0.12, -0.05], [-0.03, -0.02], [0.03, -0.11]]) { const x = dx * s, y = cy + dy * s; circle(ctx, x, y, 0.017 * s, '#f6df7c', '#a88a1e', s * 0.0025); circle(ctx, x, y, 0.006 * s, '#e0b93a'); } // baby corn
  for (let i = 0; i < 8; i++) { const a = i * 0.9 + 0.3, d = (0.06 + (i % 3) * 0.05) * s; basilLeaf(ctx, s, Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, 0.065 * s, i * 1.3, '#25601c'); }
  for (let i = 0; i < 9; i++) { const a = i * 1.3 + 0.6, d = (0.05 + (i % 4) * 0.045) * s; chiliRing(ctx, s, Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, 0.016 * s, i % 3 ? '#e0261c' : '#8dc63f'); }
  chiliLong(ctx, s, 0.08 * s, -0.24 * s, 0.14 * s, 0.25, '#c2190f');
  limeWedge(ctx, s, 0.27 * s, 0.22 * s, 0.05 * s, 0.7);
};
DISH['carbonara'] = (ctx, s) => {
  plate(ctx, s);
  const cx = 0, cy = 0.02 * s, R = 0.27 * s;
  spaghettiNest(ctx, s, cx, cy, R, ['#f1d98d', '#ecd07a', '#f6e5a6', '#e4c56c'], 0.017 * s, 181);
  ctx.save(); blobPath(ctx, cx, cy, R, R * 0.92, 181, 0.05, 14); ctx.clip(); // cream sauce sheen
  ctx.fillStyle = radGrad(ctx, cx, cy, 0, R, [[0, 'rgba(255,250,225,.55)'], [1, 'rgba(255,250,225,.1)']], cx - R * 0.2, cy - R * 0.2); ctx.fillRect(cx - R, cy - R, R * 2, R * 2); ctx.restore();
  [[-0.1, -0.07, 0.4], [0.07, -0.09, -0.5], [0.11, 0.06, 0.8], [-0.07, 0.08, -0.2], [0.0, 0.0, 1.3]].forEach(([dx, dy, r]) => baconStrip(ctx, s, dx * s, cy + dy * s, 0.13 * s, r));
  [[-0.13, 0.0, 0.3], [0.03, 0.11, -0.4], [0.13, -0.03, 0.9], [-0.03, -0.13, 0.1]].forEach(([dx, dy, r]) => mushroomSlice(ctx, s, dx * s, cy + dy * s, 0.036 * s, r));
  specks(ctx, cx, cy, R * 0.85, R * 0.75, 26, 182, ['#fffdf0', '#f6efd0'], 0.012 * s, { flat: 0.6 });   // grated cheese
  specks(ctx, cx, cy, R * 0.9, R * 0.8, 40, 183, ['#2a1c10'], 0.0045 * s);                                   // pepper
  specks(ctx, cx, cy, R * 0.85, R * 0.75, 24, 184, ['#3d9a38', '#5cb24a'], 0.006 * s);                       // parsley
  coriander(ctx, s, 0.22 * s, -0.2 * s, 0.09 * s, -0.5);
};

// ---- bowls & the rest ------------------------------------------------------------------------------------
DISH['teriyaki-chicken'] = (ctx, s) => {
  const R = 0.36 * s;
  bowl(ctx, s, 0, 0, R, { rim: '#9c1f16', inner: '#3a2a1e' });
  const rr = R * 0.8;
  rice(ctx, s, 0, 0.005 * s, rr, 191, { n: 110 });
  // glossy teriyaki chicken, two overlapping rows
  const pcs = [[-0.13, -0.08, 0.3], [-0.03, -0.11, -0.1], [0.07, -0.09, 0.2], [0.15, -0.03, 0.6], [-0.1, 0.02, -0.2], [0.0, 0.0, 0.1], [0.1, 0.05, -0.3], [-0.03, 0.11, 0.4], [0.06, 0.13, -0.1]];
  pcs.forEach(([dx, dy, r], i) => porkSlice(ctx, s, dx * s, dy * s, 0.078 * s, 0.045 * s, r, 195 + i, '#a4501a', 0.62));
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(70,25,5,.7)'; ctx.lineWidth = s * 0.008; wobbleStroke(ctx, -0.16 * s, 0.0, 0.16 * s, 0.03 * s, 0.018 * s, 9); ctx.stroke(); ctx.restore();
  specks(ctx, 0.0, 0.0, 0.2 * s, 0.17 * s, 40, 192, ['#fffbee', '#f4e8c8'], 0.0065 * s);                             // sesame
  for (let i = 0; i < 12; i++) { const a = i * 2.3, d = (0.05 + (i % 5) * 0.035) * s; springOnion(ctx, s, Math.cos(a) * d + 0.02 * s, Math.sin(a) * d * 0.9, 0.01 * s); }
  for (const [dx, dy, r] of [[-0.05, -0.02, 0.7], [0.11, 0.0, -0.4], [0.0, 0.09, 1.2]]) { ctx.save(); ctx.translate(dx * s, dy * s); ctx.rotate(r); fillRR(ctx, -0.04 * s, -0.005 * s, 0.08 * s, 0.01 * s, 0.003 * s, '#16281c'); ctx.restore(); }   // shredded nori
  // half a soft-boiled egg
  boiledEgg(ctx, s, -0.19 * s, 0.13 * s, 0.062 * s, 0.4, true);
};
DISH['pork-congee'] = (ctx, s) => {
  const R = 0.35 * s;
  bowl(ctx, s, 0, 0, R, { rim: '#1f5fae' });
  const pr = R * 0.8;
  circle(ctx, 0, 0, pr, dome(ctx, 0, 0, pr, '#faf4e4', '#e2d8bd'), 'rgba(150,135,100,.5)', s * 0.004);
  // porridge grains and swirl
  const r = rng(201);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, pr * 0.97, 0, TAU); ctx.clip();
  for (let i = 0; i < 90; i++) { const a = r() * TAU, d = Math.sqrt(r()) * pr; ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.rotate(r() * Math.PI); ctx.fillStyle = 'rgba(255,255,250,.9)'; ctx.strokeStyle = 'rgba(180,165,130,.4)'; ctx.lineWidth = s * 0.002; ctx.beginPath(); ctx.ellipse(0, 0, 0.018 * s, 0.008 * s, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  // pork meatballs
  [[-0.11, -0.08], [0.08, -0.12], [0.13, 0.05], [-0.06, 0.11], [0.0, 0.0], [-0.15, 0.03]].forEach(([dx, dy], i) => {
    const x = dx * s, y = dy * s, br = 0.034 * s;
    softShadow(ctx, x + br * 0.15, y + br * 0.25, br * 1.05, br * 0.95, 0.16);
    circle(ctx, x, y, br, dome(ctx, x, y, br, '#e0a78a', '#a8674a'), '#7a4028', s * 0.003); glint(ctx, x - br * 0.3, y - br * 0.35, br * 0.3, br * 0.15, -0.5, 0.55);
    specks(ctx, x, y, br * 0.6, br * 0.6, 4, 210 + i, ['#8a4f36'], br * 0.16);
  });
  // ginger threads, spring onion, fried garlic, pepper
  ctx.save(); ctx.strokeStyle = '#f0cf70'; ctx.lineWidth = s * 0.0055; ctx.lineCap = 'round'; for (let i = 0; i < 13; i++) { const a = r() * TAU, d = Math.sqrt(r()) * pr * 0.8, x = Math.cos(a) * d, y = Math.sin(a) * d, b = r() * TAU; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(b) * 0.05 * s, y + Math.sin(b) * 0.05 * s); ctx.stroke(); } ctx.restore();
  for (let i = 0; i < 14; i++) { const a = r() * TAU, d = Math.sqrt(r()) * pr * 0.85; springOnion(ctx, s, Math.cos(a) * d, Math.sin(a) * d, 0.0105 * s); }
  specks(ctx, 0, 0, pr * 0.85, pr * 0.85, 16, 202, ['#e0b04a', '#c99436'], 0.011 * s, { flat: 0.6 });
  specks(ctx, 0, 0, pr * 0.9, pr * 0.9, 30, 203, ['#2a1c10'], 0.004 * s);
  // soft egg in the middle
  blob(ctx, 0.02 * s, 0.0, 0.07 * s, 0.062 * s, '#fffef8', '#d7ceb2', s * 0.003, 204, 0.12, 9);
  circle(ctx, 0.02 * s, 0.0, 0.03 * s, dome(ctx, 0.02 * s, 0, 0.03 * s, '#ffcf3a', '#ee9800'), '#d98500', s * 0.0026);
  coriander(ctx, s, 0.16 * s, -0.16 * s, 0.09 * s, -0.7);
};
DISH['som-tam'] = (ctx, s) => {
  const R = 0.35 * s;
  bowl(ctx, s, 0, 0, R, { rim: '#d33a2c' });
  const pr = R * 0.82;
  circle(ctx, 0, 0, pr, dome(ctx, 0, 0, pr, '#f8f1cf', '#e0d3a2'), 'rgba(140,125,80,.4)', s * 0.004);
  strands(ctx, s, 0, 0, pr, 150, ['#f4ebb9', '#ecdf9e', '#f8f3d8', '#e6d68c'], 0.0135 * s, 211, { clip: true, aspect: 1, hi: 0.5, edge: 0.18 });
  strands(ctx, s, 0, 0, pr, 36, ['#f28a2a', '#e97a1a'], 0.01 * s, 212, { clip: true, aspect: 1, hi: 0.3, edge: 0.25 });
  [[-0.14, -0.06, 0.4], [0.1, -0.12, -0.6], [0.14, 0.06, 0.9], [-0.05, 0.13, -0.2], [0.01, -0.01, 1.4]].forEach(([dx, dy, r]) => tomatoWedge(ctx, s, dx * s, dy * s, 0.05 * s, r));
  [[-0.05, -0.1, 0.3], [0.12, 0.0, -0.7], [-0.13, 0.08, 0.9], [0.06, 0.09, 0.1], [-0.02, 0.02, -0.4], [0.1, -0.06, 0.6]].forEach(([dx, dy, r]) => { ctx.save(); ctx.translate(dx * s, dy * s); ctx.rotate(r); fillRR(ctx, -0.036 * s, -0.008 * s, 0.072 * s, 0.016 * s, 0.008 * s, '#76b53a', '#3b7a1e', s * 0.0026); ctx.restore(); });
  const r = rng(213);
  for (let i = 0; i < 12; i++) { const a = r() * TAU, d = Math.sqrt(r()) * pr * 0.85; peanut(ctx, s, Math.cos(a) * d, Math.sin(a) * d, 0.014 * s, r() * 3); }
  for (let i = 0; i < 8; i++) { const a = r() * TAU, d = Math.sqrt(r()) * pr * 0.8; ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.rotate(r() * TAU); ctx.strokeStyle = '#f0894a'; ctx.lineWidth = s * 0.007; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 0.014 * s, 0.4, 4.2); ctx.stroke(); ctx.restore(); }
  for (let i = 0; i < 7; i++) { const a = r() * TAU, d = Math.sqrt(r()) * pr * 0.8; chiliRing(ctx, s, Math.cos(a) * d, Math.sin(a) * d, 0.014 * s, i % 2 ? '#e0261c' : '#8dc63f'); }
  specks(ctx, 0, 0, pr * 0.8, pr * 0.8, 12, 214, ['#f6e7a0'], 0.009 * s, { flat: 0.6 });
  limeWedge(ctx, s, 0.27 * s, 0.24 * s, 0.06 * s, 0.7);
};
DISH['yam-woon-sen'] = (ctx, s) => {
  const R = 0.35 * s;
  bowl(ctx, s, 0, 0, R, { rim: '#17877f' });
  const pr = R * 0.82;
  circle(ctx, 0, 0, pr, dome(ctx, 0, 0, pr, '#f4eee2', '#d8ceb6'), 'rgba(140,125,90,.4)', s * 0.004);
  strands(ctx, s, 0, 0, pr, 120, ['#f6f2e8', '#e4dccb', '#ffffff', '#ded3bd'], 0.0135 * s, 221, { clip: true, aspect: 1, hi: 0.8, edge: 0.2 });
  crumbs(ctx, s, 0, 0, pr * 0.8, pr * 0.8, 30, 222, ['#d9a27f', '#c58a68', '#e6b898'], 0.011 * s);
  [[-0.13, -0.08, -0.5], [0.1, -0.11, 2.6], [0.03, 0.09, 0.8]].forEach(([dx, dy, r], i) => shrimp(ctx, s, dx * s, dy * s, 0.19 * s, r, '#f6957a', i === 1 ? -1 : 1));
  [[-0.13, 0.07, 0.4], [0.13, 0.04, -0.6], [0.0, -0.07, 1.3]].forEach(([dx, dy, r]) => tomatoWedge(ctx, s, dx * s, dy * s, 0.048 * s, r));
  const r = rng(223);
  for (let i = 0; i < 9; i++) { const a = r() * TAU, d = Math.sqrt(r()) * pr * 0.8; ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.rotate(r() * TAU); ctx.strokeStyle = '#c86aa0'; ctx.lineWidth = s * 0.008; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 0.022 * s, 0.3, 4.4); ctx.stroke(); ctx.strokeStyle = '#f0d8e8'; ctx.lineWidth = s * 0.0035; ctx.stroke(); ctx.restore(); }
  for (let i = 0; i < 10; i++) { const a = r() * TAU, d = Math.sqrt(r()) * pr * 0.85; springOnion(ctx, s, Math.cos(a) * d, Math.sin(a) * d, 0.0105 * s); }
  for (let i = 0; i < 8; i++) { const a = r() * TAU, d = Math.sqrt(r()) * pr * 0.8; chiliRing(ctx, s, Math.cos(a) * d, Math.sin(a) * d, 0.014 * s, i % 3 ? '#e0261c' : '#8dc63f'); }
  for (let i = 0; i < 3; i++) { const a = r() * TAU, d = Math.sqrt(r()) * pr * 0.6; blob(ctx, Math.cos(a) * d, Math.sin(a) * d, 0.024 * s, 0.015 * s, '#5a463c', '#2a1c14', s * 0.0026, 224 + i, 0.3, 9, r() * 3); } // wood-ear mushroom
  coriander(ctx, s, -0.17 * s, -0.17 * s, 0.09 * s, 2.4);
  limeWedge(ctx, s, 0.28 * s, 0.24 * s, 0.06 * s, 0.7);
};
DISH['pork-skewers'] = (ctx, s) => {
  bananaLeaf(ctx, s, 0.0, 0.0, 0.8 * s, 0.56 * s, -0.32);
  // sticky rice, wrapped in a little clear bag
  rice(ctx, s, -0.2 * s, 0.14 * s, 0.14 * s, 231, { tint: '#fffcee', shade: '#ebe2c4', n: 80 });
  glint(ctx, -0.22 * s, 0.09 * s, 0.09 * s, 0.05 * s, -0.5, 0.3);
  // three skewers
  for (let k = 0; k < 3; k++) {
    ctx.save(); ctx.translate(0.08 * s + k * 0.045 * s, (-0.12 + k * 0.1) * s); ctx.rotate(-0.32);
    ctx.strokeStyle = '#d9b676'; ctx.lineWidth = s * 0.012; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-0.34 * s, 0); ctx.lineTo(0.3 * s, 0); ctx.stroke();
    ctx.strokeStyle = '#efd9a4'; ctx.lineWidth = s * 0.005; ctx.beginPath(); ctx.moveTo(-0.33 * s, -s * 0.003); ctx.lineTo(0.29 * s, -s * 0.003); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const x = (-0.14 + i * 0.095) * s;
      porkSlice(ctx, s, x, 0, 0.056 * s, 0.043 * s, (i - 1.5) * 0.07, 240 + k * 4 + i, '#b7602a', 0.5);
      ctx.fillStyle = 'rgba(40,15,5,.5)'; ctx.beginPath(); ctx.ellipse(x + 0.02 * s, 0.008 * s, 0.014 * s, 0.006 * s, 0.5, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  cucumber(ctx, s, 0.26 * s, 0.2 * s, 0.04 * s); cucumber(ctx, s, 0.2 * s, 0.25 * s, 0.04 * s);
  bowl(ctx, s, -0.02 * s, 0.24 * s, 0.05 * s, { rim: '#b3462a' }); circle(ctx, -0.02 * s, 0.24 * s, 0.033 * s, dome(ctx, -0.02 * s, 0.24 * s, 0.033 * s, '#e0521c', '#a52a0a'));
};
DISH['boiled-eggs'] = (ctx, s) => {
  plate(ctx, s, { r: 0.4 });
  boiledEgg(ctx, s, -0.13 * s, 0.03 * s, 0.14 * s, -0.5);
  boiledEgg(ctx, s, 0.06 * s, -0.09 * s, 0.14 * s, 0.35);
  boiledEgg(ctx, s, 0.12 * s, 0.1 * s, 0.13 * s, 1.1, true);
  specks(ctx, 0.12 * s, 0.1 * s, 0.09 * s, 0.09 * s, 10, 251, ['#2a1c10'], 0.0045 * s);
  coriander(ctx, s, -0.02 * s, 0.24 * s, 0.09 * s, 0.4);
};

// ---- frozen dumplings & crispy-pork basil (frozen range) -----------------------------------------------
function gyozaPiece(ctx, s, x, y, L, rot, seed, seared = true) { // crescent dumpling, pleated edge on top
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  softShadow(ctx, L * 0.04, L * 0.14, L * 0.5, L * 0.28, 0.18);
  ctx.beginPath(); ctx.moveTo(-L / 2, L * 0.05); ctx.bezierCurveTo(-L * 0.32, -L * 0.34, L * 0.32, -L * 0.34, L / 2, L * 0.05); ctx.bezierCurveTo(L * 0.3, L * 0.22, -L * 0.3, L * 0.22, -L / 2, L * 0.05); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, -L * 0.3, 0, L * 0.22, [[0, '#fcefc8'], [0.4, '#efcd7c'], [1, seared ? '#ad5e14' : '#e8cf96']]); ctx.fill();
  ctx.save(); ctx.clip(); // seared, crisp underside
  if (seared) { ctx.fillStyle = 'rgba(150,80,15,.45)'; ctx.beginPath(); ctx.ellipse(0, L * 0.2, L * 0.42, L * 0.12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(110,55,8,.3)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse((-0.3 + i * 0.15) * L, L * (0.12 + (i % 2) * 0.03), L * 0.05, L * 0.02, 0.3, 0, TAU); ctx.fill(); } }
  ctx.restore();
  ctx.strokeStyle = seared ? '#8a5a18' : '#b89c5a'; ctx.lineWidth = s * 0.0034; ctx.stroke();
  ctx.strokeStyle = 'rgba(140,95,40,.6)'; ctx.lineWidth = s * 0.003; ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) { const t = -0.37 + i * 0.106; ctx.beginPath(); ctx.moveTo(t * L, -L * 0.16 + Math.abs(t) * L * 0.36); ctx.quadraticCurveTo((t + 0.02) * L, -L * 0.11 + Math.abs(t) * L * 0.3, (t + 0.05) * L, -L * 0.05 + Math.abs(t) * L * 0.26); ctx.stroke(); } // pleats
  glint(ctx, -L * 0.1, -L * 0.1, L * 0.16, L * 0.04, -0.1, 0.42);
  ctx.restore();
}
DISH['gyoza'] = (ctx, s) => {
  plate(ctx, s);
  const pos = [[-0.14, -0.13, -0.25], [0.06, -0.17, 0.1], [0.18, -0.05, 0.4], [-0.16, 0.04, 0.15], [0.01, -0.02, -0.1], [0.14, 0.1, 0.05], [-0.08, 0.16, -0.2]];
  pos.forEach(([dx, dy, r], i) => gyozaPiece(ctx, s, dx * s, dy * s, 0.225 * s, r, 260 + i));
  bowl(ctx, s, 0.22 * s, 0.22 * s, 0.06 * s, { rim: '#8a3a1a' }); circle(ctx, 0.22 * s, 0.22 * s, 0.042 * s, dome(ctx, 0.22 * s, 0.22 * s, 0.042 * s, '#5a2a12', '#24100a'));
  specks(ctx, 0.22 * s, 0.22 * s, 0.03 * s, 0.03 * s, 5, 261, ['#d33a1a'], 0.005 * s);
  springOnion(ctx, s, -0.05 * s, 0.26 * s, 0.012 * s); springOnion(ctx, s, 0.0, 0.28 * s, 0.012 * s);
};
function shumaiPiece(ctx, s, x, y, r, seed) { // open-topped steamed dumpling
  softShadow(ctx, x + r * 0.1, y + r * 0.22, r * 1.05, r * 0.95, 0.18);
  circle(ctx, x, y, r, dome(ctx, x, y, r, '#fdf0c4', '#e4c07a'), '#b3893a', s * 0.0034);
  ctx.strokeStyle = 'rgba(160,110,40,.55)'; ctx.lineWidth = s * 0.0026; ctx.lineCap = 'round'; for (let i = 0; i < 14; i++) { const a = (i * TAU) / 14 + 0.2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95); ctx.quadraticCurveTo(x + Math.cos(a + 0.12) * r * 0.78, y + Math.sin(a + 0.12) * r * 0.78, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62); ctx.stroke(); }
  circle(ctx, x, y, r * 0.62, dome(ctx, x, y, r * 0.62, '#ecae8c', '#b8694a'), '#8a4a30', s * 0.003);
  crumbs(ctx, s, x, y, r * 0.44, r * 0.44, 12, seed, ['#c47a56', '#d99a78', '#b26644', '#e8b898'], r * 0.13, 0.3);
  circle(ctx, x, y - r * 0.04, r * 0.13, '#f39a2e', '#b85a10', s * 0.002); // carrot / roe dot
  glint(ctx, x - r * 0.3, y - r * 0.35, r * 0.25, r * 0.1, -0.6, 0.4);
}
DISH['shumai'] = (ctx, s) => {
  plate(ctx, s);
  [[-0.12, -0.1], [0.11, -0.1], [-0.13, 0.11], [0.12, 0.11], [0.0, 0.0]].forEach(([dx, dy], i) => shumaiPiece(ctx, s, dx * s, dy * s, 0.088 * s, 270 + i));
  bowl(ctx, s, 0.0, 0.27 * s, 0.05 * s, { rim: '#8a3a1a' }); circle(ctx, 0, 0.27 * s, 0.034 * s, dome(ctx, 0, 0.27 * s, 0.034 * s, '#5a2a12', '#24100a'));
};
DISH['crispy-basil'] = (ctx, s) => {
  plate(ctx, s);
  rice(ctx, s, -0.15 * s, 0.06 * s, 0.17 * s, 281, { n: 90 });
  const tx = 0.12 * s, ty = 0.07 * s;
  softShadow(ctx, tx + s * 0.012, ty + s * 0.03, 0.2 * s, 0.17 * s, 0.16);
  blob(ctx, tx, ty, 0.2 * s, 0.17 * s, dome(ctx, tx, ty, 0.2 * s, '#a5662f', '#4f2610'), '#3a1a08', s * 0.005, 282, 0.13, 13, 0.3);
  const cubes = [[-0.06, -0.06], [0.05, -0.09], [0.11, 0.0], [-0.02, 0.03], [0.05, 0.08], [-0.1, 0.06], [0.11, 0.1]];
  const r = rng(283);
  cubes.forEach(([dx, dy], i) => crispCube(ctx, s, tx + dx * s, ty + dy * s, 0.06 * s, (r() - 0.5) * 1.2, 290 + i));
  for (let i = 0; i < 10; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.15 * s; basilLeaf(ctx, s, tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.85, 0.058 * s, r() * TAU, '#26591c'); }
  for (let i = 0; i < 8; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.15 * s; chiliRing(ctx, s, tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.85, 0.014 * s, i % 3 ? '#e0261c' : '#8dc63f'); }
  friedEgg(ctx, s, -0.03 * s, -0.19 * s, 0.14 * s, 13, -0.2);
  cucumber(ctx, s, -0.24 * s, 0.24 * s, 0.045 * s); cucumber(ctx, s, -0.14 * s, 0.285 * s, 0.045 * s);
};

// ================================================================================================ SANDWICHES
// A diagonally cut sandwich half in 3/4 view: the top slice (triangle with crust on its two short sides) sits on a
// thick "cut face" strip that shows the layers. `layers` = [[colour, weight, style]] from top to bottom.
function layerBand(ctx, s, x0, x1, y0, y1, col, style, seed) {
  const r = rng(seed), h = y1 - y0;
  ctx.fillStyle = col;
  if (style === 'wavy') { // lettuce
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0 + h * 0.3);
    const n = 9; for (let i = 0; i <= n; i++) ctx.lineTo(x0 + ((x1 - x0) * i) / n, y0 + (i % 2 ? h * 0.05 : h * 0.4));
    ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = darken(col, 0.3); ctx.lineWidth = s * 0.0024; ctx.stroke();
  } else if (style === 'fluff') { // pork floss
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0 + h * 0.4);
    const n = 26; for (let i = 0; i <= n; i++) ctx.lineTo(x0 + ((x1 - x0) * i) / n, y0 + h * (0.05 + r() * 0.35));
    ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = darken(col, 0.35); ctx.lineWidth = s * 0.0022; ctx.lineCap = 'round';
    for (let i = 0; i < 24; i++) { const px = x0 + (x1 - x0) * r(), py = y0 + h * (0.2 + r() * 0.7); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (r() - 0.5) * s * 0.06, py + (r() - 0.5) * h * 0.4); ctx.stroke(); }
    ctx.strokeStyle = lighten(col, 0.35); for (let i = 0; i < 14; i++) { const px = x0 + (x1 - x0) * r(), py = y0 + h * (0.15 + r() * 0.6); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (r() - 0.5) * s * 0.05, py + (r() - 0.5) * h * 0.3); ctx.stroke(); }
  } else if (style === 'crab') { // crab stick slices: red rim, white centre
    ctx.fillRect(x0, y0, x1 - x0, h);
    const n = 7, w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) { ctx.fillStyle = '#f3ede0'; ctx.fillRect(x0 + i * w + w * 0.1, y0 + h * 0.15, w * 0.8, h * 0.7); ctx.fillStyle = '#e8452c'; ctx.fillRect(x0 + i * w + w * 0.1, y0 + h * 0.15, w * 0.8, h * 0.2); ctx.fillRect(x0 + i * w + w * 0.1, y0 + h * 0.68, w * 0.8, h * 0.17); }
  } else ctx.fillRect(x0, y0, x1 - x0, h);
}
function sandHalf(ctx, s, x, y, rot, o) {
  const W = 0.58 * s, H = 0.29 * s, T = 0.2 * s, cr = s * 0.022;
  const layers = o.layers, tot = layers.reduce((a, l) => a + l[1], 0);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  softShadow(ctx, s * 0.02, T + H * 0.12, W * 0.56, H * 0.24, 0.22);
  // ---- cut face
  ctx.save(); fillRR(ctx, -W / 2, 0, W, T, cr, o.bread || '#fbf0d6', null); rrPath2(ctx, -W / 2, 0, W, T, cr); ctx.clip();
  let yy = 0, k = 0;
  for (const [col, wgt, st] of layers) {
    const hh = (T * wgt) / tot;
    layerBand(ctx, s, -W / 2, W / 2, yy, yy + hh, col, st, o.seed + k++);
    yy += hh;
  }
  if (o.flecks) specks(ctx, 0, T * 0.5, W * 0.46, T * 0.3, o.flecks.n, o.seed + 40, o.flecks.cols, s * o.flecks.size, { flat: 0.8 });
  ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fillRect(-W / 2, T * 0.82, W, T * 0.18); // underside shading
  ctx.restore();
  rrPath2(ctx, -W / 2, 0, W, T, cr); ctx.strokeStyle = o.line || '#8a6a30'; ctx.lineWidth = s * 0.0036; ctx.lineJoin = 'round'; ctx.stroke();
  // ---- top face (triangle, crust along the two legs)
  const crust = o.crust || '#dca85c', c = s * 0.03;
  ctx.beginPath(); ctx.moveTo(-W / 2, 0); ctx.lineTo(0, -H); ctx.lineTo(W / 2, 0); ctx.closePath();
  ctx.fillStyle = crust; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-W / 2 + c * 1.4, 0); ctx.lineTo(0, -H + c * 1.9); ctx.lineTo(W / 2 - c * 1.4, 0); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, -H * 0.3, 0, W * 0.45, [[0, lighten(o.bread || '#fbf0d6', 0.4)], [1, o.bread || '#fbf0d6']]); ctx.fill();
  if (o.grill) { // toasted grill marks
    ctx.save(); ctx.beginPath(); ctx.moveTo(-W / 2 + c * 1.4, 0); ctx.lineTo(0, -H + c * 1.9); ctx.lineTo(W / 2 - c * 1.4, 0); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = 'rgba(110,60,14,.7)'; ctx.lineWidth = s * 0.02; ctx.lineCap = 'round';
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * W * 0.11 - H * 0.6, -H * 0.05); ctx.lineTo(i * W * 0.11 + H * 0.6, -H * 0.85); ctx.stroke(); }
    ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(-W / 2, 0); ctx.lineTo(0, -H); ctx.lineTo(W / 2, 0); ctx.closePath();
  ctx.strokeStyle = o.line || '#8a6a30'; ctx.lineWidth = s * 0.0036; ctx.stroke();
  glint(ctx, -W * 0.1, -H * 0.42, W * 0.12, H * 0.07, -0.8, 0.35);
  ctx.restore();
}
function rrPath2(ctx, x, y, w, h, r) { // rounded-rect path only (no fill), for clipping
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
const BR = '#fbf0d6', LET = '#7cc142', BUT = '#fff7dc';
const SAND = {
  ham: { layers: [[BR, 1.2], [BUT, 0.3], [LET, 1.1, 'wavy'], ['#ee8f98', 1.3], ['#ffd23c', 1.1], [BR, 1.2]], hint: 'cheese' },
  tuna: { layers: [[BR, 1.2], [LET, 0.9, 'wavy'], ['#eed4ae', 3.0], [BR, 1.2]], flecks: { n: 36, cols: ['#e9a596', '#fff4e0', '#c98a6a'], size: 0.011 }, hint: 'tuna' },
  egg: { layers: [[BR, 1.2], [LET, 0.9, 'wavy'], ['#f7df76', 3.0], [BR, 1.2]], flecks: { n: 34, cols: ['#fffbe8', '#fff2b0', '#8dc63f'], size: 0.013 }, hint: 'egg' },
  floss: { layers: [[BR, 1.2], [BUT, 0.5], ['#c98b48', 2.9, 'fluff'], [BUT, 0.4], [BR, 1.2]], hint: 'floss' },
  crab: { layers: [[BR, 1.2], [LET, 0.8, 'wavy'], ['#f6efe2', 2.4, 'crab'], [BUT, 0.5], [BR, 1.2]], hint: 'crab' },
  teri: { layers: [['#e8b25e', 1.2], ['#ffcf3a', 0.9], ['#7b3a14', 2.2], ['#ffcf3a', 0.7], ['#e8b25e', 1.2]], flecks: { n: 20, cols: ['#fff6e0', '#3a1c0a'], size: 0.008 }, crust: '#b9782e', bread: '#f0c273', line: '#6a4218', grill: true, hint: 'chicken' },
};
function sandHint(ctx, s, kind, x, y) {
  if (kind === 'cheese') { poly(ctx, [[x - s * 0.07, y + s * 0.05], [x + s * 0.07, y + s * 0.05], [x, y - s * 0.07]], '#ffd23c', '#b08a10', s * 0.003); circle(ctx, x - s * 0.01, y + s * 0.02, s * 0.012, '#e9b820'); }
  else if (kind === 'tuna') { // a little tuna
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.25); const L = s * 0.19;
    poly(ctx, [[L * 0.28, 0], [L * 0.52, -L * 0.18], [L * 0.52, L * 0.18]], '#3b5f88', '#22384f', s * 0.003);
    ellipse(ctx, 0, 0, L * 0.38, L * 0.18, linGrad(ctx, 0, -L * 0.18, 0, L * 0.18, [[0, '#3b5f88'], [0.55, '#8fb0cd'], [1, '#eef4f9']]), '#22384f', s * 0.003);
    poly(ctx, [[-L * 0.06, -L * 0.15], [L * 0.04, -L * 0.28], [L * 0.13, -L * 0.14]], '#3b5f88', '#22384f', s * 0.0025);
    circle(ctx, -L * 0.25, -L * 0.03, L * 0.028, '#111'); ctx.restore();
  }
  else if (kind === 'egg') { boiledEgg(ctx, s, x, y, s * 0.06, 0.6, true); }
  else if (kind === 'floss') { for (let i = 0; i < 16; i++) { const a = i * 0.7, d = (i % 5) * s * 0.012; ctx.strokeStyle = i % 2 ? '#c98b48' : '#e6b06a'; ctx.lineWidth = s * 0.004; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d); ctx.lineTo(x + Math.cos(a) * d + Math.cos(a + 1) * s * 0.05, y + Math.sin(a) * d + Math.sin(a + 1) * s * 0.05); ctx.stroke(); } }
  else if (kind === 'crab') { for (let i = 0; i < 2; i++) { ctx.save(); ctx.translate(x, y + i * s * 0.045); ctx.rotate(-0.2 + i * 0.3); fillRR(ctx, -s * 0.07, -s * 0.017, s * 0.14, s * 0.034, s * 0.015, '#f6efe2', '#a08a70', s * 0.0026); fillRR(ctx, -s * 0.07, -s * 0.017, s * 0.14, s * 0.012, s * 0.006, '#e8452c'); ctx.restore(); } }
  else if (kind === 'chicken') { porkSlice(ctx, s, x, y, s * 0.06, s * 0.035, 0.3, 305, '#9c4a18', 0.6); specks(ctx, x, y, s * 0.05, s * 0.03, 8, 306, ['#fff6e0'], s * 0.005); }
}
function faSand(ctx, s, o = {}) {
  const K = SAND[o.kind || 'ham'];
  ctx.save(); ctx.translate(0, s * 0.04);
  // a lettuce leaf peeking out from behind
  ctx.save(); ctx.translate(-s * 0.02, -s * 0.16); blob(ctx, 0, 0, s * 0.34, s * 0.15, dome(ctx, 0, 0, s * 0.3, '#a6dd62', '#4f9a2a'), '#2f6e18', s * 0.004, 311, 0.14, 12, -0.15); ctx.restore();
  sandHalf(ctx, s, -s * 0.06, -s * 0.13, -0.1, { ...K, seed: 320 });
  sandHalf(ctx, s, s * 0.05, s * 0.13, 0.05, { ...K, seed: 340 });
  sandHint(ctx, s, K.hint, -s * 0.3, s * 0.3);
  ctx.restore();
}

// ================================================================================================ ONIGIRI (rice balls)
function roundedTri(ctx, p, r) {
  const n = p.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(p[n - 1], p[0]);
  ctx.beginPath(); ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const m = mid(p[i], p[(i + 1) % n]); ctx.arcTo(p[i][0], p[i][1], m[0], m[1], r); }
  ctx.closePath();
}
const ONI = {
  tuna: { topping: 'tuna' }, salmon: { topping: 'salmon' }, teri: { topping: 'chicken' }, pork: { topping: 'pork' }, nori: { topping: null, full: true },
};
function faOnigiri(ctx, s, o = {}) {
  const K = ONI[o.kind || 'tuna'];
  ctx.save(); ctx.translate(-s * 0.005, s * 0.02); ctx.rotate(-0.08);
  const tri = [[0, -0.43 * s], [0.4 * s, 0.28 * s], [-0.4 * s, 0.28 * s]], rr = 0.12 * s;
  softShadow(ctx, s * 0.03, s * 0.32, s * 0.42, s * 0.08, 0.22);
  roundedTri(ctx, tri, rr); ctx.fillStyle = radGrad(ctx, -s * 0.08, -s * 0.12, 0, s * 0.5, [[0, '#ffffff'], [0.7, '#f7f3e4'], [1, '#d9d2b8']]); ctx.fill();
  ctx.save(); roundedTri(ctx, tri, rr); ctx.clip();
  // rice grains
  const R = rng(350);
  for (let i = 0; i < 90; i++) {
    const x = (R() - 0.5) * 0.6 * s, y = (R() - 0.7) * 0.6 * s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(R() * Math.PI); ctx.fillStyle = 'rgba(255,255,250,.9)'; ctx.strokeStyle = 'rgba(160,148,116,.4)'; ctx.lineWidth = s * 0.0022;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.0165, s * 0.0068, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  // nori wrap: covers the lower part (whole ball for the plain seaweed one)
  const top = K.full ? -0.5 * s : 0.05 * s;
  ctx.beginPath(); ctx.moveTo(-0.5 * s, top + 0.03 * s);
  ctx.bezierCurveTo(-0.2 * s, top - 0.05 * s, 0.2 * s, top + 0.09 * s, 0.5 * s, top - 0.01 * s); ctx.lineTo(0.5 * s, 0.4 * s); ctx.lineTo(-0.5 * s, 0.4 * s); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, -0.3 * s, 0, 0.3 * s, 0.3 * s, [[0, '#0f2418'], [0.5, '#1f3d2a'], [1, '#0b1a10']]); ctx.fill();
  ctx.strokeStyle = 'rgba(120,190,140,.22)'; ctx.lineWidth = s * 0.006; ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) { const y0 = top + (0.06 + i * 0.06) * s; ctx.beginPath(); ctx.moveTo(-0.34 * s, y0); ctx.lineTo(0.34 * s, y0 + s * 0.02); ctx.stroke(); }
  if (K.full) specks(ctx, 0, -0.05 * s, 0.22 * s, 0.3 * s, 26, 351, ['#f4ecd6', '#d8cfb2'], s * 0.006, { flat: 0.6 });
  ctx.restore();
  roundedTri(ctx, tri, rr); ctx.strokeStyle = 'rgba(70,60,40,.55)'; ctx.lineWidth = s * 0.006; ctx.lineJoin = 'round'; ctx.stroke();
  // the filling peeks out on top
  const tx = 0, ty = -0.17 * s;
  if (K.topping === 'tuna') { blob(ctx, tx, ty, s * 0.1, s * 0.07, dome(ctx, tx, ty, s * 0.1, '#f6e2c0', '#d8b988'), '#a5854e', s * 0.004, 352, 0.2, 10); specks(ctx, tx, ty, s * 0.07, s * 0.04, 9, 353, ['#e8a596', '#fffaf0'], s * 0.009); }
  if (K.topping === 'salmon') { for (let i = 0; i < 7; i++) blob(ctx, tx + (i - 3) * s * 0.026, ty + ((i * 7) % 3 - 1) * s * 0.02, s * 0.036, s * 0.02, dome(ctx, 0, 0, s * 0.04, '#ffa07a', '#e0603c'), '#b04020', s * 0.003, 354 + i, 0.2, 8, i * 0.6); }
  if (K.topping === 'chicken') { porkSlice(ctx, s, tx, ty, s * 0.09, s * 0.055, 0.15, 355, '#9c4a18', 0.6); specks(ctx, tx, ty, s * 0.07, s * 0.04, 9, 356, ['#fffbee'], s * 0.006); }
  if (K.topping === 'pork') { blob(ctx, tx, ty, s * 0.095, s * 0.065, dome(ctx, tx, ty, s * 0.1, '#b0552c', '#6e2a12'), '#4a1a08', s * 0.004, 357, 0.18, 10); crumbs(ctx, s, tx, ty, s * 0.07, s * 0.04, 14, 358, ['#c8663a', '#8a3a1a'], s * 0.011); for (let i = 0; i < 3; i++) chiliRing(ctx, s, tx + (i - 1) * s * 0.04, ty + (i % 2) * s * 0.02, s * 0.012, i % 2 ? '#e0261c' : '#8dc63f'); }
  glint(ctx, -s * 0.13, -s * 0.05, s * 0.06, s * 0.1, 0.5, 0.28);
  ctx.restore();
}

// ================================================================================================ HOT COUNTER (steamer / roller grill / hot case)
// These sit on the right of a 12 x 8 cm pack, so everything stays inside about +-0.44*s.
function steam(ctx, s, x, y, n = 3) {
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const sx = x + (i - (n - 1) / 2) * s * 0.1, path = () => { ctx.beginPath(); ctx.moveTo(sx, y); ctx.bezierCurveTo(sx - s * 0.05, y - s * 0.05, sx + s * 0.05, y - s * 0.1, sx, y - s * 0.16 - (i % 2) * s * 0.02); };
    ctx.strokeStyle = 'rgba(90,70,50,.18)'; ctx.lineWidth = s * 0.03; path(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = s * 0.02; path(); ctx.stroke();
  }
  ctx.restore();
}
function sauceCup(ctx, s, x, y, r, col, dark) {
  circle(ctx, x, y, r, radGrad(ctx, x, y, r * 0.7, r, [[0, '#ffffff'], [1, '#d8d2c2']]), '#9c9684', s * 0.004);
  circle(ctx, x, y, r * 0.76, dome(ctx, x, y, r * 0.76, col, dark), darken(dark, 0.3), s * 0.003);
  glint(ctx, x - r * 0.25, y - r * 0.28, r * 0.26, r * 0.12, -0.6, 0.55);
}
function capsule(ctx, x, y, L, W, rot, draw) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); draw(); ctx.restore(); }

// ---- steamed buns ----------------------------------------------------------------------------------------
function bunWhole(ctx, s, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  softShadow(ctx, r * 0.08, r * 0.6, r * 1.02, r * 0.3, 0.26);
  ctx.beginPath(); ctx.moveTo(-r, r * 0.3); ctx.bezierCurveTo(-r * 1.08, -r * 0.92, r * 1.08, -r * 0.92, r, r * 0.3); ctx.bezierCurveTo(r * 0.85, r * 0.72, -r * 0.85, r * 0.72, -r, r * 0.3); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.25, [[0, '#ffffff'], [0.6, '#fcf5e4'], [1, '#e2cea0']], -r * 0.3, -r * 0.45); ctx.fill();
  ctx.strokeStyle = '#a8905a'; ctx.lineWidth = s * 0.006; ctx.lineJoin = 'round'; ctx.stroke();
  // pleats spiral out from the knot on top
  const kx = 0, ky = -r * 0.42;
  ctx.strokeStyle = 'rgba(150,118,66,.6)'; ctx.lineWidth = s * 0.0046; ctx.lineCap = 'round';
  for (let i = 0; i < 15; i++) {
    const th = Math.PI * (0.03 + (0.94 * i) / 14), ex = -Math.cos(th) * r * 0.97, ey = r * 0.3 + Math.sin(th) * r * 0.3;
    const mx = kx + (ex - kx) * 0.55, my = ky + (ey - ky) * 0.55, px = -(ey - ky), py = ex - kx, L = Math.hypot(px, py) || 1;
    ctx.beginPath(); ctx.moveTo(kx + (ex - kx) * 0.12, ky + (ey - ky) * 0.12); ctx.quadraticCurveTo(mx + (px / L) * r * 0.16, my + (py / L) * r * 0.16, ex, ey); ctx.stroke();
  }
  circle(ctx, kx, ky, r * 0.11, '#f5e9cc', '#a8905a', s * 0.0035); swirl(ctx, s, kx, ky, r * 0.07, 'rgba(150,118,66,.8)', s * 0.0035, 1.4);
  glint(ctx, -r * 0.35, -r * 0.4, r * 0.3, r * 0.1, -0.6, 0.5);
  ctx.restore();
}
function bunHalf(ctx, s, x, y, r, rot, kind) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  softShadow(ctx, r * 0.06, r * 0.34, r * 1.0, r * 0.2, 0.26);
  const dome1 = (k, yb) => { ctx.beginPath(); ctx.moveTo(-r * k, yb); ctx.bezierCurveTo(-r * k * 1.05, -r * 1.0 * k, r * k * 1.05, -r * 1.0 * k, r * k, yb); ctx.closePath(); };
  dome1(1, r * 0.3); ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.2, [[0, '#ffffff'], [1, '#e9d8ae']], -r * 0.3, -r * 0.3); ctx.fill(); ctx.strokeStyle = '#a8905a'; ctx.lineWidth = s * 0.006; ctx.stroke();
  dome1(0.84, r * 0.28); ctx.save(); ctx.clip();
  const f = {
    pork: () => { ctx.fillStyle = dome(ctx, 0, -r * 0.1, r, '#c0703c', '#7a3416'); ctx.fillRect(-r, -r, r * 2, r * 1.4); crumbs(ctx, s, 0, -r * 0.1, r * 0.7, r * 0.5, 30, 401, ['#8a4520', '#a5602c', '#6a3010'], r * 0.11); blob(ctx, r * 0.24, -r * 0.05, r * 0.24, r * 0.17, '#fffdf2', '#c8bf9c', s * 0.003, 402, 0.1, 9); circle(ctx, r * 0.24, -r * 0.05, r * 0.1, '#ffc832'); },
    custard: () => { ctx.fillStyle = linGrad(ctx, 0, -r, 0, r * 0.3, [[0, '#ffe680'], [1, '#f3b91e']]); ctx.fillRect(-r, -r, r * 2, r * 1.4); glint(ctx, -r * 0.25, -r * 0.4, r * 0.3, r * 0.1, -0.4, 0.6); },
    sesame: () => { ctx.fillStyle = linGrad(ctx, 0, -r, 0, r * 0.3, [[0, '#46434e'], [1, '#1c1a22']]); ctx.fillRect(-r, -r, r * 2, r * 1.4); glint(ctx, -r * 0.25, -r * 0.42, r * 0.32, r * 0.09, -0.4, 0.4); specks(ctx, 0, -r * 0.1, r * 0.6, r * 0.4, 16, 403, ['#f4ecd6'], r * 0.05); },
    hamcheese: () => { ctx.fillStyle = '#fbf3e0'; ctx.fillRect(-r, -r, r * 2, r * 1.4); ctx.fillStyle = dome(ctx, 0, 0, r, '#f7a2a8', '#e0707a'); fillRR(ctx, -r * 0.8, -r * 0.3, r * 1.6, r * 0.28, r * 0.06, '#f29aa2', '#b8545e', s * 0.003); fillRR(ctx, -r * 0.82, -r * 0.02, r * 1.64, r * 0.24, r * 0.05, '#ffd23c', '#b58a10', s * 0.003); ctx.fillStyle = '#ffd23c'; ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.2); ctx.quadraticCurveTo(r * 0.56, r * 0.42, r * 0.44, r * 0.5); ctx.lineTo(r * 0.36, r * 0.2); ctx.fill(); },
  }[kind];
  f();
  ctx.restore();
  dome1(0.84, r * 0.28); ctx.strokeStyle = 'rgba(140,110,60,.6)'; ctx.lineWidth = s * 0.0035; ctx.stroke();
  ctx.restore();
}
const HOT_KINDS = {};
['pork', 'custard', 'sesame', 'hamcheese'].forEach((k) => {
  HOT_KINDS['bun-' + k] = (ctx, s) => {
    bunWhole(ctx, s, -s * 0.1, -s * 0.03, s * 0.32);
    bunHalf(ctx, s, s * 0.2, s * 0.22, s * 0.22, 0.05, k);
    steam(ctx, s, -s * 0.1, -s * 0.34, 3);
  };
});
HOT_KINDS['shumai-steamed'] = (ctx, s) => {
  // bamboo steamer, seen from above, with three dumplings
  const R = s * 0.43;
  softShadow(ctx, R * 0.05, R * 0.14, R * 1.04, R * 0.98, 0.22);
  circle(ctx, 0, 0, R, radGrad(ctx, 0, 0, 0, R, [[0, '#d9ae66'], [1, '#a67a34']]), '#6a4a18', s * 0.008);
  ctx.strokeStyle = 'rgba(90,60,20,.45)'; ctx.lineWidth = s * 0.004; for (let i = 0; i < 20; i++) { const a = (i * TAU) / 20; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86); ctx.lineTo(Math.cos(a) * R * 0.99, Math.sin(a) * R * 0.99); ctx.stroke(); }
  circle(ctx, 0, 0, R * 0.84, '#f6efdc', '#b9a476', s * 0.005); circle(ctx, 0, 0, R * 0.7, null, 'rgba(160,140,100,.35)', s * 0.004);
  [[-0.15, -0.1], [0.15, -0.1], [0.0, 0.15]].forEach(([dx, dy], i) => shumaiPiece(ctx, s, dx * s, dy * s, 0.13 * s, 410 + i));
  steam(ctx, s, 0, -s * 0.32, 3);
};

// ---- sausages --------------------------------------------------------------------------------------------
function sausageBody(ctx, s, L, W, base, dark, o = {}) { // drawn centred at the origin (call inside capsule())
  softShadow(ctx, W * 0.1, W * 0.62, L * 0.5, W * 0.22, 0.24);
  fillRR(ctx, -L / 2, -W / 2, L, W, W / 2, linGrad(ctx, 0, -W / 2, 0, W / 2, [[0, lighten(base, 0.28)], [0.45, base], [1, dark]]), darken(dark, 0.5), s * 0.005);
  ctx.save(); rrPath2(ctx, -L / 2, -W / 2, L, W, W / 2); ctx.clip();
  if (o.stripes !== false) { ctx.strokeStyle = 'rgba(50,15,5,.4)'; ctx.lineWidth = W * 0.09; ctx.lineCap = 'butt'; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(i * L * 0.075 - W * 0.4, -W * 0.5); ctx.lineTo(i * L * 0.075 + W * 0.4, W * 0.5); ctx.stroke(); } }
  if (o.fat) specks(ctx, 0, 0, L * 0.45, W * 0.4, o.fat, 421, ['#f3d9c4', '#e8bfa4'], W * 0.055);
  ctx.restore();
  glint(ctx, -L * 0.05, -W * 0.27, L * 0.3, W * 0.07, 0, 0.55);
}
HOT_KINDS['sausage-cheese'] = (ctx, s) => {
  capsule(ctx, -s * 0.02, -s * 0.09, 0, 0, -0.32, () => sausageBody(ctx, s, s * 0.8, s * 0.17, '#c8482a', '#7a2210'));
  capsule(ctx, s * 0.02, s * 0.15, 0, 0, -0.32, () => {
    sausageBody(ctx, s, s * 0.66, s * 0.17, '#c8482a', '#7a2210');
    // sliced open: molten cheese oozing from the cut end
    const ex = s * 0.33;
    ellipse(ctx, ex, 0, s * 0.04, s * 0.085, dome(ctx, ex, 0, s * 0.08, '#ffe45a', '#f0b000'), '#b98500', s * 0.004);
    ctx.fillStyle = '#ffd52a'; ctx.strokeStyle = '#b98500'; ctx.lineWidth = s * 0.004; ctx.beginPath(); ctx.moveTo(ex, -s * 0.05); ctx.bezierCurveTo(ex + s * 0.1, -s * 0.06, ex + s * 0.13, s * 0.02, ex + s * 0.1, s * 0.07); ctx.bezierCurveTo(ex + s * 0.08, s * 0.1, ex + s * 0.04, s * 0.09, ex + s * 0.02, s * 0.06); ctx.closePath(); ctx.fill(); ctx.stroke();
    glint(ctx, ex + s * 0.05, -s * 0.02, s * 0.03, s * 0.012, 0.5, 0.6);
  });
};
HOT_KINDS['sausage-smoked'] = (ctx, s) => {
  capsule(ctx, -s * 0.02, -s * 0.13, 0, 0, -0.25, () => sausageBody(ctx, s, s * 0.82, s * 0.15, '#96361f', '#4e170c', { stripes: true }));
  capsule(ctx, s * 0.0, s * 0.08, 0, 0, -0.25, () => sausageBody(ctx, s, s * 0.82, s * 0.15, '#96361f', '#4e170c', { stripes: true }));
  // a slice to show the pink inside
  [[0.2, 0.27], [0.06, 0.29]].forEach(([dx, dy], i) => { circle(ctx, dx * s, dy * s, s * 0.062, dome(ctx, dx * s, dy * s, s * 0.062, '#f0a898', '#c8705c'), '#6a2a1a', s * 0.005); specks(ctx, dx * s, dy * s, s * 0.04, s * 0.04, 8, 430 + i, ['#f8d4c6', '#a8503c'], s * 0.007); circle(ctx, dx * s, dy * s, s * 0.062, null, '#7a2c18', s * 0.008); });
};
HOT_KINDS['sausage-isan'] = (ctx, s) => {
  // two short fat links + fresh chilli, ginger and cabbage
  ctx.save(); ctx.translate(-s * 0.02, -s * 0.16); blob(ctx, 0, 0, s * 0.36, s * 0.12, dome(ctx, 0, 0, s * 0.3, '#cdeca0', '#6fae3a'), '#3f7a20', s * 0.004, 440, 0.14, 12, -0.1); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = s * 0.006; ctx.beginPath(); ctx.moveTo(-s * 0.3, 0); ctx.lineTo(s * 0.3, -s * 0.01); ctx.stroke(); ctx.restore();
  capsule(ctx, -s * 0.16, s * 0.06, 0, 0, -0.35, () => sausageBody(ctx, s, s * 0.36, s * 0.19, '#c07a5a', '#7a3c26', { stripes: false, fat: 34 }));
  capsule(ctx, s * 0.12, s * 0.01, 0, 0, -0.35, () => sausageBody(ctx, s, s * 0.36, s * 0.19, '#c07a5a', '#7a3c26', { stripes: false, fat: 34 }));
  ctx.strokeStyle = '#e9dcc0'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.moveTo(-s * 0.02, s * 0.06); ctx.lineTo(s * 0.0, s * 0.02); ctx.stroke(); // string between links
  chiliLong(ctx, s, s * 0.06, s * 0.3, s * 0.2, -0.15, '#d6231a'); chiliLong(ctx, s, s * 0.22, s * 0.25, s * 0.16, 0.4, '#79b83a');
  for (let i = 0; i < 3; i++) blob(ctx, -s * 0.28 + i * s * 0.05, s * 0.3, s * 0.03, s * 0.02, '#f2dc98', '#b8974a', s * 0.003, 441 + i, 0.15, 8, i);
};
HOT_KINDS['hotdog'] = (ctx, s) => {
  capsule(ctx, 0, s * 0.05, 0, 0, -0.32, () => {
    const L = s * 0.78, W = s * 0.25;
    softShadow(ctx, W * 0.1, W * 0.72, L * 0.5, W * 0.22, 0.26);
    fillRR(ctx, -L / 2, -W * 0.3, L, W * 0.95, W * 0.45, linGrad(ctx, 0, -W * 0.3, 0, W * 0.65, [[0, '#f6cf88'], [1, '#c58a3e']]), '#7a4a16', s * 0.005); // bun (back half)
    fillRR(ctx, -L * 0.53, -W * 0.3, L * 1.06, W * 0.34, W * 0.17, linGrad(ctx, 0, -W * 0.3, 0, W * 0.04, [[0, '#d95a34'], [1, '#8a2a14']]), '#5a1a0a', s * 0.005); // sausage
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(-L * 0.08, -W * 0.22, L * 0.2, W * 0.03, 0, 0, TAU); ctx.fill();
    // ketchup + mustard zig-zag
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [col, off, dk] of [['#d3271a', -0.02, '#8a1a10'], ['#f4c20d', 0.05, '#a87a00']]) {
      ctx.beginPath(); ctx.moveTo(-L * 0.38, -W * 0.14 + W * off); for (let i = 1; i <= 10; i++) ctx.lineTo(-L * 0.38 + i * L * 0.076, -W * 0.14 + W * off + (i % 2 ? 1 : -1) * W * 0.06);
      ctx.strokeStyle = dk; ctx.lineWidth = s * 0.03; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.02; ctx.stroke();
    }
    fillRR(ctx, -L / 2, W * 0.28, L, W * 0.32, W * 0.16, linGrad(ctx, 0, W * 0.28, 0, W * 0.6, [[0, '#e0a758'], [1, '#a86e28']]), '#7a4a16', s * 0.005); // bun front lip
  });
  steam(ctx, s, s * 0.02, -s * 0.3, 2);
};

// ---- the hot case (fried) ------------------------------------------------------------------------------------
function crustBumps(ctx, s, seed, rx, ry, n, base) { // battered / breaded surface
  const r = rng(seed);
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.9, x = Math.cos(a) * rx * d, y = Math.sin(a) * ry * d, br = s * (0.012 + r() * 0.016); circle(ctx, x, y, br, r() > 0.45 ? lighten(base, 0.3) : darken(base, 0.22)); if (r() > 0.6) circle(ctx, x - br * 0.3, y - br * 0.3, br * 0.4, 'rgba(255,240,190,.7)'); }
}
// a fried drumstick: teardrop of craggy golden crust with the bone sticking out to the right
function drumstick(ctx, s, x, y, L, rot, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  softShadow(ctx, L * 0.04, L * 0.3, L * 0.42, L * 0.14, 0.26);
  fillRR(ctx, L * 0.26, -L * 0.045, L * 0.36, L * 0.09, L * 0.04, '#f8efd6', '#9c8858', s * 0.004);
  circle(ctx, L * 0.63, -L * 0.055, L * 0.055, '#f8efd6', '#9c8858', s * 0.004); circle(ctx, L * 0.63, L * 0.055, L * 0.055, '#f8efd6', '#9c8858', s * 0.004);
  const meat = () => { ctx.beginPath(); ctx.moveTo(L * 0.34, -L * 0.035); ctx.bezierCurveTo(L * 0.22, -L * 0.12, L * 0.16, -L * 0.3, -L * 0.08, -L * 0.3); ctx.bezierCurveTo(-L * 0.42, -L * 0.3, -L * 0.46, L * 0.3, -L * 0.08, L * 0.3); ctx.bezierCurveTo(L * 0.16, L * 0.3, L * 0.22, L * 0.12, L * 0.34, L * 0.035); ctx.closePath(); };
  meat(); ctx.fillStyle = radGrad(ctx, -L * 0.1, -L * 0.05, 0, L * 0.5, [[0, '#f4b952'], [0.6, '#dc8c2c'], [1, '#98481a']], -L * 0.16, -L * 0.14); ctx.fill();
  ctx.save(); meat(); ctx.clip();
  const r = rng(seed);
  for (let i = 0; i < 46; i++) { const bx = -L * 0.44 + r() * L * 0.8, by = (r() - 0.5) * L * 0.6, br = L * (0.018 + r() * 0.03); circle(ctx, bx, by, br, r() > 0.45 ? 'rgba(255,214,120,.85)' : 'rgba(110,50,10,.5)'); if (r() > 0.55) circle(ctx, bx - br * 0.3, by - br * 0.35, br * 0.35, 'rgba(255,244,200,.85)'); }
  ctx.strokeStyle = 'rgba(100,45,8,.5)'; ctx.lineWidth = s * 0.0042; ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const bx = -L * 0.32 + r() * L * 0.55, by = (r() - 0.5) * L * 0.44, a = r() * TAU; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * L * 0.05, by + Math.sin(a) * L * 0.05); ctx.stroke(); }
  ctx.restore();
  meat(); ctx.strokeStyle = '#6a3008'; ctx.lineWidth = s * 0.0062; ctx.lineJoin = 'round'; ctx.stroke();
  glint(ctx, -L * 0.2, -L * 0.2, L * 0.16, L * 0.05, -0.5, 0.45);
  ctx.restore();
}
HOT_KINDS['fried-chicken'] = (ctx, s) => {
  drumstick(ctx, s, -s * 0.13, -s * 0.13, s * 0.62, -0.32, 450);
  drumstick(ctx, s, -s * 0.06, s * 0.15, s * 0.6, 0.2, 460);
  steam(ctx, s, -s * 0.02, -s * 0.36, 2);
};
function nugget(ctx, s, x, y, r, seed) {
  softShadow(ctx, x + r * 0.1, y + r * 0.35, r * 0.95, r * 0.5, 0.22);
  blob(ctx, x, y, r, r * 0.92, dome(ctx, x, y, r, '#f3b64e', '#a5541a'), '#6a3008', s * 0.005, seed, 0.13, 9);
  ctx.save(); blobPath(ctx, x, y, r, r * 0.92, seed, 0.13, 9); ctx.clip(); ctx.translate(x, y); crustBumps(ctx, s, seed + 1, r, r * 0.92, 9, '#e0942e'); ctx.restore();
}
HOT_KINDS['chicken-pops'] = (ctx, s) => {
  // paper cup piled with popcorn chicken
  const cx = -s * 0.02, cy = s * 0.36, tw = s * 0.42, bw = s * 0.3, ch = s * 0.3;
  const heap = [[0, -0.27], [-0.1, -0.17], [0.1, -0.17], [-0.17, -0.06], [0.0, -0.08], [0.17, -0.06], [-0.09, 0.03], [0.09, 0.03]];
  heap.forEach(([dx, dy], i) => nugget(ctx, s, dx * s - s * 0.02, dy * s, s * 0.07, 470 + i));
  ctx.save(); ctx.beginPath(); ctx.moveTo(cx - tw / 2, cy - ch); ctx.lineTo(cx + tw / 2, cy - ch); ctx.lineTo(cx + bw / 2, cy); ctx.lineTo(cx - bw / 2, cy); ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.clip();
  ctx.fillStyle = '#d7263d'; for (let i = -4; i <= 4; i += 2) { ctx.beginPath(); ctx.moveTo(cx + i * tw * 0.11 - tw * 0.055, cy - ch); ctx.lineTo(cx + i * tw * 0.11 + tw * 0.055, cy - ch); ctx.lineTo(cx + i * bw * 0.11 + bw * 0.055, cy); ctx.lineTo(cx + i * bw * 0.11 - bw * 0.055, cy); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(cx - tw / 2, cy - ch, tw, ch * 0.12);
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(cx - tw / 2, cy - ch); ctx.lineTo(cx + tw / 2, cy - ch); ctx.lineTo(cx + bw / 2, cy); ctx.lineTo(cx - bw / 2, cy); ctx.closePath(); ctx.strokeStyle = '#8a1a28'; ctx.lineWidth = s * 0.006; ctx.lineJoin = 'round'; ctx.stroke();
  [[-0.3, 0.34, 480], [0.27, 0.37, 481]].forEach(([dx, dy, sd]) => nugget(ctx, s, dx * s, dy * s, s * 0.055, sd));
};
function roll(ctx, s, x, y, L, W, rot, seed, cut) {
  capsule(ctx, x, y, L, W, rot, () => {
    softShadow(ctx, W * 0.1, W * 0.6, L * 0.5, W * 0.24, 0.24);
    fillRR(ctx, -L / 2, -W / 2, L, W, W * 0.32, linGrad(ctx, 0, -W / 2, 0, W / 2, [[0, '#f9d070'], [0.5, '#e8a23a'], [1, '#a9601c']]), '#6a3a0a', s * 0.005);
    ctx.save(); rrPath2(ctx, -L / 2, -W / 2, L, W, W * 0.32); ctx.clip();
    const r = rng(seed);
    for (let i = 0; i < 16; i++) { const bx = (r() - 0.5) * L * 0.9, by = (r() - 0.5) * W * 0.8, br = W * (0.06 + r() * 0.08); circle(ctx, bx, by, br, r() > 0.5 ? 'rgba(255,225,140,.75)' : 'rgba(120,60,10,.4)'); }
    ctx.strokeStyle = 'rgba(120,60,10,.5)'; ctx.lineWidth = s * 0.004; ctx.beginPath(); ctx.moveTo(-L * 0.4, W * 0.1); ctx.quadraticCurveTo(0, W * 0.25, L * 0.4, W * 0.05); ctx.stroke(); // wrapper seam
    ctx.restore();
    if (cut) { // cut end shows the filling
      ellipse(ctx, L / 2 - W * 0.05, 0, W * 0.2, W * 0.5, dome(ctx, L / 2, 0, W * 0.5, '#f4ecd0', '#cdbb8a'), '#8a6a2a', s * 0.005);
      specks(ctx, L / 2 - W * 0.05, 0, W * 0.12, W * 0.36, 8, seed + 5, ['#f0872a', '#5aa83a', '#c58a5a'], W * 0.06);
    }
    glint(ctx, -L * 0.1, -W * 0.28, L * 0.25, W * 0.08, 0, 0.5);
  });
}
HOT_KINDS['spring-rolls'] = (ctx, s) => {
  roll(ctx, s, -s * 0.02, -s * 0.14, s * 0.62, s * 0.15, -0.28, 500, false);
  roll(ctx, s, s * 0.0, s * 0.03, s * 0.62, s * 0.15, -0.28, 510, true);
  roll(ctx, s, s * 0.02, s * 0.2, s * 0.62, s * 0.15, -0.28, 520, false);
  sauceCup(ctx, s, -s * 0.3, s * 0.3, s * 0.075, '#f0472a', '#b0200f');
};
HOT_KINDS['gyoza-fried'] = (ctx, s) => {
  const pos = [[-0.16, -0.14, -0.25], [0.12, -0.15, 0.15], [-0.05, 0.0, -0.05], [0.2, 0.06, 0.3], [-0.19, 0.14, 0.12]];
  pos.forEach(([dx, dy, r], i) => gyozaPiece(ctx, s, dx * s, dy * s, 0.3 * s, r, 530 + i));
  sauceCup(ctx, s, 0.13 * s, 0.27 * s, s * 0.07, '#5a2a12', '#24100a');
  steam(ctx, s, -s * 0.04, -s * 0.3, 2);
};
function faHot(ctx, s, o = {}) {
  const f = HOT_KINDS[o.kind];
  if (f) { ctx.save(); f(ctx, s); ctx.restore(); }
}

// ================================================================================================ HEROES
// Lid picture for ready meals: heroOpts.kind selects the dish. The plate is ~0.84*s wide; the sticker on the lid
// covers the right-hand ~38% of the tray so the picture is nudged left a touch.
function faDish(ctx, s, o = {}) {
  const f = DISH[o.kind];
  if (!f) return;
  ctx.save(); ctx.translate(-0.02 * s, 0); f(ctx, s); ctx.restore();
}

export const illus = { faDish, faSand, faOnigiri, faHot };

// ================================================================================================ SKUs
const C = { green: '#00874a', orange: '#f58220', red: '#d7263d', blue: '#1467c8', purple: '#7b3fa0', teal: '#0f8b8d', brown: '#8a5a2b', lime: '#4c9a2a', navy: '#1a4a9c', amber: '#d9820c', ember: '#e8590c', ice: '#1976d2' };
const MEAL = { cat: 'meal', brand: 'sevenselect', style: 'meal', g: 'tray-meal', hero: 'faDish', heat: true };
const SALAD = { ...MEAL, style: 'salad', g: 'tray-salad', heat: false };
const FROZEN = { ...MEAL, cat: 'frozen' };
const pal = (c) => [c, darken(c, 0.35), '#ffd54a', '#ffffff'];

const MEALS = [
  // ------------------------------------------------------------------------------------------ ready meals (most popular first)
  { ...MEAL, id: 'meal-kaprao-chicken', name: T('Basil Chicken & Fried Egg', 'ข้าวกะเพรา\nไก่ไข่ดาว'), sub: T('Stir-fried holy basil chicken on rice', 'ไก่ผัดกะเพราราดข้าว'), price: 39, size: g(300), pal: pal(C.green), heroOpts: { kind: 'kaprao-chicken' }, nut: [560, 4, 22, 1300], ing: ['rice', 'chicken', 'basil', 'egg', 'chili', 'garlic', 'longbean', 'oil', 'soysauce', 'oystersauce', 'fishsauce', 'sugar'], allergens: ['egg', 'soy', 'wheat', 'fish'], pop: 3,
    desc: T("Chicken stir-fried with holy basil, chilli and garlic, served over rice with a crispy fried egg. Fast, fiery and filling, it's the dish Thais order when they can't decide.", 'ไก่ผัดกะเพราใส่พริกและกระเทียม เสิร์ฟบนข้าวสวยพร้อมไข่ดาวกรอบๆ อิ่มไว เผ็ดหอม เมนูที่คนไทยนึกถึงเป็นอย่างแรกเวลาไม่รู้จะกินอะไร') },
  { ...MEAL, id: 'meal-kaprao-pork', name: T('Basil Minced Pork & Egg', 'ข้าวกะเพรา\nหมูสับไข่ดาว'), sub: T('Stir-fried holy basil pork on rice', 'หมูสับผัดกะเพราราดข้าว'), price: 39, size: g(300), pal: pal(C.green), heroOpts: { kind: 'kaprao-pork' }, nut: [610, 4, 27, 1350], ing: ['rice', 'pork', 'basil', 'egg', 'chili', 'garlic', 'oil', 'soysauce', 'oystersauce', 'fishsauce', 'sugar'], allergens: ['egg', 'soy', 'wheat', 'fish'], pop: 3,
    desc: T("Minced pork wok-fried with holy basil and bird's eye chillies, served with rice and a fried egg. Break the yolk over the rice for the full effect.", 'หมูสับผัดใบกะเพราพริกขี้หนู เสิร์ฟกับข้าวสวยและไข่ดาว เจาะไข่แดงให้ไหลเยิ้มคลุกข้าวอร่อยที่สุด') },
  { ...MEAL, id: 'meal-chicken-rice', name: T('Hainanese Chicken Rice', 'ข้าวมันไก่'), sub: T('Poached chicken, fragrant rice, ginger sauce', 'ไก่ต้ม ข้าวมัน น้ำจิ้มเต้าเจี้ยวขิง'), price: 39, size: g(320), pal: pal(C.green), heroOpts: { kind: 'chicken-rice' }, nut: [600, 3, 20, 1100], ing: ['rice', 'chicken', 'stock', 'ginger', 'garlic', 'soy', 'soysauce', 'cucumber', 'sugar', 'salt', 'chili'], allergens: ['soy', 'wheat'], pop: 2,
    promo: T('2 for ฿70', '2 กล่อง 70.-'),
    desc: T('Tender poached chicken over fragrant chicken-stock rice with cucumber and a ginger-soybean dipping sauce. Mild and comforting.', 'ไก่ต้มเนื้อนุ่มเสิร์ฟบนข้าวมันหอมๆ พร้อมแตงกวาและน้ำจิ้มเต้าเจี้ยวขิง รสละมุน กินง่าย') },
  { ...MEAL, id: 'meal-omelette-rice', name: T('Pork Omelette on Rice', 'ข้าวไข่เจียว\nหมูสับ'), sub: T('Crispy Thai omelette with minced pork', 'ไข่เจียวฟูกรอบใส่หมูสับ'), price: 35, size: g(280), pal: pal(C.green), heroOpts: { kind: 'omelette-rice' }, nut: [630, 3, 28, 1050], ing: ['rice', 'egg', 'pork', 'oil', 'fishsauce', 'pepper', 'chili', 'sugar', 'cucumber'], allergens: ['egg', 'fish'], pop: 2,
    desc: T('A puffy, crispy-edged Thai omelette with minced pork on steamed rice, served with chilli sauce. Simple, salty and deeply comforting.', 'ไข่เจียวหมูสับฟูกรอบขอบ วางบนข้าวสวยร้อนๆ พร้อมซอสพริก เรียบง่ายแต่อร่อยติดใจ') },
  { ...MEAL, id: 'meal-shrimp-fried-rice', name: T('Shrimp Fried Rice', 'ข้าวผัดกุ้ง'), sub: T('Wok-fried rice with shrimp and egg', 'ข้าวผัดกุ้งไข่'), price: 45, size: g(300), pal: pal(C.green), heroOpts: { kind: 'shrimp-fried-rice' }, nut: [520, 3, 15, 1150], ing: ['rice', 'shrimp', 'egg', 'carrot', 'onion', 'oil', 'soysauce', 'oystersauce', 'garlic', 'salt', 'sugar', 'pepper', 'lime', 'cucumber'], allergens: ['shrimp', 'egg', 'soy', 'wheat'], pop: 2,
    desc: T('Wok-fried rice with shrimp, egg and vegetables, served with cucumber and a lime wedge. A squeeze of lime brightens every bite.', 'ข้าวผัดกุ้งหอมกลิ่นกระทะ ใส่ไข่และผัก เสิร์ฟพร้อมแตงกวาและมะนาว บีบมะนาวเพิ่มความสดชื่น') },
  { ...MEAL, id: 'meal-garlic-pork', name: T('Garlic Fried Pork on Rice', 'ข้าวหมูทอด\nกระเทียม'), sub: T('Peppery garlic pork with cucumber', 'หมูทอดกระเทียมพริกไทย'), price: 39, size: g(290), pal: pal(C.green), heroOpts: { kind: 'garlic-pork' }, nut: [590, 3, 22, 1000], ing: ['rice', 'pork', 'garlic', 'pepper', 'oil', 'soysauce', 'oystersauce', 'sugar', 'cucumber', 'tomato'], allergens: ['soy', 'wheat'], pop: 2,
    desc: T('Golden fried pork with plenty of garlic and black pepper, served over rice with cucumber and tomato. Savoury, aromatic and not spicy.', 'หมูทอดกระเทียมพริกไทยหอมกรุ่น เสิร์ฟบนข้าวสวยพร้อมแตงกวาและมะเขือเทศ รสกลมกล่อม ไม่เผ็ด') },
  { ...MEAL, id: 'meal-teriyaki-chicken', name: T('Teriyaki Chicken Rice Bowl', 'ข้าวหน้าไก่\nเทอริยากิ'), sub: T('Glazed chicken, sesame and soft egg', 'ไก่เทอริยากิ งา และไข่'), price: 45, size: g(310), pal: pal(C.navy), heroOpts: { kind: 'teriyaki-chicken' }, nut: [560, 14, 12, 1150], ing: ['rice', 'chicken', 'teriyaki', 'egg', 'sesame', 'seaweed', 'onion', 'sugar', 'oil'], allergens: ['soy', 'wheat', 'sesame', 'egg'], pop: 2,
    desc: T('Glazed teriyaki chicken over rice with sesame, nori and spring onion, plus half a soft egg. Sweet, savoury and a lunchtime favourite.', 'ข้าวหน้าไก่ราดซอสเทอริยากิเงาวาว โรยงา สาหร่ายและต้นหอม พร้อมไข่ครึ่งซีก หวานเค็มกลมกล่อม') },
  { ...MEAL, id: 'meal-pad-thai', name: T('Pad Thai with Fresh Shrimp', 'ผัดไทย\nกุ้งสด'), sub: T('Rice noodles in tamarind sauce', 'เส้นจันท์ผัดซอสมะขาม'), price: 55, size: g(280), pal: pal(C.ember), heroOpts: { kind: 'pad-thai' }, nut: [560, 14, 18, 1200], ing: ['ricenoodle', 'shrimp', 'egg', 'tofu', 'beansprout', 'peanut', 'tamarind', 'fishsauce', 'sugar', 'oil', 'chili', 'lime'], allergens: ['shrimp', 'egg', 'peanut', 'fish', 'soy'], pop: 2,
    desc: T("Rice noodles stir-fried with shrimp, egg, tofu and bean sprouts in a sweet-sour tamarind sauce, with crushed peanuts and lime. Thailand's best-known noodle dish.", 'เส้นจันท์ผัดกับกุ้ง ไข่ เต้าหู้ และถั่วงอก ในซอสมะขามหวานเปรี้ยว โรยถั่วลิสงป่น เสิร์ฟพร้อมมะนาว') },
  { ...MEAL, id: 'meal-green-curry', name: T('Green Curry Chicken & Rice', 'ข้าวแกง\nเขียวหวานไก่'), sub: T('Coconut green curry with Thai eggplant', 'แกงเขียวหวานกะทิ ใส่มะเขือเปราะ'), price: 49, size: g(330), pal: pal(C.orange), heroOpts: { kind: 'green-curry' }, nut: [550, 8, 22, 1100], ing: ['rice', 'chicken', 'coconutmilk', 'curry', 'eggplant', 'basil', 'chili', 'kaffir', 'fishsauce', 'sugar', 'oil'], allergens: ['fish', 'shrimp'], pop: 1,
    promo: T('2 for ฿90', '2 กล่อง 90.-'),
    desc: T('Chicken in creamy coconut green curry with Thai eggplant, chilli and basil, served with rice. Sweet, spicy and fragrant with herbs.', 'แกงเขียวหวานไก่กะทิหอมมัน ใส่มะเขือเปราะ พริกและใบโหระพา เสิร์ฟพร้อมข้าวสวย หวาน เผ็ด หอมเครื่องแกง') },
  { ...MEAL, id: 'meal-crispy-pork', name: T('Salt & Chilli Crispy Pork', 'ข้าวหมูกรอบ\nคั่วพริกเกลือ'), sub: T('Crunchy pork belly with chilli and garlic', 'หมูกรอบคั่วพริก กระเทียม เกลือ'), price: 49, size: g(300), pal: pal(C.red), heroOpts: { kind: 'crispy-pork' }, nut: [720, 3, 38, 1400], ing: ['rice', 'porkbelly', 'chili', 'garlic', 'salt', 'oil', 'pepper'], allergens: [], pop: 2,
    desc: T('Crunchy fried pork belly tossed with chilli, garlic and salt, served over rice. Salty, spicy and satisfyingly crackly.', 'หมูกรอบคั่วกับพริก กระเทียมและเกลือ เสิร์ฟพร้อมข้าวสวย กรอบ เค็ม เผ็ดหอม') },
  { ...MEAL, id: 'meal-massaman', name: T('Massaman Curry & Rice', 'ข้าวแกง\nมัสมั่นไก่'), sub: T('Chicken, potato and peanut curry', 'ไก่ มันฝรั่ง ถั่วลิสง'), price: 55, size: g(330), pal: pal(C.orange), heroOpts: { kind: 'massaman' }, nut: [640, 12, 27, 1050], ing: ['rice', 'chicken', 'coconutmilk', 'potato', 'onion', 'peanut', 'curry', 'tamarind', 'fishsauce', 'sugar', 'spice', 'oil'], allergens: ['peanut', 'fish', 'shrimp'], pop: 1,
    desc: T('A rich, mildly sweet Southern-style curry of chicken, potato and peanuts in coconut milk, warmed with cinnamon and cardamom. Served with rice.', 'แกงมัสมั่นไก่รสกลมกล่อม หวานมัน หอมเครื่องเทศ ใส่มันฝรั่งและถั่วลิสง เสิร์ฟพร้อมข้าวสวย') },
  { ...MEAL, id: 'meal-pad-see-ew', name: T('Pad See Ew Noodles', 'ผัดซีอิ๊ว'), sub: T('Wide noodles with pork and Chinese kale', 'เส้นใหญ่ผัดซีอิ๊ว หมู คะน้า'), price: 45, size: g(280), pal: pal(C.ember), heroOpts: { kind: 'pad-see-ew' }, nut: [520, 8, 16, 1400], ing: ['ricenoodle', 'pork', 'egg', 'kale', 'soysauce', 'oystersauce', 'garlic', 'sugar', 'oil', 'pepper'], allergens: ['egg', 'soy', 'wheat'], pop: 1,
    desc: T('Wide rice noodles wok-fried with pork, egg and Chinese kale in a glossy sweet soy sauce. Smoky, savoury and just a little sweet.', 'ผัดซีอิ๊วเส้นใหญ่ใส่หมู ไข่ และคะน้า หอมกลิ่นกระทะ เค็มหวานกลมกล่อม') },
  { ...MEAL, id: 'meal-drunken-spaghetti', name: T('Drunken Spaghetti', 'สปาเกตตี\nขี้เมา'), sub: T('Spicy Thai basil stir-fried spaghetti', 'สปาเกตตีผัดขี้เมารสจัด'), price: 49, size: g(290), pal: pal(C.red), heroOpts: { kind: 'drunken-spaghetti' }, nut: [540, 6, 17, 1350], ing: ['pasta', 'pork', 'basil', 'chili', 'garlic', 'onion', 'oil', 'soysauce', 'oystersauce', 'fishsauce', 'sugar'], allergens: ['wheat', 'soy', 'fish'], pop: 1,
    desc: T('Thai-style stir-fried spaghetti with pork, chilli, basil and garlic: all the fire of pad kee mao, with pasta. Best served hot.', 'สปาเกตตีผัดขี้เมารสจัดจ้าน ใส่หมูสับ พริก กระเทียมและใบกะเพรา หอมเผ็ดร้อนถึงใจ') },
  { ...MEAL, id: 'meal-carbonara', name: T('Spaghetti Carbonara', 'สปาเกตตี\nคาโบนาร่า'), sub: T('Creamy bacon and mushroom sauce', 'ซอสครีม เบคอน เห็ด'), price: 49, size: g(290), pal: pal(C.purple), heroOpts: { kind: 'carbonara' }, nut: [640, 4, 30, 1000], ing: ['pasta', 'cream', 'bacon', 'mushroom', 'cheese', 'egg', 'butter', 'pepper', 'salt'], allergens: ['wheat', 'milk', 'egg'], pop: 1,
    desc: T('Spaghetti in a creamy sauce with bacon, mushrooms and black pepper. Rich, comforting and easy to microwave.', 'สปาเกตตีซอสครีมเบคอนและเห็ด โรยพริกไทยดำ เข้มข้น หอมมัน อุ่นไมโครเวฟได้ง่าย') },
  { ...SALAD, id: 'meal-pork-congee', heat: true, name: T('Pork Congee', 'โจ๊กหมู'), sub: T('Rice porridge with pork balls and egg', 'โจ๊กหมูสับปั้นก้อน ไข่ลวก'), price: 25, size: g(250), pal: pal(C.teal), heroOpts: { kind: 'pork-congee' }, nut: [190, 1, 4, 850], ing: ['rice', 'pork', 'stock', 'ginger', 'egg', 'garlic', 'onion', 'pepper', 'soysauce', 'salt'], allergens: ['egg', 'soy', 'wheat'], pop: 2,
    desc: T('Silky rice porridge with pork balls, ginger and spring onion, topped with a soft egg. Gentle on the stomach: a favourite for breakfast or a late-night bite.', 'โจ๊กข้าวเนียนนุ่ม ใส่หมูสับปั้นก้อน ขิงและต้นหอม พร้อมไข่ลวก ทานง่าย อุ่นท้อง เหมาะกับมื้อเช้าหรือมื้อดึก') },
  { ...MEAL, id: 'meal-pork-skewers-sticky-rice', name: T('Grilled Pork & Sticky Rice', 'ข้าวเหนียว\nหมูปิ้ง'), sub: T('3 skewers with sticky rice', 'หมูปิ้ง 3 ไม้ ข้าวเหนียว'), price: 25, size: g(140), pal: pal('#c8571a'), heroOpts: { kind: 'pork-skewers' }, nut: [420, 10, 12, 500], ing: ['pork', 'sticky', 'coconutmilk', 'soysauce', 'oystersauce', 'sugar', 'garlic', 'pepper'], allergens: ['soy', 'wheat'], pop: 2,
    promo: T('2 for ฿45', '2 กล่อง 45.-'),
    desc: T('Three skewers of sweet, smoky marinated grilled pork with sticky rice: the classic Bangkok breakfast on the go. Warm it in the microwave.', 'หมูปิ้งหมักหอมหวาน 3 ไม้ เสิร์ฟพร้อมข้าวเหนียว อาหารเช้ายอดนิยมของคนกรุงเทพฯ อุ่นไมโครเวฟก่อนทานอร่อยกว่า') },
  { ...SALAD, id: 'meal-som-tam', name: T('Som Tam Thai Papaya Salad', 'ส้มตำไทย'), sub: T('Sweet, sour and spicy, served cold', 'เปรี้ยว เผ็ด หวาน ทานเย็น'), price: 35, size: g(200), pal: pal(C.lime), heroOpts: { kind: 'som-tam' }, nut: [90, 9, 3, 900], ing: ['papaya', 'tomato', 'longbean', 'carrot', 'peanut', 'driedshrimp', 'lime', 'fishsauce', 'sugar', 'chili', 'garlic'], allergens: ['peanut', 'shrimp', 'fish'], pop: 1,
    desc: T('Shredded green papaya with tomato, long beans, peanuts and dried shrimp in a lime, fish sauce and chilli dressing. Sour, spicy, sweet and served cold.', 'ส้มตำไทยมะละกอดิบซอยเส้น ใส่มะเขือเทศ ถั่วฝักยาว ถั่วลิสงและกุ้งแห้ง ปรุงรสเปรี้ยว เผ็ด หวาน ทานเย็นๆ') },
  { ...SALAD, id: 'meal-yam-woon-sen', name: T('Spicy Glass Noodle Salad', 'ยำวุ้นเส้น'), sub: T('Shrimp and minced pork, lime dressing', 'กุ้ง หมูสับ น้ำยำเปรี้ยวเผ็ด'), price: 39, size: g(220), pal: pal(C.teal), heroOpts: { kind: 'yam-woon-sen' }, nut: [210, 8, 5, 1100], ing: ['glassnoodle', 'shrimp', 'pork', 'tomato', 'onion', 'veg', 'chili', 'lime', 'fishsauce', 'sugar', 'garlic'], allergens: ['shrimp', 'fish'], pop: 1,
    desc: T('Glass noodle salad with shrimp and minced pork, tossed in a zesty lime-chilli dressing. Light, tangy and best eaten cold.', 'ยำวุ้นเส้นกุ้งหมูสับ ปรุงรสเปรี้ยวเผ็ดด้วยมะนาวและพริก รสจัดจ้าน ทานเย็นๆ') },
  { ...MEAL, id: 'meal-boiled-eggs', g: 'tray-onigiri', heat: false, name: T('Boiled Eggs 2-Pack', 'ไข่ต้ม\n2 ฟอง'), price: 20, size: T('2 eggs', '2 ฟอง'), pal: pal(C.amber), heroOpts: { kind: 'boiled-eggs' }, nut: [140, 0, 10, 140], ing: ['egg'], allergens: ['egg'], pop: 1,
    desc: T('Two peeled hard-boiled eggs, ready to eat. A quick, no-fuss protein snack.', 'ไข่ต้มสุกปอกเปลือกพร้อมทาน 2 ฟอง เป็นของว่างโปรตีนสูง กินง่ายได้ทุกเวลา') },

  // ------------------------------------------------------------------------------------------ frozen
  { ...FROZEN, id: 'frz-gyoza-pork', name: T('Pork Gyoza', 'เกี๊ยวซ่าหมู'), sub: T('Pork & cabbage dumplings, 10 pcs', 'เกี๊ยวซ่าไส้หมูกะหล่ำปลี'), price: 45, size: pc(10), pal: pal(C.ice), heroOpts: { kind: 'gyoza' }, nut: [340, 3, 12, 780], ing: ['pork', 'cabbage', 'dumplingwrap', 'garlic', 'ginger', 'sesame', 'oil', 'soysauce', 'sugar', 'salt', 'pepper'], allergens: ['wheat', 'soy', 'sesame'], pop: 2,
    desc: T('Pork and cabbage dumplings with a soy-vinegar dip. Pan-fry or microwave straight from the freezer.', 'เกี๊ยวซ่าไส้หมูและกะหล่ำปลี พร้อมน้ำจิ้ม ทอดในกระทะหรืออุ่นไมโครเวฟได้ทันทีจากช่องแช่แข็ง') },
  { ...FROZEN, id: 'frz-shumai-pork', name: T('Pork Shumai', 'ขนมจีบหมู'), sub: T('Steamed pork dumplings, 8 pcs', 'ขนมจีบหมู 8 ชิ้น'), price: 49, size: pc(8), pal: pal(C.ice), heroOpts: { kind: 'shumai' }, nut: [290, 2, 14, 620], ing: ['pork', 'shrimp', 'dumplingwrap', 'onion', 'ginger', 'soysauce', 'sesame', 'sugar', 'salt', 'pepper'], allergens: ['wheat', 'shrimp', 'soy', 'sesame'], pop: 1,
    desc: T('Steamed pork shumai with a soy dip. Microwave or steam from frozen.', 'ขนมจีบหมูพร้อมน้ำจิ้ม นึ่งหรืออุ่นไมโครเวฟจากช่องแช่แข็งได้เลย') },
  { ...FROZEN, id: 'frz-crispy-pork-basil', name: T('Crispy Pork Basil Rice', 'ข้าวกะเพรา\nหมูกรอบ'), sub: T('Frozen meal with fried egg', 'อาหารแช่แข็ง พร้อมไข่ดาว'), price: 49, size: g(300), pal: pal(C.ice), heroOpts: { kind: 'crispy-basil' }, nut: [690, 4, 34, 1300], ing: ['rice', 'porkbelly', 'basil', 'chili', 'garlic', 'egg', 'oil', 'soysauce', 'oystersauce', 'fishsauce', 'sugar'], allergens: ['egg', 'soy', 'wheat', 'fish'], pop: 1,
    desc: T('Crispy pork stir-fried with holy basil and chilli, on rice with a fried egg. Heat straight from the freezer.', 'ข้าวกะเพราหมูกรอบไข่ดาว แช่แข็ง อุ่นไมโครเวฟได้ทันที') },
];

// ------------------------------------------------------------------------------------------ sandwiches & onigiri
const SANDWICH_BASE = { cat: 'sandwich', brand: 'sevenselect', style: 'sandwich', g: 'tray-sand', hero: 'faSand', heat: false };
const ONIGIRI_BASE = { ...SANDWICH_BASE, style: 'onigiri', g: 'tray-onigiri', hero: 'faOnigiri' };

const SANDWICHES = [
  { ...SANDWICH_BASE, id: 'sand-ham-cheese', name: T('Ham & Cheese Sandwich', 'แซนด์วิช\nแฮมชีส'), sub: T('Soft white bread', 'ขนมปังนุ่ม'), price: 25, size: g(120), pal: pal(C.orange), heroOpts: { kind: 'ham' }, nut: [280, 5, 12, 640], ing: ['bread', 'ham', 'cheese', 'lettuce', 'butter', 'mayo'], allergens: ['wheat', 'milk', 'egg', 'soy'], pop: 2,
    promo: T('2 for ฿45', '2 ชิ้น 45.-'),
    desc: T('Sliced ham, cheese and crisp lettuce in soft white bread with a little mayonnaise. A simple, reliable lunch.', 'แซนด์วิชขนมปังนุ่มไส้แฮม ชีสและผักกาดหอม ทามายองเนสบางๆ กินง่าย อิ่มสบาย') },
  { ...SANDWICH_BASE, id: 'sand-tuna-mayo', name: T('Tuna Mayo Sandwich', 'แซนด์วิช\nทูน่า'), sub: T('Tuna & mayonnaise', 'ทูน่ามายองเนส'), price: 25, size: g(120), pal: pal(C.orange), heroOpts: { kind: 'tuna' }, nut: [300, 4, 14, 560], ing: ['bread', 'tuna', 'mayo', 'onion', 'lettuce', 'pepper'], allergens: ['wheat', 'egg', 'fish', 'soy'], pop: 2,
    desc: T('Creamy tuna and mayonnaise with a little onion on soft white bread.', 'ไส้ทูน่าคลุกมายองเนสหอมหัวใหญ่ ในขนมปังนุ่มๆ') },
  { ...ONIGIRI_BASE, id: 'oni-tuna-mayo', name: T('Tuna Mayo Rice Ball', 'ข้าวปั้นทูน่า\nมายองเนส'), price: 25, size: g(100), pal: pal(C.blue), heroOpts: { kind: 'tuna' }, nut: [210, 1, 5, 400], ing: ['rice', 'tuna', 'mayo', 'seaweed', 'salt', 'oil'], allergens: ['fish', 'egg', 'soy'], pop: 2,
    promo: T('3 for ฿65', '3 ชิ้น 65.-'),
    desc: T('A triangle of rice with creamy tuna mayo inside, wrapped in crisp nori. Pull the tabs in order (1-2-3) to keep the seaweed crunchy.', 'ข้าวปั้นสามเหลี่ยมไส้ทูน่ามายองเนส ห่อสาหร่ายกรอบ ดึงแถบตามลำดับ 1-2-3 เพื่อให้สาหร่ายยังกรอบอยู่') },
  { ...SANDWICH_BASE, id: 'sand-teriyaki-toastie', heat: true, name: T('Teriyaki Chicken Toastie', 'แซนด์วิช\nไก่เทอริยากิ'), sub: T('Toasted, with melted cheese', 'ปิ้งร้อน ชีสละลาย'), price: 35, size: g(140), pal: pal('#d9531e'), heroOpts: { kind: 'teri' }, nut: [340, 7, 14, 680], ing: ['bread', 'chicken', 'teriyaki', 'cheese', 'onion', 'mayo', 'butter'], allergens: ['wheat', 'milk', 'egg', 'soy', 'sesame'], pop: 2,
    desc: T('A toasted sandwich of teriyaki chicken and melted cheese. Warm it up for the best result.', 'แซนด์วิชปิ้งไส้ไก่เทอริยากิกับชีสละลาย อุ่นให้ร้อนก่อนกินจะอร่อยที่สุด') },
  { ...ONIGIRI_BASE, id: 'oni-salmon', name: T('Salmon Rice Ball', 'ข้าวปั้น\nแซลมอน'), price: 29, size: g(100), pal: pal('#e2506a'), heroOpts: { kind: 'salmon' }, nut: [190, 1, 3, 420], ing: ['rice', 'salmon', 'seaweed', 'sesame', 'salt', 'soysauce'], allergens: ['fish', 'soy', 'wheat', 'sesame'], pop: 1,
    desc: T('A rice ball filled with flaked salmon and wrapped in nori.', 'ข้าวปั้นไส้ปลาแซลมอนฉีก ห่อสาหร่าย') },
  { ...SANDWICH_BASE, id: 'sand-egg-salad', name: T('Egg Salad Sandwich', 'แซนด์วิช\nไข่'), sub: T('Egg mayonnaise', 'ไข่ต้มคลุกมายองเนส'), price: 20, size: g(115), pal: pal(C.orange), heroOpts: { kind: 'egg' }, nut: [290, 4, 15, 480], ing: ['bread', 'egg', 'mayo', 'butter', 'pepper'], allergens: ['wheat', 'egg', 'milk', 'soy'], pop: 1,
    desc: T('Egg mayonnaise filling with a hint of pepper on soft white bread.', 'ไส้ไข่ต้มบดคลุกมายองเนส โรยพริกไทย ในขนมปังนุ่ม') },
  { ...ONIGIRI_BASE, id: 'oni-teriyaki-chicken', name: T('Teriyaki Chicken Rice Ball', 'ข้าวปั้น\nไก่เทอริยากิ'), price: 25, size: g(100), pal: pal('#8a5a2b'), heroOpts: { kind: 'teri' }, nut: [200, 3, 3, 430], ing: ['rice', 'chicken', 'teriyaki', 'seaweed', 'sesame', 'sugar', 'salt'], allergens: ['soy', 'wheat', 'sesame'], pop: 1,
    desc: T('A rice ball filled with sweet-savoury teriyaki chicken, wrapped in nori.', 'ข้าวปั้นไส้ไก่เทอริยากิหวานเค็ม ห่อสาหร่าย') },
  { ...SANDWICH_BASE, id: 'sand-pork-floss', name: T('Pork Floss Sandwich', 'แซนด์วิช\nหมูหยอง'), sub: T('Sweet-savoury pork floss', 'หมูหยองหวานมัน'), price: 20, size: g(110), pal: pal(C.orange), heroOpts: { kind: 'floss' }, nut: [310, 8, 14, 520], ing: ['bread', 'porkfloss', 'mayo', 'butter', 'sugar'], allergens: ['wheat', 'egg', 'milk', 'soy'], pop: 1,
    desc: T('Fluffy, sweet-savoury pork floss (moo yong) over mayonnaise on soft bread. A Thai bakery favourite.', 'แซนด์วิชไส้หมูหยองฟูหวานมัน ทามายองเนสบนขนมปังนุ่ม เมนูคุ้นลิ้นของคนไทย') },
  { ...ONIGIRI_BASE, id: 'oni-spicy-pork', name: T('Spicy Pork Rice Ball', 'ข้าวปั้น\nหมูผัดเผ็ด'), price: 25, size: g(100), pal: pal(C.red), heroOpts: { kind: 'pork' }, nut: [220, 2, 5, 460], ing: ['rice', 'pork', 'chili', 'garlic', 'basil', 'seaweed', 'soysauce', 'sugar', 'oil'], allergens: ['soy', 'wheat'], pop: 1,
    desc: T('A rice ball filled with spicy Thai-style stir-fried pork, wrapped in nori.', 'ข้าวปั้นไส้หมูผัดเผ็ดรสจัดจ้านแบบไทยๆ ห่อสาหร่าย') },
  { ...SANDWICH_BASE, id: 'sand-crab-stick', name: T('Crab Stick Sandwich', 'แซนด์วิช\nปูอัด'), sub: T('Crab stick & mayonnaise', 'ปูอัดมายองเนส'), price: 25, size: g(115), pal: pal(C.orange), heroOpts: { kind: 'crab' }, nut: [260, 4, 10, 620], ing: ['bread', 'crabstick', 'mayo', 'lettuce', 'butter'], allergens: ['wheat', 'fish', 'egg', 'milk', 'soy'], pop: 1,
    desc: T('Crab sticks and mayonnaise with crisp lettuce on soft white bread.', 'ไส้ปูอัดมายองเนสกับผักกาดหอม ในขนมปังนุ่ม') },
  { ...ONIGIRI_BASE, id: 'oni-seaweed', name: T('Seaweed Rice Ball', 'ข้าวปั้น\nสาหร่าย'), price: 20, size: g(90), pal: pal('#1f6f4a'), heroOpts: { kind: 'nori' }, nut: [170, 0, 2, 320], ing: ['rice', 'seaweed', 'sesame', 'salt', 'oil'], allergens: ['sesame', 'soy'], pop: 1,
    desc: T('Lightly salted rice wrapped in crisp nori and sprinkled with sesame. Simple and satisfying.', 'ข้าวปั้นปรุงรสเกลือเบาๆ ห่อสาหร่ายกรอบ โรยงา เรียบง่ายแต่อิ่มอร่อย') },
];

// ------------------------------------------------------------------------------------------ hot counter
const HOT_BASE = { cat: 'hot', brand: 'sevenselect', style: 'snack', g: 'bag-bun', hero: 'faHot' };
const hpal = (c, plate = '#fff2c4') => [c, darken(c, 0.4), plate, '#ffffff'];

const HOT = [
  // ---- steamer (ซาลาเปา)
  { ...HOT_BASE, id: 'hot-bun-pork', pool: 'steamer', name: T('Pork Bun', 'ซาลาเปาไส้หมู'), price: 15, size: g(85), pal: hpal('#c0492b'), heroOpts: { kind: 'bun-pork' }, nut: [230, 4, 6, 420], ing: ['wheat', 'pork', 'sugar', 'yeast', 'oil', 'onion', 'soysauce', 'oystersauce', 'pepper', 'leaven'], allergens: ['wheat', 'soy'], pop: 2,
    desc: T('A soft steamed bun filled with seasoned minced pork. Best eaten hot, straight from the steamer.', 'ซาลาเปาไส้หมูสับปรุงรส แป้งนุ่มฟู ร้อนๆ จากหม้อนึ่งอร่อยที่สุด') },
  { ...HOT_BASE, id: 'hot-bun-custard', pool: 'steamer', name: T('Custard Bun', 'ซาลาเปาไส้ครีม'), price: 15, size: g(80), pal: hpal('#f2b705', '#ffffff'), heroOpts: { kind: 'bun-custard' }, nut: [210, 12, 4, 180], ing: ['wheat', 'sugar', 'custard', 'egg', 'milk', 'yeast', 'oil', 'leaven'], allergens: ['wheat', 'egg', 'milk'], pop: 2,
    desc: T('A fluffy steamed bun with a sweet, creamy custard centre.', 'ซาลาเปาแป้งนุ่มฟู ไส้ครีมหวานมัน') },
  { ...HOT_BASE, id: 'hot-bun-sesame', pool: 'steamer', name: T('Black Sesame Bun', 'ซาลาเปาไส้งาดำ'), price: 15, size: g(80), pal: hpal('#3d3a4a', '#f5c542'), heroOpts: { kind: 'bun-sesame' }, nut: [220, 13, 5, 150], ing: ['wheat', 'blacksesame', 'sugar', 'oil', 'yeast', 'leaven'], allergens: ['wheat', 'sesame'], pop: 1,
    desc: T('A steamed bun filled with sweet, fragrant black sesame paste.', 'ซาลาเปาไส้งาดำบดหวานหอม') },
  { ...HOT_BASE, id: 'hot-bun-ham-cheese', pool: 'steamer', name: T('Ham & Cheese Bun', 'ซาลาเปาแฮมชีส'), price: 20, size: g(90), pal: hpal('#f58220'), heroOpts: { kind: 'bun-hamcheese' }, nut: [250, 5, 8, 480], ing: ['wheat', 'ham', 'cheese', 'sugar', 'yeast', 'oil', 'leaven'], allergens: ['wheat', 'milk'], pop: 1,
    desc: T('A steamed bun with savoury ham and melted cheese.', 'ซาลาเปาไส้แฮมและชีสละลาย รสเค็มมัน') },
  { ...HOT_BASE, id: 'hot-shumai', pool: 'steamer', name: T('Steamed Pork Shumai', 'ขนมจีบหมู'), price: 20, size: pc(4), pal: hpal('#1f7a6d', '#ffe27a'), heroOpts: { kind: 'shumai-steamed' }, nut: [110, 1, 5, 380], ing: ['pork', 'shrimp', 'dumplingwrap', 'onion', 'ginger', 'soysauce', 'sesame', 'sugar', 'pepper'], allergens: ['wheat', 'shrimp', 'soy', 'sesame'], pop: 1,
    desc: T('Four steamed pork dumplings served hot with a soy dip.', 'ขนมจีบหมูนึ่งร้อนๆ 4 ลูก พร้อมน้ำจิ้มซีอิ๊ว') },
  // ---- roller grill (ไส้กรอก)
  { ...HOT_BASE, id: 'hot-sausage-smoked', pool: 'grill', name: T('Smoked Pork Sausage', 'ไส้กรอกหมูรมควัน'), price: 20, size: g(60), pal: hpal('#8a2a1a', '#ffd54a'), heroOpts: { kind: 'sausage-smoked' }, nut: [170, 1, 14, 450], ing: ['pork', 'starch', 'salt', 'sugar', 'spice', 'preserv'], allergens: [], pop: 2,
    desc: T('A smoky pork sausage, kept turning on the roller grill until hot and juicy.', 'ไส้กรอกหมูรมควัน หมุนย่างบนเครื่องจนร้อนฉ่ำ หอมกลิ่นควัน') },
  { ...HOT_BASE, id: 'hot-sausage-cheese', pool: 'grill', name: T('Cheese Sausage', 'ไส้กรอกชีส'), price: 25, size: g(70), pal: hpal('#e8a800', '#c8102e'), heroOpts: { kind: 'sausage-cheese' }, nut: [190, 1, 15, 480], ing: ['pork', 'cheese', 'starch', 'salt', 'sugar', 'preserv', 'spice'], allergens: ['milk'], pop: 2,
    desc: T('A grilled pork sausage with a gooey cheese centre.', 'ไส้กรอกหมูย่างไส้ชีสเยิ้ม') },
  { ...HOT_BASE, id: 'hot-hotdog-bigbite', brand: 'bigbite', pool: 'grill', name: T('Hot Dog', 'ฮอทดอก'), sub: T('Sausage in a soft bun', 'ไส้กรอกในขนมปังนุ่ม'), price: 35, size: g(120), pal: hpal('#e60012', '#ffd400'), heroOpts: { kind: 'hotdog' }, nut: [340, 8, 20, 760], ing: ['bread', 'sausage', 'sugar', 'tomato', 'oil', 'milk', 'yeast', 'salt'], allergens: ['wheat', 'milk', 'soy'], pop: 2,
    desc: T('A big grilled sausage in a soft bun, topped with ketchup and mustard. Grab one hot from the counter.', 'ไส้กรอกชิ้นใหญ่ย่างร้อนในขนมปังนุ่ม ราดซอสมะเขือเทศและมัสตาร์ด หยิบร้อนๆ จากเคาน์เตอร์ได้เลย') },
  { ...HOT_BASE, id: 'hot-sausage-isan', pool: 'grill', name: T('Isan Sausage', 'ไส้กรอกอีสาน'), price: 20, size: g(70), pal: hpal('#5a8f2a', '#ffd54a'), heroOpts: { kind: 'sausage-isan' }, nut: [150, 2, 11, 500], ing: ['pork', 'rice', 'garlic', 'salt', 'sugar', 'preserv'], allergens: [], pop: 1,
    desc: T('A Northeastern-style fermented pork sausage, tangy and garlicky. Traditionally eaten with fresh chilli, ginger and cabbage.', 'ไส้กรอกอีสานหมักรสเปรี้ยวหอมกระเทียม ทานคู่กับพริกสด ขิง และกะหล่ำปลีแบบชาวอีสาน') },
  // ---- hot case (ของทอด)
  { ...HOT_BASE, id: 'hot-fried-chicken', pool: 'hotcase', name: T('Fried Chicken', 'ไก่ทอด'), price: 25, size: g(110), pal: hpal('#d9531e', '#ffd54a'), heroOpts: { kind: 'fried-chicken' }, nut: [260, 1, 17, 450], ing: ['chicken', 'wheat', 'oil', 'salt', 'pepper', 'garlic', 'spice', 'cornst'], allergens: ['wheat'], pop: 3,
    desc: T('Crispy golden fried chicken seasoned with pepper and garlic, kept hot in the counter cabinet.', 'ไก่ทอดกรอบสีทอง หมักพริกไทยกระเทียม ร้อนๆ จากตู้อุ่น') },
  { ...HOT_BASE, id: 'hot-chicken-pops', pool: 'hotcase', name: T('Chicken Pops', 'ไก่ป๊อป'), price: 25, size: g(85), pal: hpal('#f2b705', '#c8102e'), heroOpts: { kind: 'chicken-pops' }, nut: [250, 1, 15, 480], ing: ['chicken', 'wheat', 'oil', 'cornst', 'salt', 'pepper', 'spice', 'egg'], allergens: ['wheat', 'egg'], pop: 2,
    desc: T('Bite-sized crispy chicken pieces in a paper cup. Perfect for snacking on the go.', 'ไก่ป๊อปชิ้นพอดีคำ กรอบนอกนุ่มใน ใส่ถ้วยกระดาษ กินง่ายระหว่างเดินทาง') },
  { ...HOT_BASE, id: 'hot-spring-rolls', pool: 'hotcase', name: T('Fried Spring Rolls', 'ปอเปี๊ยะทอด'), price: 20, size: pc(3), pal: hpal('#8a3fa0', '#ffd54a'), heroOpts: { kind: 'spring-rolls' }, nut: [210, 2, 11, 320], ing: ['springwrap', 'cabbage', 'carrot', 'glassnoodle', 'pork', 'onion', 'oil', 'pepper', 'soysauce'], allergens: ['wheat', 'soy'], pop: 1,
    desc: T('Three crispy fried spring rolls filled with vegetables and glass noodles, with sweet chilli sauce.', 'ปอเปี๊ยะทอดกรอบ 3 ชิ้น ไส้ผักและวุ้นเส้น พร้อมน้ำจิ้มไก่หวาน') },
  { ...HOT_BASE, id: 'hot-gyoza', pool: 'hotcase', name: T('Pan-fried Gyoza', 'เกี๊ยวซ่า'), price: 25, size: pc(5), pal: hpal('#c8102e', '#ffd54a'), heroOpts: { kind: 'gyoza-fried' }, nut: [240, 2, 10, 430], ing: ['pork', 'cabbage', 'dumplingwrap', 'garlic', 'ginger', 'sesame', 'oil', 'soysauce', 'sugar', 'pepper'], allergens: ['wheat', 'soy', 'sesame'], pop: 1,
    desc: T('Five pan-fried pork dumplings with a crisp golden base and a soy dipping sauce.', 'เกี๊ยวซ่าไส้หมูทอดกรอบด้านล่าง 5 ชิ้น พร้อมน้ำจิ้มซีอิ๊ว') },
];

// Every list is ordered most-popular first (stable sort): the planogram stocks in this order, so if a pool
// ever overflows it is the slowest sellers that drop off.
const byPop = (a, b) => (b.pop || 1) - (a.pop || 1);
export default [...MEALS.sort(byPop), ...SANDWICHES.sort(byPop), ...HOT.sort(byPop)];

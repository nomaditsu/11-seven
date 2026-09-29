// Instant noodles, cup noodles and pantry staples (Thai 7-Eleven "ของแห้ง").
// See docs/design/sku-authoring.md. Exports: default SKU[], brands, ingredients, illus.
import { g, kg, ml, L, T } from './sku_util.js';
import { circle, ellipse, poly, linGrad, radGrad, fillRR, drop } from '../gfx/draw.js';
import { lighten, darken, TAU, rng } from '../core/util.js';
import { ILLUS } from '../gfx/illus.js';

// The stock cup painter (pack_styles.js `content()` for style 'cup') always draws ILLUS.noodleBowl and only forwards
// `topping`, `soup`, `bowl` (= pal[2]) and `rim` (= pal[1]). Captured here, before skus.js merges our `illus` map over it.
const STOCK_BOWL = ILLUS.noodleBowl;

// ---------------------------------------------------------------------------------------- brands
export const brands = {
  maeploy:   { text: 'Mae Ploy', th: 'แม่พลอย', style: 'pill', bg: '#ffffff', fg: '#d4111a', font: 'lilita', ring: '#2e8b3a' },
  maekrua:   { text: 'Mae Krua', th: 'แม่ครัว', style: 'ribbon', bg: '#c8161d', fg: '#ffffff', font: 'archivo', ring: '#ffd54a' },
  healthyboy: { text: 'Healthy Boy', th: 'เด็กสมบูรณ์', style: 'pill', bg: '#ffd21a', fg: '#0f3a8a', font: 'lilita', ring: '#0f3a8a' },
  roza:      { text: 'Roza', th: 'โรซ่า', style: 'oval', bg: '#c8161d', fg: '#ffe9a8', font: 'pacifico', ring: '#ffe9a8' },
  angoon:    { text: 'Angoon', th: 'องุ่น', style: 'pill', bg: '#3a7d1e', fg: '#ffffff', font: 'lilita', ring: '#f1d24a' },
  royalumbrella: { text: 'Royal Umbrella', th: 'ตราฉัตร', style: 'shield', bg: '#9b1c1f', fg: '#ffdf8a', font: 'chonburi', ring: '#ffdf8a' },
  mitrphol:  { text: 'Mitr Phol', th: 'มิตรผล', style: 'block', bg: '#1f8a3c', fg: '#ffffff', font: 'archivo', ring: '#ff9a1f' },
  prungthip: { text: 'Prungthip', th: 'ปรุงทิพย์', style: 'stamp', bg: '#ffffff', fg: '#0a4fa8', font: 'chonburi', ring: '#0a4fa8' },
  cpselect:  { text: 'CP Select', th: 'ซีพี ซีเล็คชั่น', style: 'pill', bg: '#e60012', fg: '#ffffff', font: 'archivo', ring: '#ffffff' },
  kokomi:    { text: 'Kokomi', th: 'โคโคมิ', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#c8102e' },
};

export const ingredients = {
  anchovy:  { en: 'Anchovy', th: 'ปลากะตัก' },
  oyster:   { en: 'Oyster extract', th: 'สารสกัดจากหอยนางรม' },
  vinegar:  { en: 'Vinegar', th: 'น้ำส้มสายชู' },
  soyoil:   { en: 'Soybean oil', th: 'น้ำมันถั่วเหลือง' },
  mackerel: { en: 'Mackerel', th: 'ปลาแมคเคอเรล' },
  creamer:  { en: 'Non-dairy creamer', th: 'ครีมเทียม' },
  iodine:   { en: 'Potassium iodate', th: 'โพแทสเซียมไอโอเดต' },
  shallot:  { en: 'Fried shallot', th: 'หอมแดงเจียว' },
  sweetsoy: { en: 'Sweet soy sauce', th: 'ซีอิ๊วหวาน' },
  pepper:   { en: 'Pepper', th: 'พริกไทย' },
  porkbone: { en: 'Pork bone extract', th: 'สารสกัดจากกระดูกหมู' },
  springonion: { en: 'Spring onion', th: 'ต้นหอม' },
  jasmine:  { en: 'Jasmine rice', th: 'ข้าวหอมมะลิ' },
  cane:     { en: 'Cane sugar', th: 'น้ำตาลจากอ้อย' },
  beefext:  { en: 'Beef extract', th: 'สารสกัดจากเนื้อวัว' },
  driedveg: { en: 'Dried vegetables', th: 'ผักอบแห้ง' },
};

// ---------------------------------------------------------------------------------------- drawing kit
// Every hero draws centred on (0,0) inside roughly [-s/2, s/2]. On a noodle pack the visible band is
// about y in [-0.22 s, +0.29 s] (logo above, name ribbon below), so bowls keep their action there.
const OUT = '#3b2411';
const ln = (ctx, w, col = OUT) => { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
function glint(ctx, x, y, rx, ry, rot = -0.6, a = 0.55) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.fill(); ctx.restore();
}
// Catmull-Rom through control points -> polyline
function spline(pts, n = 8) {
  const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const a = P[i - 1], b = P[i], c = P[i + 1], d = P[i + 2];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// curled prawn, head on the left, tail fan curling round at the right; L = overall length
function prawn(ctx, x, y, L, rot = 0, flip = 1, col = '#ff7a3d') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip, 1);
  const K = [[-0.5, 0.06], [-0.43, -0.17], [-0.24, -0.33], [0.03, -0.37], [0.28, -0.27], [0.42, -0.06], [0.42, 0.17], [0.3, 0.33]];
  const pts = spline(K.map(([a, b]) => [a * L, b * L]), 6), n = pts.length;
  const rad = (i) => L * (0.11 - 0.06 * (i / (n - 1)));
  const dk = darken(col, 0.5), lt = lighten(col, 0.45);
  // antennae
  ctx.strokeStyle = dk; ctx.lineWidth = L * 0.014; ctx.lineCap = 'round';
  for (const [dx, dy] of [[-0.3, -0.36], [-0.42, -0.2]]) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1] - L * 0.04); ctx.quadraticCurveTo(pts[0][0] + dx * L * 0.3, pts[0][1] + dy * L * 0.9, pts[0][0] + dx * L, pts[0][1] + dy * L * 0.9); ctx.stroke(); }
  // tail fan
  const e = pts[n - 1], pv = pts[n - 5], ang = Math.atan2(e[1] - pv[1], e[0] - pv[0]);
  for (const da of [-0.6, 0, 0.6]) { ctx.save(); ctx.translate(e[0], e[1]); ctx.rotate(ang + da); ellipse(ctx, L * 0.1, 0, L * 0.13, L * 0.05, darken(col, 0.08), dk, L * 0.014); ctx.restore(); }
  for (let i = 0; i < n; i++) circle(ctx, pts[i][0], pts[i][1], rad(i) + L * 0.017, dk);
  for (let i = 0; i < n; i++) circle(ctx, pts[i][0], pts[i][1], rad(i), col);
  // belly stripe on the inner side + segment lines
  for (let i = 2; i < n - 2; i++) {
    const [px, py] = pts[i], [qx, qy] = pts[i + 1], a = Math.atan2(qy - py, qx - px) + Math.PI / 2;
    const inn = Math.cos(a) * px + Math.sin(a) * py > 0 ? -1 : 1;
    circle(ctx, px + Math.cos(a) * rad(i) * 0.5 * inn, py + Math.sin(a) * rad(i) * 0.5 * inn, rad(i) * 0.36, lt);
  }
  ctx.strokeStyle = dk; ctx.lineWidth = L * 0.013; ctx.globalAlpha = 0.6;
  for (let i = 4; i < n - 3; i += 5) {
    const [px, py] = pts[i], [qx, qy] = pts[i + 1], a = Math.atan2(qy - py, qx - px) + Math.PI / 2, r = rad(i) * 0.95;
    ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * r, py + Math.sin(a) * r); ctx.lineTo(px - Math.cos(a) * r, py - Math.sin(a) * r); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  circle(ctx, pts[0][0] - L * 0.02, pts[0][1] - L * 0.02, L * 0.105, darken(col, 0.06), dk, L * 0.014);
  circle(ctx, pts[0][0] - L * 0.05, pts[0][1] - L * 0.05, L * 0.026, '#1b0d05'); circle(ctx, pts[0][0] - L * 0.056, pts[0][1] - L * 0.058, L * 0.009, '#fff');
  glint(ctx, pts[Math.floor(n * 0.42)][0], pts[Math.floor(n * 0.42)][1] - L * 0.05, L * 0.09, L * 0.018, 0.2, 0.5);
  ctx.restore();
}

function chiliSlice(ctx, x, y, r, rot = 0, col = '#e5322a') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ellipse(ctx, 0, 0, r, r * 0.8, col, darken(col, 0.5), r * 0.16);
  ellipse(ctx, 0, 0, r * 0.62, r * 0.46, lighten(col, 0.75));
  ctx.fillStyle = '#f2dc86';
  for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.4; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.2, r * 0.09, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function leaf2(ctx, x, y, len, wid, rot, col = '#2f9a45') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.45, -wid, len, 0); ctx.quadraticCurveTo(len * 0.45, wid, 0, 0);
  ctx.fillStyle = col; ctx.fill(); ln(ctx, wid * 0.22, darken(col, 0.55)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(len * 0.06, 0); ctx.lineTo(len * 0.88, 0); ln(ctx, wid * 0.12, lighten(col, 0.45)); ctx.stroke();
  ctx.restore();
}
function lemongrass(ctx, x, y, len, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const w = len * 0.13;
  fillRR(ctx, -len / 2, -w / 2, len, w, w / 2, linGrad(ctx, 0, -w / 2, 0, w / 2, [[0, '#f4f0b0'], [1, '#c9d27a']]), '#6f7a2c', w * 0.16);
  ctx.strokeStyle = '#a58aa8'; ctx.lineWidth = w * 0.18; ctx.beginPath(); ctx.moveTo(len * 0.3, -w * 0.3); ctx.lineTo(len * 0.5 - w * 0.4, -w * 0.3); ctx.stroke();
  ctx.restore();
}
function strawMushroom(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  fillRR(ctx, -r * 0.3, -r * 0.1, r * 0.6, r * 1.0, r * 0.22, '#f4e6c8', '#8a6a3a', r * 0.12);
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.86, 0, Math.PI, 0); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, -r * 0.3, 0, r, [[0, '#c9a878'], [1, '#8b6a42']]); ctx.fill(); ln(ctx, r * 0.14, '#4a3418'); ctx.stroke();
  glint(ctx, -r * 0.3, -r * 0.45, r * 0.22, r * 0.09, -0.5, 0.5);
  ctx.restore();
}
function cilantro(ctx, x, y, r, rot = 0, col = '#3aa14a') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (let i = -1; i <= 1; i++) { ctx.save(); ctx.rotate(i * 0.7); ellipse(ctx, 0, -r * 0.55, r * 0.34, r * 0.5, i ? col : lighten(col, 0.12), darken(col, 0.5), r * 0.09); ctx.restore(); }
  ctx.restore();
}
function ring(ctx, x, y, r, rot, outer, hole, edge) { // spring-onion / squid ring seen at an angle
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ellipse(ctx, 0, 0, r, r * 0.72, outer, edge, r * 0.13); ellipse(ctx, 0, r * 0.05, r * 0.55, r * 0.34, hole, edge, r * 0.08);
  ctx.restore();
}
function fishBall(ctx, x, y, r, col = '#f3e6c6') {
  circle(ctx, x, y, r, radGrad(ctx, x, y, 0, r, [[0, lighten(col, 0.5)], [1, darken(col, 0.12)]], x - r * 0.3, y - r * 0.3), darken(col, 0.55), r * 0.13);
  glint(ctx, x - r * 0.35, y - r * 0.38, r * 0.24, r * 0.12, -0.7, 0.7);
}
function meatBall(ctx, x, y, r, col = '#a55a32') {
  circle(ctx, x, y, r, radGrad(ctx, x, y, 0, r, [[0, lighten(col, 0.3)], [1, darken(col, 0.2)]], x - r * 0.3, y - r * 0.3), darken(col, 0.6), r * 0.14);
  ctx.fillStyle = darken(col, 0.3);
  for (let i = 0; i < 6; i++) { const a = i * 2.1; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.42, r * 0.07, 0, TAU); ctx.fill(); }
  glint(ctx, x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.1, -0.7, 0.55);
}
function mince(ctx, x, y, r, col = '#a5582c') {
  const R = rng(Math.floor(Math.abs(x) * 7 + Math.abs(y) * 13 + 5));
  for (let i = 0; i < 7; i++) circle(ctx, x + (R() - 0.5) * r * 2, y + (R() - 0.5) * r, r * (0.2 + R() * 0.16), i % 2 ? col : darken(col, 0.12), darken(col, 0.6), r * 0.06);
}
function tofuCube(ctx, x, y, r, rot = 0, col = '#f6e5a8') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  fillRR(ctx, -r, -r * 0.8, r * 2, r * 1.6, r * 0.25, col, darken(col, 0.5), r * 0.13);
  fillRR(ctx, -r * 0.8, -r * 0.62, r * 1.6, r * 0.5, r * 0.15, lighten(col, 0.5));
  ctx.restore();
}
function eggHalf(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ellipse(ctx, 0, 0, r, r * 0.78, '#fffaf0', '#a8946a', r * 0.11);
  ellipse(ctx, 0, r * 0.02, r * 0.5, r * 0.4, '#ffb01a', '#c47a08', r * 0.07);
  glint(ctx, -r * 0.14, -r * 0.1, r * 0.12, r * 0.06, -0.5, 0.75);
  ctx.restore();
}
function mussel(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const shell = (k) => { ctx.beginPath(); ctx.moveTo(-r * k, 0); ctx.quadraticCurveTo(-r * 0.1 * k, -r * 0.95 * k, r * k, 0); ctx.quadraticCurveTo(-r * 0.1 * k, r * 0.7 * k, -r * k, 0); ctx.closePath(); };
  shell(1); ctx.fillStyle = '#2b3a5c'; ctx.fill(); ln(ctx, r * 0.14, '#0d1424'); ctx.stroke();
  shell(0.68); ctx.fillStyle = '#ff9a3a'; ctx.fill(); ln(ctx, r * 0.06, '#c4601a'); ctx.stroke();
  glint(ctx, -r * 0.3, -r * 0.25, r * 0.25, r * 0.07, -0.3, 0.35);
  ctx.restore();
}
function limeWedge(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.arc(0, 0, r, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#6cbf3a'; ctx.fill(); ln(ctx, r * 0.13, '#2d6a16'); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.8, -r * 0.05); ctx.arc(0, -r * 0.05, r * 0.8, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#d6f08a'; ctx.fill();
  ln(ctx, r * 0.07, '#8fd04a');
  for (let i = 1; i < 4; i++) { const a = Math.PI + (Math.PI * i) / 4; ctx.beginPath(); ctx.moveTo(0, -r * 0.05); ctx.lineTo(Math.cos(a) * r * 0.75, -r * 0.05 + Math.sin(a) * r * 0.75); ctx.stroke(); }
  ctx.restore();
}
function flame(ctx, x, y, w, h, rot = 0, c1 = '#ff5a14', c2 = '#ffd21a') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const path = (k) => { ctx.beginPath(); ctx.moveTo(-w * k / 2, 0); ctx.bezierCurveTo(-w * k * 0.7, -h * k * 0.35, -w * k * 0.1, -h * k * 0.45, w * k * 0.06, -h * k); ctx.bezierCurveTo(w * k * 0.16, -h * k * 0.6, w * k * 0.7, -h * k * 0.45, w * k / 2, 0); ctx.closePath(); };
  path(1); ctx.fillStyle = linGrad(ctx, 0, 0, 0, -h, [[0, '#d91410'], [0.5, c1], [1, c2]]); ctx.fill(); ln(ctx, w * 0.05, '#7a1208'); ctx.stroke();
  ctx.translate(0, -h * 0.03); path(0.56); ctx.fillStyle = linGrad(ctx, 0, 0, 0, -h, [[0, c1], [1, '#fff3a0']]); ctx.fill();
  ctx.restore();
}
function steamWisps(ctx, s, x, y, n = 2, h = 0.14) {
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = s * 0.022; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const sx = x + (i - (n - 1) / 2) * s * 0.12;
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.bezierCurveTo(sx - s * 0.05, y - s * h * 0.35, sx + s * 0.05, y - s * h * 0.7, sx, y - s * h); ctx.stroke();
  }
  ctx.restore();
}

// wavy noodle strands piled into a mound. flat=true draws broad ribbons for stir-fried noodles.
function nest(ctx, s, cx, cy, rx, hgt, o = {}) {
  const col = o.noodle || '#ffd76a', edge = o.edge || darken(col, 0.42), R = rng(o.seed || 11);
  const N = o.n || 17, wv = o.flat ? 0.012 : 0.02, wl = o.flat ? 9 : 14;
  const strands = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    strands.push({ a: rx * (0.45 + 0.5 * R()), h: hgt * (0.25 + 0.75 * (1 - Math.abs(t - 0.5) * 1.4) * (0.6 + 0.4 * R())), off: (t - 0.5) * hgt * 0.7, ph: R() * 6, dx: (R() - 0.5) * rx * 0.3 });
  }
  strands.sort((p, q) => q.off - p.off);
  const w1 = s * (o.flat ? 0.05 : 0.034), w2 = s * (o.flat ? 0.036 : 0.022);
  const at = (st, u) => [cx + st.dx + u * st.a, cy + st.off * 0.5 - st.h * (1 - u * u) + Math.sin(u * wl + st.ph) * s * wv];
  for (const st of strands) {
    const pts = [];
    for (let k = 0; k <= 28; k++) pts.push(at(st, (k / 28) * 2 - 1));
    for (const [w, c] of [[w1, edge], [w2, col]]) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ln(ctx, w, c); ctx.stroke(); }
  }
  if (!o.noShine) {
    ctx.globalAlpha = 0.55; ln(ctx, s * 0.008, lighten(col, 0.6));
    for (let i = 0; i < 5; i++) {
      const st = strands[(i * 3) % strands.length];
      ctx.beginPath();
      for (let k = 6; k <= 16; k++) { const [x, y] = at(st, (k / 28) * 2 - 1); k === 6 ? ctx.moveTo(x, y - s * 0.006) : ctx.lineTo(x, y - s * 0.006); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// A bowl in three-quarter view. `contents(ctx, G)` paints noodles and toppings between the soup and the front wall.
function bowlScene(ctx, s, o = {}) {
  const bowl = o.bowl || '#f7f2e6', rim = o.rim || '#e8352a', soup = o.soup || '#d8461c';
  const rx = s * 0.44, ry = s * 0.125, y0 = s * 0.02, yb = s * 0.37, bw = s * 0.17, edge = o.edge || darken(bowl, 0.62);
  const G = { rx, ry, y0, yb, bw, soup };
  ctx.save();
  ellipse(ctx, 0, y0, rx, ry, darken(bowl, 0.2), edge, s * 0.02);
  ellipse(ctx, 0, y0 + ry * 0.04, rx * 0.93, ry * 0.86, radGrad(ctx, -rx * 0.2, y0 - ry * 0.2, 0, rx, [[0, lighten(soup, 0.28)], [0.65, soup], [1, darken(soup, 0.22)]]));
  if (o.oil) {
    ctx.fillStyle = o.oil;
    for (let i = 0; i < 9; i++) { const a = i * 2.4; ctx.beginPath(); ctx.ellipse(Math.cos(a) * rx * 0.62 * ((i % 3) + 1) / 3, y0 + Math.sin(a) * ry * 0.52, s * 0.02, s * 0.009, 0, 0, TAU); ctx.fill(); }
  }
  if (o.contents) o.contents(ctx, G);
  // front wall
  const body = () => {
    ctx.beginPath(); ctx.moveTo(-rx, y0);
    ctx.bezierCurveTo(-rx * 0.99, y0 + (yb - y0) * 0.6, -bw * 1.7, yb - s * 0.015, -bw, yb); ctx.lineTo(bw, yb);
    ctx.bezierCurveTo(bw * 1.7, yb - s * 0.015, rx * 0.99, y0 + (yb - y0) * 0.6, rx, y0);
    ctx.ellipse(0, y0, rx, ry, 0, 0, Math.PI, false); ctx.closePath();
  };
  body();
  ctx.fillStyle = linGrad(ctx, -rx, 0, rx, 0, [[0, darken(bowl, 0.05)], [0.3, lighten(bowl, 0.12)], [0.75, bowl], [1, darken(bowl, 0.3)]]); ctx.fill();
  ctx.save(); body(); ctx.clip();
  const band = (yy, th, col) => {
    ctx.beginPath(); ctx.moveTo(-rx * 1.1, y0 + yy); ctx.quadraticCurveTo(0, y0 + yy + ry * 2.1, rx * 1.1, y0 + yy);
    ctx.lineTo(rx * 1.1, y0 + yy + th); ctx.quadraticCurveTo(0, y0 + yy + th + ry * 2.1, -rx * 1.1, y0 + yy + th); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  };
  const pat = o.pattern || 'band';
  if (pat === 'band' || pat === 'lotus') { band(ry * 0.35, s * 0.04, rim); band(ry * 0.35 + s * 0.06, s * 0.012, rim); }
  if (pat === 'lotus') { ctx.fillStyle = rim; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(i * s * 0.11, y0 + ry * 1.7 + Math.abs(i) * s * 0.012 + s * 0.05, s * 0.028, s * 0.05, i * 0.12, 0, TAU); ctx.fill(); } }
  if (pat === 'dots') { band(ry * 0.35, s * 0.03, rim); ctx.fillStyle = rim; for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.arc(i * s * 0.075, y0 + ry * 1.8 + s * 0.06 + Math.abs(i) * s * 0.008, s * 0.014, 0, TAU); ctx.fill(); } }
  glint(ctx, -rx * 0.62, y0 + s * 0.13, s * 0.03, s * 0.09, 0.2, 0.28);
  ctx.restore();
  body(); ln(ctx, s * 0.02, edge); ctx.stroke();
  ellipse(ctx, 0, yb, bw, s * 0.028, darken(bowl, 0.12), edge, s * 0.016);
  ctx.beginPath(); ctx.ellipse(0, y0, rx, ry, 0, 0.12, Math.PI - 0.12, false); ln(ctx, s * 0.014, 'rgba(255,255,255,.55)'); ctx.stroke();
  ctx.restore();
  return G;
}

// ---- pantry icons -------------------------------------------------------------------------------------------------
function fishShape(ctx, x, y, L, rot = 0, o = {}) {
  const back = o.back || '#35506b', mid = o.mid || '#8fb0c8', belly = o.belly || '#eef3f6', edge = o.edge || '#1c2c3c';
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  // tail
  ctx.beginPath(); ctx.moveTo(-L * 0.38, 0); ctx.lineTo(-L * 0.62, -L * 0.17); ctx.quadraticCurveTo(-L * 0.54, 0, -L * 0.62, L * 0.17); ctx.closePath();
  ctx.fillStyle = back; ctx.fill(); ln(ctx, L * 0.022, edge); ctx.stroke();
  // dorsal + pectoral fins
  ctx.beginPath(); ctx.moveTo(-L * 0.05, -L * 0.15); ctx.lineTo(-L * 0.12, -L * 0.27); ctx.lineTo(L * 0.1, -L * 0.17); ctx.closePath(); ctx.fillStyle = back; ctx.fill(); ln(ctx, L * 0.02, edge); ctx.stroke();
  // body
  const body = () => { ctx.beginPath(); ctx.moveTo(L * 0.5, L * 0.02); ctx.bezierCurveTo(L * 0.34, -L * 0.2, -L * 0.1, -L * 0.24, -L * 0.42, -L * 0.03); ctx.lineTo(-L * 0.42, L * 0.03); ctx.bezierCurveTo(-L * 0.1, L * 0.22, L * 0.34, L * 0.2, L * 0.5, L * 0.02); ctx.closePath(); };
  body(); ctx.fillStyle = linGrad(ctx, 0, -L * 0.22, 0, L * 0.2, [[0, back], [0.45, mid], [0.62, belly], [1, belly]]); ctx.fill(); ln(ctx, L * 0.026, edge); ctx.stroke();
  ctx.save(); body(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = L * 0.014; ctx.beginPath(); ctx.moveTo(-L * 0.4, -L * 0.012); ctx.quadraticCurveTo(0, -L * 0.05, L * 0.42, 0); ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.arc(L * 0.24, -L * 0.005, L * 0.17, 1.9, 4.3); ln(ctx, L * 0.014, 'rgba(28,44,60,.55)'); ctx.stroke();
  circle(ctx, L * 0.36, -L * 0.03, L * 0.038, '#fff', edge, L * 0.012); circle(ctx, L * 0.372, -L * 0.03, L * 0.02, '#111');
  ctx.restore();
}
function chiliPod(ctx, x, y, L, rot = 0, col = '#e0261c') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const w = L * 0.15;
  ctx.beginPath(); ctx.moveTo(0, -w); ctx.bezierCurveTo(L * 0.35, -w * 1.35, L * 0.78, -w * 0.5, L, L * 0.13); ctx.bezierCurveTo(L * 0.7, w * 0.6, L * 0.34, w * 1.3, 0, w); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, -w * 1.3, 0, w * 1.3, [[0, lighten(col, 0.3)], [0.5, col], [1, darken(col, 0.3)]]); ctx.fill(); ln(ctx, L * 0.03, darken(col, 0.6)); ctx.stroke();
  glint(ctx, L * 0.36, -w * 0.5, L * 0.2, L * 0.022, 0.08, 0.6);
  ctx.beginPath(); ctx.moveTo(-w * 0.2, 0); ctx.quadraticCurveTo(-L * 0.08, -L * 0.02, -L * 0.14, -L * 0.1); ln(ctx, w * 0.6, '#2d7a2a'); ctx.stroke();
  ellipse(ctx, 0, 0, w * 0.55, w * 1.25, '#3aa14a', '#1c5a1c', L * 0.02);
  ctx.restore();
}
function drumstick(ctx, x, y, L, rot = 0) { // fried drumstick glazed with red chilli sauce; bone points to +x
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  fillRR(ctx, L * 0.2, -L * 0.045, L * 0.3, L * 0.09, L * 0.04, '#f8efd6', '#a8946a', L * 0.018);
  circle(ctx, L * 0.52, -L * 0.055, L * 0.052, '#f8efd6', '#a8946a', L * 0.018); circle(ctx, L * 0.52, L * 0.055, L * 0.052, '#f8efd6', '#a8946a', L * 0.018);
  ctx.beginPath(); ctx.moveTo(L * 0.24, -L * 0.07); ctx.bezierCurveTo(L * 0.2, -L * 0.34, -L * 0.36, -L * 0.36, -L * 0.4, -L * 0.02); ctx.bezierCurveTo(-L * 0.42, L * 0.32, L * 0.04, L * 0.34, L * 0.26, L * 0.08); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, -L * 0.14, -L * 0.1, 0, L * 0.5, [[0, '#ffd27a'], [0.5, '#e0952e'], [1, '#a5561a']]); ctx.fill(); ln(ctx, L * 0.028, '#5a2a08'); ctx.stroke();
  ctx.fillStyle = 'rgba(120,60,10,.45)'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(-L * 0.32 + ((i * 47) % 100) / 100 * L * 0.5, -L * 0.2 + ((i * 31) % 100) / 100 * L * 0.36, L * 0.012, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#d8231a'; ctx.lineCap = 'round'; ctx.lineWidth = L * 0.04;
  ctx.beginPath(); ctx.moveTo(-L * 0.3, -L * 0.14); ctx.bezierCurveTo(-L * 0.1, -L * 0.24, L * 0.1, -L * 0.04, L * 0.2, -L * 0.14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-L * 0.34, L * 0.06); ctx.bezierCurveTo(-L * 0.12, -L * 0.04, L * 0.08, L * 0.16, L * 0.2, L * 0.07); ctx.stroke();
  glint(ctx, -L * 0.2, -L * 0.2, L * 0.07, L * 0.03, -0.5, 0.5);
  ctx.restore();
}
function garlicBulb(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, -r * 1.25); ctx.bezierCurveTo(r * 0.35, -r * 0.75, r * 1.1, -r * 0.3, r * 0.85, r * 0.5); ctx.bezierCurveTo(r * 0.6, r * 1.05, -r * 0.6, r * 1.05, -r * 0.85, r * 0.5); ctx.bezierCurveTo(-r * 1.1, -r * 0.3, -r * 0.35, -r * 0.75, 0, -r * 1.25); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, -r * 0.3, -r * 0.2, 0, r * 1.3, [[0, '#fffdf5'], [1, '#e4d8bb']]); ctx.fill(); ln(ctx, r * 0.09, '#8a7a58'); ctx.stroke();
  ctx.strokeStyle = 'rgba(138,122,88,.6)'; ctx.lineWidth = r * 0.06; for (const d of [-0.4, 0, 0.4]) { ctx.beginPath(); ctx.moveTo(d * r * 0.6, -r * 0.8); ctx.quadraticCurveTo(d * r * 1.3, r * 0.1, d * r * 0.8, r * 0.85); ctx.stroke(); }
  ctx.restore();
}
function soyPod(ctx, x, y, L, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const w = L * 0.13;
  ctx.beginPath(); ctx.moveTo(-L / 2, 0);
  for (let i = 0; i < 3; i++) { const a = -L / 2 + (i * L) / 3, b = -L / 2 + ((i + 1) * L) / 3; ctx.quadraticCurveTo((a + b) / 2, -w * 1.5, b, -w * 0.4); }
  ctx.lineTo(L / 2 + w * 0.3, 0);
  for (let i = 2; i >= 0; i--) { const a = -L / 2 + (i * L) / 3, b = -L / 2 + ((i + 1) * L) / 3; ctx.quadraticCurveTo((a + b) / 2, w * 1.5, a, w * 0.4); }
  ctx.closePath(); ctx.fillStyle = linGrad(ctx, 0, -w, 0, w, [[0, '#8fd05a'], [1, '#4c9a30']]); ctx.fill(); ln(ctx, L * 0.025, '#2a5a18'); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = L * 0.014; for (let i = -10; i < 10; i++) { ctx.beginPath(); ctx.moveTo((i * L) / 22, -w * 0.9); ctx.lineTo((i * L) / 22 + L * 0.01, -w * 0.5); ctx.stroke(); }
  ctx.restore();
}
function bean(ctx, x, y, r, rot = 0, col = '#ecd9a0') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ellipse(ctx, 0, 0, r, r * 0.75, radGrad(ctx, -r * 0.3, -r * 0.3, 0, r, [[0, lighten(col, 0.4)], [1, darken(col, 0.1)]]), darken(col, 0.5), r * 0.12);
  ellipse(ctx, r * 0.35, 0, r * 0.14, r * 0.07, darken(col, 0.45));
  ctx.restore();
}
function eggShape(ctx, x, y, h, rot = 0, col = '#e8c28a') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const w = h * 0.38;
  ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.bezierCurveTo(w * 1.25, -h * 0.5, w * 1.15, h * 0.5, 0, h / 2); ctx.bezierCurveTo(-w * 1.15, h * 0.5, -w * 1.25, -h * 0.5, 0, -h / 2); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, -w * 0.4, -h * 0.15, 0, h * 0.75, [[0, lighten(col, 0.55)], [0.55, col], [1, darken(col, 0.22)]]); ctx.fill(); ln(ctx, h * 0.03, darken(col, 0.5)); ctx.stroke();
  glint(ctx, -w * 0.4, -h * 0.22, w * 0.16, h * 0.11, 0.3, 0.6);
  ctx.restore();
}
function sparkle(ctx, x, y, r, col = '#fff') {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0); ctx.quadraticCurveTo(r * 0.12, r * 0.12, 0, r); ctx.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0); ctx.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r); ctx.fill();
  ctx.restore();
}
function blobPath(ctx, cx, cy, rx, ry, jag = 0.06, seed = 1, rot = 0) { // irregular oval (shells, rocks)
  const R = rng(seed), p1 = R() * 6, p2 = R() * 6, n = 56;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU, k = 1 + jag * Math.sin(a * 5 + p1) + jag * 0.6 * Math.sin(a * 9 + p2);
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    const px = cx + x * Math.cos(rot) - y * Math.sin(rot), py = cy + x * Math.sin(rot) + y * Math.cos(rot);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
function tomato(ctx, x, y, r) {
  circle(ctx, x, y, r, radGrad(ctx, x - r * 0.3, y - r * 0.3, 0, r * 1.2, [[0, '#ff7a5a'], [0.6, '#e63a2a'], [1, '#a01810']]), '#5a0e08', r * 0.09);
  for (let i = 0; i < 5; i++) leaf2(ctx, x, y - r * 0.82, r * 0.5, r * 0.15, -Math.PI / 2 + (i - 2) * 0.75, '#3a9a3a');
  glint(ctx, x - r * 0.35, y - r * 0.32, r * 0.22, r * 0.12, -0.7, 0.6);
}
function grainPile(ctx, s, cx, cy, rx, hgt, col, edge, seed = 3) { // heap of small rice / sugar / salt grains
  const R = rng(seed);
  ctx.beginPath(); ctx.moveTo(cx - rx, cy); ctx.bezierCurveTo(cx - rx * 0.55, cy - hgt * 1.25, cx + rx * 0.55, cy - hgt * 1.25, cx + rx, cy); ctx.quadraticCurveTo(cx, cy + hgt * 0.25, cx - rx, cy); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, cx - rx * 0.2, cy - hgt * 0.6, 0, rx * 1.2, [[0, lighten(col, 0.35)], [1, col]]); ctx.fill(); ln(ctx, s * 0.014, edge); ctx.stroke();
  for (let i = 0; i < 70; i++) {
    const u = R() * 2 - 1, v = R();
    const gx = cx + u * rx * 0.9, top = cy - hgt * 1.0 * (1 - u * u) * 0.9;
    const gy = top + v * (cy - top) * 0.85;
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(R() * 3); ellipse(ctx, 0, 0, s * 0.02, s * 0.011, lighten(col, 0.5 + R() * 0.3), darken(col, 0.25), s * 0.004); ctx.restore();
  }
}

// A shallow plate (dry noodles). contents(ctx, G) paints the food.
function plateScene(ctx, s, o = {}) {
  const plate = o.plate || '#f7f2e6', rim = o.rim || '#2e8b3a', edge = o.edge || darken(plate, 0.62);
  const rx = s * 0.47, ry = s * 0.19, y0 = s * 0.1, th = s * 0.04;
  const G = { rx, ry, y0 };
  ctx.save();
  ellipse(ctx, 0, y0 + th, rx, ry, darken(plate, 0.28), edge, s * 0.02);
  ellipse(ctx, 0, y0, rx, ry, radGrad(ctx, -rx * 0.3, y0 - ry * 0.4, 0, rx, [[0, lighten(plate, 0.2)], [1, plate]]), edge, s * 0.02);
  ellipse(ctx, 0, y0, rx * 0.86, ry * 0.84, null, rim, s * 0.014);
  ellipse(ctx, 0, y0 + ry * 0.04, rx * 0.74, ry * 0.7, darken(plate, 0.05));
  if (o.contents) o.contents(ctx, G);
  ctx.restore();
  return G;
}

// ---------------------------------------------------------------------------------------- hero illustrations
// soup bowls: tomyumNoodleBowl, creamyTomyumBowl, porkNoodleBowl, yentafoNoodleBowl, shinRamyunBowl, jokPorridgeBowl
// dry noodles on a plate: padKeeMaoPlate (pad kee mao), miGorengPlate, yakisobaPlate, buldakFireBowl / buldakCarbonaraBowl (Buldak)
export const illus = {
  tomyumNoodleBowl(ctx, s, o = {}) {
    // variant 0: lemongrass + kaffir leaves, 2 prawns · 1: mirrored with a third prawn · 2: lime + cilantro, no lemongrass · 3: three prawns in a row
    const v = o.variant || 0, m = v === 1 ? -1 : 1;
    bowlScene(ctx, s, {
      bowl: o.bowl || '#f7f2e6', rim: o.rim || '#e8352a', soup: o.soup || '#d8461c', pattern: o.pattern || 'band', oil: '#f4a13a',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        c.save(); c.scale(m, 1);
        nest(c, s, 0, y0 - ry * 0.05, rx * 0.86, s * 0.2, { seed: 5 + v * 7 });
        if (v === 0 || v === 1) {
          lemongrass(c, -rx * 0.66, y0 - s * 0.02, s * 0.28, -0.42);
          leaf2(c, rx * 0.44, y0 - s * 0.03, s * 0.2, s * 0.06, -0.9, '#2f8f3a');
          leaf2(c, rx * 0.52, y0 - s * 0.045, s * 0.17, s * 0.05, -0.2, '#3aa14a');
          strawMushroom(c, -rx * 0.46, y0 - s * 0.05, s * 0.055, -0.2);
          strawMushroom(c, rx * 0.68, y0 - s * 0.04, s * 0.05, 0.3);
          prawn(c, -rx * 0.26, y0 - s * 0.07, s * 0.27, -0.06, 1);
          prawn(c, rx * 0.26, y0 - s * 0.06, s * 0.25, 0.08, -1, '#ff8a4a');
          if (v === 1) prawn(c, 0, y0 - s * 0.12, s * 0.23, 0, 1, '#ff9256');
          chiliSlice(c, -rx * 0.02, y0 - s * 0.085, s * 0.032, 0.3); chiliSlice(c, rx * 0.12, y0 - s * 0.0, s * 0.028, -0.4); chiliSlice(c, -rx * 0.62, y0 + s * 0.01, s * 0.028, 0.2);
          cilantro(c, rx * 0.02, y0 - s * 0.17, s * 0.055);
        } else if (v === 2) {
          strawMushroom(c, -rx * 0.55, y0 - s * 0.04, s * 0.055, -0.2); strawMushroom(c, -rx * 0.3, y0 - s * 0.075, s * 0.05, 0.2); strawMushroom(c, rx * 0.66, y0 - s * 0.03, s * 0.05, 0.3);
          prawn(c, -rx * 0.12, y0 - s * 0.075, s * 0.3, 0.02, 1);
          prawn(c, rx * 0.36, y0 - s * 0.055, s * 0.24, 0.1, -1, '#ff8a4a');
          limeWedge(c, -rx * 0.68, y0 + s * 0.02, s * 0.055, -0.5);
          cilantro(c, rx * 0.06, y0 - s * 0.17, s * 0.06); cilantro(c, rx * 0.56, y0 - s * 0.1, s * 0.045, 0.5);
          leaf2(c, -rx * 0.3, y0 - s * 0.14, s * 0.16, s * 0.05, -0.5, '#2f8f3a');
          for (const [x, y, r] of [[-0.05, -0.02, 0.3], [0.2, -0.13, -0.4], [-0.45, -0.09, 0.8], [0.5, 0.0, 0.1]]) chiliSlice(c, rx * x, y0 + s * y, s * 0.028, r);
        } else {
          prawn(c, -rx * 0.42, y0 - s * 0.055, s * 0.22, -0.1, 1); prawn(c, -rx * 0.02, y0 - s * 0.085, s * 0.24, 0.02, 1, '#ff8a4a'); prawn(c, rx * 0.4, y0 - s * 0.055, s * 0.22, 0.1, 1);
          lemongrass(c, rx * 0.5, y0 - s * 0.14, s * 0.26, 0.5);
          leaf2(c, -rx * 0.66, y0 - s * 0.05, s * 0.18, s * 0.055, -2.5, '#2f8f3a'); leaf2(c, -rx * 0.24, y0 - s * 0.12, s * 0.17, s * 0.05, -0.5, '#3aa14a');
          strawMushroom(c, rx * 0.16, y0 - s * 0.13, s * 0.05, 0.1);
          limeWedge(c, rx * 0.68, y0 - s * 0.005, s * 0.05, -0.3);
          for (const [x, y, r] of [[-0.3, -0.02, 0.3], [0.2, -0.01, -0.4], [-0.02, -0.16, 0.8], [0.62, -0.1, 0.1]]) chiliSlice(c, rx * x, y0 + s * y, s * 0.028, r);
          cilantro(c, -rx * 0.55, y0 - s * 0.12, s * 0.05, -0.3);
        }
        c.restore();
      },
    });
  },
  creamyTomyumBowl(ctx, s, o = {}) {
    const v = o.variant || 0;
    bowlScene(ctx, s, {
      bowl: o.bowl || '#f7f2e6', rim: o.rim || '#f7731e', soup: o.soup || '#f28c3a', pattern: o.pattern || 'dots', oil: '#ffc070',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        c.save(); c.scale(v % 2 ? -1 : 1, 1);
        // cream swirl on the broth
        c.strokeStyle = 'rgba(255,240,205,.75)'; c.lineWidth = s * 0.03; c.lineCap = 'round';
        c.beginPath(); c.ellipse(rx * 0.18, y0 + ry * 0.28, rx * 0.5, ry * 0.4, 0, 0.3, 4.6); c.stroke();
        nest(c, s, -rx * 0.04, y0 - ry * 0.05, rx * 0.84, s * 0.19, { seed: 21 + v, noodle: '#ffdc7a' });
        if (v < 2) {
          prawn(c, -rx * 0.24, y0 - s * 0.07, s * 0.26, -0.08, 1);
          prawn(c, rx * 0.3, y0 - s * 0.05, s * 0.24, 0.1, -1, '#ff8a4a');
          limeWedge(c, rx * 0.62, y0 + s * 0.01, s * 0.05, -0.4);
          cilantro(c, -rx * 0.55, y0 - s * 0.02, s * 0.055, -0.4); cilantro(c, rx * 0.03, y0 - s * 0.15, s * 0.05);
          if (v === 1) { strawMushroom(c, -rx * 0.6, y0 + s * 0.0, s * 0.05, -0.2); lemongrass(c, rx * 0.5, y0 - s * 0.12, s * 0.22, 0.4); }
          chiliSlice(c, -rx * 0.04, y0 - s * 0.08, s * 0.03, 0.5); chiliSlice(c, rx * 0.5, y0 - s * 0.075, s * 0.026, 0.1); chiliSlice(c, -rx * 0.4, y0 + s * 0.02, s * 0.026, 0.8);
        }
        c.restore();
      },
    });
  },
  seafoodNoodleBowl(ctx, s, o = {}) {
    // creamy seafood soup: prawns, squid rings, mussels, a fish ball
    bowlScene(ctx, s, {
      bowl: o.bowl || '#f7f2e6', rim: o.rim || '#1e9ad6', soup: o.soup || '#f0d9a0', pattern: o.pattern || 'band', oil: '#fff0c8',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        nest(c, s, 0, y0 - ry * 0.05, rx * 0.84, s * 0.18, { seed: 27, noodle: '#ffe08a' });
        prawn(c, -rx * 0.3, y0 - s * 0.07, s * 0.27, -0.06, 1);
        prawn(c, rx * 0.34, y0 - s * 0.06, s * 0.25, 0.08, -1, '#ff8a4a');
        mussel(c, -rx * 0.62, y0 - s * 0.02, s * 0.06, 0.2); mussel(c, rx * 0.66, y0 - s * 0.0, s * 0.055, -0.5); mussel(c, rx * 0.02, y0 - s * 0.14, s * 0.05, 0.1);
        ring(c, -rx * 0.08, y0 - s * 0.05, s * 0.038, 0.3, '#f7e2d2', '#f0d9a0', '#b06a58'); ring(c, rx * 0.18, y0 - s * 0.1, s * 0.034, -0.4, '#f7e2d2', '#f0d9a0', '#b06a58');
        fishBall(c, -rx * 0.42, y0 + s * 0.005, s * 0.038);
        cilantro(c, -rx * 0.2, y0 - s * 0.15, s * 0.05); chiliSlice(c, rx * 0.5, y0 - s * 0.09, s * 0.026, 0.4);
      },
    });
  },
  porkNoodleBowl(ctx, s, o = {}) {
    const v = o.variant || 0;
    bowlScene(ctx, s, {
      bowl: o.bowl || '#f7f2e6', rim: o.rim || '#e8352a', soup: o.soup || '#e9b04a', pattern: o.pattern || 'lotus', oil: '#f7d06a',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        nest(c, s, 0, y0 - ry * 0.05, rx * 0.86, s * 0.2, { seed: 31 + v });
        meatBall(c, -rx * 0.34, y0 - s * 0.06, s * 0.05); meatBall(c, rx * 0.2, y0 - s * 0.075, s * 0.048); meatBall(c, rx * 0.5, y0 - s * 0.02, s * 0.04);
        mince(c, -rx * 0.05, y0 - s * 0.1, s * 0.05); mince(c, -rx * 0.6, y0 - s * 0.005, s * 0.04); mince(c, rx * 0.32, y0 - s * 0.14, s * 0.04);
        for (const [x, y, r] of [[-0.18, -0.03, 0], [0.02, -0.02, 0.5], [0.38, -0.04, 0.2], [-0.5, -0.06, 0.7], [0.12, -0.16, 0.3], [-0.24, -0.15, 0.9]]) ring(c, rx * x, y0 + s * y, s * 0.034, r, '#5cb548', '#d8f0a0', '#2c6a1e');
        c.fillStyle = '#f2c14e'; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(rx * (-0.5 + i * 0.13), y0 - s * (0.07 + ((i * 7) % 5) * 0.012), s * 0.014, s * 0.008, i, 0, TAU); c.fill(); }
        cilantro(c, -rx * 0.08, y0 - s * 0.17, s * 0.055);
      },
    });
  },
  yentafoNoodleBowl(ctx, s, o = {}) {
    bowlScene(ctx, s, {
      bowl: o.bowl || '#eaf2fb', rim: o.rim || '#2b5fa8', soup: o.soup || '#e0587a', pattern: o.pattern || 'lotus', oil: '#ff9db3', edge: '#1f3a66',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        nest(c, s, 0, y0 - ry * 0.05, rx * 0.84, s * 0.17, { seed: 41, noodle: '#fbe3a0' });
        fishBall(c, -rx * 0.36, y0 - s * 0.04, s * 0.055); fishBall(c, rx * 0.16, y0 - s * 0.075, s * 0.05); fishBall(c, rx * 0.56, y0 - s * 0.01, s * 0.045);
        tofuCube(c, -rx * 0.08, y0 - s * 0.09, s * 0.04, 0.3); tofuCube(c, rx * 0.4, y0 - s * 0.06, s * 0.035, -0.4, '#f0c8b0');
        ring(c, -rx * 0.6, y0 - s * 0.005, s * 0.04, 0.2, '#f7e2d2', '#e0587a', '#b06a58'); ring(c, rx * 0.02, y0 + s * 0.01, s * 0.036, -0.3, '#f7e2d2', '#e0587a', '#b06a58');
        // morning glory sprig
        c.strokeStyle = '#2f8a3a'; c.lineWidth = s * 0.024; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-rx * 0.24, y0 - s * 0.03); c.quadraticCurveTo(-rx * 0.1, y0 - s * 0.2, rx * 0.06, y0 - s * 0.18); c.stroke();
        leaf2(c, rx * 0.04, y0 - s * 0.18, s * 0.12, s * 0.045, -0.4, '#3aa14a'); leaf2(c, -rx * 0.16, y0 - s * 0.14, s * 0.11, s * 0.04, -2.6, '#2f8a3a');
        chiliSlice(c, rx * 0.34, y0 - s * 0.12, s * 0.028, 0.5);
      },
    });
  },
  shinRamyunBowl(ctx, s, o = {}) {
    bowlScene(ctx, s, {
      bowl: o.bowl || '#262626', rim: o.rim || '#d0101f', soup: o.soup || '#c9301c', pattern: o.pattern || 'band', oil: '#ff8a3a', edge: '#0c0c0c',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        nest(c, s, 0, y0 - ry * 0.05, rx * 0.84, s * 0.18, { seed: 51, noodle: '#ffe08a' });
        eggHalf(c, rx * 0.3, y0 - s * 0.075, s * 0.062, -0.2);
        for (let i = 0; i < 3; i++) { c.save(); c.translate(-rx * (0.4 - i * 0.12), y0 - s * (0.05 + i * 0.015)); c.rotate(-0.3 + i * 0.3); fillRR(c, -s * 0.05, -s * 0.025, s * 0.1, s * 0.05, s * 0.015, '#8a3a2a', '#3a1a10', s * 0.008); c.restore(); }
        for (const [x, y, r] of [[-0.05, -0.12, 0.2], [0.1, -0.02, 0.5], [0.6, -0.02, 0.1], [-0.6, 0.0, 0.7], [0.5, -0.12, 0.3]]) ring(c, rx * x, y0 + s * y, s * 0.03, r, '#5cb548', '#d8f0a0', '#2c6a1e');
        chiliSlice(c, -rx * 0.14, y0 - s * 0.075, s * 0.03, 0.4); chiliSlice(c, rx * 0.06, y0 - s * 0.01, s * 0.026, -0.2);
        strawMushroom(c, -rx * 0.62, y0 - s * 0.04, s * 0.045, -0.3);
        c.strokeStyle = '#ff5a2a'; c.lineWidth = s * 0.006; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(rx * (0.0 + i * 0.05), y0 - s * 0.14); c.quadraticCurveTo(rx * (0.05 + i * 0.05), y0 - s * 0.17, rx * (0.02 + i * 0.05), y0 - s * 0.19); c.stroke(); }
      },
    });
  },
  jokPorridgeBowl(ctx, s, o = {}) {
    bowlScene(ctx, s, {
      bowl: o.bowl || '#eaf2fb', rim: o.rim || '#2b5fa8', soup: '#f6edd2', pattern: o.pattern || 'lotus', edge: '#1f3a66',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        // heaped porridge
        c.beginPath(); c.moveTo(-rx * 0.86, y0 + ry * 0.2); c.bezierCurveTo(-rx * 0.6, y0 - s * 0.2, rx * 0.6, y0 - s * 0.2, rx * 0.86, y0 + ry * 0.2); c.closePath();
        c.fillStyle = radGrad(c, -rx * 0.2, y0 - s * 0.1, 0, rx, [[0, '#fffaf0'], [1, '#eadcb4']]); c.fill(); ln(c, s * 0.012, '#b59a62'); c.stroke();
        c.fillStyle = 'rgba(190,160,100,.35)'; for (let i = 0; i < 16; i++) { c.beginPath(); c.ellipse(rx * (-0.6 + (i * 37 % 100) / 100 * 1.2), y0 - s * (0.02 + (i * 53 % 100) / 100 * 0.11), s * 0.014, s * 0.007, i, 0, TAU); c.fill(); }
        eggHalf(c, rx * 0.04, y0 - s * 0.1, s * 0.06, 0.1);
        meatBall(c, -rx * 0.4, y0 - s * 0.05, s * 0.045); meatBall(c, rx * 0.44, y0 - s * 0.045, s * 0.042);
        for (const [x, y, r] of [[-0.14, -0.03, 0], [0.24, -0.02, 0.5], [-0.62, 0.0, 0.7], [0.66, 0.0, 0.2]]) ring(c, rx * x, y0 + s * y, s * 0.028, r, '#5cb548', '#d8f0a0', '#2c6a1e');
        c.strokeStyle = '#e8c27a'; c.lineWidth = s * 0.008; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(rx * (0.1 + i * 0.05), y0 - s * 0.03); c.lineTo(rx * (0.16 + i * 0.05), y0 - s * 0.07); c.stroke(); }
        c.fillStyle = '#f2c14e'; for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse(rx * (-0.3 + i * 0.09), y0 - s * (0.02 + (i % 3) * 0.02), s * 0.013, s * 0.007, i, 0, TAU); c.fill(); }
        cilantro(c, -rx * 0.02, y0 - s * 0.16, s * 0.05);
      },
    });
  },
  padKeeMaoPlate(ctx, s, o = {}) {
    plateScene(ctx, s, {
      plate: o.plate || '#f7f2e6', rim: o.rim || '#2e8b3a',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        nest(c, s, 0, y0 - ry * 0.1, rx * 0.8, s * 0.22, { seed: 61, flat: true, n: 15, noodle: '#b9773a', edge: '#4e2a0e' });
        for (const [x, y, r, col] of [[-0.5, -0.04, -0.4, '#1f7a2a'], [-0.28, -0.14, -0.9, '#2f9a3a'], [0.05, -0.14, -1.3, '#1f7a2a'], [0.34, -0.13, -2.2, '#2f9a3a'], [0.55, -0.03, -2.9, '#1f7a2a'], [0.12, -0.02, 0.2, '#2f9a3a'], [-0.14, 0.0, 3.0, '#1f7a2a']]) leaf2(c, rx * x, y0 + s * y, s * 0.15, s * 0.05, r, col);
        prawn(c, -rx * 0.34, y0 - s * 0.05, s * 0.25, -0.05, 1); prawn(c, rx * 0.4, y0 - s * 0.04, s * 0.23, 0.05, -1, '#ff8a4a');
        ring(c, -rx * 0.06, y0 - s * 0.06, s * 0.036, 0.3, '#f7e2d2', '#7a4a20', '#b06a58'); ring(c, rx * 0.2, y0 - s * 0.11, s * 0.032, -0.4, '#f7e2d2', '#7a4a20', '#b06a58');
        for (const [x, y, r, col] of [[-0.56, 0.06, 0.2, '#e5322a'], [-0.18, -0.09, 0.5, '#5cb548'], [0.06, -0.08, 0.1, '#e5322a'], [0.6, 0.05, 0.7, '#5cb548'], [-0.02, 0.05, 0.4, '#e5322a']]) chiliSlice(c, rx * x, y0 + s * y, s * 0.028, r, col);
      },
    });
  },
  miGorengPlate(ctx, s, o = {}) {
    plateScene(ctx, s, {
      plate: o.plate || '#f7f2e6', rim: o.rim || '#e11d2a',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        nest(c, s, -rx * 0.06, y0 - ry * 0.1, rx * 0.78, s * 0.2, { seed: 71, n: 17, noodle: '#c0762e', edge: '#4a2408', noShine: false });
        // fried egg
        c.save(); c.translate(rx * 0.28, y0 - s * 0.08);
        c.beginPath(); for (let i = 0; i < 10; i++) { const a = (i * TAU) / 10, r = s * 0.085 * (0.85 + 0.22 * Math.sin(i * 2.3)); i ? c.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 0.85) : c.moveTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 0.85); }
        c.closePath(); c.fillStyle = '#fffdf6'; c.fill(); ln(c, s * 0.012, '#d9cfa8'); c.stroke();
        circle(c, -s * 0.01, -s * 0.005, s * 0.04, '#ffb01a', '#c47a08', s * 0.008); glint(c, -s * 0.022, -s * 0.02, s * 0.012, s * 0.007, -0.5, 0.8); c.restore();
        // cucumber + tomato
        for (const [x, y] of [[-0.62, 0.02], [-0.5, 0.07], [-0.38, 0.11]]) { ellipse(c, rx * x, y0 + s * y, s * 0.034, s * 0.026, '#c9e8a0', '#3f8a2a', s * 0.009); ellipse(c, rx * x, y0 + s * y, s * 0.02, s * 0.014, '#eaf7cf'); }
        for (const [x, y, r] of [[0.66, 0.05, 0.3], [0.5, 0.11, -0.4]]) { ellipse(c, rx * x, y0 + s * y, s * 0.04, s * 0.028, '#e8362a', '#7a1208', s * 0.009, r); ellipse(c, rx * x, y0 + s * y, s * 0.02, s * 0.012, '#ff8a70', null, 1, r); }
        // fried shallot
        c.fillStyle = '#e0a02a'; for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(rx * (-0.35 + (i * 41 % 100) / 100 * 0.6), y0 - s * (0.07 + (i * 29 % 100) / 100 * 0.06), s * 0.016, s * 0.007, i, 0, TAU); c.fill(); }
        chiliSlice(c, -rx * 0.02, y0 - s * 0.03, s * 0.026, 0.4);
      },
    });
  },
  yakisobaPlate(ctx, s, o = {}) {
    plateScene(ctx, s, {
      plate: o.plate || '#2a2a2a', rim: o.rim || '#f0851a', edge: '#0c0c0c',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        nest(c, s, 0, y0 - ry * 0.1, rx * 0.8, s * 0.2, { seed: 81, n: 17, noodle: '#dba552', edge: '#6a3a10' });
        for (const [x, y, r] of [[-0.5, -0.02, 0.4], [-0.3, -0.13, -0.3], [0.18, -0.16, 0.7], [0.5, -0.06, 0.1], [-0.05, -0.02, -0.6], [0.36, 0.02, 0.9]]) { c.save(); c.translate(rx * x, y0 + s * y); c.rotate(r); fillRR(c, -s * 0.05, -s * 0.03, s * 0.1, s * 0.06, s * 0.02, '#d6ecb0', '#6a9a3a', s * 0.009); c.restore(); }
        for (const [x, y, r] of [[-0.14, -0.1, 0.2], [0.3, -0.1, -0.3], [-0.62, 0.04, 0.5]]) { c.save(); c.translate(rx * x, y0 + s * y); c.rotate(r); fillRR(c, -s * 0.06, -s * 0.03, s * 0.12, s * 0.06, s * 0.02, '#d99a8a', '#7a3a2a', s * 0.009); fillRR(c, -s * 0.05, -s * 0.02, s * 0.1, s * 0.02, s * 0.01, '#f2c6b8'); c.restore(); }
        c.strokeStyle = '#ff2a4a'; c.lineWidth = s * 0.012; c.lineCap = 'round'; for (const [x, y] of [[0.62, 0.05], [0.68, 0.02], [0.56, 0.08], [-0.02, -0.19]]) { c.beginPath(); c.moveTo(rx * x, y0 + s * y); c.lineTo(rx * x + s * 0.04, y0 + s * y - s * 0.02); c.stroke(); }
        c.strokeStyle = '#fff6d8'; c.lineWidth = s * 0.014; c.beginPath(); c.moveTo(-rx * 0.4, y0 - s * 0.05); for (let i = 1; i < 10; i++) c.lineTo(-rx * 0.4 + i * s * 0.05, y0 - s * (0.05 + (i % 2 ? 0.035 : -0.005))); c.stroke();
        c.fillStyle = '#2f6a22'; for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(rx * (-0.6 + (i * 43 % 100) / 100 * 1.2), y0 - s * (0.02 + (i * 59 % 100) / 100 * 0.15), s * 0.007, 0, TAU); c.fill(); }
      },
    });
  },
  buldakFireBowl(ctx, s, o = {}) {
    // flames licking up behind a black bowl of glossy red noodles
    // (kept below the brand logo: tips end around y = -0.22 s)
    for (const [x, y, w, h, r, k] of [[-0.33, 0.06, 0.15, 0.19, -0.25, 0], [-0.19, 0.05, 0.2, 0.24, -0.08, 1], [-0.02, 0.05, 0.22, 0.26, 0.0, 0], [0.16, 0.05, 0.2, 0.24, 0.08, 1], [0.32, 0.06, 0.15, 0.18, 0.26, 0]]) flame(ctx, s * x, s * y, s * w, s * h, r, k ? '#ff7a1a' : '#ff4a12');
    bowlScene(ctx, s, {
      bowl: o.bowl || '#1c1c1c', rim: o.rim || '#ff2a2a', soup: '#b81810', pattern: 'band', edge: '#000000',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        nest(c, s, 0, y0 - ry * 0.05, rx * 0.84, s * 0.17, { seed: 91, noodle: '#ff6a2a', edge: '#6a0e06', n: 16 });
        c.fillStyle = '#fff3d0'; for (let i = 0; i < 16; i++) { c.beginPath(); c.ellipse(rx * (-0.55 + (i * 47 % 100) / 100 * 1.1), y0 - s * (0.0 + (i * 31 % 100) / 100 * 0.12), s * 0.011, s * 0.006, i, 0, TAU); c.fill(); }
        c.fillStyle = '#12301c'; for (const [x, y, r] of [[-0.2, -0.1, 0.3], [0.2, -0.07, -0.4], [0.02, -0.14, 0.9]]) { c.save(); c.translate(rx * x, y0 + s * y); c.rotate(r); c.fillRect(-s * 0.05, -s * 0.008, s * 0.1, s * 0.016); c.restore(); }
        chiliSlice(c, -rx * 0.42, y0 - s * 0.04, s * 0.03, 0.2); chiliSlice(c, rx * 0.44, y0 - s * 0.06, s * 0.028, -0.5); chiliSlice(c, rx * 0.06, y0 - s * 0.02, s * 0.025, 0.7);
      },
    });
  },
  buldakCarbonaraBowl(ctx, s, o = {}) {
    bowlScene(ctx, s, {
      bowl: o.bowl || '#1c1c1c', rim: o.rim || '#f7d774', soup: '#eadca8', pattern: 'band', edge: '#000000',
      contents(c, G) {
        const { rx, ry, y0 } = G;
        nest(c, s, 0, y0 - ry * 0.05, rx * 0.84, s * 0.17, { seed: 101, noodle: '#fbeab8', edge: '#a8853a', n: 16 });
        // cheese curls + bacon + parsley + pepper
        c.strokeStyle = '#fff2c4'; c.lineWidth = s * 0.012; c.lineCap = 'round'; for (let i = 0; i < 12; i++) { const x = rx * (-0.5 + (i * 53 % 100) / 100), y = y0 - s * (0.03 + (i * 37 % 100) / 100 * 0.11); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 0.02, y - s * 0.03, x + s * 0.045, y - s * 0.005); c.stroke(); }
        for (const [x, y, r] of [[-0.3, -0.05, 0.3], [0.32, -0.04, -0.4], [-0.5, 0.0, 0.8], [0.12, -0.13, 0.1], [-0.1, -0.12, -0.5]]) { c.save(); c.translate(rx * x, y0 + s * y); c.rotate(r); fillRR(c, -s * 0.032, -s * 0.014, s * 0.064, s * 0.028, s * 0.008, '#c96a5a', '#6a2a20', s * 0.006); c.restore(); }
        c.fillStyle = '#3f9a3a'; for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(rx * (-0.6 + (i * 61 % 100) / 100 * 1.2), y0 - s * (0.0 + (i * 23 % 100) / 100 * 0.14), s * 0.009, s * 0.005, i, 0, TAU); c.fill(); }
        c.fillStyle = '#222'; for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(rx * (-0.55 + (i * 71 % 100) / 100 * 1.1), y0 - s * (0.0 + (i * 41 % 100) / 100 * 0.14), s * 0.005, 0, TAU); c.fill(); }
        circle(c, rx * 0.02, y0 - s * 0.12, s * 0.05, '#ffae12', '#b56a08', s * 0.009); glint(c, -rx * 0.04, y0 - s * 0.14, s * 0.014, s * 0.008, -0.5, 0.8);
      },
    });
  },

  // ---------------------------------------------------------------- pantry icons (bottle labels: s is only ~3.7 cm, so keep shapes bold)
  anchovyDrop(ctx, s) { // Tiparos: anchovy + a drop of fish sauce
    fishShape(ctx, -s * 0.04, -s * 0.12, s * 0.74, -0.32);
    drop(ctx, s * 0.24, s * 0.22, s * 0.13, linGrad(ctx, 0, s * 0.05, 0, s * 0.4, [[0, '#e0983a'], [1, '#8a4210']]), '#4a2008', s * 0.026);
    glint(ctx, s * 0.2, s * 0.2, s * 0.028, s * 0.055, 0.35, 0.65);
  },
  chilliFan(ctx, s) { // Sriraja Panich: fan of red chillies and a garlic bulb
    chiliPod(ctx, -s * 0.4, s * 0.26, s * 0.74, -0.95, '#d6221a');
    chiliPod(ctx, -s * 0.4, s * 0.28, s * 0.72, -0.55, '#ea3a2a');
    chiliPod(ctx, -s * 0.4, s * 0.3, s * 0.66, -0.12, '#c41c14');
    garlicBulb(ctx, s * 0.3, s * 0.22, s * 0.11, 0.2);
  },
  chilliPasteBowl(ctx, s) { // Mae Pranom: bowl of dark chilli paste with dried chillies, garlic and shallot
    chiliPod(ctx, -s * 0.42, s * 0.02, s * 0.6, -0.5, '#8f1a10'); chiliPod(ctx, s * 0.42, s * 0.02, s * 0.56, -2.65, '#a52014');
    bowlScene(ctx, s * 0.92, {
      bowl: '#efe1c2', rim: '#a3231a', soup: '#5a160c', pattern: 'band', edge: '#3a1a0a',
      contents(c, G) {
        const { rx, ry, y0 } = G, S = s * 0.92;
        c.beginPath(); c.moveTo(-rx * 0.82, y0 + ry * 0.1); c.bezierCurveTo(-rx * 0.5, y0 - S * 0.22, rx * 0.5, y0 - S * 0.22, rx * 0.82, y0 + ry * 0.1); c.closePath();
        c.fillStyle = radGrad(c, -rx * 0.2, y0 - S * 0.12, 0, rx, [[0, '#b23a1a'], [0.6, '#7a1c0e'], [1, '#4a0e06']]); c.fill(); ln(c, S * 0.016, '#2a0804'); c.stroke();
        c.fillStyle = 'rgba(255,150,40,.55)'; for (const [x, y, w] of [[-0.3, -0.06, 0.06], [0.05, -0.1, 0.07], [0.36, -0.04, 0.05], [-0.05, -0.02, 0.04]]) { c.beginPath(); c.ellipse(rx * x, y0 + S * y, S * w, S * w * 0.35, -0.2, 0, TAU); c.fill(); }
        c.fillStyle = '#d8442a'; for (let i = 0; i < 12; i++) { c.beginPath(); c.ellipse(rx * (-0.6 + (i * 37 % 100) / 100 * 1.2), y0 - S * (0.02 + (i * 53 % 100) / 100 * 0.09), S * 0.012, S * 0.006, i, 0, TAU); c.fill(); }
        garlicBulb(c, -rx * 0.6, y0 - S * 0.04, S * 0.06, -0.3); garlicBulb(c, rx * 0.62, y0 - S * 0.03, S * 0.055, 0.3);
      },
    });
  },
  chickenDipDish(ctx, s) { // Mae Ploy: golden drumstick, red chilli and a swirl of sweet chilli sauce
    ctx.save(); ctx.strokeStyle = '#d61f1a'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.32, s * 0.3); ctx.bezierCurveTo(-s * 0.1, s * 0.4, s * 0.1, s * 0.2, s * 0.34, s * 0.32); ctx.stroke();
    ctx.strokeStyle = '#ff5a3a'; ctx.lineWidth = s * 0.014; ctx.beginPath(); ctx.moveTo(-s * 0.28, s * 0.27); ctx.bezierCurveTo(-s * 0.1, s * 0.36, s * 0.1, s * 0.17, s * 0.3, s * 0.28); ctx.stroke();
    ctx.restore();
    drumstick(ctx, -s * 0.04, -s * 0.06, s * 0.78, -0.42);
    chiliPod(ctx, s * 0.02, s * 0.22, s * 0.4, -0.3, '#e0261c');
  },
  oysterOpen(ctx, s) { // Mae Krua: open oyster with a pearl
    blobPath(ctx, -s * 0.08, -s * 0.13, s * 0.34, s * 0.2, 0.07, 3, -0.45);
    ctx.fillStyle = radGrad(ctx, -s * 0.15, -s * 0.2, 0, s * 0.4, [[0, '#b9ad98'], [1, '#6f6452']]); ctx.fill(); ln(ctx, s * 0.022, '#3a3126'); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = s * 0.01; for (const k of [0.8, 0.6, 0.4]) { ctx.beginPath(); ctx.ellipse(-s * 0.08, -s * 0.13, s * 0.34 * k, s * 0.2 * k, -0.45, 3.4, 5.6); ctx.stroke(); }
    blobPath(ctx, 0, s * 0.12, s * 0.44, s * 0.25, 0.06, 5, 0.04);
    ctx.fillStyle = radGrad(ctx, -s * 0.1, s * 0.05, 0, s * 0.5, [[0, '#a99d88'], [1, '#6a5f4c']]); ctx.fill(); ln(ctx, s * 0.026, '#3a3126'); ctx.stroke();
    blobPath(ctx, 0, s * 0.125, s * 0.36, s * 0.19, 0.04, 7, 0.04);
    ctx.fillStyle = linGrad(ctx, 0, s * 0.0, 0, s * 0.3, [[0, '#fbf8f2'], [0.5, '#dfe6ee'], [1, '#e9dcd0']]); ctx.fill(); ln(ctx, s * 0.01, '#9a9a94'); ctx.stroke();
    blobPath(ctx, s * 0.01, s * 0.135, s * 0.27, s * 0.12, 0.11, 9, 0.04);
    ctx.fillStyle = radGrad(ctx, -s * 0.06, s * 0.09, 0, s * 0.3, [[0, '#fbf1da'], [1, '#e0cc9c']]); ctx.fill(); ln(ctx, s * 0.014, '#8f7a4c'); ctx.stroke();
    ctx.strokeStyle = '#8f7a4c'; ctx.lineWidth = s * 0.008; ctx.beginPath(); ctx.ellipse(s * 0.01, s * 0.14, s * 0.2, s * 0.075, 0.04, 0.2, 5.6); ctx.stroke();
    circle(ctx, s * 0.14, s * 0.09, s * 0.055, radGrad(ctx, s * 0.125, s * 0.075, 0, s * 0.07, [[0, '#ffffff'], [1, '#c9d2dc']]), '#7a8794', s * 0.01);
    glint(ctx, s * 0.125, s * 0.072, s * 0.016, s * 0.009, -0.5, 0.95);
  },
  soyPods(ctx, s) { // Healthy Boy: pods + beans
    soyPod(ctx, -s * 0.02, -s * 0.13, s * 0.76, -0.28);
    soyPod(ctx, s * 0.06, s * 0.03, s * 0.66, 0.2);
    for (const [x, y, r, rot] of [[-0.26, 0.24, 0.07, 0.3], [-0.12, 0.3, 0.065, -0.4], [0.05, 0.27, 0.07, 0.8], [0.22, 0.3, 0.06, -0.2], [0.34, 0.2, 0.06, 0.5]]) bean(ctx, s * x, s * y, s * r, rot);
  },
  bouillonCubes(ctx, s) { // Knorr: wrapped stock cubes and a crumbled one
    const cube = (x, y, a, top, left, right, edge) => {
      poly(ctx, [[x, y - 1.15 * a], [x + 0.9 * a, y - 0.65 * a], [x, y - 0.15 * a], [x - 0.9 * a, y - 0.65 * a]], top, edge, a * 0.05);
      poly(ctx, [[x - 0.9 * a, y - 0.65 * a], [x, y - 0.15 * a], [x, y + 0.95 * a], [x - 0.9 * a, y + 0.45 * a]], left, edge, a * 0.05);
      poly(ctx, [[x, y - 0.15 * a], [x + 0.9 * a, y - 0.65 * a], [x + 0.9 * a, y + 0.45 * a], [x, y + 0.95 * a]], right, edge, a * 0.05);
      ctx.strokeStyle = 'rgba(200,30,20,.85)'; ctx.lineWidth = a * 0.12; ctx.beginPath(); ctx.moveTo(x - 0.9 * a, y - 0.05 * a); ctx.lineTo(x, y + 0.45 * a); ctx.lineTo(x + 0.9 * a, y - 0.05 * a); ctx.stroke();
    };
    const a = s * 0.21;
    cube(-s * 0.2, s * 0.18, a, '#ffe08a', '#f0b232', '#d6921c', '#5a3a08');
    cube(s * 0.18, s * 0.2, a, '#ffe08a', '#f0b232', '#d6921c', '#5a3a08');
    cube(-s * 0.01, -s * 0.09, a, '#ffe08a', '#f0b232', '#d6921c', '#5a3a08');
    ctx.fillStyle = '#e9d6a6'; for (const [x, y, r] of [[0.36, 0.33, 0.3], [0.4, 0.3, -0.4], [-0.4, 0.34, 0.2], [0.3, 0.36, 0.9]]) { ctx.save(); ctx.translate(s * x, s * y); ctx.rotate(r); ctx.fillRect(-s * 0.014, -s * 0.011, s * 0.028, s * 0.022); ctx.restore(); }
  },
  tunaSteakFish(ctx, s) { // Sealect: torpedo-shaped tuna and a drop of oil
    fishShape(ctx, -s * 0.03, -s * 0.03, s * 0.8, -0.1, { back: '#1d3f66', mid: '#4d7fa8', belly: '#dfe9f0' });
    drop(ctx, s * 0.33, s * 0.2, s * 0.09, linGrad(ctx, 0, s * 0.05, 0, s * 0.35, [[0, '#ffd85a'], [1, '#c9840a']]), '#6a3a06', s * 0.02);
    glint(ctx, s * 0.31, s * 0.19, s * 0.014, s * 0.03, 0.35, 0.7);
  },
  mackerelTomato(ctx, s) { // Roza: mackerel in tomato sauce
    fishShape(ctx, -s * 0.06, -s * 0.06, s * 0.8, -0.18, { back: '#1f4a72', mid: '#4f86b0', belly: '#e6eef2' });
    ctx.save(); ctx.strokeStyle = 'rgba(10,30,60,.55)'; ctx.lineWidth = s * 0.014; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const x = -s * 0.3 + i * s * 0.085; ctx.beginPath(); ctx.moveTo(x, -s * 0.16 + i * s * 0.014); ctx.quadraticCurveTo(x + s * 0.02, -s * 0.11 + i * s * 0.012, x + s * 0.012, -s * 0.07 + i * s * 0.01); ctx.stroke(); }
    ctx.restore();
    tomato(ctx, s * 0.27, s * 0.24, s * 0.17);
    ellipse(ctx, -s * 0.16, s * 0.3, s * 0.11, s * 0.075, '#e63a2a', '#7a1208', s * 0.02, -0.2); ellipse(ctx, -s * 0.16, s * 0.3, s * 0.07, s * 0.045, '#ff8a6a', null, 1, -0.2);
  },
  jasmineRiceHeap(ctx, s) { // jasmine rice: heap of grains, golden ear, jasmine flowers
    // golden ear on a curved stalk (kept below y = -0.2 s so it never touches the brand line under the logo)
    const P = [[-0.34, 0.3], [-0.3, -0.02], [-0.2, -0.16], [0.14, -0.14]];
    const bz = (t) => { const u = 1 - t; return [0, 1].map((k) => s * (u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k])); };
    ctx.save(); ctx.strokeStyle = '#a58a2a'; ctx.lineWidth = s * 0.02; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s * P[0][0], s * P[0][1]); ctx.bezierCurveTo(s * P[1][0], s * P[1][1], s * P[2][0], s * P[2][1], s * P[3][0], s * P[3][1]); ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const [x, y] = bz(0.55 + i * 0.05);
      ellipse(ctx, x, y + (i % 2 ? s * 0.028 : -s * 0.018), s * 0.03, s * 0.016, '#e6bf55', '#8a6a14', s * 0.006, 0.9 + (i % 2) * 0.6);
    }
    ctx.restore();
    grainPile(ctx, s, 0, s * 0.3, s * 0.42, s * 0.3, '#f7f1de', '#8a7a52', 4);
    for (const [x, y, r] of [[0.3, 0.02, 0.08], [0.4, 0.17, 0.06]]) {
      leaf2(ctx, s * (x - 0.08), s * (y + 0.03), s * 0.14, s * 0.045, 2.6, '#3a8a3a'); leaf2(ctx, s * (x + 0.02), s * (y + 0.03), s * 0.13, s * 0.04, 0.6, '#2f7a2f');
      for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(s * x, s * y); ctx.rotate((k * TAU) / 5); ellipse(ctx, 0, -s * r * 0.75, s * r * 0.4, s * r * 0.62, '#fffdf6', '#b8b090', s * 0.006); ctx.restore(); }
      circle(ctx, s * x, s * y, s * r * 0.3, '#f2c94c', '#a8801a', s * 0.005);
    }
  },
  henEggsThree(ctx, s) { // eggs
    eggShape(ctx, -s * 0.27, s * 0.05, s * 0.5, -0.28, '#e6bb80');
    eggShape(ctx, s * 0.29, s * 0.06, s * 0.5, 0.3, '#e0b070');
    eggShape(ctx, 0, 0, s * 0.58, 0.02, '#fdf3e0');
  },
  cookingOilDrop(ctx, s) { // Angoon: golden drop and soy pods
    soyPod(ctx, -s * 0.26, s * 0.24, s * 0.46, -0.9);
    soyPod(ctx, s * 0.3, s * 0.26, s * 0.42, 0.95);
    drop(ctx, 0, s * 0.08, s * 0.27, linGrad(ctx, -s * 0.2, -s * 0.3, s * 0.2, s * 0.35, [[0, '#ffe98a'], [0.5, '#f5b81a'], [1, '#c9840a']]), '#7a4a06', s * 0.028);
    glint(ctx, -s * 0.09, s * 0.04, s * 0.04, s * 0.12, 0.35, 0.6);
    for (const [x, y, r, rot] of [[-0.06, 0.36, 0.05, 0.3], [0.09, 0.37, 0.05, -0.3]]) bean(ctx, s * x, s * y, s * r, rot);
  },
  sugarCanePile(ctx, s) { // Mitr Phol: sugar cane either side, heap of crystals, cubes
    for (const [x, rot, flip] of [[-0.3, -0.28, 1], [0.34, 0.3, -1]]) {
      ctx.save(); ctx.translate(s * x, s * 0.26); ctx.rotate(rot); const w = s * 0.06, L = s * 0.42;
      fillRR(ctx, -w / 2, -L, w, L, w * 0.3, linGrad(ctx, -w / 2, 0, w / 2, 0, [[0, '#b7d86a'], [0.5, '#7fb043'], [1, '#4c8a2a']]), '#2a5a14', s * 0.014);
      ctx.strokeStyle = '#3a6a1a'; ctx.lineWidth = s * 0.014; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-w / 2, -k * L / 4); ctx.lineTo(w / 2, -k * L / 4); ctx.stroke(); }
      leaf2(ctx, 0, -L, s * 0.2, s * 0.04, -0.7 * flip - (flip < 0 ? 1.2 : 0), '#4da03a'); leaf2(ctx, 0, -L, s * 0.18, s * 0.038, -1.6 * flip - (flip < 0 ? 0.6 : 0), '#3a8a2e');
      ctx.restore();
    }
    grainPile(ctx, s, s * 0.02, s * 0.32, s * 0.4, s * 0.25, '#fbfbf4', '#8a8a78', 6);
    for (const [x, y, r] of [[0.18, 0.3, 0.2], [0.28, 0.24, -0.15]]) { ctx.save(); ctx.translate(s * x, s * y); ctx.rotate(r); fillRR(ctx, -s * 0.05, -s * 0.05, s * 0.1, s * 0.1, s * 0.012, '#ffffff', '#8a8a78', s * 0.012); fillRR(ctx, -s * 0.04, -s * 0.04, s * 0.05, s * 0.05, s * 0.008, '#e9eef2'); ctx.restore(); }
    sparkle(ctx, s * 0.0, s * 0.02, s * 0.06); sparkle(ctx, s * 0.14, -s * 0.08, s * 0.045); sparkle(ctx, -s * 0.16, -s * 0.02, s * 0.035);
  },
  saltShakerHeap(ctx, s) { // Prungthip: glass shaker, salt crystals
    grainPile(ctx, s, s * 0.05, s * 0.38, s * 0.4, s * 0.16, '#f4f7fa', '#7a8794', 8);
    ctx.save(); ctx.translate(-s * 0.02, s * 0.1); ctx.scale(0.92, 0.92);
    ctx.beginPath(); ctx.moveTo(-s * 0.17, -s * 0.2); ctx.lineTo(s * 0.17, -s * 0.2); ctx.quadraticCurveTo(s * 0.24, s * 0.05, s * 0.2, s * 0.3); ctx.lineTo(-s * 0.2, s * 0.3); ctx.quadraticCurveTo(-s * 0.24, s * 0.05, -s * 0.17, -s * 0.2); ctx.closePath();
    ctx.fillStyle = 'rgba(200,225,245,.75)'; ctx.fill(); ln(ctx, s * 0.022, '#3a5a78'); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#ffffff'; ctx.fillRect(-s * 0.3, -s * 0.05, s * 0.6, s * 0.4); ctx.restore();
    ctx.strokeStyle = 'rgba(122,135,148,.5)'; ctx.lineWidth = s * 0.008; ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.05); ctx.quadraticCurveTo(0, -s * 0.09, s * 0.22, -s * 0.05); ctx.stroke();
    fillRR(ctx, -s * 0.19, -s * 0.31, s * 0.38, s * 0.12, s * 0.03, linGrad(ctx, 0, -s * 0.31, 0, -s * 0.19, [[0, '#f0f2f4'], [1, '#9aa3ab']]), '#4a545c', s * 0.02);
    ctx.fillStyle = '#4a545c'; for (const x of [-0.09, 0, 0.09]) { ctx.beginPath(); ctx.arc(s * x, -s * 0.25, s * 0.014, 0, TAU); ctx.fill(); }
    glint(ctx, -s * 0.12, s * 0.08, s * 0.025, s * 0.13, 0.05, 0.5);
    ctx.restore();
    sparkle(ctx, s * 0.27, -s * 0.16, s * 0.05); sparkle(ctx, -s * 0.3, -s * 0.06, s * 0.035); sparkle(ctx, s * 0.32, s * 0.08, s * 0.03);
  },
};

// ---------------------------------------------------------------------------------------- instant noodle packs
const NOODLE = [
  {
    id: 'mama-tomyum-kung', cat: 'noodle', brand: 'mama', name: T('Tom Yum Shrimp', 'ต้มยำกุ้ง'), sub: T('Instant noodles', 'บะหมี่กึ่งสำเร็จรูป'),
    price: 7, size: g(55), pop: 3, promo: T('3 packs ฿20', '3 ซอง 20 บาท'),
    pal: ['#e8352a', '#a51610', '#ffd54a', '#ffffff'], bg: 'dots', hero: 'tomyumNoodleBowl', heroOpts: { bowl: '#f7f2e6', rim: '#e8352a' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'tomyum', 'msg', 'chili', 'lemongrass', 'kaffir'], allergens: ['wheat', 'shrimp', 'soy'], nut: [250, 2, 10, 1580],
    desc: T("Thailand's everyday instant noodle in hot-and-sour tom yum. Locals upgrade a sachet with a cracked egg, spring onion and a squeeze of lime.",
      'บะหมี่กึ่งสำเร็จรูปรสต้มยำกุ้ง เปรี้ยว เผ็ด หอมสมุนไพร คนไทยนิยมตอกไข่ ใส่ต้นหอม แล้วบีบมะนาวเพิ่มความจัดจ้าน'),
  },
  {
    id: 'mama-creamy-tomyum', cat: 'noodle', brand: 'mama', name: T('Creamy Tom Yum Shrimp', 'ต้มยำกุ้งน้ำข้น'), sub: T('Instant noodles', 'บะหมี่กึ่งสำเร็จรูป'),
    price: 8, size: g(55), pop: 2,
    pal: ['#f7731e', '#b73a08', '#fff0b8', '#ffffff'], bg: 'waves', hero: 'creamyTomyumBowl', heroOpts: { rim: '#f7731e' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'tomyum', 'creamer', 'msg', 'chili', 'lemongrass'], allergens: ['wheat', 'shrimp', 'milk', 'soy'], nut: [260, 3, 11, 1450],
    desc: T("Same tom yum kick, but in a thick, creamy 'nam khon' broth. Thais like to add a soft-boiled egg and a handful of coriander.",
      'รสต้มยำกุ้งแบบน้ำข้น เข้มข้น กลมกล่อม ยังเผ็ดจี๊ดเหมือนเดิม นิยมใส่ไข่ต้มยางมะตูมกับผักชีเพิ่ม'),
  },
  {
    id: 'mama-minced-pork', cat: 'noodle', brand: 'mama', name: T('Minced Pork', 'หมูสับ'), sub: T('Instant noodles', 'บะหมี่กึ่งสำเร็จรูป'),
    price: 7, size: g(55), pop: 2,
    pal: ['#f9b612', '#d47a00', '#e8352a', '#ffffff'], bg: 'rays', hero: 'porkNoodleBowl', heroOpts: { rim: '#e8352a' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'pork', 'garlic', 'pepper', 'msg'], allergens: ['wheat', 'soy'], nut: [250, 2, 10, 1500],
    desc: T('The gentle classic: a savoury pork broth without the tom yum heat. Thais add fried garlic, spring onion and a spoonful of chilli in vinegar.',
      'รสหมูสับซดน้ำซุปหอมกลมกล่อม ไม่เผ็ดจัด ใส่กระเทียมเจียว ต้นหอม และพริกน้ำส้มได้ตามใจชอบ'),
  },
  {
    id: 'mama-yentafo', cat: 'noodle', brand: 'mama', name: T('Yentafo Tom Yum Hotpot', 'เย็นตาโฟต้มยำหม้อไฟ'), sub: T('Instant noodles', 'บะหมี่กึ่งสำเร็จรูป'),
    price: 10, size: g(60),
    pal: ['#d63a6a', '#8f1b45', '#ffe28a', '#ffffff'], bg: 'dots', hero: 'yentafoNoodleBowl', heroOpts: {},
    ing: ['wheat', 'palm', 'salt', 'sugar', 'tomyum', 'msg', 'chili', 'garlic'], allergens: ['wheat', 'soy', 'fish', 'shrimp'], nut: [270, 4, 11, 1600],
    desc: T('Pink Thai-Chinese noodle soup, coloured by fermented red bean curd, here with a tom yum hotpot twist. Real bowls come with fish balls, squid and morning glory.',
      'เย็นตาโฟเป็นก๋วยเตี๋ยวน้ำซุปสีชมพูสไตล์ไทยจีน ได้สีจากเต้าหู้ยี้ รสนี้เพิ่มความจัดจ้านแบบต้มยำหม้อไฟ ต้นตำรับใส่ลูกชิ้นปลา หมึก และผักบุ้ง'),
  },
  {
    id: 'mama-pad-kee-mao', cat: 'noodle', brand: 'mama', name: T('Pad Kee Mao (Dry)', 'ผัดขี้เมาแห้ง'), sub: T('Instant noodles', 'บะหมี่กึ่งสำเร็จรูป'),
    price: 10, size: g(60),
    pal: ['#2e8b3a', '#14481b', '#ffd54a', '#ffffff'], bg: 'zig', hero: 'padKeeMaoPlate', heroOpts: { rim: '#2e8b3a' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'soysauce', 'chili', 'garlic', 'basil', 'msg'], allergens: ['wheat', 'soy', 'shrimp'], nut: [290, 4, 12, 1300],
    desc: T("'Drunken noodles' in a sachet: no soup, just wok-fried flavour with chilli, garlic and holy basil. Top with a fried egg for the full street-food effect.",
      'ผัดขี้เมาแบบแห้ง ไม่มีน้ำซุป หอมกลิ่นกะเพรา พริก และกระเทียมแบบผัดกระทะ ใส่ไข่ดาวด้านบนอร่อยยิ่งขึ้น'),
  },
  {
    id: 'mama-bigpack-tomyum', cat: 'noodle', brand: 'mama', name: T('Big Pack+ Tom Yum Shrimp', 'บิ๊กแพคพลัส ต้มยำกุ้ง'), sub: T('Jumbo instant noodles', 'บะหมี่กึ่งสำเร็จรูป ซองใหญ่'),
    price: 10, size: g(95),
    pal: ['#d91f26', '#8c0c12', '#ffd54a', '#ffffff'], bg: 'burst', hero: 'tomyumNoodleBowl', heroOpts: { variant: 1, rim: '#ffd54a', pattern: 'band' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'tomyum', 'msg', 'chili', 'lemongrass', 'kaffir'], allergens: ['wheat', 'shrimp', 'soy'], nut: [430, 3, 17, 2300],
    desc: T("The jumbo 95 g sachet: about 70% more noodles than the regular pack, in the same red tom yum flavour. For when one regular sachet won't do.",
      'ซองใหญ่ 95 กรัม เส้นเยอะกว่าซองปกติราว 70% ในรสต้มยำกุ้งที่คุ้นเคย เหมาะกับคนหิวจัด'),
  },
  {
    id: 'waiwai-tomyum', cat: 'noodle', brand: 'waiwai', name: T('Tom Yum Shrimp', 'ต้มยำกุ้ง'), sub: T('Instant noodles', 'บะหมี่กึ่งสำเร็จรูป'),
    price: 7, size: g(60), pop: 2,
    pal: ['#f58220', '#b84d00', '#fff4b0', '#ffffff'], bg: 'stripes', hero: 'tomyumNoodleBowl', heroOpts: { variant: 2, rim: '#2e8b3a', pattern: 'dots', soup: '#e2601e' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'tomyum', 'msg', 'chili', 'lemongrass'], allergens: ['wheat', 'shrimp', 'soy'], nut: [270, 2, 12, 1500],
    desc: T("Wai Wai's thin, crinkly noodles are famous for a second life as a snack: crush the block, sprinkle on the seasoning, shake and crunch.",
      'เส้นเล็กหยิกของไวไวขึ้นชื่อเรื่องกินเล่นแบบแห้ง ๆ ทุบเส้นให้แตก โรยผงปรุงรส เขย่าแล้วกรุบกรอบเพลินได้เลย'),
  },
  {
    id: 'waiwai-pork-tomyum', cat: 'noodle', brand: 'waiwai', name: T('Minced Pork Tom Yum', 'หมูสับต้มยำ'), sub: T('Instant noodles', 'บะหมี่กึ่งสำเร็จรูป'),
    price: 7, size: g(60), promo: T('4 packs ฿25', '4 ซอง 25 บาท'),
    pal: ['#ffc21a', '#e08a00', '#e8352a', '#ffffff'], bg: 'waves', hero: 'porkNoodleBowl', heroOpts: { variant: 1, rim: '#2e8b3a', pattern: 'band', soup: '#e8a23c' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'pork', 'tomyum', 'msg', 'chili'], allergens: ['wheat', 'soy'], nut: [270, 2, 12, 1450],
    desc: T('Minced-pork noodles in a tom yum-style broth: sour, herby and a little spicy.',
      'รสหมูสับต้มยำ น้ำซุปเปรี้ยวเผ็ดหอมสมุนไพร ได้ทั้งความอร่อยของหมูสับและความจัดจ้านแบบต้มยำ'),
  },
  {
    id: 'yumyum-jumbo-tomyum', cat: 'noodle', brand: 'yumyum', name: T('Jumbo Tom Yum Shrimp', 'จัมโบ้ ต้มยำกุ้ง'), sub: T('Instant noodles', 'บะหมี่กึ่งสำเร็จรูป'),
    price: 8, size: g(63),
    pal: ['#c8102e', '#8a0a20', '#ffe14a', '#ffffff'], bg: 'burst', hero: 'tomyumNoodleBowl', heroOpts: { variant: 3, rim: '#ffe14a', pattern: 'lotus' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'tomyum', 'msg', 'chili', 'lemongrass'], allergens: ['wheat', 'shrimp', 'soy'], nut: [290, 3, 12, 1650],
    desc: T("Yum Yum's jumbo sachet: a bigger block of noodles in a sharp, herby tom yum broth. Cracking an egg into the pot is the classic upgrade.",
      'ยำยำจัมโบ้ เส้นก้อนใหญ่ น้ำซุปต้มยำกุ้งเปรี้ยวเผ็ดหอมสมุนไพร ตอกไข่ลงไปเพิ่มความอร่อยแบบที่คนไทยชอบ'),
  },
  {
    id: 'buldak-hot-chicken', cat: 'noodle', brand: 'samyang', name: T('Buldak Hot Chicken Ramen', 'บูลดัก ฮอตชิคเก้น ราเมง'), sub: T('Stir-fried instant noodles', 'บะหมี่กึ่งสำเร็จรูปแบบแห้ง'),
    price: 45, size: g(140), origin: 'kr', pop: 2,
    pal: ['#161616', '#050505', '#ff2a2a', '#ffd400'], bg: 'rays', hero: 'buldakFireBowl', heroOpts: {},
    ing: ['wheat', 'palm', 'salt', 'sugar', 'chili', 'chicken', 'soysauce', 'garlic', 'sesame', 'msg'], allergens: ['wheat', 'soy', 'milk', 'sesame'], nut: [530, 8, 13, 1240],
    desc: T("Samyang's famous 'fire noodles' in a searing Korean chilli-chicken sauce, made viral by online spice challenges. A slice of cheese or a splash of milk tames the heat.",
      'ราเมงผัดซอสไก่เผ็ดสุดร้อนแรงจากซัมยัง ที่โด่งดังจากชาเลนจ์กินเผ็ดทั่วโลก ใส่ชีสหรือนมช่วยดับความเผ็ดได้'),
  },
  {
    id: 'buldak-carbonara', cat: 'noodle', brand: 'samyang', name: T('Buldak Carbonara', 'บูลดัก คาร์โบนาร่า'), sub: T('Stir-fried instant noodles', 'บะหมี่กึ่งสำเร็จรูปแบบแห้ง'),
    price: 45, size: g(130), origin: 'kr', promo: T('2 packs ฿85', '2 ซอง 85 บาท'),
    pal: ['#1b1b22', '#08080c', '#f7d774', '#ffffff'], bg: 'dots', hero: 'buldakCarbonaraBowl', heroOpts: {},
    ing: ['wheat', 'palm', 'salt', 'sugar', 'cream', 'cheeseseason', 'chili', 'milkp', 'sesame', 'msg'], allergens: ['wheat', 'soy', 'milk', 'sesame'], nut: [540, 8, 16, 1150],
    desc: T('The creamy, cheesy cousin of Buldak: milder heat wrapped in a carbonara-style sauce. Many cooks add an egg yolk or crispy bacon on top.',
      'ราเมงผัดซอสคาร์โบนาร่าครีมชีสของบูลดัก เผ็ดน้อยกว่าสูตรต้นตำรับ นิยมใส่ไข่แดงหรือเบคอนกรอบเพิ่ม'),
  },
  {
    id: 'shin-ramyun', cat: 'noodle', brand: 'nongshim', name: T('Shin Ramyun', 'ชินราเมียน'), sub: T('Spicy noodle soup', 'บะหมี่กึ่งสำเร็จรูปรสเผ็ด'),
    price: 35, size: g(120), origin: 'kr',
    pal: ['#d0101f', '#8a0812', '#ffffff', '#111111'], bg: 'rays', hero: 'shinRamyunBowl', heroOpts: {},
    ing: ['wheat', 'palm', 'salt', 'sugar', 'beefext', 'chili', 'garlic', 'driedveg', 'soysauce', 'msg'], allergens: ['wheat', 'soy', 'milk'], nut: [500, 3, 16, 1790],
    desc: T("Nongshim's flagship spicy ramyun, first sold in 1986, with a deep beef-and-chilli broth and chewy noodles. Add an egg and spring onion, Korean-style.",
      'ราเมียนเผ็ดสุดคลาสสิกของนงชิม วางขายครั้งแรกปี ค.ศ. 1986 น้ำซุปเนื้อเข้มข้นเผ็ดร้อน ใส่ไข่และต้นหอมเพิ่มได้ตามสไตล์เกาหลี'),
  },
  {
    id: 'indomie-migoreng', cat: 'noodle', brand: 'indomie', name: T('Mi Goreng Hot & Spicy', 'มีโกเร็ง รสเผ็ด'), sub: T('Indonesian fried noodles', 'บะหมี่ผัดสไตล์อินโดนีเซีย'),
    price: 13, size: g(80), origin: 'id', pop: 2,
    pal: ['#e11d2a', '#8f0d16', '#ffd23a', '#ffffff'], bg: 'stripes', hero: 'miGorengPlate', heroOpts: { rim: '#e11d2a' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'sweetsoy', 'shallot', 'chili', 'garlic', 'msg'], allergens: ['wheat', 'soy'], nut: [380, 6, 14, 1030],
    desc: T('Indonesia\'s beloved stir-fried instant noodles, tossed in sweet soy sauce, chilli and crispy fried shallot oil. Serve with a fried egg and cucumber like a warung.',
      'บะหมี่ผัดสไตล์อินโดนีเซีย คลุกซีอิ๊วหวาน พริก และหอมเจียวกรอบ กินกับไข่ดาวและแตงกวาแบบร้านข้างทางของอินโดนีเซีย'),
  },
  {
    id: 'nissin-yakisoba', cat: 'noodle', brand: 'nissin', name: T('Yakisoba Japanese Sauce', 'ยากิโซบะ รสซอสญี่ปุ่น'), sub: T('Instant fried noodles', 'บะหมี่กึ่งสำเร็จรูปแบบแห้ง'),
    price: 12, size: g(60),
    pal: ['#f0851a', '#9c4308', '#fff3c4', '#ffffff'], bg: 'rays', hero: 'yakisobaPlate', heroOpts: {},
    ing: ['wheat', 'palm', 'salt', 'sugar', 'soysauce', 'vinegar', 'onion', 'garlic', 'msg'], allergens: ['wheat', 'soy'], nut: [290, 8, 12, 1250],
    desc: T('Japanese-style fried noodles: drain the water, then toss with the sweet-savoury yakisoba sauce. Cabbage, pork and mayo make it feel like a festival stall.',
      'บะหมี่ผัดสไตล์ญี่ปุ่น เทน้ำออกแล้วคลุกซอสยากิโซบะรสหวานเค็ม ใส่กะหล่ำปลี หมู และมายองเนสให้เหมือนร้านในงานเทศกาล'),
  },
];

// ---------------------------------------------------------------------------------------- cup noodles
// pal = [label top, label bottom, bowl + name ribbon + cup rim, unused].
// The cup painter ignores sku.hero and always calls ILLUS.noodleBowl, so each cup below names its richer bowl in
// hero/heroOpts and gets `topping: '@<id>'`; the wrapper installed after this array looks that marker up.
const CUP = [
  {
    id: 'nissin-cup-creamy-seafood', cat: 'cupnoodle', brand: 'nissin', name: T('Creamy Seafood Soup', 'ซุปทะเลน้ำข้น'),
    price: 22, size: g(74), pop: 2, promo: T('2 cups ฿40', '2 ถ้วย 40 บาท'),
    pal: ['#1e9ad6', '#0b5f96', '#ffffff', '#ffffff'], bg: 'waves', soup: '#f0cf8a', hero: 'seafoodNoodleBowl', heroOpts: { rim: '#1e9ad6', soup: '#f0d9a0', pattern: 'band' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'shrimp', 'squid', 'creamer', 'msg', 'driedveg'], allergens: ['wheat', 'shrimp', 'squid', 'milk', 'soy'], nut: [340, 3, 14, 1400],
    desc: T("Nissin's cup in a thick, creamy seafood soup. Peel the lid back to the line, add boiling water, wait three minutes and eat: the cup does the cooking.",
      'นิสชินคัพนูดเดิลซุปทะเลน้ำข้น เปิดฝาถึงขีด เติมน้ำร้อน รอสามนาทีก็อร่อยพร้อมทาน'),
  },
  {
    id: 'nissin-cup-creamy-tomyum', cat: 'cupnoodle', brand: 'nissin', name: T('Creamy Tom Yum Shrimp', 'ต้มยำกุ้งน้ำข้น'),
    price: 22, size: g(77),
    pal: ['#e8451a', '#a3260a', '#fff4dc', '#ffffff'], bg: 'rays', soup: '#e2622a', hero: 'creamyTomyumBowl', heroOpts: { variant: 0, rim: '#e8451a', soup: '#ee7a34', pattern: 'band' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'tomyum', 'creamer', 'msg', 'chili', 'lemongrass'], allergens: ['wheat', 'shrimp', 'milk', 'soy'], nut: [350, 4, 15, 1450],
    desc: T('Creamy tom yum with a tangy lime-and-herb kick, ready in three minutes. Many 11 SEVEN branches have a hot-water tap, so you can eat it right at the window counter.',
      'ต้มยำกุ้งน้ำข้นเผ็ดเปรี้ยวหอมสมุนไพร พร้อมทานใน 3 นาที อีเลฟเว่น เซเว่น หลายสาขามีน้ำร้อนให้กด นั่งกินริมกระจกได้เลย'),
  },
  {
    id: 'mama-cup-creamy-tomyum', cat: 'cupnoodle', brand: 'mama', name: T('Creamy Tom Yum Shrimp', 'ต้มยำกุ้งน้ำข้น'),
    price: 14, size: g(60), pop: 2,
    pal: ['#e8352a', '#a51610', '#ffe27a', '#ffffff'], bg: 'dots', soup: '#ee8a3a', hero: 'creamyTomyumBowl', heroOpts: { variant: 1, bowl: '#f7f2e6', rim: '#e8352a', pattern: 'dots' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'tomyum', 'creamer', 'msg', 'chili', 'lemongrass'], allergens: ['wheat', 'shrimp', 'milk', 'soy'], nut: [270, 3, 11, 1300],
    desc: T("Mama's cup version of the creamy tom yum. Pour hot water to the line and it's ready in three minutes: the classic Thai late-night snack.",
      'มาม่าคัพรสต้มยำกุ้งน้ำข้น เทน้ำร้อนถึงขีดรอสามนาที ของกินยามดึกที่คนไทยคุ้นเคย'),
  },
  {
    id: 'mama-cup-pad-kee-mao', cat: 'cupnoodle', brand: 'mama', name: T('Seafood Pad Kee Mao (Dry)', 'ซีฟู้ดผัดขี้เมาแห้ง'),
    price: 15, size: g(63),
    pal: ['#2f8f3a', '#186022', '#f7f2d8', '#ffffff'], bg: 'zig', soup: '#7a3d14', hero: 'padKeeMaoPlate', heroOpts: { plate: '#f7f2e6', rim: '#2f8f3a' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'soysauce', 'chili', 'garlic', 'basil', 'msg'], allergens: ['wheat', 'soy', 'shrimp', 'fish'], nut: [290, 4, 12, 1250],
    desc: T('Dry, stir-fried-style noodles with seafood flavour, chilli and holy basil. Add hot water, drain, then stir in the sauce.',
      'บะหมี่แบบแห้งรสผัดขี้เมาซีฟู้ด หอมพริกและใบกะเพรา เติมน้ำร้อน เทน้ำออก แล้วคลุกเครื่องปรุงให้เข้ากัน'),
  },
  {
    id: 'mama-jok-cup', cat: 'cupnoodle', brand: 'mama', name: T('Pork Jok Cup', 'โจ๊กคัพ รสหมู'),
    price: 15, size: g(45), pop: 2,
    pal: ['#f2a83a', '#c46a0e', '#ffffff', '#ffffff'], bg: 'rays', soup: '#f6edd2', hero: 'jokPorridgeBowl', heroOpts: { bowl: '#f7f2e6', rim: '#e8862a', pattern: 'band' },
    ing: ['jasmine', 'pork', 'salt', 'sugar', 'msg', 'garlic', 'pepper', 'springonion'], allergens: ['soy'], nut: [190, 1, 3, 850],
    desc: T('Instant rice porridge (jok) made with jasmine rice: just add hot water. Thais stir in an egg, ginger and pepper for a proper breakfast bowl.',
      'โจ๊กกึ่งสำเร็จรูปจากข้าวหอมมะลิ เติมน้ำร้อนก็ได้ทาน คนไทยนิยมใส่ไข่ ขิง และพริกไทยเพิ่มเป็นมื้อเช้า'),
  },
  {
    id: 'waiwai-quick-cup', cat: 'cupnoodle', brand: 'waiwai', name: T('Quick Tom Yum Shrimp', 'ควิก ต้มยำกุ้ง'),
    price: 14, size: g(60),
    pal: ['#f7931e', '#c26200', '#fff2c2', '#ffffff'], bg: 'stripes', soup: '#e0561f', hero: 'tomyumNoodleBowl', heroOpts: { variant: 2, bowl: '#fdf6e3', rim: '#2e8b3a', pattern: 'dots' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'tomyum', 'msg', 'chili', 'lemongrass'], allergens: ['wheat', 'shrimp', 'soy'], nut: [280, 2, 12, 1400],
    desc: T("Wai Wai Quick: thin noodles that soften fast in a cup, in a sour, spicy tom yum broth.",
      'ไวไวควิกคัพ เส้นเล็กนุ่มไว น้ำซุปต้มยำกุ้งเปรี้ยวเผ็ดหอมสมุนไพร เติมน้ำร้อนแล้วทานได้เลย'),
  },
  {
    id: 'yumyum-cup', cat: 'cupnoodle', brand: 'yumyum', name: T('Tom Yum Shrimp', 'ต้มยำกุ้ง'),
    price: 15, size: g(60),
    pal: ['#d0102e', '#8f0a1e', '#ffffff', '#ffffff'], bg: 'burst', soup: '#e2431e', hero: 'tomyumNoodleBowl', heroOpts: { variant: 3, bowl: '#fdf6e3', rim: '#d0102e', pattern: 'lotus' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'tomyum', 'msg', 'chili', 'lemongrass'], allergens: ['wheat', 'shrimp', 'soy'], nut: [280, 3, 12, 1450],
    desc: T("Yum Yum's tom yum shrimp in a cup: sour, spicy and herb-scented, ready with a pour of boiling water.",
      'ยำยำคัพรสต้มยำกุ้ง เปรี้ยว เผ็ด หอมสมุนไพร เทน้ำร้อนแล้วทานได้ทันที'),
  },
  {
    id: 'buldak-cup-cheese', cat: 'cupnoodle', brand: 'samyang', name: T('Buldak Cheese Hot Chicken', 'บูลดัก ไก่ชีสเผ็ด'), g: 'cup-noodle-l',
    price: 49, size: g(105), origin: 'kr', pop: 2,
    pal: ['#1c1c1c', '#0a0a0a', '#ff3b2f', '#ffffff'], bg: 'rays', soup: '#c8201a', hero: 'buldakFireBowl', heroOpts: { bowl: '#1c1c1c', rim: '#ff2a2a' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'chili', 'chicken', 'cheeseseason', 'soysauce', 'garlic', 'msg'], allergens: ['wheat', 'soy', 'milk'], nut: [440, 6, 14, 1100],
    desc: T("Samyang's spicy chicken ramen with a cheese-powder twist, in a big bowl. Add hot water, drain, then stir in the sauce and cheese flakes.",
      'ราเมงไก่เผ็ดของซัมยังแบบชามใหญ่ เพิ่มผงชีสให้นุ่มละมุน เติมน้ำร้อน เทน้ำออก แล้วคลุกซอสกับชีส'),
  },
  {
    id: 'shin-ramyun-cup', cat: 'cupnoodle', brand: 'nongshim', name: T('Shin Ramyun Cup', 'ชินราเมียน ถ้วย'),
    price: 32, size: g(68), origin: 'kr',
    pal: ['#d3172a', '#8d0a14', '#2a2a2a', '#ffffff'], bg: 'rays', soup: '#c9301c', hero: 'shinRamyunBowl', heroOpts: { bowl: '#262626', rim: '#d0101f' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'beefext', 'chili', 'garlic', 'driedveg', 'soysauce', 'msg'], allergens: ['wheat', 'soy', 'milk'], nut: [310, 2, 11, 1160],
    desc: T('The famous Korean spicy beef noodle in a handy cup. Hot water to the line, wait, then stir in the flakes.',
      'ราเมียนเผ็ดรสเนื้อสุดฮิตของเกาหลีแบบถ้วย เติมน้ำร้อนถึงขีด รอให้เส้นนุ่ม แล้วคนให้เข้ากัน'),
  },
  {
    id: 'kokomi-cup-shrimp', cat: 'cupnoodle', brand: 'kokomi', name: T('Sour & Spicy Shrimp', 'รสกุ้งเปรี้ยวเผ็ด'),
    price: 25, size: g(65), origin: 'vn',
    pal: ['#f7b21a', '#d97a00', '#ffffff', '#ffffff'], bg: 'zig', soup: '#e0561f', hero: 'tomyumNoodleBowl', heroOpts: { variant: 1, bowl: '#fdf6e3', rim: '#d97a00', pattern: 'band' },
    ing: ['wheat', 'palm', 'salt', 'sugar', 'shrimp', 'chili', 'lemongrass', 'tamarind', 'msg'], allergens: ['wheat', 'shrimp', 'soy'], nut: [290, 3, 11, 1300],
    desc: T('A Vietnamese-style cup noodle in a sour-and-spicy shrimp broth (tom chua cay), the kind of budget cup you find across Southeast Asia.',
      'บะหมี่ถ้วยสไตล์เวียดนาม น้ำซุปรสกุ้งเปรี้ยวเผ็ดจัดจ้าน เติมน้ำร้อนแล้วทานได้ทันที'),
  },
];

// Bottle, jar and tin labels only give the hero 1-4 cm, so those icons are drawn bolder than the box and bag ones.
for (const [key, k] of Object.entries({ anchovyDrop: 1.45, chilliFan: 1.45, chilliPasteBowl: 1.35, chickenDipDish: 1.45, oysterOpen: 1.5, soyPods: 1.45, cookingOilDrop: 1.4, tunaSteakFish: 2.3, mackerelTomato: 1.7 })) {
  const f = illus[key];
  illus[key] = function scaled(ctx, s, o) { ctx.save(); ctx.scale(k, k); f(ctx, s, o); ctx.restore(); };
}

// Route cup SKUs to their own bowl. Every other caller of noodleBowl (topping shrimp / pork / egg / veg) gets the stock bowl.
const CUP_ART = {};
for (const c of CUP) { c.topping = '@' + c.id; CUP_ART[c.topping] = [c.hero, c.heroOpts || {}]; }
illus.noodleBowl = function noodleBowl(ctx, s, o = {}) {
  const art = CUP_ART[o.topping];
  if (!art) return STOCK_BOWL(ctx, s, o);
  ctx.save(); ctx.translate(0, -s * 0.03); ctx.scale(1.3, 1.3);
  illus[art[0]](ctx, s, { bowl: o.bowl, rim: o.rim, ...art[1] });
  steamWisps(ctx, s, 0, -s * 0.21, 3, 0.07);
  ctx.restore();
};

// ---------------------------------------------------------------------------------------- pantry
const PANTRY = [
  {
    id: 'tiparos-fish-sauce', cat: 'grocery', brand: 'tiparos', name: T('Genuine Fish Sauce', 'น้ำปลาแท้'), sub: T('Anchovy fish sauce', 'น้ำปลาแท้จากปลากะตัก'),
    price: 22, size: ml(300), g: 'bottle-sauce', style: 'pet', pop: 2,
    pal: ['#a3231a', '#5e120c', '#f2c14e', '#a5561c'], body: '#a5561c', capColor: '#c8161d', bg: 'plain', hero: 'anchovyDrop',
    ing: ['anchovy', 'salt', 'sugar'], allergens: ['fish'],
    desc: T("Thailand's kitchen staple, brewed from anchovies and salt. It's the salty soul of som tam and stir-fries, and sits on the table with chopped chillies as phrik nam pla.",
      'น้ำปลาแท้จากปลากะตัก เครื่องปรุงคู่ครัวไทย ใช้ปรุงส้มตำ ผัด ต้ม หรือทำพริกน้ำปลาไว้จิ้ม'),
  },
  {
    id: 'sriracha-panich-medium', cat: 'grocery', brand: 'sriracha', name: T('Chilli Sauce Medium Hot', 'ซอสพริกสูตรเผ็ดกลาง'), sub: T('Sriracha chilli sauce', 'ซอสพริกศรีราชา'),
    price: 35, size: g(230), g: 'bottle-sauce', style: 'pet', pop: 2,
    pal: ['#d8232a', '#8d0f14', '#fff0c8', '#c8161d'], body: '#c8161d', capColor: '#ffffff', bg: 'plain', hero: 'chilliFan',
    ing: ['chili', 'sugar', 'vinegar', 'garlic', 'salt', 'starch'],
    desc: T('Sriracha-style chilli sauce named after the coastal town of Si Racha in Chonburi. Sweet, tangy and garlicky, it is the classic dip for Thai omelettes, fried chicken and seafood.',
      'ซอสพริกศรีราชา ตั้งชื่อตามอำเภอศรีราชา จังหวัดชลบุรี รสหวาน เปรี้ยว เผ็ดกลาง หอมกระเทียม ทานคู่ไข่เจียว ไก่ทอด หรืออาหารทะเล'),
  },
  {
    id: 'maepranom-nam-prik-pao', cat: 'grocery', brand: 'maepranom', name: T('Thai Chilli Paste', 'น้ำพริกเผา'), sub: T('Nam prik pao', 'น้ำพริกเผาไทย'),
    price: 35, size: g(114), g: 'jar-s', style: 'pet',
    pal: ['#f6ead0', '#dcc79a', '#c8161d', '#6a1a10'], body: '#6a1a10', capColor: '#c8161d', bg: 'plain', hero: 'chilliPasteBowl',
    ing: ['chili', 'onion', 'garlic', 'soyoil', 'sugar', 'shrimp', 'tamarind', 'salt'], allergens: ['shrimp'],
    desc: T("Nam prik pao is Thailand's roasted chilli paste: sweet, smoky and savoury from dried chillies, garlic, shallots and shrimp. Stir it into tom yum, spread it on toast or fold it into fried rice.",
      'น้ำพริกเผาไทย หอมพริกแห้งคั่ว กระเทียม หอมแดง และกุ้งแห้ง หวาน มัน เค็มกลมกล่อม ใส่ต้มยำ ทาขนมปัง หรือคลุกข้าวผัดได้'),
  },
  {
    id: 'maeploy-sweet-chilli-chicken', cat: 'grocery', brand: 'maeploy', name: T('Sweet Chilli Chicken Dip', 'น้ำจิ้มไก่'), sub: T('Sweet chilli sauce', 'ซอสพริกเปรี้ยวหวาน'),
    price: 29, size: g(350), g: 'bottle-sauce', style: 'pet',
    pal: ['#fff6e8', '#f2dcc0', '#d4111a', '#e8391f'], body: '#e8391f', capColor: '#2e8b3a', bg: 'plain', hero: 'chickenDipDish',
    ing: ['sugar', 'chili', 'vinegar', 'garlic', 'salt', 'starch', 'water'],
    desc: T('Sweet, mildly hot chilli sauce made for dipping grilled chicken, fried chicken and spring rolls. A bottle like this sits on many Thai tables.',
      'น้ำจิ้มไก่รสหวานเผ็ดเล็กน้อย จิ้มไก่ย่าง ไก่ทอด ปอเปี๊ยะ ทอดมัน ได้อร่อยลงตัว'),
  },
  {
    id: 'maekrua-oyster-sauce', cat: 'grocery', brand: 'maekrua', name: T('Oyster Sauce', 'ซอสหอยนางรม'), sub: T('Oyster sauce', 'ซอสหอยนางรม'),
    price: 39, size: ml(300), g: 'bottle-sauce', style: 'pet',
    pal: ['#c8161d', '#8a0e12', '#ffd54a', '#2a1208'], body: '#2a1208', capColor: '#c8161d', bg: 'plain', hero: 'oysterOpen',
    ing: ['water', 'sugar', 'salt', 'oyster', 'starch', 'caramel'],
    desc: T("The Thai kitchen's umami booster: a thick, glossy oyster sauce for stir-fried morning glory, pad kra pao and noodles. Found in almost every home wok.",
      'ซอสหอยนางรมรสกลมกล่อม เข้มข้น ใช้ผัดผักบุ้ง ผัดกะเพรา ผัดซีอิ๊ว ช่วยเพิ่มความหอมอร่อยให้ทุกจาน'),
  },
  {
    id: 'healthyboy-white-soy-sauce', cat: 'grocery', brand: 'healthyboy', name: T('White Soy Sauce Formula 1', 'ซีอิ๊วขาว สูตร 1'), sub: T('White soy sauce', 'ซีอิ๊วขาว'),
    price: 29, size: ml(300), g: 'bottle-sauce', style: 'pet',
    pal: ['#ffd21a', '#d99a00', '#0f3a8a', '#1a0c06'], body: '#1a0c06', capColor: '#ffd21a', bg: 'plain', hero: 'soyPods',
    ing: ['water', 'soy', 'salt', 'wheat', 'sugar'], allergens: ['soy', 'wheat'],
    desc: T('Formula 1 white soy sauce, brewed naturally from soybeans for six months. The everyday seasoning for stir-fries, marinades and a fried egg over rice.',
      'ซีอิ๊วขาวสูตร 1 หมักตามธรรมชาติจากถั่วเหลืองนาน 6 เดือน ปรุงได้ทั้งต้ม ผัด แกง ทอด หรือราดไข่ดาวกินกับข้าว'),
  },
  {
    id: 'knorr-pork-stock-cubes', cat: 'grocery', brand: 'knorr', name: T('Pork Stock Cubes', 'ซุปก้อน รสหมู'), sub: T('Bouillon cubes', 'ซุปกึ่งสำเร็จรูปชนิดก้อน'),
    price: 22, size: g(80), g: 'box-s', style: 'box',
    pal: ['#e8452a', '#a52410', '#ffd400', '#ffffff'], bg: 'rays', hero: 'bouillonCubes',
    ing: ['salt', 'sugar', 'palm', 'msg', 'pork', 'porkbone', 'onion', 'garlic', 'pepper'], allergens: ['soy'], nut: [230, 6, 12, 15200],
    desc: T('Bouillon cubes with pork-bone flavour. Thai home cooks drop one into kaeng jeut, the mild clear soup, or into a pot of congee for instant depth.',
      'ซุปก้อนรสหมู ช่วยให้แกงจืด ต้มจืด หรือข้าวต้มหอมหวานกลมกล่อมทันที'),
  },
  {
    id: 'sealect-tuna-steak-oil', cat: 'grocery', brand: 'sealect', name: T('Tuna Steak in Soybean Oil', 'ทูน่าสเต็กในน้ำมันถั่วเหลือง'),
    price: 45, size: g(165), g: 'tin-tuna', style: 'can', promo: T('3 cans ฿120', '3 กระป๋อง 120 บาท'),
    pal: ['#e9f2fc', '#b9d3ee', '#0a57b8', '#c9ced3'], bg: 'waves', hero: 'tunaSteakFish',
    ing: ['tuna', 'soyoil', 'salt'], allergens: ['fish', 'soy'],
    desc: T('Tuna steak in soybean oil, a Thai pantry classic for tuna sandwiches, fried rice and yum tuna salad. Open the ring-pull and it is ready to eat.',
      'ทูน่าสเต็กในน้ำมันถั่วเหลือง ใช้ทำแซนด์วิช ข้าวผัด หรือยำทูน่า ดึงฝาเปิดแล้วทานได้ทันที'),
  },
  {
    id: 'roza-mackerel-tomato', cat: 'grocery', brand: 'roza', name: T('Mackerel in Tomato Sauce', 'ปลาแมคเคอเรลในซอสมะเขือเทศ'),
    price: 24, size: g(155), g: 'tin-tuna', style: 'can', pop: 2,
    pal: ['#d7261e', '#8a120d', '#ffd54a', '#c9ced3'], bg: 'stripes', hero: 'mackerelTomato',
    ing: ['mackerel', 'tomato', 'sugar', 'salt', 'starch'], allergens: ['fish'],
    desc: T('Mackerel in tomato sauce, the no-fuss can in Thai households. Stir-fry it with chillies and onion, or spoon it over hot rice with a fried egg.',
      'ปลาแมคเคอเรลในซอสมะเขือเทศ อาหารสำรองคู่บ้านคนไทย นำไปผัดพริกหอมใหญ่ หรือราดข้าวสวยร้อน ๆ กับไข่ดาว'),
  },
  {
    id: 'carnation-plus-condensed-milk', cat: 'grocery', brand: 'carnation', name: T('Plus Condensed Milk', 'พลัส นมข้นหวาน'),
    price: 33, size: g(380), g: 'can185', style: 'can',
    pal: ['#1f66c8', '#0d3f8f', '#ffffff', '#c9ced3'], bg: 'rays', hero: 'milkSplash',
    ing: ['milk', 'sugar', 'milkp', 'vitamins'], allergens: ['milk'],
    desc: T('Sweetened condensed milk: the secret behind Thai iced tea and the street-stall toast dipped in sweet milk. Drizzle it over bread, ice or fruit.',
      'นมข้นหวานสำหรับชงชาเย็น กาแฟเย็น ราดขนมปังปิ้ง หรือทำขนมหวานที่คนไทยคุ้นเคย'),
  },
  {
    id: 'nescafe-3in1-rich-aroma', cat: 'grocery', brand: 'nescafe', name: T('3in1 Rich Aroma', '3in1 ริช อโรมา'), sub: T('Blend & Brew coffee mix', 'เบลนด์แอนด์บรู กาแฟปรุงสำเร็จ'),
    price: 22, size: { en: '4 × 17 g', th: '17 ก. × 4 ซอง' }, g: 'box-s', style: 'box',
    pal: ['#d9232a', '#8f0f14', '#ffd54a', '#ffffff'], bg: 'dots', hero: 'coffeeCup', heroOpts: { c1: '#6b3e1c' },
    ing: ['sugar', 'creamer', 'coffee', 'flavour'], allergens: ['milk'], nut: [300, 34, 8, 240],
    desc: T('Coffee, creamer and sugar in one stick: just tear and add hot water. Many 11 SEVEN branches have a hot-water tap, so a coffee break takes seconds.',
      'กาแฟปรุงสำเร็จ 3 อิน 1 มีกาแฟ ครีมเทียม และน้ำตาลในซองเดียว ฉีกซองแล้วชงน้ำร้อนได้เลย อีเลฟเว่น เซเว่น หลายสาขามีน้ำร้อนให้กด'),
  },
  {
    id: 'chat-hom-mali-rice-1kg', cat: 'grocery', brand: 'royalumbrella', name: T('Hom Mali Rice 100%', 'ข้าวหอมมะลิ 100%'), sub: T('New-crop jasmine rice', 'ข้าวหอมมะลิใหม่'),
    price: 45, size: kg(1), g: 'bag-xl', style: 'noodle', pop: 2,
    pal: ['#f5e6b0', '#d9b75c', '#9b1c1f', '#ffffff'], bg: 'dots', hero: 'jasmineRiceHeap',
    ing: ['jasmine'], nut: [3600, 0, 6, 10],
    desc: T('Hom Mali (jasmine) rice, soft, fragrant and the centre of every Thai meal. Rinse it, cook it, and pair it with anything.',
      'ข้าวหอมมะลิ 100% หุงสุกนุ่ม หอมธรรมชาติ ข้าวสวยคู่สำรับคนไทยทุกมื้อ'),
  },
  {
    id: 'cp-eggs-no3-10', cat: 'grocery', brand: 'cpselect', name: T('Fresh Eggs No. 3', 'ไข่ไก่สด เบอร์ 3'), sub: T('Hen eggs', 'ไข่ไก่'),
    price: 59, size: T('10 eggs', '10 ฟอง'), g: 'box-eggs', style: 'box', pop: 2,
    pal: ['#f7d64a', '#e0a800', '#e60012', '#ffffff'], bg: 'rays', hero: 'henEggsThree',
    ing: ['egg'], allergens: ['egg'], nut: [780, 5, 50, 620],
    desc: T('Medium No. 3 hen eggs. Fried with crispy edges (khai dao) they top everything from basil chicken rice to instant noodles.',
      'ไข่ไก่สดเบอร์ 3 ขนาดกลาง ทอดไข่ดาวขอบกรอบราดข้าวกะเพรา หรือตอกใส่บะหมี่กึ่งสำเร็จรูปก็อร่อย'),
  },
  {
    id: 'angoon-soybean-oil-1l', cat: 'grocery', brand: 'angoon', name: T('Soybean Oil', 'น้ำมันถั่วเหลือง'), sub: T('Refined soybean oil', 'น้ำมันถั่วเหลืองบริสุทธิ์'),
    price: 55, size: L(1), g: 'bottle-oil', style: 'pet',
    pal: ['#3a7d1e', '#215010', '#ffd54a', '#f2c94c'], body: '#f2c94c', capColor: '#3a7d1e', bg: 'plain', hero: 'cookingOilDrop',
    ing: ['soyoil'], allergens: ['soy'],
    desc: T('Refined soybean oil for stir-frying, deep-frying and everyday Thai cooking. Wok-hot pad kra pao and crispy fried eggs both start here.',
      'น้ำมันถั่วเหลืองบริสุทธิ์ ใช้ผัด ทอด ทำอาหารได้ทุกเมนู ผัดกะเพรา ไข่ดาวกรอบ ๆ ก็เริ่มจากน้ำมันขวดนี้'),
  },
  {
    id: 'mitrphol-white-sugar-1kg', cat: 'grocery', brand: 'mitrphol', name: T('Refined White Sugar', 'น้ำตาลทรายขาวบริสุทธิ์'), sub: T('Cane sugar', 'น้ำตาลจากอ้อย'),
    price: 27, size: kg(1), g: 'bag-l', style: 'noodle',
    pal: ['#1f8a3c', '#0e5a24', '#ff9a1f', '#ffffff'], bg: 'waves', hero: 'sugarCanePile',
    ing: ['cane'], nut: [3870, 1000, 0, 0],
    desc: T('Refined white sugar from Thai sugarcane. Beyond sweetening tea and coffee, a pinch balances the sour, salty and spicy notes in Thai cooking.',
      'น้ำตาลทรายขาวบริสุทธิ์จากอ้อยไทย ใช้ชงเครื่องดื่ม ทำขนม และปรุงรสให้กลมกล่อมทั้งเปรี้ยว เค็ม เผ็ด หวาน'),
  },
  {
    id: 'prungthip-iodised-salt-500g', cat: 'grocery', brand: 'prungthip', name: T('Iodised Table Salt', 'เกลือบริโภค เสริมไอโอดีน'), sub: T('Table salt', 'เกลือป่น'),
    price: 12, size: g(500), g: 'bag-m', style: 'noodle',
    pal: ['#1a68c8', '#0a3f8f', '#ffffff', '#ffffff'], bg: 'stripes', hero: 'saltShakerHeap',
    ing: ['salt', 'iodine'], nut: [0, 0, 0, 196000],
    desc: T('Iodised table salt for seasoning, curing and grilling. Thai cooks pack it around whole fish for the classic salt-crusted grill, pla pao klua.',
      'เกลือบริโภคเสริมไอโอดีน ใช้ปรุงรส หมักเนื้อ หรือพอกปลาก่อนย่างเป็นปลาเผาเกลือ'),
  },
];

export default [...NOODLE, ...CUP, ...PANTRY];

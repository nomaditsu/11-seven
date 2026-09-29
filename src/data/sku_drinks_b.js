// Drinks B: tea, juice, dairy, coffee, beer and spirits — Bangkok 7-Eleven chiller stock (2025).
// Names are the Thai wording printed on the real packs; prices are typical 7-Eleven shelf prices in baht.
// Alcohol carries `alcohol: true` + `abv` (the painter adds the legal warning on the back panel).
import { g, ml, T } from './sku_util.js';
import { circle, ellipse, poly, drop, leaf, linGrad, radGrad, fillRR } from '../gfx/draw.js';
import { lighten, darken, TAU } from '../core/util.js';
import { ORIGIN_NAME } from '../gfx/pack_common.js';

// pack_common has no Belgium entry yet (Hoegaarden); register it at runtime so the back panel reads "Made in Belgium".
ORIGIN_NAME.be ??= { en: 'Belgium', th: 'ประเทศเบลเยียม' };

// ================================================================================================ brands
// Only brands that do not exist in brands.js are added here (plus one Thai spelling fix, see `betagen`).
export const brands = {
  fuji:       { text: 'FUJI', th: 'ฟูจิ', style: 'stamp', bg: '#ffffff', fg: '#d81f26', font: 'archivo', ring: '#d81f26' },
  pearly:     { text: 'Pearly', th: 'เพิร์ลลี่', style: 'pill', bg: '#ffffff', fg: '#c2185b', font: 'pacifico', ring: '#c2185b' },
  unif:       { text: 'unif', th: 'ยูนิฟ', style: 'oval', bg: '#f58220', fg: '#ffffff', font: 'lilita', ring: '#ffffff' },
  jele:       { text: 'Jele', th: 'เจเล่ บิวตี้', style: 'script', fg: '#ffffff', font: 'pacifico', stroke: '#c2185b' },
  doichaang:  { text: 'DOI CHAANG', th: 'ดอยช้าง', style: 'stamp', bg: '#f0e0b8', fg: '#5a3416', font: 'chonburi', ring: '#5a3416' },
  amazon:     { text: 'Café Amazon', th: 'คาเฟ่ อเมซอน', style: 'ribbon', bg: '#0f6b3c', fg: '#ffffff', font: 'kanit', ring: '#f3c04a' },
  cheers:     { text: 'CHEERS', th: 'เชียร์ส', style: 'block', bg: '#e8a800', fg: '#7a0f0f', font: 'anton', ring: '#7a0f0f' },
  archa:      { text: 'ARCHA', th: 'อาร์ช่า', style: 'shield', bg: '#1f7a4a', fg: '#ffffff', font: 'archivo', ring: '#f3e6a8' },
  hoegaarden: { text: 'Hoegaarden', th: 'ฮูการ์เด้น', style: 'stamp', bg: '#fbf6ea', fg: '#1a5fa8', font: 'chonburi', ring: '#1a5fa8' },
  mekhong:    { text: 'MEKHONG', th: 'แม่โขง', style: 'stamp', bg: '#1c1410', fg: '#e8c25a', font: 'chonburi', ring: '#e8c25a' },
  regency:    { text: 'Regency', th: 'รีเจนซี่', style: 'plain', fg: '#f2d27a', font: 'chonburi', stroke: '#3a0d10' },
  highball:   { text: 'HIGHBALL', th: 'ไฮบอล', style: 'block', bg: '#0f3a5e', fg: '#ffd34a', font: 'anton', ring: '#ffd34a' },
  // shared brands.js has a mistaken transliteration ('เบทราเจน'); the Betagro milk brand is printed เบทาเก้น
  betagen:    { text: 'Betagen', th: 'เบทาเก้น', style: 'script', fg: '#ffffff', font: 'pacifico', stroke: '#c8102e' },
};

// ================================================================================================ ingredients
export const ingredients = {
  jasmine: { en: 'Jasmine flower', th: 'ดอกมะลิ' },
  genmai: { en: 'Roasted brown rice', th: 'ข้าวกล้องคั่ว' },
  guava: { en: 'Guava', th: 'ฝรั่ง' },
  pearls: { en: 'Tapioca pearls', th: 'ไข่มุกมันสำปะหลัง' },
  creamer: { en: 'Non-dairy creamer', th: 'ครีมเทียม' },
  collagen: { en: 'Collagen', th: 'คอลลาเจน' },
  skimp: { en: 'Skim milk powder', th: 'นมผงขาดมันเนย' },
  lcasei: { en: 'Lactobacillus casei Shirota', th: 'แลคโตบาซิลลัส เคซีไอ สเตรนชิโรตา' },
  calcium: { en: 'Calcium', th: 'แคลเซียม' },
  coriander: { en: 'Coriander seed', th: 'เมล็ดผักชี' },
  orangepeel: { en: 'Orange peel', th: 'เปลือกส้ม' },
  wine: { en: 'Wine', th: 'ไวน์' },
  herbs: { en: 'Herbs & spices', th: 'สมุนไพรและเครื่องเทศ' },
};

// ================================================================================================ hero illustrations
// Chunky, outlined, saturated — same look as gfx/illus.js. Coordinates are relative to s (size in cm), origin at centre.
const OUT = '#3b2411';
const ln = (ctx, s, k = 0.03, col = OUT) => { ctx.lineWidth = s * k; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = col; };
const shine = (ctx, x, y, w, h, rot = -0.6, a = 0.55) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill(); ctx.restore();
};
const steam = (ctx, s, x = 0, y = 0, n = 3, col = 'rgba(255,255,255,.8)') => {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const sx = x + (i - (n - 1) / 2) * s * 0.13;
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.bezierCurveTo(sx - s * 0.06, y - s * 0.08, sx + s * 0.06, y - s * 0.14, sx, y - s * 0.22); ctx.stroke();
  }
  ctx.restore();
};
// tumbler outline path (top width tw, bottom width bw, from y0 to y1)
const glassPath = (ctx, tw, bw, y0, y1) => {
  ctx.beginPath(); ctx.moveTo(-tw, y0); ctx.lineTo(tw, y0); ctx.lineTo(bw, y1); ctx.lineTo(-bw, y1); ctx.closePath();
};
const cubes = (ctx, s, pts, a = 0.55) => {
  for (const [x, y, r] of pts) { ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r); fillRR(ctx, -s * 0.07, -s * 0.07, s * 0.14, s * 0.14, s * 0.025, `rgba(255,255,255,${a})`, 'rgba(255,255,255,.9)', s * 0.01); ctx.restore(); }
};

const strawberryAt = (ctx, s, x, y, k, col) => {
  const c = col || '#ee2b45';
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.beginPath(); ctx.moveTo(0, s * 0.42); ctx.bezierCurveTo(s * 0.5, s * 0.15, s * 0.42, -s * 0.32, 0, -s * 0.3); ctx.bezierCurveTo(-s * 0.42, -s * 0.32, -s * 0.5, s * 0.15, 0, s * 0.42); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.5, [[0, lighten(c, 0.22)], [0.6, c], [1, darken(c, 0.25)]], -s * 0.12, -s * 0.12); ctx.fill(); ln(ctx, s); ctx.stroke();
  ctx.fillStyle = '#ffe9a0';
  for (let i = 0; i < 10; i++) { const a = i * 2.4, r = s * (0.06 + (i % 3) * 0.09); ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.4 + s * 0.05, s * 0.014, s * 0.024, 0, 0, TAU); ctx.fill(); }
  for (let i = 0; i < 5; i++) leaf(ctx, 0, -s * 0.27, s * 0.22, s * 0.07, -Math.PI / 2 + (i - 2) * 0.55, '#2e9b3e');
  shine(ctx, -s * 0.2, -s * 0.08, s * 0.04, s * 0.09, 0.4, 0.5);
  ctx.restore();
};
const grapesAt = (ctx, s, x, y, k, col) => {
  const c = col || '#7b3fb0';
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  for (const [gx, gy] of [[0, -0.14], [-0.11, -0.03], [0.11, -0.03], [-0.05, 0.09], [0.05, 0.09], [0, 0.2]]) {
    circle(ctx, gx * s, gy * s, s * 0.115, c, darken(c, 0.4), s * 0.02); shine(ctx, gx * s - s * 0.035, gy * s - s * 0.04, s * 0.028, s * 0.017, -0.6, 0.55);
  }
  leaf(ctx, 0, -s * 0.24, s * 0.22, s * 0.08, -0.6, '#2e9b3e');
  ctx.restore();
};
const orangeSliceAt = (ctx, x, y, r, col) => {
  const c = col || '#ff9a1f';
  circle(ctx, x, y, r, c, darken(c, 0.35), r * 0.12); circle(ctx, x, y, r * 0.83, '#fff1c8'); circle(ctx, x, y, r * 0.73, lighten(c, 0.12));
  ctx.strokeStyle = '#fff1c8'; ctx.lineWidth = r * 0.07;
  for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.73, y + Math.sin(a) * r * 0.73); ctx.stroke(); }
};

export const illus = {
  // ---- tea
  bevGreenTea(ctx, s, o = {}) { // Japanese tea cup with steam, tea leaves (and popped rice for genmaicha)
    const tea = o.tint || '#8cc63f';
    leaf(ctx, -s * 0.04, s * 0.12, s * 0.5, s * 0.12, -2.4, '#2e9b3e');
    leaf(ctx, s * 0.04, s * 0.12, s * 0.5, s * 0.12, -0.74, '#48b04c');
    leaf(ctx, 0, s * 0.14, s * 0.46, s * 0.1, -1.57, '#3a9a3a');
    ctx.beginPath(); ctx.moveTo(-s * 0.26, -s * 0.02); ctx.lineTo(s * 0.26, -s * 0.02);
    ctx.bezierCurveTo(s * 0.26, s * 0.26, s * 0.14, s * 0.37, 0, s * 0.37); ctx.bezierCurveTo(-s * 0.14, s * 0.37, -s * 0.26, s * 0.26, -s * 0.26, -s * 0.02); ctx.closePath();
    ctx.fillStyle = '#fbf7ea'; ctx.fill(); ln(ctx, s); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = o.band || '#3ba54a'; ctx.fillRect(-s * 0.3, s * 0.1, s * 0.6, s * 0.07); ctx.restore();
    ellipse(ctx, 0, -s * 0.02, s * 0.26, s * 0.07, tea, OUT, s * 0.025);
    shine(ctx, -s * 0.15, s * 0.16, s * 0.03, s * 0.09, 0.15, 0.7);
    if (o.grains) {
      for (const [x, y, r] of [[-0.36, 0.3, 0.4], [-0.29, 0.38, -0.3], [0.32, 0.36, 0.6], [0.4, 0.28, -0.5], [-0.42, 0.22, 0.2]]) {
        ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r);
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.055, s * 0.038, 0, 0, TAU); ctx.fillStyle = '#fff6df'; ctx.fill(); ln(ctx, s, 0.015, '#b98a3a'); ctx.stroke(); ctx.restore();
      }
    }
    steam(ctx, s, 0, -s * 0.1);
  },
  bevThaiTea(ctx, s, o = {}) { // tall glass of orange Thai tea with a cream swirl
    const c = o.tint || '#f28a1e';
    glassPath(ctx, s * 0.27, s * 0.2, -s * 0.34, s * 0.38);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(); ln(ctx, s); ctx.stroke();
    ctx.save(); glassPath(ctx, s * 0.25, s * 0.19, -s * 0.27, s * 0.36); ctx.clip();
    ctx.fillStyle = linGrad(ctx, 0, -s * 0.3, 0, s * 0.4, [[0, lighten(c, 0.15)], [1, darken(c, 0.2)]]); ctx.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.7);
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, -s * 0.14);
    ctx.bezierCurveTo(s * 0.18, -s * 0.06, s * 0.1, -s * 0.2, 0, -s * 0.1); ctx.bezierCurveTo(-s * 0.1, 0, -s * 0.2, -s * 0.16, -s * 0.3, -s * 0.12); ctx.closePath();
    ctx.fillStyle = '#fff3de'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,243,222,.9)'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.04, -s * 0.08); ctx.bezierCurveTo(s * 0.06, s * 0.04, -s * 0.08, s * 0.12, s * 0.02, s * 0.22); ctx.stroke();
    ctx.restore();
    cubes(ctx, s, [[-0.1, 0.1, 0.3], [0.1, 0.22, -0.2], [-0.05, 0.3, 0.5]], 0.4);
    ctx.strokeStyle = o.straw || '#e8261c'; ctx.lineWidth = s * 0.045; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.06, s * 0.3); ctx.lineTo(s * 0.2, -s * 0.5); ctx.stroke();
  },
  bevBobaCup(ctx, s, o = {}) { // bubble tea: dome lid, wide straw, dark pearls
    const c = o.tint || '#c9a27a';
    glassPath(ctx, s * 0.27, s * 0.19, -s * 0.2, s * 0.4);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
    ctx.save(); glassPath(ctx, s * 0.27, s * 0.19, -s * 0.2, s * 0.4); ctx.clip();
    ctx.fillStyle = linGrad(ctx, 0, -s * 0.12, 0, s * 0.4, [[0, lighten(c, 0.25)], [1, darken(c, 0.15)]]); ctx.fillRect(-s * 0.3, -s * 0.12, s * 0.6, s * 0.55);
    for (const [x, y] of [[-0.12, 0.34], [0, 0.35], [0.12, 0.34], [-0.17, 0.26], [-0.06, 0.27], [0.06, 0.27], [0.17, 0.26], [-0.11, 0.19], [0.0, 0.19], [0.11, 0.19]]) {
      circle(ctx, x * s, y * s, s * 0.04, '#2b1a12'); circle(ctx, (x - 0.012) * s, (y - 0.014) * s, s * 0.01, 'rgba(255,255,255,.7)');
    }
    ctx.restore();
    glassPath(ctx, s * 0.27, s * 0.19, -s * 0.2, s * 0.4); ln(ctx, s); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -s * 0.2, s * 0.27, s * 0.14, 0, Math.PI, 0); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill(); ln(ctx, s, 0.025); ctx.stroke();
    fillRR(ctx, -s * 0.29, -s * 0.23, s * 0.58, s * 0.05, s * 0.02, '#f5f5f5', OUT, s * 0.02);
    ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.085; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.06, s * 0.32); ctx.lineTo(s * 0.17, -s * 0.5); ctx.stroke();
    ctx.strokeStyle = o.straw || '#ff5c8a'; ctx.lineWidth = s * 0.06; ctx.beginPath(); ctx.moveTo(s * 0.06, s * 0.32); ctx.lineTo(s * 0.17, -s * 0.5); ctx.stroke();
  },
  bevJasmine(ctx, s) { // jasmine blossoms on green leaves
    for (const [x, y, len, rot] of [[-0.3, 0.28, 0.4, -2.6], [0.3, 0.3, 0.4, -0.5], [0, 0.34, 0.36, -1.57]]) leaf(ctx, x * s, y * s, len * s, s * 0.11, rot, '#2f9a45');
    const flower = (x, y, r) => {
      for (let i = 0; i < 5; i++) {
        ctx.save(); ctx.translate(x * s, y * s); ctx.rotate((i * TAU) / 5);
        ellipse(ctx, 0, -r * s * 0.6, r * s * 0.34, r * s * 0.6, '#ffffff', '#b9b58a', s * 0.014); ctx.restore();
      }
      circle(ctx, x * s, y * s, r * s * 0.22, '#ffd54a', '#b98a10', s * 0.012);
    };
    flower(0.04, 0.02, 0.27); flower(-0.3, -0.22, 0.16); flower(0.32, -0.16, 0.15); flower(0.3, 0.26, 0.11);
  },
  // ---- juice
  bevApple(ctx, s, o = {}) {
    const c = o.tint || '#e53935';
    ctx.beginPath(); ctx.moveTo(0, -s * 0.26);
    ctx.bezierCurveTo(s * 0.12, -s * 0.4, s * 0.44, -s * 0.3, s * 0.4, s * 0.06);
    ctx.bezierCurveTo(s * 0.37, s * 0.34, s * 0.14, s * 0.44, 0, s * 0.36);
    ctx.bezierCurveTo(-s * 0.14, s * 0.44, -s * 0.37, s * 0.34, -s * 0.4, s * 0.06);
    ctx.bezierCurveTo(-s * 0.44, -s * 0.3, -s * 0.12, -s * 0.4, 0, -s * 0.26); ctx.closePath();
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.5, [[0, lighten(c, 0.25)], [0.6, c], [1, darken(c, 0.25)]], -s * 0.12, -s * 0.12); ctx.fill(); ln(ctx, s); ctx.stroke();
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = s * 0.045; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -s * 0.24); ctx.quadraticCurveTo(s * 0.02, -s * 0.36, s * 0.06, -s * 0.44); ctx.stroke();
    leaf(ctx, s * 0.05, -s * 0.36, s * 0.26, s * 0.08, -0.45, '#3a9a3a');
    shine(ctx, -s * 0.2, -s * 0.06, s * 0.05, s * 0.11, 0.35, 0.6);
  },
  bevTomato(ctx, s, o = {}) {
    const c = o.tint || '#e53935';
    const one = (x, y, r, dark) => {
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.06, r * 0.92, 0, 0, TAU);
      ctx.fillStyle = radGrad(ctx, x, y, 0, r * 1.3, [[0, lighten(c, 0.22)], [0.6, dark ? darken(c, 0.1) : c], [1, darken(c, 0.32)]], x - r * 0.3, y - r * 0.3); ctx.fill(); ln(ctx, s); ctx.stroke();
      for (let i = 0; i < 5; i++) leaf(ctx, x, y - r * 0.82, r * 0.5, r * 0.16, -Math.PI / 2 + (i - 2) * 0.62, '#2e9b3e');
      circle(ctx, x, y - r * 0.82, r * 0.08, '#1f7a2e');
      shine(ctx, x - r * 0.45, y - r * 0.2, r * 0.13, r * 0.22, 0.4, 0.6);
    };
    one(s * 0.16, -s * 0.06, s * 0.27, true); one(-s * 0.1, s * 0.1, s * 0.32, false);
  },
  bevGuava(ctx, s) {
    // whole fruit behind
    ctx.beginPath(); ctx.ellipse(s * 0.16, -s * 0.06, s * 0.27, s * 0.3, 0.3, 0, TAU);
    ctx.fillStyle = radGrad(ctx, s * 0.16, -s * 0.06, 0, s * 0.35, [[0, '#dcec8a'], [1, '#8fbc3a']], s * 0.08, -s * 0.16); ctx.fill(); ln(ctx, s); ctx.stroke();
    leaf(ctx, s * 0.13, -s * 0.3, s * 0.22, s * 0.08, -0.7, '#2e9b3e');
    // cut half in front
    ctx.beginPath(); ctx.ellipse(-s * 0.12, s * 0.1, s * 0.3, s * 0.3, 0, 0, TAU); ctx.fillStyle = '#d7e987'; ctx.fill(); ln(ctx, s); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-s * 0.12, s * 0.1, s * 0.26, s * 0.26, 0, 0, TAU);
    ctx.fillStyle = radGrad(ctx, -s * 0.12, s * 0.1, 0, s * 0.26, [[0, '#ffd3de'], [0.55, '#f7859f'], [1, '#ef5f85']]); ctx.fill();
    ctx.fillStyle = '#fff3c4';
    for (let i = 0; i < 12; i++) { const a = (i * TAU) / 12, r = s * (i % 2 ? 0.1 : 0.15); ctx.beginPath(); ctx.arc(-s * 0.12 + Math.cos(a) * r, s * 0.1 + Math.sin(a) * r, s * 0.018, 0, TAU); ctx.fill(); }
    shine(ctx, -s * 0.22, -s * 0.02, s * 0.04, s * 0.08, 0.4, 0.5);
  },
  bevChrysanthemum(ctx, s) {
    leaf(ctx, -s * 0.05, s * 0.2, s * 0.44, s * 0.1, 2.5, '#2f9a45'); leaf(ctx, s * 0.05, s * 0.2, s * 0.44, s * 0.1, 0.65, '#3fae4f');
    ctx.save(); ctx.translate(0, -s * 0.03);
    const ring = (n, r, len, wid, fill, stroke) => { for (let i = 0; i < n; i++) { ctx.save(); ctx.rotate((i * TAU) / n); ellipse(ctx, 0, -r, wid, len, fill, stroke, s * 0.012); ctx.restore(); } };
    ring(18, s * 0.25, s * 0.15, s * 0.045, '#ffe680', '#c99a1a'); ring(14, s * 0.17, s * 0.11, s * 0.042, '#ffd23a', '#c99a1a'); ring(9, s * 0.09, s * 0.07, s * 0.04, '#ffbf1f', '#c99a1a');
    circle(ctx, 0, 0, s * 0.055, '#f08a1a', '#a85a08', s * 0.01);
    ctx.restore();
  },
  bevLongan(ctx, s) {
    ctx.strokeStyle = '#6a4420'; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.02, -s * 0.1); ctx.quadraticCurveTo(-s * 0.04, -s * 0.3, s * 0.02, -s * 0.42); ctx.stroke();
    leaf(ctx, s * 0.02, -s * 0.36, s * 0.3, s * 0.08, -0.35, '#2e9b3e'); leaf(ctx, s * 0.0, -s * 0.34, s * 0.26, s * 0.07, -2.5, '#3fae4f');
    const berry = (x, y, r) => {
      ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, TAU);
      ctx.fillStyle = radGrad(ctx, x * s, y * s, 0, r * s * 1.2, [[0, '#e8bd82'], [1, '#b47a3a']], (x - 0.04) * s, (y - 0.04) * s); ctx.fill(); ln(ctx, s, 0.025, '#6a4420'); ctx.stroke();
      shine(ctx, (x - 0.05) * s, (y - 0.06) * s, r * s * 0.22, r * s * 0.13, -0.6, 0.5);
    };
    berry(-0.2, 0.0, 0.14); berry(0.16, -0.04, 0.14); berry(-0.1, 0.2, 0.14); berry(0.3, 0.22, 0.13);
    // peeled fruit: shell cup underneath, translucent flesh and a small seed showing through
    ctx.beginPath(); ctx.arc(s * 0.02, s * 0.3, s * 0.15, 0, Math.PI); ctx.fillStyle = '#c08a4c'; ctx.fill(); ln(ctx, s, 0.025, '#6a4420'); ctx.stroke();
    circle(ctx, s * 0.02, s * 0.27, s * 0.14, '#fdf3dc', '#a8946a', s * 0.02);
    ctx.fillStyle = 'rgba(58,36,24,.55)'; ctx.beginPath(); ctx.ellipse(s * 0.05, s * 0.29, s * 0.045, s * 0.05, 0.4, 0, TAU); ctx.fill(); shine(ctx, -s * 0.03, s * 0.2, s * 0.045, s * 0.022, -0.6, 0.85);
  },
  bevYoungCoconut(ctx, s) { // green Thai coconut with a straw
    leaf(ctx, -s * 0.05, -s * 0.08, s * 0.56, s * 0.1, -2.3, '#2e9b3e'); leaf(ctx, s * 0.05, -s * 0.08, s * 0.56, s * 0.1, -0.85, '#48b04c');
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.12);
    ctx.bezierCurveTo(-s * 0.4, s * 0.2, -s * 0.18, s * 0.42, 0, s * 0.42); ctx.bezierCurveTo(s * 0.18, s * 0.42, s * 0.4, s * 0.2, s * 0.3, -s * 0.12); ctx.closePath();
    ctx.fillStyle = radGrad(ctx, 0, s * 0.1, 0, s * 0.45, [[0, '#b4dc78'], [1, '#6ea83a']], -s * 0.1, 0); ctx.fill(); ln(ctx, s); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,90,20,.35)'; ctx.lineWidth = s * 0.018;
    for (const x of [-0.16, 0, 0.16]) { ctx.beginPath(); ctx.moveTo(x * s, -s * 0.06); ctx.quadraticCurveTo(x * s * 1.5, s * 0.2, x * s * 0.8, s * 0.38); ctx.stroke(); }
    ellipse(ctx, 0, -s * 0.13, s * 0.3, s * 0.1, '#fbf8e6', OUT, s * 0.025); ellipse(ctx, 0, -s * 0.13, s * 0.19, s * 0.06, '#dfe8b8', '#8a9a5a', s * 0.012);
    ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.075; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.04, -s * 0.12); ctx.lineTo(s * 0.14, -s * 0.5); ctx.stroke();
    ctx.strokeStyle = '#ff6b4a'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(-s * 0.04, -s * 0.12); ctx.lineTo(s * 0.14, -s * 0.5); ctx.stroke();
    shine(ctx, -s * 0.2, s * 0.12, s * 0.035, s * 0.1, 0.3, 0.45);
  },
  bevJellyPouch(ctx, s, o = {}) { // spouted jelly-drink pouch with konjac cubes
    const c = o.tint || '#f06292';
    ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.28); ctx.lineTo(s * 0.1, -s * 0.28); ctx.bezierCurveTo(s * 0.3, -s * 0.2, s * 0.32, -s * 0.05, s * 0.3, s * 0.34);
    ctx.quadraticCurveTo(0, s * 0.42, -s * 0.3, s * 0.34); ctx.bezierCurveTo(-s * 0.32, -s * 0.05, -s * 0.3, -s * 0.2, -s * 0.1, -s * 0.28); ctx.closePath();
    ctx.fillStyle = linGrad(ctx, -s * 0.3, 0, s * 0.3, 0, [[0, darken(c, 0.15)], [0.45, lighten(c, 0.2)], [1, darken(c, 0.2)]]); ctx.fill(); ln(ctx, s); ctx.stroke();
    fillRR(ctx, -s * 0.07, -s * 0.44, s * 0.14, s * 0.1, s * 0.02, '#ffffff', OUT, s * 0.022); fillRR(ctx, -s * 0.09, -s * 0.35, s * 0.18, s * 0.06, s * 0.02, '#ececec', OUT, s * 0.02);
    for (const [x, y, r] of [[-0.14, 0.02, 0.3], [0.1, -0.06, -0.2], [0.14, 0.18, 0.5], [-0.08, 0.22, -0.4], [0, 0.08, 0.7]]) {
      ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r); fillRR(ctx, -s * 0.05, -s * 0.05, s * 0.1, s * 0.1, s * 0.02, 'rgba(255,255,255,.5)', 'rgba(255,255,255,.9)', s * 0.01); ctx.restore();
    }
    shine(ctx, -s * 0.2, -s * 0.06, s * 0.035, s * 0.12, 0.1, 0.5);
  },
  bevOrange(ctx, s, o = {}) { // whole orange + half slice with leaves
    const c = o.tint || '#ff9a1f';
    leaf(ctx, -s * 0.06, -s * 0.22, s * 0.3, s * 0.09, -2.5, '#2e9b3e'); leaf(ctx, s * 0.0, -s * 0.24, s * 0.3, s * 0.09, -0.9, '#48b04c');
    ctx.beginPath(); ctx.arc(-s * 0.1, s * 0.02, s * 0.3, 0, TAU);
    ctx.fillStyle = radGrad(ctx, -s * 0.1, s * 0.02, 0, s * 0.36, [[0, lighten(c, 0.22)], [0.65, c], [1, darken(c, 0.22)]], -s * 0.2, -s * 0.1); ctx.fill(); ln(ctx, s); ctx.stroke();
    ctx.fillStyle = 'rgba(160,70,0,.28)'; for (let i = 0; i < 12; i++) { const a = i * 2.1, r = s * (0.05 + (i % 4) * 0.055); ctx.beginPath(); ctx.arc(-s * 0.1 + Math.cos(a) * r, s * 0.02 + Math.sin(a) * r, s * 0.009, 0, TAU); ctx.fill(); }
    circle(ctx, -s * 0.1, -s * 0.27, s * 0.03, '#5a7a1a');
    shine(ctx, -s * 0.24, -s * 0.09, s * 0.05, s * 0.09, 0.5, 0.55);
    // half slice
    circle(ctx, s * 0.2, s * 0.14, s * 0.24, c, darken(c, 0.35), s * 0.028); circle(ctx, s * 0.2, s * 0.14, s * 0.2, '#fff1c8'); circle(ctx, s * 0.2, s * 0.14, s * 0.175, lighten(c, 0.12));
    ctx.strokeStyle = '#fff1c8'; ctx.lineWidth = s * 0.014; for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8; ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.14); ctx.lineTo(s * 0.2 + Math.cos(a) * s * 0.175, s * 0.14 + Math.sin(a) * s * 0.175); ctx.stroke(); }
  },
  bevMango(ctx, s, o = {}) {
    const c = o.tint || '#ffc21a';
    ctx.save(); ctx.rotate(-0.35);
    ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.02);
    ctx.bezierCurveTo(-s * 0.4, -s * 0.26, -s * 0.14, -s * 0.34, s * 0.1, -s * 0.3); ctx.bezierCurveTo(s * 0.32, -s * 0.26, s * 0.48, -s * 0.1, s * 0.45, s * 0.05);
    ctx.bezierCurveTo(s * 0.42, s * 0.2, s * 0.24, s * 0.3, 0, s * 0.3); ctx.bezierCurveTo(-s * 0.24, s * 0.3, -s * 0.4, s * 0.22, -s * 0.4, -s * 0.02); ctx.closePath();
    ctx.fillStyle = radGrad(ctx, -s * 0.05, s * 0.02, 0, s * 0.5, [[0, '#ffe96a'], [0.55, c], [1, '#ff8a1a']], -s * 0.16, -s * 0.1); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = radGrad(ctx, -s * 0.3, -s * 0.2, 0, s * 0.3, [[0, 'rgba(235,60,40,.75)'], [1, 'rgba(235,60,40,0)']]); ctx.fillRect(-s * 0.5, -s * 0.4, s, s * 0.8); ctx.restore();
    ln(ctx, s, 0.03, '#9a4a12'); ctx.stroke();
    shine(ctx, -s * 0.16, -s * 0.15, s * 0.1, s * 0.045, -0.3, 0.55);
    ctx.restore();
    ln(ctx, s, 0.04, '#5a3a1a'); ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.2); ctx.quadraticCurveTo(-s * 0.32, -s * 0.3, -s * 0.26, -s * 0.34); ctx.stroke();
    leaf(ctx, -s * 0.27, -s * 0.33, s * 0.34, s * 0.09, -0.35, '#2e9b3e'); leaf(ctx, -s * 0.27, -s * 0.33, s * 0.26, s * 0.07, -2.3, '#48b04c');
  },
  bevLychee(ctx, s) { // bumpy red lychees and a peeled one
    const shell = (x, y, r) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = radGrad(ctx, x, y, 0, r * 1.2, [[0, '#f0566d'], [1, '#c2183a']], x - r * 0.3, y - r * 0.3); ctx.fill(); ln(ctx, s, 0.025, '#7a0f22'); ctx.stroke();
      ctx.fillStyle = 'rgba(110,10,25,.45)';
      for (let i = 0; i < 16; i++) { const a = i * 2.4, d = r * (0.25 + (i % 4) * 0.19); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * d - r * 0.06, y + Math.sin(a) * d + r * 0.05); ctx.lineTo(x + Math.cos(a) * d + r * 0.06, y + Math.sin(a) * d + r * 0.05); ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d - r * 0.07); ctx.closePath(); ctx.fill(); }
      shine(ctx, x - r * 0.35, y - r * 0.4, r * 0.18, r * 0.1, -0.6, 0.5);
    };
    leaf(ctx, s * 0.0, -s * 0.16, s * 0.32, s * 0.09, -2.4, '#2e9b3e'); leaf(ctx, s * 0.02, -s * 0.16, s * 0.3, s * 0.09, -0.8, '#48b04c');
    ln(ctx, s, 0.03, '#6a4420'); ctx.beginPath(); ctx.moveTo(s * 0.0, -s * 0.16); ctx.lineTo(s * 0.0, -s * 0.05); ctx.stroke();
    shell(-s * 0.16, s * 0.06, s * 0.19); shell(s * 0.17, s * 0.04, s * 0.18);
    // peeled
    circle(ctx, s * 0.02, s * 0.28, s * 0.16, '#fffaf0', '#c9bfa2', s * 0.02);
    circle(ctx, s * 0.02, s * 0.28, s * 0.115, 'rgba(255,255,255,.8)'); shine(ctx, -s * 0.03, s * 0.22, s * 0.05, s * 0.03, -0.6, 0.85);
  },
  // ---- dairy
  bevProbiotic(ctx, s, o = {}) { // small cultured-milk bottle with foil cap
    const c = o.tint || '#e3141b';
    for (const [x, y, r] of [[-0.36, -0.1, 0.5], [0.34, -0.2, -0.6], [-0.32, 0.2, -0.3], [0.36, 0.14, 0.4]]) {
      ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r); fillRR(ctx, -s * 0.06, -s * 0.025, s * 0.12, s * 0.05, s * 0.025, lighten(c, 0.45), c, s * 0.012); ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.34); ctx.lineTo(s * 0.08, -s * 0.34);
    ctx.bezierCurveTo(s * 0.1, -s * 0.24, s * 0.2, -s * 0.2, s * 0.19, -s * 0.06); ctx.bezierCurveTo(s * 0.17, s * 0.0, s * 0.14, s * 0.04, s * 0.2, s * 0.16);
    ctx.bezierCurveTo(s * 0.23, s * 0.3, s * 0.14, s * 0.4, 0, s * 0.4); ctx.bezierCurveTo(-s * 0.14, s * 0.4, -s * 0.23, s * 0.3, -s * 0.2, s * 0.16);
    ctx.bezierCurveTo(-s * 0.14, s * 0.04, -s * 0.17, s * 0.0, -s * 0.19, -s * 0.06); ctx.bezierCurveTo(-s * 0.2, -s * 0.2, -s * 0.1, -s * 0.24, -s * 0.08, -s * 0.34); ctx.closePath();
    ctx.fillStyle = linGrad(ctx, -s * 0.2, 0, s * 0.2, 0, [[0, '#e8e2d2'], [0.4, '#ffffff'], [1, '#ddd6c4']]); ctx.fill(); ln(ctx, s); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = c; ctx.fillRect(-s * 0.3, s * 0.03, s * 0.6, s * 0.17);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-s * 0.16 + i * s * 0.065, s * 0.115, s * 0.014, 0, TAU); ctx.fill(); } ctx.restore();
    fillRR(ctx, -s * 0.1, -s * 0.44, s * 0.2, s * 0.13, s * 0.03, c, OUT, s * 0.025); fillRR(ctx, -s * 0.1, -s * 0.44, s * 0.2, s * 0.04, s * 0.02, lighten(c, 0.35));
    shine(ctx, -s * 0.11, -s * 0.12, s * 0.025, s * 0.08, 0.05, 0.6);
  },
  bevSoybean(ctx, s) { // two curved soy pods, loose beans and a drop of soy milk
    const bez = (P, t) => { const u = 1 - t; return [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0], u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]]; };
    const pod = (P, w, n) => {
      const path = () => { ctx.beginPath(); ctx.moveTo(P[0][0] * s, P[0][1] * s); ctx.bezierCurveTo(P[1][0] * s, P[1][1] * s, P[2][0] * s, P[2][1] * s, P[3][0] * s, P[3][1] * s); };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      path(); ctx.strokeStyle = '#2e5a14'; ctx.lineWidth = (w + 0.045) * s; ctx.stroke();
      path(); ctx.strokeStyle = '#7cb342'; ctx.lineWidth = w * s; ctx.stroke();
      path(); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = w * s * 0.25; ctx.translate(0, -w * s * 0.22); ctx.stroke(); ctx.translate(0, w * s * 0.22);
      for (let i = 0; i < n; i++) { const [x, y] = bez(P, (i + 0.9) / (n + 0.8)); circle(ctx, x * s, y * s, w * s * 0.5, '#c5e1a5', '#4f7d22', s * 0.014); shine(ctx, x * s - w * s * 0.14, y * s - w * s * 0.16, w * s * 0.1, w * s * 0.06, -0.6, 0.6); }
    };
    pod([[-0.42, 0.06], [-0.32, -0.34], [0.08, -0.4], [0.4, -0.14]], 0.15, 4);
    pod([[-0.36, 0.26], [-0.2, -0.04], [0.16, -0.06], [0.42, 0.14]], 0.14, 4);
    for (const [x, y] of [[-0.3, 0.4], [-0.18, 0.44]]) { circle(ctx, x * s, y * s, s * 0.055, '#f3e6a6', '#a8946a', s * 0.014); shine(ctx, (x - 0.02) * s, (y - 0.02) * s, s * 0.018, s * 0.011, -0.5, 0.7); }
    drop(ctx, s * 0.28, s * 0.3, s * 0.1, '#ffffff', '#8aa8c8', s * 0.02); shine(ctx, s * 0.25, s * 0.3, s * 0.018, s * 0.04, 0.3, 0.7);
  },
  bevMaltGlass(ctx, s, o = {}) { // glass of chocolate malt milk
    const c = o.tint || '#7a4320';
    glassPath(ctx, s * 0.26, s * 0.2, -s * 0.36, s * 0.38);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(); ln(ctx, s); ctx.stroke();
    ctx.save(); glassPath(ctx, s * 0.24, s * 0.19, -s * 0.24, s * 0.36); ctx.clip();
    ctx.fillStyle = linGrad(ctx, 0, -s * 0.24, 0, s * 0.38, [[0, lighten(c, 0.12)], [1, darken(c, 0.25)]]); ctx.fillRect(-s * 0.3, -s * 0.24, s * 0.6, s * 0.65); ctx.restore();
    for (const [x, y, r] of [[-0.17, -0.3, 0.07], [-0.06, -0.35, 0.08], [0.06, -0.31, 0.075], [0.16, -0.35, 0.065], [0.0, -0.27, 0.06]]) circle(ctx, x * s, y * s, r * s, '#fff2d8', '#d8c090', s * 0.012);
    ctx.strokeStyle = o.straw || '#4aa3e8'; ctx.lineWidth = s * 0.045; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.04, s * 0.3); ctx.lineTo(s * 0.18, -s * 0.5); ctx.stroke();
    for (const [x, y] of [[-0.38, 0.32], [-0.3, 0.4], [0.32, 0.4], [0.4, 0.3]]) circle(ctx, x * s, y * s, s * 0.05, '#a8622a', OUT, s * 0.012);
    shine(ctx, -s * 0.15, s * 0.05, s * 0.03, s * 0.12, 0.08, 0.35);
  },
  bevMilkGlass(ctx, s, o = {}) { // glass of milk with a splash crown
    const c = o.tint || '#ffffff', line = o.line || '#5f86b0';
    ctx.beginPath(); ctx.moveTo(-s * 0.25, -s * 0.06);
    ctx.bezierCurveTo(-s * 0.35, -s * 0.16, -s * 0.31, -s * 0.28, -s * 0.22, -s * 0.36); ctx.bezierCurveTo(-s * 0.15, -s * 0.3, -s * 0.13, -s * 0.22, -s * 0.1, -s * 0.16);
    ctx.bezierCurveTo(-s * 0.1, -s * 0.3, -s * 0.06, -s * 0.4, 0, -s * 0.45); ctx.bezierCurveTo(s * 0.06, -s * 0.4, s * 0.1, -s * 0.3, s * 0.1, -s * 0.16);
    ctx.bezierCurveTo(s * 0.13, -s * 0.22, s * 0.15, -s * 0.3, s * 0.22, -s * 0.36); ctx.bezierCurveTo(s * 0.31, -s * 0.28, s * 0.35, -s * 0.16, s * 0.25, -s * 0.06); ctx.closePath();
    ctx.fillStyle = c; ctx.fill(); ln(ctx, s, 0.03, line); ctx.stroke();
    for (const [x, y, r] of [[-0.4, -0.28, 0.04], [0.4, -0.22, 0.045], [0.3, -0.46, 0.03], [-0.3, -0.46, 0.03]]) circle(ctx, x * s, y * s, r * s, c, line, s * 0.02);
    glassPath(ctx, s * 0.27, s * 0.21, -s * 0.06, s * 0.42);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
    ctx.save(); glassPath(ctx, s * 0.245, s * 0.195, -s * 0.06, s * 0.4); ctx.clip();
    ctx.fillStyle = linGrad(ctx, -s * 0.25, 0, s * 0.25, 0, [[0, darken(c, 0.06)], [0.45, c], [1, darken(c, 0.12)]]); ctx.fillRect(-s * 0.3, -s * 0.06, s * 0.6, s * 0.5); ctx.restore();
    glassPath(ctx, s * 0.27, s * 0.21, -s * 0.06, s * 0.42); ln(ctx, s, 0.03, line); ctx.stroke();
    shine(ctx, -s * 0.15, s * 0.14, s * 0.03, s * 0.13, 0.08, 0.55);
  },
  bevCow(ctx, s) { // cow face
    for (const sx of [-1, 1]) {
      ctx.save(); ctx.translate(sx * s * 0.22, -s * 0.26); ctx.rotate(sx * -0.5); ellipse(ctx, 0, -s * 0.06, s * 0.05, s * 0.11, '#f6ecd0', OUT, s * 0.025); ctx.restore();
      ctx.save(); ctx.translate(sx * s * 0.34, -s * 0.08); ctx.rotate(sx * 0.5); ellipse(ctx, 0, 0, s * 0.15, s * 0.075, '#ffffff', OUT, s * 0.03); ellipse(ctx, sx * s * 0.02, 0, s * 0.09, s * 0.04, '#f5b7b7'); ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(-s * 0.24, -s * 0.28); ctx.quadraticCurveTo(0, -s * 0.36, s * 0.24, -s * 0.28); ctx.bezierCurveTo(s * 0.32, -s * 0.05, s * 0.3, s * 0.2, s * 0.2, s * 0.34);
    ctx.quadraticCurveTo(0, s * 0.42, -s * 0.2, s * 0.34); ctx.bezierCurveTo(-s * 0.3, s * 0.2, -s * 0.32, -s * 0.05, -s * 0.24, -s * 0.28); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ln(ctx, s); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.ellipse(-s * 0.16, -s * 0.12, s * 0.12, s * 0.16, 0.3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.28, s * 0.1, s * 0.09, 0.2, 0, TAU); ctx.fill(); ctx.restore();
    ellipse(ctx, 0, s * 0.22, s * 0.2, s * 0.14, '#f6b6b6', OUT, s * 0.03);
    circle(ctx, -s * 0.07, s * 0.22, s * 0.025, '#7a2a2a'); circle(ctx, s * 0.07, s * 0.22, s * 0.025, '#7a2a2a');
    for (const sx of [-1, 1]) { circle(ctx, sx * s * 0.13, -s * 0.05, s * 0.04, '#111'); circle(ctx, sx * s * 0.13 - s * 0.012, -s * 0.062, s * 0.012, '#fff'); }
  },
  bevStrawberry(ctx, s, o = {}) { strawberryAt(ctx, s, 0, 0, 1, o.tint); },
  bevFruitMix(ctx, s) { // strawberry, orange slice, grapes
    grapesAt(ctx, s, s * 0.14, -s * 0.16, 0.9);
    strawberryAt(ctx, s, -s * 0.13, s * 0.06, 0.82);
    orangeSliceAt(ctx, s * 0.2, s * 0.2, s * 0.2);
  },
  // ---- coffee
  bevBeans(ctx, s, o = {}) {
    const c = o.tint || '#6b3e1c';
    for (const [x, y, r] of [[-0.2, 0.08, 0.5], [0.2, 0.0, -0.5], [0.0, -0.2, 0.15], [0.05, 0.22, -0.2]]) {
      ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r);
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.16, s * 0.11, 0, 0, TAU);
      ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.18, [[0, lighten(c, 0.2)], [1, darken(c, 0.25)]], -s * 0.04, -s * 0.04); ctx.fill(); ln(ctx, s, 0.022, '#22110a'); ctx.stroke();
      ctx.strokeStyle = '#22110a'; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.moveTo(-s * 0.14, 0); ctx.bezierCurveTo(-s * 0.05, -s * 0.05, s * 0.05, s * 0.05, s * 0.14, 0); ctx.stroke();
      ctx.restore();
    }
  },
  bevLatteGlass(ctx, s, o = {}) { // layered latte glass
    glassPath(ctx, s * 0.25, s * 0.2, -s * 0.36, s * 0.38);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(); ln(ctx, s); ctx.stroke();
    ctx.save(); glassPath(ctx, s * 0.235, s * 0.19, -s * 0.34, s * 0.36); ctx.clip();
    ctx.fillStyle = o.tint || '#4a2812'; ctx.fillRect(-s * 0.3, s * 0.12, s * 0.6, s * 0.3);
    ctx.fillStyle = o.tint2 || '#c58a4a'; ctx.fillRect(-s * 0.3, -s * 0.12, s * 0.6, s * 0.26);
    ctx.fillStyle = '#fff1d8'; ctx.fillRect(-s * 0.3, -s * 0.34, s * 0.6, s * 0.24);
    ctx.strokeStyle = 'rgba(74,40,18,.55)'; ctx.lineWidth = s * 0.025; ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 0.2); ctx.bezierCurveTo(-s * 0.05, -s * 0.08, s * 0.05, -s * 0.28, s * 0.15, -s * 0.16); ctx.stroke();
    ctx.restore();
    shine(ctx, -s * 0.15, s * 0.05, s * 0.03, s * 0.14, 0.08, 0.4);
    steam(ctx, s, 0, -s * 0.4, 2);
  },
  // ---- beer & spirits
  bevElephant(ctx, s, o = {}) { // Chang / Doi Chaang: front-facing elephant
    const c = o.body || '#f4f0e6';
    for (const sx of [-1, 1]) { ellipse(ctx, sx * s * 0.3, -s * 0.03, s * 0.2, s * 0.27, darken(c, 0.08), OUT, s * 0.03); ellipse(ctx, sx * s * 0.31, -s * 0.02, s * 0.11, s * 0.18, '#f3b7b0'); }
    ellipse(ctx, 0, -s * 0.03, s * 0.27, s * 0.3, c, OUT, s * 0.03);
    ctx.strokeStyle = 'rgba(80,60,40,.35)'; ctx.lineWidth = s * 0.015; ctx.beginPath(); ctx.arc(0, -s * 0.2, s * 0.09, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.lineCap = 'round';
    for (const sx of [-1, 1]) {
      ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(sx * s * 0.13, s * 0.1); ctx.quadraticCurveTo(sx * s * 0.31, s * 0.21, sx * s * 0.34, s * 0.04); ctx.stroke();
      ctx.strokeStyle = '#fffdf4'; ctx.lineWidth = s * 0.042; ctx.beginPath(); ctx.moveTo(sx * s * 0.13, s * 0.1); ctx.quadraticCurveTo(sx * s * 0.31, s * 0.21, sx * s * 0.34, s * 0.04); ctx.stroke();
    }
    ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.12; ctx.beginPath(); ctx.moveTo(0, s * 0.0); ctx.quadraticCurveTo(0, s * 0.3, s * 0.1, s * 0.37); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = s * 0.085; ctx.beginPath(); ctx.moveTo(0, s * 0.0); ctx.quadraticCurveTo(0, s * 0.3, s * 0.1, s * 0.37); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,60,40,.35)'; ctx.lineWidth = s * 0.012; for (const y of [0.1, 0.17, 0.24]) { ctx.beginPath(); ctx.moveTo(-s * 0.035, s * y); ctx.lineTo(s * 0.035, s * y); ctx.stroke(); }
    for (const sx of [-1, 1]) { circle(ctx, sx * s * 0.1, -s * 0.08, s * 0.03, '#111'); circle(ctx, sx * s * 0.1 - s * 0.008, -s * 0.09, s * 0.009, '#fff'); }
  },
  bevRedStar(ctx, s) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.17 : s * 0.4, a = -Math.PI / 2 + (i * Math.PI) / 5; pts.push([Math.cos(a) * r, Math.sin(a) * r + s * 0.02]); }
    poly(ctx, pts, '#e21c21', '#ffffff', s * 0.07);
    poly(ctx, pts, '#e21c21', '#8a0d10', s * 0.02);
    shine(ctx, -s * 0.06, -s * 0.12, s * 0.05, s * 0.09, 0.5, 0.35);
  },
  bevSwan(ctx, s, o = {}) { // golden swan (Hong Thong)
    const c = o.tint || '#f2c14e';
    const neck = () => { ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.24); ctx.bezierCurveTo(-s * 0.38, s * 0.22, -s * 0.44, s * 0.0, -s * 0.31, -s * 0.15); ctx.bezierCurveTo(-s * 0.22, -s * 0.26, -s * 0.1, -s * 0.28, -s * 0.13, -s * 0.4); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.15; neck(); ctx.stroke();
    poly(ctx, [[s * 0.3, s * 0.2], [s * 0.5, s * 0.0], [s * 0.44, s * 0.3]], darken(c, 0.1), OUT, s * 0.03);
    ellipse(ctx, s * 0.05, s * 0.26, s * 0.33, s * 0.16, c, OUT, s * 0.03, -0.08);
    ctx.strokeStyle = c; ctx.lineWidth = s * 0.105; neck(); ctx.stroke();
    circle(ctx, -s * 0.13, -s * 0.41, s * 0.07, c, OUT, s * 0.025);
    poly(ctx, [[-s * 0.19, -s * 0.44], [-s * 0.36, -s * 0.37], [-s * 0.19, -s * 0.35]], '#e8501c', OUT, s * 0.02);
    circle(ctx, -s * 0.14, -s * 0.43, s * 0.014, '#111');
    ctx.strokeStyle = 'rgba(110,60,0,.55)'; ctx.lineWidth = s * 0.022;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.1 + i * s * 0.1, s * 0.22); ctx.quadraticCurveTo(s * 0.08 + i * s * 0.08, s * 0.15, s * 0.24 + i * s * 0.02, s * 0.27); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.ellipse(s * 0.02, s * 0.46, s * 0.34, s * 0.04, 0, 0, TAU); ctx.stroke();
  },
  bevBarley(ctx, s, o = {}) { // barley ear
    const c = o.tint || '#e6b84a';
    ctx.strokeStyle = '#a5791f'; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, s * 0.44); ctx.lineTo(0, -s * 0.2); ctx.stroke();
    leaf(ctx, 0, s * 0.36, s * 0.34, s * 0.06, -2.4, '#7aa63a');
    for (let i = 0; i < 6; i++) {
      const y = -s * 0.24 + i * s * 0.085;
      for (const side of [-1, 1]) {
        ctx.strokeStyle = '#a5791f'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.moveTo(side * s * 0.07, y - s * 0.03); ctx.lineTo(side * s * 0.3, y - s * 0.3 - i * s * 0.005); ctx.stroke();
        ctx.save(); ctx.translate(side * s * 0.075, y); ctx.rotate(side * 0.45);
        ellipse(ctx, 0, 0, s * 0.045, s * 0.095, c, '#8a6410', s * 0.018); ctx.restore();
      }
    }
    ellipse(ctx, 0, -s * 0.32, s * 0.045, s * 0.09, c, '#8a6410', s * 0.018);
    ctx.strokeStyle = '#a5791f'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.lineTo(0, -s * 0.58); ctx.stroke();
  },
  bevLozenge(ctx, s, o = {}) { // Bavarian blue/white lozenge shield (Federbräu)
    const b = o.tint || '#1d5fa8';
    ctx.beginPath(); ctx.moveTo(-s * 0.32, -s * 0.34); ctx.lineTo(s * 0.32, -s * 0.34); ctx.lineTo(s * 0.32, s * 0.08); ctx.quadraticCurveTo(s * 0.32, s * 0.36, 0, s * 0.44); ctx.quadraticCurveTo(-s * 0.32, s * 0.36, -s * 0.32, s * 0.08); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = b;
    const step = s * 0.16;
    for (let j = -4; j <= 5; j++) for (let i = -4; i <= 4; i++) {
      if ((i + j) % 2) continue;
      const cx = i * step, cy = -s * 0.34 + j * step * 0.9 + step * 0.5;
      ctx.beginPath(); ctx.moveTo(cx, cy - step * 0.5); ctx.lineTo(cx + step * 0.5, cy); ctx.lineTo(cx, cy + step * 0.5); ctx.lineTo(cx - step * 0.5, cy); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-s * 0.32, -s * 0.34); ctx.lineTo(s * 0.32, -s * 0.34); ctx.lineTo(s * 0.32, s * 0.08); ctx.quadraticCurveTo(s * 0.32, s * 0.36, 0, s * 0.44); ctx.quadraticCurveTo(-s * 0.32, s * 0.36, -s * 0.32, s * 0.08); ctx.closePath();
    ln(ctx, s, 0.035, b); ctx.stroke();
  },
};


// ================================================================================================ TEA
const tea = [
  { id: 'ichitan-honeylemon', cat: 'tea', brand: 'ichitan', font: 'kanit', name: T('Honey Lemon', 'น้ำผึ้งผสมมะนาว'), sub: T('Green tea drink', 'เครื่องดื่มชาเขียว'),
    price: 20, size: ml(420), g: 'pet500', style: 'pet', pal: ['#a6d84a', '#3fa03a', '#ffe13a', '#e2dc7c'], bg: 'waves', hero: 'lemon+honey', heroOpts: { c1: '#ffe13a' }, capColor: '#2f9a3f',
    ing: ['water', 'sugar', 'greentea', 'honey', 'lemon', 'vitc'], nut: [130, 32, 0, 30], pop: 3, promo: T('2 for ฿35', '2 ขวด 35 บาท'),
    desc: T('Bottled green tea sweetened with honey and lemon: Ichitan’s sweet-tart favourite for hot Bangkok afternoons.', 'ชาเขียวพร้อมดื่มรสน้ำผึ้งผสมมะนาวของอิชิตัน หวานอมเปรี้ยว ดื่มเย็น ๆ ชื่นใจรับแดดบ่ายกรุงเทพฯ') },
  { id: 'ichitan-original', cat: 'tea', brand: 'ichitan', font: 'kanit', name: T('Original', 'ออริจินัล'), sub: T('Green tea drink', 'เครื่องดื่มชาเขียว'),
    price: 20, size: ml(420), g: 'pet500', style: 'pet', pal: ['#1f9d55', '#0b6b36', '#ffffff', '#c8d878'], bg: 'rays', hero: 'bevGreenTea', capColor: '#0b6b36',
    ing: ['water', 'sugar', 'greentea', 'vitc'], nut: [110, 26, 0, 25], pop: 2,
    desc: T('The classic Ichitan green tea: light, gently sweet and grassy, made to be drunk ice-cold.', 'ชาเขียวสูตรต้นตำรับของอิชิตัน กลิ่นชาเขียวหอมอ่อน ๆ หวานน้อยกำลังดี ดื่มเย็นสดชื่น') },
  { id: 'ichitan-genmaicha', cat: 'tea', brand: 'ichitan', font: 'kanit', name: T('Genmaicha', 'เก็นไมฉะ'), sub: T('Green tea with roasted rice', 'ชาเขียวผสมข้าวคั่ว'),
    price: 20, size: ml(420), g: 'pet500', style: 'pet', pal: ['#c9a13a', '#7a5c14', '#fff3c4', '#d9b45a'], bg: 'dots', hero: 'bevGreenTea', heroOpts: { tint: '#c9a13a', band: '#b8801a', grains: true }, capColor: '#7a5c14',
    ing: ['water', 'sugar', 'greentea', 'genmai', 'vitc'], nut: [110, 26, 0, 25],
    desc: T('Genmaicha is Japanese green tea blended with roasted rice, which gives it a warm, toasty aroma.', 'เก็นไมฉะคือชาเขียวสไตล์ญี่ปุ่นผสมข้าวคั่ว ให้กลิ่นหอมข้าวคั่วและรสนุ่มละมุน') },
  { id: 'oishi-honeylemon', cat: 'tea', brand: 'oishi', font: 'pattaya', name: T('Honey Lemon', 'น้ำผึ้งผสมมะนาว'), sub: T('Green tea drink', 'เครื่องดื่มชาเขียว'),
    price: 20, size: ml(380), g: 'pet345', style: 'pet', pal: ['#20b04a', '#0b7a35', '#ffd21a', '#e7de7c'], bg: 'rays', hero: 'lemon+bevGreenTea', heroOpts: { c1: '#ffe13a' }, capColor: '#0b7a35',
    ing: ['water', 'sugar', 'greentea', 'honey', 'lemon', 'vitc'], nut: [120, 28, 0, 25], pop: 3,
    desc: T('Oishi (Japanese for “delicious”) helped start Thailand’s bottled green tea craze. Honey lemon is one of its most popular flavours.', 'โออิชิเป็นแบรนด์ชาเขียวพร้อมดื่มที่จุดกระแสชาเขียวในไทย รสน้ำผึ้งผสมมะนาวหวานอมเปรี้ยวเป็นหนึ่งในรสยอดนิยม') },
  { id: 'oishi-original', cat: 'tea', brand: 'oishi', font: 'pattaya', name: T('Original', 'ออริจินัล'), sub: T('Green tea drink', 'เครื่องดื่มชาเขียว'),
    price: 20, size: ml(380), g: 'pet345', style: 'pet', pal: ['#0f8f4a', '#065c2e', '#f5f0dc', '#c5d67a'], bg: 'stripes', hero: 'bevGreenTea', capColor: '#065c2e',
    ing: ['water', 'sugar', 'greentea', 'vitc'], nut: [100, 24, 0, 25],
    desc: T('Plain Oishi green tea with the fresh, slightly bitter flavour of Japanese-style tea leaves.', 'โออิชิ กรีนที รสออริจินัล หอมกลิ่นใบชาเขียวสไตล์ญี่ปุ่น รสชาติสดชื่น ขมนิด ๆ ดื่มง่าย') },
  { id: 'lipton-lemon', cat: 'tea', brand: 'lipton', font: 'lilita', name: T('Ice Tea Lemon', 'ไอซ์ที เลมอน'), sub: T('Lemon flavoured tea drink', 'เครื่องดื่มชารสเลมอน'),
    price: 17, size: ml(450), g: 'pet500', style: 'pet', pal: ['#ffd200', '#f2a900', '#d81f26', '#c26a1a'], bg: 'rays', hero: 'lemon', heroOpts: { c1: '#ffe13a' }, capColor: '#d81f26',
    ing: ['water', 'sugar', 'tea', 'citric', 'lemon', 'flavour', 'vitc'], nut: [150, 36, 0, 15], promo: T('2 for ฿30', '2 ขวด 30 บาท'),
    desc: T('Sweet black iced tea with a bright lemon kick: a familiar bottle in the 11 SEVEN chiller.', 'ชาดำรสเลมอนหวานหอม สดชื่นสไตล์ไอซ์ที ดื่มแก้ร้อนได้ทั้งวัน') },
  { id: 'chatramue-thaitea', cat: 'tea', brand: 'chatramue', font: 'sriracha', name: T('Thai Milk Tea', 'ชาไทย'), sub: T('Ready-to-drink Thai iced tea', 'ชาไทยพร้อมดื่ม'),
    price: 25, size: ml(300), g: 'pet345', style: 'pet', pal: ['#f7931e', '#d4610a', '#fff1d6', '#e2761a'], bg: 'rays', hero: 'bevThaiTea', capColor: '#0d6b3a', pop: 2,
    ing: ['water', 'sugar', 'thaitea', 'milkp', 'creamer', 'flavour', 'colour'], nut: [180, 26, 4, 60], allergens: ['milk'],
    desc: T('ChaTraMue, the brand behind the famous orange Thai tea mix, in a ready-to-drink bottle. Creamy, sweet and best ice-cold.', 'ชาไทยสีส้มจากชาตรามือ แบรนด์ชาไทยที่คนไทยคุ้นเคย หวานมัน หอมชา แค่เปิดขวดก็ได้ชาไทยเย็นชื่นใจ') },
  { id: 'fuji-jasmine', cat: 'tea', brand: 'fuji', font: 'kanit', name: T('Jasmine Tea', 'ชามะลิ'), sub: T('Jasmine green tea drink', 'เครื่องดื่มชาเขียวกลิ่นมะลิ'),
    price: 20, size: ml(500), g: 'pet500', style: 'pet', pal: ['#eaf5d3', '#a5d16a', '#2e7d32', '#eef0b4'], bg: 'dots', hero: 'bevJasmine', capColor: '#2e7d32',
    ing: ['water', 'sugar', 'greentea', 'jasmine', 'vitc'], nut: [120, 28, 0, 20],
    desc: T('Green tea scented with jasmine blossoms: fragrant, light and a little floral.', 'ชาเขียวกลิ่นดอกมะลิ หอมอ่อน ๆ รสกลมกล่อม ดื่มแล้วสดชื่น') },
  { id: 'pearly-bubble', cat: 'tea', brand: 'pearly', font: 'fredoka', name: T('Bubble Milk Tea', 'ชานมไข่มุก'), sub: T('Milk tea with tapioca pearls', 'ชานมพร้อมไข่มุก'),
    price: 35, size: ml(350), g: 'pet345', style: 'pet', pal: ['#f8bbd0', '#e57fa1', '#6d4530', '#c9a27a'], bg: 'dots', hero: 'bevBobaCup', capColor: '#6d4530', isNew: true,
    ing: ['water', 'sugar', 'tea', 'milkp', 'creamer', 'pearls', 'flavour'], nut: [230, 35, 3, 60], allergens: ['milk'],
    desc: T('Taiwan-style bubble milk tea in a bottle, with chewy tapioca pearls at the bottom. Shake well before drinking.', 'ชานมไข่มุกสไตล์ไต้หวันแบบขวด มีไข่มุกเหนียวนุ่มอยู่ก้นขวด เขย่าก่อนดื่ม') },
];

// ================================================================================================ JUICE
const juice = [
  { id: 'malee-orange', cat: 'juice', brand: 'malee', font: 'lilita', name: T('100% Orange', 'น้ำส้ม 100%'), sub: T('100% orange juice', 'น้ำส้มคั้น 100%'),
    price: 25, size: ml(300), g: 'pet345', style: 'pet', pal: ['#ffa21f', '#e8590c', '#ffffff', '#ffa726'], bg: 'rays', hero: 'bevOrange', capColor: '#e8590c',
    ing: ['orange'], nut: [130, 27, 0, 5], pop: 2, promo: T('2 for ฿45', '2 ขวด 45 บาท'),
    desc: T('Bottled orange juice from Malee, a household name in Thai fruit juice. Sweet, tangy and served ice-cold.', 'น้ำส้มพร้อมดื่มจากมาลี แบรนด์น้ำผลไม้ที่คนไทยคุ้นเคย รสหวานอมเปรี้ยว ดื่มเย็น ๆ ชื่นใจ') },
  { id: 'tipco-apple', cat: 'juice', brand: 'tipco', font: 'archivo', name: T('100% Apple', 'น้ำแอปเปิ้ล 100%'), sub: T('100% apple juice', 'น้ำแอปเปิ้ล 100%'),
    price: 15, size: ml(200), g: 'brick', style: 'carton', pal: ['#9ccc65', '#3d8b37', '#ffffff', '#e57373'], bg: 'stripes', hero: 'bevApple',
    ing: ['apple', 'vitc'], nut: [95, 22, 0, 5],
    desc: T('Tipco apple juice in a handy 200 ml carton with a straw: a familiar convenience-store and school-bag drink.', 'น้ำแอปเปิ้ลทิปโก้แบบกล่อง 200 มล. พร้อมหลอด พกพาง่าย ดื่มสะดวก') },
  { id: 'dk-tomato', cat: 'juice', brand: 'dk', font: 'chonburi', name: T('Tomato Juice', 'น้ำมะเขือเทศ'), sub: T('100% tomato juice', 'น้ำมะเขือเทศ 100%'),
    price: 18, size: ml(200), g: 'gable-200', style: 'carton', pal: ['#c62828', '#8e1b1b', '#ffffff', '#ef5350'], hero: 'bevTomato',
    ing: ['tomato', 'salt'], nut: [40, 7, 0, 250],
    desc: T('Doi Kham foods come from the Royal Project Foundation’s highland farms. This tomato juice is tangy, savoury and best served cold.', 'น้ำมะเขือเทศจากดอยคำ ผลิตภัณฑ์จากผลผลิตของมูลนิธิโครงการหลวง รสเปรี้ยวหวานสดชื่น ดื่มเย็น ๆ อร่อยที่สุด') },
  { id: 'dk-mango', cat: 'juice', brand: 'dk', font: 'chonburi', name: T('Mango Juice', 'น้ำมะม่วง'), sub: T('Mango juice drink', 'เครื่องดื่มน้ำมะม่วง'),
    price: 20, size: ml(200), g: 'gable-200', style: 'carton', pal: ['#e65100', '#a33a00', '#ffffff', '#ffb300'], hero: 'bevMango',
    ing: ['mango', 'water', 'sugar', 'vitc'], nut: [110, 25, 0, 10],
    desc: T('Thai mango turned into a thick, sweet juice by Doi Kham. Cold, fragrant and a little like a mango smoothie.', 'น้ำมะม่วงข้นหอมหวานจากดอยคำ กลิ่นมะม่วงสุกชัดเจน ดื่มเย็น ๆ เหมือนสมูทตี้มะม่วง') },
  { id: 'chaokoh-coconut', cat: 'juice', brand: 'chaokoh', font: 'lilita', name: T('Coconut Water', 'น้ำมะพร้าว'), sub: T('100% coconut water', 'น้ำมะพร้าว 100%'),
    price: 22, size: ml(230), g: 'can250', style: 'can', pal: ['#4caf50', '#1b6b2a', '#ffffff', '#e8f5e9'], bg: 'waves', hero: 'bevYoungCoconut',
    ing: ['coconut'], nut: [45, 10, 0, 200], pop: 2,
    desc: T('Coconut water from young Thai coconuts, canned for a quick cool-down in the city heat. Lightly sweet and refreshing.', 'น้ำมะพร้าวน้ำหอมกระป๋อง หวานหอมธรรมชาติ ดื่มเย็น ๆ ดับร้อนกลางเมืองได้ทันที') },
  { id: 'tipco-chrysanthemum', cat: 'juice', brand: 'tipco', font: 'kanit', name: T('Chrysanthemum', 'น้ำเก๊กฮวย'), sub: T('Chrysanthemum drink', 'เครื่องดื่มน้ำเก๊กฮวย'),
    price: 15, size: ml(300), g: 'pet345', style: 'pet', pal: ['#f6c700', '#e09800', '#5a3a10', '#f0b400'], bg: 'rays', hero: 'bevChrysanthemum', capColor: '#0f7a3a',
    ing: ['water', 'sugar', 'chrysanthemum', 'citric'], nut: [110, 27, 0, 15],
    desc: T('A sweet, floral drink from steeped chrysanthemum flowers. Thai-Chinese tradition says it helps cool the body down.', 'น้ำต้มดอกเก๊กฮวยหวานหอมกลิ่นดอกไม้ ตามความเชื่อแบบไทย-จีนช่วยดับร้อนในร่างกาย') },
  { id: 'malee-longan', cat: 'juice', brand: 'malee', font: 'lilita', name: T('Longan Drink', 'น้ำลำไย'), sub: T('Longan juice drink', 'เครื่องดื่มน้ำลำไย'),
    price: 18, size: ml(240), g: 'can250', style: 'can', pal: ['#d9a05b', '#8a5a1e', '#fff3d0', '#c8863a'], bg: 'dots', hero: 'bevLongan',
    ing: ['water', 'longan', 'sugar', 'citric'], nut: [100, 24, 0, 10],
    desc: T('Longan, the “dragon’s eye” fruit of northern Thailand, as a sweet cold drink with a honeyed, floral flavour.', 'น้ำลำไยหอมหวาน ผลไม้ขึ้นชื่อของภาคเหนือ กลิ่นหอมเฉพาะตัว ดื่มเย็น ๆ ชื่นใจ') },
  { id: 'malee-lychee', cat: 'juice', brand: 'malee', font: 'lilita', name: T('Lychee', 'ลิ้นจี่'), sub: T('Lychee juice drink', 'เครื่องดื่มน้ำลิ้นจี่'),
    price: 18, size: ml(300), g: 'pet345', style: 'pet', pal: ['#f48fb1', '#c2185b', '#ffffff', '#f8bbd0'], bg: 'dots', hero: 'bevLychee', capColor: '#c2185b',
    ing: ['water', 'sugar', 'lychee', 'citric', 'vitc'], nut: [130, 30, 0, 10],
    desc: T('Sweet, perfumed lychee juice: light, fruity and floral, and a longtime Thai supermarket favourite.', 'น้ำลิ้นจี่หอมหวาน เนื้อลิ้นจี่ฉ่ำ กลิ่นหอมละมุน เครื่องดื่มผลไม้ยอดนิยม') },
  { id: 'unif-guava', cat: 'juice', brand: 'unif', font: 'fredoka', name: T('Guava Juice', 'น้ำฝรั่ง'), sub: T('Guava fruit drink', 'เครื่องดื่มน้ำฝรั่ง'),
    price: 18, size: ml(500), g: 'pet500', style: 'pet', pal: ['#ec7fa0', '#b5386a', '#c8e6a0', '#f4b6c2'], bg: 'stripes', hero: 'bevGuava', capColor: '#4caf50',
    ing: ['water', 'guava', 'sugar', 'citric', 'vitc', 'flavour'], nut: [190, 45, 0, 20], pop: 1,
    desc: T('Pink Thai guava juice with a thick, fruity body. This 500 ml bottle is easy to share or sip through an afternoon.', 'น้ำฝรั่งสีชมพูหวานหอม เข้มข้นแบบเนื้อฝรั่ง ขวดใหญ่ 500 มล. ดื่มคลายร้อนได้นาน') },
  { id: 'jele-grape', cat: 'juice', brand: 'jele', font: 'fredoka', name: T('Grape', 'องุ่น'), sub: T('Konjac jelly drink with collagen', 'เจลลี่ดริงก์วุ้นบุก ผสมคอลลาเจน'),
    price: 12, size: g(150), g: 'pet250', style: 'pet', pal: ['#c084e0', '#8e3fb3', '#ffe0f0', '#d9a5ee'], bg: 'dots', hero: 'bevJellyPouch', heroOpts: { tint: '#9c4fc4' }, capColor: '#ffffff',
    ing: ['water', 'grape', 'sugar', 'jelly', 'collagen', 'citric', 'vitc'], nut: [60, 12, 0, 20],
    desc: T('A slurpable konjac jelly drink with added collagen, sold as a “beauty” snack. Squeeze, sip and chew the little jelly cubes.', 'เจลลี่ดริงก์วุ้นบุกผสมคอลลาเจนสไตล์เครื่องดื่มเพื่อความงาม บีบดื่มพร้อมเคี้ยวเม็ดวุ้นเหนียวนุ่ม') },
];

// ================================================================================================ DAIRY
const YOG = ['water', 'milkp', 'sugar', 'yogurt', 'pectin', 'flavour'];
const dairy = [
  { id: 'meiji-fresh', cat: 'dairy', brand: 'meiji', font: 'fredoka', name: T('Fresh Milk', 'นมสด รสจืด'), sub: T('Pasteurised milk', 'นมพาสเจอร์ไรส์'),
    price: 36, size: ml(450), g: 'gable-450', style: 'carton', pal: ['#1565c0', '#0b3f8a', '#ffffff', '#ffffff'], hero: 'bevMilkGlass',
    ing: ['milk'], nut: [290, 21, 16, 200], allergens: ['milk'], pop: 3, promo: T('2 for ฿65', '2 กล่อง 65 บาท'),
    desc: T('Meiji is a Japanese dairy brand that has become a fixture in Thai chillers. Plain pasteurised milk, smooth and light; keep it refrigerated.', 'นมสดพาสเจอร์ไรส์รสจืดจากเมจิ แบรนด์นมญี่ปุ่นที่คุ้นเคยในตู้แช่ของไทย รสละมุน ต้องเก็บในตู้เย็นตลอดเวลา') },
  { id: 'meiji-choc', cat: 'dairy', brand: 'meiji', font: 'fredoka', name: T('Chocolate', 'ช็อกโกแลต'), sub: T('Chocolate flavoured milk', 'นมรสช็อกโกแลต'),
    price: 20, size: ml(200), g: 'gable-200', style: 'carton', pal: ['#6d3b1a', '#3e2210', '#ffffff', '#ffffff'], hero: 'bevMilkGlass', heroOpts: { tint: '#7a4a2a', line: '#4a2a14' },
    ing: ['milk', 'sugar', 'cocoa', 'stab'], nut: [170, 22, 5, 90], allergens: ['milk'], pop: 2,
    desc: T('Chocolate-flavoured pasteurised milk in a handy 200 ml carton. Sweet, creamy and best very cold.', 'นมพาสเจอร์ไรส์รสช็อกโกแลต หวานมัน ดื่มง่ายในกล่องเล็ก 200 มล. ดื่มเย็นจัดอร่อยที่สุด') },
  { id: 'dutchmill-delight', cat: 'dairy', brand: 'dutchmill', font: 'lilita', name: T('Mixed Fruit', 'ผลไม้รวม'), sub: T('Drinking yoghurt', 'โยเกิร์ตพร้อมดื่ม'),
    price: 15, size: ml(180), g: 'pet250', style: 'pet', pal: ['#e53935', '#b71c1c', '#fff59d', '#f8d7da'], bg: 'dots', hero: 'bevFruitMix', capColor: '#e53935',
    ing: [...YOG], nut: [100, 17, 1, 60], allergens: ['milk'], pop: 3,
    desc: T('Dutch Mill’s drinking yoghurt is a Thai chiller staple: sweet, tangy and fruity, best served ice-cold after a meal.', 'โยเกิร์ตพร้อมดื่มยอดนิยมจากดัชมิลล์ รสผลไม้รวมหวานอมเปรี้ยว ดื่มเย็น ๆ ชื่นใจหลังมื้ออาหาร') },
  { id: 'dutchie-strawberry', cat: 'dairy', brand: 'dutchie', font: 'fredoka', name: T('Strawberry', 'สตรอว์เบอร์รี่'), sub: T('Yoghurt drink', 'โยเกิร์ตพร้อมดื่ม'),
    price: 14, size: ml(180), g: 'gable-200', style: 'carton', pal: ['#e6007e', '#a3005a', '#ffffff', '#ffffff'], hero: 'bevStrawberry',
    ing: [...YOG], nut: [100, 17, 1, 60], allergens: ['milk'], pop: 2,
    desc: T('Sweet strawberry yoghurt drink from Dutchie, a Dutch Mill brand, in a small carton that fits a school bag.', 'โยเกิร์ตพร้อมดื่มรสสตรอว์เบอร์รี่จากดัชชี่ แบรนด์ในเครือดัชมิลล์ หวานหอม กล่องเล็กพกสะดวก') },
  { id: 'foremost-uht', cat: 'dairy', brand: 'foremost', font: 'archivo', name: T('Plain', 'รสจืด'), sub: T('UHT milk', 'นมยูเอชที'),
    price: 14, size: ml(225), g: 'brick', style: 'carton', pal: ['#1976d2', '#0d47a1', '#ffffff', '#bbdefb'], bg: 'waves', hero: 'bevMilkGlass',
    ing: ['milk'], nut: [150, 11, 8, 100], allergens: ['milk'], pop: 2,
    desc: T('UHT milk keeps without a fridge until opened, so Foremost cartons turn up in lunchboxes and 11 SEVEN baskets everywhere.', 'นมยูเอชทีตราโฟร์โมสต์ เก็บได้นานโดยไม่ต้องแช่เย็นจนกว่าจะเปิดดื่ม สะดวกพกพา ไปไหนก็ได้') },
  { id: 'thaidenmark-uht', cat: 'dairy', brand: 'thaidenmark', font: 'kanit', name: T('Pure Cow Milk', 'นมโคแท้ 100%'), sub: T('Plain UHT milk', 'นมยูเอชที รสจืด'),
    price: 13, size: ml(225), g: 'brick', style: 'carton', pal: ['#c8102e', '#8f0a20', '#ffffff', '#ffcdd2'], bg: 'stripes', hero: 'bevCow',
    ing: ['milk'], nut: [150, 11, 8, 100], allergens: ['milk'],
    desc: T('Thai-Denmark is one of Thailand’s oldest dairy brands, founded with Danish help in the 1960s. Plain UHT milk from cows.', 'ไทย-เดนมาร์ค แบรนด์นมที่เกิดจากความร่วมมือไทย-เดนมาร์กตั้งแต่ พ.ศ. 2505 นมโคแท้ 100% ยูเอชที รสจืด') },
  { id: 'yakult-original', cat: 'dairy', brand: 'yakult', font: 'kanit', name: T('Original', 'ออริจินัล'), sub: T('Cultured milk drink', 'เครื่องดื่มนมเปรี้ยว'),
    price: 10, size: ml(80), g: 'glass100', style: 'pet', pal: ['#ffffff', '#efe9d8', '#e3141b', '#fbf6ea'], bg: 'plain', hero: 'bevProbiotic', capColor: '#e3141b',
    ing: ['water', 'skimp', 'sugar', 'starchsyrup', 'lcasei', 'flavour'], nut: [50, 11, 0, 10], allergens: ['milk'], pop: 3,
    desc: T('A tiny bottle of sweet-sour cultured milk with the Shirota bacteria strain. Best very cold.', 'นมเปรี้ยวขวดเล็กตำรับญี่ปุ่นที่มีจุลินทรีย์โพรไบโอติกสายพันธุ์ชิโรตา รสหวานอมเปรี้ยว ดื่มเย็นจัดอร่อยสุด') },
  { id: 'vitamilk-original', cat: 'dairy', brand: 'vitamilk', font: 'lilita', name: T('Original', 'สูตรดั้งเดิม'), sub: T('Soy milk', 'น้ำนมถั่วเหลือง'),
    price: 15, size: ml(250), g: 'brick', style: 'carton', pal: ['#ff8f00', '#e65100', '#fff8e1', '#ffe0b2'], bg: 'rays', hero: 'bevSoybean',
    ing: ['water', 'soy', 'sugar', 'salt'], nut: [120, 13, 4, 80], allergens: ['soy'], pop: 2,
    desc: T('Vitamilk is one of Thailand’s best-known soy milk brands. This lightly sweet original is sold in a classic UHT carton.', 'ไวตามิ้ลค์ แบรนด์น้ำนมถั่วเหลืองที่คนไทยรู้จักดี สูตรดั้งเดิมหวานน้อย กล่องยูเอชทีดื่มง่าย') },
  { id: 'lactasoy-original', cat: 'dairy', brand: 'lactasoy', font: 'lilita', name: T('Original', 'ออริจินัล'), sub: T('Soy milk', 'น้ำนมถั่วเหลือง'),
    price: 16, size: ml(300), g: 'brick-l', style: 'carton', pal: ['#43a047', '#1b5e20', '#ffffff', '#c8e6c9'], bg: 'waves', hero: 'bevSoybean',
    ing: ['water', 'soy', 'sugar', 'salt', 'calcium'], nut: [150, 17, 5, 120], allergens: ['soy'],
    desc: T('Lactasoy is another big Thai soy milk brand: smooth, mildly sweet and packed in a slim UHT carton with a straw.', 'แลคตาซอย น้ำนมถั่วเหลืองยูเอชทีเจ้าดังของไทย รสหวานละมุน ดื่มง่ายในกล่องพร้อมหลอด') },
  { id: 'ovaltine-uht', cat: 'dairy', brand: 'ovaltine', font: 'archivo', name: T('Chocolate Malt', 'ช็อกโกแลตมอลต์'), sub: T('UHT malt milk drink', 'นมยูเอชทีรสช็อกโกแลตมอลต์'),
    price: 12, size: ml(180), g: 'brick', style: 'carton', pal: ['#1565c0', '#0a3a7a', '#ffd54f', '#3e2723'], bg: 'dots', hero: 'bevMaltGlass', heroOpts: { tint: '#7a4320' },
    ing: ['milk', 'sugar', 'malt', 'cocoa', 'vitamins', 'stab'], nut: [135, 17, 3, 90], allergens: ['milk', 'wheat'],
    desc: T('Ovaltine’s chocolate malt milk, ready to drink: sweet, malty and a childhood classic in Thailand.', 'โอวัลตินรสช็อกโกแลตมอลต์แบบพร้อมดื่ม หวานมัน หอมมอลต์ รสชาติที่คุ้นเคยตั้งแต่เด็ก') },
  { id: 'milo-activgo', cat: 'dairy', brand: 'milo', font: 'anton', name: T('Activ-Go', 'แอคทีฟ-โก'), sub: T('UHT chocolate malt milk', 'นมยูเอชทีรสช็อกโกแลตมอลต์'),
    price: 12, size: ml(180), g: 'brick', style: 'carton', pal: ['#00963f', '#005a26', '#ffffff', '#3e2723'], bg: 'stripes', hero: 'bevMaltGlass', heroOpts: { tint: '#4a2a14', straw: '#e3141b' },
    ing: ['milk', 'sugar', 'malt', 'cocoa', 'vitamins', 'stab'], nut: [130, 17, 3, 90], allergens: ['milk', 'wheat'], pop: 3, promo: T('2 for ฿22', '2 กล่อง 22 บาท'),
    desc: T('Milo’s ready-to-drink chocolate malt milk, the Nestlé brand for sports-mad kids. Cold, sweet and crunchy-malty.', 'ไมโลแบบพร้อมดื่ม นมช็อกโกแลตมอลต์ ยูเอชที สำหรับเด็กสายกีฬา หวานมัน หอมมอลต์ ดื่มเย็นชื่นใจ') },
  { id: 'betagen-fruit', cat: 'dairy', brand: 'betagen', font: 'lilita', name: T('Mixed Fruit', 'ผลไม้รวม'), sub: T('Probiotic yoghurt drink', 'โยเกิร์ตพร้อมดื่มโพรไบโอติก'),
    price: 14, size: ml(180), g: 'pet250', style: 'pet', pal: ['#d81b60', '#880e4f', '#ffee58', '#f8e1e7'], bg: 'zig', hero: 'bevProbiotic', heroOpts: { tint: '#d81b60' }, capColor: '#d81b60',
    ing: [...YOG], nut: [110, 18, 1, 60], allergens: ['milk'],
    desc: T('Betagen is a Thai probiotic yoghurt drink from the Betagro group: sweet, tangy and served ice-cold.', 'เบทาเก้น โยเกิร์ตพร้อมดื่มโพรไบโอติกจากเครือเบทาโกร รสหวานอมเปรี้ยว ดื่มเย็น ๆ') },
];

// ================================================================================================ COFFEE
const CAN_COFFEE = ['water', 'sugar', 'milkp', 'coffee', 'sodiumb'];
const coffee = [
  { id: 'birdy-original', cat: 'coffee', brand: 'birdy', font: 'kanit', name: T('Original', 'ออริจินัล'), sub: T('Canned coffee drink', 'กาแฟกระป๋องพร้อมดื่ม'),
    price: 15, size: ml(180), g: 'can185', style: 'can', pal: ['#8a5a2b', '#4a2a10', '#ffd54a', '#3e2723'], bg: 'rays', hero: 'bevBeans',
    ing: [...CAN_COFFEE], nut: [95, 14, 1.5, 45], allergens: ['milk'], pop: 3, promo: T('3 for ฿40', '3 กระป๋อง 40 บาท'),
    desc: T('Birdy, from Ajinomoto, is Thailand’s classic canned coffee: sweet, milky and served cold from the chiller.', 'เบอร์ดี้ กาแฟกระป๋องรุ่นคลาสสิกจากอายิโนะโมะโต๊ะ หวานมัน หอมกาแฟ ดื่มเย็น ๆ') },
  { id: 'birdy-latte', cat: 'coffee', brand: 'birdy', font: 'kanit', name: T('Latte', 'ลาเต้'), sub: T('Canned latte drink', 'ลาเต้กระป๋องพร้อมดื่ม'),
    price: 15, size: ml(180), g: 'can185', style: 'can', pal: ['#e3b984', '#9a6a35', '#5d3a1a', '#fff0d6'], bg: 'dots', hero: 'bevLatteGlass',
    ing: [...CAN_COFFEE], nut: [100, 15, 2, 50], allergens: ['milk'], pop: 2,
    desc: T('The milkier Birdy: a soft, creamy latte in the same little 180 ml can.', 'เบอร์ดี้รสลาเต้ นมเข้มข้นขึ้น กาแฟละมุน ในกระป๋องเล็ก 180 มล.') },
  { id: 'nescafe-espresso', cat: 'coffee', brand: 'nescafe', font: 'archivo', name: T('Espresso Roast', 'เอสเปรสโซ โรสต์'), sub: T('Canned coffee drink', 'กาแฟกระป๋องพร้อมดื่ม'),
    price: 16, size: ml(180), g: 'can185', style: 'can', pal: ['#2b1810', '#120a06', '#e01f26', '#3e2723'], bg: 'stripes', hero: 'bevBeans', heroOpts: { tint: '#7a4a24' },
    ing: [...CAN_COFFEE], nut: [70, 10, 1, 50], allergens: ['milk'], pop: 2,
    desc: T('Nescafé’s canned Espresso Roast: dark, strong and only lightly sweet. A quick caffeine hit.', 'เนสกาแฟ เอสเปรสโซ โรสต์ แบบกระป๋อง กลิ่นกาแฟเข้ม รสเข้มข้น หวานน้อย') },
  { id: 'nescafe-latte', cat: 'coffee', brand: 'nescafe', font: 'archivo', name: T('Latte', 'ลาเต้'), sub: T('Canned latte drink', 'ลาเต้กระป๋องพร้อมดื่ม'),
    price: 16, size: ml(180), g: 'can185', style: 'can', pal: ['#f3e0c2', '#c89a62', '#e01f26', '#8a5a2a'], bg: 'waves', hero: 'bevLatteGlass',
    ing: [...CAN_COFFEE], nut: [100, 14, 2, 60], allergens: ['milk'],
    desc: T('A creamy Nescafé latte in a can: milky, gently sweet and easy to drink cold.', 'เนสกาแฟ ลาเต้แบบกระป๋อง นุ่มนวล หวานมัน ดื่มเย็น ๆ ง่าย') },
  { id: 'doichaang-latte', cat: 'coffee', brand: 'doichaang', font: 'chonburi', name: T('Arabica Latte', 'อาราบิก้า ลาเต้'), sub: T('Arabica coffee drink', 'เครื่องดื่มกาแฟอาราบิก้า'),
    price: 25, size: ml(180), g: 'can185', style: 'can', pal: ['#5a3a1a', '#2c1a0a', '#f0e0b8', '#3e2723'], bg: 'dots', hero: 'bevElephant', heroOpts: { body: '#eddcb6' },
    ing: ['water', 'milkp', 'sugar', 'coffee', 'sodiumb'], nut: [110, 14, 3, 60], allergens: ['milk'], isNew: true,
    desc: T('Doi Chaang coffee is grown by hill-tribe farmers in the mountains of Chiang Rai. This canned latte brings northern Thai arabica to the city.', 'กาแฟดอยช้างปลูกโดยเกษตรกรชาวเขาบนดอยในจังหวัดเชียงราย ลาเต้กระป๋องนี้พาอาราบิก้าจากภาคเหนือมาถึงเมืองกรุง') },
  { id: 'starbucks-doubleshot', cat: 'coffee', brand: 'starbucks', font: 'kanit', name: T('Doubleshot', 'ดับเบิ้ลช็อต'), sub: T('Espresso & cream', 'เอสเปรสโซ แอนด์ ครีม'),
    price: 45, size: ml(200), g: 'can185', style: 'can', pal: ['#00704a', '#00432e', '#f5ecd7', '#3e2723'], bg: 'plain', hero: 'bevBeans',
    ing: ['water', 'milk', 'sugar', 'coffee', 'sodiumb'], nut: [140, 19, 4, 90], allergens: ['milk'],
    desc: T('Starbucks Doubleshot: espresso with cream in a small can. Strong, creamy and sweet.', 'สตาร์บัคส์ ดับเบิ้ลช็อต เอสเปรสโซผสมครีมในกระป๋องเล็ก เข้ม มัน หวาน') },
  { id: 'amazon-latte', cat: 'coffee', brand: 'amazon', font: 'kanit', name: T('Latte', 'ลาเต้'), sub: T('Bottled coffee drink', 'กาแฟพร้อมดื่มแบบขวด'),
    price: 30, size: ml(280), g: 'pet345', style: 'pet', pal: ['#8b5a2b', '#4e2f14', '#fff0d0', '#b98a58'], bg: 'waves', hero: 'bevLatteGlass', capColor: '#0f6b3c', pop: 2,
    ing: ['water', 'milk', 'sugar', 'coffee', 'sodiumb'], nut: [150, 22, 3, 100], allergens: ['milk'],
    desc: T('Café Amazon, Thailand’s biggest coffee chain, started at PTT petrol stations. This bottled latte takes the shop flavour home.', 'คาเฟ่ อเมซอน ร้านกาแฟที่เติบโตจากปั๊มน้ำมัน ปตท. ลาเต้แบบขวด หอมกาแฟนมละมุน') },
  { id: 'allcafe-latte', cat: 'coffee', brand: 'allcafe', font: 'kanit', name: T('Iced Latte', 'ลาเต้เย็น'), sub: T('Bottled coffee drink', 'กาแฟพร้อมดื่มแบบขวด'),
    price: 25, size: ml(280), g: 'pet345', style: 'pet', pal: ['#4a2a12', '#2a170a', '#ffd9a8', '#9a6a3a'], bg: 'dots', hero: 'coffeeCup', heroOpts: { c1: '#6b3e1c' }, capColor: '#ffd9a8',
    ing: ['water', 'milk', 'sugar', 'coffee', 'sodiumb'], nut: [150, 22, 3, 100], allergens: ['milk'],
    desc: T('11 Café is 11 SEVEN’s own coffee counter; this is its iced latte in a bottle. Smooth, milky and cold.', 'อีเลฟเว่น คาเฟ่ คือกาแฟของอีเลฟเว่น เซเว่น ลาเต้เย็นแบบขวด รสนุ่ม นมหอม ดื่มเย็นชื่นใจ') },
  { id: 'allcafe-thaiicedcoffee', cat: 'coffee', brand: 'allcafe', font: 'kanit', name: T('Thai Iced Coffee', 'กาแฟเย็น'), sub: T('Sweet milk coffee', 'กาแฟใส่นม หวานมัน'),
    price: 25, size: ml(300), g: 'pet345', style: 'pet', pal: ['#6d4c41', '#3e2723', '#ffe0b2', '#8d6e63'], bg: 'rays', hero: 'bevThaiTea', heroOpts: { tint: '#6b3e1c', straw: '#4aa3e8' }, capColor: '#3e2723',
    ing: ['water', 'sugar', 'coffee', 'milkp', 'creamer'], nut: [190, 30, 3, 100], allergens: ['milk'],
    desc: T('Thai iced coffee (kafae yen) is strong, sweet and milky, usually poured over ice at a street stall. Here it comes ready in a bottle.', 'กาแฟเย็นสไตล์ไทย เข้ม หวานมัน ที่ปกติเสิร์ฟกับน้ำแข็งที่ร้านริมทาง ตอนนี้บรรจุขวดพร้อมดื่ม') },
];

// ================================================================================================ BEER
// The can / pint painters have no ABV line of their own (only style 'beer' does), so the strength is printed with the size.
// Set SIZE_HAS_ABV = false once gfx/pack_common.js sizeText() prints the ABV itself (see the proposed patch in the hand-off notes).
const SIZE_HAS_ABV = true;
const abvSize = (abv, v) => (SIZE_HAS_ABV ? { en: `${abv}% ABV · ${v} ml`, th: `แอลกอฮอล์ ${abv}% · ${v} มล.` } : ml(v));
const BEER = ['water', 'malt', 'hops', 'yeast'];
const LAGER = () => T('Lager Beer', 'เบียร์ลาเกอร์');
const beer = [
  { id: 'chang-classic', cat: 'beer', brand: 'chang', font: 'archivo', name: T('Classic', 'คลาสสิก'), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 62, size: ml(620), g: 'beer620', style: 'beer', pal: ['#0b3d2e', '#072b20', '#f1c40f', '#5a2c0d'], bg: 'plain', hero: 'bevElephant', capColor: '#d4a017', neck: '#0b3d2e',
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [260, 0, 0, 30], allergens: ['wheat'], pop: 3,
    desc: T('Chang (“elephant”) Classic is one of the best-selling beers in Thailand: light, crisp and made for cold beer with street food.', 'ช้าง คลาสสิก เบียร์ลาเกอร์ดื่มง่ายที่ขายดีที่สุดแบรนด์หนึ่งของไทย เข้ากับอาหารริมทางเย็น ๆ') },
  { id: 'chang-classic-can', cat: 'beer', brand: 'chang', font: 'archivo', name: T('Classic', 'คลาสสิก'), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 44, size: abvSize(5.0, 490), g: 'can490', style: 'can', pal: ['#0f5d3a', '#083a24', '#f1c40f', '#ffffff'], bg: 'rays', hero: 'bevElephant',
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [205, 0, 0, 25], allergens: ['wheat'], pop: 2,
    desc: T('The same Chang Classic in a big 490 ml can: easy to carry and quick to chill.', 'ช้าง คลาสสิก ในกระป๋องใหญ่ 490 มล. พกสะดวก แช่เย็นเร็ว') },
  { id: 'chang-coldbrew', cat: 'beer', brand: 'chang', font: 'archivo', name: T('Cold Brew', 'โคลด์ บรูว์'), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 64, size: ml(620), g: 'beer620', style: 'beer', pal: ['#0e7490', '#0a4a5e', '#e0f7fa', '#5a2c0d'], bg: 'waves', hero: 'snowflake', capColor: '#0e7490', neck: '#0e7490',
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [255, 0, 0, 30], allergens: ['wheat'], isNew: true,
    desc: T('A smoother, easy-drinking Chang lager in cool blue-green livery, made to be served ice-cold.', 'ช้าง เบียร์ลาเกอร์สูตรนุ่มลื่นคอ ดีไซน์สีฟ้าเขียวเย็นสบายตา ดื่มเย็นจัดแล้วสดชื่น') },
  { id: 'singha-bottle', cat: 'beer', brand: 'singha', font: 'archivo', name: LAGER(), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 66, size: ml(620), g: 'beer620', style: 'beer', pal: ['#101a3a', '#0a1128', '#e6b422', '#5a2c0d'], bg: 'plain', hero: 'lion', capColor: '#e6b422', neck: '#c9a227',
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [260, 0, 0, 30], allergens: ['wheat'], pop: 3,
    desc: T('Singha, named for the mythical lion, is Thailand’s oldest beer brand, brewed by Boon Rawd Brewery, founded in 1933.', 'สิงห์ เบียร์ตราสิงห์จากบุญรอดบริวเวอรี่ ผู้ก่อตั้งเมื่อ พ.ศ. 2476 รสเข้มกลมกล่อมแบบฉบับเบียร์ไทยดั้งเดิม') },
  { id: 'singha-can', cat: 'beer', brand: 'singha', font: 'archivo', name: LAGER(), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 48, size: abvSize(5.0, 490), g: 'can490', style: 'can', pal: ['#101a3a', '#0a1128', '#e6b422', '#ffffff'], bg: 'stripes', hero: 'lion',
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [205, 0, 0, 25], allergens: ['wheat'], pop: 2,
    desc: T('Singha lager in a 490 ml can, with the gold lion on navy blue.', 'เบียร์สิงห์กระป๋อง 490 มล. ตราสิงห์สีทองบนพื้นน้ำเงินเข้ม') },
  { id: 'leo-bottle', cat: 'beer', brand: 'leo', font: 'anton', name: LAGER(), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 58, size: ml(620), g: 'beer620', style: 'beer', pal: ['#c8102e', '#8f0a20', '#ffd54a', '#5a2c0d'], bg: 'plain', hero: 'leopard', capColor: '#c8102e', neck: '#c8102e',
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [260, 0, 0, 30], allergens: ['wheat'], pop: 3,
    desc: T('Leo, the leopard-labelled lager from Boon Rawd, is a popular easy-drinking beer for sharing.', 'ลีโอ เบียร์ตราเสือดาวจากบุญรอดบริวเวอรี่ ดื่มง่าย ราคาเป็นมิตร เหมาะกับวงเพื่อน') },
  { id: 'heineken-bottle', cat: 'beer', brand: 'heineken', font: 'righteous', name: LAGER(), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 52, size: ml(330), g: 'beer330', style: 'beer', pal: ['#0b6b2e', '#07461e', '#e21c21', '#1e5a2e'], bg: 'plain', body: '#1e5a2e', hero: 'bevRedStar', capColor: '#0b6b2e', neck: '#0f7a34',
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [140, 0, 0, 10], allergens: ['wheat'], pop: 2,
    desc: T('Heineken, the Dutch lager with the red star, is a familiar sight in Thai bars and convenience-store fridges.', 'ไฮเนเก้น เบียร์ลาเกอร์จากเนเธอร์แลนด์ สัญลักษณ์ดาวแดง รสสะอาด ขมนุ่ม พบได้ทั้งในบาร์และตู้แช่อีเลฟเว่น เซเว่น') },
  { id: 'tiger-can', cat: 'beer', brand: 'tiger', font: 'anton', name: LAGER(), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 40, size: abvSize(5.0, 330), g: 'can330', style: 'can', pal: ['#0a2a5e', '#061a3d', '#f4c542', '#ffffff'], bg: 'rays', hero: 'tiger', heroOpts: { c1: '#f28c1a' },
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [135, 0, 0, 10], allergens: ['wheat'],
    desc: T('Tiger Beer, first brewed in Singapore in 1932, is a light lager in a bright blue can.', 'ไทเกอร์ เบียร์ลาเกอร์ที่เริ่มผลิตครั้งแรกในสิงคโปร์เมื่อ พ.ศ. 2475 กระป๋องสีน้ำเงินสด ดื่มง่าย ซ่าสดชื่น') },
  { id: 'asahi-can', cat: 'beer', brand: 'asahi', font: 'archivo', name: T('Super Dry', 'ซุปเปอร์ ดราย'), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 55, size: abvSize(5.0, 330), g: 'can330', style: 'can', pal: ['#e4e9ee', '#aab3bd', '#1d3f8a', '#ffffff'], bg: 'plain', hero: 'sun', heroOpts: { c1: '#e60012' }, origin: 'jp',
    alcohol: true, abv: 5.0, ing: ['water', 'malt', 'rice', 'cornst', 'hops'], nut: [135, 0, 0, 10], allergens: ['wheat'],
    desc: T('Asahi Super Dry is the crisp, clean Japanese lager that kicked off the “dry beer” boom in 1987.', 'อาซาฮี ซุปเปอร์ ดราย เบียร์ลาเกอร์รสดรายสไตล์ญี่ปุ่น คมชัด ซ่าสะอาด ผู้จุดกระแสเบียร์ดรายตั้งแต่ พ.ศ. 2530') },
  { id: 'federbrau-bottle', cat: 'beer', brand: 'fed', font: 'chonburi', name: T('Premium Lager', 'พรีเมียม ลาเกอร์'), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 64, size: ml(620), g: 'beer620', style: 'beer', pal: ['#f0e6c8', '#c9b98a', '#0d3b66', '#5a2c0d'], bg: 'plain', hero: 'bevLozenge', capColor: '#0d3b66', neck: '#0d3b66',
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [260, 0, 0, 30], allergens: ['wheat'],
    desc: T('Federbräu is a premium lager dressed in Bavarian blue and white, sold in a tall 620 ml bottle.', 'เฟเดอร์บรอย เบียร์ลาเกอร์พรีเมียมลายฟ้า-ขาวสไตล์บาวาเรีย ขวดใหญ่ 620 มล. ดื่มง่าย รสนุ่ม') },
  { id: 'carlsberg-can', cat: 'beer', brand: 'carlsberg', font: 'chonburi', name: T('Danish Pilsner', 'เดนิช พิลส์เนอร์'), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 42, size: abvSize(5.0, 330), g: 'can330', style: 'can', pal: ['#00503c', '#003629', '#f3d27a', '#ffffff'], bg: 'zig', hero: 'crown',
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [140, 0, 0, 10], allergens: ['wheat'],
    desc: T('Carlsberg, the Danish pilsner brewed since 1847, comes in a green can marked with a golden crown.', 'คาร์ลสเบิร์ก เบียร์พิลส์เนอร์สัญชาติเดนมาร์ก ก่อตั้งเมื่อ พ.ศ. 2390 กระป๋องสีเขียวสัญลักษณ์มงกุฎทอง') },
  { id: 'cheers-bottle', cat: 'beer', brand: 'cheers', font: 'anton', name: LAGER(), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 55, size: ml(620), g: 'beer620', style: 'beer', pal: ['#e8a800', '#b57e00', '#7a0f0f', '#5a2c0d'], bg: 'plain', hero: 'beerMug', capColor: '#7a0f0f', neck: '#7a0f0f',
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [265, 0, 0, 30], allergens: ['wheat'],
    desc: T('Cheers is a budget-friendly Thai lager in a big 620 ml bottle, made for sharing over a meal.', 'เชียร์ส เบียร์ลาเกอร์ไทยขวดใหญ่ 620 มล. ราคาเป็นมิตร เหมาะกับวงกินข้าวกับเพื่อน') },
  { id: 'archa-can', cat: 'beer', brand: 'archa', font: 'archivo', name: LAGER(), sub: T('Lager beer', 'เบียร์ลาเกอร์'),
    price: 43, size: abvSize(5.0, 490), g: 'can490', style: 'can', pal: ['#1f7a4a', '#124d2e', '#f3e6a8', '#ffffff'], bg: 'dots', hero: 'bevBarley', heroOpts: { tint: '#e6b84a' },
    alcohol: true, abv: 5.0, ing: [...BEER], nut: [205, 0, 0, 25], allergens: ['wheat'],
    desc: T('Archa is a Thai lager in a 490 ml can with a light body and a crisp finish.', 'อาร์ช่า เบียร์ลาเกอร์ไทยกระป๋อง 490 มล. รสเบาสบาย ซ่าสดชื่น') },
  { id: 'hoegaarden-bottle', cat: 'beer', brand: 'hoegaarden', font: 'chonburi', name: T('Original White', 'ออริจินัล ไวท์'), sub: T('Belgian wheat beer', 'เบียร์ข้าวสาลีเบลเยียม'),
    price: 79, size: ml(330), g: 'beer330', style: 'beer', pal: ['#fbf6ea', '#d9cfae', '#1a5fa8', '#5a2c0d'], bg: 'plain', hero: 'lemon', heroOpts: { c1: '#ff9a1f' }, capColor: '#1a5fa8', neck: '#1a5fa8',
    origin: 'be', ean: '541028304715', alcohol: true, abv: 4.9, ing: ['water', 'malt', 'wheat', 'hops', 'yeast', 'coriander', 'orangepeel'], nut: [130, 0, 0, 10], allergens: ['wheat'],
    desc: T('Hoegaarden is a cloudy Belgian wheat beer brewed with coriander and orange peel: fruity, spicy and refreshing.', 'ฮูการ์เด้น เบียร์ข้าวสาลีสไตล์เบลเยียม ปรุงกลิ่นด้วยผักชีและเปลือกส้ม ขุ่น หอมผลไม้ ดื่มสดชื่น') },
];

// ================================================================================================ SPIRITS
const spirits = [
  { id: 'sangsom-350', cat: 'spirits', brand: 'sangsom', font: 'chonburi', name: T('Thai Rum', 'รัมไทย'), sub: T('Spirit, 40% alcohol', 'สุรากลั่น 40 ดีกรี'),
    price: 165, size: abvSize(40, 350), g: 'flip-s', style: 'pet', pal: ['#b0121b', '#7a0a12', '#e8c25a', '#c98a3a'], bg: 'plain', body: '#c98a3a', hero: 'sun', capColor: '#e8c25a',
    alcohol: true, abv: 40, ing: ['neutral', 'molasses', 'water', 'caramel'], nut: [770, 0, 0, 5], pop: 2,
    desc: T('Sang Som is Thailand’s best-known rum-style spirit, usually mixed with soda and ice and shared from a bucket at parties.', 'แสงโสม สุราสีอำพันยอดนิยมของไทย นิยมผสมโซดาและน้ำแข็งดื่มสังสรรค์กับเพื่อน ๆ') },
  { id: 'hongthong-350', cat: 'spirits', brand: 'hongthong', font: 'chonburi', name: T('Thai Whisky', 'วิสกี้ไทย'), sub: T('Spirit, 35% alcohol', 'สุรากลั่น 35 ดีกรี'),
    price: 135, size: abvSize(35, 350), g: 'flip-s', style: 'pet', pal: ['#0f2a5a', '#081a3c', '#f2c14e', '#a8631e'], bg: 'plain', body: '#a8631e', hero: 'bevSwan', capColor: '#f2c14e',
    alcohol: true, abv: 35, ing: ['neutral', 'molasses', 'water', 'caramel'], nut: [680, 0, 0, 5], pop: 2,
    desc: T('Hong Thong (“golden swan”) is a Thai whisky-style spirit, popular for mixing with soda or cola.', 'หงส์ทอง สุราแบบวิสกี้สัญชาติไทย มีตราหงส์ทอง นิยมผสมโซดาหรือโคล่า') },
  { id: 'mekhong-350', cat: 'spirits', brand: 'mekhong', font: 'chonburi', name: T('Thai Spirit', 'สุราไทย'), sub: T('Spirit, 35% alcohol', 'สุรากลั่น 35 ดีกรี'),
    price: 140, size: abvSize(35, 350), g: 'flip-s', style: 'pet', pal: ['#1c1410', '#0d0a08', '#e8c25a', '#8a5a1a'], bg: 'plain', body: '#8a5a1a', hero: 'mountain', heroOpts: { c1: '#e8c25a' }, capColor: '#e8c25a',
    alcohol: true, abv: 35, ing: ['neutral', 'molasses', 'rice', 'herbs', 'water'], nut: [680, 0, 0, 5],
    desc: T('Mekhong, named for the Mekong river, is a Thai spirit flavoured with herbs and spices, usually mixed with cola or soda over ice.', 'แม่โขง สุราไทยกลิ่นสมุนไพรและเครื่องเทศ นิยมผสมโคล่าหรือโซดาแล้วดื่มกับน้ำแข็ง') },
  { id: 'regency-350', cat: 'spirits', brand: 'regency', font: 'chonburi', name: T('Brandy', 'บรั่นดี'), sub: T('Spirit, 35% alcohol', 'สุรากลั่น 35 ดีกรี'),
    price: 145, size: abvSize(35, 350), g: 'flip-s', style: 'pet', pal: ['#5a0f1e', '#3a0a13', '#f2d27a', '#7a3a10'], bg: 'plain', body: '#7a3a10', hero: 'crown', heroOpts: { c1: '#f2c14e' }, capColor: '#f2d27a',
    alcohol: true, abv: 35, ing: ['neutral', 'wine', 'water', 'caramel'], nut: [680, 0, 0, 5], allergens: ['sulphite'],
    desc: T('Regency is a Thai brandy sold in a flat pint bottle, popular for mixing with soda or cola.', 'รีเจนซี่ บรั่นดีสัญชาติไทยในขวดแบน นิยมผสมโซดาหรือโคล่า') },
  { id: 'spy-classic', cat: 'spirits', brand: 'spy', font: 'anton', name: T('Classic', 'คลาสสิก'), sub: T('Wine cooler', 'ไวน์คูลเลอร์'),
    price: 45, size: ml(275), g: 'beer330', style: 'beer', pal: ['#b3126b', '#7a0a48', '#ffd34a', '#5a1230'], bg: 'plain', body: '#5a1230', hero: 'grape', heroOpts: { c1: '#7b3fb0' }, capColor: '#ffd34a', neck: '#b3126b',
    alcohol: true, abv: 5, ing: ['water', 'wine', 'sugar', 'citric', 'flavour', 'colour'], nut: [190, 25, 0, 15], allergens: ['sulphite'],
    desc: T('Spy is a fruity, low-alcohol Thai wine cooler with a cheerful label. Sweet, fizzy-light and easy to drink.', 'สปาย ไวน์คูลเลอร์แอลกอฮอล์ต่ำ รสหวานหอมผลไม้ ดื่มง่าย ฉลากสดใส') },
  { id: 'highball-rumsoda', cat: 'spirits', brand: 'highball', font: 'anton', name: T('Rum & Soda', 'รัมโซดา'), sub: T('Ready-to-drink highball', 'ค็อกเทลพร้อมดื่ม'),
    price: 45, size: abvSize(5, 330), g: 'can330', style: 'can', pal: ['#0f3a5e', '#08233a', '#ffd34a', '#ffffff'], bg: 'waves', hero: 'iceGlass', heroOpts: { c1: '#f3d98a', slice: '#8fd43a', straw: '#e8261c' }, isNew: true,
    alcohol: true, abv: 5, ing: ['water', 'neutral', 'sugar', 'citric', 'co2', 'flavour'], nut: [150, 6, 0, 20],
    desc: T('A ready-to-drink Thai rum and soda highball in a can: fizzy, light and served ice-cold.', 'รัมโซดาพร้อมดื่มสไตล์ไทยในกระป๋อง ซ่า เบา ดื่มเย็นจัด') },
];

export default [...tea, ...juice, ...dairy, ...coffee, ...beer, ...spirits];

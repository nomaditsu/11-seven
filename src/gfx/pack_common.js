// Shared building blocks for procedural packaging art. All coordinates are in centimetres.
import { lang, pick, pick2 } from '../core/i18n.js';
import { fitText, langText, fillRR, circle, ellipse, burst, poly, linGrad, radGrad, stripes, rays, dots, waves, zigzag, gloss, grain, rrPath, hasThai } from './draw.js';
import { drawLogo } from './logos.js';
import { BRANDS } from '../data/brands.js';
import { rng, hashStr, darken, lighten, contrastText, alpha, mix, TAU, toThaiDigits } from '../core/util.js';

// deterministic per-SKU random source
export const skuRng = (sku, salt = 0) => rng(hashStr(sku.id) + salt * 7919);

// ---------------------------------------------------------------- backgrounds
export function paintBg(ctx, w, h, sku, variant) {
  const [c1, c2, c3] = sku.pal;
  const r = skuRng(sku, 3);
  const v = variant ?? sku.bg ?? ['rays', 'stripes', 'dots', 'waves', 'zig', 'plain', 'rays'][Math.floor(r() * 7)];
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, h, [[0, c1], [1, c2]]);
  ctx.fillRect(0, 0, w, h);
  switch (v) {
    case 'rays': rays(ctx, w / 2, h * 0.55, Math.hypot(w, h), 18, 'rgba(255,255,255,.13)'); break;
    case 'stripes': stripes(ctx, 0, 0, w, h, { angle: -0.6, gap: w * 0.16, width: w * 0.07, color: 'rgba(255,255,255,.14)' }); break;
    case 'dots': dots(ctx, 0, 0, w, h, w * 0.09, w * 0.028, 'rgba(255,255,255,.18)'); break;
    case 'waves': waves(ctx, 0, h * 0.62, w, h * 0.5, h * 0.03, w * 0.5, 'rgba(255,255,255,.12)'); waves(ctx, 0, h * 0.74, w, h * 0.5, h * 0.028, w * 0.4, 'rgba(0,0,0,.09)', 1.5); break;
    case 'zig': zigzag(ctx, 0, h * 0.86, w, h * 0.06, 8, 'rgba(255,255,255,.2)'); stripes(ctx, 0, 0, w, h * 0.85, { angle: 1.2, gap: w * 0.2, width: w * 0.03, color: 'rgba(255,255,255,.1)' }); break;
    case 'burst': burst(ctx, w / 2, h * 0.5, w * 0.75, w * 0.5, 16, 'rgba(255,255,255,.14)', null); break;
    default: break;
  }
  // soft light in the centre to make the hero pop
  ctx.fillStyle = radGrad(ctx, w / 2, h * 0.5, 0, w * 0.7, [[0, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(0, 0, w, h);
}

// Foil crimp strip (pillow-bag seals)
export function foilStrip(ctx, x, y, w, h, tint = '#d5d9dd') {
  ctx.fillStyle = linGrad(ctx, 0, y, 0, y + h, [[0, lighten(tint, 0.35)], [0.5, tint], [1, darken(tint, 0.18)]]);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 0.05;
  for (let px = x + 0.12; px < x + w; px += 0.16) { ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.45)';
  for (let px = x + 0.2; px < x + w; px += 0.32) { ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke(); }
}

// ---------------------------------------------------------------- text plates
export function nameFont(sku) { return sku.font || 'mitr'; }

// "Grilled Seaweed · Original" -> two lines
const capWords = (t) => t.toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase());
export function fullTitle(sku) {
  const B = BRANDS[sku.brand], nm = sku.name;
  if (!B || !B.text || !nm) return nm;
  const join = (name, brand) => (!brand || name.toLowerCase().includes(brand.toLowerCase()) ? name : `${brand} ${name}`);
  const flat = (t) => t.replace(' · ', ' ');
  return { en: join(flat(nm.en), capWords(B.text)), th: join(flat(nm.th), B.th || B.text) };
}
export function splitDot(v) {
  if (!v || typeof v === 'string') return (v || '').replace(' · ', '\n');
  return { en: v.en.replace(' · ', '\n'), th: v.th.replace(' · ', '\n') };
}
// Product / flavour name on a plate. shape: ribbon | pill | rect | burst | none
export function namePlate(ctx, sku, x, y, w, h, o = {}) {
  const pal = sku.pal;
  const bg = o.bg || pal[2], shape = o.shape || sku.plate || 'pill';
  const fg = o.fg || contrastText(bg);
  ctx.save();
  if (shape === 'ribbon') {
    const t = h * 0.22;
    poly(ctx, [[x - t * 0.6, y + t], [x + t * 0.5, y + t], [x + t * 0.5, y + h + t * 0.6], [x - t * 0.6, y + h + t * 0.6], [x - t * 0.15, y + h * 0.5 + t]], darken(bg, 0.28));
    poly(ctx, [[x + w + t * 0.6, y + t], [x + w - t * 0.5, y + t], [x + w - t * 0.5, y + h + t * 0.6], [x + w + t * 0.6, y + h + t * 0.6], [x + w + t * 0.15, y + h * 0.5 + t]], darken(bg, 0.28));
    fillRR(ctx, x, y, w, h, h * 0.12, bg, darken(bg, 0.35), h * 0.04);
  } else if (shape === 'burst') {
    burst(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 0.6, Math.max(w, h) * 0.46, 14, bg, darken(bg, 0.4), h * 0.05);
  } else if (shape === 'rect') {
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  } else if (shape !== 'none') {
    fillRR(ctx, x, y, w, h, h * 0.5, bg, o.ring || darken(bg, 0.35), h * 0.045);
  }
  ctx.restore();
  // "A · B" breaks the line in the primary language only; the small secondary line stays on one line
  const nm = splitDot(sku.name);
  if (lang.second && nm && typeof nm === 'object') nm[lang.second] = nm[lang.second].replace('\n', ' ');
  return langText(ctx, nm, x + w * 0.06, y + h * 0.08, w * 0.88, h * 0.84, {
    family: o.family || nameFont(sku), weight: o.weight || 700, size: h * 0.72, color: fg, lines: o.lines || 2, lines2: 1, split: 0.62,
    shadow: o.noShadow ? null : ['rgba(0,0,0,.28)', 0, h * 0.02, h * 0.04],
  });
}

// Size text ("48 g" / "48 ก.")
export function sizeText(ctx, sku, x, y, w, h, color = '#fff', o = {}) {
  if (!sku.size) return;
  let txt = pick(sku.size);
  if (sku.alcohol && sku.abv && sku.style !== 'beer') txt = `${sku.abv}% ${pick({ en: 'ABV', th: 'แอลกอฮอล์' })} · ${txt}`;
  fitText(ctx, txt, x, y, w, h, { family: 'kanit', weight: 700, size: h, color, align: o.align || 'left', stroke: o.stroke, strokeW: h * 0.18 });
}

// "NEW" style corner burst
export function newBurst(ctx, x, y, r, text, fill = '#ffe600', fg = '#d81f26') {
  burst(ctx, x, y, r, r * 0.78, 14, fill, darken(fill, 0.35), r * 0.06, 0.2);
  fitText(ctx, text, x - r * 0.62, y - r * 0.38, r * 1.24, r * 0.76, { family: 'lilita', weight: 400, size: r, color: fg, rot: -0.2, stroke: '#fff', strokeW: r * 0.08 });
}

// Thai-style GDA row: energy / sugar / fat / sodium
export function nutriDefaults(sku) {
  if (sku.nut) return sku.nut;
  const r = skuRng(sku, 9);
  const t = {
    chips: [150, 0.5, 9, 190], snack: [130, 2, 5, 150], seaweed: [60, 1, 3, 180], noodle: [340, 3, 14, 1400], cup: [320, 3, 13, 1300],
    candy: [90, 20, 0, 5], choc: [220, 20, 13, 30], biscuit: [180, 9, 8, 100], bakery: [260, 12, 9, 260], drink: [90, 20, 0, 30], water: [0, 0, 0, 0],
    energy: [60, 14, 0, 20], dairy: [130, 12, 4, 100], beer: [150, 0, 0, 10], meal: [520, 4, 16, 1250], sandwich: [280, 5, 11, 520], dessert: [220, 30, 5, 30],
    ice: [180, 20, 9, 60], other: [100, 5, 3, 100],
  }[sku.ntype || 'other'] || [100, 5, 3, 100];
  const k = 0.85 + r() * 0.3;
  return t.map((v, i) => (i === 3 ? Math.round((v * k) / 10) * 10 : i === 0 ? Math.round(v * k / 5) * 5 : Math.round(v * k * 10) / 10));
}
export function gdaRow(ctx, sku, x, y, w, h, o = {}) {
  const n = nutriDefaults(sku);
  const labels = [{ th: 'พลังงาน', en: 'Energy' }, { th: 'น้ำตาล', en: 'Sugar' }, { th: 'ไขมัน', en: 'Fat' }, { th: 'โซเดียม', en: 'Sodium' }];
  const units = ['kcal', 'g', 'g', 'mg'];
  const pct = [n[0] / 2000, n[1] / 65, n[2] / 65, n[3] / 2400].map((v) => Math.min(99, Math.round(v * 100)));
  const bw = w / 4;
  const bg = o.bg || 'rgba(255,255,255,.94)';
  for (let i = 0; i < 4; i++) {
    const bx = x + i * bw + bw * 0.04, ww = bw * 0.92;
    fillRR(ctx, bx, y, ww, h, h * 0.14, bg, o.ring || '#555', h * 0.02);
    ctx.fillStyle = pct[i] > 30 ? '#e63946' : pct[i] > 12 ? '#ffb703' : '#52b788';
    rrPath(ctx, bx, y, ww, h * 0.22, [h * 0.14, h * 0.14, 0, 0]); ctx.fill();
    fitText(ctx, pick(labels[i]), bx + ww * 0.05, y + h * 0.01, ww * 0.9, h * 0.2, { family: 'sarabun', weight: 700, size: h * 0.18, color: '#fff' });
    fitText(ctx, String(n[i]), bx + ww * 0.05, y + h * 0.26, ww * 0.9, h * 0.34, { family: 'kanit', weight: 700, size: h * 0.34, color: '#222' });
    fitText(ctx, `${units[i]}  ${pct[i]}%`, bx + ww * 0.05, y + h * 0.62, ww * 0.9, h * 0.22, { family: 'sarabun', weight: 700, size: h * 0.17, color: '#555' });
  }
}

// ---------------------------------------------------------------- dates, codes, texts for backs
const CAT_LIFE = { chips: 240, snack: 240, seaweed: 300, noodle: 240, cup: 240, candy: 540, choc: 300, biscuit: 270, bakery: 5, drink: 300, water: 730, energy: 540, dairy: 30, beer: 365, meal: 2, sandwich: 2, dessert: 4, ice: 540, other: 720 };
export function dateStrings(sku) {
  const base = new Date();
  const r = skuRng(sku, 5);
  const life = CAT_LIFE[sku.ntype || 'other'] || 365;
  const mfg = new Date(base.getTime() - (2 + Math.floor(r() * Math.min(60, life * 0.3))) * 864e5);
  const exp = new Date(mfg.getTime() + life * 864e5);
  const f = (d, th) => {
    const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = th ? String(d.getFullYear() + 543) : String(d.getFullYear()).slice(2);
    return `${dd}/${mm}/${yy}`;
  };
  return { mfg: { en: f(mfg, false), th: f(mfg, true) }, exp: { en: f(exp, false), th: f(exp, true) } };
}
export function fdaNumber(sku) {
  const r = skuRng(sku, 11);
  const d = (n) => String(Math.floor(r() * Math.pow(10, n))).padStart(n, '0');
  return `${10 + Math.floor(r() * 30)}-${1 + Math.floor(r() * 2)}-${d(5)}-${1 + Math.floor(r() * 9)}-${d(4)}`;
}
export function ean(sku) {
  if (sku.ean) return sku.ean;
  const r = skuRng(sku, 13);
  const pre = sku.origin && ORIGIN_PREFIX[sku.origin] ? ORIGIN_PREFIX[sku.origin] : '885';
  let s = pre;
  while (s.length < 12) s += Math.floor(r() * 10);
  return s;
}
const ORIGIN_PREFIX = { jp: '4901', kr: '8801', id: '8993', my: '9556', us: '0490', de: '4001', ch: '7613', nl: '8712', be: '5410', dk: '5711', sg: '8888', cn: '6901', au: '9300', uk: '5000', it: '8000', vn: '8934' };
export const ORIGIN_NAME = {
  th: { en: 'Thailand', th: 'ประเทศไทย' }, jp: { en: 'Japan', th: 'ประเทศญี่ปุ่น' }, kr: { en: 'South Korea', th: 'ประเทศเกาหลีใต้' }, id: { en: 'Indonesia', th: 'ประเทศอินโดนีเซีย' },
  my: { en: 'Malaysia', th: 'ประเทศมาเลเซีย' }, us: { en: 'USA', th: 'สหรัฐอเมริกา' }, de: { en: 'Germany', th: 'ประเทศเยอรมนี' }, ch: { en: 'Switzerland', th: 'ประเทศสวิตเซอร์แลนด์' },
  nl: { en: 'Netherlands', th: 'ประเทศเนเธอร์แลนด์' }, be: { en: 'Belgium', th: 'ประเทศเบลเยียม' }, dk: { en: 'Denmark', th: 'ประเทศเดนมาร์ก' }, sg: { en: 'Singapore', th: 'ประเทศสิงคโปร์' }, cn: { en: 'China', th: 'ประเทศจีน' },
  au: { en: 'Australia', th: 'ประเทศออสเตรเลีย' }, uk: { en: 'United Kingdom', th: 'สหราชอาณาจักร' }, it: { en: 'Italy', th: 'ประเทศอิตาลี' }, vn: { en: 'Vietnam', th: 'ประเทศเวียดนาม' },
};

// Bilingual phrases used on the backs of packages
export const BACK = {
  ing: { en: 'Ingredients', th: 'ส่วนประกอบ' }, contains: { en: 'Contains', th: 'มีส่วนผสมของ' }, nutri: { en: 'Nutrition facts (per pack)', th: 'ข้อมูลโภชนาการ (ต่อ 1 หน่วยบริโภค)' },
  energy: { en: 'Energy', th: 'พลังงาน' }, fat: { en: 'Fat', th: 'ไขมัน' }, sugar: { en: 'Sugars', th: 'น้ำตาล' }, sodium: { en: 'Sodium', th: 'โซเดียม' },
  madeIn: { en: 'Made in', th: 'ผลิตใน' }, fda: { en: 'Thai FDA Reg. No.', th: 'เลขสารบบอาหาร' }, mfg: { en: 'MFG', th: 'ผลิต' }, exp: { en: 'EXP', th: 'หมดอายุ' },
  store: { en: 'Store in a cool, dry place. Once opened, consume promptly.', th: 'เก็บในที่แห้งและเย็น เมื่อเปิดแล้วควรบริโภคให้หมดโดยเร็ว' },
  storeCold: { en: 'Keep refrigerated at 0–5 °C.', th: 'เก็บในตู้เย็น 0–5 °C' },
  heat: { en: 'Microwave 700 W for 2–3 minutes before eating. Remove the lid film first.', th: 'อุ่นไมโครเวฟ 700 วัตต์ 2–3 นาที ก่อนรับประทาน (เปิดฝาฟิล์มก่อน)' },
  dispose: { en: 'Please dispose of packaging responsibly.', th: 'โปรดทิ้งบรรจุภัณฑ์ลงในถังขยะ' },
  co: { en: 'Made for 11 SEVEN by Siam Foods Industry Co., Ltd., Samut Prakan.', th: 'ผลิตให้อีเลฟเว่น เซเว่น โดย บริษัท สยามฟู้ดส์ อินดัสทรี จำกัด จ.สมุทรปราการ' },
  care: { en: 'Customer care: 02-000-0000', th: 'สอบถามข้อมูลเพิ่มเติม โทร. 02-000-0000' },
  alcW1: { en: 'Alcohol impairs driving ability.', th: 'เครื่องดื่มแอลกอฮอล์ทำให้ความสามารถในการขับขี่ลดลง' },
  alcW2: { en: 'Do not sell to persons under 20 years of age.', th: 'ห้ามจำหน่ายให้ผู้มีอายุต่ำกว่า 20 ปี' },
  energyW: { en: 'Not recommended for children, pregnant or breast-feeding women. Do not exceed 2 bottles a day.', th: 'ไม่เหมาะสำหรับเด็ก หญิงมีครรภ์ และหญิงให้นมบุตร ไม่ควรดื่มเกินวันละ 2 ขวด' },
  shake: { en: 'Shake well before drinking.', th: 'เขย่าก่อนดื่ม' },
  recycle: { en: 'Recyclable', th: 'รีไซเคิลได้' },
  keepAway: { en: 'Keep out of reach of children.', th: 'เก็บให้พ้นมือเด็ก' },
  external: { en: 'For external use only.', th: 'ใช้ภายนอกเท่านั้น' },
  caution: { en: 'Caution', th: 'ข้อควรระวัง' },
  reg: { en: 'Reg. No.', th: 'เลขทะเบียน' },
};
// Caution text printed instead of a food nutrition table on non-food packs (household / care / health / misc).
// A SKU can override it with `warn: T(en, th)`.
const NONFOOD_WARN = {
  household: { en: 'Keep out of reach of children. Avoid contact with eyes; if it happens, rinse with clean water.', th: 'เก็บให้พ้นมือเด็ก หลีกเลี่ยงการสัมผัสดวงตา หากถูกให้ล้างด้วยน้ำสะอาด' },
  care: { en: 'For external use only. Stop using if irritation occurs. Keep out of reach of children.', th: 'ใช้ภายนอกเท่านั้น หากเกิดการระคายเคืองให้หยุดใช้ เก็บให้พ้นมือเด็ก' },
  health: { en: 'Read the leaflet before use. If symptoms persist, consult a doctor. Keep out of reach of children.', th: 'อ่านฉลากก่อนใช้ หากอาการไม่ดีขึ้นควรปรึกษาแพทย์ เก็บให้พ้นมือเด็ก' },
  misc: { en: 'Keep away from water and heat. Keep out of reach of small children.', th: 'เก็บให้พ้นความชื้นและความร้อน เก็บให้พ้นมือเด็กเล็ก' },
};

// Back-of-pack panel (used for bag/box backs and the "rear" of wrapped bottles/cans)
export function paintBackPanel(ctx, w, h, sku, o = {}) {
  const dark = o.dark ?? false;
  const bg = o.bg || (dark ? '#20232a' : '#fbf8ee');
  const fg = dark ? '#f2f2f2' : '#262626';
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const [c1, , c3] = sku.pal;
  ctx.fillStyle = c1; ctx.fillRect(0, 0, w, h * 0.13);
  const pad = w * 0.06;
  const code = lang.code, second = lang.second;
  const t = (v) => pick(v);
  let y = h * 0.015;
  langText(ctx, fullTitle(sku), pad, y, w - pad * 2, h * 0.105, { family: 'kanit', weight: 700, size: h * 0.09, color: contrastText(c1), lines: 1, lines2: 1, split: 0.65 });
  y = h * 0.15;
  // ingredients
  const ingKeys = sku.ing && sku.ing.length ? sku.ing : ['water'];
  const ingText = (c) => ingKeys.map((k) => (INGREF.get()[k] ? INGREF.get()[k][c] : k)).join(c === 'th' ? ', ' : ', ');
  const paras = [
    { title: BACK.ing, txt: { en: ingText('en'), th: ingText('th') }, hh: 0.2 },
  ];
  if (sku.allergens && sku.allergens.length) paras.push({ title: BACK.contains, txt: { en: sku.allergens.map((k) => ALG.get()[k]?.en || k).join(', '), th: sku.allergens.map((k) => ALG.get()[k]?.th || k).join(', ') }, hh: 0.075, bold: true });
  for (const p of paras) {
    const ph = h * p.hh;
    const head = pick(p.title) + (lang.second && pick2(p.title) ? ' / ' + pick2(p.title) : '') + ': ';
    const body = t(p.txt) + (second ? '\n' + pick2(p.txt) : '');
    fitText(ctx, head + body, pad, y, w - pad * 2, ph, { family: 'sarabun', weight: p.bold ? 700 : 500, size: h * 0.045, color: fg, align: 'left', valign: 'top', lines: second ? 7 : 5, min: h * 0.022 });
    y += ph + h * 0.012;
  }
  // nutrition table (food) or a caution box (non-food: household / care / health / misc)
  const nonFood = (sku.ntype || 'other') === 'other';
  const th = h * 0.2;
  if (nonFood) {
    const warn = sku.warn || NONFOOD_WARN[sku.cat] || NONFOOD_WARN.household;
    ctx.fillStyle = dark ? '#2c3038' : '#fff'; ctx.fillRect(pad, y, w - pad * 2, th);
    ctx.strokeStyle = fg; ctx.lineWidth = h * 0.006; ctx.strokeRect(pad, y, w - pad * 2, th);
    fitText(ctx, pick(BACK.caution) + (second ? ' / ' + pick2(BACK.caution) : ''), pad * 1.3, y + th * 0.03, w - pad * 2.6, th * 0.2, { family: 'sarabun', weight: 700, size: th * 0.18, color: fg, align: 'left' });
    fitText(ctx, pick(warn) + (second ? '\n' + pick2(warn) : ''), pad * 1.3, y + th * 0.26, w - pad * 2.6, th * 0.7, { family: 'sarabun', weight: 500, size: th * 0.16, color: fg, align: 'left', valign: 'top', lines: second ? 7 : 5, min: th * 0.08 });
  } else {
    const n = nutriDefaults(sku);
    const rows = [[BACK.energy, `${n[0]} kcal`], [BACK.fat, `${n[2]} g`], [BACK.sugar, `${n[1]} g`], [BACK.sodium, `${n[3]} mg`]];
    ctx.fillStyle = dark ? '#2c3038' : '#fff'; ctx.fillRect(pad, y, w - pad * 2, th);
    ctx.strokeStyle = fg; ctx.lineWidth = h * 0.006; ctx.strokeRect(pad, y, w - pad * 2, th);
    fitText(ctx, pick(BACK.nutri), pad * 1.3, y + th * 0.02, w - pad * 2.6, th * 0.2, { family: 'sarabun', weight: 700, size: th * 0.18, color: fg, align: 'left' });
    rows.forEach((r, i) => {
      const ry = y + th * (0.24 + i * 0.19);
      ctx.strokeStyle = 'rgba(128,128,128,.4)'; ctx.lineWidth = h * 0.003; ctx.beginPath(); ctx.moveTo(pad * 1.3, ry); ctx.lineTo(w - pad * 1.3, ry); ctx.stroke();
      fitText(ctx, pick(r[0]), pad * 1.3, ry, (w - pad * 2.6) * 0.6, th * 0.18, { family: 'sarabun', weight: 500, size: th * 0.16, color: fg, align: 'left' });
      fitText(ctx, r[1], pad * 1.3 + (w - pad * 2.6) * 0.6, ry, (w - pad * 2.6) * 0.4, th * 0.18, { family: 'sarabun', weight: 700, size: th * 0.16, color: fg, align: 'right' });
    });
  }
  y += th + h * 0.012;
  // footer text
  const d = dateStrings(sku);
  const origin = ORIGIN_NAME[sku.origin || 'th'];
  const foot = `${pick(BACK.madeIn)} ${pick(origin)}   ·   ${pick(nonFood ? BACK.reg : BACK.fda)} ${fdaNumber(sku)}\n${pick(BACK.mfg)} ${pick(d.mfg)}   ${pick(BACK.exp)} ${pick(d.exp)}`;
  const fh = h - y - h * 0.02;
  fitText(ctx, foot, pad, y, (w - pad * 2) * 0.58, Math.min(fh, h * 0.15), { family: 'sarabun', weight: 700, size: h * 0.04, color: fg, align: 'left', valign: 'top', lines: 3, min: h * 0.02 });
  // barcode
  return { barcodeRect: [pad + (w - pad * 2) * 0.6, y, (w - pad * 2) * 0.4, Math.min(fh, h * 0.16)] };
}

// late-bound refs to the dictionaries (avoids a circular import at module load)
import { ING, ALLERGEN } from '../data/ingredients.js';
const INGREF = { get: () => ING };
const ALG = { get: () => ALLERGEN };

export { drawLogo, BRANDS };

// Style painters: turn an SKU spec into the artwork for each face of its package (units = cm).
import { lang, pick, pick2 } from '../core/i18n.js';
import { fitText, langText, fillRR, circle, ellipse, burst, poly, linGrad, radGrad, stripes, dots, waves, gloss, rrPath, drawBarcode, ean13, rays } from './draw.js';
import { drawIllus } from './illus.js';
import { drawLogo } from './logos.js';
import { GEO, PROFILES } from '../data/shapes.js';
import {
  paintBg, foilStrip, namePlate, sizeText, newBurst, gdaRow, paintBackPanel, skuRng, nameFont, ean, BACK, ORIGIN_NAME, dateStrings, splitDot,
} from './pack_common.js';
import { darken, lighten, contrastText, alpha, mix, TAU } from '../core/util.js';

const heroOpts = (sku) => ({ c1: sku.pal[2], c2: sku.pal[3] || sku.pal[1], ...(sku.heroOpts || {}) });
const hasTh = () => lang.mode !== 'en';

function drawBarcodeFor(ctx, sku, rect) {
  const [x, y, w, h] = rect;
  drawBarcode(ctx, ean13(ean(sku)), x, y, w, Math.max(h, w * 0.4), '#111', '#fff', true);
}

// ================================================================================= BAGS
export function bagFront(ctx, w, h, sku) {
  const seal = Math.min(0.9, h * 0.055);
  const portrait = h >= w * 1.05;
  const body = h - seal * 2;
  const st = sku.style;
  // seals first (drawn under)
  ctx.fillStyle = sku.pal[1]; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(0, seal, w, body); ctx.clip(); ctx.translate(0, seal);
  paintBg(ctx, w, body, sku);
  if (portrait) {
    const logoH = body * (st === 'noodle' ? 0.17 : 0.16);
    drawLogo(ctx, sku.brand, w / 2, body * 0.1 + logoH / 2 - body * 0.02, w * 0.8, logoH);
    const heroY = body * (st === 'noodle' ? 0.4 : 0.4), heroS = w * (st === 'noodle' ? 0.86 : 0.74);
    ctx.fillStyle = radGrad(ctx, w / 2, heroY, 0, heroS * 0.62, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, heroY - heroS * 0.7, w, heroS * 1.4);
    drawIllus(ctx, sku.hero, w / 2, heroY, heroS, heroOpts(sku));
    const py = body * 0.6;
    namePlate(ctx, sku, w * 0.06, py, w * 0.88, body * 0.17, { shape: sku.plate || (st === 'noodle' ? 'ribbon' : 'pill') });
    if (sku.sub) langText(ctx, sku.sub, w * 0.06, py + body * 0.185, w * 0.88, body * 0.06, { family: 'kanit', weight: 700, size: body * 0.05, color: contrastText(sku.pal[1]), lines: 1, lines2: 1, split: 0.62, stroke: 'rgba(0,0,0,.35)', strokeW: body * 0.008 });
    const by = body * 0.865;
    if (st === 'chips' || st === 'snack' || st === 'seaweed' || st === 'candy') gdaRow(ctx, sku, w * 0.34, by, w * 0.64, body * 0.11);
    sizeText(ctx, sku, w * 0.05, by, w * 0.28, body * 0.11, '#fff', { stroke: 'rgba(0,0,0,.5)' });
    if (st === 'noodle') sizeText(ctx, sku, w * 0.05, by, w * 0.4, body * 0.11, '#fff', { stroke: 'rgba(0,0,0,.5)' });
    if (sku.isNew) newBurst(ctx, w * 0.84, body * 0.3, w * 0.13, pick({ en: 'NEW', th: 'ใหม่' }));
  } else {
    // landscape bag (bread, bakery, pillow pack of cookies)
    drawLogo(ctx, sku.brand, w * 0.27, body * 0.22, w * 0.46, body * 0.3);
    drawIllus(ctx, sku.hero, w * 0.74, body * 0.5, Math.min(w * 0.5, body * 1.5), heroOpts(sku));
    namePlate(ctx, sku, w * 0.04, body * 0.52, w * 0.5, body * 0.3, { shape: sku.plate || 'ribbon' });
    sizeText(ctx, sku, w * 0.05, body * 0.84, w * 0.3, body * 0.14, '#fff', { stroke: 'rgba(0,0,0,.5)' });
  }
  ctx.restore();
  foilStrip(ctx, 0, 0, w, seal, sku.foil || '#d5d9dd');
  foilStrip(ctx, 0, h - seal, w, seal, sku.foil || '#d5d9dd');
  gloss(ctx, 0, 0, w, h, 0.16);
}

export function bagBack(ctx, w, h, sku) {
  const seal = Math.min(0.9, h * 0.055);
  ctx.fillStyle = sku.pal[1]; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(0, seal, w, h - seal * 2); ctx.clip(); ctx.translate(0, seal);
  const bh = h - seal * 2;
  const r = paintBackPanel(ctx, w, bh, sku);
  drawBarcodeFor(ctx, sku, r.barcodeRect);
  ctx.restore();
  foilStrip(ctx, 0, 0, w, seal, sku.foil || '#d5d9dd');
  foilStrip(ctx, 0, h - seal, w, seal, sku.foil || '#d5d9dd');
}

// ================================================================================= WRAPPED (bottles, cans, cups, tubes)
function bandY(H, v) { return (1 - v) * H; }

export function wrapPaint(ctx, W, H, sku, geo) {
  const P = PROFILES[geo.profile];
  const [l0, l1] = P.label;
  const st = sku.style;
  const [c1, c2, c3, c4] = sku.pal;
  const yTop = bandY(H, l1), yBot = bandY(H, l0), lh = yBot - yTop;
  const cx = W / 2;
  const fw = Math.min(W * 0.4, lh * 2.4);          // width of the front-facing panel
  const isPrinted = st === 'can' || st === 'tube' || st === 'cup' || st === 'tin' || st === 'jar' || st === 'tub' || st === 'aerosol';

  // ---- body / liquid / glass
  const body = sku.body || (st === 'beer' || st === 'energy' ? '#5a2c0d' : st === 'water' ? '#d8eefa' : c4 || c2);
  ctx.fillStyle = linGrad(ctx, 0, 0, W, 0, [[0, darken(body, 0.15)], [0.5, lighten(body, 0.1)], [1, darken(body, 0.15)]]);
  ctx.fillRect(0, 0, W, H);
  if (st === 'beer' || st === 'energy') { // glass shine bands
    ctx.fillStyle = 'rgba(255,255,255,.10)'; for (const k of [0.46, 0.5, 0.54]) ctx.fillRect(W * k - W * 0.01, 0, W * 0.02, H);
  }

  // ---- label region background
  ctx.save();
  ctx.beginPath(); ctx.rect(0, yTop, W, lh); ctx.clip();
  ctx.translate(0, yTop);
  if (st === 'water') {
    ctx.fillStyle = linGrad(ctx, 0, 0, 0, lh, [[0, c1], [1, c2]]); ctx.fillRect(0, 0, W, lh);
    waves(ctx, 0, lh * 0.55, W, lh, lh * 0.05, W * 0.12, 'rgba(255,255,255,.28)'); waves(ctx, 0, lh * 0.7, W, lh, lh * 0.04, W * 0.09, 'rgba(255,255,255,.18)', 2);
  } else {
    paintBg(ctx, W, lh, sku);
  }
  // ---- front content
  content(ctx, cx, lh, fw, sku, geo, st);
  // ---- back panel (u = 0 seam): repeat on both edges
  if (lh > 5) for (const bx of [0, W]) { ctx.save(); ctx.translate(bx, 0); backMini(ctx, Math.min(W * 0.26, 7.5), lh, sku, st); ctx.restore(); }
  ctx.restore();

  // ---- caps, rims, foil
  const capFrom = P.capFrom ?? 1;
  if (capFrom < 1) {
    const capY = bandY(H, 1), capH = bandY(H, capFrom) - capY;
    const capC = sku.capColor || c3 || '#e8261c';
    ctx.fillStyle = linGrad(ctx, 0, 0, W, 0, [[0, darken(capC, 0.25)], [0.5, capC], [1, darken(capC, 0.25)]]); ctx.fillRect(0, capY, W, capH);
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 0.04;
    for (let x = 0; x < W; x += W / 44) { ctx.beginPath(); ctx.moveTo(x, capY + capH * 0.2); ctx.lineTo(x, capY + capH); ctx.stroke(); }
  }
  if (st === 'can' || st === 'aerosol') {
    ctx.fillStyle = linGrad(ctx, 0, 0, W, 0, [[0, '#8f959b'], [0.5, '#e8ecef'], [1, '#8f959b']]);
    ctx.fillRect(0, 0, W, bandY(H, l1)); ctx.fillRect(0, bandY(H, l0), W, H - bandY(H, l0));
  }
  if (st === 'tube') {
    ctx.fillStyle = linGrad(ctx, 0, 0, W, 0, [[0, '#7c8288'], [0.5, '#dfe3e6'], [1, '#7c8288']]); ctx.fillRect(0, bandY(H, l0), W, H - bandY(H, l0));
  }
  if (st === 'cup') { // paper rim + base
    ctx.fillStyle = darken(c3 || '#e8261c', 0.05); ctx.fillRect(0, 0, W, bandY(H, l1));
    ctx.fillStyle = darken(c2, 0.2); ctx.fillRect(0, bandY(H, l0), W, H - bandY(H, l0));
  }
  if (st === 'beer') { // neck foil / label
    const ny0 = bandY(H, 0.9), ny1 = Math.min(bandY(H, 0.6), yTop);   // never paint the foil over the label
    if (ny1 > ny0) { ctx.fillStyle = linGrad(ctx, 0, ny0, 0, ny1, [[0, sku.neck || c3], [1, darken(sku.neck || c3, 0.2)]]); ctx.fillRect(0, ny0, W, ny1 - ny0); }
  }
  if (st === 'energy') { ctx.fillStyle = linGrad(ctx, 0, 0, W, 0, [[0, '#b8842a'], [0.5, '#ffe28a'], [1, '#b8842a']]); ctx.fillRect(0, 0, W, bandY(H, 0.85)); }
  // ---- top disc (below the wrap cell)
  topDisc(ctx, W, H, sku, geo);
}

function content(ctx, cx, lh, fw, sku, geo, st) {
  const [c1, c2, c3, c4] = sku.pal;
  const x = cx - fw / 2;
  const logoH = lh * (st === 'beer' ? 0.26 : 0.2);
  if (st === 'can' || st === 'tube') {
    // tall printed can / tube: logo top, hero middle, name bottom
    drawLogo(ctx, sku.brand, cx, lh * 0.13, fw * 0.95, lh * 0.18);
    ctx.fillStyle = radGrad(ctx, cx, lh * 0.46, 0, fw * 0.7, [[0, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x - fw * 0.2, lh * 0.2, fw * 1.4, lh * 0.55);
    drawIllus(ctx, sku.hero, cx, lh * 0.46, Math.min(fw * 0.95, lh * 0.38), heroOpts(sku));
    namePlate(ctx, sku, x + fw * 0.02, lh * 0.66, fw * 0.96, lh * 0.17, { shape: sku.plate || 'pill', lines: 2 });
    sizeText(ctx, sku, x, lh * 0.87, fw, lh * 0.08, '#fff', { align: 'center', stroke: 'rgba(0,0,0,.5)' });
    return;
  }
  if (st === 'cup') {
    drawLogo(ctx, sku.brand, cx, lh * 0.15, fw * 0.95, lh * 0.22);
    const S = Math.min(fw * 0.95, lh * 0.5), custom = sku.hero && sku.hero !== 'noodleBowl';
    drawIllus(ctx, custom ? sku.hero : 'noodleBowl', cx, lh * 0.5 - (custom ? 0.03 * S : 0), custom ? S * 1.3 : S, { bowl: c3, topping: sku.topping || 'shrimp', soup: sku.soup, rim: c2, ...(sku.heroOpts || {}) });
    namePlate(ctx, sku, x, lh * 0.72, fw, lh * 0.18, { shape: sku.plate || 'ribbon', lines: 2 });
    return;
  }
  if (st === 'beer') {
    const ly = lh * 0.06;
    fillRR(ctx, x - fw * 0.05, ly, fw * 1.1, lh * 0.88, fw * 0.06, c1, sku.pal[2], fw * 0.02);
    drawLogo(ctx, sku.brand, cx, ly + lh * 0.16, fw, lh * 0.24);
    drawIllus(ctx, sku.hero, cx, ly + lh * 0.46, Math.min(fw * 0.8, lh * 0.3), heroOpts(sku));
    langText(ctx, sku.name, x, ly + lh * 0.62, fw, lh * 0.14, { family: nameFont(sku), weight: 700, size: lh * 0.11, color: contrastText(c1), lines: 1, lines2: 1 });
    fitText(ctx, `${sku.abv || 5.0}% ${pick({ en: 'ABV', th: 'แอลกอฮอล์' })}   ${pick(sku.size || { en: '', th: '' })}`, x, ly + lh * 0.8, fw, lh * 0.08, { family: 'kanit', weight: 700, size: lh * 0.075, color: contrastText(c1) });
    return;
  }
  if (st === 'energy') {
    fillRR(ctx, x - fw * 0.05, lh * 0.06, fw * 1.1, lh * 0.88, fw * 0.05, c1, c2, fw * 0.03);
    drawLogo(ctx, sku.brand, cx, lh * 0.25, fw, lh * 0.26);
    drawIllus(ctx, sku.hero, cx, lh * 0.55, Math.min(fw * 0.75, lh * 0.3), heroOpts(sku));
    langText(ctx, sku.name, x, lh * 0.74, fw, lh * 0.16, { family: nameFont(sku), weight: 700, size: lh * 0.12, color: c2, lines: 1, lines2: 1 });
    return;
  }
  // PET / water / juice / tea bottles, jars, tubs
  const big = lh > 7;
  drawLogo(ctx, sku.brand, cx, lh * 0.16, fw, lh * (big ? 0.22 : 0.26));
  drawIllus(ctx, sku.hero, cx, lh * 0.5, Math.min(fw * 0.9, lh * 0.36), heroOpts(sku));
  namePlate(ctx, sku, x, lh * 0.7, fw, lh * 0.17, { shape: sku.plate || 'pill', lines: 2 });
  sizeText(ctx, sku, x, lh * 0.9, fw, lh * 0.08, contrastText(c2), { align: 'center' });
}

function backMini(ctx, pw, lh, sku, st) {
  // small back panel: centred on the seam, drawn as two halves by the caller
  const w = pw, x = -w / 2;
  ctx.save();
  ctx.translate(x, lh * 0.08);
  const h = lh * 0.84;
  ctx.fillStyle = 'rgba(255,255,255,.93)'; rrPath(ctx, 0, 0, w, h, w * 0.05); ctx.fill();
  const n = sku.ing || [];
  langText(ctx, sku.name, w * 0.06, h * 0.02, w * 0.88, h * 0.12, { family: 'kanit', weight: 700, size: h * 0.1, color: '#222', lines: 1, lines2: 1 });
  const alc = sku.alcohol, en = st === 'energy' || sku.cat === 'energy';
  const warn = alc ? { en: BACK.alcW1.en + ' ' + BACK.alcW2.en, th: BACK.alcW1.th + ' ' + BACK.alcW2.th } : en ? BACK.energyW : null;
  if (warn) fitText(ctx, pick(warn) + (lang.second ? '\n' + pick2(warn) : ''), w * 0.06, h * 0.16, w * 0.88, h * 0.32, { family: 'sarabun', weight: 700, size: h * 0.06, color: '#b00020', align: 'left', valign: 'top', lines: 6, min: h * 0.03 });
  const d = dateStrings(sku);
  fitText(ctx, `${pick(BACK.mfg)} ${pick(d.mfg)}\n${pick(BACK.exp)} ${pick(d.exp)}`, w * 0.06, h * 0.52, w * 0.88, h * 0.16, { family: 'sarabun', weight: 700, size: h * 0.06, color: '#222', align: 'left', valign: 'top', lines: 2 });
  drawBarcode(ctx, ean13(ean(sku)), w * 0.06, h * 0.7, w * 0.88, h * 0.26, '#111', '#fff', true);
  ctx.restore();
}

function topDisc(ctx, W, H, sku, geo) {
  const D = geo.dims[0], y0 = geo.dims[1];
  const P = PROFILES[geo.profile];
  ctx.save(); ctx.translate(0, y0); ctx.beginPath(); ctx.rect(0, 0, D, D); ctx.clip();
  const st = sku.style;
  const [c1, c2, c3] = sku.pal;
  if (st === 'can') {
    ctx.fillStyle = radGrad(ctx, D / 2, D / 2, 0, D / 2, [[0, '#f2f4f5'], [1, '#aeb4b9']]); ctx.fillRect(0, 0, D, D);
    ellipse(ctx, D / 2, D / 2, D * 0.36, D * 0.36, null, '#8b9298', D * 0.02);
    fillRR(ctx, D * 0.32, D * 0.4, D * 0.36, D * 0.12, D * 0.06, '#d8dde0', '#7d848a', D * 0.015); circle(ctx, D * 0.42, D * 0.46, D * 0.03, '#7d848a');
  } else if (st === 'cup') {
    ctx.fillStyle = '#e9ecee'; ctx.fillRect(0, 0, D, D);
    circle(ctx, D / 2, D / 2, D * 0.46, c3 || '#e8261c'); circle(ctx, D / 2, D / 2, D * 0.38, '#f4f6f7');
    langText(ctx, { en: 'Add hot water to the line', th: 'เติมน้ำร้อนถึงขีดที่กำหนด' }, D * 0.15, D * 0.38, D * 0.7, D * 0.24, { family: 'kanit', weight: 700, size: D * 0.09, color: '#333', lines: 2, lines2: 1 });
  } else if (st === 'tube' || st === 'tub' || st === 'jar' || st === 'aerosol') {
    const lid = sku.capColor || c3 || '#e8261c';
    ctx.fillStyle = radGrad(ctx, D / 2, D / 2, 0, D * 0.6, [[0, lighten(lid, 0.2)], [1, darken(lid, 0.2)]]); ctx.fillRect(0, 0, D, D);
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = D * 0.01; ctx.beginPath(); ctx.arc(D / 2, D / 2, D * 0.4, 0, TAU); ctx.stroke();
  } else {
    const cap = sku.capColor || c3 || '#e8261c';
    ctx.fillStyle = radGrad(ctx, D / 2, D / 2, 0, D * 0.55, [[0, lighten(cap, 0.2)], [1, darken(cap, 0.25)]]); ctx.fillRect(0, 0, D, D);
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = D * 0.02; ctx.beginPath(); ctx.arc(D / 2, D / 2, D * 0.3, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

// ================================================================================= BOXES
export function boxFront(ctx, w, h, sku) {
  const st = sku.style;
  paintBg(ctx, w, h, sku);
  const compact = h < w * 0.8;
  if (compact) {
    drawLogo(ctx, sku.brand, w * 0.26, h * 0.24, w * 0.46, h * 0.36);
    drawIllus(ctx, sku.hero, w * 0.74, h * 0.48, Math.min(w * 0.46, h * 1.1), heroOpts(sku));
    namePlate(ctx, sku, w * 0.04, h * 0.56, w * 0.5, h * 0.3, { shape: sku.plate || 'ribbon' });
    sizeText(ctx, sku, w * 0.05, h * 0.87, w * 0.3, h * 0.11, '#fff', { stroke: 'rgba(0,0,0,.5)' });
  } else {
    drawLogo(ctx, sku.brand, w / 2, h * 0.13, w * 0.86, h * 0.17);
    ctx.fillStyle = radGrad(ctx, w / 2, h * 0.44, 0, w * 0.6, [[0, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, h * 0.2, w, h * 0.5);
    drawIllus(ctx, sku.hero, w / 2, h * 0.44, Math.min(w * 0.92, h * 0.42), heroOpts(sku));
    namePlate(ctx, sku, w * 0.05, h * 0.68, w * 0.9, h * 0.16, { shape: sku.plate || 'pill' });
    if (sku.sub) langText(ctx, sku.sub, w * 0.05, h * 0.85, w * 0.9, h * 0.05, { family: 'kanit', weight: 700, size: h * 0.045, color: contrastText(sku.pal[1]), lines: 1, lines2: 1 });
    sizeText(ctx, sku, w * 0.06, h * 0.91, w * 0.5, h * 0.07, '#fff', { stroke: 'rgba(0,0,0,.5)' });
    if (sku.isNew) newBurst(ctx, w * 0.82, h * 0.27, w * 0.15, pick({ en: 'NEW', th: 'ใหม่' }));
  }
  gloss(ctx, 0, 0, w, h, 0.12);
}
export function boxSide(ctx, w, h, sku) {
  ctx.fillStyle = linGrad(ctx, 0, 0, 0, h, [[0, sku.pal[1]], [1, darken(sku.pal[1], 0.2)]]); ctx.fillRect(0, 0, w, h);
  stripes(ctx, 0, 0, w, h, { angle: -0.6, gap: w * 0.5, width: w * 0.16, color: 'rgba(255,255,255,.10)' });
  ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 2);
  langText(ctx, sku.name, -h * 0.45, -w * 0.4, h * 0.9, w * 0.8, { family: nameFont(sku), weight: 700, size: w * 0.7, color: contrastText(sku.pal[1]), lines: 1, lines2: 1 });
  ctx.restore();
}
export function boxTop(ctx, w, d, sku) {
  ctx.fillStyle = sku.pal[0]; ctx.fillRect(0, 0, w, d);
  drawLogo(ctx, sku.brand, w / 2, d * 0.5, w * 0.7, d * 0.7, { showTh: false });
}
export function boxBack(ctx, w, h, sku) {
  const r = paintBackPanel(ctx, w, h, sku);
  drawBarcodeFor(ctx, sku, r.barcodeRect);
}

// ================================================================================= TRAYS (ready meals, sandwiches, salads)
export function trayTop(ctx, w, d, sku) {
  // black tray rim + clear film with a food picture, label sticker along the front edge
  ctx.fillStyle = '#1b1b1d'; ctx.fillRect(0, 0, w, d);
  const m = Math.min(w, d) * 0.06;
  fillRR(ctx, m, m, w - m * 2, d - m * 2, m, '#efe8d8', '#0000', 0);
  ctx.save(); rrPath(ctx, m, m, w - m * 2, d - m * 2, m); ctx.clip();
  ctx.fillStyle = radGrad(ctx, w * 0.42, d * 0.4, 0, w * 0.7, [[0, '#fbf6ea'], [1, '#d9cfb8']]); ctx.fillRect(0, 0, w, d);
  const plateS = Math.min(w * 0.62, d * 1.05);
  if (sku.style === 'sandwich' || sku.style === 'onigiri' || sku.hero !== 'plate') drawIllus(ctx, sku.hero, w * 0.36, d * 0.46, Math.min(w * 0.7, d * 1.0), heroOpts(sku));
  else drawIllus(ctx, 'plate', w * 0.34, d * 0.46, plateS, { kind: sku.dish || 'basil' });
  ctx.restore();
  // film glare
  ctx.fillStyle = 'rgba(255,255,255,.16)'; poly(ctx, [[w * 0.05, d * 0.1], [w * 0.35, d * 0.1], [w * 0.15, d * 0.9], [w * 0.05, d * 0.9]], 'rgba(255,255,255,.14)');
  // sticker
  const sx = w * 0.62, sw = w * 0.34, sy = d * 0.08, sh = d * 0.84;
  fillRR(ctx, sx, sy, sw, sh, sw * 0.04, '#ffffff', '#c9c9c9', 0.05);
  ctx.fillStyle = sku.pal[0]; rrPath(ctx, sx, sy, sw, sh * 0.16, [sw * 0.04, sw * 0.04, 0, 0]); ctx.fill();
  fitText(ctx, '7-Select', sx + sw * 0.05, sy + sh * 0.02, sw * 0.9, sh * 0.13, { family: 'archivo', weight: 400, size: sh * 0.12, color: '#fff' });
  langText(ctx, splitDot(sku.name), sx + sw * 0.06, sy + sh * 0.19, sw * 0.88, sh * 0.34, { family: 'kanit', weight: 700, size: sh * 0.22, color: '#111', lines: 3, lines2: 1, split: 0.66 });
  const d2 = dateStrings(sku);
  fitText(ctx, `${pick(BACK.exp)} ${pick(d2.exp)}`, sx + sw * 0.06, sy + sh * 0.56, sw * 0.88, sh * 0.09, { family: 'sarabun', weight: 700, size: sh * 0.08, color: '#444', align: 'left' });
  if (sku.heat) { // microwave icon
    fillRR(ctx, sx + sw * 0.06, sy + sh * 0.66, sw * 0.22, sh * 0.13, sh * 0.02, '#222'); fillRR(ctx, sx + sw * 0.09, sy + sh * 0.68, sw * 0.12, sh * 0.09, sh * 0.01, '#8fd0f0');
    fitText(ctx, pick({ en: 'Heat', th: 'อุ่น' }), sx + sw * 0.3, sy + sh * 0.66, sw * 0.64, sh * 0.13, { family: 'kanit', weight: 700, size: sh * 0.1, color: '#222', align: 'left' });
  }
  drawBarcode(ctx, ean13(ean(sku)), sx + sw * 0.06, sy + sh * 0.82, sw * 0.88, sh * 0.16, '#111', '#fff', false);
  fitText(ctx, '฿' + sku.price, sx + sw * 0.05, sy + sh * 0.5 - sh * 0.01, sw * 0.9, 0.01, { size: 0.01 });
}
export function trayFront(ctx, w, h, sku) {
  ctx.fillStyle = '#18181a'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = sku.pal[0]; ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, h * 0.05, w, h * 0.12);
}
export function traySide(ctx, w, h, sku) { ctx.fillStyle = '#18181a'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = sku.pal[0]; ctx.fillRect(0, h * 0.7, w, h * 0.3); }
export function trayBack(ctx, w, h, sku) {
  ctx.fillStyle = '#18181a'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f3efe2'; ctx.fillRect(w * 0.04, h * 0.1, w * 0.92, h * 0.8);
  const bh = h * 0.8;
  const ing = sku.ing ? sku.ing.slice(0, 6).map((k) => k) : [];
  langText(ctx, sku.heat ? BACK.heat : BACK.storeCold, w * 0.06, h * 0.12, w * 0.88, h * 0.76, { family: 'sarabun', weight: 700, size: h * 0.26, color: '#333', lines: 2, lines2: 2 });
}

// ================================================================================= GABLE CARTON (milk)
export function gableFront(ctx, w, h, sku) {
  ctx.fillStyle = '#fbfbf8'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = sku.pal[0]; ctx.fillRect(0, h * 0.62, w, h * 0.38);
  waves(ctx, 0, h * 0.58, w, h * 0.1, h * 0.02, w * 0.4, sku.pal[0]);
  drawLogo(ctx, sku.brand, w / 2, h * 0.12, w * 0.86, h * 0.14);
  drawIllus(ctx, sku.hero, w / 2, h * 0.4, w * 0.86, heroOpts(sku));
  namePlate(ctx, sku, w * 0.06, h * 0.66, w * 0.88, h * 0.16, { shape: 'pill', bg: '#ffffff', fg: sku.pal[0], noShadow: true, ring: darken(sku.pal[0], 0.25) });
  sizeText(ctx, sku, w * 0.05, h * 0.9, w * 0.9, h * 0.07, '#fff', { align: 'center' });
}
export function gableTop(ctx, w, d, sku) { ctx.fillStyle = sku.pal[0]; ctx.fillRect(0, 0, w, d); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, d * 0.46, w, d * 0.08); }
export function gableSide(ctx, w, h, sku) {
  ctx.fillStyle = sku.pal[0]; ctx.fillRect(0, 0, w, h);
  ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 2);
  langText(ctx, sku.name, -h * 0.45, -w * 0.4, h * 0.9, w * 0.8, { family: nameFont(sku), weight: 700, size: w * 0.7, color: '#fff', lines: 1, lines2: 1 });
  ctx.restore();
}

// ================================================================================= CARDS / STICKS
export function cardFront(ctx, w, h, sku) {
  paintBg(ctx, w, h, sku, 'plain');
  ctx.fillStyle = '#fff'; ctx.fillRect(w * 0.06, h * 0.32, w * 0.88, h * 0.36);
  drawIllus(ctx, sku.hero, w / 2, h * 0.5, Math.min(w * 0.85, h * 0.34), heroOpts(sku));
  drawLogo(ctx, sku.brand, w / 2, h * 0.14, w * 0.86, h * 0.18);
  namePlate(ctx, sku, w * 0.06, h * 0.72, w * 0.88, h * 0.15, { shape: 'rect' });
  sizeText(ctx, sku, w * 0.06, h * 0.9, w * 0.88, h * 0.07, '#fff', { align: 'center' });
  ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.arc(w / 2, h * 0.04, w * 0.03, 0, TAU); ctx.fill();
}

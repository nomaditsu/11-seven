// 2D canvas drawing toolkit used for every sign, poster and package in the game.
import { lang, pick, pick2 } from '../core/i18n.js';
import { clamp, TAU } from '../core/util.js';

export function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(w));
  canvas.height = Math.max(2, Math.round(h));
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

// Font stacks. Every stack ends in Thai-capable fallbacks so Thai text never turns into tofu.
export const FONTS = {
  kanit: 'Kanit', mitr: 'Mitr', sarabun: 'Sarabun', mali: 'Mali', pattaya: 'Pattaya',
  chonburi: 'Chonburi', sriracha: 'Sriracha', itim: 'Itim', anton: 'Anton', bebas: 'Bebas Neue',
  lilita: 'Lilita One', pacifico: 'Pacifico', bangers: 'Bangers', archivo: 'Archivo Black',
  righteous: 'Righteous', fredoka: 'Fredoka',
};
export function fontStr(weight, size, family = 'kanit', italic = false) {
  const f = FONTS[family] || family;
  return `${italic ? 'italic ' : ''}${weight} ${size}px "${f}","Kanit","Sarabun",sans-serif`;
}

// ---------------------------------------------------------------- text
const THAI_RE = /[฀-๿]/;
export const hasThai = (s) => THAI_RE.test(s);

let segmenter = null;
try { if (typeof Intl !== 'undefined' && Intl.Segmenter) segmenter = new Intl.Segmenter('th', { granularity: 'word' }); } catch (e) { segmenter = null; }
const segCache = new Map();
function tokens(str) {
  if (!hasThai(str)) return str.split(/(\s+)/).filter((x) => x.length);
  let r = segCache.get(str);
  if (r) return r;
  if (segmenter) r = [...segmenter.segment(str)].map((s) => s.segment);
  else r = str.split(/(\s+)/).filter(Boolean).flatMap((w) => (hasThai(w) ? w.match(/.{1,4}/gu) : [w]));
  segCache.set(str, r);
  return r;
}

export function wrapLines(ctx, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    const toks = tokens(para);
    let line = '';
    for (const tk of toks) {
      const test = line + tk;
      if (ctx.measureText(test).width <= maxW || !line.trim()) line = test;
      else { out.push(line.trimEnd()); line = tk.trimStart(); }
    }
    out.push(line.trimEnd());
  }
  return out.filter((l, i) => l.length || i === 0);
}

const lineHeightFor = (s, size) => size * (hasThai(s) ? 1.34 : 1.12);

/**
 * Draw text so it fits a box, shrinking the font as needed and wrapping (Thai-aware).
 * o: { family, weight, size (max), min, color, align, valign, lines, stroke, strokeW, shadow:[color,blur,ox,oy],
 *      skew, italic, track, caps, lh, grad:[c1,c2], rot }
 * Returns { size, lines, w, h }.
 */
function fitTextImpl(ctx, text, x, y, w, h, o = {}) {
  if ((o.lines || 1) === 1 && typeof text === 'string') text = text.replace(/\s*\n\s*/g, ' ');
  text = String(text ?? '');
  if (o.caps) text = text.toUpperCase();
  const family = o.family || 'kanit';
  const weight = o.weight || 700;
  const maxLines = o.lines || 1;
  let size = o.size || h;
  const min = o.min ?? Math.max(size * 0.06, 0.5);
  ctx.save();
  ctx.textBaseline = 'middle';
  if (o.track && 'letterSpacing' in ctx) ctx.letterSpacing = o.track + 'px';
  let lines = [text];
  let lh = size;
  for (;;) {
    ctx.font = fontStr(weight, size, family, o.italic);
    lines = wrapLines(ctx, text, w);
    lh = o.lh ? size * o.lh : lineHeightFor(text, size);
    const okW = lines.every((l) => ctx.measureText(l).width <= w + 0.5);
    if (lines.length <= maxLines && okW && lh * lines.length <= h + 0.5) break;
    if (size <= min) break;
    size = Math.max(min, size - Math.max(0.5, size * 0.05));
  }
  if (lines.length > maxLines) lines = lines.slice(0, maxLines);
  const total = lh * lines.length;
  const align = o.align || 'center';
  const valign = o.valign || 'middle';
  let ty = valign === 'top' ? y : valign === 'bottom' ? y + h - total : y + (h - total) / 2;
  const ax = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;
  ctx.textAlign = align;
  if (o.rot || o.skew) {
    ctx.translate(ax, ty + total / 2);
    if (o.rot) ctx.rotate(o.rot);
    if (o.skew) ctx.transform(1, 0, o.skew, 1, 0, 0);
    ctx.translate(-ax, -(ty + total / 2));
  }
  let maxW = 0;
  lines.forEach((l, i) => {
    const cy = ty + lh * (i + 0.5) + (hasThai(l) ? size * 0.02 : 0);
    maxW = Math.max(maxW, ctx.measureText(l).width);
    if (o.shadow) {
      ctx.save();
      ctx.fillStyle = o.shadow[0];
      if (o.shadow[1] > 0) { // blurred: use the canvas shadow (device pixels)
        const sc = Math.hypot(ctx.getTransform().a, ctx.getTransform().b) || 1;
        ctx.shadowColor = o.shadow[0]; ctx.shadowBlur = o.shadow[1] * sc; ctx.shadowOffsetX = o.shadow[2] * sc; ctx.shadowOffsetY = o.shadow[3] * sc;
        ctx.fillText(l, ax, cy);
      } else ctx.fillText(l, ax + o.shadow[2], cy + o.shadow[3]); // hard shadow: offset in the current (scaled) units
      ctx.restore();
    }
    if (o.stroke) {
      ctx.lineJoin = 'round'; ctx.miterLimit = 2;
      ctx.lineWidth = o.strokeW || size * 0.12;
      ctx.strokeStyle = o.stroke;
      ctx.strokeText(l, ax, cy);
    }
    if (o.grad) {
      const g = ctx.createLinearGradient(0, cy - lh / 2, 0, cy + lh / 2);
      g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]);
      ctx.fillStyle = g;
    } else ctx.fillStyle = o.color || '#000';
    ctx.fillText(l, ax, cy);
  });
  ctx.restore();
  return { size, lines: lines.length, w: maxW, h: total };
}


// Canvas rounds tiny font sizes, so painters that work in centimetre units go through this wrapper,
// which temporarily upscales the coordinate system until the font size is comfortably large.
export function fitText(ctx, text, x, y, w, h, o = {}) {
  const ref = o.size || h;
  const K = ref < 24 ? Math.ceil(24 / Math.max(ref, 0.001)) : 1;
  if (K === 1) return fitTextImpl(ctx, text, x, y, w, h, o);
  const o2 = { ...o };
  o2.size = (o.size || h) * K;
  if (o.min !== undefined) o2.min = o.min * K;
  if (o.strokeW) o2.strokeW = o.strokeW * K;
  if (o.track) o2.track = o.track * K;
  if (o.shadow) o2.shadow = [o.shadow[0], o.shadow[1] * K, o.shadow[2] * K, o.shadow[3] * K];
  ctx.save();
  ctx.scale(1 / K, 1 / K);
  const r = fitTextImpl(ctx, text, x * K, y * K, w * K, h * K, o2);
  ctx.restore();
  return { size: r.size / K, lines: r.lines, w: r.w / K, h: r.h / K };
}

/**
 * Bilingual-aware text: v is a string or {en, th}. In "both" mode the primary language goes on
 * top and the secondary is drawn smaller underneath. o2 overrides options for the secondary line.
 */
export function langText(ctx, v, x, y, w, h, o = {}, o2 = {}) {
  const a = pick(v);
  let b = pick2(v);
  if (b && (o.lines2 || 1) < 2) b = b.replace(/\s*\n\s*/g, ' ');
  if (!b || b === a) return fitText(ctx, a, x, y, w, h, o);
  const split = o.split ?? 0.64;
  const r1 = fitText(ctx, a, x, y, w, h * split, { ...o, valign: 'bottom' });
  const r2 = fitText(ctx, b, x, y + h * split, w, h * (1 - split), {
    ...o, weight: Math.max(400, (o.weight || 700) - 200), family: o2.family || (hasThai(b) ? 'kanit' : 'sarabun'), lines: o.lines2 || 1,
    size: (o.size || h) * 0.55, valign: 'top', color: o2.color || o.color, stroke: null, shadow: null, grad: null, ...o2,
  });
  return { size: r1.size, lines: r1.lines + r2.lines, w: Math.max(r1.w, r2.w), h: r1.h + r2.h };
}

// ---------------------------------------------------------------- shapes
export function rrPath(ctx, x, y, w, h, r = 0) {
  let [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r];
  const m = Math.min(w, h) / 2;
  tl = Math.min(tl, m); tr = Math.min(tr, m); br = Math.min(br, m); bl = Math.min(bl, m);
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y); ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br); ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h); ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl); ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}
export function fillRR(ctx, x, y, w, h, r, fill, stroke, lw = 1) {
  rrPath(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
export function circle(ctx, cx, cy, r, fill, stroke, lw = 1) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
export function ellipse(ctx, cx, cy, rx, ry, fill, stroke, lw = 1, rot = 0) {
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
export function burstPath(ctx, cx, cy, ro, ri, n, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro, a = rot + (i * Math.PI) / n;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
export function burst(ctx, cx, cy, ro, ri, n, fill, stroke, lw = 2, rot = 0) {
  burstPath(ctx, cx, cy, ro, ri, n, rot);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}
export function poly(ctx, pts, fill, stroke, lw = 1) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}
export function star(ctx, cx, cy, r, fill, n = 5, rot = -Math.PI / 2) {
  burstPath(ctx, cx, cy, r, r * 0.42, n, rot);
  ctx.fillStyle = fill; ctx.fill();
}
export function bolt(ctx, x, y, w, h, fill, stroke, lw = 2) {
  poly(ctx, [[x + w * 0.62, y], [x + w * 0.12, y + h * 0.56], [x + w * 0.46, y + h * 0.56], [x + w * 0.28, y + h], [x + w * 0.9, y + h * 0.4], [x + w * 0.54, y + h * 0.4]], fill, stroke, lw);
}
export function drop(ctx, cx, cy, r, fill, stroke, lw = 1) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.5);
  ctx.bezierCurveTo(cx + r * 0.2, cy - r * 0.9, cx + r, cy - r * 0.2, cx + r, cy + r * 0.25);
  ctx.arc(cx, cy + r * 0.25, r, 0, Math.PI);
  ctx.bezierCurveTo(cx - r, cy - r * 0.2, cx - r * 0.2, cy - r * 0.9, cx, cy - r * 1.5);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
export function leaf(ctx, x, y, len, wid, rot, fill) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -wid, len, 0); ctx.quadraticCurveTo(len * 0.5, wid, 0, 0);
  ctx.fillStyle = fill; ctx.fill(); ctx.restore();
}

export const linGrad = (ctx, x0, y0, x1, y1, stops) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
};
export const radGrad = (ctx, cx, cy, r0, r1, stops, fx = cx, fy = cy) => {
  const g = ctx.createRadialGradient(fx, fy, r0, cx, cy, r1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
};

// ---------------------------------------------------------------- patterns
export function stripes(ctx, x, y, w, h, o = {}) {
  const { angle = -0.5, gap = 20, width = 10, color = 'rgba(255,255,255,.18)' } = o;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.translate(x + w / 2, y + h / 2); ctx.rotate(angle);
  const R = Math.hypot(w, h);
  ctx.fillStyle = color;
  for (let p = -R; p < R; p += gap) ctx.fillRect(p, -R, width, R * 2);
  ctx.restore();
}
export function rays(ctx, cx, cy, r, n, color, rot = 0) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = color;
  for (let i = 0; i < n; i += 2) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, (i * TAU) / n, ((i + 1) * TAU) / n);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
export function dots(ctx, x, y, w, h, step, rad, color, stagger = true) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = color;
  for (let j = 0, yy = y; yy < y + h + step; yy += step, j++) {
    for (let xx = x + (stagger && j % 2 ? step / 2 : 0); xx < x + w + step; xx += step) {
      ctx.beginPath(); ctx.arc(xx, yy, rad, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}
export function checker(ctx, x, y, w, h, s, c1, c2) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let j = 0; j * s < h; j++) for (let i = 0; i * s < w; i++) {
    ctx.fillStyle = (i + j) % 2 ? c1 : c2; ctx.fillRect(x + i * s, y + j * s, s, s);
  }
  ctx.restore();
}
export function waves(ctx, x, y, w, h, amp, len, color, phase = 0) {
  ctx.beginPath(); ctx.moveTo(x, y + h);
  for (let px = 0; px <= w + 2; px += 2) ctx.lineTo(x + px, y + Math.sin((px / len) * TAU + phase) * amp);
  ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
export function zigzag(ctx, x, y, w, h, teeth, color) {
  ctx.beginPath(); ctx.moveTo(x, y + h);
  const tw = w / teeth;
  for (let i = 0; i < teeth; i++) { ctx.lineTo(x + tw * (i + 0.5), y); ctx.lineTo(x + tw * (i + 1), y + h); }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
export function gloss(ctx, x, y, w, h, a = 0.22) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.35, 'rgba(255,255,255,0)');
  g.addColorStop(0.7, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${a * 0.5})`);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
export function grain(ctx, x, y, w, h, amount, rand) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const n = Math.floor((w * h) / 90);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${amount})` : `rgba(0,0,0,${amount})`;
    ctx.fillRect(x + rand() * w, y + rand() * h, 1.5, 1.5);
  }
  ctx.restore();
}
export function vignette(ctx, x, y, w, h, a = 0.35) {
  const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.25, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

// ---------------------------------------------------------------- EAN-13 barcode (valid checksum & encoding)
const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const EAN_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
export function ean13(prefix12) {
  const d = prefix12.split('').map(Number);
  let s = 0; d.forEach((v, i) => { s += v * (i % 2 ? 3 : 1); });
  return prefix12 + ((10 - (s % 10)) % 10);
}
export function drawBarcode(ctx, code13, x, y, w, h, color = '#000', bg = '#fff', digits = true) {
  const d = code13.split('').map(Number);
  let bits = '101';
  const par = EAN_PARITY[d[0]];
  for (let i = 0; i < 6; i++) bits += (par[i] === 'L' ? EAN_L : EAN_G)[d[i + 1]];
  bits += '01010';
  for (let i = 0; i < 6; i++) bits += EAN_R[d[i + 7]];
  bits += '101';
  const quiet = w * 0.07;
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  const bw = (w - quiet * 2) / bits.length;
  const bh = digits ? h * 0.8 : h - quiet;
  ctx.fillStyle = color;
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      const guard = i < 3 || (i >= 45 && i < 50) || i >= 92;
      ctx.fillRect(x + quiet + i * bw, y + quiet * 0.6, bw * 1.08, guard && digits ? bh + h * 0.08 : bh - quiet * 0.6);
    }
  }
  if (digits) {
    ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    const K = h < 40 ? Math.ceil(40 / h) : 1;
    ctx.save(); ctx.scale(1 / K, 1 / K);
    const fs = h * K * 0.16;
    ctx.font = `600 ${fs}px "Sarabun",monospace`;
    ctx.fillText(d[0], (x + quiet * 0.55) * K, (y + h) * K - fs * 0.62);
    ctx.fillText(code13.slice(1, 7).split('').join(' '), (x + quiet + bw * 24) * K, (y + h) * K - fs * 0.62);
    ctx.fillText(code13.slice(7).split('').join(' '), (x + quiet + bw * 71) * K, (y + h) * K - fs * 0.62);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- misc
// Draw with a clip to a rounded rect (useful for label panels).
export function withClip(ctx, x, y, w, h, r, fn) {
  ctx.save(); rrPath(ctx, x, y, w, h, r); ctx.clip(); fn(); ctx.restore();
}
export function dropShadow(ctx, color = 'rgba(0,0,0,.35)', blur = 6, ox = 0, oy = 3) {
  ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetX = ox; ctx.shadowOffsetY = oy;
}
export function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
export const cl = clamp;

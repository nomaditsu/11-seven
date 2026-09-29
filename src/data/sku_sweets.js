// Sweets: candy & gum, chocolate & wafers, biscuits & cookies.
// Names follow the Thai listings of 7-Eleven Thailand; art is stylised (no real logos are copied).
import { g, T } from './sku_util.js';
import { fillRR, circle, ellipse, poly, linGrad, radGrad, leaf, withClip, rrPath, fitText } from '../gfx/draw.js';
import { drawIllus } from '../gfx/illus.js';
import { ORIGIN_NAME } from '../gfx/pack_common.js';
import { lighten, darken, TAU } from '../core/util.js';

// Lotus Biscoff is Belgian and the shared ORIGIN_NAME table (pack_common.js) has no 'be' entry yet: register the
// label here (harmless once the shared table gains it). The Biscoff SKU also sets its own `ean` (barcode prefix 5410).
if (!ORIGIN_NAME.be) ORIGIN_NAME.be = { en: 'Belgium', th: 'ประเทศเบลเยียม' };

// ====================================================================================================
// drawing helpers (local)
// ====================================================================================================
const OUT = '#3b2411';
const lw = (ctx, s, k = 0.03) => { ctx.lineWidth = s * k; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
function shine(ctx, x, y, w, h, rot = -0.6, a = 0.55) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill(); ctx.restore();
}
// glossy ball
function ball(ctx, x, y, r, c, o = {}) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = radGrad(ctx, x, y, 0, r, [[0, lighten(c, 0.55)], [0.5, c], [1, darken(c, 0.3)]], x - r * 0.35, y - r * 0.4); ctx.fill();
  if (o.line !== false) { ctx.strokeStyle = o.line || darken(c, 0.55); ctx.lineWidth = o.lw || r * 0.08; ctx.stroke(); }
  if (o.shine !== false) shine(ctx, x - r * 0.36, y - r * 0.42, r * 0.28, r * 0.14, -0.7, 0.6);
}
// rounded slab with vertical gradient
function slab(ctx, x, y, w, h, r, c, o = {}) {
  fillRR(ctx, x, y, w, h, r, linGrad(ctx, 0, y, 0, y + h, [[0, lighten(c, o.hi ?? 0.28)], [0.5, c], [1, darken(c, o.lo ?? 0.25)]]), o.line || darken(c, 0.6), o.lw || Math.min(w, h) * 0.06);
}
// twist-wrapped sweet lying along +x. (x,y) = centre, len/th = body length/thickness
function wrapped(ctx, x, y, len, th, rot, c, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const fin = th * 0.66, ln = th * 0.05;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * len * 0.46, -th * 0.17);
    ctx.lineTo(sx * (len * 0.5 + fin), -th * 0.5);
    ctx.quadraticCurveTo(sx * (len * 0.5 + fin * 0.5), 0, sx * (len * 0.5 + fin), th * 0.5);
    ctx.lineTo(sx * len * 0.46, th * 0.17);
    ctx.closePath();
    ctx.fillStyle = o.fin || lighten(c, 0.3); ctx.fill(); ctx.strokeStyle = darken(c, 0.55); ctx.lineWidth = ln; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = ln * 0.6;
    for (let k = 1; k <= 3; k++) { const px = sx * (len * 0.5 + (fin * k) / 4); ctx.beginPath(); ctx.moveTo(px, -th * 0.2); ctx.lineTo(px, th * 0.2); ctx.stroke(); }
  }
  slab(ctx, -len / 2, -th / 2, len, th, th * 0.3, c, { lw: ln * 1.3 });
  withClip(ctx, -len / 2, -th / 2, len, th, th * 0.3, () => {
    if (o.band) { ctx.fillStyle = o.band; ctx.fillRect(-len * 0.14, -th, len * 0.28, th * 2); }
    if (o.dots) { ctx.fillStyle = o.dots; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-len * 0.36 + i * len * 0.18, ((i % 2) - 0.5) * th * 0.4, th * 0.07, 0, TAU); ctx.fill(); } }
    if (o.icon) { ctx.save(); ctx.translate(0, 0); o.icon(ctx, th); ctx.restore(); }
  });
  shine(ctx, -len * 0.18, -th * 0.24, len * 0.2, th * 0.06, 0, 0.55);
  ctx.restore();
}
function sparkle(ctx, x, y, r, c = '#fff') {
  ctx.fillStyle = c; ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
}
// small fruit icons (own versions: the shared ones use centimetre-wide outlines that turn into blobs when drawn small)
function fruit(ctx, kind, x, y, u) {
  ctx.save(); ctx.translate(x, y);
  const ol = (c) => { ctx.strokeStyle = darken(c, 0.5); ctx.lineWidth = u * 0.045; ctx.lineJoin = 'round'; ctx.stroke(); };
  if (kind === 'strawberry') {
    ctx.beginPath(); ctx.moveTo(0, u * 0.42); ctx.bezierCurveTo(u * 0.5, u * 0.15, u * 0.42, -u * 0.32, 0, -u * 0.3); ctx.bezierCurveTo(-u * 0.42, -u * 0.32, -u * 0.5, u * 0.15, 0, u * 0.42);
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, u * 0.5, [[0, '#ff6a7c'], [0.6, '#ee2b45'], [1, '#b81430']], -u * 0.15, -u * 0.12); ctx.fill(); ol('#ee2b45');
    ctx.fillStyle = '#ffe9a0';
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = u * (0.08 + (i % 3) * 0.1); ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.3 + u * 0.03, u * 0.02, u * 0.03, 0, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 5; i++) leaf(ctx, 0, -u * 0.28, u * 0.22, u * 0.07, -Math.PI / 2 + (i - 2) * 0.55, '#2e9b3e');
  } else if (kind === 'mango') {
    ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, 0, u * 0.42, u * 0.3, 0, 0, TAU);
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, u * 0.45, [[0, '#ffe55a'], [0.6, '#ffc21a'], [1, '#ff8a1a']], -u * 0.1, -u * 0.05); ctx.fill(); ol('#ffa01a');
    shine(ctx, -u * 0.15, -u * 0.1, u * 0.12, u * 0.05, -0.3, 0.6); leaf(ctx, u * 0.3, -u * 0.18, u * 0.2, u * 0.08, -0.2, '#2e9b3e');
  } else if (kind === 'orange') {
    ctx.beginPath(); ctx.arc(0, 0, u * 0.4, 0, TAU); ctx.fillStyle = radGrad(ctx, 0, 0, 0, u * 0.42, [[0, '#ffc060'], [0.6, '#ff9a1f'], [1, '#d96a08']], -u * 0.12, -u * 0.14); ctx.fill(); ol('#ff9a1f');
    shine(ctx, -u * 0.13, -u * 0.15, u * 0.1, u * 0.06, -0.6, 0.55); leaf(ctx, 0, -u * 0.38, u * 0.2, u * 0.08, -0.6, '#2e9b3e');
  } else if (kind === 'lemon') {
    ctx.beginPath(); ctx.arc(0, 0, u * 0.42, 0, TAU); ctx.fillStyle = '#ffe13a'; ctx.fill(); ol('#ffd21a');
    ctx.beginPath(); ctx.arc(0, 0, u * 0.35, 0, TAU); ctx.fillStyle = '#fff5a8'; ctx.fill();
    ctx.strokeStyle = '#ffe13a'; ctx.lineWidth = u * 0.03; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos((i * TAU) / 8) * u * 0.33, Math.sin((i * TAU) / 8) * u * 0.33); ctx.stroke(); }
  }
  ctx.restore();
}
// tiny shrimp
function shrimpIcon(ctx, x, y, u, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(-u * 0.32, u * 0.12); ctx.bezierCurveTo(-u * 0.4, -u * 0.28, u * 0.32, -u * 0.34, u * 0.3, u * 0.05); ctx.bezierCurveTo(u * 0.34, u * 0.2, u * 0.15, u * 0.22, u * 0.12, u * 0.08); ctx.bezierCurveTo(u * 0.15, -u * 0.1, -u * 0.1, -u * 0.1, -u * 0.2, u * 0.14); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, -u * 0.3, 0, u * 0.2, [[0, '#ff9a5a'], [1, '#e8562a']]); ctx.fill(); ctx.strokeStyle = '#8a2a10'; ctx.lineWidth = u * 0.04; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = u * 0.02; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-u * 0.2 + i * u * 0.12, -u * 0.2 + Math.abs(i - 1.5) * u * 0.05); ctx.lineTo(-u * 0.17 + i * u * 0.12, u * 0.02); ctx.stroke(); }
  circle(ctx, u * 0.27, -u * 0.03, u * 0.022, '#000');
  ctx.restore();
}
// short label centred on (cx, cy); goes through fitText because we draw in centimetres
function txt(ctx, str, cx, cy, size, family, color, o = {}) {
  fitText(ctx, str, cx - size * 4, cy - size * 0.7, size * 8, size * 1.4, { family, weight: o.weight || 400, size, color, align: 'center', valign: 'middle', lines: 1, ...o });
}
// horizontally banded cross-section of a bar / pie. bands are listed top -> bottom as [colour, weight]
function slice(ctx, x, y, w, h, r, bands, o = {}) {
  ctx.save(); rrPath(ctx, x, y, w, h, r); ctx.clip();
  const tot = bands.reduce((a, b) => a + b[1], 0); let yy = y;
  for (const [c, wt] of bands) { const hh = (h * wt) / tot; ctx.fillStyle = c; ctx.fillRect(x - 1, yy, w + 2, hh + 0.6); yy += hh; }
  if (o.draw) o.draw(ctx);
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x, y, w, h * 0.1);
  ctx.restore();
  rrPath(ctx, x, y, w, h, r); ctx.strokeStyle = o.line || OUT; lw(ctx, Math.min(w, h), o.lwk || 0.05); ctx.stroke();
}
function peanut(ctx, x, y, u, rot = 0, c = '#d9a15a') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  for (const dx of [-0.42, 0.42]) {
    ctx.beginPath(); ctx.ellipse(dx * u, 0, 0.62 * u, 0.46 * u, 0, 0, TAU);
    ctx.fillStyle = radGrad(ctx, dx * u, 0, 0, 0.62 * u, [[0, lighten(c, 0.35)], [1, darken(c, 0.12)]], (dx - 0.2) * u, -0.2 * u); ctx.fill();
    ctx.strokeStyle = darken(c, 0.5); ctx.lineWidth = u * 0.09; ctx.stroke();
  }
  ctx.fillStyle = 'rgba(120,70,20,.35)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((-0.7 + i * 0.35) * u, ((i % 2) - 0.5) * 0.3 * u, 0.04 * u, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function hazelnut(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, -r * 1.15); ctx.bezierCurveTo(r * 0.9, -r * 0.8, r * 1.0, r * 0.5, 0, r); ctx.bezierCurveTo(-r * 1.0, r * 0.5, -r * 0.9, -r * 0.8, 0, -r * 1.15);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r * 1.2, [[0, '#d9a468'], [0.6, '#a86a34'], [1, '#6a3a16']], -r * 0.3, -r * 0.3); ctx.fill(); ctx.strokeStyle = '#4a250c'; ctx.lineWidth = r * 0.12; ctx.stroke();
  ctx.fillStyle = '#e8c890'; ctx.beginPath(); ctx.ellipse(0, r * 0.82, r * 0.42, r * 0.2, 0, 0, TAU); ctx.fill();
  shine(ctx, -r * 0.35, -r * 0.35, r * 0.2, r * 0.1, -0.6, 0.5);
  ctx.restore();
}
// 3/4-view disc (biscuit, cream layer): top ellipse + side wall of thickness th
function puck(ctx, x, y, rx, ry, th, topC, sideC, line, lwv) {
  ctx.fillStyle = sideC; ctx.strokeStyle = line; ctx.lineWidth = lwv; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(x, y + th, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.fillRect(x - rx, y, rx * 2, th);
  ctx.beginPath(); ctx.ellipse(x, y + th, rx, ry, 0, 0, Math.PI); ctx.moveTo(x - rx, y); ctx.lineTo(x - rx, y + th); ctx.moveTo(x + rx, y); ctx.lineTo(x + rx, y + th); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fillStyle = topC; ctx.fill(); ctx.stroke();
}
function scallopPath(ctx, x, y, r, n, amp, rot = 0) {
  ctx.beginPath();
  const steps = n * 12;
  for (let i = 0; i <= steps; i++) {
    const a = rot + (i / steps) * TAU, rr = r * (1 - amp + amp * Math.abs(Math.cos((i / steps) * n * Math.PI)));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}
// top face of a round biscuit. kind: oreo | dots | plain | flower
function cookieFace(ctx, x, y, r, c, kind = 'plain', rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, r, [[0, lighten(c, 0.24)], [0.7, c], [1, darken(c, 0.32)]], -r * 0.3, -r * 0.3); ctx.fill();
  ctx.strokeStyle = darken(c, 0.68); ctx.lineWidth = r * 0.06; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.88, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = r * 0.03; ctx.stroke();
  if (kind === 'oreo') {
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = r * 0.045;
    for (let i = 0; i < 28; i++) { const a = (i * TAU) / 28; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66); ctx.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.58, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = r * 0.035; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.3)'; txt(ctx, 'OREO', 0, r * 0.02, r * 0.3, 'archivo', 'rgba(255,255,255,.3)');
    for (const [px, py] of [[0, -0.36], [0, 0.36], [-0.4, 0], [0.4, 0]]) { ctx.fillRect(px * r - r * 0.03, py * r - r * 0.09, r * 0.06, r * 0.18); ctx.fillRect(px * r - r * 0.09, py * r - r * 0.03, r * 0.18, r * 0.06); }
  } else if (kind === 'flower') {
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    for (let i = 0; i < 10; i++) { const a = (i * TAU) / 10; ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.16, r * 0.09, a, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.26, 0, TAU); ctx.fill();
  } else if (kind === 'dots') {
    ctx.fillStyle = 'rgba(120,70,20,.4)';
    for (let i = 0; i < 16; i++) { const a = (i * TAU) / 16; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.05, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 7; i++) { const a = (i * TAU) / 7; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, r * 0.05, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.06, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ====================================================================================================
// hero illustrations (keys are prefixed `sw` so they cannot clash with other modules)
// ====================================================================================================
const raw = {
  // ------------------------------------------------------------------ candy
  // Mentos-style roll of chewy dragees peeking out of a paper wrapper
  swMentos(ctx, s, o = {}) {
    const c = o.col || '#19a74a', band = o.col2 || '#ffffff', stripe = o.stripe || '#e60012';
    const dr = (x, y, r) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = radGrad(ctx, x, y, 0, r, [[0, '#ffffff'], [0.7, '#eef2f5'], [1, '#c3ccd5']], x - r * 0.3, y - r * 0.35); ctx.fill();
      ctx.strokeStyle = '#7f8b97'; lw(ctx, s, 0.012); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, TAU); ctx.strokeStyle = 'rgba(140,150,165,.5)'; ctx.stroke();
    };
    (o.back || []).forEach((k, i) => { const [x, y, z] = [[-0.27, -0.24, 0.3], [0.27, -0.3, 0.28], [0, -0.4, 0.24]][i % 3]; fruit(ctx, k, x * s, y * s, z * s * 1.15); });
    if (o.leaf) { leaf(ctx, -0.36 * s, -0.16 * s, 0.34 * s, 0.1 * s, -0.75, '#2e9b3e'); leaf(ctx, -0.3 * s, -0.12 * s, 0.32 * s, 0.09 * s, -1.35, '#4cc060'); }
    dr(-0.3 * s, 0.32 * s, 0.078 * s); dr(-0.12 * s, 0.39 * s, 0.068 * s); dr(0.34 * s, 0.31 * s, 0.072 * s); dr(0.2 * s, 0.4 * s, 0.05 * s);
    ctx.save(); ctx.translate(0.01 * s, 0.0); ctx.rotate(-0.42);
    const L = s * 0.82, H = s * 0.3, wl = L * 0.64, x0 = -L / 2;
    for (let i = 3; i >= 0; i--) {
      const cx = x0 + wl + H * 0.02 + i * H * 0.23;
      ellipse(ctx, cx, 0, H * 0.14, H * 0.43, '#f6f8fa', '#7f8b97', s * 0.014);
      ctx.strokeStyle = 'rgba(150,160,175,.55)'; lw(ctx, s, 0.008); ctx.beginPath(); ctx.ellipse(cx, 0, H * 0.08, H * 0.3, 0, 0, TAU); ctx.stroke();
    }
    slab(ctx, x0, -H / 2, wl, H, H * 0.1, c, { lw: s * 0.026 });
    ctx.fillStyle = band; ctx.fillRect(x0 + wl * 0.34, -H / 2 + s * 0.013, wl * 0.3, H - s * 0.026);
    ctx.fillStyle = stripe; ctx.fillRect(x0 + wl * 0.34, -H * 0.1, wl * 0.3, H * 0.2);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x0 + wl * 0.04, -H * 0.4, wl * 0.28, H * 0.08); ctx.fillRect(x0 + wl * 0.68, -H * 0.4, wl * 0.24, H * 0.08);
    // torn wrapper edge
    ctx.fillStyle = darken(c, 0.12);
    ctx.beginPath(); ctx.moveTo(x0 + wl, -H / 2); for (let i = 0; i <= 6; i++) ctx.lineTo(x0 + wl + (i % 2 ? -H * 0.05 : H * 0.02), -H / 2 + (i * H) / 6); ctx.lineTo(x0 + wl - H * 0.1, H / 2); ctx.lineTo(x0 + wl - H * 0.1, -H / 2); ctx.closePath(); ctx.fill();
    // crimped tail
    ctx.beginPath(); ctx.moveTo(x0, -H * 0.32); ctx.lineTo(x0 - H * 0.42, -H * 0.5); ctx.lineTo(x0 - H * 0.3, 0); ctx.lineTo(x0 - H * 0.42, H * 0.5); ctx.lineTo(x0, H * 0.32); ctx.closePath();
    ctx.fillStyle = lighten(c, 0.3); ctx.fill(); ctx.strokeStyle = darken(c, 0.55); lw(ctx, s, 0.022); ctx.stroke();
    ctx.restore();
  },

  // round throat lozenge next to a twist-wrapped one (Halls)
  swHalls(ctx, s, o = {}) {
    const c = o.col || '#f0a21a', wr = o.col2 || '#ffd21f';
    const tall = !!o.tall, my = tall ? -0.1 : 0;
    if (o.extra === 'lemon') fruit(ctx, 'lemon', (tall ? -0.2 : -0.16) * s, (tall ? -0.3 : -0.16) * s, (tall ? 0.46 : 0.5) * s);
    if (o.extra === 'mint') { leaf(ctx, -0.36 * s, (-0.02 + my) * s, 0.4 * s, 0.11 * s, -0.7, '#2e9b3e'); leaf(ctx, -0.34 * s, my * s, 0.36 * s, 0.1 * s, -1.25, '#52c96a'); leaf(ctx, -0.3 * s, (0.02 + my) * s, 0.3 * s, 0.09 * s, -0.2, '#1f8a3a'); }
    if (o.extra === 'snow') { ctx.save(); ctx.translate(-0.2 * s, (-0.16 + my) * s); drawIllus(ctx, 'snowflake', 0, 0, 0.42 * s, {}); ctx.restore(); }
    wrapped(ctx, (tall ? -0.02 : -0.12) * s, (tall ? 0.34 : 0.26) * s, 0.36 * s, 0.17 * s, tall ? -0.12 : -0.28, wr, { band: o.band || '#c8102e' });
    const x = (tall ? 0.06 : 0.14) * s, y = (tall ? -0.1 : -0.04) * s, r = (tall ? 0.29 : 0.26) * s;
    ball(ctx, x, y, r, c, { shine: false });
    ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.4)'; lw(ctx, s, 0.016); ctx.stroke();
    if (o.emblem === 'hex') {
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6; i ? ctx.lineTo(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42) : ctx.moveTo(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42); }
      ctx.closePath(); ctx.fillStyle = 'rgba(255,240,170,.75)'; ctx.fill(); ctx.strokeStyle = 'rgba(160,90,0,.5)'; lw(ctx, s, 0.012); ctx.stroke();
    } else if (o.emblem === 'leaf') { leaf(ctx, x - r * 0.35, y + r * 0.25, r * 0.8, r * 0.26, -0.9, 'rgba(255,255,255,.7)'); }
    shine(ctx, x - r * 0.4, y - r * 0.45, r * 0.3, r * 0.14, -0.7, 0.65);
  },

  // Hi-Chew: big fruit + two twist-wrapped chews
  swHiChew(ctx, s, o = {}) {
    const c = o.col || '#f0407d', fr = o.fruit || 'strawberry', tall = !!o.tall;
    fruit(ctx, fr, (tall ? 0.0 : -0.1) * s, (tall ? -0.16 : -0.12) * s, (tall ? 0.74 : 0.66) * s);
    const icon = (ctx2, th) => fruit(ctx2, fr, 0, 0, th * 0.78);
    wrapped(ctx, (tall ? 0.12 : 0.15) * s, (tall ? 0.36 : 0.26) * s, 0.34 * s, 0.19 * s, -0.22, c, { fin: '#ffffff', band: 'rgba(255,255,255,.9)', icon });
    wrapped(ctx, (tall ? -0.16 : -0.2) * s, (tall ? 0.28 : 0.34) * s, 0.3 * s, 0.17 * s, 0.18, o.col2 || lighten(c, 0.2), { fin: '#ffffff', band: 'rgba(255,255,255,.9)', icon });
    sparkle(ctx, 0.38 * s, -0.3 * s, 0.05 * s); sparkle(ctx, -0.4 * s, 0.02 * s, 0.035 * s);
  },

  // Fisherman's Friend: anchor badge, wave and three lozenges
  swFisherman(ctx, s, o = {}) {
    const c = o.col || '#1f8a4c';
    // badge with anchor
    const bx = -0.12 * s, by = -0.12 * s, br = 0.3 * s;
    circle(ctx, bx, by, br, '#f8f1dc', '#1c3557', s * 0.03); circle(ctx, bx, by, br * 0.86, null, '#b3202a', s * 0.012);
    ctx.save(); ctx.translate(bx, by); ctx.strokeStyle = '#1c3557'; ctx.fillStyle = '#1c3557'; lw(ctx, s, 0.03);
    ctx.beginPath(); ctx.moveTo(0, -br * 0.4); ctx.lineTo(0, br * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-br * 0.3, -br * 0.18); ctx.lineTo(br * 0.3, -br * 0.18); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -br * 0.5, br * 0.1, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, br * 0.04, br * 0.5, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke();
    poly(ctx, [[-br * 0.52, br * 0.3], [-br * 0.36, br * 0.5], [-br * 0.28, br * 0.24]], '#1c3557'); poly(ctx, [[br * 0.52, br * 0.3], [br * 0.36, br * 0.5], [br * 0.28, br * 0.24]], '#1c3557');
    ctx.restore();
    // waves
    ctx.strokeStyle = '#3d7fc4'; lw(ctx, s, 0.022);
    for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const x = -0.44 * s + i * 0.075 * s, y = 0.06 * s + k * 0.06 * s + Math.sin(i * 1.1 + k) * 0.014 * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    // lozenges
    const loz = (x, y, r) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(r);
      slab(ctx, -0.13 * s, -0.09 * s, 0.26 * s, 0.18 * s, 0.06 * s, c, { lw: s * 0.022 });
      shine(ctx, -0.04 * s, -0.04 * s, 0.06 * s, 0.018 * s, 0, 0.6); ctx.restore();
    };
    loz(0.06 * s, 0.3 * s, -0.25); loz(0.3 * s, 0.24 * s, 0.35); loz(0.22 * s, 0.06 * s, 0.1);
  },

  // Xylitol gum pellets with mint leaves
  swXylitol(ctx, s, o = {}) {
    const c = o.col || '#ffffff';
    leaf(ctx, -0.38 * s, 0.22 * s, 0.5 * s, 0.13 * s, -0.75, '#1f9a48'); leaf(ctx, -0.34 * s, 0.24 * s, 0.44 * s, 0.11 * s, -1.4, '#46c26a');
    leaf(ctx, -0.36 * s, 0.24 * s, 0.4 * s, 0.1 * s, -0.1, '#178a3c');
    const pel = (x, y, r, w, h) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(r);
      fillRR(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.32, linGrad(ctx, 0, -h / 2, 0, h / 2, [[0, '#ffffff'], [0.6, c], [1, '#b9d8cf']]), '#5f8f86', s * 0.014);
      ctx.strokeStyle = 'rgba(120,170,160,.45)'; lw(ctx, s, 0.008); ctx.beginPath(); ctx.moveTo(-w * 0.32, 0); ctx.lineTo(w * 0.32, 0); ctx.stroke();
      ctx.restore();
    };
    pel(0.02 * s, -0.16 * s, 0.35, 0.3 * s, 0.2 * s); pel(0.26 * s, 0.02 * s, -0.25, 0.29 * s, 0.19 * s); pel(-0.08 * s, 0.1 * s, -0.5, 0.28 * s, 0.18 * s);
    pel(0.16 * s, 0.28 * s, 0.2, 0.26 * s, 0.17 * s); pel(-0.24 * s, -0.12 * s, -0.7, 0.24 * s, 0.16 * s);
    sparkle(ctx, 0.36 * s, -0.24 * s, 0.06 * s, '#d9fff0'); sparkle(ctx, -0.02 * s, -0.4 * s, 0.04 * s, '#d9fff0');
  },

  // Nata-de-coco jelly cup with a lychee
  swNata(ctx, s, o = {}) {
    const c = o.col || '#ff7ab0';
    const cup = () => { ctx.beginPath(); ctx.moveTo(-0.3 * s, -0.04 * s); ctx.lineTo(-0.22 * s, 0.34 * s); ctx.lineTo(0.22 * s, 0.34 * s); ctx.lineTo(0.3 * s, -0.04 * s); ctx.closePath(); };
    cup(); ctx.fillStyle = linGrad(ctx, -0.3 * s, 0, 0.3 * s, 0, [[0, lighten(c, 0.15)], [0.5, c], [1, darken(c, 0.25)]]); ctx.fill();
    ctx.save(); cup(); ctx.clip();
    for (const [x, y, r] of [[-0.14, 0.02, 0.2], [0.06, 0.05, -0.15], [0.16, 0.16, 0.3], [-0.06, 0.18, -0.3], [-0.16, 0.26, 0.1], [0.05, 0.28, 0.4]]) {
      ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r);
      fillRR(ctx, -0.055 * s, -0.055 * s, 0.11 * s, 0.11 * s, 0.02 * s, 'rgba(255,255,255,.72)', 'rgba(255,255,255,.95)', s * 0.008);
      ctx.restore();
    }
    ctx.restore();
    cup(); ctx.strokeStyle = OUT; lw(ctx, s, 0.03); ctx.stroke();
    ellipse(ctx, 0, -0.04 * s, 0.3 * s, 0.085 * s, lighten(c, 0.35), OUT, s * 0.025);
    shine(ctx, -0.17 * s, 0.1 * s, 0.03 * s, 0.11 * s, 0.2, 0.5);
    // lychee on top
    const lx = 0.06 * s, ly = -0.2 * s, lr = 0.15 * s;
    ctx.beginPath(); ctx.arc(lx + lr * 0.5, ly - lr * 0.1, lr * 0.85, 0, TAU); ctx.fillStyle = '#e8435a'; ctx.fill(); ctx.strokeStyle = '#8a1a2a'; lw(ctx, s, 0.02); ctx.stroke();
    ball(ctx, lx - lr * 0.1, ly, lr, '#fffaf0', { line: '#c9b8a6' });
    ctx.fillStyle = '#5a2c14'; ctx.beginPath(); ctx.ellipse(lx - lr * 0.1, ly + lr * 0.1, lr * 0.28, lr * 0.4, 0.3, 0, TAU); ctx.globalAlpha = 0.16; ctx.fill(); ctx.globalAlpha = 1;
    leaf(ctx, 0.2 * s, -0.36 * s, 0.22 * s, 0.07 * s, 2.3, '#2e9b3e');
  },

  // Chupa-Chups-style lollipop with a daisy
  swLollipop(ctx, s, o = {}) {
    const c = o.col || '#ff5c8a', sw2 = o.col2 || '#ffffff';
    sparkle(ctx, -0.34 * s, -0.3 * s, 0.05 * s); sparkle(ctx, 0.4 * s, 0.1 * s, 0.04 * s); sparkle(ctx, -0.36 * s, 0.1 * s, 0.03 * s);
    ctx.save(); ctx.translate(0.02 * s, 0.02 * s); ctx.rotate(0.42);
    // stick
    fillRR(ctx, -0.022 * s, 0.05 * s, 0.044 * s, 0.42 * s, 0.02 * s, '#f4f1ea', '#a89f8a', s * 0.014);
    // ball
    const r = 0.29 * s, by = -0.16 * s;
    ctx.beginPath(); ctx.arc(0, by, r, 0, TAU); ctx.fillStyle = radGrad(ctx, 0, by, 0, r, [[0, lighten(c, 0.5)], [0.55, c], [1, darken(c, 0.3)]], -r * 0.35, by - r * 0.4); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, by, r, 0, TAU); ctx.clip();
    ctx.strokeStyle = sw2; lw(ctx, s, 0.045); ctx.globalAlpha = 0.85;
    ctx.beginPath(); for (let i = 0; i <= 60; i++) { const a = i * 0.22, rr = (i / 60) * r * 1.02; const x = Math.cos(a) * rr, y = by + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.globalAlpha = 1; ctx.restore();
    ctx.beginPath(); ctx.arc(0, by, r, 0, TAU); ctx.strokeStyle = darken(c, 0.5); lw(ctx, s, 0.03); ctx.stroke();
    shine(ctx, -r * 0.42, by - r * 0.45, r * 0.26, r * 0.13, -0.7, 0.7);
    // daisy collar
    const dy = by + r * 0.98;
    for (let i = 0; i < 8; i++) { ctx.save(); ctx.translate(0, dy); ctx.rotate((i * TAU) / 8); ellipse(ctx, 0, -0.07 * s, 0.035 * s, 0.075 * s, '#ffd400', '#c58a00', s * 0.01); ctx.restore(); }
    circle(ctx, 0, dy, 0.045 * s, '#e4002b', '#8f0018', s * 0.01);
    ctx.restore();
  },

  // Tic Tac box with scattered pills
  swTicTac(ctx, s, o = {}) {
    const lid = o.col || '#1ea85a', pill = o.col2 || '#ffffff';
    const P = (x, y, r, sc = 1) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ellipse(ctx, 0, 0, 0.05 * s * sc, 0.033 * s * sc, pill, darken(pill, 0.45), s * 0.01); shine(ctx, -0.014 * s * sc, -0.01 * s * sc, 0.016 * s * sc, 0.008 * s * sc, 0, 0.7); ctx.restore(); };
    P(-0.3 * s, 0.34 * s, 0.4); P(-0.16 * s, 0.4 * s, -0.3); P(0.32 * s, 0.34 * s, 0.2); P(0.42 * s, 0.24 * s, -0.5);
    ctx.save(); ctx.translate(0.0, -0.02 * s); ctx.rotate(-0.3);
    const W = 0.7 * s, H = 0.34 * s;
    fillRR(ctx, -W / 2, -H / 2, W, H, H * 0.14, 'rgba(225,242,250,.85)', '#5d7b8c', s * 0.026);
    // pills inside
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) P2(-W * 0.15 + i * 0.075 * s, -H * 0.18 + r * H * 0.36, (i + r) % 2 ? 0.2 : -0.2);
    function P2(x, y, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ellipse(ctx, 0, 0, 0.032 * s, 0.021 * s, pill, darken(pill, 0.45), s * 0.007); ctx.restore(); }
    // coloured label + lid
    ctx.fillStyle = lid; ctx.fillRect(-W / 2 + s * 0.013, -H / 2 + s * 0.013, W * 0.26, H - s * 0.026);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(-W / 2 + s * 0.013, -H * 0.1, W * 0.26, H * 0.2);
    fillRR(ctx, W / 2 - W * 0.13, -H / 2 - s * 0.012, W * 0.13, H + s * 0.024, H * 0.1, lid, darken(lid, 0.5), s * 0.022);
    shine(ctx, -W * 0.1, -H * 0.38, W * 0.2, H * 0.04, 0, 0.5);
    ctx.restore();
  },

  // gummy bears
  swGummyBears(ctx, s, o = {}) {
    const bear = (x, y, u, c, rot) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      const part = (px, py, rx, ry, r = 0) => {
        ctx.beginPath(); ctx.ellipse(px * u, py * u, rx * u, ry * u, r, 0, TAU);
        ctx.fillStyle = radGrad(ctx, px * u, py * u, 0, Math.max(rx, ry) * u, [[0, lighten(c, 0.45)], [0.6, c], [1, darken(c, 0.25)]], (px - rx * 0.3) * u, (py - ry * 0.35) * u); ctx.fill();
        ctx.strokeStyle = darken(c, 0.5); lw(ctx, u, 0.03); ctx.stroke();
      };
      part(-0.26, -0.02, 0.09, 0.17, 0.55); part(0.26, -0.02, 0.09, 0.17, -0.55); part(-0.15, 0.3, 0.1, 0.13, 0.15); part(0.15, 0.3, 0.1, 0.13, -0.15);
      part(0, 0.04, 0.24, 0.3); part(-0.16, -0.5, 0.09, 0.09); part(0.16, -0.5, 0.09, 0.09); part(0, -0.33, 0.22, 0.2);
      ctx.fillStyle = darken(c, 0.55); ctx.beginPath(); ctx.arc(-0.08 * u, -0.37 * u, 0.022 * u, 0, TAU); ctx.arc(0.08 * u, -0.37 * u, 0.022 * u, 0, TAU); ctx.fill();
      ellipse(ctx, 0, -0.28 * u, 0.07 * u, 0.05 * u, lighten(c, 0.35), darken(c, 0.4), u * 0.012); circle(ctx, 0, -0.295 * u, 0.02 * u, darken(c, 0.6));
      shine(ctx, -0.1 * u, -0.05 * u, 0.045 * u, 0.13 * u, 0.25, 0.5);
      ctx.restore();
    };
    const u = 0.5 * s;
    bear(-0.2 * s, 0.02 * s, u, o.col || '#e8262f', -0.3);
    bear(0.22 * s, 0.06 * s, u, o.col2 || '#ffb31a', 0.3);
    bear(0.0, 0.24 * s, u * 0.92, o.col3 || '#3fb84a', 0.0);
    sparkle(ctx, 0.4 * s, -0.32 * s, 0.05 * s); sparkle(ctx, -0.42 * s, -0.24 * s, 0.035 * s);
  },

  // gummy cola bottles
  swColaGummy(ctx, s, o = {}) {
    const bottle = (x, y, H, rot) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      const path = () => {
        ctx.beginPath(); ctx.moveTo(-0.075 * H, -0.5 * H); ctx.lineTo(0.075 * H, -0.5 * H); ctx.lineTo(0.075 * H, -0.34 * H);
        ctx.bezierCurveTo(0.1 * H, -0.24 * H, 0.2 * H, -0.2 * H, 0.2 * H, -0.08 * H); ctx.lineTo(0.2 * H, 0.42 * H); ctx.quadraticCurveTo(0.2 * H, 0.5 * H, 0.12 * H, 0.5 * H);
        ctx.lineTo(-0.12 * H, 0.5 * H); ctx.quadraticCurveTo(-0.2 * H, 0.5 * H, -0.2 * H, 0.42 * H); ctx.lineTo(-0.2 * H, -0.08 * H);
        ctx.bezierCurveTo(-0.2 * H, -0.2 * H, -0.1 * H, -0.24 * H, -0.075 * H, -0.34 * H); ctx.closePath();
      };
      path(); ctx.fillStyle = linGrad(ctx, -0.2 * H, 0, 0.2 * H, 0, [[0, '#4a2410'], [0.4, '#8a4a22'], [0.6, '#7a3f1c'], [1, '#3a1a0a']]); ctx.fill();
      ctx.save(); path(); ctx.clip();
      // foam
      ctx.fillStyle = '#fff4e0'; ctx.fillRect(-0.3 * H, -0.52 * H, 0.6 * H, 0.2 * H);
      for (const [bx, by, br] of [[-0.1, -0.31, 0.06], [0.05, -0.33, 0.07], [0.15, -0.3, 0.05], [-0.16, -0.27, 0.04]]) { circle(ctx, bx * H, by * H, br * H, '#fff4e0', '#c9b090', H * 0.008); }
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-0.15 * H, -0.2 * H, 0.05 * H, 0.6 * H);
      // label band
      ctx.fillStyle = '#e4002b'; ctx.fillRect(-0.3 * H, 0.05 * H, 0.6 * H, 0.2 * H);
      ctx.fillStyle = '#fff'; ctx.fillRect(-0.3 * H, 0.12 * H, 0.6 * H, 0.05 * H);
      ctx.restore();
      path(); ctx.strokeStyle = '#2a1206'; lw(ctx, H, 0.03); ctx.stroke();
      ctx.restore();
    };
    bottle(-0.14 * s, 0.02 * s, 0.86 * s, -0.32);
    bottle(0.16 * s, 0.06 * s, 0.86 * s, 0.3);
    sparkle(ctx, 0.4 * s, -0.36 * s, 0.045 * s); sparkle(ctx, -0.42 * s, 0.3 * s, 0.035 * s);
  },

  // Look Choob: glazed fruit-shaped mung-bean sweets
  swLookChoob(ctx, s, o = {}) {
    // banana-leaf base
    leaf(ctx, -0.46 * s, 0.3 * s, 0.9 * s, 0.22 * s, -0.12, '#2f8f45'); leaf(ctx, -0.46 * s, 0.34 * s, 0.9 * s, 0.14 * s, -0.05, '#49b060');
    const glaze = (x, y, w, h, c, rot = 0) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fillStyle = radGrad(ctx, 0, 0, 0, Math.max(w, h), [[0, lighten(c, 0.5)], [0.55, c], [1, darken(c, 0.28)]], -w * 0.35, -h * 0.4); ctx.fill();
      ctx.strokeStyle = darken(c, 0.5); lw(ctx, s, 0.018); ctx.stroke();
      shine(ctx, -w * 0.38, -h * 0.42, w * 0.26, h * 0.13, -0.5, 0.75);
      ctx.restore();
    };
    // mango
    glaze(-0.17 * s, -0.06 * s, 0.22 * s, 0.15 * s, '#ffc21a', -0.45); ctx.fillStyle = 'rgba(255,90,40,.45)'; ctx.beginPath(); ctx.ellipse(-0.1 * s, 0.0, 0.1 * s, 0.07 * s, -0.45, 0, TAU); ctx.fill();
    leaf(ctx, -0.02 * s, -0.16 * s, 0.14 * s, 0.05 * s, -0.7, '#2e9b3e');
    // mangosteen
    glaze(0.2 * s, -0.12 * s, 0.14 * s, 0.14 * s, '#7b2d8b'); for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(0.2 * s, -0.24 * s); ctx.rotate((i - 1.5) * 0.5); leaf(ctx, 0, 0, 0.08 * s, 0.03 * s, -Math.PI / 2, '#3a9a48'); ctx.restore(); }
    // chilli
    ctx.save(); ctx.translate(-0.06 * s, 0.2 * s); ctx.rotate(-0.25);
    ctx.beginPath(); ctx.moveTo(-0.26 * s, 0); ctx.quadraticCurveTo(0.02 * s, -0.14 * s, 0.26 * s, 0.05 * s); ctx.quadraticCurveTo(0.02 * s, 0.1 * s, -0.26 * s, 0);
    ctx.fillStyle = linGrad(ctx, 0, -0.1 * s, 0, 0.1 * s, [[0, '#ff6a4a'], [1, '#c8102e']]); ctx.fill(); ctx.strokeStyle = '#701008'; lw(ctx, s, 0.018); ctx.stroke();
    leaf(ctx, -0.26 * s, 0, 0.1 * s, 0.04 * s, 3.4, '#2e9b3e'); shine(ctx, -0.02 * s, -0.045 * s, 0.09 * s, 0.014 * s, 0.1, 0.7); ctx.restore();
    // rose apple / strawberry
    glaze(0.26 * s, 0.16 * s, 0.11 * s, 0.14 * s, '#ff6f9a', 0.3);
    leaf(ctx, 0.26 * s, 0.03 * s, 0.09 * s, 0.03 * s, -1.2, '#2e9b3e');
    sparkle(ctx, -0.38 * s, -0.24 * s, 0.045 * s); sparkle(ctx, 0.42 * s, -0.3 * s, 0.035 * s);
  },

  // sugar-coated tamarind
  swTamarind(ctx, s, o = {}) {
    // pod: two shell halves with a cracked-open gap showing sticky pulp and seeds
    ctx.save(); ctx.translate(-0.02 * s, -0.1 * s); ctx.rotate(-0.28);
    const bez = (t) => { const u = 1 - t; return [u * u * u * -0.42 + 3 * u * u * t * -0.22 + 3 * u * t * t * 0.16 + t * t * t * 0.42, u * u * u * 0.06 + 3 * u * u * t * -0.19 + 3 * u * t * t * -0.19 + t * t * t * 0.06]; };
    const trace = (t0, t1) => { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const [x, y] = bez(t0 + ((t1 - t0) * i) / 24); i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s); } };
    const stroke = (t0, t1, w, c, dy = 0) => { ctx.save(); ctx.translate(0, dy * s); trace(t0, t1); ctx.strokeStyle = c; ctx.lineWidth = w * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); };
    for (const [a, b] of [[0, 0.36], [0.64, 1]]) {
      stroke(a, b, 0.18, '#3f2210'); stroke(a, b, 0.15, '#a3672d'); stroke(a, b, 0.05, '#c98e4c', -0.03); stroke(a, b, 0.05, 'rgba(60,30,10,.55)', 0.045);
      for (const t of (a === 0 ? [0.07, 0.15, 0.23, 0.31] : [0.69, 0.77, 0.85, 0.93])) {
        const [x, y] = bez(t), [x2, y2] = bez(t + 0.01), [x1, y1] = bez(t - 0.01), ang = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
        ctx.strokeStyle = 'rgba(50,25,8,.6)'; lw(ctx, s, 0.014); ctx.beginPath(); ctx.moveTo(x * s - Math.cos(ang) * 0.06 * s, y * s - Math.sin(ang) * 0.06 * s); ctx.lineTo(x * s + Math.cos(ang) * 0.06 * s, y * s + Math.sin(ang) * 0.06 * s); ctx.stroke();
      }
    }
    stroke(0.33, 0.67, 0.12, '#2e1508'); stroke(0.33, 0.67, 0.095, '#6b3418'); stroke(0.33, 0.67, 0.03, '#a05a2a', -0.02);
    for (const [t, r] of [[0.42, 0.3], [0.5, -0.2], [0.58, 0.25]]) { const [x, y] = bez(t); ellipse(ctx, x * s, (y - 0.005) * s, 0.036 * s, 0.024 * s, '#2a1206', '#000', s * 0.008, r); shine(ctx, x * s - 0.01 * s, (y - 0.012) * s, 0.013 * s, 0.006 * s, 0, 0.7); }
    ctx.restore();
    // coated balls
    const sb = (x, y, r, c) => {
      ball(ctx, x, y, r, c, { shine: false });
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 14; i++) { const a = i * 2.4, rr = r * (0.2 + ((i * 37) % 70) / 100); ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, r * 0.055, 0, TAU); ctx.fill(); }
    };
    sb(-0.24 * s, 0.24 * s, 0.13 * s, '#b5482a'); sb(0.0, 0.3 * s, 0.12 * s, '#c85a2a'); sb(0.24 * s, 0.22 * s, 0.13 * s, '#a63a20'); sb(0.06 * s, 0.14 * s, 0.1 * s, '#c24e26');
    // chilli
    ctx.save(); ctx.translate(-0.34 * s, 0.06 * s); ctx.rotate(-0.9);
    ctx.beginPath(); ctx.moveTo(-0.18 * s, 0); ctx.quadraticCurveTo(0, -0.07 * s, 0.18 * s, 0.03 * s); ctx.quadraticCurveTo(0, 0.06 * s, -0.18 * s, 0); ctx.fillStyle = '#e8261c'; ctx.fill(); ctx.strokeStyle = '#701008'; lw(ctx, s, 0.014); ctx.stroke();
    leaf(ctx, 0.18 * s, 0.03 * s, 0.07 * s, 0.03 * s, 0.2, '#2e9b3e'); ctx.restore();
  },

  // ------------------------------------------------------------------ chocolate & wafers
  // four-finger wafer bar plus a snapped finger showing the wafer layers
  swKitKat(ctx, s, o = {}) {
    const coat = o.col || '#5a2c14';
    if (o.leaf) drawIllus(ctx, 'teaLeaf', 0.06 * s, -0.04 * s, 0.9 * s, { c1: '#3ba54a' });
    const finger = (x, y, w, h) => {
      fillRR(ctx, x, y, w, h, h * 0.18, linGrad(ctx, 0, y, 0, y + h, [[0, lighten(coat, 0.3)], [0.5, coat], [1, darken(coat, 0.32)]]), darken(coat, 0.62), s * 0.02);
      ctx.fillStyle = 'rgba(255,255,255,.26)'; ctx.fillRect(x + w * 0.12, y + h * 0.13, w * 0.76, h * 0.09);
    };
    ctx.save(); ctx.translate(-0.02 * s, -0.14 * s); ctx.rotate(-0.28);
    const W = 0.88 * s, H = 0.25 * s;
    slab(ctx, -W / 2, -H / 2, W, H, H * 0.14, coat, { lw: s * 0.024 });
    ctx.strokeStyle = darken(coat, 0.62); lw(ctx, s, 0.02);
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-W / 2 + (i * W) / 4, -H / 2); ctx.lineTo(-W / 2 + (i * W) / 4, H / 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.26)'; for (let i = 0; i < 4; i++) ctx.fillRect(-W / 2 + (i * W) / 4 + W * 0.025, -H * 0.36, W / 4 - W * 0.05, H * 0.1);
    ctx.restore();
    ctx.save(); ctx.translate(0.05 * s, 0.26 * s); ctx.rotate(0.14);
    const fh = 0.16 * s, x0 = -0.32 * s, x1 = -0.08 * s;
    finger(x1 - s * 0.01, -fh / 2, 0.46 * s, fh);
    const jag = () => { ctx.beginPath(); ctx.moveTo(x1, -fh / 2); ctx.lineTo(x0 + 0.03 * s, -fh / 2); ctx.lineTo(x0, -fh * 0.24); ctx.lineTo(x0 + 0.035 * s, 0.02 * s); ctx.lineTo(x0 - 0.005 * s, fh * 0.28); ctx.lineTo(x0 + 0.03 * s, fh / 2); ctx.lineTo(x1, fh / 2); ctx.closePath(); };
    ctx.save(); jag(); ctx.clip();
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i === 0 || i === 6 ? coat : i % 2 ? '#c98f42' : '#f0cf8a'; ctx.fillRect(x0 - 4, -fh / 2 + (i * fh) / 7, x1 - x0 + 8, fh / 7 + 0.6); }
    ctx.restore(); jag(); ctx.strokeStyle = darken(coat, 0.62); lw(ctx, s, 0.02); ctx.stroke();
    ctx.restore();
    sparkle(ctx, 0.4 * s, -0.36 * s, 0.045 * s); sparkle(ctx, -0.42 * s, 0.1 * s, 0.03 * s);
  },

  // Snickers-style: whole bar with caramel drizzle + cross-section
  swSnickers(ctx, s, o = {}) {
    const coat = o.col || '#6b3418', caramel = '#e5a130', nougat = '#f3e2c2';
    ctx.save(); ctx.translate(-0.06 * s, -0.15 * s); ctx.rotate(-0.26);
    slab(ctx, -0.38 * s, -0.1 * s, 0.76 * s, 0.2 * s, 0.09 * s, coat, { lw: s * 0.025 });
    ctx.strokeStyle = caramel; lw(ctx, s, 0.022);
    ctx.beginPath(); for (let i = 0; i <= 9; i++) { const x = -0.33 * s + i * 0.073 * s, y = (i % 2 ? 0.05 : -0.05) * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    shine(ctx, -0.2 * s, -0.07 * s, 0.1 * s, 0.014 * s, 0, 0.4);
    ctx.restore();
    ctx.save(); ctx.translate(0.05 * s, 0.24 * s); ctx.rotate(0.07);
    slice(ctx, -0.36 * s, -0.16 * s, 0.72 * s, 0.32 * s, 0.06 * s, [[coat, 0.15], [caramel, 0.4], [nougat, 0.3], [coat, 0.15]], {
      draw: () => { for (let i = 0; i < 7; i++) peanut(ctx, (-0.29 + i * 0.097) * s, (-0.045 + (i % 2) * 0.05) * s, 0.055 * s, (i % 3) - 1); },
    });
    ctx.restore();
    peanut(ctx, 0.36 * s, -0.3 * s, 0.07 * s, 0.5); peanut(ctx, -0.4 * s, 0.32 * s, 0.06 * s, -0.4);
  },

  // M&M's-style lentils
  swMandM(ctx, s, o = {}) {
    const disc = (x, y, r, c, rot) => {
      ball(ctx, x, y, r, c, { lw: r * 0.07 });
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); txt(ctx, 'm', 0, r * 0.06, r * 1.15, 'lilita', '#ffffff'); ctx.restore();
    };
    if (o.peanut) { peanut(ctx, 0.3 * s, 0.34 * s, 0.09 * s, 0.4); peanut(ctx, -0.34 * s, 0.34 * s, 0.075 * s, -0.5); }
    disc(-0.3 * s, -0.16 * s, 0.15 * s, '#ffd400', -0.3); disc(0.3 * s, -0.2 * s, 0.14 * s, '#1e63c8', 0.4);
    disc(0.0, 0.0, 0.22 * s, o.col || '#e8262f', 0.1);
    disc(-0.26 * s, 0.24 * s, 0.13 * s, '#2fa84a', 0.5); disc(0.26 * s, 0.2 * s, 0.14 * s, '#ff7a1a', -0.4); disc(0.02 * s, -0.34 * s, 0.11 * s, '#7a3f1c', 0.2);
  },

  // Kinder Bueno-style: hazelnut bar with white drizzle + cross-section
  swBueno(ctx, s, o = {}) {
    const coat = o.col || '#7a4526', wafer = '#e6c17f', cream = '#f7edd6';
    ctx.save(); ctx.translate(-0.02 * s, -0.17 * s); ctx.rotate(-0.22);
    slab(ctx, -0.4 * s, -0.1 * s, 0.8 * s, 0.2 * s, 0.09 * s, coat, { lw: s * 0.025 });
    ctx.strokeStyle = o.drizzle || '#fff6df'; lw(ctx, s, 0.02);
    ctx.beginPath(); for (let i = 0; i <= 11; i++) { const x = -0.36 * s + i * 0.065 * s, y = (i % 2 ? 0.045 : -0.045) * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    shine(ctx, -0.24 * s, -0.075 * s, 0.09 * s, 0.013 * s, 0, 0.35);
    ctx.restore();
    ctx.save(); ctx.translate(0.0, 0.24 * s); ctx.rotate(0.05);
    slice(ctx, -0.36 * s, -0.16 * s, 0.72 * s, 0.32 * s, 0.07 * s, [[coat, 0.13], [wafer, 0.09], [cream, 0.2], [wafer, 0.09], [cream, 0.2], [wafer, 0.09], [coat, 0.13]], {
      draw: () => { ctx.fillStyle = '#b97a3c'; for (let i = 0; i < 22; i++) { ctx.beginPath(); ctx.arc((-0.33 + ((i * 37) % 66) / 100) * s, (-0.02 + (((i * 53) % 40) / 100) * 0.3 - 0.06) * s, 0.011 * s, 0, TAU); ctx.fill(); } },
    });
    ctx.restore();
    hazelnut(ctx, 0.38 * s, -0.34 * s, 0.065 * s, 0.4); hazelnut(ctx, -0.4 * s, 0.4 * s, 0.055 * s, -0.5);
  },

  // Kinder Joy-style egg with wafer balls and a spoon
  swKinderJoy(ctx, s, o = {}) {
    ball(ctx, -0.34 * s, 0.34 * s, 0.06 * s, '#8a5a2c'); ball(ctx, -0.22 * s, 0.4 * s, 0.05 * s, '#6a3a1c'); ball(ctx, 0.36 * s, 0.38 * s, 0.055 * s, '#8a5a2c');
    ctx.save(); ctx.translate(0.36 * s, -0.2 * s); ctx.rotate(0.6); fillRR(ctx, -0.02 * s, -0.16 * s, 0.04 * s, 0.32 * s, 0.02 * s, '#f4f1ea', '#a89f8a', s * 0.012); ellipse(ctx, 0, -0.17 * s, 0.05 * s, 0.035 * s, '#f4f1ea', '#a89f8a', s * 0.012); ctx.restore();
    ctx.save(); ctx.translate(-0.03 * s, -0.02 * s); ctx.rotate(0.2);
    const egg = () => { ctx.beginPath(); ctx.moveTo(0, -0.38 * s); ctx.bezierCurveTo(0.17 * s, -0.38 * s, 0.3 * s, -0.12 * s, 0.3 * s, 0.08 * s); ctx.bezierCurveTo(0.3 * s, 0.27 * s, 0.17 * s, 0.38 * s, 0, 0.38 * s); ctx.bezierCurveTo(-0.17 * s, 0.38 * s, -0.3 * s, 0.27 * s, -0.3 * s, 0.08 * s); ctx.bezierCurveTo(-0.3 * s, -0.12 * s, -0.17 * s, -0.38 * s, 0, -0.38 * s); ctx.closePath(); };
    egg(); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.save(); egg(); ctx.clip();
    ctx.fillStyle = linGrad(ctx, 0, -0.4 * s, 0, 0.05 * s, [[0, '#dff1ff'], [1, '#ffffff']]); ctx.fillRect(-0.4 * s, -0.4 * s, 0.8 * s, 0.5 * s);
    ctx.fillStyle = '#e01f26'; ctx.beginPath(); ctx.moveTo(-0.4 * s, 0.06 * s); for (let i = 0; i <= 12; i++) ctx.lineTo(-0.4 * s + i * 0.0667 * s, (0.06 + Math.sin(i * 0.9) * 0.03) * s); ctx.lineTo(0.4 * s, 0.5 * s); ctx.lineTo(-0.4 * s, 0.5 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc((-0.2 + (i % 4) * 0.13) * s, (0.2 + Math.floor(i / 4) * 0.1) * s, 0.02 * s, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1e63c8'; for (const [x, y, r] of [[-0.12, -0.16, 0.05], [0.1, -0.24, 0.04], [0.14, -0.06, 0.045]]) { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffd400'; ctx.beginPath(); ctx.arc(-0.14 * s, -0.02 * s, 0.035 * s, 0, TAU); ctx.fill();
    shine(ctx, -0.13 * s, -0.24 * s, 0.05 * s, 0.11 * s, 0.4, 0.55);
    ctx.restore(); egg(); ctx.strokeStyle = '#7a1018'; lw(ctx, s, 0.03); ctx.stroke();
    ctx.restore();
  },

  // Ferrero Rocher-style gold-wrapped praline + cut-open one in a paper cup
  swFerrero(ctx, s, o = {}) {
    ctx.save(); ctx.translate(0.24 * s, 0.16 * s);
    ctx.beginPath(); ctx.moveTo(-0.2 * s, 0); ctx.lineTo(-0.15 * s, 0.24 * s); ctx.lineTo(0.15 * s, 0.24 * s); ctx.lineTo(0.2 * s, 0); ctx.closePath();
    ctx.fillStyle = '#7a4a24'; ctx.fill(); ctx.strokeStyle = '#3a1c08'; lw(ctx, s, 0.022); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; lw(ctx, s, 0.01); for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 0.05 * s, 0); ctx.lineTo(i * 0.038 * s, 0.24 * s); ctx.stroke(); }
    const r = 0.2 * s;
    ball(ctx, 0, -0.08 * s, r, '#7a4a1e', { shine: false });
    ctx.fillStyle = '#c99050'; for (let i = 0; i < 26; i++) { const a = i * 2.4, rr = r * (0.7 + ((i * 29) % 30) / 100); ctx.beginPath(); ctx.arc(Math.cos(a) * rr * 0.95, -0.08 * s + Math.sin(a) * rr * 0.95, r * 0.05, 0, TAU); ctx.fill(); }
    circle(ctx, 0, -0.08 * s, r * 0.68, '#e8c88a', '#a8763a', s * 0.012); circle(ctx, 0, -0.08 * s, r * 0.5, '#8a5a34'); circle(ctx, 0, -0.08 * s, r * 0.42, '#f3e3c2');
    hazelnut(ctx, 0, -0.08 * s, r * 0.24, 0.3);
    ctx.restore();
    // gold ball
    const bx = -0.16 * s, by = -0.02 * s, br = 0.28 * s;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU);
    ctx.fillStyle = radGrad(ctx, bx, by, 0, br, [[0, '#fff3a6'], [0.45, '#e8b820'], [1, '#8a5a06']], bx - br * 0.35, by - br * 0.4); ctx.fill();
    ctx.strokeStyle = '#6a4204'; lw(ctx, s, 0.028); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(bx, by, br * 0.98, 0, TAU); ctx.clip();
    for (let i = 0; i < 20; i++) {
      const a = i * 2.39, d = br * (0.15 + ((i * 47) % 80) / 100), x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d, l = br * 0.3;
      ctx.strokeStyle = i % 2 ? 'rgba(90,50,0,.32)' : 'rgba(255,245,180,.65)'; lw(ctx, s, 0.012);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a + 1.2) * l, y + Math.sin(a + 1.2) * l); ctx.stroke();
    }
    ctx.restore();
    ellipse(ctx, bx, by + br * 0.02, br * 0.34, br * 0.26, '#6b3c18', '#f2c14e', s * 0.016);
    txt(ctx, 'FR', bx, by + br * 0.04, br * 0.3, 'chonburi', '#f2c14e');
    shine(ctx, bx - br * 0.4, by - br * 0.45, br * 0.22, br * 0.1, -0.7, 0.7);
    // foil tails
    for (const a of [-0.5, 0.2]) { ctx.save(); ctx.translate(bx, by - br * 0.95); ctx.rotate(a); poly(ctx, [[-br * 0.14, 0], [0, -br * 0.24], [br * 0.14, 0]], '#e8b820', '#6a4204', s * 0.014); ctx.restore(); }
  },

  // Toblerone-style: Matterhorn and a row of chocolate triangles
  swToblerone(ctx, s, o = {}) {
    poly(ctx, [[-0.46 * s, 0.14 * s], [-0.24 * s, -0.08 * s], [-0.16 * s, -0.04 * s], [0.0 * s, -0.42 * s], [0.06 * s, -0.32 * s], [0.12 * s, -0.36 * s], [0.18 * s, -0.16 * s], [0.46 * s, 0.14 * s]], linGrad(ctx, 0, -0.42 * s, 0, 0.14 * s, [[0, '#dfe9f5'], [1, '#6f8fb8']]), '#2f4468', s * 0.026);
    poly(ctx, [[-0.08 * s, -0.24 * s], [0.0, -0.42 * s], [0.06 * s, -0.32 * s], [0.12 * s, -0.36 * s], [0.15 * s, -0.24 * s], [0.08 * s, -0.2 * s], [0.02 * s, -0.26 * s]], '#ffffff', '#2f4468', s * 0.014);
    const tri = (cx, base, h, c) => {
      ctx.beginPath(); ctx.moveTo(cx - base / 2, 0.36 * s); ctx.lineTo(cx, 0.36 * s - h); ctx.lineTo(cx + base / 2, 0.36 * s); ctx.closePath();
      ctx.fillStyle = linGrad(ctx, cx - base / 2, 0, cx + base / 2, 0, [[0, lighten(c, 0.28)], [0.5, c], [1, darken(c, 0.3)]]); ctx.fill(); ctx.strokeStyle = '#2a1206'; lw(ctx, s, 0.024); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0.36 * s - h); ctx.lineTo(cx, 0.36 * s); ctx.strokeStyle = 'rgba(0,0,0,.35)'; lw(ctx, s, 0.012); ctx.stroke();
      shine(ctx, cx - base * 0.16, 0.36 * s - h * 0.55, base * 0.06, h * 0.16, 0.2, 0.4);
    };
    const c = o.col || '#7a4526';
    for (let i = 0; i < 4; i++) tri(-0.33 * s + i * 0.22 * s, 0.24 * s, 0.24 * s, c);
    if (o.honey) { drawIllus(ctx, 'honey', 0.36 * s, -0.2 * s, 0.3 * s, {}); }
    if (o.nuts) { hazelnut(ctx, 0.4 * s, 0.14 * s, 0.05 * s, 0.4); }
    sparkle(ctx, -0.4 * s, -0.3 * s, 0.045 * s, '#fff');
  },

  // Cadbury-style block of squares with a milk splash
  swDairyMilk(ctx, s, o = {}) {
    const coat = o.col || '#6b3418';
    // glass of milk with a splash crown
    ctx.save(); ctx.translate(0.0, -0.2 * s);
    const glass = () => { ctx.beginPath(); ctx.moveTo(-0.15 * s, -0.12 * s); ctx.lineTo(0.15 * s, -0.12 * s); ctx.lineTo(0.11 * s, 0.22 * s); ctx.quadraticCurveTo(0, 0.25 * s, -0.11 * s, 0.22 * s); ctx.closePath(); };
    glass(); ctx.fillStyle = 'rgba(230,242,255,.5)'; ctx.fill();
    ctx.save(); glass(); ctx.clip(); ctx.fillStyle = '#ffffff'; ctx.fillRect(-0.2 * s, -0.06 * s, 0.4 * s, 0.4 * s); ctx.fillStyle = '#dcecff'; ctx.fillRect(-0.2 * s, 0.12 * s, 0.4 * s, 0.2 * s); ctx.restore();
    ellipse(ctx, 0, -0.06 * s, 0.15 * s, 0.03 * s, '#ffffff', '#b8d0e8', s * 0.012);
    glass(); ctx.strokeStyle = '#8fb0d0'; lw(ctx, s, 0.022); ctx.stroke();
    for (const [x, y, rx, ry, r] of [[-0.09, -0.17, 0.03, 0.06, -0.4], [0, -0.21, 0.035, 0.075, 0], [0.09, -0.16, 0.03, 0.055, 0.4], [-0.16, -0.11, 0.02, 0.035, -0.9], [0.16, -0.1, 0.02, 0.035, 0.9]]) ellipse(ctx, x * s, y * s, rx * s, ry * s, '#ffffff', '#b8d0e8', s * 0.01, r);
    shine(ctx, -0.07 * s, 0.05 * s, 0.014 * s, 0.09 * s, 0.1, 0.6);
    ctx.restore();
    ctx.save(); ctx.translate(0.02 * s, 0.2 * s); ctx.rotate(-0.1);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const x = (-0.335 + c * 0.225) * s, y = (-0.135 + r * 0.225) * s, w = 0.215 * s;
      slab(ctx, x, y, w, w, w * 0.14, coat, { lw: s * 0.02 });
      fillRR(ctx, x + w * 0.18, y + w * 0.18, w * 0.64, w * 0.64, w * 0.08, null, 'rgba(255,255,255,.22)', s * 0.012);
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x + w * 0.1, y + w * 0.08, w * 0.8, w * 0.06);
    }
    ctx.restore();
    if (o.nut === 'almond') {
      for (const [x, y, r] of [[-0.36, 0.42, 0.5], [0.34, 0.44, -0.4], [0.4, -0.02, 0.9]]) {
        ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r); ellipse(ctx, 0, 0, 0.07 * s, 0.043 * s, '#c98f52', '#6a3a16', s * 0.014); ctx.beginPath(); ctx.moveTo(-0.04 * s, 0); ctx.lineTo(0.05 * s, 0); ctx.strokeStyle = 'rgba(90,50,20,.5)'; lw(ctx, s, 0.008); ctx.stroke(); ctx.restore();
      }
    }
  },

  // Beng-Beng-style caramel & crispy wafer bar
  swBengBeng(ctx, s, o = {}) {
    const coat = o.col || '#4a2410', tall = !!o.tall;
    ctx.save(); ctx.translate(-0.03 * s, (tall ? -0.26 : -0.15) * s); ctx.rotate(-0.28);
    slab(ctx, -0.4 * s, -0.1 * s, 0.8 * s, 0.2 * s, 0.07 * s, coat, { lw: s * 0.025 });
    ctx.fillStyle = 'rgba(255,220,150,.5)'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.ellipse((-0.36 + (i % 8) * 0.1) * s, (i < 8 ? -0.045 : 0.05) * s, 0.018 * s, 0.01 * s, i, 0, TAU); ctx.fill(); }
    shine(ctx, -0.22 * s, -0.076 * s, 0.1 * s, 0.013 * s, 0, 0.35);
    ctx.restore();
    ctx.save(); ctx.translate(0.04 * s, (tall ? 0.3 : 0.24) * s); ctx.rotate(0.06);
    slice(ctx, -0.36 * s, -0.16 * s, 0.72 * s, 0.32 * s, 0.06 * s, [[coat, 0.14], ['#e9c27a', 0.16], ['#d99a2a', 0.26], ['#c9a878', 0.2], ['#e9c27a', 0.12], [coat, 0.12]], {
      draw: () => { ctx.fillStyle = '#f3dcae'; for (let i = 0; i < 24; i++) { ctx.beginPath(); ctx.ellipse((-0.33 + ((i * 41) % 66) / 100) * s, (0.02 + ((i * 17) % 30) / 300) * s, 0.016 * s, 0.011 * s, i, 0, TAU); ctx.fill(); } },
    });
    ctx.restore();
    sparkle(ctx, 0.4 * s, -0.36 * s, 0.045 * s);
  },

  // Pocky-style chocolate-coated biscuit sticks
  swPocky(ctx, s, o = {}) {
    const coat = o.col || '#5a2c14', stick = '#efd9a6';
    ctx.save(); ctx.translate(0, 0.46 * s);
    const n = 6;
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.rotate(-0.4 + (i * 0.8) / (n - 1));
      const L = 0.9 * s, w = 0.056 * s;
      fillRR(ctx, -w / 2, -L, w, L, w * 0.5, stick, darken(stick, 0.5), s * 0.012);
      fillRR(ctx, -w * 0.85, -L, w * 1.7, L * 0.64, w * 0.85, linGrad(ctx, -w, 0, w, 0, [[0, lighten(coat, 0.3)], [0.5, coat], [1, darken(coat, 0.3)]]), darken(coat, 0.62), s * 0.014);
      if (o.sprinkle) { ctx.fillStyle = o.sprinkle; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(((k % 2) - 0.5) * w, -L + (k + 0.6) * L * 0.08, w * 0.14, 0, TAU); ctx.fill(); } }
      ctx.restore();
    }
    ctx.restore();
    if (o.fruit) fruit(ctx, o.fruit, 0.32 * s, 0.32 * s, 0.36 * s);
    if (o.nuts) { hazelnut(ctx, 0.34 * s, 0.34 * s, 0.05 * s, 0.4); }
  },

  // Choco-Pie-style: whole pie + cut pie with marshmallow
  swChocoPie(ctx, s, o = {}) {
    const coat = o.col || '#4a2410', sponge = '#c68a4a', mallow = '#fffaf0';
    const px = -0.02 * s, py = -0.16 * s, r = 0.3 * s;
    ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fillStyle = radGrad(ctx, px, py, 0, r, [[0, lighten(coat, 0.32)], [0.6, coat], [1, darken(coat, 0.35)]], px - r * 0.3, py - r * 0.35); ctx.fill();
    ctx.strokeStyle = darken(coat, 0.6); lw(ctx, s, 0.03); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, r * 0.8, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.14)'; lw(ctx, s, 0.014); ctx.stroke();
    shine(ctx, px - r * 0.4, py - r * 0.45, r * 0.3, r * 0.12, -0.7, 0.55);
    ctx.save(); ctx.translate(0.04 * s, 0.28 * s); ctx.rotate(0.05);
    slice(ctx, -0.38 * s, -0.13 * s, 0.76 * s, 0.26 * s, 0.11 * s, [[coat, 0.15], [sponge, 0.22], [mallow, 0.26], [sponge, 0.22], [coat, 0.15]]);
    ctx.restore();
  },

  // Hello-Panda-style: panda face and panda-embossed biscuits
  swHelloPanda(ctx, s, o = {}) {
    const bis = (x, y, r, cut) => {
      ball(ctx, x, y, r, '#e7b45f', { shine: false });
      ctx.fillStyle = 'rgba(120,70,20,.5)';
      for (const dx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + dx * r * 0.5, y - r * 0.5, r * 0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + dx * r * 0.3, y - r * 0.05, r * 0.16, r * 0.22, dx * 0.5, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.arc(x, y + r * 0.2, r * 0.09, 0, TAU); ctx.fill();
      if (cut) { ctx.save(); ctx.beginPath(); ctx.arc(x + r * 0.85, y + r * 0.7, r * 0.55, 0, TAU); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.arc(x + r * 0.62, y + r * 0.55, r * 0.5, 0, Math.PI, true); ctx.fillStyle = '#5a2c14'; ctx.fill(); }
    };
    bis(0.26 * s, 0.2 * s, 0.17 * s); bis(-0.04 * s, 0.36 * s, 0.13 * s);
    const px = -0.12 * s, py = -0.12 * s, r = 0.27 * s;
    for (const dx of [-1, 1]) circle(ctx, px + dx * r * 0.78, py - r * 0.78, r * 0.34, '#1a1a1a', '#000', s * 0.01);
    ball(ctx, px, py, r, '#ffffff', { line: '#2a2a2a', shine: false });
    for (const dx of [-1, 1]) {
      ctx.save(); ctx.translate(px + dx * r * 0.4, py - r * 0.05); ctx.rotate(dx * 0.55); ellipse(ctx, 0, 0, r * 0.2, r * 0.3, '#1a1a1a'); ctx.restore();
      circle(ctx, px + dx * r * 0.4, py - r * 0.08, r * 0.075, '#fff'); circle(ctx, px + dx * r * 0.4 + dx * r * 0.01, py - r * 0.06, r * 0.04, '#000');
      circle(ctx, px + dx * r * 0.62, py + r * 0.32, r * 0.11, 'rgba(255,120,140,.5)');
    }
    ellipse(ctx, px, py + r * 0.2, r * 0.13, r * 0.09, '#1a1a1a');
    ctx.strokeStyle = '#1a1a1a'; lw(ctx, s, 0.016); ctx.beginPath(); ctx.arc(px - r * 0.09, py + r * 0.3, r * 0.09, 0.1, Math.PI * 0.9); ctx.arc(px + r * 0.09, py + r * 0.3, r * 0.09, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
    shine(ctx, px - r * 0.45, py - r * 0.6, r * 0.2, r * 0.09, -0.7, 0.7);
  },

  // Tim-Tam-style chocolate biscuit + cross-section
  swTimTam(ctx, s, o = {}) {
    const coat = o.col || '#5a2c14';
    ctx.save(); ctx.translate(-0.02 * s, -0.16 * s); ctx.rotate(-0.2);
    slab(ctx, -0.34 * s, -0.11 * s, 0.68 * s, 0.22 * s, 0.05 * s, coat, { lw: s * 0.025 });
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; lw(ctx, s, 0.012);
    for (let k = 0; k < 4; k++) { ctx.beginPath(); for (let i = 0; i <= 10; i++) { const x = (-0.3 + i * 0.06) * s, y = (-0.07 + k * 0.045 + Math.sin(i * 1.3) * 0.008) * s; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    shine(ctx, -0.2 * s, -0.09 * s, 0.09 * s, 0.012 * s, 0, 0.35);
    ctx.restore();
    ctx.save(); ctx.translate(0.05 * s, 0.24 * s); ctx.rotate(0.06);
    slice(ctx, -0.34 * s, -0.16 * s, 0.68 * s, 0.32 * s, 0.05 * s, [[coat, 0.13], ['#7d4c28', 0.22], ['#f2ddc0', 0.2], ['#7d4c28', 0.22], [coat, 0.13]]);
    ctx.restore();
    sparkle(ctx, 0.4 * s, -0.34 * s, 0.045 * s);
  },

  // ------------------------------------------------------------------ biscuits & cookies
  // Oreo-style: whole embossed cookie + one twisted open
  swOreo(ctx, s, o = {}) {
    const c = o.col || '#2b1a12', cream = o.col2 || '#fff8ec';
    const ox = -0.2 * s, oy = 0.0, r2 = 0.25 * s;
    ctx.beginPath(); ctx.arc(ox, oy, r2, 0, TAU); ctx.fillStyle = darken(c, 0.05); ctx.fill(); ctx.strokeStyle = '#0d0705'; lw(ctx, s, 0.024); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(ox, oy, r2 * 0.84, 0, TAU); ctx.fillStyle = radGrad(ctx, ox, oy, 0, r2 * 0.84, [[0, '#ffffff'], [1, cream]], ox - r2 * 0.2, oy - r2 * 0.25); ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(175,150,115,.75)'; lw(ctx, s, 0.011);
    for (let i = -4; i <= 4; i++) { const y = oy + i * r2 * 0.19; ctx.beginPath(); ctx.moveTo(ox - r2, y); ctx.quadraticCurveTo(ox, y + r2 * 0.12, ox + r2, y); ctx.stroke(); }
    ctx.restore();
    cookieFace(ctx, 0.14 * s, 0.12 * s, 0.3 * s, c, 'oreo', 0.18);
    ctx.fillStyle = 'rgba(30,18,12,.9)'; for (const [x, y, r] of [[-0.42, 0.34, 0.02], [-0.3, 0.42, 0.014], [0.44, -0.16, 0.018], [0.38, -0.26, 0.012]]) { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#b8d0e8'; lw(ctx, s, 0.01);
    for (const [x, y, r] of [[0.32, -0.34, 0.035], [-0.04, -0.34, 0.025], [0.42, -0.06, 0.02], [-0.42, -0.28, 0.02]]) { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, TAU); ctx.fill(); ctx.stroke(); }
  },

  // Lotus-Biscoff-style caramelised biscuits
  swBiscoff(ctx, s, o = {}) {
    const c = o.col || '#c47a2c';
    const bis = (x, y, w, h, rot) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      fillRR(ctx, -w / 2, -h / 2, w, h, h * 0.16, linGrad(ctx, 0, -h / 2, 0, h / 2, [[0, lighten(c, 0.3)], [0.5, c], [1, darken(c, 0.3)]]), darken(c, 0.6), s * 0.026);
      fillRR(ctx, -w / 2 + h * 0.09, -h / 2 + h * 0.09, w - h * 0.18, h - h * 0.18, h * 0.1, null, 'rgba(90,45,10,.5)', s * 0.012);
      ctx.fillStyle = 'rgba(90,45,10,.45)';
      for (let i = 0; i < 11; i++) { const px = -w * 0.4 + i * w * 0.08; ctx.beginPath(); ctx.arc(px, -h * 0.34, h * 0.024, 0, TAU); ctx.arc(px, h * 0.34, h * 0.024, 0, TAU); ctx.fill(); }
      txt(ctx, 'Lotus', 0, h * 0.02, h * 0.34, 'pacifico', 'rgba(90,45,10,.6)');
      ctx.restore();
    };
    if (o.cinnamon) { ctx.save(); ctx.translate(0.3 * s, 0.3 * s); ctx.rotate(-0.6); slab(ctx, -0.16 * s, -0.025 * s, 0.32 * s, 0.05 * s, 0.025 * s, '#8a4a22', { lw: s * 0.012 }); ctx.restore(); }
    bis(-0.05 * s, -0.17 * s, 0.56 * s, 0.28 * s, -0.16);
    bis(0.05 * s, 0.15 * s, 0.56 * s, 0.28 * s, 0.1);
    ctx.fillStyle = darken(c, 0.15); for (const [x, y, r] of [[-0.4, 0.3, 0.018], [-0.32, 0.38, 0.012], [0.42, -0.1, 0.015]]) { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, TAU); ctx.fill(); }
  },

  // generic sandwich cookie: embossed top view + 3/4-view stack (biscuit / cream / biscuit)
  swSandwichCookie(ctx, s, o = {}) {
    const bis = o.col || '#2b1a12', cream = o.col2 || '#fff8ec', kind = o.emboss || 'flower';
    cookieFace(ctx, -0.14 * s, -0.14 * s, 0.27 * s, bis, kind, 0.25);
    const cx = 0.1 * s, base = 0.3 * s, rx = 0.32 * s, ry = 0.1 * s, edge = darken(bis, 0.6);
    puck(ctx, cx, base, rx, ry, 0.06 * s, darken(bis, 0.1), darken(bis, 0.22), edge, s * 0.02);
    puck(ctx, cx, base - 0.055 * s, rx * 0.95, ry * 0.95, 0.06 * s, lighten(cream, 0.2), cream, darken(cream, 0.4), s * 0.014);
    puck(ctx, cx, base - 0.115 * s, rx, ry, 0.06 * s, bis, darken(bis, 0.16), edge, s * 0.02);
    ctx.save(); ctx.translate(cx, base - 0.115 * s); ctx.scale(1, ry / rx); cookieFace(ctx, 0, 0, rx * 0.98, bis, kind, 0.25); ctx.restore();
    if (o.peanuts) { peanut(ctx, 0.38 * s, -0.2 * s, 0.07 * s, 0.4); peanut(ctx, -0.36 * s, 0.34 * s, 0.06 * s, -0.5); }
    if (o.beans) { for (const [x, y, r] of [[0.4, -0.22, 0.5], [0.3, -0.34, -0.3]]) { ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r); ellipse(ctx, 0, 0, 0.06 * s, 0.043 * s, '#5a2f14', '#2a1206', s * 0.012); ctx.strokeStyle = '#2a1206'; lw(ctx, s, 0.01); ctx.beginPath(); ctx.moveTo(-0.05 * s, 0); ctx.quadraticCurveTo(0, -0.02 * s, 0.05 * s, 0); ctx.stroke(); ctx.restore(); } }
  },

  // rectangular biscuit + cross-section (Bourbon-style)
  swBiscuitRect(ctx, s, o = {}) {
    const c = o.col || '#3a2418', cream = o.col2 || '#c9a27a';
    ctx.save(); ctx.translate(-0.02 * s, -0.16 * s); ctx.rotate(-0.2);
    slab(ctx, -0.34 * s, -0.12 * s, 0.68 * s, 0.24 * s, 0.04 * s, c, { lw: s * 0.025 });
    fillRR(ctx, -0.3 * s, -0.085 * s, 0.6 * s, 0.17 * s, 0.025 * s, null, 'rgba(255,255,255,.18)', s * 0.012);
    ctx.fillStyle = 'rgba(255,255,255,.16)'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((-0.24 + i * 0.06) * s, -0.01 * s, 0.009 * s, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.translate(0.05 * s, 0.24 * s); ctx.rotate(0.06);
    slice(ctx, -0.34 * s, -0.16 * s, 0.68 * s, 0.32 * s, 0.05 * s, [[c, 0.28], [cream, 0.3], [c, 0.28]]);
    ctx.restore();
    if (o.beans) { for (const [x, y, r] of [[0.4, -0.3, 0.5], [-0.38, 0.4, -0.3], [0.32, 0.46, 0.9]]) { ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r); ellipse(ctx, 0, 0, 0.06 * s, 0.043 * s, '#5a2f14', '#2a1206', s * 0.012); ctx.strokeStyle = '#2a1206'; lw(ctx, s, 0.01); ctx.beginPath(); ctx.moveTo(-0.05 * s, 0); ctx.quadraticCurveTo(0, -0.02 * s, 0.05 * s, 0); ctx.stroke(); ctx.restore(); } }
  },

  // Ritz-style scalloped cracker (optionally as a cheese sandwich)
  swRitz(ctx, s, o = {}) {
    const cr = (x, y, r, rot) => {
      scallopPath(ctx, x, y, r, 12, 0.055, rot);
      ctx.fillStyle = radGrad(ctx, x, y, 0, r, [[0, '#ffd27a'], [0.65, '#eba93c'], [1, '#b8741c']], x - r * 0.25, y - r * 0.3); ctx.fill();
      ctx.strokeStyle = '#7a4a10'; lw(ctx, s, 0.024); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, TAU); ctx.strokeStyle = 'rgba(160,90,20,.4)'; lw(ctx, s, 0.012); ctx.stroke();
      ctx.fillStyle = '#8a5514';
      for (let i = 0; i < 10; i++) { const a = rot + (i * TAU) / 10; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.055, r * 0.04, a, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.arc(x, y, r * 0.06, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(x + Math.cos(i * 2.4 + 1) * r * 0.7, y + Math.sin(i * 2.4 + 1) * r * 0.7, r * 0.03, 0, TAU); ctx.fill(); }
    };
    cr(-0.15 * s, -0.16 * s, 0.27 * s, 0.2); cr(0.17 * s, -0.06 * s, 0.25 * s, 0.6);
    if (o.cheese) {
      ctx.save(); ctx.translate(0.0, 0.3 * s); ctx.rotate(-0.04);
      slice(ctx, -0.34 * s, -0.11 * s, 0.68 * s, 0.22 * s, 0.05 * s, [['#eba93c', 0.3], ['#ff9a1a', 0.4], ['#eba93c', 0.3]]);
      ctx.restore();
    } else cr(-0.04 * s, 0.28 * s, 0.22 * s, 0.9);
  },

  // Koala's-March-style cookies with koala faces
  swKoala(ctx, s, o = {}) {
    const c = o.col || '#e6ae5a';
    const cookie = (x, y, w, rot, face) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      fillRR(ctx, -w / 2, -w / 2, w, w, w * 0.28, radGrad(ctx, 0, 0, 0, w * 0.7, [[0, lighten(c, 0.3)], [0.7, c], [1, darken(c, 0.25)]], -w * 0.2, -w * 0.25), darken(c, 0.6), s * 0.024);
      if (face) {
        for (const dx of [-1, 1]) { circle(ctx, dx * w * 0.27, -w * 0.22, w * 0.15, '#8f8a86', '#4a4643', s * 0.01); circle(ctx, dx * w * 0.27, -w * 0.22, w * 0.085, '#f0b0b8'); }
        ellipse(ctx, 0, 0.02 * w, w * 0.3, w * 0.27, '#a29d99', '#4a4643', s * 0.012);
        ellipse(ctx, 0, w * 0.06, w * 0.085, w * 0.12, '#1a1a1a'); circle(ctx, -w * 0.13, -w * 0.05, w * 0.03, '#1a1a1a'); circle(ctx, w * 0.13, -w * 0.05, w * 0.03, '#1a1a1a');
        shine(ctx, -w * 0.03, w * 0.02, w * 0.025, w * 0.04, 0.3, 0.6);
      }
      ctx.restore();
    };
    cookie(-0.2 * s, -0.12 * s, 0.4 * s, -0.15, true);
    cookie(0.2 * s, -0.06 * s, 0.36 * s, 0.2, true);
    ctx.save(); ctx.translate(0.0, 0.3 * s); ctx.rotate(-0.04);
    slice(ctx, -0.3 * s, -0.11 * s, 0.6 * s, 0.22 * s, 0.07 * s, [[c, 0.3], ['#4a2410', 0.4], [c, 0.3]]);
    ctx.restore();
    sparkle(ctx, 0.4 * s, 0.26 * s, 0.04 * s);
  },

  // Danisa-style butter cookie assortment
  swDanisa(ctx, s, o = {}) {
    const c = '#e9b866', d = '#8a5a1c';
    const body = (x, y, r) => radGrad(ctx, x, y, 0, r, [[0, lighten(c, 0.3)], [0.7, c], [1, darken(c, 0.2)]], x - r * 0.3, y - r * 0.3);
    // sugared ring
    let x = -0.2 * s, y = -0.18 * s, r = 0.2 * s;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.arc(x, y, r * 0.36, 0, TAU, true); ctx.fillStyle = body(x, y, r); ctx.fill('evenodd'); ctx.strokeStyle = d; lw(ctx, s, 0.022); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.36, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 22; i++) { const a = i * 0.9, rr = r * (0.55 + ((i * 37) % 40) / 100); ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, r * 0.04, 0, TAU); ctx.fill(); }
    // flower cookie with jam
    x = 0.2 * s; y = -0.14 * s; r = 0.22 * s;
    scallopPath(ctx, x, y, r, 8, 0.13, 0.2); ctx.fillStyle = body(x, y, r); ctx.fill(); ctx.strokeStyle = d; lw(ctx, s, 0.022); ctx.stroke();
    circle(ctx, x, y, r * 0.3, '#e0202f', '#8a1018', s * 0.012); shine(ctx, x - r * 0.1, y - r * 0.1, r * 0.08, r * 0.04, -0.6, 0.7);
    // swirl rosette
    x = -0.16 * s; y = 0.22 * s; r = 0.19 * s;
    scallopPath(ctx, x, y, r, 10, 0.1, 0); ctx.fillStyle = body(x, y, r); ctx.fill(); ctx.strokeStyle = d; lw(ctx, s, 0.022); ctx.stroke();
    ctx.strokeStyle = darken(c, 0.35); lw(ctx, s, 0.016); ctx.beginPath(); for (let i = 0; i <= 50; i++) { const a = i * 0.32, rr = (i / 50) * r * 0.78; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    // square shortbread with holes
    x = 0.2 * s; y = 0.22 * s; r = 0.2 * s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.15); fillRR(ctx, -r, -r * 0.8, r * 2, r * 1.6, r * 0.2, body(0, 0, r), d, s * 0.022);
    ctx.fillStyle = darken(c, 0.45); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc((-0.5 + i * 0.5) * r, (-0.28 + j * 0.56) * r, r * 0.06, 0, TAU); ctx.fill(); }
    ctx.restore();
  },

  // Glico-Collon-style cream-filled wafer rolls
  swCollon(ctx, s, o = {}) {
    const wafer = '#dfae5a';
    const roll = (x, y, rot, len, r, cr) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      slab(ctx, -len / 2, -r, len, 2 * r, r * 0.9, wafer, { lw: s * 0.022 });
      withClip(ctx, -len / 2, -r, len, 2 * r, r * 0.9, () => { ctx.strokeStyle = 'rgba(120,70,10,.42)'; lw(ctx, s, 0.012); for (let i = -6; i < 16; i++) { ctx.beginPath(); ctx.moveTo(-len / 2 + i * r * 0.62, -r); ctx.lineTo(-len / 2 + i * r * 0.62 + r * 1.3, r); ctx.stroke(); } });
      ellipse(ctx, len / 2, 0, r * 0.42, r, cr, darken(wafer, 0.45), s * 0.02);
      ctx.strokeStyle = wafer; lw(ctx, s, 0.014); ctx.beginPath(); ctx.ellipse(len / 2, 0, r * 0.3, r * 0.72, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(len / 2, 0, r * 0.15, r * 0.4, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    };
    roll(-0.08 * s, -0.22 * s, -0.2, 0.72 * s, 0.078 * s, o.col || '#fff2d6');
    roll(-0.04 * s, 0.0, -0.1, 0.72 * s, 0.078 * s, o.col2 || '#8a4a2a');
    roll(-0.06 * s, 0.22 * s, -0.02, 0.72 * s, 0.078 * s, o.col3 || '#ff9ab8');
    sparkle(ctx, 0.4 * s, -0.36 * s, 0.045 * s);
  },

  // Yan-Yan-style biscuit sticks + dip tub
  swYanYan(ctx, s, o = {}) {
    const stick = '#e9c47a', tub = o.col || '#e4002b', dip = o.col2 || '#5a2c14';
    ctx.save(); ctx.translate(0, 0.12 * s);
    const n = 6;
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.rotate(-0.46 + (i * 0.92) / (n - 1));
      fillRR(ctx, -0.03 * s, -0.62 * s, 0.06 * s, 0.66 * s, 0.02 * s, linGrad(ctx, -0.03 * s, 0, 0.03 * s, 0, [[0, lighten(stick, 0.3)], [1, darken(stick, 0.2)]]), '#8a5a1c', s * 0.012);
      ctx.fillStyle = 'rgba(140,90,30,.45)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(0, -0.5 * s + k * 0.09 * s, 0.008 * s, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(-0.27 * s, 0.02 * s); ctx.lineTo(-0.2 * s, 0.32 * s); ctx.lineTo(0.2 * s, 0.32 * s); ctx.lineTo(0.27 * s, 0.02 * s); ctx.closePath();
    ctx.fillStyle = linGrad(ctx, -0.27 * s, 0, 0.27 * s, 0, [[0, lighten(tub, 0.2)], [0.5, tub], [1, darken(tub, 0.28)]]); ctx.fill(); ctx.strokeStyle = darken(tub, 0.6); lw(ctx, s, 0.026); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-0.235 * s, 0.14 * s, 0.47 * s, 0.05 * s);
    ellipse(ctx, 0, 0.02 * s, 0.27 * s, 0.07 * s, dip, darken(dip, 0.5), s * 0.02);
    ellipse(ctx, 0, 0.0, 0.16 * s, 0.035 * s, lighten(dip, 0.2), null); shine(ctx, -0.1 * s, -0.004 * s, 0.05 * s, 0.012 * s, 0, 0.5);
    ctx.restore();
  },

  // Pretz-style thin baked sticks (fan + a few loose ones), optionally with a shrimp and chilli for tom yum
  swPretz(ctx, s, o = {}) {
    const stick = o.stick || '#d9a24a';
    const one = (a, ox, oy, L, i) => {
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(a);
      const w = 0.04 * s, c = i % 2 ? darken(stick, 0.07) : stick;
      fillRR(ctx, -w / 2, -L, w, L, w * 0.5, linGrad(ctx, -w / 2, 0, w / 2, 0, [[0, lighten(c, 0.3)], [0.5, c], [1, darken(c, 0.32)]]), darken(c, 0.55), s * 0.01);
      if (o.season) { ctx.fillStyle = o.season; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(((k % 2) - 0.5) * w * 0.5, -L + (k + 0.7) * L * 0.1, w * 0.13, 0, TAU); ctx.fill(); } }
      ctx.restore();
    };
    for (let i = 0; i < 7; i++) one(-0.52 + i * 0.173, 0, 0.36 * s, (0.8 + (i % 2) * 0.05) * s, i);
    one(1.38, -0.3 * s, 0.4 * s, 0.56 * s, 1); one(1.62, -0.28 * s, 0.46 * s, 0.52 * s, 0);
    if (o.shrimp) {
      shrimpIcon(ctx, 0.27 * s, 0.24 * s, 0.4 * s, -0.15);
      ctx.save(); ctx.translate(-0.3 * s, 0.22 * s); ctx.rotate(-0.7);
      ctx.beginPath(); ctx.moveTo(-0.16 * s, 0); ctx.quadraticCurveTo(0, -0.06 * s, 0.16 * s, 0.03 * s); ctx.quadraticCurveTo(0, 0.05 * s, -0.16 * s, 0); ctx.fillStyle = '#e8261c'; ctx.fill(); ctx.strokeStyle = '#701008'; lw(ctx, s, 0.012); ctx.stroke();
      leaf(ctx, 0.16 * s, 0.03 * s, 0.06 * s, 0.025 * s, 0.2, '#2e9b3e'); ctx.restore();
    }
  },

  // Toppo-style hollow biscuit sticks filled with chocolate
  swToppo(ctx, s, o = {}) {
    const bis = o.stick || '#b56d30', choc = '#3a1c0a';
    ctx.save(); ctx.translate(0, 0.44 * s);
    const n = 6;
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.rotate(-0.5 + (i * 1.0) / (n - 1));
      const w = 0.075 * s, L = 0.86 * s;
      fillRR(ctx, -w / 2, -L, w, L, w * 0.3, linGrad(ctx, -w / 2, 0, w / 2, 0, [[0, lighten(bis, 0.28)], [0.5, bis], [1, darken(bis, 0.3)]]), darken(bis, 0.6), s * 0.014);
      ellipse(ctx, 0, -L, w * 0.5, w * 0.3, choc, darken(bis, 0.6), s * 0.012); ellipse(ctx, -w * 0.08, -L - w * 0.03, w * 0.2, w * 0.08, lighten(choc, 0.3), null);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-w * 0.32, -L * 0.9, w * 0.14, L * 0.7);
      ctx.restore();
    }
    ctx.restore();
    for (const [x, y, r] of [[-0.34, 0.36, 0.035], [0.36, 0.4, 0.03], [0.3, 0.3, 0.02]]) ball(ctx, x * s, y * s, r * s, choc, { line: '#1a0a02' });
  },
};

// every hero also understands heroOpts { k: scale, dx, dy } (fractions of the hero size) so it can be fitted to narrow packs
export const illus = Object.fromEntries(Object.entries(raw).map(([name, fn]) => [name, (ctx, s, o = {}) => {
  if (!o.k && !o.dx && !o.dy) return fn(ctx, s, o);
  ctx.save(); ctx.translate((o.dx || 0) * s, (o.dy || 0) * s); if (o.k) ctx.scale(o.k, o.k); fn(ctx, s, o); ctx.restore();
}]));

// ====================================================================================================
// brand wordmarks (stylised; Thai transliterations follow the 7-Eleven Thailand product listings)
// ====================================================================================================
export const brands = {
  hallsTh:   { text: 'HALLS', th: 'ฮอลล์', style: 'block', bg: '#ffd400', fg: '#c8102e', font: 'archivo', ring: '#c8102e' },
  hichewTh:  { text: 'Hi-Chew', th: 'ไฮ-ชิว', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#e6007e' },
  ferreroTh: { text: 'Ferrero Rocher', th: 'เฟอเรโร รอชเชอร์', style: 'plain', fg: '#f2c14e', font: 'chonburi', stroke: '#3a1a08' },
  chupa:     { text: 'Chupa Chups', th: 'จูปา จุ๊ปส์', style: 'pill', bg: '#ffd400', fg: '#e4002b', font: 'lilita', ring: '#e4002b' },
  tictac:    { text: 'Tic Tac', th: 'ทิคแทค', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#e4002b' },
  haribo:    { text: 'HARIBO', th: 'ฮาริโบ้', style: 'plain', fg: '#e4002b', font: 'lilita', stroke: '#ffffff' },
  yupi:      { text: 'Yupi', th: 'ยูปี้', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#6a1b9a' },
  sarach:    { text: 'SARACH', th: 'สารัช', style: 'stamp', bg: '#fff1c9', fg: '#a33b0a', font: 'chonburi', ring: '#a33b0a' },
  lookchoob: { text: 'Look Choob', th: 'ลูกชุบ', style: 'ribbon', bg: '#e8438a', fg: '#ffffff', font: 'pattaya', ring: '#ffffff' },
  toblerone: { text: 'TOBLERONE', th: 'ทอปเบอโรน', style: 'plain', fg: '#c8102e', font: 'chonburi', stroke: '#ffffff' },
  lotus:     { text: 'Lotus Biscoff', th: 'โลตัส บิสคอฟ', style: 'script', fg: '#ffffff', font: 'pacifico', stroke: '#7a0a12' },
  creamo:    { text: 'Cream-O', th: 'ครีมโอ', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#1d3f9a' },
  ritz:      { text: 'RITZ', th: 'ริทซ์', style: 'ribbon', bg: '#1f4fb5', fg: '#ffffff', font: 'archivo', ring: '#ffffff' },
  julies:    { text: "Julie's", th: 'จูลี่ส์', style: 'script', fg: '#ffffff', font: 'pacifico', stroke: '#8f1010' },
  danisa:    { text: 'Danisa', th: 'เดนิสา', style: 'script', fg: '#ffffff', font: 'pacifico', stroke: '#0d2f6b' },
  collon:    { text: 'COLLON', th: 'โคลลอน', style: 'pill', bg: '#ffffff', fg: '#e60012', font: 'lilita', ring: '#e60012' },
  yanyan:    { text: 'YAN YAN', th: 'ยันยัน', style: 'plain', fg: '#e4002b', font: 'lilita', stroke: '#ffffff' },
  bourbon:   { text: 'BOURBON', th: 'เบอร์บอน', style: 'block', bg: '#3a0d0d', fg: '#ffd9a0', font: 'archivo', ring: '#ffd9a0' },
  pretz:     { text: 'PRETZ', th: 'เพรทซ์', style: 'plain', fg: '#ffffff', font: 'lilita', stroke: '#c8102e' },
  toppo:     { text: 'TOPPO', th: 'ท็อปโป', style: 'block', bg: '#3a1a0a', fg: '#ffe7a8', font: 'anton', ring: '#ffe7a8' },
  koala:     { text: "Koala's March", th: 'โคอะลามาร์ช', style: 'pill', bg: '#ffffff', fg: '#e4002b', font: 'lilita', ring: '#e4002b' },
};

// a few ingredient words the shared list does not have yet
export const ingredients = {
  xylitol: { en: 'Xylitol', th: 'ไซลิทอล' },
  sorbitol: { en: 'Sorbitol', th: 'ซอร์บิทอล' },
  gumbase: { en: 'Gum base', th: 'กัมเบส' },
  cocoabutter: { en: 'Cocoa butter', th: 'เนยโกโก้' },
  hazelnut: { en: 'Hazelnut', th: 'เฮเซลนัท' },
  caramelc: { en: 'Caramel', th: 'คาราเมล' },
  nata: { en: 'Nata de coco', th: 'วุ้นมะพร้าว' },
  lecithin: { en: 'Soy lecithin', th: 'เลซิทินจากถั่วเหลือง' },
  glaze: { en: 'Glazing agent', th: 'สารเคลือบเงา' },
  mungbean: { en: 'Mung bean', th: 'ถั่วเขียว' },
  agar: { en: 'Agar', th: 'วุ้น' },
  cinnamon: { en: 'Cinnamon', th: 'อบเชย' },
  peanutbutter: { en: 'Peanut butter', th: 'เนยถั่ว' },
  marshmallow: { en: 'Marshmallow', th: 'มาร์ชแมลโลว์' },
  crispyrice: { en: 'Crisped rice', th: 'ข้าวพอง' },
  nougat: { en: 'Nougat', th: 'นูกัต' },
};

// ====================================================================================================
// products
// ====================================================================================================
const P = (o) => o;
export default [
  // ---------------------------------------------------------------------------------------- CANDY & GUM
  P({ id: 'mentos-mint', cat: 'candy', brand: 'mentos', name: T('Mint', 'รสมินต์'), sub: T('Chewy dragées', 'ลูกอมเคี้ยวหนึบ'), price: 12, size: g(37), g: 'stick', style: 'box',
    pal: ['#19a74a', '#0c6a2c', '#ffffff', '#e60012'], bg: 'rays', hero: 'swMentos', heroOpts: { col: '#19a74a', col2: '#ffffff', stripe: '#e60012', leaf: true, rot: -0.85, k: 1.2 },
    ing: ['sugar', 'starchsyrup', 'palm', 'starch', 'flavour', 'glaze'], nut: [145, 28, 1.5, 15], impulse: true, pop: 3, promo: T('2 for ฿20', '2 ม้วน 20 บาท'),
    desc: T('Chewy mint dragées in the familiar paper roll, a classic grab at the till.', 'ลูกอมเคี้ยวหนึบรสมินต์ในม้วนกระดาษแสนคุ้นตา หยิบติดมือได้ง่ายตรงเคาน์เตอร์') }),
  P({ id: 'mentos-fruit', cat: 'candy', brand: 'mentos', name: T('Mixed Fruit', 'รสผลไม้รวม'), sub: T('Chewy dragées', 'ลูกอมเคี้ยวหนึบ'), price: 12, size: g(37), g: 'stick', style: 'box',
    pal: ['#1a6fd6', '#0b3f8a', '#ffd400', '#e8262f'], bg: 'dots', hero: 'swMentos', heroOpts: { col: '#e8262f', col2: '#ffffff', stripe: '#1a6fd6', back: ['orange', 'strawberry', 'lemon'], rot: -0.85, k: 1.1 },
    ing: ['sugar', 'starchsyrup', 'palm', 'starch', 'citric', 'flavour', 'colour', 'glaze'], nut: [145, 28, 1.5, 15], impulse: true,
    desc: T('Orange, strawberry and lemon flavours in one chewy roll.', 'ลูกอมเคี้ยวหนึบรวมรสส้ม สตรอว์เบอร์รี่ และเลมอนในม้วนเดียว') }),
  P({ id: 'halls-honeylemon', cat: 'candy', brand: 'hallsTh', name: T('Honey Lemon', 'น้ำผึ้งผสมกลิ่นเลมอน'), sub: T('Candy stick', 'ลูกอมแบบแท่ง'), price: 12, size: g(27.9), g: 'stick', style: 'box',
    pal: ['#f2b705', '#c98700', '#c8102e', '#ffffff'], bg: 'rays', hero: 'swHalls', heroOpts: { col: '#f0a21a', col2: '#ffd21f', extra: 'lemon', emblem: 'hex', tall: true, k: 1.3 },
    ing: ['sugar', 'starchsyrup', 'honey', 'lemon', 'citric', 'flavour', 'colour'], nut: [105, 24, 0, 5], impulse: true, pop: 2,
    desc: T('Amber honey-lemon lozenges in a handy stick, a familiar comfort for scratchy throats.', 'ลูกอมรสน้ำผึ้งเลมอนสีอำพันในแท่งพกง่าย ตัวช่วยคู่ใจเวลาระคายคอ') }),
  P({ id: 'halls-menthol', cat: 'candy', brand: 'hallsTh', name: T('Menthol-Lyptus', 'เมนโทลิปตัส'), sub: T('Candy stick', 'ลูกอมแบบแท่ง'), price: 12, size: g(27.9), g: 'stick', style: 'box',
    pal: ['#1aa860', '#0a6a3a', '#ffffff', '#7fd8a8'], bg: 'rays', hero: 'swHalls', heroOpts: { col: '#7fd8a8', col2: '#ffffff', extra: 'mint', emblem: 'leaf', band: '#1aa860', tall: true, k: 1.3 },
    ing: ['sugar', 'starchsyrup', 'menthol', 'eucalyptus', 'flavour', 'colour'], nut: [105, 24, 0, 5], impulse: true,
    desc: T('Cooling menthol and eucalyptus lozenges in a stick pack.', 'ลูกอมเมนทอลผสมยูคาลิปตัส เย็นสดชื่น ในแท่งพกพาสะดวก') }),
  P({ id: 'hichew-strawberry', cat: 'candy', brand: 'hichewTh', name: T('Strawberry', 'รสสตรอว์เบอร์รี่'), sub: T('Chewy fruit candy', 'ลูกอมเคี้ยวหนึบ'), price: 29, size: g(57), g: 'stick', style: 'box', origin: 'jp',
    pal: ['#f0407d', '#b8194f', '#fff3a8', '#ffffff'], bg: 'dots', hero: 'swHiChew', heroOpts: { col: '#f0407d', col2: '#ff7aa8', fruit: 'strawberry', tall: true, k: 1.3 },
    ing: ['sugar', 'starchsyrup', 'palm', 'gelatin', 'citric', 'flavour', 'colour'], allergens: [], nut: [250, 32, 4.5, 25], impulse: true, pop: 2,
    desc: T('Soft, chewy strawberry candies from Japan, twisted in sweet paper.', 'ลูกอมเคี้ยวหนึบรสสตรอว์เบอร์รี่จากญี่ปุ่น ห่อกระดาษบิดเกลียวน่ารัก') }),
  P({ id: 'hichew-mango', cat: 'candy', brand: 'hichewTh', name: T('Mango', 'รสมะม่วง'), sub: T('Chewy fruit candy', 'ลูกอมเคี้ยวหนึบ'), price: 29, size: g(57), g: 'stick', style: 'box', origin: 'jp', isNew: true,
    pal: ['#ffb400', '#e07a00', '#ffffff', '#fff0b0'], bg: 'dots', hero: 'swHiChew', heroOpts: { col: '#ffb400', col2: '#ffd45a', fruit: 'mango', tall: true, k: 1.3 },
    ing: ['sugar', 'starchsyrup', 'palm', 'gelatin', 'mango', 'citric', 'flavour', 'colour'], nut: [250, 32, 4.5, 25], impulse: true,
    desc: T('Juicy mango chews with a soft, stretchy bite.', 'ลูกอมเคี้ยวหนึบรสมะม่วงหวานฉ่ำ เนื้อนุ่มยืดหยุ่น') }),
  P({ id: 'fishermans-spearmint', cat: 'candy', brand: 'fisherman', name: T('Spearmint', 'รสสเปียร์มินต์'), sub: T('Mint lozenges', 'ลูกอมกลิ่นมินต์'), price: 29, size: g(25), g: 'bag-tiny', style: 'snack', origin: 'uk',
    pal: ['#1f8a4c', '#0e5a30', '#f2e2b0', '#ffffff'], bg: 'plain', hero: 'swFisherman', heroOpts: { col: '#1f8a4c', k: 0.74, dy: 0.03 },
    ing: ['sugar', 'starchsyrup', 'menthol', 'mint', 'colour'], nut: [95, 22, 0, 5], impulse: true,
    desc: T('Strong, cooling lozenges from the English fishing town of Fleetwood, sold in a little paper bag.', 'ลูกอมรสเย็นเข้มข้นจากเมืองประมงเฟลตวูดในอังกฤษ บรรจุในซองกระดาษใบเล็ก') }),
  P({ id: 'xylitol-freshmint', cat: 'candy', brand: 'xylitol', name: T('Fresh Mint Gum', 'หมากฝรั่ง เฟรชมินต์'), price: 39, size: g(29), g: 'jar-s', style: 'jar', origin: 'jp',
    pal: ['#00a651', '#00753a', '#ffffff', '#dff3e8'], bg: 'waves', capColor: '#0f8f4a', body: '#dff3e8', hero: 'swXylitol', heroOpts: { col: '#ffffff', k: 1.2 },
    ing: ['xylitol', 'gumbase', 'sorbitol', 'flavour', 'glaze', 'colour'], nut: [50, 0, 0, 5], impulse: true,
    desc: T('Sugar-free chewing gum sweetened with xylitol, in a bottle small enough for a pocket.', 'หมากฝรั่งปราศจากน้ำตาล ให้ความหวานจากไซลิทอล ในขวดเล็กพกใส่กระเป๋าได้') }),
  P({ id: 'cocon-lychee', cat: 'candy', brand: 'cocon', name: T('Lychee Coconut Jelly', 'เยลลี่ลิ้นจี่วุ้นมะพร้าว'), price: 10, size: g(70), g: 'cup-small', style: 'tub',
    pal: ['#ff5fa2', '#c2185b', '#ffffff', '#ffe4ef'], bg: 'dots', capColor: '#f4f4f4', hero: 'swNata', heroOpts: { col: '#ff7ab0', k: 1.15 },
    ing: ['water', 'sugar', 'nata', 'lychee', 'stab', 'citric', 'flavour', 'colour'], nut: [65, 14, 0, 20],
    desc: T('Wobbly lychee jelly studded with chewy nata de coco cubes, in a peel-off cup.', 'เยลลี่รสลิ้นจี่เนื้อนุ่มหนึบ ใส่วุ้นมะพร้าวชิ้นเล็ก ในถ้วยฝาลอกเปิดง่าย') }),
  P({ id: 'chupa-strawcream', cat: 'candy', brand: 'chupa', name: T('Strawberry Cream', 'สตรอว์เบอร์รี่ครีม'), sub: T('Lollipop', 'อมยิ้ม'), price: 10, size: g(12), g: 'bag-tiny', style: 'snack',
    pal: ['#ff3d6e', '#c2185b', '#ffe14a', '#ffffff'], bg: 'rays', hero: 'swLollipop', heroOpts: { col: '#ff5c8a', col2: '#ffffff', k: 0.76, dy: 0.04 },
    ing: ['sugar', 'starchsyrup', 'milkp', 'citric', 'flavour', 'colour'], allergens: ['milk'], nut: [45, 10.5, 0, 5], impulse: true, pop: 2,
    desc: T('A strawberry-and-cream lollipop in the famous daisy wrapper.', 'อมยิ้มรสสตรอว์เบอร์รี่ครีมในกระดาษห่อรูปดอกเดซี่สุดคลาสสิก') }),
  P({ id: 'tictac-mint', cat: 'candy', brand: 'tictac', name: T('Mint', 'กลิ่นมินต์'), sub: T('Mints', 'ลูกอมเม็ดเล็ก'), price: 15, size: g(14.5), g: 'box-xs', style: 'box', origin: 'it',
    pal: ['#1ea85a', '#0d6b36', '#ffffff', '#1ea85a'], bg: 'rays', hero: 'swTicTac', heroOpts: { col: '#1ea85a', col2: '#ffffff', k: 1.25 },
    ing: ['sugar', 'flavour', 'starch', 'glaze', 'colour'], nut: [55, 14, 0, 0], impulse: true, pop: 2,
    desc: T('Tiny mint pills in a clear flip-top box, about 2 calories each.', 'ลูกอมเม็ดจิ๋วกลิ่นมินต์ในกล่องใสฝาเปิด เม็ดละประมาณ 2 แคลอรี่') }),
  P({ id: 'tictac-orange', cat: 'candy', brand: 'tictac', name: T('Orange', 'กลิ่นส้ม'), sub: T('Mints', 'ลูกอมเม็ดเล็ก'), price: 15, size: g(14.5), g: 'box-xs', style: 'box', origin: 'it',
    pal: ['#ff8a1a', '#c25a00', '#ffffff', '#ff8a1a'], bg: 'rays', hero: 'swTicTac', heroOpts: { col: '#ff8a1a', col2: '#ffb347', k: 1.25 },
    ing: ['sugar', 'flavour', 'starch', 'glaze', 'colour'], nut: [55, 14, 0, 0], impulse: true,
    desc: T('Orange-flavoured mini pills in a flip-top box.', 'ลูกอมเม็ดจิ๋วกลิ่นส้มในกล่องฝาเปิด') }),
  P({ id: 'haribo-goldbears', cat: 'candy', brand: 'haribo', name: T('Goldbears', 'โกลด์แบร์ส'), sub: T('Fruit gummy bears', 'เยลลี่กลิ่นผลไม้รวม'), price: 45, size: g(80), g: 'bag-s', style: 'snack', origin: 'de',
    pal: ['#ffc400', '#f08a00', '#e4002b', '#ffffff'], bg: 'rays', hero: 'swGummyBears', heroOpts: { col: '#e8262f', col2: '#ffb31a', col3: '#3fb84a' },
    ing: ['sugar', 'starchsyrup', 'gelatin', 'citric', 'flavour', 'colour', 'glaze'], nut: [275, 46, 0.1, 40],
    desc: T('The original German gummy bears in five fruity flavours.', 'หมีเยลลี่ต้นตำรับจากเยอรมนี กลิ่นผลไม้ 5 รสชาติ') }),
  P({ id: 'yupi-gummy-cola', cat: 'candy', brand: 'yupi', name: T('Giant Cola', 'ไจแอนท์โคล่า'), sub: T('Cola-bottle gummies', 'กัมมี่รูปขวดโคล่า'), price: 12, size: g(28), g: 'bag-tiny', style: 'snack', origin: 'id',
    pal: ['#d81f26', '#8f1015', '#ffe14a', '#3a1a0a'], bg: 'stripes', hero: 'swColaGummy', heroOpts: { k: 0.8, dy: 0.04 },
    ing: ['sugar', 'starchsyrup', 'gelatin', 'citric', 'flavour', 'caramel', 'glaze'], nut: [90, 14, 0, 20], impulse: true,
    desc: T('Chewy cola-flavoured gummy shaped like a big cola bottle.', 'กัมมี่รสโคล่าเคี้ยวหนึบ รูปขวดโคล่าขนาดใหญ่') }),
  P({ id: 'sarach-tamarind', cat: 'candy', brand: 'sarach', name: T('Spicy Tamarind', 'มะขามคลุกแซ่บ'), sub: T('Original', 'รสดั้งเดิม'), price: 15, size: g(55), g: 'bag-s', style: 'snack',
    pal: ['#c0561a', '#7a2f0a', '#ffd54a', '#2a1206'], bg: 'dots', hero: 'swTamarind', heroOpts: {},
    ing: ['tamarind', 'sugar', 'salt', 'chili'], nut: [190, 40, 0.2, 260],
    desc: T('Sweet tamarind rolled in sugar, salt and chilli: sweet, sour, salty and spicy in one bite.', 'มะขามหวานคลุกน้ำตาล เกลือ และพริก เปรี้ยว หวาน เค็ม เผ็ด ครบรสในคำเดียว') }),
  P({ id: 'lookchoob-fruit', cat: 'candy', brand: 'lookchoob', name: T('Mini Fruits', 'ผลไม้จิ๋ว'), sub: T('Mung bean sweets', 'ขนมไทยถั่วเขียว'), price: 39, size: g(100), g: 'box-xs', style: 'box', font: 'kanit',
    pal: ['#e8438a', '#a01a5a', '#ffe14a', '#ffffff'], bg: 'zig', hero: 'swLookChoob', heroOpts: { k: 1.25 },
    ing: ['mungbean', 'sugar', 'coconutmilk', 'agar', 'colour'], nut: [300, 52, 6, 40],
    desc: T('Bite-sized Thai sweets of sweet mung bean paste, moulded into tiny fruits and glazed with a shiny jelly coat.', 'ขนมไทยถั่วเขียวกวนหอมหวาน ปั้นเป็นผลไม้จิ๋วน่ารัก เคลือบวุ้นเงาวับ') }),

  // ---------------------------------------------------------------------------------------- CHOCOLATE & WAFERS
  P({ id: 'kitkat-greentea', cat: 'choc', brand: 'kitkat', name: T('Green Tea', 'ชาเขียว'), price: 25, size: g(35), g: 'box-choc', style: 'box',
    pal: ['#3aa64a', '#1f6b2c', '#ffffff', '#a8d878'], bg: 'stripes', hero: 'swKitKat', heroOpts: { col: '#a8d878', leaf: true },
    ing: ['sugar', 'wheat', 'palm', 'milkp', 'cocoabutter', 'greentea', 'lecithin', 'yeast', 'salt', 'leaven'], allergens: ['milk', 'wheat', 'soy'], nut: [180, 18, 9, 30], pop: 2,
    desc: T('Crispy wafer fingers wrapped in creamy chocolate flavoured with green tea, a Japanese-style favourite.', 'เวเฟอร์กรอบเคลือบช็อกโกแลตนมผสมชาเขียว รสชาติยอดนิยมสไตล์ญี่ปุ่น') }),
  P({ id: 'snickers', cat: 'choc', brand: 'snickers', name: T('Peanut, Caramel & Nougat', 'ถั่วลิสง คาราเมล นูกัต'), price: 25, size: g(51), g: 'box-choc', style: 'box', origin: 'au',
    pal: ['#1d3f9a', '#0d1f5a', '#e01f26', '#ffffff'], bg: 'rays', hero: 'swSnickers', heroOpts: {},
    ing: ['sugar', 'peanut', 'starchsyrup', 'milkp', 'palm', 'cocoabutter', 'cocoa', 'egg', 'lecithin', 'salt'], allergens: ['peanut', 'milk', 'egg', 'soy'], nut: [250, 27, 12, 140], pop: 3, promo: T('Buy 1 Get 1', '1 แถม 1'),
    desc: T('Roasted peanuts, caramel and nougat wrapped in milk chocolate.', 'ช็อกโกแลตนมสอดไส้นูกัต คาราเมล และถั่วลิสงคั่ว') }),
  P({ id: 'mms-peanut', cat: 'choc', brand: 'mms', name: T('Peanut Chocolate', 'ช็อกโกแลตพีนัท'), sub: T('Candy-coated peanut chocolate', 'ช็อกโกแลตเคลือบน้ำตาล'), price: 25, size: g(37), g: 'bag-s', style: 'snack', origin: 'au',
    pal: ['#ffd400', '#e8a500', '#e8262f', '#5a2c14'], bg: 'dots', hero: 'swMandM', heroOpts: { peanut: true, k: 0.84, dy: 0.08 },
    ing: ['sugar', 'peanut', 'cocoabutter', 'cocoa', 'milkp', 'starch', 'glaze', 'colour', 'lecithin'], allergens: ['peanut', 'milk', 'soy'], nut: [190, 18, 9.5, 20], pop: 2,
    desc: T('Roasted peanuts in milk chocolate under a crisp, colourful candy shell.', 'ถั่วลิสงคั่วในช็อกโกแลตนม เคลือบน้ำตาลกรอบหลากสี') }),
  P({ id: 'kinder-bueno', cat: 'choc', brand: 'kinder', name: T('Bueno Hazelnut Cream', 'บูเอโน ครีมเฮเซลนัท'), price: 45, size: g(43), g: 'box-choc', style: 'box', origin: 'de',
    pal: ['#3f6fd1', '#213f8c', '#e01f26', '#7a4526'], bg: 'rays', hero: 'swBueno', heroOpts: {},
    ing: ['sugar', 'palm', 'hazelnut', 'milkp', 'whey', 'wheat', 'cocoabutter', 'cocoa', 'lecithin'], allergens: ['milk', 'wheat', 'soy', 'nuts'], nut: [240, 17, 15, 60], pop: 2, promo: T('2 for ฿79', '2 ชิ้น 79 บาท'),
    desc: T('Two crisp wafer fingers filled with creamy hazelnut and coated in milk chocolate.', 'เวเฟอร์กรอบสองแท่ง สอดไส้ครีมเฮเซลนัท เคลือบช็อกโกแลตนม') }),
  P({ id: 'kinder-joy', cat: 'choc', brand: 'kinder', name: T('Joy Cream & Toy', 'จอย ครีมพร้อมของเล่น'), price: 29, size: g(20), g: 'box-xs', style: 'box', origin: 'it',
    pal: ['#e01f26', '#a3121a', '#ffffff', '#e01f26'], bg: 'dots', hero: 'swKinderJoy', heroOpts: { k: 1.3 },
    ing: ['sugar', 'milkp', 'palm', 'cocoa', 'hazelnut', 'wheat', 'whey', 'lecithin'], allergens: ['milk', 'wheat', 'soy', 'nuts'], nut: [110, 9, 6.5, 35], impulse: true,
    desc: T('A split egg with a milk-cream side and a cocoa wafer-ball side, plus a small toy surprise.', 'ไข่สองฝั่ง ฝั่งหนึ่งเป็นครีมนม อีกฝั่งเป็นเวเฟอร์บอลเคลือบโกโก้ พร้อมของเล่นชิ้นเล็กให้ลุ้น') }),
  P({ id: 'ferrero-rocher-t3', cat: 'choc', brand: 'ferreroTh', name: T('Hazelnut Chocolate 3 pcs', 'ช็อกโกแลตเฮเซลนัท 3 ชิ้น'), price: 65, size: g(37.5), g: 'box-s', style: 'box', origin: 'it',
    pal: ['#4a2a12', '#2a1508', '#f2c14e', '#7a4a1e'], bg: 'plain', hero: 'swFerrero', heroOpts: { k: 1.35, dy: 0.02 },
    ing: ['hazelnut', 'sugar', 'palm', 'cocoabutter', 'cocoa', 'milkp', 'wheat', 'whey', 'lecithin'], allergens: ['milk', 'wheat', 'soy', 'nuts'], nut: [220, 15, 15, 15],
    desc: T('A whole roasted hazelnut in hazelnut cream, a crisp wafer shell and a crunchy chocolate coating.', 'เฮเซลนัทเต็มเม็ดในครีมเฮเซลนัท ห่อด้วยเวเฟอร์กรอบและช็อกโกแลตผสมเฮเซลนัทบด') }),
  P({ id: 'toblerone-honey', cat: 'choc', brand: 'toblerone', name: T('Honey & Almond Nougat', 'น้ำผึ้งอัลมอนด์นูกัต'), price: 55, size: g(50), g: 'box-choc', style: 'box', origin: 'ch',
    pal: ['#f6c21a', '#d99a00', '#c8102e', '#4a3a10'], bg: 'rays', hero: 'swToblerone', heroOpts: {},
    ing: ['sugar', 'milkp', 'cocoabutter', 'cocoa', 'honey', 'almond', 'egg', 'lecithin'], allergens: ['milk', 'nuts', 'egg', 'soy'], nut: [260, 27, 14, 30],
    desc: T('Swiss milk chocolate with honey and almond nougat in the famous triangular bar.', 'ช็อกโกแลตนมสวิสผสมน้ำผึ้งและอัลมอนด์นูกัต ในแท่งสามเหลี่ยมเอกลักษณ์') }),
  P({ id: 'cadbury-dairymilk', cat: 'choc', brand: 'cadbury', name: T('Milk Chocolate', 'ช็อกโกแลตนม'), price: 25, size: g(34), g: 'box-choc', style: 'box',
    pal: ['#4a1a7a', '#2a0a4a', '#f3c11b', '#6b3418'], bg: 'waves', hero: 'swDairyMilk', heroOpts: {},
    ing: ['sugar', 'milkp', 'cocoabutter', 'cocoa', 'palm', 'emuls', 'flavour'], allergens: ['milk', 'soy'], nut: [180, 19, 10, 30],
    desc: T('Creamy milk chocolate in the classic purple wrapper.', 'ช็อกโกแลตนมเนื้อเนียนนุ่มในห่อสีม่วงสุดคลาสสิก') }),
  P({ id: 'cadbury-roastalmond', cat: 'choc', brand: 'cadbury', name: T('Roast Almond', 'โรสต์อัลมอนด์'), price: 29, size: g(32), g: 'box-choc', style: 'box',
    pal: ['#4a1a7a', '#2a0a4a', '#f3c11b', '#6b3418'], bg: 'rays', hero: 'swDairyMilk', heroOpts: { nut: 'almond' },
    ing: ['sugar', 'milkp', 'almond', 'cocoabutter', 'cocoa', 'palm', 'emuls', 'flavour'], allergens: ['milk', 'nuts', 'soy'], nut: [175, 16, 11, 25],
    desc: T('Milk chocolate studded with crunchy roasted almonds.', 'ช็อกโกแลตนมเม็ดอัลมอนด์คั่วกรอบๆ') }),
  P({ id: 'bengbeng', cat: 'choc', brand: 'beng', name: T('Chocolate Wafer', 'เวเฟอร์รสช็อกโกแลต'), sub: T('Caramel & crispy rice', 'คาราเมลและข้าวพอง'), price: 8, size: g(20), g: 'stick', style: 'box', origin: 'id',
    pal: ['#e60012', '#a3000c', '#ffd400', '#4a2410'], bg: 'stripes', hero: 'swBengBeng', heroOpts: { tall: true, k: 1.2 },
    ing: ['sugar', 'wheat', 'palm', 'cocoa', 'milkp', 'crispyrice', 'caramelc', 'lecithin'], allergens: ['milk', 'wheat', 'soy'], nut: [100, 8, 6, 15], impulse: true, pop: 2,
    desc: T('A chocolate-coated wafer with soft caramel and crispy rice, from Indonesia.', 'เวเฟอร์เคลือบช็อกโกแลต สอดไส้คาราเมลและข้าวพองกรอบ จากอินโดนีเซีย') }),
  P({ id: 'pocky-choc', cat: 'choc', brand: 'pocky', name: T('Chocolate', 'ช็อกโกแลต'), sub: T('Chocolate-coated biscuit sticks', 'บิสกิตแท่งเคลือบช็อกโกแลต'), price: 25, size: g(40), g: 'box-s', style: 'box',
    pal: ['#e60012', '#a3000c', '#ffffff', '#5a2c14'], bg: 'rays', hero: 'swPocky', heroOpts: {},
    ing: ['wheat', 'sugar', 'cocoa', 'milkp', 'palm', 'cocoabutter', 'lecithin', 'salt', 'leaven', 'yeast'], allergens: ['wheat', 'milk', 'soy'], nut: [210, 12, 9, 110], pop: 2,
    desc: T('Crunchy biscuit sticks dipped in rich chocolate, with an uncoated handle so fingers stay clean.', 'บิสกิตแท่งกรอบจุ่มช็อกโกแลตเข้มข้น มีด้ามให้จับไม่เลอะมือ') }),
  P({ id: 'pocky-strawberry', cat: 'choc', brand: 'pocky', name: T('Strawberry', 'สตรอว์เบอร์รี่'), sub: T('Strawberry-coated biscuit sticks', 'บิสกิตแท่งเคลือบรสสตรอว์เบอร์รี่'), price: 25, size: g(43), g: 'box-s', style: 'box',
    pal: ['#ff5c8a', '#c2185b', '#ffffff', '#ff9ab8'], bg: 'dots', hero: 'swPocky', heroOpts: { col: '#ff9ab8', sprinkle: '#ffffff', fruit: 'strawberry' },
    ing: ['wheat', 'sugar', 'palm', 'milkp', 'cocoabutter', 'strawberry', 'lecithin', 'salt', 'leaven', 'colour', 'flavour'], allergens: ['wheat', 'milk', 'soy'], nut: [215, 14, 9, 100], promo: T('2 for ฿45', '2 กล่อง 45 บาท'),
    desc: T('Biscuit sticks coated in pink strawberry cream.', 'บิสกิตแท่งเคลือบครีมรสสตรอว์เบอร์รี่สีชมพูหวานๆ') }),
  P({ id: 'chocopie-original', cat: 'choc', brand: 'chocopie', name: T('Marshmallow Cake 2 pcs', 'เค้กมาร์ชแมลโลว์ 2 ชิ้น'), price: 20, size: g(60), g: 'box-m', style: 'box', origin: 'kr',
    pal: ['#b3141f', '#7a0a12', '#ffe14a', '#4a2410'], bg: 'waves', hero: 'swChocoPie', heroOpts: {},
    ing: ['sugar', 'wheat', 'palm', 'marshmallow', 'starchsyrup', 'cocoa', 'egg', 'milkp', 'lecithin', 'leaven', 'salt'], allergens: ['wheat', 'egg', 'milk', 'soy'], nut: [260, 17, 11, 110],
    desc: T('Two soft cake layers around fluffy marshmallow, coated in chocolate: a Korean snack icon.', 'เค้กนุ่มสองชั้นสอดไส้มาร์ชแมลโลว์ฟูนุ่ม เคลือบช็อกโกแลต ขนมยอดนิยมจากเกาหลี') }),
  P({ id: 'hellopanda-choc', cat: 'choc', brand: 'hellopanda', name: T('Chocolate Cream', 'ครีมช็อกโกแลต'), sub: T('Cream-filled biscuits', 'บิสกิตสอดไส้ครีม'), price: 20, size: g(50), g: 'box-s', style: 'box',
    pal: ['#3aa0e6', '#1f6fb8', '#ffd54a', '#ffffff'], bg: 'dots', hero: 'swHelloPanda', heroOpts: {},
    ing: ['wheat', 'sugar', 'palm', 'cocoa', 'milkp', 'lecithin', 'leaven', 'salt'], allergens: ['wheat', 'milk', 'soy'], nut: [260, 17, 13, 70],
    desc: T('Bite-sized biscuits stamped with pandas and filled with chocolate cream.', 'บิสกิตชิ้นจิ๋วปั๊มลายแพนด้า สอดไส้ครีมช็อกโกแลต') }),
  P({ id: 'timtam-original', cat: 'choc', brand: 'tim', name: T('Original Chocolate', 'ออริจินัล ช็อกโกแลต'), price: 99, size: g(175), g: 'box-l', style: 'box', origin: 'au',
    pal: ['#b3141f', '#7a0a12', '#ffffff', '#4a2410'], bg: 'stripes', hero: 'swTimTam', heroOpts: { k: 1.25 },
    ing: ['sugar', 'wheat', 'palm', 'cocoa', 'milkp', 'starchsyrup', 'lecithin', 'leaven', 'salt'], allergens: ['wheat', 'milk', 'soy'], nut: [180, 15, 9, 45],
    desc: T('Two malted chocolate biscuits with a chocolate cream layer, dipped in a chocolate coat. An Aussie import.', 'บิสกิตช็อกโกแลตมอลต์สองชั้นสอดไส้ครีมช็อกโกแลต เคลือบช็อกโกแลตอีกชั้น ขนมนำเข้าจากออสเตรเลีย') }),

  // ---------------------------------------------------------------------------------------- BISCUITS & COOKIES
  P({ id: 'oreo-vanilla', cat: 'biscuit', brand: 'oreo', name: T('Vanilla Cream', 'ครีมวานิลลา'), sub: T('Sandwich cookies', 'คุกกี้แซนวิชสอดไส้ครีม'), price: 15, size: g(61.25), g: 'box-m', style: 'box',
    pal: ['#0a4aa6', '#062a66', '#ffffff', '#3a2a22'], bg: 'rays', hero: 'swOreo', heroOpts: {},
    ing: ['sugar', 'wheat', 'palm', 'cocoa', 'fructose', 'leaven', 'salt', 'lecithin', 'vanilla'], allergens: ['wheat', 'soy'], nut: [165, 12, 7, 100], pop: 3, promo: T('3 for ฿40', '3 ชิ้น 40 บาท'),
    desc: T('Crunchy chocolate cookies with a sweet vanilla cream filling: twist, lick, dunk.', 'คุกกี้ช็อกโกแลตกรอบ สอดไส้ครีมวานิลลา บิด เลีย จุ่มนม ตามสไตล์') }),
  P({ id: 'oreo-strawberry', cat: 'biscuit', brand: 'oreo', name: T('Strawberry Cream', 'ครีมสตรอว์เบอร์รี่'), sub: T('Sandwich cookies', 'คุกกี้แซนวิชสอดไส้ครีม'), price: 12, size: g(35), g: 'brick', style: 'box',
    pal: ['#e0447c', '#a01a55', '#ffffff', '#3a2a22'], bg: 'dots', hero: 'swOreo', heroOpts: { col2: '#ffc0d4', k: 1.2 },
    ing: ['sugar', 'wheat', 'palm', 'cocoa', 'fructose', 'strawberry', 'leaven', 'salt', 'lecithin', 'colour', 'flavour'], allergens: ['wheat', 'soy'], nut: [165, 13, 7, 95],
    desc: T('The chocolate cookie you know, with a pink strawberry cream centre.', 'คุกกี้ช็อกโกแลตกรอบที่คุ้นเคย สอดไส้ครีมรสสตรอว์เบอร์รี่สีชมพู') }),
  P({ id: 'biscoff-original', cat: 'biscuit', brand: 'lotus', name: T('Caramelised Biscuits', 'บิสกิตรสคาราเมลไลซ์'), price: 25, size: g(37.5), g: 'bag-flat', style: 'snack', origin: 'be', ean: '541012600053',
    pal: ['#b3141f', '#7a0a12', '#f6e7c8', '#c47a2c'], bg: 'plain', hero: 'swBiscoff', heroOpts: { col: '#c47a2c', cinnamon: true, k: 0.86, dy: 0.05 },
    ing: ['wheat', 'sugar', 'palm', 'sodiumb', 'soy', 'salt', 'cinnamon'], allergens: ['wheat', 'soy'], nut: [190, 9, 8, 100], pop: 2,
    desc: T('Crisp Belgian biscuits with a caramelised flavour and a hint of cinnamon, made for dunking in coffee.', 'บิสกิตเบลเยียมกรอบรสคาราเมล หอมอบเชยอ่อนๆ เหมาะจิ้มกับกาแฟ') }),
  P({ id: 'creamo-choc', cat: 'biscuit', brand: 'creamo', name: T('Chocolate Vanilla Cream', 'ช็อกโกแลต ไส้ครีมวานิลลา'), price: 25, size: g(94.5), g: 'box-m', style: 'box',
    pal: ['#e8532a', '#b52a10', '#ffe14a', '#3a2418'], bg: 'stripes', hero: 'swSandwichCookie', heroOpts: { emboss: 'flower' },
    ing: ['sugar', 'wheat', 'palm', 'cocoa', 'starchsyrup', 'leaven', 'salt', 'lecithin', 'vanilla'], allergens: ['wheat', 'soy'], nut: [150, 12, 6.5, 85], pop: 2,
    desc: T('Chocolate sandwich cookies filled with smooth vanilla cream.', 'คุกกี้แซนวิชรสช็อกโกแลตสอดไส้ครีมวานิลลาเนียนนุ่ม') }),
  P({ id: 'ritz-cheese', cat: 'biscuit', brand: 'ritz', name: T('Cheese Sandwich Crackers', 'แซนด์วิชแครกเกอร์ รสชีส'), price: 12, size: g(27), g: 'box-s', style: 'box',
    pal: ['#c8102e', '#8f0a1e', '#ffd400', '#eba93c'], bg: 'rays', hero: 'swRitz', heroOpts: { cheese: true, k: 1.2 },
    ing: ['wheat', 'palm', 'sugar', 'cheese', 'cheeseseason', 'salt', 'leaven', 'yeast', 'milkp'], allergens: ['wheat', 'milk', 'soy'], nut: [140, 3, 7, 150], pop: 2,
    desc: T('Buttery Ritz crackers sandwiching a salty cheese filling.', 'แครกเกอร์ริทซ์กรอบมัน สอดไส้ครีมชีสรสเค็ม') }),
  P({ id: 'ritz-original', cat: 'biscuit', brand: 'ritz', name: T('Original Crackers', 'แครกเกอร์ ออริจินัล'), price: 25, size: g(100), g: 'box-s', style: 'box',
    pal: ['#c8102e', '#8f0a1e', '#ffd400', '#eba93c'], bg: 'dots', hero: 'swRitz', heroOpts: { k: 1.2 },
    ing: ['wheat', 'palm', 'sugar', 'salt', 'leaven', 'yeast', 'malt'], allergens: ['wheat', 'soy'], nut: [80, 1, 4, 115],
    desc: T('Light, flaky, lightly salted crackers, ready for cheese or just to crunch.', 'แครกเกอร์กรอบร่วน เค็มอ่อนๆ กินเปล่าๆ หรือทานคู่ชีสก็อร่อย') }),
  P({ id: 'julies-peanutbutter', cat: 'biscuit', brand: 'julies', name: T('Peanut Butter Sandwich', 'แซนด์วิชครีมเนยถั่ว'), price: 39, size: g(180), g: 'box-l', style: 'box', origin: 'my',
    pal: ['#d9331f', '#9a1c0e', '#ffd54a', '#e8b45e'], bg: 'zig', hero: 'swSandwichCookie', heroOpts: { col: '#e8b45e', col2: '#f3d59a', emboss: 'dots', peanuts: true },
    ing: ['wheat', 'sugar', 'palm', 'peanutbutter', 'peanut', 'milkp', 'salt', 'leaven', 'lecithin'], allergens: ['wheat', 'peanut', 'milk', 'soy'], nut: [150, 10, 7, 80],
    desc: T('Golden biscuits sandwiching creamy peanut butter, from Malaysia.', 'บิสกิตสีทองสอดไส้ครีมเนยถั่วเนียนนุ่ม จากมาเลเซีย') }),
  P({ id: 'danisa-butter-cookies', cat: 'biscuit', brand: 'danisa', name: T('Butter Cookies', 'บัตเตอร์คุกกี้'), sub: T('Assorted shapes', 'หลากรูปทรง'), price: 55, size: g(132), g: 'box-l', style: 'box',
    pal: ['#1f4fa6', '#0d2f6b', '#ffffff', '#e9b866'], bg: 'plain', hero: 'swDanisa', heroOpts: {},
    ing: ['wheat', 'butter', 'sugar', 'egg', 'milkp', 'salt', 'leaven', 'vanilla'], allergens: ['wheat', 'milk', 'egg'], nut: [150, 8, 8, 70],
    desc: T('Crumbly Danish-style butter cookies in assorted shapes.', 'คุกกี้เนยสไตล์เดนมาร์ก หลากรูปทรง กรอบร่วน หอมเนย') }),
  P({ id: 'collon-cream', cat: 'biscuit', brand: 'collon', name: T('Cream', 'รสครีม'), sub: T('Cream-filled wafer rolls', 'เวเฟอร์โรลสอดไส้ครีม'), price: 20, size: g(41), g: 'box-s', style: 'box',
    pal: ['#3aa0e6', '#1f6fb8', '#fff3a8', '#fff2d6'], bg: 'waves', hero: 'swCollon', heroOpts: { k: 1.2 },
    ing: ['wheat', 'sugar', 'palm', 'milkp', 'starchsyrup', 'emuls', 'salt', 'leaven', 'flavour'], allergens: ['wheat', 'milk', 'soy'], nut: [230, 11, 12, 60],
    desc: T('Crisp rolled wafers filled with sweet cream.', 'เวเฟอร์โรลกรอบ สอดไส้ครีมหวานมัน') }),
  P({ id: 'yanyan-hazelnut', cat: 'biscuit', brand: 'yanyan', name: T('Hazelnut Cocoa', 'ครีมเฮเซลนัทโกโก้'), sub: T('Biscuit sticks with dip', 'บิสกิตแท่งจิ้มครีม'), price: 25, size: g(44), g: 'box-s', style: 'box',
    pal: ['#ffd400', '#e0a800', '#e4002b', '#5a2c14'], bg: 'dots', hero: 'swYanYan', heroOpts: { col: '#e4002b', col2: '#5a2c14' },
    ing: ['wheat', 'sugar', 'palm', 'cocoa', 'hazelnut', 'milkp', 'lecithin', 'salt', 'leaven'], allergens: ['wheat', 'milk', 'soy', 'nuts'], nut: [230, 14, 11, 110],
    desc: T('Crunchy biscuit sticks to dunk in a hazelnut-cocoa cream.', 'บิสกิตแท่งกรอบ จิ้มกับครีมเฮเซลนัทโกโก้') }),
  P({ id: 'bourbon-chococoffee', cat: 'biscuit', brand: 'bourbon', name: T('Choco & Coffee', 'ช็อกโกแอนด์คอฟฟี่'), price: 45, size: g(103), g: 'box-l', style: 'box', origin: 'jp',
    pal: ['#7a1f1f', '#4a1010', '#ffd9a0', '#3a2418'], bg: 'zig', hero: 'swBiscuitRect', heroOpts: { beans: true },
    ing: ['wheat', 'sugar', 'palm', 'cocoa', 'coffee', 'milkp', 'emuls', 'salt', 'leaven'], allergens: ['wheat', 'milk', 'soy'], nut: [165, 9, 8, 90],
    desc: T('A Japanese biscuit snack from Bourbon, flavoured with chocolate and coffee.', 'บิสกิตขนมญี่ปุ่นจากเบอร์บอน รสช็อกโกแลตและกาแฟ') }),
  P({ id: 'pretz-tomyum', cat: 'biscuit', brand: 'pretz', name: T('Tom Yum Kung', 'ต้มยำกุ้ง'), sub: T('Baked biscuit sticks', 'บิสกิตแท่งอบกรอบ'), price: 15, size: g(21), g: 'box-s', style: 'box',
    pal: ['#ff6a1a', '#c2410a', '#ffe14a', '#c8321a'], bg: 'rays', hero: 'swPretz', heroOpts: { stick: '#e0793a', season: '#c8321a', shrimp: true, k: 1.1 },
    ing: ['wheat', 'palm', 'sugar', 'salt', 'tomyum', 'shrimp', 'chili', 'msg', 'leaven'], allergens: ['wheat', 'shrimp'], nut: [95, 1, 2.5, 200],
    desc: T('Thin baked biscuit sticks dusted with tom yum kung seasoning, a Thai twist on a Japanese classic.', 'บิสกิตแท่งอบกรอบเคลือบผงปรุงรสต้มยำกุ้ง สูตรไทยของขนมญี่ปุ่นยอดนิยม') }),
  P({ id: 'toppo-cocoa', cat: 'biscuit', brand: 'toppo', name: T('Choc-filled Cocoa Pretzel', 'เพรทเซลโกโก้ไส้ช็อกโกแลต'), price: 25, size: g(40), g: 'box-s', style: 'box', origin: 'jp',
    pal: ['#6a3a1c', '#3a1c0a', '#ffd54a', '#a5642c'], bg: 'stripes', hero: 'swToppo', heroOpts: {},
    ing: ['wheat', 'sugar', 'palm', 'cocoa', 'milkp', 'lecithin', 'salt', 'leaven', 'yeast'], allergens: ['wheat', 'milk', 'soy'], nut: [210, 12, 10, 120],
    desc: T('Hollow pretzel-style biscuit sticks filled with chocolate cream right to the tip.', 'บิสกิตแท่งเพรทเซลกลวง สอดไส้ช็อกโกแลตเต็มแท่งถึงปลาย') }),
  P({ id: 'koala-chocolate', cat: 'biscuit', brand: 'koala', name: T('Chocolate filled', 'สอดไส้ช็อกโกแลต'), sub: T('Koala biscuits', 'บิสกิตรูปโคอาล่า'), price: 20, size: g(37), g: 'box-s', style: 'box',
    pal: ['#e4002b', '#a3001e', '#ffe14a', '#e6ae5a'], bg: 'dots', hero: 'swKoala', heroOpts: {},
    ing: ['wheat', 'sugar', 'palm', 'cocoa', 'milkp', 'emuls', 'leaven', 'salt', 'flavour'], allergens: ['wheat', 'milk', 'soy'], nut: [200, 12, 10, 70],
    desc: T('Bite-sized biscuits printed with playful koalas and filled with chocolate cream.', 'บิสกิตชิ้นจิ๋วพิมพ์ลายโคอาล่าสุดน่ารัก สอดไส้ครีมช็อกโกแลต') }),
  P({ id: 'koala-thaitea', cat: 'biscuit', brand: 'koala', name: T('Rich Thai Tea', 'ริช รสชาไทย'), sub: T('Koala biscuits', 'บิสกิตรูปโคอาล่า'), price: 25, size: g(33), g: 'box-s', style: 'box', isNew: true,
    pal: ['#e8590c', '#b53a00', '#fff3a8', '#e6ae5a'], bg: 'rays', hero: 'swKoala', heroOpts: { col: '#f0b060' },
    ing: ['wheat', 'sugar', 'palm', 'thaitea', 'milkp', 'emuls', 'leaven', 'salt', 'flavour'], allergens: ['wheat', 'milk', 'soy'], nut: [190, 12, 9.5, 65],
    desc: T('Koala biscuits filled with a Thai-iced-tea-flavoured cream.', 'บิสกิตโคอาล่าสอดไส้ครีมรสชาไทย หอมมัน') }),
  P({ id: 'ovaltine-cookie', cat: 'biscuit', brand: 'ovaltine', name: T('Chocolate Cookies', 'คุกกี้รสช็อกโกแลต'), sub: T('Cream-filled', 'สอดไส้ครีม'), price: 10, size: g(30), g: 'bag-flat', style: 'snack',
    pal: ['#f58220', '#c25a00', '#ffffff', '#00529b'], bg: 'stripes', hero: 'swSandwichCookie', heroOpts: { col: '#b87a3a', col2: '#7a3a12', emboss: 'plain', k: 0.8, dy: 0.07 },
    ing: ['wheat', 'sugar', 'palm', 'malt', 'cocoa', 'milkp', 'lecithin', 'leaven', 'salt'], allergens: ['wheat', 'milk', 'soy'], nut: [150, 9, 7, 60],
    desc: T('Cream-filled cookies with the malty flavour of Ovaltine.', 'คุกกี้สอดไส้ครีมรสมอลต์แบบโอวัลติน') }),
];

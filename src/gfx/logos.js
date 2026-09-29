// Brand wordmarks / badges drawn with canvas primitives (stylised, not pixel-accurate trademarks).
import { BRANDS } from '../data/brands.js';
import { lang } from '../core/i18n.js';
import { fitText, fillRR, circle, ellipse, rrPath, poly, radGrad } from './draw.js';
import { drawIllus } from './illus.js';
import { darken, lighten, contrastText, TAU } from '../core/util.js';

// cx, cy = centre; W, H = box the logo must fit in.
export function drawLogo(ctx, brand, cx, cy, W, H, o = {}) {
  const B = typeof brand === 'string' ? BRANDS[brand] || BRANDS.generic : brand;
  if (!B.text) return;
  const showTh = o.showTh ?? (lang.mode !== 'en' && !!B.th);
  const thH = showTh ? H * 0.3 : 0;
  const mH = H - thH;
  const x = cx - W / 2, y = cy - H / 2;
  const fg = B.fg || '#fff', bg = B.bg || null, font = B.font || 'kanit';
  const weight = font === 'kanit' ? 900 : 400;
  const ring = B.ring || fg;
  ctx.save();
  switch (B.style) {
    case 'oval': {
      ctx.save(); ctx.translate(cx, y + mH / 2); ctx.rotate(-0.06);
      ellipse(ctx, 0, 0, W / 2, mH / 2, bg, ring, mH * 0.06);
      ellipse(ctx, 0, 0, W / 2 - mH * 0.1, mH / 2 - mH * 0.1, null, 'rgba(255,255,255,.35)', mH * 0.02);
      fitText(ctx, B.text, -W * 0.42, -mH * 0.4, W * 0.84, mH * 0.8, { family: font, weight, size: mH, color: fg, shadow: ['rgba(0,0,0,.35)', 0, 0, mH * 0.03] });
      ctx.restore();
      break;
    }
    case 'pill': {
      fillRR(ctx, x, y, W, mH, mH / 2, bg || '#fff', ring, mH * 0.07);
      fitText(ctx, B.text, x + W * 0.06, y + mH * 0.1, W * 0.88, mH * 0.8, { family: font, weight, size: mH, color: fg });
      break;
    }
    case 'shield': {
      const w = W * 0.92, h = mH;
      ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx + w / 2, y); ctx.lineTo(cx + w / 2, y + h * 0.62); ctx.quadraticCurveTo(cx + w / 2, y + h * 0.9, cx, y + h); ctx.quadraticCurveTo(cx - w / 2, y + h * 0.9, cx - w / 2, y + h * 0.62); ctx.closePath();
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = h * 0.06; ctx.strokeStyle = ring; ctx.stroke();
      fitText(ctx, B.text, cx - w * 0.4, y + h * 0.12, w * 0.8, h * 0.52, { family: font, weight, size: h, color: fg, shadow: ['rgba(0,0,0,.35)', 0, 0, h * 0.02] });
      ctx.fillStyle = ring; ctx.fillRect(cx - w * 0.36, y + h * 0.7, w * 0.72, h * 0.03);
      break;
    }
    case 'circle': {
      const r = Math.min(W, mH) / 2;
      if (B.mark === 'pepsi') {
        circle(ctx, cx, y + mH / 2, r, '#fff', '#0057b8', r * 0.06);
        ctx.save(); ctx.beginPath(); ctx.arc(cx, y + mH / 2, r * 0.94, 0, TAU); ctx.clip();
        ctx.fillStyle = '#e32636'; ctx.fillRect(cx - r, y + mH / 2 - r, r * 2, r);
        ctx.fillStyle = '#0057b8'; ctx.fillRect(cx - r, y + mH / 2, r * 2, r);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - r, y + mH / 2 + r * 0.05); ctx.bezierCurveTo(cx - r * 0.3, y + mH / 2 - r * 0.45, cx + r * 0.2, y + mH / 2 + r * 0.5, cx + r, y + mH / 2 - r * 0.1); ctx.lineTo(cx + r, y + mH / 2 + r * 0.3); ctx.bezierCurveTo(cx + r * 0.3, y + mH / 2 + r * 0.7, cx - r * 0.3, y + mH / 2 - r * 0.2, cx - r, y + mH / 2 + r * 0.35); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else {
        circle(ctx, cx, y + mH / 2, r, bg, ring, r * 0.08);
        fitText(ctx, B.text, cx - r * 0.75, y + mH / 2 - r * 0.4, r * 1.5, r * 0.8, { family: font, weight, size: r, color: fg });
      }
      break;
    }
    case 'stamp': {
      fillRR(ctx, x, y, W, mH, mH * 0.12, bg, ring, mH * 0.06);
      fillRR(ctx, x + mH * 0.1, y + mH * 0.1, W - mH * 0.2, mH - mH * 0.2, mH * 0.06, null, ring, mH * 0.025);
      fitText(ctx, B.text, x + W * 0.08, y + mH * 0.18, W * 0.84, mH * 0.64, { family: font, weight, size: mH, color: fg });
      break;
    }
    case 'script': {
      const t = fitText(ctx, B.text, x, y, W, mH * 0.85, { family: font, weight, size: mH, color: fg, stroke: B.stroke, strokeW: mH * 0.1, shadow: ['rgba(0,0,0,.3)', 0, mH * 0.025, mH * 0.05] });
      ctx.strokeStyle = fg; ctx.lineWidth = mH * 0.05; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - t.w * 0.45, y + mH * 0.9); ctx.quadraticCurveTo(cx, y + mH * 1.0, cx + t.w * 0.45, y + mH * 0.82); ctx.stroke();
      break;
    }
    case 'ribbon': {
      const h = mH * 0.72, ry = y + (mH - h) / 2;
      ctx.fillStyle = darken(bg, 0.3);
      poly(ctx, [[x, ry + h * 0.2], [x + W * 0.1, ry + h * 0.2], [x + W * 0.1, ry + h * 1.05], [x, ry + h * 1.05], [x + W * 0.04, ry + h * 0.62]], darken(bg, 0.3));
      poly(ctx, [[x + W, ry + h * 0.2], [x + W * 0.9, ry + h * 0.2], [x + W * 0.9, ry + h * 1.05], [x + W, ry + h * 1.05], [x + W * 0.96, ry + h * 0.62]], darken(bg, 0.3));
      fillRR(ctx, x + W * 0.06, ry, W * 0.88, h, h * 0.1, bg, ring, h * 0.05);
      fitText(ctx, B.text, x + W * 0.12, ry + h * 0.1, W * 0.76, h * 0.8, { family: font, weight, size: h, color: fg });
      break;
    }
    case 'block': {
      fillRR(ctx, x, y, W, mH, mH * 0.08, bg, null);
      ctx.fillStyle = ring; ctx.fillRect(x + mH * 0.08, y + mH * 0.08, W - mH * 0.16, mH * 0.05); ctx.fillRect(x + mH * 0.08, y + mH * 0.87, W - mH * 0.16, mH * 0.05);
      fitText(ctx, B.text, x + W * 0.06, y + mH * 0.16, W * 0.88, mH * 0.68, { family: font, weight, size: mH, color: fg, skew: B.skew || 0 });
      break;
    }
    case 'bull': {
      circle(ctx, cx, y + mH * 0.42, Math.min(W, mH) * 0.42, bg, ring, mH * 0.05);
      drawIllus(ctx, 'bull', cx, y + mH * 0.42, Math.min(W, mH) * 0.75, { c1: ring });
      fitText(ctx, B.text, x, y + mH * 0.82, W, mH * 0.2, { family: font, weight: 700, size: mH * 0.2, color: fg, stroke: bg, strokeW: mH * 0.03 });
      break;
    }
    default: { // plain heavy wordmark
      ctx.save();
      if (B.skew) { ctx.translate(cx, cy); ctx.transform(1, 0, B.skew, 1, 0, 0); ctx.translate(-cx, -cy); }
      fitText(ctx, B.text, x, y, W, mH, { family: font, weight, size: mH, color: fg, stroke: B.stroke, strokeW: mH * 0.14, shadow: ['rgba(0,0,0,.3)', 0, mH * 0.025, mH * 0.06] });
      ctx.restore();
    }
  }
  if (showTh) {
    const bare = B.style === 'plain' || B.style === 'script' || !!B.mark;   // no plate behind the Thai line (mark-only logos such as the Pepsi globe)
    const tc = bare ? (B.mark ? '#ffffff' : fg) : (bg ? contrastText(bg) : '#222');
    fitText(ctx, B.th, x, y + mH + thH * 0.06, W, thH * 0.94, { family: 'kanit', weight: 700, size: thH, color: tc, stroke: bare ? (B.stroke || (B.mark ? '#0a2a5e' : '#000')) : null, strokeW: thH * 0.16 });
  }
  ctx.restore();
}

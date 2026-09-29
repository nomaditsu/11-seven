// Thai-style thermal receipt (ใบเสร็จรับเงิน/ใบกำกับภาษีอย่างย่อ), drawn on a canvas in the current language.
import { lang, pick, pick2, tp, t, tOnly } from '../core/i18n.js';
import { makeCanvas, fitText, drawBarcode, ean13, fontStr } from '../gfx/draw.js';
import { drawLogo, drawStripes, LOGO_W, LOGO_H } from '../gfx/logo11seven.js';
import { fmtBaht, pad2 } from '../core/util.js';
import { fmtClock } from './session.js';

export function drawReceipt(canvas, data) {
  const W = 420, scratch = makeCanvas(W, 10);
  const H = paint(scratch.ctx, W, data, true);
  canvas.width = W * 2; canvas.height = Math.ceil(H * 2);
  canvas.style.width = W + 'px'; canvas.style.height = Math.ceil(H) + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  paint(ctx, W, data, false);
}

function paint(ctx, W, d, measure) {
  const pad = 22, thai = lang.code === 'th';
  let y = 16;
  if (!measure) {
    ctx.fillStyle = '#fffef9'; ctx.fillRect(0, 0, W, 4000);
    // paper texture
    ctx.fillStyle = 'rgba(0,0,0,.025)'; for (let i = 0; i < 4000; i += 3) ctx.fillRect(0, i, W, 1);
  }
  const line = (txt, o = {}) => {
    const size = o.size || 16, w = o.weight || 700, align = o.align || 'left';
    ctx.font = fontStr(w, size, o.family || 'sarabun');
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.track ?? 0.4) + 'px';
    ctx.textBaseline = 'top'; ctx.textAlign = align;
    ctx.fillStyle = o.color || '#222';
    if (!measure) ctx.fillText(txt, align === 'center' ? W / 2 : align === 'right' ? W - pad : pad, y);
    y += Math.round(size * 1.32);
  };
  const two = (a, b, o = {}) => {
    const size = o.size || 16; ctx.font = fontStr(o.weight || 700, size, 'sarabun'); ctx.textBaseline = 'top'; ctx.fillStyle = o.color || '#222';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.4px';
    if (!measure) { ctx.textAlign = 'left'; ctx.fillText(a, pad, y); ctx.textAlign = 'right'; ctx.fillText(b, W - pad, y); }
    y += Math.round(size * 1.32);
  };
  const dash = () => { if (!measure) { ctx.strokeStyle = '#999'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, y + 3); ctx.lineTo(W - pad, y + 3); ctx.stroke(); ctx.setLineDash([]); } y += 10; };
  const tt = (k) => (lang.second ? `${tOnly(k, lang.code)} / ${tOnly(k, lang.second)}` : tOnly(k, lang.code));

  // header
  if (!measure) { drawLogo(ctx, (W - 64 * LOGO_W / LOGO_H) / 2, y, 64, { radius: 24 }); }
  y += 72;
  if (!measure) drawStripes(ctx, pad, y, W - pad * 2, 9);
  y += 16;
  line(tt('rc.company'), { align: 'center', size: 15 });
  line(tt('rc.branch'), { align: 'center', size: 14, weight: 500 });
  line(tOnly('rc.address', lang.code), { align: 'center', size: 12, weight: 500, color: '#555' });
  line(`${tOnly('rc.taxId', lang.code)} 0105599999999`, { align: 'center', size: 13, weight: 500, color: '#555' });
  y += 4;
  line(tt('rc.taxInvoice'), { align: 'center', size: 14 });
  dash();
  const dt = d.date;
  const yr = thai || lang.mode === 'both' ? dt.getFullYear() + 543 : dt.getFullYear();
  two(`${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${yr}  ${fmtClock(d.hour)}`, `#${d.no}`, { size: 14, weight: 500 });
  two(`${tOnly('rc.pos', lang.code)} 01`, `${tOnly('rc.cashier', lang.code)}: 07711`, { size: 14, weight: 500 });
  dash();
  two(tOnly('rc.item', lang.code) + (lang.second ? ' / ' + tOnly('rc.item', lang.second) : ''), tOnly('rc.amount', lang.code), { size: 13, color: '#666' });
  // items
  for (const e of d.items) {
    const nm = pick(e.sku.name);
    const brandName = e.sku.brandText ? e.sku.brandText + ' ' : '';
    two(`${e.qty}× ${trunc(ctx, brandName + nm, W - pad * 2 - 90)}`, fmtBaht(e.qty * e.sku.price) + '.00', { size: 15 });
    if (lang.second) line('   ' + pick2(e.sku.name), { size: 12, weight: 500, color: '#666' });
    if (e.heated) line('   🔥 ' + tOnly('rc.heated', lang.code), { size: 12, weight: 500, color: '#b45a00' });
  }
  dash();
  two(tt('rc.subtotal'), fmtBaht(d.total) + '.00', { size: 15, weight: 500 });
  two(tt('rc.vat'), fmtBaht(Math.round((d.total * 7 / 107) * 100) / 100), { size: 13, weight: 500, color: '#666' });
  y += 2;
  two(tt('rc.total'), '฿' + fmtBaht(d.total) + '.00', { size: 24 });
  dash();
  const method = d.method === 'cash' ? 'rc.cash' : d.method === 'promptpay' ? 'rc.pp' : 'rc.tm';
  two(tOnly(method, lang.code), fmtBaht(d.method === 'cash' ? d.given : d.total) + '.00', { size: 15, weight: 500 });
  if (d.method === 'cash') two(tOnly('rc.change', lang.code), fmtBaht(d.change) + '.00', { size: 15, weight: 500 });
  dash();
  two(tOnly('rc.points', lang.code), `+${d.points}`, { size: 14, weight: 500, color: '#00874a' });
  y += 6;
  if (!measure) { drawBarcode(ctx, ean13('88511' + d.no + '0'), pad + 40, y, W - pad * 2 - 80, 54, '#111', '#fffef9', false); }
  y += 62;
  line(tOnly('rc.thanks', lang.code), { align: 'center', size: 16 });
  if (lang.second) line(tOnly('rc.thanks', lang.second), { align: 'center', size: 13, weight: 500, color: '#555' });
  line(tOnly('rc.tagline', lang.code), { align: 'center', size: 13, weight: 500, color: '#555' });
  y += 8;
  if (!measure) { // torn edge
    ctx.fillStyle = '#d9d4c3';
    for (let x = 0; x < W; x += 10) { ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + 5, y); ctx.lineTo(x + 10, y + 6); ctx.fill(); }
  }
  return y + 8;
}

function trunc(ctx, s, maxW) {
  ctx.font = fontStr(700, 15, 'sarabun');
  if (ctx.measureText(s).width <= maxW) return s;
  while (s.length > 3 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s + '…';
}

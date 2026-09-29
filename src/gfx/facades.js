// Procedural Bangkok shophouse facades (weathered concrete, window grilles, AC condensers, laundry…)
// plus the storefront signs of the neighbouring shops (localised so they translate with the language switch).
import { makeCanvas, langText, linGrad } from './draw.js';
import { canvasTex } from './surfaces.js';
import { LTex } from './localized.js';
import { rng } from '../core/util.js';

const PALETTES = [
  ['#e6d9bd', '#cdbf9c'], ['#c4d3bd', '#a4b79c'], ['#bccbd6', '#98abb9'], ['#e4bfa9', '#c99f88'],
  ['#d6d2c8', '#b3aea1'], ['#e0cd8c', '#c3ad64'], ['#d9c3c9', '#bb9ea6'], ['#b9c6b4', '#95a68f'],
];

// Draw one upper-floor facade into a context using 96 logical units per metre.
function drawUpper(ctx, emx, r, pal, LW, LH, floors, wM) {
  const fh = 3.1 * 96;
  ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, LW, LH);
  emx.fillStyle = '#000'; emx.fillRect(0, 0, LW, LH);
  // weathering
  for (let i = 0; i < 90; i++) {
    const x = r() * LW, y = r() * LH, w = 4 + r() * 30, h = 30 + r() * 220;
    ctx.fillStyle = linGrad(ctx, 0, y, 0, y + h, [[0, 'rgba(50,45,30,0.22)'], [1, 'rgba(50,45,30,0)']]);
    ctx.fillRect(x, y, w, h);
  }
  for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(30,60,30,${0.05 + r() * 0.08})`; ctx.beginPath(); ctx.ellipse(r() * LW, r() * LH, 10 + r() * 40, 6 + r() * 18, 0, 0, 6.3); ctx.fill(); }
  for (let f = 0; f < floors; f++) {
    const y0 = LH - (f + 1) * fh - 20;
    ctx.fillStyle = pal[1]; ctx.fillRect(0, y0 - 6, LW, 16);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, y0 + 10, LW, 4);
    const nWin = Math.max(2, Math.round(wM / 2.3));
    const ww = (LW - 30) / nWin - 22;
    for (let i = 0; i < nWin; i++) {
      const wx = 22 + i * (ww + 22), wy = y0 + 46, wh = fh * 0.5;
      ctx.fillStyle = '#5a5f66'; ctx.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
      const lit = r() < 0.55, warm = r() < 0.7;
      ctx.fillStyle = linGrad(ctx, wx, wy, wx + ww, wy + wh, [[0, '#2d3c4c'], [1, '#556a7e']]);
      ctx.fillRect(wx, wy, ww, wh);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx + ww * 0.4, wy); ctx.lineTo(wx + ww * 0.55, wy); ctx.lineTo(wx + ww * 0.15, wy + wh); ctx.fill();
      if (r() < 0.5) { ctx.fillStyle = ['#cc9988', '#99bbcc', '#ccbb99', '#aa9999', '#88aabb'][Math.floor(r() * 5)] + 'cc'; ctx.fillRect(wx, wy, ww * (0.3 + r() * 0.4), wh); }
      ctx.fillStyle = '#9aa0a6'; ctx.fillRect(wx + ww / 2 - 2, wy, 4, wh);
      if (lit) { emx.fillStyle = warm ? '#ffcf8a' : '#cfe8ff'; emx.globalAlpha = 0.5 + r() * 0.5; emx.fillRect(wx, wy, ww, wh); emx.globalAlpha = 1; }
      ctx.strokeStyle = r() < 0.5 ? '#2a2c2f' : '#7d2b22'; ctx.lineWidth = 2.5;   // security grille (เหล็กดัด)
      const gn = 7;
      for (let g = 0; g <= gn; g++) { ctx.beginPath(); ctx.moveTo(wx + (ww / gn) * g, wy - 2); ctx.lineTo(wx + (ww / gn) * g, wy + wh + 2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(wx - 3, wy + wh * 0.5); ctx.lineTo(wx + ww + 3, wy + wh * 0.5); ctx.stroke();
      if (r() < 0.6) {                                                        // AC condenser
        const ax = wx + ww * 0.1, ay = wy + wh + 14;
        ctx.fillStyle = '#c9ccce'; ctx.fillRect(ax, ay, ww * 0.6, 34);
        ctx.fillStyle = '#7b7f83'; ctx.beginPath(); ctx.arc(ax + ww * 0.2, ay + 17, 12, 0, 6.3); ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
        for (let k = -8; k <= 8; k += 4) { ctx.beginPath(); ctx.moveTo(ax + ww * 0.2 - 10, ay + 17 + k); ctx.lineTo(ax + ww * 0.2 + 10, ay + 17 + k); ctx.stroke(); }
        ctx.fillStyle = 'rgba(60,40,20,.3)'; ctx.fillRect(ax + ww * 0.62, ay + 34, 3, 36);
      }
    }
    if (r() < 0.45) {                                                          // laundry line
      const ly = y0 + fh * 0.86; ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(8, ly); ctx.lineTo(LW - 8, ly + 5); ctx.stroke();
      let lx = 30;
      while (lx < LW - 40) { ctx.fillStyle = ['#ee3333', '#3399cc', '#ffcc33', '#ffffff', '#66bb66', '#ff77aa'][Math.floor(r() * 6)]; ctx.fillRect(lx, ly + 3, 14 + r() * 12, 22 + r() * 14); lx += 30 + r() * 22; }
    }
  }
  ctx.fillStyle = pal[1]; ctx.fillRect(0, 0, LW, 26);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 26, LW, 4);
}

// Cached { map, emissive } for a shophouse upper facade (seed, width in m, floors, px per metre).
const upperCache = new Map();
export function shophouseUpper(seed, wM = 5.2, floors = 3, px = 72) {
  wM = Math.max(3.5, Math.round(wM * 2) / 2);
  const key = `${seed}|${floors}|${wM}|${px}`;
  if (upperCache.has(key)) return upperCache.get(key);
  const LW = wM * 96, LH = floors * 3.1 * 96 + 40, sc = px / 96;
  const a = makeCanvas(LW * sc, LH * sc), b = makeCanvas(LW * sc, LH * sc);
  a.ctx.scale(sc, sc); b.ctx.scale(sc, sc);
  drawUpper(a.ctx, b.ctx, rng(seed * 977 + 13), PALETTES[seed % PALETTES.length], LW, LH, floors, wM);
  const res = { map: canvasTex(a.canvas, { wrap: false, aniso: 8 }), emissive: canvasTex(b.canvas, { wrap: false, aniso: 4 }), height: LH / 96 };
  upperCache.set(key, res);
  return res;
}

// A wide repeating strip of many shophouses (ground floor shutters + upper floors) for the distant street rows.
export function rowTexture(seed, px = 40) {
  const LW = 4 * 5.2 * 96, floors = 4, LH = (3.6 + floors * 3.1) * 96, sc = px / 96;
  const a = makeCanvas(LW * sc, LH * sc), b = makeCanvas(LW * sc, LH * sc);
  a.ctx.scale(sc, sc); b.ctx.scale(sc, sc);
  const r = rng(seed);
  const bw = LW / 4, uh = LH - 3.6 * 96;
  for (let i = 0; i < 4; i++) {
    a.ctx.save(); b.ctx.save();
    a.ctx.translate(i * bw, 0); b.ctx.translate(i * bw, 0);
    a.ctx.beginPath(); a.ctx.rect(0, 0, bw, uh); a.ctx.clip();
    b.ctx.beginPath(); b.ctx.rect(0, 0, bw, uh); b.ctx.clip();
    drawUpper(a.ctx, b.ctx, r, PALETTES[(seed + i * 3) % PALETTES.length], bw, uh, floors, 5.2);
    a.ctx.restore(); b.ctx.restore();
    const gy = uh;
    a.ctx.fillStyle = '#cfc7b4'; a.ctx.fillRect(i * bw, gy, bw, 3.6 * 96);
    a.ctx.fillStyle = ['#9fa6ab', '#c2b8a3', '#8c9aa5', '#a8b39c'][(seed + i) % 4]; a.ctx.fillRect(i * bw + 30, gy + 80, bw - 60, 3.6 * 96 - 90);
    a.ctx.fillStyle = 'rgba(0,0,0,.15)';
    for (let y = gy + 90; y < LH; y += 10) a.ctx.fillRect(i * bw + 30, y, bw - 60, 2);
    const sc2 = ['#c8322a', '#1e9d55', '#d4791c', '#1d4d91', '#5b2a86', '#e3a21a'][(i + seed) % 6];
    a.ctx.fillStyle = sc2; a.ctx.fillRect(i * bw + 40, gy + 14, bw - 80, 60);
    a.ctx.fillStyle = 'rgba(255,255,255,.7)'; a.ctx.fillRect(i * bw + 60, gy + 30, (bw - 120) * (0.4 + r() * 0.5), 12);
    b.ctx.fillStyle = '#000'; b.ctx.fillRect(i * bw, gy, bw, 3.6 * 96);
    b.ctx.fillStyle = sc2; b.ctx.globalAlpha = 0.85; b.ctx.fillRect(i * bw + 40, gy + 14, bw - 80, 60); b.ctx.globalAlpha = 1;
  }
  return { map: canvasTex(a.canvas, { wrap: true, aniso: 4 }), emissive: canvasTex(b.canvas, { wrap: true, aniso: 2 }), width: 4 * 5.2, height: LH / 96 };
}

// Neighbouring shop names (Thai, with English translation)
export const SHOP_NAMES = [
  { th: 'ร้านขายยา', en: 'Pharmacy', col: '#1e9d55', fg: '#ffffff', sub: { th: 'เภสัชกรประจำร้าน', en: 'Pharmacist on duty' } },
  { th: 'ข้าวแกง ตามสั่ง', en: 'Curry & Rice · Made to Order', col: '#c8322a', fg: '#fff5d0', sub: { th: 'อาหารตามสั่ง อร่อยทุกวัน', en: 'Fresh dishes cooked to order' } },
  { th: 'นวดแผนไทย', en: 'Thai Massage', col: '#5b2a86', fg: '#ffe9a6', sub: { th: 'นวดเท้า • นวดตัว • อโรม่า', en: 'Foot • Body • Aroma' } },
  { th: 'ซ่อมมอเตอร์ไซค์', en: 'Motorbike Repair', col: '#1d4d91', fg: '#ffffff', sub: { th: 'เปลี่ยนยาง เปลี่ยนน้ำมันเครื่อง', en: 'Tyres & oil change' } },
  { th: 'ร้านตัดผมชาย', en: 'Barber Shop', col: '#25272b', fg: '#f2c14e', sub: { th: 'สกินเฮด • ทรงนักเรียน', en: 'Skin fade • School cuts' } },
  { th: 'ก๋วยเตี๋ยวเรือ', en: 'Boat Noodles', col: '#d4791c', fg: '#ffffff', sub: { th: 'เส้นเล็ก เส้นใหญ่ บะหมี่', en: 'Thin • wide • egg noodles' } },
  { th: 'ซักอบรีด', en: 'Laundry Service', col: '#1994b8', fg: '#ffffff', sub: { th: 'รับด่วน 24 ชม.', en: 'Express 24 hrs' } },
  { th: 'กาแฟสด', en: 'Fresh Coffee', col: '#5a3a26', fg: '#ffe3b8', sub: { th: 'ชาไทย • โกโก้ • ปั่น', en: 'Thai tea • Cocoa • Frappé' } },
  { th: 'โฮสเทล', en: 'Hostel', col: '#e3a21a', fg: '#2b2b2b', sub: { th: 'ห้องพักรายวัน WiFi ฟรี', en: 'Daily rooms · Free WiFi' } },
  { th: 'ร้านทอง', en: 'Gold Shop', col: '#8f1d21', fg: '#ffd86a', sub: { th: 'ซื้อ-ขาย-แลกเปลี่ยน', en: 'Buy · Sell · Exchange' } },
];

const signCache = new Map();
// A shop-name signboard as a localised texture (w x h metres)
export function shopSign(idx, wM = 4.6, hM = 0.95) {
  const key = `${idx % SHOP_NAMES.length}|${wM.toFixed(1)}`;
  if (signCache.has(key)) return signCache.get(key);
  const s = SHOP_NAMES[idx % SHOP_NAMES.length];
  const lt = new LTex(Math.round(wM * 150), Math.round(hM * 150), (ctx, W, H) => {
    ctx.fillStyle = s.col; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, 0, W, H * 0.45);
    ctx.strokeStyle = s.fg; ctx.lineWidth = 4; ctx.strokeRect(8, 8, W - 16, H - 16);
    langText(ctx, { th: s.th, en: s.en }, 20, 12, W - 40, H * 0.66, { family: idx % 2 ? 'mitr' : 'kanit', weight: 700, size: H * 0.6, color: s.fg, lines: 1, shadow: ['rgba(0,0,0,.4)', 0, 2, 3] });
    langText(ctx, s.sub, 20, H * 0.7, W - 40, H * 0.24, { family: 'sarabun', weight: 700, size: H * 0.2, color: s.fg, lines: 1 });
  });
  signCache.set(key, lt);
  return lt;
}

// Neon signs on the far side of the street (emissive look)
export function neonSign(kind = 'massage', wM = 2.4, hM = 0.9) {
  return new LTex(Math.round(wM * 160), Math.round(hM * 160), (ctx, W, H) => {
    ctx.fillStyle = '#0b0b10'; ctx.fillRect(0, 0, W, H);
    const col = kind === 'massage' ? '#ff4fa8' : kind === 'open' ? '#38f0ff' : '#ffd23f';
    ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.strokeStyle = col; ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, W - 24, H - 24);
    ctx.shadowBlur = 14;
    const txt = kind === 'massage' ? { th: 'นวดแผนไทย', en: 'THAI MASSAGE' } : kind === 'open' ? { th: 'เปิดทุกวัน', en: 'OPEN DAILY' } : { th: 'ข้าวมันไก่', en: 'CHICKEN RICE' };
    langText(ctx, txt, 22, 18, W - 44, H - 36, { family: 'pattaya', weight: 400, size: H * 0.6, color: col, lines: 1 });
    ctx.shadowBlur = 0;
  });
}

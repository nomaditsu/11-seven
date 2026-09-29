import { FONTS } from './draw.js';

export const BRAND = { orange: '#f58220', green: '#00874a', red: '#e31e24', darkGreen: '#00602f', cream: '#fff7e6' };

// The 11 SEVEN badge, modelled on the classic 7-Eleven shield: a white badge (wide at the top, tapering down),
// two leaning "1"s built like the 7 (orange flag + red stem) and a green SEVEN crossing both, cut out with a white keyline.
// Design grid is 200 x 200 units, shared with logoSvg() in src/ui/icons.js. Keep the two in step.
export const LOGO_W = 200, LOGO_H = 200;
export const BADGE_PATH = 'M31 14H169Q183 14 182 28L172 172Q171 186 157 186H43Q29 186 28 172L18 28Q17 14 31 14Z';
export const ONE_FLAG = 'M-8 22L22 0L22 27L-8 49Z';
export const ONE_STEM = 'M26 0H51L43.5 132H14.5Z';
export const ONES_AT = [[52, 34], [106, 34]];        // the 11 spans y 34-166, centred in the badge (y 14-186)
let P = null;                                        // Path2D built on first use (this module is also imported under Node)
const paths = () => P || (P = { badge: new Path2D(BADGE_PATH), flag: new Path2D(ONE_FLAG), stem: new Path2D(ONE_STEM) });

// Draws the badge with its top-left at (x, y), height h. Returns total width (the mark is square).
// o.square: sit the badge on the green square (default true); o.radius: corner radius of that square, in grid units.
export function drawLogo(ctx, x, y, h, o = {}) {
  const { square = true, radius = 0, shadow = false, textColor = BRAND.green } = o;
  const k = h / LOGO_H, p = paths();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(3, 5, 200, 200, radius) : ctx.rect(3, 5, 200, 200); ctx.fill(); }
  if (square) {
    ctx.fillStyle = BRAND.green; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 0, 200, 200, radius) : ctx.rect(0, 0, 200, 200); ctx.fill();
    ctx.translate(14, 14); ctx.scale(0.86, 0.86);
  }
  ctx.fillStyle = '#fff'; ctx.fill(p.badge);
  for (const [dx, dy] of ONES_AT) {
    ctx.save(); ctx.translate(dx, dy);
    ctx.fillStyle = BRAND.orange; ctx.fill(p.flag);
    ctx.fillStyle = BRAND.red; ctx.fill(p.stem);
    ctx.restore();
  }
  const word = 'SEVEN', fs = 42, target = 134;
  ctx.font = `400 ${fs}px "${FONTS.archivo}","Archivo Black","Kanit",sans-serif`;
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
  const nat = ctx.measureText(word).width || target;
  ctx.translate(100, 131); ctx.scale(target / nat, 1);
  ctx.lineJoin = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; ctx.strokeText(word, 0, 0);
  ctx.fillStyle = textColor; ctx.fillText(word, 0, 0);
  ctx.restore();
  return LOGO_W * k;
}

// The three signature stripes (orange / green / red), used on fascias, counters and shelf bands.
export function drawStripes(ctx, x, y, w, h, vertical = false) {
  const cols = [BRAND.orange, BRAND.green, BRAND.red];
  cols.forEach((c, i) => {
    ctx.fillStyle = c;
    if (vertical) ctx.fillRect(x + (w / 3) * i, y, w / 3 + 0.5, h);
    else ctx.fillRect(x, y + (h / 3) * i, w, h / 3 + 0.5);
  });
}

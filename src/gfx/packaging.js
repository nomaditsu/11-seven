// Paints a full texture atlas for one SKU, and manages the per-SKU localised textures.
import { GEO, atlasFor } from '../data/shapes.js';
import { LTex } from './localized.js';
import { clamp } from '../core/util.js';
import * as P from './pack_styles.js';
import { drawIllus } from './illus.js';

const TRAY_STYLES = new Set(['meal', 'sandwich', 'onigiri', 'salad', 'fruit', 'dessertbox']);
const CARD_STYLES = new Set(['card', 'stick', 'lighter']);

function cell(ctx, c, fn) {
  const [x, y, w, h] = c;
  ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); fn(w, h); ctx.restore();
}

export function paintSku(ctx, sku, pxPerCm) {
  const geo = GEO[sku.g];
  const atlas = atlasFor(geo);
  ctx.save();
  ctx.scale(pxPerCm, pxPerCm);
  const c = atlas.cells;
  ctx.fillStyle = sku.pal[1]; ctx.fillRect(0, 0, atlas.W, atlas.H);
  if (geo.kind === 'wrap') {
    P.wrapPaint(ctx, c.wrap[2], c.wrap[3], sku, geo);
  } else if (geo.kind === 'bag') {
    cell(ctx, c.front, (w, h) => P.bagFront(ctx, w, h, sku));
    cell(ctx, c.back, (w, h) => P.bagBack(ctx, w, h, sku));
  } else if (geo.kind === 'gable') {
    cell(ctx, c.front, (w, h) => P.gableFront(ctx, w, h, sku));
    cell(ctx, c.back, (w, h) => P.boxBack(ctx, w, h, sku));
    cell(ctx, c.left, (w, h) => P.gableSide(ctx, w, h, sku));
    cell(ctx, c.right, (w, h) => P.gableSide(ctx, w, h, sku));
    cell(ctx, c.top, (w, h) => P.gableTop(ctx, w, h, sku));
  } else if (TRAY_STYLES.has(sku.style)) {
    cell(ctx, c.top, (w, h) => P.trayTop(ctx, w, h, sku));
    cell(ctx, c.front, (w, h) => P.trayFront(ctx, w, h, sku));
    cell(ctx, c.back, (w, h) => P.trayBack(ctx, w, h, sku));
    cell(ctx, c.left, (w, h) => P.traySide(ctx, w, h, sku));
    cell(ctx, c.right, (w, h) => P.traySide(ctx, w, h, sku));
    cell(ctx, c.bottom, (w, h) => { ctx.fillStyle = '#18181a'; ctx.fillRect(0, 0, w, h); });
  } else if (CARD_STYLES.has(sku.style)) {
    cell(ctx, c.front, (w, h) => P.cardFront(ctx, w, h, sku));
    cell(ctx, c.back, (w, h) => P.boxBack(ctx, w, h, sku));
    for (const k of ['left', 'right', 'top', 'bottom']) cell(ctx, c[k], (w, h) => { ctx.fillStyle = sku.pal[1]; ctx.fillRect(0, 0, w, h); });
  } else {
    cell(ctx, c.front, (w, h) => P.boxFront(ctx, w, h, sku));
    cell(ctx, c.back, (w, h) => P.boxBack(ctx, w, h, sku));
    cell(ctx, c.left, (w, h) => P.boxSide(ctx, w, h, sku));
    cell(ctx, c.right, (w, h) => P.boxSide(ctx, w, h, sku));
    cell(ctx, c.top, (w, h) => P.boxTop(ctx, w, h, sku));
    cell(ctx, c.bottom, (w, h) => { ctx.fillStyle = sku.pal[1]; ctx.fillRect(0, 0, w, h); });
  }
  ctx.restore();
}

export function atlasPixels(sku, pxPerCm) {
  const a = atlasFor(GEO[sku.g]);
  return [Math.max(16, Math.round(a.W * pxPerCm)), Math.max(16, Math.round(a.H * pxPerCm))];
}

// Shelf-quality localised texture for a SKU (redrawn on language change).
export function makeSkuTexture(sku, pxPerCm = 9) {
  const [w, h] = atlasPixels(sku, pxPerCm);
  const s = w / atlasFor(GEO[sku.g]).W;
  const lt = new LTex(w, h, (ctx) => paintSku(ctx, sku, s), { wrap: true, aniso: 4 });
  return lt;
}

// One-off high-resolution render used when inspecting an item up close.
export function makeInspectTexture(sku, maxPx = 2048) {
  const a = atlasFor(GEO[sku.g]);
  const pxPerCm = clamp(Math.min(maxPx / a.W, maxPx / a.H), 12, 44);
  const [w, h] = atlasPixels(sku, pxPerCm);
  const s = w / a.W;
  const lt = new LTex(w, h, (ctx) => paintSku(ctx, sku, s), { wrap: true, aniso: 16 });
  return lt;
}

// Flat front-face preview for the codex (a canvas, not a GPU texture)
export function paintFrontPreview(canvas, sku, targetH = 180) {
  const geo = GEO[sku.g], a = atlasFor(geo);
  let fw, fh, sx = 0, sy = 0;
  if (geo.kind === 'wrap') { fh = geo.dims[1]; fw = Math.min(a.W, geo.dims[0] * 1.45); sx = a.W / 2 - fw / 2; }
  else if (TRAY_STYLES.has(sku.style)) { fw = a.cells.top[2]; fh = a.cells.top[3]; sx = a.cells.top[0]; sy = a.cells.top[1]; }
  else { fw = a.cells.front[2]; fh = a.cells.front[3]; sx = a.cells.front[0]; sy = a.cells.front[1]; }
  const s = targetH / fh;
  const full = document.createElement('canvas');
  full.width = Math.ceil(a.W * s); full.height = Math.ceil(a.H * s);
  paintSku(full.getContext('2d'), sku, s);
  canvas.width = Math.ceil(fw * s); canvas.height = Math.ceil(fh * s);
  canvas.getContext('2d').drawImage(full, sx * s, sy * s, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
}

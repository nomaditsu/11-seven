// Developer tool: ?sheet[=cat,cat|id,id]&face=front|atlas  renders a contact sheet of packaging art (no 3D).
import { SKUS, CATS } from './data/skus.js';
import { paintSku, atlasPixels, paintFrontPreview } from './gfx/packaging.js';
import { GEO, atlasFor } from './data/shapes.js';
import { lang } from './core/i18n.js';
import { pick } from './core/i18n.js';

export function showSheet(params) {
  const filter = (params.get('sheet') || '').split(',').filter(Boolean);
  const face = params.get('face') || 'front';
  const list = SKUS.filter((s) => !filter.length || filter.includes(s.cat) || filter.includes(s.id) || filter.some((f) => s.id.startsWith(f + '-')));
  document.body.style.overflow = 'auto';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;left:0;top:0;background:#2a2d33;padding:14px;display:flex;flex-wrap:wrap;gap:14px;font:12px Sarabun,sans-serif;color:#ddd;width:' + (params.get('w') || 1600) + 'px';
  document.getElementById('app').style.position = 'static';
  document.getElementById('gl').style.display = 'none';
  document.body.appendChild(wrap);
  document.body.style.height = 'auto';
  for (const sku of list) {
    const box = document.createElement('div');
    box.style.cssText = 'text-align:center;width:auto';
    const c = document.createElement('canvas');
    if (face === 'atlas') {
      const a = atlasFor(GEO[sku.g]);
      const s = +(params.get('px') || 16);
      c.width = Math.ceil(a.W * s); c.height = Math.ceil(a.H * s);
      paintSku(c.getContext('2d'), sku, s);
    } else paintFrontPreview(c, sku, +(params.get('px') || 320));
    c.style.background = '#111';
    box.appendChild(c);
    const lab = document.createElement('div');
    lab.textContent = `${sku.id} · ${pick(sku.name)} · ฿${sku.price}`;
    box.appendChild(lab);
    wrap.appendChild(box);
  }
  window.__ready = true;
}

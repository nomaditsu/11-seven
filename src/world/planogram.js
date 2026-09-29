// Planogram engine: fills shelf descriptors with SKUs (facings across, several units deep), like a real merchandiser.
import * as THREE from 'three';
import { itemSize } from './products.js';
import { rng, hashStr, clamp } from '../core/util.js';

const GAP = 0.006;

/**
 * shelf: { tag, x, z (left-front corner), y (shelf top), dx, dz (unit vector left->right as the customer sees it),
 *          ox, oz (unit vector out towards the customer), len, dep, clear, hang?, lean? }
 * skus: ordered SKU list for this pool.
 * Returns { placed: Set(sku.id), skipped: [sku] }.
 */
export function fillShelves(pw, tags, skus, shelves, opts = {}) {
  const maxRows = opts.rows ?? pw.quality.rows ?? 2;
  const placedIds = new Set();
  const perShelf = shelves.map(() => []);           // [{ sku, n }]
  const used = shelves.map(() => 0);
  const sizes = new Map(skus.map((s) => [s.id, itemSize(s)]));
  const skipped = [];
  const fillFrac = opts.fill ?? 0.985;
  const cap = shelves.reduce((a, sh) => a + sh.len * fillFrac, 0);
  const wOf = (s) => sizes.get(s.id).w + GAP;
  const fitsShelf = (sku, sh) => sh.hang || sizes.get(sku.id).h <= sh.clear;

  // Sequence of products to lay out. With few SKUs for the shelf space the list repeats (a merchandiser would face
  // the best sellers several times), so every shelf shows a varied block rather than one shelf being full and the rest bare.
  const oneEach = skus.reduce((a, s) => a + wOf(s), 0);
  const cycles = oneEach < cap ? clamp(Math.round((cap * 0.8) / oneEach), 1, opts.maxCycles ?? 6) : 1;
  const seq = [];
  for (let c = 0; c < cycles; c++) for (const sku of skus) if (c === 0 || (sku.pop || 1) >= 2 || c % 2 === 0) seq.push({ sku, first: c === 0 });
  const seqW = seq.reduce((a, e) => a + wOf(e.sku), 0);
  const spread = Math.min(1, seqW / cap);                       // share of each shelf the sequence should use
  const target = shelves.map((sh) => sh.len * fillFrac * spread);
  let k0 = 0;
  const place = (sku, sh, k) => {
    const list = perShelf[k], last = list[list.length - 1];
    if (last && last.sku === sku) last.n++; else list.push({ sku, n: 1 });
    used[k] += wOf(sku);
  };
  for (const it of seq) {
    const sku = it.sku, w = wOf(sku);
    while (k0 < shelves.length - 1 && used[k0] + w > target[k0] + 1e-6 && !shelves[k0].hang) k0++;
    let done = false;
    for (let k = k0; k < shelves.length && !done; k++) {
      const sh = shelves[k];
      if (!fitsShelf(sku, sh) || used[k] + w > sh.len * fillFrac + 1e-6) continue;
      place(sku, sh, k); done = true;
    }
    if (!done && it.first) {                                       // could not follow the sequence: use any shelf with room and clearance
      for (let k = 0; k < shelves.length && !done; k++) {
        const sh = shelves[k];
        if (!fitsShelf(sku, sh) || used[k] + w > sh.len * fillFrac + 1e-6) continue;
        place(sku, sh, k); done = true;
      }
    }
    if (done) placedIds.add(sku.id); else if (it.first) skipped.push(sku);
  }
  // top up leftover gaps with extra facings of popular products already on that shelf
  shelves.forEach((sh, k) => {
    const list = perShelf[k];
    if (!list.length) return;
    const order = [...list].sort((a, b) => (b.sku.pop || 1) - (a.sku.pop || 1));
    let guard = 0;
    while (guard++ < 60) {
      let grew = false;
      for (const e of order) {
        const w = wOf(e.sku);
        if (used[k] + w <= sh.len * fillFrac && e.n < (opts.maxFacings ?? 5) + 3 * ((e.sku.pop || 1) - 1) + 5) { e.n++; used[k] += w; grew = true; }
      }
      if (!grew) break;
    }
  });
  // placement
  shelves.forEach((sh, k) => {
    const list = perShelf[k];
    if (!list.length) return;
    // centre the block if it doesn't fill the shelf and opts.center
    let off = opts.center ? Math.max(0, (sh.len - used[k]) / 2) : 0;
    for (const e of list) {
      const sz = sizes.get(e.sku.id);
      const r = rng(hashStr(e.sku.id + sh.tag));
      const rotBase = Math.atan2(sh.ox, sh.oz);
      const rows = sh.hang ? 1 : clamp(Math.floor((sh.dep - 0.012) / (sz.d + GAP)), 1, sz.h > 0.2 ? Math.min(2, maxRows) : maxRows);
      const startOff = off;
      for (let f = 0; f < e.n; f++) {
        const cxo = off + sz.w / 2;
        for (let row = 0; row < rows; row++) {
          const back = 0.012 + sz.d / 2 + row * (sz.d + GAP * 0.7);
          // position: along dx from the left corner, backwards (away from the customer) by `back`
          const x = sh.x + sh.dx * cxo - sh.ox * back + (r() - 0.5) * 0.004;
          const z = sh.z + sh.dz * cxo - sh.oz * back + (r() - 0.5) * 0.004;
          const geoBag = sku_isBag(e.sku);
          if (sh.hang) {
            const strip = e.sku.strip || 1;
            for (let sIdx = 0; sIdx < strip; sIdx++) {
              const yy = sh.y - sz.h * (sIdx + 1) - 0.01;
              const slot = pw.add(e.sku, x, yy, z, rotBase + (r() - 0.5) * 0.06, { tag: sh.tag, tint: 1 });
              slot.hang = true;
            }
          } else {
            const slot = pw.add(e.sku, x, sh.y + 0.002, z, rotBase + (r() - 0.5) * (row === 0 ? 0.05 : 0.12), { tag: sh.tag, tint: row === 0 ? (sh.tint ?? 1) : (sh.tint ?? 1) * 0.86 });
            slot.lean = (sh.lean ?? 0) + (geoBag ? 0.09 + r() * 0.05 : 0) + (r() - 0.5) * 0.02;
          }
        }
        off += sz.w + GAP;
      }
      // price tag under the first facing of this SKU
      if (tags && !sh.noTag) {
        const nrm = new THREE.Vector3(sh.ox, 0, sh.oz), dirX = new THREE.Vector3(sh.dx, 0, sh.dz);
        const tx = sh.x + sh.dx * startOff + sh.ox * 0.012, tz = sh.z + sh.dz * startOff + sh.oz * 0.012;
        tags.add(e.sku, tx, sh.y - 0.036, tz, dirX, nrm);
      }
    }
  });
  const total = shelves.reduce((a, sh) => a + sh.len, 0);
  return { placed: placedIds, skipped, fill: total ? used.reduce((a, u) => a + u, 0) / total : 0 };
}

function sku_isBag(sku) { return sku.g && sku.g.startsWith('bag'); }

// Convenience: build evenly spaced shelf descriptors for a fixture side.
export function shelfRow({ tag, x, z, dx, dz, ox, oz, len, dep, ys, clearTop = 0.36, lean = 0, tint = 1, hang = false, noTag = false }) {
  return ys.map((y, i) => ({
    tag: `${tag}${i}`, x, z, y, dx, dz, ox, oz, len, dep,
    clear: (i < ys.length - 1 ? ys[i + 1] - y - 0.035 : clearTop), lean, tint: tint * (0.9 + 0.1 * (i / Math.max(1, ys.length - 1))), hang, noTag,
  }));
}

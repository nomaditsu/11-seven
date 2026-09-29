// Which SKUs go on which fixtures. A "pool" is an ordered list of SKUs merchandised on a group of shelves.
import { CATS } from './skus.js';

// pool -> predicate on sku. Default: pool name equals sku.pool ?? sku.cat
export function poolOf(sku) { return sku.pool ?? CATS[sku.cat]?.pool ?? sku.cat; }

// extra pools that reuse other categories' SKUs (endcaps, promo island, impulse racks)
const NOT_AMBIENT = new Set(['meal', 'sandwich', 'frozen', 'hot', 'dessert', 'icecream', 'beer', 'spirits', 'dairy', 'coffee', 'tea', 'juice']);
export const EXTRA = {
  promo:  (s) => !!s.promo && !NOT_AMBIENT.has(s.cat),
  impulse: (s) => !!s.impulse,
  bakery: (s) => s.cat === 'bakery',
};

export function selectPool(name, skus) {
  const ex = EXTRA[name];
  if (ex) return skus.filter(ex);
  return skus.filter((s) => poolOf(s) === name);
}

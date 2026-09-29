// Runtime shopping state (what you hold / have bought) shared by UI, interaction and checkout.
import { save, markDirty } from '../core/settings.js';
import { SKU_BY_ID } from '../data/skus.js';

export const S = {
  hasBasket: false,
  items: [],         // [{ sku, qty, heated, slot? }]  what is in your hands / basket
  taken: [],         // stack of slots taken from shelves (for "put back")
  bag: [],           // purchased [{ sku, qty, heated }]
  activeQuest: null, // quest id
  questGot: [],      // goal indices satisfied
  totalBought: 0,
  lastPurchaseHour: 0,
};

export const HANDS_MAX = 5, BASKET_MAX = 30;
export const capacity = () => (S.hasBasket ? BASKET_MAX : HANDS_MAX);
export const count = () => S.items.reduce((a, i) => a + i.qty, 0);
export const subtotal = () => S.items.reduce((a, i) => a + i.qty * i.sku.price, 0);

export function addItem(sku, slot) {
  let e = S.items.find((i) => i.sku === sku);
  if (!e) { e = { sku, qty: 0, heated: 0 }; S.items.push(e); }
  e.qty++;
  if (slot) S.taken.push(slot);
}
export function removeOne(sku) {
  const e = S.items.find((i) => i.sku === sku);
  if (!e) return false;
  e.qty--;
  if (e.heated > e.qty) e.heated = e.qty;
  if (e.qty <= 0) S.items.splice(S.items.indexOf(e), 1);
  return true;
}
export function isDiscovered(id) { return save.discovered.includes(id); }
export function discover(id) {
  if (save.discovered.includes(id)) return false;
  save.discovered.push(id); markDirty(); return true;
}
export const discoveredCount = () => save.discovered.filter((id) => SKU_BY_ID.has(id)).length;
export function grantAch(id) {
  if (save.achievements.includes(id)) return false;
  save.achievements.push(id); markDirty(); return true;
}

// Alcohol may only be sold 11:00–14:00 and 17:00–24:00 (Thai law)
export function alcoholAllowed(hour) { return (hour >= 11 && hour < 14) || (hour >= 17 && hour < 24); }
export function fmtClock(h) {
  const hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

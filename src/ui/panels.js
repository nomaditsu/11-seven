// Codex, shopping-list quests, basket/bag and the item-inspect info card.
import { G } from '../core/state.js';
import { both, lang, t, tp, t2, pick, pick2, other, dual } from '../core/i18n.js';
import { save, markDirty, settings } from '../core/settings.js';
import { ui, elements as el, esc, $, toast } from './ui.js';
import { SKUS, SKU_BY_ID, CATS } from '../data/skus.js';
import { BRANDS } from '../data/brands.js';
import { ING, ALLERGEN } from '../data/ingredients.js';
import { QUESTS } from '../data/quests.js';
import { ZONES } from '../world/layout.js';
import { ORIGIN_NAME } from '../gfx/pack_common.js';
import { paintFrontPreview } from '../gfx/packaging.js';
import { S, isDiscovered, discoveredCount, subtotal, count, capacity, HANDS_MAX, BASKET_MAX } from '../game/session.js';

const thumbs = new Map();
const thumbQueue = [];
let thumbBusy = false;

function thumbCanvas(sku, h = 120) {
  const c = document.createElement('canvas');
  const key = sku.id + '|' + lang.mode + '|' + h;
  const cached = thumbs.get(key);
  if (cached) { c.width = cached.width; c.height = cached.height; c.getContext('2d').drawImage(cached, 0, 0); return c; }
  thumbQueue.push({ c, sku, h, key });
  if (!thumbBusy) { thumbBusy = true; setTimeout(pumpThumbs, 0); }
  return c;
}
function pumpThumbs() {
  const t0 = performance.now();
  while (thumbQueue.length && performance.now() - t0 < 10) {
    const { c, sku, h, key } = thumbQueue.shift();
    try {
      paintFrontPreview(c, sku, h);
      const copy = document.createElement('canvas'); copy.width = c.width; copy.height = c.height; copy.getContext('2d').drawImage(c, 0, 0);
      thumbs.set(key, copy);
    } catch (e) { /* ignore */ }
  }
  if (thumbQueue.length) setTimeout(pumpThumbs, 8); else thumbBusy = false;
}

export function whereIs(sku) {
  const pw = G.contents && G.contents.pw;
  const slots = pw ? pw.slotsOf(sku.id) : [];
  if (!slots.length) return both(CATS[sku.cat].name);
  const s = slots[0];
  for (const z of ZONES) if (z.id !== 'outside' && z.id !== 'entrance' && s.x >= z.x0 && s.x <= z.x1 && s.z >= z.z0 && s.z <= z.z1) return t(z.key);
  return both(CATS[sku.cat].name);
}

// ------------------------------------------------------------------------------------ inspect card
// o.owned: the item is already in your hands / basket (opened from the basket panel), so there is nothing to take.
export function fillInspect(sku, o = {}) {
  const B = BRANDS[sku.brand];
  el['ins-brand'].textContent = (B ? B.text : '') + (B && B.th && lang.mode !== 'en' ? '  ' + B.th : '');
  el['ins-name'].textContent = pick(sku.name);
  el['ins-second'].textContent = pick2(sku.name) || pick(sku.name, other(lang.code));
  el['ins-price'].textContent = '฿' + sku.price;
  el['ins-size'].textContent = sku.size ? pick(sku.size) + (lang.second ? ' · ' + pick2(sku.size) : '') : '';
  const tags = [`<span>${esc(both(CATS[sku.cat].name))}</span>`];
  if (sku.heat) tags.push(`<span>${esc(tp('card.heat'))}</span>`);
  if (sku.alcohol) tags.push(`<span class="warn">${esc(tp('card.alcohol'))}</span>`);
  if (sku.origin && sku.origin !== 'th') tags.push(`<span>${esc(pick(ORIGIN_NAME[sku.origin]))}</span>`);
  el['ins-tags'].innerHTML = tags.join('');
  const d = sku.desc ? pick(sku.desc) + (lang.second ? '\n' + pick2(sku.desc) : '') : '';
  el['ins-desc'].textContent = d; el['ins-desc'].style.whiteSpace = 'pre-line';
  const ing = (sku.ing || []).map((k) => (ING[k] ? pick(ING[k]) : k)).join(', ');
  const alg = (sku.allergens || []).map((k) => (ALLERGEN[k] ? pick(ALLERGEN[k]) : k)).join(', ');
  const rows = [];
  if (ing) rows.push([tp('card.ingredients'), ing]);
  if (alg) rows.push([tp('card.allergens'), alg]);
  rows.push([tp('card.where'), whereIs(sku)]);
  el['ins-dl'].innerHTML = rows.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('');
  const keys = o.owned ? [['I', tp('card.done')], ['Space', tp('card.flip')]]
    : [['T', tp('hud.take')], ['Space', tp('card.flip')], ['I', tp('card.leave')]];
  el['ins-keys'].innerHTML = keys.map(([k, l]) => `<span><kbd>${esc(k)}</kbd>${esc(l)}</span>`).join('');
}

// ------------------------------------------------------------------------------------ codex
const cdx = { cat: 'all', q: '', reveal: false, foundOnly: false, sel: null };
export function initPanels() {
  ui.refreshers.set('codex', renderCodex);
  ui.refreshers.set('quests', renderQuests);
  ui.refreshers.set('basket', renderBasket);
  $('codex-search').addEventListener('input', (e) => { cdx.q = e.target.value.trim().toLowerCase(); renderCodexGrid(); });
  $('codex-reveal').addEventListener('change', (e) => { cdx.reveal = e.target.checked; renderCodexGrid(); });
  $('codex-found').addEventListener('change', (e) => { cdx.foundOnly = e.target.checked; renderCodexGrid(); });
  document.querySelectorAll('#panel-basket .tab').forEach((b) => b.addEventListener('click', () => { basketTab = b.dataset.tab; document.querySelectorAll('#panel-basket .tab').forEach((x) => x.classList.toggle('on', x === b)); renderBasket(); }));
}

function renderCodex() {
  const n = discoveredCount(), total = SKUS.length;
  $('codex-count').textContent = t('codex.found', { a: n, b: total });
  $('codex-bar').style.width = (100 * n / Math.max(1, total)) + '%';
  const cats = new Map();
  for (const s of SKUS) cats.set(s.cat, (cats.get(s.cat) || 0) + 1);
  const chips = [`<button data-c="all" class="${cdx.cat === 'all' ? 'on' : ''}">${esc(tp('codex.all'))}</button>`];
  for (const [c] of cats) chips.push(`<button data-c="${c}" class="${cdx.cat === c ? 'on' : ''}">${esc(pick(CATS[c].name))}</button>`);
  const box = $('codex-cats');
  box.innerHTML = chips.join('');
  box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { cdx.cat = b.dataset.c; renderCodex(); }));
  renderCodexGrid();
}
function renderCodexGrid() {
  const grid = $('codex-grid'); grid.innerHTML = '';
  const list = SKUS.filter((s) => (cdx.cat === 'all' || s.cat === cdx.cat) && (!cdx.foundOnly || isDiscovered(s.id)) && (!cdx.q || (pick(s.name) + ' ' + pick(s.name, other(lang.code)) + ' ' + (BRANDS[s.brand]?.text || '') + ' ' + (BRANDS[s.brand]?.th || '')).toLowerCase().includes(cdx.q)));
  const frag = document.createDocumentFragment();
  for (const sku of list) {
    const found = isDiscovered(sku.id) || cdx.reveal;
    const d = document.createElement('div');
    d.className = 'cdx' + (found ? '' : ' lock');
    d.appendChild(thumbCanvas(sku, 110));
    const n = document.createElement('div'); n.className = 'n'; n.textContent = found ? pick(sku.name) : tp('codex.unknown');
    const p = document.createElement('div'); p.className = 'p'; p.textContent = found ? '฿' + sku.price : '';
    d.append(n, p);
    d.addEventListener('click', () => showCodexDetail(sku, found));
    frag.appendChild(d);
  }
  grid.appendChild(frag);
  if (!list.length && cdx.foundOnly) grid.innerHTML = `<div class="empty">${esc(tp('codex.noneFound'))}</div>`;
  $('codex-detail').hidden = true;
}
function showCodexDetail(sku, found) {
  const box = $('codex-detail');
  box.hidden = false;
  box.innerHTML = '';
  const c = thumbCanvas(sku, 150);
  if (!found) c.style.filter = 'brightness(0) opacity(.25)';
  const info = document.createElement('div');
  const B = BRANDS[sku.brand];
  info.innerHTML = found
    ? `<h3>${esc(pick(sku.name))} <small style="color:#888;font-weight:400">${esc(pick2(sku.name) || pick(sku.name, other(lang.code)))}</small></h3>
       <p><b style="color:var(--o);font-size:20px">฿${sku.price}</b> &nbsp; ${esc(sku.size ? pick(sku.size) : '')} &nbsp;·&nbsp; ${esc(B ? B.text : '')} &nbsp;·&nbsp; ${esc(both(CATS[sku.cat].name))}</p>
       <p>${esc(sku.desc ? pick(sku.desc) : '')}</p><p style="color:#777">${esc(tp('card.where'))}: ${esc(whereIs(sku))}</p>`
    : `<h3>${esc(tp('codex.unknown'))}</h3><p>${esc(tp('codex.undiscovered'))}</p>`;
  box.append(c, info);
}

// ------------------------------------------------------------------------------------ quests
function goalMet(g, ids) { return ids.some((id) => { const s = SKU_BY_ID.get(id); return s && ((g.cats && g.cats.includes(s.cat)) || (g.ids && g.ids.includes(id))); }); }
export function questProgress(boughtIds) {
  if (!S.activeQuest) return null;
  const q = QUESTS.find((x) => x.id === S.activeQuest);
  q.goals.forEach((g, i) => { if (!S.questGot.includes(i) && goalMet(g, boughtIds)) S.questGot.push(i); });
  if (S.questGot.length >= q.goals.length) return q;
  return null;
}
function renderQuests() {
  const b = $('quests-body');
  b.innerHTML = QUESTS.map((q) => {
    const active = S.activeQuest === q.id;
    const done = save.questsDone.includes(q.id);
    return `<div class="quest"><h3>${esc(pick(q.title))} ${done ? '✔' : ''}</h3><p>${esc(pick(q.desc))}</p>
      <ul>${q.goals.map((g, i) => `<li class="${active && S.questGot.includes(i) ? 'done' : ''}">${esc(pick(g.label))}</li>`).join('')}</ul>
      <p>${esc(t('quest.reward', { n: q.reward }))}</p>
      <button class="btn ${active ? '' : 'primary'}" data-q="${q.id}">${esc(active ? tp('quest.abandon') : tp('quest.start'))}</button></div>`;
  }).join('');
  b.querySelectorAll('button[data-q]').forEach((btn) => btn.addEventListener('click', () => {
    const id = btn.dataset.q;
    if (S.activeQuest === id) { S.activeQuest = null; S.questGot = []; } else { S.activeQuest = id; S.questGot = []; }
    if (ui.hooks.questChanged) ui.hooks.questChanged();
    renderQuests();
  }));
}

// ------------------------------------------------------------------------------------ basket
let basketTab = 'basket';
export function renderBasket() {
  const b = $('basket-body'), foot = $('basket-foot');
  if (basketTab === 'basket') {
    if (!S.items.length) b.innerHTML = `<div class="empty">${esc(tp('basket.empty'))}</div>`;
    else {
      b.innerHTML = '<div class="blist">' + S.items.map((e, i) => `<div class="bi" data-i="${i}"><span class="th"></span><div class="bn">${esc(pick(e.sku.name))}<small>${esc(pick2(e.sku.name) || pick(e.sku.name, other(lang.code)))}${e.heated ? ' · 🔥' : ''}</small></div><div><div class="bp">฿${e.sku.price * e.qty}</div><div class="qty">×${e.qty}</div></div><div class="bbtns"><button class="mini go" data-ins="${i}">${esc(tp('basket.inspect'))}</button><button class="mini" data-put="${i}">${esc(tp('basket.putBack'))}</button></div></div>`).join('') + '</div>';
      b.querySelectorAll('.bi').forEach((row, i) => row.querySelector('.th').replaceWith(thumbCanvas(S.items[i].sku, 44)));
      b.querySelectorAll('button[data-ins]').forEach((btn) => btn.addEventListener('click', () => { if (ui.hooks.inspectOwned) ui.hooks.inspectOwned(S.items[+btn.dataset.ins].sku); }));
      b.querySelectorAll('button[data-put]').forEach((btn) => btn.addEventListener('click', () => { if (ui.hooks.putBackItem) ui.hooks.putBackItem(S.items[+btn.dataset.put].sku); renderBasket(); }));
    }
    // no basket yet: remind them a basket carries far more (turns red once the hands are full)
    if (!S.hasBasket) {
      const v = { h: HANDS_MAX, b: BASKET_MAX }, sub = t2('basket.tip', v);
      b.insertAdjacentHTML('afterbegin', `<div class="btip${count() >= HANDS_MAX ? ' full' : ''}"><span class="ic">🧺</span><div>${esc(tp('basket.tip', v))}${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`);
    }
    foot.innerHTML = `<span style="margin-right:auto;color:#666;font-size:13px">${esc(t('basket.toCounter'))} · ${count()}/${capacity()}</span><b style="font-size:20px">${esc(tp('basket.subtotal'))}: ฿${subtotal()}</b>`;
  } else {
    if (!S.bag.length) b.innerHTML = `<div class="empty">${esc(tp('bag.empty'))}</div>`;
    else {
      b.innerHTML = '<div class="blist">' + S.bag.map((e, i) => `<div class="bi"><span class="th"></span><div class="bn">${esc(pick(e.sku.name))}<small>${esc(pick2(e.sku.name) || pick(e.sku.name, other(lang.code)))}${e.heated ? ' · 🔥' : ''}</small></div><div class="qty">×${e.qty}</div><button class="mini" data-eat="${i}">${esc(tp('basket.consume'))}</button></div>`).join('') + '</div>';
      b.querySelectorAll('.bi').forEach((row, i) => row.querySelector('.th').replaceWith(thumbCanvas(S.bag[i].sku, 44)));
      b.querySelectorAll('button[data-eat]').forEach((btn) => btn.addEventListener('click', () => {
        const e = S.bag[+btn.dataset.eat];
        toast(t('bag.enjoy', { name: pick(e.sku.name) }), 'good');
        e.qty--; if (e.qty <= 0) S.bag.splice(S.bag.indexOf(e), 1);
        if (ui.hooks.consumed) ui.hooks.consumed(e.sku);
        renderBasket();
      }));
    }
    foot.innerHTML = '';
  }
}
export function invalidateThumbs() { thumbs.clear(); thumbQueue.length = 0; }

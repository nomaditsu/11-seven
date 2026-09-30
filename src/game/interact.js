// Crosshair targeting, prompts, take / inspect / put back, machines (ATM, microwave, coffee…) and zone banners.
import * as THREE from 'three';
import { G } from '../core/state.js';
import { both, lang, t, tp, pick, pick2, other } from '../core/i18n.js';
import { PHRASES } from '../core/strings.js';
import { save, markDirty } from '../core/settings.js';
import { ui, toast, achievement, showPrompt, setCrosshair, showZone, say, updateObjective, $, esc } from '../ui/ui.js';
import { fillInspect } from '../ui/panels.js';
import { S, addItem, removeOne, count, capacity, discover, discoveredCount, grantAch, alcoholAllowed, isDiscovered } from './session.js';
import { sfx } from './audio.js';
import { CATS, SKUS, SKU_BY_ID } from '../data/skus.js';
import { ZONES } from '../world/layout.js';
import { consumeWheel, input } from '../input.js';
import { startCheckout } from './checkout.js';
import { startTalk } from './talk.js';
import { PEOPLE } from '../data/dialogue.js';

const REACH = 2.7;
const ray = new THREE.Raycaster();
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _inv = new THREE.Vector3();

export class Interaction {
  constructor({ camera, player, pw, ctx, hands, store, npcs }) {
    Object.assign(this, { camera, player, pw, ctx, hands, store, npcs });
    this.target = null;
    this.dwellSku = null; this.dwell = 0;
    this.insp = null;
    this.zone = null;
    this.restock = [];
    this.stoolBoxes = (ctx.stools || []).map((s) => ({ kind: 'stool', box: new THREE.Box3(new THREE.Vector3(s.x - 0.22, 0.55, s.z - 0.22), new THREE.Vector3(s.x + 0.22, 0.9, s.z + 0.22)), maxDist: 2.2 }));
    // No zone around the tills: you talk to (and pay) the cashier by aiming at her (her talk target, in npcs.js).
    // A till zone used to cover the counter and the impulse rack in front of it and hid their items.
    this.extra = [];
    this.dynamic = [];       // set by NPC module (dog, cashier)
    this.atmUses = save.atmUses || 0;
    this.cafeBusy = false;
  }

  // ------------------------------------------------------------------ targeting
  boxHit(box, o, d, maxT) {
    _inv.set(1 / (d.x || 1e-9), 1 / (d.y || 1e-9), 1 / (d.z || 1e-9));
    let t1 = (box.min.x - o.x) * _inv.x, t2 = (box.max.x - o.x) * _inv.x;
    let tmin = Math.min(t1, t2), tmax = Math.max(t1, t2);
    t1 = (box.min.y - o.y) * _inv.y; t2 = (box.max.y - o.y) * _inv.y;
    tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
    t1 = (box.min.z - o.z) * _inv.z; t2 = (box.max.z - o.z) * _inv.z;
    tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
    if (tmax >= Math.max(tmin, 0) && tmin < maxT) return Math.max(tmin, 0);
    return -1;
  }

  findTarget() {
    this.camera.getWorldPosition(_o); this.camera.getWorldDirection(_d);
    let best = null;
    const hit = this.pw.pick(_o, _d, REACH);
    if (hit) best = { type: 'sku', slot: hit.slot, t: hit.t };
    const objs = [...this.ctx.interactables, ...this.extra, ...this.stoolBoxes, ...this.dynamic];
    for (const ob of objs) {
      const tt = this.boxHit(ob.box, _o, _d, Math.min(ob.maxDist || 2.5, best ? best.t : 9));
      if (tt >= 0 && tt <= (ob.maxDist || 2.5) && (!best || tt < best.t)) best = { type: 'obj', obj: ob, t: tt };
    }
    if (best) {
      // occlusion by walls / fixtures
      ray.set(_o, _d); ray.far = Math.max(0.01, best.t - 0.03);
      const blockers = ray.intersectObjects(this.ctx.occluders, false);
      if (blockers.length) return null;
    }
    return best;
  }

  update(dt) {
    if (G.mode === 'inspect') {
      const w = consumeWheel(); if (w) this.hands.wheel(w);
      return;
    }
    if (G.mode !== 'play') { showPrompt(null); setCrosshair(''); return; }
    this.updateZone();
    this.updateRestock(dt);
    const tg = this.findTarget();
    this.target = tg;
    if (!tg) { showPrompt(null); setCrosshair(''); this.dwellSku = null; this.dwell = 0; if (ui.hooks.touchAction) ui.hooks.touchAction(null); return; }
    if (tg.type === 'sku') {
      const sku = tg.slot.sku;
      const blocked = sku.alcohol && !alcoholAllowed(G.hourNow);
      if (this.ctx.cooler) { const cm = /\|C(\d+)s\d+$/.exec(tg.slot.gkey); if (cm && !blocked) this.ctx.cooler.look(+cm[1]); }
      setCrosshair(blocked ? '' : 'hot');
      if (ui.hooks.touchAction) ui.hooks.touchAction(blocked ? null : 'sku');
      // looking at an item only previews it; it joins the Snack Book when you inspect it
      const keys = [];
      if (blocked) { showPrompt({ name: pick(sku.name), sub: tp('hud.alcoholClosed'), price: '', cat: both(CATS[sku.cat].name), keys: [] }); return; }
      keys.push(['T', tp('hud.take')], ['I', tp('hud.inspect')]);
      if (S.taken.length) keys.push(['P', tp('hud.putback')]);
      showPrompt({
        name: pick(sku.name), sub: pick2(sku.name) || pick(sku.name, other(lang.code)), price: '฿' + sku.price,
        cat: both(CATS[sku.cat].name) + (sku.size ? ' · ' + pick(sku.size) : ''), keys,
      });
    } else {
      const ob = tg.obj;
      setCrosshair('hot svc');
      this.dwellSku = null;
      if (ob.kind === 'npc') {
        const pp = PEOPLE[ob.id];
        showPrompt({ name: tp('hud.talkTo', { name: pick(pp.name) }), sub: pick(pp.role), price: '', cat: '', keys: [['T', tp('hud.talk')]] });
        if (ui.hooks.touchAction) ui.hooks.touchAction('talk');
      } else {
        showPrompt({ name: t('interact.' + ob.kind), sub: '', price: '', cat: '', keys: [['T', this.actionLabel(ob)]] });
        if (ui.hooks.touchAction) ui.hooks.touchAction('use', ob.kind);
      }
    }
  }

  actionLabel(ob) {
    switch (ob.kind) {
      case 'basket': return S.hasBasket ? tp('hud.dropBasket') : tp('hud.grabBasket');
      case 'atm': return tp('act.withdraw');
      case 'microwave': return tp('act.heat');
      case 'hotwater': return tp('act.pour');
      case 'coffee': return tp('act.order');
      case 'dog': return tp('act.talk');
      case 'npc': return tp('act.talk');
      case 'stool': return tp('interact.stool');
      default: return tp('hud.use');
    }
  }

  updateZone() {
    const p = this.player.pos;
    let z = null;
    for (const zz of ZONES) if (p.x >= zz.x0 && p.x <= zz.x1 && p.z >= zz.z0 && p.z <= zz.z1) { z = zz; break; }
    if (z && z.id !== this.zone) { const first = this.zone === null; this.zone = z.id; if (!first && z.id !== 'entrance') showZone(z.key, z.sub); }
  }

  updateRestock(dt) {
    if (!this.restock.length) return;
    const now = G.time;
    for (let i = this.restock.length - 1; i >= 0; i--) {
      const r = this.restock[i];
      if (now < r.at) continue;
      const dx = r.slot.x - this.player.pos.x, dz = r.slot.z - this.player.pos.z;
      if (dx * dx + dz * dz > 30) { this.pw.setTaken(r.slot, false); this.restock.splice(i, 1); }
    }
  }

  discoverSku(sku) {
    if (!discover(sku.id)) return;
    sfx('pop'); toast(`${tp('hud.newDiscovery')}  ${pick(sku.name)}`, 'good');
    const n = discoveredCount();
    if (n >= 25 && grantAch('explorer')) { achievement('explorer'); sfx('achievement'); }
    if (n >= SKUS.length && grantAch('collector')) { achievement('collector'); sfx('achievement'); }
  }

  // ------------------------------------------------------------------ keys
  onKey(code) {
    if (G.mode === 'inspect') {
      if (code === 'KeyT' || code === 'KeyE') this.inspectTake();
      else if (code === 'KeyI' || code === 'KeyP') this.endInspect(true);
      else if (code === 'Space') { this.hands.flip(); sfx('whoosh'); }
      return true;
    }
    if (G.mode !== 'play') return false;
    if (code === 'KeyT' || code === 'KeyE') return this.primary();   // T: take what you look at, or talk / use (E still works)
    if (code === 'KeyI') { this.inspectKey(); return true; }
    if (code === 'KeyP') { this.putBackLast(); return true; }
    return false;
  }
  primary() {
    const tg = this.target;
    if (!tg) return false;
    if (tg.type === 'sku') { this.take(tg.slot); return true; }
    this.activate(tg.obj);
    return true;
  }

  // ------------------------------------------------------------------ taking
  take(slot, fromInspect = false) {
    const sku = slot.sku;
    if (sku.alcohol && !alcoholAllowed(G.hourNow)) { toast(tp('hud.alcoholClosed'), 'warn', 4200); sfx('error'); return false; }
    if (count() >= capacity()) { toast(S.hasBasket ? tp('hud.basketFull') : tp('hud.handsFull'), 'warn'); sfx('error'); return false; }
    this.pw.setTaken(slot, true);
    addItem(sku, slot);
    const wp = new THREE.Vector3((slot.box.min.x + slot.box.max.x) / 2, slot.y + slot.size.h / 2, (slot.box.min.z + slot.box.max.z) / 2);
    if (fromInspect) wp.copy(this.camera.position).add(this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.5));
    this.hands.flyFrom(sku, wp);
    sfx('pick');
    toast(t('hud.added', { name: pick(sku.name) }), '', 1500);
    if (count() >= 10 && grantAch('shopper')) { achievement('shopper'); sfx('achievement'); }
    if (this.hands.inspect === null && !S.hasBasket) this.hands.refresh();
    return true;
  }
  putBackLast() {
    const slot = S.taken.pop();
    if (!slot) { toast(tp('hud.nothingToPutBack'), 'warn', 1500); return; }
    this.restoreSlot(slot);
  }
  putBackItem(sku) {
    let idx = -1;
    for (let i = S.taken.length - 1; i >= 0; i--) if (S.taken[i].sku === sku) { idx = i; break; }
    let slot = null;
    if (idx >= 0) slot = S.taken.splice(idx, 1)[0];
    else slot = this.pw.slotsOf(sku.id).find((s) => s.taken);
    if (!slot) { removeOne(sku); this.hands.refresh(); return; }
    this.restoreSlot(slot, sku);
  }
  restoreSlot(slot, sku = slot.sku) {
    removeOne(sku);
    this.pw.setTaken(slot, false);
    const wp = new THREE.Vector3((slot.box.min.x + slot.box.max.x) / 2, slot.y + slot.size.h / 2, (slot.box.min.z + slot.box.max.z) / 2);
    this.hands.flyTo(sku, wp);
    this.hands.refresh();
    sfx('put');
    toast(t('hud.removed', { name: pick(sku.name) }), '', 1200);
  }
  onBoughtSlots(slots) { for (const s of slots) this.restock.push({ slot: s, at: G.time + 80 + Math.random() * 60 }); }

  // ------------------------------------------------------------------ inspect
  beginInspect(slot) {
    const sku = slot.sku;
    if (sku.alcohol && !alcoholAllowed(G.hourNow)) { toast(tp('hud.alcoholClosed'), 'warn', 4200); return; }
    this.pw.setTaken(slot, true);
    this.insp = { slot, sku, hadLang: lang.mode };
    this.hands.beginInspect(sku);
    G.mode = 'inspect'; this.player.frozen = true;
    fillInspect(sku); $('inspect-ui').hidden = false; this.frameInspect();
    showPrompt(null); setCrosshair('');
    sfx('pick'); this.discoverSku(sku);
    G.inspecting = sku;
  }
  // I: inspect what the dot is on; with nothing targeted, inspect the last thing you picked up (hands or basket).
  inspectKey() {
    const tg = this.target;
    if (tg && tg.type === 'sku') { this.beginInspect(tg.slot); return; }
    const last = [...S.taken].reverse().map((s) => s.sku).find((sku) => S.items.some((e) => e.sku === sku)) || (S.items.length ? S.items[S.items.length - 1].sku : null);
    if (last) this.inspectOwned(last, { back: 'play' });
  }
  // Look at something already in your hands / basket. Leaving goes back to where you came from (the basket panel by default).
  inspectOwned(sku, o = {}) {
    if (this.insp) this.endInspect(true);
    this.insp = { sku, owned: true, back: o.back || 'basket', hadLang: lang.mode };
    this.hands.beginInspect(sku);
    G.mode = 'inspect'; this.player.frozen = true;
    fillInspect(sku, { owned: true }); $('inspect-ui').hidden = false; this.frameInspect();
    showPrompt(null); setCrosshair('');
    sfx('pick'); this.discoverSku(sku);
    G.inspecting = sku;
  }
  endInspect(putBack) {
    if (!this.insp) return;
    const { slot, owned, back } = this.insp;
    this.hands.endInspect();
    if (putBack && slot) { this.pw.setTaken(slot, false); sfx('put'); }
    $('inspect-ui').hidden = true;
    this.insp = null; G.inspecting = null;
    G.mode = 'play'; this.player.frozen = false;
    if (owned && back === 'basket') ui.open('basket');
  }
  inspectTake() {
    if (!this.insp) return;
    if (this.insp.owned) { this.endInspect(false); return; }
    const { slot } = this.insp;
    if (count() >= capacity()) { toast(S.hasBasket ? tp('hud.basketFull') : tp('hud.handsFull'), 'warn'); sfx('error'); return; }
    this.pw.setTaken(slot, false);       // take() re-marks it
    this.hands.endInspect();
    $('inspect-ui').hidden = true;
    this.insp = null; G.inspecting = null;
    G.mode = 'play'; this.player.frozen = false;
    this.take(slot, true);
  }
  refreshInspect() { if (this.insp) { fillInspect(this.insp.sku, { owned: this.insp.owned }); this.frameInspect(); } }
  // Touch: centre the inspected pack in the screen area the card and the top bar leave free (ui.css places the card:
  // a bottom sheet on phones, a side card on wider screens). Called on open, on a language change and on resize.
  frameInspect() {
    if (!this.insp || !input.touch) { this.hands.setInspectFrame(null); return; }
    const W = innerWidth, H = innerHeight, card = $('inspect-ui').getBoundingClientRect();
    const sheet = card.width > W * 0.6;
    const x1 = sheet ? W : card.left, y0 = $('topbar').getBoundingClientRect().bottom + 8, y1 = sheet ? card.top - 8 : H;
    this.hands.setInspectFrame({ x: x1 / W - 1, y: 1 - (y0 + y1) / H, w: x1 / W, h: Math.max(0.2, (y1 - y0) / H) });
  }

  // ------------------------------------------------------------------ objects
  activate(ob) {
    switch (ob.kind) {
      case 'basket':
        if (S.hasBasket) {
          if (count() > 0) { toast(tp('hud.handsFull'), 'warn'); return; }
          S.hasBasket = false; sfx('put');
        } else { S.hasBasket = true; sfx('pick'); toast(tp('hud.gotBasket'), 'good'); }
        this.hands.refresh();
        break;
      case 'atm': {
        if ((save.atmUses || 0) >= 6) { toast(tp('atm.limit'), 'warn'); sfx('error'); return; }
        save.atmUses = (save.atmUses || 0) + 1; save.cash += 500; markDirty(); sfx('atm');
        toast(tp('atm.done') + ' ' + tp('atm.fee'), 'good', 3200);
        if (grantAch('atm')) { achievement('atm'); sfx('achievement'); }
        break;
      }
      case 'microwave': this.useMicrowave(); break;
      case 'hotwater': {
        const cup = S.items.find((e) => e.sku.cat === 'cupnoodle' && !e.watered);
        if (!cup) { toast(tp('hw.none'), 'warn'); sfx('error'); return; }
        cup.watered = true; sfx('pour'); toast(tp('hw.done'), 'good', 3200);
        break;
      }
      case 'coffee': this.cafeMenu(); break;
      case 'dog':
        startTalk('dog', null, { effect: (e) => this.talkEffect(e) });
        break;
      case 'npc':
        startTalk(ob.id, ob.npc, { effect: (e) => this.talkEffect(e), pay: () => this.checkout() });
        break;
      case 'stool':
        toast(tp('sit.done'), '', 3500);
        break;
      default: break;
    }
  }

  checkout() {
    if (!S.items.length) { toast(tp('co.emptyBasket'), 'warn'); say(PHRASES.empty); return; }
    startCheckout({
      hands: this.hands, putBack: (sku) => this.putBackItem(sku), cashier: this.npcs && this.npcs.cashier,
      onBoughtSlots: (s) => this.onBoughtSlots(s),
    });
  }

  talkEffect(e) {
    if (e === 'dog') { sfx('bark'); if (this.npcs && this.npcs.dog) this.npcs.dog.wake(); }
  }

  useMicrowave() {
    const e = S.items.find((x) => x.sku.heat && x.heated < x.qty);
    if (!e) { toast(S.items.some((x) => x.sku.heat) ? tp('mw.already') : tp('mw.none'), 'warn'); sfx('error'); return; }
    if (this.mwBusy) return;
    this.mwBusy = true; sfx('microwave'); toast(tp('mw.heating'), '', 2400);
    setTimeout(() => {
      e.heated = e.qty; sfx('ding'); toast(tp('toast.microwave'), 'good');
      if (grantAch('heater')) { achievement('heater'); sfx('achievement'); }
      this.mwBusy = false;
    }, 2500);
  }

  async cafeMenu() {
    if (this.cafeBusy) return;
    const menu = ['cafe-americano', 'cafe-latte', 'cafe-thaitea', 'cafe-cocoa', 'slurpee-cola'].map((id) => SKU_BY_ID.get(id)).filter(Boolean);
    if (!menu.length) return;
    this.cafeBusy = true;
    const panel = $('co-choices');
    ui.open('checkout');
    $('co-list').innerHTML = ''; $('co-total').textContent = '';
    $('co-th').textContent = 'อีเลฟเว่น คาเฟ่'; $('co-rom').textContent = ''; $('co-en').textContent = tp('cafe.title');
    $('co-th').textContent = tp('cafe.title');
    panel.innerHTML = '';
    ui.hooks.checkoutCancel = () => { this.cafeBusy = false; return true; };
    const choice = await new Promise((resolve) => {
      menu.forEach((sku, i) => {
        const b = document.createElement('button');
        b.className = 'btn' + (i === 0 ? ' primary' : ''); b.innerHTML = `<kbd style="margin-right:.5em">${i + 1}</kbd>${esc(pick(sku.name))} — ฿${sku.price}`;
        b.addEventListener('click', () => resolve(sku)); panel.appendChild(b);
      });
      const x = document.createElement('button'); x.className = 'btn'; x.textContent = tp('co.cancel'); x.addEventListener('click', () => resolve(null)); panel.appendChild(x);
      this._cafeResolve = resolve;
    });
    ui.hooks.checkoutCancel = null;
    panel.innerHTML = '';
    if (ui.panel === 'checkout') ui.close();
    this.cafeBusy = false;
    if (!choice) return;
    if (save.cash < choice.price) { toast(tp('toast.noWallet'), 'warn'); sfx('error'); return; }
    save.cash -= choice.price; markDirty();
    sfx('coffee'); toast(tp('mw.heating'), '', 2200);
    await new Promise((r) => setTimeout(r, 2400));
    sfx('ding');
    const found = S.bag.find((b) => b.sku === choice);
    if (found) found.qty++; else S.bag.push({ sku: choice, qty: 1, heated: 0 });
    discover(choice.id);
    toast(t('cafe.made', { name: pick(choice.name) }), 'good', 3500);
  }
}

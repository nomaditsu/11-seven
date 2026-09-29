// The cashier conversation: age check, "อุ่นไหมคะ?", bag, payment (cash / PromptPay QR / TrueMoney) and receipt.
import { G } from '../core/state.js';
import { lang, t, tp, pick, tOnly } from '../core/i18n.js';
import { PHRASES } from '../core/strings.js';
import { save, markDirty, settings } from '../core/settings.js';
import { ui, toast, achievement, $, esc } from '../ui/ui.js';
import { questProgress, renderBasket } from '../ui/panels.js';
import { updateObjective } from '../ui/ui.js';
import { S, count, subtotal, alcoholAllowed, grantAch } from './session.js';
import { sfx, speakThai } from './audio.js';
import { drawReceipt } from './receipt.js';
import { drawFakeQR } from '../world/fixtures_counter.js';
import { QUESTS } from '../data/quests.js';
import { sleep } from '../core/util.js';

const ABORT = Symbol('abort');
let run = null;
let pendingChoice = null;

export const checkoutActive = () => !!run;

export function checkoutKey(n) {
  if (pendingChoice && pendingChoice.buttons[n - 1]) pendingChoice.buttons[n - 1].click();
}

function saySpeech(phrase, vars = {}) {
  const rep = (s) => (s || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  $('co-th').textContent = rep(phrase.th);
  $('co-rom').textContent = settings.romanize ? rep(phrase.rom) : '';
  $('co-en').textContent = lang.code === 'th' && lang.mode === 'th' ? '' : rep(phrase.en);
  speakThai(rep(phrase.th), rep(phrase.rom));
}

function ask(phrase, options, vars) {
  saySpeech(phrase, vars);
  const box = $('co-choices'); box.innerHTML = '';
  return new Promise((resolve, reject) => {
    run.reject = reject;
    const buttons = options.map(([label, value, cls], i) => {
      const b = document.createElement('button');
      b.className = 'btn' + (cls ? ' ' + cls : ''); b.innerHTML = `<kbd style="margin-right:.5em">${i + 1}</kbd>${esc(label)}`;
      b.addEventListener('click', () => { pendingChoice = null; box.innerHTML = ''; sfx('tick'); resolve(value); });
      box.appendChild(b); return b;
    });
    pendingChoice = { buttons };
  });
}
const wait = async (ms) => { await sleep(ms); if (run && run.aborted) throw ABORT; };

function renderList(lines, total) {
  $('co-list').innerHTML = lines.map((l) => `<div class="${l.off ? 'off' : ''}"><span>${esc(l.name)}</span><span>${esc(l.price)}</span></div>`).join('');
  $('co-total').textContent = '฿' + total;
  const list = $('co-list'); list.scrollTop = list.scrollHeight;
}

function bills(total, cash) {
  const denoms = [1000, 500, 100, 50, 20];
  const single = [...denoms].reverse().find((d) => d >= total);
  let given = single || total;
  if (!single) { let s = 0; for (const d of denoms) while (s + d <= total * 1.0 && s < total) s += d; given = s < total ? s + 20 : s; }
  return Math.min(given, Math.max(cash, total));
}

export async function startCheckout(env) {
  if (run) return;
  if (!S.items.length) { toast(tp('co.emptyBasket'), 'warn'); return; }
  run = { aborted: false, reject: null };
  ui.hooks.checkoutCancel = () => { if (run) { run.aborted = true; if (run.reject) run.reject(ABORT); } return true; };
  ui.open('checkout');
  $('co-qr').hidden = true;
  try {
    await flow(env);
  } catch (e) { if (e !== ABORT) console.error(e); }
  finally {
    run = null; pendingChoice = null; ui.hooks.checkoutCancel = null;
    if (ui.panel === 'checkout') ui.close();
  }
}

async function flow(env) {
  const hour = G.hourNow;
  const co = (k) => tp(k);
  const lines = [];
  let total = 0;
  renderList(lines, 0);
  env.cashier && env.cashier.wai();
  saySpeech(PHRASES.welcome);
  await wait(2200);

  // ---- age-restricted goods
  const alc = S.items.filter((e) => e.sku.alcohol);
  if (alc.length) {
    if (!alcoholAllowed(hour)) {
      saySpeech(PHRASES.noAlcohol); sfx('error');
      $('co-choices').innerHTML = '';
      for (const e of [...alc]) { for (let i = 0; i < e.qty; i++) env.putBack(e.sku); }
      env.hands.refresh();
      await wait(3200);
      if (!S.items.length) { return; }
    } else {
      await ask(PHRASES.ageId, [[co('co.showId'), true, 'primary']]);
      sfx('tick');
    }
  }

  // ---- scan
  saySpeech(PHRASES.total, { n: '…' });
  for (const e of S.items) {
    for (let i = 0; i < e.qty; i++) {
      total += e.sku.price; sfx('beep');
      lines.push({ name: `${pick(e.sku.name)}`, price: e.sku.price + '.00' });
      renderList(lines, total);
      await wait(e.qty > 3 ? 110 : 220);
    }
  }
  await wait(250);

  // ---- 11 Club
  const member = await ask(PHRASES.member, [[co('co.memberYes'), true, 'primary'], [co('co.memberNo'), false]]);

  // ---- heat it?
  const heatable = S.items.filter((e) => e.sku.heat && e.heated < e.qty);
  if (heatable.length) {
    const yes = await ask(PHRASES.heat, [[co('co.heatYes'), true, 'primary'], [co('co.heatNo'), false]]);
    if (yes) {
      sfx('microwave');
      lines.push({ name: '🔥 ' + tp('mw.heating'), price: '' }); renderList(lines, total);
      await wait(2400);
      sfx('ding');
      for (const e of heatable) e.heated = e.qty;
      lines.pop(); lines.push({ name: '🔥 ' + tOnly('toast.microwave', lang.code), price: '' }); renderList(lines, total);
      if (grantAch('heater')) { achievement('heater'); sfx('achievement'); }
      await wait(700);
    }
  }

  // ---- cutlery / bag
  const needsCutlery = S.items.some((e) => ['meal', 'cupnoodle', 'dessert', 'sandwich', 'noodle'].includes(e.sku.cat));
  if (needsCutlery) await ask(PHRASES.cutlery, [[co('co.cutlery'), true, 'primary'], [co('co.no'), false]]);
  const bag = await ask(PHRASES.bag, [[co('co.bagYes'), true, 'primary'], [co('co.bagNo'), false]]);
  let points = Math.floor(total / 25) + (member ? 1 : 0);
  if (!bag) { points += 1; toast(tp('co.eco'), 'good'); if (grantAch('eco')) { achievement('eco'); sfx('achievement'); } }

  // ---- pay
  await ask(PHRASES.total, [[t('co.payNow', { n: total }), true, 'primary']], { n: total });
  let method = null, given = 0, change = 0;
  while (!method) {
    const opts = [[`${co('co.cash')}  (฿${save.cash})`, 'cash'], [`${co('co.promptpay')}  (฿${save.bank})`, 'promptpay'], [`${co('co.truemoney')}  (฿${save.wallet ?? 0})`, 'truemoney']];
    const m = await ask(PHRASES.howPay, opts);
    if ((m === 'cash' && save.cash < total) || (m === 'promptpay' && save.bank < total) || (m === 'truemoney' && (save.wallet ?? 0) < total)) {
      sfx('error'); toast(tp('co.notEnough'), 'bad'); if (save.cash < total) toast(tp('toast.noWallet'), 'warn'); continue;
    }
    method = m;
  }
  if (method === 'cash') {
    given = bills(total, save.cash); change = given - total;
    saySpeech(PHRASES.received, { n: given }); sfx('cash'); await wait(1300);
    save.cash = save.cash - total;
    saySpeech(PHRASES.change, { n: change }); await wait(1200);
  } else {
    // QR / wallet
    const qr = $('co-qr'); qr.hidden = false;
    const c = $('co-qr-canvas').getContext('2d'); drawFakeQR(c, 0, 0, 220, method === 'promptpay' ? 11 : 4);
    await ask(PHRASES.scan, [[co('co.scanBtn'), true, 'primary']]);
    sfx('tick'); await wait(700); sfx('success');
    qr.hidden = true;
    if (method === 'promptpay') { save.bank -= total; if (grantAch('promptpay')) { achievement('promptpay'); sfx('achievement'); } } else save.wallet = (save.wallet ?? 0) - total;
    saySpeech(PHRASES.paid); await wait(1300);
  }
  save.points += points;
  markDirty();

  // ---- hand over goods
  saySpeech(PHRASES.thanks2); sfx('printer');
  const receipt = { items: S.items.map((e) => ({ sku: e.sku, qty: e.qty, heated: e.heated })), total, method, given, change, points, date: new Date(), hour, no: String(Math.floor(100000 + Math.random() * 899999)) };
  const bought = [];
  if (env.onBoughtSlots) env.onBoughtSlots(S.taken.slice());
  for (const e of S.items) {
    bought.push(e.sku.id);
    const found = S.bag.find((b) => b.sku === e.sku && !!b.heated === !!e.heated);
    if (found) { found.qty += e.qty; } else S.bag.push({ sku: e.sku, qty: e.qty, heated: e.heated });
  }
  S.items.length = 0; S.taken.length = 0; S.hasBasket = false;
  env.hands.refresh();
  S.totalBought += 1;
  if (hour < 5 || hour >= 24) if (grantAch('night')) { achievement('night'); sfx('achievement'); }
  // quest progress
  const done = questProgress(bought);
  updateObjective();
  await wait(900);
  ui.close();
  $('receipt-canvas').dataset.receipt = '1';
  ui.hooks.lastReceipt = receipt;
  drawReceipt($('receipt-canvas'), receipt);
  ui.open('receipt');
  if (done) {
    if (!save.questsDone.includes(done.id)) save.questsDone.push(done.id);
    save.points += done.reward; markDirty();
    toast(`${tp('quest.done')} ${t('quest.reward', { n: done.reward })}`, 'good', 5000);
    if (grantAch('quest')) { achievement('quest'); }
    S.activeQuest = null; S.questGot = []; updateObjective();
  }
}

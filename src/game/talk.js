// Conversations: the dialogue card, branching choices, spoken lines and the small rewards.
import { lang, tp, dual } from '../core/i18n.js';
import { save, markDirty, settings } from '../core/settings.js';
import { ui, toast, achievement, esc, $ } from '../ui/ui.js';
import { avatarSvg, ICON } from '../ui/icons.js';
import { PEOPLE, PEOPLE_COUNT } from '../data/dialogue.js';
import { S, discover, grantAch } from './session.js';
import { SKU_BY_ID } from '../data/skus.js';
import { pick } from '../core/i18n.js';
import { speak, stopSpeech, sfx } from './audio.js';

let cur = null;            // { id, person, node, npc, reward }
let typeT = 0;
export const talkActive = () => !!cur;

export function startTalk(id, npc = null, hooks = {}) {
  const person = PEOPLE[id];
  if (!person || cur) return false;
  cur = { id, person, node: person.start, npc, hooks, reward: null };
  if (npc) npc.talking = true;
  save.talked = save.talked || [];
  const key = 'p:' + id;
  if (!save.talked.includes(key)) { save.talked.push(key); markDirty(); }
  ui.open('talk');
  go(person.start, true);
  return true;
}

function endTalk() {
  if (!cur) return;
  if (ui.panel === 'talk') ui.close();       // onPanel(talk, false) -> cleanup()
  else cleanup();
}
// Called by the panel hook whenever the talk panel closes (Esc, leave button, goodbye).
export function cleanup() {
  if (!cur) return;
  clearInterval(typeT); stopSpeech();
  if (cur.npc) cur.npc.talking = false;
  const met = (save.talked || []).filter((k) => k.startsWith('p:')).length;
  cur = null;
  if (met >= 6 && grantAch('friendly')) { achievement('friendly'); sfx('achievement'); }
}

function applyGive(give) {
  if (!give) return null;
  const key = `${cur.id}.${cur.node}`;
  if ((save.talked || []).includes(key)) return null;
  let text = null;
  if (give.discover) {
    const sku = SKU_BY_ID.get(give.discover);
    if (sku && discover(give.discover)) { sfx('pop'); text = `${tp('hud.newDiscovery')} ${pick(sku.name)}`; }
  } else if (give.cash) {
    save.cash += give.cash; sfx('cash'); text = `${tp('hud.cash')} +฿${give.cash}`;
  } else if (give.ach) {
    if (grantAch(give.ach)) { achievement(give.ach); sfx('achievement'); }
  }
  save.talked.push(key); markDirty();
  return text;
}

function go(node, first = false) {
  cur.node = node;
  const nd = cur.person.nodes[node];
  cur.reward = applyGive(nd.give);
  if (nd.effect && cur.hooks.effect) cur.hooks.effect(nd.effect);
  if (!first) sfx('tick');
  render();
}

function render() {
  const { person, node } = cur, nd = person.nodes[node];
  const choices = nd.end ? `<button class="choice end" data-i="end"><kbd>T</kbd><div>${dual({ en: tp('talk.goodbye'), th: 'ลาก่อน', rom: 'laa-gɔ̀ɔn' })}</div></button>`
    : choicesOf(nd).map((c, i) => `<button class="choice ${c.to ? '' : 'end'}" data-i="${i}"><kbd>${i + 1}</kbd><div>${dual(c.t)}</div></button>`).join('');
  $('panel-talk').innerHTML = `<div class="tk">
    <div class="who"><div class="face" data-a="replay" title="Replay">${avatarSvg(person.face)}</div>
      <div><b>${esc(pick(person.name))}</b><span class="role">${dual(person.role)}</span></div>
      <div class="tools">
        <button class="tbtn ${settings.voice ? '' : 'off'}" data-a="voice" title="Voice">${ICON.voice}<span>${esc(tp(settings.voice ? 'talk.voiceOn' : 'talk.voiceOff'))}</span></button>
        <button class="tbtn" data-a="leave"><span>${esc(tp('talk.leave'))}</span><kbd>Esc</kbd><b class="xx">✕</b></button>
      </div></div>
    <div class="say" id="tk-say">${dual(nd.say)}</div>
    ${cur.reward ? `<div class="reward">${ICON.book.replace('<svg', '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2"')} ${esc(cur.reward)}</div>` : ''}
    <div class="choices">${choices}</div></div>`;
  const root = $('panel-talk');
  root.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => (b.dataset.i === 'end' ? endTalk() : choose(+b.dataset.i))));
  root.querySelector('[data-a=leave]').addEventListener('click', endTalk);
  root.querySelector('[data-a=voice]').addEventListener('click', () => { settings.voice = !settings.voice; markDirty(); if (!settings.voice) stopSpeech(); else speakNode(); render(); });
  root.querySelector('[data-a=replay]').addEventListener('click', speakNode);
  typeIn(); speakNode();
}

// A cashier's first line also offers to ring you up when you are carrying something.
const PAY = { t: { en: 'I would like to pay', th: 'ขอชำระเงินหน่อย', rom: 'kɔ̌ɔ cham-rá ngən nɔ̀ɔi' }, to: null, action: 'pay' };
function choicesOf(nd) {
  const list = nd.choices || [];
  return cur.person.canPay && cur.node === cur.person.start && S.items.length ? [PAY, ...list] : list;
}
function choose(i) {
  const nd = cur.person.nodes[cur.node];
  const c = choicesOf(nd)[i];
  if (!c) return;
  if (c.action === 'pay') { const pay = cur.hooks.pay; endTalk(); if (pay) setTimeout(pay, 120); return; }
  if (c.to) go(c.to); else endTalk();
}

// A tiny typewriter on the first line; the pronunciation / Thai lines appear when it finishes.
function typeIn() {
  clearInterval(typeT);
  const say = $('tk-say'); if (!say) return;
  const l1 = say.querySelector('.l1'); if (!l1) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rest = [...say.children].filter((n) => n !== l1);
  const full = l1.textContent; let i = 0;
  l1.textContent = ''; rest.forEach((n) => (n.style.visibility = 'hidden'));
  cur.typing = { l1, full, rest };
  typeT = setInterval(() => {
    i += 2; l1.textContent = full.slice(0, i);
    if (i >= full.length) finishTyping();
  }, 22);
}
function finishTyping() {
  const t = cur && cur.typing; if (!t) return false;
  clearInterval(typeT); t.l1.textContent = t.full; t.rest.forEach((n) => (n.style.visibility = 'visible')); cur.typing = null;
  return true;
}

// Speak the line: English first, then Thai (when the language mode includes it).
export function speakNode() {
  if (!cur || !settings.voice || !cur.person.voice) return;
  const nd = cur.person.nodes[cur.node], v = cur.person.voice;
  const clean = (t) => t.replace(/[*♥]|\([^)]*\)/g, '').trim();
  let queued = false;
  if (lang.code === 'en') queued = speak(clean(nd.say.en), 'en', { pitch: v.p, rate: v.r + 0.02 }) || queued;
  if (lang.mode === 'th' || lang.mode === 'both') speak(clean(nd.say.th), 'th', { pitch: v.p, rate: v.r, queue: queued, rom: nd.say.rom ? clean(nd.say.rom) : '' });
}

// Keyboard: 1-3 choose, E / Space / Enter continues (finishes typing first, or says goodbye on the last line).
export function talkKey(code) {
  if (!cur) return false;
  const m = /^Digit([1-9])$/.exec(code);
  if (m) { finishTyping(); const nd = cur.person.nodes[cur.node]; if (!nd.end) choose(+m[1] - 1); return true; }
  if (code === 'KeyT' || code === 'KeyE' || code === 'Space' || code === 'Enter') {
    if (finishTyping()) return true;
    const nd = cur.person.nodes[cur.node];
    if (nd.end) endTalk();
    else if (choicesOf(nd).length === 1) choose(0);
    return true;
  }
  return false;
}
export { PEOPLE_COUNT };

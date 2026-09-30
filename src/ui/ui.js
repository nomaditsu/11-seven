// DOM user interface: title screen, HUD, prompts, toasts, subtitles, settings & panel management.
import { G } from '../core/state.js';
import { lang, t, tp, t2, pick, pick2, applyDom, onLanguageChange, setLanguageMode, other, dual, romFor, showRom } from '../core/i18n.js';
import { STR, TIPS, PHRASES } from '../core/strings.js';
import { settings, save, markDirty, resetProgress } from '../core/settings.js';
import { input, exitLock, requestLock } from '../input.js';
import { S, count, fmtClock, discoveredCount } from '../game/session.js';
import { SKUS } from '../data/skus.js';
import { QUESTS } from '../data/quests.js';
import { MUSIC_TRACKS } from '../data/music.js';
import { ICON, flagsFor, logoSvg } from './icons.js';
import { applyVolumes, setMuted, setMusicOn, nextTrack, currentTrack } from '../game/audio.js';
import { buildPause, buildControls, buildAbout } from './screens.js';

const $ = (id) => document.getElementById(id);
const el = {};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const ui = {
  panel: null,        // currently open panel id
  started: false,
  hooks: {},          // set by main: startGame, resume, applySetting, ...
  refreshers: new Map(),
};

// ------------------------------------------------------------------------------------------ init
export function initUI() {
  for (const id of ['title', 'hud', 'panels', 'xhair', 'zoomframe', 'prompt', 'p-name', 'p-sub', 'p-price', 'p-cat', 'p-keys', 'pcard', 'subtitle', 'sub-th', 'sub-rom', 'sub-en',
    'zonebanner', 'toasts', 'hints', 'objective', 'w-cash', 'w-basket', 'w-basket-l', 'w-basket-i', 'hud-clock', 'hud-temp', 'hud-codex-n', 'hud-codex', 'hud-logo', 'hud-brand', 'brandmark', 'btn-by-title', 'btn-sound', 'btn-info', 'btn-look', 'btn-menu', 't-sound', 'phead-logo', 'movepad', 'touch',
    'btn-start', 'btn-settings', 'btn-controls', 'btn-about', 'loadfill', 'tip', 'title-lang', 'clickcatch', 'fade',
    'inspect-ui', 'ins-brand', 'ins-name', 'ins-second', 'ins-price', 'ins-size', 'ins-tags', 'ins-desc', 'ins-dl', 'ins-keys']) el[id] = $(id);
  el.scr = document.querySelector('.scrim');

  // brand marks + inline icons
  el.brandmark.innerHTML = logoSvg(132);
  el['hud-logo'].innerHTML = logoSvg(34, { rounded: true });
  el['phead-logo'].innerHTML = logoSvg(38, { rounded: true });
  document.querySelectorAll('[data-icon]').forEach((n) => { n.innerHTML = ICON[n.dataset.icon] || ''; });
  el['btn-by-title'].addEventListener('click', () => ui.open('about'));

  // language segmented control (title screen)
  el['title-lang'].querySelectorAll('button').forEach((b) => b.addEventListener('click', () => changeLanguage(b.dataset.lang)));

  // top-right buttons: About (data-open), Sound (opens the popover in soundpop.js) and Menu
  el['btn-look'].addEventListener('click', () => ui.hooks.toggleLook && ui.hooks.toggleLook());
  el['btn-menu'].addEventListener('click', () => (ui.panel === 'pause' ? ui.close() : ui.open('pause')));

  // panels
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => ui.close()));
  document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => ui.open(b.dataset.open)));
  el.scr.addEventListener('click', () => { if (ui.panel !== 'pause' && ui.panel !== 'checkout' && ui.panel !== 'receipt') ui.close(); });
  el['btn-settings'].addEventListener('click', () => ui.open('settings'));
  el['btn-controls'].addEventListener('click', () => ui.open('controls'));
  el['btn-about'].addEventListener('click', () => ui.open('about'));
  el['btn-start'].addEventListener('click', () => { if (!el['btn-start'].disabled && ui.hooks.startGame) ui.hooks.startGame(); });
  el.clickcatch.addEventListener('click', () => { el.clickcatch.hidden = true; requestLock(); });

  // On-screen key hints are buttons too: a click sends the same key the keyboard would.
  el.hints.addEventListener('click', (e) => {
    const h = e.target.closest('.hint[data-code]'); if (!h) return;
    for (const type of ['keydown', 'keyup']) dispatchEvent(new KeyboardEvent(type, { code: h.dataset.code, bubbles: true }));
  });
  // Arrow pad: hold a key cap to walk (the same input.keys the keyboard fills).
  el.movepad.querySelectorAll('kbd[data-code]').forEach((k) => {
    const code = k.dataset.code;
    const up = () => { input.keys.delete(code); k.classList.remove('held'); };
    k.addEventListener('pointerdown', (e) => { e.preventDefault(); k.setPointerCapture(e.pointerId); input.keys.add(code); k.classList.add('held'); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) k.addEventListener(ev, up);
  });

  addEventListener('resize', placeToasts);
  onLanguageChange(refreshLanguage);
  refreshLanguage();
  rotateTips();
  setInterval(rotateTips, 7000);
}

let tipIdx = Math.floor(Math.random() * 100);
function rotateTips() {
  const tip = TIPS[tipIdx++ % TIPS.length];
  el.tip.textContent = pick(tip) + (lang.second ? '\n' + pick2(tip) : '');
  el.tip.style.whiteSpace = 'pre-line';
}

// ------------------------------------------------------------------------------------------ language
export function changeLanguage(mode, quiet = false) {
  const before = lang.mode;
  setLanguageMode(mode);
  settings.lang = mode; markDirty();
  if (!quiet && before !== mode) toast(t(mode === 'en' ? 'toast.langOn' : mode === 'th' ? 'toast.langTh' : 'toast.langBoth'), 'good', 1600);
  if (ui.hooks.onLanguage) ui.hooks.onLanguage(mode, before);
}

function refreshLanguage() {
  applyDom(document);
  if (el['w-basket-l']) refreshCarry();
  document.querySelectorAll('[data-by]').forEach((n) => { n.textContent = tp('hud.by'); });
  el['title-lang'].querySelectorAll('button').forEach((b) => {
    const m = b.dataset.lang;
    b.classList.toggle('on', m === lang.mode);
    b.innerHTML = `${flagsFor(m, 22)}<span>${m === 'en' ? 'English' : m === 'th' ? 'ไทย' : 'EN + ไทย'}</span>`;
  });
  if (ui.started) { const first = el['btn-start']; first.firstElementChild && (first.firstElementChild.textContent = tp('title.start')); }
  rotateTips();
  refreshTop();
  if (ui.panel === 'settings') buildSettings();
  if (ui.panel === 'pause') buildPause();
  if (ui.panel === 'controls') buildControls();
  if (ui.panel === 'about') buildAbout();
  for (const fn of ui.refreshers.values()) fn();
  updateHints();
  updateObjective();
}

// ------------------------------------------------------------------------------------------ top-right buttons
// Sound state and the tooltips of the top-right buttons. Called whenever they change.
export function refreshTop() {
  const setBtn = (id, svg, title, off) => {
    const b = el[id]; if (!b) return;
    b.querySelector('.ii').innerHTML = svg; b.title = title; b.setAttribute('aria-label', title); b.classList.toggle('off', !!off);
  };
  // one Sound button: red only when effects and music are both off; small moving bars while music plays
  const silent = settings.muted && !settings.musicOn;
  for (const p of ['btn', 't']) {
    setBtn(p + '-sound', silent ? ICON.soundoff : ICON.sound, t('btn.soundPop'), silent);
    el[p + '-sound'].classList.toggle('nomus', !settings.musicOn);
  }
  setBtn('btn-info', ICON.info, t('btn.about'));
  setBtn('btn-look', ICON.look, t('btn.look'));
  el['btn-look'].classList.toggle('on', input.locked);
  setBtn('btn-menu', ICON.menu, t('btn.menu'));
  if (ui.onAudioUi) ui.onAudioUi();
  if (el['hud-codex']) el['hud-codex'].title = t('btn.snackbook');
}
export function toggleSound() {
  ui.soundTouched = true;   // the player chose: Walk in will not switch sound on for them
  setMuted(!settings.muted); markDirty(); refreshTop();
  if (!ui.popOpen) toast(tp(settings.muted ? 'toast.soundOff' : 'toast.soundOn'), '', 1200);
}
export function toggleMusic() {
  ui.musicTouched = true;   // the player chose: Walk in will not switch music on for them
  setMusicOn(!settings.musicOn); markDirty(); refreshTop();
  if (!ui.popOpen) toast(tp(settings.musicOn ? 'toast.musicOn' : 'toast.musicOff'), '', 1200);
  if (ui.panel === 'settings') buildSettings();
}
export function skipTrack(d = 1) {
  ui.musicTouched = true;
  const tr = nextTrack(d); markDirty();
  if (!settings.musicOn) setMusicOn(true);
  if (!ui.popOpen) showNowPlaying(tr.name);
  refreshTop();
  if (ui.panel === 'settings') buildSettings();
}
export function pickTrack(i) {
  const n = MUSIC_TRACKS.length; settings.track = ((i % n) + n) % n;
  return skipTrack(0);
}
// "Now playing" is a toast too (one at a time), so it shares the message column.
export function showNowPlaying(name) {
  el.toasts.querySelectorAll('.toast.np').forEach((n) => n.remove());
  toast('', 'np', 2200);
  el.toasts.lastChild.innerHTML = `${ICON.music.replace('<svg', '<svg style="width:16px;height:16px;fill:none;stroke:#ffe2b8;stroke-width:2.2;vertical-align:-3px;margin-right:6px"')} ${esc(tp('toast.track', { name }))}`;
}

// ------------------------------------------------------------------------------------------ loading / title
export function setProgress(p, ready = false) {
  el.loadfill.style.width = Math.round(p * 100) + '%';
  if (ready) {
    const b = el['btn-start'];
    b.disabled = false;
    b.innerHTML = '<span data-i18n="title.start"></span>';
    applyDom(b);
    ui.started = true;
  }
}
export function hideTitle() { if (ui.closePop) ui.closePop(); el.title.classList.add('gone'); setTimeout(() => (el.title.hidden = true), 700); el.hud.hidden = false; }
export function showTitle() { if (ui.closePop) ui.closePop(); el.title.hidden = false; requestAnimationFrame(() => el.title.classList.remove('gone')); el.hud.hidden = true; }

// ------------------------------------------------------------------------------------------ panels
const PANEL_BUILD = { settings: () => buildSettings(), pause: () => buildPause(), controls: () => buildControls(), about: () => buildAbout(), time: () => buildTime() };
export const panelIds = ['pause', 'settings', 'controls', 'about', 'time', 'talk', 'codex', 'quests', 'basket', 'checkout', 'receipt'];
ui.open = function open(id) {
  if (ui.panel && ui.panel !== id && (ui.panel === 'checkout')) return;
  if (ui.closePop) ui.closePop();
  ui.prevPanel = ui.panel && ui.panel !== id ? ui.panel : ui.prevPanel;
  if (ui.panel === 'pause' && id !== 'pause') ui.returnToPause = true; else if (id === 'pause') ui.returnToPause = false;
  ui.panel = id;
  el.panels.hidden = false;
  el.panels.classList.toggle('talking', id === 'talk');
  for (const p of panelIds) { const e = $('panel-' + p); if (e) e.classList.toggle('on', p === id); }
  if (PANEL_BUILD[id]) PANEL_BUILD[id]();
  const fn = ui.refreshers.get(id); if (fn) fn();
  if (G.mode === 'play' || G.mode === 'inspect') { G.modeBefore = G.mode; G.mode = 'ui'; }
  exitLock();
  if (ui.hooks.onPanel) ui.hooks.onPanel(id, true);
};
ui.close = function close() {
  if (!ui.panel) return;
  if (ui.panel === 'checkout' && ui.hooks.checkoutCancel && !ui.hooks.checkoutCancel()) return;
  const fromTitle = !el.title.hidden && G.mode !== 'play';
  const wasPause = ui.panel === 'pause';
  const id = ui.panel;
  ui.panel = null;
  // returning from a sub-panel opened out of pause -> back to pause
  if (id !== 'pause' && ui.returnToPause) { ui.returnToPause = false; ui.open('pause'); return; }
  el.panels.hidden = true; el.panels.classList.remove('talking');
  for (const p of panelIds) { const e = $('panel-' + p); if (e) e.classList.remove('on'); }
  if (ui.hooks.onPanel) ui.hooks.onPanel(id, false);
  if (fromTitle) return;
  G.mode = G.modeBefore === 'inspect' ? 'inspect' : 'play';
  if (G.mode === 'play') {
    requestLock();
    setTimeout(() => { if (G.mode === 'play' && !input.locked && !input.dragLook && ui.started) el.clickcatch.hidden = false; }, 350);
  }
};
ui.toggle = function toggle(id) { if (ui.panel === id) ui.close(); else ui.open(id); };
ui.isOpen = () => !!ui.panel;

// ------------------------------------------------------------------------------------------ HUD
// Short messages (tips, achievements, now playing) stack in one centred column just below the top bar. If the quest
// card is in the column's way, the column narrows to clear it, or, when that would leave it too narrow, starts below it.
// The location title is centred in the window and the column stops above it (fitToasts), so they never meet.
export function placeToasts() {
  let top = 14, w = Math.min(innerWidth * 0.92, 560);
  if (!el.hud.hidden) {
    for (const s of ['.tleft', '#hud-right']) top = Math.max(top, document.querySelector(s).getBoundingClientRect().bottom);
    const o = el.objective;
    if (!o.hidden) {
      const r = o.getBoundingClientRect();
      if (r.right > (innerWidth - w) / 2) { const fit = innerWidth - 2 * (r.right + 8); if (fit >= 300) w = Math.min(w, fit); else top = Math.max(top, r.bottom); }
    }
  }
  document.documentElement.style.setProperty('--toast-top', Math.round(top + 10) + 'px');
  document.documentElement.style.setProperty('--toast-w', Math.round(w) + 'px');
}
// The column never reaches the centred location title (measured; 66px is its half height on a wide screen before the
// first title has been shown): when a new message does not fit, the oldest goes.
const MAX_TOASTS = 3;
function fitToasts() {
  while (el.toasts.children.length > MAX_TOASTS) el.toasts.firstChild.remove();
  const half = el.zonebanner.offsetHeight ? el.zonebanner.offsetHeight / 2 : 66;
  const limit = innerHeight / 2 - half - 12;
  while (el.toasts.children.length > 1 && el.toasts.lastElementChild.getBoundingClientRect().bottom > limit) el.toasts.firstChild.remove();
}
export function toast(msg, kind = '', ms = 2600) {
  placeToasts();
  const d = document.createElement('div');
  d.className = 'toast ' + kind; d.textContent = msg;
  el.toasts.appendChild(d);
  fitToasts();
  setTimeout(() => { d.style.transition = 'opacity .4s'; d.style.opacity = 0; setTimeout(() => d.remove(), 450); }, ms);
}
export function achievement(id) {
  placeToasts();
  const d = document.createElement('div');
  d.className = 'toast ach';
  d.innerHTML = `<span class="medal">🏅</span><div><small>${esc(tp('ach.unlocked'))}</small><b>${esc(tp('ach.' + id))}</b><div style="font-size:12px;opacity:.85">${esc(tp('ach.' + id + 'Desc'))}</div></div>`;
  el.toasts.appendChild(d);
  fitToasts();
  setTimeout(() => { d.style.transition = 'opacity .5s'; d.style.opacity = 0; setTimeout(() => d.remove(), 550); }, 4800);
}

export function setCrosshair(kind) { el.xhair.className = kind || ''; }
export function showZoomFrame(on) { el.zoomframe.classList.toggle('on', !!on); }

let lastPromptKey = '';
export function showPrompt(p) {
  if (!p) { if (!el.prompt.hidden) el.prompt.hidden = true; lastPromptKey = ''; return; }
  const key = JSON.stringify(p) + lang.mode;
  el.prompt.hidden = false;
  if (key === lastPromptKey) return;
  lastPromptKey = key;
  el.pcard.hidden = !p.name;
  el['p-name'].textContent = p.name || '';
  el['p-sub'].textContent = p.sub || '';
  el['p-price'].textContent = p.price || ''; el['p-price'].hidden = !p.price;
  el['p-cat'].textContent = p.cat || '';
  el['p-keys'].innerHTML = (p.keys || []).map(([k, label]) => `<span><kbd>${esc(k)}</kbd>${esc(label)}</span>`).join('');
  if (p.name) { el.pcard.style.animation = 'none'; void el.pcard.offsetWidth; el.pcard.style.animation = ''; }
}

let subTimer = 0;
export function say(phrase, vars = {}, ms = 4200, o = {}) {
  const rep = (x) => (x || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  // English first (when the game is in English or bilingual), then the pronunciation, then the Thai the cashier says.
  el['sub-en'].textContent = lang.code === 'en' ? rep(phrase.en) : '';
  el['sub-rom'].textContent = settings.romanize ? rep(phrase.rom) : '';
  el['sub-rom'].hidden = !settings.romanize;
  el['sub-th'].textContent = rep(phrase.th);
  el.subtitle.hidden = !settings.subtitles;
  clearTimeout(subTimer);
  subTimer = setTimeout(() => (el.subtitle.hidden = true), ms);
  if (ui.hooks.speak && o.speak !== false) ui.hooks.speak(rep(phrase.th), rep(phrase.rom));
  return { th: rep(phrase.th), rom: rep(phrase.rom), en: rep(phrase.en) };
}

let zoneTimer = 0;
// Location card, like a level title: small ENTERING, the place, and an optional subline (e.g. Bangkok, Thailand).
export function showZone(nameObj, subObj) {
  const z = el.zonebanner;
  z.innerHTML = `<small>${esc(tp('hud.zone'))}</small>${esc(t(nameObj))}${subObj ? `<span class="zsub">${esc(t(subObj))}</span>` : ''}`;
  z.classList.add('on');
  clearTimeout(zoneTimer);
  zoneTimer = setTimeout(() => z.classList.remove('on'), 2400);
}

export function updateHint(kind) { ui.hintKind = kind; }
// Bottom-right key hints (desktop) + the WASD pad. Hidden by H.
export function updateHints() {
  el.movepad.hidden = !settings.hints;
  const item = (k, key, dim) => `<div class="hint${dim ? ' dim' : ''}" data-code="Key${k}" role="button"><kbd>${esc(k)}</kbd><div>${dual(STR[key])}</div></div>`;
  // hints hidden: keep one small H button so players can find their way back
  if (!settings.hints) { el.hints.innerHTML = item('H', 'hud.showHints', true); el.hints.classList.add('mini'); return; }
  el.hints.classList.remove('mini');
  el.hints.innerHTML = item('T', 'hud.takeTalk') + item('I', 'hud.inspect') + item('P', 'hud.putback') + item('B', carryKey()) + item('L', 'hud.look') + item('H', 'hud.hideHints', true);
}

const OBJ_HTML = { key: '' };
export function updateObjective() {
  const q = S.activeQuest ? QUESTS.find((x) => x.id === S.activeQuest) : null;
  if (!q) { el.objective.hidden = true; return; }
  el.objective.hidden = false;
  requestAnimationFrame(placeToasts);
  el.objective.innerHTML = `<h4>${esc(tp('quest.active'))}</h4><b>${esc(pick(q.title))}</b><ul>${q.goals.map((g, i) => `<li class="${S.questGot.includes(i) ? 'done' : ''}">${S.questGot.includes(i) ? '✔' : '○'} ${esc(pick(g.label))}</li>`).join('')}</ul>`;
}

export function updateHud(info) {
  el['hud-clock'].textContent = fmtClock(info.hour);
  el['hud-temp'].textContent = tp('hud.temp', { t: info.outC, i: 22 });
  el['w-cash'].textContent = save.cash;
  el['w-basket'].textContent = count();
  if (S.hasBasket !== carried) refreshCarry();
  el['hud-codex-n'].innerHTML = `${discoveredCount()}<span class="of">/${SKUS.length}</span>`;
}

// ------------------------------------------------------------------------------------------ time of day (clock chip)
const TIME_PRESETS = [[7.5, 'set.time.morning', '🌅'], [12.5, 'set.time.noon', '☀️'], [15.5, 'set.time.afternoon', '🌤️'], [18.5, 'set.time.evening', '🌇'], [21.5, 'set.time.night', '🌙'], [2, 'set.time.late', '🌌']];
function buildTime() {
  const body = $('time-body'), h = G.hourNow ?? 18.5;
  const gap = (a) => Math.min(Math.abs(a - h), 24 - Math.abs(a - h));
  const near = TIME_PRESETS.reduce((a, p) => (gap(p[0]) < gap(a[0]) ? p : a));
  body.innerHTML = `<div class="trio timegrid">${TIME_PRESETS.map((p) => `<button class="gbtn${p === near ? ' on' : ''}" data-h="${p[0]}"><span class="tic">${p[2]}</span>${dual(STR[p[1]])}</button>`).join('')}</div>` +
    `<div class="sw"><span>${dual(STR['set.clock'])}</span><button class="tog ${settings.clockRuns ? 'on' : ''}" data-act="clock" aria-label="clock"></button></div>`;
  body.querySelectorAll('[data-h]').forEach((b) => b.addEventListener('click', () => {
    const v = +b.dataset.h;
    if (ui.hooks.setHour) ui.hooks.setHour(v);
    settings.timeHour = v; markDirty();
    el['hud-clock'].textContent = fmtClock(v);
    ui.close();
  }));
  body.querySelector('[data-act=clock]').addEventListener('click', () => { settings.clockRuns = !settings.clockRuns; markDirty(); buildTime(); });
}

// ------------------------------------------------------------------------------------------ hands vs basket
// Everything that names what you carry says "Hands" until you pick up a basket, then "Basket".
export const carryKey = () => (S.hasBasket ? 'hud.basket' : 'hud.hands');
let carried = null;
export function refreshCarry() {
  carried = S.hasBasket;
  el['w-basket-l'].textContent = tp(carryKey());
  el['w-basket-i'].innerHTML = S.hasBasket ? ICON.basket : ICON.hand;
  const title = $('basket-title'), tab = $('basket-tab');
  if (title) title.innerHTML = dual(STR[S.hasBasket ? 'basket.title' : 'hands.title']);   // bilingual like the other panel titles
  if (tab) tab.innerHTML = dual(STR[carryKey()]);
  updateHints();
  if (ui.hooks.carryChanged) ui.hooks.carryChanged();
}

// ------------------------------------------------------------------------------------------ settings panel
function buildSettings() {
  const body = $('settings-body');
  const row = (label, help, control) => `<div class="row"><div><label>${esc(label)}</label>${help ? `<small>${esc(help)}</small>` : ''}</div>${control}</div>`;
  const slider = (id, min, max, step, val) => `<input type="range" id="s-${id}" min="${min}" max="${max}" step="${step}" value="${val}">`;
  const sw = (id, on) => `<label class="switch"><input type="checkbox" id="s-${id}" ${on ? 'checked' : ''}><i></i></label>`;
  const seg = (id, opts, cur) => `<div class="seg" id="s-${id}">${opts.map(([v, l]) => `<button data-v="${v}" class="${v === cur ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
  body.innerHTML =
    `<h3>${esc(tp('set.sec.lang'))}</h3>` +
    row(tp('set.language'), tp('set.languageHelp'), seg('lang', [['en', 'English'], ['th', 'ไทย'], ['both', 'EN + ไทย']], lang.mode)) +
    row(tp('set.time'), '', `<select id="s-timepreset">${[['7.5', 'set.time.morning'], ['12.5', 'set.time.noon'], ['15.5', 'set.time.afternoon'], ['18.5', 'set.time.evening'], ['21.5', 'set.time.night'], ['2', 'set.time.late']].map(([v, k]) => `<option value="${v}">${esc(tp(k))}</option>`).join('')}</select>`) +
    row(tp('pause.hours'), '', slider('hour', 0, 24, 0.25, G.hourNow || 18.5)) +
    row(tp('set.clock'), '', sw('clock', settings.clockRuns)) +
    `<h3>${esc(tp('set.sec.gfx'))}</h3>` +
    row(tp('set.quality'), tp('set.needReload'), seg('quality', [['low', tp('set.q.low')], ['med', tp('set.q.med')], ['high', tp('set.q.high')]], settings.quality)) +
    row(tp('set.fov'), '', slider('fov', 55, 105, 1, settings.fov)) +
    `<h3>${esc(tp('set.sec.ctl'))}</h3>` +
    row(tp('set.sens'), '', slider('sens', 0.2, 3, 0.05, settings.sens)) +
    row(tp('set.invert'), '', sw('invert', settings.invertY)) +
    row(tp('set.bob'), '', sw('bob', settings.bob)) +
    `<h3>${esc(tp('set.sec.snd'))}</h3>` +
    row(tp('set.master'), '', slider('master', 0, 1, 0.02, settings.master)) +
    row(tp('set.ambience'), '', slider('ambience', 0, 1, 0.02, settings.ambience)) +
    row(tp('set.muted'), '', sw('muted', settings.muted)) +
    row(tp('set.musicOn'), '', sw('musicOn', settings.musicOn)) +
    row(tp('set.track'), '', `<select id="s-track">${MUSIC_TRACKS.map((tr, i) => `<option value="${i}" ${i === settings.track ? 'selected' : ''}>${esc(tr.name)}</option>`).join('')}</select>`) +
    row(tp('set.music'), '', slider('music', 0, 1, 0.02, settings.music)) +
    row(tp('set.sfx'), '', slider('sfx', 0, 1, 0.02, settings.sfx)) +
    `<h3>${esc(tp('set.sec.play'))}</h3>` +
    row(tp('set.subtitles'), '', sw('subtitles', settings.subtitles)) +
    row(tp('set.romanize'), '', sw('romanize', settings.romanize)) +
    row(tp('set.voice'), '', sw('voice', settings.voice)) +
    row(tp('set.hints'), '', sw('hints', settings.hints)) +
    `<div class="row"><div></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" id="s-reload">${esc(tp('set.reload'))}</button><button class="btn" id="s-reset">${esc(tp('set.reset'))}</button></div></div>`;
  const bind = (id, fn, evt = 'input') => { const e = $('s-' + id); if (e) e.addEventListener(evt, () => fn(e)); };
  const segBind = (id, fn) => { const e = $('s-' + id); e.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { e.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); fn(b.dataset.v); })); };
  segBind('lang', (v) => changeLanguage(v));
  segBind('quality', (v) => { settings.quality = v; markDirty(); });
  bind('timepreset', (e) => { if (ui.hooks.setHour) ui.hooks.setHour(+e.value); $('s-hour').value = e.value; }, 'change');
  bind('hour', (e) => { if (ui.hooks.setHour) ui.hooks.setHour(+e.value); });
  bind('clock', (e) => { settings.clockRuns = e.checked; markDirty(); }, 'change');
  bind('fov', (e) => { settings.fov = +e.value; markDirty(); });
  bind('sens', (e) => { settings.sens = +e.value; markDirty(); });
  bind('invert', (e) => { settings.invertY = e.checked; markDirty(); }, 'change');
  bind('bob', (e) => { settings.bob = e.checked; markDirty(); }, 'change');
  for (const k of ['master', 'ambience', 'music', 'sfx']) bind(k, (e) => { settings[k] = +e.value; markDirty(); if (ui.hooks.audioChanged) ui.hooks.audioChanged(); });
  bind('muted', (e) => { setMuted(e.checked); markDirty(); refreshTop(); }, 'change');
  bind('musicOn', (e) => { ui.musicTouched = true; setMusicOn(e.checked); markDirty(); refreshTop(); }, 'change');
  bind('track', (e) => { pickTrack(+e.value); }, 'change');
  bind('subtitles', (e) => { settings.subtitles = e.checked; markDirty(); }, 'change');
  bind('romanize', (e) => { settings.romanize = e.checked; markDirty(); }, 'change');
  bind('voice', (e) => { settings.voice = e.checked; markDirty(); }, 'change');
  bind('hints', (e) => { settings.hints = e.checked; markDirty(); updateHints(); }, 'change');
  bind('reload', () => location.reload(), 'click');
  bind('reset', () => { if (confirm(tp('set.resetConfirm'))) { resetProgress(); toast(tp('toast.reset')); ui.refreshers.forEach((f) => f()); } }, 'click');
}

export { el as elements, esc, $ };

// Language system: English / Thai / Both (English first, romanised Thai, then Thai script).
// Everything visible — DOM menus, HUD, signs, price tags, packaging textures — reads
// from here, and re-renders when the language changes.
import { STR } from './strings.js';
import { STR_UI } from './strings_ui.js';
import { ROM } from './rom_data.js';
import { settings } from './settings.js';
Object.assign(STR, STR_UI);

export const lang = { mode: 'en', code: 'en', second: null };
const listeners = new Set();

export function setLanguageMode(mode) {
  if (mode !== 'en' && mode !== 'th' && mode !== 'both') mode = 'en';
  lang.mode = mode;
  lang.code = mode === 'both' ? 'en' : mode;      // bilingual mode leads with English
  lang.second = mode === 'both' ? 'th' : null;
  document.documentElement.lang = lang.code;
  for (const fn of listeners) fn(lang);
}
export const onLanguageChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

// Choose text out of a string or {en, th}.
export function pick(v, code = lang.code) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[code] ?? v.en ?? v.th ?? '';
}
// Secondary language text (only in bilingual mode), else ''.
export function pick2(v) {
  if (!lang.second || v == null || typeof v === 'string') return '';
  return v[lang.second] ?? '';
}
// "primary · secondary" convenience for plain-text contexts.
export function both(v, sep = ' · ') {
  const a = pick(v), b = pick2(v);
  return b && b !== a ? a + sep + b : a;
}
export const other = (code) => (code === 'th' ? 'en' : 'th');

// Romanised pronunciation of a Thai string (shown between the English and the Thai script in bilingual mode).
export const romFor = (th, vars, explicit) => { const r = explicit || (th && ROM[th]); return r ? fill(r, vars) : ''; };
export const showRom = () => lang.second === 'th' && settings.romanize;

function fill(s, vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}
// Plain-string translation of a UI key.
export function t(key, vars) {
  const e = STR[key];
  if (!e) return key;
  const a = fill(e[lang.code] ?? e.en, vars);
  if (lang.second) {
    const b = fill(e[lang.second] ?? '', vars);
    if (b && b !== a) return `${a} · ${b}`;
  }
  return a;
}
export const tOnly = (key, code, vars) => { const e = STR[key]; return e ? fill(e[code] ?? e.en, vars) : key; };
export const tRom = (key, vars) => { const e = STR[key]; return e && showRom() ? romFor(e.th, vars, e.rom) : ''; };
export const tp = (key, vars) => { const e = STR[key]; return e ? fill(e[lang.code] ?? e.en, vars) : key; }; // primary only
export const t2 = (key, vars) => { const e = STR[key]; return e && lang.second ? fill(e[lang.second] ?? '', vars) : ''; };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Apply translations to any [data-i18n] / [data-i18n-title] / [data-i18n-ph] elements.
export function applyDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const a = tp(key), b = t2(key);
    if (b && b !== a) {
      const e = STR[key], rom = showRom() ? romFor(e && e.th, undefined, e && e.rom) : '';
      el.innerHTML = `<span class="l1">${esc(a)}</span>${rom ? `<span class="rom">${esc(rom)}</span>` : ''}<span class="l2">${esc(b)}</span>`;
    } else el.textContent = a;
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.getAttribute('data-i18n-title')); });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = tp(el.getAttribute('data-i18n-ph')); });
}

// Dual-line HTML helper for dynamically generated DOM.
export function dual(v, cls1 = 'l1', cls2 = 'l2') {
  const a = pick(v), b = pick2(v);
  if (!(b && b !== a)) return `<span class="${cls1}">${esc(a)}</span>`;
  const rom = showRom() ? (v.rom || romFor(v.th)) : '';
  return `<span class="${cls1}">${esc(a)}</span>${rom ? `<span class="rom">${esc(rom)}</span>` : ''}<span class="${cls2}">${esc(b)}</span>`;
}

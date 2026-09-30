// The dark panels: pause (sound lives in the Sound popover, soundpop.js), controls (keyboard / touch) and About with the employee badge.
import { STR } from '../core/strings.js';
import { lang, tp, dual, showRom } from '../core/i18n.js';
import { ui, esc, $, changeLanguage } from './ui.js';
import { ICON, FLAG, flagsFor, logoSvg, LINKS, SUPPORT } from './icons.js';
import AVATAR from '../assets/nomaditsu-avatar.jpg';

const D = (key) => dual(STR[key]);                 // English, pronunciation, Thai (per language mode)
const isTouchDevice = () => document.documentElement.hasAttribute('data-touch');

// ------------------------------------------------------------------------------------------ pause + audio
export function buildPause() {
  const body = $('pause-body');
  const btn = (cls, id, key, extra = '') => `<button class="${cls}" data-act="${id}" ${extra}>${D(key)}</button>`;
  body.innerHTML =
    `<button class="big" data-act="resume">${D('menu.resumeStore')}</button>` +
    `<div class="trio">${btn('gbtn', 'settings', 'menu.settings')}${btn('gbtn', 'controls', 'menu.controls')}${btn('gbtn', 'about', 'menu.about')}</div>` +
    `<div class="trio">${btn('gbtn', 'codex', 'menu.codex')}${btn('gbtn', 'quests', 'menu.quests')}${btn('gbtn ghost', 'title', 'menu.title')}</div>` +
    `<div class="sec"><h3>${esc(tp('pause.language'))}</h3><div class="seg wideseg">${['en', 'both', 'th'].map((m) => `<button data-lang="${m}" class="${lang.mode === m ? 'on' : ''}">${flagsFor(m, 24)}<span>${m === 'en' ? 'English' : m === 'th' ? 'ไทย' : 'EN + ไทย'}</span></button>`).join('')}</div></div>`;
  body.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.act;
    if (a === 'resume') ui.close();
    else if (a === 'title') ui.hooks.toTitle && ui.hooks.toTitle();
    else ui.open(a);
  }));
  body.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => changeLanguage(b.dataset.lang)));
}

// ------------------------------------------------------------------------------------------ controls
let ctlTab = null;
const KEYS = (k) => `<kbd>${esc(k)}</kbd>`;
const OR = () => `<span class="or">${esc(tp('ctl.or'))}</span>`;
// [alternatives (each a list of keys), label key, isNew]
const KB_GROUPS = [
  { c: 'var(--gl)', key: 'ctlg.move', rows: [
    [[['↑', '←', '↓', '→']], 'ctl.move'], [['mouse'], 'ctl.look'], [[['W', 'A', 'S', 'D']], 'ctl.lookKeys'], [[['Shift']], 'ctl.sprint'], [[['C'], ['Ctrl']], 'ctl.crouch'], [[['Z'], ['Right-click']], 'ctl.zoom'] ] },
  { c: 'var(--o)', key: 'ctlg.shop', rows: [
    [[['T'], ['Click']], 'ctl.take'], [[['I']], 'ctl.inspect'], [[['Space']], 'ctl.flip'], [[['P']], 'ctl.putback'] ] },
  { c: '#ff5a5f', key: 'ctlg.stuff', rows: [
    [[['B'], ['Tab']], 'ctl.basket'], [[['K']], 'ctl.codex'], [[['Q']], 'ctl.quests'] ] },
  { c: 'var(--cream)', key: 'ctlg.game', rows: [
    [[['Esc']], 'ctl.menu'], [[['L']], 'ctl.lang'], [[['H']], 'ctl.hints'], [[['M']], 'ctl.music', 1], [[['N']], 'ctl.mute', 1], [[['.'], [',']], 'ctl.next', 1] ] },
];
const TOUCH_GROUPS = [
  { c: 'var(--gl)', key: 'ctlg.move', rows: [['stick', 'tch.stick', 'tch.stickD'], ['drag', 'tch.look', 'tch.lookD'], ['pinch', 'tch.pinch', 'tch.pinchD'], ['crouch', 'tch.crouch', 'tch.crouchD']] },
  { c: 'var(--o)', key: 'ctlg.shop', rows: [['hand', 'tch.take', 'tch.takeD'], ['search', 'tch.inspect', 'tch.inspectD'], ['undo', 'tch.back', 'tch.backD']] },
  { c: '#ff5a5f', key: 'ctlg.stuff', rows: [['basket', 'tch.basket', 'tch.basketD'], ['book', 'tch.snack', 'tch.snackD']] },
  { c: 'var(--cream)', key: 'ctlg.game', rows: [['sound', 'hud.snackbook', 'tch.audioD'], ['menu', 'tch.menu', 'tch.menuD']] },
];
function kbRow([alts, label, isNew]) {
  const keys = alts[0] === 'mouse' ? `<span class="glyph"><svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 3v7"/></svg></span> ${esc(tp('ctl.mouse'))}`
    : alts.map((g, i) => (i ? OR() : '') + g.map((k) => KEYS(k)).join('')).join('');
  return `<div class="crow"><div class="ckeys">${keys}${isNew ? '<span class="badge-new">NEW</span>' : ''}</div><div class="clab">${D(label)}</div></div>`;
}
function touchRow([icon, t1, t2]) {
  return `<div class="crow"><div class="ckeys"><span class="glyph">${ICON[icon] || ''}</span> <b style="margin-left:6px;font-size:17px">${esc(tp(t1))}</b></div><div class="clab">${D(t2)}</div></div>`;
}
export function buildControls() {
  if (!ctlTab) ctlTab = isTouchDevice() ? 'touch' : 'kb';
  const groups = ctlTab === 'touch' ? TOUCH_GROUPS : KB_GROUPS;
  const cards = groups.map((g) => `<div class="gcard" style="--c:${g.c}"><h3>${esc(tp(g.key))}</h3>${g.rows.map(ctlTab === 'touch' ? touchRow : kbRow).join('')}</div>`);
  $('controls-body').innerHTML =
    `<div class="ctabs"><button data-t="kb" class="${ctlTab === 'kb' ? 'on' : ''}">${esc(tp('ctl.tab.kb'))}</button><button data-t="touch" class="${ctlTab === 'touch' ? 'on' : ''}">${esc(tp('ctl.tab.touch'))}</button></div>` +
    `<div class="cards"><div class="col">${cards[0]}${cards[1]}</div><div class="col">${cards[2]}${cards[3]}</div></div>` +
    (ctlTab === 'kb' ? `<div class="ctip">${esc(tp('ctl.tip'))}</div>` : '');
  $('controls-body').querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { ctlTab = b.dataset.t; buildControls(); }));
}

// ------------------------------------------------------------------------------------------ about + employee badge
const linkTile = (l) => `<a class="lk ${l.main ? 'main' : l.cls || ''}" href="${l.u}" target="_blank" rel="noopener noreferrer"><i>${l.i}</i>${esc(l.n)}</a>`;
export function buildAbout() {
  $('about-body').innerHTML = `<div class="abody">
    <div class="bwrap"><div class="lan"></div>
      <div class="badge"><div class="slot"></div>
        <div class="bhead">${logoSvg(40, { rounded: true })}<div><b>11 SEVEN</b><small>${esc(tp('about.employee'))}</small></div></div><div class="bstripe"></div>
        <div class="bbody"><div class="ring"><img src="${AVATAR}" alt="Nomaditsu" onerror="this.outerHTML='<div class=ph>N</div>'"><div class="h24">24</div></div>
          <div class="bname">Nomaditsu</div><div class="breal">Ray de Guzman</div>
          <div class="brole">${D('about.role')}</div>
          <div class="bfields"><div><span>${esc(tp('about.id'))}</span><b>0711-NMD</b></div><div><span>${esc(tp('about.shift'))}</span><b>${esc(tp('about.shiftVal'))}</b></div><div><span>${esc(tp('about.base'))}</span><b>${esc(tp('about.baseVal'))}</b></div></div>
          <div class="btag">${esc(tp('about.tagline'))}</div></div>
        <div class="barcode"></div><div class="bfoot"></div></div></div>
    <div class="aside">
      <section><h3>${esc(tp('about.game'))}</h3><p>${D('about.p1')}</p><p>${D('about.credit')}</p></section>
      <section><h3>${esc(tp('about.find'))}</h3><div class="links">${LINKS.filter((l) => l.g === 'follow').map(linkTile).join('')}</div></section>
      <section><h3>${esc(tp('about.musicH'))}</h3><div class="links">${LINKS.filter((l) => l.g === 'music').map(linkTile).join('')}</div></section>
      <section><h3>${esc(tp('about.tipH'))}</h3><p>${D('about.tipText')}</p><div class="links two">${SUPPORT.map(linkTile).join('')}</div></section>
      <section><h3>${esc(tp('about.fineH'))}</h3><p class="fine">${D('about.p3')}</p><p class="fine">${D('about.oss')}</p></section>
    </div></div>`;
}

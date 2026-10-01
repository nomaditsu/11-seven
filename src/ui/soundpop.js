// One Sound button (HUD and title screen) opens this popover: sound effects and music, each with its own switch.
// A switch that is off folds its controls away. The effects switch silences effects, voices and ambience, so its section
// has a slider for each level it covers: effects (beeps and voices) and ambience (air con, fridges, street).
import { settings, markDirty } from '../core/settings.js';
import { tp } from '../core/i18n.js';
import { MUSIC_TRACKS } from '../data/music.js';
import { audio, applyVolumes, sfx, currentTrack } from '../game/audio.js';
import { ICON } from './icons.js';
import { ui, toggleSound, toggleMusic, toggleMusicPause, skipTrack, pickTrack } from './ui.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TP = {
  play: '<svg viewBox="0 0 24 24"><path d="M7.5 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="6.5" y="5.5" width="4" height="13" rx="1"/><rect x="13.5" y="5.5" width="4" height="13" rx="1"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M19 5.5v13l-9-6.5z"/><rect x="5.5" y="5.5" width="3" height="13" rx=".8"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M5 5.5v13l9-6.5z"/><rect x="15.5" y="5.5" width="3" height="13" rx=".8"/></svg>',
};
let pop = null, anchor = null;

export function initSoundPop() {
  pop = $('soundpop');
  for (const id of ['btn-sound', 't-sound']) { const b = $(id); if (b) b.addEventListener('click', () => toggleSoundPop(b)); }
  pop.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a],[data-track]'); if (!b) return;
    const a = b.dataset.a;
    if (b.dataset.track) pickTrack(+b.dataset.track);
    else if (a === 'sfx') { toggleSound(); if (!settings.muted) sfx('pop'); }
    else if (a === 'music') toggleMusic();
    else if (a === 'pp') toggleMusicPause();
    else if (a === 'prev') skipTrack(-1);
    else if (a === 'next') skipTrack(1);
    else if (a === 'close') closeSoundPop();
  });
  pop.addEventListener('input', (e) => {
    const k = e.target.dataset.vol; if (!k) return;
    settings[k] = +e.target.value; markDirty(); applyVolumes();
    const o = e.target.nextElementSibling; if (o) o.textContent = Math.round(settings[k] * 100);
  });
  pop.addEventListener('change', (e) => { if (e.target.dataset.vol === 'sfx') sfx('pop'); });
  // A press outside closes it and does nothing else, so dismissing never takes, talks or looks around.
  document.addEventListener('pointerdown', (e) => {
    if (!anchor || pop.contains(e.target) || anchor.contains(e.target)) return;
    closeSoundPop(); ui.popClosedAt = performance.now();
    e.stopPropagation(); e.preventDefault();
  }, true);
  addEventListener('resize', () => { if (anchor) place(); });
  ui.onAudioUi = () => { if (anchor) sync(); };
  ui.closePop = closeSoundPop;
}

export const soundPopOpen = () => !!anchor;
export function toggleSoundPop(btn) {
  const same = anchor === btn;
  closeSoundPop();
  if (!same) openSoundPop(btn);
}
function openSoundPop(btn) {
  anchor = btn; ui.popOpen = true;
  render(); pop.hidden = false; place();
  btn.setAttribute('aria-expanded', 'true'); btn.classList.add('open');
}
export function closeSoundPop() {
  if (!anchor) return;
  anchor.setAttribute('aria-expanded', 'false'); anchor.classList.remove('open');
  anchor = null; ui.popOpen = false;
  pop.hidden = true; pop.innerHTML = '';
}

const slider = (k, label, icon = ICON.sound, name = '', sub = '') => `<div class="vl">${icon}${name ? `<span class="vlab">${esc(name)}<small>${esc(sub)}</small></span>` : ''}<input type="range" min="0" max="1" step="0.02" value="${settings[k]}" data-vol="${k}" aria-label="${esc(label)}"><output>${Math.round(settings[k] * 100)}</output></div>`;
const tog = (a, on, label) => `<button class="tog ${on ? 'on' : ''}" data-a="${a}" type="button" role="switch" aria-checked="${on}" aria-label="${esc(label)}"></button>`;

function render() {
  const T = currentTrack(), fx = !settings.muted, mu = settings.musicOn;
  pop.innerHTML = `<div class="caret"></div><div class="pin">
    <div class="phd"><h3>${esc(tp('pause.sound'))}</h3><button class="xx" data-a="close" type="button" aria-label="${esc(tp('pop.close'))}">✕</button></div>
    <div class="psec ssec ${fx ? '' : 'off'}"><div class="prow"><span class="si">${ICON.sound}</span><div class="sl"><b>${esc(tp('pause.sfx'))}</b><small>${esc(tp('pop.sfxSub'))}</small></div>${tog('sfx', fx, tp('pause.sfx'))}</div>
      <div class="fold"><div>${slider('sfx', tp('pause.sfxVol'), ICON.sound, tp('pop.fx'), tp('pop.fxSub'))}${slider('ambience', tp('pop.ambVol'), ICON.air, tp('pop.amb'), tp('pop.ambSub'))}</div></div></div>
    <div class="psec msec ${mu ? '' : 'off'}"><div class="prow"><span class="si">${ICON.music}</span><div class="sl"><b>${esc(tp('pause.music'))}</b><small class="mstate">${esc(tp(mu ? 'pop.on' : 'pop.off'))}</small></div>${tog('music', mu, tp('pause.music'))}</div>
      <div class="fold"><div>
        ${slider('music', tp('pause.musicVol'))}
        <div class="nowc"><div class="eq"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="nt"><b class="tname">${esc(T.name)}</b><small class="tmood">${esc(tp(T.moodKey))}</small></div>
          <button class="tb pp" data-a="pp" type="button"></button><button class="tb" data-a="prev" type="button" aria-label="${esc(tp('btn.prev'))}">${TP.prev}</button><button class="tb" data-a="next" type="button" aria-label="${esc(tp('btn.next'))}">${TP.next}</button></div>
        <div class="tl">${MUSIC_TRACKS.map((tr, i) => `<button class="tr" data-track="${i}" type="button"><i></i><div>${esc(tr.name)}<small>${esc(tp(tr.moodKey))}</small></div></button>`).join('')}</div>
      </div></div></div>
    <div class="kh"><span><kbd>N</kbd>${esc(tp('pause.sfx'))}</span><span><kbd>M</kbd>${esc(tp('pause.music'))}</span><span><kbd>,</kbd><kbd>.</kbd>${esc(tp('pop.track'))}</span></div>
  </div>`;
  sync();
}
// Update in place (not re-render), so a switch folds its section with an animation.
function sync() {
  const fx = !settings.muted, mu = settings.musicOn, T = currentTrack();
  const set = (sel, on) => { const s = pop.querySelector(sel); s.classList.toggle('off', !on); const g = s.querySelector('.tog'); g.classList.toggle('on', on); g.setAttribute('aria-checked', on); };
  set('.ssec', fx); set('.msec', mu);
  pop.querySelector('.mstate').textContent = tp(mu ? 'pop.on' : 'pop.off');
  const pp = pop.querySelector('.pp'), paused = audio.paused;
  pp.innerHTML = paused ? TP.play : TP.pause; pp.setAttribute('aria-label', tp(paused ? 'btn.play' : 'btn.pause'));
  pop.querySelector('.nowc').classList.toggle('paused', paused);
  pop.querySelector('.tname').textContent = T.name;
  pop.querySelector('.tmood').textContent = tp(T.moodKey);
  pop.querySelectorAll('.tr').forEach((b, i) => { const on = MUSIC_TRACKS[i] === T; b.classList.toggle('on', on); b.querySelector('i').textContent = on ? '♪' : i + 1; });
}

// Under the button that opened it, caret pointing at the button; full width on phones.
function place() {
  const r = anchor.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const w = W <= 640 ? W - 16 : Math.min(H <= 440 ? 560 : 360, W - 16);
  const left = W <= 640 ? 8 : Math.min(W - 8 - w, Math.max(8, r.right - w + 8));
  const top = r.bottom + 10;
  pop.style.left = left + 'px'; pop.style.top = top + 'px'; pop.style.width = w + 'px';
  pop.style.setProperty('--cx', (r.left + r.width / 2 - left) + 'px');
  pop.querySelector('.pin').style.maxHeight = (H - top - 8) + 'px';
}

// Touch controls for phones and tablets: walk stick, drag-to-look, pinch to zoom and action buttons.
// Everything feeds the same inputs as the keyboard and mouse (input.keys, input.dx / dy, mouseDown[2]).
import { input } from '../input.js';
import { G } from '../core/state.js';
import { tp } from '../core/i18n.js';
import { ui, $ } from './ui.js';
import { count, S } from '../game/session.js';

const STICK_R = 56;          // px the thumb can travel from the centre
const LOOK_GAIN = 1.5;       // drag pixels -> mouse-movement units
let actionKind = null;       // 'sku' | 'talk' | 'use' | null  (what the Interact button would do right now)
let actionObj = null;        // for 'use': the object kind (coffee, atm, stool...)
let inter = null;
let crouch = false;

export function touchWanted() {
  if (new URLSearchParams(location.search).has('touch')) return true;
  return matchMedia('(hover: none) and (pointer: coarse)').matches;
}

// The on-screen controls show on touch devices, and on any window 899px wide or less, where the desktop key hints and
// arrow pad hide: html[data-tc] means "on-screen controls are showing". A mouse still works there (the buttons and
// stick use pointer events; dragging the world with a mouse looks around through input.js).
// html[data-touch] and input.touch are only for real touch devices: they switch the world to finger look and pinch.
const NARROW = matchMedia('(max-width: 899px)');
export function initTouch(interaction) {
  inter = interaction;
  const touch = touchWanted();
  const setTc = () => document.documentElement.toggleAttribute('data-tc', touch || NARROW.matches);
  setTc(); NARROW.addEventListener('change', setTc);
  if (touch) { document.documentElement.setAttribute('data-touch', '1'); input.touch = true; bindLook($('gl')); }
  render();
  ui.refreshers.set('touch', render);
  ui.hooks.touchAction = (k, obj = null) => { if (k !== actionKind || obj !== actionObj) { actionKind = k; actionObj = obj; refreshTake(); } };
  return touch;
}

// The round action buttons use emoji (the top bar keeps line icons).
function btn(id, cls, emoji, label) {
  return `<button class="act ${cls}" id="${id}" type="button"><span class="em" aria-hidden="true">${emoji}</span><small>${label}</small></button>`;
}
const carryFace = () => (S.hasBasket ? ['🧺', 'hud.basket'] : ['🤲', 'hud.hands']);
// The big button is Interact until something is in reach, then it names what it will do.
const USE = { pos: ['💳', 'tv.pay'], atm: ['🏧', 'tv.withdraw'], microwave: ['♨️', 'tv.heat'], hotwater: ['💧', 'tv.pour'],
  coffee: ['☕', 'tv.order'], dog: ['🐾', 'tv.pet'], stool: ['🪑', 'tv.sit'] };
function takeFace() {
  if (actionKind === 'sku') return ['✋', 'tv.take'];
  if (actionKind === 'talk') return ['💬', 'tv.talk'];
  if (actionKind === 'use') return actionObj === 'basket' ? ['🧺', S.hasBasket ? 'tv.drop' : 'tv.grab'] : USE[actionObj] || ['👆', 'tv.use'];
  return ['👆', 'tv.interact'];
}
const setFace = (id, [emoji, key]) => { const b = $(id); if (!b) return; b.querySelector('.em').textContent = emoji; b.querySelector('small').textContent = tp(key); };
function render() {
  const box = $('touch'); if (!box) return;
  box.innerHTML = `<div class="stick" id="t-stick"><span>${tp('hud.move')}</span><i></i></div>
    ${btn('t-crouch', 'crouch', '🧎', tp('tv.crouch'))}
    <div class="acts">
      ${btn('t-take', 'take', '👆', tp('tv.interact'))}
      ${btn('t-inspect', 'a2', '🔍', tp('hud.inspect'))}
      ${btn('t-back', 'a3', '↩️', tp('tch.back'))}
      ${btn('t-basket', 'a4', carryFace()[0], tp(carryFace()[1]))}
    </div>`;
  bindStick($('t-stick'));
  press('t-take', () => (G.mode === 'inspect' ? inter.inspectTake() : inter.primary()));
  press('t-inspect', () => { if (G.mode === 'inspect') { inter.hands.flip(); } else inter.inspectKey(); });
  press('t-back', () => (G.mode === 'inspect' ? inter.endInspect(true) : inter.putBackLast()));
  press('t-basket', () => (G.mode === 'inspect' ? inter.endInspect(true) : ui.toggle('basket')));
  press('t-crouch', () => { crouch = !crouch; crouch ? input.keys.add('KeyC') : input.keys.delete('KeyC'); $('t-crouch').classList.toggle('hot', crouch); });
  refreshTake(); syncTouchMode();
}
function press(id, fn) {
  const b = $(id); if (!b) return;
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
}
function refreshTake() {
  const b = $('t-take'); if (!b) return;
  if (G.mode !== 'inspect') setFace('t-take', takeFace());
  b.classList.toggle('hot', !!actionKind && G.mode !== 'inspect');   // pulses while something is in reach
}
// Called from the main loop when the game mode changes, so the buttons match (inspect mode: flip / back).
export function syncTouchMode() {
  const inspect = G.mode === 'inspect';
  if (inspect) { setFace('t-inspect', ['🔄', 'tv.flip']); setFace('t-basket', ['↩️', 'tch.back']); setFace('t-take', ['✋', 'tv.take']); }
  else { setFace('t-inspect', ['🔍', 'hud.inspect']); setFace('t-basket', carryFace()); }
  refreshTake();
}

// ------------------------------------------------------------------ walk stick
function bindStick(el) {
  if (!el) return;
  const knob = el.querySelector('i');
  let pid = null, cx = 0, cy = 0;
  const setKeys = (dx, dy) => {
    const mag = Math.hypot(dx, dy) / STICK_R;
    const on = (code, v) => (v ? input.keys.add(code) : input.keys.delete(code));
    on('ArrowUp', dy < -STICK_R * 0.3); on('ArrowDown', dy > STICK_R * 0.3);
    on('ArrowLeft', dx < -STICK_R * 0.3); on('ArrowRight', dx > STICK_R * 0.3);
    on('ShiftLeft', mag > 0.95 && dy < -STICK_R * 0.5);          // push to the edge to sprint
  };
  const move = (e) => {
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
    if (d > STICK_R) { dx *= STICK_R / d; dy *= STICK_R / d; }
    knob.style.transform = `translate(${dx}px,${dy}px)`; setKeys(dx, dy);
  };
  const stop = () => { pid = null; knob.style.transform = ''; for (const k of ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ShiftLeft']) input.keys.delete(k); };
  el.addEventListener('pointerdown', (e) => { pid = e.pointerId; try { el.setPointerCapture(pid); } catch (err) { /* synthetic pointer */ } const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); e.preventDefault(); });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === pid) move(e); });
  el.addEventListener('pointerup', (e) => { if (e.pointerId === pid) stop(); });
  el.addEventListener('pointercancel', stop);
}

// ------------------------------------------------------------------ drag to look, pinch to zoom
function bindLook(canvas) {
  const pts = new Map();
  let base = 0;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
    if (pts.size === 2) base = pinchDist(pts);
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 1) { input.dx += dx * LOOK_GAIN; input.dy += dy * LOOK_GAIN; }
    else if (pts.size === 2 && base) { const r = pinchDist(pts) / base; if (r > 1.15) input.mouseDown[2] = true; else if (r < 0.9) input.mouseDown[2] = false; }
  });
  const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) { base = 0; input.mouseDown[2] = false; } };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
}
const pinchDist = (pts) => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };

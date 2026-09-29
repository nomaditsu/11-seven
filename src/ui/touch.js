// Touch controls for phones and tablets: walk stick, drag-to-look, pinch to zoom and action buttons.
// Everything feeds the same inputs as the keyboard and mouse (input.keys, input.dx / dy, mouseDown[2]).
import { input } from '../input.js';
import { G } from '../core/state.js';
import { tp } from '../core/i18n.js';
import { ui, $ } from './ui.js';
import { ICON } from './icons.js';
import { count, S } from '../game/session.js';

const STICK_R = 56;          // px the thumb can travel from the centre
const LOOK_GAIN = 1.5;       // drag pixels -> mouse-movement units
let actionKind = null;       // 'sku' | 'talk' | 'use' | null  (what the Take button would do right now)
let inter = null;
let crouch = false;

export function touchWanted() {
  if (new URLSearchParams(location.search).has('touch')) return true;
  return matchMedia('(hover: none) and (pointer: coarse)').matches;
}

export function initTouch(interaction) {
  if (!touchWanted()) return false;
  inter = interaction;
  document.documentElement.setAttribute('data-touch', '1');
  input.touch = true;
  render();
  ui.refreshers.set('touch', render);
  ui.hooks.touchAction = (k) => { if (k !== actionKind) { actionKind = k; refreshTake(); } };
  bindLook($('gl'));
  return true;
}

function btn(id, cls, icon, label) {
  return `<button class="act ${cls}" id="${id}" type="button">${ICON[icon] || ''}<small>${label}</small></button>`;
}
function render() {
  const box = $('touch'); if (!box) return;
  box.innerHTML = `<div class="stick" id="t-stick"><span>${tp('hud.move')}</span><i></i></div>
    <div class="acts">
      ${btn('t-take', 'take', 'hand', tp('hud.take'))}
      ${btn('t-inspect', 'a2', 'search', tp('hud.inspect'))}
      ${btn('t-back', 'a3', 'undo', tp('tch.back'))}
      ${btn('t-basket', 'a4', S.hasBasket ? 'basket' : 'hand', tp(S.hasBasket ? 'hud.basket' : 'hud.hands'))}
      ${btn('t-crouch', 'a5', 'crouch', tp('ctl.crouch').split(' ')[0])}
    </div>`;
  bindStick($('t-stick'));
  press('t-take', () => (G.mode === 'inspect' ? inter.inspectTake() : inter.primary()));
  press('t-inspect', () => { if (G.mode === 'inspect') { inter.hands.flip(); } else inter.inspectKey(); });
  press('t-back', () => (G.mode === 'inspect' ? inter.endInspect(true) : inter.putBackLast()));
  press('t-basket', () => (G.mode === 'inspect' ? inter.endInspect(true) : ui.toggle('basket')));
  press('t-crouch', () => { crouch = !crouch; crouch ? input.keys.add('KeyC') : input.keys.delete('KeyC'); $('t-crouch').classList.toggle('hot', crouch); });
  refreshTake();
}
function press(id, fn) {
  const b = $(id); if (!b) return;
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
}
function refreshTake() {
  const b = $('t-take'); if (!b) return;
  const talk = actionKind === 'talk';
  b.querySelector('svg').outerHTML = (talk ? ICON.talk : ICON.hand);
  b.querySelector('small').textContent = talk ? tp('hud.tapToTalk') : actionKind === 'use' ? tp('hud.use') : tp('hud.take');
  b.classList.toggle('hot', !!actionKind);
}
// Called from the main loop when the game mode changes, so the buttons match (inspect mode: flip / back).
export function syncTouchMode() {
  const inspect = G.mode === 'inspect';
  const set = (id, icon, label) => { const b = $(id); if (!b) return; const s = b.querySelector('svg'); if (s) s.outerHTML = ICON[icon]; b.querySelector('small').textContent = label; };
  if (inspect) { set('t-inspect', 'undo', tp('ctl.flip').split(' ')[0]); set('t-basket', 'crouch', tp('tch.back')); }
  else { set('t-inspect', 'search', tp('hud.inspect')); set('t-basket', S.hasBasket ? 'basket' : 'hand', tp(S.hasBasket ? 'hud.basket' : 'hud.hands')); }
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

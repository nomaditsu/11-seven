// Keyboard / mouse input. Desktop looks around by click-and-drag (no pointer lock), so the cursor stays free for the
// HUD buttons. A press that barely moves is a click (take / talk); a press that drags is a look. Holding the right
// button zooms, and dragging with it held looks around at a slower, finer speed.
export const input = {
  keys: new Set(),
  dx: 0, dy: 0,
  wheel: 0,
  locked: false,
  touch: false,      // set by the touch layer on phones / tablets (no pointer lock, taps are handled there)
  dragLook: false,   // true once play starts: look while the left button is held
  dragPx: 0,         // how far the current left-button press has moved (px)
  mouseDown: [false, false, false],
  handlers: { keydown: [], keyup: [], mousedown: [], click: [], lockchange: [], lockerror: [] },
  canvas: null,
};
const H = input.handlers;
export const onInput = (type, fn) => H[type].push(fn);
const emit = (type, ...a) => { for (const fn of H[type]) fn(...a); };

const BLOCK = new Set(['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyF', 'F3']);
const CLICK_PX = 6;   // a press that moves less than this is a click, not a drag

export function initInput(canvas) {
  input.canvas = canvas;
  addEventListener('keydown', (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.code !== 'Escape') return;
    if ((input.locked || input.dragLook) && BLOCK.has(e.code)) e.preventDefault();
    if (e.ctrlKey && (input.locked || input.dragLook)) e.preventDefault();
    if (!e.repeat) { input.keys.add(e.code); emit('keydown', e.code, e); }
  });
  addEventListener('keyup', (e) => { input.keys.delete(e.code); emit('keyup', e.code, e); });
  addEventListener('blur', () => { input.keys.clear(); input.mouseDown = [false, false, false]; });
  document.addEventListener('pointerlockchange', () => {
    input.locked = document.pointerLockElement === canvas;
    emit('lockchange', input.locked);
  });
  document.addEventListener('pointerlockerror', () => { input.dragLook = true; emit('lockerror'); });
  addEventListener('mousemove', (e) => {
    // left-drag looks; right-drag looks too while zoomed (the player slows it down for fine aiming)
    if (input.locked || (input.dragLook && (input.mouseDown[0] || input.mouseDown[2]))) { input.dx += e.movementX || 0; input.dy += e.movementY || 0; }
    if (input.mouseDown[0]) {
      input.dragPx += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
      if (input.dragPx >= CLICK_PX) canvas.classList.add('dragging');
    }
  });
  canvas.addEventListener('mousedown', (e) => {
    if (input.touch) return;
    input.mouseDown[e.button] = true;
    if (e.button === 0) { input.dragPx = 0; input.pressOnCanvas = true; canvas.classList.add('pressing'); }
    emit('mousedown', e.button, e);
  });
  addEventListener('mouseup', (e) => {
    const wasDown = input.mouseDown[e.button];
    input.mouseDown[e.button] = false;
    if (e.button !== 0) return;
    canvas.classList.remove('pressing', 'dragging');
    if (wasDown && input.pressOnCanvas && input.dragPx < CLICK_PX) emit('click', 0, e);
    input.pressOnCanvas = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => { input.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
}

// Play mode: enable drag-to-look. (Pointer lock is no longer used: it trapped the trackpad in look mode.)
export function requestLock() { input.dragLook = true; }
export function exitLock() { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) { /* ignore */ } }
export function consumeMouse() { const r = [input.dx, input.dy]; input.dx = 0; input.dy = 0; return r; }
export function consumeWheel() { const w = input.wheel; input.wheel = 0; return w; }
export const down = (...codes) => codes.some((c) => input.keys.has(c));

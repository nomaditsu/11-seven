// Textures whose pixels depend on the current language. They are redrawn (time-sliced)
// whenever the language mode changes so signs, price tags and packaging follow the switch.
import * as THREE from 'three';
import { makeCanvas } from './draw.js';
import { canvasTex } from './surfaces.js';
import { onLanguageChange } from '../core/i18n.js';

const registry = new Set();
let dirty = new Set();
// Where the player is standing/looking: textures nearest the crosshair repaint first after a language switch.
const focus = { x: 0, z: 0, fx: 0, fz: -1 };
export function setLocalizedFocus(x, z, fx, fz) { focus.x = x; focus.z = z; focus.fx = fx; focus.fz = fz; }
function sdist(x, z) {
  const dx = x - focus.x, dz = z - focus.z, d = Math.hypot(dx, dz);
  const dot = (dx * focus.fx + dz * focus.fz) / (d || 1);
  return d * (dot > 0.1 ? 1 : 1.8);
}

export class LTex {
  /**
   * draw(ctx, w, h) paints the whole canvas. Set opts.localized=false for one-off art.
   */
  constructor(w, h, draw, opts = {}) {
    const c = makeCanvas(w, h);
    this.canvas = c.canvas; this.ctx = c.ctx; this.w = c.canvas.width; this.h = c.canvas.height;
    this.draw = draw;
    this.anchors = null;      // [{x, z}] world spots where this texture is visible (products)
    this.meshRef = null;      // () => mesh that carries it (signs); a closure so cloning/serialising never loops
    this.priority = false;    // repaint before anything else (the pack in the player's hands)
    this.texture = canvasTex(this.canvas, { srgb: opts.srgb !== false, wrap: !!opts.wrap, aniso: opts.aniso ?? 8 });
    this.render();
    if (opts.localized !== false) registry.add(this);
  }
  render() {
    const { ctx, w, h } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    this.draw(ctx, w, h);
    this.texture.needsUpdate = true;
    dirty.delete(this);
  }
  score() {
    if (this.priority) return -1;
    if (this.anchors && this.anchors.length) { let d = 1e9; for (const a of this.anchors) d = Math.min(d, sdist(a.x, a.z)); return d; }
    if (this.meshRef) { const m = this.meshRef(); if (m) { const e = m.matrixWorld.elements; return sdist(e[12], e[14]); } }
    return 8;
  }
  dispose() { registry.delete(this); dirty.delete(this); this.texture.dispose(); }
}

// A flat sign in the world: returns { mesh, ltex }.  size in metres, ppm = pixels per metre.
export function makeSign(wM, hM, ppm, draw, o = {}) {
  const lt = new LTex(Math.round(wM * ppm), Math.round(hM * ppm), draw, o);
  const mat = o.lit
    ? new THREE.MeshStandardMaterial({ map: lt.texture, roughness: o.roughness ?? 0.6, metalness: 0, transparent: !!o.transparent, side: o.side ?? THREE.FrontSide, envMap: o.envMap || null, envMapIntensity: 0.6 })
    : new THREE.MeshBasicMaterial({ map: lt.texture, transparent: !!o.transparent, side: o.side ?? THREE.FrontSide, toneMapped: o.toneMapped ?? true, alphaTest: o.alphaTest || 0 });
  if (o.emissive && o.lit) { mat.emissive = new THREE.Color(0xffffff); mat.emissiveMap = lt.texture; mat.emissiveIntensity = o.emissive; }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wM, hM), mat);
  Object.defineProperty(mesh.userData, 'ltex', { value: lt, enumerable: false, writable: true, configurable: true });
  lt.meshRef = () => mesh;
  return { mesh, ltex: lt, mat };
}

onLanguageChange(() => { dirty = new Set(registry); });
// Called every frame; repaints the most relevant stale textures within a small time budget.
export function pumpLocalized(budgetMs = 5) {
  if (!dirty.size) return 0;
  const t0 = performance.now();
  do {
    let best = null, bs = Infinity;
    for (const lt of dirty) { const sc = lt.score(); if (sc < bs) { bs = sc; best = lt; } }
    if (!best) break;
    best.render();
  } while (dirty.size && performance.now() - t0 < budgetMs);
  return dirty.size;
}
export const localizedPending = () => dirty.size;
export const localizedCount = () => registry.size;

// debug: repaint everything synchronously and report timings
export function debugPaintAll() {
  const rows = [];
  for (const lt of registry) { const t0 = performance.now(); lt.render(); rows.push({ w: lt.w, h: lt.h, ms: performance.now() - t0, sku: lt.anchors ? 1 : 0 }); }
  return rows;
}

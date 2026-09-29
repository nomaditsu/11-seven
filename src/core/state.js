// Global mutable game context shared between modules (kept intentionally small).
export const G = {
  mode: 'loading',       // 'loading' | 'title' | 'play' | 'pause' | 'ui' | 'inspect' | 'dialog'
  renderer: null,
  scene: null,
  camera: null,
  player: null,
  world: null,           // { store, exterior, products, ... }
  hourNow: 18.5,         // game clock (hours, 0-24)
  time: 0,               // seconds since boot
  dt: 0,
  insideness: 0,         // 0 outside .. 1 deep inside (audio/lighting blending)
  doorOpen: 0,           // 0..1
  debug: false,
  hooks: {},             // late-bound cross-module functions to avoid import cycles
};

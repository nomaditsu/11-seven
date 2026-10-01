// Persistent settings + save data (localStorage is optional: every access is guarded).
import { clamp } from './util.js';

const SAVE_SLOT = 'nomaditsu-711-sim-v1';

export const defaults = {
  lang: 'en',            // 'en' | 'th' | 'both'
  quality: 'med',        // 'low' | 'med' | 'high'
  fov: 72,
  sens: 1.0,
  invertY: false,
  bob: true,
  master: 0.8,
  ambience: 0.3,         // air con, fridge hum and street (the Ambience slider); lower it for a quieter store
  music: 0.2,
  musicOn: true,         // background chiptune on / off
  track: 0,              // index into MUSIC_TRACKS
  muted: false,          // master mute (everything, including voices)
  sfx: 0.75,             // beeps and voices (the Effects slider)
  levels: 0,             // which default mix the saved levels come from (see main.js boot)
  subtitles: true,
  voice: true,
  hints: true,
  romanize: true,        // show romanised Thai in bilingual mode and subtitles
  timeHour: 18.5,        // game clock
  clockRuns: false,
};

export const settings = { ...defaults };

// Progress that survives reloads.
export const save = {
  discovered: [],        // sku ids
  cash: 500,
  bank: 3000,
  wallet: 1000,
  points: 0,
  achievements: [],
  atmUses: 0,
  visits: 0,
  questsDone: [],
  talked: [],            // 'p:<person>' once met, '<person>.<node>' once a reward was given
};

let storage = null;
try { storage = window.localStorage; storage.getItem('x'); } catch (e) { storage = null; }

export function loadAll() {
  if (!storage) return;
  try {
    const raw = storage.getItem(SAVE_SLOT);
    if (!raw) return;
    const j = JSON.parse(raw);
    Object.assign(settings, j.settings || {});
    Object.assign(save, j.save || {});
  } catch (e) { /* ignore corrupt data */ }
  settings.fov = clamp(+settings.fov || 72, 55, 105);
  settings.sens = clamp(+settings.sens || 1, 0.2, 3);
}

let dirty = false;
export function markDirty() { dirty = true; }
export function flush(force = false) {
  if (!storage || (!dirty && !force)) return;
  dirty = false;
  try { storage.setItem(SAVE_SLOT, JSON.stringify({ settings, save })); } catch (e) { /* quota / private mode */ }
}
if (typeof window !== 'undefined') {   // (the validate scripts import this module under Node)
  setInterval(() => flush(), 4000);
  addEventListener('pagehide', () => flush(true));
}

export function resetProgress() {
  save.discovered = [];
  save.cash = 500;
  save.bank = 3000;
  save.wallet = 1000;
  save.points = 0;
  save.achievements = [];
  save.atmUses = 0;
  save.questsDone = [];
  save.talked = [];
  markDirty();
  flush(true);
}

export const QUALITY = {
  low:  { pixelRatio: 1,   shadows: false, shadowSize: 1024, rows: 1, lights: 4,  antialias: false, bloom: false, traffic: 3,  npcs: 2, reflect: false },
  med:  { pixelRatio: 1.25, shadows: true,  shadowSize: 2048, rows: 2, lights: 8,  antialias: true,  bloom: false, traffic: 6,  npcs: 4, reflect: false },
  high: { pixelRatio: 2,   shadows: true,  shadowSize: 4096, rows: 3, lights: 12, antialias: true,  bloom: true,  traffic: 10, npcs: 6, reflect: true },
};

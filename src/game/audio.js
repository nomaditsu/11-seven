// Everything you hear is synthesised with WebAudio — no audio files.
import { settings } from '../core/settings.js';
import { clamp, lerp, damp, rng } from '../core/util.js';
import { MUSIC_TRACKS } from '../data/music.js';
import { scheduleChipStep, stepSeconds } from './chiptune.js';

export const audio = {
  ctx: null, ready: false,
  master: null, sfxBus: null, ambBus: null, musBus: null, paused: false,
  nodes: {}, voices: [], lastVoiceCheck: 0,
  musicOn: false, nextNote: 0, step: 0, musicTimer: 0,
};

let noiseBuf = null, brownBuf = null;
function makeNoise(ctx, brown = false) {
  const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return buf;
}
function loopSource(ctx, buf) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }

export function initAudio() {
  if (audio.ctx) { audio.ctx.resume && audio.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  audio.ctx = ctx;
  noiseBuf = makeNoise(ctx); brownBuf = makeNoise(ctx, true);
  audio.master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
  audio.master.connect(comp); comp.connect(ctx.destination);
  audio.sfxBus = ctx.createGain(); audio.ambBus = ctx.createGain(); audio.musBus = ctx.createGain();
  audio.sfxBus.connect(audio.master); audio.ambBus.connect(audio.master); audio.musBus.connect(audio.master);

  // ---- ambience beds
  // store: AC rumble + fridge hum
  const ac = loopSource(ctx, brownBuf), acF = ctx.createBiquadFilter(); acF.type = 'lowpass'; acF.frequency.value = 380;
  const acG = ctx.createGain(); acG.gain.value = 0.5; ac.connect(acF); acF.connect(acG);
  const ac2 = loopSource(ctx, noiseBuf), ac2F = ctx.createBiquadFilter(); ac2F.type = 'bandpass'; ac2F.frequency.value = 2400; ac2F.Q.value = 0.4;
  const ac2G = ctx.createGain(); ac2G.gain.value = 0.02; ac2.connect(ac2F); ac2F.connect(ac2G);
  const hum = ctx.createOscillator(), hum2 = ctx.createOscillator(), humG = ctx.createGain();
  hum.frequency.value = 50; hum2.frequency.value = 100.6; humG.gain.value = 0.035; hum.connect(humG); hum2.connect(humG); hum.start(); hum2.start();
  const storeG = ctx.createGain(); storeG.gain.value = 0; acG.connect(storeG); ac2G.connect(storeG); humG.connect(storeG); storeG.connect(audio.ambBus);
  // street: traffic wash + cicadas / crickets
  const tr = loopSource(ctx, brownBuf), trF = ctx.createBiquadFilter(); trF.type = 'bandpass'; trF.frequency.value = 420; trF.Q.value = 0.5;
  const trG = ctx.createGain(); trG.gain.value = 0.9; tr.connect(trF); trF.connect(trG);
  const tr2 = loopSource(ctx, noiseBuf), tr2F = ctx.createBiquadFilter(); tr2F.type = 'highpass'; tr2F.frequency.value = 1400; const tr2G = ctx.createGain(); tr2G.gain.value = 0.02; tr2.connect(tr2F); tr2F.connect(tr2G);
  const cic = loopSource(ctx, noiseBuf), cicF = ctx.createBiquadFilter(); cicF.type = 'bandpass'; cicF.frequency.value = 5600; cicF.Q.value = 8;
  const cicAM = ctx.createGain(); cicAM.gain.value = 0; const cicG = ctx.createGain(); cicG.gain.value = 0.0;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 38; const lfoG = ctx.createGain(); lfoG.gain.value = 0.5; lfo.connect(lfoG); lfoG.connect(cicAM.gain); lfo.start();
  cicAM.gain.value = 0.5; cic.connect(cicF); cicF.connect(cicAM); cicAM.connect(cicG);
  const streetG = ctx.createGain(); streetG.gain.value = 0.5; trG.connect(streetG); tr2G.connect(streetG); cicG.connect(streetG);
  const streetLP = ctx.createBiquadFilter(); streetLP.type = 'lowpass'; streetLP.frequency.value = 9000;
  streetG.connect(streetLP); streetLP.connect(audio.ambBus);
  audio.nodes = { storeG, streetG, streetLP, cicG, trG };

  // vehicle drone voices (3, re-assigned to the nearest vehicles)
  for (let i = 0; i < 3; i++) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 80;
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 40;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; f.Q.value = 2;
    const g = ctx.createGain(); g.gain.value = 0; const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.connect(f); o2.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(audio.ambBus); } else g.connect(audio.ambBus);
    o.start(); o2.start();
    audio.voices.push({ o, o2, f, g, p });
  }
  audio.ready = true;
  applyVolumes();
  startMusicLoop();
  ctx.resume && ctx.resume();
}

export function applyVolumes() {
  if (!audio.ready) return;
  const t = audio.ctx.currentTime;
  // Two independent switches: `muted` is the Sound button (effects, ambience, voices), `musicOn` is the Music button.
  audio.master.gain.setTargetAtTime(settings.master, t, 0.05);
  audio.sfxBus.gain.setTargetAtTime(settings.muted ? 0 : settings.sfx, t, 0.05);
  audio.ambBus.gain.setTargetAtTime(settings.muted ? 0 : settings.ambience * 0.9, t, 0.05);
  audio.musBus.gain.setTargetAtTime(settings.musicOn && !audio.paused ? settings.music * 0.55 : 0, t, 0.08);
  if (settings.muted && 'speechSynthesis' in window) speechSynthesis.cancel();
}

// ------------------------------------------------------------------------------------------ per-frame mixing
// st: { inside (0 outside .. 1 inside), door (0..1), night (0..1), vehicles: [{x,z,vx,type}], px, pz }
export function updateAudio(dt, st) {
  if (!audio.ready) return;
  const t = audio.ctx.currentTime, n = audio.nodes;
  const inside = st.inside, door = st.door;
  n.storeG.gain.setTargetAtTime(inside * 0.8 + (1 - inside) * 0.1 * door, t, 0.2);
  const streetVol = (1 - inside) * 1 + inside * (0.06 + 0.5 * door * (1 - Math.min(1, st.depth || 0)));
  n.streetG.gain.setTargetAtTime(0.5 * streetVol, t, 0.25);
  n.streetLP.frequency.setTargetAtTime(inside > 0.5 ? 1400 + door * 6000 : 9000, t, 0.2);
  n.cicG.gain.setTargetAtTime(st.night > 0.5 ? 0.012 : 0.03, t, 0.5);
  // vehicles -> nearest three voices
  const veh = st.vehicles || [];
  const scored = veh.map((v) => ({ v, d: Math.hypot(v.x - st.px, v.z - st.pz) })).sort((a, b) => a.d - b.d).slice(0, 3);
  audio.voices.forEach((vo, i) => {
    const s = scored[i];
    if (!s) { vo.g.gain.setTargetAtTime(0, t, 0.1); return; }
    const atten = clamp(1 - s.d / 55, 0, 1);
    const indoors = 1 - inside * (1 - 0.35 * door);
    vo.g.gain.setTargetAtTime(0.16 * atten * atten * indoors * (s.v.type === 'bus' ? 1.4 : 1), t, 0.08);
    const dop = 1 + (s.v.vx * Math.sign(st.px - s.v.x)) / 340 * 1.2;
    const base = s.v.type === 'bike' ? 120 : s.v.type === 'tuktuk' ? 90 : 62;
    vo.o.frequency.setTargetAtTime(base * dop, t, 0.08); vo.o2.frequency.setTargetAtTime(base * 0.5 * dop, t, 0.08);
    vo.f.frequency.setTargetAtTime(300 + 500 * atten, t, 0.1);
    if (vo.p) vo.p.pan.setTargetAtTime(clamp((s.v.x - st.px) / 25, -1, 1), t, 0.1);
  });
}

// ------------------------------------------------------------------------------------------ helpers
function env(g, t0, a, d, peak, end = 0.0001) { g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(end, t0 + a + d); }
function tone(freq, t0, dur, peak, type = 'sine', dest = null, detune = 0) {
  const c = audio.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  o.connect(g); g.connect(dest || audio.sfxBus); env(g, t0, 0.004, dur, peak);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function bell(freq, t0, dur, peak, dest = null) {
  tone(freq, t0, dur, peak, 'sine', dest); tone(freq * 2.76, t0, dur * 0.5, peak * 0.35, 'sine', dest); tone(freq * 5.4, t0, dur * 0.25, peak * 0.15, 'sine', dest);
}
function noiseBurst(t0, dur, peak, freq = 2000, q = 0.7, type = 'bandpass', dest = null) {
  const c = audio.ctx, s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); s.connect(f); f.connect(g); g.connect(dest || audio.sfxBus); env(g, t0, 0.005, dur, peak);
  s.start(t0, Math.random() * 2); s.stop(t0 + dur + 0.05);
}

// ------------------------------------------------------------------------------------------ SFX
const SFX = {
  chime(t) { [880, 1108.7, 1318.5].forEach((f, i) => bell(f, t + i * 0.2, 1.1, 0.16)); },
  beep(t) { tone(1760, t, 0.09, 0.14, 'square'); },
  pick(t) { noiseBurst(t, 0.16, 0.28, 3200, 0.8); noiseBurst(t + 0.05, 0.1, 0.16, 1500, 1); },
  put(t) { noiseBurst(t, 0.12, 0.2, 900, 0.9, 'lowpass'); tone(160, t, 0.08, 0.1); },
  step(t, k = 0.65) { noiseBurst(t, 0.06, 0.12 * k, 1200 + Math.random() * 500, 1.2, 'bandpass'); tone(90 + Math.random() * 30, t, 0.05, 0.07 * k, 'triangle'); },
  tick(t) { tone(1400, t, 0.035, 0.07, 'triangle'); },
  ding(t) { bell(2093, t, 0.9, 0.16); },
  microwave(t) { noiseBurst(t, 2.6, 0.09, 260, 4, 'bandpass'); tone(120, t, 2.6, 0.03, 'sawtooth'); },
  cash(t) { bell(1568, t, 0.5, 0.1); bell(2093, t + 0.06, 0.6, 0.09); noiseBurst(t, 0.12, 0.2, 5000, 1); },
  success(t) { bell(1318.5, t, 0.5, 0.16); bell(1760, t + 0.14, 0.9, 0.16); },
  error(t) { tone(160, t, 0.25, 0.14, 'sawtooth'); tone(140, t + 0.12, 0.25, 0.12, 'sawtooth'); },
  printer(t) { for (let i = 0; i < 9; i++) noiseBurst(t + i * 0.07, 0.05, 0.11, 3400, 2); },
  pour(t) { noiseBurst(t, 1.6, 0.2, 700, 0.6, 'bandpass'); noiseBurst(t + 0.2, 1.3, 0.12, 1800, 0.7, 'bandpass'); },
  coffee(t) { noiseBurst(t, 2.2, 0.16, 900, 1.5, 'bandpass'); tone(95, t, 2.2, 0.05, 'sawtooth'); noiseBurst(t + 2.2, 0.8, 0.1, 500, 1); },
  slide(t) { noiseBurst(t, 0.5, 0.06, 900, 0.5, 'lowpass'); },
  wai(t) { tone(523, t, 0.12, 0.05); },
  atm(t) { for (let i = 0; i < 4; i++) tone(900 + i * 80, t + i * 0.08, 0.06, 0.08, 'square'); noiseBurst(t + 0.4, 1.0, 0.13, 1600, 1); },
  bark(t) { noiseBurst(t, 0.12, 0.2, 500, 3); tone(320, t, 0.14, 0.09, 'sawtooth'); },
  achievement(t) { [523, 659, 784, 1046].forEach((f, i) => bell(f, t + i * 0.09, 0.8, 0.09)); },
  whoosh(t) { noiseBurst(t, 0.3, 0.06, 700, 0.6, 'bandpass'); },
  fridgeOpen(t) { tone(85, t, 0.09, 0.1, 'triangle'); noiseBurst(t + 0.02, 0.45, 0.07, 1100, 0.5, 'bandpass'); },
  fridgeClose(t) { tone(70, t, 0.1, 0.12, 'triangle'); noiseBurst(t, 0.09, 0.09, 700, 0.9, 'lowpass'); },
  pop(t) { tone(700, t, 0.08, 0.1, 'sine'); tone(1000, t + 0.04, 0.08, 0.08, 'sine'); },
};
export function sfx(name, arg) {
  if (!audio.ready || !SFX[name]) return;
  const t = audio.ctx.currentTime + 0.005;
  SFX[name](t, arg);
}

// ------------------------------------------------------------------------------------------ store music (chiptune loops)
export const trackCount = () => MUSIC_TRACKS.length;
export const currentTrack = () => MUSIC_TRACKS[((settings.track % MUSIC_TRACKS.length) + MUSIC_TRACKS.length) % MUSIC_TRACKS.length];
function scheduleMusic() {
  const c = audio.ctx;
  if (!audio.ready || !settings.musicOn || audio.paused || settings.music < 0.01) return;
  const T = currentTrack(), sp = stepSeconds(T);
  if (audio.nextNote < c.currentTime - 0.5) audio.nextNote = c.currentTime + 0.08;
  while (audio.nextNote < c.currentTime + 0.3) { scheduleChipStep(c, audio.musBus, T, audio.step++, audio.nextNote); audio.nextNote += sp; }
}
export function startMusicLoop() {
  if (audio.musicTimer) return;
  audio.musicTimer = setInterval(scheduleMusic, 40);   // independent of the render loop, so it keeps playing in a background tab
}
// Switch to track i (wraps), restarting the loop from the top.
export function setTrack(i) {
  const n = MUSIC_TRACKS.length;
  settings.track = ((i % n) + n) % n;
  audio.step = 0; audio.nextNote = 0;
  return currentTrack();
}
export const nextTrack = (d = 1) => setTrack(settings.track + d);
// Pause holds the track where it is (the popover's play / pause button). It is not saved, and the Music switch, a
// track pick or a skip all clear it, so a paused track never hides behind a switch that reads On.
export function setMusicPaused(on) { audio.paused = !!on; applyVolumes(); }
export function setMusicOn(on) { settings.musicOn = !!on; audio.paused = false; applyVolumes(); }
export function setMuted(on) { settings.muted = !!on; applyVolumes(); }
// ------------------------------------------------------------------------------------------ speech (browser voices, optional)
let voices = [];
const hasSpeech = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
function loadVoices() { if (hasSpeech()) voices = speechSynthesis.getVoices(); }
if (hasSpeech()) { speechSynthesis.onvoiceschanged = loadVoices; loadVoices(); }
// Known female system voices (macOS Kanya, Edge/Windows Premwadee and Achara, Android/Google ones say "female").
const FEMALE = /kanya|premwadee|achara|narisa|female|samantha|karen|victoria|zira|aria|jenny|google us english/i, MALE = /niwat|pattara|\bmale\b|daniel|alex|fred|david|guy/i;
function pickVoice(code, female = false) {
  const norm = (v) => v.lang.replace('_', '-').toLowerCase();
  const list = voices.filter((v) => norm(v).startsWith(code));
  if (female) { const f = list.find((v) => FEMALE.test(v.name)) || list.find((v) => !MALE.test(v.name)); if (f) return f; }
  if (code === 'en') return list.find((v) => norm(v) === 'en-us') || list[0] || null;
  return list[0] || null;
}
// Speak `text` in 'th' or 'en'. o: { pitch, rate, queue } (queue:false cancels whatever is playing first).
// Chrome on macOS (seen with Chrome 152 on macOS 26) accepts Thai-script text and ends it after ~0.1 s without a
// sound, while the same Thai voice (Kanya) reads Latin text fine, and macOS itself reads the Thai fine. So a Thai line
// is tried as Thai first (Safari, Edge, Android are fine); if it ends almost at once, it is re-spoken from its
// romanisation in the same Thai voice, and every later Thai line this visit goes straight to the romanisation.
let thaiScriptFails = false, speechGen = 0;
// 'sà-wàt-dii khâ, chəən khâ' -> 'sawatdee kha, chern kha' (plain letters a Thai voice reads close to the real thing)
export const speakable = (rom) => (rom || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/əə|ə/g, 'er').replace(/ɔɔ|ɔ/g, 'aw').replace(/ɛɛ|ɛ/g, 'ae').replace(/ʉʉ|ʉ/g, 'ue').replace(/ŋ/g, 'ng')
  .replace(/ii/g, 'ee').replace(/uu/g, 'oo').replace(/-/g, '');
function utter(text, voice, langTag, o) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langTag; if (voice) u.voice = voice;
  u.rate = o.rate ?? 0.95; u.pitch = o.pitch ?? 1.1; u.volume = clamp(settings.master * settings.sfx * 1.2, 0, 1);
  return u;
}
function speakThaiLine(thText, latin, voice, o) {
  if (thaiScriptFails && latin) { speechSynthesis.speak(utter(latin, voice, 'th-TH', o)); return; }
  const u = utter(thText, voice, 'th-TH', o), gen = speechGen;
  let t0 = 0;
  u.addEventListener('start', () => { t0 = performance.now(); });
  if (latin) u.addEventListener('end', () => {
    // ended almost at once, and not because we cancelled it: this browser cannot read Thai script
    if (gen === speechGen && t0 && performance.now() - t0 < 300 && thText.length > 3) { thaiScriptFails = true; speechSynthesis.speak(utter(latin, voice, 'th-TH', o)); }
  });
  speechSynthesis.speak(u);
}
// o.rom: the romanisation, used when the browser cannot read Thai script (see above).
export function speak(text, code = 'th', o = {}) {
  if (!settings.voice || settings.muted || !hasSpeech() || !text) return false;
  if (!voices.length) loadVoices();
  const v = pickVoice(code, !!o.female);
  if (!v && code === 'th') return false;              // no Thai voice on this device: stay silent rather than mangle it
  try {
    if (!o.queue) { speechGen++; speechSynthesis.cancel(); }
    if (code === 'th') speakThaiLine(text, o.rom ? speakable(o.rom) : '', v, o);
    else speechSynthesis.speak(utter(text, v, 'en-US', o));
    return true;
  } catch (e) { return false; }
}
// The door greeting: always Thai, always a female voice when the device has one. Waits for the voice list if the
// browser has not loaded it yet (Chrome loads it lazily), and speaks a moment after cancel() because Chrome can drop
// an utterance queued in the same tick. With no Thai voice installed it reads the romanised line in an English voice.
export function speakGreeting(phrase) {
  if (!settings.voice || settings.muted || !hasSpeech()) return false;
  let done = false;
  const go = () => {
    if (done) return; done = true;
    const th = pickVoice('th', true), o = { rate: 1.0, pitch: 1.2 }, latin = phrase.spoken || speakable(phrase.rom);
    speechGen++;
    try { speechSynthesis.cancel(); speechSynthesis.resume(); } catch (e) { /* ignore */ }
    setTimeout(() => {
      try { if (th) speakThaiLine(phrase.th, latin, th, o); else speechSynthesis.speak(utter(latin, pickVoice('en', true), 'en-US', o)); } catch (e) { /* ignore */ }
    }, 60);
  };
  if (!voices.length) loadVoices();
  if (voices.length) go();
  else { speechSynthesis.addEventListener('voiceschanged', () => { loadVoices(); go(); }, { once: true }); setTimeout(go, 900); }
  return true;
}
export function stopSpeech() { speechGen++; if (hasSpeech()) { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } } }
export const speakThai = (text, rom) => speak(text, 'th', { pitch: 1.15, rate: 0.95, female: true, rom });   // the cashiers' lines

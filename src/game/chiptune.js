// Tiny chiptune synth: pulse-wave lead / arpeggio, triangle bass, noise drums. No audio files.
import { MAJ, MIN } from '../data/music.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const waves = new Map();
function pulse(ctx, duty) {
  let w = waves.get(duty);
  if (!w || w.ctx !== ctx) {
    const N = 48, re = new Float32Array(N), im = new Float32Array(N);
    for (let n = 1; n < N; n++) re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    w = { ctx, wave: ctx.createPeriodicWave(re, im) }; waves.set(duty, w);
  }
  return w.wave;
}
let noiseBuf = null;
function noiseBuffer(ctx) {
  if (!noiseBuf || noiseBuf.ctx !== ctx) {
    const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = { ctx, b };
  }
  return noiseBuf.b;
}

function note(ctx, dest, f, t, dur, vol, cfg) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  if (cfg.duty) o.setPeriodicWave(pulse(ctx, cfg.duty)); else o.type = cfg.wave || 'triangle';
  o.frequency.setValueAtTime(f, t);
  const a = 0.006, rel = Math.min(0.09, dur * 0.4), sus = cfg.sus ?? 0.7;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setTargetAtTime(vol * sus, t + a, 0.08);
  g.gain.setTargetAtTime(0, t + dur - rel, rel / 3);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
function kick(ctx, dest, t, v) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.18);
}
function noise(ctx, dest, t, dur, v, type, freq, q = 1) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuffer(ctx); f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

export const stepSeconds = (track) => 60 / track.bpm / 4;

// Schedule one 16th-note step of `track` at audio time t. stepIdx counts up forever (the track loops every 8 bars).
export function scheduleChipStep(ctx, dest, T, stepIdx, t) {
  const bar = Math.floor(stepIdx / 16) % T.bars.length, s = stepIdx % 16, sp = stepSeconds(T);
  t += s % 2 === 1 ? T.swing * sp : 0;
  const [root, q] = T.chords[bar], tones = q === 'M' ? MAJ : MIN;
  for (const n of T.bars[bar]) if (n.step === s) note(ctx, dest, hz(n.m), t, n.len * sp * 0.96, T.lead.vol, T.lead);
  if (T.arp && s % (T.arp.every || 1) === 0) {
    const ev = T.arp.every || 1;
    note(ctx, dest, hz(root + 12 * T.arp.oct + 12 + tones[(s / ev) % 4]), t, sp * ev * 0.8, T.arp.vol, T.arp);
  }
  const bi = T.bass.steps.indexOf(s);
  if (bi >= 0) note(ctx, dest, hz(root + T.bass.oct[bi]), t, (T.bass.long ? 8 : 2) * sp * 0.9, T.bass.vol || 0.14, { duty: T.bass.duty, wave: T.bass.wave, sus: 0.85 });
  const D = T.drums, soft = T.id === 'lullaby';
  if (D.kick.includes(s)) kick(ctx, dest, t, soft ? 0.32 : 0.5);
  if (D.snare.includes(s)) noise(ctx, dest, t, 0.13, 0.22, 'bandpass', 1900, 0.8);
  if (D.hat.includes(s)) noise(ctx, dest, t, 0.035, soft ? 0.05 : 0.08, 'highpass', 7500);
  if (D.ghost && D.ghost.includes(s)) noise(ctx, dest, t, 0.03, 0.035, 'highpass', 8500);
  if (D.rim && D.rim.includes(s)) noise(ctx, dest, t, 0.05, 0.12, 'bandpass', 3200, 4);
}

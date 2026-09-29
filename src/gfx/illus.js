// Vector "packaging illustrations": chunky, outlined, saturated — the look of Thai snack and drink packs.
// Every function draws centred on (0,0) within roughly [-s/2, s/2] and takes an options bag.
import { circle, ellipse, poly, burst, drop, leaf, linGrad, radGrad, fillRR, star, bolt } from './draw.js';
import { lighten, darken, TAU, rng } from '../core/util.js';

const OUT = '#3b2411';
function lw(ctx, s, k = 0.03) { ctx.lineWidth = Math.max(0.04, s * k); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
function shine(ctx, x, y, w, h, rot = -0.6, a = 0.55) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill(); ctx.restore();
}
function steam(ctx, s, x = 0, y = 0, n = 3) {
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const sx = x + (i - (n - 1) / 2) * s * 0.13;
    ctx.beginPath(); ctx.moveTo(sx, y); ctx.bezierCurveTo(sx - s * 0.06, y - s * 0.08, sx + s * 0.06, y - s * 0.14, sx, y - s * 0.22); ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ fruit & veg
export function orange(ctx, s, o = {}) {
  const c = o.c1 || '#ff9a1f';
  circle(ctx, 0, 0, s * 0.4, c); ctx.strokeStyle = darken(c, 0.4); lw(ctx, s); ctx.stroke();
  shine(ctx, -s * 0.13, -s * 0.15, s * 0.1, s * 0.06);
  leaf(ctx, 0, -s * 0.38, s * 0.22, s * 0.1, -0.5, '#2e9b3e'); leaf(ctx, 0, -s * 0.38, s * 0.2, s * 0.09, -2.4, '#3ab04a');
}
export function lemonSlice(ctx, s, o = {}) {
  const c = o.c1 || '#ffe13a';
  circle(ctx, 0, 0, s * 0.42, c); circle(ctx, 0, 0, s * 0.35, lighten(c, 0.45));
  ctx.strokeStyle = c; ctx.lineWidth = s * 0.02;
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos((i * TAU) / 8) * s * 0.33, Math.sin((i * TAU) / 8) * s * 0.33); ctx.stroke(); }
  ctx.strokeStyle = darken(c, 0.35); ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, TAU); ctx.stroke();
}
export function lime(ctx, s, o = {}) { lemonSlice(ctx, s, { c1: o.c1 || '#8fd43a' }); }
export function strawberry(ctx, s, o = {}) {
  const c = o.c1 || '#ee2b45';
  ctx.beginPath(); ctx.moveTo(0, s * 0.42); ctx.bezierCurveTo(s * 0.5, s * 0.15, s * 0.42, -s * 0.32, 0, -s * 0.3); ctx.bezierCurveTo(-s * 0.42, -s * 0.32, -s * 0.5, s * 0.15, 0, s * 0.42);
  ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = darken(c, 0.4); lw(ctx, s); ctx.stroke();
  ctx.fillStyle = '#ffe9a0';
  for (let i = 0; i < 9; i++) { const a = i * 2.4, r = s * (0.08 + (i % 3) * 0.1); ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.4 + s * 0.02, s * 0.018, s * 0.03, 0, 0, TAU); ctx.fill(); }
  for (let i = 0; i < 5; i++) leaf(ctx, 0, -s * 0.28, s * 0.22, s * 0.07, -Math.PI / 2 + (i - 2) * 0.55, '#2e9b3e');
}
export function mango(ctx, s, o = {}) {
  const c = o.c1 || '#ffc21a';
  ctx.save(); ctx.rotate(-0.5);
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.3, 0, 0, TAU);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.45, [[0, '#ffe55a'], [0.6, c], [1, '#ff8a1a']], -s * 0.1, -s * 0.05); ctx.fill();
  ctx.strokeStyle = '#a2561a'; lw(ctx, s); ctx.stroke();
  shine(ctx, -s * 0.15, -s * 0.1, s * 0.12, s * 0.05, -0.3);
  leaf(ctx, s * 0.3, -s * 0.18, s * 0.2, s * 0.08, -0.2, '#2e9b3e');
  ctx.restore();
}
export function mangoSlice(ctx, s, o = {}) {
  ctx.save(); ctx.rotate(0.3);
  ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.quadraticCurveTo(0, -s * 0.5, s * 0.4, 0); ctx.quadraticCurveTo(0, s * 0.12, -s * 0.4, 0);
  ctx.fillStyle = '#ffc21a'; ctx.fill(); ctx.strokeStyle = '#e98c0e'; lw(ctx, s, 0.035); ctx.stroke(); ctx.restore();
}
export function watermelon(ctx, s, o = {}) {
  ctx.save(); ctx.rotate(0.2);
  ctx.beginPath(); ctx.moveTo(-s * 0.42, -s * 0.12); ctx.arc(0, -s * 0.12, s * 0.42, Math.PI, 0, true); ctx.arc(0, -s * 0.12, s * 0.42, 0, Math.PI, false);
  ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.42, 0, Math.PI); ctx.closePath();
  ctx.fillStyle = '#2f9b45'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.37, 0, Math.PI); ctx.closePath(); ctx.fillStyle = '#eafcd0'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.33, 0, Math.PI); ctx.closePath(); ctx.fillStyle = '#ff4a5e'; ctx.fill();
  ctx.fillStyle = '#20120a';
  for (const [x, y] of [[-0.18, 0.02], [0, 0.1], [0.17, 0.03], [-0.08, 0.18], [0.1, 0.19]]) { ctx.beginPath(); ctx.ellipse(x * s, (y - 0.15) * s + s * 0.1, s * 0.016, s * 0.03, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
export function pineapple(ctx, s, o = {}) {
  ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.26, s * 0.34, 0, 0, TAU); ctx.fillStyle = '#f6b921'; ctx.fill(); ctx.strokeStyle = '#9b5a12'; lw(ctx, s); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,60,10,.55)'; ctx.lineWidth = s * 0.015;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.07, -s * 0.24); ctx.lineTo(i * s * 0.07 + s * 0.15, s * 0.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * s * 0.07, -s * 0.24); ctx.lineTo(i * s * 0.07 - s * 0.15, s * 0.4); ctx.stroke(); }
  for (let i = 0; i < 6; i++) leaf(ctx, 0, -s * 0.24, s * 0.3, s * 0.06, -Math.PI / 2 + (i - 2.5) * 0.28, '#2e9b3e');
}
export function coconut(ctx, s, o = {}) {
  circle(ctx, 0, 0, s * 0.38, '#7a4a25'); circle(ctx, -s * 0.05, -s * 0.03, s * 0.3, '#f4ecd8'); circle(ctx, -s * 0.05, -s * 0.03, s * 0.22, '#fffdf5');
  ctx.strokeStyle = OUT; lw(ctx, s); ctx.beginPath(); ctx.arc(0, 0, s * 0.38, 0, TAU); ctx.stroke();
}
export function banana(ctx, s) {
  ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.05); ctx.quadraticCurveTo(0, s * 0.5, s * 0.42, -s * 0.22); ctx.quadraticCurveTo(0, s * 0.25, -s * 0.4, -s * 0.05);
  ctx.fillStyle = '#ffdc2e'; ctx.fill(); ctx.strokeStyle = '#8a6a10'; lw(ctx, s); ctx.stroke();
}
export function grape(ctx, s, o = {}) {
  const c = o.c1 || '#7b3fb0';
  for (const [x, y] of [[0, -0.18], [-0.13, -0.05], [0.13, -0.05], [-0.07, 0.1], [0.07, 0.1], [0, 0.26]]) { circle(ctx, x * s, y * s, s * 0.13, c); shine(ctx, x * s - s * 0.04, y * s - s * 0.04, s * 0.035, s * 0.02); }
  leaf(ctx, 0, -s * 0.3, s * 0.25, s * 0.1, -0.6, '#2e9b3e');
}
export function lychee(ctx, s) { circle(ctx, 0, 0, s * 0.34, '#e8435a'); ctx.fillStyle = 'rgba(120,20,30,.4)'; for (let i = 0; i < 14; i++) { const a = i * 2.3; ctx.beginPath(); ctx.arc(Math.cos(a) * s * 0.2 * (i % 3) / 2, Math.sin(a) * s * 0.22 * (i % 3) / 2, s * 0.03, 0, TAU); ctx.fill(); } shine(ctx, -s * 0.1, -s * 0.12, s * 0.07, s * 0.04); }
export function chili(ctx, s) {
  ctx.save(); ctx.rotate(-0.6);
  ctx.beginPath(); ctx.moveTo(-s * 0.42, 0); ctx.quadraticCurveTo(0, -s * 0.2, s * 0.4, s * 0.08); ctx.quadraticCurveTo(0, s * 0.14, -s * 0.42, 0);
  ctx.fillStyle = '#e8261c'; ctx.fill(); ctx.strokeStyle = '#701008'; lw(ctx, s); ctx.stroke();
  leaf(ctx, s * 0.38, s * 0.06, s * 0.14, s * 0.05, 0.2, '#2e9b3e'); ctx.restore();
}
export function herb(ctx, s, o = {}) {
  const c = o.c1 || '#2f9a45';
  for (let i = 0; i < 5; i++) leaf(ctx, 0, s * 0.25, s * 0.55, s * 0.13, -Math.PI / 2 + (i - 2) * 0.5, i % 2 ? c : darken(c, 0.15));
}
export function garlic(ctx, s) { ctx.beginPath(); ctx.moveTo(0, -s * 0.38); ctx.bezierCurveTo(s * 0.4, -s * 0.05, s * 0.3, s * 0.35, 0, s * 0.35); ctx.bezierCurveTo(-s * 0.3, s * 0.35, -s * 0.4, -s * 0.05, 0, -s * 0.38); ctx.fillStyle = '#f6efe0'; ctx.fill(); ctx.strokeStyle = '#8a7a58'; lw(ctx, s); ctx.stroke(); }

// ------------------------------------------------------------------ snacks
export function chipsPile(ctx, s, o = {}) {
  const c = o.c1 || '#f6c344', r = rng(7);
  const spots = [[-0.22, 0.05, 0.4], [0.2, 0.0, -0.5], [-0.05, -0.2, 0.2], [0.08, 0.22, -0.2], [-0.25, 0.28, 0.7], [0.27, 0.25, 0.3]];
  for (const [x, y, rot] of spots) {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(rot);
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.24, s * 0.18, 0, 0, TAU);
    ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.26, [[0, lighten(c, 0.35)], [0.7, c], [1, darken(c, 0.15)]], -s * 0.06, -s * 0.05); ctx.fill();
    ctx.strokeStyle = darken(c, 0.5); lw(ctx, s, 0.02); ctx.stroke();
    ctx.fillStyle = o.c2 || 'rgba(160,80,10,.55)';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc((r() - 0.5) * s * 0.3, (r() - 0.5) * s * 0.22, s * 0.012, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
export function seaweed(ctx, s, o = {}) {
  const c = o.c1 || '#15351f';
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.translate((i - 1) * s * 0.17, (i % 2) * s * 0.04 - s * 0.02); ctx.rotate((i - 1) * 0.28);
    fillRR(ctx, -s * 0.15, -s * 0.28, s * 0.3, s * 0.56, s * 0.03, linGrad(ctx, -s * 0.15, 0, s * 0.15, 0, [[0, '#0c2416'], [0.5, c], [1, '#0c2416']]), '#000', s * 0.012);
    ctx.fillStyle = 'rgba(120,255,160,.14)'; ctx.fillRect(-s * 0.1, -s * 0.24, s * 0.05, s * 0.48);
    ctx.restore();
  }
  if (o.c2) { ctx.fillStyle = o.c2; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(((i * 37) % 100 / 100 - 0.5) * s * 0.7, ((i * 53) % 100 / 100 - 0.5) * s * 0.6, s * 0.012, 0, TAU); ctx.fill(); } }
}
export function nuts(ctx, s, o = {}) {
  const c = o.c1 || '#e0a860';
  for (const [x, y, r] of [[-0.2, 0.05, 0.3], [0.05, -0.12, -0.4], [0.22, 0.12, 0.2], [-0.05, 0.22, 0.6], [-0.26, -0.15, -0.2], [0.24, -0.2, 0.5]]) {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r);
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.13, s * 0.1, 0, 0, TAU); ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.14, [[0, lighten(c, 0.3)], [1, darken(c, 0.15)]], -s * 0.03, -s * 0.03); ctx.fill();
    ctx.strokeStyle = darken(c, 0.5); lw(ctx, s, 0.018); ctx.stroke(); ctx.restore();
  }
}
export function shrimp(ctx, s, o = {}) {
  const c = o.c1 || '#ff7a3d';
  ctx.beginPath(); ctx.moveTo(-s * 0.32, s * 0.12); ctx.bezierCurveTo(-s * 0.4, -s * 0.28, s * 0.32, -s * 0.34, s * 0.3, s * 0.05); ctx.bezierCurveTo(s * 0.34, s * 0.2, s * 0.15, s * 0.22, s * 0.12, s * 0.08); ctx.bezierCurveTo(s * 0.15, -s * 0.1, -s * 0.1, -s * 0.1, -s * 0.2, s * 0.14);
  ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = darken(c, 0.5); lw(ctx, s); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = s * 0.02;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.2 + i * s * 0.12, -s * 0.2 + Math.abs(i - 1.5) * s * 0.05); ctx.lineTo(-s * 0.17 + i * s * 0.12, s * 0.02); ctx.stroke(); }
  circle(ctx, s * 0.27, -s * 0.03, s * 0.02, '#000');
}
export function squid(ctx, s) {
  ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.bezierCurveTo(s * 0.3, -s * 0.2, s * 0.22, s * 0.05, s * 0.18, s * 0.1); for (let i = 0; i < 5; i++) ctx.lineTo(s * 0.18 - i * s * 0.09, s * 0.4 - (i % 2) * s * 0.06); ctx.bezierCurveTo(-s * 0.22, s * 0.05, -s * 0.3, -s * 0.2, 0, -s * 0.4);
  ctx.fillStyle = '#f0a08a'; ctx.fill(); ctx.strokeStyle = '#7a3a2c'; lw(ctx, s); ctx.stroke(); circle(ctx, -s * 0.07, -s * 0.05, s * 0.03, '#222'); circle(ctx, s * 0.07, -s * 0.05, s * 0.03, '#222');
}
export function fishSnack(ctx, s, o = {}) {
  const c = o.c1 || '#e9b45a';
  for (const [x, y, r] of [[-0.18, -0.12, 0.4], [0.15, 0.0, -0.3], [-0.05, 0.2, 0.1]]) {
    ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r);
    ctx.beginPath(); ctx.moveTo(-s * 0.26, 0); ctx.quadraticCurveTo(0, -s * 0.16, s * 0.2, 0); ctx.lineTo(s * 0.3, -s * 0.09); ctx.lineTo(s * 0.3, s * 0.09); ctx.lineTo(s * 0.2, 0); ctx.quadraticCurveTo(0, s * 0.16, -s * 0.26, 0);
    ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = darken(c, 0.5); lw(ctx, s, 0.02); ctx.stroke(); circle(ctx, -s * 0.16, -s * 0.02, s * 0.018, '#222'); ctx.restore();
  }
}
export function crab(ctx, s) {
  ellipse(ctx, 0, s * 0.05, s * 0.28, s * 0.2, '#e8432c', OUT, s * 0.03);
  for (const sx of [-1, 1]) { ellipse(ctx, sx * s * 0.34, -s * 0.12, s * 0.1, s * 0.13, '#e8432c', OUT, s * 0.03, sx * 0.4); for (let i = 0; i < 3; i++) { ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(sx * s * 0.24, s * 0.1 + i * s * 0.06); ctx.lineTo(sx * s * 0.42, s * 0.14 + i * s * 0.08); ctx.stroke(); } }
  circle(ctx, -s * 0.08, -s * 0.02, s * 0.03, '#fff'); circle(ctx, s * 0.08, -s * 0.02, s * 0.03, '#fff');
}
export function porkSkewer(ctx, s) {
  ctx.save(); ctx.rotate(-0.5);
  ctx.strokeStyle = '#c99a5b'; ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.moveTo(-s * 0.45, 0); ctx.lineTo(s * 0.45, 0); ctx.stroke();
  for (let i = 0; i < 4; i++) { fillRR(ctx, -s * 0.3 + i * s * 0.16, -s * 0.09, s * 0.13, s * 0.18, s * 0.04, i % 2 ? '#a5522a' : '#c26a35', OUT, s * 0.018); }
  ctx.restore();
}
export function stickyRice(ctx, s) {
  ellipse(ctx, 0, s * 0.1, s * 0.32, s * 0.18, '#fffdf3', OUT, s * 0.03);
  ctx.fillStyle = '#fffdf3'; ctx.beginPath(); ctx.arc(0, 0, s * 0.24, Math.PI, 0); ctx.fill(); ctx.strokeStyle = OUT; lw(ctx, s); ctx.stroke();
  ctx.fillStyle = 'rgba(190,180,150,.5)'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse((((i * 41) % 100) / 100 - 0.5) * s * 0.45, -((i * 29) % 100) / 100 * s * 0.2, s * 0.02, s * 0.012, 0.6, 0, TAU); ctx.fill(); }
}

// ------------------------------------------------------------------ bowls & meals (side view for noodle packs)
export function noodleBowl(ctx, s, o = {}) {
  const bowl = o.bowl || '#e8352a', top = o.topping || 'shrimp';
  // noodles swirl
  ctx.beginPath(); ctx.ellipse(0, -s * 0.06, s * 0.36, s * 0.14, 0, 0, TAU); ctx.fillStyle = o.soup || '#d97a26'; ctx.fill();
  ctx.strokeStyle = '#f7d774'; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.3 + i * s * 0.02, -s * 0.05); ctx.bezierCurveTo(-s * 0.2, -s * 0.36 - (i % 3) * s * 0.03, s * 0.05, -s * 0.05, s * 0.24 - i * s * 0.03, -s * 0.28 + (i % 2) * s * 0.02); ctx.stroke(); }
  if (top === 'shrimp') { ctx.save(); ctx.translate(-s * 0.1, -s * 0.2); ctx.scale(0.4, 0.4); shrimp(ctx, s, {}); ctx.restore(); ctx.save(); ctx.translate(s * 0.15, -s * 0.16); ctx.scale(0.32, 0.32); shrimp(ctx, s, {}); ctx.restore(); }
  if (top === 'pork') { for (let i = 0; i < 3; i++) ellipse(ctx, -s * 0.15 + i * s * 0.14, -s * 0.2 + (i % 2) * s * 0.04, s * 0.07, s * 0.045, '#c0704a', OUT, s * 0.015); }
  if (top === 'egg') { circle(ctx, s * 0.1, -s * 0.2, s * 0.08, '#fff', OUT, s * 0.015); circle(ctx, s * 0.1, -s * 0.2, s * 0.04, '#ffb700'); }
  if (top === 'veg') { leaf(ctx, -s * 0.15, -s * 0.16, s * 0.2, s * 0.06, -0.6, '#2fa04a'); leaf(ctx, s * 0.05, -s * 0.18, s * 0.2, s * 0.06, -1.0, '#4cc060'); circle(ctx, s * 0.18, -s * 0.2, s * 0.03, '#e8261c'); }
  // bowl
  ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.06); ctx.bezierCurveTo(-s * 0.38, s * 0.3, -s * 0.2, s * 0.38, 0, s * 0.38); ctx.bezierCurveTo(s * 0.2, s * 0.38, s * 0.38, s * 0.3, s * 0.4, -s * 0.06); ctx.closePath();
  ctx.fillStyle = bowl; ctx.fill(); ctx.strokeStyle = darken(bowl, 0.55); lw(ctx, s); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(-s * 0.2, s * 0.08, s * 0.05, s * 0.14, 0.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = o.rim || '#ffd54a'; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(-s * 0.36, s * 0.06); ctx.bezierCurveTo(-s * 0.2, s * 0.14, s * 0.2, s * 0.14, s * 0.36, s * 0.06); ctx.stroke();
  if (o.steam !== false) steam(ctx, s, 0, -s * 0.33);
}
// top-down plate for ready-meal lids
export function plateTop(ctx, s, o = {}) {
  const kind = o.kind || 'basil';
  circle(ctx, 0, 0, s * 0.48, '#f4f4ef'); circle(ctx, 0, 0, s * 0.43, '#fff'); ctx.strokeStyle = '#d0d0c8'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.arc(0, 0, s * 0.43, 0, TAU); ctx.stroke();
  const rice = (x, y, r) => { ellipse(ctx, x, y, r, r * 0.9, '#fffdf2', '#e0dccb', s * 0.01); ctx.fillStyle = 'rgba(200,195,170,.5)'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.ellipse(x + (((i * 37) % 100) / 100 - 0.5) * r * 1.6, y + (((i * 61) % 100) / 100 - 0.5) * r * 1.4, s * 0.012, s * 0.007, 0.5, 0, TAU); ctx.fill(); } };
  const egg = (x, y, r) => { ctx.beginPath(); for (let i = 0; i < 9; i++) { const a = (i * TAU) / 9, rr = r * (0.85 + 0.25 * Math.sin(i * 2.3)); i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#e6e2d2'; lw(ctx, s, 0.012); ctx.stroke(); circle(ctx, x, y, r * 0.42, '#ffb400'); shine(ctx, x - r * 0.12, y - r * 0.12, r * 0.12, r * 0.07, -0.5, 0.7); };
  if (kind === 'basil') {
    rice(-s * 0.16, -s * 0.05, s * 0.22);
    ellipse(ctx, s * 0.14, s * 0.06, s * 0.22, s * 0.2, '#6a3f1f', '#3a2010', s * 0.015);
    ctx.fillStyle = '#2f7a2f'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(s * 0.14 + (((i * 47) % 100) / 100 - 0.5) * s * 0.36, s * 0.06 + (((i * 31) % 100) / 100 - 0.5) * s * 0.3, s * 0.02, s * 0.012, i, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e8261c'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(s * 0.05 + i * s * 0.05, s * 0.0 + (i % 3) * s * 0.06, s * 0.025, s * 0.012, i, 0, TAU); ctx.fill(); }
    egg(-s * 0.02, -s * 0.24, s * 0.16);
  } else if (kind === 'chickenrice') {
    rice(-s * 0.05, s * 0.04, s * 0.26);
    for (let i = 0; i < 5; i++) fillRR(ctx, -s * 0.22 + i * s * 0.09, -s * 0.28 + (i % 2) * s * 0.02, s * 0.1, s * 0.2, s * 0.03, '#f3dcae', '#b58a4a', s * 0.01);
    ctx.fillStyle = '#4a9a3a'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(s * 0.3, -s * 0.2 + i * s * 0.03, s * 0.03, 0, TAU); ctx.fill(); }
    ellipse(ctx, s * 0.26, s * 0.3, s * 0.1, s * 0.06, '#c8a03a', '#7a5a10', s * 0.01);
  } else if (kind === 'friedrice') {
    ellipse(ctx, 0, 0, s * 0.34, s * 0.3, '#f0cf6a', '#a8801e', s * 0.02);
    for (let i = 0; i < 18; i++) { const a = i * 2.4; ctx.fillStyle = ['#e8542a', '#3aa04a', '#fff', '#c07a2a'][i % 4]; ctx.beginPath(); ctx.ellipse(Math.cos(a) * s * 0.2 * ((i % 4) / 3 + 0.3), Math.sin(a) * s * 0.18 * ((i % 4) / 3 + 0.3), s * 0.025, s * 0.017, a, 0, TAU); ctx.fill(); }
    shrimp(ctx, s * 0.35, {}); ctx.save(); ctx.translate(s * 0.2, -s * 0.15); shrimp(ctx, s * 0.3, {}); ctx.restore();
  } else if (kind === 'greencurry') {
    ellipse(ctx, s * 0.12, 0, s * 0.3, s * 0.3, '#5fa844', '#2c6a22', s * 0.02); ctx.fillStyle = '#e9f3d0'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(s * 0.12 + Math.cos(i) * s * 0.15, Math.sin(i * 1.7) * s * 0.15, s * 0.05, s * 0.03, i, 0, TAU); ctx.fill(); }
    rice(-s * 0.24, s * 0.02, s * 0.18);
  } else if (kind === 'padthai') {
    ctx.strokeStyle = '#e9a13a'; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(0, 0, s * (0.08 + (i % 5) * 0.045), i, i + 2.4); ctx.stroke(); }
    shrimp(ctx, s * 0.3, {}); ctx.save(); ctx.translate(-s * 0.1, s * 0.1); ctx.rotate(2); shrimp(ctx, s * 0.28, {}); ctx.restore();
    ctx.fillStyle = '#7cc04a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(s * 0.28, -s * 0.2 + i * s * 0.02, s * 0.02, s * 0.06, 0.3, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.translate(s * 0.3, s * 0.25); lime(ctx, s * 0.22, {}); ctx.restore();
  } else if (kind === 'spaghetti') {
    ctx.strokeStyle = '#e8b04a'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(0, 0, s * (0.06 + (i % 6) * 0.05), i * 0.7, i * 0.7 + 2.6); ctx.stroke(); }
    ctx.fillStyle = '#2f9a45'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(Math.cos(i * 1.4) * s * 0.18, Math.sin(i * 1.4) * s * 0.18, s * 0.04, s * 0.02, i, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e8261c'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 1.9 + 1) * s * 0.15, Math.sin(i * 1.9 + 1) * s * 0.15, s * 0.028, 0, TAU); ctx.fill(); }
    ellipse(ctx, s * 0.18, s * 0.05, s * 0.07, s * 0.05, '#7a3a2a', OUT, s * 0.01);
  } else if (kind === 'omelette') {
    ellipse(ctx, s * 0.05, -s * 0.05, s * 0.34, s * 0.24, '#ffd23a', '#c8901a', s * 0.02); shine(ctx, -s * 0.1, -s * 0.15, s * 0.1, s * 0.04, -0.3, 0.6);
    rice(-s * 0.1, s * 0.22, s * 0.2);
  } else if (kind === 'porkgarlic') {
    rice(-s * 0.2, 0, s * 0.2);
    for (let i = 0; i < 5; i++) ellipse(ctx, s * 0.05 + (i % 3) * s * 0.11, -s * 0.15 + Math.floor(i / 3) * s * 0.2, s * 0.07, s * 0.055, '#c98a4a', '#6a3f1a', s * 0.012, i);
    ctx.fillStyle = '#f4e6a0'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(s * 0.15 + (((i * 47) % 100) / 100 - 0.5) * s * 0.36, (((i * 31) % 100) / 100 - 0.5) * s * 0.36, s * 0.012, 0, TAU); ctx.fill(); }
  } else if (kind === 'somtam') {
    ellipse(ctx, 0, 0, s * 0.34, s * 0.3, '#fbe9c0', '#c9a15a', s * 0.02);
    ctx.strokeStyle = '#f3b25a'; ctx.lineWidth = s * 0.02; for (let i = 0; i < 20; i++) { ctx.beginPath(); ctx.moveTo(Math.cos(i * 2.1) * s * 0.2, Math.sin(i * 1.3) * s * 0.2); ctx.lineTo(Math.cos(i * 2.1) * s * 0.25 + s * 0.05, Math.sin(i * 1.3) * s * 0.2 + s * 0.05); ctx.stroke(); }
    ctx.fillStyle = '#e8261c'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 1.1) * s * 0.17, Math.sin(i * 1.7) * s * 0.17, s * 0.022, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e8a060'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 1.6) * s * 0.12, Math.sin(i * 2.1) * s * 0.14, s * 0.028, 0, TAU); ctx.fill(); }
  } else if (kind === 'congee') {
    ellipse(ctx, 0, 0, s * 0.36, s * 0.32, '#f6f0e0', '#c8bfa0', s * 0.02);
    ctx.fillStyle = '#c07a4a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 1.3) * s * 0.12, Math.sin(i * 2.3) * s * 0.12, s * 0.035, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#3aa04a'; ctx.lineWidth = s * 0.03; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(Math.cos(i * 1.9) * s * 0.18, Math.sin(i * 1.4) * s * 0.18); ctx.lineTo(Math.cos(i * 1.9) * s * 0.2 + s * 0.03, Math.sin(i * 1.4) * s * 0.2); ctx.stroke(); }
    circle(ctx, 0, 0, s * 0.07, '#fff', '#e6e2d2', s * 0.01); circle(ctx, 0, 0, s * 0.035, '#ffb400');
  } else if (kind === 'terijaki') {
    rice(-s * 0.18, 0, s * 0.2);
    for (let i = 0; i < 4; i++) ellipse(ctx, s * 0.12 + (i % 2) * s * 0.06, -s * 0.2 + i * s * 0.11, s * 0.13, s * 0.05, '#7a3a14', '#3a1a08', s * 0.012, 0.15);
    ctx.fillStyle = '#f8f0d8'; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(s * 0.1 + (((i * 47) % 100) / 100 - 0.3) * s * 0.3, (((i * 31) % 100) / 100 - 0.5) * s * 0.4, s * 0.008, 0, TAU); ctx.fill(); }
  }
}
export function friedEgg(ctx, s) { ellipse(ctx, 0, 0, s * 0.36, s * 0.3, '#fff', '#dcd6c0', s * 0.02); circle(ctx, 0, 0, s * 0.13, '#ffb400'); shine(ctx, -s * 0.04, -s * 0.05, s * 0.04, s * 0.025, -0.5, 0.7); }
export function bun(ctx, s, o = {}) {
  ctx.beginPath(); ctx.moveTo(-s * 0.42, s * 0.22); ctx.bezierCurveTo(-s * 0.44, -s * 0.34, s * 0.44, -s * 0.34, s * 0.42, s * 0.22); ctx.quadraticCurveTo(0, s * 0.34, -s * 0.42, s * 0.22);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.5, [[0, '#fffdf7'], [1, '#efe2c4']], -s * 0.1, -s * 0.15); ctx.fill(); ctx.strokeStyle = '#a58a5a'; lw(ctx, s); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,130,80,.5)'; ctx.lineWidth = s * 0.02; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, -s * 0.28); ctx.quadraticCurveTo((i - 2) * s * 0.12, -s * 0.15, (i - 2) * s * 0.17, s * 0.05); ctx.stroke(); }
  if (o.filling) { ctx.fillStyle = o.filling; ctx.beginPath(); ctx.arc(s * 0.3, s * 0.18, s * 0.06, 0, TAU); ctx.fill(); }
  steam(ctx, s, 0, -s * 0.3);
}
export function sandwich(ctx, s, o = {}) {
  ctx.save(); ctx.rotate(-0.15);
  const layers = [['#f1d9a2', 0.11], [o.l1 || '#f2b6a0', 0.06], [o.l2 || '#7cc04a', 0.06], [o.l3 || '#ffd23a', 0.05], ['#f1d9a2', 0.11]];
  let y = -s * 0.24;
  ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.28); ctx.lineTo(0, -s * 0.36); ctx.lineTo(s * 0.4, s * 0.28); ctx.closePath(); ctx.clip();
  for (const [c, h] of layers) { ctx.fillStyle = c; ctx.fillRect(-s * 0.5, y, s, h * s * 1.3); y += h * s * 1.3; }
  ctx.restore();
  ctx.save(); ctx.rotate(-0.15); ctx.strokeStyle = '#8a6a30'; lw(ctx, s); ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.28); ctx.lineTo(0, -s * 0.36); ctx.lineTo(s * 0.4, s * 0.28); ctx.closePath(); ctx.stroke(); ctx.restore();
}
export function onigiri(ctx, s, o = {}) {
  ctx.beginPath(); ctx.moveTo(0, -s * 0.36); ctx.quadraticCurveTo(s * 0.5, s * 0.25, s * 0.36, s * 0.32); ctx.quadraticCurveTo(0, s * 0.4, -s * 0.36, s * 0.32); ctx.quadraticCurveTo(-s * 0.5, s * 0.25, 0, -s * 0.36);
  ctx.fillStyle = '#fffef8'; ctx.fill(); ctx.strokeStyle = '#c8c4b0'; lw(ctx, s); ctx.stroke();
  fillRR(ctx, -s * 0.2, s * 0.06, s * 0.4, s * 0.3, s * 0.02, '#12301c'); if (o.filling) circle(ctx, 0, -s * 0.05, s * 0.06, o.filling);
}
export function friedChicken(ctx, s) {
  ctx.save(); ctx.rotate(-0.3);
  ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.1); ctx.bezierCurveTo(-s * 0.42, -s * 0.34, s * 0.3, -s * 0.32, s * 0.28, s * 0.02); ctx.bezierCurveTo(s * 0.26, s * 0.24, -s * 0.2, s * 0.32, -s * 0.4, s * 0.1);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.5, [[0, '#f5b13b'], [1, '#b8651a']], -s * 0.1, -s * 0.1); ctx.fill(); ctx.strokeStyle = '#6a3a0a'; lw(ctx, s); ctx.stroke();
  fillRR(ctx, s * 0.26, -s * 0.06, s * 0.2, s * 0.09, s * 0.04, '#f6ecd0', '#a8946a', s * 0.015); circle(ctx, s * 0.47, -s * 0.03, s * 0.05, '#f6ecd0', '#a8946a', s * 0.015);
  ctx.fillStyle = 'rgba(255,220,140,.6)'; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc((((i * 37) % 100) / 100 - 0.6) * s * 0.6, (((i * 53) % 100) / 100 - 0.55) * s * 0.5, s * 0.012, 0, TAU); ctx.fill(); }
  ctx.restore();
}
export function sausage(ctx, s, o = {}) {
  ctx.save(); ctx.rotate(-0.35);
  fillRR(ctx, -s * 0.4, -s * 0.09, s * 0.8, s * 0.18, s * 0.09, o.c1 || '#c7523a', OUT, s * 0.025); shine(ctx, -s * 0.1, -s * 0.03, s * 0.2, s * 0.02, 0, 0.5);
  if (o.cheese) { ctx.fillStyle = '#ffd23a'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-s * 0.2 + i * s * 0.14, 0, s * 0.03, 0, TAU); ctx.fill(); } }
  ctx.restore();
}
export function frenchFries(ctx, s) {
  ctx.fillStyle = '#e8261c'; ctx.beginPath(); ctx.moveTo(-s * 0.25, s * 0.1); ctx.lineTo(-s * 0.2, s * 0.4); ctx.lineTo(s * 0.2, s * 0.4); ctx.lineTo(s * 0.25, s * 0.1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUT; lw(ctx, s); ctx.stroke();
  for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate((i - 3.5) * 0.09); fillRR(ctx, -s * 0.025 + (i - 3.5) * s * 0.05, -s * 0.34 + (i % 3) * s * 0.03, s * 0.05, s * 0.46, s * 0.01, '#f6c93a', '#a8801e', s * 0.01); ctx.restore(); }
}

// ------------------------------------------------------------------ drinks
export function iceGlass(ctx, s, o = {}) {
  const c = o.c1 || '#ff9a1f';
  ctx.beginPath(); ctx.moveTo(-s * 0.26, -s * 0.36); ctx.lineTo(s * 0.26, -s * 0.36); ctx.lineTo(s * 0.2, s * 0.38); ctx.lineTo(-s * 0.2, s * 0.38); ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(); ctx.strokeStyle = OUT; lw(ctx, s); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.moveTo(-s * 0.24, -s * 0.28); ctx.lineTo(s * 0.24, -s * 0.28); ctx.lineTo(s * 0.19, s * 0.36); ctx.lineTo(-s * 0.19, s * 0.36); ctx.closePath(); ctx.clip();
  ctx.fillStyle = linGrad(ctx, 0, -s * 0.3, 0, s * 0.4, [[0, lighten(c, 0.2)], [1, darken(c, 0.15)]]); ctx.fillRect(-s * 0.3, -s * 0.28, s * 0.6, s * 0.7);
  if (o.c2) { ctx.fillStyle = o.c2; ctx.fillRect(-s * 0.3, -s * 0.28, s * 0.6, s * 0.16); }
  ctx.restore();
  for (const [x, y, r] of [[-0.08, -0.12, 0.3], [0.08, 0.02, -0.2], [-0.06, 0.15, 0.5]]) { ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r); fillRR(ctx, -s * 0.08, -s * 0.08, s * 0.16, s * 0.16, s * 0.025, 'rgba(255,255,255,.55)', 'rgba(255,255,255,.9)', s * 0.01); ctx.restore(); }
  ctx.strokeStyle = o.straw || '#e8261c'; ctx.lineWidth = s * 0.04; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * 0.05, s * 0.3); ctx.lineTo(s * 0.2, -s * 0.5); ctx.stroke();
  if (o.slice) { ctx.save(); ctx.translate(-s * 0.26, -s * 0.36); ctx.scale(0.5, 0.5); lemonSlice(ctx, s * 0.6, { c1: o.slice }); ctx.restore(); }
}
export function beerMug(ctx, s, o = {}) {
  fillRR(ctx, -s * 0.24, -s * 0.28, s * 0.42, s * 0.6, s * 0.05, linGrad(ctx, 0, -s * 0.28, 0, s * 0.32, [[0, '#ffd45a'], [1, '#e08a10']]), OUT, s * 0.03);
  ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.06; ctx.beginPath(); ctx.arc(s * 0.2, 0.02 * s, s * 0.14, -1.2, 1.2); ctx.stroke();
  for (const [x, y, r] of [[-0.18, -0.34, 0.1], [-0.04, -0.4, 0.12], [0.1, -0.34, 0.1], [-0.1, -0.3, 0.09], [0.04, -0.3, 0.09]]) circle(ctx, x * s + s * 0.03, y * s, r * s, '#fff', '#ddd', s * 0.01);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-s * 0.12 + (i % 3) * s * 0.1, s * 0.05 + i * s * 0.06, s * 0.012, 0, TAU); ctx.fill(); }
}
export function waterDrop(ctx, s, o = {}) {
  drop(ctx, 0, 0, s * 0.3, o.c1 || '#4db8ff', '#0b5c9c', s * 0.03); shine(ctx, -s * 0.09, -s * 0.06, s * 0.05, s * 0.09, 0.4, 0.7);
}
export function milkSplash(ctx, s) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#b8d0e8'; lw(ctx, s, 0.02);
  ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.2); ctx.bezierCurveTo(-s * 0.5, -s * 0.1, -s * 0.2, -s * 0.05, -s * 0.28, -s * 0.34); ctx.bezierCurveTo(-s * 0.1, -s * 0.2, -s * 0.05, -s * 0.4, 0, -s * 0.42); ctx.bezierCurveTo(s * 0.05, -s * 0.3, s * 0.2, -s * 0.22, s * 0.3, -s * 0.36); ctx.bezierCurveTo(s * 0.32, -s * 0.1, s * 0.5, -s * 0.05, s * 0.4, s * 0.2); ctx.quadraticCurveTo(0, s * 0.4, -s * 0.4, s * 0.2); ctx.fill(); ctx.stroke();
  for (const [x, y, r] of [[-0.44, -0.2, 0.05], [0.46, -0.28, 0.06], [0.1, -0.5, 0.04]]) { circle(ctx, x * s, y * s, r * s, '#fff', '#b8d0e8', s * 0.01); }
}
export function coffeeCup(ctx, s, o = {}) {
  ellipse(ctx, 0, s * 0.3, s * 0.4, s * 0.09, '#eee', '#999', s * 0.02);
  ctx.beginPath(); ctx.moveTo(-s * 0.27, -s * 0.12); ctx.lineTo(s * 0.27, -s * 0.12); ctx.bezierCurveTo(s * 0.27, s * 0.28, -s * 0.27, s * 0.28, -s * 0.27, -s * 0.12); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = OUT; lw(ctx, s); ctx.stroke();
  ellipse(ctx, 0, -s * 0.12, s * 0.27, s * 0.06, o.c1 || '#6b3e1c', OUT, s * 0.02);
  ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.arc(s * 0.28, s * 0.03, s * 0.09, -1.4, 1.4); ctx.stroke(); steam(ctx, s, 0, -s * 0.16);
}
export function teaLeaf(ctx, s, o = {}) { leaf(ctx, -s * 0.25, s * 0.2, s * 0.6, s * 0.16, -0.7, o.c1 || '#3ba54a'); leaf(ctx, -s * 0.1, s * 0.3, s * 0.55, s * 0.14, -1.2, darken(o.c1 || '#3ba54a', 0.2)); }
export function honey(ctx, s) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6 + 0.5; i ? ctx.lineTo(Math.cos(a) * s * 0.32, Math.sin(a) * s * 0.32) : ctx.moveTo(Math.cos(a) * s * 0.32, Math.sin(a) * s * 0.32); } ctx.closePath(); ctx.fillStyle = '#ffc21a'; ctx.fill(); ctx.strokeStyle = '#a06a08'; lw(ctx, s); ctx.stroke(); drop(ctx, 0, 0, s * 0.1, '#ff9a1f', '#a06a08', s * 0.015); }
export function iceCubes(ctx, s) { for (const [x, y, r] of [[-0.15, -0.05, 0.3], [0.15, 0.0, -0.2], [0, 0.18, 0.5]]) { ctx.save(); ctx.translate(x * s, y * s); ctx.rotate(r); fillRR(ctx, -s * 0.13, -s * 0.13, s * 0.26, s * 0.26, s * 0.04, 'rgba(200,235,255,.8)', '#fff', s * 0.02); ctx.restore(); } }

// ------------------------------------------------------------------ sweets & bakery
export function chocBar(ctx, s, o = {}) {
  const c = o.c1 || '#5a2c14';
  ctx.save(); ctx.rotate(-0.3);
  fillRR(ctx, -s * 0.36, -s * 0.2, s * 0.72, s * 0.4, s * 0.03, c, OUT, s * 0.025);
  ctx.strokeStyle = darken(c, 0.35); ctx.lineWidth = s * 0.02;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.36 + i * s * 0.18, -s * 0.2); ctx.lineTo(-s * 0.36 + i * s * 0.18, s * 0.2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-s * 0.36, 0); ctx.lineTo(s * 0.36, 0); ctx.stroke();
  shine(ctx, -s * 0.2, -s * 0.1, s * 0.1, s * 0.03, 0, 0.35); ctx.restore();
}
export function cookie(ctx, s, o = {}) {
  const c = o.c1 || '#c98a4a';
  circle(ctx, 0, 0, s * 0.36, c, darken(c, 0.5), s * 0.025);
  ctx.fillStyle = o.c2 || '#3a1c0e'; for (const [x, y] of [[-0.14, -0.1], [0.12, -0.15], [0.05, 0.1], [-0.12, 0.16], [0.2, 0.08]]) { ctx.beginPath(); ctx.ellipse(x * s, y * s, s * 0.05, s * 0.04, x * 5, 0, TAU); ctx.fill(); }
}
export function sandwichCookie(ctx, s, o = {}) {
  circle(ctx, 0, 0, s * 0.36, o.c1 || '#2a1a12', '#000', s * 0.025); circle(ctx, 0, 0, s * 0.25, o.c2 || '#fff', null); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = s * 0.015; ctx.beginPath(); ctx.arc(0, 0, s * 0.31, 0, TAU); ctx.stroke();
}
export function wafer(ctx, s, o = {}) {
  ctx.save(); ctx.rotate(-0.4); fillRR(ctx, -s * 0.36, -s * 0.13, s * 0.72, s * 0.26, s * 0.03, o.c1 || '#e9c27a', OUT, s * 0.025);
  ctx.strokeStyle = darken(o.c1 || '#e9c27a', 0.3); ctx.lineWidth = s * 0.012; for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.06, -s * 0.13); ctx.lineTo(i * s * 0.06 + s * 0.05, s * 0.13); ctx.stroke(); }
  ctx.restore();
}
export function pocky(ctx, s, o = {}) {
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(-0.35 + i * 0.16); fillRR(ctx, -s * 0.03, -s * 0.42, s * 0.06, s * 0.6, s * 0.03, '#efd9a6', OUT, s * 0.012); fillRR(ctx, -s * 0.03, -s * 0.42, s * 0.06, s * 0.38, s * 0.03, o.c1 || '#5a2c14', OUT, s * 0.012); ctx.restore(); }
}
export function candy(ctx, s, o = {}) {
  const c = o.c1 || '#ff3b7a';
  ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.15); ctx.lineTo(-s * 0.24, 0); ctx.lineTo(-s * 0.4, s * 0.15); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.15); ctx.lineTo(s * 0.24, 0); ctx.lineTo(s * 0.4, s * 0.15); ctx.closePath(); ctx.fill();
  ellipse(ctx, 0, 0, s * 0.27, s * 0.17, c, darken(c, 0.5), s * 0.025); shine(ctx, -s * 0.08, -s * 0.06, s * 0.09, s * 0.03, -0.2, 0.6);
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = s * 0.03; ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.12); ctx.lineTo(s * 0.1, -s * 0.12); ctx.stroke();
}
export function gumStrip(ctx, s, o = {}) { ctx.save(); ctx.rotate(-0.4); for (let i = 0; i < 3; i++) fillRR(ctx, -s * 0.36, -s * 0.22 + i * s * 0.16, s * 0.72, s * 0.13, s * 0.02, [o.c1 || '#7ee0b0', '#fff', o.c1 || '#7ee0b0'][i], OUT, s * 0.012); ctx.restore(); }
export function jellyCup(ctx, s, o = {}) {
  const c = o.c1 || '#ff7ab0';
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.05); ctx.lineTo(-s * 0.22, s * 0.3); ctx.lineTo(s * 0.22, s * 0.3); ctx.lineTo(s * 0.3, -s * 0.05); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fill(); ctx.strokeStyle = OUT; lw(ctx, s); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -s * 0.05, s * 0.3, Math.PI, 0); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.moveTo(-s * 0.28, -s * 0.05); ctx.lineTo(-s * 0.21, s * 0.28); ctx.lineTo(s * 0.21, s * 0.28); ctx.lineTo(s * 0.28, -s * 0.05); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.restore(); shine(ctx, -s * 0.12, -s * 0.12, s * 0.05, s * 0.09, 0.2, 0.55);
}
export function iceCreamCone(ctx, s, o = {}) {
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.05); ctx.lineTo(0, s * 0.44); ctx.lineTo(s * 0.2, -s * 0.05); ctx.closePath(); ctx.fillStyle = '#e0a95a'; ctx.fill(); ctx.strokeStyle = '#8a5a1a'; lw(ctx, s); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,70,20,.5)'; ctx.lineWidth = s * 0.015; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.08, -s * 0.05); ctx.lineTo(i * s * 0.03 + s * 0.02, s * 0.36); ctx.stroke(); }
  circle(ctx, 0, -s * 0.12, s * 0.24, o.c1 || '#fff2d0', darken(o.c1 || '#fff2d0', 0.4), s * 0.025); circle(ctx, 0, -s * 0.3, s * 0.18, o.c2 || '#7a3f1c', OUT, s * 0.025); circle(ctx, s * 0.02, -s * 0.5, s * 0.05, '#e8261c');
}
export function iceStick(ctx, s, o = {}) {
  ctx.save(); ctx.rotate(-0.25); fillRR(ctx, -s * 0.07, s * 0.1, s * 0.14, s * 0.34, s * 0.03, '#e6c48a', '#8a6a30', s * 0.015);
  ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.14); ctx.lineTo(-s * 0.2, -s * 0.28); ctx.quadraticCurveTo(0, -s * 0.5, s * 0.2, -s * 0.28); ctx.lineTo(s * 0.2, s * 0.14); ctx.closePath();
  ctx.fillStyle = linGrad(ctx, 0, -s * 0.4, 0, s * 0.14, [[0, o.c1 || '#ff5aa0'], [0.55, o.c1 || '#ff5aa0'], [0.56, o.c2 || '#ffe14a'], [1, o.c2 || '#ffe14a']]); ctx.fill(); ctx.strokeStyle = OUT; lw(ctx, s); ctx.stroke();
  shine(ctx, -s * 0.09, -s * 0.15, s * 0.03, s * 0.12, 0, 0.5); ctx.restore();
}
export function iceTub(ctx, s, o = {}) {
  ctx.beginPath(); ctx.moveTo(-s * 0.36, -s * 0.08); ctx.lineTo(-s * 0.28, s * 0.36); ctx.lineTo(s * 0.28, s * 0.36); ctx.lineTo(s * 0.36, -s * 0.08); ctx.closePath(); ctx.fillStyle = o.c1 || '#fff'; ctx.fill(); ctx.strokeStyle = OUT; lw(ctx, s); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -s * 0.1, s * 0.38, s * 0.14, 0, 0, TAU); ctx.fillStyle = o.c2 || '#ffe0b0'; ctx.fill(); ctx.stroke();
  for (let i = 0; i < 4; i++) circle(ctx, (i - 1.5) * s * 0.14, -s * 0.12 + (i % 2) * s * 0.03, s * 0.055, darken(o.c2 || '#ffe0b0', 0.25));
}
export function croissant(ctx, s) {
  ctx.save(); ctx.rotate(0.15);
  ctx.beginPath(); ctx.moveTo(-s * 0.44, s * 0.12); ctx.quadraticCurveTo(-s * 0.4, -s * 0.3, 0, -s * 0.3); ctx.quadraticCurveTo(s * 0.4, -s * 0.3, s * 0.44, s * 0.12); ctx.quadraticCurveTo(s * 0.3, s * 0.0, s * 0.24, s * 0.16); ctx.quadraticCurveTo(0, s * 0.02, -s * 0.24, s * 0.16); ctx.quadraticCurveTo(-s * 0.3, s * 0.0, -s * 0.44, s * 0.12);
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.5, [[0, '#f4b85a'], [1, '#b8681c']], 0, -s * 0.15); ctx.fill(); ctx.strokeStyle = '#6a3a0a'; lw(ctx, s); ctx.stroke();
  ctx.strokeStyle = 'rgba(110,60,10,.6)'; ctx.lineWidth = s * 0.02; for (const x of [-0.24, -0.08, 0.08, 0.24]) { ctx.beginPath(); ctx.moveTo(x * s, -s * 0.28); ctx.quadraticCurveTo(x * s * 1.2, -s * 0.1, x * s * 0.95, s * 0.08); ctx.stroke(); }
  ctx.restore();
}
export function breadLoaf(ctx, s, o = {}) {
  ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.25); ctx.lineTo(-s * 0.4, -s * 0.05); ctx.bezierCurveTo(-s * 0.46, -s * 0.34, s * 0.46, -s * 0.34, s * 0.4, -s * 0.05); ctx.lineTo(s * 0.4, s * 0.25); ctx.closePath();
  ctx.fillStyle = radGrad(ctx, 0, 0, 0, s * 0.55, [[0, '#f0c27a'], [1, '#b8782a']], 0, -s * 0.2); ctx.fill(); ctx.strokeStyle = '#6a3a0a'; lw(ctx, s); ctx.stroke();
  fillRR(ctx, -s * 0.3, s * 0.02, s * 0.6, s * 0.2, s * 0.03, '#fff4d8', '#c8a860', s * 0.015);
}
export function cakeRoll(ctx, s, o = {}) {
  ellipse(ctx, 0, 0, s * 0.36, s * 0.3, o.c1 || '#f3d9a0', '#8a6a30', s * 0.025); ctx.strokeStyle = o.c2 || '#fff'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.arc(0, 0, s * 0.19, 0.5, 5.5); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * 0.09, 1, 6); ctx.stroke();
}
export function donut(ctx, s, o = {}) { circle(ctx, 0, 0, s * 0.36, '#d99a52', '#7a4a10', s * 0.025); circle(ctx, 0, 0, s * 0.3, o.c1 || '#ff7ab0'); circle(ctx, 0, 0, s * 0.1, '#0000'); ctx.globalCompositeOperation = 'destination-out'; circle(ctx, 0, 0, s * 0.1, '#000'); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(Math.cos(i * 0.8) * s * 0.2, Math.sin(i * 0.8) * s * 0.2, s * 0.02, s * 0.008, i, 0, TAU); ctx.fill(); } }

// ------------------------------------------------------------------ mascots & marks
export function elephant(ctx, s, o = {}) {
  const c = o.c1 || '#f4f0e6';
  ellipse(ctx, -s * 0.28, -s * 0.02, s * 0.2, s * 0.26, darken(c, 0.08), OUT, s * 0.03); ellipse(ctx, s * 0.28, -s * 0.02, s * 0.2, s * 0.26, darken(c, 0.08), OUT, s * 0.03);
  ellipse(ctx, 0, -s * 0.02, s * 0.27, s * 0.3, c, OUT, s * 0.03);
  ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, s * 0.02); ctx.quadraticCurveTo(0, s * 0.3, s * 0.12, s * 0.36); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = s * 0.075; ctx.beginPath(); ctx.moveTo(0, s * 0.02); ctx.quadraticCurveTo(0, s * 0.3, s * 0.12, s * 0.36); ctx.stroke();
  circle(ctx, -s * 0.1, -s * 0.08, s * 0.025, '#111'); circle(ctx, s * 0.1, -s * 0.08, s * 0.025, '#111');
  for (const sx of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; lw(ctx, s, 0.02); ctx.beginPath(); ctx.moveTo(sx * s * 0.14, s * 0.1); ctx.quadraticCurveTo(sx * s * 0.3, s * 0.2, sx * s * 0.34, s * 0.06); ctx.quadraticCurveTo(sx * s * 0.24, s * 0.16, sx * s * 0.14, s * 0.06); ctx.fill(); ctx.stroke(); }
}
export function lion(ctx, s, o = {}) {
  const mane = o.c1 || '#d99a2a';
  for (let i = 0; i < 14; i++) { const a = (i * TAU) / 14; ctx.save(); ctx.translate(Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.26); ctx.rotate(a); ellipse(ctx, 0, 0, s * 0.14, s * 0.07, mane, OUT, s * 0.02); ctx.restore(); }
  circle(ctx, 0, 0, s * 0.27, '#f2c46a', OUT, s * 0.03);
  circle(ctx, -s * 0.09, -s * 0.05, s * 0.03, '#222'); circle(ctx, s * 0.09, -s * 0.05, s * 0.03, '#222');
  poly(ctx, [[-s * 0.05, s * 0.02], [s * 0.05, s * 0.02], [0, s * 0.09]], '#7a3a2a'); ctx.strokeStyle = OUT; lw(ctx, s, 0.02); ctx.beginPath(); ctx.moveTo(0, s * 0.09); ctx.quadraticCurveTo(-s * 0.08, s * 0.17, -s * 0.13, s * 0.11); ctx.moveTo(0, s * 0.09); ctx.quadraticCurveTo(s * 0.08, s * 0.17, s * 0.13, s * 0.11); ctx.stroke();
}
export function bull(ctx, s, o = {}) {
  const c = o.c1 || '#e0261c';
  ctx.strokeStyle = OUT; ctx.fillStyle = c; lw(ctx, s, 0.03);
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * s * 0.12, -s * 0.16); ctx.quadraticCurveTo(sx * s * 0.42, -s * 0.2, sx * s * 0.42, -s * 0.44); ctx.quadraticCurveTo(sx * s * 0.3, -s * 0.28, sx * s * 0.1, -s * 0.06); ctx.fillStyle = '#f4ecd8'; ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.15); ctx.lineTo(s * 0.2, -s * 0.15); ctx.lineTo(s * 0.16, s * 0.2); ctx.quadraticCurveTo(0, s * 0.42, -s * 0.16, s * 0.2); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
  circle(ctx, -s * 0.09, -s * 0.03, s * 0.03, '#fff'); circle(ctx, s * 0.09, -s * 0.03, s * 0.03, '#fff'); circle(ctx, -s * 0.05, s * 0.25, s * 0.025, '#111'); circle(ctx, s * 0.05, s * 0.25, s * 0.025, '#111');
}
export function leopard(ctx, s, o = {}) {
  const c = o.c1 || '#f0b040';
  for (const sx of [-1, 1]) circle(ctx, sx * s * 0.2, -s * 0.22, s * 0.09, c, OUT, s * 0.025);
  ellipse(ctx, 0, 0, s * 0.3, s * 0.27, c, OUT, s * 0.03);
  ctx.fillStyle = '#2a1608'; for (const [x, y] of [[-0.18, -0.12], [0.18, -0.12], [-0.22, 0.05], [0.22, 0.05], [0, -0.2], [-0.08, 0.2], [0.09, 0.2]]) { ctx.beginPath(); ctx.arc(x * s, y * s, s * 0.03, 0, TAU); ctx.fill(); }
  circle(ctx, -s * 0.1, -s * 0.03, s * 0.035, '#fff', '#111', s * 0.01); circle(ctx, s * 0.1, -s * 0.03, s * 0.035, '#fff', '#111', s * 0.01); circle(ctx, -s * 0.1, -s * 0.03, s * 0.015, '#111'); circle(ctx, s * 0.1, -s * 0.03, s * 0.015, '#111');
  poly(ctx, [[-s * 0.04, s * 0.06], [s * 0.04, s * 0.06], [0, s * 0.11]], '#c04a4a');
}
export function tiger(ctx, s, o = {}) {
  const c = o.c1 || '#f28c1a';
  for (const sx of [-1, 1]) circle(ctx, sx * s * 0.22, -s * 0.24, s * 0.09, c, OUT, s * 0.025);
  ellipse(ctx, 0, 0, s * 0.3, s * 0.28, c, OUT, s * 0.03);
  ctx.strokeStyle = '#1e1208'; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round';
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx * s * 0.28, -s * 0.1 + i * s * 0.09); ctx.lineTo(sx * s * 0.16, -s * 0.08 + i * s * 0.08); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, -s * 0.27); ctx.lineTo(0, -s * 0.14); ctx.stroke();
  ellipse(ctx, 0, s * 0.1, s * 0.15, s * 0.1, '#fff', OUT, s * 0.02); circle(ctx, -s * 0.1, -s * 0.04, s * 0.03, '#111'); circle(ctx, s * 0.1, -s * 0.04, s * 0.03, '#111'); poly(ctx, [[-s * 0.04, s * 0.05], [s * 0.04, s * 0.05], [0, s * 0.1]], '#c04a4a');
}
export function crown(ctx, s, o = {}) { poly(ctx, [[-s * 0.35, s * 0.2], [-s * 0.4, -s * 0.2], [-s * 0.18, 0], [0, -s * 0.3], [s * 0.18, 0], [s * 0.4, -s * 0.2], [s * 0.35, s * 0.2]], o.c1 || '#ffc21a', OUT, s * 0.03); for (const x of [-0.4, 0, 0.4]) circle(ctx, x * s, x === 0 ? -s * 0.3 : -s * 0.2, s * 0.045, '#e8261c', OUT, s * 0.015); }
export function lightning(ctx, s, o = {}) { bolt(ctx, -s * 0.28, -s * 0.4, s * 0.56, s * 0.8, o.c1 || '#ffd21a', OUT, s * 0.03); }
export function sun(ctx, s, o = {}) { for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate((i * TAU) / 12); poly(ctx, [[-s * 0.04, -s * 0.28], [0, -s * 0.44], [s * 0.04, -s * 0.28]], o.c1 || '#ffc21a'); ctx.restore(); } circle(ctx, 0, 0, s * 0.22, o.c1 || '#ffc21a', '#c07a08', s * 0.02); }
export function snowflake(ctx, s) { ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = s * 0.04; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate((i * Math.PI) / 3); ctx.beginPath(); ctx.moveTo(0, -s * 0.36); ctx.lineTo(0, s * 0.36); ctx.stroke(); for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, d * s * 0.22); ctx.lineTo(-s * 0.08, d * s * 0.3); ctx.moveTo(0, d * s * 0.22); ctx.lineTo(s * 0.08, d * s * 0.3); ctx.stroke(); } ctx.restore(); } }
export function mountain(ctx, s, o = {}) { poly(ctx, [[-s * 0.45, s * 0.3], [-s * 0.1, -s * 0.3], [s * 0.1, 0], [s * 0.22, -s * 0.15], [s * 0.45, s * 0.3]], o.c1 || '#5b8ec8', OUT, s * 0.025); poly(ctx, [[-s * 0.16, -s * 0.2], [-s * 0.1, -s * 0.3], [-s * 0.04, -s * 0.2], [-s * 0.1, -s * 0.16]], '#fff'); }
export function heart(ctx, s, o = {}) { ctx.beginPath(); ctx.moveTo(0, s * 0.3); ctx.bezierCurveTo(-s * 0.5, -s * 0.05, -s * 0.25, -s * 0.4, 0, -s * 0.15); ctx.bezierCurveTo(s * 0.25, -s * 0.4, s * 0.5, -s * 0.05, 0, s * 0.3); ctx.fillStyle = o.c1 || '#ff3b6a'; ctx.fill(); ctx.strokeStyle = darken(o.c1 || '#ff3b6a', 0.5); lw(ctx, s); ctx.stroke(); }
export function cross(ctx, s, o = {}) { fillRR(ctx, -s * 0.09, -s * 0.32, s * 0.18, s * 0.64, s * 0.03, o.c1 || '#1e9d55'); fillRR(ctx, -s * 0.32, -s * 0.09, s * 0.64, s * 0.18, s * 0.03, o.c1 || '#1e9d55'); }
export function paw(ctx, s) { ellipse(ctx, 0, s * 0.1, s * 0.2, s * 0.16, '#444'); for (const [x, y] of [[-0.24, -0.08], [-0.08, -0.22], [0.08, -0.22], [0.24, -0.08]]) ellipse(ctx, x * s, y * s, s * 0.07, s * 0.09, '#444'); }
export function baby(ctx, s) { circle(ctx, 0, 0, s * 0.3, '#ffd9b0', OUT, s * 0.025); circle(ctx, -s * 0.1, -s * 0.03, s * 0.025, '#222'); circle(ctx, s * 0.1, -s * 0.03, s * 0.025, '#222'); ctx.strokeStyle = '#c04a4a'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.arc(0, s * 0.06, s * 0.07, 0.2, Math.PI - 0.2); ctx.stroke(); circle(ctx, -s * 0.17, s * 0.05, s * 0.04, 'rgba(255,120,120,.5)'); circle(ctx, s * 0.17, s * 0.05, s * 0.04, 'rgba(255,120,120,.5)'); }
export function soap(ctx, s, o = {}) { fillRR(ctx, -s * 0.34, -s * 0.2, s * 0.68, s * 0.4, s * 0.12, o.c1 || '#ff8ab0', darken(o.c1 || '#ff8ab0', 0.45), s * 0.025); shine(ctx, -s * 0.12, -s * 0.08, s * 0.14, s * 0.04, -0.2, 0.5); for (const [x, y, r] of [[0.3, -0.3, 0.06], [0.4, -0.15, 0.04], [0.22, -0.4, 0.04]]) circle(ctx, x * s, y * s, r * s, 'rgba(255,255,255,.7)', '#9cf', s * 0.008); }
export function toothpaste(ctx, s, o = {}) { ctx.save(); ctx.rotate(-0.5); fillRR(ctx, -s * 0.42, -s * 0.09, s * 0.7, s * 0.18, s * 0.03, '#fff', '#889', s * 0.02); fillRR(ctx, s * 0.24, -s * 0.06, s * 0.18, s * 0.12, s * 0.02, o.c1 || '#1e9dd5'); fillRR(ctx, -s * 0.42, -s * 0.09, s * 0.7, s * 0.06, s * 0.03, o.c1 || '#1e9dd5'); ctx.restore(); }
export function bottleSmall(ctx, s, o = {}) { fillRR(ctx, -s * 0.16, -s * 0.34, s * 0.32, s * 0.68, s * 0.06, o.c1 || '#4ab0e0', OUT, s * 0.025); fillRR(ctx, -s * 0.09, -s * 0.44, s * 0.18, s * 0.12, s * 0.03, o.c2 || '#fff', OUT, s * 0.02); shine(ctx, -s * 0.07, -s * 0.05, s * 0.03, s * 0.2, 0, 0.5); }
export function tissueBox(ctx, s, o = {}) { fillRR(ctx, -s * 0.34, -s * 0.18, s * 0.68, s * 0.42, s * 0.03, o.c1 || '#5ac8fa', OUT, s * 0.025); ellipse(ctx, 0, -s * 0.18, s * 0.16, s * 0.04, '#0a2a44'); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.18); ctx.quadraticCurveTo(0, -s * 0.5, s * 0.1, -s * 0.18); ctx.fill(); ctx.strokeStyle = '#bbb'; lw(ctx, s, 0.015); ctx.stroke(); }
export function battery(ctx, s, o = {}) { for (let i = 0; i < 2; i++) { ctx.save(); ctx.translate((i - 0.5) * s * 0.26, 0); fillRR(ctx, -s * 0.09, -s * 0.28, s * 0.18, s * 0.62, s * 0.03, o.c1 || '#e8261c', OUT, s * 0.02); fillRR(ctx, -s * 0.05, -s * 0.34, s * 0.1, s * 0.07, s * 0.01, '#bbb'); fillRR(ctx, -s * 0.09, -s * 0.02, s * 0.18, s * 0.12, 0, '#111'); ctx.restore(); } }
export function umbrella(ctx, s, o = {}) { ctx.beginPath(); ctx.arc(0, 0, s * 0.42, Math.PI, 0); for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(s * (0.42 - i * 0.21 - 0.105), -s * 0.06, s * (0.42 - (i + 1) * 0.21), 0); ctx.closePath(); ctx.fillStyle = o.c1 || '#e8261c'; ctx.fill(); ctx.strokeStyle = OUT; lw(ctx, s); ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = s * 0.035; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, s * 0.36); ctx.arc(s * 0.06, s * 0.36, s * 0.06, Math.PI, 0.6, true); ctx.stroke(); }
export function fan(ctx, s, o = {}) { circle(ctx, 0, -s * 0.08, s * 0.28, o.c1 || '#ff7ab0', OUT, s * 0.025); for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(0, -s * 0.08); ctx.rotate((i * TAU) / 5); ellipse(ctx, 0, -s * 0.13, s * 0.05, s * 0.11, '#fff', null); ctx.restore(); } fillRR(ctx, -s * 0.05, s * 0.18, s * 0.1, s * 0.24, s * 0.03, '#eee', OUT, s * 0.02); }
export function phoneCable(ctx, s) { ctx.strokeStyle = '#ddd'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.2); ctx.bezierCurveTo(s * 0.4, -s * 0.4, -s * 0.4, s * 0.2, s * 0.3, s * 0.2); ctx.stroke(); fillRR(ctx, -s * 0.4, -s * 0.28, s * 0.16, s * 0.14, s * 0.02, '#222'); fillRR(ctx, s * 0.24, s * 0.13, s * 0.16, s * 0.14, s * 0.02, '#222'); }
export function pen(ctx, s, o = {}) { ctx.save(); ctx.rotate(-0.6); fillRR(ctx, -s * 0.4, -s * 0.05, s * 0.8, s * 0.1, s * 0.04, o.c1 || '#1e6fd5', OUT, s * 0.015); poly(ctx, [[s * 0.4, -s * 0.05], [s * 0.5, 0], [s * 0.4, s * 0.05]], '#222'); ctx.restore(); }
export function lighter(ctx, s, o = {}) { fillRR(ctx, -s * 0.13, -s * 0.2, s * 0.26, s * 0.55, s * 0.05, o.c1 || '#ff3b6a', OUT, s * 0.025); fillRR(ctx, -s * 0.1, -s * 0.3, s * 0.2, s * 0.12, s * 0.02, '#ccc', OUT, s * 0.02); ctx.fillStyle = '#ffb400'; ctx.beginPath(); ctx.ellipse(0, -s * 0.4, s * 0.05, s * 0.09, 0, 0, TAU); ctx.fill(); }
export function inhaler(ctx, s, o = {}) { fillRR(ctx, -s * 0.11, -s * 0.34, s * 0.22, s * 0.68, s * 0.07, o.c1 || '#f2d21a', '#7a6408', s * 0.025); fillRR(ctx, -s * 0.11, -s * 0.34, s * 0.22, s * 0.14, s * 0.05, '#fff', '#7a6408', s * 0.02); shine(ctx, -s * 0.05, 0, s * 0.02, s * 0.2, 0, 0.5); }
export function balmJar(ctx, s, o = {}) { fillRR(ctx, -s * 0.28, -s * 0.06, s * 0.56, s * 0.3, s * 0.05, o.c1 || '#e8261c', OUT, s * 0.025); ellipse(ctx, 0, -s * 0.06, s * 0.28, s * 0.09, darken(o.c1 || '#e8261c', 0.15), OUT, s * 0.02); ellipse(ctx, 0, -s * 0.06, s * 0.17, s * 0.05, '#fff'); }
export function pill(ctx, s, o = {}) { ctx.save(); ctx.rotate(-0.6); fillRR(ctx, -s * 0.34, -s * 0.11, s * 0.34, s * 0.22, s * 0.11, o.c1 || '#e8261c', OUT, s * 0.02); fillRR(ctx, 0, -s * 0.11, s * 0.34, s * 0.22, s * 0.11, '#fff', OUT, s * 0.02); ctx.restore(); }
export function bandage(ctx, s) { ctx.save(); ctx.rotate(-0.5); fillRR(ctx, -s * 0.4, -s * 0.1, s * 0.8, s * 0.2, s * 0.09, '#f2c79a', '#a8794a', s * 0.02); fillRR(ctx, -s * 0.12, -s * 0.1, s * 0.24, s * 0.2, 0, '#fff'); ctx.restore(); }
export function mask(ctx, s) { ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.14); ctx.quadraticCurveTo(0, -s * 0.24, s * 0.4, -s * 0.14); ctx.lineTo(s * 0.36, s * 0.2); ctx.quadraticCurveTo(0, s * 0.3, -s * 0.36, s * 0.2); ctx.closePath(); ctx.fillStyle = '#8fd0f0'; ctx.fill(); ctx.strokeStyle = '#2a6a90'; lw(ctx, s); ctx.stroke(); ctx.strokeStyle = '#2a6a90'; ctx.lineWidth = s * 0.015; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.36, i * s * 0.09); ctx.quadraticCurveTo(0, i * s * 0.09 + s * 0.06, s * 0.36, i * s * 0.09); ctx.stroke(); } }
export function mosquito(ctx, s) { ctx.strokeStyle = '#222'; ctx.lineWidth = s * 0.02; for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sx * s * 0.3, -s * 0.15 + i * s * 0.14); ctx.stroke(); } ellipse(ctx, 0, 0, s * 0.06, s * 0.16, '#3a3a3a'); ellipse(ctx, -s * 0.16, -s * 0.16, s * 0.13, s * 0.06, 'rgba(180,180,200,.7)', '#666', s * 0.01, -0.4); ellipse(ctx, s * 0.16, -s * 0.16, s * 0.13, s * 0.06, 'rgba(180,180,200,.7)', '#666', s * 0.01, 0.4); ctx.strokeStyle = '#e8261c'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(-s * 0.42, s * 0.38); ctx.lineTo(s * 0.42, -s * 0.38); ctx.stroke(); circle(ctx, 0, 0, s * 0.44, null, '#e8261c', s * 0.05); }
export function sim(ctx, s, o = {}) { fillRR(ctx, -s * 0.22, -s * 0.3, s * 0.44, s * 0.6, s * 0.04, o.c1 || '#4ab04a', OUT, s * 0.02); ctx.beginPath(); ctx.moveTo(-s * 0.14, -s * 0.06); ctx.lineTo(s * 0.14, -s * 0.06); ctx.lineTo(s * 0.14, s * 0.22); ctx.lineTo(-s * 0.14, s * 0.22); ctx.closePath(); ctx.fillStyle = '#e8c85a'; ctx.fill(); ctx.strokeStyle = '#8a6a10'; ctx.lineWidth = s * 0.012; ctx.stroke(); }
export function egg(ctx, s) { ellipse(ctx, 0, 0, s * 0.24, s * 0.32, '#f6ead0', '#a8946a', s * 0.02); shine(ctx, -s * 0.08, -s * 0.1, s * 0.05, s * 0.09, 0.3, 0.6); }
export function riceBag(ctx, s) { fillRR(ctx, -s * 0.3, -s * 0.36, s * 0.6, s * 0.72, s * 0.05, '#f4f0e4', OUT, s * 0.025); ellipse(ctx, 0, 0, s * 0.18, s * 0.1, '#fff', '#c8c4b0', s * 0.015); }
export function spoon(ctx, s) { ctx.save(); ctx.rotate(-0.7); ellipse(ctx, -s * 0.28, 0, s * 0.14, s * 0.1, '#ddd', '#777', s * 0.015); fillRR(ctx, -s * 0.16, -s * 0.03, s * 0.55, s * 0.06, s * 0.03, '#ddd', '#777', s * 0.015); ctx.restore(); }
export function tuna(ctx, s) { ellipse(ctx, 0, 0, s * 0.42, s * 0.16, '#f0a09a', '#7a3030', s * 0.02); poly(ctx, [[s * 0.4, 0], [s * 0.55, -s * 0.13], [s * 0.55, s * 0.13]], '#f0a09a', '#7a3030', s * 0.02); circle(ctx, -s * 0.3, -s * 0.03, s * 0.025, '#111'); ctx.strokeStyle = '#c0605a'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.14); ctx.quadraticCurveTo(0, -s * 0.28, s * 0.14, -s * 0.13); ctx.stroke(); }

// Registry so SKU data can refer to illustrations by name.
export const ILLUS = {
  orange, lemon: lemonSlice, lime, strawberry, mango, mangoSlice, watermelon, pineapple, coconut, banana, grape, lychee, chili, herb, garlic,
  chips: chipsPile, seaweed, nuts, shrimp, squid, fishSnack, crab, porkSkewer, stickyRice,
  noodleBowl, plate: plateTop, egg: friedEgg, bun, sandwich, onigiri, friedChicken, sausage, fries: frenchFries,
  iceGlass, beerMug, waterDrop, milkSplash, coffeeCup, teaLeaf, honey, iceCubes,
  chocBar, cookie, sandwichCookie, wafer, pocky, candy, gum: gumStrip, jelly: jellyCup, cone: iceCreamCone, iceStick, iceTub, croissant, bread: breadLoaf, cakeRoll, donut,
  elephant, lion, bull, leopard, tiger, crown, lightning, sun, snowflake, mountain, heart, cross, paw, baby, soap, toothpaste, bottleSmall, tissueBox, battery, umbrella, fan, cable: phoneCable, pen, lighter, inhaler, balm: balmJar, pill, bandage, mask, mosquito, sim, eggs: egg, riceBag, spoon, tuna,
};
// name may be a composite like 'seaweed+chips' (first = background element, second = foreground element)
export function drawIllus(ctx, name, x, y, size, o = {}) {
  const parts = String(name).split('+');
  if (parts.length > 1) {
    const layout = [[-0.14, -0.06, 0.82], [0.14, 0.1, 0.66], [0, 0.2, 0.5]];
    parts.slice(0, 3).forEach((p, i) => { const [dx, dy, k] = layout[i]; drawIllus(ctx, p, x + dx * size, y + dy * size, size * k, o); });
    return;
  }
  const f = ILLUS[name];
  if (!f) return;
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); f(ctx, size, o); ctx.restore();
}

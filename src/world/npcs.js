// People and animals: the cashier, shoppers, a monk on the pavement and the sleeping soi dog.
import * as THREE from 'three';
import { makeCanvas, fillRR, circle, ellipse, langText, fitText } from '../gfx/draw.js';
import { canvasTex } from '../gfx/surfaces.js';
import { BRAND, drawStripes, drawLogo } from '../gfx/logo11seven.js';
import { ENV } from './materials.js';
import { rng, damp, lerp, clamp, hashStr } from '../core/util.js';
import { L } from './layout.js';
import { DYN, resolveStatic } from './colliders.js';
import { findPath } from './nav.js';

const skinTones = [0xf0c9a0, 0xe0b48a, 0xc98f62, 0xa8724a];
const stdM = (params) => new THREE.MeshStandardMaterial({ roughness: 0.8, envMap: ENV.inTex, envMapIntensity: 0.6, ...params });

function faceTexture(skin, female) {
  const { canvas, ctx } = makeCanvas(256, 128);
  ctx.fillStyle = '#' + skin.toString(16).padStart(6, '0'); ctx.fillRect(0, 0, 256, 128);
  // front of the sphere sits at u = 0.25 -> x = 64
  const cx = 64, cy = 66;
  ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.beginPath(); ctx.ellipse(cx, cy + 22, 26, 20, 0, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#1b1414';
  for (const dx of [-14, 14]) { ctx.beginPath(); ctx.ellipse(cx + dx, cy - 4, 4.2, 5.4, 0, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + dx + 1.4, cy - 6, 1.4, 0, 6.3); ctx.fill(); ctx.fillStyle = '#1b1414'; }
  ctx.strokeStyle = '#2a1b14'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for (const dx of [-14, 14]) { ctx.beginPath(); ctx.moveTo(cx + dx - 8, cy - 15); ctx.quadraticCurveTo(cx + dx, cy - 19, cx + dx + 8, cy - 15); ctx.stroke(); }
  ctx.strokeStyle = '#a04a3a'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(cx, cy + 12, 8, 0.25, Math.PI - 0.25); ctx.stroke();
  ctx.fillStyle = 'rgba(230,120,110,.35)'; for (const dx of [-24, 24]) { ctx.beginPath(); ctx.arc(cx + dx, cy + 8, 6, 0, 6.3); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(cx, cy + 4, 3, 4, 0, 0, 6.3); ctx.fill();
  return canvasTex(canvas, { wrap: true });
}

function uniformTexture(kind) {
  const { canvas, ctx } = makeCanvas(256, 256);
  if (kind === 'cashier') {
    ctx.fillStyle = '#fbfbf7'; ctx.fillRect(0, 0, 256, 256);
    // stripes across the chest (front at u = 0.5 -> x = 128)
    ctx.fillStyle = BRAND.orange; ctx.fillRect(0, 74, 256, 12); ctx.fillStyle = BRAND.green; ctx.fillRect(0, 86, 256, 12); ctx.fillStyle = BRAND.red; ctx.fillRect(0, 98, 256, 12);
    ctx.fillStyle = BRAND.darkGreen; ctx.fillRect(84, 130, 88, 126);                          // apron
    ctx.fillStyle = '#fff'; ctx.fillRect(98, 148, 28, 16);                                    // name badge
    ctx.fillStyle = BRAND.green; ctx.font = '700 9px Sarabun'; ctx.fillText('ยินดีให้บริการ', 98, 160);
    drawLogo(ctx, 136, 136, 26, { radius: 24 });
  } else if (kind === 'student') {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = '#1c2d5a'; ctx.fillRect(0, 150, 256, 106);
    ctx.fillStyle = '#c8a24a'; ctx.beginPath(); ctx.arc(150, 70, 6, 0, 6.3); ctx.fill();
  } else if (kind === 'office') {
    ctx.fillStyle = '#b7d4ee'; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = '#e05a2a'; ctx.fillRect(120, 40, 12, 80); ctx.fillStyle = '#fff'; ctx.fillRect(140, 100, 26, 34);
  } else if (kind === 'auntie') {
    ctx.fillStyle = '#e8a0b8'; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 30; i++) { ctx.fillStyle = ['#fff', '#7a2a4a', '#5aa070'][i % 3]; ctx.beginPath(); ctx.arc((i * 53) % 256, (i * 89) % 256, 8, 0, 6.3); ctx.fill(); }
  } else if (kind === 'tourist') {
    ctx.fillStyle = '#d63a2a'; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = '#fff'; ctx.font = '900 30px Anton'; ctx.textAlign = 'center'; ctx.fillText('CHANG', 128, 110);
  } else if (kind === 'monk') {
    ctx.fillStyle = '#e0801a'; ctx.fillRect(0, 0, 256, 256); ctx.strokeStyle = '#b8600a'; ctx.lineWidth = 2; for (let y = 0; y < 256; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y + 6); ctx.stroke(); }
  } else { ctx.fillStyle = '#4a6a8a'; ctx.fillRect(0, 0, 256, 256); }
  return canvasTex(canvas, { wrap: true });
}

// ---- geometry helpers: every limb is a single vertex-coloured mesh so a person costs ~8 draw calls
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function part(geo, hex, x = 0, y = 0, z = 0, o = {}) {
  _e.set(o.rx || 0, o.ry || 0, o.rz || 0); _q.setFromEuler(_e);
  _m.compose(_v.set(x, y, z), _q, _s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1));
  geo.applyMatrix4(_m);
  _c.set(hex);
  const n = geo.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
const cyl = (rt, rb, h, seg = 8) => new THREE.CylinderGeometry(rt, rb, h, seg);
const sph = (r, w = 10, h = 8, ...rest) => new THREE.SphereGeometry(r, w, h, ...rest);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const merge = (arr) => THREE.mergeGeometries(arr, false);

let vcolMat = null;
const texCache = new Map(), faceCache = new Map(), plainCache = new Map();
const UNIFORM_BASE = { cashier: 0xfbfbf7, student: 0xffffff, office: 0xb7d4ee, auntie: 0xe8a0b8, tourist: 0xd63a2a, monk: 0xe0801a };

// A simple articulated person: legs/arms pivot at hip/shoulder.
export function makeHuman(o = {}) {
  if (!vcolMat) vcolMat = stdM({ color: 0xffffff, vertexColors: true, roughness: 0.85 });
  const g = new THREE.Group();
  const H = o.height ?? 1.62, sc = H / 1.62;
  const skin = o.skin ?? skinTones[0];
  const shirtHex = o.shirtTex ? UNIFORM_BASE[o.shirtTex] : (o.shirt ?? 0x4a80c0);
  const pants = o.pants ?? 0x2a3140, shoes = o.shoes ?? 0x1a1a1a;
  const body = new THREE.Group(); body.scale.setScalar(sc); g.add(body);

  const mkLeg = (x) => {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.86, 0);
    const parts = [part(cyl(0.065, 0.055, 0.82), o.skirt ? skin : pants, 0, -0.41, 0), part(box(0.1, 0.06, 0.24), shoes, 0, -0.83, 0.05)];
    if (o.skirt) parts.push(part(cyl(0.068, 0.068, 0.25), pants, 0, -0.14, 0));
    pivot.add(new THREE.Mesh(merge(parts), vcolMat));
    body.add(pivot); return pivot;
  };
  const legL = mkLeg(-0.085), legR = mkLeg(0.085);
  if (o.skirt) { const sk = new THREE.Mesh(merge([part(cyl(0.18, 0.26, 0.32, 14), pants, 0, 0.78, 0)]), vcolMat); body.add(sk); }

  const torsoPivot = new THREE.Group(); torsoPivot.position.y = 0.86; body.add(torsoPivot);
  // torso (texture centre faces +z)
  let torsoMat;
  if (o.shirtTex) {
    if (!texCache.has(o.shirtTex)) texCache.set(o.shirtTex, stdM({ color: 0xffffff, map: uniformTexture(o.shirtTex), roughness: 0.85 }));
    torsoMat = texCache.get(o.shirtTex);
  } else {
    if (!plainCache.has(shirtHex)) plainCache.set(shirtHex, stdM({ color: shirtHex, roughness: 0.85 }));
    torsoMat = plainCache.get(shirtHex);
  }
  const torso = new THREE.Mesh(cyl(0.19, 0.155, 0.56, 16), torsoMat);
  torso.scale.z = 0.66; torso.rotation.y = Math.PI; torso.position.y = 0.28; torsoPivot.add(torso);

  const mkArm = (x) => {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.55, 0);
    pivot.add(new THREE.Mesh(merge([
      part(cyl(0.05, 0.042, 0.56), o.longSleeve ? shirtHex : skin, 0, -0.27, 0),
      part(cyl(0.056, 0.055, 0.2), shirtHex, 0, -0.08, 0),
      part(sph(0.045, 8, 6), skin, 0, -0.56, 0),
    ]), vcolMat));
    torsoPivot.add(pivot); return pivot;
  };
  const armL = mkArm(-0.235), armR = mkArm(0.235);

  // neck, worn extras (one merged mesh riding on the torso)
  const acc = [part(cyl(0.045, 0.05, 0.08), skin, 0, 0.6, 0)];
  if (o.backpack) acc.push(part(box(o.backpack.w ?? 0.28, o.backpack.h ?? 0.36, 0.16), o.backpack.color ?? 0x2a2a2a, 0, 0.32, -0.16));
  if (o.lanyard) { acc.push(part(box(0.018, 0.34, 0.01), 0xe05a2a, 0, 0.42, 0.127)); acc.push(part(box(0.06, 0.08, 0.006), 0xffffff, 0, 0.24, 0.128)); }
  if (o.vest) acc.push(part(cyl(0.196, 0.16, 0.36, 16), o.vest, 0, 0.32, 0, { sz: 0.67 }));
  if (o.robe) acc.push(part(box(0.3, 0.06, 0.34), 0xe07a12, 0.1, 0.86, 0));
  torsoPivot.add(new THREE.Mesh(merge(acc), vcolMat));
  if (o.robe) body.add(new THREE.Mesh(merge([part(cyl(0.2, 0.28, 0.9, 16), 0xe07a12, 0, 0.42, 0)]), vcolMat));

  // head group (turns to look around): face-textured sphere + hair
  const head = new THREE.Group(); head.position.y = 0.72; torsoPivot.add(head);
  const fk = skin + (o.female ? 'f' : 'm');
  if (!faceCache.has(fk)) faceCache.set(fk, stdM({ color: 0xffffff, map: faceTexture(skin, o.female), roughness: 0.7 }));
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 14), faceCache.get(fk)); skull.scale.set(0.92, 1.08, 0.98); head.add(skull);
  if (o.hairStyle !== 'bald') {
    const hc = o.hair ?? 0x14100e;
    const hp = [part(sph(0.118, 16, 12, 0, Math.PI * 2, 0, Math.PI * (o.hairStyle === 'long' ? 0.62 : 0.5)), hc, 0, 0.015, -0.008, { sx: 0.95, sy: 1.05 })];
    if (o.hairStyle === 'long') hp.push(part(cyl(0.1, 0.075, 0.3, 10), hc, 0, -0.17, -0.075));
    if (o.hairStyle === 'bun') hp.push(part(sph(0.05, 8, 6), hc, 0, 0.12, -0.06));
    if (o.hairStyle === 'ponytails') for (const dx of [-0.08, 0.08]) hp.push(part(cyl(0.03, 0.018, 0.26, 6), hc, dx, -0.1, -0.09));
    head.add(new THREE.Mesh(merge(hp), vcolMat));
  }
  return { group: g, body, torsoPivot, legL, legR, armL, armR, head, skin, height: H };
}

class Person {
  constructor(parts, o) {
    Object.assign(this, parts);
    this.speed = o.speed ?? 1.0;
    this.route = o.route || [];
    this.idx = 0;
    this.waitT = 0;
    this.phase = Math.random() * 6;
    this.yaw = o.yaw ?? 0;
    this.moving = false;
    this.pose = 0;         // 0 idle, 1 wai
    this.poseT = 0;
    this.group.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
    this.blocked = 0;
    this.loop = o.loop ?? true;
    this.circle = { x: this.group.position.x, z: this.group.position.z, r: o.r ?? 0.3 };
    DYN.push(this.circle);
    this.talking = false;     // true while the player is chatting: stop walking and face them
    this.talkId = null;
    this.tbox = new THREE.Box3();
    this.path = null; this.pathFor = -1; this.pi = 0;   // A* path to the current waypoint (see nav.js)
  }
  wai() { this.poseT = 2.2; }
  update(dt, player, time) {
    const g = this.group;
    let move = false;
    if (this.route.length && this.poseT <= 0 && !this.talking) {
      const wp = this.route[this.idx];
      if (this.waitT > 0) { this.waitT -= dt; if (wp.face !== undefined) this.yaw = this.turn(this.yaw, wp.face, dt * 4); if (this.waitT <= 0) this.idx = (this.idx + 1) % this.route.length; }
      else {
        // walk the A* path to this waypoint instead of a straight line through the fixtures
        if (this.pathFor !== this.idx) { this.path = findPath(g.position.x, g.position.z, wp.x, wp.z) || [[wp.x, wp.z]]; this.pathFor = this.idx; this.pi = 0; }
        const end = this.path[this.path.length - 1];
        const fd = Math.hypot(end[0] - g.position.x, end[1] - g.position.z);
        while (this.pi < this.path.length - 1 && Math.hypot(this.path[this.pi][0] - g.position.x, this.path[this.pi][1] - g.position.z) < 0.15) this.pi++;
        const tgt = this.path[this.pi];
        const dx = tgt[0] - g.position.x, dz = tgt[1] - g.position.z, d = Math.max(1e-6, Math.hypot(dx, dz));
        if (fd < 0.12) { this.waitT = wp.wait ?? 0.2; this.pathFor = -1; if (!this.waitT) this.idx = (this.idx + 1) % this.route.length; }
        else {
          const want = Math.atan2(dx, dz);
          this.yaw = this.turn(this.yaw, want, dt * 6);
          // stop if the player is right in front
          const px = player.x - g.position.x, pz = player.z - g.position.z, pd = Math.hypot(px, pz);
          const fwd = px * Math.sin(this.yaw) + pz * Math.cos(this.yaw);
          if (pd < 1.0 && fwd > 0) { this.blocked = 0.4; }
          if (this.blocked > 0) this.blocked -= dt;
          else {
            const v = this.speed * dt; g.position.x += (dx / d) * Math.min(v, d); g.position.z += (dz / d) * Math.min(v, d); move = true;
            const [rx, rz] = resolveStatic(g.position.x, g.position.z, 0.2); g.position.x = rx; g.position.z = rz;   // never inside a fixture
          }
        }
      }
    }
    if (this.poseT > 0) this.poseT -= dt;
    if (this.talking) this.yaw = this.turn(this.yaw, Math.atan2(player.x - g.position.x, player.z - g.position.z), dt * 5);
    g.rotation.y = this.yaw;
    { const p = g.position; this.tbox.min.set(p.x - 0.4, 0, p.z - 0.4); this.tbox.max.set(p.x + 0.4, 1.9, p.z + 0.4); }
    this.circle.x = g.position.x; this.circle.z = g.position.z;
    // animation
    this.moving = move;
    this.phase += dt * (move ? 6.2 * this.speed : 0);
    const sw = move ? 0.55 : 0;
    const k = move ? 1 : 0;
    this.legL.rotation.x = Math.sin(this.phase) * sw; this.legR.rotation.x = -Math.sin(this.phase) * sw;
    const waiAmt = this.poseT > 0 ? Math.min(1, this.poseT * 3, (2.2 - this.poseT) * 4) : 0;
    const swing = Math.sin(this.phase) * 0.5 * k;
    this.armL.rotation.x = lerp(-swing, -1.15, waiAmt); this.armR.rotation.x = lerp(swing, -1.15, waiAmt);
    this.armL.rotation.z = lerp(0.05, -0.32, waiAmt); this.armR.rotation.z = lerp(-0.05, 0.32, waiAmt);
    this.torsoPivot.rotation.x = waiAmt * 0.32 + Math.sin(time * 1.6 + this.phase) * 0.006;
    this.body.position.y = move ? Math.abs(Math.sin(this.phase)) * 0.02 : 0;
    this.head.rotation.y = damp(this.head.rotation.y, Math.sin(time * 0.4 + this.speed * 7) * 0.4 * (this.waitT > 0 ? 1 : 0.2), 3, dt);
  }
  turn(cur, target, k) {
    let d = target - cur; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    return cur + d * Math.min(1, k);
  }
}

class Dog {
  constructor() {
    const g = new THREE.Group();
    const fur = stdM({ color: 0xc89a64, roughness: 0.95 }), dark = stdM({ color: 0x3a2a1e, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), fur); body.scale.set(1.5, 0.75, 0.85); body.position.set(0, 0.2, 0); g.add(body);
    const head = new THREE.Group(); head.position.set(0.42, 0.16, 0.06); g.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), fur); skull.scale.set(1.15, 0.95, 0.95); head.add(skull);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.1), fur); snout.position.set(0.13, -0.03, 0); head.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), dark); nose.position.set(0.2, -0.01, 0); head.add(nose);
    for (const dz of [-0.09, 0.09]) { const ear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.03), dark); ear.position.set(-0.02, 0.1, dz); ear.rotation.x = dz * 4; head.add(ear); }
    this.eyes = [];
    for (const dz of [-0.06, 0.06]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.02), dark); e.position.set(0.1, 0.03, dz); head.add(e); this.eyes.push(e); }
    for (const [x, z] of [[0.25, -0.15], [0.25, 0.17], [-0.28, -0.14], [-0.28, 0.16]]) { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 8), fur); leg.rotation.z = Math.PI / 2; leg.position.set(x + 0.08, 0.05, z); g.add(leg); }
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.28, 4, 6), fur); tail.rotation.z = Math.PI / 2 + 0.3; tail.position.set(-0.55, 0.12, 0.15); g.add(tail);
    this.group = g; this.head = head; this.body = body; this.tail = tail;
    this.awake = 0;
    g.position.set(-3.6, 0, 3.3); g.rotation.y = 0.5;
  }
  wake() { this.awake = 3.5; }
  update(dt, time) {
    if (this.awake > 0) this.awake -= dt;
    const a = this.awake > 0 ? 1 : 0;
    this.body.scale.y = 0.75 + Math.sin(time * 1.7) * 0.02;
    this.head.rotation.z = damp(this.head.rotation.z, a * 0.55, 4, dt);
    this.head.position.y = damp(this.head.position.y, 0.16 + a * 0.16, 4, dt);
    this.eyes.forEach((e) => (e.scale.y = a ? 3 : 1));
    this.tail.rotation.y = a ? Math.sin(time * 14) * 0.4 : 0;
  }
}

export class Npcs {
  constructor(scene, quality) {
    this.scene = scene; this.people = [];
    this.group = new THREE.Group(); scene.add(this.group);
    this.cashier = null; this.dog = null;
    this.targets = [];       // talk targets for Interaction: { kind: 'npc', id, npc, box, maxDist }
    this.quality = quality;
  }
  add(p, talkId) {
    this.people.push(p); this.group.add(p.group);
    if (talkId) { p.talkId = talkId; this.targets.push({ kind: 'npc', id: talkId, npc: p, box: p.tbox, maxDist: 2.5 }); }
    return p;
  }

  build() {
    // ------------------------------------------------ the cashier
    {
      const h = makeHuman({ shirtTex: 'cashier', pants: 0x2b2f3a, female: true, hairStyle: 'bun', hair: 0x14100e, skin: skinTones[1], height: 1.58 });
      const c = new Person(h, { x: 4.95, z: -2.75, yaw: -Math.PI / 2, route: [] });
      this.cashier = this.add(c, 'cashier');
      c.wai = function () { this.poseT = 2.2; };
    }
    // second cashier at the hot-food end
    {
      const h = makeHuman({ shirtTex: 'cashier', pants: 0x2b2f3a, female: false, hairStyle: 'short', hair: 0x14100e, skin: skinTones[2], height: 1.7 });
      this.add(new Person(h, { x: 4.9, z: -6.1, yaw: -Math.PI / 2, route: [{ x: 4.9, z: -6.1, wait: 6, face: -Math.PI / 2 }, { x: 4.9, z: -6.9, wait: 5, face: -Math.PI / 2 }, { x: 4.9, z: -5.4, wait: 5, face: -Math.PI / 2 }] , speed: 0.5}), 'cashier2');
    }
    // ------------------------------------------------ shoppers (skip some on low quality)
    const n = this.quality.npcs;
    const R = (pts) => pts.map(([x, z, wait, face]) => ({ x, z, wait: wait ?? 1.5, face }));
    const TALK = ['student', 'office', 'tourist', 'auntie', 'shopper', 'ning'];
    const list = [
      { opt: { shirtTex: 'student', skirt: true, pants: 0x1c2d5a, female: true, hairStyle: 'ponytails', hair: 0x0e0a08, backpack: { color: 0x1f6fd0, w: 0.3, h: 0.34 }, skin: skinTones[0], height: 1.55, shoes: 0xf2f2f2 },
        route: R([[0.7, -1.6, 0.2], [-2.2, -4.8, 0.3], [-2.2, -10.5, 5, -Math.PI / 2], [-2.2, -13.5, 0.4], [0.3, -14.2, 4, 0], [0.3, -8, 0.3], [2.6, -4.2, 2, Math.PI], [0.7, -1.5, 0.5]]), speed: 1.05, start: [0.7, -1.6] },
      { opt: { shirtTex: 'office', pants: 0x1d2330, hairStyle: 'short', lanyard: true, skin: skinTones[1], height: 1.72 },
        route: R([[-1.0, -1.6, 0.2], [0.2, -6.0, 0.3], [0.2, -12.5, 4, Math.PI / 2], [-4.6, -14.6, 0.3], [-4.6, -9, 5, Math.PI / 2], [-4.6, -5, 0.5], [2.6, -3.0, 3, Math.PI], [-1.0, -1.6, 0.5]]), speed: 1.15, start: [-1.0, -1.7] },
      { opt: { shirtTex: 'tourist', pants: 0x8a7a5a, hairStyle: 'short', hair: 0xd9b25a, backpack: { color: 0x3a5a3a, w: 0.34, h: 0.5 }, skin: 0xf3cfb0, height: 1.82, shoes: 0x6a4a2a },
        route: R([[-1.5, -14.7, 0.2], [2.0, -14.7, 8, 0], [1.5, -10, 0.3], [-1.8, -8.5, 4, -Math.PI / 2], [-4.5, -5.5, 0.4], [-1.5, -14.7, 0.5]]), speed: 1.1, start: [-1.5, -14.7] },
      { opt: { shirt: 0xe8a0b8, shirtTex: 'auntie', pants: 0x3a3a5a, female: true, hairStyle: 'bun', hair: 0x7a7a7a, skin: skinTones[1], height: 1.52 },
        route: R([[-4.6, -3.0, 4, 0], [-4.6, -7.5, 0.4], [-4.7, -9, 5, -Math.PI / 2], [-3.5, -14.6, 0.4], [1.2, -14.4, 0.4], [1.2, -6.5, 4, Math.PI / 2], [-4.6, -3.0, 0.4]]), speed: 0.85, start: [-4.6, -3.2] },
      { opt: { shirt: 0x2a6fd0, pants: 0x30343c, hairStyle: 'short', skin: skinTones[2], height: 1.68, backpack: { color: 0xe05a2a, w: 0.3, h: 0.32 } },
        route: R([[3.0, -12, 0.3], [3.0, -8.2, 6, Math.PI / 2], [2.9, -3.2, 0.3], [-0.5, -2.2, 3, 0], [2.9, -9, 0.4]]), speed: 1.0, start: [3.0, -11.5] },
      { opt: { shirt: 0xf5f5f0, pants: 0x30343c, hairStyle: 'long', hair: 0x1a1210, female: true, skin: skinTones[0], height: 1.6 },
        route: R([[0.3, -14, 0.3], [-3.2, -14.4, 5, 0], [-3.2, -6, 0.3], [-5.0, -4.6, 3.5, Math.PI / 2], [-0.5, -5.2, 0.5], [0.3, -14, 0.4]]), speed: 1.0, start: [-1.0, -14.2] },
    ];
    list.slice(0, n).forEach((s, li) => {
      const h = makeHuman(s.opt);
      const p = new Person(h, { x: s.start[0], z: s.start[1], route: s.route, speed: s.speed });
      p.idx = Math.floor(Math.random() * s.route.length);
      this.add(p, TALK[li]);
    });
    // ------------------------------------------------ outside
    {
      const h = makeHuman({ robe: true, hairStyle: 'bald', skin: skinTones[2], shirt: 0xe07a12, pants: 0xe07a12, height: 1.66, shoes: 0x333333 });
      const route = [{ x: -12, z: 4.0, wait: 0 }, { x: -1.5, z: 4.1, wait: 6, face: -Math.PI / 2 }, { x: 12, z: 3.9, wait: 0 }, { x: 12, z: 4.6, wait: 0 }, { x: -12, z: 4.7, wait: 0 }];
      this.monk = this.add(new Person(h, { x: -12, z: 4.0, route, speed: 0.75 }), 'monk');
    }
    if (n >= 3) {
      const h = makeHuman({ shirt: 0xe8681a, pants: 0x1e2430, hairStyle: 'short', skin: skinTones[2], height: 1.66, vest: 0xf58220 });
      this.add(new Person(h, { x: 8.2, z: 3.9, yaw: 2.4, route: [{ x: 8.2, z: 3.9, wait: 30, face: 2.4 }] }), 'rider');
    }
    this.dog = new Dog();
    this.group.add(this.dog.group);
  }

  update(dt, time, player) {
    const pp = { x: player.pos.x, z: player.pos.z };
    for (const p of this.people) p.update(dt, pp, time);
    this.dog.update(dt, time);
  }
}

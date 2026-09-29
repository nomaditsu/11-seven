// Bangkok street: sidewalk, soi road, the 7-Eleven fascia and neighbouring shophouses.
import { bakeStatic } from './bake.js';
import * as THREE from 'three';
import { M, std, basic } from './materials.js';
import { Kit } from './kit.js';
import { L } from './layout.js';
import { addCollider } from './colliders.js';
import { BRAND, drawLogo, drawStripes, LOGO_W, LOGO_H } from '../gfx/logo11seven.js';
import { LTex } from '../gfx/localized.js';
import { fitText, langText, fillRR, circle, makeCanvas } from '../gfx/draw.js';
import { shophouseUpper, shopSign, neonSign, rowTexture, SHOP_NAMES } from '../gfx/facades.js';
import { canvasTex, weatheredWall, shutter } from '../gfx/surfaces.js';
import { rng, clamp } from '../core/util.js';

export class Exterior {
  constructor(scene, quality) {
    this.scene = scene; this.quality = quality;
    this.group = new THREE.Group(); this.group.name = 'exterior';
    scene.add(this.group);
    this.nightMats = [];   // { mat, prop, day, night }
    this.windowMats = [];
    this.lamps = [];       // { light, glow }
    this.signLights = [];
  }

  // register a material whose brightness follows the night factor (0 day .. 1 night)
  nightReactive(mat, prop, day, night) { this.nightMats.push({ mat, prop, day, night }); }

  build() {
    this.buildGround();
    this.buildStoreFacade();
    this.buildNeighbours();
    this.buildFarSide();
    bakeStatic(this.group);
  }

  // ----------------------------------------------------------------------------------------------
  buildGround() {
    const k = new Kit('ground');
    const X = 320;
    // near sidewalk (front apron of the store)
    k.box(M.paver, -X, -0.16, 0, X, 0, L.sidewalk.z1, { tile: 1.2, skip: ['-y', '+x', '-x', '-z', '+z'] });
    // curb
    k.box(M.concreteGrey, -X, -0.16, L.curb.z0, X, 0.02, L.curb.z1, { tile: 1.5, skip: ['-y', '+x', '-x'] });
    // painted curb segments (yellow/black = no parking)
    const yel = std({ color: 0xf1c40f, roughness: 0.6 }, { out: true }), blk = std({ color: 0x1a1a1a, roughness: 0.7 }, { out: true });
    for (let i = -14; i < 14; i++) k.box(i % 2 ? yel : blk, i * 1.4, 0.021, L.curb.z0, i * 1.4 + 1.4, 0.023, L.curb.z1 + 0.01);
    // road
    k.plane(M.asphalt, X * 2, L.road.z1 - L.road.z0 + 0.02, 0, L.road.y, (L.road.z0 + L.road.z1) / 2, { rx: -Math.PI / 2, tile: 4 });
    // lane paint
    const white = basic(0xe9e9e4), yellowP = basic(0xe9c02a);
    for (let x = -60; x < 60; x += 6) k.plane(white, 3, 0.14, x + 1.5, L.road.y + 0.004, 9.75, { rx: -Math.PI / 2 });
    k.plane(white, X * 2, 0.12, 0, L.road.y + 0.004, 6.15, { rx: -Math.PI / 2 });
    k.plane(white, X * 2, 0.12, 0, L.road.y + 0.004, 13.35, { rx: -Math.PI / 2 });
    // zebra crossing to the left of the store
    for (let i = 0; i < 9; i++) k.plane(white, 0.5, 8, -20.2 + i * 0.95, L.road.y + 0.005, 9.75, { rx: -Math.PI / 2 });
    // road edge to far curb
    k.box(M.concreteGrey, -X, -0.16, L.road.z1 - 0.02, X, 0.02, L.road.z1 + 0.25, { tile: 1.5, skip: ['-y', '+x', '-x'] });
    k.box(M.paver, -X, -0.16, L.road.z1 + 0.25, X, 0, L.farWalk.z1, { tile: 1.2, skip: ['-y', '+x', '-x'] });
    // far ground / horizon
    k.plane(M.asphalt, 2000, 900, 0, L.road.y - 0.02, 500, { rx: -Math.PI / 2, tile: 8 });
    k.plane(M.asphalt, 2000, 400, 0, L.road.y - 0.02, -200, { rx: -Math.PI / 2, tile: 8 });
    // drain grates on the near road edge
    const grate = std({ color: 0x1c1d1f, roughness: 0.5, metalness: 0.6 }, { out: true });
    for (const x of [-9, 3, 15]) k.box(grate, x, L.road.y + 0.001, 6.0, x + 0.9, L.road.y + 0.012, 6.5);
    k.build(this.group, { cast: false });
    // invisible boundary: curb edge and lateral limits are handled by the player bounds
    addCollider(-40, 5.3, 40, 6.0, 'curb');
  }

  // ----------------------------------------------------------------------------------------------
  buildStoreFacade() {
    const x0 = L.x0 - L.wall, x1 = L.x1 + L.wall, W = x1 - x0;
    const k = new Kit('facade');
    // fascia ledge over the entrance (projects 0.55 m)
    k.box(M.outWhite, x0, L.glassTop, 0, x1, 4.5, 0.56, { tile: 1, skip: ['+z', '-z'] });   // starts at the glass line: the interior soffit owns z < 0
    // downlights in the ledge soffit
    const dl = basic(new THREE.Color(1.8, 1.7, 1.4));
    for (let x = -6; x <= 6; x += 1.5) k.box(dl, x - 0.09, L.glassTop - 0.005, 0.3, x + 0.09, L.glassTop, 0.48);
    k.build(this.group, { cast: true });

    // Fascia sign (localised)
    const ppm = 150;
    const sign = new LTex(Math.round(W * ppm), Math.round(1.78 * ppm), (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#eeeeea');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const sh = h * 0.16;
      drawStripes(ctx, 0, h - sh, w, sh);
      // logo
      const lh = Math.min((h - sh) * 0.86, (w * 0.42) / (LOGO_W / LOGO_H)), ly = (h - sh - lh) / 2;
      const lw = lh * LOGO_W / LOGO_H;
      drawLogo(ctx, w / 2 - lw / 2, ly, lh);
      // left: OPEN 24 HOURS badge
      const bx = w * 0.06, bw = w * 0.22, by = h * 0.14, bh = h * 0.58;
      fillRR(ctx, bx, by, bw, bh, bh * 0.2, BRAND.green);
      fitText(ctx, '24', bx + bw * 0.04, by + bh * 0.02, bw * 0.4, bh * 0.96, { family: 'anton', weight: 400, size: bh, color: '#fff' });
      langText(ctx, { th: 'เปิด 24 ชั่วโมง', en: 'OPEN 24 HOURS' }, bx + bw * 0.44, by + bh * 0.1, bw * 0.54, bh * 0.8, { family: 'kanit', weight: 700, size: bh * 0.4, color: '#fff', lines: 2, lines2: 1, split: 0.62 });
      // right: services
      const rx = w * 0.72;
      langText(ctx, { th: 'ยินดีต้อนรับ', en: 'WELCOME' }, rx, by, w * 0.22, bh * 0.5, { family: 'mitr', weight: 700, size: bh * 0.42, color: BRAND.green, lines: 1 });
      langText(ctx, { th: 'ATM • อีเลฟเว่น คาเฟ่ • จ่ายบิล', en: 'ATM • 11 Café • Bill Pay' }, rx, by + bh * 0.52, w * 0.22, bh * 0.44, { family: 'kanit', weight: 500, size: bh * 0.24, color: '#444', lines: 2 });
    }, { localized: true });
    const signMat = new THREE.MeshBasicMaterial({ map: sign.texture });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, 1.78), signMat);
    signMesh.position.set(0, (L.glassTop + 4.5) / 2 + 0.01, 0.565);
    this.group.add(signMesh);
    this.nightReactive(signMat, 'color', 0.9, 1.15);

    // side blade sign at the corner
    const blade = new LTex(300, 380, (ctx, w, h) => {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      drawStripes(ctx, 0, h * 0.86, w, h * 0.14);
      { const lh = h * 0.46; drawLogo(ctx, (w - lh * LOGO_W / LOGO_H) / 2, h * 0.05, lh); }
      langText(ctx, { th: '24 ชม.', en: '24 HRS' }, 10, h * 0.55, w - 20, h * 0.28, { family: 'kanit', weight: 900, size: h * 0.26, color: BRAND.red, lines: 1 });
    });
    const bm = new THREE.MeshBasicMaterial({ map: blade.texture });
    const bg = new THREE.PlaneGeometry(1.0, 1.26);
    const bladeGrp = new THREE.Group();
    const b1 = new THREE.Mesh(bg, bm), b2 = new THREE.Mesh(bg, bm);
    b1.position.z = 0.16; b2.position.z = -0.16; b2.rotation.y = Math.PI;
    const bbox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.26, 0.3), M.outWhite);
    bladeGrp.add(bbox, b1, b2);
    bladeGrp.rotation.y = Math.PI / 2;
    bladeGrp.position.set(x1 + 0.1, 3.4, 0.9);
    // (mounted on the ledge end, projecting perpendicular to the wall)
    this.group.add(bladeGrp);
    this.nightReactive(bm, 'color', 0.9, 1.15);

    // branch plate on the glass beside the door (real stores show their branch name here, always bilingual)
    const plate = new LTex(300, 216, (ctx, w, h) => {
      fillRR(ctx, 0, 0, w, h, 16, '#ffffff');
      fillRR(ctx, 0, 0, w, 50, 16, BRAND.green); ctx.fillStyle = BRAND.green; ctx.fillRect(0, 30, w, 20);
      fitText(ctx, 'สาขา · Branch', 14, 6, w - 28, 40, { family: 'kanit', weight: 600, color: '#fff' });
      fitText(ctx, 'สุขุมวิท 11', 14, 58, w - 28, 58, { family: 'kanit', weight: 700, color: '#1b2226' });
      fitText(ctx, 'Sukhumvit 11', 14, 114, w - 28, 40, { family: 'kanit', weight: 600, color: '#1b2226' });
      fitText(ctx, '07711 · กรุงเทพฯ Bangkok', 14, 158, w - 28, 34, { family: 'kanit', weight: 500, color: '#5a6368' });
      drawStripes(ctx, 0, h - 12, w, 12);
    }, { localized: false });
    const plateMat = new THREE.MeshBasicMaterial({ map: plate.texture });
    const plateMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.245), plateMat);
    plateMesh.position.set(L.door.x1 + 0.3, 1.5, 0.03);
    this.group.add(plateMesh);
    this.nightReactive(plateMat, 'color', 0.95, 1.1);

    // upper floors of the shophouse: one wide facade
    const up = shophouseUpper(2, W, 3, 84);
    const upMat = std({ map: up.map, emissiveMap: up.emissive, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.9 }, { out: true, env: 0.9 });
    const H = 3 * 3.1 + 0.42;
    const upper = new THREE.Mesh(new THREE.PlaneGeometry(W, H), upMat);
    upper.position.set(0, 4.5 + H / 2, 0.01);
    upper.castShadow = false;
    this.group.add(upper);
    this.windowMats.push(upMat);
    const body = new Kit('bodyU');
    body.box(M.concrete, x0, 4.5, -18, x1, 4.5 + H, -0.02, { tile: 2, skip: ['+z'] });
    body.build(this.group);
    // AC condensers hanging off the front
    const k2 = new Kit('acs');
    const acMat = std({ color: 0xcfd2d4, roughness: 0.5 }, { out: true });
    for (let f = 0; f < 3; f++) for (const x of [-5.2, -1.8, 2.6, 5.4]) {
      if ((f + Math.round(x)) % 3 === 0) continue;
      const y = 4.5 + f * 3.1 + 0.55;
      k2.box(acMat, x - 0.42, y, 0.02, x + 0.42, y + 0.55, 0.42);
      k2.cyl(M.outDark, x - 0.16, y + 0.27, 0.43, 0.2, 0.2, 0.02, { seg: 14, rx: Math.PI / 2 });
      k2.box(M.outMetal, x - 0.5, y - 0.04, 0.0, x - 0.44, y + 0.5, 0.36);
    }
    k2.build(this.group);
  }

  // ----------------------------------------------------------------------------------------------
  // A generic shophouse: ground floor + upper facade. side: +1 faces +z (near side of street), -1 faces -z (far side).
  shophouse({ x, z, w, floors = 3, seed = 1, side = 1, shop = true, depth = 12, kit, shopIdx = 0, open = false, near = true }) {
    const gh = 3.6, uh = floors * 3.1 + 0.42, base = kit;
    const y0 = 0;
    const zf = z; // front face plane
    const ux = x;
    // body
    const dz = side > 0 ? -depth : depth;
    const bx0 = x - w / 2, bx1 = x + w / 2;
    const zA = side > 0 ? zf - depth : zf, zB = side > 0 ? zf : zf + depth;
    kit.box(M.concrete, bx0, 0, zA, bx1, gh + uh, zB, { tile: 2, skip: side > 0 ? ['+z'] : ['-z'] });
    // upper facade texture plane
    const up = shophouseUpper(seed, w, floors, near ? 72 : 48);
    const upMat = std({ map: up.map, emissiveMap: up.emissive, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.92 }, { out: true, env: 0.9 });
    const upper = new THREE.Mesh(new THREE.PlaneGeometry(w, uh), upMat);
    upper.position.set(x, gh + uh / 2, zf + (side > 0 ? 0.01 : -0.01));
    if (side < 0) upper.rotation.y = Math.PI;
    this.group.add(upper); this.windowMats.push(upMat);
    // ground floor
    const rr = rng(seed * 31 + 7);
    const shutterMat = std({ map: shutter(['#9fa6ab', '#c2b8a3', '#8c9aa5', '#a8b39c'][seed % 4]), roughness: 0.55, metalness: 0.5 }, { out: true });
    const s = SHOP_NAMES[shopIdx % SHOP_NAMES.length];
    const sign = shopSign(shopIdx, Math.min(w - 0.4, 4.6), 0.95);
    const signMat = new THREE.MeshBasicMaterial({ map: sign.texture });
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w - 0.4, 4.6), 0.95), signMat);
    sm.position.set(x, 3.05, zf + (side > 0 ? 0.14 : -0.14));
    if (side < 0) sm.rotation.y = Math.PI;
    this.group.add(sm);
    this.nightReactive(signMat, 'color', 0.85, 1.2);
    const nf = side > 0 ? 1 : -1;
    // sign box
    kit.box(M.outDark, x - Math.min(w - 0.4, 4.6) / 2 - 0.05, 2.55, zf + (side > 0 ? 0 : -0.13), x + Math.min(w - 0.4, 4.6) / 2 + 0.05, 3.58, zf + (side > 0 ? 0.13 : 0));
    if (open) {
      // open-front shop: dark interior recess + counter
      const inset = side > 0 ? zf - 0.2 : zf + 0.2;
      kit.box(M.wallDark, x - w / 2 + 0.2, 0, side > 0 ? zf - 4 : zf, x + w / 2 - 0.2, 2.55, side > 0 ? zf : zf + 4, { skip: side > 0 ? ['+z'] : ['-z'] });
    } else {
      // closed rolling shutter (half open, revealing glass)
      const sz = zf + (side > 0 ? 0.08 : -0.08);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.6, 2.5), shutterMat);
      plane.position.set(x, 1.25, sz); if (side < 0) plane.rotation.y = Math.PI;
      this.group.add(plane);
    }
    // pillars either side
    kit.box(M.concrete, bx0, 0, side > 0 ? zf - 0.02 : zf - 0.28, bx0 + 0.3, gh, side > 0 ? zf + 0.28 : zf + 0.02, { tile: 1 });
    kit.box(M.concrete, bx1 - 0.3, 0, side > 0 ? zf - 0.02 : zf - 0.28, bx1, gh, side > 0 ? zf + 0.28 : zf + 0.02, { tile: 1 });
  }

  buildNeighbours() {
    const k = new Kit('neighbours');
    const rr = rng(77);
    const idxs = [0, 1, 5, 3, 6, 7, 4, 8, 9, 2, 1, 0];
    // individually detailed shophouses next to the 7-Eleven (pharmacy, made-to-order eatery, massage…)
    let xl = L.x0 - L.wall - 0.05, xr = L.x1 + L.wall + 0.05;
    const NEAR = 5;
    for (let i = 0; i < NEAR; i++) {
      const w = 4.6 + rr() * 2.2, cx = xl - w / 2;
      this.shophouse({ x: cx, z: 0, w, floors: 3 + (i % 3), seed: 10 + (i % 8), side: 1, kit: k, shopIdx: idxs[i], open: i === 1 });
      xl -= w + 0.05;
    }
    for (let i = 0; i < NEAR; i++) {
      const w = 4.6 + rr() * 2.2, cx = xr + w / 2;
      this.shophouse({ x: cx, z: 0, w, floors: 3 + ((i + 1) % 3), seed: 20 + (i % 8), side: 1, kit: k, shopIdx: idxs[(i + 4) % 12], open: i === 0 });
      xr += w + 0.05;
    }
    k.build(this.group);
    // beyond that: repeating strips of shophouses fading into the haze
    this.distantRow(xl, -340, 1, 0.0, 41);
    this.distantRow(xr, 340, 1, 0.0, 43);
  }

  // a long flat strip using the repeating multi-shophouse texture
  distantRow(xFrom, xTo, side, zPlane, seed) {
    const tex = rowTexture(seed, 44);
    const len = Math.abs(xTo - xFrom), h = tex.height;
    const g = new THREE.PlaneGeometry(len, h);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len / tex.width));
    const mat = std({ map: tex.map, emissiveMap: tex.emissive, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.95 }, { out: true, env: 0.9 });
    const m = new THREE.Mesh(g, mat);
    m.position.set((xFrom + xTo) / 2, h / 2, zPlane + (side > 0 ? 0.02 : -0.02));
    if (side < 0) m.rotation.y = Math.PI;
    this.group.add(m); this.windowMats.push(mat);
    // solid backing so the rows read as blocks from the side
    const back = new THREE.Mesh(new THREE.BoxGeometry(len, h, 14), M.concrete);
    back.position.set((xFrom + xTo) / 2, h / 2, zPlane + (side > 0 ? -7.05 : 7.05));
    this.group.add(back);
  }

  buildFarSide() {
    const k = new Kit('farside');
    const rr = rng(1234);
    let x = -30, i = 0;
    while (x < 30) {
      const w = 4.6 + rr() * 2.8;
      this.shophouse({ x: x + w / 2, z: 18.4, w, floors: 4, seed: 40 + (i % 8), side: -1, kit: k, shopIdx: i * 3 + 1, depth: 14, open: i % 4 === 1, near: false });
      x += w + 0.06; i++;
    }
    k.build(this.group);
    this.distantRow(-30, -340, -1, 18.4, 45);
    this.distantRow(30, 340, -1, 18.4, 47);
    // neon signs on the far side
    const n1 = neonSign('massage'), n2 = neonSign('open'), n3 = neonSign('rice');
    [[n1, 7.5, 5.3], [n2, -11.5, 5.0], [n3, 22, 5.2]].forEach(([n, x, y]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: n.texture }));
      m.position.set(x, y, 18.1); m.rotation.y = Math.PI; this.group.add(m);
      this.nightReactive(m.material, 'color', 0.5, 1.4);
    });
  }

  // ----------------------------------------------------------------------------------------------
  // called when the time of day changes
  applyTime(env) {
    const n = env.nightness;
    for (const { mat, prop, day, night } of this.nightMats) {
      const v = day + (night - day) * n;
      if (prop === 'color') mat.color.setScalar(v); else mat[prop] = v;
    }
    for (const m of this.windowMats) m.emissiveIntensity = clamp(n * 1.3, 0, 1.3);
    for (const l of this.lamps) { l.light.intensity = l.max * n; if (l.glow) l.glow.material.opacity = 0.9 * n; }
  }
}

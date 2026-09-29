// Drinks cooler wall (glass doors), freezer bays and the open multi-deck chiller for ready meals.
import * as THREE from 'three';
import { M, std, basic } from './materials.js';
import { Kit } from './kit.js';
import { L } from './layout.js';
import { makeSign } from '../gfx/localized.js';
import { langText, fitText, fillRR, circle, rrPath } from '../gfx/draw.js';
import { BRAND, drawStripes } from '../gfx/logo11seven.js';
import { addCollider } from './colliders.js';

const COOL_Y = [0.60, 0.96, 1.29, 1.62, 1.95];

export function buildCoolerWall(ctx, bays) {
  const c = L.coolers;
  const k = new Kit('coolers');
  const bw = c.doorW, zf = c.z1;          // front plane of the doors (z = -16.05)
  const zb = c.z0 + 0.02;
  const x0 = c.x0, x1 = x0 + bays.length * bw;
  // cabinet shell
  k.box(M.darkGrey, x0, 0, zb, x1, 0.44, zf + 0.03, { solid: 'cooler' });             // base / kick plate
  k.box(M.coolFrame, x0, 0.44, zb, x1, 2.62, zb + 0.03);                                // back skin
  k.box(M.coolFrame, x0 - 0.03, 0.44, zb, x0, 2.62, zf);                                 // end panels
  k.box(M.coolFrame, x1, 0.44, zb, x1 + 0.03, 2.62, zf);
  k.box(M.white, x0 + 0.002, 2.15, zb, x1 - 0.002, 2.62, zf + 0.02);                     // header block (2 mm inside the end panels)
  k.box(M.coolFrame, x0 + 0.002, 2.13, zf - 0.02, x1 - 0.002, 2.19, zf + 0.04);          // top rail
  k.box(M.coolFrame, x0 + 0.002, 0.44, zf - 0.02, x1 - 0.002, 0.5, zf + 0.04);           // bottom rail
  addCollider(x0 - 0.03, zb, x1 + 0.03, zf + 0.03, 'cooler');
  // dividers, LED light bars, back panels, shelves
  bays.forEach((bay, i) => {
    const xa = x0 + i * bw, xb = xa + bw;
    const inner = bay.freezer ? M.coolInteriorFreezer : M.coolInterior;
    k.box(inner, xa + 0.02, 0.5, zb + 0.03, xb - 0.02, 2.13, zb + 0.06);                  // back wall (glowing)
    k.box(M.white, Math.max(xa - 0.01, x0 + 0.001), 0.5, zb + 0.03, Math.min(xa + 0.015, x1 - 0.001), 2.13, zf - 0.002);   // divider
    k.box(bay.freezer ? M.ledCool : M.ledWhite, xa + 0.02, 0.52, zf - 0.09, xa + 0.05, 2.11, zf - 0.06);      // LED bars either side
    k.box(bay.freezer ? M.ledCool : M.ledWhite, xb - 0.05, 0.52, zf - 0.09, xb - 0.02, 2.11, zf - 0.06);
    k.box(bay.freezer ? M.ledCool : M.ledWhite, xa + 0.05, 2.11, zb + 0.06, xb - 0.05, 2.13, zf - 0.03);      // top light
    COOL_Y.forEach((y) => k.box(M.coolShelf, xa + 0.015, y - 0.02, zb + 0.06, xb - 0.015, y, zf - 0.04));
    // door frame stiles and handle
    k.box(M.coolFrame, xa - 0.005, 0.5, zf - 0.02, xa + 0.035, 2.13, zf + 0.035);
    k.box(M.coolFrame, xb - 0.035, 0.5, zf - 0.02, xb + 0.005, 2.13, zf + 0.035);
    // shelf descriptors
    COOL_Y.forEach((y, si) => ctx.shelves.push({
      pool: bay.pools ? bay.pools[si] || bay.pools[bay.pools.length - 1] : bay.pool, tag: `C${i}s${si}`, x: xa + 0.06, z: zf - 0.05, y, dx: 1, dz: 0, ox: 0, oz: 1,
      len: bw - 0.12, dep: 0.82, clear: si < COOL_Y.length - 1 ? COOL_Y[si + 1] - y - 0.035 : 0.2, lean: 0.03, tint: bay.freezer ? 1.05 : 1.16, order: ctx.shelves.length,
      noTag: false, cooler: i, alcohol: !!bay.alcohol,
    }));
  });
  k.build(ctx.root);
  ctx.occluders.push(...ctx.root.children.filter((c) => c.name === 'coolers'));

  // glass doors (one pane per bay), lit header signs, frost, alcohol covers
  const glassGeo = new THREE.PlaneGeometry(bw - 0.07, 1.62);
  ctx.coolerDoors = [];
  const dw = bw - 0.07;
  bays.forEach((bay, i) => {
    const xa = x0 + i * bw;
    // hinged door: pivot on the hinge stile, handle on the free edge. Swings open while you look into the bay.
    const hingeLeft = i % 2 === 0, dir = hingeLeft ? 1 : -1;
    const pivot = new THREE.Group();
    pivot.position.set(hingeLeft ? xa + 0.035 : xa + bw - 0.035, 0, zf + 0.012);
    pivot.userData.keep = true;
    const g = new THREE.Mesh(glassGeo, M.glass);
    g.position.set(dir * dw / 2, 1.31, 0); g.renderOrder = 2;
    pivot.add(g);
    const dk = new Kit('cdoor');
    const fa = hingeLeft ? 0 : -dw, fb = hingeLeft ? dw : 0;
    dk.box(M.coolFrame, fa, 0.5, -0.012, fb, 0.545, 0.022);
    dk.box(M.coolFrame, fa, 2.085, -0.012, fb, 2.13, 0.022);
    dk.box(M.coolFrame, fa, 0.5, -0.012, fa + 0.03, 2.13, 0.022);
    dk.box(M.coolFrame, fb - 0.03, 0.5, -0.012, fb, 2.13, 0.022);
    const hxl = hingeLeft ? dw - 0.06 : -dw + 0.06;
    dk.box(M.chrome, hxl - 0.012, 0.95, 0.022, hxl + 0.012, 1.75, 0.05);
    dk.box(M.chrome, hxl - 0.012, 0.95, 0.0, hxl + 0.012, 0.985, 0.05);
    dk.box(M.chrome, hxl - 0.012, 1.715, 0.0, hxl + 0.012, 1.75, 0.05);
    dk.build(pivot, { cast: false });
    ctx.root.add(pivot);
    ctx.coolerDoors.push({ pivot, dir, open: 0, target: 0, hold: 0, x: xa + bw / 2, z: zf, alcohol: !!bay.alcohol, freezer: !!bay.freezer });
    if (bay.freezer) {
      const frost = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.07, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false }));
      frost.position.set(xa + bw / 2, 0.85, zf + 0.018); ctx.root.add(frost);   // just in front of the door glass (zf + 0.012)
    }
    // header sign
    const sg = makeSign(bw - 0.06, 0.4, 260, (c, W, H) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
      const col = bay.color || BRAND.green;
      c.fillStyle = col; c.fillRect(0, H * 0.78, W, H * 0.22);
      langText(c, bay.title, W * 0.04, H * 0.04, W * 0.92, H * 0.72, { family: 'kanit', weight: 700, size: H * 0.6, color: col, lines: 1, lines2: 1, split: 0.62 });
    }, {});
    sg.mesh.position.set(xa + bw / 2, 2.38, zf + 0.032);
    ctx.root.add(sg.mesh);
    if (bay.alcohol) {
      const cover = makeSign(bw - 0.07, 1.62, 200, (c, W, H) => {
        c.fillStyle = '#26282d'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#c8102e'; c.fillRect(0, 0, W, H * 0.09); c.fillRect(0, H * 0.91, W, H * 0.09);
        c.strokeStyle = '#fff'; c.lineWidth = W * 0.05; c.beginPath(); c.arc(W / 2, H * 0.24, W * 0.22, 0, 6.3); c.stroke();
        c.lineWidth = W * 0.05; c.strokeStyle = '#c8102e'; c.beginPath(); c.arc(W / 2, H * 0.24, W * 0.22, 0, 6.3); c.moveTo(W * 0.34, H * 0.34); c.lineTo(W * 0.66, H * 0.14); c.stroke();
        langText(c, { th: 'งดจำหน่ายเครื่องดื่มแอลกอฮอล์', en: 'Alcohol not on sale now' }, W * 0.06, H * 0.42, W * 0.88, H * 0.2, { family: 'kanit', weight: 700, size: H * 0.16, color: '#fff', lines: 3, lines2: 2, split: 0.6 });
        langText(c, { th: 'จำหน่ายได้ 11.00–14.00 น. และ 17.00–24.00 น.', en: 'Sales hours 11:00–14:00 and 17:00–24:00' }, W * 0.06, H * 0.66, W * 0.88, H * 0.24, { family: 'sarabun', weight: 700, size: H * 0.1, color: '#ffd54a', lines: 3, lines2: 2, split: 0.6 });
      }, {});
      cover.mesh.position.set(xa + bw / 2, 1.31, zf - 0.005);
      cover.mesh.visible = false;
      cover.mesh.userData.alcoholCover = true; cover.mesh.userData.keep = true;
      ctx.alcoholCovers.push(cover.mesh);
      ctx.root.add(cover.mesh);
    }
  });
  // soft light spill on the floor in front of the coolers
  const spill = new THREE.Mesh(new THREE.PlaneGeometry((x1 - x0) * 0.98, 1.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }));
  spill.rotation.x = -Math.PI / 2; spill.position.set((x0 + x1) / 2, 0.006, zf + 0.75); ctx.root.add(spill);
}

// Open-front multi-deck chiller on the left wall (ready meals, sandwiches, desserts)
export function buildOpenChiller(ctx, def) {
  const c = L.chillerL;
  const k = new Kit('chiller');
  const zA = c.z0, zB = c.z1;            // z0 = -14.6 (far), z1 = -6.6 (near)
  const wallX = L.x0;
  const ys = def.ys || [0.5, 0.92, 1.34, 1.76];
  k.box(M.darkGrey, wallX, 0, zA, wallX + 0.98, 0.42, zB, { solid: 'chiller' });                   // base
  k.box(M.coolInterior, wallX, 0.42, zA + 0.002, wallX + 0.05, 2.08, zB - 0.002);                     // glowing back (under the canopy)
  k.box(M.white, wallX, 2.08, zA, wallX + 0.98, 2.16, zB);                                           // canopy
  k.box(M.ledCool, wallX + 0.06, 2.06, zA, wallX + 0.92, 2.08, zB);                                  // LED under the canopy
  k.box(M.coolFrame, wallX + 0.94, 0.42, zA, wallX + 0.978, 2.08, zA + 0.04);                        // end frames (stop under the canopy)
  k.box(M.coolFrame, wallX + 0.94, 0.42, zB - 0.04, wallX + 0.978, 2.08, zB);
  // header lightbox
  k.box(M.white, wallX, 2.16, zA, wallX + 1.0, 2.56, zB);
  ys.forEach((y, i) => {
    // sloped deck: flat plank + front lip
    k.box(M.coolShelf, wallX + 0.05, y - 0.03, zA + 0.04, wallX + 0.94, y, zB - 0.04);
    k.box(M.lightGrey, wallX + 0.92, y - 0.06, zA + 0.043, wallX + 0.95, y + 0.02, zB - 0.043);
    ctx.shelves.push({
      pool: def.pools[i] || def.pools[def.pools.length - 1], tag: `CH${i}`, x: wallX + 0.93, z: zB - 0.05, y, dx: 0, dz: -1, ox: 1, oz: 0,
      len: zB - zA - 0.1, dep: 0.86, clear: i < ys.length - 1 ? ys[i + 1] - y - 0.05 : 0.34, lean: 0.03, tint: 1.12, order: ctx.shelves.length,
    });
  });
  addCollider(wallX, zA, wallX + 0.98, zB, 'chiller');
  k.build(ctx.root);
  ctx.occluders.push(...ctx.root.children.filter((c2) => c2.name === 'chiller'));
  // header signage (three panels)
  const n = def.headers.length, seg = (zB - zA) / n;
  def.headers.forEach((h, i) => {
    const sg = makeSign(seg - 0.08, 0.36, 240, (c2, W, H) => {
      c2.fillStyle = '#fff'; c2.fillRect(0, 0, W, H);
      c2.fillStyle = h.color || BRAND.green; c2.fillRect(0, H * 0.76, W, H * 0.24);
      langText(c2, h.title, W * 0.04, H * 0.04, W * 0.92, H * 0.7, { family: 'kanit', weight: 700, size: H * 0.6, color: h.color || BRAND.green, lines: 1, lines2: 1, split: 0.62 });
    }, {});
    sg.mesh.position.set(wallX + 1.005, 2.36, zB - seg * (i + 0.5));
    sg.mesh.rotation.y = Math.PI / 2;
    ctx.root.add(sg.mesh);
  });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(1.4, zB - zA), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.09, depthWrite: false, blending: THREE.AdditiveBlending }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(wallX + 1.6, 0.006, (zA + zB) / 2); ctx.root.add(spill);
}

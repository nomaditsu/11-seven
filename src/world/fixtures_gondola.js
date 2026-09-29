// Gondola shelving (free-standing double-sided units), wall shelving and the hanging aisle signs.
import * as THREE from 'three';
import { M, std } from './materials.js';
import { Kit } from './kit.js';
import { L } from './layout.js';
import { makeSign } from '../gfx/localized.js';
import { fitText, langText, fillRR, circle, rrPath } from '../gfx/draw.js';
import { BRAND, drawStripes } from '../gfx/logo11seven.js';
import { blobShadow, edgeShadow } from '../gfx/surfaces.js';
import { addCollider } from './colliders.js';

export const SHELF_Y = [0.17, 0.52, 0.87, 1.22, 1.55];
export const WALL_Y = [0.17, 0.52, 0.87, 1.22, 1.57, 1.92];

// A shelf run: planks + front rail; registers descriptors for the planogram.
function shelfRun(k, ctx, o) {
  // o: { tag, pool[], x, z (left-front corner), dx,dz,ox,oz, len, dep, ys[], lipMat }
  const { x, z, dx, dz, ox, oz, len, dep, ys } = o;
  const pools = Array.isArray(o.pool) ? o.pool : [o.pool];
  const plank = M.white, lip = M.lightGrey;
  ys.forEach((y, i) => {
    // plank: from front edge back by dep. Build with corner arithmetic in world space.
    const fx = x, fz = z;                       // front-left corner
    const bx = x + dx * len - ox * dep, bz = z + dz * len - oz * dep; // back-right corner
    const x0 = Math.min(fx, bx), x1 = Math.max(fx, bx), z0 = Math.min(fz, bz), z1 = Math.max(fz, bz);
    // ends pulled in along the run (1.5 mm plank, 3 mm lip) so they never share a face with the uprights, back panel or each other
    const ix = Math.abs(dx) * 0.0015, iz = Math.abs(dz) * 0.0015;
    k.box(plank, x0 + ix, y - 0.03, z0 + iz, x1 - ix, y, z1 - iz, { tile: 0.5 });
    // front lip / price rail (thin vertical strip along the front edge)
    const lx0 = Math.min(fx, fx + dx * len) - (Math.abs(ox) > 0.5 ? 0 : 0), lx1 = Math.max(fx, fx + dx * len);
    const lz0 = Math.min(fz, fz + dz * len), lz1 = Math.max(fz, fz + dz * len);
    const e = 0.012;
    if (Math.abs(ox) > 0.5) k.box(lip, Math.min(fx, fx + ox * e), y - 0.045, lz0 + 0.003, Math.max(fx, fx + ox * e), y + 0.015, lz1 - 0.003);
    else k.box(lip, lx0 + 0.003, y - 0.045, Math.min(fz, fz + oz * e), lx1 - 0.003, y + 0.015, Math.max(fz, fz + oz * e));
    // register for the planogram
    ctx.shelves.push({
      pool: pools[i] || pools[pools.length - 1], tag: `${o.tag}${i}`, x, z, y, dx, dz, ox, oz, len: len - 0.03, dep: dep - 0.02,
      clear: i < ys.length - 1 ? ys[i + 1] - y - 0.04 : (o.topClear ?? 0.36), lean: o.lean ?? 0.03,
      tint: (o.tint ?? 1) * (0.86 + 0.14 * (i / Math.max(1, ys.length - 1))), hang: !!o.hang, order: ctx.shelves.length,
    });
  });
}

export function aisleSign(textObj, w = 1.3, h = 0.44, color = BRAND.green, side = 'both') {
  const grp = new THREE.Group();
  const draw = (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    fillRR(ctx, 0, 0, W, H, H * 0.16, color);
    ctx.fillStyle = 'rgba(255,255,255,.14)'; rrPath(ctx, 0, 0, W, H * 0.5, [H * 0.16, H * 0.16, 0, 0]); ctx.fill();
    drawStripes(ctx, W * 0.04, H * 0.82, W * 0.92, H * 0.09);
    langText(ctx, textObj, W * 0.05, H * 0.06, W * 0.9, H * 0.72, { family: 'kanit', weight: 700, size: H * 0.6, color: '#fff', lines: 2, lines2: 1, split: 0.6, shadow: ['rgba(0,0,0,.3)', 0, 2, 3] });
  };
  const s1 = makeSign(w, h, 220, draw, { transparent: true });
  const s2 = makeSign(w, h, 220, draw, { transparent: true });
  s1.mesh.position.z = 0.016; s2.mesh.position.z = -0.016; s2.mesh.rotation.y = Math.PI;   // 6 mm off the 20 mm box
  const box = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, h - 0.02, 0.02), M.darkGreen);
  grp.add(box, s1.mesh, s2.mesh);
  // two hanging rods
  const rod = new THREE.CylinderGeometry(0.006, 0.006, 0.5, 6);
  for (const sx of [-w * 0.4, w * 0.4]) { const r = new THREE.Mesh(rod, M.steel); r.position.set(sx, h / 2 + 0.25, 0); grp.add(r); }
  return grp;
}

export function buildGondola(ctx, def) {
  const { id, x0, x1, z0, z1 } = def;
  const k = new Kit('gond-' + id);
  const H = 1.66, ys = def.ys || SHELF_Y;
  const cx = (x0 + x1) / 2, len = z1 - z0, dep = (x1 - x0) / 2 - 0.02;
  // plinth + spine + top cap
  k.box(M.darkGrey, x0 + 0.02, 0, z0, x1 - 0.02, 0.12, z1, { solid: 'gondola' });
  k.box(M.pegboard, cx - 0.018, 0.12, z0, cx + 0.018, H, z1, { tile: 0.3048 });
  k.box(M.lightGrey, x0, H, z0, x1, H + 0.045, z1, { tile: 0.5 });
  k.box(M.orange, x0, H + 0.045, z0, x1, H + 0.06, z1);
  // uprights
  for (let z = z0; z <= z1 + 0.01; z += 1.2) {
    const zz = Math.min(z, z1 - 0.03);
    k.box(M.grey, cx - 0.03, 0.12, zz, cx + 0.03, H, zz + 0.05);
  }
  addCollider(x0, z0, x1, z1, 'gondola');
  // Side A: faces -x (customer stands at x < x0, sees shelf running along +z)
  shelfRun(k, ctx, { tag: id + 'A', pool: def.poolA, x: x0, z: z0, dx: 0, dz: 1, ox: -1, oz: 0, len, dep, ys, lean: 0.03 });
  // Side B: faces +x (customer at x > x1, shelf runs along -z)
  shelfRun(k, ctx, { tag: id + 'B', pool: def.poolB, x: x1, z: z1, dx: 0, dz: -1, ox: 1, oz: 0, len, dep, ys, lean: 0.03 });
  // end caps (promotion displays) extend beyond each end of the gondola
  const eys = def.endYs || [0.2, 0.62, 1.04, 1.44];
  const w = x1 - x0, ed = 0.36;
  if (def.poolEndF) {
    // end-cap parts start after the 12 mm orange end face, never inside it
    shelfRun(k, ctx, { tag: id + 'EF', pool: def.poolEndF, x: x0 + 0.02, z: z1 + ed, dx: 1, dz: 0, ox: 0, oz: 1, len: w - 0.04, dep: ed - 0.012, ys: eys, lean: 0.06, topClear: 0.3 });
    k.box(M.darkGrey, x0 + 0.02, 0, z1, x1 - 0.02, 0.12, z1 + ed);
    k.box(M.lightGrey, x0, 0.12, z1 + 0.012, x0 + 0.02, 1.66, z1 + ed); k.box(M.lightGrey, x1 - 0.02, 0.12, z1 + 0.012, x1, 1.66, z1 + ed);
    k.box(M.orange, x0, 1.66, z1, x1, 1.72, z1 + ed);
    addCollider(x0, z1, x1, z1 + ed, 'endcap');
  }
  if (def.poolEndB) {
    shelfRun(k, ctx, { tag: id + 'EB', pool: def.poolEndB, x: x1 - 0.02, z: z0 - ed, dx: -1, dz: 0, ox: 0, oz: -1, len: w - 0.04, dep: ed - 0.012, ys: eys, lean: 0.06, topClear: 0.3 });
    k.box(M.darkGrey, x0 + 0.02, 0, z0 - ed, x1 - 0.02, 0.12, z0);
    k.box(M.lightGrey, x0, 0.12, z0 - ed, x0 + 0.02, 1.66, z0 - 0.012); k.box(M.lightGrey, x1 - 0.02, 0.12, z0 - ed, x1, 1.66, z0 - 0.012);
    k.box(M.orange, x0, 1.66, z0 - ed, x1, 1.72, z0);
    addCollider(x0, z0 - ed, x1, z0, 'endcap');
  }
  // gondola end faces
  k.box(M.orange, x0 + 0.001, 0.12, z1, x1 - 0.001, H, z1 + 0.012);   // 1 mm inside the side panels
  k.box(M.orange, x0 + 0.001, 0.12, z0 - 0.012, x1 - 0.001, H, z0);
  k.build(ctx.root);
  ctx.occluders.push(...ctx.root.children.filter((c) => c.name === 'gond-' + id));

  // floor contact shadow decals (fake ambient occlusion)
  const dec = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 0.5, len + 0.5), new THREE.MeshBasicMaterial({ map: blobShadow(), transparent: true, opacity: 0.4, depthWrite: false, color: 0x000000 }));
  dec.rotation.x = -Math.PI / 2; dec.position.set(cx, 0.004, (z0 + z1) / 2); dec.renderOrder = 1;
  ctx.root.add(dec);

  // hanging aisle signs at the front end (z1 side) and the back end
  if (def.signF) {
    const sg = aisleSign(def.signF); sg.position.set(cx, 2.62, z1 + 0.5); ctx.root.add(sg);
  }
  if (def.signB) {
    const sg = aisleSign(def.signB); sg.position.set(cx, 2.62, z0 - 0.5); sg.rotation.y = Math.PI; ctx.root.add(sg);
  }
}

// Full-height wall shelving (right wall) — customer faces the wall
export function buildWallUnit(ctx, def) {
  const k = new Kit('wall-' + def.id);
  const { x, z0, z1, side } = def; // side: +1 wall on the right (faces -x), -1 wall on the left (faces +x)
  const H = def.H || 2.05, len = z1 - z0, dep = def.dep || 0.42;
  const wallX = side > 0 ? L.x1 : L.x0;
  // back panel
  k.box(M.pegboard, Math.min(wallX, wallX - side * 0.03), 0.12, z0, Math.max(wallX, wallX - side * 0.03), H, z1, { tile: 0.3048 });
  k.box(M.darkGrey, Math.min(wallX, wallX - side * dep), 0, z0, Math.max(wallX, wallX - side * dep), 0.12, z1, { solid: 'wallunit' });
  // top canopy / header box
  k.box(M.lightGrey, Math.min(wallX, wallX - side * (dep + 0.04)), H, z0, Math.max(wallX, wallX - side * (dep + 0.04)), H + 0.32, z1, { tile: 0.5 });
  k.box(M.orange, Math.min(wallX - side * (dep + 0.04), wallX - side * (dep + 0.05)), H + 0.18, z0, Math.max(wallX - side * (dep + 0.04), wallX - side * (dep + 0.05)), H + 0.22, z1);
  // uprights
  for (let z = z0; z <= z1; z += 1.0) k.box(M.grey, Math.min(wallX - side * 0.03, wallX - side * (dep - 0.004)), 0.12, Math.min(z, z1 - 0.04), Math.max(wallX - side * 0.03, wallX - side * (dep - 0.004)), H, Math.min(z, z1 - 0.04) + 0.04);   // 4 mm behind the shelf fronts
  addCollider(Math.min(wallX, wallX - side * dep), z0, Math.max(wallX, wallX - side * dep), z1, 'wallunit');
  const ys = def.ys || WALL_Y;
  // customer stands on the room side; on the right wall the customer faces +x (right = +z); on the left wall faces -x (right = -z)
  const fx = wallX - side * dep;
  if (side > 0) shelfRun(k, ctx, { tag: 'W' + def.id, pool: def.pool, x: fx, z: z0, dx: 0, dz: 1, ox: -1, oz: 0, len, dep: dep - 0.02, ys, lean: 0.04 });
  else shelfRun(k, ctx, { tag: 'W' + def.id, pool: def.pool, x: fx, z: z1, dx: 0, dz: -1, ox: 1, oz: 0, len, dep: dep - 0.02, ys, lean: 0.04 });
  k.build(ctx.root);
  ctx.occluders.push(...ctx.root.children.filter((c) => c.name === 'wall-' + def.id));
  if (def.sign) {
    const sg = makeSign(Math.min(len - 0.2, 3.2), 0.28, 200, (c, W, Hh) => {
      c.clearRect(0, 0, W, Hh); fillRR(c, 0, 0, W, Hh, Hh * 0.2, BRAND.green);
      langText(c, def.sign, W * 0.04, Hh * 0.06, W * 0.92, Hh * 0.88, { family: 'kanit', weight: 700, size: Hh * 0.72, color: '#fff', lines: 1, lines2: 1, split: 0.6 });
    }, { transparent: true });
    sg.mesh.position.set(wallX - side * (dep + 0.056), H + 0.16, (z0 + z1) / 2);
    sg.mesh.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    ctx.root.add(sg.mesh);
  }
}

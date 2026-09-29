// Builds product meshes' geometry (metres, origin at bottom centre, front = +z) with UVs matched to the packaging atlas.
import * as THREE from 'three';
import { PROFILES, GEO, atlasFor } from '../data/shapes.js';

const cache = new Map();

// UV rectangle of a cell (canvas coords, top-left origin) in texture space.
function cellUV(atlas, cell) {
  const [x, y, w, h] = cell;
  return { u0: x / atlas.W, u1: (x + w) / atlas.W, vT: 1 - y / atlas.H, vB: 1 - (y + h) / atlas.H };
}

function lathe(profile, D, H, atlas) {
  const P = PROFILES[profile];
  const R = D / 2, seg = P.seg || 20, pts = P.pts;
  const pos = [], nor = [], uv = [], idx = [];
  const wu = cellUV(atlas, atlas.cells.wrap);
  const span = wu.u1 - wu.u0;
  for (let j = 0; j < pts.length; j++) {
    const [rn, yn] = pts[j];
    // outward normal of the profile curve in the (r, y) plane
    const a = pts[Math.max(0, j - 1)], b = pts[Math.min(pts.length - 1, j + 1)];
    let tr = (b[0] - a[0]) * R, ty = (b[1] - a[1]) * H;
    const tl = Math.hypot(tr, ty) || 1; tr /= tl; ty /= tl;
    const nr = ty, ny = -tr;
    for (let i = 0; i <= seg; i++) {
      const ang = (i / seg) * Math.PI * 2;
      const s = Math.sin(ang), c = Math.cos(ang);
      pos.push(s * rn * R, yn * H, c * rn * R);
      nor.push(s * nr, ny, c * nr);
      // the front (+z, angle 0) samples the centre of the wrap cell; u runs 0.5..1.5 and the texture repeats
      uv.push(wu.u0 + (0.5 + i / seg) * span, wu.vB + yn * (wu.vT - wu.vB));
    }
  }
  for (let j = 0; j < pts.length - 1; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i, b = a + 1, c = a + seg + 1, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  // flat top disc mapped into the atlas' "top" cell
  const topR = (P.topR ?? pts[pts.length - 1][0]) * R;
  const tu = cellUV(atlas, atlas.cells.top);
  const mu = (tu.u0 + tu.u1) / 2, mv = (tu.vT + tu.vB) / 2;
  const base = pos.length / 3;
  pos.push(0, H, 0); nor.push(0, 1, 0); uv.push(mu, mv);
  for (let i = 0; i <= seg; i++) {
    const ang = (i / seg) * Math.PI * 2;
    const s = Math.sin(ang), c = Math.cos(ang);
    pos.push(s * topR, H, c * topR); nor.push(0, 1, 0);
    uv.push(mu + (s * topR / D) * (tu.u1 - tu.u0), mv - (c * topR / D) * (tu.vT - tu.vB));
  }
  for (let i = 0; i < seg; i++) idx.push(base, base + 1 + i, base + 2 + i);
  return finish(pos, nor, uv, idx, 0.01);
}

function finish(pos, nor, uv, idx, scale) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i++) p[i] = pos[i] * scale;
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

function bag(w, h, d, atlas) {
  const NX = 10, NY = 16;
  const pos = [], nor = [], uv = [], idx = [];
  const fu = cellUV(atlas, atlas.cells.front), bu = cellUV(atlas, atlas.cells.back);
  const seal = Math.min(0.9, h * 0.06);
  const bulge = (x, y) => {
    const sx = Math.pow(Math.max(0, 1 - Math.pow((2 * x) / w, 2)), 0.6);
    const t = Math.min(1, Math.max(0, (y - seal) / (h - 2 * seal)));
    const sy = Math.pow(Math.sin(Math.PI * t), 0.65) * (1 - 0.14 * t);
    return (d / 2) * sx * sy;
  };
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const x = (i / NX - 0.5) * w, y = (j / NY) * h;
      const z = side * (bulge(x, y) + 0.02);
      pos.push(x, y, z); nor.push(0, 0, side);
      const s = i / NX;
      if (side > 0) uv.push(fu.u0 + s * (fu.u1 - fu.u0), fu.vB + (j / NY) * (fu.vT - fu.vB));
      else uv.push(bu.u0 + (1 - s) * (bu.u1 - bu.u0), bu.vB + (j / NY) * (bu.vT - bu.vB));
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const a = base + j * (NX + 1) + i, b = a + 1, c = a + NX + 1, e = c + 1;
      if (side > 0) idx.push(a, b, c, b, e, c); else idx.push(a, c, b, b, c, e);
    }
  }
  const g = finish(pos, nor, uv, idx, 0.01);
  g.computeVertexNormals();
  return g;
}

function box(w, h, d, atlas, gable) {
  const pos = [], nor = [], uv = [], idx = [];
  const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
  const quad = (n, c, cell, order) => {
    const u = cellUV(atlas, cell);
    const base = pos.length / 3;
    const uvs = [[u.u0, u.vB], [u.u1, u.vB], [u.u1, u.vT], [u.u0, u.vT]];
    for (let i = 0; i < 4; i++) { pos.push(...c[i]); nor.push(...n); uv.push(...uvs[i]); }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const cells = atlas.cells;
  quad([0, 0, 1], [[x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1]], cells.front);
  quad([0, 0, -1], [[x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0]], cells.back);
  quad([1, 0, 0], [[x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1]], cells.right);
  quad([-1, 0, 0], [[x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0]], cells.left);
  quad([0, -1, 0], [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], cells.bottom);
  if (!gable) {
    quad([0, 1, 0], [[x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0]], cells.top);
  } else {
    // pitched roof: ridge along x at centre
    const rh = d * 0.6, ry = h + rh;
    const uT = cellUV(atlas, cells.top);
    const slope = (n, c) => {
      const base = pos.length / 3;
      const uvs = [[uT.u0, uT.vB], [uT.u1, uT.vB], [uT.u1, uT.vT], [uT.u0, uT.vT]];
      for (let i = 0; i < 4; i++) { pos.push(...c[i]); nor.push(...n); uv.push(...uvs[i]); }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    const nf = new THREE.Vector3(0, d / 2, rh).normalize(), nb = new THREE.Vector3(0, d / 2, -rh).normalize();
    slope([nf.x, nf.y, nf.z], [[x0, h, z1], [x1, h, z1], [x1, ry, 0], [x0, ry, 0]]);
    slope([nb.x, nb.y, nb.z], [[x1, h, z0], [x0, h, z0], [x0, ry, 0], [x1, ry, 0]]);
    // gable ends (triangles) use a flat region of the side cell
    const uS = cellUV(atlas, cells.right);
    const tri = (n, a, b, c) => { const base = pos.length / 3; for (const p of [a, b, c]) { pos.push(...p); nor.push(...n); uv.push((uS.u0 + uS.u1) / 2, uS.vT - 0.001); } idx.push(base, base + 1, base + 2); };
    tri([1, 0, 0], [x1, h, z1], [x1, h, z0], [x1, ry, 0]);
    tri([-1, 0, 0], [x0, h, z0], [x0, h, z1], [x0, ry, 0]);
  }
  return finish(pos, nor, uv, idx, 0.01);
}

export function getGeoDef(key) { return GEO[key]; }
export function getGeometry(geoKey) {
  if (cache.has(geoKey)) return cache.get(geoKey);
  const def = GEO[geoKey];
  if (!def) throw new Error('unknown geometry ' + geoKey);
  const atlas = atlasFor(def);
  let g;
  if (def.kind === 'wrap') g = lathe(def.profile, def.dims[0], def.dims[1], atlas);
  else if (def.kind === 'bag') g = bag(def.dims[0], def.dims[1], def.dims[2], atlas);
  else if (def.kind === 'gable') g = box(def.dims[0], def.dims[1], def.dims[2], atlas, true);
  else g = box(def.dims[0], def.dims[1], def.dims[2], atlas, false);
  cache.set(geoKey, g);
  return g;
}

// Geometry kit: accumulate boxes / cylinders / planes per material, then merge into few draw calls.
import * as THREE from 'three';
import { addCollider } from './colliders.js';

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

// Box between two corners. UVs are world-aligned metres / tile so textures tile seamlessly across boxes.
export function boxGeo(x0, y0, z0, x1, y1, z1, tile = null, skip = null) {
  const pos = [], nor = [], uv = [], idx = [];
  const tu = tile ? (Array.isArray(tile) ? tile[0] : tile) : 0;
  const tv = tile ? (Array.isArray(tile) ? tile[1] : tile) : 0;
  const face = (key, n, corners, uvf) => {
    if (skip && skip.includes(key)) return;
    const base = pos.length / 3;
    for (let i = 0; i < 4; i++) {
      const c = corners[i];
      pos.push(c[0], c[1], c[2]); nor.push(n[0], n[1], n[2]);
      const [a, b] = uvf(c, i);
      uv.push(a, b);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const W = tile ? (c, a, b) => [c[a] / tu, c[b] / tv] : null;
  face('+x', [1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], tile ? (c) => W(c, 2, 1) : (c, i) => [[0, 0], [1, 0], [1, 1], [0, 1]][i]);
  face('-x', [-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], tile ? (c) => W(c, 2, 1) : (c, i) => [[0, 0], [1, 0], [1, 1], [0, 1]][i]);
  face('+y', [0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], tile ? (c) => W(c, 0, 2) : (c, i) => [[0, 0], [1, 0], [1, 1], [0, 1]][i]);
  face('-y', [0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], tile ? (c) => W(c, 0, 2) : (c, i) => [[0, 0], [1, 0], [1, 1], [0, 1]][i]);
  face('+z', [0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], tile ? (c) => W(c, 0, 1) : (c, i) => [[0, 0], [1, 0], [1, 1], [0, 1]][i]);
  face('-z', [0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], tile ? (c) => W(c, 0, 1) : (c, i) => [[0, 0], [1, 0], [1, 1], [0, 1]][i]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export class Kit {
  constructor(name = 'kit') { this.name = name; this.groups = new Map(); this.count = 0; }

  add(mat, geo, matrix = null) {
    if (matrix) geo.applyMatrix4(matrix);
    let a = this.groups.get(mat);
    if (!a) this.groups.set(mat, (a = []));
    a.push(geo);
    this.count++;
    return geo;
  }

  // Axis-aligned box between corners. o: { tile, skip, ry (about box centre), solid (tag), pivot }
  box(mat, x0, y0, z0, x1, y1, z1, o = {}) {
    const g = boxGeo(x0, y0, z0, x1, y1, z1, o.tile ?? null, o.skip ?? null);
    if (o.ry) {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      tmpM.makeTranslation(cx, 0, cz).multiply(new THREE.Matrix4().makeRotationY(o.ry)).multiply(new THREE.Matrix4().makeTranslation(-cx, 0, -cz));
      g.applyMatrix4(tmpM);
    }
    this.add(mat, g);
    if (o.solid) addCollider(x0, z0, x1, z1, typeof o.solid === 'string' ? o.solid : this.name);
    return g;
  }
  // Box by centre + size
  boxC(mat, cx, cy, cz, w, h, d, o = {}) { return this.box(mat, cx - w / 2, cy - h / 2, cz - d / 2, cx + w / 2, cy + h / 2, cz + d / 2, o); }

  // Cylinder with its base at y. o: { seg, open, rx, rz, ry }
  cyl(mat, cx, y, cz, rTop, rBot, h, o = {}) {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, o.seg || 16, 1, !!o.open);
    tmpE.set(o.rx || 0, o.ry || 0, o.rz || 0);
    tmpQ.setFromEuler(tmpE);
    tmpM.compose(new THREE.Vector3(cx, y + h / 2, cz), tmpQ, new THREE.Vector3(1, 1, 1));
    this.add(mat, g, tmpM);
    return g;
  }
  // Plane facing +z by default; rotated by (rx, ry, rz)
  plane(mat, w, h, cx, cy, cz, o = {}) {
    const g = new THREE.PlaneGeometry(w, h);
    if (o.tile) {
      const uv = g.attributes.uv, tu = Array.isArray(o.tile) ? o.tile[0] : o.tile, tv = Array.isArray(o.tile) ? o.tile[1] : o.tile;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tu, uv.getY(i) * h / tv);
    }
    tmpE.set(o.rx || 0, o.ry || 0, o.rz || 0);
    tmpQ.setFromEuler(tmpE);
    tmpM.compose(new THREE.Vector3(cx, cy, cz), tmpQ, new THREE.Vector3(1, 1, 1));
    this.add(mat, g, tmpM);
    return g;
  }
  // Any geometry with position/rotation/scale
  geo(mat, geometry, x = 0, y = 0, z = 0, o = {}) {
    tmpE.set(o.rx || 0, o.ry || 0, o.rz || 0);
    tmpQ.setFromEuler(tmpE);
    tmpM.compose(new THREE.Vector3(x, y, z), tmpQ, new THREE.Vector3(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1));
    this.add(mat, geometry.clone(), tmpM);
  }

  build(parent, { cast = true, receive = true, name } = {}) {
    const out = [];
    for (const [mat, geos] of this.groups) {
      if (!geos.length) continue;
      const merged = geos.length === 1 ? geos[0] : THREE.mergeGeometries(geos, false);
      if (!merged) { console.warn('merge failed for', this.name); continue; }
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = cast && !mat.transparent; mesh.receiveShadow = receive;
      mesh.name = name || this.name;
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      parent.add(mesh); out.push(mesh);
    }
    this.groups.clear();
    return out;
  }
}

// Product instancing: every SKU on a fixture is one InstancedMesh; slots remember where each unit sits so it
// can be picked up, put back, inspected. Also owns the shelf price-tag atlas.
import * as THREE from 'three';
import { GEO, atlasFor } from '../data/shapes.js';
import { getGeometry } from './productGeo.js';
import { makeSkuTexture } from '../gfx/packaging.js';
import { LTex } from '../gfx/localized.js';
import { ENV } from './materials.js';
import { fitText, langText, fillRR } from '../gfx/draw.js';
import { pick, lang } from '../core/i18n.js';
import { rng, hashStr, clamp } from '../core/util.js';

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _c = new THREE.Color();

export function itemSize(sku) {
  const geo = GEO[sku.g];
  if (geo.kind === 'wrap') return { w: geo.dims[0] / 100, h: geo.dims[1] / 100, d: geo.dims[0] / 100 };
  return { w: geo.dims[0] / 100, h: geo.dims[1] / 100, d: geo.dims[2] / 100 };
}

// Material properties per look
function matParams(sku) {
  const geo = GEO[sku.g];
  const st = sku.style;
  let rough = 0.5, metal = 0.0;
  if (st === 'can' || st === 'aerosol' || st === 'tin') { rough = 0.3; metal = 0.55; }
  else if (st === 'beer' || st === 'energy') { rough = 0.18; metal = 0.0; }
  else if (st === 'pet' || st === 'water') { rough = 0.22; }
  else if (geo.kind === 'bag') { rough = 0.38; metal = 0.25; }
  else if (st === 'tube' || st === 'cup' || st === 'tub') { rough = 0.4; }
  else if (geo.kind === 'box' || geo.kind === 'gable') { rough = 0.55; }
  if (sku.rough != null) rough = sku.rough;
  return { rough, metal };
}

export class ProductWorld {
  constructor(scene, quality) {
    this.scene = scene; this.quality = quality;
    this.group = new THREE.Group(); this.group.name = 'products';
    scene.add(this.group);
    this.skuTex = new Map();     // sku.id -> LTex
    this.skuMat = new Map();
    this.pending = new Map();    // key -> { sku, tag, items: [] }
    this.groups = [];            // built instanced meshes
    this.slots = [];
    this.byId = new Map();       // sku.id -> slots[]
    this.count = 0;
    this.tagGeoms = [];
    this.hidden = new Set();
  }

  materialFor(sku) {
    let m = this.skuMat.get(sku.id);
    if (m) return m;
    let lt = this.skuTex.get(sku.id);
    if (!lt) { lt = makeSkuTexture(sku, this.quality.texScale ?? 9); this.skuTex.set(sku.id, lt); }
    const { rough, metal } = matParams(sku);
    m = new THREE.MeshStandardMaterial({ map: lt.texture, roughness: rough, metalness: metal, envMap: ENV.inTex, envMapIntensity: 1.0 });
    this.skuMat.set(sku.id, m);
    return m;
  }

  // queue one unit. Returns the slot.
  add(sku, x, y, z, rotY, o = {}) {
    const tag = o.tag || 'misc';
    const key = sku.id + '|' + tag;
    let g = this.pending.get(key);
    if (!g) { g = { sku, tag, items: [] }; this.pending.set(key, g); }
    const size = itemSize(sku);
    const slot = {
      sku, x, y, z, rotY, tint: o.tint ?? 1, taken: false, group: null, index: g.items.length,
      size, tilt: o.tilt || 0, heated: false, gkey: key, hang: !!o.hang,
      // world AABB (rotation-aware for quarter turns)
      box: null,
    };
    const q = Math.abs(Math.sin(rotY)) > 0.7;
    const hw = (q ? size.d : size.w) / 2, hd = (q ? size.w : size.d) / 2;
    slot.box = new THREE.Box3(new THREE.Vector3(x - hw, y, z - hd), new THREE.Vector3(x + hw, y + size.h, z + hd));
    g.items.push(slot);
    this.slots.push(slot);
    if (!this.byId.has(sku.id)) this.byId.set(sku.id, []);
    this.byId.get(sku.id).push(slot);
    this.count++;
    return slot;
  }

  setMatrix(mesh, i, slot, visible) {
    _e.set(-(slot.lean || 0), slot.rotY, slot.roll || 0, 'YXZ');
    _q.setFromEuler(_e);
    _p.set(slot.x, slot.y, slot.z);
    const k = visible ? 1 : 0.0001;
    _s.set(k, k, k);
    _m4.compose(_p, _q, _s);
    mesh.setMatrixAt(i, _m4);
  }

  // build all InstancedMeshes from queued items
  build() {
    for (const g of this.pending.values()) {
      const geom = getGeometry(g.sku.g);
      const mat = this.materialFor(g.sku);
      const mesh = new THREE.InstancedMesh(geom, mat, g.items.length);
      mesh.name = 'sku:' + g.sku.id;
      g.items.forEach((slot, i) => {
        slot.group = mesh; slot.index = i;
        this.setMatrix(mesh, i, slot, true);
        _c.setScalar(slot.tint); mesh.setColorAt(i, _c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = false; mesh.receiveShadow = false;
      this.group.add(mesh);
      this.groups.push(mesh);
    }
    this.pending.clear();
  }

  setTaken(slot, taken) {
    slot.taken = taken;
    if (!slot.group) return;
    this.setMatrix(slot.group, slot.index, slot, !taken);
    slot.group.instanceMatrix.needsUpdate = true;
  }

  // nearest un-taken slot along a ray within maxDist; returns { slot, t } or null
  pick(origin, dir, maxDist) {
    let best = null, bt = maxDist;
    const inv = new THREE.Vector3(1 / (dir.x || 1e-9), 1 / (dir.y || 1e-9), 1 / (dir.z || 1e-9));
    const o = origin;
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (s.taken) continue;
      const b = s.box;
      // quick reject on distance
      const cx = (b.min.x + b.max.x) / 2 - o.x, cz = (b.min.z + b.max.z) / 2 - o.z;
      if (cx * cx + cz * cz > (bt + 0.5) * (bt + 0.5)) continue;
      let t1 = (b.min.x - o.x) * inv.x, t2 = (b.max.x - o.x) * inv.x;
      let tmin = Math.min(t1, t2), tmax = Math.max(t1, t2);
      t1 = (b.min.y - o.y) * inv.y; t2 = (b.max.y - o.y) * inv.y;
      tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
      t1 = (b.min.z - o.z) * inv.z; t2 = (b.max.z - o.z) * inv.z;
      tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
      if (tmax >= Math.max(tmin, 0) && tmin < bt) { bt = Math.max(tmin, 0); best = s; }
    }
    return best ? { slot: best, t: bt } : null;
  }

  slotsOf(id) { return this.byId.get(id) || []; }
  firstFree(id) { return (this.byId.get(id) || []).find((s) => !s.taken); }
}

// ------------------------------------------------------------------------------------------------- price tags
const TAG_W = 128, TAG_H = 64, ATLAS_W = 2048, COLS = ATLAS_W / TAG_W;

export class PriceTags {
  constructor(skus) {
    this.skus = skus;
    this.index = new Map();
    skus.forEach((s, i) => this.index.set(s.id, i));
    const rows = Math.ceil(skus.length / COLS);
    this.ltex = new LTex(ATLAS_W, Math.max(64, rows * TAG_H), (ctx, W, H) => this.paint(ctx), { wrap: false, aniso: 8 });
    this.material = new THREE.MeshBasicMaterial({ map: this.ltex.texture });
    this.positions = []; this.uvs = []; this.indices = [];
    this.H = Math.max(64, rows * TAG_H);
  }
  paint(ctx) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, ATLAS_W, this.H);
    this.skus.forEach((sku, i) => {
      const cx = (i % COLS) * TAG_W, cy = Math.floor(i / COLS) * TAG_H;
      ctx.save(); ctx.translate(cx, cy); ctx.beginPath(); ctx.rect(0, 0, TAG_W, TAG_H); ctx.clip();
      ctx.fillStyle = '#fafaf5'; ctx.fillRect(0, 0, TAG_W, TAG_H);
      ctx.fillStyle = sku.promo ? '#e31e24' : '#00874a'; ctx.fillRect(0, 0, TAG_W, 9);
      ctx.fillStyle = '#f58220'; ctx.fillRect(0, 9, TAG_W, 2.5);
      langText(ctx, sku.name, 4, 12, TAG_W * 0.62, 34, { family: 'kanit', weight: 700, size: 15, color: '#222', align: 'left', lines: 2, lines2: 1, split: 0.62, valign: 'top', min: 7 });
      const p = lang.code === 'th' || lang.mode === 'both' ? `${sku.price}.-` : `฿${sku.price}`;
      fitText(ctx, p, TAG_W * 0.42, 24, TAG_W * 0.56, 36, { family: 'kanit', weight: 900, size: 34, color: sku.promo ? '#d81f26' : '#111', align: 'right', min: 12 });
      if (sku.size) fitText(ctx, pick(sku.size), 4, 47, TAG_W * 0.4, 14, { family: 'sarabun', weight: 700, size: 12, color: '#555', align: 'left' });
      if (sku.promo) { ctx.fillStyle = '#ffe600'; ctx.fillRect(0, 51, TAG_W, 13); fitText(ctx, pick(sku.promo), 2, 52, TAG_W - 4, 11, { family: 'kanit', weight: 700, size: 11, color: '#c00' }); }
      ctx.restore();
    });
  }
  // add a tag quad. (x,y,z) = bottom-left corner in the tag's plane; dirX = unit vector along +x of the tag; normal facing given by nrm
  add(sku, x, y, z, dirX, nrm, w = 0.064, h = 0.032, tilt = 0.25) {
    const i = this.index.get(sku.id);
    if (i === undefined) return;
    const u0 = ((i % COLS) * TAG_W) / ATLAS_W, u1 = u0 + TAG_W / ATLAS_W;
    const v1 = 1 - (Math.floor(i / COLS) * TAG_H) / this.H, v0 = v1 - TAG_H / this.H;
    const base = this.positions.length / 3;
    // tilt the tag back slightly so it faces up-out like a real shelf strip
    const up = new THREE.Vector3(0, 1, 0);
    const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    const upT = new THREE.Vector3(0, cosT, 0).addScaledVector(nrm, -sinT);
    const p0 = new THREE.Vector3(x, y, z);
    const p1 = p0.clone().addScaledVector(dirX, w);
    const p2 = p1.clone().addScaledVector(upT, h);
    const p3 = p0.clone().addScaledVector(upT, h);
    for (const p of [p0, p1, p2, p3]) this.positions.push(p.x, p.y, p.z);
    this.uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  build(parent) {
    if (!this.positions.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    g.setIndex(this.indices);
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, this.material);
    m.name = 'priceTags';
    parent.add(m);
    this.mesh = m;
  }
}

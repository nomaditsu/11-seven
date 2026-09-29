// First-person hands layer: held basket with visible items, flying pick-ups and the inspected pack.
// Rendered as a second pass with cleared depth so it never clips into the world.
import * as THREE from 'three';
import { ENV } from '../world/materials.js';
import { S } from './session.js';
import { getGeometry } from '../world/productGeo.js';
import { itemSize } from '../world/products.js';
import { makeInspectTexture } from '../gfx/packaging.js';
import { GEO } from '../data/shapes.js';
import { BRAND } from '../gfx/logo11seven.js';
import { rng, hashStr, damp, clamp, lerp } from '../core/util.js';

const ease = (t) => 1 - Math.pow(1 - t, 3);

export class Hands {
  constructor(camera, pw) {
    this.camera = camera; this.pw = pw;
    this.scene = new THREE.Scene();
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(0.5, 1, 0.8); this.scene.add(key);
    this.fill = new THREE.DirectionalLight(0xbcd4ff, 0.7); this.fill.position.set(-1, 0.2, 0.5); this.scene.add(this.fill);

    this.basket = this.makeBasket();
    this.basket.visible = false;
    this.root.add(this.basket);
    this.basketItems = new THREE.Group(); this.basket.add(this.basketItems);
    this.handItems = new THREE.Group(); this.handItems.position.set(0.3, -0.24, -0.5); this.root.add(this.handItems);
    this.flies = [];
    this.inspect = null;
    this.bob = 0;
    this.basketTarget = new THREE.Vector3(0.28, -0.24, -0.6);
    this.matCache = new Map();
    this.dim = 0;   // 0..1 world dimming while inspecting
  }

  makeBasket() {
    const g = new THREE.Group();
    const orange = new THREE.MeshStandardMaterial({ color: BRAND.orange, roughness: 0.45, envMap: ENV.inTex, envMapIntensity: 0.8 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x232326, roughness: 0.6 });
    const add = (w, h, d, x, y, z, m = orange) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); g.add(me); return me; };
    const W = 0.46, H = 0.2, D = 0.3;
    add(W, 0.02, D, 0, 0, 0);                 // floor
    add(W, H, 0.02, 0, H / 2, D / 2);           // walls
    add(W, H, 0.02, 0, H / 2, -D / 2);
    add(0.02, H, D, W / 2, H / 2, 0);
    add(0.02, H, D, -W / 2, H / 2, 0);
    add(W + 0.03, 0.02, 0.03, 0, H, D / 2); add(W + 0.03, 0.02, 0.03, 0, H, -D / 2);       // rims
    add(0.03, 0.02, D + 0.03, W / 2, H, 0); add(0.03, 0.02, D + 0.03, -W / 2, H, 0);
    // stripes
    const green = new THREE.MeshStandardMaterial({ color: BRAND.green, roughness: 0.5 }), red = new THREE.MeshStandardMaterial({ color: BRAND.red, roughness: 0.5 });
    add(W + 0.004, 0.02, 0.004, 0, 0.11, D / 2 + 0.011, green); add(W + 0.004, 0.02, 0.004, 0, 0.09, D / 2 + 0.011, red);
    // handle
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.011, 8, 24, Math.PI), dark);
    arc.position.set(0, H, 0); arc.rotation.y = Math.PI / 2; g.add(arc);
    g.rotation.set(0.12, -0.42, 0.04);
    g.position.set(0.3, -0.34, -0.66);
    g.userData.base = g.position.clone();
    return g;
  }

  material(sku) {
    let m = this.pw.skuMat.get(sku.id);
    if (!m) m = this.pw.materialFor(sku);
    return m;
  }

  itemMesh(sku, scale = 1) {
    const me = new THREE.Mesh(getGeometry(sku.g), this.material(sku));
    me.scale.setScalar(scale);
    return me;
  }

  // rebuild the visible contents of the basket / hands
  refresh() {
    const clear = (grp) => { while (grp.children.length) grp.remove(grp.children[0]); };
    clear(this.basketItems); clear(this.handItems);
    this.basket.visible = S.hasBasket;
    const list = [];
    for (const e of S.items) for (let i = 0; i < Math.min(e.qty, 6); i++) list.push(e.sku);
    if (S.hasBasket) {
      const r = rng(7);
      list.slice(-16).forEach((sku, i) => {
        const sz = itemSize(sku);
        const me = this.itemMesh(sku, 0.9);
        const col = i % 4, row = Math.floor(i / 4) % 3;
        me.position.set(-0.17 + col * 0.11 + (r() - 0.5) * 0.02, 0.012 + Math.floor(i / 12) * 0.05, -0.09 + row * 0.09 + (r() - 0.5) * 0.02);
        const tall = sz.h > 0.16;
        if (tall) { me.rotation.z = (r() > 0.5 ? 1 : -1) * (1.3 + r() * 0.2); me.position.y = 0.03; me.position.x -= 0.03; }
        me.rotation.y = (r() - 0.5) * 1.2;
        this.basketItems.add(me);
      });
    } else {
      list.slice(-3).forEach((sku, i) => {
        const me = this.itemMesh(sku, 1);
        me.position.set(-i * 0.09, -0.06 + i * 0.03, -i * 0.04);
        me.rotation.set(-0.3, 0.5 + i * 0.3, 0.1);
        this.handItems.add(me);
      });
    }
  }

  // world position -> fly into the basket
  flyFrom(sku, worldPos) {
    const me = this.itemMesh(sku, 1);
    const local = this.root.worldToLocal(worldPos.clone());
    me.position.copy(local);
    this.root.add(me);
    this.flies.push({ me, from: local.clone(), t: 0, dur: 0.34 });
  }
  flyTo(sku, worldPos) { // returns item to the shelf visually (reverse)
    const me = this.itemMesh(sku, 1);
    const local = this.root.worldToLocal(worldPos.clone());
    me.position.copy(this.basketTarget);
    this.root.add(me);
    this.flies.push({ me, from: this.basketTarget.clone(), to: local, t: 0, dur: 0.3, rev: true });
  }

  // ------------------------------------------------------------------ inspect
  beginInspect(sku) {
    this.endInspect();
    const tex = makeInspectTexture(sku); tex.priority = true;
    const mat = new THREE.MeshStandardMaterial({ map: tex.texture, roughness: this.material(sku).roughness, metalness: this.material(sku).metalness, envMap: ENV.inTex, envMapIntensity: 1.1 });
    const me = new THREE.Mesh(getGeometry(sku.g), mat);
    const sz = itemSize(sku);
    const big = Math.max(sz.w, sz.h, sz.d);
    const k = clamp(0.3 / big, 1, 3.2);
    me.scale.setScalar(k);
    const holder = new THREE.Group();
    me.position.y = -sz.h * k / 2;
    holder.add(me);
    holder.position.set(-0.1, 0.0, -0.52);
    holder.rotation.set(0.05, GEO[sku.g].kind === 'wrap' ? 0 : -0.25, 0);
    this.root.add(holder);
    this.inspect = { sku, holder, me, tex, mat, yaw: holder.rotation.y, pitch: 0.05, tyaw: holder.rotation.y, tpitch: 0.05, dist: 0.52, k, t: 0 };
    return this.inspect;
  }
  flip() { if (this.inspect) this.inspect.tyaw += Math.PI; }
  endInspect() {
    if (!this.inspect) return;
    this.root.remove(this.inspect.holder);
    this.inspect.mat.dispose(); this.inspect.tex.dispose();
    this.inspect = null;
  }

  update(dt, moving, mouse) {
    // sync root with the camera
    this.camera.updateMatrixWorld();
    this.root.position.copy(this.camera.position);
    this.root.quaternion.copy(this.camera.quaternion);
    this.root.updateMatrixWorld(true);
    this.camera.getWorldPosition(this.root.position);
    this.camera.getWorldQuaternion(this.root.quaternion);
    // gentle sway
    this.bob += dt * (2 + moving * 6);
    const b = this.basket;
    if (b.visible) {
      b.position.x = b.userData.base.x + Math.sin(this.bob) * 0.004 * (0.5 + moving);
      b.position.y = b.userData.base.y + Math.abs(Math.cos(this.bob)) * 0.006 * (0.4 + moving);
    }
    // flying items
    for (let i = this.flies.length - 1; i >= 0; i--) {
      const f = this.flies[i];
      f.t += dt / f.dur;
      const e = ease(Math.min(1, f.t));
      const to = f.to || this.basketTarget;
      f.me.position.lerpVectors(f.from, to, f.rev ? e : e);
      f.me.position.y += Math.sin(e * Math.PI) * 0.07;
      f.me.scale.setScalar(f.rev ? lerp(0.8, 1, e) : lerp(1, 0.75, e));
      f.me.rotation.y += dt * 6;
      if (f.t >= 1) { this.root.remove(f.me); this.flies.splice(i, 1); if (!f.rev) this.refresh(); }
    }
    // inspect item
    const ins = this.inspect;
    if (ins) {
      ins.t += dt;
      if (mouse) { ins.tyaw += mouse[0] * 0.006; ins.tpitch = clamp(ins.tpitch + mouse[1] * 0.005, -1.2, 1.2); }
      ins.yaw = damp(ins.yaw, ins.tyaw, 14, dt); ins.pitch = damp(ins.pitch, ins.tpitch, 14, dt);
      ins.holder.rotation.set(ins.pitch, ins.yaw, 0, 'XYZ');
      ins.holder.rotation.order = 'XYZ';
      const appear = ease(clamp(ins.t / 0.25, 0, 1));
      ins.holder.position.z = -ins.dist + (1 - appear) * 0.25;
      ins.holder.scale.setScalar(0.4 + 0.6 * appear);
    }
    this.dim = damp(this.dim, ins ? 1 : 0, 10, dt);
  }

  wheel(dir) { if (this.inspect) this.inspect.dist = clamp(this.inspect.dist + dir * 0.04, 0.28, 0.9); }
}

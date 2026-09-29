// Low-poly Bangkok vehicles (motorbikes with riders, taxis, tuk-tuks) and the passing-traffic system.
import * as THREE from 'three';
import { bakeStatic } from './bake.js';
import { Kit } from './kit.js';
import { std, basic, M } from './materials.js';
import { L } from './layout.js';
import { rng } from '../core/util.js';

const mats = {};
function m(key, params, out = true) { return mats[key] || (mats[key] = std(params, { out, env: 0.9 })); }
const glassMat = () => mats.glass || (mats.glass = std({ color: 0x1b2c3a, roughness: 0.08, metalness: 0.6 }, { out: true, env: 1.4 }));
const tyre = () => m('tyre', { color: 0x141414, roughness: 0.9 });
const chromeM = () => m('chr', { color: 0xc9ccd0, roughness: 0.25, metalness: 0.95 });
const darkM = () => m('dark', { color: 0x222428, roughness: 0.6, metalness: 0.3 });
const head = () => mats.head || (mats.head = basic(new THREE.Color(2.6, 2.5, 2.0)));
const tail = () => mats.tail || (mats.tail = basic(new THREE.Color(2.2, 0.15, 0.1)));
const paint = (hex, rough = 0.35, metal = 0.5) => m('p' + hex, { color: hex, roughness: rough, metalness: metal });
const RIDER_SHIRTS = [0x2a6fd0, 0xd0342c, 0x1f8f4a, 0xf2b81b, 0x222222, 0xe0e0e0, 0x8a3fb0, 0xf58220];
const HELMETS = [0xe31e24, 0x111111, 0xf2f2f2, 0x1f6fd0, 0xf5c400, 0x2a9d4a];

// wheel centred at (x, r, z) with its axle along z
function wheel(k, mat, x, z, r, w) { k.cyl(mat, x, r - w / 2, z, r, r, w, { rx: Math.PI / 2, seg: 14 }); }

// x = forward, y = up, z = right (the vehicle drives along +x)
export function makeMotorbike(color = 0xd8232a, o = {}) {
  const g = new THREE.Group(), k = new Kit('bike');
  const body = paint(color), dk = darkM(), ty = tyre(), ch = chromeM();
  wheel(k, ty, 0.62, 0, 0.27, 0.09); wheel(k, ty, -0.55, 0, 0.27, 0.12);
  wheel(k, ch, 0.62, 0, 0.12, 0.094); wheel(k, ch, -0.55, 0, 0.12, 0.124);
  k.box(body, -0.55, 0.26, -0.15, 0.4, 0.34, 0.15);                        // floorboard
  k.box(body, 0.32, 0.34, -0.17, 0.62, 0.98, 0.17);                        // front cowl / leg shield
  k.box(body, -0.72, 0.4, -0.16, -0.05, 0.72, 0.16);                       // rear body
  k.box(dk, -0.62, 0.7, -0.14, -0.02, 0.77, 0.14);                         // seat
  k.box(dk, 0.36, 0.98, -0.3, 0.42, 1.03, 0.3);                            // handlebar
  k.box(head(), 0.6, 0.78, -0.09, 0.66, 0.9, 0.09);                        // headlight
  k.box(tail(), -0.78, 0.6, -0.1, -0.72, 0.68, 0.1);                       // tail light
  k.box(paint(0xf2f2f2, 0.6, 0), -0.8, 0.42, -0.08, -0.76, 0.52, 0.08);   // plate
  k.cyl(ch, -0.7, 0.28, 0.2, 0.035, 0.03, 0.4, { rz: Math.PI / 2 - 0.05, seg: 8 });   // exhaust
  k.box(dk, 0.28, 0.98, -0.34, 0.31, 1.15, -0.32); k.box(dk, 0.28, 0.98, 0.32, 0.31, 1.15, 0.34);     // mirrors
  // front fork
  k.box(ch, 0.6, 0.27, -0.06, 0.63, 0.86, -0.04); k.box(ch, 0.6, 0.27, 0.04, 0.63, 0.86, 0.06);
  k.build(g, { cast: true, receive: false });
  if (o.rider !== false) {
    const r = rng((color * 31) >>> 0);
    const rk = new Kit('rider');
    const shirt = paint(RIDER_SHIRTS[Math.floor(r() * RIDER_SHIRTS.length)], 0.8, 0), skin = m('skin', { color: 0xc98f62, roughness: 0.8 });
    const pants = paint(0x2a3140, 0.9, 0), helm = paint(HELMETS[Math.floor(r() * HELMETS.length)], 0.3, 0.2);
    rk.box(shirt, -0.32, 0.78, -0.18, -0.06, 1.34, 0.18);                                   // torso
    rk.box(pants, -0.3, 0.6, -0.17, 0.2, 0.8, -0.03); rk.box(pants, -0.3, 0.6, 0.03, 0.2, 0.8, 0.17);    // thighs
    rk.box(pants, 0.16, 0.3, -0.16, 0.26, 0.72, -0.04); rk.box(pants, 0.16, 0.3, 0.04, 0.26, 0.72, 0.16);  // shins
    rk.box(shirt, -0.1, 1.05, -0.3, 0.38, 1.2, -0.2); rk.box(shirt, -0.1, 1.05, 0.2, 0.38, 1.2, 0.3);    // arms to handlebar
    rk.build(g, { cast: true, receive: false });
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), skin); hd.position.set(-0.17, 1.46, 0);
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), helm); hm.position.set(-0.17, 1.49, 0);
    g.add(hd, hm);
    if (o.pillion || r() > 0.7) {
      const pk = new Kit('pillion');
      const sh2 = paint(RIDER_SHIRTS[Math.floor(r() * RIDER_SHIRTS.length)], 0.8, 0);
      pk.box(sh2, -0.62, 0.76, -0.16, -0.36, 1.28, 0.16); pk.box(pants, -0.62, 0.6, -0.15, -0.2, 0.78, -0.02); pk.box(pants, -0.62, 0.6, 0.02, -0.2, 0.78, 0.15);
      pk.build(g, { cast: true, receive: false });
      const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), skin); h2.position.set(-0.5, 1.4, 0); g.add(h2);
    }
    if (o.box) { // delivery box
      const bk = new Kit('box'); bk.box(paint(o.box, 0.6, 0), -0.98, 0.72, -0.24, -0.6, 1.2, 0.24); bk.build(g, { cast: true, receive: false });
    }
  }
  g.userData.type = 'bike';
  return g;
}

export function makeTaxi(color = 0xff6fae) {
  const g = new THREE.Group(), k = new Kit('taxi');
  const body = paint(color, 0.3, 0.4), dk = darkM(), ty = tyre(), gl = glassMat();
  k.box(body, -2.15, 0.28, -0.85, 2.2, 0.8, 0.85);                  // lower body
  k.box(body, 1.4, 0.7, -0.83, 2.15, 0.85, 0.83);                    // hood
  k.box(body, -2.1, 0.7, -0.83, -1.6, 0.9, 0.83);                    // boot lid
  k.box(body, -1.65, 0.8, -0.8, 0.95, 1.38, 0.8);                    // cabin
  k.box(gl, -1.62, 0.86, -0.82, 0.92, 1.3, 0.82);                    // glass ring
  k.box(body, -1.64, 1.36, -0.78, 0.94, 1.42, 0.78);                 // roof
  k.box(dk, 2.15, 0.3, -0.8, 2.25, 0.6, 0.8); k.box(dk, -2.2, 0.3, -0.8, -2.1, 0.55, 0.8);  // bumpers
  k.box(head(), 2.15, 0.62, -0.7, 2.22, 0.74, -0.42); k.box(head(), 2.15, 0.62, 0.42, 2.22, 0.74, 0.7);
  k.box(tail(), -2.2, 0.6, -0.72, -2.14, 0.72, -0.4); k.box(tail(), -2.2, 0.6, 0.4, -2.14, 0.72, 0.72);
  for (const [x, z] of [[1.35, -0.85], [1.35, 0.85], [-1.3, -0.85], [-1.3, 0.85]]) {
    wheel(k, ty, x, z, 0.32, 0.22); wheel(k, chromeM(), x, z, 0.17, 0.24);
  }
  k.box(m('taxisign', { color: 0xffe24a, roughness: 0.4 }), -0.5, 1.42, -0.28, 0.1, 1.62, 0.28);            // roof sign
  k.box(basic(new THREE.Color(0.4, 2.4, 0.5)), -0.5, 1.5, 0.28, 0.1, 1.56, 0.29);                            // "vacant" light
  k.box(paint(0xf5f5f5, 0.6, 0), -2.22, 0.36, -0.22, -2.2, 0.5, 0.22);                                        // plate
  k.build(g, { cast: true, receive: false });
  g.userData.type = 'taxi';
  return g;
}

export function makeTukTuk(color = 0x1fa85a) {
  const g = new THREE.Group(), k = new Kit('tuk');
  const body = paint(color, 0.35, 0.3), yellow = paint(0xffcc1a, 0.4, 0.1), dk = darkM(), ty = tyre();
  k.box(body, -1.05, 0.32, -0.6, 0.85, 0.72, 0.6);
  k.box(body, 0.55, 0.72, -0.5, 0.95, 1.08, 0.5);                    // dash
  k.box(dk, -0.95, 0.72, -0.55, -0.25, 0.9, 0.55);                   // rear seat
  k.box(yellow, -1.1, 1.6, -0.66, 0.45, 1.68, 0.66);                 // canopy roof
  k.box(body, 0.42, 1.08, -0.06, 0.48, 1.6, 0.06);                   // pillars
  for (const z of [-0.58, 0.58]) { k.box(dk, -1.05, 0.9, z, -1.0, 1.6, z + 0.03 * Math.sign(z)); k.box(dk, 0.4, 1.0, z, 0.46, 1.6, z + 0.03 * Math.sign(z)); }
  k.box(dk, 0.42, 1.08, -0.5, 0.5, 1.12, 0.5);
  k.box(head(), 1.05, 0.62, -0.14, 1.1, 0.74, 0.14);
  k.box(tail(), -1.1, 0.55, -0.5, -1.06, 0.65, -0.3); k.box(tail(), -1.1, 0.55, 0.3, -1.06, 0.65, 0.5);
  wheel(k, ty, 0.92, 0, 0.27, 0.12); wheel(k, ty, -0.6, -0.62, 0.27, 0.13); wheel(k, ty, -0.6, 0.62, 0.27, 0.13);
  k.build(g, { cast: true, receive: false });
  g.userData.type = 'tuktuk';
  return g;
}

export function makeBus(color = 0xe31e24) {
  const g = new THREE.Group(), k = new Kit('bus');
  const body = paint(color, 0.35, 0.3), white = paint(0xf2f2f2, 0.4, 0.1), gl = glassMat(), ty = tyre();
  k.box(body, -5, 0.4, -1.2, 5, 1.2, 1.2); k.box(white, -5, 1.2, -1.2, 5, 2.6, 1.2); k.box(gl, -4.9, 1.45, -1.21, 4.7, 2.3, 1.21);
  k.box(body, -5, 2.6, -1.2, 5, 2.75, 1.2);
  for (const x of [-3.4, 3.2]) for (const z of [-1.1, 1.1]) wheel(k, ty, x, z, 0.5, 0.28);
  k.box(head(), 5.0, 0.7, -0.9, 5.05, 0.9, -0.6); k.box(head(), 5.0, 0.7, 0.6, 5.05, 0.9, 0.9);
  k.build(g, { cast: true, receive: false });
  g.userData.type = 'bus';
  return g;
}

// -------------------------------------------------------------------------------------- passing traffic
export class Traffic {
  constructor(scene, quality) {
    this.group = new THREE.Group(); scene.add(this.group);
    this.cars = [];
    this.rand = rng(2024);
    const n = quality.traffic;
    const lanes = [{ z: 7.1, dir: 1 }, { z: 8.4, dir: 1 }, { z: 11.0, dir: -1 }, { z: 12.3, dir: -1 }];
    for (let i = 0; i < n; i++) {
      const lane = lanes[i % lanes.length];
      this.spawn(lane, -70 + this.rand() * 140);
    }
    this.lanes = lanes;
    this.list = [];
  }
  make() {
    const v = this.make0(); bakeStatic(v); return v;
  }
  make0() {
    const r = this.rand(), c = [0xff6fae, 0x7fd400, 0x2f7de1, 0xe34234, 0xff9a1f, 0xa855f7];
    if (r < 0.5) return makeMotorbike([0xd8232a, 0x1f6fd0, 0x222428, 0xf2f2f2, 0xf58220, 0x2a9d4a][Math.floor(this.rand() * 6)], { box: this.rand() > 0.75 ? [0x1fa85a, 0xff5ea0, 0xd0342c][Math.floor(this.rand() * 3)] : null, pillion: this.rand() > 0.75 });
    if (r < 0.8) return makeTaxi(c[Math.floor(this.rand() * c.length)]);
    if (r < 0.93) return makeTukTuk([0x1fa85a, 0xe31e24, 0x2f7de1, 0xffa41a][Math.floor(this.rand() * 4)]);
    return makeBus();
  }
  spawn(lane, x) {
    const v = this.make();
    const type = v.userData.type;
    const speed = (type === 'bike' ? 8 + this.rand() * 5 : type === 'tuktuk' ? 5 + this.rand() * 2 : type === 'bus' ? 6 + this.rand() * 2 : 7 + this.rand() * 3);
    v.position.set(x, L.road.y, lane.z + (type === 'bike' ? (this.rand() - 0.5) * 0.9 : 0));
    v.rotation.y = lane.dir > 0 ? 0 : Math.PI;       // model drives along +x
    this.group.add(v);
    this.cars.push({ v, lane, speed: speed * lane.dir, type });
  }
  update(dt, playerX) {
    const out = [];
    for (const c of this.cars) {
      c.v.position.x += c.speed * dt;
      if (c.speed > 0 && c.v.position.x > 90) this.respawn(c, -90);
      else if (c.speed < 0 && c.v.position.x < -90) this.respawn(c, 90);
      out.push({ x: c.v.position.x, z: c.v.position.z, vx: c.speed, type: c.type });
    }
    this.list = out;
    return out;
  }
  respawn(c, x) {
    this.group.remove(c.v);
    this.cars.splice(this.cars.indexOf(c), 1);
    this.spawn(c.lane, x + (this.rand() - 0.5) * 40);
  }
}

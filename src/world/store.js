// Store shell: floor, ceiling, walls, glass storefront and the automatic sliding doors.
import * as THREE from 'three';
import { M, std, basic } from './materials.js';
import { Kit } from './kit.js';
import { L } from './layout.js';
import { addCollider } from './colliders.js';
import { BRAND } from '../gfx/logo11seven.js';
import { frostedBand, blobShadow } from '../gfx/surfaces.js';
import { clamp, damp } from '../core/util.js';

export class Store {
  constructor(scene, quality) {
    this.scene = scene; this.quality = quality;
    this.group = new THREE.Group(); this.group.name = 'store';
    scene.add(this.group);
    this.door = { open: 0, target: 0, leafL: null, leafR: null, sensorCooldown: 0, closedFor: 99 };
    this.onDoorOpen = null;   // called each time the doors start opening (chime + staff greeting)
    this.lights = [];
    this.ceilingY = L.H;
    this.doorCollider = null;
    this.acLeds = [];
  }

  build() {
    this.buildShell();
    this.buildCeiling();
    this.buildFront();
    this.buildDoors();
    this.buildInteriorLights();
  }

  // ----------------------------------------------------------------------------------- shell
  buildShell() {
    const k = new Kit('shell');
    const { x0, x1, zB, H } = { x0: L.x0, x1: L.x1, zB: L.zB, H: L.H };
    const W = x1 - x0, D = -zB;
    // floor (tile texture covers 1.2 m)
    k.plane(M.floor, W, D, 0, 0, zB / 2, { rx: -Math.PI / 2, tile: 1.2 });
    // interior walls (thick boxes; only inward faces are ever seen)
    const th = L.wall, top = 4.4;
    k.box(M.wall, x0 - th, 0, zB - th, x0, top, 0.1, { tile: 1, solid: 'wall' });               // left
    k.box(M.wall, x1, 0, zB - th, x1 + th, top, 0.1, { tile: 1, solid: 'wall' });               // right
    k.box(M.wall, x0 - th, 0, zB - th, x1 + th, top, zB, { tile: 1, solid: 'wall' });           // back
    // skirting
    k.box(M.darkGrey, x0, 0, zB, x0 + 0.02, 0.1, 0, { tile: 1 });
    k.box(M.darkGrey, x1 - 0.02, 0, zB, x1, 0.1, 0, { tile: 1 });
    k.box(M.darkGrey, x0, 0, zB, x1, 0.1, zB + 0.02, { tile: 1 });
    // signature ribbon: orange / green / red bands at the top of the walls
    const bands = [[BRAND.orange, M.orange], [BRAND.green, M.green], [BRAND.red, M.red]];
    bands.forEach(([, m], i) => {
      const y1 = 2.9 - i * 0.07, y0 = y1 - 0.07;
      k.box(m, x0, y0, zB, x0 + 0.012, y1, -0.3);
      k.box(m, x1 - 0.012, y0, zB, x1, y1, -0.3);
      k.box(m, x0, y0, zB, x1, y1, zB + 0.012);
    });
    // soffit above the glass front (interior side)
    k.box(M.white, x0, L.glassTop, -0.32, x1, H, 0, { tile: 1 });
    // ceiling slab above the tiles (blocks sun / gives shadow-casting roof)
    k.box(M.concreteGrey, x0 - th, H + 0.05, zB - th, x1 + th, H + 0.65, 0.3, { tile: 2 });
    // front wall collider pieces (door gap handled separately)
    addCollider(x0 - th, -0.12, L.door.x0, 0.08, 'glass');
    addCollider(L.door.x1, -0.12, x1 + th, 0.08, 'glass');
    k.build(this.group);
  }

  buildCeiling() {
    const k = new Kit('ceiling');
    const W = L.x1 - L.x0, D = -L.zB;
    k.plane(M.ceiling, W, D, 0, L.H, L.zB / 2, { rx: Math.PI / 2, tile: 1.2 });
    // AC cassettes
    const cass = std({ color: 0xf1f1ee, roughness: 0.5 });
    const slat = std({ color: 0xd8d9db, roughness: 0.4 });
    const grid = [[-3.2, -2.5], [2.4, -1.0], [-1.0, -9.5], [3.0, -12.6], [-4.6, -12.0], [0.8, -15.2]];
    for (const [x, z] of grid) {
      k.box(cass, x - 0.45, L.H - 0.06, z - 0.45, x + 0.45, L.H, z + 0.45);
      k.box(slat, x - 0.38, L.H - 0.075, z - 0.38, x + 0.38, L.H - 0.06, z + 0.38);
      k.box(M.darkGrey, x - 0.1, L.H - 0.085, z - 0.1, x + 0.1, L.H - 0.075, z + 0.1);
    }
    // sprinkler heads + smoke detectors
    const brass = std({ color: 0xc8a24a, metalness: 0.8, roughness: 0.35 });
    for (let i = 0; i < 12; i++) {
      const x = -5 + (i % 4) * 3.3, z = -2 - Math.floor(i / 4) * 5.4;
      k.cyl(brass, x, L.H - 0.06, z, 0.018, 0.018, 0.06);
      k.cyl(M.white, x + 0.7, L.H - 0.045, z + 0.6, 0.06, 0.06, 0.045, { seg: 12 });
    }
    // CCTV domes
    const dome = new THREE.SphereGeometry(0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const smoke = std({ color: 0x1b1c1f, roughness: 0.1, metalness: 0.5 });
    for (const [x, z] of [[-5.9, -1.0], [5.9, -8.4], [-5.9, -15.8], [5.9, -15.8], [1.3, -6.0]]) {
      k.cyl(M.white, x, L.H - 0.05, z, 0.11, 0.11, 0.05, { seg: 12 });
      k.geo(smoke, dome, x, L.H - 0.05, z, { rx: Math.PI });
    }
    k.build(this.group, { cast: false });
  }

  // ----------------------------------------------------------------------------------- front glass
  buildFront() {
    const k = new Kit('front');
    const x0 = L.x0 - L.wall, x1 = L.x1 + L.wall, gt = L.glassTop;
    // frame: transom, kickplate and mullions
    const alu = std({ color: 0x3a3d42, roughness: 0.35, metalness: 0.8 });
    k.box(alu, x0, gt - 0.08, -0.06, x1, gt, 0.06);
    k.box(alu, x0, 0, -0.06, x1, 0.14, 0.06);
    const cuts = [L.x0, -4.7, -3.0, L.door.x0, L.door.x1, 3.0, 4.7, L.x1];
    for (const cx of cuts) k.box(alu, cx - 0.04, 0, -0.06, cx + 0.04, gt, 0.06);
    // fixed glass panes
    const panes = [[L.x0, -4.7], [-4.7, -3.0], [-3.0, L.door.x0], [L.door.x1, 3.0], [3.0, 4.7], [4.7, L.x1]];
    for (const [a, b] of panes) k.plane(M.glass, b - a - 0.08, gt - 0.22, (a + b) / 2, (gt + 0.14) / 2 - 0.04, 0, {});
    // fascia panel above the glass (interior side is the soffit; exterior in exterior.js)
    k.build(this.group, { cast: false });

    // frosted safety band across the glass
    const band = new THREE.Mesh(new THREE.PlaneGeometry(L.x1 - L.x0, 0.3), new THREE.MeshBasicMaterial({ map: frostedBand(), transparent: true, depthWrite: false }));
    band.material.map.repeat.set(24, 1);
    band.position.set(0, 1.28, 0.012);
    // no band across the door opening: three separate strips
    const mkBand = (a, b) => {
      const m = band.clone(); m.geometry = new THREE.PlaneGeometry(b - a, 0.3);
      m.material = new THREE.MeshBasicMaterial({ map: frostedBand(), transparent: true, depthWrite: false });
      m.material.map.repeat.set((b - a) * 2, 1); m.position.set((a + b) / 2, 1.28, 0.012); this.group.add(m);
    };
    mkBand(L.x0, L.door.x0 - 0.05); mkBand(L.door.x1 + 0.05, L.x1);
  }

  buildDoors() {
    const alu = std({ color: 0x53575d, roughness: 0.3, metalness: 0.85 });
    const mkLeaf = (side) => {
      const g = new THREE.Group();
      const w = (L.door.x1 - L.door.x0) / 2 + 0.03, h = L.glassTop - 0.16;
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), M.glass);
      glass.position.set(0, h / 2 + 0.06, 0);
      g.add(glass);
      const fr = (ww, hh, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, 0.07), alu); m.position.set(x, y, 0); m.castShadow = true; g.add(m); };
      fr(w, 0.09, 0, h + 0.06 - 0.045); fr(w, 0.16, 0, 0.14); fr(0.06, h, -w / 2 + 0.03, h / 2 + 0.06); fr(0.06, h, w / 2 - 0.03, h / 2 + 0.06);
      // vertical pull handle on the inner edge
      const hx = side < 0 ? w / 2 - 0.07 : -w / 2 + 0.07;
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.62, 8), M.chrome);
      handle.position.set(hx, 1.05, 0.06); g.add(handle);
      // frosted band on the leaf
      const fb = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, 0.3), new THREE.MeshBasicMaterial({ map: frostedBand(), transparent: true, depthWrite: false }));
      fb.material.map.repeat.set(3, 1); fb.position.set(0, 1.28 - 0.0, 0.045); g.add(fb);
      return g;
    };
    this.door.leafL = mkLeaf(-1); this.door.leafR = mkLeaf(1);
    const cxL = (L.door.x0 + 0) / 2, cxR = (L.door.x1 + 0) / 2;
    this.door.leafL.position.set(cxL - 0.015, 0, -0.1);
    this.door.leafR.position.set(cxR + 0.015, 0, -0.1);
    this.door.baseL = this.door.leafL.position.x; this.door.baseR = this.door.leafR.position.x;
    this.group.add(this.door.leafL, this.door.leafR);
    // sensor + track above the door
    const k = new Kit('doorTrack');
    k.box(M.black, -0.25, L.glassTop - 0.24, -0.2, 0.25, L.glassTop - 0.105, -0.145);   // sensor: in front of the leaves, not through them
    k.box(alu, L.door.x0 - 0.02, L.glassTop - 0.1, -0.14, L.door.x1 + 0.02, L.glassTop - 0.02, -0.02);
    k.box(M.rubber, L.door.x0, 0, -0.4, L.door.x1, 0.012, 0.75, { skip: ['-y'] });
    k.build(this.group, { cast: false });
    this.doorCollider = addCollider(L.door.x0, -0.1, L.door.x1, 0.06, 'door');
  }

  // ----------------------------------------------------------------------------------- interior lighting
  buildInteriorLights() {
    // emissive LED linear fixtures over the aisles + panels near the entrance
    const mkStrip = [];
    const xs = [-4.7, -2.25, 0.25, 2.8, 5.1];
    const zsA = [-1.2, -3.6, -6.0, -8.4, -10.8, -13.2, -15.6];
    const k = new Kit('leds');
    const housing = std({ color: 0xe8e8e5, roughness: 0.4 });
    for (const x of xs) for (const z of zsA) {
      k.box(housing, x - 0.1, L.H - 0.045, z - 0.62, x + 0.1, L.H, z + 0.62);
      k.box(M.ledWhite, x - 0.085, L.H - 0.05, z - 0.6, x + 0.085, L.H - 0.045, z + 0.6);
    }
    // entrance panels
    for (const x of [-4.2, -1.9, 1.9, 4.2]) for (const z of [-0.9]) {
      k.box(housing, x - 0.32, L.H - 0.04, z - 0.32, x + 0.32, L.H, z + 0.32);
      k.box(M.ledWhite, x - 0.29, L.H - 0.045, z - 0.29, x + 0.29, L.H - 0.04, z + 0.29);
    }
    k.build(this.group, { cast: false });

    // A handful of real lights for glints & warm accents (kept low: image-based lighting does the heavy lifting)
    const n = this.quality.lights;
    const spots = [[-2.2, -3.5], [2.4, -3.0], [0.2, -8.5], [-4.5, -9.5], [3.6, -12.0], [0, -15], [-4.0, -14.8], [5.2, -6.0], [-2.5, -11], [1.2, -12.5], [-5, -3], [3, -8]];
    for (let i = 0; i < Math.min(n, spots.length); i++) {
      const l = new THREE.PointLight(0xfff5e6, 3.0, 9, 1.6);
      l.position.set(spots[i][0], L.H - 0.4, spots[i][1]);
      this.group.add(l); this.lights.push(l);
    }
  }

  // ----------------------------------------------------------------------------------- per frame
  update(dt, px, pz) {
    const d = this.door;
    // sensor: player near the doorway (either side)
    const dx = px - 0, near = Math.abs(dx) < 2.6 && pz > -2.6 && pz < 3.0;
    // a fresh opening = sensor trips after the doors were shut for a moment (no repeats while you hover at the edge)
    if (near && !d.target && d.open < 0.05 && d.closedFor > 0.4 && this.onDoorOpen) this.onDoorOpen();
    d.closedFor = d.open < 0.05 ? d.closedFor + dt : 0;
    d.target = near ? 1 : 0;
    d.open = damp(d.open, d.target, near ? 5.5 : 2.2, dt);
    if (Math.abs(d.open - d.target) < 0.002) d.open = d.target;
    const slide = d.open * 1.25;
    d.leafL.position.x = d.baseL - slide;
    d.leafR.position.x = d.baseR + slide;
    // door leaves slide behind the fixed glass
    this.doorCollider.on = d.open < 0.7;
  }
}

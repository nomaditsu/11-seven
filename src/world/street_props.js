// Street furniture that makes the soi feel like Bangkok: tangled power lines, parked motorbikes, ice & water machines,
// a spirit house with offerings, a grilled-pork cart with plastic stools, planters and bollards.
import * as THREE from 'three';
import { Kit } from './kit.js';
import { M, std, basic } from './materials.js';
import { L } from './layout.js';
import { makeMotorbike } from './vehicles.js';
import { makeSign } from '../gfx/localized.js';
import { langText, fitText, fillRR, circle } from '../gfx/draw.js';
import { BRAND, drawLogo, drawStripes, LOGO_W, LOGO_H } from '../gfx/logo11seven.js';
import { addCollider } from './colliders.js';
import { rng } from '../core/util.js';
import { LTex } from '../gfx/localized.js';
import { bakeStatic } from './bake.js';

export class StreetProps {
  constructor(scene, exterior) {
    this.scene = scene; this.ext = exterior;
    this.group = new THREE.Group(); this.group.name = 'streetprops'; scene.add(this.group);
    this.smoke = [];
    this.lampLights = [];
  }

  build(quality) {
    this.poles();
    this.wires();
    this.lamps(quality);
    this.parkedBikes();
    this.machines();
    this.spiritHouse();
    this.cart();
    this.planters();
    this.bollards();
    this.poleSign();
    this.soiSign();
    bakeStatic(this.group);
  }

  // -------------------------------------------------------------------- utility poles & wires
  poles() {
    const k = new Kit('poles');
    const conc = M.concreteGrey, metal = M.outMetal, dark = M.outDark;
    this.poleXs = [-14, 10.5, 34, -38];
    for (const x of this.poleXs) {
      const z = 5.2;
      k.cyl(conc, x, 0, z, 0.13, 0.19, 9.0, { seg: 8 });
      k.box(metal, x - 0.9, 8.3, z - 0.05, x + 0.9, 8.4, z + 0.05);
      k.box(metal, x - 0.7, 7.5, z - 0.05, x + 0.7, 7.58, z + 0.05);
      for (const dx of [-0.8, -0.3, 0.3, 0.8]) k.cyl(dark, x + dx, 8.4, z, 0.04, 0.04, 0.14, { seg: 6 });
      if (x === 10.5 || x === -14) {   // transformer
        k.cyl(std({ color: 0x8b9298, roughness: 0.5, metalness: 0.6 }, { out: true }), x + 0.55, 6.6, z, 0.22, 0.22, 0.6, { seg: 10 });
      }
      // bundle of comms cables clamped low on the pole
      k.box(dark, x - 0.16, 5.4, z - 0.18, x + 0.16, 5.55, z + 0.05);
    }
    k.build(this.group);
    for (const x of this.poleXs) addCollider(x - 0.2, 5.0, x + 0.2, 5.4, 'pole');
  }
  wires() {
    const r = rng(11);
    const mat = new THREE.MeshBasicMaterial({ color: 0x101012 });
    const geos = [];
    const tube = (pts, rad) => {
      const c = new THREE.CatmullRomCurve3(pts);
      geos.push(new THREE.TubeGeometry(c, 24, rad, 4, false));
    };
    const xs = this.poleXs.slice().sort((a, b) => a - b);
    // along the street
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i], b = xs[i + 1];
      for (let n = 0; n < 9; n++) {
        const y = n < 4 ? 8.35 - n * 0.02 : n < 7 ? 7.55 : 5.5 - (n - 7) * 0.08;
        const sag = 0.4 + r() * 0.7 + (n >= 7 ? 0.5 : 0);
        const dz = (r() - 0.5) * 0.5;
        const pts = [];
        for (let s = 0; s <= 6; s++) { const u = s / 6; pts.push(new THREE.Vector3(a + (b - a) * u, y - Math.sin(u * Math.PI) * sag, 5.2 + dz + (r() - 0.5) * 0.04)); }
        tube(pts, n >= 7 ? 0.03 : 0.012);
      }
    }
    // across the road to the far pole line
    for (const x of [-14, 10.5, 34]) {
      for (let n = 0; n < 5; n++) {
        const y0 = 8.3 - n * 0.05, ex = x + (r() - 0.5) * 6;
        const pts = [];
        for (let s = 0; s <= 8; s++) { const u = s / 8; pts.push(new THREE.Vector3(x + (ex - x) * u, y0 - Math.sin(u * Math.PI) * (0.7 + r() * 0.5) - u * 0.4, 5.2 + (17.2 - 5.2) * u)); }
        tube(pts, 0.012);
      }
    }
    const merged = THREE.mergeGeometries(geos, false);
    const mesh = new THREE.Mesh(merged, mat); mesh.frustumCulled = false; this.group.add(mesh);
  }

  // -------------------------------------------------------------------- lamps
  lamps(q) {
    const k = new Kit('lamps');
    const metal = M.outMetal;
    const glow = basic(new THREE.Color(3.0, 2.6, 1.9));
    this.lampXs = [-4.8, 8.6];
    for (const x of this.lampXs) {
      k.cyl(metal, x, 0, 5.05, 0.05, 0.075, 6.0, { seg: 8 });
      k.box(metal, x - 0.04, 5.9, 5.05, x + 0.04, 6.0, 3.9);                 // arm towards the sidewalk
      k.box(std({ color: 0x33363a, roughness: 0.5 }, { out: true }), x - 0.14, 5.82, 3.75, x + 0.14, 5.92, 4.2);
      k.box(glow, x - 0.11, 5.8, 3.8, x + 0.11, 5.82, 4.15);
      addCollider(x - 0.12, 4.93, x + 0.12, 5.17, 'lamp');
    }
    k.build(this.group);
    // one soft light per lamp (only lit at night)
    for (const x of this.lampXs) {
      const l = new THREE.SpotLight(0xffe2b0, 0, 17, 0.9, 0.8, 2); l.position.set(x, 5.7, 4.0); l.target.position.set(x, 0, 3.0);
      this.group.add(l, l.target);
      this.ext.lamps.push({ light: l, max: 70, glow: null });
    }
    // storefront glow spilling onto the sidewalk (additive plane, stronger at night)
    const spill = new THREE.Mesh(new THREE.PlaneGeometry(13, 5), new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.02, 2.6);   // above the 12 mm door mat
    this.group.add(spill);
    this.ext.nightMats.push({ mat: spill.material, prop: 'opacity', day: 0.02, night: 0.2 });
  }

  // -------------------------------------------------------------------- parked motorbikes (heading into the kerb, Bangkok style)
  parkedBikes() {
    const cols = [0xd8232a, 0x1f6fd0, 0xf2f2f2, 0x222428, 0xf58220, 0x2a9d4a, 0xffb400, 0xa855f7];
    const spots = [[-9.6, 2.5, 1.55], [-8.7, 2.7, 1.62], [-7.8, 2.5, 1.5], [-10.5, 2.6, 1.6], [8.4, 2.5, 1.58], [9.3, 2.6, 1.5], [10.2, 2.5, 1.63], [-11.4, 2.7, 1.57]];
    spots.forEach(([x, z, yaw], i) => {
      const b = makeMotorbike(cols[i % cols.length], { rider: false });
      b.position.set(x, 0, z); b.rotation.y = yaw + Math.PI * (i % 2 ? 0 : 0);
      b.rotation.z = 0; this.group.add(b);
      // helmet on the seat
      if (i % 3 === 0) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.65), std({ color: [0xe31e24, 0x111111, 0x1f6fd0][i % 3], roughness: 0.3 }, { out: true })); h.position.set(-0.3, 0.86, 0); b.add(h); }
      addCollider(x - 0.3, z - 0.95, x + 0.3, z + 0.95, 'bike');
    });
  }

  // -------------------------------------------------------------------- machines at the door
  machines() {
    const k = new Kit('machines');
    const blue = std({ color: 0x1e88d6, roughness: 0.4, metalness: 0.3 }, { out: true });
    const white = std({ color: 0xf2f4f6, roughness: 0.45 }, { out: true });
    const orange = std({ color: BRAND.orange, roughness: 0.4 }, { out: true });
    // ice vending machine (น้ำแข็ง)
    k.box(blue, -5.9, 0, 0.62, -4.9, 1.95, 1.25, { solid: 'machine' });
    k.box(white, -5.85, 0.35, 1.25, -4.95, 1.55, 1.27);
    k.box(M.outDark, -5.7, 0.12, 1.27, -5.1, 0.4, 1.29);
    // coin water dispenser (ตู้น้ำหยอดเหรียญ)
    k.box(white, -4.7, 0, 0.62, -3.85, 1.8, 1.2, { solid: 'machine' });
    k.box(blue, -4.703, 1.35, 0.617, -3.847, 1.803, 1.21);   // band wraps the white body, no shared faces
    k.box(M.outDark, -4.62, 0.7, 1.2, -4.3, 1.1, 1.22); k.box(M.chrome, -4.55, 0.55, 1.22, -4.5, 0.62, 1.26);
    // top-up kiosk (ตู้บุญเติม)
    k.box(orange, 3.9, 0, 0.62, 4.75, 1.85, 1.15, { solid: 'machine' });
    k.box(M.outDark, 4.0, 1.05, 1.15, 4.65, 1.6, 1.17);
    k.box(M.white, 3.95, 0.82, 1.15, 4.6, 0.95, 1.2);
    k.build(this.group);
    const mk = (w, h, px, draw, x, y, z) => { const s = makeSign(w, h, px, draw, {}); s.mesh.position.set(x, y, z); this.group.add(s.mesh); return s; };
    mk(0.9, 0.45, 220, (c, W, H) => { c.fillStyle = '#e6f6ff'; c.fillRect(0, 0, W, H); langText(c, { th: 'น้ำแข็ง', en: 'Ice' }, W * 0.05, H * 0.05, W * 0.9, H * 0.9, { family: 'mitr', weight: 700, size: H * 0.8, color: '#0a5aa0', lines: 1, lines2: 1, split: 0.62 }); }, -5.4, 1.72, 1.255);
    mk(0.62, 0.3, 220, (c, W, H) => { c.fillStyle = '#1e88d6'; c.fillRect(0, 0, W, H); langText(c, { th: 'น้ำดื่มหยอดเหรียญ', en: 'Coin water' }, W * 0.04, H * 0.06, W * 0.92, H * 0.88, { family: 'kanit', weight: 700, size: H * 0.6, color: '#fff', lines: 1, lines2: 1, split: 0.62 }); }, -4.27, 1.58, 1.215);
    // ice machine front: bag of ice cubes, price and how-to (Thai first, English on flip)
    mk(0.86, 1.14, 220, (c, W, H) => {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f1fbff'); g.addColorStop(1, '#c7e8f8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      // bag
      const bx = W * 0.2, by = H * 0.06, bw = W * 0.6, bh = H * 0.42;
      c.fillStyle = 'rgba(255,255,255,.85)'; c.strokeStyle = '#7fbbe0'; c.lineWidth = W * 0.012;
      c.beginPath(); c.moveTo(bx, by + bh * 0.08); c.lineTo(bx + bw, by + bh * 0.08); c.lineTo(bx + bw * 0.97, by + bh); c.lineTo(bx + bw * 0.03, by + bh); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#1e88d6'; c.fillRect(bx, by, bw, bh * 0.1);
      const cube = (x, y, s, a) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = 'rgba(190,232,250,.95)'; c.strokeStyle = '#8ccbea'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(-s / 2, -s / 2, s, s, s * 0.18); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.roundRect(-s * 0.36, -s * 0.36, s * 0.34, s * 0.2, s * 0.06); c.fill(); c.restore(); };
      const cs = bw * 0.24;
      for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) cube(bx + bw * (0.2 + q * 0.3) + (r % 2) * cs * 0.15, by + bh * (0.32 + r * 0.24), cs, (q * 3 + r) * 0.7);
      langText(c, { th: 'น้ำแข็ง', en: 'ICE' }, W * 0.08, H * 0.52, W * 0.84, H * 0.16, { family: 'mitr', weight: 700, size: H * 0.14, color: '#0a5aa0', lines: 1, lines2: 1, split: 0.62 });
      langText(c, { th: 'ถุงละ 10 บาท', en: '฿10 per bag' }, W * 0.08, H * 0.69, W * 0.84, H * 0.1, { family: 'kanit', weight: 700, size: H * 0.09, color: '#e31e24', lines: 1, lines2: 1, split: 0.6 });
      langText(c, { th: 'หยอดเหรียญ 10 บาท แล้วรับน้ำแข็งด้านล่าง', en: 'Insert a ฿10 coin, collect ice below' }, W * 0.08, H * 0.8, W * 0.84, H * 0.12, { family: 'sarabun', weight: 600, size: H * 0.06, color: '#33556e', lines: 2, lines2: 2 });
    }, -5.4, 0.95, 1.276);
    mk(0.72, 0.24, 240, (c, W, H) => {
      c.fillStyle = '#e7f4fb'; c.fillRect(0, 0, W, H);
      langText(c, { th: 'หยอดเหรียญ ลิตรละ 1 บาท', en: 'Insert coins · ฿1 per litre' }, W * 0.05, H * 0.1, W * 0.9, H * 0.8, { family: 'kanit', weight: 700, size: H * 0.5, color: '#0a5aa0', lines: 2, lines2: 1, split: 0.6 });
    }, -4.27, 0.3, 1.206);
    mk(0.6, 0.36, 220, (c, W, H) => { c.fillStyle = '#f58220'; c.fillRect(0, 0, W, H); langText(c, { th: 'ตู้บุญเติม', en: 'Top-up kiosk' }, W * 0.04, H * 0.06, W * 0.92, H * 0.88, { family: 'mitr', weight: 700, size: H * 0.6, color: '#fff', lines: 1, lines2: 1, split: 0.62 }); }, 4.32, 1.72, 1.156);
  }

  // -------------------------------------------------------------------- spirit house (ศาลพระภูมิ)
  spiritHouse() {
    const k = new Kit('spirit');
    const gold = std({ color: 0xd9a51c, roughness: 0.3, metalness: 0.85 }, { out: true });
    const white = std({ color: 0xf1ead8, roughness: 0.6 }, { out: true });
    const red = std({ color: 0xa8231b, roughness: 0.5 }, { out: true });
    const x = 7.7, z = 1.7;
    k.box(white, x - 0.14, 0, z - 0.14, x + 0.14, 1.45, z + 0.14, { solid: 'spirit' });                // pedestal
    k.box(white, x - 0.36, 1.45, z - 0.36, x + 0.36, 1.53, z + 0.36);                                   // platform
    k.box(gold, x - 0.3, 1.53, z - 0.3, x + 0.3, 1.56, z + 0.3);
    k.box(std({ color: 0xf5ecd0, roughness: 0.6 }, { out: true }), x - 0.19, 1.56, z - 0.19, x + 0.19, 1.94, z + 0.19);   // house body
    k.box(M.outDark, x - 0.11, 1.62, z + 0.19, x + 0.11, 1.84, z + 0.2);                                // doorway
    k.box(red, x - 0.31, 1.94, z - 0.31, x + 0.31, 1.99, z + 0.31);                                     // eaves
    k.box(red, x - 0.24, 1.99, z - 0.24, x + 0.24, 2.05, z + 0.24); k.box(gold, x - 0.16, 2.05, z - 0.16, x + 0.16, 2.1, z + 0.16);
    k.cyl(gold, x, 2.1, z, 0.005, 0.045, 0.22, { seg: 8 });                                             // finial
    // offerings on the platform: red Fanta with straw, marigold garland, incense
    const fanta = std({ color: 0xe8252a, roughness: 0.2, metalness: 0 }, { out: true });
    k.cyl(fanta, x - 0.24, 1.56, z + 0.2, 0.03, 0.03, 0.15, { seg: 10 });
    k.box(basic(0xffffff), x - 0.243, 1.71, z + 0.198, x - 0.237, 1.78, z + 0.202);
    const mari = std({ color: 0xffa60a, roughness: 0.7 }, { out: true });
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; k.cyl(mari, x + Math.cos(a) * 0.12, 2.02 - Math.abs(Math.sin(a)) * 0.05 - 0.02, z + 0.29, 0.03, 0.03, 0.04, { seg: 6 }); }
    for (let i = 0; i < 12; i++) k.cyl(mari, x - 0.28 + i * 0.05, 1.86 - Math.sin((i / 11) * Math.PI) * 0.09, z + 0.315, 0.022, 0.022, 0.05, { seg: 6 });
    const inc = std({ color: 0xc8261f, roughness: 0.8 }, { out: true });
    for (let i = 0; i < 3; i++) k.cyl(inc, x + 0.18 + i * 0.02, 1.53, z + 0.05 + i * 0.03, 0.004, 0.004, 0.18, { seg: 4 });
    // small candle-like glowing lamp
    k.box(basic(new THREE.Color(2.5, 0.4, 0.2)), x - 0.05, 1.64, z + 0.18, x + 0.05, 1.7, z + 0.19);
    k.build(this.group);
    addCollider(x - 0.4, z - 0.4, x + 0.4, z + 0.4, 'spirit');
    this.spiritPos = new THREE.Vector3(x, 1.7, z);
  }

  // -------------------------------------------------------------------- street-food cart with stools
  cart() {
    const k = new Kit('cart');
    const steel = M.steel, blue = std({ color: 0x2a6fd0, roughness: 0.5 }, { out: true }), red = std({ color: 0xe33b3b, roughness: 0.5 }, { out: true }), dark = M.outDark;
    const x = 10.6, z = 3.2;
    k.box(steel, x - 0.6, 0.55, z - 0.4, x + 0.6, 0.6, z + 0.4, { solid: 'cart' });
    k.box(std({ color: 0xb8bcc0, roughness: 0.4, metalness: 0.6 }, { out: true }), x - 0.6, 0.6, z - 0.4, x + 0.6, 1.0, z - 0.36);
    k.box(steel, x - 0.6, 0.6, z + 0.36, x + 0.6, 0.98, z + 0.4);
    k.box(dark, x - 0.55, 0.64, z - 0.25, x + 0.55, 0.72, z + 0.25);                                   // charcoal grill bed
    k.box(basic(new THREE.Color(2.4, 0.7, 0.15)), x - 0.5, 0.71, z - 0.2, x + 0.5, 0.735, z + 0.2);   // glowing coals
    k.cyl(dark, x - 0.5, 0, z - 0.45, 0.28, 0.28, 0.08, { rx: Math.PI / 2, seg: 14 }); k.cyl(dark, x + 0.5, 0, z + 0.45, 0.28, 0.28, 0.08, { rx: Math.PI / 2, seg: 14 });
    k.box(steel, x - 0.62, 0.15, z - 0.35, x - 0.58, 0.55, z - 0.31);
    // skewers
    for (let i = 0; i < 8; i++) { k.box(std({ color: 0x9a4a22, roughness: 0.7 }, { out: true }), x - 0.45 + i * 0.12, 0.74, z - 0.16, x - 0.39 + i * 0.12, 0.8, z + 0.16); k.box(std({ color: 0xd9b88a, roughness: 0.7 }, { out: true }), x - 0.43 + i * 0.12, 0.735, z - 0.3, x - 0.42 + i * 0.12, 0.745, z + 0.32); }
    // umbrella
    k.cyl(steel, x, 0.6, z, 0.02, 0.02, 1.5, { seg: 6 });
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.35, 12, 1, true), std({ color: 0xe8461f, roughness: 0.7, side: THREE.DoubleSide }, { out: true }));
    um.position.set(x, 2.25, z); um.castShadow = true; this.group.add(um);
    // plastic stools and a table
    const cols = [0xd93a3a, 0x2f6fd0, 0xf2b81b];
    for (let i = 0; i < 3; i++) {
      const c = std({ color: cols[i], roughness: 0.5 }, { out: true });
      k.cyl(c, x - 1.3 + i * 0.5, 0.22, z + 1.0 + (i % 2) * 0.2, 0.17, 0.15, 0.03, { seg: 10 });
      k.cyl(c, x - 1.3 + i * 0.5, 0, z + 1.0 + (i % 2) * 0.2, 0.15, 0.17, 0.22, { seg: 10, open: true });
      addCollider(x - 1.47 + i * 0.5, z + 0.85 + (i % 2) * 0.2, x - 1.13 + i * 0.5, z + 1.15 + (i % 2) * 0.2, 'stool');
    }
    k.cyl(std({ color: 0xf5f5f0, roughness: 0.6 }, { out: true }), x - 0.8, 0.5, z + 1.65, 0.36, 0.36, 0.03, { seg: 16 });
    k.cyl(steel, x - 0.8, 0, z + 1.65, 0.03, 0.03, 0.5, { seg: 6 });
    k.build(this.group);
    addCollider(x - 1.5, z + 1.3, x - 0.1, z + 2.0, 'table');
    // rising smoke puffs
    const tex = new LTex(64, 64, (c, W, H) => { const g = c.createRadialGradient(W / 2, H / 2, 2, W / 2, H / 2, W / 2); g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }, { localized: false });
    for (let i = 0; i < 7; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.texture, transparent: true, opacity: 0.25, depthWrite: false, color: 0xd8d4cc }));
      sp.scale.setScalar(0.5); sp.position.set(x, 0.9, z); sp.userData.t = i / 7; this.group.add(sp); this.smoke.push(sp);
    }
    this.smokeBase = new THREE.Vector3(x, 0.9, z);
  }

  planters() {
    const k = new Kit('planters');
    const pot = std({ color: 0xb2673a, roughness: 0.8 }, { out: true });
    const leaf = std({ color: 0x2f8f3a, roughness: 0.8 }, { out: true });
    const pink = std({ color: 0xe0489a, roughness: 0.7 }, { out: true });
    for (const x of [-2.6, 2.6, 6.0, -7.0]) {
      const z = 0.75;
      k.cyl(pot, x, 0, z, 0.3, 0.22, 0.52, { seg: 12 });
      k.box(M.outDark, x - 0.02, 0.5, z - 0.02, x + 0.02, 0.9, z + 0.02);
      addCollider(x - 0.32, z - 0.32, x + 0.32, z + 0.32, 'planter');
    }
    k.build(this.group);
    const rr = rng(5);
    for (const x of [-2.6, 2.6, 6.0, -7.0]) {
      for (let i = 0; i < 6; i++) {
        const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25 + rr() * 0.12, 1), rr() > 0.6 ? pink : leaf);
        s.position.set(x + (rr() - 0.5) * 0.35, 0.85 + rr() * 0.45, 0.75 + (rr() - 0.5) * 0.35); s.scale.y = 0.8;
        this.group.add(s);
      }
    }
  }

  bollards() {
    const k = new Kit('bollards');
    const yel = std({ color: 0xf6c90e, roughness: 0.5 }, { out: true });
    for (let x = -12; x <= 12; x += 1.9) {
      if (Math.abs(x - 0.5) < 1.0) continue;
      k.cyl(M.outMetal, x, 0, 5.32, 0.05, 0.05, 0.75, { seg: 8 });
      k.cyl(yel, x, 0.6, 5.32, 0.055, 0.055, 0.1, { seg: 8 });
    }
    k.build(this.group);
  }

  // tall "7-ELEVEN" pole sign at the kerb, double-sided
  poleSign() {
    const x = -10.2, z = 4.8;
    const lt = new LTex(320, 320, (c, W, H) => {
      c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); drawStripes(c, 0, H * 0.82, W, H * 0.18);
      { const lh = H * 0.52; drawLogo(c, (W - lh * LOGO_W / LOGO_H) / 2, H * 0.04, lh); }
      langText(c, { th: 'เปิด 24 ชม.', en: 'OPEN 24 HRS' }, W * 0.05, H * 0.6, W * 0.9, H * 0.2, { family: 'kanit', weight: 900, size: H * 0.2, color: '#e31e24', lines: 1, lines2: 1, split: 0.6 });
    });
    const mat = new THREE.MeshBasicMaterial({ map: lt.texture });
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 0.2), M.outWhite); g.add(box);
    const a = new THREE.Mesh(new THREE.PlaneGeometry(1.66, 1.66), mat); a.position.z = 0.106; g.add(a);
    const b = a.clone(); b.rotation.y = Math.PI; b.position.z = -0.106; g.add(b);
    g.position.set(x, 6.4, z); this.group.add(g);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 5.7, 10), M.outMetal); post.position.set(x, 2.85, z); this.group.add(post);
    this.ext.nightMats.push({ mat, prop: 'color', day: 0.9, night: 1.2 });
    addCollider(x - 0.15, z - 0.15, x + 0.15, z + 0.15, 'polesign');
  }

  // Bangkok's blue street-name sign: Thai on top, English below, district and city underneath. Real ones are always
  // bilingual, so this one does not flip with the language setting.
  soiSign() {
    const x = 6.05, z = 5.2, w = 1.36, h = 0.5;   // at the kerb by the store's corner, between two bollards
    const lt = new LTex(544, 200, (c, W, H) => {
      fillRR(c, 0, 0, W, H, 14, '#1d4f9c');
      fillRR(c, 9, 9, W - 18, H - 18, 9, null, '#ffffff', 4);
      circle(c, 62, H / 2, 38, '#ffffff'); circle(c, 62, H / 2, 30, '#1d4f9c'); circle(c, 62, H / 2, 20, '#ffffff');   // city emblem (stylised)
      fitText(c, 'ซอยสุขุมวิท 11', 116, 20, W - 136, 72, { family: 'sarabun', weight: 700, color: '#fff', align: 'left' });
      fitText(c, 'Soi Sukhumvit 11', 116, 90, W - 136, 50, { family: 'kanit', weight: 600, color: '#fff', align: 'left' });
      fitText(c, 'เขตวัฒนา กรุงเทพมหานคร · Watthana, Bangkok', 116, 144, W - 136, 34, { family: 'kanit', weight: 500, color: '#dbe6ff', align: 'left' });
    }, { localized: false });
    const mat = new THREE.MeshBasicMaterial({ map: lt.texture });
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, h + 0.03, 0.03), M.outMetal));
    const a = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); a.position.z = 0.021; g.add(a);
    const b = a.clone(); b.rotation.y = Math.PI; b.position.z = -0.021; g.add(b);
    g.position.set(x, 2.45, z); this.group.add(g);
    for (const dx of [-w / 2 + 0.12, w / 2 - 0.12]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.7, 8), M.outMetal); post.position.set(x + dx, 1.35, z - 0.03); this.group.add(post);
    }
    this.ext.nightMats.push({ mat, prop: 'color', day: 0.95, night: 0.6 });
    addCollider(x - w / 2, z - 0.06, x + w / 2, z + 0.06, 'soisign');
  }

  update(dt, time) {
    if (!this.smokeBase) return;
    for (const s of this.smoke) {
      s.userData.t = (s.userData.t + dt * 0.18) % 1;
      const u = s.userData.t;
      s.position.set(this.smokeBase.x + Math.sin(u * 6 + s.id) * 0.25 * u, this.smokeBase.y + u * 1.8, this.smokeBase.z + Math.cos(u * 5) * 0.15 * u);
      s.scale.setScalar(0.35 + u * 1.0);
      s.material.opacity = 0.28 * (1 - u) * Math.min(1, u * 6);
    }
  }
}

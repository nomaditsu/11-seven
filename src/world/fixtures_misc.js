// ATMs, hot-water/microwave bar, window seating, bakery table, promo island, basket stand and wall/glass decor.
import * as THREE from 'three';
import { M, std, basic } from './materials.js';
import { Kit } from './kit.js';
import { L } from './layout.js';
import { makeSign, LTex } from '../gfx/localized.js';
import { langText, fitText, fillRR, circle, rrPath, burst } from '../gfx/draw.js';
import { BRAND, drawStripes, drawLogo } from '../gfx/logo11seven.js';
import { addCollider } from './colliders.js';
import { blobShadow } from '../gfx/surfaces.js';
import { drawFakeQR } from './fixtures_counter.js';
import { pick } from '../core/i18n.js';

const Y = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------------------------- ATMs
export function buildATMs(ctx) {
  const k = new Kit('atm');
  const banks = [{ col: '#5b2a86', name: 'BANK', ac: '#e0c8ff' }, { col: '#0f8a3e', name: 'BANK', ac: '#c8ffd8' }];
  banks.forEach((b, i) => {
    const zc = -2.05 - i * 1.15;
    const body = std({ color: 0x2b2e34, roughness: 0.4, metalness: 0.5 });
    const trim = std({ color: new THREE.Color(b.col), roughness: 0.4, metalness: 0.3 });
    k.box(body, L.x0, 0, zc - 0.32, L.x0 + 0.62, 1.697, zc + 0.32, { solid: 'atm' });
    k.box(trim, L.x0 + 0.5, 0.06, zc - 0.324, L.x0 + 0.64, 1.7, zc + 0.324);   // a hair wider than the body so the colour wins
    k.box(M.black, L.x0 + 0.62, 1.05, zc - 0.28, L.x0 + 0.66, 1.6, zc + 0.28);                    // fascia
    k.box(M.darkGrey, L.x0 + 0.62, 0.86, zc - 0.28, L.x0 + 0.78, 1.02, zc + 0.28);                 // keypad shelf
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) k.box(M.chrome, L.x0 + 0.66, 0.88 + 0.01, zc - 0.12 + c * 0.08, L.x0 + 0.72, 0.9 + r * 0.0, zc - 0.08 + c * 0.08);
    k.box(M.black, L.x0 + 0.62, 0.62, zc - 0.22, L.x0 + 0.68, 0.7, zc + 0.22);                    // cash slot
    k.box(M.ledWhite, L.x0 + 0.68, 0.66, zc - 0.2, L.x0 + 0.685, 0.68, zc + 0.2);
    k.box(M.black, L.x0 + 0.62, 0.74, zc - 0.22, L.x0 + 0.68, 0.8, zc - 0.05);                     // card slot
    k.box(M.ledCool, L.x0 + 0.68, 0.76, zc - 0.2, L.x0 + 0.685, 0.78, zc - 0.07);
    k.box(M.darkGrey, L.x0 + 0.62, 0.4, zc - 0.22, L.x0 + 0.68, 0.5, zc - 0.05);                    // receipt
    k.box(trim, L.x0 + 0.62, 1.7, zc - 0.32, L.x0 + 0.8, 2.05, zc + 0.32);                          // header box
    addCollider(L.x0, zc - 0.32, L.x0 + 0.8, zc + 0.32, 'atm');
    const scr = makeSign(0.46, 0.36, 380, (c, W, H) => {
      c.fillStyle = '#f2f6fa'; c.fillRect(0, 0, W, H);
      c.fillStyle = b.col; c.fillRect(0, 0, W, H * 0.16);
      fitText(c, 'BANK', W * 0.04, H * 0.01, W * 0.4, H * 0.14, { family: 'kanit', weight: 900, size: H * 0.13, color: '#fff', align: 'left' });
      langText(c, { th: 'กรุณาเสียบบัตร', en: 'Please insert your card' }, W * 0.05, H * 0.3, W * 0.9, H * 0.24, { family: 'kanit', weight: 700, size: H * 0.2, color: b.col, lines: 1, lines2: 1 });
      langText(c, { th: 'ถอนเงิน  •  โอนเงิน  •  ตรวจสอบยอด', en: 'Withdraw • Transfer • Balance' }, W * 0.05, H * 0.6, W * 0.9, H * 0.16, { family: 'sarabun', weight: 700, size: H * 0.12, color: '#333', lines: 1, lines2: 1 });
    }, {});
    scr.mesh.rotation.y = Math.PI / 2; scr.mesh.position.set(L.x0 + 0.664, 1.34, zc); ctx.root.add(scr.mesh);
    const hd = makeSign(0.56, 0.3, 300, (c, W, H) => {
      c.fillStyle = b.col; c.fillRect(0, 0, W, H);
      langText(c, { th: 'ตู้เอทีเอ็ม', en: 'ATM' }, W * 0.05, H * 0.04, W * 0.9, H * 0.9, { family: 'kanit', weight: 900, size: H * 0.78, color: '#fff', lines: 1, lines2: 1, split: 0.62 });
    }, {});
    hd.mesh.rotation.y = Math.PI / 2; hd.mesh.position.set(L.x0 + 0.806, 1.88, zc); ctx.root.add(hd.mesh);
    ctx.interactables.push({ id: 'atm' + i, kind: 'atm', box: new THREE.Box3(new THREE.Vector3(L.x0, 0.3, zc - 0.32), new THREE.Vector3(L.x0 + 0.8, 1.7, zc + 0.32)), maxDist: 2.4 });
  });
  k.build(ctx.root);
}

// ---------------------------------------------------------------------------------------------- hot water & microwaves
export function buildHotWater(ctx) {
  const h = L.hotWater, k = new Kit('hotwater');
  const wallX = L.x0;
  k.box(M.laminate, wallX, 0, h.z0, wallX + 0.62, 0.92, h.z1, { solid: 'hotwater', tile: 0.5 });
  k.box(M.steel, wallX, 0.92, h.z0, wallX + 0.66, 0.955, h.z1);
  // shelf above with sauces/cutlery baskets
  k.box(M.lightGrey, wallX, 1.42, h.z0, wallX + 0.34, 1.45, h.z1);
  addCollider(wallX, h.z0, wallX + 0.66, h.z1, 'hotwater');
  // water boiler
  const zb = h.z0 + 0.32;
  k.cyl(M.steel, wallX + 0.3, 0.955, zb, 0.15, 0.15, 0.5, { seg: 20 });
  k.cyl(M.darkGrey, wallX + 0.3, 1.455, zb, 0.155, 0.155, 0.04, { seg: 20 });
  k.box(M.chrome, wallX + 0.4, 1.08, zb - 0.03, wallX + 0.5, 1.12, zb + 0.03);
  k.box(M.ledCool, wallX + 0.44, 1.2, zb - 0.02, wallX + 0.46, 1.24, zb + 0.02);
  // two microwaves
  const mw = std({ color: 0xe6e8ea, roughness: 0.3, metalness: 0.4 });
  for (let i = 0; i < 2; i++) {
    const zc = h.z0 + 0.98 + i * 0.5;
    k.box(mw, wallX + 0.06, 0.955, zc - 0.22, wallX + 0.58, 1.27, zc + 0.22);
    k.box(M.black, wallX + 0.58, 1.0, zc - 0.19, wallX + 0.595, 1.24, zc + 0.06);              // door window
    k.box(M.darkGrey, wallX + 0.58, 1.0, zc + 0.08, wallX + 0.595, 1.24, zc + 0.2);            // control panel
    k.box(M.ledCool, wallX + 0.595, 1.18, zc + 0.1, wallX + 0.6, 1.2, zc + 0.18);
    ctx.interactables.push({ id: 'mw' + i, kind: 'microwave', box: new THREE.Box3(new THREE.Vector3(wallX, 0.95, zc - 0.22), new THREE.Vector3(wallX + 0.62, 1.28, zc + 0.22)), maxDist: 2.2 });
  }
  // condiment caddy with cutlery, chopsticks and sauces
  const zc = h.z0 + 1.62;
  k.box(M.white, wallX + 0.08, 0.955, zc, wallX + 0.5, 1.0, zc + 0.26);
  for (let i = 0; i < 3; i++) k.cyl(std({ color: [0xe8261c, 0xf2d21a, 0x3a9a44][i], roughness: 0.5 }), wallX + 0.16 + i * 0.13, 1.0, zc + 0.08, 0.035, 0.035, 0.16, { seg: 10 });
  for (let i = 0; i < 3; i++) k.cyl(M.chrome, wallX + 0.16 + i * 0.13, 1.0, zc + 0.19, 0.03, 0.03, 0.1, { seg: 10 });
  k.build(ctx.root);
  ctx.occluders.push(...ctx.root.children.filter((c) => c.name === 'hotwater'));
  ctx.interactables.push({ id: 'hotwater', kind: 'hotwater', box: new THREE.Box3(new THREE.Vector3(wallX, 0.95, zb - 0.2), new THREE.Vector3(wallX + 0.5, 1.5, zb + 0.2)), maxDist: 2.2 });
  // sign
  const sg = makeSign(0.9, 0.5, 260, (c, W, H) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.fillStyle = BRAND.orange; c.fillRect(0, 0, W, H * 0.16);
    langText(c, { th: 'น้ำร้อน • ไมโครเวฟ • ช้อนส้อม', en: 'Hot water • Microwave • Cutlery' }, W * 0.04, H * 0.02, W * 0.92, H * 0.13, { family: 'kanit', weight: 700, size: H * 0.11, color: '#fff', lines: 1, lines2: 1 });
    langText(c, { th: 'ใส่บะหมี่ถ้วย เติมน้ำร้อน รอ 3 นาที', en: 'Add hot water to your cup noodles and wait 3 minutes' }, W * 0.06, H * 0.22, W * 0.88, H * 0.36, { family: 'sarabun', weight: 700, size: H * 0.14, color: '#222', lines: 3, lines2: 2 });
    langText(c, { th: 'อุ่นอาหารในไมโครเวฟ ระวังร้อน!', en: 'Microwave your meal — careful, it is hot!' }, W * 0.06, H * 0.62, W * 0.88, H * 0.3, { family: 'sarabun', weight: 700, size: H * 0.14, color: '#c8102e', lines: 2, lines2: 2 });
  }, {});
  sg.mesh.rotation.y = Math.PI / 2; sg.mesh.position.set(wallX + 0.012, 1.98, (h.z0 + h.z1) / 2); ctx.root.add(sg.mesh);
}

// ---------------------------------------------------------------------------------------------- window bar + stools
export function buildWindowBar(ctx) {
  const w = L.windowBar, k = new Kit('windowbar');
  k.box(M.steel, w.x0, 0.96, w.z0, w.x1, 1.0, w.z1, { solid: 'bar' });
  k.box(M.darkGrey, w.x0, 0, w.z0 + 0.1, w.x0 + 0.05, 0.96, w.z1 - 0.1);
  k.box(M.darkGrey, w.x1 - 0.05, 0, w.z0 + 0.1, w.x1, 0.96, w.z1 - 0.1);
  k.box(M.darkGrey, w.x0, 0.5, w.z0 + 0.14, w.x1, 0.54, w.z0 + 0.18);
  const seat = std({ color: BRAND.orange, roughness: 0.45 });
  for (let i = 0; i < 6; i++) {
    const x = w.x0 + 0.4 + i * 0.6, z = w.z1 + 0.42;
    k.cyl(seat, x, 0.66, z, 0.18, 0.18, 0.06, { seg: 18 });
    k.cyl(M.chrome, x, 0, z, 0.02, 0.02, 0.66, { seg: 8 });
    k.cyl(M.chrome, x, 0, z, 0.15, 0.15, 0.015, { seg: 14 });
    k.cyl(M.chrome, x, 0.28, z, 0.13, 0.13, 0.012, { seg: 14 });
    ctx.stools.push({ x, z });
  }
  // tissue dispenser + napkins + bin + Wi-Fi sticker
  k.box(M.white, w.x0 + 0.6, 1.0, w.z0 + 0.1, w.x0 + 0.8, 1.1, w.z0 + 0.2);
  k.box(M.white, w.x1 - 1.2, 1.0, w.z0 + 0.12, w.x1 - 1.0, 1.1, w.z0 + 0.22);
  k.build(ctx.root);
  const wifi = makeSign(0.5, 0.26, 260, (c, W, H) => {
    c.fillStyle = '#123e70'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#fff'; c.lineWidth = H * 0.05; c.lineCap = 'round';
    for (let r = 1; r <= 3; r++) { c.beginPath(); c.arc(W * 0.22, H * 0.7, r * H * 0.16, -2.2, -0.94); c.stroke(); }
    circle(c, W * 0.22, H * 0.7, H * 0.035, '#fff');
    langText(c, { th: 'ไวไฟฟรี', en: 'Free Wi-Fi' }, W * 0.42, H * 0.1, W * 0.55, H * 0.8, { family: 'kanit', weight: 700, size: H * 0.5, color: '#fff', lines: 2, lines2: 1 });
  }, {});
  wifi.mesh.position.set(-4.3, 1.62, -0.018); wifi.mesh.rotation.y = Math.PI; ctx.root.add(wifi.mesh);   // below the 11 Café decal, not on it
}

// ---------------------------------------------------------------------------------------------- bakery table & promo island
function tierDescriptors(ctx, tagP, pool, x0, x1, z0, z1, ys, opts = {}) {
  const w = x1 - x0, d = z1 - z0;
  const push = (o) => ctx.shelves.push({ pool, lean: 0.06, tint: 1.05, order: ctx.shelves.length, noTag: false, ...o });
  ys.forEach((y, i) => {
    const clear = i < ys.length - 1 ? ys[i + 1] - y - 0.04 : 0.4;
    // front (customer at z > z1 facing -z; right = +x)
    if (!opts.noFront) push({ tag: `${tagP}F${i}`, x: x0 + 0.03, z: z1, y, dx: 1, dz: 0, ox: 0, oz: 1, len: w - 0.06, dep: d / 2 - 0.03, clear });
    // back (customer at z < z0 facing +z; right = -x)
    if (!opts.noBack) push({ tag: `${tagP}B${i}`, x: x1 - 0.03, z: z0, y, dx: -1, dz: 0, ox: 0, oz: -1, len: w - 0.06, dep: d / 2 - 0.03, clear });
  });
}

export function buildIslands(ctx) {
  const k = new Kit('islands');
  // bakery table
  const b = L.bakery;
  k.box(M.laminate, b.x0, 0, b.z0, b.x1, 0.56, b.z1, { solid: 'bakery', tile: 0.5 });
  k.box(M.orange, b.x0 - 0.004, 0.36, b.z0, b.x0, 0.42, b.z1); k.box(M.orange, b.x1, 0.36, b.z0, b.x1 + 0.004, 0.42, b.z1);
  k.box(std({ color: 0xc89860, roughness: 0.7 }), b.x0 - 0.03, 0.56, b.z0 - 0.03, b.x1 + 0.03, 0.6, b.z1 + 0.03);
  k.box(M.lightGrey, b.x0 + 0.05, 0.6, (b.z0 + b.z1) / 2 - 0.02, b.x1 - 0.05, 0.86, (b.z0 + b.z1) / 2 + 0.02);           // back riser (under the top board)
  k.box(std({ color: 0xc89860, roughness: 0.7 }), b.x0, 0.86, b.z0, b.x1, 0.9, b.z1);
  tierDescriptors(ctx, 'BK', 'bakery', b.x0, b.x1, b.z0, b.z1, [0.6, 0.9]);
  // promo island (double sided, two tiers)
  const p = L.promo;
  k.box(M.laminate, p.x0, 0, p.z0, p.x1, 0.4, p.z1, { solid: 'promo', tile: 0.5 });
  k.box(M.orange, p.x0 - 0.004, 0.24, p.z0, p.x0, 0.3, p.z1); k.box(M.orange, p.x1, 0.24, p.z0, p.x1 + 0.004, 0.3, p.z1);
  k.box(M.lightGrey, p.x0 + 0.1, 0.4, (p.z0 + p.z1) / 2 - 0.02, p.x1 - 0.1, 1.15, (p.z0 + p.z1) / 2 + 0.02);
  k.box(M.white, p.x0, 0.7, p.z0, p.x1, 0.73, p.z1);
  k.box(M.orange, p.x0, 1.15, p.z0 + 0.3, p.x1, 1.19, p.z1 - 0.3);
  tierDescriptors(ctx, 'PR', 'promo', p.x0, p.x1, p.z0, p.z1, [0.4, 0.73]);
  k.build(ctx.root);
  ctx.occluders.push(...ctx.root.children.filter((c) => c.name === 'islands'));
  // signs
  const pSign = aisleHang({ th: 'โปรโมชั่นพิเศษ!', en: 'Special offers!' }, 1.6, 0.42, BRAND.red);
  pSign.position.set((p.x0 + p.x1) / 2, 2.55, (p.z0 + p.z1) / 2); ctx.root.add(pSign);
  const bSign = aisleHang({ th: 'เบเกอรี่', en: 'Bakery' }, 1.0, 0.36, BRAND.orange);
  bSign.position.set((b.x0 + b.x1) / 2, 2.6, (b.z0 + b.z1) / 2); ctx.root.add(bSign);
}

export function aisleHang(text, w, h, color) {
  const g = new THREE.Group();
  const draw = (c, W, H) => {
    c.clearRect(0, 0, W, H); fillRR(c, 0, 0, W, H, H * 0.16, color);
    c.fillStyle = 'rgba(255,255,255,.16)'; rrPath(c, 0, 0, W, H * 0.5, [H * 0.16, H * 0.16, 0, 0]); c.fill();
    langText(c, text, W * 0.05, H * 0.08, W * 0.9, H * 0.84, { family: 'mitr', weight: 700, size: H * 0.7, color: '#fff', lines: 1, lines2: 1, split: 0.62, shadow: ['rgba(0,0,0,.3)', 0, 2, 3] });
  };
  const s1 = makeSign(w, h, 220, draw, { transparent: true }), s2 = makeSign(w, h, 220, draw, { transparent: true });
  s1.mesh.position.z = 0.016; s2.mesh.position.z = -0.016; s2.mesh.rotation.y = Math.PI;   // 6 mm off the 20 mm box
  const box = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, h - 0.02, 0.02), M.darkGrey);
  g.add(box, s1.mesh, s2.mesh);
  const rod = new THREE.CylinderGeometry(0.006, 0.006, 0.55, 6);
  for (const sx of [-w * 0.4, w * 0.4]) { const r = new THREE.Mesh(rod, M.steel); r.position.set(sx, h / 2 + 0.27, 0); g.add(r); }
  return g;
}

// ---------------------------------------------------------------------------------------------- basket stand
export function buildBaskets(ctx) {
  const b = L.baskets, k = new Kit('baskets');
  const orange = std({ color: BRAND.orange, roughness: 0.5 });
  const handle = std({ color: 0x1f1f22, roughness: 0.6 });
  k.box(M.darkGrey, b.x0, 0, b.z0, b.x1, 0.06, b.z1, { solid: 'baskets' });
  k.box(M.chrome, b.x0 + 0.03, 0.06, b.z0 + 0.03, b.x0 + 0.05, 0.85, b.z0 + 0.05); k.box(M.chrome, b.x1 - 0.05, 0.06, b.z0 + 0.03, b.x1 - 0.03, 0.85, b.z0 + 0.05);
  k.box(M.chrome, b.x0 + 0.03, 0.06, b.z1 - 0.05, b.x0 + 0.05, 0.85, b.z1 - 0.03); k.box(M.chrome, b.x1 - 0.05, 0.06, b.z1 - 0.05, b.x1 - 0.03, 0.85, b.z1 - 0.03);
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  for (let i = 0; i < 9; i++) {
    const y = 0.08 + i * 0.075;
    k.box(orange, cx - 0.22, y, cz - 0.15, cx + 0.22, y + 0.02, cz + 0.15);
    k.box(orange, cx - 0.25, y + 0.02, cz - 0.17, cx - 0.22, y + 0.2, cz + 0.17);
    k.box(orange, cx + 0.22, y + 0.02, cz - 0.17, cx + 0.25, y + 0.2, cz + 0.17);
    k.box(orange, cx - 0.25, y + 0.02, cz - 0.17, cx + 0.25, y + 0.2, cz - 0.14);
    k.box(orange, cx - 0.25, y + 0.02, cz + 0.14, cx + 0.25, y + 0.2, cz + 0.17);
  }
  k.build(ctx.root);
  const sg = aisleHang({ th: 'ตะกร้า', en: 'Baskets' }, 0.8, 0.3, BRAND.green);
  sg.position.set(cx, 2.55, cz); ctx.root.add(sg);
  ctx.interactables.push({ id: 'baskets', kind: 'basket', box: new THREE.Box3(new THREE.Vector3(b.x0, 0.05, b.z0), new THREE.Vector3(b.x1, 0.95, b.z1)), maxDist: 2.6 });
}

// ---------------------------------------------------------------------------------------------- safety / decor bits
export function buildDecor(ctx) {
  const k = new Kit('decor');
  // staff-only back door
  const d = L.staffDoor;
  k.box(std({ color: 0xcfd3d6, roughness: 0.5, metalness: 0.3 }), d.x0, 0, L.zB, d.x1, 2.1, L.zB + 0.06);
  k.box(M.chrome, d.x0 + 0.12, 0.95, L.zB + 0.06, d.x0 + 0.16, 1.15, L.zB + 0.11);
  // fire extinguisher + cabinet
  const red = std({ color: 0xd8232a, roughness: 0.35, metalness: 0.3 });
  k.cyl(red, L.x1 - 0.2, 0.9, -15.9, 0.075, 0.075, 0.42, { seg: 12 });
  k.cyl(M.black, L.x1 - 0.2, 1.32, -15.9, 0.02, 0.03, 0.06, { seg: 8 });
  // wet-floor sign
  const yel = std({ color: 0xf6c90e, roughness: 0.5 });
  k.box(yel, -1.9, 0, -1.4, -1.55, 0.02, -1.25);
  // trash bins near the window bar
  const bins = [0x2f7d3a, 0x2f6fb0, 0xe8a91a];
  bins.forEach((c, i) => { k.box(std({ color: c, roughness: 0.5 }), -6.0 + i * 0.34, 0, -1.55, -5.72 + i * 0.34, 0.8, -1.22, { solid: 'bin' }); k.box(M.black, -5.98 + i * 0.34, 0.8, -1.53, -5.74 + i * 0.34, 0.83, -1.24); });
  k.build(ctx.root);
  const wet = makeSign(0.34, 0.42, 300, (c, W, H) => {
    c.fillStyle = '#f6c90e'; c.fillRect(0, 0, W, H); c.strokeStyle = '#222'; c.lineWidth = 4; c.strokeRect(6, 6, W - 12, H - 12);
    c.fillStyle = '#222'; c.beginPath(); c.moveTo(W / 2, H * 0.08); c.lineTo(W * 0.85, H * 0.5); c.lineTo(W * 0.15, H * 0.5); c.closePath(); c.fill();
    c.fillStyle = '#f6c90e'; c.fillRect(W * 0.46, H * 0.2, W * 0.08, H * 0.16); c.beginPath(); c.arc(W / 2, H * 0.42, W * 0.04, 0, 6.3); c.fill();
    langText(c, { th: 'ระวังพื้นลื่น', en: 'Caution: wet floor' }, W * 0.06, H * 0.55, W * 0.88, H * 0.4, { family: 'kanit', weight: 900, size: H * 0.3, color: '#111', lines: 2, lines2: 1, split: 0.62 });
  }, {});
  for (const s of [1, -1]) { const m = wet.mesh.clone(); m.material = wet.mesh.material; m.position.set(-1.725, 0.24, -1.325 + s * 0.06); m.rotation.set(-0.12 * s, s > 0 ? 0 : Math.PI, 0); m.rotation.y = s > 0 ? 0 : Math.PI; m.rotation.x = s > 0 ? -0.2 : -0.2; ctx.root.add(m); }
  // exit sign over the staff door
  const ex = makeSign(0.5, 0.2, 300, (c, W, H) => {
    c.fillStyle = '#0b7a3a'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff';
    c.beginPath(); c.arc(W * 0.16, H * 0.28, H * 0.09, 0, 6.3); c.fill(); c.fillRect(W * 0.14, H * 0.38, H * 0.05, H * 0.28);
    langText(c, { th: 'ทางออก', en: 'EXIT' }, W * 0.3, H * 0.06, W * 0.66, H * 0.88, { family: 'kanit', weight: 900, size: H * 0.7, color: '#fff', lines: 1, lines2: 1, split: 0.62 });
  }, {});
  ex.mesh.position.set((d.x0 + d.x1) / 2, 2.28, L.zB + 0.03); ctx.root.add(ex.mesh);
  const staff = makeSign(0.5, 0.16, 300, (c, W, H) => {
    c.fillStyle = '#c8102e'; c.fillRect(0, 0, W, H);
    langText(c, { th: 'พนักงานเท่านั้น', en: 'Staff only' }, W * 0.04, H * 0.04, W * 0.92, H * 0.92, { family: 'kanit', weight: 700, size: H * 0.7, color: '#fff', lines: 1, lines2: 1, split: 0.62 });
  }, {});
  staff.mesh.position.set((d.x0 + d.x1) / 2, 1.9, L.zB + 0.065); ctx.root.add(staff.mesh);
  // queue floor line + text
  const q = makeSign(1.6, 0.5, 200, (c, W, H) => {
    c.clearRect(0, 0, W, H); fillRR(c, 0, 0, W, H, 12, 'rgba(255,214,0,.92)');
    langText(c, { th: 'โปรดยืนรอคิวหลังเส้น', en: 'Please queue behind the line' }, W * 0.04, H * 0.06, W * 0.92, H * 0.88, { family: 'kanit', weight: 700, size: H * 0.5, color: '#222', lines: 1, lines2: 1, split: 0.6 });
  }, { transparent: true });
  q.mesh.rotation.x = -Math.PI / 2; q.mesh.rotation.z = -Math.PI / 2;   // reads upright for the people queueing, not the cashier q.mesh.position.set(2.75, 0.006, -2.95); ctx.root.add(q.mesh);
}

// ---------------------------------------------------------------------------------------------- posters & ceiling banners
export function buildPosters(ctx) {
  const mk = (w, h, px, draw, pos, ry = 0) => {
    const s = makeSign(w, h, px, draw, {});
    s.mesh.position.set(pos[0], pos[1], pos[2]); s.mesh.rotation.y = ry; ctx.root.add(s.mesh);
    return s;
  };
  // 11 Club poster (left wall above ATMs)
  mk(0.9, 1.2, 240, (c, W, H) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.fillStyle = BRAND.green; c.fillRect(0, 0, W, H * 0.3);
    langText(c, { th: 'อีเลฟเว่น คลับ', en: '11 Club' }, W * 0.06, H * 0.03, W * 0.88, H * 0.22, { family: 'kanit', weight: 900, size: H * 0.2, color: '#fff', lines: 1, lines2: 1, split: 0.6 });
    c.fillStyle = BRAND.orange; c.beginPath(); c.arc(W * 0.5, H * 0.5, W * 0.24, 0, 6.3); c.fill();
    fitText(c, '+1', W * 0.3, H * 0.4, W * 0.4, H * 0.2, { family: 'anton', weight: 400, size: H * 0.2, color: '#fff' });
    langText(c, { th: 'สะสมแต้มทุกการซื้อ แลกส่วนลดและของรางวัล', en: 'Earn points on every purchase and redeem for rewards' }, W * 0.08, H * 0.72, W * 0.84, H * 0.22, { family: 'sarabun', weight: 700, size: H * 0.09, color: '#222', lines: 3, lines2: 2 });
  }, [L.x0 + 0.012, 2.0, -3.3], Math.PI / 2);
  // 7Delivery poster
  mk(0.9, 1.2, 240, (c, W, H) => {
    c.fillStyle = BRAND.orange; c.fillRect(0, 0, W, H);
    langText(c, { th: 'อีเลฟเว่น เซเว่น เดลิเวอรี่', en: '11 Delivery' }, W * 0.06, H * 0.04, W * 0.88, H * 0.2, { family: 'mitr', weight: 700, size: H * 0.18, color: '#fff', lines: 1, lines2: 1, split: 0.6 });
    c.fillStyle = '#fff'; c.beginPath(); c.arc(W * 0.5, H * 0.5, W * 0.3, 0, 6.3); c.fill();
    c.fillStyle = BRAND.green; c.fillRect(W * 0.3, H * 0.44, W * 0.4, H * 0.12); c.beginPath(); c.arc(W * 0.35, H * 0.6, H * 0.04, 0, 6.3); c.arc(W * 0.65, H * 0.6, H * 0.04, 0, 6.3); c.fill();
    langText(c, { th: 'สั่งเลย ส่งถึงบ้าน 24 ชม.', en: 'Order now — delivered 24 hours' }, W * 0.08, H * 0.78, W * 0.84, H * 0.18, { family: 'kanit', weight: 700, size: H * 0.1, color: '#fff', lines: 2, lines2: 1 });
  }, [L.x0 + 0.012, 2.0, -4.42], Math.PI / 2);   // clear of the hot-water sign (z -5.8 .. -4.9)
  // Counter Service / bill payment poster near the counter (right wall)
  mk(1.0, 0.7, 260, (c, W, H) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.fillStyle = '#123e70'; c.fillRect(0, 0, W, H * 0.26);
    langText(c, { th: 'เคาน์เตอร์เซอร์วิส', en: 'Counter Service' }, W * 0.05, H * 0.02, W * 0.9, H * 0.22, { family: 'kanit', weight: 900, size: H * 0.2, color: '#fff', lines: 1, lines2: 1, split: 0.62 });
    langText(c, { th: 'จ่ายบิล • เติมเงิน • ส่งพัสดุ • ซื้อประกัน', en: 'Pay bills • Top up • Send parcels • Insurance' }, W * 0.05, H * 0.3, W * 0.9, H * 0.36, { family: 'sarabun', weight: 700, size: H * 0.16, color: '#123e70', lines: 2, lines2: 2 });
    drawFakeQR(c, W * 0.74, H * 0.62, H * 0.32, 3);
    langText(c, { th: 'พร้อมเพย์ ทรูมันนี่ แรบบิท ไลน์เพย์', en: 'PromptPay · TrueMoney · Rabbit LINE Pay' }, W * 0.04, H * 0.7, W * 0.66, H * 0.26, { family: 'sarabun', weight: 700, size: H * 0.1, color: '#555', lines: 2, lines2: 2 });
  }, [L.x1 - 0.012, 1.85, -6.6], -Math.PI / 2);
  // ceiling banners over the front area
  const banners = [
    { t: { th: 'ซื้อ 1 แถม 1', en: 'Buy 1 Get 1 Free' }, c: BRAND.red, p: [-3.5, 2.55, -1.8] },
    { t: { th: 'ราคาพิเศษ 3 ชิ้น 50 บาท', en: '3 for ฿50 special' }, c: BRAND.green, p: [3.0, 2.55, -1.1] },
    { t: { th: 'อีเลฟเว่น คาเฟ่ ลด 50%', en: '11 Café 50% off' }, c: BRAND.orange, p: [0.0, 2.55, -7.4] },
  ];
  banners.forEach((b) => { const g = aisleHang(b.t, 1.5, 0.42, b.c); g.position.set(...b.p); ctx.root.add(g); });
  // front-glass decals: one face reads correctly from the street, the other from inside the shop
  const glassDecal = (w, h, draw, x, y) => {
    const s = makeSign(w, h, 240, draw, { transparent: true, side: THREE.FrontSide });
    s.mesh.position.set(x, y, -0.012); s.mesh.rotation.y = Math.PI; ctx.root.add(s.mesh);
    const o = new THREE.Mesh(s.mesh.geometry, s.mat); o.position.set(x, y, 0.012); ctx.root.add(o);
  };
  glassDecal(0.62, 0.62, (c, W, H) => { c.clearRect(0, 0, W, H); circle(c, W / 2, H / 2, W * 0.48, BRAND.green); fitText(c, '24', W * 0.18, H * 0.16, W * 0.64, H * 0.4, { family: 'anton', weight: 400, size: H * 0.36, color: '#fff' }); langText(c, { th: 'ชั่วโมง', en: 'HOURS' }, W * 0.15, H * 0.56, W * 0.7, H * 0.26, { family: 'kanit', weight: 700, size: H * 0.2, color: '#fff', lines: 1, lines2: 1 }); }, 0.0, 2.35);
  glassDecal(1.1, 0.4, (c, W, H) => { c.clearRect(0, 0, W, H); fillRR(c, 0, 0, W, H, H * 0.2, '#123e70'); langText(c, { th: 'จ่ายบิลได้ที่นี่', en: 'Pay bills here' }, W * 0.05, H * 0.08, W * 0.9, H * 0.84, { family: 'kanit', weight: 700, size: H * 0.6, color: '#fff', lines: 1, lines2: 1, split: 0.6 }); }, 3.8, 2.05);
  glassDecal(1.1, 0.4, (c, W, H) => { c.clearRect(0, 0, W, H); fillRR(c, 0, 0, W, H, H * 0.2, '#f58220'); langText(c, { th: 'อีเลฟเว่น คาเฟ่ กาแฟสด', en: '11 Café fresh coffee' }, W * 0.05, H * 0.08, W * 0.9, H * 0.84, { family: 'kanit', weight: 700, size: H * 0.6, color: '#fff', lines: 1, lines2: 1, split: 0.6 }); }, -3.9, 2.05);
  glassDecal(1.0, 0.4, (c, W, H) => { c.clearRect(0, 0, W, H); fillRR(c, 0, 0, W, H, H * 0.2, '#5b2a86'); langText(c, { th: 'มีตู้เอทีเอ็ม', en: 'ATM inside' }, W * 0.05, H * 0.08, W * 0.9, H * 0.84, { family: 'kanit', weight: 700, size: H * 0.6, color: '#fff', lines: 1, lines2: 1, split: 0.6 }); }, -5.2, 2.05);
}

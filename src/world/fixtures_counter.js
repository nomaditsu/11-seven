// Cashier counter: POS stations, hot-food cabinets, 11 Café machine, impulse rack, and the (legally) hidden tobacco cabinet.
import * as THREE from 'three';
import { M, std, basic } from './materials.js';
import { Kit } from './kit.js';
import { L } from './layout.js';
import { makeSign, LTex } from '../gfx/localized.js';
import { langText, fitText, fillRR, circle, rrPath, makeCanvas } from '../gfx/draw.js';
import { BRAND, drawStripes, drawLogo } from '../gfx/logo11seven.js';
import { addCollider } from './colliders.js';
import { canvasTex, glowTex } from '../gfx/surfaces.js';
import { pick, lang } from '../core/i18n.js';

// A believable-looking QR code (not scannable): finder patterns + noise modules
export function drawFakeQR(ctx, x, y, size, seed = 5) {
  const n = 25, m = size / n;
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#111';
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const inFinder = (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9);
    if (!inFinder && rnd() > 0.52) ctx.fillRect(x + i * m, y + j * m, m + 0.3, m + 0.3);
  }
  const finder = (fx, fy) => {
    ctx.fillStyle = '#111'; ctx.fillRect(x + fx * m, y + fy * m, 7 * m, 7 * m);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + (fx + 1) * m, y + (fy + 1) * m, 5 * m, 5 * m);
    ctx.fillStyle = '#111'; ctx.fillRect(x + (fx + 2) * m, y + (fy + 2) * m, 3 * m, 3 * m);
  };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
}

export function buildCounter(ctx) {
  const c = L.counter, k = new Kit('counter');
  const xC0 = c.x0, xC1 = c.x1, z0 = c.z0, z1 = c.z1;
  const topY = 1.0;
  // base cabinet
  k.box(M.laminate, xC0, 0, z0, xC1, topY - 0.04, z1, { tile: 0.6, solid: 'counter' });
  // tri-colour stripes wrapping the customer-facing side
  k.box(M.orange, xC0 - 0.006, 0.66, z0, xC0, 0.72, z1);
  k.box(M.green, xC0 - 0.006, 0.6, z0, xC0, 0.66, z1);
  k.box(M.red, xC0 - 0.006, 0.54, z0, xC0, 0.6, z1);
  k.box(M.darkGrey, xC0 - 0.004, 0, z0, xC0 + 0.002, 0.1, z1);                    // kick
  // granite top with an overhang on the customer side
  k.box(M.counterTop, xC0 - 0.05, topY - 0.04, z0 - 0.02, xC1 + 0.02, topY, z1 + 0.02, { tile: 0.8 });
  // raised glass-fronted lip for impulse items on the customer side
  addCollider(xC0 - 0.05, z0, xC1 + 0.02, z1, 'counter');

  // ---------------- impulse rack: a low rack against the counter front, under the granite overhang, facing the
  // customers in the queue (gum, lighters, inhalers, balms). Kept below the counter top so it hides nothing.
  {
    const rz0 = -4.7, rz1 = -2.2, rx1 = xC0 - 0.008, rx0 = rx1 - 0.24, top = 0.9;
    k.box(M.darkGrey, rx0 + 0.02, 0, rz0, rx1, 0.06, rz1, { solid: 'rack' });                   // plinth (set back 2 cm)
    k.box(M.pegboard, rx1 - 0.02, 0.06, rz0, rx1, top, rz1, { tile: 0.3048 });                   // back panel against the counter
    for (const [a, b] of [[rz0 - 0.02, rz0], [rz1, rz1 + 0.02]]) k.box(M.white, rx0, 0, a, rx1, top, b);   // side panels
    k.box(M.orange, rx0 - 0.003, top, rz0 - 0.023, rx1, top + 0.03, rz1 + 0.023);                // top cap
    [0.2, 0.45, 0.7].forEach((y, i) => {
      k.box(M.white, rx0 + 0.012, y - 0.025, rz0 + 0.0015, rx1 - 0.02, y, rz1 - 0.0015);         // plank
      k.box(M.lightGrey, rx0, y - 0.035, rz0 + 0.003, rx0 + 0.012, y + 0.02, rz1 - 0.003);      // price-tag lip on the customer side
      ctx.shelves.push({ pool: 'impulse', tag: `IMP${i}`, x: rx0, z: rz0, y, dx: 0, dz: 1, ox: -1, oz: 0, len: rz1 - rz0, dep: 0.2, clear: 0.18, lean: 0.03, tint: 1, order: ctx.shelves.length });
    });
  }

  // ---------------- POS stations (customer sees the back of the monitor, the scanner, printer, QR)
  const dark = M.black, plastic = std({ color: 0xdadde0, roughness: 0.45 });
  const posAt = (z, active) => {
    // monitor
    k.box(dark, 4.05, topY, z - 0.03, 4.13, topY + 0.16, z + 0.03);                         // stand
    const mon = new THREE.Group();
    const mBody = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.4), dark);
    mon.add(mBody); mon.position.set(4.08, topY + 0.28, z); mon.rotation.z = 0.0;
    ctx.root.add(mon);
    // screen on the cashier side (+x)
    const scr = makeSign(0.37, 0.22, 380, (c2, W, H) => posScreen(c2, W, H, active), {});
    scr.mesh.rotation.y = Math.PI / 2; scr.mesh.position.set(4.096, topY + 0.28, z); ctx.root.add(scr.mesh);
    if (active) ctx.posScreen = scr;
    // customer display pole (facing -x)
    k.box(dark, 3.72, topY, z - 0.02, 3.76, topY + 0.24, z + 0.02);
    const cd = makeSign(0.2, 0.09, 420, (c2, W, H) => {
      c2.fillStyle = '#0a1a10'; c2.fillRect(0, 0, W, H);
      langText(c2, { th: 'ยินดีต้อนรับ', en: 'Welcome' }, W * 0.05, H * 0.08, W * 0.9, H * 0.4, { family: 'kanit', weight: 500, size: H * 0.4, color: '#7dff9c', lines: 1 });
      fitText(c2, active ? '฿ 0.00' : '', W * 0.05, H * 0.5, W * 0.9, H * 0.42, { family: 'kanit', weight: 700, size: H * 0.42, color: '#7dff9c', align: 'right' });
    }, {});
    cd.mesh.rotation.y = -Math.PI / 2; cd.mesh.position.set(3.7, topY + 0.2, z); ctx.root.add(cd.mesh);
    if (active) ctx.posCustomerDisplay = cd;
    // scanner (glass plate), printer, EDC
    k.box(dark, 3.78, topY, z + 0.16, 4.02, topY + 0.03, z + 0.4);
    k.box(M.ledCool, 3.8, topY + 0.03, z + 0.2, 4.0, topY + 0.034, z + 0.36);
    k.box(plastic, 3.85, topY, z - 0.46, 4.05, topY + 0.14, z - 0.22);                     // receipt printer
    k.box(dark, 3.86, topY + 0.14, z - 0.42, 4.0, topY + 0.16, z - 0.26);
    k.box(M.white, 3.68, topY, z + 0.42, 3.78, topY + 0.19, z + 0.5);                     // EDC card terminal
    k.box(dark, 3.69, topY + 0.19, z + 0.425, 3.77, topY + 0.2, z + 0.495);
    k.box(M.ledCool, 3.7, topY + 0.14, z + 0.5, 3.76, topY + 0.145, z + 0.51);
  };
  posAt(-2.7, true);
  posAt(-3.9, false);
  // PromptPay QR stand (acrylic)
  const qr = makeSign(0.16, 0.22, 500, (c2, W, H) => {
    c2.fillStyle = '#fff'; c2.fillRect(0, 0, W, H);
    c2.fillStyle = '#123e70'; c2.fillRect(0, 0, W, H * 0.16);
    fitText(c2, 'PromptPay', W * 0.06, H * 0.02, W * 0.88, H * 0.12, { family: 'kanit', weight: 700, size: H * 0.12, color: '#fff' });
    drawFakeQR(c2, W * 0.12, H * 0.2, W * 0.76, 7);
    langText(c2, { th: 'สแกนจ่ายได้เลย', en: 'Scan to pay' }, W * 0.05, H * 0.84, W * 0.9, H * 0.14, { family: 'kanit', weight: 700, size: H * 0.11, color: '#123e70', lines: 1, lines2: 1 });
  }, {});
  qr.mesh.rotation.y = -Math.PI / 2 - 0.25; qr.mesh.position.set(3.66, topY + 0.13, -3.3); ctx.root.add(qr.mesh);
  k.box(M.black, 3.64, topY, -3.32, 3.7, topY + 0.02, -3.16);

  // ---------------- donation box, mini display cases on the counter top
  const acr = new THREE.MeshStandardMaterial({ color: 0xddeeff, transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false });
  const don = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.2), acr); don.position.set(3.855, topY + 0.13, -1.85); ctx.root.add(don);
  const donLab = makeSign(0.18, 0.09, 400, (c2, W, H) => { c2.fillStyle = '#c8102e'; c2.fillRect(0, 0, W, H); langText(c2, { th: 'ร่วมบริจาค', en: 'Donations' }, 4, 2, W - 8, H - 4, { family: 'mitr', weight: 700, size: H * 0.7, color: '#fff', lines: 1 }); }, {});
  donLab.mesh.rotation.y = -Math.PI / 2; donLab.mesh.position.set(3.749, topY + 0.2, -1.85); ctx.root.add(donLab.mesh);

  // ---------------- hot foods: steamer, roller grill, hot case, 11 Café — on the counter top (z -4.7 .. -7.6)
  hotFoods(k, ctx, topY);

  // ---------------- behind the counter: tobacco cabinet with opaque shutters, staff fridge, shelves
  const wx = L.x1;
  k.box(M.white, wx - 0.4, 0, -4.9, wx, 2.1, -1.7, { solid: 'cabinet', tile: 0.5 });
  k.box(M.coolFrame, wx - 0.42, 0.98, -4.9, wx - 0.4, 2.1, -1.7);
  for (let z = -4.85; z < -1.75; z += 0.55) k.box(M.grey, wx - 0.43, 1.0, z, wx - 0.41, 2.06, z + 0.5);          // shuttered doors
  k.box(M.orange, wx - 0.433, 0.94, -4.903, wx - 0.4, 0.98, -1.697);
  addCollider(wx - 0.4, -4.9, wx, -1.7, 'cabinet');
  k.box(M.lightGrey, wx - 0.5, 0, -7.6, wx, 0.9, -5.2, { solid: 'staff' });   // staff storage
  k.box(M.counterTop, wx - 0.55, 0.9, -7.6, wx, 0.94, -5.2);
  k.build(ctx.root);
  ctx.occluders.push(...ctx.root.children.filter((c2) => c2.name === 'counter'));

  // tobacco cabinet sign (Thai law: no display, no sale to under-20s)
  const sign = makeSign(1.5, 0.3, 300, (c2, W, H) => {
    c2.fillStyle = '#fff'; c2.fillRect(0, 0, W, H); c2.fillStyle = '#c8102e'; c2.fillRect(0, 0, W, H * 0.12);
    langText(c2, { th: 'ไม่จำหน่ายบุหรี่ให้ผู้มีอายุต่ำกว่า 20 ปี', en: 'No tobacco sales to persons under 20' }, W * 0.04, H * 0.16, W * 0.92, H * 0.5, { family: 'kanit', weight: 700, size: H * 0.4, color: '#c8102e', lines: 2, lines2: 1, split: 0.6 });
    langText(c2, { th: 'สินค้าควบคุมตามกฎหมาย กรุณาสอบถามพนักงาน', en: 'Controlled product — please ask staff' }, W * 0.04, H * 0.66, W * 0.92, H * 0.3, { family: 'sarabun', weight: 700, size: H * 0.2, color: '#333', lines: 1, lines2: 1 });
  }, {});
  sign.mesh.rotation.y = -Math.PI / 2; sign.mesh.position.set(wx - 0.435, 1.92, -3.3); ctx.root.add(sign.mesh);

  // CCTV monitor on the back wall
  const cctv = new LTex(384, 216, (c2, W, H) => {
    c2.fillStyle = '#0c0d10'; c2.fillRect(0, 0, W, H);
    const cams = [['#243044', 'CAM 01'], ['#2a3b34', 'CAM 02'], ['#3a3040', 'CAM 03'], ['#303a44', 'CAM 04']];
    cams.forEach(([col, name], i) => {
      const cx = (i % 2) * (W / 2), cy = Math.floor(i / 2) * (H / 2);
      const g = c2.createLinearGradient(cx, cy, cx + W / 2, cy + H / 2); g.addColorStop(0, col); g.addColorStop(1, '#0b0c0f');
      c2.fillStyle = g; c2.fillRect(cx + 2, cy + 2, W / 2 - 4, H / 2 - 4);
      c2.strokeStyle = 'rgba(255,255,255,.12)'; c2.lineWidth = 1;
      for (let s = 0; s < 6; s++) { c2.beginPath(); c2.moveTo(cx + 6 + s * 30, cy + H / 2 - 8); c2.lineTo(cx + 40 + s * 22, cy + 10); c2.stroke(); }
      c2.fillStyle = '#e04'; c2.beginPath(); c2.arc(cx + 10, cy + 10, 3, 0, 6.3); c2.fill();
      c2.fillStyle = '#ddd'; c2.font = '600 9px Sarabun'; c2.fillText(name + '  ' + new Date().toISOString().slice(0, 10), cx + 16, cy + 13);
    });
  }, { localized: false });
  const cm = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.35), new THREE.MeshBasicMaterial({ map: cctv.texture }));
  cm.position.set(wx - 0.026, 2.3, -6.4); cm.rotation.y = -Math.PI / 2; ctx.root.add(cm);
  const cmFrame = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.68), M.black); cmFrame.position.set(wx - 0.005, 2.3, -6.4); ctx.root.add(cmFrame);
}

function posScreen(c, W, H, active) {
  c.fillStyle = '#eaf2f8'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#00874a'; c.fillRect(0, 0, W, H * 0.13);
  fitText(c, '7-ELEVEN POS', W * 0.03, H * 0.01, W * 0.5, H * 0.11, { family: 'kanit', weight: 700, size: H * 0.1, color: '#fff', align: 'left' });
  for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#fff' : '#f3f8fb'; c.fillRect(W * 0.03, H * (0.16 + i * 0.09), W * 0.6, H * 0.085); }
  c.fillStyle = '#d5dde3'; c.fillRect(W * 0.66, H * 0.16, W * 0.31, H * 0.78);
  for (let i = 0; i < 12; i++) { c.fillStyle = '#fff'; c.fillRect(W * (0.675 + (i % 3) * 0.1), H * (0.19 + Math.floor(i / 3) * 0.13), W * 0.09, H * 0.11); }
  fitText(c, active ? '฿ 0.00' : '', W * 0.03, H * 0.72, W * 0.6, H * 0.2, { family: 'kanit', weight: 700, size: H * 0.18, color: '#00874a', align: 'right' });
}

// ---------------------------------------------------------------------------------------------- hot foods & 11 Café
function hotFoods(k, ctx, topY) {
  const glass = new THREE.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
  const warm = basic(new THREE.Color(2.0, 1.55, 0.9));
  const steel = M.steel;
  // ---- steamer (ซาลาเปา), z -4.9 .. -5.5
  const zs0 = -5.5, zs1 = -4.85;
  k.box(steel, 3.7, topY, zs0, 4.28, topY + 0.06, zs1);
  k.box(steel, 3.7, topY + 0.56, zs0, 4.28, topY + 0.6, zs1);
  k.box(steel, 3.7, topY + 0.06, zs0, 3.72, topY + 0.56, zs0 + 0.02); k.box(steel, 3.7, topY + 0.06, zs1 - 0.02, 3.72, topY + 0.56, zs1);
  k.box(warm, 3.74, topY + 0.54, zs0 + 0.04, 4.24, topY + 0.56, zs1 - 0.04);
  ctx.shelves.push({ pool: 'steamer', tag: 'STM0', x: 3.98, z: zs1 - 0.03, y: topY + 0.065, dx: 0, dz: -1, ox: -1, oz: 0, len: zs1 - zs0 - 0.06, dep: 0.52, clear: 0.2, lean: 0, tint: 1.12, noTag: true, order: ctx.shelves.length });
  ctx.shelves.push({ pool: 'steamer', tag: 'STM1', x: 3.98, z: zs1 - 0.03, y: topY + 0.3, dx: 0, dz: -1, ox: -1, oz: 0, len: zs1 - zs0 - 0.06, dep: 0.52, clear: 0.22, lean: 0, tint: 1.12, noTag: true, order: ctx.shelves.length });
  k.box(steel, 3.7, topY + 0.29, zs0, 4.28, topY + 0.3, zs1);
  // ---- roller grill (sausages), z -5.7 .. -6.3
  const zg0 = -6.35, zg1 = -5.72;
  k.box(steel, 3.72, topY, zg0, 4.24, topY + 0.1, zg1);
  k.box(steel, 3.72, topY + 0.34, zg0, 4.24, topY + 0.36, zg1);
  k.box(warm, 3.76, topY + 0.32, zg0 + 0.04, 4.2, topY + 0.34, zg1 - 0.04);
  ctx.rollers = [];
  const rollerMat = std({ color: 0xc9cdd1, metalness: 0.9, roughness: 0.25 });
  for (let i = 0; i < 6; i++) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.6, 10), rollerMat);
    r.rotation.z = Math.PI / 2; r.position.set(3.98, topY + 0.14, zg1 - 0.06 - i * 0.1); r.userData.keep = true; ctx.root.add(r); ctx.rollers.push(r);
  }
  ctx.shelves.push({ pool: 'grill', tag: 'GRL0', x: 3.98 + 0.0, z: zg1 - 0.03, y: topY + 0.155, dx: 0, dz: -1, ox: -1, oz: 0, len: zg1 - zg0 - 0.06, dep: 0.5, clear: 0.15, lean: 0, tint: 1.1, noTag: true, rotAlong: true, order: ctx.shelves.length });
  // glass hoods
  const hood1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, zs1 - zs0 + 0.008), glass);   // glass sits just outside the steel ends hood1.position.set(3.99, topY + 0.31, (zs0 + zs1) / 2); ctx.root.add(hood1);
  const hood2 = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.3, zg1 - zg0 + 0.008), glass); hood2.position.set(3.98, topY + 0.2, (zg0 + zg1) / 2); ctx.root.add(hood2);
  // ---- hot case (fried chicken, spring rolls), z -6.45 .. -7.05
  const zh0 = -7.08, zh1 = -6.45;
  k.box(steel, 3.7, topY, zh0, 4.3, topY + 0.08, zh1);
  k.box(steel, 3.7, topY + 0.5, zh0, 4.3, topY + 0.54, zh1);
  k.box(warm, 3.74, topY + 0.48, zh0 + 0.04, 4.26, topY + 0.5, zh1 - 0.04);
  ctx.shelves.push({ pool: 'hotcase', tag: 'HOT0', x: 3.98, z: zh1 - 0.03, y: topY + 0.085, dx: 0, dz: -1, ox: -1, oz: 0, len: zh1 - zh0 - 0.06, dep: 0.5, clear: 0.2, lean: 0, tint: 1.12, noTag: true, order: ctx.shelves.length });
  const hood3 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.46, zh1 - zh0 + 0.008), glass); hood3.position.set(4.0, topY + 0.29, (zh0 + zh1) / 2); ctx.root.add(hood3);
  // labels facing customers
  const lab = (txt, z, y) => {
    const s = makeSign(0.34, 0.09, 400, (c, W, H) => { c.fillStyle = '#c8102e'; c.fillRect(0, 0, W, H); langText(c, txt, 4, 2, W - 8, H - 4, { family: 'mitr', weight: 700, size: H * 0.7, color: '#fff', lines: 1, lines2: 1, split: 0.6 }); }, {});
    s.mesh.rotation.y = -Math.PI / 2; s.mesh.position.set(3.695, y, z); ctx.root.add(s.mesh);
  };
  lab({ th: 'ซาลาเปา', en: 'Steamed buns' }, (zs0 + zs1) / 2, topY + 0.68);
  lab({ th: 'ไส้กรอก', en: 'Sausages' }, (zg0 + zg1) / 2, topY + 0.45);
  lab({ th: 'ของทอดร้อนๆ', en: 'Hot fried snacks' }, (zh0 + zh1) / 2, topY + 0.62);
  // ---- 11 Café machine, z -7.15 .. -7.6
  const zc0 = -7.62, zc1 = -7.12;
  const mach = std({ color: 0x2a1a10, roughness: 0.35, metalness: 0.5 });
  k.box(mach, 3.72, topY, zc0, 4.3, topY + 0.55, zc1);
  k.box(M.orange, 3.717, topY + 0.55, zc0 - 0.003, 4.303, topY + 0.6, zc1 + 0.003);
  k.box(M.steel, 3.74, topY + 0.02, zc0 + 0.03, 3.9, topY + 0.14, zc1 - 0.03);        // drip tray
  const scr = makeSign(0.26, 0.2, 300, (c, W, H) => {
    c.fillStyle = '#1a0f08'; c.fillRect(0, 0, W, H);
    fillRR(c, W * 0.04, H * 0.04, W * 0.92, H * 0.24, 6, '#f58220');
    fitText(c, '11 CAFÉ', W * 0.1, H * 0.05, W * 0.8, H * 0.22, { family: 'kanit', weight: 900, size: H * 0.2, color: '#fff' });
    const items = [{ th: 'อเมริกาโน่', en: 'Americano' }, { th: 'ลาเต้', en: 'Latte' }, { th: 'ชาไทยเย็น', en: 'Thai iced tea' }, { th: 'โกโก้', en: 'Cocoa' }];
    items.forEach((it, i) => { const bx = W * (0.05 + (i % 2) * 0.47), by = H * (0.34 + Math.floor(i / 2) * 0.32); fillRR(c, bx, by, W * 0.43, H * 0.28, 6, '#3a2418', '#f58220', 1.5); langText(c, it, bx + 4, by + 2, W * 0.43 - 8, H * 0.28 - 4, { family: 'kanit', weight: 700, size: H * 0.16, color: '#ffd9a8', lines: 1, lines2: 1, split: 0.6 }); });
  }, {});
  scr.mesh.rotation.y = -Math.PI / 2; scr.mesh.position.set(3.7, topY + 0.34, (zc0 + zc1) / 2); ctx.root.add(scr.mesh);
  ctx.interactables.push({ id: 'coffee', kind: 'coffee', box: new THREE.Box3(new THREE.Vector3(3.65, topY, zc0), new THREE.Vector3(4.3, topY + 0.6, zc1)), maxDist: 2.6 });
  // cups & lids next to the machine
  const cupMat = std({ color: 0xf6f0e6, roughness: 0.6 });
  for (let i = 0; i < 4; i++) k.cyl(cupMat, 4.22, topY + 0.6 + i * 0.004, zc1 - 0.06 - i * 0.02, 0.04, 0.03, 0.11, { seg: 12 });
  // sugar / stirrer caddy
  k.box(M.white, 3.78, topY, zc1 + 0.002, 3.9, topY + 0.09, zc1 + 0.036);   // fits the gap before the hot case (z -7.08)
}

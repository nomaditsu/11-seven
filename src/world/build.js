// Assembles the whole store: fixtures -> planogram -> instanced products.
import * as THREE from 'three';
import { L } from './layout.js';
import { buildGondola, buildWallUnit } from './fixtures_gondola.js';
import { buildCoolerWall, buildOpenChiller } from './fixtures_cooler.js';
import { buildCounter } from './fixtures_counter.js';
import { buildATMs, buildHotWater, buildWindowBar, buildIslands, buildBaskets, buildDecor, buildPosters } from './fixtures_misc.js';
import { ProductWorld, PriceTags } from './products.js';
import { fillShelves } from './planogram.js';
import { SKUS } from '../data/skus.js';
import { selectPool, poolOf } from '../data/pools.js';
import { nextFrame } from '../core/util.js';
import { bakeStatic } from './bake.js';

const T = (en, th) => ({ en, th });

export async function buildStoreContents(scene, quality, progress = () => {}) {
  const ctx = {
    root: new THREE.Group(), shelves: [], occluders: [], interactables: [], alcoholCovers: [], stools: [],
    rollers: [], posScreen: null,
  };
  ctx.root.name = 'fixtures';
  scene.add(ctx.root);

  // ---- gondolas (centre of the shop floor)
  const G = L.gond;
  buildGondola(ctx, { ...G[0], poolA: ['noodle', 'noodle', 'noodle', 'cupnoodle', 'cupnoodle'], poolB: ['grocery', 'grocery', 'grocery', 'grocery', 'grocery'], poolEndF: 'promo', signF: T('Instant noodles', 'บะหมี่กึ่งสำเร็จรูป'), signB: T('Pantry', 'ของแห้งและเครื่องปรุง') });
  buildGondola(ctx, { ...G[1], poolA: ['chips', 'chips', 'chips', 'chips', 'chips'], poolB: ['snack2', 'snack2', 'snack2', 'snack2', 'snack2'], poolEndF: 'promo', signF: T('Snacks', 'ขนมขบเคี้ยว'), signB: T('Nuts & seaweed', 'ถั่วและสาหร่าย') });
  buildGondola(ctx, { ...G[2], poolA: ['sweet1', 'sweet1', 'sweet1', 'sweet1', 'sweet1'], poolB: ['sweet2', 'sweet2', 'sweet2', 'sweet2', 'sweet2'], poolEndF: 'promo', signF: T('Sweets & chocolate', 'ลูกอมและช็อกโกแลต'), signB: T('Biscuits', 'บิสกิต') });
  buildGondola(ctx, { ...G[3], poolA: ['household', 'household', 'household', 'household', 'household'], poolB: ['care', 'care', 'care', 'care', 'care'], signF: T('Household', 'ของใช้ในบ้าน'), signB: T('Personal care', 'ของใช้ส่วนตัว') });
  await nextFrame();

  // ---- wall units and chillers
  buildWallUnit(ctx, { id: 'R', side: 1, z0: L.wallR.z0, z1: L.wallR.z1, pool: ['health', 'health', 'health', 'misc', 'misc', 'misc'], sign: T('Health & everyday items', 'ยาสามัญและของใช้จำเป็น') });
  buildOpenChiller(ctx, {
    pools: ['meal', 'meal', 'sandwich', 'dessert'],
    headers: [{ title: T('Ready meals', 'อาหารพร้อมทาน'), color: '#00874a' }, { title: T('Sandwiches & onigiri', 'แซนวิชและข้าวปั้น'), color: '#f58220' }, { title: T('Desserts & fruit', 'ของหวานและผลไม้'), color: '#e31e24' }],
  });
  const bays = [
    { title: T('Water', 'น้ำดื่ม'), pool: 'water', color: '#1e7fd6' }, { title: T('Water & sports', 'น้ำดื่มและสปอร์ตดริงก์'), pools: ['water', 'water', 'sport', 'sport', 'sport'], color: '#1e7fd6' },
    { title: T('Soft drinks', 'น้ำอัดลม'), pool: 'soda', color: '#e31e24' }, { title: T('Soft drinks', 'น้ำอัดลม'), pool: 'soda', color: '#e31e24' },
    { title: T('Energy drinks', 'เครื่องดื่มชูกำลัง'), pool: 'energy', color: '#f5a300' }, { title: T('Tea & juice', 'ชาและน้ำผลไม้'), pools: ['tea', 'tea', 'juice', 'juice', 'juice'], color: '#00874a' },
    { title: T('Milk & yoghurt', 'นมและโยเกิร์ต'), pool: 'dairy', color: '#1467c8' }, { title: T('Coffee', 'กาแฟ'), pool: 'coffee', color: '#6b3e1c' },
    { title: T('Beer', 'เบียร์'), pool: 'beer', color: '#0b3d2e', alcohol: true }, { title: T('Beer & spirits', 'เบียร์และสุรา'), pools: ['beer', 'beer', 'beer', 'spirits', 'spirits'], color: '#0b3d2e', alcohol: true },
    { title: T('Ice cream', 'ไอศกรีม'), pool: 'icecream', color: '#e6007e', freezer: true }, { title: T('Ice cream & frozen', 'ไอศกรีมและของแช่แข็ง'), pools: ['icecream', 'icecream', 'frozen', 'frozen', 'frozen'], color: '#e6007e', freezer: true },
  ];
  buildCoolerWall(ctx, bays);
  await nextFrame();

  // ---- counter, ATMs, hot water, seating, islands, baskets, decor
  buildCounter(ctx);
  buildATMs(ctx);
  buildHotWater(ctx);
  buildWindowBar(ctx);
  buildIslands(ctx);
  buildBaskets(ctx);
  buildDecor(ctx);
  buildPosters(ctx);
  await nextFrame();

  const baked = bakeStatic(ctx.root);
  if (typeof console !== 'undefined' && window.__bakeLog) console.log('[bake] fixtures', baked.before, '->', baked.after);

  // ---- stock the shelves
  const pw = new ProductWorld(scene, quality);
  const tags = new PriceTags(SKUS);
  const byPool = new Map();
  for (const sh of ctx.shelves) { if (!byPool.has(sh.pool)) byPool.set(sh.pool, []); byPool.get(sh.pool).push(sh); }
  const report = [], fills = [];
  for (const [pool, shelves] of byPool) {
    shelves.sort((a, b) => a.order - b.order);
    const skus = selectPool(pool, SKUS);
    if (!skus.length) { report.push(`pool ${pool}: no SKUs (${shelves.length} shelves empty)`); continue; }
    const res = fillShelves(pw, tags, skus, shelves, { rows: quality.rows });
    if (res.skipped.length) report.push(`pool ${pool}: ${res.skipped.length} SKUs did not fit: ${res.skipped.map((s) => s.id).join(', ')}`);
    fills.push(`${pool}:${skus.length}sku/${shelves.length}sh/${Math.round(res.fill * 100)}%`);
  }
  pw.build();
  for (const [id, lt] of pw.skuTex) {
    const slots = pw.byId.get(id) || [];
    const step = Math.max(1, Math.ceil(slots.length / 6));
    lt.anchors = slots.filter((_, i) => i % step === 0).map((sl) => ({ x: sl.x, z: sl.z }));
  }
  tags.build(ctx.root);
  const placed = new Set(); pw.slots.forEach((s) => placed.add(s.sku.id));
  const missing = SKUS.filter((s) => !placed.has(s.id) && poolOf(s) !== 'none');
  if (missing.length) report.push(`SKUs never placed: ${missing.map((s) => s.id).join(', ')}`);
  if (typeof console !== 'undefined') { if (report.length) console.warn('[planogram]\n' + report.join('\n')); if (window.__bakeLog || location.search.includes('debug')) console.log('[fill] ' + fills.join('  ')); }
  return { ctx, pw, tags, report };
}

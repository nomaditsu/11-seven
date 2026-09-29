// SKU database: merges the per-category files, applies category defaults and validates.
// To add products, create src/data/sku_<name>.js (see docs/design/sku-authoring.md) and register it in MODULES below.
import { BRANDS } from './brands.js';
import { GEO } from './shapes.js';
import { ILLUS } from '../gfx/illus.js';
import { ING } from './ingredients.js';
import * as snacks from './sku_snacks.js';
import * as cafe from './sku_cafe.js';
import * as drinksA from './sku_drinks_a.js';
import * as drinksB from './sku_drinks_b.js';
import * as freshA from './sku_fresh_a.js';
import * as freshB from './sku_fresh_b.js';
import * as home from './sku_home.js';
import * as noodles from './sku_noodles.js';
import * as sweets from './sku_sweets.js';

// category -> defaults. `pool` = which shelf group stocks it (see world/build.js).
export const CATS = {
  water:     { name: { en: 'Drinking water', th: 'น้ำดื่ม' }, ntype: 'water', g: 'pet600w', style: 'water', hero: 'waterDrop', pool: 'water' },
  sport:     { name: { en: 'Sports drinks', th: 'เครื่องดื่มเกลือแร่' }, ntype: 'drink', g: 'pet500', style: 'pet', hero: 'lightning', pool: 'sport' },
  soda:      { name: { en: 'Soft drinks', th: 'น้ำอัดลม' }, ntype: 'drink', g: 'pet500', style: 'pet', hero: 'iceGlass', pool: 'soda' },
  energy:    { name: { en: 'Energy & tonic drinks', th: 'เครื่องดื่มชูกำลัง' }, ntype: 'energy', g: 'glass150', style: 'energy', hero: 'lightning', pool: 'energy' },
  tea:       { name: { en: 'Tea', th: 'ชา' }, ntype: 'drink', g: 'pet500', style: 'pet', hero: 'teaLeaf', pool: 'tea' },
  juice:     { name: { en: 'Juice & plant drinks', th: 'น้ำผลไม้และเครื่องดื่มสมุนไพร' }, ntype: 'drink', g: 'pet345', style: 'pet', hero: 'orange', pool: 'juice' },
  dairy:     { name: { en: 'Milk & yoghurt drinks', th: 'นมและนมเปรี้ยว' }, ntype: 'dairy', g: 'gable-450', style: 'carton', hero: 'milkSplash', pool: 'dairy' },
  coffee:    { name: { en: 'Coffee drinks', th: 'กาแฟพร้อมดื่ม' }, ntype: 'drink', g: 'can185', style: 'can', hero: 'coffeeCup', pool: 'coffee' },
  beer:      { name: { en: 'Beer', th: 'เบียร์' }, ntype: 'beer', g: 'beer620', style: 'beer', hero: 'beerMug', pool: 'beer' },
  spirits:   { name: { en: 'Spirits & mixers', th: 'สุราและเครื่องผสม' }, ntype: 'beer', g: 'beer330', style: 'beer', hero: 'beerMug', pool: 'spirits' },
  chips:     { name: { en: 'Chips & crisps', th: 'มันฝรั่งและขนมกรอบ' }, ntype: 'chips', g: 'bag-m', style: 'chips', hero: 'chips', pool: 'chips' },
  seaweed:   { name: { en: 'Seaweed snacks', th: 'สาหร่าย' }, ntype: 'seaweed', g: 'bag-s', style: 'seaweed', hero: 'seaweed', pool: 'snack2' },
  nuts:      { name: { en: 'Nuts & dried snacks', th: 'ถั่วและขนมอบแห้ง' }, ntype: 'snack', g: 'bag-s', style: 'snack', hero: 'nuts', pool: 'snack2' },
  noodle:    { name: { en: 'Instant noodles', th: 'บะหมี่กึ่งสำเร็จรูป' }, ntype: 'noodle', g: 'bag-noodle', style: 'noodle', hero: 'noodleBowl', pool: 'noodle' },
  cupnoodle: { name: { en: 'Cup noodles', th: 'บะหมี่ถ้วย' }, ntype: 'cup', g: 'cup-noodle', style: 'cup', hero: 'noodleBowl', pool: 'cupnoodle' },
  grocery:   { name: { en: 'Pantry & condiments', th: 'ของแห้งและเครื่องปรุง' }, ntype: 'other', g: 'bottle-sauce', style: 'pet', hero: 'chili', pool: 'grocery' },
  candy:     { name: { en: 'Candy & gum', th: 'ลูกอมและหมากฝรั่ง' }, ntype: 'candy', g: 'bag-s', style: 'snack', hero: 'candy', pool: 'sweet1' },
  choc:      { name: { en: 'Chocolate & wafers', th: 'ช็อกโกแลตและเวเฟอร์' }, ntype: 'choc', g: 'box-choc', style: 'box', hero: 'chocBar', pool: 'sweet1' },
  biscuit:   { name: { en: 'Biscuits & cookies', th: 'บิสกิตและคุกกี้' }, ntype: 'biscuit', g: 'box-m', style: 'box', hero: 'cookie', pool: 'sweet2' },
  household: { name: { en: 'Household', th: 'ของใช้ในบ้าน' }, ntype: 'other', g: 'box-detergent', style: 'box', hero: 'soap', pool: 'household' },
  care:      { name: { en: 'Personal care', th: 'ของใช้ส่วนตัว' }, ntype: 'other', g: 'box-tooth', style: 'box', hero: 'toothpaste', pool: 'care' },
  health:    { name: { en: 'Health & remedies', th: 'ยาสามัญและสมุนไพร' }, ntype: 'other', g: 'box-xs', style: 'box', hero: 'inhaler', pool: 'health' },
  misc:      { name: { en: 'Everyday items', th: 'ของใช้จำเป็น' }, ntype: 'other', g: 'card', style: 'card', hero: 'battery', pool: 'misc' },
  meal:      { name: { en: 'Ready meals', th: 'อาหารพร้อมทาน' }, ntype: 'meal', g: 'tray-meal', style: 'meal', hero: 'plate', pool: 'meal' },
  sandwich:  { name: { en: 'Sandwiches & onigiri', th: 'แซนวิชและข้าวปั้น' }, ntype: 'sandwich', g: 'tray-sand', style: 'sandwich', hero: 'sandwich', pool: 'sandwich' },
  dessert:   { name: { en: 'Desserts & fruit', th: 'ของหวานและผลไม้' }, ntype: 'dessert', g: 'cup-dessert', style: 'tub', hero: 'mangoSlice', pool: 'dessert' },
  bakery:    { name: { en: 'Bakery', th: 'เบเกอรี่' }, ntype: 'bakery', g: 'bag-loaf', style: 'snack', hero: 'bread', pool: 'bakery' },
  hot:       { name: { en: 'Hot foods', th: 'อาหารร้อน' }, ntype: 'meal', g: 'bag-bun', style: 'snack', hero: 'bun', pool: 'hotcase' },
  icecream:  { name: { en: 'Ice cream', th: 'ไอศกรีม' }, ntype: 'ice', g: 'stick', style: 'stick', hero: 'iceStick', pool: 'icecream' },
  frozen:    { name: { en: 'Frozen', th: 'อาหารแช่แข็ง' }, ntype: 'meal', g: 'tray-meal', style: 'meal', hero: 'plate', pool: 'frozen' },
};

// registered SKU modules: each exports default SKU[] and optionally `brands` / `illus` maps
const MODULES = [snacks, cafe, drinksA, drinksB, freshA, freshB, home, noodles, sweets];

for (const m of MODULES) {
  if (m.brands) Object.assign(BRANDS, m.brands);
  if (m.illus) Object.assign(ILLUS, m.illus);
  if (m.ingredients) Object.assign(ING, m.ingredients);
}

function finalize(s) {
  const c = CATS[s.cat];
  if (!c) throw new Error(`SKU ${s.id}: unknown category ${s.cat}`);
  s.ntype ??= c.ntype; s.g ??= c.g; s.style ??= c.style; s.hero ??= c.hero;
  s.origin ??= 'th';
  s.pal = [...(s.pal || ['#888888', '#555555', '#ffcc00', '#ffffff'])];
  while (s.pal.length < 4) s.pal.push(s.pal[s.pal.length - 1]);
  if (!BRANDS[s.brand]) console.warn(`SKU ${s.id}: no brand style '${s.brand}'`);
  if (!GEO[s.g]) throw new Error(`SKU ${s.id}: unknown geometry ${s.g}`);
  if (!s.name || !s.name.en || !s.name.th) console.warn(`SKU ${s.id}: missing name translation`);
  for (const h of String(s.hero).split('+')) if (!ILLUS[h]) console.warn(`SKU ${s.id}: unknown hero '${h}'`);
  s.catName = c.name;
  s.pool ??= c.pool;
  return s;
}
export const SKUS = MODULES.flatMap((m) => m.default).map(finalize);
export const SKU_BY_ID = new Map(SKUS.map((s) => [s.id, s]));
if (SKU_BY_ID.size !== SKUS.length) console.warn('duplicate SKU ids!');

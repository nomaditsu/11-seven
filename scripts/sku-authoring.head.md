---
type: design
status: active
created: 2026-09-29
project: SEVN
---

# Authoring products (SKUs) for the 7 Eleven Simulator

The store is stocked from `src/data/sku_*.js` files. Each file exports **`default`: an array of SKU objects** and may also export three optional maps:

```js
export const brands = { mybrand: { text: 'MyBrand', th: 'ไทยแบรนด์', style: 'pill', bg: '#fff', fg: '#d00', font: 'lilita', ring: '#d00' } };
export const illus = { myHero(ctx, s, o) { /* draw centred on (0,0) within [-s/2, s/2]; import helpers from '../gfx/draw.js' */ } };
export const ingredients = { newkey: { en: 'Something', th: 'อะไรสักอย่าง' } };
```

Register a new file by adding `import * as x from './sku_x.js'` and appending `x` to `MODULES` in `src/data/skus.js`.

## The goal

Every product a shopper could realistically find in a **Bangkok 7-Eleven** (2025), in a stylised procedural look: correct **Thai names as printed on the real product**, a natural **English translation**, a realistic **baht price**, sensible package geometry, brand colours and a recognisable hero illustration. The player can flip the whole game between English / Thai / both, so **every visible string needs `en` and `th`** (use `T(en, th)` from `sku_util.js`; sizes via `g(48)`, `ml(600)`, `L(1.5)`, `pc(6)`, `kg(1)`).

Thai must be natural, correctly spelled and how Thai packaging really reads (e.g. `รสต้มยำกุ้ง`, `สาหร่ายย่าง`, `ข้าวกะเพราไก่ไข่ดาว`). Do not machine-translate. Keep names short: ≤ ~26 characters per language so they fit the label plate (a `·` inside a name becomes a line break, e.g. `T('Grilled Seaweed · Original', 'สาหร่ายย่าง · รสดั้งเดิม')`).

Content rules: no tobacco products (Thai law hides them; the game keeps them out of sight). Alcohol is fine (beer, spirits, wine coolers) but keep it matter-of-fact. Only state facts you are confident about; when unsure, keep descriptions generic ("a popular Thai snack"). Real brand names are used descriptively; artwork is stylised, never a copy of trademarked logos.

## SKU fields

```js
{
  id: 'lays-nori',                  // unique kebab-case id
  cat: 'chips',                     // category key (see CATS in src/data/skus.js) — supplies defaults for g/style/hero/pool
  brand: 'lays',                    // key into BRANDS (existing list below, or add your own via `export const brands`)
  name: T('Nori Seaweed', 'สาหร่ายโนริ'),        // flavour / variant / product name printed on the pack  (REQUIRED en+th)
  sub:  T('Potato chips', 'มันฝรั่งทอดกรอบ'),     // optional descriptor line
  price: 20,                        // baht
  size: g(48),                      // net contents shown on the pack and the price tag
  g: 'bag-m',                       // geometry preset (table below). Defaults from the category.
  style: 'chips',                   // painter style. chips | snack | noodle | seaweed (pillow bags) · pet | water | can | beer | energy | tube | cup | tub (bottles, cans…) · box | carton (boxes, gable milk cartons) · meal | sandwich | onigiri | salad | fruit (chilled trays) · card | stick (hang-cards, ice-cream bars)
  pal: ['#23a35a', '#0e6b36', '#ffd400', '#0a3d1e'],   // [main, dark/secondary, accent (name plate/badge), extra (liquid/cap/body)]
  hero: 'chips',                    // illustration; combine with + e.g. 'seaweed+chips'. heroOpts: { c1, c2, bowl, topping: 'shrimp'|'pork'|'egg'|'veg', kind (for hero 'plate') }
  ing: ['potato', 'palm', 'salt'],  // ingredient keys (table below) → back-of-pack text in both languages
  allergens: ['soy'],               // allergen keys
  desc: T('English blurb, 1–2 short sentences, fun and accurate.', 'คำอธิบายภาษาไทยที่เป็นธรรมชาติ'),   // shown in the inspect card & codex
  pop: 1,                           // 1–3 popularity → more shelf facings
  isNew: false,                     // "NEW / ใหม่" burst on bags & boxes
  promo: T('2 for ฿30', '2 ชิ้น 30 บาท'),  // optional promo strip on the shelf price tag (put on ~10% of SKUs)
  impulse: true,                    // small items that also belong on the counter rack (gum, mints, lighters, balm…)
  heat: true,                       // ready meal that the cashier will offer to microwave ("อุ่นไหมคะ?")
  alcohol: true, abv: 5.0,          // beers / spirits
  origin: 'th',                     // th (default) jp kr id my us de ch nl dk sg cn au uk it vn → barcode prefix + "Made in"
  // optional look tweaks: plate: 'pill'|'ribbon'|'burst'|'rect'|'none', bg: 'rays'|'stripes'|'dots'|'waves'|'zig'|'burst'|'plain',
  // font: 'mitr'|'kanit'|'pattaya'|'itim'|'chonburi'|'sriracha'|'lilita'|'bangers'|'anton'|'pacifico'|'fredoka'…, capColor, body (liquid/glass colour), neck (beer neck foil), foil, dish (for hero 'plate': basil|chickenrice|friedrice|greencurry|padthai|spaghetti|omelette|porkgarlic|somtam|congee|terijaki), topping, strip: N (sachets hanging in a vertical strip)
}
```

Palette tips: the pack should read as the real product from across an aisle (Mama Tom Yum = red/yellow, Pepsi = blue/red, Lay's Original = yellow, Nori = green…). `pal[2]` is the flavour-plate colour and must contrast with the text (text colour is picked automatically).

## How to verify your work (visual QA loop)

```bash
ln -s /home/user/7-eleven-simulator/node_modules node_modules      # once, inside your worktree
node scripts/build.mjs                                               # bundles everything into index.html
node scripts/sheet.mjs --sheet=chips,seaweed --px=380 --w=1600 --out=mysheet   # contact sheet of fronts  → .scratch/shots/mysheet.png
node scripts/sheet.mjs --sheet=chips --face=atlas --px=18 --out=atlas           # every face incl. the back panel
node scripts/sheet.mjs --sheet=chips --lang=th   # and --lang=both : check Thai + bilingual layouts
```

Open the PNGs with the image Read tool and check: text fits inside plates, nothing overlaps, hero is recognisable, colours feel like the real brand, Thai renders correctly, the build logs no warnings about your SKUs (unknown hero/brand/geometry, missing translations).

Do **not** edit shared files (`pack_*.js`, `draw.js`, `illus.js`, `shapes.js`, `skus.js` other than registering your module). If a shared painter misbehaves for your geometry, work around it in data and describe the problem plus a proposed patch in your final report.

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


## Reference tables (generated)

### Geometry presets (`g:`) — sizes in cm

| key | kind | dims |
|---|---|---|
| `bag-tiny` | bag | 7 × 10 × 1 |
| `bag-s` | bag | 10 × 15 × 2.6 |
| `bag-m` | bag | 14 × 21 × 4.2 |
| `bag-l` | bag | 18 × 27 × 6 |
| `bag-xl` | bag | 22 × 30 × 8 |
| `bag-flat` | bag | 13 × 18 × 1.8 |
| `bag-noodle` | bag | 12 × 17 × 3.2 |
| `bag-loaf` | bag | 22 × 12 × 9 |
| `bag-bun` | bag | 12 × 8 × 7 |
| `bag-snack` | bag | 12 × 17 × 3.5 |
| `can330` | wrap / can | 6.6 × 12.2 |
| `can250` | wrap / can | 5.4 × 13.4 |
| `can490` | wrap / can | 6.6 × 16.8 |
| `can185` | wrap / can | 5.2 × 9.2 |
| `pet500` | wrap / petSoda | 6.4 × 21.5 |
| `pet345` | wrap / petSlim | 5.8 × 17.5 |
| `pet600w` | wrap / petWater | 6.6 × 21.5 |
| `pet1500w` | wrap / bigPet | 8.6 × 31 |
| `pet1250` | wrap / bigPet | 8.4 × 30 |
| `pet250` | wrap / petSlim | 5.2 × 15.5 |
| `beer620` | wrap / beerBottle | 6.6 × 26.5 |
| `beer330` | wrap / beerBottle | 6 × 23.5 |
| `glass150` | wrap / energyGlass | 3.8 × 10.6 |
| `glass100` | wrap / energyGlass | 3.4 × 9.6 |
| `glass300` | wrap / petSlim | 5.4 × 17 |
| `cup-noodle` | wrap / cupNoodle | 8.6 × 10.2 |
| `cup-noodle-l` | wrap / cupNoodle | 9.6 × 11.8 |
| `cup-cafe` | wrap / cupNoodle | 7.8 × 14.5 |
| `cup-small` | wrap / tubPot | 6.2 × 6.2 |
| `cup-dessert` | wrap / tubPot | 8.2 × 7.2 |
| `cup-fruit` | wrap / tubPot | 8.8 × 8.6 |
| `tub-ice` | wrap / tubPot | 8.4 × 7.8 |
| `tub-family` | wrap / tubPot | 12.5 × 11 |
| `tube-chips` | wrap / tubeChips | 7.4 × 23.4 |
| `jar-s` | wrap / jar | 6.4 × 8 |
| `tin-tuna` | wrap / jar | 8.4 × 3.6 |
| `aerosol` | wrap / aerosol | 6.4 × 21 |
| `bottle-sauce` | wrap / petSlim | 6 × 20 |
| `bottle-oil` | wrap / petWater | 8 × 24 |
| `shampoo` | wrap / shampoo | 6.6 × 18 |
| `flip-s` | wrap / flipBottle | 5.4 × 14 |
| `inhaler` | wrap / can | 1.9 × 8.2 |
| `balm-jar` | wrap / jar | 4.6 × 3.2 |
| `lighter` | box | 2.6 × 8.2 × 1.1 |
| `box-xs` | box | 7 × 9 × 3 |
| `box-s` | box | 9 × 12 × 4 |
| `box-m` | box | 13 × 9 × 5.5 |
| `box-tall` | box | 7.5 × 16 × 4.5 |
| `box-l` | box | 16 × 12 × 7 |
| `box-choc` | box | 16 × 8 × 2.2 |
| `box-tissue` | box | 24 × 12 × 12 |
| `box-detergent` | box | 14 × 21 × 6 |
| `box-tooth` | box | 4.6 × 17.5 × 3.6 |
| `box-eggs` | box | 24 × 6.5 × 6.5 |
| `card` | box | 11 × 17 × 1.6 |
| `stick` | box | 5.4 × 15 × 1.5 |
| `tray-meal` | box | 19.5 × 4.6 × 14 |
| `tray-sand` | box | 12.5 × 3.6 × 11 |
| `tray-onigiri` | box | 9.5 × 3.6 × 8.5 |
| `tray-salad` | box | 15 × 6.5 × 11 |
| `tray-fruit` | box | 11.5 × 5.5 × 9 |
| `brick` | box | 5.8 × 10.6 × 3.6 |
| `brick-l` | box | 7 × 14 × 5 |
| `gable-1l` | gable | 7 × 19.5 × 7 |
| `gable-450` | gable | 6 × 15 × 6 |
| `gable-200` | gable | 5 × 11 × 3.8 |

### Hero illustration keys (`hero:`; combine with `+`, e.g. `seaweed+chips`)

`orange`, `lemon`, `lime`, `strawberry`, `mango`, `mangoSlice`, `watermelon`, `pineapple`, `coconut`, `banana`, `grape`, `lychee`, `chili`, `herb`, `garlic`, `chips`, `seaweed`, `nuts`, `shrimp`, `squid`, `fishSnack`, `crab`, `porkSkewer`, `stickyRice`, `noodleBowl`, `plate`, `egg`, `bun`, `sandwich`, `onigiri`, `friedChicken`, `sausage`, `fries`, `iceGlass`, `beerMug`, `waterDrop`, `milkSplash`, `coffeeCup`, `teaLeaf`, `honey`, `iceCubes`, `chocBar`, `cookie`, `sandwichCookie`, `wafer`, `pocky`, `candy`, `gum`, `jelly`, `cone`, `iceStick`, `iceTub`, `croissant`, `bread`, `cakeRoll`, `donut`, `elephant`, `lion`, `bull`, `leopard`, `tiger`, `crown`, `lightning`, `sun`, `snowflake`, `mountain`, `heart`, `cross`, `paw`, `baby`, `soap`, `toothpaste`, `bottleSmall`, `tissueBox`, `battery`, `umbrella`, `fan`, `cable`, `pen`, `lighter`, `inhaler`, `balm`, `pill`, `bandage`, `mask`, `mosquito`, `sim`, `eggs`, `riceBag`, `spoon`, `tuna`

### Ingredient keys (`ing:`)

`water` (Water), `sugar` (Sugar), `salt` (Salt), `oil` (Vegetable oil), `palm` (Palm oil), `potato` (Potato), `wheat` (Wheat flour), `rice` (Rice), `ricef` (Rice flour), `tapioca` (Tapioca starch), `corn` (Corn), `cornst` (Corn starch), `soy` (Soybean), `soysauce` (Soy sauce), `egg` (Egg), `eggyolk` (Salted egg yolk), `milk` (Milk), `milkp` (Milk powder), `cream` (Cream), `cheese` (Cheese), `butter` (Butter), `cocoa` (Cocoa), `choc` (Chocolate), `vanilla` (Vanilla flavour), `yeast` (Yeast), `msg` (Flavour enhancer (MSG)), `garlic` (Garlic), `onion` (Onion), `chili` (Chilli), `lemongrass` (Lemongrass), `galangal` (Galangal), `kaffir` (Kaffir lime leaf), `lime` (Lime), `tamarind` (Tamarind), `fishsauce` (Fish sauce), `shrimp` (Shrimp), `shrimppaste` (Shrimp paste), `squid` (Squid), `fish` (Fish), `pork` (Pork), `porkfloss` (Pork floss), `chicken` (Chicken), `beef` (Beef), `basil` (Holy basil), `seaweed` (Seaweed), `sesame` (Sesame), `peanut` (Peanut), `almond` (Almond), `cashew` (Cashew nut), `coconutmilk` (Coconut milk), `coconut` (Coconut), `mango` (Mango), `pandan` (Pandan), `taro` (Taro), `pumpkin` (Pumpkin), `honey` (Honey), `lemon` (Lemon), `orange` (Orange juice), `apple` (Apple), `grape` (Grape), `strawberry` (Strawberry), `lychee` (Lychee), `pineapple` (Pineapple), `watermelon` (Watermelon), `papaya` (Green papaya), `tomato` (Tomato), `carrot` (Carrot), `cabbage` (Cabbage), `veg` (Vegetables), `greentea` (Green tea), `tea` (Tea), `thaitea` (Thai tea), `coffee` (Coffee), `caffeine` (Caffeine), `taurine` (Taurine), `inositol` (Inositol), `vitb` (Vitamins B), `vitc` (Vitamin C), `citric` (Citric acid), `preserv` (Preservative), `sweet` (Sweetener), `colour` (Colour), `flavour` (Flavouring), `emuls` (Emulsifier), `stab` (Stabiliser), `gelatin` (Gelatin), `pectin` (Pectin), `co2` (Carbon dioxide), `caramel` (Caramel colour), `malt` (Malt), `barley` (Barley), `hops` (Hops), `mint` (Mint), `menthol` (Menthol), `camphor` (Camphor), `eucalyptus` (Eucalyptus oil), `oats` (Oats), `starch` (Modified starch), `yogurt` (Yoghurt culture), `whey` (Whey protein), `leaven` (Raising agent), `spice` (Spices), `curry` (Curry paste), `tomyum` (Tom yum seasoning), `nori` (Nori seasoning), `cheeseseason` (Cheese seasoning), `bbq` (BBQ seasoning), `sourcream` (Sour cream & onion seasoning), `brine` (Brine), `oliveoil` (Olive oil), `mayo` (Mayonnaise), `ham` (Ham), `tuna` (Tuna), `sausage` (Sausage), `bread` (Bread), `vitamins` (Vitamins & minerals), `electrolyte` (Electrolytes), `alcohol` (Ethanol), `neutral` (Neutral spirit), `molasses` (Molasses), `ginseng` (Ginseng extract), `aloe` (Aloe vera), `chrysanthemum` (Chrysanthemum), `longan` (Longan), `jelly` (Konjac jelly), `sticky` (Glutinous rice), `starchsyrup` (Glucose syrup), `fructose` (Fructose syrup), `sodiumb` (Sodium bicarbonate), `surfactant` (Surfactants), `fluoride` (Fluoride), `silica` (Silica), `glycerin` (Glycerin), `perfume` (Fragrance), `zinc` (Zinc pyrithione), `paraffin` (Paraffin), `petro` (Petroleum jelly), `paracetamol` (Paracetamol 500 mg), `cotton` (Cotton), `pulp` (Virgin pulp), `bleach` (Sodium hypochlorite), `enzyme` (Enzymes), `zincox` (Zinc oxide), `talc` (Talc)

### Allergen keys (`allergens:`)

`wheat`, `milk`, `egg`, `soy`, `peanut`, `nuts`, `shrimp`, `fish`, `squid`, `sesame`, `sulphite`

### Existing brand styles (`brand:`)

`lays`, `pringles`, `doritos`, `cheetos`, `tasto`, `taokaenoi`, `masita`, `taro`, `kohkae`, `oishi`, `mama`, `waiwai`, `yumyum`, `nissin`, `samyang`, `nongshim`, `indomie`, `pepsi`, `coke`, `fanta`, `sprite`, `est`, `sarsi`, `mirinda`, `sevenup`, `schweppes`, `m150`, `krating`, `redbull`, `carabao`, `lipo`, `shark`, `sponsor`, `gatorade`, `pocari`, `namthip`, `crystal`, `nestle`, `singha`, `chang`, `leo`, `heineken`, `tiger`, `asahi`, `fed`, `carlsberg`, `spy`, `sangsom`, `hongthong`, `ichitan`, `lipton`, `chatramue`, `malee`, `tipco`, `dk`, `chaokoh`, `meiji`, `dutchmill`, `dutchie`, `foremost`, `thaidenmark`, `yakult`, `vitamilk`, `lactasoy`, `ovaltine`, `milo`, `betagen`, `birdy`, `nescafe`, `starbucks`, `allcafe`, `farmhouse`, `kinder`, `ferrero`, `mms`, `snickers`, `kitkat`, `cadbury`, `pocky`, `oreo`, `chocopie`, `hellopanda`, `beng`, `tim`, `mentos`, `halls`, `hichew`, `fisherman`, `xylitol`, `cocon`, `wall`, `magnum`, `paddle`, `sealect`, `tiparos`, `sriracha`, `maepranom`, `knorr`, `carnation`, `scott`, `kleenex`, `sunlight`, `attack`, `comfort`, `soffell`, `baygon`, `colgate`, `darlie`, `sensodyne`, `sunsilk`, `clear`, `pantene`, `dove`, `lux`, `rexona`, `snake`, `vicks`, `peppermint`, `tigerbalm`, `siang`, `counterpain`, `salonpas`, `sara`, `tiffy`, `panasonic`, `energizer`, `bic`, `ais`, `truemove`, `nut`, `dj`, `sevenselect`, `bigbite`, `generic`

# 7 Eleven Simulator — by Nomaditsu

A first-person walk-in **Bangkok corner store, 11 SEVEN**, built with three.js and shipped as **one self-contained `index.html`**
(three.js, fonts and game code are all inlined — it works offline, just open the file).

Stroll down a soi at dusk, slide through the doors to the chime, and browse **384 products** across 30 categories
like a first-person RPG. Everything printed on a sign, price tag or package can be flipped between
**English / ไทย / both** with one key. In bilingual mode English comes first, then the romanised pronunciation, then the Thai script.

> Fan-made tribute for fun. Not affiliated with or endorsed by 7-Eleven, CP ALL or any brand shown.
> Made with love by Ray de Guzman (@nomaditsu). Fully open source under the MIT license.
> All names and marks belong to their owners; the artwork is stylised and procedurally drawn.

## Play

**Play it online: https://nomaditsu.github.io/11-seven/**

Or download `index.html` and open it in a modern browser (Chrome, Edge, Firefox, Safari) and press **Walk in**. It also runs on phones and tablets with on-screen touch controls.

| Key | Action |
| --- | --- |
| arrow keys | move |
| click and drag / `W` `A` `S` `D` | look around |
| `Shift` · `C` · `Z` (or right-click) | sprint · crouch · zoom |
| `T` (or click) | take the item you are looking at, use what you are looking at (till, ATM, microwave, hot water, 11 Café, baskets), or **talk** to someone (`E` also works) |
| `I` | inspect the item: move the mouse to turn it, `Space` flips it to the back (ingredients, allergens, dates, barcode) |
| `P` | put the last item back |
| `B` (or `Tab`) · `K` · `Q` | basket · Snack Book · shopping-list quests |
| **`L`** | **cycle the language** English → ไทย → EN + ไทย |
| `M` · `N` · `.` `,` | music on / off · sound effects on / off (includes ambience and voices; music keeps playing) · next / previous track |
| `H` · `Esc` | hide the key hints · pause menu |

The always-on buttons in the top-right corner (language flag, sound, music, next track, menu) do the same as `L`, `N`, `M`, `.` and `Esc`.
On a touch screen: left thumb walks, dragging the right side looks around, pinching zooms, and the round buttons take, inspect, put back, open the basket and crouch.

### What there is to do

- **Browse** thousands of items on planogram-stocked shelves, drinks coolers with swinging glass doors, an open ready-meal chiller,
  hot-food warmer, roller grill, bakery case and freezers.
- **Inspect** any pack up close and read it in either language (or both at once), just like real bilingual packaging.
- **Collect** them all in the Snack Book; an item is discovered when you inspect it (`I`), and some are given to you by people you chat with. Filter to what you have found with "Discovered only".
- **Talk** to the cashiers, shoppers, the monk, the motorbike-taxi driver and the soi dog. Every line is spoken aloud by your browser's voices (English, Thai, or both) and comes with a tip or a small reward.
- **Shop lists & achievements** ("midnight snack run", "Bangkok breakfast"…), an 11 Club points wallet, and a bank balance.
- **Check out** with the cashier's real Thai lines (with romanisation and English): 11 Club? heat it up? bag? cutlery?
  Pay with **cash, PromptPay QR or TrueMoney** and get a printable receipt (save it as a PNG).
- **Use the machines**: ATM, microwave, hot-water tap for cup noodles, 11 Café espresso/Thai tea/Slurpee menu, ice and coin-water machines outside.
- **Thai rules**: alcohol only sells 11:00–14:00 and 17:00–24:00 (the cooler shows a sign and refuses at other times).
- **Bangkok atmosphere**: motorbike taxis, tuk-tuks and buses, tangled power lines, a spirit house, a grilled-pork cart,
  a monk walking the soi, a sleepy soi dog you can pet, day/night cycle with a lit-up soi at night, and a WebAudio-synthesised
  soundscape (door chime, fridge hum, traffic, cicadas) plus four chiptune tracks for the store, changeable from the pause menu.

## Language system

Every visible string has an English and a Thai version: signs, price tags, packaging fronts and backs, ingredient lists,
Buddhist-era dates on Thai packs, the cashier dialogue, menus and UI. Textures that carry text are registered as
*localized textures* and repainted, nearest-first, whenever you change language — so what is in front of you updates first.

## Build & develop

```bash
npm install            # three, esbuild, fonts, playwright-core (dev only)
npm run build          # -> index.html (tree-shaken three.js + game + base64 fonts)
npm run validate       # static checks of every SKU and of the NPC dialogue (translations, asset keys, romanisation)
npm run boot           # headless-Chromium smoke test: boots and reports console errors / planogram fill
npm run qa             # scripted play-through: take, inspect, language flip, basket, alcohol hours, checkout, receipt, ATM
node scripts/shots.mjs "name:x,z,yaw,pitch,hour,lang" …    # screenshots from any spot in the store
node scripts/sheet.mjs --sheet=cats --lang=both            # contact sheets of the packaging
```

URL flags: `?debug` (exposes `window.__sim`), `&autostart`, `&lang=en|th|both`, `&hour=18.5`, `&q=low|med|high`, `&touch` (force the touch layout).

### Layout

```
src/main.js            boot + main loop          src/world/    store shell, fixtures, planogram, street, traffic, NPCs
src/game/              interaction, hands, checkout, audio, receipt, session state
src/ui/                HUD, panels, touch, About  src/gfx/      canvas painters: packaging, logos, illustrations, signs
src/data/              SKUs (sku_*.js), brands, ingredients, shapes, quests, pools, dialogue, music tracks
docs/design/sku-authoring.md how to add products      scripts/      build, QA and screenshot tooling
```

To add a product, follow [`docs/design/sku-authoring.md`](docs/design/sku-authoring.md): add a `T(en, th)` entry to a `src/data/sku_*.js`
file and rebuild — the packaging, back panel, barcode, codex entry and shelf placement are generated for you.

## Notes

- Product names, flavours and Thai spellings follow real Thai retail listings where they could be verified; **prices, sizes and
  some availability are estimates**, and a few items are illustrative. Barcodes, FDA numbers, branch and tax details are fake.
- Rendering runs on WebGL2; pick **Low / Medium / High** in Settings if your machine struggles.

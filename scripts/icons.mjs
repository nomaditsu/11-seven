// Renders the home-screen icons listed in manifest.webmanifest from the 11 SEVEN badge painter (src/gfx/logo11seven.js)
// in headless Chromium, so the icons stay drawn in code like everything else. Writes icons/*.png (committed).
// Also renders icons/social-card.png, the 1200x630 link preview image named by the og:image tag in src/template.html.
// Rerun after changing the badge: node scripts/icons.mjs, then npm run build (the service worker lists the icons).
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'icons');

// full: the badge on its green square, edge to edge (phones round the corners off themselves).
// maskable: Android may crop to a circle keeping only the middle 80%, so the badge sits at 80% on a green field.
// favicon: the browser-tab icon, rounded like the HUD badge, transparent corners. apple-touch-icon: iOS home screen
// and bookmarks (both linked in src/template.html).
const ICONS = [
  { file: 'favicon-64.png', size: 64, inset: 1, radius: 40 },
  { file: 'apple-touch-icon-180.png', size: 180, inset: 1 },
  { file: 'icon-192.png', size: 192, inset: 1 },
  { file: 'icon-512.png', size: 512, inset: 1 },
  { file: 'icon-maskable-512.png', size: 512, inset: 0.8 },
];

const logo = await build({
  entryPoints: [path.join(root, 'src/gfx/logo11seven.js')],
  bundle: true, format: 'iife', globalName: 'LOGO', write: false, logLevel: 'error',
});
const fontFile = (f) => fs.readFileSync(path.join(root, 'node_modules/@fontsource', f)).toString('base64');
const font = fontFile('archivo-black/files/archivo-black-latin-400-normal.woff2');
const kanit = (w) => `@font-face{font-family:'Kanit';font-weight:${w};src:url(data:font/woff2;base64,${fontFile(`kanit/files/kanit-latin-${w}-normal.woff2`)}) format('woff2')}`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent(`<style>@font-face{font-family:'Archivo Black';src:url(data:font/woff2;base64,${font}) format('woff2')}${kanit(500)}${kanit(800)}</style>`);
await page.addScriptTag({ content: logo.outputFiles[0].text });
await page.evaluate(() => Promise.all(['400 42px "Archivo Black"', '500 20px Kanit', '800 20px Kanit'].map((f) => document.fonts.load(f))));
fs.mkdirSync(out, { recursive: true });
for (const icon of ICONS) {
  const dataUrl = await page.evaluate(({ size, inset, radius = 0 }) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    if (!radius) { ctx.fillStyle = LOGO.BRAND.green; ctx.fillRect(0, 0, size, size); }
    const h = size * inset, o = (size - h) / 2;
    LOGO.drawLogo(ctx, o, o, h, { radius });
    return c.toDataURL('image/png');
  }, icon);
  fs.writeFileSync(path.join(out, icon.file), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`icons/${icon.file}`);
}

// Link preview card (Linktree, iMessage, Slack, X, Facebook): the title screen's dark green, the badge, the name and
// the three stripes. 1200x630 is the size every major unfurler accepts at full width.
const card = await page.evaluate(() => {
  const W = 1200, H = 630, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d'), B = LOGO.BRAND;
  ctx.fillStyle = '#04120d'; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(330, 300, 40, 330, 300, 520);
  glow.addColorStop(0, 'rgba(0,135,74,.55)'); glow.addColorStop(1, 'rgba(0,135,74,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  LOGO.drawStripes(ctx, 0, H - 36, W, 36);
  LOGO.drawLogo(ctx, 90, 125, 340, { radius: 28, shadow: true });
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const x = 500;
  ctx.fillStyle = '#fff'; ctx.font = '400 104px "Archivo Black"'; ctx.fillText('11 SEVEN', x, 265);
  ctx.font = '800 60px Kanit'; ctx.fillText('7 Eleven ', x, 352);
  ctx.fillStyle = B.orange; ctx.fillText('Simulator', x + ctx.measureText('7 Eleven ').width, 352);
  const grad = ctx.createLinearGradient(x, 0, x + 40, 0);
  grad.addColorStop(0, B.orange); grad.addColorStop(1, B.red);
  ctx.fillStyle = grad; ctx.fillRect(x, 412, 40, 4);
  ctx.fillStyle = '#ffe2b8'; ctx.font = '500 30px Kanit';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '5px';
  ctx.fillText('BY NOMADITSU', x + 56, 424);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.font = '500 26px Kanit';
  ctx.fillText('Walk into a Bangkok convenience store.', x, 486);
  ctx.fillText('Free in your browser.', x, 522);
  return c.toDataURL('image/png');
});
fs.writeFileSync(path.join(out, 'social-card.png'), Buffer.from(card.split(',')[1], 'base64'));
console.log('icons/social-card.png');
await browser.close();

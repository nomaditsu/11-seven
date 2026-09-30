// Renders the home-screen icons listed in manifest.webmanifest from the 11 SEVEN badge painter (src/gfx/logo11seven.js)
// in headless Chromium, so the icons stay drawn in code like everything else. Writes icons/*.png (committed).
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
const font = fs.readFileSync(path.join(root, 'node_modules/@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2'));

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent(`<style>@font-face{font-family:'Archivo Black';src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2')}</style>`);
await page.addScriptTag({ content: logo.outputFiles[0].text });
await page.evaluate(() => document.fonts.load('400 42px "Archivo Black"'));
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
await browser.close();

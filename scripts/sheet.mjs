// node scripts/sheet.mjs [--sheet=chips,nuts] [--face=front|atlas] [--lang=en|th|both] [--px=320] [--w=1600] [--out=name]
import { openSim } from './lib/harness.mjs';
const opt = {};
for (const a of process.argv.slice(2)) { const [k, v] = a.replace(/^--/, '').split('='); opt[k] = v ?? '1'; }
const q = new URLSearchParams({ sheet: opt.sheet || '', face: opt.face || 'front', lang: opt.lang || 'en', px: opt.px || '320', w: opt.w || '1600' });
const { browser, page, logs } = await openSim({ query: '?' + q, width: +(opt.w || 1600) + 30, height: 900 });
await page.waitForTimeout(400);
const out = `.scratch/shots/${opt.out || 'sheet'}.png`;
await page.screenshot({ path: out, fullPage: true });
console.log('saved', out);
const uniq = [...new Set(logs)];
if (uniq.length) console.log(uniq.slice(0, 30).join('\n'));
await browser.close();

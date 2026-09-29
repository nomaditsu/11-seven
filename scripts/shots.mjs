// Visual QA: node scripts/shots.mjs [--q=med] [--w=1280] [--h=720] [--hour=18.5] [--lang=en] name:x,z,yaw,pitch[,hour[,lang]] ...
// Writes PNGs to .scratch/shots/<name>.png and prints console output from the page.
import { openSim } from './lib/harness.mjs';
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = {};
const shots = [];
for (const a of args) {
  if (a.startsWith('--')) { const [k, v] = a.slice(2).split('='); opt[k] = v ?? true; }
  else shots.push(a);
}
const w = +(opt.w || 1280), h = +(opt.h || 720);
const q = new URLSearchParams({ debug: '1', autostart: '1', q: opt.q || 'med' });
if (opt.hour) q.set('hour', opt.hour);
if (opt.lang) q.set('lang', opt.lang);
const t0 = Date.now();
const { browser, page, logs } = await openSim({ query: '?' + q.toString(), width: w, height: h });
console.log(`loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
fs.mkdirSync('.scratch/shots', { recursive: true });
for (const s of shots) {
  const [name, rest] = s.split(':');
  const [x, z, yaw, pitch, hour, lang] = (rest || '0,4,0,0').split(',');
  await page.evaluate(([x, z, yaw, pitch, hour, lang]) => {
    const S = window.__sim;
    if (hour) S.setHour(+hour);
    if (lang) S.setLang(lang);
    S.tp(+x, +z, +yaw, +pitch);
  }, [x, z, yaw, pitch, hour, lang]);
  // wait for a couple of freshly rendered frames (software GL can take seconds per frame)
  await page.evaluate((n) => new Promise((res) => { const f0 = window.__sim.G.frame; const iv = setInterval(() => { if (window.__sim.G.frame >= f0 + n) { clearInterval(iv); res(); } }, 50); }), opt.frames ? +opt.frames : 3);
  await page.screenshot({ path: `.scratch/shots/${name}.png` });
  const info = await page.evaluate(() => window.__sim.info());
  console.log(name, JSON.stringify(info));
}
const uniq = [...new Set(logs)];
console.log(uniq.length ? uniq.slice(0, 40).join('\n') : '(no console output)');
await browser.close();

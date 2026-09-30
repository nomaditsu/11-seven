// Offline and install check: serves the repo over http, loads the game once so the service worker saves it, then
// cuts the network, stops the server and reloads. Passes if the game boots again with no connection.
// Also checks the manifest and its icons, and that the iPhone install hint shows only on iOS. node scripts/pwa-check.mjs
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

let fails = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) fails++; };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const errors = [];
const watch = (page) => page.on('pageerror', (e) => errors.push(e.message));

// Manifest and icons
const ctx = await browser.newContext({ viewport: { width: 640, height: 360 } });
const page = await ctx.newPage(); watch(page);
const manifest = await (await ctx.request.get(base + 'manifest.webmanifest')).json();
check(manifest.start_url && manifest.display && manifest.icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'), 'manifest has start_url, display and a maskable 512 icon');
for (const i of manifest.icons) {
  const r = await ctx.request.get(base + i.src); const b = await r.body();
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  check(r.ok() && `${w}x${h}` === i.sizes, `${i.src} is ${w}x${h}`);
}

// First visit online: the service worker installs and saves the game.
await page.goto(base + 'index.html?sw&debug&q=low');
await page.waitForFunction(() => window.__ready === true, null, { timeout: 240000 });
await page.waitForFunction(async () => navigator.serviceWorker.controller && (await caches.keys()).length > 0, null, { timeout: 60000 });
const saved = await page.evaluate(async () => { const c = await caches.open((await caches.keys())[0]); return (await c.keys()).map((r) => new URL(r.url).pathname); });
// index.html, the manifest and every icon (the same list scripts/build.mjs gives the service worker).
const expected = 2 + fs.readdirSync(path.join(root, 'icons')).filter((f) => f.endsWith('.png')).length;
check(saved.length === expected && saved.some((p) => p.endsWith('/index.html')), `saved for offline: ${saved.join(', ')}`);
check(await page.evaluate(() => document.getElementById('install-hint').hidden), 'install hint hidden on desktop Chrome');

// Second visit offline, server gone, and with a different query: still boots.
await ctx.setOffline(true);
await new Promise((r) => server.close(r));
await page.goto(base + '?lang=th&debug&q=low');
const booted = await page.waitForFunction(() => window.__ready === true, null, { timeout: 240000 }).then(() => true, () => false);
check(booted, 'boots offline with the server stopped');
await ctx.close();

// iPhone Safari (not installed): the Add to Home Screen hint shows. The test server is closed by now, so a route
// serves the repo's files on a made-up http origin.
const ios = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
await ios.route('http://sevn.test/**', (route) => {
  const file = path.join(root, new URL(route.request().url()).pathname);
  return fs.existsSync(file) ? route.fulfill({ path: file, contentType: TYPES[path.extname(file)] }) : route.fulfill({ status: 404 });
});
const ip = await ios.newPage(); watch(ip);
await ip.goto('http://sevn.test/index.html?q=low');
const shown = await ip.waitForSelector('#install-hint:not([hidden])', { timeout: 60000 }).then(() => true, () => false);
check(shown, 'install hint shows on iPhone Safari');
await ios.close();

check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await browser.close();
console.log(fails ? `${fails} failed` : 'pwa-check passed');
process.exit(fails ? 1 : 0);

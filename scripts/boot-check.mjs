// Smoke test: does index.html boot in headless Chromium (software GL) and report console errors? node scripts/boot-check.mjs
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
const base = '/opt/pw-browsers'; let exe = process.env.CHROME_PATH;
if (fs.existsSync(base)) for (const d of fs.readdirSync(base)) { const p = path.join(base, d, 'chrome-linux', 'chrome'); if (d.startsWith('chromium') && fs.existsSync(p)) exe = p; }
const browser = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' || /^\[(fill|planogram)\]|^pool |never placed|did not fit/.test(t)) console.log('[' + m.type() + '] ' + t.slice(0, 1600)); });
page.on('pageerror', (e) => console.log('[pageerror] ' + e.message + '\n' + (e.stack || '').slice(0, 600)));
await page.goto('file://' + path.resolve('index.html') + '?debug&q=low', { waitUntil: 'load' });
const t0 = Date.now();
try { await page.waitForFunction(() => window.__ready === true, null, { timeout: 240000 }); console.log('ready after', ((Date.now() - t0) / 1000).toFixed(1), 's'); } catch (e) { console.log('NOT READY', await page.title()); }
await browser.close();

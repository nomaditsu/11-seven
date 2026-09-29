// Build script: bundles everything into ONE self-contained index.html
//   - three.js (tree-shaken to the symbols the game actually uses, minified)
//   - Thai + Latin fonts (base64 woff2, subset by unicode-range)
//   - the game code itself (kept readable / un-minified)
// Usage: node scripts/build.mjs
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const nm = path.join(root, 'node_modules');
const cacheDir = path.join(root, '.scratch');
fs.mkdirSync(cacheDir, { recursive: true });

// ---------------------------------------------------------------------------
// Fonts to embed. [css family, fontsource package, weights, subsets]
// ---------------------------------------------------------------------------
const FONTS = [
  ['Kanit', 'kanit', [500, 700, 900], ['thai', 'latin']],
  ['Mitr', 'mitr', [500, 700], ['thai', 'latin']],
  ['Sarabun', 'sarabun', [400, 700], ['thai', 'latin']],
  ['Mali', 'mali', [600], ['thai', 'latin']],
  ['Pattaya', 'pattaya', [400], ['thai', 'latin']],
  ['Chonburi', 'chonburi', [400], ['thai', 'latin']],
  ['Sriracha', 'sriracha', [400], ['thai']],
  ['Itim', 'itim', [400], ['thai']],
  ['Anton', 'anton', [400], ['latin']],
  ['Bebas Neue', 'bebas-neue', [400], ['latin']],
  ['Lilita One', 'lilita-one', [400], ['latin']],
  ['Pacifico', 'pacifico', [400], ['latin']],
  ['Bangers', 'bangers', [400], ['latin']],
  ['Archivo Black', 'archivo-black', [400], ['latin']],
  ['Righteous', 'righteous', [400], ['latin']],
  ['Fredoka', 'fredoka', [600], ['latin']],
];

function buildFontCss() {
  let css = '';
  let bytes = 0;
  for (const [family, pkg, weights, subsets] of FONTS) {
    for (const w of weights) {
      const cssFile = path.join(nm, '@fontsource', pkg, `${w}.css`);
      const text = fs.readFileSync(cssFile, 'utf8');
      const blocks = text.split('@font-face').slice(1);
      for (const b of blocks) {
        const m = b.match(/files\/([\w-]+)-(\w[\w-]*?)-(\d+)-normal\.woff2/);
        if (!m) continue;
        const subset = m[2];
        if (!subsets.includes(subset)) continue;
        const range = (b.match(/unicode-range:\s*([^;]+);/) || [])[1];
        const file = path.join(nm, '@fontsource', pkg, 'files', m[0].replace(/^files\//, ''));
        const data = fs.readFileSync(file);
        bytes += data.length;
        css += `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:block;` +
          `src:url(data:font/woff2;base64,${data.toString('base64')}) format('woff2');` +
          (range ? `unicode-range:${range};` : '') + '}\n';
      }
    }
  }
  return { css, bytes };
}

// ---------------------------------------------------------------------------
// Licence notices that must travel with every copy of index.html:
// three.js (MIT) and each embedded font (OFL-1.1: copyright lines + the licence text once)
// ---------------------------------------------------------------------------
const legal = (s) => s.replace(/\*\//g, '* /').trim();
function threeNotice() {
  return `/*! three.js (https://threejs.org), bundled as a tree-shaken subset.\n${legal(fs.readFileSync(path.join(nm, 'three', 'LICENSE'), 'utf8'))}\n*/\n`;
}
function fontNotices() {
  let ofl = '';
  const lines = FONTS.map(([family, pkg]) => {
    const text = fs.readFileSync(path.join(nm, '@fontsource', pkg, 'LICENSE'), 'utf8');
    const i = text.indexOf('SIL OPEN FONT LICENSE Version 1.1');
    if (i < 0) throw new Error(`@fontsource/${pkg}: LICENSE is not OFL-1.1`);
    ofl ||= text.slice(i);
    const head = text.split('This Font Software is licensed')[0];
    const copies = [...new Set([...head.matchAll(/Copyright[^\n]*?(?=\s+\S+\.ttf:|\n|$)/g)].map((m) => m[0].trim().replace(/[.,;]+$/, '')))];
    return `${family}: ${copies.join('; ')}`;
  });
  return `/*! Fonts embedded below, unmodified woff2 files from Fontsource, each licensed under the SIL Open Font License 1.1.\n` +
    `${legal(lines.join('\n'))}\n\n${legal(ofl)}\n*/\n`;
}

// ---------------------------------------------------------------------------
// three.js: tree-shaken subset exposed as window.THREE
// ---------------------------------------------------------------------------
// Names that live in three/addons rather than core.
const ADDONS = {
  mergeGeometries: 'three/addons/utils/BufferGeometryUtils.js',
  mergeVertices: 'three/addons/utils/BufferGeometryUtils.js',
  toCreasedNormals: 'three/addons/utils/BufferGeometryUtils.js',
  RoundedBoxGeometry: 'three/addons/geometries/RoundedBoxGeometry.js',
  EffectComposer: 'three/addons/postprocessing/EffectComposer.js',
  RenderPass: 'three/addons/postprocessing/RenderPass.js',
  UnrealBloomPass: 'three/addons/postprocessing/UnrealBloomPass.js',
  OutputPass: 'three/addons/postprocessing/OutputPass.js',
  RectAreaLightUniformsLib: 'three/addons/lights/RectAreaLightUniformsLib.js',
};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const jsFiles = walk(src).filter((f) => f.endsWith('.js'));
const used = new Set();
for (const f of jsFiles) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/\bTHREE\.([A-Za-z_][A-Za-z0-9_]*)/g)) used.add(m[1]);
}
const names = [...used].sort();

async function buildThree() {
  const threeVersion = JSON.parse(fs.readFileSync(path.join(nm, 'three', 'package.json'), 'utf8')).version;
  const key = crypto.createHash('sha1').update(threeVersion + '|' + names.join(',')).digest('hex');
  const cacheFile = path.join(cacheDir, `three-${key}.js`);
  if (fs.existsSync(cacheFile)) return { code: fs.readFileSync(cacheFile, 'utf8'), version: threeVersion, cached: true };
  const lines = names.map((n) => (ADDONS[n] ? `export { ${n} } from '${ADDONS[n]}';` : `export { ${n} } from 'three';`));
  const r = await build({
    stdin: { contents: lines.join('\n'), resolveDir: root, loader: 'js' },
    bundle: true, format: 'iife', globalName: 'THREE', minify: true, write: false,
    target: 'es2020', legalComments: 'none', logLevel: 'error',
  });
  const code = r.outputFiles[0].text;
  fs.writeFileSync(cacheFile, code);
  return { code, version: threeVersion, cached: false };
}

// ---------------------------------------------------------------------------
// Game code: readable IIFE, `import ... from 'three'` maps to window.THREE
// ---------------------------------------------------------------------------
const threeGlobalPlugin = {
  name: 'three-global',
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: 'three', namespace: 'three-global' }));
    b.onLoad({ filter: /.*/, namespace: 'three-global' }, () => ({ contents: 'module.exports = window.THREE;', loader: 'js' }));
  },
};

async function buildGame() {
  const r = await build({
    entryPoints: [path.join(src, 'main.js')],
    bundle: true, format: 'iife', minify: false, write: false, plugins: [threeGlobalPlugin],
    target: 'es2020', legalComments: 'none', logLevel: 'error', treeShaking: true,
    loader: { '.jpg': 'dataurl', '.png': 'dataurl' },
  });
  return r.outputFiles[0].text;
}

// ---------------------------------------------------------------------------
const esc = (s) => s.replace(/<\/(script|style)/gi, '<\\/$1');

const t0 = Date.now();
const [three, game] = await Promise.all([buildThree(), buildGame()]);
const fonts = buildFontCss();
const template = fs.readFileSync(path.join(src, 'template.html'), 'utf8');
// every src/*.css, styles.css first
const css = ['styles.css', ...fs.readdirSync(src).filter((f) => f.endsWith('.css') && f !== 'styles.css').sort()]
  .map((f) => fs.readFileSync(path.join(src, f), 'utf8')).join('\n');

let html = template
  .replace('/*__FONTS__*/', () => esc(fontNotices()) + fonts.css)
  .replace('/*__CSS__*/', () => css)
  .replace('/*__THREE__*/', () => `/* three.js r${three.version.split('.')[1]} (MIT) — tree-shaken subset */\n` + esc(threeNotice()) + esc(three.code))
  .replace('/*__GAME__*/', () => esc(game));

fs.writeFileSync(path.join(root, 'index.html'), html);
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(
  `index.html ${kb(html.length)}  (three ${kb(three.code.length)}${three.cached ? ' cached' : ''}, ` +
  `game ${kb(game.length)}, fonts ${kb(fonts.bytes)} raw)  ${names.length} THREE symbols  ${Date.now() - t0} ms`
);

// Generates the reference tables appended to docs/design/sku-authoring.md (input: scripts/sku-authoring.head.md)
import fs from 'node:fs';
import { GEO } from '../src/data/shapes.js';
import { ING, ALLERGEN } from '../src/data/ingredients.js';
import { BRANDS } from '../src/data/brands.js';
import { ILLUS } from '../src/gfx/illus.js';
const head = fs.readFileSync('scripts/sku-authoring.head.md', 'utf8');
let out = head + '\n\n## Reference tables (generated)\n\n### Geometry presets (`g:`) — sizes in cm\n\n| key | kind | dims |\n|---|---|---|\n';
for (const [k, v] of Object.entries(GEO)) out += `| \`${k}\` | ${v.kind}${v.profile ? ' / ' + v.profile : ''} | ${v.dims.join(' × ')} |\n`;
out += '\n### Hero illustration keys (`hero:`; combine with `+`, e.g. `seaweed+chips`)\n\n' + Object.keys(ILLUS).map((k) => `\`${k}\``).join(', ') + '\n';
out += '\n### Ingredient keys (`ing:`)\n\n' + Object.entries(ING).map(([k, v]) => `\`${k}\` (${v.en})`).join(', ') + '\n';
out += '\n### Allergen keys (`allergens:`)\n\n' + Object.keys(ALLERGEN).map((k) => `\`${k}\``).join(', ') + '\n';
out += '\n### Existing brand styles (`brand:`)\n\n' + Object.keys(BRANDS).map((k) => `\`${k}\``).join(', ') + '\n';
fs.writeFileSync('docs/design/sku-authoring.md', out);
console.log('doc written', out.length);

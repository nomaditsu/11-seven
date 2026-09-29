// Static checks for the NPC dialogue and the romanisation coverage: node scripts/validate-dialogue.mjs
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { PEOPLE } = await import(path.join(root, 'src/data/dialogue.js'));
const { SKU_BY_ID } = await import(path.join(root, 'src/data/skus.js'));
const { STR } = await import(path.join(root, 'src/core/strings.js'));
const { STR_UI } = await import(path.join(root, 'src/core/strings_ui.js'));
const { ROM } = await import(path.join(root, 'src/core/rom_data.js'));
const problems = [], warns = [];
const P = (m) => problems.push(m), W = (m) => warns.push(m);
const THAI = /[ก-๛]/;
const text = (where, v) => { if (!v || !v.en || !v.th || !v.rom) P(`${where}: needs en, th and rom`); else if (!THAI.test(v.th)) P(`${where}: th has no Thai script`); };
for (const [id, p] of Object.entries(PEOPLE)) {
  text(`${id}.name`, p.name); text(`${id}.role`, p.role);
  if (!p.nodes[p.start]) P(`${id}: missing start node ${p.start}`);
  for (const [nid, n] of Object.entries(p.nodes)) {
    const at = `${id}.${nid}`;
    text(`${at}.say`, n.say);
    if (n.end && n.choices) P(`${at}: an end node cannot have choices`);
    if (!n.end && !(n.choices && n.choices.length)) P(`${at}: needs choices or end:true`);
    for (const c of n.choices || []) { text(`${at}.choice`, c.t); if (c.to && !p.nodes[c.to]) P(`${at}: choice goes to missing node ${c.to}`); }
    if (n.give && n.give.discover && !SKU_BY_ID.has(n.give.discover)) P(`${at}: unknown product ${n.give.discover}`);
  }
}
// Thai UI strings without a romanisation (warning only: the line just shows English + Thai)
let missing = 0;
for (const [k, e] of Object.entries({ ...STR, ...STR_UI })) if (e.th && THAI.test(e.th) && !e.rom && !ROM[e.th]) { missing++; if (missing <= 15) W(`no romanisation: ${k} = ${e.th}`); }
if (missing > 15) W(`… and ${missing - 15} more UI strings without romanisation`);
console.log(`${Object.keys(PEOPLE).length} people checked`);
if (warns.length) console.log('WARN\n  ' + warns.join('\n  '));
if (problems.length) { console.log('PROBLEMS\n  ' + problems.join('\n  ')); process.exit(1); }
console.log('dialogue OK');

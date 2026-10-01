// End-to-end play-through in headless Chromium: browse -> take -> inspect (flip, language) -> checkout -> receipt -> panels.
// Usage: node scripts/qa.mjs [--q=med] [--frames=2] [--hour=18]
import { openSim } from './lib/harness.mjs';
import fs from 'node:fs';

const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const query = new URLSearchParams({ debug: '1', autostart: '1', q: opt.q || 'med', hour: opt.hour || '18' }).toString();
const { browser, page, logs } = await openSim({ query: '?' + query, width: +(opt.w || 1280), height: +(opt.h || 720) });
fs.mkdirSync('.scratch/qa', { recursive: true });
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; };
const frames = (n = +(opt.frames || 2)) => page.evaluate((n) => new Promise((res) => { const f0 = window.__sim.G.frame; const iv = setInterval(() => { if (window.__sim.G.frame >= f0 + n) { clearInterval(iv); res(); } }, 40); }), n);
const shot = async (name, n) => { await frames(n); await page.screenshot({ path: `.scratch/qa/${name}.png` }); };
const ev = (fn, arg) => page.evaluate(fn, arg);
// What the crosshair is on, and which people stand within 3 m of the player (to explain a failed aim check)
const aim = () => ev(() => {
  const s = window.__sim, t = s.interaction.target, pp = s.player.pos;
  const tg = !t ? 'null' : t.type === 'sku' ? 'sku:' + t.slot.sku.id : 'obj:' + t.obj.kind + (t.obj.id ? '/' + t.obj.id : '');
  const near = s.G.npcs.people.map((p) => [p.talkId, Math.hypot(p.group.position.x - pp.x, p.group.position.z - pp.z)]).filter(([, d]) => d < 3).map(([k, d]) => k + '@' + d.toFixed(2));
  return tg + (near.length ? ' near:' + near.join(',') : '');
});
const state = () => ev(() => { const s = window.__sim; return { mode: s.G.mode, panel: document.querySelector('#panels .panel.on')?.id || null, items: s.S.items.map((e) => e.sku.id + 'x' + e.qty), bag: s.S.bag.map((e) => e.sku.id + 'x' + e.qty), cash: s.save.cash, pts: s.save.points, disc: s.save.discovered?.length ?? 0, ach: s.save.achievements?.length ?? 0, hour: s.G.hourNow, taken: s.S.taken.length }; });

await frames(2);
ok((await state()).mode === 'play', 'game starts in play mode');

// --- pick three SKUs from different categories
const picks = await ev(() => {
  const s = window.__sim, seen = new Set(), out = [];
  for (const sl of s.contents.pw.slots) { const k = sl.sku.cat; if (!seen.has(k) && !sl.sku.alcohol) { seen.add(k); out.push(sl.sku.id); } }
  return out.slice(0, 6);
});
console.log('picks', picks.join(', '));

// Shoppers walking past can step between the camera and a product, or shove the player off aim with their collision
// circle, so the aim checks run with the shoppers parked (debug hook, see the headless-qa pitfall).
await ev(() => window.__sim.freezeShoppers(true)); await frames(1);

// --- take one directly
await ev((id) => window.__sim.lookAtSku(id), picks[0]);
await frames(2);
let r = await ev(() => { const it = window.__sim.interaction; return it.target ? it.target.type + ':' + (it.target.slot ? it.target.slot.sku.id : it.target.obj.kind) : null; });
ok(r && r.startsWith('sku:'), 'crosshair targets a product (' + r + ')');
await shot('01_target', 1);
await ev(() => window.__sim.key('KeyT')); await frames(3);
let st = await state();
ok(st.items.length === 1, 'T takes the item (' + st.items + ')');
await shot('02_taken', 2);

// --- inspect another: F, flip, language flip
await ev((id) => window.__sim.lookAtSku(id), picks[1]); await frames(2);
await ev(() => window.__sim.key('KeyI')); await frames(3);
st = await state(); ok(st.mode === 'inspect', 'I enters inspect mode');
await shot('03_inspect_front', 4);
await ev(() => window.__sim.key('Space')); await shot('04_inspect_back', 6);
await ev(() => window.__sim.setLang('th')); await shot('05_inspect_back_th', 6);
await ev(() => window.__sim.key('Space')); await shot('06_inspect_front_th', 6);
st = await state(); ok(st.ach >= 1, 'achievements granted so far: ' + st.ach);
await ev(() => window.__sim.setLang('en'));
await ev(() => window.__sim.key('KeyT')); await frames(3);
st = await state(); ok(st.items.length === 2 && st.mode === 'play', 'T in inspect takes the item and returns to play');

// --- hands hold 5 items; the 6th is refused until a basket is picked up
for (const id of picks.slice(2, 5)) {
  const at = await ev((i) => window.__sim.lookAtSku(i), id); await frames(4);   // headless frames are slow: wait for the target to update
  const n0 = (await state()).items.length, a = await aim() + ' drift:' + await ev((at) => Math.hypot(window.__sim.player.pos.x - at.px, window.__sim.player.pos.z - at.pz).toFixed(2), at); await ev(() => window.__sim.key('KeyT')); await frames(3);
  if ((await state()).items.length === n0) console.log('  DIAG take ' + id + ' missed, aim was ' + a);
}
st = await state(); ok(st.items.length === 5, 'hands hold 5 items (' + st.items.length + ')');
await ev((i) => window.__sim.lookAtSku(i), picks[5]); await frames(4); await ev(() => window.__sim.key('KeyT')); await frames(3);
st = await state(); ok(st.items.length === 5, '6th item refused without a basket');
await ev(() => { const s = window.__sim; s.interaction.activate({ kind: 'basket' }); }); await frames(3);
await ev((i) => window.__sim.lookAtSku(i), picks[5]); await frames(4); const a6 = await aim(); await ev(() => window.__sim.key('KeyT')); await frames(3);
st = await state(); ok(st.items.length === 6, 'with a basket the 6th item is accepted (' + st.items.length + ')');
if (st.items.length !== 6) console.log('  DIAG 6th item aim was ' + a6);

// --- alcohol is refused outside the legal hours (14:00-17:00) and allowed inside them
const beer = await ev(() => { const s = window.__sim.contents.pw.slots.find((x) => x.sku.alcohol); return s ? s.sku.id : null; });
if (beer) {
  await ev(() => window.__sim.setHour(15)); await ev((i) => window.__sim.lookAtSku(i), beer); await frames(3);
  const before = (await state()).items.length;
  await ev(() => window.__sim.key('KeyT')); await frames(2);
  ok((await state()).items.length === before, 'alcohol refused at 15:00 (' + beer + ')');
  await shot('06b_alcohol_closed', 2);
  await ev(() => window.__sim.setHour(19)); await ev((i) => window.__sim.lookAtSku(i), beer); await frames(3);
  await ev(() => window.__sim.key('KeyT')); await frames(2);
  ok((await state()).items.length === before + 1, 'alcohol accepted at 19:00');
  await ev(() => window.__sim.setHour(18));
}

// --- basket panel, codex, quests
await ev(() => window.__sim.open('basket')); await shot('07_basket', 3); await ev(() => window.__sim.close());
await ev(() => window.__sim.open('codex')); await shot('08_codex', 4); await ev(() => window.__sim.close());
await ev(() => window.__sim.open('quests')); await shot('09_quests', 3); await ev(() => window.__sim.close());

// --- walk to the till and pay
await ev(() => window.__sim.tp(2.7, -2.95, -Math.PI / 2, -0.05)); await frames(3);
r = await ev(() => { const it = window.__sim.interaction; return it.target ? it.target.type + ':' + (it.target.slot ? it.target.slot.sku.id : it.target.obj.kind) : null; });
ok(r === 'obj:npc', 'the cashier is targetable by aiming at her (' + r + ')');
await shot('10_till', 2);
await ev(() => window.__sim.key('KeyE')); await frames(2);
ok((await state()).panel === 'panel-talk', 'E on the cashier starts a conversation');
await shot('10b_talk', 3);
await ev(() => document.querySelector('#panel-talk .choice').click()); await frames(4);
await new Promise((r) => setTimeout(r, 400));
ok((await state()).panel === 'panel-checkout', '"I would like to pay" opens checkout');
// answer every question with the first (primary) button until the receipt appears
let guard = 0, shotN = 11;
while (guard++ < 40) {
  await new Promise((r) => setTimeout(r, 600));
  const s2 = await state();
  if (s2.panel === 'panel-receipt') break;
  const has = await ev(() => document.querySelectorAll('#co-choices button').length);
  if (has) {
    if (shotN < 15) await shot(`${shotN++}_checkout`, 2);
    const txt = await ev(() => document.querySelector('#co-choices button').textContent);
    console.log('  choice:', txt.replace(/\s+/g, ' ').trim());
    await ev(() => document.querySelector('#co-choices button').click());
  }
}
st = await state();
ok(st.panel === 'panel-receipt', 'receipt appears');
ok(st.items.length === 0 && st.bag.length > 0, 'basket emptied, bag filled (' + st.bag + ')');
ok(st.cash < 500, 'cash was deducted: ' + st.cash);
await shot('16_receipt', 3);
await ev(() => document.getElementById('receipt-done').click()); await frames(2);
ok((await state()).mode === 'play', 'back to play after receipt');
await ev(() => window.__sim.open('basket')); await ev(() => document.querySelector('#panel-basket [data-tab="bag"]').click()); await shot('17_bag', 3);
await ev(() => window.__sim.close());

// --- settings / controls / about / pause
for (const p of ['settings', 'controls', 'about', 'pause']) { await ev((p) => window.__sim.open(p), p); await shot('18_' + p, 3); await ev(() => window.__sim.close()); }

// --- ATM and hot water are targetable, ATM pays out cash
for (const kind of ['atm', 'hotwater', 'microwave']) {
  const t = await ev((kind) => {
    const s = window.__sim, ob = s.contents.ctx.interactables.find((o) => o.kind === kind);
    const cz = (ob.box.min.z + ob.box.max.z) / 2, cy = (ob.box.min.y + ob.box.max.y) / 2;
    s.tp(ob.box.max.x + 1.2, cz, Math.PI / 2, Math.atan2(cy - 1.6, 1.2));
    return kind;
  }, kind);
  await frames(3);
  const tg = await ev(() => { const it = window.__sim.interaction; return it.target ? it.target.type + ':' + (it.target.obj ? it.target.obj.kind : it.target.slot.sku.id) : null; });
  ok(tg === 'obj:' + kind, kind + ' is targetable (' + tg + ')');
  if (tg !== 'obj:' + kind) console.log('  DIAG ' + kind + ' aim ' + await aim());
  if (kind === 'atm') {
    const c0 = (await state()).cash;
    await ev(() => window.__sim.key('KeyE')); await frames(2);
    ok((await state()).cash === c0 + 500, 'ATM pays out 500 baht');
    await shot('19_atm', 2);
  }
}

// --- bilingual mode leads with English; M (music) / N (sound effects) / . keys; conversations
await ev(() => window.__sim.setLang('both'));
ok(await ev(() => document.documentElement.lang) === 'en', 'bilingual mode leads with English');
await shot('20_both_hud', 2);
ok(await ev(() => window.__sim.settings.muted === false && window.__sim.settings.musicOn === true), 'after Walk in: sound effects on (for the door greeting) and music on');
ok(await ev(() => { const s = window.__sim.settings; return s.sfx === 0.75 && s.ambience === 0.3 && s.music === 0.2; }), 'levels start at the default mix (effects 75, ambience 30, music 20)');
await page.keyboard.press('KeyN'); ok(await ev(() => window.__sim.settings.muted) === true, 'N turns sound effects off');
await page.keyboard.press('KeyN'); ok(await ev(() => window.__sim.settings.muted) === false, 'N turns sound effects on');
await page.keyboard.press('KeyM'); ok(await ev(() => window.__sim.settings.musicOn) === false, 'M turns the music off');
await page.keyboard.press('KeyM'); ok(await ev(() => window.__sim.settings.musicOn) === true, 'M turns the music on');
// flags draw their own colours: no icon stroke may leak onto them (this regressed once)
ok(await ev(() => [...document.querySelectorAll('svg.flag rect')].every((r) => getComputedStyle(r).stroke === 'none')), 'flags have no outline');
const t0 = await ev(() => window.__sim.settings.track); await page.keyboard.press('Period');
ok(await ev(() => window.__sim.settings.track) === (t0 + 1) % 4, '. skips to the next track');
ok(await ev(() => ['btn-info', 'btn-sound', 'btn-menu'].every((id) => !!document.getElementById(id))), 'always-on about / sound / menu buttons exist');
// one Sound button opens a popover with an effects switch and a music switch; a switch that is off folds its section
ok(await ev(() => { document.getElementById('btn-sound').click(); return !document.getElementById('soundpop').hidden; }), 'the Sound button opens the sound popover');
ok(await ev(() => { const on = window.__sim.settings.musicOn; document.querySelector('#soundpop [data-a=music]').click();
  return window.__sim.settings.musicOn === !on && document.querySelector('#soundpop .msec').classList.contains('off') === on; }), 'the popover music switch toggles music and folds its controls');
ok(await ev(() => { document.querySelector('#soundpop [data-a=music]').click(); document.querySelector('#soundpop [data-a=close]').click(); return document.getElementById('soundpop').hidden; }), 'the popover closes');
await ev(() => window.__sim.tp(3.5, -2.75, -Math.PI / 2, 0)); await frames(3);
await ev(() => window.__sim.key('KeyE')); await frames(2);
ok((await state()).panel === 'panel-talk', 'a conversation opens with E');
await page.keyboard.press('Digit1'); await frames(3);
await shot('21_talk', 3);
ok(await ev(() => window.__sim.save.talked.some((k) => k.startsWith('p:cashier'))), 'the cashier is remembered as met');
await page.keyboard.press('Escape'); await frames(2);
ok((await state()).mode === 'play', 'Esc leaves the conversation');
// the shoppers come back and walk again when unfrozen (the game never calls the hook)
{
  const r = await ev(() => {
    const s = window.__sim, ps = s.G.npcs.people.filter((p) => p.shopper), far = { pos: { x: 200, z: 200 } };
    s.freezeShoppers(false);
    const a = ps.map((p) => [p.group.position.x, p.group.position.z]);
    for (let t = 0; t < 20; t += 0.05) s.G.npcs.update(0.05, t, far);   // fast-forward 20 s of walking
    return { back: ps.length > 0 && ps.every((p, i) => !p.frozen && Math.hypot(a[i][0], a[i][1]) < 30), moved: ps.some((p, i) => Math.hypot(p.group.position.x - a[i][0], p.group.position.z - a[i][1]) > 0.5) };
  });
  ok(r.back && r.moved, `unfrozen shoppers are back in the store (${r.back}) and walking (${r.moved})`);
}
const errs = logs.filter((l) => /^\[(error|pageerror)\]/.test(l));
// --- people walk around fixtures, not through them (fast-forward 3 minutes of NPC movement)
{
  const r = await ev(() => {
    const s = window.__sim, far = { pos: { x: 200, z: 200 } };
    let inside = 0; const who = new Set();
    for (let t = 0; t < 180; t += 0.05) {
      s.G.npcs.update(0.05, t, far);
      for (const p of s.G.npcs.people) {
        const x = p.group.position.x, z = p.group.position.z;
        for (const c of s.colliders) {
          if (!c.on || c.tag === 'door') continue;
          const cx = Math.max(c.x0, Math.min(x, c.x1)), cz = Math.max(c.z0, Math.min(z, c.z1));
          if ((x - cx) ** 2 + (z - cz) ** 2 < 0.15 * 0.15) { inside++; who.add((p.talkId || '?') + '/' + c.tag); break; }
        }
      }
    }
    return { inside, who: [...who].join(', ') };
  });
  ok(r.inside === 0, 'NPCs never walk through fixtures' + (r.inside ? ` (${r.inside} frames: ${r.who})` : ''));
}
await ev(() => window.__sim.freezeShoppers(true)); await frames(1);
// There is no zone around the till: the rack items in front of the counter and the counter top never select the cashier.
{
  const picks = await ev(() => [...new Set(window.__sim.slotsWhere('IMP[12]'))].slice(0, 10));
  let tillHits = 0; const others = [];
  for (const p of picks) {
    const [id, tag] = p.split('|');
    await ev(([id, tag]) => window.__sim.lookAtSku(id, tag), [id, tag]); await frames(6);   // let the target catch up (frames, not ms)
    const who = await ev(() => { const t = window.__sim.interaction.target; return t && t.type === 'obj' && t.obj.kind === 'npc' ? t.obj.id : null; });
    if (who === 'cashier') tillHits++; else if (who) others.push(who);   // a shopper walking past can block the view; that is fine
  }
  ok(picks.length > 0 && tillHits === 0, `impulse rack items never select the cashier (${tillHits}/${picks.length} did${others.length ? '; shoppers in the way: ' + others.join(', ') : ''})`);
  await ev(() => window.__sim.tp(2.9, -2.75, -Math.PI / 2, -0.54)); await frames(3);   // crosshair on the counter top right in front of her
  ok(await ev(() => { const t = window.__sim.interaction.target; return !(t && t.type === 'obj' && t.obj.kind === 'npc'); }), 'aiming at the counter top in front of the cashier does not select her');
}
// W A S D move like the arrow keys and never turn the view (the mouse looks)
{
  await ev(() => window.__sim.tp(0.5, 3.5, 0, 0)); await frames(3);
  const a = await ev(() => ({ z: window.__sim.player.pos.z, yaw: window.__sim.player.yaw }));
  await page.keyboard.down('KeyW'); await frames(12); await page.keyboard.up('KeyW');
  await page.keyboard.down('KeyA'); await frames(6); await page.keyboard.up('KeyA');
  const b = await ev(() => ({ z: window.__sim.player.pos.z, yaw: window.__sim.player.yaw }));
  ok(b.z < a.z - 0.1 && b.yaw === a.yaw, `W moves forward and A does not turn (dz ${(b.z - a.z).toFixed(2)}, dyaw ${(b.yaw - a.yaw).toFixed(3)})`);
}
// Mouse look: L captures the mouse (moving looks, a click still acts); Esc frees it without the menu, a second Esc opens
// the menu; L also frees it; the look button toggles it too
{
  await ev(() => window.__sim.close()); await ev(() => window.__sim.tp(0.5, 3.5, 0, 0)); await frames(3);
  await page.mouse.click(640, 700); await frames(2);   // focus the page (a user gesture), like a player would
  await page.keyboard.press('KeyL'); await frames(4);
  const onL = await ev(() => document.pointerLockElement === document.getElementById('gl') && document.getElementById('btn-look').classList.contains('on'));
  const y0 = await ev(() => window.__sim.player.yaw); await page.mouse.move(700, 400); await page.mouse.move(760, 400); await frames(3);
  const looks = (await ev(() => window.__sim.player.yaw)) !== y0;
  // right-click inspects the item in the crosshair (again puts it back); holding the middle button zooms
  await ev(() => { const s = window.__sim.contents.pw.slots.find((x) => !x.taken && /IMP1/.test(x.gkey)); window.__sim.lookAtSku(s.sku.id); }); await frames(6);
  await page.mouse.down({ button: 'right' }); await page.mouse.up({ button: 'right' }); await frames(6);
  const rInspect = await ev(() => window.__sim.G.mode === 'inspect');
  await page.mouse.down({ button: 'right' }); await page.mouse.up({ button: 'right' }); await frames(6);
  const rBack = await ev(() => window.__sim.G.mode === 'play');
  await page.mouse.down({ button: 'middle' }); await frames(12);
  const mZoom = await ev(() => window.__sim.player.zoomT > 0.5); await page.mouse.up({ button: 'middle' }); await frames(3);
  ok(rInspect && rBack && mZoom, `mouse look: right-click inspects (${rInspect}) and puts back (${rBack}), middle button zooms (${mZoom})`);
  await page.keyboard.press('Escape'); await frames(4);
  const freed = await ev(() => !document.pointerLockElement && document.getElementById('panels').hidden);
  await new Promise((r) => setTimeout(r, 300)); await page.keyboard.press('Escape'); await frames(3);
  const menu = await ev(() => document.getElementById('panel-pause').classList.contains('on'));
  await ev(() => window.__sim.close()); await frames(3);
  await page.keyboard.press('KeyL'); await frames(4); await page.keyboard.press('KeyL'); await frames(4);
  const offL = await ev(() => !document.pointerLockElement && !document.getElementById('btn-look').classList.contains('on'));
  await page.click('#btn-look'); await frames(4);
  const onBtn = await ev(() => !!document.pointerLockElement); await page.keyboard.press('KeyL'); await frames(3);
  ok(onL && looks && freed && menu && offL && onBtn, `mouse look: L on (${onL}), moving looks (${looks}), Esc frees without the menu (${freed}), 2nd Esc menu (${menu}), L off (${offL}), button on (${onBtn})`);
}
ok(errs.length === 0, 'no console errors' + (errs.length ? '\n' + errs.slice(0, 6).join('\n') : ''));
console.log(fails ? `\n${fails} FAILED` : '\nALL OK');
await browser.close();
process.exit(fails ? 1 : 0);

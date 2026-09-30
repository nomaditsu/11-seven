import * as THREE from 'three';
import { G } from './core/state.js';
import { settings, defaults, save, loadAll, QUALITY, flush, markDirty } from './core/settings.js';
import { setLanguageMode, lang, tp, t, pick } from './core/i18n.js';
import { initInput, onInput, requestLock, exitLock, lockPointer, input, consumeMouse } from './input.js';
import { Player } from './player.js';
import { buildInteriorEnv } from './gfx/envmaps.js';
import { initMaterials, ENV, bindGlassEnv } from './world/materials.js';
import { Environment } from './world/environment.js';
import { Store } from './world/store.js';
import { Exterior } from './world/exterior.js';
import { Traffic } from './world/vehicles.js';
import { StreetProps } from './world/street_props.js';
import { Npcs } from './world/npcs.js';
import { CoolerDoors } from './world/cooler_doors.js';
import { buildStoreContents } from './world/build.js';
import { pumpLocalized, setLocalizedFocus, debugPaintAll, localizedPending } from './gfx/localized.js';
import { setMaxAniso } from './gfx/surfaces.js';
import { nextFrame, clamp, lerp, smooth, damp } from './core/util.js';
import { SKUS } from './data/skus.js';
import { showSheet } from './sheet.js';
import { initUI, ui, changeLanguage, showZone, setProgress, hideTitle, showTitle, toast, achievement, updateHud, updateHints, updateObjective, showZoomFrame, say, elements as uiEl, $, refreshTop, toggleSound, toggleMusic, skipTrack } from './ui/ui.js';
import { initPanels, invalidateThumbs, renderBasket } from './ui/panels.js';
import { Hands } from './game/hand.js';
import { Interaction } from './game/interact.js';
import { S, count, fmtClock, grantAch, alcoholAllowed } from './game/session.js';
import { initAudio, updateAudio, sfx, applyVolumes, speakThai, speakGreeting, setMuted, setMusicOn, audio } from './game/audio.js';
import { talkKey, cleanup as talkCleanup, talkActive } from './game/talk.js';
import { initTouch, syncTouchMode } from './ui/touch.js';
import { initSoundPop, soundPopOpen, closeSoundPop } from './ui/soundpop.js';
import { initOffline, showInstallHint } from './core/pwa.js';
import { checkoutActive, checkoutKey } from './game/checkout.js';
import { drawReceipt } from './game/receipt.js';
import { QUESTS } from './data/quests.js';
import { L } from './world/layout.js';
import { COLLIDERS } from './world/colliders.js';
import { PHRASES } from './core/strings.js';

const params = new URLSearchParams(location.search);
G.debug = params.has('debug');

async function boot() {
  initOffline(params);
  loadAll();
  // Every visit starts with sound and music off. Browsers block audio until the first click anyway, so showing them
  // as on made the buttons lie and it took two clicks to hear anything. One click on either button now starts it.
  settings.muted = true; settings.musicOn = false;
  // Sound effects start at the same volume as the music every session. A saved 0 (a slider left down) made the
  // door greeting and voices inaudible with no clue why. If music is near 0 too, both go back to the default.
  { const lvl = settings.music >= 0.1 ? settings.music : defaults.music; settings.music = lvl; settings.sfx = lvl; }
  if (params.get('lang')) settings.lang = params.get('lang');
  if (params.get('q')) settings.quality = params.get('q');
  setLanguageMode(settings.lang);
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => {})));
  if (params.has('sheet')) { showSheet(params); return; }

  initUI();
  showInstallHint();
  initSoundPop();
  initPanels();
  // Sound and music are on from the first page load. Browsers hold audio until the first click / key press, so
  // (re)start it on the first gesture anywhere, including the title-screen sound buttons.
  const WAKE = ['pointerdown', 'keydown', 'touchend'];
  const wake = () => { initAudio(); if (audio.ctx && audio.ctx.state === 'running') for (const ev of WAKE) removeEventListener(ev, wake, true); };
  for (const ev of WAKE) addEventListener(ev, wake, true);
  setProgress(0.04);

  const q = QUALITY[settings.quality] || QUALITY.med;
  q.texScale = { low: 6, med: 8, high: 11 }[settings.quality] || 8;
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: q.antialias, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q.pixelRatio));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = q.shadows;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  setMaxAniso(renderer.capabilities.getMaxAnisotropy());
  G.renderer = renderer;

  const scene = new THREE.Scene();
  G.scene = scene;
  const camera = new THREE.PerspectiveCamera(settings.fov, innerWidth / innerHeight, 0.04, 1600);
  scene.add(camera);
  G.camera = camera;

  // ---- lighting environments & materials
  const pm = new THREE.PMREMGenerator(renderer);
  ENV.inTex = buildInteriorEnv(pm).texture;
  const env = new Environment(scene, renderer, q);
  G.hourNow = params.get('hour') ? +params.get('hour') : settings.timeHour;
  env.setHour(G.hourNow, true);
  initMaterials(); bindGlassEnv();
  G.env = env;
  setProgress(0.1); await nextFrame();

  // ---- world
  const store = new Store(scene, q); store.build(); G.store = store;
  const exterior = new Exterior(scene, q); exterior.build(); G.exterior = exterior;
  const traffic = new Traffic(scene, q); G.traffic = traffic;
  const props = new StreetProps(scene, exterior); props.build(q); G.props = props;
  env.onChange((e) => exterior.applyTime(e));
  exterior.applyTime(env);
  setProgress(0.3); await nextFrame();
  const contents = await buildStoreContents(scene, q, (p) => setProgress(0.3 + 0.5 * p));
  G.contents = contents;
  setProgress(0.82); await nextFrame();

  // ---- player, hands, interaction
  const player = new Player(camera);
  G.player = player;
  const hands = new Hands(camera, contents.pw);
  G.hands = hands;
  contents.ctx.cooler = new CoolerDoors(scene, contents.ctx.coolerDoors, { onOpen: () => sfx('fridgeOpen'), onClose: () => sfx('fridgeClose') });
  const npcs = new Npcs(scene, q); npcs.build(); G.npcs = npcs;
  const interaction = new Interaction({ camera, player, pw: contents.pw, ctx: contents.ctx, hands, store, npcs });
  interaction.dynamic.push(...npcs.targets);
  interaction.dynamic.push({ kind: 'dog', box: new THREE.Box3(new THREE.Vector3(-4.4, 0, 2.9), new THREE.Vector3(-2.8, 0.55, 3.8)), maxDist: 2.6 });
  G.interaction = interaction;
  initInput(canvas);
  initTouch(interaction);

  refreshTop(); updateHints();
  ui.hooks.startGame = () => startGame();
  ui.hooks.toTitle = () => returnToTitle();
  ui.hooks.putBackItem = (sku) => interaction.putBackItem(sku);
  ui.hooks.inspectOwned = (sku) => { ui.returnToPause = false; ui.close(); interaction.inspectOwned(sku); };
  ui.hooks.setHour = (h) => { G.hourNow = h; env.setHour(h, true); };
  ui.hooks.speak = (txt, rom) => speakThai(txt, rom);
  ui.hooks.audioChanged = () => applyVolumes();
  ui.hooks.carryChanged = () => syncTouchMode();   // touch button icon / label: hands vs basket
  ui.hooks.questChanged = () => updateObjective();
  ui.hooks.onLanguage = (mode, before) => {
    invalidateThumbs();
    interaction.refreshInspect();
    updateHints(); updateObjective();
    if (G.inspecting && before !== mode && grantAch('bilingual')) { achievement('bilingual'); sfx('achievement'); }
    sfx('tick');
    if (ui.panel === 'basket') renderBasket();
  };
  ui.hooks.onPanel = (id, open) => {
    if (id === 'talk' && !open) talkCleanup();
    if (open && id === 'basket') renderBasket();
  };
  $('receipt-done').addEventListener('click', () => ui.close());
  $('receipt-save').addEventListener('click', () => {
    const c = $('receipt-canvas');
    const a = document.createElement('a'); a.download = '11-seven-receipt.png'; a.href = c.toDataURL('image/png'); a.click(); toast(tp('toast.saved'), 'good');
  });
  ui.refreshers.set('receipt', () => { if (ui.hooks.lastReceipt) drawReceipt($('receipt-canvas'), ui.hooks.lastReceipt); });

  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    interaction.frameInspect();
  });

  // ---- input wiring
  player.onStep = (k) => { if (player.pos.z < 0.2) sfx('step', k); };
  // Mouse look: L (or the look button) captures the mouse so moving it looks; L or Esc frees it. The Esc that frees it
  // does not open the menu; a second Esc does.
  onInput('lockchange', (locked) => {
    refreshTop();
    if (locked) { uiEl.clickcatch.hidden = true; if (!input.lockTipShown) { input.lockTipShown = true; toast(tp('look.on'), '', 3000); } return; }
    if (G.started && (G.mode === 'play' || G.mode === 'inspect') && !ui.panel) toast(tp('look.off'), '', 2600);
  });
  onInput('lockerror', () => { toast(tp('look.failed'), 'warn', 4200); });
  // in mouse look, right-click inspects (like I; again to put it back) and the middle button zooms (player.js)
  onInput('mousedown', (button) => {
    if (button !== 2 || !input.locked || ui.panel || (G.mode !== 'play' && G.mode !== 'inspect')) return;
    interaction.onKey('KeyI');
  });
  ui.hooks.toggleLook = () => {
    if (input.locked) { exitLock(); return; }
    if (!G.started || input.touch || ui.panel || ui.popOpen || (G.mode !== 'play' && G.mode !== 'inspect')) return;
    lockPointer();
  };
  // A click (press without dragging) on the world takes / talks / uses; dragging only looks around.
  onInput('click', () => {
    if (!G.started || ui.panel || ui.popOpen || performance.now() - (ui.popClosedAt || 0) < 450) return;   // a tap that closed the sound popover does nothing else
    if (G.mode === 'play') interaction.primary();
    else if (G.mode === 'inspect') interaction.inspectTake();
  });
  onInput('keydown', (code, e) => {
    // sound / music keys work on the title screen too
    if (code === 'KeyM') { initAudio(); toggleMusic(); return; }   // M = music
    if (code === 'KeyN') { initAudio(); toggleSound(); return; }   // N = sound effects (+ ambience, voices)
    if (code === 'Period') { initAudio(); skipTrack(1); return; }
    if (code === 'Comma') { initAudio(); skipTrack(-1); return; }
    if (code === 'Escape' && soundPopOpen()) { closeSoundPop(); return; }
    // the Esc that frees a captured mouse only frees it (whether it arrives before or just after the release)
    if (code === 'Escape' && (input.locked || performance.now() - input.unlockedAt < 250)) { exitLock(); return; }
    if (!G.started) return;
    if (ui.panel === 'talk') { if (talkKey(code)) return; }
    if (ui.panel === 'checkout' && /^Digit[1-9]$/.test(code)) { const b = document.querySelectorAll('#co-choices button')[+code.slice(5) - 1]; if (b) b.click(); return; }
    if (code === 'KeyL') { ui.hooks.toggleLook(); return; }   // L = mouse look on / off (language lives in the menu)
    if (code === 'Escape') {
      if (ui.panel && ui.panel !== 'pause') ui.close();
      else if (ui.panel === 'pause') ui.close();
      else if (G.mode === 'inspect') interaction.endInspect(true);
      else if (G.mode === 'play') ui.open('pause');
      return;
    }
    const toggles = { KeyB: 'basket', Tab: 'basket', KeyK: 'codex', KeyQ: 'quests' };
    if (toggles[code] && (G.mode === 'play' || G.mode === 'ui' || G.mode === 'inspect') && !checkoutActive() && ui.panel !== 'receipt' && ui.panel !== 'talk') {
      if (G.mode === 'inspect') interaction.endInspect(true);
      ui.toggle(toggles[code]); return;
    }
    if (code === 'KeyH') { settings.hints = !settings.hints; markDirty(); updateHints(); return; }
    if (G.mode === 'play' || G.mode === 'inspect') interaction.onKey(code);
  });

  function startGame() {
    if (G.started && G.mode !== 'title') return;
    initAudio();
    // Walk in is a click, so the browser now allows audio: switch sound effects (the door greeting needs them) and
    // music on together, unless the player already set either one on the start screen.
    if (!ui.soundTouched && settings.muted) setMuted(false);
    if (!ui.musicTouched && !settings.musicOn) setMusicOn(true);
    applyVolumes(); refreshTop();
    G.started = true; G.mode = 'play';
    hideTitle();
    player.teleport(0.5, 4.5, 0.0, -0.06);
    requestLock();
    document.getElementById('gl').focus();
    save.visits = (save.visits || 0) + 1;
    if (grantAch('first')) setTimeout(() => { achievement('first'); sfx('achievement'); }, 1500);
    toast(tp('hud.hint.enter'), '', 5000);
    setTimeout(() => { if (G.mode === 'play') showZone('zone.outside', 'zone.outsideSub'); }, 900);   // location card, like a level title
    updateHints(); updateObjective();
  }
  function returnToTitle() {
    ui.panel = null;
    document.getElementById('panels').hidden = true;
    document.querySelectorAll('#panels .panel').forEach((p) => p.classList.remove('on'));
    if (interaction.insp) interaction.endInspect(true);
    G.mode = 'title'; G.started = false; showTitle();
    exitLock();
  }

  G.mode = 'title';
  setProgress(1, true);
  initAudio();   // plays right away where the browser allows it, otherwise on the first gesture (above)

  // ---- debug / test API
  window.__sim = {
    G, THREE, contents, S, save, settings, interaction, player, hands, env, store, audio, colliders: COLLIDERS,
    tp(x, z, yaw = 0, pitch = 0) { player.teleport(x, z, yaw, pitch); },
    setHour(h) { G.hourNow = h; env.setHour(h, true); },
    setLang(m) { changeLanguage(m, true); },
    start() { startGame(); },
    key(code) { interaction.onKey(code); },
    freezeShoppers(on = true) { npcs.freezeShoppers(on); },
    info() { return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geoms: renderer.info.memory.geometries, tex: renderer.info.memory.textures, skus: SKUS.length, items: contents.pw.slots.length }; },
    lookAtSku(id, tagRe) {
      const re = tagRe ? new RegExp(tagRe) : null;
      const s = contents.pw.slotsOf(id).find((x) => !x.taken && (!re || re.test(x.gkey))); if (!s) return null;
      const cx = (s.box.min.x + s.box.max.x) / 2, cz = (s.box.min.z + s.box.max.z) / 2, cy = s.y + s.size.h / 2;
      const nx = Math.sin(s.rotY), nz = Math.cos(s.rotY);
      const px = cx + nx * 0.95, pz = cz + nz * 0.95;
      player.teleport(px, pz, Math.atan2(-(cx - px), -(cz - pz)), Math.atan2(cy - 1.6, 0.95));
      return { px, pz, cy };
    },
    slotsWhere(tagRe) { const re = new RegExp(tagRe); return contents.pw.slots.filter((x) => re.test(x.gkey)).map((x) => x.sku.id + '|' + x.gkey.split('|')[1]); },
    paintAll() { return debugPaintAll(); },
    pending() { return localizedPending(); },
    open(id) { ui.open(id); },
    toast(msg, kind) { toast(msg, kind, 6000); },
    zone() { showZone('zone.outside', 'zone.outsideSub'); },
    close() { ui.close(); },
  };

  // ---- main loop
  let lastClosed = null;
  let last = performance.now(), hudT = 0, clockAcc = 0, prevZ = 4.5, titleT = Math.random() * 100;
  const tmpV = new THREE.Vector3();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    G.dt = dt; G.time += dt; G.frame = (G.frame || 0) + 1;
    if (document.body.dataset.mode !== G.mode) { document.body.dataset.mode = G.mode; syncTouchMode(); }
    const playing = G.mode === 'play' || G.mode === 'inspect';
    if (G.mode === 'title') {
      titleT += dt * 0.05;
      camera.position.set(3.5 + Math.sin(titleT) * 5, 2.4 + Math.sin(titleT * 0.7) * 0.3, 11.5 - Math.cos(titleT * 0.6) * 1.5);
      camera.lookAt(-1.2, 2.6, 0);
      camera.fov = 52; camera.updateProjectionMatrix();
      store.update(dt, 99, 99);        // door stays closed on the title screen
    } else {
      player.update(dt, G.mode === 'play' || G.mode === 'inspect');
      showZoomFrame(player.zoomT > 0.5);
      store.update(dt, player.pos.x, player.pos.z);
      interaction.update(dt);
    }
    // world clock
    if (settings.clockRuns && G.mode !== 'ui') {
      G.hourNow = (G.hourNow + dt / 60) % 24;
      clockAcc += dt;
      if (clockAcc > 0.5) { clockAcc = 0; env.setHour(G.hourNow, false); }
    }
    env.update(dt, G.time, camera.position);
    G.vehicles = traffic.update(dt, player.pos.x);
    props.update(dt, G.time);
    contents.ctx.cooler.update(dt, G.time);
    { const closed = !alcoholAllowed(G.hourNow); if (closed !== lastClosed) { lastClosed = closed; for (const c of contents.ctx.alcoholCovers) c.visible = closed; } }
    npcs.update(dt, G.time, player);
    for (const r of contents.ctx.rollers || []) r.rotation.x += dt * 1.4;
    const ear = G.mode === 'title' ? camera.position : player.pos;   // the title fly-by hears the street
    G.insideness = smooth(0.8, -1.2, ear.z);
    G.doorOpen = store.door.open;
    // door chime when crossing the threshold
    if (G.mode !== 'title') {
      const z = player.pos.z;
      // (the chime and the staff greeting fire when the doors open: store.onDoorOpen below)
      prevZ = z;
    }
    hands.update(dt, player.moving, G.mode === 'inspect' ? [player.mdx || 0, player.mdy || 0] : null);
    camera.getWorldDirection(tmpV); setLocalizedFocus(camera.position.x, camera.position.z, tmpV.x, tmpV.z);
    pumpLocalized(7);
    updateAudio(dt, { inside: G.insideness, door: G.doorOpen, night: env.nightness, vehicles: G.vehicles || [], px: ear.x, pz: ear.z, depth: clamp(-ear.z / 8, 0, 1) });
    hudT += dt;
    if (hudT > 0.25 && G.mode !== 'title') {
      hudT = 0;
      updateHud({ hour: G.hourNow, outC: Math.round(28 + 7 * env.daylight) });
    }
    // render: world (dimmed while inspecting) then hands on top
    renderer.toneMappingExposure = lerp(1.0, 0.28, hands.dim);
    renderer.autoClear = true;
    renderer.render(scene, camera);
    if (G.mode !== 'title' && (hands.basket.visible || hands.flies.length || hands.inspect || hands.handItems.children.length)) {
      renderer.autoClear = false; renderer.clearDepth(); renderer.toneMappingExposure = 1.0;
      renderer.render(hands.scene, camera);
      renderer.autoClear = true;
    }
  });

  // Every time the doors open: the door chime, then the cashier calls out สวัสดีค่ะ เชิญค่ะ in a Thai female voice.
  store.onDoorOpen = () => {
    if (G.mode === 'title') return;
    sfx('chime'); sfx('slide');
    setTimeout(() => { say(PHRASES.doorGreet, {}, 3200, { speak: false }); speakGreeting(PHRASES.doorGreet); }, 450);
  };

  if (params.has('autostart')) { window.__ready = true; startGame(); G.mode = 'play'; }
  window.__ready = true;
}
boot().catch((e) => { console.error('BOOT FAILED', e); document.title = 'BOOT FAILED: ' + e.message; });

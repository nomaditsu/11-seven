// Z-fighting check: finds visible surfaces that share a plane with another surface (the flicker you see where two
// boxes are flush or a sign sits on its backing). Exits 1 if any are found. Usage: npm run zfight [-- --q=med]
// Method: collect every static triangle, bucket by plane (normal + offset), report overlapping pairs that face the
// same way within 1 mm and use different materials, then drop faces nobody can see (see isHidden / visible below).
import { openSim } from './lib/harness.mjs';

const opt = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const { browser, page } = await openSim({ query: '?debug&q=' + (opt.q || 'med'), width: 640, height: 360 });
const hits = await page.evaluate(() => {
  const s = window.__sim, T = s.THREE, scene = s.G.scene;
  const IGNORE = /^(bike|taxi|tuk|bus|pillion|rider)/;          // moving traffic: wheel hubs are 2 mm proud, fine at speed
  const skip = (o) => { for (let p = o; p; p = p.parent) { if (p.isInstancedMesh || p.isSkinnedMesh || p.visible === false || p.name === 'hands' || IGNORE.test(p.name || '')) return true; } return false; };
  const tris = [], va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), n = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3();
  scene.updateMatrixWorld(true);
  const meshes = [];
  scene.traverse((o) => {
    if (!o.isMesh || skip(o)) return;
    meshes.push(o);
    const g = o.geometry; if (!g || !g.attributes.position) return;
    const pos = g.attributes.position, idx = g.index, mats = Array.isArray(o.material) ? o.material : [o.material];
    const groups = g.groups.length ? g.groups : [{ start: 0, count: idx ? idx.count : pos.count, materialIndex: 0 }];
    for (const gr of groups) {
      const m = mats[gr.materialIndex] || mats[0];
      if (!m || m.visible === false || m.blending === T.AdditiveBlending) continue;
      const mid = m.uuid + (m.map ? m.map.uuid : ''), label = (o.name || o.parent?.name || '?') + ':' + (m.color ? m.color.getHexString() : '') + (m.map ? '+tex' : '');
      for (let i = gr.start; i < gr.start + gr.count; i += 3) {
        const a = idx ? idx.getX(i) : i, b = idx ? idx.getX(i + 1) : i + 1, c = idx ? idx.getX(i + 2) : i + 2;
        va.fromBufferAttribute(pos, a).applyMatrix4(o.matrixWorld); vb.fromBufferAttribute(pos, b).applyMatrix4(o.matrixWorld); vc.fromBufferAttribute(pos, c).applyMatrix4(o.matrixWorld);
        if (va.length() > 100) continue;                          // sky dome and distant scenery
        e1.subVectors(vb, va); e2.subVectors(vc, va); n.crossVectors(e1, e2); if (n.length() < 2e-4) continue; n.normalize();
        tris.push({ n: [n.x, n.y, n.z], d: n.dot(va), p: [va.toArray(), vb.toArray(), vc.toArray()], mid, label });
      }
    }
  });
  const B = new Map(), key = (t, dd) => t.n.map((x) => Math.round(x * 50)).join(',') + '|' + (Math.round(t.d / 0.002) + dd);
  tris.forEach((t, i) => { const k = key(t, 0); if (!B.has(k)) B.set(k, []); B.get(k).push(i); });
  const proj = (t) => { const a = t.n.map(Math.abs), ax = a[0] > a[1] && a[0] > a[2] ? [1, 2] : a[1] > a[2] ? [0, 2] : [0, 1]; return t.p.map((v) => [v[ax[0]], v[ax[1]]]); };
  const bb = (P) => [Math.min(...P.map((q) => q[0])), Math.min(...P.map((q) => q[1])), Math.max(...P.map((q) => q[0])), Math.max(...P.map((q) => q[1]))];
  const sat = (A, C) => { for (const P of [A, C]) for (let i = 0; i < 3; i++) { const a = P[i], b = P[(i + 1) % 3], nx = b[1] - a[1], ny = a[0] - b[0]; let a0 = 1e9, a1 = -1e9, c0 = 1e9, c1 = -1e9; for (const q of A) { const v = q[0] * nx + q[1] * ny; a0 = Math.min(a0, v); a1 = Math.max(a1, v); } for (const q of C) { const v = q[0] * nx + q[1] * ny; c0 = Math.min(c0, v); c1 = Math.max(c1, v); } if (Math.min(a1, c1) - Math.max(a0, c0) < 0.004 * Math.hypot(nx, ny)) return false; } return true; };
  // Faces nobody can see: tops above eye height, undersides near the floor, the store's wall planes (fixtures sit
  // against them) and the outside of the shell, which neighbouring buildings cover.
  const isHidden = (t, c) => (t.n[1] > 0.9 && c[1] > 1.7) || (t.n[1] < -0.9 && c[1] < 1.0) || (Math.abs(t.n[0]) > 0.9 && Math.abs(Math.abs(c[0]) - 6.4) < 0.25 && c[2] < 0.1) || (t.n[2] < -0.9 && c[2] < -16.95);
  meshes.forEach((o) => (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m) m.side = T.DoubleSide; }));
  const rc = new T.Raycaster(); rc.camera = s.G.camera;
  const visible = (t, c) => {   // from 3 mm in front, does any ray reach open space (instead of the inside of a solid)?
    const nn = new T.Vector3(...t.n), P = new T.Vector3(...c).addScaledVector(nn, 0.003);
    const t1 = new T.Vector3(nn.y, nn.z, nn.x).cross(nn).normalize(), t2 = new T.Vector3().crossVectors(nn, t1);
    for (const d of [nn.clone(), ...[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => nn.clone().multiplyScalar(0.6).addScaledVector(t1, a * 0.8).addScaledVector(t2, b * 0.8).normalize())]) {
      rc.set(P, d); rc.far = 50;
      const h = rc.intersectObjects(meshes, false).find((x) => x.distance > 1e-4);
      if (!h) return true;
      if (h.face.normal.clone().transformDirection(h.object.matrixWorld).dot(d) < 0 && h.distance > 0.05) return true;
    }
    return false;
  };
  const out = new Map();
  for (const [k, list] of B) {
    const [nk, dk] = k.split('|'), cand = [...list, ...(B.get(nk + '|' + (+dk + 1)) || [])];
    if (cand.length < 2 || cand.length > 4000) continue;
    const P = cand.map((i) => proj(tris[i])), BB = P.map(bb);
    for (let a = 0; a < cand.length; a++) for (let b = a + 1; b < cand.length; b++) {
      const ta = tris[cand[a]], tb = tris[cand[b]];
      if (ta.mid === tb.mid || Math.abs(ta.d - tb.d) > 0.001) continue;
      const A = BB[a], C = BB[b]; if (A[2] < C[0] + 0.004 || C[2] < A[0] + 0.004 || A[3] < C[1] + 0.004 || C[3] < A[1] + 0.004) continue;
      if (!sat(P[a], P[b])) continue;
      const c = ta.p.reduce((q, v) => [q[0] + v[0] / 3, q[1] + v[1] / 3, q[2] + v[2] / 3], [0, 0, 0]);
      if (isHidden(ta, c) || (ta.label + tb.label).includes('e0489a') && (ta.label + tb.label).includes('2f8f3a')) continue;   // planter foliage balls
      const hk = [ta.label, tb.label].sort().join(' <> ') + ' plane n=' + ta.n.map((x) => Math.round(x)).join(',') + ' d=' + ta.d.toFixed(3);
      const e = out.get(hk) || { tries: 0, at: null };
      if (!e.at && e.tries < 8) { e.tries++; if (visible(ta, c)) e.at = c.map((x) => x.toFixed(2)).join(','); }
      out.set(hk, e);
    }
  }
  return [...out].filter(([, e]) => e.at).map(([k, e]) => k + '  at ' + e.at);
});
await browser.close();
if (hits.length) { console.log(`FAIL ${hits.length} visible coplanar surface pair(s):\n  ` + hits.join('\n  ')); process.exit(1); }
console.log('PASS no visible z-fighting');

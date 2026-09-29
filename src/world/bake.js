// Merge static meshes that share a material into a single draw call.
// Anything animated or toggled at runtime is protected by setting `userData.keep = true` on it (or an ancestor).
import * as THREE from 'three';

const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4();

function keptByAncestor(o, root) {
  for (let p = o; p && p !== root; p = p.parent) if (p.userData && p.userData.keep) return true;
  return false;
}

export function bakeStatic(root, { minGroup = 2, keep = null } = {}) {
  root.updateMatrixWorld(true);
  _inv.copy(root.matrixWorld).invert();
  const keepSet = keep ? new Set(keep) : null;
  const buckets = new Map();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible || Array.isArray(o.material)) return;
    if (keepSet && keepSet.has(o)) return;
    if (keptByAncestor(o, root)) return;
    const g = o.geometry;
    if (!g || !g.attributes.position || !g.attributes.normal || g.groups.length) return;
    if (o.matrixWorld.determinant() < 0) return;
    const sig = Object.keys(g.attributes).sort().join(',') + (g.index ? ':i' : ':n');
    const key = [o.material.uuid, o.castShadow ? 1 : 0, o.receiveShadow ? 1 : 0, o.renderOrder, sig, o.frustumCulled ? 1 : 0].join('|');
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = []));
    b.push(o);
  });
  let before = 0, after = 0;
  for (const arr of buckets.values()) {
    before += arr.length;
    if (arr.length < minGroup) { after += arr.length; continue; }
    const geos = arr.map((m) => {
      const g = m.geometry.clone();
      g.applyMatrix4(_m.multiplyMatrices(_inv, m.matrixWorld));
      return g;
    });
    const merged = THREE.mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    if (!merged) { after += arr.length; continue; }
    const src = arr[0];
    const mesh = new THREE.Mesh(merged, src.material);
    mesh.castShadow = src.castShadow; mesh.receiveShadow = src.receiveShadow; mesh.renderOrder = src.renderOrder;
    mesh.name = (src.name || 'baked') + '*';
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    root.add(mesh);
    for (const m of arr) if (m.parent) m.parent.remove(m);
    after++;
  }
  return { before, after };
}

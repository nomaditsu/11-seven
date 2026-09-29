// 2D (x/z) axis-aligned colliders + circle-vs-AABB resolution for the player and NPCs.
export const COLLIDERS = [];   // { x0, z0, x1, z1, tag, on }
export const TRIGGERS = [];    // { x0, z0, x1, z1, id }
export const DYN = [];         // moving circles (people): { x, z, r }

export function addCollider(x0, z0, x1, z1, tag = '') {
  const c = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), tag, on: true };
  COLLIDERS.push(c);
  return c;
}
// Push a circle out of the static colliders only (no people). NPCs use it as a safety net after moving.
export function resolveStatic(x, z, r) {
  for (let i = 0; i < COLLIDERS.length; i++) {
    const c = COLLIDERS[i];
    if (!c.on || c.tag === 'door') continue;
    const cx = x < c.x0 ? c.x0 : x > c.x1 ? c.x1 : x, cz = z < c.z0 ? c.z0 : z > c.z1 ? c.z1 : z;
    const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; x += dx * k; z += dz * k; }
    else {
      const l = x - c.x0, rr = c.x1 - x, t = z - c.z0, b = c.z1 - z, m = Math.min(l, rr, t, b);
      if (m === l) x = c.x0 - r; else if (m === rr) x = c.x1 + r; else if (m === t) z = c.z0 - r; else z = c.z1 + r;
    }
  }
  return [x, z];
}
export function addTrigger(x0, z0, x1, z1, id) {
  const t = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), id };
  TRIGGERS.push(t);
  return t;
}
export function inTrigger(t, x, z) { return x >= t.x0 && x <= t.x1 && z >= t.z0 && z <= t.z1; }

// Push a circle (x, z, r) out of all active colliders. Returns [nx, nz, hit].
export function resolveCircle(x, z, r) {
  let hit = false;
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (let i = 0; i < COLLIDERS.length; i++) {
      const c = COLLIDERS[i];
      if (!c.on) continue;
      const cx = x < c.x0 ? c.x0 : x > c.x1 ? c.x1 : x;
      const cz = z < c.z0 ? c.z0 : z > c.z1 ? c.z1 : z;
      let dx = x - cx, dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        moved = true; hit = true;
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2), k = (r - d) / d;
          x += dx * k; z += dz * k;
        } else {
          // centre inside the box: push out along the shallowest axis
          const l = x - c.x0, rr = c.x1 - x, t = z - c.z0, b = c.z1 - z;
          const m = Math.min(l, rr, t, b);
          if (m === l) x = c.x0 - r; else if (m === rr) x = c.x1 + r; else if (m === t) z = c.z0 - r; else z = c.z1 + r;
        }
      }
    }
    for (let i = 0; i < DYN.length; i++) {
      const c = DYN[i];
      const dx = x - c.x, dz = z - c.z, rr = r + c.r, d2 = dx * dx + dz * dz;
      if (d2 < rr * rr && d2 > 1e-8) { const d = Math.sqrt(d2), k = (rr - d) / d; x += dx * k; z += dz * k; moved = true; hit = true; }
    }
    if (!moved) break;
  }
  return [x, z, hit];
}

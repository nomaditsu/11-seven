// Walkable grid for the NPCs, built from the same static colliders that stop the player.
// People used to walk in straight lines between waypoints, through gondolas and tables. Now each leg is
// an A* path on a 10 cm grid (colliders inflated by the body radius), smoothed with line-of-sight checks.
import { COLLIDERS } from './colliders.js';

const CELL = 0.1, X0 = -16, X1 = 16, Z0 = -17.6, Z1 = 6.2, RADIUS = 0.26;
const NX = Math.round((X1 - X0) / CELL), NZ = Math.round((Z1 - Z0) / CELL);
let blocked = null;

// Built on first use, after the store, street props and fixtures have registered their colliders.
function build() {
  blocked = new Uint8Array(NX * NZ);
  for (const c of COLLIDERS) {
    if (!c.on || c.tag === 'door') continue;          // the sliding door opens for everyone
    const i0 = Math.max(0, Math.floor((c.x0 - RADIUS - X0) / CELL)), i1 = Math.min(NX - 1, Math.floor((c.x1 + RADIUS - X0) / CELL));
    const j0 = Math.max(0, Math.floor((c.z0 - RADIUS - Z0) / CELL)), j1 = Math.min(NZ - 1, Math.floor((c.z1 + RADIUS - Z0) / CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) blocked[j * NX + i] = 1;
  }
}
const cellOf = (x, z) => [Math.min(NX - 1, Math.max(0, Math.floor((x - X0) / CELL))), Math.min(NZ - 1, Math.max(0, Math.floor((z - Z0) / CELL)))];
const centre = (i, j) => [X0 + (i + 0.5) * CELL, Z0 + (j + 0.5) * CELL];
const free = (i, j) => i >= 0 && j >= 0 && i < NX && j < NZ && !blocked[j * NX + i];

// Nearest walkable cell (breadth-first ring search), for waypoints that sit inside a padded fixture.
function snap(i, j) {
  if (free(i, j)) return [i, j];
  for (let r = 1; r < 30; r++) {
    for (let d = -r; d <= r; d++) {
      for (const [a, b] of [[i + d, j - r], [i + d, j + r], [i - r, j + d], [i + r, j + d]]) if (free(a, b)) return [a, b];
    }
  }
  return [i, j];
}

// Straight segment stays on walkable cells (sampled every half cell).
function clear(ax, az, bx, bz) {
  const len = Math.hypot(bx - ax, bz - az), n = Math.ceil(len / (CELL * 0.5));
  for (let s = 1; s < n; s++) {
    const [i, j] = cellOf(ax + ((bx - ax) * s) / n, az + ((bz - az) * s) / n);
    if (!free(i, j)) return false;
  }
  return true;
}

// Binary heap keyed by f.
class Heap {
  constructor() { this.a = []; }
  push(n, f) { const a = this.a; a.push([f, n]); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && a[l][0] < a[m][0]) m = l; if (r < a.length && a[r][0] < a[m][0]) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } }
    return top[1];
  }
  get size() { return this.a.length; }
}

const G = new Float32Array(NX * NZ), FROM = new Int32Array(NX * NZ), STAMP = new Uint32Array(NX * NZ);
let stamp = 0;

// Path from (ax, az) to (bx, bz) as [[x, z], ...] ending at the (snapped) goal. null if unreachable.
export function findPath(ax, az, bx, bz) {
  if (!blocked) build();
  const [si, sj] = snap(...cellOf(ax, az)), [gi, gj] = snap(...cellOf(bx, bz));
  const goal = free(...cellOf(bx, bz)) ? [bx, bz] : centre(gi, gj);
  if (clear(ax, az, goal[0], goal[1])) return [goal];
  stamp++;
  const start = sj * NX + si, target = gj * NX + gi;
  const h = (k) => { const dx = Math.abs((k % NX) - gi), dz = Math.abs(((k / NX) | 0) - gj); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
  const heap = new Heap();
  G[start] = 0; FROM[start] = -1; STAMP[start] = stamp; heap.push(start, h(start));
  const steps = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let found = false, guard = 0;
  while (heap.size && guard++ < 60000) {
    const k = heap.pop();
    if (k === target) { found = true; break; }
    const i = k % NX, j = (k / NX) | 0;
    for (const [di, dj, cost] of steps) {
      const a = i + di, b = j + dj;
      if (!free(a, b)) continue;
      if (di && dj && (!free(i + di, j) || !free(i, j + dj))) continue;   // no corner cutting
      const n = b * NX + a, g = G[k] + cost;
      if (STAMP[n] === stamp && g >= G[n]) continue;
      STAMP[n] = stamp; G[n] = g; FROM[n] = k; heap.push(n, g + h(n));
    }
  }
  if (!found) return null;
  const cells = [];
  for (let k = target; k !== -1; k = FROM[k]) cells.push(centre(k % NX, (k / NX) | 0));
  cells.reverse(); cells[cells.length - 1] = goal;
  // string-pull: keep only the corners needed for straight, clear segments
  const out = []; let from = [ax, az], idx = 0;
  while (idx < cells.length - 1) {
    let far = idx + 1;
    for (let t = cells.length - 1; t > idx + 1; t--) if (clear(from[0], from[1], cells[t][0], cells[t][1])) { far = t; break; }
    out.push(cells[far]); from = cells[far]; idx = far;
  }
  return out.length ? out : [goal];
}

// For debugging and tests.
export const navFree = (x, z) => { if (!blocked) build(); return free(...cellOf(x, z)); };

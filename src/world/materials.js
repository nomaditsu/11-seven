// Shared materials. `std()` wires image-based lighting: indoor materials use the store env map,
// outdoor ones use the (time-of-day dependent) sky env map.
import * as THREE from 'three';
import * as S from '../gfx/surfaces.js';
import { BRAND } from '../gfx/logo11seven.js';

export const ENV = { inTex: null, outTex: null };
export const M = {};
const outdoor = new Set();

export function std(params, { out = false, env = 1 } = {}) {
  const m = new THREE.MeshStandardMaterial(params);
  m.envMap = out ? ENV.outTex : ENV.inTex;
  m.envMapIntensity = env;
  if (out) outdoor.add(m);
  return m;
}
export function setOutdoorEnv(tex) {
  ENV.outTex = tex;
  for (const m of outdoor) { m.envMap = tex; }
}
export function basic(color, extra = {}) { return new THREE.MeshBasicMaterial({ color, ...extra }); }

export function initMaterials() {
  const floor = S.floorTiles();
  M.floor = std({ map: floor.map, roughnessMap: floor.rough, roughness: 1, metalness: 0.02 }, { env: 1.1 });
  M.ceiling = std({ map: S.ceilingTiles(), roughness: 0.95 }, { env: 0.9 });
  M.wall = std({ map: S.wallPaint('#efeee9', 3), roughness: 0.88 }, { env: 1 });
  M.wallWarm = std({ map: S.wallPaint('#f2e9d6', 4), roughness: 0.88 }, { env: 1 });
  M.wallGrey = std({ map: S.wallPaint('#c9cbcd', 5), roughness: 0.85 }, { env: 1 });
  M.wallDark = std({ map: S.wallPaint('#3b3e42', 6), roughness: 0.8 }, { env: 1 });
  M.white = std({ color: 0xf5f5f2, roughness: 0.55 }, { env: 1 });
  M.offwhite = std({ color: 0xe9e8e3, roughness: 0.6 }, { env: 1 });
  M.lightGrey = std({ color: 0xc4c7ca, roughness: 0.5, metalness: 0.15 }, { env: 1 });
  M.grey = std({ color: 0x8a8e93, roughness: 0.5, metalness: 0.2 }, { env: 1 });
  M.darkGrey = std({ color: 0x32353a, roughness: 0.5, metalness: 0.35 }, { env: 1 });
  M.black = std({ color: 0x141518, roughness: 0.5, metalness: 0.1 }, { env: 0.8 });
  M.rubber = std({ color: 0x1a1b1d, roughness: 0.85 }, { env: 0.5 });
  M.steel = std({ map: S.brushed(), color: 0xffffff, roughness: 0.38, metalness: 0.9 }, { env: 1.2 });
  M.chrome = std({ color: 0xdfe3e8, roughness: 0.12, metalness: 1 }, { env: 1.3 });
  M.pegboard = std({ map: S.pegboard('#e6e9ea'), roughness: 0.6, metalness: 0.1 }, { env: 1 });
  M.pegboardDark = std({ map: S.pegboard('#9ea3a8'), roughness: 0.6, metalness: 0.1 }, { env: 1 });
  M.orange = std({ color: BRAND.orange, roughness: 0.45 }, { env: 1 });
  M.green = std({ color: BRAND.green, roughness: 0.45 }, { env: 1 });
  M.red = std({ color: BRAND.red, roughness: 0.45 }, { env: 1 });
  M.darkGreen = std({ color: BRAND.darkGreen, roughness: 0.5 }, { env: 1 });
  M.counterTop = std({ map: S.granite('#2c2d31'), roughness: 0.18, metalness: 0.05 }, { env: 1.2 });
  M.laminate = std({ map: S.laminate('#f6f6f3'), roughness: 0.42 }, { env: 1 });
  M.coolFrame = std({ color: 0x24262a, roughness: 0.42, metalness: 0.65 }, { env: 1 });
  M.coolInterior = std({ color: 0xf4f7fa, roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 0.5 }, { env: 0.6 });
  M.coolInteriorFreezer = std({ color: 0xe8f3ff, roughness: 0.6, emissive: 0xcfe6ff, emissiveIntensity: 0.55 }, { env: 0.6 });
  M.coolShelf = std({ color: 0xdfe3e6, roughness: 0.35, metalness: 0.6 }, { env: 1 });
  M.ledWhite = basic(new THREE.Color(1.6, 1.6, 1.55), { toneMapped: true });
  M.ledWarm = basic(new THREE.Color(1.7, 1.45, 1.0));
  M.ledCool = basic(new THREE.Color(1.1, 1.4, 1.7));
  M.glass = new THREE.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
  M.glass.envMap = null; // set after env exists
  M.glassTint = new THREE.MeshStandardMaterial({ color: 0x9fb9c6, transparent: true, opacity: 0.32, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
  M.mat = std({ map: S.rubberMat(), roughness: 0.9 }, { env: 0.4 });
  // outdoor
  M.asphalt = std({ map: S.asphalt(), roughness: 0.95 }, { out: true, env: 0.7 });
  M.paver = std({ map: S.pavers(), roughness: 0.9 }, { out: true, env: 0.8 });
  M.concrete = std({ map: S.weatheredWall('#cfc6b4', 12), roughness: 0.95 }, { out: true, env: 0.9 });
  M.concreteGrey = std({ map: S.weatheredWall('#a9a8a3', 13), roughness: 0.95 }, { out: true, env: 0.9 });
  M.shutterGrey = std({ map: S.shutter('#a3a9ad'), roughness: 0.55, metalness: 0.5 }, { out: true, env: 1 });
  M.outWhite = std({ color: 0xece9e0, roughness: 0.7 }, { out: true, env: 1 });
  M.outDark = std({ color: 0x2b2d30, roughness: 0.6, metalness: 0.3 }, { out: true, env: 1 });
  M.outMetal = std({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.85 }, { out: true, env: 1.2 });
  M.outOrange = std({ color: BRAND.orange, roughness: 0.4 }, { out: true, env: 1 });
  M.outGreen = std({ color: BRAND.green, roughness: 0.4 }, { out: true, env: 1 });
  M.outRed = std({ color: BRAND.red, roughness: 0.4 }, { out: true, env: 1 });
  M.rubberOut = std({ color: 0x1b1c1e, roughness: 0.8 }, { out: true, env: 0.5 });
  M.glassOut = new THREE.MeshStandardMaterial({ color: 0xb6cfdc, transparent: true, opacity: 0.22, roughness: 0.03, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
  outdoor.add(M.glassOut);
}
export function bindGlassEnv() {
  M.glass.envMap = ENV.outTex; M.glass.envMapIntensity = 0.9;
  M.glassTint.envMap = ENV.outTex; M.glassTint.envMapIntensity = 0.9;
  M.glassOut.envMap = ENV.outTex; M.glassOut.envMapIntensity = 1.1;
  outdoor.add(M.glass); outdoor.add(M.glassTint);
}

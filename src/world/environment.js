// Sky dome, sun/moon, fog and time-of-day. One directional light plays sun by day and moon by night.
import * as THREE from 'three';
import { lerp, clamp, smooth, hex2rgb, rgb2hex } from '../core/util.js';
import { makeCanvas } from '../gfx/draw.js';
import { canvasTex } from '../gfx/surfaces.js';
import { makeSkyScene, renderSkyEnv } from '../gfx/envmaps.js';
import { setOutdoorEnv } from './materials.js';
import { rng } from '../core/util.js';

// [hour, top, horizon, ground]
const KEYS = [
  [0, '#04060f', '#10132a', '#08080c'],
  [4.8, '#070b1f', '#1c1c3a', '#0a0a10'],
  [5.8, '#25336a', '#e79a72', '#2b2622'],
  [6.6, '#4a78c0', '#f6c99a', '#5b5850'],
  [8.5, '#4f86d4', '#bcd6ee', '#6b6a63'],
  [12, '#3f7fdb', '#cfe2f0', '#75736b'],
  [16, '#4a82d0', '#d4dfe6', '#6f6d66'],
  [17.8, '#4e6fae', '#f4b57e', '#4c4741'],
  [18.5, '#2a3a78', '#f07f62', '#2b2622'],
  [19.2, '#111a44', '#6a4a72', '#12121a'],
  [20.2, '#070c26', '#1e2044', '#0a0a10'],
  [24, '#04060f', '#10132a', '#08080c'],
];
function sampleKeys(h) {
  let a = KEYS[0], b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) if (h >= KEYS[i][0] && h <= KEYS[i + 1][0]) { a = KEYS[i]; b = KEYS[i + 1]; break; }
  const t = (h - a[0]) / (b[0] - a[0] || 1);
  const mixc = (ca, cb) => { const A = hex2rgb(ca), B = hex2rgb(cb); return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); };
  return { top: mixc(a[1], b[1]), horizon: mixc(a[2], b[2]), ground: mixc(a[3], b[3]) };
}

export function skylineTexture(night) {
  const W = 4096, H = 512, { canvas, ctx } = makeCanvas(W, H), r = rng(night ? 91 : 90);
  ctx.clearRect(0, 0, W, H);
  const layers = [
    { base: 0, minH: 60, maxH: 200, col: night ? '#111a33' : '#9db4ca', win: night ? 0.10 : 0, wc: '#ffd88a', wmin: 26, wmax: 48 },
    { base: 0, minH: 50, maxH: 250, col: night ? '#0b1226' : '#84a0bb', win: night ? 0.22 : 0, wc: '#ffe2a6', wmin: 30, wmax: 60 },
    { base: 0, minH: 40, maxH: 170, col: night ? '#070c1b' : '#6a8aa8', win: night ? 0.3 : 0, wc: '#ffeab8', wmin: 30, wmax: 70 },
  ];
  layers.forEach((L, li) => {
    let x = -20 + li * 40;
    while (x < W) {
      const w = 40 + r() * 110, h = L.minH + r() * (L.maxH - L.minH) * (r() > 0.8 ? 1.5 : 1);
      const y = H - h;
      ctx.fillStyle = L.col; ctx.fillRect(x, y, w, h);
      if (r() > 0.6) ctx.fillRect(x + w * 0.2, y - 14 - r() * 20, w * 0.6, 20 + r() * 20); // roof box
      if (L.win) {
        for (let wy = y + 8; wy < H - 6; wy += 10) for (let wx = x + 5; wx < x + w - 8; wx += 9) {
          if (r() < L.win) { ctx.fillStyle = L.wc; ctx.globalAlpha = 0.5 + r() * 0.5; ctx.fillRect(wx, wy, 4, 5); ctx.globalAlpha = 1; }
        }
      }
      x += w + r() * 20;
    }
  });
  // Bangkok landmarks: Baiyoke Tower II (tall tapered spire) and a pixel-notched MahaNakhon-style tower
  const tower = (cx, w, h, col, win) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(cx - w / 2, H); ctx.lineTo(cx - w / 2, H - h * 0.8); ctx.lineTo(cx - w * 0.18, H - h * 0.93); ctx.lineTo(cx - 3, H - h);
    ctx.lineTo(cx, H - h - 46); ctx.lineTo(cx + 3, H - h); ctx.lineTo(cx + w * 0.18, H - h * 0.93); ctx.lineTo(cx + w / 2, H - h * 0.8); ctx.lineTo(cx + w / 2, H); ctx.closePath(); ctx.fill();
    if (win) { ctx.fillStyle = '#ffdca0'; for (let y = H - h * 0.78; y < H - 6; y += 9) for (let x = cx - w / 2 + 4; x < cx + w / 2 - 6; x += 8) if (r() < 0.45) ctx.fillRect(x, y, 3, 4); }
  };
  tower(1300, 78, 430, night ? '#0a1024' : '#7b97b3', night);
  const pixelTower = (cx, w, h, col, win) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(cx - w / 2, H); ctx.lineTo(cx - w / 2, H - h);
    for (let i = 0; i < 9; i++) { const yy = H - h + i * (h / 9); ctx.lineTo(cx - w / 2 + (i % 3) * 5, yy); ctx.lineTo(cx - w / 2 + (i % 3) * 5, yy + h / 9); }
    ctx.lineTo(cx + w / 2, H - h); ctx.lineTo(cx + w / 2, H); ctx.closePath(); ctx.fill();
    if (win) { ctx.fillStyle = '#ffe6b0'; for (let y = H - h + 8; y < H - 6; y += 9) for (let x = cx - w / 2 + 6; x < cx + w / 2 - 4; x += 8) if (r() < 0.5) ctx.fillRect(x, y, 3, 4); }
  };
  pixelTower(2650, 64, 400, night ? '#0a1024' : '#7691ad', night);
  return canvasTex(canvas, { wrap: false, aniso: 4 });
}

export class Environment {
  constructor(scene, renderer, quality) {
    this.scene = scene; this.renderer = renderer; this.quality = quality;
    this.hour = 18.5;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.skyScene = makeSkyScene();
    this.envRT = null; this.lastEnvHour = -99;
    this.listeners = [];

    // Sky dome
    const uni = {
      top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, ground: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunColor: { value: new THREE.Color() }, stars: { value: 0 }, time: { value: 0 },
      moonDir: { value: new THREE.Vector3(0, 1, 0) }, moonAmt: { value: 0 },
    };
    this.skyU = uni;
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
      uniforms: uni, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }',
      fragmentShader: `varying vec3 vD; uniform vec3 top, horizon, ground, sunDir, sunColor, moonDir; uniform float stars, time, moonAmt;
        float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
        float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p*=2.03; a*=.5; } return s; }
        void main(){
          vec3 d = normalize(vD); float h = d.y;
          vec3 c = h >= 0. ? mix(horizon, top, pow(clamp(h,0.,1.), .5)) : mix(horizon, ground, clamp(-h*4.,0.,1.));
          float s = max(dot(d, normalize(sunDir)), 0.);
          c += sunColor * (pow(s, 900.) * 6. + pow(s, 14.) * .35 + pow(s, 3.) * .08);
          // clouds
          if (h > 0.0) {
            vec2 cp = d.xz / (h + .18) * 1.6 + vec2(time*.004, 0.);
            float cl = smoothstep(.5, .78, fbm(cp*1.4));
            vec3 cc = mix(vec3(1.), horizon*1.1 + .25, .35) * (.55 + .55*clamp(sunDir.y+.3,0.,1.));
            cc = mix(cc, horizon*1.6, clamp(1.-sunDir.y,0.,1.)*.4);
            c = mix(c, cc, cl * .75 * smoothstep(0., .18, h) * (1. - stars*.85));
          }
          // stars
          if (stars > .01 && h > .02) {
            vec2 sp = d.xz / (h + .2) * 90.;
            vec2 cell = floor(sp);
            float st = h21(cell);
            vec2 off = (vec2(h21(cell + 7.1), h21(cell + 3.7)) - .5) * .6;
            float w = (fwidth(sp.x) + fwidth(sp.y)) * .9;
            float dist = length(fract(sp) - .5 - off);
            float tw = .65 + .35*sin(time*2. + st*40.);
            c += vec3(.9,.93,1.) * step(.975, st) * smoothstep(w*1.5, 0., dist) * stars * tw * (.7 + st) * smoothstep(.02,.25,h);
          }
          // moon
          float m = dot(d, normalize(moonDir));
          c += vec3(.95,.96,1.) * smoothstep(.9992, .9996, m) * moonAmt;
          c += vec3(.35,.4,.6) * pow(max(m,0.), 60.) * .25 * moonAmt;
          gl_FragColor = vec4(c, 1.);
        }`,
    }));
    this.dome.frustumCulled = false; this.dome.renderOrder = -10;
    scene.add(this.dome);

    // skyline ring (day + night textures cross-faded)
    const ringGeo = new THREE.CylinderGeometry(520, 520, 200, 64, 1, true);
    this.skyDay = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ map: skylineTexture(false), transparent: true, side: THREE.BackSide, depthWrite: false, fog: true }));
    this.skyNight = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ map: skylineTexture(true), transparent: true, side: THREE.BackSide, depthWrite: false, fog: true, opacity: 0 }));
    for (const m of [this.skyDay, this.skyNight]) { m.position.y = 92; m.renderOrder = -9; m.frustumCulled = false; scene.add(m); }

    // Sun / moon light with shadows
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = quality.shadows;
    this.sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
    const sc = this.sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 140;
    this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.03; this.sun.shadow.radius = 2.5;
    this.sun.target.position.set(0, 0, -2);
    scene.add(this.sun, this.sun.target);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0xb8b2a6, 0.12);
    scene.add(this.hemi);
    scene.fog = new THREE.Fog(0xaec4d6, 28, 260);

    this.daylight = 1; this.nightness = 0;
    this.sunDir = new THREE.Vector3(0, 1, 0.4).normalize();
  }

  onChange(fn) { this.listeners.push(fn); }

  // Hour 0..24
  setHour(h, force = false) {
    h = ((h % 24) + 24) % 24;
    this.hour = h;
    const sk = sampleKeys(h);
    // sun path: rises 6:10, sets 18:10; tilted to street side (+z)
    const a = ((h - 6.17) / 12) * Math.PI;
    const elev = Math.sin(a);
    const sunUp = a > 0 && a < Math.PI;
    const sd = new THREE.Vector3(Math.cos(a) * 0.95, Math.max(elev, -0.3), 0.42).normalize();
    this.sunDir.copy(sd);
    const dayAmt = smooth(-0.04, 0.22, elev);       // 0 night .. 1 full day
    const twilight = smooth(-0.22, 0.02, elev) * (1 - dayAmt);
    this.daylight = dayAmt; this.nightness = 1 - clamp(dayAmt + twilight * 0.7, 0, 1);

    // light: sun by day (warm when low), moon by night
    const low = 1 - smooth(0.05, 0.6, elev);
    const sunCol = new THREE.Color().setRGB(1, lerp(0.96, 0.62, low), lerp(0.9, 0.4, low));
    const moonDirV = new THREE.Vector3(-0.35, 0.75, 0.55).normalize();
    if (dayAmt > 0.02) {
      this.sun.color.copy(sunCol);
      this.sun.intensity = 3.4 * dayAmt;
      this.sun.position.copy(this.sun.target.position).addScaledVector(sd, 70);
      this.sun.castShadow = this.quality.shadows;
    } else {
      this.sun.color.setRGB(0.45, 0.55, 0.95);
      this.sun.intensity = 0.28 * (1 - twilight) + 0.04;
      this.sun.position.copy(this.sun.target.position).addScaledVector(moonDirV, 70);
      this.sun.castShadow = false;
    }
    this.hemi.intensity = 0.1 + 0.05 * dayAmt;

    const u = this.skyU;
    u.top.value.set(sk.top); u.horizon.value.set(sk.horizon); u.ground.value.set(sk.ground);
    u.sunDir.value.copy(sd); u.sunColor.value.copy(sunCol).multiplyScalar(dayAmt > 0 ? 1 : 0.0);
    u.stars.value = clamp(this.nightness * 1.2 - 0.1, 0, 1);
    u.moonDir.value.copy(moonDirV); u.moonAmt.value = this.nightness > 0.4 ? this.nightness : 0;
    // fog follows the horizon colour but is dimmed at night
    this.scene.fog.color.set(sk.horizon).lerp(new THREE.Color(sk.top), 0.25);
    this.dome.position.set(0, 0, 0);
    this.skyDay.material.opacity = clamp(dayAmt + twilight * 0.6, 0, 1);
    this.skyNight.material.opacity = clamp(this.nightness + twilight * 0.4, 0, 1);
    this.skyDay.material.color.setScalar(0.55 + 0.45 * dayAmt).lerp(new THREE.Color(sk.horizon), 0.25 * (1 - dayAmt));

    // regenerate the outdoor IBL when the sky has changed enough
    if (force || Math.abs(h - this.lastEnvHour) > 0.18) {
      this.lastEnvHour = h;
      const rt = renderSkyEnv(this.pmrem, this.skyScene, {
        top: sk.top, horizon: sk.horizon, ground: sk.ground, sunDir: sd, sunColor: '#' + sunCol.getHexString(), sunPow: dayAmt > 0.02 ? 1 : 0,
      });
      // The night sky env is nearly black; add a little urban glow so streets are not pitch-dark.
      setOutdoorEnv(rt.texture);
      if (this.envRT) this.envRT.dispose();
      this.envRT = rt;
    }
    for (const fn of this.listeners) fn(this);
  }

  update(dt, time, camPos) {
    this.skyU.time.value = time;
    this.dome.position.copy(camPos);
    this.skyDay.position.x = camPos.x; this.skyDay.position.z = camPos.z;
    this.skyNight.position.x = camPos.x; this.skyNight.position.z = camPos.z;
    // keep the shadow frustum centred on the player's neighbourhood
    const t = this.sun.target.position;
    t.x = clamp(camPos.x, -10, 10); t.z = clamp(camPos.z, -12, 8);
    const dir = this.daylight > 0.02 ? this.sunDir : new THREE.Vector3(-0.35, 0.75, 0.55).normalize();
    this.sun.position.copy(t).addScaledVector(dir, 70);
  }

  get isNight() { return this.daylight < 0.15; }
}

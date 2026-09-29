// Image-based lighting: a mock "brightly lit convenience store" for interiors and a
// procedural sky for the street. Both are prefiltered with PMREM.
import * as THREE from 'three';

// --------------------------------------------------------------------------- interior
export function buildInteriorEnv(pmrem) {
  const scene = new THREE.Scene();
  const W = 12.8, H = 3.1, D = 17;
  const mk = (c, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.BackSide });
  const mats = [
    mk(0xe6e3dc, 0.95), mk(0xe6e3dc, 0.95),   // +x / -x walls
    mk(0xf3f3f0, 0.95), mk(0xb9b5ad, 0.9),    // ceiling (+y) / floor (-y)
    mk(0xdfeaf5, 1.6),  mk(0xf2f4f6, 1.25),   // +z front glass (bright daylight) / -z cooler wall (lit)
  ];
  const room = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), mats);
  room.position.set(0, H / 2 - 1.55, -D / 2 + 3.5);
  scene.add(room);
  // LED panels in the ceiling: HDR emissive so highlights on glossy tiles / plastic look right
  const panel = new THREE.MeshBasicMaterial({ color: new THREE.Color(6.5, 6.5, 6.2) });
  const cy = H - 1.55 - 0.01;
  for (let ix = 0; ix < 6; ix++) for (let iz = 0; iz < 8; iz++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.2), panel);
    m.rotation.x = Math.PI / 2;
    m.position.set(-5.4 + ix * 2.16, cy, 3.5 - 1.2 - iz * 2.1);
    scene.add(m);
  }
  // shelving mass: mid-tone blocks so the diffuse light has some colour variety
  const shelf = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd9d3c6).multiplyScalar(0.55) });
  for (const x of [-3.5, -1.0, 1.5]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 7), shelf);
    b.position.set(x, -0.8, -6);
    scene.add(b);
  }
  const rt = pmrem.fromScene(scene, 0.04, 0.1, 60, { size: 256 });
  scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  return rt;
}

// --------------------------------------------------------------------------- sky
export function makeSkyScene() {
  const scene = new THREE.Scene();
  const uniforms = {
    top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, ground: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunColor: { value: new THREE.Color(1, 1, 1) }, sunPow: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vD; uniform vec3 top, horizon, ground, sunDir, sunColor; uniform float sunPow;
      void main(){ vec3 d = normalize(vD); float h = d.y;
        vec3 c = h >= 0. ? mix(horizon, top, pow(clamp(h,0.,1.), .55)) : mix(horizon, ground, clamp(-h*3.,0.,1.));
        float s = max(dot(d, normalize(sunDir)), 0.);
        c += sunColor * (pow(s, 600.) * 40. + pow(s, 12.) * .35) * sunPow;
        gl_FragColor = vec4(c, 1.); }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), mat);
  scene.add(dome);
  // a warm bounce "street level" ring so glossy exterior surfaces catch some ground light
  return { scene, uniforms, dome };
}
export function renderSkyEnv(pmrem, sky, p) {
  sky.uniforms.top.value.set(p.top);
  sky.uniforms.horizon.value.set(p.horizon);
  sky.uniforms.ground.value.set(p.ground);
  sky.uniforms.sunDir.value.copy(p.sunDir);
  sky.uniforms.sunColor.value.set(p.sunColor);
  sky.uniforms.sunPow.value = p.sunPow;
  return pmrem.fromScene(sky.scene, 0.03, 0.1, 100, { size: 128 });
}

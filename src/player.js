// First-person controller: walking, sprinting, crouching, head-bob, zoom, collision.
import * as THREE from 'three';
import { clamp, damp, lerp } from './core/util.js';
import { resolveCircle } from './world/colliders.js';
import { settings } from './core/settings.js';
import { input, consumeMouse, down } from './input.js';
import { L } from './world/layout.js';

export class Player {
  constructor(camera) {
    this.camera = camera;
    this.pos = new THREE.Vector3(0.6, 0, 4.4);
    this.yaw = 0.0;            // 0 => looking towards -z (into the store)
    this.pitch = -0.04;
    this.vel = new THREE.Vector2();
    this.radius = 0.26;
    this.eyeStand = 1.6;
    this.eyeCrouch = 1.0;
    this.crouchT = 0;
    this.bobPhase = 0; this.bobAmt = 0;
    this.zoomT = 0;
    this.moving = 0;          // 0..1 speed fraction (for audio)
    this.sprinting = false;
    this.stepDist = 0;
    this.onStep = null;
    this.frozen = false;      // dialogs / inspect
    this.lookScale = 1;
    this.bounds = L.play;
    this.tmpV = new THREE.Vector3();
    this.baseFov = 72;
    this.fovKick = 0;
  }

  teleport(x, z, yaw = this.yaw, pitch = this.pitch) {
    this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = pitch; this.vel.set(0, 0);
  }

  get forward() { return this.tmpV.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }

  update(dt, active) {
    // ---- look
    const [mx, my] = consumeMouse();
    this.mdx = mx; this.mdy = my;
    if (active && !this.frozen) {
      const k = 0.0022 * settings.sens * this.lookScale * (1 - this.zoomT * 0.8);   // zoomed: 20% speed for fine control
      this.yaw -= mx * k;
      this.pitch -= my * k * (settings.invertY ? -1 : 1);
      this.pitch = clamp(this.pitch, -1.5, 1.5);
    }
    // ---- move
    let ix = 0, iz = 0;
    if (active && !this.frozen) {
      // W A S D or the arrow keys move; the mouse (or a finger) looks
      if (down('ArrowUp', 'KeyW')) iz -= 1;
      if (down('ArrowDown', 'KeyS')) iz += 1;
      if (down('ArrowLeft', 'KeyA')) ix -= 1;
      if (down('ArrowRight', 'KeyD')) ix += 1;
    }
    const wantCrouch = active && !this.frozen && down('KeyC', 'ControlLeft', 'ControlRight');
    this.crouchT = damp(this.crouchT, wantCrouch ? 1 : 0, 9, dt);
    const sprint = active && !this.frozen && down('ShiftLeft', 'ShiftRight') && iz < 0 && !wantCrouch;
    this.sprinting = sprint && (ix || iz);
    const speed = sprint ? 4.4 : wantCrouch ? 1.35 : 2.35;
    const len = Math.hypot(ix, iz) || 1;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // forward = (-sin, -cos), right = (cos, -sin)
    const tx = ((ix / len) * cos + (iz / len) * sin) * speed;
    const tz = ((-ix / len) * sin + (iz / len) * cos) * speed;
    const accel = ix || iz ? 12 : 10;
    this.vel.x = damp(this.vel.x, tx, accel, dt);
    this.vel.y = damp(this.vel.y, tz, accel, dt);
    let nx = this.pos.x + this.vel.x * dt, nz = this.pos.z + this.vel.y * dt;
    const b = this.bounds;
    nx = clamp(nx, this.pos.z > 0.6 ? b.x0 : -20, this.pos.z > 0.6 ? b.x1 : 20);
    if (nz > b.z1) nz = b.z1;
    const r = resolveCircle(nx, nz, this.radius);
    this.pos.x = r[0]; this.pos.z = r[1];
    const sp = Math.hypot(this.vel.x, this.vel.y);
    this.moving = clamp(sp / 4.4, 0, 1);
    // footsteps + bob
    this.stepDist += sp * dt;
    const stride = sprint ? 1.7 : 1.35;
    if (this.stepDist > stride) { this.stepDist = 0; if (this.onStep) this.onStep(this.sprinting ? 1 : this.crouchT > 0.5 ? 0.35 : 0.65); }
    this.bobPhase += sp * dt * (sprint ? 4.2 : 4.6);
    this.bobAmt = damp(this.bobAmt, settings.bob ? clamp(sp / 2.4, 0, 1.4) : 0, 8, dt);
    // ---- zoom / fov
    // zoom: Z, or hold right-click (drag look) / the middle button (mouse look, where right-click inspects)
    const wantZoom = active && (down('KeyZ') || (input.locked ? input.mouseDown[1] : input.mouseDown[2])) && !this.frozen;
    this.zoomT = damp(this.zoomT, wantZoom ? 1 : 0, 10, dt);
    this.fovKick = damp(this.fovKick, this.sprinting ? 5 : 0, 6, dt);
    const fov = lerp(settings.fov + this.fovKick, 26, this.zoomT);
    if (Math.abs(this.camera.fov - fov) > 0.01) { this.camera.fov = fov; this.camera.updateProjectionMatrix(); }
    // ---- camera transform
    const eye = lerp(this.eyeStand, this.eyeCrouch, this.crouchT);
    const bobY = Math.sin(this.bobPhase * 2) * 0.022 * this.bobAmt;
    const bobX = Math.cos(this.bobPhase) * 0.012 * this.bobAmt;
    this.camera.position.set(this.pos.x + Math.cos(this.yaw) * bobX, eye + bobY, this.pos.z - Math.sin(this.yaw) * bobX);
    this.camera.rotation.set(this.pitch, this.yaw, Math.sin(this.bobPhase) * 0.0035 * this.bobAmt, 'YXZ');
  }
}

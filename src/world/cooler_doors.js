// Drinks-cooler doors swing open while the player looks into a bay; a little cold mist rolls out.
import * as THREE from 'three';
import { clamp } from '../core/util.js';

function mistTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(235,245,255,.9)'); g.addColorStop(0.5, 'rgba(225,238,250,.35)'); g.addColorStop(1, 'rgba(220,235,250,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class CoolerDoors {
  constructor(scene, doors, hooks = {}) {
    this.doors = doors || [];
    this.hooks = hooks;
    this.mist = [];
    const tex = mistTexture();
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
      m.visible = false; m.userData.seed = Math.random() * 10; scene.add(m); this.mist.push(m);
    }
    this.lit = null;
  }

  // called every frame by whoever knows where the player is looking
  look(index, held = 0.9) {
    const d = this.doors[index];
    if (!d) return;
    if (d.alcohol && this.hooks.blocked && this.hooks.blocked(d)) return;
    if (d.target !== 1) { d.target = 1; if (this.hooks.onOpen) this.hooks.onOpen(d); }
    d.hold = held;
  }

  update(dt, time) {
    let most = null;
    for (const d of this.doors) {
      if (d.hold > 0) { d.hold -= dt; if (d.hold <= 0 && d.target) { d.target = 0; if (this.hooks.onClose) this.hooks.onClose(d); } }
      const speed = d.target ? 3.0 : 1.7;
      const diff = d.target - d.open;
      if (diff !== 0) d.open += clamp(diff, -speed * dt, speed * dt);
      const e = d.open * d.open * (3 - 2 * d.open);
      d.pivot.rotation.y = -d.dir * e * 1.72;
      if (d.open > 0.02 && (!most || d.open > most.open)) most = d;
    }
    // mist rolling out of the most open door
    for (let i = 0; i < this.mist.length; i++) {
      const m = this.mist[i];
      if (!most) { m.visible = false; continue; }
      const u = ((time * 0.35 + i / this.mist.length) % 1);
      m.visible = true;
      m.position.set(most.x + Math.sin(u * 5 + m.userData.seed) * 0.28, 0.95 - u * 0.75, most.z + 0.15 + u * 0.75);
      const s = 0.5 + u * 0.7; m.scale.set(s, s * 0.8, 1);
      m.material.opacity = 0.22 * most.open * Math.sin(u * Math.PI) * (most.freezer ? 1.6 : 1);
    }
  }
}

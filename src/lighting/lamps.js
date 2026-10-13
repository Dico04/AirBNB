// Lamps: every light source from LAMPS (config) is a "virtual" lamp with an on/off state and a fade.
// A fixed pool of real PointLights / SpotLights (size per quality preset) is assigned each frame to
// the most relevant lit lamps near the viewer, so the shader light count never changes (no
// recompiles, stable frame time) while the whole flat can still glow at night.
import * as THREE from 'three';
import { LAMPS, LIGHTING, ROOMS, DIMS } from '../apartment.config.js';
import { mesh } from '../util/geometry.js';

export function kelvinToColor(k, target = new THREE.Color()) {
  const t = k / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; }
  else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); }
  if (t >= 66) b = 255; else if (t <= 19) b = 0; else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = (v) => Math.min(255, Math.max(0, v)) / 255;
  return target.setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace);
}

const OPEN_PLAN = new Set(['living', 'kitchen', 'corridor']);

export function roomAtPlan(x, y) {
  if (y > 9.3) return 'terrace';
  for (const r of ROOMS) {
    const [x0, y0, x1, y1] = r.rect;
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return r.id;
  }
  return null;
}

export class Lamps {
  constructor(scene, quality) {
    this.scene = scene;
    this.mode = 'auto';            // 'auto' | 'on' | 'off'
    this.autoOn = false;
    this.lamps = LAMPS.map((spec) => ({
      spec,
      pos: new THREE.Vector3(spec.pos[0], spec.pos[2], spec.pos[1]),
      color: kelvinToColor(spec.kelvin),
      level: 0,
      on: false,
      emissives: [],   // { material, max }
      weight: 0,
    }));
    this.byId = new Map(this.lamps.map((l) => [l.spec.id, l]));
    this.points = Array.from({ length: quality.pointSlots }, () => {
      const l = new THREE.PointLight(0xffffff, 0, 7.5, 2);
      l.castShadow = false;
      scene.add(l);
      return { light: l, lamp: null };
    });
    this.spots = Array.from({ length: quality.spotSlots }, () => {
      const l = new THREE.SpotLight(0xffffff, 0, 6, THREE.MathUtils.degToRad(38), 0.75, 2);
      l.castShadow = false;
      scene.add(l, l.target);
      return { light: l, lamp: null };
    });
    this._timer = 0;
    this.group = this.buildFixtures();
    scene.add(this.group);
  }

  // Furniture lamps call this to make their shade / bulb glow with the lamp.
  addEmissive(lampId, material, max = 2.5) {
    const lamp = this.byId.get(lampId);
    if (!lamp) return;
    material.emissive = lamp.color.clone();
    material.emissiveIntensity = 0;
    lamp.emissives.push({ material, max });
  }

  // Architectural fixtures that belong to the shell (ceiling lights, downlights, twin spot).
  buildFixtures() {
    const g = new THREE.Group();
    g.name = 'light-fixtures';
    const white = new THREE.MeshStandardMaterial({ color: '#f4f3f0', roughness: 0.4 });
    const chrome = new THREE.MeshStandardMaterial({ color: '#d6d8da', roughness: 0.15, metalness: 1 });
    for (const lamp of this.lamps) {
      const { fixture } = lamp.spec;
      if (!fixture) continue;
      const glow = new THREE.MeshStandardMaterial({ color: '#fffaf2', roughness: 0.5, emissive: lamp.color.clone(), emissiveIntensity: 0 });
      lamp.emissives.push({ material: glow, max: fixture === 'downlight' ? 6 : 2.2 });
      const p = lamp.pos;
      if (fixture === 'downlight') {
        // Recessed in the 2.35 m soffit: thin trim ring + glowing lens slightly recessed.
        const ring = mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.006, 28), white, { cast: false });
        ring.position.set(p.x, DIMS.soffit - 0.003, p.z);
        const lens = mesh(new THREE.CircleGeometry(0.032, 24), glow, { cast: false, receive: false });
        lens.rotation.x = Math.PI / 2;
        lens.position.set(p.x, DIMS.soffit - 0.0005, p.z);
        g.add(ring, lens);
      } else if (fixture === 'flush') {
        // Small round opal ceiling light.
        const base = mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.025, 36), white, { cast: false });
        base.position.set(p.x, DIMS.ceiling - 0.0125, p.z);
        const dome = mesh(new THREE.SphereGeometry(0.105, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glow, { cast: false });
        dome.scale.y = 0.42;
        dome.position.set(p.x, DIMS.ceiling - 0.024, p.z);
        g.add(base, dome);
      } else if (fixture === 'twinspot') {
        // Wall plate + short bar with two small cylinder spots angled down toward the desk.
        const fx = new THREE.Group();
        fx.add(mesh(new THREE.BoxGeometry(0.012, 0.06, 0.18), chrome, { cast: false }));
        for (const dz of [-0.06, 0.06]) {
          const arm = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 10), chrome, { cast: false });
          arm.rotation.z = Math.PI / 2;
          arm.position.set(-0.035, 0, dz);
          const can = mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.075, 20), chrome, { cast: false });
          can.position.set(-0.07, -0.02, dz);
          can.rotation.z = -0.6;
          const lens = mesh(new THREE.CircleGeometry(0.02, 16), glow, { cast: false });
          lens.position.set(-0.092, -0.052, dz);
          lens.rotation.set(Math.PI / 2, 0, -0.6);
          fx.add(arm, can, lens);
        }
        fx.position.set(4.70 - 0.006, p.y, p.z);
        g.add(fx);
      }
    }
    return g;
  }

  setNight(nightFactor) {
    if (nightFactor > 0.55) this.autoOn = true;
    else if (nightFactor < 0.45) this.autoOn = false;
  }

  setMode(mode) { this.mode = mode; }

  toggleAll() {
    const anyOn = this.lamps.some((l) => l.on);
    this.mode = anyOn ? 'off' : 'on';
    return this.mode;
  }

  toggle(id) {
    const l = this.byId.get(id);
    if (!l) return;
    l.manual = !l.on;
  }

  get interiorLevel() {
    let s = 0, n = 0;
    for (const l of this.lamps) if (l.spec.room !== 'terrace') { s += l.level * l.spec.intensity; n += l.spec.intensity; }
    return n ? s / n : 0;
  }

  update(dt, cameraPos) {
    const fade = dt / LIGHTING.lampFadeSeconds;
    for (const l of this.lamps) {
      let on = this.mode === 'on' ? true : this.mode === 'off' ? false : (this.autoOn && l.spec.auto);
      if (l.manual !== undefined && this.mode === 'auto') on = l.manual;
      l.on = on;
      l.level += Math.max(-fade, Math.min(fade, (on ? 1 : 0) - l.level));
      for (const e of l.emissives) e.material.emissiveIntensity = e.max * l.level * l.level;
    }
    // Re-rank lamps a few times a second.
    this._timer -= dt;
    if (this._timer <= 0) {
      this._timer = 0.2;
      const camRoom = roomAtPlan(cameraPos.x, cameraPos.z);
      for (const l of this.lamps) {
        if (l.level <= 0.001) { l.score = 0; continue; }
        const d2 = l.pos.distanceToSquared(cameraPos);
        const same = l.spec.room === camRoom || (OPEN_PLAN.has(l.spec.room) && OPEN_PLAN.has(camRoom));
        l.score = l.spec.intensity * (same ? 3 : 1) / (1 + d2 / 6);
      }
      this.assign(this.points, this.lamps.filter((l) => l.spec.type === 'point'));
      this.assign(this.spots, this.lamps.filter((l) => l.spec.type === 'spot'));
    }
    for (const slot of [...this.points, ...this.spots]) {
      const l = slot.lamp;
      if (!l) { slot.light.intensity = 0; continue; }
      slot.light.intensity = l.spec.intensity * l.level;
    }
  }

  assign(slots, candidates) {
    const ranked = candidates.filter((l) => l.score > 0).sort((a, b) => b.score - a.score).slice(0, slots.length);
    const keep = new Set(ranked);
    // Keep lamps already in a slot where possible to avoid flicker.
    for (const s of slots) if (s.lamp && !keep.has(s.lamp)) s.lamp = null;
    const placed = new Set(slots.map((s) => s.lamp).filter(Boolean));
    for (const l of ranked) {
      if (placed.has(l)) continue;
      const free = slots.find((s) => !s.lamp);
      if (!free) break;
      free.lamp = l;
      placed.add(l);
    }
    for (const s of slots) {
      if (!s.lamp) continue;
      s.light.position.copy(s.lamp.pos);
      s.light.color.copy(s.lamp.color);
      if (s.light.isSpotLight) {
        const a = s.lamp.spec.aim;
        if (a) s.light.target.position.set(a[0], a[2], a[1]);
        else s.light.target.position.set(s.lamp.pos.x, 0, s.lamp.pos.z);
        s.light.target.updateMatrixWorld();
      }
    }
  }
}

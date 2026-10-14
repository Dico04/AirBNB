// Skylight entering through glazing, approximated with rectangular area lights placed in the window /
// door openings, facing into the room. Gives the soft window-side gradient that makes interiors read
// like daylight photos (bright near the glass, calmer in the corners).
// Area lights are costly per pixel and are not stopped by walls, so a small fixed pool (2/3/5 by
// quality) is reassigned to the openings that matter for the current room: no shader recompiles,
// and no light from the bedroom window leaking into the living room.
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { WALLS } from '../apartment.config.js';
import { wallAxis } from '../world/shell.js';
import { roomAtPlan } from './lamps.js';

const OPENINGS = [
  { id: 'D-slide',  weight: 1.0 },
  { id: 'W-living', weight: 0.9 },
  { id: 'W-desk',   weight: 0.8 },
  { id: 'W-bed',    weight: 0.85 },
  { id: 'W-bath',   weight: 0.75 },
];
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };   // plan (dx, dy)

export class WindowLights {
  constructor(scene, count = 5) {
    RectAreaLightUniformsLib.init();
    this.specs = [];
    for (const spec of OPENINGS) {
      let wall, o;
      for (const w of WALLS) for (const op of w.openings || []) if (op.id === spec.id) { wall = w; o = op; }
      if (!wall) continue;
      const [x0, y0, x1, y1] = wall.rect;
      const axis = wallAxis(wall);
      const [ix, iy] = INWARD[wall.outside];
      const along = (o.from + o.to) / 2;
      const inner = ix > 0 ? x1 : ix < 0 ? x0 : iy > 0 ? y1 : y0;
      const cx = axis === 'x' ? along : inner + ix * 0.02;
      const cy = axis === 'x' ? inner + iy * 0.02 : along;
      const ch = (o.bottom + o.top) / 2;
      this.specs.push({
        id: spec.id, weight: spec.weight,
        pos: new THREE.Vector3(cx, ch, cy),
        look: new THREE.Vector3(cx + ix, ch - 0.18, cy + iy),          // aim slightly downward, like sky light
        w: (o.to - o.from) * 0.96, h: (o.top - o.bottom) * 0.96,
        out: new THREE.Vector2(-ix, -iy),                                 // outward (x, z) for the sun-facing boost
        room: roomAtPlan(cx + ix * 0.6, cy + iy * 0.6),
      });
    }
    this.lights = Array.from({ length: Math.min(count, this.specs.length) }, () => {
      const l = new THREE.RectAreaLight(0xffffff, 0, 1, 1);
      scene.add(l);
      return { light: l, spec: null };
    });
    this._timer = 0;
    this._color = new THREE.Color(1, 1, 1);
    this._intensity = 0;
    this.assign(new THREE.Vector3(3.6, 1.6, 6.5));
  }

  // Pick the openings for the camera's room first, then the nearest others.
  assign(cameraPos) {
    const room = roomAtPlan(cameraPos.x, cameraPos.z);
    const ranked = [...this.specs].sort((a, b) => {
      const sa = (a.room === room ? -100 : 0) + a.pos.distanceTo(cameraPos);
      const sb = (b.room === room ? -100 : 0) + b.pos.distanceTo(cameraPos);
      return sa - sb;
    });
    this.lights.forEach((slot, i) => {
      const s = ranked[i];
      if (slot.spec === s) return;
      slot.spec = s;
      slot.light.position.copy(s.pos);
      slot.light.width = s.w; slot.light.height = s.h;
      slot.light.lookAt(s.look);
      slot.light.name = `skylight-${s.id}`;
    });
  }

  // color: THREE.Color, intensity: base nits-ish, sunHoriz: Vector2 (x,z) of the sun, sunUp: 0..1
  update(color, intensity, sunHoriz, sunUp) {
    this._color.copy(color); this._intensity = intensity;
    this._sunHoriz = sunHoriz; this._sunUp = sunUp;
    this.applyIntensity();
  }

  applyIntensity() {
    for (const { light, spec } of this.lights) {
      const facing = this._sunHoriz ? Math.max(0, spec.out.dot(this._sunHoriz)) : 0;
      const k = spec.weight * (0.75 + 0.6 * facing * (this._sunUp || 0));
      light.color.copy(this._color);
      light.intensity = this._intensity * k;
    }
  }

  // Called every frame with the camera position; reassigns a few times a second.
  tick(dt, cameraPos) {
    this._timer -= dt;
    if (this._timer > 0) return;
    this._timer = 0.3;
    const before = this.lights.map((l) => l.spec);
    this.assign(cameraPos);
    if (this.lights.some((l, i) => l.spec !== before[i])) this.applyIntensity();
  }
}

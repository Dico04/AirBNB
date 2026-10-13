// Skylight entering through glazing, approximated with rectangular area lights placed in each
// window / door opening and facing into the room. Gives the soft window-side gradient that makes
// interiors read like daylight photos (bright near the glass, calmer in the corners).
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { WALLS } from '../apartment.config.js';
import { wallAxis } from '../world/shell.js';

// Ordered by importance (low quality keeps only the first ones).
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
    this.lights = [];
    for (const spec of OPENINGS.slice(0, count)) {
      let wall, o;
      for (const w of WALLS) for (const op of w.openings || []) if (op.id === spec.id) { wall = w; o = op; }
      if (!wall) continue;
      const [x0, y0, x1, y1] = wall.rect;
      const axis = wallAxis(wall);
      const [ix, iy] = INWARD[wall.outside];
      // Inner face of the wall, centre of the opening.
      const along = (o.from + o.to) / 2;
      const inner = ix > 0 ? x1 : ix < 0 ? x0 : iy > 0 ? y1 : y0;
      const cx = axis === 'x' ? along : inner + ix * 0.02;
      const cy = axis === 'x' ? inner + iy * 0.02 : along;
      const ch = (o.bottom + o.top) / 2;
      const w = o.to - o.from, h = o.top - o.bottom;
      const light = new THREE.RectAreaLight(0xffffff, 0, w * 0.96, h * 0.96);
      light.position.set(cx, ch, cy);
      light.lookAt(cx + ix, ch - 0.18, cy + iy);   // aim slightly downward, like sky light
      light.name = `skylight-${spec.id}`;
      scene.add(light);
      // Outward horizontal direction in Three.js world (x, z) for sun-facing boost.
      this.lights.push({ light, weight: spec.weight, out: new THREE.Vector2(-ix, -iy) });
    }
  }

  // color: THREE.Color, intensity: base nits-ish, sunHoriz: Vector2 (x,z) of the sun, sunUp: 0..1
  update(color, intensity, sunHoriz, sunUp) {
    for (const l of this.lights) {
      const facing = Math.max(0, l.out.dot(sunHoriz));
      const k = l.weight * (0.75 + 0.6 * facing * sunUp);
      l.light.color.copy(color);
      l.light.intensity = intensity * k;
    }
  }
}

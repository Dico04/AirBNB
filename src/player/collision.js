// Height-aware 2.5D collision: oriented boxes in the horizontal plane with a vertical range.
// A box whose top is within `stepUp` of the player's feet is walkable (stairs, platform, sill);
// anything taller that overlaps the player's body blocks movement.
import * as THREE from 'three';

const _m = new THREE.Vector3();
const _c = new THREE.Vector3();

export class CollisionWorld {
  constructor() {
    this.static = [];   // { cx, cz, ux, uz, hx, hz, y0, y1 }  (u = local X axis in xz, v = perpendicular)
    this.dynamic = [];  // { object, size, localCenter, box }
  }

  // Axis-aligned box from plan rect [x0,y0,x1,y1] (plan y = world z) and heights.
  addBox(x0, y0, x1, y1, h0, h1) {
    this.static.push({ cx: (x0 + x1) / 2, cz: (y0 + y1) / 2, ux: 1, uz: 0, hx: (x1 - x0) / 2, hz: (y1 - y0) / 2, y0: h0, y1: h1 });
  }

  // Walkable floor surface at height h.
  addFloor(x0, y0, x1, y1, h) {
    this.addBox(x0, y0, x1, y1, h - 0.05, h);
  }

  // Box attached to a moving object (door leaves). size = [w, h, d] in the object's local frame.
  addDynamicBox(object, size, localCenter = [0, 0, 0]) {
    const entry = { object, size, localCenter, box: { cx: 0, cz: 0, ux: 1, uz: 0, hx: size[0] / 2, hz: size[2] / 2, y0: 0, y1: 0 } };
    this.dynamic.push(entry);
    return entry;
  }

  updateDynamic() {
    for (const d of this.dynamic) {
      d.object.updateWorldMatrix(true, false);
      const e = d.object.matrixWorld.elements;
      _c.set(d.localCenter[0], d.localCenter[1], d.localCenter[2]).applyMatrix4(d.object.matrixWorld);
      _m.set(e[0], e[1], e[2]);
      const len = Math.hypot(_m.x, _m.z) || 1;
      const b = d.box;
      b.cx = _c.x; b.cz = _c.z; b.ux = _m.x / len; b.uz = _m.z / len;
      b.y0 = _c.y - d.size[1] / 2; b.y1 = _c.y + d.size[1] / 2;
    }
  }

  *boxes() {
    yield* this.static;
    for (const d of this.dynamic) yield d.box;
  }

  // Highest walkable surface under (x, z) that is reachable from `feet`.
  groundAt(x, z, feet, stepUp, radius = 0) {
    let g = -Infinity;
    for (const b of this.boxes()) {
      if (b.y1 > feet + stepUp + 1e-4) continue;
      const dx = x - b.cx, dz = z - b.cz;
      const lu = dx * b.ux + dz * b.uz, lv = -dx * b.uz + dz * b.ux;
      if (Math.abs(lu) <= b.hx + radius * 0.5 && Math.abs(lv) <= b.hz + radius * 0.5) g = Math.max(g, b.y1);
    }
    return g;
  }

  // Push a circle (x, z, r) out of blocking boxes. Returns corrected {x, z}.
  resolve(x, z, r, feet, stepUp, bodyTop) {
    for (let iter = 0; iter < 4; iter++) {
      let moved = false;
      for (const b of this.boxes()) {
        if (b.y1 <= feet + stepUp + 1e-4 || b.y0 >= bodyTop) continue;
        const dx = x - b.cx, dz = z - b.cz;
        const lu = dx * b.ux + dz * b.uz, lv = -dx * b.uz + dz * b.ux;
        const qu = Math.max(-b.hx, Math.min(b.hx, lu)), qv = Math.max(-b.hz, Math.min(b.hz, lv));
        let du = lu - qu, dv = lv - qv;
        const d2 = du * du + dv * dv;
        if (d2 >= r * r) continue;
        let pu, pv;
        if (d2 > 1e-10) {
          const d = Math.sqrt(d2);
          pu = (du / d) * (r - d); pv = (dv / d) * (r - d);
        } else {
          // Centre inside the box: push out along the shallowest axis.
          const ou = b.hx - Math.abs(lu), ov = b.hz - Math.abs(lv);
          if (ou < ov) { pu = Math.sign(lu || 1) * (ou + r); pv = 0; } else { pu = 0; pv = Math.sign(lv || 1) * (ov + r); }
        }
        x += pu * b.ux - pv * b.uz;
        z += pu * b.uz + pv * b.ux;
        moved = true;
      }
      if (!moved) break;
    }
    return { x, z };
  }
}

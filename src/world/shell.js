// Building shell: walls with openings, floors, ceilings, soffits, skirting, roof and building body.
import * as THREE from 'three';
import { WALLS, ROOMS, SOFFITS, DIMS, SITE, TERRACE } from '../apartment.config.js';
import { planBox, planPlane, mesh } from '../util/geometry.js';
import { getMaterials } from './materials.js';

const FACE_INDEX = { e: 0, w: 1, s: 4, n: 5 }; // BoxGeometry groups: +x,-x,+y,-y,+z,-z

export function wallAxis(w) {
  const [x0, y0, x1, y1] = w.rect;
  return (x1 - x0) >= (y1 - y0) ? 'x' : 'y';
}

// All walls stop at the ceiling; the roof slab (2.60–2.95) sits on top of them.
export function wallHeight() {
  return DIMS.ceiling;
}

export function findOpening(id) {
  for (const w of WALLS) for (const o of w.openings || []) if (o.id === id) return { wall: w, opening: o };
  return null;
}

// Split a wall into solid pieces around its openings. Returns [{rect, h:[h0,h1]}].
export function wallPieces(w) {
  const [x0, y0, x1, y1] = w.rect;
  const axis = wallAxis(w);
  const a0 = axis === 'x' ? x0 : y0, a1 = axis === 'x' ? x1 : y1;
  const H = wallHeight(w);
  const rectAlong = (s, e) => (axis === 'x' ? [s, y0, e, y1] : [x0, s, x1, e]);
  const pieces = [];
  let cursor = a0;
  const ops = [...(w.openings || [])].sort((a, b) => a.from - b.from);
  for (const o of ops) {
    if (o.from > cursor + 1e-6) pieces.push({ rect: rectAlong(cursor, o.from), h: [0, H] });
    if (o.bottom > 1e-6) pieces.push({ rect: rectAlong(o.from, o.to), h: [0, o.bottom] });
    if (o.top < H - 1e-6) pieces.push({ rect: rectAlong(o.from, o.to), h: [o.top, H] });
    cursor = o.to;
  }
  if (a1 > cursor + 1e-6) pieces.push({ rect: rectAlong(cursor, a1), h: [0, H] });
  return pieces;
}

function roomAt(x, y) {
  for (const r of ROOMS) {
    const [x0, y0, x1, y1] = r.rect;
    if (x > x0 && x < x1 && y > y0 && y < y1) return r;
  }
  return null;
}

export function buildShell(collision) {
  const M = getMaterials();
  const group = new THREE.Group();
  group.name = 'shell';

  // ---------------------------------------------------------------- walls
  const skirtingGeos = [];
  for (const w of WALLS) {
    const mats = [M.plaster, M.plaster, M.plaster, M.plaster, M.plaster, M.plaster];
    if (w.outside) mats[FACE_INDEX[w.outside]] = M.render;
    for (const p of wallPieces(w)) {
      const [x0, y0, x1, y1] = p.rect;
      group.add(mesh(planBox(x0, y0, x1, y1, p.h[0], p.h[1]), mats, { name: w.id }));
      collision.addBox(x0, y0, x1, y1, p.h[0], p.h[1]);
      if (p.h[0] > 1e-6) continue;
      // Skirting on faces that look into a room with skirting.
      const faces = [
        { nx: 0, ny: -1, at: [(x0 + x1) / 2, y0 - 0.05], seg: [x0, y0, x1, y0] },
        { nx: 0, ny: 1, at: [(x0 + x1) / 2, y1 + 0.05], seg: [x0, y1, x1, y1] },
        { nx: -1, ny: 0, at: [x0 - 0.05, (y0 + y1) / 2], seg: [x0, y0, x0, y1] },
        { nx: 1, ny: 0, at: [x1 + 0.05, (y0 + y1) / 2], seg: [x1, y0, x1, y1] },
      ];
      for (const f of faces) {
        const room = roomAt(f.at[0], f.at[1]);
        if (!room || !room.skirting) continue;
        const t = 0.012;
        const [sx0, sy0, sx1, sy1] = f.seg;
        let r;
        if (f.ny !== 0) r = [sx0, f.ny < 0 ? sy0 - t : sy0, sx1, f.ny < 0 ? sy0 : sy0 + t];
        else r = [f.nx < 0 ? sx0 - t : sx0, sy0, f.nx < 0 ? sx0 : sx0 + t, sy1];
        if (r[2] - r[0] < 0.02 && r[3] - r[1] < 0.02) continue;
        skirtingGeos.push(planBox(r[0], r[1], r[2], r[3], 0, DIMS.skirting));
      }
    }
  }
  for (const g of skirtingGeos) group.add(mesh(g, M.skirting, { cast: false }));

  // ---------------------------------------------------------------- floors
  // One oak plane under the whole flat; tiles / terrazzo overlay where needed.
  group.add(mesh(planPlane(0, 0, 7.10, 9.05, 0, true), M.oakFloor, { cast: false, name: 'floor-oak' }));
  for (const r of ROOMS) {
    if (r.floor === 'oak') continue;
    const [x0, y0, x1, y1] = r.rect;
    const mat = r.floor === 'tile' ? M.tiles : M.landing;
    const fx0 = r.tileFromX ?? x0;
    group.add(mesh(planPlane(fx0, y0, x1, y1, 0.002, true), mat, { cast: false, name: `floor-${r.id}` }));
  }
  collision.addFloor(-0.3, -0.3, 7.4, 9.35, 0);

  // ---------------------------------------------------------------- soffits (the roof slab's underside is the ceiling)
  for (const s of SOFFITS) {
    const [x0, y0, x1, y1] = s.rect;
    group.add(mesh(planBox(x0, y0, x1, y1, s.h[0], s.h[1]), M.ceiling, { name: s.id }));
  }

  // ---------------------------------------------------------------- roof slab, upstand and coping
  const roof = [-0.30, -0.30, 7.40, 9.35];
  const roofMats = [M.render, M.render, M.gravel, M.ceiling, M.render, M.render];
  group.add(mesh(planBox(roof[0], roof[1], roof[2], roof[3], DIMS.ceiling, DIMS.roofTop), roofMats, { name: 'roof' }));
  const up = 0.22, cap = 0.08;
  const ring = [
    [roof[0], roof[1], roof[2], roof[1] + up],
    [roof[0], roof[3] - up, roof[2], roof[3]],
    [roof[0], roof[1] + up, roof[0] + up, roof[3] - up],
    [roof[2] - up, roof[1] + up, roof[2], roof[3] - up],
  ];
  for (const r of ring) {
    group.add(mesh(planBox(r[0], r[1], r[2], r[3], DIMS.roofTop, DIMS.roofUpstand - cap), M.render));
    group.add(mesh(planBox(r[0] - 0.02, r[1] - 0.02, r[2] + 0.02, r[3] + 0.02, DIMS.roofUpstand - cap, DIMS.roofUpstand), M.coping));
  }

  // ---------------------------------------------------------------- building body below the flat
  const b = TERRACE.buildingBody.rect;
  group.add(mesh(planBox(b[0], b[1], b[2], b[3], -SITE.floorAboveStreet, -0.01), M.buildingBody, { name: 'building-body' }));

  return group;
}

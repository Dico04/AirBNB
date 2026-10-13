// Former Onze-Lieve-Vrouw van Gratiekerk (now Theater Elckerlyc), Frankrijklei: neo-Gothic twin-tower
// façade in red brick with white stone bands, slate spires and pinnacles, nave, aisles, transepts, apse.
// Built in local metres: façade plane at z = 0 facing −z, x across (viewer's left = +x), y up from the street.
import * as THREE from 'three';
import { applyWorldUV } from '../util/geometry.js';
import { churchBrick, slateTexture } from '../textures/city.js';

const box = (x0, x1, z0, z1, y0, y1) => {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return applyWorldUV(g);
};

function materials() {
  const exterior = (m, boost = 0.8) => { m.userData.exterior = true; m.userData.envBoost = boost; return m; };
  const glow = (m, k) => { m.userData.glow = k; return m; };
  const b = churchBrick(), s = slateTexture();
  const bm = b.map.clone(); bm.repeat.set(1 / b.size[0], 1 / b.size[1]); bm.needsUpdate = true;
  const sm = s.map.clone(); sm.repeat.set(1 / s.size[0], 1 / s.size[1]); sm.needsUpdate = true;
  return {
    // warm floodlighting at night (emissive, faded in by the city's night control)
    brick: glow(exterior(new THREE.MeshStandardMaterial({ map: bm, roughness: 0.92, emissive: '#ffb47a', emissiveMap: bm, emissiveIntensity: 0 })), 0.5),
    stone: glow(exterior(new THREE.MeshStandardMaterial({ color: '#e2dac8', roughness: 0.85, emissive: '#ffd2a0', emissiveIntensity: 0 })), 0.16),
    slate: exterior(new THREE.MeshStandardMaterial({ map: sm, color: '#cfd6dc', roughness: 0.6, metalness: 0.05 }), 1.0),
    glass: exterior(new THREE.MeshStandardMaterial({ color: '#1d2329', roughness: 0.28, metalness: 0.3 }), 1.2),
    louvre: exterior(new THREE.MeshStandardMaterial({ color: '#2e3134', roughness: 0.7 })),
    door: exterior(new THREE.MeshStandardMaterial({ color: '#4a2f24', roughness: 0.7 })),
    metal: exterior(new THREE.MeshStandardMaterial({ color: '#4c5257', roughness: 0.4, metalness: 0.8 })),
  };
}

// Equilateral pointed arch, width w, total height h, bottom-centre at (cx, y0).
function pointed(w, h, cx = 0, y0 = 0) {
  const s = new THREE.Shape();
  const hs = y0 + h - 0.866 * w;
  s.moveTo(cx - w / 2, y0);
  s.lineTo(cx - w / 2, hs);
  s.absarc(cx + w / 2, hs, w, Math.PI, (Math.PI * 2) / 3, true);
  s.absarc(cx - w / 2, hs, w, Math.PI / 3, 0, true);
  s.lineTo(cx + w / 2, y0);
  s.closePath();
  return s;
}
function pointedPath(w, h, cx = 0, y0 = 0) {
  const p = new THREE.Path();
  const hs = y0 + h - 0.866 * w;
  p.moveTo(cx - w / 2, y0);
  p.lineTo(cx - w / 2, hs);
  p.absarc(cx + w / 2, hs, w, Math.PI, (Math.PI * 2) / 3, true);
  p.absarc(cx - w / 2, hs, w, Math.PI / 3, 0, true);
  p.lineTo(cx + w / 2, y0);
  p.closePath();
  return p;
}

// A lancet window (or blind arch / louvred opening) facing +z: dark pane + proud stone surround.
function lancet(M, w, h, { frame = 0.16, proud = 0.14, lights = 1, louvres = false, pane } = {}) {
  const g = new THREE.Group();
  const paneG = new THREE.ShapeGeometry(pointed(w, h), 6);
  paneG.translate(0, 0, 0.02);
  g.add(new THREE.Mesh(paneG, pane || M.glass));
  const ring = pointed(w + 2 * frame, h + frame, 0, -0.02);
  ring.holes.push(pointedPath(w, h));
  const rg = new THREE.ExtrudeGeometry(ring, { depth: proud, bevelEnabled: false, curveSegments: 6 });
  g.add(new THREE.Mesh(applyWorldUV(rg), M.stone));
  for (let i = 1; i < lights; i++) {
    const x = -w / 2 + (i * w) / lights;
    g.add(new THREE.Mesh(box(x - 0.05, x + 0.05, 0, 0.1, 0, h - 0.866 * w + 0.2), M.stone));
  }
  if (louvres) {
    for (let y = 0.3; y < h - 0.866 * w; y += 0.35) g.add(new THREE.Mesh(box(-w / 2, w / 2, 0.02, 0.09, y, y + 0.06), M.louvre));
  }
  g.add(new THREE.Mesh(box(-w / 2 - frame - 0.05, w / 2 + frame + 0.05, 0, proud + 0.06, -0.14, 0), M.stone));   // sill
  return g;
}

// Oculus with quatrefoil.
function oculus(M, r) {
  const g = new THREE.Group();
  const ring = new THREE.Shape(); ring.absarc(0, 0, r + 0.22, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, r, 0, Math.PI * 2, true); ring.holes.push(hole);
  g.add(new THREE.Mesh(applyWorldUV(new THREE.ExtrudeGeometry(ring, { depth: 0.16, bevelEnabled: false, curveSegments: 24 })), M.stone));
  g.add(new THREE.Mesh(new THREE.CircleGeometry(r, 32).translate(0, 0, 0.02), M.glass));
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const f = new THREE.Shape(); f.absarc(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, r * 0.36, 0, Math.PI * 2, false);
    const fh = new THREE.Path(); fh.absarc(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, r * 0.28, 0, Math.PI * 2, true); f.holes.push(fh);
    g.add(new THREE.Mesh(applyWorldUV(new THREE.ExtrudeGeometry(f, { depth: 0.1, bevelEnabled: false, curveSegments: 16 })), M.stone));
  }
  return g;
}

// Pierced stone balustrade (quatrefoil openings) along +x, length L; base at y = 0, facing +z.
function balustrade(M, L, h = 1.2) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(box(0, L, -0.15, 0.15, 0, 0.18), M.stone));
  g.add(new THREE.Mesh(box(-0.05, L + 0.05, -0.2, 0.2, h - 0.16, h), M.stone));
  const n = Math.max(2, Math.round(L / 0.55));
  for (let i = 0; i <= n; i++) {
    const x = (i * L) / n;
    g.add(new THREE.Mesh(box(x - 0.07, x + 0.07, -0.1, 0.1, 0.18, h - 0.16), M.stone));
    if (i < n) {
      const cx = x + L / n / 2;
      const q = new THREE.Shape(); q.absarc(cx, 0.18 + (h - 0.34) / 2, (h - 0.34) / 2 - 0.02, 0, Math.PI * 2, false);
      const qh = new THREE.Path(); qh.absarc(cx, 0.18 + (h - 0.34) / 2, (h - 0.34) / 2 - 0.1, 0, Math.PI * 2, true); q.holes.push(qh);
      const qg = new THREE.ExtrudeGeometry(q, { depth: 0.12, bevelEnabled: false, curveSegments: 10 });
      qg.translate(0, 0, -0.06);
      g.add(new THREE.Mesh(applyWorldUV(qg), M.stone));
    }
  }
  return g;
}

// Place an element (built facing +z) on a face of an axis-aligned block.
function onFace(obj, face, x, y, z) {
  obj.position.set(x, y, z);
  obj.rotation.y = { front: Math.PI, back: 0, left: Math.PI / 2, right: -Math.PI / 2 }[face];
  return obj;
}

// Truncated square pyramid (slate skirt) or full pyramid.
function frustum(w0, w1, h) {
  const g = new THREE.CylinderGeometry(w1 / Math.SQRT2, w0 / Math.SQRT2, h, 4, 1);
  g.rotateY(Math.PI / 4);
  return applyWorldUV(g);
}

function gableRoof(M, x0, x1, z0, z1, eave, ridge, alongZ = true, overhang = 0.4) {
  // prism roof with the ridge along z (or x)
  const span = alongZ ? x1 - x0 : z1 - z0, len = alongZ ? z1 - z0 : x1 - x0;
  const s = new THREE.Shape();
  s.moveTo(-span / 2 - overhang, -0.05); s.lineTo(0, ridge - eave); s.lineTo(span / 2 + overhang, -0.05); s.lineTo(span / 2 + overhang, -0.3); s.lineTo(0, ridge - eave - 0.3); s.lineTo(-span / 2 - overhang, -0.3); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len + 2 * overhang, bevelEnabled: false });
  g.translate(0, 0, -len / 2 - overhang);
  if (!alongZ) g.rotateY(Math.PI / 2);
  g.translate((x0 + x1) / 2, eave, (z0 + z1) / 2);
  return new THREE.Mesh(applyWorldUV(g), M.slate);
}

function gableWall(M, x0, x1, z, y0, y1, faceZ = true) {
  // triangular brick gable wall in the plane z = const (or x = const)
  const w = x1 - x0;
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(0, y1 - y0); s.lineTo(w / 2, 0); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false });
  g.translate(0, y0, -0.3);
  if (!faceZ) g.rotateY(Math.PI / 2);
  g.translate(faceZ ? (x0 + x1) / 2 : z, 0, faceZ ? z : (x0 + x1) / 2);
  return new THREE.Mesh(applyWorldUV(g), M.brick);
}

function tower(M, tx) {
  const g = new THREE.Group();
  const add = (geo, m = M.brick) => g.add(new THREE.Mesh(geo, m));
  const W = 6.5, x0 = tx - W / 2, x1 = tx + W / 2;
  add(box(x0, x1, 0, W, 0, 26));
  // stepped corner buttresses with stone set-offs (front and outer side)
  const outer = Math.sign(tx);
  for (const bx of [x0 + 0.5, x1 - 0.5]) {
    for (const [y0, y1, d] of [[0, 10, 0.9], [10, 18, 0.65], [18, 24, 0.4]]) {
      add(box(bx - 0.5, bx + 0.5, -d, 0, y0, y1));
      add(box(bx - 0.55, bx + 0.55, -d - 0.05, 0, y1 - 0.25, y1), M.stone);
    }
  }
  const sx = outer > 0 ? x1 : x0;
  for (const bz of [0.5, W - 0.5]) {
    for (const [y0, y1, d] of [[0, 10, 0.9], [10, 18, 0.65], [18, 24, 0.4]]) {
      add(outer > 0 ? box(sx, sx + d, bz - 0.5, bz + 0.5, y0, y1) : box(sx - d, sx, bz - 0.5, bz + 0.5, y0, y1));
      add(outer > 0 ? box(sx, sx + d + 0.05, bz - 0.55, bz + 0.55, y1 - 0.25, y1) : box(sx - d - 0.05, sx, bz - 0.55, bz + 0.55, y1 - 0.25, y1), M.stone);
    }
  }
  // string courses + cornice
  for (const y of [10, 14.2, 24.6]) add(box(x0 - 0.12, x1 + 0.12, -0.12, W + 0.12, y, y + 0.3), M.stone);
  add(box(x0 - 0.25, x1 + 0.25, -0.25, W + 0.25, 25.6, 26.0), M.stone);
  // front: oculus + paired lancets; sides: paired lancets; low lancets on the ground stage
  g.add(onFace(oculus(M, 1.0), 'front', tx, 16.4, -0.02));
  for (const face of ['front', 'left', 'right', 'back']) {
    for (const s of [-1, 1]) {
      const u = s * 1.15;
      const el = lancet(M, 0.85, 4.6, { lights: 1 });
      if (face === 'front') g.add(onFace(el, face, tx + u, 18.6, -0.02));
      else if (face === 'back') g.add(onFace(el, face, tx + u, 18.6, W + 0.02));
      else g.add(onFace(el, face, face === 'left' ? x1 + 0.02 : x0 - 0.02, 18.6, W / 2 + u));
    }
  }
  g.add(onFace(lancet(M, 1.1, 4.2), 'front', tx, 3.5, -0.02));
  // pierced balustrade around the shaft top
  for (const [face, len] of [['front', W], ['back', W], ['left', W], ['right', W]]) {
    const b = balustrade(M, len);
    if (face === 'front') { b.position.set(x0, 26, -0.05); }
    else if (face === 'back') { b.position.set(x0, 26, W + 0.05); }
    else { b.rotation.y = -Math.PI / 2; b.position.set(face === 'left' ? x1 + 0.05 : x0 - 0.05, 26, 0); }
    g.add(b);
  }
  // belfry stage with tall paired louvred lancets on every face
  const bw = 5.2, bx0 = tx - bw / 2, bx1 = tx + bw / 2, bz0 = (W - bw) / 2, bz1 = W - bz0;
  add(box(bx0, bx1, bz0, bz1, 26, 35));
  for (const y of [30.2, 34.6]) add(box(bx0 - 0.1, bx1 + 0.1, bz0 - 0.1, bz1 + 0.1, y, y + 0.25), M.stone);
  for (const [cx, cz] of [[bx0, bz0], [bx1, bz0], [bx0, bz1], [bx1, bz1]]) add(new THREE.CylinderGeometry(0.28, 0.28, 9, 8).translate(cx, 30.5, cz), M.stone);
  for (const face of ['front', 'left', 'right', 'back']) {
    for (const s of [-1, 1]) {
      const el = lancet(M, 0.95, 6.2, { louvres: true, pane: M.louvre });
      const u = s * 1.15;
      if (face === 'front') g.add(onFace(el, face, tx + u, 27.6, bz0 - 0.02));
      else if (face === 'back') g.add(onFace(el, face, tx + u, 27.6, bz1 + 0.02));
      else g.add(onFace(el, face, face === 'left' ? bx1 + 0.02 : bx0 - 0.02, 27.6, W / 2 + u));
    }
  }
  // slate skirt, upper stage with triple-arcaded gablets, corner pinnacles, octagonal spire
  add(frustum(bw + 0.6, 4.4, 1.6).translate(tx, 35.8, W / 2), M.slate);
  const uw = 4.2, ux0 = tx - uw / 2, ux1 = tx + uw / 2, uz0 = (W - uw) / 2, uz1 = W - uz0;
  add(box(ux0, ux1, uz0, uz1, 36.6, 40.4));
  for (const face of ['front', 'left', 'right', 'back']) {
    const gb = new THREE.Group();
    const tri = new THREE.Shape(); tri.moveTo(-1.9, 0); tri.lineTo(0, 2.2); tri.lineTo(1.9, 0); tri.closePath();
    gb.add(new THREE.Mesh(applyWorldUV(new THREE.ExtrudeGeometry(tri, { depth: 0.35, bevelEnabled: false })), M.stone));
    for (const u of [-1.05, 0, 1.05]) { const l = lancet(M, 0.55, 2.2, { frame: 0.1, proud: 0.1 }); l.position.set(u, -2.6, 0.05); gb.add(l); }
    if (face === 'front') g.add(onFace(gb, face, tx, 40.4, uz0 - 0.02));
    else if (face === 'back') g.add(onFace(gb, face, tx, 40.4, uz1 + 0.02));
    else g.add(onFace(gb, face, face === 'left' ? ux1 + 0.02 : ux0 - 0.02, 40.4, W / 2));
  }
  for (const [cx, cz] of [[bx0 + 0.1, bz0 + 0.1], [bx1 - 0.1, bz0 + 0.1], [bx0 + 0.1, bz1 - 0.1], [bx1 - 0.1, bz1 - 0.1]]) {
    add(applyWorldUV(new THREE.CylinderGeometry(0.42, 0.42, 6.2, 8).translate(cx, 39.7, cz)));
    for (const y of [38.2, 40.6]) add(new THREE.CylinderGeometry(0.47, 0.47, 0.22, 8).translate(cx, y, cz), M.stone);
    add(applyWorldUV(new THREE.ConeGeometry(0.5, 5.0, 8).translate(cx, 45.3, cz)), M.slate);
    add(new THREE.SphereGeometry(0.12, 8, 6).translate(cx, 47.9, cz), M.metal);
  }
  add(applyWorldUV(new THREE.ConeGeometry(2.25, 19.5, 8).rotateY(Math.PI / 8).translate(tx, 40.4 + 9.75, W / 2)), M.slate);
  add(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6).translate(tx, 61.2, W / 2), M.metal);
  add(new THREE.BoxGeometry(0.9, 0.08, 0.08).translate(tx, 61.6, W / 2), M.metal);
  return g;
}

export function buildChurch() {
  const M = materials();
  const g = new THREE.Group();
  g.name = 'church';
  const add = (geo, m = M.brick) => g.add(new THREE.Mesh(geo, m));
  g.add(tower(M, 7.75), tower(M, -7.75));
  // centre bay between the towers
  add(box(-4.5, 4.5, 0.6, 6.5, 0, 25));
  // portal with gable
  g.add(onFace(lancet(M, 3.4, 7.2, { frame: 0.45, proud: 0.35, pane: M.door }), 'front', 0, 0.2, 0.58));
  const pg = new THREE.Shape(); pg.moveTo(-2.8, 0); pg.lineTo(0, 3.0); pg.lineTo(2.8, 0); pg.closePath();
  g.add(onFace(new THREE.Mesh(applyWorldUV(new THREE.ExtrudeGeometry(pg, { depth: 0.5, bevelEnabled: false })), M.stone), 'front', 0, 7.0, 0.6));
  // blind arcading band, big tracery window, arcaded gallery, balustrade
  for (let i = 0; i < 7; i++) g.add(onFace(lancet(M, 0.7, 1.6, { frame: 0.1, proud: 0.08, pane: M.brick }), 'front', -3.3 + i * 1.1, 10.4, 0.58));
  add(box(-4.5, 4.5, 0.3, 0.6, 12.1, 12.35), M.stone);
  g.add(onFace(lancet(M, 4.6, 9.2, { frame: 0.32, proud: 0.2, lights: 3 }), 'front', 0, 12.6, 0.58));
  g.add(onFace(oculus(M, 0.8), 'front', 0, 19.0, 0.52));
  for (let i = 0; i < 7; i++) {
    g.add(onFace(lancet(M, 0.75, 2.1, { frame: 0.09, proud: 0.12 }), 'front', -3.6 + i * 1.2, 22.0, 0.58));
  }
  const bal = balustrade(M, 9.0); bal.position.set(-4.5, 24.6, 0.45); g.add(bal);
  // nave + gable behind the gallery
  add(box(-6.5, 6.5, 6.5, 44, 0, 19));
  g.add(gableRoof(M, -6.5, 6.5, 6.5, 44, 19, 31));
  g.add(gableWall(M, -4.5, 4.5, 3.6, 25, 31.5));
  g.add(gableRoof(M, -4.6, 4.6, 0.8, 6.6, 25, 31.6));
  // aisles with lean-to roofs, clerestory and aisle windows
  for (const s of [-1, 1]) {
    const ax0 = s > 0 ? 6.5 : -10.5, ax1 = s > 0 ? 10.5 : -6.5;
    add(box(ax0, ax1, 6.5, 30, 0, 10));
    const lean = new THREE.Shape();      // rises from the outer aisle wall toward the nave
    lean.moveTo(0, 0); lean.lineTo(-s * 4.4, 3.6); lean.lineTo(-s * 4.4, 3.3); lean.lineTo(0, -0.3); lean.closePath();
    const lg = new THREE.ExtrudeGeometry(lean, { depth: 23.5, bevelEnabled: false });
    lg.translate(s * 10.9, 10, 6.5);
    g.add(new THREE.Mesh(applyWorldUV(lg), M.slate));
    for (let z = 9; z < 29; z += 4) {
      g.add(onFace(lancet(M, 1.0, 4.5), s > 0 ? 'left' : 'right', s > 0 ? 10.52 : -10.52, 2.8, z));
      g.add(onFace(lancet(M, 1.0, 4.2), s > 0 ? 'left' : 'right', s * 6.52, 13.6, z));
    }
  }
  // transept with gable ends and rose windows
  add(box(-16, 16, 30, 38, 0, 19));
  g.add(gableRoof(M, -16, 16, 30, 38, 19, 28, false));
  for (const s of [-1, 1]) {
    g.add(gableWall(M, 30, 38, s * 16, 19, 28.2, false));
    g.add(onFace(oculus(M, 2.2), s > 0 ? 'left' : 'right', s * 16.02, 14.2, 34));
    for (const u of [-1.6, 0, 1.6]) g.add(onFace(lancet(M, 0.9, 5.0), s > 0 ? 'left' : 'right', s * 16.02, 3.5, 34 + u));
  }
  // polygonal apse
  const apse = new THREE.CylinderGeometry(6.5, 6.5, 19, 8, 1, false, -Math.PI / 2, Math.PI);
  add(applyWorldUV(apse.translate(0, 9.5, 44)));
  add(applyWorldUV(new THREE.ConeGeometry(7.0, 9, 8, 1, false, -Math.PI / 2, Math.PI).translate(0, 23.5, 44)), M.slate);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return g;
}

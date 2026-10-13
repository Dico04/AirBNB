// Shared building blocks for furniture & props: materials, lathe/pillow geometry, placement helpers.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as PT from '../textures/props.js';
import { applyWorldUV } from '../util/geometry.js';

// ---------------------------------------------------------------- materials
const matCache = new Map();
function withSet(set, params) {
  const m = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, ...params });
  if (set) {
    const r = new THREE.Vector2(1 / set.size[0], 1 / set.size[1]);
    for (const k of ['map', 'roughnessMap', 'normalMap']) {
      if (!set[k]) continue;
      const t = set[k].clone(); t.repeat.copy(r); t.needsUpdate = true; m[k] = t;
    }
  }
  return m;
}
const memo = (key, fn) => { if (!matCache.has(key)) matCache.set(key, fn()); return matCache.get(key); };

export const mats = {
  wood: (key, opts, params = {}) => memo(`wood-${key}`, () => withSet(PT.wood({ key, ...opts }), { normalScale: new THREE.Vector2(0.5, 0.5), ...params })),
  walnut: () => memo('walnut', () => withSet(PT.walnutHerringbone(), { normalScale: new THREE.Vector2(0.6, 0.6) })),
  velvet: (color, sheen = '#e9dcd2') => memo(`velvet-${color}`, () => {
    const set = PT.velvet();
    const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.9, sheen: 1.0, sheenRoughness: 0.42, sheenColor: new THREE.Color(sheen) });
    const r = new THREE.Vector2(1 / set.size[0], 1 / set.size[1]);
    for (const k of ['map', 'normalMap']) { const t = set[k].clone(); t.repeat.copy(r); t.needsUpdate = true; m[k] = t; }
    m.normalScale = new THREE.Vector2(0.35, 0.35);
    return m;
  }),
  linen: (color, params = {}) => memo(`linen-${color}-${JSON.stringify(params)}`, () => withSet(PT.linen(), { color, normalScale: new THREE.Vector2(0.4, 0.4), ...params })),
  fibres: (color) => memo(`fibres-${color}`, () => withSet(PT.fibres({ key: `fib-${color}`, base: color }), { roughness: 0.75 })),
  basket: () => memo('basket', () => withSet(PT.basketWeave(), { normalScale: new THREE.Vector2(0.8, 0.8) })),
  cork: () => memo('cork', () => withSet(PT.cork(), {})),
  ceramic: (key, base, opts = {}, params = {}) => memo(`cer-${key}`, () => withSet(PT.ceramic({ key, base, ...opts }), params)),
  glaze: (color, params = {}) => memo(`glaze-${color}`, () => new THREE.MeshPhysicalMaterial({ color, roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.12, ...params })),
  brushed: (color = '#d4d6d8') => memo(`brushed-${color}`, () => withSet(PT.brushedMetal(), { color, metalness: 0.85, roughness: 1, normalScale: new THREE.Vector2(0.12, 0.12) })),
  paint: (color, roughness = 0.45, params = {}) => memo(`paint-${color}-${roughness}`, () => new THREE.MeshStandardMaterial({ color, roughness, ...params })),
  metal: (color, roughness = 0.3) => memo(`metal-${color}-${roughness}`, () => new THREE.MeshStandardMaterial({ color, roughness, metalness: 1 })),
  black: () => memo('black', () => new THREE.MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.5 })),
  matteBlack: () => memo('matteBlack', () => new THREE.MeshStandardMaterial({ color: '#1e1e1e', roughness: 0.8 })),
  glass: (tint = '#ffffff', opacity = 0.18) => memo(`glass-${tint}-${opacity}`, () => {
    const m = new THREE.MeshPhysicalMaterial({ color: tint, roughness: 0.04, metalness: 0, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.2 });
    m.userData.exterior = true; m.userData.envBoost = 1.2;
    return m;
  }),
  cane: (tintBack = '#2a2118') => memo('cane', () => {
    const set = PT.caneWebbing();
    const t = set.map.clone(); t.repeat.set(1 / set.size[0], 1 / set.size[1]); t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.65 });
  }),
  macrame: () => memo('macrame', () => {
    const set = PT.macrame();
    const t = set.map.clone(); t.repeat.set(1 / set.size[0], 1 / set.size[1]); t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.95 });
  }),
  picture: (key, texFn) => memo(`pic-${key}`, () => new THREE.MeshStandardMaterial({ map: texFn(), roughness: 0.8 })),
  emissiveShade: (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide, transparent: false }),
  leaf: (color) => memo(`leaf-${color}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.62, side: THREE.DoubleSide })),
};

// ---------------------------------------------------------------- geometry
export function lathe(profile, segments = 32, phi = Math.PI * 2) {
  const pts = profile.map(([r, h]) => new THREE.Vector2(Math.max(0.0001, r), h));
  const g = new THREE.LatheGeometry(pts, segments, 0, phi);
  g.computeVertexNormals();
  return g;
}

export function rbox(w, h, d, r = 0.004, seg = 2) {
  const g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
  return applyWorldUV(g);
}

// Soft cushion: subdivided box whose thickness swells toward the middle and pinches at the seams.
// flat: falloff exponent (4 = flat-topped seat cushion, 2 = domed pillow); pinch pulls the edge
// middles in so the corners poke out; wrinkle adds low creases. Normals are smoothed across seams.
export function pillow(w, h, d, { puff = 0.5, seg = 14, round = 0.35, flat = 4, pinch = 0, wrinkle = 0, seed = 1 } = {}) {
  const g = new THREE.BoxGeometry(w, h, d, seg, Math.max(2, Math.round(seg * h / w)), Math.max(2, Math.round(seg * d / w)));
  const p = g.attributes.position;
  const ph = [seed * 1.7, seed * 2.9 + 1, seed * 0.6 + 2];
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i) / (w / 2), y = p.getY(i) / (h / 2), z = p.getZ(i) / (d / 2);
    const y0 = y;
    const fx = 1 - Math.pow(Math.abs(x), flat), fz = 1 - Math.pow(Math.abs(z), flat);
    let swell = (1 - puff) + puff * fx * fz;
    if (wrinkle) {
      const n = Math.sin(x * 5.3 + z * 2.1 + ph[0]) * Math.sin(z * 4.7 - x * 1.3 + ph[1]) + 0.5 * Math.sin(x * 11 + z * 9 + ph[2]);
      swell *= 1 + wrinkle * 0.1 * fx * fz * n;
    }
    y *= swell;
    const edge = Math.max(Math.abs(x), Math.abs(z));
    // the seam (y0 = 0) stays outermost; the faces curve in toward it → rounded, plump edge
    const k = 1 - round * Math.pow(Math.max(0, edge - 0.6) / 0.4, 2) * (0.3 + 0.7 * y0 * y0);
    x *= k; z *= k;
    if (pinch) {
      const px = 1 - pinch * (1 - z * z), pz = 1 - pinch * (1 - x * x);
      x *= px; z *= pz;
    }
    p.setXYZ(i, x * w / 2, y * h / 2, z * d / 2);
  }
  g.computeVertexNormals();
  applyWorldUV(g);
  return smoothNormals(g);
}

// Average normals of coincident vertices (keeps UV seams, removes hard shading at box seams).
export function smoothNormals(g) {
  const p = g.attributes.position, n = g.attributes.normal;
  const key = (i) => `${Math.round(p.getX(i) * 1e4)},${Math.round(p.getY(i) * 1e4)},${Math.round(p.getZ(i) * 1e4)}`;
  const acc = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = key(i);
    const a = acc.get(k) || [0, 0, 0];
    a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i);
    acc.set(k, a);
  }
  for (let i = 0; i < p.count; i++) {
    const a = acc.get(key(i));
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    n.setXYZ(i, a[0] / l, a[1] / l, a[2] / l);
  }
  n.needsUpdate = true;
  return g;
}

// Plan placement: x/y plan coords, h height, face = plan bearing the object's local -Z front points to.
export function place(obj, x, y, h = 0, faceDeg = 0) {
  obj.position.set(x, h, y);
  obj.rotation.y = -THREE.MathUtils.degToRad(faceDeg);
  return obj;
}

export function mesh(geometry, material, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

// Thin tube along points (stems, cables, rods).
export function tube(points, radius = 0.004, radial = 6, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))));
  return new THREE.TubeGeometry(curve, Math.max(4, points.length * 6), radius, radial, closed);
}

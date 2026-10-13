import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Plan (x, y, h) → Three.js vector (x, h, y).
export const P = (x, y, h = 0) => new THREE.Vector3(x, h, y);

// Assign UVs in metres from world-space positions, picked by face normal.
//   ±X faces: (z, y)   ±Y faces: (x, z)   ±Z faces: (x, y)
// `rotateTop` swaps u/v on horizontal faces (e.g. planks running along x instead of z).
export function applyWorldUV(geometry, { rotateTop = false, rotateSides = false } = {}) {
  const pos = geometry.attributes.position;
  const nrm = geometry.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) { u = rotateTop ? -z : x; v = rotateTop ? x : -z; }
    else if (ax >= az) { u = nrm.getX(i) > 0 ? -z : z; v = y; if (rotateSides) [u, v] = [v, u]; }
    else { u = nrm.getZ(i) > 0 ? x : -x; v = y; if (rotateSides) [u, v] = [v, u]; }
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

// Axis-aligned box from plan rect + height range, with metre UVs.
export function planBox(x0, y0, x1, y1, h0, h1, uvOpts) {
  const g = new THREE.BoxGeometry(x1 - x0, h1 - h0, y1 - y0);
  g.translate((x0 + x1) / 2, (h0 + h1) / 2, (y0 + y1) / 2);
  return applyWorldUV(g, uvOpts);
}

// Rounded (bevelled) box centred at origin, metre UVs relative to its own centre.
export function roundedBox(w, h, d, r = 0.004, seg = 2, uvOpts) {
  const g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));
  return applyWorldUV(g, uvOpts);
}

// Rounded box placed at plan rect + height range.
export function planRoundedBox(x0, y0, x1, y1, h0, h1, r = 0.004, uvOpts) {
  const g = roundedBox(x1 - x0, h1 - h0, y1 - y0, r, 2);
  g.translate((x0 + x1) / 2, (h0 + h1) / 2, (y0 + y1) / 2);
  return applyWorldUV(g, uvOpts);
}

// Horizontal plane (floor/ceiling) over a plan rect at height h. faceUp=false → ceiling.
export function planPlane(x0, y0, x1, y1, h, faceUp = true, uvOpts) {
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
  g.rotateX(faceUp ? -Math.PI / 2 : Math.PI / 2);
  g.translate((x0 + x1) / 2, h, (y0 + y1) / 2);
  return applyWorldUV(g, uvOpts);
}

export function mesh(geometry, material, { cast = true, receive = true, name } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (name) m.name = name;
  return m;
}

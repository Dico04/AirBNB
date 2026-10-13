// Merge static meshes by material to cut draw calls (shadow pass included).
// Skips anything flagged userData.dynamic / noMerge (and its descendants), instanced meshes and lines.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function prepare(geometry, matrix) {
  let g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  g.morphAttributes = {};
  g.clearGroups();
  g.applyMatrix4(matrix);
  return g;
}

export function mergeStatic(root, { name = 'merged' } = {}) {
  root.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const remove = [];
  const visit = (o) => {
    if (o.userData.dynamic || o.userData.noMerge) return;
    if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const local = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      if (Array.isArray(o.material) && o.geometry.groups.length) {
        // split multi-material meshes by group
        const base = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
        for (const grp of o.geometry.groups) {
          const sub = new THREE.BufferGeometry();
          for (const [k, a] of Object.entries(base.attributes)) {
            sub.setAttribute(k, new THREE.BufferAttribute(a.array.slice(grp.start * a.itemSize, (grp.start + grp.count) * a.itemSize), a.itemSize));
          }
          add(mats[grp.materialIndex], sub, local, o);
        }
      } else {
        add(mats[0], o.geometry, local, o);
      }
      remove.push(o);
    }
    for (const c of o.children) visit(c);
  };
  const add = (mat, geom, local, o) => {
    const key = `${mat.uuid}|${o.castShadow ? 1 : 0}|${o.receiveShadow ? 1 : 0}`;
    if (!buckets.has(key)) buckets.set(key, { mat, cast: o.castShadow, receive: o.receiveShadow, geoms: [] });
    buckets.get(key).geoms.push(prepare(geom, local));
  };
  for (const c of [...root.children]) visit(c);
  for (const o of remove) {
    o.parent?.remove(o);
    // keep children (non-mesh helpers) attached to root
  }
  const out = new THREE.Group();
  out.name = name;
  for (const { mat, cast, receive, geoms } of buckets.values()) {
    const g = mergeGeometries(geoms, false);
    if (!g) continue;
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = cast; m.receiveShadow = receive;
    if (mat.transparent) m.renderOrder = 2;
    out.add(m);
  }
  root.add(out);
  return out;
}

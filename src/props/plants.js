// Procedural plants: olive tree (instanced leaves), columnar euphorbia, bird-of-paradise, dried flowers.
// Plants keep vertex colours / instancing, so they are flagged noMerge.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../textures/noise.js';
import { mats } from './kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Lanceolate leaf along +Y with a slight V fold; base at origin.
function leafGeometry(len, width, { segs = 6, fold = 0.25, curl = 0.0, tipShape = 0.85 } = {}) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const w = width * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.02)), tipShape) * 0.5;
    for (const s of [-1, 0, 1]) {
      const x = s * w;
      const z = Math.abs(s) * w * fold + curl * u * u * len;
      pos.push(x, u * len, z);
      uv.push((s + 1) / 2, u);
    }
  }
  for (let i = 0; i < segs; i++) {
    const a = i * 3;
    idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function barkMaterial(color = '#6b6253') {
  return mats.paint(color, 0.9);
}

// ---------------------------------------------------------------- olive tree
export function oliveTree({ height = 1.6, seed = 7, leafCount = 1700, trunkColor = '#6b6253' } = {}) {
  const rand = mulberry32(seed);
  const group = new THREE.Group();
  group.userData.noMerge = true;
  const woody = [];
  const twigs = [];   // { curve, r }
  // trunk
  const tPts = [];
  let p = V(0, 0, 0);
  for (let i = 0; i <= 6; i++) {
    tPts.push(p.clone());
    p = p.clone().add(V((rand() - 0.5) * 0.06, height * 0.62 / 6, (rand() - 0.5) * 0.06));
  }
  const trunk = new THREE.CatmullRomCurve3(tPts);
  woody.push(new THREE.TubeGeometry(trunk, 24, 0.018, 7, false));
  // main branches
  const nMain = 8;
  for (let b = 0; b < nMain; b++) {
    const t0 = 0.4 + (b / nMain) * 0.6;
    const start = trunk.getPoint(Math.min(0.999, t0));
    const ang = rand() * Math.PI * 2;
    const out = 0.55 + rand() * 0.45;
    const L = height * (0.38 + rand() * 0.25);
    const dir = V(Math.cos(ang) * out, 1, Math.sin(ang) * out).normalize();
    const pts = [start];
    let q = start.clone();
    for (let i = 1; i <= 4; i++) {
      q = q.clone().addScaledVector(dir, L / 4).add(V((rand() - 0.5) * 0.05, 0, (rand() - 0.5) * 0.05));
      pts.push(q);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    woody.push(new THREE.TubeGeometry(curve, 10, 0.008, 5, false));
    twigs.push({ curve, r: 0.008 });
    // twigs off each branch
    for (let k = 0; k < 8; k++) {
      const s = curve.getPoint(0.15 + rand() * 0.8);
      const a2 = rand() * Math.PI * 2;
      const d2 = V(Math.cos(a2) * 0.8, 0.6 + rand() * 0.6, Math.sin(a2) * 0.8).normalize();
      const L2 = 0.14 + rand() * 0.22;
      const e = s.clone().addScaledVector(d2, L2);
      const mid = s.clone().lerp(e, 0.5).add(V(0, 0.03, 0));
      const c2 = new THREE.CatmullRomCurve3([s, mid, e]);
      woody.push(new THREE.TubeGeometry(c2, 5, 0.003, 4, false));
      twigs.push({ curve: c2, r: 0.003 });
    }
  }
  const wood = new THREE.Mesh(mergeGeometries(woody.map((g) => g.toNonIndexed())), barkMaterial(trunkColor));
  wood.castShadow = true; wood.receiveShadow = true;
  group.add(wood);
  // leaves
  const leafGeo = leafGeometry(0.068, 0.012, { fold: 0.35, curl: 0.15 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, side: THREE.DoubleSide });
  const inst = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
  const m = new THREE.Matrix4(), qd = new THREE.Quaternion(), sc = new THREE.Vector3(), up = V(0, 1, 0);
  const cTop = new THREE.Color('#5d6b4b'), cUnder = new THREE.Color('#9aa38b'), col = new THREE.Color();
  let n = 0;
  while (n < leafCount) {
    const tw = twigs[Math.floor(rand() * twigs.length)];
    const t = 0.15 + rand() * 0.85;
    const at = tw.curve.getPoint(t);
    const tan = tw.curve.getTangent(t);
    // leaf direction: twig tangent tilted outward
    const side = V(rand() - 0.5, rand() * 0.3, rand() - 0.5).normalize();
    const dir = tan.clone().multiplyScalar(0.45).add(side).normalize();
    qd.setFromUnitVectors(up, dir);
    const roll = new THREE.Quaternion().setFromAxisAngle(dir, rand() * Math.PI * 2);
    qd.premultiply(roll);
    const s = 0.75 + rand() * 0.5;
    sc.set(s, s, s);
    m.compose(at, qd, sc);
    inst.setMatrixAt(n, m);
    col.copy(cTop).lerp(cUnder, Math.pow(rand(), 1.6) * 0.8);
    inst.setColorAt(n, col);
    n++;
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = true; inst.receiveShadow = true;
  group.add(inst);
  return group;
}

// ---------------------------------------------------------------- ribbed succulent stem (euphorbia)
function ribbedStem(curve, radius, { ribs = 4, depth = 0.32, radial = 20, segs = 26, colorA, colorB, rand }) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [], nor = [], colr = [], idx = [];
  const P = V(0, 0, 0);
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, P);
    const N = frames.normals[i], B = frames.binormals[i];
    const tipK = t > 0.86 ? Math.sqrt(Math.max(0, 1 - (t - 0.86) / 0.14)) : 1;
    const baseR = radius * tipK * (0.92 + 0.08 * Math.sin(t * 9 + 1));
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const crest = 0.5 + 0.5 * Math.cos(ribs * th);
      const r = baseR * (1 - depth * (1 - crest));
      const dx = Math.cos(th), dy = Math.sin(th);
      pos.push(P.x + r * (dx * N.x + dy * B.x), P.y + r * (dx * N.y + dy * B.y), P.z + r * (dx * N.z + dy * B.z));
      nor.push(0, 0, 0);
      const c = colorA.clone().lerp(colorB, crest * 0.6 + (rand() - 0.5) * 0.15);
      colr.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function euphorbia({ height = 0.86, seed = 13, color = '#3a4a2e' } = {}) {
  const rand = mulberry32(seed);
  const cA = new THREE.Color(color), cB = new THREE.Color('#6f8558');
  const parts = [];
  const main = new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.005, height * 0.4, 0.004), V(-0.006, height * 0.8, 0), V(0, height, 0.003)]);
  parts.push(ribbedStem(main, 0.032, { colorA: cA, colorB: cB, rand }));
  const arms = 6;
  for (let i = 0; i < arms; i++) {
    const h0 = height * (0.18 + 0.42 * (i / arms) + rand() * 0.08);
    const a = (i / arms) * Math.PI * 2 + rand() * 0.6;
    const out = 0.05 + rand() * 0.04;
    const top = h0 + 0.12 + rand() * height * 0.38;
    const c = new THREE.CatmullRomCurve3([
      V(0, h0, 0), V(Math.cos(a) * out * 0.8, h0 + 0.02, Math.sin(a) * out * 0.8),
      V(Math.cos(a) * out, h0 + 0.07, Math.sin(a) * out), V(Math.cos(a) * out * 1.05, top, Math.sin(a) * out * 1.05),
    ]);
    parts.push(ribbedStem(c, 0.022 + rand() * 0.006, { colorA: cA, colorB: cB, rand, segs: 18 }));
  }
  const g = mergeGeometries(parts);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 });
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  m.userData.noMerge = true;
  return m;
}

// ---------------------------------------------------------------- bird of paradise (Strelitzia)
function paddleLeaf(len, width, rand) {
  const segs = 10, cols = 6, pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const w = width * 0.5 * Math.pow(Math.sin(Math.PI * Math.min(0.999, 0.04 + u * 0.96)), 0.7);
    for (let j = 0; j <= cols; j++) {
      const v = j / cols * 2 - 1;
      let x = v * w;
      // torn edges: shave a few edge vertices
      if (Math.abs(v) === 1 && rand() < 0.18) x *= 0.82;
      const y = u * len;
      const z = Math.abs(v) * w * 0.35 - Math.sin(u * Math.PI) * 0.02 + Math.pow(Math.abs(v), 2) * w * 0.1;
      pos.push(x, y, z);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < cols; j++) {
    const a = i * (cols + 1) + j, b = a + cols + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function strelitzia({ height = 1.1, seed = 21, leaves = 8, arc = [0, Math.PI * 2] } = {}) {
  const rand = mulberry32(seed);
  const group = new THREE.Group();
  group.userData.noMerge = true;
  const stems = [], blades = [];
  for (let i = 0; i < leaves; i++) {
    const a = arc[0] + ((i + 0.5) / leaves) * (arc[1] - arc[0]) + (rand() - 0.5) * 0.3;
    const lean = 0.12 + rand() * 0.28;
    const L = height * (0.45 + rand() * 0.35);
    const end = V(Math.cos(a) * lean * L, L, Math.sin(a) * lean * L);
    const mid = end.clone().multiplyScalar(0.5).add(V(0, 0.02, 0));
    const curve = new THREE.CatmullRomCurve3([V(Math.cos(a) * 0.01, 0, Math.sin(a) * 0.01), mid, end]);
    stems.push(new THREE.TubeGeometry(curve, 8, 0.0055, 5, false).toNonIndexed());
    const blade = paddleLeaf(0.30 + rand() * 0.1, 0.12 + rand() * 0.03, rand);
    const dir = curve.getTangent(1).add(V(Math.cos(a) * 0.6, 0.1, Math.sin(a) * 0.6)).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a + Math.PI / 2 + (rand() - 0.5)));
    blade.applyQuaternion(q);
    blade.translate(end.x, end.y, end.z);
    blades.push(blade.toNonIndexed());
  }
  const stemMesh = new THREE.Mesh(mergeGeometries(stems), mats.paint('#3f5a34', 0.6));
  const leafMesh = new THREE.Mesh(mergeGeometries(blades), new THREE.MeshStandardMaterial({ color: '#2f5a2e', roughness: 0.38, side: THREE.DoubleSide }));
  for (const mm of [stemMesh, leafMesh]) { mm.castShadow = true; mm.receiveShadow = true; group.add(mm); }
  return group;
}

// ---------------------------------------------------------------- dried flowers for a vase mouth
export function driedFlowers({ seed = 31, stems = 7, height = 0.32 } = {}) {
  const rand = mulberry32(seed);
  const group = new THREE.Group();
  group.userData.noMerge = true;
  const stemG = [], heads = [];
  const headGeo = new THREE.IcosahedronGeometry(0.009, 0);
  for (let i = 0; i < stems; i++) {
    const a = rand() * Math.PI * 2, lean = 0.15 + rand() * 0.25;
    const top = V(Math.cos(a) * lean * height, height * (0.75 + rand() * 0.3), Math.sin(a) * lean * height);
    const curve = new THREE.CatmullRomCurve3([V(0, 0, 0), top.clone().multiplyScalar(0.5).add(V(0, 0.02, 0)), top]);
    stemG.push(new THREE.TubeGeometry(curve, 6, 0.0018, 4, false).toNonIndexed());
    // a small umbel of tiny heads
    for (let k = 0; k < 10; k++) {
      const h = headGeo.clone().toNonIndexed();
      const s = 0.6 + rand() * 0.8;
      h.scale(s, s * 0.7, s);
      h.translate(top.x + (rand() - 0.5) * 0.05, top.y + (rand() - 0.5) * 0.02, top.z + (rand() - 0.5) * 0.05);
      heads.push({ g: h, red: rand() < 0.15 });
    }
  }
  group.add(new THREE.Mesh(mergeGeometries(stemG), mats.paint('#8f8462', 0.9)));
  const beige = heads.filter((h) => !h.red).map((h) => h.g), red = heads.filter((h) => h.red).map((h) => h.g);
  if (beige.length) group.add(new THREE.Mesh(mergeGeometries(beige), mats.paint('#cdbb84', 0.95)));
  if (red.length) group.add(new THREE.Mesh(mergeGeometries(red), mats.paint('#a8503a', 0.95)));
  for (const c of group.children) { c.castShadow = true; }
  return group;
}

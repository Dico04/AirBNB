// The city around the flat: Frankrijklei boulevard (lanes, tram bed, plane trees), the neo-Gothic church,
// hand-placed neighbours and landmarks from the photos, and a procedural skyline out to CITY.radius.
// Façades are merged per style into a handful of meshes; their lit windows fade in with the night.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SITE, CITY } from '../apartment.config.js';
import { FACADE_STYLES, facade, roofTexture, roadTexture, posterTexture, churchBrick } from '../textures/city.js';
import { mulberry32 } from '../textures/noise.js';
import { buildChurch } from './church.js';
import { mergeStatic } from '../util/merge.js';
import { applyWorldUV } from '../util/geometry.js';

const STREET = -SITE.floorAboveStreet;
const ext = (m, boost = 0.7) => { m.userData.exterior = true; m.userData.envBoost = boost; return m; };

// Box walls with façade UVs in metres: u along the wall (+ offset), v = height above the street.
function walls(x0, y0, x1, y1, top, uOff = 0) {
  const pos = [], nor = [], uv = [];
  const h0 = STREET, h1 = STREET + top;
  const quad = (ax, az, bx, bz, nx, nz, u0) => {
    const len = Math.hypot(bx - ax, bz - az);
    const P = [[ax, h0, az], [bx, h0, bz], [bx, h1, bz], [ax, h0, az], [bx, h1, bz], [ax, h1, az]];
    const U = [[u0, 0], [u0 + len, 0], [u0 + len, top], [u0, 0], [u0 + len, top], [u0, top]];
    for (let i = 0; i < 6; i++) { pos.push(...P[i]); nor.push(nx, 0, nz); uv.push(...U[i]); }
  };
  quad(x0, y1, x1, y1, 0, 1, uOff);                    // plan-south face (+z)
  quad(x1, y1, x1, y0, 1, 0, uOff + 7);                // east (+x)
  quad(x1, y0, x0, y0, 0, -1, uOff + 13);              // north (−z)
  quad(x0, y0, x0, y1, -1, 0, uOff + 19);              // west (−x)
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}
function roof(x0, y0, x1, y1, h) {
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0).rotateX(-Math.PI / 2);
  g.translate((x0 + x1) / 2, h, (y0 + y1) / 2);
  return applyWorldUV(g);
}
function boxGeo(x0, y0, x1, y1, h0, h1) {
  const g = new THREE.BoxGeometry(x1 - x0, h1 - h0, y1 - y0);
  g.translate((x0 + x1) / 2, (h0 + h1) / 2, (y0 + y1) / 2);
  return applyWorldUV(g);
}
const nonIdx = (g) => (g.index ? g.toNonIndexed() : g);

export function buildCity() {
  const group = new THREE.Group();
  group.name = 'city';
  const rand = mulberry32(CITY.seed);
  const styles = Object.keys(FACADE_STYLES);
  const buckets = Object.fromEntries(styles.map((s) => [s, []]));
  const roofs = [], clutter = [], copings = [];

  // ---- façade materials (one per style); emissive window maps fade in at night
  const facadeMats = {};
  for (const s of styles) {
    const t = facade(s, 3);
    const map = t.map, em = t.emissiveMap;
    for (const tx of [map, em]) tx.repeat.set(1 / t.size[0], 1 / t.size[1]);
    facadeMats[s] = ext(new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0, roughness: s === 'glass' ? 0.25 : 0.85, metalness: s === 'glass' ? 0.4 : 0 }), s === 'glass' ? 1.2 : 0.7);
    facadeMats[s].userData.glow = 1.6;
  }
  const rt = roofTexture();
  const roofMap = rt.map.clone(); roofMap.repeat.set(1 / rt.size[0], 1 / rt.size[1]); roofMap.needsUpdate = true;
  const roofMat = ext(new THREE.MeshStandardMaterial({ map: roofMap, roughness: 0.95 }), 0.6);
  const clutterMat = ext(new THREE.MeshStandardMaterial({ color: '#b9b8b2', roughness: 0.8 }), 0.6);
  const copingMat = ext(new THREE.MeshStandardMaterial({ color: '#d8d6cf', roughness: 0.8 }), 0.7);

  const addBlock = (x0, y0, x1, y1, top, style, { clutterChance = 0.55 } = {}) => {
    buckets[style].push(walls(x0, y0, x1, y1, top, rand() * 40));
    roofs.push(roof(x0, y0, x1, y1, STREET + top));
    const near = Math.hypot((x0 + x1) / 2 - 4, (y0 + y1) / 2 - 12) < 320;
    if (!near) clutterChance *= 0.3;
    if (near) copings.push(nonIdx(boxGeo(x0 - 0.15, y0 - 0.15, x1 + 0.15, y0 + 0.15, STREET + top, STREET + top + 0.5)),
      nonIdx(boxGeo(x0 - 0.15, y1 - 0.15, x1 + 0.15, y1 + 0.15, STREET + top, STREET + top + 0.5)),
      nonIdx(boxGeo(x0 - 0.15, y0, x0 + 0.15, y1, STREET + top, STREET + top + 0.5)),
      nonIdx(boxGeo(x1 - 0.15, y0, x1 + 0.15, y1, STREET + top, STREET + top + 0.5)));
    if (rand() < clutterChance && x1 - x0 > 8 && y1 - y0 > 8) {
      const w = 3 + rand() * 4, d = 3 + rand() * 4;
      const cx = x0 + 2 + rand() * (x1 - x0 - 4 - w), cy = y0 + 2 + rand() * (y1 - y0 - 4 - d);
      clutter.push(nonIdx(boxGeo(cx, cy, cx + w, cy + d, STREET + top, STREET + top + 2.2 + rand() * 1.5)));
      if (rand() < 0.4) clutter.push(nonIdx(new THREE.CylinderGeometry(0.06, 0.06, 4 + rand() * 6, 5).translate(cx + w + 1, STREET + top + 3, cy + 1)));
    }
  };

  // ---- hand-placed neighbours and landmarks
  const excl = [[-20, -55, 32, 13]];   // keep the generic grid off our block
  for (const b of CITY.blocks) {
    const [x0, y0, x1, y1] = b.rect;
    addBlock(x0, y0, x1, y1, b.top, b.style, { clutterChance: b.id.startsWith('west-walk') ? 0 : 0.6 });
    excl.push([x0 - 4, y0 - 4, x1 + 4, y1 + 4]);
  }
  // street-level poster on the finned office (02)
  const fins = CITY.blocks.find((b) => b.poster);
  if (fins) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.5), ext(new THREE.MeshStandardMaterial({ map: posterTexture(), roughness: 0.6, emissive: '#ffffff', emissiveMap: posterTexture(), emissiveIntensity: 0 })));
    p.rotation.y = Math.PI;
    p.position.set(fins.rect[0] + 9, STREET + 3.2, fins.rect[1] - 0.05);
    p.material.userData.glow = 0.6;
    group.add(p);
  }

  // ---- the church
  const [chx, chy] = CITY.church.facade;
  const church = buildChurch();
  church.position.set(chx, STREET, chy);
  church.rotation.y = THREE.MathUtils.degToRad(CITY.church.turnDeg || 0);
  group.add(church);
  mergeStatic(church, { name: 'church-merged' });
  excl.push([chx - 22, chy - 8, chx + 22, chy + 56]);

  // ---- dome landmark
  const landmarks = new THREE.Group();
  group.add(landmarks);
  {
    const D = CITY.dome, [cx, cy] = D.center, [w, d] = D.base;
    addBlock(cx - w / 2, cy - d / 2, cx + w / 2, cy + d / 2, D.top, 'render-cream', { clutterChance: 0 });
    excl.push([cx - w / 2 - 4, cy - d / 2 - 4, cx + w / 2 + 4, cy + d / 2 + 4]);
    const domeMat = ext(new THREE.MeshStandardMaterial({ color: '#3f4a48', roughness: 0.45, metalness: 0.5 }), 1.0);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(D.r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.set(cx, STREET + D.top + 3, cy);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(D.r, D.r, 3, 24), facadeMats['render-cream']);
    drum.position.set(cx, STREET + D.top + 1.5, cy);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 4, 8), domeMat);
    lantern.position.set(cx, STREET + D.top + 3 + D.r + 1.6, cy);
    landmarks.add(dome, drum, lantern);
  }

  // ---- tower crane (bedroom view)
  {
    const C = CITY.crane, [cx, cy] = C.pos;
    const cm = ext(new THREE.MeshStandardMaterial({ color: C.color, roughness: 0.6 }));
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.6, C.mast, 1.6), cm);
    mast.position.set(cx, STREET + C.mast / 2, cy);
    const jib = new THREE.Mesh(new THREE.BoxGeometry(C.jib + 14, 1.4, 1.2), cm);
    const a = THREE.MathUtils.degToRad(C.deg);
    jib.position.set(cx + Math.cos(a) * C.jib * 0.35, STREET + C.mast + 1, cy + Math.sin(a) * C.jib * 0.35);
    jib.rotation.y = -a;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 2.5), cm);
    cab.position.set(cx, STREET + C.mast + 2.6, cy);
    landmarks.add(mast, jib, cab);
  }

  const inExcl = (x0, y0, x1, y1) => excl.some(([a, b, c, d]) => x1 > a && x0 < c && y1 > b && y0 < d);
  const pickStyle = () => {
    const r = rand();
    return r < 0.24 ? 'render-white' : r < 0.38 ? 'render-cream' : r < 0.52 ? 'render-grey' : r < 0.72 ? 'brick' : r < 0.82 ? 'brick-dark' : r < 0.93 ? 'office-grid' : 'glass';
  };

  // ---- continuous street walls along both sides of the Frankrijklei
  {
    const F = CITY.frontage;
    const [sy0f, sy1f] = CITY.street.y;
    for (const [ya, yb] of [[sy0f - F.depth, sy0f], [sy1f + 2, sy1f + 2 + F.depth]]) {
      for (let x = -CITY.radius * 0.8; x < CITY.radius * 0.8;) {
        const w = F.width[0] + rand() * (F.width[1] - F.width[0]);
        const d = F.depth * (0.75 + rand() * 0.25);
        const y0 = ya === sy0f - F.depth ? sy0f - d : ya, y1 = ya === sy0f - F.depth ? sy0f : ya + d;
        if (!inExcl(x, y0, x + w, y1)) {
          const top = rand() < F.tall ? F.top[1] + rand() * 10 : F.top[0] + rand() * (F.top[1] - F.top[0]);
          addBlock(x, y0, x + w, y1, top, pickStyle());
          excl.push([x, y0, x + w, y1]);
        }
        x += w + (rand() < 0.08 ? 12 : 0.2);      // the odd side street
      }
    }
  }

  mergeStatic(landmarks, { name: 'landmarks-merged' });

  // ---- procedural skyline (jittered grid)
  const R = CITY.radius, cell = CITY.cell;
  const [sy0, sy1] = CITY.street.y;
  for (let gx = -R; gx < R; gx += cell) {
    for (let gy = -R; gy < R; gy += cell) {
      const cx = gx + cell / 2, cy = gy + cell / 2;
      const dist = Math.hypot(cx - 4, cy - 12);
      if (dist > R) continue;
      // boulevard (and a narrower side street grid every ~5 cells)
      if (cy + cell / 2 > sy0 - 4 && cy - cell / 2 < sy1 + 2) continue;
      const parts = rand() < 0.5 ? 1 : 2;
      for (let k = 0; k < parts; k++) {
        const w = parts === 1 ? cell * (0.55 + rand() * 0.35) : cell * (0.3 + rand() * 0.18);
        const d = cell * (0.45 + rand() * 0.45);
        const x0 = gx + 2 + (parts === 1 ? rand() * (cell - 4 - w) : k * cell / 2 + rand() * (cell / 2 - 2 - w));
        const y0 = gy + 2 + rand() * (cell - 4 - d);
        if (inExcl(x0, y0, x0 + w, y0 + d)) continue;
        const r = rand();
        let top = r < 0.62 ? 14 + rand() * 8 : r < 0.93 ? 22 + rand() * 6 : r < 0.99 ? 28 + rand() * 12 : 45 + rand() * 25;
        if (dist < 60) top = Math.min(top, 24);
        // keep the sky behind the church spires clear (sunset view)
        const bearing = THREE.MathUtils.radToDeg(Math.atan2(x0 + w / 2 - 4, -(y0 + d / 2 - 12)));
        if (Math.abs(((bearing - 201 + 540) % 360) - 180) < 14) top = Math.min(top, 24);
        addBlock(x0, y0, x0 + w, y0 + d, top, pickStyle());
      }
    }
  }

  // ---- merge into a few meshes (no shadows: the sun's shadow map only covers the flat)
  const addMerged = (geos, mat, name) => {
    if (!geos.length) return null;
    const m = new THREE.Mesh(mergeGeometries(geos.map(nonIdx)), mat);
    m.name = name; m.castShadow = false; m.receiveShadow = false;
    group.add(m);
    return m;
  };
  for (const s of styles) addMerged(buckets[s], facadeMats[s], `facades-${s}`);
  addMerged(roofs, roofMat, 'roofs');
  addMerged(clutter, clutterMat, 'roof-clutter');
  addMerged(copings, copingMat, 'copings');

  // ---- ground, boulevard, trees
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2 * R + 400, 2 * R + 400).rotateX(-Math.PI / 2), ext(new THREE.MeshStandardMaterial({ color: '#5d5e5c', roughness: 1 }), 0.5));
  ground.position.set(4, STREET - 0.05, 12);
  group.add(ground);
  const width = sy1 - sy0;
  const road = roadTexture(width);
  const rmap = road.map.clone(); rmap.repeat.set(1 / road.size[0], 1 / road.size[1]); rmap.needsUpdate = true;
  const roadGeo = new THREE.PlaneGeometry(2 * R, width).rotateX(-Math.PI / 2);
  const ruv = roadGeo.attributes.uv, rpos = roadGeo.attributes.position;
  for (let i = 0; i < rpos.count; i++) ruv.setXY(i, rpos.getX(i), (rpos.getZ(i) + width / 2));
  const roadMesh = new THREE.Mesh(roadGeo, ext(new THREE.MeshStandardMaterial({ map: rmap, roughness: 0.9 }), 0.5));
  roadMesh.position.set(4, STREET + 0.02, (sy0 + sy1) / 2);
  group.add(roadMesh);
  group.add(boulevardTrees());

  // ---- outside the bedroom window: brick parapet with concrete coping and a galvanised roof ladder
  const bv = bedroomView();
  group.add(bv);
  mergeStatic(bv, { name: 'bedroom-view-merged' });

  const glowMats = new Set();
  group.traverse((o) => { if (o.isMesh && o.material.userData.glow !== undefined) glowMats.add(o.material); });
  return {
    group,
    setNight(n) {
      const k = THREE.MathUtils.smoothstep(n, 0.15, 0.85);
      for (const m of glowMats) m.emissiveIntensity = k * m.userData.glow;
    },
  };
}

// Plane trees along the Frankrijklei: instanced trunks + clustered crowns.
function boulevardTrees() {
  const T = CITY.trees;
  const rand = mulberry32(91);
  const g = new THREE.Group();
  const spots = [];
  const [chx] = CITY.church.facade;
  for (const row of T.rows) for (let x = T.x[0]; x <= T.x[1]; x += T.spacing) {
    if (row > 40 && Math.abs(x - chx) < 22) continue;     // keep the church forecourt view open
    spots.push([x + (rand() - 0.5) * 2, row + (rand() - 0.5) * 0.6]);
  }
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.3, 1, 6).translate(0, 0.5, 0);
  const crownParts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    crownParts.push(new THREE.IcosahedronGeometry(1, 0).scale(0.55, 0.5, 0.55).translate(Math.cos(a) * 0.4, 0.05 + (i % 2) * 0.14, Math.sin(a) * 0.4));
  }
  crownParts.push(new THREE.IcosahedronGeometry(1, 0).scale(0.6, 0.55, 0.6).translate(0, 0.38, 0));
  const crownGeo = mergeGeometries(crownParts);
  const trunkMat = ext(new THREE.MeshStandardMaterial({ color: '#6f6556', roughness: 0.9 }), 0.5);
  const crownMat = ext(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, flatShading: true }), 0.5);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, spots.length);
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, spots.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), c = new THREE.Color();
  spots.forEach(([x, y], i) => {
    const h = 11 + rand() * 4, trunkH = h * 0.4, cr = 3.4 + rand() * 1.4;
    m.compose(new THREE.Vector3(x, STREET, y), q.identity(), s.set(1, trunkH, 1));
    trunks.setMatrixAt(i, m);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * 6.28);
    m.compose(new THREE.Vector3(x, STREET + trunkH + cr * 0.8, y), q, s.set(cr, cr * (0.85 + rand() * 0.25), cr));
    crowns.setMatrixAt(i, m);
    crowns.setColorAt(i, c.set('#55683f').multiplyScalar(0.8 + rand() * 0.35));
  });
  for (const im of [trunks, crowns]) { im.castShadow = false; im.receiveShadow = false; g.add(im); }
  return g;
}

function bedroomView() {
  const g = new THREE.Group();
  const P = CITY.bedroomParapet, L = CITY.roofLadder;
  const b = churchBrick({ bands: false });
  const bm = b.map.clone(); bm.repeat.set(1 / b.size[0], 1 / b.size[1]); bm.needsUpdate = true;
  const brick = ext(new THREE.MeshStandardMaterial({ map: bm, color: '#ffd8c8', roughness: 0.9 }));
  const conc = ext(new THREE.MeshStandardMaterial({ color: '#a6a7a3', roughness: 0.9 }));
  const [x0, x1] = P.x, [y0, y1] = P.y;
  g.add(new THREE.Mesh(boxGeo(x0, y0, x1, y1, -0.35, P.top), brick));
  g.add(new THREE.Mesh(boxGeo(x0 - 0.05, y0, x1 + 0.08, y1, P.top, P.top + 0.1), conc));
  // the parapet's outer face continues down the lower neighbour's wall
  g.add(new THREE.Mesh(boxGeo(x0 - 0.02, y0, x0, y1, STREET + 16, -0.35), brick));
  // galvanised fixed ladder in front of the bedroom window (rails, rungs, wall brackets)
  const zinc = ext(new THREE.MeshStandardMaterial({ color: '#80878a', roughness: 0.62, metalness: 0.45 }), 0.6);
  const [h0, h1] = L.h, [ya, yb] = L.y;
  for (const y of [ya, yb]) g.add(new THREE.Mesh(boxGeo(L.x - 0.03, y - 0.008, L.x + 0.03, y + 0.008, h0, h1), zinc));
  for (let h = h0 + 0.3; h < h1 - 0.1; h += 0.28) {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, yb - ya, 8).rotateX(Math.PI / 2).translate(L.x, h, (ya + yb) / 2), zinc));
  }
  for (const h of [0.2, 1.45, 2.7]) for (const y of [ya, yb]) {
    g.add(new THREE.Mesh(boxGeo(L.x, y - 0.025, -0.30, y + 0.025, h, h + 0.04), zinc));
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// Windows, doors, sliding terrace door and the oak step platform.
import * as THREE from 'three';
import { mergeStatic } from '../util/merge.js';
import { WALLS, WINDOWS, DOORS, SLIDING_DOOR, PLATFORM } from '../apartment.config.js';
import { roundedBox, planRoundedBox, mesh } from '../util/geometry.js';
import { getMaterials } from './materials.js';
import { wallAxis, findOpening } from './shell.js';

const wallById = (id) => WALLS.find((w) => w.id === id);

// Local frame for an opening: origin on one wall face at the opening start,
// +X along the wall, +Y up, +Z across the wall toward `inward` ('+x','-x','+y','-y').
// Returns { group, W, t, originAt } where originAt says which plan end ('from'|'to') is local X = 0.
function openingFrame(wall, o, inward) {
  const [x0, y0, x1, y1] = wall.rect;
  const axis = wallAxis(wall);
  const g = new THREE.Group();
  let originAt = 'from';
  if (axis === 'x') {
    if (inward === '+y') { g.position.set(o.from, 0, y0); g.rotation.y = 0; }
    else { g.position.set(o.to, 0, y1); g.rotation.y = Math.PI; originAt = 'to'; }
  } else {
    if (inward === '+x') { g.position.set(x0, 0, o.to); g.rotation.y = Math.PI / 2; originAt = 'to'; }
    else { g.position.set(x1, 0, o.from); g.rotation.y = -Math.PI / 2; }
  }
  const t = axis === 'x' ? y1 - y0 : x1 - x0;
  return { group: g, W: o.to - o.from, t, originAt };
}

const INWARD = { n: '+y', s: '-y', w: '+x', e: '-x' };

// Box in an opening's local frame: X [a0,a1], Y [b0,b1], Z [c0,c1].
function lbox(a0, a1, b0, b1, c0, c1, mat, r = 0.004, opts) {
  const g = roundedBox(a1 - a0, b1 - b0, c1 - c0, r, 2);
  g.translate((a0 + a1) / 2, (b0 + b1) / 2, (c0 + c1) / 2);
  return mesh(g, mat, opts);
}

function glassPane(a0, a1, b0, b1, z, M) {
  const g = new THREE.PlaneGeometry(a1 - a0, b1 - b0);
  g.translate((a0 + a1) / 2, (b0 + b1) / 2, z);
  const m = new THREE.Mesh(g, M.glass);
  m.renderOrder = 2;
  m.name = 'glass';
  return m;
}

// PVC window handle (base plate + downward lever) on the inner face.
function windowHandle(x, y, z, M) {
  const h = new THREE.Group();
  h.add(lbox(-0.016, 0.016, -0.04, 0.04, 0, 0.012, M.pvc, 0.004, { cast: false }));
  h.add(lbox(-0.008, 0.008, -0.13, 0.01, 0.012, 0.03, M.pvc, 0.006, { cast: false }));
  h.position.set(x, y, z);
  return h;
}

// ---------------------------------------------------------------- windows
function buildWindow(spec, M) {
  const wall = wallById(spec.wall);
  const { opening: o } = findOpening(spec.id);
  const { group, W, t } = openingFrame(wall, o, INWARD[wall.outside]);
  group.name = spec.id;
  const b = o.bottom, top = o.top;
  const zf = spec.frameInset;          // frame centre depth from the outer face
  const f = 0.068, fd = 0.07;          // frame face width & depth
  const z0 = zf - fd / 2, z1 = zf + fd / 2;
  // Outer frame
  group.add(lbox(0, f, b, top, z0, z1, M.pvc));
  group.add(lbox(W - f, W, b, top, z0, z1, M.pvc));
  group.add(lbox(f, W - f, b, b + f, z0, z1, M.pvc));
  group.add(lbox(f, W - f, top - f, top, z0, z1, M.pvc));
  // Optional fixed lower panel with transom.
  let sb = b + f;
  if (spec.lowerPanel) {
    const ty = b + spec.lowerPanel;
    group.add(lbox(f, W - f, ty - 0.035, ty + 0.035, z0, z1, M.pvc));
    group.add(glassPane(f, W - f, b + f, ty - 0.035, zf, M));
    sb = ty + 0.035;
  }
  // Sash (sits slightly proud on the inside).
  const s = 0.072, sz0 = zf - 0.02, sz1 = zf + 0.055;
  const sx0 = f - 0.012, sx1 = W - f + 0.012, sy0 = sb - 0.012, sy1 = top - f + 0.012;
  group.add(lbox(sx0, sx0 + s, sy0, sy1, sz0, sz1, M.pvc));
  group.add(lbox(sx1 - s, sx1, sy0, sy1, sz0, sz1, M.pvc));
  group.add(lbox(sx0 + s, sx1 - s, sy0, sy0 + s, sz0, sz1, M.pvc));
  group.add(lbox(sx0 + s, sx1 - s, sy1 - s, sy1, sz0, sz1, M.pvc));
  // Thin black gasket around the glass, then the pane.
  const gk = 0.005, gz0 = zf + 0.018, gz1 = zf + 0.022;
  group.add(lbox(sx0 + s - gk, sx1 - s + gk, sy0 + s - gk, sy0 + s, gz0, gz1, M.gasket, 0.0005, { cast: false }));
  group.add(lbox(sx0 + s - gk, sx1 - s + gk, sy1 - s, sy1 - s + gk, gz0, gz1, M.gasket, 0.0005, { cast: false }));
  group.add(lbox(sx0 + s - gk, sx0 + s, sy0 + s, sy1 - s, gz0, gz1, M.gasket, 0.0005, { cast: false }));
  group.add(lbox(sx1 - s, sx1 - s + gk, sy0 + s, sy1 - s, gz0, gz1, M.gasket, 0.0005, { cast: false }));
  group.add(glassPane(sx0 + s, sx1 - s, sy0 + s, sy1 - s, zf + 0.018, M));
  // Handle on the opening side of the sash.
  const hx = spec.handle === 'left' ? sx0 + s / 2 : sx1 - s / 2;
  group.add(windowHandle(hx, (sy0 + sy1) / 2, sz1, M));
  // Inner sill board (overhangs the wall face and the reveal a little). Its top sits 4 mm above the
  // opening's bottom so it doesn't z-fight with the wall below; the overlap hides in the frame.
  const sillMat = spec.innerSill === 'bluestone' ? M.bluestone : M.whitePaint;
  const sillT = spec.innerSill === 'bluestone' ? 0.03 : 0.022;
  group.add(lbox(-0.03, W + 0.03, b - sillT + 0.004, b + 0.004, z1 - 0.005, t + 0.03, sillMat, 0.003));
  // Exterior sill (aluminium grey) with a drip edge.
  group.add(lbox(-0.02, W + 0.02, b - 0.035, b - 0.005, -0.045, z0, M.coping, 0.003));
  // Roller blind (W-living): black cassette + a hand of fabric + beaded chain.
  if (spec.blind) {
    const cz0 = sz1 + 0.012, cz1 = cz0 + 0.075;
    group.add(lbox(0.0, W, top - 0.075, top, cz0, cz1, M.blind, 0.01));
    group.add(lbox(0.01, W - 0.01, top - 0.16, top - 0.075, cz0 + 0.03, cz0 + 0.035, M.blind, 0.001));
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, top - 1.05, 5), M.blind);
    chain.position.set(W - 0.03, (top + 1.05) / 2, cz1 - 0.01);
    group.add(chain);
    const weight = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), M.satinSteel);
    weight.position.set(W - 0.03, 1.04, cz1 - 0.01);
    group.add(weight);
  }
  return group;
}

// ---------------------------------------------------------------- hinged doors
// Leaf yaw from opening angle; the leaf pivots on the hinge edge toward +Z.
function hingedLeaf(spec, W, t, originAt, M, collision, group) {
  const hingeLocalX = (spec.hinge === originAt) ? 0 : W;
  const jamb = spec.type === 'front' ? 0.04 : 0.024;
  const { w: lw, h: lh, t: lt } = spec.leaf;
  const pivot = new THREE.Group();
  pivot.userData.dynamic = true;
  const leafZ = t - lt / 2 - (spec.type === 'front' ? 0.012 : 0.004);
  pivot.position.set(hingeLocalX === 0 ? jamb + 0.003 : W - jamb - 0.003, 0, leafZ + lt / 2);
  const dir = hingeLocalX === 0 ? 1 : -1;       // leaf extends +X or -X from the pivot
  const leafGroup = new THREE.Group();
  const leafMat = spec.type === 'front' ? M.frontDoor : M.veneer;
  const leaf = mesh(roundedBox(lw, lh, lt, spec.type === 'front' ? 0.006 : 0.003, 2), leafMat, { name: `${spec.id}-leaf` });
  leaf.position.set(dir * lw / 2, 0.008 + lh / 2, -lt / 2);
  leafGroup.add(leaf);
  // Hardware: lever handles on both faces near the free edge.
  const hx = dir * (lw - 0.065);
  const hw = spec.type === 'front' ? M.satinSteel : M.blackSteel;
  for (const side of [1, -1]) {
    const zFace = side > 0 ? 0 : -lt;
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.009, 24), hw);
    rose.rotation.x = Math.PI / 2;
    rose.position.set(hx, 1.05, zFace + side * 0.0045);
    leafGroup.add(rose);
    const lever = mesh(roundedBox(0.135, 0.019, 0.019, 0.008, 2), hw, { cast: true });
    lever.position.set(hx - dir * 0.055, 1.05, zFace + side * 0.05);
    leafGroup.add(lever);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 12), hw);
    neck.rotation.x = Math.PI / 2;
    neck.position.set(hx, 1.05, zFace + side * 0.03);
    leafGroup.add(neck);
    // Cylinder / key rose below the handle
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(spec.type === 'front' ? 0.024 : 0.02, spec.type === 'front' ? 0.024 : 0.02, 0.008, 24), hw);
    cyl.rotation.x = Math.PI / 2;
    cyl.position.set(hx, spec.type === 'front' ? 0.93 : 0.97, zFace + side * 0.004);
    leafGroup.add(cyl);
  }
  if (spec.type === 'front') {
    const peep = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, lt + 0.006, 16), M.chrome);
    peep.rotation.x = Math.PI / 2;
    peep.position.set(dir * lw / 2, 1.55, -lt / 2);
    leafGroup.add(peep);
  }
  // Hinges on the swing side (visible when standing on that side).
  const hingeMat = spec.type === 'front' ? M.whitePaint : M.blackSteel;
  for (const hy of spec.type === 'front' ? [0.2, 1.05, 1.9] : [0.2, 1.9]) {
    const hg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.10, 12), hingeMat);
    hg.position.set(0, hy, 0.004);
    leafGroup.add(hg);
  }
  leaf.userData.noMerge = true;
  mergeStatic(leafGroup, { name: `${spec.id}-leaf-merged` });
  pivot.add(leafGroup);
  const setAngle = (deg) => { leafGroup.rotation.y = -dir * THREE.MathUtils.degToRad(deg); };
  setAngle(spec.openDeg);
  group.add(pivot);
  // Dynamic collider follows the leaf.
  collision.addDynamicBox(leaf, [lw, lh, lt]);
  return { pivot, leafGroup, setAngle, spec };
}

function buildDoor(spec, M, collision) {
  const wall = wallById(spec.wall);
  const { opening: o } = findOpening(spec.id);
  const { group, W, t, originAt } = openingFrame(wall, o, spec.swing);
  group.name = spec.id;
  const top = o.top;
  if (spec.type === 'interior') {
    // Slim black steel frame wrapping the jambs and head, a few mm proud of both faces.
    const j = 0.024, p = 0.006;
    group.add(lbox(0, j, 0, top, -p, t + p, M.blackSteel, 0.002));
    group.add(lbox(W - j, W, 0, top, -p, t + p, M.blackSteel, 0.002));
    group.add(lbox(0, W, top - j, top, -p, t + p, M.blackSteel, 0.002));
    // Door stop rebate (thin strip on the closing side).
    group.add(lbox(j, j + 0.012, 0, top - j, t - 0.05, t - 0.044, M.blackSteel, 0.001, { cast: false }));
    group.add(lbox(W - j - 0.012, W - j, 0, top - j, t - 0.05, t - 0.044, M.blackSteel, 0.001, { cast: false }));
  } else {
    // Front door: white lining + architrave on the living-room side.
    const j = 0.04, a = spec.architrave;
    group.add(lbox(0, j, 0, top, 0, t, M.whitePaint, 0.002));
    group.add(lbox(W - j, W, 0, top, 0, t, M.whitePaint, 0.002));
    group.add(lbox(0, W, top - j, top, 0, t, M.whitePaint, 0.002));
    group.add(lbox(-a + 0.0, 0.004, 0, top + a, t, t + 0.016, M.whitePaint, 0.004));
    group.add(lbox(W - 0.004, W + a, 0, top + a, t, t + 0.016, M.whitePaint, 0.004));
    group.add(lbox(-a, W + a, top - 0.004, top + a, t, t + 0.016, M.whitePaint, 0.004));
    // Threshold
    group.add(lbox(0, W, 0, 0.012, 0, t, M.bluestone, 0.002, { cast: false }));
  }
  const ctrl = hingedLeaf(spec, W, t, originAt, M, collision, group);
  return { group, ctrl };
}

// ---------------------------------------------------------------- lift-and-slide terrace door
function buildSlidingDoor(M, collision) {
  const S = SLIDING_DOOR;
  const wall = wallById(S.wall);
  const { opening: o } = findOpening(S.opening);
  const { group, W } = openingFrame(wall, o, INWARD[wall.outside]);
  group.name = 'sliding-door';
  const b = o.bottom, top = o.top, f = S.frame;
  const zc = S.frameInset, fd = 0.16;
  const z0 = zc - fd / 2, z1 = zc + fd / 2;
  group.add(lbox(0, f, b, top, z0, z1, M.pvc));
  group.add(lbox(W - f, W, b, top, z0, z1, M.pvc));
  group.add(lbox(f, W - f, top - f, top, z0, z1, M.pvc));
  group.add(lbox(f, W - f, b, b + 0.035, z0, z1, M.satinSteel, 0.003));   // low aluminium threshold
  const leafW = (W - 2 * f) / 2 + 0.04;
  const leafH = top - f - (b + 0.035) - 0.01;
  const st = S.stile;
  const makeLeaf = (zCentre, withHandle) => {
    const g = new THREE.Group();
    const d = 0.068;
    g.add(lbox(0, st, 0, leafH, -d / 2, d / 2, M.pvc));
    g.add(lbox(leafW - st, leafW, 0, leafH, -d / 2, d / 2, M.pvc));
    g.add(lbox(st, leafW - st, 0, st + 0.03, -d / 2, d / 2, M.pvc));
    g.add(lbox(st, leafW - st, leafH - st, leafH, -d / 2, d / 2, M.pvc));
    g.add(glassPane(st, leafW - st, st + 0.03, leafH - st, 0, M));
    if (withHandle) {
      const h = new THREE.Group();
      h.add(lbox(-0.018, 0.018, -0.09, 0.09, 0, 0.014, M.pvc, 0.005, { cast: false }));
      h.add(lbox(-0.011, 0.011, -0.18, 0.02, 0.014, 0.036, M.pvc, 0.008, { cast: false }));
      h.position.set(st / 2, 1.05, d / 2);
      g.add(h);
    }
    g.position.set(0, b + 0.035 + 0.005, zCentre);
    return g;
  };
  // Fixed leaf (outer track) on the west half = local +X side; sliding leaf (inner track) on the east half.
  const fixed = makeLeaf(zc - 0.04, false);
  fixed.userData.dynamic = true;
  fixed.position.x = W - f - leafW;
  group.add(fixed);
  const sliding = makeLeaf(zc + 0.04, true);
  sliding.userData.dynamic = true;
  const closedX = f, openX = f + (leafW - 0.06) * S.openFraction;
  sliding.position.x = openX;
  group.add(sliding);
  // Colliders for the leaves (thin full-height slabs).
  mergeStatic(fixed, { name: 'slide-fixed-merged' });
  mergeStatic(sliding, { name: 'slide-sliding-merged' });
  collision.addDynamicBox(fixed, [leafW, leafH, 0.07], [leafW / 2, leafH / 2, 0]);
  collision.addDynamicBox(sliding, [leafW, leafH, 0.07], [leafW / 2, leafH / 2, 0]);
  const setOpen = (fraction) => { sliding.position.x = closedX + (openX - closedX) * (fraction / S.openFraction); };
  return { group, ctrl: { sliding, setOpen, closedX, openX } };
}

// ---------------------------------------------------------------- oak step platform
function buildPlatform(M, collision) {
  const g = new THREE.Group();
  g.name = 'oak-platform';
  const [x0, x1] = PLATFORM.x;
  const r = 0.008;
  const up = PLATFORM.upper, lo = PLATFORM.lower;
  const uv = { rotateTop: true, rotateSides: true };
  g.add(mesh(planRoundedBox(x0, up.y[0], x1, up.y[1], 0, up.top, r, uv), M.oakPlatform));
  g.add(mesh(planRoundedBox(x0, lo.y[0], x1, lo.y[1], 0, lo.top, r, uv), M.oakPlatform));
  collision.addBox(x0, up.y[0], x1, up.y[1], 0, up.top);
  collision.addBox(x0, lo.y[0], x1, lo.y[1], 0, lo.top);
  return g;
}

export function buildOpenings(collision) {
  const M = getMaterials();
  const group = new THREE.Group();
  group.name = 'openings';
  for (const w of WINDOWS) group.add(buildWindow(w, M));
  const doors = {};
  for (const d of DOORS) {
    const { group: dg, ctrl } = buildDoor(d, M, collision);
    group.add(dg);
    doors[d.id] = ctrl;
  }
  const sliding = buildSlidingDoor(M, collision);
  group.add(sliding.group);
  doors['D-slide'] = sliding.ctrl;
  group.add(buildPlatform(M, collision));
  return { group, doors };
}

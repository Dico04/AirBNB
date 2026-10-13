// Living room + entrance: velvet sectional, Noguchi-style table, cane sideboard with TV & lamp,
// portrait, olive tree on mushroom stool, basket, straw wall hanging, hooks, intercom, cactus stool.
import * as THREE from 'three';
import { FURNITURE } from '../apartment.config.js';
import { mats, lathe, rbox, pillow, mesh, tube } from './kit.js';
import { oliveTree, euphorbia } from './plants.js';
import * as PT from '../textures/props.js';
import { applyWorldUV } from '../util/geometry.js';

const L = FURNITURE.living;
const E = FURNITURE.entrance;

function at(obj, x, h, y) { obj.position.set(x, h, y); return obj; }

// ---------------------------------------------------------------- velvet L-sectional with chaise
// Padded back and arm (soft pillow geometry, piped top edges), plump seat and back cushions.
function sofa(collision) {
  const S = L.sofa;
  const g = new THREE.Group();
  const velvet = mats.velvet(S.color);
  const piping = mats.velvet(S.piping, '#6a5c56');
  const [x0, x1] = S.x, yb = S.backY, yf = yb + S.depth;
  const [cx0, cx1] = S.chaiseX, ce = S.chaiseEndY;
  const base0 = 0.03, base1 = 0.28, backT = 0.22;
  const ax0 = x1 - S.armW;
  const box = (ax, ay, bx, by, h0, h1, r) => at(mesh(rbox(bx - ax, h1 - h0, by - ay, r, 4), velvet), (ax + bx) / 2, (h0 + h1) / 2, (ay + by) / 2);
  const pipe = (pts) => g.add(mesh(tube(pts, 0.0055, 6), piping));
  // upholstered plinth under the seats
  g.add(box(x0, yb, x1, yf, base0, base1, 0.03));
  g.add(box(cx0, yf - 0.02, cx1, ce, base0, base1, 0.03));
  // padded back + east arm: generously rounded boxes, piping sitting on the rounded top edges
  const R = 0.07, pin = R * (1 - Math.SQRT1_2) + 0.002;
  const bl = ax0 - x0 + 0.04;
  g.add(box(x0, yb, x0 + bl, yb + backT, base0, S.backH, R));
  for (const py of [yb + pin, yb + backT - pin]) pipe([[x0 + R, S.backH - pin, py], [ax0 - 0.01, S.backH - pin, py]]);
  g.add(box(ax0, yb, x1, yf, base0, S.armH, R));
  for (const ex of [ax0 + pin, x1 - pin]) pipe([[ex, S.armH - pin, yb + R], [ex, S.armH - pin, yf - R]]);
  // dark feet (barely visible)
  for (const [fx, fy] of [[x0 + 0.06, yb + 0.06], [x1 - 0.06, yb + 0.06], [x1 - 0.06, yf - 0.06], [cx0 + 0.06, ce - 0.06], [cx1 - 0.06, ce - 0.06]]) {
    g.add(at(mesh(new THREE.CylinderGeometry(0.02, 0.016, base0, 10), mats.black()), fx, base0 / 2, fy));
  }
  // plump seat cushions reaching the front edge
  const seatH0 = base1 - 0.01, seatH1 = S.seatH + 0.02;
  let seed = 1;
  const seat = (sx0, sy0, sx1, sy1) => {
    const m = mesh(pillow(sx1 - sx0, seatH1 - seatH0, sy1 - sy0, { puff: 0.32, flat: 2.5, round: 0.35, seg: 18, wrinkle: 0.6, seed: seed++ }), velvet);
    return at(m, (sx0 + sx1) / 2, (seatH0 + seatH1) / 2, (sy0 + sy1) / 2);
  };
  const mid = (cx1 + ax0) / 2;
  g.add(seat(cx1 + 0.004, yb + backT - 0.01, mid - 0.004, yf + 0.015));
  g.add(seat(mid + 0.004, yb + backT - 0.01, ax0 - 0.004, yf + 0.015));
  g.add(seat(cx0 + 0.004, yb + backT - 0.01, cx1 - 0.004, ce + 0.015));
  // three soft back cushions leaning on the back
  const back = (bx0, bx1) => {
    const m = mesh(pillow(bx1 - bx0 + 0.03, 0.22, 0.47, { puff: 0.55, flat: 2.2, round: 0.45, seg: 18, pinch: 0.05, wrinkle: 0.8, seed: seed++ }), velvet);
    m.geometry.rotateX(Math.PI / 2);          // swell axis (y) → thickness along plan-y, 0.42 → height
    at(m, (bx0 + bx1) / 2, 0.635, yb + backT + 0.08);
    m.rotation.x = -0.17;
    return m;
  };
  const bw = (ax0 - 0.01 - (x0 + 0.01)) / 3;
  for (let i = 0; i < 3; i++) g.add(back(x0 + 0.01 + i * bw, x0 + 0.01 + (i + 1) * bw));
  collision.addBox(x0, yb, x1, yf, 0, S.backH);
  collision.addBox(cx0, yf, cx1, ce, 0, S.seatH);
  // macramé cushion leaning on the chaise back
  const mc = macrameCushion();
  mc.position.set((cx0 + cx1) / 2 + 0.12, 0.64, yb + backT + 0.2);
  mc.rotation.set(-0.38, 0.25, 0.05);
  g.add(mc);
  return g;
}

function macrameCushion() {
  const g = new THREE.Group();
  const core = mesh(pillow(0.44, 0.12, 0.44, { puff: 0.6, seg: 12, flat: 2.5, pinch: 0.04 }), mats.linen('#e7dfd2'));
  core.geometry.rotateX(Math.PI / 2);
  g.add(core);
  const face = mesh(new THREE.PlaneGeometry(0.44, 0.44), mats.macrame(), { cast: false });
  face.position.z = 0.064;
  g.add(face);
  // fringe along the bottom and one side
  const cord = mats.linen('#efe8dc');
  const strands = [];
  for (let i = 0; i < 26; i++) {
    const x = -0.21 + i * 0.0168;
    strands.push(new THREE.CylinderGeometry(0.0022, 0.0018, 0.07, 4).translate(x, -0.255, 0.04).toNonIndexed());
  }
  for (let i = 0; i < 18; i++) {
    const y = -0.2 + i * 0.023;
    strands.push(new THREE.CylinderGeometry(0.0022, 0.0018, 0.06, 4).rotateZ(Math.PI / 2 + 0.2).translate(0.25, y, 0.04).toNonIndexed());
  }
  const fringe = mesh(mergeG(strands), cord);
  g.add(fringe);
  return g;
}

function mergeG(list) {
  // light-weight merge for small batches of non-indexed geometries with identical attributes
  const pos = [], nor = [], uv = [];
  for (const gg of list) {
    pos.push(...gg.attributes.position.array); nor.push(...gg.attributes.normal.array);
    uv.push(...(gg.attributes.uv ? gg.attributes.uv.array : new Float32Array(gg.attributes.position.count * 2)));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return out;
}

// ---------------------------------------------------------------- Noguchi-style coffee table
function coffeeTable(collision) {
  const T = L.coffeeTable;
  const g = new THREE.Group();
  const [W, D] = T.size;
  // rounded-triangle glass top (smooth curve through three lobes)
  const pts = [[-0.62 * W / 1.27, -0.36], [0.64 * W / 1.27, -0.10], [-0.06, 0.46]].map(([x, y]) => new THREE.Vector2(x, y * D / 0.92));
  const shape = new THREE.Shape();
  const corner = (i) => pts[(i + 3) % 3];
  const r = 0.22;
  for (let i = 0; i < 3; i++) {
    const p0 = corner(i), p1 = corner(i + 1), p2 = corner(i + 2);
    const a = p0.clone().lerp(p1, 1 - r / p0.distanceTo(p1) * 1.6);
    const b = p1.clone().lerp(p2, r / p1.distanceTo(p2) * 1.6);
    if (i === 0) shape.moveTo(a.x, a.y); else shape.lineTo(a.x, a.y);
    shape.quadraticCurveTo(p1.x, p1.y, b.x, b.y);
  }
  shape.closePath();
  const tg = new THREE.ExtrudeGeometry(shape, { depth: 0.019, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2, curveSegments: 24 });
  tg.rotateX(-Math.PI / 2);
  const glassTop = new THREE.MeshPhysicalMaterial({ color: '#e4efec', roughness: 0.03, transparent: true, opacity: 0.22, depthWrite: false, envMapIntensity: 1.3 });
  const glassEdge = new THREE.MeshPhysicalMaterial({ color: '#9fc7b9', roughness: 0.08, transparent: true, opacity: 0.8 });
  const top = new THREE.Mesh(tg, [glassTop, glassEdge]);
  top.renderOrder = 3;
  top.position.y = T.top - 0.022;
  g.add(top);
  // two interlocking curved base pieces
  const wood = mats.wood('noguchi', { base: T.wood, dark: '#8a5028', light: '#d08a52', sizeM: [0.6, 0.2], ring: 12 });
  const prof = new THREE.Shape();
  prof.moveTo(-0.42, 0.0);
  prof.lineTo(-0.16, 0.0);
  prof.bezierCurveTo(0.0, 0.02, 0.10, 0.14, 0.24, 0.25);
  prof.bezierCurveTo(0.32, 0.31, 0.38, 0.345, 0.44, 0.376);
  prof.lineTo(0.15, 0.376);
  prof.bezierCurveTo(0.05, 0.37, -0.03, 0.32, -0.12, 0.23);
  prof.bezierCurveTo(-0.22, 0.14, -0.32, 0.115, -0.42, 0.105);
  prof.closePath();
  for (let k = 0; k < 2; k++) {
    const pg = new THREE.ExtrudeGeometry(prof, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 20 });
    pg.translate(0, 0, -0.025);
    applyWorldUV(pg);
    const m = mesh(pg, wood);
    m.rotation.y = k ? Math.PI / 2 + 0.25 : 0.1;
    if (k) m.scale.x = -1;
    g.add(m);
  }
  // tray with candle, brass candlesticks, little bowl
  const trayWood = mats.wood('tray', { base: '#8a5a35', sizeM: [0.4, 0.1], ring: 14 });
  const tray = new THREE.Group();
  tray.add(mesh(rbox(0.40, 0.012, 0.28, 0.003), trayWood));
  for (const [w, d, x, z] of [[0.40, 0.012, 0, -0.134], [0.40, 0.012, 0, 0.134], [0.012, 0.28, -0.194, 0], [0.012, 0.28, 0.194, 0]]) {
    tray.add(at(mesh(rbox(w, 0.035, d, 0.003), trayWood), x, 0.018, z));
  }
  const brass = mats.metal('#c9a44c', 0.28);
  const stick = lathe([[0.001, 0], [0.033, 0.002], [0.034, 0.012], [0.012, 0.03], [0.016, 0.05], [0.009, 0.07], [0.011, 0.12], [0.008, 0.15], [0.015, 0.165], [0.016, 0.18], [0.012, 0.19]], 20);
  for (const [x, z, h] of [[0.06, -0.04, 1], [0.13, 0.03, 0.86]]) {
    const s = at(mesh(stick, brass), x, 0.006, z);
    s.scale.setScalar(h);
    tray.add(s);
    tray.add(at(mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.12, 12), mats.paint('#f3efe6', 0.6)), x, 0.006 + 0.18 * h + 0.055, z));
  }
  tray.add(at(mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.13, 24), mats.ceramic('marble-candle', '#e6e1d9', { mottle: 0.12 }, { roughness: 0.7 })), -0.11, 0.071, -0.03));
  tray.add(at(mesh(lathe([[0.001, 0], [0.04, 0.002], [0.062, 0.022], [0.064, 0.026]], 24), mats.ceramic('bowl', '#e9e3da', { mottle: 0.05 })), 0.02, 0.008, 0.07));
  tray.position.set(-0.05, T.top + 0.003, 0.02);
  tray.rotation.y = 0.35;
  g.add(tray);
  g.position.set(T.center[0], 0, T.center[1]);
  g.rotation.y = THREE.MathUtils.degToRad(T.rotDeg);
  collision.addBox(T.center[0] - 0.55, T.center[1] - 0.38, T.center[0] + 0.55, T.center[1] + 0.38, 0, T.top);
  return g;
}

// ---------------------------------------------------------------- cane sideboard + TV + lamp
function sideboard(collision, lamps) {
  const S = L.sideboard;
  const g = new THREE.Group();
  const oak = mats.wood('sideboard-oak', { base: S.oak, dark: '#9a6c42', light: '#d8a874', sizeM: [1.0, 0.25], ring: 18 });
  const [x0, x1] = S.x, [y0, y1] = S.y, h0 = S.legs, h1 = S.h;
  const W = x1 - x0, D = y1 - y0, H = h1 - h0;
  const body = new THREE.Group();
  const t = 0.02;
  body.add(at(mesh(rbox(W, t, D, 0.004), oak), 0, H - t / 2, 0));
  body.add(at(mesh(rbox(W, t, D, 0.003), oak), 0, t / 2, 0));
  body.add(at(mesh(rbox(t, H, D, 0.003), oak), -W / 2 + t / 2, H / 2, 0));
  body.add(at(mesh(rbox(t, H, D, 0.003), oak), W / 2 - t / 2, H / 2, 0));
  body.add(at(mesh(rbox(W - 2 * t, H - 2 * t, 0.01), mats.paint('#2b2118', 0.9)), 0, H / 2, D / 2 - 0.02));   // dark back
  // two cane doors (front faces -z = north, toward the room)
  const doorW = (W - 2 * t) / 2 - 0.004;
  for (const k of [-1, 1]) {
    const dg = new THREE.Group();
    const fw = 0.032;
    dg.add(at(mesh(rbox(doorW, fw, 0.02, 0.003), oak), 0, (H - 2 * t) / 2 - fw / 2, 0));
    dg.add(at(mesh(rbox(doorW, fw, 0.02, 0.003), oak), 0, -(H - 2 * t) / 2 + fw / 2, 0));
    dg.add(at(mesh(rbox(fw, H - 2 * t, 0.02, 0.003), oak), -doorW / 2 + fw / 2, 0, 0));
    dg.add(at(mesh(rbox(fw, H - 2 * t, 0.02, 0.003), oak), doorW / 2 - fw / 2, 0, 0));
    const cane = mesh(new THREE.PlaneGeometry(doorW - 2 * fw, H - 2 * t - 2 * fw), mats.cane(), { cast: false });
    cane.position.z = -0.004;
    dg.add(cane);
    dg.add(at(mesh(new THREE.PlaneGeometry(doorW - 2 * fw, H - 2 * t - 2 * fw), mats.paint('#3a2c20', 0.95), { cast: false }), 0, 0, 0.02));
    dg.position.set(k * (doorW / 2 + 0.002), H / 2, -D / 2 + 0.012);
    body.add(dg);
  }
  body.position.set((x0 + x1) / 2, h0, (y0 + y1) / 2);
  g.add(body);
  // thin black rod legs
  for (const [lx, ly] of [[x0 + 0.04, y0 + 0.04], [x1 - 0.04, y0 + 0.04], [x0 + 0.04, y1 - 0.04], [x1 - 0.04, y1 - 0.04]]) {
    g.add(at(mesh(new THREE.CylinderGeometry(0.007, 0.007, h0, 8), mats.matteBlack()), lx, h0 / 2, ly));
  }
  g.add(at(mesh(rbox(W - 0.08, 0.008, 0.012, 0.002), mats.matteBlack()), (x0 + x1) / 2, 0.05, y0 + 0.04));
  collision.addBox(x0, y0, x1, y1, 0, h1);

  // TV (older 32", black gloss) on a pedestal stand
  const tv = new THREE.Group();
  const [sw, sh] = L.tv.size;
  const gloss = new THREE.MeshPhysicalMaterial({ color: '#111214', roughness: 0.18, clearcoat: 0.7, clearcoatRoughness: 0.1 });
  gloss.userData.envScale = 0.6;
  tv.add(at(mesh(rbox(sw + 0.04, sh + 0.05, 0.05, 0.008), gloss), 0, 0.09 + (sh + 0.05) / 2, 0));
  const screen = mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshPhysicalMaterial({ color: '#050607', roughness: 0.06, clearcoat: 1 }), { cast: false });
  screen.material.userData.envScale = 0.5;
  screen.position.set(0, 0.09 + (sh + 0.05) / 2 + 0.01, -0.026);
  screen.rotation.y = Math.PI;
  screen.name = 'tv-screen';
  screen.userData.noMerge = true;
  tv.add(screen);
  tv.add(at(mesh(rbox(0.06, 0.08, 0.04, 0.006), gloss), 0, 0.05, 0.01));
  tv.add(at(mesh(rbox(0.30, 0.015, 0.18, 0.006), gloss), 0, 0.008, 0));
  tv.position.set(L.tv.x, h1, (y0 + y1) / 2 + 0.03);
  g.add(tv);
  g.add(at(mesh(rbox(0.11, 0.03, 0.10, 0.008), mats.paint('#141414', 0.5)), L.tv.x - 0.42, h1 + 0.015, (y0 + y1) / 2 - 0.05));

  // Table lamp: rose-terracotta ceramic column, white linen drum shade (glows with the lamp)
  const lamp = new THREE.Group();
  lamp.add(mesh(lathe([[0.001, 0], [0.055, 0.002], [0.06, 0.03], [0.05, 0.12], [0.042, 0.24], [0.03, 0.28], [0.01, 0.3]], 32), mats.ceramic('lamp-terracotta', L.lamp.base, { mottle: 0.08 }, { roughness: 0.8 })));
  const shadeMat = new THREE.MeshStandardMaterial({ color: L.lamp.shade, roughness: 0.95, side: THREE.DoubleSide, map: mats.linen('#ffffff').map });
  const shade = mesh(new THREE.CylinderGeometry(0.105, 0.11, 0.25, 40, 1, true), shadeMat);
  shade.position.y = 0.37;
  lamp.add(shade);
  const bulb = mesh(new THREE.SphereGeometry(0.025, 16, 10), new THREE.MeshStandardMaterial({ color: '#fff6e6', roughness: 0.3 }), { cast: false });
  bulb.position.y = 0.33;
  lamp.add(bulb);
  lamps?.addEmissive('living-lamp', shadeMat, 0.9);
  lamps?.addEmissive('living-lamp', bulb.material, 6);
  lamp.position.set(L.lamp.pos[0], h1, L.lamp.pos[1]);
  lamp.traverse((o) => { if (o.isMesh) o.userData.noMerge = true; });
  g.add(lamp);
  g.add(at(mesh(lathe([[0.001, 0], [0.04, 0.002], [0.05, 0.015]], 20), mats.ceramic('dish2', '#e2d6cb')), L.lamp.pos[0] + 0.12, h1, L.lamp.pos[1] - 0.12));
  return g;
}

// ---------------------------------------------------------------- wavy-framed pencil portrait (south wall)
function portrait() {
  const P = L.portrait;
  const [w, h] = P.size;
  const outer = new THREE.Shape();
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    let x, y;
    // walk the rectangle perimeter with a scalloped offset
    const per = 2 * (w + h), d = t * per;
    if (d < w) { x = -w / 2 + d; y = -h / 2; } else if (d < w + h) { x = w / 2; y = -h / 2 + (d - w); } else if (d < 2 * w + h) { x = w / 2 - (d - w - h); y = h / 2; } else { x = -w / 2; y = h / 2 - (d - 2 * w - h); }
    const wav = 0.006 * Math.sin(t * Math.PI * 2 * 22);
    const nx = Math.abs(x) >= w / 2 - 1e-6 ? Math.sign(x) : 0, ny = Math.abs(y) >= h / 2 - 1e-6 ? Math.sign(y) : 0;
    x += nx * (0.012 + wav); y += ny * (0.012 + wav);
    if (i === 0) outer.moveTo(x, y); else outer.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.moveTo(-w / 2 + 0.03, -h / 2 + 0.03); hole.lineTo(w / 2 - 0.03, -h / 2 + 0.03); hole.lineTo(w / 2 - 0.03, h / 2 - 0.03); hole.lineTo(-w / 2 + 0.03, h / 2 - 0.03);
  outer.holes.push(hole);
  const fg = new THREE.ExtrudeGeometry(outer, { depth: 0.016, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1 });
  applyWorldUV(fg);
  const g = new THREE.Group();
  g.add(mesh(fg, mats.wood('portrait-frame', { base: P.frame, sizeM: [0.3, 0.1], ring: 10 })));
  const art = mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), mats.picture('portrait', PT.pencilPortrait), { cast: false });
  art.position.z = 0.006;
  g.add(art);
  g.rotation.y = Math.PI;            // faces north into the room
  g.position.set(P.x, P.h, 9.05 - 0.004);
  return g;
}

// ---------------------------------------------------------------- olive tree on a teak mushroom stool
function oliveOnStool(collision) {
  const O = L.oliveTree;
  const [x, y] = O.spots[O.spot] || O.spots.kitchen;
  const g = new THREE.Group();
  const teak = mats.wood('mushroom', { base: O.stool, dark: '#6e4a30', light: '#b88a64', sizeM: [0.4, 0.2], ring: 26 });
  g.add(mesh(lathe([[0.001, 0], [0.13, 0.002], [0.14, 0.03], [0.11, 0.12], [0.09, 0.25], [0.1, 0.36], [0.15, 0.41], [0.16, 0.44], [0.15, 0.45], [0.001, 0.452]], 40), teak));
  const pot = mesh(lathe([[0.001, 0.45], [0.11, 0.452], [0.14, 0.5], [0.15, 0.6], [0.145, 0.69], [0.13, 0.7], [0.12, 0.69]], 40), mats.glaze(O.pot));
  g.add(pot);
  g.add(at(mesh(new THREE.CircleGeometry(0.125, 24).rotateX(-Math.PI / 2), mats.paint('#3b2e24', 1)), 0, 0.675, 0));
  const tree = oliveTree({ height: 1.55, seed: 11 });
  tree.position.y = 0.67;
  g.add(tree);
  g.position.set(x, 0, y);
  collision.addBox(x - 0.16, y - 0.16, x + 0.16, y + 0.16, 0, 1.2);
  return g;
}

function basket(collision) {
  const B = L.basket;
  const g = new THREE.Group();
  const outer = mesh(lathe([[0.001, 0], [0.17, 0.002], [0.19, 0.06], [0.2, 0.44]], 40), mats.basket());
  const inner = mesh(lathe([[0.001, 0.02], [0.165, 0.022], [0.185, 0.07], [0.193, 0.44]], 40), new THREE.MeshStandardMaterial({ map: mats.basket().map, color: '#8d7558', roughness: 0.9, side: THREE.BackSide }));
  g.add(outer, inner);
  g.add(at(mesh(new THREE.TorusGeometry(0.197, 0.008, 6, 40).rotateX(Math.PI / 2), mats.basket()), 0, 0.44, 0));
  for (const s of [-1, 1]) {
    const h = mesh(new THREE.TorusGeometry(0.045, 0.006, 6, 16, Math.PI), mats.basket());
    h.position.set(s * 0.2, 0.42, 0);
    h.rotation.y = Math.PI / 2;
    g.add(h);
  }
  // folded throw inside
  const t = mesh(pillow(0.32, 0.18, 0.3, { puff: 0.4 }), mats.linen('#d8cbb6'));
  t.position.y = 0.42; t.rotation.set(0.15, 0.4, 0.1);
  g.add(t);
  g.position.set(B.pos[0], 0, B.pos[1]);
  collision.addBox(B.pos[0] - 0.2, B.pos[1] - 0.2, B.pos[0] + 0.2, B.pos[1] + 0.2, 0, 0.45);
  return g;
}

function strawHanging() {
  const S = E.strawHanging;
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: PT.strawDisc(S.color), alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.85 });
  for (const [r, z] of [[S.diameter / 2, 0.0], [S.diameter / 2 * 0.82, 0.02]]) {
    const m = mesh(new THREE.CircleGeometry(r, 48), mat, { cast: true });
    m.position.z = z;
    m.rotation.z = z * 20;
    g.add(m);
  }
  g.add(at(mesh(new THREE.TorusGeometry(0.05, 0.02, 10, 24), mats.fibres(S.color)), 0, 0, 0.03));
  g.rotation.y = Math.PI / 2;               // faces east
  g.position.set(S.wallX + 0.01, S.h, S.y);
  return g;
}

// ---------------------------------------------------------------- entrance wall details (living side, y = 4.20)
function entrance(collision) {
  const g = new THREE.Group();
  const wy = 4.20;
  // hook rail with 6 hooks
  const R = E.hookRail;
  const black = mats.paint(R.color, 0.5, { metalness: 0.4 });
  g.add(at(mesh(rbox(R.x[1] - R.x[0], 0.026, 0.012, 0.004), black), (R.x[0] + R.x[1]) / 2, R.h, wy + 0.006));
  for (let i = 0; i < R.hooks; i++) {
    const x = R.x[0] + 0.02 + i * ((R.x[1] - R.x[0] - 0.04) / (R.hooks - 1));
    g.add(mesh(tube([[x, R.h + 0.01, wy + 0.01], [x, R.h + 0.0, wy + 0.04], [x, R.h - 0.03, wy + 0.055], [x, R.h - 0.045, wy + 0.04], [x, R.h - 0.035, wy + 0.025]], 0.0035, 6), black));
  }
  const white = mats.paint('#f1f0ee', 0.4);
  // intercom unit, thermostat, double rocker switch
  g.add(at(mesh(rbox(0.08, 0.2, 0.04, 0.008), white), E.intercom.x, E.intercom.h, wy + 0.02));
  g.add(at(mesh(rbox(0.012, 0.06, 0.004, 0.002), mats.paint('#151515', 0.5)), E.intercom.x + 0.01, E.intercom.h + 0.03, wy + 0.041));
  g.add(at(mesh(rbox(0.08, 0.13, 0.03, 0.008), white), E.thermostat.x, E.thermostat.h, wy + 0.015));
  g.add(at(mesh(rbox(0.082, 0.082, 0.01, 0.004), white), E.switch.x, E.switch.h, wy + 0.005));
  for (const dx of [-0.019, 0.019]) g.add(at(mesh(rbox(0.034, 0.06, 0.008, 0.003), mats.paint('#f6f5f3', 0.35)), E.switch.x + dx, E.switch.h, wy + 0.012));
  // rustic teak stool + terracotta pot + euphorbia
  const S = E.stool;
  const teak = mats.wood('teak-stool', { base: S.color, dark: '#7a5236', light: '#c49a74', sizeM: [0.45, 0.25], ring: 20, knots: 1 });
  const stool = new THREE.Group();
  const seat = rbox(S.size[0], 0.045, S.size[1], 0.01, 3);
  const p = seat.attributes.position;
  for (let i = 0; i < p.count; i++) { const vx = p.getX(i) / (S.size[0] / 2); if (p.getY(i) > 0) p.setY(i, p.getY(i) - 0.01 * (1 - vx * vx)); }
  seat.computeVertexNormals();
  stool.add(at(mesh(seat, teak), 0, S.size[2] - 0.022, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = mesh(rbox(0.045, S.size[2] - 0.04, 0.045, 0.008), teak);
    leg.position.set(sx * 0.15, (S.size[2] - 0.04) / 2, sz * 0.07);
    leg.rotation.set(sz * 0.08, 0, -sx * 0.12);
    stool.add(leg);
  }
  stool.add(at(mesh(rbox(0.34, 0.035, 0.03, 0.006), teak), 0, 0.1, 0));
  stool.position.set(S.pos[0], 0, S.pos[1]);
  g.add(stool);
  collision.addBox(S.pos[0] - 0.23, S.pos[1] - 0.13, S.pos[0] + 0.23, S.pos[1] + 0.13, 0, S.size[2]);
  const C = E.cactus;
  const pot = mesh(lathe([[0.001, 0], [C.pot.r * 0.85, 0.002], [C.pot.r, 0.03], [C.pot.r * 1.02, C.pot.h - 0.03], [C.pot.r * 1.08, C.pot.h - 0.025], [C.pot.r * 1.08, C.pot.h], [C.pot.r * 0.98, C.pot.h]], 32), mats.ceramic('cactus-pot', C.pot.color, { mottle: 0.18, speckle: 0.03, rough: 0.92 }));
  pot.position.set(S.pos[0], S.size[2], S.pos[1]);
  g.add(pot);
  g.add(at(mesh(new THREE.CircleGeometry(C.pot.r * 0.95, 20).rotateX(-Math.PI / 2), mats.paint('#5a4636', 1)), S.pos[0], S.size[2] + C.pot.h - 0.02, S.pos[1]));
  const cactus = euphorbia({ height: C.height, color: C.color });
  cactus.position.set(S.pos[0], S.size[2] + C.pot.h - 0.02, S.pos[1]);
  g.add(cactus);
  return g;
}

export function buildLiving(collision, lamps) {
  const g = new THREE.Group();
  g.name = 'living';
  g.add(sofa(collision));
  g.add(coffeeTable(collision));
  g.add(sideboard(collision, lamps));
  g.add(portrait());
  g.add(oliveOnStool(collision));
  g.add(basket(collision));
  g.add(strawHanging());
  g.add(entrance(collision));
  return g;
}

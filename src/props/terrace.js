// Roof terrace furniture: weathered storage cabinet, teak L-lounge with canvas cushions, round side
// table, slatted dining table with candles, Acapulco and folding chairs, black ladder, batten screen,
// potted olive / fan palm / agave, pebble strip and festoon string lights.
// Everything here is lit by the exterior (sky) environment.
import * as THREE from 'three';
import { DIMS, FURNITURE } from '../apartment.config.js';
import { mats, lathe, rbox, pillow, mesh, tube, place } from './kit.js';
import { oliveTree, fanPalm, agave } from './plants.js';
import * as PT from '../textures/props.js';
import { applyWorldUV } from '../util/geometry.js';
import { mulberry32 } from '../textures/noise.js';

const T = FURNITURE.terrace;
const D = DIMS.deck;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const at = (o, x, h, y) => { o.position.set(x, h, y); return o; };
// Board with its grain running vertically on the side faces.
const vboard = (w, h, d, mat, r = 0.003) => mesh(applyWorldUV(rbox(w, h, d, r, 1), { rotateSides: true }), mat);
const rb = (w, h, d, r) => rbox(w, h, d, r, 1);     // low-segment bevel for the many small parts

const weathered = (key, extra = {}) => mats.wood(key, { ...T.weathered, sizeM: [1.2, 0.12], ring: 7, knots: 0, streak: 0.35, rough: 0.85, seed: 17, ...extra }, { normalScale: new THREE.Vector2(0.18, 0.18) });
const teak = () => mats.wood('terrace-teak', { base: T.lounge.teak, dark: '#6b452a', light: '#b98a5f', sizeM: [0.8, 0.1], ring: 14, streak: 0.4, rough: 0.7 });
const steel = (color) => mats.paint(color, 0.5, { metalness: 0.35 });

// ---------------------------------------------------------------- storage cabinet (doors face west)
function cabinet(collision) {
  const C = T.cabinet;
  const g = new THREE.Group();
  const wood = weathered('cabinet', { base: C.color });
  const [x0, x1] = C.x, [y0, y1] = C.y;
  const W = y1 - y0, Dp = x1 - x0, H = C.h, cy = (y0 + y1) / 2;
  const h0 = D + 0.04, bh = H - 0.08;               // boards stand on low feet
  g.add(at(mesh(rb(Dp - 0.04, H - 0.07, W - 0.04, 0.01), mats.paint('#5b554d', 0.9)), (x0 + x1) / 2, D + 0.035 + (H - 0.07) / 2, cy));
  const gap = 0.006;
  const boards = (len, n, fn) => { for (let i = 0; i < n; i++) fn((i + 0.5) * len / n - len / 2, len / n - gap); };
  // north & south sides, east back
  for (const [yy, s] of [[y0, 1], [y1, -1]]) {
    boards(Dp, 5, (o, w) => g.add(at(vboard(w, bh, 0.018, wood), (x0 + x1) / 2 + o, h0 + bh / 2, yy + s * 0.009)));
  }
  boards(W, 10, (o, w) => g.add(at(vboard(0.018, bh, w, wood), x1 - 0.009, h0 + bh / 2, cy + o)));
  // two doors on the west face: 5 boards each, proud of the carcass, with a bottom ledge
  for (const side of [-1, 1]) {
    const dc = cy + side * W / 4;
    boards(W / 2 - 0.006, 5, (o, w) => g.add(at(vboard(0.02, bh - 0.02, w, wood), x0 - 0.004, h0 + 0.01 + bh / 2, dc + o)));
    g.add(at(mesh(rb(0.016, 0.09, W / 2 - 0.04, 0.003), wood), x0 - 0.02, h0 + 0.16, dc));
  }
  // galvanised strap hinges on the outer edges, hasp in the middle
  const zinc = mats.metal('#a9adae', 0.45);
  for (const side of [-1, 1]) {
    for (const hh of [h0 + 0.28, h0 + bh - 0.3]) {
      const strap = mesh(rb(0.004, 0.032, 0.24, 0.0015), zinc, { cast: false });
      g.add(at(strap, x0 - 0.017, hh, cy + side * (W / 2 - 0.13)));
      g.add(at(mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.05, 10), zinc), x0 - 0.016, hh, cy + side * (W / 2 - 0.006)));
    }
  }
  g.add(at(mesh(rb(0.006, 0.05, 0.16, 0.002), zinc, { cast: false }), x0 - 0.017, h0 + 1.08, cy));
  const loop = mesh(new THREE.TorusGeometry(0.014, 0.003, 6, 14), zinc);
  loop.rotation.y = Math.PI / 2;
  g.add(at(loop, x0 - 0.024, h0 + 1.08, cy + 0.03));
  // roof board, overhanging and sloping toward the back
  const roof = vboard(Dp + 0.08, 0.03, W + 0.08, wood, 0.004);
  roof.rotation.z = -0.04;
  g.add(at(roof, (x0 + x1) / 2, D + H + 0.012, cy));
  // feet
  for (const fx of [x0 + 0.05, x1 - 0.05]) for (const fy of [y0 + 0.05, y1 - 0.05]) g.add(at(mesh(rb(0.06, 0.04, 0.06, 0.004), mats.paint('#3a3631', 0.8)), fx, D + 0.02, fy));
  collision.addBox(x0 - 0.03, y0, x1, y1, D, D + H + 0.04);
  return g;
}

// ---------------------------------------------------------------- teak L-lounge with canvas cushions
function loungeModule({ backs, m, S, wood, cushion, seed }) {
  const g = new THREE.Group();
  const frameTop = S.seatH - 0.12, half = m / 2;
  const legH = (corner) => (backs.some((b) => corner.includes(b)) ? S.backH - 0.04 : frameTop);
  // legs (taller where a back post is needed)
  for (const [cx, cz, tag] of [[-1, -1, 'NW'], [1, -1, 'NE'], [-1, 1, 'SW'], [1, 1, 'SE']]) {
    const h = legH(tag);
    g.add(at(mesh(rb(0.05, h, 0.05, 0.006), wood), cx * (half - 0.03), h / 2, cz * (half - 0.03)));
  }
  // seat rails and slats
  for (const s of [-1, 1]) {
    g.add(at(mesh(rb(m - 0.06, 0.07, 0.028, 0.004), wood), 0, frameTop - 0.06, s * (half - 0.03)));
    g.add(at(mesh(rb(0.028, 0.07, m - 0.06, 0.004), wood), s * (half - 0.03), frameTop - 0.06, 0));
  }
  for (let i = 0; i < 7; i++) g.add(at(mesh(rb(m - 0.1, 0.018, 0.075, 0.003), wood), 0, frameTop - 0.012, -half + 0.08 + i * (m - 0.16) / 6));
  // slatted backs + back cushions
  for (const b of backs) {
    const axisX = b === 'E' || b === 'W';
    const sgn = b === 'E' || b === 'S' ? 1 : -1;
    for (const hh of [0.42, 0.53, 0.64]) {
      const slat = mesh(axisX ? rbox(0.022, 0.07, m - 0.06, 0.004) : rbox(m - 0.06, 0.07, 0.022, 0.004), wood);
      g.add(axisX ? at(slat, sgn * (half - 0.03), hh, 0) : at(slat, 0, hh, sgn * (half - 0.03)));
    }
    const top = mesh(axisX ? rbox(0.05, 0.03, m, 0.006) : rbox(m, 0.03, 0.05, 0.006), wood);
    g.add(axisX ? at(top, sgn * (half - 0.03), S.backH - 0.025, 0) : at(top, 0, S.backH - 0.025, sgn * (half - 0.03)));
    const bc = mesh(pillow(m - 0.05, 0.17, 0.47, { puff: 0.35, flat: 3, round: 0.4, seg: 14, wrinkle: 0.5, seed: seed++ }), cushion);
    bc.geometry.rotateX(Math.PI / 2);           // thickness → plan axis, 0.40 → height
    if (axisX) bc.geometry.rotateY(Math.PI / 2);
    bc.position.set(axisX ? sgn * (half - 0.14) : 0, S.seatH + 0.235, axisX ? 0 : sgn * (half - 0.14));
    if (axisX) bc.rotation.z = -sgn * 0.14; else bc.rotation.x = sgn * 0.14;
    g.add(bc);
  }
  // seat cushion
  const sc = mesh(pillow(m - 0.02, 0.15, m - 0.02, { puff: 0.25, flat: 3, round: 0.45, seg: 14, wrinkle: 0.4, seed: seed + 7 }), cushion);
  g.add(at(sc, 0, frameTop + 0.07, 0));
  return g;
}

function lounge(collision) {
  const S = T.lounge;
  const m = S.module;
  const g = new THREE.Group();
  const wood = teak();
  const cushion = mats.linen(S.cushion, { roughness: 0.95 });
  const [cx, cy] = S.corner;
  const mods = [{ x: cx - m / 2, y: cy - m / 2, backs: ['E', 'S'] }];
  for (let i = 1; i <= S.longArm; i++) mods.push({ x: cx - m / 2, y: cy - m / 2 - i * m, backs: ['E'] });
  for (let j = 1; j <= S.shortArm; j++) mods.push({ x: cx - m / 2 - j * m, y: cy - m / 2, backs: ['S'] });
  mods.forEach((md, k) => {
    const mod = loungeModule({ backs: md.backs, m, S, wood, cushion, seed: 3 + k * 5 });
    g.add(at(mod, md.x, D, md.y));
  });
  collision.addBox(cx - m, cy - (S.longArm + 1) * m, cx, cy, D, D + S.backH);
  collision.addBox(cx - (S.shortArm + 1) * m, cy - m, cx, cy, D, D + S.backH);
  return g;
}

// ---------------------------------------------------------------- round side table
function sideTable(collision) {
  const S = T.sideTable;
  const g = new THREE.Group();
  const top = mesh(new THREE.CylinderGeometry(S.d / 2, S.d / 2, 0.028, 48), mats.wood('side-teak', { base: S.top, sizeM: [0.6, 0.1], ring: 16 }));
  applyWorldUV(top.geometry);
  g.add(at(top, 0, S.h - 0.014, 0));
  const blk = steel('#1e1e1e');
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    g.add(mesh(tube([[Math.cos(a) * 0.15, S.h - 0.03, Math.sin(a) * 0.15], [Math.cos(a) * 0.2, S.h * 0.5, Math.sin(a) * 0.2], [Math.cos(a) * 0.24, 0.0, Math.sin(a) * 0.24]], 0.008, 8), blk));
  }
  g.add(at(mesh(new THREE.TorusGeometry(0.15, 0.007, 6, 30).rotateX(Math.PI / 2), blk), 0, S.h - 0.035, 0));
  at(g, S.pos[0], D, S.pos[1]);
  collision.addBox(S.pos[0] - S.d / 2, S.pos[1] - S.d / 2, S.pos[0] + S.d / 2, S.pos[1] + S.d / 2, D, D + S.h);
  return g;
}

// ---------------------------------------------------------------- slatted dining table + candles
function diningTable(collision, lamps) {
  const S = T.table;
  const g = new THREE.Group();
  const [x0, x1] = S.x, [y0, y1] = S.y;
  const W = x1 - x0, L = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const wood = weathered('table', { base: '#aaa596', dark: '#6f7462', light: '#cbc6b8', sizeM: [1.6, 0.1], ring: 6, seed: 23 });
  const th = 0.026, topY = D + S.h - th / 2;
  // border frame + slats along the long axis (plan N–S)
  const bw = 0.07;
  for (const s of [-1, 1]) {
    g.add(at(mesh(rb(bw, th, L, 0.004), wood), cx + s * (W / 2 - bw / 2), topY, cy));
    g.add(at(mesh(rb(W - 2 * bw, th, bw, 0.004), wood), cx, topY, cy + s * (L / 2 - bw / 2)));
  }
  const n = 8, inner = W - 2 * bw, sw = inner / n;
  for (let i = 0; i < n; i++) {
    const slat = mesh(applyWorldUV(rbox(sw - 0.009, th - 0.004, L - 2 * bw - 0.01, 0.003), { rotateTop: true }), wood);
    g.add(at(slat, x0 + bw + (i + 0.5) * sw, topY - 0.002, cy));
  }
  // dark grey steel frame
  const st = steel(S.frame);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    g.add(at(mesh(rb(0.04, S.h - th, 0.04, 0.004), st), cx + sx * (W / 2 - 0.05), D + (S.h - th) / 2, cy + sy * (L / 2 - 0.05)));
  }
  for (const s of [-1, 1]) {
    g.add(at(mesh(rb(0.025, 0.05, L - 0.12, 0.003), st), cx + s * (W / 2 - 0.05), D + S.h - th - 0.025, cy));
    g.add(at(mesh(rb(W - 0.12, 0.05, 0.025, 0.003), st), cx, D + S.h - th - 0.025, cy + s * (L / 2 - 0.05)));
  }
  collision.addBox(x0, y0, x1, y1, D, D + S.h);
  // turned wooden candle bowl with amber wax and three wicks
  const B = T.candleBowl, top = D + S.h;
  const bowl = new THREE.Group();
  const bw2 = mats.wood('candle-bowl', { base: B.wood, sizeM: [0.3, 0.06], ring: 18 });
  bowl.add(mesh(lathe([[0.001, 0], [0.1, 0.002], [0.122, 0.03], [0.127, 0.08], [0.125, 0.118], [0.112, 0.12], [0.112, 0.1]], 48), bw2));
  bowl.add(at(mesh(new THREE.CircleGeometry(0.112, 40).rotateX(-Math.PI / 2), mats.paint(B.wax, 0.55)), 0, 0.1, 0));
  const flameMat = new THREE.MeshStandardMaterial({ color: '#ffd9a0', roughness: 0.5 });
  flameMat.userData.exterior = true;
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1 + 0.4;
    bowl.add(at(mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.012, 4), mats.black()), Math.cos(a) * 0.05, 0.106, Math.sin(a) * 0.05));
    const fl = mesh(new THREE.SphereGeometry(0.006, 8, 6), flameMat, { cast: false });
    fl.scale.y = 2.2;
    bowl.add(at(fl, Math.cos(a) * 0.05, 0.122, Math.sin(a) * 0.05));
  }
  lamps?.addEmissive('festoon-s2', flameMat, 6);
  bowl.traverse((o) => { if (o.isMesh) o.userData.noMerge = true; });
  g.add(at(bowl, B.pos[0], top, B.pos[1]));
  // small amber glass jar candle
  const J = T.jarCandle;
  const jar = new THREE.Group();
  const amber = new THREE.MeshPhysicalMaterial({ color: J.glass, roughness: 0.12, transparent: true, opacity: 0.55, depthWrite: false });
  amber.userData.exterior = true; amber.userData.envBoost = 1.1;
  jar.add(mesh(lathe([[0.001, 0], [0.038, 0.002], [0.04, 0.01], [0.04, 0.1], [0.036, 0.102]], 32), amber, { cast: false }));
  jar.add(at(mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.06, 28), mats.paint('#e8c79a', 0.6)), 0, 0.033, 0));
  g.add(at(jar, J.pos[0], top, J.pos[1]));
  return g;
}

// ---------------------------------------------------------------- Acapulco chair (white cord, white frame)
function acapulco(collision) {
  const A = T.acapulco;
  const g = new THREE.Group();
  const frame = mats.paint(A.color, 0.32, { metalness: 0.2 });
  // tilted oval rim: low at the front (−z), high at the back
  const rimC = V(0, 0.66, 0.05), ra = 0.43, rb = 0.4, tilt = 0.68;
  const rim = (t) => V(Math.cos(t) * ra, 0, Math.sin(t) * rb).applyAxisAngle(V(1, 0, 0), -tilt).add(rimC);
  const ringC = V(0, 0.3, 0.06), rr = 0.17;
  const ring = (t) => V(Math.cos(t) * rr, 0, Math.sin(t) * rr).add(ringC);
  const N = 72;
  g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: N }, (_, i) => rim((i / N) * Math.PI * 2)), true), 96, 0.011, 8, true), frame));
  g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: N }, (_, i) => ring((i / N) * Math.PI * 2)), true), 48, 0.009, 8, true), frame));
  // cord basket: ruled surface between ring and rim (alpha-tested crisscross cords)
  const cols = 64, rows = 10, pos = [], uv = [], idx = [];
  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    for (let i = 0; i <= cols; i++) {
      const t = (i / cols) * Math.PI * 2;
      const p = ring(t).lerp(rim(t), v);
      p.y -= Math.sin(v * Math.PI) * 0.06;          // the cords sag into a bowl
      pos.push(p.x, p.y, p.z); uv.push(i / cols, v);
    }
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = j * (cols + 1) + i, b = a + cols + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  bg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  bg.setIndex(idx); bg.computeVertexNormals();
  const cordTex = PT.cordWeave(A.color, 96).map;
  const cords = new THREE.MeshStandardMaterial({ map: cordTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.35 });
  const basket = mesh(bg, cords);
  basket.userData.noMerge = true;
  g.add(basket);
  // seat disc of cords across the ring
  const disc = mesh(new THREE.CircleGeometry(rr, 32).rotateX(-Math.PI / 2), cords);
  disc.userData.noMerge = true;
  g.add(at(disc, ringC.x, ringC.y, ringC.z));
  // four splayed legs from the rim/ring down to the deck
  for (const s of [-1, 1]) {
    const front = ring(-Math.PI / 2 + s * 1.1);
    g.add(mesh(tube([front, V(s * 0.27, 0.0, -0.3)], 0.009, 8), frame));
    const back = rim(Math.PI / 2 - s * 0.55);
    g.add(mesh(tube([back, V(s * 0.3, 0.0, 0.36)], 0.009, 8), frame));
  }
  place(g, A.pos[0], A.pos[1], D, A.face);
  collision.addBox(A.pos[0] - 0.36, A.pos[1] - 0.36, A.pos[0] + 0.36, A.pos[1] + 0.36, D, D + 0.85);
  return g;
}

// ---------------------------------------------------------------- slatted folding chair (red-brown)
function foldingChair(collision, { pos, face }, wood) {
  const g = new THREE.Group();
  // outer frame: front legs that rise into the back posts
  for (const s of [-1, 1]) {
    const post = mesh(rb(0.03, 0.9, 0.022, 0.005), wood);
    post.position.set(s * 0.215, 0.43, -0.04);
    post.rotation.x = 0.36;
    g.add(post);
    const rear = mesh(rb(0.026, 0.56, 0.02, 0.005), wood);
    rear.position.set(s * 0.18, 0.24, 0.06);
    rear.rotation.x = -0.62;
    g.add(rear);
  }
  // seat slats, back slats, stretchers
  for (let i = 0; i < 5; i++) g.add(at(mesh(rb(0.4, 0.016, 0.065, 0.004), wood), 0, 0.45, -0.18 + i * 0.075));
  for (const [h, z] of [[0.66, 0.06], [0.78, 0.1]]) {
    const sl = mesh(rb(0.42, 0.07, 0.014, 0.004), wood);
    sl.position.set(0, h, z);
    sl.rotation.x = 0.36;
    g.add(sl);
  }
  g.add(at(mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.42, 8).rotateZ(Math.PI / 2), wood), 0, 0.12, -0.2));
  g.add(at(mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.36, 8).rotateZ(Math.PI / 2), wood), 0, 0.1, 0.22));
  place(g, pos[0], pos[1], D, face);
  collision.addBox(pos[0] - 0.25, pos[1] - 0.25, pos[0] + 0.25, pos[1] + 0.25, D, D + 0.85);
  return g;
}

// ---------------------------------------------------------------- black steel ladder against the west wall
function ladder(collision) {
  const L = T.ladder;
  const g = new THREE.Group();
  const blk = steel('#191919');
  const lean = THREE.MathUtils.degToRad(L.leanDeg);
  for (const s of [-1, 1]) g.add(at(mesh(rb(0.012, L.len, 0.035, 0.003), blk), 0, L.len / 2, s * L.w / 2));
  for (let i = 0; i < L.rungs; i++) {
    g.add(at(mesh(new THREE.CylinderGeometry(0.008, 0.008, L.w, 10).rotateX(Math.PI / 2), blk), 0, 0.3 + i * (L.len - 0.4) / (L.rungs - 1), 0));
  }
  g.rotation.z = lean;                                // top leans toward the wall (−x)
  g.position.set(0.62 + 0.012 + Math.sin(lean) * L.len, D, L.y);
  collision.addBox(0.6, L.y - L.w / 2 - 0.03, 0.62 + Math.sin(lean) * L.len + 0.04, L.y + L.w / 2 + 0.03, D, D + L.len);
  return g;
}

// ---------------------------------------------------------------- hardwood batten screen on the west wall
function battens() {
  const S = T.battens;
  const g = new THREE.Group();
  const wood = mats.wood('battens', { base: S.color, dark: '#5f4532', light: '#a8846a', sizeM: [1.0, 0.04], ring: 10, streak: 0.5, rough: 0.6 });
  const [y0, y1] = S.y;
  for (const h of [0.3, S.h - 0.3]) g.add(at(mesh(rb(0.02, 0.05, y1 - y0, 0.003), wood), 0.61, D + h, (y0 + y1) / 2));
  for (let y = y0 + 0.02; y < y1 - 0.01; y += 0.06) g.add(at(vboard(0.026, S.h, 0.04, wood), 0.633, D + S.h / 2, y));
  return g;
}

// ---------------------------------------------------------------- plants in pots
function pot(r, h, color) {
  const g = new THREE.Group();
  const m = mats.paint(color, 0.75);
  g.add(mesh(lathe([[0.001, 0], [r * 0.74, 0.002], [r * 0.78, 0.02], [r, h - 0.03], [r * 1.02, h], [r * 0.93, h + 0.004], [r * 0.92, h - 0.02]], 40), m));
  g.add(at(mesh(new THREE.CircleGeometry(r * 0.92, 32).rotateX(-Math.PI / 2), mats.paint('#3b3027', 1)), 0, h - 0.03, 0));
  return g;
}

function plants(collision) {
  const g = new THREE.Group();
  const O = T.olive, P = T.palm, A = T.agave;
  const op = pot(0.22, 0.45, O.pot);
  const tree = oliveTree({ height: O.height - 0.45, seed: 23, leafCount: 2000 });
  tree.position.y = 0.42;
  op.add(tree);
  g.add(at(op, O.pos[0], D, O.pos[1]));
  const pp = pot(0.19, 0.38, P.pot);
  const palm = fanPalm({ height: P.height - 0.38 });
  palm.position.y = 0.35;
  pp.add(palm);
  g.add(at(pp, P.pos[0], D, P.pos[1]));
  const ap = pot(0.13, 0.2, A.pot);
  const ag = agave({ height: 0.36 });
  ag.position.y = 0.18;
  ap.add(ag);
  g.add(at(ap, A.pos[0], D, A.pos[1]));
  for (const [p, r] of [[O.pos, 0.22], [P.pos, 0.19], [A.pos, 0.13]]) collision.addBox(p[0] - r, p[1] - r, p[0] + r, p[1] + r, D, D + 0.5);
  return g;
}

// ---------------------------------------------------------------- white pebble strip along the south parapet
function pebbles() {
  const P = T.pebbles;
  const [x0, x1] = P.x, [y0, y1] = P.y;
  const rand = mulberry32(77);
  const n = Math.round((x1 - x0) * (y1 - y0) * 650);
  const inst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mats.paint('#ffffff', 0.75), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), c = new THREE.Color(), base = new THREE.Color(P.color);
  for (let i = 0; i < n; i++) {
    const r = 0.009 + rand() * 0.012;
    e.set(rand() * 3, rand() * 3, rand() * 3); q.setFromEuler(e);
    s.set(r * (1 + rand() * 0.4), r * 0.6, r * (1 + rand() * 0.3));
    m.compose(V(x0 + rand() * (x1 - x0), D + r * 0.4, y0 + rand() * (y1 - y0)), q, s);
    inst.setMatrixAt(i, m);
    inst.setColorAt(i, c.copy(base).multiplyScalar(0.82 + rand() * 0.2));
  }
  inst.receiveShadow = true;
  const g = new THREE.Group();
  g.add(inst);
  g.add(at(mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0).rotateX(-Math.PI / 2), mats.paint('#cfcac0', 1), { cast: false }), (x0 + x1) / 2, D + 0.003, (y0 + y1) / 2));
  return g;
}

// ---------------------------------------------------------------- festoon string lights
function festoon(lamps) {
  const F = T.festoon;
  const g = new THREE.Group();
  g.name = 'festoon';
  const A = F.anchors.map(([x, y, h]) => V(x, D + h, y));
  const pts = [];
  for (let k = 0; k < A.length - 1; k++) {
    const a = A[k], b = A[k + 1];
    const span = Math.hypot(b.x - a.x, b.z - a.z);
    const sag = F.sagPerM * span;
    const steps = Math.max(2, Math.ceil(a.distanceTo(b) / 0.05));
    for (let i = k ? 1 : 0; i <= steps; i++) {
      const t = i / steps;
      const p = a.clone().lerp(b, t);
      p.y -= 4 * sag * t * (1 - t);
      pts.push(p);
    }
  }
  const cable = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, 0.0035, 5, false), mats.black(), { cast: false });
  g.add(cable);
  // bulbs every F.spacing along the cable
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = cum[cum.length - 1];
  const positions = [];
  for (let d = F.spacing / 2, i = 1; d < total; d += F.spacing) {
    while (cum[i] < d) i++;
    const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1]);
    positions.push(pts[i - 1].clone().lerp(pts[i], t));
  }
  const glass = new THREE.MeshStandardMaterial({ color: '#fff2dc', roughness: 0.25 });
  glass.userData.exterior = true;
  const sockets = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.009, 0.028, 10), mats.black(), positions.length);
  const globes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.021, 14, 10), glass, positions.length);
  const m = new THREE.Matrix4();
  positions.forEach((p, i) => {
    m.makeTranslation(p.x, p.y - 0.022, p.z); sockets.setMatrixAt(i, m);
    m.makeTranslation(p.x, p.y - 0.055, p.z); globes.setMatrixAt(i, m);
  });
  sockets.castShadow = false; globes.castShadow = false;
  g.add(sockets, globes);
  lamps?.addEmissive('festoon-s1', glass, 5);
  return g;
}

// Exterior lighting: give every (non-registered) material a clone that uses the sky environment.
function toExterior(root) {
  const cache = new Map();
  const conv = (m) => {
    if (!m || m.userData.exterior) return m;
    if (!cache.has(m.uuid)) {
      const c = m.clone();
      c.userData = { ...m.userData, exterior: true, envBoost: 0.7 };
      delete c.userData.envScale;
      cache.set(m.uuid, c);
    }
    return cache.get(m.uuid);
  };
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
  });
}

export function buildTerrace(collision, lamps) {
  const g = new THREE.Group();
  g.name = 'terrace-furniture';
  g.add(cabinet(collision), lounge(collision), sideTable(collision), diningTable(collision, lamps), acapulco(collision));
  const red = mats.wood('folding-red', { base: T.folding.color, dark: '#5e2c22', light: '#a85d4a', sizeM: [0.6, 0.06], ring: 10, streak: 0.6, rough: 0.85 });
  for (const c of T.folding.chairs) g.add(foldingChair(collision, c, red));
  g.add(ladder(collision), battens(), plants(collision), pebbles(), festoon(lamps));
  toExterior(g);
  return g;
}

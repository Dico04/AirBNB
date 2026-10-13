// Kitchen: U-shaped run (bar/peninsula, cooking run, sink/coffee run, fridge column), walnut
// herringbone top, appliances, bar stools and the countertop props from photo 04.
import * as THREE from 'three';
import { FURNITURE, DIMS } from '../apartment.config.js';
import { mats, lathe, rbox, mesh, tube } from './kit.js';
import * as PT from '../textures/props.js';
import { applyWorldUV } from '../util/geometry.js';

const K = FURNITURE.kitchen;
const TOP = K.counterTop, TH = K.counterThick;

// Box from plan rect + heights (world coords), rounded.
function pbox(x0, y0, x1, y1, h0, h1, mat, r = 0.003, opts) {
  const g = rbox(x1 - x0, h1 - h0, y1 - y0, r);
  g.translate((x0 + x1) / 2, (h0 + h1) / 2, (y0 + y1) / 2);
  applyWorldUV(g);
  return mesh(g, mat, opts);
}

// Cabinet fronts on one face. face: 'e' (normal +x) | 's' (+z) | 'w' (-x). from/to along the face axis.
function fronts(g, face, fixed, from, to, rows, mat) {
  const t = 0.018, gap = 0.003;
  for (const [h0, h1] of rows) {
    if (face === 's') g.add(pbox(from + gap, fixed, to - gap, fixed + t, h0 + gap, h1 - gap, mat, 0.002));
    else if (face === 'e') g.add(pbox(fixed, from + gap, fixed + t, to - gap, h0 + gap, h1 - gap, mat, 0.002));
    else g.add(pbox(fixed - t, from + gap, fixed, to - gap, h0 + gap, h1 - gap, mat, 0.002));
  }
}
const drawerRows = (plinth) => [[plinth, 0.36], [0.36, 0.62], [0.62, TOP - TH]];

function counterSlab(rect, hole) {
  const [x0, y0, x1, y1] = rect;
  const s = new THREE.Shape();
  s.moveTo(x0, -y0); s.lineTo(x1, -y0); s.lineTo(x1, -y1); s.lineTo(x0, -y1); s.closePath();
  if (hole) {
    const h = new THREE.Path();
    h.absarc(hole.x, -hole.y, hole.r, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: TH, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1, curveSegments: 40 });
  g.rotateX(-Math.PI / 2);        // shape XY → plan XZ (y flipped), extrude up
  g.translate(0, TOP - TH, 0);
  applyWorldUV(g);
  return g;
}

export function buildKitchen(collision, lamps) {
  const g = new THREE.Group();
  g.name = 'kitchen';
  const white = mats.paint(K.cabinet, 0.32);
  const plinthMat = mats.paint('#d9d7d3', 0.6);
  const walnut = mats.walnut();
  const steel = mats.brushed('#dadcde');
  const blackGlass = new THREE.MeshPhysicalMaterial({ color: '#08090a', roughness: 0.12, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.08 });
  blackGlass.userData.envScale = 0.35;
  const P = K.plinth;

  // ---------------------------------------------------------------- carcasses + plinths
  const [bx0, by0, bx1, by1] = K.bar.base;
  const [nx0, ny0, nx1, ny1] = K.north;
  const [ex0, ey0, ex1, ey1] = K.east;
  for (const [x0, y0, x1, y1] of [K.bar.base, K.north, K.east]) {
    g.add(pbox(x0 + 0.02, y0, x1 - 0.02, y1 - 0.02, 0, P, plinthMat, 0.002));
    g.add(pbox(x0, y0, x1, y1, P, TOP - TH, white, 0.002));
  }
  // Bar: drawers face east into the kitchen (south of the north run), white side panels elsewhere.
  for (let y = ny1; y < by1 - 0.01; y += (by1 - ny1) / 2) fronts(g, 'e', bx1, y, y + (by1 - ny1) / 2, drawerRows(P), white);
  // North run: filler, built-in oven, drawer stack.
  fronts(g, 's', ny1, nx0, K.oven.x[0], [[P, TOP - TH]], white);
  fronts(g, 's', ny1, K.oven.x[1], nx1, drawerRows(P), white);
  // East run: sink base doors + drawers, facing west.
  fronts(g, 'w', ex0, ny1, (ny1 + ey1) / 2, [[P, TOP - TH]], white);
  fronts(g, 'w', ex0, (ny1 + ey1) / 2, ey1, drawerRows(P), white);
  // Fridge column (to the soffit) with three doors.
  const [fx0, fy0, fx1, fy1] = K.fridge;
  g.add(pbox(fx0, fy0, fx1, fy1, 0, DIMS.soffit, white, 0.002));
  fronts(g, 'w', fx0, fy0, fy1, [[P, 0.92], [0.92, 2.02], [2.02, DIMS.soffit]], white);

  // ---------------------------------------------------------------- walnut herringbone countertops
  g.add(mesh(counterSlab(K.bar.top), walnut));
  g.add(mesh(counterSlab(K.north), walnut));
  g.add(mesh(counterSlab(K.east, { x: K.sink.center[0], y: K.sink.center[1], r: K.sink.r }), walnut));
  collision.addBox(K.bar.top[0], K.bar.top[1], K.bar.top[2], K.bar.top[3], 0, TOP);
  collision.addBox(nx0, ny0, nx1, ny1, 0, TOP);
  collision.addBox(ex0, ey0, ex1, ey1, 0, TOP);
  collision.addBox(fx0, fy0, fx1, fy1, 0, DIMS.soffit);

  // ---------------------------------------------------------------- induction hob
  const [hx, hy] = K.hob.center, [hw, hd] = K.hob.size;
  const hob = mesh(rbox(hw, 0.006, hd, 0.003), blackGlass);
  hob.position.set(hx, TOP + 0.003, hy);
  g.add(hob);
  for (const [dx, dy, r] of [[-0.14, -0.1, 0.09], [0.14, -0.1, 0.07], [-0.14, 0.11, 0.07], [0.14, 0.11, 0.09]]) {
    const ring = mesh(new THREE.RingGeometry(r - 0.002, r, 40), mats.paint('#3a3b3d', 0.4), { cast: false });
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(hx + dx, TOP + 0.0065, hy + dy);
    g.add(ring);
  }

  // ---------------------------------------------------------------- built-in oven (front at y = ny1)
  {
    const [ox0, ox1] = K.oven.x;
    const z = ny1;
    g.add(pbox(ox0 + 0.004, z, ox1 - 0.004, z + 0.02, 0.24, 0.84, steel, 0.003));
    g.add(pbox(ox0 + 0.03, z + 0.02, ox1 - 0.03, z + 0.026, 0.26, 0.72, blackGlass, 0.004));
    g.add(pbox(ox0 + 0.12, z + 0.026, ox1 - 0.12, z + 0.028, 0.34, 0.62, mats.paint('#1d2024', 0.15), 0.002));
    const bar = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.46, 12), steel);
    bar.rotation.z = Math.PI / 2;
    bar.position.set((ox0 + ox1) / 2, 0.695, z + 0.06);
    g.add(bar);
    for (const dx of [-0.2, 0.2]) {
      const leg = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.035, 8), steel);
      leg.rotation.x = Math.PI / 2;
      leg.position.set((ox0 + ox1) / 2 + dx, 0.695, z + 0.04);
      g.add(leg);
    }
    for (const dx of [-0.22, 0.22]) {
      const knob = mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.022, 20), steel);
      knob.rotation.x = Math.PI / 2;
      knob.position.set((ox0 + ox1) / 2 + dx, 0.79, z + 0.03);
      g.add(knob);
    }
    g.add(pbox((ox0 + ox1) / 2 - 0.05, z + 0.02, (ox0 + ox1) / 2 + 0.05, z + 0.024, 0.775, 0.805, mats.paint('#101112', 0.2), 0.002));
  }

  // ---------------------------------------------------------------- chimney hood with flat visor (on the north wall)
  {
    const hx2 = K.hood.x, hb = K.hood.bottom, [vw, vd] = K.hood.visor;
    g.add(pbox(hx2 - 0.12, ny0, hx2 + 0.12, ny0 + 0.2, hb + 0.06, DIMS.soffit, steel, 0.003));
    g.add(pbox(hx2 - vw / 2, ny0, hx2 + vw / 2, ny0 + vd, hb + 0.012, hb + 0.06, steel, 0.004));
    g.add(pbox(hx2 - vw / 2 + 0.01, ny0 + 0.01, hx2 + vw / 2 - 0.01, ny0 + vd - 0.06, hb, hb + 0.012, mats.paint('#55585c', 0.5), 0.002));
    g.add(pbox(hx2 - vw / 2, ny0 + vd - 0.06, hx2 + vw / 2, ny0 + vd, hb - 0.004, hb + 0.012, steel, 0.003));
  }

  // ---------------------------------------------------------------- round sink + angular arched tap
  {
    const [sx, sy] = K.sink.center, r = K.sink.r;
    const inner = mesh(lathe([[0.001, TOP - 0.17], [r * 0.85, TOP - 0.17], [r * 0.95, TOP - 0.15], [r, TOP - 0.06], [r, TOP - 0.001]], 48), new THREE.MeshStandardMaterial({ color: '#b9bcbf', metalness: 1, roughness: 0.28, side: THREE.BackSide }));
    inner.position.set(sx, 0, sy);
    g.add(inner);
    const rim = mesh(new THREE.TorusGeometry(r + 0.006, 0.006, 6, 48), steel);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(sx, TOP + 0.002, sy);
    g.add(rim);
    const drain = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.003, 24), steel);
    drain.position.set(sx, TOP - 0.168, sy);
    g.add(drain);
    // tap behind the sink (toward the east wall), spout reaching west over the bowl
    const tx = sx + 0.22, ty = sy;
    const tap = new THREE.Group();
    tap.add(mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.04, 20), steel));
    tap.children[0].position.y = 0.02;
    tap.add(mesh(tube([[0, 0.03, 0], [0, 0.24, 0], [0, 0.29, 0], [-0.03, 0.31, 0], [-0.15, 0.31, 0], [-0.17, 0.29, 0], [-0.17, 0.24, 0]], 0.0105, 10), steel));
    const lever = mesh(rbox(0.012, 0.012, 0.07, 0.005), steel);
    lever.position.set(0, 0.13, 0.04);
    lever.rotation.x = -0.4;
    tap.add(lever);
    tap.position.set(tx, TOP, ty);
    g.add(tap);
  }

  // ---------------------------------------------------------------- wall unit with built-in microwave (east wall)
  {
    const U = K.microwaveUnit;
    const [ux0, ux1] = U.x, [uy0, uy1] = U.y, [uh0, uh1] = U.h;
    g.add(pbox(ux0 + 0.02, uy0, ux1, uy1, uh0, uh1, white, 0.002));
    g.add(pbox(ux0, uy0 + 0.003, ux0 + 0.02, uy1 - 0.003, uh0 + 0.4, uh1 - 0.003, white, 0.002));    // door above
    // microwave front
    g.add(pbox(ux0 - 0.005, uy0 + 0.01, ux0 + 0.02, uy1 - 0.01, uh0 + 0.005, uh0 + 0.385, steel, 0.003));
    g.add(pbox(ux0 - 0.008, uy0 + 0.06, ux0 - 0.004, uy1 - 0.06, uh0 + 0.06, uh0 + 0.29, mats.paint('#0d0e10', 0.12), 0.006));
    g.add(pbox(ux0 - 0.008, uy0 + 0.25, ux0 - 0.006, uy0 + 0.33, uh0 + 0.325, uh0 + 0.355, mats.paint('#101112', 0.2), 0.002));
  }

  // ---------------------------------------------------------------- coral palm print (east wall)
  {
    const [pw, ph] = K.print.size;
    const frame = new THREE.Group();
    const oak = mats.wood('frame-oak', { base: '#b08a5e', sizeM: [0.4, 0.05], ring: 10 });
    const fw = 0.014, fd = 0.018;
    frame.add(mesh(rbox(fd, ph, fw, 0.002), oak)); frame.children[0].position.set(0, 0, -pw / 2 + fw / 2);
    frame.add(mesh(rbox(fd, ph, fw, 0.002), oak)); frame.children[1].position.set(0, 0, pw / 2 - fw / 2);
    frame.add(mesh(rbox(fd, fw, pw, 0.002), oak)); frame.children[2].position.set(0, ph / 2 - fw / 2, 0);
    frame.add(mesh(rbox(fd, fw, pw, 0.002), oak)); frame.children[3].position.set(0, -ph / 2 + fw / 2, 0);
    const art = mesh(new THREE.PlaneGeometry(pw - 2 * fw, ph - 2 * fw), mats.picture('coral', PT.coralPalmPrint), { cast: false });
    art.rotation.y = -Math.PI / 2;
    art.position.x = -0.004;
    frame.add(art);
    frame.position.set(7.10 - fd / 2, K.print.h, K.print.y);
    g.add(frame);
  }

  // ---------------------------------------------------------------- bar stools (dark stained hardwood, saddle seats)
  const sapele = mats.wood('sapele', { base: K.stoolColor, dark: '#3a1a10', light: '#7a3e26', sizeM: [0.5, 0.1], ring: 16, rough: 0.45 });
  for (const [sx, sy] of K.stools) g.add(barStool(sx, sy, sapele));
  for (const [sx, sy] of K.stools) collision.addBox(sx - 0.19, sy - 0.15, sx + 0.19, sy + 0.15, 0, 0.66);

  // ---------------------------------------------------------------- countertop props
  g.add(kitchenProps());
  return g;
}

function barStool(x, y, mat) {
  const s = new THREE.Group();
  const H = 0.66;
  // saddle seat: rounded slab with a gentle dip
  const seat = rbox(0.38, 0.045, 0.26, 0.012, 3);
  const p = seat.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i) / 0.19;
    if (p.getY(i) > 0) p.setY(i, p.getY(i) - 0.012 * (1 - vx * vx));
  }
  seat.computeVertexNormals();
  const sm = mesh(seat, mat);
  sm.position.y = H - 0.022;
  s.add(sm);
  // splayed legs
  for (const [lx, lz] of [[-0.14, -0.08], [0.14, -0.08], [-0.14, 0.08], [0.14, 0.08]]) {
    const leg = mesh(rbox(0.032, H - 0.04, 0.032, 0.006), mat);
    leg.position.set(lx * 1.06, (H - 0.04) / 2, lz * 1.2);
    leg.rotation.set(-lz * 0.55, 0, lx * 0.38);
    s.add(leg);
  }
  // rungs
  for (const [hgt, lz] of [[0.2, -0.105], [0.2, 0.105]]) {
    const r = mesh(rbox(0.34, 0.025, 0.022, 0.006), mat);
    r.position.set(0, hgt, lz);
    s.add(r);
  }
  for (const [hgt, lx] of [[0.32, -0.16], [0.32, 0.16]]) {
    const r = mesh(rbox(0.022, 0.025, 0.2, 0.006), mat);
    r.position.set(lx, hgt, 0);
    s.add(r);
  }
  s.position.set(x, 0, y);
  s.rotation.y = Math.PI / 2;     // long seat axis runs N–S along the bar
  return s;
}

function kitchenProps() {
  const g = new THREE.Group();
  const Pp = K.props;
  const at = (obj, [x, y], h = TOP) => { obj.position.set(x, h, y); g.add(obj); return obj; };

  // Roll-top bread bin (acacia)
  {
    const acacia = mats.wood('acacia', { base: '#c08a55', dark: '#8a5a32', light: '#d9a46c', sizeM: [0.4, 0.1], ring: 14, streak: 0.4 });
    const bin = new THREE.Group();
    const W = 0.40, D = 0.27, H = 0.22;
    const side = new THREE.Shape();
    side.moveTo(0, 0); side.lineTo(D, 0); side.lineTo(D, 0.03);
    side.absellipse(0, 0.03, D, H - 0.03, 0, Math.PI / 2, false);
    side.lineTo(0, 0);
    for (const xs of [-W / 2, W / 2 - 0.016]) {
      const sg = new THREE.ExtrudeGeometry(side, { depth: 0.016, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1, curveSegments: 16 });
      applyWorldUV(sg);
      const sm = mesh(sg, acacia);
      sm.rotation.y = Math.PI / 2;
      sm.position.set(xs + 0.016, 0, D / 2);
      bin.add(sm);
    }
    bin.add(mesh(rbox(W, 0.012, D, 0.003), acacia)); bin.children[2].position.y = 0.006;
    // roll top slats
    for (let i = 0; i < 9; i++) {
      const a = (i + 0.5) / 9 * Math.PI / 2;
      const slat = mesh(rbox(W - 0.034, 0.012, 0.03, 0.003), acacia);
      slat.position.set(0, 0.03 + Math.sin(a) * (H - 0.03 - 0.006), D / 2 - Math.cos(a) * (D - 0.006));
      slat.rotation.x = -(Math.PI / 2 - a);
      bin.add(slat);
    }
    bin.rotation.y = -Math.PI / 2;           // front faces the kitchen (east)
    at(bin, Pp.breadBin);
    // little yellow dish on top
    const dish = mesh(lathe([[0.001, 0], [0.05, 0.002], [0.062, 0.016], [0.064, 0.02]], 24), mats.glaze('#f2d23c'));
    dish.scale.set(1.15, 1, 0.8);
    dish.position.set(Pp.breadBin[0], TOP + H + 0.002, Pp.breadBin[1] + 0.02);
    g.add(dish);
  }
  // Wicker-wrapped bottle
  {
    const b = new THREE.Group();
    b.add(mesh(lathe([[0.001, 0], [0.045, 0.004], [0.05, 0.08], [0.048, 0.15], [0.022, 0.2], [0.014, 0.25], [0.014, 0.275]], 24), mats.glass('#e9f0ea', 0.25)));
    b.add(mesh(lathe([[0.052, 0.0], [0.054, 0.05], [0.053, 0.11]], 24), mats.basket()));
    b.add(mesh(new THREE.CylinderGeometry(0.012, 0.011, 0.03, 12), mats.cork()));
    b.children[2].position.y = 0.285;
    at(b, Pp.wickerBottle);
  }
  // Terracotta bowl with four oranges
  {
    const bowl = mesh(lathe([[0.001, 0], [0.08, 0.004], [0.13, 0.04], [0.142, 0.07], [0.136, 0.072], [0.124, 0.042], [0.075, 0.012], [0.001, 0.01]], 40), mats.ceramic('terracotta', '#c2643a', { mottle: 0.12 }, { roughness: 0.45 }));
    at(bowl, Pp.fruitBowl);
    const orange = mats.ceramic('orange-peel', '#f08a2a', { mottle: 0.06, rough: 0.55, sizeM: 0.05 });
    for (const [dx, dz, s] of [[-0.04, -0.02, 1], [0.045, -0.015, 0.95], [0.0, 0.045, 1.02], [0.01, -0.005, 0.9]]) {
      const o = mesh(new THREE.SphereGeometry(0.037 * s, 20, 14), orange);
      o.position.set(Pp.fruitBowl[0] + dx, TOP + 0.045 + (dx === 0.01 ? 0.05 : 0), Pp.fruitBowl[1] + dz);
      g.add(o);
    }
  }
  // Olive oil bottles
  for (const [i, pos] of Pp.oil.entries()) {
    const b = new THREE.Group();
    b.add(mesh(lathe([[0.001, 0], [0.03, 0.002], [0.031, 0.17], [0.02, 0.21], [0.011, 0.24], [0.011, 0.26]], 20), mats.glaze('#24361c', { roughness: 0.08, transparent: true, opacity: 0.92 })));
    b.add(mesh(new THREE.CylinderGeometry(0.0315, 0.0315, 0.07, 20, 1, true), mats.paint(i ? '#e9e2c8' : '#f3efe4', 0.7)));
    b.children[1].position.y = 0.09;
    b.add(mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.025, 14), mats.paint('#1d3a1a', 0.4)));
    b.children[2].position.y = 0.27;
    b.scale.setScalar(i ? 0.92 : 1);
    at(b, pos);
  }
  // Olive-wood cutting boards leaning in the NE corner
  {
    const olive = mats.wood('olivewood', { base: '#b9874f', dark: '#7a4f2a', light: '#d8a96c', sizeM: [0.5, 0.25], ring: 30, streak: 0.55, knots: 2 });
    const paddle = new THREE.Shape();
    paddle.moveTo(-0.11, 0); paddle.lineTo(0.11, 0); paddle.lineTo(0.11, 0.42); paddle.quadraticCurveTo(0.11, 0.46, 0.04, 0.47);
    paddle.lineTo(0.03, 0.6); paddle.quadraticCurveTo(0, 0.63, -0.03, 0.6); paddle.lineTo(-0.04, 0.47); paddle.quadraticCurveTo(-0.11, 0.46, -0.11, 0.42); paddle.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0.575, 0.01, 0, Math.PI * 2, true); paddle.holes.push(hole);
    const pg = new THREE.ExtrudeGeometry(paddle, { depth: 0.02, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
    applyWorldUV(pg);
    const pm = mesh(pg, olive);
    pm.rotation.set(-0.12, Math.PI / 2 + 0.6, 0);
    pm.position.set(Pp.boards[0], TOP, Pp.boards[1] + 0.05);
    g.add(pm);
    const round = new THREE.Shape();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2, r = 0.13 * (1 + 0.08 * Math.sin(a * 3 + 1));
      i ? round.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.2 + 0.15) : round.moveTo(Math.cos(a) * r, Math.sin(a) * r * 1.2 + 0.15);
    }
    const rg = new THREE.ExtrudeGeometry(round, { depth: 0.02, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 });
    applyWorldUV(rg);
    const rm = mesh(rg, olive);
    rm.rotation.set(-0.18, Math.PI / 2 + 0.75, 0);
    rm.position.set(Pp.boards[0] - 0.08, TOP, Pp.boards[1] + 0.16);
    g.add(rm);
  }
  // Lidded sand-glazed pot
  {
    const p = new THREE.Group();
    const cer = mats.ceramic('sand-pot', '#d9c8b5', { mottle: 0.1, speckle: 0.02, rough: 0.7 });
    p.add(mesh(lathe([[0.001, 0], [0.06, 0.003], [0.075, 0.05], [0.07, 0.1], [0.06, 0.11]], 32), cer));
    p.add(mesh(lathe([[0.062, 0.108], [0.064, 0.115], [0.04, 0.125], [0.012, 0.13], [0.012, 0.142], [0.001, 0.145]], 32), cer));
    at(p, Pp.pot);
  }
  // Capsule coffee machine
  {
    const m = new THREE.Group();
    const body = mats.paint('#1a1b1d', 0.35);
    m.add(mesh(rbox(0.13, 0.27, 0.32, 0.03, 3), body)); m.children[0].position.set(0, 0.155, 0.02);
    m.add(mesh(rbox(0.13, 0.02, 0.2, 0.006), mats.metal('#d8dadc', 0.15))); m.children[1].position.set(0, 0.01, -0.06);
    m.add(mesh(rbox(0.06, 0.04, 0.07, 0.01), body)); m.children[2].position.set(0, 0.2, -0.17);
    m.add(mesh(rbox(0.09, 0.012, 0.11, 0.005), mats.metal('#c8cacc', 0.2))); m.children[3].position.set(0, 0.296, -0.03);
    m.rotation.y = Math.PI / 2;      // spout faces west into the kitchen
    at(m, Pp.coffee);
    // capsule jar
    const jar = new THREE.Group();
    jar.add(mesh(lathe([[0.001, 0], [0.048, 0.002], [0.05, 0.18], [0.046, 0.19]], 28), mats.glass('#ffffff', 0.15)));
    jar.add(mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 28), mats.metal('#b8a888', 0.3)));
    jar.children[1].position.y = 0.2;
    const capCols = ['#c9a35a', '#e9e4da', '#7a4a2a', '#d8b26a', '#b33a2a'];
    const capGeo = lathe([[0.001, 0], [0.018, 0.004], [0.019, 0.008], [0.012, 0.022], [0.001, 0.026]], 10);
    for (let i = 0; i < 26; i++) {
      const c = mesh(capGeo, mats.metal(capCols[i % capCols.length], 0.35), { cast: false });
      const a = i * 2.39, r = 0.025 * Math.sqrt((i % 7) / 7);
      c.position.set(Math.cos(a) * r, 0.01 + Math.floor(i / 5) * 0.03, Math.sin(a) * r);
      c.rotation.set(Math.sin(i) * 1.2, i, Math.cos(i) * 1.2);
      jar.add(c);
    }
    const mat = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.005, 24), mats.cork());
    jar.add(mat);
    at(jar, Pp.jar);
  }
  return g;
}

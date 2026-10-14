// Corridor desk nook ("Werkplek"): knotty pine desk on a black drawer unit + trestle, cork panel,
// wishbone chair, rattan sunburst mirror, stoneware vase with dried flowers, lamp, print, jug.
import * as THREE from 'three';
import { FURNITURE } from '../apartment.config.js';
import { mats, lathe, rbox, pillow, mesh, tube } from './kit.js';
import { driedFlowers } from './plants.js';
import * as PT from '../textures/props.js';

const C = FURNITURE.corridor;
const at = (o, x, h, y) => { o.position.set(x, h, y); return o; };

function wishboneChair(mat, seatMat) {
  const g = new THREE.Group();
  const SH = 0.44;
  // round tapered legs (back legs rise into the curved top rail)
  for (const [x, z, h] of [[-0.22, -0.2, SH], [0.22, -0.2, SH], [-0.2, 0.2, 0.72], [0.2, 0.2, 0.72]]) {
    const leg = mesh(new THREE.CylinderGeometry(0.014, 0.017, h, 12), mat);
    leg.position.set(x, h / 2, z);
    leg.rotation.x = z > 0 ? -0.08 : 0.03;
    g.add(leg);
  }
  // seat frame + woven paper-cord seat
  for (const [w, d, x, z] of [[0.46, 0.03, 0, -0.2], [0.42, 0.03, 0, 0.19], [0.03, 0.4, -0.22, 0], [0.03, 0.4, 0.22, 0]]) {
    g.add(at(mesh(rbox(w, 0.03, d, 0.008), mat), x, SH - 0.015, z));
  }
  const seat = mesh(pillow(0.42, 0.03, 0.38, { puff: 0.4, seg: 10 }), seatMat);
  seat.position.y = SH - 0.005;
  g.add(seat);
  // curved top rail (half ring)
  const rail = mesh(new THREE.TorusGeometry(0.24, 0.016, 8, 32, Math.PI), mat);
  rail.rotation.x = -Math.PI / 2 + 0.05;
  rail.position.set(0, 0.72, 0.02);
  g.add(rail);
  // Y-shaped back splat
  const splat = new THREE.Shape();
  splat.moveTo(-0.1, 0.24); splat.quadraticCurveTo(0, 0.12, 0.1, 0.24); splat.lineTo(0.03, 0.0); splat.lineTo(-0.03, 0.0); splat.closePath();
  const sg = new THREE.ExtrudeGeometry(splat, { depth: 0.012, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1 });
  const sp = mesh(sg, mat);
  sp.position.set(0, SH + 0.02, 0.2);
  sp.rotation.x = -0.12;
  g.add(sp);
  // stretchers
  for (const [w, d, x, z, h] of [[0.42, 0.02, 0, -0.2, 0.16], [0.02, 0.38, -0.21, 0, 0.2], [0.02, 0.38, 0.21, 0, 0.2]]) {
    g.add(at(mesh(rbox(w, 0.02, d, 0.006), mat), x, h, z));
  }
  return g;
}

function sunburstMirror() {
  const g = new THREE.Group();
  const rattan = mats.fibres(C.mirror.color);
  const R = C.mirror.d / 2;
  const glass = new THREE.MeshPhysicalMaterial({ color: '#e7ecef', metalness: 1, roughness: 0.04 });
  glass.userData.envScale = 1.0;
  g.add(at(mesh(new THREE.CircleGeometry(0.09, 40), glass, { cast: false }), 0, 0, 0.012));
  g.add(at(mesh(new THREE.TorusGeometry(0.095, 0.01, 8, 40), rattan), 0, 0, 0.012));
  g.add(at(mesh(new THREE.TorusGeometry(0.125, 0.006, 6, 40), rattan), 0, 0, 0.01));
  const n = 60;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const len = (i % 2 ? 0.85 : 1) * (R - 0.1);
    const ray = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, len, 5), rattan);
    ray.rotation.z = a - Math.PI / 2;
    ray.position.set(Math.cos(a) * (0.1 + len / 2), Math.sin(a) * (0.1 + len / 2), 0.008);
    g.add(ray);
    if (i % 2 === 0) {
      const tip = mesh(new THREE.SphereGeometry(0.006, 6, 4), rattan);
      tip.position.set(Math.cos(a) * (0.1 + len), Math.sin(a) * (0.1 + len), 0.008);
      g.add(tip);
    }
  }
  return g;
}

export function buildCorridor(collision, lamps) {
  const g = new THREE.Group();
  g.name = 'corridor-nook';
  const D = C.desk;
  const pine = mats.wood('pine-desk', { base: D.color, dark: '#b07a48', light: '#ecc79a', sizeM: [1.4, 0.52], ring: 9, knots: 5, streak: 0.35, rough: 0.55 });
  // desk top
  g.add(at(mesh(rbox(D.x[1] - D.x[0] - 0.004, D.thick, D.y[1] - D.y[0], 0.006), pine), (D.x[0] + D.x[1]) / 2, D.top - D.thick / 2, (D.y[0] + D.y[1]) / 2));
  // black 3-drawer unit with finger-hole cut-outs
  const blk = mats.paint(C.drawers.color, 0.55);
  const [dx0, dx1] = C.drawers.x;
  const dh = D.top - D.thick - 0.005;
  g.add(at(mesh(rbox(dx1 - dx0, dh, 0.46, 0.004), blk), (dx0 + dx1) / 2, dh / 2, 0.29));
  for (let i = 0; i < 3; i++) {
    const h0 = 0.02 + i * (dh - 0.02) / 3, h1 = h0 + (dh - 0.02) / 3 - 0.006;
    g.add(at(mesh(rbox(dx1 - dx0 - 0.01, h1 - h0, 0.018, 0.003), blk), (dx0 + dx1) / 2, (h0 + h1) / 2, 0.525));
    g.add(at(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.004, 20, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI), mats.paint('#050505', 0.9), { cast: false }), (dx0 + dx1) / 2, h1 - 0.002, 0.5345));
  }
  // black A-frame trestle leg
  const tx = C.trestleX;
  for (const s of [-1, 1]) {
    const leg = mesh(rbox(0.035, 0.74, 0.025, 0.004), blk);
    leg.position.set(tx, 0.36, 0.29 + s * 0.12);
    leg.rotation.x = s * 0.3;
    g.add(leg);
  }
  g.add(at(mesh(rbox(0.03, 0.025, 0.42, 0.004), blk), tx, D.top - D.thick - 0.015, 0.29));
  collision.addBox(D.x[0], D.y[0], D.x[1], D.y[1], 0, D.top);
  // cork panel against the west wall
  const [cy0, cy1] = C.cork.y, [ch0, ch1] = C.cork.h;
  g.add(at(mesh(rbox(0.01, ch1 - ch0, cy1 - cy0, 0.002), mats.cork()), 3.306, (ch0 + ch1) / 2, (cy0 + cy1) / 2));
  // wishbone chair
  const chair = wishboneChair(mats.wood('beech', { base: C.chair.frame, sizeM: [0.5, 0.1], ring: 12, streak: 0.15 }), mats.basket());
  chair.position.set(C.chair.pos[0], 0, C.chair.pos[1]);
  chair.rotation.y = -THREE.MathUtils.degToRad(C.chair.face);
  g.add(chair);
  collision.addBox(C.chair.pos[0] - 0.25, C.chair.pos[1] - 0.24, C.chair.pos[0] + 0.25, C.chair.pos[1] + 0.24, 0, 0.72);
  // rattan sunburst mirror on the end wall
  const mirror = sunburstMirror();
  mirror.position.set(C.mirror.x, C.mirror.h, 0.004);
  g.add(mirror);
  // stoneware vase with dried flowers
  const vase = mesh(lathe([[0.001, 0], [0.06, 0.002], [0.095, 0.07], [0.1, 0.14], [0.085, 0.21], [0.045, 0.26], [0.03, 0.29], [0.035, 0.32], [0.028, 0.322]], 36), mats.ceramic('stoneware-vase', C.vase.color, { mottle: 0.22, speckle: 0.04, rough: 0.85 }));
  vase.position.set(C.vase.pos[0], D.top, C.vase.pos[1]);
  g.add(vase);
  const flowers = driedFlowers({ height: 0.3 });
  flowers.position.set(C.vase.pos[0], D.top + 0.3, C.vase.pos[1]);
  g.add(flowers);
  // desk lamp: faceted wood block, black stem, tapered linen shade (glows with the lamp)
  const lamp = new THREE.Group();
  lamp.add(at(mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.075, 6), mats.wood('lamp-block', { base: C.lamp.base, sizeM: [0.2, 0.1], ring: 10 })), 0, 0.0375, 0));
  lamp.add(at(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 8), mats.matteBlack()), 0, 0.13, 0));
  const shadeMat = new THREE.MeshStandardMaterial({ color: C.lamp.shade, roughness: 0.95, side: THREE.DoubleSide, map: mats.linen('#ffffff').map });
  lamp.add(at(mesh(new THREE.CylinderGeometry(0.068, 0.085, 0.17, 32, 1, true), shadeMat), 0, 0.24, 0));
  lamps?.addEmissive('desk-lamp', shadeMat, 0.8);
  lamp.position.set(C.lamp.pos[0], D.top, C.lamp.pos[1]);
  g.add(lamp);
  // black-framed print with handmade paper, leaning on the end wall
  const [pw, ph] = C.print.size;
  const pr = new THREE.Group();
  const fr = mats.paint('#141414', 0.5);
  const fw = 0.018;
  pr.add(at(mesh(rbox(pw, fw, 0.02, 0.002), fr), 0, ph - fw / 2, 0));
  pr.add(at(mesh(rbox(pw, fw, 0.02, 0.002), fr), 0, fw / 2, 0));
  pr.add(at(mesh(rbox(fw, ph, 0.02, 0.002), fr), -pw / 2 + fw / 2, ph / 2, 0));
  pr.add(at(mesh(rbox(fw, ph, 0.02, 0.002), fr), pw / 2 - fw / 2, ph / 2, 0));
  pr.add(at(mesh(new THREE.PlaneGeometry(pw - 2 * fw, ph - 2 * fw), mats.paint('#f4f2ee', 0.9), { cast: false }), 0, ph / 2, 0.004));
  pr.add(at(mesh(new THREE.PlaneGeometry(0.24, 0.27), mats.picture('paper', PT.handmadePaper), { cast: false }), 0, ph / 2 + 0.01, 0.006));
  pr.position.set(C.print.pos[0] - 0.02, D.top, C.print.pos[1]);
  pr.rotation.x = -0.14;
  g.add(pr);
  // grey-blue stoneware jug with handle
  const jug = new THREE.Group();
  const stone = mats.ceramic('jug', C.jug.color, { mottle: 0.3, speckle: 0.05, rough: 0.9 });
  jug.add(mesh(lathe([[0.001, 0], [0.05, 0.002], [0.075, 0.06], [0.078, 0.1], [0.06, 0.15], [0.042, 0.18], [0.046, 0.2], [0.04, 0.202]], 32), stone));
  const handle = mesh(new THREE.TorusGeometry(0.045, 0.009, 8, 16, Math.PI * 1.1), stone);
  handle.position.set(0.07, 0.13, 0);
  handle.rotation.z = -Math.PI / 2;
  jug.add(handle);
  jug.position.set(C.jug.pos[0], D.top, C.jug.pos[1]);
  jug.rotation.y = 0.6;
  g.add(jug);
  return g;
}

// Bedroom: bed with black headboard, white bedding, tufted sand throw, blush pillows, macramé cushion,
// cane nightstand + gourd lamp, bamboo slat sconce, light switch, panel radiator.
import * as THREE from 'three';
import { FURNITURE } from '../apartment.config.js';
import { mats, lathe, rbox, pillow, mesh, tube } from './kit.js';
import * as PT from '../textures/props.js';

const B = FURNITURE.bedroom;
const at = (o, x, h, y) => { o.position.set(x, h, y); return o; };

function pleatedShade(rTop, rBot, h, pleats = 36) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, pleats * 2, 1, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + 0.035 * Math.abs(Math.sin(a * pleats));
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

export function buildBedroom(collision, lamps) {
  const g = new THREE.Group();
  g.name = 'bedroom';
  const [x0, x1] = B.bed.x, [y0, y1] = B.bed.y;
  const W = x1 - x0, cx = (x0 + x1) / 2;
  const sheet = mats.linen(B.bed.sheet, { roughness: 0.95 });
  const black = mats.paint(B.bed.headboard, 0.7);

  // headboard against the south wall
  g.add(at(mesh(rbox(W + 0.1, 0.78, 0.06, 0.012), black), cx, 0.27 + 0.39, y1 - 0.03));
  // low base, mattress
  g.add(at(mesh(rbox(W, 0.22, y1 - y0 - 0.07, 0.01), black), cx, 0.06 + 0.11, (y0 + y1 - 0.07) / 2));
  g.add(at(mesh(rbox(W - 0.02, 0.24, y1 - y0 - 0.1, 0.04, 3), sheet), cx, 0.28 + 0.12, (y0 + y1 - 0.1) / 2));
  // duvet (white, draped over the sides)
  const duvet = mesh(pillow(W + 0.08, 0.1, y1 - y0 - 0.55, { puff: 0.35, round: 0.2, seg: 16 }), sheet);
  at(duvet, cx, B.bed.mattressTop + 0.03, y0 + (y1 - y0 - 0.55) / 2 - 0.02);
  g.add(duvet);
  g.add(at(mesh(rbox(W + 0.08, 0.26, y1 - y0 - 0.55, 0.03), sheet), cx, B.bed.mattressTop - 0.12, y0 + (y1 - y0 - 0.55) / 2 - 0.02));
  // throw over the lower two thirds: one rounded slab, tufted motif on the top face, sand linen drops
  const tw = W + 0.12, td = 1.12, th = 0.36, topH = B.bed.mattressTop + 0.125;
  const throwTopMat = new THREE.MeshStandardMaterial({ map: PT.throwMotif(B.throwColor).map, roughness: 0.95 });
  const sideMat = mats.linen(B.throwColor);
  const tg = rbox(tw, th, td, 0.03, 6);
  const tp = tg.attributes.position, tuv = tg.attributes.uv;
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i);
    if (y > th / 2 - 0.04) {
      // soft sag between the mattress edges + slight ripples
      tp.setY(i, y + 0.008 * Math.sin((x / tw) * Math.PI * 3) * Math.cos(z * 6) - 0.01 * Math.pow(Math.abs(x) / (tw / 2), 6));
    }
  }
  const top = tg.groups[2];                  // +y face → motif spans the whole top
  for (let j = top.start; j < top.start + top.count; j++) {
    const i = tg.index ? tg.index.getX(j) : j;
    tuv.setXY(i, tp.getX(i) / tw + 0.5, 0.5 - tp.getZ(i) / td);
  }
  tg.computeVertexNormals();
  g.add(at(mesh(tg, [sideMat, sideMat, throwTopMat, sideMat, sideMat, sideMat]), cx, topH - th / 2, y0 + td / 2 - 0.03));
  // pillows: two blush euro pillows against the headboard, one leaning, macramé cushion in front
  const blush = mats.linen(B.pillow);
  for (const [dx, rz] of [[-0.33, 0.05], [0.33, -0.06]]) {
    const pw = mesh(pillow(0.62, 0.2, 0.52, { puff: 0.8, seg: 22, flat: 1.8, round: 0.25, pinch: 0.12, wrinkle: 1.6, seed: 3 + dx * 10 }), blush);
    pw.geometry.rotateX(Math.PI / 2);
    pw.position.set(cx + dx, B.bed.mattressTop + 0.25, y1 - 0.16);
    pw.rotation.set(-0.35, 0, rz);
    g.add(pw);
  }
  const p3 = mesh(pillow(0.56, 0.19, 0.46, { puff: 0.8, seg: 22, flat: 1.8, round: 0.25, pinch: 0.12, wrinkle: 1.6, seed: 7 }), blush);
  p3.geometry.rotateX(Math.PI / 2);
  p3.position.set(cx - 0.45, B.bed.mattressTop + 0.2, y1 - 0.34);
  p3.rotation.set(-0.6, 0.25, 0.25);
  g.add(p3);
  const mac = new THREE.Group();
  const core = mesh(pillow(0.42, 0.12, 0.42, { puff: 0.65, seg: 14, flat: 2.5, pinch: 0.04 }), mats.linen('#e7dfd2'));
  core.geometry.rotateX(Math.PI / 2);
  mac.add(core);
  const face = mesh(new THREE.PlaneGeometry(0.42, 0.42), mats.macrame(), { cast: false });
  face.position.z = 0.058;
  mac.add(face);
  mac.position.set(cx - 0.12, B.bed.mattressTop + 0.22, y1 - 0.4);
  mac.rotation.set(-0.55, Math.PI, 0.08);
  g.add(mac);
  collision.addBox(x0 - 0.04, y0 - 0.04, x1 + 0.04, y1, 0, 0.62);

  // nightstand: light wood frame + cane door facing the room (north)
  const N = B.nightstand;
  const [nw, nd, nh] = N.size;
  const ns = new THREE.Group();
  const wood = mats.wood('nightstand', { base: N.frame, sizeM: [0.5, 0.1], ring: 14 });
  ns.add(at(mesh(rbox(nw, 0.02, nd, 0.003), wood), 0, nh - 0.01, 0));
  ns.add(at(mesh(rbox(nw, 0.02, nd, 0.003), wood), 0, 0.06, 0));
  for (const sx of [-1, 1]) ns.add(at(mesh(rbox(0.02, nh, nd, 0.003), wood), sx * (nw / 2 - 0.01), nh / 2, 0));
  ns.add(at(mesh(rbox(nw - 0.04, nh - 0.08, 0.01), mats.paint('#2b2118', 0.9)), 0, nh / 2 + 0.03, nd / 2 - 0.01));
  const fw = 0.025;
  for (const [w, h, x, y] of [[nw - 0.04, fw, 0, nh - 0.035], [nw - 0.04, fw, 0, 0.085], [fw, nh - 0.1, -nw / 2 + 0.0325, nh / 2 + 0.025], [fw, nh - 0.1, nw / 2 - 0.0325, nh / 2 + 0.025]]) {
    ns.add(at(mesh(rbox(w, h, 0.018, 0.003), wood), x, y, -nd / 2 + 0.009));
  }
  ns.add(at(mesh(new THREE.PlaneGeometry(nw - 0.04 - 2 * fw, nh - 0.1 - 2 * fw), mats.cane(), { cast: false }), 0, nh / 2 + 0.025, -nd / 2 + 0.006));
  ns.position.set(N.pos[0], 0, N.pos[1]);
  g.add(ns);
  collision.addBox(N.pos[0] - nw / 2, N.pos[1] - nd / 2, N.pos[0] + nw / 2, N.pos[1] + nd / 2, 0, nh);
  // gourd lamp with pleated shade + brass dish
  const lamp = new THREE.Group();
  lamp.add(mesh(lathe([[0.001, 0], [0.045, 0.003], [0.07, 0.05], [0.068, 0.1], [0.04, 0.15], [0.03, 0.18], [0.035, 0.2], [0.012, 0.22]], 32), mats.ceramic('gourd', B.lampBase, { mottle: 0.15, speckle: 0.06, rough: 0.6 })));
  lamp.add(at(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 8), mats.metal('#b9a27a', 0.3)), 0, 0.25, 0));
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#f3f0ea', roughness: 0.95, side: THREE.DoubleSide });
  lamp.add(at(mesh(pleatedShade(0.06, 0.1, 0.13), shadeMat), 0, 0.33, 0));
  lamps?.addEmissive('bedside-lamp', shadeMat, 0.9);
  lamp.traverse((o) => { if (o.isMesh) o.userData.noMerge = true; });
  lamp.position.set(N.pos[0] + 0.04, nh, N.pos[1] + 0.03);
  g.add(lamp);
  g.add(at(mesh(lathe([[0.001, 0], [0.045, 0.002], [0.05, 0.012]], 24), mats.metal('#c9a44c', 0.25)), N.pos[0] - 0.1, nh, N.pos[1] - 0.06));

  // bamboo slat half-cylinder sconce on the south wall above the bed
  const sc = new THREE.Group();
  const bamboo = mats.fibres(B.sconce.color);
  const R = 0.14, H = 0.28, n = 15;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (i + 0.5) / n;
    const slat = at(mesh(rbox(0.016, H, 0.008, 0.003), bamboo), Math.cos(a) * R, 0, -Math.sin(a) * R);
    slat.rotation.y = Math.PI / 2 - a;
    sc.add(slat);
  }
  for (const yy of [-H / 2 + 0.02, H / 2 - 0.02]) sc.add(at(mesh(new THREE.TorusGeometry(R + 0.004, 0.003, 4, 24, Math.PI).rotateX(Math.PI / 2), bamboo), 0, yy, 0));
  const glowMat = new THREE.MeshStandardMaterial({ color: '#fff3dd', roughness: 0.9, side: THREE.DoubleSide });
  sc.add(mesh(new THREE.CylinderGeometry(R * 0.7, R * 0.7, H * 0.8, 16, 1, true, -Math.PI / 2, Math.PI), glowMat, { cast: false }));
  lamps?.addEmissive('bed-sconce', glowMat, 1.4);
  sc.traverse((o) => { if (o.isMesh) o.userData.noMerge = true; });
  sc.position.set(B.sconce.x, B.sconce.h, y1);
  g.add(sc);

  // light switch on the south wall
  const white = mats.paint('#f3f2ef', 0.4);
  g.add(at(mesh(rbox(0.082, 0.082, 0.01, 0.004), white), B.switch.x, B.switch.h, y1 - 0.005));

  // white panel radiator under the west window
  const [ry0, ry1] = B.radiator.y, [rh0, rh1] = B.radiator.h;
  const rad = new THREE.Group();
  const rw = ry1 - ry0, rh = rh1 - rh0;
  rad.add(at(mesh(rbox(0.06, rh, rw, 0.01), white), 0, 0, 0));
  for (let i = 0; i < 18; i++) {
    const z = -rw / 2 + 0.02 + i * (rw - 0.04) / 17;
    rad.add(at(mesh(new THREE.CylinderGeometry(0.008, 0.008, rh - 0.04, 6), white), 0.032, 0, z));
  }
  rad.position.set(0.09, (rh0 + rh1) / 2, (ry0 + ry1) / 2);
  g.add(rad);
  g.add(at(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.06, 12), mats.metal('#d8dadc', 0.15)), 0.1, rh0 - 0.02, ry1 + 0.03));
  g.add(mesh(tube([[0.1, rh0 - 0.05, ry1 + 0.03], [0.1, 0.0, ry1 + 0.03]], 0.008, 8), white));
  return g;
}

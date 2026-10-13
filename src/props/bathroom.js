// Bathroom: built-in bath with wide deck, matte-black mixer + hand shower, ladder towel radiator,
// strelitzia in a white pot, oak vanity with dark top, round mirror, wooden bucket,
// wall-hung WC with a pre-wall ledge holding a reed diffuser, a shell and a ribbed coral vase.
import * as THREE from 'three';
import { FURNITURE } from '../apartment.config.js';
import { mats, lathe, rbox, mesh, tube } from './kit.js';
import { strelitzia } from './plants.js';
import { applyWorldUV } from '../util/geometry.js';

const BA = FURNITURE.bathroom;
const at = (o, x, h, y) => { o.position.set(x, h, y); return o; };

function roundedRectPath(path, x0, y0, x1, y1, r) {
  path.moveTo(x0 + r, y0);
  path.lineTo(x1 - r, y0); path.quadraticCurveTo(x1, y0, x1, y0 + r);
  path.lineTo(x1, y1 - r); path.quadraticCurveTo(x1, y1, x1 - r, y1);
  path.lineTo(x0 + r, y1); path.quadraticCurveTo(x0, y1, x0, y1 - r);
  path.lineTo(x0, y0 + r); path.quadraticCurveTo(x0, y0, x0 + r, y0);
  return path;
}

function coralVase() {
  // fan-shaped ribbed ceramic: a thin double-sided shell
  const segU = 64, segV = 14, pos = [], idx = [];
  for (let j = 0; j <= segV; j++) {
    const v = j / segV;
    for (let i = 0; i <= segU; i++) {
      const u = i / segU;
      const th = (u - 0.5) * 2.4;
      const rib = 1 + 0.06 * Math.sin(u * Math.PI * 22) * v;
      const rim = 1 + 0.07 * Math.sin(u * Math.PI * 9) * Math.pow(v, 3);
      const r = (0.02 + 0.18 * v) * rib * rim;
      pos.push(Math.sin(th) * r, Math.cos(th) * r * 0.78 + 0.012, Math.sin(u * Math.PI * 22) * 0.012 * v + Math.cos(th) * 0.02 * v);
    }
  }
  for (let j = 0; j < segV; j++) for (let i = 0; i < segU; i++) {
    const a = j * (segU + 1) + i, b = a + segU + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = mats.ceramic('coral-vase', '#f1ece6', { speckle: 0.035, mottle: 0.05, rough: 0.75 });
  const m = mesh(g, new THREE.MeshStandardMaterial({ map: mat.map, roughness: 0.75, side: THREE.DoubleSide }));
  const base = mesh(lathe([[0.001, 0], [0.04, 0.002], [0.035, 0.015], [0.02, 0.02]], 20), mat);
  const grp = new THREE.Group();
  grp.add(m, base);
  return grp;
}

export function buildBathroom(collision, lamps) {
  const g = new THREE.Group();
  g.name = 'bathroom';
  const surround = mats.paint('#ece8e2', 0.6);
  const acrylic = new THREE.MeshPhysicalMaterial({ color: '#f6f6f4', roughness: 0.14, clearcoat: 0.5, side: THREE.BackSide });
  const matteBlack = mats.paint('#161616', 0.45, { metalness: 0.3 });

  // ---------------------------------------------------------------- built-in bath
  const [ox0, oy0, ox1, oy1] = BA.bath.outer, [ix0, iy0, ix1, iy1] = BA.bath.inner, deck = BA.bath.deck;
  const shape = new THREE.Shape();
  shape.moveTo(ox0, -oy0); shape.lineTo(ox1, -oy0); shape.lineTo(ox1, -oy1); shape.lineTo(ox0, -oy1); shape.closePath();
  shape.holes.push(roundedRectPath(new THREE.Path(), ix0, -iy1, ix1, -iy0, 0.12));
  const dg = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2, curveSegments: 12 });
  dg.rotateX(-Math.PI / 2);
  dg.translate(0, deck - 0.035, 0);
  applyWorldUV(dg);
  g.add(mesh(dg, surround));
  g.add(at(mesh(rbox(ox1 - ox0, deck - 0.04, 0.03, 0.004), surround), (ox0 + ox1) / 2, (deck - 0.04) / 2, oy0 + 0.015));
  g.add(at(mesh(rbox(0.03, deck - 0.04, oy1 - oy0, 0.004), surround), ox0 + 0.015, (deck - 0.04) / 2, (oy0 + oy1) / 2));
  const tub = mesh(rbox(ix1 - ix0, 0.44, iy1 - iy0, 0.11, 4), acrylic, { cast: false });
  at(tub, (ix0 + ix1) / 2, deck - 0.22, (iy0 + iy1) / 2);
  g.add(tub);
  collision.addBox(ox0, oy0, ox1, oy1, 0, deck);
  // matte-black bar mixer on the east wall + hand shower and hose
  const mx = 7.10, my = BA.mixer.y, mh = BA.mixer.h;
  const bar = mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.26, 20).rotateX(Math.PI / 2), matteBlack);
  g.add(at(bar, mx - 0.07, mh, my));
  for (const dz of [-0.13, 0.13]) {
    g.add(at(mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 20).rotateX(Math.PI / 2), matteBlack), mx - 0.07, mh, my + dz));
    g.add(at(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 10).rotateZ(Math.PI / 2), matteBlack), mx - 0.035, mh, my + dz * 0.9));
  }
  g.add(at(mesh(rbox(0.11, 0.025, 0.035, 0.008), matteBlack), mx - 0.13, mh - 0.03, my));
  const handset = new THREE.Group();
  handset.add(mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.16, 12), matteBlack));
  handset.add(at(mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.02, 20), matteBlack), 0, 0.09, 0.0));
  handset.position.set(mx - 0.1, mh + 0.08, my - 0.06);
  handset.rotation.set(0.0, 0, 0.5);
  g.add(handset);
  g.add(mesh(tube([[mx - 0.08, mh - 0.03, my - 0.02], [mx - 0.12, mh - 0.18, my - 0.1], [mx - 0.2, deck - 0.12, my - 0.08], [mx - 0.26, deck - 0.3, my], [mx - 0.2, deck - 0.36, my + 0.08]], 0.007, 8), matteBlack));

  // ---------------------------------------------------------------- ladder towel radiator (south wall, above the back deck)
  const [rx0, rx1] = BA.towelRadiator.x, [rh0, rh1] = BA.towelRadiator.h;
  const radMat = mats.paint('#f4f4f2', 0.3);
  const wy = oy1 - 0.06;
  for (const x of [rx0, rx1]) g.add(at(mesh(new THREE.CylinderGeometry(0.015, 0.015, rh1 - rh0, 12), radMat), x, (rh0 + rh1) / 2, wy));
  const rungs = 16;
  for (let i = 0; i < rungs; i++) {
    const h = rh0 + 0.04 + i * (rh1 - rh0 - 0.08) / (rungs - 1) + (i > 9 ? 0.06 : 0) - (i > 4 && i <= 9 ? 0.02 : 0);
    if (h > rh1 - 0.03) continue;
    g.add(at(mesh(new THREE.CylinderGeometry(0.011, 0.011, rx1 - rx0, 10).rotateZ(Math.PI / 2), radMat), (rx0 + rx1) / 2, h, wy));
  }
  for (const x of [rx0, rx1]) g.add(at(mesh(rbox(0.04, 0.03, 0.05, 0.006), matteBlack), x, rh0 - 0.03, wy + 0.01));

  // ---------------------------------------------------------------- strelitzia in a glossy white pot on the deck
  const [px, py] = BA.plant.pos;
  g.add(at(mesh(lathe([[0.001, 0], [0.06, 0.002], [0.085, 0.04], [0.1, 0.12], [0.1, 0.17], [0.092, 0.17]], 32), mats.glaze('#f2f0f0')), px, deck, py));
  // leaves fan away from the south wall (toward −z / north and along the bath)
  const plant = strelitzia({ height: 1.05, arc: [Math.PI * 1.05, Math.PI * 1.95] });
  plant.position.set(px, deck + 0.15, py);
  g.add(plant);

  // ---------------------------------------------------------------- oak vanity with dark top, round mirror, bucket
  const V = BA.vanity;
  const oak = mats.wood('vanity-oak', { base: V.oak, sizeM: [0.6, 0.2], ring: 14 });
  const [vx0, vx1] = V.x, [vy0, vy1] = V.y;
  g.add(at(mesh(rbox(vx1 - vx0, V.h - 0.12, vy1 - vy0, 0.004), oak), (vx0 + vx1) / 2, (V.h - 0.12) / 2 + 0.08, (vy0 + vy1) / 2));
  for (const [h0, h1] of [[0.09, 0.44], [0.45, V.h - 0.05]]) {
    g.add(at(mesh(rbox(vx1 - vx0 - 0.01, h1 - h0, 0.018, 0.003), oak), (vx0 + vx1) / 2, (h0 + h1) / 2, vy0 - 0.009));
  }
  const topMat = mats.paint(V.top, 0.35);
  g.add(at(mesh(rbox(vx1 - vx0 + 0.02, 0.035, vy1 - vy0 + 0.02, 0.006), topMat), (vx0 + vx1) / 2, V.h - 0.0175, (vy0 + vy1) / 2));
  g.add(at(mesh(rbox(0.36, 0.006, 0.26, 0.05), mats.paint('#1f2022', 0.3)), (vx0 + vx1) / 2, V.h + 0.001, (vy0 + vy1) / 2 - 0.02));
  g.add(mesh(tube([[(vx0 + vx1) / 2, V.h, vy1 - 0.05], [(vx0 + vx1) / 2, V.h + 0.2, vy1 - 0.05], [(vx0 + vx1) / 2, V.h + 0.22, vy1 - 0.1], [(vx0 + vx1) / 2, V.h + 0.18, vy1 - 0.16]], 0.009, 8), matteBlack));
  collision.addBox(vx0, vy0, vx1, vy1, 0, V.h);
  const mirMat = new THREE.MeshPhysicalMaterial({ color: '#e9eef0', metalness: 1, roughness: 0.03 });
  mirMat.userData.envScale = 1.0;
  const mir = mesh(new THREE.CircleGeometry(BA.mirror.d / 2, 48), mirMat, { cast: false });
  mir.rotation.y = Math.PI;
  g.add(at(mir, BA.mirror.x, BA.mirror.h, 1.80 - 0.012));
  g.add(at(mesh(new THREE.TorusGeometry(BA.mirror.d / 2, 0.006, 8, 48), matteBlack), BA.mirror.x, BA.mirror.h, 1.80 - 0.012));
  const bucket = new THREE.Group();
  bucket.add(mesh(lathe([[0.001, 0], [0.08, 0.002], [0.09, 0.15], [0.084, 0.152], [0.074, 0.01]], 24), mats.wood('bucket', { base: '#a8703f', sizeM: [0.1, 0.2], ring: 10 })));
  bucket.add(at(mesh(new THREE.TorusGeometry(0.087, 0.004, 6, 24).rotateX(Math.PI / 2), mats.metal('#8a8a88', 0.4)), 0, 0.11, 0));
  bucket.add(at(mesh(new THREE.TorusGeometry(0.083, 0.004, 6, 24).rotateX(Math.PI / 2), mats.metal('#8a8a88', 0.4)), 0, 0.03, 0));
  g.add(at(bucket, BA.bucket.pos[0], V.h, BA.bucket.pos[1]));

  // ---------------------------------------------------------------- wall-hung WC + pre-wall ledge with decor (north wall)
  const W = BA.wc;
  const [wx0, wx1] = W.x, cx = (wx0 + wx1) / 2;
  g.add(at(mesh(rbox(wx1 - wx0, W.ledgeH, W.ledgeDepth, 0.008), mats.paint('#e8e2d9', 0.55)), cx, W.ledgeH / 2, W.ledgeDepth / 2));
  const ceramic = mats.glaze('#fbfbfa', { roughness: 0.12 });
  const bowl = mesh(lathe([[0.001, 0.0], [0.13, 0.0], [0.18, 0.07], [0.19, 0.14], [0.18, 0.16], [0.12, 0.15], [0.05, 0.08], [0.001, 0.06]], 36), ceramic);
  bowl.scale.set(1, 1, 1.45);
  g.add(at(bowl, cx, 0.27, W.ledgeDepth + 0.27));
  g.add(at(mesh(rbox(0.36, 0.025, 0.5, 0.012), ceramic), cx, 0.435, W.ledgeDepth + 0.27));
  collision.addBox(wx0, 0, wx1, W.ledgeDepth + 0.55, 0, W.ledgeH);
  // decor on the ledge
  const lh = W.ledgeH;
  const diff = new THREE.Group();
  diff.add(at(mesh(rbox(0.07, 0.09, 0.07, 0.008), mats.glass('#f4f1ea', 0.1)), 0, 0.045, 0));
  diff.add(at(mesh(rbox(0.06, 0.05, 0.06, 0.004), new THREE.MeshPhysicalMaterial({ color: '#6a2414', roughness: 0.1, transparent: true, opacity: 0.95 })), 0, 0.03, 0));
  diff.add(at(mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.025, 12), mats.metal('#b8a888', 0.3)), 0, 0.1, 0));
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26, tilt = 0.12 + (i % 2) * 0.1;
    const reed = mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.32, 5), mats.paint('#1a1a1a', 0.7));
    reed.position.set(Math.cos(a) * 0.02, 0.24, Math.sin(a) * 0.02);
    reed.rotation.set(Math.sin(a) * tilt, 0, Math.cos(a) * tilt);
    diff.add(reed);
  }
  g.add(at(diff, wx0 + 0.11, lh, 0.1));
  const shell = mesh(lathe([[0.001, 0], [0.03, 0.005], [0.028, 0.025], [0.015, 0.045], [0.001, 0.06]], 16), mats.ceramic('shell', '#ede4d6', { mottle: 0.12 }));
  shell.rotation.set(0, 0.6, Math.PI / 2 - 0.3);
  g.add(at(shell, wx0 + 0.2, lh + 0.025, 0.1));
  const coral = coralVase();
  coral.rotation.y = 0.15;
  g.add(at(coral, wx1 - 0.16, lh, 0.11));
  return g;
}

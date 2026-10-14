// "E" interactions: lamps, wall switches, hinged doors, the sliding terrace door and the TV.
// Each interactable is a world-space hotspot box; the crosshair ray picks the nearest one in reach,
// walls (the shell) block it. Doors and the sliding door animate; their colliders follow the leaves.
import * as THREE from 'three';
import { FURNITURE, DIMS, DOORS, SLIDING_DOOR } from '../apartment.config.js';
import { rbox, mats } from '../props/kit.js';
import { TvScreen } from './tv.js';
import { mergeStatic } from '../util/merge.js';

const REACH = 2.4;
const box = (x0, h0, y0, x1, h1, y1) => new THREE.Box3(new THREE.Vector3(x0, h0, y0), new THREE.Vector3(x1, h1, y1));

// Small white rocker switch plate on a wall: face = direction the plate faces ('+x', '-x', '+y', '-y').
function switchPlate(x, y, h, face) {
  const g = new THREE.Group();
  const white = mats.paint('#f3f2ef', 0.4);
  const plate = new THREE.Mesh(rbox(0.082, 0.082, 0.01, 0.004), white);
  const rocker = new THREE.Mesh(rbox(0.05, 0.055, 0.008, 0.003), mats.paint('#f8f7f5', 0.3));
  rocker.position.z = 0.008;
  g.add(plate, rocker);
  g.position.set(x, h, y);
  g.rotation.y = { '+y': 0, '-y': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[face];
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  return g;
}
const switchBox = (x, y, h, face) => {
  const n = { '+y': [0, 1], '-y': [0, -1], '+x': [1, 0], '-x': [-1, 0] }[face];
  const cx = x + n[0] * 0.03, cy = y + n[1] * 0.03;
  const hx = n[0] ? 0.04 : 0.07, hy = n[1] ? 0.04 : 0.07;
  return box(cx - hx, h - 0.07, cy - hy, cx + hx, h + 0.07, cy + hy);
};

export class Interactions {
  constructor({ scene, camera, lamps, doors, occluders, promptEl }) {
    this.scene = scene;
    this.camera = camera;
    this.lamps = lamps;
    this.doors = doors;
    this.occluders = occluders;
    this.promptEl = promptEl;
    this.items = [];
    this.hover = null;
    this.ray = new THREE.Raycaster();
    this.ray.far = REACH + 0.5;
    this._timer = 0;
    this.doorState = {};
    this.fixtures = new THREE.Group();
    this.fixtures.name = 'switches';
    scene.add(this.fixtures);
    this.setup();
    mergeStatic(this.fixtures, { name: 'switches-merged' });
  }

  add(item) { this.items.push(item); return item; }

  setup() {
    const F = FURNITURE, L = F.living, C = F.corridor, B = F.bedroom, E = F.entrance, D = DIMS.deck;
    const lampItem = (id, name, b) => this.add({ id, box: b, label: () => (this.lamps.isOn(id) ? `Switch off the ${name}` : `Switch on the ${name}`), action: () => this.lamps.toggle(id) });
    const lp = L.lamp.pos;
    lampItem('living-lamp', 'table lamp', box(lp[0] - 0.14, 0.62, lp[1] - 0.14, lp[0] + 0.14, 1.2, lp[1] + 0.14));
    const dp = C.lamp.pos;
    lampItem('desk-lamp', 'desk lamp', box(dp[0] - 0.1, C.desk.top, dp[1] - 0.1, dp[0] + 0.1, C.desk.top + 0.36, dp[1] + 0.1));
    const np = B.nightstand.pos, nh = B.nightstand.size[2];
    lampItem('bedside-lamp', 'bedside lamp', box(np[0] - 0.12, nh, np[1] - 0.12, np[0] + 0.16, nh + 0.46, np[1] + 0.16));
    lampItem('bed-sconce', 'wall light', box(B.sconce.x - 0.17, B.sconce.h - 0.17, B.bed.y[1] - 0.2, B.sconce.x + 0.17, B.sconce.h + 0.17, B.bed.y[1]));

    // Wall switches (two existing plates + three new ones).
    const sw = (id, x, y, h, face, ids, name, makePlate = true) => {
      if (makePlate) this.fixtures.add(switchPlate(x, y, h, face));
      this.add({ id, box: switchBox(x, y, h, face), label: () => `${name} lights: ${this.lamps.isOn(ids) ? 'off' : 'on'}`, action: () => this.lamps.toggle(ids) });
    };
    sw('sw-kitchen', E.switch.x, 4.205, E.switch.h, '+y', ['bar-down-1', 'bar-down-2', 'kitchen-down-1', 'kitchen-down-2'], 'Kitchen', false);
    sw('sw-bedroom', B.switch.x, B.bed.y[1] - 0.005, B.switch.h, '-y', ['bed-sconce', 'bedside-lamp'], 'Bedroom', false);
    sw('sw-corridor', 3.302, 3.72, 1.05, '+x', ['corridor-ceil', 'corridor-spot', 'desk-lamp'], 'Corridor');
    sw('sw-bath', 4.698, 1.32, 1.05, '-x', ['bath-ceil'], 'Bathroom');
    sw('sw-festoon', 4.18, 9.352, D + 1.05, '+y', ['festoon-s1', 'festoon-s2', 'festoon-s3', 'festoon-e1', 'festoon-e2'], 'String');

    // Hinged doors.
    for (const spec of DOORS) {
      const ctrl = this.doors[spec.id];
      if (!ctrl) continue;
      const open = spec.type === 'front' ? 85 : 88;
      this.doorState[spec.id] = { angle: spec.openDeg, target: spec.openDeg, open, ctrl };
      const group = ctrl.pivot.parent;
      // hotspot = the doorway (leaf box when closed) + wherever the leaf currently is
      ctrl.setAngle(0); group.updateMatrixWorld(true);
      const doorway = new THREE.Box3().setFromObject(ctrl.pivot).expandByVector(new THREE.Vector3(0.06, 0, 0.06));
      ctrl.setAngle(spec.openDeg); group.updateMatrixWorld(true);
      this.add({
        id: spec.id,
        dynamicBox: () => new THREE.Box3().setFromObject(ctrl.pivot).union(doorway),
        label: () => (this.doorState[spec.id].target > 1 ? 'Close the door' : spec.type === 'front' ? 'Open the front door' : 'Open the door'),
        action: () => { const s = this.doorState[spec.id]; s.target = s.target > 1 ? 0 : s.open; },
      });
    }
    // Sliding terrace door (starts open).
    const sd = this.doors['D-slide'];
    if (sd) {
      const full = SLIDING_DOOR.openFraction;
      this.doorState['D-slide'] = { angle: full, target: full, open: full, ctrl: sd, sliding: true };
      const group = sd.sliding.parent;
      sd.setOpen(0); group.updateMatrixWorld(true);
      const doorway = new THREE.Box3().setFromObject(group).expandByVector(new THREE.Vector3(0, 0, 0.06));
      sd.setOpen(full); group.updateMatrixWorld(true);
      this.add({
        id: 'D-slide',
        box: doorway,
        label: () => (this.doorState['D-slide'].target > 0.01 ? 'Slide the terrace door shut' : 'Slide the terrace door open'),
        action: () => { const s = this.doorState['D-slide']; s.target = s.target > 0.01 ? 0 : s.open; },
      });
    }
    // TV.
    const screen = this.scene.getObjectByName('tv-screen');
    if (screen) {
      this.tv = new TvScreen(screen);
      const [x0, x1] = [L.tv.x - L.tv.size[0] / 2 - 0.05, L.tv.x + L.tv.size[0] / 2 + 0.05];
      const y = (L.sideboard.y[0] + L.sideboard.y[1]) / 2 + 0.03;
      this.add({ id: 'tv', box: box(x0, L.sideboard.h + 0.08, y - 0.12, x1, L.sideboard.h + 0.62, y + 0.06), reach: 3.2,
        label: () => (this.tv.on ? 'Turn off the TV' : 'Turn on the TV'), action: () => this.tv.toggle() });
    }
  }

  // Open/close a door programmatically (tour, tests).
  setDoor(id, open) {
    const s = this.doorState[id];
    if (s) s.target = open ? s.open : 0;
  }

  pick() {
    const cam = this.camera;
    cam.updateMatrixWorld();
    this.ray.setFromCamera(new THREE.Vector2(0, 0), cam);
    const r = this.ray.ray;
    if (this.originOverride) r.origin.copy(this.originOverride);      // third person: reach from the figure's eyes
    let best = null, bestD = Infinity;
    const p = new THREE.Vector3();
    for (const it of this.items) {
      const b = it.dynamicBox ? it.dynamicBox() : it.box;
      if (!r.intersectBox(b, p)) continue;
      const d = p.distanceTo(r.origin);
      if (d < bestD && d <= (it.reach || REACH)) { best = it; bestD = d; }
    }
    if (best && this.occluders.length) {
      this.ray.far = bestD;
      const hits = this.ray.intersectObjects(this.occluders, true);
      this.ray.far = REACH + 0.5;
      if (hits.length && hits[0].distance < bestD - 0.03) best = null;
    }
    return best;
  }

  trigger() {
    const it = this.hover || this.pick();
    if (!it) return null;
    it.action();
    this._timer = 0;            // refresh the prompt right away
    return it.id;
  }

  update(dt, active = true) {
    // animate doors
    this.animating = false;
    for (const s of Object.values(this.doorState)) {
      if (Math.abs(s.angle - s.target) < 1e-4) continue;
      this.animating = true;
      const speed = s.sliding ? 1.4 : 140;       // fraction/s or deg/s
      s.angle += Math.sign(s.target - s.angle) * Math.min(Math.abs(s.target - s.angle), speed * dt);
      if (s.sliding) s.ctrl.setOpen(s.angle); else s.ctrl.setAngle(s.angle);
    }
    this.tv?.update(dt);
    this._timer -= dt;
    if (this._timer <= 0) {
      this._timer = 0.1;
      this.hover = active ? this.pick() : null;
      const text = this.hover ? this.hover.label() : '';
      if (this.promptEl.dataset.text !== text) {
        this.promptEl.dataset.text = text;
        this.promptEl.innerHTML = text ? `<b>E</b> ${text}` : '';
        this.promptEl.classList.toggle('hidden', !text);
      }
    }
  }
}

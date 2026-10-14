// Third-person view: a stylised figure (capsule limbs, linen shirt, dark trousers) with a simple walk
// cycle, and a camera boom behind the shoulder that pulls in when a wall is in the way.
import * as THREE from 'three';
import { PLAYER } from '../apartment.config.js';

const mat = (color, roughness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness });
const cap = (r, len, m) => {
  const g = new THREE.CapsuleGeometry(r, len, 6, 14);
  g.translate(0, -len / 2 - r, 0);          // pivot at the top (joint)
  const mesh = new THREE.Mesh(g, m);
  mesh.castShadow = true;
  return mesh;
};

export class Avatar {
  constructor(scene) {
    const shirt = mat('#e7e1d6', 0.9), trousers = mat('#4a5059', 0.85), skin = mat('#c9a185', 0.6), hair = mat('#3b2c22', 0.7), shoes = mat('#2a2522', 0.6);
    const root = new THREE.Group();
    root.name = 'avatar';
    // torso + hips
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.34, 8, 18), shirt);
    torso.scale.set(1, 1, 0.68);
    torso.position.y = 1.2;
    const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.08, 6, 16), trousers);
    hips.scale.set(1, 1, 0.7);
    hips.position.y = 0.95;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 12), skin);
    neck.position.y = 1.5;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 18), skin);
    head.scale.set(0.92, 1.08, 1);
    head.position.y = 1.63;
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
    hairCap.scale.set(0.95, 1.05, 1.04);
    hairCap.position.set(0, 1.645, 0.008);
    root.add(torso, hips, neck, head, hairCap);
    // limbs (pivot groups at the joints)
    const limb = (x, y, upper, lower, m, foot) => {
      const hip = new THREE.Group(); hip.position.set(x, y, 0);
      const u = cap(upper[0], upper[1], m); hip.add(u);
      const knee = new THREE.Group(); knee.position.y = -(upper[1] + upper[0] * 2) + 0.02; hip.add(knee);
      knee.add(cap(lower[0], lower[1], foot ? m : skin));
      if (foot) {
        const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.12, 4, 10), shoes);
        f.rotation.x = Math.PI / 2; f.position.set(0, -(lower[1] + lower[0] * 2) + 0.03, -0.05);
        f.castShadow = true;
        knee.add(f);
      }
      root.add(hip);
      return { hip, knee };
    };
    this.legL = limb(-0.09, 0.93, [0.07, 0.3], [0.058, 0.32], trousers, true);
    this.legR = limb(0.09, 0.93, [0.07, 0.3], [0.058, 0.32], trousers, true);
    this.armL = limb(-0.22, 1.43, [0.048, 0.2], [0.042, 0.2], shirt, false);
    this.armR = limb(0.22, 1.43, [0.048, 0.2], [0.042, 0.2], shirt, false);
    for (const a of [this.armL, this.armR]) a.hip.rotation.z = a === this.armL ? -0.08 : 0.08;
    root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    root.visible = false;
    scene.add(root);
    this.root = root;
    this.phase = 0;
    this.camPos = new THREE.Vector3();
    this.ray = new THREE.Raycaster();
    this.boom = 2.0;
  }

  // Pose the figure from the controller and place the camera behind it.
  update(dt, ctrl, camera, occluders, moving, running) {
    const r = this.root;
    r.visible = true;
    r.position.set(ctrl.x, ctrl.feet, ctrl.z);
    r.rotation.y = ctrl.yaw;
    const speed = moving ? (running ? 9 : 6) : 0;
    this.phase += dt * speed;
    const amp = moving ? (running ? 0.55 : 0.38) : 0;
    this._amp = THREE.MathUtils.lerp(this._amp || 0, amp, Math.min(1, dt * 8));
    const s = Math.sin(this.phase) * this._amp;
    this.legL.hip.rotation.x = s; this.legR.hip.rotation.x = -s;
    this.legL.knee.rotation.x = -Math.max(0, -Math.cos(this.phase)) * this._amp * 1.3;     // knees flex backward
    this.legR.knee.rotation.x = -Math.max(0, Math.cos(this.phase)) * this._amp * 1.3;
    this.armL.hip.rotation.x = -s * 0.7; this.armR.hip.rotation.x = s * 0.7;
    this.armL.knee.rotation.x = 0.25; this.armR.knee.rotation.x = 0.25;               // relaxed elbows
    r.position.y += Math.abs(Math.cos(this.phase)) * this._amp * 0.04;
    // camera boom: behind and slightly above the head, looking where the player looks
    const head = new THREE.Vector3(ctrl.x, ctrl.feet + PLAYER.eyeHeight + 0.05, ctrl.z);
    const dir = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(ctrl.pitch * 0.6 - 0.18, ctrl.yaw, 0, 'YXZ'));
    const shoulder = new THREE.Vector3(0.28, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), ctrl.yaw);
    const origin = head.clone().add(shoulder.multiplyScalar(0.5));
    let dist = this.boom;
    if (occluders.length) {
      this.ray.set(origin, dir);
      this.ray.far = this.boom + 0.2;
      const hit = this.ray.intersectObjects(occluders, true)[0];
      if (hit) dist = Math.max(0.35, hit.distance - 0.18);
    }
    const target = origin.clone().addScaledVector(dir, dist);
    this.camPos.lerp(target, this._init ? Math.min(1, dt * 12) : 1);
    this._init = true;
    camera.position.copy(this.camPos);
    camera.rotation.set(ctrl.pitch, ctrl.yaw, 0, 'YXZ');
    // fade the figure out when the camera is squeezed right behind the head
    r.visible = dist > 0.55;
  }

  hide() { this.root.visible = false; this._init = false; }
}

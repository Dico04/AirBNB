// First-person walking controller: pointer-lock mouse look, WASD + Shift run, collision, step-up and gravity.
import * as THREE from 'three';
import { PLAYER } from '../apartment.config.js';

const deg = Math.PI / 180;

export class FirstPersonController {
  constructor(camera, dom, collision) {
    this.camera = camera;
    this.dom = dom;
    this.collision = collision;
    this.x = PLAYER.spawn.x;
    this.z = PLAYER.spawn.y;
    this.feet = 0;
    this.eyeLag = 0;          // smooths camera height after stepping up
    this.vy = 0;
    this.yaw = PLAYER.spawn.yawDeg * deg;
    this.pitch = PLAYER.spawn.pitchDeg * deg;
    this.sensitivity = PLAYER.mouseSensitivity;
    this.keys = new Set();
    this.enabled = true;
    this.locked = false;
    this.bob = 0;

    this._onKeyDown = (e) => { if (!e.repeat) this.keys.add(e.code); };
    this._onKeyUp = (e) => this.keys.delete(e.code);
    this._onBlur = () => this.keys.clear();
    this._onMouseMove = (e) => {
      if (!this.locked || !this.enabled) return;
      this.yaw -= e.movementX * this.sensitivity;
      this.pitch -= e.movementY * this.sensitivity;
      this.pitch = Math.max(-85 * deg, Math.min(85 * deg, this.pitch));
    };
    this._onLockChange = () => {
      this.locked = document.pointerLockElement === this.dom;
      this.dom.dispatchEvent(new CustomEvent('lockchange', { detail: this.locked }));
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onLockChange);
    this.feet = Math.max(0, collision.groundAt(this.x, this.z, 10, 0));
    if (!Number.isFinite(this.feet)) this.feet = 0;
  }

  lock() { this.dom.requestPointerLock?.(); }
  unlock() { document.exitPointerLock?.(); }

  setPose(x, z, yawRad, pitchRad) {
    this.x = x; this.z = z; this.yaw = yawRad; this.pitch = pitchRad;
    const g = this.collision.groundAt(x, z, 10, 0);
    this.feet = Number.isFinite(g) ? g : 0;
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    this.collision.updateDynamic();
    if (this.enabled) {
      const k = this.keys;
      let fx = 0, fz = 0;
      if (k.has('KeyW') || k.has('ArrowUp')) fz += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) fz -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) fx += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) fx -= 1;
      if (this.externalMove) { fx += this.externalMove.x; fz += this.externalMove.y; }
      const len = Math.hypot(fx, fz);
      if (len > 0) {
        fx /= Math.max(1, len); fz /= Math.max(1, len);
        const run = k.has('ShiftLeft') || k.has('ShiftRight');
        const speed = run ? PLAYER.runSpeed : PLAYER.walkSpeed;
        const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
        // forward = (-sin, -cos) in xz; right = (cos, -sin)
        const vx = (-sin * fz + cos * fx) * speed;
        const vz = (-cos * fz - sin * fx) * speed;
        const dist = Math.hypot(vx, vz) * dt;
        const steps = Math.max(1, Math.ceil(dist / 0.04));
        for (let i = 0; i < steps; i++) this.moveStep((vx * dt) / steps, (vz * dt) / steps);
        this.bob += dt * speed * 5.2;
      }
    }
    // Ground following: step up instantly (camera smoothed), fall with gravity.
    const g = this.collision.groundAt(this.x, this.z, this.feet, PLAYER.stepUp, PLAYER.radius);
    const ground = Number.isFinite(g) ? g : this.feet;
    if (ground > this.feet) {
      this.eyeLag -= ground - this.feet;
      this.feet = ground;
      this.vy = 0;
    } else if (ground < this.feet) {
      this.vy -= 9.81 * dt;
      this.feet = Math.max(ground, this.feet + this.vy * dt);
      if (this.feet === ground) this.vy = 0;
    }
    this.eyeLag *= Math.exp(-dt * 14);
    this.applyCamera();
  }

  moveStep(dx, dz) {
    const r = PLAYER.radius;
    const bodyTop = this.feet + 1.8;
    const p = this.collision.resolve(this.x + dx, this.z + dz, r, this.feet, PLAYER.stepUp, bodyTop);
    this.x = p.x; this.z = p.z;
  }

  applyCamera() {
    const bobY = this.enabled && this.keys.size ? Math.sin(this.bob) * 0.012 : 0;
    this.camera.position.set(this.x, this.feet + PLAYER.eyeHeight + this.eyeLag + bobY, this.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onLockChange);
  }
}

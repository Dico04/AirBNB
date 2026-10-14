// Cinematic tour (C): entrance → kitchen → living room → out through the sliding door → terrace →
// slow push toward the church while the sky turns to sunset. Keyframed camera on Catmull-Rom splines.
import * as THREE from 'three';
import { TOUR } from '../apartment.config.js';

const v = ([x, y, h]) => new THREE.Vector3(x, h, y);
const smooth = (t) => t * t * (3 - 2 * t);

export class Tour {
  constructor({ camera, tod, interactions, captionEl, onEnd }) {
    this.camera = camera;
    this.tod = tod;
    this.interactions = interactions;
    this.captionEl = captionEl;
    this.onEnd = onEnd;
    this.active = false;
    const K = TOUR.keys;
    this.times = K.map((k) => k.t);
    this.pos = new THREE.CatmullRomCurve3(K.map((k) => v(k.eye)), false, 'centripetal');
    this.look = new THREE.CatmullRomCurve3(K.map((k) => v(k.look)), false, 'centripetal');
    this.duration = this.times[this.times.length - 1];
  }

  // Map tour time → spline parameter (piecewise between keys, eased at both ends of the tour).
  param(t) {
    const T = this.times, n = T.length - 1;
    let i = 0;
    while (i < n - 1 && t > T[i + 1]) i++;
    const local = THREE.MathUtils.clamp((t - T[i]) / (T[i + 1] - T[i]), 0, 1);
    const k = i === 0 ? smooth(local) * 0.5 + local * 0.5 : i === n - 1 ? 1 - (1 - local) * (1 - local) : local;
    return (i + k) / n;
  }

  start() {
    this.active = true;
    this.t = 0;
    this.fov0 = this.camera.fov;
    this.events = TOUR.keys.map((k) => ({ ...k, done: false }));
    this.tod.goTo(TOUR.startHours, 1.2);
    this.interactions?.setDoor('D-slide', true);
    document.body.classList.add('touring');
    this.update(0);
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    this.camera.fov = this.fov0;
    this.camera.updateProjectionMatrix();
    document.body.classList.remove('touring');
    this.caption('');
    this.onEnd?.();
  }

  caption(text) {
    if (!this.captionEl) return;
    this.captionEl.textContent = text;
    this.captionEl.classList.toggle('show', Boolean(text));
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    for (const e of this.events) {
      if (e.done || this.t < e.t) continue;
      e.done = true;
      if (e.caption !== undefined) this.caption(e.caption);
      if (e.goTo !== undefined) this.tod.goTo(e.goTo, e.goToSeconds || 8);
    }
    const u = this.param(Math.min(this.t, this.duration));
    const p = this.pos.getPoint(u);
    const l = this.look.getPoint(u);
    this.camera.position.copy(p);
    this.camera.lookAt(l);
    // field of view eases between keys
    const T = this.times; let i = 0;
    while (i < T.length - 2 && this.t > T[i + 1]) i++;
    const a = TOUR.keys[i].fov, b = TOUR.keys[i + 1].fov;
    const f = smooth(THREE.MathUtils.clamp((this.t - T[i]) / (T[i + 1] - T[i]), 0, 1));
    this.camera.fov = a + (b - a) * f;
    this.camera.updateProjectionMatrix();
    if (this.t > this.duration + TOUR.holdSeconds) this.stop();
  }
}

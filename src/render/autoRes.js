// Dynamic resolution: keeps the frame rate at the display's refresh by lowering the render pixel ratio
// when frames are missed and raising it again (up to the preset's ratio) when there is headroom.
// Works from real frame intervals, so it needs no GPU timer queries.
// Every step down is checked: if rendering fewer pixels didn't make frames faster, the frame rate is
// capped by something else (iOS Low Power Mode holds Safari at 30 fps, a 30 Hz display, a busy CPU).
// The sharpness is then restored and that frame rate is accepted as the target.
const BASE_TARGET = 19.0;            // ms: 60 fps with ~12 % jitter allowance

export class AutoResolution {
  constructor({ renderer, apply, maxRatio, minRatio = 0.55, enabled = true }) {
    this.renderer = renderer;
    this.apply = apply;              // (ratio) => resize renderer + post
    this.max = maxRatio;
    this.min = Math.min(minRatio, maxRatio);
    this.ratio = maxRatio;
    this.enabled = enabled;
    this.ema = 16.7;                 // smoothed frame time (ms)
    this.target = BASE_TARGET;       // raised when the frame rate turns out to be capped
    this.slow = 0;                   // seconds spent above target
    this.slowSum = 0; this.slowN = 0;  // raw frame times while slow (the cost before a step down)
    this.fast = 0;                   // seconds spent at target
    this.quick = 0;                  // seconds under the base target while the target is raised
    this.cooldown = 1.5;
    this.ceiling = maxRatio;         // where we last had to back off; relaxed over time
    this.ceilingAge = 0;
    this.trial = null;               // a step down being judged: { from, before, steps, t, sum, n }
  }

  get scale() { return this.ratio / this.max; }

  update(dtSeconds) {
    if (!this.enabled) return;
    const ms = dtSeconds * 1000;
    if (ms <= 0 || ms > 250) return;                     // tab switches, hitches while loading
    this.ema += (ms - this.ema) * 0.08;
    this.cooldown -= dtSeconds;
    this.ceilingAge += dtSeconds;
    if (this.ceilingAge > 30) { this.ceiling = this.max; this.ceilingAge = 0; }

    // A raised target drops back once frames are fast again (e.g. Low Power Mode switched off).
    if (this.target > BASE_TARGET) {
      this.quick = this.ema < BASE_TARGET ? this.quick + dtSeconds : 0;
      if (this.quick > 2) { this.target = BASE_TARGET; this.quick = 0; }
    }

    // Judge the last step down: skip the resize hitch, then average the raw frame times for a second.
    if (this.trial) {
      const tr = this.trial;
      tr.t += dtSeconds;
      if (tr.t > 0.4) { tr.sum += ms; tr.n++; }
      if (tr.t < 1.4) return;
      this.trial = null;
      if (tr.sum / tr.n > tr.before * 0.9) {
        // Frame times snap to whole refreshes, so one step can fall short: try a second before deciding.
        if (tr.steps < 2 && this.ratio > this.min) {
          this.set(Math.max(this.min, this.ratio * 0.85));
          this.trial = { ...tr, steps: 2, t: 0, sum: 0, n: 0 };
          return;
        }
        // Fewer pixels didn't help: restore the sharpness and live with this frame rate.
        this.target = Math.max(this.target, tr.before * 1.12);
        this.ceiling = this.max; this.ceilingAge = 0;
        this.set(tr.from);
        this.ema = Math.min(this.ema, this.target);
        this.cooldown = 3;
      }
      return;
    }

    if (this.ema > this.target) {
      this.slow += dtSeconds; this.slowSum += ms; this.slowN++; this.fast = 0;
    } else {
      this.fast += dtSeconds; this.slow = 0; this.slowSum = 0; this.slowN = 0;
    }
    if (this.cooldown > 0) return;
    if (this.slow > 0.6 && this.ratio > this.min) {
      this.trial = { from: this.ratio, before: this.slowSum / this.slowN, steps: 1, t: 0, sum: 0, n: 0 };
      this.ceiling = this.ratio * 0.92; this.ceilingAge = 0;   // stay below the level that just failed
      this.set(Math.max(this.min, this.ratio * 0.85));
      this.cooldown = 1.2;
    } else if (this.fast > 4 && this.ratio < Math.min(this.max, this.ceiling * 0.999)) {
      this.set(Math.min(this.max, this.ceiling, this.ratio / 0.9));
      this.cooldown = 3;
    }
  }

  set(r) {
    this.ratio = Math.round(r * 100) / 100;
    this.slow = 0; this.fast = 0; this.slowSum = 0; this.slowN = 0;
    this.apply(this.ratio);
  }
}

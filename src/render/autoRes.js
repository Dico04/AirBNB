// Dynamic resolution: keeps the frame rate at the display's refresh by lowering the render pixel ratio
// when frames are missed and raising it again (up to the preset's ratio) when there is headroom.
// Works from real frame intervals, so it needs no GPU timer queries.
export class AutoResolution {
  constructor({ renderer, apply, maxRatio, minRatio = 0.55, enabled = true }) {
    this.renderer = renderer;
    this.apply = apply;              // (ratio) => resize renderer + post
    this.max = maxRatio;
    this.min = Math.min(minRatio, maxRatio);
    this.ratio = maxRatio;
    this.enabled = enabled;
    this.ema = 16.7;                 // smoothed frame time (ms)
    this.slow = 0;                   // seconds spent below target
    this.fast = 0;                   // seconds spent at target
    this.cooldown = 1.5;
    this.ceiling = maxRatio;         // where we last had to back off; relaxed over time
    this.ceilingAge = 0;
  }

  get scale() { return this.ratio / this.max; }

  update(dtSeconds) {
    if (!this.enabled) return;
    const ms = dtSeconds * 1000;
    if (ms <= 0 || ms > 250) return;                     // tab switches, hitches while loading
    this.ema += (ms - this.ema) * 0.08;
    const target = 19.0;                                 // 60 fps with ~12 % jitter allowance
    this.cooldown -= dtSeconds;
    this.ceilingAge += dtSeconds;
    if (this.ceilingAge > 30) { this.ceiling = this.max; this.ceilingAge = 0; }
    if (this.ema > target) { this.slow += dtSeconds; this.fast = 0; } else { this.fast += dtSeconds; this.slow = 0; }
    if (this.cooldown > 0) return;
    if (this.slow > 0.6 && this.ratio > this.min) {
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
    this.slow = 0; this.fast = 0;
    this.apply(this.ratio);
  }
}

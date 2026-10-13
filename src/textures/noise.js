// Small deterministic noise toolkit for canvas texture generation.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tileable 2D value noise on an integer lattice of size (gw, gh).
export class TileNoise {
  constructor(gw, gh, seed = 1) {
    this.gw = gw;
    this.gh = gh;
    const rand = mulberry32(seed);
    this.v = new Float32Array(gw * gh);
    for (let i = 0; i < this.v.length; i++) this.v[i] = rand();
  }
  // u, v in lattice units (wraps).
  sample(u, v) {
    const { gw, gh } = this;
    const x0 = Math.floor(u), y0 = Math.floor(v);
    const fx = u - x0, fy = v - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const xa = ((x0 % gw) + gw) % gw, xb = (xa + 1) % gw;
    const ya = ((y0 % gh) + gh) % gh, yb = (ya + 1) % gh;
    const a = this.v[ya * gw + xa], b = this.v[ya * gw + xb];
    const c = this.v[yb * gw + xa], d = this.v[yb * gw + xb];
    return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
  }
}

// Fractal sum of tileable noises. fu, fv are normalised texture coords in [0,1).
export class TileFbm {
  constructor(baseW, baseH, octaves = 4, seed = 1) {
    this.layers = [];
    for (let o = 0; o < octaves; o++) {
      const m = 1 << o;
      this.layers.push({ n: new TileNoise(baseW * m, baseH * m, seed * 131 + o * 17), w: baseW * m, h: baseH * m, amp: 1 / m });
    }
    this.norm = this.layers.reduce((s, l) => s + l.amp, 0);
  }
  sample(fu, fv) {
    let s = 0;
    for (const l of this.layers) s += l.n.sample(fu * l.w, fv * l.h) * l.amp;
    return s / this.norm;
  }
}

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, t) => a + (b - a) * t;

export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

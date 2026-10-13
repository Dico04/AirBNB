// Procedural PBR texture sets generated on canvas (fully offline, no image assets).
// Every generator returns { map, roughnessMap, normalMap, size: [metresU, metresV] }.
// Textures tile seamlessly; materials apply repeat = 1 / size because geometry UVs are in metres.

import * as THREE from 'three';
import { TileFbm, mulberry32, clamp01, lerp, hexToRgb } from './noise.js';

const cache = new Map();
let maxAnisotropy = 8;
export function setMaxAnisotropy(n) { maxAnisotropy = n; }

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(canvas, { color = false } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = maxAnisotropy;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

// Generic builder: gen(x, y, out) writes out.r/g/b (0..255), out.rough (0..1), out.h (height 0..1).
function buildSet(key, w, h, size, normalStrength, gen) {
  if (cache.has(key)) return cache.get(key);
  const col = new Uint8ClampedArray(w * h * 4);
  const rough = new Uint8ClampedArray(w * h * 4);
  const height = new Float32Array(w * h);
  const out = { r: 0, g: 0, b: 0, rough: 0.8, h: 0.5 };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out.rough = 0.8; out.h = 0.5;
      gen(x, y, out);
      const i = y * w + x, j = i * 4;
      col[j] = out.r; col[j + 1] = out.g; col[j + 2] = out.b; col[j + 3] = 255;
      const rv = Math.round(clamp01(out.rough) * 255);
      rough[j] = rv; rough[j + 1] = rv; rough[j + 2] = rv; rough[j + 3] = 255;
      height[i] = out.h;
    }
  }
  const nrm = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const ym = ((y - 1 + h) % h) * w, yp = ((y + 1) % h) * w, yc = y * w;
    for (let x = 0; x < w; x++) {
      const xm = (x - 1 + w) % w, xp = (x + 1) % w;
      const dx = (height[yc + xp] - height[yc + xm]) * normalStrength;
      const dy = (height[yp + x] - height[ym + x]) * normalStrength;
      // canvas y runs opposite to texture v (flipY), hence +dy.
      let nx = -dx, ny = dy, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l; ny /= l; nz /= l;
      const j = (yc + x) * 4;
      nrm[j] = (nx * 0.5 + 0.5) * 255;
      nrm[j + 1] = (ny * 0.5 + 0.5) * 255;
      nrm[j + 2] = (nz * 0.5 + 0.5) * 255;
      nrm[j + 3] = 255;
    }
  }
  const put = (data) => {
    const c = makeCanvas(w, h);
    c.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0);
    return c;
  };
  const set = {
    map: toTexture(put(col), { color: true }),
    roughnessMap: toTexture(put(rough)),
    normalMap: toTexture(put(nrm)),
    size,
  };
  cache.set(key, set);
  return set;
}

const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------------------------------------------------------------- oak planks
// Wide white-oiled oak planks. U = across planks (x), V = along planks.
export function oakPlanks({ base = '#cdb293', light = '#dcc3a4', dark = '#bfa27f', plankW = 0.20, planks = 10, lengthM = 4.0, px = 1024, seed = 7, key = 'oak' } = {}) {
  const w = px, h = Math.round(px * lengthM / (plankW * planks));
  const size = [plankW * planks, lengthM];
  const rand = mulberry32(seed);
  const cLight = hexToRgb(light), cDark = hexToRgb(dark), cBase = hexToRgb(base);
  // Per plank column: joint positions (fractions of V) and per-segment tint/offset.
  const cols = [];
  for (let p = 0; p < planks; p++) {
    const joints = [];
    let v = rand();
    const lens = [0.30, 0.40, 0.50, 0.60];
    while (joints.length < 4) {
      joints.push(v % 1);
      v += lens[Math.floor(rand() * lens.length)];
      if (v - joints[0] >= 1 - 0.25) break;
    }
    joints.sort((a, b) => a - b);
    const segs = joints.map(() => ({ tint: rand(), off: rand() * 50, knot: rand() < 0.45 ? { u: 0.2 + rand() * 0.6, v: rand(), r: 0.004 + rand() * 0.008 } : null }));
    cols.push({ joints, segs });
  }
  const grain = new TileFbm(planks * 14, 5, 4, seed + 1);
  const fine = new TileFbm(planks * 60, 24, 2, seed + 2);
  const blotch = new TileFbm(planks * 2, 3, 3, seed + 3);
  const plankPx = w / planks;
  return buildSet(`${key}-${px}`, w, h, size, 3.0, (x, y, o) => {
    const p = Math.floor(x / plankPx);
    const uLocal = (x - p * plankPx) / plankPx;          // 0..1 across plank
    const fv = y / h;
    const col = cols[p];
    // which segment
    let s = col.joints.length - 1;
    for (let k = 0; k < col.joints.length; k++) if (fv >= col.joints[k]) s = k;
    if (fv < col.joints[0]) s = col.joints.length - 1;
    const seg = col.segs[s];
    const fu = x / w;
    const g = grain.sample(fu, fv + seg.off);
    const f = fine.sample(fu, fv + seg.off * 0.37);
    const b = blotch.sample(fu, fv);
    // Long streaky grain with soft wavy lines.
    const lines = 0.5 + 0.5 * Math.sin((uLocal * 26 + g * 6 + seg.off) * Math.PI);
    let tone = 0.5 + (seg.tint - 0.5) * 0.42 + (g - 0.5) * 0.45 + (lines - 0.5) * 0.08 + (f - 0.5) * 0.10 + (b - 0.5) * 0.15;
    let c = tone > 0.5 ? mix3(cBase, cLight, (tone - 0.5) * 2) : mix3(cDark, cBase, tone * 2);
    let height = 0.5 + (g - 0.5) * 0.04 + (f - 0.5) * 0.02;
    let rough = 0.62 + (f - 0.5) * 0.12;
    // Knots
    if (seg.knot) {
      const du = (uLocal - seg.knot.u) * plankW;
      let dvv = fv - seg.knot.v; dvv -= Math.round(dvv);
      const dv = dvv * lengthM * 0.35;
      const d = Math.hypot(du, dv) / seg.knot.r;
      if (d < 3.5) {
        const k = Math.max(0, 1 - d / 3.5);
        const ring = 0.5 + 0.5 * Math.cos(d * 5.5);
        c = mix3(c, [c[0] * 0.62, c[1] * 0.55, c[2] * 0.48], k * k * (0.55 + 0.45 * ring));
        height -= k * 0.05;
      }
    }
    // Side joints (between planks) and end joints.
    const ex = Math.min(x - p * plankPx, (p + 1) * plankPx - 1 - x);
    let jd = 99;
    for (const jv of col.joints) {
      let d = Math.abs(fv - jv); d = Math.min(d, 1 - d);
      jd = Math.min(jd, d * h);
    }
    const edge = Math.min(ex, jd);
    if (edge < 1.0) { c = mix3(c, [70, 55, 42], 0.65); height = 0.15; rough = 0.95; }
    else if (edge < 2.5) { c = mix3(c, [c[0] * 0.9, c[1] * 0.88, c[2] * 0.85], 0.5); height = 0.42; }
    o.r = c[0]; o.g = c[1]; o.b = c[2]; o.rough = rough; o.h = height;
  });
}

// ---------------------------------------------------------------- porcelain tiles
export function tiles({ color = '#b5b2ae', grout = '#9c9995', tile = 0.60, count = 2, px = 1024, seed = 11, key = 'tiles' } = {}) {
  const size = [tile * count, tile * count];
  const c0 = hexToRgb(color), cg = hexToRgb(grout);
  const rand = mulberry32(seed);
  const tints = Array.from({ length: count * count }, () => (rand() - 0.5) * 0.05);
  const speck = new TileFbm(256, 256, 1, seed + 1);
  const cloud = new TileFbm(6, 6, 4, seed + 2);
  const tilePx = px / count;
  const groutPx = Math.max(2, Math.round(px * 0.003 / size[0]));
  return buildSet(`${key}-${px}`, px, px, size, 2.0, (x, y, o) => {
    const tx = Math.floor(x / tilePx), ty = Math.floor(y / tilePx);
    const lx = x - tx * tilePx, ly = y - ty * tilePx;
    const edge = Math.min(lx, ly, tilePx - 1 - lx, tilePx - 1 - ly);
    const fu = x / px, fv = y / px;
    if (edge < groutPx) {
      const n = speck.sample(fu, fv) - 0.5;
      o.r = cg[0] + n * 20; o.g = cg[1] + n * 20; o.b = cg[2] + n * 20;
      o.rough = 0.92; o.h = 0.2;
      return;
    }
    const t = tints[ty * count + tx];
    const n = (speck.sample(fu, fv) - 0.5) * 0.06 + (cloud.sample(fu, fv) - 0.5) * 0.06 + t;
    o.r = c0[0] * (1 + n); o.g = c0[1] * (1 + n); o.b = c0[2] * (1 + n);
    o.rough = 0.42 + (cloud.sample(fu, fv) - 0.5) * 0.1;
    o.h = edge < groutPx + 2 ? 0.45 : 0.5;
  });
}

// ---------------------------------------------------------------- plaster / render
export function plaster({ color = '#efede8', px = 512, sizeM = 2.0, amp = 0.014, bump = 0.6, rough = 0.92, seed = 21, key = 'plaster' } = {}) {
  const c0 = hexToRgb(color);
  const cloud = new TileFbm(5, 5, 5, seed);
  const fine = new TileFbm(128, 128, 2, seed + 1);
  return buildSet(`${key}-${color}-${px}`, px, px, [sizeM, sizeM], bump, (x, y, o) => {
    const fu = x / px, fv = y / px;
    const c = cloud.sample(fu, fv) - 0.5, f = fine.sample(fu, fv) - 0.5;
    const n = c * amp * 2 + f * amp;
    o.r = c0[0] * (1 + n); o.g = c0[1] * (1 + n); o.b = c0[2] * (1 + n);
    o.rough = rough + f * 0.05;
    o.h = 0.5 + f * 0.6 + c * 0.2;
  });
}

export function render({ color = '#e9e8e4', px = 512, sizeM = 3.0, seed = 31, key = 'render' } = {}) {
  const c0 = hexToRgb(color);
  const cloud = new TileFbm(6, 6, 5, seed);
  const fine = new TileFbm(220, 220, 2, seed + 1);
  const streak = new TileFbm(24, 2, 3, seed + 2);
  return buildSet(`${key}-${color}-${px}`, px, px, [sizeM, sizeM], 2.2, (x, y, o) => {
    const fu = x / px, fv = y / px;
    const c = cloud.sample(fu, fv) - 0.5, f = fine.sample(fu, fv) - 0.5, s = streak.sample(fu, fv) - 0.5;
    const n = c * 0.05 + f * 0.035 + Math.min(0, s) * 0.06;
    o.r = c0[0] * (1 + n); o.g = c0[1] * (1 + n); o.b = c0[2] * (1 + n * 1.1);
    o.rough = 0.95;
    o.h = 0.5 + f * 0.9 + c * 0.1;
  });
}

// ---------------------------------------------------------------- weathered decking
// U = along boards, V = across boards.
export function decking({ color = '#a8a196', boardW = 0.14, boards = 16, gap = 0.006, px = 1024, seed = 41, key = 'deck' } = {}) {
  const sizeV = boardW * boards, sizeU = sizeV;
  const c0 = hexToRgb(color), cBrown = [143, 127, 108], cGap = [52, 50, 47], cGreen = [128, 134, 112];
  const rand = mulberry32(seed);
  const rows = Array.from({ length: boards }, () => {
    const j = rand();
    return { joint: j, joint2: (j + 0.45 + rand() * 0.2) % 1, tint: rand(), tint2: rand(), off: rand() * 40 };
  });
  const grain = new TileFbm(6, boards * 10, 4, seed + 1);
  const blotch = new TileFbm(4, 4, 4, seed + 2);
  const fine = new TileFbm(160, 160, 2, seed + 3);
  const boardPx = px / boards;
  const gapPx = Math.max(2, Math.round(px * gap / sizeV));
  return buildSet(`${key}-${px}`, px, px, [sizeU, sizeV], 4.0, (x, y, o) => {
    const r = Math.floor(y / boardPx);
    const ly = y - r * boardPx;
    const across = ly / boardPx;
    const row = rows[r];
    const fu = x / px, fv = y / px;
    const inSecond = (fu - row.joint + 1) % 1 > (row.joint2 - row.joint + 1) % 1;
    const tint = inSecond ? row.tint2 : row.tint;
    const g = grain.sample(fu + row.off, fv);
    const b = blotch.sample(fu, fv);
    const f = fine.sample(fu, fv);
    // ribbed grooves across the board width (7 per board)
    const groove = 0.5 + 0.5 * Math.cos(across * Math.PI * 2 * 7);
    let c = mix3(c0, cBrown, clamp01((tint - 0.55) * 1.6 + (b - 0.5) * 0.8));
    c = mix3(c, cGreen, clamp01((b - 0.62) * 2.5) * 0.4);
    const k = 1 + (g - 0.5) * 0.22 + (f - 0.5) * 0.10 - (1 - groove) * 0.07 + (tint - 0.5) * 0.10;
    c = [c[0] * k, c[1] * k, c[2] * k];
    let height = 0.5 + groove * 0.12 + (g - 0.5) * 0.05;
    let rough = 0.86 + (f - 0.5) * 0.1;
    const edgeY = Math.min(ly, boardPx - 1 - ly);
    let dj = Math.min(Math.abs(fu - row.joint), 1 - Math.abs(fu - row.joint), Math.abs(fu - row.joint2), 1 - Math.abs(fu - row.joint2)) * px;
    if (edgeY < gapPx || dj < 1.2) { c = cGap; height = 0.0; rough = 1; }
    else if (edgeY < gapPx + 2) { height = 0.35; c = [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85]; }
    o.r = c[0]; o.g = c[1]; o.b = c[2]; o.rough = rough; o.h = height;
  });
}

// ---------------------------------------------------------------- white painted parapet boards
// U = along boards (horizontal), V = vertical stack.
export function paintedBoards({ color = '#e6e4df', boardH = 0.14, boards = 8, px = 512, seed = 51, key = 'boards' } = {}) {
  const sizeV = boardH * boards;
  const c0 = hexToRgb(color);
  const grain = new TileFbm(4, boards * 12, 3, seed);
  const dirt = new TileFbm(5, 5, 4, seed + 1);
  const boardPx = px / boards;
  return buildSet(`${key}-${px}`, px, px, [sizeV, sizeV], 3.0, (x, y, o) => {
    const ly = y % boardPx;
    const fu = x / px, fv = y / px;
    const g = grain.sample(fu, fv), d = dirt.sample(fu, fv);
    const k = 1 + (g - 0.5) * 0.035 - Math.max(0, d - 0.55) * 0.12;
    let c = [c0[0] * k, c0[1] * k, c0[2] * k];
    let height = 0.5 + (g - 0.5) * 0.08;
    // V-joint at the top of each board
    if (ly < 2) { c = [c[0] * 0.72, c[1] * 0.72, c[2] * 0.72]; height = 0.1; }
    else if (ly < 5) { height = 0.1 + (ly - 2) * 0.13; }
    o.r = c[0]; o.g = c[1]; o.b = c[2]; o.rough = 0.72 + (g - 0.5) * 0.1; o.h = height;
  });
}

// ---------------------------------------------------------------- oak veneer (door leaves), grain along V
export function oakVeneer({ color = '#bfa285', px = 512, sizeM = [0.9, 2.2], seed = 61, key = 'veneer' } = {}) {
  const c0 = hexToRgb(color);
  const h = Math.round(px * sizeM[1] / sizeM[0]);
  const grain = new TileFbm(70, 4, 4, seed);
  const fine = new TileFbm(300, 30, 2, seed + 1);
  const cath = new TileFbm(6, 2, 3, seed + 2);
  return buildSet(`${key}-${px}`, px, h, sizeM, 1.5, (x, y, o) => {
    const fu = x / px, fv = y / h;
    const g = grain.sample(fu, fv), f = fine.sample(fu, fv), c = cath.sample(fu, fv);
    const lines = 0.5 + 0.5 * Math.sin((fu * 90 + c * 9 + g * 3) * Math.PI);
    const k = 1 + (g - 0.5) * 0.28 + (lines - 0.5) * 0.08 + (f - 0.5) * 0.06;
    o.r = c0[0] * k; o.g = c0[1] * k; o.b = c0[2] * k * 0.98;
    o.rough = 0.55 + (f - 0.5) * 0.08;
    o.h = 0.5 + (lines - 0.5) * 0.04 + (f - 0.5) * 0.04;
  });
}

// ---------------------------------------------------------------- stone-ish surfaces
export function bluestone({ color = '#7f7a74', px = 256, sizeM = 0.6, seed = 71, key = 'bluestone' } = {}) {
  const c0 = hexToRgb(color);
  const n1 = new TileFbm(8, 8, 4, seed), n2 = new TileFbm(90, 90, 1, seed + 1);
  return buildSet(`${key}-${px}`, px, px, [sizeM, sizeM], 1.0, (x, y, o) => {
    const fu = x / px, fv = y / px;
    const a = n1.sample(fu, fv) - 0.5, b = n2.sample(fu, fv);
    let k = 1 + a * 0.12 + (b - 0.5) * 0.08;
    if (b > 0.83) k += 0.35;
    o.r = c0[0] * k; o.g = c0[1] * k; o.b = c0[2] * k * 1.03;
    o.rough = 0.48 + a * 0.1; o.h = 0.5 + (b - 0.5) * 0.1;
  });
}

export function terrazzo({ color = '#8f8b86', px = 512, sizeM = 1.0, seed = 81, key = 'terrazzo' } = {}) {
  const c0 = hexToRgb(color);
  const chips = new TileFbm(70, 70, 1, seed), chips2 = new TileFbm(45, 45, 1, seed + 1), cloud = new TileFbm(4, 4, 3, seed + 2);
  return buildSet(`${key}-${px}`, px, px, [sizeM, sizeM], 0.5, (x, y, o) => {
    const fu = x / px, fv = y / px;
    const a = chips.sample(fu, fv), b = chips2.sample(fu, fv), c = cloud.sample(fu, fv) - 0.5;
    let col = c0.map((v) => v * (1 + c * 0.08));
    if (a > 0.8) col = [205, 200, 192];
    else if (b > 0.84) col = [60, 58, 56];
    o.r = col[0]; o.g = col[1]; o.b = col[2]; o.rough = 0.38; o.h = 0.5;
  });
}

export function gravel({ color = '#4a4b4c', px = 256, sizeM = 1.0, seed = 91, key = 'gravel' } = {}) {
  const c0 = hexToRgb(color);
  const n = new TileFbm(120, 120, 2, seed);
  return buildSet(`${key}-${px}`, px, px, [sizeM, sizeM], 3.0, (x, y, o) => {
    const v = n.sample(x / px, y / px);
    const k = 0.7 + v * 0.7;
    o.r = c0[0] * k; o.g = c0[1] * k; o.b = c0[2] * k; o.rough = 1; o.h = v;
  });
}

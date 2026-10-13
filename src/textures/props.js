// Procedural textures for furniture and props (woods, fabrics, weaves, ceramics, metal, pictures).
import * as THREE from 'three';
import { buildSet, mix3 } from './procedural.js';
import { TileFbm, mulberry32, clamp01, hexToRgb } from './noise.js';

const cache = new Map();
const once = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };

function canvasTex(canvas, color = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------------------------------------------------------------- generic wood board (grain along U)
export function wood({ key, base = '#b8743f', dark, light, sizeM = [1.0, 0.25], px = 512, knots = 0, ring = 22, streak = 0.3, rough = 0.5, seed = 3 }) {
  return once(`wood-${key}`, () => {
    const w = px, h = Math.max(32, Math.round(px * sizeM[1] / sizeM[0]));
    const c0 = hexToRgb(base);
    const cd = dark ? hexToRgb(dark) : c0.map((v) => v * 0.72);
    const cl = light ? hexToRgb(light) : c0.map((v) => Math.min(255, v * 1.15));
    const rand = mulberry32(seed);
    const warp = new TileFbm(3, 2, 3, seed + 1), g1 = new TileFbm(4, 24, 4, seed + 2), fine = new TileFbm(60, 90, 2, seed + 3);
    const ks = Array.from({ length: knots }, () => ({ u: rand(), v: 0.15 + rand() * 0.7, r: 0.012 + rand() * 0.02 }));
    return buildSet(`wood-${key}`, w, h, sizeM, 1.6, (x, y, o) => {
      const fu = x / w, fv = y / h;
      let vv = fv + (warp.sample(fu, fv) - 0.5) * 0.25;
      let ringF = 0;
      for (const k of ks) {
        let du = (fu - k.u) * sizeM[0]; du -= Math.round(du / sizeM[0]) * sizeM[0];
        const dv = (fv - k.v) * sizeM[1];
        const d = Math.hypot(du * 0.45, dv);
        const infl = Math.exp(-d / (k.r * 2.2));
        vv += infl * 0.06 * Math.sign(dv || 1);
        if (d < k.r) ringF = Math.max(ringF, 1 - d / k.r);
      }
      const rings = 0.5 + 0.5 * Math.sin(vv * ring * Math.PI * 2);
      const s = g1.sample(fu, vv), f = fine.sample(fu, fv);
      let t = 0.5 + (s - 0.5) * 0.8 + (rings - 0.5) * streak;
      let c = t > 0.5 ? mix3(c0, cl, (t - 0.5) * 2 * 0.8) : mix3(cd, c0, 0.2 + t * 1.6);
      c = c.map((v) => v * (1 + (f - 0.5) * 0.08));
      if (ringF > 0) c = mix3(c, cd.map((v) => v * 0.6), ringF * 0.85);
      o.r = c[0]; o.g = c[1]; o.b = c[2];
      o.rough = rough + (f - 0.5) * 0.1;
      o.h = 0.5 + (rings - 0.5) * 0.05 + (f - 0.5) * 0.05 - ringF * 0.05;
    });
  });
}

// ---------------------------------------------------------------- walnut chevron/herringbone countertop
export function walnutHerringbone({ base = '#7a4a32' } = {}) {
  return once('walnut-hb', () => {
    const px = 1024, sizeM = [0.80, 0.80];
    const C = 0.12, W = 0.06;            // strip width, block step → planks ~0.17 × 0.042
    const c0 = hexToRgb(base), cd = [92, 54, 36], cl = [150, 98, 68];
    const rand = mulberry32(5);
    const tints = new Float32Array(64 * 64).map(() => rand());
    const grain = new TileFbm(8, 160, 3, 7), fine = new TileFbm(120, 120, 2, 8);
    return buildSet('walnut-hb', px, px, sizeM, 2.0, (x, y, o) => {
      const mx = (x / px) * sizeM[0], my = (y / px) * sizeM[1];
      const col = Math.floor(mx / C);
      const u = mx - col * C;
      const slant = col % 2 === 0 ? 1 : -1;
      let vp = my + slant * u;
      vp = ((vp % sizeM[1]) + sizeM[1]) % sizeM[1];
      const b = Math.floor(vp / W);
      const lv = vp - b * W;
      const tint = tints[(col % 64) * 64 + (b % 64)];
      // grain runs along the plank (diagonal)
      const ga = (u * 0.7071 - slant * lv * 0.7071), gb = (lv * 0.7071 + slant * u * 0.7071);
      const g = grain.sample(((gb + col * 0.37 + b * 0.11) / sizeM[0]) % 1 + 1, ((ga + b * 0.53) / sizeM[1]) % 1 + 1);
      const streaks = 0.5 + 0.5 * Math.sin((gb * 140 + g * 9));
      let t = 0.5 + (tint - 0.5) * 0.45 + (g - 0.5) * 0.6 + (streaks - 0.5) * 0.10;
      let c = t > 0.5 ? mix3(c0, cl, (t - 0.5) * 1.6) : mix3(cd, c0, t * 2);
      const f = fine.sample(x / px, y / px);
      c = c.map((v) => v * (1 + (f - 0.5) * 0.06));
      let h = 0.5 + (g - 0.5) * 0.04;
      const edge = Math.min(u, C - u, lv, W - lv);
      if (edge < 0.0006) { c = mix3(c, [52, 31, 20], 0.55); h = 0.35; }
      o.r = c[0]; o.g = c[1]; o.b = c[2]; o.rough = 0.42 + (f - 0.5) * 0.08 + (edge < 0.0006 ? 0.3 : 0); o.h = h;
    });
  });
}

// ---------------------------------------------------------------- fabrics (greyscale-ish, tinted by material colour)
export function velvet() {
  return once('velvet', () => {
    const n1 = new TileFbm(6, 6, 4, 11), n2 = new TileFbm(160, 160, 2, 12);
    return buildSet('velvet', 512, 512, [0.6, 0.6], 1.2, (x, y, o) => {
      const fu = x / 512, fv = y / 512;
      const a = n1.sample(fu, fv), b = n2.sample(fu, fv);
      const v = 228 * (1 + (a - 0.5) * 0.10 + (b - 0.5) * 0.06);
      o.r = o.g = o.b = v; o.rough = 0.88; o.h = 0.5 + (b - 0.5) * 0.5 + (a - 0.5) * 0.4;
    });
  });
}

export function linen({ key = 'linen', sizeM = 0.12, slub = 1 } = {}) {
  return once(key, () => {
    const px = 256, threads = 48;
    const sl = new TileFbm(2, 48, 2, 21), sl2 = new TileFbm(48, 2, 2, 22), n = new TileFbm(90, 90, 1, 23);
    return buildSet(key, px, px, [sizeM, sizeM], 2.2, (x, y, o) => {
      const fu = x / px, fv = y / px;
      const wx = 0.5 + 0.5 * Math.cos(fu * threads * Math.PI * 2);
      const wy = 0.5 + 0.5 * Math.cos(fv * threads * Math.PI * 2);
      const over = ((Math.floor(fu * threads) + Math.floor(fv * threads)) & 1) ? wx : wy;
      const s = (sl.sample(fu, fv) - 0.5) * slub + (sl2.sample(fu, fv) - 0.5) * slub;
      const v = 232 * (0.9 + over * 0.08 + s * 0.08 + (n.sample(fu, fv) - 0.5) * 0.05);
      o.r = o.g = o.b = v; o.rough = 0.92; o.h = 0.4 + over * 0.4 + s * 0.2;
    });
  });
}

// Woven basket (seagrass): horizontal weavers over vertical stakes.
export function basketWeave() {
  return once('basket', () => {
    const px = 256, rows = 18, cols = 14;
    const n = new TileFbm(40, 40, 2, 31);
    return buildSet('basket', px, px, [0.18, 0.18], 3.0, (x, y, o) => {
      const fu = x / px, fv = y / px;
      const r = Math.floor(fv * rows), c = Math.floor(fu * cols);
      const lv = fv * rows - r, lu = fu * cols - c;
      const over = (r + c) & 1;
      const bulge = over ? Math.sin(lu * Math.PI) : Math.sin(lv * Math.PI) * 0.6;
      const strand = Math.sin(lv * Math.PI);
      const t = n.sample(fu, fv);
      const k = 0.62 + 0.38 * strand * (0.7 + 0.3 * bulge) + (t - 0.5) * 0.2;
      o.r = 200 * k; o.g = 172 * k; o.b = 132 * k; o.rough = 0.85; o.h = strand * 0.6 + bulge * 0.4;
    });
  });
}

// Rattan / straw fibres along U.
export function fibres({ key = 'fibres', base = '#c8a57e' } = {}) {
  return once(key, () => {
    const c0 = hexToRgb(base);
    const n = new TileFbm(2, 90, 3, 41), f = new TileFbm(30, 200, 1, 42);
    return buildSet(key, 256, 256, [0.2, 0.2], 1.5, (x, y, o) => {
      const fu = x / 256, fv = y / 256;
      const a = n.sample(fu, fv), b = f.sample(fu, fv);
      const k = 0.85 + (a - 0.5) * 0.35 + (b - 0.5) * 0.15;
      o.r = c0[0] * k; o.g = c0[1] * k; o.b = c0[2] * k; o.rough = 0.7; o.h = 0.5 + (a - 0.5) * 0.4;
    });
  });
}

export function cork() {
  return once('cork', () => {
    const n = new TileFbm(80, 80, 2, 51), m = new TileFbm(8, 8, 3, 52);
    return buildSet('cork', 256, 256, [0.25, 0.25], 2.0, (x, y, o) => {
      const fu = x / 256, fv = y / 256;
      const a = n.sample(fu, fv), b = m.sample(fu, fv);
      const k = 0.75 + (a - 0.5) * 0.7 + (b - 0.5) * 0.15;
      o.r = 154 * k; o.g = 122 * k; o.b = 90 * k; o.rough = 0.95; o.h = a;
    });
  });
}

// Ceramic glaze / clay: mottled with optional speckles.
export function ceramic({ key, base, speckle = 0, mottle = 0.08, rough = 0.6, sizeM = 0.3 }) {
  return once(`ceramic-${key}`, () => {
    const c0 = hexToRgb(base);
    const m = new TileFbm(5, 5, 4, 61), s = new TileFbm(120, 120, 1, 62);
    return buildSet(`ceramic-${key}`, 256, 256, [sizeM, sizeM], 0.8, (x, y, o) => {
      const fu = x / 256, fv = y / 256;
      const a = m.sample(fu, fv), b = s.sample(fu, fv);
      let k = 1 + (a - 0.5) * mottle * 2;
      if (speckle && b > 1 - speckle) k *= 0.45;
      o.r = c0[0] * k; o.g = c0[1] * k; o.b = c0[2] * k; o.rough = rough + (a - 0.5) * 0.15; o.h = 0.5 + (a - 0.5) * 0.2;
    });
  });
}

export function brushedMetal() {
  return once('brushed', () => {
    const n = new TileFbm(1, 220, 2, 71), m = new TileFbm(3, 3, 3, 72);
    return buildSet('brushed', 256, 256, [0.3, 0.3], 0.6, (x, y, o) => {
      const fu = x / 256, fv = y / 256;
      const a = n.sample(fu, fv), b = m.sample(fu, fv);
      const v = 200 + (a - 0.5) * 30 + (b - 0.5) * 12;
      o.r = o.g = o.b = v; o.rough = 0.32 + (a - 0.5) * 0.12; o.h = a;
    });
  });
}

// Octagonal cane webbing with see-through holes (use alphaTest).
export function caneWebbing() {
  return once('cane', () => {
    const px = 256, c = mk(px, px), g = c.getContext('2d');
    g.clearRect(0, 0, px, px);
    const strand = (x0, y0, x1, y1, w) => {
      for (const [ox, oy] of [[0, 0], [px, 0], [-px, 0], [0, px], [0, -px], [px, px], [-px, -px], [px, -px], [-px, px]]) {
        const grd = g.createLinearGradient(x0 + ox, y0 + oy, x1 + ox, y1 + oy);
        grd.addColorStop(0, '#d8b583'); grd.addColorStop(0.5, '#e8cb98'); grd.addColorStop(1, '#d4ae7c');
        g.strokeStyle = grd; g.lineWidth = w; g.lineCap = 'butt';
        g.beginPath(); g.moveTo(x0 + ox, y0 + oy); g.lineTo(x1 + ox, y1 + oy); g.stroke();
      }
    };
    const n = 4, step = px / n;
    for (let i = 0; i < n; i++) {
      strand(0, i * step + step / 2, px, i * step + step / 2, step * 0.22);
      strand(i * step + step / 2, 0, i * step + step / 2, px, step * 0.22);
    }
    for (let i = -n; i < 2 * n; i++) {
      strand(i * step, 0, i * step + px, px, step * 0.16);
      strand(i * step, px, i * step + px, 0, step * 0.16);
    }
    const map = canvasTex(c);
    map.repeat.set(1 / 0.07, 1 / 0.07);
    return { map, size: [0.07, 0.07] };
  });
}

// Macramé: diamond lattice of knotted cords with gaps (alphaTest).
export function macrame() {
  return once('macrame', () => {
    const px = 256, c = mk(px, px), g = c.getContext('2d');
    g.clearRect(0, 0, px, px);
    const cord = (x0, y0, x1, y1, w) => {
      for (const [ox, oy] of [[0, 0], [px, 0], [-px, 0], [0, px], [0, -px]]) {
        g.strokeStyle = '#f1ebe1'; g.lineWidth = w; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0 + ox, y0 + oy); g.lineTo(x1 + ox, y1 + oy); g.stroke();
        g.strokeStyle = 'rgba(160,150,135,0.5)'; g.lineWidth = w * 0.18;
        g.beginPath(); g.moveTo(x0 + ox, y0 + oy); g.lineTo(x1 + ox, y1 + oy); g.stroke();
      }
    };
    const n = 4, s = px / n;
    for (let i = -n; i <= 2 * n; i++) { cord(i * s, 0, i * s + px, px, 9); cord(i * s, px, i * s + px, 0, 9); }
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
      g.fillStyle = '#f6f1e8';
      g.beginPath(); g.ellipse(i * s, j * s, 13, 10, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(150,140,125,0.35)';
      g.beginPath(); g.ellipse(i * s, j * s + 3, 9, 4, 0, 0, Math.PI * 2); g.fill();
    }
    const map = canvasTex(c);
    map.repeat.set(1 / 0.12, 1 / 0.12);
    return { map, size: [0.12, 0.12] };
  });
}

// Sand throw with black tufted strokes (one non-repeating image for the whole throw).
export function throwMotif(base = '#d9c3a0') {
  return once('throw', () => {
    const w = 1024, h = 768, c = mk(w, h), g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const rand = mulberry32(81);
    for (let i = 0; i < 9000; i++) { // slubby weave
      g.fillStyle = `rgba(${rand() < 0.5 ? '255,250,235' : '150,125,95'},${0.05 + rand() * 0.08})`;
      g.fillRect(rand() * w, rand() * h, 2 + rand() * 18, 1.5);
    }
    const tuft = (pts, width) => {
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = k === 0 ? '#151414' : k === 1 ? 'rgba(45,42,40,0.9)' : 'rgba(0,0,0,0.6)';
        g.lineWidth = width * (1 - k * 0.25);
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x + (rand() - 0.5) * 2, y + (rand() - 0.5) * 2) : g.moveTo(x, y)));
        g.stroke();
      }
      // tufted texture along the stroke: small light flecks
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / 3);
        for (let j = 0; j < n; j++) {
          const t = j / n;
          g.fillStyle = 'rgba(90,86,80,0.55)';
          g.beginPath(); g.arc(x0 + (x1 - x0) * t + (rand() - 0.5) * width * 0.6, y0 + (y1 - y0) * t + (rand() - 0.5) * width * 0.6, 1.6, 0, Math.PI * 2); g.fill();
        }
      }
    };
    // Abstract strokes like the photo (an asterisk-like crossing plus an L-shape).
    tuft([[180, 120], [300, 360], [360, 520]], 22);
    tuft([[60, 470], [260, 420], [520, 380]], 22);
    tuft([[610, 140], [640, 330], [760, 380], [940, 330]], 22);
    const map = canvasTex(c);
    return { map };
  });
}

// ---------------------------------------------------------------- pictures (canvas drawings)
export function coralPalmPrint() {
  return once('coral-print', () => {
    const w = 300, h = 400, c = mk(w, h), g = c.getContext('2d');
    g.fillStyle = '#e48c78'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ef9c86'; g.fillRect(30, 250, 90, 130); g.fillRect(170, 280, 100, 100);
    g.fillStyle = '#d97f6c'; g.fillRect(120, 300, 50, 80);
    // trunk
    g.strokeStyle = '#7a5a48'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(150, 360); g.quadraticCurveTo(146, 260, 152, 175); g.stroke();
    // fronds (yucca / dracaena rosette)
    const rand = mulberry32(91);
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.7;
      const L = 55 + rand() * 50;
      const cx = 152, cy = 172;
      const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L * 0.85;
      g.strokeStyle = rand() < 0.5 ? '#5e8a6a' : '#6f9c78';
      g.lineWidth = 6 + rand() * 4;
      g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo((cx + ex) / 2, (cy + ey) / 2 - 12, ex, ey); g.stroke();
    }
    return canvasTex(c);
  });
}

export function pencilPortrait() {
  return once('portrait', () => {
    const w = 250, h = 340, c = mk(w, h), g = c.getContext('2d');
    g.fillStyle = '#eee9e0'; g.fillRect(0, 0, w, h);
    const rand = mulberry32(101);
    g.strokeStyle = 'rgba(60,58,56,0.55)'; g.lineWidth = 1;
    // hair mass (hatching)
    for (let i = 0; i < 260; i++) {
      const a = Math.PI * (0.9 + rand() * 1.2);
      const r = 62 + rand() * 18;
      const x = 125 + Math.cos(a) * r * 0.9, y = 150 + Math.sin(a) * r;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rand() - 0.5) * 30, y + 20 + rand() * 45); g.stroke();
    }
    // face oval & features (generic, non-identifiable)
    g.strokeStyle = 'rgba(55,52,50,0.75)'; g.lineWidth = 1.4;
    g.beginPath(); g.ellipse(125, 165, 44, 58, 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(103, 155); g.quadraticCurveTo(110, 150, 117, 155); g.stroke();
    g.beginPath(); g.moveTo(133, 155); g.quadraticCurveTo(140, 150, 147, 155); g.stroke();
    g.beginPath(); g.moveTo(125, 160); g.lineTo(121, 185); g.lineTo(128, 187); g.stroke();
    g.beginPath(); g.moveTo(112, 202); g.quadraticCurveTo(125, 208, 138, 202); g.stroke();
    // shading on one side
    g.strokeStyle = 'rgba(70,68,66,0.25)';
    for (let i = 0; i < 70; i++) { const y = 125 + i * 1.3; g.beginPath(); g.moveTo(84, y); g.lineTo(98, y + 6); g.stroke(); }
    // neck & shoulders
    g.strokeStyle = 'rgba(55,52,50,0.6)';
    g.beginPath(); g.moveTo(108, 220); g.lineTo(104, 250); g.quadraticCurveTo(70, 265, 50, 300); g.stroke();
    g.beginPath(); g.moveTo(142, 220); g.lineTo(146, 250); g.quadraticCurveTo(180, 265, 200, 300); g.stroke();
    return canvasTex(c);
  });
}

export function handmadePaper() {
  return once('paper', () => {
    const w = 256, c = mk(w, w), g = c.getContext('2d');
    g.fillStyle = '#e9e4da'; g.fillRect(0, 0, w, w);
    const rand = mulberry32(111);
    for (let i = 0; i < 2600; i++) {
      g.strokeStyle = `rgba(${rand() < 0.5 ? '255,255,250' : '170,160,145'},${0.15 + rand() * 0.25})`;
      g.lineWidth = 0.6 + rand();
      const x = rand() * w, y = rand() * w, a = rand() * Math.PI * 2, l = 3 + rand() * 10;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    return canvasTex(c);
  });
}

// Radial straw / raffia wall hanging (RGBA, use alphaTest).
export function strawDisc(base = '#c9a574') {
  return once('straw-disc', () => {
    const w = 512, c = mk(w, w), g = c.getContext('2d');
    g.clearRect(0, 0, w, w);
    const rand = mulberry32(121), cx = w / 2, cy = w / 2;
    const col = hexToRgb(base);
    for (let i = 0; i < 2600; i++) {
      const a = rand() * Math.PI * 2;
      const r0 = 20 + rand() * 60, r1 = 150 + rand() * 100;
      const k = 0.75 + rand() * 0.5;
      g.strokeStyle = `rgba(${col[0] * k | 0},${col[1] * k | 0},${col[2] * k | 0},${0.55 + rand() * 0.45})`;
      g.lineWidth = 1 + rand() * 2;
      const bend = (rand() - 0.5) * 0.25;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.quadraticCurveTo(cx + Math.cos(a + bend) * (r0 + r1) / 2, cy + Math.sin(a + bend) * (r0 + r1) / 2, cx + Math.cos(a + bend * 2) * r1, cy + Math.sin(a + bend * 2) * r1);
      g.stroke();
    }
    // braided centre rings
    for (let r = 26; r < 70; r += 7) {
      g.strokeStyle = `rgba(${col[0] * 0.85 | 0},${col[1] * 0.85 | 0},${col[2] * 0.8 | 0},0.95)`;
      g.lineWidth = 5;
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    }
    return canvasTex(c);
  });
}

export function clamp(v) { return clamp01(v); }

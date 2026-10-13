// City textures (canvas-drawn): repeating façade tiles with matching night-window emissive maps,
// church brick with white stone bands, slate, roof bitumen, the boulevard road surface, a poster.
import * as THREE from 'three';
import { mulberry32 } from './noise.js';

const cache = new Map();
const once = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function tex(canvas, color = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
const rgb = (hex, k = 1) => {
  const c = new THREE.Color(hex);
  return `rgb(${Math.round(Math.min(1, c.r * k) * 255)},${Math.round(Math.min(1, c.g * k) * 255)},${Math.round(Math.min(1, c.b * k) * 255)})`;
};

// Façade styles: wall colour, window size/pitch, frame colour, extras.
export const FACADE_STYLES = {
  'render-white': { wall: '#e8e6e0', frame: '#f4f4f2', bay: 3.0, floor: 3.1, win: [1.5, 1.55], sill: 0.95, lit: 0.34 },
  'render-cream': { wall: '#e3d6bd', frame: '#f1ece0', bay: 2.6, floor: 3.6, win: [1.1, 2.15], sill: 0.75, lit: 0.3, cornice: true },
  'render-grey':  { wall: '#c9c6bf', frame: '#e8e8e6', bay: 3.2, floor: 3.0, win: [1.7, 1.5], sill: 0.9, lit: 0.3 },
  brick:          { wall: '#8d4a3a', frame: '#efeeea', bay: 2.8, floor: 3.0, win: [1.25, 1.65], sill: 0.85, lit: 0.32, brick: true },
  'brick-dark':   { wall: '#6b4338', frame: '#d9d6cf', bay: 3.0, floor: 3.0, win: [1.4, 1.6], sill: 0.85, lit: 0.3, brick: true },
  'office-fins':  { wall: '#ecebe7', frame: '#5d6772', bay: 1.2, floor: 3.4, win: [1.2, 1.9], sill: 0.95, lit: 0.42, fins: true },
  'office-grid':  { wall: '#e4e3df', frame: '#4f5a64', bay: 1.8, floor: 3.3, win: [1.35, 1.7], sill: 0.9, lit: 0.45 },
  glass:          { wall: '#7f909c', frame: '#3d4750', bay: 1.5, floor: 3.4, win: [1.42, 3.2], sill: 0.1, lit: 0.4, curtain: true },
};

// One façade tile: `bays` × `floors` windows. Returns { map, emissiveMap, size:[m,m] }.
export function facade(style, seed = 1) {
  return once(`facade-${style}-${seed}`, () => {
    const S = FACADE_STYLES[style];
    const bays = S.fins ? 12 : 8, floors = 6, ppm = 16;
    const W = Math.round(bays * S.bay * ppm), H = Math.round(floors * S.floor * ppm);
    const c = mk(W, H), g = c.getContext('2d');
    const e = mk(W, H), ge = e.getContext('2d');
    const rand = mulberry32(seed * 97 + style.length);
    g.fillStyle = rgb(S.wall); g.fillRect(0, 0, W, H);
    ge.fillStyle = '#000'; ge.fillRect(0, 0, W, H);
    // wall texture: soft vertical weathering streaks + brick courses
    for (let i = 0; i < W; i += 2) {
      g.fillStyle = `rgba(0,0,0,${(rand() * 0.035).toFixed(3)})`;
      g.fillRect(i, 0, 2, H);
    }
    if (S.brick) {
      for (let y = 0; y < H; y += 2) {
        g.fillStyle = `rgba(255,255,255,${0.04 + rand() * 0.03})`; g.fillRect(0, y, W, 1);
        for (let x = (y / 2) % 2 ? 0 : 2; x < W; x += 4) { g.fillStyle = `rgba(${rand() < 0.5 ? '0,0,0' : '120,40,20'},${(rand() * 0.12).toFixed(3)})`; g.fillRect(x, y, 4, 2); }
      }
    }
    const [ww, wh] = S.win;
    for (let f = 0; f < floors; f++) {
      const y0 = H - (f * S.floor + S.sill + wh) * ppm;
      if (S.cornice) { g.fillStyle = rgb(S.wall, 1.08); g.fillRect(0, H - (f + 1) * S.floor * ppm, W, 3); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, H - (f + 1) * S.floor * ppm + 3, W, 2); }
      if (S.fins || S.curtain) {   // continuous spandrel line
        g.fillStyle = rgb(S.wall, 0.94); g.fillRect(0, H - (f * S.floor + S.sill) * ppm, W, 2);
      }
      for (let b = 0; b < bays; b++) {
        const x0 = (b * S.bay + (S.bay - ww) / 2) * ppm;
        const w = ww * ppm, h = wh * ppm;
        // glass: sky reflection gradient with random tint, sometimes curtains/blinds
        const sky = g.createLinearGradient(0, y0, 0, y0 + h);
        const k = 0.75 + rand() * 0.3;
        sky.addColorStop(0, rgb('#8fa2b3', k)); sky.addColorStop(1, rgb('#3e4a55', k));
        g.fillStyle = sky; g.fillRect(x0, y0, w, h);
        const r = rand();
        if (r < 0.22) { g.fillStyle = rgb(['#e9e2d4', '#d8d2c8', '#f2efe8'][Math.floor(rand() * 3)], 0.95); g.fillRect(x0, y0, w, h * (0.25 + rand() * 0.6)); }
        else if (r < 0.32) { g.fillStyle = 'rgba(20,20,22,0.55)'; g.fillRect(x0, y0, w, h); }
        // frame + mullion + sill
        g.strokeStyle = rgb(S.frame); g.lineWidth = Math.max(1.5, ppm * 0.07);
        g.strokeRect(x0, y0, w, h);
        if (!S.curtain) { g.beginPath(); g.moveTo(x0 + w / 2, y0); g.lineTo(x0 + w / 2, y0 + h); g.stroke(); }
        if (!S.fins && !S.curtain) { g.fillStyle = rgb(S.wall, 1.1); g.fillRect(x0 - 2, y0 + h, w + 4, 3); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x0, y0 - 2, w, 2); }
        // night: some windows lit (warm interiors, a few cool screens)
        if (rand() < S.lit) {
          const warm = rand() < 0.82;
          const lv = 0.55 + rand() * 0.45;
          const gr = ge.createLinearGradient(0, y0, 0, y0 + h);
          gr.addColorStop(0, warm ? rgb('#ffd59a', lv) : rgb('#cfe0ff', lv * 0.8));
          gr.addColorStop(1, warm ? rgb('#ffb56a', lv * 0.85) : rgb('#a9c3f0', lv * 0.7));
          ge.fillStyle = gr; ge.fillRect(x0 + 1, y0 + 1, w - 2, h - 2);
          if (rand() < 0.4) { ge.fillStyle = 'rgba(0,0,0,0.6)'; ge.fillRect(x0 + 1, y0 + 1, w - 2, h * (0.2 + rand() * 0.5)); }
        }
      }
    }
    if (S.fins) {   // deep vertical concrete fins with a shadow side
      for (let b = 0; b <= bays; b++) {
        const x = b * S.bay * ppm;
        g.fillStyle = rgb(S.wall, 1.06); g.fillRect(x - 3, 0, 5, H);
        g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 2, 0, 3, H);
      }
    }
    return { map: tex(c), emissiveMap: tex(e), size: [bays * S.bay, floors * S.floor] };
  });
}

// Generic flat roofs: bitumen/gravel with darker patches.
export function roofTexture() {
  return once('roof', () => {
    const px = 256, c = mk(px, px), g = c.getContext('2d');
    const rand = mulberry32(5);
    g.fillStyle = '#7c7a76'; g.fillRect(0, 0, px, px);
    for (let i = 0; i < 4000; i++) { const v = 90 + rand() * 70; g.fillStyle = `rgba(${v},${v},${v - 4},0.5)`; g.fillRect(rand() * px, rand() * px, 2, 2); }
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(30,30,30,${0.08 + rand() * 0.1})`; g.beginPath(); g.ellipse(rand() * px, rand() * px, 20 + rand() * 50, 10 + rand() * 30, rand() * 3, 0, 7); g.fill(); }
    return { map: tex(c), size: [12, 12] };
  });
}

// Church brick: Flemish-bond red brick with white stone bands (~0.20 m every ~0.9 m).
export function churchBrick({ bands = true } = {}) {
  return once(`church-brick-${bands}`, () => {
    const ppm = 64, W = 4 * ppm, H = Math.round(1.8 * ppm);
    const c = mk(W, H), g = c.getContext('2d');
    const rand = mulberry32(11);
    g.fillStyle = '#b8a99a'; g.fillRect(0, 0, W, H);      // mortar
    const course = 0.065 * ppm, brickL = 0.21 * ppm;
    const bandH = 0.2 * ppm, period = 0.9 * ppm;
    for (let y = 0; y < H; y += course) {
      const inBand = bands && (y % period) < bandH;
      if (inBand) continue;
      const off = (Math.floor(y / course) % 2) * brickL / 2;
      for (let x = -brickL; x < W + brickL; x += brickL) {
        const t = rand();
        const base = t < 0.15 ? [118, 52, 40] : t < 0.3 ? [160, 76, 58] : [140, 64, 48];
        const k = 0.88 + rand() * 0.2;
        g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`;
        g.fillRect(x + off + 1, y + 1, brickL - 2, course - 2);
      }
    }
    for (let y = 0; bands && y < H; y += period) {      // stone bands with block joints
      g.fillStyle = '#e2d9c6'; g.fillRect(0, y, W, bandH);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y + bandH - 2, W, 2);
      for (let x = 0; x < W; x += 0.6 * ppm) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y, 1, bandH); }
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(80,70,60,${rand() * 0.12})`; g.fillRect(rand() * W, y + rand() * bandH, 3, 2); }
    }
    // soot / weathering streaks
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(30,20,15,${rand() * 0.06})`; g.fillRect(rand() * W, 0, 2 + rand() * 6, H); }
    return { map: tex(c), size: [4, 1.8] };
  });
}

export function slateTexture() {
  return once('slate', () => {
    const ppm = 80, W = 2 * ppm, H = 2 * ppm;
    const c = mk(W, H), g = c.getContext('2d');
    const rand = mulberry32(21);
    g.fillStyle = '#3c4146'; g.fillRect(0, 0, W, H);
    const sw = 0.2 * ppm, sh = 0.16 * ppm;
    for (let y = 0, r = 0; y < H; y += sh, r++) {
      for (let x = -sw + (r % 2) * sw / 2; x < W; x += sw) {
        const v = 78 + rand() * 26;
        g.fillStyle = `rgb(${v - 4},${v + 2},${v + 8})`;
        g.fillRect(x + 1, y + 1, sw - 2, sh - 1);
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x + 1, y + sh - 2, sw - 2, 2);
      }
    }
    return { map: tex(c), size: [2, 2] };
  });
}

// Boulevard cross-section (V = across the street, U = along it): sidewalks, lanes, tram tracks, trees' strip.
export function roadTexture(width) {
  return once(`road-${width}`, () => {
    const ppm = 8, L = 40, W = Math.round(L * ppm), H = Math.round(width * ppm);
    const c = mk(W, H), g = c.getContext('2d');
    const rand = mulberry32(31);
    const band = (y0, y1, col) => { g.fillStyle = col; g.fillRect(0, y0 * ppm, W, (y1 - y0) * ppm); };
    band(0, width, '#55575a');                                         // asphalt
    band(0, 5.5, '#a6a29a'); band(width - 5.5, width, '#a6a29a');        // sidewalks
    for (let x = 0; x < W; x += 0.6 * ppm) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x, 0, 1, 5.5 * ppm); g.fillRect(x, (width - 5.5) * ppm, 1, 5.5 * ppm); }
    band(5.5, 7.3, '#6b6e70'); band(width - 7.3, width - 5.5, '#6b6e70'); // parking strips
    const mid = width / 2;
    band(mid - 6, mid + 6, '#7f8a6c');                                  // planted central reservation
    band(mid - 3.2, mid + 3.2, '#8d877c');                              // tram bed
    for (const t of [-2.2, -0.8, 0.8, 2.2]) band(mid + t - 0.04, mid + t + 0.04, '#c9cbcc');
    // lane markings (dashed)
    for (const yy of [11, 15, width - 15, width - 11]) for (let x = 0; x < W; x += 6 * ppm) { g.fillStyle = '#e8e8e2'; g.fillRect(x, yy * ppm, 3 * ppm, 0.15 * ppm); }
    for (let i = 0; i < 3000; i++) { const v = rand() * 40; g.fillStyle = `rgba(${v},${v},${v},0.15)`; g.fillRect(rand() * W, rand() * H, 2, 2); }
    return { map: tex(c), size: [L, width] };
  });
}

// Street-level poster for the finned office's ground floor (abstract, no text).
export function posterTexture() {
  return once('poster', () => {
    const c = mk(256, 96), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 256, 96);
    gr.addColorStop(0, '#1d2433'); gr.addColorStop(0.5, '#6b2f3a'); gr.addColorStop(1, '#d08a3c');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 96);
    g.fillStyle = 'rgba(255,240,220,0.85)';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(40 + i * 45, 50 + Math.sin(i) * 14, 14 + i * 2, 0, 7); g.fill(); }
    return tex(c);
  });
}

// TV picture: a slow slideshow of painted scenes (Scheldt sunset, forest, sea, welcome card) drawn on a
// canvas and cross-faded with a gentle Ken Burns drift. Drives the screen's emissive map when the TV is on.
import * as THREE from 'three';
import { mulberry32 } from '../textures/noise.js';

const W = 512, H = 288;

function mk() { const c = document.createElement('canvas'); c.width = W * 1.2 | 0; c.height = H * 1.2 | 0; return c; }

function sky(g, w, h, stops) {
  const gr = g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([t, c]) => gr.addColorStop(t, c));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}

function scheldtSunset() {
  const c = mk(), g = c.getContext('2d'), w = c.width, h = c.height, rand = mulberry32(3);
  sky(g, w, h * 0.62, [[0, '#2b2350'], [0.45, '#b4507a'], [0.8, '#f29a55'], [1, '#ffd08a']]);
  const sg = g.createRadialGradient(w * 0.62, h * 0.58, 4, w * 0.62, h * 0.58, 90);
  sg.addColorStop(0, 'rgba(255,240,200,1)'); sg.addColorStop(0.25, 'rgba(255,200,120,0.8)'); sg.addColorStop(1, 'rgba(255,160,80,0)');
  g.fillStyle = sg; g.fillRect(0, 0, w, h);
  // skyline silhouette with a cathedral spire
  g.fillStyle = '#2a1d2c';
  let x = 0;
  g.beginPath(); g.moveTo(0, h * 0.62);
  while (x < w) { const bw = 12 + rand() * 30, bh = 8 + rand() * 26; g.lineTo(x, h * 0.62 - bh); g.lineTo(x + bw, h * 0.62 - bh); x += bw; }
  g.lineTo(w, h * 0.62); g.closePath(); g.fill();
  const sx = w * 0.3;
  g.beginPath(); g.moveTo(sx - 9, h * 0.62); g.lineTo(sx - 9, h * 0.38); g.lineTo(sx, h * 0.18); g.lineTo(sx + 9, h * 0.38); g.lineTo(sx + 9, h * 0.62); g.fill();
  // river with shimmering reflections
  sky(g, w, h, [[0, 'rgba(0,0,0,0)'], [0.62, 'rgba(0,0,0,0)'], [0.621, '#5a3550'], [1, '#1e1a2e']]);
  for (let i = 0; i < 120; i++) {
    const y = h * 0.63 + rand() * h * 0.36, len = 6 + rand() * 30, a = 0.15 + rand() * 0.4;
    g.fillStyle = `rgba(255,${180 + rand() * 60 | 0},${110 + rand() * 60 | 0},${a})`;
    g.fillRect(w * 0.62 - len / 2 + (rand() - 0.5) * (y - h * 0.6) * 0.9, y, len, 1.5);
  }
  return c;
}

function forest() {
  const c = mk(), g = c.getContext('2d'), w = c.width, h = c.height, rand = mulberry32(7);
  sky(g, w, h, [[0, '#a9c7d8'], [0.5, '#dfe8e3'], [1, '#e8eadf']]);
  const layers = ['#9fb3a4', '#7f9a85', '#5d7d63', '#3f5e46', '#2a4431'];
  layers.forEach((col, li) => {
    const base = h * (0.45 + li * 0.11);
    g.fillStyle = col;
    for (let x = -10; x < w + 10; x += 6 + rand() * 10) {
      const th = 30 + li * 14 + rand() * 30, tw = 10 + li * 4 + rand() * 6;
      g.beginPath(); g.moveTo(x, base - th); g.lineTo(x - tw, base + 6); g.lineTo(x + tw, base + 6); g.fill();
    }
    g.fillRect(0, base + 4, w, h - base);
    g.fillStyle = 'rgba(235,240,235,0.18)'; g.fillRect(0, base - 10, w, 20);   // mist band
  });
  return c;
}

function sea() {
  const c = mk(), g = c.getContext('2d'), w = c.width, h = c.height, rand = mulberry32(11);
  sky(g, w, h * 0.55, [[0, '#4e8cc2'], [1, '#cfe3ef']]);
  for (let i = 0; i < 7; i++) {   // soft clouds
    const cx = rand() * w, cy = rand() * h * 0.35, r = 20 + rand() * 40;
    const cg = g.createRadialGradient(cx, cy, 2, cx, cy, r); cg.addColorStop(0, 'rgba(255,255,255,0.85)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = cg; g.beginPath(); g.ellipse(cx, cy, r * 1.8, r, 0, 0, 7); g.fill();
  }
  sky(g, w, h, [[0, 'rgba(0,0,0,0)'], [0.55, 'rgba(0,0,0,0)'], [0.551, '#3b7fa6'], [1, '#174a6b']]);
  for (let i = 0; i < 220; i++) {
    const y = h * 0.56 + Math.pow(rand(), 1.6) * h * 0.44;
    g.fillStyle = `rgba(255,255,255,${0.1 + rand() * 0.35})`;
    g.fillRect(rand() * w, y, 3 + (y - h * 0.55) * 0.12 * rand(), 1.2);
  }
  // sailboat
  const bx = w * 0.68, by = h * 0.6;
  g.fillStyle = '#f7f4ee'; g.beginPath(); g.moveTo(bx, by - 44); g.lineTo(bx, by - 4); g.lineTo(bx + 26, by - 4); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(bx - 2, by - 38); g.lineTo(bx - 2, by - 4); g.lineTo(bx - 18, by - 4); g.closePath(); g.fill();
  g.fillStyle = '#2b3440'; g.fillRect(bx - 20, by - 4, 50, 5);
  return c;
}

function welcome() {
  const c = mk(), g = c.getContext('2d'), w = c.width, h = c.height;
  sky(g, w, h, [[0, '#1d2433'], [1, '#3a2c3c']]);
  g.strokeStyle = 'rgba(233,196,143,0.6)'; g.lineWidth = 2;
  // little twin-spire motif
  const cx = w / 2, by = h * 0.46;
  g.beginPath();
  for (const s of [-1, 1]) { g.moveTo(cx + s * 22, by); g.lineTo(cx + s * 22, by - 34); g.lineTo(cx + s * 16, by - 34); g.lineTo(cx + s * 19, by - 64); g.lineTo(cx + s * 22, by - 34); }
  g.moveTo(cx - 34, by); g.lineTo(cx + 34, by);
  g.stroke();
  g.fillStyle = '#f6f1ea'; g.textAlign = 'center';
  g.font = '600 30px system-ui, sans-serif'; g.fillText('Welcome', cx, h * 0.62);
  g.font = '18px system-ui, sans-serif'; g.fillStyle = '#e9c48f'; g.fillText('Frankrijklei rooftop · Antwerp', cx, h * 0.73);
  return c;
}

export class TvScreen {
  constructor(screenMesh) {
    this.mesh = screenMesh;
    this.slides = [welcome(), scheldtSunset(), forest(), sea()];
    this.canvas = document.createElement('canvas');
    this.canvas.width = W; this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.on = false;
    this.level = 0;
    this.t = 0;
    this._acc = 0;
    const m = this.mesh.material;
    m.emissive = new THREE.Color('#ffffff');
    m.emissiveMap = this.tex;
    m.emissiveIntensity = 0;
    m.needsUpdate = true;
    this.draw();
  }

  toggle() { this.on = !this.on; if (this.on) this.t = 0; return this.on; }

  draw() {
    const g = this.ctx, per = 8, fade = 1.4;
    const i = Math.floor(this.t / per) % this.slides.length, j = (i + 1) % this.slides.length;
    const local = this.t % per;
    const drift = (img, k, alpha) => {           // slow zoom + pan across the slide
      const sw = img.width / (1 + 0.1 * k), sh = img.height / (1 + 0.1 * k);
      g.globalAlpha = alpha;
      g.drawImage(img, (img.width - sw) * (0.3 + 0.4 * k), (img.height - sh) * 0.5, sw, sh, 0, 0, W, H);
    };
    g.globalAlpha = 1;
    drift(this.slides[i], local / per, 1);
    if (local > per - fade) drift(this.slides[j], 0, (local - (per - fade)) / fade);
    g.globalAlpha = 1;
    this.tex.needsUpdate = true;
  }

  update(dt) {
    const target = this.on ? 1 : 0;
    this.level += Math.max(-dt * 3, Math.min(dt * 3, target - this.level));
    this.mesh.material.emissiveIntensity = this.level * 1.35;
    if (this.level > 0) {
      this.t += dt;
      this._acc += dt;
      if (this._acc > 1 / 20) { this._acc = 0; this.draw(); }
    }
  }
}

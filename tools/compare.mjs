// Headless side-by-side comparison: renders the scene from each reference camera pose
// (COMPARE_CAMERAS in src/apartment.config.js) and writes compare/<id>.png with the
// original photo on the left and the render on the right.
//
// Usage:  npm run compare                 (all cameras)
//         npm run compare -- --only 03,05 (subset)
//         npm run compare -- --height 720 --time 15
//         npm run compare -- --q high          (render preset, default medium)
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPARE_CAMERAS } from '../src/apartment.config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : dflt;
};
const only = arg('only', '').split(',').filter(Boolean);
const H = Number(arg('height', 600));
const time = arg('time', null);
const q = arg('q', null);
const outDir = path.join(root, arg('out', 'compare'));
await fs.mkdir(outDir, { recursive: true });

const server = await createServer({ root, logLevel: 'error', server: { port: 5199, strictPort: false, host: '127.0.0.1' } });
await server.listen();
const base = server.resolvedUrls.local[0];

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const cams = COMPARE_CAMERAS.filter((c) => !only.length || only.includes(c.id));
let failures = 0;
const results = [];

for (const cam of cams) {
  const t0 = Date.now();
  const refPath = path.join(root, 'reference', cam.ref);
  const refData = `data:image/jpeg;base64,${(await fs.readFile(refPath)).toString('base64')}`;
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

  // Reference crop size → render size with the same aspect.
  await page.setContent('<html><body></body></html>');
  const [rw, rh] = await page.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  }, refData);
  const [cx0, cy0, cx1, cy1] = cam.crop;
  const cropW = (cx1 - cx0) * rw, cropH = (cy1 - cy0) * rh;
  const W = Math.round(H * cropW / cropH);

  const url = `${base}?cam=${encodeURIComponent(cam.id)}&w=${W}&h=${H}${time ? `&t=${time}` : ''}${q ? `&q=${q}` : ''}`;
  await page.setViewportSize({ width: Math.max(W, 200), height: H });
  await page.goto(url);
  const ok = await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 180000 }).then(() => true, () => false);
  const err = await page.evaluate(() => window.__error || null);
  if (!ok || err) {
    console.error(`✗ ${cam.id}: ${err || 'timeout'}\n${logs.join('\n')}`);
    failures++;
    await page.close();
    continue;
  }
  const shot = await page.locator('canvas').screenshot({ type: 'png' });
  const shotData = `data:image/png;base64,${shot.toString('base64')}`;

  // Compose original | render.
  await page.setViewportSize({ width: W * 2 + 24, height: H + 40 });
  await page.setContent(`<html><body style="margin:0;background:#1b1a19"><canvas id="c"></canvas></body></html>`);
  const composed = await page.evaluate(async ({ refData, shotData, crop, W, H, id }) => {
    const load = async (src) => { const i = new Image(); i.src = src; await i.decode(); return i; };
    const [ref, ren] = await Promise.all([load(refData), load(shotData)]);
    const c = document.getElementById('c');
    c.width = W * 2 + 24; c.height = H + 40;
    const g = c.getContext('2d');
    g.fillStyle = '#1b1a19'; g.fillRect(0, 0, c.width, c.height);
    const sx = crop[0] * ref.naturalWidth, sy = crop[1] * ref.naturalHeight;
    const sw = (crop[2] - crop[0]) * ref.naturalWidth, sh = (crop[3] - crop[1]) * ref.naturalHeight;
    g.drawImage(ref, sx, sy, sw, sh, 8, 32, W, H);
    g.drawImage(ren, W + 16, 32, W, H);
    g.fillStyle = '#e9e2d8'; g.font = '15px system-ui, sans-serif';
    g.fillText(`${id} · reference`, 10, 21);
    g.fillText(`${id} · render`, W + 18, 21);
    return c.toDataURL('image/jpeg', 0.88);
  }, { refData, shotData, crop: cam.crop, W, H, id: cam.id });
  await fs.writeFile(path.join(outDir, `${cam.id}.jpg`), Buffer.from(composed.split(',')[1], 'base64'));
  results.push({ id: cam.id, data: composed });
  console.log(`✓ ${cam.id} (${W}×${H}) in ${((Date.now() - t0) / 1000).toFixed(1)} s${logs.length ? `\n  ${logs.slice(0, 5).join('\n  ')}` : ''}`);
  await page.close();
}

// Overview contact sheet of every comparison (equal-height rows).
if (results.length > 1) {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  await page.setContent('<html><body style="margin:0"><canvas id="c"></canvas></body></html>');
  const sheet = await page.evaluate(async (items) => {
    const imgs = await Promise.all(items.map(async (it) => { const i = new Image(); i.src = it.data; await i.decode(); return i; }));
    // Flow layout: every comparison scaled to the same height, rows wrap at maxW.
    const rowH = 380, maxW = 2200, gap = 6;
    const placed = [];
    let x = 0, y = 0;
    for (const i of imgs) {
      const w = Math.round(i.naturalWidth * rowH / i.naturalHeight);
      if (x > 0 && x + w > maxW) { x = 0; y += rowH + gap; }
      placed.push({ i, x, y, w });
      x += w + gap;
    }
    const c = document.getElementById('c');
    c.width = maxW; c.height = y + rowH;
    const g = c.getContext('2d');
    g.fillStyle = '#1b1a19'; g.fillRect(0, 0, c.width, c.height);
    for (const p of placed) g.drawImage(p.i, p.x, p.y, p.w, rowH);
    return c.toDataURL('image/jpeg', 0.85);
  }, results);
  await fs.writeFile(path.join(outDir, 'overview.jpg'), Buffer.from(sheet.split(',')[1], 'base64'));
  console.log(`✓ overview.jpg (${results.length} comparisons)`);
}

await browser.close();
await server.close();
process.exit(failures ? 1 : 0);

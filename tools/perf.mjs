// Performance benchmark: renders fixed viewpoints at each quality preset and reports draw calls,
// triangles, shader programs and the mean frame time. The headless browser renders on the CPU
// (SwiftShader), so absolute times are far slower than a real GPU, but relative changes between
// builds and presets track real GPU workload well.
// Usage: node tools/perf.mjs [--quality low,medium,high] [--frames 6] [--size 960x540] [--out perf.json]
import { chromium } from 'playwright';
import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const qualities = arg('quality', 'low,medium,high').split(',');
const frames = Number(arg('frames', 6));
const [W, H] = arg('size', '960x540').split('x').map(Number);
const outFile = arg('out', null);

const VIEWS = {
  living:   'eye=4.4,5.2,1.6&look=4.0,9.0,1.0&fov=70&t=17',
  kitchen:  'eye=5.6,4.9,1.6&look=5.9,2.2,1.0&fov=70&t=17',
  bedroom:  'eye=2.6,0.4,1.6&look=0.8,2.6,0.8&fov=70&t=17',
  terrace:  'eye=3.75,9.85,1.75&look=-14,76,8&fov=70&t=17',
  lounge:   'eye=2.0,10.6,1.75&look=6.3,13.4,0.6&fov=70&t=17',
  night:    'eye=4.4,5.2,1.6&look=4.0,9.0,1.0&fov=70&t=22.75',
};

const server = await createServer({ root, logLevel: 'error', server: { port: 5192, host: '127.0.0.1' } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
for (const q of qualities) {
  for (const [name, view] of Object.entries(VIEWS)) {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    page.setDefaultTimeout(300000);
    await page.goto(`${server.resolvedUrls.local[0]}?${view}&q=${q}&w=${W}&h=${H}`);
    await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 300000 });
    const r = await page.evaluate((frames) => {
      const s = window.__scene, gl = s.renderer.getContext();
      const px = new Uint8Array(4);
      const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);   // forces the frame to finish
      const one = () => { s.renderer.info.reset(); s.post.render(1 / 60); };
      one(); sync();
      const t0 = performance.now();
      for (let i = 0; i < frames; i++) { s.tod.update(1 / 60, s.camera.position); one(); sync(); }
      const ms = (performance.now() - t0) / frames;
      const info = s.renderer.info;
      const calls = info.render.calls, triangles = info.render.triangles;
      // the same frame without re-rendering the shadow map
      const auto = s.renderer.shadowMap.autoUpdate;
      s.renderer.shadowMap.autoUpdate = false; s.renderer.shadowMap.needsUpdate = false;
      one(); sync();
      const noShadow = { calls: info.render.calls, triangles: info.render.triangles };
      s.renderer.shadowMap.autoUpdate = auto;
      return {
        ms: +ms.toFixed(1), calls, triangles, noShadowCalls: noShadow.calls, noShadowTris: noShadow.triangles,
        programs: info.programs ? info.programs.length : null, geometries: info.memory.geometries, textures: info.memory.textures,
        shadowAuto: s.renderer.shadowMap.autoUpdate,
      };
    }, frames);
    results.push({ quality: q, view: name, ...r });
    console.log(`${q.padEnd(6)} ${name.padEnd(8)} ${String(r.ms).padStart(8)} ms  ${String(r.calls).padStart(4)} draws (${r.noShadowCalls} w/o shadow pass)  ${(r.triangles / 1000).toFixed(0).padStart(5)}k tris (${(r.noShadowTris / 1000).toFixed(0)}k)  ${String(r.programs).padStart(3)} programs`);
    await page.close();
  }
}
if (outFile) fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
await browser.close();
await server.close();

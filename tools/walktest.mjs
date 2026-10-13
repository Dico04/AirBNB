// Headless movement/collision test: drives the first-person controller with key presses
// and checks where the player ends up.  Usage: node tools/walktest.mjs
import { chromium } from 'playwright';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({ root, logLevel: 'error', server: { port: 5197, host: '127.0.0.1' } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.goto(`${server.resolvedUrls.local[0]}?shadow=512`);
await page.waitForFunction(() => window.__scene && window.__scene.controls, null, { timeout: 180000 });

// Deterministic stepping: run the controller with fixed dt instead of real time.
async function walk({ from, yawDeg, keys, seconds, run = false }) {
  return page.evaluate(({ from, yawDeg, keys, seconds, run }) => {
    const c = window.__scene.controls;
    c.setPose(from[0], from[1], (yawDeg * Math.PI) / 180, 0);
    c.keys.clear();
    for (const k of keys) c.keys.add(k);
    if (run) c.keys.add('ShiftLeft');
    let minFeet = c.feet, maxFeet = c.feet;
    const steps = Math.round(seconds / (1 / 60));
    for (let i = 0; i < steps; i++) { c.update(1 / 60); minFeet = Math.min(minFeet, c.feet); maxFeet = Math.max(maxFeet, c.feet); }
    c.keys.clear();
    return { x: +c.x.toFixed(2), y: +c.z.toFixed(2), feet: +c.feet.toFixed(2), minFeet: +minFeet.toFixed(2), maxFeet: +maxFeet.toFixed(2) };
  }, { from, yawDeg, keys, seconds, run });
}

const yawFor = (bearing) => -bearing; // plan bearing (cw from plan-north) → controller yaw
const tests = [
  { name: 'living → platform → open sliding door → terrace → south parapet', from: [3.40, 7.40], yaw: yawFor(180), keys: ['KeyW'], seconds: 6,
    check: (r) => r.y > 13.9 && r.y < 14.1 && Math.abs(r.feet - 0.25) < 0.01 && r.maxFeet >= 0.399 },
  { name: 'blocked by closed front door', from: [1.70, 5.20], yaw: yawFor(0), keys: ['KeyW'], seconds: 3,
    check: (r) => r.y > 4.35 && r.y < 4.5 },
  { name: 'blocked by fixed sliding leaf (west half)', from: [2.30, 7.40], yaw: yawFor(180), keys: ['KeyW'], seconds: 4,
    check: (r) => r.y < 9.1 },
  { name: 'corridor → open bedroom door → bedroom', from: [4.00, 1.60], yaw: yawFor(270), keys: ['KeyW'], seconds: 3,
    check: (r) => r.x < 2.6 },
  { name: 'corridor → open bathroom door → bathroom', from: [3.80, 0.85], yaw: yawFor(90), keys: ['KeyW'], seconds: 3,
    check: (r) => r.x > 5.2 },
  { name: 'cannot leave terrace over east parapet (run)', from: [5.00, 11.50], yaw: yawFor(90), keys: ['KeyW'], seconds: 4, run: true,
    check: (r) => r.x < 7.1 },
  { name: 'strafe along corridor wall stays inside', from: [3.60, 3.00], yaw: yawFor(0), keys: ['KeyA'], seconds: 2,
    check: (r) => r.x > 3.45 },
];
let fail = 0;
for (const t of tests) {
  const r = await walk({ from: t.from, yawDeg: t.yaw, keys: t.keys, seconds: t.seconds, run: t.run });
  const ok = t.check(r);
  if (!ok) fail++;
  console.log(`${ok ? '✓' : '✗'} ${t.name}  →  ${JSON.stringify(r)}`);
}
await browser.close();
await server.close();
process.exit(fail ? 1 : 0);

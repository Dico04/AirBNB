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
  { name: 'corridor → open bathroom door → bathroom', from: [4.52, 0.85], yaw: yawFor(90), keys: ['KeyW'], seconds: 3,
    check: (r) => r.x > 5.2 },
  { name: 'cannot leave terrace over east parapet (run)', from: [5.50, 9.95], yaw: yawFor(90), keys: ['KeyW'], seconds: 4, run: true,
    check: (r) => r.x < 7.1 },
  { name: 'blocked by the sofa back (furniture collider)', from: [3.40, 5.30], yaw: yawFor(180), keys: ['KeyW'], seconds: 2,
    check: (r) => r.y < 5.75 && r.maxFeet === 0 },
  { name: 'blocked by bar stools / kitchen bar', from: [3.80, 2.80], yaw: yawFor(90), keys: ['KeyW'], seconds: 2,
    check: (r) => r.x < 4.25 },
  { name: 'blocked by the terrace lounge', from: [5.10, 12.15], yaw: yawFor(180), keys: ['KeyW'], seconds: 2,
    check: (r) => r.y < 12.45 && r.maxFeet === 0.25 },
  { name: 'strafe along corridor wall stays inside', from: [3.60, 3.00], yaw: yawFor(0), keys: ['KeyA'], seconds: 2,
    check: (r) => r.x > 3.45 },
];
let fail = 0;
const report = (ok, name, detail) => { if (!ok) fail++; console.log(`${ok ? '✓' : '✗'} ${name}  →  ${JSON.stringify(detail)}`); };

// ---- time of day & lights (keys go through the real keydown handler)
const settle = () => page.evaluate(() => {
  const { tod, camera } = window.__scene;
  for (let i = 0; i < 240; i++) tod.update(1 / 60, camera.position);
  return { hours: +tod.hours.toFixed(2), altitude: +tod.altitude.toFixed(1), lampsOn: tod.lamps.lamps.filter((l) => l.level > 0.99).length,
           exposure: +window.__scene.renderer.toneMappingExposure.toFixed(2), sunI: +tod.sun.intensity.toFixed(2) };
});
await page.keyboard.press('Digit4');
let r = await settle();
report(Math.abs(r.hours - 22.75) < 0.02 && r.lampsOn >= 10 && r.altitude < -6, 'key 4 → night, lamps switch on by themselves', r);
await page.keyboard.press('KeyL');
r = await settle();
report(r.lampsOn === 0, 'key L → all lights off', r);
await page.keyboard.press('KeyL');
r = await settle();
report(r.lampsOn === 16, 'key L again → all lights on', r);
await page.keyboard.press('Digit1');
r = await settle();
report(Math.abs(r.hours - 8.5) < 0.02 && r.lampsOn === 0 && r.altitude > 15, 'key 1 → morning (auto lights off, sun up)', r);
await page.keyboard.press('Digit3');
r = await settle();
report(Math.abs(r.hours - 20.5) < 0.02 && r.altitude > 0 && r.altitude < 5, 'key 3 → sunset, sun just above the horizon', r);
await page.keyboard.press('Digit2');
r = await settle();
report(Math.abs(r.hours - 17) < 0.02 && r.sunI > 3, 'key 2 → afternoon', r);

for (const t of tests) {
  const r = await walk({ from: t.from, yawDeg: t.yaw, keys: t.keys, seconds: t.seconds, run: t.run });
  report(t.check(r), t.name, r);
}

// ---- quality presets load without errors
await page.close();
for (const q of ['low', 'high']) {
  const p2 = await browser.newPage({ viewport: { width: 480, height: 300 } });
  const errs = [];
  p2.on('pageerror', (e) => errs.push(e.message));
  await p2.goto(`${server.resolvedUrls.local[0]}?cam=05&w=480&h=300&q=${q}`, { timeout: 120000 });
  const ok = await p2.waitForFunction(() => window.__ready || window.__error, null, { timeout: 180000 }).then(() => true, () => false);
  const err = await p2.evaluate(() => window.__error || null);
  report(ok && !err && !errs.length, `quality preset "${q}" renders`, { err: err || errs[0] || null });
  await p2.close();
}
await browser.close();
await server.close();
process.exit(fail ? 1 : 0);

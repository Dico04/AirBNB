// Headless checks for step 6: E interactions (lamp, switch, doors, sliding door, TV), third person (V),
// cinematic tour (C), screenshot (P), the Esc menu controls and the mobile touch UI.
// Usage: node tools/uitest.mjs
import { chromium } from 'playwright';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({ root, logLevel: 'error', server: { port: 5195, host: '127.0.0.1' } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fail = 0;
const report = (ok, name, detail) => { if (!ok) fail++; console.log(`${ok ? '✓' : '✗'} ${name}  →  ${JSON.stringify(detail)}`); };

const page = await browser.newPage({ viewport: { width: 640, height: 400 }, acceptDownloads: true });
page.on('pageerror', (e) => { fail++; console.error('pageerror', e.message); });
await page.goto(`${url}?shadow=512&q=low`);
await page.waitForFunction(() => window.__scene && window.__scene.controls, null, { timeout: 180000 });

// Stand at plan (x, y) and look at plan point (tx, ty, th); refresh the hover target.
const aim = (x, y, tx, ty, th) => page.evaluate(({ x, y, tx, ty, th }) => {
  const s = window.__scene, c = s.controls;
  c.keys.clear();
  const eyeH = c.collision.groundAt(x, y, 10, 0) + 1.65;
  const dx = tx - x, dz = ty - y, dh = th - eyeH;
  const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dh, Math.hypot(dx, dz));
  c.setPose(x, y, yaw, pitch);
  c.update(1 / 60);
  s.interactions.originOverride = null;
  s.interactions.update(0.2, true);
  return s.interactions.hover ? s.interactions.hover.id : null;
}, { x, y, tx, ty, th });
const settle = (sec = 1.5) => page.evaluate((sec) => {
  const s = window.__scene;
  for (let i = 0; i < sec * 30; i++) { s.interactions.update(1 / 30, false); s.tod.update(1 / 30, s.camera.position); }
}, sec);
const walk = (from, yawDeg, seconds) => page.evaluate(({ from, yawDeg, seconds }) => {
  const c = window.__scene.controls;
  c.setPose(from[0], from[1], (yawDeg * Math.PI) / 180, 0);
  c.keys.clear(); c.keys.add('KeyW');
  for (let i = 0; i < seconds * 60; i++) c.update(1 / 60);
  c.keys.clear();
  return { x: +c.x.toFixed(2), y: +c.z.toFixed(2) };
}, { from, yawDeg, seconds });

// ---- E on lamps / switches / TV
let id = await aim(5.55, 7.70, 5.80, 8.84, 0.95);
let before = await page.evaluate(() => window.__scene.tod.lamps.isOn('living-lamp'));
await page.keyboard.press('KeyE');
let after = await page.evaluate(() => window.__scene.tod.lamps.isOn('living-lamp'));
report(id === 'living-lamp' && after !== before, 'E toggles the table lamp', { id, before, after });

id = await aim(3.95, 3.45, 3.30, 3.72, 1.05);
before = await page.evaluate(() => window.__scene.tod.lamps.isOn('corridor-ceil'));
await page.keyboard.press('KeyE');
after = await page.evaluate(() => window.__scene.tod.lamps.isOn(['corridor-ceil', 'corridor-spot']));
report(id === 'sw-corridor' && after !== before, 'E on the corridor switch toggles its lights', { id, before, after });

id = await aim(4.18, 10.6, 4.18, 9.35, 1.30);
await page.keyboard.press('KeyE');
after = await page.evaluate(() => window.__scene.tod.lamps.isOn('festoon-s1'));
report(id === 'sw-festoon' && after === true, 'E on the terrace switch lights the festoon', { id, after });

id = await aim(6.0, 7.55, 6.20, 8.87, 0.95);
await page.keyboard.press('KeyE');
after = await page.evaluate(() => window.__scene.interactions.tv.on);
report(id === 'tv' && after === true, 'E turns the TV on', { id, after });

id = await aim(2.6, 7.45, 5.80, 8.84, 0.95);
report(id === null, 'nothing in reach from across the room', { id });

// ---- doors
id = await aim(4.45, 0.72, 4.75, 0.72, 1.2);
await page.keyboard.press('KeyE');
await settle(1.5);
let r = await walk([4.45, 0.72], -90, 2.5);   // controller yaw = −bearing (east)
report(id === 'D-bath' && r.x < 4.75, 'E closes the bathroom door, which then blocks the way', { id, ...r });
await aim(4.45, 0.72, 4.75, 0.72, 1.2);
await page.keyboard.press('KeyE');
await settle(1.5);
r = await walk([4.45, 0.72], -90, 2.5);
report(r.x > 5.2, 'E opens it again, walk into the bathroom', r);

id = await aim(3.40, 7.80, 3.40, 9.20, 1.30);
await page.keyboard.press('KeyE');
await settle(2.0);
r = await walk([3.40, 7.80], 180, 4);
report(id === 'D-slide' && r.y < 9.2, 'E slides the terrace door shut (blocks the way out)', { id, ...r });
await aim(3.40, 7.80, 3.40, 9.20, 1.30);
await page.keyboard.press('KeyE');
await settle(2.0);
r = await walk([3.40, 7.80], 180, 4);
report(r.y > 10, 'E slides it open again (walk onto the terrace)', r);

// ---- V third person
await walk([3.0, 7.45], 0, 0.02);
await page.keyboard.press('KeyV');
await page.waitForFunction(() => window.__scene.avatar.root.visible, null, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1500);
r = await page.evaluate(() => {
  const s = window.__scene, c = s.controls;
  const d = Math.hypot(s.camera.position.x - c.x, s.camera.position.z - c.z);
  return { visible: s.avatar.root.visible, boom: +d.toFixed(2), menuView: s.menu.actions.getView() };
});
report(r.visible && r.boom > 0.8 && r.menuView === 'third', 'V switches to third person (figure visible, camera behind)', r);
await page.keyboard.press('KeyV');
await page.waitForFunction(() => !window.__scene.avatar.root.visible, null, { timeout: 60000 }).catch(() => {});
r = await page.evaluate(() => ({ visible: window.__scene.avatar.root.visible }));
report(!r.visible, 'V back to first person hides the figure', r);

// ---- C cinematic tour
await page.keyboard.press('KeyC');
r = await page.evaluate(() => {
  const s = window.__scene, t = s.tour;
  const out = { active: t.active };
  const at = (sec) => { while (t.active && t.t < sec) t.update(1 / 20); return [+s.camera.position.x.toFixed(2), +s.camera.position.z.toFixed(2), +s.camera.position.y.toFixed(2)]; };
  out.kitchen = at(12);
  out.terrace = at(38);
  out.slideOpen = s.interactions.doorState['D-slide'].target > 0.5;
  out.end = at(58);
  out.caption = document.getElementById('caption').textContent;
  out.fov = +s.camera.fov.toFixed(1);
  out.sunsetTarget = s.tod.anim ? +((s.tod.anim.from + s.tod.anim.delta) % 24).toFixed(2) : +s.tod.hours.toFixed(2);
  while (t.active) t.update(1 / 10);
  out.after = { active: t.active, letterbox: document.body.classList.contains('touring') };
  return out;
});
report(r.active && r.kitchen[1] < 4.6 && r.terrace[1] > 9.5 && r.end[1] > 13 && r.slideOpen && r.fov < 45 && !r.after.active && !r.after.letterbox,
  'C runs the tour: kitchen → terrace → church push, then hands back control', r);
report(r.sunsetTarget > 20 && r.sunsetTarget < 21.2, 'tour animates the sky to sunset', { target: r.sunsetTarget });

// ---- P screenshot
await page.evaluate(() => { const s = window.__scene; s.menu.hide(); s.controls.enabled = true; });
const [download] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.keyboard.press('KeyP')]);
const p = await download.path();
const fs = await import('node:fs');
const size = fs.statSync(p).size;
const buf = fs.readFileSync(p);
const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
report(/^frankrijklei-.*\.png$/.test(download.suggestedFilename()) && w === 1280 && h === 800 && size > 50000, 'P saves a 2× PNG', { name: download.suggestedFilename(), w, h, size });

// ---- menu controls
r = await page.evaluate(() => {
  const s = window.__scene, m = s.menu;
  m.show();
  const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input')); };
  set('m-time', 9.25);
  set('m-fov', 61);
  set('m-sens', 1.5);
  document.querySelector('#m-lights [data-v="on"]').click();
  const out = { hours: +s.tod.hours.toFixed(2), fov: s.camera.fov, sens: +(s.controls.sensitivity / 0.0022).toFixed(2), mode: s.tod.lamps.mode,
    label: document.getElementById('m-time-label').textContent, stored: JSON.parse(localStorage.getItem('frankrijklei-settings') || '{}') };
  document.querySelector('#m-lights [data-v="auto"]').click();
  m.hide();
  return out;
});
report(r.hours === 9.25 && r.fov === 61 && r.sens === 1.5 && r.mode === 'on' && r.label === '09:15' && r.stored.fov === 61, 'menu: time slider, FOV, sensitivity, lights, saved settings', r);
await page.close();

// ---- mobile
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
const mp = await ctx.newPage();
mp.on('pageerror', (e) => { fail++; console.error('pageerror', e.message); });
await mp.goto(`${url}?shadow=512&q=low`);
await mp.waitForFunction(() => window.__scene && window.__scene.controls, null, { timeout: 180000 });
await mp.tap('#start');
r = await mp.evaluate(() => ({ touch: document.body.classList.contains('touch'), joy: getComputedStyle(document.getElementById('joy')).display !== 'none', start: document.getElementById('start').classList.contains('hidden') }));
const box = await mp.locator('#joy').boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
await mp.evaluate(({ cx, cy }) => {
  const el = document.getElementById('joy');
  const ev = (type, x, y) => el.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
  ev('pointerdown', cx, cy - 10); ev('pointermove', cx, cy - 60);
}, { cx, cy });
const mv = await mp.evaluate(() => window.__scene.controls.externalMove);
report(r.touch && r.joy && r.start && mv && mv.y > 0.5, 'mobile: touch UI shows, joystick drives forward', { ...r, move: mv });
await ctx.close();

await browser.close();
await server.close();
process.exit(fail ? 1 : 0);

// Ad-hoc headless render: node tools/shot.mjs out.png "eye=x,y,h&look=x,y,h&fov=60" [width height]
import { chromium } from 'playwright';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [out, query, w = '900', h = '560'] = process.argv.slice(2);
const server = await createServer({ root, logLevel: 'error', server: { port: 5198, host: '127.0.0.1' } });
await server.listen();
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error(`[${m.type()}] ${m.text()}`); });
await page.goto(`${server.resolvedUrls.local[0]}?${query}&w=${w}&h=${h}`);
await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 180000 });
const err = await page.evaluate(() => window.__error);
if (err) console.error(err);
await page.locator('canvas').screenshot({ path: out });
console.log(await page.evaluate(() => { const i = window.__scene.renderer.info; return `draw calls ${i.render.calls}, triangles ${i.render.triangles}, geometries ${i.memory.geometries}, textures ${i.memory.textures}`; }));
await browser.close();
await server.close();

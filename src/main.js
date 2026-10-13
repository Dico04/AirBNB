import * as THREE from 'three';
import { PLAYER, COMPARE_CAMERAS } from './apartment.config.js';
import { setMaxAnisotropy } from './textures/procedural.js';
import { CollisionWorld } from './player/collision.js';
import { FirstPersonController } from './player/controls.js';
import { buildShell } from './world/shell.js';
import { buildTerrace } from './world/terrace.js';
import { buildOpenings } from './world/openings.js';
import { Daylight } from './lighting/daylight.js';

const params = new URLSearchParams(location.search);
const compareId = params.get('cam');
const debugEye = params.get('eye');            // ?eye=x,y,h&look=x,y,h&fov=60 (plan coords) for ad-hoc renders
const isShot = Boolean(compareId || debugEye);

const app = document.getElementById('app');
const startEl = document.getElementById('start');
const statusEl = document.getElementById('start-status');
const helpEl = document.getElementById('help');
const fpsEl = document.getElementById('fps');
const crosshair = document.getElementById('crosshair');
if (isShot) document.body.classList.add('shot');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: isShot });
renderer.setPixelRatio(isShot ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
app.appendChild(renderer.domElement);
setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(PLAYER.fov, 1, 0.03, 6000);

function resize() {
  let w = window.innerWidth, h = window.innerHeight;
  if (isShot) { w = Number(params.get('w')) || 1200; h = Number(params.get('h')) || 800; }
  renderer.setSize(w, h, !isShot);
  if (isShot) Object.assign(renderer.domElement.style, { width: `${w}px`, height: `${h}px`, position: 'fixed', left: 0, top: 0 });
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

async function init() {
  await nextFrame();
  const collision = new CollisionWorld();
  scene.add(buildShell(collision));
  scene.add(buildTerrace(collision));
  const openings = buildOpenings(collision);
  scene.add(openings.group);
  const daylight = new Daylight(renderer, scene, { shadowMapSize: Number(params.get('shadow')) || 2048 });
  if (params.has('t')) daylight.setTime(Number(params.get('t')));

  window.__scene = { scene, camera, renderer, collision, daylight, doors: openings.doors };

  if (isShot) {
    const num = (k) => params.get(k).split(',').map(Number);
    const c = debugEye
      ? { eye: num('eye'), target: num('look'), fov: Number(params.get('fov')) || 60 }
      : COMPARE_CAMERAS.find((k) => k.id === compareId);
    if (!c) throw new Error(`Unknown compare camera ${compareId}`);
    camera.fov = c.fov;
    camera.position.set(c.eye[0], c.eye[2], c.eye[1]);
    if (c.target) camera.lookAt(c.target[0], c.target[2], c.target[1]);
    else camera.rotation.set(THREE.MathUtils.degToRad(c.pitch), -THREE.MathUtils.degToRad(c.yaw), 0, 'YXZ');
    camera.updateProjectionMatrix();
    collision.updateDynamic();
    for (let i = 0; i < 3; i++) { renderer.render(scene, camera); await nextFrame(); }
    window.__ready = true;
    return;
  }

  const controls = new FirstPersonController(camera, renderer.domElement, collision);
  window.__scene.controls = controls;
  statusEl.textContent = 'Click anywhere to start';
  startEl.addEventListener('click', () => controls.lock());
  renderer.domElement.addEventListener('lockchange', (e) => {
    startEl.classList.toggle('hidden', e.detail);
    crosshair.classList.toggle('hidden', !e.detail);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') helpEl.classList.toggle('hidden');
    if (e.code === 'KeyF') fpsEl.classList.toggle('hidden');
  });

  const clock = new THREE.Clock();
  let frames = 0, acc = 0;
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    controls.update(dt);
    renderer.render(scene, camera);
    frames++; acc += dt;
    if (acc >= 0.5) {
      fpsEl.textContent = `${Math.round(frames / acc)} fps · ${renderer.info.render.calls} draws`;
      frames = 0; acc = 0;
    }
  });
}

init().catch((err) => {
  console.error(err);
  statusEl.textContent = `Error: ${err.message}`;
  window.__error = String(err && err.stack || err);
});

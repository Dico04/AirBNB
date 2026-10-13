import * as THREE from 'three';
import { PLAYER, COMPARE_CAMERAS, QUALITY, TIME_PRESETS, FURNITURE } from './apartment.config.js';
import { setMaxAnisotropy } from './textures/procedural.js';
import { CollisionWorld } from './player/collision.js';
import { FirstPersonController } from './player/controls.js';
import { buildShell } from './world/shell.js';
import { buildTerrace } from './world/terrace.js';
import { buildOpenings } from './world/openings.js';
import { TimeOfDay } from './lighting/timeOfDay.js';
import { createPost } from './render/post.js';
import { buildFurniture } from './props/index.js';
import { mergeStatic } from './util/merge.js';

const params = new URLSearchParams(location.search);
const compareId = params.get('cam');
const debugEye = params.get('eye');            // ?eye=x,y,h&look=x,y,h&fov=60 (plan coords) for ad-hoc renders
const isShot = Boolean(compareId || debugEye);
const qualityName = QUALITY[params.get('q')] ? params.get('q') : 'medium';
const quality = { ...QUALITY[qualityName], ...(params.has('shadow') ? { shadowMap: Number(params.get('shadow')) } : {}) };

const app = document.getElementById('app');
const startEl = document.getElementById('start');
const statusEl = document.getElementById('start-status');
const helpEl = document.getElementById('help');
const fpsEl = document.getElementById('fps');
const toastEl = document.getElementById('toast');
const crosshair = document.getElementById('crosshair');
if (isShot) document.body.classList.add('shot');

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: isShot, stencil: false });
renderer.setPixelRatio(isShot ? 1 : Math.min(window.devicePixelRatio, quality.pixelRatio));
renderer.toneMapping = THREE.NoToneMapping;          // ACES is applied in post (ToneMappingEffect)
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.info.autoReset = false;   // count every pass of a frame (post-processing renders several)
app.appendChild(renderer.domElement);
setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(PLAYER.fov, 1, 0.03, 6000);
let post = null;

function viewSize() {
  if (isShot) return [Number(params.get('w')) || 1200, Number(params.get('h')) || 800];
  return [window.innerWidth, window.innerHeight];
}
function resize() {
  const [w, h] = viewSize();
  renderer.setSize(w, h, !isShot);
  if (isShot) Object.assign(renderer.domElement.style, { width: `${w}px`, height: `${h}px`, position: 'fixed', left: 0, top: 0 });
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  post?.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();

let toastTimer = 0;
function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}
const fmtTime = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

async function init() {
  await nextFrame();
  const collision = new CollisionWorld();
  const shell = buildShell(collision);
  const terrace = buildTerrace(collision);
  const openings = buildOpenings(collision);
  scene.add(shell, terrace, openings.group);
  for (const g of [shell, terrace, openings.group]) mergeStatic(g, { name: `${g.name}-merged` });

  const tod = new TimeOfDay({ renderer, scene, quality });
  const staged = compareId ? COMPARE_CAMERAS.find((k) => k.id === compareId)?.overrides : null;
  if (staged?.oliveSpot) FURNITURE.living.oliveTree.spot = staged.oliveSpot;
  if (params.has('olive')) FURNITURE.living.oliveTree.spot = params.get('olive');
  scene.add(buildFurniture(collision, tod.lamps));
  const shotCam = compareId ? COMPARE_CAMERAS.find((k) => k.id === compareId) : null;
  if (params.has('t')) tod.setTime(Number(params.get('t')));
  else if (shotCam?.time !== undefined) tod.setTime(shotCam.time);
  tod.env.registerExteriorMaterials(scene);

  const [w, h] = viewSize();
  post = createPost(renderer, scene, camera, quality, { width: w, height: h });
  resize();

  window.__scene = { scene, camera, renderer, collision, tod, post, doors: openings.doors, quality: qualityName };

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
    // Let lamp fades and environment maps settle, then render.
    for (let i = 0; i < 4; i++) tod.update(0.5, camera.position);
    tod.update(0.2, camera.position);
    for (let i = 0; i < 4; i++) { renderer.info.reset(); post.render(1 / 60); await nextFrame(); }
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
    const preset = TIME_PRESETS.findIndex((p) => p.key === e.code);
    if (preset >= 0) {
      const p = tod.goToPreset(preset);
      toast(`${p.name} · ${fmtTime(p.hours)}`);
    }
    if (e.code === 'KeyL') toast(tod.lamps.toggleAll() === 'on' ? 'All lights on' : 'All lights off');
  });

  const clock = new THREE.Clock();
  let frames = 0, acc = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    controls.update(dt);
    tod.update(dt, camera.position);
    renderer.info.reset();
    post.render(dt);
    frames++; acc += dt;
    if (acc >= 0.5) {
      fpsEl.textContent = `${Math.round(frames / acc)} fps · ${renderer.info.render.calls} draws · ${qualityName} · ${tod.label}`;
      frames = 0; acc = 0;
    }
  });
}

init().catch((err) => {
  console.error(err);
  statusEl.textContent = `Error: ${err.message}`;
  window.__error = String((err && err.stack) || err);
});

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
import { buildCity } from './world/city.js';
import { mergeStatic } from './util/merge.js';
import { AutoResolution } from './render/autoRes.js';
import { Interactions } from './interact/interactions.js';
import { Avatar } from './player/avatar.js';
import { Tour } from './tour/tour.js';
import { takeScreenshot } from './ui/screenshot.js';
import { Menu, loadSettings, takeResumeState } from './ui/menu.js';
import { TouchControls, isTouchDevice } from './ui/touch.js';

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
const promptEl = document.getElementById('prompt');
const menuEl = document.getElementById('menu');
const captionEl = document.getElementById('caption');
if (isShot) document.body.classList.add('shot');

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: isShot, stencil: false });
renderer.setPixelRatio(isShot ? 1 : Math.min(window.devicePixelRatio, quality.pixelRatio));
renderer.toneMapping = THREE.NoToneMapping;          // ACES is applied in post (ToneMappingEffect)
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;     // re-rendered only when the sun, a door or the figure moves
renderer.shadowMap.needsUpdate = true;
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

// Compile every material for both lamp-pool states (lit / all dark) so switching at dusk never stalls.
async function precompileLightVariants(lamps) {
  if (!renderer.compileAsync) return;
  const was = lamps.poolVisible;
  for (const v of [true, false]) {
    lamps.setPoolVisible(v);
    try { await renderer.compileAsync(scene, camera); } catch { /* compile on first use instead */ }
  }
  lamps.setPoolVisible(was);
}

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
  const city = buildCity();
  scene.add(city.group);
  tod.onChange((t) => city.setNight(t.state.night));
  city.setNight(tod.state.night);
  const shotCam = compareId ? COMPARE_CAMERAS.find((k) => k.id === compareId) : null;
  if (params.has('t')) tod.setTime(Number(params.get('t')));
  else if (shotCam?.time !== undefined) tod.setTime(shotCam.time);

  const interactions = new Interactions({ scene, camera, lamps: tod.lamps, doors: openings.doors, occluders: [shell], promptEl });
  tod.env.registerExteriorMaterials(scene);
  if (!isShot) await precompileLightVariants(tod.lamps);

  const [w, h] = viewSize();
  post = createPost(renderer, scene, camera, quality, { width: w, height: h });
  resize();

  window.__scene = { scene, camera, renderer, collision, tod, post, city, interactions, doors: openings.doors, quality: qualityName };

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
    if (c.outdoor) tod.forceOutdoor = true;      // photo exposed for the view outside
    for (let i = 0; i < 4; i++) tod.update(0.5, camera.position);
    tod.update(0.2, camera.position);
    for (let i = 0; i < 4; i++) { renderer.info.reset(); post.render(1 / 60); await nextFrame(); }
    window.__ready = true;
    return;
  }

  const controls = new FirstPersonController(camera, renderer.domElement, collision);
  window.__scene.controls = controls;
  const settings = loadSettings();
  if (settings.sens) controls.sensitivity = PLAYER.mouseSensitivity * settings.sens;
  if (settings.fov) { camera.fov = settings.fov; camera.updateProjectionMatrix(); }
  let view = settings.view === 'third' ? 'third' : 'first';
  const resumeState = takeResumeState();
  if (resumeState) {
    controls.setPose(resumeState.x, resumeState.z, resumeState.yaw, resumeState.pitch);
    tod.setTime(resumeState.hours);
    if (resumeState.view) view = resumeState.view;
  }
  const avatar = new Avatar(scene);
  const boomOccluders = [shell, terrace, openings.group];
  const touch = isTouchDevice();
  let started = false;

  const setView = (v) => {
    view = v;
    if (view === 'first') avatar.hide();
    toast(view === 'third' ? 'Third person' : 'First person');
  };
  const toggleView = () => setView(view === 'third' ? 'first' : 'third');

  const tour = new Tour({
    camera, tod, interactions, captionEl,
    onEnd: () => { controls.enabled = !menu.open; toast('Tour finished · you can walk again'); },
  });
  const toggleTour = () => {
    if (tour.active) { tour.stop(); return; }
    menu.hide();
    if (!touch && !controls.locked) controls.lock();
    controls.enabled = false;
    avatar.hide();
    tour.start();
  };
  const screenshot = () => {
    const r = takeScreenshot({ renderer, post, camera, width: window.innerWidth, height: window.innerHeight, scale: 2 });
    toast(`Screenshot saved · ${r.width}×${r.height}`);
  };

  const menu = new Menu({
    root: menuEl, tod, controls, camera, quality: qualityName, settings,
    actions: {
      resume: () => resume(),
      tour: () => toggleTour(),
      screenshot: () => { menu.hide(); requestAnimationFrame(() => { screenshot(); openMenu(); }); },
      setView: (v) => setView(v),
      getView: () => view,
    },
  });
  window.__scene.menu = menu;
  window.__scene.tour = tour;
  window.__scene.avatar = avatar;
  window.__scene.setView = setView;

  function openMenu() {
    if (!started) return;
    tour.stop();
    controls.enabled = false;
    controls.keys.clear();
    crosshair.classList.add('hidden');
    menu.show();
  }
  function resume() {
    menu.hide();
    if (touch) { controls.enabled = true; crosshair.classList.remove('hidden'); }
    else controls.lock();
  }

  statusEl.textContent = touch ? 'Tap anywhere to start' : 'Click anywhere to start';
  startEl.addEventListener('click', () => {
    started = true;
    if (touch) { startEl.classList.add('hidden'); crosshair.classList.remove('hidden'); controls.enabled = true; }
    else controls.lock();
  });
  renderer.domElement.addEventListener('lockchange', (e) => {
    if (e.detail) {
      started = true;
      startEl.classList.add('hidden');
      menu.hide();
      crosshair.classList.remove('hidden');
      if (!tour.active) controls.enabled = true;
    } else if (!touch) {
      openMenu();
    }
  });
  const touchCtl = touch ? new TouchControls({
    root: document.getElementById('touch'), canvas: renderer.domElement, controls,
    actions: { use: () => interactions.trigger(), view: toggleView, menu: () => (menu.open ? resume() : openMenu()) },
  }) : null;

  window.addEventListener('keydown', (e) => {
    if (menu.open || e.repeat) return;
    if (e.code === 'KeyH') helpEl.classList.toggle('hidden');
    if (e.code === 'KeyF') fpsEl.classList.toggle('hidden');
    if (e.code === 'KeyP') screenshot();
    if (e.code === 'KeyC') toggleTour();
    if (tour.active) return;
    const preset = TIME_PRESETS.findIndex((p) => p.key === e.code);
    if (preset >= 0) {
      const p = tod.goToPreset(preset);
      toast(`${p.name} · ${fmtTime(p.hours)}`);
    }
    if (e.code === 'KeyL') toast(tod.lamps.toggleAll() === 'on' ? 'All lights on' : 'All lights off');
    if (e.code === 'KeyE') interactions.trigger();
    if (e.code === 'KeyV') toggleView();
  });

  const autoRes = new AutoResolution({
    renderer,
    maxRatio: Math.min(window.devicePixelRatio, quality.pixelRatio),
    minRatio: qualityName === 'high' ? 0.75 : 0.55,
    enabled: params.get('autores') !== '0',
    apply: (r) => { renderer.setPixelRatio(r); resize(); },
  });
  window.__scene.autoRes = autoRes;

  const clock = new THREE.Clock();
  let frames = 0, acc = 0;
  const eye = new THREE.Vector3();
  let avatarWasVisible = false;
  renderer.setAnimationLoop(() => {
    const raw = clock.getDelta();
    const dt = Math.min(raw, 0.1);
    autoRes.update(raw);
    if (tour.active) {
      tour.update(dt);
      interactions.originOverride = null;
    } else {
      controls.update(dt);
      if (view === 'third') {
        avatar.update(dt, controls, camera, boomOccluders, controls.moving, controls.running);
        interactions.originOverride = eye.set(controls.x, controls.feet + PLAYER.eyeHeight, controls.z);
      } else {
        interactions.originOverride = null;
      }
    }
    interactions.update(dt, started && !menu.open && !tour.active);
    // shadow map: refresh only when something that casts into it moved
    const avatarVisible = avatar.root.visible;
    if (interactions.animating || (avatarVisible && controls.moving) || avatarVisible !== avatarWasVisible) renderer.shadowMap.needsUpdate = true;
    avatarWasVisible = avatarVisible;
    touchCtl?.setUseAvailable(Boolean(interactions.hover));
    tod.update(dt, camera.position);
    renderer.info.reset();
    post.render(dt);
    frames++; acc += dt;
    if (acc >= 0.5) {
      fpsEl.textContent = `${Math.round(frames / acc)} fps · ${renderer.info.render.calls} draws · ${qualityName} ${autoRes.ratio.toFixed(2)}× · ${tod.label}`;
      frames = 0; acc = 0;
    }
  });
}

init().catch((err) => {
  console.error(err);
  statusEl.textContent = `Error: ${err.message}`;
  window.__error = String((err && err.stack) || err);
});

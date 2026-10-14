// Esc menu: time-of-day slider + presets, lights, quality, mouse sensitivity, field of view, view mode,
// cinematic tour and screenshot. Viewer preferences live in localStorage (best effort).
import { PLAYER } from '../apartment.config.js';

const KEY = 'frankrijklei-settings';
const RESUME = 'frankrijklei-resume';

export function loadSettings() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}
export function takeResumeState() {
  try {
    const s = JSON.parse(sessionStorage.getItem(RESUME));
    sessionStorage.removeItem(RESUME);
    return s;
  } catch { return null; }
}
function saveResumeState(s) {
  try { sessionStorage.setItem(RESUME, JSON.stringify(s)); } catch { /* ignore */ }
}

const fmt = (h) => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;

export class Menu {
  constructor({ root, tod, controls, camera, quality, settings, actions }) {
    this.root = root;
    this.tod = tod;
    this.controls = controls;
    this.camera = camera;
    this.settings = settings;
    this.actions = actions;     // { resume, tour, screenshot, setView, getView }
    const $ = (id) => root.querySelector(`#${id}`);
    this.el = { time: $('m-time'), timeLabel: $('m-time-label'), sens: $('m-sens'), sensLabel: $('m-sens-label'), fov: $('m-fov'), fovLabel: $('m-fov-label') };

    $('m-resume').addEventListener('click', () => actions.resume());
    // time of day
    this.el.time.addEventListener('input', () => { tod.setTime(Number(this.el.time.value)); this.refresh(); });
    root.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => { tod.goToPreset(Number(b.dataset.preset)); this.refresh(); }));
    // lights
    this.seg('m-lights', (v) => {
      if (v === 'auto') { tod.lamps.clearManual(); tod.lamps.setMode('auto'); } else { tod.lamps.clearManual(); tod.lamps.setMode(v); }
    }, () => tod.lamps.mode);
    // quality: reload with the same pose, time and view
    this.seg('m-quality', (v) => {
      if (v === quality) return;
      saveResumeState({ x: controls.x, z: controls.z, yaw: controls.yaw, pitch: controls.pitch, hours: tod.hours, view: actions.getView() });
      const url = new URL(location.href);
      url.searchParams.set('q', v);
      location.replace(url.toString());
    }, () => quality);
    // sensitivity & fov
    this.el.sens.addEventListener('input', () => {
      const k = Number(this.el.sens.value);
      controls.sensitivity = PLAYER.mouseSensitivity * k;
      settings.sens = k; saveSettings(settings); this.refresh();
    });
    this.el.fov.addEventListener('input', () => {
      const f = Number(this.el.fov.value);
      camera.fov = f; camera.updateProjectionMatrix();
      settings.fov = f; saveSettings(settings); this.refresh();
    });
    this.seg('m-view', (v) => { actions.setView(v); settings.view = v; saveSettings(settings); }, () => actions.getView());
    $('m-tour').addEventListener('click', () => actions.tour());
    $('m-shot').addEventListener('click', () => actions.screenshot());
    tod.onChange(() => { if (this.open) this.refreshTime(); });
  }

  seg(id, onPick, current) {
    const box = this.root.querySelector(`#${id}`);
    const buttons = [...box.querySelectorAll('button')];
    buttons.forEach((b) => b.addEventListener('click', () => { onPick(b.dataset.v); this.refresh(); }));
    (this.segs ||= []).push({ buttons, current });
  }

  refreshTime() {
    this.el.time.value = this.tod.hours;
    this.el.timeLabel.textContent = fmt(this.tod.hours);
  }

  refresh() {
    this.refreshTime();
    const k = this.controls.sensitivity / PLAYER.mouseSensitivity;
    this.el.sens.value = k;
    this.el.sensLabel.textContent = `${k.toFixed(2)}×`;
    this.el.fov.value = this.camera.fov;
    this.el.fovLabel.textContent = `${Math.round(this.camera.fov)}°`;
    for (const s of this.segs) {
      const cur = s.current();
      s.buttons.forEach((b) => b.classList.toggle('on', b.dataset.v === cur));
    }
  }

  show() { this.open = true; this.refresh(); this.root.classList.remove('hidden'); }
  hide() { this.open = false; this.root.classList.add('hidden'); }
}


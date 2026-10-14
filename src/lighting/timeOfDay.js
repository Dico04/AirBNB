// Time-of-day controller. One number (local time on SITE.defaultDate) drives everything:
// real solar position for Antwerp → sun/moon light, sky dome, clouds, image-based lighting,
// skylight through the windows, haze, exposure and the lamps' dusk switch.
import * as THREE from 'three';
import { SITE, DAYLIGHT_KEYS, LIGHTING, TIME_PRESETS } from '../apartment.config.js';
import { solarPosition, localTimeToDate, directionFromBearing } from './sun.js';
import { SkyDome } from './sky.js';
import { EnvironmentLighting } from './environment.js';
import { WindowLights } from './windowLights.js';
import { Lamps, roomAtPlan } from './lamps.js';

const COLOR_KEYS = ['sun', 'zenith', 'horizon', 'ground', 'cloudLit', 'cloudShade', 'win'];
const NUM_KEYS = ['sunI', 'envExt', 'envIn', 'winI', 'exposure', 'night'];
const smooth = (t) => t * t * (3 - 2 * t);
const wrap24 = (h) => ((h % 24) + 24) % 24;

// Pre-convert keyframe colours (hex sRGB → linear working space).
const KEYS = DAYLIGHT_KEYS.map((k) => {
  const o = { alt: k.alt };
  for (const c of COLOR_KEYS) o[c] = new THREE.Color(k[c]);
  for (const n of NUM_KEYS) o[n] = k[n];
  return o;
});

function sampleKeys(alt, out) {
  let i = 0;
  while (i < KEYS.length - 2 && alt > KEYS[i + 1].alt) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = smooth(THREE.MathUtils.clamp((alt - a.alt) / (b.alt - a.alt), 0, 1));
  for (const c of COLOR_KEYS) (out[c] ||= new THREE.Color()).copy(a[c]).lerp(b[c], t);
  for (const n of NUM_KEYS) out[n] = a[n] + (b[n] - a[n]) * t;
  return out;
}

export class TimeOfDay {
  constructor({ renderer, scene, quality }) {
    this.renderer = renderer;
    this.scene = scene;
    this.sky = new SkyDome({ cloudOctaves: quality.pointSlots <= 3 ? 3 : 5 });
    this.sky.uniforms.cloudCover.value = LIGHTING.clouds.cover;
    scene.add(this.sky.mesh);
    this.env = new EnvironmentLighting(renderer, scene, this.sky);
    this.windows = new WindowLights(scene, quality.windowLights);
    this.lamps = new Lamps(scene, quality);

    // Sun by day, moon by night (same light, swapped while it is dim).
    this.sun = new THREE.DirectionalLight(0xffffff, 0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(quality.shadowMap, quality.shadowMap);
    const c = this.sun.shadow.camera;
    c.left = -12; c.right = 12; c.top = 12; c.bottom = -12; c.near = 1; c.far = 90;
    this.sun.shadow.bias = -0.0003;
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 3;
    this.focus = new THREE.Vector3(3.6, 0, 7.2);
    this.sun.target.position.copy(this.focus);
    scene.add(this.sun, this.sun.target);
    this.moonDir = directionFromBearing(LIGHTING.moon.bearing, LIGHTING.moon.altitude, new THREE.Vector3());
    this.moonColor = new THREE.Color(LIGHTING.moon.color);

    scene.fog = new THREE.FogExp2(0xffffff, LIGHTING.fogDensity);

    this.adapt = 1;              // eye-adaptation multiplier (outdoors in daylight → darker)
    this.hours = SITE.defaultTime;
    this.anim = null;
    this.state = {};
    this.sunDir = new THREE.Vector3();
    this.sunHoriz = new THREE.Vector2();
    this._envTimer = 0;
    this._envDirty = true;
    this.listeners = new Set();
    this.apply();
    this.env.update();
    this._envDirty = false;
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  // Jump immediately.
  setTime(hours) {
    this.anim = null;
    this.hours = wrap24(hours);
    this.apply();
    this._envDirty = true;
  }

  // Animate along the real solar path (shortest way round the clock).
  goTo(hours, seconds = LIGHTING.transitionSeconds) {
    let delta = wrap24(hours) - this.hours;
    if (delta > 12) delta -= 24;
    if (delta < -12) delta += 24;
    this.anim = { from: this.hours, delta, t: 0, dur: Math.max(0.01, seconds) };
    this.lamps.setMode('auto');
    this.lamps.clearManual();
  }

  goToPreset(index) {
    const p = TIME_PRESETS[index];
    if (p) this.goTo(p.hours);
    return p;
  }

  get label() {
    const h = Math.floor(this.hours), m = Math.round((this.hours - h) * 60) % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  apply() {
    const date = localTimeToDate(this.hours);
    const { altitude, azimuth } = solarPosition(date);
    this.altitude = altitude;
    this.azimuth = azimuth;
    directionFromBearing(azimuth, altitude, this.sunDir);
    const s = sampleKeys(altitude, this.state);

    // Sky dome.
    const u = this.sky.uniforms;
    u.sunDir.value.copy(this.sunDir);
    u.sunColor.value.copy(s.sun);
    u.sunVisible.value = THREE.MathUtils.smoothstep(altitude, -2.5, 1.0);
    u.zenith.value.copy(s.zenith);
    u.horizon.value.copy(s.horizon);
    u.groundCol.value.copy(s.ground);
    u.cloudLit.value.copy(s.cloudLit);
    u.cloudShade.value.copy(s.cloudShade);
    u.night.value = s.night;
    u.brightness.value = 2.1;

    // Direct light: sun above ~-1°, moon below ~-6°, crossfade through near-darkness.
    const sunPart = THREE.MathUtils.smoothstep(altitude, -1.0, 2.0);
    const moonPart = 1 - THREE.MathUtils.smoothstep(altitude, -8.0, -4.0);
    const dir = sunPart > 0.001 || moonPart < 0.001 ? this.sunDir : this.moonDir;
    if (dir === this.sunDir) {
      this.sun.color.copy(s.sun);
      this.sun.intensity = s.sunI * sunPart;
    } else {
      this.sun.color.copy(this.moonColor);
      this.sun.intensity = s.sunI * moonPart;
    }
    // Keep the light above the horizon for shadow sanity.
    const d = dir.clone();
    if (d.y < 0.05) { d.y = 0.05; d.normalize(); }
    this.sun.position.copy(this.focus).addScaledVector(d, 45);

    // Skylight through the windows.
    this.sunHoriz.set(this.sunDir.x, this.sunDir.z);
    if (this.sunHoriz.lengthSq() > 0) this.sunHoriz.normalize();
    this.windows.update(s.win, s.winI, this.sunHoriz, sunPart);

    // Image-based lighting (PMREMs refreshed by update()).
    const daylight = THREE.MathUtils.clamp(s.winI / 3.0, 0, 1);
    this.env.exteriorIntensity = s.envExt;
    this.env.setInterior({ daylight: 0.25 + 0.75 * daylight, windowColor: s.win, lampLevel: this.lamps.interiorLevel * 0.26, intensity: s.envIn });
    this.env.applyExterior();
    this.scene.environmentIntensity = s.envIn;

    // Haze and exposure.
    this.scene.fog.color.copy(s.horizon).multiplyScalar(0.9);
    this.renderer.toneMappingExposure = s.exposure * this.adapt;

    this.lamps.setNight(s.night);
    for (const fn of this.listeners) fn(this);
  }

  update(dt, cameraPos) {
    if (this.anim) {
      const a = this.anim;
      a.t = Math.min(1, a.t + dt / a.dur);
      const e = a.t < 0.5 ? 4 * a.t * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 3) / 2;   // ease in-out cubic
      this.hours = wrap24(a.from + a.delta * e);
      this.apply();
      this._envDirty = true;
      if (a.t >= 1) this.anim = null;
    }
    // Eye adaptation: outdoors in daylight the exposure drops (like a photographer re-exposing).
    const outside = this.forceOutdoor || roomAtPlan(cameraPos.x, cameraPos.z) === 'terrace' || cameraPos.y > 3.2;
    const target = outside ? THREE.MathUtils.lerp(LIGHTING.outdoorExposure, 1, this.state.night) : 1;
    if (this._adaptInit === undefined) { this.adapt = target; this._adaptInit = true; }
    this.adapt += (target - this.adapt) * Math.min(1, dt / LIGHTING.adaptSeconds);
    this.renderer.toneMappingExposure = this.state.exposure * this.adapt;
    this.sky.uniforms.cloudTime.value += dt * LIGHTING.clouds.speed;
    this.sky.mesh.position.copy(cameraPos);
    this.lamps.update(dt, cameraPos);
    // Lamp level feeds the interior IBL warmth at night.
    const lampLevel = this.lamps.interiorLevel * 0.26;
    if (Math.abs(lampLevel - this.env.interiorUniforms.lampLevel.value) > 0.01) {
      this.env.interiorUniforms.lampLevel.value = lampLevel;
      this._envDirty = true;
    }
    // Refresh environment maps at most ~8×/s while things change.
    this._envTimer -= dt;
    if (this._envDirty && this._envTimer <= 0) {
      this.env.update();
      this._envDirty = false;
      this._envTimer = 0.12;
    }
  }
}

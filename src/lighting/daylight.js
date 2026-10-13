// Daylight rig: physical-ish sky dome, sun with soft shadows, sky fill and a PMREM environment.
// (Step 2 baseline; step 3 extends this into the full time-of-day system.)
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { SITE } from '../apartment.config.js';
import { sunDirection } from './sun.js';

export class Daylight {
  constructor(renderer, scene, { shadowMapSize = 2048 } = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.pmrem = new THREE.PMREMGenerator(renderer);

    this.sky = new Sky();
    this.sky.scale.setScalar(4500);
    const u = this.sky.material.uniforms;
    u.turbidity.value = 3.2;
    u.rayleigh.value = 1.1;
    u.mieCoefficient.value = 0.004;
    u.mieDirectionalG.value = 0.8;
    scene.add(this.sky);

    this.sun = new THREE.DirectionalLight('#fff1dc', 3.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    const c = this.sun.shadow.camera;
    c.left = -13; c.right = 13; c.top = 13; c.bottom = -13; c.near = 1; c.far = 80;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.025;
    this.sun.shadow.radius = 4;
    this.focus = new THREE.Vector3(3.8, 0, 7.5);
    this.sun.target.position.copy(this.focus);
    scene.add(this.sun, this.sun.target);

    this.hemi = new THREE.HemisphereLight('#e9eef6', '#d6c3a8', 0.25);
    scene.add(this.hemi);

    // Environment for image-based lighting: a soft daylight gradient (zenith → bright horizon →
    // warm ground bounce) with a glow toward the sun. Warmer and calmer than the raw sky shader,
    // which keeps white interiors from turning blue.
    this.envScene = new THREE.Scene();
    this.envUniforms = {
      zenith: { value: new THREE.Color('#b8c9e2') },
      horizon: { value: new THREE.Color('#f5f0e8') },
      ground: { value: new THREE.Color('#d6cdc2') },
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      sunGlow: { value: new THREE.Color('#fff0d8') },
      intensity: { value: 1.0 },
    };
    const envMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: this.envUniforms,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 zenith, horizon, ground, sunGlow, sunDir; uniform float intensity; varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          vec3 c = d.y > 0.0 ? mix(horizon, zenith, pow(d.y, 0.55)) : mix(horizon, ground, pow(-d.y, 0.35));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          c += sunGlow * (0.35 * pow(s, 6.0) + 1.6 * pow(s, 64.0));
          gl_FragColor = vec4(c * intensity, 1.0);
        }`,
    });
    this.envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), envMat));
    this.envTarget = null;
    this.sunDir = new THREE.Vector3();
    this.setTime(SITE.defaultTime);
  }

  setTime(hours) {
    const { dir, altitude } = sunDirection(hours, this.sunDir);
    this.altitude = altitude;
    this.sky.material.uniforms.sunPosition.value.copy(dir);
    this.envUniforms.sunDir.value.copy(dir);
    this.sun.position.copy(this.focus).addScaledVector(dir, 40);
    // Warmer, weaker sun near the horizon.
    const t = THREE.MathUtils.clamp(altitude / 40, 0, 1);
    this.sun.color.setRGB(1.0, 0.80 + 0.16 * t, 0.62 + 0.28 * t);
    this.sun.intensity = altitude > 0 ? 0.6 + 2.8 * Math.pow(t, 0.6) : 0;
    this.updateEnvironment();
  }

  updateEnvironment() {
    if (this.envTarget) this.envTarget.dispose();
    this.envTarget = this.pmrem.fromScene(this.envScene, 0.02);
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = 0.85;
  }
}

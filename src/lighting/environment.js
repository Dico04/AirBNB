// Image-based lighting.
//  • Exterior env: PMREM of the live sky dome (reflections + ambient for terrace & façades).
//  • Interior env: PMREM of a warm "room proxy" (bright window side, warm floor bounce, pale ceiling)
//    so white interiors stay neutral-warm instead of picking up raw blue sky.
import * as THREE from 'three';

const interiorFrag = /* glsl */ `
  uniform vec3 top, wall, floorCol, windowCol, windowDir, lampCol;
  uniform float lampLevel;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    vec3 c = d.y > 0.0 ? mix(wall, top, smoothstep(0.0, 0.9, d.y)) : mix(wall, floorCol, smoothstep(0.0, 0.7, -d.y));
    // Window side: broad lobe toward the main glazing.
    float w = max(dot(d, normalize(windowDir)), 0.0);
    c += windowCol * (0.55 * pow(w, 2.0) + 0.6 * pow(w, 10.0)) * smoothstep(-0.35, 0.25, d.y);
    // Warm lamp bounce at night (lamps sit low, light comes from around and above).
    c += lampCol * lampLevel * (0.55 + 0.45 * smoothstep(-0.6, 0.8, d.y));
    gl_FragColor = vec4(c, 1.0);
  }
`;
const domeVert = /* glsl */ `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export class EnvironmentLighting {
  constructor(renderer, scene, sky) {
    this.renderer = renderer;
    this.scene = scene;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.pmrem.compileCubemapShader();

    // Sky capture scene (shares the sky shader uniforms).
    this.skyScene = new THREE.Scene();
    this.skyScene.add(sky.makeProbe(50));

    // Interior proxy scene.
    this.interiorUniforms = {
      top: { value: new THREE.Color() },
      wall: { value: new THREE.Color() },
      floorCol: { value: new THREE.Color() },
      windowCol: { value: new THREE.Color() },
      windowDir: { value: new THREE.Vector3(0, 0.15, 1) },   // plan-south = terrace façade (+z)
      lampCol: { value: new THREE.Color('#ffd3a6') },
      lampLevel: { value: 0 },
    };
    this.interiorScene = new THREE.Scene();
    this.interiorScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(50, 48, 24),
      new THREE.ShaderMaterial({ uniforms: this.interiorUniforms, vertexShader: domeVert, fragmentShader: interiorFrag, side: THREE.BackSide, depthWrite: false }),
    ));

    this.exteriorRT = null;
    this.interiorRT = null;
    this.exteriorMaterials = new Set();
    this.exteriorIntensity = 1;
  }

  // Exterior materials (userData.exterior) get the sky env; interior materials that need their
  // own reflection strength (userData.envScale, e.g. black glass) get the interior env explicitly.
  registerExteriorMaterials(root) {
    this.scaledMaterials ||= new Set();
    root.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m) continue;
        if (m.userData.exterior) this.exteriorMaterials.add(m);
        else if (m.userData.envScale !== undefined) this.scaledMaterials.add(m);
      }
    });
    this.applyExterior();
  }

  applyExterior() {
    const tex = this.exteriorRT ? this.exteriorRT.texture : null;
    for (const m of this.exteriorMaterials) {
      if (m.envMap !== tex) { m.envMap = tex; m.needsUpdate = true; }
      m.envMapIntensity = this.exteriorIntensity * (m.userData.envBoost ?? 1);
    }
    const itex = this.interiorRT ? this.interiorRT.texture : null;
    for (const m of this.scaledMaterials || []) {
      if (m.envMap !== itex) { m.envMap = itex; m.needsUpdate = true; }
      m.envMapIntensity = (this.interiorIntensity ?? 1) * m.userData.envScale;
    }
  }

  // Interior proxy colours from the current daylight state.
  setInterior({ daylight, windowColor, lampLevel, intensity }) {
    const u = this.interiorUniforms;
    const k = daylight;
    // Room bounce takes on part of the window light's tint (warm at sunset, neutral at noon).
    const tint = new THREE.Color(1, 1, 1).lerp(windowColor, 0.45);
    u.top.value.setRGB(0.92, 0.90, 0.87).multiply(tint).multiplyScalar(0.55 * k);
    u.wall.value.setRGB(0.95, 0.92, 0.87).multiply(tint).multiplyScalar(0.75 * k);
    u.floorCol.value.setRGB(0.86, 0.74, 0.60).multiply(tint).multiplyScalar(0.62 * k);
    u.windowCol.value.copy(windowColor).multiplyScalar(1.1 * k);
    u.lampLevel.value = lampLevel;
    this.interiorIntensity = intensity;
  }

  update() {
    const old = [this.exteriorRT, this.interiorRT];
    this.exteriorRT = this.pmrem.fromScene(this.skyScene, 0, 0.1, 100);
    this.interiorRT = this.pmrem.fromScene(this.interiorScene, 0.02, 0.1, 100);
    this.scene.environment = this.interiorRT.texture;
    this.scene.environmentIntensity = this.interiorIntensity ?? 1;
    this.applyExterior();
    for (const rt of old) if (rt) rt.dispose();
  }
}

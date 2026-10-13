// Analytic sky dome: daylight gradient, Mie glow, sun disc, drifting procedural cumulus clouds
// lit from the sun side, and stars at night. Outputs linear HDR (tone mapping happens in post).
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w; // keep the dome at the far plane
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 sunDir;
  uniform vec3 sunColor;
  uniform float sunVisible;
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 groundCol;
  uniform vec3 cloudLit;
  uniform vec3 cloudShade;
  uniform float cloudCover;
  uniform float cloudTime;
  uniform float night;
  uniform float brightness;
  uniform float cloudOctaves;
  uniform float saturation;
  varying vec3 vDir;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash12(i), b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0)), d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 6; i++) {
      if (float(i) >= cloudOctaves) break;
      s += a * vnoise(p);
      p = r * p * 2.03 + 11.7;
      a *= 0.5;
    }
    return s;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 sd = normalize(sunDir);

    // Base gradient: bright, slightly warm horizon band fading to the zenith colour.
    vec3 col = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.32));
    col += horizon * 0.12 * exp(-abs(h) * 18.0);
    // Below the horizon: hazy city ground tone.
    if (h < 0.0) col = mix(horizon * 0.92, groundCol, clamp(-h * 5.0, 0.0, 1.0));

    // Mie forward scattering around the sun + sun disc.
    float cs = max(dot(d, sd), 0.0);
    col += sunColor * sunVisible * (0.10 * pow(cs, 6.0) + 0.45 * pow(cs, 90.0));
    float disc = smoothstep(0.99975, 0.99990, cs);
    col += sunColor * disc * 45.0 * sunVisible;

    // Cumulus clouds on a curved plane.
    if (h > 0.0 && cloudCover > 0.001) {
      vec2 uv = d.xz / (h + 0.10) * 0.55 + vec2(cloudTime * 1.0, cloudTime * 0.35);
      // Cumulus: mid-size puffs, grouped into fields by a slow modulation.
      float field = 0.62 + 0.38 * vnoise(uv * 0.9 + 3.7);
      float n = fbm(uv * 3.4) * field + 0.18 * (1.0 - field);
      float lo = 1.0 - cloudCover;
      float cov = smoothstep(lo, lo + 0.11, n);
      // Self-shadowing: sample again offset toward the sun; denser toward the sun = darker underside.
      float n2 = fbm(uv * 3.4 + sd.xz * 0.09) * field + 0.18 * (1.0 - field);
      float lit = clamp(0.70 + (n - n2) * 5.0 + cs * 0.25 + (n - lo) * 0.9, 0.0, 1.35);
      vec3 cloud = mix(cloudShade, cloudLit, lit);
      // silver lining near the sun
      cloud += sunColor * sunVisible * pow(cs, 24.0) * (1.0 - cov) * 0.8;
      float fade = smoothstep(0.0, 0.16, h);
      col = mix(col, cloud, cov * fade * 0.92);
    }

    // Stars.
    if (night > 0.01 && h > 0.02) {
      vec3 p = d * 320.0;
      vec3 cell = floor(p);
      float r = hash12(cell.xz + cell.y * 17.13);
      float star = step(0.9965, r) * smoothstep(0.42, 0.0, length(fract(p) - 0.5));
      float twinkle = 0.6 + 0.4 * hash12(cell.xy + 3.1);
      col += vec3(0.9, 0.95, 1.0) * star * twinkle * night * 3.0 * smoothstep(0.02, 0.3, h);
    }

    float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(l), col, saturation);
    gl_FragColor = vec4(col * brightness, 1.0);
  }
`;

export class SkyDome {
  constructor({ radius = 4000, cloudOctaves = 5 } = {}) {
    this.uniforms = {
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      sunColor: { value: new THREE.Color(1, 1, 1) },
      sunVisible: { value: 1 },
      zenith: { value: new THREE.Color() },
      horizon: { value: new THREE.Color() },
      groundCol: { value: new THREE.Color() },
      cloudLit: { value: new THREE.Color() },
      cloudShade: { value: new THREE.Color() },
      cloudCover: { value: 0.45 },
      cloudTime: { value: 0 },
      night: { value: 0 },
      brightness: { value: 1 },
      cloudOctaves: { value: cloudOctaves },
      saturation: { value: 1 },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32), this.material);
    this.mesh.name = 'sky';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
  }

  // Lower-res copy for PMREM environment capture (shares uniforms).
  // Shares every uniform with the visible sky except saturation: the light the sky casts is less
  // blue than the sky looks (photographers white-balance shadows toward neutral).
  makeProbe(radius = 50, saturation = 0.55) {
    const material = this.material.clone();
    material.uniforms = { ...this.uniforms, saturation: { value: saturation } };
    const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), material);
    m.frustumCulled = false;
    return m;
  }
}

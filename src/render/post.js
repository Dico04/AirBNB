// Post-processing: N8AO ambient occlusion → bloom → ACES filmic tone mapping → vignette → SMAA.
// Rendering happens in linear HDR (half-float) buffers; tone mapping and sRGB output at the end.
import * as THREE from 'three';
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode,
  SMAAEffect, SMAAPreset, VignetteEffect,
} from 'postprocessing';
import { N8AOPostPass } from 'n8ao';

export function createPost(renderer, scene, camera, quality, { width, height }) {
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new RenderPass(scene, camera));

  const ao = new N8AOPostPass(scene, camera, width, height);
  ao.setQualityMode(quality.ao);
  Object.assign(ao.configuration, {
    aoRadius: 0.55,          // metres: room-scale contact shadows in corners, under furniture
    distanceFalloff: 1.0,
    intensity: 2.4,
    color: new THREE.Color(0, 0, 0),
    halfRes: quality.aoHalfRes,
    gammaCorrection: false,
    screenSpaceRadius: false,
  });
  composer.addPass(ao);

  const effects = [];
  let bloom = null;
  if (quality.bloom) {
    bloom = new BloomEffect({ intensity: 0.32, luminanceThreshold: 1.05, luminanceSmoothing: 0.35, mipmapBlur: true, radius: 0.62 });
    effects.push(bloom);
  }
  const toneMapping = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
  effects.push(toneMapping);
  effects.push(new VignetteEffect({ offset: 0.34, darkness: 0.32 }));
  composer.addPass(new EffectPass(camera, ...effects));
  if (quality.smaa) composer.addPass(new EffectPass(camera, new SMAAEffect({ preset: SMAAPreset.HIGH })));

  return {
    composer,
    ao,
    bloom,
    setSize(w, h) { composer.setSize(w, h); },
    render(dt) { composer.render(dt); },
  };
}

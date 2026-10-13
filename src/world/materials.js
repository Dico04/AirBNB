// Shared PBR materials built from procedural texture sets + config colours.
import * as THREE from 'three';
import { COLORS } from '../apartment.config.js';
import * as T from '../textures/procedural.js';

function fromSet(set, params = {}) {
  const repeat = new THREE.Vector2(1 / set.size[0], 1 / set.size[1]);
  const maps = {};
  for (const k of ['map', 'roughnessMap', 'normalMap']) {
    const t = set[k].clone();
    t.repeat.copy(repeat);
    t.needsUpdate = true;
    maps[k] = t;
  }
  return new THREE.MeshStandardMaterial({ ...maps, roughness: 1, metalness: 0, ...params });
}

let M = null;

export function getMaterials() {
  if (M) return M;
  const oakSet = T.oakPlanks({ base: COLORS.oakBase, light: COLORS.oakLight, dark: COLORS.oakDark });
  const platformSet = T.oakPlanks({ base: COLORS.oakPlatformTop, light: '#e0bc92', dark: '#c49a6c', plankW: 0.18, planks: 6, lengthM: 3.6, px: 512, seed: 17, key: 'oak-platform' });
  M = {
    plaster: fromSet(T.plaster({ color: COLORS.wall }), { normalScale: new THREE.Vector2(0.16, 0.16) }),
    ceiling: fromSet(T.plaster({ color: COLORS.ceiling, key: 'ceiling', amp: 0.008 }), { normalScale: new THREE.Vector2(0.1, 0.1) }),
    render: fromSet(T.render({ color: COLORS.render }), { normalScale: new THREE.Vector2(0.3, 0.3) }),
    renderTall: fromSet(T.render({ color: COLORS.renderTallWall, key: 'render-tall', seed: 33 }), { normalScale: new THREE.Vector2(0.25, 0.25) }),
    oakFloor: fromSet(oakSet, { normalScale: new THREE.Vector2(0.6, 0.6) }),
    oakPlatform: fromSet(platformSet, { normalScale: new THREE.Vector2(0.5, 0.5) }),
    tiles: fromSet(T.tiles({ color: COLORS.tile, grout: COLORS.tileGrout })),
    landing: fromSet(T.terrazzo({ color: COLORS.landingFloor })),
    deck: fromSet(T.decking({ color: COLORS.deck }), { normalScale: new THREE.Vector2(0.9, 0.9) }),
    parapetBoards: fromSet(T.paintedBoards({ color: COLORS.parapetBoards })),
    veneer: fromSet(T.oakVeneer({ color: COLORS.doorLeafOak }), { normalScale: new THREE.Vector2(0.4, 0.4) }),
    bluestone: fromSet(T.bluestone({ color: COLORS.bluestone })),
    gravel: fromSet(T.gravel({ color: COLORS.roof })),
    skirting: new THREE.MeshStandardMaterial({ color: COLORS.skirting, roughness: 0.55 }),
    whitePaint: new THREE.MeshStandardMaterial({ color: COLORS.skirting, roughness: 0.45 }),
    pvc: new THREE.MeshStandardMaterial({ color: COLORS.pvc, roughness: 0.35 }),
    gasket: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.8 }),
    frontDoor: new THREE.MeshStandardMaterial({ color: COLORS.frontDoor, roughness: 0.4 }),
    blackSteel: new THREE.MeshStandardMaterial({ color: COLORS.doorFrameBlack, roughness: 0.45, metalness: 0.3 }),
    satinSteel: new THREE.MeshStandardMaterial({ color: COLORS.satinSteel, roughness: 0.3, metalness: 1 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#d8dadc', roughness: 0.12, metalness: 1 }),
    coping: new THREE.MeshStandardMaterial({ color: COLORS.coping, roughness: 0.9 }),
    chimney: fromSet(T.render({ color: COLORS.chimney, key: 'render-chimney', seed: 35 }), { normalScale: new THREE.Vector2(0.4, 0.4) }),
    chimneyCap: new THREE.MeshStandardMaterial({ color: COLORS.chimneyCap, roughness: 0.85 }),
    blind: new THREE.MeshStandardMaterial({ color: COLORS.blind, roughness: 0.85 }),
    darkVoid: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 1 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#ffffff', metalness: 0, roughness: 0.03, transmission: 0, transparent: true, opacity: 0.14,
      ior: 1.5, reflectivity: 0.6, envMapIntensity: 1.0, depthWrite: false, side: THREE.DoubleSide,
    }),
  };
  M.buildingBody = M.render;
  // Exterior surfaces take the live sky environment instead of the warm interior one.
  for (const k of ['render', 'renderTall', 'deck', 'parapetBoards', 'gravel', 'coping', 'chimney', 'chimneyCap', 'glass']) M[k].userData.exterior = true;
  M.glass.userData.envBoost = 1.4;
  M.deck.userData.envBoost = 0.55;          // weathered wood: little sky reflection, stays warm grey
  M.parapetBoards.userData.envBoost = 0.8;
  return M;
}

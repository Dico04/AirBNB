// Builds every room's furniture & props, then merges static geometry per room by material.
import * as THREE from 'three';
import { buildKitchen } from './kitchen.js';
import { buildLiving } from './living.js';
import { buildCorridor } from './corridor.js';
import { buildBedroom } from './bedroom.js';
import { buildBathroom } from './bathroom.js';
import { buildTerrace } from './terrace.js';
import { mergeStatic } from '../util/merge.js';

export function buildFurniture(collision, lamps) {
  const root = new THREE.Group();
  root.name = 'furniture';
  const rooms = [
    buildKitchen(collision, lamps), buildLiving(collision, lamps), buildCorridor(collision, lamps),
    buildBedroom(collision, lamps), buildBathroom(collision, lamps), buildTerrace(collision, lamps),
  ];
  for (const r of rooms) {
    root.add(r);
    mergeStatic(r, { name: `${r.name}-merged` });
  }
  return root;
}

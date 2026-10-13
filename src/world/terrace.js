// Roof terrace structure: deck, white-board parapets, tall rendered west wall, chimney stack.
import * as THREE from 'three';
import { TERRACE, DIMS } from '../apartment.config.js';
import { planBox, planRoundedBox, mesh } from '../util/geometry.js';
import { getMaterials } from './materials.js';

export function buildTerrace(collision) {
  const M = getMaterials();
  const group = new THREE.Group();
  group.name = 'terrace';
  const D = DIMS.deck;

  // ---------------------------------------------------------------- deck
  const [dx0, dy0, dx1, dy1] = TERRACE.deck.rect;
  const deckMats = [M.darkVoid, M.darkVoid, M.deck, M.darkVoid, M.darkVoid, M.darkVoid];
  group.add(mesh(planBox(dx0, dy0, dx1, dy1, 0, D), deckMats, { cast: false, name: 'deck' }));
  collision.addFloor(dx0, dy0, dx1, dy1, D);

  // ---------------------------------------------------------------- parapets
  const top = D + DIMS.parapet;
  for (const p of TERRACE.parapets) {
    const [x0, y0, x1, y1] = p.rect;
    // Core with render outside; inner face gets the board cladding (separate thin skin).
    group.add(mesh(planBox(x0, y0, x1, y1, 0, top - 0.03), M.render, { name: `parapet-${p.id}` }));
    collision.addBox(x0, y0, x1, y1, 0, top);
    const skin = 0.018;
    let clad;
    if (p.innerFace === 'n') clad = planBox(x0 + 0.3, y0 - skin, x1, y0, D, top - 0.03);
    else if (p.innerFace === 'w') clad = planBox(x0 - skin, y0, x0, y1 - 0.0, D, top - 0.03);
    group.add(mesh(clad, M.parapetBoards, { name: `parapet-boards-${p.id}` }));
    // Cap board, slightly overhanging on the inside.
    if (p.innerFace === 'n') group.add(mesh(planRoundedBox(x0, y0 - 0.04, x1, y1 + 0.01, top - 0.03, top, 0.006), M.parapetBoards));
    else group.add(mesh(planRoundedBox(x0 - 0.04, y0, x1 + 0.01, y1, top - 0.03, top, 0.006), M.parapetBoards));
    // Posts along the inner face.
    const len = p.innerFace === 'n' ? x1 - (x0 + 0.3) : y1 - y0;
    const n = Math.max(1, Math.round(len / TERRACE.parapetPostSpacing));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const s = 0.07;
      if (p.innerFace === 'n') {
        const x = Math.min(x1 - s / 2, Math.max(x0 + 0.3 + s / 2, x0 + 0.3 + t * len));
        group.add(mesh(planRoundedBox(x - s / 2, y0 - skin - s, x + s / 2, y0 - skin, D, top - 0.03, 0.006), M.parapetBoards));
      } else {
        const y = Math.min(y1 - s / 2, Math.max(y0 + s / 2, y0 + t * len));
        group.add(mesh(planRoundedBox(x0 - skin - s, y - s / 2, x0 - skin, y + s / 2, D, top - 0.03, 0.006), M.parapetBoards));
      }
    }
  }

  // ---------------------------------------------------------------- tall west wall (neighbouring building)
  {
    const tw = TERRACE.tallWall;
    const [x0, y0, x1, y1] = tw.rect;
    const h1 = D + DIMS.tallWall;
    group.add(mesh(planBox(x0, y0, x1, y1, 0, h1), M.renderTall, { name: 'tall-wall' }));
    group.add(mesh(planBox(x0 - 0.02, y0, x1 + 0.02, y1, h1, h1 + 0.06), M.coping));
    collision.addBox(x0, y0, x1, y1, 0, h1);
    // Small square vents near the top (recessed dark squares with a thin grille frame).
    for (const vy of tw.vents) {
      const s = tw.ventSize;
      group.add(mesh(planBox(x1 - 0.004, vy - s / 2, x1 + 0.002, vy + s / 2, tw.ventH, tw.ventH + s), M.renderTall, { cast: false }));
      group.add(mesh(planBox(x1 + 0.002, vy - s / 2 + 0.02, x1 + 0.004, vy + s / 2 - 0.02, tw.ventH + 0.02, tw.ventH + s - 0.02), M.gasket, { cast: false }));
    }
  }

  // ---------------------------------------------------------------- chimney stack on the roof edge
  {
    const c = TERRACE.chimney;
    const s = c.size / 2;
    const [cx, cy] = c.center;
    group.add(mesh(planBox(cx - s, cy - s, cx + s, cy + s, DIMS.roofTop, c.top), M.chimney, { name: 'chimney' }));
    group.add(mesh(planBox(cx - s - 0.05, cy - s - 0.05, cx + s + 0.05, cy + s + 0.05, c.top, c.top + 0.07), M.coping));
    // Stacked louvred vent cap.
    const v = 0.17;
    for (let i = 0; i < 4; i++) {
      const h0 = c.top + 0.07 + i * 0.075;
      const inset = i === 3 ? 0 : 0.02;
      group.add(mesh(planBox(cx - v - 0.03 + inset, cy - v - 0.03 + inset, cx + v + 0.03 - inset, cy + v + 0.03 - inset, h0 + 0.035, h0 + 0.06), M.chimneyCap));
      group.add(mesh(planBox(cx - v, cy - v, cx + v, cy + v, h0, h0 + 0.035), M.darkVoid));
    }
  }

  return group;
}

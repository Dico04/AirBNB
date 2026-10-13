# Frankrijklei rooftop: 3D walkthrough

A walkable, browser-based 3D model of a top-floor Airbnb apartment and its roof terrace on the Frankrijklei in Antwerp. It's built with Vite and Three.js from primitives and procedural canvas textures, so it needs no downloaded models or images and runs fully offline.

`SPEC.md` holds the floor plan, the per-room inventory and the decisions behind them. The reference photos are in `reference/`.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (relative paths, host it from any folder)
npm run preview    # serve the built dist/ locally
```

## Controls (so far)

| Key | Action |
|---|---|
| Click | Start and capture the mouse |
| W A S D / arrows | Walk |
| Shift | Run |
| Mouse | Look |
| Esc | Release the mouse |
| F | FPS counter |
| H | Hide help |

Time-of-day presets, interactions, the cinematic tour, the menu and mobile controls come in later build steps (see `SPEC.md` §5).

## Tweaking the apartment

Every dimension, colour and position is in **`src/apartment.config.js`**:
- plan coordinates are in metres (x = east, y = south)
- walls carry their door and window openings
- `SITE` sets the location, the real compass orientation, and the default date and time

## Checking against the photos

```bash
npm run compare                        # all reference camera poses → compare/*.jpg + compare/overview.jpg
npm run compare -- --only 03,05        # a subset
node tools/shot.mjs out.png "eye=3,7,1.6&look=3,9,1.2&fov=60"   # ad-hoc render from any plan position
node tools/walktest.mjs                # headless walking/collision checks
```

`compare` renders the scene headlessly with Playwright from the pose stored for each photo (`COMPARE_CAMERAS` in the config). It then writes the photo and the render side by side.

These tools use Playwright 1.56.1. On a new machine, run `npx playwright install chromium` once.

## Project layout

```
src/apartment.config.js   all dimensions, colours, positions, compare camera poses
src/main.js               renderer, scene assembly, loop, compare/debug camera modes
src/world/                shell (walls, floors, roof), openings (windows, doors), terrace, materials
src/textures/             procedural PBR texture generators (oak, tiles, plaster, decking, …)
src/lighting/             solar position for Antwerp + daylight rig
src/player/               first-person controller and height-aware collision
tools/                    compare, ad-hoc shot and walk-test scripts (Playwright)
```

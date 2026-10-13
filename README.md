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
| 1 / 2 / 3 / 4 | Morning 08:30 · Afternoon 17:00 · Sunset 20:30 · Night 22:45 (2 s transition along Antwerp's real sun path) |
| L | All lights on/off (lamps also switch on by themselves after dusk) |
| Esc | Release the mouse |
| F | FPS counter |
| H | Hide help |

**Quality:** add `?q=low`, `?q=medium` (the default) or `?q=high` to the URL. The Esc menu with quality, sensitivity, field of view and a time slider comes in Step 6, along with interactions, the cinematic tour and mobile controls.

**Lighting:**
- A real solar position for the Frankrijklei, with the default date set to 20 August.
- An analytic sky with drifting cumulus clouds and stars, captured into a PMREM environment for exterior surfaces.
- A separate warm interior environment for indoor surfaces.
- Soft area lights in every window and the terrace door.
- Pooled lamp lights with fades.
- N8AO ambient occlusion, bloom, ACES filmic tone mapping, vignette and SMAA.
- Eye adaptation when you step outside, and light haze over the city.

All of it is tunable in `DAYLIGHT_KEYS`, `LIGHTING`, `LAMPS` and `QUALITY` in the config.

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
node tools/walktest.mjs                # headless checks: walking/collision, time-of-day keys, lights, quality presets
```

`compare` renders the scene headlessly with Playwright from the pose stored for each photo (`COMPARE_CAMERAS` in the config). It then writes the photo and the render side by side.

These tools use Playwright 1.56.1. On a new machine, run `npx playwright install chromium` once.

## Project layout

```
src/apartment.config.js   all dimensions, colours, positions, compare camera poses
src/main.js               renderer, scene assembly, loop, compare/debug camera modes
src/world/                shell (walls, floors, roof), openings (windows, doors), terrace, materials
src/textures/             procedural PBR texture generators (oak, tiles, plaster, decking, …)
src/lighting/             sun position, sky dome, environment maps, window lights, lamps, time-of-day controller
src/render/post.js        post-processing chain (N8AO, bloom, ACES, vignette, SMAA)
src/player/               first-person controller and height-aware collision
tools/                    compare, ad-hoc shot and walk-test scripts (Playwright)
```

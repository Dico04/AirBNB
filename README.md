# Frankrijklei rooftop: 3D walkthrough

A walkable, browser-based 3D model of a top-floor Airbnb apartment and its roof terrace on the Frankrijklei in Antwerp. It's built with Vite and Three.js from primitives and procedural canvas textures, so it needs no downloaded models or images and runs fully offline.

`SPEC.md` holds the floor plan, the per-room inventory and the decisions behind them. The reference photos are in `reference/`.

**Live:** https://dico04.github.io/AirBNB/ (every push to `main` rebuilds the site and publishes it to the `gh-pages` branch, see `.github/workflows/pages.yml`)

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (relative paths, host it from any folder)
npm run preview    # serve the built dist/ locally
```

## Controls

| Key | Action |
|---|---|
| Click | Start and capture the mouse |
| W A S D / arrows | Walk |
| Shift | Run |
| Mouse | Look |
| E | Use what's under the crosshair: lamps, wall switches, doors, the sliding terrace door, the TV |
| V | First / third person |
| C | Cinematic tour; press C or Esc to stop |
| P | Save a high-resolution PNG (2× the window, up to 4096 px wide) |
| 1 / 2 / 3 / 4 | Morning 08:30 · Afternoon 17:00 · Sunset 20:30 · Night 22:45 (2 s transition along Antwerp's real sun path) |
| L | All lights on/off (lamps also switch on by themselves after dusk) |
| Esc | Menu: time-of-day slider and presets, lights, quality, mouse sensitivity, field of view, view, tour, screenshot |
| F | FPS counter |
| H | Hide help |

**On a phone or tablet:**
- Walk with the left-thumb joystick and drag anywhere else to look.
- The buttons are E (use), Run, V (view) and ☰ (menu).

**Things you can switch with E:**
- **Lamps:** the table lamp on the sideboard, the desk lamp, the bedside lamp and the bamboo wall light.
- **Wall switches:**
  - by the front door: kitchen and bar downlights
  - in the bedroom: bed lights
  - in the corridor: ceiling light, spot and desk lamp
  - next to the bathroom door: bathroom light
  - outside by the sliding door: the string lights
- **Doors:** the front, bedroom and bathroom doors swing, and the terrace door slides. The doors block your way when they're closed.
- **TV:** shows a slow slideshow.

**Cinematic tour (C):** a one-minute camera glide from the entrance through the kitchen and living room, out of the sliding door onto the terrace, ending with a slow push toward Theater Elckerlyc. The sky turns to sunset on the way, with letterbox bars and captions. Its path is `TOUR` in the config.

**Quality:** Low / Medium / High in the Esc menu, or `?q=low|medium|high` in the URL. Changing quality reloads the page and puts you back where you were. Sensitivity, field of view and view mode are remembered in this browser.

**Lighting:**
- A real solar position for the Frankrijklei, with the default date set to 20 August.
- An analytic sky with drifting cumulus clouds and stars, captured into a PMREM environment for exterior surfaces.
- A separate warm interior environment for indoor surfaces.
- Soft area lights in every window and the terrace door.
- Pooled lamp lights with fades.
- N8AO ambient occlusion, bloom, ACES filmic tone mapping, vignette and SMAA.
- Eye adaptation when you step outside, and light haze over the city.

All of it is tunable in `DAYLIGHT_KEYS`, `LIGHTING`, `LAMPS` and `QUALITY` in the config.

**Furniture and props (Step 4):** the entrance, kitchen, living room, corridor desk nook, bedroom and bathroom are fully furnished, matching the listing photos. Everything is built from code:
- bevelled and rounded geometry
- a soft-cushion generator (domed, piped seams, pinched corners, slight creases) for the sofa, pillows and bedding
- lathe-turned ceramics
- instanced olive and strelitzia leaves
- procedural textures for wood grain, velvet, linen, cane webbing, macramé, cork, stoneware and brushed steel

**Terrace, skyline and church (Step 5):**
- **Roof terrace:** the weathered storage cabinet outside the living-room window, a teak L-lounge with canvas cushions, a round side table, the slatted dining table with a candle bowl, Acapulco and red folding chairs, a black ladder, a hardwood batten screen, a potted olive tree, fan palm and agave, a pebble strip, and festoon string lights that switch on at dusk.
- **The city around it:**
  - the Frankrijklei boulevard with tram bed and plane trees
  - the neo-Gothic former Onze-Lieve-Vrouw van Gratiekerk (now Theater Elckerlyc), placed so the sun sets right behind its spires
  - the neighbours seen in the photos
  - a procedural skyline about 900 m out
  - lit windows and a floodlit church at night
- **Through the windows:** the galvanised roof ladder and brick parapet outside the bedroom; the office block behind the desk.

See `compare/terrace-times.jpg` for the terrace at all four presets.

## Performance

| Preset | Render scale (max) | Shadow map | Ambient occlusion | Bloom, SMAA | Window area lights | Lamp light pool |
|---|---|---|---|---|---|---|
| Low | 1.0× | 1024 | N8AO Performance, half res | off | 2 | 3 point + 2 spot |
| Medium (default) | 1.5× | 2048 | N8AO Medium, half res | on | 3 | 5 point + 4 spot |
| High | 2.0× | 4096 | N8AO High, full res | on | 5 | 8 point + 6 spot |

**What keeps it at 60 fps:**
- **Automatic resolution.** The frame time is watched continuously. If frames take longer than about 19 ms for more than 0.6 s, the render scale drops by 15%. After 4 s of headroom it climbs back, but never above the preset's scale or the screen's pixel ratio, and it stays just under the level that last failed. The FPS counter (F) shows the current scale. Add `?autores=0` to the URL to turn it off.
- **Shadow map on demand.** The sun's shadow map is re-rendered only when something that casts into it moves: the sun (time changes), a door, or the third-person figure. Otherwise the last one is reused. That pass used to be more than half of all draw calls.
- **Merged static geometry.** Walls, furniture, door hardware, lamp fixtures and switch plates are merged per material at load.
- **Area lights where you are.** A small pool of window area lights is reassigned to the openings of the room you're in, nearest first.
- **Lamp pool off in daylight.** The lamps share a fixed pool of lights. In daylight, with every lamp off, the pool is hidden so shaders skip the lamp loop entirely. Both shader variants are compiled at load, so nothing stalls at dusk.

**Benchmark.** `node tools/perf.mjs` renders six fixed views per preset at 960×540 and reports draw calls, triangles, shader programs and frame time. The headless browser renders on the CPU (SwiftShader), so its milliseconds are only useful for comparing builds, not as real frame times. The draw calls and triangles are exactly what a GPU gets. Medium preset, before and after the step 7 pass:

| View | Draw calls | Triangles | Frame time (CPU renderer) |
|---|---|---|---|
| Living room | 410 → 167 | 690k → 356k | −28% |
| Kitchen | 431 → 175 | 573k → 243k | −29% |
| Bedroom | 484 → 190 | 673k → 363k | −30% |
| Terrace (toward the church) | 341 → 106 | 640k → 307k | −26% |
| Terrace lounge | 349 → 113 | 641k → 307k | −29% |
| Living room at night | 410 → 167 | 690k → 356k | −11% |

These are headless numbers; no real MacBook Air was available. On one, Medium should hold 60 fps at or near its full 1.5× scale, and the automatic resolution covers the rest. If a machine still struggles, use Low.

## Tweaking the apartment

Every dimension, colour and position is in **`src/apartment.config.js`**:
- plan coordinates are in metres (x = east, y = south)
- walls carry their door and window openings
- `SITE` sets the location, the real compass orientation, and the default date and time

## Checking against the photos

```bash
npm run compare                        # all reference camera poses → compare/*.jpg + compare/overview.jpg
npm run compare -- --only 03,05        # a subset
npm run compare -- --q high --height 720   # at the High preset, larger
node tools/shot.mjs out.png "eye=3,7,1.6&look=3,9,1.2&fov=60"   # ad-hoc render from any plan position
node tools/walktest.mjs                # headless checks: walking/collision, time-of-day keys, lights, quality presets
node tools/uitest.mjs                  # headless checks: E interactions, V, C, P, Esc menu, touch controls, auto resolution
node tools/perf.mjs                    # draw calls, triangles and frame time per preset and view
```

`compare` renders the scene headlessly with Playwright from the pose stored for each photo (`COMPARE_CAMERAS` in the config). It then writes the photo and the render side by side.

These tools use Playwright 1.56.1. On a new machine, run `npx playwright install chromium` once.

## Project layout

```
src/apartment.config.js   all dimensions, colours, positions, compare camera poses
src/main.js               renderer, scene assembly, loop, compare/debug camera modes
src/world/                shell (walls, floors, roof), openings (windows, doors), terrace, materials,
                          city (boulevard, skyline, neighbours) and the church
src/textures/             procedural PBR texture generators (oak, tiles, plaster, decking, wood grain, fabrics, cane, …)
                          and canvas city textures (façades with night windows, church brick, slate, road)
src/util/                 geometry helpers (world-space UVs, rounded boxes) and static mesh merging
src/lighting/             sun position, sky dome, environment maps, window lights, lamps, time-of-day controller
src/props/                furniture & props per room (kitchen, living, corridor, bedroom, bathroom, terrace), plants, shared kit
src/render/post.js        post-processing chain (N8AO, bloom, ACES, vignette, SMAA)
src/render/autoRes.js     automatic resolution scaling
src/player/               first-person controller, height-aware collision, third-person figure
src/interact/             E interactions (hotspots, doors, switches) and the TV slideshow
src/tour/                 cinematic tour
src/ui/                   HUD styles, Esc menu, touch controls, screenshot
tools/                    compare, ad-hoc shot, walk/UI test and benchmark scripts (Playwright)
```

// Single source of truth for the apartment: every dimension, colour and position lives here.
//
// Coordinate system (see SPEC.md §1):
//   Plan coordinates in metres. x → east (right), y → south (down), origin = NW inside corner of the bedroom.
//   "Plan north" is toward the corridor's end window; the real compass bearing is SITE.planNorthBearingDeg.
//   h = height above the finished interior floor (0). Terrace deck top sits at DIMS.deck.
//   In Three.js: plan x → x, plan y → z, h → y.  (Three's default camera looks along -z = plan north.)
//
// Rects are [x0, y0, x1, y1]. Heights are [h0, h1].

export const SITE = {
  name: 'Frankrijklei rooftop, Antwerp',
  lat: 51.2135,
  lon: 4.4105,
  timeZone: 'Europe/Brussels',
  utcOffsetHours: 2,            // CEST for the default summer date
  planNorthBearingDeg: 90,      // plan-north points to true east (terrace faces true west)
  floorAboveStreet: 26,         // apartment floor height above the Frankrijklei, metres
  defaultDate: [2026, 8, 20],   // sun sets behind the church spires (~291°)
  defaultTime: 17.0,            // decimal hours, local time
};

export const DIMS = {
  ceiling: 2.60,
  soffit: 2.35,          // kitchen soffit + corridor-mouth header underside
  extWall: 0.30,
  partition: 0.10,
  deck: 0.25,            // terrace deck top, relative to interior floor
  roofTop: 2.95,         // top of roof slab over the apartment
  roofUpstand: 3.25,     // top of the roof edge upstand / coping
  parapet: 1.10,         // terrace parapet height above the deck
  tallWall: 6.0,         // tall west wall height above the deck
  skirting: 0.07,
};

export const COLORS = {
  wall: '#efede8',
  ceiling: '#f4f3f0',
  render: '#e9e8e4',          // exterior render
  renderTallWall: '#e6e5e1',
  coping: '#9c9b96',
  roof: '#4a4b4c',
  oakBase: '#cdb293',
  oakLight: '#dcc3a4',
  oakDark: '#bfa27f',
  oakPlatformTop: '#d4ae84',
  oakPlatformRiser: '#c69872',
  tile: '#b5b2ae',
  tileGrout: '#9c9995',
  landingFloor: '#8f8b86',
  skirting: '#f2f1ee',
  pvc: '#f5f5f3',
  doorLeafOak: '#bfa285',
  doorFrameBlack: '#1c1c1c',
  frontDoor: '#ecebe7',
  satinSteel: '#b9bbbd',
  bluestone: '#7f7a74',
  blind: '#2b2f38',
  deck: '#a8a196',
  parapetBoards: '#e6e4df',
  chimney: '#dadad6',
  chimneyCap: '#4a4b48',
  buildingBody: '#d9d6cf',
};

// Rooms: used for floors, ceilings, skirting decisions and labels.
export const ROOMS = [
  { id: 'bedroom',  rect: [0.00, 0.00, 3.20, 2.90], floor: 'oak',   skirting: true },
  { id: 'corridor', rect: [3.30, 0.00, 4.70, 4.20], floor: 'oak',   skirting: true },
  { id: 'bathroom', rect: [4.80, 0.00, 7.10, 1.80], floor: 'tile',  skirting: false },
  { id: 'kitchen',  rect: [4.70, 1.90, 7.10, 4.20], floor: 'tile',  skirting: false, tileFromX: 5.30 },
  { id: 'living',   rect: [0.90, 4.20, 7.10, 9.05], floor: 'oak',   skirting: true },
  { id: 'landing',  rect: [0.90, 3.10, 3.20, 4.00], floor: 'landing', skirting: true, outside: true },
];

// Walls: axis-aligned solid boxes. `outside` = which face is exterior render ('n','s','e','w').
// Openings run along the wall's long axis: { id, from, to, bottom, top }.
export const WALLS = [
  { id: 'north-ext',     rect: [-0.30, -0.30, 7.40, 0.00], outside: 'n',
    openings: [{ id: 'W-desk', from: 3.72, to: 4.48, bottom: 0.85, top: 2.20 }] },
  { id: 'bed-west-ext',  rect: [-0.30, 0.00, 0.00, 3.10], outside: 'w',
    openings: [{ id: 'W-bed', from: 1.75, to: 2.60, bottom: 0.90, top: 2.25 }] },
  { id: 'bed-south',     rect: [0.00, 2.90, 3.20, 3.10] },
  { id: 'corr-west',     rect: [3.20, 0.00, 3.30, 4.00],
    openings: [{ id: 'D-bed', from: 1.00, to: 1.85, bottom: 0, top: 2.15 }] },
  { id: 'corr-east',     rect: [4.70, 0.00, 4.80, 1.90],
    openings: [{ id: 'D-bath', from: 0.30, to: 1.13, bottom: 0, top: 2.15 }] },
  { id: 'bath-kitchen',  rect: [4.80, 1.80, 7.10, 1.90] },
  { id: 'east-ext',      rect: [7.10, 0.00, 7.40, 9.05], outside: 'e',
    openings: [{ id: 'W-bath', from: 1.05, to: 1.75, bottom: 0.75, top: 1.85 }] },
  { id: 'entrance',      rect: [0.90, 4.00, 3.30, 4.20],
    openings: [{ id: 'D-front', from: 1.22, to: 2.18, bottom: 0, top: 2.17 }] },
  { id: 'living-west',   rect: [0.60, 3.10, 0.90, 9.05], outside: 'w' },
  { id: 'facade',        rect: [0.60, 9.05, 7.40, 9.35], outside: 's',
    openings: [
      { id: 'D-slide',  from: 1.80, to: 4.00, bottom: 0.40, top: 2.50 },
      { id: 'W-living', from: 4.32, to: 5.22, bottom: 0.86, top: 2.34 },
    ] },
  { id: 'pillar',        rect: [4.70, 3.80, 5.10, 4.20] },
  { id: 'chimney-breast', rect: [6.65, 8.60, 7.10, 9.05] },
];

// Lowered ceilings / headers / bulkheads: [rect, [h0, h1]].
export const SOFFITS = [
  { id: 'corridor-header', rect: [3.30, 4.00, 4.70, 4.20], h: [2.35, 2.60] },
  { id: 'kitchen-soffit',  rect: [4.40, 1.90, 7.10, 4.20], h: [2.35, 2.60] },
  { id: 'bed-bulkhead',    rect: [0.00, 0.00, 0.25, 2.90], h: [2.40, 2.60] },
];

// Windows: PVC tilt-turn. `wall` refers to WALLS id; opening comes from that wall's openings.
// frameInset = distance from the exterior face to the frame centre.
export const WINDOWS = [
  { id: 'W-desk',   wall: 'north-ext',    frameInset: 0.09, innerSill: 'white',     lowerPanel: 0.28, handle: 'right' },
  { id: 'W-bed',    wall: 'bed-west-ext', frameInset: 0.09, innerSill: 'bluestone', handle: 'left' },
  { id: 'W-bath',   wall: 'east-ext',     frameInset: 0.09, innerSill: 'white',     handle: 'left' },
  { id: 'W-living', wall: 'facade',       frameInset: 0.09, innerSill: 'white',     handle: 'right', blind: true },
];

// Doors. `swing`: which side of the wall the leaf opens into ('+x','-x','+y','-y').
// `hinge`: which end of the opening carries the hinges ('from' or 'to' along the wall axis).
// openDeg: initial opening angle (interaction comes in step 6).
export const DOORS = [
  { id: 'D-front', type: 'front',    wall: 'entrance',  hinge: 'from', swing: '+y', openDeg: 0,
    leaf: { w: 0.88, h: 2.11, t: 0.06 }, architrave: 0.07 },
  { id: 'D-bed',   type: 'interior', wall: 'corr-west', hinge: 'to',   swing: '-x', openDeg: 88,
    leaf: { w: 0.79, h: 2.12, t: 0.04 } },
  { id: 'D-bath',  type: 'interior', wall: 'corr-east', hinge: 'from', swing: '+x', openDeg: 88,
    leaf: { w: 0.77, h: 2.12, t: 0.04 } },
];

// Lift-and-slide terrace door in the façade opening D-slide. East leaf slides west.
export const SLIDING_DOOR = {
  wall: 'facade', opening: 'D-slide', frameInset: 0.10, frame: 0.07, stile: 0.09,
  slidingLeaf: 'east', openFraction: 0.92,
};

// Oak step platform in front of the sliding door (two tiers).
export const PLATFORM = {
  x: [0.90, 4.25],
  lower: { y: [8.25, 8.55], top: 0.20 },
  upper: { y: [8.55, 9.05], top: 0.40 },
  nosing: 0.015,
};

// Terrace (deck top = DIMS.deck). Inner faces: west 0.60, east 7.25, north 9.35 (façade), south 14.30.
export const TERRACE = {
  deck: { rect: [0.60, 9.35, 7.25, 14.30], boardWidth: 0.14, gap: 0.006, boardsAlong: 'x' },
  parapets: [
    { id: 'south', rect: [0.30, 14.30, 7.45, 14.55], innerFace: 'n' },
    { id: 'east',  rect: [7.25, 9.35, 7.45, 14.30],  innerFace: 'w' },
  ],
  parapetPostSpacing: 2.0,
  tallWall: { rect: [0.30, 9.35, 0.60, 14.55], vents: [10.30, 10.80, 11.30, 11.80], ventSize: 0.22, ventH: 5.55 },
  chimney: { center: [6.90, 9.20], size: 0.55, top: 3.95 },
  buildingBody: { rect: [-0.30, -0.30, 7.45, 14.55] },
};

// ---------------------------------------------------------------- furniture & props (step 4)
// Plan coords [x, y], heights h above the floor. `face` = plan bearing the front of an object
// points to (0 = plan north, 90 = east, 180 = south, 270 = west).
export const FURNITURE = {
  entrance: {
    hookRail: { x: [2.45, 2.75], h: 1.55, hooks: 6, color: '#1a1a1a' },
    intercom: { x: 2.30, h: 1.95 },
    thermostat: { x: 2.30, h: 1.22 },
    switch: { x: 2.25, h: 0.95 },
    stool: { pos: [2.95, 4.34], size: [0.45, 0.25, 0.45], color: '#a47a58' },
    cactus: { height: 0.86, color: '#3a4a2e', pot: { r: 0.11, h: 0.21, color: '#a88466' } },
    strawHanging: { wallX: 0.90, y: 5.40, h: 1.82, diameter: 0.86, color: '#c9a574' },
  },
  corridor: {
    desk: { x: [3.30, 4.70], y: [0.03, 0.55], top: 0.75, thick: 0.03, color: '#ddb483' },
    drawers: { x: [3.32, 3.68], color: '#1e1e1e' },
    trestleX: 4.56,
    cork: { y: [0.06, 0.52], h: [0.75, 1.00], color: '#9a7a5a' },
    chair: { pos: [4.02, 0.86], face: 0, frame: '#d6b48a', seat: '#cdb28a' },
    mirror: { x: 3.56, h: 1.58, d: 0.50, color: '#c8a57e' },
    vase: { pos: [3.44, 0.24], color: '#76685d' },
    lamp: { pos: [3.66, 0.30], base: '#c9a27a', shade: '#f1ece3' },
    print: { pos: [4.38, 0.10], size: [0.50, 0.55] },
    jug: { pos: [4.50, 0.30], color: '#5f6869' },
  },
  kitchen: {
    counterTop: 0.92, counterThick: 0.04, plinth: 0.10,
    walnut: '#7a4a32', cabinet: '#f2f2f0',
    bar: { top: [4.40, 1.90, 5.30, 3.80], base: [4.70, 1.90, 5.30, 3.80] },
    north: [5.30, 1.90, 6.50, 2.50],
    east: [6.50, 1.90, 7.10, 3.60],
    fridge: [6.50, 3.60, 7.10, 4.20],
    hob: { center: [5.70, 2.20], size: [0.58, 0.51] },
    oven: { x: [5.40, 6.00] },
    hood: { x: 5.70, bottom: 1.55, visor: [0.60, 0.50] },
    sink: { center: [6.80, 2.32], r: 0.20 },
    microwaveUnit: { x: [6.75, 7.10], y: [2.65, 3.25], h: [1.40, 2.35] },
    print: { y: 2.20, h: 1.62, size: [0.30, 0.40] },
    stools: [[4.18, 2.80], [4.18, 3.30]], stoolColor: '#5e2f1e',
    props: {
      breadBin: [4.82, 2.16], wickerBottle: [4.56, 2.04], fruitBowl: [6.20, 2.22], oil: [[6.00, 2.05], [6.07, 2.13]],
      boards: [7.02, 1.98], pot: [6.96, 2.62], coffee: [6.84, 3.13], jar: [6.86, 3.42],
    },
  },
  living: {
    sofa: { x: [2.00, 4.95], backY: 5.90, depth: 1.00, seatH: 0.44, backH: 0.80, armW: 0.24, armH: 0.62,
            chaiseX: [2.00, 2.95], chaiseEndY: 8.15, color: '#a39189', piping: '#8a7a72' },
    macrame: { color: '#ede7dd' },
    coffeeTable: { center: [4.25, 7.40], rotDeg: 8, size: [1.27, 0.92], top: 0.40, wood: '#b8743f' },
    sideboard: { x: [5.62, 6.65], y: [8.63, 9.05], h: 0.62, legs: 0.17, oak: '#c49464', cane: '#ddbb8e' },
    tv: { x: 6.20, size: [0.74, 0.44] },
    lamp: { pos: [5.80, 8.84], base: '#a87f70', shade: '#f1eeea' },
    portrait: { x: 5.44, h: 1.62, size: [0.25, 0.34], frame: '#4a3226' },
    oliveTree: { spot: 'kitchen', spots: { kitchen: [6.30, 4.78], eastWall: [6.80, 7.70] }, pot: '#1e2433', stool: '#9b6f4e' },
    basket: { pos: [1.68, 8.02], color: '#a47e5b' },
  },
  bedroom: {
    bed: { x: [0.90, 2.30], y: [0.90, 2.90], mattressTop: 0.55, headboard: '#2a2a2e', sheet: '#f4f2ee' },
    throwColor: '#e2cfb9', pillow: '#cfa18a',
    nightstand: { pos: [0.57, 2.69], size: [0.42, 0.38, 0.50], frame: '#b88a60', cane: '#d9b98c' },
    lampBase: '#5f6253',
    sconce: { x: 2.05, h: 1.85, color: '#c7a27c' },
    switch: { x: 0.80, h: 1.15 },
    radiator: { y: [1.83, 2.53], h: [0.15, 0.75] },
  },
  bathroom: {
    bath: { outer: [5.50, 1.00, 7.10, 1.80], inner: [5.62, 1.06, 6.98, 1.56], deck: 0.58 },
    mixer: { y: 1.30, h: 0.80 },
    towelRadiator: { x: [6.18, 6.68], h: [1.05, 2.25] },
    plant: { pos: [6.44, 1.69] },
    vanity: { x: [4.85, 5.45], y: [1.32, 1.80], h: 0.85, oak: '#d8bfa0', top: '#2e2f31' },
    mirror: { x: 5.15, h: 1.55, d: 0.50 },
    bucket: { pos: [5.36, 1.56] },
    wc: { x: [6.10, 6.70], ledgeH: 1.10, ledgeDepth: 0.20 },
  },
  // Roof terrace (heights above the deck). Layout from photos 02, 03 (window view) and 07.
  terrace: {
    weathered: { base: '#aea597', dark: '#7f776c', light: '#cbc3b6' },     // silver-grey teak/pine
    cabinet: { x: [4.60, 5.20], y: [9.42, 10.62], h: 2.05, color: '#b9aea2' },   // doors face west
    lounge: {
      corner: [6.20, 13.35],          // outer back corner (backs face east & south)
      module: 0.75, longArm: 3, shortArm: 2, seatH: 0.40, backH: 0.75,
      teak: '#9a6a43', cushion: '#ede7dc',
    },
    sideTable: { pos: [4.85, 11.75], d: 0.55, h: 0.45, top: '#9a6a43' },
    table: { x: [1.95, 2.85], y: [11.70, 13.30], h: 0.75, frame: '#3a3d40' },
    acapulco: { pos: [4.15, 12.25], face: 215, color: '#f0f0ee' },
    folding: { color: '#8e4636', chairs: [{ pos: [2.40, 11.40], face: 175 }, { pos: [2.35, 13.72], face: 5 }] },
    candleBowl: { pos: [2.45, 12.55], wood: '#b08a5e', wax: '#d9a46a' },
    jarCandle: { pos: [2.27, 12.40], glass: '#c98a4a' },
    ladder: { y: 13.75, w: 0.40, len: 1.80, leanDeg: 10, rungs: 5 },
    battens: { y: [11.60, 12.80], h: 2.20, color: '#8c6a4f' },          // on the tall west wall
    olive: { pos: [6.80, 13.92], height: 2.1, pot: '#2b2d2f' },
    palm: { pos: [5.85, 13.98], height: 1.1, pot: '#2b2d2f' },
    agave: { pos: [1.12, 14.05], pot: '#c9c4bb' },
    pebbles: { x: [0.62, 7.22], y: [14.12, 14.30], color: '#e9e6df' },
    // Festoon: anchor points [x, y, h above the deck]; cable sags between anchors, bulbs every `spacing`.
    festoon: {
      spacing: 0.5, sagPerM: 0.05,
      anchors: [[7.20, 9.90, 1.02], [7.20, 11.95, 1.02], [7.20, 14.25, 1.02], [5.15, 14.25, 1.02], [3.05, 14.25, 1.02],
                [0.70, 14.25, 1.05], [0.68, 13.75, 2.05], [0.68, 11.80, 2.10], [0.68, 9.80, 2.10]],
    },
  },
};

// ---------------------------------------------------------------- city around the flat (step 5)
// Plan metres (x = plan east = true SOUTH, y = plan south = true WEST). Heights `top` are metres above
// the STREET (the flat's floor is SITE.floorAboveStreet above it).
export const CITY = {
  seed: 7,
  radius: 900,                      // procedural skyline extent
  cell: 34,                         // jittered grid cell for generic blocks
  street: { y: [14.55, 70.0] },     // Frankrijklei: sidewalks, parking, lanes, planted tram reservation
  trees: { x: [-350, 350], spacing: 10, rows: [21.5, 37.8, 46.8, 63.0] },
  frontage: { depth: 12, width: [10, 26], top: [21, 31], tall: 0.12 },   // continuous street walls along the boulevard
  church: { facade: [-21.0, 76.0], turnDeg: 10 },   // façade centre; faces the boulevard, turned 10° (02: oblique view)
  blocks: [
    // close neighbours
    { id: 'west-tall',   rect: [-16, 9.35, 0.30, 14.55], top: 32.25, style: 'render-grey' },   // behind the tall terrace wall
    { id: 'west-back',   rect: [-16, -12, -1.75, 9.35], top: 16, style: 'brick' },
    { id: 'west-walk',   rect: [-1.75, -0.3, -0.30, 9.35], top: 25.65, style: 'brick' },     // roof strip outside the bedroom window
    { id: 'east',        rect: [7.45, -12, 24, 14.55],  top: 22.7, style: 'render-white' },
    { id: 'back',        rect: [-0.30, -12, 7.45, -0.30], top: 20, style: 'render-white' },
    { id: 'courtyard',   rect: [-16, -30, 24, -12],     top: 12, style: 'brick-dark' },
    // landmarks from the photos
    { id: 'desk-view',   rect: [-8, -50, 30, -34],      top: 33, style: 'office-grid' },     // 05: through the desk window
    { id: 'fins-office', rect: [-8, 72, 46, 88],        top: 22, style: 'office-fins', poster: true },   // 02 & 07
    { id: 'fins-upper',  rect: [2, 90, 50, 108],        top: 31, style: 'office-grid' },    // 07: taller block behind it
    { id: 'cream',       rect: [-52, 72, -34, 90],      top: 19, style: 'render-cream' },   // 02: right of the church
    { id: 'red-brick',   rect: [55, 74, 80, 94],        top: 30, style: 'brick' },          // 07: behind the olive tree
    { id: 'resi-tower',  rect: [-310, -70, -284, -44],  top: 50, style: 'render-white' },   // 01: ~15 storeys
  ],
  dome: { center: [440, 100], base: [44, 44], top: 30, r: 10 },          // 07: distant dark dome + lantern
  crane: { pos: [-170, -25], mast: 72, jib: 48, deg: 35, color: '#d9a35a' },  // 01: tower crane to the true north
  bedroomParapet: { x: [-1.75, -1.45], y: [-0.3, 9.35], top: 0.75 },     // brick parapet + coping (h above our floor)
  roofLadder: { x: -0.44, y: [1.93, 2.42], h: [-0.35, 3.55] },          // galvanised ladder outside the bedroom window
};

// ---------------------------------------------------------------- lighting & time of day
// Keys 1–4 jump (with a ~2 s animation) to these local times on SITE.defaultDate.
export const TIME_PRESETS = [
  { key: 'Digit1', name: 'Morning',   hours: 8.5 },
  { key: 'Digit2', name: 'Afternoon', hours: 17.0 },
  { key: 'Digit3', name: 'Sunset',    hours: 20.5 },
  { key: 'Digit4', name: 'Night',     hours: 22.75 },
];

// Everything daylight-related is interpolated from these keyframes by SUN ALTITUDE (degrees),
// so any date/time looks right, not just the presets.
//   sun / sunI     directional sun colour & intensity       zenith / horizon / ground   sky dome colours
//   cloudLit / cloudShade  cloud colours                     envExt   sky-IBL strength on exterior materials
//   envIn          interior IBL strength (warm room proxy)   win / winI  skylight through windows (area lights)
//   exposure       tone-mapping exposure                     night    0..1 → lamps auto-on, stars, lit city windows
export const DAYLIGHT_KEYS = [
  { alt: -20, sun: '#8ea3c9', sunI: 0.10, zenith: '#03060f', horizon: '#141a2a', ground: '#0d1018', cloudLit: '#1b2233', cloudShade: '#0c1019', envExt: 0.35, envIn: 0.16, win: '#7d8bb0', winI: 0.10, exposure: 1.00, night: 1.0 },
  { alt: -9,  sun: '#9fb2d6', sunI: 0.12, zenith: '#0a1530', horizon: '#26324f', ground: '#141826', cloudLit: '#2b3550', cloudShade: '#141a2a', envExt: 0.40, envIn: 0.19, win: '#8796bd', winI: 0.25, exposure: 1.02, night: 1.0 },
  { alt: -3,  sun: '#ff9a60', sunI: 0.20, zenith: '#24406f', horizon: '#d88d6a', ground: '#3a3236', cloudLit: '#d58a6e', cloudShade: '#4a4256', envExt: 0.55, envIn: 0.22, win: '#c0a6b8', winI: 0.80, exposure: 1.06, night: 0.85 },
  { alt: 1,   sun: '#ff8c40', sunI: 1.40, zenith: '#4b6aa2', horizon: '#ffb07a', ground: '#7a675c', cloudLit: '#ffc08a', cloudShade: '#8a7480', envExt: 0.75, envIn: 0.36, win: '#ffd0a6', winI: 2.10, exposure: 1.19, night: 0.30 },
  { alt: 6,   sun: '#ffaf66', sunI: 2.60, zenith: '#6688c0', horizon: '#ffd4ac', ground: '#9a8a7c', cloudLit: '#ffe2c2', cloudShade: '#a49aa0', envExt: 0.90, envIn: 0.52, win: '#ffe8d2', winI: 2.60, exposure: 1.27, night: 0.0 },
  { alt: 15,  sun: '#ffd6a2', sunI: 3.30, zenith: '#6b93d0', horizon: '#e9ebec', ground: '#a69c90', cloudLit: '#fff6ec', cloudShade: '#aeb2bc', envExt: 1.00, envIn: 0.62, win: '#fff4e8', winI: 2.80, exposure: 1.33, night: 0.0 },
  { alt: 35,  sun: '#fff0d8', sunI: 3.70, zenith: '#5a8ad3', horizon: '#e2e9f1', ground: '#aaa49c', cloudLit: '#ffffff', cloudShade: '#b6bcc8', envExt: 1.00, envIn: 0.66, win: '#fbf8f4', winI: 3.10, exposure: 1.32, night: 0.0 },
  { alt: 65,  sun: '#fff6ea', sunI: 3.90, zenith: '#5688d4', horizon: '#e1e8f1', ground: '#aca69e', cloudLit: '#ffffff', cloudShade: '#bac0cc', envExt: 1.00, envIn: 0.68, win: '#fbfaf8', winI: 3.20, exposure: 1.29, night: 0.0 },
];

export const LIGHTING = {
  transitionSeconds: 2.0,
  moon: { bearing: 150, altitude: 34, color: '#a9bde0' },   // fixed, soft moonlight at night
  clouds: { cover: 0.50, speed: 0.0035 },                   // scattered cumulus like the listing photos
  outdoorExposure: 0.48,                                    // eye adaptation: exposure multiplier on the terrace in daylight
  adaptSeconds: 1.2,
  fogDensity: 0.0008,                                      // light haze on the distant city
  lampFadeSeconds: 0.6,
};

// Interior and terrace lamps (light sources). Fixture geometry for furniture lamps arrives with
// the furniture; the light positions live here. pos = plan [x, y, h]. intensity in candela.
// type 'point' | 'spot' (spots aim straight down). auto: switches on by itself after dusk.
export const LAMPS = [
  { id: 'living-lamp',   room: 'living',   type: 'point', pos: [5.80, 8.62, 1.02], kelvin: 3000, intensity: 10, auto: true },
  { id: 'desk-lamp',     room: 'corridor', type: 'point', pos: [3.66, 0.34, 0.98], kelvin: 3000, intensity: 7, auto: true },
  { id: 'bedside-lamp',  room: 'bedroom',  type: 'point', pos: [0.62, 2.62, 0.80], kelvin: 3000, intensity: 7, auto: true },
  { id: 'bed-sconce',    room: 'bedroom',  type: 'point', pos: [2.05, 2.62, 1.80], kelvin: 3000, intensity: 7, auto: true },
  { id: 'corridor-ceil', room: 'corridor', type: 'point', pos: [4.00, 0.80, 2.50], kelvin: 3000, intensity: 30, auto: true, fixture: 'flush' },
  { id: 'corridor-spot', room: 'corridor', type: 'spot',  pos: [4.62, 0.95, 2.28], kelvin: 3000, intensity: 40, auto: false, fixture: 'twinspot', aim: [3.90, 0.40, 0.75] },
  { id: 'bar-down-1',    room: 'kitchen',  type: 'spot',  pos: [4.85, 2.45, 2.34], kelvin: 3000, intensity: 45, auto: true, fixture: 'downlight' },
  { id: 'bar-down-2',    room: 'kitchen',  type: 'spot',  pos: [4.85, 3.35, 2.34], kelvin: 3000, intensity: 45, auto: true, fixture: 'downlight' },
  { id: 'kitchen-down-1', room: 'kitchen', type: 'spot',  pos: [5.95, 2.55, 2.34], kelvin: 3000, intensity: 45, auto: true, fixture: 'downlight' },
  { id: 'kitchen-down-2', room: 'kitchen', type: 'spot',  pos: [6.15, 3.55, 2.34], kelvin: 3000, intensity: 45, auto: true, fixture: 'downlight' },
  { id: 'bath-ceil',     room: 'bathroom', type: 'point', pos: [5.95, 0.90, 2.52], kelvin: 3500, intensity: 30, auto: true, fixture: 'flush' },
  // Festoon string lights on the terrace: each source stands in for ~8 warm bulbs.
  { id: 'festoon-s1', room: 'terrace', type: 'point', pos: [1.70, 13.45, 1.25], kelvin: 2600, intensity: 1.6, auto: true, group: 'festoon' },
  { id: 'festoon-s2', room: 'terrace', type: 'point', pos: [3.90, 13.45, 1.25], kelvin: 2600, intensity: 1.6, auto: true, group: 'festoon' },
  { id: 'festoon-s3', room: 'terrace', type: 'point', pos: [5.40, 13.45, 1.25], kelvin: 2600, intensity: 1.6, auto: true, group: 'festoon' },
  { id: 'festoon-e1', room: 'terrace', type: 'point', pos: [6.40, 10.40, 1.25], kelvin: 2600, intensity: 1.6, auto: true, group: 'festoon' },
  { id: 'festoon-e2', room: 'terrace', type: 'point', pos: [2.10, 11.40, 1.95], kelvin: 2600, intensity: 1.1, auto: true, group: 'festoon' },
];

// Render quality presets (?q=low|medium|high; menu in step 6).
export const QUALITY = {
  low:    { pixelRatio: 1.0, shadowMap: 1024, ao: 'Performance', aoHalfRes: true,  bloom: false, smaa: false, windowLights: 2, pointSlots: 3, spotSlots: 2 },
  medium: { pixelRatio: 1.5, shadowMap: 2048, ao: 'Medium',      aoHalfRes: true,  bloom: true,  smaa: true,  windowLights: 5, pointSlots: 5, spotSlots: 4 },
  high:   { pixelRatio: 2.0, shadowMap: 4096, ao: 'High',        aoHalfRes: false, bloom: true,  smaa: true,  windowLights: 5, pointSlots: 8, spotSlots: 6 },
};

export const PLAYER = {
  eyeHeight: 1.65,
  radius: 0.22,
  walkSpeed: 1.5,
  runSpeed: 3.2,
  stepUp: 0.26,
  mouseSensitivity: 0.0022,
  fov: 70,
  spawn: { x: 2.40, y: 4.75, yawDeg: -165, pitchDeg: -6 }, // just inside the front door, looking toward the terrace
};

// Camera poses that reproduce each reference photo (for tools/compare.mjs).
// eye in plan coords [x, y, h]; either `target` [x, y, h] or `yaw`/`pitch` in degrees
// (yaw = plan bearing clockwise from plan-north, pitch positive = up). fov = vertical FOV.
// overrides: per-photo staging (e.g. the olive tree stood by the east wall in photo 03).
// time = local hour to render at (default SITE.defaultTime); the terrace photos were shot
// around midday. crop = fraction of the reference image [x0, y0, x1, y1]. Poses marked `solved` were fitted
// to measured photo points; the others are hand-placed and get refined as furniture arrives.
export const COMPARE_CAMERAS = [
  { id: '01L', ref: '01.jpg', crop: [0, 0, 0.515, 1], eye: [2.45, 0.35, 1.45], target: [0.75, 2.90, 0.95], fov: 60 },
  { id: '01R', ref: '01.jpg', crop: [0.515, 0, 1, 1], eye: [0.62, 2.22, 1.32], target: [-3.0, 2.12, 0.85], fov: 58, outdoor: true },
  { id: '02L', ref: '02.jpg', crop: [0, 0, 0.467, 1], eye: [2.60, 14.00, 1.85], target: [-19.0, 78.0, 2.0], fov: 40, time: 13.5 },
  { id: '02R', ref: '02.jpg', crop: [0.467, 0, 1, 1], eye: [3.90, 11.10, 1.75], target: [0.60, 14.10, 1.10], fov: 58, time: 13.5 },
  { id: '03',  ref: '03.jpg', crop: [0, 0, 1, 1], eye: [4.02, 5.05, 1.45], yaw: 161.6, pitch: -11, fov: 50, solved: true, overrides: { oliveSpot: 'eastWall' } },
  { id: '04',  ref: '04.jpg', crop: [0, 0, 1, 1], eye: [3.70, 2.85, 1.70], target: [7.10, 2.80, 1.00], fov: 50 },
  { id: '05',  ref: '05.jpg', crop: [0, 0, 1, 1], eye: [3.77, 8.55, 1.29], yaw: -1.6, pitch: -4.9, fov: 36, solved: true },
  { id: '06',  ref: '06.jpg', crop: [0, 0, 1, 1], eye: [5.41, 7.39, 1.58], yaw: 345.8, pitch: -3.2, fov: 40.7, solved: true },
  { id: '07',  ref: '07.jpg', crop: [0, 0, 1, 1], eye: [1.60, 10.90, 1.42], yaw: 122, pitch: -4, fov: 58, time: 13.5 },
  { id: '08L', ref: '08.jpg', crop: [0, 0, 0.5, 1], eye: [5.15, 0.45, 1.45], target: [6.90, 1.60, 0.80], fov: 58 },
  { id: '08R', ref: '08.jpg', crop: [0.5, 0, 1, 1], eye: [6.40, 1.05, 1.30], target: [6.40, 0.05, 1.15], fov: 42 },
  { id: '09L', ref: '09.jpg', crop: [0, 0, 0.5, 1], eye: [3.75, 2.30, 1.35], target: [3.56, 0.00, 1.10], fov: 44 },
  { id: '09R', ref: '09.jpg', crop: [0.5, 0, 1, 1], eye: [4.35, 1.75, 1.20], target: [4.40, 0.10, 0.95], fov: 30 },
];

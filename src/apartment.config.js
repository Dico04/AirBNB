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
      { id: 'W-living', from: 4.40, to: 5.35, bottom: 0.90, top: 2.30 },
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
// crop = fraction of the reference image [x0, y0, x1, y1]. Poses marked `solved` were fitted
// to measured photo points; the others are hand-placed and get refined as furniture arrives.
export const COMPARE_CAMERAS = [
  { id: '01L', ref: '01.jpg', crop: [0, 0, 0.515, 1], eye: [2.45, 0.35, 1.45], target: [0.75, 2.90, 0.95], fov: 60 },
  { id: '02R', ref: '02.jpg', crop: [0.467, 0, 1, 1], eye: [5.40, 12.30, 1.55], target: [0.60, 12.90, 1.05], fov: 58 },
  { id: '03',  ref: '03.jpg', crop: [0, 0, 1, 1], eye: [3.76, 5.98, 1.68], yaw: 151.9, pitch: -14.3, fov: 53.2, solved: true },
  { id: '04',  ref: '04.jpg', crop: [0, 0, 1, 1], eye: [3.70, 2.85, 1.70], target: [7.10, 2.80, 1.00], fov: 50 },
  { id: '05',  ref: '05.jpg', crop: [0, 0, 1, 1], eye: [3.77, 8.55, 1.29], yaw: -1.6, pitch: -4.9, fov: 36, solved: true },
  { id: '06',  ref: '06.jpg', crop: [0, 0, 1, 1], eye: [5.41, 7.39, 1.58], yaw: 345.8, pitch: -3.2, fov: 40.7, solved: true },
  { id: '07',  ref: '07.jpg', crop: [0, 0, 1, 1], eye: [2.40, 11.00, 1.55], target: [7.25, 12.40, 0.95], fov: 55 },
  { id: '08L', ref: '08.jpg', crop: [0, 0, 0.5, 1], eye: [5.15, 0.45, 1.45], target: [6.90, 1.60, 0.80], fov: 58 },
  { id: '08R', ref: '08.jpg', crop: [0.5, 0, 1, 1], eye: [6.40, 1.05, 1.30], target: [6.40, 0.05, 1.15], fov: 42 },
  { id: '09L', ref: '09.jpg', crop: [0, 0, 0.5, 1], eye: [3.95, 1.05, 1.25], target: [3.60, 0.00, 0.90], fov: 46 },
  { id: '09R', ref: '09.jpg', crop: [0.5, 0, 1, 1], eye: [4.15, 0.75, 1.05], target: [4.45, 0.05, 0.90], fov: 44 },
];

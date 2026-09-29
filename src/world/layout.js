// Floor plan (metres). +x = right as you enter, -z = deeper into the store, +z = towards the street.
//   front glass wall at z = 0, back wall at z = -17.  Sales-floor ceiling at y = 3.05.
export const L = {
  x0: -6.4, x1: 6.4, zF: 0, zB: -17, H: 3.05,
  wall: 0.22,
  door: { x0: -1.3, x1: 1.3 },
  glassTop: 2.72,

  // street
  sidewalk: { z0: 0, z1: 5.5 },
  curb: { z0: 5.5, z1: 5.75 },
  road: { z0: 5.75, z1: 13.75, y: -0.14 },
  farWalk: { z0: 13.75, z1: 17.5 },
  play: { x0: -12.5, x1: 12.5, z0: 0.35, z1: 5.15 },

  // sales floor fixtures
  counter: { x0: 3.6, x1: 4.35, z0: -7.7, z1: -1.6 },
  staffZone: { x0: 4.35, x1: 6.4, z0: -7.7, z1: -1.6 },
  gond: [
    { id: 'G1', x0: -3.95, x1: -3.05, z0: -13.4, z1: -6.2 },
    { id: 'G2', x0: -1.45, x1: -0.55, z0: -13.4, z1: -6.2 },
    { id: 'G3', x0: 1.05, x1: 1.95, z0: -13.4, z1: -6.2 },
    { id: 'G4', x0: 3.7, x1: 4.6, z0: -13.4, z1: -9.6 },
  ],
  chillerL: { x0: -6.4, x1: -5.4, z0: -14.6, z1: -6.6 },
  wallR: { x0: 5.9, x1: 6.4, z0: -15.6, z1: -8.2 },
  coolers: { x0: -6.4, x1: 5.0, z0: -17, z1: -16.05, doors: 12, doorW: 0.95 },
  staffDoor: { x0: 5.2, x1: 6.3, z: -17 },
  hotWater: { x0: -6.4, x1: -5.7, z0: -6.3, z1: -4.4 },
  atm: { x0: -6.4, x1: -5.75, z0: -3.7, z1: -1.6 },
  windowBar: { x0: -5.9, x1: -2.0, z0: -0.78, z1: -0.32 },
  bakery: { x0: -4.7, x1: -3.1, z0: -3.4, z1: -2.2 },
  promo: { x0: -1.5, x1: 1.3, z0: -4.4, z1: -3.2 },
  baskets: { x0: 1.5, x1: 2.2, z0: -1.4, z1: -0.8 },
};

// Named zones (for the "Entering …" RPG toast and ambience). First match wins.
export const ZONES = [
  { id: 'outside', key: 'zone.outside', sub: 'zone.outsideSub', x0: -30, x1: 30, z0: 0.2, z1: 40 },
  { id: 'counter', key: 'zone.counter', x0: 2.2, x1: 6.4, z0: -8.0, z1: -1.4 },
  { id: 'atm', key: 'zone.atm', x0: -6.4, x1: -4.3, z0: -3.9, z1: -1.4 },
  { id: 'seating', key: 'zone.seating', x0: -6.0, x1: -1.8, z0: -1.4, z1: 0 },
  { id: 'bakery', key: 'zone.bakery', x0: -5.2, x1: -2.4, z0: -4.0, z1: -1.4 },
  { id: 'hotwater', key: 'zone.hotwater', x0: -6.4, x1: -4.4, z0: -6.8, z1: -3.9 },
  { id: 'meals', key: 'zone.meals', x0: -6.4, x1: -4.4, z0: -15, z1: -6.8 },
  { id: 'noodles', key: 'zone.noodles', x0: -4.4, x1: -2.4, z0: -13.6, z1: -5.0 },
  { id: 'grocery', key: 'zone.grocery', x0: -2.4, x1: -0.2, z0: -13.6, z1: -5.0 },
  { id: 'snacks', key: 'zone.snacks', x0: -0.2, x1: 1.0, z0: -13.6, z1: -5.0 },
  { id: 'sweets', key: 'zone.sweets', x0: 1.0, x1: 3.0, z0: -13.6, z1: -8.0 },
  { id: 'household', key: 'zone.household', x0: 3.0, x1: 5.0, z0: -14.6, z1: -8.2 },
  { id: 'health', key: 'zone.health', x0: 5.0, x1: 6.4, z0: -15.8, z1: -8.2 },
  { id: 'beer', key: 'zone.beer', x0: -1.5, x1: 3.0, z0: -17, z1: -13.6 },
  { id: 'icecream', key: 'zone.icecream', x0: 3.0, x1: 5.2, z0: -17, z1: -14.6 },
  { id: 'drinks', key: 'zone.drinks', x0: -6.4, x1: -1.5, z0: -17, z1: -13.6 },
  { id: 'entrance', key: 'zone.entrance', x0: -6.4, x1: 6.4, z0: -17, z1: 0.2 },
];

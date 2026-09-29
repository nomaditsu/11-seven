// Packaging shapes. All sizes are centimetres. `kind` decides the geometry builder and texture atlas layout.
//   wrap: revolved (bottle / can / cup / tube / jar)   dims = [diameter, height]
//   bag : pillow bag                                   dims = [width, height, depth]
//   box : rectangular carton / tray / card             dims = [width, height, depth]
//   gable: milk carton with pitched roof               dims = [width, height, depth]
export const PROFILES = {
  can:        { pts: [[0, 0], [.82, 0], [.9, .012], [.97, .03], [1, .06], [1, .925], [.97, .95], [.9, .972], [.86, .988], [.86, 1]], label: [.06, .93], topR: .86, seg: 22 },
  petSoda:    { pts: [[0, 0], [.62, 0], [.9, .012], [1, .05], [1, .60], [.96, .65], [.84, .70], [.62, .75], [.42, .78], [.34, .80], [.32, .83], [.32, .86], [.40, .875], [.40, .89], [.36, .90], [.36, .985], [.33, 1]], label: [.09, .58], topR: .33, capFrom: .89, seg: 22 },
  petWater:   { pts: [[0, 0], [.66, 0], [.92, .012], [1, .05], [1, .62], [.94, .68], [.78, .73], [.55, .77], [.4, .795], [.36, .82], [.36, .86], [.44, .875], [.44, .89], [.40, .90], [.40, .985], [.37, 1]], label: [.10, .60], topR: .37, capFrom: .89, seg: 22 },
  petSlim:    { pts: [[0, 0], [.6, 0], [.88, .012], [1, .05], [1, .64], [.9, .70], [.62, .75], [.42, .78], [.34, .80], [.32, .84], [.32, .87], [.4, .88], [.4, .89], [.36, .9], [.36, .985], [.33, 1]], label: [.08, .6], topR: .33, capFrom: .89, seg: 22 },
  beerBottle: { pts: [[0, 0], [.8, 0], [.97, .012], [1, .04], [1, .50], [.96, .58], [.72, .66], [.46, .72], [.36, .76], [.33, .80], [.33, .90], [.38, .915], [.38, .93], [.44, .945], [.44, .985], [.40, 1]], label: [.14, .50], topR: .40, capFrom: .94, seg: 22 },
  energyGlass:{ pts: [[0, 0], [.85, 0], [1, .03], [1, .56], [.94, .62], [.66, .72], [.5, .76], [.46, .8], [.46, .84], [.52, .85], [.52, .995], [.48, 1]], label: [.10, .56], topR: .48, capFrom: .85, seg: 20 },
  cupNoodle:  { pts: [[0, 0], [.6, 0], [.64, .02], [.98, .90], [1.06, .915], [1.06, .985], [1.0, 1]], label: [.05, .9], topR: 1.0, seg: 24 },
  tubPot:     { pts: [[0, 0], [.7, 0], [.74, .02], [.98, .92], [1.04, .93], [1.04, 1]], label: [.05, .92], topR: 1.04, seg: 22 },
  tubeChips:  { pts: [[0, 0], [.96, 0], [1, .02], [1, .93], [1.03, .945], [1.03, 1]], label: [.03, .93], topR: 1.03, capFrom: .93, seg: 22 },
  jar:        { pts: [[0, 0], [.9, 0], [1, .04], [1, .82], [.94, .84], [.94, 1]], label: [.12, .8], topR: .94, capFrom: .83, seg: 20 },
  aerosol:    { pts: [[0, 0], [.85, 0], [1, .03], [1, .74], [.9, .8], [.62, .84], [.62, .9], [.56, .91], [.56, 1]], label: [.05, .74], topR: .56, capFrom: .84, seg: 20 },
  flipBottle: { pts: [[0, 0], [.8, 0], [.98, .02], [1, .06], [1, .82], [.92, .86], [.5, .88], [.5, .93], [.6, .94], [.6, 1]], label: [.08, .82], topR: .6, capFrom: .88, seg: 20 },
  shampoo:    { pts: [[0, 0], [.8, 0], [1, .03], [1, .74], [.94, .82], [.6, .86], [.4, .88], [.4, .92], [.5, .93], [.5, 1]], label: [.06, .78], topR: .5, capFrom: .88, seg: 20 },
  bigPet:     { pts: [[0, 0], [.7, 0], [.94, .012], [1, .04], [1, .64], [.95, .70], [.76, .76], [.5, .80], [.36, .82], [.34, .86], [.34, .89], [.42, .90], [.42, .91], [.38, .92], [.38, .99], [.35, 1]], label: [.08, .62], topR: .35, capFrom: .91, seg: 24 },
};

// Named geometry presets referenced by SKUs (dimensions in cm).
export const GEO = {
  // pillow bags
  'bag-tiny':   { kind: 'bag', dims: [7, 10, 1.0] },
  'bag-s':      { kind: 'bag', dims: [10, 15, 2.6] },
  'bag-m':      { kind: 'bag', dims: [14, 21, 4.2] },
  'bag-l':      { kind: 'bag', dims: [18, 27, 6] },
  'bag-xl':     { kind: 'bag', dims: [22, 30, 8] },
  'bag-flat':   { kind: 'bag', dims: [13, 18, 1.8] },
  'bag-noodle': { kind: 'bag', dims: [12, 17, 3.2] },
  'bag-loaf':   { kind: 'bag', dims: [22, 12, 9] },
  'bag-bun':    { kind: 'bag', dims: [12, 8, 7] },
  'bag-snack':  { kind: 'bag', dims: [12, 17, 3.5] },
  // bottles / cans / cups
  'can330':     { kind: 'wrap', profile: 'can', dims: [6.6, 12.2] },
  'can250':     { kind: 'wrap', profile: 'can', dims: [5.4, 13.4] },
  'can490':     { kind: 'wrap', profile: 'can', dims: [6.6, 16.8] },
  'can185':     { kind: 'wrap', profile: 'can', dims: [5.2, 9.2] },
  'pet500':     { kind: 'wrap', profile: 'petSoda', dims: [6.4, 21.5] },
  'pet345':     { kind: 'wrap', profile: 'petSlim', dims: [5.8, 17.5] },
  'pet600w':    { kind: 'wrap', profile: 'petWater', dims: [6.6, 21.5] },
  'pet1500w':   { kind: 'wrap', profile: 'bigPet', dims: [8.6, 31] },
  'pet1250':    { kind: 'wrap', profile: 'bigPet', dims: [8.4, 30] },
  'pet250':     { kind: 'wrap', profile: 'petSlim', dims: [5.2, 15.5] },
  'beer620':    { kind: 'wrap', profile: 'beerBottle', dims: [6.6, 26.5] },
  'beer330':    { kind: 'wrap', profile: 'beerBottle', dims: [6.0, 23.5] },
  'glass150':   { kind: 'wrap', profile: 'energyGlass', dims: [3.8, 10.6] },
  'glass100':   { kind: 'wrap', profile: 'energyGlass', dims: [3.4, 9.6] },
  'glass300':   { kind: 'wrap', profile: 'petSlim', dims: [5.4, 17] },
  'cup-noodle': { kind: 'wrap', profile: 'cupNoodle', dims: [8.6, 10.2] },
  'cup-noodle-l': { kind: 'wrap', profile: 'cupNoodle', dims: [9.6, 11.8] },
  'cup-cafe':   { kind: 'wrap', profile: 'cupNoodle', dims: [7.8, 14.5] },
  'cup-small':  { kind: 'wrap', profile: 'tubPot', dims: [6.2, 6.2] },
  'cup-dessert':{ kind: 'wrap', profile: 'tubPot', dims: [8.2, 7.2] },
  'cup-fruit':  { kind: 'wrap', profile: 'tubPot', dims: [8.8, 8.6] },
  'tub-ice':    { kind: 'wrap', profile: 'tubPot', dims: [8.4, 7.8] },
  'tub-family': { kind: 'wrap', profile: 'tubPot', dims: [12.5, 11] },
  'tube-chips': { kind: 'wrap', profile: 'tubeChips', dims: [7.4, 23.4] },
  'jar-s':      { kind: 'wrap', profile: 'jar', dims: [6.4, 8] },
  'tin-tuna':   { kind: 'wrap', profile: 'jar', dims: [8.4, 3.6] },
  'aerosol':    { kind: 'wrap', profile: 'aerosol', dims: [6.4, 21] },
  'bottle-sauce': { kind: 'wrap', profile: 'petSlim', dims: [6, 20] },
  'bottle-oil': { kind: 'wrap', profile: 'petWater', dims: [8, 24] },
  'shampoo':    { kind: 'wrap', profile: 'shampoo', dims: [6.6, 18] },
  'flip-s':     { kind: 'wrap', profile: 'flipBottle', dims: [5.4, 14] },
  'inhaler':    { kind: 'wrap', profile: 'can', dims: [1.9, 8.2] },
  'balm-jar':   { kind: 'wrap', profile: 'jar', dims: [4.6, 3.2] },
  'lighter':    { kind: 'box', dims: [2.6, 8.2, 1.1] },
  // boxes
  'box-xs':     { kind: 'box', dims: [7, 9, 3] },
  'box-s':      { kind: 'box', dims: [9, 12, 4] },
  'box-m':      { kind: 'box', dims: [13, 9, 5.5] },
  'box-tall':   { kind: 'box', dims: [7.5, 16, 4.5] },
  'box-l':      { kind: 'box', dims: [16, 12, 7] },
  'box-choc':   { kind: 'box', dims: [16, 8, 2.2] },
  'box-tissue': { kind: 'box', dims: [24, 12, 12] },
  'box-detergent': { kind: 'box', dims: [14, 21, 6] },
  'box-tooth':  { kind: 'box', dims: [4.6, 17.5, 3.6] },
  'box-eggs':   { kind: 'box', dims: [24, 6.5, 6.5] },
  'card':       { kind: 'box', dims: [11, 17, 1.6] },
  'stick':      { kind: 'box', dims: [5.4, 15, 1.5] },
  'tray-meal':  { kind: 'box', dims: [19.5, 4.6, 14] },
  'tray-sand':  { kind: 'box', dims: [12.5, 3.6, 11] },
  'tray-onigiri': { kind: 'box', dims: [9.5, 3.6, 8.5] },
  'tray-salad': { kind: 'box', dims: [15, 6.5, 11] },
  'tray-fruit': { kind: 'box', dims: [11.5, 5.5, 9] },
  'brick':      { kind: 'box', dims: [5.8, 10.6, 3.6] },
  'brick-l':    { kind: 'box', dims: [7, 14, 5] },
  'gable-1l':   { kind: 'gable', dims: [7, 19.5, 7] },
  'gable-450':  { kind: 'gable', dims: [6, 15, 6] },
  'gable-200':  { kind: 'gable', dims: [5, 11, 3.8] },
};

// Atlas layout in centimetres (canvas coordinate space, origin top-left).
export function atlasFor(geo) {
  const [a, b, c] = geo.dims;
  if (geo.kind === 'bag') {
    const w = a, h = b;
    return { W: 2 * w, H: h, cells: { front: [0, 0, w, h], back: [w, 0, w, h] } };
  }
  if (geo.kind === 'box' || geo.kind === 'gable') {
    const w = a, h = b, d = c;
    return {
      W: 2 * d + 2 * w, H: h + d + (geo.kind === 'gable' ? d * 0.6 : 0),
      cells: { left: [0, 0, d, h], front: [d, 0, w, h], right: [d + w, 0, d, h], back: [2 * d + w, 0, w, h], top: [d, h, w, d], bottom: [d + w, h, w, d], roof: [2 * d, h, w, d * 0.6] },
    };
  }
  // wrap: circumference x height, plus a square for the top disc
  const D = a, h = b, circ = Math.PI * D;
  return { W: Math.max(circ, D), H: h + D, cells: { wrap: [0, 0, circ, h], top: [0, h, D, D] } };
}

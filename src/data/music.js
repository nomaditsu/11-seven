// Four chiptune tracks for the in-store music. Each is 8 bars of 16 steps; melody tokens are note names
// ("c#5"), "-" holds the previous note and "." is a rest. The synth lives in src/game/chiptune.js.
export const MUSIC_TRACKS = [
  { id:'midnight', name:'Midnight Run', moodKey:'track.bright', bpm:118, key:'C major', swing:0,
   lead:{duty:.25, vol:.16},
   arp:{duty:.125, vol:.05, oct:1},
   bass:{steps:[0,2,4,6,8,10,12,14], oct:[0,12,0,12,0,12,0,12], wave:'triangle'},
   drums:{kick:[0,6,8,14], snare:[4,12], hat:[2,6,10,14], ghost:[15]},
   chords:[[48,'M'],[45,'m'],[41,'M'],[43,'M'],[48,'M'],[45,'m'],[41,'M'],[43,'M']],
   melody:[
    'e5 - g5 - c6 - . g5 e5 - g5 - e5 - . .',
    'e5 - a5 - c6 - . a5 e5 - a5 - c6 - . .',
    'f5 - a5 - c6 - a5 - f5 - a5 - g5 - . .',
    'g5 - b5 - d6 - b5 - g5 . a5 . b5 - . .',
    'c6 - . b5 c6 - e6 - c6 - g5 - e5 - . .',
    'a5 - c6 - e6 - c6 - a5 - e5 - a5 - . .',
    'f5 - a5 - c6 - f6 - e6 - c6 - a5 - . .',
    'g5 - a5 - b5 - d6 - c6 - . . g5 - . .' ] },
  { id:'aisle', name:'Aisle Groove', moodKey:'track.funky', bpm:100, key:'A minor', swing:.16,
   lead:{duty:.5, vol:.13},
   arp:null,
   bass:{steps:[0,3,6,10,12,14], oct:[0,0,12,0,7,0], wave:'square', duty:.5, vol:.11},
   drums:{kick:[0,6,10], snare:[4,12], hat:[0,2,4,6,8,10,12,14], ghost:[7,15]},
   chords:[[45,'m'],[45,'m'],[41,'M'],[43,'M'],[45,'m'],[48,'M'],[41,'M'],[40,'M']],
   melody:[
    'a4 . c5 - e5 . . d5 c5 . a4 - . . . .',
    'a4 . c5 . e5 - g5 - e5 . d5 c5 . . . .',
    'f4 . a4 - c5 . . a4 f5 - e5 - c5 . . .',
    'g4 . b4 - d5 . . b4 g5 - f5 - d5 . . .',
    'a4 . c5 - e5 . . d5 c5 . a4 - . . . .',
    'c5 . e5 - g5 . . e5 c6 - b5 - g5 . . .',
    'f5 - e5 - c5 - a4 - c5 . f5 - . . . .',
    'e5 - g#5 - b5 - e6 - . . d6 - b5 - . .' ] },
  { id:'tuktuk', name:'Tuk-Tuk Sunrise', moodKey:'track.sunny', bpm:132, key:'D major', swing:0,
   lead:{duty:.25, vol:.15},
   arp:{duty:.125, vol:.045, oct:1},
   bass:{steps:[0,3,4,7,8,11,12,14], oct:[0,0,12,0,0,0,12,7], wave:'triangle'},
   drums:{kick:[0,4,8,12], snare:[4,12], hat:[2,6,10,14], ghost:[15]},
   chords:[[50,'M'],[47,'m'],[43,'M'],[45,'M'],[50,'M'],[47,'m'],[43,'M'],[45,'M']],
   melody:[
    'f#5 - a5 f#5 d5 - f#5 - a5 - b5 - a5 f#5 . .',
    'b5 - a5 - f#5 - d5 - f#5 - a5 - b5 - . .',
    'd6 - b5 - g5 - b5 - d6 - e6 - d6 - . .',
    'e6 - f#6 - e6 - d6 - a5 - . . f#5 - a5 - . .',
    'd6 - . a5 d6 - f#6 - e6 - d6 - a5 - . .',
    'b5 - d6 - f#6 - d6 - b5 - a5 - f#5 - . .',
    'g5 - b5 - d6 - g6 - f#6 - d6 - b5 - . .',
    'a5 - . e5 a5 - . e5 c#6 - e6 - a5 - . .' ] },
  { id:'lullaby', name:'Fridge Hum Lullaby', moodKey:'track.dreamy', bpm:78, key:'F major', swing:0,
   lead:{duty:null, vol:.2, wave:'triangle'},
   arp:{duty:null, wave:'sine', vol:.06, oct:1, every:2},
   bass:{steps:[0,8], oct:[0,0], wave:'triangle', vol:.12, long:true},
   drums:{kick:[0], snare:[], hat:[4,12], rim:[12], ghost:[]},
   chords:[[41,'M'],[38,'m'],[46,'M'],[48,'M'],[41,'M'],[45,'m'],[46,'M'],[48,'M']],
   melody:[
    'a5 - - - c6 - - - a5 - - - g5 - . .',
    'f5 - - - a5 - - - d6 - - - c6 - . .',
    'd6 - - - c6 - - - bb5 - - - a5 - . .',
    'g5 - - - c6 - - - e6 - - - d6 - . .',
    'c6 - - - a5 - - - f5 - - - a5 - . .',
    'e6 - - - c6 - - - a5 - - - c6 - . .',
    'd6 - - - f6 - - - d6 - - - bb5 - . .',
    'c6 - - - g5 - - - e5 - - - . . . .' ] },
];

const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
export function midi(name) {
  const m = /^([a-g])([#b]?)(\d)$/.exec(name); if (!m) return null;
  return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
// "e5 - g5 ." -> [{ step, m, len }] over 16 steps
function parseBar(str) {
  const t = str.trim().split(/\s+/), out = []; let cur = null;
  for (let i = 0; i < 16; i++) {
    const tok = t[i] || '.';
    if (tok === '-') { if (cur) cur.len++; continue; }
    if (tok === '.') { cur = null; continue; }
    cur = { step: i, m: midi(tok), len: 1 }; out.push(cur);
  }
  return out;
}
MUSIC_TRACKS.forEach((t) => { t.bars = t.melody.map(parseBar); });
export const MAJ = [0, 4, 7, 12], MIN = [0, 3, 7, 12];

// Inline SVG icons, flags, brand lockup and NPC avatars. Everything is drawn in code (no image files).
import { BRAND, BADGE_PATH, ONE_FLAG, ONE_STEM, ONES_AT } from '../gfx/logo11seven.js';
export const ICON = {
  sound: '<svg viewBox="0 0 24 24"><path class="f" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a8 8 0 010 11"/></svg>',
  soundoff: '<svg viewBox="0 0 24 24"><path class="f" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  music: '<svg viewBox="0 0 24 24"><circle class="f" cx="8" cy="17.5" r="3.2"/><path d="M11.2 17.5V4.5c0 3.2 6.3 3 6.3 8"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path class="f" d="M5 5.5v13l9-6.5z"/><path class="f" d="M16 5.5h3v13h-3z"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path class="f" d="M19 5.5v13l-9-6.5z"/><path class="f" d="M5 5.5h3v13H5z"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
  voice: '<svg viewBox="0 0 24 24"><path class="f" d="M12 3.5a3 3 0 013 3v5a3 3 0 01-6 0v-5a3 3 0 013-3z"/><path d="M6 11a6 6 0 0012 0M12 17v3.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 2"/></svg>',
  cash: '<svg viewBox="0 0 24 24"><rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.7"/><path d="M6.5 12h.01M17.5 12h.01"/></svg>',
  basket: '<svg viewBox="0 0 24 24"><path d="M3.5 10h17l-1.8 9.2a1.5 1.5 0 01-1.5 1.3H6.8a1.5 1.5 0 01-1.5-1.3z"/><path d="M8 10l3-5.5M16 10l-3-5.5M9 14v3M12 14v3M15 14v3"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M6 3.5h11a2 2 0 012 2v14H8a2 2 0 01-2-2z"/><path d="M6 17.5a2 2 0 012-2h11M10 8h5"/></svg>',
  talk: '<svg viewBox="0 0 24 24"><path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7a2.5 2.5 0 01-2.5 2.5H11l-4.5 3.5V16H6.5A2.5 2.5 0 014 13.5z"/><path d="M8.5 9.5h7M8.5 12.5h4"/></svg>',
  hand: '<svg viewBox="0 0 24 24"><path d="M8 12V5.5a1.5 1.5 0 013 0V11m0-1.5V4.5a1.5 1.5 0 013 0V11m0-4a1.5 1.5 0 013 0v6.5c0 4-2.5 7-6 7-2.6 0-4-1.4-5.5-3.6L4.2 13a1.5 1.5 0 012.3-1.9L8 12.8"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>',
  undo: '<svg viewBox="0 0 24 24"><path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 010 8h-3"/></svg>',
  crouch: '<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  stick: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>',
  drag: '<svg viewBox="0 0 24 24"><path d="M8 13V6.5a1.5 1.5 0 013 0V12m0-2.5a1.5 1.5 0 013 0V13m0-2a1.5 1.5 0 013 0v4c0 3.5-2.5 6-6 6-2.5 0-4-1.2-5.5-3.4L4 13.5a1.5 1.5 0 012.3-1.9L8 13.5"/></svg>',
  pinch: '<svg viewBox="0 0 24 24"><path d="M5 5l5 5M19 19l-5-5M5 5h4M5 5v4M19 19h-4M19 19v-4"/></svg>',
  tab: '<svg viewBox="0 0 24 24"><path d="M4 12h16M15 7l5 5-5 5"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
  yt: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="M10.5 9.5v5l4-2.5z"/></svg>',
  ig: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.8 7.2h.01"/></svg>',
  tree: '<svg viewBox="0 0 24 24"><path d="M12 3v18M12 8L6.5 5M12 8l5.5-3M12 13l-7-2.5M12 13l7-2.5"/></svg>',
  party: '<svg viewBox="0 0 24 24"><path d="M3.5 20.5l4.8-11.8 7 7z"/><path d="M6.3 13.6l4.1 4.1"/><path d="M12 8.5c1.3-1.3 1.4-3.1.3-4.6M15.5 12c1.3-1.3 3.1-1.4 4.6-.3"/><path d="M15 7l1.6-1.6"/><circle class="f" cx="17.6" cy="3.6" r="1.1"/><circle class="f" cx="20.4" cy="8" r="1.1"/></svg>',
  disc: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/><path d="M5.5 8.5A8 8 0 019 5"/></svg>',
  cup: '<svg viewBox="0 0 24 24"><path d="M5 9h12v5a5 5 0 01-5 5h-2a5 5 0 01-5-5zM17 10h1.5a2.5 2.5 0 010 5H17M8 3v3M12 3v3"/></svg>',
};

// Simplified flags (rounded, no outline). Thailand is 1:1:2:1:1 red / white / blue / white / red.
export const FLAG = {
  uk: (w, h, st = '') => `<svg class="flag" style="${st}" width="${w}" height="${h}" viewBox="0 0 30 20"><clipPath id="fcUK"><rect width="30" height="20" rx="3"/></clipPath><g clip-path="url(#fcUK)"><rect width="30" height="20" fill="#1b3a8f"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#d1202f" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6.5"/><path d="M15 0v20M0 10h30" stroke="#d1202f" stroke-width="3.6"/></g></svg>`,
  th: (w, h, st = '') => `<svg class="flag" style="${st}" width="${w}" height="${h}" viewBox="0 0 30 20"><clipPath id="fcTH"><rect width="30" height="20" rx="3"/></clipPath><g clip-path="url(#fcTH)"><rect width="30" height="20" fill="#d3182f"/><rect y="3.33" width="30" height="13.34" fill="#fff"/><rect y="6.67" width="30" height="6.66" fill="#2d2a4a"/></g></svg>`,
};
// flags for a language mode: en -> UK, th -> Thai, both -> both, stacked
export function flagsFor(mode, size = 24) {
  const h = Math.round(size * 0.66);
  if (mode === 'en') return FLAG.uk(size, h);
  if (mode === 'th') return FLAG.th(size, h);
  return FLAG.uk(size, h) + FLAG.th(size, h);
}

// 11 SEVEN lockup for the DOM (title screen, badge header). h = pixel height.
// The 11 SEVEN badge (same 200 x 200 grid as drawLogo in src/gfx/logo11seven.js).
// o.square: on the green square (default true); o.rounded: round the square's corners (HUD and small UI).
export function logoSvg(h = 40, o = {}) {
  const square = o.square !== false, r = o.rounded ? 40 : 0;
  const one = (x, y) => `<g transform="translate(${x} ${y})"><path d="${ONE_FLAG}" fill="${BRAND.orange}"/><path d="${ONE_STEM}" fill="${BRAND.red}"/></g>`;
  const badge = `<path d="${BADGE_PATH}" fill="#fff"/>${ONES_AT.map(([x, y]) => one(x, y)).join('')}` +
    `<text x="100" y="131" text-anchor="middle" font-family="'Archivo Black',Kanit,sans-serif" font-size="42" textLength="134" lengthAdjust="spacingAndGlyphs" fill="${o.textColor || BRAND.green}" stroke="#fff" stroke-width="7" stroke-linejoin="round" paint-order="stroke">SEVEN</text>`;
  return `<svg class="logo" viewBox="0 0 200 200" width="${h}" height="${h}" role="img" aria-label="11 SEVEN">` +
    (square ? `<rect width="200" height="200" rx="${r}" fill="${BRAND.green}"/><g transform="translate(14 14) scale(.86)">${badge}</g>` : badge) + '</svg>';
}

// Small character portraits for the dialogue card (kind -> look).
const FACES = {
  cashier: { skin: '#e8b98d', hair: '#1a1210', shirt: '#fbfbf7', style: 'bun', stripe: true },
  cashier2: { skin: '#d9a679', hair: '#1a1210', shirt: '#fbfbf7', style: 'short', stripe: true },
  student: { skin: '#f1c8a3', hair: '#0e0a08', shirt: '#ffffff', style: 'ponytails', collar: '#1c2d5a' },
  office: { skin: '#e8b98d', hair: '#1a1210', shirt: '#b7d4ee', style: 'short', tie: '#e05a2a' },
  tourist: { skin: '#f3cfb0', hair: '#d9b25a', shirt: '#d63a2a', style: 'short' },
  auntie: { skin: '#e8b98d', hair: '#8a8a8a', shirt: '#e8a0b8', style: 'bun' },
  monk: { skin: '#d9a679', hair: null, shirt: '#e0801a', style: 'bald' },
  rider: { skin: '#d9a679', hair: '#1a1210', shirt: '#e8681a', style: 'short', vest: '#f58220' },
  shopper: { skin: '#f1c8a3', hair: '#1a1210', shirt: '#2a6fd0', style: 'short' },
  dog: null,
};
export function avatarSvg(kind) {
  if (kind === 'dog') {
    return '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#e8f5ee"/><ellipse cx="14" cy="30" rx="8" ry="14" fill="#3a2a1e" transform="rotate(12 14 30)"/><ellipse cx="50" cy="30" rx="8" ry="14" fill="#3a2a1e" transform="rotate(-12 50 30)"/><ellipse cx="32" cy="34" rx="18" ry="19" fill="#c89a64"/><ellipse cx="32" cy="42" rx="9" ry="7" fill="#e6c79a"/><circle cx="25" cy="31" r="2.4" fill="#1a1210"/><circle cx="39" cy="31" r="2.4" fill="#1a1210"/><ellipse cx="32" cy="38" rx="3.4" ry="2.4" fill="#1a1210"/><path d="M32 41v3M28 45q4 3 8 0" stroke="#1a1210" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  }
  const f = FACES[kind] || FACES.shopper;
  const hair = f.hair ? (f.style === 'ponytails'
    ? `<path d="M17 24c0-11 7-16 15-16s15 5 15 16c-4-5-9-7-15-7s-11 2-15 7z" fill="${f.hair}"/><circle cx="14" cy="26" r="4" fill="${f.hair}"/><circle cx="50" cy="26" r="4" fill="${f.hair}"/>`
    : `<path d="M17 24c0-11 7-16 15-16s15 5 15 16c-4-5-9-7-15-7s-11 2-15 7z" fill="${f.hair}"/>${f.style === 'bun' ? `<circle cx="32" cy="7" r="5" fill="${f.hair}"/>` : ''}`) : '';
  const monk = kind === 'monk' ? '<path d="M14 64c0-14 8-22 18-22s18 8 18 22z" fill="#e0801a"/><path d="M32 42l-9 22" stroke="#b25a0a" stroke-width="2"/>' : '';
  const body = kind === 'monk' ? monk : `<path d="M12 64c0-14 8-20 20-20s20 6 20 20z" fill="${f.shirt}"/>${f.stripe ? '<rect x="12" y="50" width="40" height="3" fill="#f58220"/><rect x="12" y="53" width="40" height="3" fill="#00874a"/><rect x="12" y="56" width="40" height="3" fill="#e31e24"/>' : ''}${f.collar ? `<rect x="12" y="52" width="40" height="12" fill="${f.collar}"/>` : ''}${f.tie ? `<path d="M30 46h4l2 14h-8z" fill="${f.tie}"/>` : ''}${f.vest ? `<path d="M14 64c0-12 6-18 12-19l6 8 6-8c6 1 12 7 12 19z" fill="${f.vest}"/>` : ''}`;
  return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#e8f5ee"/>${body}<circle cx="32" cy="27" r="14" fill="${f.skin}"/>${hair}<circle cx="26.5" cy="27" r="1.7" fill="#1a1210"/><circle cx="37.5" cy="27" r="1.7" fill="#1a1210"/><path d="M27 33q5 4 10 0" stroke="#7a3b2a" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
}

export const LINKS = [
  { id: 'linktree', n: 'Linktree', u: 'https://linktr.ee/nomaditsu', i: ICON.tree, g: 'follow' },
  { id: 'youtube', n: 'YouTube', u: 'https://youtube.com/@nomaditsu', i: ICON.yt, g: 'follow' },
  { id: 'instagram', n: 'Instagram', u: 'https://www.instagram.com/nomaditsu', i: ICON.ig, g: 'follow' },
  { id: 'linkedin', n: 'LinkedIn', u: 'https://www.linkedin.com/in/raydeguzman', i: 'in', g: 'follow' },
  { id: 'github', n: 'GitHub', u: 'https://github.com/nomaditsu', i: '&lt;/&gt;', g: 'follow' },
  { id: 'tiktok', n: 'TikTok', u: 'https://tiktok.com/@nomaditsu', i: ICON.music, g: 'follow' },
  { id: 'x', n: 'X', u: 'https://x.com/nomaditsu', i: 'X', g: 'follow' },
  { id: 'website', n: 'Nomaditsu.com', u: 'https://nomaditsu.com', i: ICON.globe, g: 'follow' },
  { id: 'cutparty', n: 'CutParty', u: 'https://cutparty.com', i: ICON.party, g: 'follow' },
  { id: 'mindset', n: 'Mind Set album', u: 'https://youtube.com/playlist?list=PLMZl7x-grnhoGHvBWmbv1su4ZYK5uc7uA', i: ICON.disc, g: 'music' },
  { id: 'ytmusic', n: 'YouTube Music', u: 'https://music.youtube.com/channel/UCOVA17GV3c-0Pfi0chUyEQw', i: ICON.music, g: 'music' },
  { id: 'spotify', n: 'Spotify', u: 'https://open.spotify.com/artist/3PJNVn49oyIt3K6v1VIeI1', i: ICON.music, g: 'music' },
  { id: 'apple', n: 'Apple Music', u: 'https://music.apple.com/us/artist/nomaditsu/1762580236', i: ICON.music, g: 'music' },
];
export const SUPPORT = [
  { id: 'bmc', n: 'Buy Me a Coffee', u: 'https://buymeacoffee.com/nomaditsu', i: ICON.cup, cls: 'bmc' },
  { id: 'paypal', n: 'PayPal', u: 'https://paypal.me/raydg', i: 'P', cls: 'pp' },
];

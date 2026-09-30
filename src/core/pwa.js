// Install to the home screen and play offline. The service worker (sw.js, written by the build) keeps a copy of the
// game on the device.
const web = () => /^https?:$/.test(location.protocol);
const standalone = () => matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone === true;
// iPadOS reports itself as a Mac; a Mac has no touch points.
const ios = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

// Only over http(s): a service worker cannot run from a file opened from disk. A local dev server is skipped too, since
// the cached copy would hide every new build; add ?sw to the URL to test it there (scripts/pwa-check.mjs does).
export function initOffline(params) {
  if (!('serviceWorker' in navigator) || !web()) return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !params.has('sw')) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // Ask the browser not to clear the saves under storage pressure. Only once installed: Firefox asks the player otherwise.
  if (standalone() && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

// iOS has no install prompt, so the title screen says how (Share > Add to Home Screen) until the game runs installed.
export function showInstallHint() {
  const el = document.getElementById('install-hint');
  if (el) el.hidden = !(web() && ios() && !standalone());
}

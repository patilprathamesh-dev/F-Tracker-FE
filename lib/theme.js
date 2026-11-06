// Light / Dark / System theme. The choice is saved on the device (localStorage 'theme').
// THEME_SCRIPT runs in <head> before the page paints, so the right colours show with no flash.

export const THEME_KEY = 'theme';
const COLORS = { light: '#f8fafc', dark: '#020617' };

export const THEME_SCRIPT = `(function () {
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function apply() {
    var mode = 'system';
    try { mode = localStorage.getItem('${THEME_KEY}') || 'system'; } catch (e) {}
    var dark = mode === 'dark' || (mode === 'system' && media.matches);
    document.documentElement.classList.toggle('dark', dark);
    var color = dark ? '${COLORS.dark}' : '${COLORS.light}';
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', color);
  }
  window.__applyTheme = apply;
  media.addEventListener('change', apply);
  apply();
})();`;

export function getTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'system'; } catch { return 'system'; }
}

/** mode: 'light' | 'dark' | 'system' */
export function setTheme(mode) {
  try {
    if (mode === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  } catch {}
  window.__applyTheme?.();
}

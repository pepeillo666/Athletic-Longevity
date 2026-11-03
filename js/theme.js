// Hell-/Dunkelmodus anwenden.
const THEME_KEY = 'al-theme';
let current = 'dark';
const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

export function applyTheme(theme) {
  current = theme || 'dark';
  const dark = current === 'dark' || (current === 'system' && media && media.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#111316' : '#eef0ee');
  try { localStorage.setItem(THEME_KEY, current); } catch { /* egal */ }
}

if (media && media.addEventListener) {
  media.addEventListener('change', () => { if (current === 'system') applyTheme('system'); });
}

/**
 * Injected synchronously in <head> so the very first paint already carries the
 * right theme — otherwise a dark-mode visitor gets a white flash on every load.
 * Deliberately not a client component: the layout is a server component and
 * only needs the string.
 */
export const THEME_BOOTSTRAP = `
(function () {
  try {
    var stored = localStorage.getItem('quickcart_theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

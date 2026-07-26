/**
 * Injected synchronously in <head> so the very first paint already carries the
 * right theme and language — otherwise a dark-mode visitor gets a white flash,
 * and a Vietnamese one gets a frame of English, on every load.
 * Deliberately not a client component: the layout is a server component and
 * only needs the string.
 */
export const THEME_BOOTSTRAP = `
(function () {
  var root = document.documentElement;
  try {
    var storedTheme = localStorage.getItem('quickcart_theme');
    root.dataset.theme = (storedTheme === 'light' || storedTheme === 'dark')
      ? storedTheme
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) {
    root.dataset.theme = 'light';
  }
  try {
    var storedLang = localStorage.getItem('quickcart_lang');
    if (storedLang === 'en' || storedLang === 'vi' || storedLang === 'ja') {
      root.lang = storedLang;
    } else {
      // First visit: follow the browser, but only into a language we ship.
      var nav = (navigator.language || 'en').slice(0, 2);
      root.lang = (nav === 'vi' || nav === 'ja') ? nav : 'en';
    }
  } catch (e) {
    root.lang = 'en';
  }
})();
`;

'use client';

/**
 * Small client-side theme toggle shared by public and signed-in screens.
 *
 * The DOM is identical during server/client hydration. CSS decides which icon
 * is visible from html[data-theme], avoiding hydration mismatches when the
 * saved theme is dark.
 */

const STORAGE_KEY = 'logicgate-theme';

type ThemePreference = 'light' | 'dark';

function getCurrentTheme(): ThemePreference {
  if (typeof document === 'undefined') {
    return 'light';
  }

  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: ThemePreference) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle() {
  function toggleTheme() {
    const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-950 hover:bg-slate-50"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      <span className="logicgate-theme-toggle-light" aria-hidden="true">🌙</span>
      <span className="logicgate-theme-toggle-dark" aria-hidden="true">☀️</span>
    </button>
  );
}

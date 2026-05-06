import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

/**
 * Manages the application theme (light / dark).
 * Persists the user's choice in localStorage and applies the
 * `data-theme` attribute on <html> so that CSS variables can react.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';

  readonly isDark = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY) as AppTheme | null;
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initial: AppTheme = saved ?? (prefersDark ? 'dark' : 'light');
    this._apply(initial);
  }

  toggle(): void {
    this._apply(this.isDark() ? 'light' : 'dark');
  }

  private _apply(theme: AppTheme): void {
    this.isDark.set(theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }
}

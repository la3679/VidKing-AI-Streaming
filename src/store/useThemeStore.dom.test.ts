import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from './useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    useThemeStore.setState({ theme: 'light' });
  });

  it('applies the theme to <html> and persists it', () => {
    useThemeStore.getState().setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('vk_theme')).toBe('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('toggles between light and dark', () => {
    useThemeStore.setState({ theme: 'light' });
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('dark');
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

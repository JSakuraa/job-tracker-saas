// T169: Integrated theme selection from rewards

'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
type ColorTheme = 'default' | 'retro-green' | 'ocean' | 'sunset' | 'neon';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  colorTheme: ColorTheme;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'job-tracker-theme';
const COLOR_THEME_STORAGE_KEY = 'job-tracker-color-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function getStoredColorTheme(): ColorTheme {
  if (typeof window === 'undefined') return 'default';
  const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
  if (
    stored === 'default' ||
    stored === 'retro-green' ||
    stored === 'ocean' ||
    stored === 'sunset' ||
    stored === 'neon'
  ) {
    return stored;
  }
  return 'default';
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  defaultColorTheme?: ColorTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultColorTheme = 'default',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(defaultColorTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage on mount
  useEffect(() => {
    const stored = getStoredTheme();
    const storedColor = getStoredColorTheme();
    setThemeState(stored);
    setColorThemeState(storedColor);
    setMounted(true);
  }, []);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (!mounted) return;

    const resolved: ResolvedTheme = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.setAttribute('data-color-theme', colorTheme);
  }, [theme, colorTheme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme: ResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  const setColorTheme = useCallback((newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, newColorTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  }, [resolvedTheme, setTheme]);

  // Prevent hydration mismatch by rendering with default until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: defaultTheme,
          resolvedTheme: 'light',
          colorTheme: defaultColorTheme,
          setTheme: () => {},
          setColorTheme: () => {},
          toggleTheme: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, colorTheme, setTheme, setColorTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

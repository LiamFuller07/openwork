'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Types
type ThemeMode = 'light' | 'dark';
type ThemeTemperature = 'cool' | 'warm';
type Theme = 'cool-light' | 'cool-dark' | 'warm-light' | 'warm-dark';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  temperature: ThemeTemperature;
  setTheme: (theme: Theme) => void;
  setMode: (mode: ThemeMode) => void;
  setTemperature: (temp: ThemeTemperature) => void;
  toggleMode: () => void;
  toggleTemperature: () => void;
}

// Context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'openwork-theme';

// Helper to parse theme string into parts
const parseTheme = (theme: Theme): { mode: ThemeMode; temperature: ThemeTemperature } => {
  const [temperature, mode] = theme.split('-') as [ThemeTemperature, ThemeMode];
  return { mode, temperature };
};

// Helper to construct theme string from parts
const constructTheme = (temperature: ThemeTemperature, mode: ThemeMode): Theme => {
  return `${temperature}-${mode}` as Theme;
};

// Helper to get system preference
const getSystemPreference = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Helper to get initial theme from localStorage or system
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'warm-light';

  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && ['cool-light', 'cool-dark', 'warm-light', 'warm-dark'].includes(stored)) {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to read theme from localStorage:', e);
  }

  // Default to warm theme with system mode preference
  const systemMode = getSystemPreference();
  return constructTheme('warm', systemMode);
};

// Provider Props
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

// Provider Component
export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => defaultTheme || getInitialTheme());
  const [isHydrated, setIsHydrated] = useState(false);

  // Parse current theme
  const { mode, temperature } = parseTheme(theme);

  // Set theme and update DOM + localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch (e) {
        console.warn('Failed to save theme to localStorage:', e);
      }
    }
  }, []);

  // Set mode (keep temperature)
  const setMode = useCallback((newMode: ThemeMode) => {
    const newTheme = constructTheme(temperature, newMode);
    setTheme(newTheme);
  }, [temperature, setTheme]);

  // Set temperature (keep mode)
  const setTemperature = useCallback((newTemp: ThemeTemperature) => {
    const newTheme = constructTheme(newTemp, mode);
    setTheme(newTheme);
  }, [mode, setTheme]);

  // Toggle between light and dark
  const toggleMode = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  }, [mode, setMode]);

  // Toggle between cool and warm
  const toggleTemperature = useCallback(() => {
    const newTemp = temperature === 'cool' ? 'warm' : 'cool';
    setTemperature(newTemp);
  }, [temperature, setTemperature]);

  // Hydration effect - runs once on mount
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set data-theme attribute
    document.documentElement.setAttribute('data-theme', theme);

    // Also set individual attributes for easier CSS targeting
    document.documentElement.setAttribute('data-mode', mode);
    document.documentElement.setAttribute('data-temperature', temperature);

    // Add/remove dark class for Tailwind compatibility
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mode, temperature]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const systemMode = e.matches ? 'dark' : 'light';
        setMode(systemMode);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [setMode]);

  const value: ThemeContextValue = {
    theme,
    mode,
    temperature,
    setTheme,
    setMode,
    setTemperature,
    toggleMode,
    toggleTemperature,
  };

  // Prevent flash of unstyled content by not rendering until hydrated
  // This is optional - remove if you prefer immediate render with SSR defaults
  if (!isHydrated && typeof window !== 'undefined') {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Hook to use theme context
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// Export types for external use
export type { Theme, ThemeMode, ThemeTemperature, ThemeContextValue };

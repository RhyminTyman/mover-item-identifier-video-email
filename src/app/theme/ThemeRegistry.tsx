"use client";

import React, { useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// Create emotion cache
function createEmotionCache() {
  return createCache({ key: 'mui' });
}

// Use a simpler approach for client-side rendering only
const clientSideEmotionCache = createEmotionCache();

interface ThemeRegistryProps {
  children: React.ReactNode;
}

export function ThemeRegistry({ children }: ThemeRegistryProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only run on client side to avoid SSR hydration issues
  useEffect(() => {
    setMounted(true);
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    // Listen for theme changes
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('theme');
      setIsDarkMode(currentTheme === 'dark');
    };

    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
      },
      secondary: {
        main: '#6b7280',
        light: '#9ca3af',
        dark: '#4b5563',
      },
      background: {
        default: isDarkMode ? '#0f172a' : '#f9fafb',
        paper: isDarkMode ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#f1f5f9' : '#111827',
        secondary: isDarkMode ? '#cbd5e1' : '#6b7280',
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDarkMode 
              ? '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)'
              : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
  });

  // Provide default light theme for SSR to prevent hydration mismatches
  const defaultTheme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#3b82f6' },
      secondary: { main: '#6b7280' },
      background: { default: '#f9fafb', paper: '#ffffff' },
    },
    shape: { borderRadius: 8 },
    typography: { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  });

  if (!mounted) {
    return (
      <CacheProvider value={clientSideEmotionCache}>
        <MuiThemeProvider theme={defaultTheme}>
          <CssBaseline />
          <ThemeProviderWrapper setIsDarkMode={() => {}}>
            {children}
          </ThemeProviderWrapper>
        </MuiThemeProvider>
      </CacheProvider>
    );
  }

  return (
    <CacheProvider value={clientSideEmotionCache}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeProviderWrapper setIsDarkMode={setIsDarkMode}>
          {children}
        </ThemeProviderWrapper>
      </MuiThemeProvider>
    </CacheProvider>
  );
}

// Simple theme context that works with our MUI setup
interface ThemeProviderWrapperProps {
  children: React.ReactNode;
  setIsDarkMode: (isDark: boolean) => void;
}

function ThemeProviderWrapper({ children, setIsDarkMode }: ThemeProviderWrapperProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setMode(savedTheme);
      setIsDarkMode(savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const newMode = prefersDark ? 'dark' : 'light';
      setMode(newMode);
      setIsDarkMode(newMode === 'dark');
    }
  }, [setIsDarkMode]);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    setIsDarkMode(newMode === 'dark');
    localStorage.setItem('theme', newMode);
    document.documentElement.setAttribute('data-theme', newMode);
    
    // Trigger storage event for other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: newMode,
    }));
  };

  // Create a simple context value
  const contextValue = React.useMemo(() => ({
    mode,
    toggleTheme,
    setMode: (newMode: 'light' | 'dark') => {
      setMode(newMode);
      setIsDarkMode(newMode === 'dark');
      localStorage.setItem('theme', newMode);
      document.documentElement.setAttribute('data-theme', newMode);
    }
  }), [mode, setIsDarkMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Theme context
const ThemeContext = React.createContext<{
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  setMode: (mode: 'light' | 'dark') => void;
} | undefined>(undefined);

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeRegistry');
  }
  return context;
}
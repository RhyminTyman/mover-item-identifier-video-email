"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
    
    // Load theme from localStorage first (faster)
    const savedTheme = localStorage.getItem('theme');
    console.log('🎨 [THEME] Loading theme from localStorage:', savedTheme);
    
    if (savedTheme === 'dark') {
      console.log('🎨 [THEME] Setting dark mode');
      setIsDarkMode(true);
    } else if (savedTheme === 'light') {
      console.log('🎨 [THEME] Setting light mode');
      setIsDarkMode(false);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('🎨 [THEME] Using system preference:', prefersDark ? 'dark' : 'light');
      setIsDarkMode(prefersDark);
    }

    // Listen for theme changes
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('theme');
      if (currentTheme === 'dark') {
        setIsDarkMode(true);
      } else if (currentTheme === 'light') {
        setIsDarkMode(false);
      }
    };

    window.addEventListener('storage', handleThemeChange);
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#28c2a0',
        light: '#4dd4b3',
        dark: '#1ea085',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#1e40af',
        light: '#3b82f6',
        dark: '#1e3a8a',
        contrastText: '#ffffff',
      },
      background: {
        default: isDarkMode ? '#0f172a' : '#f8fafc',
        paper: isDarkMode ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#f1f5f9' : '#0f172a',
        secondary: isDarkMode ? '#cbd5e1' : '#64748b',
      },
      success: {
        main: '#28c2a0',
        light: '#4dd4b3',
        dark: '#1ea085',
      },
      info: {
        main: '#1e40af',
        light: '#3b82f6',
        dark: '#1e3a8a',
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
            borderRadius: 8,
          },
          contained: {
            boxShadow: '0 2px 4px rgba(40, 194, 160, 0.2)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(40, 194, 160, 0.3)',
            },
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
      MuiChip: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: '#28c2a0',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#1ea085',
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          bar: {
            backgroundColor: '#28c2a0',
          },
        },
      },
    },
  });

  // Provide default light theme for SSR to prevent hydration mismatches
  const defaultTheme = createTheme({
    palette: {
      mode: 'light',
      primary: { 
        main: '#28c2a0',
        light: '#4dd4b3',
        dark: '#1ea085',
        contrastText: '#ffffff',
      },
      secondary: { 
        main: '#1e40af',
        light: '#3b82f6',
        dark: '#1e3a8a',
        contrastText: '#ffffff',
      },
      background: { 
        default: '#f8fafc', 
        paper: '#ffffff' 
      },
      text: {
        primary: '#0f172a',
        secondary: '#64748b',
      },
      success: {
        main: '#28c2a0',
        light: '#4dd4b3',
        dark: '#1ea085',
      },
      info: {
        main: '#1e40af',
        light: '#3b82f6',
        dark: '#1e3a8a',
      },
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
    // Load theme from localStorage
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

  const toggleTheme = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    console.log('🎨 [THEME] Toggling theme from', mode, 'to', newMode);
    setMode(newMode);
    setIsDarkMode(newMode === 'dark');
    
    // Update localStorage
    localStorage.setItem('theme', newMode);
    document.documentElement.setAttribute('data-theme', newMode);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newMode);
    
    // Trigger custom event for theme change
    window.dispatchEvent(new CustomEvent('themeChanged'));
  }, [mode, setIsDarkMode]);

  // Create a simple context value
  const contextValue = React.useMemo(() => ({
    mode,
    toggleTheme,
    setMode: (newMode: 'light' | 'dark') => {
      setMode(newMode);
      setIsDarkMode(newMode === 'dark');
      
      // Update localStorage
      localStorage.setItem('theme', newMode);
      document.documentElement.setAttribute('data-theme', newMode);
      
      // Trigger custom event for theme change
      window.dispatchEvent(new CustomEvent('themeChanged'));
    }
  }), [mode, setIsDarkMode, toggleTheme]);

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
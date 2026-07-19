/**
 * SIMS — Theme Context
 * Dark/Light mode toggle persisted to localStorage.
 * Theme customized per user request: Blue/Cyan.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext(null);

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB', light: '#60A5FA', dark: '#1E40AF' },
    secondary: { main: '#1E40AF' },
    info: { main: '#06B6D4' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    text: { primary: '#1E293B', secondary: '#64748B' },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, padding: '8px 20px' },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
          boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
          '&:hover': { boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', borderRadius: 16 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB' },
    secondary: { main: '#60A5FA' },
    info: { main: '#22D3EE' },
    background: { default: '#0F172A', paper: '#1E293B' },
    success: { main: '#34D399' },
    warning: { main: '#FBBF24' },
    error: { main: '#F87171' },
    text: { primary: '#F8FAFC', secondary: '#CBD5E1' },
    divider: '#334155',
  },
  typography: lightTheme.typography,
  shape: lightTheme.shape,
  components: {
    ...lightTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
        },
      },
    },
  },
});

export function ThemeContextProvider({ children }) {
  // Always force light mode
  const mode = 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('themeMode', 'light');
  }, []);

  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={lightTheme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within ThemeContextProvider');
  return context;
}

export default ThemeContext;

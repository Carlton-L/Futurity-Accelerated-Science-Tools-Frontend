import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize with a function to avoid hydration issues
  const [isDark, setIsDark] = useState(() => {
    // Check for saved color mode preference or default to dark
    const savedMode = localStorage.getItem('color-mode');
    return savedMode === 'light' ? false : true; // default to dark
  });

  const updateColorMode = (dark: boolean) => {
    const root = document.documentElement;

    // Remove existing classes first
    root.classList.remove('light', 'dark');

    if (dark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }

    // Set the color scheme for the browser
    root.style.colorScheme = dark ? 'dark' : 'light';

    // Force a repaint to ensure styles are applied
    root.style.display = 'none';
    root.offsetHeight; // Trigger reflow
    root.style.display = '';
  };

  // Apply theme immediately on mount and whenever isDark changes
  useEffect(() => {
    updateColorMode(isDark);
  }, [isDark]);

  // Also apply theme on first render to ensure it's set correctly
  useEffect(() => {
    // Apply the theme immediately on mount
    updateColorMode(isDark);

    // Also check if the saved preference matches current state
    const savedMode = localStorage.getItem('color-mode');
    const expectedDark = savedMode === 'light' ? false : true;

    if (expectedDark !== isDark) {
      setIsDark(expectedDark);
    }
  }, []);

  const toggleColorMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem('color-mode', newMode ? 'dark' : 'light');
    updateColorMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;

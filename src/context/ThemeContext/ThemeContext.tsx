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
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check for saved color mode preference or default to dark
    const savedMode = localStorage.getItem('color-mode');
    const prefersDark = savedMode === 'dark' || (!savedMode && true); // default to dark

    setIsDark(prefersDark);
    updateColorMode(prefersDark);
  }, []);

  const updateColorMode = (dark: boolean) => {
    const root = document.documentElement;

    // Update both old and new systems for compatibility
    if (dark) {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  };

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

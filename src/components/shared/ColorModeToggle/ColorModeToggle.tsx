import { IconButton } from '@chakra-ui/react';
import { LuSun, LuMoon } from 'react-icons/lu';
import { useState, useEffect } from 'react';

const ColorModeToggle = () => {
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
    if (dark) {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  };

  const toggleColorMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem('color-mode', newMode ? 'dark' : 'light');
    updateColorMode(newMode);
  };

  return (
    <IconButton
      aria-label='Toggle color mode'
      onClick={toggleColorMode}
      variant='ghost'
      size='md'
      color='fg'
    >
      {isDark ? <LuSun size={20} /> : <LuMoon size={20} />}
    </IconButton>
  );
};

export default ColorModeToggle;

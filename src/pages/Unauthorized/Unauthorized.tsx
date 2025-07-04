import { useEffect, useState } from 'react';
import WarningHypercube from './WarningHypercube';

const Unauthorized = () => {
  // Detect theme from localStorage or system preference
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('color-mode');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    // Fall back to system preference
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    return 'light';
  });

  // Track viewport dimensions for responsive text positioning
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('color-mode');
      if (newTheme === 'dark' || newTheme === 'light') {
        setTheme(newTheme);
      }
    };

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if no theme is saved in localStorage
      if (!localStorage.getItem('color-mode')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };

    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Listen for viewport changes
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Using your exact theme color tokens
  const backgroundColor = theme === 'dark' ? '#111111' : '#FAFAFA'; // bg.app
  const textColor = theme === 'dark' ? '#FFFFFF' : '#1B1B1D'; // text.primary
  const subtextColor = theme === 'dark' ? '#A7ACB2' : '#646E78'; // text.secondary

  // Calculate if viewport is too small for the SVG (800px for this component)
  const isViewportTooSmall = viewportWidth < 800 || viewportHeight < 600;

  // Dynamic text positioning based on viewport size
  const textBottomPosition = isViewportTooSmall
    ? Math.max(20, viewportHeight * 0.15) // Move text up when viewport is small
    : 40; // Default bottom position

  return (
    <div
      style={{
        backgroundColor,
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Container with max width constraint */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: '100vh', // Set max width to 100vh
          margin: '0 auto', // Center the container
          overflow: 'hidden',
        }}
      >
        {/* SVG Container - can overflow boundaries */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        >
          <WarningHypercube theme={theme} size={800} />
        </div>

        {/* Text Card - absolutely positioned at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: `${textBottomPosition}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 10,
            width: '90%',
            maxWidth: '600px',
            padding: '20px 24px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            backgroundColor:
              theme === 'dark'
                ? 'rgba(26, 26, 26, 0.2)' // bg.canvas.dark with opacity
                : 'rgba(255, 255, 255, 0.2)', // bg.canvas.light with opacity
            border: `1px solid ${
              theme === 'dark'
                ? 'rgba(255, 255, 255, 0.1)' // border.primary.dark with opacity
                : 'rgba(0, 0, 0, 0.1)' // border.primary.light with opacity
            }`,
          }}
        >
          <h2
            style={{
              color: textColor,
              fontFamily:
                "'TT Norms Pro Normal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
              margin: '0 0 10px 0',
              fontSize: isViewportTooSmall ? '20px' : '24px',
              fontWeight: 'normal',
              lineHeight: 1.2,
            }}
          >
            401 - Unauthorized
          </h2>
          <p
            style={{
              color: subtextColor,
              fontFamily:
                "'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: isViewportTooSmall ? '14px' : '16px',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            You do not have permission to access this resource.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

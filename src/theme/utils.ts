// Utility functions for working with your theme colors

export const techMaturityColors = [
  '#E07B91', // mature
  '#E69500', // established
  '#F2CD5D', // developing
  '#C3DE6D', // growing
  '#7CCBA2', // advancing
  '#46ACC8', // progressing
  '#3366FF', // innovative
  '#6A35D4', // emerging
] as const;

export const docTypeColors = {
  org: '#E07B91',
  press: '#E69500',
  website: '#F2CD5D',
  patent: '#C3DE6D',
  paper: '#7CCBA2',
  book: '#46ACC8',
  challenge: '#3366FF',
  scifi: '#6A35D4',
} as const;

export const heatmapColors = [
  '#58006B', // 1 - lowest
  '#4200AC', // 2
  '#0005E9', // 3 - your brand color
  '#1A3AEE', // 4
  '#3369F2', // 5
  '#4D94F6', // 6
  '#88B8F9', // 7
  '#80D7FB', // 8
  '#99EEFD', // 9
  '#B3FEFF', // 10 - highest
] as const;

// Helper to get color by tech maturity level (0-7)
export const getTechMaturityColor = (level: number): string => {
  return techMaturityColors[Math.max(0, Math.min(7, level))];
};

// Helper to get color by document type
export const getDocTypeColor = (type: keyof typeof docTypeColors): string => {
  return docTypeColors[type];
};

// Helper to get heatmap color by intensity (1-10)
export const getHeatmapColor = (intensity: number): string => {
  return heatmapColors[Math.max(0, Math.min(9, intensity - 1))];
};

// Brand gradient CSS
export const brandGradient =
  'linear-gradient(135deg, #8285FF, #0005E9, #000383)';

// Glassmorphism utility classes
export const glassStyles = {
  dark: {
    background: 'rgba(26, 26, 26, 0.5)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  light: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  },
};

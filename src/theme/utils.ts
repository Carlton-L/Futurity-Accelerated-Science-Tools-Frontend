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

// FS Colors array for easy iteration
export const fsColors = [
  '#E07B91', // fs_color_1
  '#E69500', // fs_color_2
  '#F2CD5D', // fs_color_3
  '#C3DE6D', // fs_color_4
  '#7CCBA2', // fs_color_5
  '#46ACC8', // fs_color_6
  '#3366FF', // fs_color_7
  '#6A35D4', // fs_color_8
] as const;

// Metric colors for the three indices
export const metricColors = {
  horizonRank: '#D4AF37', // Rich gold - maturity
  whiteSpace: '#20B2AA', // Teal - open space
  techTransfer: '#FF6B47', // Coral - energy/movement
} as const;

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

// Helper to get FS color by index (1-8)
export const getFsColor = (index: number): string => {
  return fsColors[Math.max(0, Math.min(7, index - 1))];
};

// Helper to get metric color by type
export const getMetricColor = (metric: keyof typeof metricColors): string => {
  return metricColors[metric];
};

// Helper to get FS color with opacity
export const getFsColorWithOpacity = (
  index: number,
  opacity: number = 0.5
): string => {
  const color = getFsColor(index);
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper to get status color with opacity
export const getStatusColorWithOpacity = (
  color: string,
  opacity: number = 0.2
): string => {
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Brand gradient CSS
export const brandGradient =
  'linear-gradient(135deg, #8285FF, #0005E9, #000383)';

// Glassmorphism utility classes - updated to use semantic tokens
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

// Theme-aware color utilities
export const getThemeAwareColor = (
  lightColor: string,
  darkColor: string,
  isDark: boolean
): string => {
  return isDark ? darkColor : lightColor;
};

// Generate color scale for data visualization
export const generateColorScale = (
  baseColor: string,
  steps: number = 5
): string[] => {
  // This is a simple implementation - for production you might want to use a library like chroma-js
  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    const opacity = 0.2 + (0.8 * i) / (steps - 1);
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    colors.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
  }
  return colors;
};

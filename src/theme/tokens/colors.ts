import { defineTokens } from '@chakra-ui/react';

const colors = defineTokens.colors({
  // Core brand colors
  brand: {
    50: { value: '#f0f4ff' },
    100: { value: '#e0eaff' },
    200: { value: '#c7d7fe' },
    300: { value: '#a5bcfc' },
    400: { value: '#8285FF' },
    500: { value: '#0005E9' },
    600: { value: '#000383' },
    700: { value: '#000266' },
    800: { value: '#00024d' },
    900: { value: '#000133' },
  },

  // Secondary color system
  secondary: {
    50: { value: '#fef2ff' },
    100: { value: '#fce7ff' },
    200: { value: '#f9d0fe' },
    300: { value: '#f5a9fc' },
    400: { value: '#FF53FE' }, // Lighter secondary
    500: { value: '#E60FE5' }, // Main secondary
    600: { value: '#960096' }, // Darker secondary
    700: { value: '#7a007a' },
    800: { value: '#5c005c' },
    900: { value: '#3d003d' },
  },

  // Background colors
  background: {
    app: {
      light: { value: '#FAFAFA' },
      dark: { value: '#111111' },
    },
    card: {
      light: { value: '#FFFFFF' },
      dark: { value: '#1a1a1a' },
    },
  },

  // Text colors - updated with your exact specs
  text: {
    primary: {
      light: { value: '#1B1B1D' }, // Your specified light mode text
      dark: { value: '#FFFFFF' }, // Your specified dark mode text
    },
    secondary: {
      light: { value: '#646E78' }, // Dark Grey in light mode
      dark: { value: '#A7ACB2' }, // Light Grey in dark mode
    },
    muted: {
      light: { value: '#A7ACB2' }, // Light Grey in light mode
      dark: { value: '#646E78' }, // Dark Grey in dark mode (swapped)
    },
  },

  // Border colors - your exact specs
  border: {
    primary: {
      light: { value: '#111111' }, // Dark border in light mode
      dark: { value: '#FFFFFF' }, // White border in dark mode
    },
    secondary: {
      light: { value: '#E0E0E0' },
      dark: { value: '#333333' },
    },
    muted: {
      light: { value: '#F0F0F0' },
      dark: { value: '#2A2A2A' },
    },
    emphasized: {
      light: { value: '#111111' },
      dark: { value: '#FFFFFF' },
    },
  },

  // Subtle grays for better contrast
  gray: {
    light: {
      50: { value: '#F8F8F8' }, // Lighter than card bg
      100: { value: '#F0F0F0' },
      200: { value: '#E8E8E8' },
      300: { value: '#D0D0D0' },
      400: { value: '#A0A0A0' },
      500: { value: '#808080' },
      600: { value: '#606060' },
      700: { value: '#404040' },
      800: { value: '#202020' },
      900: { value: '#101010' },
    },
    dark: {
      50: { value: '#404040' }, // Lighter than card bg in dark mode
      100: { value: '#383838' },
      200: { value: '#303030' },
      300: { value: '#282828' },
      400: { value: '#202020' },
      500: { value: '#1a1a1a' }, // Your card bg
      600: { value: '#151515' },
      700: { value: '#111111' }, // Your app bg
      800: { value: '#0d0d0d' },
      900: { value: '#080808' },
    },
  },

  // Status colors with your exact specs
  status: {
    success: {
      light: { value: '#3DB462' },
      dark: { value: '#5EFF8F' },
    },
    error: {
      light: { value: '#FF4D53' },
      dark: { value: '#FF6860' },
    },
    // Keep existing warning and info from your current setup
    warning: { value: '#F2CD5D' },
    info: { value: '#46ACC8' },
  },

  // FS Colors
  fs: {
    color1: { value: '#E07B91' }, // Light pink
    color2: { value: '#E69500' }, // Orange
    color3: { value: '#F2CD5D' }, // Light yellow
    color4: { value: '#C3DE6D' }, // Light green
    color5: { value: '#7CCBA2' }, // Medium green
    color6: { value: '#46ACC8' }, // Blue
    color7: { value: '#3366FF' }, // Dark blue
    color8: { value: '#6A35D4' }, // Purple
  },

  // FS Colors contrast text
  fsContrast: {
    color1: { value: '#FFFFFF' }, // White text for light pink
    color2: { value: '#FFFFFF' }, // White text for orange
    color3: { value: '#1B1B1D' }, // Dark text for light yellow
    color4: { value: '#1B1B1D' }, // Dark text for light green
    color5: { value: '#1B1B1D' }, // Dark text for medium green
    color6: { value: '#FFFFFF' }, // White text for blue
    color7: { value: '#FFFFFF' }, // White text for dark blue
    color8: { value: '#FFFFFF' }, // White text for purple
  },

  // Metric colors for your three indices
  horizonRank: {
    primary: { value: '#D4AF37' }, // Rich gold - suggests established, mature technology
    light: { value: '#F4E4A6' },
    dark: { value: '#B8941F' },
    contrast: { value: '#1B1B1D' },
  },

  whiteSpace: {
    primary: { value: '#20B2AA' }, // Light Sea Green - suggests open space, breathing room
    light: { value: '#7FDBDA' },
    dark: { value: '#177B75' },
    contrast: { value: '#FFFFFF' },
  },

  techTransfer: {
    primary: { value: '#FF6B47' }, // Vibrant coral - suggests energy, movement, transformation
    light: { value: '#FFA58F' },
    dark: { value: '#E04A2A' },
    contrast: { value: '#FFFFFF' },
  },

  // Glassmorphism and overlay colors
  glass: {
    light: { value: 'rgba(255, 255, 255, 0.8)' },
    dark: { value: 'rgba(26, 26, 26, 0.5)' },
  },

  // Tech maturity palette (mature → emerging) - keeping your existing setup
  techMaturity: {
    mature: { value: '#E07B91' }, // Most mature
    established: { value: '#E69500' },
    developing: { value: '#F2CD5D' },
    growing: { value: '#C3DE6D' },
    advancing: { value: '#7CCBA2' },
    progressing: { value: '#46ACC8' },
    innovative: { value: '#3366FF' },
    emerging: { value: '#6A35D4' }, // Least mature/most emerging
  },

  // Document type colors - keeping your existing setup
  docType: {
    org: { value: '#E07B91' }, // Org/Investment
    press: { value: '#E69500' }, // Press
    website: { value: '#F2CD5D' }, // Website
    patent: { value: '#C3DE6D' }, // Patent
    paper: { value: '#7CCBA2' }, // Paper
    book: { value: '#46ACC8' }, // Book
    challenge: { value: '#3366FF' }, // Imagination (challenge/prediction)
    scifi: { value: '#6A35D4' }, // Imagination (scifi etc)
  },

  // Monochrome analysis palette - keeping your existing setup
  analysis: {
    heatmap: {
      1: { value: '#58006B' }, // Lowest
      2: { value: '#4200AC' },
      3: { value: '#0005E9' }, // Your brand color
      4: { value: '#1A3AEE' },
      5: { value: '#3369F2' },
      6: { value: '#4D94F6' },
      7: { value: '#88B8F9' },
      8: { value: '#80D7FB' },
      9: { value: '#99EEFD' },
      10: { value: '#B3FEFF' }, // Highest
    },
  },

  // Brand gradient colors for special emphasis
  gradient: {
    brand: {
      from: { value: '#8285FF' },
      via: { value: '#0005E9' },
      to: { value: '#000383' },
    },
  },

  // Opacity variants for FS colors (50% as requested)
  fsOpacity: {
    color1: { value: 'rgba(224, 123, 145, 0.5)' }, // #E07B91 at 50%
    color2: { value: 'rgba(230, 149, 0, 0.5)' }, // #E69500 at 50%
    color3: { value: 'rgba(242, 205, 93, 0.5)' }, // #F2CD5D at 50%
    color4: { value: 'rgba(195, 222, 109, 0.5)' }, // #C3DE6D at 50%
    color5: { value: 'rgba(124, 203, 162, 0.5)' }, // #7CCBA2 at 50%
    color6: { value: 'rgba(70, 172, 200, 0.5)' }, // #46ACC8 at 50%
    color7: { value: 'rgba(51, 102, 255, 0.5)' }, // #3366FF at 50%
    color8: { value: 'rgba(106, 53, 212, 0.5)' }, // #6A35D4 at 50%
  },

  // Status opacity variants (20% as requested)
  statusOpacity: {
    success: {
      light: { value: 'rgba(61, 180, 98, 0.2)' }, // #3DB462 at 20%
      dark: { value: 'rgba(94, 255, 143, 0.2)' }, // #5EFF8F at 20%
    },
    error: {
      light: { value: 'rgba(255, 77, 83, 0.2)' }, // #FF4D53 at 20%
      dark: { value: 'rgba(255, 104, 96, 0.2)' }, // #FF6860 at 20%
    },
  },
});

export default colors;

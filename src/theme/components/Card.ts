import { defineTokens } from '@chakra-ui/react';

const colors = defineTokens.colors({
  // Brand colors with your gradient
  brand: {
    light: { value: '#8285FF' }, // Lighter brand
    DEFAULT: { value: '#0005E9' }, // Main brand
    dark: { value: '#000383' }, // Darker brand
    50: { value: '#f0f4ff' },
    100: { value: '#e0eaff' },
    200: { value: '#c7d7fe' },
    300: { value: '#a5bcfc' },
    400: { value: '#8285FF' }, // Your light brand
    500: { value: '#0005E9' }, // Your main brand
    600: { value: '#000383' }, // Your dark brand
    700: { value: '#000266' },
    800: { value: '#00024d' },
    900: { value: '#000133' },
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

  // Text colors
  text: {
    primary: {
      light: { value: '#000000' },
      dark: { value: '#FFFFFF' },
    },
    secondary: {
      light: { value: '#666666' },
      dark: { value: '#A0A0A0' },
    },
    muted: {
      light: { value: '#888888' },
      dark: { value: '#707070' },
    },
  },

  // Border colors
  border: {
    primary: {
      light: { value: '#000000' },
      dark: { value: '#FFFFFF' },
    },
    secondary: {
      light: { value: '#E0E0E0' },
      dark: { value: '#333333' },
    },
    muted: {
      light: { value: '#F0F0F0' },
      dark: { value: '#2A2A2A' },
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

  // Glassmorphism surfaces
  glass: {
    light: { value: 'rgba(255, 255, 255, 0.8)' },
    dark: { value: 'rgba(26, 26, 26, 0.5)' },
  },

  // Tech maturity palette (mature → emerging)
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

  // Document type colors
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

  // Monochrome analysis palette (low → high intensity)
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

  // Status colors (using complementary tones)
  status: {
    success: { value: '#7CCBA2' }, // Using your paper color - feels natural/positive
    warning: { value: '#F2CD5D' }, // Using your website color - attention but not alarming
    error: { value: '#E07B91' }, // Using your org color - warm but serious
    info: { value: '#46ACC8' }, // Using your book color - trustworthy information
  },

  // Brand gradient colors for special emphasis
  gradient: {
    brand: {
      from: { value: '#8285FF' },
      via: { value: '#0005E9' },
      to: { value: '#000383' },
    },
  },
});

export default colors;

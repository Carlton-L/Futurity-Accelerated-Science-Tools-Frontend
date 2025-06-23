import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import Button from './components/Button';
import Card from './components/Card';
import colors from './tokens/colors';
import fonts from './tokens/fonts';

const config = defineConfig({
  theme: {
    recipes: {
      button: Button,
      card: Card,
    },
    breakpoints: {
      base: '0px',
      sm: '560px',
      md: '1024px',
      lg: '1460px',
    },
    tokens: {
      colors,
      fonts,
    },
    semanticTokens: {
      colors: {
        // Core semantic tokens
        bg: {
          DEFAULT: {
            value: {
              _dark: '{colors.background.app.dark}',
              _light: '{colors.background.app.light}',
            },
          },
          canvas: {
            value: {
              _dark: '{colors.background.card.dark}',
              _light: '{colors.background.card.light}',
            },
          },
          subtle: {
            value: {
              _dark: 'rgba(26, 26, 26, 0.6)', // Subtle overlay in dark mode
              _light: 'rgba(250, 250, 250, 0.6)', // Subtle overlay in light mode
            },
          },
          muted: {
            value: {
              _dark: 'rgba(26, 26, 26, 0.8)', // More prominent overlay in dark mode
              _light: 'rgba(255, 255, 255, 0.8)', // More prominent overlay in light mode
            },
          },
          // Interactive background states
          hover: {
            value: {
              _dark: '#2a2a2a', // Slightly lighter than card background in dark mode
              _light: '#eeeeee', // Slightly darker than card background in light mode
            },
          },
          active: {
            value: {
              _dark: '#333333', // Even lighter for active states in dark mode
              _light: '#e0e0e0', // Even darker for active states in light mode
            },
          },
        },

        fg: {
          DEFAULT: {
            value: {
              _dark: '{colors.text.primary.dark}',
              _light: '{colors.text.primary.light}',
            },
          },
          secondary: {
            value: {
              _dark: '{colors.text.secondary.dark}',
              _light: '{colors.text.secondary.light}',
            },
          },
          muted: {
            value: {
              _dark: '{colors.text.muted.dark}',
              _light: '{colors.text.muted.light}',
            },
          },
          // Interactive text states
          hover: {
            value: {
              _dark: '{colors.brand.400}', // Lighter brand color on hover
              _light: '{colors.brand.600}', // Darker brand color on hover in light mode
            },
          },
          link: {
            value: {
              _dark: '{colors.brand.400}',
              _light: '{colors.brand.500}',
            },
          },
          // Status text colors
          success: {
            value: {
              _dark: '{colors.status.success.dark}',
              _light: '{colors.status.success.light}',
            },
          },
          error: {
            value: {
              _dark: '{colors.status.error.dark}',
              _light: '{colors.status.error.light}',
            },
          },
        },

        border: {
          DEFAULT: {
            value: {
              _dark: '{colors.border.secondary.dark}',
              _light: '{colors.border.secondary.light}',
            },
          },
          emphasized: {
            value: {
              _dark: '{colors.border.primary.dark}', // White in dark mode
              _light: '{colors.border.primary.light}', // #111111 in light mode
            },
          },
          muted: {
            value: {
              _dark: '{colors.border.muted.dark}',
              _light: '{colors.border.muted.light}',
            },
          },
          // Interactive border states
          hover: {
            value: {
              _dark: '{colors.brand.400}',
              _light: '{colors.brand.500}',
            },
          },
          focus: {
            value: {
              _dark: '{colors.brand.400}',
              _light: '{colors.brand.500}',
            },
          },
        },

        // Brand semantic tokens with interaction states
        brand: {
          DEFAULT: { value: '{colors.brand.500}' },
          hover: {
            value: {
              _dark: '{colors.brand.400}', // Lighter on hover in dark mode
              _light: '{colors.brand.600}', // Darker on hover in light mode
            },
          },
          active: {
            value: {
              _dark: '{colors.brand.300}', // Even lighter when active in dark mode
              _light: '{colors.brand.700}', // Even darker when active in light mode
            },
          },
          subtle: { value: '{colors.brand.400}' },
          contrast: { value: '#FFFFFF' }, // Always white text on brand colors
          400: { value: '{colors.brand.400}' },
          500: { value: '{colors.brand.500}' },
          600: { value: '{colors.brand.600}' },
        },

        // Secondary brand semantic tokens
        secondary: {
          DEFAULT: { value: '{colors.secondary.500}' },
          hover: {
            value: {
              _dark: '{colors.secondary.400}',
              _light: '{colors.secondary.600}',
            },
          },
          active: {
            value: {
              _dark: '{colors.secondary.300}',
              _light: '{colors.secondary.700}',
            },
          },
          contrast: { value: '#FFFFFF' },
        },

        // Status semantic tokens with opacity variants
        success: {
          value: {
            _dark: '{colors.status.success.dark}',
            _light: '{colors.status.success.light}',
          },
        },
        successSubtle: {
          value: {
            _dark: '{colors.statusOpacity.success.dark}',
            _light: '{colors.statusOpacity.success.light}',
          },
        },
        error: {
          value: {
            _dark: '{colors.status.error.dark}',
            _light: '{colors.status.error.light}',
          },
        },
        errorSubtle: {
          value: {
            _dark: '{colors.statusOpacity.error.dark}',
            _light: '{colors.statusOpacity.error.light}',
          },
        },
        // Keep existing warning and info
        warning: { value: '{colors.status.warning}' },
        info: { value: '{colors.status.info}' },

        // Metric colors for your three indices
        horizonRank: { value: '{colors.horizonRank.primary}' },
        horizonRankContrast: { value: '{colors.horizonRank.contrast}' },
        whiteSpace: { value: '{colors.whiteSpace.primary}' },
        whiteSpaceContrast: { value: '{colors.whiteSpace.contrast}' },
        techTransfer: { value: '{colors.techTransfer.primary}' },
        techTransferContrast: { value: '{colors.techTransfer.contrast}' },

        // FS colors as semantic tokens
        fsColor1: { value: '{colors.fs.color1}' },
        fsColor1Contrast: { value: '{colors.fsContrast.color1}' },
        fsColor1Subtle: { value: '{colors.fsOpacity.color1}' },

        fsColor2: { value: '{colors.fs.color2}' },
        fsColor2Contrast: { value: '{colors.fsContrast.color2}' },
        fsColor2Subtle: { value: '{colors.fsOpacity.color2}' },

        fsColor3: { value: '{colors.fs.color3}' },
        fsColor3Contrast: { value: '{colors.fsContrast.color3}' },
        fsColor3Subtle: { value: '{colors.fsOpacity.color3}' },

        fsColor4: { value: '{colors.fs.color4}' },
        fsColor4Contrast: { value: '{colors.fsContrast.color4}' },
        fsColor4Subtle: { value: '{colors.fsOpacity.color4}' },

        fsColor5: { value: '{colors.fs.color5}' },
        fsColor5Contrast: { value: '{colors.fsContrast.color5}' },
        fsColor5Subtle: { value: '{colors.fsOpacity.color5}' },

        fsColor6: { value: '{colors.fs.color6}' },
        fsColor6Contrast: { value: '{colors.fsContrast.color6}' },
        fsColor6Subtle: { value: '{colors.fsOpacity.color6}' },

        fsColor7: { value: '{colors.fs.color7}' },
        fsColor7Contrast: { value: '{colors.fsContrast.color7}' },
        fsColor7Subtle: { value: '{colors.fsOpacity.color7}' },

        fsColor8: { value: '{colors.fs.color8}' },
        fsColor8Contrast: { value: '{colors.fsContrast.color8}' },
        fsColor8Subtle: { value: '{colors.fsOpacity.color8}' },

        // Glass effect
        glass: {
          value: {
            _dark: '{colors.glass.dark}',
            _light: '{colors.glass.light}',
          },
        },
      },
    },
    keyframes: {
      spin: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
      fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      slideUp: {
        from: { transform: 'translateY(10px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
      },
    },
  },
  globalCss: {
    html: {
      bg: 'bg',
      color: 'fg',
      minHeight: '100vh',
    },
    body: {
      bg: 'bg',
      color: 'fg',
      minHeight: '100vh',
      fontFamily: 'body', // JetBrains Mono
      transition: 'background-color 0.2s, color 0.2s',
    },
    // Ensure glassmorphism works properly
    '.glass': {
      bg: 'glass',
      backdropFilter: 'blur(10px)',
      border: '1px solid',
      borderColor: 'border.emphasized',
    },
    // Support both systems for theme switching
    ':root': {
      colorScheme: 'dark',
    },
    ':root[data-theme="light"]': {
      colorScheme: 'light',
    },
    // Fallback for class-based system
    '.light': {
      colorScheme: 'light',
    },
    '.dark': {
      colorScheme: 'dark',
    },
  },
});

export const theme = createSystem(defaultConfig, config);

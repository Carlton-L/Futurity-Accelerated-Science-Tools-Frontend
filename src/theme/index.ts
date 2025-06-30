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
              _light: '{colors.background.app.light}',
              _dark: '{colors.background.app.dark}',
            },
          },
          canvas: {
            value: {
              _light: '{colors.background.card.light}',
              _dark: '{colors.background.card.dark}',
            },
          },
          subtle: {
            value: {
              _light: 'rgba(250, 250, 250, 0.6)', // Subtle overlay in light mode
              _dark: 'rgba(26, 26, 26, 0.6)', // Subtle overlay in dark mode
            },
          },
          muted: {
            value: {
              _light: 'rgba(255, 255, 255, 0.8)', // More prominent overlay in light mode
              _dark: 'rgba(26, 26, 26, 0.8)', // More prominent overlay in dark mode
            },
          },
          // Interactive background states
          hover: {
            value: {
              _light: '#f5f5f5', // Slightly darker than card background in light mode
              _dark: '#2a2a2a', // Slightly lighter than card background in dark mode
            },
          },
          active: {
            value: {
              _light: '#e0e0e0', // Even darker for active states in light mode
              _dark: '#333333', // Even lighter for active states in dark mode
            },
          },
        },

        fg: {
          DEFAULT: {
            value: {
              _light: '{colors.text.primary.light}',
              _dark: '{colors.text.primary.dark}',
            },
          },
          secondary: {
            value: {
              _light: '{colors.text.secondary.light}',
              _dark: '{colors.text.secondary.dark}',
            },
          },
          muted: {
            value: {
              _light: '{colors.text.muted.light}',
              _dark: '{colors.text.muted.dark}',
            },
          },
          // Interactive text states
          hover: {
            value: {
              _light: '{colors.brand.600}', // Darker brand color on hover in light mode
              _dark: '{colors.brand.400}', // Lighter brand color on hover
            },
          },
          link: {
            value: {
              _light: '{colors.brand.500}',
              _dark: '{colors.brand.400}',
            },
          },
          // Status text colors
          success: {
            value: {
              _light: '{colors.status.success.light}',
              _dark: '{colors.status.success.dark}',
            },
          },
          error: {
            value: {
              _light: '{colors.status.error.light}',
              _dark: '{colors.status.error.dark}',
            },
          },
        },

        border: {
          DEFAULT: {
            value: {
              _light: '{colors.border.primary.light}', // #111111 - CHANGED from secondary to primary
              _dark: '{colors.border.primary.dark}', // #FFFFFF - CHANGED from secondary to primary
            },
          },
          emphasized: {
            value: {
              _light: '{colors.border.primary.light}',
              _dark: '{colors.border.primary.dark}',
            },
          },
          muted: {
            value: {
              _light: '{colors.border.secondary.light}', // Keep the gray borders as "muted"
              _dark: '{colors.border.secondary.dark}',
            },
          },
          // Interactive border states
          hover: {
            value: {
              _light: '{colors.brand.500}',
              _dark: '{colors.brand.400}',
            },
          },
          focus: {
            value: {
              _light: '{colors.brand.500}',
              _dark: '{colors.brand.400}',
            },
          },
        },

        // Brand semantic tokens with interaction states
        brand: {
          DEFAULT: { value: '{colors.brand.500}' },
          hover: {
            value: {
              _light: '{colors.brand.600}', // Darker on hover in light mode
              _dark: '{colors.brand.400}', // Lighter on hover in dark mode
            },
          },
          active: {
            value: {
              _light: '{colors.brand.700}', // Even darker when active in light mode
              _dark: '{colors.brand.300}', // Even lighter when active in dark mode
            },
          },
          subtle: { value: '{colors.brand.400}' },
          contrast: { value: '#FFFFFF' }, // Always white text on brand colors
        },

        // Secondary brand semantic tokens
        secondary: {
          DEFAULT: { value: '{colors.secondary.500}' },
          hover: {
            value: {
              _light: '{colors.secondary.600}',
              _dark: '{colors.secondary.400}',
            },
          },
          active: {
            value: {
              _light: '{colors.secondary.700}',
              _dark: '{colors.secondary.300}',
            },
          },
          contrast: { value: '#FFFFFF' },
        },

        // Status semantic tokens with opacity variants
        success: {
          value: {
            _light: '{colors.status.success.light}',
            _dark: '{colors.status.success.dark}',
          },
        },
        successSubtle: {
          value: {
            _light: '{colors.statusOpacity.success.light}',
            _dark: '{colors.statusOpacity.success.dark}',
          },
        },
        error: {
          value: {
            _light: '{colors.status.error.light}',
            _dark: '{colors.status.error.dark}',
          },
        },
        errorSubtle: {
          value: {
            _light: '{colors.statusOpacity.error.light}',
            _dark: '{colors.statusOpacity.error.dark}',
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
            _light: '{colors.glass.light}',
            _dark: '{colors.glass.dark}',
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
  },
  conditions: {
    light: '[data-theme=light] &, .light &',
    dark: '[data-theme=dark] &, .dark &',
  },
});

export const theme = createSystem(defaultConfig, config);

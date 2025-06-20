import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import Button from './components/Button';
import colors from './tokens/colors';
import fonts from './tokens/fonts';

const config = defineConfig({
  theme: {
    recipes: {
      button: Button,
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
              base: '{colors.background.app.dark}',
              _light: '{colors.background.app.light}',
            },
          },
          canvas: {
            value: {
              base: '{colors.background.card.dark}',
              _light: '{colors.background.card.light}',
            },
          },
          subtle: {
            value: {
              base: '{colors.gray.dark.100}',
              _light: '{colors.gray.light.100}',
            },
          },
          muted: {
            value: {
              base: '{colors.gray.dark.200}',
              _light: '{colors.gray.light.200}',
            },
          },
        },
        fg: {
          DEFAULT: {
            value: {
              base: '{colors.text.primary.dark}',
              _light: '{colors.text.primary.light}',
            },
          },
          muted: {
            value: {
              base: '{colors.text.secondary.dark}',
              _light: '{colors.text.secondary.light}',
            },
          },
          subtle: {
            value: {
              base: '{colors.text.muted.dark}',
              _light: '{colors.text.muted.light}',
            },
          },
        },
        border: {
          DEFAULT: {
            value: {
              base: '{colors.border.secondary.dark}',
              _light: '{colors.border.secondary.light}',
            },
          },
          emphasized: {
            value: {
              base: '{colors.border.primary.dark}',
              _light: '{colors.border.primary.light}',
            },
          },
          muted: {
            value: {
              base: '{colors.border.muted.dark}',
              _light: '{colors.border.muted.light}',
            },
          },
        },
        // Brand semantic tokens
        brand: {
          DEFAULT: { value: '{colors.brand.500}' },
          emphasized: { value: '{colors.brand.600}' },
          subtle: { value: '{colors.brand.400}' },
        },
        // Status semantic tokens
        success: { value: '{colors.status.success}' },
        warning: { value: '{colors.status.warning}' },
        error: { value: '{colors.status.error}' },
        info: { value: '{colors.status.info}' },
        // Glass effect
        glass: {
          value: {
            base: '{colors.glass.dark}',
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
    // Dark mode by default
    ':root': {
      colorScheme: 'dark',
    },
    ':root.light': {
      colorScheme: 'light',
    },
  },
});

export const theme = createSystem(defaultConfig, config);

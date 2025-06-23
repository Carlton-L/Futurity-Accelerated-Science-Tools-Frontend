import { defineRecipe } from '@chakra-ui/react';

const Button = defineRecipe({
  base: {
    fontFamily: 'heading', // TT Norms Pro
    fontWeight: 'normal',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    _disabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      pointerEvents: 'auto', // Ensure the not-allowed cursor shows
      // Make disabled state look "selected" for your whiteboard use case
      bg: {
        _light: '#e0e0e0', // Light gray in light mode
        _dark: '#404040', // Medium gray in dark mode
      },
      color: {
        _light: '#666666', // Dark gray text in light mode
        _dark: '#cccccc', // Light gray text in dark mode
      },
      borderColor: {
        _light: '#d0d0d0', // Light gray border in light mode
        _dark: '#555555', // Medium gray border in dark mode
      },
    },
  },
  variants: {
    variant: {
      solid: {
        bg: 'brand',
        color: 'brand.contrast',
        borderColor: 'brand',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          bg: 'brand.hover',
          borderColor: 'brand.hover',
          _disabled: { bg: 'brand', borderColor: 'brand' },
        },
        _active: {
          bg: 'brand.active',
          borderColor: 'brand.active',
        },
      },
      outline: {
        // Use semantic tokens that respond to theme changes
        bg: 'bg.canvas', // This will be white in light mode, dark in dark mode
        color: 'brand', // Brand color for text
        borderColor: 'border.emphasized', // Theme-aware border
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          bg: {
            _light: '#f5f5f5', // Light gray in light mode
            _dark: '#2a2a2a', // Slightly lighter than card bg in dark mode
          },
          color: {
            _light: '{colors.brand.600}', // Darker brand in light mode
            _dark: '{colors.brand.400}', // Lighter brand in dark mode
          },
          borderColor: {
            _light: '{colors.brand.600}',
            _dark: '{colors.brand.400}',
          },
          _disabled: {
            bg: 'bg.canvas',
            color: 'brand',
            borderColor: 'border.emphasized',
          },
        },
        _active: {
          bg: {
            _light: '#eeeeee', // Slightly darker gray in light mode
            _dark: '#333333', // Even lighter in dark mode
          },
          color: {
            _light: '{colors.brand.700}',
            _dark: '{colors.brand.300}',
          },
          borderColor: {
            _light: '{colors.brand.700}',
            _dark: '{colors.brand.300}',
          },
        },
      },
      default: {
        bg: 'bg.canvas', // Theme-aware background
        color: 'fg', // Theme-aware text color
        borderColor: 'border.emphasized', // Theme-aware border
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          bg: 'bg.hover', // Subtle hover background
          color: 'fg',
          borderColor: 'border.hover',
        },
        _active: {
          bg: 'bg.active', // Subtle active background
          color: 'fg',
          borderColor: 'border.hover',
        },
      },
      ghost: {
        bg: 'transparent',
        color: 'brand',
        borderColor: 'transparent',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          bg: 'bg.hover',
          borderColor: 'transparent',
          _disabled: { bg: 'transparent', borderColor: 'transparent' },
        },
        _active: {
          bg: 'bg.active',
          borderColor: 'transparent',
        },
      },
      // Gradient variant for special emphasis
      gradient: {
        background: 'linear-gradient(135deg, #8285FF, #0005E9, #000383)',
        color: 'white',
        borderColor: 'transparent',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
        _active: {
          opacity: 0.8,
        },
      },
      // Secondary variant
      secondary: {
        bg: 'secondary',
        color: 'secondary.contrast',
        borderColor: 'secondary',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          bg: 'secondary.hover',
          borderColor: 'secondary.hover',
          _disabled: { bg: 'secondary', borderColor: 'secondary' },
        },
        _active: {
          bg: 'secondary.active',
          borderColor: 'secondary.active',
        },
      },
      // Status variants
      success: {
        bg: 'success',
        color: 'white',
        borderColor: 'success',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      warning: {
        bg: 'warning',
        color: 'black',
        borderColor: 'warning',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      error: {
        bg: 'error',
        color: 'white',
        borderColor: 'error',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      // Metric variants for your three indices
      horizonRank: {
        bg: 'horizonRank',
        color: 'horizonRankContrast',
        borderColor: 'horizonRank',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      whiteSpace: {
        bg: 'whiteSpace',
        color: 'whiteSpaceContrast',
        borderColor: 'whiteSpace',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      techTransfer: {
        bg: 'techTransfer',
        color: 'techTransferContrast',
        borderColor: 'techTransfer',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      // FS Color variants
      fsColor1: {
        bg: 'fsColor1',
        color: 'fsColor1Contrast',
        borderColor: 'fsColor1',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: { opacity: 0.9 },
      },
      fsColor2: {
        bg: 'fsColor2',
        color: 'fsColor2Contrast',
        borderColor: 'fsColor2',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: { opacity: 0.9 },
      },
      fsColor3: {
        bg: 'fsColor3',
        color: 'fsColor3Contrast',
        borderColor: 'fsColor3',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: { opacity: 0.9 },
      },
      fsColor4: {
        bg: 'fsColor4',
        color: 'fsColor4Contrast',
        borderColor: 'fsColor4',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: { opacity: 0.9 },
      },
      fsColor5: {
        bg: 'fsColor5',
        color: 'fsColor5Contrast',
        borderColor: 'fsColor5',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: { opacity: 0.9 },
      },
      fsColor6: {
        bg: 'fsColor6',
        color: 'fsColor6Contrast',
        borderColor: 'fsColor6',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: { opacity: 0.9 },
      },
      fsColor7: {
        bg: 'fsColor7',
        color: 'fsColor7Contrast',
        borderColor: 'fsColor7',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: { opacity: 0.9 },
      },
      fsColor8: {
        bg: 'fsColor8',
        color: 'fsColor8Contrast',
        borderColor: 'fsColor8',
        borderWidth: '1px',
        borderStyle: 'solid',
        _hover: { opacity: 0.9 },
      },
    },
    size: {
      xs: {
        h: '6',
        minW: '6',
        fontSize: 'xs',
        px: '2',
      },
      sm: {
        h: '8',
        minW: '8',
        fontSize: 'sm',
        px: '3',
      },
      md: {
        h: '10',
        minW: '10',
        fontSize: 'md',
        px: '4',
      },
      lg: {
        h: '12',
        minW: '12',
        fontSize: 'lg',
        px: '6',
      },
      xl: {
        h: '14',
        minW: '14',
        fontSize: 'xl',
        px: '8',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export default Button;

import { defineRecipe } from '@chakra-ui/react';

const Button = defineRecipe({
  base: {
    fontFamily: 'heading', // TT Norms Pro
    fontWeight: 'normal',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    _disabled: {
      opacity: 0.4,
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      solid: {
        bg: 'brand',
        color: 'brand.contrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'brand',
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
        bg: {
          _dark: 'transparent',
          _light: 'bg.canvas', // White background in light mode
        },
        color: {
          _dark: 'brand',
          _light: 'fg', // Dark text in light mode
        },
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: {
          _dark: 'brand',
          _light: 'border.emphasized', // Dark border (#111111) in light mode
        },
        _hover: {
          bg: {
            _dark: 'brand',
            _light: 'bg.hover', // Light hover background in light mode
          },
          color: {
            _dark: 'brand.contrast',
            _light: 'fg', // Keep dark text in light mode
          },
          borderColor: {
            _dark: 'brand',
            _light: 'border.emphasized',
          },
          _disabled: {
            bg: 'transparent',
            color: 'brand',
            borderColor: 'brand',
          },
        },
        _active: {
          bg: {
            _dark: 'brand.active',
            _light: 'bg.active',
          },
          color: {
            _dark: 'brand.contrast',
            _light: 'fg',
          },
          borderColor: {
            _dark: 'brand.active',
            _light: 'border.emphasized',
          },
        },
      },
      ghost: {
        bg: 'transparent',
        color: 'brand',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'transparent',
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
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'transparent',
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
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'secondary',
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
        color: { base: 'white', _light: 'black' },
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'success',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      warning: {
        bg: 'warning',
        color: { base: 'black', _light: 'black' },
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'warning',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      error: {
        bg: 'error',
        color: 'white',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'error',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      // Metric variants for your three indices
      horizonRank: {
        bg: 'horizonRank',
        color: 'horizonRankContrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'horizonRank',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      whiteSpace: {
        bg: 'whiteSpace',
        color: 'whiteSpaceContrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'whiteSpace',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      techTransfer: {
        bg: 'techTransfer',
        color: 'techTransferContrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'techTransfer',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      // FS Color variants
      fsColor1: {
        bg: 'fsColor1',
        color: 'fsColor1Contrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'fsColor1',
        _hover: { opacity: 0.9 },
      },
      fsColor2: {
        bg: 'fsColor2',
        color: 'fsColor2Contrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'fsColor2',
        _hover: { opacity: 0.9 },
      },
      fsColor3: {
        bg: 'fsColor3',
        color: 'fsColor3Contrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'fsColor3',
        _hover: { opacity: 0.9 },
      },
      fsColor4: {
        bg: 'fsColor4',
        color: 'fsColor4Contrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'fsColor4',
        _hover: { opacity: 0.9 },
      },
      fsColor5: {
        bg: 'fsColor5',
        color: 'fsColor5Contrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'fsColor5',
        _hover: { opacity: 0.9 },
      },
      fsColor6: {
        bg: 'fsColor6',
        color: 'fsColor6Contrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'fsColor6',
        _hover: { opacity: 0.9 },
      },
      fsColor7: {
        bg: 'fsColor7',
        color: 'fsColor7Contrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'fsColor7',
        _hover: { opacity: 0.9 },
      },
      fsColor8: {
        bg: 'fsColor8',
        color: 'fsColor8Contrast',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'fsColor8',
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
    variant: 'solid',
    size: 'md',
  },
});

export default Button;

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
        _hover: {
          bg: 'brand.hover',
          _disabled: { bg: 'brand' },
        },
        _active: {
          bg: 'brand.active',
        },
      },
      outline: {
        bg: 'transparent',
        color: 'brand',
        borderWidth: '1px',
        borderColor: 'brand',
        _hover: {
          bg: 'brand',
          color: 'brand.contrast',
          _disabled: {
            bg: 'transparent',
            color: 'brand',
          },
        },
        _active: {
          bg: 'brand.active',
          color: 'brand.contrast',
        },
      },
      ghost: {
        bg: 'transparent',
        color: 'brand',
        _hover: {
          bg: 'bg.hover',
          _disabled: { bg: 'transparent' },
        },
        _active: {
          bg: 'bg.active',
        },
      },
      // Gradient variant for special emphasis
      gradient: {
        background: 'linear-gradient(135deg, #8285FF, #0005E9, #000383)',
        color: 'white',
        border: 'none',
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
        _hover: {
          bg: 'secondary.hover',
          _disabled: { bg: 'secondary' },
        },
        _active: {
          bg: 'secondary.active',
        },
      },
      // Status variants
      success: {
        bg: 'success',
        color: { base: 'white', _light: 'black' },
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      warning: {
        bg: 'warning',
        color: { base: 'black', _light: 'black' },
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      error: {
        bg: 'error',
        color: 'white',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      // Metric variants for your three indices
      horizonRank: {
        bg: 'horizonRank',
        color: 'horizonRankContrast',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      whiteSpace: {
        bg: 'whiteSpace',
        color: 'whiteSpaceContrast',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      techTransfer: {
        bg: 'techTransfer',
        color: 'techTransferContrast',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      // FS Color variants
      fsColor1: {
        bg: 'fsColor1',
        color: 'fsColor1Contrast',
        _hover: { opacity: 0.9 },
      },
      fsColor2: {
        bg: 'fsColor2',
        color: 'fsColor2Contrast',
        _hover: { opacity: 0.9 },
      },
      fsColor3: {
        bg: 'fsColor3',
        color: 'fsColor3Contrast',
        _hover: { opacity: 0.9 },
      },
      fsColor4: {
        bg: 'fsColor4',
        color: 'fsColor4Contrast',
        _hover: { opacity: 0.9 },
      },
      fsColor5: {
        bg: 'fsColor5',
        color: 'fsColor5Contrast',
        _hover: { opacity: 0.9 },
      },
      fsColor6: {
        bg: 'fsColor6',
        color: 'fsColor6Contrast',
        _hover: { opacity: 0.9 },
      },
      fsColor7: {
        bg: 'fsColor7',
        color: 'fsColor7Contrast',
        _hover: { opacity: 0.9 },
      },
      fsColor8: {
        bg: 'fsColor8',
        color: 'fsColor8Contrast',
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

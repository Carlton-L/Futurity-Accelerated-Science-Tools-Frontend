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
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
          _disabled: { bg: 'brand.500' },
        },
        _active: {
          bg: 'brand.700',
        },
      },
      outline: {
        bg: 'transparent',
        color: { base: 'brand.400', _light: 'brand.500' },
        borderWidth: '1px',
        borderColor: { base: 'brand.400', _light: 'brand.500' },
        _hover: {
          bg: { base: 'brand.500', _light: 'brand.50' },
          color: { base: 'white', _light: 'brand.600' },
          _disabled: {
            bg: 'transparent',
            color: { base: 'brand.400', _light: 'brand.500' },
          },
        },
        _active: {
          bg: { base: 'brand.600', _light: 'brand.100' },
        },
      },
      ghost: {
        bg: 'transparent',
        color: { base: 'brand.400', _light: 'brand.500' },
        _hover: {
          bg: { base: 'rgba(130, 133, 255, 0.1)', _light: 'brand.50' },
          _disabled: { bg: 'transparent' },
        },
        _active: {
          bg: { base: 'rgba(130, 133, 255, 0.2)', _light: 'brand.100' },
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
      // Status variants
      success: {
        bg: 'status.success',
        color: 'white',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      warning: {
        bg: 'status.warning',
        color: { base: 'black', _light: 'black' },
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
      },
      error: {
        bg: 'status.error',
        color: 'white',
        _hover: {
          opacity: 0.9,
          _disabled: { opacity: 0.4 },
        },
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

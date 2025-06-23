import { defineSlotRecipe } from '@chakra-ui/react';

const Card = defineSlotRecipe({
  slots: ['root', 'header', 'body', 'footer'],
  base: {
    root: {
      bg: 'bg.canvas',
      borderRadius: '8px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'border.emphasized', // White in dark mode, #111111 in light mode
      overflow: 'hidden',
      transition: 'all 0.2s',
      _hover: {
        borderColor: 'border.hover',
      },
    },
    header: {
      px: '6',
      py: '4',
      borderBottomWidth: '1px',
      borderBottomColor: 'border.muted',
    },
    body: {
      px: '6',
      py: '4',
    },
    footer: {
      px: '6',
      py: '4',
      borderTopWidth: '1px',
      borderTopColor: 'border.muted',
    },
  },
  variants: {
    variant: {
      solid: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'border.emphasized', // Emphasized border for stats cards
        },
      },
      outline: {
        root: {
          bg: 'transparent',
          borderColor: 'border.emphasized',
        },
      },
      ghost: {
        root: {
          bg: 'transparent',
          borderColor: 'transparent',
        },
      },
      glass: {
        root: {
          bg: 'glass',
          backdropFilter: 'blur(10px)',
          borderColor: 'border.emphasized',
        },
      },
      // Metric variants
      horizonRank: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'horizonRank',
          borderWidth: '2px',
        },
      },
      whiteSpace: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'whiteSpace',
          borderWidth: '2px',
        },
      },
      techTransfer: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'techTransfer',
          borderWidth: '2px',
        },
      },
      // FS Color variants
      fsColor1: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor1',
          borderWidth: '2px',
        },
      },
      fsColor2: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor2',
          borderWidth: '2px',
        },
      },
      fsColor3: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor3',
          borderWidth: '2px',
        },
      },
      fsColor4: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor4',
          borderWidth: '2px',
        },
      },
      fsColor5: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor5',
          borderWidth: '2px',
        },
      },
      fsColor6: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor6',
          borderWidth: '2px',
        },
      },
      fsColor7: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor7',
          borderWidth: '2px',
        },
      },
      fsColor8: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor8',
          borderWidth: '2px',
        },
      },
    },
    size: {
      sm: {
        root: { p: '3' },
        header: { px: '3', py: '2' },
        body: { px: '3', py: '2' },
        footer: { px: '3', py: '2' },
      },
      md: {
        root: { p: '4' },
        header: { px: '4', py: '3' },
        body: { px: '4', py: '3' },
        footer: { px: '4', py: '3' },
      },
      lg: {
        root: { p: '6' },
        header: { px: '6', py: '4' },
        body: { px: '6', py: '4' },
        footer: { px: '6', py: '4' },
      },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
});

export default Card;

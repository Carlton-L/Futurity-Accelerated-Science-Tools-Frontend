import { defineSlotRecipe } from '@chakra-ui/react';

const Card = defineSlotRecipe({
  slots: ['root', 'header', 'body', 'footer'],
  base: {
    root: {
      bg: 'bg.canvas',
      borderRadius: '8px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'border.emphasized', // This should give white in dark mode, #111111 in light mode
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
      outline: {
        root: {
          bg: 'bg.canvas',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'border.emphasized', // Force the emphasized border
        },
      },
      elevated: {
        root: {
          bg: 'bg.canvas',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'border.emphasized',
          boxShadow: 'md',
        },
      },
      subtle: {
        root: {
          bg: 'transparent',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'border.muted',
        },
      },
      // Keep your custom glass variant
      glass: {
        root: {
          bg: 'glass',
          backdropFilter: 'blur(10px)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'border.emphasized',
        },
      },
      // Metric variants with forced borders
      horizonRank: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'horizonRank',
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
      whiteSpace: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'whiteSpace',
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
      techTransfer: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'techTransfer',
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
      // FS Color variants with forced borders
      fsColor1: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor1',
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
      fsColor2: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor2',
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
      fsColor3: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor3',
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
      fsColor4: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor4',
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
      fsColor5: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor5',
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
      fsColor6: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor6',
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
      fsColor7: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor7',
          borderWidth: '2px',
          borderStyle: 'solid',
        },
      },
      fsColor8: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'fsColor8',
          borderWidth: '2px',
          borderStyle: 'solid',
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
    variant: 'outline',
    size: 'md',
  },
});

export default Card;

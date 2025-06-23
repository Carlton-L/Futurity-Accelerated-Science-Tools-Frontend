import { defineSlotRecipe } from '@chakra-ui/react';

const Card = defineSlotRecipe({
  slots: ['root', 'header', 'body', 'footer'],
  base: {
    root: {
      bg: 'bg.canvas',
      borderRadius: '8px',
      borderWidth: '1px',
      borderStyle: 'solid',
      // Use the semantic token that should work
      borderColor: 'border.emphasized',
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
          borderColor: {
            _light: '#111111', // Dark border in light mode
            _dark: '#FFFFFF', // White border in dark mode
          },
        },
      },
      // Add a new 'default' variant that explicitly uses the emphasized border
      default: {
        root: {
          bg: 'bg.canvas',
          borderColor: {
            _light: '#111111', // Dark border in light mode
            _dark: '#FFFFFF', // White border in dark mode
          },
        },
      },
      elevated: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'border.emphasized',
          boxShadow: 'md',
        },
      },
      subtle: {
        root: {
          bg: 'transparent',
          borderColor: 'border.muted',
        },
      },
      // Keep your custom glass variant
      glass: {
        root: {
          bg: 'glass',
          backdropFilter: 'blur(10px)',
          borderColor: 'border.emphasized',
        },
      },
      // Metric variants with colored borders
      horizonRank: {
        root: {
          bg: 'bg.canvas',
          borderColor: 'horizonRank',
          borderWidth: '2px', // Thicker border for metric cards
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
      // FS Color variants with colored borders
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
    variant: 'outline',
    size: 'md',
  },
});

export default Card;

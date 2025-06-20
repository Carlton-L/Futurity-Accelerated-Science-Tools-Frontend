import React from 'react';
import { Box } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';

interface GlassCardProps extends BoxProps {
  variant?: 'solid' | 'glass' | 'outline' | 'gradient';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'solid',
  children,
  ...props
}) => {
  const getCardStyles = () => {
    const baseBorderStyles = {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: { base: '#FFFFFF', _light: '#000000' }, // Explicit white/black borders
    };

    switch (variant) {
      case 'glass':
        return {
          ...baseBorderStyles,
          bg: {
            base: 'rgba(26, 26, 26, 0.5)',
            _light: 'rgba(255, 255, 255, 0.8)',
          },
          backdropFilter: 'blur(10px)',
          boxShadow: 'none',
        };
      case 'outline':
        return {
          ...baseBorderStyles,
          bg: 'transparent',
        };
      case 'gradient':
        return {
          position: 'relative' as const,
          bg: { base: '#1a1a1a', _light: '#FFFFFF' }, // Explicit backgrounds
          borderColor: 'transparent',
          _before: {
            content: '""',
            position: 'absolute',
            inset: 0,
            padding: '2px',
            borderRadius: '8px',
            background: 'linear-gradient(to bottom, #8285FF, #0005E9, #000383)',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            zIndex: 0,
          },
        };
      default: // solid
        return {
          ...baseBorderStyles,
          bg: { base: '#1a1a1a', _light: '#FFFFFF' }, // Explicit card backgrounds
          boxShadow: { base: 'none', _light: 'sm' },
        };
    }
  };

  const cardStyles = getCardStyles();

  return (
    <Box
      {...cardStyles}
      borderRadius='8px'
      fontFamily='body'
      color={{ base: '#FFFFFF', _light: '#000000' }} // Explicit text colors
      position='relative'
      overflow='hidden' // Prevent content from spilling out of rounded corners
      {...props}
    >
      {children}
    </Box>
  );
};

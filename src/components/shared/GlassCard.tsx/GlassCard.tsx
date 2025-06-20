import React from 'react';
import { Card, Box, BoxProps } from '@chakra-ui/react';

interface GlassCardProps extends BoxProps {
  variant?: 'solid' | 'glass' | 'outline' | 'gradient';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'solid',
  children,
  ...props
}) => {
  const getCardStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          bg: 'glass',
          backdropFilter: 'blur(10px)',
          borderColor: 'border.emphasized',
          borderWidth: '1px',
          boxShadow: 'none',
        };
      case 'outline':
        return {
          bg: 'transparent',
          borderColor: 'border.DEFAULT',
          borderWidth: '1px',
        };
      case 'gradient':
        return {
          position: 'relative' as const,
          bg: 'bg.canvas',
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
          bg: 'bg.canvas',
          borderColor: 'border.DEFAULT',
          borderWidth: '1px',
          boxShadow: { base: 'none', _light: 'sm' },
        };
    }
  };

  const cardStyles = getCardStyles();

  if (variant === 'gradient') {
    return (
      <Box {...cardStyles} borderRadius='8px' {...props}>
        <Card.Root
          position='relative'
          zIndex={1}
          bg='transparent'
          borderColor='transparent'
          fontFamily='body'
          color='fg'
        >
          {children}
        </Card.Root>
      </Box>
    );
  }

  return (
    <Card.Root
      {...cardStyles}
      borderRadius='8px'
      fontFamily='body'
      color='fg'
      {...props}
    >
      {children}
    </Card.Root>
  );
};

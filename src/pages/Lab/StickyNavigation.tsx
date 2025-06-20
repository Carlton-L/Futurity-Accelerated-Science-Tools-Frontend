import React from 'react';
import { Box, Button, HStack } from '@chakra-ui/react';
import type { NavigationItem } from './types';

interface StickyNavigationProps {
  items: NavigationItem[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

const StickyNavigation: React.FC<StickyNavigationProps> = ({
  items,
  activeSection,
  onSectionClick,
}) => {
  return (
    <Box py={3}>
      <HStack gap={0} overflowX='auto' pb={1}>
        {items.map((item) => (
          <Button
            key={item.id}
            variant='ghost'
            onClick={() => onSectionClick(item.id)}
            bg={activeSection === item.id ? 'brand.50' : 'transparent'}
            color={activeSection === item.id ? 'brand.700' : 'fg.muted'}
            borderBottom='2px solid'
            borderColor={
              activeSection === item.id ? 'brand.500' : 'transparent'
            }
            borderRadius={0}
            py={2}
            px={4}
            whiteSpace='nowrap'
            fontSize='sm'
            fontWeight='medium'
            fontFamily='heading'
            _hover={{
              bg: activeSection === item.id ? 'brand.100' : 'bg.subtle',
              color: activeSection === item.id ? 'brand.800' : 'fg',
            }}
            _active={{
              bg: activeSection === item.id ? 'brand.100' : 'bg.muted',
            }}
          >
            {item.label}
          </Button>
        ))}
      </HStack>
    </Box>
  );
};

export default StickyNavigation;

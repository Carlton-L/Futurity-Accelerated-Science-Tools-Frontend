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
    <Box
      position='sticky'
      top='64px'
      zIndex={10}
      bg='white'
      borderBottom='1px solid'
      borderColor='gray.200'
      py={3}
      mb={6}
    >
      <HStack gap={0} overflowX='auto' pb={1}>
        {items.map((item) => (
          <Button
            key={item.id}
            variant='ghost'
            onClick={() => onSectionClick(item.id)}
            bg={activeSection === item.id ? 'blue.50' : 'transparent'}
            color={activeSection === item.id ? 'blue.700' : 'gray.600'}
            borderBottom='2px solid'
            borderColor={activeSection === item.id ? 'blue.500' : 'transparent'}
            borderRadius={0}
            py={2}
            px={4}
            whiteSpace='nowrap'
            fontSize='sm'
            fontWeight='medium'
            _hover={{
              bg: activeSection === item.id ? 'blue.100' : 'gray.50',
              color: activeSection === item.id ? 'blue.800' : 'gray.700',
            }}
            _active={{
              bg: activeSection === item.id ? 'blue.100' : 'gray.100',
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

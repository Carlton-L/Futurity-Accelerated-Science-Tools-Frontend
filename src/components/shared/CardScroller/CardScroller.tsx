import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { CardScrollerProps } from './cardScrollerTypes';

const CardScroller: React.FC<CardScrollerProps> = ({
  children,
  height = '100%',
  gap = 4,
  padding = 2,
  buttonWidth = 40,
  emptyMessage = '(empty)',
}) => {
  // Scroll state
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  // Generate unique ID for this instance
  const [containerId] = useState<string>(
    () => `card-scroller-${Math.random().toString(36).substr(2, 9)}`
  );

  // Check scroll position and update button states
  const updateScrollButtons = useCallback((): void => {
    const container = document.getElementById(containerId);
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // -1 for rounding
    }
  }, [containerId]);

  // Scroll functionality
  const scroll = useCallback(
    (direction: 'left' | 'right'): void => {
      const container = document.getElementById(containerId);
      if (container) {
        const scrollAmount = 300; // Scroll by ~one card width
        const newScrollPosition =
          direction === 'left'
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;

        container.scrollTo({
          left: newScrollPosition,
          behavior: 'smooth',
        });

        // Update button states after scroll animation
        setTimeout(updateScrollButtons, 300);
      }
    },
    [containerId, updateScrollButtons]
  );

  // Initialize scroll button states when content changes
  useEffect(() => {
    const timer = setTimeout(updateScrollButtons, 100);
    return () => clearTimeout(timer);
  }, [children, updateScrollButtons]);

  // Check if container is empty
  const isEmpty =
    !children || (Array.isArray(children) && children.length === 0);

  return (
    <Box
      position='relative'
      border='1px solid'
      borderColor='gray.100'
      borderRadius='md'
      overflow='hidden'
      height={height}
    >
      {isEmpty ? (
        // Empty state
        <Box
          height='100%'
          display='flex'
          alignItems='center'
          justifyContent='center'
          bg='gray.50'
        >
          <Text color='gray.400' fontSize='sm' fontStyle='italic'>
            {emptyMessage}
          </Text>
        </Box>
      ) : (
        // Content with scroll controls
        <HStack height='100%' gap={0}>
          {/* Left Scroll Button */}
          <Button
            height='100%'
            width={`${buttonWidth}px`}
            borderRadius='0'
            variant='ghost'
            onClick={() => scroll('left')}
            aria-label='Scroll left'
            bg='rgba(255,255,255,0.9)'
            _hover={{ bg: 'rgba(255,255,255,1)' }}
            _disabled={{
              bg: 'gray.200',
              color: 'gray.400',
              cursor: 'not-allowed',
              opacity: 0.6,
            }}
            flexShrink={0}
            disabled={!canScrollLeft}
          >
            <FiChevronLeft size={20} />
          </Button>

          {/* Scrollable Content */}
          <Box
            id={containerId}
            flex='1'
            height='100%'
            overflowX='auto'
            overflowY='hidden'
            p={padding}
            onScroll={updateScrollButtons}
            css={{
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              '-ms-overflow-style': 'none',
              'scrollbar-width': 'none',
            }}
          >
            <HStack
              gap={gap}
              align='stretch'
              minWidth='max-content'
              height='100%'
            >
              {children}
            </HStack>
          </Box>

          {/* Right Scroll Button */}
          <Button
            height='100%'
            width={`${buttonWidth}px`}
            borderRadius='0'
            variant='ghost'
            onClick={() => scroll('right')}
            aria-label='Scroll right'
            bg='rgba(255,255,255,0.9)'
            _hover={{ bg: 'rgba(255,255,255,1)' }}
            _disabled={{
              bg: 'gray.200',
              color: 'gray.400',
              cursor: 'not-allowed',
              opacity: 0.6,
            }}
            flexShrink={0}
            disabled={!canScrollRight}
          >
            <FiChevronRight size={20} />
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default CardScroller;

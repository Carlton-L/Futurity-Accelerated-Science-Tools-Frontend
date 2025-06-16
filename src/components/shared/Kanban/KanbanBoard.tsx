import React, { useRef, useCallback, useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, HStack, VStack, Text } from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import KanbanColumn from './KanbanColumn';
import type { KanbanBoardProps } from './kanbanTypes';

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onItemMove,
  onColumnAdd,
  onColumnUpdate,
  onColumnDelete,
  renderItem,
  renderAddColumnButton,
  scrollShadows = true,
  className,
  dragType = 'KANBAN_ITEM',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shadows, setShadows] = useState({
    left: false,
    right: false,
  });

  // Update scroll shadows based on scroll position
  const updateScrollShadows = useCallback(() => {
    if (!scrollContainerRef.current || !scrollShadows) return;

    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setShadows({
      left: scrollLeft > 0,
      right: scrollLeft < scrollWidth - clientWidth - 1,
    });
  }, [scrollShadows]);

  // Add scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !scrollShadows) return;

    // Initial check
    updateScrollShadows();

    // Add scroll listener
    container.addEventListener('scroll', updateScrollShadows);

    // Add resize listener to handle window resize
    const handleResize = () => {
      setTimeout(updateScrollShadows, 100);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', updateScrollShadows);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollShadows, scrollShadows]);

  // Update shadows when columns change
  useEffect(() => {
    if (scrollShadows) {
      setTimeout(updateScrollShadows, 100);
    }
  }, [columns, updateScrollShadows, scrollShadows]);

  // Handle auto-scroll when dragging near edges
  const handleDragScroll = useCallback((clientX: number) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollZone = 100; // pixels from edge to trigger scroll
    const scrollSpeed = 10;

    if (clientX < rect.left + scrollZone) {
      // Scroll left
      container.scrollLeft = Math.max(0, container.scrollLeft - scrollSpeed);
    } else if (clientX > rect.right - scrollZone) {
      // Scroll right
      container.scrollLeft = Math.min(
        container.scrollWidth - container.clientWidth,
        container.scrollLeft + scrollSpeed
      );
    }
  }, []);

  // Add mouse move listener for drag scrolling
  useEffect(() => {
    let animationFrame: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      animationFrame = requestAnimationFrame(() => {
        handleDragScroll(e.clientX);
      });
    };

    const handleDragStart = () => {
      document.addEventListener('mousemove', handleMouseMove);
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [handleDragScroll]);

  const defaultAddColumnButton = () => (
    <Box
      minW='280px'
      maxW='320px'
      h='200px'
      border='2px dashed'
      borderColor='gray.400'
      borderRadius='md'
      display='flex'
      alignItems='center'
      justifyContent='center'
      cursor='pointer'
      _hover={{ borderColor: 'blue.400', bg: 'gray.50' }}
      onClick={onColumnAdd}
      transition='all 0.2s'
    >
      <VStack gap={2}>
        <Box color='gray.400'>
          <FiPlus size={24} />
        </Box>
        <Text color='gray.500' fontSize='sm' fontWeight='medium'>
          Add Column
        </Text>
      </VStack>
    </Box>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <Box position='relative' w='100%' className={className}>
        {/* Scroll shadows */}
        {scrollShadows && shadows.left && (
          <Box
            position='absolute'
            left='0'
            top='0'
            bottom='0'
            width='20px'
            background='linear-gradient(to right, rgba(0,0,0,0.15), transparent)'
            zIndex='10'
            pointerEvents='none'
          />
        )}

        {scrollShadows && shadows.right && (
          <Box
            position='absolute'
            right='0'
            top='0'
            bottom='0'
            width='20px'
            background='linear-gradient(to left, rgba(0,0,0,0.15), transparent)'
            zIndex='10'
            pointerEvents='none'
          />
        )}

        <Box
          ref={scrollContainerRef}
          w='100%'
          overflowX='auto'
          overflowY='hidden'
          pb={4}
          pt={2}
          css={{
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#2d3748',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#4a5568',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#718096',
            },
          }}
        >
          <HStack gap={4} align='flex-start' minW='fit-content' pb={2}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                items={column.items}
                isDefault={column.isDefault}
                onDrop={onItemMove}
                onColumnRename={
                  onColumnUpdate
                    ? (id, newName) => onColumnUpdate(id, { title: newName })
                    : undefined
                }
                onColumnDelete={onColumnDelete}
                renderItem={(item) => renderItem(item, column.id)}
              />
            ))}

            {/* Add Column Button */}
            {onColumnAdd &&
              (renderAddColumnButton
                ? renderAddColumnButton()
                : defaultAddColumnButton())}
          </HStack>
        </Box>
      </Box>
    </DndProvider>
  );
};

export default KanbanBoard;

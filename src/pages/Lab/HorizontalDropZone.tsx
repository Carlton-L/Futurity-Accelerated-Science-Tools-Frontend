import React, { useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { Box, HStack, Text } from '@chakra-ui/react';
import type { LabSubject } from './types';

interface HorizontalDropZoneProps {
  categoryId: string;
  subjects: LabSubject[];
  onDrop: (
    itemId: string,
    fromColumnId: string,
    toColumnId: string
  ) => Promise<void>;
  renderSubjectCard: (subject: LabSubject) => React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
}

// Define the drag item interface to match your KanbanItem
interface DragItem {
  id: string;
  columnId: string;
  type: string;
}

export const HorizontalDropZone: React.FC<HorizontalDropZoneProps> = ({
  categoryId,
  subjects,
  onDrop,
  renderSubjectCard,
  emptyMessage = 'Drop subjects here',
  isLoading = false,
}) => {
  // Handle drop with react-dnd
  const handleDrop = useCallback(
    async (item: DragItem, monitor: any) => {
      if (!monitor.didDrop()) {
        console.log('HorizontalDropZone: Drop event', {
          itemId: item.id,
          fromColumnId: item.columnId,
          toColumnId: categoryId,
          itemType: item.type,
        });

        // Only proceed if it's actually a different column
        if (item.columnId !== categoryId) {
          try {
            await onDrop(item.id, item.columnId, categoryId);
          } catch (error) {
            console.error('Drop failed in HorizontalDropZone:', error);
          }
        }
      }
    },
    [categoryId, onDrop]
  );

  const [{ isOver, canDrop }, drop] = useDrop({
    // Accept the same item types as your KanbanColumn
    accept: ['KANBAN_ITEM', 'kanban-item', 'subject'], // Try multiple possible types
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const showDropIndicator = isOver && canDrop;
  const isEmpty = subjects.length === 0;

  console.log('HorizontalDropZone render:', {
    categoryId,
    isOver,
    canDrop,
    showDropIndicator,
    subjectCount: subjects.length,
  });

  return (
    <Box
      ref={drop}
      minH='100px'
      w='100%'
      position='relative'
      bg={showDropIndicator ? 'bg.hover' : 'transparent'}
      transition='all 0.2s'
    >
      {isEmpty && !isLoading ? (
        // Empty state with drop indicator
        <Box
          display='flex'
          alignItems='center'
          justifyContent='center'
          minH='100px'
          border='2px dashed'
          borderColor={showDropIndicator ? 'brand' : 'border.muted'}
          borderRadius='md'
          bg={showDropIndicator ? 'brand.50' : 'bg.subtle'}
          color={showDropIndicator ? 'brand.600' : 'fg.muted'}
          fontSize='sm'
          fontFamily='body'
          _hover={{
            borderColor: 'border.emphasized',
            bg: 'bg.hover',
          }}
        >
          {showDropIndicator ? 'Drop here to uncategorize' : emptyMessage}
        </Box>
      ) : (
        // Horizontal layout of subjects
        <Box
          w='100%'
          overflowX='auto'
          overflowY='visible'
          css={{
            '&::-webkit-scrollbar': { height: '6px' },
            '&::-webkit-scrollbar-track': {
              background: 'var(--chakra-colors-bg-subtle)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'var(--chakra-colors-border-muted)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'var(--chakra-colors-border-emphasized)',
            },
          }}
        >
          <HStack gap={3} align='flex-start' minW='fit-content'>
            {subjects.map((subject) => (
              <Box key={subject.id} minW='280px' maxW='320px' flexShrink={0}>
                {renderSubjectCard(subject)}
              </Box>
            ))}
          </HStack>
        </Box>
      )}

      {/* Debug info - remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          position='absolute'
          top='-20px'
          right='0'
          fontSize='xs'
          color='gray.500'
          bg='white'
          px={2}
          borderRadius='sm'
          border='1px solid'
          borderColor='gray.200'
        >
          isOver: {isOver.toString()}, canDrop: {canDrop.toString()}
        </Box>
      )}
    </Box>
  );
};

import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Box, Text, VStack, HStack, Input, Flex } from '@chakra-ui/react';
import type { KanbanColumnProps, DragItem } from './kanbanTypes';

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  items,
  isDefault = false,
  allowDrop = true,
  onDrop,
  onColumnRename,
  onColumnDelete,
  renderItem,
  renderHeader,
  renderFooter,
  className,
  emptyMessage = 'No items',
  emptyDropMessage = 'Drop items here',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const [{ isOver }, drop] = useDrop({
    accept: 'KANBAN_ITEM',
    drop: (item: DragItem) => {
      if (item.columnId !== id && allowDrop) {
        onDrop(item.id, item.columnId, id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && allowDrop,
    }),
  });

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== title && onColumnRename) {
      onColumnRename(id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(title);
      setIsEditing(false);
    }
  };

  const handleTitleClick = () => {
    if (!isDefault && onColumnRename) {
      setIsEditing(true);
    }
  };

  return (
    <Box
      ref={drop}
      minW='280px'
      maxW='320px'
      h='calc(100vh - 250px)'
      bg={isOver ? 'bg.hover' : 'bg.canvas'}
      borderColor={isOver ? 'brand' : 'border.emphasized'}
      borderWidth='1px'
      borderRadius='md'
      transition='all 0.2s'
      display='flex'
      flexDirection='column'
      className={className}
    >
      {/* Column Header */}
      <Box p={4} borderBottom='1px solid' borderBottomColor='border.muted'>
        {renderHeader ? (
          renderHeader()
        ) : (
          <HStack justify='space-between' align='center'>
            <HStack gap={2} flex='1'>
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={handleKeyPress}
                  size='sm'
                  autoFocus
                  bg='bg'
                  borderColor='border.muted'
                  color='fg'
                  _placeholder={{ color: 'fg.muted' }}
                  _focus={{
                    borderColor: 'brand',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                  }}
                  fontSize='sm'
                  fontFamily='body'
                />
              ) : (
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  color='fg'
                  cursor={isDefault ? 'default' : 'pointer'}
                  onClick={handleTitleClick}
                  _hover={isDefault ? {} : { color: 'fg.hover' }}
                  transition='color 0.2s'
                  flex='1'
                  fontFamily='heading'
                >
                  {title}
                </Text>
              )}
              <Box
                bg='bg.muted'
                color='fg.muted'
                fontSize='xs'
                px={2}
                py={1}
                borderRadius='md'
                minW='20px'
                textAlign='center'
                fontFamily='body'
              >
                {items.length}
              </Box>
            </HStack>
          </HStack>
        )}
      </Box>

      {/* Items List */}
      <Box flex='1' p={3} overflowY='auto'>
        {items.length > 0 ? (
          <VStack gap={0} align='stretch'>
            {items.map((item) => (
              <Box key={item.id}>{renderItem(item)}</Box>
            ))}
          </VStack>
        ) : (
          <Flex
            height='120px'
            align='center'
            justify='center'
            border='2px dashed'
            borderColor={isOver ? 'brand' : 'border.muted'}
            borderRadius='md'
            bg={isOver ? 'bg.active' : 'bg.subtle'}
            transition='all 0.2s'
          >
            <Text
              color='fg.muted'
              fontSize='sm'
              textAlign='center'
              fontFamily='body'
            >
              {isOver ? emptyDropMessage : emptyMessage}
            </Text>
          </Flex>
        )}
      </Box>

      {/* Footer */}
      {renderFooter && (
        <Box p={3} borderTop='1px solid' borderTopColor='border.muted'>
          {renderFooter()}
        </Box>
      )}
    </Box>
  );
};

export default KanbanColumn;

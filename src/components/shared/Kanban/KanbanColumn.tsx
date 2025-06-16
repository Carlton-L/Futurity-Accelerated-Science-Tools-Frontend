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
      bg={isOver ? '#2a2a2a' : '#1a1a1a'}
      borderColor={isOver ? 'blue.400' : 'gray.600'}
      borderWidth='1px'
      borderRadius='md'
      transition='all 0.2s'
      display='flex'
      flexDirection='column'
      className={className}
    >
      {/* Column Header */}
      <Box p={4} borderBottom='1px solid' borderBottomColor='gray.600'>
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
                  bg='gray.700'
                  borderColor='gray.500'
                  color='white'
                  _focus={{ borderColor: 'blue.400' }}
                  fontSize='sm'
                />
              ) : (
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  color='white'
                  cursor={isDefault ? 'default' : 'pointer'}
                  onClick={handleTitleClick}
                  _hover={isDefault ? {} : { color: 'blue.300' }}
                  transition='color 0.2s'
                  flex='1'
                >
                  {title}
                </Text>
              )}
              <Box
                bg='gray.600'
                color='gray.200'
                fontSize='xs'
                px={2}
                py={1}
                borderRadius='md'
                minW='20px'
                textAlign='center'
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
            borderColor={isOver ? 'blue.400' : 'gray.600'}
            borderRadius='md'
            bg={isOver ? 'gray.700' : 'gray.800'}
            transition='all 0.2s'
          >
            <Text color='gray.400' fontSize='sm' textAlign='center'>
              {isOver ? emptyDropMessage : emptyMessage}
            </Text>
          </Flex>
        )}
      </Box>

      {/* Footer */}
      {renderFooter && (
        <Box p={3} borderTop='1px solid' borderTopColor='gray.600'>
          {renderFooter()}
        </Box>
      )}
    </Box>
  );
};

export default KanbanColumn;

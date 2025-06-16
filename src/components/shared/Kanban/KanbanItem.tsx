import React from 'react';
import { useDrag } from 'react-dnd';
import { Box } from '@chakra-ui/react';
import type { KanbanItemProps, DragItem } from './kanbanTypes';

const KanbanItem: React.FC<KanbanItemProps> = ({
  id,
  columnId,
  children,
  isDraggable = true,
  onItemClick,
  className,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'KANBAN_ITEM',
    item: { type: 'KANBAN_ITEM', id, columnId } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: isDraggable,
  });

  const handleClick = () => {
    if (onItemClick) {
      onItemClick(id);
    }
  };

  return (
    <Box
      ref={isDraggable ? drag : undefined}
      opacity={isDragging ? 0.5 : 1}
      cursor={isDraggable ? 'grab' : 'default'}
      onClick={handleClick}
      className={className}
      transition='all 0.2s'
    >
      {children}
    </Box>
  );
};

export default KanbanItem;

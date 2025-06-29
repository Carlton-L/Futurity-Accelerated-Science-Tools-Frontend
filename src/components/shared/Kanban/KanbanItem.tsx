import React, { useState } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

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

  // Calculate z-index based on state
  const getZIndex = () => {
    if (isMenuOpen || isTooltipOpen) return 1000; // High but below tooltips/menus
    if (isDragging) return 100; // Higher when dragging
    return 1; // Default low z-index
  };

  return (
    <Box
      ref={isDraggable ? drag : undefined}
      opacity={isDragging ? 0.5 : 1}
      cursor={isDraggable ? 'grab' : 'default'}
      onClick={handleClick}
      className={className}
      transition='all 0.2s'
      position='relative'
      zIndex={getZIndex()}
      _active={isDraggable ? { cursor: 'grabbing' } : {}}
      _hover={isDraggable ? { transform: 'translateY(-1px)' } : {}}
      // Global CSS to ensure tooltips and menus are always on top
      css={{
        // Target any tooltip or menu inside this item
        '& [role="tooltip"]': {
          zIndex: '999999 !important',
          position: 'relative',
        },
        '& [role="menu"]': {
          zIndex: '999999 !important',
          position: 'relative',
        },
        // Target Chakra UI specific tooltip and menu components
        '& [data-part="tooltip-content"]': {
          zIndex: '999999 !important',
        },
        '& [data-part="menu-content"]': {
          zIndex: '999999 !important',
        },
        // Target the positioner elements that contain the floating content
        '& [data-part="tooltip-positioner"]': {
          zIndex: '999999 !important',
        },
        '& [data-part="menu-positioner"]': {
          zIndex: '999999 !important',
        },
      }}
      // Event handlers to track menu/tooltip state
      onMouseEnter={() => setIsTooltipOpen(true)}
      onMouseLeave={() => setIsTooltipOpen(false)}
      // Use capture phase to catch menu open/close events
      onClickCapture={(e) => {
        // Check if this is a menu trigger click
        const target = e.target as Element;
        if (
          target.closest('[role="button"]') &&
          target.closest('[aria-haspopup]')
        ) {
          setIsMenuOpen(true);
        }
      }}
      // Listen for clicks outside to close menu
      onBlurCapture={() => {
        setTimeout(() => setIsMenuOpen(false), 100);
      }}
    >
      {children}
    </Box>
  );
};

export default KanbanItem;

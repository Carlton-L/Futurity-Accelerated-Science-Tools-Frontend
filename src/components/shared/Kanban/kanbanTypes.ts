export interface KanbanItemData {
  id: string;
  [key: string]: any;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  isDefault?: boolean;
  items: KanbanItemData[];
  [key: string]: any;
}

export interface DragItem {
  type: string;
  id: string;
  columnId: string;
}

export interface KanbanItemProps {
  id: string;
  columnId: string;
  children: React.ReactNode;
  isDraggable?: boolean;
  onItemClick?: (id: string) => void;
  className?: string;
}

export interface KanbanColumnProps {
  id: string;
  title: string;
  items: KanbanItemData[];
  isDefault?: boolean;
  allowDrop?: boolean;
  onDrop: (itemId: string, fromColumnId: string, toColumnId: string) => void;
  onColumnRename?: (columnId: string, newName: string) => void;
  onColumnDelete?: (columnId: string) => void;
  renderItem: (item: KanbanItemData) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  className?: string;
  emptyMessage?: string;
  emptyDropMessage?: string;
}

export interface KanbanBoardProps {
  columns: KanbanColumnData[];
  onItemMove: (
    itemId: string,
    fromColumnId: string,
    toColumnId: string
  ) => void;
  onColumnAdd?: () => void;
  onColumnUpdate?: (
    columnId: string,
    updates: Partial<KanbanColumnData>
  ) => void;
  _onColumnDelete?: (columnId: string) => void;
  renderItem: (item: KanbanItemData, columnId: string) => React.ReactNode;
  renderAddColumnButton?: () => React.ReactNode;
  scrollShadows?: boolean;
  className?: string;
  _dragType?: string;
}

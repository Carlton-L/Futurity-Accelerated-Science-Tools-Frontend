import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  IconButton,
  Menu,
  Button,
} from '@chakra-ui/react';
import { FiMove, FiMoreHorizontal, FiTrash2, FiPlus } from 'react-icons/fi';
import { FaFolder } from 'react-icons/fa6';
import { useDrop, useDrag } from 'react-dnd';

// Import the category delete modal
import CategoryDeleteModal from './CategoryDeleteModal';

// Types and utils
import type { KanbanOrganizerCreationProps, CreationSubject } from './types';
import { getSourceDisplayText, getSourceColor } from './utils';

// Extended props to handle category deletion with subject removal
interface ExtendedKanbanOrganizerCreationProps
  extends KanbanOrganizerCreationProps {
  onCategoryDeleteWithSubjects?: (categoryId: string) => void;
}

// Define column type
interface KanbanColumn {
  id: string;
  title: string;
  isDefault: boolean;
  items: CreationSubject[];
}

// Drag item interface
interface DragItem {
  type: string;
  id: string;
  columnId: string;
  subject: CreationSubject;
}

// Component for rendering individual subject cards with drag functionality
interface SubjectCardProps {
  subject: CreationSubject;
  columnId: string;
  onSubjectRemove: (subjectId: string) => void;
  isLoading: boolean;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  columnId,
  onSubjectRemove,
  isLoading,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'subject',
    item: (): DragItem => ({
      type: 'subject',
      id: subject.id,
      columnId,
      subject,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isLoading,
  });

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSubjectRemove(subject.id);
    },
    [subject.id, onSubjectRemove]
  );

  return (
    <Card.Root
      ref={drag}
      size='sm'
      variant='outline'
      bg='bg.canvas'
      borderColor='border.emphasized'
      _hover={{
        bg: 'bg.hover',
        borderColor: 'border.hover',
      }}
      transition='all 0.2s'
      w='100%'
      opacity={isDragging ? 0.5 : isLoading ? 0.7 : 1}
      cursor={isLoading ? 'default' : 'grab'}
      style={{
        cursor: isDragging ? 'grabbing' : isLoading ? 'default' : 'grab',
      }}
    >
      <Card.Body p={3}>
        <VStack gap={2} align='stretch'>
          <HStack justify='space-between' align='flex-start'>
            <VStack gap={1} align='start' flex='1'>
              <Text
                fontSize='sm'
                fontWeight='medium'
                color='fg'
                lineHeight='1.3'
                fontFamily='body'
              >
                {subject.subjectName}
              </Text>

              <HStack gap={2}>
                <Badge
                  colorScheme={getSourceColor(subject.source)}
                  size='xs'
                  variant='subtle'
                >
                  {getSourceDisplayText(subject.source)}
                </Badge>

                {subject.isNewTerm && (
                  <Badge colorScheme='orange' size='xs' variant='subtle'>
                    New Term
                  </Badge>
                )}

                {subject.originalCategory && (
                  <Badge
                    colorScheme='gray'
                    size='xs'
                    variant='outline'
                    title={`Originally from: ${subject.originalCategory}`}
                  >
                    Moved
                  </Badge>
                )}
              </HStack>
            </VStack>

            <HStack gap={1}>
              <Box color='fg.muted'>
                <FiMove size={12} />
              </Box>

              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton
                    size='xs'
                    variant='ghost'
                    color='fg.muted'
                    _hover={{ color: 'fg', bg: 'bg.hover' }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label='Subject actions'
                    disabled={isLoading}
                  >
                    <FiMoreHorizontal size={12} />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content
                    bg='bg.canvas'
                    borderColor='border.emphasized'
                    boxShadow='lg'
                  >
                    <Menu.Item
                      value='remove'
                      onClick={handleRemove}
                      color='red.500'
                    >
                      <FiTrash2 size={14} />
                      Remove
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            </HStack>
          </HStack>

          {subject.subjectSummary && (
            <Text
              fontSize='xs'
              color='fg.muted'
              lineHeight='1.4'
              fontFamily='body'
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {subject.subjectSummary}
            </Text>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

// Uncategorized Drop Zone Component
interface UncategorizedDropZoneProps {
  uncategorizedCategory: {
    id: string;
    name: string;
    subjects: CreationSubject[];
  };
  onSubjectRemove: (subjectId: string) => void;
  onItemMove: (
    itemId: string,
    fromColumnId: string,
    toColumnId: string
  ) => void;
  isLoading: boolean;
}

const UncategorizedDropZone: React.FC<UncategorizedDropZoneProps> = ({
  uncategorizedCategory,
  onSubjectRemove,
  onItemMove,
  isLoading,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'subject',
    drop: (item: DragItem) => {
      console.log('Dropped item in uncategorized:', item); // Debug log
      if (item.columnId !== uncategorizedCategory.id) {
        onItemMove(item.id, item.columnId, uncategorizedCategory.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <Box
      ref={drop}
      w='100%'
      maxW='100%'
      h='300px' // Fixed height instead of maxH to prevent layout shifts
      overflowX='auto'
      overflowY='auto'
      pb={2}
      borderWidth='2px'
      borderStyle={isOver && canDrop ? 'solid' : 'dashed'}
      borderColor={
        isOver && canDrop ? 'brand' : canDrop ? 'border.hover' : 'transparent'
      }
      borderRadius='md'
      bg={isOver && canDrop ? 'bg.hover' : 'transparent'}
      transition='border-color 0.2s, background-color 0.2s' // Removed 'all' to prevent height transitions
      css={{
        '&::-webkit-scrollbar': {
          height: '6px',
          width: '6px',
        },
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
      {uncategorizedCategory.subjects.length > 0 ? (
        <Box
          display='grid'
          gridTemplateColumns='repeat(auto-fill, minmax(280px, 1fr))'
          gap={3}
          w='100%'
          minW='fit-content'
          p={isOver && canDrop ? 2 : 0}
          h='100%' // Ensure the grid takes full height
        >
          {uncategorizedCategory.subjects.map((subject) => (
            <Box key={subject.id} w='100%' minW='280px'>
              <SubjectCard
                subject={subject}
                columnId={uncategorizedCategory.id}
                onSubjectRemove={onSubjectRemove}
                isLoading={isLoading}
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          p={4}
          textAlign='center'
          border='2px dashed'
          borderColor={isOver && canDrop ? 'brand' : 'border.muted'}
          borderRadius='md'
          bg={isOver && canDrop ? 'bg.subtle' : 'bg.subtle'}
          transition='border-color 0.2s, background-color 0.2s'
          h='100%' // Fixed height for empty state
          display='flex'
          alignItems='center'
          justifyContent='center'
        >
          <VStack gap={2}>
            <Text color='fg.muted' fontSize='sm' fontFamily='body'>
              {isOver && canDrop ? 'Drop here' : 'No uncategorized subjects'}
            </Text>
            <Text color='fg.muted' fontSize='xs' fontFamily='body'>
              Subjects added here can be organized into categories below
            </Text>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

// Custom Kanban Column Component with scrolling and drop zone
interface CustomKanbanColumnProps {
  column: KanbanColumn;
  onItemMove: (
    itemId: string,
    fromColumnId: string,
    toColumnId: string
  ) => void;
  onSubjectRemove: (subjectId: string) => void;
  onCategoryRename: (categoryId: string, newName: string) => void;
  onCategoryDelete: (categoryId: string) => void;
  isLoading: boolean;
}

const CustomKanbanColumn: React.FC<CustomKanbanColumnProps> = ({
  column,
  onItemMove,
  onSubjectRemove,
  onCategoryRename,
  onCategoryDelete,
  isLoading,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.title);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'subject',
    drop: (item: DragItem) => {
      console.log('Dropped item in column:', item, 'column:', column.id); // Debug log
      if (item.columnId !== column.id) {
        onItemMove(item.id, item.columnId, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleRename = useCallback(() => {
    if (editName.trim() && editName.trim() !== column.title) {
      onCategoryRename(column.id, editName.trim());
    }
    setIsEditing(false);
  }, [editName, column.title, column.id, onCategoryRename]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleRename();
      } else if (e.key === 'Escape') {
        setEditName(column.title);
        setIsEditing(false);
      }
    },
    [handleRename, column.title]
  );

  return (
    <Box
      ref={drop}
      w='300px'
      h='400px'
      borderWidth='1px'
      borderColor={
        isOver && canDrop
          ? 'brand'
          : canDrop
          ? 'border.hover'
          : 'border.emphasized'
      }
      borderRadius='md'
      bg={isOver && canDrop ? 'bg.hover' : 'bg.canvas'}
      display='flex'
      flexDirection='column'
      flexShrink={0}
      transition='all 0.2s'
      boxShadow={isOver && canDrop ? 'md' : 'none'}
    >
      <Box
        p={3}
        borderBottomWidth='1px'
        borderBottomColor='border.muted'
        flexShrink={0}
      >
        <HStack justify='space-between' align='center'>
          <HStack gap={2} align='center' flex='1'>
            {isEditing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyPress}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: 'medium',
                  fontFamily: 'inherit',
                  color: 'inherit',
                  width: '100%',
                }}
              />
            ) : (
              <Text
                fontSize='sm'
                fontWeight='medium'
                color='fg'
                fontFamily='heading'
                cursor='pointer'
                onClick={() => setIsEditing(true)}
                flex='1'
              >
                {column.title}
              </Text>
            )}

            <Badge size='sm' variant='subtle'>
              {column.items.length}
            </Badge>
          </HStack>

          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton
                size='xs'
                variant='ghost'
                color='fg.muted'
                _hover={{ color: 'fg', bg: 'bg.hover' }}
                aria-label='Category actions'
                disabled={isLoading}
              >
                <FiMoreHorizontal size={12} />
              </IconButton>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content
                bg='bg.canvas'
                borderColor='border.emphasized'
                boxShadow='lg'
              >
                <Menu.Item value='rename' onClick={() => setIsEditing(true)}>
                  Rename Category
                </Menu.Item>
                <Menu.Item
                  value='delete'
                  onClick={() => onCategoryDelete(column.id)}
                  color='red.500'
                >
                  <FiTrash2 size={14} />
                  Delete Category
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </HStack>
      </Box>

      <Box
        flex='1'
        p={3}
        overflowY='auto'
        css={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
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
        <VStack gap={3} align='stretch'>
          {column.items.length > 0 ? (
            column.items.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                columnId={column.id}
                onSubjectRemove={onSubjectRemove}
                isLoading={isLoading}
              />
            ))
          ) : (
            <Box
              p={4}
              textAlign='center'
              border='2px dashed'
              borderColor={isOver && canDrop ? 'brand' : 'border.muted'}
              borderRadius='md'
              bg={isOver && canDrop ? 'bg.subtle' : 'bg.subtle'}
              transition='all 0.2s'
            >
              <Text color='fg.muted' fontSize='sm' fontFamily='body'>
                {isOver && canDrop ? 'Drop here' : 'No subjects yet'}
              </Text>
              <Text color='fg.muted' fontSize='xs' fontFamily='body'>
                Drag subjects here
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

// Main component
const KanbanOrganizerCreation: React.FC<
  ExtendedKanbanOrganizerCreationProps
> = ({
  categories,
  onSubjectMove,
  onCategoryAdd,
  onCategoryRename,
  onCategoryDelete,
  onSubjectAdd: _onSubjectAdd,
  onSubjectRemove,
  onCategoryDeleteWithSubjects,
  isLoading,
}) => {
  void _onSubjectAdd;

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    categoryId: string;
    categoryName: string;
    subjects: CreationSubject[];
    isProcessing: boolean; // Add processing flag
  }>({
    isOpen: false,
    categoryId: '',
    categoryName: '',
    subjects: [],
    isProcessing: false,
  });

  const uncategorizedCategory = useMemo(() => {
    return categories.find((cat) => cat.id === 'uncategorized');
  }, [categories]);

  const customCategories = useMemo(() => {
    return categories.filter((cat) => cat.type === 'custom');
  }, [categories]);

  const kanbanColumns = useMemo((): KanbanColumn[] => {
    return customCategories.map((category) => ({
      id: category.id,
      title: category.name,
      isDefault: false,
      items: category.subjects,
    }));
  }, [customCategories]);

  const handleSubjectMove = useCallback(
    (itemId: string, fromColumnId: string, toColumnId: string) => {
      console.log('Moving subject:', { itemId, fromColumnId, toColumnId }); // Debug log
      onSubjectMove(itemId, fromColumnId, toColumnId);
    },
    [onSubjectMove]
  );

  const handleAddCategory = useCallback(() => {
    const categoryName = prompt('Enter category name:');
    if (categoryName && categoryName.trim()) {
      onCategoryAdd(categoryName.trim());
    }
  }, [onCategoryAdd]);

  const handleCategoryRename = useCallback(
    (columnId: string, newName: string) => {
      onCategoryRename(columnId, newName);
    },
    [onCategoryRename]
  );

  const handleCategoryDeleteRequest = useCallback(
    (columnId: string) => {
      const category = categories.find((cat) => cat.id === columnId);
      if (!category || category.type === 'default') return;

      // If category is empty, delete immediately without modal
      if (category.subjects.length === 0) {
        onCategoryDelete(columnId);
        return;
      }

      // Show modal for non-empty categories
      setDeleteModal({
        isOpen: true,
        categoryId: columnId,
        categoryName: category.name,
        subjects: category.subjects,
        isProcessing: false,
      });
    },
    [categories, onCategoryDelete]
  );

  const handleCategoryDeleteConfirm = useCallback(
    (action: 'move_to_uncategorized' | 'delete_subjects') => {
      // Prevent multiple clicks
      if (deleteModal.isProcessing) {
        console.log('Already processing, ignoring click');
        return;
      }

      console.log(
        'Delete action:',
        action,
        'Category:',
        deleteModal.categoryId
      ); // Debug log

      // Set processing flag to prevent multiple clicks
      setDeleteModal((prev) => ({ ...prev, isProcessing: true }));

      // Store the category ID before clearing the modal state
      const categoryId = deleteModal.categoryId;

      // Close modal after a short delay to ensure processing flag is set
      setTimeout(() => {
        setDeleteModal({
          isOpen: false,
          categoryId: '',
          categoryName: '',
          subjects: [],
          isProcessing: false,
        });
      }, 100);

      // Execute the action after ensuring modal starts closing
      setTimeout(() => {
        try {
          if (action === 'move_to_uncategorized') {
            console.log(
              'Moving subjects to uncategorized for category:',
              categoryId
            );
            onCategoryDelete(categoryId);
          } else {
            console.log('Deleting category with subjects:', categoryId);
            if (onCategoryDeleteWithSubjects) {
              onCategoryDeleteWithSubjects(categoryId);
            } else {
              console.warn(
                'onCategoryDeleteWithSubjects not provided, falling back to move'
              );
              onCategoryDelete(categoryId);
            }
          }
          console.log('Delete operation completed');
        } catch (error) {
          console.error('Error during delete operation:', error);
        }
      }, 150);
    },
    [
      deleteModal.categoryId,
      deleteModal.isProcessing,
      onCategoryDelete,
      onCategoryDeleteWithSubjects,
    ]
  );

  const handleCategoryDeleteCancel = useCallback(() => {
    console.log('Modal cancelled'); // Debug log
    setDeleteModal({
      isOpen: false,
      categoryId: '',
      categoryName: '',
      subjects: [],
      isProcessing: false,
    });
  }, []);

  return (
    <VStack gap={4} align='stretch'>
      <HStack justify='space-between' align='center'>
        <VStack gap={1} align='start'>
          <Text
            fontSize='md'
            fontWeight='medium'
            color='fg'
            fontFamily='heading'
          >
            Subject Organization
          </Text>
          <Text fontSize='sm' color='fg.muted' fontFamily='body'>
            Drag and drop subjects between categories to organize your lab
          </Text>
        </VStack>

        <HStack gap={2}>
          <Text fontSize='xs' color='fg.muted' fontFamily='body'>
            Total:{' '}
            {categories.reduce((sum, cat) => sum + cat.subjects.length, 0)}{' '}
            subjects
          </Text>
        </HStack>
      </HStack>

      <Box
        p={4}
        borderRadius='md'
        borderWidth='1px'
        borderColor='border.emphasized'
        position='relative'
        zIndex={1}
      >
        <VStack gap={3} align='stretch'>
          <HStack gap={2} align='center'>
            <FaFolder size={16} color='var(--chakra-colors-fg-muted)' />
            <Text
              fontSize='sm'
              fontWeight='medium'
              color='fg'
              fontFamily='heading'
            >
              {uncategorizedCategory?.name || 'Uncategorized'}
            </Text>
            <Badge size='sm' variant='subtle'>
              {uncategorizedCategory?.subjects.length || 0}
            </Badge>
          </HStack>

          {uncategorizedCategory && (
            <UncategorizedDropZone
              uncategorizedCategory={uncategorizedCategory}
              onSubjectRemove={onSubjectRemove}
              onItemMove={handleSubjectMove}
              isLoading={isLoading}
            />
          )}
        </VStack>
      </Box>

      <VStack gap={4} align='stretch'>
        <HStack justify='space-between' align='center'>
          <Text
            fontSize='md'
            fontWeight='medium'
            color='fg'
            fontFamily='heading'
          >
            Categories
          </Text>
          <Button
            size='sm'
            variant='outline'
            onClick={handleAddCategory}
            disabled={isLoading}
            leftIcon={<FiPlus size={14} />}
            bg='bg.canvas'
            borderColor='border.emphasized'
            color='fg'
            _hover={{ bg: 'bg.hover' }}
            fontFamily='heading'
          >
            Add Category
          </Button>
        </HStack>

        {kanbanColumns.length > 0 ? (
          <Box
            w='100%'
            overflowX='auto'
            pb={2}
            css={{
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'var(--chakra-colors-bg-subtle)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--chakra-colors-border-muted)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'var(--chakra-colors-border-emphasized)',
              },
            }}
          >
            <HStack gap={4} align='start' w='fit-content' minW='100%'>
              {kanbanColumns.map((column) => (
                <CustomKanbanColumn
                  key={column.id}
                  column={column}
                  onItemMove={handleSubjectMove}
                  onSubjectRemove={onSubjectRemove}
                  onCategoryRename={handleCategoryRename}
                  onCategoryDelete={handleCategoryDeleteRequest}
                  isLoading={isLoading}
                />
              ))}
            </HStack>
          </Box>
        ) : (
          <Box
            p={6}
            textAlign='center'
            border='2px dashed'
            borderColor='border.muted'
            borderRadius='md'
            bg='bg.subtle'
          >
            <VStack gap={3}>
              <Text fontSize='md' color='fg.muted' fontFamily='heading'>
                No custom categories
              </Text>
              <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                Create categories to organize your subjects beyond
                "Uncategorized"
              </Text>
              <Button
                onClick={handleAddCategory}
                size='sm'
                variant='solid'
                bg='brand'
                color='white'
                _hover={{ bg: 'brand.hover' }}
                disabled={isLoading}
                fontFamily='heading'
                leftIcon={<FiPlus size={14} />}
              >
                Create First Category
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>

      <CategoryDeleteModal
        isOpen={deleteModal.isOpen}
        categoryName={deleteModal.categoryName}
        subjectsInCategory={deleteModal.subjects}
        onConfirm={handleCategoryDeleteConfirm}
        onCancel={handleCategoryDeleteCancel}
      />
    </VStack>
  );
};

export default KanbanOrganizerCreation;

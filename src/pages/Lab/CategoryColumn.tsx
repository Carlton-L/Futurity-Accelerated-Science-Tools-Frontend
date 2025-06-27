import React, { useState, useCallback } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  IconButton,
  Dialog,
  Button,
  Checkbox,
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi'; // Changed from FiTag to FaFolderTree
import { KanbanColumn } from '../../components/shared/Kanban';
import type { LabSubject, SubjectCategory } from './types';
import { CategoryUtils } from './types';
import { FaFolderTree } from 'react-icons/fa6';

interface CategoryColumnProps {
  category: SubjectCategory;
  onSubjectMove: (
    subjectId: string,
    fromCategoryId: string,
    toCategoryId: string
  ) => Promise<void>;
  onCategoryRename: (categoryId: string, newName: string) => Promise<void>;
  onCategoryDelete: (
    categoryId: string,
    moveSubjectsToUncategorized: boolean
  ) => Promise<void>;
  renderSubjectCard: (subject: LabSubject) => React.ReactNode;
  isLoading: boolean;
  userRole: 'reader' | 'editor' | 'admin';
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({
  category,
  onSubjectMove,
  onCategoryRename,
  onCategoryDelete,
  renderSubjectCard,
  isLoading,
  userRole,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [moveSubjectsToUncategorized, setMoveSubjectsToUncategorized] =
    useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // NOTE: Only editors and admins can modify categories, and only custom categories can be edited/deleted
  const canEdit = userRole === 'editor' || userRole === 'admin';
  const canRename = canEdit && CategoryUtils.canRename(category);
  const canDelete = canEdit && CategoryUtils.canDelete(category);

  const handleRename = useCallback(async () => {
    if (!canRename || !editName.trim() || editName === category.name) {
      setIsEditing(false);
      return;
    }

    setIsRenaming(true);
    try {
      await onCategoryRename(category.id, editName.trim());
      setIsEditing(false);
    } catch {
      // Error handling is done in parent component
      setEditName(category.name); // Revert on error
    } finally {
      setIsRenaming(false);
    }
  }, [canRename, editName, category.name, category.id, onCategoryRename]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleRename();
      } else if (e.key === 'Escape') {
        setEditName(category.name);
        setIsEditing(false);
      }
    },
    [handleRename, category.name]
  );

  const handleTitleClick = useCallback(() => {
    if (canRename && !isLoading) {
      setIsEditing(true);
    }
  }, [canRename, isLoading]);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onCategoryDelete(category.id, moveSubjectsToUncategorized);
      setIsDeleteDialogOpen(false);
      setMoveSubjectsToUncategorized(true);
    } catch {
      // Error handling is done in parent component
    } finally {
      setIsDeleting(false);
    }
  }, [category.id, moveSubjectsToUncategorized, onCategoryDelete]);

  // CRITICAL: Handle drag-and-drop properly
  const handleDrop = useCallback(
    async (itemId: string, fromColumnId: string, toColumnId: string) => {
      console.log('CategoryColumn: Drop event', {
        itemId,
        fromColumnId,
        toColumnId,
      });

      // Find the subject that's being moved in any category (not just this one)
      // The itemId is the frontend ID, we need to find the actual subject
      // We'll let the parent component handle finding the subject
      await onSubjectMove(itemId, fromColumnId, toColumnId);
    },
    [onSubjectMove]
  );

  const renderHeader = useCallback(
    () => (
      <HStack justify='space-between' align='center'>
        <HStack gap={2} flex='1'>
          {/* Changed from FiTag to FaFolderTree for Categories/Subcategories */}
          <FaFolderTree size={14} color='var(--chakra-colors-fg-muted)' />
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
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
              disabled={isRenaming}
            />
          ) : (
            <HStack gap={1} flex='1'>
              <Text
                fontSize='sm'
                fontWeight='medium'
                color='fg'
                cursor={canRename ? 'pointer' : 'default'}
                onClick={handleTitleClick}
                _hover={canRename ? { color: 'brand' } : {}}
                transition='color 0.2s'
                flex='1'
                fontFamily='heading'
              >
                {category.name}
              </Text>
            </HStack>
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
            {category.subjects.length}
          </Box>
        </HStack>

        {canEdit && (
          <HStack gap={1}>
            {/* Edit Button - Only show for custom categories */}
            {canRename && !isEditing && (
              <IconButton
                size='xs'
                variant='ghost'
                color='fg.muted'
                _hover={{ color: 'brand', bg: 'bg.hover' }}
                onClick={() => setIsEditing(true)}
                aria-label='Edit category name'
                disabled={isLoading || isRenaming}
              >
                <FiEdit2 size={12} />
              </IconButton>
            )}

            {/* Delete Button - Only show for custom categories */}
            {canDelete && (
              <IconButton
                size='xs'
                variant='ghost'
                color='fg.muted'
                _hover={{ color: 'red.500', bg: 'bg.hover' }}
                onClick={() => setIsDeleteDialogOpen(true)}
                aria-label='Delete category'
                disabled={isLoading || isDeleting}
              >
                <FiTrash2 size={12} />
              </IconButton>
            )}
          </HStack>
        )}
      </HStack>
    ),
    [
      isEditing,
      editName,
      handleRename,
      handleKeyPress,
      category,
      canEdit,
      canRename,
      canDelete,
      isLoading,
      isRenaming,
      isDeleting,
      handleTitleClick,
    ]
  );

  const renderFooter = useCallback(() => {
    if (CategoryUtils.isDefault(category)) {
      return (
        <Text
          fontSize='xs'
          color='fg.muted'
          textAlign='center'
          fontFamily='body'
        >
          New subjects added here
        </Text>
      );
    }
    return null;
  }, [category]);

  return (
    <>
      <KanbanColumn
        id={category.id}
        title={category.name}
        items={category.subjects}
        isDefault={CategoryUtils.isDefault(category)}
        onDrop={handleDrop} // Use our custom handler
        renderItem={(item) => renderSubjectCard(item as LabSubject)}
        renderHeader={renderHeader}
        renderFooter={renderFooter}
        emptyMessage='No subjects'
        emptyDropMessage='Drop subject here'
      />

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={({ open }) => setIsDeleteDialogOpen(open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg='bg.canvas' borderColor='border.emphasized'>
            <Dialog.Header>
              <Dialog.Title color='fg' fontFamily='heading'>
                Delete Category
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align='stretch'>
                <Text color='fg' fontFamily='body'>
                  Are you sure you want to delete the category "{category.name}
                  "?
                </Text>

                {category.subjects.length > 0 && (
                  <Box>
                    <Text
                      fontSize='sm'
                      color='fg.muted'
                      mb={2}
                      fontFamily='body'
                    >
                      This category contains {category.subjects.length} subject
                      {category.subjects.length !== 1 ? 's' : ''}.
                    </Text>
                    <Checkbox.Root
                      checked={moveSubjectsToUncategorized}
                      onCheckedChange={(details) =>
                        setMoveSubjectsToUncategorized(!!details.checked)
                      }
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label
                        fontSize='sm'
                        color='fg'
                        fontFamily='body'
                      >
                        Move subjects to "Uncategorized" category
                      </Checkbox.Label>
                    </Checkbox.Root>
                    {!moveSubjectsToUncategorized && (
                      <Text
                        fontSize='xs'
                        color='red.500'
                        mt={1}
                        fontFamily='body'
                      >
                        Warning: Subjects will be permanently removed from this
                        lab.
                      </Text>
                    )}
                  </Box>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <HStack gap={3}>
                <Button
                  variant='outline'
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                  color='fg'
                  borderColor='border.emphasized'
                  bg='bg.canvas'
                  _hover={{ bg: 'bg.hover' }}
                  fontFamily='body'
                >
                  Cancel
                </Button>
                <Button
                  variant='solid'
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  bg='red.500'
                  color='white'
                  _hover={{ bg: 'red.600' }}
                  fontFamily='body'
                >
                  Delete Category
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};

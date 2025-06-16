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
  Tooltip,
} from '@chakra-ui/react';
import { FiTag, FiEdit2, FiTrash2, FiInfo, FiEyeOff } from 'react-icons/fi';
import { KanbanColumn } from '../../components/shared/Kanban';
import type { LabSubject, SubjectCategory } from './types';
import { CategoryUtils } from './types';

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

  const renderHeader = useCallback(
    () => (
      <HStack justify='space-between' align='center'>
        <HStack gap={2} flex='1'>
          {/* Category Icon - different for exclude vs default/custom */}
          {CategoryUtils.isExclude(category) ? (
            <FiEyeOff size={14} color='orange.400' />
          ) : (
            <FiTag size={14} color='gray.400' />
          )}

          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyPress}
              size='sm'
              autoFocus
              bg='gray.700'
              borderColor='gray.500'
              color='white'
              _focus={{ borderColor: 'blue.400' }}
              fontSize='sm'
              disabled={isRenaming}
            />
          ) : (
            <HStack gap={1} flex='1'>
              <Text
                fontSize='sm'
                fontWeight='medium'
                color={
                  CategoryUtils.isExclude(category) ? 'orange.300' : 'white'
                }
                cursor={canRename ? 'pointer' : 'default'}
                onClick={handleTitleClick}
                _hover={canRename ? { color: 'blue.300' } : {}}
                transition='color 0.2s'
                flex='1'
              >
                {category.name}
              </Text>

              {/* Info tooltip for exclude category */}
              {CategoryUtils.isExclude(category) && (
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Box
                      color='orange.400'
                      cursor='help'
                      _hover={{ color: 'orange.300' }}
                    >
                      <FiInfo size={12} />
                    </Box>
                  </Tooltip.Trigger>
                  <Tooltip.Positioner>
                    <Tooltip.Content>
                      <Tooltip.Arrow />
                      <Box maxW='250px' p={2}>
                        <Text fontSize='sm' fontWeight='medium' mb={1}>
                          Exclude from Analysis
                        </Text>
                        <Text fontSize='xs' lineHeight='1.4'>
                          Subjects in this category will be excluded from search
                          results and analysis. Use this to filter out
                          irrelevant topics (e.g., exclude "food" when
                          researching oil if you only want petroleum-related
                          results).
                        </Text>
                      </Box>
                    </Tooltip.Content>
                  </Tooltip.Positioner>
                </Tooltip.Root>
              )}
            </HStack>
          )}

          <Box
            bg={CategoryUtils.isExclude(category) ? 'orange.600' : 'gray.600'}
            color={
              CategoryUtils.isExclude(category) ? 'orange.100' : 'gray.200'
            }
            fontSize='xs'
            px={2}
            py={1}
            borderRadius='md'
            minW='20px'
            textAlign='center'
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
                color='gray.400'
                _hover={{ color: 'blue.300', bg: 'gray.700' }}
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
                color='red.400'
                _hover={{ color: 'red.300', bg: 'red.900' }}
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
        <Text fontSize='xs' color='gray.500' textAlign='center'>
          New subjects added here
        </Text>
      );
    } else if (CategoryUtils.isExclude(category)) {
      return (
        <Text fontSize='xs' color='orange.500' textAlign='center'>
          Excluded from analysis
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
        onDrop={onSubjectMove}
        renderItem={(item) => renderSubjectCard(item as LabSubject)}
        renderHeader={renderHeader}
        renderFooter={renderFooter}
        emptyMessage='No subjects'
        emptyDropMessage={
          CategoryUtils.isExclude(category)
            ? 'Drop to exclude'
            : 'Drop subject here'
        }
      />

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={({ open }) => setIsDeleteDialogOpen(open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete Category</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align='stretch'>
                <Text>
                  Are you sure you want to delete the category "{category.name}
                  "?
                </Text>

                {category.subjects.length > 0 && (
                  <Box>
                    <Text fontSize='sm' color='gray.600' mb={2}>
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
                      <Checkbox.Label fontSize='sm'>
                        Move subjects to "Uncategorized" category
                      </Checkbox.Label>
                    </Checkbox.Root>
                    {!moveSubjectsToUncategorized && (
                      <Text fontSize='xs' color='red.500' mt={1}>
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
                >
                  Cancel
                </Button>
                <Button
                  colorScheme='red'
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
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

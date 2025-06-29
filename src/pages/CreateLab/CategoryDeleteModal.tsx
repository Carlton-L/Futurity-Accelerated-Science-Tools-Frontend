import React, { useCallback } from 'react';
import {
  Dialog,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Badge,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiTrash2, FiFolder } from 'react-icons/fi';

// Types
import type { CreationSubject } from './types';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  categoryName: string;
  subjectsInCategory: CreationSubject[];
  onConfirm: (action: 'move_to_uncategorized' | 'delete_subjects') => void;
  onCancel: () => void;
}

const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  isOpen,
  categoryName,
  subjectsInCategory,
  onConfirm,
  onCancel,
}) => {
  const handleMoveToUncategorized = useCallback(() => {
    console.log('Move to uncategorized clicked'); // Debug log
    onConfirm('move_to_uncategorized');
  }, [onConfirm]);

  const handleDeleteSubjects = useCallback(() => {
    console.log('Delete subjects clicked'); // Debug log
    onConfirm('delete_subjects');
  }, [onConfirm]);

  const subjectCount = subjectsInCategory.length;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => {
        console.log('Modal open state changed:', open); // Debug log
        if (!open) {
          onCancel();
        }
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg='bg.canvas'
          borderColor='border.emphasized'
          maxW='lg'
          w='90vw'
        >
          <Dialog.Header>
            <HStack gap={3} align='center'>
              <FiAlertTriangle size={20} color='var(--chakra-colors-warning)' />
              <VStack gap={0} align='start'>
                <Dialog.Title color='fg' fontFamily='heading'>
                  Delete Category
                </Dialog.Title>
                <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                  What should happen to the subjects in this category?
                </Text>
              </VStack>
            </HStack>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} align='stretch'>
              {/* Category info */}
              <Box
                p={3}
                bg='bg.subtle'
                borderRadius='md'
                borderWidth='1px'
                borderColor='border.muted'
              >
                <VStack gap={2} align='start'>
                  <HStack gap={2} align='center'>
                    <FiTrash2 size={16} color='var(--chakra-colors-error)' />
                    <Text
                      fontSize='md'
                      fontWeight='medium'
                      color='fg'
                      fontFamily='heading'
                    >
                      "{categoryName}"
                    </Text>
                  </HStack>

                  <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                    This category contains{' '}
                    <Badge colorScheme='blue' variant='subtle'>
                      {subjectCount}
                    </Badge>{' '}
                    subject{subjectCount !== 1 ? 's' : ''}
                  </Text>

                  {/* Show some subjects */}
                  {subjectCount > 0 && (
                    <Box>
                      <Text
                        fontSize='xs'
                        color='fg.muted'
                        fontFamily='body'
                        mb={1}
                      >
                        Subjects in this category:
                      </Text>
                      <VStack gap={1} align='start'>
                        {subjectsInCategory.slice(0, 3).map((subject) => (
                          <Text
                            key={subject.id}
                            fontSize='xs'
                            color='fg.secondary'
                            fontFamily='body'
                          >
                            • {subject.subjectName}
                          </Text>
                        ))}
                        {subjectCount > 3 && (
                          <Text
                            fontSize='xs'
                            color='fg.muted'
                            fontFamily='body'
                          >
                            ... and {subjectCount - 3} more
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Box>

              {/* Action options */}
              <VStack gap={3} align='stretch'>
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  color='fg'
                  fontFamily='heading'
                >
                  Choose an action:
                </Text>

                {/* Move to uncategorized option */}
                <Box
                  p={3}
                  border='1px solid'
                  borderColor='brand'
                  borderRadius='md'
                  bg='bg.hover'
                  cursor='pointer'
                  onClick={handleMoveToUncategorized}
                  _hover={{
                    borderColor: 'brand.hover',
                    bg: 'bg.active',
                  }}
                  transition='all 0.2s'
                >
                  <HStack gap={3} align='start'>
                    <Box mt={1}>
                      <FiFolder size={16} color='var(--chakra-colors-brand)' />
                    </Box>
                    <VStack gap={1} align='start' flex='1'>
                      <Text
                        fontSize='sm'
                        fontWeight='medium'
                        color='brand'
                        fontFamily='heading'
                      >
                        Move to Uncategorized (Recommended)
                      </Text>
                      <Text
                        fontSize='xs'
                        color='fg.secondary'
                        fontFamily='body'
                        lineHeight='1.4'
                      >
                        Keep all subjects and move them to the "Uncategorized"
                        section. You can reorganize them later.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {/* Delete subjects option */}
                <Box
                  p={3}
                  border='1px solid'
                  borderColor='error'
                  borderRadius='md'
                  bg='errorSubtle'
                  cursor='pointer'
                  onClick={handleDeleteSubjects}
                  _hover={{
                    borderColor: 'error',
                    bg: 'errorSubtle',
                  }}
                  transition='all 0.2s'
                >
                  <HStack gap={3} align='start'>
                    <Box mt={1}>
                      <FiTrash2 size={16} color='var(--chakra-colors-error)' />
                    </Box>
                    <VStack gap={1} align='start' flex='1'>
                      <Text
                        fontSize='sm'
                        fontWeight='medium'
                        color='error'
                        fontFamily='heading'
                      >
                        Delete All Subjects
                      </Text>
                      <Text
                        fontSize='xs'
                        color='fg.secondary'
                        fontFamily='body'
                        lineHeight='1.4'
                      >
                        Permanently remove the category and all {subjectCount}{' '}
                        subjects in it. This action cannot be undone.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <Button
              variant='outline'
              onClick={onCancel}
              color='fg'
              borderColor='border.emphasized'
              bg='bg.canvas'
              _hover={{ bg: 'bg.hover' }}
              fontFamily='heading'
            >
              Cancel
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default CategoryDeleteModal;

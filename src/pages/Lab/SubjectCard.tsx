import React from 'react';
import { Card, Text, VStack, HStack, Menu, Box } from '@chakra-ui/react';
import { FiMove, FiMoreHorizontal, FiEye, FiTrash2 } from 'react-icons/fi';
import { KanbanItem } from '../../components/shared/Kanban';
import type { LabSubject } from './types';

interface SubjectCardProps {
  subject: LabSubject;
  categoryId: string;
  onSubjectClick: (subject: LabSubject) => void;
  onSubjectRemove: (subjectId: string, categoryId: string) => void;
  onSubjectView: (subject: LabSubject) => void;
  isLoading?: boolean;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  categoryId,
  onSubjectClick,
  onSubjectRemove,
  onSubjectView,
  isLoading = false,
}) => {
  const handleRemoveSubject = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(
      'Removing subject:',
      subject.subjectId,
      'from category:',
      categoryId
    );
    // Use the actual subject ID from the database, not the frontend ID
    onSubjectRemove(subject.subjectId, categoryId);
  };

  const handleViewSubject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSubjectView(subject);
  };

  return (
    <KanbanItem
      id={subject.id} // Frontend ID for kanban
      columnId={categoryId}
      onItemClick={() => onSubjectClick(subject)}
      isDraggable={!isLoading}
    >
      <Card.Root
        size='sm'
        variant='outline'
        bg='bg.canvas' // Apply proper theme background
        borderColor='border.emphasized'
        _hover={{
          bg: 'bg.hover',
          borderColor: 'border.hover',
        }}
        transition='all 0.2s'
        mb={3}
        w='100%'
        opacity={isLoading ? 0.7 : 1}
      >
        <Card.Body p={3}>
          <VStack gap={2} align='stretch'>
            <HStack justify='space-between' align='flex-start'>
              <Text
                fontSize='sm'
                fontWeight='medium'
                color='fg' // Apply proper theme foreground color
                flex='1'
                lineHeight='1.3'
                fontFamily='body'
              >
                {subject.subjectName}
              </Text>
              <HStack gap={1}>
                {/* Drag handle - visual indicator only */}
                <Box color='fg.muted' cursor='grab'>
                  <FiMove size={10} />
                </Box>

                {/* Actions menu */}
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Box
                      as='button'
                      p={1}
                      borderRadius='sm'
                      color='fg.muted'
                      _hover={{ color: 'fg', bg: 'bg.hover' }}
                      cursor='pointer'
                      onClick={(e) => e.stopPropagation()}
                      aria-label='Subject actions'
                      _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
                      style={{ opacity: isLoading ? 0.5 : 1 }}
                    >
                      <FiMoreHorizontal size={10} />
                    </Box>
                  </Menu.Trigger>
                  <Menu.Positioner>
                    <Menu.Content
                      bg='bg.canvas'
                      borderColor='border.emphasized'
                      zIndex={9999} // High z-index to appear above cards
                      boxShadow='lg'
                    >
                      <Menu.Item value='view' onClick={handleViewSubject}>
                        <FiEye size={14} />
                        View Subject
                      </Menu.Item>
                      <Menu.Item
                        value='remove'
                        onClick={handleRemoveSubject}
                        color='red.500'
                      >
                        <FiTrash2 size={14} />
                        Remove from Lab
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Root>
              </HStack>
            </HStack>

            {/* Subject metadata */}
            <HStack justify='space-between' mt={2}>
              <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                ID: {subject.subjectId}
              </Text>
              <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                {subject.subjectSlug}
              </Text>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </KanbanItem>
  );
};

export default SubjectCard;

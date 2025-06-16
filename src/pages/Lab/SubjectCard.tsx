import React from 'react';
import {
  Card,
  Text,
  VStack,
  HStack,
  Menu,
  Tooltip,
  Box,
} from '@chakra-ui/react';
import { FiMove, FiMoreHorizontal, FiEye, FiTrash2 } from 'react-icons/fi';
import { KanbanItem } from '../../components/shared/Kanban';
import type { LabSubject } from './types';

interface SubjectCardProps {
  subject: LabSubject;
  categoryId: string;
  onSubjectClick: (subject: LabSubject) => void;
  onSubjectRemove: (subjectId: string, categoryId: string) => void;
  onSubjectView: (subject: LabSubject) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  categoryId,
  onSubjectClick,
  onSubjectRemove,
  onSubjectView,
}) => {
  // Check if description needs truncation
  const needsTruncation = subject.notes && subject.notes.length > 60;
  const truncatedNotes = needsTruncation
    ? subject.notes?.substring(0, 60) + '...'
    : subject.notes;

  const handleRemoveSubject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSubjectRemove(subject.id, categoryId);
  };

  const handleViewSubject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSubjectView(subject);
  };

  return (
    <KanbanItem
      id={subject.id}
      columnId={categoryId}
      onItemClick={() => onSubjectClick(subject)}
      isDraggable={true}
    >
      <Card.Root
        size='sm'
        variant='outline'
        _hover={{ bg: 'gray.50', borderColor: 'blue.300' }}
        transition='all 0.2s'
        mb={3}
        w='100%'
      >
        <Card.Body p={3}>
          <VStack gap={2} align='stretch'>
            <HStack justify='space-between' align='flex-start'>
              <Text
                fontSize='sm'
                fontWeight='medium'
                color='blue.600'
                flex='1'
                lineHeight='1.3'
              >
                {subject.subjectName}
              </Text>
              <HStack gap={1}>
                {/* Drag handle - visual indicator only */}
                <Box color='gray.400' cursor='grab'>
                  <FiMove size={10} />
                </Box>

                {/* Actions menu */}
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Box
                      as='button'
                      p={1}
                      borderRadius='sm'
                      color='gray.400'
                      _hover={{ color: 'gray.600', bg: 'gray.100' }}
                      cursor='pointer'
                      onClick={(e) => e.stopPropagation()}
                      aria-label='Subject actions'
                    >
                      <FiMoreHorizontal size={10} />
                    </Box>
                  </Menu.Trigger>
                  <Menu.Positioner>
                    <Menu.Content>
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
            {subject.notes && (
              <Box>
                <Text fontSize='xs' color='gray.500' lineHeight='1.3'>
                  {truncatedNotes}
                  {needsTruncation && (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <Text
                          as='span'
                          textDecoration='underline'
                          color='blue.500'
                          cursor='help'
                          ml={1}
                        >
                          more
                        </Text>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content>
                          <Tooltip.Arrow />
                          <Text fontSize='xs' maxW='300px' whiteSpace='normal'>
                            {subject.notes}
                          </Text>
                        </Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>
                  )}
                </Text>
              </Box>
            )}
            <Text fontSize='xs' color='gray.400'>
              {new Date(subject.addedAt).toLocaleDateString()}
            </Text>
          </VStack>
        </Card.Body>
      </Card.Root>
    </KanbanItem>
  );
};

export default SubjectCard;

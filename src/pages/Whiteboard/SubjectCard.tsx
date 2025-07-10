import React from 'react';
import {
  Card,
  Text,
  VStack,
  HStack,
  Menu,
  Box,
  IconButton,
  Link,
} from '@chakra-ui/react';
import {
  FiMove,
  FiMoreHorizontal,
  FiEye,
  FiTrash2,
  FiPlus,
} from 'react-icons/fi';
import { useDrag } from 'react-dnd';
import { Link as RouterLink } from 'react-router-dom';
import type { WhiteboardSubject } from './types';
import { getMetricValue } from './types';

// Blue hexagon icon component for subjects
const SubjectHexagonIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M12 2L20.196 7V17L12 22L3.804 17V7L12 2Z'
      fill='#0005E9'
      stroke='#0005E9'
      strokeWidth='1'
      strokeLinejoin='round'
    />
  </svg>
);

interface WhiteboardSubjectCardProps {
  subject: WhiteboardSubject;
  sourceType: 'whiteboard' | 'labSeed';
  labSeedId?: string; // Only provided if sourceType is 'labSeed'
  showQuickActions?: boolean;
  onRemoveFromWhiteboard?: (subjectFsid: string) => void;
  onRemoveFromLabSeed?: (labSeedId: string, subjectFsid: string) => void;
  onViewSubject?: (subject: WhiteboardSubject) => void;
  onQuickAddToLabSeed?: (subjectFsid: string) => void;
}

interface MetricBarProps {
  label: string;
  value: number | null;
  color: string;
}

const MetricBar: React.FC<MetricBarProps> = ({ label, value, color }) => {
  // Convert hex color to rgba with 20% opacity for background
  const getColorWithOpacity = (
    hexColor: string,
    opacity: number = 0.2
  ): string => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const backgroundBarColor = getColorWithOpacity(color, 0.2);

  if (value === null) {
    return (
      <HStack justify='space-between' align='center' position='relative'>
        <Text
          fontSize='xs'
          color='fg.muted'
          fontFamily='mono'
          fontWeight='medium'
        >
          {label}
        </Text>
        {/* Background bar */}
        <Box
          position='absolute'
          left='20px'
          right='28px'
          height='3px'
          bg={backgroundBarColor}
          borderRadius='full'
          opacity={0.5}
          zIndex={1}
        />
        <Text
          fontSize='xs'
          color='fg.muted'
          fontFamily='mono'
          fontStyle='italic'
          zIndex={2}
        >
          n/c
        </Text>
      </HStack>
    );
  }

  return (
    <HStack justify='space-between' align='center' position='relative'>
      <Text
        fontSize='xs'
        color='fg.muted'
        fontFamily='mono'
        fontWeight='medium'
        zIndex={2}
      >
        {label}
      </Text>
      {/* Background bar */}
      <Box
        position='absolute'
        left='20px'
        right='28px'
        height='3px'
        bg={backgroundBarColor}
        borderRadius='full'
        zIndex={1}
      />
      {/* Progress bar (colored) - value is 0-10, so convert to percentage */}
      <Box
        position='absolute'
        left='20px'
        height='3px'
        bg={color}
        borderRadius='full'
        width={`${(value / 10) * 100}%`}
        maxWidth='calc(100% - 48px)'
        transition='width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        zIndex={2}
      />
      <Text
        fontSize='xs'
        color='fg'
        fontFamily='mono'
        fontWeight='bold'
        zIndex={2}
      >
        {value.toFixed(1)}
      </Text>
    </HStack>
  );
};

// Drag and drop types
const ItemTypes = {
  SUBJECT: 'subject',
};

interface DragItem {
  type: string;
  fsid: string;
  sourceType: 'whiteboard' | 'labSeed';
  sourceLabSeedId?: string;
}

const WhiteboardSubjectCard: React.FC<WhiteboardSubjectCardProps> = ({
  subject,
  sourceType,
  labSeedId,
  showQuickActions = false,
  onRemoveFromWhiteboard,
  onRemoveFromLabSeed,
  onViewSubject,
  onQuickAddToLabSeed,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SUBJECT,
    item: {
      type: ItemTypes.SUBJECT,
      fsid: subject.ent_fsid,
      sourceType,
      sourceLabSeedId: labSeedId,
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleRemoveFromWhiteboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromWhiteboard) {
      onRemoveFromWhiteboard(subject.ent_fsid);
    }
  };

  const handleRemoveFromLabSeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromLabSeed && labSeedId) {
      onRemoveFromLabSeed(labSeedId, subject.ent_fsid);
    }
  };

  const handleViewSubject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewSubject) {
      onViewSubject(subject);
    }
  };

  // Generate the subject URL for proper link behavior
  const subjectUrl = `/subject/${
    subject.ent_fsid.startsWith('fsid_')
      ? subject.ent_fsid.substring(5)
      : subject.ent_fsid
  }`;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickAddToLabSeed) {
      onQuickAddToLabSeed(subject.ent_fsid);
    }
  };

  // Get metric values
  const hrValue = getMetricValue(subject, 'HR');
  const ttValue = getMetricValue(subject, 'TT');
  const wsValue = getMetricValue(subject, 'WS');

  return (
    <Card.Root
      ref={drag}
      size='sm'
      variant='outline'
      mb={3}
      opacity={isDragging ? 0.5 : 1}
      cursor='grab'
      _hover={{
        bg: 'bg.hover',
        borderColor: 'brand',
        boxShadow: 'md',
      }}
      transition='all 0.2s'
      bg='bg.canvas'
      border='1px solid'
      borderColor='border.emphasized'
    >
      <Card.Body p={3}>
        <VStack gap={2} align='stretch'>
          <HStack justify='space-between' align='flex-start'>
            <HStack gap={2} flex='1' align='start'>
              <SubjectHexagonIcon size={24} />
              <Text fontSize='sm' fontWeight='medium' color='fg' flex='1'>
                {subject.ent_name}
              </Text>
            </HStack>
            <HStack gap={1}>
              {/* Quick add button for whiteboard subjects */}
              {showQuickActions &&
                sourceType === 'whiteboard' &&
                onQuickAddToLabSeed && (
                  <IconButton
                    size='xs'
                    variant='ghost'
                    aria-label='Quick add to lab seed'
                    onClick={handleQuickAdd}
                    color='fg.muted'
                    _hover={{ color: 'success', bg: 'successSubtle' }}
                  >
                    <FiPlus size={10} />
                  </IconButton>
                )}

              {/* Drag handle */}
              <Box color='fg.muted' cursor='grab'>
                <FiMove size={10} />
              </Box>

              {/* Actions menu */}
              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton
                    size='xs'
                    variant='ghost'
                    aria-label='Subject actions'
                    onClick={(e) => e.stopPropagation()}
                    color='fg.muted'
                  >
                    <FiMoreHorizontal size={12} />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    {/* View Subject option - as a proper link for context menu support */}
                    <Box
                      as={RouterLink}
                      to={subjectUrl}
                      display='flex'
                      alignItems='center'
                      gap={2}
                      color='fg'
                      textDecoration='none'
                      _hover={{ bg: 'bg.hover', textDecoration: 'none' }}
                      _focus={{ outline: 'none', boxShadow: 'none' }}
                      _focusVisible={{ outline: 'none', boxShadow: 'none' }}
                      px={3}
                      py={2}
                      borderRadius='sm'
                      cursor='pointer'
                    >
                      <FiEye size={14} />
                      View Subject
                    </Box>
                    {sourceType === 'labSeed' && onRemoveFromLabSeed && (
                      <Menu.Item
                        value='removeFromLabSeed'
                        onClick={handleRemoveFromLabSeed}
                        color='red.600'
                      >
                        <FiTrash2 size={14} />
                        Remove from Lab Seed
                      </Menu.Item>
                    )}
                    {sourceType === 'whiteboard' && onRemoveFromWhiteboard && (
                      <Menu.Item
                        value='removeFromWhiteboard'
                        onClick={handleRemoveFromWhiteboard}
                        color='red.600'
                      >
                        <FiTrash2 size={14} />
                        Delete from Whiteboard
                      </Menu.Item>
                    )}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            </HStack>
          </HStack>

          {/* Metrics */}
          <VStack gap={1} align='stretch'>
            <MetricBar label='HR' value={hrValue} color='#D4AF37' />
            <MetricBar label='TT' value={ttValue} color='#20B2AA' />
            <MetricBar label='WS' value={wsValue} color='#FF6B47' />
          </VStack>

          {/* Summary - with truncation similar to lab version */}
          <Text
            fontSize='xs'
            color='fg.muted'
            lineHeight='1.3'
            lineClamp={2}
            css={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subject.ent_summary}
          </Text>

          {/* Removed the fsid badge completely */}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default WhiteboardSubjectCard;

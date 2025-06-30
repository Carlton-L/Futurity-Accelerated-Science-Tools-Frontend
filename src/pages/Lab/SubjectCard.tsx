import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  VStack,
  HStack,
  Menu,
  Box,
  Skeleton,
  Tooltip,
} from '@chakra-ui/react';
import { FiMove, FiMoreHorizontal, FiEye, FiTrash2 } from 'react-icons/fi';
import { KanbanItem } from '../../components/shared/Kanban';
import { useAuth } from '../../context/AuthContext';
import type { LabSubject } from './types';

interface SubjectCardProps {
  subject: LabSubject;
  categoryId: string;
  onSubjectClick: (subject: LabSubject) => void;
  onSubjectRemove: (subjectId: string, categoryId: string) => void;
  onSubjectView: (subject: LabSubject) => void;
  isLoading?: boolean;
  // New props for horizontal tooltip positioning
  tooltipPlacement?: 'bottom-start' | 'right' | 'left';
  isInHorizontalLayout?: boolean;
}

interface SubjectApiData {
  _id: string;
  ent_name: string;
  ent_fsid: string;
  ent_summary: string;
  indexes?: Array<{
    HR: number;
    TT: number;
    WS: number;
  }>;
}

interface MetricBarProps {
  label: string;
  value: number | null;
  color: string;
  isLoading: boolean;
}

const MetricBar: React.FC<MetricBarProps> = ({
  label,
  value,
  color,
  isLoading,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (value !== null && !isLoading) {
      // Animate the bar growth
      const timer = setTimeout(() => {
        setAnimatedValue(value);
      }, 100); // Small delay before animation starts
      return () => clearTimeout(timer);
    }
  }, [value, isLoading]);

  // Convert hex color to rgba with 20% opacity
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

  if (isLoading) {
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
          right='20px'
          height='3px'
          bg={backgroundBarColor}
          borderRadius='full'
          zIndex={1}
        />
        <Skeleton height='12px' width='20px' borderRadius='sm' zIndex={2} />
      </HStack>
    );
  }

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
      {/* Background bar (same color as progress bar but 20% opacity) */}
      <Box
        position='absolute'
        left='20px'
        right='28px'
        height='3px'
        bg={backgroundBarColor}
        borderRadius='full'
        zIndex={1}
      />
      {/* Progress bar (colored) */}
      <Box
        position='absolute'
        left='20px'
        height='3px'
        bg={color}
        borderRadius='full'
        width={`${(animatedValue / 10) * 100}%`}
        maxWidth='calc(100% - 48px)'
        transition='width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        style={{
          willChange: 'width',
        }}
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

const TruncatedSummary: React.FC<{
  summary: string;
  maxLines?: number;
  tooltipPlacement?: 'bottom-start' | 'right' | 'left';
  isInHorizontalLayout?: boolean;
}> = ({
  summary,
  maxLines = 2,
  tooltipPlacement = 'bottom-start',
  isInHorizontalLayout = false,
}) => {
  // Calculate approximate character limit for 2 lines (assuming ~60 chars per line)
  const maxLength = maxLines * 24;

  if (summary.length <= maxLength) {
    return (
      <Box
        fontSize='xs'
        color='fg.muted'
        lineHeight='1.4'
        fontFamily='body'
        css={{
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {summary}
      </Box>
    );
  }

  const truncated = summary.substring(0, maxLength).trim();

  // Calculate tooltip dimensions for horizontal layout
  const getTooltipDimensions = (text: string) => {
    if (!isInHorizontalLayout) {
      return { maxW: '240px', maxH: 'auto' };
    }

    // For horizontal layout, allow 5 lines to prevent clipping
    // Line height is 1.4, font size is 12px (xs), so each line is ~16.8px
    const lineHeight = 16.8; // 1.4 * 12px
    const maxLines = 5; // Increased to 5 to prevent clipping
    const padding = 24; // 12px top + 12px bottom
    const calculatedMaxHeight = maxLines * lineHeight + padding;

    return {
      minW: '250px',
      maxW: '500px', // Allow horizontal expansion
      maxH: `${calculatedMaxHeight}px`, // Exactly 5 lines + padding
      width: 'max-content',
      // Remove conflicting properties - handle in CSS instead
    };
  };

  const dimensions = getTooltipDimensions(summary);

  return (
    <Box fontSize='xs' color='fg.muted' lineHeight='1.4' fontFamily='body'>
      {truncated}
      <Tooltip.Root
        openDelay={500}
        closeDelay={100}
        positioning={{
          placement: tooltipPlacement,
          strategy: 'absolute',
          // Better offset for horizontal layout
          ...(isInHorizontalLayout && {
            offset: { mainAxis: 8, crossAxis: 0 }, // 8px to the right, aligned with trigger
          }),
        }}
      >
        <Tooltip.Trigger asChild>
          <Box
            as='span'
            color='fg.muted'
            textDecoration='underline'
            cursor='pointer'
            ml={1}
            _hover={{ color: 'fg' }}
            display='inline'
          >
            ...
          </Box>
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content
            bg='bg.canvas'
            color='fg'
            // p={3}
            borderRadius='md'
            boxShadow='lg'
            border='1px solid'
            borderColor='border.emphasized'
            fontSize='xs'
            lineHeight='1.4'
            fontFamily='body'
            zIndex={999999}
            // Dynamic sizing based on content
            {...dimensions}
            // For horizontal layout, use CSS to strictly enforce 4-line limit
            css={{
              zIndex: '999999 !important',
              ...(isInHorizontalLayout && {
                // Allow 5 lines to prevent clipping, with proper text wrapping
                wordBreak: 'break-word !important',
                overflowWrap: 'break-word !important',
                whiteSpace: 'normal !important',
                // Ensure the height calculation is respected
                boxSizing: 'border-box !important',
                // Remove line clamping to allow natural 5-line display
              }),
              ...(!isInHorizontalLayout && {
                maxHeight: '160px',
                // For vertical layout, allow natural text flow
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }),
            }}
          >
            {/* Arrow positioning */}
            <Tooltip.Arrow
              css={{
                ...(isInHorizontalLayout && {
                  // Position arrow at the vertical center of the left edge for right placement
                  '--arrow-offset': '100%',
                }),
              }}
            >
              <Tooltip.ArrowTip />
            </Tooltip.Arrow>
            {summary}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    </Box>
  );
};

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  categoryId,
  onSubjectClick,
  onSubjectRemove,
  onSubjectView,
  isLoading = false,
  tooltipPlacement = 'bottom-start',
  isInHorizontalLayout = false,
}) => {
  const { token } = useAuth();
  const [subjectData, setSubjectData] = useState<SubjectApiData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Extract slug from subject's ent_fsid (remove fsid_ prefix)
  const getSubjectSlug = (subjectSlug: string): string => {
    return subjectSlug.startsWith('fsid_')
      ? subjectSlug.substring(5)
      : subjectSlug;
  };

  useEffect(() => {
    const fetchSubjectData = async () => {
      if (!token || !subject.subjectSlug) {
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      setDataError(null);

      try {
        const slug = getSubjectSlug(subject.subjectSlug);
        const response = await fetch(
          `https://tools.futurity.science/api/subject/view?slug=${encodeURIComponent(
            slug
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch subject data: ${response.status}`);
        }

        const data: SubjectApiData = await response.json();
        setSubjectData(data);
      } catch (error) {
        console.error('Failed to fetch subject data:', error);
        setDataError(
          error instanceof Error ? error.message : 'Failed to load subject data'
        );
      } finally {
        setDataLoading(false);
      }
    };

    fetchSubjectData();
  }, [subject.subjectSlug, token]);

  const handleRemoveSubject = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(
      'Removing subject:',
      subject.subjectId,
      'from category:',
      categoryId
    );
    onSubjectRemove(subject.subjectId, categoryId);
  };

  const handleViewSubject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSubjectView(subject);
  };

  // Get index values or null if not available
  const getIndexValue = (indexName: 'HR' | 'TT' | 'WS'): number | null => {
    if (
      !subjectData?.indexes ||
      !Array.isArray(subjectData.indexes) ||
      subjectData.indexes.length === 0
    ) {
      return null;
    }

    const firstIndex = subjectData.indexes[0];
    if (!firstIndex || typeof firstIndex[indexName] !== 'number') {
      return null;
    }

    return firstIndex[indexName];
  };

  const hrValue = getIndexValue('HR');
  const ttValue = getIndexValue('TT');
  const wsValue = getIndexValue('WS');

  return (
    <KanbanItem
      id={subject.id}
      columnId={categoryId}
      onItemClick={() => onSubjectClick(subject)}
      isDraggable={!isLoading && !dataLoading}
    >
      <Card.Root
        size='sm'
        variant='outline'
        bg='bg.canvas'
        borderColor='border.emphasized'
        _hover={{
          bg: 'bg.hover',
          borderColor: 'border.hover',
        }}
        transition='all 0.2s'
        mb={3}
        w='100%'
        opacity={isLoading ? 0.7 : 1}
        position='relative'
        // Remove z-index from here - let KanbanItem handle it
      >
        <Card.Body p={3}>
          <VStack gap={3} align='stretch'>
            {/* Header with title and actions */}
            <HStack justify='space-between' align='flex-start'>
              <Text
                fontSize='sm'
                fontWeight='medium'
                color='fg'
                flex='1'
                lineHeight='1.3'
                fontFamily='body'
              >
                {subject.subjectName}
              </Text>
              <HStack gap={1}>
                {/* Drag handle */}
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
                      zIndex={999999}
                      boxShadow='lg'
                      position='relative'
                      css={{
                        zIndex: '999999 !important',
                        position: 'relative !important',
                      }}
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

            {/* Index metrics */}
            <VStack gap={1} align='stretch'>
              <MetricBar
                label='HR'
                value={hrValue}
                color='#D4AF37'
                isLoading={dataLoading}
              />
              <MetricBar
                label='TT'
                value={ttValue}
                color='#20B2AA'
                isLoading={dataLoading}
              />
              <MetricBar
                label='WS'
                value={wsValue}
                color='#FF6B47'
                isLoading={dataLoading}
              />
            </VStack>

            {/* Summary */}
            <Box>
              {dataLoading ? (
                <VStack gap={1} align='stretch'>
                  <Skeleton height='12px' width='100%' />
                  <Skeleton height='12px' width='80%' />
                  <Skeleton height='12px' width='60%' />
                </VStack>
              ) : dataError ? (
                <Text
                  fontSize='xs'
                  color='error'
                  fontFamily='body'
                  fontStyle='italic'
                >
                  Failed to load summary
                </Text>
              ) : subjectData?.ent_summary ? (
                <TruncatedSummary
                  summary={subjectData.ent_summary}
                  tooltipPlacement={tooltipPlacement}
                  isInHorizontalLayout={isInHorizontalLayout}
                />
              ) : (
                <Text
                  fontSize='xs'
                  color='fg.muted'
                  fontFamily='body'
                  fontStyle='italic'
                >
                  No summary available
                </Text>
              )}
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    </KanbanItem>
  );
};

export default SubjectCard;

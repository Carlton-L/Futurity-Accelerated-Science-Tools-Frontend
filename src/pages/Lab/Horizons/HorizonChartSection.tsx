import { forwardRef, useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  Text,
  VStack,
  HStack,
  Checkbox,
  Flex,
  IconButton,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import type { LabSubject, HorizonItem } from '../types';
import Horizons from './Horizons';

interface HorizonChartSectionProps {
  allSubjects: LabSubject[];
  selectedSubjects: Set<string>;
  horizonData: HorizonItem[];
  groupedSubjects: {
    selected: LabSubject[];
    unselected: LabSubject[];
  };
  onSubjectToggle: (subjectId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const HorizonChartSection = forwardRef<
  HTMLDivElement,
  HorizonChartSectionProps
>(
  (
    {
      allSubjects,
      selectedSubjects,
      horizonData,
      groupedSubjects,
      onSubjectToggle,
      onSelectAll,
      onDeselectAll,
      loading = false,
      error = null,
      onRefresh,
      refreshing = false,
    },
    ref
  ) => {
    const maxSubjects = 20;
    const [horizonDataTimeout, setHorizonDataTimeout] = useState(false);
    const [chartDimensions, setChartDimensions] = useState({
      width: 1000,
    });
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const selectionPanelRef = useRef<HTMLDivElement>(null);

    // Simplified horizon rank detection - just check the horizonRank property
    const hasValidHorizonRank = (subject: LabSubject): boolean => {
      return (
        subject.horizonRank !== undefined &&
        subject.horizonRank !== null &&
        !isNaN(Number(subject.horizonRank))
      );
    };

    // Calculate subjects with and without horizon rank using enhanced detection
    const subjectsWithHorizonRank = allSubjects.filter(hasValidHorizonRank);
    const subjectsWithoutHorizonRank = allSubjects.filter(
      (subject) => !hasValidHorizonRank(subject)
    );

    // Group subjects by horizon rank availability using enhanced detection
    const groupedSubjectsByHorizonRank = {
      selected: {
        withHorizonRank: groupedSubjects.selected.filter(hasValidHorizonRank),
        withoutHorizonRank: groupedSubjects.selected.filter(
          (subject) => !hasValidHorizonRank(subject)
        ),
      },
      unselected: {
        withHorizonRank: groupedSubjects.unselected.filter(hasValidHorizonRank),
        withoutHorizonRank: groupedSubjects.unselected.filter(
          (subject) => !hasValidHorizonRank(subject)
        ),
      },
    };

    // Check if we're still waiting for horizon rank data
    const selectedSubjectsWithoutHorizonRank = groupedSubjects.selected.filter(
      (subject) => subject.horizonRank === undefined
    );
    const isLoadingHorizonData = selectedSubjectsWithoutHorizonRank.length > 0;

    // Calculate chart width only - let height be determined by content
    useEffect(() => {
      if (chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.offsetWidth;

        console.log('Chart width calculation:', {
          containerWidth,
          categoriesCount: Array.from(
            new Set(horizonData.map((item) => item.category))
          ).length,
          horizonDataLength: horizonData.length,
        });

        setChartDimensions({
          width: Math.max(800, containerWidth),
        });
      }
    }, [horizonData, chartContainerRef.current?.offsetWidth]);

    // Handle window resize for width only
    useEffect(() => {
      const handleResize = () => {
        if (chartContainerRef.current) {
          const containerWidth = chartContainerRef.current.offsetWidth;
          setChartDimensions({
            width: Math.max(800, containerWidth),
          });
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Simple debugging - check first subject data
    console.log('=== HORIZON CHART DEBUG ===');
    console.log('Total subjects:', allSubjects.length);
    console.log('Subjects with horizon rank:', subjectsWithHorizonRank.length);
    console.log(
      'Subjects without horizon rank:',
      subjectsWithoutHorizonRank.length
    );

    // Check first subject structure
    if (allSubjects.length > 0) {
      const firstSubject = allSubjects[0];
      console.log('First subject sample:');
      console.log('  name:', firstSubject.subjectName);
      console.log(
        '  horizonRank:',
        firstSubject.horizonRank,
        typeof firstSubject.horizonRank
      );
      console.log('  hasValidHorizonRank:', hasValidHorizonRank(firstSubject));
    }

    // Set a timeout for horizon data loading (10 seconds)
    useEffect(() => {
      if (isLoadingHorizonData && selectedSubjects.size > 0) {
        console.log('Starting 10-second timeout for horizon data');
        const timer = setTimeout(() => {
          console.log(
            'Horizon data timeout reached, proceeding with available data'
          );
          setHorizonDataTimeout(true);
        }, 10000);

        return () => {
          console.log('Clearing horizon data timeout');
          clearTimeout(timer);
        };
      } else {
        setHorizonDataTimeout(false);
      }
    }, [isLoadingHorizonData, selectedSubjects.size]);

    // Reset timeout when subjects change
    useEffect(() => {
      console.log('Subjects changed, resetting timeout');
      setHorizonDataTimeout(false);
    }, [selectedSubjects]);

    // Determine if we should show the chart
    const shouldShowChart =
      selectedSubjects.size > 0 &&
      (!isLoadingHorizonData || horizonDataTimeout);

    return (
      <Card.Root ref={ref} bg='bg.canvas' borderColor='border.emphasized'>
        <Card.Body p={6}>
          <VStack gap={4} align='stretch'>
            {/* Description */}
            <Box>
              <Text
                fontSize='sm'
                color='fg.muted'
                lineHeight='1.6'
                fontFamily='body'
                mb={4}
              >
                The Horizon Chart visualizes your selected subjects across four
                time horizons (Business, Engineering, Science, and Imagination)
                and organizes them by category. Each subject is positioned based
                on its technological maturity and relevance, helping you
                understand the development timeline and strategic positioning of
                your research areas. <strong>Note:</strong> Only subjects with
                horizon rank data can be displayed on the chart. A maximum of 20
                subjects can be displayed at once for optimal readability.
              </Text>
            </Box>

            <Flex gap={6} align='flex-start'>
              {/* Sticky Subject Selection Panel */}
              <Box
                ref={selectionPanelRef}
                position='sticky'
                top='140px' // Below the floating navbar (64px) + tab navigation (76px)
                zIndex={9}
                minW='350px'
                maxW='350px'
                maxH='calc(100vh - 160px)' // Leave space for navbar and tabs
                overflowY='auto'
                bg='bg.canvas'
                borderRadius='md'
                border='1px solid'
                borderColor='border.emphasized'
                p={4}
              >
                <VStack gap={4} align='stretch'>
                  <HStack justify='space-between' align='center'>
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color='fg'
                      fontFamily='heading'
                    >
                      Select Subjects ({selectedSubjects.size}/{maxSubjects})
                    </Text>
                    <HStack gap={2}>
                      <Button
                        // color='fg'
                        size='xs'
                        variant='solid'
                        onClick={onSelectAll}
                        disabled={
                          loading || subjectsWithHorizonRank.length === 0
                        }
                      >
                        First{' '}
                        {Math.min(maxSubjects, subjectsWithHorizonRank.length)}
                      </Button>
                      <Button
                        color='fg'
                        size='xs'
                        variant='outline'
                        onClick={onDeselectAll}
                        disabled={loading || allSubjects.length === 0}
                      >
                        None
                      </Button>
                      {onRefresh && (
                        <IconButton
                          color='fg.muted'
                          size='xs'
                          variant='ghost'
                          onClick={onRefresh}
                          loading={refreshing}
                          disabled={loading}
                          aria-label='Refresh subjects'
                          title='Refresh subjects from API'
                        >
                          <FiRefreshCw size={12} />
                        </IconButton>
                      )}
                    </HStack>
                  </HStack>

                  <Box
                    border='1px solid'
                    borderColor='border.emphasized'
                    borderRadius='md'
                    bg='bg.canvas'
                    p={3}
                  >
                    <VStack gap={2} align='stretch'>
                      {/* Loading state */}
                      {loading && (
                        <VStack gap={2} align='stretch'>
                          <Text
                            fontSize='xs'
                            fontWeight='bold'
                            color='fg.muted'
                            textTransform='uppercase'
                            fontFamily='heading'
                          >
                            Loading Subjects...
                          </Text>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <HStack key={i} gap={2} align='center'>
                              <Skeleton
                                width='16px'
                                height='16px'
                                borderRadius='sm'
                              />
                              <VStack gap={1} align='stretch' flex='1'>
                                <Skeleton
                                  height='14px'
                                  width={`${60 + Math.random() * 40}%`}
                                />
                                <Skeleton
                                  height='12px'
                                  width={`${40 + Math.random() * 30}%`}
                                />
                              </VStack>
                            </HStack>
                          ))}
                        </VStack>
                      )}

                      {/* Error state */}
                      {error && !loading && (
                        <VStack gap={3} align='stretch' py={4}>
                          <Text
                            fontSize='sm'
                            color='red.500'
                            textAlign='center'
                            fontFamily='body'
                          >
                            <strong>Error:</strong> {error}
                          </Text>
                          {onRefresh && (
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={onRefresh}
                              loading={refreshing}
                              alignSelf='center'
                            >
                              Try Again
                            </Button>
                          )}
                        </VStack>
                      )}

                      {/* Selected subjects with horizon rank */}
                      {!loading &&
                        !error &&
                        groupedSubjectsByHorizonRank.selected.withHorizonRank
                          .length > 0 && (
                          <>
                            <Text
                              fontSize='xs'
                              fontWeight='bold'
                              color='success'
                              textTransform='uppercase'
                              fontFamily='heading'
                            >
                              Selected - With Horizon Rank (
                              {
                                groupedSubjectsByHorizonRank.selected
                                  .withHorizonRank.length
                              }
                              )
                            </Text>
                            {groupedSubjectsByHorizonRank.selected.withHorizonRank.map(
                              (subject) => (
                                <HStack key={subject.id} gap={2} align='center'>
                                  <Checkbox.Root
                                    checked={selectedSubjects.has(subject.id)}
                                    onCheckedChange={() =>
                                      onSubjectToggle(subject.id)
                                    }
                                    size='sm'
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control>
                                      <Checkbox.Indicator />
                                    </Checkbox.Control>
                                  </Checkbox.Root>
                                  <VStack gap={0} align='stretch' flex='1'>
                                    <HStack gap={2} align='center'>
                                      <Text
                                        fontSize='sm'
                                        fontWeight='medium'
                                        color='fg'
                                        fontFamily='heading'
                                        flex='1'
                                      >
                                        {subject.subjectName}
                                      </Text>
                                      <Text
                                        fontSize='xs'
                                        color='success'
                                        fontFamily='mono'
                                        fontWeight='medium'
                                      >
                                        HR: {subject.horizonRank!.toFixed(1)}
                                      </Text>
                                    </HStack>
                                    {subject.notes && (
                                      <Text
                                        fontSize='xs'
                                        color='fg.muted'
                                        overflow='hidden'
                                        textOverflow='ellipsis'
                                        whiteSpace='nowrap'
                                        fontFamily='body'
                                      >
                                        {subject.notes}
                                      </Text>
                                    )}
                                  </VStack>
                                </HStack>
                              )
                            )}
                          </>
                        )}

                      {/* Selected subjects without horizon rank */}
                      {!loading &&
                        !error &&
                        groupedSubjectsByHorizonRank.selected.withoutHorizonRank
                          .length > 0 && (
                          <>
                            {groupedSubjectsByHorizonRank.selected
                              .withHorizonRank.length > 0 && (
                              <Box height='1px' bg='border.muted' my={2} />
                            )}
                            <Text
                              fontSize='xs'
                              fontWeight='bold'
                              color='warning'
                              textTransform='uppercase'
                              fontFamily='heading'
                            >
                              Selected - No Horizon Rank (
                              {
                                groupedSubjectsByHorizonRank.selected
                                  .withoutHorizonRank.length
                              }
                              )
                            </Text>
                            {groupedSubjectsByHorizonRank.selected.withoutHorizonRank.map(
                              (subject) => (
                                <HStack
                                  key={subject.id}
                                  gap={2}
                                  align='center'
                                  opacity={0.7}
                                >
                                  <Checkbox.Root
                                    checked={selectedSubjects.has(subject.id)}
                                    onCheckedChange={() =>
                                      onSubjectToggle(subject.id)
                                    }
                                    size='sm'
                                    disabled={true}
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control>
                                      <Checkbox.Indicator />
                                    </Checkbox.Control>
                                  </Checkbox.Root>
                                  <VStack gap={0} align='stretch' flex='1'>
                                    <HStack gap={2} align='center'>
                                      <Text
                                        fontSize='sm'
                                        fontWeight='medium'
                                        color='fg.muted'
                                        fontFamily='heading'
                                        flex='1'
                                      >
                                        {subject.subjectName}
                                      </Text>
                                      <Text
                                        fontSize='xs'
                                        color='warning'
                                        fontFamily='mono'
                                        fontWeight='medium'
                                      >
                                        No HR
                                      </Text>
                                    </HStack>
                                    {subject.notes && (
                                      <Text
                                        fontSize='xs'
                                        color='fg.muted'
                                        overflow='hidden'
                                        textOverflow='ellipsis'
                                        whiteSpace='nowrap'
                                        fontFamily='body'
                                      >
                                        {subject.notes}
                                      </Text>
                                    )}
                                  </VStack>
                                </HStack>
                              )
                            )}
                          </>
                        )}

                      {/* Available subjects with horizon rank */}
                      {!loading &&
                        !error &&
                        groupedSubjectsByHorizonRank.unselected.withHorizonRank
                          .length > 0 && (
                          <>
                            {(groupedSubjectsByHorizonRank.selected
                              .withHorizonRank.length > 0 ||
                              groupedSubjectsByHorizonRank.selected
                                .withoutHorizonRank.length > 0) && (
                              <Box height='1px' bg='border.muted' my={2} />
                            )}
                            <Text
                              fontSize='xs'
                              fontWeight='bold'
                              color='fg.muted'
                              textTransform='uppercase'
                              fontFamily='heading'
                            >
                              Available - With Horizon Rank (
                              {
                                groupedSubjectsByHorizonRank.unselected
                                  .withHorizonRank.length
                              }
                              )
                            </Text>
                            {groupedSubjectsByHorizonRank.unselected.withHorizonRank.map(
                              (subject) => {
                                const isAtLimit =
                                  selectedSubjects.size >= maxSubjects;
                                const isDisabled =
                                  isAtLimit &&
                                  !selectedSubjects.has(subject.id);

                                return (
                                  <HStack
                                    key={subject.id}
                                    gap={2}
                                    align='center'
                                    opacity={isDisabled ? 0.5 : 1}
                                  >
                                    <Checkbox.Root
                                      checked={selectedSubjects.has(subject.id)}
                                      onCheckedChange={() =>
                                        onSubjectToggle(subject.id)
                                      }
                                      size='sm'
                                      disabled={isDisabled}
                                    >
                                      <Checkbox.HiddenInput />
                                      <Checkbox.Control>
                                        <Checkbox.Indicator />
                                      </Checkbox.Control>
                                    </Checkbox.Root>
                                    <VStack gap={0} align='stretch' flex='1'>
                                      <HStack gap={2} align='center'>
                                        <Text
                                          fontSize='sm'
                                          fontWeight='medium'
                                          color={isDisabled ? 'fg.muted' : 'fg'}
                                          fontFamily='heading'
                                          flex='1'
                                        >
                                          {subject.subjectName}
                                        </Text>
                                        <Text
                                          fontSize='xs'
                                          color='success'
                                          fontFamily='mono'
                                          fontWeight='medium'
                                        >
                                          HR: {subject.horizonRank!.toFixed(1)}
                                        </Text>
                                      </HStack>
                                      {subject.notes && (
                                        <Text
                                          fontSize='xs'
                                          color='fg.muted'
                                          overflow='hidden'
                                          textOverflow='ellipsis'
                                          whiteSpace='nowrap'
                                          fontFamily='body'
                                        >
                                          {subject.notes}
                                        </Text>
                                      )}
                                    </VStack>
                                  </HStack>
                                );
                              }
                            )}
                          </>
                        )}

                      {/* Available subjects without horizon rank */}
                      {!loading &&
                        !error &&
                        groupedSubjectsByHorizonRank.unselected
                          .withoutHorizonRank.length > 0 && (
                          <>
                            {(groupedSubjectsByHorizonRank.selected
                              .withHorizonRank.length > 0 ||
                              groupedSubjectsByHorizonRank.selected
                                .withoutHorizonRank.length > 0 ||
                              groupedSubjectsByHorizonRank.unselected
                                .withHorizonRank.length > 0) && (
                              <Box height='1px' bg='border.muted' my={2} />
                            )}
                            <Text
                              fontSize='xs'
                              fontWeight='bold'
                              color='fg.muted'
                              textTransform='uppercase'
                              fontFamily='heading'
                            >
                              Available - No Horizon Rank (
                              {
                                groupedSubjectsByHorizonRank.unselected
                                  .withoutHorizonRank.length
                              }
                              )
                            </Text>
                            {groupedSubjectsByHorizonRank.unselected.withoutHorizonRank.map(
                              (subject) => (
                                <HStack
                                  key={subject.id}
                                  gap={2}
                                  align='center'
                                  opacity={0.5}
                                >
                                  <Checkbox.Root
                                    checked={false}
                                    size='sm'
                                    disabled={true}
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control>
                                      <Checkbox.Indicator />
                                    </Checkbox.Control>
                                  </Checkbox.Root>
                                  <VStack gap={0} align='stretch' flex='1'>
                                    <HStack gap={2} align='center'>
                                      <Text
                                        fontSize='sm'
                                        fontWeight='medium'
                                        color='fg.muted'
                                        fontFamily='heading'
                                        flex='1'
                                      >
                                        {subject.subjectName}
                                      </Text>
                                      <Text
                                        fontSize='xs'
                                        color='fg.muted'
                                        fontFamily='mono'
                                        fontWeight='medium'
                                      >
                                        No HR
                                      </Text>
                                    </HStack>
                                    {subject.notes && (
                                      <Text
                                        fontSize='xs'
                                        color='fg.muted'
                                        overflow='hidden'
                                        textOverflow='ellipsis'
                                        whiteSpace='nowrap'
                                        fontFamily='body'
                                      >
                                        {subject.notes}
                                      </Text>
                                    )}
                                  </VStack>
                                </HStack>
                              )
                            )}
                          </>
                        )}

                      {/* Empty state */}
                      {!loading && !error && allSubjects.length === 0 && (
                        <VStack gap={3} align='stretch' py={4}>
                          <Text
                            fontSize='sm'
                            color='fg.muted'
                            textAlign='center'
                            fontFamily='body'
                          >
                            No subjects available. Add subjects in the Gather
                            tab first.
                          </Text>
                          {onRefresh && (
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={onRefresh}
                              loading={refreshing}
                              alignSelf='center'
                            >
                              Refresh
                            </Button>
                          )}
                        </VStack>
                      )}
                    </VStack>
                  </Box>

                  {/* Horizon data loading status */}
                  {!loading &&
                    !error &&
                    selectedSubjects.size > 0 &&
                    isLoadingHorizonData && (
                      <Box
                        p={3}
                        bg='blue.50'
                        border='1px solid'
                        borderColor='blue.200'
                        borderRadius='md'
                      >
                        <VStack gap={2} align='stretch'>
                          <Text
                            fontSize='xs'
                            fontWeight='bold'
                            color='blue.700'
                            fontFamily='heading'
                          >
                            Loading Horizon Data
                          </Text>
                          <Text
                            fontSize='xs'
                            color='blue.600'
                            fontFamily='body'
                          >
                            Fetching horizon ranks for{' '}
                            {selectedSubjectsWithoutHorizonRank.length} subject
                            {selectedSubjectsWithoutHorizonRank.length !== 1
                              ? 's'
                              : ''}
                            ...
                          </Text>
                        </VStack>
                      </Box>
                    )}

                  {/* Summary of data availability */}
                  {!loading && !error && allSubjects.length > 0 && (
                    <Box
                      p={3}
                      bg='bg.muted'
                      borderRadius='md'
                      fontSize='xs'
                      color='fg.muted'
                      fontFamily='body'
                    >
                      <VStack gap={1} align='stretch'>
                        <Text>
                          <strong>Available:</strong>{' '}
                          {subjectsWithHorizonRank.length} with horizon rank,{' '}
                          {subjectsWithoutHorizonRank.length} without
                        </Text>
                        <Text>
                          <strong>Chart Ready:</strong>{' '}
                          {
                            groupedSubjectsByHorizonRank.selected
                              .withHorizonRank.length
                          }{' '}
                          selected subjects
                        </Text>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Box>

              {/* Horizon Chart Container */}
              <Box flex='1' ref={chartContainerRef}>
                {loading ? (
                  // Loading skeleton for the chart
                  <Flex
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='border.muted'
                    borderRadius='md'
                    bg='bg.subtle'
                    minH='400px'
                  >
                    <VStack gap={2}>
                      <Skeleton
                        height='24px'
                        width='24px'
                        borderRadius='full'
                      />
                      <SkeletonText noOfLines={1} textAlign='center'>
                        <Text color='fg.muted' fontSize='sm' fontFamily='body'>
                          Loading horizon chart...
                        </Text>
                      </SkeletonText>
                    </VStack>
                  </Flex>
                ) : error ? (
                  // Error state for the chart
                  <Flex
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='red.200'
                    borderRadius='md'
                    bg='red.50'
                    minH='400px'
                  >
                    <VStack gap={3}>
                      <Text
                        color='red.500'
                        fontSize='sm'
                        fontFamily='body'
                        textAlign='center'
                      >
                        Unable to load horizon chart
                      </Text>
                      <Text
                        color='red.400'
                        fontSize='xs'
                        fontFamily='body'
                        textAlign='center'
                      >
                        {error}
                      </Text>
                      {onRefresh && (
                        <Button
                          size='sm'
                          variant='outline'
                          colorScheme='red'
                          onClick={onRefresh}
                          loading={refreshing}
                        >
                          Retry
                        </Button>
                      )}
                    </VStack>
                  </Flex>
                ) : isLoadingHorizonData && !horizonDataTimeout ? (
                  // Loading state while waiting for horizon data
                  <Flex
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='blue.200'
                    borderRadius='md'
                    bg='blue.50'
                    minH='400px'
                  >
                    <VStack gap={3}>
                      <Box
                        width='40px'
                        height='40px'
                        border='3px solid'
                        borderColor='blue.200'
                        borderTopColor='blue.500'
                        borderRadius='full'
                        animation='spin 1s linear infinite'
                      />
                      <VStack gap={1}>
                        <Text
                          color='blue.700'
                          fontSize='sm'
                          fontFamily='body'
                          textAlign='center'
                          fontWeight='medium'
                        >
                          Loading Horizon Data
                        </Text>
                        <Text
                          color='blue.600'
                          fontSize='xs'
                          fontFamily='body'
                          textAlign='center'
                        >
                          Fetching horizon ranks for{' '}
                          {selectedSubjectsWithoutHorizonRank.length} of{' '}
                          {selectedSubjects.size} selected subjects...
                        </Text>
                      </VStack>
                    </VStack>
                  </Flex>
                ) : selectedSubjects.size === 0 ? (
                  // Empty state - no subjects selected
                  <Flex
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='border.muted'
                    borderRadius='md'
                    bg='bg.subtle'
                    minH='400px'
                  >
                    <VStack gap={2}>
                      <Text
                        color='fg.muted'
                        fontSize='sm'
                        textAlign='center'
                        fontFamily='body'
                      >
                        Select subjects with horizon rank data to view chart
                      </Text>
                    </VStack>
                  </Flex>
                ) : groupedSubjectsByHorizonRank.selected.withHorizonRank
                    .length === 0 ? (
                  // No subjects with horizon rank selected
                  <Flex
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='orange.200'
                    borderRadius='md'
                    bg='orange.50'
                    minH='400px'
                  >
                    <VStack gap={2}>
                      <Text
                        color='orange.700'
                        fontSize='sm'
                        textAlign='center'
                        fontFamily='body'
                        fontWeight='medium'
                      >
                        No subjects with horizon rank data selected
                      </Text>
                      <Text
                        color='orange.600'
                        fontSize='xs'
                        textAlign='center'
                        fontFamily='body'
                      >
                        Select subjects that have horizon rank data to view the
                        chart
                      </Text>
                    </VStack>
                  </Flex>
                ) : (
                  // Horizon chart component - REMOVED HEIGHT CONSTRAINTS
                  <VStack gap={2} align='stretch'>
                    {isLoadingHorizonData && horizonDataTimeout && (
                      <Box
                        p={2}
                        bg='orange.50'
                        border='1px solid'
                        borderColor='orange.200'
                        borderRadius='md'
                      >
                        <Text
                          fontSize='xs'
                          color='orange.700'
                          fontFamily='body'
                          textAlign='center'
                        >
                          Showing chart with available data.{' '}
                          {selectedSubjectsWithoutHorizonRank.length} subject
                          {selectedSubjectsWithoutHorizonRank.length !== 1
                            ? 's'
                            : ''}{' '}
                          without horizon ranks are not displayed.
                        </Text>
                      </Box>
                    )}
                    {/* CRITICAL: Allow overflow so labels can extend beyond chart */}
                    <Box
                      w='100%'
                      minH='400px' // Only minimum height, no maximum
                      border='1px solid'
                      borderColor='border.muted'
                      borderRadius='md'
                      overflow='visible' // Allow labels to overflow on the right
                      position='relative'
                      // Add right padding to accommodate overflowing labels
                      pr='150px' // Space for labels that might overflow
                    >
                      <Horizons
                        data={horizonData}
                        showLegend={false}
                        isLoading={false}
                        containerWidth={chartDimensions.width}
                        // REMOVED: containerHeight={chartDimensions.height} - let chart calculate its own height
                      />
                    </Box>
                  </VStack>
                )}
              </Box>
            </Flex>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }
);

HorizonChartSection.displayName = 'HorizonChartSection';

export default HorizonChartSection;

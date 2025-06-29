import { forwardRef, useEffect, useState } from 'react';
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

    // Check if we're still waiting for horizon rank data
    const selectedSubjectsWithoutHorizonRank = groupedSubjects.selected.filter(
      (subject) => subject.horizonRank === undefined
    );
    const isLoadingHorizonData = selectedSubjectsWithoutHorizonRank.length > 0;

    // Debug logging
    console.log('=== HORIZON CHART DEBUG ===');
    console.log('Total selected subjects:', selectedSubjects.size);
    console.log('Grouped selected subjects:', groupedSubjects.selected.length);
    console.log(
      'Subjects without horizon rank:',
      selectedSubjectsWithoutHorizonRank.length
    );
    console.log(
      'Selected subjects with horizon rank data:',
      groupedSubjects.selected.filter((s) => s.horizonRank !== undefined).length
    );
    console.log('isLoadingHorizonData:', isLoadingHorizonData);
    console.log('horizonDataTimeout:', horizonDataTimeout);
    console.log('Horizon data length:', horizonData.length);

    // Log individual subjects and their horizon rank status
    groupedSubjects.selected.forEach((subject, index) => {
      console.log(
        `Subject ${index + 1}: ${subject.subjectName} - HR: ${
          subject.horizonRank
        }`
      );
    });
    console.log('=== END DEBUG ===');

    // Set a timeout for horizon data loading (10 seconds)
    useEffect(() => {
      if (isLoadingHorizonData && selectedSubjects.size > 0) {
        console.log('Starting 10-second timeout for horizon data');
        const timer = setTimeout(() => {
          console.log(
            'Horizon data timeout reached, proceeding with available data'
          );
          setHorizonDataTimeout(true);
        }, 10000); // 10 second timeout

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
                time horizons (Business, Engineering, Science, and Idea) and
                organizes them by category. Each subject is positioned based on
                its technological maturity and relevance, helping you understand
                the development timeline and strategic positioning of your
                research areas. <strong>Note:</strong> A maximum of 20 subjects
                can be displayed on the chart at once for optimal readability.
              </Text>
            </Box>

            <Flex gap={6} align='flex-start'>
              {/* Subject Selection Panel */}
              <Box minW='300px' maxW='300px'>
                <VStack gap={4} align='stretch'>
                  <HStack justify='space-between' align='center'>
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color='fg'
                      fontFamily='heading'
                    >
                      Select Subjects (
                      {loading
                        ? '...'
                        : `${selectedSubjects.size}/${maxSubjects}`}
                      )
                    </Text>
                    <HStack gap={2}>
                      <Button
                        size='xs'
                        variant='ghost'
                        onClick={onSelectAll}
                        disabled={loading || allSubjects.length === 0}
                      >
                        First {maxSubjects}
                      </Button>
                      <Button
                        size='xs'
                        variant='ghost'
                        onClick={onDeselectAll}
                        disabled={loading || allSubjects.length === 0}
                      >
                        None
                      </Button>
                      {onRefresh && (
                        <IconButton
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
                    maxH='500px'
                    overflowY='auto'
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

                      {/* Selected subjects first */}
                      {!loading &&
                        !error &&
                        groupedSubjects.selected.length > 0 && (
                          <>
                            <Text
                              fontSize='xs'
                              fontWeight='bold'
                              color='success'
                              textTransform='uppercase'
                              fontFamily='heading'
                            >
                              Included ({groupedSubjects.selected.length})
                            </Text>
                            {groupedSubjects.selected.map((subject) => (
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
                                    {/* Horizon rank status indicator */}
                                    {subject.horizonRank !== undefined ? (
                                      <Text
                                        fontSize='xs'
                                        color='success'
                                        fontFamily='mono'
                                        fontWeight='medium'
                                      >
                                        HR: {subject.horizonRank.toFixed(1)}
                                      </Text>
                                    ) : (
                                      <Text
                                        fontSize='xs'
                                        color='warning'
                                        fontFamily='mono'
                                        fontWeight='medium'
                                      >
                                        Loading...
                                      </Text>
                                    )}
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
                            ))}
                          </>
                        )}

                      {/* Unselected subjects */}
                      {!loading &&
                        !error &&
                        groupedSubjects.unselected.length > 0 && (
                          <>
                            {groupedSubjects.selected.length > 0 && (
                              <Box height='1px' bg='border.muted' my={2} />
                            )}
                            <Text
                              fontSize='xs'
                              fontWeight='bold'
                              color='fg.muted'
                              textTransform='uppercase'
                              fontFamily='heading'
                            >
                              Available ({groupedSubjects.unselected.length})
                            </Text>
                            {groupedSubjects.unselected.map((subject) => {
                              const isAtLimit =
                                selectedSubjects.size >= maxSubjects;
                              const isDisabled =
                                isAtLimit && !selectedSubjects.has(subject.id);

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
                                      {/* Horizon rank status indicator */}
                                      {subject.horizonRank !== undefined ? (
                                        <Text
                                          fontSize='xs'
                                          color='success'
                                          fontFamily='mono'
                                          fontWeight='medium'
                                        >
                                          HR: {subject.horizonRank.toFixed(1)}
                                        </Text>
                                      ) : (
                                        <Text
                                          fontSize='xs'
                                          color='fg.muted'
                                          fontFamily='mono'
                                          fontWeight='medium'
                                        >
                                          ---
                                        </Text>
                                      )}
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
                            })}
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
                </VStack>
              </Box>

              {/* Horizon Chart */}
              <Box flex='1'>
                {loading ? (
                  // Loading skeleton for the chart
                  <Flex
                    height='400px'
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='border.muted'
                    borderRadius='md'
                    bg='bg.subtle'
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
                    height='400px'
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='red.200'
                    borderRadius='md'
                    bg='red.50'
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
                  // Loading state while waiting for horizon data (with timeout)
                  <Flex
                    height='400px'
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='blue.200'
                    borderRadius='md'
                    bg='blue.50'
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
                        <Text
                          color='blue.500'
                          fontSize='xs'
                          fontFamily='body'
                          textAlign='center'
                          fontStyle='italic'
                        >
                          (Will proceed with available data after 10 seconds)
                        </Text>
                      </VStack>
                    </VStack>
                  </Flex>
                ) : selectedSubjects.size === 0 ? (
                  // Empty state - no subjects selected
                  <Flex
                    height='400px'
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='border.muted'
                    borderRadius='md'
                    bg='bg.subtle'
                  >
                    <VStack gap={2}>
                      <Text
                        color='fg.muted'
                        fontSize='sm'
                        textAlign='center'
                        fontFamily='body'
                      >
                        Select subjects to view horizon chart
                      </Text>
                    </VStack>
                  </Flex>
                ) : (
                  // Horizon chart component - show when ready or after timeout
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
                          without horizon ranks will use random values for
                          display.
                        </Text>
                      </Box>
                    )}
                    <Horizons
                      data={horizonData}
                      showLegend={false}
                      isLoading={false}
                    />
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

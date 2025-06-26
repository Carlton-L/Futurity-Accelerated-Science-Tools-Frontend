import { forwardRef } from 'react';
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
                research areas.
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
                        : `${selectedSubjects.size}/${allSubjects.length}`}
                      )
                    </Text>
                    <HStack gap={2}>
                      <Button
                        size='xs'
                        variant='ghost'
                        onClick={onSelectAll}
                        disabled={loading || allSubjects.length === 0}
                      >
                        All
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
                                  <Text
                                    fontSize='sm'
                                    fontWeight='medium'
                                    color='fg'
                                    fontFamily='heading'
                                  >
                                    {subject.subjectName}
                                  </Text>
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
                            {groupedSubjects.unselected.map((subject) => (
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
                                  <Text
                                    fontSize='sm'
                                    fontWeight='medium'
                                    color='fg'
                                    fontFamily='heading'
                                  >
                                    {subject.subjectName}
                                  </Text>
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
                ) : horizonData.length > 0 ? (
                  // Actual horizon chart with data
                  <Horizons data={horizonData} showLegend={false} />
                ) : (
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
                        fontFamily='body'
                        textAlign='center'
                      >
                        {allSubjects.length === 0
                          ? 'No subjects available in this lab'
                          : 'Select subjects to view horizon chart'}
                      </Text>
                      {allSubjects.length === 0 && onRefresh && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={onRefresh}
                          loading={refreshing}
                        >
                          Refresh Subjects
                        </Button>
                      )}
                    </VStack>
                  </Flex>
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

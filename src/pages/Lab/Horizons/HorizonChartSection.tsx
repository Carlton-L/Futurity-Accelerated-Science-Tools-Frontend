import React, { forwardRef } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Checkbox,
  Flex,
} from '@chakra-ui/react';
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
    },
    ref
  ) => {
    return (
      <Card.Root ref={ref}>
        <Card.Body p={6}>
          <VStack gap={4} align='stretch'>
            <Heading as='h3' size='md'>
              Horizon Chart
            </Heading>

            <Flex gap={6} align='flex-start'>
              {/* Subject Selection Panel */}
              <Box minW='300px' maxW='300px'>
                <VStack gap={4} align='stretch'>
                  <HStack justify='space-between' align='center'>
                    <Text fontSize='sm' fontWeight='medium'>
                      Select Subjects ({selectedSubjects.size}/
                      {allSubjects.length})
                    </Text>
                    <HStack gap={2}>
                      <Button size='xs' variant='ghost' onClick={onSelectAll}>
                        All
                      </Button>
                      <Button size='xs' variant='ghost' onClick={onDeselectAll}>
                        None
                      </Button>
                    </HStack>
                  </HStack>

                  <Box
                    maxH='500px'
                    overflowY='auto'
                    border='1px solid'
                    borderColor='gray.200'
                    borderRadius='md'
                    p={3}
                  >
                    <VStack gap={2} align='stretch'>
                      {/* Selected subjects first */}
                      {groupedSubjects.selected.length > 0 && (
                        <>
                          <Text
                            fontSize='xs'
                            fontWeight='bold'
                            color='green.600'
                            textTransform='uppercase'
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
                                <Text fontSize='sm' fontWeight='medium'>
                                  {subject.subjectName}
                                </Text>
                                {subject.notes && (
                                  <Text
                                    fontSize='xs'
                                    color='gray.500'
                                    overflow='hidden'
                                    textOverflow='ellipsis'
                                    whiteSpace='nowrap'
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
                      {groupedSubjects.unselected.length > 0 && (
                        <>
                          {groupedSubjects.selected.length > 0 && (
                            <Box height='1px' bg='gray.200' my={2} />
                          )}
                          <Text
                            fontSize='xs'
                            fontWeight='bold'
                            color='gray.500'
                            textTransform='uppercase'
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
                                <Text fontSize='sm' fontWeight='medium'>
                                  {subject.subjectName}
                                </Text>
                                {subject.notes && (
                                  <Text
                                    fontSize='xs'
                                    color='gray.500'
                                    overflow='hidden'
                                    textOverflow='ellipsis'
                                    whiteSpace='nowrap'
                                  >
                                    {subject.notes}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                          ))}
                        </>
                      )}

                      {allSubjects.length === 0 && (
                        <Text
                          fontSize='sm'
                          color='gray.500'
                          textAlign='center'
                          py={4}
                        >
                          No subjects available. Add subjects in the Gather tab
                          first.
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </VStack>
              </Box>

              {/* Horizon Chart */}
              <Box flex='1'>
                {horizonData.length > 0 ? (
                  <Horizons data={horizonData} showLegend={false} />
                ) : (
                  <Flex
                    height='400px'
                    align='center'
                    justify='center'
                    border='2px dashed'
                    borderColor='gray.300'
                    borderRadius='md'
                    bg='gray.50'
                  >
                    <Text color='gray.500' fontSize='sm'>
                      Select subjects to view horizon chart
                    </Text>
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

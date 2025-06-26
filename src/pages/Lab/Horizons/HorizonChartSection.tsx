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
                    borderColor='border.emphasized'
                    borderRadius='md'
                    bg='bg.canvas'
                    p={3}
                  >
                    <VStack gap={2} align='stretch'>
                      {/* Selected subjects first */}
                      {groupedSubjects.selected.length > 0 && (
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
                      {groupedSubjects.unselected.length > 0 && (
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

                      {allSubjects.length === 0 && (
                        <Text
                          fontSize='sm'
                          color='fg.muted'
                          textAlign='center'
                          py={4}
                          fontFamily='body'
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
                    borderColor='border.muted'
                    borderRadius='md'
                    bg='bg.subtle'
                  >
                    <Text color='fg.muted' fontSize='sm' fontFamily='body'>
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

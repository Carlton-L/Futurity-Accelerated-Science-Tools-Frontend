import React, { useCallback, useMemo } from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Checkbox,
  Badge,
  Progress,
  Alert,
  Flex,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import {
  FiCheck,
  FiDatabase,
  FiFile,
  FiEdit3,
  FiTag,
  FiUsers,
  FiZap,
  FiInfo,
  FiX,
} from 'react-icons/fi';

// Types and utils
import type {
  LabCreationFormData,
  ValidationResult,
  DataSourceType,
} from './types';
import { getSourceDisplayText, getSourceColor } from './utils';

interface Step3ReviewProps {
  formData: LabCreationFormData;
  onFormDataUpdate: (updates: Partial<LabCreationFormData>) => void;
  validation: ValidationResult;
  onCreateLab: () => void; // Keep this for completeness even if unused in component
  isCreating: boolean;
}

const Step3Review: React.FC<Step3ReviewProps> = ({
  formData,
  onFormDataUpdate,
  validation,
  onCreateLab: _onCreateLab, // Acknowledge this parameter
  isCreating,
}) => {
  // Suppress the ESLint warning for the unused parameter
  void _onCreateLab;
  // Calculate statistics
  const stats = useMemo(() => {
    const totalSubjects = formData.categories.reduce(
      (sum, cat) => sum + cat.subjects.length,
      0
    );

    const newTermsCount = formData.categories
      .flatMap((cat) => cat.subjects)
      .filter((subject) => subject.isNewTerm).length;

    const existingSubjectsCount = totalSubjects - newTermsCount;

    const categoryStats = formData.categories.reduce(
      (acc, category) => {
        if (category.type === 'custom' && category.subjects.length > 0) {
          acc.customCategories++;
        }
        return acc;
      },
      { customCategories: 0 }
    );

    const sourceStats = formData.categories
      .flatMap((cat) => cat.subjects)
      .reduce((acc, subject) => {
        acc[subject.source] = (acc[subject.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalSubjects,
      newTermsCount,
      existingSubjectsCount,
      customCategories: categoryStats.customCategories,
      includeTerms: formData.includeTerms.length,
      excludeTerms: formData.excludeTerms.length,
      sourceStats,
    };
  }, [formData]);

  // Handle processing toggle
  const handleProcessingToggle = useCallback(
    (checked: boolean) => {
      onFormDataUpdate({ processTerms: checked });
    },
    [onFormDataUpdate]
  );

  // Format processing time
  const formatProcessingTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.round(seconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  };

  return (
    <VStack gap={6} align='stretch'>
      {/* Header */}
      <VStack gap={2} align='start'>
        <Text
          fontSize='xl'
          fontWeight='semibold'
          color='fg'
          fontFamily='heading'
        >
          Review & Create Lab
        </Text>
        <Text fontSize='sm' color='fg.muted' fontFamily='body'>
          Review your lab configuration and processing options before creation
        </Text>
      </VStack>

      {/* Lab Overview */}
      <Box
        p={4}
        bg='bg.canvas'
        borderRadius='md'
        borderWidth='1px'
        borderColor='border.emphasized'
      >
        <VStack gap={4} align='stretch'>
          <Text
            fontSize='md'
            fontWeight='medium'
            color='fg'
            fontFamily='heading'
          >
            Lab Overview
          </Text>

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
            <GridItem>
              <VStack gap={2} align='start'>
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  color='fg'
                  fontFamily='heading'
                >
                  Lab Name
                </Text>
                <Text fontSize='sm' color='fg.secondary' fontFamily='body'>
                  {formData.name || 'Untitled Lab'}
                </Text>
              </VStack>
            </GridItem>

            <GridItem>
              <VStack gap={2} align='start'>
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  color='fg'
                  fontFamily='heading'
                >
                  Summary
                </Text>
                <Text
                  fontSize='sm'
                  color='fg.secondary'
                  fontFamily='body'
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {formData.summary || 'No summary provided'}
                </Text>
              </VStack>
            </GridItem>
          </Grid>
        </VStack>
      </Box>

      {/* Statistics */}
      <Box
        p={4}
        bg='bg.canvas'
        borderRadius='md'
        borderWidth='1px'
        borderColor='border.emphasized'
      >
        <VStack gap={4} align='stretch'>
          <Text
            fontSize='md'
            fontWeight='medium'
            color='fg'
            fontFamily='heading'
          >
            Content Statistics
          </Text>

          <Grid
            templateColumns={{ base: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }}
            gap={4}
          >
            {/* Total Subjects */}
            <GridItem>
              <VStack gap={2} align='center'>
                <Box color='brand'>
                  <FiUsers size={24} />
                </Box>
                <VStack gap={0} align='center'>
                  <Text
                    fontSize='xl'
                    fontWeight='bold'
                    color='fg'
                    fontFamily='mono'
                  >
                    {stats.totalSubjects}
                  </Text>
                  <Text
                    fontSize='xs'
                    color='fg.muted'
                    fontFamily='body'
                    textAlign='center'
                  >
                    Total Subjects
                  </Text>
                </VStack>
              </VStack>
            </GridItem>

            {/* Categories */}
            <GridItem>
              <VStack gap={2} align='center'>
                <Box color='secondary'>
                  <FiTag size={24} />
                </Box>
                <VStack gap={0} align='center'>
                  <Text
                    fontSize='xl'
                    fontWeight='bold'
                    color='fg'
                    fontFamily='mono'
                  >
                    {stats.customCategories}
                  </Text>
                  <Text
                    fontSize='xs'
                    color='fg.muted'
                    fontFamily='body'
                    textAlign='center'
                  >
                    Custom Categories
                  </Text>
                </VStack>
              </VStack>
            </GridItem>

            {/* Include Terms */}
            <GridItem>
              <VStack gap={2} align='center'>
                <Box color='success'>
                  <FiCheck size={24} />
                </Box>
                <VStack gap={0} align='center'>
                  <Text
                    fontSize='xl'
                    fontWeight='bold'
                    color='fg'
                    fontFamily='mono'
                  >
                    {stats.includeTerms}
                  </Text>
                  <Text
                    fontSize='xs'
                    color='fg.muted'
                    fontFamily='body'
                    textAlign='center'
                  >
                    Include Terms
                  </Text>
                </VStack>
              </VStack>
            </GridItem>

            {/* Exclude Terms */}
            <GridItem>
              <VStack gap={2} align='center'>
                <Box color='error'>
                  <FiX size={24} />
                </Box>
                <VStack gap={0} align='center'>
                  <Text
                    fontSize='xl'
                    fontWeight='bold'
                    color='fg'
                    fontFamily='mono'
                  >
                    {stats.excludeTerms}
                  </Text>
                  <Text
                    fontSize='xs'
                    color='fg.muted'
                    fontFamily='body'
                    textAlign='center'
                  >
                    Exclude Terms
                  </Text>
                </VStack>
              </VStack>
            </GridItem>
          </Grid>

          {/* Data Sources Breakdown */}
          {Object.keys(stats.sourceStats).length > 0 && (
            <VStack gap={2} align='stretch'>
              <Text
                fontSize='sm'
                fontWeight='medium'
                color='fg'
                fontFamily='heading'
              >
                Data Sources
              </Text>
              <Flex gap={4} wrap='wrap'>
                {Object.entries(stats.sourceStats).map(([source, count]) => (
                  <HStack key={source} gap={2}>
                    <Box
                      color={`${getSourceColor(source as DataSourceType)}.500`}
                    >
                      {source === 'lab_seed' && <FiDatabase size={14} />}
                      {source === 'csv' && <FiFile size={14} />}
                      {source === 'manual' && <FiEdit3 size={14} />}
                    </Box>
                    <Text fontSize='sm' color='fg' fontFamily='body'>
                      {getSourceDisplayText(source as DataSourceType)}: {count}
                    </Text>
                  </HStack>
                ))}
              </Flex>
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Processing Options */}
      {stats.newTermsCount > 0 && (
        <Box
          p={4}
          bg='bg.canvas'
          borderRadius='md'
          borderWidth='1px'
          borderColor='border.emphasized'
        >
          <VStack gap={4} align='stretch'>
            <HStack gap={2} align='center'>
              <FiZap size={16} color='var(--chakra-colors-warning)' />
              <Text
                fontSize='md'
                fontWeight='medium'
                color='fg'
                fontFamily='heading'
              >
                Term Processing
              </Text>
            </HStack>

            <VStack gap={3} align='stretch'>
              <HStack gap={4} align='start'>
                <Checkbox.Root
                  checked={formData.processTerms}
                  onCheckedChange={(details) =>
                    handleProcessingToggle(!!details.checked)
                  }
                  disabled={isCreating}
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label fontSize='sm' color='fg' fontFamily='body'>
                    Process new terms during lab creation
                  </Checkbox.Label>
                </Checkbox.Root>
              </HStack>

              <Box
                p={3}
                bg='bg.subtle'
                borderRadius='sm'
                borderWidth='1px'
                borderColor='border.muted'
              >
                <VStack gap={2} align='start'>
                  <HStack gap={2} align='center'>
                    <FiInfo size={14} color='var(--chakra-colors-brand)' />
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color='fg'
                      fontFamily='heading'
                    >
                      Processing Details
                    </Text>
                  </HStack>

                  <VStack gap={1} align='start'>
                    <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                      • {stats.newTermsCount} new term
                      {stats.newTermsCount !== 1 ? 's' : ''} need
                      {stats.newTermsCount === 1 ? 's' : ''} processing
                    </Text>
                    <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                      • {stats.existingSubjectsCount} existing subject
                      {stats.existingSubjectsCount !== 1 ? 's' : ''} ready to
                      use
                    </Text>
                    {formData.processTerms && (
                      <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                        • Estimated processing time:{' '}
                        {formatProcessingTime(formData.estimatedProcessingTime)}
                      </Text>
                    )}
                  </VStack>

                  {formData.processTerms ? (
                    <Text
                      fontSize='xs'
                      color='success'
                      _dark={{ color: 'success' }}
                      fontFamily='body'
                    >
                      ✓ New terms will be processed and ready for analysis
                    </Text>
                  ) : (
                    <Text
                      fontSize='xs'
                      color='warning'
                      _dark={{ color: 'warning' }}
                      fontFamily='body'
                    >
                      ⚠ New terms will be added without processing - limited
                      functionality until processed later
                    </Text>
                  )}
                </VStack>
              </Box>

              {formData.processTerms &&
                formData.estimatedProcessingTime > 120 && (
                  <Alert.Root status='info' size='sm'>
                    <Alert.Indicator />
                    <Alert.Description fontSize='xs' fontFamily='body'>
                      Processing may take several minutes. You can navigate away
                      and return later to check progress.
                    </Alert.Description>
                  </Alert.Root>
                )}
            </VStack>
          </VStack>
        </Box>
      )}

      {/* Categories Preview */}
      <Box
        p={4}
        bg='bg.canvas'
        borderRadius='md'
        borderWidth='1px'
        borderColor='border.emphasized'
      >
        <VStack gap={4} align='stretch'>
          <Text
            fontSize='md'
            fontWeight='medium'
            color='fg'
            fontFamily='heading'
          >
            Categories & Subjects
          </Text>

          <VStack gap={3} align='stretch' maxH='300px' overflowY='auto'>
            {formData.categories
              .filter((cat) => cat.subjects.length > 0)
              .map((category) => (
                <Box
                  key={category.id}
                  p={3}
                  bg='bg.subtle'
                  borderRadius='sm'
                  borderWidth='1px'
                  borderColor='border.muted'
                >
                  <VStack gap={2} align='stretch'>
                    <HStack justify='space-between' align='center'>
                      <HStack gap={2}>
                        <Text
                          fontSize='sm'
                          fontWeight='medium'
                          color='fg'
                          fontFamily='heading'
                        >
                          {category.name}
                        </Text>
                        {category.type === 'default' && (
                          <Badge size='xs' variant='subtle'>
                            Default
                          </Badge>
                        )}
                      </HStack>
                      <Badge size='sm' variant='outline'>
                        {category.subjects.length}
                      </Badge>
                    </HStack>

                    {/* Sample subjects */}
                    <Flex gap={2} wrap='wrap'>
                      {category.subjects.slice(0, 5).map((subject) => (
                        <Badge
                          key={subject.id}
                          size='sm'
                          colorScheme={getSourceColor(subject.source)}
                          variant='subtle'
                        >
                          {subject.subjectName}
                        </Badge>
                      ))}
                      {category.subjects.length > 5 && (
                        <Badge size='sm' variant='outline'>
                          +{category.subjects.length - 5} more
                        </Badge>
                      )}
                    </Flex>
                  </VStack>
                </Box>
              ))}
          </VStack>
        </VStack>
      </Box>

      {/* Final Actions */}
      <Box
        p={4}
        bg='successSubtle'
        borderRadius='md'
        borderWidth='1px'
        borderColor='success'
      >
        <VStack gap={3} align='center'>
          <HStack gap={2} align='center'>
            <FiCheck size={20} color='var(--chakra-colors-success)' />
            <Text
              fontSize='md'
              fontWeight='medium'
              color='success'
              fontFamily='heading'
            >
              Ready to Create Lab
            </Text>
          </HStack>

          <Text
            fontSize='sm'
            color='success'
            fontFamily='body'
            textAlign='center'
          >
            Your lab configuration looks good! Click "Create Lab" to proceed.
            {formData.processTerms &&
              stats.newTermsCount > 0 &&
              ` Processing will begin automatically after creation.`}
          </Text>

          {isCreating && (
            <VStack gap={2} w='100%'>
              <Progress.Root value={undefined} size='lg' bg='bg.muted' w='100%'>
                <Progress.Track>
                  <Progress.Range colorScheme='success' />
                </Progress.Track>
              </Progress.Root>
              <Text fontSize='sm' color='success' fontFamily='body'>
                Creating your lab...
              </Text>
            </VStack>
          )}
        </VStack>
      </Box>

      {/* Validation warnings */}
      {validation.warnings.length > 0 && (
        <Alert.Root status='warning'>
          <Alert.Indicator />
          <Alert.Title>Note:</Alert.Title>
          <Alert.Description fontFamily='body'>
            <VStack gap={1} align='start'>
              {validation.warnings.map((warning, index) => (
                <Text key={index} fontSize='sm'>
                  • {warning}
                </Text>
              ))}
            </VStack>
          </Alert.Description>
        </Alert.Root>
      )}
    </VStack>
  );
};

export default Step3Review;

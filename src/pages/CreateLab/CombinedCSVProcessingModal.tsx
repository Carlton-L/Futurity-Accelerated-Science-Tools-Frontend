import React from 'react';
import {
  Dialog,
  Button,
  Text,
  VStack,
  HStack,
  Progress,
  Spinner,
  Box,
  Select,
  Badge,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiCheck,
  FiAlertTriangle,
  FiArrowRight,
} from 'react-icons/fi';

// Types
import type {
  CSVInternalConflict,
  CSVInternalResolution,
  ConflictItem,
  ConflictResolution,
  CreationCategory,
} from './types';
import { getSourceDisplayText, getSourceColor } from './utils';

type CSVProcessingState =
  | 'stage1_processing'
  | 'stage1_conflicts'
  | 'stage2_processing'
  | 'stage2_conflicts'
  | 'completed';

interface CombinedCSVProcessingModalProps {
  isOpen: boolean;
  state: CSVProcessingState;
  stage: 1 | 2;
  message: string;
  progress: number;

  // Internal conflicts (Stage 1)
  internalConflicts: CSVInternalConflict[];
  internalResolutions: Record<string, CSVInternalResolution>;
  availableCategories: CreationCategory[];
  onInternalResolutionChange: (
    termName: string,
    resolution: CSVInternalResolution
  ) => void;
  onInternalResolve: () => void;

  // Board conflicts (Stage 2)
  boardConflicts: ConflictItem[];
  boardResolutions: Record<string, ConflictResolution>;
  onBoardResolutionChange: (
    itemName: string,
    resolution: ConflictResolution
  ) => void;
  onBoardResolve: () => void;

  onCancel: () => void;
}

const CombinedCSVProcessingModal: React.FC<CombinedCSVProcessingModalProps> = ({
  isOpen,
  state,
  stage,
  message,
  progress,
  internalConflicts,
  internalResolutions,
  availableCategories,
  onInternalResolutionChange,
  onInternalResolve,
  boardConflicts,
  boardResolutions,
  onBoardResolutionChange,
  onBoardResolve,
  onCancel,
}) => {
  // Check if all conflicts are resolved
  const allInternalResolved = internalConflicts.every(
    (conflict) =>
      internalResolutions[conflict.name] &&
      internalResolutions[conflict.name].selectedCategory
  );

  const allBoardResolved = boardConflicts.every(
    (conflict) =>
      boardResolutions[conflict.name] && boardResolutions[conflict.name].action
  );

  // Get conflict type description for internal conflicts
  const getInternalConflictDescription = (conflict: CSVInternalConflict) => {
    switch (conflict.type) {
      case 'duplicate_subject':
        return `This subject appears in multiple categories within your CSV file.`;
      case 'subject_vs_exclude':
        return `This term appears both as a subject and as an exclude term in your CSV file.`;
      case 'include_vs_exclude':
        return `This term appears in both include and exclude lists in your CSV file.`;
      default:
        return 'Unknown conflict type.';
    }
  };

  // Get available options for internal conflicts
  const getInternalAvailableOptions = (conflict: CSVInternalConflict) => {
    const options = [];

    conflict.categories.forEach((category) => {
      if (category === '_include') {
        options.push({ id: '_include', name: 'Include Terms' });
      } else if (category === '_exclude') {
        options.push({ id: '_exclude', name: 'Exclude Terms' });
      } else if (category === 'uncategorized') {
        options.push({ id: 'uncategorized', name: 'Uncategorized' });
      } else {
        const existingCategory = availableCategories.find(
          (cat) => cat.name.toLowerCase() === category.toLowerCase()
        );
        if (existingCategory) {
          options.push(existingCategory);
        } else {
          options.push({ id: category, name: category });
        }
      }
    });

    return options;
  };

  const renderProgressSection = () => (
    <VStack gap={4} align='stretch'>
      {/* Stage indicators */}
      <HStack gap={4} align='center'>
        {/* Stage 1 */}
        <HStack gap={2} flex='1'>
          <Box
            w={6}
            h={6}
            borderRadius='full'
            bg={stage > 1 ? 'green.500' : stage === 1 ? 'blue.500' : 'gray.300'}
            color='white'
            display='flex'
            alignItems='center'
            justifyContent='center'
            fontSize='xs'
            fontWeight='bold'
          >
            {stage > 1 ? <FiCheck size={12} /> : '1'}
          </Box>
          <VStack gap={0} align='start' flex='1'>
            <Text
              fontSize='sm'
              fontWeight='medium'
              color={stage >= 1 ? 'fg' : 'fg.muted'}
              fontFamily='heading'
            >
              Internal Check
            </Text>
            <Text fontSize='xs' color='fg.muted' fontFamily='body'>
              CSV file validation
            </Text>
          </VStack>
        </HStack>

        {/* Connection line */}
        <Box
          w={8}
          h={0.5}
          bg={stage > 1 ? 'green.500' : 'gray.300'}
          borderRadius='full'
        />

        {/* Stage 2 */}
        <HStack gap={2} flex='1'>
          <Box
            w={6}
            h={6}
            borderRadius='full'
            bg={stage === 2 ? 'blue.500' : 'gray.300'}
            color='white'
            display='flex'
            alignItems='center'
            justifyContent='center'
            fontSize='xs'
            fontWeight='bold'
          >
            2
          </Box>
          <VStack gap={0} align='start' flex='1'>
            <Text
              fontSize='sm'
              fontWeight='medium'
              color={stage >= 2 ? 'fg' : 'fg.muted'}
              fontFamily='heading'
            >
              Board Check
            </Text>
            <Text fontSize='xs' color='fg.muted' fontFamily='body'>
              Compare with existing data
            </Text>
          </VStack>
        </HStack>
      </HStack>

      {/* Current message */}
      <Box
        p={3}
        bg='bg.subtle'
        borderRadius='md'
        borderWidth='1px'
        borderColor='border.muted'
      >
        <HStack gap={3} align='center'>
          <Spinner size='sm' color='blue.500' />
          <Text fontSize='sm' color='fg' fontFamily='body'>
            {message}
          </Text>
        </HStack>
      </Box>

      {/* Progress bar */}
      <VStack gap={2} align='stretch'>
        <Progress.Root value={progress} size='md' bg='bg.muted'>
          <Progress.Track>
            <Progress.Range colorScheme='blue' />
          </Progress.Track>
        </Progress.Root>
        <HStack justify='space-between'>
          <Text fontSize='xs' color='fg.muted' fontFamily='body'>
            Processing...
          </Text>
          <Text fontSize='xs' color='fg.muted' fontFamily='mono'>
            {progress}%
          </Text>
        </HStack>
      </VStack>
    </VStack>
  );

  const renderInternalConflicts = () => (
    <VStack gap={4} align='stretch'>
      {/* Progress section at top */}
      {renderProgressSection()}

      {/* Conflicts section */}
      <Box borderTop='1px solid' borderTopColor='border.muted' pt={4}>
        <VStack gap={4} align='stretch'>
          <HStack gap={2} align='center'>
            <FiAlertTriangle
              size={16}
              color='var(--chakra-colors-orange-500)'
            />
            <Text
              fontSize='md'
              fontWeight='medium'
              color='fg'
              fontFamily='heading'
            >
              CSV File Issues Found
            </Text>
          </HStack>

          <Text
            fontSize='sm'
            color='fg.muted'
            fontFamily='body'
            lineHeight='1.5'
          >
            Your CSV file contains some internal conflicts that need to be
            resolved before we can process it. Please choose how to handle each
            conflict:
          </Text>

          {internalConflicts.map((conflict, conflictIndex) => (
            <Box
              key={`internal-conflict-${conflictIndex}-${conflict.name}`}
              p={4}
              bg='bg.subtle'
              borderRadius='md'
              borderWidth='1px'
              borderColor='orange.200'
              _dark={{ borderColor: 'orange.700' }}
            >
              <VStack gap={3} align='stretch'>
                <VStack gap={2} align='start'>
                  <HStack gap={2} align='center'>
                    <FiAlertTriangle
                      size={16}
                      color='var(--chakra-colors-orange-500)'
                    />
                    <Text
                      fontSize='md'
                      fontWeight='medium'
                      color='fg'
                      fontFamily='heading'
                    >
                      "{conflict.name}"
                    </Text>
                  </HStack>

                  <Text
                    fontSize='sm'
                    color='fg.muted'
                    fontFamily='body'
                    lineHeight='1.4'
                  >
                    {getInternalConflictDescription(conflict)}
                  </Text>

                  <HStack gap={2} wrap='wrap'>
                    <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                      Found in:
                    </Text>
                    {conflict.categories.map((category, categoryIndex) => (
                      <Badge
                        key={`category-${conflictIndex}-${categoryIndex}-${category}`}
                        colorScheme={
                          category === '_include'
                            ? 'green'
                            : category === '_exclude'
                            ? 'red'
                            : 'blue'
                        }
                        size='sm'
                        variant='subtle'
                      >
                        {category === '_include'
                          ? 'Include Terms'
                          : category === '_exclude'
                          ? 'Exclude Terms'
                          : category === 'uncategorized'
                          ? 'Uncategorized'
                          : category}
                      </Badge>
                    ))}
                  </HStack>
                </VStack>

                <VStack gap={2} align='stretch'>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='fg'
                    fontFamily='heading'
                  >
                    Keep in:
                  </Text>

                  <Select.Root
                    value={
                      internalResolutions[conflict.name]?.selectedCategory
                        ? [internalResolutions[conflict.name].selectedCategory]
                        : []
                    }
                    onValueChange={(details) => {
                      const selectedCategory = details.value[0];
                      if (selectedCategory) {
                        onInternalResolutionChange(conflict.name, {
                          selectedCategory,
                        });
                      }
                    }}
                  >
                    <Select.Trigger
                      bg='bg'
                      borderColor='border.muted'
                      color='fg'
                      _focus={{
                        borderColor: 'brand',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                      }}
                      fontFamily='body'
                    >
                      <Select.ValueText placeholder='Choose where to keep this term...' />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Positioner>
                      <Select.Content
                        bg='bg.canvas'
                        borderColor='border.emphasized'
                        boxShadow='lg'
                      >
                        <Select.ItemGroup>
                          {getInternalAvailableOptions(conflict).map(
                            (option, optionIndex) => (
                              <Select.Item
                                key={`option-${conflictIndex}-${optionIndex}-${option.id}`}
                                item={option.id}
                              >
                                <Select.ItemText color='fg' fontFamily='body'>
                                  {option.name}
                                </Select.ItemText>
                                <Select.ItemIndicator />
                              </Select.Item>
                            )
                          )}
                        </Select.ItemGroup>
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </VStack>
              </VStack>
            </Box>
          ))}

          {allInternalResolved && (
            <Box
              p={3}
              bg='green.50'
              _dark={{ bg: 'green.900' }}
              borderRadius='md'
              borderWidth='1px'
              borderColor='green.200'
              _dark={{ borderColor: 'green.700' }}
            >
              <Text
                fontSize='sm'
                color='green.800'
                _dark={{ color: 'green.200' }}
                fontFamily='body'
              >
                ✓ All CSV conflicts resolved. Click "Fix CSV Data" to continue.
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </VStack>
  );

  const renderBoardConflicts = () => (
    <VStack gap={4} align='stretch'>
      {/* Progress section at top */}
      {renderProgressSection()}

      {/* Conflicts section */}
      <Box borderTop='1px solid' borderTopColor='border.muted' pt={4}>
        <VStack gap={4} align='stretch'>
          <HStack gap={2} align='center'>
            <FiAlertTriangle
              size={16}
              color='var(--chakra-colors-orange-500)'
            />
            <Text
              fontSize='md'
              fontWeight='medium'
              color='fg'
              fontFamily='heading'
            >
              Data Conflicts Found
            </Text>
          </HStack>

          <Text
            fontSize='sm'
            color='fg.muted'
            fontFamily='body'
            lineHeight='1.5'
          >
            The following subjects exist in different categories. Choose how to
            resolve each conflict:
          </Text>

          {boardConflicts.map((conflict, conflictIndex) => (
            <Box
              key={`board-conflict-${conflictIndex}-${conflict.name}`}
              p={4}
              bg='bg.subtle'
              borderRadius='md'
              borderWidth='1px'
              borderColor={
                conflict.isExcludeConflict ? 'red.200' : 'orange.200'
              }
              _dark={{
                borderColor: conflict.isExcludeConflict
                  ? 'red.700'
                  : 'orange.700',
              }}
            >
              <VStack gap={3} align='stretch'>
                <VStack gap={2} align='start'>
                  <HStack gap={2} align='center'>
                    <Text
                      fontSize='md'
                      fontWeight='medium'
                      color='fg'
                      fontFamily='heading'
                    >
                      {conflict.name}
                    </Text>
                    <Badge
                      colorScheme={getSourceColor(conflict.source)}
                      size='sm'
                      variant='subtle'
                    >
                      {getSourceDisplayText(conflict.source)}
                    </Badge>
                    {conflict.isExcludeConflict && (
                      <Badge colorScheme='red' size='sm' variant='solid'>
                        Exclude Conflict
                      </Badge>
                    )}
                  </HStack>

                  {conflict.isExcludeConflict ? (
                    <VStack gap={2} align='start'>
                      <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                        This subject exists in your CSV but is already an
                        exclude term. Exclude terms filter out content, so
                        having it as both a subject and exclude term creates a
                        conflict.
                      </Text>
                      <HStack gap={2}>
                        <Badge colorScheme='red' variant='outline'>
                          Current: Exclude Term
                        </Badge>
                        <FiArrowRight
                          size={14}
                          color='var(--chakra-colors-fg-muted)'
                        />
                        <Badge colorScheme='blue' variant='outline'>
                          CSV: Subject in {conflict.newCategory}
                        </Badge>
                      </HStack>
                    </VStack>
                  ) : (
                    <HStack gap={4} align='center' w='100%'>
                      <Box textAlign='center'>
                        <Text
                          fontSize='xs'
                          color='fg.muted'
                          fontFamily='body'
                          mb={1}
                        >
                          Current Category
                        </Text>
                        <Badge colorScheme='blue' variant='solid'>
                          {conflict.existingCategory}
                        </Badge>
                      </Box>
                      <FiArrowRight
                        size={16}
                        color='var(--chakra-colors-fg-muted)'
                      />
                      <Box textAlign='center'>
                        <Text
                          fontSize='xs'
                          color='fg.muted'
                          fontFamily='body'
                          mb={1}
                        >
                          CSV Category
                        </Text>
                        <Badge colorScheme='green' variant='solid'>
                          {conflict.newCategory}
                        </Badge>
                      </Box>
                    </HStack>
                  )}
                </VStack>

                <VStack gap={2} align='stretch'>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='fg'
                    fontFamily='heading'
                  >
                    Resolution:
                  </Text>

                  <Select.Root
                    value={
                      boardResolutions[conflict.name]?.action
                        ? [boardResolutions[conflict.name].action]
                        : []
                    }
                    onValueChange={(details) => {
                      const action = details
                        .value[0] as ConflictResolution['action'];
                      if (action) {
                        const resolution: ConflictResolution = {
                          action,
                          targetCategory:
                            action === 'use_new'
                              ? conflict.newCategory
                              : conflict.existingCategory,
                        };
                        onBoardResolutionChange(conflict.name, resolution);
                      }
                    }}
                  >
                    <Select.Trigger
                      bg='bg'
                      borderColor='border.muted'
                      color='fg'
                      _focus={{
                        borderColor: 'brand',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                      }}
                      fontFamily='body'
                    >
                      <Select.ValueText placeholder='Choose resolution...' />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Positioner>
                      <Select.Content
                        bg='bg.canvas'
                        borderColor='border.emphasized'
                        boxShadow='2xl'
                      >
                        <Select.ItemGroup>
                          {conflict.isExcludeConflict ? (
                            <>
                              <Select.Item
                                key={`keep-existing-${conflictIndex}`}
                                item='keep_existing'
                              >
                                <Select.ItemText>
                                  Keep as exclude term (don't add subject)
                                </Select.ItemText>
                                <Select.ItemIndicator />
                              </Select.Item>
                              <Select.Item
                                key={`use-new-${conflictIndex}`}
                                item='use_new'
                              >
                                <Select.ItemText>
                                  Remove exclude term and add as subject in "
                                  {conflict.newCategory}"
                                </Select.ItemText>
                                <Select.ItemIndicator />
                              </Select.Item>
                            </>
                          ) : (
                            <>
                              <Select.Item
                                key={`keep-existing-${conflictIndex}`}
                                item='keep_existing'
                              >
                                <Select.ItemText>
                                  Keep in "{conflict.existingCategory}" (ignore
                                  CSV)
                                </Select.ItemText>
                                <Select.ItemIndicator />
                              </Select.Item>
                              <Select.Item
                                key={`use-new-${conflictIndex}`}
                                item='use_new'
                              >
                                <Select.ItemText>
                                  Move to "{conflict.newCategory}" (use CSV)
                                </Select.ItemText>
                                <Select.ItemIndicator />
                              </Select.Item>
                            </>
                          )}
                        </Select.ItemGroup>
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </VStack>
              </VStack>
            </Box>
          ))}

          {allBoardResolved && (
            <Box
              p={3}
              bg='green.50'
              _dark={{ bg: 'green.900' }}
              borderRadius='md'
              borderWidth='1px'
              borderColor='green.200'
              _dark={{ borderColor: 'green.700' }}
            >
              <Text
                fontSize='sm'
                color='green.800'
                _dark={{ color: 'green.200' }}
                fontFamily='body'
              >
                ✓ All conflicts resolved. Click "Apply Resolutions" to continue.
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </VStack>
  );

  const renderContent = () => {
    switch (state) {
      case 'stage1_processing':
      case 'stage2_processing':
        return renderProgressSection();
      case 'stage1_conflicts':
        return renderInternalConflicts();
      case 'stage2_conflicts':
        return renderBoardConflicts();
      case 'completed':
        return (
          <VStack gap={4} align='center'>
            <Box color='green.500'>
              <FiCheck size={32} />
            </Box>
            <Text
              fontSize='lg'
              fontWeight='medium'
              color='fg'
              fontFamily='heading'
            >
              CSV Import Completed!
            </Text>
            <Text fontSize='sm' color='fg.muted' fontFamily='body'>
              Your data has been successfully processed and added to the lab.
            </Text>
          </VStack>
        );
      default:
        return renderProgressSection();
    }
  };

  const renderFooter = () => {
    if (state === 'stage1_conflicts') {
      return (
        <HStack gap={3}>
          <Button
            variant='outline'
            onClick={onCancel}
            color='fg'
            borderColor='border.emphasized'
            bg='bg.canvas'
            _hover={{ bg: 'bg.hover' }}
            fontFamily='heading'
          >
            Cancel Upload
          </Button>
          <Button
            variant='solid'
            onClick={onInternalResolve}
            disabled={!allInternalResolved}
            bg='brand'
            color='white'
            _hover={{ bg: 'brand.hover' }}
            _disabled={{
              bg: 'gray.400',
              cursor: 'not-allowed',
            }}
            fontFamily='heading'
          >
            Fix CSV Data
          </Button>
        </HStack>
      );
    }

    if (state === 'stage2_conflicts') {
      return (
        <HStack gap={3}>
          <Button
            variant='outline'
            onClick={onCancel}
            color='fg'
            borderColor='border.emphasized'
            bg='bg.canvas'
            _hover={{ bg: 'bg.hover' }}
            fontFamily='heading'
          >
            Cancel Import
          </Button>
          <Button
            variant='solid'
            onClick={onBoardResolve}
            disabled={!allBoardResolved}
            bg='brand'
            color='white'
            _hover={{ bg: 'brand.hover' }}
            _disabled={{
              bg: 'gray.400',
              cursor: 'not-allowed',
            }}
            fontFamily='heading'
          >
            Apply Resolutions
          </Button>
        </HStack>
      );
    }

    // For processing states, no footer buttons
    return null;
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={() => {}}
      closeOnInteractOutside={false}
      closeOnEscape={
        state === 'stage1_conflicts' || state === 'stage2_conflicts'
      }
    >
      <Dialog.Backdrop
        bg='blackAlpha.700'
        zIndex={1500}
        backdropFilter='blur(4px)'
      />
      <Dialog.Positioner zIndex={1501}>
        <Dialog.Content
          bg='bg.canvas'
          borderColor='border.emphasized'
          maxW={
            state === 'stage1_conflicts' || state === 'stage2_conflicts'
              ? '2xl'
              : 'md'
          }
          w='90vw'
          maxH='90vh'
          overflowY='auto'
          zIndex={1502}
          boxShadow='2xl'
          borderWidth='1px'
        >
          <Dialog.Header>
            <HStack gap={3} align='center'>
              <FiFileText size={20} color='var(--chakra-colors-blue-500)' />
              <VStack gap={0} align='start'>
                <Dialog.Title color='fg' fontFamily='heading'>
                  {state === 'stage1_conflicts' || state === 'stage2_conflicts'
                    ? 'Resolve CSV Conflicts'
                    : 'Processing CSV File'}
                </Dialog.Title>
                <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                  {state === 'stage1_conflicts'
                    ? 'Fix internal CSV file issues'
                    : state === 'stage2_conflicts'
                    ? 'Resolve conflicts with existing data'
                    : `Step ${stage} of 2: Validating data`}
                </Text>
              </VStack>
            </HStack>
          </Dialog.Header>

          <Dialog.Body>{renderContent()}</Dialog.Body>

          {renderFooter() && <Dialog.Footer>{renderFooter()}</Dialog.Footer>}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default CombinedCSVProcessingModal;

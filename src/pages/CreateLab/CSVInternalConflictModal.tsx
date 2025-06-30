import React, { useCallback } from 'react';
import {
  Dialog,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Badge,
  Select,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiFileText } from 'react-icons/fi';

// Types
import type { CSVInternalConflict, CSVInternalResolution } from './types';

interface CSVInternalConflictModalProps {
  isOpen: boolean;
  conflicts: CSVInternalConflict[];
  resolutions: Record<string, CSVInternalResolution>;
  availableCategories: Array<{ id: string; name: string }>;
  onResolutionChange: (
    termName: string,
    resolution: CSVInternalResolution
  ) => void;
  onResolve: () => void;
  onCancel: () => void;
}

const CSVInternalConflictModal: React.FC<CSVInternalConflictModalProps> = ({
  isOpen,
  conflicts,
  resolutions,
  availableCategories,
  onResolutionChange,
  onResolve,
  onCancel,
}) => {
  // Handle resolution change for a specific conflict
  const handleResolutionChange = useCallback(
    (termName: string, selectedCategory: string) => {
      onResolutionChange(termName, { selectedCategory });
    },
    [onResolutionChange]
  );

  // Check if all conflicts are resolved
  const allResolved = conflicts.every(
    (conflict) =>
      resolutions[conflict.name] && resolutions[conflict.name].selectedCategory
  );

  // Get conflict type description
  const getConflictDescription = (conflict: CSVInternalConflict) => {
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

  // Get available options for a conflict
  const getAvailableOptions = (conflict: CSVInternalConflict) => {
    const options = [];

    // Add category options
    conflict.categories.forEach((category) => {
      if (category === '_include') {
        options.push({ id: '_include', name: 'Include Terms' });
      } else if (category === '_exclude') {
        options.push({ id: '_exclude', name: 'Exclude Terms' });
      } else if (category === 'uncategorized') {
        options.push({ id: 'uncategorized', name: 'Uncategorized' });
      } else {
        // Find existing category or use as-is
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && onCancel()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg='bg.canvas'
          borderColor='border.emphasized'
          maxW='2xl'
          w='90vw'
        >
          <Dialog.Header>
            <HStack gap={3} align='center'>
              <FiFileText size={20} color='var(--chakra-colors-orange-500)' />
              <VStack gap={0} align='start'>
                <Dialog.Title color='fg' fontFamily='heading'>
                  CSV File Issues Found
                </Dialog.Title>
                <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                  Please resolve conflicts within your CSV file first
                </Text>
              </VStack>
            </HStack>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} align='stretch'>
              <Text
                fontSize='sm'
                color='fg.muted'
                fontFamily='body'
                lineHeight='1.5'
              >
                Your CSV file contains some internal conflicts that need to be
                resolved before we can process it. Please choose how to handle
                each conflict:
              </Text>

              {conflicts.map((conflict) => (
                <Box
                  key={conflict.name}
                  p={4}
                  bg='bg.subtle'
                  borderRadius='md'
                  borderWidth='1px'
                  borderColor='orange.200'
                  _dark={{ borderColor: 'orange.700' }}
                >
                  <VStack gap={3} align='stretch'>
                    {/* Conflict description */}
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
                        {getConflictDescription(conflict)}
                      </Text>

                      {/* Show conflicting locations */}
                      <HStack gap={2} wrap='wrap'>
                        <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                          Found in:
                        </Text>
                        {conflict.categories.map((category, index) => (
                          <Badge
                            key={index}
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

                    {/* Resolution selection */}
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
                          resolutions[conflict.name]?.selectedCategory
                            ? [resolutions[conflict.name].selectedCategory]
                            : []
                        }
                        onValueChange={(details) => {
                          const selectedCategory = details.value[0];
                          if (selectedCategory) {
                            handleResolutionChange(
                              conflict.name,
                              selectedCategory
                            );
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
                              {getAvailableOptions(conflict).map((option) => (
                                <Select.Item key={option.id} item={option.id}>
                                  <Select.ItemText color='fg' fontFamily='body'>
                                    {option.name}
                                  </Select.ItemText>
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.ItemGroup>
                          </Select.Content>
                        </Select.Positioner>
                      </Select.Root>

                      {/* Show resolution explanation */}
                      {resolutions[conflict.name] && (
                        <Box
                          p={2}
                          bg='bg.canvas'
                          borderRadius='sm'
                          borderWidth='1px'
                          borderColor='border.muted'
                        >
                          <Text
                            fontSize='xs'
                            color='fg.muted'
                            fontFamily='body'
                          >
                            "{conflict.name}" will be kept in{' '}
                            {getAvailableOptions(conflict).find(
                              (opt) =>
                                opt.id ===
                                resolutions[conflict.name].selectedCategory
                            )?.name ||
                              resolutions[conflict.name].selectedCategory}
                            {conflict.categories.length > 1 &&
                              ` and removed from other locations.`}
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </VStack>
                </Box>
              ))}

              {/* Summary */}
              {allResolved && (
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
                    ✓ All CSV conflicts resolved. Click "Fix CSV Data" to
                    continue.
                  </Text>
                </Box>
              )}
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
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
                onClick={onResolve}
                disabled={!allResolved}
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
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default CSVInternalConflictModal;

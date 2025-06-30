import React, { useCallback } from 'react';
import {
  Dialog,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Select,
  Badge,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowRight } from 'react-icons/fi';

// Types and utils
import type { ConflictResolutionModalProps, ConflictResolution } from './types';
import { getSourceDisplayText, getSourceColor } from './utils';

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflicts,
  resolutions,
  isOpen,
  onResolutionChange,
  onResolve,
  onCancel,
}) => {
  // Handle resolution change for a specific conflict
  const handleResolutionChange = useCallback(
    (
      itemName: string,
      action: ConflictResolution['action'],
      targetCategory?: string
    ) => {
      const resolution: ConflictResolution = {
        action,
        targetCategory,
      };
      onResolutionChange(itemName, resolution);
    },
    [onResolutionChange]
  );

  // Check if all conflicts are resolved
  const allResolved = conflicts.every(
    (conflict) =>
      resolutions[conflict.name] && resolutions[conflict.name].action
  );

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
              <FiAlertTriangle
                size={20}
                color='var(--chakra-colors-orange-500)'
              />
              <VStack gap={0} align='start'>
                <Dialog.Title color='fg' fontFamily='heading'>
                  Resolve Data Conflicts
                </Dialog.Title>
                <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                  {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}{' '}
                  found when adding new data
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
                The following subjects exist in different categories. Choose how
                to resolve each conflict:
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
                      </HStack>

                      {/* Visual conflict representation */}
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
                            New Category
                          </Text>
                          <Badge colorScheme='green' variant='solid'>
                            {conflict.newCategory}
                          </Badge>
                        </Box>
                      </HStack>
                    </VStack>

                    {/* Resolution options */}
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
                          resolutions[conflict.name]?.action
                            ? [resolutions[conflict.name].action]
                            : []
                        }
                        onValueChange={(details) => {
                          const action = details
                            .value[0] as ConflictResolution['action'];
                          if (action) {
                            handleResolutionChange(
                              conflict.name,
                              action,
                              action === 'use_new'
                                ? conflict.newCategory
                                : conflict.existingCategory
                            );
                          }
                        }}
                      >
                        <Select.Label>Choose resolution...</Select.Label>
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
                          <Select.Content>
                            <Select.ItemGroup>
                              <Select.Item item='keep_existing'>
                                <Select.ItemText>
                                  Keep in "{conflict.existingCategory}" (ignore
                                  new data)
                                </Select.ItemText>
                                <Select.ItemIndicator />
                              </Select.Item>
                              <Select.Item item='use_new'>
                                <Select.ItemText>
                                  Move to "{conflict.newCategory}" (use new
                                  data)
                                </Select.ItemText>
                                <Select.ItemIndicator />
                              </Select.Item>
                              <Select.Item item='create_duplicate'>
                                <Select.ItemText>
                                  Create duplicate in both categories
                                </Select.ItemText>
                                <Select.ItemIndicator />
                              </Select.Item>
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
                            {resolutions[conflict.name].action ===
                              'keep_existing' &&
                              `Subject will remain in "${conflict.existingCategory}". New data will be ignored.`}
                            {resolutions[conflict.name].action === 'use_new' &&
                              `Subject will be moved to "${conflict.newCategory}".`}
                            {resolutions[conflict.name].action ===
                              'create_duplicate' &&
                              `Two separate subjects will be created - one in each category.`}
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
                    ✓ All conflicts resolved. Click "Apply Resolutions" to
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
                Cancel Import
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
                Apply Resolutions
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default ConflictResolutionModal;

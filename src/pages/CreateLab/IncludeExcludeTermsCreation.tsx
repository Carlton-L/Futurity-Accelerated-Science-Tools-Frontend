import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import {
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiInfo,
} from 'react-icons/fi';

// Types and utils
import type {
  IncludeExcludeTermsCreationProps,
  CreationTerm,
  CreationSubject,
  CreationCategory,
} from './types';
import {
  getSourceDisplayText,
  getSourceColor,
  checkExcludeTermConflicts,
} from './utils';

interface IncludeExcludeTermsCreationExtendedProps
  extends IncludeExcludeTermsCreationProps {
  // Add access to subjects and categories for conflict checking
  allSubjects: CreationSubject[];
  categories: CreationCategory[];
}

const IncludeExcludeTermsCreation: React.FC<
  IncludeExcludeTermsCreationExtendedProps
> = ({
  includeTerms,
  excludeTerms,
  onTermAdd,
  onTermRemove,
  onTermTypeToggle,
  canEdit,
  isLoading,
  allSubjects,
  categories,
}) => {
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [newTermText, setNewTermText] = useState('');
  const [newTermType, setNewTermType] = useState<'include' | 'exclude'>(
    'include'
  );
  const [validationError, setValidationError] = useState('');

  // Combine terms for display
  const allTerms: CreationTerm[] = [...includeTerms, ...excludeTerms];

  // Validate term for conflicts
  const validateTerm = useCallback(
    (text: string, type: 'include' | 'exclude') => {
      const trimmedText = text.trim();

      if (!trimmedText) return '';

      // Check if term already exists
      const termExists = allTerms.some(
        (term) => term.text.toLowerCase() === trimmedText.toLowerCase()
      );

      if (termExists) {
        return `"${trimmedText}" already exists in your terms list`;
      }

      // For exclude terms, check if it conflicts with existing subjects
      if (type === 'exclude') {
        const excludeConflict = checkExcludeTermConflicts(
          trimmedText,
          allSubjects,
          categories
        );

        if (excludeConflict) {
          const categoryNames = excludeConflict.conflictingSubjects
            .map((item) => item.categoryName)
            .join(', ');
          return `"${trimmedText}" exists as a subject in: ${categoryNames}. Exclude terms cannot match existing subjects.`;
        }
      }

      return '';
    },
    [allTerms, allSubjects, categories]
  );

  // Handle term addition
  const handleAddTerm = useCallback(() => {
    if (!newTermText.trim()) return;

    const error = validateTerm(newTermText, newTermType);
    if (error) {
      setValidationError(error);
      return;
    }

    onTermAdd(newTermText.trim(), newTermType, 'manual');
    setNewTermText('');
    setValidationError('');
    setIsAddingTerm(false);
  }, [newTermText, newTermType, onTermAdd, validateTerm]);

  // Handle input key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddTerm();
      } else if (e.key === 'Escape') {
        setNewTermText('');
        setValidationError('');
        setIsAddingTerm(false);
      }
    },
    [handleAddTerm]
  );

  // Handle input changes with validation
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setNewTermText(value);

      // Clear error when user starts typing
      if (validationError) {
        setValidationError('');
      }

      // Real-time validation for exclude terms
      if (value.trim() && newTermType === 'exclude') {
        const error = validateTerm(value, newTermType);
        setValidationError(error);
      }
    },
    [validationError, newTermType, validateTerm]
  );

  // Handle type change with validation
  const handleTypeChange = useCallback(
    (type: 'include' | 'exclude') => {
      setNewTermType(type);

      // Re-validate current input with new type
      if (newTermText.trim()) {
        const error = validateTerm(newTermText, type);
        setValidationError(error);
      }
    },
    [newTermText, validateTerm]
  );

  // Handle term type toggle with validation
  const handleTermTypeToggle = useCallback(
    (termId: string) => {
      const term = allTerms.find((t) => t.id === termId);
      if (!term) return;

      // If switching TO exclude, check for conflicts
      if (term.type === 'include') {
        const excludeConflict = checkExcludeTermConflicts(
          term.text,
          allSubjects,
          categories
        );

        if (excludeConflict) {
          const categoryNames = excludeConflict.conflictingSubjects
            .map((item) => item.categoryName)
            .join(', ');

          // Show error (in a real app, you'd use a toast or modal)
          alert(
            `Cannot change "${term.text}" to exclude term because it exists as a subject in: ${categoryNames}`
          );
          return;
        }
      }

      onTermTypeToggle(termId);
    },
    [allTerms, allSubjects, categories, onTermTypeToggle]
  );

  return (
    <Box
      w='280px'
      h='400px'
      borderColor='border.emphasized'
      borderWidth='1px'
      borderRadius='md'
      display='flex'
      flexDirection='column'
      opacity={isLoading ? 0.7 : 1}
    >
      {/* Header */}
      <Box p={3} borderBottom='1px solid' borderBottomColor='border.muted'>
        <VStack gap={2} align='start'>
          <HStack justify='space-between' align='center' w='100%'>
            <Text
              fontSize='sm'
              fontWeight='medium'
              color='fg'
              fontFamily='heading'
            >
              Include/Exclude Terms
            </Text>

            <Box
              cursor='help'
              color='fg.muted'
              _hover={{ color: 'fg' }}
              title='Include terms help find relevant content. Exclude terms filter out unwanted results. Exclude terms cannot match existing subjects.'
            >
              <FiInfo size={12} />
            </Box>
          </HStack>

          <HStack gap={4} fontSize='xs' color='fg.muted' fontFamily='body'>
            <Text>Include: {includeTerms.length}</Text>
            <Text>Exclude: {excludeTerms.length}</Text>
          </HStack>
        </VStack>
      </Box>

      {/* Terms List */}
      <Box flex='1' p={3} overflowY='scroll'>
        <VStack gap={2} align='stretch'>
          {/* Add new term */}
          {isAddingTerm ? (
            <Box
              p={2}
              border='1px solid'
              borderColor={validationError ? 'red.500' : 'brand'}
              borderRadius='md'
              bg='bg.canvas'
            >
              <VStack gap={2}>
                <Input
                  value={newTermText}
                  onChange={handleInputChange}
                  placeholder='Enter term...'
                  size='sm'
                  autoFocus
                  bg='bg'
                  borderColor={validationError ? 'red.500' : 'border.muted'}
                  color='fg'
                  _focus={{
                    borderColor: validationError ? 'red.500' : 'brand',
                    boxShadow: validationError
                      ? '0 0 0 1px var(--chakra-colors-red-500)'
                      : '0 0 0 1px var(--chakra-colors-brand)',
                  }}
                  onKeyDown={handleKeyPress}
                  fontFamily='body'
                  disabled={isLoading}
                />

                {/* Validation error */}
                {validationError && (
                  <Text
                    fontSize='xs'
                    color='red.500'
                    fontFamily='body'
                    lineHeight='1.2'
                  >
                    {validationError}
                  </Text>
                )}

                <HStack gap={2} w='100%'>
                  <Button
                    size='xs'
                    variant={newTermType === 'include' ? 'solid' : 'outline'}
                    onClick={() => handleTypeChange('include')}
                    flex='1'
                    fontSize='xs'
                    fontFamily='body'
                    colorScheme='green'
                    disabled={isLoading}
                  >
                    Include
                  </Button>
                  <Button
                    size='xs'
                    variant={newTermType === 'exclude' ? 'solid' : 'outline'}
                    onClick={() => handleTypeChange('exclude')}
                    flex='1'
                    fontSize='xs'
                    fontFamily='body'
                    colorScheme='red'
                    disabled={isLoading}
                  >
                    Exclude
                  </Button>
                </HStack>

                <HStack gap={2} w='100%'>
                  <IconButton
                    size='xs'
                    variant='solid'
                    colorScheme='green'
                    onClick={handleAddTerm}
                    aria-label='Add term'
                    disabled={
                      !newTermText.trim() || !!validationError || isLoading
                    }
                    flex='1'
                  >
                    <FiCheck size={12} />
                  </IconButton>
                  <Button
                    size='xs'
                    variant='ghost'
                    onClick={() => {
                      setNewTermText('');
                      setValidationError('');
                      setIsAddingTerm(false);
                    }}
                    flex='1'
                    fontSize='xs'
                    fontFamily='body'
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            </Box>
          ) : (
            canEdit && (
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setIsAddingTerm(true)}
                disabled={isLoading}
                justifyContent='flex-start'
                color='fg.muted'
                _hover={{ color: 'fg', bg: 'bg.hover' }}
                fontFamily='body'
              >
                <FiPlus size={14} />
                Add Term
              </Button>
            )
          )}

          {/* Existing terms */}
          {allTerms.length > 0 ? (
            allTerms.map((term) => {
              // Check if this exclude term has conflicts (for display purposes)
              const hasConflict =
                term.type === 'exclude' &&
                checkExcludeTermConflicts(term.text, allSubjects, categories);

              return (
                <Box
                  key={term.id}
                  p={2}
                  border='1px solid'
                  borderColor={
                    hasConflict
                      ? 'red.500'
                      : term.type === 'include'
                      ? 'green.300'
                      : 'red.300'
                  }
                  borderRadius='md'
                  bg={
                    hasConflict
                      ? 'red.100'
                      : term.type === 'include'
                      ? 'green.50'
                      : 'red.50'
                  }
                  _dark={{
                    bg: hasConflict
                      ? 'red.800'
                      : term.type === 'include'
                      ? 'green.900'
                      : 'red.900',
                    borderColor: hasConflict
                      ? 'red.400'
                      : term.type === 'include'
                      ? 'green.700'
                      : 'red.700',
                  }}
                  transition='all 0.2s'
                  opacity={isLoading ? 0.7 : 1}
                >
                  <VStack gap={1} align='stretch'>
                    {/* Term text and actions */}
                    <HStack justify='space-between' align='start'>
                      <VStack gap={1} align='start' flex='1' minW={0}>
                        <Text
                          fontSize='xs'
                          color='fg'
                          fontWeight='medium'
                          lineHeight='1.2'
                          fontFamily='body'
                          truncate
                        >
                          {term.text}
                        </Text>

                        <HStack gap={1}>
                          <Badge
                            colorScheme={getSourceColor(term.source)}
                            size='xs'
                            variant='subtle'
                          >
                            {getSourceDisplayText(term.source)}
                          </Badge>

                          {hasConflict && (
                            <Badge
                              colorScheme='red'
                              size='xs'
                              variant='solid'
                              title='This exclude term conflicts with existing subjects'
                            >
                              Conflict
                            </Badge>
                          )}
                        </HStack>
                      </VStack>

                      {canEdit && (
                        <HStack gap={1}>
                          {/* Toggle include/exclude */}
                          <IconButton
                            size='xs'
                            variant='ghost'
                            colorScheme={
                              term.type === 'include' ? 'green' : 'red'
                            }
                            onClick={() => handleTermTypeToggle(term.id)}
                            aria-label={`Toggle to ${
                              term.type === 'include' ? 'exclude' : 'include'
                            }`}
                            disabled={isLoading}
                            title={`Click to ${
                              term.type === 'include' ? 'exclude' : 'include'
                            } this term`}
                          >
                            {term.type === 'include' ? (
                              <FiEye size={10} />
                            ) : (
                              <FiEyeOff size={10} />
                            )}
                          </IconButton>

                          {/* Delete term */}
                          <IconButton
                            size='xs'
                            variant='ghost'
                            colorScheme='gray'
                            onClick={() => onTermRemove(term.id)}
                            aria-label='Delete term'
                            disabled={isLoading}
                            title='Delete this term'
                            _hover={{ colorScheme: 'red' }}
                          >
                            <FiTrash2 size={10} />
                          </IconButton>
                        </HStack>
                      )}
                    </HStack>

                    {/* Show conflict details */}
                    {hasConflict && (
                      <Text
                        fontSize='xs'
                        color='red.600'
                        _dark={{ color: 'red.300' }}
                        fontFamily='body'
                        lineHeight='1.2'
                      >
                        Conflicts with subjects in:{' '}
                        {hasConflict.conflictingSubjects
                          .map((item) => item.categoryName)
                          .join(', ')}
                      </Text>
                    )}
                  </VStack>
                </Box>
              );
            })
          ) : (
            <Box
              p={3}
              textAlign='center'
              border='2px dashed'
              borderColor='border.muted'
              borderRadius='md'
              bg='bg.subtle'
            >
              <VStack gap={2}>
                <Text color='fg.muted' fontSize='xs' fontFamily='body'>
                  No terms yet
                </Text>
                {canEdit && (
                  <Text color='fg.muted' fontSize='xs' fontFamily='body'>
                    Click "Add Term" to get started
                  </Text>
                )}
              </VStack>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Footer */}
      <Box p={2} borderTop='1px solid' borderTopColor='border.muted'>
        <Text
          fontSize='xs'
          color='fg.muted'
          textAlign='center'
          fontFamily='body'
          lineHeight='1.3'
        >
          Filter search results
        </Text>
      </Box>
    </Box>
  );
};

export default IncludeExcludeTermsCreation;

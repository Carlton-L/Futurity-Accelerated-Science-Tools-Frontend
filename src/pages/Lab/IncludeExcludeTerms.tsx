import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiInfo,
} from 'react-icons/fi';

interface LabTerm {
  id: string;
  text: string;
  type: 'include' | 'exclude';
}

interface IncludeExcludeTermsProps {
  includeTerms: string[];
  excludeTerms: string[];
  onTermsUpdate: (
    includeTerms: string[],
    excludeTerms: string[]
  ) => Promise<void>;
  userRole: 'reader' | 'editor' | 'admin';
  isLoading?: boolean;
}

export const IncludeExcludeTerms: React.FC<IncludeExcludeTermsProps> = ({
  includeTerms,
  excludeTerms,
  onTermsUpdate,
  userRole,
  isLoading = false,
}) => {
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [newTermText, setNewTermText] = useState('');
  const [newTermType, setNewTermType] = useState<'include' | 'exclude'>(
    'include'
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Convert string arrays to LabTerm objects for easier manipulation
  const terms: LabTerm[] = useMemo(
    () => [
      ...includeTerms.map((term, index) => ({
        id: `include-${index}`,
        text: term,
        type: 'include' as const,
      })),
      ...excludeTerms.map((term, index) => ({
        id: `exclude-${index}`,
        text: term,
        type: 'exclude' as const,
      })),
    ],
    [includeTerms, excludeTerms]
  );

  // Helper function to update terms using the API-integrated callback
  const updateTerms = useCallback(
    async (updatedTerms: LabTerm[]) => {
      if (isUpdating) return; // Prevent concurrent updates

      setIsUpdating(true);
      try {
        const newIncludeTerms = updatedTerms
          .filter((term) => term.type === 'include')
          .map((term) => term.text);
        const newExcludeTerms = updatedTerms
          .filter((term) => term.type === 'exclude')
          .map((term) => term.text);

        console.log('IncludeExcludeTerms: Updating terms', {
          newIncludeTerms,
          newExcludeTerms,
        });

        await onTermsUpdate(newIncludeTerms, newExcludeTerms);
      } catch (error) {
        console.error('Failed to update terms:', error);
        // TODO: Show error toast
      } finally {
        setIsUpdating(false);
      }
    },
    [onTermsUpdate, isUpdating]
  );

  // Toggle term type between include and exclude
  const handleToggleTermType = useCallback(
    async (termId: string) => {
      if (userRole === 'reader' || isUpdating) return;

      const updatedTerms = terms.map((term) =>
        term.id === termId
          ? {
              ...term,
              type:
                term.type === 'include'
                  ? ('exclude' as const)
                  : ('include' as const),
            }
          : term
      );

      await updateTerms(updatedTerms);
    },
    [terms, updateTerms, userRole, isUpdating]
  );

  // Remove a term
  const handleRemoveTerm = useCallback(
    async (termId: string) => {
      if (userRole === 'reader' || isUpdating) return;

      const updatedTerms = terms.filter((term) => term.id !== termId);
      await updateTerms(updatedTerms);
    },
    [terms, updateTerms, userRole, isUpdating]
  );

  // Add a new term
  const handleAddTerm = useCallback(async () => {
    if (!newTermText.trim() || userRole === 'reader' || isUpdating) return;

    // Check if term already exists
    const termExists = terms.some(
      (term) => term.text.toLowerCase() === newTermText.trim().toLowerCase()
    );

    if (termExists) {
      // TODO: Show error toast via parent component
      console.warn('Term already exists');
      return;
    }

    const newTerm: LabTerm = {
      id: `${newTermType}-${Date.now()}`,
      text: newTermText.trim(),
      type: newTermType,
    };

    await updateTerms([...terms, newTerm]);
    setNewTermText('');
    setIsAddingTerm(false);
  }, [newTermText, newTermType, terms, updateTerms, userRole, isUpdating]);

  // Cancel adding new term
  const handleCancelAdd = useCallback(() => {
    setNewTermText('');
    setIsAddingTerm(false);
  }, []);

  // Handle input key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddTerm();
      } else if (e.key === 'Escape') {
        handleCancelAdd();
      }
    },
    [handleAddTerm, handleCancelAdd]
  );

  const canEdit = userRole === 'editor' || userRole === 'admin';
  const isDisabled = isLoading || isUpdating;

  return (
    <Box
      minW='200px'
      maxW='250px'
      h='calc(100vh - 250px)'
      bg='bg.canvas'
      borderColor='border.emphasized'
      borderWidth='1px'
      borderRadius='md'
      display='flex'
      flexDirection='column'
      opacity={isDisabled ? 0.7 : 1}
    >
      {/* Header */}
      <Box p={4} borderBottom='1px solid' borderBottomColor='border.muted'>
        <HStack justify='space-between' align='center'>
          <VStack gap={0} align='start' flex='1'>
            <Text
              fontSize='sm'
              fontWeight='medium'
              color='fg'
              fontFamily='body'
            >
              Include/Exclude Terms
              {isUpdating && (
                <Text as='span' fontSize='xs' color='fg.muted' ml={2}>
                  (updating...)
                </Text>
              )}
            </Text>

            <Text fontSize='xs' color='fg.muted' fontFamily='body'>
              {terms.filter((t) => t.type === 'include').length} include,{' '}
              {terms.filter((t) => t.type === 'exclude').length} exclude
            </Text>
          </VStack>

          <Tooltip.Root openDelay={500} closeDelay={100}>
            <Tooltip.Trigger asChild>
              <Box
                color='text.primary'
                cursor='help'
                _hover={{ color: 'text.muted' }}
              >
                <FiInfo size={12} />
              </Box>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content>
                <Tooltip.Arrow />
                <Box maxW='250px' p={2}>
                  <Text fontSize='sm' fontWeight='medium' mb={1}>
                    Search Filter Terms
                  </Text>
                  <Text fontSize='xs' lineHeight='1.4'>
                    Include terms will be prioritized in searches. Exclude terms
                    will be filtered out from analysis results. These terms
                    affect how subjects are discovered and analyzed in this lab.
                  </Text>
                </Box>
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        </HStack>
      </Box>

      {/* Terms List */}
      <Box flex='1' p={3} overflowY='auto'>
        <VStack gap={2} align='stretch'>
          {/* Add new term input */}
          {isAddingTerm ? (
            <Box
              p={2}
              border='1px solid'
              borderColor='brand'
              borderRadius='md'
              bg='bg.canvas'
            >
              <VStack gap={2}>
                <Input
                  value={newTermText}
                  onChange={(e) => setNewTermText(e.target.value)}
                  placeholder='Enter term...'
                  size='sm'
                  autoFocus
                  bg='bg'
                  borderColor='border.muted'
                  color='fg'
                  _focus={{
                    borderColor: 'brand',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                  }}
                  onKeyDown={handleKeyPress}
                  fontFamily='body'
                  disabled={isDisabled}
                />
                <HStack gap={2} w='100%'>
                  <Button
                    size='xs'
                    variant='outline'
                    onClick={() => setNewTermType('include')}
                    flex='1'
                    fontSize='xs'
                    fontFamily='body'
                    bg={newTermType === 'include' ? '#3DB462' : 'bg.canvas'}
                    color={newTermType === 'include' ? 'white' : 'fg'}
                    borderColor={
                      newTermType === 'include'
                        ? '#3DB462'
                        : 'border.emphasized'
                    }
                    _hover={{
                      bg: newTermType === 'include' ? '#2F8B49' : 'bg.hover',
                      opacity: newTermType === 'include' ? 1 : 1,
                    }}
                    disabled={isDisabled}
                  >
                    Include
                  </Button>
                  <Button
                    size='xs'
                    variant='outline'
                    onClick={() => setNewTermType('exclude')}
                    flex='1'
                    fontSize='xs'
                    fontFamily='body'
                    bg={newTermType === 'exclude' ? 'error' : 'bg.canvas'}
                    color={newTermType === 'exclude' ? 'white' : 'fg'}
                    borderColor={
                      newTermType === 'exclude' ? 'error' : 'border.emphasized'
                    }
                    _hover={{
                      bg: newTermType === 'exclude' ? 'error' : 'bg.hover',
                      opacity: newTermType === 'exclude' ? 0.9 : 1,
                    }}
                    disabled={isDisabled}
                  >
                    Exclude
                  </Button>
                </HStack>
                <HStack gap={2} w='100%'>
                  <IconButton
                    size='xs'
                    variant='ghost'
                    color='success'
                    onClick={handleAddTerm}
                    aria-label='Confirm add term'
                    disabled={!newTermText.trim() || isDisabled}
                    flex='1'
                    _hover={{ bg: 'bg.hover' }}
                  >
                    <FiCheck size={12} />
                  </IconButton>
                  <Button
                    size='xs'
                    variant='ghost'
                    color='fg.muted'
                    onClick={handleCancelAdd}
                    flex='1'
                    _hover={{ bg: 'bg.hover', color: 'fg' }}
                    fontSize='xs'
                    fontFamily='body'
                    disabled={isDisabled}
                  >
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            </Box>
          ) : (
            canEdit && (
              <IconButton
                size='xs'
                variant='ghost'
                color='text.primary'
                _hover={{ color: 'text.muted', bg: 'bg.hover' }}
                onClick={() => {
                  setNewTermType('include');
                  setIsAddingTerm(true);
                }}
                aria-label='Add new term'
                disabled={isDisabled || isAddingTerm}
              >
                <FiPlus size={12} />
              </IconButton>
            )
          )}

          {/* Existing terms */}
          {terms.length > 0 ? (
            terms.map((term) => (
              <Box
                key={term.id}
                p={2}
                border='1px solid'
                borderColor={term.type === 'include' ? 'success' : 'error'}
                borderRadius='md'
                bg={term.type === 'include' ? 'successSubtle' : 'errorSubtle'}
                transition='all 0.2s'
                opacity={isDisabled ? 0.7 : 1}
              >
                <HStack justify='space-between' align='center'>
                  <Text
                    fontSize='xs'
                    color={term.type === 'include' ? 'success' : 'error'}
                    flex='1'
                    lineHeight='1.2'
                    fontFamily='body'
                  >
                    {term.text}
                  </Text>

                  {canEdit && (
                    <HStack gap={1}>
                      {/* Toggle include/exclude */}
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <IconButton
                            size='xs'
                            variant='ghost'
                            color={
                              term.type === 'include' ? 'success' : 'error'
                            }
                            _hover={{
                              color:
                                term.type === 'include' ? 'success' : 'error',
                              bg: 'bg.hover',
                            }}
                            onClick={() => handleToggleTermType(term.id)}
                            aria-label={`Toggle to ${
                              term.type === 'include' ? 'exclude' : 'include'
                            }`}
                            disabled={isDisabled}
                          >
                            {term.type === 'include' ? (
                              <FiEye size={10} />
                            ) : (
                              <FiEyeOff size={10} />
                            )}
                          </IconButton>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                          <Tooltip.Content>
                            <Tooltip.Arrow />
                            <Text fontSize='xs' fontFamily='body'>
                              {term.type === 'include'
                                ? 'Click to exclude this term'
                                : 'Click to include this term'}
                            </Text>
                          </Tooltip.Content>
                        </Tooltip.Positioner>
                      </Tooltip.Root>

                      {/* Delete term */}
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <IconButton
                            size='xs'
                            variant='ghost'
                            color='fg.muted'
                            _hover={{ color: 'error', bg: 'bg.hover' }}
                            onClick={() => handleRemoveTerm(term.id)}
                            aria-label='Delete term'
                            disabled={isDisabled}
                          >
                            <FiTrash2 size={10} />
                          </IconButton>
                        </Tooltip.Trigger>
                        <Tooltip.Positioner>
                          <Tooltip.Content>
                            <Tooltip.Arrow />
                            <Text fontSize='xs' fontFamily='body'>
                              Delete term
                            </Text>
                          </Tooltip.Content>
                        </Tooltip.Positioner>
                      </Tooltip.Root>
                    </HStack>
                  )}
                </HStack>
              </Box>
            ))
          ) : (
            <Box
              p={4}
              textAlign='center'
              border='2px dashed'
              borderColor='border.muted'
              borderRadius='md'
              bg='bg.subtle'
            >
              <Text color='fg.muted' fontSize='xs' fontFamily='body'>
                {canEdit ? 'Click + to add terms' : 'No terms defined'}
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Footer */}
      <Box p={3} borderTop='1px solid' borderTopColor='border.muted'>
        <Text
          fontSize='xs'
          color='fg.muted'
          textAlign='center'
          fontFamily='body'
        >
          Terms affect search & analysis
        </Text>
      </Box>
    </Box>
  );
};

export default IncludeExcludeTerms;

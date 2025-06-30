import React, { useCallback } from 'react';
import {
  Dialog,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Badge,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiEyeOff, FiTrash2 } from 'react-icons/fi';

// Types
import type { ExcludeTermConflict } from './types';

interface ExcludeTermConflictModalProps {
  isOpen: boolean;
  conflict: ExcludeTermConflict | null;
  onResolve: (action: 'keep_exclude' | 'keep_subjects') => void;
  onCancel: () => void;
}

const ExcludeTermConflictModal: React.FC<ExcludeTermConflictModalProps> = ({
  isOpen,
  conflict,
  onResolve,
  onCancel,
}) => {
  const handleKeepExclude = useCallback(() => {
    onResolve('keep_exclude');
  }, [onResolve]);

  const handleKeepSubjects = useCallback(() => {
    onResolve('keep_subjects');
  }, [onResolve]);

  if (!conflict) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && onCancel()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg='bg.canvas'
          borderColor='border.emphasized'
          maxW='lg'
          w='90vw'
        >
          <Dialog.Header>
            <HStack gap={3} align='center'>
              <FiAlertTriangle size={20} color='var(--chakra-colors-red-500)' />
              <VStack gap={0} align='start'>
                <Dialog.Title color='fg' fontFamily='heading'>
                  Exclude Term Conflict
                </Dialog.Title>
                <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                  A term cannot be both a subject and an exclude term
                </Text>
              </VStack>
            </HStack>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} align='stretch'>
              {/* Conflict description */}
              <Box
                p={3}
                bg='bg.subtle'
                borderRadius='md'
                borderWidth='1px'
                borderColor='border.muted'
              >
                <VStack gap={2} align='start'>
                  <HStack gap={2} align='center'>
                    <FiEyeOff size={16} color='var(--chakra-colors-red-500)' />
                    <Text
                      fontSize='md'
                      fontWeight='medium'
                      color='fg'
                      fontFamily='heading'
                    >
                      "{conflict.termName}"
                    </Text>
                  </HStack>

                  <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                    You're trying to add this as an exclude term, but it already
                    exists as a subject in:
                  </Text>

                  <VStack gap={1} align='start'>
                    {conflict.conflictingSubjects.map((item, index) => (
                      <HStack key={index} gap={2}>
                        <Badge colorScheme='blue' size='sm' variant='subtle'>
                          {item.categoryName}
                        </Badge>
                        <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                          (from {item.subject.source})
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Box>

              {/* Action options */}
              <VStack gap={3} align='stretch'>
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  color='fg'
                  fontFamily='heading'
                >
                  Choose an action:
                </Text>

                {/* Keep as exclude term option */}
                <Box
                  p={3}
                  border='1px solid'
                  borderColor='red.200'
                  _dark={{ borderColor: 'red.700' }}
                  borderRadius='md'
                  bg='red.50'
                  _dark={{ bg: 'red.900' }}
                  cursor='pointer'
                  onClick={handleKeepExclude}
                  _hover={{
                    borderColor: 'red.300',
                    _dark: { borderColor: 'red.600' },
                  }}
                  transition='all 0.2s'
                >
                  <HStack gap={3} align='start'>
                    <Box mt={1}>
                      <FiEyeOff
                        size={16}
                        color='var(--chakra-colors-red-500)'
                      />
                    </Box>
                    <VStack gap={1} align='start' flex='1'>
                      <Text
                        fontSize='sm'
                        fontWeight='medium'
                        color='red.800'
                        _dark={{ color: 'red.200' }}
                        fontFamily='heading'
                      >
                        Add as Exclude Term
                      </Text>
                      <Text
                        fontSize='xs'
                        color='red.700'
                        _dark={{ color: 'red.300' }}
                        fontFamily='body'
                        lineHeight='1.4'
                      >
                        Remove "{conflict.termName}" from all categories and add
                        it to exclude terms. This will filter out this term from
                        search results.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {/* Keep as subjects option */}
                <Box
                  p={3}
                  border='1px solid'
                  borderColor='blue.200'
                  _dark={{ borderColor: 'blue.700' }}
                  borderRadius='md'
                  bg='blue.50'
                  _dark={{ bg: 'blue.900' }}
                  cursor='pointer'
                  onClick={handleKeepSubjects}
                  _hover={{
                    borderColor: 'blue.300',
                    _dark: { borderColor: 'blue.600' },
                  }}
                  transition='all 0.2s'
                >
                  <HStack gap={3} align='start'>
                    <Box mt={1}>
                      <FiTrash2
                        size={16}
                        color='var(--chakra-colors-blue-500)'
                      />
                    </Box>
                    <VStack gap={1} align='start' flex='1'>
                      <Text
                        fontSize='sm'
                        fontWeight='medium'
                        color='blue.800'
                        _dark={{ color: 'blue.200' }}
                        fontFamily='heading'
                      >
                        Keep as Subject
                      </Text>
                      <Text
                        fontSize='xs'
                        color='blue.700'
                        _dark={{ color: 'blue.300' }}
                        fontFamily='body'
                        lineHeight='1.4'
                      >
                        Cancel adding the exclude term and keep "
                        {conflict.termName}" as a subject in{' '}
                        {conflict.conflictingSubjects
                          .map((s) => s.categoryName)
                          .join(', ')}
                        .
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
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
                Cancel
              </Button>

              <Button
                variant='solid'
                onClick={handleKeepSubjects}
                bg='blue.500'
                color='white'
                _hover={{ bg: 'blue.600' }}
                fontFamily='heading'
              >
                Keep as Subject
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default ExcludeTermConflictModal;

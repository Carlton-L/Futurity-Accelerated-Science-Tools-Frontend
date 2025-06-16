import React, { useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  IconButton,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { FiSearch, FiExternalLink, FiX, FiCheck, FiPlus } from 'react-icons/fi';
import type { SubjectSearchResult } from './types';

interface SubjectSearchProps {
  searchQuery: string;
  searchResults: SubjectSearchResult[];
  isSearching: boolean;
  showSearchDropdown: boolean;
  userRole: 'reader' | 'editor' | 'admin';
  isSubjectInLab: (subjectId: string) => boolean;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onClearSearch: () => void;
  onAddSubject: (result: SubjectSearchResult) => void;
  onGoToSearchResults: () => void;
  setShowSearchDropdown: (show: boolean) => void;
}

export const SubjectSearch: React.FC<SubjectSearchProps> = ({
  searchQuery,
  searchResults,
  isSearching,
  showSearchDropdown,
  userRole,
  isSubjectInLab,
  onSearchChange,
  onSearchFocus,
  onClearSearch,
  onAddSubject,
  onGoToSearchResults,
  setShowSearchDropdown,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideSearchInput = searchInputRef.current?.contains(target);
      const isInsideDropdown = searchDropdownRef.current?.contains(target);
      if (!isInsideSearchInput && !isInsideDropdown) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSearchDropdown]);

  return (
    <Box position='relative' flex='1' maxW='400px'>
      <Box position='relative'>
        <Input
          ref={searchInputRef}
          placeholder='Search and add subjects...'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onSearchFocus}
          size='md'
          bg='gray.700'
          borderColor='gray.500'
          color='white'
          _placeholder={{ color: 'gray.400' }}
          _focus={{ borderColor: 'blue.400' }}
          pr={searchQuery.length > 0 ? '40px' : '12px'}
          disabled={userRole === 'reader'}
        />

        {/* Clear search button */}
        {searchQuery.length > 0 && (
          <IconButton
            position='absolute'
            right='8px'
            top='50%'
            transform='translateY(-50%)'
            size='xs'
            variant='ghost'
            aria-label='Clear search'
            onClick={onClearSearch}
            color='gray.400'
            _hover={{ color: 'gray.200' }}
          >
            <FiX size={14} />
          </IconButton>
        )}
      </Box>

      {/* Search Results Dropdown */}
      {showSearchDropdown && (
        <Box
          ref={searchDropdownRef}
          position='absolute'
          top='100%'
          left='0'
          right='0'
          mt={1}
          bg='gray.800'
          border='1px solid'
          borderColor='gray.600'
          borderRadius='md'
          boxShadow='lg'
          zIndex='20'
          maxH='300px'
          overflowY='auto'
        >
          {/* View all results button */}
          <Button
            w='100%'
            variant='ghost'
            justifyContent='flex-start'
            onClick={onGoToSearchResults}
            color='blue.300'
            _hover={{ bg: 'gray.700' }}
            borderRadius='0'
            borderBottom='1px solid'
            borderBottomColor='gray.600'
            py={3}
          >
            <FiSearch size={16} />
            <Text ml={2}>View all search results for "{searchQuery}"</Text>
            <FiExternalLink size={14} />
          </Button>

          {/* Loading state */}
          {isSearching && (
            <Flex align='center' justify='center' py={4}>
              <Spinner size='sm' color='blue.400' />
              <Text ml={2} fontSize='sm' color='gray.400'>
                Searching subjects...
              </Text>
            </Flex>
          )}

          {/* Search results */}
          {!isSearching && searchResults.length > 0 && (
            <VStack gap={0} align='stretch'>
              {searchResults.map((result) => {
                const alreadyInLab = isSubjectInLab(result.id);
                return (
                  <HStack
                    key={result.id}
                    p={3}
                    _hover={{ bg: 'gray.700' }}
                    justify='space-between'
                    opacity={alreadyInLab ? 0.6 : 1}
                  >
                    <VStack gap={1} align='stretch' flex='1'>
                      <HStack gap={2}>
                        <Text fontSize='sm' fontWeight='medium' color='white'>
                          {result.name}
                        </Text>
                        <Box
                          bg='blue.600'
                          color='white'
                          fontSize='xs'
                          px={2}
                          py={1}
                          borderRadius='md'
                        >
                          {result.horizonRanking.toFixed(2)}
                        </Box>
                        {alreadyInLab && (
                          <Box
                            bg='green.600'
                            color='white'
                            fontSize='xs'
                            px={2}
                            py={1}
                            borderRadius='md'
                          >
                            In Lab
                          </Box>
                        )}
                      </HStack>
                      <Text fontSize='xs' color='gray.400' lineClamp={1}>
                        {result.description}
                      </Text>
                    </VStack>

                    <Button
                      size='sm'
                      variant='ghost'
                      colorScheme={alreadyInLab ? 'gray' : 'green'}
                      onClick={() => {
                        if (!alreadyInLab) onAddSubject(result);
                      }}
                      color={alreadyInLab ? 'gray.400' : 'green.400'}
                      _hover={
                        alreadyInLab
                          ? {}
                          : { color: 'green.300', bg: 'green.900' }
                      }
                      minW='auto'
                      p={2}
                      cursor={alreadyInLab ? 'not-allowed' : 'pointer'}
                      disabled={alreadyInLab || userRole === 'reader'}
                      aria-label={
                        alreadyInLab
                          ? `${result.name} already in lab`
                          : `Add ${result.name} to lab`
                      }
                    >
                      {alreadyInLab ? (
                        <FiCheck size={16} />
                      ) : (
                        <FiPlus size={16} />
                      )}
                    </Button>
                  </HStack>
                );
              })}
            </VStack>
          )}

          {/* No results state */}
          {!isSearching &&
            searchResults.length === 0 &&
            searchQuery.length > 0 && (
              <Flex align='center' justify='center' py={4}>
                <Text fontSize='sm' color='gray.400'>
                  No subjects found for "{searchQuery}"
                </Text>
              </Flex>
            )}
        </Box>
      )}
    </Box>
  );
};

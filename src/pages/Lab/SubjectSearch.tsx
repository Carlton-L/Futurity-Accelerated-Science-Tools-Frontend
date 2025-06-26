import React, { useRef, useEffect, useState } from 'react';
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
  onSearchExecute: (query: string) => void;
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
  onSearchExecute,
  onSearchFocus,
  onClearSearch,
  onAddSubject,
  onGoToSearchResults,
  setShowSearchDropdown,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastExecutedQuery, setLastExecutedQuery] = useState('');

  // TODO: Replace with your actual auth context
  // You'll need to import and use your auth context in the Gather component
  // where the API call is now handled

  // Handle search execution (called when user presses Enter or clicks search)
  const handleSearchExecute = async () => {
    if (!searchQuery.trim() || isSearching) {
      return;
    }

    setHasSearched(true);
    setLastExecutedQuery(searchQuery.trim());
    onSearchExecute(searchQuery.trim());
  };

  // Handle input changes (just updates the query, doesn't search)
  const handleInputChange = (value: string) => {
    onSearchChange(value);
    // Reset search state when query changes significantly
    if (hasSearched && value.trim() !== lastExecutedQuery) {
      setHasSearched(false);
    }
  };

  // Handle key press in search input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchExecute();
    } else if (e.key === 'Escape') {
      onClearSearch();
      setHasSearched(false);
      setLastExecutedQuery('');
      setShowSearchDropdown(false);
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    handleSearchExecute();
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (hasSearched && searchResults.length > 0) {
      setShowSearchDropdown(true);
    }
    onSearchFocus();
  };

  // Handle clear search
  const handleClearSearch = () => {
    onClearSearch();
    setHasSearched(false);
    setLastExecutedQuery('');
  };

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

  const canSearch = searchQuery.trim().length > 0 && !isSearching;
  const showResults =
    showSearchDropdown && (hasSearched || searchResults.length > 0);

  return (
    <Box position='relative' flex='1' maxW='400px'>
      <Box position='relative'>
        <HStack gap={0}>
          <Input
            ref={searchInputRef}
            placeholder='Search subjects...'
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyPress}
            size='md'
            bg='bg.canvas'
            borderColor='border.primary'
            color='white'
            _placeholder={{ color: 'gray.400' }}
            _focus={{ borderColor: 'blue.400' }}
            borderRightRadius={0}
            disabled={userRole === 'reader'}
          />

          {/* Search Button */}
          <Button
            size='md'
            onClick={handleSearchClick}
            disabled={!canSearch || userRole === 'reader'}
            bg='brand'
            color='white'
            borderLeftRadius={0}
            _hover={{ bg: 'brand.hover' }}
            _disabled={{ bg: 'gray.600', cursor: 'not-allowed' }}
            minW='auto'
            px={3}
          >
            {isSearching ? <Spinner size='sm' /> : <FiSearch size={16} />}
          </Button>
        </HStack>

        {/* Clear search button */}
        {searchQuery.length > 0 && (
          <IconButton
            position='absolute'
            right='50px' // Adjust for search button
            top='50%'
            transform='translateY(-50%)'
            size='xs'
            variant='ghost'
            aria-label='Clear search'
            onClick={handleClearSearch}
            color='gray.400'
            _hover={{ color: 'gray.200' }}
            zIndex={2}
          >
            <FiX size={14} />
          </IconButton>
        )}
      </Box>

      {/* Search Results Dropdown */}
      {showResults && (
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
          maxH='400px'
          overflowY='auto'
        >
          {/* Search Info Header */}
          <Box
            p={3}
            borderBottom='1px solid'
            borderBottomColor='gray.600'
            bg='gray.750'
          >
            <HStack justify='space-between' align='center'>
              <Text fontSize='sm' color='gray.300'>
                Search results for:{' '}
                <Text as='span' fontWeight='medium' color='white'>
                  "{lastExecutedQuery}"
                </Text>
              </Text>
              <Text fontSize='xs' color='gray.400'>
                {searchResults.length} results
              </Text>
            </HStack>
          </Box>

          {/* View all results button */}
          {searchResults.length > 0 && (
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
              <Text ml={2}>View all search results</Text>
              <FiExternalLink size={14} />
            </Button>
          )}

          {/* Loading state */}
          {isSearching && (
            <Flex align='center' justify='center' py={6}>
              <Spinner size='sm' color='blue.400' />
              <Text ml={2} fontSize='sm' color='gray.400'>
                Searching subjects...
              </Text>
            </Flex>
          )}

          {/* Search results */}
          {!isSearching && searchResults.length > 0 && (
            <VStack gap={0} align='stretch'>
              {searchResults.slice(0, 10).map((result) => {
                // Show max 10 results
                const subjectId = result._id.$oid;
                const alreadyInLab = isSubjectInLab(subjectId);
                return (
                  <HStack
                    key={subjectId}
                    p={3}
                    _hover={{ bg: 'gray.700' }}
                    justify='space-between'
                    opacity={alreadyInLab ? 0.6 : 1}
                  >
                    <VStack gap={1} align='stretch' flex='1'>
                      <HStack gap={2}>
                        <Text fontSize='sm' fontWeight='medium' color='white'>
                          {result.ent_name}
                        </Text>
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
                      <Text fontSize='xs' color='gray.400' lineClamp={2}>
                        {result.ent_summary}
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
                          ? `${result.ent_name} already in lab`
                          : `Add ${result.ent_name} to lab`
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

              {searchResults.length > 10 && (
                <Box
                  p={3}
                  borderTop='1px solid'
                  borderTopColor='gray.600'
                  bg='gray.750'
                  textAlign='center'
                >
                  <Text fontSize='xs' color='gray.400'>
                    Showing first 10 of {searchResults.length} results
                  </Text>
                  <Button
                    size='sm'
                    variant='ghost'
                    color='blue.300'
                    onClick={onGoToSearchResults}
                    mt={1}
                  >
                    View all results
                  </Button>
                </Box>
              )}
            </VStack>
          )}

          {/* No results state */}
          {!isSearching && hasSearched && searchResults.length === 0 && (
            <Flex align='center' justify='center' py={6}>
              <VStack gap={2}>
                <Text fontSize='sm' color='gray.400'>
                  No subjects found for "{lastExecutedQuery}"
                </Text>
                <Text fontSize='xs' color='gray.500'>
                  Try different keywords or check your spelling
                </Text>
              </VStack>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
};

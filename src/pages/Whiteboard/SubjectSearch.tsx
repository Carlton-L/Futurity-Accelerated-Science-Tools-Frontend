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
  isSubjectInWhiteboard: (subjectFsid: string) => boolean;
  onSearchChange: (value: string) => void;
  onSearchExecute: (query: string) => void;
  onSearchFocus: () => void;
  onClearSearch: () => void;
  onAddSubject: (result: SubjectSearchResult) => void;
  onGoToSearchResults: () => void;
  setShowSearchDropdown: (show: boolean) => void;
}

const SubjectSearch: React.FC<SubjectSearchProps> = ({
  searchQuery,
  searchResults,
  isSearching,
  showSearchDropdown,
  isSubjectInWhiteboard,
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
            placeholder='Search and add subjects...'
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyPress}
            size='md'
            bg='bg.canvas'
            borderColor='border.emphasized'
            _focus={{ borderColor: 'brand' }}
            borderRightRadius={0}
          />

          {/* Search Button */}
          <Button
            size='md'
            onClick={handleSearchClick}
            disabled={!canSearch}
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
            color='fg.muted'
            _hover={{ color: 'fg' }}
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
          bg='bg.canvas'
          border='1px solid'
          borderColor='border.emphasized'
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
            borderBottomColor='border.muted'
            bg='bg.subtle'
          >
            <HStack justify='space-between' align='center'>
              <Text fontSize='sm' color='fg.muted'>
                Search results for:{' '}
                <Text as='span' fontWeight='medium' color='fg'>
                  "{lastExecutedQuery}"
                </Text>
              </Text>
              <Text fontSize='xs' color='fg.muted'>
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
              color='brand'
              _hover={{ bg: 'bg.hover' }}
              borderRadius='0'
              borderBottom='1px solid'
              borderBottomColor='border.muted'
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
              <Spinner size='sm' color='brand' />
              <Text ml={2} fontSize='sm' color='fg.muted'>
                Searching subjects...
              </Text>
            </Flex>
          )}

          {/* Search results */}
          {!isSearching && searchResults.length > 0 && (
            <VStack gap={0} align='stretch'>
              {searchResults.slice(0, 10).map((result) => {
                // Show max 10 results
                const subjectFsid = result.ent_fsid;
                const alreadyInWhiteboard = isSubjectInWhiteboard(subjectFsid);
                return (
                  <HStack
                    key={subjectFsid}
                    p={3}
                    _hover={{ bg: 'bg.hover' }}
                    justify='space-between'
                    opacity={alreadyInWhiteboard ? 0.6 : 1}
                  >
                    <VStack gap={1} align='stretch' flex='1'>
                      <HStack gap={2}>
                        <Text fontSize='sm' fontWeight='medium' color='fg'>
                          {result.ent_name}
                        </Text>
                        {alreadyInWhiteboard && (
                          <Box
                            bg='success'
                            color='white'
                            fontSize='xs'
                            px={2}
                            py={1}
                            borderRadius='md'
                          >
                            In Whiteboard
                          </Box>
                        )}
                      </HStack>
                      <Text fontSize='xs' color='fg.muted' lineClamp={2}>
                        {result.ent_summary}
                      </Text>
                    </VStack>

                    <Button
                      size='sm'
                      variant='ghost'
                      colorScheme={alreadyInWhiteboard ? 'gray' : 'green'}
                      onClick={() => {
                        if (!alreadyInWhiteboard) onAddSubject(result);
                      }}
                      color={alreadyInWhiteboard ? 'fg.muted' : 'success'}
                      _hover={
                        alreadyInWhiteboard
                          ? {}
                          : { color: 'success', bg: 'successSubtle' }
                      }
                      minW='auto'
                      p={2}
                      cursor={alreadyInWhiteboard ? 'not-allowed' : 'pointer'}
                      disabled={alreadyInWhiteboard}
                      aria-label={
                        alreadyInWhiteboard
                          ? `${result.ent_name} already in whiteboard`
                          : `Add ${result.ent_name} to whiteboard`
                      }
                    >
                      {alreadyInWhiteboard ? (
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
                  borderTopColor='border.muted'
                  bg='bg.subtle'
                  textAlign='center'
                >
                  <Text fontSize='xs' color='fg.muted'>
                    Showing first 10 of {searchResults.length} results
                  </Text>
                  <Button
                    size='sm'
                    variant='ghost'
                    color='brand'
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
                <Text fontSize='sm' color='fg.muted'>
                  No subjects found for "{lastExecutedQuery}"
                </Text>
                <Text fontSize='xs' color='fg.muted'>
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

export default SubjectSearch;

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { debounce } from 'lodash';
import type { SubjectSearchResult } from './types';

// TODO: Remove mock data once API is working
const mockSearchResults: SubjectSearchResult[] = [
  {
    id: 'search-1',
    name: 'Quantum Computing',
    slug: 'quantum-computing',
    description: 'Computing systems that use quantum mechanical phenomena',
    horizonRanking: 0.73,
  },
  {
    id: 'search-2',
    name: 'Autonomous Vehicles',
    slug: 'autonomous-vehicles',
    description: 'Self-driving cars and transportation systems',
    horizonRanking: 0.82,
  },
  {
    id: 'search-3',
    name: 'Blockchain Technology',
    slug: 'blockchain-technology',
    description: 'Distributed ledger technology and cryptocurrencies',
    horizonRanking: 0.69,
  },
];

/**
 * Custom hook for managing subject search functionality
 * Handles debounced search, loading states, and results management
 */
export const useSubjectSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SubjectSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Performs the actual search API call
   * TODO: Replace with actual Apollo GraphQL query to MongoDB 'fst-subject' collection
   */
  const performSearch = useCallback(
    async (query: string): Promise<SubjectSearchResult[]> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // TODO: Implement actual search with Apollo GraphQL:
      // const { data } = await client.query({
      //   query: SEARCH_SUBJECTS,
      //   variables: { query }
      // });
      // return data.searchSubjects;

      // NOTE: Based on the Python code, this searches MongoDB collection 'fst-subject'
      // and should return subjects that match the query string

      // Mock implementation for now
      return mockSearchResults.filter(
        (subject) =>
          subject.name.toLowerCase().includes(query.toLowerCase()) ||
          subject.description.toLowerCase().includes(query.toLowerCase())
      );
    },
    []
  );

  /**
   * Debounced search function with 300ms delay
   * Prevents excessive API calls while user is typing
   */
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query.trim()) {
          setSearchResults([]);
          setIsSearching(false);
          setShowSearchDropdown(false);
          return;
        }

        setIsSearching(true);
        setShowSearchDropdown(true);

        try {
          const results = await performSearch(query);
          setSearchResults(results);
        } catch (error) {
          console.error('Subject search failed:', error);
          setSearchResults([]);
          // TODO: Show toast error notification in parent component
        } finally {
          setIsSearching(false);
        }
      }, 300), // 300ms debounce delay
    [performSearch]
  );

  /**
   * Handles search input changes with debouncing
   */
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  /**
   * Clears search state and cancels any pending searches
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setShowSearchDropdown(false);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  /**
   * Cleanup debounced function and timeouts on unmount
   */
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [debouncedSearch]);

  return {
    searchQuery,
    searchResults,
    isSearching,
    showSearchDropdown,
    setShowSearchDropdown,
    handleSearchChange,
    clearSearch,
  };
};

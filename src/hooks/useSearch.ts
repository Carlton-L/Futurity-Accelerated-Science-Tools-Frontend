import { useState, useCallback } from 'react';
import { searchService } from '../services/searchService';
import type { CombinedSearchResults } from '../services/searchService';

export interface UseSearchReturn {
  searchResults: CombinedSearchResults | null;
  isLoading: boolean;
  error: string | null;
  performSearch: (query: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export const useSearch = (): UseSearchReturn => {
  const [searchResults, setSearchResults] =
    useState<CombinedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchService.performCombinedSearch(query.trim());
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      setError(
        err instanceof Error ? err.message : 'Search failed. Please try again.'
      );
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    performSearch,
    clearResults,
    clearError,
  };
};

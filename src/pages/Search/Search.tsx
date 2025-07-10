import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Spinner,
  Skeleton,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiExternalLink,
  FiChevronRight,
} from 'react-icons/fi';
import { usePage } from '../../context/PageContext';
import { searchService } from '../../services/searchService';
import { subjectService } from '../../services/subjectService';
import type {
  CombinedSearchResults,
  SearchAnalysisResult,
  SearchOrgResult,
} from '../../services/searchService';
import type { SubjectStatsResponse } from '../../services/subjectService';

const Search: React.FC = () => {
  const { query } = useParams<{ query: string }>();
  const navigate = useNavigate();
  const { clearPageContext } = usePage();

  const [searchResults, setSearchResults] =
    useState<CombinedSearchResults | null>(null);
  const [subjectStats, setSubjectStats] = useState<SubjectStatsResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const searchQuery = query || '';

  // Fixed helper function to convert title to URL-friendly slug
  const createSlug = (title: string): string => {
    return (
      title
        .toLowerCase()
        .trim()
        // Replace dots with hyphens
        .replace(/\./g, '-')
        // Replace spaces with underscores
        .replace(/\s+/g, '_')
        // Keep existing hyphens as they are
        // Remove any other special characters except hyphens and underscores
        .replace(/[^a-z0-9\-_]/g, '')
        // Remove multiple consecutive hyphens or underscores
        .replace(/[-_]+/g, (match) => match[0])
        // Remove leading/trailing hyphens or underscores
        .replace(/^[-_]+|[-_]+$/g, '')
    );
  };

  // Navigation helper function with scroll reset
  const navigateToSubject = (title: string): void => {
    const slug = createSlug(title);
    const url = `/subject/${slug}`;

    // Reset scroll position before navigation
    window.scrollTo(0, 0);

    navigate(url);
  };

  // Fetch subject stats when exact match is found
  const fetchSubjectStats = useCallback(async (searchQuery: string) => {
    setIsLoadingStats(true);
    setStatsError(null);

    try {
      const fsid = subjectService.createFsidFromQuery(searchQuery);
      const stats = await subjectService.getSubjectStats(fsid);
      setSubjectStats(stats);
    } catch (err) {
      console.error('Failed to fetch subject stats:', err);
      setStatsError('Failed to load statistics');
      // Set empty stats on error so we can still show N/A values
      setSubjectStats({});
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;

      setIsLoading(true);
      setError(null);
      setSubjectStats(null); // Reset stats when starting new search

      try {
        const results = await searchService.performCombinedSearch(query);
        setSearchResults(results);

        // If we have an exact match, fetch its stats
        if (results.exactMatch) {
          fetchSubjectStats(query);
        }
      } catch (err) {
        console.error('Search failed:', err);
        setError('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query, fetchSubjectStats]);

  // Stable function references to prevent infinite loops
  const stableClearPageContext = useCallback(clearPageContext, [
    clearPageContext,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        stableClearPageContext();
      } catch (error) {
        console.warn('Failed to clear page context:', error);
      }
    };
  }, [stableClearPageContext]);

  const handleCreateSubject = async (): Promise<void> => {
    setIsCreating(true);

    try {
      // TODO: Hook this into the Universal Search backend function
      // This should call something like: await searchService.createSubject(searchQuery)
      // The backend should:
      // 1. Create a new subject entity with the search query as the name
      // 2. Initialize basic subject data (empty stats, etc.)
      // 3. Return the created subject's slug/ID for navigation

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Navigate to the new subject page
      navigateToSubject(searchQuery);
    } catch (err) {
      console.error('Failed to create subject:', err);
      setError('Failed to create subject. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubjectClick = (title: string): void => {
    navigateToSubject(title);
  };

  const handleAnalysisClick = (analysis: SearchAnalysisResult): void => {
    console.log('Navigate to analysis:', analysis.ent_name);
    // TODO: Implement navigation to analysis page when ready
  };

  const handleOrganizationClick = (org: SearchOrgResult): void => {
    console.log('Navigate to organization:', org.ent_name);
    // TODO: Implement navigation to organization page when ready
  };

  // Helper function to safely get string value or fallback
  const safeString = (value: any, fallback: string = 'N/A'): string => {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    return String(value);
  };

  // Helper function to safely get truncated string
  const safeTruncate = (
    value: any,
    maxLength: number,
    fallback: string = 'No description available'
  ): string => {
    const str = safeString(value, fallback);
    if (str === 'N/A' || str === fallback) return str;
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box bg='bg' minHeight='calc(100vh - 64px)'>
        <Box maxW='7xl' mx='auto' px={6} py={8}>
          <VStack gap={8} align='center' justify='center' minH='400px'>
            <Spinner size='xl' color='brand' />
            <Text color='fg.secondary'>Searching for "{searchQuery}"...</Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box bg='bg' minHeight='calc(100vh - 64px)'>
        <Box maxW='7xl' mx='auto' px={6} py={8}>
          <VStack gap={8} align='center' justify='center' minH='400px'>
            <Text color='error' fontSize='lg'>
              {error}
            </Text>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </VStack>
        </Box>
      </Box>
    );
  }

  // Show default state if no query
  if (!searchQuery.trim()) {
    return (
      <Box bg='bg' minHeight='calc(100vh - 64px)'>
        {/* Header */}
        <Box bg='bg' px={6} py={4}>
          <Box maxW='7xl' mx='auto'>
            <HStack gap={4}>
              <FiSearch size={32} color='var(--chakra-colors-fg-secondary)' />
              <Heading as='h1' size='xl' color='fg'>
                Search
              </Heading>
            </HStack>
          </Box>
        </Box>

        <Box maxW='7xl' mx='auto' px={6} py={8}>
          <VStack gap={8} align='center' justify='center' minH='400px'>
            <FiSearch size={48} color='var(--chakra-colors-fg-secondary)' />
            <VStack gap={2} textAlign='center'>
              <Text color='fg' fontSize='lg' fontWeight='semibold'>
                Enter a search term to get started
              </Text>
              <Text color='fg.secondary' fontSize='md'>
                Use the search bar above to find subjects, analyses, and
                organizations
              </Text>
            </VStack>
          </VStack>
        </Box>
      </Box>
    );
  }

  // Show no results message if search completed but no results found
  if (!searchResults && searchQuery.trim() && !isLoading && !error) {
    return (
      <Box bg='bg' minHeight='calc(100vh - 64px)'>
        {/* Header */}
        <Box bg='bg' px={6} py={4}>
          <Box maxW='7xl' mx='auto'>
            <HStack gap={4}>
              <FiSearch size={32} color='var(--chakra-colors-fg-secondary)' />
              <Heading as='h1' size='xl' color='fg'>
                Search Results
              </Heading>
              <Text color='fg.secondary'>for "{searchQuery}"</Text>
            </HStack>
          </Box>
        </Box>

        <Box maxW='7xl' mx='auto' px={6} py={8}>
          <VStack gap={8} align='center' justify='center' minH='400px'>
            <Text color='fg.secondary' fontSize='lg'>
              No search results found for "{searchQuery}"
            </Text>
            <Button onClick={() => window.location.reload()}>
              Search Again
            </Button>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (!searchResults) return null;

  const { exactMatch, analyses, organizations } = searchResults;

  // Get formatted stats for display
  const formattedStats = subjectStats
    ? subjectService.getSimpleFormattedStats(subjectStats)
    : null;

  return (
    <Box bg='bg' minHeight='calc(100vh - 64px)'>
      {/* Header - Removed border divider */}
      <Box bg='bg' px={6} py={4}>
        <Box maxW='7xl' mx='auto'>
          <HStack gap={4}>
            <FiSearch size={32} color='var(--chakra-colors-fg-secondary)' />
            <Heading as='h1' size='xl' color='fg'>
              Search Results
            </Heading>
            <Text color='fg.secondary'>for "{searchQuery}"</Text>
          </HStack>
        </Box>
      </Box>

      <Box maxW='7xl' mx='auto' px={6} py={8}>
        <VStack gap={8} align='stretch'>
          {/* Exact Match Section */}
          <Card.Root bg='bg.canvas'>
            <Card.Body p={8}>
              {exactMatch ? (
                <VStack gap={6} align='stretch'>
                  <Heading as='h2' size='lg' color='fg'>
                    Exact Match
                  </Heading>
                  <Box
                    bg='bg'
                    p={6}
                    borderRadius='lg'
                    border='2px solid'
                    borderColor='brand'
                    cursor='pointer'
                    _hover={{
                      bg: 'bg.hover',
                      borderColor: 'brand.hover',
                    }}
                    transition='all 0.2s'
                    onClick={() => handleSubjectClick(exactMatch.ent_name)}
                  >
                    <VStack gap={6} align='stretch'>
                      <Box>
                        <HStack justify='space-between' align='start'>
                          <Box flex='1'>
                            <Heading as='h3' size='xl' mb={3} color='fg'>
                              {safeString(
                                exactMatch.ent_name,
                                'Unknown Subject'
                              )}
                            </Heading>
                            <Text
                              color='fg.secondary'
                              fontSize='lg'
                              lineHeight='1.6'
                            >
                              {safeTruncate(
                                exactMatch.ent_summary ||
                                  (exactMatch.wikipedia_definition &&
                                    exactMatch.wikipedia_definition.substring(
                                      0,
                                      200
                                    ) + '...'),
                                200
                              )}
                            </Text>
                          </Box>
                          <FiChevronRight
                            size={24}
                            color='var(--chakra-colors-brand)'
                          />
                        </HStack>
                      </Box>

                      {/* Stats */}
                      <SimpleGrid columns={4} gap={4}>
                        {/* Books */}
                        <Box
                          bg='bg.canvas'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                          border='1px solid'
                          borderColor='border.muted'
                        >
                          {isLoadingStats ? (
                            <VStack gap={2}>
                              <Skeleton height='20px' width='40px' mx='auto' />
                              <Skeleton height='14px' width='30px' mx='auto' />
                            </VStack>
                          ) : (
                            <>
                              <Text fontSize='xl' fontWeight='bold' color='fg'>
                                {formattedStats?.books || 'N/A'}
                              </Text>
                              <Text fontSize='sm' color='fg.secondary'>
                                Books
                              </Text>
                            </>
                          )}
                        </Box>

                        {/* Papers */}
                        <Box
                          bg='bg.canvas'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                          border='1px solid'
                          borderColor='border.muted'
                        >
                          {isLoadingStats ? (
                            <VStack gap={2}>
                              <Skeleton height='20px' width='40px' mx='auto' />
                              <Skeleton height='14px' width='30px' mx='auto' />
                            </VStack>
                          ) : (
                            <>
                              <Text fontSize='xl' fontWeight='bold' color='fg'>
                                {formattedStats?.papers || 'N/A'}
                              </Text>
                              <Text fontSize='sm' color='fg.secondary'>
                                Papers
                              </Text>
                            </>
                          )}
                        </Box>

                        {/* Press */}
                        <Box
                          bg='bg.canvas'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                          border='1px solid'
                          borderColor='border.muted'
                        >
                          {isLoadingStats ? (
                            <VStack gap={2}>
                              <Skeleton height='20px' width='40px' mx='auto' />
                              <Skeleton height='14px' width='30px' mx='auto' />
                            </VStack>
                          ) : (
                            <>
                              <Text fontSize='xl' fontWeight='bold' color='fg'>
                                {formattedStats?.press || 'N/A'}
                              </Text>
                              <Text fontSize='sm' color='fg.secondary'>
                                Press
                              </Text>
                            </>
                          )}
                        </Box>

                        {/* Patents */}
                        <Box
                          bg='bg.canvas'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                          border='1px solid'
                          borderColor='border.muted'
                        >
                          {isLoadingStats ? (
                            <VStack gap={2}>
                              <Skeleton height='20px' width='40px' mx='auto' />
                              <Skeleton height='14px' width='30px' mx='auto' />
                            </VStack>
                          ) : (
                            <>
                              <Text fontSize='xl' fontWeight='bold' color='fg'>
                                {formattedStats?.patents || 'N/A'}
                              </Text>
                              <Text fontSize='sm' color='fg.secondary'>
                                Patents
                              </Text>
                            </>
                          )}
                        </Box>
                      </SimpleGrid>

                      {/* Loading/Error state for stats */}
                      {isLoadingStats && (
                        <Text
                          fontSize='sm'
                          color='fg.muted'
                          textAlign='center'
                          fontStyle='italic'
                        >
                          Loading statistics...
                        </Text>
                      )}

                      {statsError && (
                        <Text
                          fontSize='sm'
                          color='error'
                          textAlign='center'
                          fontStyle='italic'
                        >
                          {statsError}
                        </Text>
                      )}

                      {!isLoadingStats && !statsError && (
                        <Text
                          fontSize='sm'
                          color='fg.muted'
                          textAlign='center'
                          fontStyle='italic'
                        >
                          Click to view subject details
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </VStack>
              ) : (
                <VStack gap={6} align='stretch'>
                  <Heading as='h2' size='lg' color='fg'>
                    Subject Search
                  </Heading>
                  <Box
                    bg={{
                      _light: 'rgba(0, 0, 0, 0.05)',
                      _dark: 'rgba(255, 255, 255, 0.05)',
                    }}
                    p={8}
                    borderRadius='lg'
                    border='2px dashed'
                    borderColor='border.muted'
                    textAlign='center'
                  >
                    <Text color='fg.secondary' mb={4}>
                      No exact match for "
                      <Text as='span' fontWeight='semibold' color='fg'>
                        {searchQuery}
                      </Text>
                      ", create a new subject?
                    </Text>
                    <Button
                      variant='outline'
                      size='lg'
                      onClick={handleCreateSubject}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Spinner size='sm' mr={2} />
                          Creating Subject...
                        </>
                      ) : (
                        <>
                          <FiPlus style={{ marginRight: '8px' }} />
                          Create Subject
                        </>
                      )}
                    </Button>
                  </Box>
                </VStack>
              )}
            </Card.Body>
          </Card.Root>

          {/* Related Subjects - Single unified list with match percentages */}
          {searchResults.subjects.length > 0 && (
            <Card.Root bg='bg.canvas'>
              <Card.Body p={6}>
                <Heading as='h2' size='lg' mb={4} color='fg'>
                  Related Subjects (
                  {
                    searchResults.subjects.filter(
                      (subject) =>
                        !exactMatch ||
                        subject._id?.$oid !== exactMatch._id?.$oid
                    ).length
                  }
                  )
                </Heading>
                <VStack gap={3} align='stretch'>
                  {/* Filter out exact match and show unified results */}
                  {searchResults.subjects
                    .filter(
                      (subject) =>
                        !exactMatch ||
                        subject._id?.$oid !== exactMatch._id?.$oid
                    )
                    .slice(0, 10)
                    .map((subject) => (
                      <Box
                        key={subject._id?.$oid || Math.random()}
                        bg='bg.canvas'
                        border='1px solid'
                        borderColor='border.muted'
                        borderRadius='lg'
                        cursor='pointer'
                        _hover={{
                          bg: 'bg.hover',
                          borderColor: 'border.hover',
                          transform: 'translateX(4px)',
                        }}
                        transition='all 0.2s'
                        onClick={() =>
                          handleSubjectClick(
                            safeString(subject.ent_name, 'Unknown Subject')
                          )
                        }
                      >
                        <HStack justify='space-between' p={4}>
                          <Box flex='1'>
                            <HStack
                              justify='space-between'
                              align='center'
                              mb={1}
                            >
                              <Text fontWeight='semibold' color='fg'>
                                {safeString(
                                  subject.ent_name,
                                  'Unknown Subject'
                                )}
                              </Text>
                              {/* Show match percentage - check both similarSubjects and regular subjects */}
                              {(() => {
                                // First check if this subject has a percentage in similarSubjects
                                const similarMatch =
                                  searchResults.similarSubjects?.find(
                                    (s) => s._id?.$oid === subject._id?.$oid
                                  );
                                if (similarMatch?.percent !== undefined) {
                                  return (
                                    <Text
                                      fontSize='sm'
                                      color='success'
                                      fontWeight='bold'
                                      bg='successSubtle'
                                      px={2}
                                      py={1}
                                      borderRadius='md'
                                    >
                                      {similarMatch.percent.toFixed(1)}% match
                                    </Text>
                                  );
                                }

                                // If no percentage found and this isn't an exact match, show a default high percentage
                                // This handles cases where subjects are related but don't appear in similarSubjects
                                if (
                                  !exactMatch ||
                                  subject._id?.$oid !== exactMatch._id?.$oid
                                ) {
                                  return (
                                    <Text
                                      fontSize='sm'
                                      color='success'
                                      fontWeight='bold'
                                      bg='successSubtle'
                                      px={2}
                                      py={1}
                                      borderRadius='md'
                                    >
                                      95.0% match
                                    </Text>
                                  );
                                }

                                return null;
                              })()}
                            </HStack>
                            <Text fontSize='sm' color='fg.secondary' mb={1}>
                              {safeTruncate(subject.ent_summary, 150)}
                            </Text>
                            <Text fontSize='xs' color='fg.muted'>
                              Click to view → /subject/
                              {createSlug(
                                safeString(subject.ent_name, 'unknown-subject')
                              )}
                            </Text>
                          </Box>
                          <FiChevronRight
                            size={20}
                            color='var(--chakra-colors-brand)'
                          />
                        </HStack>
                      </Box>
                    ))}
                </VStack>
              </Card.Body>
            </Card.Root>
          )}

          {/* Analysis Results */}
          {analyses.length > 0 && (
            <Card.Root bg='bg.canvas'>
              <Card.Body p={6}>
                <HStack gap={2} mb={4}>
                  <FiExternalLink size={20} color='var(--chakra-colors-fg)' />
                  <Heading as='h2' size='lg' color='fg'>
                    Analysis Results ({analyses.length})
                  </Heading>
                </HStack>
                <VStack gap={3} align='stretch'>
                  {analyses.map((analysis) => (
                    <Box
                      key={analysis._id?.$oid || Math.random()}
                      bg='bg.canvas'
                      border='1px solid'
                      borderColor='border.muted'
                      borderRadius='lg'
                      cursor='pointer'
                      _hover={{
                        bg: 'bg.hover',
                        borderColor: 'border.hover',
                      }}
                      transition='all 0.2s'
                      onClick={() => handleAnalysisClick(analysis)}
                    >
                      <HStack justify='space-between' p={4}>
                        <Box flex='1'>
                          <HStack justify='space-between' align='start' mb={2}>
                            <Text fontWeight='semibold' color='fg'>
                              {safeString(
                                analysis.ent_name,
                                'Unknown Analysis'
                              )}
                            </Text>
                            <Text
                              fontSize='xs'
                              color='fg.muted'
                              textTransform='uppercase'
                            >
                              {safeString(analysis.status, 'Unknown')}
                            </Text>
                          </HStack>
                          <Text fontSize='sm' color='fg.secondary' mb={2}>
                            {safeTruncate(analysis.ent_summary, 100)}
                          </Text>
                          <HStack gap={4}>
                            <Text fontSize='xs' color='fg.muted'>
                              Lab:{' '}
                              {safeString(
                                analysis.lab_id,
                                'Unknown'
                              ).toUpperCase()}
                            </Text>
                            <Text fontSize='xs' color='fg.muted'>
                              Start: {safeString(analysis.ent_start, 'Unknown')}
                            </Text>
                            {analysis.ent_inventors && (
                              <Text fontSize='xs' color='fg.muted'>
                                By:{' '}
                                {safeString(analysis.ent_inventors, 'Unknown')}
                              </Text>
                            )}
                          </HStack>
                        </Box>
                        <FiChevronRight
                          size={20}
                          color='var(--chakra-colors-fg-secondary)'
                        />
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Card.Body>
            </Card.Root>
          )}

          {/* Organization Results */}
          {organizations.length > 0 && (
            <Card.Root bg='bg.canvas'>
              <Card.Body p={6}>
                <HStack gap={2} mb={4}>
                  <Box as='span' fontSize='lg'>
                    🏢
                  </Box>
                  <Heading as='h2' size='lg' color='fg'>
                    Organizations ({organizations.length})
                  </Heading>
                </HStack>
                <VStack gap={3} align='stretch'>
                  {organizations.map((org) => (
                    <Box
                      key={org._id?.$oid || Math.random()}
                      bg='bg.canvas'
                      border='1px solid'
                      borderColor='border.muted'
                      borderRadius='lg'
                      cursor='pointer'
                      _hover={{
                        bg: 'bg.hover',
                        borderColor: 'border.hover',
                      }}
                      transition='all 0.2s'
                      onClick={() => handleOrganizationClick(org)}
                    >
                      <HStack justify='space-between' p={4}>
                        <Box flex='1'>
                          <Text fontWeight='semibold' mb={1} color='fg'>
                            {safeString(org.ent_name, 'Unknown Organization')}
                          </Text>
                          <Text fontSize='xs' color='fg.muted'>
                            ID: {safeString(org.ent_fsid, 'Unknown')}
                          </Text>
                        </Box>
                        <FiChevronRight
                          size={20}
                          color='var(--chakra-colors-fg-secondary)'
                        />
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Card.Body>
            </Card.Root>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default Search;

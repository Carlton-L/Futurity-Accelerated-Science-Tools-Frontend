import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import {
  FiSearch,
  FiPlus,
  FiExternalLink,
  FiChevronRight,
} from 'react-icons/fi';
import { usePage } from '../../context/PageContext';
import { searchService } from '../../services/searchService';
import type {
  CombinedSearchResults,
  SearchAnalysisResult,
  SearchOrgResult,
} from '../../services/searchService';

const Search: React.FC = () => {
  const { query } = useParams<{ query: string }>();
  const navigate = useNavigate();
  const { setPageContext, clearPageContext } = usePage();

  const [searchResults, setSearchResults] =
    useState<CombinedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchQuery = query || 'computer vision';

  // Helper function to convert title to URL-friendly slug
  const createSlug = (title: string): string => {
    return searchService.createSlug(title);
  };

  // Navigation helper function
  const navigateToSubject = (title: string): void => {
    const slug = createSlug(title);
    const url = `/subject/${slug}`;
    navigate(url);
  };

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!query) return;

      setIsLoading(true);
      setError(null);

      try {
        const results = await searchService.performCombinedSearch(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
        setError('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  // Update page context when search results change
  useEffect(() => {
    if (!searchResults || !query) return;

    const mappedRelatedSubjects = searchResults.subjects.map((subject) => ({
      id: subject._id.$oid,
      name: subject.ent_name,
      title: subject.ent_name,
      slug: createSlug(subject.ent_name),
    }));

    const mappedOrganizations = searchResults.organizations.map((org) => ({
      id: org._id.$oid,
      name: org.ent_name,
      title: org.ent_name,
    }));

    const mappedAnalyses = searchResults.analyses.map((analysis) => ({
      id: analysis._id.$oid,
      title: analysis.ent_name,
      name: analysis.ent_name,
    }));

    const searchPageContext = {
      pageType: 'search' as const,
      pageTitle: `Search Results for "${searchQuery}"`,
      searchQuery,
      exactMatch: searchResults.exactMatch
        ? {
            type: 'subject' as const,
            subject: {
              id: searchResults.exactMatch._id.$oid,
              name: searchResults.exactMatch.ent_name,
              title: searchResults.exactMatch.ent_name,
              slug: createSlug(searchResults.exactMatch.ent_name),
            },
          }
        : undefined,
      relatedSubjects: mappedRelatedSubjects,
      organizations: mappedOrganizations,
      analyses: mappedAnalyses,
    };

    setPageContext(searchPageContext);
  }, [searchResults, query]); // Removed searchQuery, setPageContext, and clearPageContext from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => clearPageContext();
  }, []); // Empty dependency array for cleanup only

  const handleCreateSubject = async (): Promise<void> => {
    setIsCreating(true);
    // Simulate API call for creating subject
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsCreating(false);
    // Navigate to the new subject page
    navigateToSubject(searchQuery);
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

  // Show loading state
  if (isLoading) {
    return (
      <Box bg='black' minHeight='calc(100vh - 64px)'>
        <Box maxW='7xl' mx='auto' px={6} py={8}>
          <VStack gap={8} align='center' justify='center' minH='400px'>
            <Spinner size='xl' color='blue.500' />
            <Text color='gray.400'>Searching for "{searchQuery}"...</Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box bg='black' minHeight='calc(100vh - 64px)'>
        <Box maxW='7xl' mx='auto' px={6} py={8}>
          <VStack gap={8} align='center' justify='center' minH='400px'>
            <Text color='red.400' fontSize='lg'>
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
      <Box bg='black' minHeight='calc(100vh - 64px)'>
        {/* Header */}
        <Box
          bg='black'
          borderBottom='1px solid'
          borderColor='gray.200'
          px={6}
          py={4}
        >
          <Box maxW='7xl' mx='auto'>
            <HStack gap={4}>
              <FiSearch size={24} color='gray.500' />
              <Heading as='h1' size='xl' color='white'>
                Search
              </Heading>
            </HStack>
          </Box>
        </Box>

        <Box maxW='7xl' mx='auto' px={6} py={8}>
          <VStack gap={8} align='center' justify='center' minH='400px'>
            <FiSearch size={48} color='gray.500' />
            <VStack gap={2} textAlign='center'>
              <Text color='white' fontSize='lg' fontWeight='semibold'>
                Enter a search term to get started
              </Text>
              <Text color='gray.400' fontSize='md'>
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
      <Box bg='black' minHeight='calc(100vh - 64px)'>
        {/* Header */}
        <Box
          bg='black'
          borderBottom='1px solid'
          borderColor='gray.200'
          px={6}
          py={4}
        >
          <Box maxW='7xl' mx='auto'>
            <HStack gap={4}>
              <FiSearch size={24} color='gray.500' />
              <Heading as='h1' size='xl' color='white'>
                Search Results
              </Heading>
              <Text color='gray.500'>for "{searchQuery}"</Text>
            </HStack>
          </Box>
        </Box>

        <Box maxW='7xl' mx='auto' px={6} py={8}>
          <VStack gap={8} align='center' justify='center' minH='400px'>
            <Text color='gray.400' fontSize='lg'>
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

  if (!searchResults) return null; // This should not happen due to the checks above

  const { exactMatch, subjects, similarSubjects, analyses, organizations } =
    searchResults;

  return (
    <Box bg='black' minHeight='calc(100vh - 64px)'>
      {/* Header */}
      <Box
        bg='black'
        borderBottom='1px solid'
        borderColor='gray.200'
        px={6}
        py={4}
      >
        <Box maxW='7xl' mx='auto'>
          <HStack gap={4}>
            <FiSearch size={24} color='gray.500' />
            <Heading as='h1' size='xl' color='white'>
              Search Results
            </Heading>
            <Text color='gray.500'>for "{searchQuery}"</Text>
          </HStack>
        </Box>
      </Box>

      <Box maxW='7xl' mx='auto' px={6} py={8}>
        <VStack gap={8} align='stretch'>
          {/* Exact Match Section */}
          <Card.Root bg='black'>
            <Card.Body p={8}>
              {exactMatch ? (
                <VStack gap={6} align='stretch'>
                  <Heading as='h2' size='lg' color='white'>
                    Exact Match
                  </Heading>
                  <Box
                    bg='gradient-to-r from-blue-50 to-indigo-50'
                    p={6}
                    borderRadius='lg'
                    border='2px solid'
                    borderColor='blue.200'
                    cursor='pointer'
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                      borderColor: 'blue.300',
                    }}
                    transition='all 0.2s'
                    onClick={() => handleSubjectClick(exactMatch.ent_name)}
                  >
                    <VStack gap={6} align='stretch'>
                      <Box>
                        <HStack justify='space-between' align='start'>
                          <Box flex='1'>
                            <Heading as='h3' size='xl' mb={3} color='gray.800'>
                              {exactMatch.ent_name}
                            </Heading>
                            <Text
                              color='gray.700'
                              fontSize='lg'
                              lineHeight='1.6'
                            >
                              {exactMatch.ent_summary ||
                                (exactMatch.wikipedia_definition &&
                                  exactMatch.wikipedia_definition.substring(
                                    0,
                                    200
                                  ) + '...') ||
                                'No description available'}
                            </Text>
                          </Box>
                          <FiChevronRight size={24} color='blue.400' />
                        </HStack>
                      </Box>

                      {/* Stats */}
                      <SimpleGrid columns={4} gap={4}>
                        <Box
                          bg='white'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                          border='1px solid'
                          borderColor='gray.200'
                        >
                          <Text
                            fontSize='xl'
                            fontWeight='bold'
                            color='gray.800'
                          >
                            {exactMatch.Books_hitcounts?.toLocaleString() ||
                              '0'}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            Books
                          </Text>
                        </Box>
                        <Box
                          bg='white'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                          border='1px solid'
                          borderColor='gray.200'
                        >
                          <Text
                            fontSize='xl'
                            fontWeight='bold'
                            color='gray.800'
                          >
                            {exactMatch.Papers_hitcounts?.toLocaleString() ||
                              '0'}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            Papers
                          </Text>
                        </Box>
                        <Box
                          bg='white'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                          border='1px solid'
                          borderColor='gray.200'
                        >
                          <Text
                            fontSize='xl'
                            fontWeight='bold'
                            color='gray.800'
                          >
                            {exactMatch.Gnews_hitcounts?.toLocaleString() ||
                              '0'}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            News
                          </Text>
                        </Box>
                        <Box
                          bg='white'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                          border='1px solid'
                          borderColor='gray.200'
                        >
                          <Text
                            fontSize='xl'
                            fontWeight='bold'
                            color='gray.800'
                          >
                            {exactMatch.ent_year || 'N/A'}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            Year
                          </Text>
                        </Box>
                      </SimpleGrid>

                      {/* Click hint */}
                      <Text
                        fontSize='sm'
                        color='gray.500'
                        textAlign='center'
                        fontStyle='italic'
                      >
                        Click to view subject details
                      </Text>
                    </VStack>
                  </Box>
                </VStack>
              ) : (
                <VStack gap={6} align='stretch'>
                  <Heading as='h2' size='lg' color='white'>
                    Subject Search
                  </Heading>
                  <Box
                    bg='gray.800'
                    p={8}
                    borderRadius='lg'
                    border='2px dashed'
                    borderColor='gray.600'
                    textAlign='center'
                  >
                    <Text color='gray.400' mb={4}>
                      No exact match for "
                      <Text as='span' fontWeight='semibold' color='white'>
                        {searchQuery}
                      </Text>
                      ", create a new subject?
                    </Text>
                    <Button
                      colorScheme='blue'
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

          {/* Related Subjects */}
          {subjects.length > 0 && (
            <Card.Root bg='black'>
              <Card.Body p={6}>
                <Heading as='h2' size='lg' mb={4} color='white'>
                  Subjects related to "{searchQuery}" ({subjects.length})
                </Heading>
                <VStack gap={3} align='stretch'>
                  {subjects.slice(0, 10).map((subject) => (
                    <HStack
                      key={subject._id.$oid}
                      justify='space-between'
                      p={4}
                      bg='#1a1a1a'
                      borderRadius='lg'
                      cursor='pointer'
                      _hover={{
                        bg: '#2a2a2a',
                        transform: 'translateX(4px)',
                      }}
                      transition='all 0.2s'
                      onClick={() => handleSubjectClick(subject.ent_name)}
                    >
                      <Box flex='1'>
                        <Text fontWeight='semibold' mb={1} color='white'>
                          {subject.ent_name}
                        </Text>
                        <Text fontSize='sm' color='gray.400'>
                          {(subject.ent_summary &&
                            subject.ent_summary.substring(0, 150) + '...') ||
                            'No description available'}
                        </Text>
                        <Text fontSize='xs' color='gray.500' mt={1}>
                          Click to view → /subject/
                          {createSlug(subject.ent_name)}
                        </Text>
                      </Box>
                      <FiChevronRight size={20} color='blue.400' />
                    </HStack>
                  ))}
                </VStack>
              </Card.Body>
            </Card.Root>
          )}

          {/* Similar Subjects */}
          {similarSubjects.length > 0 && (
            <Card.Root bg='black'>
              <Card.Body p={6}>
                <Heading as='h2' size='lg' mb={4} color='white'>
                  Similar Subjects ({similarSubjects.length})
                </Heading>
                <VStack gap={3} align='stretch'>
                  {similarSubjects.map((subject) => (
                    <HStack
                      key={subject._id.$oid}
                      justify='space-between'
                      p={4}
                      bg='#1a1a1a'
                      borderRadius='lg'
                      cursor='pointer'
                      _hover={{
                        bg: '#2a2a2a',
                        transform: 'translateX(4px)',
                      }}
                      transition='all 0.2s'
                      onClick={() => handleSubjectClick(subject.ent_name)}
                    >
                      <Box flex='1'>
                        <HStack justify='space-between' align='center'>
                          <Text fontWeight='semibold' color='white'>
                            {subject.ent_name}
                          </Text>
                          <Text
                            fontSize='sm'
                            color='green.400'
                            fontWeight='bold'
                          >
                            {subject.percent.toFixed(1)}% match
                          </Text>
                        </HStack>
                        <Text fontSize='xs' color='gray.500' mt={1}>
                          Click to view → /subject/
                          {createSlug(subject.ent_name)}
                        </Text>
                      </Box>
                      <FiChevronRight size={20} color='blue.400' />
                    </HStack>
                  ))}
                </VStack>
              </Card.Body>
            </Card.Root>
          )}

          {/* Analysis Results */}
          {analyses.length > 0 && (
            <Card.Root bg='black'>
              <Card.Body p={6}>
                <HStack gap={2} mb={4}>
                  <FiExternalLink size={20} color='white' />
                  <Heading as='h2' size='lg' color='white'>
                    Analysis Results ({analyses.length})
                  </Heading>
                </HStack>
                <VStack gap={3} align='stretch'>
                  {analyses.map((analysis) => (
                    <HStack
                      key={analysis._id.$oid}
                      justify='space-between'
                      p={4}
                      bg='#1a1a1a'
                      borderRadius='lg'
                      cursor='pointer'
                      _hover={{ bg: '#2a2a2a' }}
                      transition='all 0.2s'
                      onClick={() => handleAnalysisClick(analysis)}
                    >
                      <Box flex='1'>
                        <HStack justify='space-between' align='start' mb={2}>
                          <Text fontWeight='semibold' color='white'>
                            {analysis.ent_name}
                          </Text>
                          <Text
                            fontSize='xs'
                            color='gray.500'
                            textTransform='uppercase'
                          >
                            {analysis.status}
                          </Text>
                        </HStack>
                        <Text fontSize='sm' color='gray.400' mb={2}>
                          {analysis.ent_summary}
                        </Text>
                        <HStack gap={4}>
                          <Text fontSize='xs' color='gray.500'>
                            Lab: {analysis.lab_id.toUpperCase()}
                          </Text>
                          <Text fontSize='xs' color='gray.500'>
                            Start: {analysis.ent_start}
                          </Text>
                          {analysis.ent_inventors && (
                            <Text fontSize='xs' color='gray.500'>
                              By: {analysis.ent_inventors}
                            </Text>
                          )}
                        </HStack>
                      </Box>
                      <FiChevronRight size={20} color='gray.400' />
                    </HStack>
                  ))}
                </VStack>
              </Card.Body>
            </Card.Root>
          )}

          {/* Organization Results */}
          {organizations.length > 0 && (
            <Card.Root bg='black'>
              <Card.Body p={6}>
                <HStack gap={2} mb={4}>
                  <Box as='span' fontSize='lg'>
                    🏢
                  </Box>
                  <Heading as='h2' size='lg' color='white'>
                    Organizations ({organizations.length})
                  </Heading>
                </HStack>
                <VStack gap={3} align='stretch'>
                  {organizations.map((org) => (
                    <HStack
                      key={org._id.$oid}
                      justify='space-between'
                      p={4}
                      bg='#1a1a1a'
                      borderRadius='lg'
                      cursor='pointer'
                      _hover={{ bg: '#2a2a2a' }}
                      transition='all 0.2s'
                      onClick={() => handleOrganizationClick(org)}
                    >
                      <Box flex='1'>
                        <Text fontWeight='semibold' mb={1} color='white'>
                          {org.ent_name}
                        </Text>
                        <Text fontSize='xs' color='gray.500'>
                          ID: {org.ent_fsid}
                        </Text>
                      </Box>
                      <FiChevronRight size={20} color='gray.400' />
                    </HStack>
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

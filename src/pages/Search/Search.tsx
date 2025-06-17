import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
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

interface ExactMatchSubject {
  title: string;
  description: string;
  indices: {
    horizon: number;
    techTransfer: number;
    whiteSpace: number;
  };
  stats: {
    books: number;
    papers: number;
    patents: number;
    press: number;
    organizations: number;
  };
}

interface RelatedItem {
  id: number;
  title: string;
  summary: string;
}

const Search: React.FC = () => {
  const { setPageContext, clearPageContext, pageContext } = usePage();
  const [hasExactMatch, setHasExactMatch] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const searchQuery = 'computer vision';

  const exactMatchSubject: ExactMatchSubject = {
    title: 'Computer Vision',
    description:
      'The field of computer science that focuses on enabling computers to identify and understand objects and people in images and videos.',
    indices: {
      horizon: 0.85,
      techTransfer: 72,
      whiteSpace: 23,
    },
    stats: {
      books: 1247,
      papers: 45892,
      patents: 2834,
      press: 8921,
      organizations: 456,
    },
  };

  const relatedSubjects: RelatedItem[] = [
    {
      id: 1,
      title: 'Computer Science',
      summary:
        'The study of computational methods and data structures, and the design of computer systems and their applications.',
    },
    {
      id: 2,
      title: '3D Computer Graphics',
      summary:
        'The generation of digital images from three-dimensional models using specialized software and hardware.',
    },
    {
      id: 3,
      title: 'Biocomputer',
      summary:
        'A biological computing device that uses biological materials and processes to perform computational functions.',
    },
    {
      id: 4,
      title: 'Computer',
      summary:
        'An electronic device that manipulates information, or data, and has the ability to store, retrieve, and process data.',
    },
  ];

  const analysisResults: RelatedItem[] = [
    {
      id: 1,
      title: 'Brain-Computer Interfaces: Current State and Future Prospects',
      summary:
        'Comprehensive analysis of BCI technology development, market potential, and regulatory landscape.',
    },
    {
      id: 2,
      title: 'Computer Vision in Healthcare: Market Analysis 2024',
      summary:
        'Deep dive into computer vision applications in medical imaging, diagnostics, and treatment planning.',
    },
    {
      id: 3,
      title: 'Quantum Computer Development Timeline',
      summary:
        'Strategic analysis of quantum computing milestones and commercial viability forecasts.',
    },
  ];

  const organizationResults: RelatedItem[] = [
    {
      id: 1,
      title: 'Computer Accessories Corp',
      summary:
        'Leading manufacturer of computer peripherals and accessories, specializing in ergonomic input devices.',
    },
    {
      id: 2,
      title: 'Computer Assisted Engineering Solutions',
      summary:
        'Software company providing CAE tools for simulation, modeling, and design optimization across industries.',
    },
    {
      id: 3,
      title: 'Vision Computer Systems Inc',
      summary:
        'Enterprise solutions provider focused on computer vision systems for industrial automation and quality control.',
    },
  ];

  // Memoize the mapped arrays to prevent recreation on every render
  const mappedRelatedSubjects = useMemo(
    () =>
      relatedSubjects.map((subject) => ({
        id: subject.id.toString(),
        name: subject.title,
        title: subject.title,
      })),
    [] // Empty dependency array since relatedSubjects is static
  );

  const mappedOrganizations = useMemo(
    () =>
      organizationResults.map((org) => ({
        id: org.id.toString(),
        name: org.title,
        title: org.title,
      })),
    [] // Empty dependency array since organizationResults is static
  );

  const mappedAnalyses = useMemo(
    () =>
      analysisResults.map((analysis) => ({
        id: analysis.id.toString(),
        title: analysis.title,
        name: analysis.title,
      })),
    [] // Empty dependency array since analysisResults is static
  );

  // Memoize the page context object to prevent recreation
  const searchPageContext = useMemo(
    () => ({
      pageType: 'search' as const,
      pageTitle: `Search Results for "${searchQuery}"`,
      searchQuery,
      exactMatch: hasExactMatch
        ? {
            type: 'subject' as const,
            subject: {
              id: 'computer-vision-123',
              name: exactMatchSubject.title,
              title: exactMatchSubject.title,
            },
          }
        : undefined,
      relatedSubjects: mappedRelatedSubjects,
      organizations: mappedOrganizations,
      analyses: mappedAnalyses,
    }),
    [
      searchQuery,
      hasExactMatch,
      mappedRelatedSubjects,
      mappedOrganizations,
      mappedAnalyses,
    ]
  );

  useEffect(() => {
    setPageContext(searchPageContext);
    return () => clearPageContext();
  }, [setPageContext, clearPageContext, searchPageContext]);

  const handleCreateSubject = async (): Promise<void> => {
    setIsCreating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsCreating(false);
    // In real app: redirect to /subject/computer-vision
    alert('Would redirect to /subject/computer-vision');
  };

  const toggleExactMatch = (): void => {
    setHasExactMatch(!hasExactMatch);
  };

  const handleItemClick = (type: string, item: RelatedItem): void => {
    console.log(`Navigate to ${type}:`, item.title);
  };

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
            <Heading as='h1' size='xl'>
              Search Results
            </Heading>
            <Text color='gray.500'>for "{searchQuery}"</Text>
          </HStack>
        </Box>
      </Box>
      <Box maxW='7xl' mx='auto' px={6} py={8}>
        <VStack gap={8} align='stretch'>
          {/* Demo Toggle Button */}
          <Flex justify='center'>
            <Button colorScheme='blue' onClick={toggleExactMatch}>
              Demo Toggle:{' '}
              {hasExactMatch ? 'Show No Match State' : 'Show Exact Match State'}
            </Button>
          </Flex>

          {/* Exact Match Section */}
          <Card.Root bg='black'>
            <Card.Body p={8}>
              {hasExactMatch ? (
                <VStack gap={6} align='stretch'>
                  <Heading as='h2' size='lg'>
                    Exact Match
                  </Heading>
                  <Box
                    bg='gradient-to-r from-blue-50 to-indigo-50'
                    p={6}
                    borderRadius='lg'
                    border='2px solid'
                    borderColor='blue.200'
                  >
                    <VStack gap={6} align='stretch'>
                      <Box>
                        <Heading as='h3' size='xl' mb={3}>
                          {exactMatchSubject.title}
                        </Heading>
                        <Text color='gray.700' fontSize='lg' lineHeight='1.6'>
                          {exactMatchSubject.description}
                        </Text>
                      </Box>

                      {/* Indices */}
                      <SimpleGrid columns={3} gap={6}>
                        <Box textAlign='center'>
                          <Text
                            fontSize='2xl'
                            fontWeight='bold'
                            color='blue.600'
                          >
                            {exactMatchSubject.indices.horizon}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            Horizon Rank
                          </Text>
                          <Text fontSize='xs' color='gray.500'>
                            (0-1 scale)
                          </Text>
                        </Box>
                        <Box textAlign='center'>
                          <Text
                            fontSize='2xl'
                            fontWeight='bold'
                            color='green.600'
                          >
                            {exactMatchSubject.indices.techTransfer}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            Tech Transfer
                          </Text>
                          <Text fontSize='xs' color='gray.500'>
                            (0-100 scale)
                          </Text>
                        </Box>
                        <Box textAlign='center'>
                          <Text
                            fontSize='2xl'
                            fontWeight='bold'
                            color='purple.600'
                          >
                            {exactMatchSubject.indices.whiteSpace}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            White Space
                          </Text>
                          <Text fontSize='xs' color='gray.500'>
                            (0-100 scale)
                          </Text>
                        </Box>
                      </SimpleGrid>

                      {/* Stats */}
                      <SimpleGrid columns={5} gap={4}>
                        <Box
                          bg='#1a1a1a'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                        >
                          <Text fontSize='xl' fontWeight='bold'>
                            {exactMatchSubject.stats.books.toLocaleString()}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            Books
                          </Text>
                        </Box>
                        <Box
                          bg='#1a1a1a'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                        >
                          <Text fontSize='xl' fontWeight='bold'>
                            {exactMatchSubject.stats.papers.toLocaleString()}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            Papers
                          </Text>
                        </Box>
                        <Box
                          bg='#1a1a1a'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                        >
                          <Text fontSize='xl' fontWeight='bold'>
                            {exactMatchSubject.stats.patents.toLocaleString()}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            Patents
                          </Text>
                        </Box>
                        <Box
                          bg='#1a1a1a'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                        >
                          <Text fontSize='xl' fontWeight='bold'>
                            {exactMatchSubject.stats.press.toLocaleString()}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            Press
                          </Text>
                        </Box>
                        <Box
                          bg='#1a1a1a'
                          p={3}
                          borderRadius='lg'
                          textAlign='center'
                        >
                          <Text fontSize='xl' fontWeight='bold'>
                            {exactMatchSubject.stats.organizations.toLocaleString()}
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            Organizations
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </Box>
                </VStack>
              ) : (
                <VStack gap={6} align='stretch'>
                  <Heading as='h2' size='lg'>
                    Subject Search
                  </Heading>
                  <Box
                    bg='gray.50'
                    p={8}
                    borderRadius='lg'
                    border='2px dashed'
                    borderColor='gray.300'
                    textAlign='center'
                  >
                    <Text color='gray.600' mb={4}>
                      No match for "
                      <Text as='span' fontWeight='semibold'>
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
          <Card.Root bg='black'>
            <Card.Body p={6}>
              <Heading as='h2' size='lg' mb={4}>
                Subjects related to "{searchQuery}"
              </Heading>
              <VStack gap={3} align='stretch'>
                {relatedSubjects.map((subject) => (
                  <HStack
                    key={subject.id}
                    justify='space-between'
                    p={4}
                    bg='#1a1a1a'
                    borderRadius='lg'
                    cursor='pointer'
                    _hover={{ bg: 'gray.100' }}
                    transition='all 0.2s'
                    onClick={() => handleItemClick('subject', subject)}
                  >
                    <Box flex='1'>
                      <Text fontWeight='semibold' mb={1}>
                        {subject.title}
                      </Text>
                      <Text fontSize='sm' color='gray.600'>
                        {subject.summary}
                      </Text>
                    </Box>
                    <FiChevronRight size={20} color='gray.400' />
                  </HStack>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Analysis Results */}
          <Card.Root bg='black'>
            <Card.Body p={6}>
              <HStack gap={2} mb={4}>
                <FiExternalLink size={20} />
                <Heading as='h2' size='lg'>
                  Analysis Results
                </Heading>
              </HStack>
              <VStack gap={3} align='stretch'>
                {analysisResults.map((analysis) => (
                  <HStack
                    key={analysis.id}
                    justify='space-between'
                    p={4}
                    bg='#1a1a1a'
                    borderRadius='lg'
                    cursor='pointer'
                    _hover={{ bg: 'gray.100' }}
                    transition='all 0.2s'
                    onClick={() => handleItemClick('analysis', analysis)}
                  >
                    <Box flex='1'>
                      <Text fontWeight='semibold' mb={1}>
                        {analysis.title}
                      </Text>
                      <Text fontSize='sm' color='gray.600'>
                        {analysis.summary}
                      </Text>
                    </Box>
                    <FiChevronRight size={20} color='gray.400' />
                  </HStack>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Organization Results */}
          <Card.Root bg='black'>
            <Card.Body p={6}>
              <HStack gap={2} mb={4}>
                <Box as='span' fontSize='lg'>
                  🏢
                </Box>
                <Heading as='h2' size='lg'>
                  Organizations
                </Heading>
              </HStack>
              <VStack gap={3} align='stretch'>
                {organizationResults.map((org) => (
                  <HStack
                    key={org.id}
                    justify='space-between'
                    p={4}
                    bg='#1a1a1a'
                    borderRadius='lg'
                    cursor='pointer'
                    _hover={{ bg: 'gray.100' }}
                    transition='all 0.2s'
                    onClick={() => handleItemClick('organization', org)}
                  >
                    <Box flex='1'>
                      <Text fontWeight='semibold' mb={1}>
                        {org.title}
                      </Text>
                      <Text fontSize='sm' color='gray.600'>
                        {org.summary}
                      </Text>
                    </Box>
                    <FiChevronRight size={20} color='gray.400' />
                  </HStack>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Box>
    </Box>
  );
};

export default Search;

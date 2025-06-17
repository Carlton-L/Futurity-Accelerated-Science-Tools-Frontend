import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  VStack,
  HStack,
  Input,
} from '@chakra-ui/react';
import { FiPlus, FiCheck } from 'react-icons/fi';
import { BsSticky } from 'react-icons/bs';
import { TbTestPipe } from 'react-icons/tb';
import CardScroller from '../../components/shared/CardScroller';
import TrendsChart from './TrendsChart';
import ForecastChart from './ForecastChart';
import RelatedDocuments from '../../components/shared/RelatedDocuments';
import { usePage } from '../../context/PageContext';

// TypeScript interfaces
// TODO: Move interfaces to separate types file when project grows
interface RelatedSubject {
  id: string;
  name: string;
  horizonRanking: number;
  slug: string; // URL-friendly identifier for routing
}

interface RelatedAnalysis {
  id: string;
  labId: string;
  title: string;
  description: string;
  status: 'Ready' | 'Coming soon...';
  imageUrl: string;
  createdAt: string; // ISO date string for sorting
}

interface SubjectStats {
  organizations: number;
  press: number;
  patents: number;
  papers: number;
  books: number;
  relatedDocs: number;
}

interface Subject {
  id: string; // Added id field for PageContext
  name: string;
  description: string;
  horizonRanking: number;
  whiteSpace: number;
  techTransfer: number;
  stats: SubjectStats;
  relatedSubjects: RelatedSubject[];
  relatedAnalyses: RelatedAnalysis[];
}

// Placeholder Network Graph Component
// TODO: Replace with actual network graph implementation
const NetworkGraph: React.FC = () => {
  return (
    <Box
      bg='gray.50'
      border='1px solid'
      borderColor='gray.200'
      borderRadius='md'
      display='flex'
      alignItems='center'
      justifyContent='center'
      height='100%'
      minHeight='400px'
    >
      <Text color='gray.500' fontSize='lg'>
        Network Graph Component
        <br />
        (Replace with your network graph)
      </Text>
    </Box>
  );
};

const Subject: React.FC = () => {
  const { setPageContext, clearPageContext } = usePage();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isInWhiteboard, setIsInWhiteboard] = useState<boolean>(false); // TODO: Initialize from API/context to check if subject is already in whiteboard
  const [loading, setLoading] = useState<boolean>(true);

  // Related subjects state
  const [sortMethod, setSortMethod] = useState<string>('horizon-high');
  const [filterText, setFilterText] = useState<string>('');

  // Related analyses state
  const [analysisSortMethod, setAnalysisSortMethod] =
    useState<string>('most-recent');
  const [analysisFilterText, setAnalysisFilterText] = useState<string>('');

  // Memoize the page context to prevent infinite re-renders
  const subjectPageContext = useMemo(() => {
    if (!subject) return null;

    return {
      pageType: 'subject' as const,
      pageTitle: `Subject: ${subject.name}`,
      subject: {
        id: subject.id,
        name: subject.name,
        title: subject.name,
      },
    };
  }, [subject]);

  // Set up page context when subject data is loaded
  useEffect(() => {
    if (subjectPageContext) {
      setPageContext(subjectPageContext);
    }

    return () => clearPageContext();
  }, [setPageContext, clearPageContext, subjectPageContext]);

  // TODO: Replace with actual data fetching from API
  useEffect(() => {
    const fetchSubjectData = async (): Promise<void> => {
      // TODO: Replace setTimeout with actual API call
      setTimeout(() => {
        // TODO: Replace mock data with actual API response
        setSubject({
          id: 'artificial-intelligence-001', // Added ID for PageContext
          name: 'Artificial Intelligence',
          description:
            'Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving.',
          horizonRanking: 0.85,
          whiteSpace: 67,
          techTransfer: 42,
          stats: {
            organizations: 1247,
            press: 8934,
            patents: 12456,
            papers: 67890,
            books: 892,
            relatedDocs: 3421,
          },
          relatedSubjects: [
            {
              id: '1',
              name: '3D Bioprinter',
              horizonRanking: 0.92,
              slug: '3d-bioprinter',
            },
            {
              id: '2',
              name: 'Gender Futures',
              horizonRanking: 0.67,
              slug: 'gender-futures',
            },
            {
              id: '3',
              name: 'Biohacking',
              horizonRanking: 0.78,
              slug: 'biohacking',
            },
            {
              id: '4',
              name: 'Machine Learning',
              horizonRanking: 0.95,
              slug: 'machine-learning',
            },
            {
              id: '5',
              name: 'Computer Vision',
              horizonRanking: 0.88,
              slug: 'computer-vision',
            },
            {
              id: '6',
              name: 'Neural Networks',
              horizonRanking: 0.91,
              slug: 'neural-networks',
            },
            {
              id: '7',
              name: 'Robotics',
              horizonRanking: 0.84,
              slug: 'robotics',
            },
            {
              id: '8',
              name: 'Natural Language Processing',
              horizonRanking: 0.89,
              slug: 'natural-language-processing',
            },
            {
              id: '9',
              name: 'Quantum Computing',
              horizonRanking: 0.73,
              slug: 'quantum-computing',
            },
            {
              id: '10',
              name: 'Autonomous Vehicles',
              horizonRanking: 0.82,
              slug: 'autonomous-vehicles',
            },
            {
              id: '11',
              name: 'Deep Learning',
              horizonRanking: 0.93,
              slug: 'deep-learning',
            },
            {
              id: '12',
              name: 'Data Science',
              horizonRanking: 0.76,
              slug: 'data-science',
            },
          ],
          relatedAnalyses: [
            {
              id: 'analysis-1',
              labId: 'lab-1',
              title: 'The Age of Autonomous Commerce',
              description:
                'Societal, industrial, and economic impact as autonomous machines and intelligent agents enter the market',
              status: 'Ready',
              imageUrl:
                'https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=Auto',
              createdAt: '2024-01-15T10:30:00Z',
            },
            {
              id: 'analysis-2',
              labId: 'lab-2',
              title: 'Futurefarms and Cities',
              description:
                'Delve into the transformations unfolding in the luxury market. These changes are primarily driven by Gen Z and Zillennials—a generation bridging Millennials and Gen Z—but also by the Ageless generation, characterized by their adaptability, technological integration, and disregard for age as a limiting factor.',
              status: 'Coming soon...',
              imageUrl:
                'https://via.placeholder.com/100x100/50C878/FFFFFF?text=Farm',
              createdAt: '2024-02-20T14:45:00Z',
            },
            {
              id: 'analysis-3',
              labId: 'lab-1',
              title: 'Digital Identity Revolution',
              description:
                'How blockchain and AI are reshaping personal identity verification and privacy in the digital age',
              status: 'Ready',
              imageUrl:
                'https://via.placeholder.com/100x100/FF6B6B/FFFFFF?text=ID',
              createdAt: '2024-03-10T09:15:00Z',
            },
            {
              id: 'analysis-4',
              labId: 'lab-3',
              title: 'Quantum Internet Protocols',
              description:
                'Exploring the infrastructure needed for quantum communication networks and their implications for cybersecurity',
              status: 'Coming soon...',
              imageUrl:
                'https://via.placeholder.com/100x100/9B59B6/FFFFFF?text=QNet',
              createdAt: '2024-01-05T16:20:00Z',
            },
            {
              id: 'analysis-5',
              labId: 'lab-2',
              title: 'Synthetic Biology Markets',
              description:
                'Market analysis of engineered biological systems and their potential to disrupt traditional manufacturing',
              status: 'Ready',
              imageUrl:
                'https://via.placeholder.com/100x100/F39C12/FFFFFF?text=Bio',
              createdAt: '2024-02-28T11:00:00Z',
            },
          ],
        } as Subject);
        setLoading(false);
      }, 1000);
    };

    fetchSubjectData();
  }, []);

  const handleAddToWhiteboard = (): void => {
    // TODO: Replace with actual API call to add subject to whiteboard
    setIsInWhiteboard(true);
  };

  const handleAddToLab = (): void => {
    // TODO: Replace with actual API call to add subject to lab
    console.log('Added to lab');
  };

  const handleSubjectClick = (slug: string): void => {
    // TODO: Replace with actual navigation using useNavigate hook
    // Example: navigate(`/subject/${slug}`);
    console.log(`Navigate to: /subject/${slug}`);
  };

  const handleAnalysisClick = (labId: string, analysisId: string): void => {
    // TODO: Replace with actual navigation using useNavigate hook
    // Example: navigate(`/lab/${labId}/analysis/${analysisId}`);
    console.log(`Navigate to: /lab/${labId}/analysis/${analysisId}`);
  };

  // Filter and sort related analyses
  const getFilteredAndSortedAnalyses = (): RelatedAnalysis[] => {
    if (!subject?.relatedAnalyses) return [];

    // Filter by search text
    const filtered = subject.relatedAnalyses.filter(
      (analysis) =>
        analysis.title
          .toLowerCase()
          .includes(analysisFilterText.toLowerCase()) ||
        analysis.description
          .toLowerCase()
          .includes(analysisFilterText.toLowerCase())
    );

    // Sort based on selected method
    switch (analysisSortMethod) {
      case 'most-recent':
        return filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'a-z':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return filtered.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return filtered;
    }
  };

  // Filter and sort related subjects
  const getFilteredAndSortedSubjects = (): RelatedSubject[] => {
    if (!subject?.relatedSubjects) return [];

    // Filter by search text
    const filtered = subject.relatedSubjects.filter((relatedSubject) =>
      relatedSubject.name.toLowerCase().includes(filterText.toLowerCase())
    );

    // Sort based on selected method
    switch (sortMethod) {
      case 'horizon-high':
        return filtered.sort((a, b) => b.horizonRanking - a.horizonRanking);
      case 'horizon-low':
        return filtered.sort((a, b) => a.horizonRanking - b.horizonRanking);
      case 'a-z':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a':
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return filtered;
    }
  };

  // TODO: Add error handling for failed API calls
  if (loading || !subject) {
    return (
      <Box p={6}>
        {/* TODO: Replace with proper loading component/skeleton */}
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg='gray.50' minHeight='calc(100vh - 64px)'>
      {/* Main Subject Card */}
      <Card.Root maxW='1024px' mb={6}>
        <Card.Body p={6}>
          <Flex justify='space-between' align='flex-start' mb={4}>
            <Heading as='h1' size='xl' flex='1' mr={4}>
              {subject.name}
            </Heading>
            <HStack gap={3}>
              <Button
                size='md'
                colorScheme={isInWhiteboard ? 'gray' : 'blue'}
                variant={isInWhiteboard ? 'outline' : 'solid'}
                disabled={isInWhiteboard}
                onClick={handleAddToWhiteboard}
              >
                {isInWhiteboard ? <FiCheck size={16} /> : <FiPlus size={16} />}
                <BsSticky size={16} />
                {isInWhiteboard ? 'in Whiteboard' : 'add to whiteboard'}
              </Button>
              <Button
                size='md'
                colorScheme='green'
                variant='solid'
                onClick={handleAddToLab}
              >
                <FiPlus size={16} />
                <TbTestPipe size={16} />
                add to lab
              </Button>
            </HStack>
          </Flex>
          <Text color='gray.600' lineHeight='1.6'>
            {subject.description}
          </Text>
        </Card.Body>
      </Card.Root>

      {/* Main Content Area */}
      <Flex gap={6} align='flex-start'>
        {/* Left Side Stats */}
        <VStack gap={4} maxW='300px' flex='0 0 300px'>
          {/* Horizon Ranking Card */}
          <Card.Root w='100%'>
            <Card.Body p={4}>
              <Stat.Root>
                <Stat.Label>
                  <Heading as='h3' size='md' mb={2}>
                    Horizon Ranking
                  </Heading>
                </Stat.Label>
                <Stat.ValueText
                  fontSize='2xl'
                  fontWeight='bold'
                  color='blue.500'
                >
                  {subject.horizonRanking.toFixed(2)}
                </Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          {/* White Space Card */}
          <Card.Root w='100%'>
            <Card.Body p={4}>
              <Stat.Root>
                <Stat.Label>
                  <Heading as='h3' size='md' mb={2}>
                    White Space
                  </Heading>
                </Stat.Label>
                <Stat.ValueText
                  fontSize='2xl'
                  fontWeight='bold'
                  color='green.500'
                >
                  {subject.whiteSpace}%
                </Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          {/* Tech Transfer Card */}
          <Card.Root w='100%'>
            <Card.Body p={4}>
              <Stat.Root>
                <Stat.Label>
                  <Heading as='h3' size='md' mb={2}>
                    Tech Transfer
                  </Heading>
                </Stat.Label>
                <Stat.ValueText
                  fontSize='2xl'
                  fontWeight='bold'
                  color='purple.500'
                >
                  {subject.techTransfer}
                </Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>
        </VStack>

        {/* Network Graph */}
        <Box flex='1' height='100vh'>
          <NetworkGraph />
        </Box>
      </Flex>

      {/* Bottom Stats Cards */}
      <Box mt={6}>
        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={4}>
          <Card.Root>
            <Card.Body p={4} textAlign='center'>
              <Stat.Root>
                <Stat.Label>
                  <Heading as='h4' size='sm' mb={2}>
                    Organizations
                  </Heading>
                </Stat.Label>
                <Stat.ValueText fontSize='xl' fontWeight='bold'>
                  {subject.stats.organizations.toLocaleString()}
                </Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body p={4} textAlign='center'>
              <Stat.Root>
                <Stat.Label>
                  <Heading as='h4' size='sm' mb={2}>
                    Press
                  </Heading>
                </Stat.Label>
                <Stat.ValueText fontSize='xl' fontWeight='bold'>
                  {subject.stats.press.toLocaleString()}
                </Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body p={4} textAlign='center'>
              <Stat.Root>
                <Stat.Label>
                  <Heading as='h4' size='sm' mb={2}>
                    Patents
                  </Heading>
                </Stat.Label>
                <Stat.ValueText fontSize='xl' fontWeight='bold'>
                  {subject.stats.patents.toLocaleString()}
                </Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body p={4} textAlign='center'>
              <Stat.Root>
                <Stat.Label>
                  <Heading as='h4' size='sm' mb={2}>
                    Papers
                  </Heading>
                </Stat.Label>
                <Stat.ValueText fontSize='xl' fontWeight='bold'>
                  {subject.stats.papers.toLocaleString()}
                </Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body p={4} textAlign='center'>
              <Stat.Root>
                <Stat.Label>
                  <Heading as='h4' size='sm' mb={2}>
                    Books
                  </Heading>
                </Stat.Label>
                <Stat.ValueText fontSize='xl' fontWeight='bold'>
                  {subject.stats.books.toLocaleString()}
                </Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body p={4} textAlign='center'>
              <Stat.Root>
                <Stat.Label>
                  <Heading as='h4' size='sm' mb={2}>
                    Related Docs
                  </Heading>
                </Stat.Label>
                <Stat.ValueText fontSize='xl' fontWeight='bold'>
                  {subject.stats.relatedDocs.toLocaleString()}
                </Stat.ValueText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Box>

      {/* Related Subjects and Related Analyses */}
      <HStack gap={6} mt={6} align='flex-start'>
        {/* Related Subjects Card */}
        <Card.Root flex='1' height='400px'>
          <Card.Body p={6} display='flex' flexDirection='column' height='100%'>
            <VStack gap={4} align='stretch' height='100%'>
              {/* Header */}
              <Heading as='h2' size='lg' flexShrink={0}>
                Related Subjects
              </Heading>

              {/* Controls */}
              <HStack gap={4} align='center' flexShrink={0}>
                <HStack gap={2} align='center'>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='gray.700'
                    whiteSpace='nowrap'
                  >
                    Sort by:
                  </Text>
                  <select
                    value={sortMethod}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setSortMethod(e.target.value)
                    }
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      fontSize: '14px',
                      minWidth: '200px',
                    }}
                  >
                    <option value='horizon-high'>
                      Horizon Rank (High to Low)
                    </option>
                    <option value='horizon-low'>
                      Horizon Rank (Low to High)
                    </option>
                    <option value='a-z'>A-Z</option>
                    <option value='z-a'>Z-A</option>
                  </select>
                </HStack>
                <Input
                  placeholder='Filter subjects...'
                  value={filterText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilterText(e.target.value)
                  }
                  size='sm'
                  flex='1'
                />
              </HStack>

              {/* Divider */}
              <Box height='1px' bg='gray.200' flexShrink={0} />

              {/* Subjects List */}
              <Box
                flex='1'
                overflowY='auto'
                p={2}
                border='1px solid'
                borderColor='gray.100'
                borderRadius='md'
              >
                <Flex wrap='wrap' gap={2}>
                  {getFilteredAndSortedSubjects().map((relatedSubject) => (
                    <Card.Root
                      key={relatedSubject.id}
                      size='sm'
                      variant='outline'
                      cursor='pointer'
                      _hover={{ bg: 'gray.50', borderColor: 'blue.300' }}
                      onClick={() => handleSubjectClick(relatedSubject.slug)}
                      transition='all 0.2s'
                    >
                      <Card.Body p={3}>
                        <HStack gap={2} justify='space-between'>
                          <Text
                            fontSize='sm'
                            fontWeight='medium'
                            color='blue.600'
                          >
                            {relatedSubject.name}
                          </Text>
                          <Box
                            bg='white'
                            color='black'
                            border='1px solid'
                            borderColor='gray.300'
                            fontSize='xs'
                            px={2}
                            py={1}
                            borderRadius='md'
                          >
                            {relatedSubject.horizonRanking.toFixed(2)}
                          </Box>
                        </HStack>
                      </Card.Body>
                    </Card.Root>
                  ))}
                </Flex>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Related Analyses Card */}
        <Card.Root flex='1' height='400px'>
          <Card.Body p={6} display='flex' flexDirection='column' height='100%'>
            <VStack gap={4} align='stretch' height='100%'>
              {/* Header */}
              <Heading as='h2' size='lg' flexShrink={0}>
                Related Analyses
              </Heading>

              {/* Controls */}
              <HStack gap={4} align='center' flexShrink={0}>
                <HStack gap={2} align='center'>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='gray.700'
                    whiteSpace='nowrap'
                  >
                    Sort by:
                  </Text>
                  <select
                    value={analysisSortMethod}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setAnalysisSortMethod(e.target.value)
                    }
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      fontSize: '14px',
                      minWidth: '150px',
                    }}
                  >
                    <option value='most-recent'>Most Recent</option>
                    <option value='oldest'>Oldest</option>
                    <option value='a-z'>A-Z</option>
                    <option value='z-a'>Z-A</option>
                  </select>
                </HStack>
                <Input
                  placeholder='Filter analyses...'
                  value={analysisFilterText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAnalysisFilterText(e.target.value)
                  }
                  size='sm'
                  flex='1'
                />
              </HStack>

              {/* Divider */}
              <Box height='1px' bg='gray.200' flexShrink={0} />

              {/* Analyses List with CardScroller */}
              <CardScroller height='100%'>
                {getFilteredAndSortedAnalyses().map((analysis) => (
                  <Card.Root
                    key={analysis.id}
                    minWidth='280px'
                    maxWidth='280px'
                    height='100%'
                    variant='outline'
                    cursor='pointer'
                    _hover={{ bg: 'gray.50', borderColor: 'blue.300' }}
                    onClick={() =>
                      handleAnalysisClick(analysis.labId, analysis.id)
                    }
                    transition='all 0.2s'
                  >
                    <Card.Body
                      p={4}
                      height='100%'
                      display='flex'
                      flexDirection='column'
                    >
                      <VStack gap={3} align='stretch' height='100%'>
                        {/* Image and Title Row */}
                        <HStack gap={3} align='flex-start' flexShrink={0}>
                          <Box
                            width='100px'
                            height='100px'
                            borderRadius='md'
                            overflow='hidden'
                            flexShrink={0}
                          >
                            <img
                              src={analysis.imageUrl}
                              alt={analysis.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </Box>
                          <VStack gap={2} align='stretch' flex='1'>
                            <Text
                              fontSize='sm'
                              fontWeight='bold'
                              color='blue.600'
                              lineHeight='1.3'
                            >
                              {analysis.title}
                            </Text>
                            <Box
                              bg={
                                analysis.status === 'Ready'
                                  ? 'green.100'
                                  : 'blue.100'
                              }
                              color={
                                analysis.status === 'Ready'
                                  ? 'green.800'
                                  : 'blue.800'
                              }
                              px={2}
                              py={1}
                              borderRadius='md'
                              fontSize='xs'
                              fontWeight='medium'
                              width='fit-content'
                            >
                              {analysis.status}
                            </Box>
                          </VStack>
                        </HStack>

                        {/* Description */}
                        <Text
                          fontSize='xs'
                          color='gray.600'
                          lineHeight='1.4'
                          overflow='hidden'
                          textOverflow='ellipsis'
                          display='-webkit-box'
                          flex='1'
                          style={{
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {analysis.description}
                        </Text>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                ))}
              </CardScroller>
            </VStack>
          </Card.Body>
        </Card.Root>
      </HStack>

      {/* Trends Chart */}
      <TrendsChart subjectSlug='computer-vision' />

      {/* Forecast Analysis Chart */}
      <ForecastChart subjectSlug='computer-vision' />

      {/* Related Documents */}
      <RelatedDocuments />
    </Box>
  );
};

export default Subject;

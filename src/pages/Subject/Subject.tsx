import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  VStack,
  HStack,
  Input,
  Spinner,
} from '@chakra-ui/react';
import { FiPlus, FiCheck } from 'react-icons/fi';
import { BsSticky } from 'react-icons/bs';
import { TbTestPipe } from 'react-icons/tb';
import CardScroller from '../../components/shared/CardScroller';
import TrendsChart from './TrendsChart';
import ForecastChart from './ForecastChart';
import RelatedDocuments from '../../components/shared/RelatedDocuments';
import { usePage } from '../../context/PageContext';
import GlassCard from '../../components/shared/GlassCard';
import NetworkGraph from './NetworkGraph/NetworkGraph';

// TypeScript interfaces
interface RelatedSubject {
  id: string;
  name: string;
  horizonRanking: number;
  subjectSlug: string;
}

interface RelatedAnalysis {
  _id: string;
  lab_id: string;
  ent_name: string;
  ent_summary: string;
  ent_start: string;
  status: string;
  picture_url: string | null;
  ent_fsid: string;
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
  _id: string;
  ent_name: string;
  ent_fsid: string;
  ent_summary: string;
  slug: string;
  stats: SubjectStats;
  relatedSubjects: RelatedSubject[];
  relatedAnalyses: RelatedAnalysis[];
}

interface ApiSubjectResponse {
  _id: string;
  ent_name: string;
  ent_fsid: string;
  ent_summary: string;
}

interface ApiCountsResponse {
  counts: {
    Book: number;
    Press: number;
    Patent: number;
    Paper: number;
    Organization: number;
    Documents: number;
  };
}

interface ApiRelatedSubjectsResponse {
  rows: Array<{
    ent_name: string;
    ent_fsid: string;
  }>;
  count: number;
}

interface ApiRelatedAnalysesResponse {
  rows: Array<{
    _id: string;
    lab_id: string;
    ent_fsid: string;
    ent_name: string;
    ent_summary: string;
    ent_start: string;
    status: string;
    picture_url: string | null;
  }>;
  count: number;
}

const Subject: React.FC = () => {
  // FIXME assign const and remove if statement
  let { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setPageContext, clearPageContext } = usePage();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isInWhiteboard, setIsInWhiteboard] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  if (!slug || slug === '') {
    slug = 'metaverse';
  }

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
      pageTitle: `Subject: ${subject.ent_name}`,
      subject: {
        id: subject._id,
        name: subject.ent_name,
        title: subject.ent_name,
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

  // Fetch subject data from API
  useEffect(() => {
    const fetchSubjectData = async (): Promise<void> => {
      if (!slug) {
        setError('No subject slug provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const headers = {
          Authorization: 'Bearer xE8C9T4QGRcbnUoZPrjkyI5mOVjKJAiJ',
          'Content-Type': 'application/json',
        };

        // Fetch all data in parallel
        const [
          subjectResponse,
          countsResponse,
          relatedSubjectsResponse,
          relatedAnalysesResponse,
        ] = await Promise.all([
          fetch(
            `https://tools.futurity.science/api/subject/view?slug=${slug}`,
            { headers }
          ),
          fetch(
            `https://tools.futurity.science/api/subject/get-counts?slug=${slug}`,
            { headers }
          ),
          fetch(
            `https://tools.futurity.science/api/subject/related-snapshots?slug=${slug}`,
            { headers }
          ),
          fetch(
            `https://tools.futurity.science/api/subject/related-analyses?slug=${slug}`,
            { headers }
          ),
        ]);

        // Check if all responses are ok
        if (
          !subjectResponse.ok ||
          !countsResponse.ok ||
          !relatedSubjectsResponse.ok ||
          !relatedAnalysesResponse.ok
        ) {
          throw new Error('Failed to fetch subject data');
        }

        // Parse all responses
        const subjectData: ApiSubjectResponse = await subjectResponse.json();
        const countsData: ApiCountsResponse = await countsResponse.json();
        const relatedSubjectsData: ApiRelatedSubjectsResponse =
          await relatedSubjectsResponse.json();
        const relatedAnalysesData: ApiRelatedAnalysesResponse =
          await relatedAnalysesResponse.json();

        // Transform related subjects data
        const relatedSubjects: RelatedSubject[] = relatedSubjectsData.rows.map(
          (item, index) => ({
            id: item.ent_fsid,
            name: item.ent_name,
            horizonRanking: Math.random() * 0.5 + 0.5, // Random between 0.5-1.0 for now
            subjectSlug: item.ent_fsid.replace('fsid_', ''),
          })
        );

        // Transform related analyses data
        const relatedAnalyses: RelatedAnalysis[] = relatedAnalysesData.rows.map(
          (item) => ({
            _id: item._id,
            lab_id: item.lab_id,
            ent_name: item.ent_name,
            ent_summary: item.ent_summary,
            ent_start: item.ent_start,
            status: item.status === 'soon' ? 'Coming soon...' : 'Ready',
            picture_url:
              item.picture_url ||
              `https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=${item.lab_id.toUpperCase()}`,
            ent_fsid: item.ent_fsid,
          })
        );

        // Combine all data into subject object
        const combinedSubject: Subject = {
          _id: subjectData._id,
          ent_name: subjectData.ent_name,
          ent_fsid: subjectData.ent_fsid,
          ent_summary: subjectData.ent_summary,
          slug: slug,
          stats: {
            organizations: countsData.counts.Organization,
            press: countsData.counts.Press,
            patents: countsData.counts.Patent,
            papers: countsData.counts.Paper,
            books: countsData.counts.Book,
            relatedDocs: countsData.counts.Documents,
          },
          relatedSubjects,
          relatedAnalyses,
        };

        setSubject(combinedSubject);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch subject data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load subject data'
        );
        setLoading(false);
      }
    };

    fetchSubjectData();
  }, [slug]);

  const params = { subject: slug };

  const handleAddToWhiteboard = (): void => {
    setIsInWhiteboard(true);
  };

  const handleAddToLab = (): void => {
    console.log('Added to lab');
  };

  const handleSubjectClick = (targetSlug: string): void => {
    navigate(`/subject/${targetSlug}`);
  };

  const handleAnalysisClick = (labId: string, analysisId: string): void => {
    navigate(`/lab/${labId}/analysis/${analysisId}`);
  };

  // Filter and sort related analyses
  const getFilteredAndSortedAnalyses = (): RelatedAnalysis[] => {
    if (!subject?.relatedAnalyses) return [];

    // Filter by search text
    const filtered = subject.relatedAnalyses.filter(
      (analysis) =>
        analysis.ent_name
          .toLowerCase()
          .includes(analysisFilterText.toLowerCase()) ||
        analysis.ent_summary
          .toLowerCase()
          .includes(analysisFilterText.toLowerCase())
    );

    // Sort based on selected method
    switch (analysisSortMethod) {
      case 'most-recent':
        return filtered.sort((a, b) => b.ent_start.localeCompare(a.ent_start));
      case 'oldest':
        return filtered.sort((a, b) => a.ent_start.localeCompare(b.ent_start));
      case 'a-z':
        return filtered.sort((a, b) => a.ent_name.localeCompare(b.ent_name));
      case 'z-a':
        return filtered.sort((a, b) => b.ent_name.localeCompare(a.ent_name));
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

  // Loading state
  if (loading) {
    return (
      <Box
        p={6}
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <VStack gap={2}>
          <Spinner size='lg' />
          <Text color='gray.500'>Loading subject data...</Text>
        </VStack>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        p={6}
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <VStack gap={4} textAlign='center'>
          <Text fontSize='xl' color='red.500'>
            Error Loading Subject
          </Text>
          <Text color='gray.600'>{error}</Text>
          <Button onClick={() => window.location.reload()} colorScheme='blue'>
            Reload Page
          </Button>
        </VStack>
      </Box>
    );
  }

  // No subject found
  if (!subject) {
    return (
      <Box
        p={6}
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='400px'
      >
        <Text color='gray.500'>Subject not found</Text>
      </Box>
    );
  }

  return (
    <Box position='relative' bg='bg' minHeight='calc(100vh - 64px)'>
      {/* Background Network Graph - Full height background */}
      <Box
        position='absolute'
        top={0}
        left={0}
        right={0}
        height='100vh'
        zIndex={0}
      >
        <NetworkGraph params={params} />
      </Box>

      {/* Top floating cards - positioned above the network graph */}
      <Box position='relative' zIndex={1} p={6} pointerEvents='none'>
        {/* Main Subject Card */}
        <GlassCard
          variant='glass'
          maxW='1024px'
          mb={6}
          borderWidth='1px'
          borderStyle='solid'
          borderColor={{ base: 'white', _light: 'black' }}
          borderRadius='8px'
          pointerEvents='auto'
        >
          <Box p={6}>
            <Flex justify='space-between' align='flex-start' mb={4}>
              <Heading as='h1' size='xl' flex='1' mr={4} color='fg'>
                {subject.ent_name}
              </Heading>
              <HStack gap={3} pointerEvents='auto'>
                <Button
                  size='md'
                  colorScheme={isInWhiteboard ? 'gray' : 'blue'}
                  variant={isInWhiteboard ? 'outline' : 'solid'}
                  disabled={isInWhiteboard}
                  onClick={handleAddToWhiteboard}
                  pointerEvents='auto'
                >
                  {isInWhiteboard ? (
                    <FiCheck size={16} />
                  ) : (
                    <FiPlus size={16} />
                  )}
                  <BsSticky size={16} />
                  {isInWhiteboard ? 'in Whiteboard' : 'add to whiteboard'}
                </Button>
                <Button
                  size='md'
                  colorScheme='green'
                  variant='solid'
                  onClick={handleAddToLab}
                  pointerEvents='auto'
                >
                  <FiPlus size={16} />
                  <TbTestPipe size={16} />
                  add to lab
                </Button>
              </HStack>
            </Flex>
            <Text color='fg.muted' lineHeight='1.6'>
              {subject.ent_summary}
            </Text>
          </Box>
        </GlassCard>

        {/* Subject Info Card */}
        <VStack gap={4} w='300px' mb={6} pointerEvents='auto'>
          {/* Horizon Rank Card */}
          <GlassCard
            variant='glass'
            w='100%'
            borderWidth='1px'
            borderStyle='solid'
            borderColor={{ base: 'white', _light: 'black' }}
            borderRadius='8px'
          >
            <Box p={4} textAlign='center'>
              <Stat.Root>
                <Stat.Label>
                  <Text as='h4' mb={2} color='fg'>
                    Horizon Rank
                  </Text>
                </Stat.Label>
                <Stat.ValueText
                  fontSize='xl'
                  fontWeight='bold'
                  color='brand.400'
                >
                  {(Math.random() * 0.5 + 0.5).toFixed(2)}
                </Stat.ValueText>
              </Stat.Root>
            </Box>
          </GlassCard>

          {/* White Space Card */}
          <GlassCard
            variant='glass'
            w='100%'
            borderWidth='1px'
            borderStyle='solid'
            borderColor={{ base: 'white', _light: 'black' }}
            borderRadius='8px'
          >
            <Box p={4} textAlign='center'>
              <Stat.Root>
                <Stat.Label>
                  <Text as='h4' mb={2} color='fg'>
                    White Space
                  </Text>
                </Stat.Label>
                <Stat.ValueText
                  fontSize='xl'
                  fontWeight='bold'
                  color='brand.400'
                >
                  {Math.floor(Math.random() * 100)}
                </Stat.ValueText>
              </Stat.Root>
            </Box>
          </GlassCard>

          {/* Tech Transfer Card */}
          <GlassCard
            variant='glass'
            w='100%'
            borderWidth='1px'
            borderStyle='solid'
            borderColor={{ base: 'white', _light: 'black' }}
            borderRadius='8px'
          >
            <Box p={4} textAlign='center'>
              <Stat.Root>
                <Stat.Label>
                  <Text as='h4' mb={2} color='fg'>
                    Tech Transfer
                  </Text>
                </Stat.Label>
                <Stat.ValueText
                  fontSize='xl'
                  fontWeight='bold'
                  color='brand.400'
                >
                  {Math.floor(Math.random() * 100)}
                </Stat.ValueText>
              </Stat.Root>
            </Box>
          </GlassCard>
        </VStack>
      </Box>

      {/* Spacer to push content below the NetworkGraph */}
      <Box height='50vh' />

      {/* Main content area - renders after the NetworkGraph */}
      <Box bg='bg' p={6}>
        {/* Bottom Stats Cards */}
        <Box mb={6}>
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={4}>
            <GlassCard
              variant='solid'
              borderWidth='1px'
              borderStyle='solid'
              borderColor={{ base: 'white', _light: 'black' }}
              borderRadius='8px'
            >
              <Box p={4} textAlign='center'>
                <Stat.Root>
                  <Stat.Label>
                    <Heading as='h4' size='sm' mb={2} color='fg'>
                      Organizations
                    </Heading>
                  </Stat.Label>
                  <Stat.ValueText fontSize='xl' fontWeight='bold' color='fg'>
                    {subject.stats.organizations.toLocaleString()}
                  </Stat.ValueText>
                </Stat.Root>
              </Box>
            </GlassCard>

            <GlassCard
              variant='solid'
              borderWidth='1px'
              borderStyle='solid'
              borderColor={{ base: 'white', _light: 'black' }}
              borderRadius='8px'
            >
              <Box p={4} textAlign='center'>
                <Stat.Root>
                  <Stat.Label>
                    <Heading as='h4' size='sm' mb={2} color='fg'>
                      Press
                    </Heading>
                  </Stat.Label>
                  <Stat.ValueText fontSize='xl' fontWeight='bold' color='fg'>
                    {subject.stats.press.toLocaleString()}
                  </Stat.ValueText>
                </Stat.Root>
              </Box>
            </GlassCard>

            <GlassCard
              variant='solid'
              borderWidth='1px'
              borderStyle='solid'
              borderColor={{ base: 'white', _light: 'black' }}
              borderRadius='8px'
            >
              <Box p={4} textAlign='center'>
                <Stat.Root>
                  <Stat.Label>
                    <Heading as='h4' size='sm' mb={2} color='fg'>
                      Patents
                    </Heading>
                  </Stat.Label>
                  <Stat.ValueText fontSize='xl' fontWeight='bold' color='fg'>
                    {subject.stats.patents.toLocaleString()}
                  </Stat.ValueText>
                </Stat.Root>
              </Box>
            </GlassCard>

            <GlassCard
              variant='solid'
              borderWidth='1px'
              borderStyle='solid'
              borderColor={{ base: 'white', _light: 'black' }}
              borderRadius='8px'
            >
              <Box p={4} textAlign='center'>
                <Stat.Root>
                  <Stat.Label>
                    <Heading as='h4' size='sm' mb={2} color='fg'>
                      Papers
                    </Heading>
                  </Stat.Label>
                  <Stat.ValueText fontSize='xl' fontWeight='bold' color='fg'>
                    {subject.stats.papers.toLocaleString()}
                  </Stat.ValueText>
                </Stat.Root>
              </Box>
            </GlassCard>

            <GlassCard
              variant='solid'
              borderWidth='1px'
              borderStyle='solid'
              borderColor={{ base: 'white', _light: 'black' }}
              borderRadius='8px'
            >
              <Box p={4} textAlign='center'>
                <Stat.Root>
                  <Stat.Label>
                    <Heading as='h4' size='sm' mb={2} color='fg'>
                      Books
                    </Heading>
                  </Stat.Label>
                  <Stat.ValueText fontSize='xl' fontWeight='bold' color='fg'>
                    {subject.stats.books.toLocaleString()}
                  </Stat.ValueText>
                </Stat.Root>
              </Box>
            </GlassCard>

            <GlassCard
              variant='solid'
              borderWidth='1px'
              borderStyle='solid'
              borderColor={{ base: 'white', _light: 'black' }}
              borderRadius='8px'
            >
              <Box p={4} textAlign='center'>
                <Stat.Root>
                  <Stat.Label>
                    <Heading as='h4' size='sm' mb={2} color='fg'>
                      Related Docs
                    </Heading>
                  </Stat.Label>
                  <Stat.ValueText fontSize='xl' fontWeight='bold' color='fg'>
                    {subject.stats.relatedDocs.toLocaleString()}
                  </Stat.ValueText>
                </Stat.Root>
              </Box>
            </GlassCard>
          </SimpleGrid>
        </Box>

        {/* Related Subjects and Related Analyses */}
        <HStack gap={6} mb={6} align='flex-start'>
          {/* Related Subjects Card */}
          <GlassCard
            variant='solid'
            flex='1'
            height='400px'
            borderWidth='1px'
            borderStyle='solid'
            borderColor={{ base: 'white', _light: 'black' }}
            borderRadius='8px'
          >
            <Box p={6} display='flex' flexDirection='column' height='100%'>
              <VStack gap={4} align='stretch' height='100%'>
                <Heading as='h2' size='lg' flexShrink={0} color='fg'>
                  Related Subjects
                </Heading>

                <HStack gap={4} align='center' flexShrink={0}>
                  <HStack gap={2} align='center'>
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color='fg.muted'
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

                <Box height='1px' bg='border' flexShrink={0} />

                <Box
                  flex='1'
                  overflowY='auto'
                  p={2}
                  border='1px solid'
                  borderColor='border.muted'
                  borderRadius='md'
                >
                  <Flex wrap='wrap' gap={2}>
                    {getFilteredAndSortedSubjects().map((relatedSubject) => (
                      <GlassCard
                        key={relatedSubject.id}
                        variant='outline'
                        cursor='pointer'
                        _hover={{ bg: 'bg.subtle', borderColor: 'brand.400' }}
                        onClick={() =>
                          handleSubjectClick(relatedSubject.subjectSlug)
                        }
                        transition='all 0.2s'
                        borderWidth='1px'
                        borderStyle='solid'
                        borderColor={{ base: 'white', _light: 'black' }}
                        borderRadius='8px'
                      >
                        <Box p={3}>
                          <HStack gap={2} justify='space-between'>
                            <Text
                              fontSize='sm'
                              fontWeight='medium'
                              color='brand.400'
                            >
                              {relatedSubject.name}
                            </Text>
                            <Box
                              bg='bg.canvas'
                              color='fg'
                              border='1px solid'
                              borderColor='border'
                              fontSize='xs'
                              px={2}
                              py={1}
                              borderRadius='md'
                            >
                              {relatedSubject.horizonRanking.toFixed(2)}
                            </Box>
                          </HStack>
                        </Box>
                      </GlassCard>
                    ))}
                  </Flex>
                </Box>
              </VStack>
            </Box>
          </GlassCard>

          {/* Related Analyses Card */}
          <GlassCard
            variant='solid'
            flex='1'
            height='400px'
            borderWidth='1px'
            borderStyle='solid'
            borderColor={{ base: 'white', _light: 'black' }}
            borderRadius='8px'
          >
            <Box p={6} display='flex' flexDirection='column' height='100%'>
              <VStack gap={4} align='stretch' height='100%'>
                <Heading as='h2' size='lg' flexShrink={0} color='fg'>
                  Related Analyses
                </Heading>

                <HStack gap={4} align='center' flexShrink={0}>
                  <HStack gap={2} align='center'>
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color='fg.muted'
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

                <Box height='1px' bg='border' flexShrink={0} />

                <CardScroller height='100%'>
                  {getFilteredAndSortedAnalyses().map((analysis) => (
                    <GlassCard
                      key={analysis._id}
                      variant='outline'
                      minWidth='280px'
                      maxWidth='280px'
                      height='100%'
                      cursor='pointer'
                      _hover={{ bg: 'bg.subtle', borderColor: 'brand.400' }}
                      onClick={() =>
                        handleAnalysisClick(analysis.lab_id, analysis._id)
                      }
                      transition='all 0.2s'
                      borderWidth='1px'
                      borderStyle='solid'
                      borderColor={{ base: 'white', _light: 'black' }}
                      borderRadius='8px'
                    >
                      <Box
                        p={4}
                        height='100%'
                        display='flex'
                        flexDirection='column'
                      >
                        <VStack gap={3} align='stretch' height='100%'>
                          <HStack gap={3} align='flex-start' flexShrink={0}>
                            <Box
                              width='100px'
                              height='100px'
                              borderRadius='md'
                              overflow='hidden'
                              flexShrink={0}
                            >
                              <img
                                src={
                                  analysis.picture_url ||
                                  `https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=${analysis.lab_id.toUpperCase()}`
                                }
                                alt={analysis.ent_name}
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
                                color='brand.400'
                                lineHeight='1.3'
                              >
                                {analysis.ent_name}
                              </Text>
                              <Box
                                bg={
                                  analysis.status === 'Ready'
                                    ? 'status.success'
                                    : 'brand.400'
                                }
                                color='white'
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

                          <Text
                            fontSize='xs'
                            color='fg.muted'
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
                            {analysis.ent_summary}
                          </Text>
                        </VStack>
                      </Box>
                    </GlassCard>
                  ))}
                </CardScroller>
              </VStack>
            </Box>
          </GlassCard>
        </HStack>

        <TrendsChart subjectSlug={subject.slug} />

        <ForecastChart subjectSlug={subject.slug} />

        <RelatedDocuments subjectSlug={subject.slug} />
      </Box>
    </Box>
  );
};

export default Subject;

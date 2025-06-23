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
  Skeleton,
  SkeletonText,
  Card,
} from '@chakra-ui/react';
import { FiPlus, FiCheck } from 'react-icons/fi';
import { BsSticky } from 'react-icons/bs';
import { TbTestPipe } from 'react-icons/tb';
import CardScroller from '../../components/shared/CardScroller';
import TrendsChart from './TrendsChart';
import ForecastChart from './ForecastChart';
import RelatedDocuments from './RelatedDocuments';
import { usePage } from '../../context/PageContext';
import { useTheme } from '../../context/ThemeContext';
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
  let { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setPageContext, clearPageContext } = usePage();
  const theme = useTheme();
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

  // Get the correct background color from theme
  const appBgColor = theme.isDark ? '#111111' : '#FAFAFA';

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
          (item) => ({
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

  // Error handling
  if (error) {
    return (
      <Box position='relative' bg='bg' minHeight='calc(100vh - 64px)'>
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
      </Box>
    );
  }

  // No subject found - keep this but modify to show within page structure
  if (!loading && !subject) {
    return (
      <Box position='relative' bg='bg' minHeight='calc(100vh - 64px)'>
        <Box
          p={6}
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='400px'
        >
          <Text color='gray.500'>Subject not found</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box position='relative' bg='bg' minHeight='calc(100vh - 64px)'>
      {/* Background Network Graph - Account for navbar height */}
      <Box
        position='absolute'
        top={0}
        left={0}
        right={0}
        height='calc(100vh - 64px)'
        zIndex={0}
      >
        <NetworkGraph params={params} backgroundColor={appBgColor} />
      </Box>

      {/* Top floating cards - positioned above the network graph with better spacing */}
      <Box position='relative' zIndex={1} p={6} pointerEvents='none'>
        {/* Main Subject Card */}
        {loading ? (
          <GlassCard
            variant='glass'
            maxW='1024px'
            mb={4}
            borderWidth='1px'
            borderStyle='solid'
            borderColor='border.emphasized'
            borderRadius='8px'
            pointerEvents='auto'
          >
            <Box p={6}>
              <Flex justify='space-between' align='flex-start' mb={4}>
                <Skeleton height='32px' width='400px' mr={4} />
                <HStack gap={3}>
                  <Skeleton height='40px' width='150px' />
                  <Skeleton height='40px' width='120px' />
                </HStack>
              </Flex>
              <SkeletonText noOfLines={3} />
            </Box>
          </GlassCard>
        ) : (
          <GlassCard
            variant='glass'
            maxW='1024px'
            mb={4}
            borderWidth='1px'
            borderStyle='solid'
            borderColor='border.emphasized'
            borderRadius='8px'
            pointerEvents='auto'
          >
            <Box p={6}>
              <Flex justify='space-between' align='flex-start' mb={4}>
                <Heading as='h1' size='xl' flex='1' mr={4} color='fg'>
                  {subject?.ent_name}
                </Heading>
                <HStack gap={3} pointerEvents='auto'>
                  <Button
                    size='md'
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
                {subject?.ent_summary}
              </Text>
            </Box>
          </GlassCard>
        )}

        {/* Subject Info Cards - Skeleton loading */}
        <HStack gap={3} w='fit-content' mb={4} pointerEvents='auto'>
          {loading ? (
            // Skeleton cards
            <>
              {[1, 2, 3].map((i) => (
                <GlassCard
                  key={i}
                  variant='glass'
                  w='140px'
                  borderWidth='2px'
                  borderStyle='solid'
                  borderColor='border'
                  borderRadius='8px'
                >
                  <Box p={3} textAlign='center'>
                    <Skeleton height='16px' width='80px' mx='auto' mb={2} />
                    <Skeleton height='24px' width='40px' mx='auto' />
                  </Box>
                </GlassCard>
              ))}
            </>
          ) : (
            // Actual metric cards
            <>
              <GlassCard
                variant='glass'
                w='140px'
                borderWidth='2px'
                borderStyle='solid'
                borderColor='horizonRank'
                borderRadius='8px'
              >
                <Box p={3} textAlign='center'>
                  <Stat.Root>
                    <Stat.Label>
                      <Text
                        as='h4'
                        mb={1}
                        color='fg'
                        fontSize='xs'
                        fontWeight='medium'
                      >
                        Horizon Rank
                      </Text>
                    </Stat.Label>
                    <Stat.ValueText
                      fontSize='lg'
                      fontWeight='bold'
                      color='horizonRank'
                    >
                      {(Math.random() * 0.5 + 0.5).toFixed(2)}
                    </Stat.ValueText>
                  </Stat.Root>
                </Box>
              </GlassCard>

              <GlassCard
                variant='glass'
                w='140px'
                borderWidth='2px'
                borderStyle='solid'
                borderColor='whiteSpace'
                borderRadius='8px'
              >
                <Box p={3} textAlign='center'>
                  <Stat.Root>
                    <Stat.Label>
                      <Text
                        as='h4'
                        mb={1}
                        color='fg'
                        fontSize='xs'
                        fontWeight='medium'
                      >
                        White Space
                      </Text>
                    </Stat.Label>
                    <Stat.ValueText
                      fontSize='lg'
                      fontWeight='bold'
                      color='whiteSpace'
                    >
                      {Math.floor(Math.random() * 100)}
                    </Stat.ValueText>
                  </Stat.Root>
                </Box>
              </GlassCard>

              <GlassCard
                variant='glass'
                w='140px'
                borderWidth='2px'
                borderStyle='solid'
                borderColor='techTransfer'
                borderRadius='8px'
              >
                <Box p={3} textAlign='center'>
                  <Stat.Root>
                    <Stat.Label>
                      <Text
                        as='h4'
                        mb={1}
                        color='fg'
                        fontSize='xs'
                        fontWeight='medium'
                      >
                        Tech Transfer
                      </Text>
                    </Stat.Label>
                    <Stat.ValueText
                      fontSize='lg'
                      fontWeight='bold'
                      color='techTransfer'
                    >
                      {Math.floor(Math.random() * 100)}
                    </Stat.ValueText>
                  </Stat.Root>
                </Box>
              </GlassCard>
            </>
          )}
        </HStack>
      </Box>

      {/* Spacer to ensure content doesn't overlap - Adjust height to prevent coverage */}
      <Box height='calc(100vh - 200px)' />

      {/* Main content area - Add margin to prevent overlap */}
      <Box bg='bg' px={6} pb={6} mt={6}>
        {/* Bottom Stats Cards - Skeleton loading */}
        <Box mb={6}>
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={4}>
            {loading ? (
              // Skeleton stats cards
              <>
                {[
                  'Organizations',
                  'Press',
                  'Patents',
                  'Papers',
                  'Books',
                  'Related Docs',
                ].map((label) => (
                  <Card.Root key={label} variant='outline' size='sm'>
                    <Card.Body>
                      <Box textAlign='center'>
                        <Skeleton height='16px' width='80px' mx='auto' mb={2} />
                        <Skeleton height='24px' width='40px' mx='auto' />
                      </Box>
                    </Card.Body>
                  </Card.Root>
                ))}
              </>
            ) : (
              // Actual stats cards
              <>
                <Card.Root variant='outline' size='sm'>
                  <Card.Body>
                    <Box textAlign='center'>
                      <Stat.Root>
                        <Stat.Label>
                          <Heading as='h4' size='sm' mb={2} color='fg'>
                            Organizations
                          </Heading>
                        </Stat.Label>
                        <Stat.ValueText
                          fontSize='xl'
                          fontWeight='bold'
                          color='fg'
                        >
                          {subject?.stats.organizations.toLocaleString()}
                        </Stat.ValueText>
                      </Stat.Root>
                    </Box>
                  </Card.Body>
                </Card.Root>

                <Card.Root variant='outline' size='sm'>
                  <Card.Body>
                    <Box textAlign='center'>
                      <Stat.Root>
                        <Stat.Label>
                          <Heading as='h4' size='sm' mb={2} color='fg'>
                            Press
                          </Heading>
                        </Stat.Label>
                        <Stat.ValueText
                          fontSize='xl'
                          fontWeight='bold'
                          color='fg'
                        >
                          {subject?.stats.press.toLocaleString()}
                        </Stat.ValueText>
                      </Stat.Root>
                    </Box>
                  </Card.Body>
                </Card.Root>

                <Card.Root variant='outline' size='sm'>
                  <Card.Body>
                    <Box textAlign='center'>
                      <Stat.Root>
                        <Stat.Label>
                          <Heading as='h4' size='sm' mb={2} color='fg'>
                            Patents
                          </Heading>
                        </Stat.Label>
                        <Stat.ValueText
                          fontSize='xl'
                          fontWeight='bold'
                          color='fg'
                        >
                          {subject?.stats.patents.toLocaleString()}
                        </Stat.ValueText>
                      </Stat.Root>
                    </Box>
                  </Card.Body>
                </Card.Root>

                <Card.Root variant='outline' size='sm'>
                  <Card.Body>
                    <Box textAlign='center'>
                      <Stat.Root>
                        <Stat.Label>
                          <Heading as='h4' size='sm' mb={2} color='fg'>
                            Papers
                          </Heading>
                        </Stat.Label>
                        <Stat.ValueText
                          fontSize='xl'
                          fontWeight='bold'
                          color='fg'
                        >
                          {subject?.stats.papers.toLocaleString()}
                        </Stat.ValueText>
                      </Stat.Root>
                    </Box>
                  </Card.Body>
                </Card.Root>

                <Card.Root variant='outline' size='sm'>
                  <Card.Body>
                    <Box textAlign='center'>
                      <Stat.Root>
                        <Stat.Label>
                          <Heading as='h4' size='sm' mb={2} color='fg'>
                            Books
                          </Heading>
                        </Stat.Label>
                        <Stat.ValueText
                          fontSize='xl'
                          fontWeight='bold'
                          color='fg'
                        >
                          {subject?.stats.books.toLocaleString()}
                        </Stat.ValueText>
                      </Stat.Root>
                    </Box>
                  </Card.Body>
                </Card.Root>

                <Card.Root variant='outline' size='sm'>
                  <Card.Body>
                    <Box textAlign='center'>
                      <Stat.Root>
                        <Stat.Label>
                          <Heading as='h4' size='sm' mb={2} color='fg'>
                            Related Docs
                          </Heading>
                        </Stat.Label>
                        <Stat.ValueText
                          fontSize='xl'
                          fontWeight='bold'
                          color='fg'
                        >
                          {subject?.stats.relatedDocs.toLocaleString()}
                        </Stat.ValueText>
                      </Stat.Root>
                    </Box>
                  </Card.Body>
                </Card.Root>
              </>
            )}
          </SimpleGrid>
        </Box>

        {/* Related Subjects and Related Analyses - Add skeleton loading */}
        <HStack gap={6} mb={6} align='flex-start'>
          {/* Related Subjects Card */}
          <Card.Root
            variant='outline'
            flex='1'
            height='400px'
            borderRadius='8px'
          >
            <Card.Body>
              <VStack gap={4} align='stretch' height='100%'>
                <Heading as='h2' size='lg' flexShrink={0} color='fg'>
                  Related Subjects
                </Heading>

                {loading ? (
                  // Skeleton for Related Subjects
                  <VStack gap={4} align='stretch' height='100%'>
                    <HStack gap={4} align='center' flexShrink={0}>
                      <Skeleton height='20px' width='60px' />
                      <Skeleton height='32px' width='200px' />
                      <Skeleton height='32px' flex='1' />
                    </HStack>
                    <Box height='1px' bg='border' flexShrink={0} />
                    <Box
                      flex='1'
                      p={2}
                      border='1px solid'
                      borderColor='border.muted'
                      borderRadius='md'
                    >
                      <Flex wrap='wrap' gap={2}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Skeleton
                            key={i}
                            height='40px'
                            width='120px'
                            borderRadius='8px'
                          />
                        ))}
                      </Flex>
                    </Box>
                  </VStack>
                ) : (
                  // Actual Related Subjects content
                  <>
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
                        {getFilteredAndSortedSubjects().map(
                          (relatedSubject) => (
                            <Card.Root
                              key={relatedSubject.id}
                              variant='outline'
                              cursor='pointer'
                              _hover={{
                                bg: 'bg.subtle',
                                borderColor: 'brand.400',
                              }}
                              onClick={() =>
                                handleSubjectClick(relatedSubject.subjectSlug)
                              }
                              transition='all 0.2s'
                              borderRadius='8px'
                            >
                              <Card.Body p={3}>
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
                              </Card.Body>
                            </Card.Root>
                          )
                        )}
                      </Flex>
                    </Box>
                  </>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Related Analyses Card */}
          <Card.Root
            variant='outline'
            flex='1'
            height='400px'
            borderRadius='8px'
          >
            <Card.Body>
              <VStack gap={4} align='stretch' height='100%'>
                <Heading as='h2' size='lg' flexShrink={0} color='fg'>
                  Related Analyses
                </Heading>

                {loading ? (
                  // Skeleton for Related Analyses
                  <VStack gap={4} align='stretch' height='100%'>
                    <HStack gap={4} align='center' flexShrink={0}>
                      <Skeleton height='20px' width='60px' />
                      <Skeleton height='32px' width='150px' />
                      <Skeleton height='32px' flex='1' />
                    </HStack>
                    <Box height='1px' bg='border' flexShrink={0} />
                    <Box height='100%' overflowX='auto'>
                      <HStack gap={4} height='100%' align='stretch'>
                        {[1, 2, 3].map((i) => (
                          <Box
                            key={i}
                            minWidth='280px'
                            maxWidth='280px'
                            height='100%'
                            p={4}
                            border='1px solid'
                            borderColor='border'
                            borderRadius='8px'
                          >
                            <VStack gap={3} align='stretch' height='100%'>
                              <HStack gap={3} align='flex-start' flexShrink={0}>
                                <Skeleton
                                  width='100px'
                                  height='100px'
                                  borderRadius='md'
                                />
                                <VStack gap={2} align='stretch' flex='1'>
                                  <Skeleton height='16px' width='100%' />
                                  <Skeleton height='20px' width='60px' />
                                </VStack>
                              </HStack>
                              <SkeletonText noOfLines={3} flex='1' />
                            </VStack>
                          </Box>
                        ))}
                      </HStack>
                    </Box>
                  </VStack>
                ) : subject ? (
                  // Actual Related Analyses content
                  <>
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
                        <Card.Root
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
                          borderRadius='8px'
                        >
                          <Card.Body
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
                                        ? 'success'
                                        : 'brand.400'
                                    }
                                    color={
                                      analysis.status === 'Ready'
                                        ? 'white'
                                        : 'white'
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
                          </Card.Body>
                        </Card.Root>
                      ))}
                    </CardScroller>
                  </>
                ) : null}
              </VStack>
            </Card.Body>
          </Card.Root>
        </HStack>

        {loading ? (
          // Skeleton for TrendsChart
          <Card.Root variant='outline' width='100%' mt={6} borderRadius='8px'>
            <Card.Body p={6}>
              <VStack gap={6} align='stretch'>
                <HStack justify='space-between' align='center'>
                  <Skeleton height='24px' width='120px' />
                  <Skeleton height='20px' width='20px' borderRadius='full' />
                </HStack>
                <Skeleton height='500px' width='100%' borderRadius='md' />
              </VStack>
            </Card.Body>
          </Card.Root>
        ) : subject ? (
          <TrendsChart subjectSlug={subject.slug} />
        ) : null}

        {loading ? (
          // Skeleton for ForecastChart
          <Card.Root variant='outline' width='100%' mt={6} borderRadius='8px'>
            <Card.Body p={6}>
              <VStack gap={6} align='stretch'>
                <Skeleton height='24px' width='180px' />
                <HStack gap={2} wrap='wrap' mb={4}>
                  {['Organizations', 'Press', 'Patents', 'Papers', 'Books'].map(
                    (type) => (
                      <HStack key={type} gap={1}>
                        <Skeleton
                          height='32px'
                          width='80px'
                          borderRadius='md'
                        />
                        <Skeleton
                          height='20px'
                          width='20px'
                          borderRadius='full'
                        />
                      </HStack>
                    )
                  )}
                </HStack>
                <Skeleton height='400px' width='100%' borderRadius='md' />
                <Box>
                  <HStack justify='space-between' mb={4}>
                    <HStack gap={2}>
                      <Skeleton height='20px' width='40px' />
                      <Skeleton height='32px' width='60px' />
                      <Skeleton height='20px' width='40px' />
                    </HStack>
                    <HStack gap={2}>
                      <Skeleton height='20px' width='50px' />
                      <Skeleton height='32px' width='150px' />
                      <Skeleton height='32px' width='32px' />
                    </HStack>
                  </HStack>
                  <Skeleton height='200px' width='100%' borderRadius='md' />
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>
        ) : subject ? (
          <ForecastChart subjectSlug={subject.slug} />
        ) : null}

        {loading ? (
          // Skeleton for RelatedDocuments
          <Card.Root variant='outline' width='100%' mt={6} borderRadius='8px'>
            <Card.Body p={6}>
              <VStack gap={6} align='stretch'>
                <HStack justify='space-between' align='center'>
                  <Skeleton height='24px' width='180px' />
                  <Skeleton height='24px' width='80px' borderRadius='full' />
                </HStack>
                <Box
                  maxHeight='400px'
                  border='1px solid'
                  borderColor='gray.200'
                  borderRadius='md'
                  p={4}
                >
                  <VStack gap={3} align='stretch'>
                    {[1, 2, 3, 4].map((i) => (
                      <Box
                        key={i}
                        p={4}
                        border='1px solid'
                        borderColor='border'
                        borderRadius='md'
                      >
                        <HStack justify='space-between' align='flex-start'>
                          <HStack gap={3} flex='1'>
                            <Skeleton
                              width='40px'
                              height='40px'
                              borderRadius='md'
                            />
                            <VStack gap={1} align='flex-start' flex='1'>
                              <Skeleton height='16px' width='200px' />
                              <HStack gap={3}>
                                <Skeleton height='12px' width='40px' />
                                <Skeleton height='12px' width='30px' />
                                <Skeleton height='12px' width='60px' />
                              </HStack>
                            </VStack>
                          </HStack>
                          <HStack gap={2}>
                            <Skeleton height='32px' width='60px' />
                            <Skeleton height='32px' width='80px' />
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>
        ) : subject ? (
          <RelatedDocuments subjectSlug={subject.slug} />
        ) : null}
      </Box>
    </Box>
  );
};

export default Subject;

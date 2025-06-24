import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Menu,
  Portal,
} from '@chakra-ui/react';
import { FiPlus, FiCheck, FiChevronDown } from 'react-icons/fi';
import { BsSticky } from 'react-icons/bs';
import { TbTestPipe } from 'react-icons/tb';
import CardScroller from '../../components/shared/CardScroller';
import TrendsChart from './TrendsChart';
import ForecastChart, { type ForecastChartRef } from './ForecastChart';
import RelatedDocuments from './RelatedDocuments';
import { usePage } from '../../context/PageContext';
import { useTheme } from '../../context/ThemeContext';
import GlassCard from '../../components/shared/GlassCard';
import NetworkGraph, {
  type NetworkGraphRef,
} from './NetworkGraph/NetworkGraph';

// TypeScript interfaces
interface Lab {
  id: string;
  name: string;
  slug: string;
  teamId: string;
}

interface RelatedSubject {
  id: string;
  name: string;
  horizonRanking: number;
  subjectSlug: string;
  indexes?: Array<{
    HR?: number;
    TT?: number;
    WS?: number;
  }>;
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
  indexes?: Array<{
    HR?: number;
    TT?: number;
    WS?: number;
  }>;
}

interface ApiSubjectResponse {
  _id: string;
  ent_name: string;
  ent_fsid: string;
  ent_summary: string;
  indexes?: Array<{
    HR?: number;
    TT?: number;
    WS?: number;
  }>;
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
    indexes?: Array<{
      HR?: number;
      TT?: number;
      WS?: number;
    }>;
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

// Map stat types to their corresponding forecast types
const statTypeMapping: {
  [key: string]: 'Organizations' | 'Press' | 'Patents' | 'Papers' | 'Books';
} = {
  organizations: 'Organizations',
  press: 'Press',
  patents: 'Patents',
  papers: 'Papers',
  books: 'Books',
  // relatedDocs maps to documents section
};

// Map stat types to network graph node types for highlighting
const networkNodeTypeMapping: { [key: string]: string } = {
  organizations: 'Organization',
  press: 'Press',
  patents: 'Patent',
  papers: 'Paper',
  books: 'Book',
};

const Subject: React.FC = () => {
  let { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setPageContext, clearPageContext } = usePage();
  const theme = useTheme();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isInWhiteboard, setIsInWhiteboard] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStatType, setHoveredStatType] = useState<string | null>(null);

  // TODO: State for lab management functionality
  const [availableLabs, setAvailableLabs] = useState<Lab[]>([]);
  const [subjectInLabs, setSubjectInLabs] = useState<string[]>([]); // Lab IDs where subject exists
  const [loadingLabs, setLoadingLabs] = useState<boolean>(false);
  const [loadingWhiteboard, setLoadingWhiteboard] = useState<boolean>(false);

  // Refs for scrolling to sections and component control
  const trendsChartRef = useRef<HTMLDivElement>(null);
  const forecastChartRef = useRef<HTMLDivElement>(null);
  const relatedDocumentsRef = useRef<HTMLDivElement>(null);
  const networkGraphRef = useRef<NetworkGraphRef>(null);
  const forecastComponentRef = useRef<ForecastChartRef>(null);

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
            horizonRanking:
              getIndexValue(item.indexes, 'HR') || Math.random() * 0.5 + 0.5, // TODO: Remove fallback random value when all subjects have HR
            subjectSlug: item.ent_fsid.replace('fsid_', ''),
            indexes: item.indexes,
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
          indexes: subjectData.indexes,
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

  // TODO: Check whiteboard status when subject loads
  useEffect(() => {
    const initializeSubjectStatus = async () => {
      if (!subject) return;

      // Check if subject is in whiteboard
      const inWhiteboard = await checkWhiteboardStatus(subject._id);
      setIsInWhiteboard(inWhiteboard);

      // TODO: Get user's current team ID from auth context
      const currentTeamId = 'mock-team-id'; // Replace with actual team ID

      // Fetch available labs for the team
      const labs = await fetchAvailableLabs(currentTeamId);
      setAvailableLabs(labs);

      // Check which labs already contain this subject
      const labIds = labs.map((lab) => lab.id);
      const labsWithSubject = await checkSubjectInLabs(subject._id, labIds);
      setSubjectInLabs(labsWithSubject);
    };

    initializeSubjectStatus();
  }, [subject]);

  // Helper functions to get index values
  const getIndexValue = (
    indexes: Array<{ HR?: number; TT?: number; WS?: number }> | undefined,
    key: 'HR' | 'TT' | 'WS'
  ): number | null => {
    if (!indexes || indexes.length === 0) return null;
    const value = indexes[0][key];
    return value !== undefined ? value : null;
  };

  const formatIndexValue = (value: number | null): string => {
    if (value === null) return 'N/A';
    return value.toFixed(1);
  };

  const params = { subject: slug };

  // TODO: API Functions - Replace with actual endpoints when available
  const checkWhiteboardStatus = async (subjectId: string): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/whiteboard/check/${subjectId}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();
      // return data.isInWhiteboard;

      // Mock implementation - always returns false for now
      console.log(
        'TODO: Implement checkWhiteboardStatus API call for subject:',
        subjectId
      );
      return false;
    } catch (error) {
      console.error('Error checking whiteboard status:', error);
      return false;
    }
  };

  const addToWhiteboard = async (subjectId: string): Promise<boolean> => {
    try {
      setLoadingWhiteboard(true);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/whiteboard/add`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ subjectId })
      // });
      // const data = await response.json();
      // return data.success;

      // Mock implementation - always succeeds after delay
      console.log(
        'TODO: Implement addToWhiteboard API call for subject:',
        subjectId
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
      return true;
    } catch (error) {
      console.error('Error adding to whiteboard:', error);
      return false;
    } finally {
      setLoadingWhiteboard(false);
    }
  };

  const fetchAvailableLabs = async (teamId: string): Promise<Lab[]> => {
    try {
      setLoadingLabs(true);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/teams/${teamId}/labs`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();
      // return data.labs;

      // Mock implementation - returns some sample labs
      console.log(
        'TODO: Implement fetchAvailableLabs API call for team:',
        teamId
      );
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
      return [
        { id: '1', name: 'Research Lab Alpha', slug: 'research-alpha', teamId },
        {
          id: '2',
          name: 'Innovation Lab Beta',
          slug: 'innovation-beta',
          teamId,
        },
        { id: '3', name: 'Analysis Lab Gamma', slug: 'analysis-gamma', teamId },
      ];
    } catch (error) {
      console.error('Error fetching available labs:', error);
      return [];
    } finally {
      setLoadingLabs(false);
    }
  };

  const checkSubjectInLabs = async (
    subjectId: string,
    labIds: string[]
  ): Promise<string[]> => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/labs/check-subject`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ subjectId, labIds })
      // });
      // const data = await response.json();
      // return data.labsContainingSubject; // Array of lab IDs

      // Mock implementation - randomly returns some labs
      console.log(
        'TODO: Implement checkSubjectInLabs API call for subject:',
        subjectId,
        'labs:',
        labIds
      );
      const randomLabs = labIds.filter(() => Math.random() > 0.7); // 30% chance each lab contains the subject
      return randomLabs;
    } catch (error) {
      console.error('Error checking subject in labs:', error);
      return [];
    }
  };

  const addSubjectToLab = async (
    subjectId: string,
    labId: string
  ): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/labs/${labId}/subjects`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`
      //   },
      //   body: JSON.stringify({ subjectId })
      // });
      // const data = await response.json();
      // return data.success;

      // Mock implementation - always succeeds after delay
      console.log(
        'TODO: Implement addSubjectToLab API call for subject:',
        subjectId,
        'lab:',
        labId
      );
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay
      return true;
    } catch (error) {
      console.error('Error adding subject to lab:', error);
      return false;
    }
  };

  const handleAddToWhiteboard = async (): Promise<void> => {
    if (!subject || isInWhiteboard || loadingWhiteboard) return;

    const success = await addToWhiteboard(subject._id);
    if (success) {
      setIsInWhiteboard(true);
    } else {
      // TODO: Show error toast/notification
      console.error('Failed to add subject to whiteboard');
    }
  };

  const handleAddToLab = async (labId: string): Promise<void> => {
    if (!subject) return;

    const success = await addSubjectToLab(subject._id, labId);
    if (success) {
      // Update the state to reflect that subject is now in this lab
      setSubjectInLabs((prev) => [...prev, labId]);
      // TODO: Show success toast/notification
      console.log('Successfully added subject to lab:', labId);
    } else {
      // TODO: Show error toast/notification
      console.error('Failed to add subject to lab:', labId);
    }
  };

  const handleSubjectClick = (targetSlug: string): void => {
    navigate(`/subject/${targetSlug}`);
  };

  const handleAnalysisClick = (labId: string, analysisId: string): void => {
    navigate(`/lab/${labId}/analysis/${analysisId}`);
  };

  // Handle stat card interactions
  const handleStatCardHover = (statType: string | null) => {
    setHoveredStatType(statType);

    // Highlight nodes in network graph if there's a corresponding node type
    if (
      statType &&
      networkNodeTypeMapping[statType] &&
      networkGraphRef.current
    ) {
      networkGraphRef.current.highlightNodesByType(
        networkNodeTypeMapping[statType]
      );
    } else if (networkGraphRef.current) {
      networkGraphRef.current.highlightNodesByType(null);
    }
  };

  const handleStatCardClick = (statType: string) => {
    if (statType === 'relatedDocs') {
      // Scroll to related documents section
      relatedDocumentsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      // Scroll to forecast section and switch to the correct tab
      forecastChartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      // Trigger tab change in ForecastChart component
      const forecastType = statTypeMapping[statType];
      if (forecastType && forecastComponentRef.current) {
        // Small delay to ensure scroll completes before switching tab
        setTimeout(() => {
          forecastComponentRef.current?.setSelectedType(forecastType);
        }, 500);
      }
    }

    // Also pulse the corresponding nodes in the network graph
    if (
      statType &&
      networkNodeTypeMapping[statType] &&
      networkGraphRef.current
    ) {
      networkGraphRef.current.pulseNodesByType(
        networkNodeTypeMapping[statType]
      );
    }
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
      {/* Background Network Graph - Make it shorter to show stat cards */}
      <Box
        pt={40}
        position='relative'
        height='calc(90vh - 64px)' // Reduced from 100vh to 70vh
        zIndex={0}
      >
        <NetworkGraph
          ref={networkGraphRef}
          params={params}
          backgroundColor={appBgColor}
          hoveredNodeType={
            hoveredStatType
              ? networkNodeTypeMapping[hoveredStatType]
              : undefined
          }
        />
      </Box>

      {/* Top floating cards - positioned above the network graph with better spacing */}
      <Box
        position='absolute'
        top={0}
        left={0}
        right={0}
        zIndex={1}
        p={6}
        pointerEvents='none'
      >
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
                    variant={'outline'}
                    disabled={isInWhiteboard || loadingWhiteboard}
                    onClick={handleAddToWhiteboard}
                    loading={loadingWhiteboard}
                  >
                    {isInWhiteboard ? (
                      <FiCheck size={16} />
                    ) : (
                      <FiPlus size={16} />
                    )}
                    <BsSticky size={16} />
                    {isInWhiteboard ? 'in Whiteboard' : 'add to whiteboard'}
                  </Button>

                  {/* Add to Lab Menu */}
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <Button
                        size='md'
                        variant='outline'
                        disabled={loadingLabs || availableLabs.length === 0}
                        loading={loadingLabs}
                      >
                        <FiPlus size={16} />
                        <TbTestPipe size={16} />
                        add to lab
                        <FiChevronDown size={14} />
                      </Button>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content
                          bg='bg.canvas'
                          borderColor='border.emphasized'
                          borderWidth='1px'
                          borderRadius='8px'
                          minW='220px'
                        >
                          <Menu.ItemGroup>
                            <Box p={2}>
                              <Text
                                fontSize='sm'
                                fontWeight='medium'
                                color='fg.secondary'
                                mb={2}
                              >
                                Available Labs:
                              </Text>
                            </Box>
                          </Menu.ItemGroup>

                          {availableLabs.length > 0 ? (
                            availableLabs.map((lab) => {
                              const isSubjectInLab = subjectInLabs.includes(
                                lab.id
                              );
                              return (
                                <Menu.Item
                                  key={lab.id}
                                  value={lab.id}
                                  disabled={isSubjectInLab}
                                  onClick={() =>
                                    !isSubjectInLab && handleAddToLab(lab.id)
                                  }
                                  color={isSubjectInLab ? 'fg.muted' : 'fg'}
                                  fontFamily='body'
                                  fontSize='sm'
                                  _hover={{
                                    bg: isSubjectInLab
                                      ? 'transparent'
                                      : 'bg.hover',
                                  }}
                                >
                                  <HStack justify='space-between' width='100%'>
                                    <Text>{lab.name}</Text>
                                    {isSubjectInLab && (
                                      <Text fontSize='xs' color='fg.muted'>
                                        (already added)
                                      </Text>
                                    )}
                                  </HStack>
                                </Menu.Item>
                              );
                            })
                          ) : (
                            <Menu.Item
                              value='no-labs'
                              disabled
                              color='fg.muted'
                              fontSize='sm'
                            >
                              No labs available
                            </Menu.Item>
                          )}
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
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
                      color={
                        getIndexValue(subject?.indexes, 'HR') !== null
                          ? 'horizonRank'
                          : 'fg.muted'
                      }
                    >
                      {formatIndexValue(getIndexValue(subject?.indexes, 'HR'))}
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
                      color={
                        getIndexValue(subject?.indexes, 'WS') !== null
                          ? 'whiteSpace'
                          : 'fg.muted'
                      }
                    >
                      {formatIndexValue(getIndexValue(subject?.indexes, 'WS'))}
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
                      color={
                        getIndexValue(subject?.indexes, 'TT') !== null
                          ? 'techTransfer'
                          : 'fg.muted'
                      }
                    >
                      {formatIndexValue(getIndexValue(subject?.indexes, 'TT'))}
                    </Stat.ValueText>
                  </Stat.Root>
                </Box>
              </GlassCard>
            </>
          )}
        </HStack>
      </Box>

      {/* Main content area - Position independent of floating cards */}
      <Box bg='bg' px={6} pb={6}>
        {/* Interactive Stats Cards - Fixed position */}
        <Box mb={6} minHeight='120px'>
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={4}>
            {loading ? (
              // Skeleton stats cards with consistent sizing
              <>
                {[
                  'Organizations',
                  'Press',
                  'Patents',
                  'Papers',
                  'Books',
                  'Related Docs',
                ].map((label) => (
                  <Card.Root
                    key={label}
                    variant='outline'
                    size='sm'
                    minHeight='80px'
                  >
                    <Card.Body
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                    >
                      <Box textAlign='center' width='100%'>
                        <Skeleton height='16px' width='80px' mx='auto' mb={2} />
                        <Skeleton height='24px' width='40px' mx='auto' />
                      </Box>
                    </Card.Body>
                  </Card.Root>
                ))}
              </>
            ) : (
              // Actual interactive stats cards with consistent sizing
              <>
                {[
                  {
                    key: 'organizations',
                    label: 'Organizations',
                    value: subject?.stats.organizations,
                  },
                  { key: 'press', label: 'Press', value: subject?.stats.press },
                  {
                    key: 'patents',
                    label: 'Patents',
                    value: subject?.stats.patents,
                  },
                  {
                    key: 'papers',
                    label: 'Papers',
                    value: subject?.stats.papers,
                  },
                  { key: 'books', label: 'Books', value: subject?.stats.books },
                  {
                    key: 'relatedDocs',
                    label: 'Related Docs',
                    value: subject?.stats.relatedDocs,
                  },
                ].map(({ key, label, value }) => (
                  <Card.Root
                    key={key}
                    variant='outline'
                    size='sm'
                    minHeight='80px'
                    cursor='pointer'
                    transition='all 0.2s ease'
                    bg={hoveredStatType === key ? 'fg' : 'bg.canvas'}
                    color={hoveredStatType === key ? 'bg.canvas' : 'fg'}
                    transform={
                      hoveredStatType === key ? 'translateY(-2px)' : 'none'
                    }
                    boxShadow={hoveredStatType === key ? 'lg' : 'none'}
                    onMouseEnter={() => handleStatCardHover(key)}
                    onMouseLeave={() => handleStatCardHover(null)}
                    onClick={() => handleStatCardClick(key)}
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                  >
                    <Card.Body
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                    >
                      <Box textAlign='center' width='100%'>
                        <Stat.Root>
                          <Stat.Label>
                            <Heading
                              as='h4'
                              size='sm'
                              mb={2}
                              color='inherit'
                              transition='color 0.2s ease'
                            >
                              {label}
                            </Heading>
                          </Stat.Label>
                          <Stat.ValueText
                            fontSize='xl'
                            fontWeight='bold'
                            color='inherit'
                            transition='color 0.2s ease'
                          >
                            {value?.toLocaleString()}
                          </Stat.ValueText>
                        </Stat.Root>
                      </Box>
                    </Card.Body>
                  </Card.Root>
                ))}
              </>
            )}
          </SimpleGrid>
        </Box>

        {/* Trends Chart */}
        <div ref={trendsChartRef}>
          {loading ? (
            // Skeleton for TrendsChart
            <Card.Root
              variant='outline'
              width='100%'
              mt={6}
              borderRadius='8px'
              bg='bg.canvas'
            >
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
        </div>

        {/* Forecast Chart */}
        <div ref={forecastChartRef}>
          {loading ? (
            // Skeleton for ForecastChart
            <Card.Root
              variant='outline'
              width='100%'
              mt={6}
              borderRadius='8px'
              bg='bg.canvas'
            >
              <Card.Body p={6}>
                <VStack gap={6} align='stretch'>
                  <Skeleton height='24px' width='180px' />
                  <HStack gap={2} wrap='wrap' mb={4}>
                    {[
                      'Organizations',
                      'Press',
                      'Patents',
                      'Papers',
                      'Books',
                    ].map((type) => (
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
                    ))}
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
            <ForecastChart
              ref={forecastComponentRef}
              subjectSlug={subject.slug}
            />
          ) : null}
        </div>

        {/* Related Subjects and Related Analyses - MOVED HERE with added margin */}
        <HStack gap={6} my={6} align='flex-start' height='400px'>
          {/* Related Subjects Card */}
          <Card.Root
            variant='outline'
            flex='1'
            height='100%'
            borderRadius='8px'
            bg='bg.canvas' // Ensure proper background in dark mode
          >
            <Card.Body height='100%'>
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
                ) : getFilteredAndSortedSubjects().length > 0 ? (
                  // Actual Related Subjects content with data
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
                            backgroundColor: theme.isDark
                              ? '#1a1a1a'
                              : '#FFFFFF',
                            color: theme.isDark ? '#FFFFFF' : '#1B1B1D',
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
                        bg='bg.canvas'
                        color='fg'
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
                      bg='bg'
                      maxHeight='280px' // Set a max height to ensure scrolling
                    >
                      <Flex wrap='wrap' gap={2} maxHeight='100%'>
                        {getFilteredAndSortedSubjects().map(
                          (relatedSubject) => (
                            <Card.Root
                              key={relatedSubject.id}
                              variant='outline'
                              cursor='pointer'
                              bg='bg.canvas'
                              _hover={{
                                bg: 'bg.hover',
                                borderColor: 'brand.400',
                              }}
                              onClick={() =>
                                handleSubjectClick(relatedSubject.subjectSlug)
                              }
                              transition='all 0.2s'
                              borderRadius='8px'
                              minWidth='200px' // Ensure minimum width for cards
                              flexShrink={0} // Prevent cards from shrinking too much
                            >
                              <Card.Body p={3}>
                                <HStack gap={2} justify='space-between'>
                                  <Text
                                    fontSize='sm'
                                    fontWeight='medium'
                                    color='brand.400'
                                    flex='1'
                                    lineClamp={2} // Use lineClamp instead of noOfLines
                                  >
                                    {relatedSubject.name}
                                  </Text>
                                  <VStack
                                    gap={1}
                                    align='flex-end'
                                    flexShrink={0}
                                  >
                                    <Box
                                      bg='brand'
                                      color='brand.contrast'
                                      fontSize='xs'
                                      px={2}
                                      py={1}
                                      borderRadius='md'
                                      fontWeight='medium'
                                      whiteSpace='nowrap'
                                    >
                                      HR:{' '}
                                      {formatIndexValue(
                                        getIndexValue(
                                          relatedSubject.indexes,
                                          'HR'
                                        )
                                      )}
                                    </Box>
                                  </VStack>
                                </HStack>
                              </Card.Body>
                            </Card.Root>
                          )
                        )}
                      </Flex>
                    </Box>
                  </>
                ) : (
                  // Empty state for Related Subjects
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
                            backgroundColor: theme.isDark
                              ? '#1a1a1a'
                              : '#FFFFFF',
                            color: theme.isDark ? '#FFFFFF' : '#1B1B1D',
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
                        bg='bg.canvas'
                        color='fg'
                      />
                    </HStack>

                    <Box height='1px' bg='border' flexShrink={0} />

                    <Box
                      flex='1'
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                      p={2}
                      border='1px solid'
                      borderColor='border.muted'
                      borderRadius='md'
                      bg='bg'
                      maxHeight='280px' // Same max height as the scrollable version
                    >
                      <Text color='fg.muted'>No related subjects found</Text>
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
            height='100%'
            borderRadius='8px'
            bg='bg.canvas' // Ensure proper background in dark mode
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
                            backgroundColor: theme.isDark
                              ? '#1a1a1a'
                              : '#FFFFFF',
                            color: theme.isDark ? '#FFFFFF' : '#1B1B1D',
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
                        bg='bg.canvas'
                        color='fg'
                      />
                    </HStack>

                    <Box height='1px' bg='border' flexShrink={0} />

                    <CardScroller height='100%'>
                      {getFilteredAndSortedAnalyses().length > 0 ? (
                        getFilteredAndSortedAnalyses().map((analysis) => (
                          <Card.Root
                            key={analysis._id}
                            variant='outline'
                            minWidth='280px'
                            maxWidth='280px'
                            height='100%'
                            cursor='pointer'
                            _hover={{
                              bg: 'bg.subtle',
                              borderColor: 'brand.400',
                            }}
                            onClick={() =>
                              handleAnalysisClick(analysis.lab_id, analysis._id)
                            }
                            transition='all 0.2s'
                            borderRadius='8px'
                            bg='bg.canvas' // Ensure proper background
                          >
                            <Card.Body
                              p={4}
                              height='100%'
                              display='flex'
                              flexDirection='column'
                            >
                              <VStack gap={3} align='stretch' height='100%'>
                                <HStack
                                  gap={3}
                                  align='flex-start'
                                  flexShrink={0}
                                >
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
                        ))
                      ) : (
                        // Empty state for Related Analyses
                        <Box
                          minWidth='280px'
                          height='100%'
                          display='flex'
                          alignItems='center'
                          justifyContent='center'
                          bg='bg.canvas'
                          border='1px solid'
                          borderColor='border.muted'
                          borderRadius='8px'
                        >
                          <Text color='fg.muted'>
                            No related analyses found
                          </Text>
                        </Box>
                      )}
                    </CardScroller>
                  </>
                ) : null}
              </VStack>
            </Card.Body>
          </Card.Root>
        </HStack>

        {/* Related Documents */}
        <div ref={relatedDocumentsRef}>
          {loading ? (
            // Skeleton for RelatedDocuments
            <Card.Root
              variant='outline'
              width='100%'
              mt={6}
              borderRadius='8px'
              bg='bg.canvas'
            >
              <Card.Body p={6}>
                <VStack gap={6} align='stretch'>
                  <HStack justify='space-between' align='center'>
                    <Skeleton height='24px' width='180px' />
                    <Skeleton height='24px' width='80px' borderRadius='full' />
                  </HStack>
                  <Box
                    maxHeight='400px'
                    border='1px solid'
                    borderColor='border.muted'
                    borderRadius='md'
                    p={4}
                    bg='bg'
                  >
                    <VStack gap={3} align='stretch'>
                      {[1, 2, 3, 4].map((i) => (
                        <Box
                          key={i}
                          p={4}
                          border='1px solid'
                          borderColor='border'
                          borderRadius='md'
                          bg='bg.canvas'
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
        </div>
      </Box>
    </Box>
  );
};

export default Subject;

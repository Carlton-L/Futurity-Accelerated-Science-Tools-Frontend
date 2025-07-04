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
  Spinner,
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
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../../components/shared/GlassCard';
import NetworkGraph, {
  type NetworkGraphRef,
} from './NetworkGraph/NetworkGraph';
import {
  subjectService,
  type SubjectData,
  type SubjectStatsResponse,
} from '../../services/subjectService';

// TypeScript interfaces
interface SubjectConfig {
  subject_name: string;
  subject_fsid: string;
  subcategory_name: string;
  subcategory_fsid: string;
}

interface TeamLab {
  _id: string;
  uniqueID: string;
  ent_name: string;
  ent_fsid: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  kbid?: string;
  miro_board_url?: string;
  ent_summary?: string;
  picture_url?: string;
  thumbnail_url?: string;
  subjects_config: SubjectConfig[];
  subjects: unknown[];
  subcategories: unknown[];
  metadata?: Record<string, unknown>;
  exclude_terms?: string[];
  include_terms?: string[];
  goals?: unknown[];
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

interface Subject {
  _id: string;
  ent_name: string;
  ent_fsid: string;
  ent_summary: string;
  slug: string;
  category?: string;
  inventor?: string;
  stats: {
    organizations: number;
    press: number;
    patents: number;
    papers: number;
    books: number;
    relatedDocs: number;
  };
  relatedSubjects: RelatedSubject[];
  relatedAnalyses: RelatedAnalysis[];
  indexes?: Array<{
    HR?: number;
    TT?: number;
    WS?: number;
  }>;
}

// FIXME: These interfaces and API calls need to be updated to use the new management API
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

// Lab status tracking interface
interface LabStatus {
  labId: string;
  isChecking: boolean;
  containsSubject: boolean;
  isAdding: boolean;
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
  const { whiteboardId, currentTeamLabs, currentTeam, token } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [isInWhiteboard, setIsInWhiteboard] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStatType, setHoveredStatType] = useState<string | null>(null);

  // Lab management state - now tracks individual lab statuses
  const [labStatuses, setLabStatuses] = useState<Map<string, LabStatus>>(
    new Map()
  );
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

  // Helper function to get lab status
  const getLabStatus = (labId: string): LabStatus => {
    return (
      labStatuses.get(labId) || {
        labId,
        isChecking: false,
        containsSubject: false,
        isAdding: false,
      }
    );
  };

  // Helper function to update lab status
  const updateLabStatus = (labId: string, updates: Partial<LabStatus>) => {
    setLabStatuses((prev) => {
      const newMap = new Map(prev);
      const currentStatus = newMap.get(labId) || {
        labId,
        isChecking: false,
        containsSubject: false,
        isAdding: false,
      };
      newMap.set(labId, { ...currentStatus, ...updates });
      return newMap;
    });
  };

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

  // Set up page context when subject data is loaded or tab changes
  useEffect(() => {
    if (subjectPageContext) {
      setPageContext(subjectPageContext);
    }

    return () => clearPageContext();
  }, [setPageContext, clearPageContext, subjectPageContext]);

  // Fetch subject data from new API
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
        // Create fsid from slug
        const subjectFsid = subjectService.createFsidFromSlug(slug);

        // Fetch main subject data from new API
        const subjectData: SubjectData = await subjectService.getSubjectData(
          subjectFsid
        );

        // Fetch stats data (with fallback to legacy API)
        const statsData: SubjectStatsResponse =
          await subjectService.getSubjectStats(subjectFsid);

        // FIXME: These still use the legacy API - need to be updated to use new management API
        const headers = {
          Authorization: 'Bearer xE8C9T4QGRcbnUoZPrjkyI5mOVjKJAiJ',
          'Content-Type': 'application/json',
        };

        // Fetch related subjects and analyses (still using legacy API for now)
        const [relatedSubjectsResponse, relatedAnalysesResponse] =
          await Promise.all([
            fetch(
              `https://tools.futurity.science/api/subject/related-snapshots?slug=${slug}`,
              { headers }
            ),
            fetch(
              `https://tools.futurity.science/api/subject/related-analyses?slug=${slug}`,
              { headers }
            ),
          ]);

        // Check if responses are ok
        if (!relatedSubjectsResponse.ok || !relatedAnalysesResponse.ok) {
          throw new Error('Failed to fetch related data');
        }

        // Parse related data responses
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
              subjectService.getIndexValue(item.indexes, 'HR') ||
              Math.random() * 0.5 + 0.5, // TODO: Remove fallback random value when all subjects have HR
            subjectSlug: subjectService.createSlugFromFsid(item.ent_fsid),
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

        // Get formatted stats
        const formattedStats = subjectService.getFormattedStats(statsData);

        // Combine all data into subject object
        const combinedSubject: Subject = {
          _id: subjectData._id,
          ent_name: subjectData.ent_name,
          ent_fsid: subjectData.ent_fsid,
          ent_summary: subjectData.ent_summary,
          slug: slug,
          category: subjectService.shouldDisplayCategory(subjectData.category)
            ? subjectData.category
            : undefined,
          inventor: subjectService.getInventorDisplay(subjectData.inventor),
          indexes: subjectData.indexes,
          stats: {
            organizations: formattedStats.organizations.raw,
            press: formattedStats.press.raw,
            patents: formattedStats.patents.raw,
            papers: formattedStats.papers.raw,
            books: formattedStats.books.raw,
            relatedDocs: 0, // FIXME: Get this from API when available
          },
          relatedSubjects,
          relatedAnalyses,
        };

        setSubject(combinedSubject);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load subject data'
        );
        setLoading(false);
      }
    };

    fetchSubjectData();
  }, [slug]);

  // Check whiteboard status when subject loads
  useEffect(() => {
    const initializeSubjectStatus = async () => {
      if (!subject || !whiteboardId) return;

      try {
        setLoadingWhiteboard(true);

        // Check if subject is in whiteboard using new API
        const inWhiteboard = await subjectService.isSubjectInWhiteboard(
          whiteboardId,
          subject.ent_fsid
        );
        setIsInWhiteboard(inWhiteboard);
      } catch (error) {
        setIsInWhiteboard(false);
      } finally {
        setLoadingWhiteboard(false);
      }
    };

    initializeSubjectStatus();
  }, [subject, whiteboardId]);

  // Initialize lab statuses and check labs individually
  useEffect(() => {
    const initializeLabStatuses = async () => {
      if (!subject || !currentTeamLabs.length || !token) {
        setLabStatuses(new Map());
        return;
      }

      // Initialize all labs with checking state
      const initialStatuses = new Map<string, LabStatus>();
      currentTeamLabs.forEach((lab) => {
        initialStatuses.set(lab.uniqueID, {
          labId: lab.uniqueID,
          isChecking: true,
          containsSubject: false,
          isAdding: false,
        });
      });
      setLabStatuses(initialStatuses);

      // Check each lab individually and update status as we get results
      const checkPromises = currentTeamLabs.map(async (lab) => {
        try {
          // Helper function to extract subjects config from various locations
          const getSubjectsConfig = (lab: any): any[] => {
            // Method 1: Check root level subjects_config
            if (lab.subjects_config && Array.isArray(lab.subjects_config)) {
              return lab.subjects_config;
            }

            // Method 2: Check metadata.subjects_config
            if (
              lab.metadata?.subjects_config &&
              Array.isArray(lab.metadata.subjects_config)
            ) {
              return lab.metadata.subjects_config;
            }

            // Method 3: Check root level subjects
            if (lab.subjects && Array.isArray(lab.subjects)) {
              return lab.subjects;
            }

            // Method 4: Check metadata.subjects
            if (
              lab.metadata?.subjects &&
              Array.isArray(lab.metadata.subjects)
            ) {
              return lab.metadata.subjects;
            }

            return [];
          };

          const subjectsConfig = getSubjectsConfig(lab);
          let containsSubject = false;

          if (subjectsConfig.length > 0) {
            containsSubject = subjectsConfig.some((subjectConfig) => {
              // Extract fsid from various possible structures
              let subjectFsid = '';

              if (typeof subjectConfig === 'string') {
                subjectFsid = subjectConfig;
              } else if (subjectConfig.subject_fsid) {
                subjectFsid = subjectConfig.subject_fsid;
              } else if (subjectConfig.ent_fsid) {
                subjectFsid = subjectConfig.ent_fsid;
              } else if (subjectConfig.fsid) {
                subjectFsid = subjectConfig.fsid;
              }

              return subjectFsid === subject.ent_fsid;
            });
          }

          // Update this specific lab's status
          updateLabStatus(lab.uniqueID, {
            isChecking: false,
            containsSubject,
          });
        } catch (error) {
          // On error, mark as not checking and not containing subject
          updateLabStatus(lab.uniqueID, {
            isChecking: false,
            containsSubject: false,
          });
        }
      });

      // Wait for all checks to complete (optional - the UI updates as each completes)
      await Promise.allSettled(checkPromises);
    };

    initializeLabStatuses();
  }, [subject, currentTeamLabs, token]);

  // Helper functions to get index values
  const getIndexValue = (
    indexes: Array<{ HR?: number; TT?: number; WS?: number }> | undefined,
    key: 'HR' | 'TT' | 'WS'
  ): number | null => {
    return subjectService.getIndexValue(indexes, key);
  };

  const formatIndexValue = (value: number | null): string => {
    return subjectService.formatIndexValue(value);
  };

  const params = { subject: slug };

  // Add subject to lab function - using real API
  const addSubjectToLab = async (labUniqueId: string): Promise<boolean> => {
    if (!subject || !token) return false;

    try {
      updateLabStatus(labUniqueId, { isAdding: true });

      // TODO: Implement actual API call when lab subject management endpoints are available
      // For now, simulate the API call
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay

      updateLabStatus(labUniqueId, {
        isAdding: false,
        containsSubject: true,
      });

      return true;
    } catch (error) {
      updateLabStatus(labUniqueId, { isAdding: false });
      return false;
    }
  };

  const handleAddToWhiteboard = async (): Promise<void> => {
    if (!subject || !whiteboardId || isInWhiteboard || loadingWhiteboard)
      return;

    setLoadingWhiteboard(true);
    try {
      const result = await subjectService.addToWhiteboard(
        whiteboardId,
        subject.ent_fsid
      );
      if (result && result.success !== false) {
        setIsInWhiteboard(true);
      }
    } catch (error) {
      // Error handling without console.error
    } finally {
      setLoadingWhiteboard(false);
    }
  };

  const handleAddToLab = async (labUniqueId: string): Promise<void> => {
    if (!subject) return;

    const labStatus = getLabStatus(labUniqueId);
    if (labStatus.isAdding || labStatus.containsSubject) return;

    await addSubjectToLab(labUniqueId);
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

  // Determine if the lab dropdown should show loading state
  const isLabDropdownLoading = () => {
    return currentTeamLabs.some((lab) => getLabStatus(lab.uniqueID).isChecking);
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
              {/* Category and Inventor section skeleton */}
              <HStack gap={4} mt={4}>
                <Skeleton height='20px' width='100px' />
                <Skeleton height='20px' width='120px' />
              </HStack>
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
                    color='fg'
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
                        disabled={!currentTeam || currentTeamLabs.length === 0}
                        color='fg'
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
                                {currentTeam
                                  ? `${currentTeam.ent_name} Labs:`
                                  : 'Available Labs:'}
                              </Text>
                            </Box>
                          </Menu.ItemGroup>

                          {currentTeamLabs.length > 0 ? (
                            currentTeamLabs.map((lab) => {
                              const labStatus = getLabStatus(lab.uniqueID);

                              return (
                                <Menu.Item
                                  key={lab.uniqueID}
                                  value={lab.uniqueID}
                                  disabled={
                                    labStatus.containsSubject ||
                                    labStatus.isAdding ||
                                    labStatus.isChecking
                                  }
                                  onClick={() =>
                                    !labStatus.containsSubject &&
                                    !labStatus.isAdding &&
                                    !labStatus.isChecking &&
                                    handleAddToLab(lab.uniqueID)
                                  }
                                  color={
                                    labStatus.containsSubject ||
                                    labStatus.isAdding ||
                                    labStatus.isChecking
                                      ? 'fg.muted'
                                      : 'fg'
                                  }
                                  fontFamily='body'
                                  fontSize='sm'
                                  _hover={{
                                    bg:
                                      labStatus.containsSubject ||
                                      labStatus.isAdding ||
                                      labStatus.isChecking
                                        ? 'transparent'
                                        : 'bg.hover',
                                  }}
                                >
                                  <HStack justify='space-between' width='100%'>
                                    <Text>{lab.ent_name}</Text>
                                    {labStatus.isChecking && (
                                      <Spinner size='xs' />
                                    )}
                                    {labStatus.isAdding &&
                                      !labStatus.isChecking && (
                                        <Text fontSize='xs' color='fg.muted'>
                                          (adding...)
                                        </Text>
                                      )}
                                    {labStatus.containsSubject &&
                                      !labStatus.isAdding &&
                                      !labStatus.isChecking && (
                                        <Text fontSize='xs' color='success'>
                                          ✓ added
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
                              {currentTeam
                                ? 'No labs available in this team'
                                : 'No team selected'}
                            </Menu.Item>
                          )}
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                </HStack>
              </Flex>
              <Text color='fg.muted' lineHeight='1.6' mb={4}>
                {subject?.ent_summary}
              </Text>

              {/* Category and Inventor Information */}
              <HStack gap={4} fontSize='sm' color='fg.secondary'>
                {subject?.inventor && (
                  <Text>
                    <Text as='span' fontWeight='medium'>
                      Inventor:
                    </Text>{' '}
                    {subject.inventor}
                  </Text>
                )}
                {subject?.category && (
                  <Text>
                    <Text as='span' fontWeight='medium'>
                      Category:
                    </Text>{' '}
                    {subject.category}
                  </Text>
                )}
              </HStack>
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
            <TrendsChart subjectSlug={subject.ent_fsid} />
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

        {/* Related Subjects and Related Analyses */}
        <HStack gap={6} my={6} align='flex-start' height='400px'>
          {/* Related Subjects Card */}
          <Card.Root
            variant='outline'
            flex='1'
            height='100%'
            borderRadius='8px'
            bg='bg.canvas'
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
                      maxHeight='280px'
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
                              minWidth='200px'
                              flexShrink={0}
                            >
                              <Card.Body p={3}>
                                <HStack gap={2} justify='space-between'>
                                  <Text
                                    fontSize='sm'
                                    fontWeight='medium'
                                    color='fg'
                                    flex='1'
                                    lineClamp={2}
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
                      maxHeight='280px'
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
            bg='bg.canvas'
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
                            bg='bg.canvas'
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

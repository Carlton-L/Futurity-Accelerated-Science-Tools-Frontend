import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Badge,
  Grid,
  Flex,
  IconButton,
  Menu,
  Dialog,
  Textarea,
  Field,
  Spinner,
  Separator,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/react';
import {
  FiPlus,
  FiMoreHorizontal,
  FiZap,
  FiEdit,
  FiTrash2,
  FiTarget,
  FiX,
  FiSearch,
} from 'react-icons/fi';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toaster } from '../../components/ui/toaster';

// Import types and services
import type {
  WhiteboardData,
  WhiteboardSubject,
  WhiteboardLabSeed,
  SubjectSearchResult,
} from './types';
import { filterSubjects, sortSubjects } from './types';
import { whiteboardService } from '../../services/whiteboardService';
import { useAuth } from '../../context/AuthContext';
import { usePage } from '../../context/PageContext';

// Import components
import WhiteboardSubjectCard from './SubjectCard';
import SubjectSearch from './SubjectSearch';

// Define the WhiteboardLabSeed interface for navigation
interface WhiteboardLabSeedForNavigation {
  id: string;
  name: string;
  description: string;
  subjects: Array<{
    id: string;
    name: string;
    slug: string;
    summary?: string;
    category?: string;
  }>;
  includeTerms: string[];
  excludeTerms: string[];
  createdAt: string;
  isActive: boolean;
}

// Toast for notifications - using custom toaster

// Subject search function with correct endpoint and response format
const performSubjectSearch = async (
  query: string,
  token: string
): Promise<SubjectSearchResult[]> => {
  try {
    const response = await fetch(
      `https://tools.futurity.science/api/search/subjects?keyword=${encodeURIComponent(
        query
      )}&limit=10`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform the API response to match our SubjectSearchResult interface
    const results: SubjectSearchResult[] = [];

    // Add exact match if it exists
    if (data.results?.exact_match) {
      results.push({
        _id: data.results.exact_match._id?.$oid || data.results.exact_match._id,
        ent_fsid: data.results.exact_match.ent_fsid,
        ent_name: data.results.exact_match.ent_name,
        ent_summary: data.results.exact_match.ent_summary,
      });
    }

    // Add other results
    if (data.results?.rows) {
      data.results.rows.forEach(
        (row: {
          _id: string | { $oid: string };
          ent_fsid: string;
          ent_name: string;
          ent_summary: string;
        }) => {
          // Avoid duplicating exact match
          if (row.ent_fsid !== data.results.exact_match?.ent_fsid) {
            results.push({
              _id: row._id?.$oid || row._id,
              ent_fsid: row.ent_fsid,
              ent_name: row.ent_name,
              ent_summary: row.ent_summary,
            });
          }
        }
      );
    }

    return results;
  } catch (error) {
    console.error('Subject search error:', error);
    return [];
  }
};

// Drag and drop types
const ItemTypes = {
  SUBJECT: 'subject',
};

interface DragItem {
  type: string;
  fsid: string;
  sourceType: 'whiteboard' | 'labSeed';
  sourceLabSeedId?: string;
}

// Drop Zone for Lab Seeds
const DroppableLabSeedArea: React.FC<{
  labSeedId: string;
  children: React.ReactNode;
  onDrop: (
    subjectFsid: string,
    targetLabSeedId: string,
    sourceType: 'whiteboard' | 'labSeed',
    sourceLabSeedId?: string
  ) => void;
  existingSubjectFsids: string[];
}> = ({ labSeedId, children, onDrop, existingSubjectFsids }) => {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.SUBJECT,
      drop: (item: DragItem) => {
        // Check if subject already exists in this lab seed
        if (existingSubjectFsids.includes(item.fsid)) {
          return; // Don't allow drop
        }
        onDrop(item.fsid, labSeedId, item.sourceType, item.sourceLabSeedId);
      },
      canDrop: (item: DragItem) => {
        // Don't allow dropping if subject already exists in this lab seed
        return !existingSubjectFsids.includes(item.fsid);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [existingSubjectFsids]
  );

  return (
    <Box
      ref={drop}
      bg={
        isOver
          ? canDrop
            ? 'rgba(130, 133, 255, 0.1)'
            : 'rgba(224, 123, 145, 0.1)'
          : 'transparent'
      }
      borderRadius='md'
      transition='background-color 0.2s'
      minH='200px'
      cursor={isOver && !canDrop ? 'not-allowed' : 'default'}
    >
      {children}
    </Box>
  );
};

// Term management component
const TermsSection: React.FC<{
  terms: string[];
  labSeedId: string;
  whiteboardId: string;
  token: string;
  onTermsUpdate: () => void;
}> = ({ terms, labSeedId, whiteboardId, token, onTermsUpdate }) => {
  const [newTerm, setNewTerm] = useState('');
  const [isAddingTerm, setIsAddingTerm] = useState(false);

  const handleAddTerm = async () => {
    if (!newTerm.trim() || isAddingTerm) return;

    try {
      setIsAddingTerm(true);
      await whiteboardService.addTermToLabSeed(
        whiteboardId,
        labSeedId,
        newTerm.trim(),
        token
      );
      setNewTerm('');
      onTermsUpdate();
      toaster.create({
        title: 'Term added successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to add term:', error);
      toaster.create({
        title: 'Failed to add term',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsAddingTerm(false);
    }
  };

  const handleRemoveTerm = async (term: string) => {
    try {
      await whiteboardService.removeTermFromLabSeed(
        whiteboardId,
        labSeedId,
        term,
        token
      );
      onTermsUpdate();
      toaster.create({
        title: 'Term removed successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to remove term:', error);
      toaster.create({
        title: 'Failed to remove term',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTerm();
    }
  };

  return (
    <Box
      p={2}
      bg='bg.subtle'
      borderRadius='md'
      border='1px solid'
      borderColor='border.muted'
    >
      <Text fontSize='xs' color='fg.muted' mb={2}>
        Terms:
      </Text>

      {/* Add term input */}
      <HStack gap={2} mb={2}>
        <Input
          size='sm'
          placeholder='Add term...'
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          onKeyDown={handleKeyPress}
          flex='1'
        />
        <Button
          size='sm'
          onClick={handleAddTerm}
          disabled={!newTerm.trim() || isAddingTerm}
          loading={isAddingTerm}
        >
          <FiPlus size={14} />
        </Button>
      </HStack>

      {/* Terms list */}
      <Flex gap={1} wrap='wrap'>
        {terms.map((term, index) => (
          <Badge
            key={index}
            size='sm'
            colorScheme='gray'
            display='flex'
            alignItems='center'
            gap={1}
          >
            {term}
            <IconButton
              size='xs'
              variant='ghost'
              onClick={() => handleRemoveTerm(term)}
              aria-label={`Remove ${term}`}
              color='fg.muted'
              _hover={{ color: 'error' }}
            >
              <FiX size={10} />
            </IconButton>
          </Badge>
        ))}
      </Flex>
    </Box>
  );
};

// Whiteboard skeleton component for initial loading
const WhiteboardSkeleton: React.FC = () => (
  <Box p={6} bg='bg' minHeight='calc(100vh - 64px)'>
    <VStack gap={6} align='stretch'>
      {/* Header Skeleton */}
      <Card.Root
        bg='bg.canvas'
        border='1px solid'
        borderColor='border.emphasized'
      >
        <Card.Body p={6}>
          <VStack gap={1} align='start'>
            <Skeleton height='32px' width='200px' />
            <Skeleton height='20px' width='400px' />
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Overview Stats Skeleton */}
      <Card.Root
        bg='bg.canvas'
        border='1px solid'
        borderColor='border.emphasized'
      >
        <Card.Body p={4}>
          <VStack gap={4} align='stretch'>
            <HStack justify='space-between' align='center'>
              <Skeleton height='20px' width='80px' />
              <Grid
                templateColumns='repeat(3, 1fr)'
                gap={6}
                flex='1'
                maxW='400px'
              >
                <VStack gap={0}>
                  <Skeleton height='16px' width='80px' />
                  <Skeleton height='24px' width='40px' />
                </VStack>
                <VStack gap={0}>
                  <Skeleton height='16px' width='80px' />
                  <Skeleton height='24px' width='40px' />
                </VStack>
                <VStack gap={0}>
                  <Skeleton height='16px' width='80px' />
                  <Skeleton height='24px' width='40px' />
                </VStack>
              </Grid>
            </HStack>
            <Separator />
            <HStack gap={4} align='center'>
              <Skeleton height='40px' flex='1' maxW='400px' />
              <Skeleton height='40px' width='140px' />
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Main Content Skeleton */}
      <HStack gap={6} align='flex-start'>
        {/* Subjects Sidebar Skeleton */}
        <Box minW='280px' maxW='320px'>
          <Card.Root
            bg='bg.canvas'
            border='1px solid'
            borderColor='border.emphasized'
          >
            <Card.Body p={4}>
              <VStack gap={3} align='stretch'>
                <HStack justify='space-between' align='center'>
                  <Skeleton height='20px' width='80px' />
                  <Skeleton height='20px' width='40px' borderRadius='full' />
                </HStack>
                <VStack gap={2} align='stretch'>
                  <HStack gap={2} align='center'>
                    <Skeleton height='16px' width='60px' />
                    <Skeleton height='28px' flex='1' />
                  </HStack>
                  <Skeleton height='32px' width='100%' />
                </VStack>
                <Box maxH='600px'>
                  <VStack gap={2} align='stretch'>
                    {[1, 2, 3, 4].map((i) => (
                      <SubjectSkeleton key={i} />
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Lab Seeds Area Skeleton */}
        <Box flex='1'>
          <Card.Root
            bg='bg.canvas'
            border='1px solid'
            borderColor='border.emphasized'
          >
            <Card.Body p={8}>
              <Flex align='center' justify='center' minH='400px'>
                <VStack gap={4} textAlign='center'>
                  <Skeleton height='48px' width='48px' borderRadius='md' />
                  <VStack gap={2}>
                    <Skeleton height='24px' width='200px' />
                    <Skeleton height='20px' width='300px' />
                  </VStack>
                  <Skeleton height='40px' width='180px' />
                </VStack>
              </Flex>
            </Card.Body>
          </Card.Root>
        </Box>
      </HStack>
    </VStack>
  </Box>
);

// Subject skeleton component
const SubjectSkeleton: React.FC = () => (
  <Card.Root size='sm' variant='outline' mb={3} bg='bg.canvas'>
    <Card.Body p={3}>
      <VStack gap={2} align='stretch'>
        <HStack justify='space-between' align='flex-start'>
          <HStack gap={2} flex='1' align='start'>
            <Skeleton height='24px' width='24px' borderRadius='md' />
            <SkeletonText noOfLines={1} width='60%' />
          </HStack>
          <Skeleton height='20px' width='20px' borderRadius='md' />
        </HStack>
        <VStack gap={1} align='stretch'>
          <Skeleton height='8px' width='100%' />
          <Skeleton height='8px' width='100%' />
          <Skeleton height='8px' width='100%' />
        </VStack>
        <SkeletonText noOfLines={2} />
      </VStack>
    </Card.Body>
  </Card.Root>
);

// Lab seed skeleton component
const LabSeedSkeleton: React.FC = () => (
  <Card.Root
    size='lg'
    variant='outline'
    minH='450px'
    bg='bg.canvas'
    border='1px solid'
    borderColor='border.emphasized'
  >
    <Card.Body p={4}>
      <VStack gap={3} align='stretch'>
        <HStack justify='space-between' align='flex-start'>
          <VStack gap={1} align='start' flex='1'>
            <SkeletonText noOfLines={1} width='40%' />
            <SkeletonText noOfLines={1} width='60%' />
          </VStack>
          <HStack gap={1}>
            <Skeleton height='32px' width='32px' borderRadius='md' />
            <Skeleton height='32px' width='80px' borderRadius='md' />
          </HStack>
        </HStack>
        <Box flex='1' minH='300px'>
          <Flex align='center' justify='center' minH='200px'>
            <Spinner size='lg' color='brand' />
          </Flex>
        </Box>
      </VStack>
    </Card.Body>
  </Card.Root>
);

// Main Whiteboard Component
const Whiteboard: React.FC = () => {
  // Auth and Page Context
  const { user, token } = useAuth();
  const { setPageContext, clearPageContext } = usePage();
  const navigate = useNavigate();

  // State management
  const [whiteboardData, setWhiteboardData] = useState<WhiteboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMethod, setSortMethod] = useState<string>('name-asc');
  const [filterText, setFilterText] = useState<string>('');
  const [isCreateLabSeedOpen, setIsCreateLabSeedOpen] = useState(false);
  const [newLabSeedName, setNewLabSeedName] = useState('');
  const [newLabSeedDescription, setNewLabSeedDescription] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] =
    useState<WhiteboardSubject | null>(null);
  const [labSeedsContainingSubject, setLabSeedsContainingSubject] = useState<
    WhiteboardLabSeed[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SubjectSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Loading states for individual operations
  const [isCreatingLabSeed, setIsCreatingLabSeed] = useState(false);
  const [deletingLabSeedIds, setDeletingLabSeedIds] = useState<Set<string>>(
    new Set()
  );
  const [pendingSubjects, setPendingSubjects] = useState<Set<string>>(
    new Set()
  );

  // Optimistic state management to prevent full page reloads and flickering
  const [optimisticWhiteboardData, setOptimisticWhiteboardData] =
    useState<WhiteboardData | null>(null);

  // Load whiteboard data from API without triggering loading state if data exists
  const loadWhiteboardData = useCallback(
    async (silent: boolean = false) => {
      if (!user || !token) return;

      try {
        if (!silent) {
          setIsLoading(true);
        }
        setError(null);

        const data = await whiteboardService.getUserWhiteboard(user._id, token);

        // Update both regular and optimistic data
        setWhiteboardData(data);
        setOptimisticWhiteboardData(data);
      } catch (error) {
        console.error('Failed to load whiteboard data:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load whiteboard'
        );
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [user, token]
  );

  // Load data on mount
  useEffect(() => {
    loadWhiteboardData(false); // Initial load with loading state
  }, [loadWhiteboardData]);

  // Set page context with optimistic data
  const transformedLabSeeds = useMemo(() => {
    const dataToUse = optimisticWhiteboardData || whiteboardData;
    if (!dataToUse) return [];

    return dataToUse.labSeeds.map((labSeed) => ({
      id: labSeed.uniqueID,
      name: labSeed.name,
      subjects: labSeed.subjects.map((subject) => ({
        id: subject.ent_fsid,
        name: subject.ent_name,
        title: subject.ent_name,
      })),
      terms: labSeed.terms.map((termString, index) => ({
        id: `term-${labSeed.uniqueID}-${index}`,
        name: termString,
        text: termString,
      })),
    }));
  }, [optimisticWhiteboardData, whiteboardData]);

  const whiteboardContext = useMemo(
    () => ({
      pageType: 'whiteboard' as const,
      pageTitle: 'Whiteboard',
      drafts: transformedLabSeeds,
    }),
    [transformedLabSeeds]
  );

  useEffect(() => {
    setPageContext(whiteboardContext);
    return () => clearPageContext();
  }, [setPageContext, clearPageContext, whiteboardContext]);

  // Check if subject is in whiteboard using optimistic data
  const isSubjectInWhiteboard = useCallback(
    (subjectFsid: string): boolean => {
      const dataToUse = optimisticWhiteboardData || whiteboardData;
      if (!dataToUse) return false;
      return dataToUse.subjects.some((s) => s.ent_fsid === subjectFsid);
    },
    [optimisticWhiteboardData, whiteboardData]
  );

  // Filter and sort subjects using optimistic data
  const getFilteredAndSortedSubjects = useCallback((): WhiteboardSubject[] => {
    const dataToUse = optimisticWhiteboardData || whiteboardData;
    if (!dataToUse) return [];

    // Filter by search text
    const filtered = filterSubjects(dataToUse.subjects, filterText);

    // Sort based on selected method
    const [sortBy, sortOrder] = sortMethod.split('-') as [
      'name' | 'addedAt',
      'asc' | 'desc'
    ];
    return sortSubjects(filtered, sortBy, sortOrder);
  }, [optimisticWhiteboardData, whiteboardData, filterText, sortMethod]);

  // Search functionality
  const performSearch = useCallback(
    async (query: string) => {
      if (!token) return;

      setIsSearching(true);
      try {
        const results = await performSubjectSearch(query, token);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
        toaster.create({
          title: 'Search failed',
          description: 'Unable to search subjects. Please try again.',
          type: 'error',
          duration: 5000,
        });
      } finally {
        setIsSearching(false);
      }
    },
    [token]
  );

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (value.trim().length === 0) {
      setShowSearchDropdown(false);
      setSearchResults([]);
    }
  }, []);

  // Handle search execution
  const handleSearchExecute = useCallback(
    (query: string) => {
      if (query.trim().length > 0) {
        setShowSearchDropdown(true);
        performSearch(query);
      }
    },
    [performSearch]
  );

  // Add subject to whiteboard from search with better optimistic updates
  const handleAddSubjectFromSearch = useCallback(
    async (result: SubjectSearchResult) => {
      if (!whiteboardData || !token) return;

      // Add to pending subjects (shows skeleton)
      setPendingSubjects((prev) => new Set(prev).add(result.ent_fsid));

      // Update optimistic data immediately
      if (optimisticWhiteboardData) {
        const newSubject: WhiteboardSubject = {
          ent_fsid: result.ent_fsid,
          ent_name: result.ent_name,
          ent_summary: result.ent_summary,
          indexes: [], // No metrics initially
        };

        setOptimisticWhiteboardData((prev) =>
          prev
            ? {
                ...prev,
                subjects: [...prev.subjects, newSubject],
              }
            : null
        );
      }

      try {
        await whiteboardService.addSubjectToWhiteboard(
          whiteboardData.uniqueID,
          result.ent_fsid,
          token
        );

        // Reload whiteboard data silently to avoid loading state
        await loadWhiteboardData(true);

        // Clear search
        setSearchQuery('');
        setShowSearchDropdown(false);

        toaster.create({
          title: 'Subject added to whiteboard',
          description: `${result.ent_name} has been added successfully`,
          type: 'success',
          duration: 3000,
        });
      } catch (error) {
        // Revert optimistic update on error
        if (optimisticWhiteboardData) {
          setOptimisticWhiteboardData((prev) =>
            prev
              ? {
                  ...prev,
                  subjects: prev.subjects.filter(
                    (s) => s.ent_fsid !== result.ent_fsid
                  ),
                }
              : null
          );
        }

        console.error('Failed to add subject to whiteboard:', error);
        toaster.create({
          title: 'Failed to add subject',
          description: error instanceof Error ? error.message : 'Unknown error',
          type: 'error',
          duration: 5000,
        });
      } finally {
        setPendingSubjects((prev) => {
          const newSet = new Set(prev);
          newSet.delete(result.ent_fsid);
          return newSet;
        });
      }
    },
    [whiteboardData, token, loadWhiteboardData, optimisticWhiteboardData]
  );

  // Actually remove subject from whiteboard
  const removeSubjectFromWhiteboard = useCallback(
    async (subjectFsid: string, revertState?: WhiteboardData) => {
      if (!whiteboardData || !token) return;

      try {
        await whiteboardService.removeSubjectFromWhiteboard(
          whiteboardData.uniqueID,
          subjectFsid,
          token
        );

        // Reload whiteboard data silently to sync with server
        await loadWhiteboardData(true);

        toaster.create({
          title: 'Subject removed from whiteboard',
          type: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to remove subject from whiteboard:', error);

        // Revert optimistic update if we have the previous state
        if (revertState) {
          setOptimisticWhiteboardData(revertState);
        }

        toaster.create({
          title: 'Failed to remove subject',
          description: error instanceof Error ? error.message : 'Unknown error',
          type: 'error',
          duration: 5000,
        });
      }
    },
    [whiteboardData, token, loadWhiteboardData]
  );

  // Remove subject from whiteboard entirely
  const handleRemoveFromWhiteboard = useCallback(
    async (subjectFsid: string) => {
      if (!whiteboardData || !optimisticWhiteboardData) return;

      const subject = whiteboardData.subjects.find(
        (s) => s.ent_fsid === subjectFsid
      );
      if (!subject) return;

      // Find which lab seeds contain this subject
      const containingLabSeeds = whiteboardData.labSeeds.filter((labSeed) =>
        labSeed.subjects.some((s) => s.ent_fsid === subjectFsid)
      );

      if (containingLabSeeds.length > 0) {
        // Show confirmation modal if subject is in lab seeds
        setSubjectToDelete(subject);
        setLabSeedsContainingSubject(containingLabSeeds);
        setIsDeleteConfirmOpen(true);
      } else {
        // Store current state for potential revert
        const previousState = { ...optimisticWhiteboardData };

        // OPTIMISTIC UPDATE: Remove immediately from UI
        setOptimisticWhiteboardData((prev) => {
          if (!prev) return null;

          return {
            ...prev,
            subjects: prev.subjects.filter((s) => s.ent_fsid !== subjectFsid),
            // Also remove from any lab seeds
            labSeeds: prev.labSeeds.map((labSeed) => ({
              ...labSeed,
              subjects: labSeed.subjects.filter(
                (s) => s.ent_fsid !== subjectFsid
              ),
            })),
          };
        });

        // Make API call with revert capability
        await removeSubjectFromWhiteboard(subjectFsid, previousState);
      }
    },
    [whiteboardData, optimisticWhiteboardData, removeSubjectFromWhiteboard]
  );

  // Confirm deletion from whiteboard
  const handleConfirmDelete = useCallback(async () => {
    if (!subjectToDelete || !optimisticWhiteboardData) return;

    // Store current state for potential revert
    const previousState = { ...optimisticWhiteboardData };

    // OPTIMISTIC UPDATE: Remove immediately from UI
    setOptimisticWhiteboardData((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        subjects: prev.subjects.filter(
          (s) => s.ent_fsid !== subjectToDelete.ent_fsid
        ),
        // Also remove from any lab seeds
        labSeeds: prev.labSeeds.map((labSeed) => ({
          ...labSeed,
          subjects: labSeed.subjects.filter(
            (s) => s.ent_fsid !== subjectToDelete.ent_fsid
          ),
        })),
      };
    });

    // Reset modal state immediately
    setIsDeleteConfirmOpen(false);
    setSubjectToDelete(null);
    setLabSeedsContainingSubject([]);

    // Make API call with revert capability
    await removeSubjectFromWhiteboard(subjectToDelete.ent_fsid, previousState);
  }, [subjectToDelete, optimisticWhiteboardData, removeSubjectFromWhiteboard]);

  // Handle view subject - navigate to subject page (keeping for programmatic navigation)
  const handleViewSubject = useCallback(
    (subject: WhiteboardSubject) => {
      // Extract slug from ent_fsid (remove fsid_ prefix if present)
      const subjectSlug = subject.ent_fsid.startsWith('fsid_')
        ? subject.ent_fsid.substring(5)
        : subject.ent_fsid;

      // Navigate to subject page
      navigate(`/subject/${subjectSlug}`);
    },
    [navigate]
  );

  // Lab Seed management
  const handleCreateLabSeed = useCallback(async () => {
    if (!newLabSeedName.trim() || !whiteboardData || !token) return;

    try {
      setIsCreatingLabSeed(true);
      await whiteboardService.createLabSeed(
        whiteboardData.uniqueID,
        newLabSeedName.trim(),
        newLabSeedDescription.trim() || '',
        token
      );

      // Reload whiteboard data silently
      await loadWhiteboardData(true);

      // Reset form
      setNewLabSeedName('');
      setNewLabSeedDescription('');
      setIsCreateLabSeedOpen(false);

      toaster.create({
        title: 'Lab seed created',
        description: `"${newLabSeedName}" has been created successfully`,
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to create lab seed:', error);
      toaster.create({
        title: 'Failed to create lab seed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsCreatingLabSeed(false);
    }
  }, [
    newLabSeedName,
    newLabSeedDescription,
    whiteboardData,
    token,
    loadWhiteboardData,
  ]);

  // Delete lab seed entirely
  const handleDeleteLabSeed = useCallback(
    async (labSeedId: string) => {
      if (!whiteboardData || !token) return;

      // Add to deleting set
      setDeletingLabSeedIds((prev) => new Set(prev).add(labSeedId));

      try {
        await whiteboardService.deleteLabSeed(
          whiteboardData.uniqueID,
          labSeedId,
          token
        );

        // Reload whiteboard data silently
        await loadWhiteboardData(true);

        toaster.create({
          title: 'Lab seed deleted',
          type: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to delete lab seed:', error);
        toaster.create({
          title: 'Failed to delete lab seed',
          description: error instanceof Error ? error.message : 'Unknown error',
          type: 'error',
          duration: 5000,
        });
      } finally {
        setDeletingLabSeedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(labSeedId);
          return newSet;
        });
      }
    },
    [whiteboardData, token, loadWhiteboardData]
  );

  // Handle subject movement via drag and drop with improved optimistic updates
  const handleSubjectDrop = useCallback(
    async (
      subjectFsid: string,
      targetLabSeedId: string,
      sourceType: 'whiteboard' | 'labSeed',
      sourceLabSeedId?: string
    ) => {
      if (!whiteboardData || !token || !optimisticWhiteboardData) return;

      const operationId = `drop-${subjectFsid}-${targetLabSeedId}-${Date.now()}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      // Find the subject data
      const subject = optimisticWhiteboardData.subjects.find(
        (s) => s.ent_fsid === subjectFsid
      );
      if (!subject) return;

      // Optimistic update - update the lab seeds directly
      setOptimisticWhiteboardData((prev) => {
        if (!prev) return null;

        const newLabSeeds = prev.labSeeds.map((labSeed) => {
          if (labSeed.uniqueID === targetLabSeedId) {
            // Add subject to target lab seed if not already there
            const hasSubject = labSeed.subjects.some(
              (s) => s.ent_fsid === subjectFsid
            );
            if (!hasSubject) {
              return {
                ...labSeed,
                subjects: [...labSeed.subjects, subject],
              };
            }
          } else if (
            sourceType === 'labSeed' &&
            labSeed.uniqueID === sourceLabSeedId
          ) {
            // Remove subject from source lab seed
            return {
              ...labSeed,
              subjects: labSeed.subjects.filter(
                (s) => s.ent_fsid !== subjectFsid
              ),
            };
          }
          return labSeed;
        });

        return {
          ...prev,
          labSeeds: newLabSeeds,
        };
      });

      try {
        if (sourceType === 'whiteboard') {
          // Copy from whiteboard to lab seed
          await whiteboardService.addSubjectToLabSeed(
            whiteboardData.uniqueID,
            targetLabSeedId,
            subjectFsid,
            token
          );
        } else if (
          sourceType === 'labSeed' &&
          sourceLabSeedId &&
          sourceLabSeedId !== targetLabSeedId
        ) {
          // Move between lab seeds - first add to target, then remove from source
          await whiteboardService.addSubjectToLabSeed(
            whiteboardData.uniqueID,
            targetLabSeedId,
            subjectFsid,
            token
          );

          await whiteboardService.removeSubjectFromLabSeed(
            whiteboardData.uniqueID,
            sourceLabSeedId,
            subjectFsid,
            token
          );
        }

        // Reload data in background to sync with server
        setTimeout(() => loadWhiteboardData(true), 500);
      } catch (error) {
        console.error('Failed to move subject:', error);

        // Revert optimistic update on error
        await loadWhiteboardData(true);

        toaster.create({
          title: 'Failed to move subject',
          description: error instanceof Error ? error.message : 'Unknown error',
          type: 'error',
          duration: 5000,
        });
      } finally {
        setPendingOperations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(operationId);
          return newSet;
        });
      }
    },
    [whiteboardData, token, loadWhiteboardData, optimisticWhiteboardData]
  );

  // Remove subject from lab seed with improved optimistic updates
  const handleRemoveSubjectFromLabSeed = useCallback(
    async (labSeedId: string, subjectFsid: string) => {
      if (!whiteboardData || !token || !optimisticWhiteboardData) return;

      const operationId = `remove-${subjectFsid}-${labSeedId}-${Date.now()}`;
      setPendingOperations((prev) => new Set(prev).add(operationId));

      // Optimistic update - remove from lab seed immediately
      setOptimisticWhiteboardData((prev) => {
        if (!prev) return null;

        const newLabSeeds = prev.labSeeds.map((labSeed) => {
          if (labSeed.uniqueID === labSeedId) {
            return {
              ...labSeed,
              subjects: labSeed.subjects.filter(
                (s) => s.ent_fsid !== subjectFsid
              ),
            };
          }
          return labSeed;
        });

        return {
          ...prev,
          labSeeds: newLabSeeds,
        };
      });

      try {
        await whiteboardService.removeSubjectFromLabSeed(
          whiteboardData.uniqueID,
          labSeedId,
          subjectFsid,
          token
        );

        // Reload data in background to sync with server
        setTimeout(() => loadWhiteboardData(true), 500);
      } catch (error) {
        console.error('Failed to remove subject from lab seed:', error);

        // Revert optimistic update on error
        await loadWhiteboardData(true);

        toaster.create({
          title: 'Failed to remove subject from lab seed',
          description: error instanceof Error ? error.message : 'Unknown error',
          type: 'error',
          duration: 5000,
        });
      } finally {
        setPendingOperations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(operationId);
          return newSet;
        });
      }
    },
    [whiteboardData, token, loadWhiteboardData, optimisticWhiteboardData]
  );

  // Handle publishing lab seed (updated to navigate to CreateLab)
  const handlePublishLabSeed = useCallback(
    (labSeedId: string) => {
      const labSeed = whiteboardData?.labSeeds.find(
        (d) => d.uniqueID === labSeedId
      );

      if (labSeed) {
        if (labSeed.subjects.length === 0) {
          toaster.create({
            title: 'Cannot create lab',
            description: 'Lab seed must contain at least one subject',
            type: 'warning',
            duration: 5000,
          });
          return;
        }

        // Transform whiteboard lab seed to the expected format for CreateLab
        const transformedLabSeed: WhiteboardLabSeedForNavigation = {
          id: labSeed.uniqueID,
          name: labSeed.name,
          description: labSeed.description,
          subjects: labSeed.subjects.map((subject) => ({
            id: subject.ent_fsid,
            name: subject.ent_name,
            slug: subject.ent_fsid,
            summary: subject.ent_summary,
            category: undefined, // Lab seeds don't have categories initially
          })),
          includeTerms: labSeed.terms, // Terms go to include by default
          excludeTerms: [],
          createdAt: labSeed.createdAt,
          isActive: true,
        };

        // Navigate to create lab page with the lab seed data
        navigate('/lab/create', {
          state: {
            initialLabSeed: transformedLabSeed,
            fromWhiteboard: true,
          },
        });

        toaster.create({
          title: 'Creating lab from Lab Seed',
          description: `Starting lab creation with ${labSeed.subjects.length} subjects from "${labSeed.name}"`,
          type: 'success',
          duration: 3000,
        });
      }
    },
    [whiteboardData, navigate]
  );

  // Handle quick add to lab seed (placeholder - would show selection dialog)
  const handleQuickAddToLabSeed = useCallback((_subjectFsid: string) => {
    toaster.create({
      title: 'Quick add functionality',
      description: 'Quick add functionality not yet implemented',
      type: 'info',
      duration: 3000,
    });
  }, []);

  // Handle go to search results (placeholder)
  const handleGoToSearchResults = useCallback(() => {
    toaster.create({
      title: 'Search results page',
      description: 'Search results page navigation not yet implemented',
      type: 'info',
      duration: 3000,
    });
  }, []);

  // Get lab seed subjects from optimistic data
  const getLabSeedSubjects = useCallback(
    (labSeed: WhiteboardLabSeed): WhiteboardSubject[] => {
      // Use optimistic data if available, otherwise fall back to the lab seed's subjects
      if (optimisticWhiteboardData) {
        const optimisticLabSeed = optimisticWhiteboardData.labSeeds.find(
          (ls) => ls.uniqueID === labSeed.uniqueID
        );
        return optimisticLabSeed?.subjects || labSeed.subjects;
      }

      return labSeed.subjects;
    },
    [optimisticWhiteboardData]
  );

  // Lab Seed Card Component with inline editing
  const LabSeedCard: React.FC<{ labSeed: WhiteboardLabSeed }> = ({
    labSeed,
  }) => {
    const isDeleting = deletingLabSeedIds.has(labSeed.uniqueID);
    const subjects = getLabSeedSubjects(labSeed);

    // Get the current lab seed data (optimistic or regular)
    const currentLabSeed =
      optimisticWhiteboardData?.labSeeds.find(
        (ls) => ls.uniqueID === labSeed.uniqueID
      ) || labSeed;

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editName, setEditName] = useState(currentLabSeed.name);
    const [editDescription, setEditDescription] = useState(
      currentLabSeed.description
    );

    // Update edit states when optimistic data changes
    React.useEffect(() => {
      setEditName(currentLabSeed.name);
      setEditDescription(currentLabSeed.description);
    }, [currentLabSeed.name, currentLabSeed.description]);

    // Save name edit
    const handleSaveName = async () => {
      if (editName.trim() === currentLabSeed.name || !editName.trim()) {
        setEditName(currentLabSeed.name);
        setIsEditingName(false);
        return;
      }

      try {
        // Update optimistic data immediately
        if (optimisticWhiteboardData) {
          setOptimisticWhiteboardData((prev) => {
            if (!prev) return null;

            const newLabSeeds = prev.labSeeds.map((ls) =>
              ls.uniqueID === labSeed.uniqueID
                ? { ...ls, name: editName.trim() }
                : ls
            );

            return { ...prev, labSeeds: newLabSeeds };
          });
        }

        // TODO: Implement name update API call when endpoint is available
        // await whiteboardService.updateLabSeedName(whiteboardId, labSeed.uniqueID, editName.trim(), token);

        setIsEditingName(false);

        toaster.create({
          title: 'Lab seed name updated',
          type: 'success',
          duration: 3000,
        });
      } catch (error) {
        // Revert optimistic update on error
        setEditName(currentLabSeed.name);
        console.error('Failed to update lab seed name:', error);
        toaster.create({
          title: 'Failed to update name',
          description: error instanceof Error ? error.message : 'Unknown error',
          type: 'error',
          duration: 5000,
        });
        setIsEditingName(false);
      }
    };

    // Save description edit
    const handleSaveDescription = async () => {
      if (editDescription.trim() === currentLabSeed.description) {
        setIsEditingDescription(false);
        return;
      }

      try {
        // Update optimistic data immediately
        if (optimisticWhiteboardData) {
          setOptimisticWhiteboardData((prev) => {
            if (!prev) return null;

            const newLabSeeds = prev.labSeeds.map((ls) =>
              ls.uniqueID === labSeed.uniqueID
                ? { ...ls, description: editDescription.trim() }
                : ls
            );

            return { ...prev, labSeeds: newLabSeeds };
          });
        }

        // TODO: Implement description update API call when endpoint is available
        // await whiteboardService.updateLabSeedDescription(whiteboardId, labSeed.uniqueID, editDescription.trim(), token);

        setIsEditingDescription(false);

        toaster.create({
          title: 'Lab seed description updated',
          type: 'success',
          duration: 3000,
        });
      } catch (error) {
        // Revert optimistic update on error
        setEditDescription(currentLabSeed.description);
        console.error('Failed to update lab seed description:', error);
        toaster.create({
          title: 'Failed to update description',
          description: error instanceof Error ? error.message : 'Unknown error',
          type: 'error',
          duration: 5000,
        });
        setIsEditingDescription(false);
      }
    };

    // Handle key press for inline editing
    const handleKeyPress = (
      e: React.KeyboardEvent,
      type: 'name' | 'description'
    ) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (type === 'name') {
          handleSaveName();
        } else {
          handleSaveDescription();
        }
      } else if (e.key === 'Escape') {
        if (type === 'name') {
          setEditName(currentLabSeed.name);
          setIsEditingName(false);
        } else {
          setEditDescription(currentLabSeed.description);
          setIsEditingDescription(false);
        }
      }
    };

    if (isDeleting) {
      return (
        <Card.Root
          size='lg'
          variant='outline'
          minH='450px'
          bg='bg.canvas'
          border='1px solid'
          borderColor='border.emphasized'
        >
          <Card.Body p={4}>
            <Flex
              align='center'
              justify='center'
              minH='400px'
              direction='column'
              gap={4}
            >
              <Spinner size='xl' color='brand' />
              <Text color='fg.muted'>Deleting lab seed...</Text>
            </Flex>
          </Card.Body>
        </Card.Root>
      );
    }

    return (
      <Card.Root
        size='lg'
        variant='outline'
        minH='450px'
        bg='bg.canvas'
        border='1px solid'
        borderColor='border.emphasized'
      >
        <Card.Body p={4}>
          <DroppableLabSeedArea
            labSeedId={labSeed.uniqueID}
            onDrop={handleSubjectDrop}
            existingSubjectFsids={subjects.map((s) => s.ent_fsid)}
          >
            <VStack gap={3} align='stretch' height='100%'>
              {/* Header */}
              <VStack gap={1} align='start' flex='0'>
                <HStack gap={2} align='center' width='100%'>
                  {isEditingName ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={(e) => handleKeyPress(e, 'name')}
                      size='sm'
                      fontWeight='semibold'
                      autoFocus
                      flex='1'
                    />
                  ) : (
                    <HStack gap={2} flex='1' align='center'>
                      <Text fontSize='md' fontWeight='semibold' flex='1'>
                        {currentLabSeed.name}
                      </Text>
                      <IconButton
                        size='xs'
                        variant='ghost'
                        onClick={() => setIsEditingName(true)}
                        aria-label='Edit lab seed name'
                        color='fg.muted'
                      >
                        <FiEdit size={12} />
                      </IconButton>
                    </HStack>
                  )}
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <IconButton
                        size='sm'
                        variant='ghost'
                        aria-label='Lab Seed options'
                        color='fg.muted'
                      >
                        <FiMoreHorizontal size={14} />
                      </IconButton>
                    </Menu.Trigger>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.Item
                          value='delete'
                          onClick={() => handleDeleteLabSeed(labSeed.uniqueID)}
                          color='red.600'
                        >
                          <FiTrash2 size={14} />
                          Delete Lab Seed
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Menu.Root>
                </HStack>

                {/* Description */}
                {isEditingDescription ? (
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onBlur={handleSaveDescription}
                    onKeyDown={(e) => handleKeyPress(e, 'description')}
                    size='sm'
                    rows={2}
                    autoFocus
                    placeholder='Add description...'
                    width='100%'
                  />
                ) : (
                  <Text
                    fontSize='xs'
                    color='fg.muted'
                    cursor='pointer'
                    onClick={() => setIsEditingDescription(true)}
                    _hover={{ color: 'fg' }}
                  >
                    {currentLabSeed.description ||
                      'Click to add description...'}
                  </Text>
                )}
              </VStack>

              {/* Terms Section */}
              <Tooltip.Root
                openDelay={300}
                closeDelay={100}
                positioning={{ placement: 'bottom' }}
              >
                <Tooltip.Trigger asChild>
                  <Box>
                    <TermsSection
                      terms={currentLabSeed.terms}
                      labSeedId={labSeed.uniqueID}
                      whiteboardId={currentWhiteboardData?.uniqueID || ''}
                      token={token || ''}
                      onTermsUpdate={() => loadWhiteboardData(true)}
                    />
                  </Box>
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content>
                    <Text fontSize='sm'>
                      The Terms section is for things you're not able to find
                      via search. When creating a lab from a Lab Seed, these
                      terms will be added to our database and information on
                      patents, papers, orgs, etc., will be fetched and made
                      available to you.
                    </Text>
                  </Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>

              {/* Subject List - Drop Zone */}
              <Box flex='1' minH='300px'>
                {subjects.length === 0 ? (
                  <Flex
                    align='center'
                    justify='center'
                    minH='200px'
                    color='fg.muted'
                  >
                    <VStack gap={2}>
                      <FiTarget size='md' />
                      <Text fontSize='sm' textAlign='center'>
                        Drag subjects here to build your lab seed
                      </Text>
                    </VStack>
                  </Flex>
                ) : (
                  <VStack gap={2} align='stretch'>
                    {subjects.map((subject) => (
                      <WhiteboardSubjectCard
                        key={subject.ent_fsid}
                        subject={subject}
                        sourceType='labSeed'
                        labSeedId={labSeed.uniqueID}
                        onRemoveFromLabSeed={handleRemoveSubjectFromLabSeed}
                        onViewSubject={handleViewSubject}
                      />
                    ))}
                  </VStack>
                )}
              </Box>

              {/* Create Lab Button - Full Width at Bottom */}
              <Button
                width='100%'
                colorScheme='green'
                variant='solid'
                onClick={() => handlePublishLabSeed(labSeed.uniqueID)}
                disabled={subjects.length === 0}
                size='md'
              >
                <FiZap size={16} />
                Create Lab
              </Button>
            </VStack>
          </DroppableLabSeedArea>
        </Card.Body>
      </Card.Root>
    );
  };

  // Show skeleton state on initial load
  if (isLoading && !whiteboardData) {
    return <WhiteboardSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <Box
        p={6}
        bg='bg'
        minHeight='calc(100vh - 64px)'
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <VStack gap={4}>
          <Text color='error' fontSize='lg'>
            Failed to load whiteboard
          </Text>
          <Text color='fg.muted'>{error}</Text>
          <Button onClick={() => loadWhiteboardData(false)}>Try Again</Button>
        </VStack>
      </Box>
    );
  }

  // Show no data state
  if (!whiteboardData) {
    return (
      <Box
        p={6}
        bg='bg'
        minHeight='calc(100vh - 64px)'
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <VStack gap={4}>
          <Text color='fg.muted' fontSize='lg'>
            No whiteboard data available
          </Text>
          <Button onClick={() => loadWhiteboardData(false)}>Refresh</Button>
        </VStack>
      </Box>
    );
  }

  // Use optimistic data or fallback to regular data
  const currentWhiteboardData = optimisticWhiteboardData || whiteboardData;

  return (
    <DndProvider backend={HTML5Backend}>
      <Box p={6} bg='bg' minHeight='calc(100vh - 64px)'>
        <VStack gap={6} align='stretch'>
          {/* Header */}
          <Card.Root
            bg='bg.canvas'
            border='1px solid'
            borderColor='border.emphasized'
          >
            <Card.Body p={6}>
              <VStack gap={1} align='start'>
                <Heading as='h1' size='xl'>
                  Whiteboard
                </Heading>
                <Text color='fg.muted'>
                  Collect subjects, organize into lab seeds, and publish to labs
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Overview Stats */}
          <Card.Root
            bg='bg.canvas'
            border='1px solid'
            borderColor='border.emphasized'
          >
            <Card.Body p={4}>
              <VStack gap={4} align='stretch'>
                <HStack justify='space-between' align='center'>
                  <Text fontWeight='medium'>Overview</Text>
                  <Grid
                    templateColumns='repeat(3, 1fr)'
                    gap={6}
                    flex='1'
                    maxW='400px'
                  >
                    <VStack gap={0}>
                      <Text fontSize='xs' color='fg.muted'>
                        Total Subjects
                      </Text>
                      <Text fontWeight='bold'>
                        {currentWhiteboardData?.subjects.length || 0}
                      </Text>
                    </VStack>
                    <VStack gap={0}>
                      <Text fontSize='xs' color='fg.muted'>
                        Lab Seeds
                      </Text>
                      <Text fontWeight='bold'>
                        {currentWhiteboardData?.labSeeds.length || 0}
                      </Text>
                    </VStack>
                    <VStack gap={0}>
                      <Text fontSize='xs' color='fg.muted'>
                        Total Terms
                      </Text>
                      <Text fontWeight='bold'>
                        {currentWhiteboardData?.labSeeds.reduce(
                          (sum, labSeed) => sum + labSeed.terms.length,
                          0
                        ) || 0}
                      </Text>
                    </VStack>
                  </Grid>
                </HStack>

                <Separator />

                {/* Search and Actions */}
                <HStack gap={4} align='center'>
                  <SubjectSearch
                    searchQuery={searchQuery}
                    searchResults={searchResults}
                    isSearching={isSearching}
                    showSearchDropdown={showSearchDropdown}
                    isSubjectInWhiteboard={isSubjectInWhiteboard}
                    onSearchChange={handleSearchChange}
                    onSearchExecute={handleSearchExecute}
                    onSearchFocus={() => {}}
                    onClearSearch={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowSearchDropdown(false);
                    }}
                    onAddSubject={handleAddSubjectFromSearch}
                    onGoToSearchResults={handleGoToSearchResults}
                    setShowSearchDropdown={setShowSearchDropdown}
                  />

                  <Button
                    colorScheme='blue'
                    variant='outline'
                    onClick={() => setIsCreateLabSeedOpen(true)}
                    disabled={isCreatingLabSeed}
                    loading={isCreatingLabSeed}
                    color='fg'
                  >
                    <FiPlus size={16} />
                    New Lab Seed
                  </Button>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Main Content */}
          <HStack gap={6} align='flex-start'>
            {/* Subjects Sidebar - Sticky */}
            <Box
              minW='280px'
              maxW='320px'
              position='sticky'
              top='80px'
              height='fit-content'
              maxH='80vh'
            >
              <Card.Root
                bg='bg.canvas'
                border='1px solid'
                borderColor='border.emphasized'
                height='100%'
                maxH='80vh'
              >
                <Card.Body
                  p={4}
                  height='100%'
                  display='flex'
                  flexDirection='column'
                >
                  <VStack gap={3} align='stretch' height='100%'>
                    <HStack justify='space-between' align='center'>
                      <Text fontWeight='medium'>Subjects</Text>
                      <Badge colorScheme='gray'>
                        {currentWhiteboardData?.subjects.length || 0}
                      </Badge>
                    </HStack>

                    {/* Filter and Sort Controls */}
                    <VStack gap={2} align='stretch'>
                      <HStack gap={2} align='center'>
                        <Text
                          fontSize='sm'
                          fontWeight='medium'
                          color='fg'
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
                            padding: '4px',
                            borderRadius: '4px',
                            border:
                              '1px solid var(--chakra-colors-border-emphasized)',
                            fontSize: '12px',
                            width: '100%',
                            backgroundColor: 'var(--chakra-colors-bg-canvas)',
                            color: 'var(--chakra-colors-fg)',
                          }}
                        >
                          <option value='name-asc'>A-Z</option>
                          <option value='name-desc'>Z-A</option>
                        </select>
                      </HStack>
                      <Input
                        placeholder='Filter subjects...'
                        value={filterText}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFilterText(e.target.value)
                        }
                        size='sm'
                      />
                    </VStack>

                    <Box
                      flex='1'
                      overflowY='auto'
                      minH='0'
                      maxH='calc(80vh - 200px)'
                    >
                      {getFilteredAndSortedSubjects().length === 0 ? (
                        <Flex
                          align='center'
                          justify='center'
                          minH='200px'
                          color='fg.muted'
                        >
                          <VStack gap={2}>
                            <FiSearch size='md' />
                            <Text fontSize='sm' textAlign='center'>
                              {filterText
                                ? 'No subjects match your filters.'
                                : 'No subjects in whiteboard. Search to add some.'}
                            </Text>
                          </VStack>
                        </Flex>
                      ) : (
                        <VStack gap={2} align='stretch'>
                          {getFilteredAndSortedSubjects().map((subject) => (
                            <WhiteboardSubjectCard
                              key={subject.ent_fsid}
                              subject={subject}
                              sourceType='whiteboard'
                              showQuickActions
                              onRemoveFromWhiteboard={
                                handleRemoveFromWhiteboard
                              }
                              onQuickAddToLabSeed={handleQuickAddToLabSeed}
                              onViewSubject={handleViewSubject}
                            />
                          ))}

                          {/* Show pending subjects as skeletons */}
                          {Array.from(pendingSubjects).map((fsid) => (
                            <SubjectSkeleton key={`pending-${fsid}`} />
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </Box>

            {/* Lab Seeds Area */}
            <Box flex='1'>
              {currentWhiteboardData?.labSeeds.length === 0 &&
              !isCreatingLabSeed ? (
                <Card.Root
                  bg='bg.canvas'
                  border='1px solid'
                  borderColor='border.emphasized'
                >
                  <Card.Body p={8}>
                    <Flex align='center' justify='center' minH='400px'>
                      <VStack gap={4} textAlign='center'>
                        <FiTarget
                          size={48}
                          color='var(--chakra-colors-fg-muted)'
                        />
                        <VStack gap={2}>
                          <Text
                            fontSize='lg'
                            fontWeight='medium'
                            color='fg.muted'
                          >
                            No lab seeds yet
                          </Text>
                          <Text color='fg.muted'>
                            Create your first lab seed to start organizing
                            subjects
                          </Text>
                        </VStack>
                        <Button
                          colorScheme='blue'
                          onClick={() => setIsCreateLabSeedOpen(true)}
                          disabled={isCreatingLabSeed}
                          color='fg'
                        >
                          <FiPlus size={16} />
                          Create First Lab Seed
                        </Button>
                      </VStack>
                    </Flex>
                  </Card.Body>
                </Card.Root>
              ) : (
                <Grid
                  templateColumns='repeat(auto-fit, minmax(450px, 1fr))'
                  gap={6}
                >
                  {currentWhiteboardData?.labSeeds.map((labSeed) => (
                    <LabSeedCard key={labSeed.uniqueID} labSeed={labSeed} />
                  ))}

                  {/* Show creating lab seed skeleton */}
                  {isCreatingLabSeed && <LabSeedSkeleton />}
                </Grid>
              )}
            </Box>
          </HStack>

          {/* Create Lab Seed Dialog */}
          <Dialog.Root
            open={isCreateLabSeedOpen}
            onOpenChange={({ open }) => setIsCreateLabSeedOpen(open)}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content
                bg='bg.canvas'
                border='1px solid'
                borderColor='border.emphasized'
              >
                <Dialog.Header>
                  <Dialog.Title>Create New Lab Seed</Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <IconButton size='sm' variant='ghost' color='fg.muted'>
                      <FiX />
                    </IconButton>
                  </Dialog.CloseTrigger>
                </Dialog.Header>

                <Dialog.Body>
                  <VStack gap={4} align='stretch'>
                    <Field.Root>
                      <Field.Label>Lab Seed Name</Field.Label>
                      <Input
                        value={newLabSeedName}
                        onChange={(e) => setNewLabSeedName(e.target.value)}
                        placeholder='Enter lab seed name...'
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Description</Field.Label>
                      <Textarea
                        value={newLabSeedDescription}
                        onChange={(e) =>
                          setNewLabSeedDescription(e.target.value)
                        }
                        placeholder='Enter description...'
                        rows={3}
                      />
                    </Field.Root>
                  </VStack>
                </Dialog.Body>

                <Dialog.Footer>
                  <HStack gap={3}>
                    <Button
                      variant='outline'
                      onClick={() => setIsCreateLabSeedOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorScheme='blue'
                      onClick={handleCreateLabSeed}
                      disabled={!newLabSeedName.trim() || isCreatingLabSeed}
                      loading={isCreatingLabSeed}
                    >
                      Create Lab Seed
                    </Button>
                  </HStack>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>

          {/* Delete Confirmation Dialog */}
          <Dialog.Root
            open={isDeleteConfirmOpen}
            onOpenChange={({ open }) => {
              setIsDeleteConfirmOpen(open);
              if (!open) {
                setSubjectToDelete(null);
                setLabSeedsContainingSubject([]);
              }
            }}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content
                bg='bg.canvas'
                border='1px solid'
                borderColor='border.emphasized'
              >
                <Dialog.Header>
                  <Dialog.Title>Confirm Delete from Whiteboard</Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <IconButton size='sm' variant='ghost' color='fg.muted'>
                      <FiX />
                    </IconButton>
                  </Dialog.CloseTrigger>
                </Dialog.Header>

                <Dialog.Body>
                  <VStack gap={3} align='stretch'>
                    <Text>
                      Are you sure you want to delete "
                      {subjectToDelete?.ent_name}" from the whiteboard?
                    </Text>

                    {labSeedsContainingSubject.length > 0 && (
                      <Box
                        p={3}
                        bg='errorSubtle'
                        borderRadius='md'
                        border='1px solid'
                        borderColor='error'
                      >
                        <Text
                          fontSize='sm'
                          color='error'
                          fontWeight='medium'
                          mb={2}
                        >
                          ⚠️ This subject is currently in{' '}
                          {labSeedsContainingSubject.length} lab seed(s):
                        </Text>
                        <VStack gap={1} align='start'>
                          {labSeedsContainingSubject.map((labSeed) => (
                            <Text
                              key={labSeed.uniqueID}
                              fontSize='sm'
                              color='error'
                            >
                              • {labSeed.name}
                            </Text>
                          ))}
                        </VStack>
                        <Text fontSize='sm' color='error' mt={2}>
                          Removing it from the whiteboard will also remove it
                          from these lab seeds.
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Dialog.Body>

                <Dialog.Footer>
                  <HStack gap={3}>
                    <Button
                      variant='outline'
                      onClick={() => setIsDeleteConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button colorScheme='red' onClick={handleConfirmDelete}>
                      Delete from Whiteboard
                    </Button>
                  </HStack>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>
        </VStack>
      </Box>
    </DndProvider>
  );
};

export default Whiteboard;

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import {
  FiPlus,
  FiSettings,
  FiSend,
  FiEdit,
  FiTrash2,
  FiTarget,
  FiX,
  FiSearch,
} from 'react-icons/fi';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createToaster } from '@chakra-ui/react';

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

// Toast for notifications
const toaster = createToaster({
  placement: 'top-right',
});

// Subject search function with correct endpoint
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

    const results = await response.json();
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
        <SkeletonText noOfLines={2} spacing='2' />
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
  const [optimisticUpdates, setOptimisticUpdates] = useState<{
    addedSubjects: Map<string, string[]>; // labSeedId -> subject fsids
    removedSubjects: Map<string, string[]>; // labSeedId -> subject fsids
  }>({
    addedSubjects: new Map(),
    removedSubjects: new Map(),
  });

  // Load whiteboard data from API
  const loadWhiteboardData = useCallback(async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading whiteboard data for user:', user._id);

      const data = await whiteboardService.getUserWhiteboard(user._id, token);
      setWhiteboardData(data);
      console.log('Whiteboard data loaded:', data);
    } catch (error) {
      console.error('Failed to load whiteboard data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load whiteboard'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  // Load data on mount
  useEffect(() => {
    loadWhiteboardData();
  }, [loadWhiteboardData]);

  // Set page context
  const transformedLabSeeds = useMemo(() => {
    if (!whiteboardData) return [];

    return whiteboardData.labSeeds.map((labSeed) => ({
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
  }, [whiteboardData]);

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

  // Check if subject is in whiteboard
  const isSubjectInWhiteboard = useCallback(
    (subjectFsid: string): boolean => {
      if (!whiteboardData) return false;
      return whiteboardData.subjects.some((s) => s.ent_fsid === subjectFsid);
    },
    [whiteboardData]
  );

  // Filter and sort subjects
  const getFilteredAndSortedSubjects = useCallback((): WhiteboardSubject[] => {
    if (!whiteboardData) return [];

    // Filter by search text
    const filtered = filterSubjects(whiteboardData.subjects, filterText);

    // Sort based on selected method
    const [sortBy, sortOrder] = sortMethod.split('-') as [
      'name' | 'addedAt',
      'asc' | 'desc'
    ];
    return sortSubjects(filtered, sortBy, sortOrder);
  }, [whiteboardData, filterText, sortMethod]);

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
          status: 'error',
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

  // Add subject to whiteboard from search
  const handleAddSubjectFromSearch = useCallback(
    async (result: SubjectSearchResult) => {
      if (!whiteboardData || !token) return;

      // Add to pending subjects (shows skeleton)
      setPendingSubjects((prev) => new Set(prev).add(result.ent_fsid));

      try {
        await whiteboardService.addSubjectToWhiteboard(
          whiteboardData.uniqueID,
          result.ent_fsid,
          token
        );

        // Reload whiteboard data to get updated state
        await loadWhiteboardData();

        // Clear search
        setSearchQuery('');
        setShowSearchDropdown(false);

        toaster.create({
          title: 'Subject added to whiteboard',
          description: `${result.ent_name} has been added successfully`,
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to add subject to whiteboard:', error);
        toaster.create({
          title: 'Failed to add subject',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
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
    [whiteboardData, token, loadWhiteboardData]
  );

  // Actually remove subject from whiteboard
  const removeSubjectFromWhiteboard = useCallback(
    async (subjectFsid: string) => {
      if (!whiteboardData || !token) return;

      try {
        await whiteboardService.removeSubjectFromWhiteboard(
          whiteboardData.uniqueID,
          subjectFsid,
          token
        );

        // Reload whiteboard data
        await loadWhiteboardData();

        toaster.create({
          title: 'Subject removed from whiteboard',
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to remove subject from whiteboard:', error);
        toaster.create({
          title: 'Failed to remove subject',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
        });
      }
    },
    [whiteboardData, token, loadWhiteboardData]
  );

  // Remove subject from whiteboard entirely
  const handleRemoveFromWhiteboard = useCallback(
    async (subjectFsid: string) => {
      if (!whiteboardData) return;

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
        // Remove directly if not in any lab seeds
        await removeSubjectFromWhiteboard(subjectFsid);
      }
    },
    [whiteboardData, removeSubjectFromWhiteboard]
  );

  // Confirm deletion from whiteboard
  const handleConfirmDelete = useCallback(async () => {
    if (!subjectToDelete) return;

    await removeSubjectFromWhiteboard(subjectToDelete.ent_fsid);

    // Reset modal state
    setIsDeleteConfirmOpen(false);
    setSubjectToDelete(null);
    setLabSeedsContainingSubject([]);
  }, [subjectToDelete, removeSubjectFromWhiteboard]);

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

      // Reload whiteboard data
      await loadWhiteboardData();

      // Reset form
      setNewLabSeedName('');
      setNewLabSeedDescription('');
      setIsCreateLabSeedOpen(false);

      toaster.create({
        title: 'Lab seed created',
        description: `"${newLabSeedName}" has been created successfully`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to create lab seed:', error);
      toaster.create({
        title: 'Failed to create lab seed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
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

        // Reload whiteboard data
        await loadWhiteboardData();

        toaster.create({
          title: 'Lab seed deleted',
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to delete lab seed:', error);
        toaster.create({
          title: 'Failed to delete lab seed',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
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

  // Handle subject movement via drag and drop with optimistic updates
  const handleSubjectDrop = useCallback(
    async (
      subjectFsid: string,
      targetLabSeedId: string,
      sourceType: 'whiteboard' | 'labSeed',
      sourceLabSeedId?: string
    ) => {
      if (!whiteboardData || !token) return;

      // Optimistic update - add to UI immediately
      if (sourceType === 'whiteboard') {
        setOptimisticUpdates((prev) => ({
          ...prev,
          addedSubjects: new Map(prev.addedSubjects).set(targetLabSeedId, [
            ...(prev.addedSubjects.get(targetLabSeedId) || []),
            subjectFsid,
          ]),
        }));
      } else if (sourceLabSeedId && sourceLabSeedId !== targetLabSeedId) {
        setOptimisticUpdates((prev) => ({
          addedSubjects: new Map(prev.addedSubjects).set(targetLabSeedId, [
            ...(prev.addedSubjects.get(targetLabSeedId) || []),
            subjectFsid,
          ]),
          removedSubjects: new Map(prev.removedSubjects).set(sourceLabSeedId, [
            ...(prev.removedSubjects.get(sourceLabSeedId) || []),
            subjectFsid,
          ]),
        }));
      }

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

        // Clear optimistic updates and reload data
        setOptimisticUpdates({
          addedSubjects: new Map(),
          removedSubjects: new Map(),
        });
        await loadWhiteboardData();
      } catch (error) {
        console.error('Failed to move subject:', error);

        // Revert optimistic update
        setOptimisticUpdates({
          addedSubjects: new Map(),
          removedSubjects: new Map(),
        });

        toaster.create({
          title: 'Failed to move subject',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
        });
      }
    },
    [whiteboardData, token, loadWhiteboardData]
  );

  // Remove subject from lab seed with optimistic updates
  const handleRemoveSubjectFromLabSeed = useCallback(
    async (labSeedId: string, subjectFsid: string) => {
      if (!whiteboardData || !token) return;

      // Optimistic update - remove from UI immediately
      setOptimisticUpdates((prev) => ({
        ...prev,
        removedSubjects: new Map(prev.removedSubjects).set(labSeedId, [
          ...(prev.removedSubjects.get(labSeedId) || []),
          subjectFsid,
        ]),
      }));

      try {
        await whiteboardService.removeSubjectFromLabSeed(
          whiteboardData.uniqueID,
          labSeedId,
          subjectFsid,
          token
        );

        // Clear optimistic updates and reload data
        setOptimisticUpdates((prev) => ({
          ...prev,
          removedSubjects: new Map(),
        }));
        await loadWhiteboardData();
      } catch (error) {
        console.error('Failed to remove subject from lab seed:', error);

        // Revert optimistic update
        setOptimisticUpdates((prev) => ({
          ...prev,
          removedSubjects: new Map(),
        }));

        toaster.create({
          title: 'Failed to remove subject from lab seed',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
        });
      }
    },
    [whiteboardData, token, loadWhiteboardData]
  );

  // Handle publishing lab seed (placeholder - would navigate to lab creation)
  const handlePublishLabSeed = useCallback(
    (labSeedId: string) => {
      const labSeed = whiteboardData?.labSeeds.find(
        (d) => d.uniqueID === labSeedId
      );
      if (labSeed) {
        if (labSeed.subjects.length === 0) {
          toaster.create({
            title: 'Cannot publish lab seed',
            description: 'Lab seed must contain at least one subject',
            status: 'warning',
            duration: 5000,
          });
          return;
        }
        // Navigate to lab creation with lab seed data
        console.log('Publishing lab seed to lab creation:', labSeed);
        toaster.create({
          title: 'Publishing lab seed',
          description: `Would navigate to lab creation with ${labSeed.subjects.length} subjects from "${labSeed.name}"`,
          status: 'info',
          duration: 5000,
        });
      }
    },
    [whiteboardData]
  );

  // Handle quick add to lab seed (placeholder - would show selection dialog)
  const handleQuickAddToLabSeed = useCallback((subjectFsid: string) => {
    console.log('Quick add subject to lab seed:', subjectFsid);
    toaster.create({
      title: 'Quick add functionality',
      description: 'Quick add functionality not yet implemented',
      status: 'info',
      duration: 3000,
    });
  }, []);

  // Handle go to search results (placeholder)
  const handleGoToSearchResults = useCallback(() => {
    console.log('Navigate to search results page');
    toaster.create({
      title: 'Search results page',
      description: 'Search results page navigation not yet implemented',
      status: 'info',
      duration: 3000,
    });
  }, []);

  // Get lab seed subjects with optimistic updates applied
  const getLabSeedSubjects = useCallback(
    (labSeed: WhiteboardLabSeed): WhiteboardSubject[] => {
      let subjects = [...labSeed.subjects];

      // Apply optimistic removals
      const removedFsids =
        optimisticUpdates.removedSubjects.get(labSeed.uniqueID) || [];
      subjects = subjects.filter((s) => !removedFsids.includes(s.ent_fsid));

      // Apply optimistic additions
      const addedFsids =
        optimisticUpdates.addedSubjects.get(labSeed.uniqueID) || [];
      const whiteboardSubjects = whiteboardData?.subjects || [];

      addedFsids.forEach((fsid) => {
        const subject = whiteboardSubjects.find((s) => s.ent_fsid === fsid);
        if (subject && !subjects.some((s) => s.ent_fsid === fsid)) {
          subjects.push(subject);
        }
      });

      return subjects;
    },
    [optimisticUpdates, whiteboardData]
  );

  // Lab Seed Card Component
  const LabSeedCard: React.FC<{ labSeed: WhiteboardLabSeed }> = ({
    labSeed,
  }) => {
    const isDeleting = deletingLabSeedIds.has(labSeed.uniqueID);
    const subjects = getLabSeedSubjects(labSeed);

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
            <VStack gap={3} align='stretch'>
              {/* Header */}
              <HStack justify='space-between' align='flex-start'>
                <VStack gap={1} align='start' flex='1'>
                  <HStack gap={2} align='center'>
                    <Text fontSize='md' fontWeight='semibold'>
                      {labSeed.name}
                    </Text>
                    <Badge size='sm' colorScheme='blue'>
                      {subjects.length}
                    </Badge>
                  </HStack>
                  {labSeed.description && (
                    <Text fontSize='xs' color='fg.muted'>
                      {labSeed.description}
                    </Text>
                  )}
                </VStack>
                <HStack gap={1}>
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <IconButton
                        size='sm'
                        variant='ghost'
                        aria-label='Lab Seed settings'
                      >
                        <FiSettings size={14} />
                      </IconButton>
                    </Menu.Trigger>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.Item value='edit'>
                          <FiEdit size={14} />
                          Edit Lab Seed
                        </Menu.Item>
                        <Menu.Item
                          value='delete'
                          onClick={() => handleDeleteLabSeed(labSeed.uniqueID)}
                        >
                          <FiTrash2 size={14} />
                          Delete Lab Seed
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Menu.Root>
                  <Button
                    size='sm'
                    colorScheme='green'
                    variant='outline'
                    onClick={() => handlePublishLabSeed(labSeed.uniqueID)}
                    disabled={subjects.length === 0}
                  >
                    <FiSend size={14} />
                    Publish
                  </Button>
                </HStack>
              </HStack>

              {/* Subject List */}
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
                      />
                    ))}
                  </VStack>
                )}
              </Box>

              {/* Terms Section */}
              <TermsSection
                terms={labSeed.terms}
                labSeedId={labSeed.uniqueID}
                whiteboardId={whiteboardData?.uniqueID || ''}
                token={token || ''}
                onTermsUpdate={loadWhiteboardData}
              />
            </VStack>
          </DroppableLabSeedArea>
        </Card.Body>
      </Card.Root>
    );
  };

  // Show loading state
  if (isLoading) {
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
          <Spinner size='xl' color='brand' />
          <Text>Loading whiteboard...</Text>
        </VStack>
      </Box>
    );
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
          <Button onClick={loadWhiteboardData}>Try Again</Button>
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
          <Button onClick={loadWhiteboardData}>Refresh</Button>
        </VStack>
      </Box>
    );
  }

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
                        {whiteboardData.subjects.length}
                      </Text>
                    </VStack>
                    <VStack gap={0}>
                      <Text fontSize='xs' color='fg.muted'>
                        Lab Seeds
                      </Text>
                      <Text fontWeight='bold'>
                        {whiteboardData.labSeeds.length}
                      </Text>
                    </VStack>
                    <VStack gap={0}>
                      <Text fontSize='xs' color='fg.muted'>
                        Total Terms
                      </Text>
                      <Text fontWeight='bold'>
                        {whiteboardData.labSeeds.reduce(
                          (sum, labSeed) => sum + labSeed.terms.length,
                          0
                        )}
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
            {/* Subjects Sidebar */}
            <Box minW='280px' maxW='320px'>
              <Card.Root
                bg='bg.canvas'
                border='1px solid'
                borderColor='border.emphasized'
              >
                <Card.Body p={4}>
                  <VStack gap={3} align='stretch'>
                    <HStack justify='space-between' align='center'>
                      <Text fontWeight='medium'>Subjects</Text>
                      <Badge colorScheme='gray'>
                        {whiteboardData.subjects.length}
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

                    <Box maxH='600px' overflowY='auto'>
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
              {whiteboardData.labSeeds.length === 0 && !isCreatingLabSeed ? (
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
                  {whiteboardData.labSeeds.map((labSeed) => (
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
                    <IconButton size='sm' variant='ghost'>
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
                    <IconButton size='sm' variant='ghost'>
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

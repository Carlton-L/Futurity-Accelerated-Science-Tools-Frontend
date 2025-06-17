import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
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
} from '@chakra-ui/react';
import { Progress } from '@chakra-ui/react';
import {
  FiPlus,
  FiSearch,
  FiSettings,
  FiSend,
  FiList,
  FiMoreVertical,
  FiEye,
  FiTrash2,
  FiEdit,
  FiTarget,
  FiX,
} from 'react-icons/fi';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import types and utilities
import type {
  WhiteboardSubject,
  WhiteboardDraft,
  DraftMetrics,
  VisualizationType,
  SubjectSearchResult,
} from './types';
import {
  calculateDraftMetrics,
  generateTaxonomySuggestions,
  validateDraftForPublishing,
} from './types';

// Import visualization components
import { ListView } from './visualizations';

import { usePage } from '../../context/PageContext';

// Mock data
const mockSubjects: WhiteboardSubject[] = [
  {
    id: 'subj-1',
    subjectId: 'quantum-computing-001',
    name: 'Quantum Computing',
    description:
      'Advanced quantum algorithms and quantum supremacy applications for solving complex computational problems',
    slug: 'quantum-computing',
    horizonRank: 0.73,
    techTransfer: 85,
    whiteSpace: 42,
    addedAt: '2024-03-15T10:30:00Z',
    source: 'search',
    aiInsights: {
      category: 'Advanced Computing',
      keywords: ['quantum', 'algorithms', 'computing'],
      confidence: 92,
    },
  },
  {
    id: 'subj-2',
    subjectId: 'vertical-farming-001',
    name: 'Vertical Farming',
    description:
      'Automated indoor agriculture systems for urban environments using hydroponic and aeroponic technologies',
    slug: 'vertical-farming',
    horizonRank: 0.65,
    techTransfer: 72,
    whiteSpace: 68,
    addedAt: '2024-03-14T14:20:00Z',
    source: 'browse',
    aiInsights: {
      category: 'Agricultural Technology',
      keywords: ['farming', 'agriculture', 'urban'],
      confidence: 88,
    },
  },
  {
    id: 'subj-3',
    subjectId: 'neural-interfaces-001',
    name: 'Neural Interfaces',
    description:
      'Brain-computer interfaces for medical rehabilitation and consumer applications including thought-controlled devices',
    slug: 'neural-interfaces',
    horizonRank: 0.45,
    techTransfer: 58,
    whiteSpace: 81,
    addedAt: '2024-03-13T09:15:00Z',
    source: 'search',
    aiInsights: {
      category: 'Neurotechnology',
      keywords: ['brain', 'interfaces', 'medical'],
      confidence: 85,
    },
  },
  {
    id: 'subj-4',
    subjectId: 'carbon-capture-001',
    name: 'Carbon Capture',
    description:
      'Direct air capture and carbon utilization technologies for climate change mitigation and industrial applications',
    slug: 'carbon-capture',
    horizonRank: 0.78,
    techTransfer: 91,
    whiteSpace: 35,
    addedAt: '2024-03-12T16:45:00Z',
    source: 'browse',
    aiInsights: {
      category: 'Climate Technology',
      keywords: ['carbon', 'climate', 'capture'],
      confidence: 90,
    },
  },
  {
    id: 'subj-5',
    subjectId: 'space-solar-001',
    name: 'Space Solar Power',
    description:
      'Orbital solar power satellites that beam clean energy to Earth using microwave transmission technology',
    slug: 'space-solar-power',
    horizonRank: 0.35,
    techTransfer: 45,
    whiteSpace: 85,
    addedAt: '2024-03-11T11:20:00Z',
    source: 'search',
    aiInsights: {
      category: 'Space Technology',
      keywords: ['space', 'solar', 'energy'],
      confidence: 82,
    },
  },
];

const mockSearchResults: SubjectSearchResult[] = [
  {
    id: 'search-1',
    name: 'Fusion Energy',
    slug: 'fusion-energy',
    description: 'Nuclear fusion power generation for clean unlimited energy',
    horizonRank: 0.42,
    techTransfer: 65,
    whiteSpace: 75,
    source: 'Global Energy Database',
  },
  {
    id: 'search-2',
    name: 'Gene Therapy',
    slug: 'gene-therapy',
    description:
      'Therapeutic genetic modification for treating inherited diseases',
    horizonRank: 0.68,
    techTransfer: 78,
    whiteSpace: 52,
    source: 'Medical Research Database',
  },
];

// Drag and drop types
const ItemTypes = {
  SUBJECT: 'subject',
};

interface DragItem {
  type: string;
  id: string;
  sourceType: 'unpooled' | 'draft';
  sourceDraftId?: string;
}

// Draggable Subject Card Component
const DraggableSubjectCard: React.FC<{
  subject: WhiteboardSubject;
  sourceType: 'unpooled' | 'draft';
  sourceDraftId?: string;
  showQuickAdd?: boolean;
  onRemove?: (subjectId: string) => void;
  onQuickAdd?: (subjectId: string) => void;
  onRemoveFromWhiteboard?: (subjectId: string) => void;
}> = ({
  subject,
  sourceType,
  sourceDraftId,
  showQuickAdd,
  onRemove,
  onQuickAdd,
  onRemoveFromWhiteboard,
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.SUBJECT,
    item: {
      type: ItemTypes.SUBJECT,
      id: subject.id,
      sourceType,
      sourceDraftId,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getMetricColor = (
    value: number,
    type: 'horizon' | 'techTransfer' | 'whiteSpace'
  ) => {
    switch (type) {
      case 'horizon':
        return value < 0.3 ? 'red' : value < 0.7 ? 'orange' : 'green';
      case 'techTransfer':
        return value < 40 ? 'red' : value < 70 ? 'orange' : 'green';
      case 'whiteSpace':
        return value < 30 ? 'red' : value < 60 ? 'orange' : 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Card.Root
      ref={drag}
      size='sm'
      variant='outline'
      mb={3}
      opacity={isDragging ? 0.5 : 1}
      cursor='grab'
      _hover={{ shadow: 'md', borderColor: 'blue.300' }}
      transition='all 0.2s'
    >
      <Card.Body p={3}>
        <VStack gap={2} align='stretch'>
          <HStack justify='space-between' align='flex-start'>
            <Text fontSize='sm' fontWeight='medium' color='blue.600' flex='1'>
              {subject.name}
            </Text>
            <Menu.Root>
              <Menu.Trigger asChild>
                <IconButton
                  size='xs'
                  variant='ghost'
                  aria-label='Subject actions'
                >
                  <FiMoreVertical size={12} />
                </IconButton>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value='view'>
                    <FiEye size={14} />
                    View Details
                  </Menu.Item>
                  {showQuickAdd && onQuickAdd && (
                    <Menu.Item
                      value='add'
                      onClick={() => onQuickAdd(subject.id)}
                    >
                      <FiPlus size={14} />
                      Quick Add to Draft
                    </Menu.Item>
                  )}
                  {onRemoveFromWhiteboard && (
                    <Menu.Item
                      value='removeFromWhiteboard'
                      onClick={() => onRemoveFromWhiteboard(subject.id)}
                      color='red.600'
                    >
                      <FiTrash2 size={14} />
                      Delete from Whiteboard
                    </Menu.Item>
                  )}
                  {onRemove && (
                    <Menu.Item
                      value='remove'
                      onClick={() => onRemove(subject.id)}
                    >
                      <FiTrash2 size={14} />
                      Remove
                    </Menu.Item>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          </HStack>

          {/* Metrics */}
          <VStack gap={1} align='stretch'>
            <HStack justify='space-between'>
              <Text fontSize='xs' color='gray.500'>
                HR:
              </Text>
              <HStack gap={1}>
                <Progress.Root
                  value={subject.horizonRank * 100}
                  size='sm'
                  width='60px'
                  colorPalette={getMetricColor(subject.horizonRank, 'horizon')}
                >
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
                <Text fontSize='xs' fontWeight='medium' minW='30px'>
                  {subject.horizonRank.toFixed(2)}
                </Text>
              </HStack>
            </HStack>
            <HStack justify='space-between'>
              <Text fontSize='xs' color='gray.500'>
                TT:
              </Text>
              <HStack gap={1}>
                <Progress.Root
                  value={subject.techTransfer}
                  size='sm'
                  width='60px'
                  colorPalette={getMetricColor(
                    subject.techTransfer,
                    'techTransfer'
                  )}
                >
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
                <Text fontSize='xs' fontWeight='medium' minW='30px'>
                  {subject.techTransfer}
                </Text>
              </HStack>
            </HStack>
            <HStack justify='space-between'>
              <Text fontSize='xs' color='gray.500'>
                WS:
              </Text>
              <HStack gap={1}>
                <Progress.Root
                  value={subject.whiteSpace}
                  size='sm'
                  width='60px'
                  colorPalette={getMetricColor(
                    subject.whiteSpace,
                    'whiteSpace'
                  )}
                >
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
                <Text fontSize='xs' fontWeight='medium' minW='30px'>
                  {subject.whiteSpace}
                </Text>
              </HStack>
            </HStack>
          </VStack>

          <Text fontSize='xs' color='gray.500' lineHeight='1.3' lineClamp={2}>
            {subject.description}
          </Text>

          {subject.aiInsights && (
            <Badge size='sm' colorScheme='purple'>
              {subject.aiInsights.category}
            </Badge>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

// Drop Zone for Drafts
const DroppableDraftArea: React.FC<{
  draftId: string;
  children: React.ReactNode;
  onDrop: (
    subjectId: string,
    targetDraftId: string,
    sourceType: 'unpooled' | 'draft',
    sourceDraftId?: string
  ) => void;
  existingSubjectIds: string[];
}> = ({ draftId, children, onDrop, existingSubjectIds }) => {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.SUBJECT,
      drop: (item: DragItem) => {
        // Check if subject already exists in this draft
        if (existingSubjectIds.includes(item.id)) {
          return; // Don't allow drop
        }
        onDrop(item.id, draftId, item.sourceType, item.sourceDraftId);
      },
      canDrop: (item: DragItem) => {
        // Don't allow dropping if subject already exists in this draft
        return !existingSubjectIds.includes(item.id);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [existingSubjectIds]
  );

  return (
    <Box
      ref={drop}
      bg={isOver ? (canDrop ? 'blue.50' : 'red.50') : 'transparent'}
      borderRadius='md'
      transition='background-color 0.2s'
      minH='200px'
      cursor={isOver && !canDrop ? 'not-allowed' : 'default'}
    >
      {children}
    </Box>
  );
};

// Main Whiteboard Component
const Whiteboard: React.FC = () => {
  // Page Context
  const { setPageContext, clearPageContext } = usePage();

  // State management
  const [availableSubjects, setAvailableSubjects] = useState<
    WhiteboardSubject[]
  >(
    mockSubjects // Include all mock subjects in available
  );
  const [drafts, setDrafts] = useState<WhiteboardDraft[]>([
    {
      id: 'draft-1',
      name: 'Future Cities',
      description: 'Technologies for sustainable urban development',
      subjects: [mockSubjects[3], mockSubjects[4]],
      aiTaxonomy: {
        primaryCategory: 'Urban Technology',
        subCategories: ['Climate Solutions', 'Space Technology'],
        confidence: 87,
        suggestedLabName: 'Urban Innovation Lab',
      },
      metrics: calculateDraftMetrics([mockSubjects[3], mockSubjects[4]]),
      createdAt: '2024-03-10T10:30:00Z',
      updatedAt: '2024-03-15T14:20:00Z',
      createdById: 'user-1',
      isPublished: false,
      terms: ['something'],
    },
  ]);

  const [selectedVisualization, setSelectedVisualization] = useState<
    Record<string, VisualizationType>
  >({});

  // Filter and sort states for Available Subjects
  const [sortMethod, setSortMethod] = useState<string>('horizon-high');
  const [filterText, setFilterText] = useState<string>('');

  // Dialog states
  const [isCreateDraftOpen, setIsCreateDraftOpen] = useState(false);
  const [newDraftName, setNewDraftName] = useState('');
  const [newDraftDescription, setNewDraftDescription] = useState('');

  // Delete confirmation modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] =
    useState<WhiteboardSubject | null>(null);
  const [draftsContainingSubject, setDraftsContainingSubject] = useState<
    WhiteboardDraft[]
  >([]);

  // Search states - keeping for future implementation
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SubjectSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Calculate overall metrics
  const overallMetrics = useMemo((): DraftMetrics => {
    const allSubjects = [
      ...availableSubjects,
      ...drafts.flatMap((d) => d.subjects),
    ];
    return calculateDraftMetrics(allSubjects);
  }, [availableSubjects, drafts]);

  // Filter and sort available subjects
  const getFilteredAndSortedSubjects = useCallback((): WhiteboardSubject[] => {
    // Filter by search text
    const filtered = availableSubjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(filterText.toLowerCase()) ||
        subject.description.toLowerCase().includes(filterText.toLowerCase())
    );

    // Sort based on selected method
    switch (sortMethod) {
      case 'horizon-high':
        return filtered.sort((a, b) => b.horizonRank - a.horizonRank);
      case 'horizon-low':
        return filtered.sort((a, b) => a.horizonRank - b.horizonRank);
      case 'techTransfer-high':
        return filtered.sort((a, b) => b.techTransfer - a.techTransfer);
      case 'techTransfer-low':
        return filtered.sort((a, b) => a.techTransfer - b.techTransfer);
      case 'whiteSpace-high':
        return filtered.sort((a, b) => b.whiteSpace - a.whiteSpace);
      case 'whiteSpace-low':
        return filtered.sort((a, b) => a.whiteSpace - b.whiteSpace);
      case 'a-z':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a':
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return filtered;
    }
  }, [availableSubjects, filterText, sortMethod]);

  // Search functionality - keeping for future implementation
  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const results = mockSearchResults.filter(
      (result) =>
        result.name.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(results);
    setIsSearching(false);
  }, []);

  // Handle search input changes - keeping for future implementation
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (value.trim().length > 0) {
        setShowSearchDropdown(true);
        performSearch(value);
      } else {
        setShowSearchDropdown(false);
        setSearchResults([]);
      }
    },
    [performSearch]
  );

  // Handle clicks outside search dropdown - keeping for future implementation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideSearchInput = searchInputRef.current?.contains(target);
      const isInsideDropdown = searchDropdownRef.current?.contains(target);
      if (!isInsideSearchInput && !isInsideDropdown) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Memoize the transformed drafts to prevent recreation on every render
  const transformedDrafts = useMemo(() => {
    return drafts.map((draft) => ({
      id: draft.id,
      name: draft.name,
      subjects: draft.subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        title: subject.name, // Use name as title if title doesn't exist
      })),
      terms: draft.terms.map((termString, index) => ({
        id: `term-${draft.id}-${index}`, // Generate unique ID
        name: termString,
        text: termString, // Use the string as both name and text
      })),
    }));
  }, [drafts]);

  // Memoize the whiteboard context to prevent recreation
  const whiteboardContext = useMemo(
    () => ({
      pageType: 'whiteboard' as const,
      pageTitle: 'Whiteboard',
      drafts: transformedDrafts,
    }),
    [transformedDrafts]
  );

  useEffect(() => {
    setPageContext(whiteboardContext);
    return () => clearPageContext();
  }, [setPageContext, clearPageContext, whiteboardContext]);

  // Draft management
  const handleCreateDraft = useCallback(() => {
    if (!newDraftName.trim()) return;

    const newDraft: WhiteboardDraft = {
      id: `draft-${Date.now()}`,
      name: newDraftName.trim(),
      description: newDraftDescription.trim() || undefined,
      subjects: [],
      metrics: calculateDraftMetrics([]),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdById: 'current-user',
      isPublished: false,
      terms: [],
    };

    setDrafts((prev) => [...prev, newDraft]);
    setNewDraftName('');
    setNewDraftDescription('');
    setIsCreateDraftOpen(false);
  }, [newDraftName, newDraftDescription]);

  // Handle subject movement via drag and drop
  const handleSubjectDrop = useCallback(
    (
      subjectId: string,
      targetDraftId: string,
      sourceType: 'unpooled' | 'draft',
      sourceDraftId?: string
    ) => {
      if (sourceType === 'unpooled') {
        // Copy from available to draft (don't remove from available)
        const subject = availableSubjects.find((s) => s.id === subjectId);
        if (!subject) return;

        // Check if subject already exists in target draft
        const targetDraft = drafts.find((d) => d.id === targetDraftId);
        if (targetDraft?.subjects.some((s) => s.id === subjectId)) {
          // Subject already exists in draft, don't add
          return;
        }

        setDrafts((prev) =>
          prev.map((draft) =>
            draft.id === targetDraftId
              ? {
                  ...draft,
                  subjects: [...draft.subjects, subject],
                  metrics: calculateDraftMetrics([...draft.subjects, subject]),
                  updatedAt: new Date().toISOString(),
                }
              : draft
          )
        );
      } else if (
        sourceType === 'draft' &&
        sourceDraftId &&
        sourceDraftId !== targetDraftId
      ) {
        // Move between drafts (existing logic)
        let subjectToMove: WhiteboardSubject | undefined;

        // Check if subject already exists in target draft
        const targetDraft = drafts.find((d) => d.id === targetDraftId);
        const sourceDraft = drafts.find((d) => d.id === sourceDraftId);
        const subject = sourceDraft?.subjects.find((s) => s.id === subjectId);

        if (subject && targetDraft?.subjects.some((s) => s.id === subjectId)) {
          // Subject already exists in target draft, don't move
          return;
        }

        setDrafts((prev) =>
          prev.map((draft) => {
            if (draft.id === sourceDraftId) {
              subjectToMove = draft.subjects.find((s) => s.id === subjectId);
              const newSubjects = draft.subjects.filter(
                (s) => s.id !== subjectId
              );
              return {
                ...draft,
                subjects: newSubjects,
                metrics: calculateDraftMetrics(newSubjects),
                updatedAt: new Date().toISOString(),
              };
            }
            return draft;
          })
        );

        if (subjectToMove) {
          setDrafts((prev) =>
            prev.map((draft) =>
              draft.id === targetDraftId
                ? {
                    ...draft,
                    subjects: [...draft.subjects, subjectToMove!],
                    metrics: calculateDraftMetrics([
                      ...draft.subjects,
                      subjectToMove!,
                    ]),
                    updatedAt: new Date().toISOString(),
                  }
                : draft
            )
          );
        }
      }
    },
    [availableSubjects, drafts]
  );

  // Handle adding subject from search - keeping for future implementation
  const handleAddSubjectFromSearch = useCallback(
    (searchResult: SubjectSearchResult) => {
      const newSubject: WhiteboardSubject = {
        id: `subj-${Date.now()}`,
        subjectId: searchResult.id,
        name: searchResult.name,
        description: searchResult.description,
        slug: searchResult.slug,
        horizonRank: searchResult.horizonRank,
        techTransfer: searchResult.techTransfer,
        whiteSpace: searchResult.whiteSpace,
        addedAt: new Date().toISOString(),
        source: 'search',
      };

      setAvailableSubjects((prev) => [...prev, newSubject]);
      setSearchQuery('');
      setShowSearchDropdown(false);
    },
    []
  );

  // Handle removing subject from whiteboard entirely
  const handleRemoveFromWhiteboard = useCallback(
    (subjectId: string) => {
      const subject = availableSubjects.find((s) => s.id === subjectId);
      if (!subject) return;

      // Find which drafts contain this subject
      const containingDrafts = drafts.filter((draft) =>
        draft.subjects.some((s) => s.id === subjectId)
      );

      if (containingDrafts.length > 0) {
        // Show confirmation modal if subject is in drafts
        setSubjectToDelete(subject);
        setDraftsContainingSubject(containingDrafts);
        setIsDeleteConfirmOpen(true);
      } else {
        // Remove directly if not in any drafts
        setAvailableSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      }
    },
    [availableSubjects, drafts]
  );

  // Confirm deletion from whiteboard
  const handleConfirmDelete = useCallback(() => {
    if (!subjectToDelete) return;

    // Remove from available subjects
    setAvailableSubjects((prev) =>
      prev.filter((s) => s.id !== subjectToDelete.id)
    );

    // Remove from all drafts
    setDrafts((prev) =>
      prev.map((draft) => ({
        ...draft,
        subjects: draft.subjects.filter((s) => s.id !== subjectToDelete.id),
        metrics: calculateDraftMetrics(
          draft.subjects.filter((s) => s.id !== subjectToDelete.id)
        ),
        updatedAt: new Date().toISOString(),
      }))
    );

    // Reset modal state
    setIsDeleteConfirmOpen(false);
    setSubjectToDelete(null);
    setDraftsContainingSubject([]);
  }, [subjectToDelete]);

  // Handle publishing draft
  const handlePublishDraft = useCallback(
    (draftId: string) => {
      const draft = drafts.find((d) => d.id === draftId);
      if (draft) {
        const validation = validateDraftForPublishing(draft);
        if (validation.isValid) {
          // Navigate to lab creation with draft data
          console.log('Publishing draft to lab creation:', draft);
          alert(
            `Would navigate to lab creation with ${draft.subjects.length} subjects from "${draft.name}"`
          );
        } else {
          alert(`Cannot publish: ${validation.errors.join(', ')}`);
        }
      }
    },
    [drafts]
  );

  // Remove subject from draft
  const handleRemoveSubjectFromDraft = useCallback(
    (draftId: string, subjectId: string) => {
      // Simply remove from draft (subject stays in available subjects)
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === draftId
            ? {
                ...d,
                subjects: d.subjects.filter((s) => s.id !== subjectId),
                metrics: calculateDraftMetrics(
                  d.subjects.filter((s) => s.id !== subjectId)
                ),
                updatedAt: new Date().toISOString(),
              }
            : d
        )
      );
    },
    []
  );

  // Delete draft entirely
  const handleDeleteDraft = useCallback((draftId: string) => {
    // Just remove the draft (subjects stay in available subjects)
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  }, []);

  // Update draft AI taxonomy when subjects change
  const draftSubjectsKey = useMemo(
    () => drafts.map((d) => d.subjects.map((s) => s.id).join(',')).join('|'),
    [drafts]
  );

  useEffect(() => {
    setDrafts((prev) =>
      prev.map((draft) => ({
        ...draft,
        aiTaxonomy: generateTaxonomySuggestions(draft.subjects),
      }))
    );
  }, [draftSubjectsKey]);

  // Draft Card Component
  const DraftCard: React.FC<{ draft: WhiteboardDraft }> = ({ draft }) => {
    const currentViz = selectedVisualization[draft.id] || 'list';

    return (
      <Card.Root size='lg' variant='outline' minH='450px'>
        <Card.Body p={4}>
          <DroppableDraftArea
            draftId={draft.id}
            onDrop={handleSubjectDrop}
            existingSubjectIds={draft.subjects.map((s) => s.id)}
          >
            <VStack gap={3} align='stretch'>
              {/* Header */}
              <HStack justify='space-between' align='flex-start'>
                <VStack gap={1} align='start' flex='1'>
                  <HStack gap={2} align='center'>
                    <Text fontSize='md' fontWeight='semibold'>
                      {draft.name}
                    </Text>
                    <Badge size='sm' colorScheme='blue'>
                      {draft.subjects.length}
                    </Badge>
                  </HStack>
                  {draft.description && (
                    <Text fontSize='xs' color='gray.600'>
                      {draft.description}
                    </Text>
                  )}
                  {draft.aiTaxonomy && (
                    <HStack gap={1}>
                      <Text fontSize='xs' color='purple.600'>
                        🤖
                      </Text>
                      <Text fontSize='xs' fontWeight='medium'>
                        {draft.aiTaxonomy.primaryCategory}
                      </Text>
                      <Badge size='sm' colorScheme='purple'>
                        {draft.aiTaxonomy.confidence}%
                      </Badge>
                    </HStack>
                  )}
                </VStack>
                <HStack gap={1}>
                  <Menu.Root>
                    <Menu.Trigger asChild>
                      <IconButton
                        size='sm'
                        variant='ghost'
                        aria-label='Draft settings'
                      >
                        <FiSettings size={14} />
                      </IconButton>
                    </Menu.Trigger>
                    <Menu.Positioner>
                      <Menu.Content>
                        <Menu.Item value='edit'>
                          <FiEdit size={14} />
                          Edit Draft
                        </Menu.Item>
                        <Menu.Item
                          value='delete'
                          onClick={() => handleDeleteDraft(draft.id)}
                        >
                          <FiTrash2 size={14} />
                          Delete Draft
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Menu.Root>
                  <Button
                    size='sm'
                    colorScheme='green'
                    variant='outline'
                    onClick={() => handlePublishDraft(draft.id)}
                    disabled={draft.subjects.length === 0}
                  >
                    <FiSend size={14} />
                    Publish
                  </Button>
                </HStack>
              </HStack>

              {/* Metrics Summary */}
              <Box p={2} bg='black' borderRadius='md'>
                <Grid templateColumns='repeat(4, 1fr)' gap={3} fontSize='xs'>
                  <VStack gap={0}>
                    <Text color='gray.400'>Avg HR</Text>
                    <Text fontWeight='bold' color='white'>
                      {draft.metrics.avgHorizonRank.toFixed(2)}
                    </Text>
                  </VStack>
                  <VStack gap={0}>
                    <Text color='gray.400'>Avg TT</Text>
                    <Text fontWeight='bold' color='white'>
                      {Math.round(draft.metrics.avgTechTransfer)}
                    </Text>
                  </VStack>
                  <VStack gap={0}>
                    <Text color='gray.400'>Avg WS</Text>
                    <Text fontWeight='bold' color='white'>
                      {Math.round(draft.metrics.avgWhiteSpace)}
                    </Text>
                  </VStack>
                  <VStack gap={0}>
                    <Text color='gray.400'>Innovation</Text>
                    <Text fontWeight='bold' color='white'>
                      {Math.round(draft.metrics.innovationPotential)}
                    </Text>
                  </VStack>
                </Grid>
              </Box>

              {/* Visualization Tabs */}
              <HStack
                gap={1}
                borderBottom='1px solid'
                borderColor='gray.200'
                pb={2}
              >
                {[
                  {
                    id: 'list' as VisualizationType,
                    icon: FiList,
                    label: 'List',
                  },
                ].map(({ id, icon: Icon, label }) => (
                  <Button
                    key={id}
                    size='xs'
                    variant={currentViz === id ? 'solid' : 'ghost'}
                    onClick={() =>
                      setSelectedVisualization((prev) => ({
                        ...prev,
                        [draft.id]: id,
                      }))
                    }
                  >
                    <Icon size={12} />
                    {label}
                  </Button>
                ))}
              </HStack>

              {/* Visualization Area */}
              <Box flex='1' minH='250px'>
                <ListView
                  subjects={draft.subjects}
                  onRemoveSubject={(subjectId: string) =>
                    handleRemoveSubjectFromDraft(draft.id, subjectId)
                  }
                />

                {draft.subjects.length === 0 && (
                  <Flex
                    align='center'
                    justify='center'
                    minH='200px'
                    color='gray.500'
                  >
                    <VStack gap={2}>
                      <FiTarget size={24} />
                      <Text fontSize='sm' textAlign='center'>
                        Drag subjects here to build your draft
                      </Text>
                    </VStack>
                  </Flex>
                )}
              </Box>

              {/* Coherence & Risk Indicators */}
              {draft.subjects.length > 0 && (
                <HStack
                  justify='space-between'
                  align='center'
                  fontSize='xs'
                  pt={2}
                  borderTop='1px solid'
                  borderColor='gray.200'
                >
                  <HStack gap={2}>
                    <Text color='gray.500'>Coherence:</Text>
                    <HStack gap={1}>
                      <Progress.Root
                        value={draft.metrics.coherenceScore}
                        size='sm'
                        width='40px'
                        colorPalette={
                          draft.metrics.coherenceScore > 70
                            ? 'green'
                            : draft.metrics.coherenceScore > 40
                            ? 'orange'
                            : 'red'
                        }
                      >
                        <Progress.Track>
                          <Progress.Range />
                        </Progress.Track>
                      </Progress.Root>
                      <Text fontWeight='bold'>
                        {Math.round(draft.metrics.coherenceScore)}%
                      </Text>
                    </HStack>
                  </HStack>

                  <HStack gap={2}>
                    <Text color='gray.500'>Risk:</Text>
                    <Badge
                      size='sm'
                      colorScheme={
                        draft.metrics.competitionRisk > 70
                          ? 'red'
                          : draft.metrics.competitionRisk > 40
                          ? 'orange'
                          : 'green'
                      }
                    >
                      Competition: {Math.round(draft.metrics.competitionRisk)}%
                    </Badge>
                  </HStack>
                </HStack>
              )}
            </VStack>
          </DroppableDraftArea>
        </Card.Body>
      </Card.Root>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box p={6} bg='gray.50' minHeight='calc(100vh - 64px)'>
        <VStack gap={6} align='stretch'>
          {/* Header */}
          <Card.Root>
            <Card.Body p={6}>
              <VStack gap={1} align='start'>
                <Heading as='h1' size='xl'>
                  Whiteboard
                </Heading>
                <Text color='gray.600'>
                  Collect snapshots, organize into drafts, and publish to labs
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Metrics Overview */}
          <Card.Root>
            <Card.Body p={4}>
              <VStack gap={4} align='stretch'>
                <HStack justify='space-between' align='center'>
                  <Text fontWeight='medium'>Overall Metrics</Text>
                  <Grid
                    templateColumns='repeat(5, 1fr)'
                    gap={6}
                    flex='1'
                    maxW='600px'
                  >
                    <VStack gap={0}>
                      <Text fontSize='xs' color='gray.500'>
                        Total Subjects
                      </Text>
                      <Text fontWeight='bold'>
                        {overallMetrics.subjectCount}
                      </Text>
                    </VStack>
                    <VStack gap={0}>
                      <Text fontSize='xs' color='gray.500'>
                        Avg Horizon Rank
                      </Text>
                      <Text fontWeight='bold'>
                        {overallMetrics.avgHorizonRank.toFixed(2)}
                      </Text>
                    </VStack>
                    <VStack gap={0}>
                      <Text fontSize='xs' color='gray.500'>
                        Avg Tech Transfer
                      </Text>
                      <Text fontWeight='bold'>
                        {Math.round(overallMetrics.avgTechTransfer)}
                      </Text>
                    </VStack>
                    <VStack gap={0}>
                      <Text fontSize='xs' color='gray.500'>
                        Avg White Space
                      </Text>
                      <Text fontWeight='bold'>
                        {Math.round(overallMetrics.avgWhiteSpace)}
                      </Text>
                    </VStack>
                    <VStack gap={0}>
                      <Text fontSize='xs' color='gray.500'>
                        Innovation Potential
                      </Text>
                      <Text fontWeight='bold'>
                        {Math.round(overallMetrics.innovationPotential)}
                      </Text>
                    </VStack>
                  </Grid>
                </HStack>

                <Separator />

                {/* Search and Actions */}
                <HStack gap={4} align='center'>
                  <Box position='relative' flex='1' maxW='400px'>
                    <Input
                      ref={searchInputRef}
                      placeholder='Search and add subjects...'
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => searchQuery && setShowSearchDropdown(true)}
                      size='md'
                    />

                    {/* Search Dropdown */}
                    {showSearchDropdown && (
                      <Box
                        ref={searchDropdownRef}
                        position='absolute'
                        top='100%'
                        left='0'
                        right='0'
                        mt={1}
                        bg='white'
                        border='1px solid'
                        borderColor='gray.200'
                        borderRadius='md'
                        boxShadow='lg'
                        zIndex='20'
                        maxH='300px'
                        overflowY='auto'
                      >
                        {isSearching && (
                          <Flex align='center' justify='center' py={4}>
                            <Spinner size='sm' />
                            <Text ml={2} fontSize='sm'>
                              Searching...
                            </Text>
                          </Flex>
                        )}

                        {!isSearching && searchResults.length > 0 && (
                          <VStack gap={0} align='stretch'>
                            {searchResults.map((result) => (
                              <HStack
                                key={result.id}
                                p={3}
                                _hover={{ bg: 'gray.50' }}
                                justify='space-between'
                                cursor='pointer'
                                onClick={() =>
                                  handleAddSubjectFromSearch(result)
                                }
                              >
                                <VStack gap={1} align='start' flex='1'>
                                  <Text fontSize='sm' fontWeight='medium'>
                                    {result.name}
                                  </Text>
                                  <Text
                                    fontSize='xs'
                                    color='gray.500'
                                    lineClamp={1}
                                  >
                                    {result.description}
                                  </Text>
                                  <HStack gap={2}>
                                    <Badge size='sm'>
                                      HR: {result.horizonRank.toFixed(2)}
                                    </Badge>
                                    <Badge size='sm'>
                                      TT: {result.techTransfer}
                                    </Badge>
                                    <Badge size='sm'>
                                      WS: {result.whiteSpace}
                                    </Badge>
                                  </HStack>
                                </VStack>
                                <IconButton
                                  size='sm'
                                  variant='ghost'
                                  aria-label='Add subject'
                                >
                                  <FiPlus size={16} />
                                </IconButton>
                              </HStack>
                            ))}
                          </VStack>
                        )}

                        {!isSearching &&
                          searchResults.length === 0 &&
                          searchQuery && (
                            <Flex align='center' justify='center' py={4}>
                              <Text fontSize='sm' color='gray.500'>
                                No subjects found for "{searchQuery}"
                              </Text>
                            </Flex>
                          )}
                      </Box>
                    )}
                  </Box>

                  <Button
                    colorScheme='blue'
                    variant='outline'
                    onClick={() => setIsCreateDraftOpen(true)}
                  >
                    <FiPlus size={16} />
                    New Draft
                  </Button>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Main Content */}
          <HStack gap={6} align='flex-start'>
            {/* Available Subjects Sidebar */}
            <Box minW='280px' maxW='320px'>
              <Card.Root>
                <Card.Body p={4}>
                  <VStack gap={3} align='stretch'>
                    <HStack justify='space-between' align='center'>
                      <Text fontWeight='medium'>Available Subjects</Text>
                      <Badge colorScheme='gray'>
                        {availableSubjects.length}
                      </Badge>
                    </HStack>

                    {/* Filter and Sort Controls */}
                    <VStack gap={2} align='stretch'>
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
                            padding: '4px',
                            borderRadius: '4px',
                            border: '1px solid #E2E8F0',
                            fontSize: '12px',
                            width: '100%',
                          }}
                        >
                          <option value='horizon-high'>
                            Horizon Rank (High to Low)
                          </option>
                          <option value='horizon-low'>
                            Horizon Rank (Low to High)
                          </option>
                          <option value='techTransfer-high'>
                            Tech Transfer (High to Low)
                          </option>
                          <option value='techTransfer-low'>
                            Tech Transfer (Low to High)
                          </option>
                          <option value='whiteSpace-high'>
                            White Space (High to Low)
                          </option>
                          <option value='whiteSpace-low'>
                            White Space (Low to High)
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
                      />
                    </VStack>

                    <Box maxH='600px' overflowY='auto'>
                      {getFilteredAndSortedSubjects().length === 0 ? (
                        <Flex
                          align='center'
                          justify='center'
                          minH='200px'
                          color='gray.500'
                        >
                          <VStack gap={2}>
                            <FiSearch size={24} />
                            <Text fontSize='sm' textAlign='center'>
                              {filterText || sortMethod !== 'horizon-high'
                                ? 'No subjects match your filters.'
                                : 'No available subjects. Search to add more.'}
                            </Text>
                          </VStack>
                        </Flex>
                      ) : (
                        <VStack gap={2} align='stretch'>
                          {getFilteredAndSortedSubjects().map((subject) => (
                            <DraggableSubjectCard
                              key={subject.id}
                              subject={subject}
                              sourceType='unpooled'
                              showQuickAdd
                              onRemoveFromWhiteboard={
                                handleRemoveFromWhiteboard
                              }
                            />
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </Box>

            {/* Drafts Area */}
            <Box flex='1'>
              {drafts.length === 0 ? (
                <Card.Root>
                  <Card.Body p={8}>
                    <Flex align='center' justify='center' minH='400px'>
                      <VStack gap={4} textAlign='center'>
                        <FiTarget size={48} color='gray.400' />
                        <VStack gap={2}>
                          <Text
                            fontSize='lg'
                            fontWeight='medium'
                            color='gray.600'
                          >
                            No drafts yet
                          </Text>
                          <Text color='gray.500'>
                            Create your first draft to start organizing subjects
                          </Text>
                        </VStack>
                        <Button
                          colorScheme='blue'
                          onClick={() => setIsCreateDraftOpen(true)}
                        >
                          <FiPlus size={16} />
                          Create First Draft
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
                  {drafts.map((draft) => (
                    <DraftCard key={draft.id} draft={draft} />
                  ))}
                </Grid>
              )}
            </Box>
          </HStack>

          {/* Create Draft Dialog */}
          <Dialog.Root
            open={isCreateDraftOpen}
            onOpenChange={({ open }) => setIsCreateDraftOpen(open)}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Create New Draft</Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <IconButton size='sm' variant='ghost'>
                      <FiX />
                    </IconButton>
                  </Dialog.CloseTrigger>
                </Dialog.Header>

                <Dialog.Body>
                  <VStack gap={4} align='stretch'>
                    <Field.Root>
                      <Field.Label>Draft Name</Field.Label>
                      <Input
                        value={newDraftName}
                        onChange={(e) => setNewDraftName(e.target.value)}
                        placeholder='Enter draft name...'
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Description (Optional)</Field.Label>
                      <Textarea
                        value={newDraftDescription}
                        onChange={(e) => setNewDraftDescription(e.target.value)}
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
                      onClick={() => setIsCreateDraftOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      colorScheme='blue'
                      onClick={handleCreateDraft}
                      disabled={!newDraftName.trim()}
                    >
                      Create Draft
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
                setDraftsContainingSubject([]);
              }
            }}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
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
                      Are you sure you want to delete "{subjectToDelete?.name}"
                      from the whiteboard?
                    </Text>

                    {draftsContainingSubject.length > 0 && (
                      <Box
                        p={3}
                        bg='red.50'
                        borderRadius='md'
                        border='1px solid'
                        borderColor='red.200'
                      >
                        <Text
                          fontSize='sm'
                          color='red.800'
                          fontWeight='medium'
                          mb={2}
                        >
                          ⚠️ This subject is currently in{' '}
                          {draftsContainingSubject.length} draft(s):
                        </Text>
                        <VStack gap={1} align='start'>
                          {draftsContainingSubject.map((draft) => (
                            <Text key={draft.id} fontSize='sm' color='red.700'>
                              • {draft.name}
                            </Text>
                          ))}
                        </VStack>
                        <Text fontSize='sm' color='red.800' mt={2}>
                          Removing it from the whiteboard will also remove it
                          from these drafts.
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

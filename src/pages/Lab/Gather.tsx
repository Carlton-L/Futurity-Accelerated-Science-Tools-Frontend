import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  IconButton,
  Dialog,
  Checkbox,
  Tooltip,
  Spinner,
  Menu,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMove,
  FiTag,
  FiSearch,
  FiExternalLink,
  FiX,
  FiCheck,
  FiMoreHorizontal,
  FiEye,
} from 'react-icons/fi';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { LabSubject } from './types';

// Types for drag and drop
interface DragItem {
  type: string;
  id: string;
  categoryId: string;
}

interface SubjectSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  horizonRanking: number;
}

interface SubjectCategory {
  id: string;
  name: string;
  isDefault: boolean;
  subjects: LabSubject[];
}

interface GatherProps {
  labId: string;
}

// Drag and drop types
const ItemTypes = {
  SUBJECT: 'subject',
};

// Mock search results
const mockSearchResults: SubjectSearchResult[] = [
  {
    id: 'search-1',
    name: 'Quantum Computing',
    slug: 'quantum-computing',
    description: 'Computing systems that use quantum mechanical phenomena',
    horizonRanking: 0.73,
  },
  {
    id: 'search-2',
    name: 'Autonomous Vehicles',
    slug: 'autonomous-vehicles',
    description: 'Self-driving cars and transportation systems',
    horizonRanking: 0.82,
  },
  {
    id: 'search-3',
    name: 'Blockchain Technology',
    slug: 'blockchain-technology',
    description: 'Distributed ledger technology and cryptocurrencies',
    horizonRanking: 0.69,
  },
];

// Mock subjects data
const mockSubjects: LabSubject[] = [
  {
    id: 'subj-1',
    subjectId: 'ai-1',
    subjectName: 'Artificial Intelligence',
    subjectSlug: 'artificial-intelligence',
    addedAt: '2024-01-15T10:30:00Z',
    addedById: 'user-1',
    notes: 'Core AI technologies and applications',
  },
  {
    id: 'subj-2',
    subjectId: 'ml-1',
    subjectName: 'Machine Learning',
    subjectSlug: 'machine-learning',
    addedAt: '2024-01-16T14:20:00Z',
    addedById: 'user-2',
  },
  {
    id: 'subj-3',
    subjectId: 'cv-1',
    subjectName: 'Computer Vision',
    subjectSlug: 'computer-vision',
    addedAt: '2024-01-17T09:15:00Z',
    addedById: 'user-1',
    notes: 'Image processing and visual recognition',
  },
  {
    id: 'subj-4',
    subjectId: 'nlp-1',
    subjectName: 'Natural Language Processing',
    subjectSlug: 'natural-language-processing',
    addedAt: '2024-01-18T11:45:00Z',
    addedById: 'user-3',
  },
  {
    id: 'subj-5',
    subjectId: 'bio-1',
    subjectName: 'Biotechnology',
    subjectSlug: 'biotechnology',
    addedAt: '2024-01-19T16:30:00Z',
    addedById: 'user-2',
    notes: 'Genetic engineering and synthetic biology',
  },
];

// Subject Card Component
const SubjectCard: React.FC<{
  subject: LabSubject;
  categoryId: string;
  onSubjectClick: (subject: LabSubject) => void;
  onSubjectRemove: (subjectId: string, categoryId: string) => void;
  onSubjectView: (subject: LabSubject) => void;
}> = ({
  subject,
  categoryId,
  onSubjectClick,
  onSubjectRemove,
  onSubjectView,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SUBJECT,
    item: { type: ItemTypes.SUBJECT, id: subject.id, categoryId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Check if description needs truncation (rough estimate based on length)
  const needsTruncation = subject.notes && subject.notes.length > 60;
  const truncatedNotes = needsTruncation
    ? subject.notes?.substring(0, 60) + '...'
    : subject.notes;

  const handleRemoveSubject = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onSubjectRemove(subject.id, categoryId);
  };

  const handleViewSubject = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onSubjectView(subject);
  };

  return (
    <Card.Root
      ref={drag}
      size='sm'
      variant='outline'
      cursor='grab'
      opacity={isDragging ? 0.5 : 1}
      _hover={{ bg: 'gray.50', borderColor: 'blue.300' }}
      onClick={() => onSubjectClick(subject)}
      transition='all 0.2s'
      mb={3}
      w='100%'
    >
      <Card.Body p={3}>
        <VStack gap={2} align='stretch'>
          <HStack justify='space-between' align='flex-start'>
            <Text
              fontSize='sm'
              fontWeight='medium'
              color='blue.600'
              flex='1'
              lineHeight='1.3'
            >
              {subject.subjectName}
            </Text>
            <HStack gap={1}>
              {/* Drag handle - visual indicator only */}
              <Box color='gray.400' cursor='grab'>
                <FiMove size={10} />
              </Box>

              {/* Actions menu */}
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Box
                    as='button'
                    p={1}
                    borderRadius='sm'
                    color='gray.400'
                    _hover={{ color: 'gray.600', bg: 'gray.100' }}
                    cursor='pointer'
                    onClick={(e) => e.stopPropagation()}
                    aria-label='Subject actions'
                  >
                    <FiMoreHorizontal size={10} />
                  </Box>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value='view' onClick={handleViewSubject}>
                      <FiEye size={14} />
                      View Subject
                    </Menu.Item>
                    <Menu.Item
                      value='remove'
                      onClick={handleRemoveSubject}
                      color='red.500'
                    >
                      <FiTrash2 size={14} />
                      Remove from Lab
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            </HStack>
          </HStack>
          {subject.notes && (
            <Box>
              <Text fontSize='xs' color='gray.500' lineHeight='1.3'>
                {truncatedNotes}
                {needsTruncation && (
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Text
                        as='span'
                        textDecoration='underline'
                        color='blue.500'
                        cursor='help'
                        ml={1}
                      >
                        more
                      </Text>
                    </Tooltip.Trigger>
                    <Tooltip.Positioner>
                      <Tooltip.Content>
                        <Tooltip.Arrow />
                        <Text fontSize='xs' maxW='300px' whiteSpace='normal'>
                          {subject.notes}
                        </Text>
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Root>
                )}
              </Text>
            </Box>
          )}
          <Text fontSize='xs' color='gray.400'>
            {new Date(subject.addedAt).toLocaleDateString()}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

// Category Column Component (Kanban-style)
const CategoryColumn: React.FC<{
  category: SubjectCategory;
  onSubjectMove: (
    subjectId: string,
    fromCategoryId: string,
    toCategoryId: string
  ) => void;
  onCategoryRename: (categoryId: string, newName: string) => void;
  onCategoryDelete: (
    categoryId: string,
    moveSubjectsToUncategorized: boolean
  ) => void;
  onSubjectClick: (subject: LabSubject) => void;
  onSubjectRemove: (subjectId: string, categoryId: string) => void;
  onSubjectView: (subject: LabSubject) => void;
}> = ({
  category,
  onSubjectMove,
  onCategoryRename,
  onCategoryDelete,
  onSubjectClick,
  onSubjectRemove,
  onSubjectView,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [moveSubjectsToUncategorized, setMoveSubjectsToUncategorized] =
    useState(true);

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.SUBJECT,
    drop: (item: DragItem) => {
      if (item.categoryId !== category.id) {
        onSubjectMove(item.id, item.categoryId, category.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleRename = () => {
    if (editName.trim() && editName !== category.name) {
      onCategoryRename(category.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(category.name);
      setIsEditing(false);
    }
  };

  const handleTitleClick = () => {
    if (!category.isDefault) {
      setIsEditing(true);
    }
  };

  const handleDeleteConfirm = () => {
    onCategoryDelete(category.id, moveSubjectsToUncategorized);
    setIsDeleteDialogOpen(false);
    setMoveSubjectsToUncategorized(true); // Reset for next time
  };

  return (
    <>
      <Box
        ref={drop}
        minW='280px'
        maxW='320px'
        h='calc(100vh - 250px)'
        bg={isOver ? '#2a2a2a' : '#1a1a1a'}
        borderColor={isOver ? 'blue.400' : 'gray.600'}
        borderWidth='1px'
        borderRadius='md'
        transition='all 0.2s'
        display='flex'
        flexDirection='column'
      >
        {/* Column Header */}
        <Box p={4} borderBottom='1px solid' borderBottomColor='gray.600'>
          <HStack justify='space-between' align='center'>
            <HStack gap={2} flex='1'>
              <FiTag size={14} color='gray.400' />
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={handleKeyPress}
                  size='sm'
                  autoFocus
                  bg='gray.700'
                  borderColor='gray.500'
                  color='white'
                  _focus={{ borderColor: 'blue.400' }}
                  fontSize='sm'
                />
              ) : (
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  color='white'
                  cursor={category.isDefault ? 'default' : 'pointer'}
                  onClick={handleTitleClick}
                  _hover={category.isDefault ? {} : { color: 'blue.300' }}
                  transition='color 0.2s'
                  flex='1'
                >
                  {category.name}
                </Text>
              )}
              <Box
                bg='gray.600'
                color='gray.200'
                fontSize='xs'
                px={2}
                py={1}
                borderRadius='md'
                minW='20px'
                textAlign='center'
              >
                {category.subjects.length}
              </Box>
            </HStack>

            <HStack gap={1}>
              {/* Edit Button - Only show for non-default categories */}
              {!category.isDefault && !isEditing && (
                <Box
                  as='button'
                  p={1}
                  borderRadius='sm'
                  color='gray.400'
                  _hover={{ color: 'blue.300', bg: 'gray.700' }}
                  cursor='pointer'
                  onClick={() => setIsEditing(true)}
                  aria-label='Edit category name'
                >
                  <FiEdit2 size={12} />
                </Box>
              )}

              {/* Delete Button - Only show for non-default categories */}
              {!category.isDefault && (
                <Box
                  as='button'
                  p={1}
                  borderRadius='sm'
                  color='red.400'
                  _hover={{ color: 'red.300', bg: 'red.900' }}
                  cursor='pointer'
                  onClick={() => setIsDeleteDialogOpen(true)}
                  aria-label='Delete category'
                >
                  <FiTrash2 size={12} />
                </Box>
              )}
            </HStack>
          </HStack>
        </Box>

        {/* Subjects List */}
        <Box flex='1' p={3} overflowY='auto'>
          {category.subjects.length > 0 ? (
            <VStack gap={0} align='stretch'>
              {category.subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  categoryId={category.id}
                  onSubjectClick={onSubjectClick}
                  onSubjectRemove={onSubjectRemove}
                  onSubjectView={onSubjectView}
                />
              ))}
            </VStack>
          ) : (
            <Flex
              height='120px'
              align='center'
              justify='center'
              border='2px dashed'
              borderColor={isOver ? 'blue.400' : 'gray.600'}
              borderRadius='md'
              bg={isOver ? 'gray.700' : 'gray.800'}
              transition='all 0.2s'
            >
              <Text color='gray.400' fontSize='sm' textAlign='center'>
                {isOver ? 'Drop subject here' : 'No subjects'}
              </Text>
            </Flex>
          )}
        </Box>

        {/* Add Subject Button - Only for uncategorized */}
        {category.isDefault && (
          <Box p={3} borderTop='1px solid' borderTopColor='gray.600'>
            <Text fontSize='xs' color='gray.500' textAlign='center'>
              New subjects added here
            </Text>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={({ open }) => setIsDeleteDialogOpen(open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete Category</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align='stretch'>
                <Text>
                  Are you sure you want to delete the category "{category.name}
                  "?
                </Text>

                {category.subjects.length > 0 && (
                  <Box>
                    <Text fontSize='sm' color='gray.600' mb={2}>
                      This category contains {category.subjects.length} subject
                      {category.subjects.length !== 1 ? 's' : ''}.
                    </Text>
                    <Checkbox.Root
                      checked={moveSubjectsToUncategorized}
                      onCheckedChange={(details) =>
                        setMoveSubjectsToUncategorized(!!details.checked)
                      }
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label fontSize='sm'>
                        Move subjects to "Uncategorized" category
                      </Checkbox.Label>
                    </Checkbox.Root>
                    {!moveSubjectsToUncategorized && (
                      <Text fontSize='xs' color='red.500' mt={1}>
                        Warning: Subjects will be permanently removed from this
                        lab.
                      </Text>
                    )}
                  </Box>
                )}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <HStack gap={3}>
                <Button
                  variant='outline'
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button colorScheme='red' onClick={handleDeleteConfirm}>
                  Delete Category
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};

const Gather: React.FC<GatherProps> = ({ labId: _labId }) => {
  const [categories, setCategories] = useState<SubjectCategory[]>([
    {
      id: 'uncategorized',
      name: 'Uncategorized',
      isDefault: true,
      subjects: mockSubjects.slice(0, 2), // First 2 subjects
    },
    {
      id: 'cat-1',
      name: 'Core Technologies',
      isDefault: false,
      subjects: mockSubjects.slice(2, 4), // Next 2 subjects
    },
    {
      id: 'cat-2',
      name: 'Emerging Fields',
      isDefault: false,
      subjects: mockSubjects.slice(4), // Remaining subjects
    },
  ]);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // Subject search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SubjectSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Horizontal scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if a subject already exists in the lab
  const isSubjectInLab = (subjectId: string): boolean => {
    return categories.some((category) =>
      category.subjects.some((subject) => subject.subjectId === subjectId)
    );
  };

  // Handle auto-scroll when dragging near edges
  const handleDragScroll = useCallback((clientX: number) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollZone = 100; // pixels from edge to trigger scroll
    const scrollSpeed = 10;

    if (clientX < rect.left + scrollZone) {
      // Scroll left
      container.scrollLeft = Math.max(0, container.scrollLeft - scrollSpeed);
    } else if (clientX > rect.right - scrollZone) {
      // Scroll right
      container.scrollLeft = Math.min(
        container.scrollWidth - container.clientWidth,
        container.scrollLeft + scrollSpeed
      );
    }
  }, []);

  // Add mouse move listener for drag scrolling
  useEffect(() => {
    let animationFrame: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      animationFrame = requestAnimationFrame(() => {
        handleDragScroll(e.clientX);
      });
    };

    // Only add listener when dragging
    const handleDragStart = () => {
      document.addEventListener('mousemove', handleMouseMove);
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [handleDragScroll]);

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchQuery.trim().length > 0) {
      setShowSearchDropdown(true);
      // Re-trigger search if there are no results but there's a query
      if (searchResults.length === 0 && !isSearching) {
        handleSearchInputChange(searchQuery);
      }
    }
  };

  // Handle clearing search
  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSearchResults([]);
    setIsSearching(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Handle subject search with debouncing
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length > 0) {
      setIsSearching(true);
      setShowSearchDropdown(true);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // TODO: Replace with actual API call

          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 300));

          // Filter mock results based on search query
          const filteredResults = mockSearchResults.filter(
            (subject) =>
              subject.name.toLowerCase().includes(value.toLowerCase()) ||
              subject.description.toLowerCase().includes(value.toLowerCase())
          );

          setSearchResults(filteredResults);
          setIsSearching(false);
        } catch (error) {
          console.error('Search failed:', error);
          setIsSearching(false);
        }
      }, 100);
    } else {
      setShowSearchDropdown(false);
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Handle adding subject to uncategorized
  const handleAddSubject = (searchResult: SubjectSearchResult) => {
    // Check for duplicates
    if (isSubjectInLab(searchResult.id)) {
      console.log('Subject already exists in lab:', searchResult.name);
      return;
    }

    // Create new LabSubject from search result
    const newSubject: LabSubject = {
      id: `subj-${Date.now()}`,
      subjectId: searchResult.id,
      subjectName: searchResult.name,
      subjectSlug: searchResult.slug,
      addedAt: new Date().toISOString(),
      addedById: 'current-user', // TODO: Get from auth context
      notes: searchResult.description,
    };

    // Add to uncategorized category
    setCategories((prev) =>
      prev.map((cat) =>
        cat.isDefault
          ? { ...cat, subjects: [...cat.subjects, newSubject] }
          : cat
      )
    );

    // Clear search
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSearchResults([]);

    // TODO: Make API call to add subject to lab
    console.log(`Added "${searchResult.name}" to Uncategorized`);
  };

  // Handle navigation to full search results
  const handleGoToSearchResults = () => {
    // TODO: Navigate to search results page with current query
    console.log('Navigate to search results for:', searchQuery);
    setShowSearchDropdown(false);
  };

  // Close search dropdown when clicking outside
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle subject movement between categories
  const handleSubjectMove = useCallback(
    (subjectId: string, fromCategoryId: string, toCategoryId: string) => {
      setCategories((prev) => {
        const newCategories = [...prev];

        // Find the subject to move
        const fromCategory = newCategories.find(
          (cat) => cat.id === fromCategoryId
        );
        const toCategory = newCategories.find((cat) => cat.id === toCategoryId);
        const subjectIndex = fromCategory?.subjects.findIndex(
          (subj) => subj.id === subjectId
        );

        if (
          fromCategory &&
          toCategory &&
          subjectIndex !== undefined &&
          subjectIndex >= 0
        ) {
          const subject = fromCategory.subjects[subjectIndex];

          // Remove from source category
          fromCategory.subjects.splice(subjectIndex, 1);

          // Add to target category
          toCategory.subjects.push(subject);
        }

        return newCategories;
      });

      // TODO: Make API call to update subject category
      console.log(
        `Moved subject ${subjectId} from ${fromCategoryId} to ${toCategoryId}`
      );
    },
    []
  );

  // Handle category creation
  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: SubjectCategory = {
        id: `cat-${Date.now()}`,
        name: newCategoryName.trim(),
        isDefault: false,
        subjects: [],
      };

      setCategories((prev) => [...prev, newCategory]);
      setNewCategoryName('');
      setIsAddCategoryOpen(false);

      // TODO: Make API call to create category
      console.log('Created new category:', newCategory.name);
    }
  };

  // Handle category rename
  const handleCategoryRename = (categoryId: string, newName: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, name: newName } : cat
      )
    );

    // TODO: Make API call to rename category
    console.log(`Renamed category ${categoryId} to ${newName}`);
  };

  // Handle category deletion
  const handleCategoryDelete = (
    categoryId: string,
    moveSubjectsToUncategorized: boolean
  ) => {
    setCategories((prev) => {
      const newCategories = [...prev];
      const categoryToDelete = newCategories.find(
        (cat) => cat.id === categoryId
      );
      const uncategorized = newCategories.find((cat) => cat.isDefault);

      if (categoryToDelete && uncategorized) {
        if (moveSubjectsToUncategorized) {
          // Move all subjects to uncategorized
          uncategorized.subjects.push(...categoryToDelete.subjects);
        }
        // Note: If moveSubjectsToUncategorized is false, subjects are effectively deleted

        // Remove the category
        return newCategories.filter((cat) => cat.id !== categoryId);
      }

      return newCategories;
    });

    // TODO: Make API call to delete category
    console.log(
      `Deleted category ${categoryId}, moved subjects to uncategorized: ${moveSubjectsToUncategorized}`
    );
  };

  // Handle subject removal
  const handleSubjectRemove = (subjectId: string, categoryId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subjects: cat.subjects.filter(
                (subject) => subject.id !== subjectId
              ),
            }
          : cat
      )
    );

    // TODO: Make API call to remove subject from lab
    console.log(`Removed subject ${subjectId} from category ${categoryId}`);
  };

  // Handle subject view
  const handleSubjectView = (subject: LabSubject) => {
    // TODO: Navigate to subject page
    console.log(`Navigate to subject: /subject/${subject.subjectSlug}`);
  };

  // Handle subject click
  const handleSubjectClick = (subject: LabSubject) => {
    // TODO: Navigate to subject detail or open subject modal
    console.log('Clicked subject:', subject.subjectName);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <VStack gap={6} align='stretch'>
        {/* Header */}
        <HStack justify='space-between' align='center'>
          <HStack gap={4} flex='1'>
            <Heading as='h2' size='lg'>
              Subjects
            </Heading>

            {/* Subject Search Input */}
            <Box position='relative' flex='1' maxW='400px'>
              <Box position='relative'>
                <Input
                  ref={searchInputRef}
                  placeholder='Search and add subjects...'
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  size='md'
                  bg='gray.700'
                  borderColor='gray.500'
                  color='white'
                  _placeholder={{ color: 'gray.400' }}
                  _focus={{ borderColor: 'blue.400' }}
                  pr={searchQuery.length > 0 ? '40px' : '12px'}
                />

                {/* Clear button */}
                {searchQuery.length > 0 && (
                  <IconButton
                    position='absolute'
                    right='8px'
                    top='50%'
                    transform='translateY(-50%)'
                    size='xs'
                    variant='ghost'
                    aria-label='Clear search'
                    onClick={handleClearSearch}
                    color='gray.400'
                    _hover={{ color: 'gray.200' }}
                  >
                    <FiX size={14} />
                  </IconButton>
                )}
              </Box>

              {/* Search Results Dropdown */}
              {showSearchDropdown && (
                <Box
                  ref={searchDropdownRef}
                  position='absolute'
                  top='100%'
                  left='0'
                  right='0'
                  mt={1}
                  bg='gray.800'
                  border='1px solid'
                  borderColor='gray.600'
                  borderRadius='md'
                  boxShadow='lg'
                  zIndex='20'
                  maxH='300px'
                  overflowY='auto'
                >
                  {/* Go to Search Results Button */}
                  <Button
                    w='100%'
                    variant='ghost'
                    justifyContent='flex-start'
                    onClick={handleGoToSearchResults}
                    color='blue.300'
                    _hover={{ bg: 'gray.700' }}
                    borderRadius='0'
                    borderBottom='1px solid'
                    borderBottomColor='gray.600'
                    py={3}
                  >
                    <FiSearch size={16} />
                    <Text ml={2}>
                      View all search results for "{searchQuery}"
                    </Text>
                    <FiExternalLink size={14} />
                  </Button>

                  {/* Loading State */}
                  {isSearching && (
                    <Flex align='center' justify='center' py={4}>
                      <Spinner size='sm' color='blue.400' />
                      <Text ml={2} fontSize='sm' color='gray.400'>
                        Searching...
                      </Text>
                    </Flex>
                  )}

                  {/* Search Results */}
                  {!isSearching && searchResults.length > 0 && (
                    <VStack gap={0} align='stretch'>
                      {searchResults.map((result) => {
                        const alreadyInLab = isSubjectInLab(result.id);

                        return (
                          <HStack
                            key={result.id}
                            p={3}
                            _hover={{ bg: 'gray.700' }}
                            justify='space-between'
                            opacity={alreadyInLab ? 0.6 : 1}
                          >
                            <VStack gap={1} align='stretch' flex='1'>
                              <HStack gap={2}>
                                <Text
                                  fontSize='sm'
                                  fontWeight='medium'
                                  color='white'
                                >
                                  {result.name}
                                </Text>
                                <Box
                                  bg='blue.600'
                                  color='white'
                                  fontSize='xs'
                                  px={2}
                                  py={1}
                                  borderRadius='md'
                                >
                                  {result.horizonRanking.toFixed(2)}
                                </Box>
                                {alreadyInLab && (
                                  <Box
                                    bg='green.600'
                                    color='white'
                                    fontSize='xs'
                                    px={2}
                                    py={1}
                                    borderRadius='md'
                                  >
                                    In Lab
                                  </Box>
                                )}
                              </HStack>
                              <Text fontSize='xs' color='gray.400' truncate>
                                {result.description}
                              </Text>
                            </VStack>

                            <Button
                              size='sm'
                              variant='ghost'
                              colorScheme={alreadyInLab ? 'gray' : 'green'}
                              aria-label={
                                alreadyInLab
                                  ? `${result.name} already in lab`
                                  : `Add ${result.name} to lab`
                              }
                              onClick={() => {
                                if (!alreadyInLab) {
                                  handleAddSubject(result);
                                }
                              }}
                              color={alreadyInLab ? 'gray.400' : 'green.400'}
                              _hover={
                                alreadyInLab
                                  ? {}
                                  : { color: 'green.300', bg: 'green.900' }
                              }
                              minW='auto'
                              p={2}
                              cursor={alreadyInLab ? 'not-allowed' : 'pointer'}
                              disabled={alreadyInLab}
                            >
                              {alreadyInLab ? (
                                <FiCheck size={16} />
                              ) : (
                                <FiPlus size={16} />
                              )}
                            </Button>
                          </HStack>
                        );
                      })}
                    </VStack>
                  )}

                  {/* No Results */}
                  {!isSearching &&
                    searchResults.length === 0 &&
                    searchQuery.length > 0 && (
                      <Flex align='center' justify='center' py={4}>
                        <Text fontSize='sm' color='gray.400'>
                          No subjects found for "{searchQuery}"
                        </Text>
                      </Flex>
                    )}
                </Box>
              )}
            </Box>
          </HStack>

          <HStack gap={3}>
            <Button
              size='md'
              colorScheme='blue'
              variant='outline'
              onClick={() => setIsAddCategoryOpen(true)}
            >
              <FiPlus size={16} />
              New Category
            </Button>
          </HStack>
        </HStack>

        {/* Kanban Board - Horizontal Scrolling Categories */}
        <Box
          ref={scrollContainerRef}
          w='100%'
          overflowX='auto'
          overflowY='hidden'
          pb={4}
          css={{
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#2d3748',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#4a5568',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#718096',
            },
          }}
        >
          <HStack gap={4} align='flex-start' minW='fit-content' pb={2}>
            {categories.map((category) => (
              <CategoryColumn
                key={category.id}
                category={category}
                onSubjectMove={handleSubjectMove}
                onCategoryRename={handleCategoryRename}
                onCategoryDelete={handleCategoryDelete}
                onSubjectClick={handleSubjectClick}
                onSubjectRemove={handleSubjectRemove}
                onSubjectView={handleSubjectView}
              />
            ))}

            {/* Add New Category Column */}
            <Box
              minW='280px'
              maxW='320px'
              h='200px'
              border='2px dashed'
              borderColor='gray.400'
              borderRadius='md'
              display='flex'
              alignItems='center'
              justifyContent='center'
              cursor='pointer'
              _hover={{ borderColor: 'blue.400', bg: 'gray.50' }}
              onClick={() => setIsAddCategoryOpen(true)}
              transition='all 0.2s'
            >
              <VStack gap={2}>
                <Box color='gray.400'>
                  <FiPlus size={24} />
                </Box>
                <Text color='gray.500' fontSize='sm' fontWeight='medium'>
                  Add Category
                </Text>
              </VStack>
            </Box>
          </HStack>
        </Box>

        {/* Add Category Dialog */}
        <Dialog.Root
          open={isAddCategoryOpen}
          onOpenChange={({ open }) => setIsAddCategoryOpen(open)}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Create New Category</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <VStack gap={4} align='stretch'>
                  <Box>
                    <Text fontSize='sm' fontWeight='medium' mb={2}>
                      Category Name
                    </Text>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder='Enter category name...'
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleCreateCategory()
                      }
                    />
                  </Box>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer>
                <HStack gap={3}>
                  <Button
                    variant='outline'
                    onClick={() => setIsAddCategoryOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button colorScheme='blue' onClick={handleCreateCategory}>
                    Create Category
                  </Button>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </VStack>
    </DndProvider>
  );
};

export default Gather;

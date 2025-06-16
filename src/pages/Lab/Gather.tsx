import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Dialog,
  Spinner,
  Field,
  Flex,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { debounce } from 'lodash';
import type { LabSubject, SubjectSearchResult, SubjectCategory } from './types';
import { CategoryUtils } from './types';
import SubjectCard from './SubjectCard';
import { useToast, ToastDisplay } from './ToastSystem';
import { SubjectSearch } from './SubjectSearch';
import { CategoryColumn } from './CategoryColumn';

interface GatherProps {
  labId: string;
}

// TODO: Remove mock data once API is working
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

const mockCategories: SubjectCategory[] = [
  {
    id: 'uncategorized',
    name: 'Uncategorized',
    type: 'default',
    subjects: mockSubjects.slice(0, 2),
    description: 'Default category for new subjects',
  },
  {
    id: 'exclude',
    name: 'Exclude',
    type: 'exclude',
    subjects: [mockSubjects[4]], // Move one subject to exclude for demo
    description: 'Subjects to exclude from analysis and search results',
  },
  {
    id: 'cat-1',
    name: 'Core Technologies',
    type: 'custom',
    subjects: mockSubjects.slice(2, 4),
  },
];

/**
 * Custom hook for search functionality
 */
const useSubjectSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SubjectSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const performSearch = useCallback(
    async (query: string): Promise<SubjectSearchResult[]> => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockSearchResults.filter(
        (subject) =>
          subject.name.toLowerCase().includes(query.toLowerCase()) ||
          subject.description.toLowerCase().includes(query.toLowerCase())
      );
    },
    []
  );

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query.trim()) {
          setSearchResults([]);
          setIsSearching(false);
          setShowSearchDropdown(false);
          return;
        }

        setIsSearching(true);
        setShowSearchDropdown(true);

        try {
          const results = await performSearch(query);
          setSearchResults(results);
        } catch (searchError) {
          console.error('Search failed:', searchError);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300),
    [performSearch]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setShowSearchDropdown(false);
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return {
    searchQuery,
    searchResults,
    isSearching,
    showSearchDropdown,
    setShowSearchDropdown,
    handleSearchChange,
    clearSearch,
  };
};

/**
 * Main Gather component - manages lab subjects and categories
 */
const Gather: React.FC<GatherProps> = ({ labId }) => {
  const { toast, toasts, removeToast, executeUndo } = useToast();
  const [userRole] = useState<'reader' | 'editor' | 'admin'>('editor');
  const [categories, setCategories] =
    useState<SubjectCategory[]>(mockCategories);
  const [isLoading, setIsLoading] = useState(false);

  // Category creation state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Search functionality
  const {
    searchQuery,
    searchResults,
    isSearching,
    showSearchDropdown,
    setShowSearchDropdown,
    handleSearchChange,
    clearSearch,
  } = useSubjectSearch();

  // Load initial lab data
  useEffect(() => {
    const loadLabData = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCategories(mockCategories);
      } catch (loadError) {
        console.error('Failed to load lab data:', loadError);
        toast({
          title: 'Error loading lab data',
          description: 'Please refresh the page to try again.',
          status: 'error',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLabData();
  }, [labId, toast]);

  // Validation for category names
  const validateCategoryName = useCallback(
    (name: string): string => {
      const trimmedName = name.trim();
      if (!trimmedName) return 'Category name cannot be empty';
      if (trimmedName.length < 2)
        return 'Category name must be at least 2 characters';
      if (trimmedName.length > 50)
        return 'Category name cannot exceed 50 characters';

      const existingNames = categories.map((cat) => cat.name.toLowerCase());
      if (existingNames.includes(trimmedName.toLowerCase())) {
        return 'A category with this name already exists';
      }
      return '';
    },
    [categories]
  );

  // Check if subject already exists in lab
  const isSubjectInLab = useCallback(
    (subjectId: string): boolean => {
      return categories.some((category) =>
        category.subjects.some((subject) => subject.subjectId === subjectId)
      );
    },
    [categories]
  );

  // Handle subject movement between categories
  const handleSubjectMove = useCallback(
    async (subjectId: string, fromCategoryId: string, toCategoryId: string) => {
      if (userRole === 'reader') {
        toast({
          title: 'Permission denied',
          description: 'You do not have permission to move subjects.',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      const previousCategories = [...categories];
      setCategories((prev) => {
        const newCategories = [...prev];
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
          fromCategory.subjects.splice(subjectIndex, 1);
          toCategory.subjects.push(subject);
        }
        return newCategories;
      });

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log(
          `Moved subject ${subjectId} from ${fromCategoryId} to ${toCategoryId}`
        );
      } catch (moveError) {
        setCategories(previousCategories);
        toast({
          title: 'Failed to move subject',
          description: 'The subject could not be moved. Please try again.',
          status: 'error',
          duration: 5000,
        });
        console.error('Failed to move subject:', moveError);
      }
    },
    [userRole, categories, toast]
  );

  // Handle adding subject to lab
  const handleAddSubject = useCallback(
    async (searchResult: SubjectSearchResult) => {
      if (userRole === 'reader') {
        toast({
          title: 'Permission denied',
          description: 'You do not have permission to add subjects.',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      if (isSubjectInLab(searchResult.id)) {
        toast({
          title: 'Subject already exists',
          description: `"${searchResult.name}" is already in this lab.`,
          status: 'info',
          duration: 3000,
        });
        return;
      }

      const newSubject: LabSubject = {
        id: `subj-${Date.now()}`,
        subjectId: searchResult.id,
        subjectName: searchResult.name,
        subjectSlug: searchResult.slug,
        addedAt: new Date().toISOString(),
        addedById: 'current-user',
        notes: searchResult.description,
      };

      const previousCategories = [...categories];
      setCategories((prev) =>
        prev.map((cat) =>
          CategoryUtils.isDefault(cat)
            ? { ...cat, subjects: [...cat.subjects, newSubject] }
            : cat
        )
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        clearSearch();
        toast({
          title: 'Subject added',
          description: `"${searchResult.name}" has been added to your lab.`,
          status: 'success',
          duration: 3000,
        });
      } catch (addError) {
        setCategories(previousCategories);
        toast({
          title: 'Failed to add subject',
          description: 'The subject could not be added. Please try again.',
          status: 'error',
          duration: 5000,
        });
        console.error('Failed to add subject:', addError);
      }
    },
    [userRole, isSubjectInLab, categories, clearSearch, toast]
  );

  // Handle category creation
  const handleCreateCategory = useCallback(async () => {
    const error = validateCategoryName(newCategoryName);
    if (error) {
      setCategoryError(error);
      return;
    }

    setIsCreatingCategory(true);
    const trimmedName = newCategoryName.trim();

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newCategory: SubjectCategory = {
        id: `cat-${Date.now()}`,
        name: trimmedName,
        type: 'custom',
        subjects: [],
      };

      setCategories((prev) => [...prev, newCategory]);
      setNewCategoryName('');
      setCategoryError('');
      setIsAddCategoryOpen(false);

      toast({
        title: 'Category created',
        description: `"${trimmedName}" category has been created.`,
        status: 'success',
        duration: 3000,
      });
    } catch (createError) {
      toast({
        title: 'Failed to create category',
        description: 'The category could not be created. Please try again.',
        status: 'error',
        duration: 5000,
      });
      console.error('Failed to create category:', createError);
    } finally {
      setIsCreatingCategory(false);
    }
  }, [validateCategoryName, newCategoryName, toast]);

  // Handle category rename
  const handleCategoryRename = useCallback(
    async (categoryId: string, newName: string) => {
      const previousCategories = [...categories];

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, name: newName } : cat
        )
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast({
          title: 'Category renamed',
          description: `Category has been renamed to "${newName}".`,
          status: 'success',
          duration: 3000,
        });
      } catch (renameError) {
        setCategories(previousCategories);
        toast({
          title: 'Failed to rename category',
          description: 'The category could not be renamed. Please try again.',
          status: 'error',
          duration: 5000,
        });
        console.error('Failed to rename category:', renameError);
        throw renameError;
      }
    },
    [categories, toast]
  );

  // Handle category deletion with undo functionality
  const handleCategoryDelete = useCallback(
    async (categoryId: string, moveSubjectsToUncategorized: boolean) => {
      const previousCategories = [...categories];
      const categoryToDelete = categories.find((cat) => cat.id === categoryId);

      if (!categoryToDelete) return;

      const deletedCategorySubjects = [...categoryToDelete.subjects];

      setCategories((prev) => {
        const newCategories = [...prev];
        const categoryToDelete = newCategories.find(
          (cat) => cat.id === categoryId
        );
        const uncategorized = newCategories.find((cat) =>
          CategoryUtils.isDefault(cat)
        );

        if (categoryToDelete && uncategorized) {
          if (moveSubjectsToUncategorized) {
            uncategorized.subjects.push(...categoryToDelete.subjects);
          }
          return newCategories.filter((cat) => cat.id !== categoryId);
        }
        return newCategories;
      });

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        toast({
          title: 'Category deleted',
          description: moveSubjectsToUncategorized
            ? `"${categoryToDelete.name}" deleted. ${categoryToDelete.subjects.length} subjects moved to Uncategorized.`
            : `"${categoryToDelete.name}" and its ${categoryToDelete.subjects.length} subjects deleted.`,
          status: 'info',
          undoAction: () => {
            setCategories((currentCategories) => {
              const newCategories = [...currentCategories];

              if (moveSubjectsToUncategorized) {
                const uncategorized = newCategories.find((cat) =>
                  CategoryUtils.isDefault(cat)
                );
                if (uncategorized) {
                  uncategorized.subjects = uncategorized.subjects.filter(
                    (subject) =>
                      !deletedCategorySubjects.some(
                        (deletedSubject) => deletedSubject.id === subject.id
                      )
                  );
                }
              }

              const restoredCategory: SubjectCategory = {
                ...categoryToDelete,
                subjects: deletedCategorySubjects,
              };

              return [...newCategories, restoredCategory];
            });

            toast({
              title: 'Category restored',
              description: `"${categoryToDelete.name}" has been restored with all its subjects.`,
              status: 'success',
              duration: 3000,
            });
          },
          undoLabel: 'Undo Delete',
        });
      } catch (deleteError) {
        setCategories(previousCategories);
        toast({
          title: 'Failed to delete category',
          description: 'The category could not be deleted. Please try again.',
          status: 'error',
          duration: 5000,
        });
        console.error('Failed to delete category:', deleteError);
        throw deleteError;
      }
    },
    [categories, toast]
  );

  // Handle subject removal with undo functionality
  const handleSubjectRemove = useCallback(
    async (subjectId: string, categoryId: string) => {
      if (userRole === 'reader') {
        toast({
          title: 'Permission denied',
          description: 'You do not have permission to remove subjects.',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      const previousCategories = [...categories];
      const category = categories.find((cat) => cat.id === categoryId);
      const subject = category?.subjects.find((subj) => subj.id === subjectId);

      if (!subject) return;

      const subjectToRemove = { ...subject };
      const originalCategoryId = categoryId;

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

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        toast({
          title: 'Subject removed',
          description: `"${subject.subjectName}" removed from ${
            category?.name || 'the lab'
          }.`,
          status: 'info',
          undoAction: () => {
            setCategories((currentCategories) => {
              return currentCategories.map((cat) =>
                cat.id === originalCategoryId
                  ? {
                      ...cat,
                      subjects: [...cat.subjects, subjectToRemove],
                    }
                  : cat
              );
            });

            toast({
              title: 'Subject restored',
              description: `"${subject.subjectName}" has been restored to ${
                category?.name || 'the lab'
              }.`,
              status: 'success',
              duration: 3000,
            });
          },
          undoLabel: 'Undo Remove',
        });
      } catch (removeError) {
        setCategories(previousCategories);
        toast({
          title: 'Failed to remove subject',
          description: 'The subject could not be removed. Please try again.',
          status: 'error',
          duration: 5000,
        });
        console.error('Failed to remove subject:', removeError);
      }
    },
    [userRole, categories, toast]
  );

  // Handle subject view and click
  const handleSubjectView = useCallback((subject: LabSubject) => {
    console.log(`Navigate to subject: /subject/${subject.subjectSlug}`);
  }, []);

  const handleSubjectClick = useCallback((subject: LabSubject) => {
    console.log('Clicked subject:', subject.subjectName);
  }, []);

  const handleGoToSearchResults = useCallback(() => {
    console.log('Navigate to search results for:', searchQuery);
    setShowSearchDropdown(false);
  }, [searchQuery, setShowSearchDropdown]);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.trim().length > 0) {
      setShowSearchDropdown(true);
    }
  }, [searchQuery, setShowSearchDropdown]);

  const handleCategoryNameChange = useCallback(
    (value: string) => {
      setNewCategoryName(value);
      if (categoryError) {
        const error = validateCategoryName(value);
        if (!error) setCategoryError('');
      }
    },
    [categoryError, validateCategoryName]
  );

  const handleDialogClose = useCallback(() => {
    setIsAddCategoryOpen(false);
    setNewCategoryName('');
    setCategoryError('');
  }, []);

  // Memoized subject card renderer
  const renderSubjectCard = useCallback(
    (subject: LabSubject) => {
      const categoryId =
        categories.find((cat) => cat.subjects.some((s) => s.id === subject.id))
          ?.id || '';

      return (
        <SubjectCard
          subject={subject}
          categoryId={categoryId}
          onSubjectClick={handleSubjectClick}
          onSubjectRemove={handleSubjectRemove}
          onSubjectView={handleSubjectView}
        />
      );
    },
    [categories, handleSubjectClick, handleSubjectRemove, handleSubjectView]
  );

  // Early return if loading
  if (isLoading) {
    return (
      <VStack gap={4} align='stretch'>
        <HStack justify='space-between' align='center'>
          <Heading as='h2' size='lg'>
            Subjects
          </Heading>
        </HStack>
        <Flex justify='center' align='center' minH='400px'>
          <VStack gap={3}>
            <Spinner size='lg' color='blue.500' />
            <Text color='gray.500'>Loading lab data...</Text>
          </VStack>
        </Flex>
      </VStack>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <VStack gap={4} align='stretch'>
        {/* Header with search */}
        <HStack justify='space-between' align='center'>
          <HStack gap={4} flex='1'>
            <Heading as='h2' size='lg'>
              Subjects
            </Heading>

            <SubjectSearch
              searchQuery={searchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              showSearchDropdown={showSearchDropdown}
              userRole={userRole}
              isSubjectInLab={isSubjectInLab}
              onSearchChange={handleSearchChange}
              onSearchFocus={handleSearchFocus}
              onClearSearch={clearSearch}
              onAddSubject={handleAddSubject}
              onGoToSearchResults={handleGoToSearchResults}
              setShowSearchDropdown={setShowSearchDropdown}
            />
          </HStack>

          {/* Action buttons */}
          <HStack gap={3}>
            {userRole !== 'reader' && (
              <Button
                size='md'
                colorScheme='blue'
                variant='outline'
                onClick={() => setIsAddCategoryOpen(true)}
                disabled={isLoading}
              >
                <FiPlus size={16} />
                New Category
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Kanban Board */}
        <Box position='relative' w='100%'>
          <Box
            w='100%'
            overflowX='auto'
            overflowY='hidden'
            pb={4}
            pt={2}
            css={{
              '&::-webkit-scrollbar': { height: '8px' },
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
                  renderSubjectCard={renderSubjectCard}
                  isLoading={isLoading}
                  userRole={userRole}
                />
              ))}

              {/* Add New Category Column */}
              {userRole !== 'reader' && (
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
              )}
            </HStack>
          </Box>
        </Box>

        {/* Add Category Dialog */}
        <Dialog.Root
          open={isAddCategoryOpen}
          onOpenChange={({ open }) => !open && handleDialogClose()}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Create New Category</Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <VStack gap={4} align='stretch'>
                  <Field.Root invalid={!!categoryError}>
                    <Field.Label fontSize='sm' fontWeight='medium'>
                      Category Name
                    </Field.Label>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => handleCategoryNameChange(e.target.value)}
                      placeholder='Enter category name...'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateCategory();
                      }}
                      autoFocus
                      disabled={isCreatingCategory}
                    />
                    {categoryError && (
                      <Field.ErrorText fontSize='sm'>
                        {categoryError}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer>
                <HStack gap={3}>
                  <Button
                    variant='outline'
                    onClick={handleDialogClose}
                    disabled={isCreatingCategory}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme='blue'
                    onClick={handleCreateCategory}
                    disabled={
                      !!categoryError ||
                      !newCategoryName.trim() ||
                      isCreatingCategory
                    }
                  >
                    Create Category
                  </Button>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Toast Container */}
        <ToastDisplay
          toasts={toasts}
          onRemove={removeToast}
          onUndo={executeUndo}
        />
      </VStack>
    </DndProvider>
  );
};

export default Gather;

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
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
  IconButton,
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import { FaFolder } from 'react-icons/fa6';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import types
import type {
  LabSubject,
  SubjectSearchResult,
  SubjectCategory,
  HorizonItem,
} from './types';
import { CategoryUtils } from './types';

// Import components
import SubjectCard from './SubjectCard';
import { useToast, ToastDisplay } from './ToastSystem';
import { SubjectSearch } from './SubjectSearch';
import { CategoryColumn } from './CategoryColumn';
import { HorizontalDropZone } from './HorizontalDropZone';
import { PhylogenyTree } from '../../components/charts/PhylogenyTree';
import type { PhylogenyData } from '../../components/charts/PhylogenyTree';
import HorizonChartSection from './Horizons/HorizonChartSection';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Import services
import { subcategoryService } from '../../services/subcategoryService';

// Import horizon chart utilities
import { convertHorizonValue, getCategoryNumber } from './utils/analyzeUtils';

// Component Props Interface
interface GatherProps {
  labId: string;
  labName?: string; // Added to get lab name for phylogeny tree
  categories: SubjectCategory[];
  onCategoriesUpdate: (categories: SubjectCategory[]) => void;
  onRefreshLab: () => Promise<void>;
}

// Search API Response Interface - Updated to match working implementation
interface SearchAPIResponse {
  results: {
    keyword: string;
    exact_match?: {
      _id: string | { $oid: string };
      ent_name: string;
      ent_fsid: string;
      ent_summary: string;
      [key: string]: unknown;
    };
    rows: Array<{
      _id: string | { $oid: string };
      ent_name: string;
      ent_fsid: string;
      ent_summary: string;
    }>;
    count: number;
  };
}

// User Role Type - Fixed to match SubjectSearch and CategoryColumn expectations
type UserRole = 'reader' | 'editor' | 'admin';

/**
 * Custom hook for search functionality - Updated to match whiteboard implementation
 */
const useSubjectSearch = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SubjectSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const { token, logout, isLoading: authLoading, isAuthenticated } = useAuth();

  const performSearch = useCallback(
    async (keyword: string): Promise<SubjectSearchResult[]> => {
      if (!keyword.trim()) return [];

      if (authLoading) {
        throw new Error(
          'Authentication is still loading. Please wait a moment and try again.'
        );
      }

      if (!isAuthenticated || !token) {
        throw new Error(
          'You must be logged in to search. Please log in and try again.'
        );
      }

      setIsSearching(true);

      try {
        const encodedKeyword = encodeURIComponent(keyword.trim());
        const response = await fetch(
          `https://tools.futurity.science/api/search/subjects?keyword=${encodedKeyword}&limit=300`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 401) {
          await logout();
          throw new Error('Your session has expired. Please log in again.');
        }

        if (response.status === 403) {
          throw new Error('You do not have permission to search subjects.');
        }

        if (!response.ok) {
          throw new Error(
            `Search failed: ${response.status} ${response.statusText}`
          );
        }

        const data: SearchAPIResponse = await response.json();
        const results: SubjectSearchResult[] = [];

        // Helper function to extract ID from MongoDB response
        const extractId = (idField: string | { $oid: string }): string => {
          if (typeof idField === 'string') {
            return idField;
          }
          return idField.$oid || idField.toString();
        };

        // Add exact match first if it exists
        if (data.results.exact_match) {
          results.push({
            _id: extractId(data.results.exact_match._id),
            ent_name: data.results.exact_match.ent_name,
            ent_fsid: data.results.exact_match.ent_fsid,
            ent_summary: data.results.exact_match.ent_summary,
          });
        }

        // Add other results, avoiding duplicates
        const exactMatchFsid = data.results.exact_match?.ent_fsid;
        for (const row of data.results.rows) {
          if (row.ent_fsid !== exactMatchFsid) {
            results.push({
              _id: extractId(row._id),
              ent_name: row.ent_name,
              ent_fsid: row.ent_fsid,
              ent_summary: row.ent_summary,
            });
          }
        }

        return results;
      } catch (error) {
        console.error('Subject search failed:', error);
        throw error;
      } finally {
        setIsSearching(false);
      }
    },
    [token, logout, authLoading, isAuthenticated]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSearchExecute = useCallback(
    async (query: string) => {
      try {
        const results = await performSearch(query);
        setSearchResults(results);
        setShowSearchDropdown(true);
      } catch (error) {
        console.error('Search execution failed:', error);
        setSearchResults([]);
        setShowSearchDropdown(false);
        throw error;
      }
    },
    [performSearch]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setShowSearchDropdown(false);
  }, []);

  return {
    searchQuery,
    searchResults,
    isSearching,
    showSearchDropdown,
    setShowSearchDropdown,
    handleSearchChange,
    handleSearchExecute,
    clearSearch,
  };
};

/**
 * Custom hook for category management - Updated to use new APIs
 */
const useCategoryManagement = (
  categories: SubjectCategory[],
  onCategoriesUpdate: (categories: SubjectCategory[]) => void,
  labId: string,
  token: string | null,
  toast: (options: {
    title: string;
    description?: string;
    status: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }) => void
) => {
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string>('');
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);

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

  const handleCreateCategory = useCallback(async () => {
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to perform this action.',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const error = validateCategoryName(newCategoryName);
    if (error) {
      setCategoryError(error);
      return;
    }

    setIsCreatingCategory(true);
    const trimmedName = newCategoryName.trim();

    try {
      // Use new subcategory service
      const newSubcategoryData = await subcategoryService.createSubcategory(
        trimmedName,
        labId,
        token
      );

      // Update frontend state with the new category using the uniqueID from API
      const newCategory: SubjectCategory = {
        id: newSubcategoryData.uniqueID, // Use uniqueID as the key
        name: trimmedName,
        type: 'custom',
        subjects: [],
      };

      onCategoriesUpdate([...categories, newCategory]);
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
        description:
          createError instanceof Error
            ? createError.message
            : 'The category could not be created. Please try again.',
        status: 'error',
        duration: 5000,
      });
      console.error('Failed to create category:', createError);
    } finally {
      setIsCreatingCategory(false);
    }
  }, [
    validateCategoryName,
    newCategoryName,
    toast,
    categories,
    onCategoriesUpdate,
    labId,
    token,
  ]);

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

  return {
    newCategoryName,
    isAddCategoryOpen,
    categoryError,
    isCreatingCategory,
    setIsAddCategoryOpen,
    handleCreateCategory,
    handleCategoryNameChange,
    handleDialogClose,
  };
};

/**
 * Main Gather component - manages lab subjects and categories
 */
const Gather: React.FC<GatherProps> = ({
  labId,
  labName = 'Lab',
  categories,
  onCategoriesUpdate,
  onRefreshLab,
}) => {
  console.log('Gather component received labId:', labId);

  const { toast, toasts, removeToast, executeUndo } = useToast();
  const [userRole] = useState<UserRole>('editor');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Refs for sections
  const horizonChartRef = useRef<HTMLDivElement>(null);

  // Horizon chart subject selection
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set()
  );

  // Search functionality
  const {
    searchQuery,
    searchResults,
    isSearching,
    showSearchDropdown,
    setShowSearchDropdown,
    handleSearchChange,
    handleSearchExecute,
    clearSearch,
  } = useSubjectSearch();

  // Category management
  const {
    newCategoryName,
    isAddCategoryOpen,
    categoryError,
    isCreatingCategory,
    setIsAddCategoryOpen,
    handleCreateCategory,
    handleCategoryNameChange,
    handleDialogClose,
  } = useCategoryManagement(
    categories,
    onCategoriesUpdate,
    labId,
    token,
    toast
  );

  // Phylogeny Tree Data - memoized to update when categories change
  const phylogenyData: PhylogenyData = useMemo(() => {
    const customCategories = categories.filter(
      (category) => !CategoryUtils.isDefault(category)
    );

    const uncategorizedCategory = categories.find(CategoryUtils.isDefault);
    const includeUncategorized =
      uncategorizedCategory && uncategorizedCategory.subjects.length > 0;

    const subcategories = [
      ...customCategories.map((category) => ({
        id: `category-${category.id}`,
        name: category.name,
        items: category.subjects.map((subject, subIndex) => ({
          id: `subject-${category.id}-${subIndex}`,
          name: subject.subjectName,
        })),
      })),
      ...(includeUncategorized
        ? [
            {
              id: 'category-uncategorized',
              name: uncategorizedCategory.name,
              items: uncategorizedCategory.subjects.map(
                (subject, subIndex) => ({
                  id: `subject-uncategorized-${subIndex}`,
                  name: subject.subjectName,
                })
              ),
              color: '#A7ACB2',
            },
          ]
        : []),
    ];

    return {
      root: {
        id: 'lab-root',
        name: labName,
      },
      subcategories,
    };
  }, [categories, labName]);

  // Handle refresh lab data
  const handleRefreshClick = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefreshLab();
      toast({
        title: 'Lab refreshed',
        description: 'Lab data has been updated with the latest information.',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to refresh lab:', error);
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh lab data. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshLab, toast]);

  // Load initial lab data
  useEffect(() => {
    const loadLabData = async () => {
      setIsLoading(true);
      try {
        const hasDefaultCategory = categories.some((cat) =>
          CategoryUtils.isDefault(cat)
        );
        if (!hasDefaultCategory) {
          const defaultCategory: SubjectCategory = {
            id: 'uncategorized',
            name: 'Uncategorized',
            type: 'default',
            subjects: [],
            description: 'Default category for new subjects',
          };
          onCategoriesUpdate([defaultCategory, ...categories]);
        }
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

    if (categories.length === 0) {
      loadLabData();
    }
  }, [labId, toast, categories, onCategoriesUpdate]);

  // Check if subject already exists in lab - Updated with proper format handling
  const isSubjectInLab = useCallback(
    (subjectIdentifier: string): boolean => {
      console.log('🔍 Checking if subject is in lab:', subjectIdentifier);

      // Normalize search identifier - ensure it has fsid_ prefix for comparison with subjectId
      const normalizedSearchId = subjectIdentifier.startsWith('fsid_')
        ? subjectIdentifier
        : `fsid_${subjectIdentifier}`;

      // Also get the slug version (without fsid_)
      const normalizedSearchSlug = subjectIdentifier.startsWith('fsid_')
        ? subjectIdentifier.substring(5)
        : subjectIdentifier;

      const found = categories.some((category) =>
        category.subjects.some((subject) => {
          // Since we store subjectId with fsid_ prefix and subjectSlug without it,
          // we compare the normalized search ID with subjectId and normalized slug with subjectSlug
          const matches =
            subject.subjectId === normalizedSearchId ||
            subject.subjectSlug === normalizedSearchSlug;

          if (matches) {
            console.log('✅ Found match:', {
              searchFor: subjectIdentifier,
              normalizedSearchId,
              normalizedSearchSlug,
              matchedSubject: {
                id: subject.subjectId,
                slug: subject.subjectSlug,
                name: subject.subjectName,
              },
            });
          }

          return matches;
        })
      );

      console.log(found ? '✅ Subject IS in lab' : '❌ Subject NOT in lab');
      return found;
    },
    [categories]
  );

  // Get all lab subjects for horizon chart
  const allLabSubjects = useMemo(() => {
    return categories.flatMap((cat) => cat.subjects);
  }, [categories]);

  // Get category names for horizon chart
  const usedCategoryNames = useMemo(() => {
    return categories
      .filter((cat) => !CategoryUtils.isDefault(cat))
      .map((cat) => cat.name)
      .sort();
  }, [categories]);

  // Simplified horizon rank detection - just check the horizonRank property
  const hasValidHorizonRank = useCallback((subject: LabSubject): boolean => {
    return (
      subject.horizonRank !== undefined &&
      subject.horizonRank !== null &&
      !isNaN(Number(subject.horizonRank))
    );
  }, []);

  // Simplified horizon rank value extraction
  const getHorizonRankValue = useCallback(
    (subject: LabSubject): number | undefined => {
      if (
        subject.horizonRank !== undefined &&
        subject.horizonRank !== null &&
        !isNaN(Number(subject.horizonRank))
      ) {
        return Number(subject.horizonRank);
      }
      return undefined;
    },
    []
  );

  // Generate horizon chart data - only include subjects with valid horizon ranks
  const horizonData = useMemo((): HorizonItem[] => {
    return allLabSubjects
      .filter((subject) => {
        // Only include subjects that are selected AND have valid horizon rank data
        return selectedSubjects.has(subject.id) && hasValidHorizonRank(subject);
      })
      .map((subject) => {
        const category = categories.find(
          (cat) => cat.id === subject.categoryId
        );
        const categoryName = category?.name || 'Uncategorized';
        const horizonRankValue = getHorizonRankValue(subject);

        return {
          name: subject.subjectName,
          horizon: horizonRankValue!, // We know this is valid from the filter above
          category: getCategoryNumber(categoryName, usedCategoryNames),
          type: 1,
          categoryName: categoryName,
        };
      });
  }, [
    allLabSubjects,
    selectedSubjects,
    categories,
    usedCategoryNames,
    hasValidHorizonRank,
    getHorizonRankValue,
  ]);

  // Grouped subjects for horizon chart
  const groupedSubjects = useMemo(() => {
    const selected: LabSubject[] = [];
    const unselected: LabSubject[] = [];

    allLabSubjects.forEach((subject) => {
      if (selectedSubjects.has(subject.id)) {
        selected.push(subject);
      } else {
        unselected.push(subject);
      }
    });

    return { selected, unselected };
  }, [allLabSubjects, selectedSubjects]);

  // Initialize horizon chart selections when categories load - only subjects with horizon rank
  useEffect(() => {
    if (allLabSubjects.length > 0 && selectedSubjects.size === 0) {
      // Only select subjects that have horizon rank data
      const subjectsWithHorizonRank =
        allLabSubjects.filter(hasValidHorizonRank);
      const firstTwentyIds = subjectsWithHorizonRank
        .slice(0, 20)
        .map((s) => s.id);
      setSelectedSubjects(new Set(firstTwentyIds));
    }
  }, [allLabSubjects, selectedSubjects.size, hasValidHorizonRank]);

  // Horizon chart handlers - updated to only work with subjects that have horizon rank
  const handleSubjectToggle = useCallback((subjectId: string) => {
    setSelectedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        if (newSet.size < 20) {
          newSet.add(subjectId);
        }
      }
      return newSet;
    });
  }, []);

  const handleSelectAllHorizon = useCallback(() => {
    // Only select subjects that have horizon rank data
    const subjectsWithHorizonRank = allLabSubjects.filter(hasValidHorizonRank);
    const firstTwentyIds = subjectsWithHorizonRank
      .slice(0, 20)
      .map((s) => s.id);
    setSelectedSubjects(new Set(firstTwentyIds));
  }, [allLabSubjects, hasValidHorizonRank]);

  const handleDeselectAllHorizon = useCallback(() => {
    setSelectedSubjects(new Set());
  }, []);

  // Handle subject movement between categories using new API
  const handleSubjectMove = useCallback(
    async (
      frontendSubjectId: string,
      fromCategoryId: string,
      toCategoryId: string
    ) => {
      if (userRole === 'reader') {
        toast({
          title: 'Permission denied',
          description: 'You do not have permission to move subjects.',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      if (fromCategoryId === toCategoryId) return;

      console.log('Moving subject:', {
        frontendSubjectId,
        fromCategoryId,
        toCategoryId,
      });

      const fromCategory = categories.find((cat) => cat.id === fromCategoryId);
      const toCategory = categories.find((cat) => cat.id === toCategoryId);
      const subject = fromCategory?.subjects.find(
        (subj) => subj.id === frontendSubjectId
      );

      if (!fromCategory || !toCategory || !subject) {
        toast({
          title: 'Move failed',
          description: 'Unable to find subject or categories.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const previousCategories = categories.map((cat) => ({
        ...cat,
        subjects: [...cat.subjects.map((subj) => ({ ...subj }))],
      }));

      // OPTIMISTIC UPDATE: Update UI immediately
      const optimisticCategories = categories.map((cat) => {
        if (cat.id === fromCategoryId) {
          return {
            ...cat,
            subjects: cat.subjects.filter(
              (subj) => subj.id !== frontendSubjectId
            ),
          };
        } else if (cat.id === toCategoryId) {
          const updatedSubject = { ...subject, categoryId: toCategoryId };
          return {
            ...cat,
            subjects: [...cat.subjects, updatedSubject],
          };
        }
        return cat;
      });

      onCategoriesUpdate(optimisticCategories);

      toast({
        title: 'Subject moved',
        description: `"${subject.subjectName}" moved to "${toCategory.name}".`,
        status: 'success',
        duration: 2000,
      });

      try {
        // Use new subject assignment service
        const subjectFsid = subcategoryService.normalizeSubjectFsid(
          subject.subjectSlug
        );

        await subcategoryService.moveSubjectsBetweenSubcategories(
          [subjectFsid],
          labId,
          fromCategoryId,
          toCategoryId,
          token || ''
        );

        console.log('Subject move confirmed by API');

        // Refresh the phylogeny tree data by triggering a re-render
        // This happens automatically since phylogenyData is memoized on categories
      } catch (moveError) {
        console.error('Subject move error, rolling back:', moveError);
        onCategoriesUpdate(previousCategories);

        const errorMessage =
          moveError instanceof Error
            ? moveError.message
            : 'The subject could not be moved. Please try again.';

        toast({
          title: 'Failed to move subject',
          description: `${errorMessage} The change has been reverted.`,
          status: 'error',
          duration: 5000,
        });
      }
    },
    [userRole, categories, toast, onCategoriesUpdate, labId, token]
  );

  // Handle adding subject to lab using new API - Updated to handle different ID formats
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

      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to perform this action.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      // Check using ent_fsid instead of _id
      if (isSubjectInLab(searchResult.ent_fsid)) {
        toast({
          title: 'Subject already exists',
          description: `"${searchResult.ent_name}" is already in this lab.`,
          status: 'info',
          duration: 3000,
        });
        return;
      }

      const defaultCategory = categories.find(CategoryUtils.isDefault);
      if (!defaultCategory) {
        toast({
          title: 'No default category',
          description: 'Cannot add subject: no default category found.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      // Ensure consistent format: always store as fsid_xxx format for subjectId
      // and xxx format for subjectSlug
      const subjectFsid = searchResult.ent_fsid.startsWith('fsid_')
        ? searchResult.ent_fsid
        : `fsid_${searchResult.ent_fsid}`;

      const subjectSlug = searchResult.ent_fsid.startsWith('fsid_')
        ? searchResult.ent_fsid.substring(5)
        : searchResult.ent_fsid;

      const newSubject: LabSubject = {
        id: `subj-${Date.now()}`,
        subjectId: subjectFsid, // Always store with fsid_ prefix
        subjectName: searchResult.ent_name,
        subjectSlug: subjectSlug, // Always store without fsid_ prefix
        addedAt: new Date().toISOString(),
        addedById: 'current-user',
        notes: searchResult.ent_summary,
        categoryId: defaultCategory.id,
      };

      console.log('Adding subject with consistent format:', {
        searchResult: searchResult.ent_fsid,
        storedId: newSubject.subjectId,
        storedSlug: newSubject.subjectSlug,
      });

      const previousCategories = [...categories];

      // OPTIMISTIC UPDATE: Update UI immediately
      const optimisticCategories = categories.map((cat) =>
        CategoryUtils.isDefault(cat)
          ? { ...cat, subjects: [...cat.subjects, newSubject] }
          : cat
      );

      onCategoriesUpdate(optimisticCategories);

      toast({
        title: 'Subject added',
        description: `"${searchResult.ent_name}" has been added to your lab.`,
        status: 'success',
        duration: 2000,
      });

      try {
        // Use new subject assignment service - always send with fsid_ prefix
        await subcategoryService.addSubjectsToLab([subjectFsid], labId, token);

        console.log('Subject addition confirmed by API');

        // Refresh the phylogeny tree data
        // This happens automatically since phylogenyData is memoized on categories
      } catch (addError) {
        console.error('Failed to add subject, rolling back:', addError);
        onCategoriesUpdate(previousCategories);

        toast({
          title: 'Failed to add subject',
          description:
            addError instanceof Error
              ? `${addError.message} The change has been reverted.`
              : 'The subject could not be added. Please try again.',
          status: 'error',
          duration: 5000,
        });
      }
    },
    [
      userRole,
      isSubjectInLab,
      categories,
      toast,
      onCategoriesUpdate,
      labId,
      token,
    ]
  );

  // Handle category rename (would need new API endpoint)
  const handleCategoryRename = useCallback(
    async (_categoryId: string, _newName: string) => {
      // TODO: Implement category rename API when available
      toast({
        title: 'Feature not available',
        description: 'Category renaming is not yet supported by the API.',
        status: 'warning',
        duration: 3000,
      });
    },
    [toast]
  );

  // Handle category deletion using new API
  const handleCategoryDelete = useCallback(
    async (categoryId: string, moveSubjectsToUncategorized: boolean) => {
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to perform this action.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const categoryToDelete = categories.find((cat) => cat.id === categoryId);
      if (!categoryToDelete) return;

      if (CategoryUtils.isSpecial(categoryToDelete)) {
        toast({
          title: 'Cannot delete category',
          description: 'Default categories cannot be deleted.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const previousCategoriesState = categories.map((cat) => ({
        ...cat,
        subjects: [...cat.subjects],
      }));

      try {
        // Get subject fsids that need to be handled
        const subjectFsids = categoryToDelete.subjects.map((subject) =>
          subcategoryService.normalizeSubjectFsid(subject.subjectSlug)
        );

        // Use the subcategory service to handle deletion with subject reassignment
        await subcategoryService.deleteSubcategoryWithSubjects(
          categoryId,
          subjectFsids,
          labId,
          token,
          moveSubjectsToUncategorized
        );

        // Update frontend state
        const newCategories = categories.filter((cat) => cat.id !== categoryId);

        // If subjects were moved to uncategorized, update that category too
        if (
          moveSubjectsToUncategorized &&
          categoryToDelete.subjects.length > 0
        ) {
          const updatedCategories = newCategories.map((category) =>
            CategoryUtils.isDefault(category)
              ? {
                  ...category,
                  subjects: [
                    ...category.subjects,
                    ...categoryToDelete.subjects.map((subject) => ({
                      ...subject,
                      categoryId: category.id,
                    })),
                  ],
                }
              : category
          );
          onCategoriesUpdate(updatedCategories);
        } else {
          onCategoriesUpdate(newCategories);
        }

        toast({
          title: 'Category deleted',
          description: moveSubjectsToUncategorized
            ? `"${categoryToDelete.name}" deleted. ${categoryToDelete.subjects.length} subjects moved to Uncategorized.`
            : `"${categoryToDelete.name}" and its ${categoryToDelete.subjects.length} subjects deleted.`,
          status: 'info',
          undoAction: async () => {
            // Undo functionality would be complex with the new API structure
            // For now, just suggest refreshing the lab
            toast({
              title: 'Undo not available',
              description: 'Please refresh the lab to see the current state.',
              status: 'warning',
              duration: 5000,
            });
          },
          undoLabel: 'Refresh Lab',
        });
      } catch (deleteError) {
        console.error('Failed to delete category:', deleteError);
        onCategoriesUpdate(previousCategoriesState);

        const errorMessage =
          deleteError instanceof Error
            ? deleteError.message
            : 'The category could not be deleted. Please try again.';

        toast({
          title: 'Failed to delete category',
          description: errorMessage,
          status: 'error',
          duration: 5000,
        });
        throw deleteError; // Re-throw so CategoryColumn can handle loading states
      }
    },
    [categories, toast, onCategoriesUpdate, token]
  );

  // Handle subject removal (removing from lab entirely)
  const handleSubjectRemove = useCallback(
    async (subjectId: string, categoryId: string) => {
      if (userRole === 'viewer') {
        toast({
          title: 'Permission denied',
          description: 'You do not have permission to remove subjects.',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to perform this action.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      console.log('Removing subject:', { subjectId, categoryId });

      const category = categories.find((cat) => cat.id === categoryId);
      const subject = category?.subjects.find(
        (subj) => subj.subjectId === subjectId
      );

      if (!subject) {
        console.error('Subject not found for removal:', {
          subjectId,
          categoryId,
        });
        return;
      }

      const previousCategoriesState = categories.map((cat) => ({
        ...cat,
        subjects: [...cat.subjects],
      }));

      // OPTIMISTIC UPDATE: Update UI immediately
      const optimisticCategories = categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subjects: cat.subjects.filter(
                (subject) => subject.subjectId !== subjectId
              ),
            }
          : cat
      );

      onCategoriesUpdate(optimisticCategories);

      toast({
        title: 'Subject removed',
        description: `"${subject.subjectName}" removed from ${
          category?.name || 'the lab'
        }.`,
        status: 'info',
        undoAction: async () => {
          // For undo, we would need to re-add the subject to the lab
          // This is complex with the current API structure
          onCategoriesUpdate(previousCategoriesState);

          toast({
            title: 'Subject restored in UI',
            description: 'Please refresh the lab to sync with the server.',
            status: 'warning',
            duration: 5000,
          });
        },
        undoLabel: 'Undo Remove',
      });

      try {
        // Import labService dynamically to avoid circular dependencies
        const { labService } = await import('../../services/labService');

        // Use the new removeSubjectFromLab method
        await labService.removeSubjectFromLab(labId, subject.subjectId, token);

        console.log('Subject removal confirmed by API');
      } catch (removeError) {
        console.error('Failed to remove subject, rolling back:', removeError);
        onCategoriesUpdate(previousCategoriesState);

        toast({
          title: 'Failed to remove subject',
          description:
            removeError instanceof Error
              ? removeError.message
              : 'The subject could not be removed. Please try again.',
          status: 'error',
          duration: 5000,
        });
      }
    },
    [userRole, categories, toast, onCategoriesUpdate, labId, token]
  );

  // Handle search execution with error handling
  const handleSearchExecuteWithErrorHandling = useCallback(
    async (query: string) => {
      try {
        await handleSearchExecute(query);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Search failed. Please try again.';
        toast({
          title: 'Search Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
        });
      }
    },
    [handleSearchExecute, toast]
  );

  // Memoized sorted categories
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (CategoryUtils.isDefault(a) && !CategoryUtils.isDefault(b)) return -1;
      if (!CategoryUtils.isDefault(a) && CategoryUtils.isDefault(b)) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  // Separate uncategorized subjects for Task 19 - horizontal bar layout
  const uncategorizedCategory = useMemo(() => {
    return sortedCategories.find(CategoryUtils.isDefault);
  }, [sortedCategories]);

  const categorizedColumns = useMemo(() => {
    return sortedCategories.filter((cat) => !CategoryUtils.isDefault(cat));
  }, [sortedCategories]);

  // Memoized subject card renderer
  const renderSubjectCard = useCallback(
    (subject: LabSubject) => {
      const categoryId =
        sortedCategories.find((cat) =>
          cat.subjects.some((s) => s.id === subject.id)
        )?.id || '';

      return (
        <SubjectCard
          key={subject.id}
          subject={subject}
          categoryId={categoryId}
          onSubjectClick={(subject) =>
            console.log('Clicked subject:', subject.subjectName)
          }
          onSubjectRemove={handleSubjectRemove}
          onSubjectView={(subject) =>
            navigate(`/subject/${subject.subjectSlug}`)
          }
        />
      );
    },
    [sortedCategories, handleSubjectRemove, navigate]
  );

  // Separate renderer for horizontal layout (uncategorized)
  const renderHorizontalSubjectCard = useCallback(
    (subject: LabSubject) => {
      const categoryId =
        sortedCategories.find((cat) =>
          cat.subjects.some((s) => s.id === subject.id)
        )?.id || '';

      return (
        <SubjectCard
          key={subject.id}
          subject={subject}
          categoryId={categoryId}
          onSubjectClick={(subject) =>
            console.log('Clicked subject:', subject.subjectName)
          }
          onSubjectRemove={handleSubjectRemove}
          onSubjectView={(subject) =>
            navigate(`/subject/${subject.subjectSlug}`)
          }
          tooltipPlacement='right'
          isInHorizontalLayout={true}
        />
      );
    },
    [sortedCategories, handleSubjectRemove, navigate]
  );

  // Loading state
  if (isLoading) {
    return (
      <VStack gap={4} align='stretch'>
        <HStack justify='space-between' align='center'>
          <Heading as='h2' size='lg' color='fg' fontFamily='heading'>
            Subjects
          </Heading>
        </HStack>
        <Flex justify='center' align='center' minH='400px'>
          <VStack gap={3}>
            <Spinner size='lg' color='brand' />
            <Text color='fg.muted' fontFamily='body'>
              Loading lab data...
            </Text>
          </VStack>
        </Flex>
      </VStack>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <VStack gap={6} align='stretch' overflow='visible'>
        {/* Header with search and refresh */}
        <HStack justify='space-between' align='center'>
          <HStack gap={4} flex='1'>
            <Heading as='h2' size='lg' color='fg' fontFamily='heading'>
              Subjects
            </Heading>

            {/* Refresh Button */}
            <IconButton
              size='md'
              variant='ghost'
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              color='fg.muted'
              _hover={{ color: 'brand', bg: 'bg.hover' }}
              aria-label='Refresh lab data'
              title='Refresh lab data'
            >
              <FiRefreshCw
                size={16}
                style={{
                  transform: isRefreshing ? 'rotate(360deg)' : 'none',
                  transition: 'transform 1s linear',
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </IconButton>

            <SubjectSearch
              searchQuery={searchQuery}
              searchResults={searchResults}
              isSearching={isSearching}
              showSearchDropdown={showSearchDropdown}
              userRole={userRole}
              isSubjectInLab={isSubjectInLab}
              onSearchChange={handleSearchChange}
              onSearchExecute={handleSearchExecuteWithErrorHandling}
              onSearchFocus={() => {
                if (searchQuery.trim().length > 0 && searchResults.length > 0) {
                  setShowSearchDropdown(true);
                }
              }}
              onClearSearch={clearSearch}
              onAddSubject={handleAddSubject}
              onGoToSearchResults={() => {
                if (searchQuery.trim()) {
                  navigate(`/search/${encodeURIComponent(searchQuery.trim())}`);
                }
                setShowSearchDropdown(false);
              }}
              setShowSearchDropdown={setShowSearchDropdown}
            />
          </HStack>

          {/* Action buttons */}
          <HStack gap={3}>
            {userRole !== 'reader' && (
              <Button
                size='md'
                variant='outline'
                onClick={() => setIsAddCategoryOpen(true)}
                disabled={isLoading}
                color='fg'
                borderColor='border.emphasized'
                bg='bg.canvas'
                _hover={{
                  bg: 'bg.hover',
                  borderColor: 'border.hover',
                }}
                fontFamily='heading'
              >
                <FiPlus size={16} />
                New Category
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Task 19: Uncategorized Subjects Horizontal Bar */}
        {uncategorizedCategory && (
          <Box
            borderWidth='1px'
            borderColor='border.emphasized'
            bg='bg.canvas'
            borderRadius='md'
            p={4}
            overflow='hidden'
          >
            <HStack gap={2} mb={3}>
              <FaFolder size={16} color='var(--chakra-colors-fg-muted)' />
              <Text
                fontSize='md'
                fontWeight='medium'
                color='fg'
                fontFamily='heading'
              >
                {uncategorizedCategory.name}
              </Text>
              <Box
                bg='bg.muted'
                color='fg.muted'
                fontSize='xs'
                px={2}
                py={1}
                borderRadius='md'
                fontFamily='body'
              >
                {uncategorizedCategory.subjects.length}
              </Box>
            </HStack>

            <HorizontalDropZone
              categoryId={uncategorizedCategory.id}
              subjects={uncategorizedCategory.subjects}
              onDrop={handleSubjectMove}
              renderSubjectCard={renderHorizontalSubjectCard}
              emptyMessage='Drop subjects here to uncategorize them'
              isLoading={isLoading}
            />
          </Box>
        )}

        {/* Main Kanban Board for Categorized Subjects */}
        <Box position='relative' overflowY='visible' w='100%'>
          <Box
            w='100%'
            overflowX='auto'
            overflowY='visible'
            pb={4}
            pt={2}
            css={{
              '&::-webkit-scrollbar': { height: '8px' },
              '&::-webkit-scrollbar-track': {
                background: 'var(--chakra-colors-bg-subtle)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'var(--chakra-colors-border-muted)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'var(--chakra-colors-border-emphasized)',
              },
            }}
          >
            <HStack
              gap={4}
              align='flex-start'
              minW='fit-content'
              pb={2}
              overflowY='visible'
            >
              {/* Category columns - excluding uncategorized */}
              {categorizedColumns.map((category) => (
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
                  borderColor='border.muted'
                  borderRadius='md'
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  cursor='pointer'
                  _hover={{
                    borderColor: 'brand',
                    bg: 'bg.hover',
                  }}
                  onClick={() => setIsAddCategoryOpen(true)}
                  transition='all 0.2s'
                  bg='bg.canvas'
                >
                  <VStack gap={2}>
                    <Box color='fg.muted'>
                      <FiPlus size={24} />
                    </Box>
                    <Text
                      color='fg.muted'
                      fontSize='sm'
                      fontWeight='medium'
                      fontFamily='heading'
                    >
                      Add Category
                    </Text>
                  </VStack>
                </Box>
              )}
            </HStack>
          </Box>
        </Box>

        {/* Task 17: Taxonomy Tree View - PhylogenyTree Component */}
        <VStack gap={4} align='stretch'>
          <HStack gap={2} align='center'>
            <Heading as='h3' size='md' color='fg' fontFamily='heading'>
              Subject Taxonomy Tree
            </Heading>
            <Text fontSize='sm' color='fg.muted' fontFamily='body'>
              Visual representation of lab structure and relationships
            </Text>
          </HStack>

          <PhylogenyTree
            key={`phylogeny-${categories.length}-${categories
              .map((c) => c.subjects.length)
              .join('-')}`}
            data={phylogenyData}
            nodeSpacing={80}
            levelSpacing={240}
            itemSpacing={40}
          />
        </VStack>

        {/* Horizon Chart Section */}
        <VStack gap={4} align='stretch' overflow='visible'>
          <HStack gap={2} align='center'>
            <Heading as='h3' size='md' color='fg' fontFamily='heading'>
              Subject Horizon Chart
            </Heading>
            <Text fontSize='sm' color='fg.muted' fontFamily='body'>
              Technology maturity and strategic positioning visualization
            </Text>
          </HStack>

          <Box height='auto'>
            <HorizonChartSection
              ref={horizonChartRef}
              allSubjects={allLabSubjects}
              selectedSubjects={selectedSubjects}
              horizonData={horizonData}
              groupedSubjects={groupedSubjects}
              onSubjectToggle={handleSubjectToggle}
              onSelectAll={handleSelectAllHorizon}
              onDeselectAll={handleDeselectAllHorizon}
              loading={isLoading}
              error={null}
              onRefresh={handleRefreshClick}
              refreshing={isRefreshing}
            />
          </Box>
        </VStack>

        {/* Add Category Dialog */}
        <Dialog.Root
          open={isAddCategoryOpen}
          onOpenChange={({ open }) => !open && handleDialogClose()}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg='bg.canvas' borderColor='border.emphasized'>
              <Dialog.Header>
                <Dialog.Title color='fg' fontFamily='heading'>
                  Create New Category
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <VStack gap={4} align='stretch'>
                  <Field.Root invalid={!!categoryError}>
                    <Field.Label
                      fontSize='sm'
                      fontWeight='medium'
                      color='fg'
                      fontFamily='heading'
                    >
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
                      bg='bg'
                      borderColor='border.muted'
                      color='fg'
                      _placeholder={{ color: 'fg.muted' }}
                      _focus={{
                        borderColor: 'brand',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                      }}
                      fontFamily='body'
                    />
                    {categoryError && (
                      <Field.ErrorText
                        fontSize='sm'
                        color='error'
                        fontFamily='body'
                      >
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
                    color='fg'
                    borderColor='border.emphasized'
                    bg='bg.canvas'
                    _hover={{ bg: 'bg.hover' }}
                    fontFamily='heading'
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='solid'
                    onClick={handleCreateCategory}
                    disabled={
                      !!categoryError ||
                      !newCategoryName.trim() ||
                      isCreatingCategory
                    }
                    loading={isCreatingCategory}
                    bg='brand'
                    color='white'
                    borderColor='brand'
                    _hover={{ bg: 'brand.hover' }}
                    fontFamily='heading'
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

      {/* Add CSS for refresh button animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </DndProvider>
  );
};

export default Gather;

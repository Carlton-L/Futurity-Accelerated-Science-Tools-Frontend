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

// Import types
import type {
  LabSubject,
  SubjectSearchResult,
  SubjectCategory,
  KnowledgebaseDocument,
  KnowledgebaseFileType,
  KnowledgebaseQueryResult,
} from './types';
import { CategoryUtils, ApiTransformUtils } from './types';

// Import components
import SubjectCard from './SubjectCard';
import { useToast, ToastDisplay } from './ToastSystem';
import { SubjectSearch } from './SubjectSearch';
import { CategoryColumn } from './CategoryColumn';
import IncludeExcludeTerms from './IncludeExcludeTerms';
import Knowledgebase from './Knowledgebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { labAPIService } from '../../services/labAPIService';

// Component Props Interface
interface GatherProps {
  labId: string;
  includeTerms: string[];
  excludeTerms: string[];
  categories: SubjectCategory[];
  onTermsUpdate: (includeTerms: string[], excludeTerms: string[]) => void;
  onCategoriesUpdate: (categories: SubjectCategory[]) => void;
}

// Search API Response Interface
interface SearchAPIResponse {
  results: {
    keyword: string;
    exact_match?: {
      _id: { $oid: string };
      ent_name: string;
      ent_fsid: string;
      ent_summary: string;
      [key: string]: unknown;
    };
    rows: Array<{
      _id: { $oid: string };
      ent_name: string;
      ent_fsid: string;
      ent_summary: string;
    }>;
    count: number;
  };
}

// User Role Type
type UserRole = 'reader' | 'editor' | 'admin';

/**
 * Custom hook for search functionality
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

        // Add exact match first if it exists
        if (data.results.exact_match) {
          results.push({
            _id: data.results.exact_match._id,
            ent_name: data.results.exact_match.ent_name,
            ent_fsid: data.results.exact_match.ent_fsid,
            ent_summary: data.results.exact_match.ent_summary,
          });
        }

        // Add other results, avoiding duplicates
        const exactMatchId = data.results.exact_match?._id.$oid;
        for (const row of data.results.rows) {
          if (row._id.$oid !== exactMatchId) {
            results.push({
              _id: row._id,
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
 * Custom hook for category management
 */
const useCategoryManagement = (
  categories: SubjectCategory[],
  onCategoriesUpdate: (categories: SubjectCategory[]) => void,
  labId: string,
  token: string | null,
  toast: any
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
      const currentCategories = categories
        .filter(CategoryUtils.isCustom)
        .map((category) => ({
          id: ApiTransformUtils.stringToUUID(category.id),
          name: category.name,
        }));

      await labAPIService.addCategory(
        labId,
        trimmedName,
        currentCategories,
        token
      );

      const newCategoryId = labAPIService.generateUUID();
      const newCategory: SubjectCategory = {
        id: newCategoryId,
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
        description: 'The category could not be created. Please try again.',
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
  includeTerms,
  excludeTerms,
  categories,
  onTermsUpdate,
  onCategoriesUpdate,
}) => {
  const { toast, toasts, removeToast, executeUndo } = useToast();
  const [userRole] = useState<UserRole>('editor');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Knowledgebase state
  const [kbDocuments, setKbDocuments] = useState<KnowledgebaseDocument[]>([]);
  const [kbLoading, setKbLoading] = useState<boolean>(false);
  const [kbError, setKbError] = useState<string>('');
  const [kbUploadLoading, setKbUploadLoading] = useState<boolean>(false);
  const [kbUploadError, setKbUploadError] = useState<string>('');
  const [kbUploadSuccess, setKbUploadSuccess] = useState<boolean>(false);
  const [kbQuery, setKbQuery] = useState<string>('');
  const [kbQueryResults, setKbQueryResults] =
    useState<KnowledgebaseQueryResult | null>(null);
  const [kbQueryLoading, setKbQueryLoading] = useState<boolean>(false);
  const [kbQueryError, setKbQueryError] = useState<string>('');
  const [selectedFileTypes, setSelectedFileTypes] = useState<
    Set<KnowledgebaseFileType>
  >(
    new Set<KnowledgebaseFileType>([
      'pdf',
      'image',
      'audio',
      'video',
      'txt',
      'raw_text',
    ])
  );
  const [deletingDocuments, setDeletingDocuments] = useState<Set<string>>(
    new Set<string>()
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

  // Check if subject already exists in lab
  const isSubjectInLab = useCallback(
    (subjectId: string): boolean => {
      return categories.some((category) =>
        category.subjects.some((subject) => subject.subjectId === subjectId)
      );
    },
    [categories]
  );

  // Computed filtered knowledgebase documents
  const filteredKbDocuments = useMemo(() => {
    return kbDocuments.filter((doc) => selectedFileTypes.has(doc.file_type));
  }, [kbDocuments, selectedFileTypes]);

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

      if (fromCategoryId === toCategoryId) return;

      const previousCategories = categories.map((cat) => ({
        ...cat,
        subjects: [...cat.subjects.map((subj) => ({ ...subj }))],
      }));

      const fromCategory = categories.find((cat) => cat.id === fromCategoryId);
      const toCategory = categories.find((cat) => cat.id === toCategoryId);
      const subjectIndex = fromCategory?.subjects.findIndex(
        (subj) => subj.id === subjectId
      );

      if (
        !fromCategory ||
        !toCategory ||
        subjectIndex === undefined ||
        subjectIndex < 0
      ) {
        toast({
          title: 'Move failed',
          description: 'Unable to find subject or categories.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const subject = fromCategory.subjects[subjectIndex];

      // Optimistic update
      const updatedCategories = categories.map((cat) => {
        if (cat.id === fromCategoryId) {
          return {
            ...cat,
            subjects: cat.subjects.filter((subj) => subj.id !== subjectId),
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

      onCategoriesUpdate(updatedCategories);

      try {
        const currentSubjects = updatedCategories.flatMap((cat) =>
          cat.subjects.map((subject) => ({
            subject_id: ApiTransformUtils.stringToObjectId(subject.subjectId),
            subject_slug: subject.subjectSlug,
            subject_name: subject.subjectName,
            category: ApiTransformUtils.stringToUUID(subject.categoryId),
          }))
        );

        await labAPIService.moveSubjectToCategory(
          labId,
          subject.subjectId,
          toCategoryId,
          currentSubjects,
          token || ''
        );

        toast({
          title: 'Subject moved',
          description: `"${subject.subjectName}" moved to "${toCategory.name}".`,
          status: 'success',
          duration: 3000,
        });
      } catch (moveError) {
        onCategoriesUpdate(previousCategories);
        const errorMessage =
          moveError instanceof Error
            ? moveError.message
            : 'The subject could not be moved. Please try again.';
        toast({
          title: 'Failed to move subject',
          description: errorMessage,
          status: 'error',
          duration: 5000,
        });
      }
    },
    [userRole, categories, toast, onCategoriesUpdate, labId, token]
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

      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to perform this action.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const subjectId = searchResult._id.$oid;
      if (isSubjectInLab(subjectId)) {
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

      const newSubject: LabSubject = {
        id: `subj-${Date.now()}`,
        subjectId: subjectId,
        subjectName: searchResult.ent_name,
        subjectSlug: searchResult.ent_fsid.replace('fsid_', ''),
        addedAt: new Date().toISOString(),
        addedById: 'current-user',
        notes: searchResult.ent_summary,
        categoryId: defaultCategory.id,
      };

      const previousCategories = [...categories];

      // Optimistic update
      const newCategories = categories.map((cat) =>
        CategoryUtils.isDefault(cat)
          ? { ...cat, subjects: [...cat.subjects, newSubject] }
          : cat
      );
      onCategoriesUpdate(newCategories);

      try {
        const currentSubjects = categories.flatMap((cat) =>
          cat.subjects.map((subject) => ({
            subject_id: ApiTransformUtils.stringToObjectId(subject.subjectId),
            subject_slug: subject.subjectSlug,
            subject_name: subject.subjectName,
            category: ApiTransformUtils.stringToUUID(subject.categoryId),
          }))
        );

        await labAPIService.addSubject(
          labId,
          subjectId,
          newSubject.subjectSlug,
          searchResult.ent_name,
          defaultCategory.id,
          currentSubjects,
          token
        );

        clearSearch();
        toast({
          title: 'Subject added',
          description: `"${searchResult.ent_name}" has been added to your lab.`,
          status: 'success',
          duration: 3000,
        });
      } catch (addError) {
        onCategoriesUpdate(previousCategories);
        toast({
          title: 'Failed to add subject',
          description: 'The subject could not be added. Please try again.',
          status: 'error',
          duration: 5000,
        });
        console.error('Failed to add subject:', addError);
      }
    },
    [
      userRole,
      isSubjectInLab,
      categories,
      clearSearch,
      toast,
      onCategoriesUpdate,
      labId,
      token,
    ]
  );

  // Handle category rename
  const handleCategoryRename = useCallback(
    async (categoryId: string, newName: string) => {
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to perform this action.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const previousCategories = [...categories];
      const newCategories = categories.map((cat) =>
        cat.id === categoryId ? { ...cat, name: newName } : cat
      );
      onCategoriesUpdate(newCategories);

      try {
        const currentCategories = categories
          .filter(CategoryUtils.isCustom)
          .map((category) => ({
            id: ApiTransformUtils.stringToUUID(category.id),
            name: category.name,
          }));

        await labAPIService.updateCategoryName(
          labId,
          categoryId,
          newName,
          currentCategories,
          token
        );

        toast({
          title: 'Category renamed',
          description: `Category has been renamed to "${newName}".`,
          status: 'success',
          duration: 3000,
        });
      } catch (renameError) {
        onCategoriesUpdate(previousCategories);
        toast({
          title: 'Failed to rename category',
          description: 'The category could not be renamed. Please try again.',
          status: 'error',
          duration: 5000,
        });
        throw renameError;
      }
    },
    [categories, toast, onCategoriesUpdate, labId, token]
  );

  // Handle category deletion
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

      const previousCategoriesState = categories.map((cat) => ({
        ...cat,
        subjects: [...cat.subjects],
      }));

      let newCategories = [...categories];

      if (moveSubjectsToUncategorized) {
        const categoryToDeleteRef = newCategories.find(
          (cat) => cat.id === categoryId
        );
        const uncategorized = newCategories.find((cat) =>
          CategoryUtils.isDefault(cat)
        );

        if (categoryToDeleteRef && uncategorized) {
          const updatedSubjects = categoryToDeleteRef.subjects.map(
            (subject) => ({
              ...subject,
              categoryId: uncategorized.id,
            })
          );
          uncategorized.subjects.push(...updatedSubjects);
        }
      }

      newCategories = newCategories.filter((cat) => cat.id !== categoryId);
      onCategoriesUpdate(newCategories);

      try {
        const currentCategories = categories
          .filter(CategoryUtils.isCustom)
          .map((category) => ({
            id: ApiTransformUtils.stringToUUID(category.id),
            name: category.name,
          }));

        const currentSubjects = categories.flatMap((cat) =>
          cat.subjects.map((subject) => ({
            subject_id: ApiTransformUtils.stringToObjectId(subject.subjectId),
            subject_slug: subject.subjectSlug,
            subject_name: subject.subjectName,
            category: ApiTransformUtils.stringToUUID(subject.categoryId),
          }))
        );

        const uncategorizedId =
          newCategories.find((cat) => CategoryUtils.isDefault(cat))?.id ||
          'uncategorized';

        await labAPIService.removeCategory(
          labId,
          categoryId,
          moveSubjectsToUncategorized,
          currentCategories,
          currentSubjects,
          uncategorizedId,
          token
        );

        toast({
          title: 'Category deleted',
          description: moveSubjectsToUncategorized
            ? `"${categoryToDelete.name}" deleted. ${categoryToDelete.subjects.length} subjects moved to Uncategorized.`
            : `"${categoryToDelete.name}" and its ${categoryToDelete.subjects.length} subjects deleted.`,
          status: 'info',
          undoAction: () => {
            onCategoriesUpdate(previousCategoriesState);
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
        onCategoriesUpdate(previousCategoriesState);
        toast({
          title: 'Failed to delete category',
          description: 'The category could not be deleted. Please try again.',
          status: 'error',
          duration: 5000,
        });
        throw deleteError;
      }
    },
    [categories, toast, onCategoriesUpdate, labId, token]
  );

  // Handle subject removal
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

      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to perform this action.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const category = categories.find((cat) => cat.id === categoryId);
      const subject = category?.subjects.find((subj) => subj.id === subjectId);

      if (!subject) return;

      const previousCategoriesState = categories.map((cat) => ({
        ...cat,
        subjects: [...cat.subjects],
      }));

      const newCategories = categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subjects: cat.subjects.filter(
                (subject) => subject.id !== subjectId
              ),
            }
          : cat
      );
      onCategoriesUpdate(newCategories);

      try {
        const currentSubjects = categories.flatMap((cat) =>
          cat.subjects.map((subject) => ({
            subject_id: ApiTransformUtils.stringToObjectId(subject.subjectId),
            subject_slug: subject.subjectSlug,
            subject_name: subject.subjectName,
            category: ApiTransformUtils.stringToUUID(subject.categoryId),
          }))
        );

        await labAPIService.removeSubject(
          labId,
          subject.subjectId,
          currentSubjects,
          token
        );

        toast({
          title: 'Subject removed',
          description: `"${subject.subjectName}" removed from ${
            category?.name || 'the lab'
          }.`,
          status: 'info',
          undoAction: () => {
            onCategoriesUpdate(previousCategoriesState);
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
        onCategoriesUpdate(previousCategoriesState);
        toast({
          title: 'Failed to remove subject',
          description: 'The subject could not be removed. Please try again.',
          status: 'error',
          duration: 5000,
        });
        console.error('Failed to remove subject:', removeError);
      }
    },
    [userRole, categories, toast, onCategoriesUpdate, labId, token]
  );

  // Handle terms update
  const handleTermsUpdate = useCallback(
    async (newIncludeTerms: string[], newExcludeTerms: string[]) => {
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to perform this action.',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const previousInclude = [...includeTerms];
      const previousExclude = [...excludeTerms];

      onTermsUpdate(newIncludeTerms, newExcludeTerms);

      try {
        await labAPIService.updateLab(
          labId,
          {
            include_terms: newIncludeTerms,
            exclude_terms: newExcludeTerms,
          },
          token
        );
      } catch (updateError) {
        onTermsUpdate(previousInclude, previousExclude);
        toast({
          title: 'Failed to update terms',
          description: 'The terms could not be updated. Please try again.',
          status: 'error',
          duration: 5000,
        });
        console.error('Failed to update terms:', updateError);
      }
    },
    [includeTerms, excludeTerms, onTermsUpdate, labId, token, toast]
  );

  // Knowledgebase handlers
  const fetchKnowledgebaseDocuments = useCallback(async () => {
    setKbLoading(true);
    setKbError('');

    try {
      const documents: KnowledgebaseDocument[] = [];
      const fileTypes: KnowledgebaseFileType[] = [
        'pdf',
        'image',
        'audio',
        'video',
        'txt',
        'raw_text',
      ];

      for (const fileType of fileTypes) {
        try {
          const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
          const targetUrl = `https://rag.futurity.science/knowledgebases/f2c3354a-bb62-4b5e-aa55-e62d2802e946/items/${fileType}?page=1&size=50`;

          const response = await fetch(proxyUrl + targetUrl, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
          });

          if (response.ok) {
            const data = await response.json();
            // Ensure each item has the required properties with proper typing
            const typedItems: KnowledgebaseDocument[] = data.items.map(
              (item: any) => ({
                document_uuid: item.document_uuid || item.id || 'unknown',
                file_type: fileType,
                title: item.title || item.name || 'Untitled',
                summary: item.summary,
                content: item.content,
                metadata: item.metadata,
                created_at: item.created_at,
                updated_at: item.updated_at,
                file_size: item.file_size,
                file_name: item.file_name,
                ingestion_time:
                  item.ingestion_time ||
                  item.created_at ||
                  new Date().toISOString(),
              })
            );
            documents.push(...typedItems);
          }
        } catch (error) {
          console.error(`Failed to fetch ${fileType} documents:`, error);
        }
      }

      setKbDocuments(documents);
    } catch (error) {
      console.error('Failed to fetch knowledgebase documents:', error);
      setKbError(
        'Failed to load documents - CORS issue. Please configure API server with proper CORS headers.'
      );
    } finally {
      setKbLoading(false);
    }
  }, []);

  const handleKbFileUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];
      setKbUploadLoading(true);
      setKbUploadError('');
      setKbUploadSuccess(false);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const targetUrl =
          'https://rag.futurity.science/knowledgebases/f2c3354a-bb62-4b5e-aa55-e62d2802e946/ingest_document';

        const response = await fetch(proxyUrl + targetUrl, {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || `Upload failed: ${response.status}`);
        }

        setKbUploadSuccess(true);
        await fetchKnowledgebaseDocuments();

        setTimeout(() => setKbUploadSuccess(false), 3000);
      } catch (error) {
        console.error('Failed to upload file:', error);
        setKbUploadError(
          error instanceof Error
            ? error.message
            : 'Upload failed - CORS issue. Please configure API server.'
        );
      } finally {
        setKbUploadLoading(false);
      }
    },
    [fetchKnowledgebaseDocuments]
  );

  const handleKbQuery = useCallback(async () => {
    if (!kbQuery.trim()) return;

    setKbQueryLoading(true);
    setKbQueryError('');
    setKbQueryResults(null);

    try {
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = 'https://rag.futurity.science/knowledgebases/query_kb';

      const response = await fetch(proxyUrl + targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          query_text: kbQuery.trim(),
          top_k_documents: 5,
          kb_uuid: 'f2c3354a-bb62-4b5e-aa55-e62d2802e946',
          top_k_snippets_per_document: 3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Query failed: ${response.status}`);
      }

      const data = await response.json();
      setKbQueryResults(data);
    } catch (error) {
      console.error('Failed to query knowledgebase:', error);
      setKbQueryError(
        error instanceof Error
          ? error.message
          : 'Query failed - CORS issue. Please configure API server.'
      );
    } finally {
      setKbQueryLoading(false);
    }
  }, [kbQuery]);

  const handleFileTypeToggle = useCallback((fileType: string) => {
    // Type guard to ensure fileType is a valid KnowledgebaseFileType
    const validFileTypes: KnowledgebaseFileType[] = [
      'pdf',
      'image',
      'audio',
      'video',
      'txt',
      'raw_text',
    ];
    if (validFileTypes.includes(fileType as KnowledgebaseFileType)) {
      setSelectedFileTypes((prev) => {
        const newSet = new Set(prev);
        const typedFileType = fileType as KnowledgebaseFileType;
        if (newSet.has(typedFileType)) {
          newSet.delete(typedFileType);
        } else {
          newSet.add(typedFileType);
        }
        return newSet;
      });
    }
  }, []);

  const handleDeleteDocument = useCallback(
    async (documentId: string, documentTitle: string) => {
      setDeletingDocuments((prev) => new Set(prev).add(documentId));

      try {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const targetUrl = `https://rag.futurity.science/knowledgebases/f2c3354a-bb62-4b5e-aa55-e62d2802e946/documents/${documentId}`;

        const response = await fetch(proxyUrl + targetUrl, {
          method: 'DELETE',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || `Delete failed: ${response.status}`);
        }

        setKbDocuments((prev) =>
          prev.filter((doc) => doc.document_uuid !== documentId)
        );

        toast({
          title: 'Document deleted',
          description: `"${documentTitle}" has been successfully deleted.`,
          status: 'success',
          duration: 3000,
        });

        await fetchKnowledgebaseDocuments();
      } catch (error) {
        console.error('Failed to delete document:', error);

        toast({
          title: 'Failed to delete document',
          description:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
          status: 'error',
          duration: 5000,
        });
      } finally {
        setDeletingDocuments((prev) => {
          const newSet = new Set(prev);
          newSet.delete(documentId);
          return newSet;
        });
      }
    },
    [toast, fetchKnowledgebaseDocuments]
  );

  // Initialize knowledgebase data
  useEffect(() => {
    fetchKnowledgebaseDocuments();
  }, [fetchKnowledgebaseDocuments]);

  // Handle subject view and navigation
  const handleSubjectView = useCallback(
    (subject: LabSubject) => {
      navigate(`/subject/${subject.subjectSlug}`);
    },
    [navigate]
  );

  const handleSubjectClick = useCallback((subject: LabSubject) => {
    console.log('Clicked subject:', subject.subjectName);
  }, []);

  const handleGoToSearchResults = useCallback(() => {
    if (searchQuery.trim()) {
      navigate(`/search/${encodeURIComponent(searchQuery.trim())}`);
    }
    setShowSearchDropdown(false);
  }, [searchQuery, navigate, setShowSearchDropdown]);

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.trim().length > 0 && searchResults.length > 0) {
      setShowSearchDropdown(true);
    }
  }, [searchQuery, searchResults.length, setShowSearchDropdown]);

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
          onSubjectClick={handleSubjectClick}
          onSubjectRemove={handleSubjectRemove}
          onSubjectView={handleSubjectView}
        />
      );
    },
    [
      sortedCategories,
      handleSubjectClick,
      handleSubjectRemove,
      handleSubjectView,
    ]
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
      <VStack gap={4} align='stretch'>
        {/* Header with search */}
        <HStack justify='space-between' align='center'>
          <HStack gap={4} flex='1'>
            <Heading as='h2' size='lg' color='fg' fontFamily='heading'>
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
              onSearchExecute={handleSearchExecuteWithErrorHandling}
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
                variant='outline'
                onClick={() => setIsAddCategoryOpen(true)}
                disabled={isLoading}
                color='brand'
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
            <HStack gap={4} align='flex-start' minW='fit-content' pb={2}>
              {/* Include/Exclude Terms */}
              <IncludeExcludeTerms
                includeTerms={includeTerms}
                excludeTerms={excludeTerms}
                onTermsUpdate={handleTermsUpdate}
                userRole={userRole}
                isLoading={isLoading}
              />

              {/* Category columns */}
              {sortedCategories.map((category) => (
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

        {/* Knowledgebase Section */}
        <VStack gap={4} align='stretch' mt={6}>
          {/* Knowledgebase Header */}
          <HStack justify='space-between' align='center'>
            <Heading as='h2' size='lg' color='fg' fontFamily='heading'>
              Knowledgebase
            </Heading>

            {/* Demo CORS Button */}
            <Button
              size='md'
              colorScheme='red'
              bg='red.500'
              color='white'
              _hover={{ bg: 'red.600' }}
              _active={{ bg: 'red.700' }}
              onClick={() =>
                window.open(
                  'https://cors-anywhere.herokuapp.com/corsdemo',
                  '_blank'
                )
              }
              fontFamily='heading'
            >
              🚨 Demo: Enable CORS
            </Button>
          </HStack>

          {/* Demo Instructions */}
          <Box
            p={3}
            bg='red.50'
            borderRadius='md'
            border='1px solid'
            borderColor='red.200'
          >
            <Text
              fontSize='sm'
              color='red.700'
              fontFamily='body'
              fontWeight='medium'
            >
              ⚠️ Demo Setup Required: Click the "Enable CORS" button above, then
              click "Request temporary access" on the opened page. After that,
              refresh this lab page to use the knowledgebase features.
            </Text>
          </Box>

          {/* Knowledgebase Content */}
          <Knowledgebase
            kbDocuments={kbDocuments}
            filteredKbDocuments={filteredKbDocuments}
            kbLoading={kbLoading}
            kbError={kbError}
            kbUploadLoading={kbUploadLoading}
            kbUploadError={kbUploadError}
            kbUploadSuccess={kbUploadSuccess}
            kbQuery={kbQuery}
            kbQueryResults={kbQueryResults}
            kbQueryLoading={kbQueryLoading}
            kbQueryError={kbQueryError}
            selectedFileTypes={selectedFileTypes}
            deletingDocuments={deletingDocuments}
            onKbQueryChange={setKbQuery}
            onKbQuery={handleKbQuery}
            onFileUpload={handleKbFileUpload}
            onFileTypeToggle={handleFileTypeToggle}
            onDeleteDocument={handleDeleteDocument}
            onRetryFetch={fetchKnowledgebaseDocuments}
          />
        </VStack>
      </VStack>
    </DndProvider>
  );
};

export default Gather;

import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { VStack, HStack, Text, Box, Alert, Button } from '@chakra-ui/react';
import { FiInfo, FiArrowRight } from 'react-icons/fi';

// Components
import DataSourcesControls from './DataSourcesControls';
import IncludeExcludeTermsCreation from './IncludeExcludeTermsCreation';
import KanbanOrganizerCreation from './KanbanOrganizerCreation';
import ExcludeTermConflictModal from './ExcludeTermConflictModal';
import CombinedCSVProcessingModal from './CombinedCSVProcessingModal';

// Types and utils
import type {
  LabCreationFormData,
  ValidationResult,
  WhiteboardLabSeed,
  LabSeed,
  CreationTerm,
  CreationSubject,
  CreationCategory,
  ConflictResolutionState,
  ConflictResolution,
  DataSourceType,
  CSVInternalConflict,
  CSVInternalResolution,
  ExcludeTermConflict,
  CSVData,
  ConflictItem,
} from './types';
import {
  generateCreationId,
  createUncategorizedCategory,
  parseCSVFile,
  checkSubjectExists,
  validateCSVInternally,
  applyCSVResolutions,
  checkExcludeTermConflicts,
  analyzeCSVConflicts,
} from './utils';

interface Step2DataInputProps {
  formData: LabCreationFormData;
  onFormDataUpdate: (updates: Partial<LabCreationFormData>) => void;
  validation: ValidationResult;
  initialLabSeed?: WhiteboardLabSeed;
  onNextStep: () => void; // Add this prop for the "Add subjects later" functionality
}

const Step2DataInput: React.FC<Step2DataInputProps> = ({
  formData,
  onFormDataUpdate,
  validation,
  initialLabSeed,
  onNextStep,
}) => {
  // State for combined CSV processing
  const [csvProcessingState, setCSVProcessingState] = useState<{
    isOpen: boolean;
    state:
      | 'stage1_processing'
      | 'stage1_conflicts'
      | 'stage2_processing'
      | 'stage2_conflicts'
      | 'completed';
    stage: 1 | 2;
    message: string;
    progress: number;
    internalConflicts: CSVInternalConflict[];
    internalResolutions: Record<string, CSVInternalResolution>;
    boardConflicts: ConflictItem[];
    boardResolutions: Record<string, ConflictResolution>;
    pendingCSVData?: CSVData;
  }>({
    isOpen: false,
    state: 'stage1_processing',
    stage: 1,
    message: '',
    progress: 0,
    internalConflicts: [],
    internalResolutions: {},
    boardConflicts: [],
    boardResolutions: {},
  });

  // State for exclude term conflicts
  const [excludeConflictState, setExcludeConflictState] = useState<{
    conflict: ExcludeTermConflict | null;
    isOpen: boolean;
    pendingTerm?: {
      text: string;
      type: 'include' | 'exclude';
      source: DataSourceType;
    };
  }>({
    conflict: null,
    isOpen: false,
  });

  // State for loading operations
  const [isLoading, setIsLoading] = useState(false);

  // Mock available Lab Seeds (in production, this would come from an API)
  const [availableLabSeeds] = useState<LabSeed[]>([
    // This would be populated from the whiteboard/API
  ]);

  // Check if lab is empty (no subjects or terms)
  const isLabEmpty = () => {
    const totalSubjects = formData.categories.reduce(
      (sum, cat) => sum + cat.subjects.length,
      0
    );
    const totalTerms =
      formData.includeTerms.length + formData.excludeTerms.length;
    return totalSubjects === 0 && totalTerms === 0;
  };

  // Handle "Add subjects later"
  const handleAddSubjectsLater = useCallback(() => {
    onNextStep();
  }, [onNextStep]);

  // Apply CSV changes with automatic merges (FIXED - prevents duplicates)
  const applyCSVChangesAutomatically = useCallback(
    async (
      categories: CreationCategory[],
      csvSubjects: CreationSubject[],
      csvData: CSVData,
      autoMerges: Array<{
        csvSubject: CreationSubject;
        existingSubject: CreationSubject;
      }>
    ) => {
      setCSVProcessingState((prev) => ({
        ...prev,
        state: 'stage2_processing',
        message: 'Applying changes...',
        progress: 90,
      }));

      // Add delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 300));

      const finalCategories = [...categories];

      // Track processed subject names to prevent duplicates
      const processedSubjectNames = new Set<string>();
      const mergedSubjectNames = new Set<string>();

      // First, handle auto-merges (existing subjects that need to be moved/kept)
      autoMerges.forEach((merge) => {
        const subjectNameLower = merge.csvSubject.subjectName.toLowerCase();
        processedSubjectNames.add(subjectNameLower);
        mergedSubjectNames.add(subjectNameLower);

        if (
          merge.existingSubject.categoryId === 'uncategorized' &&
          merge.csvSubject.categoryId !== 'uncategorized'
        ) {
          // Move from uncategorized to CSV category
          finalCategories.forEach((cat) => {
            if (cat.id === 'uncategorized') {
              // Remove from uncategorized
              cat.subjects = cat.subjects.filter(
                (s) => s.id !== merge.existingSubject.id
              );
            } else if (cat.id === merge.csvSubject.categoryId) {
              // Add to new category (update the existing subject's category)
              cat.subjects.push({
                ...merge.existingSubject,
                categoryId: merge.csvSubject.categoryId,
              });
            }
          });
        }
        // For same-category merges, we keep the existing subject as-is (no action needed)
      });

      // Then, add new subjects that weren't part of any merge and don't already exist
      csvSubjects.forEach((csvSubject) => {
        const subjectNameLower = csvSubject.subjectName.toLowerCase();

        // Only add if not processed in auto-merges and not already on board
        if (!processedSubjectNames.has(subjectNameLower)) {
          const categoryIndex = finalCategories.findIndex(
            (cat) => cat.id === csvSubject.categoryId
          );
          if (categoryIndex >= 0) {
            // Double-check: make sure no subject with this name already exists in the category
            const existsInCategory = finalCategories[
              categoryIndex
            ].subjects.some(
              (existingSubject) =>
                existingSubject.subjectName.toLowerCase() === subjectNameLower
            );

            if (!existsInCategory) {
              finalCategories[categoryIndex].subjects.push(csvSubject);
            }
          }
          processedSubjectNames.add(subjectNameLower);
        }
      });

      // Convert CSV terms
      const csvIncludeTerms: CreationTerm[] = (csvData.includeTerms || []).map(
        (term) => ({
          id: generateCreationId('term'),
          text: term,
          source: 'csv',
          type: 'include',
        })
      );

      const csvExcludeTerms: CreationTerm[] = (csvData.excludeTerms || []).map(
        (term) => ({
          id: generateCreationId('term'),
          text: term,
          source: 'csv',
          type: 'exclude',
        })
      );

      // Update form data
      onFormDataUpdate({
        categories: finalCategories,
        includeTerms: [...formData.includeTerms, ...csvIncludeTerms],
        excludeTerms: [...formData.excludeTerms, ...csvExcludeTerms],
        csvData,
      });

      setCSVProcessingState((prev) => ({
        ...prev,
        state: 'completed',
        message: 'CSV imported successfully!',
        progress: 100,
      }));

      // Close modal after delay
      setTimeout(() => {
        setCSVProcessingState((prev) => ({ ...prev, isOpen: false }));
      }, 2000);
    },
    [formData.includeTerms, formData.excludeTerms, onFormDataUpdate]
  );

  // Process CSV data through stage 2 validation (FIXED)
  const processCSVDataStage2 = useCallback(
    async (csvData: CSVData) => {
      // Ensure no other modals are open
      setExcludeConflictState({
        conflict: null,
        isOpen: false,
        pendingTerm: undefined,
      });

      // === STAGE 2: CSV vs Existing Board Validation ===
      setCSVProcessingState((prev) => ({
        ...prev,
        state: 'stage2_processing',
        stage: 2,
        message: 'Checking for conflicts with existing data...',
        progress: 60,
        pendingCSVData: csvData,
      }));

      // Add delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create categories from CSV subcategories
      const updatedCategories = [...formData.categories];

      // Ensure uncategorized category exists
      let uncategorizedIndex = updatedCategories.findIndex(
        (cat) => cat.id === 'uncategorized'
      );
      if (uncategorizedIndex === -1) {
        updatedCategories.unshift(createUncategorizedCategory());
        uncategorizedIndex = 0;
      }

      // Create category mapping
      const categoryMap: Record<string, string> = {
        uncategorized: 'uncategorized',
      };

      if (csvData.subcategories) {
        for (const subcategoryName of csvData.subcategories) {
          // Check if category already exists (case-insensitive)
          const existingCategory = updatedCategories.find(
            (cat) => cat.name.toLowerCase() === subcategoryName.toLowerCase()
          );

          if (existingCategory) {
            categoryMap[subcategoryName] = existingCategory.id;
          } else {
            // Create new category
            const newCategory: CreationCategory = {
              id: generateCreationId('cat'),
              name: subcategoryName,
              type: 'custom',
              subjects: [],
            };
            updatedCategories.push(newCategory);
            categoryMap[subcategoryName] = newCategory.id;
          }
        }
      }

      // Convert CSV subjects to creation subjects
      const csvSubjects: CreationSubject[] = [];

      if (csvData.subjects) {
        // Use the cleaned subjects from Stage 1 (deduplicated)
        for (const csvSubject of csvData.subjects) {
          const categoryId = csvSubject.category
            ? categoryMap[csvSubject.category] || 'uncategorized'
            : 'uncategorized';

          csvSubjects.push({
            id: generateCreationId('subj'),
            subjectName: csvSubject.name,
            categoryId,
            source: 'csv',
            isNewTerm: true,
          });
        }
      } else {
        // Fallback to terms array
        for (const term of csvData.terms) {
          csvSubjects.push({
            id: generateCreationId('subj'),
            subjectName: term,
            categoryId: 'uncategorized',
            source: 'csv',
            isNewTerm: true,
          });
        }
      }

      // Get existing subjects
      const existingSubjects = updatedCategories.flatMap((cat) => cat.subjects);

      // Check for various types of conflicts using the fixed analyzeCSVConflicts
      const conflictAnalysis = analyzeCSVConflicts(
        csvSubjects,
        existingSubjects,
        updatedCategories,
        formData.includeTerms,
        formData.excludeTerms
      );

      if (conflictAnalysis.hasConflicts) {
        // Show conflict resolution
        setCSVProcessingState((prev) => ({
          ...prev,
          state: 'stage2_conflicts',
          message: 'Data conflicts found',
          progress: 70,
          boardConflicts: conflictAnalysis.conflicts,
          boardResolutions: {},
        }));
      } else {
        // No conflicts, apply changes automatically
        await applyCSVChangesAutomatically(
          updatedCategories,
          csvSubjects,
          csvData,
          conflictAnalysis.autoMerges
        );
      }

      setIsLoading(false);
    },
    [
      formData.categories,
      formData.includeTerms,
      formData.excludeTerms,
      onFormDataUpdate,
      applyCSVChangesAutomatically,
    ]
  );

  // Initialize data from Lab Seed if provided
  useEffect(() => {
    if (initialLabSeed && formData.categories.length === 1) {
      // Only populate if we haven't already (check if only uncategorized exists)
      const uncategorizedCategory = createUncategorizedCategory();

      // Convert Lab Seed subjects to creation subjects
      const labSeedSubjects: CreationSubject[] = initialLabSeed.subjects.map(
        (subject) => ({
          id: generateCreationId('subj'),
          subjectId: subject.id,
          subjectName: subject.name,
          subjectSlug: subject.slug,
          subjectSummary: subject.summary,
          categoryId: subject.category || 'uncategorized',
          source: 'lab_seed',
          isNewTerm: false, // Lab Seed subjects are already processed
        })
      );

      // Create categories from Lab Seed
      const labSeedCategories: CreationCategory[] = [
        uncategorizedCategory,
        // Add any custom categories that have subjects
        ...Array.from(
          new Set(
            initialLabSeed.subjects.map((s) => s.category).filter(Boolean)
          )
        ).map((categoryName) => ({
          id: generateCreationId('cat'),
          name: categoryName!,
          type: 'custom' as const,
          subjects: labSeedSubjects.filter(
            (s) => s.categoryId === categoryName
          ),
        })),
      ];

      // Put uncategorized subjects in the uncategorized category
      const uncategorizedSubjects = labSeedSubjects.filter(
        (s) => s.categoryId === 'uncategorized'
      );
      labSeedCategories[0].subjects = uncategorizedSubjects;

      // Convert Lab Seed terms
      const labSeedIncludeTerms: CreationTerm[] =
        initialLabSeed.includeTerms.map((term) => ({
          id: generateCreationId('term'),
          text: term,
          source: 'lab_seed',
          type: 'include',
        }));

      const labSeedExcludeTerms: CreationTerm[] =
        initialLabSeed.excludeTerms.map((term) => ({
          id: generateCreationId('term'),
          text: term,
          source: 'lab_seed',
          type: 'exclude',
        }));

      // Update form data
      onFormDataUpdate({
        categories: labSeedCategories,
        includeTerms: labSeedIncludeTerms,
        excludeTerms: labSeedExcludeTerms,
        selectedLabSeed: {
          id: initialLabSeed.id,
          name: initialLabSeed.name,
          description: initialLabSeed.description,
          categories: [],
          subjects: labSeedSubjects.map((subject) => ({
            ...subject,
            addedAt: new Date().toISOString(),
            subjectId: subject.subjectId!,
          })),
          includeTerms: initialLabSeed.includeTerms,
          excludeTerms: initialLabSeed.excludeTerms,
          createdAt: initialLabSeed.createdAt,
          updatedAt: initialLabSeed.createdAt,
        },
      });
    }
  }, [initialLabSeed, formData.categories.length, onFormDataUpdate]);

  // Handle Lab Seed selection
  const handleLabSeedSelect = useCallback(
    (labSeed: LabSeed | undefined) => {
      if (!labSeed) {
        onFormDataUpdate({ selectedLabSeed: undefined });
        return;
      }

      onFormDataUpdate({ selectedLabSeed: labSeed });
    },
    [onFormDataUpdate]
  );

  // Handle Lab Seed options
  const handleLabSeedOptionsChange = useCallback(
    (replaceName: boolean, replaceSummary: boolean) => {
      onFormDataUpdate({
        replaceTitleFromLabSeed: replaceName,
        replaceSummaryFromLabSeed: replaceSummary,
      });

      // If Lab Seed is selected and options changed, update name/summary
      if (formData.selectedLabSeed) {
        const updates: Partial<LabCreationFormData> = {};

        if (replaceName) {
          updates.name = formData.selectedLabSeed.name;
        }

        if (replaceSummary) {
          updates.summary = formData.selectedLabSeed.description;
        }

        if (Object.keys(updates).length > 0) {
          onFormDataUpdate(updates);
        }
      }
    },
    [formData.selectedLabSeed, onFormDataUpdate]
  );

  // Handle CSV upload with comprehensive two-stage conflict detection
  const handleCSVUpload = useCallback(
    async (file: File) => {
      setIsLoading(true);

      try {
        // Parse the CSV file first
        const parseResult = await parseCSVFile(file);

        if (!parseResult.success || !parseResult.data) {
          throw new Error(parseResult.error || 'Failed to parse CSV');
        }

        const csvData = parseResult.data;

        // === STAGE 1: Internal CSV Validation ===
        setCSVProcessingState({
          isOpen: true,
          state: 'stage1_processing',
          stage: 1,
          message: 'Checking CSV file for internal conflicts...',
          progress: 25,
          internalConflicts: [],
          internalResolutions: {},
          boardConflicts: [],
          boardResolutions: {},
          pendingCSVData: csvData,
        });

        // Add delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 500));

        const internalValidation = validateCSVInternally(csvData);

        if (internalValidation.hasConflicts) {
          // Show internal conflict resolution
          setCSVProcessingState((prev) => ({
            ...prev,
            state: 'stage1_conflicts',
            message: 'CSV file issues found',
            progress: 30,
            internalConflicts: internalValidation.conflicts,
          }));
          setIsLoading(false);
          return;
        }

        // No internal conflicts, proceed to stage 2
        await processCSVDataStage2(csvData);
      } catch (error) {
        console.error('CSV upload failed:', error);
        setIsLoading(false);
        setCSVProcessingState((prev) => ({ ...prev, isOpen: false }));
        // Show error toast in production
      }
    },
    [processCSVDataStage2]
  );

  // Handle manual term addition with exclude term validation
  const handleManualTermAdd = useCallback(
    (term: string, categoryId: string) => {
      const trimmedTerm = term.trim();

      // Check if this term conflicts with existing exclude terms
      const isExcludeTerm = formData.excludeTerms.some(
        (excludeTerm) =>
          excludeTerm.text.toLowerCase() === trimmedTerm.toLowerCase()
      );

      if (isExcludeTerm) {
        // Show exclude conflict modal
        const conflictingExcludeTerm = formData.excludeTerms.find(
          (excludeTerm) =>
            excludeTerm.text.toLowerCase() === trimmedTerm.toLowerCase()
        );

        if (conflictingExcludeTerm) {
          const mockSubject: CreationSubject = {
            id: generateCreationId('subj'),
            subjectName: trimmedTerm,
            categoryId: categoryId || 'uncategorized',
            source: 'manual',
            isNewTerm: true,
          };

          const categoryName =
            categoryId === 'uncategorized'
              ? 'Uncategorized'
              : formData.categories.find((cat) => cat.id === categoryId)
                  ?.name || categoryId;

          setExcludeConflictState({
            conflict: {
              termName: trimmedTerm,
              conflictingSubjects: [
                {
                  subject: mockSubject,
                  categoryName,
                },
              ],
            },
            isOpen: true,
            pendingTerm: {
              text: trimmedTerm,
              type: 'include',
              source: 'manual',
            },
          });
          return;
        }
      }

      // No conflict, proceed with adding subject
      const newSubject: CreationSubject = {
        id: generateCreationId('subj'),
        subjectName: trimmedTerm,
        categoryId: categoryId || 'uncategorized',
        source: 'manual',
        isNewTerm: true,
      };

      const updatedCategories = formData.categories.map((category) => {
        if (category.id === newSubject.categoryId) {
          return {
            ...category,
            subjects: [...category.subjects, newSubject],
          };
        }
        return category;
      });

      onFormDataUpdate({ categories: updatedCategories });
    },
    [formData.categories, formData.excludeTerms, onFormDataUpdate]
  );

  // Handle term management with conflict checking
  const handleTermAdd = useCallback(
    (text: string, type: 'include' | 'exclude', source: DataSourceType) => {
      // For exclude terms, check for conflicts first
      if (type === 'exclude') {
        const allSubjects = formData.categories.flatMap((cat) => cat.subjects);
        const excludeConflict = checkExcludeTermConflicts(
          text,
          allSubjects,
          formData.categories
        );

        if (excludeConflict) {
          // Show exclude conflict modal
          setExcludeConflictState({
            conflict: excludeConflict,
            isOpen: true,
            pendingTerm: { text, type, source },
          });
          return;
        }
      }

      // No conflict, proceed with adding term
      const newTerm: CreationTerm = {
        id: generateCreationId('term'),
        text: text.trim(),
        source,
        type,
      };

      const updates: Partial<LabCreationFormData> = {};

      if (type === 'include') {
        updates.includeTerms = [...formData.includeTerms, newTerm];
      } else {
        updates.excludeTerms = [...formData.excludeTerms, newTerm];
      }

      onFormDataUpdate(updates);
    },
    [
      formData.includeTerms,
      formData.excludeTerms,
      formData.categories,
      onFormDataUpdate,
    ]
  );

  const handleTermRemove = useCallback(
    (termId: string) => {
      const updates: Partial<LabCreationFormData> = {
        includeTerms: formData.includeTerms.filter(
          (term) => term.id !== termId
        ),
        excludeTerms: formData.excludeTerms.filter(
          (term) => term.id !== termId
        ),
      };

      onFormDataUpdate(updates);
    },
    [formData.includeTerms, formData.excludeTerms, onFormDataUpdate]
  );

  const handleTermTypeToggle = useCallback(
    (termId: string) => {
      const updatedIncludeTerms = [...formData.includeTerms];
      const updatedExcludeTerms = [...formData.excludeTerms];

      // Find term in include list
      const includeIndex = updatedIncludeTerms.findIndex(
        (term) => term.id === termId
      );
      if (includeIndex >= 0) {
        const term = updatedIncludeTerms[includeIndex];

        // Check for exclude conflicts before switching
        const allSubjects = formData.categories.flatMap((cat) => cat.subjects);
        const excludeConflict = checkExcludeTermConflicts(
          term.text,
          allSubjects,
          formData.categories
        );

        if (excludeConflict) {
          // Show exclude conflict modal
          setExcludeConflictState({
            conflict: excludeConflict,
            isOpen: true,
            pendingTerm: {
              text: term.text,
              type: 'exclude',
              source: term.source,
            },
          });
          return;
        }

        updatedIncludeTerms.splice(includeIndex, 1);
        updatedExcludeTerms.push({ ...term, type: 'exclude' });
      } else {
        // Find term in exclude list
        const excludeIndex = updatedExcludeTerms.findIndex(
          (term) => term.id === termId
        );
        if (excludeIndex >= 0) {
          const term = updatedExcludeTerms[excludeIndex];
          updatedExcludeTerms.splice(excludeIndex, 1);
          updatedIncludeTerms.push({ ...term, type: 'include' });
        }
      }

      onFormDataUpdate({
        includeTerms: updatedIncludeTerms,
        excludeTerms: updatedExcludeTerms,
      });
    },
    [
      formData.includeTerms,
      formData.excludeTerms,
      formData.categories,
      onFormDataUpdate,
    ]
  );

  // Handle subject movement between categories
  const handleSubjectMove = useCallback(
    (subjectId: string, fromCategoryId: string, toCategoryId: string) => {
      if (fromCategoryId === toCategoryId) return;

      const updatedCategories = formData.categories.map((category) => {
        if (category.id === fromCategoryId) {
          return {
            ...category,
            subjects: category.subjects.filter(
              (subject) => subject.id !== subjectId
            ),
          };
        } else if (category.id === toCategoryId) {
          const subjectToMove = formData.categories
            .find((cat) => cat.id === fromCategoryId)
            ?.subjects.find((subj) => subj.id === subjectId);

          if (subjectToMove) {
            return {
              ...category,
              subjects: [
                ...category.subjects,
                { ...subjectToMove, categoryId: toCategoryId },
              ],
            };
          }
        }
        return category;
      });

      onFormDataUpdate({ categories: updatedCategories });
    },
    [formData.categories, onFormDataUpdate]
  );

  // Handle category management
  const handleCategoryAdd = useCallback(
    (name: string) => {
      const newCategory: CreationCategory = {
        id: generateCreationId('cat'),
        name: name.trim(),
        type: 'custom',
        subjects: [],
      };

      onFormDataUpdate({
        categories: [...formData.categories, newCategory],
      });
    },
    [formData.categories, onFormDataUpdate]
  );

  const handleCategoryRename = useCallback(
    (categoryId: string, newName: string) => {
      const updatedCategories = formData.categories.map((category) =>
        category.id === categoryId
          ? { ...category, name: newName.trim() }
          : category
      );

      onFormDataUpdate({ categories: updatedCategories });
    },
    [formData.categories, onFormDataUpdate]
  );

  // Add this new function for deleting category with all subjects
  const handleCategoryDeleteWithSubjects = useCallback(
    (categoryId: string) => {
      const updatedCategories = formData.categories.filter(
        (category) => category.id !== categoryId
      );
      onFormDataUpdate({ categories: updatedCategories });
    },
    [formData.categories, onFormDataUpdate]
  );

  // Update the existing handleCategoryDelete to only move subjects to uncategorized
  const handleCategoryDelete = useCallback(
    (categoryId: string) => {
      const categoryToDelete = formData.categories.find(
        (cat) => cat.id === categoryId
      );
      if (!categoryToDelete || categoryToDelete.type === 'default') return;

      // If category is empty, just remove it
      if (categoryToDelete.subjects.length === 0) {
        const updatedCategories = formData.categories.filter(
          (category) => category.id !== categoryId
        );
        onFormDataUpdate({ categories: updatedCategories });
        return;
      }

      // If category has subjects, move them to uncategorized (for "move_to_uncategorized" action)
      const uncategorizedCategory = formData.categories.find(
        (cat) => cat.id === 'uncategorized'
      );
      if (!uncategorizedCategory) return;

      const updatedCategories = formData.categories
        .filter((category) => category.id !== categoryId)
        .map((category) => {
          if (category.id === 'uncategorized') {
            return {
              ...category,
              subjects: [
                ...category.subjects,
                ...categoryToDelete.subjects.map((subject) => ({
                  ...subject,
                  categoryId: 'uncategorized',
                })),
              ],
            };
          }
          return category;
        });

      onFormDataUpdate({ categories: updatedCategories });
    },
    [formData.categories, onFormDataUpdate]
  );

  // Handle subject addition
  const handleSubjectAdd = useCallback(
    (name: string, categoryId: string) => {
      handleManualTermAdd(name, categoryId);
    },
    [handleManualTermAdd]
  );

  // Handle subject removal
  const handleSubjectRemove = useCallback(
    (subjectId: string) => {
      const updatedCategories = formData.categories.map((category) => ({
        ...category,
        subjects: category.subjects.filter(
          (subject) => subject.id !== subjectId
        ),
      }));

      onFormDataUpdate({ categories: updatedCategories });
    },
    [formData.categories, onFormDataUpdate]
  );

  // Handle combined CSV processing modal events
  const handleCSVInternalResolutionChange = useCallback(
    (termName: string, resolution: CSVInternalResolution) => {
      setCSVProcessingState((prev) => ({
        ...prev,
        internalResolutions: {
          ...prev.internalResolutions,
          [termName]: resolution,
        },
      }));
    },
    []
  );

  const handleCSVInternalResolve = useCallback(() => {
    if (!csvProcessingState.pendingCSVData) return;

    const { internalConflicts, internalResolutions, pendingCSVData } =
      csvProcessingState;

    // Apply resolutions to clean the CSV data
    const cleanedData = applyCSVResolutions(
      pendingCSVData,
      internalConflicts,
      internalResolutions
    );

    // Proceed to stage 2 with cleaned data
    processCSVDataStage2(cleanedData);
  }, [csvProcessingState, processCSVDataStage2]);

  const handleCSVBoardResolutionChange = useCallback(
    (itemName: string, resolution: ConflictResolution) => {
      setCSVProcessingState((prev) => ({
        ...prev,
        boardResolutions: {
          ...prev.boardResolutions,
          [itemName]: resolution,
        },
      }));
    },
    []
  );

  const handleCSVBoardResolve = useCallback(() => {
    if (!csvProcessingState.pendingCSVData) return;

    const { boardConflicts, boardResolutions, pendingCSVData } =
      csvProcessingState;

    // Create categories and subjects from the stored data
    const updatedCategories = [...formData.categories];

    // Ensure uncategorized category exists
    let uncategorizedIndex = updatedCategories.findIndex(
      (cat) => cat.id === 'uncategorized'
    );
    if (uncategorizedIndex === -1) {
      updatedCategories.unshift(createUncategorizedCategory());
      uncategorizedIndex = 0;
    }

    // Create category mapping
    const categoryMap: Record<string, string> = {
      uncategorized: 'uncategorized',
    };

    if (pendingCSVData.subcategories) {
      for (const subcategoryName of pendingCSVData.subcategories) {
        const existingCategory = updatedCategories.find(
          (cat) => cat.name.toLowerCase() === subcategoryName.toLowerCase()
        );

        if (existingCategory) {
          categoryMap[subcategoryName] = existingCategory.id;
        } else {
          const newCategory: CreationCategory = {
            id: generateCreationId('cat'),
            name: subcategoryName,
            type: 'custom',
            subjects: [],
          };
          updatedCategories.push(newCategory);
          categoryMap[subcategoryName] = newCategory.id;
        }
      }
    }

    // Convert CSV subjects
    const csvSubjects: CreationSubject[] = [];

    if (pendingCSVData.subjects) {
      for (const csvSubject of pendingCSVData.subjects) {
        const categoryId = csvSubject.category
          ? categoryMap[csvSubject.category] || 'uncategorized'
          : 'uncategorized';

        csvSubjects.push({
          id: generateCreationId('subj'),
          subjectName: csvSubject.name,
          categoryId,
          source: 'csv',
          isNewTerm: true,
        });
      }
    } else {
      for (const term of pendingCSVData.terms) {
        csvSubjects.push({
          id: generateCreationId('subj'),
          subjectName: term,
          categoryId: 'uncategorized',
          source: 'csv',
          isNewTerm: true,
        });
      }
    }

    const finalCategories = [...updatedCategories];

    // Process each conflict based on resolution
    const excludeTermsToRemove = new Set<string>();

    boardConflicts.forEach((conflict) => {
      const resolution = boardResolutions[conflict.name];
      if (!resolution) return;

      const newSubject = conflict.newSubject;
      if (!newSubject) return;

      if (conflict.isExcludeConflict) {
        if (resolution.action === 'use_new') {
          // Remove exclude term and add subject
          excludeTermsToRemove.add(conflict.name.toLowerCase());

          // Add subject to appropriate category
          const categoryIndex = finalCategories.findIndex(
            (cat) => cat.id === newSubject.categoryId
          );
          if (categoryIndex >= 0) {
            finalCategories[categoryIndex].subjects.push(newSubject);
          }
        }
      } else {
        if (resolution.action === 'keep_existing') {
          // Do nothing - keep existing subject as is
          return;
        } else if (resolution.action === 'use_new') {
          // Remove existing subject and add new one to selected category
          finalCategories.forEach((cat) => {
            cat.subjects = cat.subjects.filter(
              (s) => s.subjectName.toLowerCase() !== conflict.name.toLowerCase()
            );
          });

          // Add new subject to target category
          const targetCategoryId =
            resolution.targetCategory || newSubject.categoryId;
          const categoryIndex = finalCategories.findIndex(
            (cat) => cat.id === targetCategoryId
          );
          if (categoryIndex >= 0) {
            finalCategories[categoryIndex].subjects.push({
              ...newSubject,
              categoryId: targetCategoryId,
            });
          }
        }
      }
    });

    // Add non-conflicting subjects
    csvSubjects.forEach((subject) => {
      const hasConflict = boardConflicts.some(
        (c) => c.name.toLowerCase() === subject.subjectName.toLowerCase()
      );

      if (!hasConflict) {
        const categoryIndex = finalCategories.findIndex(
          (cat) => cat.id === subject.categoryId
        );
        if (categoryIndex >= 0) {
          finalCategories[categoryIndex].subjects.push(subject);
        }
      }
    });

    // Convert CSV terms
    const csvIncludeTerms: CreationTerm[] = (
      pendingCSVData.includeTerms || []
    ).map((term) => ({
      id: generateCreationId('term'),
      text: term,
      source: 'csv',
      type: 'include',
    }));

    const csvExcludeTerms: CreationTerm[] = (
      pendingCSVData.excludeTerms || []
    ).map((term) => ({
      id: generateCreationId('term'),
      text: term,
      source: 'csv',
      type: 'exclude',
    }));

    // Filter out exclude terms that were converted to subjects
    const filteredExcludeTerms = [
      ...formData.excludeTerms,
      ...csvExcludeTerms.filter(
        (term) => !excludeTermsToRemove.has(term.text.toLowerCase())
      ),
    ];

    // Update form data
    onFormDataUpdate({
      categories: finalCategories,
      includeTerms: [...formData.includeTerms, ...csvIncludeTerms],
      excludeTerms: filteredExcludeTerms,
      csvData: pendingCSVData,
    });

    setCSVProcessingState((prev) => ({
      ...prev,
      state: 'completed',
      message: 'CSV imported successfully!',
      progress: 100,
    }));

    // Close modal after delay
    setTimeout(() => {
      setCSVProcessingState((prev) => ({ ...prev, isOpen: false }));
    }, 2000);
  }, [csvProcessingState, formData, onFormDataUpdate]);

  const handleCSVProcessingCancel = useCallback(() => {
    setCSVProcessingState({
      isOpen: false,
      state: 'stage1_processing',
      stage: 1,
      message: '',
      progress: 0,
      internalConflicts: [],
      internalResolutions: {},
      boardConflicts: [],
      boardResolutions: {},
      pendingCSVData: undefined,
    });
    setIsLoading(false);
    onFormDataUpdate({ csvData: undefined });
  }, [onFormDataUpdate]);

  // Handle exclude term conflict resolution
  const handleExcludeConflictResolve = useCallback(
    (action: 'keep_exclude' | 'keep_subjects') => {
      const { pendingTerm } = excludeConflictState;

      if (!pendingTerm) {
        setExcludeConflictState({
          conflict: null,
          isOpen: false,
          pendingTerm: undefined,
        });
        return;
      }

      if (action === 'keep_exclude') {
        // User chose to add exclude term and remove conflicting subjects
        if (excludeConflictState.conflict) {
          // Remove conflicting subjects
          const updatedCategories = formData.categories.map((category) => ({
            ...category,
            subjects: category.subjects.filter(
              (subject) =>
                !excludeConflictState.conflict!.conflictingSubjects.some(
                  (conflictSubject) => conflictSubject.subject.id === subject.id
                )
            ),
          }));

          // Add the exclude term if it's not already there and this is a new exclude term request
          if (pendingTerm.type === 'exclude') {
            const newTerm: CreationTerm = {
              id: generateCreationId('term'),
              text: pendingTerm.text.trim(),
              source: pendingTerm.source,
              type: 'exclude',
            };

            onFormDataUpdate({
              categories: updatedCategories,
              excludeTerms: [...formData.excludeTerms, newTerm],
            });
          } else {
            // This was from manual subject entry, just remove the conflicting subjects
            // The exclude term already exists
            onFormDataUpdate({
              categories: updatedCategories,
            });
          }
        }
      } else if (action === 'keep_subjects' && pendingTerm.type === 'include') {
        // This was from manual subject entry - add the subject since user chose to keep subjects
        const categoryId =
          excludeConflictState.conflict?.conflictingSubjects[0]?.subject
            .categoryId || 'uncategorized';

        const newSubject: CreationSubject = {
          id: generateCreationId('subj'),
          subjectName: pendingTerm.text.trim(),
          categoryId,
          source: pendingTerm.source,
          isNewTerm: true,
        };

        // Remove the conflicting exclude term
        const updatedExcludeTerms = formData.excludeTerms.filter(
          (term) => term.text.toLowerCase() !== pendingTerm.text.toLowerCase()
        );

        const updatedCategories = formData.categories.map((category) => {
          if (category.id === newSubject.categoryId) {
            return {
              ...category,
              subjects: [...category.subjects, newSubject],
            };
          }
          return category;
        });

        onFormDataUpdate({
          categories: updatedCategories,
          excludeTerms: updatedExcludeTerms,
        });
      }
      // If 'keep_subjects' for exclude term toggle, we just close the modal and do nothing

      setExcludeConflictState({
        conflict: null,
        isOpen: false,
        pendingTerm: undefined,
      });
    },
    [
      excludeConflictState,
      formData.categories,
      formData.excludeTerms,
      onFormDataUpdate,
    ]
  );

  const handleExcludeConflictCancel = useCallback(() => {
    setExcludeConflictState({
      conflict: null,
      isOpen: false,
      pendingTerm: undefined,
    });
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <VStack gap={6} align='stretch'>
        {/* Header */}
        <VStack gap={3} align='start'>
          <Text
            fontSize='xl'
            fontWeight='semibold'
            color='fg'
            fontFamily='heading'
          >
            Data Input & Organization
          </Text>

          {initialLabSeed ? (
            <HStack gap={2} align='start'>
              <FiInfo size={16} color='var(--chakra-colors-brand)' />
              <Text
                fontSize='sm'
                color='fg.muted'
                fontFamily='body'
                lineHeight='1.5'
              >
                Your Lab Seed data has been loaded. You can add more subjects
                using CSV upload or manual entry, and reorganize everything
                using drag and drop.
              </Text>
            </HStack>
          ) : (
            <Text fontSize='sm' color='fg.muted' fontFamily='body'>
              Add subjects and organize them into categories. You can use Lab
              Seeds, upload CSV files, or add subjects manually. Include/Exclude
              terms help filter search results.
            </Text>
          )}
        </VStack>

        {/* Empty lab option - only show when lab is empty */}
        {isLabEmpty() && (
          <Box
            p={4}
            bg='bg.canvas'
            borderRadius='md'
            borderWidth='1px'
            borderColor='border.emphasized'
          >
            <VStack gap={3} align='stretch'>
              <HStack justify='space-between' align='center'>
                <VStack gap={1} align='start'>
                  <Text
                    fontSize='md'
                    fontWeight='medium'
                    color='fg'
                    fontFamily='heading'
                  >
                    Create Empty Lab
                  </Text>
                  <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                    Start with an empty lab and add subjects later
                  </Text>
                </VStack>
                <Button
                  onClick={handleAddSubjectsLater}
                  variant='outline'
                  size='sm'
                  bg='bg.canvas'
                  borderColor='border.emphasized'
                  color='fg'
                  _hover={{ bg: 'bg.hover' }}
                  fontFamily='heading'
                  rightIcon={<FiArrowRight size={14} />}
                >
                  Add subjects later
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Main layout */}
        <VStack gap={6} align='stretch'>
          {/* Include/Exclude Terms - Full Width */}
          <IncludeExcludeTermsCreation
            includeTerms={formData.includeTerms}
            excludeTerms={formData.excludeTerms}
            onTermAdd={handleTermAdd}
            onTermRemove={handleTermRemove}
            onTermTypeToggle={handleTermTypeToggle}
            canEdit={true}
            isLoading={isLoading}
            allSubjects={formData.categories.flatMap((cat) => cat.subjects)}
            categories={formData.categories}
          />

          {/* Data Sources Controls - Limited Width, Centered */}
          <HStack justify='start' w='100%'>
            <Box maxW='640px' w='100%'>
              <DataSourcesControls
                formData={formData}
                availableLabSeeds={availableLabSeeds}
                onLabSeedSelect={handleLabSeedSelect}
                onLabSeedOptionsChange={handleLabSeedOptionsChange}
                onCSVUpload={handleCSVUpload}
                onManualTermAdd={handleManualTermAdd}
                isLoading={isLoading}
              />
            </Box>
          </HStack>

          {/* Kanban Organizer - Full Width with Overflow Constraints */}
          <Box w='100%' overflowX='hidden'>
            <KanbanOrganizerCreation
              categories={formData.categories}
              onSubjectMove={handleSubjectMove}
              onCategoryAdd={handleCategoryAdd}
              onCategoryRename={handleCategoryRename}
              onCategoryDelete={handleCategoryDelete}
              onCategoryDeleteWithSubjects={handleCategoryDeleteWithSubjects}
              onSubjectAdd={handleSubjectAdd}
              onSubjectRemove={handleSubjectRemove}
              isLoading={isLoading}
            />
          </Box>
        </VStack>

        {/* Validation info */}
        {validation.errors.length > 0 && (
          <Alert.Root status='error'>
            <Alert.Indicator />
            <Alert.Title>Please address these issues:</Alert.Title>
            <Alert.Description fontFamily='body'>
              <VStack gap={1} align='start'>
                {validation.errors.map((error, index) => (
                  <Text key={index} fontSize='sm'>
                    • {error}
                  </Text>
                ))}
              </VStack>
            </Alert.Description>
          </Alert.Root>
        )}

        {/* Combined CSV Processing Modal */}
        <CombinedCSVProcessingModal
          isOpen={csvProcessingState.isOpen}
          state={csvProcessingState.state}
          stage={csvProcessingState.stage}
          message={csvProcessingState.message}
          progress={csvProcessingState.progress}
          internalConflicts={csvProcessingState.internalConflicts}
          internalResolutions={csvProcessingState.internalResolutions}
          availableCategories={formData.categories}
          onInternalResolutionChange={handleCSVInternalResolutionChange}
          onInternalResolve={handleCSVInternalResolve}
          boardConflicts={csvProcessingState.boardConflicts}
          boardResolutions={csvProcessingState.boardResolutions}
          onBoardResolutionChange={handleCSVBoardResolutionChange}
          onBoardResolve={handleCSVBoardResolve}
          onCancel={handleCSVProcessingCancel}
        />

        {/* Exclude Term Conflict Modal */}
        <ExcludeTermConflictModal
          isOpen={excludeConflictState.isOpen}
          conflict={excludeConflictState.conflict}
          onResolve={handleExcludeConflictResolve}
          onCancel={handleExcludeConflictCancel}
        />
      </VStack>
    </DndProvider>
  );
};

export default Step2DataInput;

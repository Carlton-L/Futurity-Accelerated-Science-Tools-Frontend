import type {
  CSVData,
  CSVParseResult,
  CSVValidationError,
  LabCreationFormData,
  CreationSubject,
  CreationCategory,
  ConflictItem,
  DataSourceType,
  ValidationResult,
  StepValidation,
  CSVInternalConflict,
  CSVValidationResult,
  CSVInternalResolution,
  ExcludeTermConflict,
  CreationTerm,
  CreateLabRequest,
} from '../types';

// ============================================================================
// CSV Processing Utilities
// ============================================================================

/**
 * Parse CSV file and extract terms/subjects with category mapping
 */
export const parseCSVFile = async (file: File): Promise<CSVParseResult> => {
  return new Promise(async (resolve) => {
    try {
      // Dynamic import for Papa Parse
      const Papa = (await import('papaparse')).default;

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        complete: (results: any) => {
          try {
            if (results.errors.length > 0) {
              resolve({
                success: false,
                error: `CSV parsing errors: ${results.errors
                  .map((e: any) => e.message)
                  .join(', ')}`,
              });
              return;
            }

            const data = processCSVDataWithCategories(results.data);
            resolve({
              success: true,
              data,
              rowCount: results.data.length,
              columnCount: results.meta.fields?.length || 0,
            });
          } catch (error) {
            resolve({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Unknown error processing CSV',
            });
          }
        },
        error: (error: any) => {
          resolve({
            success: false,
            error: `Failed to parse CSV: ${error.message}`,
          });
        },
      });
    } catch (error) {
      resolve({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to load CSV parser',
      });
    }
  });
};

/**
 * Process raw CSV data into structured format with proper category mapping
 */
const processCSVDataWithCategories = (
  rawData: Record<string, any>[]
): CSVData => {
  const terms: string[] = [];
  const subcategories: string[] = [];
  const includeTerms: string[] = [];
  const excludeTerms: string[] = [];
  const subjects: Array<{ name: string; category?: string }> = [];

  for (const row of rawData) {
    // Clean and normalize headers
    const cleanRow = Object.keys(row).reduce((acc, key) => {
      const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      acc[cleanKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
      return acc;
    }, {} as Record<string, any>);

    // Handle the specific structure: subject_name, subcategory_name
    const subjectName =
      cleanRow['subject_name'] || cleanRow['term'] || cleanRow['name'];
    const subcategoryName =
      cleanRow['subcategory_name'] ||
      cleanRow['category'] ||
      cleanRow['subcategory'];

    if (subjectName && typeof subjectName === 'string') {
      const term = subjectName.trim();

      if (term) {
        // Check if this is an include/exclude term based on subcategory
        if (subcategoryName && typeof subcategoryName === 'string') {
          const subcategory = subcategoryName.trim();

          if (subcategory === '_include') {
            // This is an include term
            if (!includeTerms.includes(term)) {
              includeTerms.push(term);
            }
          } else if (subcategory === '_exclude') {
            // This is an exclude term
            if (!excludeTerms.includes(term)) {
              excludeTerms.push(term);
            }
          } else {
            // This is a regular subject term with a category
            if (!terms.includes(term)) {
              terms.push(term);
            }
            // Track the subcategory
            if (!subcategories.includes(subcategory)) {
              subcategories.push(subcategory);
            }
            // Store the subject with its category mapping
            subjects.push({
              name: term,
              category: subcategory,
            });
          }
        } else {
          // Subject with no category (will go to uncategorized)
          if (!terms.includes(term)) {
            terms.push(term);
          }
          subjects.push({
            name: term,
            category: undefined,
          });
        }
      }
    }
  }

  return {
    terms,
    subjects,
    subcategories,
    includeTerms,
    excludeTerms,
  };
};

// ============================================================================
// Data Source Management
// ============================================================================

/**
 * Generate unique ID for creation items
 */
export const generateCreationId = (prefix: string = 'create'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get display text for source badge
 */
export const getSourceDisplayText = (source: DataSourceType): string => {
  switch (source) {
    case 'lab_seed':
      return 'Lab Seed';
    case 'csv':
      return 'CSV';
    case 'manual':
      return 'Manual';
    default:
      return 'Unknown';
  }
};

/**
 * Get color for source badge
 */
export const getSourceColor = (source: DataSourceType): string => {
  switch (source) {
    case 'lab_seed':
      return 'blue';
    case 'csv':
      return 'green';
    case 'manual':
      return 'purple';
    default:
      return 'gray';
  }
};

// ============================================================================
// Enhanced CSV Internal Validation Functions (FIXED)
// ============================================================================

/**
 * Enhanced CSV internal validation with improved duplicate handling
 */
export const validateCSVInternally = (
  csvData: CSVData
): CSVValidationResult => {
  const conflicts: CSVInternalConflict[] = [];
  const cleanedSubjects: Array<{ name: string; category?: string }> = [];
  const processedSubjects = new Set<string>();

  // Track subjects by name (case-insensitive) and their categories
  const subjectGroups = new Map<
    string,
    Array<{ name: string; category?: string }>
  >();

  // Group subjects by name (case-insensitive)
  if (csvData.subjects) {
    csvData.subjects.forEach((subject) => {
      const lowerName = subject.name.toLowerCase();
      if (!subjectGroups.has(lowerName)) {
        subjectGroups.set(lowerName, []);
      }
      subjectGroups.get(lowerName)!.push(subject);
    });
  } else if (csvData.terms) {
    // Fallback for legacy CSV format
    csvData.terms.forEach((term) => {
      const lowerName = term.toLowerCase();
      if (!subjectGroups.has(lowerName)) {
        subjectGroups.set(lowerName, []);
      }
      subjectGroups.get(lowerName)!.push({ name: term, category: undefined });
    });
  }

  // Process each subject group for internal CSV conflicts only
  subjectGroups.forEach((subjects, lowerName) => {
    if (processedSubjects.has(lowerName)) return;

    // Normalize categories (treat undefined/empty as 'uncategorized')
    const normalizedSubjects = subjects.map((s) => ({
      ...s,
      category: s.category || 'uncategorized',
    }));

    // Group by category (case-insensitive)
    const categoriesMap = new Map<
      string,
      Array<{ name: string; category: string }>
    >();

    normalizedSubjects.forEach((subject) => {
      const categoryKey = subject.category.toLowerCase();
      if (!categoriesMap.has(categoryKey)) {
        categoriesMap.set(categoryKey, []);
      }
      categoriesMap.get(categoryKey)!.push(subject);
    });

    if (categoriesMap.size === 1) {
      // All instances have the same category - auto merge, use first instance
      const firstSubject = normalizedSubjects[0];
      cleanedSubjects.push({
        name: firstSubject.name, // Use original casing
        category:
          firstSubject.category === 'uncategorized'
            ? undefined
            : firstSubject.category,
      });
    } else {
      // Multiple categories within CSV - create internal conflict for user resolution
      const uniqueCategories = Array.from(categoriesMap.keys()).map(
        (categoryKey) => {
          // Get the original casing from the first instance in each category
          const firstInCategory = categoriesMap.get(categoryKey)![0];
          return firstInCategory.category;
        }
      );

      conflicts.push({
        name: normalizedSubjects[0].name, // Use original casing
        categories: uniqueCategories,
        type: 'duplicate_subject',
      });
    }

    processedSubjects.add(lowerName);
  });

  // Check for subjects vs exclude terms conflicts
  const excludeTermsLower = (csvData.excludeTerms || []).map((t) =>
    t.toLowerCase()
  );

  // Only check cleaned subjects (no duplicates) against exclude terms
  cleanedSubjects.forEach((subject) => {
    const subjectNameLower = subject.name.toLowerCase();
    if (excludeTermsLower.includes(subjectNameLower)) {
      const categories = [subject.category || 'uncategorized'];

      conflicts.push({
        name: subject.name,
        categories: [...categories, '_exclude'],
        type: 'subject_vs_exclude',
      });
    }
  });

  // Check for include vs exclude conflicts
  const includeTermsLower = (csvData.includeTerms || []).map((t) =>
    t.toLowerCase()
  );

  excludeTermsLower.forEach((excludeTerm) => {
    const originalExcludeTerm = (csvData.excludeTerms || []).find(
      (t) => t.toLowerCase() === excludeTerm
    );

    if (includeTermsLower.includes(excludeTerm)) {
      conflicts.push({
        name: originalExcludeTerm || excludeTerm,
        categories: ['_include', '_exclude'],
        type: 'include_vs_exclude',
      });
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    cleanedSubjects,
    cleanedIncludeTerms: csvData.includeTerms,
    cleanedExcludeTerms: csvData.excludeTerms,
  };
};

/**
 * Apply CSV internal resolutions to clean the data
 */
export const applyCSVResolutions = (
  csvData: CSVData,
  conflicts: CSVInternalConflict[],
  resolutions: Record<string, CSVInternalResolution>
): CSVData => {
  const cleanedSubjects: Array<{ name: string; category?: string }> = [];
  const cleanedIncludeTerms: string[] = [...(csvData.includeTerms || [])];
  const cleanedExcludeTerms: string[] = [...(csvData.excludeTerms || [])];

  // Process subjects based on resolutions
  const processedNames = new Set<string>();

  if (csvData.subjects) {
    csvData.subjects.forEach((subject) => {
      const lowerName = subject.name.toLowerCase();

      if (processedNames.has(lowerName)) return; // Skip if already processed

      const conflict = conflicts.find(
        (c) => c.name.toLowerCase() === lowerName
      );
      if (conflict && resolutions[conflict.name]) {
        const resolution = resolutions[conflict.name];

        if (resolution.selectedCategory === '_exclude') {
          // Add to exclude terms, remove from includes if present
          if (!cleanedExcludeTerms.some((t) => t.toLowerCase() === lowerName)) {
            cleanedExcludeTerms.push(subject.name);
          }
          const includeIndex = cleanedIncludeTerms.findIndex(
            (t) => t.toLowerCase() === lowerName
          );
          if (includeIndex >= 0) {
            cleanedIncludeTerms.splice(includeIndex, 1);
          }
        } else if (resolution.selectedCategory === '_include') {
          // Add to include terms, remove from excludes if present
          if (!cleanedIncludeTerms.some((t) => t.toLowerCase() === lowerName)) {
            cleanedIncludeTerms.push(subject.name);
          }
          const excludeIndex = cleanedExcludeTerms.findIndex(
            (t) => t.toLowerCase() === lowerName
          );
          if (excludeIndex >= 0) {
            cleanedExcludeTerms.splice(excludeIndex, 1);
          }
        } else {
          // Add as subject to selected category
          cleanedSubjects.push({
            name: subject.name,
            category:
              resolution.selectedCategory === 'uncategorized'
                ? undefined
                : resolution.selectedCategory,
          });
        }

        processedNames.add(lowerName);
      } else if (!conflict) {
        // No conflict, add as is
        cleanedSubjects.push(subject);
        processedNames.add(lowerName);
      }
    });
  }

  return {
    ...csvData,
    subjects: cleanedSubjects,
    includeTerms: cleanedIncludeTerms,
    excludeTerms: cleanedExcludeTerms,
  };
};

// ============================================================================
// Enhanced Board Conflict Analysis (FIXED)
// ============================================================================

/**
 * Enhanced conflict analysis for CSV vs existing board with improved logic
 * FIXED: Prevents duplicate subjects from being added to the board
 */
export const analyzeCSVConflicts = (
  csvSubjects: CreationSubject[],
  existingSubjects: CreationSubject[],
  categories: CreationCategory[],
  existingIncludeTerms: CreationTerm[],
  existingExcludeTerms: CreationTerm[]
) => {
  const conflicts: ConflictItem[] = [];
  const autoMerges: Array<{
    csvSubject: CreationSubject;
    existingSubject: CreationSubject;
  }> = [];

  // Create lookup maps for efficiency
  const existingByName = new Map<string, CreationSubject>();
  existingSubjects.forEach((subject) => {
    existingByName.set(subject.subjectName.toLowerCase(), subject);
  });

  const includeTermsByName = new Set(
    existingIncludeTerms.map((term) => term.text.toLowerCase())
  );
  const excludeTermsByName = new Set(
    existingExcludeTerms.map((term) => term.text.toLowerCase())
  );

  // Helper to get category name
  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'uncategorized') return 'Uncategorized';
    return categories.find((cat) => cat.id === categoryId)?.name || categoryId;
  };

  // Helper to check if categories match (case-insensitive)
  const categoriesMatch = (cat1: string, cat2: string) => {
    const name1 = getCategoryName(cat1).toLowerCase();
    const name2 = getCategoryName(cat2).toLowerCase();
    return name1 === name2;
  };

  // Track processed subjects to prevent duplicates
  const processedSubjects = new Set<string>();

  // Process each unique CSV subject (csvSubjects should already be deduplicated by internal validation)
  for (const csvSubject of csvSubjects) {
    const subjectNameLower = csvSubject.subjectName.toLowerCase();

    // Skip if we've already processed this subject name
    if (processedSubjects.has(subjectNameLower)) {
      continue;
    }

    const existingSubject = existingByName.get(subjectNameLower);

    // Check for conflicts with exclude terms
    if (excludeTermsByName.has(subjectNameLower)) {
      conflicts.push({
        name: csvSubject.subjectName,
        existingCategory: '_exclude', // Special marker for exclude terms
        newCategory: getCategoryName(csvSubject.categoryId),
        source: 'csv',
        existingSource: 'exclude_term', // Special marker
        newSubject: csvSubject,
        isExcludeConflict: true,
      });
      processedSubjects.add(subjectNameLower);
      continue;
    }

    // Include terms are fine - no conflict needed
    if (includeTermsByName.has(subjectNameLower)) {
      // This is fine, include terms can coexist with subjects
      // But we still need to add the subject if it doesn't exist
      if (!existingSubject) {
        // Add new subject - it will be handled automatically
        processedSubjects.add(subjectNameLower);
      } else {
        // Subject exists, treat like a normal subject conflict
        if (
          categoriesMatch(existingSubject.categoryId, csvSubject.categoryId)
        ) {
          // Same category - auto merge
          autoMerges.push({ csvSubject, existingSubject });
        } else if (existingSubject.categoryId === 'uncategorized') {
          // Move from uncategorized to CSV category
          autoMerges.push({ csvSubject, existingSubject });
        } else {
          // Different categories - conflict
          conflicts.push({
            name: csvSubject.subjectName,
            existingCategory: getCategoryName(existingSubject.categoryId),
            newCategory: getCategoryName(csvSubject.categoryId),
            source: csvSubject.source,
            existingSource: existingSubject.source,
            existingSubject,
            newSubject: csvSubject,
          });
        }
        processedSubjects.add(subjectNameLower);
      }
      continue;
    }

    if (existingSubject) {
      // Subject exists on board
      if (categoriesMatch(existingSubject.categoryId, csvSubject.categoryId)) {
        // Same category (case-insensitive) - auto merge, keep existing
        autoMerges.push({ csvSubject, existingSubject });
      } else if (existingSubject.categoryId === 'uncategorized') {
        // Existing is uncategorized, CSV has category - auto move
        autoMerges.push({ csvSubject, existingSubject });
      } else {
        // Different categories - needs user resolution
        conflicts.push({
          name: csvSubject.subjectName,
          existingCategory: getCategoryName(existingSubject.categoryId),
          newCategory: getCategoryName(csvSubject.categoryId),
          source: csvSubject.source,
          existingSource: existingSubject.source,
          existingSubject,
          newSubject: csvSubject,
        });
      }
    }
    // If no existing subject and no term conflicts, it will be added automatically

    processedSubjects.add(subjectNameLower);
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    autoMerges,
  };
};

/**
 * Check for exclude term conflicts with existing subjects
 */
export const checkExcludeTermConflicts = (
  termName: string,
  existingSubjects: CreationSubject[],
  categories: CreationCategory[]
): ExcludeTermConflict | null => {
  const conflictingSubjects = existingSubjects.filter(
    (subject) => subject.subjectName.toLowerCase() === termName.toLowerCase()
  );

  if (conflictingSubjects.length > 0) {
    return {
      termName,
      conflictingSubjects: conflictingSubjects.map((subject) => ({
        subject,
        categoryName:
          subject.categoryId === 'uncategorized'
            ? 'Uncategorized'
            : categories.find((cat) => cat.id === subject.categoryId)?.name ||
              subject.categoryId,
      })),
    };
  }

  return null;
};

/**
 * Check if a subject name already exists (case-insensitive)
 */
export const checkSubjectExists = (
  subjectName: string,
  existingSubjects: CreationSubject[],
  categories: CreationCategory[]
): { exists: boolean; subject?: CreationSubject; categoryName?: string } => {
  const existing = existingSubjects.find(
    (subject) => subject.subjectName.toLowerCase() === subjectName.toLowerCase()
  );

  if (existing) {
    // Find category name
    let categoryName = 'Uncategorized';
    if (existing.categoryId !== 'uncategorized') {
      const category = categories.find((cat) => cat.id === existing.categoryId);
      categoryName = category ? category.name : existing.categoryId;
    }
    return { exists: true, subject: existing, categoryName };
  }

  return { exists: false };
};

/**
 * Detect all types of conflicts including exclude term conflicts
 */
export const detectAllConflicts = (
  existingSubjects: CreationSubject[],
  newSubjects: CreationSubject[],
  newTerms: CreationTerm[],
  categories: CreationCategory[]
): {
  subjectConflicts: ConflictItem[];
  excludeTermConflicts: ExcludeTermConflict[];
} => {
  const subjectConflicts = analyzeCSVConflicts(
    newSubjects,
    existingSubjects,
    categories,
    [], // Include terms - passed separately as needed
    [] // Exclude terms - passed separately as needed
  ).conflicts;

  const excludeTermConflicts: ExcludeTermConflict[] = [];
  newTerms
    .filter((term) => term.type === 'exclude')
    .forEach((term) => {
      const conflict = checkExcludeTermConflicts(
        term.text,
        existingSubjects,
        categories
      );
      if (conflict) {
        excludeTermConflicts.push(conflict);
      }
    });

  return {
    subjectConflicts,
    excludeTermConflicts,
  };
};

// ============================================================================
// Form Validation (keeping existing functions)
// ============================================================================

/**
 * Validate Step 1: Basic Info
 */
export const validateStep1 = (
  formData: LabCreationFormData
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name validation
  if (!formData.name.trim()) {
    errors.push('Lab name is required');
  } else if (formData.name.trim().length < 3) {
    errors.push('Lab name must be at least 3 characters long');
  } else if (formData.name.trim().length > 100) {
    errors.push('Lab name cannot exceed 100 characters');
  }

  // Summary validation (optional but recommended)
  if (!formData.summary.trim()) {
    warnings.push(
      'Consider adding a lab summary to help team members understand the purpose'
    );
  } else if (formData.summary.trim().length > 500) {
    warnings.push('Lab summary is quite long - consider keeping it concise');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate Step 2: Data Input - Updated to allow empty labs
 */
export const validateStep2 = (
  formData: LabCreationFormData
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check total subjects and terms
  const totalSubjects = formData.categories.reduce(
    (sum, cat) => sum + cat.subjects.length,
    0
  );
  const totalTerms =
    formData.includeTerms.length + formData.excludeTerms.length;

  // Allow empty labs - no longer an error
  if (totalSubjects === 0 && totalTerms === 0) {
    warnings.push('Your lab is empty. You can add subjects and terms later.');
  }

  // Check category names for duplicates
  const categoryNames = formData.categories
    .filter((cat) => cat.type === 'custom')
    .map((cat) => cat.name.toLowerCase());

  const duplicateCategories = categoryNames.filter(
    (name, index) => categoryNames.indexOf(name) !== index
  );

  if (duplicateCategories.length > 0) {
    errors.push(
      `Duplicate category names found: ${duplicateCategories.join(', ')}`
    );
  }

  // Check for empty custom categories
  const emptyCustomCategories = formData.categories.filter(
    (cat) => cat.type === 'custom' && cat.subjects.length === 0
  );

  if (emptyCustomCategories.length > 0) {
    warnings.push(
      `${emptyCustomCategories.length} empty categories will be removed during creation`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate Step 3: Review
 */
export const validateStep3 = (
  formData: LabCreationFormData
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for terms that need processing
  const newTermsCount = formData.categories
    .flatMap((cat) => cat.subjects)
    .filter((subject) => subject.isNewTerm).length;

  if (newTermsCount > 50 && formData.processTerms) {
    warnings.push(
      `Processing ${newTermsCount} new terms may take several minutes`
    );
  }

  if (newTermsCount > 0 && !formData.processTerms) {
    warnings.push(
      `${newTermsCount} new terms will be added without processing - they may have limited functionality until processed later`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate all steps
 */
export const validateAllSteps = (
  formData: LabCreationFormData
): StepValidation => {
  return {
    step1: validateStep1(formData),
    step2: validateStep2(formData),
    step3: validateStep3(formData),
  };
};

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Transform form data to API format
 */
export const transformToApiFormat = (
  formData: LabCreationFormData,
  teamspaceId: string
): CreateLabRequest => {
  // Filter out empty custom categories
  const activeCategories = formData.categories.filter(
    (cat) => cat.type === 'default' || cat.subjects.length > 0
  );

  return {
    name: formData.name.trim(),
    summary: formData.summary.trim(),
    teamspaceId,
    categories: activeCategories
      .filter((cat) => cat.type === 'custom')
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
      })),
    subjects: activeCategories
      .flatMap((cat) => cat.subjects)
      .map((subject) => ({
        subject_id: subject.subjectId,
        subject_name: subject.subjectName,
        subject_slug: subject.subjectSlug,
        category:
          subject.categoryId === 'uncategorized' ? null : subject.categoryId,
        ent_fsid: subject.subjectSlug
          ? subject.subjectSlug.startsWith('fsid_')
            ? subject.subjectSlug
            : `fsid_${subject.subjectSlug}`
          : undefined,
        needs_processing: subject.isNewTerm,
      })),
    includeTerms: formData.includeTerms.map((term) => term.text),
    excludeTerms: formData.excludeTerms.map((term) => term.text),
    processNewTerms: formData.processTerms,
  };
};

/**
 * Calculate estimated processing time
 */
export const calculateProcessingTime = (
  formData: LabCreationFormData
): number => {
  const newTermsCount = formData.categories
    .flatMap((cat) => cat.subjects)
    .filter((subject) => subject.isNewTerm).length;

  // Rough estimate: 2-5 seconds per term
  const baseTime = newTermsCount * 3;
  const withBuffer = baseTime * 1.5; // Add 50% buffer

  return Math.max(30, Math.min(600, withBuffer)); // Between 30 seconds and 10 minutes
};

// ============================================================================
// Default Data Creators
// ============================================================================

/**
 * Create default form data
 */
export const createDefaultFormData = (): LabCreationFormData => {
  return {
    name: '',
    summary: '',
    replaceTitleFromLabSeed: false,
    replaceSummaryFromLabSeed: false,
    includeTerms: [],
    excludeTerms: [],
    categories: [
      {
        id: 'uncategorized',
        name: 'Uncategorized',
        type: 'default',
        subjects: [],
        isSticky: true,
      },
    ],
    processTerms: true,
    estimatedProcessingTime: 30,
  };
};

/**
 * Create default uncategorized category
 */
export const createUncategorizedCategory = (): CreationCategory => {
  return {
    id: 'uncategorized',
    name: 'Uncategorized',
    type: 'default',
    subjects: [],
    isSticky: true,
  };
};

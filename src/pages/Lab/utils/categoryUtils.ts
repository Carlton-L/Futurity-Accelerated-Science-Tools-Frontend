import type { SubjectCategory, LabSubject, CategoryValidation } from '../types';
import { CategoryUtils } from '../types';

/**
 * Utility functions for category management
 * These functions help with validation, organization, and data transformation
 */

/**
 * Validates a category name according to business rules
 * @param name - The category name to validate
 * @param existingCategories - Array of existing categories to check for duplicates
 * @returns Validation result with error message if invalid
 */
export const validateCategoryName = (
  name: string,
  existingCategories: SubjectCategory[]
): CategoryValidation => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { isValid: false, error: 'Category name cannot be empty' };
  }

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: 'Category name must be at least 2 characters',
    };
  }

  if (trimmedName.length > 50) {
    return {
      isValid: false,
      error: 'Category name cannot exceed 50 characters',
    };
  }

  // Check for duplicate names (case insensitive)
  const existingNames = existingCategories.map((cat) => cat.name.toLowerCase());
  if (existingNames.includes(trimmedName.toLowerCase())) {
    return {
      isValid: false,
      error: 'A category with this name already exists',
    };
  }

  // Check for reserved names
  const reservedNames = ['all', 'none', 'null', 'undefined'];
  if (reservedNames.includes(trimmedName.toLowerCase())) {
    return {
      isValid: false,
      error: 'This name is reserved and cannot be used',
    };
  }

  return { isValid: true };
};

/**
 * Finds the default "Uncategorized" category
 * @param categories - Array of categories to search
 * @returns The default category or undefined if not found
 */
export const findDefaultCategory = (
  categories: SubjectCategory[]
): SubjectCategory | undefined => {
  return categories.find((category) => CategoryUtils.isDefault(category));
};

/**
 * Finds the exclude category
 * @param categories - Array of categories to search
 * @returns The exclude category or undefined if not found
 */
export const findExcludeCategory = (
  categories: SubjectCategory[]
): SubjectCategory | undefined => {
  return categories.find((category) => CategoryUtils.isExclude(category));
};

/**
 * Finds which category contains a specific subject
 * @param subject - The subject to find
 * @param categories - Array of categories to search
 * @returns The category containing the subject or undefined
 */
export const findSubjectCategory = (
  subject: LabSubject,
  categories: SubjectCategory[]
): SubjectCategory | undefined => {
  return categories.find((category) =>
    category.subjects.some((s) => s.id === subject.id)
  );
};

/**
 * Moves a subject from one category to another
 * @param subjectId - ID of the subject to move
 * @param fromCategoryId - Source category ID
 * @param toCategoryId - Destination category ID
 * @param categories - Array of categories
 * @returns Updated categories array
 */
export const moveSubjectBetweenCategories = (
  subjectId: string,
  fromCategoryId: string,
  toCategoryId: string,
  categories: SubjectCategory[]
): SubjectCategory[] => {
  const newCategories = [...categories];

  const fromCategory = newCategories.find((cat) => cat.id === fromCategoryId);
  const toCategory = newCategories.find((cat) => cat.id === toCategoryId);

  if (!fromCategory || !toCategory) {
    console.error('Source or destination category not found');
    return categories;
  }

  const subjectIndex = fromCategory.subjects.findIndex(
    (subj) => subj.id === subjectId
  );

  if (subjectIndex === -1) {
    console.error('Subject not found in source category');
    return categories;
  }

  // Move the subject
  const subject = fromCategory.subjects[subjectIndex];
  fromCategory.subjects.splice(subjectIndex, 1);
  toCategory.subjects.push(subject);

  return newCategories;
};

/**
 * Removes a subject from all categories
 * @param subjectId - ID of the subject to remove
 * @param categories - Array of categories
 * @returns Updated categories array
 */
export const removeSubjectFromCategories = (
  subjectId: string,
  categories: SubjectCategory[]
): SubjectCategory[] => {
  return categories.map((category) => ({
    ...category,
    subjects: category.subjects.filter((subject) => subject.id !== subjectId),
  }));
};

/**
 * Adds a new subject to the default category
 * @param subject - The subject to add
 * @param categories - Array of categories
 * @returns Updated categories array
 */
export const addSubjectToDefaultCategory = (
  subject: LabSubject,
  categories: SubjectCategory[]
): SubjectCategory[] => {
  const defaultCategory = findDefaultCategory(categories);

  if (!defaultCategory) {
    console.error('No default category found');
    return categories;
  }

  return categories.map((category) =>
    CategoryUtils.isDefault(category)
      ? { ...category, subjects: [...category.subjects, subject] }
      : category
  );
};

/**
 * Adds a subject to the exclude category
 * @param subject - The subject to add
 * @param categories - Array of categories
 * @returns Updated categories array
 */
export const addSubjectToExcludeCategory = (
  subject: LabSubject,
  categories: SubjectCategory[]
): SubjectCategory[] => {
  const excludeCategory = findExcludeCategory(categories);

  if (!excludeCategory) {
    console.error('No exclude category found');
    return categories;
  }

  return categories.map((category) =>
    CategoryUtils.isExclude(category)
      ? { ...category, subjects: [...category.subjects, subject] }
      : category
  );
};

/**
 * Deletes a category and optionally moves its subjects to the default category
 * @param categoryId - ID of the category to delete
 * @param moveSubjectsToDefault - Whether to move subjects to default category
 * @param categories - Array of categories
 * @returns Updated categories array
 */
export const deleteCategory = (
  categoryId: string,
  moveSubjectsToDefault: boolean,
  categories: SubjectCategory[]
): SubjectCategory[] => {
  const categoryToDelete = categories.find((cat) => cat.id === categoryId);
  const defaultCategory = findDefaultCategory(categories);

  if (!categoryToDelete) {
    console.error('Category to delete not found');
    return categories;
  }

  if (CategoryUtils.isSpecial(categoryToDelete)) {
    console.error('Cannot delete special categories (default or exclude)');
    return categories;
  }

  const newCategories = categories.filter((cat) => cat.id !== categoryId);

  // Move subjects to default category if requested
  if (
    moveSubjectsToDefault &&
    defaultCategory &&
    categoryToDelete.subjects.length > 0
  ) {
    return newCategories.map((category) =>
      CategoryUtils.isDefault(category)
        ? {
            ...category,
            subjects: [...category.subjects, ...categoryToDelete.subjects],
          }
        : category
    );
  }

  return newCategories;
};

/**
 * Creates a new category with the given name
 * @param name - Name for the new category
 * @param categories - Existing categories array
 * @returns New category object
 *
 * TODO: This should integrate with the backend to get a real ID
 */
export const createNewCategory = (
  name: string,
  categories: SubjectCategory[]
): SubjectCategory => {
  const validation = validateCategoryName(name, categories);

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  return {
    id: `cat-${Date.now()}`, // TODO: Replace with actual backend-generated ID
    name: name.trim(),
    type: 'custom',
    subjects: [],
  };
};

/**
 * Gets statistics about categories and subjects
 * @param categories - Array of categories
 * @returns Category statistics
 */
export const getCategoryStats = (categories: SubjectCategory[]) => {
  const totalSubjects = categories.reduce(
    (sum, category) => sum + category.subjects.length,
    0
  );

  const categoriesWithSubjects = categories.filter(
    (category) => category.subjects.length > 0
  ).length;

  const emptyCategories = categories.filter(
    (category) =>
      category.subjects.length === 0 && CategoryUtils.isCustom(category)
  ).length;

  const defaultCategorySubjects =
    findDefaultCategory(categories)?.subjects.length || 0;

  const excludeCategorySubjects =
    findExcludeCategory(categories)?.subjects.length || 0;

  const customCategories = categories.filter(CategoryUtils.isCustom).length;

  return {
    totalCategories: categories.length,
    customCategories,
    totalSubjects,
    categoriesWithSubjects,
    emptyCategories,
    defaultCategorySubjects,
    excludeCategorySubjects,
    averageSubjectsPerCategory: totalSubjects / Math.max(categories.length, 1),
  };
};

/**
 * Sorts categories with special categories first, then alphabetically
 * @param categories - Array of categories to sort
 * @returns Sorted categories array
 */
export const sortCategories = (
  categories: SubjectCategory[]
): SubjectCategory[] => {
  return [...categories].sort((a, b) => {
    // Default category always comes first
    if (CategoryUtils.isDefault(a) && !CategoryUtils.isDefault(b)) return -1;
    if (!CategoryUtils.isDefault(a) && CategoryUtils.isDefault(b)) return 1;

    // Exclude category comes second
    if (CategoryUtils.isExclude(a) && !CategoryUtils.isExclude(b)) return -1;
    if (!CategoryUtils.isExclude(a) && CategoryUtils.isExclude(b)) return 1;

    // Then sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
};

/**
 * Checks if a subject ID already exists in any category
 * @param subjectId - The subject ID to check
 * @param categories - Array of categories to search
 * @returns True if subject exists, false otherwise
 */
export const subjectExistsInLab = (
  subjectId: string,
  categories: SubjectCategory[]
): boolean => {
  return categories.some((category) =>
    category.subjects.some((subject) => subject.subjectId === subjectId)
  );
};

/**
 * Gets all subjects from exclude category
 * @param categories - Array of categories to search
 * @returns Array of excluded subjects
 */
export const getExcludedSubjects = (
  categories: SubjectCategory[]
): LabSubject[] => {
  const excludeCategory = findExcludeCategory(categories);
  return excludeCategory?.subjects || [];
};

/**
 * Gets all subjects except those in exclude category
 * @param categories - Array of categories to search
 * @returns Array of non-excluded subjects
 */
export const getIncludedSubjects = (
  categories: SubjectCategory[]
): LabSubject[] => {
  return categories
    .filter((category) => !CategoryUtils.isExclude(category))
    .flatMap((category) => category.subjects);
};

/**
 * Filters categories by type
 * @param categories - Array of categories to filter
 * @param type - Category type to filter by
 * @returns Filtered categories array
 */
export const filterCategoriesByType = (
  categories: SubjectCategory[],
  type: 'default' | 'exclude' | 'custom'
): SubjectCategory[] => {
  switch (type) {
    case 'default':
      return categories.filter(CategoryUtils.isDefault);
    case 'exclude':
      return categories.filter(CategoryUtils.isExclude);
    case 'custom':
      return categories.filter(CategoryUtils.isCustom);
    default:
      return categories;
  }
};

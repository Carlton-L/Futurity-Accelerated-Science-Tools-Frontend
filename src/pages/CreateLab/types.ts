// ============================================================================
// Lab Creation Types
// ============================================================================

// Import base types from Lab types (these may be used in the future)
// import type { LabSubject, SubjectCategory } from '../Lab/types';

// Step flow management
export type CreateLabStep = 1 | 2 | 3;

export interface StepStatus {
  completed: boolean;
  populated: boolean;
  hasError: boolean;
}

export interface WizardState {
  currentStep: CreateLabStep;
  steps: Record<CreateLabStep, StepStatus>;
  canProceed: boolean;
  isFromLabSeed: boolean;
}

// ============================================================================
// Data Source Types
// ============================================================================

export type DataSourceType = 'lab_seed' | 'csv' | 'manual';

export interface SourceBadge {
  type: DataSourceType;
  originalCategory?: string; // For Lab Seed items that were moved
}

// ============================================================================
// Lab Seed Types
// ============================================================================

export interface LabSeed {
  id: string;
  name: string;
  description: string;
  categories: LabSeedCategory[];
  subjects: LabSeedSubject[];
  includeTerms: string[];
  excludeTerms: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LabSeedCategory {
  id: string;
  name: string;
  subjects: LabSeedSubject[];
}

export interface LabSeedSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectSlug: string;
  subjectSummary?: string;
  categoryId: string;
  addedAt: string;
  source: DataSourceType;
  originalCategory?: string;
}

// ============================================================================
// Whiteboard Integration Types
// ============================================================================

export interface WhiteboardSubjectData {
  ent_fsid: string;
  ent_name: string;
  ent_summary: string;
  indexes: Array<{
    HR?: number;
    TT?: number;
    WS?: number;
  }>;
}

export interface WhiteboardLabSeedData {
  uniqueID: string;
  name: string;
  description: string;
  terms: string[];
  subjects: WhiteboardSubjectData[];
  createdAt: string;
}

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Interface for passing lab seed data from whiteboard to create lab page
 */
export interface WhiteboardLabSeed {
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

/**
 * Navigation state for React Router when coming from whiteboard
 */
export interface CreateLabNavigationState {
  initialLabSeed?: WhiteboardLabSeed;
  fromWhiteboard?: boolean;
}

// ============================================================================
// CSV Data Types
// ============================================================================

export interface CSVData {
  terms: string[];
  subjects?: CSVSubject[];
  subcategories?: string[];
  includeTerms?: string[];
  excludeTerms?: string[];
}

export interface CSVSubject {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
}

export interface CSVParseResult {
  success: boolean;
  data?: CSVData;
  error?: string;
  rowCount?: number;
  columnCount?: number;
}

export interface CSVValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
}

// ============================================================================
// CSV Internal Validation Types
// ============================================================================

export interface CSVInternalConflict {
  name: string;
  categories: string[];
  type: 'duplicate_subject' | 'subject_vs_exclude' | 'include_vs_exclude';
}

export interface CSVValidationResult {
  hasConflicts: boolean;
  conflicts: CSVInternalConflict[];
  cleanedSubjects?: Array<{ name: string; category?: string }>;
  cleanedIncludeTerms?: string[];
  cleanedExcludeTerms?: string[];
}

export interface CSVInternalResolution {
  selectedCategory: string; // Which category to keep for the term
}

export interface ExcludeTermConflict {
  termName: string;
  conflictingSubjects: Array<{
    subject: CreationSubject;
    categoryName: string;
  }>;
}

// ============================================================================
// Creation Form Data
// ============================================================================

export interface LabCreationFormData {
  // Step 1: Basic info
  name: string;
  summary: string;

  // Step 2: Data organization
  selectedLabSeed?: LabSeed;
  replaceTitleFromLabSeed: boolean;
  replaceSummaryFromLabSeed: boolean;
  csvData?: CSVData;

  // Terms management
  includeTerms: CreationTerm[];
  excludeTerms: CreationTerm[];

  // Subject organization
  categories: CreationCategory[];

  // Step 3: Final settings
  processTerms: boolean;
  estimatedProcessingTime: number;
}

export interface CreationTerm {
  id: string;
  text: string;
  source: DataSourceType;
  type: 'include' | 'exclude';
}

export interface CreationCategory {
  id: string;
  name: string;
  type: 'default' | 'custom';
  subjects: CreationSubject[];
  isSticky?: boolean; // For uncategorized column
}

export interface CreationSubject {
  id: string;
  subjectId?: string; // For existing subjects from Lab Seed
  subjectName: string;
  subjectSlug?: string;
  subjectSummary?: string;
  categoryId: string;
  source: DataSourceType;
  originalCategory?: string;
  isNewTerm?: boolean; // True if this needs to be processed/ingested
}

// ============================================================================
// Conflict Resolution Types
// ============================================================================

export interface ConflictItem {
  name: string;
  existingCategory: string;
  newCategory: string;
  source: DataSourceType;
  existingSource?: DataSourceType;
  existingSubject?: CreationSubject;
  newSubject?: CreationSubject;
  isExcludeConflict?: boolean;
}

export interface ConflictResolution {
  action: 'keep_existing' | 'use_new';
  targetCategory?: string;
}

export interface ConflictResolutionState {
  conflicts: ConflictItem[];
  resolutions: Record<string, ConflictResolution>;
  isOpen: boolean;
  pendingData?: {
    categories: CreationCategory[];
    subjects: CreationSubject[];
    includeTerms: CreationTerm[];
    excludeTerms: CreationTerm[];
    csvData: CSVData;
  };
}

// ============================================================================
// UI Component Props Types
// ============================================================================

export interface DataSourceControlsProps {
  formData: LabCreationFormData;
  availableLabSeeds: LabSeed[];
  onLabSeedSelect: (labSeed: LabSeed | undefined) => void;
  onLabSeedOptionsChange: (
    replaceName: boolean,
    replaceSummary: boolean
  ) => void;
  onCSVUpload: (file: File) => Promise<void>;
  onManualTermAdd: (term: string, category: string) => void;
  isLoading: boolean;
}

export interface IncludeExcludeTermsCreationProps {
  includeTerms: CreationTerm[];
  excludeTerms: CreationTerm[];
  onTermAdd: (
    text: string,
    type: 'include' | 'exclude',
    source: DataSourceType
  ) => void;
  onTermRemove: (termId: string) => void;
  onTermTypeToggle: (termId: string) => void;
  canEdit: boolean;
  isLoading: boolean;
  // New props for conflict checking
  allSubjects: CreationSubject[];
  categories: CreationCategory[];
}

export interface KanbanOrganizerCreationProps {
  categories: CreationCategory[];
  onSubjectMove: (
    subjectId: string,
    fromCategoryId: string,
    toCategoryId: string
  ) => void;
  onCategoryAdd: (name: string) => void;
  onCategoryRename: (categoryId: string, newName: string) => void;
  onCategoryDelete: (categoryId: string) => void;
  onSubjectAdd: (name: string, categoryId: string) => void;
  onSubjectRemove: (subjectId: string) => void;
  isLoading: boolean;
}

export interface ConflictResolutionModalProps {
  conflicts: ConflictItem[];
  resolutions: Record<string, ConflictResolution>;
  isOpen: boolean;
  categories: CreationCategory[];
  onResolutionChange: (
    itemName: string,
    resolution: ConflictResolution
  ) => void;
  onResolve: () => void;
  onCancel: () => void;
}

// ============================================================================
// API Integration Types
// ============================================================================

export interface CreateLabRequest {
  name: string;
  summary: string;
  teamspaceId: string;
  categories: Array<{
    id: string;
    name: string;
  }>;
  subjects: Array<{
    subject_id?: string; // For existing subjects
    subject_name: string;
    subject_slug?: string;
    category: string | null;
    ent_fsid?: string;
    needs_processing?: boolean; // For new terms that need ingestion
  }>;
  includeTerms: string[];
  excludeTerms: string[];
  processNewTerms: boolean;
}

export interface CreateLabResponse {
  success: boolean;
  labId?: string;
  processingJobId?: string; // For term ingestion
  error?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StepValidation {
  step1: ValidationResult;
  step2: ValidationResult;
  step3: ValidationResult;
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

export interface CreationProgress {
  step: CreateLabStep;
  isLoading: boolean;
  message: string;
  progress: number; // 0-100
  canCancel: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface DragDropItem {
  id: string;
  type: 'subject' | 'term';
  source: DataSourceType;
  originalCategory?: string;
}

export interface DropZoneResult {
  success: boolean;
  conflicts?: ConflictItem[];
  error?: string;
}

// ============================================================================
// Lab-related Types
// ============================================================================

/**
 * Main lab interface
 * TODO: Confirm exact structure with backend team
 */
export interface Lab {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  subjects: LabSubject[];
  analyses: LabAnalysis[];
  // TODO: Add categories field once backend structure is confirmed
  // categories?: SubjectCategory[];
}

/**
 * Subject within a lab context
 * NOTE: This represents a subject that has been added to a specific lab
 */
export interface LabSubject {
  id: string; // Unique ID for this lab-subject relationship
  subjectId: string; // Reference to the actual subject in 'fst-subject' collection
  subjectName: string;
  subjectSlug: string;
  addedAt: string; // ISO date string
  addedById: string;
  notes?: string; // Optional notes specific to this lab
  // TODO: Confirm if categoryId is stored here or in category documents
  // categoryId?: string;
}

/**
 * Lab analysis/project
 * TODO: Determine if this is used in the Gather component
 */
export interface LabAnalysis {
  id: string;
  title: string;
  description: string;
  status: 'Draft' | 'In Progress' | 'Review' | 'Complete' | 'Archived';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdById: string;
  assignedToIds: string[];
  subjects: string[]; // Subject IDs related to this analysis
  tags: string[];
}

/**
 * Lab member with role information
 * Used for permission checking in the UI
 */
export interface LabMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'reader' | 'editor' | 'admin'; // NOTE: Different from backend which uses 'Owner' | 'Admin' | 'Member' | 'Viewer'
  joinedAt: string; // ISO date string
  invitedById?: string;
}

// ============================================================================
// Subject Search Types
// ============================================================================

/**
 * Search result from the 'fst-subject' MongoDB collection
 * This represents subjects available to add to labs
 */
export interface SubjectSearchResult {
  id: string; // Subject ID in the database
  name: string;
  slug: string;
  description: string;
  horizonRanking: number; // Numerical ranking/score for the subject
  // TODO: Add any other fields returned by the search API
}

// ============================================================================
// Category Types (Frontend Organization)
// ============================================================================

/**
 * Category type enumeration for special handling
 */
export type CategoryType = 'default' | 'exclude' | 'custom';

/**
 * Subject category for organizing subjects within a lab
 * TODO: Confirm if this structure matches backend category documents
 */
export interface SubjectCategory {
  id: string;
  name: string;
  type: CategoryType; // Replaces isDefault boolean for more flexibility
  subjects: LabSubject[]; // Subjects in this category
  description?: string; // Optional description for special categories
  // TODO: Add labId reference if categories are separate documents
  // labId?: string;
  // TODO: Add order/position field for custom sorting
  // order?: number;
}

// ============================================================================
// Analysis Types
// ============================================================================

/**
 * Analysis type options
 */
export type AnalysisType = 'patent' | 'taxonomy' | 'research' | 'investment';

/**
 * Analysis status options
 */
export type AnalysisStatus = 'Complete' | 'In Progress' | 'Review';

/**
 * Mock analysis item for the analyses list
 */
export interface MockAnalysis {
  id: string;
  title: string;
  description: string;
  status: AnalysisStatus;
  imageUrl: string;
  updatedAt: string;
}

// ============================================================================
// Horizon Chart Types
// ============================================================================

/**
 * Horizon chart data structure
 */
export interface HorizonItem {
  name: string;
  horizon: 1 | 2 | 3 | 4;
  category: 1 | 2 | 3 | 4 | 5;
  type: 1 | 2 | 3;
  categoryName?: string; // Optional category name for display
}

// ============================================================================
// Knowledgebase Types
// ============================================================================

/**
 * Knowledgebase document metadata
 */
export interface KnowledgebaseDocument {
  document_uuid: string;
  kb_uuid: string;
  title: string;
  authors: string[];
  publication_year: number | null;
  summary: string;
  keywords: string[];
  file_type: 'pdf' | 'image' | 'audio' | 'video' | 'txt' | 'raw_text';
  original_filename: string | null;
  classification_format: string;
  source_classification: string;
  ingestion_time: string;
  last_updated_time: string;
}

/**
 * Knowledgebase documents API response
 */
export interface KnowledgebaseDocumentsResponse {
  items: KnowledgebaseDocument[];
  total: number;
  page: number;
  size: number;
  kb_uuid: string;
  file_type: string;
}

/**
 * Query snippet from knowledgebase search
 */
export interface QuerySnippet {
  score: number;
  document_snippet: string;
  chunk_id: string;
}

/**
 * Query result for a single document
 */
export interface QueryResult {
  library_card: KnowledgebaseDocument;
  snippets: QuerySnippet[];
  max_score: number;
}

/**
 * Grouped query results by file type
 */
export interface QueryGroupedResults {
  file_type: string;
  results: QueryResult[];
}

/**
 * Knowledgebase query API response
 */
export interface KnowledgebaseQueryResponse {
  query_text: string;
  kb_uuid: string;
  grouped_results: QueryGroupedResults[];
}

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Navigation item for section scrolling
 */
export interface NavigationItem {
  id: string;
  label: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Lab update request payload
 * TODO: Update based on actual GraphQL mutation schema
 */
export interface LabUpdateRequest {
  name: string;
  description: string;
}

/**
 * Lab creation request payload
 * TODO: Update based on actual GraphQL mutation schema
 */
export interface LabCreateRequest {
  name: string;
  description: string;
  visibility: 'Private' | 'Internal' | 'Public';
}

/**
 * Subject addition request
 * TODO: Define based on actual API structure
 */
export interface AddSubjectToLabRequest {
  labId: string;
  subjectId: string;
  categoryId?: string; // Optional, defaults to "uncategorized"
  notes?: string;
}

/**
 * Subject movement request
 * TODO: Define based on actual API structure
 */
export interface MoveSubjectRequest {
  labId: string;
  subjectId: string;
  newCategoryId: string;
}

/**
 * Category creation request
 * TODO: Define based on actual API structure
 */
export interface CreateCategoryRequest {
  labId: string;
  name: string;
}

/**
 * Category update request
 * TODO: Define based on actual API structure
 */
export interface UpdateCategoryRequest {
  labId: string;
  categoryId: string;
  name?: string;
  // TODO: Add other updatable fields
}

/**
 * Category deletion request
 * TODO: Define based on actual API structure
 */
export interface DeleteCategoryRequest {
  labId: string;
  categoryId: string;
  moveSubjectsToUncategorized: boolean;
}

// ============================================================================
// GraphQL Response Types
// ============================================================================

/**
 * Standard GraphQL response wrapper
 * TODO: Update based on actual GraphQL schema
 */
export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
    extensions?: Record<string, any>;
  }>;
}

/**
 * Lab query response
 * TODO: Update based on actual GraphQL schema
 */
export interface LabQueryResult {
  lab: Lab;
}

/**
 * Subject search query response
 * TODO: Update based on actual GraphQL schema
 */
export interface SubjectSearchQueryResult {
  searchSubjects: SubjectSearchResult[];
}

/**
 * Mutation response for lab operations
 * TODO: Update based on actual GraphQL schema
 */
export interface LabMutationResult {
  success: boolean;
  message: string;
  lab?: Lab;
}

/**
 * Mutation response for subject operations
 * TODO: Update based on actual GraphQL schema
 */
export interface SubjectMutationResult {
  success: boolean;
  message: string;
  subject?: LabSubject;
}

/**
 * Mutation response for category operations
 * TODO: Update based on actual GraphQL schema
 */
export interface CategoryMutationResult {
  success: boolean;
  message: string;
  category?: SubjectCategory;
}

// ============================================================================
// Drag and Drop Types (react-dnd)
// ============================================================================

/**
 * Drag item interface for react-dnd
 * Used in the kanban board for subject movement
 */
export interface DragItem {
  type: string;
  id: string;
  columnId: string;
}

// ============================================================================
// Form Validation Types
// ============================================================================

/**
 * Category name validation result
 */
export interface CategoryValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Search input validation
 */
export interface SearchValidation {
  isValid: boolean;
  minLength: number;
  maxLength: number;
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * User permissions within a lab
 */
export interface LabPermissions {
  canView: boolean;
  canAddSubjects: boolean;
  canRemoveSubjects: boolean;
  canMoveSubjects: boolean;
  canCreateCategories: boolean;
  canEditCategories: boolean;
  canDeleteCategories: boolean;
  canEditLab: boolean;
  canManageMembers: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * API error response
 * TODO: Update based on actual error response structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Validation error for forms
 */
export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// Loading State Types
// ============================================================================

/**
 * Loading states for different operations
 */
export interface LoadingStates {
  lab: boolean;
  subjects: boolean;
  categories: boolean;
  search: boolean;
  addSubject: boolean;
  moveSubject: boolean;
  createCategory: boolean;
  updateCategory: boolean;
  deleteCategory: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Partial update type for optimistic updates
 */
export type PartialUpdate<T> = Partial<T> & { id: string };

/**
 * Async operation result
 */
export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Helper Functions for Category Types
// ============================================================================

/**
 * Type guards and utility functions for working with category types
 */
export const CategoryUtils = {
  isDefault: (category: SubjectCategory): boolean =>
    category.type === 'default',
  isExclude: (category: SubjectCategory): boolean =>
    category.type === 'exclude',
  isCustom: (category: SubjectCategory): boolean => category.type === 'custom',
  isSpecial: (category: SubjectCategory): boolean =>
    category.type === 'default' || category.type === 'exclude',
  canDelete: (category: SubjectCategory): boolean => category.type === 'custom',
  canRename: (category: SubjectCategory): boolean => category.type === 'custom',
};

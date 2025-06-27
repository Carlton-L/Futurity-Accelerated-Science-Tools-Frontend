// ============================================================================
// MongoDB API Types (Raw API Response Format)
// ============================================================================

export interface MongoObjectId {
  $oid: string;
}

export interface MongoUUID {
  $uuid: string;
}

export interface MongoDate {
  $date: string;
}

export interface MongoInt {
  $numberInt: string;
}

// ============================================================================
// Lab API Types (API Response Format)
// ============================================================================

// Updated to match the actual API response structure
export interface ApiLabData {
  _id: string; // Changed: The API returns a simple string, not a MongoDB ObjectId
  isArchived: number; // Changed: API returns 0/1 instead of boolean
  isDeleted: number; // Changed: API returns 0/1 instead of boolean
  deletedAt: string | null;
  ent_name: string;
  ent_summary: string;
  kbid: string; // Changed: API returns simple string, not MongoDB UUID
  teamspace_id: string | null;
  picture_url: string | null;
  thumb_url: string | null;
  owner_guid: string;
  user_access_level?: string; // Added: API includes this field
  members: Array<{
    user_id: string; // Changed: API uses user_id instead of user_guid
    role: string; // Changed: API uses generic string instead of specific roles
  }>;
  categories: Array<{
    id: string; // Changed: API returns simple string, not MongoDB UUID
    name: string;
  }>;
  exclude_terms: string[];
  include_terms: string[];
  subjects: Array<{
    subject_id: string; // ObjectId as string
    subject_name?: string; // Some subjects use this
    name?: string; // Some subjects use this instead
    category: string | null; // UUID as string, null means uncategorized
    ent_fsid: string; // Subject slug with fsid_ prefix
  }>;
  analyses: string[]; // Changed: API returns array of strings, not MongoDB ObjectIds
  goals: Array<{
    id: string; // Changed: API returns simple string, not MongoDB UUID
    target_user_group: string; // Changed: API uses different structure
    problem_statement: string;
    impact_score: number; // Changed: API returns simple number, not MongoDB Int
  }>;
  miro_board_url: string;
  idea_seeds: any[]; // Changed: API returns different structure
}

// Legacy types for backward compatibility with your existing API service
export interface ApiLabCategory {
  id: { $uuid: string };
  name: string;
}

export interface ApiLabSubject {
  subject_id: { $oid: string };
  subject_slug: string;
  subject_name: string;
  category: { $uuid: string };
}

export interface ApiLabMember {
  fullname: string;
  user_guid: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface ApiLabGoal {
  id: { $uuid: string };
  target_user_groups: Array<{
    name: string;
    number: { $numberInt: string };
  }>;
  problem_statement: string;
  goal_statement: string;
  impact_score: { $numberInt: string };
  weight: { $numberInt: string };
  goal_year: { $date: string };
}

// ============================================================================
// Subject API Types
// ============================================================================

export interface SubjectData {
  _id: string;
  Google_hitcounts: number;
  Papers_hitcounts: number;
  Books_hitcounts: number;
  Gnews_hitcounts: number;
  Related_terms: string;
  wikipedia_definition: string;
  wiktionary_definition: string;
  FST: string;
  labs: string;
  wikipedia_url: string;
  ent_name: string;
  ent_fsid: string;
  ent_summary: string;
  indexes?: Array<{
    HR: number;
    TT: number;
    WS: number;
  }>;
}

export interface SubjectSearchResult {
  _id: { $oid: string };
  ent_name: string;
  ent_fsid: string;
  ent_summary: string;
}

// ============================================================================
// Analysis API Types
// ============================================================================

export interface AnalysisData {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

// ============================================================================
// Analysis Types for Analyze Tab
// ============================================================================

export type AnalysisType = 'patent' | 'taxonomy' | 'research' | 'investment';

export interface HorizonItem {
  name: string;
  horizon: 1 | 2 | 3 | 4;
  category: 1 | 2 | 3 | 4 | 5;
  type: 1 | 2 | 3;
  categoryName?: string;
}

// ============================================================================
// Knowledgebase Types
// ============================================================================

export type KnowledgebaseFileType =
  | 'pdf'
  | 'image'
  | 'audio'
  | 'video'
  | 'txt'
  | 'raw_text';

export interface KnowledgebaseDocument {
  document_uuid: string;
  title: string;
  file_type: KnowledgebaseFileType;
  summary?: string;
  ingestion_time: string;
  content?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  file_size?: number;
  file_name?: string;
}

export interface KnowledgebaseDocumentsResponse {
  items: KnowledgebaseDocument[];
  total: number;
  page: number;
  size: number;
}

export interface KnowledgebaseQueryResponse {
  query_text: string;
  grouped_results: Array<{
    file_type: string;
    results: Array<{
      library_card: {
        document_uuid: string;
        title: string;
      };
      max_score: number;
      snippets: Array<{
        chunk_id: string;
        document_snippet: string;
        score: number;
      }>;
    }>;
  }>;
}

// Alternative name for backward compatibility - use KnowledgebaseQueryResponse instead
export type KnowledgebaseQueryResult = KnowledgebaseQueryResponse;

export interface KnowledgebaseUploadResponse {
  success: boolean;
  document_uuid?: string;
  message?: string;
  error?: string;
}

// ============================================================================
// Frontend Types (Transformed from API)
// ============================================================================

export interface Lab {
  id: string;
  name: string;
  description: string;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  kbid: string;
  teamspaceId: string | null;
  memberIds: string[];
  adminIds: string[];
  editorIds: string[];
  viewerIds: string[];
  categories: SubjectCategory[];
  subjects: LabSubject[];
  analyses: LabAnalysis[];
  goals: LabGoal[];
  includeTerms: string[];
  excludeTerms: string[];
  miroBoardUrl: string;
  ideaSeeds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LabSubject {
  id: string; // Frontend generated ID
  subjectId: string; // MongoDB ObjectId as string
  subjectName: string;
  subjectSlug: string;
  categoryId: string; // Frontend category ID (UUID as string)
  addedAt: string;
  addedById: string;
  notes?: string;
}

export interface SubjectCategory {
  id: string; // UUID as string for frontend
  name: string;
  type: 'default' | 'custom' | 'exclude';
  subjects: LabSubject[];
  description?: string;
}

export interface LabAnalysis {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

export interface LabGoal {
  id: string;
  targetUserGroups: Array<{
    name: string;
    number: number;
  }>;
  problemStatement: string;
  goalStatement: string;
  impactScore: number;
  weight: number;
  goalYear: string;
}

export interface LabMember {
  id: string;
  fullname: string;
  userGuid: string;
  role: 'admin' | 'editor' | 'viewer';
}

// ============================================================================
// UI Component Types
// ============================================================================

export interface MockAnalysis {
  id: string;
  title: string;
  description: string;
  status: string;
  imageUrl: string;
  updatedAt: string;
}

export interface NavigationItem {
  id: string;
  label: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface CategoryValidation {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// This should match exactly what the API expects for updates
export interface LabUpdateRequest {
  ent_name?: string;
  ent_summary?: string;
  kbid?: string;
  categories?: Array<{
    id: string;
    name: string;
  }>;
  exclude_terms?: string[];
  include_terms?: string[];
  subjects?: Array<{
    subject_id: string; // ObjectId as string
    subject_name?: string; // Some subjects use this
    name?: string; // Some subjects use this instead
    category: string | null; // UUID as string, null for uncategorized
    ent_fsid: string; // Subject slug with fsid_ prefix
  }>;
  analyses?: string[];
  goals?: Array<{
    id: string;
    target_user_group: string;
    problem_statement: string;
    impact_score: number;
  }>;
  miro_board_url?: string;
  idea_seeds?: any[];
  isArchived?: number;
  isDeleted?: number;
  deletedAt?: string | null;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface CreateSubjectRequest {
  subject_id: string;
  subject_slug: string;
  subject_name: string;
  category: string;
}

// ============================================================================
// Utility Classes and Functions
// ============================================================================

export class CategoryUtils {
  /**
   * Check if a category is the default "Uncategorized" category
   */
  static isDefault(category: SubjectCategory): boolean {
    return category.type === 'default' || category.id === 'uncategorized';
  }

  /**
   * Check if a category is a custom user-created category
   */
  static isCustom(category: SubjectCategory): boolean {
    return category.type === 'custom' && !this.isDefault(category);
  }

  /**
   * Check if a category is an exclude category
   */
  static isExclude(category: SubjectCategory): boolean {
    return category.type === 'exclude';
  }

  /**
   * Check if a category is special (default categories that cannot be deleted)
   */
  static isSpecial(category: SubjectCategory): boolean {
    return this.isDefault(category) || this.isExclude(category);
  }

  /**
   * Check if a category can be renamed
   */
  static canRename(category: SubjectCategory): boolean {
    return this.isCustom(category);
  }

  /**
   * Check if a category can be deleted
   */
  static canDelete(category: SubjectCategory): boolean {
    return this.isCustom(category);
  }

  /**
   * Get the display color for a category based on its type
   */
  static getDisplayColor(category: SubjectCategory): string {
    if (this.isDefault(category)) {
      return 'gray';
    }
    if (this.isExclude(category)) {
      return 'red';
    }
    return 'blue';
  }
}

export class ApiTransformUtils {
  /**
   * Transform MongoDB ObjectId to string
   */
  static objectIdToString(objectId: MongoObjectId | string): string {
    if (typeof objectId === 'string') {
      return objectId;
    }
    return objectId.$oid;
  }

  /**
   * Transform string to MongoDB ObjectId
   */
  static stringToObjectId(id: string): MongoObjectId {
    return { $oid: id };
  }

  /**
   * Transform MongoDB UUID to string
   */
  static uuidToString(uuid: MongoUUID | string): string {
    if (typeof uuid === 'string') {
      return uuid;
    }
    return uuid.$uuid;
  }

  /**
   * Transform string to MongoDB UUID
   */
  static stringToUUID(id: string): MongoUUID {
    return { $uuid: id };
  }

  /**
   * Transform MongoDB Date to string
   */
  static mongoDateToString(date: MongoDate): string {
    return date.$date;
  }

  /**
   * Transform MongoDB Int to number
   */
  static mongoIntToNumber(mongoInt: MongoInt | number): number {
    if (typeof mongoInt === 'number') {
      return mongoInt;
    }
    return parseInt(mongoInt.$numberInt, 10);
  }

  /**
   * Transform API lab data to frontend Lab interface
   */
  static async transformLab(
    apiData: ApiLabData,
    labId: string,
    _fetchSubjectData: (objectId: string) => Promise<SubjectData>,
    fetchAnalysisData: (objectId: string) => Promise<AnalysisData>
  ): Promise<Lab> {
    // Transform categories
    const transformedCategories: SubjectCategory[] = [
      // Always include default "Uncategorized" category
      {
        id: 'uncategorized',
        name: 'Uncategorized',
        type: 'default',
        subjects: [],
        description: 'Default category for new subjects',
      },
      // Add custom categories from API
      ...apiData.categories.map((category) => ({
        id: category.id, // API returns simple string
        name: category.name,
        type: 'custom' as const,
        subjects: [] as LabSubject[], // Will be populated below
      })),
    ];

    // Transform subjects and assign to categories
    const transformedSubjects: LabSubject[] = [];
    for (const apiSubject of apiData.subjects) {
      const subjectId = apiSubject.subject_id; // ObjectId as string

      // Get subject name - could be in subject_name or name field
      const subjectName =
        apiSubject.subject_name || apiSubject.name || 'Unknown Subject';

      // Parse slug from ent_fsid by removing fsid_ prefix
      const subjectSlug = apiSubject.ent_fsid.startsWith('fsid_')
        ? apiSubject.ent_fsid.substring(5) // Remove 'fsid_' prefix
        : apiSubject.ent_fsid;

      // Handle category - null means uncategorized
      const categoryId = apiSubject.category || 'uncategorized';

      // Find the category or default to uncategorized
      const targetCategory = transformedCategories.find(
        (cat) => cat.id === categoryId
      );
      const finalCategoryId = targetCategory ? categoryId : 'uncategorized';

      const transformedSubject: LabSubject = {
        id: `lab-subj-${subjectId}`, // Frontend-generated ID
        subjectId: subjectId,
        subjectName: subjectName,
        subjectSlug: subjectSlug,
        categoryId: finalCategoryId,
        addedAt: new Date().toISOString(), // Default since not in API
        addedById: 'unknown', // Default since not in API
        notes: '', // No notes in API, default to empty
      };

      transformedSubjects.push(transformedSubject);

      // Add to the appropriate category
      const category = transformedCategories.find(
        (cat) => cat.id === finalCategoryId
      );
      if (category) {
        category.subjects.push(transformedSubject);
      }
    }

    // Transform analyses
    const transformedAnalyses: LabAnalysis[] = [];
    for (const analysisId of apiData.analyses) {
      try {
        const analysisData = await fetchAnalysisData(analysisId); // API returns simple string
        transformedAnalyses.push({
          id: analysisData.id,
          title: analysisData.title,
          description: analysisData.description,
          status: analysisData.status,
          createdAt: analysisData.createdAt,
          updatedAt: analysisData.updatedAt,
          createdById: analysisData.createdById,
        });
      } catch (error) {
        console.warn(`Failed to load analysis ${analysisId}:`, error);
      }
    }

    // Transform goals
    const transformedGoals: LabGoal[] = apiData.goals.map((goal) => ({
      id: goal.id, // API returns simple string
      targetUserGroups: [
        {
          name: goal.target_user_group, // API uses different structure
          number: 1, // Default since API doesn't provide this
        },
      ],
      problemStatement: goal.problem_statement,
      goalStatement: '', // Default since not in API
      impactScore: goal.impact_score, // API returns simple number
      weight: 1, // Default since not in API
      goalYear: new Date().toISOString(), // Default since not in API
    }));

    // Extract member information
    const memberIds = apiData.members.map((member) => member.user_id); // API uses user_id

    // Determine admin based on role or owner_guid
    const adminIds: string[] = [];
    const editorIds: string[] = [];
    const viewerIds: string[] = [];

    apiData.members.forEach((member) => {
      if (member.role === 'owner' || member.role === 'admin') {
        adminIds.push(member.user_id);
      } else if (member.role === 'editor') {
        editorIds.push(member.user_id);
      } else {
        viewerIds.push(member.user_id);
      }
    });

    // If no admins found but there's an owner_guid, add it
    if (adminIds.length === 0 && apiData.owner_guid) {
      // Find the member with the owner_guid or add it
      const ownerMember = apiData.members.find(
        (m) => m.user_id === apiData.owner_guid
      );
      if (ownerMember) {
        adminIds.push(ownerMember.user_id);
      }
    }

    return {
      id: labId,
      name: apiData.ent_name,
      description: apiData.ent_summary,
      isArchived: apiData.isArchived === 1, // Convert number to boolean
      isDeleted: apiData.isDeleted === 1, // Convert number to boolean
      deletedAt: apiData.deletedAt,
      kbid: apiData.kbid, // API returns simple string
      teamspaceId: apiData.teamspace_id,
      memberIds,
      adminIds,
      editorIds,
      viewerIds,
      categories: transformedCategories,
      subjects: transformedSubjects,
      analyses: transformedAnalyses,
      goals: transformedGoals,
      includeTerms: apiData.include_terms,
      excludeTerms: apiData.exclude_terms,
      miroBoardUrl: apiData.miro_board_url,
      ideaSeeds: [], // API returns different structure, defaulting to empty
      createdAt: new Date().toISOString(), // Default since not in API
      updatedAt: new Date().toISOString(), // Default since not in API
    };
  }

  /**
   * Transform frontend lab data back to API format for updates
   * CRITICAL: This must match exactly what the API expects
   */
  static transformLabToApiFormat(lab: Lab): LabUpdateRequest {
    // Log for debugging
    console.log('Transforming lab to API format:', lab);

    const transformed: LabUpdateRequest = {
      ent_name: lab.name,
      ent_summary: lab.description,
      kbid: lab.kbid,
      categories: lab.categories
        .filter(CategoryUtils.isCustom)
        .map((category) => ({
          id: category.id, // API expects simple string
          name: category.name,
        })),
      subjects: lab.subjects.map((subject) => ({
        subject_id: subject.subjectId, // ObjectId as string
        subject_name: subject.subjectName, // Use subject_name field
        category:
          subject.categoryId === 'uncategorized' ? null : subject.categoryId, // null for uncategorized
        ent_fsid: subject.subjectSlug.startsWith('fsid_')
          ? subject.subjectSlug
          : `fsid_${subject.subjectSlug}`, // Ensure fsid_ prefix
      })),
      include_terms: lab.includeTerms,
      exclude_terms: lab.excludeTerms,
      analyses: lab.analyses.map((a) => a.id),
      goals: lab.goals.map((goal) => ({
        id: goal.id,
        target_user_group: goal.targetUserGroups[0]?.name || '',
        problem_statement: goal.problemStatement,
        impact_score: goal.impactScore,
      })),
      miro_board_url: lab.miroBoardUrl,
      idea_seeds: [], // Default to empty array
      isArchived: lab.isArchived ? 1 : 0, // Convert boolean to number
      isDeleted: lab.isDeleted ? 1 : 0, // Convert boolean to number
      deletedAt: lab.deletedAt,
    };

    console.log('Transformed to API format:', transformed);
    return transformed;
  }

  /**
   * Create a minimal update payload for subject operations
   */
  static createSubjectUpdatePayload(
    subjects: Array<{
      subject_id: string;
      subject_name?: string;
      name?: string;
      category: string | null;
      ent_fsid: string;
    }>
  ): Partial<LabUpdateRequest> {
    return {
      subjects: subjects,
    };
  }

  /**
   * Create a minimal update payload for category operations
   */
  static createCategoryUpdatePayload(
    categories: Array<{
      id: string;
      name: string;
    }>
  ): Partial<LabUpdateRequest> {
    return {
      categories: categories,
    };
  }

  /**
   * Create a minimal update payload for terms operations
   */
  static createTermsUpdatePayload(
    includeTerms: string[],
    excludeTerms: string[]
  ): Partial<LabUpdateRequest> {
    return {
      include_terms: includeTerms,
      exclude_terms: excludeTerms,
    };
  }
}

// Enhanced labService.ts with caching and batch operations

const API_BASE_URL = 'https://fast.futurity.science/management/labs';
const SUBJECTS_API_BASE_URL =
  'https://fast.futurity.science/management/subjects';

// Constants
const FUTURITY_TEAM_ID = '17b389f5-c487-49ba-8a82-0b21d887777f';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000; // Maximum number of cached items

// Cache interfaces
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface SubjectIndexData {
  HR?: number;
  TT?: number;
  WS?: number;
}

// Cache implementation
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = MAX_CACHE_SIZE) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: T, ttl: number = CACHE_DURATION): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global caches
const labCache = new LRUCache<Lab>(50);
const subjectIndexCache = new LRUCache<SubjectIndexData>(500);

// Goal interface matching the new API structure
export interface ApiLabGoal {
  name: string;
  description: string;
  user_groups: Array<{
    description: string;
    size: string;
    regions?: string[];
  }>;
  problem_statements: Array<{
    description: string;
  }>;
  impact_level: number;
}

// Lab metadata interface
export interface ApiLabMetadata {
  [key: string]: any;
}

// Lab update request interface - enhanced with terms management
export interface LabUpdateRequest {
  ent_name?: string;
  ent_summary?: string;
  picture_url?: string;
  thumbnail_url?: string;
  exclude_terms?: string[];
  include_terms?: string[];
  goals?: ApiLabGoal[];
  metadata?: ApiLabMetadata;
  include_terms_add?: string[];
  include_terms_remove?: string[];
  exclude_terms_add?: string[];
  exclude_terms_remove?: string[];
}

// Terms management specific interfaces
export interface AddTermRequest {
  include_terms_add?: string[];
  exclude_terms_add?: string[];
}

export interface RemoveTermRequest {
  include_terms_remove?: string[];
  exclude_terms_remove?: string[];
}

export interface ToggleTermRequest {
  include_terms_add?: string[];
  include_terms_remove?: string[];
  exclude_terms_add?: string[];
  exclude_terms_remove?: string[];
}

// Updated subject interface to match new API response
export interface SubjectInSubcategory {
  ent_fsid: string;
  ent_name: string;
  ent_summary: string;
  indexes: Array<{
    HR?: number;
    TT?: number;
    WS?: number;
  }>;
}

// Updated subcategory interface to match new API response
export interface SubcategoryWithSubjects {
  subcategory_id: string;
  subcategory_name: string;
  subjects: SubjectInSubcategory[];
}

// Legacy interfaces for backward compatibility
export interface SubjectConfig {
  subject_name: string;
  subject_fsid: string;
  subcategory_name: string;
  subcategory_fsid: string;
}

export interface Subject {
  subject_name: string;
  subject_fsid: string;
  subject_summary: string;
  subject_indexes: any[];
}

export interface Subcategory {
  id: string;
  name: string;
  fsid: string;
  subject_count: number;
  metadata?: {
    description?: string;
    deletable?: boolean;
  };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FuturityAnalysis {
  _id: string;
  uniqueID: string;
  unique_name: string;
  lab_uniqueID: string;
  name: string;
  metadata: {
    lab_id?: string;
    ent_name: string;
    ent_summary: string;
    ent_start?: string;
    ent_tags?: string;
    ent_inventors?: string;
    ent_image?: string;
    status?: string;
    visible?: boolean;
    picture_url?: string | null;
    ent_authors?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Metadata {
  kbid?: string;
  miro_board_url?: string;
  ent_summary?: string;
  subject_fsids?: string[];
  exclude_terms?: string[];
  include_terms?: string[];
  picture_url?: string;
}

// Updated Lab interface to match new API response structure
export interface Lab {
  _id: string;
  uniqueID: string;
  ent_name: string;
  ent_fsid: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  kbid?: string;
  miro_board_url?: string;
  ent_summary?: string;
  picture_url?: string;
  thumbnail_url?: string;
  subcategories_map: SubcategoryWithSubjects[];
  subjects_config: SubjectConfig[];
  subjects: Subject[];
  subcategories: Subcategory[];
  metadata: Metadata;
  exclude_terms?: string[];
  include_terms?: string[];
  goals?: ApiLabGoal[];
}

// Type alias for Futurity Labs (same as Lab)
export type FuturityLab = Lab;

// Subject removal request interface
export interface RemoveSubjectRequest {
  lab_id: string;
  subject_ent_fsid: string;
}

// Subject removal response interface
export interface RemoveSubjectResponse {
  success: boolean;
  message?: string;
}

// Batch subject index request interface
export interface BatchSubjectIndexRequest {
  fsids: string[];
}

// Batch subject index response interface
export interface BatchSubjectIndexResponse {
  results: Array<{
    ent_fsid: string;
    success: boolean;
    data?: {
      ent_name: string;
      ent_summary: string;
      indexes: Array<{
        HR?: number;
        TT?: number;
        WS?: number;
      }>;
    };
    error?: string;
  }>;
}

class LabService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * 🚀 PERFORMANCE: Batch fetch subject indexes
   * This method attempts to fetch multiple subject indexes in a single request
   * Falls back to individual requests if batch endpoint is not available
   */
  async fetchSubjectIndexesBatch(
    subjectFsids: string[],
    token: string
  ): Promise<Map<string, SubjectIndexData>> {
    const results = new Map<string, SubjectIndexData>();

    // Check cache first
    const uncachedFsids: string[] = [];
    subjectFsids.forEach((fsid) => {
      const cached = subjectIndexCache.get(fsid);
      if (cached) {
        results.set(fsid, cached);
      } else {
        uncachedFsids.push(fsid);
      }
    });

    if (uncachedFsids.length === 0) {
      console.log('✅ All subject indexes found in cache');
      return results;
    }

    console.log(
      `🔄 Fetching ${uncachedFsids.length} subject indexes (${
        subjectFsids.length - uncachedFsids.length
      } from cache)`
    );

    // Try batch endpoint first (if available)
    try {
      const batchResponse = await this.tryBatchSubjectIndexes(
        uncachedFsids,
        token
      );
      if (batchResponse) {
        batchResponse.forEach((data, fsid) => {
          results.set(fsid, data);
          subjectIndexCache.set(fsid, data);
        });
        return results;
      }
    } catch (error) {
      console.log(
        '📝 Batch endpoint not available, falling back to parallel individual requests'
      );
    }

    // Fall back to parallel individual requests
    const promises = uncachedFsids.map(async (fsid) => {
      try {
        const data = await this.fetchSingleSubjectIndex(fsid, token);
        subjectIndexCache.set(fsid, data);
        return { fsid, data };
      } catch (error) {
        console.warn(`Failed to fetch indexes for ${fsid}:`, error);
        return { fsid, data: null };
      }
    });

    const responses = await Promise.all(promises);
    responses.forEach(({ fsid, data }) => {
      if (data) {
        results.set(fsid, data);
      }
    });

    return results;
  }

  /**
   * Try to use batch endpoint for subject indexes
   * Returns null if batch endpoint is not available
   */
  private async tryBatchSubjectIndexes(
    fsids: string[],
    token: string
  ): Promise<Map<string, SubjectIndexData> | null> {
    try {
      const response = await fetch(`${SUBJECTS_API_BASE_URL}/batch`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ fsids }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Batch endpoint not available
          return null;
        }
        throw new Error(`Batch request failed: ${response.status}`);
      }

      const batchResponse: BatchSubjectIndexResponse = await response.json();
      const results = new Map<string, SubjectIndexData>();

      batchResponse.results.forEach((result) => {
        if (result.success && result.data) {
          const indexes = result.data.indexes?.[0] || {};
          results.set(result.ent_fsid, {
            HR: indexes.HR,
            TT: indexes.TT,
            WS: indexes.WS,
          });
        }
      });

      return results;
    } catch (error) {
      console.warn('Batch subject index request failed:', error);
      return null;
    }
  }

  /**
   * Fetch a single subject's index data
   */
  private async fetchSingleSubjectIndex(
    fsid: string,
    token: string
  ): Promise<SubjectIndexData> {
    const normalizedFsid = fsid.startsWith('fsid_') ? fsid : `fsid_${fsid}`;

    const response = await fetch(
      `${SUBJECTS_API_BASE_URL}/${encodeURIComponent(normalizedFsid)}`,
      {
        headers: this.getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch subject ${fsid}: ${response.status}`);
    }

    const subjectData = await response.json();

    let horizonRank = undefined;
    let techTransfer = undefined;
    let whiteSpace = undefined;

    if (
      subjectData.indexes &&
      Array.isArray(subjectData.indexes) &&
      subjectData.indexes.length > 0
    ) {
      const firstIndex = subjectData.indexes[0];
      if (firstIndex && typeof firstIndex === 'object') {
        horizonRank = firstIndex.HR;
        techTransfer = firstIndex.TT;
        whiteSpace = firstIndex.WS;
      }
    }

    return {
      HR: horizonRank,
      TT: techTransfer,
      WS: whiteSpace,
    };
  }

  // Get labs for a specific team with caching
  async getLabsForTeam(
    teamId: string,
    token: string,
    includeArchived: boolean = false
  ): Promise<Lab[]> {
    const cacheKey = `team-${teamId}-${includeArchived}`;
    const cached = labCache.get(cacheKey);

    if (cached) {
      console.log('✅ Labs found in cache for team:', teamId);
      return Array.isArray(cached) ? cached : [cached];
    }

    const urlString = `${API_BASE_URL}/by-team/${encodeURIComponent(
      teamId
    )}?include_archived=${includeArchived}`;

    console.log('🌐 Making network request to getLabsForTeam');
    console.log('🔗 Final URL string:', urlString);

    const response = await fetch(urlString, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch labs for team: ${response.status} - ${errorText}`
      );
    }

    const rawLabs = await response.json();
    const transformedLabs = rawLabs.map((lab: any) =>
      this.transformLabResponse(lab)
    );

    // Cache the results
    labCache.set(cacheKey, transformedLabs);

    return transformedLabs;
  }

  // Get a specific lab by ID with caching
  async getLabById(labId: string, token: string): Promise<Lab> {
    const cacheKey = `lab-${labId}`;
    const cached = labCache.get(cacheKey);

    if (cached && !Array.isArray(cached)) {
      console.log('✅ Lab found in cache:', labId);
      return cached;
    }

    const response = await fetch(`${API_BASE_URL}/${labId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Lab with ID "${labId}" not found`);
      }
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to access this lab.');
      }
      throw new Error(
        `Failed to fetch lab: ${response.status} ${response.statusText}`
      );
    }

    const rawLab = await response.json();
    const transformedLab = this.transformLabResponse(rawLab);

    // Cache the result
    labCache.set(cacheKey, transformedLab);

    return transformedLab;
  }

  // ===================
  // FUTURITY LABS METHODS
  // ===================

  /**
   * Get all Futurity Labs from the hardcoded team
   */
  async getFuturityLabs(token: string): Promise<FuturityLab[]> {
    try {
      const labs = await this.getLabsForTeam(FUTURITY_TEAM_ID, token, false);
      const activeLabs = labs.filter((lab) => lab.status === 'active');
      const sortedLabs = activeLabs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return sortedLabs;
    } catch (error) {
      console.error('Failed to fetch Futurity Labs:', error);
      throw error;
    }
  }

  /**
   * Get a specific Futurity Lab by its uniqueID
   */
  async getFuturityLabByUniqueId(
    uniqueId: string,
    token: string
  ): Promise<FuturityLab> {
    try {
      const labs = await this.getLabsForTeam(FUTURITY_TEAM_ID, token, false);
      const lab = labs.find((lab) => lab.uniqueID === uniqueId);

      if (!lab) {
        throw new Error(`Futurity Lab with uniqueID "${uniqueId}" not found`);
      }

      return lab;
    } catch (error) {
      console.error('❌ Failed to fetch Futurity Lab:', error);
      throw error;
    }
  }

  /**
   * Check if a lab belongs to the Futurity team
   */
  async isFuturityLab(labId: string, token: string): Promise<boolean> {
    try {
      const labs = await this.getLabsForTeam(FUTURITY_TEAM_ID, token, false);
      return labs.some((lab) => lab._id === labId || lab.uniqueID === labId);
    } catch (error) {
      console.error('Failed to check if lab is Futurity Lab:', error);
      return false;
    }
  }

  /**
   * Get the hardcoded Futurity team ID
   */
  getFuturityTeamId(): string {
    return FUTURITY_TEAM_ID;
  }

  // ===================
  // END FUTURITY LABS METHODS
  // ===================

  /**
   * Transform the new API response to include legacy properties for backward compatibility
   */
  private transformLabResponse(rawLab: any): Lab {
    // Create legacy subjects_config array from subcategories_map
    const subjects_config: SubjectConfig[] = [];
    const subjects: Subject[] = [];
    const subcategories: Subcategory[] = [];

    // Process subcategories_map to create legacy structures
    if (rawLab.subcategories_map && Array.isArray(rawLab.subcategories_map)) {
      rawLab.subcategories_map.forEach(
        (subcategoryMap: SubcategoryWithSubjects) => {
          // Add to subcategories array
          subcategories.push({
            id: subcategoryMap.subcategory_id,
            name: subcategoryMap.subcategory_name,
            fsid: `fsid_${subcategoryMap.subcategory_name
              .toLowerCase()
              .replace(/\s+/g, '_')}`,
            subject_count: subcategoryMap.subjects?.length || 0,
            metadata: {
              description:
                subcategoryMap.subcategory_name === 'Uncategorized'
                  ? 'Default category for new subjects'
                  : undefined,
              deletable: subcategoryMap.subcategory_name !== 'Uncategorized',
            },
            status: 'active',
            createdAt: rawLab.createdAt,
            updatedAt: rawLab.updatedAt,
          });

          // Process subjects within this subcategory
          if (
            subcategoryMap.subjects &&
            Array.isArray(subcategoryMap.subjects)
          ) {
            subcategoryMap.subjects.forEach((subject: SubjectInSubcategory) => {
              // Add to subjects_config array
              subjects_config.push({
                subject_name: subject.ent_name,
                subject_fsid: subject.ent_fsid,
                subcategory_name: subcategoryMap.subcategory_name,
                subcategory_fsid: subcategoryMap.subcategory_id,
              });

              // Add to subjects array
              subjects.push({
                subject_name: subject.ent_name,
                subject_fsid: subject.ent_fsid,
                subject_summary: subject.ent_summary,
                subject_indexes: subject.indexes || [],
              });
            });
          }
        }
      );
    }

    // Ensure there's always an "Uncategorized" subcategory
    const hasUncategorized = subcategories.some(
      (sub) => sub.name.toLowerCase() === 'uncategorized'
    );

    if (!hasUncategorized) {
      subcategories.unshift({
        id: 'uncategorized',
        name: 'Uncategorized',
        fsid: 'fsid_uncategorized',
        subject_count: 0,
        metadata: {
          description: 'Default category for new subjects',
          deletable: false,
        },
        status: 'active',
        createdAt: rawLab.createdAt,
        updatedAt: rawLab.updatedAt,
      });
    }

    // Return the enhanced lab object with both new and legacy properties
    return {
      ...rawLab,
      subcategories_map: rawLab.subcategories_map || [],
      subjects_config,
      subjects,
      subcategories,
      metadata: rawLab.metadata || {},
    };
  }

  // Update lab information using PUT with cache invalidation
  async updateLab(
    labId: string,
    updates: LabUpdateRequest,
    token: string
  ): Promise<Lab> {
    console.log('Updating lab:', labId, 'with data:', updates);

    const response = await fetch(`${API_BASE_URL}/${labId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to update this lab.');
      }
      if (response.status === 404) {
        throw new Error('Lab not found.');
      }

      // Try to get error message from response
      const errorText = await response.text();
      throw new Error(
        `Failed to update lab: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const rawLab = await response.json();
    const transformedLab = this.transformLabResponse(rawLab);

    // Invalidate cache for this lab
    labCache.clear(); // For simplicity, clear entire cache. In production, you'd want more targeted invalidation

    return transformedLab;
  }

  // ===================
  // TERMS MANAGEMENT METHODS
  // ===================

  /**
   * Add an include term to the lab
   */
  async addIncludeTerm(
    labId: string,
    term: string,
    token: string
  ): Promise<Lab> {
    const updates: AddTermRequest = {
      include_terms_add: [term.trim()],
    };

    return this.updateLab(labId, updates, token);
  }

  /**
   * Add an exclude term to the lab
   */
  async addExcludeTerm(
    labId: string,
    term: string,
    token: string
  ): Promise<Lab> {
    const updates: AddTermRequest = {
      exclude_terms_add: [term.trim()],
    };

    return this.updateLab(labId, updates, token);
  }

  /**
   * Remove an include term from the lab
   */
  async removeIncludeTerm(
    labId: string,
    term: string,
    token: string
  ): Promise<Lab> {
    const updates: RemoveTermRequest = {
      include_terms_remove: [term.trim()],
    };

    return this.updateLab(labId, updates, token);
  }

  /**
   * Remove an exclude term from the lab
   */
  async removeExcludeTerm(
    labId: string,
    term: string,
    token: string
  ): Promise<Lab> {
    const updates: RemoveTermRequest = {
      exclude_terms_remove: [term.trim()],
    };

    return this.updateLab(labId, updates, token);
  }

  /**
   * Toggle a term between include and exclude
   */
  async toggleTermType(
    labId: string,
    term: string,
    fromType: 'include' | 'exclude',
    token: string
  ): Promise<Lab> {
    const trimmedTerm = term.trim();

    const updates: ToggleTermRequest =
      fromType === 'include'
        ? {
            include_terms_remove: [trimmedTerm],
            exclude_terms_add: [trimmedTerm],
          }
        : {
            exclude_terms_remove: [trimmedTerm],
            include_terms_add: [trimmedTerm],
          };

    return this.updateLab(labId, updates, token);
  }

  // ===================
  // END TERMS MANAGEMENT METHODS
  // ===================

  // Update lab basic info (name and description)
  async updateLabInfo(
    labId: string,
    name: string,
    description: string,
    token: string
  ): Promise<Lab> {
    // First get current lab data to preserve existing information
    const currentLab = await this.getLabById(labId, token);

    const updates: LabUpdateRequest = {
      ent_name: name,
      ent_summary: description,
      // Preserve existing data
      exclude_terms: currentLab.exclude_terms || [],
      include_terms: currentLab.include_terms || [],
      goals: currentLab.goals || [],
      metadata: currentLab.metadata || {},
    };

    return this.updateLab(labId, updates, token);
  }

  // Update lab terms (bulk update - legacy method)
  async updateLabTerms(
    labId: string,
    includeTerms: string[],
    excludeTerms: string[],
    token: string
  ): Promise<Lab> {
    // First get current lab data to preserve existing information
    const currentLab = await this.getLabById(labId, token);

    const updates: LabUpdateRequest = {
      include_terms: includeTerms,
      exclude_terms: excludeTerms,
      // Preserve existing data
      ent_name: currentLab.ent_name,
      ent_summary: currentLab.ent_summary,
      goals: currentLab.goals || [],
      metadata: currentLab.metadata || {},
    };

    return this.updateLab(labId, updates, token);
  }

  // Update lab goals
  async updateLabGoals(
    labId: string,
    goals: ApiLabGoal[],
    token: string
  ): Promise<Lab> {
    // First get current lab data to preserve existing information
    const currentLab = await this.getLabById(labId, token);

    const updates: LabUpdateRequest = {
      goals: goals,
      // Preserve existing data
      ent_name: currentLab.ent_name,
      ent_summary: currentLab.ent_summary,
      include_terms: currentLab.include_terms || [],
      exclude_terms: currentLab.exclude_terms || [],
      metadata: currentLab.metadata || {},
    };

    return this.updateLab(labId, updates, token);
  }

  // Add a single goal to the lab
  async addLabGoal(
    labId: string,
    newGoal: ApiLabGoal,
    token: string
  ): Promise<Lab> {
    // First get current lab data
    const currentLab = await this.getLabById(labId, token);

    // Add the new goal to existing goals
    const updatedGoals = [...(currentLab.goals || []), newGoal];

    return this.updateLabGoals(labId, updatedGoals, token);
  }

  // Remove a goal from the lab by matching properties (safer than index)
  async removeLabGoalByContent(
    labId: string,
    goalToRemove: ApiLabGoal,
    token: string
  ): Promise<Lab> {
    // First get current lab data
    const currentLab = await this.getLabById(labId, token);

    // Remove the goal that matches name and description
    const updatedGoals = (currentLab.goals || []).filter(
      (goal) =>
        !(
          goal.name === goalToRemove.name &&
          goal.description === goalToRemove.description
        )
    );

    return this.updateLabGoals(labId, updatedGoals, token);
  }

  // Update lab metadata
  async updateLabMetadata(
    labId: string,
    metadata: ApiLabMetadata,
    token: string
  ): Promise<Lab> {
    // First get current lab data to preserve existing information
    const currentLab = await this.getLabById(labId, token);

    const updates: LabUpdateRequest = {
      metadata: { ...currentLab.metadata, ...metadata },
      // Preserve existing data
      ent_name: currentLab.ent_name,
      ent_summary: currentLab.ent_summary,
      include_terms: currentLab.include_terms || [],
      exclude_terms: currentLab.exclude_terms || [],
      goals: currentLab.goals || [],
    };

    return this.updateLab(labId, updates, token);
  }

  // Update lab picture URLs
  async updateLabImages(
    labId: string,
    pictureUrl?: string,
    thumbnailUrl?: string,
    token?: string
  ): Promise<Lab> {
    if (!token) {
      throw new Error('Authentication token required');
    }

    // First get current lab data to preserve existing information
    const currentLab = await this.getLabById(labId, token);

    const updates: LabUpdateRequest = {
      picture_url:
        pictureUrl !== undefined ? pictureUrl : currentLab.picture_url,
      thumbnail_url:
        thumbnailUrl !== undefined ? thumbnailUrl : currentLab.thumbnail_url,
      // Preserve existing data
      ent_name: currentLab.ent_name,
      ent_summary: currentLab.ent_summary,
      include_terms: currentLab.include_terms || [],
      exclude_terms: currentLab.exclude_terms || [],
      goals: currentLab.goals || [],
      metadata: currentLab.metadata || {},
    };

    return this.updateLab(labId, updates, token);
  }

  /**
   * Remove a subject from a lab using the disconnect endpoint
   */
  async removeSubjectFromLab(
    labId: string,
    subjectFsid: string,
    token: string
  ): Promise<void> {
    const normalizedSubjectFsid = subjectFsid.startsWith('fsid_')
      ? subjectFsid
      : `fsid_${subjectFsid}`;

    const requestBody: RemoveSubjectRequest = {
      lab_id: labId,
      subject_ent_fsid: normalizedSubjectFsid,
    };

    const response = await fetch(`${SUBJECTS_API_BASE_URL}/disconnect`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to remove this subject.');
      }
      if (response.status === 404) {
        throw new Error('Subject or lab not found.');
      }

      const errorText = await response.text();
      throw new Error(
        `Failed to remove subject from lab: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    // Invalidate cache after successful removal
    labCache.clear();
  }

  // Get analyses for a specific lab
  async getLabAnalyses(
    labUniqueId: string,
    token: string
  ): Promise<FuturityAnalysis[]> {
    const baseUrl =
      'https://fast.futurity.science/management/analyses/liked/by-lab';
    const urlString = `${baseUrl}?lab_uniqueID=${encodeURIComponent(
      labUniqueId
    )}&include_html=false`;

    const response = await fetch(urlString, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to access lab analyses.');
      }
      throw new Error(
        `Failed to fetch lab analyses: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Remove analysis from lab
  async removeAnalysisFromLab(
    analysisUniqueId: string,
    labUniqueId: string,
    token: string
  ): Promise<void> {
    const baseUrl = `https://fast.futurity.science/management/analyses/${analysisUniqueId}/like`;
    const urlString = `${baseUrl}?lab_uniqueID=${encodeURIComponent(
      labUniqueId
    )}`;

    const response = await fetch(urlString, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to remove this analysis.');
      }
      if (response.status === 404) {
        throw new Error('Analysis not found or not associated with this lab.');
      }
      throw new Error(
        `Failed to remove analysis: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * 🧹 Cache management methods
   */
  clearCache(): void {
    labCache.clear();
    subjectIndexCache.clear();
    console.log('🧹 Lab service cache cleared');
  }

  getCacheStats(): {
    labCacheSize: number;
    subjectIndexCacheSize: number;
  } {
    return {
      labCacheSize: labCache.size(),
      subjectIndexCacheSize: subjectIndexCache.size(),
    };
  }

  /**
   * Helper method to get all subjects from subcategories_map
   */
  getAllSubjectsFromLab(lab: Lab): SubjectInSubcategory[] {
    if (!lab.subcategories_map) return [];

    const allSubjects: SubjectInSubcategory[] = [];
    lab.subcategories_map.forEach((subcategoryMap) => {
      if (subcategoryMap.subjects) {
        allSubjects.push(...subcategoryMap.subjects);
      }
    });

    return allSubjects;
  }

  /**
   * Helper method to get subjects for a specific subcategory
   */
  getSubjectsForSubcategory(
    lab: Lab,
    subcategoryId: string
  ): SubjectInSubcategory[] {
    const subcategoryMap = lab.subcategories_map?.find(
      (map) => map.subcategory_id === subcategoryId
    );
    return subcategoryMap?.subjects || [];
  }

  /**
   * Helper method to get subcategory by ID
   */
  getSubcategoryById(
    lab: Lab,
    subcategoryId: string
  ): SubcategoryWithSubjects | undefined {
    return lab.subcategories_map?.find(
      (map) => map.subcategory_id === subcategoryId
    );
  }
}

export const labService = new LabService();

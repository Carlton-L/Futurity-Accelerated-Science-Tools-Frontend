// services/labService.ts

const API_BASE_URL = 'https://fast.futurity.science/management/labs';
const SUBJECTS_API_BASE_URL =
  'https://fast.futurity.science/management/subjects';

// Constants
const FUTURITY_TEAM_ID = '17b389f5-c487-49ba-8a82-0b21d887777f';

// Goal interface matching the new API structure
export interface ApiLabGoal {
  name: string;
  description: string;
  user_groups: Array<{
    description: string;
    size: number;
  }>;
  problem_statements: Array<{
    description: string;
  }>;
  impact_level: number; // 0-100 scale
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
  // New terms management fields
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

  // New structure - replaces subjects_config and subjects arrays
  subcategories_map: SubcategoryWithSubjects[];

  // Legacy properties for backward compatibility (computed from subcategories_map)
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

class LabService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  // Get labs for a specific team
  async getLabsForTeam(
    teamId: string,
    token: string,
    includeArchived: boolean = false
  ): Promise<Lab[]> {
    // Build URL string using the correct /by-team/ endpoint structure
    const urlString = `${API_BASE_URL}/by-team/${encodeURIComponent(
      teamId
    )}?include_archived=${includeArchived}`;

    // Enhanced debug logging
    console.log('🌐 Making network request to getLabsForTeam');
    console.log('📍 API_BASE_URL:', API_BASE_URL);
    console.log('🎯 Team ID:', teamId);
    console.log('📦 Include archived:', includeArchived);
    console.log('🔗 Final URL string:', urlString);
    console.log(
      '🔑 Token preview:',
      token ? token.substring(0, 10) + '...' : 'NO TOKEN'
    );

    // Verify the URL starts with https
    if (!urlString.startsWith('https://')) {
      console.error('⚠️  WARNING: URL is not HTTPS!', urlString);
    }

    console.log('📡 About to make fetch request...');

    const response = await fetch(urlString, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    console.log('📥 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(
        `Failed to fetch labs for team: ${response.status} - ${errorText}`
      );
    }

    console.log('📋 Parsing response as JSON...');
    const rawLabs = await response.json();

    console.log('✅ Raw labs received:', {
      count: Array.isArray(rawLabs) ? rawLabs.length : 'Not an array',
      type: typeof rawLabs,
      firstLabPreview:
        Array.isArray(rawLabs) && rawLabs[0]
          ? {
              id: rawLabs[0]._id,
              uniqueID: rawLabs[0].uniqueID,
              name: rawLabs[0].ent_name,
            }
          : 'No labs or not array',
    });

    // Transform each lab to include legacy properties
    const transformedLabs = rawLabs.map((lab: any) =>
      this.transformLabResponse(lab)
    );

    console.log(
      '🔄 Labs transformed, returning:',
      transformedLabs.length,
      'labs'
    );

    return transformedLabs;
  }

  // Get a specific lab by ID
  async getLabById(labId: string, token: string): Promise<Lab> {
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

    // Transform the response to include legacy properties
    return this.transformLabResponse(rawLab);
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

      // Filter only active labs and sort by creation date (newest first)
      const activeLabs = labs.filter((lab) => lab.status === 'active');

      // Sort by creation date (newest first)
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
    console.log('🔍 getFuturityLabByUniqueId called with:', {
      uniqueId,
      token: token.substring(0, 10) + '...',
    });

    try {
      console.log(
        '📡 Making API call to getLabsForTeam with FUTURITY_TEAM_ID:',
        FUTURITY_TEAM_ID
      );

      // First get all labs from the team to find the one with matching uniqueID
      const labs = await this.getLabsForTeam(FUTURITY_TEAM_ID, token, false);

      console.log('✅ Got labs from team:', {
        totalLabs: labs.length,
        labIds: labs.map((lab) => ({
          id: lab._id,
          uniqueID: lab.uniqueID,
          name: lab.ent_name,
        })),
      });

      // Find the lab with the matching uniqueID
      const lab = labs.find((lab) => lab.uniqueID === uniqueId);

      if (!lab) {
        console.error('❌ Lab not found with uniqueID:', uniqueId);
        console.log(
          'Available uniqueIDs:',
          labs.map((l) => l.uniqueID)
        );
        throw new Error(`Futurity Lab with uniqueID "${uniqueId}" not found`);
      }

      console.log('✅ Found matching lab:', {
        id: lab._id,
        uniqueID: lab.uniqueID,
        name: lab.ent_name,
        status: lab.status,
      });

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

  // Update lab information using PUT
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
    return this.transformLabResponse(rawLab);
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
   * @param labId - The lab unique ID (not MongoDB _id)
   * @param subjectFsid - The subject's ent_fsid (with or without fsid_ prefix)
   * @param token - Authentication token
   * @returns Promise<void>
   */
  async removeSubjectFromLab(
    labId: string,
    subjectFsid: string,
    token: string
  ): Promise<void> {
    console.log('🗑️ Removing subject from lab:', {
      labId,
      subjectFsid,
    });

    // Ensure the subject fsid has the correct format (with fsid_ prefix)
    const normalizedSubjectFsid = subjectFsid.startsWith('fsid_')
      ? subjectFsid
      : `fsid_${subjectFsid}`;

    const requestBody: RemoveSubjectRequest = {
      lab_id: labId,
      subject_ent_fsid: normalizedSubjectFsid,
    };

    console.log('📡 Making disconnect request:', requestBody);

    const response = await fetch(`${SUBJECTS_API_BASE_URL}/disconnect`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Disconnect response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
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

      // Try to get error message from response
      const errorText = await response.text();
      console.error('❌ Disconnect request failed:', errorText);
      throw new Error(
        `Failed to remove subject from lab: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    // Parse response if it exists
    const responseText = await response.text();
    if (responseText.trim()) {
      try {
        const data: RemoveSubjectResponse = JSON.parse(responseText);
        console.log('✅ Subject removal response:', data);
      } catch (parseError) {
        console.log('✅ Subject removed successfully (non-JSON response)');
      }
    } else {
      console.log('✅ Subject removed successfully (empty response)');
    }
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

    // Debug logging
    console.log('Lab analyses URL:', urlString);

    const response = await fetch(urlString, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // No analyses found for this lab
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

    // Debug logging
    console.log('Remove analysis URL:', urlString);

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

  /**
   * Helper method to transform frontend categories/subjects back to subcategories_map for API updates
   */
  transformToSubcategoriesMap(
    categories: Array<{
      id: string;
      name: string;
      subjects: Array<{
        subjectId: string;
        subjectName: string;
        subjectSlug: string;
        notes?: string;
      }>;
    }>
  ): SubcategoryWithSubjects[] {
    return categories.map((category) => ({
      subcategory_id: category.id,
      subcategory_name: category.name,
      subjects: category.subjects.map((subject) => ({
        ent_fsid: subject.subjectSlug.startsWith('fsid_')
          ? subject.subjectSlug
          : `fsid_${subject.subjectSlug}`,
        ent_name: subject.subjectName,
        ent_summary: subject.notes || '',
        indexes: [],
      })),
    }));
  }

  /**
   * Helper method to add a subject to a specific subcategory via API
   */
  async addSubjectToSubcategory(
    labId: string,
    subcategoryId: string,
    subjectFsid: string,
    subjectName: string,
    subjectSummary: string,
    token: string
  ): Promise<Lab> {
    // Get current lab data
    const currentLab = await this.getLabById(labId, token);

    const newSubject = {
      ent_fsid: subjectFsid.startsWith('fsid_')
        ? subjectFsid
        : `fsid_${subjectFsid}`,
      ent_name: subjectName,
      ent_summary: subjectSummary,
      indexes: [],
    };

    // Update subcategories_map
    const updatedSubcategoriesMap = (currentLab.subcategories_map || []).map(
      (subcategoryMap) => {
        if (
          subcategoryMap.subcategory_id === subcategoryId ||
          (subcategoryId === 'uncategorized' &&
            subcategoryMap.subcategory_name.toLowerCase() === 'uncategorized')
        ) {
          return {
            ...subcategoryMap,
            subjects: [...(subcategoryMap.subjects || []), newSubject],
          };
        }
        return subcategoryMap;
      }
    );

    // If subcategory not found and it's uncategorized, create it
    if (
      subcategoryId === 'uncategorized' &&
      !updatedSubcategoriesMap.some(
        (s) => s.subcategory_name.toLowerCase() === 'uncategorized'
      )
    ) {
      const uncategorizedSubcategory: SubcategoryWithSubjects = {
        subcategory_id: 'uncategorized',
        subcategory_name: 'Uncategorized',
        subjects: [newSubject],
      };
      updatedSubcategoriesMap.unshift(uncategorizedSubcategory);
    }

    const updates: LabUpdateRequest = {
      ent_name: currentLab.ent_name,
      ent_summary: currentLab.ent_summary,
      include_terms: currentLab.include_terms || [],
      exclude_terms: currentLab.exclude_terms || [],
      goals: currentLab.goals || [],
      metadata: {
        ...currentLab.metadata,
        subcategories_map: updatedSubcategoriesMap,
      },
    };

    return this.updateLab(labId, updates, token);
  }

  /**
   * Helper method to move a subject between subcategories via API
   */
  async moveSubjectBetweenSubcategories(
    labId: string,
    subjectFsid: string,
    fromSubcategoryId: string,
    toSubcategoryId: string,
    token: string
  ): Promise<Lab> {
    // Get current lab data
    const currentLab = await this.getLabById(labId, token);

    // Find and remove the subject from its current subcategory
    let subjectToMove: any = null;
    const updatedSubcategoriesMap = (currentLab.subcategories_map || []).map(
      (subcategoryMap) => {
        const subjectIndex = (subcategoryMap.subjects || []).findIndex(
          (s) => s.ent_fsid === subjectFsid
        );
        if (subjectIndex >= 0) {
          subjectToMove = subcategoryMap.subjects[subjectIndex];
          return {
            ...subcategoryMap,
            subjects: subcategoryMap.subjects.filter(
              (_, index) => index !== subjectIndex
            ),
          };
        }
        return subcategoryMap;
      }
    );

    if (!subjectToMove) {
      throw new Error('Subject not found');
    }

    // Add subject to new subcategory
    const finalUpdatedSubcategoriesMap = updatedSubcategoriesMap.map(
      (subcategoryMap) => {
        if (
          subcategoryMap.subcategory_id === toSubcategoryId ||
          (toSubcategoryId === 'uncategorized' &&
            subcategoryMap.subcategory_name.toLowerCase() === 'uncategorized')
        ) {
          return {
            ...subcategoryMap,
            subjects: [...(subcategoryMap.subjects || []), subjectToMove],
          };
        }
        return subcategoryMap;
      }
    );

    const updates: LabUpdateRequest = {
      ent_name: currentLab.ent_name,
      ent_summary: currentLab.ent_summary,
      include_terms: currentLab.include_terms || [],
      exclude_terms: currentLab.exclude_terms || [],
      goals: currentLab.goals || [],
      metadata: {
        ...currentLab.metadata,
        subcategories_map: finalUpdatedSubcategoriesMap,
      },
    };

    return this.updateLab(labId, updates, token);
  }
}

export const labService = new LabService();

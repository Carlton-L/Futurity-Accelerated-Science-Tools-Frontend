// services/labService.ts

// Base URL without trailing slash to avoid double slashes in path construction
const API_BASE_URL = 'https://fast.futurity.science/management/labs';

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

// Lab update request interface
export interface LabUpdateRequest {
  ent_name?: string;
  ent_summary?: string;
  picture_url?: string;
  thumbnail_url?: string;
  exclude_terms?: string[];
  include_terms?: string[];
  goals?: ApiLabGoal[];
  metadata?: ApiLabMetadata;
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
    // Build URL string directly - add trailing slash for list endpoint
    const urlString = `${API_BASE_URL}/?team_id=${encodeURIComponent(
      teamId
    )}&include_archived=${includeArchived}`;

    // Enhanced debug logging
    console.group('🔍 Lab Service Request Debug');
    console.log('API_BASE_URL constant:', API_BASE_URL);
    console.log('Final URL string:', urlString);
    console.log('URL protocol:', new URL(urlString).protocol);
    console.log('Window location protocol:', window.location.protocol);
    
    // Verify the URL starts with https
    if (!urlString.startsWith('https://')) {
      console.error('⚠️ CRITICAL: URL is not HTTPS!', urlString);
      console.trace('Stack trace for non-HTTPS URL');
    }
    console.groupEnd();

    const response = await fetch(urlString, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch labs for team: ${response.status}`);
    }

    const rawLabs = await response.json();

    // Transform each lab to include legacy properties
    return rawLabs.map((lab: any) => this.transformLabResponse(lab));
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

  // Update lab terms
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

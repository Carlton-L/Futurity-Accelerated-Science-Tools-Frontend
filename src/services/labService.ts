// services/labService.ts

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

// Type definitions for the existing Labs API
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

// Enhanced Lab interface with goals support
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
  subjects_config: SubjectConfig[];
  subjects: Subject[];
  subcategories: Subcategory[];
  metadata: Metadata;
  exclude_terms?: string[];
  include_terms?: string[];
  goals?: ApiLabGoal[]; // Added goals support
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
    // Build URL string directly
    const urlString = `${API_BASE_URL}?team_id=${encodeURIComponent(
      teamId
    )}&include_archived=${includeArchived}`;

    // Debug logging
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Final URL string:', urlString);

    // Verify the URL starts with https
    if (!urlString.startsWith('https://')) {
      console.error('WARNING: URL is not HTTPS!', urlString);
    }

    const response = await fetch(urlString, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch labs for team: ${response.status}`);
    }

    return response.json();
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

    return response.json();
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

    return response.json();
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
}

export const labService = new LabService();

// services/labService.ts

const API_BASE_URL = 'https://fast.futurity.science/management/labs';

// Type definitions for the new Labs API
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
    const url = new URL(API_BASE_URL);
    url.searchParams.append('team_id', teamId);
    url.searchParams.append('include_archived', includeArchived.toString());

    const response = await fetch(url.toString(), {
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

  // Get analyses for a specific lab
  async getLabAnalyses(
    labUniqueId: string,
    token: string
  ): Promise<FuturityAnalysis[]> {
    const url = new URL(
      'https://fast.futurity.science/management/analyses/liked/by-lab'
    );
    url.searchParams.append('lab_uniqueID', labUniqueId);
    url.searchParams.append('include_html', 'false');

    const response = await fetch(url.toString(), {
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
    const url = new URL(
      `https://fast.futurity.science/management/analyses/${analysisUniqueId}/like`
    );
    url.searchParams.append('lab_uniqueID', labUniqueId);

    const response = await fetch(url.toString(), {
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

// services/labService.ts

const API_BASE_URL = 'https://fast.futurity.science/management/labs';

// Type definitions for the new Labs API
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

export interface Lab {
  _id: string;
  uniqueID: string;
  ent_name: string;
  ent_fsid: string;
  metadata: {
    kbid?: string;
    miro_board_url?: string;
    ent_summary?: string;
    picture_url?: string;
    thumbnail_url?: string;
    subject_fsids?: string[];
    subjects?: Subject[];
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  kbid?: string;
  miro_board_url?: string;
  ent_summary?: string;
  picture_url?: string;
  thumbnail_url?: string;
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
      throw new Error(`Failed to fetch lab: ${response.status}`);
    }

    return response.json();
  }
}

export const labService = new LabService();

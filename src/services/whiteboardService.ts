// services/whiteboardService.ts

const API_BASE_URL = 'https://fast.futurity.science/management/whiteboards';

// Type definitions for the whiteboard API
export interface WhiteboardSubjectData {
  ent_fsid: string;
  ent_name: string;
  ent_summary: string;
  indexes: Array<{
    HR: number;
    TT: number;
    WS: number;
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

export interface WhiteboardData {
  _id: string;
  uniqueID: string;
  userID: string;
  subjects: WhiteboardSubjectData[];
  labSeeds: WhiteboardLabSeedData[];
  createdAt: string;
  updatedAt: string;
}

// Request/Response types
export interface AddSubjectRequest {
  subject: string; // fsid
}

export interface RemoveSubjectRequest {
  subject: string; // fsid
}

export interface CreateLabSeedRequest {
  name: string;
  description: string;
}

export interface DeleteLabSeedRequest {
  lab_seed_id: string; // uniqueID
}

export interface AddSubjectToLabSeedRequest {
  lab_seed_id: string; // uniqueID
  subject: string; // fsid
}

export interface RemoveSubjectFromLabSeedRequest {
  lab_seed_id: string; // uniqueID
  subject: string; // fsid
}

export interface AddTermToLabSeedRequest {
  lab_seed_id: string; // uniqueID
  term: string;
}

export interface RemoveTermFromLabSeedRequest {
  lab_seed_id: string; // uniqueID
  term: string;
}

class WhiteboardService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  // Get user's whiteboard
  async getUserWhiteboard(
    userId: string,
    token: string
  ): Promise<WhiteboardData> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Whiteboard not found for this user');
      }
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error(
          'You do not have permission to access this whiteboard.'
        );
      }
      throw new Error(
        `Failed to fetch whiteboard: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // Add subject to whiteboard
  async addSubjectToWhiteboard(
    whiteboardId: string,
    subjectFsid: string,
    token: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${whiteboardId}/subjects`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ subject: subjectFsid }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error(
          'You do not have permission to modify this whiteboard.'
        );
      }
      if (response.status === 404) {
        throw new Error('Whiteboard or subject not found.');
      }
      if (response.status === 409) {
        throw new Error('Subject already exists in whiteboard.');
      }
      throw new Error(
        `Failed to add subject: ${response.status} ${response.statusText}`
      );
    }
  }

  // Remove subject from whiteboard (and all lab seeds)
  async removeSubjectFromWhiteboard(
    whiteboardId: string,
    subjectFsid: string,
    token: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${whiteboardId}/subjects`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ subject: subjectFsid }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error(
          'You do not have permission to modify this whiteboard.'
        );
      }
      if (response.status === 404) {
        throw new Error('Whiteboard or subject not found.');
      }
      throw new Error(
        `Failed to remove subject: ${response.status} ${response.statusText}`
      );
    }
  }

  // Create new lab seed
  async createLabSeed(
    whiteboardId: string,
    name: string,
    description: string,
    token: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${whiteboardId}/lab-seeds`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error(
          'You do not have permission to modify this whiteboard.'
        );
      }
      if (response.status === 404) {
        throw new Error('Whiteboard not found.');
      }
      if (response.status === 409) {
        throw new Error('Lab seed with this name already exists.');
      }
      throw new Error(
        `Failed to create lab seed: ${response.status} ${response.statusText}`
      );
    }
  }

  // Delete lab seed
  async deleteLabSeed(
    whiteboardId: string,
    labSeedId: string,
    token: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${whiteboardId}/lab-seeds`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ lab_seed_id: labSeedId }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error(
          'You do not have permission to modify this whiteboard.'
        );
      }
      if (response.status === 404) {
        throw new Error('Whiteboard or lab seed not found.');
      }
      throw new Error(
        `Failed to delete lab seed: ${response.status} ${response.statusText}`
      );
    }
  }

  // Add subject to lab seed (copy from whiteboard)
  async addSubjectToLabSeed(
    whiteboardId: string,
    labSeedId: string,
    subjectFsid: string,
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/${whiteboardId}/lab-seeds/subjects/copy`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ lab_seed_id: labSeedId, subject: subjectFsid }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error(
          'You do not have permission to modify this whiteboard.'
        );
      }
      if (response.status === 404) {
        throw new Error('Whiteboard, lab seed, or subject not found.');
      }
      if (response.status === 409) {
        throw new Error('Subject already exists in this lab seed.');
      }
      throw new Error(
        `Failed to add subject to lab seed: ${response.status} ${response.statusText}`
      );
    }
  }

  // Remove subject from lab seed
  async removeSubjectFromLabSeed(
    whiteboardId: string,
    labSeedId: string,
    subjectFsid: string,
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/${whiteboardId}/lab-seeds/subjects`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ lab_seed_id: labSeedId, subject: subjectFsid }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error(
          'You do not have permission to modify this whiteboard.'
        );
      }
      if (response.status === 404) {
        throw new Error('Whiteboard, lab seed, or subject not found.');
      }
      throw new Error(
        `Failed to remove subject from lab seed: ${response.status} ${response.statusText}`
      );
    }
  }

  // Add term to lab seed
  async addTermToLabSeed(
    whiteboardId: string,
    labSeedId: string,
    term: string,
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/${whiteboardId}/lab-seeds/terms`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ lab_seed_id: labSeedId, term }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error(
          'You do not have permission to modify this whiteboard.'
        );
      }
      if (response.status === 404) {
        throw new Error('Whiteboard or lab seed not found.');
      }
      if (response.status === 409) {
        throw new Error('Term already exists in this lab seed.');
      }
      throw new Error(
        `Failed to add term to lab seed: ${response.status} ${response.statusText}`
      );
    }
  }

  // Remove term from lab seed
  async removeTermFromLabSeed(
    whiteboardId: string,
    labSeedId: string,
    term: string,
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/${whiteboardId}/lab-seeds/terms`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ lab_seed_id: labSeedId, term }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error(
          'You do not have permission to modify this whiteboard.'
        );
      }
      if (response.status === 404) {
        throw new Error('Whiteboard, lab seed, or term not found.');
      }
      throw new Error(
        `Failed to remove term from lab seed: ${response.status} ${response.statusText}`
      );
    }
  }
}

export const whiteboardService = new WhiteboardService();

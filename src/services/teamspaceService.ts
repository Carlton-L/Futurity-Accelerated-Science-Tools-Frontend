import type {
  Teamspace,
  TeamspaceListItem,
} from '../context/AuthContext/authTypes';

const API_BASE_URL = 'https://tools.futurity.science/api';

class TeamspaceService {
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Use provided token or get from localStorage
    const authToken = token || localStorage.getItem('auth_token');
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
  }

  async listTeamspaces(
    workspaceId: string,
    token?: string
  ): Promise<TeamspaceListItem[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teamspace/list?workspace_id=${workspaceId}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const teamspaces: TeamspaceListItem[] = await response.json();
      return teamspaces;
    } catch (error) {
      console.error('List teamspaces error:', error);
      throw error;
    }
  }

  async getTeamspace(teamspaceId: string, token?: string): Promise<Teamspace> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teamspace/view?teamspace_id=${teamspaceId}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const teamspace: Teamspace = await response.json();
      return teamspace;
    } catch (error) {
      console.error('Get teamspace error:', error);
      throw error;
    }
  }

  async createTeamspace(
    workspaceId: string,
    data: { name: string },
    token?: string
  ): Promise<Teamspace> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teamspace/create?workspace_id=${workspaceId}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const teamspace: Teamspace = await response.json();
      return teamspace;
    } catch (error) {
      console.error('Create teamspace error:', error);
      throw error;
    }
  }

  async updateTeamspace(
    teamspaceId: string,
    data: { name: string },
    token?: string
  ): Promise<Teamspace> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teamspace/update?teamspace_id=${teamspaceId}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const teamspace: Teamspace = await response.json();
      return teamspace;
    } catch (error) {
      console.error('Update teamspace error:', error);
      throw error;
    }
  }

  async addMember(
    teamspaceId: string,
    data: { username: string; role: 'owner' | 'admin' | 'viewer' },
    token?: string
  ): Promise<{ teamspace_id: string; username: string; role: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teamspace/add-member?teamspace_id=${teamspaceId}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Add member error:', error);
      throw error;
    }
  }

  async editMember(
    teamspaceId: string,
    userId: string,
    data: { role: 'owner' | 'admin' | 'viewer' },
    token?: string
  ): Promise<{ teamspace_id: string; user_id: string; role: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teamspace/edit-member?teamspace_id=${teamspaceId}&user_id=${userId}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Edit member error:', error);
      throw error;
    }
  }

  async deleteMember(
    teamspaceId: string,
    userId: string,
    token?: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/teamspace/delete-member?teamspace_id=${teamspaceId}&user_id=${userId}`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Delete member error:', error);
      throw error;
    }
  }
}

export const teamspaceService = new TeamspaceService();

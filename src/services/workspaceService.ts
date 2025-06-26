import type { Workspace } from '../context/AuthContext/authTypes';

const API_BASE_URL = 'https://tools.futurity.science/api';

class WorkspaceService {
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

  async getWorkspace(workspaceId: string, token?: string): Promise<Workspace> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/workspace/view?workspace_id=${workspaceId}`,
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

      const workspaceData: Workspace = await response.json();
      return workspaceData;
    } catch (error) {
      console.error('Get workspace error:', error);
      throw error;
    }
  }

  async updateWorkspace(
    workspaceId: string,
    data: { name: string },
    token?: string
  ): Promise<Workspace> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/workspace/update?workspace_id=${workspaceId}`,
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

      const workspaceData: Workspace = await response.json();
      return workspaceData;
    } catch (error) {
      console.error('Update workspace error:', error);
      throw error;
    }
  }
}

export const workspaceService = new WorkspaceService();

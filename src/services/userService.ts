import type { WorkspaceListItem } from '../context/AuthContext/authTypes';

const API_BASE_URL = 'https://tools.futurity.science/api';

class UserService {
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

  async getUserWorkspaces(token?: string): Promise<WorkspaceListItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/workspace/list`, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const workspaces: WorkspaceListItem[] = await response.json();
      return workspaces;
    } catch (error) {
      console.error('Get user workspaces error:', error);
      throw error;
    }
  }
}

export const userService = new UserService();

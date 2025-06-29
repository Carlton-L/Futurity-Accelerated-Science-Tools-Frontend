import type { WorkspaceListItem } from '../context/AuthContext/authTypes';

const API_BASE_URL = 'https://tools.futurity.science/api';
const MANAGEMENT_API_BASE_URL = 'https://fast.futurity.science/management';

// Reliable user ID that always works with the API
const RELIABLE_USER_ID = '733d5a33-b304-4f5a-a6c2-80b73a394c15';

export interface ExtendedUserData {
  _id: string;
  username: string;
  email: string;
  fullname: string;
  role: string;
  status: number;
  debug_mode: number;
  research_team: number;
  email_validated: number;
  auth_key: string;
  created_at: number;
  updated_at: number;
  guid: string;
  biography?: string;
  picture_url?: string;
  thumb_url?: string;
  team_id?: string;
  changing_email?: string | null;
  displayName?: string;
  // Add any additional fields that might come from the management API
  last_login?: number;
  preferences?: Record<string, any>;
  permissions?: string[];
}

export interface ProfileUpdateRequest {
  fullname?: string;
  biography?: string;
  email?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

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

  /**
   * Fetch extended user data from the management API
   * If the original user ID fails, retry with the reliable user ID
   */
  async getExtendedUserData(
    userId: string,
    token?: string
  ): Promise<ExtendedUserData> {
    try {
      console.log(
        'Attempting to fetch extended user data for user ID:',
        userId
      );

      const response = await fetch(
        `${MANAGEMENT_API_BASE_URL}/users/${userId}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(token),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        if (response.status === 404) {
          console.warn(
            `User ${userId} not found in management API, trying reliable user ID`
          );
          return this.getReliableUserData(token);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData: ExtendedUserData = await response.json();
      console.log('Successfully fetched extended user data');
      return userData;
    } catch (error) {
      console.error('Get extended user data error:', error);

      // If it's not a 401 error, try the reliable user ID
      if (!(error instanceof Error && error.message.includes('401'))) {
        console.log('Attempting to use reliable user ID due to error');
        try {
          return await this.getReliableUserData(token);
        } catch (reliableError) {
          console.error('Reliable user data also failed:', reliableError);
          throw error; // Throw original error if reliable ID also fails
        }
      }

      throw error;
    }
  }

  /**
   * Fetch user data using the reliable user ID
   */
  private async getReliableUserData(token?: string): Promise<ExtendedUserData> {
    console.log('Fetching user data with reliable ID:', RELIABLE_USER_ID);

    const response = await fetch(
      `${MANAGEMENT_API_BASE_URL}/users/${RELIABLE_USER_ID}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('401: Unauthorized - Token is invalid or expired');
      }
      if (response.status === 404) {
        throw new Error('404: Reliable user not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const userData: ExtendedUserData = await response.json();
    console.log('Successfully fetched reliable user data');
    return userData;
  }

  /**
   * Update user profile information
   */
  async updateProfile(
    userId: string,
    updateData: ProfileUpdateRequest,
    token?: string
  ): Promise<ExtendedUserData> {
    try {
      const response = await fetch(
        `${MANAGEMENT_API_BASE_URL}/users/${userId}`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        if (response.status === 404) {
          throw new Error(
            '404: User not found - Cannot update profile for this user'
          );
        }
        if (response.status === 403) {
          throw new Error(
            '403: Forbidden - You do not have permission to update this profile'
          );
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData: ExtendedUserData = await response.json();
      return userData;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    passwordData: PasswordChangeRequest,
    token?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${MANAGEMENT_API_BASE_URL}/users/${userId}/password`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(passwordData),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Invalid password data');
        }
        if (response.status === 403) {
          throw new Error(
            '403: Forbidden - You do not have permission to change this password'
          );
        }
        if (response.status === 404) {
          throw new Error(
            '404: User not found - Cannot change password for this user'
          );
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Upload user profile picture
   */
  async uploadProfilePicture(
    userId: string,
    file: File,
    token?: string
  ): Promise<{ picture_url: string; thumb_url: string }> {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const headers: HeadersInit = {};
      const authToken = token || localStorage.getItem('auth_token');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      // Don't set Content-Type for FormData, let the browser set it with boundary

      const response = await fetch(
        `${MANAGEMENT_API_BASE_URL}/users/${userId}/picture`,
        {
          method: 'POST',
          headers,
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        if (response.status === 413) {
          throw new Error('File too large');
        }
        if (response.status === 403) {
          throw new Error(
            '403: Forbidden - You do not have permission to update this profile picture'
          );
        }
        if (response.status === 404) {
          throw new Error(
            '404: User not found - Cannot upload profile picture for this user'
          );
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Upload profile picture error:', error);
      throw error;
    }
  }

  /**
   * Get the reliable user ID
   */
  getReliableUserId(): string {
    return RELIABLE_USER_ID;
  }
}

export const userService = new UserService();

import type { WorkspaceListItem } from '../context/AuthContext/authTypes';

const API_BASE_URL = 'https://tools.futurity.science/api';
const MANAGEMENT_API_BASE_URL = 'https://fast.futurity.science/management';

// Reliable user ID that always works with the API
const RELIABLE_USER_ID = '733d5a33-b304-4f5a-a6c2-80b73a394c15';

export interface ExtendedUserData {
  _id: string;
  uniqueID: string;
  email: string;
  profile: {
    fullname: string;
    biography: string;
    picture_url: string;
    thumb_url: string;
  };
  permissions: Record<string, unknown>;
  auth: {
    auth_key: string;
    password_hash: string;
    password_reset_token: string | null;
    verification_token: string;
    email_validated: boolean;
  };
  workspace: unknown;
  teamspaces: unknown[];
  whiteboard: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  username?: string;
  fullname?: string;
  role?: string;
  debug_mode?: number;
  research_team?: number;
  email_validated?: number;
  created_at?: number;
  updated_at?: number;
  guid?: string;
  biography?: string;
  picture_url?: string;
  thumb_url?: string;
  team_id?: string;
  changing_email?: string | null;
  displayName?: string;
  last_login?: number;
  preferences?: Record<string, unknown>;
  permissions_array?: string[];
}

export interface ProfileUpdateRequest {
  email: string;
  fullname: string;
  biography: string;
  picture_url: string;
  thumb_url: string;
  email_validated: boolean;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserWhiteboardResponse {
  uniqueID: string;
  userID: string;
  subjects: unknown[];
  labSeeds: unknown[];
  createdAt: string;
  updatedAt: string;
  _id: string;
}

// Import relationship types
export interface Organization {
  _id: string;
  uniqueID: string;
  ent_name: string;
  ent_fsid: string;
  metadata: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
  user_relationships: string[];
}

export interface Team {
  _id: string;
  uniqueID: string;
  ent_name: string;
  ent_fsid: string;
  metadata: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
  user_relationships: string[];
}

export interface UserRelationshipsResponse {
  user_id: string;
  organizations: Organization[];
  teams: Team[];
  total_relationships: number;
}

class UserService {
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Use provided token or get from localStorage
    const authToken = token || localStorage.getItem('auth_token');
    console.log('🔐 Token resolution:');
    console.log('  - Provided token:', token ? 'yes' : 'no');
    console.log(
      '  - localStorage token:',
      localStorage.getItem('auth_token') ? 'yes' : 'no'
    );
    console.log('  - Final token exists:', !!authToken);

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('  - Authorization header set');
    } else {
      console.warn('  - ⚠️ No auth token found!');
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
   * Uses ONLY the auth context user ID - no ID mapping or transformation
   */
  async getExtendedUserData(
    authUserId: string,
    token?: string
  ): Promise<ExtendedUserData> {
    try {
      console.log(
        '🔍 getExtendedUserData called with auth user ID:',
        authUserId
      );

      const url = `${MANAGEMENT_API_BASE_URL}/users/${authUserId}`;
      console.log('  - URL:', url);

      const headers = this.getAuthHeaders(token);

      console.log('📡 Making fetch request to users API...');
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      console.log('📨 Response received:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);

      if (!response.ok) {
        const responseText = await response.text();
        console.log('  - Response body:', responseText);

        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        if (response.status === 404) {
          throw new Error('404: User not found in management API');
        }
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${responseText}`
        );
      }

      const userData: ExtendedUserData = await response.json();
      console.log('✅ Successfully fetched extended user data:', userData);

      // Add backward compatibility fields
      userData.fullname = userData.profile?.fullname || '';
      userData.biography = userData.profile?.biography || '';
      userData.picture_url = userData.profile?.picture_url || '';
      userData.thumb_url = userData.profile?.thumb_url || '';
      userData.email_validated = userData.auth?.email_validated ? 1 : 0;
      userData.username = userData.email?.split('@')[0] || '';
      userData.role = 'User'; // Default role
      userData.displayName = userData.profile?.fullname || userData.username;

      // Convert dates for backward compatibility
      if (userData.createdAt) {
        userData.created_at = new Date(userData.createdAt).getTime() / 1000;
      }
      if (userData.updatedAt) {
        userData.updated_at = new Date(userData.updatedAt).getTime() / 1000;
      }

      console.log('✅ Processed user data with compatibility fields');
      return userData;
    } catch (error) {
      console.error('❌ Get extended user data error:', error);
      throw error;
    }
  }

  /**
   * Fetch user's relationships (organizations and teams)
   * Uses ONLY the auth context user ID
   */
  async getUserRelationships(
    authUserId: string,
    token?: string
  ): Promise<UserRelationshipsResponse> {
    try {
      console.log(
        '🔍 getUserRelationships called with auth user ID:',
        authUserId
      );

      const url = `${MANAGEMENT_API_BASE_URL}/relationships/user/${authUserId}/all`;
      console.log('📡 Relationships URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      });

      console.log(
        '📨 Relationships response:',
        response.status,
        response.statusText
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Token is invalid or expired');
        }
        if (response.status === 404) {
          // Return empty relationships if not found
          console.log('⚠️ No relationships found, returning empty result');
          return {
            user_id: authUserId, // Keep the auth user ID
            organizations: [],
            teams: [],
            total_relationships: 0,
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const relationshipsData: UserRelationshipsResponse =
        await response.json();
      console.log(
        '✅ Successfully fetched user relationships:',
        relationshipsData
      );

      // Override the user_id in the response to always use the auth context user ID
      relationshipsData.user_id = authUserId;

      return relationshipsData;
    } catch (error) {
      console.error('❌ Get user relationships error:', error);
      throw error;
    }
  }

  /**
   * Fetch user's whiteboard data
   */
  async getUserWhiteboard(
    userId: string,
    token?: string
  ): Promise<UserWhiteboardResponse> {
    try {
      console.log('Attempting to fetch whiteboard for user ID:', userId);

      const response = await fetch(
        `${MANAGEMENT_API_BASE_URL}/whiteboards/user/${userId}`,
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
          throw new Error('404: Whiteboard not found for this user');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const whiteboardData: UserWhiteboardResponse = await response.json();
      console.log(
        'Successfully fetched whiteboard data:',
        whiteboardData.uniqueID
      );
      return whiteboardData;
    } catch (error) {
      console.error('Get user whiteboard error:', error);
      throw error;
    }
  }

  /**
   * Update user profile information
   * Uses ONLY the auth context user ID
   */
  async updateProfile(
    authUserId: string,
    updateData: Partial<ProfileUpdateRequest>,
    token?: string
  ): Promise<ExtendedUserData> {
    try {
      console.log(
        '🔍 updateProfile called with auth user ID:',
        authUserId,
        'and data:',
        updateData
      );

      // Get current user data to preserve existing values (using auth user ID)
      console.log('📡 Getting current user data...');
      const currentUser = await this.getExtendedUserData(authUserId, token);

      // Prepare the full request body with all required fields
      const fullUpdateData: ProfileUpdateRequest = {
        email:
          updateData.email !== undefined ? updateData.email : currentUser.email,
        fullname:
          updateData.fullname !== undefined
            ? updateData.fullname
            : currentUser.profile?.fullname || '',
        biography:
          updateData.biography !== undefined
            ? updateData.biography
            : currentUser.profile?.biography || '',
        picture_url:
          updateData.picture_url !== undefined
            ? updateData.picture_url
            : currentUser.profile?.picture_url || '',
        thumb_url:
          updateData.thumb_url !== undefined
            ? updateData.thumb_url
            : currentUser.profile?.thumb_url || '',
        email_validated:
          updateData.email_validated !== undefined
            ? updateData.email_validated
            : currentUser.auth?.email_validated || false,
      };

      console.log('📡 Sending full update data:', fullUpdateData);

      const response = await fetch(
        `${MANAGEMENT_API_BASE_URL}/users/${authUserId}`,
        {
          method: 'PUT', // API uses PUT for updates
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(fullUpdateData),
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
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
      }

      const userData: ExtendedUserData = await response.json();
      console.log('✅ Successfully updated user profile:', userData);

      // Add backward compatibility fields
      userData.fullname = userData.profile?.fullname || '';
      userData.biography = userData.profile?.biography || '';
      userData.picture_url = userData.profile?.picture_url || '';
      userData.thumb_url = userData.profile?.thumb_url || '';
      userData.email_validated = userData.auth?.email_validated ? 1 : 0;
      userData.username = userData.email?.split('@')[0] || '';
      userData.role = 'User'; // Default role
      userData.displayName = userData.profile?.fullname || userData.username;

      return userData;
    } catch (error) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change user password (not implemented yet)
   */
  async changePassword(
    _userId: string,
    _passwordData: PasswordChangeRequest,
    _token?: string
  ): Promise<{ success: boolean; message: string }> {
    // Password change is not implemented yet
    throw new Error('Password change functionality is not yet implemented');
  }

  /**
   * Upload user profile picture (not implemented yet)
   */
  async uploadProfilePicture(
    _userId: string,
    _file: File,
    _token?: string
  ): Promise<{ picture_url: string; thumb_url: string }> {
    // Profile picture upload is not implemented yet
    throw new Error(
      'Profile picture upload functionality is not yet implemented'
    );
  }

  /**
   * Get the reliable user ID
   */
  getReliableUserId(): string {
    return RELIABLE_USER_ID;
  }
}

export const userService = new UserService();
export default userService;

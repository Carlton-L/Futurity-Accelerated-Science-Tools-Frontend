// services/relationshipService.ts

const API_BASE_URL = 'https://fast.futurity.science/management/relationships';

// Type definitions for the new API responses
export interface Organization {
  _id: string;
  uniqueID: string;
  ent_name: string;
  ent_fsid: string;
  metadata: Record<string, any>;
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
  metadata: Record<string, any>;
  status: string;
  createdAt: string;
  updatedAt: string;
  user_relationships: string[];
}

export interface UserOrganizationsResponse {
  user_id: string;
  organizations: Organization[];
}

export interface UserTeamsResponse {
  user_id: string;
  teams: Team[];
}

export interface UserRelationshipsResponse {
  user_id: string;
  organizations: Organization[];
  teams: Team[];
  total_relationships: number;
}

export interface OrganizationUser {
  _id: string;
  uniqueID: string;
  email: string;
  profile: {
    fullname: string;
    biography: string;
    picture_url: string;
    thumb_url: string;
  };
  permissions: Record<string, any>;
  auth: {
    auth_key: string;
    password_hash: string;
    password_reset_token: string | null;
    verification_token: string;
    email_validated: boolean;
  };
  workspace: any;
  teamspaces: any[];
  whiteboard: any;
  status: string;
  createdAt: string;
  updatedAt: string;
  organization_relationships: string[];
}

export interface TeamUser {
  _id: string;
  uniqueID: string;
  email: string;
  profile: {
    fullname: string;
    biography: string;
    picture_url: string;
    thumb_url: string;
  };
  permissions: Record<string, any>;
  auth: {
    auth_key: string;
    password_hash: string;
    password_reset_token: string | null;
    verification_token: string;
    email_validated: boolean;
  };
  workspace: any;
  teamspaces: any[];
  whiteboard: any;
  status: string;
  createdAt: string;
  updatedAt: string;
  team_relationships: string[];
}

export interface OrganizationUsersResponse {
  organization_id: string;
  users: OrganizationUser[];
  total_users: number;
  admin_count: number;
  member_count: number;
}

export interface TeamUsersResponse {
  team_id: string;
  users: TeamUser[];
  total_users: number;
  admin_count: number;
  editor_count: number;
  viewer_count: number;
}

export interface RoleAssignmentRequest {
  user_id: string;
  entity_id: string;
}

export interface RoleAssignmentResponse {
  success: boolean;
  message: string;
}

class RelationshipService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  // Get user's organizations
  async getUserOrganizations(
    userId: string,
    token: string
  ): Promise<UserOrganizationsResponse> {
    const response = await fetch(
      `${API_BASE_URL}/user/${userId}/organizations`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user organizations: ${response.status}`);
    }

    return response.json();
  }

  // Get user's teams
  async getUserTeams(
    userId: string,
    token: string
  ): Promise<UserTeamsResponse> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/teams`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user teams: ${response.status}`);
    }

    return response.json();
  }

  // Get all user relationships (organizations and teams)
  async getUserRelationships(
    userId: string,
    token: string
  ): Promise<UserRelationshipsResponse> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/all`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user relationships: ${response.status}`);
    }

    return response.json();
  }

  // Get organization users
  async getOrganizationUsers(
    orgId: string,
    token: string
  ): Promise<OrganizationUsersResponse> {
    const response = await fetch(
      `${API_BASE_URL}/organization/${orgId}/users`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch organization users: ${response.status}`);
    }

    return response.json();
  }

  // Get team users
  async getTeamUsers(
    teamId: string,
    token: string
  ): Promise<TeamUsersResponse> {
    const response = await fetch(`${API_BASE_URL}/team/${teamId}/users`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch team users: ${response.status}`);
    }

    return response.json();
  }

  // Organization role assignment methods
  async assignOrgAdmin(
    request: RoleAssignmentRequest,
    token: string
  ): Promise<RoleAssignmentResponse> {
    const response = await fetch(`${API_BASE_URL}/assign-admin`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign org admin: ${response.status}`);
    }

    return response.json();
  }

  async assignOrgMember(
    request: RoleAssignmentRequest,
    token: string
  ): Promise<RoleAssignmentResponse> {
    const response = await fetch(`${API_BASE_URL}/assign-member`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign org member: ${response.status}`);
    }

    return response.json();
  }

  async removeOrgAdmin(
    request: RoleAssignmentRequest,
    token: string
  ): Promise<RoleAssignmentResponse> {
    const response = await fetch(`${API_BASE_URL}/remove-admin`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove org admin: ${response.status}`);
    }

    return response.json();
  }

  async removeOrgMember(
    request: RoleAssignmentRequest,
    token: string
  ): Promise<RoleAssignmentResponse> {
    const response = await fetch(`${API_BASE_URL}/remove-member`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove org member: ${response.status}`);
    }

    return response.json();
  }

  // Team role assignment methods
  async assignTeamAdmin(
    request: RoleAssignmentRequest,
    token: string
  ): Promise<RoleAssignmentResponse> {
    const response = await fetch(`${API_BASE_URL}/assign-team-admin`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign team admin: ${response.status}`);
    }

    return response.json();
  }

  async assignTeamEditor(
    request: RoleAssignmentRequest,
    token: string
  ): Promise<RoleAssignmentResponse> {
    const response = await fetch(`${API_BASE_URL}/assign-editor`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign team editor: ${response.status}`);
    }

    return response.json();
  }

  async assignTeamViewer(
    request: RoleAssignmentRequest,
    token: string
  ): Promise<RoleAssignmentResponse> {
    const response = await fetch(`${API_BASE_URL}/assign-viewer`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign team viewer: ${response.status}`);
    }

    return response.json();
  }

  async removeTeamAdmin(
    request: RoleAssignmentRequest,
    token: string
  ): Promise<RoleAssignmentResponse> {
    const response = await fetch(`${API_BASE_URL}/remove-team-admin`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove team admin: ${response.status}`);
    }

    return response.json();
  }

  async removeTeamEditor(
    request: RoleAssignmentRequest,
    token: string
  ): Promise<RoleAssignmentResponse> {
    const response = await fetch(`${API_BASE_URL}/remove-editor`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove team editor: ${response.status}`);
    }

    return response.json();
  }

  async removeTeamViewer(
    request: RoleAssignmentRequest,
    token: string
  ): Promise<RoleAssignmentResponse> {
    const response = await fetch(`${API_BASE_URL}/remove-viewer`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove team viewer: ${response.status}`);
    }

    return response.json();
  }
}

export const relationshipService = new RelationshipService();

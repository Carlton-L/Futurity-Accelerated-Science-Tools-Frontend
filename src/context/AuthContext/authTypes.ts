// AuthContext/authTypes.ts

export type User = {
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
  // Extended fields from management API
  last_login?: number;
  preferences?: Record<string, any>;
  permissions?: string[];
};

// New relationship types
export type UserOrganization = {
  _id: string;
  uniqueID: string;
  ent_name: string;
  ent_fsid: string;
  metadata: Record<string, any>;
  status: string;
  createdAt: string;
  updatedAt: string;
  user_relationships: string[];
};

export type UserTeam = {
  _id: string;
  uniqueID: string;
  ent_name: string;
  ent_fsid: string;
  metadata: Record<string, any>;
  status: string;
  createdAt: string;
  updatedAt: string;
  user_relationships: string[];
};

export type UserRelationships = {
  organizations: UserOrganization[];
  teams: UserTeam[];
};

export type WorkspaceMember = {
  user_id: string;
  role: 'owner' | 'admin';
};

export type WorkspaceMemberDetail = {
  user_id: string;
  role: 'owner' | 'admin';
  user: User;
};

export type TeamspaceMember = {
  user_id: string;
  role: 'owner' | 'admin' | 'viewer';
};

export type TeamspaceMemberDetail = {
  user_id: string;
  role: 'owner' | 'admin' | 'viewer';
  user: User;
};

export type TeamspaceListItem = {
  _id: string;
  owner_guid: string;
  workspace_id: string;
  name: string;
  created_at: number;
  updated_at: number;
  members: TeamspaceMember[];
  user_access_level: 'owner' | 'admin' | 'viewer';
};

export type Teamspace = {
  _id: string;
  owner_guid: string;
  workspace_id: string;
  name: string;
  created_at: number;
  updated_at: number;
  members: TeamspaceMember[];
  member_details: TeamspaceMemberDetail[];
  user_access_level: 'owner' | 'admin' | 'viewer';
};

export type WorkspaceListItem = {
  _id: string;
  plan: string;
  owner_guid: string;
  name: string;
  created_at: number;
  updated_at: number;
  members: WorkspaceMember[];
  user_access_level: 'owner' | 'admin';
};

export type Workspace = {
  _id: string;
  plan: string;
  owner_guid: string;
  name: string;
  created_at: number;
  updated_at: number;
  members: WorkspaceMember[];
  member_details: WorkspaceMemberDetail[];
  teamspaces_details: TeamspaceListItem[];
  user_access_level: 'owner' | 'admin';
};

export type Lab = {
  _id: string;
  ent_name: string;
  ent_summary: string | null;
  teamspace_id: string;
  isArchived: number;
  isDeleted: number;
  deletedAt: string | null;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  errors: string[];
};

// Extended user data type from management API
export type ExtendedUserData = {
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
  // Additional fields that might come from the management API
  last_login?: number;
  preferences?: Record<string, any>;
  permissions?: string[];
};

export type AuthContextType = {
  user: User | null;
  extendedUser: ExtendedUserData | null;
  token: string | null;
  workspace: Workspace | null;
  currentTeamspace: TeamspaceListItem | null;
  teamspaces: TeamspaceListItem[];
  // New relationship data
  userRelationships: UserRelationships | null;
  currentTeam: UserTeam | null;
  currentOrganization: UserOrganization | null;
  // Whiteboard data - just the uniqueID
  whiteboardId: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  setCurrentTeamspace: (teamspace: TeamspaceListItem | null) => void;
  setCurrentTeam: (team: UserTeam | null) => void;
  refreshWorkspace: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshWhiteboard: () => Promise<void>;
  // Helper methods for checking permissions
  isOrgAdmin: () => boolean;
  isTeamAdmin: (teamId?: string) => boolean;
  isTeamEditor: (teamId?: string) => boolean;
  isTeamViewer: (teamId?: string) => boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
};

// AuthContext/AuthProvider.tsx

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import AuthContext from './AuthContext';
import type {
  AuthContextType,
  User,
  LoginRequest,
  Workspace,
  TeamspaceListItem,
  UserRelationships,
  UserTeam,
  UserOrganization,
} from './authTypes';
import { authService } from './authService';
import { workspaceService } from '../../services/workspaceService';
import { userService, type ExtendedUserData } from '../../services/userService';
import { relationshipService } from '../../services/relationshipService';

// Constants for localStorage keys
const CURRENT_TEAM_STORAGE_KEY = 'futurity_current_team';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [extendedUser, setExtendedUser] = useState<ExtendedUserData | null>(
    null
  );
  const [token, setToken] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [teamspaces, setTeamspaces] = useState<TeamspaceListItem[]>([]);
  const [currentTeamspace, setCurrentTeamspace] =
    useState<TeamspaceListItem | null>(null);

  // New relationship states
  const [userRelationships, setUserRelationships] =
    useState<UserRelationships | null>(null);
  const [currentTeam, setCurrentTeamState] = useState<UserTeam | null>(null);
  const [currentOrganization, setCurrentOrganization] =
    useState<UserOrganization | null>(null);

  // Whiteboard state - just the uniqueID
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Team persistence functions
  const saveCurrentTeamToStorage = (team: UserTeam | null) => {
    try {
      if (team) {
        localStorage.setItem(
          CURRENT_TEAM_STORAGE_KEY,
          JSON.stringify({
            _id: team._id,
            uniqueID: team.uniqueID,
            ent_name: team.ent_name,
            ent_fsid: team.ent_fsid,
            metadata: team.metadata,
            status: team.status,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
            user_relationships: team.user_relationships,
          })
        );
        console.log('Saved current team to localStorage:', team.ent_name);
      } else {
        localStorage.removeItem(CURRENT_TEAM_STORAGE_KEY);
        console.log('Removed current team from localStorage');
      }
    } catch (error) {
      console.error('Failed to save current team to localStorage:', error);
    }
  };

  const loadCurrentTeamFromStorage = (): UserTeam | null => {
    try {
      const storedTeam = localStorage.getItem(CURRENT_TEAM_STORAGE_KEY);
      if (storedTeam) {
        const parsed = JSON.parse(storedTeam);
        console.log('Loaded team from localStorage:', parsed.ent_name);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load current team from localStorage:', error);
    }
    return null;
  };

  // Enhanced setCurrentTeam function with persistence
  const setCurrentTeam = (team: UserTeam | null) => {
    console.log('Setting current team:', team?.ent_name || 'null');
    setCurrentTeamState(team);
    saveCurrentTeamToStorage(team);
  };

  // Load extended user data after basic auth
  const loadExtendedUserData = async (basicUser: User, userToken: string) => {
    try {
      console.log('Loading extended user data for user ID:', basicUser._id);
      const extendedData = await userService.getExtendedUserData(
        basicUser._id,
        userToken
      );
      setExtendedUser(extendedData);

      // Merge extended data with basic user data
      const mergedUser: User = {
        ...basicUser,
        ...extendedData,
        // Preserve the auth-specific fields from the basic user
        auth_key: basicUser.auth_key,
      };
      setUser(mergedUser);

      console.log('Extended user data loaded successfully');
    } catch (error) {
      console.error('Failed to load extended user data:', error);
      // Keep the basic user data if extended fetch fails
      console.log(
        'Using basic user data only due to extended data fetch failure'
      );
    }
  };

  // Load whiteboard data after user is authenticated
  const loadWhiteboardData = async (basicUser: User, userToken: string) => {
    try {
      console.log('Loading whiteboard data for user ID:', basicUser._id);

      const whiteboardData = await userService.getUserWhiteboard(
        basicUser._id,
        userToken
      );

      setWhiteboardId(whiteboardData.uniqueID);

      console.log(
        'Whiteboard data loaded successfully:',
        whiteboardData.uniqueID
      );
    } catch (error) {
      console.error('Failed to load whiteboard data:', error);

      // If whiteboard doesn't exist (404), we could optionally create one
      if (error instanceof Error && error.message.includes('not found')) {
        console.log(
          'No whiteboard found for user, this is normal for new users'
        );
      }

      // Don't throw here, just log the error
      // User can still use the app without whiteboard data
      setWhiteboardId(null);
    }
  };

  // Load relationship data after user is authenticated
  const loadRelationshipData = async (basicUser: User, userToken: string) => {
    try {
      console.log('Loading relationship data for user ID:', basicUser._id);

      // Get user's organizations and teams
      const relationships = await relationshipService.getUserRelationships(
        basicUser._id,
        userToken
      );

      setUserRelationships({
        organizations: relationships.organizations,
        teams: relationships.teams,
      });

      // Set current organization (use first if available)
      if (relationships.organizations.length > 0) {
        setCurrentOrganization(relationships.organizations[0]);
      }

      // Handle team selection with persistence
      await handleTeamSelection(relationships.teams);

      console.log('Relationship data loaded successfully');
    } catch (error) {
      console.error('Failed to load relationship data:', error);
      // Don't throw here, just log the error
      setUserRelationships(null);
      setCurrentTeam(null);
      setCurrentOrganization(null);
    }
  };

  // Handle team selection with persistence logic
  const handleTeamSelection = async (availableTeams: UserTeam[]) => {
    if (availableTeams.length === 0) {
      console.log('No teams available for user');
      setCurrentTeam(null);
      return;
    }

    // Try to restore team from localStorage
    const storedTeam = loadCurrentTeamFromStorage();

    if (storedTeam) {
      // Verify that the stored team is still valid (user still has access)
      const isValidTeam = availableTeams.some(
        (team) => team.uniqueID === storedTeam.uniqueID
      );

      if (isValidTeam) {
        // Find the full team object with current data
        const currentTeamData = availableTeams.find(
          (team) => team.uniqueID === storedTeam.uniqueID
        );
        console.log(
          'Restored valid team from storage:',
          currentTeamData?.ent_name
        );
        setCurrentTeamState(currentTeamData || null);
        // Update storage with fresh data
        if (currentTeamData) {
          saveCurrentTeamToStorage(currentTeamData);
        }
      } else {
        // Stored team is no longer valid, clear it and set first available team
        console.log(
          'Stored team is no longer accessible, using first available team'
        );
        localStorage.removeItem(CURRENT_TEAM_STORAGE_KEY);
        const firstTeam = availableTeams[0];
        setCurrentTeam(firstTeam);
      }
    } else {
      // No stored team, set first available team
      console.log('No stored team, using first available team');
      const firstTeam = availableTeams[0];
      setCurrentTeam(firstTeam);
    }
  };

  // Load workspace data after user is authenticated
  const loadWorkspaceData = async (userToken: string) => {
    try {
      // Get user's workspace list from the API
      const userWorkspaces = await userService.getUserWorkspaces(userToken);

      if (userWorkspaces.length > 0) {
        // Use the first workspace the user has access to
        const firstWorkspaceItem = userWorkspaces[0];

        // Now fetch the full workspace details with teamspaces
        const fullWorkspaceData = await workspaceService.getWorkspace(
          firstWorkspaceItem._id,
          userToken
        );
        setWorkspace(fullWorkspaceData);

        // Set teamspaces from workspace data
        const userTeamspaces = fullWorkspaceData.teamspaces_details || [];
        setTeamspaces(userTeamspaces);

        // Set current teamspace to first available if any
        if (userTeamspaces.length > 0) {
          setCurrentTeamspace(userTeamspaces[0]);
        }
      } else {
        console.warn('User has no workspaces available');
        setWorkspace(null);
        setTeamspaces([]);
        setCurrentTeamspace(null);
      }
    } catch (error) {
      console.error('Failed to load workspace data:', error);
      // Don't throw here, just log the error
      // User can still use the app without workspace data
      setWorkspace(null);
      setTeamspaces([]);
      setCurrentTeamspace(null);
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.hasStoredToken()) {
        try {
          // Get the stored token first
          const storedToken = authService.getStoredToken();
          if (storedToken) {
            setToken(storedToken);

            // Try to verify the token and get basic user data
            const userData = await authService.verifyToken(storedToken);
            setUser(userData);

            // Update token if the API returned a new one
            const finalToken = userData.auth_key || storedToken;
            if (userData.auth_key && userData.auth_key !== storedToken) {
              setToken(userData.auth_key);
              authService.setStoredToken(userData.auth_key);
            }

            // Load extended user data (will use reliable ID if needed)
            await loadExtendedUserData(userData, finalToken);

            // Load whiteboard data
            await loadWhiteboardData(userData, finalToken);

            // Load relationship data (includes team persistence logic)
            await loadRelationshipData(userData, finalToken);

            // Load workspace data
            await loadWorkspaceData(finalToken);
          }
        } catch (error) {
          console.error('Failed to verify stored token:', error);

          // Only clear token if it's definitely invalid (401/403)
          // For network errors, keep the token and let the user try again
          if (error instanceof Error && error.message.includes('401')) {
            console.log('Token is invalid, clearing auth state');
            await authService.logout();
            setUser(null);
            setExtendedUser(null);
            setToken(null);
            setWorkspace(null);
            setTeamspaces([]);
            setCurrentTeamspace(null);
            setUserRelationships(null);
            setCurrentTeam(null);
            setCurrentOrganization(null);
            setWhiteboardId(null);
          } else {
            // Network error or other issue - keep the stored token
            // but don't set user data (they'll need to retry)
            const storedToken = authService.getStoredToken();
            if (storedToken) {
              setToken(storedToken);
              console.log(
                'Keeping stored token due to network error, user can retry'
              );
            }
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    try {
      const { token: authToken, user: userData } = await authService.login(
        credentials
      );
      setUser(userData);
      setToken(authToken);

      // Load extended user data after successful login
      await loadExtendedUserData(userData, authToken);

      // Load whiteboard data after successful login
      await loadWhiteboardData(userData, authToken);

      // Load relationship data after successful login (includes team persistence)
      await loadRelationshipData(userData, authToken);

      // Load workspace data after successful login
      await loadWorkspaceData(authToken);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();

      // Clear stored team data
      localStorage.removeItem(CURRENT_TEAM_STORAGE_KEY);
      console.log('Cleared stored team data on logout');

      setUser(null);
      setExtendedUser(null);
      setToken(null);
      setWorkspace(null);
      setTeamspaces([]);
      setCurrentTeamspace(null);
      setUserRelationships(null);
      setCurrentTeamState(null);
      setCurrentOrganization(null);
      setWhiteboardId(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      localStorage.removeItem(CURRENT_TEAM_STORAGE_KEY);
      setUser(null);
      setExtendedUser(null);
      setToken(null);
      setWorkspace(null);
      setTeamspaces([]);
      setCurrentTeamspace(null);
      setUserRelationships(null);
      setCurrentTeamState(null);
      setCurrentOrganization(null);
      setWhiteboardId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWorkspace = async (): Promise<void> => {
    if (!user || !token || !workspace) {
      return;
    }

    try {
      await loadWorkspaceData(token);
    } catch (error) {
      console.error('Failed to refresh workspace data:', error);
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!user || !token) {
      return;
    }

    try {
      const userData = await authService.verifyToken(token);
      await loadExtendedUserData(userData, token);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  const refreshRelationships = async (): Promise<void> => {
    if (!user || !token) {
      return;
    }

    try {
      await loadRelationshipData(user, token);
    } catch (error) {
      console.error('Failed to refresh relationship data:', error);
      throw error;
    }
  };

  const refreshWhiteboard = async (): Promise<void> => {
    if (!user || !token) {
      return;
    }

    try {
      await loadWhiteboardData(user, token);
    } catch (error) {
      console.error('Failed to refresh whiteboard data:', error);
      throw error;
    }
  };

  const handleSetCurrentTeamspace = (teamspace: TeamspaceListItem | null) => {
    setCurrentTeamspace(teamspace);
  };

  // Helper methods for checking permissions
  const isOrgAdmin = (): boolean => {
    if (!currentOrganization) return false;
    return currentOrganization.user_relationships.includes('admin');
  };

  const isTeamAdmin = (teamId?: string): boolean => {
    const team = teamId
      ? userRelationships?.teams.find(
          (t) => t.uniqueID === teamId || t._id === teamId
        )
      : currentTeam;

    if (!team) return false;
    return team.user_relationships.includes('admin');
  };

  const isTeamEditor = (teamId?: string): boolean => {
    const team = teamId
      ? userRelationships?.teams.find(
          (t) => t.uniqueID === teamId || t._id === teamId
        )
      : currentTeam;

    if (!team) return false;
    return team.user_relationships.includes('editor');
  };

  const isTeamViewer = (teamId?: string): boolean => {
    const team = teamId
      ? userRelationships?.teams.find(
          (t) => t.uniqueID === teamId || t._id === teamId
        )
      : currentTeam;

    if (!team) return false;
    return team.user_relationships.includes('viewer');
  };

  const contextValue: AuthContextType = {
    user,
    token,
    workspace,
    currentTeamspace,
    teamspaces,
    userRelationships,
    currentTeam,
    currentOrganization,
    whiteboardId,
    login,
    logout,
    setCurrentTeamspace: handleSetCurrentTeamspace,
    setCurrentTeam, // This is the enhanced version with persistence
    refreshWorkspace,
    refreshUser,
    refreshRelationships,
    refreshWhiteboard,
    isOrgAdmin,
    isTeamAdmin,
    isTeamEditor,
    isTeamViewer,
    isLoading,
    isAuthenticated: !!user,
    extendedUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

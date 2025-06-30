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
  const [currentTeam, setCurrentTeam] = useState<UserTeam | null>(null);
  const [currentOrganization, setCurrentOrganization] =
    useState<UserOrganization | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

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

      // Set current team (use first if available)
      if (relationships.teams.length > 0) {
        setCurrentTeam(relationships.teams[0]);
      }

      console.log('Relationship data loaded successfully');
    } catch (error) {
      console.error('Failed to load relationship data:', error);
      // Don't throw here, just log the error
      setUserRelationships(null);
      setCurrentTeam(null);
      setCurrentOrganization(null);
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

            // Load relationship data
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

      // Load relationship data after successful login
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
      setUser(null);
      setExtendedUser(null);
      setToken(null);
      setWorkspace(null);
      setTeamspaces([]);
      setCurrentTeamspace(null);
      setUserRelationships(null);
      setCurrentTeam(null);
      setCurrentOrganization(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setExtendedUser(null);
      setToken(null);
      setWorkspace(null);
      setTeamspaces([]);
      setCurrentTeamspace(null);
      setUserRelationships(null);
      setCurrentTeam(null);
      setCurrentOrganization(null);
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

  const handleSetCurrentTeamspace = (teamspace: TeamspaceListItem | null) => {
    setCurrentTeamspace(teamspace);
  };

  const handleSetCurrentTeam = (team: UserTeam | null) => {
    setCurrentTeam(team);
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
    login,
    logout,
    setCurrentTeamspace: handleSetCurrentTeamspace,
    setCurrentTeam: handleSetCurrentTeam,
    refreshWorkspace,
    refreshUser,
    refreshRelationships,
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

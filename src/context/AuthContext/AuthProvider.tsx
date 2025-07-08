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
  Lab,
} from './authTypes';
import { authService } from './authService';
import { workspaceService } from '../../services/workspaceService';
import { userService, type ExtendedUserData } from '../../services/userService';
import { relationshipService } from '../../services/relationshipService';
import { labService } from '../../services/labService';

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
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  // New relationship states
  const [userRelationships, setUserRelationships] =
    useState<UserRelationships | null>(null);
  const [currentTeam, setCurrentTeamState] = useState<UserTeam | null>(null);
  const [currentOrganization, setCurrentOrganization] =
    useState<UserOrganization | null>(null);

  // Whiteboard state - just the uniqueID
  const [whiteboardId, setWhiteboardId] = useState<string | null>(null);

  // Lab states
  const [currentTeamLabs, setCurrentTeamLabs] = useState<Lab[]>([]);
  const [isLoadingLabs, setIsLoadingLabs] = useState<boolean>(false);

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

  // Load labs for current team
  const loadLabsForCurrentTeam = async (team: UserTeam, userToken: string) => {
    if (!team || !userToken) {
      setCurrentTeamLabs([]);
      return;
    }

    try {
      setIsLoadingLabs(true);
      console.log('Loading labs for team:', team.ent_name);

      const labs = await labService.getLabsForTeam(
        team.uniqueID,
        userToken,
        false // don't include archived labs
      );

      setCurrentTeamLabs(labs);
      console.log(`Loaded ${labs.length} labs for team:`, team.ent_name);
    } catch (error) {
      console.error('Failed to load labs for current team:', error);
      setCurrentTeamLabs([]);
    } finally {
      setIsLoadingLabs(false);
    }
  };

  // Enhanced setCurrentTeam function with persistence and lab loading
  const setCurrentTeam = async (team: UserTeam | null) => {
    console.log('Setting current team:', team?.ent_name || 'null');
    setCurrentTeamState(team);
    saveCurrentTeamToStorage(team);

    // Load labs for the new team
    if (team && token) {
      await loadLabsForCurrentTeam(team, token);
    } else {
      setCurrentTeamLabs([]);
    }
  };

  // Refresh labs function
  const refreshLabs = async (): Promise<void> => {
    if (!currentTeam || !token) {
      setCurrentTeamLabs([]);
      return;
    }

    try {
      await loadLabsForCurrentTeam(currentTeam, token);
    } catch (error) {
      console.error('Failed to refresh labs:', error);
      throw error;
    }
  };

  // OPTIMIZED: Load extended user data without blocking
  const loadExtendedUserData = async (basicUser: User, userToken: string) => {
    try {
      console.log('Loading extended user data for user ID:', basicUser._id);
      const extendedData = await userService.getExtendedUserData(
        basicUser._id,
        userToken
      );
      setExtendedUser(extendedData);

      // CRITICAL: Merge extended data with basic user data BUT NEVER overwrite the _id
      const mergedUser: User = {
        ...basicUser,
        ...extendedData,
        // ALWAYS preserve the original auth context user ID
        _id: basicUser._id,
        // Preserve other auth-specific fields from the basic user
        auth_key: basicUser.auth_key,
        guid: basicUser.guid,
      };
      setUser(mergedUser);

      console.log(
        'Extended user data loaded successfully, preserved original _id:',
        basicUser._id
      );
    } catch (error) {
      console.error('Failed to load extended user data:', error);
      // Keep the basic user data if extended fetch fails
      console.log(
        'Using basic user data only due to extended data fetch failure'
      );
    }
  };

  // OPTIMIZED: Load whiteboard data without blocking
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

  // OPTIMIZED: Load relationship data and return team info for labs loading
  const loadRelationshipData = async (
    basicUser: User,
    userToken: string
  ): Promise<UserTeam | null> => {
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

      // Handle team selection with persistence logic
      const selectedTeam = await handleTeamSelection(relationships.teams);

      console.log('Relationship data loaded successfully');
      return selectedTeam;
    } catch (error) {
      console.error('Failed to load relationship data:', error);
      // Don't throw here, just log the error
      setUserRelationships(null);
      setCurrentTeamState(null);
      setCurrentOrganization(null);
      setCurrentTeamLabs([]);
      return null;
    }
  };

  // OPTIMIZED: Handle team selection without async lab loading
  const handleTeamSelection = async (
    availableTeams: UserTeam[]
  ): Promise<UserTeam | null> => {
    if (availableTeams.length === 0) {
      console.log('No teams available for user');
      setCurrentTeamState(null);
      setCurrentTeamLabs([]);
      return null;
    }

    // Try to restore team from localStorage
    const storedTeam = loadCurrentTeamFromStorage();

    let selectedTeam: UserTeam;

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
        selectedTeam = currentTeamData!;
        setCurrentTeamState(selectedTeam);
        // Update storage with fresh data
        saveCurrentTeamToStorage(selectedTeam);
      } else {
        // Stored team is no longer valid, clear it and set first available team
        console.log(
          'Stored team is no longer accessible, using first available team'
        );
        localStorage.removeItem(CURRENT_TEAM_STORAGE_KEY);
        selectedTeam = availableTeams[0];
        setCurrentTeamState(selectedTeam);
        saveCurrentTeamToStorage(selectedTeam);
      }
    } else {
      // No stored team, set first available team
      console.log('No stored team, using first available team');
      selectedTeam = availableTeams[0];
      setCurrentTeamState(selectedTeam);
      saveCurrentTeamToStorage(selectedTeam);
    }

    return selectedTeam;
  };

  // OPTIMIZED: Load workspace data without blocking
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

  // OPTIMIZED: Initialize auth with strategic parallelization
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoadingUser(true);

      if (authService.hasStoredToken()) {
        try {
          // STEP 1: Get the stored token and verify user (CRITICAL PATH)
          const storedToken = authService.getStoredToken();
          if (storedToken) {
            setToken(storedToken);

            console.log('🚀 Starting critical path: user verification');
            const userData = await authService.verifyToken(storedToken);
            setUser(userData);
            setIsLoadingUser(false); // ✅ User can now see UI

            // Update token if the API returned a new one
            const finalToken = userData.auth_key || storedToken;
            if (userData.auth_key && userData.auth_key !== storedToken) {
              setToken(userData.auth_key);
              authService.setStoredToken(userData.auth_key);
            }

            console.log('✅ Critical path complete, starting parallel loading');

            // STEP 2: Load relationships first (needed for team-dependent data)
            const selectedTeam = await loadRelationshipData(
              userData,
              finalToken
            );

            // STEP 3: Start parallel operations for non-blocking data
            const parallelOperations = [
              loadExtendedUserData(userData, finalToken),
              loadWhiteboardData(userData, finalToken),
              loadWorkspaceData(finalToken),
              // Only load labs if we have a selected team
              selectedTeam
                ? loadLabsForCurrentTeam(selectedTeam, finalToken)
                : Promise.resolve(),
            ];

            // Wait for all parallel operations (don't block UI)
            await Promise.allSettled(parallelOperations);
            console.log('✅ All parallel operations completed');
          }
        } catch (error) {
          console.error('Failed to verify stored token:', error);
          setIsLoadingUser(false);

          // Only clear token if it's definitely invalid (401/403)
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
            setCurrentTeamState(null);
            setCurrentOrganization(null);
            setWhiteboardId(null);
            setCurrentTeamLabs([]);
          } else {
            // Network error or other issue - keep the stored token
            const storedToken = authService.getStoredToken();
            if (storedToken) {
              setToken(storedToken);
              console.log(
                'Keeping stored token due to network error, user can retry'
              );
            }
          }
        }
      } else {
        setIsLoadingUser(false);
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // OPTIMIZED: Login with strategic parallelization
  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setIsLoadingUser(true);

    try {
      console.log('🚀 Starting login critical path');
      const { token: authToken, user: userData } = await authService.login(
        credentials
      );
      setUser(userData);
      setToken(authToken);
      setIsLoadingUser(false); // ✅ User can now see UI

      console.log('✅ Login critical path complete, starting parallel loading');

      // Load relationships first (needed for team-dependent data)
      const selectedTeam = await loadRelationshipData(userData, authToken);

      // Start parallel operations for non-blocking data
      const parallelOperations = [
        loadExtendedUserData(userData, authToken),
        loadWhiteboardData(userData, authToken),
        loadWorkspaceData(authToken),
        // Only load labs if we have a selected team
        selectedTeam
          ? loadLabsForCurrentTeam(selectedTeam, authToken)
          : Promise.resolve(),
      ];

      // Wait for all parallel operations
      await Promise.allSettled(parallelOperations);
      console.log('✅ All login parallel operations completed');
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoadingUser(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setIsLoadingUser(true);

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
      setCurrentTeamLabs([]);
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
      setCurrentTeamLabs([]);
    } finally {
      setIsLoading(false);
      setIsLoadingUser(false);
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
    currentTeamLabs,
    isLoadingLabs,
    login,
    logout,
    setCurrentTeamspace: handleSetCurrentTeamspace,
    setCurrentTeam,
    refreshWorkspace,
    refreshUser,
    refreshRelationships,
    refreshWhiteboard,
    refreshLabs,
    isOrgAdmin,
    isTeamAdmin,
    isTeamEditor,
    isTeamViewer,
    isLoading,
    isLoadingUser,
    isAuthenticated: !!user,
    extendedUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

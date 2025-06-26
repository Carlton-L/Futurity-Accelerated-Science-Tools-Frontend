import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import AuthContext from './AuthContext';
import type {
  AuthContextType,
  User,
  LoginRequest,
  Workspace,
  TeamspaceListItem,
} from './authTypes';
import { authService } from './authService';
import { workspaceService } from '../../services/workspaceService';
import { userService } from '../../services/userService';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [teamspaces, setTeamspaces] = useState<TeamspaceListItem[]>([]);
  const [currentTeamspace, setCurrentTeamspace] =
    useState<TeamspaceListItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

            // Try to verify the token
            const userData = await authService.verifyToken(storedToken);
            setUser(userData);

            // Update token if the API returned a new one
            if (userData.auth_key && userData.auth_key !== storedToken) {
              setToken(userData.auth_key);
              authService.setStoredToken(userData.auth_key);
            }

            // Load workspace data
            await loadWorkspaceData(userData.auth_key || storedToken);
          }
        } catch (error) {
          console.error('Failed to verify stored token:', error);

          // Only clear token if it's definitely invalid (401/403)
          // For network errors, keep the token and let the user try again
          if (error instanceof Error && error.message.includes('401')) {
            console.log('Token is invalid, clearing auth state');
            await authService.logout();
            setUser(null);
            setToken(null);
            setWorkspace(null);
            setTeamspaces([]);
            setCurrentTeamspace(null);
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
      setToken(null);
      setWorkspace(null);
      setTeamspaces([]);
      setCurrentTeamspace(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setToken(null);
      setWorkspace(null);
      setTeamspaces([]);
      setCurrentTeamspace(null);
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

  const handleSetCurrentTeamspace = (teamspace: TeamspaceListItem | null) => {
    setCurrentTeamspace(teamspace);
  };

  const contextValue: AuthContextType = {
    user,
    token,
    workspace,
    currentTeamspace,
    teamspaces,
    login,
    logout,
    setCurrentTeamspace: handleSetCurrentTeamspace,
    refreshWorkspace,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

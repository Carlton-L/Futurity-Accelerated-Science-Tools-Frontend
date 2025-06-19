import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import AuthContext from './AuthContext';
import type { AuthContextType, User, LoginRequest } from './authTypes';
import { authService } from './authService';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.hasStoredToken()) {
        try {
          const userData = await authService.verifyToken();
          setUser(userData);
          setToken(userData.auth_key);
        } catch (error) {
          console.error('Failed to verify stored token:', error);
          // Token is invalid, clear it
          await authService.logout();
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
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

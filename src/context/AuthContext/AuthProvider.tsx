import { useState } from 'react';
import type { ReactNode } from 'react';
import AuthContext from './AuthContext';
import type { AuthContextType, User } from './authTypes';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => setUser(userData);
  const logout = () => setUser(null);

  const contextValue: AuthContextType = { user, login, logout };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

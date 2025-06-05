import { createContext } from 'react';
import type { AuthContextType } from './authTypes';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;

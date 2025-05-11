import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, AuthState, UserRole } from '../types';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (roles: UserRole[]) => boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

// Mockup users for development
const USERS: User[] = [
  {
    username: 'admin',
    password: '123',
    role: 'admin',
  },
  {
    username: 'head',
    password: '123',
    role: 'head',
  },
  {
    username: 'boss',
    password: '123',
    role: 'boss',
  },
];

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: () => false,
  logout: () => {},
  hasPermission: () => false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  const login = (username: string, password: string): boolean => {
    const user = USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      setAuthState({
        user,
        isAuthenticated: true,
      });
      return true;
    }

    return false;
  };

  const logout = () => {
    setAuthState(initialState);
  };

  const hasPermission = (roles: UserRole[]): boolean => {
    if (!authState.isAuthenticated || !authState.user) {
      return false;
    }
    return roles.includes(authState.user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { AuthState, UserRole } from '../types';

const BASE = import.meta.env.VITE_BASE;

interface AuthContextType extends AuthState {
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; role?: UserRole }>;
  logout: () => void;
  hasPermission: (roles: UserRole[]) => boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  token: null,
  login: () => Promise.resolve({ success: false }),
  logout: () => {},
  hasPermission: () => false,
});

interface JwtPayload {
  id: number;
  username: string;
  role: UserRole;
  exp: number; // Add expiration time to the payload interface
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const [token, setToken] = useState<string | null>(() => {
    // Initialize token from localStorage
    return localStorage.getItem('authToken');
  });
  const navigate = useNavigate();

  // Check token expiration
  const checkTokenExpiration = (token: string): boolean => {
    try {
      const decoded: JwtPayload = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp > currentTime;
    } catch {
      return false;
    }
  };

  // Restore auth state from token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        if (!checkTokenExpiration(storedToken)) {
          // Token is expired, clear it
          localStorage.removeItem('authToken');
          setToken(null);
          setAuthState(initialState);
          navigate('/login');
          return;
        }

        const decoded: JwtPayload = jwtDecode(storedToken);
        setAuthState({
          user: { username: decoded.username, role: decoded.role },
          isAuthenticated: true,
        });
        setToken(storedToken);
      } catch {
        // If token is invalid, clear it
        localStorage.removeItem('authToken');
        setToken(null);
        setAuthState(initialState);
        navigate('/login');
      }
    }
  }, [navigate]);

  // Set up token expiration check interval
  useEffect(() => {
    if (token) {
      const checkInterval = setInterval(() => {
        if (!checkTokenExpiration(token)) {
          // Token is expired, logout
          logout();
        }
      }, 60000); // Check every minute

      return () => clearInterval(checkInterval);
    }
  }, [token]);

  const login = async (username: string, password: string): Promise<{ success: boolean; role?: UserRole }> => {
    try {
      const response = await fetch(`${BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        const decoded: JwtPayload = jwtDecode(data.token);
        setAuthState({
          user: { username: decoded.username, role: decoded.role },
          isAuthenticated: true,
        });
        setToken(data.token);
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        return { success: true, role: decoded.role };
      } else {
        throw new Error(data.message || 'Invalid credentials');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'An error occurred during login');
    }
  };

  const logout = () => {
    setAuthState(initialState);
    setToken(null);
    // Remove token from localStorage
    localStorage.removeItem('authToken');
    navigate('/login');
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
        token,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
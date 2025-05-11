export type UserRole = 'admin' | 'head' | 'boss';

export interface User {
  username: string;
  role: UserRole;
  password?: string; // Optional to avoid requiring password in AuthContext
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface ClientInfo {
  id?: number; // Matches backend's numeric ID
  name: string;
  date: string;
  serviceType: string;
  duration: string;
  notes: string;
  createdBy: string;
  isVerified: boolean;
}
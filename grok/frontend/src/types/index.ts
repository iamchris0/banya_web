export type UserRole = 'admin' | 'head' | 'boss';

export interface User {
  username: string;
  password: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface ClientInfo {
  id?: string;
  name: string;
  date: string;
  services: string[];
  notes: string;
  createdBy: string;
  isVerified: boolean;
}
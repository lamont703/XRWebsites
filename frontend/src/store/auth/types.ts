import { ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  walletId?: string;
  rating?: number;
  jobsPosted?: number;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: User) => void;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  username: string;
} 
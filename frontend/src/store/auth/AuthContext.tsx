import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface User {
  id: string;
  name: string;
  email: string;
  walletId?: string;
  rating?: number;
  jobsPosted?: number;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  username: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadUserData = async () => {
    console.log('🔄 Starting loadUserData...');
    try {
      const token = localStorage.getItem('accessToken');
      console.log('📝 Current token:', token);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      console.log('📡 Dashboard API response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Dashboard API error:', response.status);
        throw new Error('Failed to load user data');
      }

      const { data } = await response.json();
      console.log('👤 Received user data:', data.user.id);

      // Load wallet data
      const walletResponse = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('💰 Wallet API response status:', walletResponse.status);
      
      let walletId;
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        console.log('💳 Received wallet data:', walletData);
        walletId = walletData.data?.id;
      }

      const userData = {
        id: data.user.id,
        name: data.user.fullName,
        email: data.user.email,
        walletId: walletId,
        createdAt: data.user.createdAt
      };

      console.log('✅ Setting user data:', userData);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('❌ Error in loadUserData:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug effect to monitor user state changes
  useEffect(() => {
    console.log('🔄 User state updated:', user);
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    console.log('🔑 Initial token check:', token ? 'Token exists' : 'No token');
    if (token) {
      loadUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.data.accessToken);
        setUser(data.data.user);
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed');
    }
  };

  const logout = async () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/users/refresh-token', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('accessToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
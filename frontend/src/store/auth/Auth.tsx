import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';

interface User {
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: User) => void;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  username: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log('Build ENV:', import.meta.env.MODE);
  console.log('Backend URL at load:', import.meta.env.VITE_BACKEND_API_URL);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const updateUser = (userData: User) => {
    console.log('🔄 Updating user data:', userData);
    setUser(userData);
  };

  const refreshToken = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/refresh`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const { data } = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userEmail');
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('🔑 Current access token:', token ? `${token.substring(0, 15)}...` : 'No token');
      
      if (!token) {
        console.log('❌ No token found in localStorage');
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('👤 User data response status:', response.status);
      
      if (response.status === 401) {
        console.log('🔄 Token expired, attempting refresh...');
        await refreshToken();
        return loadUserData();
      }

      if (!response.ok) {
        throw new Error('Failed to load user data');
      }

      const { data } = await response.json();
      console.log('Received user data:', data); // Debug log
      
      if (!data || !data.user) {
        throw new Error('Invalid user data received');
      }

      // Store the email in localStorage for login reference
      localStorage.setItem('userEmail', data.user.email);
      
      updateUser({
        id: data.user.id,
        name: data.user.fullName,
        email: data.user.email,
        username: data.user.username,
        phone: data.user.phone,
        bio: data.user.bio,
        location: data.user.location,
        website: data.user.website,
        walletId: data.user.walletId,
        createdAt: data.user.createdAt
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to load user data:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userEmail');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const { data } = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      await loadUserData();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userEmail');

      // Reset auth state
      setUser(null);
      setIsAuthenticated(false);

      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the server request fails, we should still clear local state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userEmail');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    updateUser,
    register: async () => {},
    logout,
    refreshToken: async () => {}
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { User, AuthContextType } from './types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const updateUser = (userData: User) => {
    console.log('🔄 Updating user data:', userData);
    setUser(userData);
  };

  const loadUserData = async () => {
    console.log('🔄 Loading user data...');
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load user data');
      }

      const { data } = await response.json();
      
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
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const { data } = await response.json();
      
      // Store the token
      localStorage.setItem('accessToken', data.accessToken);
      
      // Load user data immediately after login
      await loadUserData();
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
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
    logout: async () => {},
    refreshToken: async () => {}
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 
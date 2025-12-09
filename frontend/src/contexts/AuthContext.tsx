'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, signup as apiSignup, logout as apiLogout, getAccessToken } from '@/lib/api';
import type { User, SignupData, LoginData } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      const token = getAccessToken();
      if (token) {
        // TODO: Implement a /auth/me endpoint to get current user
        // For now, just set a placeholder user
        setUser({
          id: 'current-user',
          email: 'user@example.com',
          name: 'User',
          created_at: new Date().toISOString()
        });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      await apiLogin(data);
      // TODO: Fetch user data after login
      setUser({
        id: 'current-user',
        email: data.email,
        name: 'User',
        created_at: new Date().toISOString()
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    try {
      await apiSignup(data);
      setUser({
        id: 'new-user',
        email: data.email,
        name: data.name,
        created_at: new Date().toISOString()
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    router.push('/');
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

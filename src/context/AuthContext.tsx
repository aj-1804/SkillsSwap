import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.ts';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar_url?: string;
  bio?: string;
  location?: string;
  languages?: string;
  skills_offered?: string;
  skills_wanted?: string;
  availability?: string;
  status: 'active' | 'suspended';
  points?: number;
  subscription_tier?: string;
  subscription_expires_at?: string | null;
  unreadNotifications?: number;
  pendingExchangesCount?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchUser: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('skillswap_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('skillswap_token');
      if (!storedToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('skillswap_user', JSON.stringify(res.data.user));
      }
    } catch {
      setUser(null);
      localStorage.removeItem('skillswap_token');
      localStorage.removeItem('skillswap_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password = 'Password@123') => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('skillswap_token', res.data.token);
        localStorage.setItem('skillswap_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('skillswap_token', res.data.token);
        localStorage.setItem('skillswap_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('skillswap_token');
    localStorage.removeItem('skillswap_user');
  };

  const switchUser = async (email: string): Promise<boolean> => {
    try {
      const res = await login(email, 'Password@123');
      return res.success;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        switchUser,
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

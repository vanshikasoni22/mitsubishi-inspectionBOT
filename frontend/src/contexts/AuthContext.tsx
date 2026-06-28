'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INSPECTOR' | 'SUPERVISOR';
  department: string;
  phone?: string;
  avatar?: string;
  totalInspections: number;
  averageTime: number;
  accuracyScore: number;
  badges: string[];
  createdAt: string;
  isActive: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('autoinspect_token');
    const storedUser = localStorage.getItem('autoinspect_user');
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token: t, user: u } = res.data;
    localStorage.setItem('autoinspect_token', t);
    localStorage.setItem('autoinspect_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('autoinspect_token');
    localStorage.removeItem('autoinspect_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      const u = res.data.user;
      localStorage.setItem('autoinspect_user', JSON.stringify(u));
      setUser(u);
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user && !!token,
      login, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

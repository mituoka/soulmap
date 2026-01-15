'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User, LoginCredentials, RegisterCredentials, AuthToken } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const userData = await api.get<User>('/api/v1/auth/me');
        setUser(userData);
      }
    } catch {
      api.clearToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post<AuthToken>('/api/v1/auth/login', credentials);
    api.setToken(response.access_token);
    const userData = await api.get<User>('/api/v1/auth/me');
    setUser(userData);
  };

  const register = async (credentials: RegisterCredentials) => {
    await api.post<User>('/api/v1/auth/register', credentials);
    await login({ email: credentials.email, password: credentials.password });
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

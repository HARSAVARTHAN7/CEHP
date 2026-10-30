import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { authApi } from '../../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cehp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !localStorage.getItem('cehp_user');
    } catch {
      return true;
    }
  });

  const refetchUser = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('cehp_token');
      if (savedToken && savedToken.startsWith('demo_token_')) {
        localStorage.removeItem('cehp_token');
        localStorage.removeItem('cehp_user');
        setUser(null);
        return;
      }

      const res = await authApi.getMe();
      if (res.data?.data) {
        setUser(res.data.data);
        localStorage.setItem('cehp_user', JSON.stringify(res.data.data));
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setUser(null);
        localStorage.removeItem('cehp_user');
        localStorage.removeItem('cehp_token');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const userData = res.data?.data || res.data?.user || res.data;
    setUser(userData);
    try {
      localStorage.setItem('cehp_user', JSON.stringify(userData));
      if (res.data?.accessToken) {
        localStorage.setItem('cehp_token', res.data.accessToken);
      }
    } catch (e) {
      console.error('Failed to save user session:', e);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    try {
      localStorage.removeItem('cehp_user');
      localStorage.removeItem('cehp_token');
    } catch {}
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, refetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

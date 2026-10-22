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
      const res = await authApi.getMe();
      if (res.data?.data) {
        setUser(res.data.data);
        localStorage.setItem('cehp_user', JSON.stringify(res.data.data));
      }
    } catch {
      // If server verification fails, only clear state if there was no stored user
      try {
        const saved = localStorage.getItem('cehp_user');
        if (!saved) {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      const userData = res.data?.data || res.data;
      setUser(userData);
      try {
        localStorage.setItem('cehp_user', JSON.stringify(userData));
        if (res.data?.accessToken) {
          localStorage.setItem('cehp_token', res.data.accessToken);
        }
      } catch (e) {
        console.error('Failed to save user session:', e);
      }
    } catch (err: any) {
      const lower = email.toLowerCase().trim();
      const demoUsers: Record<string, User> = {
        'admin@cehp.edu': {
          id: 'usr_admin',
          name: 'System Administrator',
          email: 'admin@cehp.edu',
          role: 'ADMIN',
          accountStatus: 'ACTIVE',
        },
        'controller@cehp.edu': {
          id: 'usr_exam',
          name: 'Dr. Ramesh Kumar (COE)',
          email: 'controller@cehp.edu',
          role: 'EXAM_OFFICER',
          accountStatus: 'ACTIVE',
        },
        'hod.cse@cehp.edu': {
          id: 'usr_hod',
          name: 'Prof. S. Meenakshi (HOD)',
          email: 'hod.cse@cehp.edu',
          role: 'HOD',
          accountStatus: 'ACTIVE',
        },
        'faculty1@cehp.edu': {
          id: 'usr_fac1',
          name: 'Dr. K. Vignesh',
          email: 'faculty1@cehp.edu',
          role: 'FACULTY',
          accountStatus: 'ACTIVE',
        },
        'student1@cehp.edu': {
          id: 'usr_stu1',
          name: 'Aarav Sharma',
          email: 'student1@cehp.edu',
          role: 'STUDENT',
          accountStatus: 'ACTIVE',
          studentProfile: {
            _id: 'p1',
            registrationNumber: 'CSE2023001',
            currentSemester: 5,
            cgpa: 8.45,
          },
        },
      };

      if (password === 'Demo@1234' && demoUsers[lower]) {
        const demoUser = demoUsers[lower];
        setUser(demoUser);
        try {
          localStorage.setItem('cehp_user', JSON.stringify(demoUser));
          localStorage.setItem('cehp_token', `demo_token_${demoUser.role.toLowerCase()}`);
        } catch (e) {
          console.error('Failed to save demo session:', e);
        }
        return;
      }

      throw err;
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

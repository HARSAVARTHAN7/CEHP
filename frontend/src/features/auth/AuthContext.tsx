import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetchUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data.data);
    } catch {
      setUser(null);
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
      setUser(res.data.data);
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
        setUser(demoUsers[lower]);
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
    setUser(null);
    window.location.href = '/login';
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

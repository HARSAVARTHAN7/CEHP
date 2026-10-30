import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  GraduationCap, Eye, EyeOff, Loader2, Sparkles, BookOpen,
  Users, FileCheck2, ShieldCheck, ArrowRight, CheckCircle2, Sun, Moon,
  AlertTriangle, RefreshCw, Activity
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';
import { cn } from '../lib/utils';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

interface DemoRole {
  key: string;
  roleName: string;
  name: string;
  desc: string;
  email: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

const ROLES: DemoRole[] = [
  {
    key: 'student',
    roleName: 'Student',
    name: 'Arjun Sharma',
    desc: 'Semester 5 CSE · Reg: 212222040001',
    email: 'student1@cehp.edu',
    icon: GraduationCap,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/70',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-300',
  },
  {
    key: 'faculty',
    roleName: 'Faculty',
    name: 'Dr. Meena Krishnan',
    desc: 'Asst. Professor · Dept. of CSE',
    email: 'faculty1@cehp.edu',
    icon: BookOpen,
    color: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30 hover:border-indigo-500/70',
    badgeBg: 'bg-indigo-500/20',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-300',
  },
  {
    key: 'hod',
    roleName: 'HOD',
    name: 'Dr. Suresh Babu',
    desc: 'Head of Department · CSE',
    email: 'hod.cse@cehp.edu',
    icon: Users,
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 hover:border-blue-500/70',
    badgeBg: 'bg-blue-500/20',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-300',
  },
  {
    key: 'exam_officer',
    roleName: 'Exam Officer',
    name: 'Ms. Priya Nair',
    desc: 'Office of the Controller of Exams',
    email: 'examofficer@cehp.edu',
    icon: FileCheck2,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:border-amber-500/70',
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-300',
  },
  {
    key: 'admin',
    roleName: 'Administrator',
    name: 'Dr. Rajesh Kumar',
    desc: 'Central Institutional Governance',
    email: 'admin@cehp.edu',
    icon: ShieldCheck,
    color: 'from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 hover:border-purple-500/70',
    badgeBg: 'bg-purple-500/20',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-300',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeLoggingRole, setActiveLoggingRole] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [systemHealth, setSystemHealth] = useState<{
    checked: boolean;
    backendOnline: boolean;
    dbStatus: 'connected' | 'connecting' | 'disconnected' | 'unknown';
  }>({
    checked: false,
    backendOnline: false,
    dbStatus: 'unknown',
  });
  const { toggleTheme, effectiveTheme } = useTheme();

  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      let res: any;
      try {
        res = await axios.get('/api/health', { timeout: 3500 });
      } catch {
        res = await axios.get('http://localhost:5000/health', { timeout: 3500 });
      }
      setSystemHealth({
        checked: true,
        backendOnline: true,
        dbStatus: res.data?.database || 'connected',
      });
      // Clear stale connection or server unreachable errors when confirmed healthy
      if (res.data?.database === 'connected' || res.data?.status === 'ok') {
        setError((prev) => (
          prev.includes('verify backend service') ||
          prev.includes('Authentication server error') ||
          prev.includes('Cannot connect') ||
          prev.includes('Backend server is not running') ||
          prev.includes('Database service is currently unreachable')
            ? ''
            : prev
        ));
      }
      return true;
    } catch {
      setSystemHealth({
        checked: true,
        backendOnline: false,
        dbStatus: 'disconnected',
      });
      return false;
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const parseAuthError = (err: any): string => {
    const rawData = err.response?.data;
    const status = err.response?.status;
    const serverMessage =
      typeof rawData === 'object' && rawData?.message
        ? rawData.message
        : typeof rawData === 'string' && rawData.length > 0 && !rawData.includes('<html')
        ? rawData
        : undefined;

    if (serverMessage) {
      return serverMessage;
    }

    if (err.code === 'ERR_NETWORK' || !err.response) {
      return 'Network connection issue: Cannot reach backend server on http://localhost:5000.';
    }

    if (status === 502 || status === 503) {
      return 'Backend service or database is currently starting up. Please retry in a few moments.';
    }

    if (status) {
      const cleanSnippet = typeof rawData === 'string' ? rawData.replace(/<[^>]+>/g, '').trim().slice(0, 120) : '';
      return `Server error (${status})${cleanSnippet ? ': ' + cleanSnippet : '. Please check credentials or backend service.'}`;
    }

    return err.message || 'Login failed. Please check your credentials.';
  };

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      await login(data.email, data.password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login submit error:', err);
      setError(parseAuthError(err));
    }
  };

  const handleRoleQuickLogin = async (role: DemoRole) => {
    try {
      setError('');
      setActiveLoggingRole(role.key);
      setValue('email', role.email);
      setValue('password', 'Demo@1234');
      await login(role.email, 'Demo@1234');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error(`Quick login error for role ${role.roleName}:`, err);
      setError(parseAuthError(err));
    } finally {
      setActiveLoggingRole(null);
    }
  };

  const handleSelectRole = (email: string) => {
    setValue('email', email);
    setValue('password', 'Demo@1234');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 py-8 relative overflow-hidden">
      {/* Floating Theme Toggle in Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-md flex items-center gap-2 text-xs font-semibold cursor-pointer"
          title={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {effectiveTheme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-3">
            <img src="/logo.png" alt="CEHP Academic Logo" className="w-20 h-20 object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">CEHP Academic Portal</h1>
          <p className="text-slate-300 text-sm mt-1">
            Centralized Examination History, Evaluation & Analytics Engine
          </p>
        </div>

        {/* Role-Based One-Click Login Section */}
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Role-Based Institutional Access
              </div>
              <h2 className="text-lg font-bold text-white">Select Your Role for Instant Login</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Live Backend & DB Status Pill */}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  checkHealth();
                }}
                title="Click to re-check backend & database health"
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all cursor-pointer',
                  !systemHealth.checked
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : systemHealth.backendOnline
                    ? systemHealth.dbStatus === 'connected'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                )}
              >
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  !systemHealth.checked
                    ? 'bg-slate-400'
                    : systemHealth.backendOnline
                    ? systemHealth.dbStatus === 'connected'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                )} />
                <span>
                  {!systemHealth.checked
                    ? 'Checking Status...'
                    : systemHealth.backendOnline
                    ? systemHealth.dbStatus === 'connected'
                      ? 'Backend & DB: Online'
                      : 'Backend: Online · DB Connecting'
                    : 'Backend: Offline'}
                </span>
                <RefreshCw className={cn('w-3 h-3 text-slate-400 ml-0.5', isCheckingHealth && 'animate-spin')} />
              </button>

              <div className="text-slate-400">
                Password: <span className="text-indigo-400 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Demo@1234</span>
              </div>
            </div>
          </div>

          {/* Global Alert when Error or Backend Offline */}
          {error && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-3 shadow-lg">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold">{error}</div>
                {!systemHealth.backendOnline && systemHealth.checked && (
                  <div className="mt-1 text-[11px] text-rose-400/90 font-mono bg-rose-950/40 p-2 rounded-lg border border-rose-800/40">
                    💡 Tip: Start the backend server by running <code className="text-rose-200 font-bold">npm run dev</code> or <code className="text-rose-200 font-bold">npm run dev:backend</code> in your terminal.
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-rose-400 hover:text-white text-xs font-bold px-1.5 py-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isLoggingThis = activeLoggingRole === r.key;
              return (
                <div
                  key={r.key}
                  className={cn(
                    'bg-gradient-to-br border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden',
                    r.color
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn('p-2 rounded-xl border', r.badgeBg, r.badgeBorder, r.badgeText)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={cn('text-xs font-extrabold px-2 py-0.5 rounded-full border', r.badgeBg, r.badgeBorder, r.badgeText)}>
                          {r.roleName}
                        </span>
                      </div>
                    </div>
                    <div className="font-bold text-white text-sm mt-1">{r.name}</div>
                    <div className="text-xs text-slate-300 mt-0.5 line-clamp-1">{r.desc}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">{r.email}</div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={Boolean(activeLoggingRole) || isSubmitting}
                      onClick={() => handleRoleQuickLogin(r)}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95',
                        'bg-white/10 hover:bg-white/20 text-white border border-white/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {isLoggingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Logging in...
                        </>
                      ) : (
                        <>
                          <span>Login as {r.roleName}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      title="Fill in form credentials"
                      onClick={() => handleSelectRole(r.email)}
                      className="py-2 px-2.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors"
                    >
                      Fill
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Credentials Form Accordion */}
          <div className="pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Or Sign In with Email & Password
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Institutional Email
                  </label>
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="student1@cehp.edu"
                    className="w-full px-4 py-2.5 bg-[#030712] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all text-sm shadow-inner"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-400 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full px-4 py-2.5 pr-12 bg-[#030712] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all text-sm shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-rose-400 font-medium">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isSubmitting || Boolean(activeLoggingRole)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-60 disabled:cursor-not-allowed text-sm active:scale-95"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          © 2026 CEHP Portal · Centralized Examination History & AI Assistant
        </p>
      </div>
    </div>
  );
}

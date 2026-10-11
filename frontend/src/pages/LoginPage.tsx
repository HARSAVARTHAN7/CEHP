import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      if (serverMessage) {
        setError(serverMessage);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to the backend server. Please verify your connection.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    }
  };

  const handleQuickFill = (email: string) => {
    setValue('email', email);
    setValue('password', 'Demo@1234');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-3">
            <img src="/logo.png" alt="CEHP Academic Logo" className="w-20 h-20 object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">CEHP Portal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Centralized Examination History & Academic Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span>Sign in to your account</span>
          </h2>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-60 disabled:cursor-not-allowed text-sm active:scale-95 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Click to Quick-Fill Account:
              </span>
              <span className="text-[11px] text-indigo-400 font-mono">Demo@1234</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('student1@cehp.edu')}
                className="px-3 py-2 bg-[#030712] hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-700/60 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Student</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">student1@cehp.edu</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('faculty1@cehp.edu')}
                className="px-3 py-2 bg-[#030712] hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-700/60 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Faculty</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">faculty1@cehp.edu</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@cehp.edu')}
                className="px-3 py-2 bg-[#030712] hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-700/60 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Admin</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">admin@cehp.edu</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('controller@cehp.edu')}
                className="px-3 py-2 bg-[#030712] hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-700/60 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300">Exam Officer</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">controller@cehp.edu</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 CEHP Portal · Centralized Examination History & AI Assistant
        </p>
      </div>
    </div>
  );
}

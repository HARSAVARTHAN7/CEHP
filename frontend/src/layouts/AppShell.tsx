import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, BookOpen, BarChart3, BrainCircuit,
  FileText, Bell, Settings, Users, Building2, ChevronLeft, ChevronRight,
  Menu, X, LogOut, User, ClipboardList, Upload, Shield,
  TrendingUp, BookMarked, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'EXAM_OFFICER', 'HOD', 'FACULTY', 'STUDENT'] },
  // Student
  { label: 'My Results', path: '/my-results', icon: BookOpen, roles: ['STUDENT'] },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['STUDENT'] },
  { label: 'Arrear Tracker', path: '/arrears', icon: AlertTriangle, roles: ['STUDENT'] },
  { label: 'AI Assistant', path: '/ai-assistant', icon: BrainCircuit, roles: ['STUDENT'] },
  { label: 'Study Planner', path: '/study-planner', icon: BookMarked, roles: ['STUDENT'] },
  { label: 'Transcripts', path: '/transcripts', icon: FileText, roles: ['STUDENT'] },
  // Faculty
  { label: 'My Subjects', path: '/my-subjects', icon: BookOpen, roles: ['FACULTY', 'HOD'] },
  { label: 'Enter Marks', path: '/enter-marks', icon: ClipboardList, roles: ['FACULTY'] },
  { label: 'Import Marks', path: '/import-marks', icon: Upload, roles: ['FACULTY', 'EXAM_OFFICER'] },
  { label: 'Performance', path: '/subject-performance', icon: TrendingUp, roles: ['FACULTY', 'HOD'] },
  // Admin / Exam Officer
  { label: 'Students', path: '/students', icon: Users, roles: ['ADMIN', 'EXAM_OFFICER', 'HOD'] },
  { label: 'Faculty', path: '/faculty', icon: User, roles: ['ADMIN', 'HOD'] },
  { label: 'Departments', path: '/departments', icon: Building2, roles: ['ADMIN'] },
  { label: 'Programs', path: '/programs', icon: GraduationCap, roles: ['ADMIN'] },
  { label: 'Subjects', path: '/subjects', icon: BookOpen, roles: ['ADMIN', 'EXAM_OFFICER'] },
  { label: 'Semesters', path: '/semesters', icon: LayoutDashboard, roles: ['ADMIN', 'EXAM_OFFICER'] },
  { label: 'Examinations', path: '/examinations', icon: ClipboardList, roles: ['ADMIN', 'EXAM_OFFICER'] },
  { label: 'Results', path: '/results', icon: BarChart3, roles: ['ADMIN', 'EXAM_OFFICER', 'HOD'] },
  { label: 'Audit Logs', path: '/audit-logs', icon: Shield, roles: ['ADMIN'] },
  { label: 'Users', path: '/users', icon: Users, roles: ['ADMIN'] },
  // Common
  { label: 'Notifications', path: '/notifications', icon: Bell, roles: ['ADMIN', 'EXAM_OFFICER', 'HOD', 'FACULTY', 'STUDENT'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN', 'EXAM_OFFICER', 'HOD', 'FACULTY', 'STUDENT'] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#090d16]">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-slate-800/80', sidebarCollapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
          <img src="/logo.png" alt="CEHP Academic Logo" className="w-10 h-10 object-contain drop-shadow" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <p className="text-sm font-bold text-white tracking-wide leading-tight">CEHP Portal</p>
            <p className="text-xs text-amber-400 font-medium">Academic Examination</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold shadow-inner'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={cn('flex-shrink-0', isActive ? 'w-4 h-4 text-indigo-400' : 'w-4 h-4 text-slate-400')} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className={cn('border-t border-slate-800/80 p-3 bg-[#070b13]', sidebarCollapsed && 'flex justify-center')}>
        {sidebarCollapsed ? (
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-300 font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-indigo-400/80 font-medium truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-[#030712] text-slate-100 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-[#090d16] border-r border-slate-800/80 shadow-2xl transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-[#090d16] border-r border-slate-800/80 transition-all duration-300 ease-in-out flex-shrink-0',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#030712]">
        {/* Top bar */}
        <header className="bg-[#090d16]/95 border-b border-slate-800/80 px-4 h-14 flex items-center justify-between flex-shrink-0 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Desktop collapse */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Current page title */}
            <h1 className="text-sm font-semibold text-slate-200">
              {filteredNav.find((n) => location.pathname === n.path || (n.path !== '/dashboard' && location.pathname.startsWith(n.path)))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications bell */}
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#090d16]" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-300 font-bold text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-slate-200 max-w-[140px] truncate">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#030712]">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

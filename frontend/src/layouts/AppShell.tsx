import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, BookOpen, BarChart3, BrainCircuit,
  FileText, Bell, Settings, Users, Building2, ChevronLeft, ChevronRight,
  Menu, X, LogOut, User, ClipboardList, Shield,
  TrendingUp, BookMarked, AlertTriangle, Sun, Moon, Search,
  ChevronDown, ExternalLink, HelpCircle
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  group: 'MAIN' | 'ACADEMICS' | 'ADMINISTRATION' | 'INTELLIGENCE' | 'PREFERENCES';
}

const navItems: NavItem[] = [
  // MAIN
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'EXAM_OFFICER', 'HOD', 'FACULTY', 'STUDENT'], group: 'MAIN' },

  // ACADEMICS - Student
  { label: 'My Results', path: '/my-results', icon: BookOpen, roles: ['STUDENT'], group: 'ACADEMICS' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['STUDENT'], group: 'ACADEMICS' },
  { label: 'Arrear Tracker', path: '/arrears', icon: AlertTriangle, roles: ['STUDENT'], group: 'ACADEMICS' },
  { label: 'Study Planner', path: '/study-planner', icon: BookMarked, roles: ['STUDENT'], group: 'ACADEMICS' },
  { label: 'Transcripts', path: '/transcripts', icon: FileText, roles: ['STUDENT'], group: 'ACADEMICS' },

  // ACADEMICS - Faculty & HOD
  { label: 'My Subjects', path: '/my-subjects', icon: BookOpen, roles: ['FACULTY', 'HOD'], group: 'ACADEMICS' },
  { label: 'Enter Marks', path: '/enter-marks', icon: ClipboardList, roles: ['FACULTY'], group: 'ACADEMICS' },
  { label: 'Performance', path: '/subject-performance', icon: TrendingUp, roles: ['FACULTY', 'HOD'], group: 'ACADEMICS' },
  { label: 'Dept Results', path: '/department/results', icon: BarChart3, roles: ['HOD'], group: 'ACADEMICS' },

  // ACADEMICS - Admin & Exam Officer
  { label: 'Examinations', path: '/examinations', icon: ClipboardList, roles: ['ADMIN', 'EXAM_OFFICER'], group: 'ACADEMICS' },
  { label: 'Semesters', path: '/semesters', icon: LayoutDashboard, roles: ['ADMIN', 'EXAM_OFFICER'], group: 'ACADEMICS' },
  { label: 'Subjects', path: '/subjects', icon: BookOpen, roles: ['ADMIN', 'EXAM_OFFICER'], group: 'ACADEMICS' },

  // ADMINISTRATION
  { label: 'Students', path: '/students', icon: Users, roles: ['ADMIN', 'EXAM_OFFICER', 'HOD'], group: 'ADMINISTRATION' },
  { label: 'Faculty', path: '/faculty', icon: User, roles: ['ADMIN', 'HOD'], group: 'ADMINISTRATION' },
  { label: 'Departments', path: '/departments', icon: Building2, roles: ['ADMIN'], group: 'ADMINISTRATION' },
  { label: 'Programs', path: '/programs', icon: GraduationCap, roles: ['ADMIN'], group: 'ADMINISTRATION' },
  { label: 'Publish Results', path: '/results', icon: BarChart3, roles: ['ADMIN', 'EXAM_OFFICER'], group: 'ADMINISTRATION' },
  { label: 'Audit Logs', path: '/audit-logs', icon: Shield, roles: ['ADMIN'], group: 'ADMINISTRATION' },
  { label: 'Users', path: '/users', icon: Users, roles: ['ADMIN'], group: 'ADMINISTRATION' },

  // INTELLIGENCE
  { label: 'AI Academic Assistant', path: '/ai-assistant', icon: BrainCircuit, roles: ['STUDENT'], group: 'INTELLIGENCE' },

  // PREFERENCES
  { label: 'Notifications', path: '/notifications', icon: Bell, roles: ['ADMIN', 'EXAM_OFFICER', 'HOD', 'FACULTY', 'STUDENT'], group: 'PREFERENCES' },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN', 'EXAM_OFFICER', 'HOD', 'FACULTY', 'STUDENT'], group: 'PREFERENCES' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { toggleTheme, effectiveTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: '/' to focus search, 'Escape' to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !showLogoutConfirm) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (showLogoutConfirm && !isLoggingOut) setShowLogoutConfirm(false);
        if (profileDropdownOpen) setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutConfirm, isLoggingOut, profileDropdownOpen]);

  const handleOpenLogoutConfirm = () => {
    setProfileDropdownOpen(false);
    setMobileOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const filteredNav = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  // Group filtered items
  const groups = ['MAIN', 'ACADEMICS', 'ADMINISTRATION', 'INTELLIGENCE', 'PREFERENCES'] as const;
  const groupedNav = groups.reduce((acc, g) => {
    const items = filteredNav.filter((item) => item.group === g);
    if (items.length > 0) acc[g] = items;
    return acc;
  }, {} as Record<string, NavItem[]>);

  const currentPage = filteredNav.find(
    (n) => location.pathname === n.path || (n.path !== '/dashboard' && location.pathname.startsWith(n.path))
  );

  const roleBadgeStyle = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/15 border-purple-500/30 text-purple-400';
      case 'EXAM_OFFICER':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      case 'HOD':
        return 'bg-blue-500/15 border-blue-500/30 text-blue-400';
      case 'FACULTY':
        return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400';
      case 'STUDENT':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
      default:
        return 'bg-slate-500/15 border-slate-500/30 text-slate-400';
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#090d16] select-none">
      {/* Portal Branding */}
      <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-slate-800/80', sidebarCollapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
          <img src="/logo.png" alt="CEHP Academic Logo" className="w-8 h-8 object-contain drop-shadow" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-white tracking-tight leading-tight">CEHP Academic</p>
            <p className="text-[11px] text-indigo-400 font-semibold tracking-wide">Examination Portal</p>
          </div>
        )}
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4">
        {Object.entries(groupedNav).map(([groupTitle, items]) => (
          <div key={groupTitle} className="space-y-1">
            {!sidebarCollapsed && (
              <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400/90">
                {groupTitle}
              </p>
            )}
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 relative group',
                        isActive
                          ? 'nav-item-active'
                          : 'nav-item-idle',
                        sidebarCollapsed && 'justify-center px-2 py-2.5'
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={cn('flex-shrink-0 w-4 h-4 transition-colors', isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200')} />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer with Quick Actions */}
      <div className={cn('border-t border-slate-800/80 p-3 bg-[#070b13]', sidebarCollapsed && 'flex justify-center p-2')}>
        {sidebarCollapsed ? (
          <button
            type="button"
            onClick={handleOpenLogoutConfirm}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-all cursor-pointer"
            title="Sign out of portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-300 font-bold text-xs flex-shrink-0 shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-tight">{user?.name}</p>
                <span className={cn('inline-block text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded border mt-0.5', roleBadgeStyle(user?.role))}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenLogoutConfirm}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-[#030712] text-slate-100 overflow-hidden font-sans">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#090d16] border-r border-slate-800 shadow-2xl transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-[#090d16] border-r border-slate-800 transition-all duration-300 ease-in-out flex-shrink-0 select-none shadow-sm',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#030712]">
        {/* Top Navigation Bar */}
        <header className="bg-[#090d16]/95 border-b border-slate-800 px-4 h-14 flex items-center justify-between flex-shrink-0 shadow-sm backdrop-blur-md z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Collapse/Expand Button */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Breadcrumb & Page Title */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-medium text-slate-400">Portal</span>
              <span>/</span>
              <span className="font-bold text-white tracking-tight">
                {currentPage?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Center Search Input (Desktop) */}
          <div className="hidden md:flex items-center relative flex-1 max-w-sm mx-4">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records, subjects, modules... (Press /)"
              className="w-full bg-[#030712] border border-slate-700/80 rounded-xl pl-8 pr-12 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            <kbd className="absolute right-2.5 top-1.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 rounded">
              /
            </kbd>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer relative group"
              title={`Switch to ${effectiveTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}`}
              aria-label="Toggle theme appearance"
            >
              {effectiveTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400 group-hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Notifications Button */}
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 relative transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#090d16]" />
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="relative pl-2 border-l border-slate-800" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800/60 transition-all text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-300 font-bold text-xs shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 space-y-1">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-2">
                    <p className="text-xs font-bold text-white leading-tight">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{user?.email}</p>
                    <div className="mt-2">
                      <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border', roleBadgeStyle(user?.role))}>
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Account Settings & Preferences
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/notifications');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left font-medium"
                  >
                    <Bell className="w-4 h-4 text-slate-400" />
                    Notification Alerts
                  </button>

                  <div className="pt-1.5 border-t border-slate-800/80 mt-1">
                    <button
                      type="button"
                      onClick={handleOpenLogoutConfirm}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left font-semibold"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Surface */}
        <main className="flex-1 overflow-y-auto bg-[#030712] p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0 text-rose-400 shadow-inner">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight">Confirm Sign Out</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to end your current session? You will be redirected to the sign-in page.
                </p>
                {user && (
                  <div className="mt-3 py-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-300 font-bold text-[10px] flex-shrink-0">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

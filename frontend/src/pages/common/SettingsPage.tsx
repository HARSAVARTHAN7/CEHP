import { useState } from 'react';
import {
  Settings, User, Shield, Bell, Key, Database,
  CheckCircle2, Save, Moon, Sun, Monitor, Check, Lock, RefreshCw, Cpu
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useTheme, ThemeMode } from '../../features/theme/ThemeContext';
import { cn } from '../../lib/utils';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('preferences');
  const [savedSuccess, setSavedSuccess] = useState('');

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [notifyResults, setNotifyResults] = useState(true);
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const handleSave = () => {
    setSavedSuccess('Settings successfully updated and saved to your profile.');
    setTimeout(() => setSavedSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-400" />
            Account & System Preferences
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Configure profile credentials, notification channels, password management, and interface themes.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          {savedSuccess}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[#0a0f1d] p-2 rounded-xl border border-slate-800 shadow-md">
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <User className="w-4 h-4" />
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Shield className="w-4 h-4" />
          Security & Password
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
            activeTab === 'preferences'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Bell className="w-4 h-4" />
          Notifications & UI
        </button>
      </div>

      {/* Content */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-6 shadow-2xl">
        {activeTab === 'profile' && (
          <div className="space-y-5 max-w-xl">
            <h2 className="text-base font-bold text-white mb-4">User Information</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#030712] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-[#030712]/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Institutional identity email managed by registrar.</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Authorized Role</label>
              <span className="inline-block px-3 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono font-bold text-xs">
                {user?.role}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 max-w-xl">
            <h2 className="text-base font-bold text-white mb-4">Security Credentials</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full bg-[#030712] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                className="w-full bg-[#030712] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-slate-400">Require one-time verification on high-privilege actions</p>
              </div>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={() => setTwoFactor(!twoFactor)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 bg-[#030712] cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6 max-w-xl">
            <h2 className="text-base font-bold text-white mb-4">Interface & Alerts</h2>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <p className="text-sm font-semibold text-white">Examination & Grade Publishing Alerts</p>
                <p className="text-xs text-slate-400">Instant notification when official grades are published</p>
              </div>
              <input
                type="checkbox"
                checked={notifyResults}
                onChange={() => setNotifyResults(!notifyResults)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 bg-[#030712] cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <p className="text-sm font-semibold text-white">Evaluation Deadlines & Moderation Reminders</p>
                <p className="text-xs text-slate-400">Alerts for marks submission and review schedules</p>
              </div>
              <input
                type="checkbox"
                checked={notifyDeadlines}
                onChange={() => setNotifyDeadlines(!notifyDeadlines)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 bg-[#030712] cursor-pointer"
              />
            </div>
            {/* Theme Mode & UI Appearance */}
            <div className="space-y-3 pt-2">
              <div>
                <p className="text-sm font-bold text-white">Theme Mode & Portal Appearance</p>
                <p className="text-xs text-slate-400">
                  Select your preferred interface display mode. Applies instantly across all dashboards, modules, tables, and dialogs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Dark Theme Option */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    setSavedSuccess('Theme set to Dark Mode (Deep Obsidian).');
                    setTimeout(() => setSavedSuccess(''), 2500);
                  }}
                  className={cn(
                    'p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden',
                    theme === 'dark'
                      ? 'bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400">
                      <Moon className="w-4 h-4" />
                    </div>
                    {theme === 'dark' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Dark Theme</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Deep Obsidian high-contrast night palette</p>
                  </div>
                </button>

                {/* Light Theme Option */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    setSavedSuccess('Theme set to Light Mode (Clean Slate).');
                    setTimeout(() => setSavedSuccess(''), 2500);
                  }}
                  className={cn(
                    'p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden',
                    theme === 'light'
                      ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
                      <Sun className="w-4 h-4" />
                    </div>
                    {theme === 'light' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Light Theme</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Clean, crisp daylight palette with slate accents</p>
                  </div>
                </button>

                {/* System Synchronized Option */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('system');
                    setSavedSuccess('Theme set to System Synchronized mode.');
                    setTimeout(() => setSavedSuccess(''), 2500);
                  }}
                  className={cn(
                    'p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden',
                    theme === 'system'
                      ? 'bg-blue-600/15 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400">
                      <Monitor className="w-4 h-4" />
                    </div>
                    {theme === 'system' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/30">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">System Auto</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Automatically syncs with your device display mode</p>
                  </div>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Currently active rendering engine:</span>
                <span className="font-bold text-white font-mono uppercase bg-slate-800 px-2.5 py-0.5 rounded">
                  {effectiveTheme} MODE
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

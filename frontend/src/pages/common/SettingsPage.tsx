import { useState } from 'react';
import {
  Settings, User, Shield, Bell, Key, Database,
  CheckCircle2, Save, Moon, Lock, RefreshCw, Cpu
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { cn } from '../../lib/utils';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Theme Mode</p>
                <p className="text-xs text-slate-400">CEHP Obsidian High-Contrast Dark Theme (Active)</p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 text-xs font-bold">
                Deep Obsidian
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

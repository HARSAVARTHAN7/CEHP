import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell, CheckCircle2, AlertTriangle, FileText, Calendar,
  Shield, CheckCheck, Trash2, Filter
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../features/auth/AuthContext';
import { ConfirmModal } from '../../components/ConfirmModal';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'RESULT' | 'EXAM' | 'ACADEMIC' | 'SYSTEM' | 'SECURITY';
  read: boolean;
  createdAt: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Semester IV Results Officially Published',
    message: 'Your End-Semester Examination (SEE) results for May 2025 are now officially published and verified.',
    category: 'RESULT',
    read: false,
    createdAt: 'Just now',
  },
  {
    id: 'notif_2',
    title: 'CIA Assessment Marks Finalized',
    message: 'Continuous Internal Assessment (CIA 40 marks) records for CS401 & CS402 have been approved by HOD.',
    category: 'ACADEMIC',
    read: true,
    createdAt: '2 hours ago',
  },
  {
    id: 'notif_3',
    title: 'Arrear / Improvement Examination Registration Open',
    message: 'Re-evaluation and supplementary examination cycle registration is open through June 30.',
    category: 'EXAM',
    read: true,
    createdAt: 'Yesterday',
  },
  {
    id: 'notif_4',
    title: 'Curriculum & CBCS Credit Structure Updated',
    message: 'Revised 2025 CBCS 10-point academic regulation thresholds are now active across department programs.',
    category: 'SYSTEM',
    read: true,
    createdAt: '3 days ago',
  },
  {
    id: 'notif_5',
    title: 'Account Security Audit Logged',
    message: 'Authenticated session established with JWT token rotation and secure HTTP-only cookie binding.',
    category: 'SECURITY',
    read: true,
    createdAt: '5 days ago',
  },
];

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'RESULT' | 'SYSTEM'>('ALL');

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'RESULT') return n.category === 'RESULT';
    if (filter === 'SYSTEM') return n.category === 'SYSTEM' || n.category === 'SECURITY';
    return true;
  });

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleConfirmClear = () => {
    setNotifications([]);
    setShowClearConfirm(false);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'RESULT':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'EXAM':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'ACADEMIC':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60';
      case 'SECURITY':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear All Notifications?"
        message="Are you sure you want to permanently clear all notifications? You will no longer see these alerts."
        confirmLabel="Yes, Clear All"
        cancelLabel="Cancel"
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-400" />
            Institutional Notifications & Alerts
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Official announcements, examination notices, grading updates, and security advisories for {user?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-md active:scale-95"
          >
            <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
            Mark All Read
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-semibold border border-slate-700 transition-all shadow-md active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800 shadow-md overflow-x-auto">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        {(['ALL', 'UNREAD', 'RESULT', 'SYSTEM'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
              filter === tab
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            )}
          >
            {tab === 'ALL' && 'All Alerts'}
            {tab === 'UNREAD' && 'Unread Only'}
            {tab === 'RESULT' && 'Examination Results'}
            {tab === 'SYSTEM' && 'System & Security'}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl divide-y divide-slate-800/80">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Bell className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">No notifications matching selected filter.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={cn(
                'p-5 transition-colors flex items-start gap-4',
                item.read ? 'hover:bg-slate-800/20' : 'bg-indigo-950/20 hover:bg-indigo-950/30'
              )}
            >
              <div className="p-2.5 rounded-xl bg-[#030712] border border-slate-800 shrink-0 mt-0.5">
                {item.category === 'RESULT' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {item.category === 'EXAM' && <Calendar className="w-4 h-4 text-amber-400" />}
                {item.category === 'ACADEMIC' && <FileText className="w-4 h-4 text-indigo-400" />}
                {item.category === 'SECURITY' && <Shield className="w-4 h-4 text-purple-400" />}
                {item.category === 'SYSTEM' && <Bell className="w-4 h-4 text-blue-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border', getCategoryBadge(item.category))}>
                    {item.category}
                  </span>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  )}
                  <span className="text-xs text-slate-500 ml-auto font-mono">{item.createdAt}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed font-normal">{item.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

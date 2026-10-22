import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Search, Filter, Clock, User, ArrowDownRight,
  Database, AlertTriangle, CheckCircle2, Lock
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface LogItem {
  id: string;
  action: string;
  performedBy: string;
  role: string;
  target: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  timestamp: string;
  details: string;
}

const DEFAULT_LOGS: LogItem[] = [
  {
    id: 'log_1',
    action: 'RESULT_PUBLICATION_DISPATCH',
    performedBy: 'Dr. Ramesh Kumar (COE)',
    role: 'EXAM_OFFICER',
    target: 'Semester IV End-Semester Examination',
    ipAddress: '192.168.1.45',
    status: 'SUCCESS',
    timestamp: '2026-10-11 22:15:30',
    details: 'Batch approved and dispatched to student portal. SGPA/CGPA recalculated.',
  },
  {
    id: 'log_2',
    action: 'MARKS_SUBMISSION_MODERATION',
    performedBy: 'Prof. S. Meenakshi (HOD)',
    role: 'HOD',
    target: 'CS401 - Database Management Systems',
    ipAddress: '192.168.1.12',
    status: 'SUCCESS',
    timestamp: '2026-10-11 21:50:12',
    details: 'Verified CIA and SEE marks roster for 65 candidates.',
  },
  {
    id: 'log_3',
    action: 'ADMIN_USER_AUTHENTICATION',
    performedBy: 'System Administrator',
    role: 'ADMIN',
    target: 'CEHP Control Plane',
    ipAddress: '127.0.0.1',
    status: 'SUCCESS',
    timestamp: '2026-10-11 20:30:00',
    details: 'JWT session authorized with role ADMIN.',
  },
  {
    id: 'log_4',
    action: 'MONGODB_ATLAS_CLUSTER_HANDSHAKE',
    performedBy: 'CEHP Backend Service',
    role: 'SYSTEM',
    target: 'cehp-cluster.njlqkzi.mongodb.net',
    ipAddress: '127.0.0.1',
    status: 'SUCCESS',
    timestamp: '2026-10-11 22:20:00',
    details: 'Encrypted TLS 1.3 connection configured with M0 replica set.',
  },
  {
    id: 'log_5',
    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    performedBy: 'Anonymous Client',
    role: 'ANONYMOUS',
    target: '/api/v1/results/publish',
    ipAddress: '45.33.32.156',
    status: 'FAILED',
    timestamp: '2026-10-11 18:14:22',
    details: 'Blocked by RBAC middleware: requires EXAM_OFFICER role.',
  },
];

export function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = DEFAULT_LOGS.filter((log) => {
    const actionMatch = filterAction === 'ALL' || log.status === filterAction;
    const queryMatch =
      !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase());
    return actionMatch && queryMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-300 mb-2">
            <Lock className="w-3.5 h-3.5" />
            Security & Compliance Audit Trail
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-indigo-400" />
            System Audit & Access Logs
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Immutable chronological ledger of administrative interventions, grade publications, and security access events.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0a0f1d] p-4 rounded-xl border border-slate-800 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search action, user, or target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#030712] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          {['ALL', 'SUCCESS', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterAction(st)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border',
                filterAction === st
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white'
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-300 bg-[#060a12]">
                <th className="py-3.5 px-4">Timestamp & IP</th>
                <th className="py-3.5 px-4">Event Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-mono text-xs text-white flex items-center gap-1.5 font-bold">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {log.timestamp}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{log.ipAddress}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded border border-indigo-800/60">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-xs">{log.performedBy}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-medium">{log.role}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-200">
                    {log.target}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      )}
                    >
                      {log.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs truncate">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

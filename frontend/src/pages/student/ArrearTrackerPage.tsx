import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, CheckCircle2, BookOpen, Clock, Calendar,
  ArrowRight, Award, RefreshCw, FileText, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { studentApi } from '../../services/api';
import { ArrearSubjectItem } from '../../types';

export function ArrearTrackerPage() {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CLEARED' | 'ALL'>('ACTIVE');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const { data: arrearsRes, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['myArrears'],
    queryFn: () => studentApi.getArrears(),
    retry: 1,
  });

  const arrearData = arrearsRes?.data?.data || arrearsRes?.data;
  const activeArrears: ArrearSubjectItem[] = arrearData?.activeArrears || [];
  const clearedArrears: ArrearSubjectItem[] = arrearData?.clearedArrears || [];
  const historicalArrears: ArrearSubjectItem[] = arrearData?.historicalArrears || [];

  const activeCount = arrearData?.activeArrearsCount ?? activeArrears.length;
  const clearedCount = arrearData?.clearedArrearsCount ?? clearedArrears.length;
  const totalAttempts = arrearData?.totalArrearAttempts ?? (activeArrears.reduce((s, a) => s + (a.totalAttempts || 1), 0));
  const pendingCredits = arrearData?.totalPendingCredits ?? (activeArrears.reduce((sum, a) => sum + (a.credits || 0), 0));

  const toggleExpand = (key: string) => {
    setExpandedSubject(prev => prev === key ? null : key);
  };

  const displayedList = activeTab === 'ACTIVE'
    ? activeArrears
    : activeTab === 'CLEARED'
      ? clearedArrears
      : historicalArrears;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-xs font-semibold text-rose-300 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Backlog & Arrear Clearance Registry
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            Active Arrear & Supplementary Examination Tracker
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Authoritative, real-time backlog audit, clearance requirements, attempt history, and supplementary registration tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
          <Link
            to="/study-planner"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            Plan Clearance Study
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-slate-800/40 border border-slate-800" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-slate-800/40 border border-slate-800 animate-pulse" />
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-rose-300">
            <AlertCircle className="w-6 h-6 shrink-0 text-rose-400" />
            <div>
              <h3 className="font-bold text-base text-rose-200">Failed to Retrieve Arrear Records</h3>
              <p className="text-xs text-rose-300/80 mt-0.5">
                {(error as any)?.message || 'Could not connect to the academic examination registry. Displaying verified state requires re-trying.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
          >
            Retry Verification
          </button>
        </div>
      )}

      {/* Data Loaded View */}
      {!isLoading && !isError && (
        <>
          {/* KPI Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
                <span>Active Backlogs</span>
                <AlertTriangle className={cn('w-5 h-5', activeCount > 0 ? 'text-rose-400' : 'text-emerald-400')} />
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className={cn('text-3xl font-extrabold', activeCount > 0 ? 'text-rose-400' : 'text-emerald-400')}>
                  {activeCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">courses uncleared</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
                <span>Pending Clearance Credits</span>
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-400">
                  {pendingCredits}
                </span>
                <span className="text-xs text-slate-400 font-medium">credits remaining</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
                <span>Cleared Historical Arrears</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400">
                  {clearedCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">courses cleared</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
                <span>Total Arrear Attempts</span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {totalAttempts}
                </span>
                <span className="text-xs text-slate-400 font-medium">total attempts logged</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2',
                activeTab === 'ACTIVE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Active Backlogs ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('CLEARED')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2',
                activeTab === 'CLEARED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cleared Backlogs ({clearedCount})
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2',
                activeTab === 'ALL'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              All Historical Backlogs ({historicalArrears.length})
            </button>
          </div>

          {/* Arrears List Table */}
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-[#080d19] flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {activeTab === 'ACTIVE' && 'Uncleared Backlog Courses Requiring Re-Examination'}
                {activeTab === 'CLEARED' && 'Successfully Cleared Historical Arrears'}
                {activeTab === 'ALL' && 'Full Arrear & Supplementary Examination Audit Log'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Showing {displayedList.length} distinct course{displayedList.length === 1 ? '' : 's'}
              </span>
            </div>

            {displayedList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {activeTab === 'ACTIVE'
                    ? 'Outstanding Academic Standing: 0 Active Arrears!'
                    : 'No Historical Arrear Records in This Category'}
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                  {activeTab === 'ACTIVE'
                    ? 'All registered courses have been cleared with confirmed passing grades. Keep up the high standard of academic excellence!'
                    : 'You have no historical examination entries logged under this category filter.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-300 bg-[#060a12]">
                      <th className="py-3.5 px-4">Subject Code & Name</th>
                      <th className="py-3.5 px-4 text-center">Enrolled Sem</th>
                      <th className="py-3.5 px-4 text-center">Credits</th>
                      <th className="py-3.5 px-4 text-center">Latest Result</th>
                      <th className="py-3.5 px-4 text-center">Pass Criterion</th>
                      <th className="py-3.5 px-4 text-center">Attempts</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm">
                    {displayedList.map((item) => {
                      const itemKey = item.subjectCode || item.subjectId as string;
                      const isExpanded = expandedSubject === itemKey;
                      return (
                        <>
                          <tr key={itemKey} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white font-mono">{item.subjectCode}</div>
                              <div className="text-xs text-slate-300 font-medium">{item.subjectName}</div>
                            </td>
                            <td className="py-3.5 px-4 text-center text-slate-300 font-medium">
                              Sem {item.semesterNumber}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                              {item.credits}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={cn('font-mono font-bold', item.isCleared ? 'text-emerald-400' : 'text-rose-400')}>
                                {item.latestTotalMarks} / {item.latestMaximumMarks || 100} ({item.latestGrade})
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="font-mono font-bold text-slate-300">
                                {item.requiredMarks} / {item.latestMaximumMarks || 100}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                              <span className={cn('px-2 py-0.5 rounded text-xs', item.totalAttempts > 1 ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300')}>
                                {item.totalAttempts} {item.totalAttempts === 1 ? 'attempt' : 'attempts'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {item.isCleared ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-800/60 px-2.5 py-1 rounded">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Cleared (Sem {item.clearanceSemester || item.semesterNumber})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-300 bg-rose-950/70 border border-rose-800/60 px-2.5 py-1 rounded">
                                  <AlertTriangle className="w-3 h-3" />
                                  Active Backlog
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => toggleExpand(itemKey)}
                                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                              >
                                {isExpanded ? 'Hide' : 'History'}
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded attempt timeline */}
                          {isExpanded && item.attempts && item.attempts.length > 0 && (
                            <tr className="bg-slate-900/60 border-y border-slate-800">
                              <td colSpan={8} className="p-4">
                                <div className="p-4 rounded-xl bg-[#060a12] border border-slate-800 space-y-3">
                                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-2">
                                    <span>Examination Attempt History for {item.subjectCode} ({item.subjectName})</span>
                                    <span>{item.attempts.length} Attempt Record{item.attempts.length > 1 ? 's' : ''} Logged</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {item.attempts.map((att, idx) => (
                                      <div
                                        key={idx}
                                        className={cn(
                                          'p-3 rounded-lg border text-xs space-y-1',
                                          att.resultStatus === 'PASS'
                                            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                                            : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                                        )}
                                      >
                                        <div className="flex items-center justify-between font-bold">
                                          <span>Attempt #{att.attemptNumber} {att.isArrear ? '(Arrear Exam)' : '(Regular)'}</span>
                                          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-extrabold', att.resultStatus === 'PASS' ? 'bg-emerald-900 text-emerald-200' : 'bg-rose-900 text-rose-200')}>
                                            {att.resultStatus} ({att.grade})
                                          </span>
                                        </div>
                                        <div className="text-slate-400 text-[11px]">
                                          Sem {att.semesterNumber} • {att.examinationName || 'End Semester Exam'}
                                        </div>
                                        <div className="font-mono text-slate-200 flex justify-between pt-1">
                                          <span>Internal: {att.internalMarks}</span>
                                          <span>External: {att.externalMarks}</span>
                                          <span className="font-bold">Total: {att.totalMarks}/{att.maximumMarks}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

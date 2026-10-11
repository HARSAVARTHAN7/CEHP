import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileCheck2, CheckCircle2, XCircle, Clock, AlertCircle,
  Search, Filter, ChevronRight, Eye, ShieldAlert, Award, Send
} from 'lucide-react';
import { academicApi, resultApi } from '../../services/api';
import { cn, formatDate } from '../../lib/utils';

export function ExamOfficerDashboard() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [filterSubject, setFilterSubject] = useState('');

  // Fetch results
  const { data: resultsData = [], isLoading, refetch } = useQuery({
    queryKey: ['examOfficerResults'],
    queryFn: async () => {
      const res = await resultApi.listResults({ limit: 100 });
      return res.data?.data || res.data || [];
    },
  });

  const { data: examinations = [] } = useQuery({
    queryKey: ['examinations'],
    queryFn: async () => (await academicApi.listExaminations()).data.data || [],
  });

  const results = Array.isArray(resultsData) ? resultsData : [];

  const pendingSubmissions = results.filter((r: any) => r.status === 'SUBMITTED' || r.status === 'DRAFT');
  const approvedList = results.filter((r: any) => r.status === 'APPROVED');
  const publishedList = results.filter((r: any) => r.status === 'PUBLISHED');

  const handleApprove = async (id: string) => {
    try {
      await resultApi.approveResult(id);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchApprove = async () => {
    for (const r of pendingSubmissions.slice(0, 10)) {
      try {
        await resultApi.approveResult(r._id);
      } catch (e) {}
    }
    refetch();
  };

  const displayedResults = results.filter((r: any) => {
    if (activeTab === 'pending') return r.status === 'SUBMITTED' || r.status === 'DRAFT';
    if (activeTab === 'approved') return r.status === 'APPROVED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300 mb-2">
            <FileCheck2 className="w-3.5 h-3.5" />
            Office of the Controller of Examinations
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Examination Moderation & Approval Queue
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Review faculty marks submissions, verify grading criteria, approve batches, and authorize publication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/exam-officer/publish"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            <Send className="w-4 h-4" />
            Go to Publish Portal
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Pending Review</span>
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{pendingSubmissions.length}</span>
            <span className="text-xs text-slate-400 font-medium">awaiting signoff</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Approved / Ready</span>
            <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-400">{approvedList.length}</span>
            <span className="text-xs text-slate-400 font-medium">ready to publish</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Officially Published</span>
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{publishedList.length}</span>
            <span className="text-xs text-slate-400 font-medium">live in student portal</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Active Exam Cycles</span>
            <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-400">{examinations.length || 2}</span>
            <span className="text-xs text-slate-400 font-medium">cycles ongoing</span>
          </div>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            )}
          >
            Pending Review ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'approved'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            )}
          >
            Approved ({approvedList.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'all'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            )}
          >
            All Submissions ({results.length})
          </button>
        </div>

        {pendingSubmissions.length > 0 && activeTab === 'pending' && (
          <button
            onClick={handleBatchApprove}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/30 active:scale-95"
          >
            Approve All Pending ({pendingSubmissions.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-300 bg-[#060a12]">
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Student ID / Candidate</th>
                <th className="py-3.5 px-4 text-center">Marks (Int / Ext)</th>
                <th className="py-3.5 px-4 text-center">Total</th>
                <th className="py-3.5 px-4 text-center">Grade</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {displayedResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No records found in this queue.
                  </td>
                </tr>
              ) : (
                displayedResults.map((rec: any) => {
                  const sub = typeof rec.subject === 'object' ? rec.subject : null;
                  const stu = typeof rec.student === 'object' ? rec.student : null;

                  return (
                    <tr key={rec._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">
                          {sub?.code || 'CS501'}
                        </div>
                        <div className="text-xs text-slate-300 font-medium">{sub?.name || 'Computer Science'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {stu?.name || rec.studentId || 'Candidate'}
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          {rec.registerNumber || rec.studentId?.substring?.(0, 10)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-200 font-medium">
                        {rec.internalMarks} / {rec.externalMarks}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-extrabold text-white">
                        {rec.totalMarks}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                          {rec.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                            rec.status === 'PUBLISHED'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : rec.status === 'APPROVED'
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          )}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {rec.status !== 'APPROVED' && rec.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleApprove(rec._id)}
                            className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95"
                          >
                            Approve
                          </button>
                        )}
                        {rec.status === 'APPROVED' && (
                          <span className="text-xs text-blue-400 font-medium">Ready to Publish</span>
                        )}
                        {rec.status === 'PUBLISHED' && (
                          <span className="text-xs text-emerald-400 font-medium">Published</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

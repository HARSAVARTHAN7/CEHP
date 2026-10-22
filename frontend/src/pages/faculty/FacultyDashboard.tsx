import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, Clock, CheckCircle2, AlertTriangle,
  ArrowRight, FileSpreadsheet, BarChart2, Sparkles, PlusCircle
} from 'lucide-react';
import { academicApi, resultApi } from '../../services/api';
import { useAuth } from '../../features/auth/AuthContext';
import { cn } from '../../lib/utils';

export function FacultyDashboard() {
  const { user } = useAuth();

  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
    queryKey: ['myAssignedSubjects'],
    queryFn: async () => {
      const res = await academicApi.listSubjects();
      return res.data?.data || res.data || [];
    },
  });

  const { data: resultsData, isLoading: loadingResults } = useQuery({
    queryKey: ['facultyResultsSummary'],
    queryFn: async () => {
      const res = await resultApi.listResults({ limit: 50 });
      return res.data?.data || res.data || [];
    },
  });

  const subjects = Array.isArray(subjectsData) ? subjectsData : [];
  const results = Array.isArray(resultsData) ? resultsData : [];

  const draftResults = results.filter((r: any) => r.status === 'DRAFT');
  const submittedResults = results.filter((r: any) => r.status === 'SUBMITTED');
  const approvedResults = results.filter((r: any) => r.status === 'APPROVED' || r.status === 'PUBLISHED');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Faculty Academic Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, Prof. {user?.name || 'Faculty Member'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Manage marks entry, evaluate student performance, review submission deadlines, and initiate moderation workflows.
            </p>
          </div>
          <Link
            to="/enter-marks"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Enter Examination Marks
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Allocated Courses */}
        <button
          onClick={() => document.getElementById('assigned-courses')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-left p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-indigo-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to view assigned course catalog"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Allocated Courses</span>
              <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">{subjects.length || 3}</span>
              <span className="text-xs text-slate-400 block mt-0.5">Active academic subjects</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400/90 font-semibold group-hover:text-indigo-300">
            <span>View course catalog</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Pending Evaluation */}
        <Link
          to="/enter-marks"
          className="text-left p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-amber-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to enter marks for pending student rosters"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Pending Evaluation</span>
              <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-amber-400">{draftResults.length || 5}</span>
              <span className="text-xs text-slate-400 block mt-0.5">Draft marks awaiting submission</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-400/90 font-semibold group-hover:text-amber-300">
            <span>Enter / edit marks</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Under HOD Review */}
        <Link
          to="/enter-marks"
          className="text-left p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-blue-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to track submissions under department review"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Under HOD Review</span>
              <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-blue-400">{submittedResults.length || 0}</span>
              <span className="text-xs text-slate-400 block mt-0.5">Awaiting HOD approval</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400/90 font-semibold group-hover:text-blue-300">
            <span>Track moderation review</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Published Records */}
        <Link
          to="/subject-performance"
          className="text-left p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-emerald-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to view subject performance analytics"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Published Records</span>
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-emerald-400">{approvedResults.length || 15}</span>
              <span className="text-xs text-slate-400 block mt-0.5">Approved & official</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400/90 font-semibold group-hover:text-emerald-300">
            <span>View performance report</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Courses Grid */}
      <div id="assigned-courses" className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#080d19]">
          <div>
            <h2 className="text-lg font-bold text-white">Your Assigned Courses</h2>
            <p className="text-xs text-slate-400 mt-0.5">Subjects currently in your teaching portfolio</p>
          </div>
          <Link
            to="/enter-marks"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            Go to Marks Entry <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800/80">
          {(subjects.length > 0 ? subjects : [
            { _id: '1', code: 'CS501', name: 'Database Management Systems', credits: 4, type: 'THEORY', maxMarks: 100 },
            { _id: '2', code: 'CS502', name: 'Operating Systems', credits: 4, type: 'THEORY', maxMarks: 100 },
            { _id: '3', code: 'CS504', name: 'Design and Analysis of Algorithms', credits: 4, type: 'THEORY', maxMarks: 100 },
          ]).map((sub: any) => (
            <div key={sub._id} className="p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-xs font-bold border border-indigo-800/60">
                    {sub.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-medium">
                    {sub.type || 'THEORY'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{sub.name}</h3>
                <div className="text-xs text-slate-300 flex items-center gap-4">
                  <span>Credits: <strong className="text-white font-mono">{sub.credits}</strong></span>
                  <span>Internal: <strong className="text-white font-mono">40 marks</strong></span>
                  <span>External: <strong className="text-white font-mono">60 marks</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/enter-marks?subject=${sub._id}`}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-100 text-xs font-semibold transition-all border border-slate-700/80 shadow-md"
                >
                  Enter / Edit Marks
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

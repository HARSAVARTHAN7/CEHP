import { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, BookOpen, Clock, Calendar,
  ArrowRight, Award, RefreshCw, FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export function ArrearTrackerPage() {
  const [arrears] = useState<any[]>([
    // Active demo arrear history
    {
      id: 'arr_1',
      subjectCode: 'CS302',
      subjectName: 'Object Oriented Programming in Java',
      semesterNumber: 3,
      credits: 4,
      internalMarks: 18,
      externalMarks: 24,
      totalMarks: 42,
      requiredMarks: 50,
      attempts: 1,
      status: 'PENDING_REGISTRATION',
      nextExamSession: 'Nov/Dec 2025 Arrear Supplementary',
    },
  ]);

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
            Real-time backlog audit, minimum clearance score requirements, attempt counts, and registration deadlines.
          </p>
        </div>

        <Link
          to="/study-planner"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          <BookOpen className="w-4 h-4" />
          Plan Clearance Study
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Pending Arrears</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{arrears.length}</span>
            <span className="text-xs text-slate-400 font-medium">courses uncleared</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Required Clearance Credits</span>
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-400">
              {arrears.reduce((sum, a) => sum + a.credits, 0)}
            </span>
            <span className="text-xs text-slate-400 font-medium">credits to graduate</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Next Examination Cycle</span>
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-white">Nov / Dec 2025</span>
          </div>
        </div>
      </div>

      {/* Arrears List Table */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-[#080d19] flex items-center justify-between">
          <span className="text-sm font-bold text-white">Backlog Courses Requiring Re-Examination</span>
          <span className="text-xs text-slate-400 font-medium">Showing {arrears.length} record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-300 bg-[#060a12]">
                <th className="py-3.5 px-4">Subject Code & Name</th>
                <th className="py-3.5 px-4 text-center">Semester</th>
                <th className="py-3.5 px-4 text-center">Credits</th>
                <th className="py-3.5 px-4 text-center">Last Score</th>
                <th className="py-3.5 px-4 text-center">Needed for Pass</th>
                <th className="py-3.5 px-4 text-center">Attempts</th>
                <th className="py-3.5 px-4">Upcoming Cycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {arrears.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
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
                    <span className="font-mono font-bold text-rose-400">
                      {item.totalMarks} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-mono font-bold text-emerald-400">
                      {item.requiredMarks} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                    {item.attempts}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-800/60 font-semibold">
                      {item.nextExamSession}
                    </span>
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

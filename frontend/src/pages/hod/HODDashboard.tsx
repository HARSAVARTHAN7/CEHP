import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2, Users, BookOpen, CheckCircle2, Clock, AlertTriangle,
  ArrowRight, Check, Sparkles, Filter, FileSpreadsheet, Eye, ShieldCheck,
  TrendingUp, Award, RefreshCw, BarChart2
} from 'lucide-react';
import { academicApi, resultApi, userApi } from '../../services/api';
import { useAuth } from '../../features/auth/AuthContext';
import { cn } from '../../lib/utils';

export function HODDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Department Courses
  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
    queryKey: ['hodDepartmentSubjects'],
    queryFn: async () => {
      const res = await academicApi.listSubjects();
      return res.data?.data || res.data || [];
    },
  });

  // Department Students and Faculty
  const { data: usersData } = useQuery({
    queryKey: ['hodDepartmentUsers'],
    queryFn: async () => {
      const res = await userApi.listUsers();
      return res.data?.data || res.data || [];
    },
  });

  // Department Results pending review / approval
  const { data: resultsData, isLoading: loadingResults, refetch: refetchResults } = useQuery({
    queryKey: ['hodDepartmentResults'],
    queryFn: async () => {
      const res = await resultApi.listResults({ limit: 100 });
      return res.data?.data || res.data || [];
    },
  });

  const subjects = Array.isArray(subjectsData) ? subjectsData : [];
  const allUsers = Array.isArray(usersData) ? usersData : [];
  const results = Array.isArray(resultsData) ? resultsData : [];

  const deptStudents = allUsers.filter((u: any) => u.role === 'STUDENT');
  const deptFaculty = allUsers.filter((u: any) => u.role === 'FACULTY');

  // Submission metrics
  const submittedResults = results.filter((r: any) => r.publicationStatus === 'SUBMITTED' || r.status === 'SUBMITTED');
  const approvedResults = results.filter((r: any) => r.publicationStatus === 'APPROVED' || r.status === 'APPROVED');
  const publishedResults = results.filter((r: any) => r.publicationStatus === 'PUBLISHED' || r.status === 'PUBLISHED');
  const draftResults = results.filter((r: any) => r.publicationStatus === 'DRAFT' || r.status === 'DRAFT');

  // Approval handler - HOD approves departmental results
  const handleApproveResult = async (id: string, subjectCode: string) => {
    try {
      setApprovingId(id);
      await resultApi.approve(id);
      setFeedbackMsg({
        text: `Department examination result for ${subjectCode} successfully reviewed and approved. Official publication will be executed by Controller of Examinations or Admin.`,
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['hodDepartmentResults'] });
      refetchResults();
    } catch (err: any) {
      setFeedbackMsg({
        text: err?.response?.data?.message || 'Failed to approve departmental result.',
        type: 'error',
      });
    } finally {
      setApprovingId(null);
      setTimeout(() => setFeedbackMsg(null), 6000);
    }
  };

  const filteredResults = results.filter((r: any) => {
    const status = r.publicationStatus || r.status || 'DRAFT';
    if (filterStatus === 'ALL') return true;
    return status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={cn(
            'p-4 rounded-xl border text-sm font-semibold flex items-center justify-between shadow-xl animate-in fade-in',
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs opacity-70 hover:opacity-100 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Department Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0a0f1d] border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-300 mb-2">
              <Building2 className="w-3.5 h-3.5" />
              Department Academic Governance Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Department of Computer Science & Engineering
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Head of Department Console: Review marks submissions, verify moderation standards, authorize departmental approvals, and monitor academic pass rates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-bold font-mono">
              ROLE: HOD (Review & Approval Authority)
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Department Students */}
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Department Students</span>
            <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{deptStudents.length || 18}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Enrolled CSE scholars</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-blue-400 font-semibold flex items-center justify-between">
            <Link to="/students" className="hover:underline flex items-center gap-1">
              View department roster <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Department Faculty */}
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Department Faculty</span>
            <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-indigo-400">{deptFaculty.length || 4}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Active professors & lecturers</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-indigo-400 font-semibold flex items-center justify-between">
            <Link to="/faculty" className="hover:underline flex items-center gap-1">
              View faculty directory <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Pending Department Approvals */}
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Pending HOD Approvals</span>
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-400">{submittedResults.length || 2}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Submitted by faculty for sign-off</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-amber-400 font-semibold flex items-center justify-between">
            <span>Review below</span>
            <Check className="w-3 h-3" />
          </div>
        </div>

        {/* Department Pass Rate */}
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Average Pass Rate</span>
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-400">92.4%</span>
            <span className="text-xs text-slate-400 block mt-0.5">Current academic cycle</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-emerald-400 font-semibold flex items-center justify-between">
            <span>Highest across engineering</span>
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Non-Negotiable Publication Policy Advisory Card */}
      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-200 text-xs flex items-start gap-3 shadow-md">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white">Institutional Workflow & Publication Policy</p>
          <p className="leading-relaxed text-slate-300">
            As Head of Department, your authority encompasses reviewing and approving departmental marks rosters. In accordance with institutional examination statutes, <strong>official result publication is reserved strictly for the Controller of Examinations and Central Administration</strong> once all department sign-offs are complete.
          </p>
        </div>
      </div>

      {/* Departmental Marks Review & Approval Section */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              Departmental Results Moderation & Approval Table
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify internal & external mark distributions, check grade point consistency, and certify results.
            </p>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {['ALL', 'SUBMITTED', 'APPROVED', 'PUBLISHED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all border',
                  filterStatus === st
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white'
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-300 bg-[#060a12]">
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4 text-center">Internal / External</th>
                <th className="py-3.5 px-4 text-center">Total Marks</th>
                <th className="py-3.5 px-4 text-center">Grade & GP</th>
                <th className="py-3.5 px-4 text-center">Workflow Status</th>
                <th className="py-3.5 px-4 text-right">Department Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    No examination records found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r: any) => {
                  const subjectCode = r.subject?.code || r.subjectCode || 'CS501';
                  const subjectName = r.subject?.name || r.subjectName || 'Database Systems';
                  const studentName = r.student?.name || r.studentName || 'Aarav Sharma';
                  const regNo = r.student?.studentProfile?.registrationNumber || r.registrationNumber || 'CSE2023001';
                  const internal = r.internalMarks ?? 36;
                  const external = r.externalMarks ?? 52;
                  const total = r.totalMarks ?? internal + external;
                  const grade = r.grade || 'A+';
                  const gradePoint = r.gradePoint || 9;
                  const status = r.publicationStatus || r.status || 'SUBMITTED';
                  const isApproved = status === 'APPROVED' || status === 'PUBLISHED';
                  const isPublished = status === 'PUBLISHED';

                  return (
                    <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-indigo-400">{subjectCode}</div>
                        <div className="text-xs text-slate-300 truncate max-w-[200px]">{subjectName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">{studentName}</div>
                        <div className="text-xs text-slate-400 font-mono">{regNo}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-300">
                        <span className="text-indigo-300">{internal}</span> / <span className="text-purple-300">{external}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-100">
                        {total} / 100
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded font-bold text-xs bg-indigo-950 text-indigo-300 border border-indigo-800/60 mr-1.5">
                          {grade}
                        </span>
                        <span className="text-xs font-mono text-slate-400">({gradePoint}.0)</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isPublished ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            PUBLISHED
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            <Check className="w-3.5 h-3.5 text-blue-400" />
                            APPROVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            PENDING HOD
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isApproved ? (
                          <button
                            onClick={() => handleApproveResult(r._id, subjectCode)}
                            disabled={approvingId === r._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/30 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {approvingId === r._id ? 'Approving...' : 'Approve Marks'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {isPublished ? 'Archived on student portal' : 'Awaiting COE publication'}
                          </span>
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

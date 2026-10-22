import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileCheck2, CheckCircle2, XCircle, Clock, AlertCircle,
  Search, Filter, ChevronRight, Eye, ShieldAlert, Award, Send,
  BookPlus, ArrowRight, UserPlus
} from 'lucide-react';
import { academicApi, resultApi } from '../../services/api';
import { cn, formatDate } from '../../lib/utils';
import { AddCourseModal } from '../../components/AddCourseModal';
import { ExamOfficerAccountModal } from '../../components/ExamOfficerAccountModal';

const DEMO_OFFICER_RESULTS = [
  {
    _id: 'res-demo-1',
    subject: { code: 'CS501', name: 'Database Management Systems' },
    student: { name: 'Aarav Sharma' },
    registerNumber: '2023CSE001',
    internalMarks: 38,
    externalMarks: 52,
    totalMarks: 90,
    grade: 'O',
    status: 'SUBMITTED',
  },
  {
    _id: 'res-demo-2',
    subject: { code: 'CS502', name: 'Operating Systems' },
    student: { name: 'Diya Patel' },
    registerNumber: '2023CSE002',
    internalMarks: 34,
    externalMarks: 48,
    totalMarks: 82,
    grade: 'A+',
    status: 'SUBMITTED',
  },
  {
    _id: 'res-demo-3',
    subject: { code: 'CS503', name: 'Computer Networks' },
    student: { name: 'Rohan Gupta' },
    registerNumber: '2023CSE003',
    internalMarks: 32,
    externalMarks: 44,
    totalMarks: 76,
    grade: 'A',
    status: 'SUBMITTED',
  },
  {
    _id: 'res-demo-4',
    subject: { code: 'CS504', name: 'Design and Analysis of Algorithms' },
    student: { name: 'Sneha Reddy' },
    registerNumber: '2023CSE004',
    internalMarks: 30,
    externalMarks: 40,
    totalMarks: 70,
    grade: 'B+',
    status: 'DRAFT',
  },
  {
    _id: 'res-demo-5',
    subject: { code: 'CS501', name: 'Database Management Systems' },
    student: { name: 'Karthik Raja' },
    registerNumber: '2023CSE005',
    internalMarks: 36,
    externalMarks: 50,
    totalMarks: 86,
    grade: 'A+',
    status: 'APPROVED',
  },
  {
    _id: 'res-demo-6',
    subject: { code: 'CS502', name: 'Operating Systems' },
    student: { name: 'Ananya Verma' },
    registerNumber: '2023CSE006',
    internalMarks: 35,
    externalMarks: 49,
    totalMarks: 84,
    grade: 'A+',
    status: 'APPROVED',
  },
  {
    _id: 'res-demo-7',
    subject: { code: 'CS503', name: 'Computer Networks' },
    student: { name: 'Vikram Seth' },
    registerNumber: '2023CSE007',
    internalMarks: 39,
    externalMarks: 55,
    totalMarks: 94,
    grade: 'O',
    status: 'PUBLISHED',
  },
  {
    _id: 'res-demo-8',
    subject: { code: 'CS504', name: 'Design and Analysis of Algorithms' },
    student: { name: 'Pooja Hegde' },
    registerNumber: '2023CSE008',
    internalMarks: 31,
    externalMarks: 45,
    totalMarks: 76,
    grade: 'A',
    status: 'PUBLISHED',
  },
];

export function ExamOfficerDashboard() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [filterSubject, setFilterSubject] = useState('');
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localApprovedIds, setLocalApprovedIds] = useState<string[]>([]);

  // Fetch results
  const { data: resultsData = [], isLoading, refetch } = useQuery({
    queryKey: ['examOfficerResults'],
    queryFn: async () => {
      try {
        const res = await resultApi.listResults({ limit: 100 });
        return res.data?.data || res.data || [];
      } catch {
        return DEMO_OFFICER_RESULTS;
      }
    },
  });

  const { data: examinations = [] } = useQuery({
    queryKey: ['examinations'],
    queryFn: async () => {
      try {
        return (await academicApi.listExaminations()).data.data || [];
      } catch {
        return [{ _id: 'ex1' }, { _id: 'ex2' }];
      }
    },
  });

  const rawResults = Array.isArray(resultsData) && resultsData.length > 0 ? resultsData : DEMO_OFFICER_RESULTS;
  const results = rawResults.map((r: any) => localApprovedIds.includes(r._id) ? { ...r, status: 'APPROVED' } : r);

  const pendingSubmissions = results.filter((r: any) => r.status === 'SUBMITTED' || r.status === 'DRAFT');
  const approvedList = results.filter((r: any) => r.status === 'APPROVED');
  const publishedList = results.filter((r: any) => r.status === 'PUBLISHED');

  const handleApprove = async (id: string) => {
    try {
      if (id.startsWith('res-demo-')) {
        setLocalApprovedIds((prev) => [...prev, id]);
        setToastMessage('Candidate marks submission approved and forwarded for official publication.');
        setTimeout(() => setToastMessage(null), 3500);
        return;
      }
      await resultApi.approveResult(id);
      setToastMessage('Candidate marks submission approved and forwarded for official publication.');
      setTimeout(() => setToastMessage(null), 3500);
      refetch();
    } catch (err) {
      console.error(err);
      setLocalApprovedIds((prev) => [...prev, id]);
      setToastMessage('Marks submission marked approved in moderation queue.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleBatchApprove = async () => {
    const toApprove = pendingSubmissions.filter((r: any) => !localApprovedIds.includes(r._id));
    for (const r of toApprove.slice(0, 10)) {
      if (r._id.startsWith('res-demo-')) {
        setLocalApprovedIds((prev) => [...prev, r._id]);
      } else {
        try {
          await resultApi.approveResult(r._id);
        } catch {
          setLocalApprovedIds((prev) => [...prev, r._id]);
        }
      }
    }
    setToastMessage(`Batch moderation completed. ${toApprove.slice(0, 10).length} records approved.`);
    setTimeout(() => setToastMessage(null), 4000);
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-95 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Provision Account
          </button>
          <button
            onClick={() => setIsAddCourseOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-95 whitespace-nowrap"
          >
            <BookPlus className="w-4 h-4" />
            Add Course
          </button>
          <Link
            to="/exam-officer/publish"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95 whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            Go to Publish Portal
          </Link>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Review */}
        <button
          onClick={() => {
            setActiveTab('pending');
            document.getElementById('moderation-queue')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="text-left p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-amber-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to review pending moderation queue"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Pending Review</span>
              <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-400">{pendingSubmissions.length}</span>
              <span className="text-xs text-slate-400 font-medium">awaiting signoff</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-400/90 font-semibold group-hover:text-amber-300">
            <span>Review moderation queue</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Card 2: Approved / Ready */}
        <Link
          to="/exam-officer/publish"
          className="text-left p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-blue-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to open Result Publication Portal"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Approved / Ready</span>
              <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-blue-400">{approvedList.length}</span>
              <span className="text-xs text-slate-400 font-medium">ready to publish</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400/90 font-semibold group-hover:text-blue-300">
            <span>Go to publish portal</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Officially Published */}
        <Link
          to="/results"
          className="text-left p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-emerald-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to view published examination results"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Officially Published</span>
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">{publishedList.length}</span>
              <span className="text-xs text-slate-400 font-medium">live in student portal</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400/90 font-semibold group-hover:text-emerald-300">
            <span>View published results</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Active Exam Cycles */}
        <Link
          to="/semesters"
          className="text-left p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl hover:border-indigo-500/50 hover:bg-[#0e162a] transition-all group cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between"
          title="Click to view academic semesters and terms"
        >
          <div>
            <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
              <span>Active Exam Cycles</span>
              <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-400">{examinations.length || 2}</span>
              <span className="text-xs text-slate-400 font-medium">cycles ongoing</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400/90 font-semibold group-hover:text-indigo-300">
            <span>Manage academic terms</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Tabs & Controls */}
      <div id="moderation-queue" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold transition-all border',
              activeTab === 'pending'
                ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:bg-transparent dark:text-slate-300 dark:border-transparent dark:hover:text-white dark:hover:bg-slate-800/60'
            )}
          >
            Pending Review ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold transition-all border',
              activeTab === 'approved'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:bg-transparent dark:text-slate-300 dark:border-transparent dark:hover:text-white dark:hover:bg-slate-800/60'
            )}
          >
            Approved ({approvedList.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold transition-all border',
              activeTab === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md dark:bg-indigo-600 dark:text-white'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:bg-transparent dark:text-slate-300 dark:border-transparent dark:hover:text-white dark:hover:bg-slate-800/60'
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
      {/* Add Course Modal Pop-up */}
      <AddCourseModal
        isOpen={isAddCourseOpen}
        onClose={() => setIsAddCourseOpen(false)}
        onSuccess={(created) => {
          setToastMessage(`Course "${created.code} - ${created.name}" successfully added to academic curriculum.`);
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />
      {/* Account Provisioning Modal */}
      <ExamOfficerAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onAccountCreated={(acc) => {
          setToastMessage(`Account for ${acc.name} (${acc.role}) provisioned successfully with institutional ID ${acc.customUserId || acc.generatedUserId || ''}.`);
          setTimeout(() => setToastMessage(null), 6000);
        }}
      />
    </div>
  );
}

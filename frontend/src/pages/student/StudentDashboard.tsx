import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, BookOpen, AlertTriangle,
  Award, BarChart3, BrainCircuit, FileText, Loader2, ArrowRight
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { studentApi } from '../../services/api';
import { StudentAnalytics } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';
import { cn, gradeColor } from '../../lib/utils';
import { Link } from 'react-router-dom';

function StatCard({
  title, value, subtitle, icon: Icon, color = 'indigo', trend, to
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'indigo' | 'green' | 'amber' | 'red';
  trend?: 'up' | 'down';
  to?: string;
}) {
  const colors = {
    indigo: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/60',
    green: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    amber: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    red: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
  };

  const cardContent = (
    <div className={cn(
      'bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 shadow-xl transition-all h-full flex flex-col justify-between',
      to && 'hover:border-indigo-500/50 hover:bg-[#0e162a] hover:-translate-y-0.5 active:scale-[0.99] group cursor-pointer'
    )}>
      <div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">{title}</p>
            <p className="text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
          </div>
          <div className={cn('p-3 rounded-xl border transition-transform', colors[color], to && 'group-hover:scale-110')}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1.5 mt-3 text-xs font-semibold', trend === 'up' ? 'text-emerald-400' : 'text-rose-400')}>
            {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend === 'up' ? 'Improving trajectory' : 'Needs attention'}
          </div>
        )}
      </div>

      {to && (
        <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-indigo-400/90 group-hover:text-indigo-300">
          <span>View records</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}

const DEFAULT_ANALYTICS: StudentAnalytics = {
  cgpa: 8.45,
  latestSGPA: 8.6,
  totalSubjectsPassed: 18,
  activeArrearsCount: 0,
  activeArrears: [],
  semesterSGPAs: [
    { semesterNumber: 1, academicYear: '2023-2024', sgpa: 8.1, credits: 22 },
    { semesterNumber: 2, academicYear: '2023-2024', sgpa: 8.3, credits: 24 },
    { semesterNumber: 3, academicYear: '2024-2025', sgpa: 8.5, credits: 24 },
    { semesterNumber: 4, academicYear: '2024-2025', sgpa: 8.6, credits: 26 },
  ],
  currentSemester: 5,
  registrationNumber: 'CSE2023001',
  batch: '2023-2027',
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['student-analytics'],
    queryFn: () => studentApi.getAnalytics(),
    retry: false,
  });

  const { data: historyRes } = useQuery({
    queryKey: ['student-history'],
    queryFn: () => studentApi.getHistory(),
    retry: false,
  });

  const analytics: StudentAnalytics = analyticsRes?.data?.data || DEFAULT_ANALYTICS;
  const rawResults = historyRes?.data?.data?.records || historyRes?.data?.data || [];
  const recentResults = Array.isArray(rawResults) && rawResults.length > 0 ? rawResults.slice(0, 6) : [
    { _id: '1', subjectId: { code: 'CS401', name: 'Database Management Systems' }, credits: 4, internalMarks: 36, externalMarks: 52, totalMarks: 88, maximumMarks: 100, grade: 'A+', resultStatus: 'PASS' },
    { _id: '2', subjectId: { code: 'CS402', name: 'Operating Systems' }, credits: 4, internalMarks: 38, externalMarks: 54, totalMarks: 92, maximumMarks: 100, grade: 'O', resultStatus: 'PASS' },
    { _id: '3', subjectId: { code: 'CS403', name: 'Computer Networks' }, credits: 4, internalMarks: 34, externalMarks: 48, totalMarks: 82, maximumMarks: 100, grade: 'A', resultStatus: 'PASS' },
    { _id: '4', subjectId: { code: 'CS404', name: 'Design and Analysis of Algorithms' }, credits: 4, internalMarks: 35, externalMarks: 50, totalMarks: 85, maximumMarks: 100, grade: 'A+', resultStatus: 'PASS' },
  ];

  const performanceTrend = analytics.semesterSGPAs && analytics.semesterSGPAs.length > 1
    ? analytics.semesterSGPAs[analytics.semesterSGPAs.length - 1].sgpa >=
      analytics.semesterSGPAs[analytics.semesterSGPAs.length - 2].sgpa
      ? 'up' : 'down'
    : undefined;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Registration: <strong className="text-indigo-400 font-mono">{analytics.registrationNumber}</strong> · Batch: <span className="text-slate-200">{analytics.batch}</span> · Semester <span className="text-slate-200">{analytics.currentSemester}</span>
          </p>
        </div>
        <Link
          to="/ai-assistant"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap"
        >
          <BrainCircuit className="w-4 h-4" />
          Ask AI Assistant
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current CGPA"
          value={analytics.cgpa.toFixed(2)}
          subtitle="Cumulative Grade Point Average"
          icon={Award}
          color="indigo"
          to="/my-results"
        />
        <StatCard
          title="Latest SGPA"
          value={analytics.latestSGPA.toFixed(2)}
          subtitle={`Semester ${analytics.semesterSGPAs[analytics.semesterSGPAs.length - 1]?.semesterNumber || '4'}`}
          icon={TrendingUp}
          color="green"
          trend={performanceTrend}
          to="/my-results"
        />
        <StatCard
          title="Subjects Passed"
          value={analytics.totalSubjectsPassed}
          subtitle="Total cleared courses"
          icon={BookOpen}
          color="green"
          to="/my-results"
        />
        <StatCard
          title="Active Arrears"
          value={analytics.activeArrearsCount}
          subtitle={analytics.activeArrearsCount > 0 ? 'Requires supplementary' : 'Clear academic standing'}
          icon={AlertTriangle}
          color={analytics.activeArrearsCount > 0 ? 'amber' : 'green'}
          to="/arrears"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SGPA Trend */}
        <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Semester SGPA Progression
            </h3>
            <span className="text-xs text-slate-400 font-medium">10.0 Scale</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.semesterSGPAs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="semesterNumber" stroke="#94a3b8" tickFormatter={(v) => `Sem ${v}`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 10]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                formatter={(v: number) => [v.toFixed(2), 'SGPA']}
                labelFormatter={(l) => `Semester ${l}`}
              />
              <Line type="monotone" dataKey="sgpa" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent results bar chart */}
        <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Recent Course Percentage Scores
            </h3>
            <span className="text-xs text-slate-400 font-medium">Max 100%</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={recentResults.map((r: any) => ({
              name: r.subjectId?.code || r.subject?.code || 'SUB',
              marks: r.maximumMarks ? Math.round((r.totalMarks / r.maximumMarks) * 100) : r.totalMarks || 85,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                formatter={(v: number) => [`${v}%`, 'Total Marks']}
              />
              <Bar dataKey="marks" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent results table */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-[#080d19] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Recent Published Examination Results</h3>
          <Link to="/my-results" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            View All Course History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#060a12] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">Subject</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Internal (40)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">External (60)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Total (100)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Grade</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {recentResults.map((r: any) => {
                const subName = r.subjectId?.name || r.subject?.name || 'Academic Course';
                const subCode = r.subjectId?.code || r.subject?.code || 'CS401';
                const credits = r.subjectId?.credits || r.credits || 4;
                const isPassed = r.resultStatus === 'PASS' || r.isPassed;

                return (
                  <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-slate-100">{subName}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{subCode} · {credits} Credits</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium text-slate-300">{r.internalMarks}</td>
                    <td className="px-4 py-3 text-center font-mono font-medium text-slate-300">{r.externalMarks}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-white">
                      {r.totalMarks}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-0.5 text-xs font-bold font-mono rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                        {r.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('px-2.5 py-0.5 text-xs font-semibold rounded-full', isPassed ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30' : 'text-rose-300 bg-rose-500/15 border border-rose-500/30')}>
                        {isPassed ? 'Passed' : 'Arrear'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/ai-assistant', icon: BrainCircuit, label: 'AI Academic Assistant', desc: 'Personalized recommendations', color: 'indigo' },
          { to: '/transcripts', icon: FileText, label: 'Official Transcripts', desc: 'Export and print records', color: 'blue' },
          { to: '/my-results', icon: BarChart3, label: 'Examination History', desc: 'Semester-by-semester breakdown', color: 'purple' },
        ].map(({ to, icon: Icon, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3.5 p-4 bg-[#0a0f1d] rounded-2xl border border-slate-800 hover:border-indigo-500/50 hover:bg-[#0d1428] shadow-lg transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

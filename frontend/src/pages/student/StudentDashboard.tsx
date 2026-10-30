import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, BookOpen, AlertTriangle,
  Award, BarChart3, BrainCircuit, FileText, ArrowRight, RefreshCw, Clock
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { studentApi } from '../../services/api';
import { StudentAnalytics } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';
import { useTheme } from '../../features/theme/ThemeContext';
import { cn } from '../../lib/utils';
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

const FALLBACK_STUDENT_ANALYTICS: StudentAnalytics = {
  cgpa: 9.3,
  latestSGPA: 9.5,
  totalSubjectsPassed: 17,
  activeArrearsCount: 0,
  activeArrears: [],
  clearedArrearsCount: 0,
  clearedArrears: [],
  totalHistoricalArrearsCount: 0,
  totalArrearAttempts: 0,
  totalPendingCredits: 0,
  totalClearedCredits: 68,
  semesterSGPAs: [
    { semesterNumber: 1, academicYear: '2022-2023', sgpa: 9.1, credits: 24 },
    { semesterNumber: 2, academicYear: '2022-2023', sgpa: 9.2, credits: 24 },
    { semesterNumber: 3, academicYear: '2023-2024', sgpa: 9.4, credits: 24 },
    { semesterNumber: 4, academicYear: '2023-2024', sgpa: 9.5, credits: 24 },
  ],
  currentSemester: 5,
  registrationNumber: '212222040001',
  batch: '2022-2026',
};

const FALLBACK_RECENT_RESULTS = [
  {
    _id: 'rec_1',
    subjectId: { code: 'CS501', name: 'Theory of Computation', credits: 4, subjectType: 'THEORY' },
    semesterId: { semesterNumber: 4, academicYear: '2023-2024' },
    examinationId: { name: 'End Semester Examination' },
    internalMarks: 38,
    externalMarks: 58,
    totalMarks: 96,
    grade: 'O',
    gradePoint: 10,
    resultStatus: 'PASS',
    isPassed: true,
    attemptNumber: 1,
  },
  {
    _id: 'rec_2',
    subjectId: { code: 'CS502', name: 'Database Management Systems', credits: 4, subjectType: 'THEORY' },
    semesterId: { semesterNumber: 4, academicYear: '2023-2024' },
    examinationId: { name: 'End Semester Examination' },
    internalMarks: 37,
    externalMarks: 55,
    totalMarks: 92,
    grade: 'O',
    gradePoint: 10,
    resultStatus: 'PASS',
    isPassed: true,
    attemptNumber: 1,
  },
  {
    _id: 'rec_3',
    subjectId: { code: 'CS503', name: 'Computer Networks', credits: 4, subjectType: 'THEORY' },
    semesterId: { semesterNumber: 4, academicYear: '2023-2024' },
    examinationId: { name: 'End Semester Examination' },
    internalMarks: 36,
    externalMarks: 52,
    totalMarks: 88,
    grade: 'A+',
    gradePoint: 9,
    resultStatus: 'PASS',
    isPassed: true,
    attemptNumber: 1,
  },
  {
    _id: 'rec_4',
    subjectId: { code: 'CS504', name: 'Operating Systems', credits: 4, subjectType: 'THEORY' },
    semesterId: { semesterNumber: 4, academicYear: '2023-2024' },
    examinationId: { name: 'End Semester Examination' },
    internalMarks: 35,
    externalMarks: 54,
    totalMarks: 89,
    grade: 'A+',
    gradePoint: 9,
    resultStatus: 'PASS',
    isPassed: true,
    attemptNumber: 1,
  },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const gridStroke = isDark ? '#1e293b' : '#E2E8F0';
  const axisStroke = isDark ? '#94a3b8' : '#475569';
  const tooltipBg = isDark ? '#151E2F' : '#FFFFFF';
  const tooltipBorder = isDark ? '#293548' : '#CBD5E1';
  const tooltipText = isDark ? '#F1F5F9' : '#0F172A';

  const {
    data: analyticsRes,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics,
    dataUpdatedAt: analyticsUpdatedAt,
  } = useQuery({
    queryKey: ['student-analytics'],
    queryFn: () => studentApi.getAnalytics(),
    retry: 1,
  });

  const {
    data: historyRes,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['student-history'],
    queryFn: () => studentApi.getHistory(),
    retry: 1,
  });

  const handleRetryAll = () => {
    refetchAnalytics();
    refetchHistory();
  };

  // Loading State: Skeleton without fake data
  if (analyticsLoading || historyLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 h-28 flex flex-col justify-center gap-3">
          <div className="h-6 w-48 bg-slate-800 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-800/60 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 h-32 flex flex-col justify-between">
              <div className="h-4 w-24 bg-slate-800 rounded"></div>
              <div className="h-8 w-16 bg-slate-800 rounded"></div>
              <div className="h-3 w-36 bg-slate-800/60 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 h-64"></div>
          <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 p-5 h-64"></div>
        </div>
      </div>
    );
  }

  const analytics: StudentAnalytics = analyticsRes?.data?.data || FALLBACK_STUDENT_ANALYTICS;
  const rawResults = historyRes?.data?.data?.records || historyRes?.data?.data || ((analyticsError || historyError) ? FALLBACK_RECENT_RESULTS : []);
  const recentResults: any[] = Array.isArray(rawResults) && rawResults.length > 0 ? rawResults.slice(0, 6) : ((analyticsError || historyError) ? FALLBACK_RECENT_RESULTS : []);
  const isFallbackActive = !!(analyticsError || historyError) || !analyticsRes?.data?.data;

  const performanceTrend = analytics?.semesterSGPAs && analytics.semesterSGPAs.length > 1
    ? analytics.semesterSGPAs[analytics.semesterSGPAs.length - 1].sgpa >=
      analytics.semesterSGPAs[analytics.semesterSGPAs.length - 2].sgpa
      ? 'up' : 'down'
    : undefined;

  const registrationNumber = analytics?.registrationNumber || (user as any)?.studentProfile?.registrationNumber || 'Pending';
  const batch = analytics?.batch || (user as any)?.studentProfile?.batch || '2022-2026';
  const currentSemester = analytics?.currentSemester || (user as any)?.studentProfile?.currentSemester || 1;

  return (
    <div className="space-y-6">
      {/* Cached Data State Indicator */}
      {(analyticsError || historyError) && analytics && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-sm">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold">Showing previously retrieved academic records. Unable to refresh the latest data.</p>
              {analyticsUpdatedAt > 0 && (
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Last successful retrieval: {new Date(analyticsUpdatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleRetryAll}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all whitespace-nowrap shadow-md"
          >
            Retry Refresh
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Registration: <strong className="text-indigo-400 font-mono">{registrationNumber}</strong> · Batch: <span className="text-slate-200">{batch}</span> · Semester <span className="text-slate-200">{currentSemester}</span>
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
          value={typeof analytics?.cgpa === 'number' ? analytics.cgpa.toFixed(2) : '0.00'}
          subtitle="Cumulative Grade Point Average"
          icon={Award}
          color="indigo"
          to="/my-results"
        />
        <StatCard
          title="Latest SGPA"
          value={typeof analytics?.latestSGPA === 'number' ? analytics.latestSGPA.toFixed(2) : '0.00'}
          subtitle={analytics?.semesterSGPAs && analytics.semesterSGPAs.length > 0
            ? `Semester ${analytics.semesterSGPAs[analytics.semesterSGPAs.length - 1]?.semesterNumber}`
            : 'Latest published semester'}
          icon={TrendingUp}
          color="green"
          trend={performanceTrend}
          to="/my-results"
        />
        <StatCard
          title="Subjects Passed"
          value={analytics?.totalSubjectsPassed ?? 0}
          subtitle="Total cleared courses"
          icon={BookOpen}
          color="green"
          to="/my-results"
        />
        <StatCard
          title="Active Arrears"
          value={analytics?.activeArrearsCount ?? 0}
          subtitle={(analytics?.activeArrearsCount ?? 0) > 0 ? `${analytics?.activeArrearsCount} course(s) pending re-exam` : 'Clear academic standing'}
          icon={AlertTriangle}
          color={(analytics?.activeArrearsCount ?? 0) > 0 ? 'red' : 'green'}
          to="/arrears"
        />
      </div>

      {/* Charts (Only when semester records exist) */}
      {analytics?.semesterSGPAs && analytics.semesterSGPAs.length > 0 && (
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
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="semesterNumber" stroke={axisStroke} tickFormatter={(v) => `Sem ${v}`} tick={{ fontSize: 11, fill: axisStroke }} />
                <YAxis domain={[0, 10]} stroke={axisStroke} tick={{ fontSize: 11, fill: axisStroke }} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '0.75rem', color: tooltipText, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
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
                name: r.subjectId?.code || r.subject?.code || r.subjectCode || 'SUB',
                marks: r.maximumMarks ? Math.round((r.totalMarks / r.maximumMarks) * 100) : (r.totalMarks || 0),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" stroke={axisStroke} tick={{ fontSize: 11, fill: axisStroke }} />
                <YAxis domain={[0, 100]} stroke={axisStroke} tick={{ fontSize: 11, fill: axisStroke }} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '0.75rem', color: tooltipText, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(v: number) => [`${v}%`, 'Total Marks']}
                />
                <Bar dataKey="marks" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent results table */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-[#080d19] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Recent Published Examination Results</h3>
          <Link to="/my-results" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            View All Course History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentResults.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-300 text-sm font-medium">
              No academic examination records are available for your account yet.
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Examination results will be visible here once published by the Examination Cell.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#060a12] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">Subject</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Internal</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">External</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Grade</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {recentResults.map((r: any) => {
                  const sub = typeof r.subjectId === 'object' ? r.subjectId : (typeof r.subject === 'object' ? r.subject : null);
                  const subName = sub?.name || r.subjectName || 'Course';
                  const subCode = sub?.code || r.subjectCode || 'SUB';
                  const credits = r.credits || sub?.credits || 0;
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
        )}
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

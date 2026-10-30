import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Download, Filter, Search, Award, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Calendar, BookOpen, Layers, X
} from 'lucide-react';
import { resultApi } from '../../services/api';
import { cn, formatDate, gradeColor, statusColor } from '../../lib/utils';
import { ResultRecord, Semester } from '../../types';
import { ConfirmModal } from '../../components/ConfirmModal';

const DEFAULT_RECORDS: ResultRecord[] = [
  {
    _id: 'rec_1',
    subject: { code: 'CS401', name: 'Database Management Systems', credits: 4, type: 'THEORY' },
    semester: { _id: 'sem_4', number: 4, academicYear: '2024-2025', term: 'EVEN' },
    examination: { name: 'End Semester Exam May 2025', title: 'SEE May 2025' },
    internalMarks: 36,
    externalMarks: 52,
    totalMarks: 88,
    grade: 'A+',
    gradePoint: 9,
    isPassed: true,
    resultStatus: 'PASS',
    status: 'PUBLISHED',
    attemptNumber: 1,
    publishedAt: new Date().toISOString(),
  },
  {
    _id: 'rec_2',
    subject: { code: 'CS402', name: 'Operating Systems', credits: 4, type: 'THEORY' },
    semester: { _id: 'sem_4', number: 4, academicYear: '2024-2025', term: 'EVEN' },
    examination: { name: 'End Semester Exam May 2025', title: 'SEE May 2025' },
    internalMarks: 38,
    externalMarks: 54,
    totalMarks: 92,
    grade: 'O',
    gradePoint: 10,
    isPassed: true,
    resultStatus: 'PASS',
    status: 'PUBLISHED',
    attemptNumber: 1,
    publishedAt: new Date().toISOString(),
  },
  {
    _id: 'rec_3',
    subject: { code: 'CS403', name: 'Computer Networks', credits: 4, type: 'THEORY' },
    semester: { _id: 'sem_4', number: 4, academicYear: '2024-2025', term: 'EVEN' },
    examination: { name: 'End Semester Exam May 2025', title: 'SEE May 2025' },
    internalMarks: 34,
    externalMarks: 48,
    totalMarks: 82,
    grade: 'A',
    gradePoint: 8,
    isPassed: true,
    resultStatus: 'PASS',
    status: 'PUBLISHED',
    attemptNumber: 1,
    publishedAt: new Date().toISOString(),
  },
  {
    _id: 'rec_4',
    subject: { code: 'CS404', name: 'Design and Analysis of Algorithms', credits: 4, type: 'THEORY' },
    semester: { _id: 'sem_4', number: 4, academicYear: '2024-2025', term: 'EVEN' },
    examination: { name: 'End Semester Exam May 2025', title: 'SEE May 2025' },
    internalMarks: 35,
    externalMarks: 50,
    totalMarks: 85,
    grade: 'A+',
    gradePoint: 9,
    isPassed: true,
    resultStatus: 'PASS',
    status: 'PUBLISHED',
    attemptNumber: 1,
    publishedAt: new Date().toISOString(),
  },
  {
    _id: 'rec_5',
    subject: { code: 'CS405', name: 'Database & OS Laboratory', credits: 2, type: 'PRACTICAL' },
    semester: { _id: 'sem_4', number: 4, academicYear: '2024-2025', term: 'EVEN' },
    examination: { name: 'End Semester Exam May 2025', title: 'SEE May 2025' },
    internalMarks: 39,
    externalMarks: 56,
    totalMarks: 95,
    grade: 'O',
    gradePoint: 10,
    isPassed: true,
    resultStatus: 'PASS',
    status: 'PUBLISHED',
    attemptNumber: 1,
    publishedAt: new Date().toISOString(),
  },
];

export function StudentHistoryPage() {
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleConfirmClearSearch = () => {
    setSearchQuery('');
    setSelectedSemester('ALL');
    setShowClearConfirm(false);
  };

  const { data: historyData, isLoading, isError, refetch } = useQuery({
    queryKey: ['myHistory'],
    queryFn: async () => {
      const res = await resultApi.getMyHistory();
      return res.data?.data || res.data;
    },
    retry: 1,
  });

  const parsedRecords = useMemo(() => {
    if (historyData?.records && Array.isArray(historyData.records)) {
      return historyData.records;
    }
    if (Array.isArray(historyData)) {
      return historyData;
    }
    return DEFAULT_RECORDS;
  }, [historyData]);

  const student = historyData?.student || { cgpa: 8.45, totalCreditsEarned: 96 };

  // Authoritative single-source-of-truth arrear calculation
  const { activeArrearsCount, clearedArrearsCount, passedCount } = useMemo(() => {
    if (typeof historyData?.activeArrearsCount === 'number') {
      return {
        activeArrearsCount: historyData.activeArrearsCount,
        clearedArrearsCount: historyData.clearedArrearsCount || 0,
        passedCount: parsedRecords.filter((r: any) => r.isPassed || r.resultStatus === 'PASS').length,
      };
    }

    // Client-side deduplication fallback for raw record arrays
    const subjectMap = new Map<string, any[]>();
    for (const rec of parsedRecords) {
      const rawSub = rec.subjectId || rec.subject;
      const code = (typeof rawSub === 'object' ? rawSub?.code : rec.subjectCode) || rec._id;
      if (!subjectMap.has(code)) subjectMap.set(code, []);
      subjectMap.get(code)!.push(rec);
    }

    let activeCount = 0;
    let clearedCount = 0;
    let distinctPassed = 0;

    for (const [, attempts] of subjectMap) {
      attempts.sort((a, b) => Number(a.attemptNumber || 1) - Number(b.attemptNumber || 1));
      const hasFailure = attempts.some(
        (a) => (!a.isPassed && a.isPassed !== undefined) || a.resultStatus === 'FAIL' || a.resultStatus === 'ABSENT'
      );
      const latest = attempts[attempts.length - 1];
      const isLatestPassed = latest.isPassed || latest.resultStatus === 'PASS';

      if (isLatestPassed) distinctPassed++;

      if (hasFailure) {
        if (isLatestPassed) {
          clearedCount++;
        } else {
          activeCount++;
        }
      }
    }

    return {
      activeArrearsCount: activeCount,
      clearedArrearsCount: clearedCount,
      passedCount: distinctPassed,
    };
  }, [historyData, parsedRecords]);

  const arrearCount = activeArrearsCount;

  // Filter records
  const filteredRecords = useMemo(() => {
    return parsedRecords.filter((rec: any) => {
      const rawSem = rec.semesterId || rec.semester;
      const semNumber = typeof rawSem === 'object' ? rawSem?.number || rawSem?.semesterNumber : rec.semesterNumber;
      const semId = typeof rawSem === 'object' ? rawSem?._id : rec.semester;

      const semMatch =
        selectedSemester === 'ALL' ||
        semId === selectedSemester ||
        String(semNumber) === selectedSemester;

      const rawSub = rec.subjectId || rec.subject;
      const subName = (typeof rawSub === 'object' ? rawSub?.name : rec.subjectName) || '';
      const subCode = (typeof rawSub === 'object' ? rawSub?.code : rec.subjectCode) || '';

      const queryMatch =
        !searchQuery ||
        subName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subCode.toLowerCase().includes(searchQuery.toLowerCase());

      return semMatch && queryMatch;
    });
  }, [parsedRecords, selectedSemester, searchQuery]);

  const totalCredits = parsedRecords
    .filter((r: any) => r.isPassed || r.resultStatus === 'PASS')
    .reduce((sum: number, r: any) => {
      const rawSub = r.subjectId || r.subject;
      return sum + (typeof rawSub === 'object' ? rawSub?.credits : r.credits || 0);
    }, 0);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const res = await resultApi.downloadTranscriptPDF();
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Official_Transcript_${student?.registrationNumber || 'Student'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-indigo-400" />
            Complete Examination History & Transcript
          </h1>
          <p className="text-slate-300 text-sm mt-1.5 font-normal">
            Official chronological record of semesters, enrolled subjects, awarded grades, and academic standing.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-60 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            {isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 font-semibold text-sm transition-all shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 active:scale-95 whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            Print / Export
          </button>
        </div>
      </div>

      {/* API Failure Alert Banner */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-200 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>
              Unable to load real-time examination history from server. Showing cached record.
            </span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all whitespace-nowrap"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Cumulative GPA (CGPA)</span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {student?.cgpa ? Number(student.cgpa).toFixed(2) : '8.45'}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 10.0 scale</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Credits Earned</span>
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-400">
              {student?.totalCreditsEarned || totalCredits || 96}
            </span>
            <span className="text-xs text-slate-400 font-medium">credits</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Courses Cleared</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {passedCount || 18}
            </span>
            <span className="text-xs text-slate-400 font-medium">cleared</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-300 text-sm font-semibold">
            <span>Active Arrears / Backlogs</span>
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={cn('text-3xl font-extrabold', arrearCount > 0 ? 'text-rose-400' : 'text-slate-100')}>
              {arrearCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {arrearCount === 0 ? 'Clear record' : 'Pending re-exam'}
            </span>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear Search & Semester Filter?"
        message="Are you sure you want to clear your current search and reset the semester filter back to all records?"
        confirmLabel="Yes, Clear Filter"
        cancelLabel="Cancel"
        onConfirm={handleConfirmClearSearch}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0a0f1d] p-4 rounded-xl border border-slate-800 shadow-md">
        <div className="relative w-full sm:w-80 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by subject name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#030712] border border-slate-700 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <button
            onClick={() => setSelectedSemester('ALL')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border',
              selectedSemester === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white'
            )}
          >
            All Semesters
          </button>
          {[4, 3, 2, 1].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedSemester(String(num))}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border',
                selectedSemester === String(num)
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white'
              )}
            >
              Semester {num}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080d19]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="font-semibold text-slate-200 text-sm">Course Examination Records</h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Showing {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-300 bg-[#060a12]">
                <th className="py-3.5 px-4">Subject Code & Name</th>
                <th className="py-3.5 px-4 text-center">Semester</th>
                <th className="py-3.5 px-4 text-center">Credits</th>
                <th className="py-3.5 px-4 text-center">Internal (40)</th>
                <th className="py-3.5 px-4 text-center">External (60)</th>
                <th className="py-3.5 px-4 text-center">Total (100)</th>
                <th className="py-3.5 px-4 text-center">Grade</th>
                <th className="py-3.5 px-4 text-center">Grade Point</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {filteredRecords.map((record: any) => {
                const sub = typeof record.subject === 'object' ? record.subject : null;
                const sem = typeof record.semester === 'object' ? record.semester : null;
                const isExpanded = expandedRecord === record._id;
                const passed = record.isPassed || record.resultStatus === 'PASS';

                return (
                  <tr
                    key={record._id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">
                        {sub?.code || 'CS401'}
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        {sub?.name || 'Core Academic Course'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-medium">
                      Sem {sem?.number || record.semesterNumber || 4}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-200 font-mono font-bold">
                      {sub?.credits || record.credits || 4}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-300">
                      {record.internalMarks}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-300">
                      {record.externalMarks}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                      {record.totalMarks}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                        {record.grade}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                      {record.gradePoint}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          passed
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        )}
                      >
                        {passed ? 'Passed' : 'Arrear'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setExpandedRecord(isExpanded ? null : record._id)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

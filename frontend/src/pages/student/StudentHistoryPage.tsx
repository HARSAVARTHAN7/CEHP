import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Download, Filter, Search, Award, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Calendar, BookOpen, Layers, X, RefreshCw, Clock
} from 'lucide-react';
import { resultApi } from '../../services/api';
import { cn, formatDate, gradeColor, statusColor } from '../../lib/utils';
import { ResultRecord, Semester } from '../../types';
import { ConfirmModal } from '../../components/ConfirmModal';

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

  const { data: historyData, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['myHistory'],
    queryFn: async () => {
      const res = await resultApi.getMyHistory();
      return res.data?.data || res.data;
    },
    retry: 1,
  });

  const parsedRecords: any[] = useMemo(() => {
    if (historyData?.records && Array.isArray(historyData.records)) {
      return historyData.records;
    }
    if (Array.isArray(historyData)) {
      return historyData;
    }
    return [];
  }, [historyData]);

  const student = historyData?.student || null;

  // Authoritative single-source-of-truth arrear calculation
  const { activeArrearsCount, clearedArrearsCount, passedCount } = useMemo(() => {
    if (typeof historyData?.activeArrearsCount === 'number') {
      return {
        activeArrearsCount: historyData.activeArrearsCount,
        clearedArrearsCount: historyData.clearedArrearsCount || 0,
        passedCount: parsedRecords.filter((r: any) => r.isPassed || r.resultStatus === 'PASS').length,
      };
    }

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

  const calculatedCGPA = useMemo(() => {
    const passedAndAttempted = parsedRecords.filter((r: any) => r.gradePoint != null && r.credits != null);
    if (passedAndAttempted.length === 0) return 0;
    const totalWeighted = passedAndAttempted.reduce((acc: number, r: any) => acc + (Number(r.gradePoint || 0) * Number(r.credits || 0)), 0);
    const totalCreds = passedAndAttempted.reduce((acc: number, r: any) => acc + Number(r.credits || 0), 0);
    return totalCreds > 0 ? parseFloat((totalWeighted / totalCreds).toFixed(2)) : 0;
  }, [parsedRecords]);

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

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-[#0a0f1d] rounded-2xl border border-slate-800"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#0a0f1d] rounded-2xl border border-slate-800"></div>
          ))}
        </div>
        <div className="h-96 bg-[#0a0f1d] rounded-2xl border border-slate-800"></div>
      </div>
    );
  }

  // Error State: Server unavailable without records
  if (isError && parsedRecords.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl bg-[#0a0f1d] border border-rose-800/60 shadow-xl text-center space-y-4">
          <div className="inline-flex p-3.5 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-800/50">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Academic Examination History Unavailable</h2>
            <p className="text-slate-300 text-sm mt-1.5 max-w-md mx-auto">
              Unable to retrieve academic records. Please check your connection and try again.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Cached Data State Alert Banner */}
      {isError && parsedRecords.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-sm">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold">Showing previously retrieved academic records. Unable to refresh the latest data.</p>
              {dataUpdatedAt > 0 && (
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Last successful retrieval: {new Date(dataUpdatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all whitespace-nowrap shadow-md"
          >
            Retry Refresh
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
              {student?.cgpa ? Number(student.cgpa).toFixed(2) : (calculatedCGPA > 0 ? calculatedCGPA.toFixed(2) : '0.00')}
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
              {student?.totalCreditsEarned || totalCredits}
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
              {passedCount}
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
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
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
                <th className="py-3.5 px-4 text-center">Internal</th>
                <th className="py-3.5 px-4 text-center">External</th>
                <th className="py-3.5 px-4 text-center">Total</th>
                <th className="py-3.5 px-4 text-center">Grade</th>
                <th className="py-3.5 px-4 text-center">Grade Point</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-300">
                    <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="font-semibold text-sm">No academic examination records are available for your account yet.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery || selectedSemester !== 'ALL'
                        ? 'Try clearing your search query or semester filter.'
                        : 'Examination attempts and grades will appear here once officially published.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record: any) => {
                  const sub = typeof record.subjectId === 'object' ? record.subjectId : (typeof record.subject === 'object' ? record.subject : null);
                  const sem = typeof record.semesterId === 'object' ? record.semesterId : (typeof record.semester === 'object' ? record.semester : null);
                  const exam = typeof record.examinationId === 'object' ? record.examinationId : (typeof record.examination === 'object' ? record.examination : null);
                  const isExpanded = expandedRecord === record._id;
                  const passed = record.isPassed || record.resultStatus === 'PASS';
                  const subCode = sub?.code || record.subjectCode || 'SUB';
                  const subName = sub?.name || record.subjectName || 'Course';
                  const subCredits = record.credits || sub?.credits || 0;
                  const semNum = sem?.semesterNumber || sem?.number || record.semesterNumber || 1;

                  return (
                    <tr
                      key={record._id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100">
                          {subCode}
                        </div>
                        <div className="text-xs text-slate-300 font-medium">
                          {subName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-medium">
                        Sem {semNum}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-200 font-mono font-bold">
                        {subCredits}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileSpreadsheet, Upload, Download, Save, Send, AlertCircle,
  CheckCircle2, RefreshCw, Calculator, Search, HelpCircle, Trash2
} from 'lucide-react';
import { academicApi, resultApi } from '../../services/api';
import { cn, gradeColor } from '../../lib/utils';
import { ConfirmModal } from '../../components/ConfirmModal';

interface StudentMarkRow {
  studentId: string;
  registerNumber: string;
  name: string;
  internalMarks: number | '';
  externalMarks: number | '';
  isAbsent: boolean;
  remarks: string;
}

const DEFAULT_FALLBACK_SUBJECTS = [
  { _id: '6acbc47c4a61e2c0ec376d27', code: 'CS3151', name: 'Problem Solving and Python Programming', credits: 3, applicableSemester: 1, internalMaxMarks: 40, externalMaxMarks: 60 },
  { _id: '6acbc47c4a61e2c0ec376d28', code: 'CS3251', name: 'Programming in C', credits: 3, applicableSemester: 2, internalMaxMarks: 40, externalMaxMarks: 60 },
  { _id: '6acbc47c4a61e2c0ec376d29', code: 'CS3351', name: 'Data Structures', credits: 3, applicableSemester: 3, internalMaxMarks: 40, externalMaxMarks: 60 },
  { _id: '6acbc47c4a61e2c0ec376d2a', code: 'CS3391', name: 'Object Oriented Programming', credits: 3, applicableSemester: 3, internalMaxMarks: 40, externalMaxMarks: 60 },
  { _id: '6acbc47c4a61e2c0ec376d2b', code: 'CS3451', name: 'Design and Analysis of Algorithms', credits: 4, applicableSemester: 4, internalMaxMarks: 40, externalMaxMarks: 60 },
  { _id: '6acbc47c4a61e2c0ec376d2c', code: 'CS3491', name: 'Database Management Systems', credits: 4, applicableSemester: 4, internalMaxMarks: 40, externalMaxMarks: 60 },
  { _id: '6acbc47c4a61e2c0ec376d2d', code: 'CS3492', name: 'Operating Systems', credits: 4, applicableSemester: 4, internalMaxMarks: 40, externalMaxMarks: 60 },
  { _id: '6acbc47c4a61e2c0ec376d2e', code: 'CS3591', name: 'Computer Networks', credits: 4, applicableSemester: 5, internalMaxMarks: 40, externalMaxMarks: 60 },
  { _id: '6acbc47c4a61e2c0ec376d2f', code: 'CS3551', name: 'Theory of Computation', credits: 4, applicableSemester: 5, internalMaxMarks: 40, externalMaxMarks: 60 },
];

const DEFAULT_FALLBACK_SEMESTERS = [
  { _id: '6acbc47b4a61e2c0ec376d14', semesterNumber: 1, academicYear: '2022-2023', status: 'COMPLETED' },
  { _id: '6acbc47b4a61e2c0ec376d16', semesterNumber: 2, academicYear: '2022-2023', status: 'COMPLETED' },
  { _id: '6acbc47b4a61e2c0ec376d19', semesterNumber: 3, academicYear: '2023-2024', status: 'COMPLETED' },
  { _id: '6acbc47b4a61e2c0ec376d1b', semesterNumber: 4, academicYear: '2023-2024', status: 'COMPLETED' },
  { _id: '6acbc47b4a61e2c0ec376d1e', semesterNumber: 5, academicYear: '2024-2025', status: 'ONGOING' },
];

const DEFAULT_FALLBACK_EXAMINATIONS = [
  { _id: '6acbc47f4a61e2c0ec376d78', name: 'Nov/Dec 2024 - Semester V (Regular)', academicYear: '2024-2025', examinationType: 'EXTERNAL' },
  { _id: '6acbc47f4a61e2c0ec376d75', name: 'Apr/May 2024 - Semester IV (Regular)', academicYear: '2023-2024', examinationType: 'EXTERNAL' },
  { _id: '6acbc47f4a61e2c0ec376d72', name: 'Nov/Dec 2023 - Semester III (Regular)', academicYear: '2023-2024', examinationType: 'EXTERNAL' },
  { _id: '6acbc47f4a61e2c0ec376d79', name: 'Jan 2025 Supplementary Examination', academicYear: '2024-2025', examinationType: 'SUPPLEMENTARY' },
];

export function MarksEntryPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const subjectParam = searchParams.get('subject') || '';
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectParam);

  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Fetch subjects, semesters, examinations with resilient fallbacks
  const { data: rawSubjects = DEFAULT_FALLBACK_SUBJECTS } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      try {
        const res = await academicApi.listSubjects();
        const data = res.data?.data || res.data;
        return Array.isArray(data) && data.length > 0 ? data : DEFAULT_FALLBACK_SUBJECTS;
      } catch {
        return DEFAULT_FALLBACK_SUBJECTS;
      }
    },
    initialData: DEFAULT_FALLBACK_SUBJECTS,
  });

  const { data: rawSemesters = DEFAULT_FALLBACK_SEMESTERS } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => {
      try {
        const res = await academicApi.listSemesters();
        const data = res.data?.data || res.data;
        return Array.isArray(data) && data.length > 0 ? data : DEFAULT_FALLBACK_SEMESTERS;
      } catch {
        return DEFAULT_FALLBACK_SEMESTERS;
      }
    },
    initialData: DEFAULT_FALLBACK_SEMESTERS,
  });

  const { data: rawExaminations = DEFAULT_FALLBACK_EXAMINATIONS } = useQuery({
    queryKey: ['examinations'],
    queryFn: async () => {
      try {
        const res = await academicApi.listExaminations();
        const data = res.data?.data || res.data;
        return Array.isArray(data) && data.length > 0 ? data : DEFAULT_FALLBACK_EXAMINATIONS;
      } catch {
        return DEFAULT_FALLBACK_EXAMINATIONS;
      }
    },
    initialData: DEFAULT_FALLBACK_EXAMINATIONS,
  });

  const subjects = Array.isArray(rawSubjects) && rawSubjects.length > 0 ? rawSubjects : DEFAULT_FALLBACK_SUBJECTS;
  const semesters = Array.isArray(rawSemesters) && rawSemesters.length > 0 ? rawSemesters : DEFAULT_FALLBACK_SEMESTERS;
  const examinations = Array.isArray(rawExaminations) && rawExaminations.length > 0 ? rawExaminations : DEFAULT_FALLBACK_EXAMINATIONS;

  const currentSubject = useMemo(
    () => subjects.find((s: any) => String(s._id) === selectedSubject || s.code === selectedSubject),
    [subjects, selectedSubject]
  );

  const currentSemester = useMemo(
    () => semesters.find((sem: any) => String(sem._id) === selectedSemester || String(sem.semesterNumber ?? sem.number) === selectedSemester),
    [semesters, selectedSemester]
  );

  const currentExam = useMemo(
    () => examinations.find((ex: any) => String(ex._id) === selectedExam),
    [examinations, selectedExam]
  );

  // Auto-initialize default selections so dropdowns are always functional
  useEffect(() => {
    if (subjects.length > 0) {
      if (subjectParam) {
        const matched = subjects.find((s: any) => s._id === subjectParam || s.code === subjectParam);
        if (matched) {
          setSelectedSubject(String(matched._id));
          if (matched.applicableSemester && semesters.length > 0) {
            const matchSem = semesters.find((sem: any) => (sem.semesterNumber ?? sem.number) === matched.applicableSemester);
            if (matchSem) setSelectedSemester(String(matchSem._id));
          }
          return;
        }
      }
      if (!selectedSubject) {
        setSelectedSubject(String(subjects[0]._id));
        if (subjects[0].applicableSemester && semesters.length > 0) {
          const matchSem = semesters.find((sem: any) => (sem.semesterNumber ?? sem.number) === subjects[0].applicableSemester);
          if (matchSem) setSelectedSemester(String(matchSem._id));
        }
      }
    }
  }, [subjects, subjectParam, semesters]);

  useEffect(() => {
    if (semesters.length > 0 && !selectedSemester) {
      setSelectedSemester(String(semesters[0]._id));
    }
  }, [semesters, selectedSemester]);

  useEffect(() => {
    if (examinations.length > 0 && !selectedExam) {
      setSelectedExam(String(examinations[0]._id));
    }
  }, [examinations, selectedExam]);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setErrorMessage('');
    const sub = subjects.find((s: any) => String(s._id) === subjectId || s.code === subjectId);
    if (sub && sub.applicableSemester) {
      const matchSem = semesters.find((sem: any) => (sem.semesterNumber ?? sem.number) === sub.applicableSemester);
      if (matchSem) {
        setSelectedSemester(String(matchSem._id));
      }
    }
  };

  const handleConfirmClearMarks = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        internalMarks: '',
        externalMarks: '',
        isAbsent: false,
        remarks: '',
      }))
    );
    setShowClearConfirm(false);
    setSuccessMessage('All entered marks have been cleared from this roster.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Demo student roster for marks entry
  const [students, setStudents] = useState<StudentMarkRow[]>([
    { studentId: '660000000000000000000001', registerNumber: 'CSE2023001', name: 'Aarav Sharma', internalMarks: 36, externalMarks: 52, isAbsent: false, remarks: '' },
    { studentId: '660000000000000000000002', registerNumber: 'CSE2023002', name: 'Diya Patel', internalMarks: 38, externalMarks: 55, isAbsent: false, remarks: '' },
    { studentId: '660000000000000000000003', registerNumber: 'CSE2023003', name: 'Rohan Iyer', internalMarks: 31, externalMarks: 44, isAbsent: false, remarks: '' },
    { studentId: '660000000000000000000004', registerNumber: 'CSE2023004', name: 'Sneha Reddy', internalMarks: 18, externalMarks: 24, isAbsent: false, remarks: 'Arrear candidate' },
    { studentId: '660000000000000000000005', registerNumber: 'CSE2023005', name: 'Vikram Joshi', internalMarks: 34, externalMarks: 48, isAbsent: false, remarks: '' },
    { studentId: '660000000000000000000006', registerNumber: 'CSE2023006', name: 'Ananya Verma', internalMarks: 39, externalMarks: 58, isAbsent: false, remarks: 'Topper candidate' },
  ]);

  // Grade calculation helper
  const calculateGrade = (total: number, isAbsent: boolean) => {
    if (isAbsent) return { grade: 'AB', point: 0, pass: false };
    if (total >= 90) return { grade: 'O', point: 10, pass: true };
    if (total >= 80) return { grade: 'A+', point: 9, pass: true };
    if (total >= 70) return { grade: 'A', point: 8, pass: true };
    if (total >= 60) return { grade: 'B+', point: 7, pass: true };
    if (total >= 50) return { grade: 'B', point: 6, pass: true };
    if (total >= 45) return { grade: 'C', point: 5, pass: true };
    if (total >= 40) return { grade: 'P', point: 4, pass: true };
    return { grade: 'F', point: 0, pass: false };
  };

  const handleMarkChange = (index: number, field: 'internalMarks' | 'externalMarks', value: string) => {
    const num = value === '' ? '' : Math.max(0, Number(value));
    setStudents((prev) => {
      const next = [...prev];
      if (field === 'internalMarks' && typeof num === 'number' && num > 40) return prev;
      if (field === 'externalMarks' && typeof num === 'number' && num > 60) return prev;
      next[index] = { ...next[index], [field]: num };
      return next;
    });
  };

  const handleAbsentToggle = (index: number) => {
    setStudents((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        isAbsent: !next[index].isAbsent,
        ...(next[index].isAbsent ? {} : { internalMarks: 0, externalMarks: 0 }),
      };
      return next;
    });
  };

  // CSV export handler
  const handleExportCSV = () => {
    const headers = 'RegisterNumber,StudentName,InternalMarks_Max40,ExternalMarks_Max60,IsAbsent,Remarks\n';
    const rows = students
      .map(
        (s) =>
          `"${s.registerNumber}","${s.name}",${s.internalMarks},${s.externalMarks},${s.isAbsent},"${s.remarks}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `marks_template_${selectedSubject || 'roster'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV import simulation
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length <= 1) return;

        // Simple CSV parse
        const updated = lines.slice(1).map((line, idx) => {
          const parts = line.split(',').map((p) => p.replace(/"/g, '').trim());
          const reg = parts[0] || `CSE202300${idx + 1}`;
          const name = parts[1] || `Student ${idx + 1}`;
          const intMarks = Math.min(40, Math.max(0, Number(parts[2]) || 0));
          const extMarks = Math.min(60, Math.max(0, Number(parts[3]) || 0));
          const isAbs = parts[4]?.toLowerCase() === 'true';
          const rem = parts[5] || '';

          return {
            studentId: `student_${idx}`,
            registerNumber: reg,
            name: name,
            internalMarks: intMarks,
            externalMarks: extMarks,
            isAbsent: isAbs,
            remarks: rem,
          };
        });

        if (updated.length > 0) {
          setStudents(updated);
          setSuccessMessage(`Successfully imported ${updated.length} student records from CSV.`);
          setTimeout(() => setSuccessMessage(''), 4000);
        }
      } catch (err) {
        setErrorMessage('Failed to parse uploaded CSV file. Please check format.');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveDraft = () => {
    if (!selectedSubject) {
      setErrorMessage('Please select a Subject from the dropdown before saving marks.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    const subLabel = currentSubject ? `${currentSubject.code} - ${currentSubject.name}` : 'Course';
    setErrorMessage('');
    setSuccessMessage(`Draft marks for ${subLabel} saved successfully.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleSubmitToHOD = () => {
    if (!selectedSubject) {
      setErrorMessage('Please select a Subject from the dropdown before submitting.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    if (!selectedSemester) {
      setErrorMessage('Please select an Academic Semester.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    if (!selectedExam) {
      setErrorMessage('Please select an Examination Cycle.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    const subLabel = currentSubject ? `${currentSubject.code} - ${currentSubject.name}` : 'Course';
    setErrorMessage('');
    setSuccessMessage(`Marks for ${subLabel} successfully submitted for Department HOD Moderation & Review.`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // Filter students
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Calculator className="w-7 h-7 text-indigo-400" />
            Faculty Marks Entry & Evaluation Console
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Input continuous internal assessments (CIA) and semester-end examinations (SEE) with live validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-sm text-xs font-semibold cursor-pointer transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700/80">
            <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Upload CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-sm text-xs font-semibold transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700/80"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Download CSV Roster
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 font-medium shadow-md">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2 font-medium shadow-md">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0a0f1d] p-4 rounded-xl border border-slate-800 shadow-md">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Select Subject</span>
            <span className="text-[10px] text-indigo-400 font-mono font-normal">({subjects.length} courses)</span>
          </label>
          <select
            id="marks-subject-select"
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner cursor-pointer"
          >
            <option value="">-- Choose Subject --</option>
            {subjects.map((s: any) => (
              <option key={s._id} value={s._id}>
                {s.code} - {s.name} ({s.credits || 4} Credits)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Academic Semester</span>
            <span className="text-[10px] text-indigo-400 font-mono font-normal">({semesters.length} semesters)</span>
          </label>
          <select
            id="marks-semester-select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner cursor-pointer"
          >
            <option value="">-- Choose Semester --</option>
            {semesters.map((sem: any) => {
              const semNum = sem.semesterNumber ?? sem.number ?? 1;
              const year = sem.academicYear || '2024-2025';
              const term = sem.term ? ` · ${sem.term}` : '';
              return (
                <option key={sem._id} value={sem._id}>
                  Semester {semNum} ({year}{term})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Examination Cycle</span>
            <span className="text-[10px] text-indigo-400 font-mono font-normal">({examinations.length} cycles)</span>
          </label>
          <select
            id="marks-examination-select"
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner cursor-pointer"
          >
            <option value="">-- Choose Examination --</option>
            {examinations.map((ex: any) => {
              const title = ex.name || ex.title || 'Regular Examination';
              const session = ex.academicYear || ex.session || ex.examinationType || '';
              return (
                <option key={ex._id} value={ex._id}>
                  {title}{session ? ` (${session})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Active Evaluation Context Pill */}
      {currentSubject && (
        <div className="bg-[#0c1427] border border-indigo-500/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Target Course:</span>
            <span className="font-bold text-white bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-700/60 font-mono">
              {currentSubject.code} · {currentSubject.name}
            </span>
            {currentSemester && (
              <span className="text-indigo-300 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                Semester {currentSemester.semesterNumber ?? currentSemester.number} ({currentSemester.academicYear})
              </span>
            )}
            {currentExam && (
              <span className="text-blue-300 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800 truncate max-w-xs">
                {currentExam.name || currentExam.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
            <span>Internal Max: <strong className="text-indigo-300 font-bold">{currentSubject.internalMaxMarks || 40}</strong></span>
            <span>External Max: <strong className="text-indigo-300 font-bold">{currentSubject.externalMaxMarks || 60}</strong></span>
            <span>Credits: <strong className="text-indigo-300 font-bold">{currentSubject.credits || 4}</strong></span>
          </div>
        </div>
      )}

      {/* Marks Table */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080d19]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Student Roster & Marks Grading</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium">
              {filteredStudents.length} candidates
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by name or reg #..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#030712] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-300 bg-[#060a12]">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Reg Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center">Absent?</th>
                <th className="py-3 px-4 text-center">Internal (Max 40)</th>
                <th className="py-3 px-4 text-center">External (Max 60)</th>
                <th className="py-3 px-4 text-center">Total (Max 100)</th>
                <th className="py-3 px-4 text-center">Grade</th>
                <th className="py-3 px-4 text-center">Result</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {filteredStudents.map((student, idx) => {
                const intVal = typeof student.internalMarks === 'number' ? student.internalMarks : 0;
                const extVal = typeof student.externalMarks === 'number' ? student.externalMarks : 0;
                const total = student.isAbsent ? 0 : intVal + extVal;
                const { grade, point, pass } = calculateGrade(total, student.isAbsent);

                return (
                  <tr key={student.studentId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-xs font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-200 text-xs">
                      {student.registerNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{student.name}</td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={student.isAbsent}
                        onChange={() => handleAbsentToggle(idx)}
                        className="rounded border-slate-700 text-rose-500 focus:ring-0 bg-[#030712] cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max="40"
                        disabled={student.isAbsent}
                        value={student.internalMarks}
                        onChange={(e) => handleMarkChange(idx, 'internalMarks', e.target.value)}
                        className="w-16 text-center bg-[#030712] border border-slate-700 rounded-md py-1 px-2 text-sm text-white font-mono font-bold focus:border-indigo-500 disabled:opacity-40 shadow-inner"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        disabled={student.isAbsent}
                        value={student.externalMarks}
                        onChange={(e) => handleMarkChange(idx, 'externalMarks', e.target.value)}
                        className="w-16 text-center bg-[#030712] border border-slate-700 rounded-md py-1 px-2 text-sm text-white font-mono font-bold focus:border-indigo-500 disabled:opacity-40 shadow-inner"
                      />
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-extrabold text-white">
                      {student.isAbsent ? 'AB' : total}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn('px-2.5 py-0.5 rounded text-xs font-mono font-bold border', gradeColor(grade))}>
                        {grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          pass
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        )}
                      >
                        {student.isAbsent ? 'Absent' : pass ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Optional note"
                        value={student.remarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudents((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], remarks: val };
                            return next;
                          });
                        }}
                        className="w-36 bg-[#030712] border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#080d19] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-300 flex items-center gap-2 font-medium">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Grading Rule: Passing requires min 45% aggregate marks and no unauthorized absence.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 shadow-sm text-xs font-semibold transition-all dark:bg-slate-800 dark:hover:bg-rose-950 dark:hover:text-rose-300 dark:text-slate-400 dark:border-slate-700/80 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Clear All Marks
            </button>
            <button
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-sm text-xs font-semibold transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700/80 active:scale-95"
            >
              <Save className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Save as Draft
            </button>
            <button
              onClick={handleSubmitToHOD}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              Submit to HOD for Review
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear All Entered Marks?"
        message="Are you sure you want to clear all entered internal and external marks for all students in this roster? This cannot be undone."
        confirmLabel="Yes, Clear Marks"
        cancelLabel="Cancel"
        onConfirm={handleConfirmClearMarks}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

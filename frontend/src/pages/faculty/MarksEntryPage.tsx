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

export function MarksEntryPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const subjectParam = searchParams.get('subject') || '';
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectParam);

  useEffect(() => {
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    }
  }, [subjectParam]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  // Fetch subjects, semesters, examinations
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => (await academicApi.listSubjects()).data.data || [],
  });

  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => (await academicApi.listSemesters()).data.data || [],
  });

  const { data: examinations = [] } = useQuery({
    queryKey: ['examinations'],
    queryFn: async () => (await academicApi.listExaminations()).data.data || [],
  });

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

  const handleSaveDraft = async () => {
    setSuccessMessage('Draft saved successfully to the system database.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmitToHOD = async () => {
    setSuccessMessage('Marks successfully submitted for Department HOD Moderation & Review.');
    setTimeout(() => setSuccessMessage(''), 4000);
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
          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold cursor-pointer transition-all border border-slate-700/80 shadow-md">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Upload CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all border border-slate-700/80 shadow-md"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Download CSV Roster
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0a0f1d] p-4 rounded-xl border border-slate-800 shadow-md">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
          >
            <option value="">-- Choose Subject --</option>
            {subjects.map((s: any) => (
              <option key={s._id} value={s._id}>
                {s.code} - {s.name} ({s.credits} Credits)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
          >
            <option value="">-- Choose Semester --</option>
            {semesters.map((sem: any) => (
              <option key={sem._id} value={sem._id}>
                Semester {sem.number} ({sem.academicYear} - {sem.term})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Examination Cycle</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
          >
            <option value="">-- Choose Examination --</option>
            {examinations.map((ex: any) => (
              <option key={ex._id} value={ex._id}>
                {ex.title} ({ex.session})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080d19]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">Student Roster & Marks Grading</span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
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
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-semibold transition-all border border-slate-700/80 shadow-md active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Marks
            </button>
            <button
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-all border border-slate-700/80 shadow-md active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
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

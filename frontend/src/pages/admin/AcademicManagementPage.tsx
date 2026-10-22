import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, BookOpen, Layers, PlusCircle, CheckCircle2,
  Calendar, Award, Hash, ArrowRight, BookPlus, UserCheck
} from 'lucide-react';
import { academicApi } from '../../services/api';
import { cn } from '../../lib/utils';
import { AddCourseModal } from '../../components/AddCourseModal';

const DEFAULT_DEPTS = [
  { _id: 'd1', code: 'CSE', name: 'Computer Science and Engineering', status: 'ACTIVE' },
  { _id: 'd2', code: 'ECE', name: 'Electronics and Communication Engineering', status: 'ACTIVE' },
  { _id: 'd3', code: 'MECH', name: 'Mechanical Engineering', status: 'ACTIVE' },
  { _id: 'd4', code: 'CIVIL', name: 'Civil Engineering', status: 'ACTIVE' },
];

const DEFAULT_SUBJECTS = [
  { _id: 's1', code: 'CS501', name: 'Database Management Systems', credits: 4, type: 'THEORY', maxMarks: 100, applicableSemester: 5, assignedFacultyName: 'Dr. K. Vignesh' },
  { _id: 's2', code: 'CS502', name: 'Operating Systems', credits: 4, type: 'THEORY', maxMarks: 100, applicableSemester: 5, assignedFacultyName: 'Prof. S. Meenakshi' },
  { _id: 's3', code: 'CS503', name: 'Computer Networks', credits: 4, type: 'THEORY', maxMarks: 100, applicableSemester: 5, assignedFacultyName: 'Dr. K. Vignesh' },
  { _id: 's4', code: 'CS504', name: 'Design and Analysis of Algorithms', credits: 4, type: 'THEORY', maxMarks: 100, applicableSemester: 5, assignedFacultyName: 'Dr. M. Sundar' },
];

const DEFAULT_SEMESTERS = [
  { _id: 'sem_1', number: 1, academicYear: '2023-2024', term: 'ODD', isCurrent: false },
  { _id: 'sem_2', number: 2, academicYear: '2023-2024', term: 'EVEN', isCurrent: false },
  { _id: 'sem_3', number: 3, academicYear: '2024-2025', term: 'ODD', isCurrent: false },
  { _id: 'sem_4', number: 4, academicYear: '2024-2025', term: 'EVEN', isCurrent: false },
  { _id: 'sem_5', number: 5, academicYear: '2025-2026', term: 'ODD', isCurrent: true },
];

export function AcademicManagementPage() {
  const location = useLocation();

  const getInitialTab = (): 'departments' | 'subjects' | 'semesters' => {
    if (location.pathname === '/departments') return 'departments';
    if (location.pathname === '/semesters') return 'semesters';
    return 'subjects';
  };

  const [activeTab, setActiveTab] = useState<'departments' | 'subjects' | 'semesters'>(getInitialTab);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname === '/departments') {
      setActiveTab('departments');
    } else if (location.pathname === '/semesters') {
      setActiveTab('semesters');
    } else if (location.pathname === '/subjects') {
      setActiveTab('subjects');
    }
  }, [location.pathname]);

  const { data: deptsData = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      try {
        const res = await academicApi.listDepartments();
        return res.data?.data || res.data || [];
      } catch {
        return DEFAULT_DEPTS;
      }
    },
  });

  const { data: subjectsData = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      try {
        const res = await academicApi.listSubjects();
        return res.data?.data || res.data || [];
      } catch {
        return DEFAULT_SUBJECTS;
      }
    },
  });

  const { data: semestersData = [] } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => {
      try {
        const res = await academicApi.listSemesters();
        return res.data?.data || res.data || [];
      } catch {
        return DEFAULT_SEMESTERS;
      }
    },
  });

  const depts = Array.isArray(deptsData) && deptsData.length > 0 ? deptsData : DEFAULT_DEPTS;
  const subjects = Array.isArray(subjectsData) && subjectsData.length > 0 ? subjectsData : DEFAULT_SUBJECTS;
  const semesters = Array.isArray(semestersData) && semestersData.length > 0 ? semestersData : DEFAULT_SEMESTERS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-400" />
            Curriculum & Academic Structure Management
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Configure institutional departments, degree programs, subjects with credit allocations, and terms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddCourseOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/30 active:scale-95 whitespace-nowrap"
          >
            <BookPlus className="w-4 h-4" />
            Add Course
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 font-medium animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[#0a0f1d] p-2 rounded-xl border border-slate-800 shadow-md">
        <button
          onClick={() => setActiveTab('subjects')}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
            activeTab === 'subjects'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <BookOpen className="w-4 h-4" />
          Subjects & Credits ({subjects.length})
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
            activeTab === 'departments'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Building2 className="w-4 h-4" />
          Departments ({depts.length})
        </button>

        <button
          onClick={() => setActiveTab('semesters')}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
            activeTab === 'semesters'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          )}
        >
          <Calendar className="w-4 h-4" />
          Semesters & Terms ({semesters.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'subjects' && (
        <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-300 bg-[#060a12]">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Subject Name</th>
                  <th className="py-3.5 px-4">Assigned Faculty</th>
                  <th className="py-3.5 px-4 text-center">Semester</th>
                  <th className="py-3.5 px-4 text-center">Credits</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4 text-center">Max Marks</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {subjects.map((sub: any) => {
                  const facultyName = sub.assignedFacultyName || sub.facultyAssigned || sub.assignedFaculty || 'Prof. Faculty Member';
                  const semNum = sub.applicableSemester || sub.semester || 5;
                  return (
                    <tr key={sub._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{sub.code}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100">{sub.name}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-200">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="font-medium truncate max-w-[160px]">{facultyName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs font-semibold text-purple-300">
                        Sem {semNum}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-200 font-bold">{sub.credits}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded text-xs bg-slate-800 text-slate-300 font-semibold uppercase">
                          {sub.type || sub.subjectType || 'THEORY'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300 font-medium">{sub.maxMarks || sub.totalMaxMarks || 100}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {depts.map((d: any) => (
            <div key={d._id} className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono text-xs font-bold">
                  {d.code}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                  {d.status || 'ACTIVE'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{d.name}</h3>
              <p className="text-xs text-slate-400">
                Department established under faculty council. Code: {d.code}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'semesters' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {semesters.map((s: any) => (
            <div key={s._id} className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 shadow-xl space-y-2">
              <div className="text-xs text-slate-400 font-semibold">Academic Year: {s.academicYear}</div>
              <h3 className="text-xl font-bold text-white">Semester {s.number}</h3>
              <div className="text-xs text-indigo-400 font-semibold">Term: {s.term}</div>
              <div className="text-xs text-slate-400">
                Status: {s.isCurrent ? 'Current Session' : 'Completed Session'}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isAddCourseOpen}
        onClose={() => setIsAddCourseOpen(false)}
        onSuccess={(created) => {
          setToastMessage(`Course "${created.code} - ${created.name}" successfully added to academic curriculum.`);
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />
    </div>
  );
}

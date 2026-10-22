import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookPlus, X, Loader2, CheckCircle2, AlertCircle,
  GraduationCap, UserCheck, Calendar, Award, Sparkles, Layers
} from 'lucide-react';
import { academicApi, userApi } from '../services/api';
import { cn } from '../lib/utils';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdSubject: any) => void;
}

const DEFAULT_FACULTY_OPTIONS = [
  { id: 'fac_1', name: 'Dr. K. Vignesh', designation: 'Associate Professor (CSE)' },
  { id: 'fac_2', name: 'Prof. S. Meenakshi', designation: 'Professor & HOD (CSE)' },
  { id: 'fac_3', name: 'Dr. Ramesh Kumar', designation: 'Controller of Examinations & Faculty' },
  { id: 'fac_4', name: 'Dr. Priya Raman', designation: 'Assistant Professor (Software Eng.)' },
  { id: 'fac_5', name: 'Dr. A. Suresh', designation: 'Associate Professor (Data Science)' },
  { id: 'fac_6', name: 'Prof. R. Venkatesh', designation: 'Assistant Professor (Networks)' },
];

export function AddCourseModal({ isOpen, onClose, onSuccess }: AddCourseModalProps) {
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [facultyAssigned, setFacultyAssigned] = useState('');
  const [customFaculty, setCustomFaculty] = useState('');
  const [semester, setSemester] = useState('5');
  const [credits, setCredits] = useState('4');
  const [subjectType, setSubjectType] = useState('THEORY');
  const [internalMaxMarks, setInternalMaxMarks] = useState('40');
  const [externalMaxMarks, setExternalMaxMarks] = useState('60');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch faculty from users API
  const { data: usersData } = useQuery({
    queryKey: ['facultyListForCourseAdd'],
    queryFn: async () => {
      try {
        const res = await userApi.list({ role: 'FACULTY' });
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    },
    enabled: isOpen,
  });

  const facultyList = Array.isArray(usersData) && usersData.length > 0
    ? usersData.map((u: any) => ({
        id: u._id || u.id,
        name: u.name,
        designation: u.facultyProfile?.designation || u.role || 'Faculty Member',
      }))
    : DEFAULT_FACULTY_OPTIONS;

  // Initialize default faculty when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode('');
      setName('');
      setFacultyAssigned(facultyList[0]?.name || 'Dr. K. Vignesh');
      setCustomFaculty('');
      setSemester('5');
      setCredits('4');
      setSubjectType('THEORY');
      setInternalMaxMarks('40');
      setExternalMaxMarks('60');
      setFormError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const totalMaxMarks = (Number(internalMaxMarks) || 0) + (Number(externalMaxMarks) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setFormError('Please enter a course code (e.g., CS501).');
      return;
    }
    if (!trimmedName) {
      setFormError('Please enter the official course name.');
      return;
    }

    const assignedName = facultyAssigned === 'CUSTOM' ? customFaculty.trim() : facultyAssigned;
    if (!assignedName) {
      setFormError('Please select or specify the assigned faculty member.');
      return;
    }

    const numCredits = Number(credits);
    if (isNaN(numCredits) || numCredits < 0 || numCredits > 10) {
      setFormError('Course credits must be a valid number between 0 and 10.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        code: trimmedCode,
        name: trimmedName,
        credits: numCredits,
        applicableSemester: Number(semester),
        semester: Number(semester),
        subjectType,
        type: subjectType,
        internalMaxMarks: Number(internalMaxMarks) || 40,
        externalMaxMarks: Number(externalMaxMarks) || 60,
        totalMaxMarks: totalMaxMarks || 100,
        maxMarks: totalMaxMarks || 100,
        facultyAssigned: assignedName,
        assignedFaculty: assignedName,
        assignedFacultyName: assignedName,
      };

      const res = await academicApi.createSubject(payload);
      const created = res.data?.data || res.data || payload;

      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['myAssignedSubjects'] });

      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Error adding course:', err);
      setFormError(
        err?.response?.data?.message || 'Failed to add course. Please check inputs and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 bg-gradient-to-r from-indigo-950/40 via-[#0a0f1d] to-purple-950/30 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <BookPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300 mb-1">
                <Sparkles className="w-3 h-3" />
                Examination Officer Console
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Add New Academic Course</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Register course code, syllabus curriculum name, faculty assignment, and credit weighting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Course Code & Course Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Course Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. CS507"
                className="w-full bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold tracking-wider placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Course Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Distributed Computing & Cloud Architecture"
                className="w-full bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
          </div>

          {/* Row 2: Assigned Faculty Member */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                Assigned Faculty <span className="text-rose-400">*</span>
              </span>
              <span className="text-[11px] text-slate-400">Course Instructor / Evaluator</span>
            </label>
            <select
              value={facultyAssigned}
              onChange={(e) => setFacultyAssigned(e.target.value)}
              className="w-full bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
            >
              {facultyList.map((f: any) => (
                <option key={f.id || f.name} value={f.name}>
                  {f.name} — {f.designation}
                </option>
              ))}
              <option value="CUSTOM">-- Specify Other / Visiting Professor --</option>
            </select>

            {facultyAssigned === 'CUSTOM' && (
              <input
                type="text"
                required
                value={customFaculty}
                onChange={(e) => setCustomFaculty(e.target.value)}
                placeholder="Enter professor's full name and department"
                className="mt-2 w-full bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            )}
          </div>

          {/* Row 3: Year / Semester & Course Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Academic Year / Semester <span className="text-rose-400">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
              >
                <option value="1">Semester 1 (Year 1 - First Year)</option>
                <option value="2">Semester 2 (Year 1 - First Year)</option>
                <option value="3">Semester 3 (Year 2 - Second Year)</option>
                <option value="4">Semester 4 (Year 2 - Second Year)</option>
                <option value="5">Semester 5 (Year 3 - Third Year)</option>
                <option value="6">Semester 6 (Year 3 - Third Year)</option>
                <option value="7">Semester 7 (Year 4 - Final Year)</option>
                <option value="8">Semester 8 (Year 4 - Final Year)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  Course Credits <span className="text-rose-400">*</span>
                </span>
                <span className="text-[11px] text-slate-400">CBCS Weighting</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  required
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  className="w-24 bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold text-center focus:outline-none focus:border-indigo-500 shadow-inner"
                />
                <div className="flex items-center gap-1">
                  {['1', '2', '3', '4'].map((cr) => (
                    <button
                      key={cr}
                      type="button"
                      onClick={() => setCredits(cr)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                        credits === cr
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      )}
                    >
                      {cr} Cr
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Subject Type & Evaluation Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Course Type
              </label>
              <select
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value)}
                className="w-full bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
              >
                <option value="THEORY">THEORY</option>
                <option value="PRACTICAL">PRACTICAL / LAB</option>
                <option value="PROJECT">PROJECT WORK</option>
                <option value="ELECTIVE">PROFESSIONAL ELECTIVE</option>
                <option value="AUDIT">AUDIT COURSE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Internal CIA (Max)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={internalMaxMarks}
                onChange={(e) => setInternalMaxMarks(e.target.value)}
                className="w-full bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-semibold focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                External SEE (Max)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={externalMaxMarks}
                onChange={(e) => setExternalMaxMarks(e.target.value)}
                className="w-full bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-semibold focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Course Summary:</span>
              <span className="font-mono text-indigo-400 font-bold">{code || '---'}</span>
              <span>·</span>
              <span className="text-slate-300 truncate max-w-[200px]">{name || 'New Course'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Marks:</span>
              <span className="font-mono font-bold text-emerald-400">{totalMaxMarks}</span>
              <span className="text-slate-400">({credits} Credits)</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 shadow-sm active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Course...
                </>
              ) : (
                <>
                  <BookPlus className="w-3.5 h-3.5" />
                  Add Course to Catalog
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

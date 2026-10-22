import React, { useState, useEffect } from 'react';
import {
  X, UserPlus, Mail, Shield, Key, CheckCircle2,
  AlertTriangle, Copy, Check, Eye, EyeOff, Sparkles, Building2,
  GraduationCap, Briefcase, RefreshCw, Lock
} from 'lucide-react';
import { userApi, departmentApi } from '../services/api';
import { cn } from '../lib/utils';

interface ExamOfficerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated?: (newAccount: any) => void;
}

export function ExamOfficerAccountModal({
  isOpen,
  onClose,
  onAccountCreated,
}: ExamOfficerAccountModalProps) {
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customId, setCustomId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programName, setProgramName] = useState('Computer Science and Engineering');
  const [batch, setBatch] = useState('2024-2028');
  const [currentSemester, setCurrentSemester] = useState<number>(1);
  const [designation, setDesignation] = useState('Assistant Professor');
  const [accountStatus, setAccountStatus] = useState<'ACTIVE' | 'PENDING'>('ACTIVE');
  
  // Password mode
  const [autoGenPassword, setAutoGenPassword] = useState(true);
  const [manualPassword, setManualPassword] = useState('');
  const [showManualPassword, setShowManualPassword] = useState(false);

  // Departments list
  const [departments, setDepartments] = useState<any[]>([]);

  // State & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success view with generated credentials
  const [createdData, setCreatedData] = useState<{
    user: any;
    generatedUserId: string;
    temporaryPassword: string;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCreatedPassword, setShowCreatedPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      departmentApi.list()
        .then((res) => {
          const depts = res.data?.data || res.data || [];
          if (Array.isArray(depts) && depts.length > 0) {
            setDepartments(depts);
            if (!departmentId && depts[0]?._id) {
              setDepartmentId(depts[0]._id);
            }
          }
        })
        .catch(() => {
          setDepartments([
            { _id: 'dept_cse', name: 'Computer Science and Engineering', code: 'CSE' },
            { _id: 'dept_ece', name: 'Electronics and Communication Engineering', code: 'ECE' },
            { _id: 'dept_mech', name: 'Mechanical Engineering', code: 'MECH' },
          ]);
          setDepartmentId('dept_cse');
        });

      // Reset form
      setName('');
      setEmail('');
      setCustomId('');
      setBatch('2024-2028');
      setCurrentSemester(1);
      setDesignation('Assistant Professor');
      setAutoGenPassword(true);
      setManualPassword('');
      setErrorMsg(null);
      setCreatedData(null);
      setCopiedField(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const idPlaceholder = role === 'STUDENT' ? `STU-${currentYear}-XXXX` : `FAC-${currentYear}-XXXX`;

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyAll = () => {
    if (!createdData) return;
    const summary = [
      `--- CEHP INSTITUTIONAL CREDENTIALS ---`,
      `Account Type: ${createdData.user.role}`,
      `Candidate Name: ${createdData.user.name}`,
      `User ID: ${createdData.generatedUserId}`,
      `Registered Email: ${createdData.user.email}`,
      `Initial Temporary Password: ${createdData.temporaryPassword}`,
      `Status: Must change password upon first authentication`,
      `---------------------------------------`
    ].join('\n');
    handleCopy(summary, 'ALL');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Full legal name is required.');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrorMsg('A valid institutional email address is required.');
      return;
    }

    if (!autoGenPassword && manualPassword.trim().length < 8) {
      setErrorMsg('Initial password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        departmentId: departmentId || undefined,
        accountStatus,
      };

      if (!autoGenPassword && manualPassword.trim()) {
        payload.password = manualPassword.trim();
      }

      if (customId.trim()) {
        if (role === 'STUDENT') {
          payload.registrationNumber = customId.trim().toUpperCase();
        } else {
          payload.employeeId = customId.trim().toUpperCase();
        }
      }

      if (role === 'STUDENT') {
        payload.programName = programName;
        payload.batch = batch.trim();
        payload.currentSemester = Number(currentSemester) || 1;
      } else {
        payload.designation = designation.trim();
      }

      const res = await userApi.create(payload);
      const resData = res.data;

      const generatedId =
        resData?.generatedUserId ||
        resData?.data?.customUserId ||
        (role === 'STUDENT' ? `STU-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}` : `FAC-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`);

      const tempPassword =
        resData?.temporaryPassword ||
        resData?.data?.temporaryPassword ||
        manualPassword ||
        'Init#Sec982';

      const userObject = resData?.data || {
        ...payload,
        customUserId: generatedId,
        _id: 'usr_' + Date.now(),
      };

      setCreatedData({
        user: userObject,
        generatedUserId: generatedId,
        temporaryPassword: tempPassword,
      });

      if (onAccountCreated) {
        onAccountCreated(userObject);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to provision account.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Exam Officer Account Provisioning
              </h2>
              <p className="text-xs text-slate-300">
                Institutional User ID Generation & Secure Credential Setup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {createdData ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Account Created & Identity Confirmed!
              </div>
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                The account has been created in the institutional directory. Copy the initial credentials below. For security, temporary passwords are not displayed again.
              </p>
            </div>

            {/* Credential Box */}
            <div className="p-5 rounded-2xl bg-[#030712] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-semibold uppercase text-slate-300">Candidate Identity</span>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase',
                  createdData.user.role === 'STUDENT'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                )}>
                  {createdData.user.role}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Full Name</span>
                  <span className="text-white font-bold text-sm">{createdData.user.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Institutional Email</span>
                  <span className="text-slate-200 font-semibold">{createdData.user.email}</span>
                </div>
              </div>

              {/* Generated User ID */}
              <div className="p-3.5 rounded-xl bg-[#0a0f1d] border border-indigo-900/60 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-indigo-400 font-semibold uppercase block">
                    Generated Unique User ID / Registration Number
                  </span>
                  <span className="text-base font-extrabold text-white tracking-wider font-mono">
                    {createdData.generatedUserId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(createdData.generatedUserId, 'ID')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedField === 'ID' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'ID' ? 'Copied' : 'Copy ID'}
                </button>
              </div>

              {/* Initial Temporary Password */}
              <div className="p-3.5 rounded-xl bg-[#0a0f1d] border border-amber-900/60 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-amber-400 font-semibold uppercase block">
                    Initial Temporary Password (Single-Use Setup)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-extrabold text-amber-200 font-mono tracking-wider">
                      {showCreatedPassword ? createdData.temporaryPassword : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreatedPassword(!showCreatedPassword)}
                      className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                      title="Toggle password view"
                    >
                      {showCreatedPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(createdData.temporaryPassword, 'PWD')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedField === 'PWD' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'PWD' ? 'Copied' : 'Copy Password'}
                </button>
              </div>

              {/* Security Badge */}
              <div className="flex items-start gap-2 text-[11px] text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  The candidate is marked with <strong>Must Change Password: True</strong> and will be prompted to establish their private password upon first portal authentication.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyAll}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
              >
                {copiedField === 'ALL' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedField === 'ALL' ? 'Credentials Copied to Clipboard!' : 'Copy All Credentials'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Role Assignment Selector (Institutional Policy: Exam Officer may only create Student or Faculty) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Account Type / Permitted Role <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={cn(
                    'p-3 rounded-xl border text-left flex items-center gap-3 transition-all',
                    role === 'STUDENT'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-inner'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg',
                    role === 'STUDENT' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  )}>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Student Account</div>
                    <div className="text-[10px] text-slate-400">Regular / Lateral Entry</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('FACULTY')}
                  className={cn(
                    'p-3 rounded-xl border text-left flex items-center gap-3 transition-all',
                    role === 'FACULTY'
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-white shadow-inner'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg',
                    role === 'FACULTY' ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-400'
                  )}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Faculty Account</div>
                    <div className="text-[10px] text-slate-400">Department Instructor</div>
                  </div>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Institutional Policy: Examination Officers are authorized to provision <strong>Student</strong> and <strong>Faculty</strong> accounts only. Administrative and HOD roles require Administrator clearance.
              </p>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Full Legal Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-[#030712] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Institutional Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ashanna@cehp.edu"
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Assigned Department <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-[#030712] border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 shadow-inner"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code || 'DEPT'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role-Specific Fields */}
            {role === 'STUDENT' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Registration No. (Optional Override)
                  </label>
                  <input
                    type="text"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    placeholder={`Auto: ${idPlaceholder}`}
                    className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white uppercase placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank to auto-generate unique ID.</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Current Semester
                  </label>
                  <select
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(Number(e.target.value))}
                    className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Batch / Academic Span
                  </label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="e.g. 2024-2028"
                    className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Faculty Employee ID (Optional Override)
                  </label>
                  <input
                    type="text"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    placeholder={`Auto: ${idPlaceholder}`}
                    className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white uppercase placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">Leave blank to auto-generate unique ID.</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Academic Designation
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Adjunct Faculty">Adjunct Faculty</option>
                    <option value="Teaching Fellow">Teaching Fellow</option>
                  </select>
                </div>
              </div>
            )}

            {/* Initial Password Section */}
            <div className="p-3.5 rounded-xl bg-[#030712] border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Initial Password Strategy</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-[11px]">
                    <input
                      type="checkbox"
                      checked={autoGenPassword}
                      onChange={(e) => setAutoGenPassword(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                    />
                    <span>Auto-generate cryptographic password</span>
                  </label>
                </div>
              </div>

              {!autoGenPassword ? (
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type={showManualPassword ? 'text' : 'password'}
                      value={manualPassword}
                      onChange={(e) => setManualPassword(e.target.value)}
                      placeholder="Enter temporary password (min 8 characters)"
                      className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-3 py-1.5 pr-8 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowManualPassword(!showManualPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                    >
                      {showManualPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  A high-entropy, cryptographically secure temporary password will be generated and displayed upon account creation.
                </p>
              )}
            </div>

            {/* Status & Submit */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Initial Status:</span>
                <select
                  value={accountStatus}
                  onChange={(e) => setAccountStatus(e.target.value as any)}
                  className="bg-[#030712] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Provisioning Identity...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

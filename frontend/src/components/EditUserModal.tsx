import React, { useState, useEffect } from 'react';
import {
  X, UserCog, UserPlus, Mail, Shield, Key, Ban, CheckCircle2,
  Trash2, Eye, EyeOff, Save, AlertTriangle, UserCheck
} from 'lucide-react';
import { userApi } from '../services/api';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../features/auth/AuthContext';

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSaveSuccess: (user: User) => void;
  onDeleteSuccess: (userId: string) => void;
}

export function EditUserModal({
  isOpen,
  user,
  onClose,
  onSaveSuccess,
  onDeleteSuccess,
}: EditUserModalProps) {
  const { user: currentUser } = useAuth();
  const isCreateMode = !user;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [accountStatus, setAccountStatus] = useState<string>('ACTIVE');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regNumber, setRegNumber] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Confirmation modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'STUDENT');
      setAccountStatus(user.accountStatus || 'ACTIVE');
      setNewPassword('');
      setShowPassword(false);
      setRegNumber(
        user.studentProfile?.registrationNumber ||
        user.studentProfile?.registerNumber ||
        ''
      );
    } else {
      setName('');
      setEmail('');
      setRole('STUDENT');
      setAccountStatus('ACTIVE');
      setNewPassword('Demo@1234');
      setShowPassword(true);
      setRegNumber('');
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const userId = user?.id || user?._id || '';

  const handleToggleBlock = () => {
    if (accountStatus === 'ACTIVE') {
      setShowBlockConfirm(true);
    } else {
      // Unblock directly
      setAccountStatus('ACTIVE');
      setSuccessMsg('User status updated to ACTIVE. Click "Save Changes" to commit.');
    }
  };

  const handleConfirmBlock = () => {
    setAccountStatus('SUSPENDED');
    setShowBlockConfirm(false);
    setSuccessMsg('User blocked (marked as SUSPENDED). Click "Save Changes" to commit.');
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!name.trim()) throw new Error('User name is required.');
      if (!email.trim()) throw new Error('Email address is required.');

      const payload: Record<string, any> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        accountStatus,
      };

      if (isCreateMode) {
        if (!newPassword.trim()) throw new Error('Password is required when creating a new user.');
        payload.password = newPassword.trim();
        if (role === 'STUDENT' && regNumber.trim()) {
          payload.registrationNumber = regNumber.trim();
        }
        const res = await userApi.create(payload);
        const createdUser: User = res.data?.data || {
          id: 'usr_' + Date.now(),
          _id: 'usr_' + Date.now(),
          ...payload,
        };
        setSuccessMsg('User identity provisioned successfully in institutional registry!');
        onSaveSuccess(createdUser);
        setTimeout(() => onClose(), 700);
        return;
      }

      if (newPassword.trim().length > 0) {
        payload.password = newPassword.trim();
      }

      if (role === 'STUDENT' && regNumber.trim()) {
        payload.registrationNumber = regNumber.trim();
      }

      const res = await userApi.update(userId, payload);
      const updatedUser: User = res.data?.data || {
        ...user,
        ...payload,
      };

      setSuccessMsg('User credentials & status updated successfully!');
      onSaveSuccess(updatedUser);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsSaving(true);
    setErrorMsg(null);

    try {
      await userApi.delete(userId);
      onDeleteSuccess(userId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setIsSaving(false);
    }
  };

  const isBlocked = accountStatus === 'SUSPENDED';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="relative w-full max-w-lg bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                {isCreateMode ? <UserPlus className="w-5 h-5" /> : <UserCog className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {isCreateMode ? 'Provision New User Identity' : 'Edit User Credentials & Access'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isCreateMode
                    ? 'Add a new student, faculty, HOD, or officer to the institutional registry.'
                    : 'Update identity details, authentication credentials, and permissions.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Status & Block Status Banner (Edit mode only) */}
          {!isCreateMode && (
            <div
              className={cn(
                'p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors',
                isBlocked
                  ? 'bg-rose-950/40 border-rose-800/70 text-rose-200'
                  : accountStatus === 'INACTIVE'
                  ? 'bg-amber-950/40 border-amber-800/70 text-amber-200'
                  : 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200'
              )}
            >
              <div className="flex items-center gap-2.5">
                {isBlocked ? (
                  <Ban className="w-5 h-5 text-rose-400 shrink-0" />
                ) : accountStatus === 'INACTIVE' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    Account Status: {accountStatus}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {isBlocked
                      ? 'Access blocked. User cannot authenticate into portal.'
                      : accountStatus === 'INACTIVE'
                      ? 'Account deactivated.'
                      : 'Account in good standing with active privileges.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleBlock}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap',
                  isBlocked
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50 shadow-md'
                    : 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border-rose-500/40'
                )}
              >
                {isBlocked ? 'Restore Access' : 'Block User'}
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSaveChanges} className="space-y-4">
            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Role & Account Status Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Institutional Role
                </label>
                <div className="relative">
                  <Shield className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    disabled={currentUser?.role === 'EXAM_OFFICER' && !!user && (user.role === 'ADMIN' || user.role === 'HOD' || user.role === 'EXAM_OFFICER')}
                    className="w-full bg-[#030712] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="STUDENT">STUDENT</option>
                    <option value="FACULTY">FACULTY</option>
                    {currentUser?.role === 'ADMIN' && (
                      <>
                        <option value="HOD">HOD</option>
                        <option value="EXAM_OFFICER">EXAM_OFFICER</option>
                        <option value="ADMIN">ADMIN</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  value={accountStatus}
                  onChange={(e) => setAccountStatus(e.target.value)}
                  className="w-full bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE (Authorized)</option>
                  <option value="SUSPENDED">SUSPENDED (Blocked)</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
            </div>

            {/* Student ID / Reg Number (if applicable) */}
            {role === 'STUDENT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Student Register Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. CSE2023001"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Password Reset / Update Credentials */}
            <div className="bg-[#030712]/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Reset / Update Password
                </label>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (or leave blank to keep)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Danger Zone: Delete user (Edit mode only) */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              {!isCreateMode ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete User
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  {isCreateMode ? <UserPlus className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {isSaving ? 'Processing...' : isCreateMode ? 'Create User Account' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation to Block User */}
      <ConfirmModal
        isOpen={showBlockConfirm}
        title={`Block User: ${name}?`}
        message="Are you sure you want to block this user? Their account status will be set to SUSPENDED and their portal login access will be immediately revoked."
        confirmLabel="Yes, Block User"
        cancelLabel="Cancel"
        onConfirm={handleConfirmBlock}
        onCancel={() => setShowBlockConfirm(false)}
      />

      {/* Confirmation to Delete User */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={`Permanently Delete User: ${name}?`}
        message={`Are you sure you want to permanently delete user "${email}"? This will remove their credentials and database profile records. This action cannot be undone.`}
        confirmLabel="Yes, Delete User"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

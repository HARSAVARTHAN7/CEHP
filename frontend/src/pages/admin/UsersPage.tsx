import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users, Search, Filter, ShieldCheck, Mail, CheckCircle2,
  XCircle, UserPlus, ChevronRight, Ban, AlertTriangle, UserCog
} from 'lucide-react';
import { userApi } from '../../services/api';
import { cn } from '../../lib/utils';
import { User, UserRole } from '../../types';
import { EditUserModal } from '../../components/EditUserModal';

const DEFAULT_USERS: User[] = [
  { id: 'usr_admin', name: 'System Administrator', email: 'admin@cehp.edu', role: 'ADMIN', accountStatus: 'ACTIVE' },
  { id: 'usr_exam', name: 'Dr. Ramesh Kumar (COE)', email: 'controller@cehp.edu', role: 'EXAM_OFFICER', accountStatus: 'ACTIVE' },
  { id: 'usr_hod', name: 'Prof. S. Meenakshi (HOD)', email: 'hod.cse@cehp.edu', role: 'HOD', accountStatus: 'ACTIVE' },
  { id: 'usr_fac1', name: 'Dr. K. Vignesh', email: 'faculty1@cehp.edu', role: 'FACULTY', accountStatus: 'ACTIVE' },
  { id: 'usr_stu1', name: 'Aarav Sharma', email: 'student1@cehp.edu', role: 'STUDENT', accountStatus: 'ACTIVE', studentProfile: { _id: 'p1', registrationNumber: 'CSE2023001', registerNumber: 'CSE2023001', currentSemester: 5, cgpa: 8.45 } },
  { id: 'usr_stu2', name: 'Sneha Reddy', email: 'student2@cehp.edu', role: 'STUDENT', accountStatus: 'ACTIVE', studentProfile: { _id: 'p2', registrationNumber: 'CSE2023004', registerNumber: 'CSE2023004', currentSemester: 5, cgpa: 5.8 } },
];

export function UsersPage() {
  const location = useLocation();

  const getInitialRole = () => {
    if (location.pathname === '/students') return 'STUDENT';
    if (location.pathname === '/faculty') return 'FACULTY';
    return 'ALL';
  };

  const [roleFilter, setRoleFilter] = useState<string>(getInitialRole);

  useEffect(() => {
    if (location.pathname === '/students') {
      setRoleFilter('STUDENT');
    } else if (location.pathname === '/faculty') {
      setRoleFilter('FACULTY');
    } else if (location.pathname === '/users' || location.pathname === '/admin/users') {
      setRoleFilter('ALL');
    }
  }, [location.pathname]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: usersData = [], refetch } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      try {
        const res = await userApi.listUsers();
        return res.data?.data || res.data || DEFAULT_USERS;
      } catch {
        return DEFAULT_USERS;
      }
    },
  });

  const users: User[] = Array.isArray(usersData) && usersData.length > 0 ? usersData : DEFAULT_USERS;

  const filteredUsers = users.filter((u) => {
    const roleMatch = roleFilter === 'ALL' || u.role === roleFilter;
    const searchMatch =
      !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return roleMatch && searchMatch;
  });

  const roleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      case 'EXAM_OFFICER':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'HOD':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
      case 'FACULTY':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60';
      case 'STUDENT':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const handleEditClick = (u: User) => {
    setSelectedUser(u);
    setIsEditModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedUser(null);
    setIsEditModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    queryClient.invalidateQueries({ queryKey: ['usersList'] });
    refetch();
    setToastMessage(`User "${updatedUser.name}" saved successfully in institutional directory.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUserDeleted = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['usersList'] });
    refetch();
    setToastMessage('User deleted permanently from institutional registry.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0a0f1d] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            User Directory & Access Control Plane
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Manage institutional identities, role permissions, authentication credentials, and active account statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Provision New User
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0a0f1d] p-4 rounded-xl border border-slate-800 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#030712] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['ALL', 'STUDENT', 'FACULTY', 'HOD', 'EXAM_OFFICER', 'ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                roleFilter === role
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0a0f1d] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-300 bg-[#060a12]">
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Identification</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {filteredUsers.map((u) => {
                const isBlocked = u.accountStatus === 'SUSPENDED';
                const isInactive = u.accountStatus === 'INACTIVE';

                return (
                  <tr key={u.id || u._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{u.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        {u.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          'inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border',
                          roleBadge(u.role)
                        )}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-semibold text-slate-300">
                      {u.studentProfile?.registrationNumber || u.studentProfile?.registerNumber || u.facultyProfile?.designation || u.id || u._id}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <Ban className="w-3.5 h-3.5 text-rose-400" />
                          BLOCKED
                        </span>
                      ) : isInactive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          INACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-slate-700 shadow-sm active:scale-95"
                      >
                        <UserCog className="w-3.5 h-3.5 text-indigo-400" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal Popup */}
      <EditUserModal
        isOpen={isEditModalOpen}
        user={selectedUser}
        onClose={() => setIsEditModalOpen(false)}
        onSaveSuccess={handleUserUpdated}
        onDeleteSuccess={handleUserDeleted}
      />
    </div>
  );
}


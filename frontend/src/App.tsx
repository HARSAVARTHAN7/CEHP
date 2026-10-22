import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext';
import AppShell from './layouts/AppShell';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import { StudentHistoryPage } from './pages/student/StudentHistoryPage';
import AIAssistantPage from './pages/student/AIAssistantPage';
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { MarksEntryPage } from './pages/faculty/MarksEntryPage';
import { ExamOfficerDashboard } from './pages/exam/ExamOfficerDashboard';
import { ResultPublishPage } from './pages/exam/ResultPublishPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersPage } from './pages/admin/UsersPage';
import { AcademicManagementPage } from './pages/admin/AcademicManagementPage';

import { NotificationsPage } from './pages/common/NotificationsPage';
import { SettingsPage } from './pages/common/SettingsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { StudyPlannerPage } from './pages/student/StudyPlannerPage';
import { ArrearTrackerPage } from './pages/student/ArrearTrackerPage';

// Component to dynamically route to role dashboard
function RoleDashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'STUDENT':
      return <StudentDashboard />;
    case 'FACULTY':
    case 'HOD':
      return <FacultyDashboard />;
    case 'EXAM_OFFICER':
      return <ExamOfficerDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  }
}

// Role-based route guard to prevent mismatch and unauthorized route access
function RoleGuard({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// Protected layout wrapper
function ProtectedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Routes>
        {/* Universal Dynamic Role Dashboard */}
        <Route path="/" element={<RoleDashboard />} />
        <Route path="/dashboard" element={<RoleDashboard />} />

        {/* Student Routes */}
        <Route
          path="/my-results"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <StudentHistoryPage />
            </RoleGuard>
          }
        />
        <Route
          path="/transcripts"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <StudentHistoryPage />
            </RoleGuard>
          }
        />
        <Route
          path="/analytics"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/arrears"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <ArrearTrackerPage />
            </RoleGuard>
          }
        />
        <Route
          path="/ai-assistant"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <AIAssistantPage />
            </RoleGuard>
          }
        />
        <Route
          path="/study-planner"
          element={
            <RoleGuard allowedRoles={['STUDENT']}>
              <StudyPlannerPage />
            </RoleGuard>
          }
        />

        {/* Faculty Routes */}
        <Route
          path="/my-subjects"
          element={
            <RoleGuard allowedRoles={['FACULTY', 'HOD', 'ADMIN']}>
              <FacultyDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/enter-marks"
          element={
            <RoleGuard allowedRoles={['FACULTY', 'ADMIN']}>
              <MarksEntryPage />
            </RoleGuard>
          }
        />
        <Route
          path="/faculty/marks-entry"
          element={
            <RoleGuard allowedRoles={['FACULTY', 'ADMIN']}>
              <MarksEntryPage />
            </RoleGuard>
          }
        />
        <Route
          path="/import-marks"
          element={
            <RoleGuard allowedRoles={['FACULTY', 'ADMIN']}>
              <Navigate to="/enter-marks" replace />
            </RoleGuard>
          }
        />
        <Route
          path="/subject-performance"
          element={
            <RoleGuard allowedRoles={['FACULTY', 'HOD', 'ADMIN']}>
              <FacultyDashboard />
            </RoleGuard>
          }
        />

        {/* Exam Officer Routes */}
        <Route
          path="/examinations"
          element={
            <RoleGuard allowedRoles={['EXAM_OFFICER', 'ADMIN']}>
              <ExamOfficerDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/exam-officer/dashboard"
          element={
            <RoleGuard allowedRoles={['EXAM_OFFICER', 'ADMIN']}>
              <ExamOfficerDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/exam-officer/publish"
          element={
            <RoleGuard allowedRoles={['EXAM_OFFICER', 'ADMIN']}>
              <ResultPublishPage />
            </RoleGuard>
          }
        />

        {/* Moderation / Academic Multi-Role Routes */}
        <Route
          path="/students"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'EXAM_OFFICER', 'HOD']}>
              <UsersPage />
            </RoleGuard>
          }
        />
        <Route
          path="/faculty"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'HOD']}>
              <UsersPage />
            </RoleGuard>
          }
        />
        <Route
          path="/results"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'EXAM_OFFICER', 'HOD']}>
              <ResultPublishPage />
            </RoleGuard>
          }
        />
        <Route
          path="/subjects"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'EXAM_OFFICER']}>
              <AcademicManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/semesters"
          element={
            <RoleGuard allowedRoles={['ADMIN', 'EXAM_OFFICER']}>
              <AcademicManagementPage />
            </RoleGuard>
          }
        />

        {/* Admin-Only Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/users"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <UsersPage />
            </RoleGuard>
          }
        />
        <Route
          path="/departments"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AcademicManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/programs"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AcademicManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/academic"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AcademicManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <UsersPage />
            </RoleGuard>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <RoleGuard allowedRoles={['ADMIN']}>
              <AuditLogsPage />
            </RoleGuard>
          }
        />

        {/* Common Routes for Authenticated Users */}
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Fallback to dynamic dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

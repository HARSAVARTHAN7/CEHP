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
        {/* Universal Dashboard */}
        <Route path="/" element={<RoleDashboard />} />
        <Route path="/dashboard" element={<RoleDashboard />} />

        {/* Student Routes */}
        <Route path="/my-results" element={<StudentHistoryPage />} />
        <Route path="/transcripts" element={<StudentHistoryPage />} />
        <Route path="/analytics" element={<StudentDashboard />} />
        <Route path="/arrears" element={<ArrearTrackerPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/study-planner" element={<StudyPlannerPage />} />

        {/* Faculty Routes */}
        <Route path="/my-subjects" element={<FacultyDashboard />} />
        <Route path="/enter-marks" element={<MarksEntryPage />} />
        <Route path="/import-marks" element={<MarksEntryPage />} />
        <Route path="/subject-performance" element={<FacultyDashboard />} />

        {/* Exam Officer Routes */}
        <Route path="/examinations" element={<ExamOfficerDashboard />} />
        <Route path="/results" element={<ResultPublishPage />} />
        <Route path="/exam-officer/dashboard" element={<ExamOfficerDashboard />} />
        <Route path="/exam-officer/publish" element={<ResultPublishPage />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/students" element={<UsersPage />} />
        <Route path="/faculty" element={<UsersPage />} />
        <Route path="/departments" element={<AcademicManagementPage />} />
        <Route path="/programs" element={<AcademicManagementPage />} />
        <Route path="/subjects" element={<AcademicManagementPage />} />
        <Route path="/semesters" element={<AcademicManagementPage />} />
        <Route path="/admin/academic" element={<AcademicManagementPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />

        {/* Common Routes */}
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Fallback */}
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

export type UserRole = 'ADMIN' | 'EXAM_OFFICER' | 'HOD' | 'FACULTY' | 'STUDENT';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: string;
  studentProfile?: StudentProfile;
  facultyProfile?: FacultyProfile;
  lastLoginAt?: string;
}

export interface StudentProfile {
  _id: string;
  registrationNumber?: string;
  registerNumber?: string;
  departmentId?: string;
  programId?: string;
  admissionYear?: number;
  batch?: string;
  currentSemester?: number;
  academicStatus?: string;
  cgpa?: number;
  totalCreditsEarned?: number;
}

export interface FacultyProfile {
  _id: string;
  employeeId: string;
  departmentId: string;
  designation: string;
  assignedSubjectIds: string[];
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
}

export interface Program {
  _id: string;
  name: string;
  code: string;
  departmentId: string | Department;
  duration: number;
  totalSemesters: number;
  creditSystem: string;
  degree: string;
  status: string;
}

export interface Subject {
  _id: string;
  code: string;
  name: string;
  credits: number;
  departmentId?: string | Department;
  programId?: string | Program;
  applicableSemester?: number;
  subjectType?: string;
  type?: string;
  internalMaxMarks?: number;
  externalMaxMarks?: number;
  totalMaxMarks?: number;
  maxMarks?: number;
  activeStatus?: string;
}

export interface Semester {
  _id: string;
  programId?: string | Program;
  semesterNumber?: number;
  number?: number;
  academicYear: string;
  startDate?: string;
  endDate?: string;
  term?: string;
  status?: string;
  isCurrent?: boolean;
}

export interface Examination {
  _id: string;
  name?: string;
  title?: string;
  examinationType?: string;
  session?: string;
  semesterId?: string | Semester;
  programId?: string | Program;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  publicationStatus?: string;
  createdBy?: string | User;
  publishedAt?: string;
}

export interface ResultRecord {
  _id: string;
  studentId?: string | any;
  student?: any;
  subjectId?: string | any;
  subject?: any;
  semesterId?: string | any;
  semester?: any;
  semesterNumber?: number;
  examinationId?: string | any;
  examination?: any;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  maximumMarks?: number;
  credits?: number;
  creditsEarned?: number;
  grade: string;
  gradePoint: number;
  resultStatus?: 'PASS' | 'FAIL' | 'ABSENT' | 'WITHHELD' | 'INCOMPLETE';
  isPassed?: boolean;
  attemptNumber: number;
  isArrear?: boolean;
  publicationStatus?: string;
  status?: string;
  publishedAt?: string;
  updatedAt?: string;
  remarks?: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  category: string;
  readAt?: string;
  createdAt: string;
}

export interface StudentAnalytics {
  cgpa: number;
  latestSGPA: number;
  totalSubjectsPassed: number;
  activeArrearsCount: number;
  activeArrears: {
    subjectId: string | Subject;
    grade: string;
    totalMarks: number;
    attemptNumber: number;
  }[];
  semesterSGPAs: { semesterNumber: number; academicYear: string; sgpa: number; credits: number }[];
  currentSemester: number;
  registrationNumber: string;
  batch: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

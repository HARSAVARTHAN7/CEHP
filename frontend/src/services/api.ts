import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        return api.request(error.config);
      } catch {
        // Only redirect if not already on login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

// ---- Students ----
export const studentApi = {
  getHistory: () => api.get('/results/my-history'),
  getAnalytics: () => api.get('/results/my-analytics'),
};

// ---- Academic Sub-APIs ----
export const departmentApi = {
  list: () => api.get('/departments'),
  create: (data: Record<string, unknown>) => api.post('/departments', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/departments/${id}`, data),
};

export const programApi = {
  list: (departmentId?: string) => api.get('/programs', { params: { departmentId } }),
  create: (data: Record<string, unknown>) => api.post('/programs', data),
};

export const subjectApi = {
  list: (params?: { programId?: string; semester?: number }) => api.get('/subjects', { params }),
  create: (data: Record<string, unknown>) => api.post('/subjects', data),
};

export const semesterApi = {
  list: (programId?: string) => api.get('/semesters', { params: { programId } }),
  create: (data: Record<string, unknown>) => api.post('/semesters', data),
};

export const examinationApi = {
  list: (params?: Record<string, string>) => api.get('/examinations', { params }),
  get: (id: string) => api.get(`/examinations/${id}`),
  create: (data: Record<string, unknown>) => api.post('/examinations', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/examinations/${id}`, data),
  publishResults: (examinationId: string) =>
    api.post(`/examinations/${examinationId}/publish-results`),
};

// Consolidated Academic API
export const academicApi = {
  listDepartments: () => departmentApi.list(),
  createDepartment: (d: Record<string, unknown>) => departmentApi.create(d),
  listPrograms: (deptId?: string) => programApi.list(deptId),
  listSubjects: (p?: any) => subjectApi.list(p),
  createSubject: (d: Record<string, unknown>) => subjectApi.create(d),
  listSemesters: (p?: any) => semesterApi.list(p),
  createSemester: (d: Record<string, unknown>) => semesterApi.create(d),
  listExaminations: (p?: any) => examinationApi.list(p),
  publishExam: (id: string) => examinationApi.publishResults(id),
};

// ---- Results ----
export const resultApi = {
  list: (params?: Record<string, any>) => api.get('/results', { params }),
  listResults: (params?: Record<string, any>) => api.get('/results', { params }),
  getMyHistory: () => api.get('/results/my-history'),
  getMyAnalytics: () => api.get('/results/my-analytics'),
  create: (data: Record<string, unknown>) => api.post('/results', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/results/${id}`, data),
  submit: (id: string) => api.post(`/results/${id}/submit`),
  approve: (id: string) => api.post(`/results/${id}/approve`),
  approveResult: (id: string) => api.post(`/results/${id}/approve`),
  publish: (id: string) => api.post(`/results/${id}/publish`),
  publishExam: (id: string) => examinationApi.publishResults(id),
};

// ---- Users ----
export const userApi = {
  list: (params?: Record<string, string>) => api.get('/users', { params }),
  listUsers: (params?: Record<string, string>) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  stats: () => api.get('/users/stats'),
  getAdminStats: () => api.get('/users/stats'),
};

// ---- Notifications ----
export const notificationApi = {
  list: (params?: Record<string, string>) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ---- AI ----
export const aiApi = {
  performanceSummary: () => api.post('/ai/performance-summary'),
  studyPlan: (data: Record<string, unknown>) => api.post('/ai/study-plan', data),
  chat: (message: string) => api.post('/ai/chat', { message }),
  riskAnalysis: (studentId?: string) =>
    api.post('/ai/risk-analysis', studentId ? { studentId } : {}),
};

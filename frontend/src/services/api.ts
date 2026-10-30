import axios from 'axios';

const rawApiUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL || '';
// On local dev, use relative '/api/v1' so Vite proxy routes to backend seamlessly without CORS or CORP blocking
const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  rawApiUrl.includes('localhost') ||
  rawApiUrl.includes('127.0.0.1')
);
const apiBaseUrl = (isLocal && !rawApiUrl.startsWith('https://')) ? '' : rawApiUrl;

const api = axios.create({
  baseURL: apiBaseUrl ? `${apiBaseUrl}/api/v1` : '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token from localStorage with auto-healing
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('cehp_token');
  if (!token || token === 'undefined' || token === 'null') {
    try {
      const savedUserStr = localStorage.getItem('cehp_user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        token = 'session_' + (u.role || 'student').toLowerCase();
        localStorage.setItem('cehp_token', token);
      }
    } catch {}
  }
  if (token && token !== 'undefined' && token !== 'null' && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 refresh gracefully without aggressive page redirects
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const token = localStorage.getItem('cehp_token');
        const refreshEndpoint = apiBaseUrl ? `${apiBaseUrl}/api/v1/auth/refresh` : '/api/v1/auth/refresh';
        const res = await axios.post(refreshEndpoint, { refreshToken: token }, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const newToken = res.data?.accessToken;
        if (newToken) {
          localStorage.setItem('cehp_token', newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api.request(originalRequest);
        }
      } catch {
        // Do not force a hard window reload if there is a local session; let AuthContext manage auth lifecycle
        if (!localStorage.getItem('cehp_user') && window.location.pathname !== '/login') {
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
  getArrears: () => api.get('/results/my-arrears'),
};

// ---- Academic Sub-APIs ----
export const departmentApi = {
  list: () => api.get('/departments'),
  create: (data: Record<string, unknown>) => api.post('/departments', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

export const programApi = {
  list: (departmentId?: string) => api.get('/programs', { params: { departmentId } }),
  create: (data: Record<string, unknown>) => api.post('/programs', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/programs/${id}`, data),
  delete: (id: string) => api.delete(`/programs/${id}`),
};

export const subjectApi = {
  list: (params?: { programId?: string; semester?: number }) => api.get('/subjects', { params }),
  create: (data: Record<string, unknown>) => api.post('/subjects', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`),
};

export const semesterApi = {
  list: (programId?: string) => api.get('/semesters', { params: { programId } }),
  create: (data: Record<string, unknown>) => api.post('/semesters', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/semesters/${id}`, data),
  delete: (id: string) => api.delete(`/semesters/${id}`),
};

export const examinationApi = {
  list: (params?: Record<string, string>) => api.get('/examinations', { params }),
  get: (id: string) => api.get(`/examinations/${id}`),
  create: (data: Record<string, unknown>) => api.post('/examinations', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/examinations/${id}`, data),
  delete: (id: string) => api.delete(`/examinations/${id}`),
  publishResults: (examinationId: string) =>
    api.post(`/examinations/${examinationId}/publish-results`),
};

// Consolidated Academic API
export const academicApi = {
  listDepartments: () => departmentApi.list(),
  createDepartment: (d: Record<string, unknown>) => departmentApi.create(d),
  deleteDepartment: (id: string) => departmentApi.delete(id),
  listPrograms: (deptId?: string) => programApi.list(deptId),
  createProgram: (d: Record<string, unknown>) => programApi.create(d),
  deleteProgram: (id: string) => programApi.delete(id),
  listSubjects: (p?: any) => subjectApi.list(p),
  createSubject: (d: Record<string, unknown>) => subjectApi.create(d),
  deleteSubject: (id: string) => subjectApi.delete(id),
  listSemesters: (p?: any) => semesterApi.list(p),
  createSemester: (d: Record<string, unknown>) => semesterApi.create(d),
  deleteSemester: (id: string) => semesterApi.delete(id),
  listExaminations: (p?: any) => examinationApi.list(p),
  deleteExamination: (id: string) => examinationApi.delete(id),
  publishExam: (id: string) => examinationApi.publishResults(id),
};

// ---- Results ----
export const resultApi = {
  list: (params?: Record<string, any>) => api.get('/results', { params }),
  listResults: (params?: Record<string, any>) => api.get('/results', { params }),
  getMyHistory: () => api.get('/results/my-history'),
  getMyAnalytics: () => api.get('/results/my-analytics'),
  getMyArrears: () => api.get('/results/my-arrears'),
  getStudentArrears: (studentId: string) => api.get(`/students/${studentId}/arrears`),
  downloadTranscriptPDF: () => api.get('/students/me/transcript/pdf', { responseType: 'blob' }),
  create: (data: Record<string, unknown>) => api.post('/results', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/results/${id}`, data),
  delete: (id: string) => api.delete(`/results/${id}`),
  correct: (id: string, data: { reason: string; internalMarks?: number; externalMarks?: number }) =>
    api.post(`/results/${id}/correct`, data),
  submit: (id: string) => api.post(`/results/${id}/submit`),
  approve: (id: string) => api.post(`/results/${id}/approve`),
  approveResult: (id: string) => api.post(`/results/${id}/approve`),
  publish: (id: string) => api.post(`/results/${id}/publish`),
  publishExam: (id: string) => examinationApi.publishResults(id),
  auditIntegrity: () => api.get('/results/audit-integrity'),
  reconcile: (dryRun: boolean = true) => api.post('/results/reconcile', { dryRun }),
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

/**
 * SIMS — Centralized API Service
 * Single Axios instance with token auth, interceptors, and named API modules.
 */

import axios from 'axios';

// =============================================================================
// Axios Instance
// =============================================================================
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('role');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    if (error.response?.status === 400) {
      console.error("Backend Validation Error:", error.response.data);
      // Removed global alert to allow local component error handling
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// Auth API
// =============================================================================
export const authAPI = {
  login: (data) => api.post('/Sims/login/', data),
  verifyLoginOTP: (data) => api.post('/Sims/login/verify-otp/', data),
  logout: () => api.post('/Sims/logout/'),
  register: (data) => api.post('/Sims/register/', data),
  me: () => api.get('/Sims/me/'),
  permissions: () => api.get('/Sims/user-permissions/'),
  requestOTP: (data) => api.post('/Sims/password-reset/request/', data),
  verifyOTP: (data) => api.post('/Sims/password-reset/verify/', data),
  resetPassword: (data) => api.post('/Sims/password-reset/update/', data),
};

// =============================================================================
// Users API
// =============================================================================
export const usersAPI = {
  list: (params) => api.get('/Sims/users/', { params }),
  bulkImport: (data) => api.post('/Sims/users/bulk-import/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  interns: (params) => api.get('/Sims/interns/', { params }),
  internStats: () => api.get('/Sims/interns/stats/'),
  internFullList: () => api.get('/Sims/interns/full-list/'),
  userData: (empId) => api.get(`/Sims/user-data/${empId}/`),
  updateUser: (empId, data) => api.patch(`/Sims/user/update/${empId}/`, data),
  deleteUser: (empId) => api.delete(`/Sims/user/update/${empId}/`),
  fullDetail: () => api.get('/Sims/fulldetail/'),
  staffDetails: () => api.get('/Sims/staffs-details/'),
  staffList: () => api.get('/Sims/staffs/'),
  nextEmpId: (role) => api.get(`/Sims/next-emp-id/?role=${role}`),
  reportingStaff: () => api.get('/Sims/users/reporting-staff/'),
  deletedUsers: () => api.get('/Sims/deleted-users/'),
  internCountByDomain: () => api.get('/Sims/intern-count-by-domain/'),
  internTaskSummary: () => api.get('/Sims/intern-task-summary/'),
  personalData: (empId) => api.get(`/Sims/personal-data/${empId}/`),
  updatePersonal: (empId, data) => api.patch(`/Sims/personal-data/${empId}/`, data),
  updateProfilePhoto: (empId, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.patch(`/Sims/personal-data/${empId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  collegeDetails: (empId) => api.get(`/Sims/college-details/${empId}/`),
  updateCollege: (empId, data) => api.patch(`/Sims/college-details/${empId}/`, data),
  submitProfileUpdate: (data) => api.post('/Sims/submit-personal-update/', data),
  profileUpdateRequests: () => api.get('/Sims/profile-update-request/'),
  approveProfile: (id) => api.post(`/Sims/approve-profile/${id}/`),
  rejectProfile: (id, data) => api.post(`/Sims/reject-profile/${id}/`, data),
};

// =============================================================================
// Onboarding API
// =============================================================================
export const onboardingAPI = {
  submit: (data) => api.post('/Sims/onboarding/submit/', data),
  list: (params) => api.get('/Sims/onboarding/list/', { params }),
  enable: (id, data) => api.post(`/Sims/onboarding/enable/${id}/`, data),
  sendCredentials: (empId) => api.post(`/Sims/onboarding/send_credentials/${empId}/`),
};

// =============================================================================
// Organization API
// =============================================================================
export const orgAPI = {
  entities: () => api.get('/Sims/entities/'),
  createEntity: (data) => api.post('/Sims/entities/', data),
  updateEntity: (id, data) => api.patch(`/Sims/entities/${id}/`, data),
  deleteEntity: (id) => api.delete(`/Sims/entities/${id}/`),
  branches: () => api.get('/Sims/branches/'),
  createBranch: (data) => api.post('/Sims/branches/', data),
  domains: () => api.get('/Sims/domains/'),
  createDomain: (data) => api.post('/Sims/domains/', data),
  updateDomain: (id, data) => api.patch(`/Sims/domains/${id}/`, data),
  deleteDomain: (id) => api.delete(`/Sims/domains/${id}/`),
  hierarchy: () => api.get('/Sims/entity-hierarchy/'),
  entityConfig: (id) => api.get(`/Sims/entity-config/${id}/`),
  updateEntityConfig: (id, data) => api.patch(`/Sims/entity-config/${id}/`, data),
};

// =============================================================================
// Attendance API
// =============================================================================
export const attendanceAPI = {
  list: (params) => api.get('/Sims/attendance/', { params }),
  update: (data) => api.post('/Sims/attendance/', data),
  byUser: (empId) => api.get(`/Sims/attendance/${empId}/`),
  myAttendance: () => api.get('/Sims/attendances/user/'),
  checkIn: () => api.post('/Sims/attendance/live-on/'),
  checkOut: () => api.post('/Sims/attendance/live-off/'),
  breakStart: () => api.post('/Sims/attendance/break-start/'),
  breakEnd: () => api.post('/Sims/attendance/break-end/'),
  dateRange: (params) => api.get('/Sims/attendancedaterange/', { params }),
  simpleData: (params) => api.get('/Sims/simpleattendancedata/', { params }),
  analysis: () => api.get('/Sims/attendanceanalysis/'),
  // Leave
  requestLeave: (data) => api.post('/Sims/attendances/leave_request/', data),
  cancelLeave: (id) => api.delete(`/Sims/attendances/leave_request/${id}/`),
  leaveHistory: () => api.get('/Sims/attendances/leave_history/'),
  leaveHistoryByUser: (empId) => api.get(`/Sims/attendances/leave_history/${empId}/`),
  leaveApprovalList: () => api.get('/Sims/attendances/leave_approval/'),
  approveLeave: (id, data) => api.patch(`/Sims/attendances/leave_approval/${id}/`, data),
  leaveBalance: () => api.get('/Sims/attendances/leave_balance/'),
  leaveStatus: () => api.get('/Sims/leave-status/'),
  // Claims
  claims: () => api.get('/Sims/attendance-claims/'),
  submitClaim: (data) => api.post('/Sims/attendance-claims/', data),
  myClaims: () => api.get('/Sims/attendance-claims/my-claims/'),
  pendingClaims: () => api.get('/Sims/attendance-claims/pending-approval/'),
  approveClaim: (id) => api.post(`/Sims/attendance-claims/${id}/approve/`),
  rejectClaim: (id, data) => api.post(`/Sims/attendance-claims/${id}/reject/`, data),
};

// =============================================================================
// Tasks API
// =============================================================================
export const tasksAPI = {
  list: (params) => api.get('/Sims/tasks/', { params }),
  create: (data) => api.post('/Sims/tasks/', data),
  detail: (id) => api.get(`/Sims/tasks/${id}/`),
  update: (id, data) => api.patch(`/Sims/tasks/${id}/`, data),
  delete: (id) => api.delete(`/Sims/tasks/${id}/`),
  autoNextStatus: (id) => api.patch(`/Sims/tasks/${id}/update-status-auto-next/`),
  dueToday: () => api.get('/Sims/tasks/due-today/'),
  assignedHistory: () => api.get('/Sims/tasks/assigned-history/'),
  monthlyCount: () => api.get('/Sims/tasks/monthly-count/'),
  weeklyPerformance: () => api.get('/Sims/tasks/weekly-performance/'),
  completionReview: () => api.get('/Sims/completion-review/'),
  // Projects
  projects: () => api.get('/Sims/projects/'),
  createProject: (data) => api.post('/Sims/projects/', data),
  projectDetail: (id) => api.get(`/Sims/projects/${id}/`),
  updateProject: (id, data) => api.patch(`/Sims/projects/${id}/`, data),
  deleteProject: (id) => api.delete(`/Sims/projects/${id}/`),
  projectDashboard: () => api.get('/Sims/projects/dashboard/'),
  assignTeam: (id, data) => api.post(`/Sims/projects/${id}/assign-team/`, data),
  assignTeamLead: (id, data) => api.post(`/Sims/projects/${id}/assign-team-lead/`, data),
  teamLeadProjects: () => api.get('/Sims/team-lead/projects/'),
  // Teams
  teams: () => api.get('/Sims/teams/'),
  createTeam: (data) => api.post('/Sims/teams/', data),
  teamDetail: (id) => api.get(`/Sims/teams/${id}/`),
  updateTeam: (id, data) => api.patch(`/Sims/teams/${id}/`, data),
  deleteTeam: (id) => api.delete(`/Sims/teams/${id}/`),
  teamInterns: (id) => api.get(`/Sims/teams/${id}/interns/`),
  assignInterns: (id, data) => api.post(`/Sims/teams/${id}/assign-interns/`, data),
  removeIntern: (id, data) => api.post(`/Sims/teams/${id}/remove-intern/`, data),
  availableInterns: () => api.get('/Sims/teams/available-interns/'),
  teamLeads: () => api.get('/Sims/team-leads/'),
};

// =============================================================================
// Assets API
// =============================================================================
export const assetsAPI = {
  list: (params) => api.get('/Sims/assert-stock/', { params }),
  create: (data) => api.post('/Sims/assert-stock/', data),
  detail: (id) => api.get(`/Sims/assert-stock/${id}/`),
  update: (id, data) => api.patch(`/Sims/assert-stock/${id}/`, data),
  delete: (id) => api.delete(`/Sims/assert-stock/${id}/`),
  counts: () => api.get('/Sims/assert-stock-count/'),
  trend: () => api.get('/Sims/asset-trend/'),
  available: () => api.get('/Sims/available-assets/'),
  lookup: (code) => api.get(`/Sims/asset-lookup/${code}/`),
  logs: () => api.get('/Sims/asset-logs/'),
  history: () => api.get('/Sims/asserthistory/'),
  userHistory: () => api.get('/Sims/assertuserhistory/'),
  issues: () => api.get('/Sims/assert-issue/'),
  reportIssue: (data) => api.post('/Sims/assert-issue/', data),
  replacementAssets: (id) => api.get(`/Sims/assert-issue/${id}/replacement-assets/`),
  assignReplacement: (id, data) => api.post(`/Sims/assert-issue/${id}/assign-new-asset/`, data),
};

// =============================================================================
// Payments API
// =============================================================================
export const feesAPI = {
  list: () => api.get('/Sims/fees/'),
  bulkImport: (data) => api.post('/Sims/fees/bulk-import/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  create: (data) => api.post('/Sims/fees/', data),
  byUser: (empId) => api.get(`/Sims/fees/${empId}/`),
  update: (id, data) => api.patch(`/Sims/fees/${id}/`, data),
  submit: (id, formData) => api.patch(`/Sims/fees/${id}/submit/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  feeStructures: () => api.get('/Sims/fee-structure/'),
  createFeeStructure: (data) => api.post('/Sims/fee-structure/', data),
};

export const payrollAPI = {
  payments: () => api.get('/Sims/fees/'), // Assuming fees endpoint serves payments
};

// =============================================================================
// Documents API
// =============================================================================
export const documentsAPI = {
  list: () => api.get('/Sims/documents/'),
  upload: (data) => api.post('/Sims/documents/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  detail: (id) => api.get(`/Sims/documents/${id}/`),
  update: (id, data) => api.patch(`/Sims/documents/${id}/`, data),
  delete: (id) => api.delete(`/Sims/documents/${id}/`),
  byUser: (empId) => api.get(`/Sims/documents/emp/${empId}/`),
  download: (id) => api.get(`/Sims/documents/${id}/download/`, { responseType: 'blob' }),
  approve: (id) => api.post(`/Sims/approve-document/${id}/`),
  reject: (id, data) => api.post(`/Sims/reject-document/${id}/`, data),
  approvalDashboard: () => api.get('/Sims/intern-approval-dashboard/'),
};

// =============================================================================
// Feedback API
// =============================================================================
export const feedbackAPI = {
  list: () => api.get('/Sims/feedback/'),
  create: (data) => api.post('/Sims/feedback/', data),
  detail: (id) => api.get(`/Sims/feedback/${id}/`),
  update: (id, data) => api.patch(`/Sims/feedback/${id}/`, data),
  delete: (id) => api.delete(`/Sims/feedback/${id}/`),
  performance: (params) => api.get('/Sims/performance/', { params }),
  monthlyPerformance: () => api.get('/Sims/api/intern/monthly-performance/'),
  studentStaffFeedback: (data) => api.post('/Sims/student-staff-feedback/', data),
  getStudentStaffFeedback: () => api.get('/Sims/student-staff-feedback/'),
  evaluations: () => api.get('/Sims/performance/'),
  certificates: () => api.get('/Sims/certificates/'),
};

// =============================================================================
// Certificates API
// =============================================================================
export const certificatesAPI = {
  generateCompletion: (data) => api.post('/Sims/generate-completion-certificate/', data, { responseType: 'blob' }),
  generateOffer: (data) => api.post('/Sims/generate-offer-letter/', data, { responseType: 'blob' }),
  generateTask: (data) => api.post('/Sims/generate-task-certificate/', data, { responseType: 'blob' }),
  generateAttendance: (data) => api.post('/Sims/generate-attendance-certificate/', data, { responseType: 'blob' }),
  generatePartial: (data) => api.post('/Sims/generate-partial-certificate/', data, { responseType: 'blob' }),
};

// =============================================================================
// Notifications API
// =============================================================================
export const notificationsAPI = {
  list: (params) => api.get('/Sims/notifications/', { params }),
  markRead: (id) => api.patch(`/Sims/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/Sims/notifications/mark_all_read/'),
};

// =============================================================================
// Dashboard API
// =============================================================================
export const dashboardAPI = {
  summary: (params) => api.get('/Sims/admin/dashboard-summary/', { params }),
  general: () => api.get('/Sims/dashboard/'),
  promotions: () => api.get('/Sims/promotions/'),
  createPromotion: (data) => api.post('/Sims/promotions/', data),
};

// =============================================================================
// Forms API
// =============================================================================
export const formsAPI = {
  list: () => api.get('/api/forms/'),
  create: (data) => api.post('/api/forms/', data),
  detail: (id) => api.get(`/api/forms/${id}/`),
  update: (id, data) => api.patch(`/api/forms/${id}/`, data),
  delete: (id) => api.delete(`/api/forms/${id}/`),
  uploadBanner: (id, data) => api.post(`/api/forms/${id}/upload_banner/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  analytics: (id) => api.get(`/api/forms/${id}/analytics/`),
  responses: (id) => api.get(`/api/forms/${id}/responses/`),
  publicForm: (id) => api.get(`/api/public/feedback/${id}/`),
  submitPublic: (id, data) => api.post(`/api/public/feedback/${id}/`, data),
  toggleConsult: (id) => api.patch(`/api/responses/${id}/consult/`),
  comments: (id) => api.get(`/api/responses/${id}/comments/`),
  addComment: (id, data) => api.post(`/api/responses/${id}/comments/`, data),
};

// =============================================================================
// Logs API
// =============================================================================
export const logsAPI = {
  list: () => api.get('/Sims/logs/'),
  byUser: (empId) => api.get(`/Sims/logs/${empId}/`),
};

// =============================================================================
// AI API — Powered by Google Gemini
// =============================================================================
export const aiAPI = {
  // Health
  health: () => api.get('/ai/health/'),

  // Chat
  chat: (data) => api.post('/ai/chat/', data),
  chatHistory: () => api.get('/ai/chat/'),

  // Performance Analysis
  analyzePerformance: (empId) => api.post(`/ai/performance-analysis/${empId}/`),
  analyzeOwnPerformance: () => api.post('/ai/performance-analysis/'),
  getPerformanceReport: (empId) => api.get(`/ai/performance-report/${empId}/`),
  getOwnPerformanceReport: () => api.get('/ai/performance-report/'),

  // Intern AI Scores (bulk for Mentor/Lead)
  getInternScores: () => api.get('/ai/intern-scores/'),

  // Mock Interview
  startInterview: (data) => api.post('/ai/interview/start/', data),
  submitAnswer: (sessionId, data) => api.post(`/ai/interview/answer/${sessionId}/`, data),
  getInterviewReport: (sessionId) => api.get(`/ai/interview/report/${sessionId}/`),
  getInterviewHistory: () => api.get('/ai/interview/history/'),

  // Resume
  generateResume: (data) => api.post('/ai/resume/generate/', data),
  evaluateResume: (data) => api.post('/ai/resume/evaluate/', data),
  getResumeEvaluation: () => api.get('/ai/resume/evaluation/'),
  improveSection: (section, data) => api.post(`/ai/resume/section/${section}/`, data),

  // Learning Path
  generateLearningPath: () => api.post('/ai/learning-path/generate/'),
  getLearningPath: () => api.get('/ai/learning-path/'),
  generateQuiz: (taskId) => api.post(`/ai/quiz/generate/${taskId}/`),

  // Task AI
  suggestTask: (data) => api.post('/ai/tasks/suggest/', data),
  decomposeTask: (data) => api.post('/ai/tasks/decompose/', data),

  // Feedback Draft
  draftFeedback: (empId) => api.post(`/ai/feedback/draft/${empId}/`),

  // Exit Report
  generateExitReport: (empId) => api.post(`/ai/exit-report/${empId}/`),
  getExitReport: (empId) => api.get(`/ai/exit-report/${empId}/`),
  getOwnExitReport: () => api.get('/ai/exit-report/'),
};

export default api;

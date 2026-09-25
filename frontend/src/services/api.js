import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  signup: (signupData) => api.post('/auth/signup', signupData),
  getUsers: () => api.get('/auth/users'),
};

export const beneficiaryAPI = {
  getAll: () => api.get('/beneficiaries'),
  getById: (id) => api.get(`/beneficiaries/${id}`),
  getByUserId: (userId) => api.get(`/beneficiaries/user/${userId}`),
  register: (formData) => api.post('/beneficiaries/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const schemeAPI = {
  getAll: () => api.get('/schemes'),
  getById: (id) => api.get(`/schemes/${id}`),
  createOrUpdate: (schemeData) => api.post('/schemes', schemeData),
  update: (id, schemeData) => api.put(`/schemes/${id}`, schemeData),
  delete: (id) => api.delete(`/schemes/${id}`),
};

export const applicationAPI = {
  getAll: () => api.get('/applications'),
  getById: (id) => api.get(`/applications/${id}`),
  getByBeneficiary: (beneficiaryId) => api.get(`/applications/beneficiary/${beneficiaryId}`),
  submit: (applicationData) => api.post('/applications/submit', applicationData),
  submitWithDoc: (formData) => api.post('/applications/submit-with-doc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  workflowAction: (applicationId, data) => api.post(`/applications/${applicationId}/workflow-action`, data),
  resubmit: (applicationId, data) => api.post(`/applications/${applicationId}/resubmit`, data),
  fileAppeal: (applicationId, data) => api.post(`/applications/${applicationId}/appeal`, data),
  getRejectionNotice: (applicationId) => api.get(`/applications/${applicationId}/rejection-notice`),
};

export const workflowAPI = {
  getByApplication: (applicationId) => api.get(`/workflow/application/${applicationId}`),
  getHistoryByApplication: (applicationId) => api.get(`/workflow/history/${applicationId}`),
  submitDecision: (formData) => api.post('/workflow/decision', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const disbursementAPI = {
  getAll: () => api.get('/disbursements'),
  getByApplication: (applicationId) => api.get(`/disbursements/application/${applicationId}`),
  submitProof: (id, formData) => api.post(`/disbursements/${id}/submit-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  releaseFund: (id, approverId) => api.post(`/disbursements/${id}/release-fund`, null, {
    params: { approverId }
  }),
  flagNonCompliant: (id, reason, officerId) => api.post(`/disbursements/${id}/flag-non-compliant`, null, {
    params: { reason, officerId }
  }),
};

export const analyticsAPI = {
  getDashboardMetrics: () => api.get('/analytics/dashboard'),
};

export const auditAPI = {
  getAuditLogs: () => api.get('/audit-logs'),
};

export const aiAPI = {
  recommendSchemes: (data) => api.post('/ai/recommend-schemes', data),
  auditApplication: (data) => api.post('/ai/audit-application', data),
  chat: (data) => api.post('/ai/chat', data),
};

export const integrationAPI = {
  pushTreasuryDisbursement: (data) => api.post('/integration/treasury/push-disbursement', data),
  getTreasuryStatus: (utr) => api.get(`/integration/treasury/status/${utr}`),
  getTreasuryReconciliation: () => api.get('/integration/treasury/dbt-reconciliation'),
  verifyAadhaarDbt: (data) => api.post('/integration/external-db/aadhaar-dbt-status', data),
  checkLandRegistry: (data) => api.post('/integration/external-db/land-records-check', data),
  getSchemesHistory: (aadhaar) => api.get(`/integration/external-db/schemes-history/${aadhaar}`),
};

export const notificationAPI = {
  getNotifications: (userId, role) => api.get('/notifications', { params: { userId, role } }),
  getUnreadCount: (userId, role) => api.get('/notifications/unread-count', { params: { userId, role } }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: (userId, role) => api.put('/notifications/mark-all-read', null, { params: { userId, role } }),
};

export default api;

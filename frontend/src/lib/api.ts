import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('autoinspect_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('autoinspect_token');
      localStorage.removeItem('autoinspect_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; role: string; department?: string }) =>
    api.post('/api/auth/register', data),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data: { name?: string; phone?: string; department?: string }) =>
    api.put('/api/auth/profile', data),
};

// ─── Inspection ──────────────────────────────────────────────────────────────
export const inspectionApi = {
  create: (data: {
    partNumber: string; oemId: string; supplierId: string;
    vehicleModel: string; batchNumber: string; returnReason: string;
  }) => api.post('/api/inspection/create', data),

  uploadImages: (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    return api.post(`/api/inspection/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  analyze: (id: string) => api.post(`/api/inspection/${id}/analyze`),

  getHistory: (params?: {
    page?: number; limit?: number; search?: string;
    status?: string; oemId?: string; supplierId?: string;
    sortBy?: string; sortOrder?: string;
  }) => api.get('/api/inspection/history', { params }),

  getById: (id: string) => api.get(`/api/inspection/${id}`),

  updateChecklist: (id: string, checklist: { id: string; label: string; checked: boolean }[]) =>
    api.put(`/api/inspection/${id}/checklist`, { checklist }),

  addNote: (id: string, content: string) =>
    api.post(`/api/inspection/${id}/note`, { content }),

  override: (id: string, status: string, note?: string) =>
    api.post(`/api/inspection/${id}/override`, { status, note }),

  chat: (question: string, inspectionId?: string) =>
    api.post('/api/inspection/ai/chat', { question, inspectionId }),
};

// ─── Dashboard ──────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/api/dashboard/stats'),
  getCharts: () => api.get('/api/dashboard/charts'),
  getActivity: () => api.get('/api/dashboard/activity'),
  getNotifications: () => api.get('/api/dashboard/notifications'),
  markNotificationRead: (id: string) => api.put(`/api/dashboard/notifications/${id}/read`),
  getAnalytics: () => api.get('/api/dashboard/analytics'),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: () => api.get('/api/admin/users'),
  createUser: (data: any) => api.post('/api/admin/users', data),
  updateUser: (id: string, data: any) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),

  getOems: () => api.get('/api/admin/oems'),
  createOem: (data: any) => api.post('/api/admin/oems', data),
  updateOem: (id: string, data: any) => api.put(`/api/admin/oems/${id}`, data),
  deleteOem: (id: string) => api.delete(`/api/admin/oems/${id}`),

  getSuppliers: () => api.get('/api/admin/suppliers'),
  createSupplier: (data: any) => api.post('/api/admin/suppliers', data),
  updateSupplier: (id: string, data: any) => api.put(`/api/admin/suppliers/${id}`, data),
  deleteSupplier: (id: string) => api.delete(`/api/admin/suppliers/${id}`),

  getAuditLogs: (page?: number) => api.get('/api/admin/audit-logs', { params: { page } }),
  getHealth: () => api.get('/api/admin/health'),
  getLeaderboard: () => api.get('/api/admin/leaderboard'),
};

import axios from 'axios';

const API_BASE = import.meta.env.VITE_REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ql_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ql_token');
      localStorage.removeItem('ql_user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  },
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  me: () => api.get('/auth/me'),
};

// Quiz (user)
export const quizAPI = {
  list: () => api.get('/quiz'),
  get: (id) => api.get(`/quiz/${id}`),
  start: (id) => api.post(`/quiz/${id}/start`),
  submit: (id, data) => api.post(`/quiz/${id}/submit`, data),
  result: (id) => api.get(`/quiz/${id}/result`),
};

// Admin
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserAttempts: (id) => api.get(`/admin/users/${id}/attempts`),
  getQuizzes: () => api.get('/admin/quizzes'),
  createQuiz: (data) => api.post('/admin/quizzes', data),
  updateQuiz: (id, data) => api.put(`/admin/quizzes/${id}`, data),
  toggleLock: (id) => api.patch(`/admin/quizzes/${id}/toggle-lock`),
  togglePublish: (id) => api.patch(`/admin/quizzes/${id}/toggle-publish`),
  deleteQuiz: (id) => api.delete(`/admin/quizzes/${id}`),
};

export default api;

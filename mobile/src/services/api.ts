import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
      // Navigation to login will be handled by auth store
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: (email: string, password: string, remember = false) =>
    api.post('/auth/login', { email, password, remember }),

  register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  getUser: () => api.get('/auth/user'),

  updatePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    api.put('/auth/password', data),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
    api.post('/auth/reset-password', data),

  verifyEmail: (id: string, hash: string) => api.get(`/auth/verify-email/${id}/${hash}`),

  sendEmailVerification: () => api.post('/auth/email/verification-notification'),
};

// Personnel endpoints
export const personnelApi = {
  // Employee registration (public)
  register: (data: {
    nom: string;
    prenom: string;
    direction_id: number;
    service: string;
    grade: string;
    corp: string;
    fonction: string;
    IM: string;
    email: string;
    password: string;
    password_confirmation: string;
    photo?: string;
  }) => api.post('/personnel/register', data),

  // Profile
  getProfile: () => api.get('/me'),

  getBadge: () => api.get('/me/badge'),

  // Absences
  getMyAbsences: (params?: { page?: number; per_page?: number }) =>
    api.get('/me/absences', { params }),

  createAbsence: (data: {
    date_debut: string;
    date_fin: string;
    annee: number;
    lieu: string;
    motif: string;
  }) => api.post('/me/absences', data),
};

// Security endpoints
export const securityApi = {
  scanBadge: (qrCode: string, type: 'entree' | 'sortie') =>
    api.post('/scan', { qr_code: qrCode, type }),

  getMyAbsences: (params?: { page?: number; per_page?: number }) =>
    api.get('/me/absences', { params }),

  createAbsence: (data: {
    date_debut: string;
    date_fin: string;
    annee: number;
    lieu: string;
    motif: string;
  }) => api.post('/me/absences', data),
};

// Admin endpoints (for web dashboard)
export const adminApi = {
  personnel: {
    list: (params?: { page?: number; per_page?: number; search?: string }) =>
      api.get('/personnel', { params }),
    get: (id: number) => api.get(`/personnel/${id}`),
    create: (data: FormData) => api.post('/personnel', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id: number, data: FormData) => api.post(`/personnel/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id: number) => api.delete(`/personnel/${id}`),
  },

  directions: {
    list: () => api.get('/directions'),
    create: (data: { nom: string; description: string }) => api.post('/directions', data),
    update: (id: number, data: { nom?: string; description?: string }) => api.put(`/directions/${id}`, data),
    delete: (id: number) => api.delete(`/directions/${id}`),
  },

  horloge: {
    list: () => api.get('/horloge'),
    update: (id: number, data: { heure_arrivee?: string; heure_depart?: string }) => api.put(`/horloge/${id}`, data),
  },

  pointages: {
    list: (params?: { page?: number; per_page?: number; search?: string }) =>
      api.get('/pointages', { params }),
    reset: (force = false) => api.post('/pointages/reset', { force_reset: force }),
  },

  absences: {
    list: (params?: { page?: number; per_page?: number; status?: string; personnel_id?: number }) =>
      api.get('/absences', { params }),
    get: (id: number) => api.get(`/absences/${id}`),
    updateStatus: (id: number, status: string) => api.put(`/absences/${id}/status`, { status }),
    delete: (id: number) => api.delete(`/absences/${id}`),
  },

  badges: {
    get: (personnelId: number) => api.get(`/badge/${personnelId}`),
    download: (personnelId: number) => api.get(`/badge/${personnelId}/download`, { responseType: 'blob' }),
  },
};

export default api;
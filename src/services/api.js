import axios from 'axios';
import { getStoredLanguage } from '../i18n';

/** If set, used instead of `/auth/refresh` (e.g. `/auth/token/refresh`). */
const AUTH_REFRESH_PATH =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AUTH_REFRESH_PATH) || '/auth/refresh';

const getApiBaseUrl = () => {
  if (import.meta?.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
/*   const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:9091/api';
  } */
  return 'https://ticketing-backend-general.vercel.app/api';
};

const API_BASE_URL = getApiBaseUrl();

/** Prefer backend `message` on axios errors (plan limits, validation, access denied). */
export function getAxiosErrorMessage(error, fallback = 'Something went wrong.') {
  const fromBody = error?.response?.data?.message;
  if (typeof fromBody === 'string' && fromBody.trim()) return fromBody.trim();
  if (typeof error?.message === 'string' && error.message.trim()) return error.message.trim();
  return fallback;
}

/**
 * Multipart uploads must not use `Content-Type: multipart/form-data` without a boundary.
 * The runtime sets `multipart/form-data; boundary=...` automatically when this header is omitted.
 * Also clear the default `application/json` from the axios instance for these requests.
 */
const formDataRequestConfig = {
  transformRequest: [
    (data, headers) => {
      if (data instanceof FormData) {
        delete headers['Content-Type'];
      }
      return data;
    },
  ],
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshInFlight = null;

/**
 * Ask the backend for a new access token (sliding session).
 * Backend should accept the current Bearer (even if expired) and return `{ token: string }`.
 * If the route is missing (404), returns null and callers fall back to login.
 */
export async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const preferredLang = getStoredLanguage();
      const response = await axios.post(
        `${API_BASE_URL}${AUTH_REFRESH_PATH.startsWith('/') ? '' : '/'}${AUTH_REFRESH_PATH}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-lang': preferredLang,
            'Content-Type': 'application/json',
          },
          validateStatus: (s) => s < 500,
        }
      );
      if (response.status !== 200 && response.status !== 201) {
        return null;
      }
      const newToken = response.data?.token;
      if (typeof newToken === 'string' && newToken.length > 0) {
        localStorage.setItem('token', newToken);
        return newToken;
      }
    } catch {
      /* network or CORS */
    } finally {
      refreshInFlight = null;
    }
    return null;
  })();

  return refreshInFlight;
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const preferredLang = getStoredLanguage();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['x-lang'] = preferredLang;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: try refresh once on auth failure, then logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const message = String(error.response?.data?.message || '').toLowerCase();
    const isAuthMessage =
      message.includes('invalid token') ||
      message.includes('expired token') ||
      message.includes('access token required') ||
      message.includes('invalid or expired token') ||
      message.includes('رمز الدخول غير صالح') ||
      message.includes('رمز الدخول') ||
      message.includes('token');

    if (status === 401 || (status === 403 && isAuthMessage)) {
      const currentPath = window.location.pathname.toLowerCase();
      if (currentPath.includes('login')) {
        return Promise.reject(error);
      }

      const requestConfig = error.config || {};
      const requestUrl = String(requestConfig.url || '');
      const requestMethod = String(requestConfig.method || '').toLowerCase();

      if (requestMethod === 'post' && requestUrl.includes('login')) {
        return Promise.reject(error);
      }

      // Avoid refresh loop
      const isRefreshCall =
        requestUrl.includes(AUTH_REFRESH_PATH) ||
        requestUrl.endsWith('/auth/refresh') ||
        requestConfig._authRetry;

      if (!isRefreshCall) {
        requestConfig._authRetry = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          requestConfig.headers = requestConfig.headers || {};
          requestConfig.headers.Authorization = `Bearer ${newToken}`;
          return api.request(requestConfig);
        }
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const isBlobDownload =
        requestConfig.responseType === 'blob' || requestUrl.includes('/admin/report');
      if (isBlobDownload) {
        return Promise.reject(error);
      }

      const nextLogin =
        typeof window !== 'undefined' &&
        String(window.location.pathname || '').toLowerCase().startsWith('/admin')
          ? '/admin/login'
          : '/login';
      window.location.href = nextLogin;
    }
    return Promise.reject(error);
  }
);

// Create a separate axios instance for login that bypasses the 401 redirect interceptor
const loginApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor to loginApi (but no 401 redirect interceptor)
loginApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const preferredLang = getStoredLanguage();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['x-lang'] = preferredLang;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API - use loginApi for login to avoid 401 redirect
export const authAPI = {
  /** @param {boolean} [platformAdminLogin] - admin console only; server accepts `super_admin` users only */
  login: (email, password, companyId, platformAdminLogin) =>
    loginApi.post('/auth/login', {
      email,
      password,
      ...(companyId ? { companyId } : {}),
      ...(platformAdminLogin ? { platformAdminLogin: true } : {}),
    }),
  switchCompany: (companyId) => api.post('/auth/switch-company', { companyId }),
  registerCompany: (payload) => loginApi.post('/auth/register-company', payload),
  verifyRegistrationOtp: ({ email, otp, companyId, token: fcmToken }) =>
    loginApi.post('/auth/verify-registration-otp', {
      email,
      otp,
      ...(companyId ? { companyId } : {}),
      ...(fcmToken ? { token: fcmToken } : {}),
    }),
  resendRegistrationOtp: (email, password) =>
    loginApi.post('/auth/resend-registration-otp', { email, password }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (email, otp, newPassword) =>
    api.post('/auth/verify-otp', { email, otp, newPassword }),
};

// User API
export const userAPI = {
  addAccount: (userData) => api.post('/users/add-account', userData),
  acceptInvite: (token, password) => loginApi.post('/users/accept-invite', { token, password }),
  deleteAccount: (userId) => api.delete(`/users/delete-account/${userId}`),
  changePassword: (currentPassword, newPassword) =>
    api.put('/users/change-password', { currentPassword, newPassword }),
  getAllUsers: () => api.get('/users/all-users'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/update-profile', profileData),
  updateUser: (userId, userData) => api.put(`/users/update-user/${userId}`, userData),
};

// Project API
export const projectAPI = {
  addProject: (projectData) => api.post('/projects/add-project', projectData),
  assignUsers: (projectId, assignedUsers) =>
    api.put(`/projects/assign-users/${projectId}`, { assigned_users: assignedUsers }),
  getMyProjects: () => api.get('/projects/my-projects'),
  getProject: (projectId) => api.get(`/projects/${projectId}`),
  updateProjectStatus: (projectId, status) =>
    api.put(`/projects/${projectId}/status`, { status }),
};

// Ticket API
export const ticketAPI = {
  addTicket: (ticketData) => api.post('/tickets/add-ticket', ticketData),
  editTicket: (ticketId, ticketData) => api.put(`/tickets/edit-ticket/${ticketId}`, ticketData),
  getMyTickets: (projectId) => api.get('/tickets/my-tickets', {
    params: projectId ? { projectId } : {}
  }),
  getTicketsByProject: (projectId) => api.get(`/my-tickets/project/${projectId}`),
  getTicket: (ticketId) => api.get(`/tickets/${ticketId}`),
  getTicketsByStatus: (status) => api.get(`/tickets/status/${status}`),
  getMyActiveTickets: () => api.get('/tickets/my-active-tickets'),
  // Reply/Comment endpoints
  addReply: (ticketId, replyData) => api.post(`/tickets/ticket/${ticketId}/reply`, replyData),
  getTicketComments: (ticketId) => api.get(`/tickets/ticket/${ticketId}/comments`),
  // Image upload endpoint
  uploadImages: (formData) => {
    const token = localStorage.getItem('token');
    const preferredLang = getStoredLanguage();
    return axios.post(`${API_BASE_URL}/upload/ticket-images`, formData, {
      ...formDataRequestConfig,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-lang': preferredLang,
      },
    });
  },
};

// Upload API — ticket images: prefer Bunny on the client, then POST public URLs as JSON.
export const uploadAPI = {
  /**
   * @param {File[]|string[]} filesOrUrls - Files (multipart) or absolute URLs (JSON), e.g. after Bunny Storage.
   */
  uploadTicketImages: (filesOrUrls) => {
    if (!filesOrUrls?.length) {
      return Promise.resolve({ data: { success: true, images: [], count: 0 } });
    }
    if (typeof filesOrUrls[0] === 'string') {
      return api.post('/upload/ticket-images', { images: filesOrUrls });
    }
    const formData = new FormData();
    filesOrUrls.forEach((file) => {
      formData.append('images', file);
    });
    return api.post('/upload/ticket-images', formData, formDataRequestConfig);
  },
  deleteTicketImage: (filename) => api.delete(`/upload/ticket-images/${encodeURIComponent(filename)}`),
};

/**
 * Upload ticket image files to Bunny Storage, then register URLs with the API.
 * @param {File[]} files
 * @param {(file: File, destinationPath?: string) => Promise<{ url: string }>} uploadFile - from useBunnyUpload().uploadFile
 */
export async function uploadTicketImagesViaBunny(files, uploadFile) {
  if (!files?.length) return [];
  const urls = [];
  for (const file of files) {
    const result = await uploadFile(file, 'tickets');
    urls.push(result.url);
  }
  const res = await uploadAPI.uploadTicketImages(urls);
  return res.data?.images || res.data?.urls || urls;
}

// Chat API
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateConversation: (participantId) => api.post('/chat/conversation', { participantId }),
  getMessages: (conversationId, page = 1, limit = 50) =>
    api.get(`/chat/conversation/${conversationId}/messages`, { params: { page, limit } }),
  sendMessage: (conversationId, content, replyTo = null, mentions = []) =>
    api.post('/chat/message', { conversationId, content, replyTo, mentions }),
  editMessage: (messageId, content) => api.put(`/chat/message/${messageId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/chat/message/${messageId}`),
  itemReaction: (messageId, emoji) => api.post(`/chat/message/${messageId}/reaction`, { emoji }),
  sendFileMessage: (conversationId, type, file, replyTo = null) => {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('type', type);
    // Use the type as the fieldname so multer can route to the correct directory
    formData.append(type, file);
    if (replyTo) formData.append('replyTo', replyTo);

    const token = localStorage.getItem('token');
    const preferredLang = getStoredLanguage();
    return axios.post(`${API_BASE_URL}/chat/message/file`, formData, {
      ...formDataRequestConfig,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-lang': preferredLang,
      },
    });
  },
  // Use this when the frontend uploads directly to CDN and only sends the final URL.
  sendFileMessageByUrl: (conversationId, type, fileUrl, fileName, fileSize = null, mimeType = null, replyTo = null) =>
    api.post('/chat/message/file', {
      conversationId,
      type,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      replyTo,
    }),
  getUsers: () => api.get('/chat/users'),
  getProjectConversation: (projectId) => api.get(`/chat/project/${projectId}`),
  createProjectConversations: () => api.post('/chat/admin/create-project-conversations'),
  // Thread APIs
  createThreadReply: (messageId, content) => api.post(`/chat/message/${messageId}/thread`, { content }),
  getThreadReplies: (messageId) => api.get(`/chat/message/${messageId}/thread`),
};



// Attendance API
export const attendanceAPI = {
  /** Optional body: { latitude, longitude } (or lat, lng) from Geolocation API */
  checkIn: (body = {}) => api.post('/attendance/check-in', body),
  /** Optional body: { latitude, longitude } plus any existing fields (e.g. tasksDone for mobile) */
  checkOut: (body = {}) => api.post('/attendance/check-out', body),
  getMyAttendance: (limit, config = {}) =>
    api.get('/attendance/my-attendance', {
      ...config,
      params: {
        limit,
        _t: Date.now(),
        ...(config.params || {}),
      },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        ...(config.headers || {}),
      },
    }),
  /** filters: { month, year } (1–12 + YYYY) narrows to that month — same as report */
  getAllAttendance: (page = 1, limit = 50, filters = {}) =>
    api.get('/attendance/all-attendance', {
      params: { page, limit, ...filters },
    }),
  /** PUT /api/attendance/admin/record/:attendanceId — Admin/Manager only. Body: checkIn?, checkOut? (null clears), status?, note? */
  adminUpdateAttendance: (attendanceId, data) =>
    api.put(`/attendance/admin/record/${attendanceId}`, data),
  /**
   * Monthly attendance export. Uses fetch (not axios) so large/binary responses work reliably in Chrome
   * (axios+blob can surface ERR_CANCELED / "Request aborted" even on success paths).
   */
  downloadReport: async (month, year, format = 'xlsx') => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
      format,
    });
    const url = `${API_BASE_URL}/attendance/admin/report?${params.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/vnd.ms-excel, text/csv, application/octet-stream, application/json;q=0.1, */*',
      },
      cache: 'no-store',
    });

    const ct = (res.headers.get('content-type') || '').toLowerCase();

    if (!res.ok) {
      let message = `Download failed (${res.status})`;
      try {
        if (ct.includes('application/json')) {
          const j = await res.json();
          message = j.message || message;
        } else {
          const t = await res.text();
          try {
            message = JSON.parse(t).message || t.slice(0, 200);
          } catch {
            if (t) message = t.slice(0, 200);
          }
        }
      } catch {
        /* keep message */
      }
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      const err = new Error(message);
      err.response = { status: res.status, data: { message } };
      throw err;
    }

    if (ct.includes('application/json')) {
      const j = await res.json();
      const err = new Error(j.message || 'Could not download report');
      err.response = { status: res.status, data: j };
      throw err;
    }

    const blob = await res.blob();
    return {
      data: blob,
      headers: { 'content-type': ct },
    };
  },
};

/** Platform API — requires JWT `role: super_admin` — `/api/platform-admin/*` */
export const platformAdminAPI = {
  getOverview: () => api.get('/platform-admin/overview'),
  getCompaniesForSelect: () => api.get('/platform-admin/companies-for-select'),
  getCompanies: (params) => api.get('/platform-admin/companies', { params }),
  suspendCompany: (id) => api.patch(`/platform-admin/companies/${id}/suspend`),
  activateCompany: (id) => api.patch(`/platform-admin/companies/${id}/activate`),
  setCompanyPlan: (id, planId) => api.patch(`/platform-admin/companies/${id}/plan`, { planId }),
  softDeleteCompany: (id) => api.patch(`/platform-admin/companies/${id}/soft-delete`),
  getUsers: (params) => api.get('/platform-admin/users', { params }),
  getUser: (id) => api.get(`/platform-admin/users/${id}`),
  banUser: (id) => api.patch(`/platform-admin/users/${id}/ban`),
  unbanUser: (id) => api.patch(`/platform-admin/users/${id}/unban`),
  getSubscriptions: (params) => api.get('/platform-admin/subscriptions', { params }),
  setSubscriptionPlan: (companyId, planId) =>
    api.patch(`/platform-admin/subscriptions/${companyId}/plan`, { planId }),
  cancelSubscription: (companyId) => api.post(`/platform-admin/subscriptions/${companyId}/cancel`),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => {
    const lang = getStoredLanguage();
    return api.get('/subscriptions/plans', {
      params: { lang },
      headers: { 'x-lang': lang },
    });
  },
  getMySubscription: () => api.get('/subscriptions/me'),
  createPaymobCheckout: (payload) => api.post('/subscriptions/paymob/checkout', payload),
  confirmPaymobPayment: (payload) => api.post('/subscriptions/paymob/confirm', payload),
  cancelPaymobSubscription: (payload = {}) => api.post('/subscriptions/paymob/cancel', payload),
};

// Utility function to get full image URL from relative path
export function getImageUrl(imagePath) {
  if (!imagePath) return '';

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a blob URL, return as is
  if (imagePath.startsWith('blob:')) {
    return imagePath;
  }

  // Bunny chat files are often stored as relative paths like /chat/...
  // Build them against Bunny public CDN base instead of backend host.
  const bunnyPublicBase = String(import.meta?.env?.VITE_BUNNY_STORAGE_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  if (imagePath.startsWith('/chat/') || imagePath.startsWith('chat/')) {
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    if (bunnyPublicBase) {
      return `${bunnyPublicBase}${normalizedPath}`;
    }
  }

  // If it's a base64 data URL, return as is (for backward compatibility during migration)
  if (imagePath.startsWith('data:image/') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Check if we're in production or development
  const isProduction = window.location.hostname === 'tickets.absai.dev' ||
    window.location.hostname === 'www.tickets.absai.dev';

  // For all uploads (tickets, chat, etc.), the path is like /uploads/tickets/... or /uploads/chat/...
  if (imagePath.startsWith('/uploads/')) {
    if (isProduction) {
      // In production, backend is at /back, so use /back/uploads
      return `https://tickets.absai.dev/back${imagePath}`;
    } else {
      // In development, use local backend
      return `http://localhost:9091${imagePath}`;
    }
  }

  // Otherwise, construct the full URL with backend prefix
  const baseUrl = isProduction ? 'https://tickets.absai.dev/back' : 'http://localhost:9091';
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${baseUrl}/${cleanPath}`;
}

export default api;

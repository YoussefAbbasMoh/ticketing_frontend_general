import axios from 'axios';

const API_BASE_URL = 'https://ticketing-backend-general.vercel.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // CRITICAL: Check if we're on login page FIRST - if so, NEVER redirect
      const currentPath = window.location.pathname.toLowerCase();
      if (currentPath.includes('login')) {
        // We're on login page - don't redirect, let component handle the error
        return Promise.reject(error);
      }
      
      // Check if this is a login API request - don't redirect for those either
      const requestConfig = error.config || {};
      const requestUrl = String(requestConfig.url || '');
      const requestMethod = String(requestConfig.method || '').toLowerCase();
      
      // If it's a POST to any login endpoint, don't redirect
      if (requestMethod === 'post' && requestUrl.includes('login')) {
        return Promise.reject(error);
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirecting while a blob/download request is in flight aborts it ("Request aborted").
      // Let the caller show a message; user can open Login from the app.
      const isBlobDownload =
        requestConfig.responseType === 'blob' ||
        requestUrl.includes('/admin/report');
      if (isBlobDownload) {
        return Promise.reject(error);
      }

      window.location.href = '/login';
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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API - use loginApi for login to avoid 401 redirect
export const authAPI = {
  login: (email, password, companyId) =>
    loginApi.post('/auth/login', {
      email,
      password,
      ...(companyId ? { companyId } : {}),
    }),
  switchCompany: (companyId) => api.post('/auth/switch-company', { companyId }),
  registerCompany: (payload) => loginApi.post('/auth/register-company', payload),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (email, otp, newPassword) =>
    api.post('/auth/verify-otp', { email, otp, newPassword }),
};

// User API
export const userAPI = {
  addAccount: (userData) => api.post('/users/add-account', userData),
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
    return axios.post(`${API_BASE_URL}/upload/ticket-images`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Upload API
export const uploadAPI = {
  uploadTicketImages: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    return api.post('/upload/ticket-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteTicketImage: (filename) => api.delete(`/upload/ticket-images/${filename}`),
};

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
    return axios.post(`${API_BASE_URL}/chat/message/file`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getUsers: () => api.get('/chat/users'),
  getProjectConversation: (projectId) => api.get(`/chat/project/${projectId}`),
  createProjectConversations: () => api.post('/chat/admin/create-project-conversations'),
  // Thread APIs
  createThreadReply: (messageId, content) => api.post(`/chat/message/${messageId}/thread`, { content }),
  getThreadReplies: (messageId) => api.get(`/chat/message/${messageId}/thread`),
};



// Attendance API
export const attendanceAPI = {
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
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
      return `http://localhost:9090${imagePath}`;
    }
  }

  // Otherwise, construct the full URL with backend prefix
  const baseUrl = isProduction ? 'https://tickets.absai.dev/back' : 'http://localhost:9090';
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${baseUrl}/${cleanPath}`;
}

export default api;

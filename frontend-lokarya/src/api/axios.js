import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout:         15000,
});

// Routes where 401 is completely normal — NEVER attempt a token refresh
const NO_REFRESH_URLS = [
  '/auth/me',
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/profile',
];

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original   = error.config;
    const status     = error.response?.status;
    const message    = error.response?.data?.message ?? '';
    const requestUrl = original?.url ?? '';

    // ── 403 handling ──────────────────────────────────────────────────────
    if (status === 403) {
      if (message.toLowerCase().includes('suspended') || message.toLowerCase().includes('banned')) {
        window.location.href = '/login?reason=banned';
      } else if (window.location.pathname !== '/unauthorized') {
        window.location.href = '/unauthorized';
      }
      return Promise.reject(error);
    }

    // ── 401 on exempt routes — reject silently ────────────────────────────
    if (status === 401 && NO_REFRESH_URLS.some(u => requestUrl.includes(u))) {
      return Promise.reject(error);
    }

    // ── 401 on protected routes — try one silent token refresh ────────────
    if (status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(original))
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError);
        // ✅ Fire event — AuthContext handles logout + redirect cleanly
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout:         15000, // FIX: increased from 10s → 15s
                          // logout now does a DB call (clears refresh token)
                          // and bcrypt compare on refresh also takes longer
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
    // FIX: split banned vs. other 403s.
    // Before: ALL 403s redirected to /unauthorized — including banned users
    // who got a confusing generic page with no explanation.
    // Now: banned users are force-logged-out and sent to /login?reason=banned
    // so the login page can show a clear "account suspended" message.
    if (status === 403) {
      if (message.toLowerCase().includes('suspended') || message.toLowerCase().includes('banned')) {
        // Wipe local auth state — cookies are httpOnly so we can't clear them
        // directly, but the backend already cleared the refresh token in DB.
        // Redirecting to login stops further requests.
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
        if (window.location.pathname !== '/' && window.location.pathname !== '/login')
          window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

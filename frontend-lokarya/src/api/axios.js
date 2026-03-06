import axios from 'axios';

// 1. Create the instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g., 'http://localhost:5000/api'
  withCredentials: true, // <--- CRITICAL: Tells browser to send HttpOnly cookies with requests
});

// 2. Request Interceptor
// (We no longer need to manually attach the token! The browser does it automatically.)
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Global Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 (Unauthorized), it means the Cookie is missing, invalid, or expired.
    if (error.response && error.response.status === 401) {
      
      // Clear non-sensitive user data (like name/email cache) from storage
      // We don't need to clear 'token' because it's not there anymore!
      localStorage.removeItem('userInfo'); 
      
      // Optional: Redirect to login if the user isn't already there
      // This forces them to re-login to get a new fresh cookie
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
         window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;
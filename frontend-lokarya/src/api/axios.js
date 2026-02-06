import axios from 'axios';

// 1. Create the instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g., 'http://localhost:5000/api'
  // FIX: Removed 'Content-Type': 'application/json' 
  // Axios will now automatically set the correct headers for both JSON and Files.
});

// 2. Request Interceptor: Auto-attach Token
api.interceptors.request.use(
  (config) => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Attach it to the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
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
    // Example: If token expires (401), redirect to login automatically
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Optional: Auto-logout
    }
    return Promise.reject(error);
  }
);

export default api;
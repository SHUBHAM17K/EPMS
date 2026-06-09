import axios from 'axios';

const api = axios.create({
  baseURL: '', // Empty base URL because Vite proxy is handling routing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios request interceptor to dynamically inject the JWT token
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

export default api;

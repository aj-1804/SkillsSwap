import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach JWT Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillswap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear from local storage
      if (localStorage.getItem('skillswap_token')) {
        localStorage.removeItem('skillswap_token');
        localStorage.removeItem('skillswap_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

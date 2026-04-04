// src/services/api.js
// All HTTP calls to our backend go through this file
// It automatically adds the JWT token to every request

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',  // Uses the proxy in package.json → localhost:5000
  timeout: 15000,
});

// ---- Request interceptor: attach token to every request ----
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sheride_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor: handle auth errors globally ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - clear storage and reload
      localStorage.removeItem('sheride_token');
      localStorage.removeItem('sheride_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

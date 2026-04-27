import axios from 'axios';

const api = axios.create({
  baseURL: '/api',  
  timeout: 15000,
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sheride_token');
      localStorage.removeItem('sheride_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

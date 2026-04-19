import axios from 'axios';

// Base instance — all requests go to the backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

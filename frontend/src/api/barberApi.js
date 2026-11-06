import axios from 'axios';

const barberApi = axios.create({
  baseURL: 'http://localhost:8000',
});

// Interceptor para adjuntar el token JWT si existe en localStorage
barberApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default barberApi;
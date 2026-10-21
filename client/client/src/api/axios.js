import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

let storeInstance = null;

// Функция для внедрения store после его инициализации
export const injectStore = (_store) => {
  storeInstance = _store;
};

// Интерцептор подставляет accessToken из памяти Redux перед каждым запросом
api.interceptors.request.use((config) => {
  if (storeInstance) {
    const token = storeInstance.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
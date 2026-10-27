import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// Текст ошибки из ответа сервера
export const errorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

let store = null;

export const injectStore = (_store) => {
  store = _store;
};
// добавляет токен если он есть в каждый запрос
api.interceptors.request.use((config) => {
  const token = store?.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обновление токена при ошибке 401 (вызывает /auth/refresh при 401) а если не 401 возвращает ошибок
let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.startsWith('/auth/');

    if (error.response?.status !== 401 || original._retry || isAuthRoute || !store) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      refreshing ??= api.get('/auth/refresh').finally(() => {
        refreshing = null;
      });

      const { data } = await refreshing;

      store.dispatch({ type: 'auth/sessionRefreshed', payload: data });
      original.headers.Authorization = `Bearer ${data.accessToken}`;

      return api(original);
    } catch {
      store.dispatch({ type: 'auth/sessionExpired' });
      return Promise.reject(error);
    }
  }
);
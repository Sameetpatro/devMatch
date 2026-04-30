import axios from 'axios';

const TOKEN_KEY = 'devmatch.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Bubble a clean error message up to the UI.
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      'Network error';
    err.displayMessage = msg;
    return Promise.reject(err);
  }
);

export default api;

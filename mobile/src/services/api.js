import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config';

const TOKEN_KEY = 'devmatch_mobile_token';

export const storage = {
  getToken: async () => AsyncStorage.getItem(TOKEN_KEY),
  setToken: async (token) => AsyncStorage.setItem(TOKEN_KEY, token),
  clearToken: async () => AsyncStorage.removeItem(TOKEN_KEY),
};

async function request(path, options = {}) {
  const token = await storage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = `${CONFIG.API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { message: text };
  }

  if (!response.ok) {
    const errorMsg = json.error || json.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return json;
}

export const api = {
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) await storage.setToken(data.token);
    return data;
  },

  register: async (payload) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) await storage.setToken(data.token);
    return data;
  },

  getMe: async () => request('/auth/me'),

  getRolesFeed: async () => request('/roles/feed'),

  getDevelopersFeed: async (role = '') =>
    request(`/developers${role ? `?role=${encodeURIComponent(role)}` : ''}`),

  applyRole: async (roleId, coverLetter = '') =>
    request(`/roles/${roleId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ coverLetter }),
    }),

  swipeUser: async (toUserId, direction = 'LIKE') =>
    request('/swipes', {
      method: 'POST',
      body: JSON.stringify({ toUserId, direction }),
    }),

  getMatches: async () => request('/matches'),

  getMessages: async (matchId) => request(`/matches/${matchId}/messages`),

  sendMessage: async (matchId, content) =>
    request(`/matches/${matchId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};


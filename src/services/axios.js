import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:9999';

const axiosInstance = axios.create({
  baseURL,
});

export function setAuthToken(token) {
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common.Authorization;
  }
}

// Ensure Authorization is attached even on hard refresh (F5) before AuthProvider effects run.
// This avoids the first requests going out without token (401) and then only succeeding after reload.
axiosInstance.interceptors.request.use(
  (config) => {
    const hasAuth = Boolean(config?.headers?.Authorization || config?.headers?.authorization);
    if (hasAuth) return config;

    try {
      const raw = localStorage.getItem('sst_auth');
      if (!raw) return config;
      const parsed = JSON.parse(raw);
      const token = parsed?.accessToken;
      if (!token) return config;
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;

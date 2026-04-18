import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { setAuthToken } from '../services/axios';

const AuthContext = createContext(null);

const STORAGE_KEY = 'sst_auth';

export function AuthProvider({ children }) {
  // Đọc từ LocalStorage ĐỒNG BỘ ở lần render đầu tiên (tránh page bị chớp)
  const [accessToken, setAccessToken] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.accessToken) {
          setAuthToken(parsed.accessToken); // Gắn header ngay lập tức
          return parsed.accessToken;
        }
      }
    } catch {}
    return null;
  });

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw)?.user || null;
    } catch {}
    return null;
  });

  // Khi login state thay đổi (nhưng navigate thường xảy ra trước khi useEffect này chạy)
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, user }));
      setAuthToken(accessToken);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
    }
  }, [accessToken, user]);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken),
      updateUser: (patch) => {
        if (!patch || typeof patch !== 'object') return;
        setUser((prev) => ({ ...(prev || {}), ...patch }));
      },
      logout: () => {
        setAccessToken(null);
        setUser(null);
        setAuthToken(null);
      },
      loginAdmin: async ({ username, password, role }) => {
        const data = await authService.loginAdmin({ username, password, role });
        setAuthToken(data.accessToken); // Bắt buộc set sync trước khi UI tự động điều hướng
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data;
      },
      loginUser: async ({ username, password, role }) => {
        const data = await authService.loginUser({ username, password, role });
        setAuthToken(data.accessToken); // Bắt buộc set sync
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data;
      },
      registerCustomer: async ({ name, email, username, password }) => {
        const data = await authService.registerCustomer({ name, email, username, password });
        return data;
      },
      verifyEmail: async ({ email, code }) => {
        const data = await authService.verifyEmailUser({ email, code });
        setAuthToken(data.accessToken);
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data;
      },
      verifyEmailAdmin: async ({ email, code }) => {
        const data = await authService.verifyEmailAdmin({ email, code });
        setAuthToken(data.accessToken);
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data;
      },
      resendVerification: async ({ email }) => {
        const data = await authService.resendVerificationUser({ email });
        return data;
      },
      resendVerificationAdmin: async ({ email }) => {
        const data = await authService.resendVerificationAdmin({ email });
        return data;
      },
    }),
    [accessToken, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { setAuthToken } from '../services/axios';

const AuthContext = createContext(null);

const STORAGE_KEY = 'sst_auth';

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.accessToken) {
        setAccessToken(parsed.accessToken);
        setUser(parsed.user || null);
        setAuthToken(parsed.accessToken);
      }
    } catch {
      // ignore
    }
  }, []);

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
      },
      loginAdmin: async ({ username, password, role }) => {
        const data = await authService.loginAdmin({ username, password, role });
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data;
      },
      loginUser: async ({ username, password, role }) => {
        const data = await authService.loginUser({ username, password, role });
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
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data;
      },
      resendVerification: async ({ email }) => {
        const data = await authService.resendVerificationUser({ email });
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

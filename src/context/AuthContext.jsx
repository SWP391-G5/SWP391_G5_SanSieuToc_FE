import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { setAuthToken } from '../services/axios';
import wishlistService from '../services/wishlistService';

const AuthContext = createContext(null);

const STORAGE_KEY = 'sst_auth';
const GUEST_WISHLIST_KEY = 'sst_wishlist';

function getGuestWishlistFieldIds() {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const ids = parsed
      .map((item) => String(item?.id ?? item?.fieldID ?? item?.fieldId ?? '').trim())
      .filter(Boolean);

    return Array.from(new Set(ids));
  } catch {
    return [];
  }
}

export function AuthProvider({ children }) {
  // Read auth token synchronously on first render to avoid auth flicker.
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
    } catch {
      return null;
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw)?.user || null;
    } catch {
      return null;
    }
    return null;
  });

  const isAuthReady = true;

  // Khi login state thay đổi
  useEffect(() => {
    if (!isAuthReady) return;

    if (accessToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, user }));
      setAuthToken(accessToken);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
    }
  }, [accessToken, user, isAuthReady]);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthReady,
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
        setAuthToken(data.accessToken);
        return data;
      },
      loginUser: async ({ username, password, role }) => {
        const data = await authService.loginUser({ username, password, role });
        setAuthToken(data.accessToken); // Bắt buộc set sync
        setAccessToken(data.accessToken);
        setUser(data.user);

        // Ensure authenticated calls can run immediately in this tick.
        setAuthToken(data.accessToken);

        if (String(data?.user?.role || '').trim().toLowerCase() === 'customer') {
          const guestFieldIds = getGuestWishlistFieldIds();
          if (guestFieldIds.length > 0) {
            try {
              await wishlistService.mergeGuestWishlist(guestFieldIds);
              localStorage.removeItem(GUEST_WISHLIST_KEY);
            } catch {
              // ignore merge failure to avoid blocking login
            }
          }
        }

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
        setAuthToken(data.accessToken);
        return data;
      },
      verifyEmailAdmin: async ({ email, code }) => {
        const data = await authService.verifyEmailAdmin({ email, code });
        setAuthToken(data.accessToken);
        setAccessToken(data.accessToken);
        setUser(data.user);
        setAuthToken(data.accessToken);
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
    [accessToken, isAuthReady, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

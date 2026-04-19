import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import wishlistService from '../services/wishlistService';
import { setAuthToken } from '../services/axios';

const WISHLIST_KEY = 'sst_wishlist';

function normalizeFieldId(value) {
  if (value === undefined || value === null) return '';
  const id = String(value).trim();
  return id;
}

function formatVnd(value) {
  const amount = Number(value) || 0;
  try {
    return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
  } catch {
    return `${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;
  }
}

function normalizeWishlistItem(raw) {
  const id = normalizeFieldId(raw?.id ?? raw?.fieldID ?? raw?.fieldId ?? raw?._id);
  if (!id) return null;

  const hourlyPrice = Number.isFinite(Number(raw?.hourlyPrice)) ? Number(raw.hourlyPrice) : toPriceNumber(raw?.price);
  const normalizedPrice = raw?.price ? String(raw.price) : hourlyPrice > 0 ? formatVnd(hourlyPrice) : 'Liên hệ';

  return {
    id,
    name: String(raw?.name ?? raw?.fieldName ?? ''),
    address: String(raw?.address || ''),
    city: String(raw?.city || ''),
    rating: String(raw?.rating || '5.0'),
    size: String(raw?.size || ''),
    sizeKey: String(raw?.sizeKey || ''),
    sizeTone: String(raw?.sizeTone || 'primary'),
    hourlyPrice,
    price: normalizedPrice,
    utilities: Array.isArray(raw?.utilities) ? raw.utilities.filter(Boolean) : [],
    image: typeof raw?.image === 'string' ? raw.image : '',
    imageAlt: String(raw?.imageAlt || 'Field image'),
  };
}

function normalizeWishlistItems(rawItems) {
  const arr = Array.isArray(rawItems) ? rawItems : [];
  const map = new Map();

  for (const raw of arr) {
    const item = normalizeWishlistItem(raw);
    if (!item) continue;
    map.set(item.id, item);
  }

  return Array.from(map.values());
}

function loadWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeWishlistItems(parsed);
  } catch {
    return [];
  }
}

function getWishlistFieldIds(items) {
  return normalizeWishlistItems(items)
    .map((item) => String(item?.id || '').trim())
    .filter(Boolean);
}

function saveWishlist(items) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(normalizeWishlistItems(items)));
  } catch {
    // ignore
  }
}

function toPriceNumber(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

function toWishlistItem(field) {
  const item = normalizeWishlistItem(field);
  if (item) return item;

  const id = normalizeFieldId(field?.id);
  if (!id) return null;

  const hourlyPrice = Number.isFinite(Number(field?.hourlyPrice))
    ? Number(field.hourlyPrice)
    : toPriceNumber(field?.price);

  return {
    id,
    name: field.name,
    address: field.address,
    city: field.city,
    rating: field.rating,
    size: field.size,
    sizeKey: field.sizeKey,
    sizeTone: field.sizeTone,
    hourlyPrice,
    price: field.price,
    utilities: field.utilities,
    image: field.image,
    imageAlt: field.imageAlt,
  };
}

function isCustomerRole(role) {
  return String(role || '').trim().toLowerCase() === 'customer';
}

export function useWishlist() {
  const { isAuthenticated, isAuthReady, accessToken, user } = useAuth();
  const isCustomerAuthenticated = isAuthenticated && isCustomerRole(user?.role);
  const [wishlist, setWishlist] = useState(() => loadWishlist());
  const wishlistIds = useMemo(() => new Set(wishlist.map((x) => x.id)), [wishlist]);

  useEffect(() => {
    let alive = true;

    if (!isAuthReady) {
      return () => {
        alive = false;
      };
    }

    if (!isCustomerAuthenticated) {
      setWishlist(loadWishlist());
      return () => {
        alive = false;
      };
    }

    (async () => {
      const localGuestItems = loadWishlist();
      const guestFieldIds = Array.from(new Set(getWishlistFieldIds(localGuestItems)));

      try {
        if (guestFieldIds.length > 0) {
          const mergeData = await wishlistService.mergeGuestWishlist(guestFieldIds);
          if (!alive) return;

          setWishlist(normalizeWishlistItems(mergeData?.items));
          saveWishlist([]);
          return;
        }

        const data = await wishlistService.getMyWishlist();
        if (!alive) return;
        setWishlist(normalizeWishlistItems(data?.items));
      } catch {
        if (!alive) return;

        if (accessToken) {
          setAuthToken(accessToken);
        }

        try {
          const retryData = await wishlistService.getMyWishlist();
          if (!alive) return;
          setWishlist(normalizeWishlistItems(retryData?.items));
          return;
        } catch {
          if (!alive) return;
          setWishlist(localGuestItems);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [accessToken, isAuthReady, isCustomerAuthenticated, user?.id, user?._id]);

  const toggleWishlist = async (field) => {
    const id = normalizeFieldId(field?.id ?? field?.fieldID ?? field?.fieldId ?? field?._id);
    if (!id) return;

    if (isCustomerAuthenticated) {
      try {
        const data = wishlistIds.has(id)
          ? await wishlistService.removeFromWishlist(id)
          : await wishlistService.addToWishlist(id);

        setWishlist(normalizeWishlistItems(data?.items));
      } catch (error) {
        try {
          const data = await wishlistService.getMyWishlist();
          setWishlist(normalizeWishlistItems(data?.items));
        } catch {
          // ignore
        }
      }
      return;
    }

    setWishlist((prev) => {
      const exists = prev.some((x) => String(x.id) === id);
      const nextItem = toWishlistItem({ ...field, id });
      const next = exists
        ? prev.filter((x) => String(x.id) !== id)
        : nextItem
        ? [...prev, nextItem]
        : prev;

      saveWishlist(next);
      return next;
    });
  };

  const clearWishlist = async () => {
    if (isCustomerAuthenticated) {
      const ids = wishlist.map((x) => String(x.id)).filter(Boolean);
      if (ids.length === 0) {
        setWishlist([]);
        return;
      }

      try {
        await Promise.all(ids.map((id) => wishlistService.removeFromWishlist(id)));
        setWishlist([]);
      } catch {
        try {
          const data = await wishlistService.getMyWishlist();
          setWishlist(normalizeWishlistItems(data?.items));
        } catch {
          // ignore
        }
      }
      return;
    }

    setWishlist(() => {
      saveWishlist([]);
      return [];
    });
  };

  return { wishlist, wishlistIds, toggleWishlist, clearWishlist };
}

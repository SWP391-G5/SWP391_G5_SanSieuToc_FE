import { useMemo, useState } from 'react';

const WISHLIST_KEY = 'sst_wishlist';

function loadWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && (typeof x.id === 'string' || typeof x.id === 'number'))
      .map((x) => ({ ...x, id: String(x.id) }));
  } catch {
    return [];
  }
}

function saveWishlist(items) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function toWishlistItem(field) {
  return {
    id: String(field.id),
    name: field.name,
    address: field.address,
    city: field.city,
    rating: field.rating,
    size: field.size,
    sizeKey: field.sizeKey,
    sizeTone: field.sizeTone,
    price: field.price,
    utilities: field.utilities,
    image: field.image,
    imageAlt: field.imageAlt,
  };
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState(() => loadWishlist());
  const wishlistIds = useMemo(() => new Set(wishlist.map((x) => x.id)), [wishlist]);

  const toggleWishlist = (field) => {
    setWishlist((prev) => {
      const id = String(field?.id);
      const exists = prev.some((x) => String(x.id) === id);
      const next = exists ? prev.filter((x) => String(x.id) !== id) : [...prev, toWishlistItem({ ...field, id })];
      saveWishlist(next);
      return next;
    });
  };

  return { wishlist, wishlistIds, toggleWishlist };
}

/**
 * useBanners.js
 * Fetches active banners for a placement (public).
 */

import { useEffect, useState } from 'react';
import publicApi from '../services/public/publicApi';

export default function useBanners({ placement = 'home_hero' } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await publicApi.getBanners({ placement });
        const list = data?.items || [];
        if (!alive) return;
        setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || 'Failed to load banners');
        setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [placement]);

  return { loading, error, items };
}

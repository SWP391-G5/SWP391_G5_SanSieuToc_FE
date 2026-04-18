/**
 * useFields.js
 * Fetches fields for customer pages (public).
 */

import { useEffect, useMemo, useState } from 'react';
import publicApi from '../services/public/publicApi';

export default function useFields(params = {}) {
  const stableParams = useMemo(() => params, [JSON.stringify(params || {})]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await publicApi.getFields(stableParams);
        const list = data?.items || [];
        if (!alive) return;
        setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || 'Failed to load fields');
        setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [stableParams]);

  return { loading, error, items };
}

/**
 * useFields.js
 * Fetches fields for customer pages (public).
 */

import { useEffect, useMemo, useState } from 'react';
import publicApi from '../services/public/publicApi';

export default function useFields(params = {}) {
  const paramsKey = useMemo(() => {
    try {
      return JSON.stringify(params || {});
    } catch {
      return '{}';
    }
  }, [params]);

  const stableParams = useMemo(() => {
    try {
      return JSON.parse(paramsKey);
    } catch {
      return {};
    }
  }, [paramsKey]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});

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
        setMeta(data && typeof data === 'object' ? (data.meta || {}) : {});
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || 'Failed to load fields');
        setItems([]);
        setMeta({});
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [stableParams]);

  return { loading, error, items, meta };
}

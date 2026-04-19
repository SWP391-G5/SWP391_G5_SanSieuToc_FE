/**
 * useManagerBannersAds.js
 * Manager hook for banners/ads CRUD.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import managerApi from '../../../services/manager/managerApi';

export default function useManagerBannersAds({ placement = '' } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const query = useMemo(() => ({ placement }), [placement]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await managerApi.getBanners(query);
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load banners');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, error, items, reload: load };
}

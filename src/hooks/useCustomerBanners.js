/**
 * useCustomerBanners.js
 * Fetch active ad banners from the backend for a specific placement.
 * Automatically falls back to default images (from assets) if no banners exist.
 */

import { useState, useEffect } from 'react';
import publicApi from '../services/public/publicApi';
import { getFallbackImagesForPlacement } from '../assets/defaultSliders';

function normalizeOrder(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function mergeBannersIntoSlots({ placementKey, dbBanners, fallbackImages }) {
  const slots = (fallbackImages || []).map((img, i) => ({
    _id: `fallback-${placementKey}-${i}`,
    order: i,
    placement: placementKey,
    isActive: true,
    imageUrl: img,
  }));

  const list = (dbBanners || []).filter((b) => b && b.imageUrl);
  for (const b of list) {
    const idx = normalizeOrder(b.order);
    if (idx < 0 || idx >= slots.length) continue;
    // replace slot by exact order
    slots[idx] = { ...slots[idx], ...b, order: idx };
  }

  // ensure ordered return
  return slots.sort((a, b) => normalizeOrder(a.order) - normalizeOrder(b.order));
}

export default function useCustomerBanners(placementKey) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const res = await publicApi.getBanners({ placement: placementKey });
        if (active) {
          const fetchedItems = res?.items || [];
          
          const fallbackImages = getFallbackImagesForPlacement(placementKey);

          // Merge strategy: keep a fixed number of slots (fallback length)
          // and let managers replace a specific order without overriding the whole slider.
          const merged = mergeBannersIntoSlots({
            placementKey,
            dbBanners: fetchedItems,
            fallbackImages,
          });

          setBanners(merged);
        }
      } catch (e) {
        console.error(`Failed to load banners for ${placementKey}:`, e);
        if (active) {
          // On error, still load fallbacks so UI doesn't break
          const fallbackImages = getFallbackImagesForPlacement(placementKey);
          const merged = mergeBannersIntoSlots({ placementKey, dbBanners: [], fallbackImages });
          setBanners(merged);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (placementKey) {
      load();
    }

    return () => {
      active = false;
    };
  }, [placementKey]);

  return { banners, loading };
}

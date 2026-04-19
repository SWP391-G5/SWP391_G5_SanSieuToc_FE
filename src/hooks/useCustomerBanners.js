/**
 * useCustomerBanners.js
 * Fetch active ad banners from the backend for a specific placement.
 * Automatically falls back to default images (from assets) if no banners exist.
 */

import { useState, useEffect } from 'react';
import publicApi from '../services/public/publicApi';
import { getFallbackImagesForPlacement } from '../assets/defaultSliders';

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
          const fetchedItems = res?.items || res?.data || [];
          
          if (fetchedItems.length > 0) {
            // DB has banners, map them to standard flat image URLs format if needed,
            // or return the objects to let UI click them.
            setBanners(fetchedItems);
          } else {
            // DB is empty, use localized fallback images
            const fallbackImages = getFallbackImagesForPlacement(placementKey);
            const mocked = fallbackImages.map((img, i) => ({
              _id: `fallback-${i}`,
              imageUrl: img,
              title: `Fallback ${i}`
            }));
            setBanners(mocked);
          }
        }
      } catch (e) {
        console.error(`Failed to load banners for ${placementKey}:`, e);
        if (active) {
          // On error, still load fallbacks so UI doesn't break
          const fallbackImages = getFallbackImagesForPlacement(placementKey);
          const mocked = fallbackImages.map((img, i) => ({
            _id: `fallback-${i}`,
            imageUrl: img,
            title: `Fallback ${i}`
          }));
          setBanners(mocked);
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

/**
 * SimpleImageSlider.jsx
 * Minimal image slider (no external deps).
 * - Auto-rotates
 * - Dots
 * - Accepts a fallback image list
 */

import { useEffect, useMemo, useRef, useState } from 'react';

export default function SimpleImageSlider({
  images,
  fallbackImages = [],
  intervalMs = 5000,
  className = '',
  imgClassName = '',
  alt = 'slider-image',
  onIndexChange,
}) {
  const slides = useMemo(() => {
    const list = Array.isArray(images) && images.length ? images : fallbackImages;
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }, [fallbackImages, images]);

  const [index, setIndex] = useState(0);
  const intervalRef = useRef(null);

  const count = slides.length;

  const go = (next) => {
    if (!count) return;
    setIndex((prev) => {
      const v = ((next % count) + count) % count;
      return v;
    });
  };

  useEffect(() => {
    if (!count) return undefined;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [count, intervalMs]);

  useEffect(() => {
    if (typeof onIndexChange === 'function') onIndexChange(index);
  }, [index, onIndexChange]);

  if (!count) return null;

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <img src={slides[index]} alt={alt} className={`block h-full w-full ${imgClassName}`} />

      {count > 1 ? (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={
                i === index
                  ? 'h-2 w-6 rounded-full bg-[#8eff71]'
                  : 'h-2 w-2 rounded-full bg-white/40 hover:bg-white/70'
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

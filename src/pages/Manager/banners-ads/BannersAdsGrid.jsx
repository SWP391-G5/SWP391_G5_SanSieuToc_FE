/**
 * BannersAdsGrid.jsx
 * Grid/card view for marketing images (Figma-like modules).
 */

import { useMemo, useState } from 'react';

function clampOrder(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-9999, Math.min(9999, n));
}

export default function BannersAdsGrid({ items, placementLabel, onEdit, onDelete, onToggleActive, onUpdateOrder }) {
  const [orderDrafts, setOrderDrafts] = useState({});

  const getOrderValue = (id, fallback) => {
    if (Object.prototype.hasOwnProperty.call(orderDrafts, id)) return orderDrafts[id];
    return fallback;
  };

  const sorted = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return [...list].sort((a, b) => (a.order !== b.order ? a.order - b.order : String(a.id).localeCompare(String(b.id))));
  }, [items]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sorted.map((b) => {
        const id = b?.id;
        const orderVal = getOrderValue(id, b?.order ?? 0);

        return (
          <div
            key={id}
            className="group overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          >
            <div className="relative h-44 bg-black">
              {b?.imageUrl ? (
                <img src={b.imageUrl} alt={b?.title || 'marketing-image'} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-on-surface-variant">No image</div>
              )}

              <div className="absolute left-3 top-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleActive?.(b)}
                  className={
                    b?.isActive
                      ? 'rounded-full bg-[#8eff71]/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8eff71]'
                      : 'rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/70'
                  }
                >
                  {b?.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                <div className="truncate text-xs font-bold text-white/90">{b?.title || 'Untitled'}</div>
                <div className="shrink-0 rounded-full bg-black/40 px-2 py-1 text-[10px] font-bold text-white/80">
                  {placementLabel || b?.placement}
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Order</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-9 w-9 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface"
                    onClick={() => {
                      const next = clampOrder(Number(orderVal) - 1);
                      setOrderDrafts((p) => ({ ...p, [id]: next }));
                      onUpdateOrder?.(b, next);
                    }}
                    aria-label="Decrement order"
                    title="Order -1"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={orderVal}
                    onChange={(e) => {
                      const next = clampOrder(e.target.value);
                      setOrderDrafts((p) => ({ ...p, [id]: next }));
                    }}
                    onBlur={() => {
                      onUpdateOrder?.(b, clampOrder(orderVal));
                    }}
                    className="h-9 w-20 rounded-lg border border-outline-variant bg-white px-3 text-sm font-bold text-on-surface-variant"
                  />
                  <button
                    type="button"
                    className="h-9 w-9 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface"
                    onClick={() => {
                      const next = clampOrder(Number(orderVal) + 1);
                      setOrderDrafts((p) => ({ ...p, [id]: next }));
                      onUpdateOrder?.(b, next);
                    }}
                    aria-label="Increment order"
                    title="Order +1"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onEdit?.(b)}
                  className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(b)}
                  className="h-9 rounded-lg px-3 text-xs font-bold border border-error text-error hover:bg-error hover:text-on-error"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {sorted.length === 0 ? (
        <div className="col-span-full rounded-xl border border-outline-variant bg-surface p-10 text-center text-sm text-on-surface-variant">
          No items.
        </div>
      ) : null}
    </div>
  );
}

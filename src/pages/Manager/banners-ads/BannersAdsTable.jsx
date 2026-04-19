/**
 * BannersAdsTable.jsx
 * Table list for banners/ads.
 */

function openPreview(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function BannersAdsTable({ loading, items, onEdit, onDelete, onToggleActive, onUpdateOrder }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
            <th className="py-3 pr-4">No</th>
            <th className="py-3 pr-4">Title</th>
            <th className="py-3 pr-4">Placement</th>
            <th className="py-3 pr-4">Order</th>
            <th className="py-3 pr-4">Active</th>
            <th className="py-3 pr-4">Preview</th>
            <th className="py-3 pr-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {items.map((b, idx) => (
            <tr key={b?.id || b?._id}>
              <td className="py-3 pr-4 text-on-surface-variant">{idx + 1}</td>
              <td className="py-3 pr-4 text-on-surface-variant font-semibold">{b?.title || '-'}</td>
              <td className="py-3 pr-4 text-on-surface-variant">{b?.placement || '-'}</td>
              <td className="py-3 pr-4">
                <input
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={Number(b?.order) || 0}
                  className="h-9 w-24 rounded-lg bg-surface px-2 text-sm border border-outline-variant text-on-surface-variant"
                  onBlur={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isNaN(next)) return;
                    if (next === Number(b?.order || 0)) return;
                    onUpdateOrder?.(b, next);
                  }}
                />
              </td>
              <td className="py-3 pr-4">
                <button
                  type="button"
                  onClick={() => onToggleActive?.(b)}
                  className={
                    b?.isActive
                      ? 'h-8 rounded-full bg-[#8eff71]/20 px-3 text-xs font-bold text-[#0d6100] hover:bg-[#8eff71]/30'
                      : 'h-8 rounded-full bg-[#abaca5]/10 px-3 text-xs font-bold text-[#abaca5] hover:bg-[#abaca5]/20'
                  }
                >
                  {b?.isActive ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  {b?.imageUrl ? (
                    <img
                      src={b.imageUrl}
                      alt="banner"
                      className="h-12 w-24 object-cover rounded border border-outline-variant"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-12 w-24 rounded border border-outline-variant bg-surface" />
                  )}

                  <button
                    type="button"
                    onClick={() => openPreview(b?.imageUrl)}
                    disabled={!b?.imageUrl}
                    className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface disabled:opacity-50"
                  >
                    Open
                  </button>
                </div>
              </td>
              <td className="py-3 text-right">
                <div className="inline-flex gap-2 justify-end">
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
              </td>
            </tr>
          ))}

          {!loading && items.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-6 text-center text-sm text-on-surface-variant">
                No items.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

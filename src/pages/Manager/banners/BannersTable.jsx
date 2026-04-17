/**
 * BannersTable.jsx
 * Table list for banners.
 */

export default function BannersTable({ loading, items, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
            <th className="py-3 pr-4">Title</th>
            <th className="py-3 pr-4">Placement</th>
            <th className="py-3 pr-4">Order</th>
            <th className="py-3 pr-4">Active</th>
            <th className="py-3 pr-4">Preview</th>
            <th className="py-3 pr-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {items.map((b) => (
            <tr key={b?._id || b?.id}>
              <td className="py-3 pr-4 text-black font-semibold">{b?.title || '-'}</td>
              <td className="py-3 pr-4 text-on-surface-variant">{b?.placement || '-'}</td>
              <td className="py-3 pr-4 text-on-surface-variant">{Number(b?.order) || 0}</td>
              <td className="py-3 pr-4 text-on-surface-variant">{b?.isActive ? 'Yes' : 'No'}</td>
              <td className="py-3 pr-4">
                {b?.imageUrl ? <img src={b.imageUrl} alt="banner" className="h-12 w-24 object-cover rounded border border-outline-variant" /> : '-'}
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
              <td colSpan={6} className="py-6 text-center text-sm text-on-surface-variant">
                No banners.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

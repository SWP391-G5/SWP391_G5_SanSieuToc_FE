/**
 * ============================================================
 * FILE: src/pages/Manager/banners-ads/BannersAdsTable.jsx
 * ============================================================
 * WHAT IS THIS FILE?
 *   "Executor" component that renders the banner/ad list table.
 *
 * RESPONSIBILITIES:
 *   - Render rows and basic empty/loading states
 *   - Provide user actions: Edit / Delete / Toggle Active
 *   - Provide preview image / link affordances
 *
 * IMPORTANT:
 *   - This component should be presentational.
 *   - Network calls are owned by the orchestrator `BannersAdsPage.jsx`.
 * ============================================================
 */

// ── React core ─────────────────────────────────────────────
import React from 'react';

// ── Internal UI helpers / icons ────────────────────────────
import { Eye, Pencil, Trash2 } from 'lucide-react';

/**
 * BannersAdsTable
 * ------------------------------------------------------------
 * Props:
 *   - loading {boolean}
 *   - items   {Array<{
 *       id: string,
 *       title: string,
 *       placement: string,
 *       order: number,
 *       isActive: boolean,
 *       imageUrl?: string
 *     }>}}
 *   - onEdit          {(item) => void}
 *   - onDelete        {(item) => void}
 *   - onToggleActive  {(item) => void}
 */
export default function BannersAdsTable({ loading, items, onEdit, onDelete, onToggleActive }) {
  // ─────────────────────────────────────────────────────────────
  // SECTION 1: DERIVED DISPLAY VALUES
  // ─────────────────────────────────────────────────────────────

  const safeItems = Array.isArray(items) ? items : [];

  // ─────────────────────────────────────────────────────────────
  // SECTION 2: RENDER GUARDS (loading / empty)
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="text-sm text-on-surface-variant">Loading…</div>;
  }

  if (!safeItems.length) {
    return <div className="text-sm text-on-surface-variant">Không có dữ liệu</div>;
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 3: MAIN TABLE
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          <tr className="border-b border-outline-variant">
            <th className="px-3 py-2">Ảnh</th>
            <th className="px-3 py-2">Tiêu đề</th>
            <th className="px-3 py-2">Placement</th>
            <th className="px-3 py-2">Order</th>
            <th className="px-3 py-2">Trạng thái</th>
            <th className="px-3 py-2 text-right">Hành động</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-outline-variant">
          {safeItems.map((b) => (
            <tr key={b.id} className="hover:bg-surface/60">
              <td className="px-3 py-3">
                {b.imageUrl ? (
                  <a href={b.imageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                    <img src={b.imageUrl} alt={b.title || 'banner'} className="h-12 w-20 rounded object-cover" />
                    <Eye size={16} className="opacity-70" />
                  </a>
                ) : (
                  <div className="h-12 w-20 rounded bg-surface" />
                )}
              </td>

              <td className="px-3 py-3 font-semibold text-on-surface-variant">{b.title || '-'}</td>
              <td className="px-3 py-3 text-on-surface-variant">{b.placement || '-'}</td>
              <td className="px-3 py-3 text-on-surface-variant">{Number.isFinite(Number(b.order)) ? b.order : '-'}</td>

              <td className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => onToggleActive?.(b)}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border transition-colors $
                    {b.isActive ? 'border-primary/40 bg-primary/10 text-primary' : 'border-outline-variant bg-surface text-on-surface-variant'}
                  `}
                >
                  {b.isActive ? 'Active' : 'Inactive'}
                </button>
              </td>

              <td className="px-3 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit?.(b)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-outline-variant px-3 text-xs font-bold hover:bg-surface"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete?.(b)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 text-xs font-bold text-error hover:bg-error/15"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * BannersAdsFormModal.jsx
 * Create/Edit modal for banner/ad item.
 */

import { useEffect, useMemo } from 'react';
import { buildPickedImagePreview, revokePreviewUrl } from './bannerUploadHelpers';
import { PLACEMENTS } from './placementsMeta';

export default function BannersAdsFormModal({ open, initial, busy, error, onClose, onSubmit, notify }) {
  const [form, setForm] = initial;

  const placementMeta = useMemo(
    () => (PLACEMENTS || []).find((p) => p.key === form?.placement) || null,
    [form?.placement]
  );

  useEffect(() => {
    if (open) return;
    const img = form?.image;
    if (img && typeof img === 'object' && img.previewUrl) revokePreviewUrl(img.previewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const max = placementMeta?.maxItems;
    // Clamp when placement has fixed slots (apply to BOTH active and inactive)
    if (typeof max === 'number' && max > 0 && Number(form?.order) >= max) {
      setForm((p) => ({ ...p, order: Math.max(0, max - 1) }));
    }
  }, [open, placementMeta?.maxItems]);

  if (!open) return null;

  const pickFile = (files) => {
    const file = (files || [])[0];
    if (!file) return;

    const preview = buildPickedImagePreview(file);
    setForm((p) => ({ ...p, image: preview }));
  };

  const isHomeHero = (form?.placement || '').toLowerCase() === 'home_hero';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-surface-container-high border border-outline-variant shadow-2xl my-10">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-headline font-bold">{form?.id ? 'Chỉnh sửa' : 'Thêm mới'}</h2>
            <p className="text-sm text-on-surface-variant mt-1">Tải 1 ảnh và cấu hình vị trí / thứ tự / bật tắt.</p>
          </div>
          <button
            type="button"
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
            onClick={onClose}
            disabled={busy}
          >
            Đóng
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-4">
          <label className="space-y-1 block">
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Title</div>
            <input
              className="h-11 w-full rounded-lg bg-surface px-4 text-sm border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              value={form?.title || ''}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              disabled={busy}
            />
          </label>

          {isHomeHero ? (
            <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface">
              Trang Chủ (Home) hiện tại chỉ chạy slider ảnh.
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1 block">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Placement</div>
              <select
                className="h-11 w-full rounded-lg bg-surface px-4 text-sm border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                value={form?.placement || 'home_hero'}
                onChange={(e) => {
                  const nextPlacement = e.target.value;
                  const nextMeta = (PLACEMENTS || []).find((p) => p.key === nextPlacement) || null;
                  const max = nextMeta?.maxItems;

                  setForm((p) => {
                    const proposedOrder = Number.isFinite(Number(p?.order)) ? Number(p.order) : 0;

                    // Clamp whenever placement has fixed slots (apply to BOTH active and inactive)
                    const safeOrder =
                      typeof max === 'number' && max > 0
                        ? Math.min(Math.max(0, proposedOrder), max - 1)
                        : Math.max(0, proposedOrder);

                    return { ...p, placement: nextPlacement, order: safeOrder };
                  });

                  if (typeof max === 'number' && max > 0) {
                    notify?.notifyInfo?.(`Placement "${nextMeta?.label || nextPlacement}" order range: 0 → ${max - 1}.`);
                  }
                }}
                disabled={busy}
              >
                {(PLACEMENTS || []).map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 block">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Order</div>
              <input
                type="number"
                min={0}
                className="h-11 w-full rounded-lg bg-surface px-4 text-sm border border-outline-variant text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                value={form?.order ?? 0}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const base = Number.isFinite(raw) ? raw : 0;
                  const nonNegative = Math.max(0, base);

                  const max = placementMeta?.maxItems;
                  const nextOrder =
                    typeof max === 'number' && max > 0 ? Math.min(nonNegative, max - 1) : nonNegative;

                  setForm((p) => ({ ...p, order: nextOrder }));
                }}
                disabled={busy}
              />
              {typeof placementMeta?.maxItems === 'number' ? (
                <div className="text-[11px] text-on-surface-variant">
                  Range: 0 → {Math.max(0, placementMeta.maxItems - 1)}
                </div>
              ) : (
                <div className="text-[11px] text-on-surface-variant">Order must be ≥ 0</div>
              )}
            </label>
          </div>

          <label className="inline-flex items-center gap-3 text-sm text-on-surface-variant">
            <input
              type="checkbox"
              checked={!!form?.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              disabled={busy}
            />
            Active
          </label>

          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Image</div>

            <label className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface inline-flex items-center cursor-pointer w-fit">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files)}
                disabled={busy}
              />
              Chọn ảnh
            </label>

            <div className="rounded-xl border border-outline-variant bg-surface p-4">
              {form?.image ? (
                <img
                  src={typeof form.image === 'string' ? form.image : form.image.previewUrl}
                  alt="item-preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="text-sm text-on-surface-variant">Chưa chọn ảnh.</div>
              )}
            </div>
          </div>

          {error ? <div className="rounded-lg border border-error/60 bg-error/10 p-3 text-sm text-error">{error}</div> : null}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg px-5 text-sm font-bold border border-outline-variant hover:bg-surface"
              disabled={busy}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                // Create requires image; Edit can keep existing image URL.
                if (!form?.id && !form?.image) {
                  notify?.notifyWarning?.('Image is required.');
                  return;
                }

                if (Number(form?.order) < 0) {
                  notify?.notifyWarning?.('Order must be ≥ 0.');
                  return;
                }

                const max = placementMeta?.maxItems;
                if (typeof max === 'number' && max > 0 && Number(form?.order) >= max) {
                  notify?.notifyWarning?.(`Order must be between 0 and ${max - 1} for this placement.`);
                  return;
                }

                onSubmit?.();
              }}
              className="h-11 rounded-lg px-6 text-sm font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
              disabled={busy}
            >
              {busy ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * BannersAdsFormModal.jsx
 * Create/Edit modal for banner/ad item.
 */

import { useEffect } from 'react';
import { buildPickedImagePreview, revokePreviewUrl } from './bannerUploadHelpers';

export default function BannersAdsFormModal({ open, initial, busy, error, onClose, onSubmit, notify }) {
  const [form, setForm] = initial;

  useEffect(() => {
    if (open) return;
    const img = form?.image;
    if (img && typeof img === 'object' && img.previewUrl) revokePreviewUrl(img.previewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const pickFile = (files) => {
    const file = (files || [])[0];
    if (!file) return;

    const preview = buildPickedImagePreview(file);
    setForm((p) => ({ ...p, image: preview }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-surface-container-high border border-outline-variant shadow-2xl my-10">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-headline font-bold">{form?.id ? 'Edit Item' : 'New Item'}</h2>
            <p className="text-sm text-on-surface-variant mt-1">Upload 1 image and control placement/order/active.</p>
          </div>
          <button
            type="button"
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
            onClick={onClose}
            disabled={busy}
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-4">
          <label className="space-y-1 block">
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Title</div>
            <input
              className="h-11 w-full rounded-lg bg-white px-4 text-sm border border-outline-variant text-black"
              value={form?.title || ''}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              disabled={busy}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1 block">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Placement</div>
              <select
                className="h-11 w-full rounded-lg bg-surface px-4 text-sm border border-outline-variant text-black"
                value={form?.placement || 'home_hero'}
                onChange={(e) => setForm((p) => ({ ...p, placement: e.target.value }))}
                disabled={busy}
              >
                {/* Keep full list in placementsMeta to avoid duplicating here */}
                <option value="home_hero">Home Hero</option>
                <option value="home_promo">Home Promo</option>
                <option value="fields_list_ads">Fields List Ads</option>
              </select>
            </label>

            <label className="space-y-1 block">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Order</div>
              <input
                type="number"
                className="h-11 w-full rounded-lg bg-white px-4 text-sm border border-outline-variant text-black"
                value={form?.order ?? 0}
                onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))}
                disabled={busy}
              />
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
              Pick image
            </label>

            <div className="rounded-xl border border-outline-variant bg-surface p-4">
              {form?.image ? (
                <img
                  src={typeof form.image === 'string' ? form.image : form.image.previewUrl}
                  alt="item-preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="text-sm text-on-surface-variant">No image selected.</div>
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
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!form?.image) {
                  notify?.notifyWarning?.('Image is required.');
                  return;
                }
                onSubmit?.();
              }}
              className="h-11 rounded-lg px-6 text-sm font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
              disabled={busy}
            >
              {busy ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

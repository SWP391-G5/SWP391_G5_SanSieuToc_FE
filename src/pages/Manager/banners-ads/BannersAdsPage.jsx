/**
 * BannersAdsPage.jsx
 * Unified manager module: Banners & Ads (placement-based).
 *
 * This module consolidates the previous `marketing/` and `banners/` folders.
 */

import { useMemo, useState } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import managerApi from '../../../services/manager/managerApi';

import PostConfirmModal from '../posts/PostConfirmModal';

import BannersAdsFormModal from './BannersAdsFormModal';
import BannersAdsTable from './BannersAdsTable';
import useManagerBannersAds from './useManagerBannersAds';

import BannersAdsGrid from './BannersAdsGrid';
import { PLACEMENTS, DEFAULT_PLACEMENT, placementLabel } from './placementsMeta';
import { normalizeBannerItem } from './bannerDto';

function openPreview(previewPath) {
  if (!previewPath) return;
  window.open(previewPath, '_blank', 'noopener,noreferrer');
}

export default function BannersAdsPage() {
  const notify = useNotification();

  const [placement, setPlacement] = useState(DEFAULT_PLACEMENT);
  const placementMeta = useMemo(() => PLACEMENTS.find((p) => p.key === placement) || null, [placement]);

  const [activeOnly, setActiveOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const { loading, error, items: rawItems, reload } = useManagerBannersAds({ placement });

  const items = useMemo(() => {
    const list = (rawItems || []).map(normalizeBannerItem);
    const filtered = activeOnly ? list.filter((x) => x.isActive) : list;
    return filtered.sort((a, b) => (a.order !== b.order ? a.order - b.order : String(a.id).localeCompare(String(b.id))));
  }, [activeOnly, rawItems]);

  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const [draft, setDraft] = useState({
    id: null,
    title: '',
    placement: DEFAULT_PLACEMENT,
    order: 0,
    isActive: true,
    image: null, // {file,previewUrl} | string url
  });

  const formStateTuple = useMemo(() => [draft, setDraft], [draft]);
  const [confirm, setConfirm] = useState(null);

  const placementMax = placementMeta?.maxItems ?? 6;

  const openCreate = () => {
    if (items.length >= placementMax) {
      notify?.notifyWarning?.(`This placement allows up to ${placementMax} images.`);
      return;
    }

    setDraft({ id: null, title: '', placement, order: 0, isActive: true, image: null });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (b) => {
    setDraft({
      id: b?.id,
      title: b?.title || '',
      placement: b?.placement || placement,
      order: Number(b?.order) || 0,
      isActive: !!b?.isActive,
      image: b?.imageUrl || null,
    });
    setFormError('');
    setShowForm(true);
  };

  const submit = async () => {
    setBusy(true);
    setFormError('');

    try {
      const fd = new FormData();
      fd.set('title', draft.title || '');
      fd.set('placement', draft.placement || placement);
      fd.set('order', String(Number(draft.order) || 0));
      fd.set('isActive', draft.isActive ? 'true' : 'false');

      if (draft.image && typeof draft.image === 'object' && draft.image.file instanceof File) {
        fd.append('images', draft.image.file);
      }

      if (!draft.id) {
        if (!fd.get('images')) {
          notify?.notifyWarning?.('Image is required.');
          return;
        }
        await managerApi.createBanner(fd);
        notify?.notifySuccess?.('Saved');
      } else {
        await managerApi.updateBanner(draft.id, fd);
        notify?.notifySuccess?.('Updated');
      }

      setShowForm(false);
      await reload();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save';
      setFormError(msg);
      notify?.notifyError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  const requestDelete = (b) => {
    const id = b?.id;
    if (!id) return;

    setConfirm({
      title: 'Confirm',
      message: 'Bạn chắc chắn muốn xoá item này?',
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await managerApi.deleteBanner(id);
          notify?.notifySuccess?.('Deleted');
          await reload();
        } catch (e) {
          notify?.notifyError?.(e?.response?.data?.message || e?.message || 'Delete failed');
        }
      },
    });
  };

  const toggleActive = async (b) => {
    if (!b?.id) return;

    try {
      const fd = new FormData();
      fd.set('title', b.title || '');
      fd.set('placement', b.placement || placement);
      fd.set('order', String(Number(b.order) || 0));
      fd.set('isActive', b.isActive ? 'false' : 'true');

      await managerApi.updateBanner(b.id, fd);
      await reload();
    } catch (e) {
      notify?.notifyError?.(e?.response?.data?.message || e?.message || 'Update failed');
    }
  };

  const updateOrder = async (b, nextOrder) => {
    if (!b?.id) return;

    try {
      const fd = new FormData();
      fd.set('title', b.title || '');
      fd.set('placement', b.placement || placement);
      fd.set('order', String(Number(nextOrder) || 0));
      fd.set('isActive', b.isActive ? 'true' : 'false');

      await managerApi.updateBanner(b.id, fd);
      await reload();
    } catch (e) {
      notify?.notifyError?.(e?.response?.data?.message || e?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Banners & Ads</h1>
          <p className="text-sm text-on-surface-variant">Manage marketing images by placement (where they appear on the public site).</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-outline-variant">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={
                viewMode === 'grid'
                  ? 'h-10 px-4 text-xs font-extrabold uppercase tracking-widest bg-primary text-on-primary'
                  : 'h-10 px-4 text-xs font-extrabold uppercase tracking-widest bg-surface text-on-surface-variant hover:bg-surface-container'
              }
              title="Grid view"
            >
              Modules
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={
                viewMode === 'table'
                  ? 'h-10 px-4 text-xs font-extrabold uppercase tracking-widest bg-primary text-on-primary'
                  : 'h-10 px-4 text-xs font-extrabold uppercase tracking-widest bg-surface text-on-surface-variant hover:bg-surface-container'
              }
              title="Table view"
            >
              Table
            </button>
          </div>

          <button
            type="button"
            onClick={() => openPreview(placementMeta?.previewPath)}
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="h-10 rounded-lg bg-primary/20 px-4 text-xs font-extrabold uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary transition-all"
          >
            Add Image
          </button>
        </div>
      </header>

      <section className="bg-surface-container p-4 sm:p-6 rounded-xl space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <label className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Placement</div>
            <select
              className="h-10 w-full rounded-lg bg-surface px-3 text-sm border border-outline-variant text-black"
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
            >
              {PLACEMENTS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg border border-outline-variant bg-surface px-4 py-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Applies to</div>
            <div className="text-sm text-on-surface-variant font-semibold">{placementLabel(placement)}</div>
            <div className="text-xs text-on-surface-variant mt-1">{placementMeta?.position || '-'}</div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <label className="inline-flex h-10 items-center gap-2 text-sm text-on-surface-variant">
              <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
              Active only
            </label>
            <button
              type="button"
              onClick={reload}
              className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-lg border border-error/60 bg-error/10 p-3 text-sm text-error">{error}</div> : null}

      {viewMode === 'grid' ? (
        <BannersAdsGrid
          items={items}
          placementLabel={placementLabel(placement)}
          onEdit={openEdit}
          onDelete={requestDelete}
          onToggleActive={toggleActive}
          onUpdateOrder={updateOrder}
        />
      ) : (
        <div className="rounded-xl border border-outline-variant bg-surface-container p-4 sm:p-6">
          <BannersAdsTable
            loading={loading}
            items={items}
            onEdit={openEdit}
            onDelete={requestDelete}
            onToggleActive={toggleActive}
          />
        </div>
      )}

      <BannersAdsFormModal
        open={showForm}
        initial={formStateTuple}
        busy={busy}
        error={formError}
        onClose={() => setShowForm(false)}
        onSubmit={submit}
        notify={notify}
      />

      <PostConfirmModal open={!!confirm} config={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}

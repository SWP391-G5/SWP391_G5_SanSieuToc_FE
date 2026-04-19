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

import { PLACEMENTS, DEFAULT_PLACEMENT, placementLabel } from './placementsMeta';
import { normalizeBannerItem } from './bannerDto';

function openPreview(previewPath) {
  if (!previewPath) return;
  window.open(previewPath, '_blank', 'noopener,noreferrer');
}

export default function BannersAdsPage() {
  const notify = useNotification();

  const preValidate = ({ nextDraft, currentItems, mode, currentId } = {}) => {
    const d = nextDraft || {};
    const selfId = currentId != null ? String(currentId) : '';
    const nextPlacement = d.placement || placement;
    const nextOrder = Number.isFinite(Number(d.order)) ? Number(d.order) : 0;
    const nextActive = !!d.isActive;

    // placement max guard
    const max = placementMeta?.maxItems;
    if (typeof max === 'number' && max > 0 && nextOrder >= max) {
      return { ok: false, message: `Order must be between 0 and ${max - 1} for this placement.` };
    }

    // Avoid duplicate (placement+order) among ACTIVE items
    if (nextActive) {
      const dup = (currentItems || []).find(
        (x) =>
          x &&
          String(x?.id ?? x?._id ?? '') !== selfId &&
          String(x.placement || '') === String(nextPlacement || '') &&
          Number(x.order) === nextOrder &&
          !!x.isActive
      );
      if (dup) {
        return { ok: false, message: `Duplicate active item at order ${nextOrder} for this placement. Please choose another order or deactivate the other item first.` };
      }
    }

    // When creating, enforce capacity per placement
    if (mode === 'create') {
      const maxItems = placementMeta?.maxItems;
      if (typeof maxItems === 'number' && maxItems > 0) {
        const countInPlacement = (currentItems || []).filter((x) => String(x?.placement || '') === String(nextPlacement || '')).length;
        if (countInPlacement >= maxItems) {
          return { ok: false, message: `This placement allows up to ${maxItems} images.` };
        }
      }
    }

    return { ok: true };
  };

  const [placement, setPlacement] = useState(DEFAULT_PLACEMENT);
  const placementMeta = useMemo(() => PLACEMENTS.find((p) => p.key === placement) || null, [placement]);

  const [activeOnly, setActiveOnly] = useState(false);

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
    __v: 0,
  });

  const formStateTuple = useMemo(() => [draft, setDraft], [draft]);
  const [confirm, setConfirm] = useState(null);

  const placementMax = placementMeta?.maxItems ?? 6;

  const nextSuggestedOrder = useMemo(() => {
    const list = items || [];
    if (!list.length) return 0;
    const maxOrder = Math.max(...list.map((x) => Number(x.order) || 0));
    return Math.max(0, maxOrder + 1);
  }, [items]);

  const openCreate = () => {
    const v = preValidate({ nextDraft: { placement }, currentItems: rawItems || [], mode: 'create' });
    if (!v.ok) {
      notify?.notifyWarning?.(v.message);
      return;
    }

    setDraft({
      id: null,
      title: '',
      placement,
      order: nextSuggestedOrder,
      isActive: true,
      image: null,
      __v: 0,
    });
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
      __v: Number(b?.__v) || 0,
    });
    setFormError('');
    setShowForm(true);
  };

  const submit = async () => {
    setBusy(true);
    setFormError('');

    try {
      const v = preValidate({ nextDraft: draft, currentItems: rawItems || [], mode: draft.id ? 'edit' : 'create', currentId: draft.id });
      if (!v.ok) {
        setFormError(v.message);
        notify?.notifyWarning?.(v.message);
        return;
      }

      const fd = new FormData();
      fd.set('title', draft.title || '');
      fd.set('placement', draft.placement || placement);
      fd.set('order', String(Number(draft.order) || 0));
      fd.set('isActive', draft.isActive ? 'true' : 'false');
      if (draft.__v !== undefined && draft.__v !== null) fd.set('__v', String(Number(draft.__v) || 0));

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
      const next = { ...b, isActive: !b.isActive };
      const v = preValidate({ nextDraft: next, currentItems: rawItems || [], mode: 'toggle', currentId: b.id });
      if (!v.ok) {
        notify?.notifyWarning?.(v.message);
        return;
      }

      const fd = new FormData();
      fd.set('title', b.title || '');
      fd.set('placement', b.placement || placement);
      fd.set('order', String(Number(b.order) || 0));
      fd.set('isActive', b.isActive ? 'false' : 'true');
      if (b.__v !== undefined && b.__v !== null) fd.set('__v', String(Number(b.__v) || 0));

      await managerApi.updateBanner(b.id, fd);
      await reload();
    } catch (e) {
      notify?.notifyError?.(e?.response?.data?.message || e?.message || 'Update failed');
    }
  };

  const updateOrder = async (b, nextOrder) => {
    if (!b?.id) return;

    try {
      const next = { ...b, order: nextOrder };
      const v = preValidate({ nextDraft: next, currentItems: rawItems || [], mode: 'order', currentId: b.id });
      if (!v.ok) {
        notify?.notifyWarning?.(v.message);
        return;
      }

      const fd = new FormData();
      fd.set('title', b.title || '');
      fd.set('placement', b.placement || placement);
      fd.set('order', String(Number(nextOrder) || 0));
      fd.set('isActive', b.isActive ? 'true' : 'false');
      if (b.__v !== undefined && b.__v !== null) fd.set('__v', String(Number(b.__v) || 0));

      await managerApi.updateBanner(b.id, fd);
      await reload();
    } catch (e) {
      notify?.notifyError?.(e?.response?.data?.message || e?.message || 'Update failed');
    }
  };

  const refresh = async () => {
    try {
      await reload?.();
      notify?.notifyInfo?.('Đã làm mới dữ liệu');
    } catch (e) {
      notify?.notifyError?.(e?.response?.data?.message || e?.message || 'Làm mới thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Banner / Quảng cáo</h1>
          <p className="text-sm text-on-surface-variant">Quản lý ảnh marketing theo vị trí hiển thị (placement) trên trang khách.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openPreview(placementMeta?.previewPath)}
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
          >
            Xem trước
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="h-10 rounded-lg bg-primary/20 px-4 text-xs font-extrabold uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary transition-all"
          >
            Thêm ảnh
          </button>
        </div>
      </header>

      <section className="bg-surface-container p-4 sm:p-6 rounded-xl space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <label className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Placement</div>
            <select
              className="h-10 w-full rounded-lg bg-surface px-3 text-sm border border-outline-variant text-on-surface-variant"
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
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Áp dụng cho</div>
            <div className="text-sm text-on-surface-variant font-semibold">{placementLabel(placement)}</div>
            <div className="text-xs text-on-surface-variant mt-1">{placementMeta?.position || '-'}</div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <label className="inline-flex h-10 items-center gap-2 text-sm text-on-surface-variant">
              <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
              Chỉ hiển thị mục đang bật
            </label>
            <button
              type="button"
              onClick={refresh}
              className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
            >
              Làm mới
            </button>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-lg border border-error/60 bg-error/10 p-3 text-sm text-error">{error}</div> : null}

      <div className="rounded-xl border border-outline-variant bg-surface-container p-4 sm:p-6">
        <BannersAdsTable
          loading={loading}
          items={items}
          onEdit={openEdit}
          onDelete={requestDelete}
          onToggleActive={toggleActive}
          onUpdateOrder={updateOrder}
        />
      </div>

      <BannersAdsFormModal
        open={showForm}
        initial={formStateTuple}
        busy={busy}
        error={formError}
        onClose={() => setShowForm(false)}
        onSubmit={submit}
        notify={notify}
      />

      <PostConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        cancelText={confirm?.cancelText || 'Hủy'}
        confirmText={confirm?.confirmText || 'Đồng ý'}
        confirmVariant={confirm?.variant === 'danger' ? 'danger' : 'primary'}
        onCancel={() => {
          confirm?.onCancel?.();
          setConfirm(null);
        }}
        onConfirm={async () => {
          await confirm?.onConfirm?.();
        }}
      />
    </div>
  );
}

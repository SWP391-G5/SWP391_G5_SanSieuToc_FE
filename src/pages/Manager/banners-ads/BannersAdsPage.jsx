/**
 * ============================================================
 * FILE: src/pages/Manager/banners-ads/BannersAdsPage.jsx
 * ============================================================
 * WHAT IS THIS FILE?
 *   Manager Banner/Ads main screen (ORCHESTRATOR).
 *   Owns page state, data fetching, and action handlers.
 *   Rendering is delegated to child components in `./`.
 *
 * RESPONSIBILITIES:
 *   - List banner/ad items by placement
 *   - Filter active-only (client-side)
 *   - Open Create/Edit modal (BannersAdsFormModal)
 *   - Confirm deletes (PostConfirmModal)
 *   - Call manager APIs to create/update/delete banner items
 *
 * DATA FLOW:
 *   MongoDB → (BE) /api/manager/banners → managerApi.getBanners()
 *           → useManagerBannersAds() → [THIS FILE] state
 *           → BannersAdsTable.jsx (render)
 *           → BannersAdsFormModal.jsx (create/edit)
 *
 * CHILD COMPONENTS USED:
 *   - src/pages/Manager/banners-ads/BannersAdsTable.jsx
 *   - src/pages/Manager/banners-ads/BannersAdsFormModal.jsx
 *   - src/pages/Manager/posts/PostConfirmModal.jsx
 *
 * API CALLS (via):
 *   - src/services/manager/managerApi.js
 *       - getBanners(), createBanner(), updateBanner(), deleteBanner()
 * ============================================================
 */

/**
  * ============================================================
 * STATE MAP (BannersAdsPage)
 * ============================================================
 * placement     {string}   Current placement key (controls server query)
 *                           Set by: placement <select>
 *                           Used by: useManagerBannersAds({ placement })
 *
 * activeOnly    {boolean}  Client-side filter for active items only
 *                           Set by: checkbox toggle
 *                           Used by: derived `items`
 *
 * showForm      {boolean}  Create/Edit modal visibility
 *                           Set by: openCreate/openEdit/onClose
 *
 * busy          {boolean}  Submit in-flight flag (create/edit)
 *                           Set by: submit() try/finally
 *                           Used by: modal + buttons disabled states
 *
 * formError     {string}   Create/Edit modal error message
 *                           Set by: submit() preValidate + catch
 *
 * draft         {object}   Controlled form object for modal:
 *                           { id, title, placement, order, isActive, image, __v }
 *                           Used by: BannersAdsFormModal (executor)
 *
 * confirm       {object}   Confirm modal data for destructive actions
 *                           Shape: { title, message, variant, confirmText, onConfirm }
 * ============================================================
 */

// ── React core ─────────────────────────────────────────────
import { useMemo, useState } from 'react';

// ── Internal: context & services ───────────────────────────
import { useNotification } from '../../../context/NotificationContext'; // toast notifications
import managerApi from '../../../services/manager/managerApi'; // manager endpoints for banners CRUD

// ── Internal: shared UI (confirm modal reused from Posts) ───
import PostConfirmModal from '../posts/PostConfirmModal';

// ── Internal: banners-ads feature executors ─────────────────
import BannersAdsFormModal from './BannersAdsFormModal';
import BannersAdsTable from './BannersAdsTable';
import useManagerBannersAds from './useManagerBannersAds';

// ── Internal: feature metadata & DTO helpers ────────────────
import { PLACEMENTS, DEFAULT_PLACEMENT, placementLabel } from './placementsMeta';
import { normalizeBannerItem } from './bannerDto';

/**
 * openPreview
 * ----------------------------------------------------------
 * Opens the placement preview page in a new tab.
 *
 * TRIGGERS: Header button "Xem trước"
 *
 * @param {string} previewPath - a relative path or absolute URL
 * @returns {void}
 */
function openPreview(previewPath) {
  if (!previewPath) return;
  try {
    const url = new URL(previewPath, window.location.origin);
    url.searchParams.set('preview', '1');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  } catch {
    const join = String(previewPath).includes('?') ? '&' : '?';
    window.open(`${previewPath}${join}preview=1`, '_blank', 'noopener,noreferrer');
  }
}

export default function BannersAdsPage() {
  // ─────────────────────────────────────────────────────────────
  // SECTION 1: CONTEXT
  // ─────────────────────────────────────────────────────────────
  const notify = useNotification();

  // ─────────────────────────────────────────────────────────────
  // SECTION 2: LOCAL HELPERS (placement-specific rules)
  // ─────────────────────────────────────────────────────────────

  /**
   * getPlacementMeta
   * --------------------------------------------------------
   * Looks up placement metadata (label, max items, preview path).
   *
   * @param {string} key - placement key
   * @returns {object|null} placement meta definition
   */
  const getPlacementMeta = (key) => (PLACEMENTS || []).find((p) => p.key === key) || null;

  /**
   * clampOrderByPlacement
   * --------------------------------------------------------
   * Ensures `order` stays within valid range when a placement
   * has a fixed slot count.
   *
   * @param {number} order
   * @param {string} placementKey
   * @returns {number} safe order (>=0 and < maxItems where applicable)
   */
  const clampOrderByPlacement = (order, placementKey) => {
    const meta = getPlacementMeta(placementKey);
    const max = meta?.maxItems;
    const n = Number.isFinite(Number(order)) ? Number(order) : 0;
    if (typeof max === 'number' && max > 0) return Math.min(Math.max(0, n), max - 1);
    return Math.max(0, n);
  };

  /**
   * preValidate
   * --------------------------------------------------------
   * Client-side guard rails before calling the API.
   *
   * VALIDATIONS:
   *   - order is within placement slot range (if fixed slots)
   *   - no duplicate ACTIVE items for same (placement + order)
   *   - during create: placement capacity check applies ONLY for ACTIVE items
   *
   * NOTE:
   *   This function does not save anything — it only returns
   *   normalized values for safe FormData building.
   */
  const preValidate = ({ nextDraft, currentItems, mode, currentId } = {}) => {
    const d = nextDraft || {};
    const selfId = currentId != null ? String(currentId) : '';
    const nextPlacement = d.placement || placement;
    const nextActive = !!d.isActive;

    const meta = getPlacementMeta(nextPlacement);
    const max = meta?.maxItems;

    // Order range guard for BOTH active and inactive when placement has fixed slots
    const nextOrder = clampOrderByPlacement(d.order, nextPlacement);
    if (typeof max === 'number' && max > 0 && (nextOrder < 0 || nextOrder >= max)) {
      return { ok: false, message: `Order must be between 0 and ${max - 1} for this placement.` };
    }

    // Avoid duplicate (placement+order) among ACTIVE items
    if (nextActive) {
      const dup = (currentItems || []).find(
        (x) =>
          x &&
          String(x?.id ?? x?._id ?? '') !== selfId &&
          String(x.placement || '') === String(nextPlacement || '') &&
          Number(x.order) === Number(nextOrder) &&
          !!x.isActive
      );
      if (dup) {
        return {
          ok: false,
          message: `Duplicate active item at order ${nextOrder} for this placement. Please choose another order or deactivate the other item first.`,
        };
      }
    }

    // IMPORTANT:
    // - Do NOT enforce capacity for inactive items.
    // - Only block creation when placement has fixed slots AND the new item is active.
    if (mode === 'create' && nextActive) {
      if (typeof max === 'number' && max > 0) {
        const activeCountInPlacement = (currentItems || []).filter(
          (x) => x && String(x?.placement || '') === String(nextPlacement || '') && !!x.isActive
        ).length;
        if (activeCountInPlacement >= max) {
          return {
            ok: false,
            message: `This placement allows up to ${max} ACTIVE images. Please deactivate an existing one or create this as Inactive.`,
          };
        }
      }
    }

    return { ok: true, normalized: { placement: nextPlacement, order: nextOrder, isActive: nextActive } };
  };

  // ─────────────────────────────────────────────────────────────
  // SECTION 3: STATE
  // ─────────────────────────────────────────────────────────────

  const [placement, setPlacement] = useState(DEFAULT_PLACEMENT);
  const placementMeta = useMemo(() => PLACEMENTS.find((p) => p.key === placement) || null, [placement]);

  const [activeOnly, setActiveOnly] = useState(false);

  const { loading, error, items: rawItems, reload } = useManagerBannersAds({ placement });

  // Derived list
  const items = useMemo(() => {
    const list = (rawItems || []).map(normalizeBannerItem);
    const filtered = activeOnly ? list.filter((x) => x.isActive) : list;

    // When showing only ACTIVE items, enforce slot-range display and drop overflow orders.
    // (These should not exist, but this prevents "filter still wrong" when backend data is dirty.)
    if (activeOnly) {
      const max = placementMeta?.maxItems;
      if (typeof max === 'number' && max > 0) {
        return filtered
          .filter((x) => Number(x.order) >= 0 && Number(x.order) < max)
          .sort((a, b) => (a.order !== b.order ? a.order - b.order : String(a.id).localeCompare(String(b.id))));
      }
    }

    return filtered.sort((a, b) => (a.order !== b.order ? a.order - b.order : String(a.id).localeCompare(String(b.id))));
  }, [activeOnly, rawItems, placementMeta]);

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

  // NOTE: BannersAdsFormModal expects a tuple: [form, setForm]
  const formStateTuple = useMemo(() => [draft, setDraft], [draft]);

  const [confirm, setConfirm] = useState(null);

  // ─────────────────────────────────────────────────────────────
  // SECTION 4: DERIVED SUGGESTIONS
  // ─────────────────────────────────────────────────────────────

  const nextSuggestedOrder = useMemo(() => {
    const meta = placementMeta;
    const max = meta?.maxItems;

    const list = items || [];
    if (typeof max === 'number' && max > 0) {
      // suggest first free slot for ACTIVE items
      const used = new Set(list.filter((x) => x?.isActive).map((x) => Number(x.order)));
      for (let i = 0; i < max; i += 1) if (!used.has(i)) return i;
      return 0;
    }

    // fallback: append after max order
    if (!list.length) return 0;
    const maxOrder = Math.max(...list.map((x) => Number(x.order) || 0));
    return Math.max(0, maxOrder + 1);
  }, [items, placementMeta]);

  // ─────────────────────────────────────────────────────────────
  // SECTION 5: EVENT HANDLERS / ACTIONS
  // ─────────────────────────────────────────────────────────────

  /**
   * openCreate
   * --------------------------------------------------------
   * Opens the Create modal with a normalized suggested order.
   */
  const openCreate = () => {
    const v = preValidate({ nextDraft: { placement, isActive: true, order: nextSuggestedOrder }, currentItems: rawItems || [], mode: 'create' });
    if (!v.ok) {
      notify?.notifyWarning?.(v.message);
      return;
    }

    setDraft({
      id: null,
      title: '',
      placement,
      order: v?.normalized?.order ?? nextSuggestedOrder,
      isActive: true,
      image: null,
      __v: 0,
    });
    setFormError('');
    setShowForm(true);
  };

  /**
   * openEdit
   * --------------------------------------------------------
   * Opens the Edit modal prefilled from the selected row.
   */
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

  /**
   * submit
   * --------------------------------------------------------
   * Builds FormData and calls create/update banner API.
   *
   * DATA SHAPE sent to BE (multipart/form-data):
   *   - title: string
   *   - placement: string
   *   - order: string (number)
   *   - isActive: 'true' | 'false'
   *   - __v: string (optional; for optimistic concurrency)
   *   - images: File (only when user picked a new image)
   */
  const submit = async () => {
    setBusy(true);
    setFormError('');

    try {
      const v = preValidate({
        nextDraft: draft,
        currentItems: rawItems || [],
        mode: draft.id ? 'edit' : 'create',
        currentId: draft.id,
      });
      if (!v.ok) {
        setFormError(v.message);
        notify?.notifyWarning?.(v.message);
        return;
      }

      const normalized = v?.normalized || {};

      const fd = new FormData();
      fd.set('title', draft.title || '');
      fd.set('placement', normalized.placement || draft.placement || placement);
      fd.set('order', String(Number(normalized.order ?? draft.order) || 0));
      fd.set('isActive', normalized.isActive ? 'true' : 'false');
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

  /**
   * requestDelete
   * --------------------------------------------------------
   * Opens confirm modal and deletes the chosen record when confirmed.
   */
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

  /**
   * toggleActive
   * --------------------------------------------------------
   * Toggles an item's active flag (requires preValidate to
   * prevent slot collisions among active items).
   */
  const toggleActive = async (b) => {
    if (!b?.id) return;

    try {
      const next = { ...b, isActive: !b.isActive };
      const v = preValidate({ nextDraft: next, currentItems: rawItems || [], mode: 'toggle', currentId: b.id });
      if (!v.ok) {
        notify?.notifyWarning?.(v.message);
        return;
      }
      const normalized = v?.normalized || {};

      const fd = new FormData();
      fd.set('title', b.title || '');
      fd.set('placement', normalized.placement || b.placement || placement);
      fd.set('order', String(Number(normalized.order ?? b.order) || 0));
      fd.set('isActive', normalized.isActive ? 'true' : 'false');
      if (b.__v !== undefined && b.__v !== null) fd.set('__v', String(Number(b.__v) || 0));

      await managerApi.updateBanner(b.id, fd);
      await reload();
    } catch (e) {
      notify?.notifyError?.(e?.response?.data?.message || e?.message || 'Update failed');
    }
  };

  // NOTE: updateOrder is currently unused in this page (kept for possible future inline editing)
  const updateOrder = async (b, nextOrder) => {
    if (!b?.id) return;

    try {
      const next = { ...b, order: nextOrder };
      const v = preValidate({ nextDraft: next, currentItems: rawItems || [], mode: 'order', currentId: b.id });
      if (!v.ok) {
        notify?.notifyWarning?.(v.message);
        return;
      }
      const normalized = v?.normalized || {};

      const fd = new FormData();
      fd.set('title', b.title || '');
      fd.set('placement', normalized.placement || b.placement || placement);
      fd.set('order', String(Number(normalized.order ?? nextOrder) || 0));
      fd.set('isActive', normalized.isActive ? 'true' : 'false');
      if (b.__v !== undefined && b.__v !== null) fd.set('__v', String(Number(b.__v) || 0));

      await managerApi.updateBanner(b.id, fd);
      await reload();
    } catch (e) {
      notify?.notifyError?.(e?.response?.data?.message || e?.message || 'Update failed');
    }
  };

  /**
   * refresh
   * --------------------------------------------------------
   * Manual refresh button that re-calls reload() and shows toasts.
   */
  const refresh = async () => {
    try {
      await reload?.();
      notify?.notifyInfo?.('Đã làm mới dữ liệu');
    } catch (e) {
      notify?.notifyError?.(e?.response?.data?.message || e?.message || 'Làm mới thất bại');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SECTION 6: RENDER
  // ─────────────────────────────────────────────────────────────

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
            <div className="text-xs text-on-surface-variant mt-1">
              {typeof placementMeta?.maxItems === 'number' && placementMeta.maxItems > 0
                ? `Số ảnh tối đa: ${placementMeta.maxItems} (Order: 0 → ${Math.max(0, placementMeta.maxItems - 1)})`
                : 'Số ảnh tối đa: không giới hạn'}
            </div>
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
        title={confirm?.title || 'Confirm'}
        message={confirm?.message}
        cancelText="Cancel"
        confirmText={confirm?.confirmText || 'OK'}
        confirmVariant={confirm?.variant === 'danger' ? 'danger' : 'primary'}
        onCancel={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
        zIndexClassName="z-[61]"
      />
    </div>
  );
}

/**
 * ManagerBannersPage.jsx
 * Manager page for banner management.
 */

import { useMemo, useState } from 'react';

import { useNotification } from '../../context/NotificationContext';
import managerApi from '../../services/manager/managerApi';

import PostConfirmModal from './posts/PostConfirmModal';

import BannerFormModal from './banners/BannerFormModal';
import BannersTable from './banners/BannersTable';
import useManagerBanners from './banners/useManagerBanners';

export default function ManagerBannersPage() {
  const notify = useNotification();

  const [placement, setPlacement] = useState('home_hero');
  const { loading, error, items, reload } = useManagerBanners({ placement });

  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const [draft, setDraft] = useState({
    id: null,
    title: '',
    placement: 'home_hero',
    order: 0,
    isActive: true,
    image: null, // {file,previewUrl} | string url
  });

  const formStateTuple = useMemo(() => [draft, setDraft], [draft]);

  const [confirm, setConfirm] = useState(null); // {message,onConfirm,variant,confirmText}

  const openCreate = () => {
    setDraft({ id: null, title: '', placement, order: 0, isActive: true, image: null });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (b) => {
    setDraft({
      id: b?._id || b?.id,
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
      fd.set('placement', draft.placement || 'home_hero');
      fd.set('order', String(Number(draft.order) || 0));
      fd.set('isActive', draft.isActive ? 'true' : 'false');

      if (draft.image && typeof draft.image === 'object' && draft.image.file instanceof File) {
        fd.append('images', draft.image.file);
      }

      if (!draft.id) {
        if (!fd.get('images')) {
          notify.notifyWarning('Image is required for new banner.');
          return;
        }
        await managerApi.createBanner(fd);
        notify.notifySuccess('Banner created');
      } else {
        await managerApi.updateBanner(draft.id, fd);
        notify.notifySuccess('Banner updated');
      }

      setShowForm(false);
      await reload();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save banner';
      setFormError(msg);
      notify.notifyError(msg);
    } finally {
      setBusy(false);
    }
  };

  const requestDelete = (b) => {
    const id = b?._id || b?.id;
    if (!id) return;

    setConfirm({
      title: 'Confirm',
      message: 'Bạn chắc chắn muốn xoá banner này?',
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await managerApi.deleteBanner(id);
          notify.notifySuccess('Banner deleted');
          await reload();
        } catch (e) {
          notify.notifyError(e?.response?.data?.message || e?.message || 'Delete failed');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Banners</h1>
          <p className="text-sm text-on-surface-variant">Manage system banners used on public pages (Home hero, promos...)</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-primary/20 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary transition-all"
        >
          New Banner
        </button>
      </header>

      <section className="bg-surface-container p-4 sm:p-6 rounded-xl space-y-4">
        <div className="flex items-end justify-between gap-3">
          <label className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Placement</div>
            <select
              className="h-10 rounded-lg bg-surface px-3 text-sm border border-outline-variant text-black"
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
            >
              <option value="home_hero">Home Hero</option>
              <option value="home_promo">Home Promo</option>
            </select>
          </label>

          <button
            type="button"
            onClick={reload}
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {error ? <div className="text-sm text-error">{error}</div> : null}
        {loading ? <div className="text-sm text-on-surface-variant">Loading...</div> : null}

        <BannersTable loading={loading} items={items} onEdit={openEdit} onDelete={requestDelete} />
      </section>

      <BannerFormModal
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
        confirmVariant="danger"
        confirmText={confirm?.confirmText || 'OK'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        zIndexClassName="z-[60]"
      />
    </div>
  );
}

/**
 * ManagerPrivacyPage.jsx
 * Manager page for managing system privacy policies (CRUD + soft delete).
 * UI: accordion list (dropdown) where clicking title expands content.
 */

import { useEffect, useMemo, useState } from 'react';

import managerApi from '../../services/manager/managerApi';
import { useNotification } from '../../context/NotificationContext';

import PostConfirmModal from './posts/PostConfirmModal';

function normalizePrivacyItem(x) {
  if (!x || typeof x !== 'object') return null;

  return {
    id: x._id || x.id,
    title: x.privacyName || x.title || '',
    content: x.privacyContent || x.content || '',
    isDeleted: !!(x.isDeleted || x.deleted || x.isActive === false),
    updatedAt: x.updatedAt || null,
    createdAt: x.createdAt || null,
    __v: typeof x.__v === 'number' ? x.__v : x.__v ?? undefined,
  };
}

function PrivacyFormModal({ open, busy, error, draft, setDraft, onClose, onSubmit }) {
  if (!open) return null;

  // NOTE: Hard limits chosen for UX consistency and to prevent overly long public content.
  // - Title: 3..80 characters (short, scannable list items)
  // - Content: 20..3000 characters (enough detail, still readable)
  const TITLE_MIN = 3;
  const TITLE_MAX = 80;
  const CONTENT_MIN = 20;
  const CONTENT_MAX = 3000;

  const titleLen = String(draft?.title || '').trim().length;
  const contentLen = String(draft?.content || '').trim().length;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/60" onClick={() => (busy ? null : onClose?.())} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-surface-container shadow-xl border border-outline-variant">
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant p-5">
            <div>
              <div className="text-lg font-headline font-black text-on-surface">
                {draft?.id ? 'Cập nhật chính sách' : 'Thêm chính sách'}
              </div>
              <div className="text-xs text-on-surface-variant">Tiêu đề + nội dung. Sẽ hiển thị ở trang công khai.</div>
            </div>
            <button
              type="button"
              className="h-9 rounded-lg px-3 text-sm font-bold border border-outline-variant hover:bg-surface"
              onClick={onClose}
              disabled={busy}
            >
              Đóng
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Tiêu đề
              </label>
              <input
                className="h-11 w-full rounded-lg bg-surface border border-outline-variant px-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Nhập tiêu đề chính sách..."
                type="text"
                value={draft?.title || ''}
                onChange={(e) => setDraft?.((p) => ({ ...p, title: e.target.value }))}
                disabled={busy}
                maxLength={TITLE_MAX}
              />
              <div className="mt-2 text-[11px] text-on-surface-variant">
                Giới hạn: <span className="font-bold text-on-surface">{TITLE_MIN}–{TITLE_MAX}</span> ký tự
                {titleLen > 0 ? (
                  <span>
                    {' '}• Hiện tại: <span className="font-bold text-on-surface">{titleLen}</span>
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Nội dung
              </label>
              <textarea
                className="w-full min-h-56 rounded-lg bg-surface border border-outline-variant px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Nhập nội dung chính sách..."
                value={draft?.content || ''}
                onChange={(e) => setDraft?.((p) => ({ ...p, content: e.target.value }))}
                disabled={busy}
                maxLength={CONTENT_MAX}
              />
              <div className="mt-2 text-[11px] text-on-surface-variant">
                Giới hạn: <span className="font-bold text-on-surface">{CONTENT_MIN}–{CONTENT_MAX}</span> ký tự
                {contentLen > 0 ? (
                  <span>
                    {' '}• Hiện tại: <span className="font-bold text-on-surface">{contentLen}</span>
                  </span>
                ) : null}
              </div>
            </div>

            {error ? <div className="text-sm text-error">{error}</div> : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="h-11 rounded-lg px-5 text-sm font-bold border border-outline-variant hover:bg-surface disabled:opacity-50"
                onClick={onClose}
                disabled={busy}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="h-11 rounded-lg bg-primary px-5 text-sm font-black text-on-primary hover:opacity-90 disabled:opacity-50"
                onClick={onSubmit}
                disabled={busy}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManagerPrivacyPage() {
  const notify = useNotification();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const [draft, setDraft] = useState({ id: null, title: '', content: '', __v: undefined });
  const [confirm, setConfirm] = useState(null);

  const normalized = useMemo(() => {
    return (items || [])
      .map(normalizePrivacyItem)
      .filter(Boolean)
      .filter((x) => !x.isDeleted)
      .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
  }, [items]);

  const load = async ({ silent } = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await managerApi.getPrivacies();
      const list = data?.items || data?.data || data || [];
      setItems(Array.isArray(list) ? list : []);
      if (!silent) notify?.notifyInfo?.('Đã làm mới dữ liệu');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load privacy policies';
      setError(msg);
      setItems([]);
      notify?.notifyError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setDraft({ id: null, title: '', content: '', __v: undefined });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setDraft({ id: p?.id, title: p?.title || '', content: p?.content || '', __v: p?.__v });
    setFormError('');
    setShowForm(true);
  };

  // NOTE: Keep these limits in sync with `PrivacyFormModal`.
  const TITLE_MIN = 3;
  const TITLE_MAX = 80;
  const CONTENT_MIN = 20;
  const CONTENT_MAX = 3000;

  const submit = async () => {
    const title = String(draft?.title || '').trim();
    const content = String(draft?.content || '').trim();

    if (!title) {
      notify?.notifyWarning?.('Vui lòng nhập tiêu đề.');
      return;
    }

    if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
      notify?.notifyWarning?.(`Tiêu đề phải từ ${TITLE_MIN} đến ${TITLE_MAX} ký tự.`);
      return;
    }

    if (!content) {
      notify?.notifyWarning?.('Vui lòng nhập nội dung chính sách.');
      return;
    }

    if (content.length < CONTENT_MIN || content.length > CONTENT_MAX) {
      notify?.notifyWarning?.(`Nội dung phải từ ${CONTENT_MIN} đến ${CONTENT_MAX} ký tự.`);
      return;
    }

    setBusy(true);
    setFormError('');

    try {
      if (!draft?.id) {
        await managerApi.createPrivacy({ privacyName: title, privacyContent: content });
        notify?.notifySuccess?.('Đã lưu');
      } else {
        await managerApi.updatePrivacyItem(draft.id, { privacyName: title, privacyContent: content, __v: draft.__v });
        notify?.notifySuccess?.('Đã cập nhật');
      }

      setShowForm(false);
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Lưu thất bại';
      setFormError(msg);
      notify?.notifyError?.(msg);
    } finally {
      setBusy(false);
    }
  };

  const requestDelete = (p) => {
    if (!p?.id) return;

    setConfirm({
      title: 'Xác nhận',
      message: 'Bạn chắc chắn muốn xoá chính sách này? (Xoá vĩnh viễn)',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      variant: 'danger',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await managerApi.deletePrivacy(p.id);
          notify?.notifySuccess?.('Đã xoá');
          await load();
        } catch (e) {
          notify?.notifyError?.(e?.response?.data?.message || e?.message || 'Xoá thất bại');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Privacy</h1>
          <p className="text-sm text-on-surface-variant">
            Quản lý các chính sách hiển thị ở trang công khai. Bấm vào tiêu đề để mở/đóng nội dung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface disabled:opacity-50"
            disabled={loading}
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="h-10 rounded-lg bg-primary/20 px-4 text-xs font-extrabold uppercase tracking-widest text-primary hover:bg-primary hover:text-on-primary transition-all"
          >
            Thêm chính sách
          </button>
        </div>
      </header>

      <section className="bg-surface-container p-4 sm:p-6 rounded-xl space-y-3">
        {error ? <div className="text-sm text-error">{error}</div> : null}
        {loading ? <div className="text-sm text-on-surface-variant">Đang tải...</div> : null}

        {!loading && normalized.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface px-4 py-6 text-sm text-on-surface-variant">
            Chưa có chính sách nào.
          </div>
        ) : null}

        <div className="space-y-2">
          {normalized.map((p) => {
            const isOpen = expandedId === p.id;

            return (
              <div key={p.id} className="rounded-xl border border-outline-variant bg-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId((prev) => (prev === p.id ? null : p.id))}
                  className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left hover:bg-surface-container"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-black text-on-surface truncate">{p.title || '—'}</div>
                    <div className="mt-1 text-xs text-on-surface-variant">
                      {p.updatedAt ? `Cập nhật: ${new Date(p.updatedAt).toLocaleString()}` : ''}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {isOpen ? (
                  <div className="border-t border-outline-variant px-4 py-4">
                    <div className="whitespace-pre-wrap text-sm text-on-surface-variant leading-relaxed">
                      {p.content || '—'}
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(p)}
                        className="h-9 rounded-lg px-3 text-xs font-bold border border-error text-error hover:bg-error hover:text-on-error"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <PrivacyFormModal
        open={showForm}
        busy={busy}
        error={formError}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setShowForm(false)}
        onSubmit={submit}
      />

      <PostConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        cancelText={confirm?.cancelText || 'Huỷ'}
        confirmVariant="danger"
        confirmText={confirm?.confirmText || 'OK'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm?.()}
        zIndexClassName="z-[80]"
      />
    </div>
  );
}

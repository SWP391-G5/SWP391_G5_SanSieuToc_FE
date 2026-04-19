/**
 * ManagerFeedbackPage.jsx
 * Manager page to view all feedback across fields.
 * Prepared UI: summary stats + placeholder table. API wiring later.
 */

import { useEffect, useMemo, useState } from 'react';
import managerApi from '@/services/manager/managerApi';
import { useNotification } from '@/context/NotificationContext';

const DEFAULT_LIMIT = 10;

function toId(x) {
  return String(x ?? '');
}

function fmtNumber(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '0';
  return Number(n).toFixed(digits);
}

/**
 * ManagerFeedbackPage
 * @returns {JSX.Element} feedback page skeleton
 */
export default function ManagerFeedbackPage() {
  const notify = useNotification();

  const [loading, setLoading] = useState(false);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [error, setError] = useState('');

  const [owners, setOwners] = useState([]);

  const [ownerId, setOwnerId] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [rate, setRate] = useState('');
  const [q, setQ] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: DEFAULT_LIMIT, total: 0 });
  const [summary, setSummary] = useState({ totalFeedback: 0, avgRating: 0, oneStar: 0, fiveStar: 0 });
  const [deletingId, setDeletingId] = useState('');
  const [deleteOpenId, setDeleteOpenId] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // NEW: keep reference to the item being deleted so the modal can show context
  const deleteItem = useMemo(() => {
    const id = String(deleteOpenId || '');
    if (!id) return null;
    return (items || []).find((x) => toId(x?.id ?? x?._id) === id) || null;
  }, [deleteOpenId, items]);

  const ownerOptions = useMemo(() => owners ?? [], [owners]);
  const fieldOptions = useMemo(() => {
    const selectedOwner = ownerId ? ownerOptions.find((o) => toId(o.id ?? o._id) === toId(ownerId)) : null;
    if (!selectedOwner) {
      // Flatten fields across all owners
      return ownerOptions.flatMap((o) => (o.fields ?? []).map((f) => ({ ...f, __ownerId: toId(o.id ?? o._id) })));
    }
    return (selectedOwner.fields ?? []).map((f) => ({ ...f, __ownerId: toId(selectedOwner.id ?? selectedOwner._id) }));
  }, [ownerId, ownerOptions]);

  const ownerNameById = useMemo(() => {
    const m = new Map();
    for (const o of ownerOptions) {
      m.set(toId(o.id ?? o._id), o.ownerName ?? o.fullName ?? o.name ?? o.email ?? toId(o.id ?? o._id));
    }
    return m;
  }, [ownerOptions]);

  const fieldNameById = useMemo(() => {
    const m = new Map();
    for (const o of ownerOptions) {
      for (const f of o.fields ?? []) {
        m.set(toId(f.id ?? f._id), f.fieldName ?? f.name ?? toId(f.id ?? f._id));
      }
    }
    return m;
  }, [ownerOptions]);

  const queryParams = useMemo(() => {
    const p = { page, limit };
    if (ownerId) p.ownerId = ownerId;
    if (fieldId) p.fieldId = fieldId;
    if (rate) p.rate = rate;
    if (q) p.q = q;
    return p;
  }, [page, limit, ownerId, fieldId, rate, q]);

  const summaryParams = useMemo(() => {
    const p = {};
    if (ownerId) p.ownerId = ownerId;
    if (fieldId) p.fieldId = fieldId;
    return p;
  }, [ownerId, fieldId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setOwnersLoading(true);
        const { items: owned } = await managerApi.getManagedOwners();
        if (!alive) return;
        setOwners(owned ?? []);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load managed owners');
      } finally {
        if (alive) setOwnersLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Reset field when owner changes (avoid invalid owner-field combo)
  useEffect(() => {
    if (!ownerId) return;
    if (!fieldId) return;
    const ok = fieldOptions.some((f) => toId(f.id ?? f._id) === toId(fieldId));
    if (!ok) setFieldId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  async function loadData({ silent } = {}) {
    setError('');
    setLoading(true);
    try {
      const [summaryRes, listRes] = await Promise.all([
        managerApi.getFeedbackSummary(summaryParams),
        managerApi.getFeedbacks(queryParams),
      ]);

      setSummary(summaryRes?.item ?? { totalFeedback: 0, avgRating: 0, oneStar: 0, fiveStar: 0 });
      setItems(listRes?.items ?? []);
      setPagination(listRes?.pagination ?? { page, limit, total: 0 });

      if (!silent) notify?.notifyInfo?.('Đã làm mới dữ liệu');
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to load feedback';
      setError(msg);
      notify?.notifyError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  const requestDelete = (item) => {
    const id = toId(item?.id ?? item?._id);
    if (!id) return;
    setDeleteOpenId(id);
    setDeleteReason('');
  };

  const cancelDelete = () => {
    setDeleteOpenId('');
    setDeleteReason('');
  };

  const confirmDelete = async () => {
    const id = String(deleteOpenId || '').trim();
    if (!id) return;

    const reason = String(deleteReason || '').trim();
    if (!reason) {
      notify?.notifyWarning?.('Vui lòng nhập lý do xoá.');
      return;
    }

    try {
      setDeletingId(id);
      await managerApi.deleteFeedback(id, reason);
      notify?.notifySuccess?.('Đã xoá feedback.');
      cancelDelete();
      await loadData();
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Không thể xoá feedback';
      setError(msg);
      notify?.notifyError?.(msg);
    } finally {
      setDeletingId('');
    }
  };

  useEffect(() => {
    loadData({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, fieldId, rate, q, page, limit]);

  const totalPages = Math.max(1, Math.ceil((pagination.total ?? 0) / (pagination.limit ?? limit)));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold">Feedback</h1>
          <p className="text-sm text-on-surface-variant">
            Xem feedback trong phạm vi owner/sân được uỷ quyền. Dùng bộ lọc để biết rõ feedback thuộc sân nào và của owner nào.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface disabled:opacity-50"
            onClick={() => loadData()}
            disabled={loading || ownersLoading}
          >
            Làm mới
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      ) : null}

      {/* Summary */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tổng feedback</div>
          <div className="mt-2 text-3xl font-black text-on-surface">{summary.totalFeedback ?? 0}</div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Điểm trung bình</div>
          <div className="mt-2 text-3xl font-black text-on-surface">{fmtNumber(summary.avgRating ?? 0, 1)}</div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">1 sao</div>
          <div className="mt-2 text-3xl font-black text-on-surface">{summary.oneStar ?? 0}</div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">5 sao</div>
          <div className="mt-2 text-3xl font-black text-on-surface">{summary.fiveStar ?? 0}</div>
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-xl border border-outline-variant bg-surface-container p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Owner</label>
            <select
              className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              value={ownerId}
              onChange={(e) => {
                setOwnerId(e.target.value);
                setPage(1);
              }}
              disabled={ownersLoading}
            >
              <option value="">Tất cả owner</option>
              {ownerOptions.map((o) => {
                const id = toId(o.id ?? o._id);
                const label = o.ownerName ?? o.fullName ?? o.name ?? o.email ?? id;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Field</label>
            <select
              className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              value={fieldId}
              onChange={(e) => {
                setFieldId(e.target.value);
                setPage(1);
              }}
              disabled={ownersLoading}
            >
              <option value="">Tất cả sân</option>
              {fieldOptions.map((f) => {
                const id = toId(f.id ?? f._id);
                const label = f.fieldName ?? f.name ?? id;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Rating</label>
            <select
              className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              value={rate}
              onChange={(e) => {
                setRate(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Search</label>
            <input
              className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/30"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo nội dung feedback..."
            />
          </div>

          <div className="md:col-span-1">
            <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Limit</label>
            <select
              className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="rounded-xl border border-outline-variant bg-surface-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/60 text-left">
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">No</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Rating</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Content</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Field</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Owner</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Created</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-on-surface-variant" colSpan={7}>
                    Đang tải…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-sm text-on-surface-variant" colSpan={7}>
                    Hiện tại chưa có feedback nào phù hợp với bộ lọc. Hãy thử điều chỉnh bộ lọc, làm mới dữ liệu hoặc đợi người chơi feedback nhé.
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const fid = toId(it.fieldId);
                  const oid = toId(it.ownerId);
                  const fieldLabel = it.fieldName ?? fieldNameById.get(fid) ?? fid;
                  const ownerLabel = ownerNameById.get(oid) ?? oid;
                  const rowNo = (pagination.page ?? page) && (pagination.limit ?? limit)
                    ? (Number(pagination.page ?? page) - 1) * Number(pagination.limit ?? limit) + idx + 1
                    : idx + 1;
                  const id = toId(it.id ?? it._id);

                  return (
                    <tr key={id} className="border-b border-outline-variant/30 hover:bg-surface transition-colors">
                      <td className="px-5 py-4 text-sm font-bold text-on-surface-variant">{rowNo}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full border border-outline-variant bg-surface px-3 py-1 text-xs font-black text-on-surface">
                          {it.rate ?? '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="max-w-[560px] whitespace-pre-wrap break-words text-sm text-on-surface">{it.content ?? ''}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-bold text-on-surface truncate">{fieldLabel}</div>
                        <div className="mt-1 text-[11px] text-on-surface-variant truncate">{fid}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-bold text-on-surface truncate">{ownerLabel}</div>
                        <div className="mt-1 text-[11px] text-on-surface-variant truncate">{oid}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">
                        {it.createdAt ? new Date(it.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          className="h-9 rounded-lg px-3 text-xs font-bold border border-error text-error hover:bg-error hover:text-on-error disabled:opacity-50"
                          disabled={loading || ownersLoading || deletingId === id}
                          onClick={() => requestDelete(it)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-outline-variant/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-on-surface-variant">
            Trang <span className="text-on-surface font-bold">{pagination.page ?? page}</span> / {totalPages} • Tổng{' '}
            <span className="text-on-surface font-bold">{pagination.total ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface disabled:opacity-50"
              disabled={loading || (pagination.page ?? page) <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            <button
              type="button"
              className="h-9 rounded-lg px-3 text-xs font-bold border border-outline-variant hover:bg-surface disabled:opacity-50"
              disabled={loading || (pagination.page ?? page) >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      {/* Delete modal */}
      {deleteOpenId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-black text-on-surface">Xoá feedback</div>
                <div className="mt-1 text-sm text-on-surface-variant">Vui lòng nhập lý do. Thao tác này sẽ ẩn feedback khỏi danh sách.</div>
              </div>
              <button
                type="button"
                className="h-9 w-9 rounded-lg border border-outline-variant hover:bg-surface disabled:opacity-50"
                onClick={cancelDelete}
                disabled={deletingId === deleteOpenId}
                aria-label="Đóng"
                title="Đóng"
              >
                ×
              </button>
            </div>

            {deleteItem ? (
              <div className="mt-4 rounded-xl border border-outline-variant bg-surface p-4">
                <div className="text-xs font-black uppercase tracking-wider text-on-surface-variant">Xem trước</div>
                <div className="mt-2 text-sm text-on-surface whitespace-pre-wrap break-words">{deleteItem.content ?? ''}</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-on-surface-variant">
                  <div>
                    <div className="font-black uppercase tracking-wider text-[10px]">Rating</div>
                    <div className="mt-1 text-sm text-on-surface">{deleteItem.rate ?? '-'}</div>
                  </div>
                  <div>
                    <div className="font-black uppercase tracking-wider text-[10px]">Created</div>
                    <div className="mt-1 text-sm text-on-surface">
                      {deleteItem.createdAt ? new Date(deleteItem.createdAt).toLocaleString() : '-'}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Lý do</label>
              <input
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-error/30"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Nhập lý do (bắt buộc)"
                disabled={deletingId === deleteOpenId}
                autoFocus
              />
              <div className="mt-2 text-[11px] text-on-surface-variant">Ví dụ: Spam / Ngôn từ không phù hợp / Không liên quan / Trùng lặp.</div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="h-10 rounded-lg px-4 text-sm font-bold border border-outline-variant hover:bg-surface disabled:opacity-50"
                onClick={cancelDelete}
                disabled={deletingId === deleteOpenId}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="h-10 rounded-lg px-4 text-sm font-bold border border-error bg-error text-on-error hover:brightness-95 disabled:opacity-50"
                onClick={confirmDelete}
                disabled={deletingId === deleteOpenId}
              >
                {deletingId === deleteOpenId ? 'Đang xoá…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';

function getInitials(u) {
  if (!u) return 'U';
  const base = String(u.name || '').trim() || String(u.username || '').trim() || String(u.email || '').trim();
  if (!base) return 'U';
  const parts = base.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || 'U';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return `${a}${b}`.toUpperCase();
}

function StatusBadge({ status }) {
  const s = String(status || '').trim();
  const cls =
    s === 'Pending'
      ? 'bg-yellow-500/15 text-yellow-200'
      : s === 'Resolved'
        ? 'bg-[#8eff71]/15 text-[#8eff71]'
        : 'bg-red-500/15 text-red-300';
  const label =
    s === 'Pending' ? 'Chờ xử lý' : s === 'Resolved' ? 'Đã xử lý' : s === 'Rejected' ? 'Từ chối' : s || '-';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

function formatUser(u) {
  if (!u) return '-';
  const name = String(u.name || '').trim();
  const username = String(u.username || '').trim();
  const email = String(u.email || '').trim();
  return [name || username || '-', email ? `(${email})` : ''].filter(Boolean).join(' ');
}

function isImageEvidenceUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;

  const lower = raw.toLowerCase();
  if (lower.startsWith('data:image/')) return true;
  const looksLikeUrl = lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('/');
  if (!looksLikeUrl) return false;

  // Accept common image extensions; ignore query/hash.
  const base = lower.split('#')[0].split('?')[0];
  return base.endsWith('.png') || base.endsWith('.jpg') || base.endsWith('.jpeg') || base.endsWith('.gif') || base.endsWith('.webp');
}

export default function ReportsPage() {
  const { notifyError, notifySuccess } = useNotification();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [noteById, setNoteById] = useState({});
  const [submittingId, setSubmittingId] = useState('');
  const [zoomEvidenceUrl, setZoomEvidenceUrl] = useState('');

  useEffect(() => {
    if (!zoomEvidenceUrl) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setZoomEvidenceUrl('');
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [zoomEvidenceUrl]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listReports();
      const list = data?.items || [];
      setItems(list);
      setNoteById((prev) => {
        const next = { ...prev };
        for (const it of list) {
          if (typeof next[it.id] === 'undefined') next[it.id] = it.adminNote || '';
        }
        return next;
      });
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Tải danh sách báo cáo thất bại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    if (!q) return items;

    return items.filter((it) => {
      const reporter = it.reporter || {};
      const target = it.target || {};
      const evidence = Array.isArray(it.evidence) ? it.evidence.join(' ') : '';
      const hay = [
        reporter.name,
        reporter.username,
        reporter.email,
        target.name,
        target.username,
        target.email,
        it.reportType,
        it.status,
        it.description,
        it.adminNote,
        evidence,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  const stats = useMemo(() => {
    const pending = items.filter((x) => x.status === 'Pending').length;
    const resolved = items.filter((x) => x.status === 'Resolved').length;
    const rejected = items.filter((x) => x.status === 'Rejected').length;
    return { pending, resolved, rejected };
  }, [items]);

  const onUpdate = async (id, status) => {
    if (!id) return;
    const note = String(noteById[id] || '').trim();

    if (status === 'Rejected' && !note) {
      notifyError('Vui lòng nhập ghi chú khi từ chối.');
      return;
    }

    setSubmittingId(id);
    try {
      await adminService.updateReportStatus(id, { status, adminNote: note });
      notifySuccess('Đã cập nhật báo cáo.');
      await load();
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Cập nhật báo cáo thất bại.');
    } finally {
      setSubmittingId('');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8eff71]/80">An toàn & tin cậy</div>
            <div className="mt-1 text-4xl font-black text-[#fdfdf6]">Quản lý báo cáo</div>
            <div className="mt-2 max-w-2xl text-sm text-[#fdfdf6]/60">
              Xem xét báo cáo của người dùng và xử lý. Khi từ chối báo cáo, bắt buộc phải có ghi chú của admin.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={load}
              className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#fdfdf6]/80 hover:text-[#8eff71]"
            >
              Làm mới
            </button>
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-white/10 bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fdfdf6]/50">Báo cáo</div>
              <div className="mt-1 text-sm font-semibold text-[#fdfdf6]">Tất cả báo cáo</div>
            </div>

            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#fdfdf6]/40">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#0d0f0b] py-2 pl-10 pr-3 text-sm outline-none focus:border-[#8eff71]/40"
                placeholder="Tìm người báo cáo, đối tượng, loại, bằng chứng..."
              />
            </div>
          </div>

          <div className="min-w-0 max-w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-black uppercase tracking-widest text-[#fdfdf6]/50">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3">Người báo cáo</th>
                  <th className="px-5 py-3">Đối tượng</th>
                  <th className="px-5 py-3">Loại</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Bằng chứng</th>
                  <th className="px-5 py-3">Ghi chú admin</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((it) => {
                  const disabled = submittingId === it.id;
                  const note = noteById[it.id] ?? '';

                  return (
                    <tr key={it.id} className="border-b border-white/5 align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/5 text-xs font-black text-[#8eff71]">
                            {getInitials(it.reporter)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-[#fdfdf6]">{formatUser(it.reporter)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/5 text-xs font-black text-[#8eff71]">
                            {getInitials(it.target)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-[#fdfdf6]">{formatUser(it.target)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#fdfdf6]/80">{it.reportType || '-'}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={it.status} />
                      </td>
                      <td className="px-5 py-4">
                        {Array.isArray(it.evidence) && it.evidence.length ? (
                          <div className="flex flex-wrap gap-2">
                            {it.evidence
                              .filter((ev) => isImageEvidenceUrl(ev))
                              .slice(0, 2)
                              .map((ev) => (
                                <button
                                  key={ev}
                                  type="button"
                                  onClick={() => setZoomEvidenceUrl(ev)}
                                  className="overflow-hidden rounded-md border border-white/10 bg-white/5 hover:border-[#8eff71]/40"
                                  title="Nhấn để phóng to"
                                >
                                  <img
                                    src={ev}
                                    alt="Bằng chứng"
                                    className="h-12 w-16 object-cover"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                  />
                                </button>
                              ))}

                            {it.evidence.filter((ev) => isImageEvidenceUrl(ev)).length > 2 ? (
                              <div className="flex h-12 items-center rounded-md border border-white/10 bg-[#0d0f0b] px-2 text-xs text-[#fdfdf6]/50">
                                +{it.evidence.filter((ev) => isImageEvidenceUrl(ev)).length - 2}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-[#fdfdf6]/50">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <textarea
                          value={note}
                          onChange={(e) => setNoteById((p) => ({ ...p, [it.id]: e.target.value }))}
                          className="h-20 w-64 resize-none rounded-md border border-white/10 bg-[#0d0f0b] px-3 py-2 text-xs outline-none focus:border-[#8eff71]/40"
                          placeholder="Ghi chú (bắt buộc khi từ chối)"
                        />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdate(it.id, 'Resolved')}
                            disabled={disabled}
                            className={
                              disabled
                                ? 'rounded-md bg-white/10 px-3 py-2 text-xs text-[#fdfdf6]/40'
                                : 'rounded-md bg-white/10 px-3 py-2 text-xs text-[#8eff71] hover:bg-[#8eff71]/10'
                            }
                          >
                            Xử lý
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdate(it.id, 'Rejected')}
                            disabled={disabled}
                            className={
                              disabled
                                ? 'rounded-md bg-white/10 px-3 py-2 text-xs text-[#fdfdf6]/40'
                                : 'rounded-md bg-white/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10'
                            }
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-[#fdfdf6]/60">
                      Chưa có báo cáo.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 text-xs text-[#fdfdf6]/50">
            <div>
              {loading
                ? 'Đang tải...'
                : `Hiển thị ${filteredItems.length} / ${items.length} báo cáo • ${stats.pending} chờ xử lý`}
            </div>
            <div />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fdfdf6]/50">Tổng báo cáo</div>
          <div className="mt-2 text-4xl font-black text-[#fdfdf6]">{items.length}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-[#0d0f0b] p-3">
              <div className="text-[#fdfdf6]/50">Chờ xử lý</div>
              <div className="mt-1 text-lg font-black text-yellow-200">{stats.pending}</div>
            </div>
            <div className="rounded-lg bg-[#0d0f0b] p-3">
              <div className="text-[#fdfdf6]/50">Đã xử lý</div>
              <div className="mt-1 text-lg font-black text-[#8eff71]">{stats.resolved}</div>
            </div>
            <div className="col-span-2 rounded-lg bg-[#0d0f0b] p-3">
              <div className="text-[#fdfdf6]/50">Từ chối</div>
              <div className="mt-1 text-lg font-black text-red-300">{stats.rejected}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fdfdf6]/50">Quy tắc</div>
          <div className="mt-3 space-y-2 text-sm text-[#fdfdf6]/70">
            <div className="rounded-md bg-[#0d0f0b] px-3 py-2">
              Từ chối yêu cầu có ghi chú của admin.
            </div>
            <div className="rounded-md bg-[#0d0f0b] px-3 py-2">
              Xử lý sẽ đóng báo cáo.
            </div>
          </div>
        </div>
      </div>

      {zoomEvidenceUrl ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setZoomEvidenceUrl('');
          }}
        >
          <div className="relative max-h-[90vh] max-w-[92vw] overflow-hidden rounded-xl border border-white/10 bg-[#0d0f0b] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <button
              type="button"
              onClick={() => setZoomEvidenceUrl('')}
              className="absolute right-2 top-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#fdfdf6]/80 hover:text-[#8eff71]"
            >
              Đóng
            </button>

            <img
              src={zoomEvidenceUrl}
              alt="Phóng to bằng chứng"
              className="block max-h-[90vh] max-w-[92vw] object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

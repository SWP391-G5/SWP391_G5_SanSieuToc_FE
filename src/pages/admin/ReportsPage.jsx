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
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{s || '-'}</span>;
}

function formatUser(u) {
  if (!u) return '-';
  const name = String(u.name || '').trim();
  const username = String(u.username || '').trim();
  const email = String(u.email || '').trim();
  return [name || username || '-', email ? `(${email})` : ''].filter(Boolean).join(' ');
}

export default function ReportsPage() {
  const { notifyError, notifySuccess } = useNotification();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [noteById, setNoteById] = useState({});
  const [submittingId, setSubmittingId] = useState('');

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
      notifyError(e?.response?.data?.message || 'Tải danh sách report thất bại.');
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
      notifyError('Vui lòng nhập note khi reject.');
      return;
    }

    setSubmittingId(id);
    try {
      await adminService.updateReportStatus(id, { status, adminNote: note });
      notifySuccess('Đã cập nhật report.');
      await load();
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Cập nhật report thất bại.');
    } finally {
      setSubmittingId('');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8eff71]/80">Trust & Safety</div>
            <div className="mt-1 text-4xl font-black text-[#fdfdf6]">Report Management</div>
            <div className="mt-2 max-w-2xl text-sm text-[#fdfdf6]/60">
              Review user reports and take action. When rejecting a report, an admin note is required.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={load}
              className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#fdfdf6]/80 hover:text-[#8eff71]"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fdfdf6]/50">Reports</div>
              <div className="mt-1 text-sm font-semibold text-[#fdfdf6]">All Reports</div>
            </div>

            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#fdfdf6]/40">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#0d0f0b] py-2 pl-10 pr-3 text-sm outline-none focus:border-[#8eff71]/40"
                placeholder="Search reporter, target, type, evidence..."
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-black uppercase tracking-widest text-[#fdfdf6]/50">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3">Reporter</th>
                  <th className="px-5 py-3">Target</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Evidence</th>
                  <th className="px-5 py-3">Admin Note</th>
                  <th className="px-5 py-3 text-right">Actions</th>
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
                          <div className="space-y-1">
                            {it.evidence.slice(0, 2).map((ev) => (
                              <div key={ev} className="max-w-[260px] truncate text-xs text-[#fdfdf6]/70">
                                {ev}
                              </div>
                            ))}
                            {it.evidence.length > 2 ? (
                              <div className="text-xs text-[#fdfdf6]/50">+{it.evidence.length - 2} more</div>
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
                          placeholder="Note (required for reject)"
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
                            Resolve
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
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-[#fdfdf6]/60">
                      Chưa có report.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 text-xs text-[#fdfdf6]/50">
            <div>
              {loading
                ? 'Loading...'
                : `${filteredItems.length} of ${items.length} reports • ${stats.pending} pending`}
            </div>
            <div />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fdfdf6]/50">Total Reports</div>
          <div className="mt-2 text-4xl font-black text-[#fdfdf6]">{items.length}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-[#0d0f0b] p-3">
              <div className="text-[#fdfdf6]/50">Pending</div>
              <div className="mt-1 text-lg font-black text-yellow-200">{stats.pending}</div>
            </div>
            <div className="rounded-lg bg-[#0d0f0b] p-3">
              <div className="text-[#fdfdf6]/50">Resolved</div>
              <div className="mt-1 text-lg font-black text-[#8eff71]">{stats.resolved}</div>
            </div>
            <div className="col-span-2 rounded-lg bg-[#0d0f0b] p-3">
              <div className="text-[#fdfdf6]/50">Rejected</div>
              <div className="mt-1 text-lg font-black text-red-300">{stats.rejected}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fdfdf6]/50">Rules</div>
          <div className="mt-3 space-y-2 text-sm text-[#fdfdf6]/70">
            <div className="rounded-md bg-[#0d0f0b] px-3 py-2">
              Reject requires an admin note.
            </div>
            <div className="rounded-md bg-[#0d0f0b] px-3 py-2">
              Resolve closes the report.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

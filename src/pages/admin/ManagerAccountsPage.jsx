import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import { useNotification } from '../../context/NotificationContext';
import {
  isValidEmail,
  isValidName,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
} from '../../utils/validators';

function getInitials(name, fallback) {
  const base = String(name || '').trim() || String(fallback || '').trim();
  if (!base) return 'U';
  const parts = base.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || 'U';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return `${a}${b}`.toUpperCase();
}

function formatDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: '2-digit' });
}

function StatusBadge({ status }) {
  const s = String(status || '').trim();
  const cls =
    s === 'Active'
      ? 'bg-[#8eff71]/15 text-[#8eff71]'
      : s === 'Deleted'
        ? 'bg-white/10 text-[#fdfdf6]/60'
      : s === 'Banned'
        ? 'bg-red-500/15 text-red-300'
        : 'bg-yellow-500/15 text-yellow-200';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{s || '-'}</span>;
}

function RolePill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#8eff71]">
      {children}
    </span>
  );
}

function Tabs({ active }) {
  const navigate = useNavigate();

  const Tab = ({ id, label, to }) => (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={
        active === id
          ? 'rounded-md bg-[#8eff71] px-4 py-2 text-xs font-black text-[#0d0f0b]'
          : 'rounded-md bg-white/5 px-4 py-2 text-xs font-semibold text-[#fdfdf6]/70 hover:text-[#8eff71]'
      }
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <Tab id="managers" label="Managers" to="/admin/managers" />
      <Tab id="owners" label="Owners" to="/admin/owners" />
      <Tab id="customers" label="Customers" to="/admin/customers" />
    </div>
  );
}

export default function ManagerAccountsPage() {
  const { notifyError, notifySuccess } = useNotification();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const [form, setForm] = useState({ username: '', email: '', name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    const username = normalizeUsername(form.username);
    const email = normalizeEmail(form.email);
    const name = String(form.name || '').trim();
    return isValidUsername(username) && isValidEmail(email) && isValidName(name);
  }, [form]);

  const availableStatuses = useMemo(() => {
    const set = new Set(['Active', 'InActive', 'Deleted']);
    for (const it of items || []) {
      const s = String(it.status || '').trim();
      if (s) set.add(s);
    }
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    const status = String(statusFilter || 'All').trim();

    return (items || []).filter((it) => {
      if (status !== 'All' && String(it.status || '').trim() !== status) return false;
      if (!q) return true;
      const hay = `${it.username} ${it.email} ${it.name}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminService.listManagers();
      setItems(data?.items || []);
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Tải danh sách Manager thất bại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();

    const username = normalizeUsername(form.username);
    const email = normalizeEmail(form.email);
    const name = String(form.name || '').trim();

    if (!isValidUsername(username) || !isValidEmail(email) || !isValidName(name)) {
      notifyError('Vui lòng nhập đúng username, email và họ tên.');
      return;
    }

    setSubmitting(true);
    try {
      await adminService.createManager({
        username,
        email,
        name,
        phone: String(form.phone || ''),
        address: String(form.address || ''),
      });
      notifySuccess('Đã tạo Manager và gửi email tài khoản.');
      setForm({ username: '', email: '', name: '', phone: '', address: '' });
      await load();
    } catch (e2) {
      notifyError(e2?.response?.data?.message || 'Tạo Manager thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    if (!id) return;
    try {
      await adminService.deleteManager(id);
      notifySuccess('Đã xóa tài khoản (soft delete).');
      await load();
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  const onRestore = async (id) => {
    if (!id) return;
    try {
      await adminService.restoreManager(id);
      notifySuccess('Đã khôi phục tài khoản.');
      await load();
    } catch (e) {
      notifyError(e?.response?.data?.message || 'Thao tác thất bại.');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8eff71]/80">User Ecosystem</div>
            <div className="mt-1 text-4xl font-black text-[#fdfdf6]">Account Management</div>
            <div className="mt-2 max-w-2xl text-sm text-[#fdfdf6]/60">
              Centralized control for system roles, permissions, and status across the San Sieu Toc network.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#fdfdf6]/80 hover:text-[#8eff71]"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              Advanced Filters
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen((v) => !v)}
              className="rounded-md bg-[#8eff71] px-4 py-2 text-sm font-semibold text-[#0d0f0b] hover:brightness-95"
            >
              Create New Account
            </button>
          </div>
        </div>

        <Tabs active="managers" />

        {filtersOpen ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fdfdf6]/50">Advanced Filters</div>
                <div className="mt-1 text-sm text-[#fdfdf6]/70">Filter the account list by status.</div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[#fdfdf6]/60">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border border-white/10 bg-[#0d0f0b] px-3 py-2 text-sm outline-none focus:border-[#8eff71]/40"
                >
                  <option value="All">All</option>
                  {availableStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {createOpen ? (
          <form onSubmit={onCreate} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Create Manager Account</div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-[#fdfdf6]/70 hover:text-[#8eff71]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-[#fdfdf6]/60">Username</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0d0f0b] px-3 py-2 text-sm outline-none focus:border-[#8eff71]/40"
                  placeholder="manager.username"
                />
              </div>
              <div>
                <label className="text-xs text-[#fdfdf6]/60">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0d0f0b] px-3 py-2 text-sm outline-none focus:border-[#8eff71]/40"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-[#fdfdf6]/60">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0d0f0b] px-3 py-2 text-sm outline-none focus:border-[#8eff71]/40"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="text-xs text-[#fdfdf6]/60">Phone (optional)</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0d0f0b] px-3 py-2 text-sm outline-none focus:border-[#8eff71]/40"
                  placeholder="0xxxxxxxxx"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-[#fdfdf6]/60">Address (optional)</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0d0f0b] px-3 py-2 text-sm outline-none focus:border-[#8eff71]/40"
                  placeholder="..."
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm({ username: '', email: '', name: '', phone: '', address: '' });
                }}
                className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#fdfdf6]/80 hover:text-[#8eff71]"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={
                  !canSubmit || submitting
                    ? 'rounded-md bg-white/10 px-4 py-2 text-sm text-[#fdfdf6]/50'
                    : 'rounded-md bg-[#8eff71] px-4 py-2 text-sm font-semibold text-[#0d0f0b] hover:brightness-95'
                }
              >
                {submitting ? 'Creating...' : 'Create Manager'}
              </button>
            </div>
          </form>
        ) : null}

        <div className="rounded-xl border border-white/10 bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fdfdf6]/50">Account List</div>
              <div className="mt-1 text-sm font-semibold text-[#fdfdf6]">Managers</div>
            </div>

            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#fdfdf6]/40">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#0d0f0b] py-2 pl-10 pr-3 text-sm outline-none focus:border-[#8eff71]/40"
                placeholder="Search by name, email or username..."
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-black uppercase tracking-widest text-[#fdfdf6]/50">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3">Account User</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">System Status</th>
                  <th className="px-5 py-3">Req. Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((it) => (
                    <tr key={it.id} className="border-b border-white/5">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/5 text-xs font-black text-[#8eff71]">
                            {getInitials(it.name, it.username)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-[#fdfdf6]">{it.name || it.username}</div>
                            <div className="truncate text-xs text-[#fdfdf6]/60">{it.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <RolePill>Manager</RolePill>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={it.status} />
                      </td>
                      <td className="px-5 py-4 text-[#fdfdf6]/70">{formatDate(it.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        {it.status === 'Deleted' ? (
                          <button
                            type="button"
                            onClick={() => onRestore(it.id)}
                            className="rounded-md bg-white/10 px-3 py-2 text-xs text-[#8eff71] hover:bg-[#8eff71]/10"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDelete(it.id)}
                            className="rounded-md bg-white/10 px-3 py-2 text-xs text-[#fdfdf6]/80 hover:text-[#8eff71]"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                {!loading && filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#fdfdf6]/60">
                      Không có tài khoản phù hợp.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 text-xs text-[#fdfdf6]/50">
            <div>{loading ? 'Loading...' : `Showing ${filteredItems.length} of ${items.length} managers`}</div>
            <div />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fdfdf6]/50">Total Accounts</div>
          <div className="mt-2 text-4xl font-black text-[#fdfdf6]">{items.length}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-[#0d0f0b] p-3">
              <div className="text-[#fdfdf6]/50">Active</div>
              <div className="mt-1 text-lg font-black text-[#8eff71]">
                {items.filter((x) => x.status === 'Active').length}
              </div>
            </div>
            <div className="rounded-lg bg-[#0d0f0b] p-3">
              <div className="text-[#fdfdf6]/50">Inactive</div>
              <div className="mt-1 text-lg font-black text-yellow-200">
                {items.filter((x) => x.status === 'InActive').length}
              </div>
            </div>
            <div className="rounded-lg bg-[#0d0f0b] p-3">
              <div className="text-[#fdfdf6]/50">Deleted</div>
              <div className="mt-1 text-lg font-black text-[#fdfdf6]/60">
                {items.filter((x) => x.status === 'Deleted').length}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#fdfdf6]/50">Distribution</div>
          <div className="mt-4 space-y-3 text-sm">
            <button
              type="button"
              onClick={() => navigate('/admin/managers')}
              className="flex w-full items-center justify-between rounded-md bg-[#0d0f0b] px-3 py-2 text-left text-[#fdfdf6]/80 hover:text-[#8eff71]"
            >
              <span>Managers</span>
              <span className="text-xs font-black text-[#8eff71]">{items.length}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/owners')}
              className="flex w-full items-center justify-between rounded-md bg-[#0d0f0b] px-3 py-2 text-left text-[#fdfdf6]/80 hover:text-[#8eff71]"
            >
              <span>Owners</span>
              <span className="text-xs font-black">›</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/customers')}
              className="flex w-full items-center justify-between rounded-md bg-[#0d0f0b] px-3 py-2 text-left text-[#fdfdf6]/80 hover:text-[#8eff71]"
            >
              <span>Customers</span>
              <span className="text-xs font-black">›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

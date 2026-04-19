/**
 * ManagerStatisticsPage.jsx
 * Manager dashboard statistics page.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import managerApi from '../../services/manager/managerApi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// ✅ React Query
import { useQuery } from '@tanstack/react-query';

function formatCompactNumber(n) {
  const v = Number(n) || 0;
  return v.toLocaleString();
}

function formatVndTick(v) {
  const n = Number(v) || 0;
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000_000) return `${Math.round(n / 1_000_000_000)}B`;
  if (Math.abs(n) >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d0f0b]/95 px-3 py-2 shadow-lg">
      <div className="text-xs font-black text-[#fdfdf6]">{label}</div>
      <div className="mt-1 space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="text-[11px] text-[#fdfdf6]/80">
            <span className="inline-block w-2 h-2 rounded-sm mr-2" style={{ background: p.color }} />
            {p.name}: {formatCompactNumber(p.value)}
          </div>
        ))}
      </div>
    </div>
  );
}

const PRESETS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'last7days', label: '7 ngày gần đây' },
  { value: 'thisWeek', label: 'Tuần này' },
  { value: 'thisMonth', label: 'Tháng này' },
  { value: 'lastMonth', label: 'Tháng trước' },
];

/**
 * ManagerStatisticsPage
 * @returns {JSX.Element} statistics page
 */
export default function ManagerStatisticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ownerId = String(searchParams.get('ownerId') || '').trim();

  const [preset, setPreset] = useState('thisMonth');
  const [groupBy, setGroupBy] = useState('day');
  const [trendViewMode, setTrendViewMode] = useState('chart');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState(null);
  const [bookingsTrend, setBookingsTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [hotFields, setHotFields] = useState([]);

  const [scopeOpen, setScopeOpen] = useState(false);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState('');
  const [managedOwners, setManagedOwners] = useState([]);

  const [fieldViewOpen, setFieldViewOpen] = useState(false);
  const [fieldViewing, setFieldViewing] = useState(null);

  // Full field detail (fetched on-demand when modal opens)
  const fieldIdForDetail = useMemo(() => {
    const raw = fieldViewing?.id ?? fieldViewing?._id ?? fieldViewing?.fieldId;
    if (!raw) return '';
    // handle objectId-like shape
    if (typeof raw === 'object') {
      return String(raw._id || raw.id || raw.$oid || '');
    }
    return String(raw);
  }, [fieldViewing]);

  const fieldDetailQ = useQuery({
    queryKey: ['managerStatistics', 'fieldDetailFull', fieldIdForDetail],
    enabled: Boolean(fieldViewOpen && fieldIdForDetail),
    queryFn: () => managerApi.getFieldByIdFull(fieldIdForDetail),
    keepPreviousData: true,
  });

  // API shape: { success: true, data: { field: {...}, services: [...] } }
  const fieldDetailPayload = fieldDetailQ.data?.data || null;
  const fieldDetail = fieldDetailPayload?.field || null;
  const fieldServices = Array.isArray(fieldDetailPayload?.services) ? fieldDetailPayload.services : [];

  const displayField = fieldDetail || fieldViewing;

  const query = useMemo(() => ({ preset, ...(ownerId ? { ownerId } : {}) }), [preset, ownerId]);
  const trendQuery = useMemo(() => ({ preset, groupBy, ...(ownerId ? { ownerId } : {}) }), [preset, groupBy, ownerId]);

  // =========================
  // React Query: statistics
  // =========================
  const summaryQ = useQuery({
    queryKey: ['managerStatistics', 'summary', query],
    queryFn: () => managerApi.getStatisticsSummary(query),
    keepPreviousData: true,
  });

  const bookingsTrendQ = useQuery({
    queryKey: ['managerStatistics', 'bookingsTrend', trendQuery],
    queryFn: () => managerApi.getBookingsTrend(trendQuery),
    keepPreviousData: true,
  });

  const revenueTrendQ = useQuery({
    queryKey: ['managerStatistics', 'revenueTrend', trendQuery],
    queryFn: () => managerApi.getRevenueTrend(trendQuery),
    keepPreviousData: true,
  });

  const hotFieldsQ = useQuery({
    queryKey: ['managerStatistics', 'hotFields', { preset, limit: 5 }],
    queryFn: () => managerApi.getHotFields({ preset, limit: 5 }),
    keepPreviousData: true,
  });

  const anyLoading = summaryQ.isLoading || bookingsTrendQ.isLoading || revenueTrendQ.isLoading || hotFieldsQ.isLoading;
  const firstError = summaryQ.error || bookingsTrendQ.error || revenueTrendQ.error || hotFieldsQ.error;

  useEffect(() => {
    setLoading(anyLoading);
    if (!firstError) {
      setError('');
      return;
    }
    setError(firstError?.response?.data?.message || firstError?.message || 'Tải thống kê thất bại');
  }, [anyLoading, firstError]);

  // Sync query results into local state (minimizes JSX edits)
  useEffect(() => {
    if (summaryQ.data !== undefined) setSummary(summaryQ.data || null);
  }, [summaryQ.data]);

  useEffect(() => {
    if (bookingsTrendQ.data !== undefined) setBookingsTrend(bookingsTrendQ.data?.series || []);
  }, [bookingsTrendQ.data]);

  useEffect(() => {
    if (revenueTrendQ.data !== undefined) setRevenueTrend(revenueTrendQ.data?.series || []);
  }, [revenueTrendQ.data]);

  useEffect(() => {
    if (hotFieldsQ.data !== undefined) setHotFields(hotFieldsQ.data?.items || []);
  }, [hotFieldsQ.data]);

  useEffect(() => {
    let cancelled = false;

    const ensureScopeLoaded = async () => {
      if (!ownerId) return;
      if (managedOwners.length) return;

      setScopeLoading(true);
      setScopeError('');
      try {
        const data = await managerApi.getManagedOwners();
        if (cancelled) return;
        setManagedOwners(data?.items || []);
      } catch (e) {
        if (cancelled) return;
        setScopeError(e?.response?.data?.message || e?.message || 'Tải danh sách owner được quản lý thất bại');
      } finally {
        if (!cancelled) setScopeLoading(false);
      }
    };

    ensureScopeLoaded();
    return () => {
      cancelled = true;
    };
  }, [ownerId, managedOwners.length]);

  const openScope = async () => {
    if (loading) return;
    setScopeOpen(true);
    if (managedOwners.length) return;

    setScopeLoading(true);
    setScopeError('');
    try {
      const data = await managerApi.getManagedOwners();
      setManagedOwners(data?.items || []);
    } catch (e) {
      setScopeError(e?.response?.data?.message || e?.message || 'Tải danh sách owner được quản lý thất bại');
    } finally {
      setScopeLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      ownersCount: summary?.ownersCount ?? 0,
      fieldsCount: summary?.fieldsCount ?? 0,
      // unique bookings
      bookingsCount: summary?.totalBookingsCount ?? summary?.bookingsCount ?? 0,
      // slots booked (booking details)
      slotsBooked: summary?.totalSlotsBooked ?? 0,
      fieldRevenue: summary?.fieldRevenue ?? 0,
      serviceRevenue: summary?.serviceRevenue ?? 0,
      grossRevenue: summary?.grossRevenue ?? 0,
      refundAmount: summary?.refundAmount ?? 0,
      netRevenue: summary?.netRevenue ?? 0,
    };
  }, [summary]);

  const focusedOwner = useMemo(() => {
    if (!ownerId) return null;
    return (
      summary?.focusedOwner ||
      (managedOwners || []).find((o) => String(o.id) === String(ownerId)) ||
      null
    );
  }, [managedOwners, ownerId, summary]);

  const focusedOwnerFields = useMemo(() => {
    if (!ownerId) return [];
    const o = (managedOwners || []).find((x) => String(x.id) === String(ownerId));
    return o?.fields || [];
  }, [managedOwners, ownerId]);

  const clearOwnerFocus = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('ownerId');
    setSearchParams(next, { replace: true });
  };

  const selectOwnerFocus = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('ownerId', String(id));
    else next.delete('ownerId');
    setSearchParams(next, { replace: true });
    setScopeOpen(false);
  };

  const focusOwnerFromHotField = (f) => {
    const nextOwnerId = String(f?.ownerId || '').trim();
    if (!nextOwnerId) {
      // Hot fields could be missing ownerId if BE not updated
      // Keep silent in UI but still help debugging
      setError('Không xác định được owner của sân này để Focus Owner.');
      return;
    }
    selectOwnerFocus(nextOwnerId);
  };

  const openFieldView = (field) => {
    if (!field) return;
    // ensure modal renders basic info immediately while full detail loads
    setFieldViewing(field);
    setFieldViewOpen(true);
  };

  const closeFieldView = () => {
    setFieldViewOpen(false);
    setFieldViewing(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-headline font-bold">Statistics</h1>
          <p className="text-sm text-on-surface-variant">Thống kê theo phạm vi Manager (chỉ owner được phân công).</p>

          {ownerId ? (
            <div className="mt-2 space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-widest text-[#fdfdf6]/60">Owner đang lọc</div>
                    <div className="text-sm font-bold text-[#fdfdf6] truncate">
                      {focusedOwner?.name || focusedOwner?.username
                        ? `${focusedOwner?.name || ''}${focusedOwner?.username ? ` (${focusedOwner.username})` : ''}`
                        : `Owner: ${ownerId}`}
                    </div>
                    {focusedOwner?.email ? (
                      <div className="text-xs text-[#fdfdf6]/60 truncate">{focusedOwner.email}</div>
                    ) : null}
                    {focusedOwner?.phone || focusedOwner?.address ? (
                      <div className="text-[11px] text-[#fdfdf6]/50 truncate">
                        {focusedOwner?.phone ? `SĐT: ${focusedOwner.phone}` : ''}
                        {focusedOwner?.phone && focusedOwner?.address ? ' • ' : ''}
                        {focusedOwner?.address ? `Địa chỉ: ${focusedOwner.address}` : ''}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openScope}
                      disabled={loading}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#fdfdf6]/80 hover:text-[#8eff71] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Đổi Owner
                    </button>
                    <button
                      type="button"
                      onClick={clearOwnerFocus}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-[#fdfdf6]/80 hover:text-[#ff4d4d] hover:bg-white/10"
                    >
                      Bỏ lọc
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-[#fdfdf6]/60">Fields</div>
                    <div className="text-sm text-[#fdfdf6]/80">
                      {focusedOwnerFields.length ? `Tổng: ${focusedOwnerFields.length}` : 'Không tìm thấy sân nào cho owner này.'}
                    </div>
                  </div>
                  <div className="text-[11px] text-[#fdfdf6]/50">Bấm vào thẻ để xem chi tiết.</div>
                </div>

                {focusedOwnerFields.length ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {focusedOwnerFields.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => openFieldView(f)}
                        className="rounded-xl border border-white/10 bg-[#0d0f0b] p-4 text-left hover:bg-white/5 transition-colors"
                        title="Xem chi tiết sân"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-[#fdfdf6] truncate">{f.fieldName || 'Chưa có tên sân'}</div>
                            <div className="text-[11px] text-[#fdfdf6]/60 truncate">{f.fieldType || 'Chưa rõ loại sân'}</div>
                          </div>
                          {f.status ? (
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#8eff71]">{String(f.status)}</div>
                          ) : null}
                        </div>
                        <div className="mt-2 text-[11px] text-[#fdfdf6]/60 line-clamp-2">{f.address || 'Chưa có địa chỉ'}</div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {loading ? <div className="text-xs text-on-surface-variant">Đang tải…</div> : null}
          {error ? <div className="text-xs text-error">{error}</div> : null}

          {!ownerId ? (
            <button
              type="button"
              onClick={openScope}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#fdfdf6]/80 hover:text-[#8eff71] hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View managed owners
            </button>
          ) : null}
        </div>
      </header>

      {/* ✅ Field detail modal (focus owner → click field card) */}
      {fieldViewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0d0f0b]/95 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <div className="text-sm font-black uppercase tracking-widest text-[#fdfdf6]/70">Chi tiết sân</div>
                <div className="text-lg font-bold text-[#fdfdf6] truncate">
                  {displayField?.fieldName || displayField?.name || 'Sân'}
                </div>
                {fieldDetailQ.isFetching ? (
                  <div className="mt-1 text-[11px] text-[#fdfdf6]/50">Loading full details…</div>
                ) : null}
                {fieldDetailQ.error ? (
                  <div className="mt-1 text-[11px] text-error">
                    {fieldDetailQ.error?.response?.data?.message || fieldDetailQ.error?.message || 'Load field detail failed'}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeFieldView}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-[#fdfdf6]/70 hover:text-[#8eff71]"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-5">
              {!displayField ? (
                <div className="text-sm text-on-surface-variant">No field selected.</div>
              ) : (
                <>
                  {/* Gallery (API uses `image: []`) */}
                  {Array.isArray(displayField.image) && displayField.image.length ? (
                    <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {displayField.image.slice(0, 6).map((src, idx) => (
                        <div key={`${src}-${idx}`} className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                          <img src={src} alt={`Field image ${idx + 1}`} className="h-28 w-full object-cover" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">Type</div>
                      <div className="mt-1 text-sm font-semibold text-[#fdfdf6]">{displayField.fieldType || displayField.type || '—'}</div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">Status</div>
                      <div className="mt-1 text-sm font-semibold text-[#fdfdf6]">{displayField.status || '—'}</div>
                    </div>

                    <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">Address</div>
                      <div className="mt-1 text-sm text-[#fdfdf6]/80 whitespace-pre-wrap">{displayField.address || '—'}</div>
                    </div>

                    {displayField.city ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">City</div>
                        <div className="mt-1 text-sm font-semibold text-[#fdfdf6]">{displayField.city}</div>
                      </div>
                    ) : null}

                    {displayField.sizeKey ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">Size</div>
                        <div className="mt-1 text-sm font-semibold text-[#fdfdf6]">{displayField.sizeKey}</div>
                      </div>
                    ) : null}

                    {displayField.description ? (
                      <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">Description</div>
                        <div className="mt-1 text-sm text-[#fdfdf6]/80 whitespace-pre-wrap">{displayField.description}</div>
                      </div>
                    ) : null}

                    {(displayField.hourlyPrice ?? displayField.price) !== undefined && (displayField.hourlyPrice ?? displayField.price) !== null ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">Price/hour</div>
                        <div className="mt-1 text-sm font-semibold text-[#fdfdf6]">{formatCompactNumber(displayField.hourlyPrice ?? displayField.price)} VND</div>
                      </div>
                    ) : null}

                    {displayField.slotDuration ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">Slot duration</div>
                        <div className="mt-1 text-sm font-semibold text-[#fdfdf6]">{formatCompactNumber(displayField.slotDuration)} minutes</div>
                      </div>
                    ) : null}

                    {displayField.openingTime || displayField.closingTime ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">Hours</div>
                        <div className="mt-1 text-sm font-semibold text-[#fdfdf6]">
                          {displayField.openingTime || '—'} - {displayField.closingTime || '—'}
                        </div>
                      </div>
                    ) : null}

                    {Array.isArray(displayField.utilities) && displayField.utilities.length ? (
                      <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">Utilities</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {displayField.utilities.slice(0, 30).map((u) => (
                            <span key={String(u)} className="rounded-full border border-white/10 bg-[#0f0b] px-3 py-1 text-[11px] text-[#fdfdf6]/70">
                              {String(u)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {fieldServices.length ? (
                      <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#fdfdf6]/60">Dịch vụ</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {fieldServices.slice(0, 30).map((s, idx) => (
                            <span key={String(s?._id || s?.id || idx)} className="rounded-full border border-white/10 bg-[#0f0b] px-3 py-1 text-[11px] text-[#fdfdf6]/70">
                              {String(s?.serviceName || s?.name || 'Dịch vụ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {scopeOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0d0f0b]/95 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-sm font-black uppercase tracking-widest text-[#fdfdf6]/70">Phạm vi quản lý</div>
                <div className="text-lg font-bold text-[#fdfdf6]">Owner & sân bạn được phân công</div>
              </div>
              <button
                type="button"
                onClick={() => setScopeOpen(false)}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-[#fdfdf6]/70 hover:text-[#8eff71]"
              >
                Đóng
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-5">
              {scopeLoading ? <div className="text-sm text-on-surface-variant">Đang tải…</div> : null}
              {scopeError ? <div className="text-sm text-error">{scopeError}</div> : null}

              {!scopeLoading && !managedOwners.length ? (
                <div className="text-sm text-on-surface-variant">No owners assigned.</div>
              ) : null}

              <div className="space-y-4">
                {managedOwners.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => selectOwnerFocus(o.id)}
                    className="block w-full text-left rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                    title="Focus statistics on this owner"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#fdfdf6] truncate">
                          {o.name} ({o.username})
                        </div>
                        <div className="text-xs text-[#fdfdf6]/60 truncate">{o.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-black uppercase tracking-widest text-[#8eff71]">Fields: {o.fieldsCount}</div>
                        {String(ownerId) === String(o.id) ? (
                          <div className="text-[10px] font-black uppercase tracking-widest text-primary">Selected</div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {(o.fields || []).map((f) => (
                        <div key={f.id} className="rounded-lg border border-white/10 bg-[#0f0b] p-3">
                          <div className="text-sm font-semibold text-[#fdfdf6] truncate">{f.fieldName}</div>
                          <div className="text-[11px] text-[#fdfdf6]/60 truncate">{f.fieldType} • {f.address}</div>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Doanh thu sân</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-primary">{formatCompactNumber(stats.fieldRevenue)}</h3>
            <span className="text-xs font-bold text-tertiary pb-1 mb-1">VND</span>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Tổng giao dịch loại = Thanh toán sân</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Doanh thu dịch vụ</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-primary">{formatCompactNumber(stats.serviceRevenue)}</h3>
            <span className="text-xs font-bold text-tertiary pb-1 mb-1">VND</span>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Tổng giao dịch loại = Thanh toán dịch vụ</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Tổng doanh thu (Gross)</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-primary">{formatCompactNumber(stats.grossRevenue)}</h3>
            <span className="text-xs font-bold text-tertiary pb-1 mb-1">VND</span>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Thanh toán sân + thanh toán dịch vụ</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Số tiền hoàn (Refund)</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-error">{formatCompactNumber(stats.refundAmount)}</h3>
            <span className="text-xs font-bold text-tertiary pb-1 mb-1">VND</span>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Tổng giao dịch loại = Hoàn tiền</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Doanh thu thực nhận (Net)</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-on-surface">{formatCompactNumber(stats.netRevenue)}</h3>
            <span className="text-xs font-bold text-tertiary pb-1 mb-1">VND</span>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Gross - Refund</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Tổng lượt đặt (Booking)</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-on-surface">{formatCompactNumber(stats.bookingsCount)}</h3>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Đếm theo Booking.createdAt (trong phạm vi quản lý)</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Tổng slot đã được đặt (Booking Detail)</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-on-surface">{formatCompactNumber(stats.slotsBooked)}</h3>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Đếm theo BookingDetail (trong phạm vi quản lý)</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Owners Managed</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-tertiary">{formatCompactNumber(stats.ownersCount)}</h3>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Số owner được phân công cho manager này</div>
        </div>

        <div className="bg-surface-container p-6 rounded-xl">
          <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Sân</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-headline font-black text-primary">{formatCompactNumber(stats.fieldsCount)}</h3>
          </div>
          <div className="mt-4 text-[10px] text-on-surface-variant">Sân thuộc các owner được phân công</div>
        </div>
      </section>

      {/* Trend + Top fields */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-headline font-bold">Xu hướng doanh thu</h2>
              <p className="text-sm text-on-surface-variant">Field / Service / Gross / Refund / Net grouped by {groupBy}.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <label className="mr-2 text-xs uppercase tracking-widest text-on-surface-variant">Preset</label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  disabled={loading}
                  className="bg-transparent text-sm text-on-surface outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {PRESETS.map((p) => (
                    <option key={p.value} value={p.value} className="bg-[#0d0f0b]">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <label className="mr-2 text-xs uppercase tracking-widest text-on-surface-variant">Nhóm theo</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  disabled={loading}
                  className="bg-transparent text-sm text-on-surface outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  { [
                    { value: 'day', label: 'Ngày' },
                    { value: 'week', label: 'Tuần' },
                    { value: 'month', label: 'Tháng' },
                  ].map((g) => (
                    <option key={g.value} value={g.value} className="bg-[#0d0f0b]">
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <label className="mr-2 text-xs uppercase tracking-widest text-on-surface-variant">Chế độ xem</label>
                <select
                  value={trendViewMode}
                  onChange={(e) => setTrendViewMode(e.target.value)}
                  disabled={loading}
                  className="bg-transparent text-sm text-on-surface outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {[{ value: 'chart', label: 'Biểu đồ' }, { value: 'list', label: 'Danh sách' }].map((x) => (
                    <option key={x.value} value={x.value} className="bg-[#0d0f0b]">
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-surface-container p-6 rounded-xl">
            {trendViewMode === 'chart' ? (
              revenueTrend.length ? (
                <div className="w-full" style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      <XAxis dataKey="label" stroke="rgba(253,253,246,0.6)" tick={{ fontSize: 11 }} />
                      <YAxis stroke="rgba(253,253,246,0.6)" tick={{ fontSize: 11 }} tickFormatter={formatVndTick} />
                      <Tooltip content={<CurrencyTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(253,253,246,0.7)' }} />

                      <Bar dataKey="fieldRevenue" name="Field" stackId="rev" fill="#8eff71" isAnimationActive={false} />
                      <Bar dataKey="serviceRevenue" name="Service" stackId="rev" fill="#4cc9f0" isAnimationActive={false} />
                      <Bar dataKey="refund" name="Refund" fill="#ff4d4d" isAnimationActive={false} />

                      <Line type="monotone" dataKey="net" name="Net" stroke="#fdfdf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-on-surface-variant">No revenue data for selected range.</div>
              )
            ) : revenueTrend.length ? (
              <div className="space-y-2">
                {revenueTrend.map((it) => (
                  <div key={it.label} className="flex items-center justify-between gap-4 border-b border-white/5 py-2">
                    <div className="text-sm font-semibold text-on-surface">{it.label}</div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      <span className="text-primary">Field: {formatCompactNumber(it.fieldRevenue ?? 0)}</span>
                      <span className="text-primary">Service: {formatCompactNumber(it.serviceRevenue ?? 0)}</span>
                      <span className="text-primary">Gross: {formatCompactNumber(it.gross)}</span>
                      <span className="text-error">Refund: {formatCompactNumber(it.refund)}</span>
                      <span className="text-on-surface-variant">Net: {formatCompactNumber(it.net)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-on-surface-variant">No revenue data for selected range.</div>
            )}
          </div>

          <div className="bg-surface-container p-6 rounded-xl">
            <h3 className="text-sm font-bold mb-3">Bookings Trend</h3>
            {trendViewMode === 'chart' ? (
              bookingsTrend.length ? (
                <div className="w-full" style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bookingsTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      <XAxis dataKey="label" stroke="rgba(253,253,246,0.6)" tick={{ fontSize: 11 }} />
                      <YAxis stroke="rgba(253,253,246,0.6)" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-lg border border-white/10 bg-[#0d0f0b]/95 px-3 py-2 shadow-lg">
                              <div className="text-xs font-black text-[#fdfdf6]">{label}</div>
                              <div className="mt-1 text-[11px] text-[#fdfdf6]/80">Lượt đặt sân: {formatCompactNumber(payload[0].value)}</div>
                            </div>
                          );
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(253,253,246,0.7)' }} />
                      <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#8eff71" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-on-surface-variant">No booking data for selected range.</div>
              )
            ) : bookingsTrend.length ? (
              <div className="space-y-2">
                {bookingsTrend.map((it) => (
                  <div key={it.label} className="flex items-center justify-between border-b border-white/5 py-2">
                    <div className="text-sm text-on-surface">{it.label}</div>
                    <div className="text-sm font-black text-on-surface">{formatCompactNumber(it.bookings)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-on-surface-variant">No booking data for selected range.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div>
            <h2 className="text-xl font-headline font-bold">Top Fields</h2>
            <p className="text-xs text-on-surface-variant mt-1">Xếp hạng theo tổng slot đã được đặt (Booking Detail) trong khoảng thời gian đang chọn.</p>
          </div>
          <div className="bg-surface-container p-6 rounded-xl">
            {hotFields.length ? (
              <div className="space-y-3">
                {hotFields.map((f, idx) => (
                  <button
                    key={f.fieldId}
                    type="button"
                    onClick={() => focusOwnerFromHotField(f)}
                    className="w-full text-left rounded-lg px-2 py-1.5 -mx-2 hover:bg-white/5 transition-colors"
                    title="Focus Owner của sân này"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          #{idx + 1} {f.fieldName || 'Field'}
                        </div>
                      </div>
                      <div className="text-sm font-black text-primary">{formatCompactNumber(f.bookingsCount)}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-on-surface-variant">No hot fields for selected range.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  getOwnerFieldRevenueDetail,
  getOwnerInventoryByField,
  getOwnerTopServicesByField,
} from "../../services/owner/ownerRevenueService";

const PERIOD_OPTIONS = [
  { value: "week", label: "Tuan" },
  { value: "month", label: "Thang" },
  { value: "year", label: "Nam" },
];

const SORT_OPTIONS = [
  { value: "quantity", label: "So luong" },
  { value: "revenue", label: "Doanh thu" },
];

export default function OwnerRevenuePage() {
  const [inventory, setInventory] = useState([]);
  const [topByField, setTopByField] = useState([]);
  const [period, setPeriod] = useState("week");
  const [sortBy, setSortBy] = useState("quantity");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detail, setDetail] = useState(null);

  const periodLabel = useMemo(
    () => PERIOD_OPTIONS.find((p) => p.value === period)?.label || "Tuan",
    [period],
  );

  const formatNumber = (value) =>
    new Intl.NumberFormat("vi-VN").format(value || 0);
  const formatCurrency = (value) => `${formatNumber(value)} d`;
  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const formatRange = (from, to) => {
    if (!from || !to) return "";
    const f = new Date(from);
    const t = new Date(to);
    if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) return "";
    return `${f.toLocaleDateString("vi-VN")} - ${t.toLocaleDateString("vi-VN")}`;
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [invRes, topRes] = await Promise.all([
        getOwnerInventoryByField(),
        getOwnerTopServicesByField(period, 5, sortBy),
      ]);

      setInventory(invRes?.items || []);
      setTopByField(topRes?.items || []);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Khong the tai du lieu doanh thu.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, sortBy]);

  const openDetail = async (fieldId) => {
    if (!fieldId) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetail(null);
    try {
      const res = await getOwnerFieldRevenueDetail(fieldId, period, 10);
      setDetail(res || null);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Khong the tai chi tiet san.";
      setDetailError(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailError("");
    setDetail(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-on-surface">Revenue</h1>
        <p className="text-sm text-on-surface-variant">
          Tong quan ton kho va bang xep hang dich vu ban chay.
        </p>
      </header>

      {error ? <div className="text-sm text-error">{error}</div> : null}

      {/* Inventory cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-on-surface">
            Ton kho dich vu theo san
          </h2>
        </div>

        {inventory.length === 0 ? (
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-6 text-sm text-on-surface-variant">
            Chua co du lieu ton kho.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {inventory.map((item) => (
              <button
                key={item.fieldId}
                type="button"
                onClick={() => openDetail(item.fieldId)}
                className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 text-left hover:border-primary/40 hover:bg-surface-container transition-colors"
              >
                <div className="text-sm text-on-surface-variant">San</div>
                <div className="text-lg font-bold text-on-surface mt-1">
                  {item.fieldName || "—"}
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-on-surface-variant">
                      Tong ton kho
                    </div>
                    <div className="text-2xl font-black text-on-surface">
                      {formatNumber(item.totalStock)}
                    </div>
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {formatNumber(item.serviceCount)} dich vu
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Top services by field */}
      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-on-surface">
            Bang xep hang dich vu ban chay theo san
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-on-surface-variant">Khoang thoi gian</span>
            <select
              className="h-9 rounded-lg bg-surface px-3 text-xs border border-outline-variant text-on-surface"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <span className="text-xs text-on-surface-variant ml-2">Xep hang theo</span>
            <select
              className="h-9 rounded-lg bg-surface px-3 text-xs border border-outline-variant text-on-surface"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {topByField.length === 0 ? (
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-6 text-sm text-on-surface-variant">
            Chua co du lieu ban chay trong {periodLabel.toLowerCase()} nay.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topByField.map((field) => (
              <div
                key={field.fieldId}
                className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-on-surface-variant">San</div>
                    <div className="text-lg font-bold text-on-surface">
                      {field.fieldName || "—"}
                    </div>
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    Top {field.topServices?.length || 0}
                  </div>
                </div>

                {field.topServices && field.topServices.length > 0 ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-outline-variant/30">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-container">
                        <tr className="text-left text-xs uppercase tracking-widest text-on-surface-variant">
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Dich vu</th>
                          <th className="px-3 py-2 text-right">
                            {sortBy === "revenue" ? "Doanh thu" : "So luong"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {field.topServices.map((svc, idx) => (
                          <tr key={svc.serviceId || `${field.fieldId}-${idx}`}>
                            <td className="px-3 py-2 text-on-surface-variant">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2 text-on-surface">
                              {svc.serviceName || "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-on-surface">
                              {sortBy === "revenue"
                                ? formatCurrency(svc.totalRevenue)
                                : formatNumber(svc.totalQty)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-on-surface-variant">
                    Chua co giao dich dich vu trong {periodLabel.toLowerCase()}{" "}
                    nay.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {detailOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeDetail}
          role="button"
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeDetail();
          }}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-surface-container-high border border-outline-variant shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-on-surface">
                  Chi tiet san
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  {detail?.field?.name || "—"}
                </p>
                {detail?.range ? (
                  <p className="text-xs text-on-surface-variant mt-1">
                    Khoang thoi gian:{" "}
                    {formatRange(detail.range.from, detail.range.to)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="h-10 rounded-lg px-4 text-sm font-bold text-on-surface-variant border border-outline-variant hover:bg-surface"
              >
                Dong
              </button>
            </div>

            <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-72px)]">
              {detailLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : null}

              {detailError ? (
                <div className="text-sm text-error">{detailError}</div>
              ) : null}

              {!detailLoading && !detailError ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
                      <div className="text-xs text-on-surface-variant">
                        Doanh thu san
                      </div>
                      <div className="text-2xl font-black text-on-surface mt-2">
                        {formatNumber(detail?.revenue?.fieldRevenue)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
                      <div className="text-xs text-on-surface-variant">
                        Doanh thu dich vu
                      </div>
                      <div className="text-2xl font-black text-on-surface mt-2">
                        {formatNumber(detail?.revenue?.serviceRevenue)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
                      <div className="text-xs text-on-surface-variant">
                        Tong doanh thu
                      </div>
                      <div className="text-2xl font-black text-on-surface mt-2">
                        {formatNumber(detail?.revenue?.totalRevenue)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-on-surface">
                        Ton kho dich vu
                      </h3>
                      {detail?.inventory?.length ? (
                        <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-surface-container">
                              <tr className="text-left text-xs uppercase tracking-widest text-on-surface-variant">
                                <th className="px-3 py-2">Dich vu</th>
                                <th className="px-3 py-2 text-right">Ton</th>
                                <th className="px-3 py-2 text-right">Gia</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                              {detail.inventory.map((svc) => (
                                <tr key={svc._id || svc.serviceName}>
                                  <td className="px-3 py-2 text-on-surface">
                                    {svc.serviceName || "—"}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-on-surface">
                                    {formatNumber(svc.stock)}
                                  </td>
                                  <td className="px-3 py-2 text-right text-on-surface-variant">
                                    {formatNumber(svc.price)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-on-surface-variant">
                          Chua co dich vu.
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-on-surface">
                        Lich su mua dich vu
                      </h3>
                      {detail?.history?.length ? (
                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                          {detail.history.map((row) => (
                            <div
                              key={row._id}
                              className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="text-sm text-on-surface">
                                  {formatDateTime(row.detail?.startTime)}
                                </div>
                                <div className="text-sm font-semibold text-on-surface">
                                  {formatNumber(row.totalPriceSnapShot)}
                                </div>
                              </div>
                              <div className="text-xs text-on-surface-variant mt-1">
                                {row.detail?.startTime &&
                                row.detail?.endTime ? (
                                  <span>
                                    {new Date(
                                      row.detail.startTime,
                                    ).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                    {" - "}
                                    {new Date(
                                      row.detail.endTime,
                                    ).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </div>
                              {row.service?.length ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {row.service.map((svc, idx) => (
                                    <span
                                      key={`${row._id}-${idx}`}
                                      className="text-xs rounded-full border border-outline-variant px-2 py-1 text-on-surface-variant"
                                    >
                                      {svc.serviceName} x{svc.quantity}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-on-surface-variant">
                          Chua co giao dich dich vu trong{" "}
                          {periodLabel.toLowerCase()} nay.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

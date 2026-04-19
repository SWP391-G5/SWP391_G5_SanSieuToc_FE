import React, { useEffect, useState, useCallback } from "react";
import { ownerBookingService } from "../../services/owner/ownerBookingService";
import { useNotification } from "../../context/NotificationContext";

const STATUS_FILTERS = [
  { label: "Tất cả", value: "All" },
  { label: "Đã đặt", value: "Booked" },
  { label: "Yêu cầu hủy", value: "Cancel Request" },
  { label: "Đã hủy", value: "Cancel" },
];

const statusStyle = {
  Booked: "bg-primary/15 text-primary",
  "Cancel Request": "bg-amber-500/15 text-amber-400",
  Cancel: "bg-error/15 text-error",
};

const paymentStyle = {
  Completed: "text-primary",
  Pending: "text-amber-400",
  "Pending Refund": "text-amber-400",
  Refunded: "text-on-surface-variant line-through",
  Cancel: "text-error",
};

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [processingId, setProcessingId] = useState(null);
  const [detailBooking, setDetailBooking] = useState(null);
  const { notifySuccess, notifyError } = useNotification();

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString("vi-VN") : "—";

  const fetchBookings = useCallback(async (status = "All") => {
    try {
      setLoading(true);
      const res = await ownerBookingService.getBookings(status);
      setBookings(res.bookings || []);
    } catch (err) {
      notifyError();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(activeFilter);
  }, [activeFilter, fetchBookings]);

  const handleApprove = async (id) => {
    if (!window.confirm("Duyệt hủy đơn này và hoàn tiền cho khách?")) return;
    try {
      setProcessingId(id);
      await ownerBookingService.approveCancel(id);
      notifySuccess();
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, bookingStatus: "Cancel", paymentStatus: "Refunded" }
            : b,
        ),
      );
      if (detailBooking?.id === id) setDetailBooking(null);
    } catch (err) {
      notifyError();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Từ chối huỷ? Booking sẽ được giữ nguyên.")) return;
    try {
      setProcessingId(id);
      await ownerBookingService.rejectCancel(id);
      notifySuccess();
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, bookingStatus: "Booked", paymentStatus: "Completed" }
            : b,
        ),
      );
      if (detailBooking?.id === id) setDetailBooking(null);
    } catch (err) {
      notifyError();
    } finally {
      setProcessingId(null);
    }
  };

  const cancelRequestCount = bookings.filter(
    (b) => b.bookingStatus === "Cancel Request",
  ).length;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <span className="text-tertiary font-label text-xs uppercase tracking-[0.3em] mb-2 block">
            Booking Management
          </span>
          <h2 className="headline-font text-5xl font-extrabold text-on-surface tracking-tighter leading-none">
            Reservations &amp;{" "}
            <span className="text-primary italic">Requests</span>
          </h2>
          <p className="text-on-surface-variant mt-3 max-w-md">
            Quản lý toàn bộ lịch đặt sân. Duyệt hoặc từ chối các yêu cầu hủy từ
            khách hàng.
          </p>
        </div>
        {cancelRequestCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3">
            <span className="material-symbols-outlined text-amber-400">
              warning
            </span>
            <div>
              <p className="font-bold text-amber-400 text-sm">
                {cancelRequestCount} Yêu cầu hủy
              </p>
              <p className="text-amber-400/70 text-xs">cần xử lý</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilter === f.value
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Booking Table */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-outline-variant/10 text-[10px] font-label uppercase text-on-surface-variant tracking-widest">
          <div className="col-span-3">Khách hàng</div>
          <div className="col-span-3">Sân</div>
          <div className="col-span-2">Ngày / Giờ</div>
          <div className="col-span-1">Tổng tiền</div>
          <div className="col-span-1">Thanh toán</div>
          <div className="col-span-2 text-right">Trạng thái / Hành động</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">
            Đang tải dữ liệu...
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-20 mb-4">
              event_busy
            </span>
            <p className="font-semibold">Không có booking nào</p>
            <p className="text-sm opacity-60 mt-1">Thử chọn bộ lọc khác</p>
          </div>
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 border-b border-outline-variant/5 hover:bg-surface-container transition-colors items-center"
            >
              {/* Customer */}
              <div className="md:col-span-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center flex-shrink-0 text-sm uppercase">
                  {b.customer.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface text-sm truncate">
                    {b.customer.name}
                  </p>
                  <p className="text-on-surface-variant text-xs truncate">
                    {b.customer.email}
                  </p>
                </div>
              </div>

              {/* Field */}
              <div className="md:col-span-3 flex items-center gap-3">
                {b.field.image ? (
                  <img
                    src={b.field.image}
                    alt={b.field.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant/40">
                      stadium
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface text-sm truncate">
                    {b.field.name}
                  </p>
                  <p className="text-tertiary text-xs">{b.field.type}</p>
                </div>
              </div>

              {/* Date/Time */}
              <div className="md:col-span-2">
                <p className="text-sm text-on-surface">{b.dates?.[0] || "—"}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {b.slots?.[0] || "—"}
                </p>
                {b.slots?.length > 1 && (
                  <p className="text-[10px] text-tertiary">
                    +{b.slots.length - 1} slot
                  </p>
                )}
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Tạo: {formatDateTime(b.createdAt)}
                </p>
              </div>

              {/* Total */}
              <div className="md:col-span-1">
                <p className="text-sm font-bold text-on-surface">
                  {b.totalPrice?.toLocaleString("vi-VN")}đ
                </p>
              </div>

              {/* Payment Status */}
              <div className="md:col-span-1">
                <span
                  className={`text-xs font-semibold ${paymentStyle[b.paymentStatus] || "text-on-surface-variant"}`}
                >
                  {b.paymentStatus}
                </span>
              </div>

              {/* Status + Actions */}
              <div className="md:col-span-2 flex flex-col items-end gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusStyle[b.bookingStatus] || "bg-surface text-on-surface-variant"}`}
                >
                  {b.bookingStatus}
                </span>

                {b.bookingStatus === "Cancel Request" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(b.id)}
                      disabled={processingId === b.id}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase rounded bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50"
                      title="Duyệt hủy + hoàn tiền"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        check_circle
                      </span>
                      Duyệt
                    </button>
                    <button
                      onClick={() => handleReject(b.id)}
                      disabled={processingId === b.id}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase rounded bg-error/10 text-error hover:bg-error hover:text-white transition-all disabled:opacity-50"
                      title="Từ chối hủy"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        cancel
                      </span>
                      Từ chối
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setDetailBooking(b)}
                  className="text-[10px] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">
                    info
                  </span>
                  Chi tiết
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {detailBooking && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setDetailBooking(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-start">
                <div>
                  <h3 className="headline-font text-xl font-bold">
                    Chi tiết đặt sân
                  </h3>
                  <p className="text-on-surface-variant text-xs mt-1">
                    ID: {detailBooking.id}
                  </p>
                </div>
                <button
                  onClick={() => setDetailBooking(null)}
                  className="text-on-surface-variant hover:text-primary"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase text-on-surface-variant font-label mb-1">
                      Khách hàng
                    </p>
                    <p className="font-semibold">
                      {detailBooking.customer.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {detailBooking.customer.email}
                    </p>
                    {detailBooking.customer.phone && (
                      <p className="text-xs text-on-surface-variant">
                        {detailBooking.customer.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-on-surface-variant font-label mb-1">
                      Sân
                    </p>
                    <p className="font-semibold">{detailBooking.field.name}</p>
                    <p className="text-xs text-tertiary">
                      {detailBooking.field.type}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-on-surface-variant font-label mb-2">
                    Ngày & Giờ đặt
                  </p>
                  {detailBooking.slots.map((slot, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm mb-1"
                    >
                      <span className="material-symbols-outlined text-sm text-primary">
                        schedule
                      </span>
                      <span>
                        {
                          detailBooking.dates[
                            Math.min(i, detailBooking.dates.length - 1)
                          ]
                        }{" "}
                        — {slot}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
                  <div>
                    <p className="text-[10px] uppercase text-on-surface-variant font-label mb-1">
                      Tổng cộng
                    </p>
                    <p className="text-2xl font-bold text-primary headline-font">
                      {detailBooking.totalPrice?.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold uppercase ${statusStyle[detailBooking.bookingStatus] || ""}`}
                    >
                      {detailBooking.bookingStatus}
                    </span>
                  </div>
                </div>
                {detailBooking.refundReason && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-[10px] uppercase text-amber-400 font-label mb-1">
                      Lý do hủy từ khách
                    </p>
                    <p className="text-sm text-on-surface">
                      {detailBooking.refundReason}
                    </p>
                  </div>
                )}
                {detailBooking.bookingStatus === "Cancel Request" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(detailBooking.id)}
                      disabled={processingId === detailBooking.id}
                      className="flex-1 py-2 bg-primary text-on-primary font-bold text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      ✅ Duyệt hủy & Hoàn tiền
                    </button>
                    <button
                      onClick={() => handleReject(detailBooking.id)}
                      disabled={processingId === detailBooking.id}
                      className="flex-1 py-2 bg-error/10 text-error font-bold text-sm rounded-lg hover:bg-error hover:text-white disabled:opacity-50 transition-all"
                    >
                      ❌ Từ chối hủy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

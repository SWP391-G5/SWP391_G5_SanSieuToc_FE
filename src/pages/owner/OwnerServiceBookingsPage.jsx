import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ownerServiceBookingService } from "../../services/owner/ownerServiceBookingService";
import { useNotification } from "../../context/NotificationContext";

const STATUS_FILTERS = [
  { label: "Tất cả", value: "All" },
  { label: "Đã đặt", value: "Active" },
  { label: "Yêu cầu hủy", value: "Cancel Request" },
  { label: "Đã hủy", value: "Cancelled" },
];

const statusStyle = {
  Active: "bg-primary/15 text-primary",
  "Cancel Request": "bg-amber-500/15 text-amber-400",
  Cancelled: "bg-error/15 text-error",
};

const paymentStyle = {
  Completed: "text-primary",
  Pending: "text-amber-400",
  "Pending Refund": "text-amber-400",
  Refunded: "text-on-surface-variant line-through",
  Cancel: "text-error",
};

export default function OwnerServiceBookingsPage() {
  const [serviceBookings, setServiceBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [detailBooking, setDetailBooking] = useState(null);
  const { notifySuccess, notifyError } = useNotification();

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString("vi-VN") : "—";

  const fetchServiceBookings = useCallback(async (status = "All") => {
    try {
      setLoading(true);
      const res = await ownerServiceBookingService.getServiceBookings(status);
      setServiceBookings(res.serviceBookings || []);
    } catch (err) {
      notifyError();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServiceBookings(activeFilter);
  }, [activeFilter, fetchServiceBookings]);

  const totalServiceRevenue = serviceBookings.reduce(
    (sum, sb) => sum + (sb.totalPrice || 0),
    0
  );

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <span className="text-tertiary font-label text-xs uppercase tracking-[0.3em] mb-2 block">
            Service Booking Management
          </span>
          <h2 className="headline-font text-5xl font-extrabold text-on-surface tracking-tighter leading-none">
            Dịch vụ{" "}
            <span className="text-primary italic">Orders</span>
          </h2>
          <p className="text-on-surface-variant mt-3 max-w-md">
            Quản lý đơn đặt dịch vụ của khách hàng tại các sân bạn sở hữu.
          </p>
        </div>
        <Link
          to="/owner/bookings"
          className="flex items-center gap-2 px-4 py-2 bg-surface-container text-on-surface font-semibold rounded-lg hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">event_available</span>
          Field Bookings
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">
            Tổng đơn dịch vụ
          </p>
          <p className="text-3xl font-bold text-primary headline-font">
            {serviceBookings.length}
          </p>
        </div>
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">
            Tổng doanh thu dịch vụ
          </p>
          <p className="text-3xl font-bold text-primary headline-font">
            {totalServiceRevenue.toLocaleString("vi-VN")}đ
          </p>
        </div>
        <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">
            Dịch vụ đã bán
          </p>
          <p className="text-3xl font-bold text-primary headline-font">
            {serviceBookings.reduce(
              (sum, sb) => sum + (sb.services?.length || 0),
              0
            )}
          </p>
        </div>
      </div>

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

      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-outline-variant/10 text-[10px] font-label uppercase text-on-surface-variant tracking-widest">
          <div className="col-span-3">Khách hàng</div>
          <div className="col-span-2">Sân</div>
          <div className="col-span-2">Ngày / Giờ</div>
          <div className="col-span-2">Dịch vụ</div>
          <div className="col-span-1">Tổng tiền</div>
          <div className="col-span-2 text-right">Thao tác</div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">
            Đang tải dữ liệu...
          </div>
        ) : serviceBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-20 mb-4">
              inventory_2
            </span>
            <p className="font-semibold">Không có đơn dịch vụ nào</p>
            <p className="text-sm opacity-60 mt-1">Thử chọn bộ lọc khác</p>
          </div>
        ) : (
          serviceBookings.map((sb) => (
            <div
              key={sb.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 border-b border-outline-variant/5 hover:bg-surface-container transition-colors items-center"
            >
              <div className="md:col-span-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center flex-shrink-0 text-sm uppercase">
                  {sb.customer.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface text-sm truncate">
                    {sb.customer.name}
                  </p>
                  <p className="text-on-surface-variant text-xs truncate">
                    {sb.customer.email}
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                {sb.field.image ? (
                  <img
                    src={sb.field.image}
                    alt={sb.field.name}
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
                    {sb.field.name}
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm text-on-surface">
                  {sb.serviceDate
                    ? new Date(sb.serviceDate).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {sb.serviceDate
                    ? new Date(sb.serviceDate).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Đặt: {formatDateTime(sb.createdAt)}
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-1">
                  {sb.services?.slice(0, 2).map((s, i) => (
                    <p
                      key={i}
                      className="text-xs text-on-surface truncate"
                    >
                      {s.quantity}x {s.serviceName}
                    </p>
                  ))}
                  {sb.services?.length > 2 && (
                    <p className="text-[10px] text-tertiary">
                      +{sb.services.length - 2} dịch vụ khác
                    </p>
                  )}
                </div>
              </div>

              <div className="md:col-span-1">
                <p className="text-sm font-bold text-on-surface">
                  {sb.totalPrice?.toLocaleString("vi-VN")}đ
                </p>
              </div>

              <div className="md:col-span-2 flex flex-col items-end gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    statusStyle[sb.bookingStatus] || "bg-surface text-on-surface-variant"
                  }`}
                >
                  {sb.bookingStatus}
                </span>
                <button
                  onClick={() => setDetailBooking(sb)}
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
                    Chi tiết đặt dịch vụ
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
                    <p className="font-semibold">
                      {detailBooking.field.name}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-on-surface-variant font-label mb-2">
                    Dịch vụ đã đặt
                  </p>
                  <div className="space-y-2">
                    {detailBooking.services?.map((s, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-on-surface">
                          {s.quantity}x {s.serviceName}
                        </span>
                        <span className="text-primary font-semibold">
                          {(s.price * s.quantity).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    ))}
                  </div>
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
                      className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                        statusStyle[detailBooking.bookingStatus] || ""
                      }`}
                    >
                      {detailBooking.bookingStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
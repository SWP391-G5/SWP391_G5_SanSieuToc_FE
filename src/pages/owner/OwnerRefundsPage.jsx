import { useState, useEffect } from 'react';
import axiosInstance from '../../services/axios';

export default function OwnerRefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRefunds();
    const interval = setInterval(fetchRefunds, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchRefunds = async () => {
    try {
      const res = await axiosInstance.get('/api/bookings/owner/refund-requests');
      setRefunds(res.data.refunds || []);
    } catch (err) {
      console.error('Failed to fetch refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (bookingId, approve) => {
    if (!window.confirm(approve ? "Duyệt hoàn tiền (80% field + 100% service)?" : "Từ chối hoàn tiền?")) return;
    try {
      if (approve) {
        await axiosInstance.put(`/api/bookings/refund/${bookingId}/approve`);
      } else {
        await axiosInstance.put(`/api/bookings/refund/${bookingId}/reject`);
      }
      fetchRefunds();
    } catch (err) {
      console.error('Failed to process refund:', err);
    }
  };

  const formatVnd = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
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
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Refund Requests</h1>
        <p className="text-on-surface-variant">Quản lý yêu cầu hoàn tiền (sân + dịch vụ)</p>
      </div>

      {refunds.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">replay</span>
          <p className="mt-4 text-on-surface-variant">No pending refund requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {refunds.map((booking) => {
            const fieldRefund = booking.fieldRefundAmount || Math.floor(booking.totalPrice * 0.8);
            const serviceRefund = booking.serviceTotalPrice || 0;
            const totalRefund = fieldRefund + serviceRefund;
            const isPartial = booking.isPartialCancel;

            return (
              <div key={booking._id} className="bg-surface-container rounded-xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-semibold text-on-surface">Booking #{booking._id?.slice(-6)}</p>
                    <p className="text-sm text-on-surface-variant">
                      {new Date(booking.createdAt).toLocaleString('vi-VN')}
                    </p>
                    {isPartial && (
                      <p className="text-xs text-amber-400 mt-1">
                        Hủy {booking.cancelledSlotCount} slot
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-error/20 text-error rounded-full text-sm">
                    Pending Refund
                  </span>
                </div>
                <div className="mb-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-on-surface-variant">Tiền sân: </p>
                    <p className="font-bold text-lg text-on-surface">{formatVnd(booking.totalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">Hoàn sân (80%): </p>
                    <p className="font-bold text-lg text-success">{formatVnd(fieldRefund)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">Hoàn dịch vụ (100%): </p>
                    <p className="font-bold text-xl text-success">{formatVnd(serviceRefund)}</p>
                  </div>
                </div>
                {serviceRefund > 0 && (
                  <div className="mb-4 bg-primary/10 rounded-lg p-3">
                    <p className="text-sm text-primary font-semibold">Có dịch vụ đi kèm: {formatVnd(serviceRefund)} (100% refund)</p>
                  </div>
                )}
                <div className="mb-4 bg-success/10 border border-success/30 rounded-lg p-3">
                  <p className="text-success font-bold text-lg">Tổng hoàn: {formatVnd(totalRefund)}</p>
                </div>
                {booking.refundReason && (
                  <div className="mb-4">
                    <p className="text-sm text-on-surface-variant">Lý do: </p>
                    <p className="text-on-surface">{booking.refundReason}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRefund(booking._id, true)}
                    className="flex-1 bg-success text-on-primary py-2 rounded-lg font-medium hover:opacity-90"
                  >
                    Duyệt hoàn tiền
                  </button>
                  <button
                    onClick={() => handleRefund(booking._id, false)}
                    className="flex-1 bg-error text-on-primary py-2 rounded-lg font-medium hover:opacity-90"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
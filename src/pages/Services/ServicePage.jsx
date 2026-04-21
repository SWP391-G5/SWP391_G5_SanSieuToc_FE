import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import serviceService from '../../services/serviceService';
import profileService from '../../services/profileService';
import { setAuthToken } from '../../services/axios';
import { Modal } from '../../components/Modal';

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Ngày không xác định';
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function ServicePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [servicesList, setServicesList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 5;

  const fetchBookings = async () => {
    try {
      if (auth.accessToken) setAuthToken(auth.accessToken);
      const data = await bookingService.getMyBookings();
      console.log('Fetched bookings:', JSON.stringify(data.bookings?.slice(0,1)));
      setBookings(data.bookings || []);
      
      const allEntries = [];
      for (const b of (data.bookings || [])) {
        const statusKey = (b.status || '').toString().trim().toLowerCase();
        console.log('Processing booking:', b.fieldName, 'status:', statusKey);
        if (statusKey.includes('cancel')) {
          console.log('Skipping cancelled booking:', b.id);
          continue;
        }
        
        const allTimes = [];
        let hasEndedSlot = false;
        for (const dateGroup of (b.allDates || [])) {
          for (const slot of (dateGroup.slots || [])) {
            const slotStatus = String(slot.status || '').trim();
            if (slotStatus === 'End' || slotStatus === 'Cancel') {
              hasEndedSlot = true;
              continue;
            }
            allTimes.push(`${dateGroup.date} ${slot.start}-${slot.end}`);
          }
        }
        if (allTimes.length === 0) continue;
        allEntries.push({
          id: b.id,
          fieldName: b.fieldName,
          timeSlots: allTimes.join(', '),
          status: statusKey,
          services: b.services || [],
          totalPrice: b.servicesTotal || 0,
          createdAt: b.createdAt,
          canFeedback: b.canFeedback && hasEndedSlot
        });
      }
      setServicesList(allEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setLoading(true);
    fetchBookings(); 
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSlotClick = async (slot, booking) => {
    setSelectedSlot({ ...slot, bookingId: booking.id, fieldName: booking.fieldName });
    setLoadingServices(true);
    setShowModal(true);
    
    try {
      const profileRes = await profileService.getMyProfile();
      const profileData = profileRes?.data || profileRes;
      setWalletBalance(Number(profileData?.wallet?.balance || 0));
    } catch (err) {
      setWalletBalance(0);
    }

    try {
      const data = await serviceService.getServicesByBookingDetail(slot.id);
      setAvailableServices(data.services || []);
      const existing = data.existingServices || [];
      setSelectedServices(existing.map(s => ({
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        price: s.price,
        quantity: s.quantity || 1,
      })));
    } catch (err) {
      setAvailableServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.serviceId === service._id);
      if (exists) return prev.filter(s => s.serviceId !== service._id);
      return [...prev, { serviceId: service._id, serviceName: service.serviceName, price: service.price, quantity: 1, stock: service.stock }];
    });
  };

  const updateQuantity = (serviceId, delta) => {
    setSelectedServices(prev => prev.map(s => {
      if (s.serviceId === serviceId) {
        const newQty = (s.quantity || 1) + delta;
        const maxStock = s.stock || 999;
        if (newQty < 1 || newQty > maxStock) return s;
        return { ...s, quantity: newQty };
      }
      return s;
    }));
  };

  const handleBookServices = async () => {
    if (selectedServices.length === 0 || walletBalance < totalServicesPrice) return;
    setSubmitting(true);
    try {
      if (auth.accessToken) setAuthToken(auth.accessToken);
      await serviceService.bookServices({
        bookingDetailId: selectedSlot.id,
        services: selectedServices,
        paymentMethod: 'wallet',
        totalPrice: totalServicesPrice,
      });
      setShowModal(false);
      setShowSuccess(true);
      fetchBookings();
      setTimeout(() => { setShowSuccess(false); setShowHistory(true); }, 1500);
    } catch (err) {
      console.error('Failed to book services:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalServicesPrice = selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0);
  const walletSufficient = walletBalance >= totalServicesPrice;

  const activeBookings = bookings.filter(b => {
    const statusKey = (b.status || '').toString().trim().toLowerCase();
    if (statusKey.includes('cancel')) return false;
    const hasActiveSlot = (b.allDates || []).some(d => (d.slots || []).some(s => {
      const slotStatus = (s.status || '').toString().trim().toLowerCase();
      return slotStatus === 'active';
    }));
    return hasActiveSlot;
  });
  const totalPages = Math.ceil(servicesList.length / itemsPerPage);
  const paginatedServices = servicesList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12m-6-4v2m-6-4V7a4 4 0 014-4h4a4 4 0 014 4v8a4 4 0 01-4 4h-4a4 4 0 01-4-4z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Đăng nhập để tiếp tục</h2>
          <p className="text-gray-500 mb-4">Quản lý dịch vụ đặt sân</p>
          <button onClick={() => navigate('/auth')} className="px-6 py-2 bg-[#4ade80] text-black font-medium rounded-lg hover:bg-[#22c55e] transition">Đăng nhập</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="w-8 h-8 border-4 border-[#4ade80] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6 pt-2">
          <div>
            <h1 className="text-2xl font-bold text-white">Dịch vụ</h1>
            <p className="text-sm text-gray-500">{showHistory ? 'Lịch sử đặt' : 'Chọn slot để thêm dịch vụ'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setLoading(true); fetchBookings(); }}
              className="px-3 py-2 bg-[#1a1a1a] text-gray-400 hover:text-white rounded-lg"
            >
              🔄
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                showHistory ? 'bg-[#4ade80] text-black' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
              }`}
            >
              {showHistory ? '← Quay lại' : '📋 Lịch sử'}
          </button>
        </div>
        </div>

        {showHistory ? (
          <div className="space-y-3">
            {servicesList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Chưa có dịch vụ nào</p>
              </div>
            ) : (
              <>
                {paginatedServices.map((group, idx) => (
                  <div key={idx} className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{group.fieldName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{group.timeSlots}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-medium">{group.status}</span>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-gray-800">
                      {group.services?.length > 0 ? group.services.map((s, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-300">{s.serviceName}</span>
                          <span className="text-green-400 font-medium">{formatPrice(s.price)}</span>
                        </div>
                      )) : <p className="text-sm text-gray-600">Chưa đặt dịch vụ</p>}
                    </div>
                    {group.canFeedback && (
                      <button className="mt-3 w-full py-2 bg-[#4ade80] text-black font-medium rounded-lg flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">star</span>
                        <span>Đánh giá</span>
                      </button>
                    )}
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-lg bg-[#1a1a1a] text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 flex items-center justify-center"
                    >
                      ←
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition ${
                            currentPage === page
                              ? 'bg-[#4ade80] text-black'
                              : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="w-10 h-10 rounded-lg bg-[#1a1a1a] text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 flex items-center justify-center"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-lg mb-2">Chưa có lịch đặt sân</p>
                <button onClick={() => navigate('/fields')} className="text-green-400 hover:underline">Đặt sân ngay →</button>
              </div>
            ) : activeBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Không có lịch nào khả dụng</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBookings.map((booking) => (
                  <div key={booking.id} className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={booking.fieldImage} alt={booking.fieldName} className="h-12 w-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{booking.fieldName}</h3>
                        <p className="text-xs text-gray-500">{booking.allDates?.map(d => formatDate(d.date)).join(', ')}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                        booking.status === 'Confirmed' ? 'bg-green-500/20 text-green-400' :
                        booking.status === 'Booked' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>{booking.status === 'Booked' ? 'Đã đặt' : booking.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {booking.allDates?.flatMap(dateObj =>
                        dateObj.slots.map((slot) => {
                          const slotEnd = new Date(`${slot.date}T${slot.end}:00.000`);
                          const isEnded = slot.status === 'End' || slot.status === 'Cancel' || slotEnd < new Date();
                          return { ...slot, isEnded };
                        }).filter(s => !s.isEnded)
                      ).map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotClick(slot, booking)}
                          className="px-3 py-1.5 bg-[#262626] rounded-lg text-xs hover:bg-[#4ade80]/20 hover:text-green-400 transition flex items-center gap-1.5"
                        >
                          <span className="text-cyan-400">{formatDate(slot.date)}</span>
                          <span className="text-white font-medium">{slot.start}-{slot.end}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={<span className="text-white font-semibold">Chọn dịch vụ</span>}>
        <div className="space-y-3">
          <div className="pb-2 border-b border-gray-800 space-y-1">
            <p className="text-sm text-gray-400">
              {selectedSlot && `${formatDate(selectedSlot.date)} • ${selectedSlot.start} - ${selectedSlot.end}`}
            </p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Số dư ví</span>
              <span className="text-green-400 font-medium">{formatPrice(walletBalance)}</span>
            </div>
          </div>

          {loadingServices ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : availableServices.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Không có dịch vụ cho sân này</div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableServices.map((service) => {
                  const isSelected = selectedServices.some(s => s.serviceId === service._id);
                  const selected = selectedServices.find(s => s.serviceId === service._id);
                  const stock = service.stock || 0;
                  const outOfStock = stock === 0;
                  return (
                    <div
                      key={service._id}
                      onClick={() => !outOfStock && toggleService(service)}
                      className={`p-3 rounded-lg flex justify-between items-center transition ${
                        isSelected ? 'bg-green-500/20 border border-green-500' : 'bg-[#262626] border border-transparent hover:border-green-500/50'
                      } ${outOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex-1">
                        <span className={isSelected ? 'text-green-400' : 'text-white'}>{service.serviceName}</span>
                        <span className={`ml-2 text-xs ${stock > 0 ? 'text-gray-500' : 'text-red-400'}`}>
                          {outOfStock ? 'Hết hàng' : `Kho: ${stock}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && selected && stock > 0 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); updateQuantity(service._id, -1); }}
                              disabled={selected.quantity <= 1}
                              className="w-6 h-6 rounded bg-[#1a1a1a] text-white disabled:opacity-30 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-white text-sm">{selected.quantity}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateQuantity(service._id, 1); }}
                              disabled={selected.quantity >= stock}
                              className="w-6 h-6 rounded bg-[#1a1a1a] text-white disabled:opacity-30 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                        <span className="text-green-400 font-medium">{formatPrice(service.price)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedServices.length > 0 && (
                <div className="p-3 bg-[#262626] rounded-lg flex justify-between items-center">
                  <span className="text-gray-400">
                    {selectedServices.length} dịch vụ ({selectedServices.reduce((sum, s) => sum + (s.quantity || 1), 0)} items)
                  </span>
                  <span className="text-green-400 font-bold text-lg">{formatPrice(totalServicesPrice)}</span>
                </div>
              )}

              {!walletSufficient && selectedServices.length > 0 && (
                <p className="text-xs text-red-400 text-center">Số dư không đủ • Cần thêm {formatPrice(totalServicesPrice - walletBalance)}</p>
              )}
              <button
                onClick={handleBookServices}
                disabled={selectedServices.length === 0 || submitting || !walletSufficient}
                className="w-full py-3 bg-[#4ade80] text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#22c55e] transition"
              >
                {submitting ? 'Đang xử lý...' : 'Đặt dịch vụ'}
              </button>
            </>
          )}
        </div>
      </Modal>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] p-8 rounded-2xl text-center border border-green-500/50">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold text-lg">Thành công!</p>
            <p className="text-gray-500 text-sm mt-1">Dịch vụ đã được đặt</p>
          </div>
        </div>
      )}
    </div>
  );
}
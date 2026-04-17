import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import serviceService from '../../services/serviceService';
import { setAuthToken } from '../../services/axios';
import { Modal } from '../../components/Modal';

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

  const fetchBookings = async () => {
    try {
      if (auth.accessToken) {
        setAuthToken(auth.accessToken);
      }
      const data = await bookingService.getMyBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchBookings(); }, []);

  const handleSlotClick = async (slot, booking) => {
    setSelectedSlot({ ...slot, bookingId: booking.id, fieldName: booking.fieldName });
    setLoadingServices(true);
    setShowModal(true);
    
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
      console.error('Failed to fetch services:', err);
      setAvailableServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.serviceId === service._id);
      if (exists) {
        return prev.filter(s => s.serviceId !== service._id);
      }
      return [...prev, {
        serviceId: service._id,
        serviceName: service.serviceName,
        price: service.price,
        quantity: 1,
      }];
    });
  };

  const updateQuantity = (serviceId, delta) => {
    setSelectedServices(prev => prev.map(s => {
      if (s.serviceId === serviceId) {
        return { ...s, quantity: Math.max(1, s.quantity + delta) };
      }
      return s;
    }));
  };

  const handleBookServices = async () => {
    if (selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }

    setSubmitting(true);
    try {
      if (auth.accessToken) {
        setAuthToken(auth.accessToken);
      }
      await serviceService.bookServices({
        bookingDetailId: selectedSlot.id,
        services: selectedServices,
      });
      alert('Services booked successfully!');
      setShowModal(false);
      fetchBookings();
    } catch (err) {
      console.error('Failed to book services:', err);
      alert('Failed to book services. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalServicesPrice = selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const isUpcoming = (dateStr) => {
    return new Date(dateStr) >= new Date(new Date().setHours(0, 0, 0, 0));
  };

  const isActive = (status) => {
    return status === 'Confirmed' || status === 'Booked';
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="font-headline text-2xl font-bold text-[#ff4d6d]">Please sign in to view your bookings</h1>
        <button
          onClick={() => navigate('/auth')}
          className="mt-4 font-headline text-[#8eff71] underline"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8eff71] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="font-headline text-3xl font-black text-[#fdfdf6] mb-2">Book Services</h1>
      <p className="font-headline text-[#abaca5] mb-8">Select a booking slot to add services</p>

      {bookings.length === 0 ? (
        <div className="rounded-xl bg-[#181a16] p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-[#474944]">sports_soccer</span>
          <p className="mt-4 font-headline text-lg text-[#abaca5]">No bookings found</p>
          <button
            onClick={() => navigate('/fields')}
            className="mt-4 font-headline text-[#8eff71] underline"
          >
            Book a field
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-xl bg-[#181a16] p-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={booking.fieldImage}
                  alt={booking.fieldName}
                  className="h-16 w-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-headline text-lg font-bold text-[#fdfdf6]">{booking.fieldName}</h3>
                  <p className="font-headline text-sm text-[#abaca5]">
                    {booking.allDates?.map(d => formatDate(d.date)).join(', ') || formatDate(booking.date)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full font-headline text-xs font-bold ${
                  isActive(booking.status)
                    ? 'bg-[#8eff71]/20 text-[#8eff71]'
                    : 'bg-[#474944]/20 text-[#abaca5]'
                }`}>
                  {booking.status}
                </span>
              </div>

              <div className="border-t border-[#474944]/30 pt-4">
                <h4 className="font-headline text-sm font-bold text-[#88f6ff] mb-3">Available Slots</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {booking.allDates?.flatMap(dateObj =>
                    dateObj.slots.map((slot, idx) => {
                      const slotId = `${booking.id}-${dateObj.date}-${idx}`;
                      return {
                        id: slotId,
                        date: dateObj.date,
                        start: slot.start,
                        end: slot.end,
                        bookingId: booking.id,
                        fieldName: booking.fieldName,
                        status: booking.status,
                      };
                    })
                  ).filter(slot => isUpcoming(slot.date) && isActive(slot.status)).map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotClick(slot, booking)}
                      className="rounded-lg bg-[#242721] p-3 text-center transition-all hover:bg-[#8eff71]/20 hover:text-[#8eff71]"
                    >
                      <p className="font-headline text-xs text-[#88f6ff]">{formatDate(slot.date)}</p>
                      <p className="font-headline text-sm font-bold text-[#fdfdf6]">{slot.start} - {slot.end}</p>
                      <span className="material-symbols-outlined text-sm text-[#8eff71]">add_circle</span>
                    </button>
                  )) || (
                    <p className="col-span-full text-center font-headline text-sm text-[#abaca5] py-4">
                      No upcoming slots available
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Services for ${selectedSlot?.fieldName}`}>
        <div className="space-y-4">
          <p className="font-headline text-sm text-[#abaca5]">
            {selectedSlot && `${formatDate(selectedSlot.date)} | ${selectedSlot.start} - ${selectedSlot.end}`}
          </p>

          {loadingServices ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8eff71] border-t-transparent" />
            </div>
          ) : availableServices.length === 0 ? (
            <div className="rounded-lg bg-[#242721] p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-[#474944]">info</span>
              <p className="mt-2 font-headline text-sm text-[#abaca5]">No services available for this field</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {availableServices.map((service) => {
                  const isSelected = selectedServices.some(s => s.serviceId === service._id);
                  const selectedItem = selectedServices.find(s => s.serviceId === service._id);
                  return (
                    <div
                      key={service._id}
                      className={`rounded-lg border p-4 transition-all ${
                        isSelected
                          ? 'border-[#8eff71] bg-[#8eff71]/10'
                          : 'border-[#474944]/30 bg-[#121410] hover:border-[#8eff71]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleService(service)}
                            className="flex h-6 w-6 items-center justify-center rounded border transition-all"
                          >
                            {isSelected ? (
                              <span className="material-symbols-outlined text-[#8eff71] text-lg">check_box</span>
                            ) : (
                              <span className="material-symbols-outlined text-[#474944] text-lg">check_box_outline_blank</span>
                            )}
                          </button>
                          <div>
                            <p className="font-headline text-sm font-bold text-[#fdfdf6]">{service.serviceName}</p>
                            <p className="font-headline text-xs text-[#abaca5]">Stock: {service.stock}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-headline text-sm font-bold text-[#8eff71]">{formatPrice(service.price)}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-3 flex items-center justify-between border-t border-[#474944]/30 pt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(service._id, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded bg-[#242721] text-[#fdfdf6] hover:bg-[#474944]"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-headline text-sm font-bold text-[#fdfdf6]">
                              {selectedItem?.quantity || 1}
                            </span>
                            <button
                              onClick={() => updateQuantity(service._id, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded bg-[#242721] text-[#fdfdf6] hover:bg-[#474944]"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-headline text-sm font-bold text-[#88f6ff]">
                            {formatPrice((selectedItem?.quantity || 1) * service.price)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedServices.length > 0 && (
                <div className="rounded-lg bg-[#121410] p-4 border border-[#8eff71]/20">
                  <div className="flex justify-between items-center">
                    <span className="font-headline font-bold text-[#fdfdf6]">Total</span>
                    <span className="font-headline text-xl font-black text-[#8eff71]">
                      {formatPrice(totalServicesPrice)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBookServices}
                disabled={selectedServices.length === 0 || submitting}
                className="w-full rounded-xl bg-gradient-to-r from-[#8eff71] to-[#2ff801] py-4 font-headline text-sm font-black text-[#0d6100] transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(142,255,113,0.3)] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Book Services'}
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

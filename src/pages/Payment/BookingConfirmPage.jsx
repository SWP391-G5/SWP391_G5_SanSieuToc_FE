import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import profileService from '../../services/profileService';
import bookingService from '../../services/bookingService';
import { setAuthToken } from '../../services/axios';
import qrImage from '../../assets/images/qr-vietqr.png';

const SERVICES = [
  { id: 'ball', name: 'Thuê bóng', price: 50000, icon: 'sports_soccer' },
  { id: 'water', name: 'Nước uống', price: 20000, icon: 'water_drop' },
  { id: 'jersey', name: 'Thuê áo đấu', price: 30000, icon: 'dry_cleaning' },
  { id: 'shoes', name: 'Thuê giày', price: 80000, icon: 'hiking' },
  { id: 'referee', name: 'Thuê trọng tài', price: 150000, icon: 'sports' },
];

export default function BookingConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const bookingData = location.state;

  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        if (auth.accessToken) {
          setAuthToken(auth.accessToken);
        }
        const response = await profileService.getMyProfile();
        const profileData = response?.data || response;
        setWalletBalance(Number(profileData?.wallet?.balance || 0));
      } catch (err) {
        console.error('Failed to fetch wallet:', err);
      }
    };
    fetchWallet();
  }, [auth.accessToken]);

  if (!bookingData?.field) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="font-headline text-2xl font-bold text-[#ff4d6d]">No booking data</h1>
        <button
          onClick={() => navigate('/fields')}
          className="mt-4 font-headline text-[#8eff71] underline"
        >
          Back to Fields
        </button>
      </div>
    );
  }

  const { field, date, time, services: selectedServiceIds, total } = bookingData;

  const parsePrice = (priceText) => {
    const digits = String(priceText ?? '').replace(/[^\d]/g, '');
    return Number(digits) || 0;
  };

  const fieldPricePerHour = parsePrice(field.price);
  const timeSlots = time.split(', ');
  const totalHours = timeSlots.length;
  const fieldTotal = fieldPricePerHour * totalHours;
  const servicesTotal = (selectedServiceIds || []).reduce((sum, serviceId) => {
    const service = SERVICES.find((s) => s.id === serviceId);
    return sum + (service?.price || 0);
  }, 0);
  const grandTotal = fieldTotal + servicesTotal;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const walletSufficient = walletBalance >= grandTotal;

  const handleConfirmBooking = async () => {
    if (paymentMethod === 'wallet' && !walletSufficient) {
      alert('Insufficient wallet balance. Please top up or choose another payment method.');
      return;
    }

    setLoading(true);
    try {
      if (auth.accessToken) {
        setAuthToken(auth.accessToken);
      }
      const selectedServices = (selectedServiceIds || []).map(serviceId => {
        const service = SERVICES.find(s => s.id === serviceId);
        return service ? { id: service.id, name: service.name, price: service.price } : null;
      }).filter(Boolean);

      const bookingPayload = {
        fieldId: field.id,
        fieldName: field.name,
        fieldImage: field.image,
        date: date,
        timeSlots: timeSlots,
        services: selectedServices,
        fieldTotal: fieldTotal,
        servicesTotal: servicesTotal,
        grandTotal: grandTotal,
        paymentMethod: paymentMethod,
      };

      if (paymentMethod === 'wallet') {
        bookingPayload.status = 'confirmed';
        bookingPayload.deductWallet = true;
      } else {
        bookingPayload.status = 'pending';
      }
      // The offline fallback logic was causing data inconsistency.
      // We now rely solely on the API to handle the booking and wallet deduction.
      await bookingService.createBooking(bookingPayload);
      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/profile', { state: { activeTab: 'bookings', refreshWallet: true } });
      }, 2000);
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-[#abaca5] transition-colors hover:text-[#8eff71]"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        <span className="font-headline text-sm font-medium">Back</span>
      </button>

      {bookingSuccess ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#8eff71]/20">
            <span className="material-symbols-outlined text-6xl text-[#8eff71]">check_circle</span>
          </div>
          <h1 className="font-headline text-3xl font-black text-[#fdfdf6]">Booking Confirmed!</h1>
          <p className="mt-2 font-headline text-[#abaca5]">Redirecting to fields...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-xl bg-[#181a16] p-6">
              <h2 className="font-headline text-xl font-bold text-[#8eff71] mb-4">Field Information</h2>
              <div className="flex gap-4">
                <img
                  src={field.image}
                  alt={field.imageAlt}
                  className="h-24 w-32 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-headline text-lg font-bold text-[#fdfdf6]">{field.name}</h3>
                  <div className="mt-1 flex items-center gap-1 text-[#abaca5]">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span className="text-sm">{field.address}, {field.city}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 rounded-full bg-[#8eff71]/20 px-3 py-1">
                      <span className="material-symbols-outlined fill-icon text-xs text-[#8eff71]">star</span>
                      <span className="font-headline text-xs font-bold text-[#8eff71]">{field.rating}</span>
                    </span>
                    <span className="rounded-full bg-[#242721] px-3 py-1">
                      <span className="font-headline text-xs font-bold text-[#abaca5]">{field.size}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#181a16] p-6">
              <h2 className="font-headline text-xl font-bold text-[#8eff71] mb-4">Booking Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#88f6ff]">calendar_today</span>
                  <div>
                    <p className="font-headline text-xs font-bold uppercase text-[#abaca5]">Date</p>
                    <p className="font-headline font-medium text-[#fdfdf6]">{formatDate(date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#88f6ff]">schedule</span>
                  <div>
                    <p className="font-headline text-xs font-bold uppercase text-[#abaca5]">Time Slots</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {timeSlots.map((slot) => (
                        <span
                          key={slot}
                          className="rounded-lg bg-[#242721] px-3 py-1 font-headline text-sm font-medium text-[#fdfdf6]"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedServiceIds && selectedServiceIds.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#88f6ff]"></span>
                    <div>
                      <p className="font-headline text-xs font-bold uppercase text-[#abaca5]">Services</p>
                      <div className="mt-1 space-y-1">
                        {selectedServiceIds.map((serviceId) => {
                          const service = SERVICES.find((s) => s.id === serviceId);
                          return service ? (
                            <p key={service.id} className="font-headline text-sm text-[#fdfdf6]">
                              {service.name}
                            </p>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-28 space-y-4">
              <div className="rounded-xl bg-[#181a16] p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                <h2 className="font-headline text-xl font-bold text-[#fdfdf6] mb-4">Payment Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#abaca5]">Field ({totalHours}h)</span>
                    <span className="font-headline font-medium text-[#fdfdf6]">{formatPrice(fieldTotal)}</span>
                  </div>
                  {servicesTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#abaca5]">Services ({selectedServiceIds.length})</span>
                      <span className="font-headline font-medium text-[#fdfdf6]">{formatPrice(servicesTotal)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#474944]/30 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-headline font-bold text-[#fdfdf6]">Total</span>
                      <span className="font-headline text-2xl font-black text-[#8eff71]">
                        {formatPrice(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-headline text-sm font-bold uppercase text-[#abaca5] mb-3">Payment Method</h3>
                  
                  <div className="rounded-lg border-2 border-[#8eff71] bg-[#8eff71]/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#8eff71]">
                          account_balance_wallet
                        </span>
                        <div>
                          <p className="font-headline text-sm font-bold text-[#8eff71]">
                            Wallet Balance
                          </p>
                          <p className="font-headline text-xs text-[#abaca5]">
                            Số dư: {formatPrice(walletBalance)}
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#8eff71]">check_circle</span>
                    </div>
                    {!walletSufficient && (
                      <p className="mt-3 font-headline text-xs text-[#ff4d6d]">
                        Số dư không đủ. Vui lòng nạp thêm tiền vào wallet.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={loading || !walletSufficient}
                  className="w-full rounded-lg bg-gradient-to-r from-[#8eff71] to-[#2ff801] py-4 font-headline text-base font-black text-[#0d6100] transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(142,255,113,0.3)] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Booking'}
                </button>

                <div className="mt-4 rounded-lg bg-[#242721] p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#88f6ff]">info</span>
                    <div className="text-xs text-[#abaca5]">
                      <p className="font-headline font-medium text-[#fdfdf6] mb-1">Booking Policy</p>
                      <p>Free cancellation up to 24 hours before the booking time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

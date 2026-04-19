import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import bookingService from '../services/bookingService';
import profileService from '../services/profileService';
import transactionService from '../services/transactionService';
import { setAuthToken } from '../services/axios';
import {
  isValidAddress,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidPhone,
  normalizePhone,
} from '../utils/validators';

import '../styles/UserProfilePage.css';

const checkSlotEnded = (date, slotEnd) => {
  const now = new Date();
  const slotDate = new Date(date);
  const [hours, minutes] = (slotEnd || '23:59').split(':').map(Number);
  slotDate.setHours(hours, minutes, 0, 0);
  return now > slotDate;
};

function formatVnd(amount) {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat('vi-VN').format(n);
  } catch {
    return String(n);
  }
}

async function uploadToCloudinary({ file, cloudName, uploadPreset }) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(url, { method: 'POST', body: formData });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.error?.message || 'Upload ảnh thất bại.';
    throw new Error(msg);
  }

  const secureUrl = data?.secure_url;
  if (!secureUrl) throw new Error('Upload ảnh thất bại.');
  return secureUrl;
}

function BookingCard({ booking, onCancel, onFeedback }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      if (booking.allDates && booking.allDates.length > 0) {
        for (const d of booking.allDates) {
          if (d.slots && d.slots.length > 0) {
            const lastSlot = d.slots[d.slots.length - 1];
            if (lastSlot?.end && checkSlotEnded(d.date, lastSlot.end)) {
              setIsEnded(true);
              break;
            }
          }
        }
      } else if (booking.date && booking.timeSlots && booking.timeSlots.length > 0) {
        const lastSlot = booking.timeSlots[booking.timeSlots.length - 1];
        const slotEnd = typeof lastSlot === 'object' ? lastSlot.end : lastSlot;
        if (checkSlotEnded(booking.date, slotEnd)) {
          setIsEnded(true);
        }
      }
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [booking]);

  const canCancel = booking.status === 'Confirmed' && booking.statusPayment === 'Paid' && !isEnded;
  const canFeedback = isEnded && (booking.status === 'Confirmed' || booking.status === 'Cancelled');

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn đặt sân này?\nTiền sẽ được hoàn lại sau khi Owner xác nhận.')) {
      return;
    }
    
    setCancelling(true);
    try {
      await onCancel(booking.id);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={`booking-card ${expanded ? 'expanded' : ''}`}>
      <div className="booking-card-image-wrapper">
        <div
          className="booking-card-image"
          style={{ backgroundImage: `url(${booking.fieldImage || 'https://via.placeholder.com/400x200?text=San+Sieu+Toc'})` }}
        ></div>
      </div>
      <div className="booking-card-body">
        <div className="booking-card-top">
          <div className="booking-card-info">
            <h3 className="booking-card-title">{booking.fieldName || 'Unknown'}</h3>
            <p className="booking-card-address">📍 {booking.fieldAddress || ''}</p>
          </div>
          <div className="booking-card-status">
            <span className={`booking-status-badge status-${isEnded ? 'ended' : (booking.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
              {isEnded ? 'Ended' : booking.status}
            </span>
            <span className={`booking-payment-badge ${(booking.statusPayment || '').toLowerCase().replace(/\s+/g, '-')}`}>
              {booking.statusPayment}
            </span>
          </div>
        </div>
        <p className="booking-card-date">📅 {booking.date ? new Date(booking.date).toLocaleDateString('vi-VN') : 'N/A'}</p>
        <p className="booking-card-time">🕒 {(booking.timeSlots || []).map(s => typeof s === 'object' ? s.start : s).join(', ')}</p>
        <div className="booking-card-footer">
          <span className="booking-card-price">{formatVnd(booking.grandTotal || 0)}đ</span>
          <div className="booking-card-actions">
            {canFeedback && (
              <button
                className="booking-feedback-btn"
                onClick={() => onFeedback && onFeedback(booking)}
                style={{ background: '#ffc864', color: '#121410' }}
              >
                ⭐ Đánh giá
              </button>
            )}
            {canCancel && (
              <button
                className="booking-cancel-btn"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
              </button>
            )}
            <button
              className="booking-expand-btn"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Thu gọn ▲' : 'Chi tiết ▼'}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="booking-expanded-content">
            {booking.fieldType && (
              <div className="booking-detail-row">
                <span className="booking-detail-label">Loại sân:</span>
                <span>{booking.fieldType}</span>
              </div>
            )}
            
            <div className="booking-detail-row" style={{ display: 'block' }}>
              <span className="booking-detail-label" style={{ display: 'block', marginBottom: '8px' }}>Khung giờ:</span>
              {booking.allDates && booking.allDates.length > 0 ? (
                booking.allDates.map((d, idx) => (
                  <div key={idx} style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#8eff71' }}>
                      {new Date(d.date).toLocaleDateString('vi-VN')}
                    </div>
                    {d.slots.map((slot, sIdx) => (
                      <div key={sIdx} style={{ 
                        background: 'rgba(142, 255, 113, 0.1)', 
                        padding: '8px 12px', 
                        borderRadius: '8px',
                        marginBottom: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ color: '#fdfdf6', fontWeight: '500' }}>
                          {slot.start} - {slot.end}
                        </span>
                        <span style={{ color: '#8eff71', fontSize: '12px' }}>
                          Đã đặt
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="booking-slots-row">
                  {booking.timeSlots.map((slot, idx) => (
                    <span key={idx} className="booking-slot-badge">
                      {typeof slot === 'object' ? `${slot.start} - ${slot.end}` : slot}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {booking.services && booking.services.length > 0 && (
              <div className="booking-detail-row" style={{ display: 'block' }}>
                <span className="booking-detail-label" style={{ display: 'block', marginBottom: '4px' }}>Dịch vụ:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {booking.services.map((service, idx) => (
                    <span key={idx} style={{ 
                      background: 'rgba(255, 200, 100, 0.2)', 
                      color: '#ffc864',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {service.serviceName}: {formatVnd(service.price)}đ {service.quantity > 1 && `(x${service.quantity})`}
                    </span>
                  ))}
                </div>
                {booking.servicesTotal > 0 && (
                  <div style={{ marginTop: '4px', color: '#8eff71', fontWeight: 'bold' }}>
                    Tổng dịch vụ: {formatVnd(booking.servicesTotal)}đ
                  </div>
                )}
              </div>
            )}

            <div className="booking-price-breakdown">
              {booking.fieldTotal > 0 && (
                <div className="booking-price-row">
                  <span>Tiền sân:</span>
                  <span>{formatVnd(booking.fieldTotal)}đ</span>
                </div>
              )}
              {booking.servicesTotal > 0 && (
                <div className="booking-price-row">
                  <span>Dịch vụ:</span>
                  <span>{formatVnd(booking.servicesTotal)}đ</span>
                </div>
              )}
              <div className="booking-price-row total">
                <span>Tổng:</span>
                <span>{formatVnd(booking.grandTotal)}đ</span>
              </div>
            </div>

            <div className="booking-payment-status">
              {booking.statusPayment === 'Paid' && (
                <span className="payment-badge paid">✓ Đã thanh toán</span>
              )}
              {booking.statusPayment === 'Pending Payment' && (
                <span className="payment-badge pending">⏳ Chờ thanh toán</span>
              )}
              {booking.statusPayment === 'Pending Refund' && (
                <span className="payment-badge pending-refund">⏳ Đang chờ hoàn tiền</span>
              )}
              {booking.statusPayment === 'Refunded' && (
                <span className="payment-badge refunded">↩️ Đã hoàn tiền</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { notifyError, notifyInfo, notifySuccess } = useNotification();

  const [activeTab, setActiveTab] = useState('personal');
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const TX_PER_PAGE = 10;
  const accountType = auth.user?.accountType;
  const isAdminAccount = String(accountType || '').trim().toLowerCase() === 'admin';

  const roleName = auth.user?.role;
  const roleKey = String(roleName || '').trim().toLowerCase();
  const isAdminConsoleUser = roleKey === 'admin';
  const isCustomer = roleKey === 'customer';
  const isManager = roleKey === 'manager';

  const canChangeEmail = !isAdminAccount || isManager;

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    if (isAdminConsoleUser && !String(location.pathname || '').startsWith('/admin')) {
      navigate('/admin/profile', { replace: true });
    }
  }, [auth.isAuthenticated, isAdminConsoleUser, location.pathname, navigate]);

  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [walletBalance, setWalletBalance] = useState(0);

  const [emailOriginal, setEmailOriginal] = useState('');
  const [emailOtpOpen, setEmailOtpOpen] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpResendSeconds, setEmailOtpResendSeconds] = useState(0);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    name: '',
    phone: '',
    address: '',
    image: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const avatarUrl = useMemo(() => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#1a2a22"/>
      <stop offset="1" stop-color="#0b120e"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="28" fill="url(#g)"/>
  <circle cx="128" cy="100" r="44" fill="#2a3c33"/>
  <path d="M48 216c14-44 52-68 80-68s66 24 80 68" fill="#2a3c33"/>
  <circle cx="128" cy="128" r="110" fill="none" stroke="#6dff9e" stroke-opacity="0.15" stroke-width="6"/>
</svg>`;

    const fallback = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return form.image || fallback;
  }, [form.image]);

  // Set initial tab from navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear it from state to avoid re-triggering
      const { activeTab: _activeTab, ...rest } = location.state;
      navigate('.', { state: rest, replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }

    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await profileService.getMyProfile(accountType);
        if (ignore) return;

        const u = data?.user || {};
        setForm({
          username: u.username || '',
          email: u.email || '',
          name: u.name || '',
          phone: u.phone || '',
          address: u.address || '',
          image: u.image || '',
        });
        setEmailOriginal(u.email || '');
        setWalletBalance(isAdminAccount ? 0 : Number(data?.wallet?.balance || 0));

        // Clear the refresh state after fetching to prevent re-fetching on unrelated re-renders
        if (location.state?.refreshWallet) {
          const { refreshWallet, ...restState } = location.state;
          navigate('.', { state: restState, replace: true });
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Không tải được hồ sơ.';
        notifyError(msg);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [auth.isAuthenticated, accountType, isAdminAccount, navigate, notifyError, location.state?.refreshWallet]);

// Effect to fetch bookings when tab is active
  useEffect(() => {
    if (activeTab === 'bookings') {
      let ignore = false;
      const fetchBookings = async () => {
        setBookingsLoading(true);
        try {
          if (auth.accessToken) {
            setAuthToken(auth.accessToken);
          }
          const data = await bookingService.getMyBookings();
          if (!ignore) {
            setBookings(data?.bookings || []);
          }
        } catch (err) {
          if (!ignore) {
            notifyError('Could not load booking history.');
            setBookings([]);
          }
        } finally {
          if (!ignore) setBookingsLoading(false);
        }
      };
      fetchBookings();
      return () => { ignore = true };
    }
  }, [activeTab, notifyError, auth.accessToken]);

  // Effect to fetch transactions when tab is active
  useEffect(() => {
    if (activeTab === 'transactions') {
      let ignore = false;
      const fetchTransactions = async () => {
        setTransactionsLoading(true);
        try {
          if (auth.accessToken) {
            setAuthToken(auth.accessToken);
          }
          const data = await transactionService.getMyTransactions();
          if (!ignore) {
            setTransactions(data?.transactions || []);
            setWalletBalance(Number(data?.walletBalance || 0));
          }
        } catch (err) {
          if (!ignore) {
            notifyError('Could not load transaction history.');
            setTransactions([]);
          }
        } finally {
          if (!ignore) setTransactionsLoading(false);
        }
      };
      fetchTransactions();
      return () => { ignore = true; };
    }
  }, [activeTab, notifyError, auth.accessToken]);

  const handleCancelBooking = async (bookingId) => {
    try {
      if (auth.accessToken) {
        setAuthToken(auth.accessToken);
      }
      await bookingService.cancelBooking(bookingId);
      notifySuccess('Yêu cầu hủy đã được gửi. Vui lòng chờ Owner xác nhận hoàn tiền.');
      const data = await bookingService.getMyBookings();
      setBookings(data?.bookings || []);
    } catch (err) {
      notifyError(err?.response?.data?.message || 'Hủy đơn thất bại.');
    }
  };

  const handleOpenFeedback = (booking) => {
    navigate(`/feedback?bookingId=${booking.id}&fieldName=${encodeURIComponent(booking.fieldName)}`);
  };

  const onPickAvatar = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      notifyError('Vui lòng chọn file ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifyError('Ảnh tối đa 5MB.');
      return;
    }

    setUploading(true);
    try {
      const data = await profileService.uploadAvatar(file, accountType);
      const imageUrl = data?.imageUrl;
      if (!imageUrl) {
        notifyError('Upload avatar thất bại.');
        return;
      }
      setForm((prev) => ({ ...prev, image: imageUrl }));
      if (data?.user) {
        auth.updateUser(data.user);
      } else {
        auth.updateUser({ image: imageUrl });
      }
      notifySuccess('Đã cập nhật ảnh đại diện.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Upload avatar thất bại.';
      notifyError(msg);
    } finally {
      setUploading(false);
    }
  };

  // Resend countdown for email OTP
  useEffect(() => {
    if (!emailOtpOpen) return undefined;
    if (emailOtpResendSeconds <= 0) return undefined;

    const t = setInterval(() => {
      setEmailOtpResendSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [emailOtpOpen, emailOtpResendSeconds]);

  const openEmailOtp = async (newEmail) => {
    setEmailOtpLoading(true);
    try {
      await profileService.requestEmailChange(newEmail, accountType);
      setEmailOtp('');
      setEmailOtpResendSeconds(60);
      setEmailOtpOpen(true);
      notifySuccess('Đã gửi OTP về email mới.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gửi OTP thất bại.';
      notifyError(msg);
      // rollback email UI if request fails
      setForm((p) => ({ ...p, email: emailOriginal }));
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const onSaveProfile = async () => {

    const name = String(form.name || '').trim().replace(/\s+/g, ' ');
    const phone = normalizePhone(form.phone);
    const address = String(form.address || '').trim();

    if (!isValidName(name)) {
      notifyError('Họ tên không hợp lệ.');
      return;
    }

    // Phone is optional; validate when user enters something.
    if (String(form.phone || '').trim().length > 0 && !isValidPhone(form.phone)) {
      notifyError('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0).');
      return;
    }

    if (!isValidAddress(address)) {
      notifyError('Địa chỉ không hợp lệ (tối đa 200 ký tự).');
      return;
    }

    const desiredEmail = String(form.email || '').trim();
    const emailChanged =
      canChangeEmail &&
      desiredEmail &&
      emailOriginal &&
      desiredEmail.toLowerCase() !== String(emailOriginal).trim().toLowerCase();

    if (emailChanged && !isValidEmail(desiredEmail)) {
      notifyError('Email không hợp lệ.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        phone,
        address,
        image: form.image,
      };
      const data = await profileService.updateMyProfile(payload, accountType);
      const u = data?.user || {};
      setForm((prev) => ({
        ...prev,
        name: u.name || prev.name,
        phone: u.phone || '',
        address: u.address || '',
        image: u.image || '',
      }));
      if (u && Object.keys(u).length > 0) {
        auth.updateUser(u);
      }
      notifySuccess('Đã lưu thông tin.');

      if (emailChanged) {
        await openEmailOtp(desiredEmail);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Lưu thông tin thất bại.';
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      notifyError('Vui lòng nhập đầy đủ mật khẩu.');
      return;
    }

    if (!isValidPassword(passwordForm.newPassword)) {
      notifyError('Mật khẩu mới phải 6-128 ký tự và gồm chữ hoa, chữ thường, số, ký tự đặc biệt (không có khoảng trắng).');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      notifyError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setChangingPassword(true);
    try {
      const data = await profileService.changeMyPassword(
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        accountType
      );
      notifySuccess(data?.message || 'Đổi mật khẩu thành công.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đổi mật khẩu thất bại.';
      notifyError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const onVerifyEmailOtp = async (e) => {
    e.preventDefault();

    const newEmail = String(form.email || '').trim();
    if (!newEmail || !isValidEmail(newEmail) || String(emailOtp || '').trim().length !== 6) {
      notifyError('Vui lòng nhập email hợp lệ và đủ 6 số OTP.');
      return;
    }

    setEmailOtpLoading(true);
    try {
      const data = await profileService.verifyEmailChange({ newEmail, code: String(emailOtp).trim() }, accountType);
      notifySuccess(data?.message || 'Đổi email thành công.');

      if (data?.user) auth.updateUser(data.user);

      const normalizedEmail = data?.user?.email || newEmail;
      setForm((p) => ({ ...p, email: normalizedEmail }));
      setEmailOriginal(normalizedEmail);
      setEmailOtpOpen(false);
      setEmailOtp('');
      setEmailOtpResendSeconds(0);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Xác thực OTP thất bại.';
      notifyError(msg);
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const onResendEmailOtp = async () => {
    const newEmail = String(form.email || '').trim();
    if (!newEmail) return;

    setEmailOtpLoading(true);
    try {
      await profileService.requestEmailChange(newEmail, accountType);
      setEmailOtpResendSeconds(60);
      notifySuccess('Đã gửi lại OTP.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gửi lại OTP thất bại.';
      notifyError(msg);
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const onCancelEmailOtp = () => {
    setEmailOtpOpen(false);
    setEmailOtp('');
    setEmailOtpResendSeconds(0);
    setForm((p) => ({ ...p, email: emailOriginal }));
  };

  const onTopUp = () => {
    navigate('/top-up');
  };

  const onBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    if (isAdminAccount) {
      navigate('/admin', { replace: true });
      return;
    }

    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="profile-terminal-page">
        <div className="profile-terminal-container">
          <div className="profile-terminal-loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-terminal-page">
      <div className="profile-terminal-container">
        <div className="profile-terminal-tabs">
          <button
            type="button"
            className={`profile-terminal-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            PERSONAL INFORMATION
          </button>
          {isCustomer && (
            <>
              <button
                type="button"
                className={`profile-terminal-tab ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('bookings');
                }}
              >
FIELD BOOKING
              </button>
            </>
          )}

          {isAdminAccount ? (
            <button
              type="button"
              className="profile-terminal-tab"
              style={{ marginLeft: 'auto' }}
              onClick={onBack}
            >
              QUAY LẠI
            </button>
          ) : null}

          <button
            type="button"
            className={`profile-terminal-tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            TRANSACTION HISTORY
          </button>
          
        </div>
        

        {activeTab === 'personal' ? (
          <div className="profile-terminal-grid">
            <div className="profile-terminal-left">
              <section className="profile-terminal-card">
                <div className="profile-terminal-card-title">
                  <span className="profile-terminal-card-icon">🔒</span>
                  BASIC CREDENTIALS
                </div>

                <div className="profile-terminal-form">
                  <div className="profile-terminal-field">
                    <label className="profile-terminal-label">USERNAME</label>
                    <input className="profile-terminal-input" value={form.username} disabled />
                  </div>

                  <div className="profile-terminal-field">
                    <label className="profile-terminal-label">EMAIL ADDRESS</label>
                    <input
                      className="profile-terminal-input"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Email"
                      disabled={emailOtpLoading || !canChangeEmail}
                    />
                  </div>

                  <div className="profile-terminal-field">
                    <label className="profile-terminal-label">FULL NAME</label>
                    <input
                      className="profile-terminal-input"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>

                  <div className="profile-terminal-field">
                    <label className="profile-terminal-label">PHONE NUMBER</label>
                    <input
                      className="profile-terminal-input"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone"
                    />
                  </div>

                  <div className="profile-terminal-field profile-terminal-field-wide">
                    <label className="profile-terminal-label">ADDRESS</label>
                    <input
                      className="profile-terminal-input"
                      value={form.address}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Address"
                    />
                  </div>

                  <div className="profile-terminal-actions">
                    <button
                      type="button"
                      className="profile-terminal-btn primary"
                      disabled={saving || uploading || emailOtpLoading}
                      onClick={onSaveProfile}
                    >
                      {saving ? 'SAVING...' : emailOtpLoading ? 'SENDING OTP...' : 'SAVE INFORMATION'}
                    </button>
                  </div>
                </div>
              </section>

              {!isAdminAccount && (
                <section className="profile-terminal-card">
                  <div className="profile-terminal-card-title">
                    <span className="profile-terminal-card-icon">💳</span>
                    PITCH CREDIT WALLET
                  </div>

                  <div className="profile-terminal-wallet">
                    <div className="profile-terminal-wallet-left">
                      <div className="profile-terminal-wallet-label">AVAILABLE BALANCE</div>
                      <div className="profile-terminal-wallet-balance">{formatVnd(walletBalance)}đ</div>
                    </div>
                    <button type="button" className="profile-terminal-btn" onClick={onTopUp}>
                      TOP UP
                    </button>
                  </div>
                </section>
              )}

              <section className="profile-terminal-card">
                <div className="profile-terminal-card-title">
                  <span className="profile-terminal-card-icon">🛡️</span>
                  SECURITY PROTOCOL
                </div>

                <form className="profile-terminal-form" onSubmit={onChangePassword}>
                  <div className="profile-terminal-field profile-terminal-field-wide">
                    <label className="profile-terminal-label">CURRENT PASSWORD</label>
                    <input
                      className="profile-terminal-input"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="profile-terminal-field">
                    <label className="profile-terminal-label">NEW PASSWORD</label>
                    <input
                      className="profile-terminal-input"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="profile-terminal-field">
                    <label className="profile-terminal-label">CONFIRM NEW PASSWORD</label>
                    <input
                      className="profile-terminal-input"
                      type="password"
                      value={passwordForm.confirmNewPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="profile-terminal-actions">
                    <button type="submit" className="profile-terminal-btn primary" disabled={changingPassword}>
                      {changingPassword ? 'UPDATING...' : 'UPDATE CREDENTIALS'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
            <div className="profile-terminal-right">
              <section className="profile-terminal-card">
                <div className="profile-terminal-avatar">
                  <div className="profile-terminal-avatar-preview">
                    <img src={avatarUrl} alt="Avatar" className="profile-terminal-avatar-img" />
                    {/* <div className="profile-terminal-avatar-lock">🔒</div> */}
                  </div>

                  <div className="profile-terminal-avatar-meta">
                    <div className="profile-terminal-avatar-title">AVATAR TERMINAL</div>
                    <div className="profile-terminal-avatar-sub">Upload a square image for best performance. Max 5MB.</div>
                    <button type="button" className="profile-terminal-btn" onClick={onPickAvatar} disabled={uploading}>
                      {uploading ? 'UPLOADING...' : 'REPLACE VISUAL'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onAvatarFileChange} style={{ display: 'none' }} />
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="profile-terminal-full-width">
            {activeTab === 'bookings' ? (
              <section className="profile-terminal-card">
                <div className="profile-terminal-card-title">
                  <span className="profile-terminal-card-icon">📅</span>
                  FIELD BOOKING HISTORY
                </div>
                {bookingsLoading ? (
                  <div className="profile-terminal-loading" style={{ marginTop: '1rem' }}>
                    Loading bookings...
                  </div>
                ) : bookings.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(231, 249, 238, 0.65)' }}>
                    No bookings found.
                  </div>
                ) : (
                  <div className="booking-history-list">
                    {bookings.map((booking) => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking}
                        onCancel={handleCancelBooking}
                        onFeedback={handleOpenFeedback}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : activeTab === 'transactions' ? (
              <section className="profile-terminal-card">
                <div className="profile-terminal-card-title">
                  <span className="profile-terminal-card-icon">💰</span>
                  BIẾN ĐỘNG SỐ DƯ
                </div>
                {transactionsLoading ? (
                  <div className="profile-terminal-loading" style={{ marginTop: '1rem' }}>
                    Đang tải...
                  </div>
                ) : transactions.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(231, 249, 238, 0.5)' }}>
                    Chưa có giao dịch nào
                  </div>
                ) : (
                  <div className="bank-transaction-list">
                    {transactions
                      .slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE)
                      .map((tx) => {
                      const isCredit = tx.isCredit;
                      const isDebit = tx.isDebit;
                      const amountClass = isCredit ? 'tx-credit' : isDebit ? 'tx-debit' : '';
                      
                      const date = new Date(tx.createdAt);
                      const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                      const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div key={tx.id} className="bank-transaction-item">
                          <div className="bank-tx-left">
                            <div className="bank-tx-icon-wrap">
                              <span className={`material-symbols-outlined bank-tx-icon ${amountClass}`}>
                                {isCredit ? 'south_east' : 'north_east'}
                              </span>
                            </div>
                          </div>
                          <div className="bank-tx-center">
                            <div className="bank-tx-amount">
                              {isCredit ? '+' : isDebit ? '-' : ''}{formatVnd(tx.amount)}đ
                            </div>
                            <div className="bank-tx-desc">
                              {tx.description || (isCredit ? 'Tiền vào' : 'Tiền ra')}
                              {isDebit && tx.bookingType && (
                                <>
                                  {tx.bookingType === 'field' && <span className="tx-badge tx-badge-field">Field</span>}
                                  {tx.bookingType === 'service' && <span className="tx-badge tx-badge-service">Service</span>}
                                </>
                              )}
                            </div>
                            <div className="bank-tx-time">{dateStr} • {timeStr}</div>
                          </div>
                          <div className="bank-tx-right">
                            <div className="bank-tx-balance">Số dư: {formatVnd(tx.balanceAfter)}đ</div>
                          </div>
                        </div>
                      );
                    })}
                    {transactions.length > TX_PER_PAGE && (
                      <div className="flex justify-center items-center gap-4 mt-4 pt-4 border-t border-[#474944]">
                        <button
                          onClick={() => setTxPage(p => Math.max(1, p - 1))}
                          disabled={txPage === 1}
                          className="px-3 py-1 rounded bg-[#242721] text-[#abaca5] disabled:opacity-50"
                        >
                          ← Prev
                        </button>
                        <span className="text-sm text-[#abaca5]">
                          Page {txPage} of {Math.ceil(transactions.length / TX_PER_PAGE)}
                        </span>
                        <button
                          onClick={() => setTxPage(p => Math.min(Math.ceil(transactions.length / TX_PER_PAGE), p + 1))}
                          disabled={txPage >= Math.ceil(transactions.length / TX_PER_PAGE)}
                          className="px-3 py-1 rounded bg-[#242721] text-[#abaca5] disabled:opacity-50"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        )}
        {emailOtpOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-container">
              <div className="modal-header">
                <h3 className="modal-title">
                  <span className="material-symbols-outlined">mark_email_read</span>
                  Verify new email
                </h3>
                <button type="button" className="modal-close-btn" onClick={onCancelEmailOtp} aria-label="Close">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form className="modal-body" onSubmit={onVerifyEmailOtp}>
                <div className="modal-field">
                  <label className="modal-label">New email</label>
                  <div className="modal-input-wrapper">
                    <input className="modal-input" value={String(form.email || '').trim()} disabled />
                  </div>
                </div>

                <div className="modal-field">
                  <label className="modal-label">OTP code (6 digits)</label>
                  <div className="modal-input-wrapper">
                    <input
                      className="modal-input"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter 6-digit OTP"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(String(e.target.value || '').replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="modal-btn-cancel" onClick={onCancelEmailOtp}>
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="modal-btn-cancel"
                    onClick={onResendEmailOtp}
                    disabled={emailOtpLoading || emailOtpResendSeconds > 0}
                  >
                    {emailOtpResendSeconds > 0 ? `Resend (${emailOtpResendSeconds}s)` : 'Resend OTP'}
                  </button>

                  <button type="submit" className="modal-btn-submit" disabled={emailOtpLoading}>
                    {emailOtpLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

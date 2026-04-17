import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import profileService from '../services/profileService';
import {
  isValidAddress,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidPhone,
  normalizePhone,
} from '../utils/validators';

import '../styles/UserProfilePage.css';

function formatVnd(amount) {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat('vi-VN').format(n);
  } catch {
    return String(n);
  }
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { notifyError, notifyInfo, notifySuccess } = useNotification();

  const accountType = auth.user?.accountType;
  const isAdminAccount = String(accountType || '').trim().toLowerCase() === 'admin';

  const roleName = auth.user?.role;
  const roleKey = String(roleName || '').trim().toLowerCase();
  const isCustomer = roleKey === 'customer';
  const isManager = roleKey === 'manager';

  const canChangeEmail = !isAdminAccount || isManager;

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
  }, [auth.isAuthenticated, accountType, isAdminAccount, navigate, notifyError]);

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
    notifyInfo('Top up sẽ làm sau.');
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
          <button type="button" className="profile-terminal-tab active">
            PERSONAL INFORMATION
          </button>
          {isCustomer && (
            <button
              type="button"
              className="profile-terminal-tab disabled"
              onClick={() => notifyInfo('My bookings sẽ làm sau.')}
            >
              MY BOOKINGS
            </button>
          )}
        </div>

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
                  <div className="profile-terminal-avatar-lock">🔒</div>
                </div>

                <div className="profile-terminal-avatar-meta">
                  <div className="profile-terminal-avatar-title">AVATAR TERMINAL</div>
                  <div className="profile-terminal-avatar-sub">
                    Upload a square image for best performance. Max 5MB.
                  </div>
                  <button
                    type="button"
                    className="profile-terminal-btn"
                    onClick={onPickAvatar}
                    disabled={uploading}
                  >
                    {uploading ? 'UPLOADING...' : 'REPLACE VISUAL'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onAvatarFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
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

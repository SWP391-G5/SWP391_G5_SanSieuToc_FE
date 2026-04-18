import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
} from '../../utils/validators';

const ROLES = [
  { value: 'Customer', label: 'Customer', icon: 'person' },
  { value: 'Owner', label: 'Owner', icon: 'stadium' },
  { value: 'Manager', label: 'Manager', icon: 'leaderboard' },
  { value: 'Admin', label: 'Admin', icon: 'admin_panel_settings' },
];

function isAdminGroup(role) {
  const r = String(role || '').trim().toLowerCase();
  return r === 'admin' || r === 'manager';
}

export default function AuthPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { notifyError, notifySuccess } = useNotification();

  const [mode, setMode] = useState('login');
  const [selectedRole, setSelectedRole] = useState('Customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingAccountType, setPendingAccountType] = useState('user');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendSeconds, setResendSeconds] = useState(0);

  const otpRefs = useRef([]);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    const roleKey = String(auth.user?.role || '').trim().toLowerCase();
    if (roleKey === 'admin') {
      navigate('/admin/managers', { replace: true });
      return;
    }
    if (roleKey === 'manager') {
      navigate('/manager/statistics', { replace: true });
      return;
    }
    if (roleKey === 'owner') {
      navigate('/owner/fields', { replace: true });
      return;
    }
    navigate('/', { replace: true });
  }, [auth.isAuthenticated, auth.user, navigate]);

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });

  const heroStyle = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(to top, rgba(5,46,22,0.9), rgba(5,46,22,0.25), rgba(5,46,22,0.9)), url('/assets/images/football.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    []
  );

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    const roleKey = String(auth.user?.role || '').trim().toLowerCase();
    if (roleKey === 'admin') {
      navigate('/admin/managers', { replace: true });
      return;
    }
    if (roleKey === 'manager') {
      navigate('/manager/statistics', { replace: true });
      return;
    }
    if (roleKey === 'owner') {
      navigate('/owner/fields', { replace: true });
      return;
    }
    navigate('/', { replace: true });
  }, [auth.isAuthenticated, auth.user, navigate]);

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const username = normalizeUsername(loginForm.username);
    const password = loginForm.password;

    if (!username || !password) {
      setError('Vui lòng nhập username và mật khẩu.');
      return;
    }

    if (!isValidUsername(username)) {
      setError('Username không hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const payload = { username, password, role: selectedRole };
      if (isAdminGroup(selectedRole)) {
        await auth.loginAdmin(payload);
      } else {
        await auth.loginUser(payload);
      }
      notifySuccess('Đăng nhập thành công.');
      const dest = isAdminGroup(selectedRole) ? '/admin' : '/';
      setLoading(false);
      navigate(dest, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg = data?.message || 'Đăng nhập thất bại.';

      // If account is unverified, redirect to OTP verification screen
      if (status === 403 && msg === 'Tài khoản chưa được xác thực email.' && data?.email) {
        setPendingEmail(data.email);
        setPendingAccountType(isAdminGroup(selectedRole) ? 'admin' : 'user');
        setOtpDigits(['', '', '', '', '', '']);
        setResendSeconds(0);
        setMode('verify');
        setError(msg);
        notifyError('Tài khoản chưa được xác thực. Vui lòng nhập mã OTP được gửi về email.');
        return;
      }

      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!signupForm.agree) {
      setError('Vui lòng đồng ý điều khoản.');
      return;
    }

    const name = String(signupForm.name || '').trim();
    const email = normalizeEmail(signupForm.email);
    const username = normalizeUsername(signupForm.username);
    const password = signupForm.password;

    if (!name || !email || !username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (!isValidName(name)) {
      setError('Họ tên không hợp lệ.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Email không hợp lệ.');
      return;
    }

    if (!isValidUsername(username)) {
      setError('Username không hợp lệ.');
      return;
    }

    if (!isValidPassword(password)) {
      setError('Mật khẩu phải 6-128 ký tự và gồm chữ hoa, chữ thường, số, ký tự đặc biệt (không có khoảng trắng).');
      return;
    }

    if (password !== signupForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const data = await auth.registerCustomer({ name, email, username, password });
      setPendingEmail(data?.email || email);
      setPendingAccountType('user');
      setOtpDigits(['', '', '', '', '', '']);
      setResendSeconds(60);
      setMode('verify');
      // Do not show "đăng ký chưa thành công" here.
      // Only show that warning when user explicitly goes back to Register.
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đăng ký thất bại.';
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onBackToSignupFromVerify = () => {
    notifyError('Hãy xác thực tài khoản để trở thành Customer.');
    setMode('signup');
  };

  const getOtpCode = () => otpDigits.join('');

  const focusOtp = (index) => {
    const el = otpRefs.current[index];
    if (el) el.focus();
  };

  const handleOtpChange = (index, value) => {
    const v = String(value || '').replace(/\D/g, '');
    const next = [...otpDigits];

    if (v.length === 0) {
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    const digits = v.split('');
    let cursor = index;
    for (let i = 0; i < digits.length && cursor < 6; i += 1) {
      next[cursor] = digits[i];
      cursor += 1;
    }
    setOtpDigits(next);

    if (cursor < 6) focusOtp(cursor);
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key !== 'Backspace') return;
    if (otpDigits[index]) return;
    if (index <= 0) return;
    focusOtp(index - 1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index - 1] = '';
      return next;
    });
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData?.getData('text') || '';
    const v = text.replace(/\D/g, '').slice(0, 6);
    if (!v) return;

    e.preventDefault();
    const digits = v.split('');
    const next = ['','','','','',''];
    for (let i = 0; i < 6; i += 1) next[i] = digits[i] || '';
    setOtpDigits(next);

    focusOtp(Math.min(digits.length, 6) - 1);
  };

  const onVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = normalizeEmail(pendingEmail);
    const code = getOtpCode();

    if (!email) {
      setError('Vui lòng nhập email.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Email không hợp lệ.');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError('Vui lòng nhập đủ 6 số của mã xác thực.');
      return;
    }

    setLoading(true);
    try {
      if (pendingAccountType === 'admin') {
        await auth.verifyEmailAdmin({ email, code });
      } else {
        await auth.verifyEmail({ email, code });
      }
      notifySuccess('Xác thực tài khoản thành công.');
      setMode('login');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Xác thực thất bại.';
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    setError('');

    const email = normalizeEmail(pendingEmail);
    if (!email) {
      setError('Vui lòng nhập email.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Email không hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const data =
        pendingAccountType === 'admin'
          ? await auth.resendVerificationAdmin({ email })
          : await auth.resendVerification({ email });
      setResendSeconds(60);
      notifySuccess(data?.message || 'Đã gửi lại mã xác thực.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gửi lại mã thất bại.';
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Countdown for resend
  useEffect(() => {
    if (mode !== 'verify') return undefined;
    if (resendSeconds <= 0) return undefined;

    const t = setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [mode, resendSeconds]);

  useEffect(() => {
    if (mode !== 'verify') return;
    focusOtp(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="min-h-screen text-white" style={heroStyle}>
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="font-black text-4xl md:text-5xl italic tracking-tight text-primary drop-shadow uppercase">
              Sân Siêu Tốc
            </h1>
            <p className="text-xs tracking-[0.2em] uppercase text-white/70 mt-2">Electric Pitch Precision</p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10 bg-surface-dark/70 backdrop-blur-2xl shadow-2xl">
            <div className="flex border-b border-white/10">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-5 text-sm font-extrabold uppercase tracking-widest ${
                  mode === 'login'
                    ? 'text-primary border-b-2 border-primary bg-black/10'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-5 text-sm font-extrabold uppercase tracking-widest ${
                  mode === 'signup'
                    ? 'text-primary border-b-2 border-primary bg-black/10'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            <div className="p-8">
              {error ? (
                <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-sm">
                  {error}
                </div>
              ) : null}

              {mode === 'login' ? (
                <>
                  <div className="mb-8">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 mb-4">
                      Select Access Role
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {ROLES.map((r) => {
                        const active = selectedRole === r.value;
                        return (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setSelectedRole(r.value)}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                              active
                                ? 'bg-primary/15 border-primary/40 text-primary'
                                : 'bg-white/5 border-white/10 text-white/70 hover:border-primary/40'
                            }`}
                          >
                            <span
                              className="material-symbols-outlined text-xl"
                              style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              {r.icon}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase">{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <form onSubmit={onLoginSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 px-1">
                        Username
                      </label>
                      <input
                        value={loginForm.username}
                        onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                        className="w-full bg-black/25 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 placeholder:text-white/30"
                        placeholder="your_username"
                        autoComplete="username"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end px-1">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70">Password</label>
                      </div>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginForm.password}
                          onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                          className="w-full bg-black/25 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 placeholder:text-white/30"
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                          aria-label={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          <span className="material-symbols-outlined text-xl">
                            {showLoginPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      <div className="flex justify-end items-end px-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/forgot-password?role=${selectedRole}`)}
                          className="text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-80"
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                    </div>

                    <button
                      disabled={loading}
                      className="w-full py-4 rounded-lg font-black uppercase tracking-widest bg-gradient-to-br from-primary to-primary/70 text-black shadow-lg shadow-primary/20 disabled:opacity-60"
                    >
                      {loading ? 'Loading...' : 'Login'}
                    </button>
                  </form>

                  {auth.isAuthenticated ? (
                    <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80">
                      Đã đăng nhập: <span className="font-semibold text-white">{auth.user?.name}</span> ({auth.user?.role})
                      <button type="button" onClick={() => auth.logout()} className="ml-3 text-primary font-bold hover:opacity-80">
                        Logout
                      </button>
                    </div>
                  ) : null}
                </>
              ) : mode === 'signup' ? (
                <>
                  <div className="mb-8">
                    <div className="text-center">
                      <h2 className="text-lg font-extrabold uppercase tracking-widest text-primary">Customer Register</h2>
                      <p className="text-xs text-white/70 mt-2">Hiện tại hệ thống chỉ cho phép đăng ký tài khoản Customer.</p>
                    </div>
                  </div>

                  <form onSubmit={onSignupSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 px-1">Full Name</label>
                      <input
                        value={signupForm.name}
                        onChange={(e) => setSignupForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full bg-black/25 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 placeholder:text-white/30"
                        placeholder="Cristiano Ronaldo"
                        autoComplete="name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 px-1">Username</label>
                        <input
                          value={signupForm.username}
                          onChange={(e) => setSignupForm((p) => ({ ...p, username: e.target.value }))}
                          className="w-full bg-black/25 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 placeholder:text-white/30"
                          placeholder="username"
                          autoComplete="username"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 px-1">Email</label>
                        <input
                          type="email"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm((p) => ({ ...p, email: e.target.value }))}
                          className="w-full bg-black/25 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 placeholder:text-white/30"
                          placeholder="name@example.com"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 px-1">Password</label>
                        <div className="relative">
                          <input
                            type={showSignupPassword ? 'text' : 'password'}
                            value={signupForm.password}
                            onChange={(e) => setSignupForm((p) => ({ ...p, password: e.target.value }))}
                            className="w-full bg-black/25 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                            aria-label={showSignupPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            <span className="material-symbols-outlined text-xl">
                              {showSignupPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 px-1">Confirm</label>
                        <div className="relative">
                          <input
                            type={showSignupConfirmPassword ? 'text' : 'password'}
                            value={signupForm.confirmPassword}
                            onChange={(e) => setSignupForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                            className="w-full bg-black/25 border border-white/10 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupConfirmPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                            aria-label={showSignupConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            <span className="material-symbols-outlined text-xl">
                              {showSignupConfirmPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={signupForm.agree}
                        onChange={(e) => setSignupForm((p) => ({ ...p, agree: e.target.checked }))}
                        className="mt-1 w-4 h-4 accent-primary"
                        id="terms"
                      />
                      <label htmlFor="terms" className="text-[10px] text-white/70 leading-relaxed">
                        I agree to the Terms of Service and Privacy Policy.
                      </label>
                    </div>

                    <button
                      disabled={loading}
                      className="w-full py-4 rounded-lg font-black uppercase tracking-widest bg-gradient-to-br from-primary to-primary/70 text-black shadow-lg shadow-primary/20 disabled:opacity-60"
                    >
                      {loading ? 'Loading...' : 'Create Account'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="mb-8">
                    <div className="text-center">
                      <h2 className="text-lg font-extrabold uppercase tracking-widest text-primary">Xác Thực Email</h2>
                      <p className="text-xs text-white/70 mt-2">
                        Nhập mã gồm 6 chữ số đã gửi về email: <span className="text-white font-semibold">{pendingEmail}</span>
                      </p>
                    </div>
                  </div>

                  <form onSubmit={onVerifySubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="flex justify-center block text-[10px] font-bold uppercase tracking-widest text-white/70 px-1">Mã xác thực</label>
                      <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                        {otpDigits.map((d, i) => (
                          <input
                            key={i}
                            ref={(el) => {
                              otpRefs.current[i] = el;
                            }}
                            value={d}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className="w-12 h-12 text-center text-lg font-black bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                            inputMode="numeric"
                            autoComplete={i === 0 ? 'one-time-code' : 'off'}
                            maxLength={1}
                          />
                        ))}
                      </div>
                      <p className="flex justify-center text-[11px] text-white/60 px-1">Mã có hiệu lực trong 5 phút.</p>
                    </div>

                    <button
                      disabled={loading}
                      className="w-full py-4 rounded-lg font-black uppercase tracking-widest bg-gradient-to-br from-primary to-primary/70 text-black shadow-lg shadow-primary/20 disabled:opacity-60"
                    >
                      {loading ? 'Loading...' : 'Xác thực'}
                    </button>

                    <button
                      type="button"
                      onClick={onResendCode}
                      disabled={loading || resendSeconds > 0}
                      className="w-full py-3 rounded-lg font-extrabold uppercase tracking-widest bg-white/5 border border-white/10 text-white/80 disabled:opacity-60"
                    >
                      {resendSeconds > 0 ? `Gửi lại mã (${resendSeconds}s)` : 'Gửi lại mã'}
                    </button>

                    <button
                      type="button"
                      onClick={onBackToSignupFromVerify}
                      className="w-full text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
                    >
                      Quay lại đăng ký
                    </button>
                  </form>
                </>
              )}
            </div>

            <div className="bg-black/10 p-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                Need assistance? <span className="text-primary">Contact Arena Support</span>
              </p>
            </div>
          </div>

          <div className="text-center mt-8 text-[10px] uppercase tracking-widest text-white/40">© 2024 San Sieu Toc</div>
        </div>
      </main>
    </div>
  );
}

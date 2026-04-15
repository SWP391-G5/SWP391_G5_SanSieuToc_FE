import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { forgotPasswordAdmin, forgotPasswordUser } from '../services/authApi';
import { useNotification } from '../../context/NotificationContext';

function isAdminGroup(role) {
  const r = String(role || '').trim().toLowerCase();
  return r === 'admin' || r === 'manager';
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { notifyError, notifySuccess } = useNotification();

  const role = params.get('role') || 'Customer';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const heroStyle = useMemo(
    () => ({
      backgroundImage:
        "linear-gradient(to bottom, rgba(5,46,22,0.35), rgba(5,46,22,0.95)), url('/assets/images/football.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }),
    []
  );

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      notifyError('Vui lòng nhập email.');
      return;
    }

    setLoading(true);
    try {
      if (isAdminGroup(role)) {
        await forgotPasswordAdmin({ email });
      } else {
        await forgotPasswordUser({ email });
      }
      notifySuccess('Nếu email tồn tại, mật khẩu mới đã được gửi.');
      navigate('/auth');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Không thể xử lý yêu cầu.';
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={heroStyle}>
      <header className="w-full pt-12 flex flex-col items-center gap-1 z-10">
        <h1 className="font-black text-4xl italic tracking-widest text-primary uppercase">Sân Siêu Tốc</h1>
        <p className="text-[10px] tracking-[0.3em] text-white/60 uppercase">Electric Pitch Precision</p>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 w-full max-w-md mx-auto z-10">
        <div className="w-full bg-surface-dark/70 backdrop-blur-2xl p-8 rounded-2xl border border-white/10 shadow-2xl">
          <div className="text-center mb-10">
            <h2 className="font-extrabold text-2xl text-primary tracking-tight mb-3 uppercase">Forgot password</h2>
            <p className="text-white/70 text-sm">Enter your email address to reset your password</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/70 ml-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/25 border border-white/10 rounded-lg px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                placeholder="name@example.com"
                type="email"
                autoComplete="email"
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-gradient-to-br from-primary to-primary/70 text-black font-extrabold py-4 rounded-lg tracking-wider shadow-lg shadow-primary/20 disabled:opacity-60 uppercase"
              type="submit"
            >
              {loading ? 'Loading...' : 'Reset password'}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-white/70 hover:text-primary transition-colors text-sm font-medium inline-flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Back to Login
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full py-12 flex flex-col items-center justify-center space-y-4 text-[10px] uppercase tracking-tighter text-white/30 z-10">
        <div className="flex gap-6">
          <span className="opacity-80">Support</span>
          <span className="opacity-80">Privacy Policy</span>
          <span className="opacity-80">Terms of Service</span>
        </div>
        <p className="text-center">© 2024 San Sieu Toc</p>
      </footer>
    </div>
  );
}

/**
 * ManagerLayout.jsx
 * Layout shell for Manager/Admin (AdminAccount) dashboard area.
 * Provides fixed sidebar + top app bar and renders nested manager routes.
 */

import { NavLink, Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useRef, useState } from 'react';

/**
 * NAV_ITEMS
 * Sidebar navigation definition for manager area.
 */
const NAV_ITEMS = [
  { key: 'statistics', label: 'Thống kê', to: '/manager/statistics', icon: 'bar_chart' },
  { key: 'posts', label: 'Bài viết', to: '/manager/posts', icon: 'edit_note' },
  { key: 'marketing', label: 'Banner & Quảng cáo', to: '/manager/banners-ads', icon: 'branding_watermark' },
  { key: 'wallet', label: 'Ví', to: '/manager/wallet', icon: 'account_balance_wallet' },
  { key: 'privacy', label: 'Quyền riêng tư', to: '/manager/privacy', icon: 'shield' },
  { key: 'feedback', label: 'Phản hồi', to: '/manager/feedback', icon: 'rate_review' },
];

/**
 * getNavItemClassName
 * Computes Tailwind classNames for a sidebar NavLink.
 *
 * @param {object} args - react-router NavLink args
 * @param {boolean} args.isActive - Whether the link is currently active
 * @returns {string} Tailwind class string
 */
function getNavItemClassName({ isActive }) {
  if (isActive) {
    return 'flex items-center gap-3 px-6 py-3 text-[#8eff71] border-l-4 border-[#8eff71] bg-[#181a16] font-bold';
  }

  return 'flex items-center gap-3 px-6 py-3 text-[#fdfdf6]/60 hover:text-[#fdfdf6] transition-colors hover:bg-[#181a16] group';
}

/**
 * ManagerLayout
 * @returns {JSX.Element} Manager layout UI
 */
export default function ManagerLayout() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };

    const onMouseDown = (e) => {
      if (!settingsRef.current) return;
      if (!settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  const onLogout = () => {
    auth.logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="bg-surface text-on-surface selection:bg-primary selection:text-on-primary">
      {/* SideNavBar */}
      <aside className="bg-[#121410] dark:bg-[#121410] h-screen w-64 fixed left-0 top-0 flex flex-col py-8 z-50">
        <div className="px-6 mb-12">
          <h1 className="text-2xl font-black tracking-tight text-[#fdfdf6] font-headline">San Sieu Toc HQ</h1>
          <p className="text-xs uppercase tracking-widest text-primary/60 font-bold mt-1">Khu vực Manager</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            return (
              <NavLink key={item.key} to={item.to} className={getNavItemClassName} end={false}>
                <span
                  className="material-symbols-outlined transition-transform group-hover:scale-110"
                  data-icon={item.icon}
                >
                  {item.icon}
                </span>
                <span className="font-label text-md uppercase">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Profile card placeholder - wired later */}
        <div className="px-6 mt-auto">
          <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest border border-outline-variant/30 text-[#8eff71] font-black">
              {String(auth.user?.name || auth.user?.username || 'M')
                .trim()
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{auth.user?.name || auth.user?.username || 'Quản lý'}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter truncate">
                {auth.user?.email || String(auth.user?.role || 'Quản lý')}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <main className="ml-64 min-h-screen pb-12">
        {/* TopAppBar */}
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-[#0d0f0b]/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-[0_40px_40px_0_rgba(142,255,113,0.08)]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-headline font-extrabold tracking-tight text-on-surface">Bảng điều khiển</h2>
            <div className="h-4 w-[1px] bg-outline-variant/30" />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {/* Settings menu */}
              <div ref={settingsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSettingsOpen((v) => !v)}
                  className="rounded-lg p-2 text-on-surface-variant hover:text-[#8eff71] hover:bg-white/5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8eff71]/40"
                  aria-haspopup="menu"
                  aria-label="Cài đặt tài khoản"
                  aria-expanded={settingsOpen}
                >
                  <span className="material-symbols-outlined" data-icon="settings">
                    settings
                  </span>
                </button>

                <div
                  className={
                    settingsOpen
                      ? 'pointer-events-auto absolute right-0 mt-2 w-60 origin-top-right rounded-xl border border-white/10 bg-[#0d0f0b]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)] opacity-100 translate-y-0 transition-all duration-150'
                      : 'pointer-events-none absolute right-0 mt-2 w-60 origin-top-right rounded-xl border border-white/10 bg-[#0d0f0b]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.55)] opacity-0 translate-y-1 transition-all duration-150'
                  }
                >
                  <div className="p-3">
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <div className="text-xs font-black tracking-widest uppercase text-[#fdfdf6]/50">Tài khoản</div>
                      <div className="mt-1 truncate text-sm font-semibold text-[#fdfdf6]">
                        {auth.user?.name || auth.user?.username || 'Quản lý'}
                      </div>
                      <div className="truncate text-xs text-[#fdfdf6]/60">{auth.user?.email || ''}</div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsOpen(false);
                          navigate('/manager/profile');
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#fdfdf6]/80 hover:bg-white/5 hover:text-[#8eff71] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] leading-none">account_circle</span>
                        <span className="flex-1 text-left">Hồ sơ</span>
                      </button>

                      <div className="h-px bg-white/10 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setSettingsOpen(false);
                          onLogout();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#fdfdf6]/80 hover:bg-red-500/10 hover:text-red-200 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] leading-none">logout</span>
                        <span className="flex-1 text-left">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Nested pages */}
        <div className="pt-28 px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function UserMenu({ auth, navigate, profilePath, showProfile = true, showLogout = true }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const showMenu = showProfile || showLogout;

  const displayName = useMemo(() => {
    const name = String(auth.user?.name || '').trim();
    if (name) return name;
    const username = String(auth.user?.username || '').trim();
    return username || 'User';
  }, [auth.user?.name, auth.user?.username]);

  const avatarSrc = useMemo(() => {
    const raw = String(auth.user?.image || '').trim();
    if (!raw) return '';

    // Allow common safe URL forms: absolute http(s), relative (/path), or data:image.
    if (raw.startsWith('data:image/')) return raw;
    if (raw.startsWith('/')) return raw;

    try {
      const u = new URL(raw);
      if (u.protocol === 'http:' || u.protocol === 'https:') return raw;
      return '';
    } catch {
      return '';
    }
  }, [auth.user?.image]);

  const avatarFallback = useMemo(() => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#1a2a22"/>
      <stop offset="1" stop-color="#0b120e"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="20" fill="url(#g)"/>
  <circle cx="64" cy="52" r="22" fill="#2a3c33"/>
  <path d="M24 112c7-22 26-34 40-34s33 12 40 34" fill="#2a3c33"/>
  <circle cx="64" cy="64" r="54" fill="none" stroke="#6dff9e" stroke-opacity="0.18" stroke-width="4"/>
</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, []);

  useEffect(() => {
    if (!showMenu) return undefined;
    if (!userMenuOpen) return undefined;

    const onMouseDown = (e) => {
      if (!userMenuRef.current) return;
      if (userMenuRef.current.contains(e.target)) return;
      setUserMenuOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showMenu, userMenuOpen]);

  const onProfile = () => {
    setUserMenuOpen(false);
    navigate(profilePath || '/profile');
  };

  const onLogout = () => {
    setUserMenuOpen(false);
    auth.logout();
    navigate('/', { replace: true });
  };

  if (!auth.isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => navigate('/auth')}
        className="scale-95 rounded-md bg-gradient-to-br from-[#8eff71] to-[#2ff801] px-6 py-2 font-bold text-[#0d6100] transition-transform duration-200 hover:scale-100"
      >
        Sign In
      </button>
    );
  }

  if (!showMenu) {
    return (
      <div ref={userMenuRef} className="relative flex items-center">
        <div className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3">
          <span className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#8eff71]/30">
            <img
              src={avatarSrc || avatarFallback}
              alt="Avatar"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </span>
          <span className="max-w-44 truncate text-sm font-semibold text-[#fdfdf6]">{displayName}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={userMenuRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setUserMenuOpen((v) => !v)}
        className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={userMenuOpen}
      >
        <span className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#8eff71]/30">
          <img
            src={avatarSrc || avatarFallback}
            alt="Avatar"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </span>
        <span className="max-w-44 truncate text-sm font-semibold text-[#fdfdf6]">{displayName}</span>
      </button>

      {userMenuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-md border border-white/10 bg-[#0d0f0b]/95 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
        >
          {showProfile ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={onProfile}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#fdfdf6]/80 hover:bg-white/5 hover:text-[#8eff71]"
              >
                <span className="material-symbols-outlined text-[18px] leading-none">account_circle</span>
                <span>Profile</span>
              </button>

              <div className="my-1 h-px bg-white/10" />
            </>
          ) : null}

          {showLogout ? (
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#fdfdf6]/80 hover:bg-white/5 hover:text-[#8eff71]"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">logout</span>
              <span>Logout</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pathname = location.pathname;
  const isHome = pathname === '/';
  const isFields = pathname.startsWith('/fields');
  const isWishlist = pathname.startsWith('/wishlist');
  const isCommunity = pathname.startsWith('/community');

  const isAdminRoute = pathname.startsWith('/admin');
  const accountTypeKey = String(auth.user?.accountType || '').trim().toLowerCase();
  const roleKey = String(auth.user?.role || '').trim().toLowerCase();
  const isAdminAccount = accountTypeKey === 'admin';
  const isAdminUser = isAdminAccount || ['admin', 'manager'].includes(roleKey);
  const isAdminConsoleUser = roleKey === 'admin';
  const hidePublicNav = isAdminRoute || isAdminUser;
  const profilePath = isAdminConsoleUser ? '/admin/profile' : '/profile';
  const showProfileInUserMenu = !isAdminConsoleUser;
  const showLogoutInUserMenu = !isAdminConsoleUser;

  const navItemClass = (active) =>
    active
      ? 'border-b-2 border-[#8eff71] pb-1 text-[#8eff71] transition-colors duration-300'
      : 'text-[#fdfdf6]/70 transition-colors duration-300 hover:text-[#8eff71]';

  return (
    <div className="min-h-screen bg-[#0d0f0b] text-[#fdfdf6] font-ui selection:bg-[#8eff71] selection:text-[#0d6100] flex flex-col">
      {/* Header */}
      <nav className="fixed top-0 z-50 h-20 w-full bg-[#0d0f0b]/70 backdrop-blur-xl shadow-[0_40px_40px_0_rgba(142,255,113,0.08)]">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-8">
          <button
            type="button"
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-headline text-2xl font-black italic text-[#8eff71]"
          >
            San Sieu Toc
          </button>

          {!hidePublicNav ? (
            <div className="hidden items-center gap-6 font-ui text-sm uppercase tracking-wider md:flex lg:gap-8">
              <button
                type="button"
                onClick={() => {
                  navigate('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={navItemClass(isHome)}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/fields');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={navItemClass(isFields)}
              >
                Field
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate('/community');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={navItemClass(isCommunity)}
              >
                Community
              </button>
              <button
                type="button"
                onClick={() => scrollToId('privacy')}
                className="text-[#fdfdf6]/70 transition-colors duration-300 hover:text-[#8eff71]"
              >
                Privacy
              </button>
              <button type="button" onClick={() => navigate('/wishlist')} className={navItemClass(isWishlist)}>
                Wishlist
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-4">
            <UserMenu
              key={location.pathname}
              auth={auth}
              navigate={navigate}
              profilePath={profilePath}
              showProfile={showProfileInUserMenu}
              showLogout={showLogoutInUserMenu}
            />
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      {!isAdminRoute ? (
        <footer id="community" className="scroll-mt-24 mx-auto w-full max-w-7xl px-6 py-16 md:px-8">
          <div id="privacy" className="scroll-mt-24" />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <div className="font-headline text-2xl font-black italic text-[#8eff71]">San Sieu Toc</div>
              <p className="mt-3 text-sm text-[#abaca5]">Fast field booking. Better play.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 md:col-span-2">
              <div>
                <div className="mb-3 text-xs font-black uppercase tracking-widest text-[#fdfdf6]">Product</div>
                <ul className="space-y-2 text-sm text-[#abaca5]">
                  <li>
                    <button
                      type="button"
                      className="hover:text-[#8eff71]"
                      onClick={() => {
                        navigate('/fields');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Fields
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-[#8eff71]" onClick={() => navigate('/auth')}>
                      Bookings
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-[#8eff71]" onClick={() => navigate('/auth')}>
                      Pricing
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <div className="mb-3 text-xs font-black uppercase tracking-widest text-[#fdfdf6]">Company</div>
                <ul className="space-y-2 text-sm text-[#abaca5]">
                  <li>
                    <button
                      type="button"
                      className="hover:text-[#8eff71]"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      About
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="hover:text-[#8eff71]"
                      onClick={() => {
                        navigate('/community');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Community
                    </button>
                  </li>
                  <li>
                    <button type="button" className="hover:text-[#8eff71]" onClick={() => scrollToId('privacy')}>
                      Contact
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-[#474944]/20 pt-8 text-xs text-[#abaca5]">
            © {new Date().getFullYear()} San Sieu Toc. All rights reserved.
          </div>
        </footer>
      ) : null}
    </div>
  );
}

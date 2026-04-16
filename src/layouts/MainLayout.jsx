import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goHomeAndScroll = (id) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }
    scrollToId(id);
  };

  const isHome = location.pathname === '/';

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

          <div className="hidden items-center gap-6 font-ui text-sm uppercase tracking-wider md:flex lg:gap-8">
            <button
              type="button"
              onClick={() => {
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={
                isHome
                  ? 'border-b-2 border-[#8eff71] pb-1 text-[#8eff71] transition-colors duration-300'
                  : 'text-[#fdfdf6]/70 transition-colors duration-300 hover:text-[#8eff71]'
              }
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => goHomeAndScroll('field')}
              className="text-[#fdfdf6]/70 transition-colors duration-300 hover:text-[#8eff71]"
            >
              Field
            </button>
            <button
              type="button"
              onClick={() => scrollToId('community')}
              className="text-[#fdfdf6]/70 transition-colors duration-300 hover:text-[#8eff71]"
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
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-[#fdfdf6]/70 transition-colors duration-300 hover:text-[#8eff71]"
            >
              Wishlist
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="scale-95 rounded-md bg-gradient-to-br from-[#8eff71] to-[#2ff801] px-6 py-2 font-bold text-[#0d6100] transition-transform duration-200 hover:scale-100"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      {/* Footer */}
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
                  <button type="button" className="hover:text-[#8eff71]" onClick={() => goHomeAndScroll('field')}>
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
                  <button type="button" className="hover:text-[#8eff71]" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    About
                  </button>
                </li>
                <li>
                  <button type="button" className="hover:text-[#8eff71]" onClick={() => scrollToId('community')}>
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
    </div>
  );
}

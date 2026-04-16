/**
 * ManagerLayout.jsx
 * Layout shell for Manager/Admin (AdminAccount) dashboard area.
 * Provides fixed sidebar + top app bar and renders nested manager routes.
 */

import { NavLink, Outlet } from 'react-router-dom';

/**
 * NAV_ITEMS
 * Sidebar navigation definition for manager area.
 */
const NAV_ITEMS = [
  { key: 'posts', label: 'Blog', to: '/manager/posts', icon: 'edit_note' },
  { key: 'slides', label: 'Slides', to: '/manager/slides', icon: 'present_to_all' },
  { key: 'banners', label: 'Banners', to: '/manager/banners', icon: 'branding_watermark' },
  { key: 'statistics', label: 'Statistics', to: '/manager/statistics', icon: 'bar_chart' },
  { key: 'wallet', label: 'Wallet', to: '/manager/wallet', icon: 'account_balance_wallet' },
  { key: 'privacy', label: 'Privacy', to: '/manager/privacy', icon: 'vps_shield' },
  { key: 'feedback', label: 'Feedback', to: '/manager/feedback', icon: 'rate_review' },
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
  return (
    <div className="bg-surface text-on-surface selection:bg-primary selection:text-on-primary">
      {/* SideNavBar */}
      <aside className="bg-[#121410] dark:bg-[#121410] h-screen w-64 fixed left-0 top-0 flex flex-col py-8 z-50">
        <div className="px-6 mb-12">
          <h1 className="text-2xl font-black tracking-tight text-[#fdfdf6] font-headline">Kinetic Turf</h1>
          <p className="text-xs uppercase tracking-widest text-primary/60 font-bold mt-1">Platform Manager</p>
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
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest border border-outline-variant/30" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">Manager</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">System Operator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <main className="ml-64 min-h-screen pb-12">
        {/* TopAppBar */}
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-[#0d0f0b]/70 backdrop-blur-xl flex justify-between items-center px-8 h-20 shadow-[0_40px_40px_0_rgba(142,255,113,0.08)]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-headline font-extrabold tracking-tight text-on-surface">Dashboard</h2>
            <div className="h-4 w-[1px] bg-outline-variant/30" />
            <p className="text-sm text-on-surface-variant font-body">Sân Siêu Tốc HQ</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group focus-within:ring-2 focus-within:ring-[#8eff71]/50 rounded-lg">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                search
              </span>
              <input
                className="bg-surface-container-high border-none text-sm pl-10 pr-4 py-2 rounded-lg w-64 focus:ring-0 text-on-surface"
                placeholder="Global search..."
                type="text"
              />
            </div>

            <div className="flex items-center gap-4">
              <button type="button" className="text-on-surface-variant hover:text-[#8eff71] transition-all relative">
                <span className="material-symbols-outlined" data-icon="notifications">
                  notifications
                </span>
                <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
              </button>
              <button type="button" className="text-on-surface-variant hover:text-[#8eff71] transition-all">
                <span className="material-symbols-outlined" data-icon="settings">
                  settings
                </span>
              </button>
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

import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import axiosInstance from '../../services/axios';

export default function OwnerLayout() {
  const { user, logout, accessToken } = useAuth();
  const location = useLocation();
  const [refundCount, setRefundCount] = useState(0);

  useEffect(() => {
    const fetchRefundCount = async () => {
      try {
        const res = await axiosInstance.get('/api/bookings/owner/refund-requests');
        setRefundCount(res.data.count || 0);
      } catch (err) {
        console.log('No refund API');
      }
    };
    fetchRefundCount();
    const interval = setInterval(fetchRefundCount, 10000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { name: 'Dashboard', path: '/owner/dashboard', icon: 'dashboard' },
    { name: 'Fields', path: '/owner/fields', icon: 'stadium', endIconAttr: { style: { fontVariationSettings: "'FILL' 1" } } },
    { name: 'Bookings', path: '/owner/bookings', icon: 'event_available' },
    { name: 'Refund Request', path: '/owner/refunds', icon: 'replay', badge: true },
    { name: 'Wallet', path: '/owner/wallet', icon: 'account_balance_wallet' },
    { name: 'Marketing', path: '/owner/marketing', icon: 'rss_feed' },
    { name: 'Vouchers', path: '/owner/vouchers', icon: 'confirmation_number' },
    { name: 'Revenue', path: '/owner/revenue', icon: 'insights' },
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body flex">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-8 z-40 hidden md:flex">
        <div className="px-6 mb-10">
          <h1 className="text-primary font-bold text-2xl headline-font tracking-tighter">Owner Hub</h1>
          <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest">Elite Operator</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 transition-all group ${
                  isActive
                    ? 'text-on-surface border-l-4 border-primary bg-surface-container font-semibold translate-x-1'
                    : 'text-on-surface/40 hover:text-primary hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined mr-3" {...(isActive ? item.endIconAttr : {})}>
                  {item.icon}
                </span>
                <span className="font-label text-sm">{item.name}</span>
                {item.badge && refundCount > 0 && (
                  <span className="ml-auto bg-error text-on-primary text-xs font-bold px-2 py-0.5 rounded-full">
                    {refundCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 mt-auto space-y-1">
          <div className="mb-6">
            <button className="w-full impact-gradient text-on-primary font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 text-sm uppercase tracking-tight shadow-lg shadow-primary/10 hover:opacity-90">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              New Booking
            </button>
          </div>
          <Link to="/owner/support" className="flex items-center py-2 text-on-surface/40 hover:text-primary transition-colors">
            <span className="material-symbols-outlined mr-3">help</span>
            <span className="font-label text-sm">Support</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center py-2 w-full text-left text-on-surface/40 hover:text-error transition-colors">
            <span className="material-symbols-outlined mr-3">logout</span>
            <span className="font-label text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="fixed top-0 right-0 left-0 md:left-64 z-30 glass-nav h-16 flex justify-between items-center px-6 w-auto border-b border-outline-variant/5">
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-highest flex items-center px-4 py-1.5 rounded-full border border-outline-variant/15 neon-glow">
            <span className="material-symbols-outlined text-primary text-lg mr-2">search</span>
            <input
              type="text"
              className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant/50 w-48 md:w-64 outline-none"
              placeholder="Search facilities..."
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors duration-200">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors duration-200">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 bg-surface-container-high flex items-center justify-center">
            {user?.image ? (
              <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-sm uppercase">{user?.name?.charAt(0) || 'O'}</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-20 pb-12 px-6 md:ml-64 min-h-screen bg-surface w-full">
        <Outlet />
      </main>

      {/* Mobile Navigation (Visible only on small screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav h-16 flex items-center justify-around px-4 z-50 border-t border-outline-variant/10">
        <Link to="/owner/dashboard" className="flex flex-col items-center gap-1 text-on-surface/40">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-label">Home</span>
        </Link>
        <Link to="/owner/fields" className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stadium</span>
          <span className="text-[10px] font-label">Fields</span>
        </Link>
        <button className="bg-primary text-on-primary p-3 rounded-full -mt-10 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
          <span className="material-symbols-outlined">add</span>
        </button>
        <Link to="/owner/wallet" className="flex flex-col items-center gap-1 text-on-surface/40">
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="text-[10px] font-label">Wallet</span>
        </Link>
        <Link to="/owner/bookings" className="flex flex-col items-center gap-1 text-on-surface/40">
          <span className="material-symbols-outlined">event_available</span>
          <span className="text-[10px] font-label">Bookings</span>
        </Link>
        <Link to="/owner/profile" className="flex flex-col items-center gap-1 text-on-surface/40">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-label">Profile</span>
        </Link>
      </nav>
    </div>
  );
}

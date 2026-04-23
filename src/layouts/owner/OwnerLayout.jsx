import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../services/axios";

export default function OwnerLayout() {
  const { user, logout, accessToken } = useAuth();
  const location = useLocation();
  const [refundCount, setRefundCount] = useState(0);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);
  const settingsButtonRef = useRef(null);

  useEffect(() => {
    const fetchRefundCount = async () => {
      try {
        const res = await axiosInstance.get(
          "/api/bookings/owner/refund-requests",
        );
        setRefundCount(res.data.count || 0);
      } catch (err) {
        console.log("No refund API");
      }
    };
    fetchRefundCount();
    const interval = setInterval(fetchRefundCount, 10000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (!showSettingsMenu) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      if (settingsMenuRef.current?.contains(target)) return;
      if (settingsButtonRef.current?.contains(target)) return;
      setShowSettingsMenu(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettingsMenu]);

  const navItems = [
    { name: "Dashboard", path: "/owner/dashboard", icon: "dashboard" },
    {
      name: "Fields Management",
      path: "/owner/fields",
      icon: "stadium",
      endIconAttr: { style: { fontVariationSettings: "'FILL' 1" } },
    },
    {
      name: "Bookings Management",
      path: "/owner/bookings",
      icon: "event_available",
    },
    { name: "Refunds", path: "/owner/refunds", icon: "replay", badge: true },
    { name: "Reports", path: "/owner/reports", icon: "report" },
    { name: "Wallet", path: "/owner/wallet", icon: "account_balance_wallet" },
    { name: "Posts", path: "/owner/posts", icon: "rss_feed" },
    { name: "Vouchers ", path: "/owner/vouchers", icon: "confirmation_number" },
    { name: "Revenue", path: "/owner/revenue", icon: "insights" },
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body flex">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-8 z-40 hidden md:flex">
        <div className="px-6 mb-10">
          <h1 className="text-primary font-bold text-2xl headline-font tracking-tighter">
            Khu vực Chủ sân
          </h1>
          <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest">
            Nhà vận hành cao cấp
          </p>
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
                    ? "text-on-surface border-l-4 border-primary bg-surface-container font-semibold translate-x-1"
                    : "text-on-surface/40 hover:text-primary hover:bg-surface-container"
                }`}
              >
                <span
                  className="material-symbols-outlined mr-3"
                  {...(isActive ? item.endIconAttr : {})}
                >
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

      </aside>

      {/* TopNavBar */}
      <header className="fixed top-0 right-0 left-0 md:left-64 z-30 glass-nav h-16 flex justify-end items-center px-6 w-auto border-b border-outline-variant/5">

        <div className="flex items-center gap-4 relative">

          <button
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors duration-200"
            onClick={() => setShowSettingsMenu((prev) => !prev)}
            type="button"
            ref={settingsButtonRef}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          {showSettingsMenu ? (
            <div
              className="absolute right-0 top-12 w-44 rounded-xl border border-outline-variant/40 bg-surface-container-high shadow-lg z-50"
              ref={settingsMenuRef}
            >
              <Link
                to="/owner/profile"
                onClick={() => setShowSettingsMenu(false)}
                className="block px-4 py-2 text-sm text-on-surface hover:bg-surface"
              >
                Hồ sơ
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowSettingsMenu(false);
                  handleLogout();
                }}
                className="w-full px-4 py-2 text-sm text-left text-on-surface hover:bg-surface"
              >
                Đăng xuất
              </button>
            </div>
          ) : null}
          <div className="h-8 w-8 rounded-full overflow-hidden border border-primary/20 bg-surface-container-high flex items-center justify-center">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-primary font-bold text-sm uppercase">
                {user?.name?.charAt(0) || "O"}
              </span>
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
        <Link
          to="/owner/dashboard"
          className="flex flex-col items-center gap-1 text-on-surface/40"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-label">Trang chủ</span>
        </Link>
        <Link
          to="/owner/fields"
          className="flex flex-col items-center gap-1 text-primary"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            stadium
          </span>
          <span className="text-[10px] font-label">Sân</span>
        </Link>
        <button className="bg-primary text-on-primary p-3 rounded-full -mt-10 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
          <span className="material-symbols-outlined">add</span>
        </button>
        <Link
          to="/owner/wallet"
          className="flex flex-col items-center gap-1 text-on-surface/40"
        >
          <span className="material-symbols-outlined">
            account_balance_wallet
          </span>
          <span className="text-[10px] font-label">Ví</span>
        </Link>
        <Link
          to="/owner/bookings"
          className="flex flex-col items-center gap-1 text-on-surface/40"
        >
          <span className="material-symbols-outlined">event_available</span>
          <span className="text-[10px] font-label">Đặt sân</span>
        </Link>
        <Link
          to="/owner/profile"
          className="flex flex-col items-center gap-1 text-on-surface/40"
        >
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-label">Hồ sơ</span>
        </Link>
      </nav>
    </div>
  );
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? 'flex items-center gap-3 rounded-md bg-white/5 px-3 py-2 text-sm font-semibold text-[#8eff71]'
          : 'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[#fdfdf6]/80 hover:bg-white/5 hover:text-[#8eff71]'
      }
    >
      {icon ? <span className="material-symbols-outlined text-[18px] leading-none">{icon}</span> : null}
      <span className="flex-1">{label}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0d0f0b] text-[#fdfdf6] font-ui selection:bg-[#8eff71] selection:text-[#0d6100]">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-72 flex-col border-r border-white/10 px-4 py-6 md:flex">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-left font-headline text-xl font-black italic text-[#8eff71]"
          >
            Admin Console
          </button>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-[#fdfdf6]/50">System Root</div>

          <div className="mt-5 flex flex-col gap-1">
            <NavItem to="/admin/managers" label="Manager Accounts" icon="manage_accounts" />
            <NavItem to="/admin/owners" label="Owner Accounts" icon="domain" />
            <NavItem to="/admin/customers" label="Customer Accounts" icon="group" />
            <NavItem to="/admin/reports" label="Reports" icon="report" />
            <NavItem to="/admin/profile" label="My Profile" icon="account_circle" />
          </div>

          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={() => {
                auth.logout();
                navigate('/', { replace: true });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-br from-[#8eff71] to-[#2ff801] px-3 py-2 text-sm font-bold text-[#0d6100] hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 px-5 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

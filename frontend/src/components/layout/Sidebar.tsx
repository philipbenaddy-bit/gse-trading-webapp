import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart2,
  Briefcase,
  Wallet,
  ClipboardList,
  User,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../lib/api';
import clsx from 'clsx';

const navItems = [
  { to: '/hub', icon: LayoutDashboard, label: 'Hub' },
  { to: '/market', icon: TrendingUp, label: 'Market' },
  { to: '/trade', icon: BarChart2, label: 'Trade' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
    }
  };

  return (
    <aside className="w-64 bg-[#0d0d0d] border-r border-[#D4AF37]/15 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#D4AF37]/15">
        {/* Ghana flag stripe */}
        <div className="h-0.5 bg-gradient-to-r from-[#CE1126] via-[#FCD116] to-[#006B3F] rounded-full mb-4" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/25">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-none">GSE Trade</h1>
            <p className="text-xs text-[#D4AF37]/40 mt-0.5">Ghana Stock Exchange</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25 shadow-sm'
                  : 'text-slate-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/8',
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-[#D4AF37]/15">
        <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
          <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-slate-400 hover:text-[#DC143C] hover:bg-[#DC143C]/10 transition-all"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

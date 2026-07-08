import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useMarketSocket } from '../../hooks/useMarketSocket';

const pageTitles: Record<string, string> = {
  '/hub': 'Hub',
  '/dashboard': 'Dashboard',
  '/market': 'Market',
  '/trade': 'Trade',
  '/portfolio': 'Portfolio',
  '/wallet': 'Wallet',
  '/orders': 'Orders',
  '/profile': 'Profile',
};

export default function TopBar() {
  const location = useLocation();
  const { isConnected } = useMarketSocket();

  const title = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path),
  )?.[1] || 'GSE Trade';

  return (
    <header className="h-16 bg-[#0d0d0d] border-b border-[#D4AF37]/15 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#D4AF37] to-[#B8860B]" />
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#228B22] animate-pulse' : 'bg-slate-600'}`} />
          <span className={`text-xs font-medium ${isConnected ? 'text-[#228B22]' : 'text-slate-500'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        <button className="relative p-2 text-slate-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-all">
          <Bell size={17} />
        </button>
      </div>
    </header>
  );
}

import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Briefcase, ArrowRight, Star, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { portfolioApi, walletApi, marketApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { formatGHS, formatPercentage } from '../utils/currency';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { StaggerList, StaggerItem, FadeUp } from '../components/ui/PageTransition';
import { StatCardSkeleton } from '../components/ui/PageSkeleton';
import clsx from 'clsx';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, accent = '#D4AF37' }: any) {
  return (
    <div className="african-card p-5 group hover:shadow-gold-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold truncate">
            {title}
          </p>
          <p className="text-2xl font-bold mt-1 font-mono truncate" style={{ color: accent }}>
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
        </div>
        <div
          className="p-2.5 rounded-lg flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300"
          style={{ background: `${accent}15` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

// ── Stock row ─────────────────────────────────────────────────────────────────
function StockRow({ stock, href }: { stock: any; href: string }) {
  const isUp = stock.change >= 0;
  return (
    <Link
      to={href}
      className="flex items-center justify-between p-3 rounded-xl hover:bg-[#D4AF37]/5 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-xs font-bold text-[#D4AF37] flex-shrink-0">
          {(stock.name || stock.symbol || '').slice(0, 3)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{stock.name || stock.symbol}</p>
          <p className="text-xs text-muted-foreground truncate">
            Vol: {stock.volume?.toLocaleString() ?? '—'}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="font-semibold text-sm font-mono">GHS {stock.price?.toFixed(2)}</p>
        <span className={clsx('text-xs font-medium', isUp ? 'price-up' : 'price-down')}>
          {isUp ? '+' : ''}{stock.change?.toFixed(2)}%
        </span>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: portfolio, isLoading: loadingPortfolio } = useQuery(
    'portfolio',
    () => portfolioApi.get().then((r) => r.data),
  );
  const { data: wallet, isLoading: loadingWallet } = useQuery(
    'wallet',
    () => walletApi.get().then((r) => r.data),
  );
  const { data: market, isLoading: loadingMarket } = useQuery(
    'market-live',
    () => marketApi.getLive().then((r) => r.data),
    { refetchInterval: 30000 },
  );

  const liveStocks: any[] = market?.data || [];
  const topMovers = [...liveStocks]
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  const portfolioSummary = portfolio?.summary;
  const walletBalance    = wallet?.balance || 0;
  const isLoadingStats   = loadingPortfolio || loadingWallet || loadingMarket;
  const pnlPositive      = (portfolioSummary?.totalPnl || 0) >= 0;

  return (
    <div className="space-y-6 relative px-4 md:px-0 bg-background">

      {/* Welcome banner */}
      <FadeUp>
        <div className="relative overflow-hidden african-card p-5 md:p-6">
          {/* Kente stripe at top */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-ghana" />

          {/* Subtle Adinkra watermark */}
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 text-[#D4AF37]/8 pointer-events-none"
            viewBox="0 0 200 200" fill="none" aria-hidden="true"
          >
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" />
            <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="1.5" />
            <path d="M100 20 C120 50 120 150 100 180" stroke="currentColor" strokeWidth="1.5" />
            <path d="M100 20 C80 50 80 150 100 180" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 100 C50 80 150 80 180 100" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 100 C50 120 150 120 180 100" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                <span>Good day, {user?.firstName}</span>
                <span className="text-3xl">👋</span>
              </h2>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Here's your trading overview
              </p>
            </div>
            <div className="hidden sm:flex flex-shrink-0 items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CE1126]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#006B3F]" />
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-gold-sm"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
              >
                <Star className="text-white" size={22} />
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Stat cards */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {isLoadingStats ? (
          [...Array(4)].map((_, i) => (
            <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>
          ))
        ) : (
          <>
            <StaggerItem>
              <StatCard
                title="Wallet Balance"
                value={formatGHS(walletBalance)}
                sub="Available to trade"
                icon={Wallet}
                accent="#D4AF37"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Portfolio Value"
                value={formatGHS(portfolioSummary?.totalValue || 0)}
                sub={`${portfolio?.holdings?.length || 0} holdings`}
                icon={Briefcase}
                accent="#D4AF37"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Total P&L"
                value={formatGHS(portfolioSummary?.totalPnl || 0)}
                sub={`${formatPercentage(portfolioSummary?.totalPnlPercent || 0)} all time`}
                icon={pnlPositive ? TrendingUp : TrendingDown}
                accent={pnlPositive ? '#228B22' : '#DC143C'}
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Listed Stocks"
                value={liveStocks.length || '—'}
                sub="Available equities"
                icon={Activity}
                accent="#D4AF37"
              />
            </StaggerItem>
          </>
        )}
      </StaggerList>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

        {/* Top Movers */}
        <ErrorBoundary inline section="Top Movers">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="african-card p-4 md:p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp size={16} className="text-[#D4AF37]" />
                Top Movers
              </h3>
              <Link
                to="/market"
                className="text-[#D4AF37] hover:text-[#B8860B] text-xs transition-colors flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-1">
              {loadingMarket ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between p-3 animate-pulse">
                    <div className="h-4 bg-[#D4AF37]/8 rounded w-24" />
                    <div className="h-4 bg-[#D4AF37]/8 rounded w-16" />
                  </div>
                ))
              ) : topMovers.length > 0 ? (
                topMovers.map((stock: any) => (
                  <StockRow key={stock.name} stock={stock} href={`/trade/${stock.name}`} />
                ))
              ) : (
                <p className="text-muted-foreground text-sm text-center py-6">
                  Loading market data…
                </p>
              )}
            </div>
          </motion.div>
        </ErrorBoundary>

        {/* Holdings */}
        <ErrorBoundary inline section="Holdings">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="african-card p-4 md:p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Briefcase size={16} className="text-[#D4AF37]" />
                My Holdings
              </h3>
              <Link
                to="/portfolio"
                className="text-[#D4AF37] hover:text-[#B8860B] text-xs transition-colors flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-1">
              {loadingPortfolio ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between p-3 animate-pulse">
                    <div className="h-4 bg-[#D4AF37]/8 rounded w-24" />
                    <div className="h-4 bg-[#D4AF37]/8 rounded w-16" />
                  </div>
                ))
              ) : portfolio?.holdings?.length > 0 ? (
                portfolio.holdings.slice(0, 5).map((h: any) => (
                  <StockRow
                    key={h.symbol}
                    stock={{
                      name: h.symbol,
                      price: h.currentPrice,
                      change: h.pnlPercent,
                      volume: h.quantity,
                    }}
                    href={`/trade/${h.symbol}`}
                  />
                ))
              ) : (
                <div className="text-center py-6 space-y-2">
                  <p className="text-muted-foreground text-sm">No holdings yet</p>
                  <Link
                    to="/market"
                    className="text-[#D4AF37] hover:text-[#B8860B] text-sm transition-colors inline-block"
                  >
                    Browse stocks →
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </ErrorBoundary>
      </div>
    </div>
  );
}

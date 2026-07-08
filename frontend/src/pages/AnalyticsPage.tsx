import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  BarChart3, TrendingUp, TrendingDown, Activity, PieChart,
  DollarSign, Download, RefreshCw, Target, Clock, Award,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { analyticsApi } from '../lib/api';
import { PortfolioAiAnalysis } from '../components/ai/PortfolioAiAnalysis';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FadeUp, StaggerList, StaggerItem } from '../components/ui/PageTransition';
import { StatCardSkeleton } from '../components/ui/PageSkeleton';
import toast from 'react-hot-toast';

type Timeframe = '1W' | '1M' | '3M' | '1Y' | 'ALL';

/* Ghana-flag-inspired chart palette */
const SECTOR_COLORS = [
  'from-[#D4AF37] to-[#B8860B]',
  'from-[#228B22] to-[#006B3F]',
  'from-[#CE1126] to-[#8B0000]',
  'from-[#FCD116] to-[#D4AF37]',
  'from-[#006B3F] to-[#004d2e]',
];
const CHART_COLORS = ['#D4AF37', '#228B22', '#CE1126', '#FCD116', '#006B3F'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="african-card p-3 text-xs shadow-gold-sm">
      <p className="font-semibold text-[#D4AF37] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? `GH₵ ${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');

  const { data: marketMetrics, isLoading: loadingMarket } = useQuery(
    'analytics-market',
    () => analyticsApi.getMarketMetrics().then((r) => r.data),
    { staleTime: 30000, refetchInterval: 60000 },
  );
  const { data: sectors, isLoading: loadingSectors } = useQuery(
    'analytics-sectors',
    () => analyticsApi.getSectors().then((r) => r.data),
    { staleTime: 5 * 60 * 1000 },
  );
  const { data: performance, isLoading: loadingPerf } = useQuery(
    ['analytics-performance', timeframe],
    () => analyticsApi.getPerformance(timeframe).then((r) => r.data),
    { staleTime: 2 * 60 * 1000 },
  );
  const { data: tradingStats, isLoading: loadingStats } = useQuery(
    'analytics-trading-stats',
    () => analyticsApi.getTradingStats().then((r) => r.data),
    { staleTime: 5 * 60 * 1000 },
  );

  const handleExport = async (type: 'portfolio' | 'orders' | 'transactions') => {
    try {
      const res = await analyticsApi.exportData(type);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type} data exported`);
    } catch {
      toast.error('Export failed');
    }
  };

  const summary     = marketMetrics?.summary;
  const perfSummary = performance?.summary;

  return (
    <div className="min-h-screen relative bg-background">
      <div className="container py-8 space-y-6 relative z-10">

        {/* ── Header ── */}
        <FadeUp>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl african-card">
                <BarChart3 size={22} className="text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Analytics</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Advanced market analysis & portfolio insights</p>
              </div>
            </div>
            {/* Export buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(['orders', 'portfolio', 'transactions'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleExport(type)}
                  className="african-card px-3 py-2 text-xs font-semibold flex items-center gap-1.5 hover:scale-105 transition-transform capitalize whitespace-nowrap flex-shrink-0"
                >
                  <Download size={12} className="text-[#D4AF37]" />
                  {type}
                </button>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* ── Market Summary Cards ── */}
        <StaggerList className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {loadingMarket ? (
            [...Array(4)].map((_, i) => <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>)
          ) : (
            [
              { label: 'Total Stocks', value: summary?.totalStocks ?? '—',        icon: BarChart3,    colorClass: 'text-[#D4AF37]' },
              { label: 'Gainers',      value: summary?.gainers ?? '—',            icon: TrendingUp,   colorClass: 'price-up'        },
              { label: 'Losers',       value: summary?.losers ?? '—',             icon: TrendingDown, colorClass: 'price-down'      },
              { label: 'Sentiment',    value: summary?.marketSentiment ?? '—',    icon: Activity,
                colorClass: summary?.marketSentiment === 'bullish' ? 'price-up' : summary?.marketSentiment === 'bearish' ? 'price-down' : 'price-neutral' },
            ].map((item) => (
              <StaggerItem key={item.label}>
                <div className="african-card p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon size={14} className={item.colorClass} />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold truncate">{item.label}</p>
                  </div>
                  <p className={`text-xl md:text-2xl font-bold capitalize font-mono ${item.colorClass}`}>{item.value}</p>
                </div>
              </StaggerItem>
            ))
          )}
        </StaggerList>

        {/* ── Performance Chart + AI Analysis ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <ErrorBoundary inline section="Performance Chart">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="lg:col-span-2 african-card p-4 md:p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#D4AF37]" />
                  Portfolio Performance
                </h3>
                {/* Timeframe selector */}
                <div className="flex gap-1 bg-background border border-border rounded-lg p-1">
                  {(['1W', '1M', '3M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        timeframe === tf
                          ? 'text-[#1a1200] shadow-gold-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-[#D4AF37]/8'
                      }`}
                      style={timeframe === tf ? { background: 'linear-gradient(135deg, #F4D03F, #D4AF37, #B8860B)' } : {}}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {loadingPerf ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw size={24} className="animate-spin text-[#D4AF37]" />
                </div>
              ) : performance?.dataPoints?.length > 0 ? (
                <>
                  <div className="flex gap-6 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Return</p>
                      <p className={`text-lg font-bold font-mono ${(perfSummary?.totalReturn ?? 0) >= 0 ? 'price-up' : 'price-down'}`}>
                        {(perfSummary?.totalReturn ?? 0) >= 0 ? '+' : ''}GH₵ {Math.abs(perfSummary?.totalReturn ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Return %</p>
                      <p className={`text-lg font-bold font-mono ${(perfSummary?.totalReturnPercent ?? 0) >= 0 ? 'price-up' : 'price-down'}`}>
                        {(perfSummary?.totalReturnPercent ?? 0) >= 0 ? '+' : ''}{perfSummary?.totalReturnPercent?.toFixed(2) ?? '0.00'}%
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={performance.dataPoints}>
                      <defs>
                        <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#228B22" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#228B22" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#888' }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="portfolioValue" name="Portfolio" stroke="#D4AF37" strokeWidth={2} fill="url(#perfGrad)" />
                      <Area type="monotone" dataKey="invested"       name="Invested"  stroke="#228B22" strokeWidth={2} strokeDasharray="4 4" fill="url(#invGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <TrendingUp size={40} className="text-[#D4AF37] opacity-30 mb-3" />
                  <p className="text-muted-foreground text-sm">No trade history yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start trading to see your performance chart</p>
                </div>
              )}
            </motion.div>
          </ErrorBoundary>

          {/* AI Portfolio Analysis */}
          <ErrorBoundary inline section="AI Analysis">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
              <PortfolioAiAnalysis />
            </motion.div>
          </ErrorBoundary>
        </div>

        {/* ── Sector Allocation + Monthly Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

          {/* Sector Allocation */}
          <ErrorBoundary inline section="Sector Allocation">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="african-card p-4 md:p-6"
            >
              <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
                <PieChart size={18} className="text-[#D4AF37]" />
                Sector Allocation
              </h3>
              {loadingSectors ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-3 bg-[#D4AF37]/12 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-[#D4AF37]/8 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : sectors?.length > 0 ? (
                <div className="space-y-4">
                  {sectors.slice(0, 6).map((sector: any, i: number) => (
                    <div key={sector.sector}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium truncate max-w-[60%]">{sector.sector}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{sector.stockCount} stocks</span>
                          <span className="text-sm font-bold text-[#D4AF37] font-mono">{sector.allocation}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${SECTOR_COLORS[i % SECTOR_COLORS.length]} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min(sector.allocation, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Sector data loading…</p>
                </div>
              )}
            </motion.div>
          </ErrorBoundary>

          {/* Monthly Activity Chart */}
          <ErrorBoundary inline section="Trading Activity">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="african-card p-4 md:p-6"
            >
              <h3 className="font-bold text-foreground mb-5 flex items-center gap-2">
                <Activity size={18} className="text-[#D4AF37]" />
                Monthly Trading Activity
              </h3>
              {loadingStats ? (
                <div className="h-48 flex items-center justify-center">
                  <RefreshCw size={24} className="animate-spin text-[#D4AF37]" />
                </div>
              ) : tradingStats?.activityByMonth?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tradingStats.activityByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]}>
                      {tradingStats.activityByMonth.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <Activity size={40} className="text-[#D4AF37] opacity-30 mb-3" />
                  <p className="text-muted-foreground text-sm">No trading activity yet</p>
                </div>
              )}
            </motion.div>
          </ErrorBoundary>
        </div>

        {/* ── Trading Stats Row ── */}
        <StaggerList className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Total Orders',  value: tradingStats?.totalOrders ?? '—',                                    icon: Target,    colorClass: 'text-[#D4AF37]' },
            { label: 'Win Rate',      value: tradingStats?.winRate != null ? `${tradingStats.winRate}%` : '—',    icon: Award,     colorClass: 'price-up'        },
            { label: 'Avg Hold Time', value: tradingStats?.avgHoldDays != null ? `${tradingStats.avgHoldDays}d` : '—', icon: Clock, colorClass: 'text-[#D4AF37]' },
            { label: 'Filled Orders', value: tradingStats?.filledOrders ?? '—',                                   icon: TrendingUp, colorClass: 'price-up'       },
          ].map((item) => (
            <StaggerItem key={item.label}>
              <div className="african-card p-4 md:p-5">
                {loadingStats ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-[#D4AF37]/12 rounded w-3/4" />
                    <div className="h-7 bg-[#D4AF37]/8 rounded w-1/2" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon size={14} className={item.colorClass} />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold truncate">{item.label}</p>
                    </div>
                    <p className={`text-xl md:text-2xl font-bold font-mono ${item.colorClass}`}>{item.value}</p>
                  </>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerList>

        {/* ── Top Symbols + Market Movers ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

          {/* Most Traded */}
          <div className="african-card overflow-hidden">
            <div className="p-5 border-b border-border/40 flex items-center gap-2">
              <DollarSign size={16} className="text-[#D4AF37]" />
              <h3 className="font-bold text-foreground">Most Traded (by you)</h3>
            </div>
            <div className="divide-y divide-border/30">
              {loadingStats ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="px-5 py-3 flex justify-between animate-pulse">
                    <div className="h-4 bg-[#D4AF37]/12 rounded w-16" />
                    <div className="h-4 bg-[#D4AF37]/8 rounded w-24" />
                  </div>
                ))
              ) : tradingStats?.topSymbols?.length > 0 ? (
                tradingStats.topSymbols.map((s: any, i: number) => (
                  <div key={s.symbol} className="px-5 py-3 flex items-center justify-between hover:bg-[#D4AF37]/4 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/12 border border-[#D4AF37]/20 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                        {i + 1}
                      </div>
                      <span className="font-bold text-[#D4AF37]">{s.symbol}</span>
                    </div>
                    <span className="text-sm font-mono">GH₵ {s.volume.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-10 text-center text-muted-foreground text-sm">No trading history yet</div>
              )}
            </div>
          </div>

          {/* Market Top Gainers */}
          <div className="african-card overflow-hidden">
            <div className="p-5 border-b border-border/40 flex items-center gap-2">
              <TrendingUp size={16} className="price-up" />
              <h3 className="font-bold text-foreground">Market Top Gainers</h3>
            </div>
            <div className="divide-y divide-border/30">
              {loadingMarket ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="px-5 py-3 flex justify-between animate-pulse">
                    <div className="h-4 bg-[#D4AF37]/12 rounded w-16" />
                    <div className="h-4 bg-[#D4AF37]/8 rounded w-24" />
                  </div>
                ))
              ) : marketMetrics?.topGainers?.length > 0 ? (
                marketMetrics.topGainers.map((s: any, i: number) => (
                  <div key={s.symbol} className="px-5 py-3 flex items-center justify-between hover:bg-[#228B22]/4 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#228B22]/10 border border-[#228B22]/20 flex items-center justify-center text-xs font-bold text-[#228B22]">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{s.symbol}</p>
                        <p className="text-xs text-muted-foreground">Vol: {s.volume?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">GH₵ {s.price}</p>
                      <p className="text-xs price-up">+{s.change}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-10 text-center text-muted-foreground text-sm">Market data loading…</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

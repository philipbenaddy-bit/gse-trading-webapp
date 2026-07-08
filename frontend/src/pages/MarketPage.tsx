import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Activity, BarChart3, AlertCircle, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { PriceTicker } from '../components/shared/PriceTicker';
import { StockCard } from '../components/shared/StockCard';
import { QuickStats } from '../components/trading/QuickStats';
import { Input } from '../components/ui/Input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FadeUp, StaggerList, StaggerItem } from '../components/ui/PageTransition';
import { StatCardSkeleton } from '../components/ui/PageSkeleton';
import { marketApi } from '../lib/api';
import { formatGHS, formatPercentage } from '../utils/currency';
import { formatNumber } from '../lib/utils';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high?: number;
  low?: number;
  marketCap?: number;
}

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await marketApi.getLive();
        const liveData = response.data.data;
        const lastUpdate = response.data.lastUpdated;
        const transformedStocks: Stock[] = liveData.map((stock: any) => {
          const changePercent = stock.price > 0 ? (stock.change / (stock.price - stock.change)) * 100 : 0;
          return { symbol: stock.name, name: stock.name, price: stock.price, change: stock.change, changePercent, volume: stock.volume };
        });
        setStocks(transformedStocks);
        setLastUpdated(lastUpdate ? new Date(lastUpdate) : null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load market data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const marketStats = {
    totalVolume: stocks.reduce((sum, s) => sum + s.volume, 0),
    gainers: stocks.filter((s) => s.change > 0).length,
    losers: stocks.filter((s) => s.change < 0).length,
    unchanged: stocks.filter((s) => s.change === 0).length,
    avgChange: stocks.length > 0 ? stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length : 0,
  };

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'gainers') return matchesSearch && stock.change > 0;
    if (filterTab === 'losers') return matchesSearch && stock.change < 0;
    if (filterTab === 'active') return matchesSearch && stock.volume > 0;
    return matchesSearch;
  });

  const tickerStocks = stocks.slice(0, 8).map((stock) => ({
    symbol: stock.symbol, price: stock.price, change: stock.change, changePercent: stock.changePercent,
  }));

  const quickStats = [
    { label: 'Total Volume', value: formatNumber(marketStats.totalVolume, 0), change: marketStats.avgChange, icon: <Activity className="h-5 w-5" />, trend: marketStats.avgChange > 0 ? 'up' : marketStats.avgChange < 0 ? 'down' : 'neutral' },
    { label: 'Gainers', value: marketStats.gainers, icon: <TrendingUp className="h-5 w-5" />, trend: 'up' },
    { label: 'Losers', value: marketStats.losers, icon: <TrendingDown className="h-5 w-5" />, trend: 'down' },
    { label: 'Listed Stocks', value: stocks.length, icon: <BarChart3 className="h-5 w-5" />, trend: 'neutral' },
  ];

  return (
    <div className="min-h-screen relative bg-background">
      {!loading && stocks.length > 0 && <PriceTicker stocks={tickerStocks} />}

      <div className="container py-6 md:py-8 space-y-6 md:space-y-8 relative z-10 px-4 md:px-auto">

        {/* Header */}
        <FadeUp>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl african-card">
                <Globe size={22} className="text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Market Overview</h1>
                <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
                  Real-time GSE stock prices
                  {lastUpdated && (
                    <span className="ml-2 text-[#D4AF37]">
                      · Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="african-card p-4 border-crimson/40"
          >
            <div className="flex items-center gap-3 text-crimson">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {loading ? (
          <StaggerList className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>
            ))}
          </StaggerList>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <QuickStats stats={quickStats} />
            </motion.div>

            {/* Trending */}
            <ErrorBoundary inline section="Trending Stocks">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="african-card overflow-hidden"
              >
                <div className="p-4 md:p-5 border-b border-border/40 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                  <h2 className="font-bold text-foreground">Trending Stocks</h2>
                </div>
                <div className="p-4 md:p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Most Active */}
                    <div>
                      <h3 className="text-xs font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                        <Activity className="h-4 w-4 text-[#D4AF37]" /> Most Active
                      </h3>
                      <div className="space-y-1.5">
                        {stocks.sort((a, b) => b.volume - a.volume).slice(0, 5).map((stock) => (
                          <div key={stock.symbol} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#D4AF37]/6 transition-colors">
                            <div>
                              <p className="font-bold text-sm text-[#D4AF37]">{stock.symbol}</p>
                              <p className="text-xs text-muted-foreground">{formatNumber(stock.volume, 0)} vol</p>
                            </div>
                            <p className="font-mono text-sm font-semibold">{formatGHS(stock.price)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Top Gainers */}
                    <div>
                      <h3 className="text-xs font-semibold mb-3 flex items-center gap-2 price-up uppercase tracking-wider">
                        <TrendingUp className="h-4 w-4" /> Top Gainers
                      </h3>
                      <div className="space-y-1.5">
                        {stocks.filter((s) => s.change > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5).map((stock) => (
                          <div key={stock.symbol} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#228B22]/6 transition-colors">
                            <div>
                              <p className="font-bold text-sm">{stock.symbol}</p>
                              <p className="text-xs price-up font-semibold">{formatPercentage(stock.changePercent)}</p>
                            </div>
                            <p className="font-mono text-sm font-semibold">{formatGHS(stock.price)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Top Losers */}
                    <div>
                      <h3 className="text-xs font-semibold mb-3 flex items-center gap-2 price-down uppercase tracking-wider">
                        <TrendingDown className="h-4 w-4" /> Top Losers
                      </h3>
                      <div className="space-y-1.5">
                        {stocks.filter((s) => s.change < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5).map((stock) => (
                          <div key={stock.symbol} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#DC143C]/6 transition-colors">
                            <div>
                              <p className="font-bold text-sm">{stock.symbol}</p>
                              <p className="text-xs price-down font-semibold">{formatPercentage(stock.changePercent)}</p>
                            </div>
                            <p className="font-mono text-sm font-semibold">{formatGHS(stock.price)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </ErrorBoundary>

            {/* All Stocks */}
            <ErrorBoundary inline section="All Stocks">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="african-card overflow-hidden"
              >
                <div className="p-4 md:p-5 border-b border-border/40">
                  <h2 className="font-bold text-foreground mb-3">All Stocks</h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search stocks…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-border focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
                      />
                    </div>
                    <div className="overflow-x-auto">
                      <Tabs value={filterTab} onValueChange={setFilterTab}>
                        <TabsList className="bg-background border border-border whitespace-nowrap">
                          <TabsTrigger value="all" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#1a1200]">All</TabsTrigger>
                          <TabsTrigger value="gainers" className="data-[state=active]:bg-[#228B22] data-[state=active]:text-white">
                            <TrendingUp className="h-3.5 w-3.5 mr-1" />Gainers
                          </TabsTrigger>
                          <TabsTrigger value="losers" className="data-[state=active]:bg-[#DC143C] data-[state=active]:text-white">
                            <TrendingDown className="h-3.5 w-3.5 mr-1" />Losers
                          </TabsTrigger>
                          <TabsTrigger value="active" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#1a1200]">
                            <Activity className="h-3.5 w-3.5 mr-1" />Active
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  {filteredStocks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {filteredStocks.map((stock) => (
                        <StockCard key={stock.symbol} {...stock} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search size={36} className="mx-auto mb-3 opacity-20" />
                      <p className="text-muted-foreground text-sm">No stocks found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </ErrorBoundary>
          </>
        )}
      </div>
    </div>
  );
}

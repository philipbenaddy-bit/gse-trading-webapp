import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { PriceChart } from '../components/trading/PriceChart';
import { TradeForm } from '../components/trading/TradeForm';
import { OrderBook } from '../components/trading/OrderBook';
import { RecentTrades } from '../components/trading/RecentTrades';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FadeUp } from '../components/ui/PageTransition';
import { StockInsightCard } from '../components/ai/StockInsightCard';
import { formatGHS } from '../utils/currency';

const mockStockData: Record<string, any> = {
  GCB: {
    symbol: 'GCB', name: 'GCB Bank Limited', price: 4.25, change: 0.15, changePercent: 3.66,
    description: 'GCB Bank Limited is a universal bank providing a wide range of banking and financial services.',
    sector: 'Financial Services', marketCap: 850000000, pe: 12.5, eps: 0.34, dividend: 0.12,
  },
  MTNGH: {
    symbol: 'MTNGH', name: 'MTN Ghana', price: 1.05, change: -0.02, changePercent: -1.87,
    description: 'MTN Ghana is a leading telecommunications company providing mobile voice, data, and digital services.',
    sector: 'Telecommunications', marketCap: 1200000000, pe: 15.2, eps: 0.07, dividend: 0.03,
  },
};

export default function TradePage() {
  const { symbol } = useParams<{ symbol: string }>();
  const stockSymbol = symbol?.toUpperCase() || 'GCB';
  const stock = mockStockData[stockSymbol] || mockStockData.GCB;

  if (!stock) {
    return (
      <div className="container py-8 space-y-4 px-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const isPositive = stock.change >= 0;

  return (
    <div className="container py-6 md:py-8 space-y-5 md:space-y-6 relative px-4 md:px-auto bg-background">

      {/* Stock Header */}
      <FadeUp>
        <div className="african-card p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-gold-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
              >
                <BarChart3 className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-[#D4AF37]">{stock.symbol}</h1>
                  <span className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-xs font-semibold">
                    {stock.sector}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{stock.name}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl md:text-3xl font-bold text-foreground font-mono">{formatGHS(stock.price)}</p>
              <p className={`text-sm font-semibold mt-1 ${isPositive ? 'price-up' : 'price-down'}`}>
                {isPositive ? '+' : ''}{formatGHS(stock.change, { showSymbol: false })} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-4 leading-relaxed hidden md:block">{stock.description}</p>
        </div>
      </FadeUp>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Chart column */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <ErrorBoundary inline section="Price Chart">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
              <PriceChart
                symbol={stock.symbol}
                currentPrice={stock.price}
                change={stock.change}
                changePercent={stock.changePercent}
              />
            </motion.div>
          </ErrorBoundary>

          {/* Stock Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="african-card p-4 md:p-6"
          >
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gradient-gold" />
              Stock Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Market Cap', value: `${formatGHS(stock.marketCap / 1000000, { decimals: 1 })}M` },
                { label: 'P/E Ratio', value: stock.pe },
                { label: 'EPS', value: formatGHS(stock.eps) },
                { label: 'Dividend', value: formatGHS(stock.dividend) },
              ].map((item) => (
                <div key={item.label} className="bg-background border border-border/60 rounded-xl p-3 md:p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">{item.label}</p>
                  <p className="font-bold text-[#D4AF37] font-mono text-sm md:text-base">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trade form + AI insight */}
        <div className="space-y-4 md:space-y-6">
          <ErrorBoundary inline section="Trade Form">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
              <TradeForm symbol={stock.symbol} currentPrice={stock.price} availableBalance={10000} />
            </motion.div>
          </ErrorBoundary>

          <ErrorBoundary inline section="AI Insight">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
              <StockInsightCard symbol={stock.symbol} />
            </motion.div>
          </ErrorBoundary>
        </div>
      </div>

      {/* Order Book + Recent Trades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <ErrorBoundary inline section="Order Book">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
            <OrderBook symbol={stock.symbol} />
          </motion.div>
        </ErrorBoundary>
        <ErrorBoundary inline section="Recent Trades">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
            <RecentTrades symbol={stock.symbol} />
          </motion.div>
        </ErrorBoundary>
      </div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="african-card p-4 md:p-6"
      >
        <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-gold" />
          About {stock.name}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{stock.description}</p>
        <h4 className="text-xs font-semibold text-[#D4AF37] mb-3 uppercase tracking-wider">Trading Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {[
            { label: 'Sector', value: stock.sector },
            { label: 'Market Cap', value: `${formatGHS(stock.marketCap / 1000000, { decimals: 1 })}M` },
            { label: 'P/E Ratio', value: stock.pe },
            { label: 'EPS', value: formatGHS(stock.eps) },
            { label: 'Dividend Per Share', value: formatGHS(stock.dividend) },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

import { PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { PortfolioOverview } from '../components/portfolio/PortfolioOverview';
import { HoldingsTable } from '../components/portfolio/HoldingsTable';
import { PerformanceChart } from '../components/portfolio/PerformanceChart';
import { PortfolioAiAnalysis } from '../components/ai/PortfolioAiAnalysis';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FadeUp } from '../components/ui/PageTransition';

const mockPortfolioData = {
  totalValue: 125430.50,
  totalInvested: 100000.00,
  totalGainLoss: 25430.50,
  totalGainLossPercent: 25.43,
  dayChange: 1250.75,
  dayChangePercent: 1.01,
};

const mockHoldings = [
  { symbol: 'GCB',   name: 'GCB Bank Limited',             quantity: 500,  avgPrice: 4.50,  currentPrice: 5.20,  totalValue: 2600.00, gainLoss: 350.00,  gainLossPercent: 15.56, allocation: 12.5 },
  { symbol: 'MTNGH', name: 'MTN Ghana',                     quantity: 1000, avgPrice: 0.85,  currentPrice: 1.05,  totalValue: 1050.00, gainLoss: 200.00,  gainLossPercent: 23.53, allocation: 8.2  },
  { symbol: 'TOTAL', name: 'TotalEnergies Marketing Ghana', quantity: 300,  avgPrice: 12.00, currentPrice: 11.50, totalValue: 3450.00, gainLoss: -150.00, gainLossPercent: -4.17, allocation: 15.3 },
  { symbol: 'CAL',   name: 'CAL Bank Limited',              quantity: 800,  avgPrice: 0.95,  currentPrice: 1.15,  totalValue: 920.00,  gainLoss: 160.00,  gainLossPercent: 21.05, allocation: 7.8  },
  { symbol: 'EGH',   name: 'Enterprise Group Limited',      quantity: 600,  avgPrice: 3.20,  currentPrice: 3.80,  totalValue: 2280.00, gainLoss: 360.00,  gainLossPercent: 18.75, allocation: 10.5 },
];

const mockPerformanceData = [
  { date: 'Jan 1',  portfolioValue: 100000, invested: 100000 },
  { date: 'Jan 8',  portfolioValue: 102500, invested: 100000 },
  { date: 'Jan 15', portfolioValue: 105200, invested: 100000 },
  { date: 'Jan 22', portfolioValue: 103800, invested: 100000 },
  { date: 'Jan 29', portfolioValue: 108500, invested: 100000 },
  { date: 'Feb 5',  portfolioValue: 112300, invested: 100000 },
  { date: 'Feb 12', portfolioValue: 115800, invested: 100000 },
  { date: 'Feb 19', portfolioValue: 118200, invested: 100000 },
  { date: 'Feb 26', portfolioValue: 121500, invested: 100000 },
  { date: 'Mar 5',  portfolioValue: 125430, invested: 100000 },
];

export default function PortfolioPage() {
  return (
    <div className="space-y-5 md:space-y-6 relative px-4 md:px-0 bg-background">

      {/* Header */}
      <FadeUp>
        <div className="flex items-center gap-3 pb-4 border-b border-border/40">
          <div className="p-2.5 rounded-xl african-card">
            <PieChart size={22} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Portfolio</h1>
            <p className="text-sm text-muted-foreground">Track your investments and performance</p>
          </div>
        </div>
      </FadeUp>

      {/* Overview */}
      <ErrorBoundary inline section="Portfolio Overview">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <PortfolioOverview
            totalValue={mockPortfolioData.totalValue}
            totalInvested={mockPortfolioData.totalInvested}
            totalGainLoss={mockPortfolioData.totalGainLoss}
            totalGainLossPercent={mockPortfolioData.totalGainLossPercent}
            dayChange={mockPortfolioData.dayChange}
            dayChangePercent={mockPortfolioData.dayChangePercent}
          />
        </motion.div>
      </ErrorBoundary>

      {/* Performance chart */}
      <ErrorBoundary inline section="Performance Chart">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <PerformanceChart data={mockPerformanceData} />
        </motion.div>
      </ErrorBoundary>

      {/* Holdings + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <ErrorBoundary inline section="Holdings">
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
            <HoldingsTable holdings={mockHoldings} />
          </motion.div>
        </ErrorBoundary>
        <ErrorBoundary inline section="AI Analysis">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
            <PortfolioAiAnalysis />
          </motion.div>
        </ErrorBoundary>
      </div>
    </div>
  );
}

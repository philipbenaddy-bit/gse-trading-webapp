import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatGHS, formatPercentage, getValueColorClass, getMarketStatus } from '../../utils/currency';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function StockTicker() {
  const [stocks, setStocks] = useState<Stock[]>([
    { symbol: 'MTN', name: 'MTN Ghana', price: 0.95, change: 0.02, changePercent: 2.15 },
    { symbol: 'GCB', name: 'GCB Bank', price: 5.20, change: -0.10, changePercent: -1.89 },
    { symbol: 'SCB', name: 'Standard Chartered', price: 18.50, change: 0.50, changePercent: 2.78 },
    { symbol: 'GOIL', name: 'GOIL Company', price: 2.15, change: 0.05, changePercent: 2.38 },
    { symbol: 'CAL', name: 'CAL Bank', price: 0.85, change: -0.02, changePercent: -2.30 },
    { symbol: 'EBG', name: 'Ecobank Ghana', price: 6.80, change: 0.15, changePercent: 2.26 },
    { symbol: 'TOTAL', name: 'Total Petroleum', price: 3.45, change: 0.08, changePercent: 2.37 },
    { symbol: 'FML', name: 'Fan Milk Limited', price: 4.90, change: -0.05, changePercent: -1.01 },
    { symbol: 'SOGEGH', name: 'SG-SSB', price: 1.25, change: 0.03, changePercent: 2.46 },
    { symbol: 'CLYD', name: 'Clydestone', price: 0.42, change: 0.01, changePercent: 2.44 },
    { symbol: 'AGA', name: 'AngloGold Ashanti', price: 85.50, change: 1.20, changePercent: 1.42 },
    { symbol: 'UNIL', name: 'Unilever Ghana', price: 12.30, change: -0.20, changePercent: -1.60 },
  ]);

  const marketStatus = getMarketStatus();

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) =>
        prevStocks.map((stock) => {
          const randomChange = (Math.random() - 0.5) * 0.1;
          const newPrice = Math.max(0.01, stock.price + randomChange);
          const change = newPrice - stock.price;
          const changePercent = (change / stock.price) * 100;

          return {
            ...stock,
            price: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const duplicatedStocks = [...stocks, ...stocks, ...stocks];

  return (
    <div className="relative">
      <div className="ghana-flag-accent" />
      
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-black dark:via-gray-900 dark:to-black border-b border-gray-700 dark:border-gray-800 px-4 py-1">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">GSE Live Prices</span>
            <span className="text-gray-600">|</span>
            <span className={marketStatus.isOpen ? 'market-open' : 'market-closed'}>
              {marketStatus.isOpen ? '🟢' : '🔴'} {marketStatus.message}
            </span>
            {marketStatus.nextOpen && (
              <>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">Opens: {marketStatus.nextOpen}</span>
              </>
            )}
          </div>
          <div className="text-gray-400">Trading Hours: 10:00 AM - 3:00 PM GMT</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-black dark:via-gray-900 dark:to-black border-b border-gray-700 dark:border-gray-800 overflow-hidden">
        <div className="relative h-12 flex items-center">
          <div 
            className="flex"
            style={{ animation: 'scroll-left 60s linear infinite' }}
            onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
            onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
          >
            {duplicatedStocks.map((stock, index) => (
              <div
                key={`${stock.symbol}-${index}`}
                className="flex items-center gap-3 px-6 py-2 whitespace-nowrap border-r border-gray-700 dark:border-gray-800 hover:bg-gray-800/50 dark:hover:bg-gray-800/80 transition-colors cursor-pointer group"
              >
                <span className="font-bold text-white text-sm group-hover:text-[#D4AF37] transition-colors">
                  {stock.symbol}
                </span>

                <span className="text-gray-300 text-sm font-medium currency-ghs">
                  {formatGHS(stock.price)}
                </span>

                <div className={`flex items-center gap-1 text-xs font-semibold ${getValueColorClass(stock.change)}`}>
                  {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{formatPercentage(stock.changePercent)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent dark:from-black dark:via-black/80 pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-900 via-gray-900/80 to-transparent dark:from-black dark:via-black/80 pointer-events-none z-10" />
        </div>

        <style>{`
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.333%); }
          }
        `}</style>
      </div>
    </div>
  );
}

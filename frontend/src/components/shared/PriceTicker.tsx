import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatCurrency, formatPercentage } from '../../lib/utils';

interface Stock {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface PriceTickerProps {
  stocks?: Stock[];
}

export function PriceTicker({ stocks = [] }: PriceTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (stocks.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stocks.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [stocks.length]);

  if (stocks.length === 0) {
    return (
      <div className="bg-muted/50 border-b">
        <div className="container py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
            <span>Loading market data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 border-b overflow-hidden">
      <div className="container py-2">
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
          {stocks.map((stock, index) => (
            <div
              key={stock.symbol}
              className={cn(
                'flex items-center gap-3 min-w-fit transition-opacity duration-300',
                index === currentIndex ? 'opacity-100' : 'opacity-60'
              )}
            >
              <span className="font-semibold text-sm">{stock.symbol}</span>
              <span className="font-mono text-sm">{formatCurrency(stock.price)}</span>
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  stock.change >= 0 ? 'text-accent' : 'text-destructive'
                )}
              >
                {stock.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{formatPercentage(stock.changePercent)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

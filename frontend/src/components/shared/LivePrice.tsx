import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useLivePrice } from '../../hooks/useLivePrice';
import { cn, formatCurrency, formatPercentage } from '../../lib/utils';

interface LivePriceProps {
  symbol: string;
  showChange?: boolean;
  showVolume?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LivePrice({
  symbol,
  showChange = true,
  showVolume = false,
  size = 'md',
  className,
}: LivePriceProps) {
  const { price, change, volume, isConnected } = useLivePrice(symbol);
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);

  // Animate price changes
  useEffect(() => {
    if (price !== null && prevPrice !== null && price !== prevPrice) {
      setPriceAnimation(price > prevPrice ? 'up' : 'down');
      
      // Clear animation after 1 second
      const timer = setTimeout(() => setPriceAnimation(null), 1000);
      return () => clearTimeout(timer);
    }
    
    if (price !== null) {
      setPrevPrice(price);
    }
  }, [price, prevPrice]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const isPositive = change !== null && change >= 0;
  const isNegative = change !== null && change < 0;

  if (price === null) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        {showChange && <div className="h-4 w-16 bg-muted animate-pulse rounded" />}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Connection Status Indicator */}
      {!isConnected && (
        <div className="h-2 w-2 rounded-full bg-muted-foreground/50" title="Disconnected" />
      )}
      {isConnected && (
        <div className="h-2 w-2 rounded-full bg-accent animate-pulse" title="Live" />
      )}

      {/* Price with Animation */}
      <span
        className={cn(
          'font-mono font-semibold transition-colors duration-300',
          sizeClasses[size],
          priceAnimation === 'up' && 'text-accent',
          priceAnimation === 'down' && 'text-destructive',
          !priceAnimation && 'text-foreground'
        )}
      >
        {formatCurrency(price)}
      </span>

      {/* Change */}
      {showChange && change !== null && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            isPositive && 'text-accent',
            isNegative && 'text-destructive',
            change === 0 && 'text-muted-foreground'
          )}
        >
          {isPositive && <TrendingUp className="h-3 w-3" />}
          {isNegative && <TrendingDown className="h-3 w-3" />}
          {change === 0 && <Minus className="h-3 w-3" />}
          <span>{formatPercentage(change)}</span>
        </div>
      )}

      {/* Volume */}
      {showVolume && volume !== null && (
        <span className="text-xs text-muted-foreground">
          Vol: {volume.toLocaleString()}
        </span>
      )}
    </div>
  );
}

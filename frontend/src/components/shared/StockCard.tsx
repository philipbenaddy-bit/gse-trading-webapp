import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn, formatCurrency, formatPercentage, formatNumber } from '../../lib/utils';

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high?: number;
  low?: number;
  marketCap?: number;
}

export function StockCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  volume,
  high,
  low,
  marketCap,
}: StockCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{symbol}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{name}</p>
          </div>
          <Badge variant={isPositive ? 'success' : 'destructive'}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {formatPercentage(changePercent)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Price */}
          <div>
            <div className={cn('text-3xl font-bold font-mono', isPositive ? 'text-accent' : 'text-destructive')}>
              {formatCurrency(price)}
            </div>
            <div className={cn('text-sm font-medium', isPositive ? 'text-accent' : 'text-destructive')}>
              {isPositive ? '+' : ''}{formatCurrency(change)}
            </div>
          </div>

          {/* Stats */}
          {(volume || high || low || marketCap) && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              {volume && (
                <div>
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className="text-sm font-semibold">{formatNumber(volume, 0)}</p>
                </div>
              )}
              {high && (
                <div>
                  <p className="text-xs text-muted-foreground">High</p>
                  <p className="text-sm font-semibold font-mono">{formatCurrency(high)}</p>
                </div>
              )}
              {low && (
                <div>
                  <p className="text-xs text-muted-foreground">Low</p>
                  <p className="text-sm font-semibold font-mono">{formatCurrency(low)}</p>
                </div>
              )}
              {marketCap && (
                <div>
                  <p className="text-xs text-muted-foreground">Market Cap</p>
                  <p className="text-sm font-semibold">{formatNumber(marketCap, 0)}</p>
                </div>
              )}
            </div>
          )}

          {/* Action */}
          <Link to={`/trade/${symbol}`} className="block">
            <Button className="w-full" variant="outline">
              Trade
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

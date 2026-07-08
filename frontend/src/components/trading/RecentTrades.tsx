import { Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, formatNumber, formatRelativeTime, cn } from '../../lib/utils';

interface RecentTradesProps {
  symbol: string;
}

// Mock recent trades
const mockTrades = [
  { price: 4.25, quantity: 150, time: new Date(Date.now() - 30000), side: 'buy' },
  { price: 4.24, quantity: 230, time: new Date(Date.now() - 120000), side: 'sell' },
  { price: 4.26, quantity: 180, time: new Date(Date.now() - 180000), side: 'buy' },
  { price: 4.23, quantity: 320, time: new Date(Date.now() - 240000), side: 'sell' },
  { price: 4.25, quantity: 210, time: new Date(Date.now() - 300000), side: 'buy' },
  { price: 4.24, quantity: 190, time: new Date(Date.now() - 360000), side: 'buy' },
  { price: 4.22, quantity: 280, time: new Date(Date.now() - 420000), side: 'sell' },
  { price: 4.23, quantity: 160, time: new Date(Date.now() - 480000), side: 'buy' },
];

export function RecentTrades({ symbol }: RecentTradesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium">
            <div>Price (GHS)</div>
            <div className="text-right">Quantity</div>
            <div className="text-right">Time</div>
          </div>

          {/* Trades List */}
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {mockTrades.map((trade, index) => (
              <div
                key={index}
                className="grid grid-cols-3 text-sm py-2 rounded hover:bg-muted/50 transition-colors"
              >
                <div
                  className={cn(
                    'font-mono font-semibold',
                    trade.side === 'buy' ? 'text-accent' : 'text-destructive'
                  )}
                >
                  {formatCurrency(trade.price)}
                </div>
                <div className="text-right font-mono">
                  {formatNumber(trade.quantity, 0)}
                </div>
                <div className="text-right text-muted-foreground text-xs flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(trade.time)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Total Volume</p>
                <p className="font-mono font-semibold">
                  {formatNumber(
                    mockTrades.reduce((sum, t) => sum + t.quantity, 0),
                    0
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Avg Price</p>
                <p className="font-mono font-semibold">
                  {formatCurrency(
                    mockTrades.reduce((sum, t) => sum + t.price, 0) / mockTrades.length
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

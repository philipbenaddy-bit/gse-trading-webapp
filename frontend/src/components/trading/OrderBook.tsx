import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, formatNumber, cn } from '../../lib/utils';

interface OrderBookProps {
  symbol: string;
}

// Mock order book data
const mockBids = [
  { price: 4.24, quantity: 1500, total: 6360 },
  { price: 4.23, quantity: 2300, total: 9729 },
  { price: 4.22, quantity: 1800, total: 7596 },
  { price: 4.21, quantity: 3200, total: 13472 },
  { price: 4.20, quantity: 2100, total: 8820 },
];

const mockAsks = [
  { price: 4.26, quantity: 1200, total: 5112 },
  { price: 4.27, quantity: 1900, total: 8113 },
  { price: 4.28, quantity: 2500, total: 10700 },
  { price: 4.29, quantity: 1600, total: 6864 },
  { price: 4.30, quantity: 2800, total: 12040 },
];

export function OrderBook({ symbol }: OrderBookProps) {
  const maxBidTotal = Math.max(...mockBids.map((b) => b.total));
  const maxAskTotal = Math.max(...mockAsks.map((a) => a.total));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Book</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium">
            <div>Price (GHS)</div>
            <div className="text-right">Quantity</div>
            <div className="text-right">Total (GHS)</div>
          </div>

          {/* Asks (Sell Orders) */}
          <div className="space-y-1">
            {[...mockAsks].reverse().map((ask, index) => (
              <div
                key={index}
                className="relative grid grid-cols-3 text-sm py-1 rounded"
              >
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 right-0 bg-destructive/10 rounded"
                  style={{ width: `${(ask.total / maxAskTotal) * 100}%` }}
                />
                {/* Content */}
                <div className="relative font-mono text-destructive font-semibold">
                  {formatCurrency(ask.price)}
                </div>
                <div className="relative text-right font-mono">
                  {formatNumber(ask.quantity, 0)}
                </div>
                <div className="relative text-right font-mono text-muted-foreground">
                  {formatNumber(ask.total, 0)}
                </div>
              </div>
            ))}
          </div>

          {/* Spread */}
          <div className="py-2 border-y">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Spread</span>
              <span className="font-mono font-semibold">
                {formatCurrency(mockAsks[0].price - mockBids[0].price)}
              </span>
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div className="space-y-1">
            {mockBids.map((bid, index) => (
              <div
                key={index}
                className="relative grid grid-cols-3 text-sm py-1 rounded"
              >
                {/* Background bar */}
                <div
                  className="absolute inset-y-0 right-0 bg-accent/10 rounded"
                  style={{ width: `${(bid.total / maxBidTotal) * 100}%` }}
                />
                {/* Content */}
                <div className="relative font-mono text-accent font-semibold">
                  {formatCurrency(bid.price)}
                </div>
                <div className="relative text-right font-mono">
                  {formatNumber(bid.quantity, 0)}
                </div>
                <div className="relative text-right font-mono text-muted-foreground">
                  {formatNumber(bid.total, 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

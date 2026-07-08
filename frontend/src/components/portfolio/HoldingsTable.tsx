import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn, formatCurrency, formatPercentage, formatNumber } from '../../lib/utils';

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  allocation: number;
}

interface HoldingsTableProps {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Stock
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Quantity
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Avg Price
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Current Price
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Total Value
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Gain/Loss
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Allocation
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => {
                const isPositive = holding.gainLoss >= 0;
                return (
                  <tr key={holding.symbol} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold">{holding.symbol}</p>
                        <p className="text-sm text-muted-foreground">{holding.name}</p>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4 font-mono">
                      {formatNumber(holding.quantity, 0)}
                    </td>
                    <td className="text-right py-4 px-4 font-mono">
                      {formatCurrency(holding.avgPrice)}
                    </td>
                    <td className="text-right py-4 px-4 font-mono font-semibold">
                      {formatCurrency(holding.currentPrice)}
                    </td>
                    <td className="text-right py-4 px-4 font-mono font-semibold">
                      {formatCurrency(holding.totalValue)}
                    </td>
                    <td className="text-right py-4 px-4">
                      <div className={cn('font-mono font-semibold', isPositive ? 'text-accent' : 'text-destructive')}>
                        {isPositive ? '+' : ''}{formatCurrency(holding.gainLoss)}
                      </div>
                      <div className={cn('text-xs font-medium', isPositive ? 'text-accent' : 'text-destructive')}>
                        {formatPercentage(holding.gainLossPercent)}
                      </div>
                    </td>
                    <td className="text-right py-4 px-4">
                      <Badge variant="outline">{holding.allocation.toFixed(1)}%</Badge>
                    </td>
                    <td className="text-right py-4 px-4">
                      <Link to={`/trade/${holding.symbol}`}>
                        <Button size="sm" variant="ghost">
                          Trade
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {holdings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No holdings yet. Start trading to build your portfolio!</p>
              <Link to="/market">
                <Button className="mt-4">Browse Market</Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

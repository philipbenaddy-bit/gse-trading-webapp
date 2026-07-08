import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn, formatCurrency, formatPercentage } from '../../lib/utils';

interface PortfolioOverviewProps {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export function PortfolioOverview({
  totalValue,
  totalInvested,
  totalGainLoss,
  totalGainLossPercent,
  dayChange,
  dayChangePercent,
}: PortfolioOverviewProps) {
  const isPositive = totalGainLoss >= 0;
  const isDayPositive = dayChange >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Value */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold font-mono">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Invested: {formatCurrency(totalInvested)}
          </p>
        </CardContent>
      </Card>

      {/* Total Gain/Loss */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isPositive ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
              )}
            >
              {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </div>
          <p className={cn('text-3xl font-bold font-mono', isPositive ? 'text-accent' : 'text-destructive')}>
            {isPositive ? '+' : ''}{formatCurrency(totalGainLoss)}
          </p>
          <p className={cn('text-xs font-medium mt-1', isPositive ? 'text-accent' : 'text-destructive')}>
            {formatPercentage(totalGainLossPercent)}
          </p>
        </CardContent>
      </Card>

      {/* Day Change */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Today's Change</p>
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isDayPositive ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
              )}
            >
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className={cn('text-3xl font-bold font-mono', isDayPositive ? 'text-accent' : 'text-destructive')}>
            {isDayPositive ? '+' : ''}{formatCurrency(dayChange)}
          </p>
          <p className={cn('text-xs font-medium mt-1', isDayPositive ? 'text-accent' : 'text-destructive')}>
            {formatPercentage(dayChangePercent)}
          </p>
        </CardContent>
      </Card>

      {/* Diversity Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Diversity Score</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">8.5/10</p>
          <p className="text-xs text-muted-foreground mt-1">Well diversified</p>
        </CardContent>
      </Card>
    </div>
  );
}

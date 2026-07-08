import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { cn, formatCurrency, formatNumber } from '../../lib/utils';

interface Stat {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

interface QuickStatsProps {
  stats?: Stat[];
}

const defaultStats: Stat[] = [
  {
    label: 'Market Cap',
    value: '₵2.4B',
    change: 2.5,
    icon: <DollarSign className="h-5 w-5" />,
    trend: 'up',
  },
  {
    label: 'Volume',
    value: '1.2M',
    change: -1.2,
    icon: <Activity className="h-5 w-5" />,
    trend: 'down',
  },
  {
    label: 'Gainers',
    value: 24,
    icon: <TrendingUp className="h-5 w-5" />,
    trend: 'up',
  },
  {
    label: 'Losers',
    value: 18,
    icon: <TrendingDown className="h-5 w-5" />,
    trend: 'down',
  },
];

export function QuickStats({ stats = defaultStats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold font-mono">{stat.value}</p>
                {stat.change !== undefined && (
                  <p
                    className={cn(
                      'text-xs font-medium mt-1',
                      stat.trend === 'up' && 'text-accent',
                      stat.trend === 'down' && 'text-destructive',
                      stat.trend === 'neutral' && 'text-muted-foreground'
                    )}
                  >
                    {stat.change > 0 ? '+' : ''}
                    {stat.change}%
                  </p>
                )}
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-lg',
                  stat.trend === 'up' && 'bg-accent/10 text-accent',
                  stat.trend === 'down' && 'bg-destructive/10 text-destructive',
                  stat.trend === 'neutral' && 'bg-muted text-muted-foreground'
                )}
              >
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

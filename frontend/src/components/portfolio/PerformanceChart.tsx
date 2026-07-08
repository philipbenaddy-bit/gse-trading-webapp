import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PerformanceChartProps {
  data: Array<{
    date: string;
    portfolioValue: number;
    invested: number;
  }>;
}

type TimeFrame = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type ChartType = 'line' | 'area';

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M');
  const [chartType, setChartType] = useState<ChartType>('area');

  const timeFrames: TimeFrame[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

  // Filter data based on timeframe (mock implementation)
  const filteredData = data;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-1">{payload[0].payload.date}</p>
          <p className="text-sm font-semibold text-accent">
            Portfolio: GHS {payload[0].value.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm font-semibold text-muted-foreground">
            Invested: GHS {payload[1].value.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>Portfolio Performance</CardTitle>
          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={chartType === 'line' ? 'default' : 'ghost'}
                onClick={() => setChartType('line')}
                className="h-8 px-3"
              >
                Line
              </Button>
              <Button
                size="sm"
                variant={chartType === 'area' ? 'default' : 'ghost'}
                onClick={() => setChartType('area')}
                className="h-8 px-3"
              >
                Area
              </Button>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {timeFrames.map((tf) => (
                <Button
                  key={tf}
                  size="sm"
                  variant={timeFrame === tf ? 'default' : 'ghost'}
                  onClick={() => setTimeFrame(tf)}
                  className="h-8 px-3"
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `GHS ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="portfolioValue"
                  name="Portfolio Value"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="invested"
                  name="Total Invested"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#investedGradient)"
                />
              </AreaChart>
            ) : (
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `GHS ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-sm text-foreground">{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="portfolioValue"
                  name="Portfolio Value"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="invested"
                  name="Total Invested"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* AI-Generated Insight */}
        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-500 flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h-2a5 5 0 0 0-5-5h-1v1.27c.6.34 1 .99 1 1.73a2 2 0 1 1-4 0c0-.74.4-1.39 1-1.73V9h-1a5 5 0 0 0-5 5H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-500 mb-1">AI Insight</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your portfolio has shown consistent growth over the past month with a 12.5% return. 
                The diversification across 8 stocks is helping reduce volatility. Consider rebalancing 
                your holdings in the banking sector which currently represents 35% of your portfolio.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

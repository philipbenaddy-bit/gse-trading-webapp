import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, BarChart3, CandlestickChart } from 'lucide-react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineData, CandlestickData } from 'lightweight-charts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { cn, formatCurrency, formatPercentage, formatNumber } from '../../lib/utils';
import { useLivePrice } from '../../hooks/useLivePrice';

interface PriceChartProps {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

type TimeFrame = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
type ChartType = 'line' | 'candlestick';

// Mock chart data - will be replaced with real data
const generateMockLineData = (timeframe: TimeFrame, basePrice: number): LineData[] => {
  const points = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : timeframe === '1Y' ? 365 : 730;
  const now = Math.floor(Date.now() / 1000);
  const interval = timeframe === '1D' ? 3600 : timeframe === '1W' ? 86400 : 86400;
  
  return Array.from({ length: points }, (_, i) => ({
    time: (now - (points - i) * interval) as any,
    value: basePrice + (Math.random() - 0.5) * (basePrice * 0.1),
  }));
};

const generateMockCandlestickData = (timeframe: TimeFrame, basePrice: number): CandlestickData[] => {
  const points = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : timeframe === '1Y' ? 365 : 730;
  const now = Math.floor(Date.now() / 1000);
  const interval = timeframe === '1D' ? 3600 : timeframe === '1W' ? 86400 : 86400;
  
  return Array.from({ length: points }, (_, i) => {
    const open = basePrice + (Math.random() - 0.5) * (basePrice * 0.05);
    const close = open + (Math.random() - 0.5) * (basePrice * 0.03);
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.02);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.02);
    
    return {
      time: (now - (points - i) * interval) as any,
      open,
      high,
      low,
      close,
    };
  });
};

export function PriceChart({ symbol, currentPrice: initialPrice, change: initialChange, changePercent: initialChangePercent }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('1D');
  const [chartType, setChartType] = useState<ChartType>('line');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | ISeriesApi<'Candlestick'> | null>(null);
  
  // Use live price updates
  const { price: livePrice, change: liveChange } = useLivePrice(symbol);
  
  // Use live price if available, otherwise use initial props
  const currentPrice = livePrice ?? initialPrice;
  const change = liveChange ?? initialChange;
  const changePercent = change !== null ? (change / (currentPrice - change)) * 100 : initialChangePercent;
  const isPositive = change >= 0;

  // Calculate stats from mock data
  const [stats, setStats] = useState({
    open: currentPrice - change,
    high: currentPrice + 0.15,
    low: currentPrice - 0.20,
    volume: 125000,
  });

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: 'rgba(156, 163, 175, 0.1)' },
          horzLines: { color: 'rgba(156, 163, 175, 0.1)' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: 'rgba(156, 163, 175, 0.2)',
        },
        rightPriceScale: {
          borderColor: 'rgba(156, 163, 175, 0.2)',
        },
        crosshair: {
          mode: 1,
        },
      });

      chartRef.current = chart;

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        seriesRef.current = null;
        chart.remove();
        chartRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize chart:', error);
    }
  }, []);

  // Update chart data when timeframe or chart type changes
  useEffect(() => {
    if (!chartRef.current) return;

    try {
      // Remove old series safely — guard against already-removed series
      if (seriesRef.current) {
        try {
          chartRef.current.removeSeries(seriesRef.current as any);
        } catch {
          // series was already removed (e.g. StrictMode double-invoke)
        }
        seriesRef.current = null;
      }

      // Create new series based on chart type
      if (chartType === 'line') {
        const lineSeries = chartRef.current.addLineSeries({
          color: isPositive ? '#10b981' : '#ef4444',
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          lastValueVisible: true,
          priceLineVisible: true,
        });

        const data = generateMockLineData(timeframe, currentPrice);
        lineSeries.setData(data);
        seriesRef.current = lineSeries;

        // Calculate stats
        const values = data.map(d => d.value);
        setStats({
          open: values[0],
          high: Math.max(...values),
          low: Math.min(...values),
          volume: 125000 + Math.floor(Math.random() * 50000),
        });
      } else {
        const candlestickSeries = chartRef.current.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderUpColor: '#10b981',
          borderDownColor: '#ef4444',
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });

        const data = generateMockCandlestickData(timeframe, currentPrice);
        candlestickSeries.setData(data);
        seriesRef.current = candlestickSeries;

        // Calculate stats
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);
        setStats({
          open: data[0].open,
          high: Math.max(...highs),
          low: Math.min(...lows),
          volume: 125000 + Math.floor(Math.random() * 50000),
        });
      }

      // Fit content
      chartRef.current.timeScale().fitContent();
    } catch (error) {
      console.error('Failed to update chart data:', error);
    }
  }, [timeframe, chartType, currentPrice, isPositive]);

  // Update live price on chart
  useEffect(() => {
    if (!seriesRef.current || !livePrice) return;

    try {
      const now = Math.floor(Date.now() / 1000);
      
      if (chartType === 'line') {
        (seriesRef.current as ISeriesApi<'Line'>).update({
          time: now as any,
          value: livePrice,
        });
      }
    } catch (error) {
      console.error('Failed to update live price:', error);
    }
  }, [livePrice, chartType]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl">{symbol}</CardTitle>
            <div className="flex items-baseline gap-3 mt-2">
              <span className={cn('text-3xl font-bold font-mono', isPositive ? 'text-accent' : 'text-destructive')}>
                {formatCurrency(currentPrice)}
              </span>
              <span className={cn('text-sm font-medium', isPositive ? 'text-accent' : 'text-destructive')}>
                {isPositive ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                {formatPercentage(changePercent)} ({isPositive ? '+' : ''}{formatCurrency(change)})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="h-8 px-3"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'candlestick' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('candlestick')}
                className="h-8 px-3"
              >
                <CandlestickChart className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Timeframe Selector */}
            <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as TimeFrame)}>
              <TabsList>
                <TabsTrigger value="1D">1D</TabsTrigger>
                <TabsTrigger value="1W">1W</TabsTrigger>
                <TabsTrigger value="1M">1M</TabsTrigger>
                <TabsTrigger value="3M">3M</TabsTrigger>
                <TabsTrigger value="1Y">1Y</TabsTrigger>
                <TabsTrigger value="ALL">ALL</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Container */}
        <div ref={chartContainerRef} className="w-full" />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Open</p>
            <p className="font-mono font-semibold">{formatCurrency(stats.open)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">High</p>
            <p className="font-mono font-semibold text-accent">{formatCurrency(stats.high)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Low</p>
            <p className="font-mono font-semibold text-destructive">{formatCurrency(stats.low)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Volume</p>
            <p className="font-semibold">{formatNumber(stats.volume, 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

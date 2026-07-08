import { useQuery } from 'react-query';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { aiApi } from '../../lib/api';

interface StockInsightCardProps {
  symbol: string;
}

export function StockInsightCard({ symbol }: StockInsightCardProps) {
  const { data, isLoading, isError } = useQuery(
    ['ai-insight', symbol],
    () => aiApi.getInsight(symbol).then((r) => r.data),
    { staleTime: 5 * 60 * 1000, retry: 1 },
  );

  if (isLoading) {
    return (
      <div className="african-card p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-[#D4AF37]/15" />
          <div className="h-4 w-32 bg-[#D4AF37]/12 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-[#D4AF37]/8 rounded w-full" />
          <div className="h-3 bg-[#D4AF37]/8 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (isError || !data) return null;

  const sentimentIcon =
    data.sentiment === 'bullish' ? (
      <TrendingUp size={16} className="price-up" />
    ) : data.sentiment === 'bearish' ? (
      <TrendingDown size={16} className="price-down" />
    ) : (
      <Minus size={16} className="price-neutral" />
    );

  const sentimentColor =
    data.sentiment === 'bullish' ? 'text-[#228B22]'
    : data.sentiment === 'bearish' ? 'text-[#DC143C]'
    : 'text-muted-foreground';

  const recStyle =
    data.recommendation === 'buy'
      ? 'bg-[#228B22]/12 text-[#228B22] border-[#228B22]/25'
      : data.recommendation === 'sell'
        ? 'bg-[#DC143C]/12 text-[#DC143C] border-[#DC143C]/25'
        : 'bg-amber-500/12 text-amber-500 border-amber-500/25';

  const sentimentBarColor =
    data.sentiment === 'bullish'
      ? 'from-[#228B22] to-[#006B3F]'
      : data.sentiment === 'bearish'
        ? 'from-[#DC143C] to-[#CE1126]'
        : 'from-[#D4AF37] to-[#B8860B]';

  return (
    <div className="african-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shadow-gold-sm"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
          >
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm text-[#D4AF37]">AI Insight</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold uppercase ${recStyle}`}>
            {data.recommendation}
          </span>
          <span className="text-xs text-muted-foreground">{data.confidence}% confidence</span>
        </div>
      </div>

      {/* Sentiment bar */}
      <div className="flex items-center gap-2 mb-3">
        {sentimentIcon}
        <span className={`text-sm font-semibold capitalize ${sentimentColor}`}>
          {data.sentiment}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${sentimentBarColor} transition-all duration-700`}
            style={{ width: `${Math.abs(data.score) * 100}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{data.summary}</p>

      {/* Key Points */}
      {data.keyPoints?.length > 0 && (
        <ul className="space-y-1">
          {data.keyPoints.map((point: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="text-[#D4AF37] mt-0.5 flex-shrink-0">•</span>
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

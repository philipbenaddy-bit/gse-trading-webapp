import { useQuery } from 'react-query';
import { Sparkles, Shield, AlertTriangle, Lightbulb, TrendingUp, RefreshCw } from 'lucide-react';
import { aiApi } from '../../lib/api';

export function PortfolioAiAnalysis() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery(
    'portfolio-ai-analysis',
    () => aiApi.getPortfolioAnalysis().then((r) => r.data),
    { staleTime: 10 * 60 * 1000, retry: 1 },
  );

  const healthColor: Record<string, string> = {
    excellent: 'text-[#228B22]',
    good:      'text-[#D4AF37]',
    fair:      'text-amber-500',
    poor:      'text-[#DC143C]',
  };

  const healthBar: Record<string, string> = {
    excellent: 'from-[#228B22] to-[#006B3F]',
    good:      'from-[#D4AF37] to-[#B8860B]',
    fair:      'from-amber-400 to-amber-600',
    poor:      'from-[#DC143C] to-[#CE1126]',
  };

  if (isLoading) {
    return (
      <div className="african-card p-6 animate-pulse space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15" />
          <div className="h-5 w-40 bg-[#D4AF37]/12 rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-3 bg-[#D4AF37]/8 rounded w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="african-card p-6 text-center">
        <AlertTriangle size={32} className="mx-auto mb-2 text-amber-500" />
        <p className="text-sm text-muted-foreground">AI analysis unavailable</p>
        <button
          onClick={() => refetch()}
          className="mt-3 text-xs text-[#D4AF37] hover:text-[#B8860B] transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const health = data.overallHealth as string;

  return (
    <div className="african-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-gold-sm"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
          >
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-[#D4AF37]">AI Portfolio Analysis</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-lg hover:bg-[#D4AF37]/8 transition-colors"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin text-[#D4AF37]' : 'text-muted-foreground'} />
        </button>
      </div>

      {/* Health Score */}
      <div className="rounded-xl p-4 bg-[#D4AF37]/6 border border-[#D4AF37]/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Portfolio Health</span>
          <span className={`text-lg font-bold capitalize ${healthColor[health] || 'text-muted-foreground'}`}>
            {data.overallHealth}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${healthBar[health] || healthBar.fair} transition-all duration-700`}
            style={{ width: `${data.score}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">Score</span>
          <span className="text-xs font-bold text-[#D4AF37]">{data.score}/100</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background border border-border/60 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Diversification</p>
          <p className="text-lg font-bold text-[#D4AF37] font-mono">{data.diversificationScore}%</p>
        </div>
        <div className="bg-background border border-border/60 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
          <p className={`text-lg font-bold capitalize ${
            data.riskLevel === 'low' ? 'price-up' : data.riskLevel === 'high' ? 'price-down' : 'text-amber-500'
          }`}>
            {data.riskLevel}
          </p>
        </div>
      </div>

      {/* Strengths */}
      {data.strengths?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-[#228B22]" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Strengths</span>
          </div>
          <ul className="space-y-1.5">
            {data.strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-[#228B22] mt-0.5 flex-shrink-0">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {data.risks?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-[#DC143C]" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Risks</span>
          </div>
          <ul className="space-y-1.5">
            {data.risks.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-[#DC143C] mt-0.5 flex-shrink-0">!</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {data.suggestions?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-[#FCD116]" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Suggestions</span>
          </div>
          <ul className="space-y-1.5">
            {data.suggestions.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-[#D4AF37] mt-0.5 flex-shrink-0">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

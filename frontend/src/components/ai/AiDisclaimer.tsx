import { AlertTriangle } from 'lucide-react';

interface AiDisclaimerProps {
  /** Optional custom disclaimer text. Falls back to the standard financial disclaimer. */
  text?: string;
  /** Compact mode for inline display within message bubbles */
  compact?: boolean;
}

const DEFAULT_DISCLAIMER =
  'This content is for informational purposes only and does not constitute investment advice. Always conduct your own research before making investment decisions.';

/**
 * Financial disclaimer component displayed with each AI response.
 * Required by compliance to ensure users understand AI output is not investment advice.
 */
export function AiDisclaimer({ text, compact = false }: AiDisclaimerProps) {
  const disclaimerText = text || DEFAULT_DISCLAIMER;

  if (compact) {
    return (
      <p
        className="text-[10px] text-muted-foreground/60 mt-2 italic leading-tight"
        role="note"
        aria-label="Financial disclaimer"
      >
        {disclaimerText}
      </p>
    );
  }

  return (
    <div
      className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15 mt-2"
      role="note"
      aria-label="Financial disclaimer"
    >
      <AlertTriangle size={12} className="text-amber-500/70 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
        {disclaimerText}
      </p>
    </div>
  );
}

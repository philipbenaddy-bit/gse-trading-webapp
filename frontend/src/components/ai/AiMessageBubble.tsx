import { Bot, User } from 'lucide-react';
import { AiDisclaimer } from './AiDisclaimer';

interface AiMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  /** Optional disclaimer text for assistant messages */
  disclaimer?: string;
  /** Timestamp for the message */
  timestamp?: string;
}

/**
 * Individual message display with role-based styling.
 * User messages appear on the right with green accent.
 * Assistant messages appear on the left with gold accent and include a disclaimer.
 */
export function AiMessageBubble({ role, content, disclaimer, timestamp }: AiMessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="listitem"
      aria-label={`${isUser ? 'Your' : 'AI assistant'} message`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, #228B22, #006B3F)'
            : 'linear-gradient(135deg, #D4AF37, #B8860B)',
        }}
        aria-hidden="true"
      >
        {isUser ? (
          <User size={14} className="text-white" />
        ) : (
          <Bot size={14} className="text-white" />
        )}
      </div>

      {/* Message content */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-[#228B22]/12 border border-[#228B22]/20 text-foreground'
              : 'bg-card border border-[#D4AF37]/15 text-foreground'
          }`}
        >
          {content}
        </div>

        {/* Disclaimer for assistant messages */}
        {!isUser && <AiDisclaimer text={disclaimer} compact />}

        {/* Timestamp */}
        {timestamp && (
          <p className={`text-[10px] text-muted-foreground/50 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

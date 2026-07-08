import { useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { useAiChatStore } from '../../store/aiChatStore';
import { AiMessageBubble } from './AiMessageBubble';
import { AiTypingIndicator } from './AiTypingIndicator';
import { AiInputBar } from './AiInputBar';
import { AiStatusBanner } from './AiStatusBanner';

interface AiChatPanelProps {
  /** Whether the panel is used standalone (full height) or embedded in another layout */
  standalone?: boolean;
}

/**
 * Main AI chat container that displays the conversation messages,
 * typing indicator, and input bar. Can be used standalone or embedded.
 */
export function AiChatPanel({ standalone = false }: AiChatPanelProps) {
  const { messages, isTyping, activeConversationId } = useAiChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or typing starts
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      className={`flex flex-col ${standalone ? 'h-full' : 'h-[600px]'} bg-background`}
      role="region"
      aria-label="AI Chat"
    >
      {/* Status banner for circuit breaker / rate limit warnings */}
      <AiStatusBanner />

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
        role="list"
        aria-label="Chat messages"
      >
        {/* Empty state */}
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
            >
              <Bot size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              AI Market Intelligence
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Ask me about GSE stocks, market trends, or your portfolio.
              I can help you understand market dynamics and analyze your investments.
            </p>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, index) => (
          <AiMessageBubble
            key={`${activeConversationId}-${index}`}
            role={msg.role}
            content={msg.content}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && <AiTypingIndicator />}

        {/* Scroll anchor */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-border/40">
        <AiInputBar />
      </div>
    </div>
  );
}

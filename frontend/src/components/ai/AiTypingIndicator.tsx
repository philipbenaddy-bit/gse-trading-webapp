import { Bot } from 'lucide-react';

/**
 * Animated typing indicator displayed while the AI is processing a response.
 * Shows three bouncing dots with the AI bot avatar.
 */
export function AiTypingIndicator() {
  return (
    <div className="flex gap-2 items-start" role="status" aria-label="AI is typing">
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
        aria-hidden="true"
      >
        <Bot size={16} className="text-white" />
      </div>
      <div className="bg-card border border-[#D4AF37]/15 rounded-2xl px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="sr-only">AI is generating a response</span>
      </div>
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useAiChatStore } from '../../store/aiChatStore';

const MAX_MESSAGE_LENGTH = 1000;

/**
 * Message input bar with character count and validation.
 * Rejects empty messages and messages exceeding 1000 characters.
 * Disables input while waiting for AI response.
 */
export function AiInputBar() {
  const [input, setInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isTyping } = useAiChatStore();

  const charCount = input.length;
  const isOverLimit = charCount > MAX_MESSAGE_LENGTH;
  const isEmpty = input.trim().length === 0;
  const isDisabled = isTyping;

  const validate = useCallback((text: string): string | null => {
    if (text.trim().length === 0) {
      return 'Message cannot be empty.';
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      return `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer. Currently ${text.length} characters.`;
    }
    return null;
  }, []);

  const handleSubmit = useCallback(() => {
    const error = validate(input);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    sendMessage(input.trim());
    setInput('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [input, validate, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isDisabled && !isEmpty) {
        handleSubmit();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Clear validation error as user types (unless still over limit)
    if (validationError && value.trim().length > 0 && value.length <= MAX_MESSAGE_LENGTH) {
      setValidationError(null);
    }

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="p-4">
      {/* Validation error */}
      {validationError && (
        <div
          className="mb-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20"
          role="alert"
          aria-live="polite"
        >
          <p className="text-xs text-red-400">{validationError}</p>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isDisabled ? 'Waiting for response...' : 'Ask about stocks, portfolio, market trends...'}
            className={`w-full text-sm py-2.5 px-4 pr-16 bg-background border rounded-xl text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 transition-all min-h-[42px] max-h-[120px] ${
              isOverLimit
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                : 'border-border focus:border-[#D4AF37] focus:ring-[#D4AF37]/20'
            }`}
            disabled={isDisabled}
            rows={1}
            aria-label="Type your message"
            aria-describedby="char-count"
            aria-invalid={!!validationError}
          />

          {/* Character count */}
          <span
            id="char-count"
            className={`absolute bottom-2 right-3 text-[10px] ${
              isOverLimit ? 'text-red-400 font-semibold' : 'text-muted-foreground/50'
            }`}
            aria-live="polite"
          >
            {charCount}/{MAX_MESSAGE_LENGTH}
          </span>
        </div>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={isDisabled || isEmpty}
          className="px-3 py-2.5 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-gold-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

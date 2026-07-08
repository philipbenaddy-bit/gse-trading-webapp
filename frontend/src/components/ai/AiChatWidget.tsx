import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { aiApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  'Analyse my portfolio',
  'Top movers today?',
  'Should I buy GCB?',
  'Explain market sentiment',
];

export function AiChatWidget() {
  const [open,      setOpen]      = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages,  setMessages]  = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI trading assistant. I can help you analyse stocks, review your portfolio, and discuss GSE market trends. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, open, minimized]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await aiApi.chat(content, history);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date(),
      }]);
    } catch {
      toast.error('AI assistant unavailable');
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ── FAB ── */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-gold-lg hover:scale-110 active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
        title="AI Trading Assistant"
      >
        <Sparkles size={22} className="text-white" />
      </button>
    );
  }

  /* ── Chat panel ── */
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col transition-all duration-300 shadow-gold-lg rounded-2xl border border-[#D4AF37]/20 ${
        minimized ? 'w-72 h-14' : 'w-96 h-[560px]'
      }`}
      style={{
        maxHeight: 'calc(100vh - 100px)',
        background: 'hsl(var(--card))',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-gold-sm"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
          >
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-[#D4AF37]">AI Assistant</p>
            {!minimized && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#228B22] animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1.5 rounded-lg hover:bg-[#D4AF37]/8 transition-colors"
          >
            {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#DC143C]/10 hover:text-[#DC143C] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: msg.role === 'assistant'
                      ? 'linear-gradient(135deg, #D4AF37, #B8860B)'
                      : 'linear-gradient(135deg, #228B22, #006B3F)',
                  }}
                >
                  {msg.role === 'assistant'
                    ? <Bot size={14} className="text-white" />
                    : <User size={14} className="text-white" />}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#228B22]/12 border border-[#228B22]/20 text-foreground'
                      : 'bg-card border border-[#D4AF37]/15 text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
                >
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-card border border-[#D4AF37]/15 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 text-[#D4AF37] hover:bg-[#D4AF37]/15 hover:scale-105 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border/40 flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about stocks, portfolio…"
                className="flex-1 text-sm py-2.5 px-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="px-3 py-2.5 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-gold-sm"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

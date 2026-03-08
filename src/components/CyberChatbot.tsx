import { useState, useRef, useEffect } from 'react';
import { X, Send, Trash2, Square, User } from 'lucide-react';
import { useCyberChat } from '@/hooks/useCyberChat';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const BotLogo = ({ className = "h-6 w-6" }: { className?: string }) => (
  <img src="/favicon.png" alt="CyberBot" className={className} />
);
const QUICK_PROMPTS = [
  '🛡️ What learning path should I start with?',
  '🔍 Explain how SQL injection works',
  '🧰 What tools do I need for web pentesting?',
  '📚 Help me understand the current module',
];

export default function CyberChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages, stopGeneration } = useCyberChat();
  const { user } = useAuth();
  const location = useLocation();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Build context from current route
  const getContext = () => {
    const ctx: Record<string, string | number> = {};
    const path = location.pathname;

    if (path.startsWith('/paths/')) {
      ctx.currentPath = 'Active learning path';
    }
    if (path === '/labs') {
      ctx.currentLab = 'Browsing labs';
    }

    if (user?.user_metadata) {
      ctx.userLevel = user.user_metadata.level || 1;
      ctx.userRank = user.user_metadata.rank || 'Script Kiddie';
    }

    return Object.keys(ctx).length > 0 ? ctx : undefined;
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    sendMessage(trimmed, getContext());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt, getContext());
  };

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-cyber shadow-neon flex items-center justify-center hover:scale-110 transition-transform animate-pulse-glow group"
          aria-label="Open CyberBot"
        >
          <MessageSquare className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl shadow-[hsl(var(--primary)/0.1)] overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-cyber">
            <Bot className="h-6 w-6 text-primary-foreground" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-primary-foreground font-mono">CyberBot</h3>
              <p className="text-[10px] text-primary-foreground/70">AI Security Tutor</p>
            </div>
            <button
              onClick={clearMessages}
              className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4 text-primary-foreground/70" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            >
              <X className="h-4 w-4 text-primary-foreground/70" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Bot className="h-10 w-10 text-primary mx-auto mb-3 opacity-60" />
                  <p className="text-sm text-muted-foreground">
                    Hey hacker! 👋 I'm <span className="text-primary font-mono">CyberBot</span>, your AI security tutor.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask me anything about cybersecurity, labs, or learning paths.
                  </p>
                </div>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleQuickPrompt(prompt)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border/50 bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-primary/20'
                      : 'bg-gradient-cyber'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    )}
                  </div>
                  <div className={`max-w-[280px] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary/15 text-foreground'
                      : 'bg-muted/50 text-foreground'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_p]:leading-relaxed [&_code]:text-primary [&_code]:bg-background/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-background [&_pre]:rounded-lg [&_pre]:p-2 [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:space-y-1 [&_ol]:space-y-1 [&_li]:text-sm [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_strong]:text-primary [&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2.5">
                <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-cyber flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="bg-muted/50 rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card">
            {isLoading && (
              <button
                onClick={stopGeneration}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors mb-2 mx-auto"
              >
                <Square className="h-3 w-3" /> Stop generating
              </button>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask CyberBot anything..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 rounded-lg bg-gradient-cyber text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

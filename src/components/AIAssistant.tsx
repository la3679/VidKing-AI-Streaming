import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Sparkles, X, BrainCircuit, RotateCw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '../store/useUIStore';
import { chat, ApiError, type ChatMessage } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import ReactMarkdown from 'react-markdown';
import { logger } from '../lib/logger';

type Status = 'idle' | 'thinking';

interface UIMessage extends ChatMessage {
  isError?: boolean;
}

const QUICK_ACTIONS = [
  'Recommend a sci-fi movie',
  'A short comedy for tonight',
  'Find something like Inception',
  'Best thrillers of all time',
];

const MAX_HISTORY = 30;

function storageKey(uid?: string) {
  return `vk_chat_${uid ?? 'guest'}`;
}

export const AIAssistant = () => {
  const { isAssistantOpen, toggleAssistant } = useUIStore();
  const { profile, user } = useAuthStore();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load persisted conversation per user (or guest).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(user?.uid));
      setMessages(raw ? (JSON.parse(raw) as UIMessage[]) : []);
    } catch {
      setMessages([]);
    }
  }, [user?.uid]);

  // Persist on change (cap length to avoid unbounded growth).
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey(user?.uid),
        JSON.stringify(messages.slice(-MAX_HISTORY)),
      );
    } catch (e) {
      logger.warn('Could not persist chat history:', e);
    }
  }, [messages, user?.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg = text.trim();
      if (!userMsg || status === 'thinking') return;

      // Build the request from prior non-error turns plus this message.
      const priorTurns: ChatMessage[] = messages
        .filter((m) => !m.isError)
        .map(({ role, content }) => ({ role, content }));
      const request: ChatMessage[] = [...priorTurns, { role: 'user', content: userMsg }];

      setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
      setInput('');
      setStatus('thinking');

      try {
        const { reply } = await chat(request, profile?.displayName || undefined);
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch (error) {
        const content =
          error instanceof ApiError && error.isUnavailable
            ? 'The AI copilot is not available right now — the service may be unconfigured or temporarily down. Please try again later.'
            : 'I had trouble reaching the AI service. Check your connection and try again.';
        setMessages((prev) => [...prev, { role: 'assistant', content, isError: true }]);
      } finally {
        setStatus('idle');
      }
    },
    [messages, profile?.displayName, status],
  );

  const retryLast = useCallback(() => {
    // Drop the trailing error message and re-send the last user turn.
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    setMessages((prev) => {
      const copy = [...prev];
      if (copy[copy.length - 1]?.isError) copy.pop();
      return copy;
    });
    void sendMessage(lastUser.content);
  }, [messages, sendMessage]);

  const clearConversation = useCallback(() => setMessages([]), []);

  return (
    <AnimatePresence>
      {isAssistantOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          role="dialog"
          aria-label="VidKing AI assistant"
          className="fixed z-[100] flex flex-col shadow-2xl overflow-hidden inset-x-3 bottom-3 h-[70vh] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px] sm:h-[600px]"
        >
          <div className="glass-card flex-1 flex flex-col h-full bg-black/60 border border-brand/20">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-brand/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand rounded-xl shadow-lg shadow-brand/20">
                  <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm tracking-tighter uppercase italic">
                    VidKing Copilot
                  </h3>
                  <p className="text-[10px] text-brand uppercase font-black tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    {status === 'thinking' ? 'Thinking…' : 'Online'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearConversation}
                    aria-label="Clear conversation"
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
                  >
                    <Trash2 className="w-4 h-4 opacity-60" aria-hidden="true" />
                  </button>
                )}
                <button
                  onClick={toggleAssistant}
                  aria-label="Close assistant"
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
                >
                  <X className="w-5 h-5 opacity-60" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide" aria-live="polite">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-4 bg-white/5 rounded-full ring-1 ring-white/10">
                    <BrainCircuit className="w-12 h-12 text-brand/50" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">How can I help you today?</h4>
                    <p className="text-sm text-gray-400">
                      Ask for recommendations, explain a plot, or find something like a title you love.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full pt-4">
                    {QUICK_ACTIONS.map((hint) => (
                      <button
                        key={hint}
                        onClick={() => sendMessage(hint)}
                        className="p-2 border border-white/10 rounded-lg text-xs hover:bg-white/5 hover:border-brand/40 transition-colors text-gray-300"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => {
                const isLast = i === messages.length - 1;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-brand text-white rounded-tr-none'
                          : msg.isError
                            ? 'bg-amber-500/10 text-amber-100 border border-amber-400/30 rounded-tl-none'
                            : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/10'
                      }`}
                    >
                      <div className="markdown-body">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.isError && isLast && (
                        <button
                          onClick={retryLast}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-200 hover:text-white transition-colors"
                        >
                          <RotateCw className="w-3.5 h-3.5" aria-hidden="true" /> Retry
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {status === 'thinking' && (
                <div className="flex justify-start" role="status" aria-label="Assistant is thinking">
                  <div className="bg-white/10 p-3 rounded-2xl flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/40">
              <div className="relative">
                <label htmlFor="assistant-input" className="sr-only">
                  Ask VidKing AI
                </label>
                <input
                  id="assistant-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask VidKing AI…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-14 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || status === 'thinking'}
                    aria-label="Send message"
                    className="p-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

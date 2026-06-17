import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, X, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '../store/useUIStore';
import { chat, ApiError, type ChatMessage } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import ReactMarkdown from 'react-markdown';

export const AIAssistant = () => {
  const { isAssistantOpen, toggleAssistant } = useUIStore();
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    const history: ChatMessage[] = [...messages, { role: 'user', content: userMsg }];
    setInput('');
    setMessages(history);
    setIsTyping(true);

    try {
      const { reply } = await chat(history, profile?.displayName || undefined);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      const content =
        error instanceof ApiError && error.isUnavailable
          ? 'The AI copilot is not available right now. Please try again later.'
          : 'I had trouble reaching the AI service. Please check your connection and try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } finally {
      setIsTyping(false);
    }
  };

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
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm tracking-tighter uppercase italic">VidKing Intelligence</h3>
                  <p className="text-[10px] text-brand uppercase font-black tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" /> Neural Core Active
                  </p>
                </div>
              </div>
              <button
                onClick={toggleAssistant}
                aria-label="Close assistant"
                className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
              >
                <X className="w-5 h-5 opacity-60" aria-hidden="true" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-4 bg-white/5 rounded-full ring-1 ring-white/10">
                    <BrainCircuit className="w-12 h-12 text-brand/50" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">How can I help you today?</h4>
                    <p className="text-sm text-gray-400">Ask me about movies, explain plots, or get personalized AI-driven picks.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full pt-4">
                    {[
                      "Recommend sci-fi",
                      "Explain Inception",
                      "Show dark thrillers",
                      "Top picks for tonight"
                    ].map(hint => (
                      <button 
                        key={hint}
                        onClick={() => setInput(hint)}
                        className="p-2 border border-white/10 rounded-lg text-xs hover:bg-white/5 transition-colors text-gray-300"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand text-white rounded-tr-none' 
                      : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/10'
                  }`}>
                    <div className="markdown-body">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-2xl animate-pulse flex gap-1">
                    <div className="w-1.5 h-1.5 bg-brand rounded-full" />
                    <div className="w-1.5 h-1.5 bg-brand rounded-full delay-75" />
                    <div className="w-1.5 h-1.5 bg-brand rounded-full delay-150" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/40">
              <div className="relative">
                <label htmlFor="assistant-input" className="sr-only">Ask VidKing AI</label>
                <input
                  id="assistant-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask VidKing AI..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-14 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
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

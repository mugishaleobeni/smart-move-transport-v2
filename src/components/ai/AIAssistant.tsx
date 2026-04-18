import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';
import { useOnlineStatus } from '@/components/offline/OfflineBanner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { carsApi } from '@/lib/api';
import { CarCard } from '@/components/ui/CarCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { messages, isLoading, sendMessage: aiSendMessage } = useChat(user?.id || 'guest');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();
  const [isMobile, setIsMobile] = useState(false);
  const [cars, setCars] = useState<any[]>([]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await carsApi.getAll();
        setCars(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      } catch (err) {
        console.error('Failed to pre-fetch cars for AI chat', err);
      }
    };
    fetchCars();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading || !isOnline) return;
    const content = text;
    if (text === input) setInput('');
    await aiSendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        drag={isMobile ? "y" : false}
        dragConstraints={{ top: -400, bottom: 400 }}
        dragElastic={0.1}
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed right-0 top-1/2 -translate-y-1/2 z-50 w-12 h-14 rounded-l-2xl shadow-lg flex items-center justify-center transition-all duration-300 touch-none',
          'bg-accent text-accent-foreground hover:-translate-x-1 glow px-2',
          isOpen && 'scale-0 opacity-0'
        )}
        whileHover={!isMobile ? { x: -5 } : {}}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6" />
        <span className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-6rem)] glass-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{t('ai.title')}</h3>
                  <span className="text-xs text-muted-foreground">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!isOnline && (
                <div className="text-center text-muted-foreground text-sm p-4">
                  {t('ai.offline')}
                </div>
              )}

              {messages.length === 0 && isOnline && (
                <div className="text-center text-muted-foreground text-sm p-4">
                  {t('ai.greeting')}
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-accent" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                      msg.role === 'user'
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none flex flex-col gap-2">
                        {msg.content.split(/\[CAR:([^\]]+)\]/g).map((part, index) => {
                          if (index % 2 === 1) {
                            const car = cars.find(c => (c._id || c.id) === part.trim());
                            if (!car) return null;
                            return (
                              <div key={index} className="w-full mt-2 mb-2 w-full shrink-0">
                                <CarCard car={car} />
                              </div>
                            );
                          }
                          return part.trim() ? <ReactMarkdown key={index}>{part}</ReactMarkdown> : null;
                        })}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length < 2 && isOnline && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {["Available Cars", "Book a Ride", "Payment Options"].map((action) => (
                  <Button
                    key={action}
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-full border-accent/20 hover:bg-accent/10 hover:text-accent font-medium leading-none h-7"
                    onClick={() => handleSend(action)}
                    disabled={isLoading}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('ai.placeholder')}
                  disabled={!isOnline || isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || !isOnline || isLoading}
                  size="icon"
                  className="btn-accent"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

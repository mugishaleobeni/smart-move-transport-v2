import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';
import { useOnlineStatus } from '@/components/offline/OfflineBanner';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();
  const [isMobile, setIsMobile] = useState(false);

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

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !isOnline) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      // Mock/Demo response logic
      await new Promise(resolve => setTimeout(resolve, 1000));

      const responses = [
        "Welcome to Smart Move Transport! How can I help you today?",
        "We offer premium car rentals in Kigali with a focus on luxury and comfort.",
        "Our fleet includes the latest Mercedes-Benz, Range Rover, and Toyota Land Cruisers.",
        "You can book a car directly through our booking page. Would you like a link?",
        "We provide professional chauffeurs for all our rentals to ensure your safety and comfort."
      ];

      assistantContent = responses[Math.floor(Math.random() * responses.length)];

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: assistantContent }
      ]);
    } catch (error) {
      console.error('AI Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: t('ai.error') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
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
                  onClick={sendMessage}
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

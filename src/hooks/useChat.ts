import { useState, useCallback, useEffect } from 'react';
import { aiService } from '@/services/aiService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'smartmove_ai_chat_history';

export function useChat(userId: string = 'guest') {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_' + userId);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse chat history', e);
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from backend on mount if user is logged in
  useEffect(() => {
    const loadBackendHistory = async () => {
      if (userId !== 'guest') {
        const history = await aiService.getHistory(userId);
        if (history && history.length > 0) {
          setMessages(history);
        }
      }
    };
    loadBackendHistory();
  }, [userId]);

  // Sync to local storage and backend
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_' + userId, JSON.stringify(messages));
    if (messages.length > 0 && userId !== 'guest') {
      // Throttle or direct save
      aiService.saveHistory(userId, messages);
    }
  }, [messages, userId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    // Capture the history before the new message to send to the backend
    const history = messages.slice(-10);

    try {
      const response = await aiService.chat(content.trim(), userId, history);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response?.reply || "I'm sorry, I couldn't process that response."
      }]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      setError('Something went wrong');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, something went wrong communicating with my servers. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, userId, isLoading]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY + '_' + userId);
  }, [userId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory
  };
}

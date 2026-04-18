import api from '../lib/api';

export const aiService = {
  chat: async (message: string, userId: string, history: Array<{role: string, content: string}> = []) => {
    const response = await api.post('/ai/chat', { message, userId, history });
    return response.data;
  },
  saveHistory: async (userId: string, messages: Array<{role: string, content: string}>) => {
    if (!userId || userId === 'guest') return;
    try {
      await api.post(`/ai/chat/history`, { userId, messages });
    } catch (e) {
      console.error('Failed to save chat history to backend', e);
    }
  },
  getHistory: async (userId: string) => {
    if (!userId || userId === 'guest') return [];
    try {
      const response = await api.get(`/ai/chat/history/${userId}`);
      return response.data?.history || response.data?.messages || [];
    } catch (e) {
      console.error('Failed to fetch chat history from backend', e);
      return [];
    }
  }
};

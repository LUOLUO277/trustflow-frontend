import { create } from 'zustand';
import { chatService,type  SessionItem } from '../services/chatService';

interface ChatState {
  sessions: SessionItem[];
  currentSessionId: number | null;
  fetchSessions: () => Promise<void>;
  setCurrentSessionId: (id: number | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  currentSessionId: null,
  fetchSessions: async () => {
    try {
      const data = await chatService.getSessions();
      set({ sessions: data });
    } catch (error) {
      console.error("Fetch sessions failed", error);
    }
  },
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
}));
// src/services/chatService.ts
import api from './api';

// 类型定义（严格对照 API 文档）
export interface SessionItem {
  session_id: number;
  title: string;
  last_active: string;
}

export interface Citation {
  doc_id: number;
  file_name: string;
  page: number;
  score: number;
  text_snippet: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  // 仅 assistant 有的字段
  tx_hash?: string; 
  parent_hash?: string;
  citations?: Citation[];
  record_id?: number;
}

export interface SendMessageResponse {
  session_id: number;
  record_id: number;
  content: string;
  tx_hash: string;
  parent_hash: string;
  citations: Citation[];
}

export const chatService = {
  // 3.1 获取会话列表
  getSessions: () => {
    return api.get<any, SessionItem[]>('/sessions');
  },

  // 3.3 获取会话详情 (历史记录)
  getHistory: (sessionId: number) => {
    return api.get<any, ChatMessage[]>(`/sessions/${sessionId}/history`);
  },

  // 3.2 发送对话
  sendMessage: (data: {
    session_id: number | null;
    model: string;
    prompt: string;
    temperature: number;
  }) => {
    return api.post<any, SendMessageResponse>('/chat/completions', data);
  }
};
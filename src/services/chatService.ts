// src/services/chatService.ts
import api from './api';

// --- 1. 实体类型定义 ---

// 会话列表项
export interface SessionItem {
  session_id: number;
  title: string;
  last_active: string; // ISO Time
}

// 引用来源 (RAG)
export interface Citation {
  doc_id: number;
  file_name: string;
  page: number;
  score: number;
  text_snippet: string;
}

// 消息历史记录
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string; // 文本内容 或 图片Prompt
  created_at?: string;
  
  // 额外字段
  content_type?: 'text' | 'image'; // 区分消息类型
  artifact_url?: string;           // 图片地址
  tx_hash?: string;                // 存证 Hash
  watermark_status?: string;       // 水印状态
  citations?: Citation[];          // 引用来源
}

// --- 2. 请求/响应类型定义 ---

// 创建会话
export interface CreateSessionRequest {
  title?: string;
}
export interface CreateSessionResponse {
  session_id: number;
  title: string;
  latest_tx_hash: string | null;
  created_at: string;
}

// 发送消息 (支持 Text 和 Image)
export interface SendMessageRequest {
  session_id: number;
  mode: 'text' | 'image';
  model: string;
  prompt: string;
  parameters?: {
    temperature?: number;         // text mode
    image_size?: string;          // image mode
    num_inference_steps?: number; // image mode
    batch_size?: number;          // image mode
  };
}

export interface SendMessageResponse {
  session_id: number;
  record_id: number;
  content_type: 'text' | 'image';
  role: 'assistant';
  content: string;
  tx_hash: string;
  // Text Mode 特有
  citations?: Citation[];
  // Image Mode 特有
  artifact_url?: string;
  watermark_status?: string;
}

// --- 3. 接口方法 ---

export const chatService = {
  // 3.1 创建新会话
  createSession: (title?: string) => {
    return api.post<any, CreateSessionResponse>('/sessions', { title });
  },

  // 3.2 获取会话列表
  getSessions: () => {
    return api.get<any, SessionItem[]>('/sessions');
  },

  // 3.3 获取会话历史
  getHistory: (sessionId: number) => {
    return api.get<any, ChatMessage[]>(`/sessions/${sessionId}/history`);
  },

 // 3.4 发送对话/生成
  sendMessage: (data: SendMessageRequest) => {
    // 【修改点】：在 data 后面增加了第三个参数，设置 timeout
    return api.post<any, SendMessageResponse>('/chat/completions', data, {
      timeout: 300000 // 单位是毫秒，300000 = 5分钟
    });
  }
};
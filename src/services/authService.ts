// src/services/authService.ts
import api from './api';

// 定义请求和响应类型
interface NonceResponse {
  nonce: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user_info: {
    user_id: number;
    wallet_address: string;
  };
}

export const authService = {
  // 1.1 获取登录 Nonce
  // URL: /auth/nonce, Method: POST
  getNonce: async (walletAddress: string) => {
    return api.post<any, NonceResponse>('/auth/nonce', {
      wallet_address: walletAddress // 严格对应 API 文档的 key
    });
  },

  // 1.2 钱包登录
  // URL: /auth/login, Method: POST
  login: async (walletAddress: string, signature: string) => {
    return api.post<any, LoginResponse>('/auth/login', {
      wallet_address: walletAddress, // 严格对应 API 文档的 key
      signature: signature
    });
  }
};
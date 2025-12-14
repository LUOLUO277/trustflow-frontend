import api from './api';

export interface NonceResponse {
  nonce: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_info: {
    user_id: number;
    wallet_address: string;
  };
}

export const authService = {
  // 1.1 获取 Nonce
  getNonce: (wallet_address: string) => {
    return api.post<any, NonceResponse>('/auth/nonce', { wallet_address });
  },
  
  // 1.2 签名登录
  login: (wallet_address: string, signature: string) => {
    return api.post<any, LoginResponse>('/auth/login', { wallet_address, signature });
  }
};
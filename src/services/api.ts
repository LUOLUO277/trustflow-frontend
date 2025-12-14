import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// 基础配置
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1', // 对应后端文档
  timeout: 30000,
});

// 请求拦截器：自动注入 Token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理全局错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除状态并跳转登录
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
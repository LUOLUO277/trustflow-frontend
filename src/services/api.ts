import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { message } from 'antd'; // 引入 message 用于提示过期

// 修改：端口改为 8080
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1', 
  timeout: 30000,
});

// 请求拦截器 (保持不变)
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

// 响应拦截器 (稍微优化一下错误提示)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // === 暂时注释掉下面这段，方便调试 ===
    /*
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    */
    // =================================
    
    // 建议加上这行 log，方便你直接在 F12 看到错误
    console.error("API 请求失败:", error.response?.data || error.message);
    
    return Promise.reject(error);
  }
);

export default api;
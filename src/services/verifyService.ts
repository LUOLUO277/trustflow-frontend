import api from './api'; // 假设你已有封装好的 axios 实例

export const verifyService = {
  // 综合验证接口 (文本或图片)
  check: async (params: { type: 'text' | 'image'; text?: string; file?: File }) => {
    const formData = new FormData();
    formData.append('type', params.type);
    if (params.text) formData.append('text', params.text);
    if (params.file) formData.append('file', params.file);
    
    const response = await api.post('/verify/check', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Hash 直接查询
  lookupHash: async (txHash: string) => {
    const response = await api.get(`/verify/tx/${txHash}`);
    return response.data;
  }
};
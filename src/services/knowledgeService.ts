import api from './api';

// 定义前端使用的文件接口
export interface KnowledgeFile {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  status: 'processing' | 'indexed' | 'failed' | 'uploading' | 'ready'; 
  created_at: string;
  hash?: string;
  tx_hash?: string;
  chunk_count?: number; // 后端若暂无此字段可默认为 0
}

// 内部转换工具：将后端字段映射为前端组件识别的字段
const mapBackendToFrontend = (item: any): KnowledgeFile => ({
  id: item.doc_id,
  filename: item.file_name,
  file_type: item.file_name.split('.').pop() || 'unknown',
  file_size: item.file_size || 0,
  // 将后端的 'indexed' 状态转换为前端展示的 'ready'
  status: item.status === 'indexed' ? 'ready' : item.status,
  created_at: item.upload_time,
  tx_hash: item.tx_hash,
  hash: item.file_hash,
  chunk_count: item.chunk_count || 0,
});

export const knowledgeService = {
  /**
   * 获取文档列表
   */
  getDocuments: async (): Promise<KnowledgeFile[]> => {
    const res = await api.get('/documents');
    // 如果 res 是数组，直接用；如果 res.data 是数组，用 res.data
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map(mapBackendToFrontend);
  },

  /**
   * 上传文档
   */
  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * 删除文档
   */
  deleteDocument: async (docId: number) => {
    const response = await api.delete(`/documents/${docId}`);
    return response.data;
  },
};
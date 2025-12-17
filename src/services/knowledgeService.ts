// 知识库文件类型
export interface KnowledgeFile {
  id: number;
  filename: string;
  file_type: string;        // 'pdf' | 'txt' | 'docx'
  file_size: number;        // 字节
  status: 'uploading' | 'parsing' | 'ready' | 'failed';
  progress?: number;        // 0-100 解析进度
  hash?: string;            // 文件哈希（上链后）
  tx_hash?: string;         // 区块链交易哈希
  chunk_count?: number;     // 切片数量
  created_at: string;
  updated_at: string;
}

// 上传响应
export interface UploadResponse {
  file_id: number;
  filename: string;
  message: string;
}

// Mock 数据
export const MOCK_FILES: KnowledgeFile[] = [
  {
    id: 1,
    filename: '2024行业研究报告.pdf',
    file_type: 'pdf',
    file_size: 2458624,
    status: 'ready',
    progress: 100,
    hash: '0x7f3c8a2b4d6e...',
    tx_hash: '0xabc123def456...',
    chunk_count: 42,
    created_at: '2024-01-15 10:30:00',
    updated_at: '2024-01-15 10:32:15',
  },
  {
    id: 2,
    filename: '公司销售政策.txt',
    file_type: 'txt',
    file_size: 15360,
    status: 'ready',
    progress: 100,
    hash: '0x9e8d7c6b5a4f...',
    tx_hash: '0xdef789ghi012...',
    chunk_count: 8,
    created_at: '2024-01-14 14:20:00',
    updated_at: '2024-01-14 14:20:30',
  },
  {
    id: 3,
    filename: '技术架构文档.pdf',
    file_type: 'pdf',
    file_size: 5242880,
    status: 'parsing',
    progress: 65,
    created_at: '2024-01-15 11:00:00',
    updated_at: '2024-01-15 11:00:00',
  },
  {
    id: 4,
    filename: '会议纪要.txt',
    file_type: 'txt',
    file_size: 8192,
    status: 'failed',
    progress: 0,
    created_at: '2024-01-15 09:00:00',
    updated_at: '2024-01-15 09:00:05',
  },
];
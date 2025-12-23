import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Upload, Button, Table, Tag, Progress, Space,
  Typography, Tooltip, message, Modal, Empty,
} from 'antd';
import {
  InboxOutlined, FileTextOutlined, FilePdfOutlined, DeleteOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SyncOutlined,
  SafetyCertificateOutlined, EyeOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload';
import type { ColumnsType } from 'antd/es/table';
import { knowledgeService } from '../../services/knowledgeService';
import { type KnowledgeFile } from '../../services/knowledgeService';
import MainLayout from '../../components/MainLayout';

const { Content } = Layout;
const { Dragger } = Upload;
const { Title, Text } = Typography;

// Mock 侧边栏会话数据
const MOCK_SESSIONS = [
  { session_id: 1, title: "TrustFlow 技术原理", last_active: "Today" },
  { session_id: 2, title: "RAG 溯源测试", last_active: "Yesterday" },
];

const KnowledgePage: React.FC = () => {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<{ open: boolean; file: KnowledgeFile | null }>({
    open: false,
    file: null,
  });

  // 1. 初始化及刷新数据
const fetchFiles = async () => {
  setLoading(true);
  try {
    const data = await knowledgeService.getDocuments();
    console.log('转换后的文档数据:', data); // 调试用
    setFiles(data);
  } catch (error: any) {
    // 关键：打印错误详情
    console.error('获取列表完整错误信息:', error);
    // 如果 error.response 存在，说明是接口返回了 4xx/5xx 错误
    // 如果没有，说明是代码逻辑（如 map 映射）报错
    message.error(`获取列表失败: ${error.message || '未知错误'}`);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchFiles();
  }, []);

  // 2. 辅助格式化函数
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.toLowerCase() === 'pdf') return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
    return <FileTextOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
  };

  const getStatusTag = (status: KnowledgeFile['status']) => {
    switch (status) {
      case 'ready':
        return <Tag icon={<CheckCircleOutlined />} color="success">已就绪</Tag>;
      case 'processing':
        return <Tag icon={<SyncOutlined spin />} color="processing">解析中</Tag>;
      case 'uploading':
        return <Tag icon={<SyncOutlined spin />} color="default">上传中</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // 3. 上传逻辑
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.txt',
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      const fileObj = file as File;
      
      // UI 预占位
      const tempId = Date.now();
      const placeholder: KnowledgeFile = {
        id: tempId,
        filename: fileObj.name,
        file_type: fileObj.name.split('.').pop() || '',
        file_size: fileObj.size,
        status: 'uploading',
        created_at: new Date().toISOString(),
      };
      setFiles(prev => [placeholder, ...prev]);

      try {
        await knowledgeService.uploadDocument(fileObj);
        message.success(`${fileObj.name} 上传成功，系统正在后台建立索引`);
        onSuccess?.(null);
        fetchFiles(); // 重新拉取真实列表
      } catch (err) {
        message.error(`${fileObj.name} 上传失败`);
        setFiles(prev => prev.filter(f => f.id !== tempId));
        onError?.(err as Error);
      }
    },
  };

  // 4. 删除逻辑
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后，该文件将从知识库中移除且无法恢复。确定吗？',
      okText: '删除',
      okType: 'danger',
      onOk: async () => {
        try {
          await knowledgeService.deleteDocument(id);
          message.success('文件已删除');
          setFiles(prev => prev.filter((f) => f.id !== id));
        } catch (error) {
          message.error('删除操作失败');
        }
      },
    });
  };

  // 5. 表格列定义
  const columns: ColumnsType<KnowledgeFile> = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.file_type)}
          <Text strong style={{ maxWidth: 200 }} ellipsis={{ tooltip: text }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: '链上存证',
      dataIndex: 'tx_hash',
      key: 'tx_hash',
      width: 150,
      render: (hash) => hash ? (
        <Tooltip title={hash}>
          <Tag icon={<SafetyCertificateOutlined />} color="green">
            {hash.slice(0, 10)}...
          </Tag>
        </Tooltip>
      ) : <Text type="secondary">等待中</Text>,
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size) => formatFileSize(size),
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => time ? time.replace('T', ' ').slice(0, 16) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => setDetailModal({ open: true, file: record })}
            disabled={record.status !== 'ready'}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)} 
          />
        </Space>
      ),
    },
  ];

  return (
    <MainLayout sessions={MOCK_SESSIONS}>
      <Content style={{ padding: '74px 24px 24px 24px', background: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ marginBottom: 24 }}>
            <Title level={3}>知识库管理</Title>
            <Text type="secondary">上传本地文档，为 AI 提供私有知识增强 (RAG)，所有文档均经过哈希上链存证。</Text>
          </div>

          <Card style={{ marginBottom: 24, borderRadius: 12 }}>
            <Dragger {...uploadProps} style={{ padding: '20px 0' }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#10a37f', fontSize: 48 }} />
              </p>
              <p className="ant-upload-text">点击或拖拽 PDF/TXT 文件上传</p>
              <p className="ant-upload-hint">单文件最大支持 50MB</p>
            </Dragger>
          </Card>

          <Card 
            title="文档列表" 
            extra={<Button icon={<SyncOutlined />} onClick={fetchFiles} loading={loading}>刷新</Button>}
            style={{ borderRadius: 12 }}
          >
            <Table
              loading={loading}
              columns={columns}
              dataSource={files}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              locale={{ emptyText: <Empty description="暂无知识库文档" /> }}
            />
          </Card>
        </div>

        <Modal
          title="文档详细信息"
          open={detailModal.open}
          onCancel={() => setDetailModal({ open: false, file: null })}
          footer={[<Button key="ok" onClick={() => setDetailModal({ open: false, file: null })}>确定</Button>]}
        >
          {detailModal.file && (
            <div style={{ paddingTop: 10 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div><Text type="secondary">文件名：</Text><Text strong>{detailModal.file.filename}</Text></div>
                
                <div><Text type="secondary">区块链交易哈希：</Text><br /><Text code>{detailModal.file.tx_hash || '存证中...'}</Text></div>
                <div><Text type="secondary">系统状态：</Text>{getStatusTag(detailModal.file.status)}</div>
              </Space>
            </div>
          )}
        </Modal>
      </Content>
    </MainLayout>
  );
};

export default KnowledgePage;
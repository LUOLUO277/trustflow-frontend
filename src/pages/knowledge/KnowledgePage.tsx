import React, { useState } from 'react';
import {
  Layout,
  Card,
  Upload,
  Button,
  Table,
  Tag,
  Progress,
  Space,
  Typography,
  Tooltip,
  message,
  Modal,
  Empty,
} from 'antd';
import {
  InboxOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd/es/upload';
import type { ColumnsType } from 'antd/es/table';
import type { KnowledgeFile } from '../../services/knowledgeService';
import { MOCK_FILES } from '../../services/knowledgeService';
import MainLayout from '../../components/MainLayout';

const { Content } = Layout;
const { Dragger } = Upload;
const { Title, Text } = Typography;

// Mock sessions 数据（与 ChatPage 保持一致）
const MOCK_SESSIONS = [
  { session_id: 1, title: "TrustFlow 技术原理", last_active: "Today" },
  { session_id: 2, title: "RAG 溯源测试", last_active: "Yesterday" },
  { session_id: 3, title: "智能合约安全审计", last_active: "Last Week" },
  { session_id: 4, title: "Web3 隐私计算方案", last_active: "Last Month" },
];

const KnowledgePage: React.FC = () => {
  const [files, setFiles] = useState<KnowledgeFile[]>(MOCK_FILES);
  const [uploading, setUploading] = useState(false);
  const [detailModal, setDetailModal] = useState<{ open: boolean; file: KnowledgeFile | null }>({
    open: false,
    file: null,
  });

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
      case 'txt':
        return <FileTextOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
      default:
        return <FileTextOutlined style={{ color: '#666', fontSize: 20 }} />;
    }
  };

  // 获取状态标签
  const getStatusTag = (status: KnowledgeFile['status'], progress?: number) => {
    switch (status) {
      case 'ready':
        return <Tag icon={<CheckCircleOutlined />} color="success">已就绪</Tag>;
      case 'parsing':
        return (
          <Tag icon={<SyncOutlined spin />} color="processing">
            解析中 {progress}%
          </Tag>
        );
      case 'uploading':
        return <Tag icon={<SyncOutlined spin />} color="default">上传中</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.pdf,.txt,.doc,.docx',
    showUploadList: false,
    beforeUpload: (file) => {
      const isAllowed = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.type);

      if (!isAllowed) {
        message.error(`${file.name} 不是支持的文件格式`);
        return false;
      }

      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error('文件大小不能超过 50MB');
        return false;
      }

      return true;
    },
    customRequest: async ({ file, onSuccess }) => {
      setUploading(true);
      const fileObj = file as File;

      const newFile: KnowledgeFile = {
        id: Date.now(),
        filename: fileObj.name,
        file_type: fileObj.name.split('.').pop() || 'unknown',
        file_size: fileObj.size,
        status: 'uploading',
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setFiles((prev) => [newFile, ...prev]);

      await new Promise((resolve) => setTimeout(resolve, 500));

      setFiles((prev) =>
        prev.map((f) =>
          f.id === newFile.id ? { ...f, status: 'parsing' as const, progress: 0 } : f
        )
      );

      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setFiles((prev) =>
          prev.map((f) => (f.id === newFile.id ? { ...f, progress: i } : f))
        );
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === newFile.id
            ? {
                ...f,
                status: 'ready' as const,
                progress: 100,
                hash: '0x' + Math.random().toString(16).slice(2, 18) + '...',
                tx_hash: '0x' + Math.random().toString(16).slice(2, 18) + '...',
                chunk_count: Math.floor(Math.random() * 50) + 5,
              }
            : f
        )
      );

      setUploading(false);
      message.success(`${fileObj.name} 上传并解析成功！`);
      onSuccess?.(null);
    },
  };

  // 删除文件
  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后，该文件将从知识库中移除，相关的向量数据也会被清除。确定要删除吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        message.success('文件已删除');
      },
    });
  };

  // 查看详情
  const handleViewDetail = (file: KnowledgeFile) => {
    setDetailModal({ open: true, file });
  };

  // 表格列定义
  const columns: ColumnsType<KnowledgeFile> = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (filename: string, record) => (
        <Space>
          {getFileIcon(record.file_type)}
          <Text strong style={{ maxWidth: 200 }} ellipsis={{ tooltip: filename }}>
            {filename}
          </Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 80,
      render: (type: string) => <Tag>{type.toUpperCase()}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: KnowledgeFile['status'], record) => (
        <div>
          {getStatusTag(status, record.progress)}
          {status === 'parsing' && (
            <Progress
              percent={record.progress}
              size="small"
              showInfo={false}
              style={{ width: 80, marginTop: 4 }}
            />
          )}
        </div>
      ),
    },
    {
      title: '链上哈希',
      dataIndex: 'tx_hash',
      key: 'tx_hash',
      width: 160,
      render: (hash: string) =>
        hash ? (
          <Tooltip title={hash}>
            <Tag icon={<SafetyCertificateOutlined />} color="green" style={{ cursor: 'pointer' }}>
              {hash.slice(0, 10)}...
            </Tag>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '切片数',
      dataIndex: 'chunk_count',
      key: 'chunk_count',
      width: 80,
      render: (count: number) => count || '-',
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time: string) => time.slice(0, 16),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
              disabled={record.status !== 'ready'}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 统计信息
  const stats = {
    total: files.length,
    ready: files.filter((f) => f.status === 'ready').length,
    parsing: files.filter((f) => f.status === 'parsing').length,
    failed: files.filter((f) => f.status === 'failed').length,
  };

  return (
    <MainLayout sessions={MOCK_SESSIONS}>
      <Content
        style={{
          padding: '74px 24px 24px 24px',
          background: '#f5f5f5',
          overflowY: 'auto',
          height: '100%',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* 页面标题 */}
          <div style={{ marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 8 }}>
              知识库管理
            </Title>
            <Text type="secondary">
              上传私有文档，系统将自动计算哈希并上链存证，支持 RAG 检索增强生成
            </Text>
          </div>

          {/* 统计卡片 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Card size="small">
              <Text type="secondary">总文件数</Text>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{stats.total}</div>
            </Card>
            <Card size="small">
              <Text type="secondary">已就绪</Text>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{stats.ready}</div>
            </Card>
            <Card size="small">
              <Text type="secondary">解析中</Text>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{stats.parsing}</div>
            </Card>
            <Card size="small">
              <Text type="secondary">失败</Text>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>{stats.failed}</div>
            </Card>
          </div>

          {/* 上传区域 */}
          <Card style={{ marginBottom: 24 }}>
            <Dragger {...uploadProps} style={{ padding: '20px 0' }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#10a37f', fontSize: 48 }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 16 }}>
                点击或拖拽文件到此区域上传
              </p>
              <p className="ant-upload-hint" style={{ color: '#999' }}>
                支持 PDF、TXT、DOC、DOCX 格式，单文件最大 50MB
              </p>
              <p className="ant-upload-hint" style={{ color: '#10a37f', marginTop: 8 }}>
                <SafetyCertificateOutlined /> 上传后将自动计算文件哈希并存证上链
              </p>
            </Dragger>
          </Card>

          {/* 文件列表 */}
          <Card title="文件列表" extra={<Text type="secondary">{files.length} 个文件</Text>}>
            <Table
              columns={columns}
              dataSource={files}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total) => `共 ${total} 个文件`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无文件，请上传文档"
                  />
                ),
              }}
            />
          </Card>
        </div>

        {/* 详情弹窗 */}
        <Modal
          title="文件详情"
          open={detailModal.open}
          onCancel={() => setDetailModal({ open: false, file: null })}
          footer={[
            <Button key="close" onClick={() => setDetailModal({ open: false, file: null })}>
              关闭
            </Button>,
          ]}
          width={600}
        >
          {detailModal.file && (
            <div style={{ padding: '16px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px 16px' }}>
                <Text type="secondary">文件名</Text>
                <Text strong>{detailModal.file.filename}</Text>

                <Text type="secondary">文件类型</Text>
                <Tag>{detailModal.file.file_type.toUpperCase()}</Tag>

                <Text type="secondary">文件大小</Text>
                <Text>{formatFileSize(detailModal.file.file_size)}</Text>

                <Text type="secondary">状态</Text>
                {getStatusTag(detailModal.file.status)}

                <Text type="secondary">切片数量</Text>
                <Text>{detailModal.file.chunk_count || '-'} 个文本块</Text>

                <Text type="secondary">文件哈希</Text>
                <Text copyable code style={{ fontSize: 12 }}>
                  {detailModal.file.hash || '-'}
                </Text>

                <Text type="secondary">链上交易</Text>
                <Text copyable code style={{ fontSize: 12 }}>
                  {detailModal.file.tx_hash || '-'}
                </Text>

                <Text type="secondary">上传时间</Text>
                <Text>{detailModal.file.created_at}</Text>

                <Text type="secondary">更新时间</Text>
                <Text>{detailModal.file.updated_at}</Text>
              </div>

              {detailModal.file.tx_hash && (
                <div style={{ marginTop: 24, padding: 16, background: '#f6ffed', borderRadius: 8 }}>
                  <SafetyCertificateOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  <Text style={{ color: '#52c41a' }}>
                    该文件已完成区块链存证，哈希值不可篡改
                  </Text>
                </div>
              )}
            </div>
          )}
        </Modal>
      </Content>
    </MainLayout>
  );
};

export default KnowledgePage;
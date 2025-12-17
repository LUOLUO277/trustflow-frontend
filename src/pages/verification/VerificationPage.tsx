import React, { useState } from 'react';
import {
  Layout,
  Card,
  Tabs,
  Input,
  Button,
  Upload,
  Typography,
  Tag,
  Progress,
  Collapse,
  Descriptions,
  Space,
  Spin,
  Result,
  message,
  Tooltip,
} from 'antd';
import {
  FileTextOutlined,
  PictureOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InboxOutlined,
  CopyOutlined,
  ExportOutlined,
  BlockOutlined,
  ClockCircleOutlined,
  UserOutlined,
  RobotOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

// 验证模式类型
type VerificationMode = 'text' | 'image' | 'hash';

// 验证状态类型
type VerificationStatus = 'idle' | 'loading' | 'success' | 'risky' | 'fail';

// 文本验证结果
interface TextVerificationResult {
  status: 'success' | 'risky' | 'fail';
  verification_type: 'semantic_similarity';
  check_result: {
    similarity_score: number;
    is_tampered: boolean;
  };
  matched_record?: {
    record_id: number;
    tx_hash: string;
    created_at: string;
    model_name: string;
    original_content: string;
  };
}

// 图片验证结果
interface ImageVerificationResult {
  status: 'success' | 'fail';
  verification_type: 'invisible_watermark';
  check_result?: {
    has_watermark: boolean;
    extracted_data: string;
    chain_record_found: boolean;
  };
  original_record?: {
    record_id: number;
    created_at: string;
    creator_wallet: string;
    prompt: string;
  };
  message?: string;
}

// Hash查询结果
interface HashLookupResult {
  record_id: number;
  content_preview: string;
  created_at: string;
  model_name: string;
  blockchain_explorer_url: string;
  tx_hash: string;
  citations: Array<{
    doc_name: string;
    page: number;
    hash: string;
  }>;
  parent_hash?: string;
  model_params?: {
    temperature: number;
    max_tokens: number;
  };
}

const VerificationPage: React.FC = () => {
  // 状态管理
  const [mode, setMode] = useState<VerificationMode>('text');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [textInput, setTextInput] = useState('');
  const [hashInput, setHashInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // 结果状态
  const [textResult, setTextResult] = useState<TextVerificationResult | null>(null);
  const [imageResult, setImageResult] = useState<ImageVerificationResult | null>(null);
  const [hashResult, setHashResult] = useState<HashLookupResult | null>(null);

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  // 模拟文本验证
  const handleTextVerify = async () => {
    if (!textInput.trim()) {
      message.warning('请输入待验证的文本内容');
      return;
    }
    
    setStatus('loading');
    
    // 模拟API请求
    await new Promise(r => setTimeout(r, 1500));
    
    // 模拟返回结果
    const mockResult: TextVerificationResult = {
      status: Math.random() > 0.3 ? 'success' : (Math.random() > 0.5 ? 'risky' : 'fail'),
      verification_type: 'semantic_similarity',
      check_result: {
        similarity_score: 0.92 + Math.random() * 0.08,
        is_tampered: Math.random() > 0.8,
      },
      matched_record: {
        record_id: 8002,
        tx_hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        created_at: new Date().toISOString(),
        model_name: 'TrustFlow-V1',
        original_content: textInput.slice(0, 200) + (textInput.length > 200 ? '...' : ''),
      }
    };
    
    setTextResult(mockResult);
    setStatus(mockResult.status);
  };

  // 模拟图片验证
  const handleImageVerify = async () => {
    if (!uploadedFile) {
      message.warning('请先上传图片');
      return;
    }
    
    setStatus('loading');
    
    await new Promise(r => setTimeout(r, 2000));
    
    const isSuccess = Math.random() > 0.3;
    
    const mockResult: ImageVerificationResult = isSuccess ? {
      status: 'success',
      verification_type: 'invisible_watermark',
      check_result: {
        has_watermark: true,
        extracted_data: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        chain_record_found: true,
      },
      original_record: {
        record_id: 8005,
        created_at: new Date().toISOString(),
        creator_wallet: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        prompt: '一只赛博朋克风格的机械猫，霓虹灯光效果，高清细节',
      }
    } : {
      status: 'fail',
      verification_type: 'invisible_watermark',
      message: '未检测到有效的水印信息，该图片可能非本平台生成或已被严重破坏。'
    };
    
    setImageResult(mockResult);
    setStatus(mockResult.status);
  };

  // 模拟Hash查询
  const handleHashLookup = async () => {
    if (!hashInput.trim()) {
      message.warning('请输入交易哈希');
      return;
    }
    
    if (!hashInput.startsWith('0x')) {
      message.warning('请输入有效的交易哈希（以 0x 开头）');
      return;
    }
    
    setStatus('loading');
    
    await new Promise(r => setTimeout(r, 1000));
    
    const mockResult: HashLookupResult = {
      record_id: 8002,
      content_preview: 'TrustFlow 的核心技术包括区块链存证、语义指纹、隐形水印三大模块，确保每一条 AI 生成内容都可追溯、可验证、不可篡改...',
      created_at: new Date().toISOString(),
      model_name: 'TrustFlow-V1',
      blockchain_explorer_url: `https://sepolia.etherscan.io/tx/${hashInput}`,
      tx_hash: hashInput,
      citations: [
        { doc_name: 'TrustFlow技术白皮书.pdf', page: 12, hash: '0x' + Math.random().toString(16).slice(2, 18) },
        { doc_name: '区块链溯源方案.docx', page: 5, hash: '0x' + Math.random().toString(16).slice(2, 18) },
      ],
      parent_hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      model_params: {
        temperature: 0.7,
        max_tokens: 2048,
      }
    };
    
    setHashResult(mockResult);
    setStatus('success');
  };

  // 重置状态
  const handleReset = () => {
    setStatus('idle');
    setTextResult(null);
    setImageResult(null);
    setHashResult(null);
    setTextInput('');
    setHashInput('');
    setUploadedFile(null);
  };

  // 渲染状态标签
  const renderStatusTag = (resultStatus: 'success' | 'risky' | 'fail') => {
    switch (resultStatus) {
      case 'success':
        return <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 14, padding: '4px 12px' }}>✅ 验证通过 - 原文匹配</Tag>;
      case 'risky':
        return <Tag icon={<WarningOutlined />} color="warning" style={{ fontSize: 14, padding: '4px 12px' }}>⚠️ 高度相似 - 可能被修改</Tag>;
      case 'fail':
        return <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: 14, padding: '4px 12px' }}>❌ 验证失败 - 未找到记录</Tag>;
    }
  };

  // 渲染文本验证结果
  const renderTextResult = () => {
    if (!textResult) return null;
    
    return (
      <div style={{ marginTop: 24 }}>
        {/* 结果总览卡 */}
        <Card 
          style={{ 
            marginBottom: 16,
            background: textResult.status === 'success' ? '#f6ffed' : 
                       textResult.status === 'risky' ? '#fffbe6' : '#fff2f0',
            borderColor: textResult.status === 'success' ? '#b7eb8f' : 
                        textResult.status === 'risky' ? '#ffe58f' : '#ffccc7',
          }}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {renderStatusTag(textResult.status)}
            <Paragraph style={{ marginTop: 16, marginBottom: 0, fontSize: 16 }}>
              {textResult.status === 'success' && '内容与平台原始生成记录高度一致'}
              {textResult.status === 'risky' && '内容与平台记录相似，但可能存在修改'}
              {textResult.status === 'fail' && '未在平台中找到匹配的生成记录'}
            </Paragraph>
          </div>
        </Card>

        {/* 核心指标 */}
        {textResult.check_result && (
          <Card title="核心指标" size="small" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">语义相似度</Text>
              <Progress 
                percent={Math.round(textResult.check_result.similarity_score * 100)} 
                status={textResult.check_result.similarity_score > 0.95 ? 'success' : 
                       textResult.check_result.similarity_score > 0.8 ? 'normal' : 'exception'}
                strokeColor={textResult.check_result.similarity_score > 0.95 ? '#52c41a' : 
                            textResult.check_result.similarity_score > 0.8 ? '#1890ff' : '#ff4d4f'}
              />
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <Text type="secondary">是否被篡改：</Text>
                <Text strong style={{ color: textResult.check_result.is_tampered ? '#ff4d4f' : '#52c41a' }}>
                  {textResult.check_result.is_tampered ? '是' : '否'}
                </Text>
              </div>
            </div>
          </Card>
        )}

        {/* 匹配记录详情 */}
        {textResult.matched_record && (
          <Collapse 
            items={[{
              key: 'record',
              label: <span><FileSearchOutlined style={{ marginRight: 8 }} />匹配的原始记录</span>,
              children: (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="记录 ID">{textResult.matched_record.record_id}</Descriptions.Item>
                  <Descriptions.Item label="生成时间">
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {new Date(textResult.matched_record.created_at).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="模型名称">
                    <RobotOutlined style={{ marginRight: 4 }} />
                    {textResult.matched_record.model_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="交易哈希">
                    <Space>
                      <Text code style={{ fontSize: 12 }}>
                        {textResult.matched_record.tx_hash.slice(0, 20)}...
                      </Text>
                      <Tooltip title="复制完整哈希">
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(textResult.matched_record!.tx_hash)}
                        />
                      </Tooltip>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="原始内容">
                    <Paragraph 
                      ellipsis={{ rows: 3, expandable: true }} 
                      style={{ marginBottom: 0, background: '#fafafa', padding: 12, borderRadius: 8 }}
                    >
                      {textResult.matched_record.original_content}
                    </Paragraph>
                  </Descriptions.Item>
                </Descriptions>
              )
            }]}
          />
        )}
      </div>
    );
  };

  // 渲染图片验证结果
  const renderImageResult = () => {
    if (!imageResult) return null;
    
    if (imageResult.status === 'fail') {
      return (
        <Result
          status="warning"
          title="未检测到有效水印"
          subTitle={imageResult.message}
          style={{ marginTop: 24 }}
        />
      );
    }
    
    return (
      <div style={{ marginTop: 24 }}>
        {/* 结果总览 */}
        <Card 
          style={{ 
            marginBottom: 16,
            background: '#f6ffed',
            borderColor: '#b7eb8f',
          }}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 14, padding: '4px 12px' }}>
              ✅ 检测到隐形水印
            </Tag>
            <br />
            <Tag icon={<SafetyCertificateOutlined />} color="green" style={{ fontSize: 14, padding: '4px 12px', marginTop: 8 }}>
              ✅ 已定位链上存证记录
            </Tag>
          </div>
        </Card>

        {/* 关键信息 */}
        {imageResult.check_result && (
          <Card title="提取的水印信息" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="提取的 TxHash">
                <Space>
                  <Text code style={{ fontSize: 12, color: '#10a37f', fontWeight: 600 }}>
                    {imageResult.check_result.extracted_data.slice(0, 30)}...
                  </Text>
                  <Tooltip title="复制完整哈希">
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(imageResult.check_result!.extracted_data)}
                    />
                  </Tooltip>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 生成上下文 */}
        {imageResult.original_record && (
          <Collapse 
            items={[{
              key: 'context',
              label: <span><BlockOutlined style={{ marginRight: 8 }} />生成上下文</span>,
              children: (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="记录 ID">{imageResult.original_record.record_id}</Descriptions.Item>
                  <Descriptions.Item label="创作者钱包">
                    <Space>
                      <UserOutlined />
                      <Text code style={{ fontSize: 12 }}>
                        {imageResult.original_record.creator_wallet.slice(0, 10)}...{imageResult.original_record.creator_wallet.slice(-8)}
                      </Text>
                      <Tooltip title="复制地址">
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(imageResult.original_record!.creator_wallet)}
                        />
                      </Tooltip>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="生成时间">
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {new Date(imageResult.original_record.created_at).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="生成 Prompt">
                    <Paragraph 
                      style={{ marginBottom: 0, background: '#fafafa', padding: 12, borderRadius: 8 }}
                    >
                      {imageResult.original_record.prompt}
                    </Paragraph>
                  </Descriptions.Item>
                </Descriptions>
              )
            }]}
          />
        )}
      </div>
    );
  };

  // 渲染Hash查询结果
  const renderHashResult = () => {
    if (!hashResult) return null;
    
    return (
      <div style={{ marginTop: 24 }}>
        {/* 摘要卡 */}
        <Card 
          style={{ 
            marginBottom: 16,
            background: '#f6ffed',
            borderColor: '#b7eb8f',
          }}
        >
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 14, padding: '4px 12px' }}>
              ✅ 链上记录查询成功
            </Tag>
          </div>
        </Card>

        {/* 基本信息 */}
        <Card title="存证摘要" size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="内容预览">
              <Paragraph 
                ellipsis={{ rows: 2, expandable: true }} 
                style={{ marginBottom: 0 }}
              >
                {hashResult.content_preview}
              </Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="生成时间">
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {new Date(hashResult.created_at).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="模型名称">
              <RobotOutlined style={{ marginRight: 4 }} />
              {hashResult.model_name}
            </Descriptions.Item>
            <Descriptions.Item label="交易哈希">
              <Space>
                <Text code style={{ fontSize: 12 }}>
                  {hashResult.tx_hash.slice(0, 30)}...
                </Text>
                <Tooltip title="复制">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(hashResult.tx_hash)}
                  />
                </Tooltip>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="区块链浏览器">
              <Button 
                type="link" 
                icon={<ExportOutlined />} 
                href={hashResult.blockchain_explorer_url}
                target="_blank"
                style={{ padding: 0 }}
              >
                在 Etherscan 查看
              </Button>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 引用来源 */}
        {hashResult.citations.length > 0 && (
          <Collapse 
            style={{ marginBottom: 16 }}
            items={[{
              key: 'citations',
              label: <span><FileTextOutlined style={{ marginRight: 8 }} />引用来源 ({hashResult.citations.length})</span>,
              children: (
                <div>
                  {hashResult.citations.map((cite, idx) => (
                    <Card key={idx} size="small" style={{ marginBottom: 8 }}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text strong>{cite.doc_name}</Text>
                        <Text type="secondary">页码: {cite.page}</Text>
                        <Text code style={{ fontSize: 11 }}>Hash: {cite.hash}</Text>
                      </Space>
                    </Card>
                  ))}
                </div>
              )
            }]}
          />
        )}

        {/* 完整溯源信息 */}
        <Collapse 
          items={[{
            key: 'trace',
            label: <span><BlockOutlined style={{ marginRight: 8 }} />完整溯源信息</span>,
            children: (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="记录 ID">{hashResult.record_id}</Descriptions.Item>
                {hashResult.parent_hash && (
                  <Descriptions.Item label="父对话 Hash">
                    <Text code style={{ fontSize: 12 }}>{hashResult.parent_hash.slice(0, 30)}...</Text>
                  </Descriptions.Item>
                )}
                {hashResult.model_params && (
                  <>
                    <Descriptions.Item label="Temperature">{hashResult.model_params.temperature}</Descriptions.Item>
                    <Descriptions.Item label="Max Tokens">{hashResult.model_params.max_tokens}</Descriptions.Item>
                  </>
                )}
              </Descriptions>
            )
          }]}
        />
      </div>
    );
  };

  // Tab 配置
  const tabItems = [
    {
      key: 'text',
      label: (
        <span>
          <FileTextOutlined />
          文本验证
        </span>
      ),
      children: (
        <div>
          <TextArea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="粘贴待验证的文本内容，系统将检测其是否由 TrustFlow 生成或是否被篡改"
            rows={6}
            style={{ marginBottom: 16, fontSize: 15 }}
            disabled={status === 'loading'}
          />
          <Button 
            type="primary" 
            size="large"
            icon={<SafetyCertificateOutlined />}
            onClick={handleTextVerify}
            loading={status === 'loading'}
            style={{ background: '#10a37f', borderColor: '#10a37f' }}
            block
          >
            验证文本
          </Button>
          {renderTextResult()}
        </div>
      ),
    },
    {
      key: 'image',
      label: (
        <span>
          <PictureOutlined />
          图片验证
        </span>
      ),
      children: (
        <div>
          <Dragger
            accept="image/*"
            maxCount={1}
            beforeUpload={(file) => {
              setUploadedFile(file);
              return false;
            }}
            onRemove={() => setUploadedFile(null)}
            disabled={status === 'loading'}
            style={{ marginBottom: 16 }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#10a37f', fontSize: 48 }} />
            </p>
            <p className="ant-upload-text">点击或拖拽图片到此区域</p>
            <p className="ant-upload-hint" style={{ color: '#999' }}>
              系统将尝试从图片中提取隐形区块链水印
            </p>
          </Dragger>
          <Button 
            type="primary" 
            size="large"
            icon={<SafetyCertificateOutlined />}
            onClick={handleImageVerify}
            loading={status === 'loading'}
            disabled={!uploadedFile}
            style={{ background: '#10a37f', borderColor: '#10a37f' }}
            block
          >
            提取水印并验证
          </Button>
          {renderImageResult()}
        </div>
      ),
    },
    {
      key: 'hash',
      label: (
        <span>
          <LinkOutlined />
          Hash 查询
        </span>
      ),
      children: (
        <div>
          <Input
            value={hashInput}
            onChange={e => setHashInput(e.target.value)}
            placeholder="请输入区块链交易哈希（TxHash），以 0x 开头"
            size="large"
            style={{ marginBottom: 16 }}
            prefix={<LinkOutlined style={{ color: '#999' }} />}
            disabled={status === 'loading'}
          />
          <Button 
            type="primary" 
            size="large"
            icon={<FileSearchOutlined />}
            onClick={handleHashLookup}
            loading={status === 'loading'}
            style={{ background: '#10a37f', borderColor: '#10a37f' }}
            block
          >
            查询链上记录
          </Button>
          {renderHashResult()}
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* 页面头部 */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ 
              display: 'inline-flex',
              background: 'linear-gradient(135deg, #10a37f 0%, #1a7f5a 100%)', 
              padding: 20, 
              borderRadius: '20px', 
              marginBottom: 20 
            }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#fff' }} />
            </div>
            <Title level={2} style={{ marginBottom: 8 }}>
              TrustFlow 验证中心
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              第三方内容验真台 —— 不登录、不信任，只看证据
            </Text>
            <div style={{ marginTop: 16 }}>
              <Space>
                <Tag color="green">无需登录</Tag>
                <Tag color="blue">公开透明</Tag>
                <Tag color="purple">链上可查</Tag>
              </Space>
            </div>
          </div>

          {/* 验证卡片 */}
          <Card 
            style={{ 
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              borderRadius: 16,
            }}
          >
            {status !== 'idle' && status !== 'loading' && (
              <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <Button onClick={handleReset}>重新验证</Button>
              </div>
            )}
            
            <Tabs 
              activeKey={mode}
              onChange={(key) => {
                setMode(key as VerificationMode);
                handleReset();
              }}
              items={tabItems}
              size="large"
            />
          </Card>

          {/* 底部说明 */}
          <div style={{ textAlign: 'center', marginTop: 40, color: '#999' }}>
            <Text type="secondary">
              验证结果仅供参考，最终确权请以链上记录为准
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Powered by TrustFlow · 区块链可信溯源系统
            </Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default VerificationPage;
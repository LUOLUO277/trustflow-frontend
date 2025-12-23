import React, { useState } from 'react';
import {
  Layout, Card, Tabs, Input, Button, Upload, Typography, Tag, Progress,
  Collapse, Descriptions, Space, message, Timeline, Empty, Divider, Tooltip
} from 'antd';
import {
  FileTextOutlined, PictureOutlined, LinkOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InboxOutlined,
  ExportOutlined, NodeIndexOutlined, ReadOutlined, KeyOutlined,
  ClockCircleOutlined, SearchOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import api from '../../services/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

// 【配置】后端地址
const API_BASE_URL = 'http://localhost:8080';
const PRIMARY_COLOR = '#10a37f'; // TrustFlow 主题绿

const VerificationPage: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'image' | 'hash'>('text');
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [hashInput, setHashInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadFile | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  // 切换模式清空数据
  const handleModeChange = (newMode: string) => {
    setMode(newMode as any);
    setResultData(null);
  };

  // 1. 验证接口调用 (Text/Image)
  const handleCheck = async (type: 'text' | 'image') => {
    if (type === 'text' && !textInput.trim()) {
      message.warning('请输入验证内容');
      return;
    }
    if (type === 'image' && !uploadedFile) {
      message.warning('请上传图片');
      return;
    }

    setLoading(true);
    setResultData(null);

    const formData = new FormData();
    formData.append('type', type);
    if (type === 'text') formData.append('text', textInput);
    if (type === 'image') formData.append('file', uploadedFile as any);

    try {
      const data = await api.post('/verify/check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log("✅ 验证结果:", data);
      if (data && data.status) {
        setResultData(data);
        message.success(data.status === 'success' ? '验证通过！' : '验证完成');
      } else {
        message.error('响应数据异常');
      }
    } catch (err: any) {
      console.error("验证失败:", err);
      message.error(err.response?.data?.message || '验证失败');
    } finally {
      setLoading(false);
    }
  };

  // 2. Hash 查询接口调用
  const handleHashLookup = async () => {
    if (!hashInput.trim() || !hashInput.startsWith('0x')) {
      message.warning('请输入正确的交易哈希 (0x开头)');
      return;
    }
    setLoading(true);
    setResultData(null);
    try {
      const data = await api.get(`/verify/tx/${hashInput}`);
      if (data && data.tx_hash) {
        setResultData({
          status: 'success',
          verification_type: 'hash_lookup',
          matched_record: data,
          citations: data.citations || [],
          dialog_chain: data.dialog_chain || [],
          blockchain_explorer_url: data.blockchain_explorer_url
        });
        message.success('查询成功');
      } else {
        message.error('未找到记录');
      }
    } catch (err) {
      message.error('查询失败，请检查哈希值');
    } finally {
      setLoading(false);
    }
  };

  // 3. 点击引用跳转 PDF
  const handleCitationClick = (citation: any) => {
    let targetUrl = '';
    if (citation.url) {
      targetUrl = citation.url.startsWith('http') ? citation.url : `${API_BASE_URL}${citation.url}`;
    } else if (citation.download_url) {
      const baseUrl = citation.download_url.startsWith('http') ? citation.download_url : `${API_BASE_URL}${citation.download_url}`;
      targetUrl = `${baseUrl}#page=${citation.page || 1}`;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank');
    } else {
      message.warning('无法预览该文档 (缺少 URL)');
    }
  };

  // 4. 渲染结果区域
  const renderVerificationResult = () => {
    if (!resultData) return null;

    const { status, verification_type, check_result } = resultData;
    const matched_record = resultData.matched_record;
    const original_record = resultData.original_record;
    
    const citations = resultData.citations || matched_record?.citations || [];
    const dialog_chain = resultData.dialog_chain || matched_record?.dialog_chain || [];
    const blockchain_explorer_url = resultData.blockchain_explorer_url;
    const record = matched_record || original_record || resultData;

    // 构建时间轴数据：历史节点 + 当前节点
    const timelineItems = (dialog_chain || []).map((item: any, i: number) => ({
      color: 'gray',
      dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
      children: (
        <div style={{ paddingBottom: 10 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>历史节点 #{i + 1}</Text>
          <div style={{ 
            fontFamily: 'monospace', 
            background: '#f5f5f5', 
            padding: '4px 8px', 
            borderRadius: 4, 
            fontSize: 12, 
            marginTop: 4,
            color: '#666'
          }}>
            {item.tx_hash}
          </div>
        </div>
      )
    }));

    // 如果有当前记录，将其追加到时间轴末尾并高亮
    if (record && record.tx_hash) {
      timelineItems.push({
        color: PRIMARY_COLOR,
        dot: <SafetyCertificateOutlined style={{ fontSize: '20px', color: PRIMARY_COLOR }} />,
        children: (
          <div style={{ paddingBottom: 10 }}>
             <Tag color={PRIMARY_COLOR} style={{ marginBottom: 8 }}>当前验证节点 (Latest)</Tag>
             <div style={{ 
                fontFamily: 'monospace', 
                background: '#e6fffa', 
                border: `1px solid ${PRIMARY_COLOR}`,
                padding: '8px 12px', 
                borderRadius: 6, 
                fontSize: 13, 
                fontWeight: 600,
                color: '#333'
             }}>
               <KeyOutlined style={{ marginRight: 6 }}/>
               {record.tx_hash}
             </div>
             <div style={{ marginTop: 4, fontSize: 12, color: PRIMARY_COLOR }}>
               生成时间: {record.created_at ? new Date(record.created_at).toLocaleString() : 'Just now'}
             </div>
          </div>
        )
      });
    }

    return (
      <div style={{ marginTop: 32, animation: 'fadeIn 0.5s ease' }}>
        <Divider orientation="center" style={{ color: '#999', fontSize: 14 }}>验证报告</Divider>

        {/* A. 状态卡片 */}
        <div style={{ 
          background: status === 'success' ? '#f6ffed' : (status === 'risky' ? '#fffbe6' : '#fff2f0'),
          border: `1px solid ${status === 'success' ? '#b7eb8f' : (status === 'risky' ? '#ffe58f' : '#ffccc7')}`,
          borderRadius: 12,
          padding: '24px',
          textAlign: 'center',
          marginBottom: 24
        }}>
           {status === 'success' ? (
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
            ) : status === 'risky' ? (
              <CheckCircleOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 12 }} />
            ) : (
              <CloseCircleOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 12 }} />
            )}
            <Title level={4} style={{ margin: 0 }}>
              {status === 'success' ? '存证验证通过' : (status === 'risky' ? '存在风险' : '验证失败')}
            </Title>
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
               {status === 'success' 
                 ? `已在区块链上成功定位到原始记录 (${verification_type === 'invisible_watermark' ? '隐形水印' : '内容哈希'})` 
                 : '无法在链上找到完全匹配的记录，内容可能已被修改。'}
            </Text>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* B. 核心指标 */}
            <Card size="small" title="置信度分析" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: 12 }}>
                {check_result && verification_type === 'semantic_similarity' ? (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <Progress 
                          type="dashboard" 
                          percent={Math.round((check_result.similarity_score || 0) * 100)} 
                          strokeColor={PRIMARY_COLOR}
                          width={100}
                        />
                        <div style={{ marginTop: 8 }}>语义相似度</div>
                    </div>
                ) : check_result && verification_type === 'invisible_watermark' ? (
                    <Descriptions column={1} size="small" layout="vertical">
                      <Descriptions.Item label="水印检测状态">
                        {check_result.has_watermark ? <Tag color="success">Verified</Tag> : <Tag color="default">Not Found</Tag>}
                      </Descriptions.Item>
                      {check_result.extracted_data && (
                        <Descriptions.Item label="提取 Payload">
                          <Text code copyable>{check_result.extracted_data}</Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无分析数据" />
                )}
            </Card>

            {/* C. 存证元数据 */}
            <Card size="small" title="链上元数据" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: 12 }}>
                {status === 'success' && record ? (
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Record ID">{record.record_id}</Descriptions.Item>
                      <Descriptions.Item label="Timestamp">{record.created_at ? new Date(record.created_at).toLocaleDateString() : '-'}</Descriptions.Item>
                      {blockchain_explorer_url && (
                        <Descriptions.Item label="Explorer">
                          <Button type="link" size="small" href={blockchain_explorer_url} target="_blank" style={{ padding: 0, height: 'auto' }}>
                            View on Etherscan <ArrowRightOutlined />
                          </Button>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </Card>
        </div>

        {/* D. 引用与溯源 */}
        {(citations.length > 0 || timelineItems.length > 0) && (
           <Card bordered={false} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderRadius: 12 }}>
              <Tabs items={[
                  citations.length > 0 ? {
                      key: 'cite',
                      label: <span><ReadOutlined /> 证据来源 ({citations.length})</span>,
                      children: (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
                            {citations.map((c: any, i: number) => (
                                <div 
                                    key={i} 
                                    onClick={() => handleCitationClick(c)}
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: '8px',
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        border: '1px solid #eef0f2',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = PRIMARY_COLOR; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 163, 127, 0.1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eef0f2'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <FileTextOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                                            <Text strong style={{ fontSize: 14, color: '#333' }}>{c.file_name}</Text>
                                        </div>
                                        <Tag color="cyan">Match: {Math.round(c.score * 100)}%</Tag>
                                    </div>
                                    
                                    <div style={{ 
                                        fontSize: 13, color: '#666', lineHeight: '1.6', 
                                        background: '#fafafa', padding: '8px', borderRadius: 6, marginBottom: 8,
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                    }}>
                                        {c.text_snippet || "暂无摘要..."}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#999' }}>
                                        <span>Page {c.page || 'N/A'}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', color: PRIMARY_COLOR, gap: 4 }}>
                                            View Document <LinkOutlined />
                                        </span>
                                    </div>
                                </div>
                            ))}
                          </div>
                      )
                  } : null,
                  timelineItems.length > 0 ? {
                      key: 'chain',
                      label: <span><NodeIndexOutlined /> 全链路存证溯源</span>,
                      children: (
                          <div style={{ padding: '20px 10px' }}>
                             <Timeline items={timelineItems} />
                          </div>
                      )
                  } : null
              ].filter(Boolean) as any} />
           </Card>
        )}
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          
          {/* Header 区域 */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
             <div style={{ 
               width: 64, height: 64, margin: '0 auto 16px', 
               background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #1a7f5a 100%)`, 
               borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
               boxShadow: '0 8px 20px rgba(16, 163, 127, 0.3)'
             }}>
                <SafetyCertificateOutlined style={{ fontSize: 32, color: '#fff' }} />
             </div>
             <Title level={2} style={{ marginBottom: 8 }}>TrustFlow Verification</Title>
             <Text type="secondary" style={{ fontSize: 16 }}>去中心化内容验真与溯源平台</Text>
          </div>

          <Card 
            bordered={false} 
            style={{ 
              borderRadius: 24, 
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
              overflow: 'hidden'
            }}
            bodyStyle={{ padding: '32px' }}
          >
            <Tabs
              activeKey={mode}
              onChange={handleModeChange}
              centered
              size="large"
              tabBarStyle={{ marginBottom: 32 }}
              items={[
                {
                  key: 'text',
                  label: <span style={{ padding: '0 10px' }}><FileTextOutlined /> 文本验证</span>,
                  children: (
                    <div style={{ maxWidth: 600, margin: '0 auto' }}>
                      <TextArea 
                        rows={6} 
                        value={textInput} 
                        onChange={e => setTextInput(e.target.value)} 
                        placeholder="在此粘贴需要验证的文本内容..."
                        style={{ 
                          marginBottom: 20, borderRadius: 12, padding: 16, fontSize: 15,
                          border: '1px solid #e0e0e0', background: '#fafafa'
                        }}
                      />
                      <Button 
                        type="primary" block size="large" 
                        onClick={() => handleCheck('text')} 
                        loading={loading}
                        style={{ background: PRIMARY_COLOR, height: 48, fontSize: 16, borderRadius: 12 }}
                      >
                        开始深度验证
                      </Button>
                    </div>
                  )
                },
                {
                  key: 'image',
                  label: <span style={{ padding: '0 10px' }}><PictureOutlined /> 图片验证</span>,
                  children: (
                    <div style={{ maxWidth: 600, margin: '0 auto' }}>
                      <Dragger 
                        maxCount={1}
                        beforeUpload={(f) => { setUploadedFile(f as any); return false; }}
                        onRemove={() => setUploadedFile(null)}
                        style={{ background: '#fafafa', border: '2px dashed #d9d9d9', borderRadius: 16, padding: '20px 0' }}
                      >
                        <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: PRIMARY_COLOR }} /></p>
                        <p className="ant-upload-text" style={{ fontSize: 16 }}>点击或拖拽上传图片</p>
                        <p className="ant-upload-hint">支持 JPG, PNG 格式，自动提取隐形水印</p>
                      </Dragger>
                      <Button 
                        type="primary" block size="large" 
                        style={{ marginTop: 24, background: PRIMARY_COLOR, height: 48, fontSize: 16, borderRadius: 12 }} 
                        disabled={!uploadedFile} 
                        onClick={() => handleCheck('image')} 
                        loading={loading}
                      >
                        验证水印与来源
                      </Button>
                    </div>
                  )
                },
                {
                  key: 'hash',
                  label: <span style={{ padding: '0 10px' }}><LinkOutlined /> Hash 溯源</span>,
                  children: (
                    <div style={{ maxWidth: 600, margin: '0 auto' }}>
                      <Input 
                        size="large" 
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="输入 0x 开头的交易 Hash" 
                        value={hashInput} 
                        onChange={e => setHashInput(e.target.value)} 
                        style={{ marginBottom: 20, borderRadius: 12, padding: '10px 16px', background: '#fafafa' }}
                      />
                      <Button 
                        type="primary" block size="large" 
                        onClick={handleHashLookup} 
                        loading={loading}
                        style={{ background: PRIMARY_COLOR, height: 48, fontSize: 16, borderRadius: 12 }}
                      >
                        执行链上查询
                      </Button>
                    </div>
                  )
                }
              ]}
            />
            
            {/* 结果区域 */}
            {renderVerificationResult()}
          </Card>
          
          <div style={{ textAlign: 'center', marginTop: 40, color: '#bbb' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Powered by TrustFlow Blockchain · Immutable & Verifiable</Text>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default VerificationPage;
import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Tabs, Input, Button, Upload, Typography, Tag, Progress,
  Collapse, Descriptions, Space, message, Timeline, Empty
} from 'antd';
import {
  FileTextOutlined, PictureOutlined, LinkOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InboxOutlined,
  ExportOutlined, NodeIndexOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const VerificationPage: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'image' | 'hash'>('text');
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [hashInput, setHashInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  // 切换验证方式时自动清空结果
  const handleModeChange = (newMode: string) => {
    setMode(newMode as any);
    setResultData(null); // 清空之前的结果
  };

  // 1. 核心验证逻辑
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
    setResultData(null); // 清空旧结果
    
    const formData = new FormData();
    formData.append('type', type);
    if (type === 'text') formData.append('text', textInput);
    if (type === 'image') formData.append('file', uploadedFile as File);

    try {
      // 注意：你的 api 拦截器已经返回了 response.data，所以 res 就是数据本身
      const data = await api.post('/verify/check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log("✅ API 返回数据:", data);
      
      if (data && data.status) {
        setResultData(data);
        message.success(data.status === 'success' ? '验证通过！' : '验证完成');
      } else {
        console.error("❌ 响应数据格式异常:", data);
        message.error('响应数据格式异常');
      }
    } catch (err: any) {
      console.error("❌ 验证失败:", err);
      message.error(err.response?.data?.message || '验证失败，请检查网络');
    } finally {
      setLoading(false);
    }
  };

  // 2. Hash 查询逻辑
  const handleHashLookup = async () => {
    if (!hashInput.trim()) {
      message.warning('请输入交易哈希');
      return;
    }
    if (!hashInput.startsWith('0x')) {
      message.warning('交易哈希必须以 0x 开头');
      return;
    }
    
    setLoading(true);
    setResultData(null);
    
    try {
      // 同样，data 就是响应数据本身
      const data = await api.get(`/verify/tx/${hashInput}`);
      
      console.log("✅ Hash 查询结果:", data);
      
      if (data && data.tx_hash) {
        // Hash 查询返回的数据结构不同，需要转换为统一格式
        const formattedData = {
          status: 'success',
          verification_type: 'hash_lookup',
          matched_record: data, // Hash 查询直接返回记录
          citations: data.citations || [],
          dialog_chain: data.dialog_chain || [],
          blockchain_explorer_url: data.blockchain_explorer_url
        };
        setResultData(formattedData);
        message.success('查询成功');
      } else {
        message.error('未找到该链上记录');
      }
    } catch (err: any) {
      console.error("❌ Hash 查询失败:", err);
      message.error('未找到该链上记录');
    } finally {
      setLoading(false);
    }
  };

  // 3. 渲染结果组件
  const renderVerificationResult = () => {
    if (!resultData) return null;

    const status = resultData.status;
    const verification_type = resultData.verification_type;
    const check_result = resultData.check_result;
    const matched_record = resultData.matched_record;
    const original_record = resultData.original_record;
    const citations = resultData.citations || [];
    const dialog_chain = resultData.dialog_chain || [];
    const blockchain_explorer_url = resultData.blockchain_explorer_url;

    // 根据验证类型选择正确的记录对象
    const record = matched_record || original_record || resultData;

    return (
      <div style={{ marginTop: 24 }}>
        {/* A. 状态头部 */}
        <Card style={{ 
          marginBottom: 16,
          background: status === 'success' ? '#f6ffed' : (status === 'risky' ? '#fffbe6' : '#fff2f0'),
          borderColor: status === 'success' ? '#b7eb8f' : (status === 'risky' ? '#ffe58f' : '#ffccc7'),
        }}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            {status === 'success' ? (
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
                验证通过 - {verification_type === 'invisible_watermark' ? '水印匹配' : '原文匹配'}
              </Tag>
            ) : status === 'risky' ? (
              <Tag color="warning" icon={<CheckCircleOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
                可疑内容 - 发现篡改迹象
              </Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
                验证失败 - 无记录
              </Tag>
            )}
            <Paragraph style={{ marginTop: 16, fontSize: 15, fontWeight: 500 }}>
              {status === 'success' 
                ? '该内容已成功定位链上存证，具备区块链不可篡改特性。' 
                : status === 'risky'
                ? '检测到内容可能被篡改，请谨慎对待。'
                : verification_type === 'invisible_watermark' 
                ? '该图片未检测到 TrustFlow 水印，可能不是由本平台生成。'
                : '该内容未在 TrustFlow 存证库中找到记录。'}
            </Paragraph>
          </div>
        </Card>

        {/* B. 核心指标 - 文本验证才显示 */}
        {check_result && verification_type === 'semantic_similarity' && check_result.similarity_score !== undefined && (
          <Card title="语义比对分析" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">语义相似度评分</Text>
                <Text strong>{Math.round((check_result.similarity_score || 0) * 100)}%</Text>
              </div>
              <Progress 
                percent={Math.round((check_result.similarity_score || 0) * 100)} 
                strokeColor={status === 'success' ? '#10a37f' : '#ff4d4f'}
                showInfo={false}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                判定结论：{check_result.is_tampered ? <Text type="danger">检测到篡改迹象</Text> : <Text style={{color: '#52c41a'}}>内容完整无误</Text>}
              </Text>
            </Space>
          </Card>
        )}

        {/* B2. 水印检测结果 - 图片验证才显示 */}
        {check_result && verification_type === 'invisible_watermark' && (
          <Card title="水印检测结果" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">水印状态</Text>
                <Tag color={check_result.has_watermark ? 'success' : 'default'}>
                  {check_result.has_watermark ? '已检测到水印' : '未检测到水印'}
                </Tag>
              </div>
              {check_result.extracted_data && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text type="secondary">提取的交易哈希</Text>
                  </div>
                  <Text code copyable style={{ fontSize: 11, display: 'block', wordBreak: 'break-all' }}>
                    {check_result.extracted_data}
                  </Text>
                </>
              )}
              {typeof check_result.chain_record_found === 'boolean' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text type="secondary">链上记录匹配</Text>
                  <Tag color={check_result.chain_record_found ? 'success' : 'error'}>
                    {check_result.chain_record_found ? '已找到' : '未找到'}
                  </Tag>
                </div>
              )}
            </Space>
          </Card>
        )}

        {/* C. 链上元数据 */}
        {status === 'success' && record && (record.record_id || record.tx_hash) && (
          <Card title={<span><SafetyCertificateOutlined /> 链上存证元数据</span>} size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" bordered>
              {record.record_id && (
                <Descriptions.Item label="记录 ID">{record.record_id}</Descriptions.Item>
              )}
              {record.model_name && (
                <Descriptions.Item label="生成模型">{record.model_name}</Descriptions.Item>
              )}
              {record.created_at && (
                <Descriptions.Item label="生成时间">
                  {new Date(record.created_at).toLocaleString('zh-CN', { 
                    year: 'numeric', month: '2-digit', day: '2-digit', 
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </Descriptions.Item>
              )}
              {record.prompt && (
                <Descriptions.Item label="生成提示词">
                  <Text style={{ wordBreak: 'break-word' }}>
                    {record.prompt}
                  </Text>
                </Descriptions.Item>
              )}
              {record.content_preview && (
                <Descriptions.Item label="内容预览">
                  <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: '展开' }} style={{ marginBottom: 0 }}>
                    {record.content_preview}
                  </Paragraph>
                </Descriptions.Item>
              )}
              {record.tx_hash && (
                <Descriptions.Item label="交易哈希">
                  <Text code copyable style={{ fontSize: 11, wordBreak: 'break-all' }}>
                    {record.tx_hash}
                  </Text>
                </Descriptions.Item>
              )}
              {blockchain_explorer_url && (
                <Descriptions.Item label="区块链接">
                  <Button type="link" size="small" icon={<ExportOutlined />} href={blockchain_explorer_url} target="_blank">
                    在 Etherscan 查看完整交易
                  </Button>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* D. 溯源链与引用 */}
        {status === 'success' && (citations.length > 0 || dialog_chain.length > 0) && (
          <Collapse ghost defaultActiveKey={dialog_chain.length > 0 ? ['chain'] : []}>
            {dialog_chain.length > 0 && (
              <Collapse.Panel header={<span><NodeIndexOutlined /> 全链路存证溯源</span>} key="chain">
                <Timeline
                  style={{ marginTop: 10 }}
                  items={dialog_chain.map((item: any, idx: number) => ({
                    color: '#10a37f',
                    children: (
                      <div>
                        <Text strong style={{ fontSize: 12 }}>节点 #{idx + 1}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                          {item.tx_hash || 'N/A'}
                        </Text>
                        {item.created_at && (
                          <>
                            <br />
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {new Date(item.created_at).toLocaleString('zh-CN')}
                            </Text>
                          </>
                        )}
                      </div>
                    )
                  }))}
                />
              </Collapse.Panel>
            )}
            
            {citations.length > 0 && (
              <Collapse.Panel header={<span><FileTextOutlined /> RAG 引用证据源</span>} key="cite">
                {citations.map((c: any, i: number) => (
                  <div key={i} style={{ padding: '8px', background: '#fafafa', marginBottom: 8, borderRadius: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{c.file_name} (P.{c.page})</Text>
                    <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ fontSize: 11, marginBottom: 0 }}>
                      {c.text_snippet}
                    </Paragraph>
                  </div>
                ))}
              </Collapse.Panel>
            )}
          </Collapse>
        )}
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '40px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ 
              display: 'inline-flex', background: 'linear-gradient(135deg, #10a37f 0%, #1a7f5a 100%)', 
              padding: 20, borderRadius: '20px', marginBottom: 20 
            }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#fff' }} />
            </div>
            <Title level={2}>TrustFlow 验证中心</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>第三方内容验真台 —— 不登录、不信任，只看证据</Text>
          </div>

          <Card style={{ borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
            <Tabs
              activeKey={mode}
              onChange={handleModeChange}
              centered
              size="large"
              items={[
                {
                  key: 'text',
                  label: <span><FileTextOutlined /> 文本验证</span>,
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <TextArea 
                        rows={6} 
                        placeholder="粘贴待验证的文本内容...&#10;&#10;支持验证：&#10;• AI 生成的回答和文章&#10;• 对话记录的原始内容&#10;• 任何声称由 TrustFlow 生成的文本" 
                        value={textInput} 
                        onChange={e => setTextInput(e.target.value)}
                        style={{ marginBottom: 16, borderRadius: 8 }}
                      />
                      <Button 
                        type="primary" 
                        block 
                        size="large" 
                        loading={loading}
                        onClick={() => handleCheck('text')}
                        style={{ background: '#10a37f', height: 50, borderRadius: 8 }}
                      >
                        开始语义溯源
                      </Button>
                    </div>
                  )
                },
                {
                  key: 'image',
                  label: <span><PictureOutlined /> 图片验证</span>,
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Dragger
                        maxCount={1} 
                        beforeUpload={f => { setUploadedFile(f); return false; }}
                        onRemove={() => setUploadedFile(null)}
                        accept="image/*"
                        style={{ marginBottom: 16, borderRadius: 12 }}
                      >
                        <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#10a37f' }} /></p>
                        <p className="ant-upload-text">点击或拖拽图片到此处</p>
                        <p className="ant-upload-hint">支持 JPG、PNG、WebP 等常见格式</p>
                      </Dragger>
                      <Button 
                        type="primary" 
                        block 
                        size="large" 
                        loading={loading}
                        disabled={!uploadedFile} 
                        onClick={() => handleCheck('image')}
                        style={{ background: '#10a37f', height: 50, borderRadius: 8 }}
                      >
                        提取频域水印
                      </Button>
                    </div>
                  )
                },
                {
                  key: 'hash',
                  label: <span><LinkOutlined /> Hash 查询</span>,
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Input 
                        size="large" 
                        placeholder="输入交易哈希（例如：0xb915da552ff35a5f...）" 
                        value={hashInput} 
                        onChange={e => setHashInput(e.target.value)}
                        style={{ marginBottom: 16, height: 50, borderRadius: 8 }}
                      />
                      <Button 
                        type="primary" 
                        block 
                        size="large" 
                        loading={loading}
                        onClick={handleHashLookup}
                        style={{ background: '#10a37f', height: 50, borderRadius: 8 }}
                      >
                        查询存证记录
                      </Button>
                    </div>
                  )
                }
              ]}
            />
            
            {/* 结果渲染区域在 Tabs 外部 */}
            {renderVerificationResult()}
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default VerificationPage;
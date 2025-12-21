import React, { useState } from 'react';
import {
  Layout, Card, Tabs, Input, Button, Upload, Typography, Tag, Progress,
  Collapse, Descriptions, Space, message, Timeline, Empty
} from 'antd';
import {
  FileTextOutlined, PictureOutlined, LinkOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InboxOutlined,
  ExportOutlined, NodeIndexOutlined, FilePdfOutlined, EyeOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import api from '../../services/api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

// 【配置】后端地址，请根据实际情况修改
const API_BASE_URL = 'http://localhost:8080';

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
        // 格式化数据以适配 UI
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

  // 3. 【核心修复】点击引用跳转 PDF
  const handleCitationClick = (citation: any) => {
    let targetUrl = '';

    if (citation.url) {
      // 如果后端返回了完整路径 (例如 /api/v1/documents/1/preview#page=5)
      // 需要拼接上后端域名，防止 React 本地开发端口(3000)请求不到后端(8080)
      targetUrl = citation.url.startsWith('http') 
        ? citation.url 
        : `${API_BASE_URL}${citation.url}`;
    } 
    else if (citation.download_url) {
      // 备用：如果有下载链接，手动拼页码
      const baseUrl = citation.download_url.startsWith('http') 
        ? citation.download_url 
        : `${API_BASE_URL}${citation.download_url}`;
      targetUrl = `${baseUrl}#page=${citation.page || 1}`;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank'); // 新标签页打开，浏览器会自动跳转页码
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
    
    // 兼容取值
    const citations = resultData.citations || matched_record?.citations || [];
    const dialog_chain = resultData.dialog_chain || matched_record?.dialog_chain || [];
    const blockchain_explorer_url = resultData.blockchain_explorer_url;
    const record = matched_record || original_record || resultData;

    return (
      <div style={{ marginTop: 24 }}>
        {/* A. 状态卡片 */}
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
                风险提示 - 内容可能被篡改
              </Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
                验证失败 - 无记录
              </Tag>
            )}
            <Paragraph style={{ marginTop: 16, fontSize: 15 }}>
              {status === 'success' ? '该内容已成功定位链上存证，内容完整可信。' : '未找到完全匹配的存证记录。'}
            </Paragraph>
          </div>
        </Card>

        {/* B. 核心指标 (文本) */}
        {check_result && verification_type === 'semantic_similarity' && (
          <Card title="语义比对分析" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">相似度</Text>
                <Text strong>{Math.round((check_result.similarity_score || 0) * 100)}%</Text>
              </div>
              <Progress percent={Math.round((check_result.similarity_score || 0) * 100)} status={status === 'success' ? 'success' : 'exception'} showInfo={false}/>
            </Space>
          </Card>
        )}

        {/* B2. 水印结果 (图片) */}
        {check_result && verification_type === 'invisible_watermark' && (
           <Card title="水印检测" size="small" style={{ marginBottom: 16 }}>
             <Descriptions column={1} size="small">
               <Descriptions.Item label="水印状态">
                 {check_result.has_watermark ? <Tag color="success">已检测到</Tag> : <Tag color="default">无水印</Tag>}
               </Descriptions.Item>
               {check_result.extracted_data && (
                 <Descriptions.Item label="提取数据">
                   <Text code copyable>{check_result.extracted_data}</Text>
                 </Descriptions.Item>
               )}
             </Descriptions>
           </Card>
        )}

        {/* C. 存证元数据 */}
        {status === 'success' && record && (
          <Card title={<span><SafetyCertificateOutlined /> 链上存证元数据</span>} size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="记录 ID">{record.record_id}</Descriptions.Item>
              <Descriptions.Item label="交易哈希"><Text code copyable>{record.tx_hash}</Text></Descriptions.Item>
              <Descriptions.Item label="生成时间">{record.created_at ? new Date(record.created_at).toLocaleString() : '-'}</Descriptions.Item>
              {blockchain_explorer_url && (
                <Descriptions.Item label="区块浏览器">
                  <Button type="link" size="small" href={blockchain_explorer_url} target="_blank" icon={<ExportOutlined />}>Etherscan</Button>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* D. 引用与溯源 (Collapse) */}
        {status === 'success' && (citations.length > 0 || dialog_chain.length > 0) && (
          <Collapse ghost defaultActiveKey={['cite', 'chain']}>
            
            {/* 1. 引用列表 (支持点击跳转) */}
            {citations.length > 0 && (
              <Collapse.Panel header={<span><FilePdfOutlined /> 引用证据源 ({citations.length})</span>} key="cite">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {citations.map((c: any, i: number) => (
                    <div
                      key={i}
                      // 【关键】绑定点击事件
                      onClick={() => handleCitationClick(c)}
                      style={{
                        padding: '12px',
                        background: '#fafafa',
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                        cursor: 'pointer', // 鼠标变小手
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#e6f7ff'; e.currentTarget.style.borderColor = '#1890ff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong style={{ color: '#1890ff' }}>
                          <LinkOutlined /> {c.file_name} <span style={{color:'#666'}}>(第 {c.page} 页)</span>
                        </Text>
                        <Tag>{Math.round(c.score * 100)}%</Tag>
                      </div>
                      <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 0, fontSize: 12 }}>
                        “{c.text_snippet}”
                      </Paragraph>
                    </div>
                  ))}
                </Space>
              </Collapse.Panel>
            )}

            {/* 2. 溯源链 */}
            {dialog_chain.length > 0 && (
              <Collapse.Panel header={<span><NodeIndexOutlined /> 全链路存证溯源</span>} key="chain">
                <Timeline 
                  items={dialog_chain.map((item: any, i: number) => ({
                    color: '#10a37f',
                    children: (
                      <div>
                        <Text style={{fontSize:12}}>节点 #{i+1}</Text>
                        <br/>
                        <Text type="secondary" style={{fontSize:11}}>{item.tx_hash}</Text>
                      </div>
                    )
                  }))} 
                />
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
             <Title level={2}>TrustFlow 验证中心</Title>
             <Text type="secondary">去中心化内容验真平台</Text>
          </div>

          <Card style={{ borderRadius: 16 }}>
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
                        value={textInput} 
                        onChange={e => setTextInput(e.target.value)} 
                        placeholder="请输入需要验证的文本..."
                        style={{marginBottom: 16}}
                      />
                      <Button type="primary" block size="large" onClick={() => handleCheck('text')} loading={loading}>
                        开始验证
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
                        beforeUpload={(f) => { setUploadedFile(f as any); return false; }}
                        onRemove={() => setUploadedFile(null)}
                      >
                        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                        <p className="ant-upload-text">点击或拖拽上传图片</p>
                      </Dragger>
                      <Button type="primary" block size="large" style={{marginTop:16}} disabled={!uploadedFile} onClick={() => handleCheck('image')} loading={loading}>
                        验证图片水印
                      </Button>
                    </div>
                  )
                },
                {
                  key: 'hash',
                  label: <span><LinkOutlined /> Hash 查询</span>,
                  children: (
                    <div style={{ paddingTop: 10 }}>
                      <Input size="large" placeholder="输入 0x 开头的 Hash" value={hashInput} onChange={e => setHashInput(e.target.value)} style={{marginBottom:16}}/>
                      <Button type="primary" block size="large" onClick={handleHashLookup} loading={loading}>
                        查询
                      </Button>
                    </div>
                  )
                }
              ]}
            />
            {/* 结果区域 */}
            {renderVerificationResult()}
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default VerificationPage;
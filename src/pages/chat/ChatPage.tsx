import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  Button, 
  Input, 
  Avatar, 
  Typography, 
  Tooltip, 
  Modal, 
  Select, 
  Slider, 
  Form, 
  Upload, 
  Popover, 
  Tag,
  message 
} from 'antd';
import { 
  PlusOutlined, 
  UserOutlined, 
  RobotOutlined, 
  ArrowUpOutlined,
  SafetyCertificateOutlined,
  FileOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// 引入真实 Service
import { chatService, type ChatMessage, type SessionItem } from '../../services/chatService';
import type { UploadFile } from 'antd';
import MainLayout from '../../components/MainLayout';

const { Content } = Layout;
const { TextArea } = Input;
const { Text } = Typography;

const ChatPage: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  
  // 状态初始化为空，等待 API 加载
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // 默认模型参数
  const [model, setModel] = useState('TrustFlow-V1');
  const [temperature, setTemperature] = useState(0.7);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. 初始化：加载会话列表 ---
  const loadSessions = async () => {
    try {
      const data = await chatService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error("加载会话失败", error);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // --- 2. 切换会话：加载历史记录 ---
  const handleSessionClick = async (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setLoading(true);
    try {
      const history = await chatService.getHistory(sessionId);
      setMessages(history);
    } catch (error) {
      console.error("加载历史记录失败", error);
      message.error("无法加载历史记录");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. 新建会话 ---
  const createNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setFileList([]);
  };

  // --- 4. 发送消息 (核心逻辑替换) ---
  const handleSend = async () => {
    if (!inputText.trim() && fileList.length === 0) return;
    
    // 构造请求内容
    let content = inputText;
    if (fileList.length > 0) {
      const fileNames = fileList.map(f => f.name).join(', ');
      content = `[附件: ${fileNames}]\n\n${inputText}`;
    }
    
    // 4.1 乐观更新 UI (立即显示用户消息)
    const userMsg: ChatMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setFileList([]);
    setLoading(true);

    try {
      let activeSessionId = currentSessionId;

      // 4.2 如果当前没有会话 ID，先创建会话
      if (!activeSessionId) {
        // 使用用户输入的前15个字作为标题，如果为空则由后端处理
        const title = content.slice(0, 15) || "新会话";
        const newSession = await chatService.createSession(title);
        activeSessionId = newSession.session_id;
        setCurrentSessionId(activeSessionId);
        // 刷新列表以显示新会话
        loadSessions(); 
      }

      // 4.3 调用真实接口发送消息
      const res = await chatService.sendMessage({
        session_id: activeSessionId!,
        mode: 'text', // 目前 UI 默认走文本模式，如果需要绘图，需在 UI 增加切换开关
        model: model,
        prompt: content,
        parameters: {
          temperature: temperature
        }
      });

      // 4.4 接收响应并显示
      const botMsg: ChatMessage = {
        role: 'assistant',
        content: res.content,
        tx_hash: res.tx_hash,
        citations: res.citations, // RAG 引用
        content_type: res.content_type,
        artifact_url: res.artifact_url // 如果是图片
      };
      
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      message.error("发送失败，请检查网络或后端服务");
      // 可选：如果失败，移除刚才用户发送的那条消息，或者显示重试按钮
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    inputWrapper: {
      position: 'relative' as const,
      background: '#f4f4f4',
      borderRadius: '26px',
      padding: '10px 10px',
      display: 'flex',
      alignItems: 'flex-end',
    }
  };

  return (
    <MainLayout
      onNewChat={createNewChat}
      sessions={sessions}
      currentSessionId={currentSessionId}
      onSessionClick={handleSessionClick}
      onOpenSettings={() => setIsSettingsOpen(true)}
    >
      <Content style={{ 
        position: 'relative', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        paddingTop: 50 
      }}>
        {/* 顶部模型信息 */}
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          right: 0,
          paddingRight: 16,
        }}>
          <div style={{ 
            fontWeight: 600, 
            color: '#444', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8 
          }}>
            {model} 
            <span style={{ fontSize: '12px', color: '#999', fontWeight: 400 }}>
              T={temperature}
            </span>
          </div>
        </div>

        {/* 聊天内容区域 */}
        {messages.length === 0 ? (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            paddingBottom: '100px' 
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #10a37f 0%, #1a7f5a 100%)', 
              padding: 16, 
              borderRadius: '16px', 
              marginBottom: 16 
            }}>
              <SafetyCertificateOutlined style={{ fontSize: 40, color: '#fff' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000', marginBottom: 8 }}>
              TrustFlow
            </h2>
            <Text type="secondary">可信溯源的 AI 助手，每次对话都上链存证</Text>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 140px 0' }}>
            <div style={{ maxWidth: '768px', margin: '0 auto', padding: '20px' }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ marginBottom: '30px', display: 'flex', gap: '16px' }}>
                  <Avatar 
                    size="default"
                    icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                    style={{ 
                      backgroundColor: msg.role === 'user' ? '#f0f0f0' : '#e6fffa', 
                      color: msg.role === 'user' ? '#666' : '#10a37f',
                      flexShrink: 0
                    }} 
                  />
                  <div style={{ flex: 1, paddingTop: '4px', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#333' }}>
                      {msg.role === 'user' ? 'You' : 'TrustFlow'}
                    </div>
                    
                    {/* 消息内容渲染 (支持文本 Markdown 和 图片) */}
                    <div className="markdown-body" style={{ fontSize: '15px', lineHeight: '1.7', color: '#333' }}>
                      {msg.content_type === 'image' && msg.artifact_url ? (
                         <div style={{ marginBottom: 10 }}>
                           <img 
                             src={msg.artifact_url} 
                             alt="Generated Artifact" 
                             style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #eee' }} 
                           />
                           <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Prompt: {msg.content}</div>
                         </div>
                      ) : (
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      )}
                    </div>

                    {/* 链上存证展示 */}
                    {msg.tx_hash && (
                      <div style={{ marginTop: 10 }}>
                        <Tooltip title={`区块链交易Hash: ${msg.tx_hash}`}>
                          <Tag icon={<SafetyCertificateOutlined />} color="success" style={{ cursor: 'pointer' }}>
                            Hash Verified
                          </Tag>
                        </Tooltip>
                        
                        {/* RAG 引用来源展示 */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {msg.citations.map((cit, cIdx) => (
                               <Tooltip key={cIdx} title={`来源: ${cit.file_name} (P${cit.page}) - 相似度 ${(cit.score * 100).toFixed(0)}%`}>
                                 <Tag color="blue" style={{ fontSize: 12 }}>
                                   {cit.file_name}
                                 </Tag>
                               </Tooltip>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
                  <Avatar size="default" icon={<RobotOutlined />} style={{ backgroundColor: '#e6fffa', color: '#10a37f' }} />
                  <div style={{ color: '#666', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
                    <span className="loading-dots">正在思考并存证中</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* 底部输入框 */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)',
          padding: '20px 0 30px 0',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '768px', padding: '0 20px' }}>
            {fileList.length > 0 && (
              <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 12px', background: '#fafafa', borderRadius: '12px' }}>
                {fileList.map((file, index) => (
                  <Tag key={index} closable onClose={() => setFileList(prev => prev.filter((_, i) => i !== index))} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}>
                    <FileOutlined /> {file.name}
                  </Tag>
                ))}
              </div>
            )}
            <div style={styles.inputWrapper}>
              <Popover
                open={attachMenuOpen}
                onOpenChange={setAttachMenuOpen}
                trigger="click"
                placement="topLeft"
                content={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                    <Upload beforeUpload={(file) => { setFileList(prev => [...prev, file as unknown as UploadFile]); setAttachMenuOpen(false); return false; }} showUploadList={false} accept=".pdf,.txt,.doc,.docx">
                      <Button type="text" icon={<FileOutlined />} style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}>上传文档</Button>
                    </Upload>
                    <Upload beforeUpload={(file) => { setFileList(prev => [...prev, file as unknown as UploadFile]); setAttachMenuOpen(false); return false; }} showUploadList={false} accept="image/*">
                      <Button type="text" icon={<PictureOutlined />} style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}>上传图片</Button>
                    </Upload>
                  </div>
                }
              >
                <Button type="text" shape="circle" icon={<PlusOutlined style={{ fontSize: '18px', color: '#666' }} />} style={{ marginRight: '4px', marginBottom: '4px' }} />
              </Popover>
              <TextArea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Message TrustFlow..."
                autoSize={{ minRows: 1, maxRows: 8 }}
                onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
                style={{ boxShadow: 'none', background: 'transparent', border: 'none', padding: '8px 0', fontSize: '16px', resize: 'none', marginBottom: '2px', flex: 1 }}
              />
              <Button 
                type="primary" shape="circle" onClick={handleSend}
                disabled={(!inputText.trim() && fileList.length === 0) || loading}
                icon={<ArrowUpOutlined style={{ fontSize: '16px', fontWeight: 'bold' }} />}
                style={{ background: (inputText.trim() || fileList.length > 0) ? '#000' : '#e5e5e5', borderColor: 'transparent', color: '#fff', width: '32px', height: '32px', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}
              />
            </div>
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '10px' }}>
              TrustFlow can make mistakes. Check important info.
            </div>
          </div>
        </div>
      </Content>

      {/* Settings Modal */}
      <Modal
        title="模型设置"
        open={isSettingsOpen}
        onCancel={() => setIsSettingsOpen(false)}
        footer={[<Button key="ok" type="primary" onClick={() => setIsSettingsOpen(false)}>完成</Button>]}
      >
        <Form layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item label="选择模型">
            <Select value={model} onChange={setModel} options={[
              { value: 'TrustFlow-V1', label: 'TrustFlow V1 (Base)' },
              { value: 'GPT-4-Secure', label: 'GPT-4 Secure (Proxy)' },
              { value: 'Llama-3-RAG', label: 'Llama 3 RAG (Local)' },
            ]} />
          </Form.Item>
          <Form.Item label={`Temperature: ${temperature}`}>
            <Slider min={0} max={1} step={0.1} value={temperature} onChange={setTemperature} marks={{ 0: '精确', 0.5: '平衡', 1: '创意' }} />
          </Form.Item>
          <div style={{ padding: 12, background: '#f6ffed', borderRadius: 8, marginTop: 16 }}>
            <Text style={{ color: '#52c41a', fontSize: 13 }}>
              <SafetyCertificateOutlined style={{ marginRight: 8 }} />
              所有对话内容将自动上链存证，确保可追溯
            </Text>
          </div>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default ChatPage;
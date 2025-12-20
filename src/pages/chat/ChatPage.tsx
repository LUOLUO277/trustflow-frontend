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
  message,
  Radio,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  UserOutlined, 
  RobotOutlined, 
  ArrowUpOutlined,
  SafetyCertificateOutlined,
  FileOutlined,
  PictureOutlined,
  CommentOutlined,
  BgColorsOutlined,
  SwapOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatService, type ChatMessage, type SessionItem } from '../../services/chatService';
import type { UploadFile } from 'antd';
import MainLayout from '../../components/MainLayout';

const { Content } = Layout;
const { TextArea } = Input;
const { Text } = Typography;

// --- 常量定义 ---
const TEXT_MODEL_ID = "zai-org/GLM-4.5";
const IMAGE_MODEL_ID = "black-forest-labs/FLUX.1-schnell";
const API_BASE_URL = "http://localhost:8080"; // 你的后端地址

const ChatPage: React.FC = () => {
  // --- 状态管理 ---
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // --- 模式与参数 ---
  const [mode, setMode] = useState<'text' | 'image'>('text'); 
  const [temperature, setTemperature] = useState(0.7);
  const [imageSize, setImageSize] = useState('1024x1024');
  const [inferenceSteps, setInferenceSteps] = useState(4);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 辅助函数：处理图片路径 ---
  // 将 ".\storage\generated\xxx.png" 转换为 "http://localhost:8080/storage/generated/xxx.png"
// --- 辅助函数：处理图片路径 ---
const getImageUrl = (path?: string) => {
    if (!path) return '';
    // 如果已经是 http 开头（比如网络图片）则直接返回
    if (path.startsWith('http')) return path;
    
    // 后端返回: .\storage\generated\xxx.png
    // 本地物理路径: D:\Grade Three\...\storage\generated\xxx.png
    // 浏览器访问路径: http://localhost:8080/storage/generated/xxx.png
    
    // 硬编码替换逻辑：把开头的 "." 替换为你的后端地址，并把反斜杠 "\" 换成正斜杠 "/"
    return path.replace('.', 'http://localhost:8080').replace(/\\/g, '/');
  };

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

  // --- 切换会话 ---
  const handleSessionClick = async (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setLoading(true);
    try {
      const history = await chatService.getHistory(sessionId);
      
      // 【修复顺序问题】强制按创建时间升序排列 (旧 -> 新)
      const sortedHistory = [...history].sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeA - timeB;
      });

      setMessages(sortedHistory);
    } catch (error) {
      console.error("加载历史记录失败", error);
      message.error("无法加载历史记录");
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setFileList([]);
  };

  // --- 快捷切换模式 ---
  const toggleMode = () => {
    const newMode = mode === 'text' ? 'image' : 'text';
    setMode(newMode);
    message.info(`已切换到 ${newMode === 'text' ? '文本对话' : 'AI 绘图'} 模式`);
  };

  // --- 发送消息 ---
  const handleSend = async () => {
    if (!inputText.trim() && fileList.length === 0) return;
    
    let content = inputText;
    if (fileList.length > 0) {
      const fileNames = fileList.map(f => f.name).join(', ');
      content = `[附件: ${fileNames}]\n\n${inputText}`;
    }
    
    const userMsg: ChatMessage = { 
        role: 'user', 
        content,
        created_at: new Date().toISOString() // 本地临时显示时间
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setFileList([]);
    setLoading(true);

    try {
      let activeSessionId = currentSessionId;

      if (!activeSessionId) {
        const title = content.slice(0, 15) || (mode === 'image' ? "AI 绘图" : "新会话");
        const newSession = await chatService.createSession(title);
        activeSessionId = newSession.session_id;
        setCurrentSessionId(activeSessionId);
        loadSessions(); 
      }

      const requestBody: any = {
        session_id: activeSessionId!,
        mode: mode, 
        prompt: content,
      };

      if (mode === 'text') {
        requestBody.model = TEXT_MODEL_ID;
        requestBody.parameters = { temperature: temperature };
      } else {
        requestBody.model = IMAGE_MODEL_ID;
        requestBody.parameters = {
          image_size: imageSize,
          num_inference_steps: inferenceSteps,
          batch_size: 1
        };
      }

      const res = await chatService.sendMessage(requestBody);

      const botMsg: ChatMessage = {
        role: 'assistant',
        content: res.content,
        tx_hash: res.tx_hash,
        citations: res.citations,
        content_type: res.content_type,
        artifact_url: res.artifact_url,
        watermark_status: res.watermark_status,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      message.error("请求失败，请检查网络或参数");
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
      <Content style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', paddingTop: 50 }}>
        
        {/* --- 顶部状态栏 (简化版) --- */}
        <div style={{ 
          position: 'absolute', top: 0, left: 50, height: 50, right: 0, paddingRight: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            
            {/* 模式切换 (可点击) */}
            <Tooltip title="点击切换创作模式">
                <Tag 
                color={mode === 'text' ? 'blue' : 'purple'} 
                icon={mode === 'text' ? <CommentOutlined /> : <BgColorsOutlined />}
                style={{ 
                    padding: '4px 12px', 
                    fontSize: 14, 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    borderRadius: 16
                }}
                onClick={toggleMode}
                >
                {mode === 'text' ? 'Text Mode' : 'Image Mode'} <SwapOutlined style={{ marginLeft: 6, fontSize: 12, opacity: 0.7 }} />
                </Tag>
            </Tooltip>

            {/* 模型名称 */}
            <Text strong style={{ color: '#444', fontSize: 14 }}>
              {mode === 'text' ? 'GLM-4.5' : 'FLUX.1-schnell'}
            </Text>
          </div>
        </div>

        {/* --- 消息列表 --- */}
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '100px' }}>
            <div style={{ background: 'linear-gradient(135deg, #10a37f 0%, #1a7f5a 100%)', padding: 16, borderRadius: '16px', marginBottom: 16 }}>
              <SafetyCertificateOutlined style={{ fontSize: 40, color: '#fff' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000', marginBottom: 8 }}>TrustFlow</h2>
            <Text type="secondary">
                {mode === 'text' ? '文本哈希存证模式' : '图片隐形水印存证模式'}
            </Text>
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
                    
                    {/* 内容渲染 */}
                    <div className="markdown-body" style={{ fontSize: '15px', lineHeight: '1.7', color: '#333' }}>
                      {/* 如果是图片模式且有 URL */}
                      {msg.content_type === 'image' && msg.artifact_url ? (
                         <div style={{ marginBottom: 10 }}>
                           <img 
                             src={getImageUrl(msg.artifact_url)} 
                             alt="Generated Artifact" 
                             style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                             onError={(e) => {
                                 // 图片加载失败处理
                                 e.currentTarget.style.display = 'none';
                                 message.warning("图片加载失败，请检查后端静态资源配置");
                             }} 
                           />
                           <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Prompt: {msg.content}</div>
                         </div>
                      ) : (
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      )}
                    </div>

                    {/* 存证信息 */}
                    {msg.tx_hash && (
                      <div style={{ marginTop: 10 }}>
                        <Tooltip title={`区块链交易Hash: ${msg.tx_hash}`}>
                          <Tag icon={<SafetyCertificateOutlined />} color="success" style={{ cursor: 'pointer' }}>
                            {msg.content_type === 'image' ? 'Watermark Verified' : 'Hash Verified'}
                          </Tag>
                        </Tooltip>
                        
                        {msg.citations && msg.citations.length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {msg.citations.map((cit, cIdx) => (
                               <Tooltip key={cIdx} title={`来源: ${cit.file_name} (P${cit.page})`}>
                                 <Tag color="blue" style={{ fontSize: 12 }}>{cit.file_name}</Tag>
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
                    <span className="loading-dots">
                      {mode === 'text' ? '正在思考并上链存证...' : '正在绘图并嵌入隐形水印...'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* 底部输入框 */}
        <div style={{ 
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)', padding: '20px 0 30px 0',
          display: 'flex', justifyContent: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '768px', padding: '0 20px' }}>
            {/* 附件预览 */}
            {fileList.length > 0 && (
              <div style={{ marginBottom: 8, display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 12px', background: '#fafafa', borderRadius: '12px' }}>
                {fileList.map((file, index) => (
                  <Tag key={index} closable onClose={() => setFileList(prev => prev.filter((_, i) => i !== index))} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                content={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                    <Upload beforeUpload={(file) => { setFileList(prev => [...prev, file as unknown as UploadFile]); setAttachMenuOpen(false); return false; }} showUploadList={false} accept=".pdf,.txt">
                      <Button type="text" icon={<FileOutlined />} style={{ width: '100%', textAlign: 'left' }}>上传文档 (RAG)</Button>
                    </Upload>
                    <Upload beforeUpload={(file) => { setFileList(prev => [...prev, file as unknown as UploadFile]); setAttachMenuOpen(false); return false; }} showUploadList={false} accept="image/*">
                      <Button type="text" icon={<PictureOutlined />} style={{ width: '100%', textAlign: 'left' }}>上传图片 (Ref)</Button>
                    </Upload>
                  </div>
                }
              >
                <Button type="text" shape="circle" icon={<PlusOutlined style={{ fontSize: '18px', color: '#666' }} />} style={{ marginRight: '4px', marginBottom: '4px' }} />
              </Popover>

              <TextArea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={mode === 'text' ? "Message TrustFlow..." : "Describe the image to generate..."}
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
              TrustFlow may produce inaccurate information. Content is verified on-chain.
            </div>
          </div>
        </div>
      </Content>

      {/* --- 设置面板 (Settings) --- */}
      <Modal
        title="生成设置 (Settings)"
        open={isSettingsOpen}
        onCancel={() => setIsSettingsOpen(false)}
        footer={[<Button key="ok" type="primary" onClick={() => setIsSettingsOpen(false)}>完成</Button>]}
        centered
      >
        <Form layout="vertical" style={{ marginTop: 20 }}>
          
          <Form.Item label="创作模式 (Mode)">
             <Radio.Group 
                value={mode} 
                onChange={e => setMode(e.target.value)} 
                buttonStyle="solid"
                style={{ width: '100%' }}
             >
                <Radio.Button value="text" style={{ width: '50%', textAlign: 'center' }}>
                  <CommentOutlined /> 文本对话 (RAG)
                </Radio.Button>
                <Radio.Button value="image" style={{ width: '50%', textAlign: 'center' }}>
                  <BgColorsOutlined /> AI 绘图 (Flux)
                </Radio.Button>
             </Radio.Group>
          </Form.Item>

          <Divider />

          {mode === 'text' ? (
             <>
               <Form.Item label="模型 (Model)">
                  <Input value={TEXT_MODEL_ID} disabled style={{ color: '#000', background: '#f5f5f5' }} />
               </Form.Item>
               <Form.Item label={`随机性 (Temperature): ${temperature}`}>
                  <Slider min={0} max={1} step={0.1} value={temperature} onChange={setTemperature} />
               </Form.Item>
             </>
          ) : (
             <>
               <Form.Item label="模型 (Model)">
                  <Input value={IMAGE_MODEL_ID} disabled style={{ color: '#000', background: '#f5f5f5' }} />
               </Form.Item>
               <Form.Item label="图片尺寸 (Image Size)">
                  <Select value={imageSize} onChange={setImageSize} options={[
                     { value: '1024x1024', label: '1024x1024 (1:1 Square)' },
                     { value: '512x1024', label: '512x1024 (9:16 Portrait)' },
                     { value: '1024x512', label: '1024x512 (16:9 Landscape)' },
                  ]} />
               </Form.Item>
               <Form.Item label={`推理步数 (Inference Steps): ${inferenceSteps}`}>
                  <Slider min={1} max={8} step={1} value={inferenceSteps} onChange={setInferenceSteps} />
               </Form.Item>
             </>
          )}
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default ChatPage;
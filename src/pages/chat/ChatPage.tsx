import React, { useState, useEffect, useRef } from 'react';
import { Layout, Button, Input, List, Avatar, Typography, Tooltip, Dropdown } from 'antd';
import { 
  SendOutlined, 
  PlusOutlined, 
  UserOutlined, 
  RobotOutlined, 
  MoreOutlined, 
  AudioOutlined, 
  ArrowUpOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatService, type ChatMessage, type SessionItem } from '../../services/chatService';

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Text } = Typography;

// --- Mock Data ---
const MOCK_SESSIONS: SessionItem[] = [
  { session_id: 1, title: "TrustFlow 技术原理", last_active: "Today" },
  { session_id: 2, title: "RAG 溯源测试", last_active: "Yesterday" },
];

const ChatPage: React.FC = () => {
  const [sessions, setSessions] = useState<SessionItem[]>(MOCK_SESSIONS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSessionClick = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    // 模拟：切换会话时，如果有历史记录则显示，没有则清空
    setMessages(sessionId === 1 ? [
      { role: 'user', content: 'TrustFlow 是什么？' },
      { role: 'assistant', content: 'TrustFlow 是一个基于区块链的可信溯源系统。' }
    ] : []);
  };

  const createNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // 模拟延迟
    await new Promise(r => setTimeout(r, 800));

    const mockResponse: ChatMessage = {
      role: 'assistant',
      content: `TrustFlow 已将本次生成记录上链。\n\n**Hash:** 0x${Math.random().toString(16).slice(2, 10)}...`,
      tx_hash: '0x...',
    };
    setMessages(prev => [...prev, mockResponse]);
    setLoading(false);
  };

  // --- 样式定义 (模仿 ChatGPT Light Mode) ---
  const styles = {
    layout: { height: '100vh', background: '#fff' },
    // 侧边栏样式：浅灰色，黑色文字
    sider: { 
      background: '#f9f9f9', 
      borderRight: '1px solid #e5e5e5',
      display: 'flex',
      flexDirection: 'column' as const
    },
    // 侧边栏按钮
    sidebarBtn: {
      textAlign: 'left' as const,
      border: 'none',
      background: 'transparent',
      padding: '10px',
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: '#000',
      fontSize: '14px',
      borderRadius: '8px',
      cursor: 'pointer',
    },
    sidebarBtnHover: {
      background: '#ececec'
    },
    // 输入框容器：胶囊形状，灰色背景
    inputWrapper: {
      position: 'relative' as const,
      background: '#f4f4f4', // 浅灰背景
      borderRadius: '26px',  // 大圆角
      padding: '10px 10px',  // 内边距
      display: 'flex',
      alignItems: 'flex-end',
      border: '1px solid transparent',
    },
    inputActive: {
      background: '#f4f4f4',
      border: '1px solid #d9d9d9', // 聚焦时稍微深一点的边框
    }
  };

  return (
    <Layout style={styles.layout}>
      {/* --- 左侧侧边栏 (Light Mode) --- */}
      <Sider width={260} style={styles.sider} trigger={null}>
        {/* 顶部：New Chat & Toggle */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={createNewChat}
                title="New Chat"
            />
            <Button type="text" icon={<LayoutOutlinedIcon />} />
          </div>
        </div>

        {/* 中间：历史记录列表 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', paddingLeft: '8px' }}>Today</div>
          <List
            dataSource={sessions}
            split={false}
            renderItem={item => (
              <List.Item 
                style={{ padding: 0, marginBottom: 4 }}
              >
                <div 
                  className="hover-bg-gray" // 需要全局CSS配合，或者用onMouseEnter实现
                  style={{
                    ...styles.sidebarBtn,
                    background: currentSessionId === item.session_id ? '#e0e0e0' : 'transparent',
                    fontWeight: currentSessionId === item.session_id ? 500 : 400,
                  }}
                  onClick={() => handleSessionClick(item.session_id)}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                  {currentSessionId === item.session_id && <MoreOutlined style={{ color: '#666' }} />}
                </div>
              </List.Item>
            )}
          />
        </div>

        {/* 底部：用户信息 */}
        <div style={{ padding: '16px', borderTop: '1px solid #e5e5e5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: '8px' }} className="hover-bg-gray">
             <Avatar size="small" style={{ backgroundColor: '#87d068' }}>FE</Avatar>
             <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>FE-1 (组长)</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Free Plan</div>
             </div>
          </div>
        </div>
      </Sider>

      {/* --- 右侧主界面 --- */}
      <Layout style={{ background: '#fff', position: 'relative' }}>
        
        {/* 顶部导航 (Mobile only usually, or model selector) */}
        <div style={{ height: '50px', display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: '16px', fontWeight: 600, color: '#444' }}>
           TrustFlow GPT-4 <span style={{ fontSize: '12px', color: '#999', marginLeft: 8, fontWeight: 400 }}>Based on Blockchain</span>
        </div>

        <Content style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* 1. 聊天内容区域 */}
            {messages.length === 0 ? (
                // --- Empty State (Center) ---
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '100px' }}>
                    <div style={{ background: '#fff', padding: 10, borderRadius: '50%', marginBottom: 10 }}>
                         <img src="/vite.svg" width={48} alt="logo" style={{ filter: 'grayscale(100%)' }} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000' }}>What's on your mind today?</h2>
                </div>
            ) : (
                // --- Message List ---
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 120px 0' }}>
                    <div style={{ maxWidth: '768px', margin: '0 auto', padding: '20px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{ marginBottom: '30px', display: 'flex', gap: '16px' }}>
                                <Avatar 
                                    size="default"
                                    icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                                    style={{ 
                                        backgroundColor: 'transparent', 
                                        color: msg.role === 'user' ? '#000' : '#10a37f',
                                        border: '1px solid #eee'
                                    }} 
                                />
                                <div style={{ flex: 1, paddingTop: '4px' }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                        {msg.role === 'user' ? 'You' : 'TrustFlow'}
                                    </div>
                                    <div className="markdown-body" style={{ fontSize: '16px', lineHeight: '1.7', color: '#333' }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && <div style={{ marginLeft: 50, color: '#999' }}>● ● ●</div>}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* 2. 底部输入框区域 (仿新版 ChatGPT 胶囊样式) */}
            <div style={{ 
                position: 'absolute', 
                bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)',
                padding: '20px 0 30px 0',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <div style={{ width: '100%', maxWidth: '768px', padding: '0 20px' }}>
                    
                    {/* Input Container */}
                    <div style={styles.inputWrapper}>
                        
                        {/* Left Icon: Attachment */}
                        <Button 
                            type="text" 
                            shape="circle" 
                            icon={<PlusOutlined style={{ fontSize: '18px', color: '#666' }} />} 
                            style={{ marginRight: '4px', marginBottom: '4px' }}
                        />

                        {/* Text Area */}
                        <TextArea
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            placeholder="Message TrustFlow..."
                            autoSize={{ minRows: 1, maxRows: 8 }}
                            onPressEnter={e => {
                                if (!e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            style={{
                                boxShadow: 'none',
                                background: 'transparent',
                                border: 'none',
                                padding: '8px 0',
                                fontSize: '16px',
                                resize: 'none',
                                marginBottom: '2px' // Align with buttons
                            }}
                        />

                        {/* Right Icons: Mic (optional) & Send */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', marginLeft: '8px' }}>
                            {/* Send Button (Black Circle) */}
                            <Button 
                                type="primary"
                                shape="circle"
                                size="large"
                                onClick={handleSend}
                                disabled={!inputText.trim()}
                                icon={<ArrowUpOutlined style={{ fontSize: '18px', fontWeight: 'bold' }} />}
                                style={{ 
                                    background: inputText.trim() ? '#000' : '#e5e5e5', // 黑色背景
                                    borderColor: 'transparent',
                                    color: '#fff',
                                    width: '32px',
                                    height: '32px',
                                    minWidth: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '10px' }}>
                        TrustFlow can make mistakes. Check important info.
                    </div>
                </div>
            </div>

        </Content>
      </Layout>
    </Layout>
  );
};

// 简单的 SVG 图标组件 (模拟左上角 Sidebar Toggle)
const LayoutOutlinedIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#666" strokeWidth="2"/>
        <path d="M9 3V21" stroke="#666" strokeWidth="2"/>
    </svg>
);

export default ChatPage;
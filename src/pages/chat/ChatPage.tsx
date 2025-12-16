import React, { useState, useEffect, useRef } from 'react';
import { Layout, Button, Input, List, Avatar, Typography, Tooltip, Modal, Select, Slider, Form } from 'antd';
import { 
  PlusOutlined, 
  UserOutlined, 
  RobotOutlined, 
  MoreOutlined, 
  ArrowUpOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  SettingOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type ChatMessage, type SessionItem } from '../../services/chatService';
import { useAuthStore } from '../../store/useAuthStore'; // 引入 Store 获取用户信息

const { Sider, Content } = Layout;
const { TextArea } = Input;
const { Text } = Typography;

// --- Mock Data ---
const MOCK_SESSIONS: SessionItem[] = [
  { session_id: 1, title: "TrustFlow 技术原理", last_active: "Today" },
  { session_id: 2, title: "RAG 溯源测试", last_active: "Yesterday" },
  { session_id: 3, title: "智能合约安全审计", last_active: "Last Week" },
  { session_id: 4, title: "Web3 隐私计算方案", last_active: "Last Month" },
];

const ChatPage: React.FC = () => {
  // --- Global State ---
  const { user } = useAuthStore(); // 获取登录用户信息
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // --- Chat State ---
  const [sessions, setSessions] = useState<SessionItem[]>(MOCK_SESSIONS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // --- Search State ---
  const [searchText, setSearchText] = useState('');
  
  // --- Settings State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [model, setModel] = useState('TrustFlow-V1');
  const [temperature, setTemperature] = useState(0.7);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // 过滤会话列表
  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchText.toLowerCase())
  );

  // 格式化钱包地址显示 (0x123...abc)
  const formatAddress = (address?: string) => {
    if (!address) return "未连接钱包";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleSessionClick = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    // 模拟切换
    setMessages(sessionId === 1 ? [
      { role: 'user', content: 'TrustFlow 是什么？' },
      { role: 'assistant', content: 'TrustFlow 是一个基于区块链的可信溯源系统。' }
    ] : []);
  };

  const createNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  // --- 核心聊天逻辑 ---
  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    // 1. 用户消息上屏
    const userMsg: ChatMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // 2. 模拟网络请求 (1秒延迟)
    await new Promise(r => setTimeout(r, 1000));

    // 3. 构造助手回复 (带 Hash)
    const mockResponse: ChatMessage = {
      role: 'assistant',
      content: `这是使用 **${model} (Temp: ${temperature})** 生成的回复。\n\nTrustFlow 已将本次生成记录上链，确保内容不可篡改。`,
      tx_hash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('').slice(0, 16) + '...', // 模拟 Hash
      citations: []
    };
    
    setMessages(prev => [...prev, mockResponse]);
    setLoading(false);
  };

  // --- 样式定义 ---
  const styles = {
    layout: { height: '100vh', background: '#fff' },
    sider: { 
      background: '#f9f9f9', 
      borderRight: '1px solid #e5e5e5',
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100vh'
    },
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
    <Layout style={styles.layout}>
      {/* --- 左侧侧边栏 --- */}
      <Sider 
        width={260} 
        style={styles.sider} 
        trigger={null} 
        collapsible 
        collapsed={!isSidebarOpen}
        collapsedWidth={0} // 收起时完全隐藏
        theme="light"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* 1. 顶部：新建对话 & 搜索 */}
            <div style={{ padding: '16px 16px 0 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Button 
                        type="text" 
                        icon={<PlusOutlined />} 
                        onClick={createNewChat} 
                        style={{ flex: 1, textAlign: 'left', border: '1px solid #e5e5e5', borderRadius: 8 }}
                    >
                        New Chat
                    </Button>
                </div>
                {/* 搜索框 */}
                <Input 
                    placeholder="Search chats..." 
                    prefix={<SearchOutlined style={{ color: '#999' }} />} 
                    variant="filled"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ borderRadius: 8, background: '#ececec' }}
                />
            </div>

            {/* 2. 中间：滚动列表 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', paddingLeft: '8px' }}>Recent</div>
            <List
                dataSource={filteredSessions}
                split={false}
                renderItem={item => (
                <List.Item style={{ padding: 0, marginBottom: 4 }}>
                    <div 
                    className="hover-bg-gray"
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
                    </div>
                </List.Item>
                )}
            />
            </div>

            {/* 3. 底部：设置 & 身份信息 */}
            <div style={{ padding: '12px', borderTop: '1px solid #e5e5e5' }}>
                {/* 设置按钮 */}
                <div 
                    style={{ ...styles.sidebarBtn, marginBottom: 4 }} 
                    className="hover-bg-gray"
                    onClick={() => setIsSettingsOpen(true)}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <SettingOutlined /> Settings
                    </span>
                </div>

                {/* 用户身份 (Wallet Address) */}
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', 
                    padding: '8px', borderRadius: '8px', marginTop: 4 
                }} className="hover-bg-gray">
                    <div style={{ 
                        width: 24, height: 24, background: '#10a37f', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10
                    }}>
                        W3
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                            {formatAddress(user?.wallet_address)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </Sider>

      {/* --- 右侧主界面 --- */}
      <Layout style={{ background: '#fff', position: 'relative' }}>
        
        {/* 顶部导航：侧边栏开关 & 当前模型 */}
        <div style={{ 
            height: '50px', display: 'flex', alignItems: 'center', padding: '0 16px', 
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 
        }}>
           <Button 
                type="text" 
                icon={isSidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{ color: '#666' }}
           />
           <div style={{ marginLeft: '12px', fontWeight: 600, color: '#444', display: 'flex', alignItems: 'center', gap: 8 }}>
                {model} <span style={{ fontSize: '12px', color: '#999', fontWeight: 400 }}>T={temperature}</span>
           </div>
        </div>

        <Content style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', paddingTop: 50 }}>
            
            {/* 1. 聊天内容区域 */}
            {messages.length === 0 ? (
                // 空状态
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '100px' }}>
                    <div style={{ background: '#fff', padding: 10, borderRadius: '50%', marginBottom: 10 }}>
                         <img src="/vite.svg" width={48} alt="logo" style={{ filter: 'grayscale(100%)' }} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000' }}>What's on your mind today?</h2>
                </div>
            ) : (
                // 消息列表
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
                                    {/* 链上 Hash 标签 */}
                                    {msg.tx_hash && (
                                        <div style={{ marginTop: 8 }}>
                                            <Tooltip title={`区块链交易Hash: ${msg.tx_hash}`}>
                                                <span style={{ 
                                                    fontSize: '12px', color: '#10a37f', background: '#e6fffa', 
                                                    padding: '2px 8px', borderRadius: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                                                }}>
                                                    <SafetyCertificateOutlined /> Hash Verified
                                                </span>
                                            </Tooltip>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {/* Loading 状态 */}
                        {loading && (
                            <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
                                <div style={{ width: 32, height: 32 }} /> {/* 占位 */}
                                <div style={{ color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <RobotOutlined spin /> 正在思考并存证...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* 2. 底部输入框区域 */}
            <div style={{ 
                position: 'absolute', 
                bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 30%)',
                padding: '20px 0 30px 0',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <div style={{ width: '100%', maxWidth: '768px', padding: '0 20px' }}>
                    <div style={styles.inputWrapper}>
                        <Button 
                            type="text" 
                            shape="circle" 
                            icon={<PlusOutlined style={{ fontSize: '18px', color: '#666' }} />} 
                            style={{ marginRight: '4px', marginBottom: '4px' }}
                        />
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
                                boxShadow: 'none', background: 'transparent', border: 'none',
                                padding: '8px 0', fontSize: '16px', resize: 'none', marginBottom: '2px'
                            }}
                        />
                        <Button 
                            type="primary"
                            shape="circle"
                            size="large"
                            onClick={handleSend}
                            disabled={!inputText.trim() || loading}
                            icon={<ArrowUpOutlined style={{ fontSize: '18px', fontWeight: 'bold' }} />}
                            style={{ 
                                background: inputText.trim() ? '#000' : '#e5e5e5', 
                                borderColor: 'transparent', color: '#fff',
                                width: '32px', height: '32px', minWidth: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4
                            }}
                        />
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '10px' }}>
                        TrustFlow can make mistakes. Check important info.
                    </div>
                </div>
            </div>
        </Content>

        {/* --- Settings Modal --- */}
        <Modal
            title="Model Settings"
            open={isSettingsOpen}
            onOk={() => setIsSettingsOpen(false)}
            onCancel={() => setIsSettingsOpen(false)}
            footer={[
                <Button key="ok" type="primary" onClick={() => setIsSettingsOpen(false)}>Done</Button>
            ]}
        >
            <Form layout="vertical" style={{ marginTop: 20 }}>
                <Form.Item label="Model Selection">
                    <Select 
                        value={model} 
                        onChange={setModel}
                        options={[
                            { value: 'TrustFlow-V1', label: 'TrustFlow V1 (Base)' },
                            { value: 'GPT-4-Secure', label: 'GPT-4 Secure (Proxy)' },
                            { value: 'Llama-3-RAG', label: 'Llama 3 RAG (Local)' },
                        ]} 
                    />
                </Form.Item>
                <Form.Item label={`Temperature: ${temperature}`}>
                    <Slider 
                        min={0} max={1} step={0.1} 
                        value={temperature} 
                        onChange={setTemperature}
                        marks={{ 0: 'Precise', 0.5: 'Balanced', 1: 'Creative' }}
                    />
                </Form.Item>
            </Form>
        </Modal>

      </Layout>
    </Layout>
  );
};

export default ChatPage;
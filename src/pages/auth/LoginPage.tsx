// src/pages/auth/LoginPage.tsx
import React from 'react';
import { Button, Card, Typography } from 'antd';
import { WalletOutlined } from '@ant-design/icons';
import { useWeb3Login } from '../../hooks/useWeb3Login';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const { connectAndLogin, loading } = useWeb3Login();

  return (
    <div style={styles.container}>
      {/* 居中的登录卡片区域 */}
      <div style={styles.content}>
        {/* Logo 区域 (可以用文字代替) */}
        <div style={styles.logoSection}>
          <div style={styles.logoCircle} />
          <Title level={2} style={{ margin: '16px 0 8px' }}>TrustFlow</Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            基于区块链的可信 AIGC 溯源系统
          </Text>
        </div>

        {/* 登录按钮区域 */}
        <div style={styles.actionSection}>
          <Button 
            type="primary" 
            size="large" 
            icon={<WalletOutlined />} 
            onClick={connectAndLogin} 
            loading={loading}
            style={styles.loginBtn}
          >
            连接钱包登录
          </Button>
          
          <div style={styles.footerText}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              无需注册，连接 Web3 钱包即刻开启创作
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

// 简单的内联样式对象 (模仿 ChatGPT 的简洁风格)
const styles = {
  container: {
    height: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // ChatGPT 浅色模式背景
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  } as React.CSSProperties,
  content: {
    width: '100%',
    maxWidth: '400px',
    padding: '40px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  logoSection: {
    marginBottom: '40px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  logoCircle: {
    width: '60px',
    height: '60px',
    backgroundColor: '#000', // 黑色 Logo
    borderRadius: '50%',
    marginBottom: '10px',
  },
  actionSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  loginBtn: {
    height: '50px',
    borderRadius: '6px',
    fontSize: '16px',
    backgroundColor: '#10a37f', // ChatGPT 标志性的绿色，或者你可以用黑色 #000
    borderColor: '#10a37f',
    width: '100%',
  },
  footerText: {
    marginTop: '20px',
  }
};

export default LoginPage;
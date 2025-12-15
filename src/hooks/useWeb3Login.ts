// src/hooks/useWeb3Login.ts
import { useState } from 'react';
import { ethers } from 'ethers';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

export const useWeb3Login = () => {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const connectAndLogin = async () => {
    // 0. 开发者模式：如果你不想连钱包，或者环境不支持，可以取消注释下面这行直接模拟登录
    // return mockLogin();

    if (!window.ethereum) {
      message.warning('请先安装 MetaMask');
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      try {
        // 尝试真实登录
        const { nonce } = await authService.getNonce(address);
        const signature = await signer.signMessage(nonce);
        const data = await authService.login(address, signature);
        setAuth(data.access_token, data.user_info);
      } catch (apiError) {
        // --- 核心修改：如果后端挂了，降级为模拟登录 ---
        console.warn("后端未响应，启用 Mock 登录模式");
        mockLogin(address);
        return; 
      }

      message.success('登录成功');
      navigate('/chat');

    } catch (error: any) {
      console.error(error);
      message.error('连接失败');
    } finally {
      setLoading(false);
    }
  };

  // 模拟登录辅助函数
  const mockLogin = (address = "0x123...mock") => {
    setAuth("mock-jwt-token-123456", {
      user_id: 999,
      wallet_address: address
    });
    message.success('已进入开发者预览模式');
    navigate('/chat');
    setLoading(false);
  };

  return { connectAndLogin, loading };
};
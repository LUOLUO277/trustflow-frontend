import { useState } from 'react';
import { ethers } from 'ethers';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd'; // 假设使用 Ant Design

export const useWeb3Login = () => {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const connectAndLogin = async () => {
    if (!window.ethereum) {
      message.error("请安装 MetaMask 钱包");
      return;
    }

    setLoading(true);
    try {
      // 1. 连接钱包
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // 2. 获取 Nonce
      const { nonce } = await authService.getNonce(address);

      // 3. 钱包签名 (Sign Message)
      const signature = await signer.signMessage(nonce);

      // 4. 后端验证并获取 Token
      const data = await authService.login(address, signature);
      
      // 5. 保存状态并跳转
      setAuth(data.access_token, data.user_info);
      message.success("登录成功");
      navigate('/chat'); // 跳转到创作端

    } catch (error) {
      console.error(error);
      message.error("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return { connectAndLogin, loading };
};
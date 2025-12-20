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
    // 1. 环境检测
    if (!window.ethereum) {
      message.warning('未检测到 MetaMask，请先安装插件！');
      return;
    }

    setLoading(true);
    try {
      // 2. 连接钱包
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      console.log('正在尝试登录地址:', address);

      // 3. 请求后端生成 Nonce (API 1.1)
      // 注意：这里不再有 Mock 降级，如果后端挂了直接 catch 报错
      const { nonce } = await authService.getNonce(address);
      if (!nonce) throw new Error('未能获取有效的签名随机数 (Nonce)');

      // 4. 唤起 MetaMask 进行签名 (Off-chain Signature)
      // 用户会在这里看到小狐狸弹窗
      const signature = await signer.signMessage(nonce);
      console.log('用户签名完成:', signature);

      // 5. 发送签名给后端验证 (API 1.2)
      const data = await authService.login(address, signature);

      // 6. 验证成功，保存 Token
      setAuth(data.access_token, data.user_info);
      message.success('登录验证成功！');
      
      // 7. 跳转主页
      navigate('/chat');

    } catch (error: any) {
      console.error('Login Failed:', error);
      
      // 细化错误处理
      if (error.code === 'ACTION_REJECTED') {
        message.info('您取消了签名操作');
      } else if (error.response) {
        // Axios 错误：后端返回了非 200
        const serverError = error.response.data;
        if (serverError.error === 'signature_invalid') {
          message.error('签名验证失败，请确认是本人操作');
        } else {
          message.error(`登录失败: ${serverError.detail || '服务器异常'}`);
        }
      } else {
        message.error('网络连接错误，请检查后端服务 (Port 8080)');
      }
    } finally {
      setLoading(false);
    }
  };

  return { connectAndLogin, loading };
};
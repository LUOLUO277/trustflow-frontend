import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import LoginPage from './pages/auth/LoginPage';
import ChatPage from './pages/chat/ChatPage'; // 1. 引入你刚才写的真页面
import { useAuthStore } from './store/useAuthStore';

// 路由守卫：检查是否有 Token
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  // 如果没有 Token，重定向回登录页
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. 公开路由：登录页 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. 私有路由：创作端 */}
        <Route 
          path="/chat" 
          element={
            <PrivateRoute>
              {/* 2. 这里不再用 ChatPlaceholder，而是用真正的 ChatPage */}
              <ChatPage />
            </PrivateRoute>
          } 
        />
        
        {/* 3. 默认路由 */}
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
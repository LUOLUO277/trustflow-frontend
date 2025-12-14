import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import ChatPage from './pages/chat/ChatPage'; // FE-1
import KnowledgePage from './pages/knowledge/KnowledgePage'; // FE-2
import VerifyPage from './pages/verify/VerifyPage'; // FE-2
import DashboardPage from './pages/dashboard/DashboardPage'; // FE-2
import { useAuthStore } from './store/useAuthStore';

// 路由守卫组件
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} /> 

        {/* 需要鉴权的路由 (包裹在 Layout 中) */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:sessionId" element={<ChatPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;